// ==========================================
// /manage draws — the panels and pop-ups
// ==========================================
// Built 2026-11-07 19:13 EST from the /mockdraws mock-up, on his word (2026-11-07 19:11 EST): "i'm leaving it under your design critique and judgement". The same shape as the gunsmith panel (handlers/manage/gunsmith/, v3.13.0): one message that changes in place, Back and Home everywhere, a draw card with its own actions, a list per status, Select for many draws, one Export pop-up, Paste with a preview. Every function here only BUILDS a message or a pop-up; routing, permission checks and saves are in ./index.js.
//
// custom_ids: `mng_dr|<verb>|…`, at most 100 characters (asserted). `mng_` puts every click behind the router's /manage lock (handlers/router.js); ./index.js checks each action's own tier with resolveAction.
//
// A draw's KEY is `n:<id>` (New) or `r:<id>` (Returning): the section is part of the key because the two lists are separate arrays on the one season document.

const emojis = require('../../../utils/emojiMap');

const ACCENT = 7032445; // /draws' Plum Fortune (commands/draws.js PRESET_ACCENT)
const PAGE = 10;

function ID(...parts) {
    const id = ['mng_dr', ...parts.map(p => (p === undefined || p === null ? '' : String(p)))].join('|');
    if (id.length > 100) throw new Error(`draws custom_id over 100 characters: ${id}`);
    return id;
}
const row = (...c) => ({ type: 1, components: c });
const text = (content) => ({ type: 10, content });
const BIG = () => ({ type: 14, divider: true, spacing: 2 });
const SMALL = () => ({ type: 14, divider: false, spacing: 1 });
const btn = (parts, label, emojiStr, style = 2, disabled = false) => ({ type: 2, style, ...(label ? { label } : {}), custom_id: ID(...[].concat(parts)), disabled, ...(emojiStr ? { emoji: emojis.parseEmoji(emojiStr) } : {}) });
const arrow = (parts, dir, disabled) => ({ type: 2, style: 2, custom_id: ID(...[].concat(parts)), emoji: emojis.parseEmoji(dir === 'left' ? emojis.left : emojis.right), disabled });
const counter = (parts, label) => ({ type: 2, style: 2, label, custom_id: ID(...[].concat(parts)), disabled: true });
const crumb = (...p) => `-# ${['Draws', ...p].join('  ›  ')}`;
const panel = (components, after = []) => [{ type: 17, accent_color: ACCENT, components }, ...after];
const homeBtn = () => btn('page', 'Home', emojis.returnArrow);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// ---------- the draws, timed ---------- /draws through the public client's command Collection, looked up on each call, never required: a require would put every /manage handler in the closure of a hotpatch to /draws or /draw prices (which /draws requires), and utils/hotpatch.js would refuse it. bot/registry.js fills the Collection and a hotpatch re-sets it. Tests set clients.public.
const D = () => {
    const cmd = require('../../../bot/clients').publicClient()?.commands?.get('draws');
    if (!cmd) throw new Error('drawsPanel: /draws is not loaded on the public client');
    return cmd;
};
function allDraws(doc, nowMs = Date.now()) {
    const t = (d, sec) => ({ ...d, _sec: sec, _key: `${sec[0]}:${d._id}`, ...D().drawTiming(d, doc, nowMs) });
    // In release order, as /draws lists them (utils/drawDates.js byRelease); keys are by _id, so the order changes nothing a button points at.
    const { byRelease } = require('../../../utils/drawDates');
    return [...byRelease(doc.newDraws).map(d => t(d, 'new')), ...byRelease(doc.returningDraws).map(d => t(d, 'returning'))];
}
const splitKey = (key) => { const [s, id] = String(key).split(':'); return { section: s === 'r' ? 'returning' : 'new', id }; };
const rowFor = (doc) => (d) => require('../../../utils/drawEndReminder').calendarRowFor(doc, d.title);

