// ==========================================
// COMMAND: /bot  (admin-only) — analytics + access
// ==========================================
// Observability layer stage 3: docs/superpowers/specs/2026-08-16-observability-layer-design.md §6. `/bot analytics` is the paged read surface for the event plane stage 2 built (Health/Alerts/ Changes/Usage/Timing). `/bot access` is the admin allowlist, extracted out of /manage's former owner-only `manageadmins` page — see utils/adminAccess.js and handlers/bot.js for the permission gate itself. `/alerts` and `/audit` retire as command names; their panels became pages here (Alerts/Changes), ported with their customId prefixes renamed but their query logic untouched.
//
// This file builds every panel; handlers/bot.js owns all `bot_`-prefixed button/select/modal routing, mirroring the commands/*.js-builds + handlers/*.js-routes split every other admin surface in this bot uses.
//
// 🔴 `/bot access` is NOT gated by a permission token, on purpose — same invariant `manageadmins` always had ("no permission token at all, ever," see utils/adminAccess.js's header): the allowlist page itself is owner-only visibility, checked directly via isOwner() in execute() below and re-checked at every mutation in handlers/bot.js. `/bot analytics` IS token-gated (`hasCommandAccess`, the 'bot' token replacing the retired 'alerts'/'audit' tokens) — any admin analytics ships to should be viewable without being the owner.
const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildPaginationRow } = require('../utils/paginationRow');
const { getAlertSummary, getRecentAlerts, formatUptime } = require('../utils/alertStore');
const { getChangeSummary, getRecentChanges } = require('../utils/changeStore');
const { displayTitle } = require('../utils/alertExplain');
const { hasCommandAccess, isOwner, MANAGE_PAGE_SCOPES, formatPermissions } = require('../utils/adminAccess');
const { mentionCommand } = require('../utils/commandMentions');

const ALERTS_PER_PAGE = 8;
const CHANGES_PER_PAGE = 8;
// Matches utils/alertWebhook.js's LEVEL_ICON — kept in sync by hand (both are tiny, stable maps).
const LEVEL_ICON = { info: '🟢', caution: '🟡', warn: '🟠', error: '🔴' };
// discord.js's Status enum values, hardcoded rather than imported so a library rename can't silently blank this map — Health is meant to survive as "unknown code N" worst case, not throw.
const GATEWAY_STATUS_LABEL = {
    0: '🟢 Ready', 1: '🟡 Connecting', 2: '🟡 Reconnecting', 3: '🟡 Idle', 4: '🟡 Nearly ready',
    5: '🔴 Disconnected', 6: '🟡 Waiting for guilds', 7: '🟡 Identifying', 8: '🟡 Resuming',
};

// Each page's own identity color — Alerts/Changes reuse their retired commands' exact accents (continuity for anyone used to the old panels); Health/Usage/Timing/Access are new.
const PAGE_META = {
    health: { label: '🩺 Health', accent: 0x2FA88E },
    alerts: { label: '🔔 Alerts', accent: 0x546E7A },
    changes: { label: '📒 Changes', accent: 0x6C5DD3 },
    usage: { label: '📊 Usage', accent: 0x4A7FE8 },
    timing: { label: '⏱️ Timing', accent: 0xD98A3D },
};
const ACCESS_ACCENT = 0xB33F40;

function unix(d) { return Math.floor(new Date(d).getTime() / 1000); }
function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function fmtMs(ms) { return ms == null ? '—' : `${Math.round(ms)}ms`; }

function pageSelectRow(current) {
    return {
        type: 1,
        components: [{
            type: 3, custom_id: 'bot_pagesel', placeholder: 'Switch page…',
            options: Object.entries(PAGE_META).map(([key, meta]) => ({ label: meta.label, value: key, default: key === current })),
        }],
    };
}

// ── Health (see docs/superpowers/specs/2026-08-16-observability-layer-design.md §6) ── Cloud Logging/Monitoring reads via ADC arrived in stage 4 (utils/cloudObservability.js), which caches its own result for 60s and never throws — computeHealthStats() awaits it alongside the existing free-to-compute facts (getAlertSummary(), live client.ws/process state, BootRecord counts).
async function computeHealthStats(client) {
    const BootRecord = require('../models/BootRecord');
    const { getHealthCloudStats } = require('../utils/cloudObservability');
    const now = Date.now();
    const since24h = new Date(now - 24 * 3600 * 1000);
    const since7d = new Date(now - 7 * 86400 * 1000);
    const [summary, boots24h, boots7d, lastBoot, cloud] = await Promise.all([
        getAlertSummary(),
        BootRecord.countDocuments({ createdAt: { $gte: since24h } }),
        BootRecord.countDocuments({ createdAt: { $gte: since7d } }),
        BootRecord.findOne().sort({ createdAt: -1 }).lean(),
        getHealthCloudStats(),
    ]);
    return {
        summary, boots24h, boots7d, lastBoot, cloud,
        gatewayStatus: client.ws.status,
        uptimeSec: process.uptime(),
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    };
}

