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

const row = (...buttons) => ({ type: 1, components: buttons });
const text = (content) => ({ type: 10, content });
const MOCK_NOTE = '-# Mock-up · nothing here saves';

// Select's tick lists, in memory (mock only). token -> { ids, ticked: Set, labels: Map }
const TICK = new Map();
// Paste's last text by token, so Paste Again reopens with it (mock only).
const PASTE = new Map();

// ---------- house style (the MP Gunsmiths landing, v3.12.0, and the lists page, v3.7.1) ----------
// `## <emoji> Title` + the season in bold italic · ==== a spacing-2 divider between parts, -- a spacing-1 gap · a `-#` hint above each button group · buttons carry an emoji, Title Case, grey unless they are the main action.
const BIG = () => ({ type: 14, divider: true, spacing: 2 });
const SMALL = () => ({ type: 14, divider: false, spacing: 1 });
const ebtn = (id, label, emojiStr, style = 2, disabled = false) => ({ type: 2, style, label, custom_id: `${PREFIX}${id}`, disabled, ...(emojiStr ? { emoji: emojis.parseEmoji(emojiStr) } : {}) });
const BADGE_WORD = { meta: ['meta', 'META'], best: ['best', 'Best'], top3: ['top3', 'Top 3'], top5: ['top5', 'Top 5'], capable: ['hm', 'HM'], toxic: ['toxic', 'Toxic'], ass: ['ass', 'Ass'] };
const badgeWords = (l) => require('../utils/adminParser').loadoutBadgeTokens(l).map(t => BADGE_WORD[t]).filter(Boolean).map(([e, w]) => `${emojis[e] || ''} ${w}`.trim());
const classOf = (c) => require('../utils/gunsmithLists').CLASSES.find(x => x[0] === c) || [c, null, c];
const classIcon = (c) => emojis[classOf(c)[1]] || '';
const classWord = (c) => classOf(c)[2];
const crumb = (...parts) => `-# ${['MP Gunsmith', ...parts].join('  ›  ')}`;
const panel = (components) => [{ type: 17, accent_color: ACCENT(), components: [...components, SMALL(), text(MOCK_NOTE)] }];
const backRow = (to = 'page', label = 'Back', extra = []) => row(...extra, ebtn(to, label, emojis.returnArrow));

async function seasonLine() {
    const doc = await require('../models/SeasonalData').findOne({ docType: 'global' }).lean();
    if (!doc?.currentSeasonTitle) return '';
    const emoji = require('../utils/seasonEmoji').seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji);
    return `\n${emoji ? `${emoji} ` : ''}${require('../utils/titleBlock').toBoldItalicUnicode(doc.currentSeasonTitle)}`;
}

// ---------- the home page ----------
async function pageView(note = null) {
    const L = Loadout();
    const builds = await L.find({ mode: MODE }).select('category weaponKey').lean();
    const weapons = new Set(builds.map(b => b.weaponKey)).size;
    const { CLASS_ORDER } = require('../utils/loadoutRender');
    const present = CLASS_ORDER.filter(c => builds.some(b => b.category === c));
    const classBtn = (c) => ebtn(`cls|${c}`, classWord(c), classIcon(c));
    const components = [
        text(`## ${emojis.database} MP Gunsmith${await seasonLine()}\n-# ${builds.length} builds · ${weapons} weapons`),
        BIG(),
        text('-# Go straight to a build…'),
        row(ebtn('find', 'Search Builds', emojis.gunsmithSearch, 1), ebtn('add', 'Add Build', emojis.mngAdd, 3)),
        SMALL(),
        text('-# Or browse by class…'),
        row(...present.slice(0, 4).map(classBtn)),
        row(...present.slice(4).map(classBtn)),
        BIG(),
        text('-# Many builds at once…'),
        row(ebtn('paste', 'Paste Builds', emojis.mngBulkAdd), ebtn('select', 'Select Builds', emojis.filter), ebtn('export', 'Export', emojis.mngExport), ebtn('guide', 'Guide', emojis.guide)),
    ];
    if (note) components.splice(1, 0, SMALL(), text(note));
    return panel(components);
}

