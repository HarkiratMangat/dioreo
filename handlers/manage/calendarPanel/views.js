// ==========================================
// /manage calendar — the panels and pop-ups
// ==========================================
// Built 2026-11-07 21:06 EST from the draws panel (handlers/manage/drawsPanel/, v3.14.0), on his word that the rest of /manage gets the same rehaul: one message that changes in place, Back and Home everywhere, an entry card with its own actions, a list per status, Select for many entries, one Export pop-up, Paste with a preview. Every function here only BUILDS a message or a pop-up; routing, permission checks and saves are in ./index.js.
//
// custom_ids: `mng_ca|<verb>|…`, at most 100 characters (asserted). `mng_` puts every click behind the router's /manage lock (handlers/router.js); ./index.js checks each action's own tier with resolveAction.
//
// An entry's KEY is `c:<id>`: only the STORED calendar rows (SeasonalData.calendar) are managed here. /calendar also shows a draw that has no row of its own, synthesized from New/Returning Draws at render time; those live in /manage draws, so they are not listed here.

const emojis = require('../../../utils/emojiMap');

const ACCENT = 3821672; // /calendar's Slate Harbor (commands/calendar.js PRESET_ACCENT)
const PAGE = 10;
const LEAVING_SOON_MS = 3 * 24 * 60 * 60 * 1000; // the same 3 days /draws calls Leaving Soon (commands/draws.js)

function ID(...parts) {
    const id = ['mng_ca', ...parts.map(p => (p === undefined || p === null ? '' : String(p)))].join('|');
    if (id.length > 100) throw new Error(`calendar custom_id over 100 characters: ${id}`);
    return id;
}
const row = (...c) => ({ type: 1, components: c });
const text = (content) => ({ type: 10, content });
const BIG = () => ({ type: 14, divider: true, spacing: 2 });
const SMALL = () => ({ type: 14, divider: false, spacing: 1 });
const btn = (parts, label, emojiStr, style = 2, disabled = false) => ({ type: 2, style, ...(label ? { label } : {}), custom_id: ID(...[].concat(parts)), disabled, ...(emojiStr ? { emoji: emojis.parseEmoji(emojiStr) } : {}) });
const arrow = (parts, dir, disabled) => ({ type: 2, style: 2, custom_id: ID(...[].concat(parts)), emoji: emojis.parseEmoji(dir === 'left' ? emojis.left : emojis.right), disabled });
const counter = (parts, label) => ({ type: 2, style: 2, label, custom_id: ID(...[].concat(parts)), disabled: true });
const crumb = (...p) => `-# ${['Calendar', ...p].join('  ›  ')}`;
const panel = (components, after = []) => [{ type: 17, accent_color: ACCENT, components }, ...after];
const homeBtn = () => btn('page', 'Home', emojis.returnArrow);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// ---------- the entries, timed ---------- /calendar through the public client's command Collection, looked up on each call, never required: a require would put every /manage handler in the closure of a hotpatch to /calendar (utils/hotpatch.js would refuse it). bot/registry.js fills the Collection and a hotpatch re-sets it. Tests set clients.public.
const C = () => {
    const cmd = require('../../../bot/clients').publicClient()?.commands?.get('calendar');
    if (!cmd) throw new Error('calendarPanel: /calendar is not loaded on the public client');
    return cmd;
};
const cat = (e) => e.category || 'event'; // an old row with no category is an event, as /calendar reads it
const splitKey = (key) => String(key).split(':')[1];
// The draw a calendar draw row belongs to, on the live /draws (New, then Returning), by the same title rule /calendar itself uses (utils/search.js bestDrawMatch): its key in the draws panel (`n:<id>` / `r:<id>`), or null when /draws has no draw by that title, so the row shows dates with no items, picture or price (2026-11-09, the /manage audit's finding 11).
function drawKeyFor(doc, e) {
    if (cat(e) !== 'draw') return null;
    const { bestDrawMatch } = require('../../../utils/search');
    const pool = [...(doc.newDraws || []).map(d => ({ d, k: `n:${d._id}` })), ...(doc.returningDraws || []).map(d => ({ d, k: `r:${d._id}` }))];
    return bestDrawMatch(pool, e.title, x => x.d.title)?.k || null;
}
const noDraw = (doc, e) => cat(e) === 'draw' && !drawKeyFor(doc, e);
function allEntries(doc, nowMs = Date.now()) {
    return (doc.calendar || []).map(e => ({ ...e, _key: `c:${e._id}`, _cat: cat(e), _noDraw: noDraw(doc, e), ...C().entryState(e, doc, nowMs) }));
}
const typeWord = (e) => ({ draw: 'Draw', playlist: 'Playlist' }[e._cat] || 'Event');
// Something a person would want to look at: no start date, or no end date on a row that is not "All Season", or an end before its start.
const needsLook = (e) => !Number.isFinite(e.startMs) || (!e.isOngoing && !e.endDate) || (!e.isOngoing && e.endDate && new Date(e.endDate) < new Date(e.date)) || e._noDraw;