// The lists: by section and by /draws' own states (commands/draws.js drawTiming bits: 4 upcoming, 8 live, 16 leaving soon, 32 ended), plus the live draws with no end date, which /draws can only show as running forever.
const STATUS = {
    new: { label: 'New Draws', test: d => d._sec === 'new', emoji: () => emojis.newDraws },
    returning: { label: 'Returning Draws', test: d => d._sec === 'returning', emoji: () => emojis.returningDraws },
    upcoming: { label: 'Upcoming', test: d => d.bits & 4, emoji: () => emojis.lightBlueDotGlow },
    live: { label: 'Active Now', test: d => d.bits & 8, emoji: () => emojis.greenDotGlow },
    leaving: { label: 'Leaving Soon', test: d => d.bits & 16, emoji: () => emojis.yellowDotGlow },
    ended: { label: 'Ended', test: d => d.bits & 32, emoji: () => emojis.redDotGlow },
    noend: { label: 'No End Date', test: d => d.state !== 'over' && d.state !== 'tba' && !(d.bits & 4) && !Number.isFinite(d.endMs), emoji: () => emojis.warn },
    // Needs a Look (2026-11-09, the /manage audit's finding 7): a draw that has not ended and lacks a picture, items, a draw type (utils/drawChecks.js) or an end date. An ended draw is left out: nothing players see changes by fixing it.
    look: { label: 'Needs a Look', test: d => !(d.bits & 32) && gapsFor(d).length > 0, emoji: () => emojis.warn },
};
function gapsFor(d) { return [...require('../../../utils/drawChecks').gapsOf(d), ...(STATUS.noend.test(d) ? ['no end date'] : [])]; }
const dot = (d) => (d.bits & 32 ? emojis.redDotGlow : d.bits & 16 ? emojis.yellowDotGlow : d.bits & 8 ? emojis.greenDotGlow : emojis.lightBlueDotGlow);
const stateName = (d) => (d.bits & 32 ? 'Ended' : d.bits & 16 ? 'Leaving soon' : d.bits & 8 ? 'Active now' : 'Upcoming');
function stateWords(d) {
    const r = (ms) => `<t:${Math.floor(ms / 1000)}:R>`;
    if (d.state === 'tba') return 'date TBA';
    if (d.bits & 32) return `ended ${r(d.endMs)}`;
    if (d.bits & 4) return `releases ${r(d.startMs)}`;
    return Number.isFinite(d.endMs) ? `${d.bits & 16 ? 'ending' : 'ends'} ${r(d.endMs)}` : '**no end date**';
}
const secWord = (d) => (d._sec === 'new' ? 'New' : 'Returning');
// One draw as a list row: the dot, the title, then New/Returning and when, on a small line padded under the title.
const listLine = (d, mark = '') => `${mark}${dot(d)} **${d.title}**\n-# ${emojis.blank}${emojis.blank}${mark ? emojis.blank : ''} ${secWord(d)} · ${stateWords(d)}`;
// On Needs a Look the small line says what is missing instead.
const lookLine = (d) => `${dot(d)} **${d.title}**\n-# ${emojis.blank}${emojis.blank} ${secWord(d)} · ${emojis.warn} ${gapsFor(d).join(', ')}`;

async function seasonLine(doc) {
    if (!doc?.currentSeasonTitle) return '';
    const emoji = require('../../../utils/seasonEmoji').seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji);
    return `\n${emoji ? `${emoji} ` : ''}${require('../../../utils/titleBlock').toBoldItalicUnicode(doc.currentSeasonTitle)}`;
}

// ---------- home ----------
async function pageView(doc, note = null, { pageRow = null } = {}) {
    const all = allDraws(doc);
    const n = (k) => all.filter(STATUS[k].test).length;
    const counts = [`${n('new')} new`, `${n('returning')} returning`, `${n('live')} active now`, ...(n('noend') ? [`${emojis.warn} ${n('noend')} with no end date`] : []), ...(n('look') ? [`${emojis.warn} ${n('look')} need a look`] : [])].join(' · ');
    const components = [text(`## ${emojis.newDraws}${emojis.returningDraws} Draws${await seasonLine(doc)}\n-# ${counts}`)];
    if (note) components.push(SMALL(), text(note));
    components.push(
        BIG(),
        text('-# Add draws…'),
        row(btn('quickadd', 'Quick Add', emojis.mngAdd, 3), btn('addnew', 'Add New Draw', emojis.newDraws), btn('addreturning', 'Add Returning Draw', emojis.returningDraws)),
        SMALL(),
        text('-# Find a draw…'),
        // Check Draw Index (2026-11-09 13:57 EST, his ask 13:53 EST): paste names, see what the draw index has and lacks (utils/drawIndexCheck.js).
        row(btn('find', 'Search Draws', emojis.gunsmithSearch, 1), btn('check', 'Check Draw Index', emojis.search), btn(['list', 'look', 0], n('look') ? `Needs a Look · ${n('look')}` : 'All Checked', n('look') ? emojis.warn : emojis.checkmark, n('look') ? 4 : 3)),
        { type: 1, components: [{ type: 3, custom_id: ID('browse'), placeholder: 'Or browse a list…', options: Object.entries(STATUS).map(([value, s]) => ({ value, label: `${s.label} · ${n(value)}`, emoji: emojis.parseEmoji(s.emoji()) })) }] },
        BIG(),
        text('-# Many draws at once…'),
        row(btn('paste', 'Paste Draws', emojis.pasteImport), btn('select', 'Select Draws', emojis.filter), btn('export', 'Export', emojis.copyExport), btn('guide', 'Guide', emojis.guide)),
        SMALL(),
        text('-# End of season…'),
        row(btn('purge', 'Purge Draws', emojis.deleteBin, 4)),
    );
    return panel(components, pageRow ? [pageRow] : []);
}

