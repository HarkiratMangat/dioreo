// ==========================================
// /manage draws — the panels and pop-ups
// ==========================================
// Built 2026-11-07 19:13 EST from the /mockdraws mock-up, on his word (2026-11-07 19:11 EST): "i'm leaving it under your design critique and judgement". The same shape as the gunsmith panel (handlers/manage/gunsmith/, v3.13.0): one message that changes in place, Back and Home everywhere, a draw card with its own actions, a list per status, Select for many draws, one Export pop-up, Paste with a preview. Every function here only BUILDS a message or a pop-up; routing, permission checks and saves are in ./index.js.
//
// REFINED 2026-11-10 10:57 EST (his ask, 10:22 EST: "review the entire subcommand, every panel and function ... nitpick and refine everything"; the plan is local/project/features/manage-draws-refine/spec.md). What changed here, and why:
//   - Saves answer IN the panel: the card shows what a save changed (old struck) with Revert beside it, instead of a second message below.
//   - The card remembers where it was opened from (`back`: a list, or `t:<token>` for search results) through every action, and its breadcrumb says so.
//   - End dates have their own pop-up (endModal), not /manage calendar's five-field editor.
//   - Needs a Look has a fix button per draw; Search lists title AND item matches; Check Draw Index keeps what was pasted.
//
// custom_ids: `mng_dr|<verb>|…`, at most 100 characters (asserted). `mng_` puts every click behind the router's /manage lock (handlers/router.js); ./index.js checks each action's own tier with resolveAction.
//
// A draw's KEY is `n:<id>` (New) or `r:<id>` (Returning): the section is part of the key because the two lists are separate arrays on the one season document.

const emojis = require('../../../utils/emojiMap');

const ACCENT = 7032445; // /draws' Plum Fortune (commands/draws.js PRESET_ACCENT)
const PAGE = 10;
// Needs a Look draws one Section per draw (its fix button is the accessory, three components each), so it holds fewer a page: 8 × 3 + the frame stays under 40.
const LOOK_PAGE = 8;

function ID(...parts) {
    const id = ['mng_dr', ...parts.map(p => (p === undefined || p === null ? '' : String(p)))].join('|');
    if (id.length > 100) throw new Error(`draws custom_id over 100 characters: ${id}`);
    return id;
}
const row = (...c) => ({ type: 1, components: c.filter(Boolean) });
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
// Date and time, as /draws shows them: an admin date is midnight UTC, and a date alone reads as the day before in Toronto.
const stamp = (ms, f = 'f') => `<t:${Math.floor(Number(ms) / 1000)}:${f}>`;

// ---------- the draws, timed ---------- /draws through the public client's command Collection, looked up on each call, never required: a require would put every /manage handler in the closure of a hotpatch to /draws or /draw prices (which /draws requires), and utils/hotpatch.js would refuse it. bot/registry.js fills the Collection and a hotpatch re-sets it. Tests set clients.public.
const D = () => {
    const cmd = require('../../../bot/clients').publicClient()?.commands?.get('draws');
    if (!cmd) throw new Error('drawsPanel: /draws is not loaded on the public client');
    return cmd;
};
const rowFor = (doc) => (d) => require('../../../utils/drawEndReminder').calendarRowFor(doc, d.title);
function allDraws(doc, nowMs = Date.now()) {
    const find = rowFor(doc);
    const t = (d, sec) => {
        const calRow = find(d);
        // An end that is "not announced yet" (TBD, 2026-11-09): the draw has a /calendar row with no end that is not All Season. It is listed under No End Date, but it is a decision, not a gap, so Needs a Look leaves it out.
        return { ...d, _sec: sec, _key: `${sec[0]}:${d._id}`, _row: calRow || null, _tbd: Boolean(calRow && !calRow.endDate && !calRow.isOngoing), ...D().drawTiming(d, doc, nowMs) };
    };
    // In release order, as /draws lists them (utils/drawDates.js byRelease); keys are by _id, so the order changes nothing a button points at.
    const { byRelease } = require('../../../utils/drawDates');
    return [...byRelease(doc.newDraws || []).map(d => t(d, 'new')), ...byRelease(doc.returningDraws || []).map(d => t(d, 'returning'))];
}
const splitKey = (key) => { const [s, id] = String(key).split(':'); return { section: s === 'r' ? 'returning' : 'new', id }; };
const typeName = (d) => (d.priceType ? (require('../../../utils/drawTypes').drawTypeName(d.priceType) || d.priceType) : null);

