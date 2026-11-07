// ==========================================
// /mockmanage — THROWAWAY MOCK-UP HANDLER (dev bot only, owner only). Deleted before the rehaul's PR.
// ==========================================
// Built 2026-11-07 11:27 EST for the manage-rehaul planning (local/project/features/manage-rehaul/). It shows the proposed /manage gunsmith mp flow working on the dev database: a condensed page, one message that changes in place (Back always returns), one build card for Find/Edit/Move/Delete, Paste and Select for many builds, and a one-pop-up Export.
//
// ⚠️ IT NEVER WRITES. Every save answers with what it WOULD do. Export builds a real file, which only reads. Every pop-up is re-identified to `mockm|…` so no submit can reach the real save handlers in handlers/manage/; scripts in the feature folder assert that no outgoing custom_id lacks the prefix.
//
// ⚠️ The crash net is the router's (handlers/router.js); this file only catches to tell the owner what Discord refused, which is half of what the mock is for (the radio and checkbox pop-up pieces are new to Discord).

const PREFIX = 'mockm|';
const MODE = 'MP';
const GROUP = 'loadouts_mp';

const emojis = require('../utils/emojiMap');
const { sendV2Payload } = require('../utils/sendV2Payload');
const ACCENT = () => require('../utils/loadoutPanels').ACCENT.MP;
const isOwner = (id) => require('../utils/owner').isOwnerId(id);
const Loadout = () => require('../models/Loadout');

const btn = (id, label, style = 2, disabled = false) => ({ type: 2, style, label, custom_id: `${PREFIX}${id}`, disabled });
const row = (...buttons) => ({ type: 1, components: buttons });
const text = (content) => ({ type: 10, content });
const gap = () => ({ type: 14, divider: true, spacing: 1 });
const MOCK_NOTE = '-# Mock-up · nothing here saves';

// Select's tick lists, in memory (mock only). token -> { ids, ticked: Set, labels: Map }
const TICK = new Map();

// ---------- the condensed page ----------
async function pageView(note = null) {
    const L = Loadout();
    const [n, weapons] = await Promise.all([L.countDocuments({ mode: MODE }), L.distinct('weaponKey', { mode: MODE })]);
    const components = [
        text(`# ${emojis.database} MP Gunsmith\n-# ${n} builds · ${weapons.length} weapons`),
        gap(),
        text([
            '**Add** · a new build',
            '**Find** · one build, then edit, move, add an option or delete',
            '**Paste** · many builds at once, added or replaced',
            '**Select** · search, tick the builds, then delete or export them',
            '**Export** · any builds as a file, a message or a DM',
        ].map(s => `- ${s}`).join('\n')),
    ];
    if (note) components.push(gap(), text(note));
    components.push(gap(), text(MOCK_NOTE), row(btn('add', 'Add', 3), btn('find', 'Find', 1), btn('paste', 'Paste'), btn('select', 'Select'), btn('export', 'Export')), row(btn('guide', 'Guide')));
    return [{ type: 17, accent_color: ACCENT(), components }];
}

// ---------- the one build card ----------
async function cardView(id, option = 0, header = null, extra = []) {
    const doc = await Loadout().findById(id).lean();
    if (!doc) return pageView(`${emojis.cross} That build no longer exists.`);
    const { buildLoadoutCardBody, variantCount } = require('../utils/loadoutRender');
    const count = variantCount(doc);
    const opt = Math.min(Math.max(Number(option) || 0, 0), count - 1);
    const components = [];
    if (header) components.push(text(header), gap());
    components.push(...buildLoadoutCardBody(doc, { variant: opt }));
    if (extra.length) components.push(gap(), ...extra);
    components.push(gap(), text(MOCK_NOTE));
    if (count > 1) {
        const L = require('../utils/loadoutOptions').optionLetter;
        components.push({ type: 1, components: [{ type: 3, custom_id: `${PREFIX}opt|${id}`, placeholder: 'Pick an option', options: Array.from({ length: count }, (_, i) => ({ label: `Option ${L(i)}`, value: String(i), default: i === opt })) }] });
    }
    components.push(row(btn(`edit|${id}|${opt}`, 'Edit', 1), btn(`move|${id}|${opt}`, 'Move'), btn(`newopt|${id}`, 'Add Option'), btn(`del|${id}|${opt}`, 'Delete', 4), btn('page', 'Back')));
    return [{ type: 17, accent_color: ACCENT(), components }];
}