// The lists: by type, and by the states /calendar's own entryState gives (over, live, soon, tba), plus Ending Soon (live, with an end within 3 days) and the rows worth a look.
const STATUS = {
    events: { label: 'Events', test: e => e._cat === 'event', emoji: () => emojis.events },
    playlists: { label: 'Playlists', test: e => e._cat === 'playlist', emoji: () => emojis.modes },
    draws: { label: 'Draws', test: e => e._cat === 'draw', emoji: () => emojis.newDraws },
    upcoming: { label: 'Upcoming', test: e => e.state === 'soon' || e.state === 'tba', emoji: () => emojis.lightBlueDotGlow },
    live: { label: 'Active Now', test: e => e.state === 'live', emoji: () => emojis.greenDotGlow },
    leaving: { label: 'Ending Soon', test: e => e.state === 'live' && Number.isFinite(e.endMs) && e.endMs - Date.now() <= LEAVING_SOON_MS, emoji: () => emojis.yellowDotGlow },
    ended: { label: 'Ended', test: e => e.state === 'over', emoji: () => emojis.redDotGlow },
    warn: { label: 'Needs a Look', test: needsLook, emoji: () => emojis.warn },
};
const leaving = (e) => STATUS.leaving.test(e);
const dot = (e) => (e.state === 'over' ? emojis.redDotGlow : leaving(e) ? emojis.yellowDotGlow : e.state === 'live' ? emojis.greenDotGlow : emojis.lightBlueDotGlow);
const stateName = (e) => (e.state === 'over' ? 'Ended' : leaving(e) ? 'Ending soon' : e.state === 'live' ? 'Active now' : e.state === 'tba' ? 'Date TBA' : 'Upcoming');
function stateWords(e) {
    const r = (ms) => `<t:${Math.floor(ms / 1000)}:R>`;
    if (e.state === 'tba') return 'date TBA';
    if (e.state === 'over') return `ended ${r(e.endMs)}`;
    if (e.state === 'soon') return `starts ${r(e.startMs)}`;
    if (Number.isFinite(e.endMs)) return `${leaving(e) ? 'ending' : 'ends'} ${r(e.endMs)}`;
    return e.isOngoing ? 'runs all season' : '**no end date**';
}
// One entry as a list row: the dot, the title, then its type and when, on a small line padded under the title.
const listLine = (e, mark = '') => `${mark}${dot(e)} **${e.title}**\n-# ${emojis.blank}${emojis.blank}${mark ? emojis.blank : ''} ${typeWord(e)} · ${stateWords(e)}${e._noDraw ? ` · ${emojis.warn} no draw on /draws` : ''}`;

async function seasonLine(doc) {
    if (!doc?.currentSeasonTitle) return '';
    const emoji = require('../../../utils/seasonEmoji').seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji);
    return `\n${emoji ? `${emoji} ` : ''}${require('../../../utils/titleBlock').toBoldItalicUnicode(doc.currentSeasonTitle)}`;
}

// ---------- home ----------
async function pageView(doc, note = null, { pageRow = null } = {}) {
    const all = allEntries(doc);
    const n = (k) => all.filter(STATUS[k].test).length;
    const counts = [`${n('events')} events`, `${n('playlists')} playlists`, `${n('draws')} draws`, `${n('live')} active now`, ...(n('warn') ? [`${emojis.warn} ${n('warn')} to look at`] : [])].join(' · ');
    const components = [text(`## ${emojis.calendar} Calendar${await seasonLine(doc)}\n-# ${counts}`)];
    if (note) components.push(SMALL(), text(note));
    const browse = Object.entries(STATUS).filter(([k]) => k !== 'warn' || n('warn')).map(([value, s]) => ({ value, label: `${s.label} · ${n(value)}`, emoji: emojis.parseEmoji(s.emoji()) }));
    components.push(
        BIG(),
        text('-# Add…'),
        row(btn('add', 'Add Entry', emojis.mngAdd, 3), btn('paste', 'Paste Entries', emojis.pasteImport)),
        SMALL(),
        text('-# Find an entry…'),
        row(btn('find', 'Search Calendar', emojis.gunsmithSearch, 1)),
        { type: 1, components: [{ type: 3, custom_id: ID('browse'), placeholder: 'Or browse a list…', options: browse }] },
        BIG(),
        text('-# Many at once…'),
        row(btn('select', 'Select Entries', emojis.filter), btn('export', 'Export', emojis.copyExport), btn('banners', 'Banners', emojis.calendar), btn('guide', 'Guide', emojis.guide)),
        SMALL(),
        text('-# End of season…'),
        row(btn('purge', 'Purge Calendar', emojis.deleteBin, 4)),
    );
    return panel(components, pageRow ? [pageRow] : []);
}