// The lists: by section and by /draws' own states (commands/draws.js drawTiming bits: 4 upcoming, 8 live, 16 leaving soon, 32 ended), plus the live draws with no end date, which /draws can only show as running forever. `group` is how Select's quick picks combine (index.js resolveKeys): within a group they widen, across groups they narrow.
const STATUS = {
    new: { label: 'New Draws', test: d => d._sec === 'new', emoji: () => emojis.newDraws, group: 'section' },
    returning: { label: 'Returning Draws', test: d => d._sec === 'returning', emoji: () => emojis.returningDraws, group: 'section' },
    upcoming: { label: 'Upcoming', test: d => d.bits & 4, emoji: () => emojis.lightBlueDotGlow, group: 'state' },
    live: { label: 'Active Now', test: d => d.bits & 8, emoji: () => emojis.greenDotGlow, group: 'state' },
    leaving: { label: 'Leaving Soon', test: d => d.bits & 16, emoji: () => emojis.yellowDotGlow, group: 'state' },
    ended: { label: 'Ended', test: d => d.bits & 32, emoji: () => emojis.redDotGlow, group: 'state' },
    noend: { label: 'No End Date', test: d => d.state !== 'over' && d.state !== 'tba' && !(d.bits & 4) && !Number.isFinite(d.endMs), emoji: () => emojis.warn, group: 'state' },
    // Needs a Look (2026-11-09, the /manage audit's finding 7): a draw that has not ended and lacks a picture, items, a draw type (utils/drawChecks.js) or an end date. An ended draw is left out: nothing players see changes by fixing it.
    look: { label: 'Needs a Look', test: d => !(d.bits & 32) && gapsFor(d).length > 0, emoji: () => emojis.warn, group: 'state' },
};
function gapsFor(d) { return [...require('../../../utils/drawChecks').gapsOf(d), ...(STATUS.noend.test(d) && !d._tbd ? ['no end date'] : [])]; }
const dot = (d) => (d.bits & 32 ? emojis.redDotGlow : d.bits & 16 ? emojis.yellowDotGlow : d.bits & 8 ? emojis.greenDotGlow : emojis.lightBlueDotGlow);
const stateName = (d) => (d.bits & 32 ? 'Ended' : d.bits & 16 ? 'Leaving soon' : d.bits & 8 ? 'Active now' : 'Upcoming');
function stateWords(d) {
    const r = (ms) => `<t:${Math.floor(ms / 1000)}:R>`;
    if (d.state === 'tba') return 'date TBA';
    if (d.bits & 32) return `ended ${r(d.endMs)}`;
    if (d.bits & 4) return `releases ${r(d.startMs)}`;
    if (Number.isFinite(d.endMs)) return `${d.bits & 16 ? 'ending' : 'ends'} ${r(d.endMs)}`;
    return d._tbd ? 'end TBD' : '**no end date**';
}
const secWord = (d) => (d._sec === 'new' ? 'New' : 'Returning');
// One draw as a list row: the dot, the title, then New/Returning and when, on a small line padded under the title. `mark` is Select's tick (or a blank of the same width, so ticked and unticked rows line up).
const listLine = (d, mark = '') => `${mark}${dot(d)} **${d.title}**\n-# ${emojis.blank}${emojis.blank}${mark ? emojis.blank : ''} ${secWord(d)} · ${stateWords(d)}`;
// On Needs a Look the small line says what is missing instead.
const lookLine = (d) => `${dot(d)} **${d.title}**\n-# ${emojis.blank}${emojis.blank} ${secWord(d)} · ${emojis.warn} ${gapsFor(d).join(', ')}`;
// An Open a draw… option: the dot, the title, then what the list row does not say (its draw type).
const openOption = (d) => ({ label: d.title.slice(0, 100), value: d._key, description: `${secWord(d)} · ${stateName(d)} · ${typeName(d) || 'no draw type'}`.slice(0, 100), emoji: emojis.parseEmoji(dot(d)) });