// ---------- a class: its weapons ----------
async function classView(category) {
    const builds = await Loadout().find({ mode: MODE, category }).select('weaponName weaponKey').lean();
    const byWeapon = new Map();
    for (const b of builds) byWeapon.set(b.weaponKey, { name: b.weaponName, n: (byWeapon.get(b.weaponKey)?.n || 0) + 1 });
    const weapons = [...byWeapon.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
    const shown = weapons.slice(0, 25);
    return panel([
        text(`${crumb(classWord(category))}\n## ${classIcon(category)} ${classWord(category)}\n-# ${weapons.length} weapons · ${builds.length} builds`),
        BIG(),
        text('-# Pick a weapon…'),
        { type: 1, components: [{ type: 3, custom_id: `${PREFIX}wpn`, placeholder: `${weapons.length} ${classWord(category)} weapons`, options: shown.map(([key, w]) => ({ label: w.name.slice(0, 100), value: key, description: `${w.n} build${w.n === 1 ? '' : 's'}` })) }] },
        ...(weapons.length > 25 ? [text(`-# ${emojis.warn} ${weapons.length - 25} more need Search.`)] : []),
        BIG(),
        row(ebtn('page', 'Home', emojis.database)),
    ]);
}

// ---------- a weapon: every build side by side ----------
async function weaponView(weaponKey, note = null) {
    const { compareBuilds } = require('../utils/loadoutForm');
    const L = require('../utils/loadoutOptions').optionLetter;
    const builds = (await Loadout().find({ mode: MODE, weaponKey }).lean()).sort(compareBuilds);
    if (!builds.length) return pageView(`${emojis.cross} That weapon has no MP builds.`);
    const w = builds[0];
    const components = [
        text(`${crumb(classWord(w.category), w.weaponName)}\n## ${classIcon(w.category)} ${w.weaponName}\n-# ${builds.length} build${builds.length === 1 ? '' : 's'}`),
    ];
    if (note) components.push(SMALL(), text(note));
    components.push(BIG());
    for (const b of builds) {
        const opts = (b.variants || []).length;
        const words = badgeWords(b);
        const head = `**${b.buildName}**${b.label ? ` · ${b.label}` : ''}${words.length ? `  ${words.join('  ')}` : ''}`;
        const sub = `-# ${emojis.gunsmithCode} \`${b.shareCode || 'no code'}\` · ${(b.attachments || []).length} attachments${opts ? ` · ${opts + 1} options` : ''}`;
        components.push({ type: 9, components: [text(`${head}\n${sub}`)], accessory: ebtn(`card|${b._id}|0`, 'Open', emojis.edit) });
    }
    components.push(BIG(), row(ebtn(`newb|${weaponKey}`, 'New Build', emojis.mngAdd, 3)), row(ebtn(`cls|${w.category}`, classWord(w.category), emojis.returnArrow), ebtn('page', 'Home', emojis.database)));
    return panel(components);
}

// The /manage card is for acting, so the picture sits as a thumbnail beside the attachments instead of a full-width gallery under them (lead's call, 2026-11-07 12:21 EST, his "you decide"). A merged build's options already carry their own thumbnails, so only a gallery is moved.
function compactCard(body) {
    const g = body.findIndex(c => c.type === 12);
    const at = body.findIndex(c => c.type === 10 && /^### Attachments/.test(c.content || ''));
    if (g === -1 || at === -1) return body;
    const url = body[g].items?.[0]?.media?.url;
    const out = body.filter((_, i) => i !== g && !(i === g - 1 && body[i].type === 14));
    const ai = out.findIndex(c => c.type === 10 && /^### Attachments/.test(c.content || ''));
    if (url) out[ai] = { type: 9, components: [out[ai]], accessory: { type: 11, media: { url } } };
    return out;
}

// ---------- the one build card ----------
async function cardView(id, option = 0, header = null, extra = []) {
    const doc = await Loadout().findById(id).lean();
    if (!doc) return pageView(`${emojis.cross} That build no longer exists.`);
    const { buildLoadoutCardBody, variantCount } = require('../utils/loadoutRender');
    const count = variantCount(doc);
    const opt = Math.min(Math.max(Number(option) || 0, 0), count - 1);
    const L = require('../utils/loadoutOptions').optionLetter;
    const siblings = (await Loadout().find({ mode: MODE, weaponKey: doc.weaponKey }).select('buildName').lean()).sort(require('../utils/loadoutForm').compareBuilds);
    const index = Math.max(0, siblings.findIndex(x => String(x._id) === String(doc._id)));
    const components = [text(crumb(classWord(doc.category), doc.weaponName, `${doc.buildName}${count > 1 ? ` · Option ${L(opt)}` : ''}`))];
    if (header) components.push(text(header), SMALL());
    components.push(...compactCard(buildLoadoutCardBody(doc, { variant: opt, index, total: siblings.length })));
    if (extra.length) components.push(BIG(), ...extra);
    else {
        components.push(BIG());
        if (count > 1) components.push({ type: 1, components: [{ type: 3, custom_id: `${PREFIX}opt|${id}`, placeholder: 'Pick an option', options: Array.from({ length: count }, (_, i) => ({ label: `Option ${L(i)}`, value: String(i), default: i === opt })) }] });
        components.push(
            row(ebtn(`edit|${id}|${opt}`, 'Edit', emojis.mngEdit, 1), ebtn(`move|${id}|${opt}`, 'Move', emojis.mngBulkReplace), ebtn(`newopt|${id}`, 'Add Option', emojis.mngAdd), ebtn(`del|${id}|${opt}`, 'Delete', emojis.mngDelete, 4)),
            row(ebtn(`wback|${doc.weaponKey}`, doc.weaponName, emojis.returnArrow), ebtn('page', 'Home', emojis.database)),
        );
    }
    return panel(components);
}

// A result: what the action WOULD do, in the house style, with the way back.
function resultView({ crumbs = [], title, body = [], back = 'page', backLabel = 'Back', ok = true, extraButtons = [] }) {
    return panel([
        ...(crumbs.length ? [text(crumb(...crumbs))] : []),
        text(`### ${ok === 'warn' ? emojis.warn : ok ? emojis.checkmark : emojis.cross} ${title}`),
        ...(body.length ? [SMALL(), text(body.join('\n').slice(0, 3800))] : []),
        BIG(),
        row(...extraButtons, ebtn(back, backLabel, emojis.returnArrow), ...(back === 'page' ? [] : [ebtn('page', 'Home', emojis.database)])),
    ]);
}
function noticeView(lines, backTo = 'page', backLabel = 'Back', crumbs = []) {
    return resultView({ crumbs, title: lines[0].replace(/^###\s*/, ''), body: lines.slice(1), back: backTo, backLabel, ok: !lines[0].includes(emojis.cross) });
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
            labelled('Send to', { type: 21, custom_id: 'dest', required: true, options: [{ value: 'file', label: 'A file here', default: true }, { value: 'dm', label: 'A DM to me' }] }),
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

// Search the way `build:` autocomplete does (every typed word must appear), plus one rule it lacks: a word shaped like a build tag (`1`, `1b`) must equal the build's own tag, so `fss 1b` finds Option B and not Option A. His click-test, 2026-11-07 12:55 EST: "shouldnt this have found the fss hurricane?" — the panel's old substring search needs the full name.
async function searchBuilds(query) {
    const choices = await require('./manage/loadouts').buildChoices(GROUP, query);
    const tags = String(query || '').toLowerCase().split(/\s+/).filter(w => /^\d+[a-z]?$/.test(w));
    return choices
        .filter(c => !String(c.value).startsWith('new:') && !/\(Delete\)$/.test(c.name))
        .filter(c => {
            if (!tags.length) return true;
            const m = / · (?:Build )?(\d+[a-z]?)(?: · |$)/i.exec(c.name);
            return m && tags.includes(m[1].toLowerCase());
        })
        .map(c => { const [id, opt] = String(c.value).split('~'); return { id, option: opt === undefined ? 0 : Number(opt), label: c.name }; });
}

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
    for (const line of String(namesRaw || '').split('\n').map(s => s.trim()).filter(Boolean)) {
        const cat = CATEGORY_WORDS[line.toLowerCase().replace(/^all\s+/, '')];
        if (cat) { all.filter(l => l.category === cat).forEach(add); continue; }
        const hits = await searchBuilds(line);
        if (!hits.length) { unmatched.push(line); continue; }
        for (const h of hits) { const d = all.find(l => String(l._id) === h.id); if (d) add(d); }
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

// One edit pop-up's submit, read and compared with the build as stored. Shared by a single Edit and the bulk stepper.
async function editDiff(interaction, id, option) {
    const doc = await Loadout().findById(id).lean();
    const siblings = await Loadout().find({ weaponKey: doc.weaponKey, mode: MODE }).lean();
    const before = require('../utils/loadoutForm').editValues(doc, siblings, require('../utils/adminParser').loadoutBadgeTokens(doc), Number(option) || 0);
    const now = {};
    for (const key of ['weapon', 'build', 'attachments', 'image_url']) { try { now[key] = interaction.fields.getTextInputValue(key) || ''; } catch { now[key] = ''; } }
    let shot = false;
    try { shot = (interaction.fields.getUploadedFiles('image_file')?.size || 0) > 0; } catch { shot = false; }
    const changes = semanticDiff(before, now);
    if (shot) changes.push('**Picture:** a new screenshot');
    return { doc, changes };
}

// ---------- Bulk edit: the ticked builds, one card at a time (his idea, 2026-11-07 13:05 EST: "select multiple builds and just switch through them like pages") ----------
async function stepView(token, i, option = null, header = null) {
    const t = TICK.get(token);
    if (!t || !t.ticked.size) return resultView({ title: 'That list expired. Select again.', ok: false });
    const ids = t.ids.filter(x => t.ticked.has(x));
    const n = ids.length;
    const at = Math.min(Math.max(Number(i) || 0, 0), n - 1);
    const key = ids[at];
    const { id, opt: keyOpt } = splitKey(key);
    const doc = await Loadout().findById(id).lean();
    const L = require('../utils/loadoutOptions').optionLetter;
    const count = 1 + (doc.variants || []).length;
    const opt = Math.min(Number(option ?? keyOpt) || 0, count - 1);
    t.edited = t.edited || new Set();
    const done = t.edited.size;
    const head = `### ${emojis.mngEdit} Bulk Edit · ${at + 1} of ${n}\n-# ${done} edited · ${n - done} to go${t.edited.has(key) ? ' · this one is edited' : ''}`;
    const rows = [];
    if (count > 1 && keyOpt === null) rows.push({ type: 1, components: [{ type: 3, custom_id: `${PREFIX}stopt|${token}|${at}`, placeholder: 'Pick an option', options: Array.from({ length: count }, (_, k) => ({ label: `Option ${L(k)}`, value: String(k), default: k === opt })) }] });
    const last = at === n - 1;
    rows.push(
        row(ebtn(`stedit|${token}|${at}|${opt}`, 'Edit', emojis.mngEdit, header ? 2 : 1), { type: 2, style: 2, custom_id: `${PREFIX}step|${token}|${at - 1}`, emoji: emojis.parseEmoji(emojis.left), disabled: at === 0 }, { type: 2, style: 2, label: `${at + 1} / ${n}`, custom_id: `${PREFIX}stcount|${token}`, disabled: true }, last ? ebtn(`stdone|${token}`, 'Finish', emojis.checkmark, header ? 3 : 2) : { type: 2, style: header ? 1 : 2, custom_id: `${PREFIX}step|${token}|${at + 1}`, emoji: emojis.parseEmoji(emojis.right) }),
        row(ebtn(`tlist|${token}`, 'Back to List', emojis.returnArrow), ebtn('page', 'Home', emojis.database)),
    );
    return cardView(id, opt, header ? `${head}\n${header}` : head, rows);
}

// What an edit changes, field by field, in words (his click-test critique: raw box text read as noise).
function semanticDiff(before, now) {
    const f = require('../utils/loadoutForm');
    const w0 = f.parseWeaponLabel(before.weapon), w1 = f.parseWeaponLabel(now.weapon);
    const i0 = f.parseIdentity(before.build, MODE), i1 = f.parseIdentity(now.build, MODE);
    const a0 = f.parseAttachmentsBadges(before.attachments), a1 = f.parseAttachmentsBadges(now.attachments);
    const out = [];
    const line = (label, x, y) => { if (String(x || '') !== String(y || '')) out.push(`**${label}:** ${x ? `~~${x}~~ ` : ''}${y || '*none*'}`); };
    line('Weapon', w0.weaponName, w1.weaponName);
    line('Label', w0.label, w1.label);
    if (!i1.error) { line('Class', i0.category, i1.category); line('Build #', i0.number, i1.number); line('Code', i0.code, i1.code); }
    else out.push(`${emojis.warn} ${i1.error}`);
    const gone = a0.attachments.filter(x => !a1.attachments.includes(x)), added = a1.attachments.filter(x => !a0.attachments.includes(x));
    if (gone.length || added.length) out.push(`**Attachments:** ${[...gone.map(x => `~~${x}~~`), ...added.map(x => `+ ${x}`)].join(' · ')}`);
    else if (a0.attachments.join('|') !== a1.attachments.join('|')) out.push('**Attachments:** same five, new order');
    line('Badges', a0.badgesRaw, a1.badgesRaw);
    line('Comment', a0.comment, a1.comment);
    if ((now.image_url || '').trim() && now.image_url.trim() !== (before.image_url || '').trim()) out.push('**Picture:** from the new URL');
    return out;
}

// ---------- Select's entries: a whole build (`id`) or one option (`id~opt`) ----------
// A typed line naming a build tag (`fss 1b`) ticks that option alone; names without a tag and the quick picks tick whole builds (his 13:13 EST: "if i type fss 1b, shouldnt it select 1b specifically?").
async function resolveKeys(namesRaw, picks) {
    const { builds } = await resolveSet('', picks || []);
    const keys = new Map();
    for (const b of builds) keys.set(String(b._id), shortName(b));
    const unmatched = [];
    const L = require('../utils/loadoutOptions').optionLetter;
    for (const line of String(namesRaw || '').split('\n').map(x => x.trim()).filter(Boolean)) {
        const cat = CATEGORY_WORDS[line.toLowerCase().replace(/^all\s+/, '')];
        if (cat) { (await Loadout().find({ mode: MODE, category: cat }).lean()).forEach(b => keys.set(String(b._id), shortName(b))); continue; }
        const tagged = /(^|\s)\d+[a-z]?(\s|$)/i.test(line);
        const hits = await searchBuilds(line);
        if (!hits.length) { unmatched.push(line); continue; }
        for (const h of hits) {
            const d = await Loadout().findById(h.id).lean();
            if (!d) continue;
            const merged = (d.variants || []).length > 0;
            if (tagged && merged) keys.set(`${h.id}~${h.option}`, `${d.weaponName} · ${d.buildName} · Option ${L(h.option)}${h.option ? (d.variants[h.option - 1].label ? ` · ${d.variants[h.option - 1].label}` : '') : (d.label ? ` · ${d.label}` : '')}`);
            else keys.set(h.id, shortName(d));
        }
    }
    return { keys: [...keys.entries()].map(([key, label]) => ({ key, label })), unmatched };
}
const splitKey = (key) => { const [id, opt] = String(key).split('~'); return { id, opt: opt === undefined ? null : Number(opt) }; };

// One entry as paste-format text: a whole build as the export writes it, one option as its own `Build: Build 1b` block.
async function keyBlocks(keys) {
    const { buildNumberOf } = require('../utils/loadoutForm');
    const { variantView } = require('../utils/loadoutRender');
    const fmt = require('../utils/adminParser').formatLoadoutsAsBulkText;
    const out = [];
    for (const key of keys) {
        const { id, opt } = splitKey(key);
        const d = await Loadout().findById(id).lean();
        if (!d) continue;
        if (opt === null) { out.push(fmt([d])); continue; }
        if (opt === 0) { out.push(fmt([{ ...d, variants: [] }])); continue; }
        const v = variantView(d, opt);
        const n = buildNumberOf(d.buildName);
        const lines = [`${d.weaponName} | ${d.category}`, `Build: Build ${n}${String.fromCharCode(97 + opt)}`];
        if (v.imageKey && !String(v.imageKey).startsWith('http')) lines.push(`Image: ${v.imageKey}`);
        if (v.shareCode) lines.push(`Code: ${v.shareCode}`);
        if (d.variants[opt - 1].label) lines.push(`Label: ${d.variants[opt - 1].label}`);
        lines.push(...(v.attachments || []).map(x => `- ${x}`));
        out.push(lines.join('\n'));
    }
    return out;
}

// A pop-up whose boxes hold paste-format blocks: up to 5 boxes of 4,000 characters, split between builds.
function blocksModal(customId, title, blocks) {
    const boxes = [];
    for (const b of blocks) {
        const lastBox = boxes[boxes.length - 1];
        if (lastBox && (lastBox.text + '\n\n' + b).length <= 4000) { lastBox.text += '\n\n' + b; lastBox.n += 1; }
        else boxes.push({ text: b.slice(0, 4000), n: 1 });
    }
    if (boxes.length > 5) return null;
    let start = 1;
    const components = boxes.map((box, i) => {
        const label = box.n === 1 ? `Build ${start}` : `Builds ${start}–${start + box.n - 1}`;
        start += box.n;
        return { type: 18, label, ...(i === 0 ? { description: 'Change anything; a build you leave as it is stays as it is.' } : {}), component: { type: 4, custom_id: `b${i}`, style: 2, required: false, max_length: 4000, value: box.text } };
    });
    return { custom_id: customId, title: title.slice(0, 45), components };
}

// The preview for pasted or edited blocks, shared by Paste and Select's Edit. An option block is compared with that option, not with its build.
async function previewBlocks(raw) {
    const { variantView } = require('../utils/loadoutRender');
    const tok = require('../utils/adminParser').loadoutBadgeTokens;
    const { parsed, errors } = require('../utils/adminParser').parseBulkLoadoutList(raw);
    const added = [], replaced = [], same = [];
    for (const e of parsed) {
        const m = /(\d+)([a-z])?$/i.exec(e.buildName || '');
        const base = m ? `Build ${m[1]}` : null;
        const opt = m && m[2] ? m[2].toLowerCase().charCodeAt(0) - 97 : 0;
        const shown = base ? `${base}${opt ? ` · Option ${m[2].toUpperCase()}` : ''}` : 'next build';
        const name = `${classIcon(e.category)} ${e.weaponName} · ${shown}`;
        const old = base ? await Loadout().findOne({ mode: MODE, weaponKey: e.weaponKey, buildName: base }).lean() : null;
        if (!old || opt > (old.variants || []).length) { added.push(name); continue; }
        const cmp = opt ? variantView(old, opt) : old;
        const diff = [];
        if (e.shareCode && e.shareCode !== cmp.shareCode) diff.push('code');
        if ((e.attachments || []).join('|') !== (cmp.attachments || []).join('|')) diff.push('attachments');
        if (!opt && tok(e).join(',') !== tok(old).join(',')) diff.push('badges');
        if (!(e.defaulted || []).includes('label') && (e.label || '') !== ((opt ? old.variants[opt - 1].label : old.label) || '')) diff.push('label');
        (diff.length ? replaced : same).push(`${name}${diff.length ? ` · *${diff.join(', ')}*` : ''}`);
    }
    const problems = errors.map(x => (typeof x === 'string' ? x : (x.message || JSON.stringify(x))));
    const parts = [];
    if (added.length) parts.push(`${emojis.mngAdd} **Added · ${added.length}**`, ...added.map(x => `- ${x}`), '');
    if (replaced.length) parts.push(`${emojis.mngBulkReplace} **Changed · ${replaced.length}**`, ...replaced.map(x => `- ${x}`), '');
    if (same.length) parts.push(`-# Unchanged · ${same.length}: ${same.map(x => x.replace(/^\S+ /, '')).join(', ')}`, '');
    if (problems.length) parts.push(`${emojis.warn} **Problems · ${problems.length}**`, ...problems.map(x => `- ${x}`), '');
    parts.push('-# Nothing is saved until you press Save.');
    return { parts, count: added.length + replaced.length, problems: problems.length, total: parsed.length };
}

// ---------- Select's tick list ----------
function tickView(token, note = null) {
    const t = TICK.get(token);
    if (!t) return resultView({ title: 'That list expired. Search again.', ok: false });
    const shown = t.ids.slice(0, 25);
    const components = [
        text(`${crumb('Select Builds')}\n## ${emojis.filter} Select Builds\n-# **${t.ids.length}** found · **${t.ticked.size}** ticked`),
    ];
    if (t.unmatched?.length) components.push(text(`-# ${emojis.warn} No build matched ${t.unmatched.map(x => `\`${x}\``).join(', ')}`));
    if (t.ids.length > 25) components.push(text(`-# Only 25 fit in one list; narrow the search for the other ${t.ids.length - 25}.`));
    if (note) components.push(text(note));
    components.push(BIG(), text('-# Tick the builds to act on…'));
    if (shown.length) components.push({ type: 1, components: [{ type: 3, custom_id: `${PREFIX}tick|${token}`, min_values: 0, max_values: shown.length, placeholder: 'Tick the builds', options: shown.map(id => ({ label: t.labels.get(id).slice(0, 100), value: id, default: t.ticked.has(id) })) }] });
    components.push(SMALL(), row(ebtn(`tedit|${token}`, `Edit ${t.ticked.size}`, emojis.mngEdit, 1, !t.ticked.size), ebtn(`step|${token}|0`, 'Expand View', emojis.gunsmithList, 2, !t.ticked.size), ebtn(`texp|${token}`, `Export ${t.ticked.size}`, emojis.mngExport, 2, !t.ticked.size), ebtn(`tdel|${token}`, `Delete ${t.ticked.size}`, emojis.mngBulkDelete, 4, !t.ticked.size)), row(ebtn('select', 'Search Again', emojis.gunsmithSearch), ebtn('page', 'Back', emojis.returnArrow)));
    return panel(components);
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
    const [, verb, a, b, c] = interaction.customId.split('|');
    const manage = require('../commands/manage');

    // Buttons and selects that only change the message
    if (verb === 'page') return show(interaction, await pageView());
    if (verb === 'add') return interaction.showModal({ ...reId(manage.buildAddLoadoutModal(MODE), `${PREFIX}addm`), title: 'Add MP Build' });
    if (verb === 'find') return interaction.showModal(searchModal('findm', 'Find a Build', 'Weapon, build or label', 'BAL-27 · BAL-27 2 · STATIC-HV 2b · Ranked', 'BAL-27 2'));
    if (verb === 'paste') {
        const last = a ? PASTE.get(a) : '';
        const modal = reId(manage.buildLoadoutsBulkAddModal(MODE), `${PREFIX}pastem`);
        if (last) for (const r of modal.components) for (const c of r.components || []) if (c.custom_id === 'bulk_text') c.value = last.slice(0, 4000);
        return interaction.showModal({ ...modal, title: 'Paste MP Builds' });
    }
    if (verb === 'select') return interaction.showModal(selectModal());
    if (verb === 'export') return interaction.showModal(exportModal());
    if (verb === 'guide') {
        const action = require('../utils/manageActions').ACTIONS_BY_PAGE[GROUP].find(x => x.id === 'formatguide');
        return action.run({ interaction, page: GROUP, manageCommand: manage });
    }
    if (verb === 'cls') return show(interaction, await classView(a));
    if (verb === 'wpn') return show(interaction, await weaponView(interaction.values[0]));
    if (verb === 'wback') return show(interaction, await weaponView(a));
    if (verb === 'newb') {
        const siblings = await Loadout().find({ weaponKey: a, mode: MODE }).lean();
        const first = siblings[0];
        return interaction.showModal(reId(manage.prefillModal(manage.buildAddLoadoutModal(MODE), { weapon: first.weaponName, build: `${first.category}, ${siblings.length + 1}, ` }), `${PREFIX}addm`));
    }
    if (verb === 'pick') return show(interaction, await cardView(...interaction.values[0].split('~')));
    if (verb === 'opt') return show(interaction, await cardView(a, interaction.values[0]));
    if (verb === 'card') return show(interaction, await cardView(a, b));
    if (verb === 'edit') {
        const doc = await Loadout().findById(a).lean();
        if (!doc) return show(interaction, await pageView(`${emojis.cross} That build no longer exists.`));
        const L = require('../utils/loadoutOptions').optionLetter;
        const title = `Edit ${doc.weaponName} ${doc.buildName}${(doc.variants || []).length ? ` · ${L(Number(b) || 0)}` : ''}`.slice(0, 45);
        return interaction.showModal({ ...reId(await require('./manage/loadouts').editLoadoutModal(doc, Number(b) || 0), `${PREFIX}editm|${a}|${b}`), title });
    }
    if (verb === 'move') {
        const doc = await Loadout().findById(a).lean();
        const { buildNumberOf } = require('../utils/loadoutForm');
        const tag = require('../utils/loadoutOptions').optionTag(buildNumberOf(doc.buildName), Number(b) || 0);
        return interaction.showModal({ custom_id: `${PREFIX}movem|${a}|${b}`, title: `Move ${doc.weaponName} ${doc.buildName}`.slice(0, 45), components: [labelled('New build #', { type: 4, custom_id: 'to', style: 1, required: true, max_length: 4, value: String(tag), placeholder: '3 · 2b' }, 'A number swaps with that build. A letter makes it an option of that build.')] });
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
        return show(interaction, await cardView(a, b, `### ${emojis.warn} Delete ${doc.weaponName} ${doc.buildName}${merged ? `, Option ${L(Number(b) || 0)}` : ''}?\n-# ${merged ? 'Only this option goes; the ones after it move up a letter.' : 'The build goes; every change can be reverted.'}`, [row(ebtn(`delok|${a}|${b}`, 'Yes, Delete', emojis.mngDelete, 4), ebtn(`card|${a}|${b}`, 'Cancel', emojis.returnArrow))]));
    }
    if (verb === 'delok') {
        const doc = await Loadout().findById(a).lean();
        return show(interaction, resultView({ ok: 'warn', crumbs: doc ? [classWord(doc.category), doc.weaponName] : [], title: `Would delete ${doc ? `${doc.weaponName} ${doc.buildName}` : 'that build'}`, body: ['-# Nothing was deleted.'], back: doc ? `wback|${doc.weaponKey}` : 'page', backLabel: doc ? doc.weaponName : 'Back' }));
    }
    if (verb === 'tick') {
        const t = TICK.get(a);
        if (t) t.ticked = new Set(interaction.values);
        return show(interaction, tickView(a));
    }
    if (verb === 'tlist') return show(interaction, tickView(a));
    if (verb === 'step') return show(interaction, await stepView(a, b));
    if (verb === 'stopt') return show(interaction, await stepView(a, b, interaction.values[0]));
    if (verb === 'stedit') {
        const t = TICK.get(a);
        const ids = t ? t.ids.filter(x => t.ticked.has(x)) : [];
        const doc = await Loadout().findById(splitKey(ids[Number(b)] || '').id).lean();
        if (!doc) return show(interaction, resultView({ title: 'That list expired. Select again.', ok: false }));
        const L = require('../utils/loadoutOptions').optionLetter;
        const title = `Edit ${doc.weaponName} ${doc.buildName}${(doc.variants || []).length ? ` · ${L(Number(c) || 0)}` : ''}`.slice(0, 45);
        return interaction.showModal({ ...reId(await require('./manage/loadouts').editLoadoutModal(doc, Number(c) || 0), `${PREFIX}steditm|${a}|${b}|${c}`), title });
    }
    if (verb === 'steditm') {
        const t = TICK.get(a);
        const ids = t ? t.ids.filter(x => t.ticked.has(x)) : [];
        const { changes } = await editDiff(interaction, splitKey(ids[Number(b)] || '').id, c);
        if (t && changes.length) { t.edited = t.edited || new Set(); t.edited.add(ids[Number(b)]); }
        return show(interaction, await stepView(a, b, c, `${emojis.checkmark} **Would update**\n${changes.length ? changes.map(x => `> ${x}`).join('\n') : '> No changes.'}`));
    }
    if (verb === 'stdone') {
        const t = TICK.get(a);
        const ids = t ? t.ids.filter(x => t.ticked.has(x)) : [];
        const edited = ids.filter(x => t?.edited?.has(x));
        return show(interaction, resultView({ crumbs: ['Select Builds', 'Bulk Edit'], title: `Bulk edit done · ${edited.length} of ${ids.length} edited`, body: [...ids.map(x => `- ${t.edited?.has(x) ? emojis.checkmark : '·'} ${t.labels.get(x)}`), '', '-# Nothing was saved.'], back: `tlist|${a}`, backLabel: 'Back to List' }));
    }
    if (verb === 'tdel') {
        const t = TICK.get(a);
        if (!t) return show(interaction, tickView(a));
        return show(interaction, resultView({ ok: 'warn', crumbs: ['Select Builds'], title: `Delete ${t.ticked.size} build${t.ticked.size === 1 ? '' : 's'}?`, body: [...[...t.ticked].map(id => `- ${t.labels.get(id)}`), '', '-# Every change is recorded and can be reverted.'], back: `tlist|${a}`, backLabel: 'Cancel', extraButtons: [ebtn(`tdelok|${a}`, `Yes, Delete ${t.ticked.size}`, emojis.mngBulkDelete, 4)] }));
    }
    if (verb === 'tdelok') {
        const t = TICK.get(a);
        return show(interaction, resultView({ ok: 'warn', crumbs: ['Select Builds'], title: `Would delete ${t ? t.ticked.size : 0} builds`, body: ['-# Nothing was deleted.'], back: `tlist|${a}`, backLabel: 'Back to List' }));
    }
    if (verb === 'texp') {
        const t = TICK.get(a);
        const blocks = t ? await keyBlocks(t.ids.filter(x => t.ticked.has(x))) : [];
        return interaction.reply({ content: `${blocks.length} builds`, files: [{ attachment: Buffer.from(blocks.join('\n\n'), 'utf-8'), name: 'mp-builds.txt' }], flags: 64 });
    }
    // Select's Edit: the ticked builds as one big text pop-up (his 13:13 EST: "edit 3 should open them as a large text field").
    if (verb === 'tedit') {
        const t = TICK.get(a);
        if (!t) return show(interaction, tickView(a));
        const raw = b ? PASTE.get(b) : null;
        const blocks = raw ? raw.split(/\n\s*\n/).filter(x => x.trim()) : await keyBlocks(t.ids.filter(x => t.ticked.has(x)));
        const modal = blocksModal(`${PREFIX}teditm|${a}`, `Edit ${t.ticked.size} MP Build${t.ticked.size === 1 ? '' : 's'}`, blocks);
        if (!modal) return show(interaction, tickView(a, `${emojis.warn} Too much text for one pop-up (5 boxes of 4,000). Tick fewer builds, or use Expand View.`));
        return interaction.showModal(modal);
    }
    if (verb === 'teditm') {
        const raw = [0, 1, 2, 3, 4].map(k => { try { return interaction.fields.getTextInputValue(`b${k}`) || ''; } catch { return ''; } }).filter(x => x.trim()).join('\n\n');
        const token = Date.now().toString(36);
        PASTE.set(token, raw);
        const pv = await previewBlocks(raw);
        return show(interaction, resultView({ ok: pv.problems ? 'warn' : true, crumbs: ['Select Builds', 'Edit'], title: `Edit preview · ${pv.count} of ${pv.total} changed`, body: pv.parts, back: `tedit|${a}|${token}`, backLabel: 'Edit Again', extraButtons: pv.count ? [ebtn(`pasteok|${token}`, `Save ${pv.count}`, emojis.checkmark, 3)] : [] }));
    }

    // Pop-up submits
    if (verb === 'findm') {
        const q = interaction.fields.getTextInputValue('q');
        const hits = await searchBuilds(q);
        if (!hits.length) return show(interaction, await pageView(`${emojis.cross} No build matches \`${q.slice(0, 60)}\`. Try fewer words, or browse by class.`));
        if (hits.length === 1) return show(interaction, await cardView(hits[0].id, hits[0].option));
        const docs = await Loadout().find({ _id: { $in: [...new Set(hits.map(h => h.id))] } }).select('weaponKey weaponName').lean();
        const keys = new Set(docs.map(d => d.weaponKey));
        if (keys.size === 1) return show(interaction, await weaponView([...keys][0], `-# ${emojis.gunsmithSearch} Every match for \`${q.slice(0, 40)}\` is a ${docs[0].weaponName} build.`));
        return show(interaction, panel([
            text(`${crumb('Search')}\n## ${emojis.gunsmithSearch} ${hits.length} builds match \`${q.slice(0, 60)}\``),
            BIG(), text('-# Pick one…'),
            { type: 1, components: [{ type: 3, custom_id: `${PREFIX}pick`, placeholder: 'Pick a build', options: hits.slice(0, 25).map(h => ({ label: h.label.slice(0, 100), value: `${h.id}~${h.option}` })) }] },
            SMALL(), row(ebtn('find', 'Search Again', emojis.gunsmithSearch), ebtn('page', 'Back', emojis.returnArrow)),
        ]));
    }
    if (verb === 'addm') {
        const f = require('../utils/loadoutForm');
        const { weaponName, label } = f.parseWeaponLabel(interaction.fields.getTextInputValue('weapon'));
        const id = f.parseIdentity(interaction.fields.getTextInputValue('build'), MODE);
        if (id.error) return show(interaction, resultView({ title: 'That build needs a fix', body: [id.error], ok: false }));
        const { attachments, badgesRaw, comment } = f.parseAttachmentsBadges(interaction.fields.getTextInputValue('attachments'));
        const badges = require('../utils/adminParser').parseLoadoutBadges(badgesRaw, MODE);
        const tag = id.number ? require('../utils/loadoutOptions').optionTag(id.number, id.option || 0) : 'next #';
        return show(interaction, noticeView([
            `Would add ${weaponName} · Build ${tag}`,
            `${classIcon(id.category)} **${classWord(id.category)}**${label ? ` · ${label}` : ''}`,
            `**Code:** \`${id.code || '—'}\``,
            badgesRaw ? `**Badges:** ${badgesRaw}` : null,
            comment ? `**Comment:** ${comment}` : null,
            '',
            '### Attachments', ...attachments.map((x, i) => `${i + 1}. \`${x}\``), '', '-# Nothing was saved.',
            ...(badges.unrecognized.length ? [`${emojis.warn} Badges not understood: ${badges.unrecognized.join(', ')}`] : []),
        ].filter(x => x !== null)));
    }
    if (verb === 'editm') {
        const { doc, changes } = await editDiff(interaction, a, b);
        return show(interaction, await cardView(a, b, `### ${emojis.checkmark} Would update ${doc.weaponName} ${doc.buildName}\n${changes.length ? changes.map(x => `> ${x}`).join('\n') : '> No changes.'}\n-# Nothing was saved.`, [row(ebtn(`edit|${a}|${b}`, 'Edit Again', emojis.mngEdit, 1), ebtn(`card|${a}|${b}`, 'Back to Build', emojis.returnArrow), ebtn('page', 'Home', emojis.database))]));
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
        const lines = [`Would move ${doc.weaponName} ${doc.buildName} to \`${to}\``];
        if (/[a-z]$/.test(to)) lines.push(there ? `It becomes an option of **${there.buildName}**${there.label ? ` (${there.label})` : ''}.` : `There is no Build ${n} to join.`);
        else if (there) lines.push(`**${there.buildName}**${there.label ? ` (${there.label})` : ''} becomes **${doc.buildName}**: the two swap.`);
        lines.push('', '-# Nothing was moved.');
        return show(interaction, noticeView(lines, `card|${a}|${b}`, 'Back to Build', [classWord(doc.category), doc.weaponName, doc.buildName]));
    }
    if (verb === 'pastem') {
        const raw = interaction.fields.getTextInputValue('bulk_text');
        const token = Date.now().toString(36);
        PASTE.set(token, raw);
        const pv = await previewBlocks(raw);
        return show(interaction, resultView({ ok: pv.problems ? 'warn' : true, crumbs: ['Paste Builds'], title: `Paste preview · ${pv.total} build${pv.total === 1 ? '' : 's'}`, body: pv.parts, back: `paste|${token}`, backLabel: 'Edit Paste', extraButtons: pv.total ? [ebtn(`pasteok|${token}`, `Save ${pv.total}`, emojis.checkmark, 3)] : [] }));
    }
    if (verb === 'pasteok') return show(interaction, resultView({ title: 'Would save these builds', body: ['-# Nothing was saved.'], back: 'page', backLabel: 'Home' }));
    if (verb === 'selectm') {
        const { keys, unmatched } = await resolveKeys(field(interaction, 'names'), field(interaction, 'picks') || []);
        const token = Date.now().toString(36);
        TICK.set(token, { ids: keys.map(k => k.key), ticked: new Set(), labels: new Map(keys.map(k => [k.key, k.label])), unmatched });
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
module.exports = { handleMockManageInteraction, OWNED_PREFIXES, mock: { TICK, stepView, resolveKeys, keyBlocks, blocksModal, previewBlocks, openPage, pageView, classView, weaponView, cardView, exportModal, selectModal, exportText, resolveSet, PREFIX } };
