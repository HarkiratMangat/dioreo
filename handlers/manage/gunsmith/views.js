// ==========================================
// /manage gunsmith — the panels and pop-ups
// ==========================================
// Part of the /manage gunsmith rehaul (2026-11-07 14:08 EST, local/project/features/manage-rehaul/spec.md, approved "go ahead" 13:58 EST). Built from the /mockmanage mock-up he click-tested and called fine at 13:53 EST. Every function here only BUILDS a message or a pop-up; routing, permission checks and saves are in ./index.js.
//
// House style (the MP Gunsmiths landing, v3.12.0): `## <emoji> Title` + the season in bold italic · a spacing-2 divider between parts, a spacing-1 gap inside one · a `-#` hint above each button group (`-#` only works at the start of a line) · buttons carry an emoji, Title Case, grey unless they are the main action. His icon picks (13:38 EST): Expand for Expand View, DeleteBin for delete, CopyExport for export, Edit for edit, Return for Home and Back. His wording (13:21 EST): "select", never "tick".
//
// custom_ids: `mng_gs|<M|D>|<verb>|…`, at most 100 characters (asserted). `mng_` puts every click behind the router's /manage admin lock (handlers/router.js MANAGE_PREFIX_COMMAND); ./index.js checks each action's own tier with resolveAction.

const emojis = require('../../../utils/emojiMap');
const { splitKey, classIcon, classWord, badgeWords, quickPicks } = require('./search');

const Loadout = () => require('../../../models/Loadout');
const MODE_CHAR = { MP: 'M', DMZ: 'D' };
const MODE_OF = { M: 'MP', D: 'DMZ' };

function ID(mode, ...parts) {
    const id = ['mng_gs', MODE_CHAR[mode], ...parts.map(p => (p === undefined || p === null ? '' : String(p)))].join('|');
    if (id.length > 100) throw new Error(`gunsmith custom_id over 100 characters: ${id}`);
    return id;
}

const row = (...buttons) => ({ type: 1, components: require('../../../utils/returnFirst').returnFirst(buttons) });
const text = (content) => ({ type: 10, content });
const BIG = () => ({ type: 14, divider: true, spacing: 2 });
const SMALL = () => ({ type: 14, divider: false, spacing: 1 });
const btn = (mode, parts, label, emojiStr, style = 2, disabled = false) => ({ type: 2, style, ...(label ? { label } : {}), custom_id: ID(mode, ...[].concat(parts)), disabled, ...(emojiStr ? { emoji: emojis.parseEmoji(emojiStr) } : {}) });
const arrow = (mode, parts, dir, disabled) => ({ type: 2, style: 2, custom_id: ID(mode, ...[].concat(parts)), emoji: emojis.parseEmoji(dir === 'left' ? emojis.left : emojis.right), disabled });
const counter = (mode, parts, label) => ({ type: 2, style: 2, label, custom_id: ID(mode, ...[].concat(parts)), disabled: true });
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const ACCENT = (mode) => require('../../../utils/loadoutPanels').ACCENT[mode];
const titleEmoji = (mode) => (mode === 'DMZ' ? emojis.dmz : emojis.database);
const crumb = (mode, ...parts) => `-# ${[`${mode} Gunsmith`, ...parts].join('  ›  ')}`;
const panel = (mode, components, after = []) => [{ type: 17, accent_color: ACCENT(mode), components }, ...after];
const homeBtn = (mode) => btn(mode, 'page', 'Home', emojis.returnArrow);

async function seasonLine() {
    const doc = await require('../../../models/SeasonalData').findOne({ docType: 'global' }).lean();
    if (!doc?.currentSeasonTitle) return '';
    const emoji = require('../../../utils/seasonEmoji').seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji);
    return `\n${emoji ? `${emoji} ` : ''}${require('../../../utils/titleBlock').toBoldItalicUnicode(doc.currentSeasonTitle)}`;
}