// The three-tier error model the design's §6 calls for: what the Discord alert channel was TOLD (summary.last24h.error, from getAlertSummary() — already existed), what Cloud Logging says actually HAPPENED (cloud.errors24h — new this stage), and the gap between them, which is neither wrong nor redundant: sendAlert()'s 1/min throttle and some errors never reaching an alert threshold both produce real ERROR-severity log lines that were never announced. That gap is the "noise" tier — not noise in the sense of unimportant, but in the sense of "happened quietly, nobody was told."
function errorTiers(summary, cloud) {
    const announced = summary.last24h.error;
    if (!cloud || !cloud.available) return { announced, logged: null, noise: null };
    const logged = cloud.errors24h;
    const noise = Math.max(0, logged - announced);
    return { announced, logged, noise };
}

// A plain-language verdict line before any facts, matching the panel design rule ("Health opens with a single plain-language verdict line ... before any facts"). Not literally alertExplain.js's explain() — that explains one alert TITLE, there is no aggregate-verdict function there to reuse — but the same spirit: state the answer, not just the numbers.
function healthVerdict({ summary }) {
    if (summary.last24h.error > 0) return `🔴 **Something broke in the last 24 hours** — ${summary.last24h.error} error alert(s). See Alerts below.`;
    if (summary.last24h.warn > 0) return `🟡 **Minor hiccups in the last 24 hours** — ${summary.last24h.warn} warning(s), nothing that needed action.`;
    return `🟢 **All systems normal.** No warnings or errors in the last 24 hours.`;
}

function fmtPct(v) { return v == null ? '—' : `${v}%`; }

// CPU/RAM peaks across the trimmed 24h/7d/30d window set (see cloudObservability.js's WINDOWS for why it's three, not vmpeaks.sh's five). One compact code-fenced line per metric keeps this inside the panel design's ~40-column phone-wrap budget instead of a wide table.
function peaksLine(cloud) {
    if (!cloud.available) return `-# Cloud Monitoring unavailable right now (${truncate(cloud.error || 'unknown error', 80)}) — retrying next open.`;
    const { cpu, ram } = cloud.peaks;
    return '```\n'
        + `CPU peak   24h ${fmtPct(cpu['24h']).padStart(6)}   7d ${fmtPct(cpu['7d']).padStart(6)}   30d ${fmtPct(cpu['30d']).padStart(6)}\n`
        + `RAM peak   24h ${fmtPct(ram['24h']).padStart(6)}   7d ${fmtPct(ram['7d']).padStart(6)}   30d ${fmtPct(ram['30d']).padStart(6)}\n`
        + '```';
}

async function buildHealthBody(client) {
    const stats = await computeHealthStats(client);
    const s = stats.summary;
    const line = (t) => `🟢 ${t.info} · 🟡 ${t.caution} · 🟠 ${t.warn} · 🔴 ${t.error}`;
    const lastErr = s.lastError ? `\`${s.lastError.alertId}\` · <t:${unix(s.lastError.createdAt)}:R>` : '_none recorded_ 🟢';
    const gatewayLabel = GATEWAY_STATUS_LABEL[stats.gatewayStatus] ?? `code ${stats.gatewayStatus}`;
    const lastBootTs = stats.lastBoot ? unix(stats.lastBoot.createdAt) : null;
    const tiers = errorTiers(s, stats.cloud);
    const tierLine = tiers.logged == null
        ? `**Errors, last 24h:** ${tiers.announced} announced to Discord`
        : `**Errors, last 24h:** ${tiers.logged} logged · ${tiers.announced} announced${tiers.noise ? ` · ${tiers.noise} logged but never announced (throttled or below threshold)` : ''}`;
    return [
        { type: 10, content: healthVerdict(stats) },
        { type: 14, spacing: 1 },
        { type: 10, content: `**Gateway:** ${gatewayLabel} · **Uptime:** ${formatUptime(stats.uptimeSec)} · **Memory:** ${stats.rssMb}MB` },
        { type: 10, content: `**Restarts:** ${stats.boots24h} (24h) · ${stats.boots7d} (7d)${lastBootTs ? ` — last boot <t:${lastBootTs}:R>` : ''}` },
        // Only rendered when there ARE any -- a permanent "0 hotpatches" row is noise on every panel view.
        ...(client.hotpatches?.length ? [{ type: 10, content: `🩹 **Hotpatched since boot:** ${client.hotpatches.length} · latest \`${client.hotpatches.at(-1).commit}\` <t:${Math.floor(client.hotpatches.at(-1).at.getTime() / 1000)}:R>` }] : []),
        { type: 14, spacing: 1 },
        { type: 10, content: `**Alerts, last 24h:** ${line(s.last24h)}\n**Alerts, last 7d:** ${line(s.last7d)}\n**Last error:** ${lastErr}` },
        { type: 10, content: tierLine },
        { type: 14, spacing: 1 },
        { type: 10, content: `**VM resource peaks**\n${peaksLine(stats.cloud)}` },
    ];
}