function noticeView(lines, backTo = 'page', backLabel = 'Back') {
    return [{ type: 17, accent_color: ACCENT(), components: [text(lines.join('\n').slice(0, 3900)), gap(), text(MOCK_NOTE), row(btn(backTo, backLabel), ...(backTo === 'page' ? [] : [btn('page', 'Back to page')]))] }];
}

// ---------- pop-ups ----------
function reId(modal, id) {
    const json = modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal));
    json.custom_id = id;
    return json;
}
const labelled = (label, component, description) => ({ type: 18, label, ...(description ? { description } : {}), component });

function searchModal(id, title, label, description, placeholder) {
    return { custom_id: `${PREFIX}${id}`, title, components: [labelled(label, { type: 4, custom_id: 'q', style: 1, required: true, max_length: 100, placeholder }, description)] };
}

const QUICK_PICKS = [
    ['all', 'All MP builds'],
    ['cat:AR', 'All AR'], ['cat:SMG', 'All SMG'], ['cat:LMG', 'All LMG'], ['cat:MARKSMAN', 'All Marksman'], ['cat:SNIPER', 'All Sniper'], ['cat:SHOTGUN', 'All Shotgun'], ['cat:SECONDARIES', 'All Secondaries'],
    ['meta', 'All Meta'], ['best', 'All Best'], ['top3', 'All Top 3'], ['top5', 'All Top 5'], ['hm', 'All HM'], ['toxic', 'All Toxic'], ['ass', 'All Ass'],
];
const quickPickSelect = () => ({ type: 3, custom_id: 'picks', required: false, min_values: 0, max_values: QUICK_PICKS.length, placeholder: 'Pick any', options: QUICK_PICKS.map(([value, label]) => ({ value, label })) });
const NAMES_PLACEHOLDER = 'BAL-27\nHOLGER 26 1b\nSMG';

function exportModal() {
    return {
        custom_id: `${PREFIX}exportm`, title: 'Export MP Builds',
        components: [
            labelled('Weapons, builds or classes', { type: 4, custom_id: 'names', style: 2, required: false, max_length: 2000, placeholder: NAMES_PLACEHOLDER }, 'One per line. Added to the quick picks below.'),
            labelled('Quick picks', quickPickSelect(), 'Everything picked is included: All AR + All Meta = both.'),
            labelled('Send to', { type: 21, custom_id: 'dest', required: true, options: [{ value: 'file', label: 'A file here', default: true }, { value: 'chat', label: 'A message here' }, { value: 'dm', label: 'A DM to me' }] }),
            labelled('Include', { type: 22, custom_id: 'include', required: false, min_values: 0, max_values: 6, options: [['code', 'Gunsmith code'], ['label', 'Label'], ['badges', 'Badges'], ['comment', 'Comment'], ['image', 'Image key'], ['mode', 'Mode']].map(([value, label]) => ({ value, label, default: value !== 'mode' })) }),
            labelled('Merged builds', { type: 21, custom_id: 'merged', required: true, options: [{ value: 'keep', label: 'Keep options together (2, 2b)', default: true }, { value: 'split', label: 'Each option as its own build' }, { value: 'first', label: 'First option only' }] }),
        ],
    };
}

function selectModal() {
    return {
        custom_id: `${PREFIX}selectm`, title: 'Select MP Builds',
        components: [
            labelled('Weapons, builds or classes', { type: 4, custom_id: 'names', style: 2, required: false, max_length: 2000, placeholder: NAMES_PLACEHOLDER }, 'One per line. Added to the quick picks below.'),
            labelled('Quick picks', quickPickSelect(), 'Everything picked is included: All AR + All Meta = both.'),
        ],
    };
}

