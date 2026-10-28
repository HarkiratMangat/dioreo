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

const PAGE_SIZE = 12; // four marks a row since the status reports (21:16 EDT); 15 rows would pass Discord's 4,000 characters
const ACCENT = 5793266; // Discord Blurple, the admin surfaces' colour

// The apps this process runs, in display order: the public one first (on prod it IS the prod app), then Dioreo Admin when it is logged in.
const SHORT = { prod: { main: 'Dioreo', admin: 'Admin' }, dev: { main: 'Dev', admin: 'Dev Admin' } };
function appsOfThisProcess() {
    const { clients } = require('../bot/clients');
    const env = process.env.NODE_ENV === 'development' ? 'dev' : 'prod';
    return [
        clients.public && { key: 'main', env, short: SHORT[env].main, label: clients.public.user?.username || 'Dioreo', client: clients.public },
        clients.admin && { key: 'admin', env, short: SHORT[env].admin, label: clients.admin.user?.username || 'Dioreo Admin', client: clients.admin },
    ].filter(Boolean);
}

// This process's two apps, live, then the other bot's two from its last status report (utils/emojiSync.js), marked `remote` with the report's time: Sync and Upload never write to those, the other bot fills them itself.
async function loadState() {
    const apps = appsOfThisProcess();
    const lists = await Promise.all(apps.map(a => S.listAppEmojis(a.client)));
    apps.forEach((a, i) => { a.emojis = lists[i]; });
    const other = await S.readOtherStatus();
    for (const a of other?.apps || []) apps.push({ key: a.key, env: other.env, short: SHORT[other.env]?.[a.key] || a.label, label: a.label, emojis: a.emojis || [], remote: true, at: other.at });
    let originals = null;
    try { originals = await S.listOriginals(); } catch (e) { console.error('/emojis: could not list the Cloudinary originals:', S.safeCloudinaryError(e)); }
    return { apps, rows: S.buildRows(S.prodEmojisFromSource(), apps, { originals }), originalsKnown: Boolean(originals) };
}

// The four views (his 20:41 EDT ask, and the 20:44 EDT one: "if you think any other features would be a good addition to it, please implement those as well"): every prod emoji, the ones a bot lacks, the ones with no original in Cloudinary (so Sync would fall back to a re-encode), and the ones a bot has that the code never names (clean-up candidates; never synced).
const FILTERS = [
    { key: 'all', label: 'All', test: r => r.prodEmoji },
    { key: 'missing', label: 'Missing', test: r => r.prodEmoji && r.has.some(h => !h) },
    { key: 'nofile', label: 'No original', test: r => r.prodEmoji && r.hasOriginal === false },
    { key: 'unused', label: 'Not in code', test: r => !r.inCode && !r.prodEmoji },
];
const filterOf = (key) => FILTERS.find(f => f.key === key) || FILTERS[0];
// The page a name sits on in a view, for Search and for the redraw after an upload; -1 when it is not in that view.
function pageOf(rows, filter, name) {
    const i = rows.filter(filterOf(filter).test).findIndex(r => r.name.toLowerCase() === String(name).toLowerCase());
    return i < 0 ? -1 : Math.floor(i / PAGE_SIZE);
}