// ---------- a list ---------- The order each list reads in: what ends soonest first on Active Now and Ending Soon, the latest ended first on Ended, by start everywhere else.
const END = (e) => (Number.isFinite(e.endMs) ? e.endMs : Infinity);
const byStart = (a, b) => (a.startMs || 0) - (b.startMs || 0);
const ORDER = { live: (a, b) => END(a) - END(b) || byStart(a, b), leaving: (a, b) => END(a) - END(b) || byStart(a, b), ended: (a, b) => END(b) - END(a) || byStart(a, b) };
const entries = (n) => `${n} ${n === 1 ? 'entry' : 'entries'}`;
function listView(doc, status, page = 0) {
    const s = STATUS[status] || STATUS.events;
    const list = allEntries(doc).filter(s.test).sort(ORDER[status] || byStart);
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = list.slice(pg * PAGE, pg * PAGE + PAGE);
    const components = [text(`${crumb(s.label)}\n## ${s.emoji()} ${s.label}\n-# ${entries(list.length)}${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`), BIG()];
    if (!shown.length) components.push(text(`${emojis.cross} Nothing here right now.`));
    else {
        components.push(text(shown.map(e => listLine(e)).join('\n').slice(0, 3900)));
        components.push({ type: 1, components: [{ type: 3, custom_id: ID('open', status), placeholder: 'Open an entry…', options: shown.map(e => ({ label: e.title.slice(0, 100), value: e._key, description: `${typeWord(e)} · ${stateName(e)}` })) }] });
        if (pages > 1) components.push(row(arrow(['list', status, pg - 1], 'left', pg === 0), counter(['pgn', status], `Page ${pg + 1} / ${pages}`), arrow(['list', status, pg + 1], 'right', pg === pages - 1)));
    }
    components.push(BIG(), row(btn(['sellist', status], list.length === 1 ? 'Select This One' : `Select These ${list.length}`, emojis.filter, 2, !list.length), homeBtn()));
    return panel(components);
}