// ---------- reading what was typed ----------
function field(interaction, id) {
    try {
        const f = interaction.fields.getField(id);
        return f?.value ?? f?.values ?? null;
    } catch { return null; }
}

const CATEGORY_WORDS = { ar: 'AR', ars: 'AR', smg: 'SMG', smgs: 'SMG', lmg: 'LMG', lmgs: 'LMG', marksman: 'MARKSMAN', marksmen: 'MARKSMAN', sniper: 'SNIPER', snipers: 'SNIPER', shotgun: 'SHOTGUN', shotguns: 'SHOTGUN', secondary: 'SECONDARIES', secondaries: 'SECONDARIES', pistol: 'SECONDARIES', pistols: 'SECONDARIES' };
const PICK_TEST = {
    all: () => true,
    meta: l => l.isMeta, best: l => l.categoryRank === 'best', top3: l => l.categoryRank === 'top3', top5: l => l.categoryRank === 'top5',
    hm: l => l.categoryRank === 'capable', toxic: l => l.isToxic, ass: l => l.isAss,
};

// Union of the typed names and the quick picks (Harkirat, 2026-11-07 11:22 EST: "all meta and all ar").
async function resolveSet(namesRaw, picks) {
    const all = await Loadout().find({ mode: MODE }).lean();
    const byId = new Map();
    const add = (l) => byId.set(String(l._id), l);
    for (const p of picks || []) {
        if (p.startsWith('cat:')) all.filter(l => l.category === p.slice(4)).forEach(add);
        else if (PICK_TEST[p]) all.filter(PICK_TEST[p]).forEach(add);
    }
    const unmatched = [];
    const { resolveManagePanelMatches } = require('./manage/shared');
    for (const line of String(namesRaw || '').split('\n').map(s => s.trim()).filter(Boolean)) {
        const cat = CATEGORY_WORDS[line.toLowerCase().replace(/^all\s+/, '')];
        if (cat) { all.filter(l => l.category === cat).forEach(add); continue; }
        const hits = await resolveManagePanelMatches(GROUP, line, 'edit');
        if (!hits.length) { unmatched.push(line); continue; }
        hits.forEach(h => add(h.doc));
    }
    const { compareBuilds } = require('../utils/loadoutForm');
    const builds = [...byId.values()].sort((a, b) => a.weaponName.localeCompare(b.weaponName) || compareBuilds(a, b));
    return { builds, unmatched };
}

function exportText(builds, { include = ['code', 'label', 'badges', 'comment', 'image'], merged = 'keep' } = {}) {
    const { variantView } = require('../utils/loadoutRender');
    const L = require('../utils/loadoutOptions').optionLetter;
    let docs = builds;
    if (merged === 'first') docs = builds.map(b => ({ ...b, variants: [] }));
    if (merged === 'split') docs = builds.flatMap(b => [{ ...b, variants: [] }, ...(b.variants || []).map((_, i) => ({ ...variantView(b, i + 1), variants: [], buildName: `${b.buildName} · Option ${L(i + 1)}`, label: b.variants[i].label || b.label }))]);
    const drop = { code: /^Code: /, label: /^Label: /, badges: /^Badges: /, comment: /^Comment: /, image: /^Image: / };
    const out = require('../utils/adminParser').formatLoadoutsAsBulkText(docs).split('\n\n').map(block => {
        let lines = block.split('\n').filter(l => !Object.entries(drop).some(([k, re]) => !include.includes(k) && re.test(l)));
        if (include.includes('mode')) lines = [lines[0], `Mode: ${MODE}`, ...lines.slice(1)];
        return lines.join('\n');
    });
    return out.join('\n\n');
}

function shortName(l) { return `${l.weaponName} · ${l.buildName}${l.label ? ` · ${l.label}` : ''}${(l.variants || []).length ? ` (${1 + l.variants.length} options)` : ''}`; }