// The panel. `senderAppId` picks which app's copy draws each row's emoji: an application emoji renders only for the app that owns it, so a row the sender lacks shows its name as text.
function buildEmojiPanel({ rows, apps, page = 0, filter = 'all', note = null, senderAppId = null, originalsKnown = true }) {
    const f = filterOf(filter);
    const prodRows = rows.filter(r => r.prodEmoji);
    // What Sync can actually do: this process's apps only, and only where an original exists (it never copies from Discord).
    const missingCount = prodRows.filter(r => r.hasOriginal !== false).reduce((n, r) => n + r.has.filter((h, i) => !h && !apps[i].remote).length, 0);
    const shown = rows.filter(f.test);
    const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
    const p = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const senderIdx = apps.findIndex(a => (a.client?.application?.id ?? a.client?.user?.id) === senderAppId);
    const icon = r => {
        const copy = r.copies[senderIdx >= 0 ? senderIdx : 0];
        return copy ? `<${copy.animated ? 'a' : ''}:${copy.name}:${copy.id}>` : `\`:${r.name}:\``;
    };
    // The full mention, as code pastes it (Harkirat, 2026-10-25 21:09 EDT: "by the ID, i meant like `<:Check:1564082261954138202>`"): the prod id, or the app's own for an emoji only an app has.
    const codeOf = r => `<${r.animated ? 'a' : ''}:${r.name}:${r.prodId || r.copies.find(Boolean)?.id || '?'}>`;
    const stats = [`**${prodRows.length}** emojis`, ...apps.map((a, i) => `${a.label} missing **${prodRows.filter(r => !r.has[i]).length}**${a.remote ? ` (as of <t:${Math.floor(new Date(a.at).getTime() / 1000)}:R>)` : ''}`)];
    if (originalsKnown) stats.push(`**${prodRows.filter(r => r.hasOriginal === false).length}** with no original`);
    // Three lines a row (his example, 2026-10-28 11:43 EDT): the emoji, its name and its code, then a quote of subtext holding the four bots and whether Cloudinary has the original. Cloudinary is left out where it is not known (the Not in code view).
    const lines = shown.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE).map(r => [
        `${icon(r)} **${r.name}** · \`${codeOf(r)}\``,
        `> -# ${apps.map((a, i) => `${r.has[i] ? emojis.check : emojis.cross} ${a.short || a.label}`).join('  ')}`,
        ...(r.prodEmoji && r.hasOriginal !== undefined ? [`> -# ${r.hasOriginal === false ? emojis.cross : emojis.check} Cloudinary (original)`] : []),
    ].join('\n'));
    const empty = { all: 'No emojis.', missing: `${emojis.checkmark} No bot is missing an emoji.`, nofile: `${emojis.checkmark} Every emoji has its original in Cloudinary.`, unused: `${emojis.checkmark} Every emoji on the bots is one the code uses.` }[f.key];
    const components = [
        { type: 10, content: `## Emojis\n-# ${stats.join(' · ')}` },
        { type: 1, components: FILTERS.map(x => ({ type: 2, style: x.key === f.key ? 3 : 2, label: x.label, custom_id: `emo_filter_${x.key}`, disabled: x.key === f.key })) },
        { type: 14, divider: true, spacing: 1 },
        { type: 10, content: lines.length ? lines.join('\n') : empty },
    ];
    if (note) components.push({ type: 10, content: `-# ${note}` });
    const pager = buildPaginationRow({ totalChunks: pages, currentPage: p, makeCustomId: n => `emo_page_${n}_${f.key}`, indicatorCustomId: 'emo_ind' });
    if (pager) components.push({ type: 14, divider: true, spacing: 2 }, pager);
    components.push({ type: 1, components: [
        missingCount
            ? { type: 2, style: 3, label: `Sync ${missingCount} missing`, custom_id: `emo_sync_${f.key}` }
            : { type: 2, style: 2, label: 'Nothing to sync', custom_id: 'emo_sync_none', disabled: true },
        { type: 2, style: 1, label: 'Upload original', custom_id: 'emo_upload', emoji: emojis.parseEmoji(emojis.mngAdd) },
        { type: 2, style: 2, label: 'Find...', custom_id: `emo_find_${f.key}`, emoji: emojis.parseEmoji(emojis.search) },
    ] });
    return [{ type: 17, accent_color: ACCENT, components }];
}

// ---- The result messages after an Upload original or a Sync (his mock-ups, 2026-10-28 11:43 EDT) ---- The names a result calls each bot: the prod pair by their own names, the dev pair as Dev and Dev Admin.
const reportName = (a) => a.env === 'dev' ? (a.short || a.label) : (a.key === 'admin' ? 'Dioreo Admin' : 'Dioreo');
// Status marks: Accept (done now), Check (already had it), Pending, Deny.
const marks = () => ({ done: emojis.accept, had: emojis.check, wait: emojis.pending, bad: emojis.deny });
const card = (components) => [{ type: 17, accent_color: ACCENT, components }];

// Upload: per bot, what happened. `outcome[i]` is 'added' | 'had' | 'failed' | 'skipped' for each bot of this process (and ignored for the other bot's two, which show 'had' or Pending from their last report).
function buildUploadReport({ name, replaced, preview, apps, outcome }) {
    const m = marks();
    const rows = [`**Cloudinary** ${m.done}`, ...apps.map((a, i) => {
        const o = a.remote ? (a.emojis.some(e => e.name === name) ? 'had' : 'pending') : outcome[i];
        const mark = { added: m.done, had: m.had, failed: m.bad, pending: m.wait, skipped: '(not added)' }[o];
        return `**${reportName(a)}** ${mark}`;
    })];
    const pending = apps.some((a, i) => (a.remote ? !a.emojis.some(e => e.name === name) : false));
    return card([
        { type: 10, content: `## ${emojis.checkmark} Emoji ${replaced ? 'Replaced' : 'Uploaded'}${preview ? ` ${preview}` : ''}\n${preview ? `${preview} ` : ''}**${name}** · \`:${name}:\`` },
        { type: 14, divider: false, spacing: 1 },
        { type: 10, content: rows.join('\n') },
        { type: 10, content: [`-# ${m.done} Added · ${m.had} Already added; Copy kept`, ...(pending ? [`-# ${m.wait} Pending will sync within 10 minutes`] : [])].join('\n') },
    ]);
}