async function seasonLine(doc) {
    if (!doc?.currentSeasonTitle) return '';
    const emoji = require('../../../utils/seasonEmoji').seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji);
    return `\n${emoji ? `${emoji} ` : ''}${require('../../../utils/titleBlock').toBoldItalicUnicode(doc.currentSeasonTitle)}`;
}

// ---------- home ---------- `noteRow` is a row of buttons under the note (a purge's Revert).
async function pageView(doc, note = null, { pageRow = null, noteRow = null } = {}) {
    const all = allDraws(doc);
    const n = (k) => all.filter(STATUS[k].test).length;
    const look = n('look');
    // The counts an admin scans for: how many, what is running, what is about to leave, what has ended. Leaving Soon is part of Active (as /draws' filter has it), so it is written in brackets after Active: a glance that adds the numbers up must reach the total.
    const counts = all.length
        ? [`**${all.length}** ${all.length === 1 ? 'draw' : 'draws'}`, `${n('live')} active${n('leaving') ? ` (**${n('leaving')} leaving soon**)` : ''}`, ...(n('upcoming') ? [`${n('upcoming')} upcoming`] : []), ...(n('ended') ? [`${n('ended')} ended`] : [])].join(' · ')
        : 'No draws yet this season. Quick Add or Paste Draws to start.';
    const lookLineText = look ? `\n-# ${emojis.warn} **${look}** ${look === 1 ? 'needs' : 'need'} a look` : '';
    const components = [text(`## ${emojis.newDraws}${emojis.returningDraws} Draws${await seasonLine(doc)}\n-# ${counts}${lookLineText}`)];
    if (note) components.push(SMALL(), text(note));
    if (noteRow) components.push(noteRow);
    // Needs a Look is a button only when there is something to look at; with nothing, a disabled chip says so instead of a click that opens an empty list.
    const lookBtn = look
        ? btn(['list', 'look', 0], `Needs a Look · ${look}`, emojis.warn, 4)
        : btn(['list', 'look', 0], all.length ? 'All Checked' : 'Needs a Look', all.length ? emojis.checkmark : emojis.warn, all.length ? 3 : 2, true);
    components.push(
        BIG(),
        text('-# Add draws…'),
        row(btn('quickadd', 'Quick Add', emojis.mngAdd, 3), btn('addnew', 'Add New Draw', emojis.newDraws), btn('addreturning', 'Add Returning Draw', emojis.returningDraws)),
        SMALL(),
        text('-# Find a draw…'),
        // Check Draw Index (2026-11-09 13:57 EST, his ask 13:53 EST): paste names, see what the draw index has and lacks (utils/drawIndexCheck.js).
        row(btn('find', 'Search Draws', emojis.gunsmithSearch, 1, !all.length), btn('check', 'Check Draw Index', emojis.search), lookBtn),
        ...(all.length ? [{ type: 1, components: [{ type: 3, custom_id: ID('browse'), placeholder: 'Or browse a list…', options: Object.entries(STATUS).map(([value, s]) => ({ value, label: `${s.label} · ${n(value)}`, emoji: emojis.parseEmoji(s.emoji()) })) }] }] : []),
        BIG(),
        text('-# Many draws at once…'),
        row(btn('paste', 'Paste Draws', emojis.pasteImport), btn('select', 'Select Draws', emojis.filter, 2, !all.length), btn('export', 'Export', emojis.copyExport, 2, !all.length), btn('guide', 'Guide', emojis.guide)),
        SMALL(),
        text('-# End of season…'),
        row(btn('purge', 'Purge Draws', emojis.deleteBin, 4, !all.length)),
    );
    return panel(components, pageRow ? [pageRow] : []);
}