// ---------- Select's tick list ----------
function tickView(token, note = null) {
    const t = TICK.get(token);
    if (!t) return noticeView([`${emojis.cross} That list expired. Search again.`]);
    const shown = t.ids.slice(0, 25);
    const lines = [`### Select MP Builds`, `**${t.ids.length}** found · **${t.ticked.size}** ticked${t.ids.length > 25 ? `\n-# Only the first 25 fit in one list; narrow the search for the rest.` : ''}`];
    if (t.unmatched?.length) lines.push(`-# ${emojis.warn} No build matched: ${t.unmatched.map(s => `\`${s}\``).join(', ')}`);
    if (note) lines.push(note);
    const components = [text(lines.join('\n')), gap(), text(MOCK_NOTE)];
    if (shown.length) components.push({ type: 1, components: [{ type: 3, custom_id: `${PREFIX}tick|${token}`, min_values: 0, max_values: shown.length, placeholder: 'Tick the builds', options: shown.map(id => ({ label: t.labels.get(id).slice(0, 100), value: id, default: t.ticked.has(id) })) }] });
    components.push(row(btn(`tdel|${token}`, `Delete ${t.ticked.size}`, 4, !t.ticked.size), btn(`texp|${token}`, `Export ${t.ticked.size}`, 2, !t.ticked.size), btn('select', 'Search again'), btn('page', 'Back')));
    return [{ type: 17, accent_color: ACCENT(), components }];
}

// ---------- routing ----------
async function show(interaction, components) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
    return sendV2Payload(interaction, components, { skipExpiry: true });
}

async function openPage(interaction) {
    if (!isOwner(interaction.user.id)) return interaction.reply({ content: '🔒 The mock-up is for the owner.', flags: 64 });
    await interaction.deferReply({ flags: 64 });
    return sendV2Payload(interaction, await pageView(), { skipExpiry: true });
}

async function route(interaction) {
    const [, verb, a, b] = interaction.customId.split('|');
    const manage = require('../commands/manage');

    // Buttons and selects that only change the message
    if (verb === 'page') return show(interaction, await pageView());
    if (verb === 'add') return interaction.showModal(reId(manage.buildAddLoadoutModal(MODE), `${PREFIX}addm`));
    if (verb === 'find') return interaction.showModal(searchModal('findm', 'Find a Build', 'Weapon, build or label', 'BAL-27 · BAL-27 2 · STATIC-HV 2b · Ranked', 'BAL-27 2'));
    if (verb === 'paste') return interaction.showModal(reId(manage.buildLoadoutsBulkAddModal(MODE), `${PREFIX}pastem`));
    if (verb === 'select') return interaction.showModal(selectModal());
    if (verb === 'export') return interaction.showModal(exportModal());
    if (verb === 'guide') {
        const action = require('../utils/manageActions').ACTIONS_BY_PAGE[GROUP].find(x => x.id === 'formatguide');
        return action.run({ interaction, page: GROUP, manageCommand: manage });
    }
    if (verb === 'pick') return show(interaction, await cardView(...interaction.values[0].split('~')));
    if (verb === 'opt') return show(interaction, await cardView(a, interaction.values[0]));
    if (verb === 'card') return show(interaction, await cardView(a, b));
    if (verb === 'edit') {
        const doc = await Loadout().findById(a).lean();
        if (!doc) return show(interaction, await pageView(`${emojis.cross} That build no longer exists.`));
        return interaction.showModal(reId(await require('./manage/loadouts').editLoadoutModal(doc, Number(b) || 0), `${PREFIX}editm|${a}|${b}`));
    }
    if (verb === 'move') {
        const doc = await Loadout().findById(a).lean();
        const { buildNumberOf } = require('../utils/loadoutForm');
        const tag = require('../utils/loadoutOptions').optionTag(buildNumberOf(doc.buildName), Number(b) || 0);
        return interaction.showModal({ custom_id: `${PREFIX}movem|${a}|${b}`, title: `Move ${doc.weaponName} ${tag}`.slice(0, 45), components: [labelled('New build #', { type: 4, custom_id: 'to', style: 1, required: true, max_length: 4, value: String(tag), placeholder: '3 · 2b' }, 'A number swaps with that build. A letter makes it an option of that build.')] });
    }
    if (verb === 'newopt') {
        const doc = await Loadout().findById(a).lean();
        const { buildNumberOf } = require('../utils/loadoutForm');
        const tag = require('../utils/loadoutOptions').optionTag(buildNumberOf(doc.buildName), (doc.variants || []).length + 1);
        return interaction.showModal(reId(manage.prefillModal(manage.buildAddLoadoutModal(MODE), { weapon: doc.weaponName, build: `${doc.category}, ${tag}, ` }), `${PREFIX}addm`));
    }
    if (verb === 'del') {
        const doc = await Loadout().findById(a).lean();
        const L = require('../utils/loadoutOptions').optionLetter;
        const merged = (doc.variants || []).length > 0;
        return show(interaction, await cardView(a, b, `### ${emojis.warn} Delete ${doc.weaponName} ${doc.buildName}${merged ? `, Option ${L(Number(b) || 0)}` : ''}?`, [row(btn(`delok|${a}|${b}`, 'Yes, Delete', 4), btn(`card|${a}|${b}`, 'Cancel'))]));
    }
    if (verb === 'delok') {
        const doc = await Loadout().findById(a).lean();
        return show(interaction, await pageView(`${emojis.checkmark} Would delete **${doc ? `${doc.weaponName} ${doc.buildName}` : 'that build'}**. Nothing was deleted.`));
    }
    if (verb === 'tick') {
        const t = TICK.get(a);
        if (t) t.ticked = new Set(interaction.values);
        return show(interaction, tickView(a));
    }
    if (verb === 'tlist') return show(interaction, tickView(a));
    if (verb === 'tdel') {
        const t = TICK.get(a);
        if (!t) return show(interaction, tickView(a));
        return show(interaction, noticeView([`### ${emojis.warn} Would delete ${t.ticked.size} builds`, ...[...t.ticked].map(id => `- ${t.labels.get(id)}`), '', 'Nothing was deleted.'], `tlist|${a}`, 'Back to list'));
    }
    if (verb === 'texp') {
        const t = TICK.get(a);
        const builds = t ? await Loadout().find({ _id: { $in: [...t.ticked] } }).lean() : [];
        return interaction.reply({ content: `${builds.length} builds`, files: [{ attachment: Buffer.from(exportText(builds), 'utf-8'), name: 'mp-builds.txt' }], flags: 64 });
    }

    // Pop-up submits
    if (verb === 'findm') {
        const q = interaction.fields.getTextInputValue('q');
        const hits = await require('./manage/shared').resolveManagePanelMatches(GROUP, q, 'edit');
        if (!hits.length) return show(interaction, await pageView(`${emojis.cross} No build matches \`${q.slice(0, 60)}\`.`));
        if (hits.length === 1) return show(interaction, await cardView(...String(hits[0].id).split('~')));
        return show(interaction, [{ type: 17, accent_color: ACCENT(), components: [text(`### ${hits.length} builds match \`${q.slice(0, 60)}\``), gap(), text(MOCK_NOTE), { type: 1, components: [{ type: 3, custom_id: `${PREFIX}pick`, placeholder: 'Pick a build', options: hits.slice(0, 25).map(h => ({ label: String(h.label).slice(0, 100), value: String(h.id).slice(0, 100) })) }] }, row(btn('find', 'Search again'), btn('page', 'Back'))] }]);
    }
    if (verb === 'addm') {
        const f = require('../utils/loadoutForm');
        const { weaponName, label } = f.parseWeaponLabel(interaction.fields.getTextInputValue('weapon'));
        const id = f.parseIdentity(interaction.fields.getTextInputValue('build'), MODE);
        if (id.error) return show(interaction, noticeView([`${emojis.cross} ${id.error}`]));
        const { attachments, badgesRaw, comment } = f.parseAttachmentsBadges(interaction.fields.getTextInputValue('attachments'));
        const badges = require('../utils/adminParser').parseLoadoutBadges(badgesRaw, MODE);
        const tag = id.number ? require('../utils/loadoutOptions').optionTag(id.number, id.option || 0) : 'next #';
        return show(interaction, noticeView([
            `### ${emojis.checkmark} Would add · ${weaponName} ${tag}`,
            `**Class:** ${id.category}${label ? ` · **Label:** ${label}` : ''}`,
            `**Code:** \`${id.code || '—'}\``,
            badgesRaw ? `**Badges:** ${badgesRaw}` : null,
            comment ? `**Comment:** ${comment}` : null,
            '',
            ...attachments.map((x, i) => `-# ${i + 1}. ${x}`),
            ...(badges.unrecognized.length ? [`${emojis.warn} Badges not understood: ${badges.unrecognized.join(', ')}`] : []),
        ].filter(x => x !== null)));
    }
    if (verb === 'editm') {
        const doc = await Loadout().findById(a).lean();
        const siblings = await Loadout().find({ weaponKey: doc.weaponKey, mode: MODE }).lean();
        const before = require('../utils/loadoutForm').editValues(doc, siblings, require('../utils/adminParser').loadoutBadgeTokens(doc), Number(b) || 0);
        const changes = [];
        for (const key of ['weapon', 'build', 'attachments', 'image_url']) {
            let now = '';
            try { now = interaction.fields.getTextInputValue(key) || ''; } catch { now = ''; }
            const was = before[key] || '';
            if (now.trim() === was.trim()) continue;
            const wasLines = was.split('\n'), nowLines = now.split('\n');
            const gone = wasLines.filter(l => !nowLines.includes(l)), added = nowLines.filter(l => !wasLines.includes(l));
            changes.push(...gone.filter(Boolean).map(l => `- ~~${l}~~`), ...added.filter(Boolean).map(l => `- ${l}`));
        }
        let shot = false;
        try { shot = (interaction.fields.getUploadedFiles('image_file')?.size || 0) > 0; } catch { shot = false; }
        if (shot) changes.push('- New screenshot attached');
        return show(interaction, await cardView(a, b, `### ${emojis.checkmark} Would update · ${doc.weaponName} ${doc.buildName}`, [text(changes.length ? `**Changes**\n${changes.join('\n')}` : 'No changes.')]));
    }
    if (verb === 'movem') {
        const doc = await Loadout().findById(a).lean();
        const to = interaction.fields.getTextInputValue('to').trim().toLowerCase();
        const lo = require('../utils/loadoutOptions');
        const parsed = lo.parseBuildTag ? lo.parseBuildTag(to) : null;
        const n = parsed?.number ?? parseInt(to, 10);
        const siblings = await Loadout().find({ weaponKey: doc.weaponKey, mode: MODE }).lean();
        const { buildNumberOf } = require('../utils/loadoutForm');
        const there = siblings.find(s => buildNumberOf(s.buildName) === n && String(s._id) !== String(doc._id));
        const lines = [`### ${emojis.checkmark} Would move ${doc.weaponName} ${doc.buildName} to \`${to}\``];
        if (/[a-z]$/.test(to)) lines.push(there ? `It becomes an option of **${there.buildName}**${there.label ? ` (${there.label})` : ''}.` : `There is no Build ${n} to join.`);
        else if (there) lines.push(`**${there.buildName}**${there.label ? ` (${there.label})` : ''} becomes **${doc.buildName}**: the two swap.`);
        lines.push('', 'Nothing was moved.');
        return show(interaction, noticeView(lines, `card|${a}|${b}`, 'Back to build'));
    }
    if (verb === 'pastem') {
        const { parsed, errors } = require('../utils/adminParser').parseBulkLoadoutList(interaction.fields.getTextInputValue('bulk_text'));
        const lines = [`### Paste preview`];
        for (const e of parsed) {
            const buildName = /^\d+[a-z]?$/i.test(e.buildName || '') ? `Build ${e.buildName}` : (e.buildName || 'next build');
            const exists = await Loadout().exists({ mode: MODE, weaponKey: e.weaponKey, buildName: buildName.replace(/[a-z]$/i, '') });
            lines.push(`${exists ? '↻ **Replace**' : '＋ **Add**'} · ${e.weaponName} ${buildName}`);
        }
        for (const e of errors) lines.push(`${emojis.cross} ${typeof e === 'string' ? e : (e.message || JSON.stringify(e))}`);
        lines.push('', 'Nothing was saved.');
        return show(interaction, noticeView(lines));
    }
    if (verb === 'selectm') {
        const { builds, unmatched } = await resolveSet(field(interaction, 'names'), field(interaction, 'picks') || []);
        const token = Date.now().toString(36);
        TICK.set(token, { ids: builds.map(l => String(l._id)), ticked: new Set(builds.slice(0, 25).map(l => String(l._id))), labels: new Map(builds.map(l => [String(l._id), shortName(l)])), unmatched });
        return show(interaction, tickView(token));
    }
    if (verb === 'exportm') {
        const picks = field(interaction, 'picks') || [];
        const { builds, unmatched } = await resolveSet(field(interaction, 'names'), picks);
        const dest = field(interaction, 'dest') || 'file';
        const include = field(interaction, 'include') || [];
        const merged = field(interaction, 'merged') || 'keep';
        const body = exportText(builds, { include, merged });
        const summary = `${builds.length} builds${unmatched.length ? ` · not matched: ${unmatched.map(s => `\`${s}\``).join(', ')}` : ''}\n-# Send to: ${dest} · Include: ${include.join(', ') || 'none'} · Merged: ${merged}`;
        if (!builds.length) return interaction.reply({ content: `${emojis.cross} Nothing matched.\n${summary}`, flags: 64 });
        const file = { attachment: Buffer.from(body, 'utf-8'), name: 'mp-builds.txt' };
        if (dest === 'dm') {
            await interaction.user.send({ content: summary, files: [file] });
            return interaction.reply({ content: `${emojis.checkmark} Sent to your DMs. ${summary}`, flags: 64 });
        }
        if (dest === 'chat') {
            const chunks = body.match(/[\s\S]{1,1800}(\n\n|$)/g) || [body];
            await interaction.reply({ content: `${summary}\n\`\`\`\n${chunks[0]}\n\`\`\``.slice(0, 2000), flags: 64 });
            for (const c of chunks.slice(1, 4)) await interaction.followUp({ content: `\`\`\`\n${c}\n\`\`\``.slice(0, 2000), flags: 64 });
            if (chunks.length > 4) await interaction.followUp({ content: `-# …${chunks.length - 4} more messages left out of the mock-up.`, flags: 64 });
            return;
        }
        return interaction.reply({ content: summary, files: [file], flags: 64 });
    }
    return show(interaction, await pageView(`${emojis.warn} The mock-up has no \`${verb}\` yet.`));
}

