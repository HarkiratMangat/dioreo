// ==========================================
// COMMAND: /audit  (admin-only)
// ==========================================
// Browse + export the persistent /manage DB-change audit log (see utils/changeStore.js), mirroring
// /alerts' shape (commands/alerts.js) -- read-back pagination, export and retention are all solved
// there, so this copies the pattern rather than inventing a new one. Stage 4 of
// docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md; closes the four-stage
// /manage decomposition project.
//
// This file builds the panel; handlers/audit.js owns the button/select/modal routing
// (audit_page_N / audit_export / audit_filterpage / audit_filteractor / audit_clearfilters).
// buildAuditPanel() is exported so those re-render handlers share ONE render path with the slash
// command instead of a drifting copy.
const { SlashCommandBuilder } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildPaginationRow } = require('../utils/paginationRow');
const { getChangeSummary, getRecentChanges } = require('../utils/changeStore');
const { hasCommandAccess, MANAGE_PAGE_SCOPES } = require('../utils/adminAccess');
const { mentionCommand } = require('../utils/commandMentions');

// "Ledger Violet" -- an ink/record identity, distinct from every /manage page accent (Plum Fortune
// #6B4E7D, Slate Harbor #3A5068, Patch Gold #F2C230, MP red #FF3430, DMZ blue #337BA6, Neon Amber
// #F2994A) and from /alerts' slate blue-grey #546E7A.
const ACCENT = 0x6C5DD3; // #6C5DD3 (7101907)
const PER_PAGE = 8;

// Page keys this log can be filtered to -- the same real /manage page scopes plus the two per-row
// pages (manageadmins/announcement) whose mutations also go through recordChange(). Not every
// scope from utils/adminAccess.js necessarily has entries yet; the filter still offers all of them
// so a brand-new page's first change is discoverable by filtering to it.
const FILTERABLE_PAGES = [...MANAGE_PAGE_SCOPES, 'manageadmins', 'announcement'];
const PAGE_LABEL = {
    draws: 'Draws', calendar: 'Calendar', loadouts_mp: 'MP Loadouts', loadouts_dmz: 'DMZ Loadouts',
    patchnotes: 'Patch Notes', seasondraft: 'Next Season Draft', season: 'Season Titles/Wipe',
    announcement: 'Announcement', manageadmins: 'Manage Admins',
};