// ---------- a list ---------- The order each list reads in: what ends soonest first on Active Now and Leaving Soon, the latest ended first on Ended, by start everywhere else (found click-testing, 2026-11-07 19:36 EST: Active Now read 4, 4, 10, 13, 9 days).
const END = (d) => (Number.isFinite(d.endMs) ? d.endMs : Infinity);
const byStart = (a, b) => (a.startMs || 0) - (b.startMs || 0);
const ORDER = { live: (a, b) => END(a) - END(b) || byStart(a, b), leaving: (a, b) => END(a) - END(b) || byStart(a, b), ended: (a, b) => END(b) - END(a) || byStart(a, b) };
const listOf = (doc, status) => allDraws(doc).filter(STATUS[status].test).sort(ORDER[status] || byStart);
// `note` sits under the title (a fix's result); `noteRow` holds its Revert.
function listView(doc, status, page = 0, { note = null, noteRow = null } = {}) {
    const key = STATUS[status] ? status : 'new';
    const s = STATUS[key];
    const list = listOf(doc, key);
    const size = key === 'look' ? LOOK_PAGE : PAGE;
    const pages = Math.max(1, Math.ceil(list.length / size));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = list.slice(pg * size, pg * size + size);
    const components = [text(`${crumb(s.label)}\n## ${s.emoji()} ${s.label}\n-# ${plural(list.length, 'draw')}${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`)];
    if (note) components.push(SMALL(), text(note));
    if (noteRow) components.push(noteRow);
    components.push(BIG());
    if (!shown.length) components.push(text(key === 'look' ? `${emojis.checkmark} **Nothing needs a look.** Every running draw has a picture, items, a draw type and an end date.` : `${emojis.cross} No draws here right now.`));
    else if (key === 'look') {
        // One Section per draw, with the quickest fix as its button (2026-11-10 11:19 EST, the season draft's Needs a Look already worked this way): End Date when the end is all that is missing, Edit for anything else (picture, items, draw type all live in Edit). `L` brings the fix back to this list.
        for (const d of shown) {
            const gaps = gapsFor(d);
            const onlyEnd = gaps.length === 1 && gaps[0] === 'no end date';
            components.push({ type: 9, components: [text(lookLine(d))], accessory: onlyEnd ? btn(['end', d._key, 'look', 'L'], 'End Date', emojis.timestamp, 1) : btn(['edit', d._key, 'look', 'L'], 'Edit', emojis.edit, 1) });
        }
    } else {
        components.push(text(shown.map(d => listLine(d)).join('\n').slice(0, 3900)));
        components.push({ type: 1, components: [{ type: 3, custom_id: ID('open', key), placeholder: 'Open a draw…', options: shown.map(openOption) }] });
    }
    if (pages > 1) components.push(row(arrow(['list', key, pg - 1], 'left', pg === 0), counter(['pgn', key], `Page ${pg + 1} / ${pages}`), arrow(['list', key, pg + 1], 'right', pg === pages - 1)));
    components.push(BIG(), row(btn(['sellist', key], list.length === 1 ? 'Select This One' : `Select These ${list.length}`, emojis.filter, 2, !list.length), homeBtn()));
    return panel(components);
}