// ---------- a list ---------- The order each list reads in: what ends soonest first on Active Now and Leaving Soon, the latest ended first on Ended, by start everywhere else (found click-testing, 2026-11-07 19:36 EST: Active Now read 4, 4, 10, 13, 9 days).
const END = (d) => (Number.isFinite(d.endMs) ? d.endMs : Infinity);
const byStart = (a, b) => (a.startMs || 0) - (b.startMs || 0);
const ORDER = { live: (a, b) => END(a) - END(b) || byStart(a, b), leaving: (a, b) => END(a) - END(b) || byStart(a, b), ended: (a, b) => END(b) - END(a) || byStart(a, b) };
function listView(doc, status, page = 0) {
    const s = STATUS[status] || STATUS.new;
    const list = allDraws(doc).filter(s.test).sort(ORDER[status] || byStart);
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = list.slice(pg * PAGE, pg * PAGE + PAGE);
    const components = [text(`${crumb(s.label)}\n## ${s.emoji()} ${s.label}\n-# ${plural(list.length, 'draw')}${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`), BIG()];
    if (!shown.length) components.push(text(`${emojis.cross} No draws here right now.`));
    else {
        components.push(text(shown.map(d => (status === 'look' ? lookLine(d) : listLine(d))).join('\n').slice(0, 3900)));
        components.push({ type: 1, components: [{ type: 3, custom_id: ID('open', status), placeholder: 'Open a draw…', options: shown.map(d => ({ label: d.title.slice(0, 100), value: d._key, description: `${secWord(d)} · ${stateName(d)}` })) }] });
        if (pages > 1) components.push(row(arrow(['list', status, pg - 1], 'left', pg === 0), counter(['pgn', status], `Page ${pg + 1} / ${pages}`), arrow(['list', status, pg + 1], 'right', pg === pages - 1)));
    }
    components.push(BIG(), row(btn(['sellist', status], `Select These ${list.length}`, emojis.filter, 2, !list.length), homeBtn()));
    return panel(components);
}

// ---------- one draw ---------- `header` sits above the card (a confirm question, a saved note); `extra` replaces the action rows. `back` is the list it was opened from.
function cardView(doc, key, { header = null, extra = null, back = null } = {}) {
    const d = allDraws(doc).find(x => x._key === key);
    if (!d) return null;
    const end = rowFor(doc)(d);
    const type = d.priceType ? (require('../../../utils/drawTypes').drawTypeName(d.priceType) || d.priceType) : null;
    const components = [text(crumb(`${secWord(d)} Draws`, d.title))];
    if (header) components.push(text(header), SMALL());
    components.push(...D().buildDrawSections([d], { seasonalDoc: doc, nowMs: Date.now() }));
    // The end date is already in the draw's date lines above; this line says only what they do not: New or Returning, its draw type, and a missing end date.
    const lacks = require('../../../utils/drawChecks').gapsOf(d).filter(g => g !== 'no draw type');
    components.push(text(`-# ${secWord(d)} draw · ${type || 'no draw type'}${end?.endDate || d.state === 'over' || (d.bits & 4) ? '' : ` · ${emojis.warn} no end date on /calendar`}${lacks.length ? ` · ${emojis.warn} ${lacks.join(', ')}` : ''}`), BIG());
    if (extra) components.push(...extra);
    else {
        const backTo = STATUS[back] ? back : d._sec;
        components.push(
            row(btn(['edit', key], 'Edit', emojis.edit, 1), btn(['end', key], end?.endDate ? 'Change End Date' : 'Set End Date', emojis.edit), btn(['move', key], `Move to ${d._sec === 'new' ? 'Returning' : 'New'}`, d._sec === 'new' ? emojis.returningDraws : emojis.newDraws), btn(['del', key], 'Delete', emojis.deleteBin, 4)),
            row(btn(['list', backTo, 0], STATUS[backTo].label, emojis.returnArrow), homeBtn()),
        );
    }
    return panel(components);
}