// ---------- home ---------- `pageRow` is /manage's section dropdown (commands/manage.js buildPageSelectRow), under the panel so the other sections stay one pick away.
async function pageView(mode, note = null, { pageRow = null } = {}) {
    const builds = await Loadout().find({ mode }).select('category weaponKey').lean();
    const weapons = new Set(builds.map(b => b.weaponKey)).size;
    const { CLASS_ORDER } = require('../../../utils/loadoutRender');
    const present = CLASS_ORDER.filter(c => builds.some(b => b.category === c));
    const classBtn = (c) => btn(mode, ['cls', c], classWord(c), classIcon(c));
    const components = [text(`## ${titleEmoji(mode)} ${mode} Gunsmith${await seasonLine()}\n-# ${plural(builds.length, 'build')} · ${plural(weapons, 'weapon')}`)];
    if (note) components.push(SMALL(), text(note));
    components.push(
        BIG(),
        text('-# Go straight to a build…'),
        row(btn(mode, 'find', 'Search Builds', emojis.gunsmithSearch, 1), btn(mode, 'add', 'Add Build', emojis.mngAdd, 3)),
    );
    if (present.length) components.push(SMALL(), text('-# Or browse by class…'), row(...present.slice(0, 4).map(classBtn)), ...(present.length > 4 ? [row(...present.slice(4).map(classBtn))] : []));
    components.push(
        BIG(),
        text('-# Many builds at once…'),
        // Select Builds left (2026-11-11 15:15 EST, his go: the draws redesign carried to gunsmith): Search takes words and quick picks, and selecting happens on the results.
        row(btn(mode, 'paste', 'Bulk Paste', emojis.pasteImport), btn(mode, 'export', 'Export', emojis.copyExport), btn(mode, 'guide', 'Guide', emojis.guide)),
    );
    return panel(mode, components, pageRow ? [pageRow] : []);
}