// ---------- search results ---------- The matches of a search, kept in a selection token (models/ManageSelection.js) so they page, and a card opened from them walks them and comes back to them.
function searchView(doc, token, sel, page = 0) {
    const byKey = new Map(allDraws(doc).map(d => [d._key, d]));
    const keys = (sel.ids || []).filter(k => byKey.has(k));
    const pages = Math.max(1, Math.ceil(keys.length / PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = keys.slice(pg * PAGE, pg * PAGE + PAGE).map(k => byKey.get(k));
    const q = (sel.query || []).join(' ').slice(0, 60);
    const components = [text(`${crumb('Search')}\n## ${emojis.gunsmithSearch} ${plural(keys.length, 'draw')} match \`${q}\`\n-# Words in the title or an item's name${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`), BIG()];
    if (!shown.length) components.push(text(`${emojis.cross} None of them are on /draws any more.`));
    else {
        components.push(text(shown.map(d => listLine(d)).join('\n').slice(0, 3900)));
        components.push({ type: 1, components: [{ type: 3, custom_id: ID('open', `t:${token}`), placeholder: 'Open a draw…', options: shown.map(openOption) }] });
    }
    if (pages > 1) components.push(row(arrow(['sres', token, pg - 1], 'left', pg === 0), counter(['spgn', token], `Page ${pg + 1} / ${pages}`), arrow(['sres', token, pg + 1], 'right', pg === pages - 1)));
    components.push(BIG(), row(btn(['slist', token, 0], keys.length === 1 ? 'Select This One' : `Select These ${keys.length}`, emojis.filter, 2, !keys.length), btn('find', 'Search Again', emojis.gunsmithSearch), homeBtn()));
    return panel(components);
}

// ---------- one draw ---------- `back` is where the card was opened from: a STATUS key, or `t:<token>` for search results (pass `sel`, the token's selection, to walk them). `header` sits above the card (a confirm question, a saved note); `extra` replaces the action rows; `resultRow` (a Revert) sits between the actions and the arrows.
const originOf = (back, d) => (STATUS[back] ? back : /^t:/.test(String(back || '')) ? back : d._sec);
const originLabel = (back) => (STATUS[back] ? STATUS[back].label : 'Search Results');
const originBtn = (back) => (STATUS[back] ? btn(['list', back, 0], STATUS[back].label, emojis.returnArrow) : btn(['sres', String(back).slice(2), 0], 'Search Results', emojis.returnArrow));
// The date the /draws block above does not show. That block gives an upcoming draw's start and a running draw's end (and no date once a draw has ended), so this line gives a running draw's start, an upcoming draw's end, and both for an ended one; a missing, TBD or with-the-season end is always named. Showing both every time put the same date on the card twice.
function datesLine(d) {
    if (d.state === 'tba' || !Number.isFinite(d.startMs)) return '-# Release date TBA';
    const now = Date.now();
    const upcoming = d.startMs > now;
    const ended = Number.isFinite(d.endMs) && d.endMs <= now;
    const start = upcoming ? null : `started ${stamp(d.startMs)}`;
    const end = d._row?.isOngoing ? 'ends with the season'
        : Number.isFinite(d.endMs) ? (upcoming || ended ? `${ended ? 'ended' : 'ends'} ${stamp(d.endMs)}` : null)
            : d._tbd ? 'end TBD' : `${emojis.warn} no end date on /calendar`;
    const line = [start, end].filter(Boolean).join(' · ');
    return line ? `-# ${line.charAt(0).toUpperCase()}${line.slice(1)}` : '';
}
function cardView(doc, key, { header = null, extra = null, back = null, sel = null, resultRow = null } = {}) {
    const all = allDraws(doc);
    const d = all.find(x => x._key === key);
    if (!d) return null;
    const origin = originOf(back, d);
    const components = [text(crumb(originLabel(origin), d.title))];
    if (header) components.push(text(header), SMALL());
    components.push(...D().buildDrawSections([d], { seasonalDoc: doc, nowMs: Date.now() }));
    // Under the /draws block: what it does not say. New or Returning and the draw type, then both dates, then anything missing.
    const lacks = require('../../../utils/drawChecks').gapsOf(d).filter(g => g !== 'no draw type');
    components.push(text(`-# ${secWord(d)} draw · ${typeName(d) || `${emojis.warn} no draw type`}${lacks.length ? ` · ${emojis.warn} ${lacks.join(', ')}` : ''}\n${datesLine(d)}`), BIG());
    if (extra) components.push(...extra);
    else {
        // Prev / Next walk the list the card was opened from, in that list's own order (2026-11-10, his ask for QoL buttons), so a run of draws is checked without going back to the list each time. The arrows end in `p` / `x`: in a list of two both point at the same draw, and Discord refuses a message with two equal ids.
        const list = STATUS[origin] ? listOf(doc, origin) : (sel?.ids || []).map(k => all.find(x => x._key === k)).filter(Boolean);
        const at = list.findIndex(x => x._key === key);
        const near = (step) => (at < 0 || list.length < 2 ? null : list[(at + step + list.length) % list.length]._key);
        const calBtn = d._row ? { type: 2, style: 2, label: 'Calendar', custom_id: `mng_ca|card|c:${d._row._id}`, emoji: emojis.parseEmoji(emojis.calendar) } : null;
        components.push(
            // Short labels so the row fits a phone (his review device): End Date wears the clock, Move says where it goes.
            row(btn(['edit', key, origin], 'Edit', emojis.edit, 1), btn(['end', key, origin], 'End Date', emojis.timestamp), btn(['move', key, origin], `To ${d._sec === 'new' ? 'Returning' : 'New'}`, d._sec === 'new' ? emojis.returningDraws : emojis.newDraws), calBtn, btn(['del', key, origin], 'Delete', emojis.deleteBin, 4)),
            ...(resultRow ? [resultRow] : []),
            row(arrow(['card', near(-1) || key, origin, 'p'], 'left', !near(-1)), counter(['cardn', key], at < 0 ? '–' : `${at + 1} / ${list.length}`), arrow(['card', near(1) || key, origin, 'x'], 'right', !near(1)), originBtn(origin), homeBtn()),
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
        // A note (a Revert's, a save's) still shows when the list is empty: it said nothing at all after a delete was reverted.
        if (note) components.push(text(note), SMALL());
        components.push(text(`${emojis.cross} **No draws found.** Try part of a title, or a quick pick.`), BIG(), row(btn('select', 'Select Again', emojis.filter, 1), homeBtn()));
        return panel(components);
    }
    components.push(
        text(`-# **${keys.length}** found · **${n}** selected${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`),
        // A tick for a selected draw, a blank of the same width for the rest, so the rows line up and the status dot stays the one dot on the row.
        text(shown.map(k => listLine(byKey.get(k), `${selected.has(k) ? emojis.check : emojis.blank} `)).join('\n').slice(0, 3900)),
        SMALL(),
        { type: 1, components: [{ type: 3, custom_id: ID('flip', token, pg), min_values: 1, max_values: shown.length, placeholder: 'Select or unselect draws…', options: shown.map(k => { const d = byKey.get(k); return { label: d.title.slice(0, 100), value: k, description: `${selected.has(k) ? 'Selected' : 'Not selected'} · ${secWord(d)} · ${stateName(d)}`.slice(0, 100), emoji: emojis.parseEmoji(selected.has(k) ? emojis.check : dot(d)) }; }) }] },
        ...(pages > 1 ? [row(arrow(['slist', token, pg - 1], 'left', pg === 0), counter(['spg', token], `Page ${pg + 1} / ${pages}`), arrow(['slist', token, pg + 1], 'right', pg === pages - 1))] : []),
        row(btn(['all', token, pg], `Select All ${keys.length}`, emojis.checkmark, 2, n === keys.length), btn(['none', token, pg], 'Clear', emojis.cross, 2, !n)),
    );
    if (note) components.push(text(note));
    const count = n ? ` ${n}` : '';
    components.push(
        BIG(),
        text(n ? `-# With the **${n}** selected…` : '-# Select draws to edit, end, export or delete them…'),
        // End Date for every selected draw (2026-11-10 11:19 EST): at a season's end many draws end together.
        row(btn(['tedit', token, pg], `Edit${count}`, emojis.edit, 1, !n), btn(['tend', token, pg], `End Date${count}`, emojis.timestamp, 2, !n), btn(['texp', token], `Export${count}`, emojis.copyExport, 2, !n), btn(['tdel', token, pg], `Delete${count}`, emojis.deleteBin, 4, !n)),
        row(btn('select', 'Select Again', emojis.filter), homeBtn()),
    );
    return panel(components);
}

// ---------- pop-ups ----------
const labelled = (label, component, description) => ({ type: 18, label, ...(description ? { description } : {}), component });
// Named as the lists are, not "All New Draws" (2026-11-10 11:16 EST): with picks that narrow each other, "All" read as every one of them.
const QUICK = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }));
const quickSelect = () => (require('../../../utils/formChoice').asChoice({ type: 3, custom_id: 'picks', required: false, min_values: 0, max_values: QUICK.length, placeholder: 'Pick any', options: QUICK }));
const titlesBox = () => labelled('Draw titles', { type: 4, custom_id: 'names', style: 2, required: false, max_length: 2000, placeholder: 'Sapphire Winter\nWhorl of Midnight' }, 'One per line; part of a title is enough. Added to the quick picks.');
const searchModal = () => ({ custom_id: ID('findm'), title: 'Find a Draw', components: [labelled('Words', { type: 4, custom_id: 'q', style: 1, required: true, max_length: 100, placeholder: 'sapphire · kestrel' }, 'Words in the title or an item\'s name, in any order')] });
// The quick picks read like /draws' own filter (2026-11-10 11:19 EST): within a group they widen, across groups they narrow.
const PICKS_HINT = 'New + Ended = the New draws that ended. Typed titles are added.';
const selectModal = () => ({ custom_id: ID('selectm'), title: 'Select Draws', components: [titlesBox(), labelled('Quick picks', quickSelect(), PICKS_HINT)] });
function exportModal() {
    return {
        custom_id: ID('exportm'), title: 'Export Draws',
        components: [
            titlesBox(),
            labelled('Quick picks', quickSelect(), `${PICKS_HINT} Both empty: every draw.`.slice(0, 100)),
            labelled('Send to', { type: 21, custom_id: 'dest', required: true, options: [{ value: 'file', label: 'A file here', default: true }, { value: 'dm', label: 'A DM to me' }] }),
            labelled('Include', { type: 22, custom_id: 'include', required: false, min_values: 0, max_values: 3, options: [['end', 'End dates'], ['image', 'Image link'], ['type', 'Draw type']].map(([value, label]) => ({ value, label, default: true })) }),
        ],
    };
}