// ── Alerts page (ported from the retired commands/alerts.js — query logic unchanged) ──
async function buildAlertsBody({ view = 'main', page = 0 } = {}) {
    if (view === 'explain') return buildAlertsExplainBody();
    const [summary, recent] = await Promise.all([getAlertSummary(), getRecentAlerts({ page, perPage: ALERTS_PER_PAGE })]);
    const line = (t) => `🟢 ${t.info} · 🟡 ${t.caution} · 🟠 ${t.warn} · 🔴 ${t.error}`;
    const lastErr = summary.lastError ? `\`${summary.lastError.alertId}\` · <t:${unix(summary.lastError.createdAt)}:R>` : '_none recorded_ 🟢';
    const body = [
        { type: 10, content: `-# every alert the bot posts to Discord is logged here (${summary.total} total).` },
        { type: 10, content: `**Last 24h:** ${line(summary.last24h)}\n**Last 7d:** ${line(summary.last7d)}\n**Last error:** ${lastErr}` },
        { type: 14, spacing: 2 },
    ];
    if (recent.items.length) {
        const rows = recent.items.map(a =>
            `\`${a.alertId || '??????'}\` ${LEVEL_ICON[a.level] || '⚪'} **${truncate(displayTitle(a.title), 60)}** · <t:${unix(a.createdAt)}:R>`
        ).join('\n');
        body.push({ type: 10, content: `**Recent alerts** (newest first)\n${rows}` });
    } else {
        body.push({ type: 10, content: `**Recent alerts**\n_No alerts recorded yet — nothing has needed one._ 🟢` });
    }
    const pager = buildPaginationRow({
        totalChunks: recent.totalPages, currentPage: recent.page,
        makeCustomId: (p) => `bot_alerts_page_${p}`, indicatorCustomId: 'bot_alerts_pageind',
    });
    if (pager) { body.push({ type: 14, spacing: 1 }); body.push(pager); }
    body.push({ type: 14, spacing: 2 });
    body.push({
        type: 1, components: [
            { type: 2, style: 1, label: '📄 Export Log', custom_id: 'bot_alerts_export' },
            { type: 2, style: 2, label: 'What do alerts mean?', custom_id: 'bot_alerts_explain' },
        ],
    });
    return body;
}

function buildAlertsExplainBody() {
    return [
        {
            type: 10, content:
                `${LEVEL_ICON.info} **Info** — routine / healthy: "Bot online", "Gateway resumed", the daily health check. **Never pings you.**\n`
                + `${LEVEL_ICON.caution} **Caution** — a self-recovering blip: reconnecting to Discord (the gateway websocket dropped, but the bot process itself is fine). **Never pings.**\n`
                + `${LEVEL_ICON.warn} **Warn** — the bot **lost** the gateway connection. **Pings you.**\n`
                + `${LEVEL_ICON.error} **Error** — a crash, uncaught exception, database failure, or shard error. **Pings you.**`,
        },
        { type: 14, spacing: 2 },
        {
            type: 10, content:
                `-# **IDs** are \`MMMDD-NN\` on the UTC day — e.g. \`Jul20-03\` is the 3rd alert on Jul 20. `
                + `Use **Export Log** for the full text record beyond what fits in Discord.`,
        },
        { type: 14, spacing: 2 },
        { type: 1, components: [{ type: 2, style: 2, label: '← Back to alerts', custom_id: 'bot_alerts_back' }] },
    ];
}

// ── Changes page (ported from the retired commands/audit.js — query logic unchanged; page tag for admin-access mutations renamed 'manageadmins' -> 'access' going forward, see handlers/bot.js) ──
const FILTERABLE_PAGES = [...MANAGE_PAGE_SCOPES, 'access', 'announcement'];
const PAGE_LABEL = {
    draws: 'Draws', calendar: 'Calendar', loadouts_mp: 'MP Loadouts', loadouts_dmz: 'DMZ Loadouts',
    patchnotes: 'Patch Notes', seasondraft: 'Next Season Draft', season: 'Season Titles/Wipe',
    announcement: 'Announcement', access: 'Bot Access', manageadmins: 'Manage Admins (legacy)',
};
function encodeState(pf, af) { return `${pf || ''}~${af || ''}`; }
function decodeState(rest) { const [pf, af] = (rest || '~').split('~'); return { filterPage: pf || null, filterActor: af || null }; }

