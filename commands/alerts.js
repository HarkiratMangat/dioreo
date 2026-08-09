// ==========================================
// COMMAND: /alerts  (admin-only)
// ==========================================
// Browse + export the persistent alert log (see utils/alertStore.js / utils/alertWebhook.js), and read a
// plain-language explainer of what each severity means. Added 2026-07-20 (the "webhook alerting, heavier
// half" roadmap item). Admin-only — gated by the same exported ALLOWED_ADMIN_ID as /manage, and every
// `alerts_` component is auto-gated by index.js's centralized panel guard (no per-handler admin checks).
//
// This file builds the panel; index.js owns the button routing (alerts_export / alerts_explain /
// alerts_back / alerts_page_N). buildAlertsPanel() is exported so those re-render handlers share ONE
// render path with the slash command instead of a drifting copy.
const { SlashCommandBuilder } = require('discord.js');
const { displayTitle } = require('../utils/alertExplain'); // plain-language label for a stored alert title
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildPaginationRow } = require('../utils/paginationRow');
const { getAlertSummary, getRecentAlerts } = require('../utils/alertStore');
const { ALLOWED_ADMIN_ID } = require('./manage'); // single source of truth for the admin id

const ACCENT = 0x546E7A; // slate blue-grey (5533306) — an "ops/monitoring" identity, distinct from every
                         // /manage page color and the nav palette (which lean blue/plum/green/gold/amber).
const PER_PAGE = 8;
// Matches utils/alertWebhook.js's LEVEL_ICON — kept in sync by hand (both are tiny, stable maps).
const LEVEL_ICON = { info: '🟢', caution: '🟡', warn: '🟠', error: '🔴' };

function unix(d) { return Math.floor(new Date(d).getTime() / 1000); }
function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

// ── Main view: summary + recent list + action buttons ───────────────────────
function buildMainComponents({ summary, recent }) {
    const s = summary;
    const line = (t) => `${LEVEL_ICON.info} ${t.info} · ${LEVEL_ICON.caution} ${t.caution} · ${LEVEL_ICON.warn} ${t.warn} · ${LEVEL_ICON.error} ${t.error}`;
    const lastErr = s.lastError
        ? `\`${s.lastError.alertId}\` · <t:${unix(s.lastError.createdAt)}:R>`
        : '_none recorded_ 🟢';

    const container = {
        type: 17,
        accent_color: ACCENT,
        components: [
            { type: 10, content: `## 🔔 Alert Log` },
            { type: 10, content: `-# Admin-only · every alert the bot posts to Discord is logged here (${s.total} total).` },
            { type: 14, spacing: 2 },
            { type: 10, content: `**Last 24h:** ${line(s.last24h)}\n**Last 7d:** ${line(s.last7d)}\n**Last error:** ${lastErr}` },
            { type: 14, spacing: 2 },
        ],
    };

    if (recent.items.length) {
        const rows = recent.items.map(a =>
            // displayTitle() (2026-08-06 15:03 EDT): the STORED title is the canonical key — it is what
            // sendAlert throttles on and what the export must keep — but a human reading this list wants
            // the same plain-language label the Discord alert showed them, not "Gateway shard error"
            // again. Applied at render only; nothing about the stored row changes, and historical rows
            // map correctly because the canonical titles they were written under never changed.
            `\`${a.alertId || '??????'}\` ${LEVEL_ICON[a.level] || '⚪'} **${truncate(displayTitle(a.title), 60)}** · <t:${unix(a.createdAt)}:R>`
        ).join('\n');
        container.components.push({ type: 10, content: `**Recent alerts** (newest first)\n${rows}` });
    } else {
        container.components.push({ type: 10, content: `**Recent alerts**\n_No alerts recorded yet — nothing has needed one._ 🟢` });
    }

    // Pagination (only if >1 page) — inside the container, own divider above it.
    const pager = buildPaginationRow({
        totalChunks: recent.totalPages,
        currentPage: recent.page,
        makeCustomId: (p) => `alerts_page_${p}`,
        indicatorCustomId: 'alerts_pageind',
    });
    if (pager) {
        container.components.push({ type: 14, spacing: 1 });
        container.components.push(pager);
    }

    // Action buttons.
    container.components.push({ type: 14, spacing: 2 });
    container.components.push({
        type: 1,
        components: [
            { type: 2, style: 1, label: '📄 Export Log', custom_id: 'alerts_export' },
            { type: 2, style: 2, label: 'What do alerts mean?', custom_id: 'alerts_explain' },
        ],
    });

    return [container];
}

// ── Explainer subpage (static) ──────────────────────────────────────────────
function buildExplainComponents() {
    const container = {
        type: 17,
        accent_color: ACCENT,
        components: [
            { type: 10, content: `## 🔔 What the alerts mean` },
            { type: 14, spacing: 2 },
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
            {
                type: 1,
                components: [{ type: 2, style: 2, label: '← Back to alerts', custom_id: 'alerts_back' }],
            },
        ],
    };
    return [container];
}

// Shared render entry point — used by execute() (slash) AND index.js's re-render handlers, so there's one
// render path, not two. Fetches its own data (the store reads are cheap, cache-free counts/finds).
async function buildAlertsPanel({ page = 0, view = 'main' } = {}) {
    if (view === 'explain') return buildExplainComponents();
    const [summary, recent] = await Promise.all([
        getAlertSummary(),
        getRecentAlerts({ page, perPage: PER_PAGE }),
    ]);
    return buildMainComponents({ summary, recent });
}

module.exports = {
    buildAlertsPanel,
    PER_PAGE,
    data: new SlashCommandBuilder()
        .setName('alerts')
        .setDescription('View and export the bot\'s alert log')
        .setDefaultMemberPermissions(0)
        .setIntegrationTypes([1]).setContexts([0, 1, 2]) // user-install + DM, same as every public command
        .addBooleanOption(o => o.setName('visibility').setDescription('True = only you can see this panel. False = everyone in the chat can see it. (default: True)')),

    async execute(interaction) {
        if (interaction.user.id !== ALLOWED_ADMIN_ID) {
            return interaction.reply({ content: "🔒 **This one's admin-only.** `/alerts` shows the bot's internal health log — try any of the bot's public commands instead!", ephemeral: true });
        }
        // Default ephemeral (admin panel), same convention as /manage.
        const argPrivate = interaction.options.getBoolean('visibility');
        const isEphemeral = argPrivate === null ? true : argPrivate;
        await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        const components = await buildAlertsPanel({ page: 0, view: 'main' });
        return sendV2Payload(interaction, components);
    },
};