// ---------- End Date ---------- (2026-11-10 11:19 EST) A draw's end lives on its /calendar row. This pop-up writes only that end, in the shape Quick Add writes it; /manage calendar's own editor (title, section, Double CP) is one click away on the card's Calendar button. `row` is the draw's calendar row or null; `count` names a Select's many draws.
function endModal(customId, { title = '', row: calRow = null, count = 0 } = {}) {
    const { formatAdminDate } = require('../../../utils/adminParser');
    const now = calRow ? (calRow.isOngoing ? 'season' : calRow.endDate ? 'date' : 'tbd') : 'date';
    const head = count ? `End Date · ${plural(count, 'draw')}` : `End Date · ${title}`;
    return {
        custom_id: customId, title: head.slice(0, 45),
        components: [
            labelled('Ends', { type: 21, custom_id: 'when', required: true, options: [
                { value: 'date', label: 'On the date below', ...(now === 'date' ? { default: true } : {}) },
                { value: 'season', label: 'With the season (All Season)', ...(now === 'season' ? { default: true } : {}) },
                { value: 'tbd', label: 'Not announced yet (TBD)', ...(now === 'tbd' ? { default: true } : {}) },
            ] }),
            labelled('Date', { type: 4, custom_id: 'date', style: 1, required: false, max_length: 60, placeholder: 'Nov 20 · Nov 20 7pm edt · 13d 23h', ...(calRow?.endDate ? { value: formatAdminDate(new Date(calRow.endDate)) } : {}) }, 'A date, a time (Toronto unless a zone is typed) or the game\'s countdown'),
        ],
    };
}