async function buildChangesBody({ page = 0, filterPage = null, filterActor = null } = {}) {
    const [summary, recent] = await Promise.all([
        getChangeSummary(),
        getRecentChanges({ page, perPage: CHANGES_PER_PAGE, filterPage, filterActor }),
    ]);
    const state = encodeState(filterPage, filterActor);
    const lastChg = summary.lastChange
        ? `\`${summary.lastChange.changeId}\` · ${truncate(summary.lastChange.summary, 60)} · <t:${unix(summary.lastChange.createdAt)}:R>`
        : '_none recorded_';
    const filterLine = (filterPage || filterActor)
        ? `-# Filtered: ${filterPage ? `page **${PAGE_LABEL[filterPage] || filterPage}**` : ''}${filterPage && filterActor ? ' · ' : ''}${filterActor ? `actor <@${filterActor}>` : ''}`
        : null;

    const body = [
        { type: 10, content: `-# every DB-mutating \`/manage\` action (and admin-access change) is recorded here (${summary.total} total).` },
        ...(filterLine ? [{ type: 10, content: filterLine }] : []),
        { type: 10, content: `**Last 24h:** ${summary.last24h} change(s)\n**Last 7d:** ${summary.last7d} change(s)\n**Most recent:** ${lastChg}` },
        { type: 14, spacing: 2 },
    ];
    if (recent.items.length) {
        const rows = recent.items.map(c =>
            `\`${c.changeId || '??????'}\` **${truncate(c.summary || `${c.action} on ${c.page}`, 70)}**${c.undone ? ' ↩️' : ''}\n-# ${PAGE_LABEL[c.page] || c.page || '?'} · <@${c.actorId}> · <t:${unix(c.createdAt)}:R>`
        ).join('\n');
        body.push({ type: 10, content: `**Recent changes** (newest first)\n${rows}` });
    } else {
        body.push({ type: 10, content: `**Recent changes**\n_No changes recorded yet${(filterPage || filterActor) ? ' matching this filter' : ''}._` });
    }
    const pager = buildPaginationRow({
        totalChunks: recent.totalPages, currentPage: recent.page,
        makeCustomId: (p) => `bot_changes_page_${p}~${state}`, indicatorCustomId: `bot_changes_pageind~${state}`,
    });
    if (pager) { body.push({ type: 14, spacing: 1 }); body.push(pager); }

    const pageOptions = [
        { label: 'All pages', value: '__all__', default: !filterPage },
        ...FILTERABLE_PAGES.map(p => ({ label: PAGE_LABEL[p] || p, value: p, default: filterPage === p })),
    ];
    body.push({ type: 14, spacing: 2 });
    body.push({ type: 1, components: [{ type: 3, custom_id: `bot_changes_filterpage~${filterActor || ''}`, placeholder: 'Filter by page…', options: pageOptions }] });

    const actionButtons = [
        { type: 2, style: 1, label: '👤 Filter by Actor', custom_id: `bot_changes_filteractor~${filterPage || ''}` },
        { type: 2, style: 1, label: '📄 Export Log', custom_id: `bot_changes_export~${state}` },
    ];
    if (filterPage || filterActor) actionButtons.push({ type: 2, style: 2, label: 'Clear Filters', custom_id: 'bot_changes_clearfilters' });
    body.push({ type: 1, components: actionButtons });
    return body;
}

// ── Usage page — live aggregation against AnalyticsEvent (stage 2's collection); no roll-ups exist yet (stage 4), so this queries raw rows directly, matching the design's own note that recent-window questions don't need roll-ups. Product stats only (isAdmin: false). ──
async function computeUsageStats() {
    const AnalyticsEvent = require('../models/AnalyticsEvent');
    const now = Date.now();
    const since7d = new Date(now - 7 * 86400 * 1000);
    const sincePrev7d = new Date(now - 14 * 86400 * 1000);
    const [current, previous, byCommand, byEntry, byOutcome] = await Promise.all([
        AnalyticsEvent.countDocuments({ createdAt: { $gte: since7d }, isAdmin: false }),
        AnalyticsEvent.countDocuments({ createdAt: { $gte: sincePrev7d, $lt: since7d }, isAdmin: false }),
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d }, isAdmin: false } },
            { $group: { _id: '$command', c: { $sum: 1 } } }, { $sort: { c: -1 } }, { $limit: 8 },
        ]),
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d }, isAdmin: false } },
            { $group: { _id: '$entry', c: { $sum: 1 } } }, { $sort: { c: -1 } },
        ]),
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d }, isAdmin: false } },
            { $group: { _id: '$outcome', c: { $sum: 1 } } }, { $sort: { c: -1 } },
        ]),
    ]);
    return { current, previous, byCommand, byEntry, byOutcome };
}