function unix(d) { return Math.floor(new Date(d).getTime() / 1000); }
function truncate(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
// customId parts are joined/split on '~' -- distinct from every '_' inside a page key
// (loadouts_mp/loadouts_dmz) or an action id, so parsing never ambiguates the two.
function encodeState(pf, af) { return `${pf || ''}~${af || ''}`; }
function decodeState(rest) { const [pf, af] = (rest || '~').split('~'); return { filterPage: pf || null, filterActor: af || null }; }

function buildMainComponents({ summary, recent, filterPage, filterActor }) {
    const s = summary;
    const state = encodeState(filterPage, filterActor);
    const lastChg = s.lastChange
        ? `\`${s.lastChange.changeId}\` · ${truncate(s.lastChange.summary, 60)} · <t:${unix(s.lastChange.createdAt)}:R>`
        : '_none recorded_';

    const filterLine = (filterPage || filterActor)
        ? `-# Filtered: ${filterPage ? `page **${PAGE_LABEL[filterPage] || filterPage}**` : ''}${filterPage && filterActor ? ' · ' : ''}${filterActor ? `actor <@${filterActor}>` : ''}`
        : null;

    const container = {
        type: 17,
        accent_color: ACCENT,
        components: [
            { type: 10, content: `## 📒 Change Log` },
            { type: 10, content: `-# Admin-only · every DB-mutating \`/manage\` action is recorded here (${s.total} total).` },
            ...(filterLine ? [{ type: 10, content: filterLine }] : []),
            { type: 14, spacing: 2 },
            { type: 10, content: `**Last 24h:** ${s.last24h} change(s)\n**Last 7d:** ${s.last7d} change(s)\n**Most recent:** ${lastChg}` },
            { type: 14, spacing: 2 },
        ],
    };

    if (recent.items.length) {
        const rows = recent.items.map(c =>
            `\`${c.changeId || '??????'}\` **${truncate(c.summary || `${c.action} on ${c.page}`, 70)}**${c.undone ? ' ↩️' : ''}\n-# ${PAGE_LABEL[c.page] || c.page || '?'} · <@${c.actorId}> · <t:${unix(c.createdAt)}:R>`
        ).join('\n');
        container.components.push({ type: 10, content: `**Recent changes** (newest first)\n${rows}` });
    } else {
        container.components.push({ type: 10, content: `**Recent changes**\n_No changes recorded yet${(filterPage || filterActor) ? ' matching this filter' : ''}._` });
    }

    const pager = buildPaginationRow({
        totalChunks: recent.totalPages,
        currentPage: recent.page,
        makeCustomId: (p) => `audit_page_${p}~${state}`,
        indicatorCustomId: `audit_pageind~${state}`,
    });
    if (pager) {
        container.components.push({ type: 14, spacing: 1 });
        container.components.push(pager);
    }

    // Page filter dropdown -- always visible so clearing back to "All pages" is one click.
    const pageOptions = [
        { label: 'All pages', value: '__all__', default: !filterPage },
        ...FILTERABLE_PAGES.map(p => ({ label: PAGE_LABEL[p] || p, value: p, default: filterPage === p })),
    ];
    container.components.push({ type: 14, spacing: 2 });
    container.components.push({
        type: 1,
        components: [{ type: 3, custom_id: `audit_filterpage~${filterActor || ''}`, placeholder: 'Filter by page…', options: pageOptions }],
    });

    const actionButtons = [
        { type: 2, style: 1, label: '👤 Filter by Actor', custom_id: `audit_filteractor~${filterPage || ''}` },
        { type: 2, style: 1, label: '📄 Export Log', custom_id: `audit_export~${state}` },
    ];
    if (filterPage || filterActor) {
        actionButtons.push({ type: 2, style: 2, label: 'Clear Filters', custom_id: 'audit_clearfilters' });
    }
    container.components.push({ type: 1, components: actionButtons });

    return [container];
}

// Shared render entry point -- used by execute() (slash) AND handlers/audit.js's re-render handlers.
async function buildAuditPanel({ page = 0, filterPage = null, filterActor = null } = {}) {
    const [summary, recent] = await Promise.all([
        getChangeSummary(),
        getRecentChanges({ page, perPage: PER_PAGE, filterPage, filterActor }),
    ]);
    return buildMainComponents({ summary, recent, filterPage, filterActor });
}

module.exports = {
    buildAuditPanel,
    decodeState,
    encodeState,
    PER_PAGE,
    FILTERABLE_PAGES,
    PAGE_LABEL,
    data: new SlashCommandBuilder()
        .setName('audit')
        .setDescription("View and export /manage's DB-change audit log")
        // ADMIN-ONLY: stays user-install [1] deliberately, same reasoning as /alerts and /manage --
        // an admin command advertised in every server's command list is noise plus needless surface.
        .setIntegrationTypes([1]).setContexts([0, 1, 2])
        .addStringOption(o => o.setName('visibility').setDescription('Show this panel only to you, or publicly to everyone in the chat. (Defaults to only you.)').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' })),

    async execute(interaction) {
        if (!(await hasCommandAccess(interaction.user.id, 'audit'))) {
            return interaction.reply({ content: `🔒 **This one's admin-only.** ${mentionCommand(interaction.client, '/audit')} shows the bot's own \`/manage\` change history -- try any of the bot's public commands instead!`, ephemeral: true });
        }
        const visibilityChoice = interaction.options.getString('visibility');
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
        await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        const components = await buildAuditPanel({ page: 0 });
        return sendV2Payload(interaction, components);
    },
};