function resultView({ crumbs = [], title, body = [], back = 'page', backLabel = 'Back', ok = true, extraButtons = [], extraRows = [] }) {
    const backParts = [].concat(back);
    return panel([
        ...(crumbs.length ? [text(crumb(...crumbs))] : []),
        text(`### ${ok === 'warn' ? emojis.warn : ok ? emojis.checkmark : emojis.cross} ${title}`),
        ...(body.length ? [SMALL(), text(body.join('\n').slice(0, 3800))] : []),
        BIG(),
        ...extraRows,
        row(...extraButtons, btn(backParts, backLabel, emojis.returnArrow), ...(backParts[0] === 'page' ? [] : [homeBtn()])),
    ]);
}

// ---------- Select ----------
function selectView(doc, token, sel, note = null, page = 0) {
    const byKey = new Map(allDraws(doc).map(d => [d._key, d]));
    const keys = sel.ids.filter(k => byKey.has(k));
    const selected = new Set(sel.selected);
    const pages = Math.max(1, Math.ceil(keys.length / PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = keys.slice(pg * PAGE, pg * PAGE + PAGE);
    const n = keys.filter(k => selected.has(k)).length;
    const components = [text(`${crumb('Select Draws')}\n## ${emojis.filter} Select Draws${sel.query?.length ? `\n-# ${sel.query.map(q => `\`${q}\``).join(' · ').slice(0, 500)}` : ''}`)];
    if (sel.unmatched?.length) components.push(text(`-# ${emojis.warn} Nothing matched ${sel.unmatched.map(x => `\`${x}\``).join(', ').slice(0, 500)}`));
    components.push(BIG());
    if (!keys.length) {
        components.push(text(`${emojis.cross} **No draws found.** Try part of a title, or a quick pick.`), BIG(), row(btn('select', 'Search Again', emojis.gunsmithSearch, 1), homeBtn()));
        return panel(components);
    }
    components.push(
        text(`-# **${keys.length}** found · **${n}** selected${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`),
        text(shown.map(k => listLine(byKey.get(k), `${selected.has(k) ? emojis.check : emojis.smallDot} `)).join('\n').slice(0, 3900)),
        SMALL(),
        { type: 1, components: [{ type: 3, custom_id: ID('flip', token, pg), min_values: 1, max_values: shown.length, placeholder: 'Select or unselect draws…', options: shown.map(k => { const d = byKey.get(k); return { label: d.title.slice(0, 100), value: k, description: `${selected.has(k) ? 'Selected' : 'Not selected'} · ${secWord(d)} · ${stateName(d)}`.slice(0, 100) }; }) }] },
        ...(pages > 1 ? [row(arrow(['slist', token, pg - 1], 'left', pg === 0), counter(['spg', token], `Page ${pg + 1} / ${pages}`), arrow(['slist', token, pg + 1], 'right', pg === pages - 1))] : []),
        row(btn(['all', token, pg], `Select All ${keys.length}`, emojis.checkmark, 2, n === keys.length), btn(['none', token, pg], 'Clear', emojis.cross, 2, !n)),
    );
    if (note) components.push(text(note));
    components.push(
        BIG(),
        text(n ? `-# With the **${n}** selected…` : '-# Select draws to edit, export or delete them…'),
        row(btn(['tedit', token, pg], `Edit ${n || ''}`.trim(), emojis.edit, 1, !n), btn(['texp', token], `Export ${n || ''}`.trim(), emojis.copyExport, 2, !n), btn(['tdel', token, pg], `Delete ${n || ''}`.trim(), emojis.deleteBin, 4, !n)),
        row(btn('select', 'Search Again', emojis.gunsmithSearch), homeBtn()),
    );
    return panel(components);
}

// ---------- pop-ups ----------
const labelled = (label, component, description) => ({ type: 18, label, ...(description ? { description } : {}), component });
const QUICK = Object.entries(STATUS).map(([value, s]) => ({ value, label: `All ${s.label}` }));
const quickSelect = () => (require('../../../utils/formChoice').asChoice({ type: 3, custom_id: 'picks', required: false, min_values: 0, max_values: QUICK.length, placeholder: 'Pick any', options: QUICK }));
const titlesBox = () => labelled('Draw titles', { type: 4, custom_id: 'names', style: 2, required: false, max_length: 2000, placeholder: 'Sapphire Winter\nWhorl of Midnight' }, 'One per line; part of a title is enough. Added to the quick picks.');
const searchModal = () => ({ custom_id: ID('findm'), title: 'Find a Draw', components: [labelled('Title', { type: 4, custom_id: 'q', style: 1, required: true, max_length: 100, placeholder: 'sapphire' }, 'Part of the title is enough')] });
const selectModal = () => ({ custom_id: ID('selectm'), title: 'Select Draws', components: [titlesBox(), labelled('Quick picks', quickSelect(), 'Everything picked is included: New + Ended = both.')] });
function exportModal() {
    return {
        custom_id: ID('exportm'), title: 'Export Draws',
        components: [
            titlesBox(),
            labelled('Quick picks', quickSelect(), 'Leave both empty for every draw.'),
            labelled('Send to', { type: 21, custom_id: 'dest', required: true, options: [{ value: 'file', label: 'A file here', default: true }, { value: 'dm', label: 'A DM to me' }] }),
            labelled('Include', { type: 22, custom_id: 'include', required: false, min_values: 0, max_values: 3, options: [['end', 'End dates'], ['image', 'Image link'], ['type', 'Draw type']].map(([value, label]) => ({ value, label, default: true })) }),
        ],
    };
}


// ---------- Check Draw Index ---------- (2026-11-09 13:57 EST, his ask: "bulk paste draw names or item names and check if we have a draw for that search, if the draw/catalogue contains all the info/needs updating")
const checkModal = () => ({ custom_id: ID('checkm'), title: 'Check the Draw Index', components: [{ type: 1, components: [{ type: 4, custom_id: 'names', label: 'Draw or item names, one per line (up to 20)', style: 2, required: true, max_length: 4000, placeholder: 'cx9 lethal hollow\nherrscher of reason\nmythic character' }] }] });
// The result: a count line, then one block per line pasted. Discord holds 4,000 characters of text in a message: blocks past that are dropped and counted, never cut mid-line.
function checkView({ results, extra = 0, indexSize = 0 }) {
    const { resultBlock } = require('../../../utils/drawIndexCheck');
    const c = (s) => results.filter(r => r.status === s).length;
    const needN = results.filter(r => r.needs?.length).length;
    const counts = [`${results.length} checked`, `${c('found')} found`, ...(c('maybe') ? [`${c('maybe')} maybe`] : []), ...(c('describes') ? [`${c('describes')} too broad`] : []), ...(c('none') ? [`${c('none')} not indexed`] : []), ...(needN ? [`${emojis.warn} ${needN} need updating`] : [])].join(' · ');
    const head = text(`${crumb('Check Draw Index')}\n## ${emojis.search} Draw Index Check\n-# ${counts} · ${plural(indexSize, 'draw')} in the index`);
    const blocks = results.map(r => resultBlock(r, emojis));
    let budget = 3700 - head.content.length;
    let shown = 0;
    while (shown < blocks.length && budget - blocks[shown].length > 0) { budget -= blocks[shown].length + 1; shown++; }
    const dropped = blocks.length - shown + extra;
    const components = [head];
    if (!indexSize) components.push(SMALL(), text(`${emojis.warn} **The draw index is empty here.** Nothing can be found until it is filled.`));
    components.push(BIG(), ...blocks.slice(0, shown).map(text));
    if (dropped) components.push(text(`-# …and ${plural(dropped, 'more line')} not checked; paste them again in a second check.`));
    components.push(BIG(), row(btn('check', 'Check Again', emojis.search, 1), btn('quickadd', 'Quick Add', emojis.mngAdd), homeBtn()));
    return panel(components);
}
module.exports = {
    checkModal, checkView, gapsFor, ID, PAGE, STATUS, row, text, btn, homeBtn, panel, plural, allDraws, splitKey, rowFor, secWord, dot, pageView, listView, cardView, resultView, selectView, searchModal, selectModal, exportModal };