// ---------- a class: its weapons ----------
async function classView(mode, category) {
    const builds = await Loadout().find({ mode, category }).select('weaponName weaponKey').lean();
    const byWeapon = new Map();
    for (const b of builds) byWeapon.set(b.weaponKey, { name: b.weaponName, n: (byWeapon.get(b.weaponKey)?.n || 0) + 1 });
    const weapons = [...byWeapon.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
    const components = [text(`${crumb(mode, classWord(category))}\n## ${classIcon(category)} ${classWord(category)}\n-# ${plural(weapons.length, 'weapon')} · ${plural(builds.length, 'build')}`), BIG()];
    if (!weapons.length) components.push(text(`${emojis.cross} No ${mode} ${classWord(category)} builds yet.`));
    else {
        components.push(text('-# Pick a weapon…'), { type: 1, components: [{ type: 3, custom_id: ID(mode, 'wpn'), placeholder: `${weapons.length} ${classWord(category)} weapons`, options: weapons.slice(0, 25).map(([key, w]) => ({ label: w.name.slice(0, 100), value: key, description: plural(w.n, 'build') })) }] });
        if (weapons.length > 25) components.push(text(`-# ${emojis.warn} ${weapons.length - 25} more: use Search Builds.`));
    }
    components.push(BIG(), row(homeBtn(mode)));
    return panel(mode, components);
}

// ---------- a weapon: every build ----------
async function weaponView(mode, weaponKey, note = null) {
    const { compareBuilds } = require('../../../utils/loadoutForm');
    const builds = (await Loadout().find({ mode, weaponKey }).lean()).sort(compareBuilds);
    if (!builds.length) return pageView(mode, `${emojis.cross} That weapon has no ${mode} builds.`);
    const w = builds[0];
    const components = [text(`${crumb(mode, classWord(w.category), w.weaponName)}\n## ${classIcon(w.category)} ${w.weaponName}\n-# ${plural(builds.length, 'build')}`)];
    if (note) components.push(SMALL(), text(note));
    components.push(BIG());
    for (const b of builds) {
        const opts = (b.variants || []).length;
        const sub = [b.label, badgeWords(b).join(' '), opts ? `${opts + 1} options` : null].filter(Boolean).join(' · ');
        components.push({ type: 9, components: [text(sub ? `**${b.buildName}**\n-# ${sub}` : `**${b.buildName}**`)], accessory: btn(mode, ['card', b._id, 0], 'Open', emojis.edit) });
    }
    components.push(BIG(), row(btn(mode, ['newb', weaponKey], 'New Build', emojis.mngAdd, 3)), row(btn(mode, ['cls', w.category], classWord(w.category), emojis.returnArrow), homeBtn(mode)));
    return panel(mode, components);
}

// ---------- one build ---------- `header` sits above the card (a confirm question, a saved note); `extra` replaces the action rows (a confirm's buttons, the Expand View pager). `back` is a Select token: the card was opened from a search's selection, so its way back is those results (the draws card's `t:<token>`), carried through the option menu, Edit, Move and Delete's Cancel. Added 2026-11-11 16:52 EST (think-pass: the card opened from one selected build had no way back to the results).
async function cardView(mode, id, option = 0, header = null, extra = null, back = null) {
    const doc = /^[0-9a-f]{24}$/.test(String(id)) ? await Loadout().findById(id).lean() : null;
    if (!doc || doc.mode !== mode) return pageView(mode, `${emojis.cross} That build no longer exists.`);
    const { buildLoadoutCardBody, variantCount } = require('../../../utils/loadoutRender');
    const lo = require('../../../utils/loadoutOptions');
    const count = variantCount(doc);
    const opt = Math.min(Math.max(Number(option) || 0, 0), count - 1);
    const siblings = (await Loadout().find({ mode, weaponKey: doc.weaponKey }).select('buildName').lean()).sort(require('../../../utils/loadoutForm').compareBuilds);
    const index = Math.max(0, siblings.findIndex(x => String(x._id) === String(doc._id)));
    const components = [text(crumb(mode, classWord(doc.category), doc.weaponName, `${doc.buildName}${count > 1 ? ` · Option ${lo.optionLetter(opt)}` : ''}`))];
    if (header) components.push(text(header), SMALL());
    // The card's picture is the /gunsmith card's own full-width gallery: a thumbnail beside the attachments squeezed each name onto two lines on a phone (his call, 2026-11-07 15:51 EST: "thumbnail instead of large image looks a bit too squished").
    components.push(...buildLoadoutCardBody(doc, { variant: opt, index, total: siblings.length }), BIG());
    if (extra) components.push(...extra);
    else {
        if (count > 1) components.push({ type: 1, components: [{ type: 3, custom_id: back ? ID(mode, 'opt', id, back) : ID(mode, 'opt', id), placeholder: 'Pick an option', options: Array.from({ length: count }, (_, i) => ({ label: `Option ${lo.optionLetter(i)}`, value: String(i), default: i === opt })) }] });
        const room = count < lo.MAX_OPTIONS;
        components.push(
            row(btn(mode, ['edit', id, opt, ...(back ? [back] : [])], 'Edit', emojis.edit, 1), btn(mode, ['move', id, opt, ...(back ? [back] : [])], 'Move', emojis.mngBulkReplace), ...(room ? [btn(mode, ['newopt', id, opt], 'Add Option', emojis.mngAdd)] : []), btn(mode, ['del', id, opt, ...(back ? [back] : [])], 'Delete', emojis.deleteBin, 4)),
            row(back ? btn(mode, ['list', back, 0], 'Results', emojis.returnArrow) : btn(mode, ['wback', doc.weaponKey], doc.weaponName, emojis.returnArrow), homeBtn(mode)),
        );
    }
    return panel(mode, components);
}

// ---------- a result in place ---------- `ok`: true ✅ · 'warn' ⚠️ · false ❌. `back` is the verb parts of the way back; Home is added unless back IS home.
function resultView(mode, { crumbs = [], title, body = [], back = 'page', backLabel = 'Back', ok = true, extraButtons = [], extraRows = [] }) {
    const backParts = [].concat(back);
    return panel(mode, [
        ...(crumbs.length ? [text(crumb(mode, ...crumbs))] : []),
        text(`### ${ok === 'warn' ? emojis.warn : ok ? emojis.checkmark : emojis.cross} ${title}`),
        ...(body.length ? [SMALL(), text(body.join('\n').slice(0, 3800))] : []),
        BIG(),
        ...extraRows,
        row(...extraButtons, btn(mode, backParts, backLabel, emojis.returnArrow), ...(backParts[0] === 'page' ? [] : [homeBtn(mode)])),
    ]);
}

// ---------- Select ---------- Redesigned 2026-11-07 13:19 EST (his ask to improve this panel's design significantly): the list IS the panel, one short two-line row per entry with its selected mark; the dropdown flips selection; Select All N / Clear; the actions say how many they act on. 10 rows a page (13:30 EST, after his "have you tested the limit"): about one phone screen, well under 40 components and 4,000 characters.
const SELECT_PAGE = 10;

// One build's line for a list, with a tick when it is selected.
const buildLine = (i, mark) => `${mark}${i.icon} ${i.title}${i.small ? `\n-# ${emojis.blank}${emojis.blank} ${i.small}` : ''}`;
const buildOption = (i, key) => ({ label: i.plain.slice(0, 100), value: key, ...(i.plainSmall ? { description: i.plainSmall.slice(0, 100) } : {}), ...(i.emojiKey && emojis[i.emojiKey] ? { emoji: emojis.parseEmoji(emojis[i.emojiKey]) } : {}) });
// The results of a search (the draws redesign): a tick on what is selected, one Select menu, Select All, and View Selected once something is.
function resultsView(mode, token, sel, info, note = null, page = 0) {
    const selected = new Set(sel.selected || []);
    const pages = Math.max(1, Math.ceil(sel.ids.length / SELECT_PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = sel.ids.slice(pg * SELECT_PAGE, pg * SELECT_PAGE + SELECT_PAGE);
    const n = sel.ids.filter(k => selected.has(k)).length;
    const searched = (sel.query || []).join(' · ');
    const components = [text(`${crumb(mode, 'Results')}\n## ${emojis.gunsmithSearch} ${sel.ids.length} build${sel.ids.length === 1 ? '' : 's'}${searched || pages > 1 || n ? `\n-# ${[searched.slice(0, 300), pages > 1 ? `page ${pg + 1} of ${pages}` : '', n ? `${emojis.check} ${n} selected` : ''].filter(Boolean).join(' · ')}` : ''}`)];
    if (sel.unmatched?.length) components.push(text(`-# ${emojis.warn} Nothing matched ${sel.unmatched.map(x => `\`${x}\``).join(', ').slice(0, 600)}`));
    components.push(BIG());
    if (!sel.ids.length) {
        components.push(text(`${emojis.cross} **No builds found.** Try fewer words, a class like \`smg\`, or a quick pick.`), BIG(), row(homeBtn(mode), btn(mode, 'find', 'Search Again', emojis.gunsmithSearch, 1)));
        return panel(mode, components);
    }
    let listText = shown.map(k => (info.get(k) ? buildLine(info.get(k), selected.has(k) ? `${emojis.check} ` : '') : `${emojis.cross} *a build that no longer exists*`)).join('\n');
    if (listText.length > 3900) listText = `${listText.slice(0, 3850)}\n-# …`;
    components.push(text(listText), SMALL());
    const options = shown.filter(k => info.get(k)).map(k => buildOption(info.get(k), k));
    if (options.length) components.push({ type: 1, components: [{ type: 3, custom_id: ID(mode, 'spick', token, pg), min_values: 1, max_values: options.length, placeholder: 'Select one to open it, or more to change together…', options }] });
    if (pages > 1) components.push(row(arrow(mode, ['list', token, pg - 1], 'left', pg === 0), counter(mode, ['pgn', token], `Page ${pg + 1} / ${pages}`), arrow(mode, ['list', token, pg + 1], 'right', pg === pages - 1)));
    if (note) components.push(text(note));
    components.push(BIG(), row(homeBtn(mode), btn(mode, 'find', 'Search Again', emojis.gunsmithSearch), btn(mode, ['all', token, pg], sel.ids.length === 1 ? 'Select It' : `Select All ${sel.ids.length}`, emojis.checkmark, 2, n === sel.ids.length), ...(n ? [btn(mode, ['slist', token, 0], `View Selected · ${n}`, emojis.filter, 1)] : [])));
    return panel(mode, components);
}
// The Selected view (the draws redesign): none selected is the results; one is that build's card (index.js selectPanel); more are the set, with Edit N, Expand View, Export N and Delete N.
function selectView(mode, token, sel, info, note = null, page = 0) {
    const on = new Set(sel.selected || []);
    const picked = sel.ids.filter(k => on.has(k));
    if (!picked.length) return resultsView(mode, token, sel, info, note, page);
    const n = picked.length;
    const searched = (sel.query || []).join(' · ');
    const components = [text(`${crumb(mode, 'Results', 'Selected')}\n## ${emojis.checkmark} ${n} selected${searched ? `\n-# From ${searched.slice(0, 300)}` : ''}`)];
    if (note) components.push(SMALL(), text(note));
    let listText = picked.slice(0, 25).map(k => (info.get(k) ? buildLine(info.get(k), '') : `${emojis.cross} *a build that no longer exists*`)).join('\n') + (n > 25 ? `\n-# and ${n - 25} more` : '');
    if (listText.length > 3500) listText = `${listText.slice(0, 3450)}\n-# …`;
    components.push(BIG(), text(listText));
    const options = picked.slice(0, 25).filter(k => info.get(k)).map(k => buildOption(info.get(k), k));
    if (options.length) components.push({ type: 1, components: [{ type: 3, custom_id: ID(mode, 'sunpick', token), min_values: 1, max_values: options.length, placeholder: 'Unselect builds…', options }] });
    components.push(
        BIG(),
        text(`-# With the **${n}** selected…`),
        row(btn(mode, ['tedit', token, page], `Edit ${n}`, emojis.edit, 1), btn(mode, ['step', token, 0], 'Expand View', emojis.expand, 2), btn(mode, ['texp', token], `Export ${n}`, emojis.copyExport, 2), btn(mode, ['tdel', token, page], `Delete ${n}`, emojis.deleteBin, 4)),
        row(btn(mode, ['list', token, 0], 'Select More', emojis.returnArrow), homeBtn(mode), btn(mode, ['none', token, 0], 'Clear', emojis.cross)),
    );
    return panel(mode, components);
}

// ---------- Expand View: the selected entries, one card at a time ---------- His idea, 13:05 EST ("select multiple builds and just switch through them like pages"), and 13:17 EST: each Edit saves right away (the saved panel below carries Revert); Finish only says which were edited, read from each build's lastUpdated since the view opened.
async function stepView(mode, token, sel, i, option = null, header = null) {
    const selected = new Set(sel.selected);
    const keys = require('./search').collapseKeys(sel.ids.filter(k => selected.has(k)));
    if (!keys.length) return resultView(mode, { title: 'Nothing is selected any more.', ok: false, back: ['slist', token, 0], backLabel: 'Back to Selected' });
    const n = keys.length;
    const at = Math.min(Math.max(Number(i) || 0, 0), n - 1);
    const { id, opt: keyOpt } = splitKey(keys[at]);
    const doc = /^[0-9a-f]{24}$/.test(id) ? await Loadout().findById(id).lean() : null;
    if (!doc) return resultView(mode, { title: 'That build no longer exists.', ok: false, back: ['slist', token, 0], backLabel: 'Back to Selected' });
    const lo = require('../../../utils/loadoutOptions');
    const count = 1 + (doc.variants || []).length;
    const opt = Math.min(Number(option ?? keyOpt) || 0, count - 1);
    const edited = await editedSince(keys, sel.openedAt);
    const head = `### ${emojis.expand} Expand View · ${at + 1} of ${n}\n-# ${edited.size} edited · ${n - edited.size} to go${edited.has(id) ? ' · this one is edited' : ''}`;
    const rows = [];
    if (count > 1 && keyOpt === null) rows.push({ type: 1, components: [{ type: 3, custom_id: ID(mode, 'stopt', token, at), placeholder: 'Pick an option', options: Array.from({ length: count }, (_, k) => ({ label: `Option ${lo.optionLetter(k)}`, value: String(k), default: k === opt })) }] });
    const last = at === n - 1;
    rows.push(
        row(
            btn(mode, ['stedit', token, at, opt], 'Edit', emojis.edit, 1),
            arrow(mode, ['step', token, at - 1], 'left', at === 0),
            // No n / N counter button: the heading already says "1 of 19", and at phone width a fourth button pushed Finish onto its own line (click-test, 2026-11-07 14:32 EST).
            last ? btn(mode, ['stdone', token], 'Finish', emojis.checkmark, 3) : arrow(mode, ['step', token, at + 1], 'right', false),
        ),
        row(btn(mode, ['slist', token, 0], 'Back to Selected', emojis.returnArrow), homeBtn(mode)),
    );
    return cardView(mode, id, opt, header ? `${head}\n${header}` : head, rows);
}

// Build ids among `keys` saved since `since` (an option's edit stamps its build).
async function editedSince(keys, since) {
    if (!since) return new Set();
    const ids = [...new Set(keys.map(k => splitKey(k).id))].filter(x => /^[0-9a-f]{24}$/.test(x));
    const docs = await Loadout().find({ _id: { $in: ids }, lastUpdated: { $gt: since } }).select('_id').lean();
    return new Set(docs.map(d => String(d._id)));
}

// ---------- pop-ups ----------
const labelled = (label, component, description) => ({ type: 18, label, ...(description ? { description } : {}), component });
const NAMES_PLACEHOLDER = { MP: 'BAL-27\nHOLGER 26 1b\nSMG', DMZ: 'M4\nKILO 141 2\nSMG' };

const quickPickSelect = (mode) => { const picks = quickPicks(mode); return require('../../../utils/formChoice').asChoice({ type: 3, custom_id: 'picks', required: false, min_values: 0, max_values: picks.length, placeholder: 'Pick any', options: picks.map(([value, label]) => ({ value, label })) }); };
// Search Builds (the draws redesign): names, one per line, and the quick picks. Lines widen each other, picks narrow them; both blank is every build.
function searchModal(mode) {
    return {
        custom_id: ID(mode, 'findm'), title: `Search ${mode} Builds`,
        components: [
            labelled('Weapons, builds or labels', { type: 4, custom_id: 'q', style: 2, required: false, max_length: 1000, placeholder: 'BAL-27 2\nSTATIC-HV 2b\nRanked' }, 'One per line: a weapon, a build like BAL-27 2, or a label. Blank: every build.'),
            labelled('Quick picks', quickPickSelect(mode), 'Picks narrow the names. Both blank: every build.'),
        ],
    };
}

const namesBox = (mode) => labelled('Weapons, builds or classes', { type: 4, custom_id: 'names', style: 2, required: false, max_length: 2000, placeholder: NAMES_PLACEHOLDER[mode] }, 'One per line. Added to the quick picks below.');


// One pop-up for every export (his ask, 11:22 EST): names + quick picks as one union, where it goes, what each block carries, and how merged builds are written. Discord's radio group (21) and checkbox group (22) pop-up parts.
function exportModal(mode) {
    const fields = [['code', 'Gunsmith code'], ['label', 'Label'], ['badges', 'Badges'], ['comment', 'Comment'], ['image', 'Image key'], ['mode', 'Mode']].filter(([v]) => mode === 'MP' || v !== 'code');
    return {
        custom_id: ID(mode, 'exportm'), title: `Export ${mode} Builds`,
        components: [
            namesBox(mode),
            labelled('Quick picks', quickPickSelect(mode), 'Everything picked is included: All AR + All Meta = both.'),
            labelled('Send to', { type: 21, custom_id: 'dest', required: true, options: [{ value: 'file', label: 'A file here', default: true }, { value: 'dm', label: 'A DM to me' }] }),
            labelled('Include', { type: 22, custom_id: 'include', required: false, min_values: 0, max_values: fields.length, options: fields.map(([value, label]) => ({ value, label, default: value !== 'mode' })) }),
            labelled('Merged builds', { type: 21, custom_id: 'merged', required: true, options: [{ value: 'keep', label: 'Keep options together (2, 2b)', default: true }, { value: 'split', label: 'Each option as its own build' }, { value: 'first', label: 'First option only' }] }),
        ],
    };
}

function moveModal(mode, doc, opt, back = null) {
    const { buildNumberOf } = require('../../../utils/loadoutForm');
    const tag = require('../../../utils/loadoutOptions').optionTag(buildNumberOf(doc.buildName), Number(opt) || 0);
    return { custom_id: back ? ID(mode, 'movem', doc._id, opt, back) : ID(mode, 'movem', doc._id, opt), title: `Move ${doc.weaponName} ${doc.buildName}`.slice(0, 45), components: [labelled('New build #', { type: 4, custom_id: 'to', style: 1, required: true, max_length: 4, value: String(tag), placeholder: '3 · 2b' }, 'A number swaps with that build. A letter makes it an option of that build.')] };
}

module.exports = { ID, MODE_OF, SELECT_PAGE, row, text, btn, pageView, classView, weaponView, cardView, resultView, resultsView, selectView, stepView, editedSince, searchModal, exportModal, moveModal, homeBtn };
