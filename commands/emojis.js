// ==========================================
// COMMAND: /emojis — every app emoji, its prod id, which bots are missing it, and one tap to sync (owner only)
// ==========================================
// Harkirat, 2026-10-25 20:41 EDT: "make me a dioreo admin command /emojis which lists all the prod emojis, the emoji name, the emoji id, and if any of the bots are missing it, as well as a quick 1 tap to sync emojis". The data and the upload live in utils/emojiSync.js (its header has which apps a process can see and where Sync finds a file); this file draws the panel, and handlers/emojis.js answers its buttons (`emo_`).
//
// It lives on Dioreo Admin (bot/registry.js ADMIN_COMMAND_NAMES) and answers the owner only, on the command and on every button, like /bot hotpatch: an upload changes the app's own emoji list.
const { SlashCommandBuilder } = require('discord.js');
const emojis = require('../utils/emojiMap');
const { isOwnerId } = require('../utils/owner');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildPaginationRow } = require('../utils/paginationRow');
const S = require('../utils/emojiSync');

const PAGE_SIZE = 15;
const ACCENT = 5793266; // Discord Blurple, the admin surfaces' colour

// The apps this process runs, in display order: the public one first (on prod it IS the prod app), then Dioreo Admin when it is logged in.
function appsOfThisProcess() {
    const { clients } = require('../bot/clients');
    return [
        clients.public && { key: 'main', label: clients.public.user?.username || 'Dioreo', client: clients.public },
        clients.admin && { key: 'admin', label: clients.admin.user?.username || 'Dioreo Admin', client: clients.admin },
    ].filter(Boolean);
}

async function loadState() {
    const apps = appsOfThisProcess();
    const lists = await Promise.all(apps.map(a => S.listAppEmojis(a.client)));
    apps.forEach((a, i) => { a.emojis = lists[i]; });
    return { apps, rows: S.buildRows(S.prodEmojisFromSource(), apps) };
}

// The panel. `senderAppId` picks which app's copy draws each row's emoji: an application emoji renders only for the app that owns it, so a row the sender lacks shows its name as text.
function buildEmojiPanel({ rows, apps, page = 0, filter = 'all', note = null, senderAppId = null }) {
    const missingCount = rows.reduce((n, r) => n + r.has.filter(h => !h).length, 0);
    const shown = filter === 'missing' ? rows.filter(r => r.has.some(h => !h)) : rows;
    const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
    const p = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const senderIdx = apps.findIndex(a => (a.client?.application?.id ?? a.client?.user?.id) === senderAppId);
    const icon = r => {
        const copy = r.copies[senderIdx >= 0 ? senderIdx : 0];
        return copy ? `<${copy.animated ? 'a' : ''}:${copy.name}:${copy.id}>` : `\`:${r.name}:\``;
    };
    const perApp = apps.map((a, i) => `${a.label} missing **${rows.filter(r => !r.has[i]).length}**`).join(' · ');
    const lines = shown.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE).map(r =>
        `${icon(r)} **${r.name}** · \`${r.prodId || 'not on prod'}\` · ${apps.map((a, i) => `${r.has[i] ? emojis.checkmark : emojis.cross} ${a.key === 'admin' ? 'Admin' : 'Main'}`).join('  ')}`);
    const components = [
        { type: 10, content: `## Emojis\n-# **${rows.length}** emojis · ${perApp}` },
        { type: 1, components: [
            { type: 2, style: filter === 'all' ? 3 : 2, label: 'All', custom_id: 'emo_filter_all', disabled: filter === 'all' },
            { type: 2, style: filter === 'missing' ? 3 : 2, label: 'Missing only', custom_id: 'emo_filter_missing', disabled: filter === 'missing' },
        ] },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: lines.length ? lines.join('\n') : `${emojis.checkmark} No bot is missing an emoji.` },
    ];
    if (note) components.push({ type: 10, content: `-# ${note}` });
    const pager = buildPaginationRow({ totalChunks: pages, currentPage: p, makeCustomId: n => `emo_page_${n}_${filter}`, indicatorCustomId: 'emo_ind' });
    if (pager) components.push({ type: 14, divider: true, spacing: 2 }, pager);
    components.push({ type: 1, components: [missingCount
        ? { type: 2, style: 3, label: `Sync ${missingCount} missing`, custom_id: `emo_sync_${filter}` }
        : { type: 2, style: 2, label: 'Nothing to sync', custom_id: 'emo_sync_none', disabled: true }] });
    return [{ type: 17, accent_color: ACCENT, components }];
}

const data = new SlashCommandBuilder()
    .setName('emojis')
    .setDescription('Every app emoji, which bots are missing it, and one tap to sync (owner only)')
    .setDefaultMemberPermissions(0)
    .setIntegrationTypes([1]).setContexts([0, 1, 2]);

async function execute(interaction) {
    if (!isOwnerId(interaction.user.id)) {
        try { await interaction.reply({ content: `${emojis.cross} Only Dioreo's developer can use this.`, ephemeral: true }); } catch (e) { console.error('Failed to refuse /emojis:', e); }
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    const state = await loadState();
    await sendV2Payload(interaction, buildEmojiPanel({ ...state, senderAppId: interaction.applicationId }));
}

module.exports = { data, execute, buildEmojiPanel, loadState, PAGE_SIZE };