async function buildUsageBody() {
    const { current, previous, byCommand, byEntry, byOutcome } = await computeUsageStats();
    const pctChange = previous > 0 ? Math.round(((current - previous) / previous) * 100) : (current > 0 ? 100 : 0);
    const changeStr = (previous === 0 && current === 0) ? '' : ` (${pctChange >= 0 ? '+' : ''}${pctChange}% vs previous 7d)`;
    const cmdLines = byCommand.length ? byCommand.map((c, i) => `${i + 1}. **/${c._id || '?'}** — ${c.c}`).join('\n') : '_no data yet_';
    const entryLine = byEntry.length ? byEntry.map(e => `${e._id || '?'}: ${e.c}`).join(' · ') : '_no data yet_';
    const outcomeLine = byOutcome.length ? byOutcome.map(o => `${o._id || '?'}: ${o.c}`).join(' · ') : '_no data yet_';
    return [
        { type: 10, content: `**${current.toLocaleString()} interactions** · last 7 days${changeStr}` },
        { type: 14, spacing: 1 },
        { type: 10, content: `**Top commands**\n${cmdLines}` },
        { type: 14, spacing: 1 },
        { type: 10, content: `**Entry point:** ${entryLine}` },
        { type: 10, content: `**Outcome:** ${outcomeLine}` },
        { type: 14, spacing: 1 },
        { type: 10, content: `-# Admin surfaces (/manage, /bot, /autobuild) are excluded from these figures.` },
        { type: 14, spacing: 1 },
        { type: 1, components: [{ type: 2, style: 1, label: '📄 Export', custom_id: 'bot_usage_export' }] },
    ];
}

function fmtUtc(d) { return d ? new Date(d).toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC') : '?'; }

// Matches buildAlertExport()/buildChangeExport()'s downloadable-.txt shape — the fuller record beyond what fits in the panel, same convention every export button in this command uses.
async function buildUsageExport() {
    const { current, previous, byCommand, byEntry, byOutcome } = await computeUsageStats();
    const lines = [
        `Dioreo — usage export`,
        `Generated: ${fmtUtc(new Date())}`,
        `Window: last 7 days · previous 7 days: ${previous.toLocaleString()} · current: ${current.toLocaleString()}`,
        `(Admin surfaces excluded.)`,
        '='.repeat(72), '',
        'Top commands:',
        ...(byCommand.length ? byCommand.map((c, i) => `  ${i + 1}. /${c._id || '?'} — ${c.c}`) : ['  (no data yet)']),
        '',
        'Entry point breakdown:',
        ...(byEntry.length ? byEntry.map(e => `  ${e._id || '?'}: ${e.c}`) : ['  (no data yet)']),
        '',
        'Outcome breakdown:',
        ...(byOutcome.length ? byOutcome.map(o => `  ${o._id || '?'}: ${o.c}`) : ['  (no data yet)']),
    ];
    return lines.join('\n');
}

// ── Timing page — p50/p95 via Mongo's $percentile (MongoDB 8.0+, confirmed on this cluster). ──
async function computeTimingStats() {
    const AnalyticsEvent = require('../models/AnalyticsEvent');
    const since7d = new Date(Date.now() - 7 * 86400 * 1000);
    const [overallRows, byCommand, byDep] = await Promise.all([
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d } } },
            { $group: {
                _id: null,
                ackP: { $percentile: { input: '$ackMs', p: [0.5, 0.95], method: 'approximate' } },
                durP: { $percentile: { input: '$durationMs', p: [0.5, 0.95], method: 'approximate' } },
            } },
        ]),
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d }, durationMs: { $ne: null } } },
            { $group: { _id: '$command', p: { $percentile: { input: '$durationMs', p: [0.95], method: 'approximate' } }, n: { $sum: 1 } } },
            { $sort: { n: -1 } }, { $limit: 6 },
        ]),
        AnalyticsEvent.aggregate([
            { $match: { createdAt: { $gte: since7d }, deps: { $exists: true, $ne: [] } } },
            { $unwind: '$deps' },
            { $group: { _id: '$deps.name', totalMs: { $sum: '$deps.ms' }, calls: { $sum: '$deps.calls' } } },
            { $sort: { totalMs: -1 } }, { $limit: 6 },
        ]),
    ]);
    return { overall: overallRows[0] || null, byCommand, byDep };
}