const SYNC_SECTIONS_SHOWN = 14; // two components a section and the Container holds 40 in all
// Sync: one text block per emoji it touched, so each set sits a little apart. `before` is the state just before the sync (who already had what), `res` is runAutoSync's answer.
function buildSyncReport({ before, res, noFile = 0, previewOf = () => '' }) {
    const m = marks();
    const byName = new Map();
    const note = (list, key) => { for (const entry of list || []) { const [name, label] = entry.split(' → '); if (!byName.has(name)) byName.set(name, { synced: [], failed: [] }); byName.get(name)[key].push(label); } };
    note(res.added, 'synced'); note(res.failed, 'failed');
    const title = res.skipped ? `${m.wait} A sync is already running`
        : res.failed.length ? `${m.bad} Sync finished with failures`
        : res.added.length ? `${emojis.checkmark} ${new Set(res.added.map(a => a.split(' → ')[0])).size} Emojis Synced`
        : 'Nothing to sync';
    const components = [{ type: 10, content: `## ${title}` }];
    if (res.skipped) components.push({ type: 10, content: 'The 10-minute timer or another tap is already syncing. Try again in a moment.' });
    else if (!byName.size) components.push({ type: 10, content: 'Every bot already has every emoji that has an original.' });
    if (byName.size) components.push({ type: 14, divider: false, spacing: 1 });
    for (const [name, got] of [...byName].slice(0, SYNC_SECTIONS_SHOWN)) {
        const row = before.rows.find(r => r.name === name);
        const labelOf = a => a.label;
        const inSync = before.apps.filter((a, i) => row?.has[i] && !got.synced.includes(labelOf(a))).map(reportName);
        const synced = before.apps.filter(a => got.synced.includes(labelOf(a))).map(reportName);
        const failed = before.apps.filter(a => got.failed.includes(labelOf(a))).map(reportName);
        const pending = before.apps.filter((a, i) => a.remote && !row?.has[i] && !got.synced.includes(labelOf(a))).map(reportName);
        components.push({ type: 10, content: [`${previewOf(name)} **${name}**`.trim(),
            inSync.length ? `-# **In-sync:** ${inSync.join(' · ')}` : null,
            synced.length ? `-# **Synced:** ${synced.join(' · ')}` : null,
            failed.length ? `-# ${m.bad} **Failed:** ${failed.join(' · ')} (details in the log)` : null,
            pending.length ? `-# ${m.wait} **Pending:** ${pending.join(' · ')}, within 10 minutes` : null].filter(Boolean).join('\n') });
    }
    if (byName.size > SYNC_SECTIONS_SHOWN) components.push({ type: 10, content: `-# …and ${byName.size - SYNC_SECTIONS_SHOWN} more` });
    const tail = [res.held?.length ? `${res.held.length} failed earlier today and are retried tomorrow` : null, noFile ? `${noFile} still need an original uploaded first (see No original)` : null].filter(Boolean);
    if (tail.length) components.push({ type: 10, content: `-# ${tail.join(' · ')}` });
    return card(components);
}

// The Upload original pop-up (his 20:44 EDT ask): a name of his choosing, the file, what to do if the name is taken, and whether to add it to the bots too.
const label = (text, description, component) => ({ type: 18, label: text, ...(description ? { description } : {}), component });
function uploadModal() {
    return {
        title: 'Upload an emoji original', custom_id: 'emo_upmodal',
        components: [
            label('Emoji name', '2 to 32 letters, numbers or _, as Discord allows', { type: 4, custom_id: 'name', style: 1, required: true, min_length: 2, max_length: 32, placeholder: 'e.g. DailyUpdate' }),
            label('Image', 'PNG, GIF, WebP or AVIF; up to 10 MB. Sync shrinks it for Discord when needed', { type: 19, custom_id: 'file', min_values: 1, max_values: 1, required: true }),
            label('If that name is taken', null, { type: 3, custom_id: 'taken', required: true, options: [{ label: "Stop and tell me", value: 'stop', default: true }, { label: 'Replace the original', value: 'replace' }] }),
            label('Also add it to the bots', null, { type: 3, custom_id: 'bots', required: true, options: [{ label: "Yes, wherever it's missing", value: 'yes', default: true }, { label: 'No, Cloudinary only', value: 'no' }] }),
        ],
    };
}
function findModal(filter) {
    return { title: 'Find an emoji', custom_id: `emo_findmodal_${filterOf(filter).key}`, components: [label('Emoji name', null, { type: 4, custom_id: 'q', style: 1, required: true, max_length: 32 })] };
}

const data = new SlashCommandBuilder()
    .setName('emojis')
    .setDescription('Every app emoji, which bots are missing it, and one tap to sync (owner only)')
    .setDefaultMemberPermissions(0)
    // The same Hidden/Public option every other command ends on (2026-10-28 14:21 UTC, Harkirat: "Emoji commands also doesn't have a visibility option"). Unset stays Hidden, as the panel always was: it lists the apps' emoji ids and holds the Sync and Upload buttons.
    .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
    .setIntegrationTypes([1]).setContexts([0, 1, 2]);

async function execute(interaction) {
    if (!isOwnerId(interaction.user.id)) {
        try { await interaction.reply({ content: `${emojis.cross} Only Dioreo's developer can use this.`, ephemeral: true }); } catch (e) { console.error('Failed to refuse /emojis:', e); }
        return;
    }
    await interaction.deferReply({ ephemeral: interaction.options.getString('visibility') !== 'public' });
    const state = await loadState();
    await sendV2Payload(interaction, buildEmojiPanel({ ...state, senderAppId: interaction.applicationId }));
}

module.exports = { data, execute, buildEmojiPanel, buildUploadReport, buildSyncReport, loadState, appsOfThisProcess, uploadModal, findModal, pageOf, FILTERS, PAGE_SIZE };