async function handleMockManageInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith('mockm|')) return false;
    if (!isOwner(interaction.user.id)) {
        try { await interaction.reply({ content: '🔒 The mock-up is for the owner.', flags: 64 }); } catch (e) { console.error('mockmanage: refusal failed', e.message); }
        return true;
    }
    try {
        await route(interaction);
    } catch (e) {
        console.error('mockmanage:', interaction.customId, e);
        const msg = `${emojis.cross} Mock-up error on \`${interaction.customId.slice(0, 60)}\`: ${String(e.message).slice(0, 300)}${e.rawError?.errors ? `\n\`\`\`${JSON.stringify(e.rawError.errors).slice(0, 900)}\`\`\`` : ''}`;
        try {
            if (interaction.deferred || interaction.replied) await interaction.followUp({ content: msg, flags: 64 });
            else await interaction.reply({ content: msg, flags: 64 });
        } catch (notify) { console.error('mockmanage: could not report', notify.message); }
    }
    return true;
}

const OWNED_PREFIXES = [PREFIX];

// One exported function, as scripts/handlerRouting.test.js requires of every handler; the command and the feature folder's probe reach the rest through `mock`.
module.exports = { handleMockManageInteraction, OWNED_PREFIXES, mock: { openPage, pageView, cardView, exportModal, selectModal, exportText, resolveSet, PREFIX } };