async function buildTimingBody() {
    const { overall, byCommand, byDep } = await computeTimingStats();
    const ackP = overall?.ackP || [null, null];
    const durP = overall?.durP || [null, null];
    const cmdLines = byCommand.length
        ? byCommand.map(c => `**/${c._id || '?'}** — p95 ${fmtMs(c.p?.[0])} (${c.n} sample${c.n === 1 ? '' : 's'})`).join('\n')
        : '_no data yet_';
    const depLines = byDep.length
        ? byDep.map(d => `**${d._id}** — ${d.calls} call(s), ${Math.round(d.totalMs).toLocaleString()}ms total`).join('\n')
        : '_no external dependency calls recorded yet_';
    return [
        { type: 10, content: `**Ack time (p50/p95):** ${fmtMs(ackP[0])} / ${fmtMs(ackP[1])} — against Discord's 3,000ms deadline` },
        { type: 10, content: `**Total duration (p50/p95):** ${fmtMs(durP[0])} / ${fmtMs(durP[1])}` },
        { type: 14, spacing: 1 },
        { type: 10, content: `**Slowest commands (p95 duration, last 7d)**\n${cmdLines}` },
        { type: 14, spacing: 1 },
        { type: 10, content: `**Dependency time, last 7 days**\n${depLines}` },
        { type: 14, spacing: 1 },
        { type: 1, components: [{ type: 2, style: 1, label: '📄 Export', custom_id: 'bot_timing_export' }] },
    ];
}

async function buildTimingExport() {
    const { overall, byCommand, byDep } = await computeTimingStats();
    const ackP = overall?.ackP || [null, null];
    const durP = overall?.durP || [null, null];
    const lines = [
        `Dioreo — timing export`,
        `Generated: ${fmtUtc(new Date())}`,
        `Window: last 7 days`,
        '='.repeat(72), '',
        `Ack time p50/p95: ${fmtMs(ackP[0])} / ${fmtMs(ackP[1])} (Discord's 3,000ms deadline)`,
        `Total duration p50/p95: ${fmtMs(durP[0])} / ${fmtMs(durP[1])}`,
        '',
        'Slowest commands (p95 duration):',
        ...(byCommand.length ? byCommand.map(c => `  /${c._id || '?'} — p95 ${fmtMs(c.p?.[0])} (${c.n} samples)`) : ['  (no data yet)']),
        '',
        'Dependency time totals:',
        ...(byDep.length ? byDep.map(d => `  ${d._id} — ${d.calls} calls, ${Math.round(d.totalMs).toLocaleString()}ms total`) : ['  (no external dependency calls recorded yet)']),
    ];
    return lines.join('\n');
}

// Shared render entry point — used by execute() (slash) AND handlers/bot.js's re-render branches, so there's one render path, not a drifting copy per page (same convention /alerts and /audit each already followed on their own).
async function buildAnalyticsPanel({ page = 'health', client, alertsState = {}, changesState = {} } = {}) {
    const meta = PAGE_META[page] || PAGE_META.health;
    let body;
    if (page === 'alerts') body = await buildAlertsBody(alertsState);
    else if (page === 'changes') body = await buildChangesBody(changesState);
    else if (page === 'usage') body = await buildUsageBody();
    else if (page === 'timing') body = await buildTimingBody();
    else body = await buildHealthBody(client);

    return [{
        type: 17,
        accent_color: meta.accent,
        components: [
            { type: 10, content: `## ${meta.label}` },
            { type: 14, spacing: 2 },
            pageSelectRow(page),
            { type: 14, spacing: 2 },
            ...body,
        ],
    }];
}

// ── Access page — the admin allowlist, extracted from /manage's former owner-only `manageadmins` page. Card rendering (buildAdminListBlocks) and both modal builders moved here verbatim from commands/manage.js; only their custom_ids changed prefix (mng_admin_/modal_admin_ -> bot_admin_/bot_adminmodal_), matching /bot's single owned prefix. ──
async function buildAdminListBlocks(adminDocs, client) {
    if (!adminDocs || adminDocs.length === 0) {
        return [{ type: 10, content: `**No additional admins granted.** Only the bot owner has admin access right now. Use Grant Admin below to add someone.` }];
    }
    const blocks = [];
    for (let i = 0; i < adminDocs.length; i++) {
        const a = adminDocs[i];
        let avatarUrl = null;
        try {
            const user = await client.users.fetch(a.discordId);
            avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
        } catch (fetchError) {
            console.error(`Failed to fetch Discord user ${a.discordId} for Bot Access card:`, fetchError?.message || fetchError);
        }
        const grantedTs = unix(a.grantedAt);
        const content = `### <@${a.discordId}>\n-# ID: \`${a.discordId}\` — granted by <@${a.grantedBy}> <t:${grantedTs}:R>\n**Permissions:** ${formatPermissions(a.permissions)}\n**Note:** ${a.note || '*(none)*'}`;
        blocks.push(avatarUrl
            ? { type: 9, components: [{ type: 10, content }], accessory: { type: 11, media: { url: avatarUrl } } }
            : { type: 10, content });
        blocks.push({
            type: 1, components: [
                { type: 2, style: 1, label: 'Edit Permissions', custom_id: `bot_admin_editperms_${a.discordId}` },
                { type: 2, style: 4, label: 'Revoke', custom_id: `bot_admin_revoke_${a.discordId}` },
            ],
        });
        if (i < adminDocs.length - 1) blocks.push({ type: 14, spacing: 1, divider: true });
    }
    return blocks;
}

