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
const { hasCommandAccess, isOwner, formatPermissions } = require('../utils/adminAccess');
const { mentionCommand } = require('../utils/commandMentions');
const emojis = require('../utils/emojiMap');

const ALERTS_PER_PAGE = 3;
// REDUCED 8 -> 3 (bot analytics redesign, 2026-08-23 00:39 EDT): Alerts is a glance now -- the pager and full log moved to the portal. ⚠️ REDUCED 8 -> 5 (portal core Task 7, 2026-08-21 00:04 EDT): each row now renders its own Revert button (core/revert.js) — a Text Display + Action Row + Button per change instead of one line in a shared block. Measured: 8 rows + filters + a mid-pagination pager totalled 45 recursive components, over Components V2's 40-per-message cap (root CLAUDE.md's platform cheat-sheet) — a real production crash risk, not a style concern. 5 rows measured 38 in the same worst case; verified before shipping, not estimated.
const CHANGES_PER_PAGE = 5;
// Matches utils/alertWebhook.js's LEVEL_ICON — kept in sync by hand (both are tiny, stable maps).
const LEVEL_ICON = { info: '🟢', caution: '🟡', warn: '🟠', error: '🔴' };
// discord.js's Status enum values, hardcoded rather than imported so a library rename can't silently blank this map — Health is meant to survive as "unknown code N" worst case, not throw.
const GATEWAY_STATUS_LABEL = {
    0: '🟢 Ready', 1: '🟡 Connecting', 2: '🟡 Reconnecting', 3: '🟡 Idle', 4: '🟡 Nearly ready',
    5: '🔴 Disconnected', 6: '🟡 Waiting for guilds', 7: '🟡 Identifying', 8: '🟡 Resuming',
};

// Each page's own identity color — Alerts/Changes reuse their retired commands' exact accents (continuity for anyone used to the old panels); Health/Usage/Timing/Access are new.
const PAGE_META = {
    health: { label: '🩺 Health', accent: 0x2FA88E, question: 'Is the bot okay right now?' },
    alerts: { label: '🔔 Alerts', accent: 0x546E7A, question: 'What has gone wrong, and when' },
    changes: { label: '📒 Changes', accent: 0x6C5DD3, question: 'Who edited what — and undo it' },
    usage: { label: '📊 Usage', accent: 0x4A7FE8, question: 'What people actually use' },
    timing: { label: '⏱️ Timing', accent: 0xD98A3D, question: 'Where the time goes' },
};
const ACCESS_ACCENT = 0xB33F40;
// Every analytics page ends with this. Discord is the glance; the portal is the depth (see the spec's rule 0). Route matches portal/ui/app.js's hash-based router (`location.hash`, keyed by realm name in REALM_COMPONENTS).
const PORTAL_ANALYTICS_URL = 'https://portal.dioreo.app/#/analytics';