// ---------- Check Draw Index ---------- (2026-11-09 13:57 EST, his ask: "bulk paste draw names or item names and check if we have a draw for that search, if the draw/catalogue contains all the info/needs updating")
const checkModal = (value = '', token = null) => ({ custom_id: ID('checkm', token || ''), title: 'Check the Draw Index', components: [labelled('Draw or item names', { type: 4, custom_id: 'names', style: 2, required: true, max_length: 4000, placeholder: 'cx9 lethal hollow\nherrscher of reason\nmythic character', ...(value ? { value: String(value).slice(0, 4000) } : {}) }, 'One per line, up to 20. Checking changes nothing.')] });
// The result: a count line, then one block per line pasted. Discord holds 4,000 characters of text in a message: blocks past that are dropped and counted, never cut mid-line. `token` keeps what was pasted (2026-11-10 11:19 EST): Check Again opens it again, and Quick Add These opens Quick Add with the lines that found a draw.
function checkView({ results, extra = 0, indexSize = 0 }, token = null, foundCount = 0) {
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
    const quick = token && foundCount
        ? btn(['qathese', token], foundCount === 1 ? 'Quick Add This One' : `Quick Add These ${Math.min(foundCount, 10)}`, emojis.mngAdd, 3)
        : btn('quickadd', 'Quick Add', emojis.mngAdd);
    components.push(BIG(), row(btn(['check', token || ''], 'Check Again', emojis.search, 1), quick, homeBtn()));
    return panel(components);
}

module.exports = {
    checkModal, checkView, endModal, gapsFor, ID, PAGE, LOOK_PAGE, STATUS, row, text, btn, homeBtn, panel, plural, stamp, allDraws, listOf, splitKey, rowFor, secWord, stateName, dot, typeName,
    pageView, listView, searchView, cardView, resultView, selectView, searchModal, selectModal, exportModal, labelled };