function buildAdminGrantModal() {
    const modal = new ModalBuilder().setCustomId('bot_adminmodal_grant').setTitle('Grant Admin Access');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('discord_id').setLabel('Discord User ID or @mention').setStyle(TextInputStyle.Short).setPlaceholder('e.g. 123456789012345678 or @username').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('permissions').setLabel('Permissions').setStyle(TextInputStyle.Paragraph).setPlaceholder('all | manage | bot | autobuild | manage.calendar, manage.draws, ...').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('note').setLabel('Note (optional)').setStyle(TextInputStyle.Short).setPlaceholder('e.g. their name, why they were granted').setRequired(false)),
    );
    return modal;
}

function buildAdminEditPermissionsModal(adminDoc) {
    const modal = new ModalBuilder().setCustomId(`bot_adminmodal_editperms_${adminDoc.discordId}`).setTitle('Edit Permissions');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('permissions').setLabel('Permissions').setStyle(TextInputStyle.Paragraph).setPlaceholder('all | manage | bot | autobuild | manage.calendar, manage.draws, ...').setValue((adminDoc.permissions || []).join(', ')).setRequired(true)),
    );
    return modal;
}

async function buildAccessPanel(client) {
    const AdminUser = require('../models/AdminUser');
    const adminDocs = await AdminUser.find({}).sort({ grantedAt: 1 }).lean();
    const adminListBlocks = await buildAdminListBlocks(adminDocs, client);
    return [{
        type: 17,
        accent_color: ACCESS_ACCENT,
        components: [
            { type: 10, content: `## 🔑 Bot Access` },
            { type: 10, content: `-# Owner-only · the runtime-editable admin allowlist that supplements the hardcoded owner.` },
            { type: 14, spacing: 2 },
            ...adminListBlocks,
            { type: 14, spacing: 2 },
            { type: 1, components: [
                { type: 2, style: 3, label: 'Grant Admin', custom_id: 'bot_admin_grant' },
                { type: 2, style: 2, label: 'Guide', custom_id: 'bot_admin_guide' },
            ] },
        ],
    }];
}

// Renders one of four outcomes. The refusal cases carry the two buttons Harkirat asked for -- "refuse and say so AND *offer* to full restart or exit" -- so a refusal is never a dead end.
function buildHotpatchPanel(out) {
    const { plan, result, commit, changed } = out;
    const body = [];
    const head = t => body.push({ type: 10, content: t });

    if (!changed.length && !plan.members.length) {
        head(`### 🩹 Nothing to patch\nThe working tree is already at \`${commit.slice(0, 7)}\` — the running process is up to date.`);
        return [{ type: 17, accent_color: 0x5865F2, components: body }];
    }
    head(`### 🩹 Hotpatch · \`${commit.slice(0, 7)}\`\n**${changed.length}** changed runtime file(s), **${plan.members.length}** module(s) in the reload closure.`);

    if (plan.verdict === 'ALLOW' && result?.ok) {
        head(`✅ **Applied.** No restart, no gateway reconnect.\n${result.applied.map(f => `• \`${f}\``).join('\n')}`);
        return [{ type: 17, accent_color: 0x57F287, components: body }];
    }
    if (plan.verdict === 'ALLOW' && !result) {
        head(`🔍 **Dry run — nothing changed.** These would reload:\n${plan.members.map(f => `• \`${f}\``).join('\n')}`);
        return [{ type: 17, accent_color: 0x5865F2, components: body }];
    }
    if (plan.verdict === 'REFUSE_STRUCTURAL') {
        head(`⛔ **Can't hotpatch this — a full restart is required.**\n${plan.escaped.map(f => `• \`${f}\` — owns process lifecycle or is a Mongoose model`).join('\n')}${plan.unresolved?.length ? `\n\nNot a runtime module (deleted by the pull, or a typo): ${plan.unresolved.map(f => `\`${f}\``).join(', ')}` : ''}${plan.stray?.length ? `\n\nYou named ${plan.stray.map(f => `\`${f}\``).join(', ')}, which the pull did not change.` : ''}\n\nThis is permanent for these files, not a missing feature.`);
    } else if (plan.verdict === 'REFUSE_STATE') {
        head(`⚠️ **Refused — live state in the reload closure.**\n${Object.entries(plan.blocked).map(([f, r]) => `• \`${f}\` — ${r.join(', ')}`).join('\n')}\n\nEach of these can opt in later with a \`__hotSwap\` contract. Until then a restart is the honest option.`);
    } else if (result && !result.ok) {
        head(`❌ **Nothing was applied.**\n\`\`\`\n${String(result.error).slice(0, 800)}\n\`\`\`\nThe process is still running the code it had.`);
    }
    body.push({ type: 1, components: [
        { type: 2, style: 4, custom_id: 'bot_hp_restart', label: 'Full restart', emoji: { name: '♻️' } },
        { type: 2, style: 2, custom_id: 'bot_hp_cancel', label: 'Cancel' },
    ] });
    return [{ type: 17, accent_color: 0xFEE75C, components: body }];
}