// ── ANSI inside code fences ── Discord renders a ```ansi fence with a SMALL subset of SGR: styles 0/1/4, foreground 30-37, background 40-47. No 256-colour, no truecolour, no hex -- anything outside that set renders as the literal escape text, so this map is the entire palette these panels may spend. ⚠️ It degrades UGLY, not gracefully: a client without ansi support shows `[0;32m` inline. Confirmed rendering on desktop + current mobile; `/bot analytics` is admin-only, so the blast radius is one viewer. 🔴 GRAY (fg 30) IS GENUINELY DARK on the dark code-block background -- never put information in it. It is used here only for the EMPTY cells of a bar, where receding is the point, and every such row still prints its literal number so colour is never the sole carrier.
const ANSI = {
    reset: '\u001b[0m',
    gray: '\u001b[0;30m',
    red: '\u001b[0;31m',
    green: '\u001b[0;32m',
    yellow: '\u001b[0;33m',
    cyan: '\u001b[0;36m',
    bold: '\u001b[1;37m',
};
const ansiBlock = (lines) => '```ansi\n' + lines.join('\n') + '\n```';
// Strips every SGR sequence -- the only honest way to measure a rendered row against the ~40-column phone budget, since the escapes cost bytes and zero columns.
const visibleWidth = (line) => line.replace(/\u001b\[[0-9;]*m/g, '').length;

// A bar whose FILLED cells carry a colour and whose empty cells recede. `cells` is fixed so every bar in a block is the same length -- the comparison lives in the fill, and a variable-length bar compares nothing.
function ansiBar(value, max, cells, colour) {
    const filled = Math.max(1, Math.min(cells, Math.round((value / (max || 1)) * cells)));
    return `${colour}${'█'.repeat(filled)}${ANSI.gray}${'░'.repeat(cells - filled)}${ANSI.reset}`;
}

function unix(d) { return Math.floor(new Date(d).getTime() / 1000); }
function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function fmtMs(ms) { return ms == null ? '—' : `${Math.round(ms)}ms`; }

function pageSelectRow(current) {
    return {
        type: 1,
        components: [{
            type: 3, custom_id: 'bot_pagesel', placeholder: 'Switch page…',
            options: Object.entries(PAGE_META).map(([key, meta]) => ({
                label: meta.label, value: key, description: meta.question, default: key === current,
            })),
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

// One aligned monospace block rather than four prose rows. Same ~40-column budget peaksLine() already works inside -- a phone wraps a long "**Gateway:** ... · **Uptime:** ... · **Memory:** ..." line into an unreadable ribbon, and padEnd is what stops that.
function buildVitalsBlock({ gatewayStatus, uptimeSec, rssMb, boots24h, boots7d }) {
    const rows = [
        ['Gateway', GATEWAY_STATUS_LABEL[gatewayStatus] ?? `code ${gatewayStatus}`],
        ['Uptime', formatUptime(uptimeSec)],
        ['Memory', `${rssMb}MB`],
        ['Restarts', `${boots24h} in 24h · ${boots7d} in 7d`],
    ];
    // Pad LABEL+COLON as ONE unit, so the VALUE column is what lines up. ⚠️ An earlier draft padded the bare label and appended ': ' after it, to satisfy a test asserting every colon sat at the same offset -- that pins the colons but leaves them floating off the short labels (`Gateway :` beside `Restarts:`), which is what shipped and what Harkirat saw. The colon belongs to its word; the values are what an eye actually scans down. The test now asserts the VALUE column instead.
    const pad = Math.max(...rows.map(([k]) => k.length)) + 2;
    return ansiBlock(rows.map(([k, v]) => `${(k + ':').padEnd(pad)}${ANSI.bold}${v}${ANSI.reset}`));
}

async function buildHealthBody(client) {
    const stats = await computeHealthStats(client);
    const s = stats.summary;
    const line = (t) => `🟢 ${t.info} · 🟡 ${t.caution} · 🟠 ${t.warn} · 🔴 ${t.error}`;
    const lastErr = s.lastError ? `\`${s.lastError.alertId}\` · <t:${unix(s.lastError.createdAt)}:R>` : '_none recorded_ 🟢';
    const lastBootTs = stats.lastBoot ? unix(stats.lastBoot.createdAt) : null;
    const tiers = errorTiers(s, stats.cloud);
    const tierLine = tiers.logged == null
        ? `**Errors, last 24h:** ${tiers.announced} announced to Discord`
        : `**Errors, last 24h:** ${tiers.logged} logged · ${tiers.announced} announced${tiers.noise ? ` · ${tiers.noise} logged but never announced (throttled or below threshold)` : ''}`;
    return [
        { type: 10, content: healthVerdict(stats) },
        { type: 14, spacing: 1 },
        { type: 10, content: buildVitalsBlock(stats) },
        // Only rendered when there ARE any -- a permanent "0 hotpatches" row is noise on every panel view.
        ...(client.hotpatches?.length ? [{ type: 10, content: `🩹 **Hotpatched since boot:** ${client.hotpatches.length} · latest \`${client.hotpatches.at(-1).commit}\` <t:${Math.floor(client.hotpatches.at(-1).at.getTime() / 1000)}:R>` }] : []),
        ...(lastBootTs ? [{ type: 10, content: `-# last boot <t:${lastBootTs}:R>` }] : []),
        { type: 14, spacing: 1 },
        { type: 10, content: `**Alerts, last 24h:** ${line(s.last24h)}\n**Alerts, last 7d:** ${line(s.last7d)}\n**Last error:** ${lastErr}` },
        { type: 10, content: tierLine },
        { type: 14, spacing: 1 },
        { type: 10, content: `**VM resource peaks**\n${peaksLine(stats.cloud)}` },
    ];
}

// ── Alerts page (ported from the retired commands/alerts.js — query logic unchanged) ── Keeps the severity ledger line -- already this page's signature, no other page has one -- and the LEVEL_ICON-led row shape, which is the per-row colour coding that distinguishes Alerts from Changes (must NOT gain per-row buttons). Cut to the 3 most recent (ALERTS_PER_PAGE 8 -> 3); the pager and Export moved to the portal.
const ALERTS_EMPTY = '**Nothing has gone wrong.**\n-# Alerts land here when the bot crashes, loses its gateway connection, or hits a database error. An empty list is the healthy state.';

async function buildAlertsBody({ view = 'main' } = {}) {
    if (view === 'explain') return buildAlertsExplainBody();
    const [summary, recent] = await Promise.all([getAlertSummary(), getRecentAlerts({ page: 0, perPage: ALERTS_PER_PAGE })]);
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
        body.push({ type: 10, content: `**Recent alerts**\n${ALERTS_EMPTY}` });
    }
    body.push({ type: 14, spacing: 2 });
    body.push({
        type: 1, components: [
            { type: 2, style: 2, label: 'What do alerts mean?', custom_id: 'bot_alerts_explain' },
            { type: 2, style: 5, label: 'Full history in the portal', url: PORTAL_ANALYTICS_URL },
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

// ── Changes page (ported from the retired commands/audit.js — query logic unchanged; page tag for admin-access mutations renamed 'manageadmins' -> 'access' going forward, see handlers/bot.js) ── FILTERABLE_PAGES/encodeState/decodeState retired (bot analytics redesign, 2026-08-23 00:32 EDT) -- the page/actor filters they served moved to the portal; nothing in this file or handlers/bot.js calls them any more.
const PAGE_LABEL = {
    draws: 'Draws', calendar: 'Calendar', loadouts_mp: 'MP Loadouts', loadouts_dmz: 'DMZ Loadouts',
    patchnotes: 'Patch Notes', seasondraft: 'Next Season Draft', season: 'Season Titles/Wipe',
    announcement: 'Announcement', access: 'Bot Access', manageadmins: 'Manage Admins (legacy)',
};

// One SECTION per change, with Revert as the row's own accessory -- rather than a Text Display followed by a full-width Action Row. Component cost is IDENTICAL (9+10+2 vs 10+1+2 = 3 either way; the first draft of the spec wrongly claimed a saving, see its audit log), so this is bought purely for identity: Changes becomes the only page whose rows carry a control, which is exactly what distinguishes it from Alerts' rows. Section+Button accessory confirmed via Discord's own API schema -- see Task 2's note in the plan.
function buildChangesRows(items) {
    const { canRevert } = require('../core/revert');
    return items.map(c => {
        const gate = canRevert(c);
        const reason = c.undone ? '' : (gate.ok ? '' : `\n-# _${gate.reason}_`);
        return {
            type: 9,
            components: [{ type: 10, content:
                `\`${c.changeId || '??????'}\` **${truncate(c.summary || `${c.action} on ${c.page}`, 70)}**${c.undone ? ' ↩️' : ''}`
                + `\n-# ${PAGE_LABEL[c.page] || c.page || '?'} · <@${c.actorId}> · <t:${unix(c.createdAt)}:R>${reason}` }],
            accessory: { type: 2, style: 2, label: 'Revert', custom_id: `bot_revert_${c.changeId}`, disabled: !gate.ok },
        };
    });
}

// There is no filtered variant any more -- filters move to the portal -- so this has exactly one cause and says it plainly.
const CHANGES_EMPTY = '**No edits in this window.**\n-# Every `/manage` save writes a row here with who made it and a one-click Revert. Make a change and it appears immediately.';

async function buildChangesBody() {
    const [summary, recent] = await Promise.all([
        getChangeSummary(),
        getRecentChanges({ page: 0, perPage: CHANGES_PER_PAGE }),
    ]);
    // Alerts and Changes both used to render "**Last 24h:** N" in the same position at the same weight, so the eye read two identical rows even though the nouns differed. A ledger states WHO and WHAT; a severity breakdown (Alerts) states HOW BAD. Different information, therefore different shapes. getChangeSummary() does not return an undoneCount today -- this plan touches no stores, so that clause is simply omitted rather than added.
    const ledgerLine = `**${summary.last24h}** edit(s) today · **${summary.last7d}** this week`;

    const body = [
        { type: 10, content: `-# every DB-mutating \`/manage\` action (and admin-access change) is recorded here (${summary.total} total).` },
        { type: 10, content: ledgerLine },
        { type: 14, spacing: 2 },
    ];
    if (recent.items.length) {
        body.push({ type: 10, content: '**Recent changes** (newest first)' });
        body.push(...buildChangesRows(recent.items));
    } else {
        body.push({ type: 10, content: CHANGES_EMPTY });
    }
    body.push({ type: 14, spacing: 2 });
    body.push({ type: 1, components: [{ type: 2, style: 5, label: 'Full history in the portal', url: PORTAL_ANALYTICS_URL }] });
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

const BAR_CELLS = 10;
// Proportional to the TOP command, not to the total: with 8 commands, share-of-total bars are all near-empty and compare nothing. Against the leader, the shape of the distribution is readable. The bar is fixed-width and the NAME truncates -- the bar is the only part carrying the comparison, so it is the one thing that must never be the part that gives way (spec audit finding 3). ⚠️ nameWidth is measured from the ACTUAL names, capped. A fixed 18 (what first shipped) stranded every bar in a narrow right-hand strip, because real command names run 4-10 characters -- so ~9 columns of every row were pure padding and the result read as a staircase floating in whitespace rather than a chart anchored to a baseline.
function buildUsageBars(byCommand) {
    if (!byCommand.length) return '';
    const top = byCommand[0].c || 1;
    const nameWidth = Math.min(14, Math.max(...byCommand.map(c => `/${c._id || '?'}`.length)));
    const countWidth = Math.max(...byCommand.map(c => String(c.c).length));
    return ansiBlock(byCommand.map(c => {
        const name = `/${c._id || '?'}`.slice(0, nameWidth).padEnd(nameWidth);
        return `${ANSI.cyan}${name}${ANSI.reset} ${ansiBar(c.c, top, BAR_CELLS, ANSI.green)} ${ANSI.bold}${String(c.c).padStart(countWidth)}${ANSI.reset}`;
    }));
}

const USAGE_EMPTY = '**No command usage in the last 7 days.**\n-# Only public commands count — your own `/manage` and `/bot` activity is deliberately excluded.';

// The delta gets its OWN line carrying the absolute prior figure, not a parenthetical. A drop of this size is the single most important fact on the page, and "-87%" without "316 then" is unactionable -- the reader cannot tell a collapse from a quiet week off a small base.
function usageDeltaLine(current, previous) {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return `🔺 **First traffic** in this window — nothing in the previous 7 days.`;
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct === 0) return `➖ **Flat** against the previous 7 days (${previous.toLocaleString()} then).`;
    return `${pct > 0 ? '🔺' : '🔻'} **${Math.abs(pct)}% ${pct > 0 ? 'up' : 'down'}** on the previous 7 days — ${previous.toLocaleString()} then, ${current.toLocaleString()} now.`;
}

async function buildUsageBody() {
    const { current, previous, byCommand } = await computeUsageStats();
    const deltaLine = usageDeltaLine(current, previous);
    const head = [
        { type: 10, content: `## ${current.toLocaleString()} interactions\n-# last 7 days` },
        ...(deltaLine ? [{ type: 10, content: deltaLine }] : []),
        { type: 14, spacing: 1 },
    ];
    if (!byCommand.length) {
        return [
            ...head,
            { type: 10, content: USAGE_EMPTY },
            { type: 14, spacing: 1 },
            { type: 1, components: [{ type: 2, style: 5, label: 'Full breakdown in the portal', url: PORTAL_ANALYTICS_URL }] },
        ];
    }
    return [
        ...head,
        { type: 10, content: `**Most used**\n${buildUsageBars(byCommand.slice(0, 5))}` },
        { type: 10, content: `-# Bars are relative to the busiest command. Only public commands count — your own \`/manage\` and \`/bot\` activity is deliberately excluded.` },
        { type: 14, spacing: 1 },
        { type: 1, components: [{ type: 2, style: 5, label: 'Full breakdown in the portal', url: PORTAL_ANALYTICS_URL }] },
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

// Discord closes the interaction window at 3,000ms. A bare "p95 2,400ms" makes a reader do that division in their head every time; stating the headroom is the page doing its own job. null is white circle, never green -- "no data" and "plenty of room" are different answers and must not share a colour.
function headroom(ms, budgetMs) {
    if (ms == null) return { pct: null, icon: '⚪' };
    const pct = Math.round(((budgetMs - ms) / budgetMs) * 100);
    return { pct, icon: pct >= 50 ? '🟢' : pct >= 25 ? '🟡' : pct >= 10 ? '🟠' : '🔴' };
}

// 🔴 HEADROOM APPLIES TO THE ACK AND NOTHING ELSE. Discord's 3,000ms limit is the deadline to ACKNOWLEDGE an interaction; once it is deferred the followup window is FIFTEEN MINUTES. Measuring total duration against 3,000ms is therefore not a harsh reading, it is a false one -- it shipped as "🔴 /colors -204% headroom" for a heavy image command that was working exactly as designed, i.e. the page asserted a production fault that did not exist. Duration gets a felt-speed band instead. The bands are Nielsen's published response-time thresholds (~0.1s instantaneous, ~1s uninterrupted flow, ~10s the limit of held attention), deliberately NOT a budget invented here -- inventing a second fake budget would repeat the very mistake above.
const FELT_SPEED = [
    { under: 1000, icon: '🟢', word: 'instant', colour: ANSI.green },
    { under: 3000, icon: '🟡', word: 'brisk', colour: ANSI.yellow },
    { under: 10000, icon: '🟠', word: 'slow', colour: ANSI.yellow },
    { under: Infinity, icon: '🔴', word: 'a long wait', colour: ANSI.red },
];
function feltSpeed(ms) {
    if (ms == null) return { icon: '⚪', word: 'no data', colour: ANSI.gray };
    return FELT_SPEED.find(b => ms < b.under);
}

// Seconds above 1,000ms. "9119ms" makes a reader count digits to learn it is nine seconds.
function fmtDur(ms) { return ms == null ? '—' : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`; }

const TIMING_EMPTY = '**No timings recorded yet.**\n-# Every interaction records how long it took to acknowledge and to finish. This fills in on its own as the bot gets used.';

async function buildTimingBody() {
    const { overall, byCommand } = await computeTimingStats();
    const ackP = overall?.ackP || [null, null];
    const durP = overall?.durP || [null, null];
    if (!overall && !byCommand.length) {
        return [
            { type: 10, content: TIMING_EMPTY },
            { type: 14, spacing: 1 },
            { type: 1, components: [{ type: 2, style: 5, label: 'Full breakdown in the portal', url: PORTAL_ANALYTICS_URL }] },
        ];
    }
    const ackHead = headroom(ackP[1], 3000);
    const durFelt = feltSpeed(durP[1]);
    // A threshold page ranks by RISK, not by frequency -- re-sort worst p95 first. computeTimingStats() already returns the rows; the aggregation's own $sort/$limit stays untouched for the portal.
    const worst = [...byCommand].sort((a, b) => (b.p?.[0] ?? 0) - (a.p?.[0] ?? 0)).slice(0, 3);
    const slowestBlock = worst.length ? (() => {
        const top = worst[0].p?.[0] || 1;
        const nameWidth = Math.min(14, Math.max(...worst.map(c => `/${c._id || '?'}`.length)));
        const durWidth = Math.max(...worst.map(c => fmtDur(c.p?.[0]).length));
        return ansiBlock(worst.map(c => {
            const f = feltSpeed(c.p?.[0]);
            const name = `/${c._id || '?'}`.slice(0, nameWidth).padEnd(nameWidth);
            return `${ANSI.cyan}${name}${ANSI.reset} ${ansiBar(c.p?.[0] ?? 0, top, BAR_CELLS, f.colour)} ${ANSI.bold}${fmtDur(c.p?.[0]).padStart(durWidth)}${ANSI.reset} ${ANSI.gray}×${c.n}${ANSI.reset}`;
        }));
    })() : null;
    return [
        { type: 10, content: `${ackHead.icon} **Acknowledged in ${fmtDur(ackP[0])}** _(p50)_ · ${fmtDur(ackP[1])} _(p95)_` },
        { type: 10, content: `-# ${ackHead.pct == null ? 'No data yet.' : `**${ackHead.pct}% headroom** under Discord's 3,000ms ack deadline`} — the one hard limit on this page. Miss it and the interaction dies.` },
        { type: 14, spacing: 1 },
        { type: 10, content: `${durFelt.icon} **Finished in ${fmtDur(durP[0])}** _(p50)_ · ${fmtDur(durP[1])} _(p95)_ — ${durFelt.word}` },
        { type: 10, content: `-# No platform deadline applies after the ack (the followup window is 15 minutes), so this is felt speed, not compliance.` },
        { type: 14, spacing: 1 },
        ...(slowestBlock
            ? [{ type: 10, content: `**Slowest to finish** _(p95, last 7d)_\n${slowestBlock}` },
               { type: 10, content: `-# Ranked by duration, not by traffic. **Admin commands are included here** — unlike Usage, they are real work the bot does.` }]
            : [{ type: 10, content: TIMING_EMPTY }]),
        { type: 14, spacing: 1 },
        { type: 1, components: [{ type: 2, style: 5, label: 'Full breakdown in the portal', url: PORTAL_ANALYTICS_URL }] },
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
async function buildAnalyticsPanel({ page = 'health', client, alertsState = {} } = {}) {
    const meta = PAGE_META[page] || PAGE_META.health;
    let body;
    if (page === 'alerts') body = await buildAlertsBody(alertsState);
    else if (page === 'changes') body = await buildChangesBody();
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
            // Emoji read INSIDE this builder, never at require() time -- refreshEmojiIds() rewrites emojiMap at boot, after this module is loaded, so a module-level capture would freeze the PROD id and render broken on the dev bot (.claude/rules/rendering-and-ui.md).
            { type: 10, content: `## ${emojis.botAccess} Bot Access` },
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
    pageSelectRow,
    PAGE_META,
    __testables: { buildVitalsBlock, buildChangesRows, CHANGES_EMPTY, ALERTS_EMPTY, buildUsageBars, headroom, feltSpeed, fmtDur, usageDeltaLine, visibleWidth },
    buildHotpatchPanel,
    buildUsageExport,
    buildTimingExport,
    buildAdminListBlocks,
    buildAdminGrantModal,
    buildAdminEditPermissionsModal,
    // PAGE_LABEL stays OUT of exports (v3-pre-release review, finding #47) -- confirmed dead as a CROSS-MODULE export, this file uses it itself. PAGE_META/pageSelectRow were re-added 2026-08-23 00:22 EDT (bot analytics redesign) so scripts/botAnalyticsBody.test.js can assert on the page-switcher descriptions without duplicating them. decodeState (and FILTERABLE_PAGES/encodeState alongside it) was removed entirely in the same change -- the page/actor filter branches that were its only callers, in this file and handlers/bot.js, moved to the portal.

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