// ---------- one entry ---------- `header` sits above the card (a confirm question, a saved note); `extra` replaces the action rows. `back` is the list it was opened from.
function cardView(doc, key, { header = null, extra = null, back = null } = {}) {
    const e = allEntries(doc).find(x => x._key === key);
    if (!e) return null;
    const ts = (ms, style) => `<t:${Math.floor(ms / 1000)}:${style}>`;
    const when = [
        Number.isFinite(e.startMs) ? `**Starts** ${ts(e.startMs, 'F')} · ${ts(e.startMs, 'R')}` : '**Starts** date TBA',
        Number.isFinite(e.endMs) ? `**Ends** ${ts(e.endMs, 'F')} · ${ts(e.endMs, 'R')}` : e.isOngoing ? '**Ends** with the season' : `**Ends** ${emojis.warn} no end date`,
    ].join('\n');
    const components = [text(crumb(STATUS[back]?.label || `${typeWord(e)}s`, e.title))];
    if (header) components.push(text(header), SMALL());
    // The entry as /calendar shows it (its own renderer, so the card can never drift from the player's view), then the dates in full.
    components.push(text(C().buildEntryLine(e, doc)), text(when));
    const drawKey = drawKeyFor(doc, e);
    const drawNote = e._cat !== 'draw' ? '' : drawKey ? '\n-# The draw itself (items, picture, type) lives in /manage draws: Open the Draw.' : `\n${emojis.warn} **No draw on /draws has this title**, so players see the dates with no items, picture or price. Add the Draw opens Quick Add with this row's dates.`;
    components.push(text(`-# ${typeWord(e)} · ${stateName(e)}${e.isDoubleCP ? ' · 2x CP' : ''}${drawNote}`), BIG());
    if (extra) components.push(...extra);
    else {
        const backTo = STATUS[back] ? back : ({ draw: 'draws', playlist: 'playlists' }[e._cat] || 'events');
        // A draw row: Open the Draw (its card in /manage draws, `mng_dr|card|<key>`) or, with none, Add the Draw (2026-11-09, the /manage audit's finding 11).
        const drawBtn = e._cat !== 'draw' ? [] : drawKey ? [{ type: 2, style: 2, label: 'Open the Draw', custom_id: `mng_dr|card|${drawKey}`, emoji: emojis.parseEmoji(emojis.expand) }] : [btn(['qadraw', key], 'Add the Draw', emojis.mngAdd, 3)];
        components.push(
            row(btn(['edit', key], 'Edit', emojis.edit, 1), ...drawBtn, btn(['del', key], 'Delete', emojis.deleteBin, 4)),
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
    const byKey = new Map(allEntries(doc).map(e => [e._key, e]));
    const keys = sel.ids.filter(k => byKey.has(k));
    const selected = new Set(sel.selected);
    const pages = Math.max(1, Math.ceil(keys.length / PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = keys.slice(pg * PAGE, pg * PAGE + PAGE);
    const n = keys.filter(k => selected.has(k)).length;
    const components = [text(`${crumb('Select Entries')}\n## ${emojis.filter} Select Entries${sel.query?.length ? `\n-# ${sel.query.map(q => `\`${q}\``).join(' · ').slice(0, 500)}` : ''}`)];
    if (sel.unmatched?.length) components.push(text(`-# ${emojis.warn} Nothing matched ${sel.unmatched.map(x => `\`${x}\``).join(', ').slice(0, 500)}`));
    components.push(BIG());
    if (!keys.length) {
        components.push(text(`${emojis.cross} **No entries found.** Try part of a title, or a quick pick.`), BIG(), row(btn('select', 'Search Again', emojis.gunsmithSearch, 1), homeBtn()));
        return panel(components);
    }
    components.push(
        text(`-# **${keys.length}** found · **${n}** selected${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`),
        text(shown.map(k => listLine(byKey.get(k), `${selected.has(k) ? emojis.check : emojis.smallDot} `)).join('\n').slice(0, 3900)),
        SMALL(),
        { type: 1, components: [{ type: 3, custom_id: ID('flip', token, pg), min_values: 1, max_values: shown.length, placeholder: 'Select or unselect entries…', options: shown.map(k => { const e = byKey.get(k); return { label: e.title.slice(0, 100), value: k, description: `${selected.has(k) ? 'Selected' : 'Not selected'} · ${typeWord(e)} · ${stateName(e)}`.slice(0, 100) }; }) }] },
        ...(pages > 1 ? [row(arrow(['slist', token, pg - 1], 'left', pg === 0), counter(['spg', token], `Page ${pg + 1} / ${pages}`), arrow(['slist', token, pg + 1], 'right', pg === pages - 1))] : []),
        row(btn(['all', token, pg], `Select All ${keys.length}`, emojis.checkmark, 2, n === keys.length), btn(['none', token, pg], 'Clear', emojis.cross, 2, !n)),
    );
    if (note) components.push(text(note));
    components.push(
        BIG(),
        text(n ? `-# With the **${n}** selected…` : '-# Select entries to edit, export or delete them…'),
        row(btn(['tedit', token, pg], `Edit ${n || ''}`.trim(), emojis.edit, 1, !n), btn(['texp', token], `Export ${n || ''}`.trim(), emojis.copyExport, 2, !n), btn(['tdel', token, pg], `Delete ${n || ''}`.trim(), emojis.deleteBin, 4, !n)),
        row(btn('select', 'Search Again', emojis.gunsmithSearch), homeBtn()),
    );
    return panel(components);
}

// ---------- pop-ups ----------
const labelled = (label, component, description) => ({ type: 18, label, ...(description ? { description } : {}), component });
const QUICK = Object.entries(STATUS).map(([value, s]) => ({ value, label: `All ${s.label}` }));
const quickSelect = () => (require('../../../utils/formChoice').asChoice({ type: 3, custom_id: 'picks', required: false, min_values: 0, max_values: QUICK.length, placeholder: 'Pick any', options: QUICK }));
const titlesBox = () => labelled('Entry titles', { type: 4, custom_id: 'names', style: 2, required: false, max_length: 2000, placeholder: 'Throwable Frenzy\nNuketown Playlist' }, 'One per line; part of a title is enough. Added to the quick picks.');
const searchModal = () => ({ custom_id: ID('findm'), title: 'Find a Calendar Entry', components: [labelled('Title', { type: 4, custom_id: 'q', style: 1, required: true, max_length: 100, placeholder: 'nuketown' }, 'Part of the title is enough')] });
const selectModal = () => ({ custom_id: ID('selectm'), title: 'Select Entries', components: [titlesBox(), labelled('Quick picks', quickSelect(), 'Everything picked is included: Events + Ended = both.')] });
function exportModal() {
    return {
        custom_id: ID('exportm'), title: 'Export Calendar',
        components: [
            titlesBox(),
            labelled('Quick picks', quickSelect(), 'Leave both empty for every entry.'),
            labelled('Send to', { type: 21, custom_id: 'dest', required: true, options: [{ value: 'file', label: 'A file here', default: true }, { value: 'dm', label: 'A DM to me' }] }),
        ],
    };
}

module.exports = { drawKeyFor, ID, PAGE, STATUS, row, text, btn, homeBtn, panel, plural, allEntries, splitKey, typeWord, dot, stateName, pageView, listView, cardView, resultView, selectView, searchModal, selectModal, exportModal };