module.exports = {
    buildAnalyticsPanel,
    buildAccessPanel,
    buildHotpatchPanel,
    buildUsageExport,
    buildTimingExport,
    buildAdminListBlocks,
    buildAdminGrantModal,
    buildAdminEditPermissionsModal,
    // PAGE_META/FILTERABLE_PAGES/PAGE_LABEL/encodeState removed from exports (v3-pre-release review, finding #47) -- confirmed dead as CROSS-MODULE exports (nothing anywhere destructures them off require('../commands/ bot')), while decodeState beside them is genuinely imported by handlers/bot.js, which is what made the dead half easy to miss. All four stay as internal consts/functions -- this file uses every one of them itself.
    decodeState,

    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription("Dioreo's own analytics and admin access management")
        .setDefaultMemberPermissions(0)
        // ADMIN-ONLY, same reasoning as /manage/autobuild: stays user-install [1] deliberately — an admin command advertised in every server's command list is noise plus needless surface.
        .setIntegrationTypes([1]).setContexts([0, 1, 2])
        .addSubcommand(sub => sub.setName('analytics').setDescription("View the bot's usage, timing and health data")
            .addStringOption(o => o.setName('page').setDescription('Jump directly to a page (defaults to Health)').addChoices(
                { name: 'Health', value: 'health' }, { name: 'Alerts', value: 'alerts' }, { name: 'Changes', value: 'changes' },
                { name: 'Usage', value: 'usage' }, { name: 'Timing', value: 'timing' },
            ))
            .addStringOption(o => o.setName('visibility').setDescription('Show this panel only to you, or publicly to everyone in the chat. (Defaults to only you.)').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })))
        .addSubcommand(sub => sub.setName('access').setDescription('View and manage the admin allowlist (owner-only)')
            .addStringOption(o => o.setName('visibility').setDescription('Show this panel only to you, or publicly to everyone in the chat. (Defaults to only you.)').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })))
        .addSubcommand(sub => sub.setName('hotpatch').setDescription('Reload changed files into the running bot without a restart (owner-only)')
            .addBooleanOption(o => o.setName('pull').setDescription('git pull first (default: yes)'))
            .addBooleanOption(o => o.setName('dry_run').setDescription('Show the plan and change nothing'))
            .addStringOption(o => o.setName('file').setDescription('Limit to one changed file (default: everything the pull brought in)').setAutocomplete(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'access') {
            if (!isOwner(interaction.user.id)) {
                return interaction.reply({ content: '🔒 **Only the bot owner can manage the admin list.**', ephemeral: true });
            }
            const visibilityChoice = interaction.options.getString('visibility');
            const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
            await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
            return sendV2Payload(interaction, await buildAccessPanel(interaction.client));
        }

        if (sub === 'hotpatch') {
            // isOwner ONLY -- this runs new code in the process. The 'bot' token is grantable to any admin.
            if (!isOwner(interaction.user.id)) {
                return interaction.reply({ content: '🔒 **Only the bot owner can hotpatch.** This one loads new code into the running process.', ephemeral: true });
            }
            await interaction.deferReply({ flags: 64 });   // always ephemeral; this is never a public panel
            const { runHotpatch } = require('../utils/hotpatch');
            const out = await runHotpatch({
                client: interaction.client,
                files: [interaction.options.getString('file')].filter(Boolean),
                pull: interaction.options.getBoolean('pull') ?? true,
                dryRun: interaction.options.getBoolean('dry_run') ?? false,
            });
            return sendV2Payload(interaction, buildHotpatchPanel(out));
        }

        // analytics
        if (!(await hasCommandAccess(interaction.user.id, 'bot'))) {
            return interaction.reply({ content: `🔒 **This one's admin-only.** ${mentionCommand(interaction.client, '/bot analytics')} shows the bot's own usage and health data — try any of the bot's public commands instead!`, ephemeral: true });
        }
        const page = interaction.options.getString('page') || 'health';
        const visibilityChoice = interaction.options.getString('visibility');
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
        await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        return sendV2Payload(interaction, await buildAnalyticsPanel({ page, client: interaction.client }));
    },
};
