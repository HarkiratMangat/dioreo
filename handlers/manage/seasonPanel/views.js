// ==========================================
// /manage season — the panels (live season, Next Season Draft)
// ==========================================
// Built 2026-11-07 21:06 EST for the rest of the /manage rehaul (builder C3), copying handlers/manage/drawsPanel/views.js: one message that changes in place, Back and Home on every non-home view, in-place confirms for Promote and Discard, read-only lists. Every function here only BUILDS a message; routing, permission checks and saves are in ./index.js.
//
// custom_ids: `mng_ss|<verb>|…`, at most 100 characters (asserted by ID()). `mng_` puts every click behind the router's /manage lock; ./index.js checks each action's own tier.
//
// ⚠️ DEADLINES ARE STORED INSTANTS AND ARE SHOWN AS DISCORD TIMESTAMPS (`<t:…:f>` plus `<t:…:R>`), never a bare date: a bare date once hid a four-hour error (docs/db-deferred-list.md's season-deadline entry). TBD shows as TBD, a missing date as "not set".
//
// ⚠️ EMOJIS ARE READ INSIDE FUNCTIONS. utils/emojiMap.js values are rewritten at boot after modules load, so a module-level read freezes the wrong ids.

const emojis = require('../../../utils/emojiMap');

const ACCENT = 15898954; // /season end's Neon Amber (commands/seasonend.js PRESET_ACCENT)
const PAGE = 10;

function ID(...parts) {
    const id = ['mng_ss', ...parts.map(p => (p === undefined || p === null ? '' : String(p)))].join('|');
    if (id.length > 100) throw new Error(`season custom_id over 100 characters: ${id}`);
    return id;
}
const row = (...c) => ({ type: 1, components: c });
const text = (content) => ({ type: 10, content });
const BIG = () => ({ type: 14, divider: true, spacing: 2 });
const SMALL = () => ({ type: 14, divider: false, spacing: 1 });
const btn = (parts, label, emojiStr, style = 2, disabled = false) => ({ type: 2, style, ...(label ? { label } : {}), custom_id: ID(...[].concat(parts)), disabled, ...(emojiStr ? { emoji: emojis.parseEmoji(emojiStr) } : {}) });
const arrow = (parts, dir, disabled) => ({ type: 2, style: 2, custom_id: ID(...[].concat(parts)), emoji: emojis.parseEmoji(dir === 'left' ? emojis.left : emojis.right), disabled });
const counter = (parts, label) => ({ type: 2, style: 2, label, custom_id: ID(...[].concat(parts)), disabled: true });
const crumb = (...p) => `-# ${['Season', ...p].join('  ›  ')}`;
const panel = (components, after = []) => [{ type: 17, accent_color: ACCENT, components }, ...after];
const homeBtn = () => btn(['view', 'live'], 'Home', emojis.returnArrow);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// ---------- dates ----------
const unix = (d) => Math.floor(new Date(d).getTime() / 1000);
const stamp = (d) => `<t:${unix(d)}:f> · <t:${unix(d)}:R>`;
// One deadline: the stored instant as timestamps, TBD as TBD, nothing as "not set". A start, when stored, leads.
function whenLine(start, end, tbd) {
    const endText = tbd ? 'TBD' : end ? stamp(end) : 'not set';
    return `${start ? `Starts <t:${unix(start)}:f> · ` : ''}Ends ${endText}`;
}
// Read inside the function: emoji values change at boot.
const PARTS = () => [['Battle Pass', 'bp', emojis.bp], ['Ranked', 'rank', emojis.rank], ['DMZ', 'dmz', emojis.dmz]];
// Battle Pass / Ranked / DMZ as three rows: the title, then its deadline on a small line. `src` is the live document or its `draft`.
function seasonRows(src) {
    return PARTS().map(([label, key, emoji]) => `${emoji} **${label}** · ${src?.[`${key}Title`] || label}\n-# ${whenLine(src?.[`${key}Start`], src?.[`${key}End`], src?.[`${key}EndTBD`])}`).join('\n');
}
const seasonName = (title, emoji) => {
    if (!title) return '*(not set)*';
    const e = require('../../../utils/seasonEmoji').seasonEmojiFor(title, emoji);
    return `${e ? `${e} ` : ''}${require('../../../utils/titleBlock').toBoldItalicUnicode(title)}`;
};

// ---------- what is staged ----------
const newsRows = (draft) => [
    ...(draft?.newDraws || []).filter(r => r.newsSource).map(r => ({ kind: 'New draw', r })),
    ...(draft?.returningDraws || []).filter(r => r.newsSource).map(r => ({ kind: 'Returning draw', r })),
    ...(draft?.calendar || []).filter(r => r.newsSource).map(r => ({ kind: 'Calendar', r })),
];
function counts(doc) {
    const d = doc?.draft || {};
    return { nd: (d.newDraws || []).length, rd: (d.returningDraws || []).length, cal: (d.calendar || []).length, news: newsRows(d).length, fields: Object.keys(d.newsSeasonSet || {}).length };
}
const isStaged = (doc) => {
    const d = doc?.draft;
    if (!d) return false;
    const c = counts(doc);
    return Boolean(d.active || d.currentSeasonTitle || c.nd || c.rd || c.cal);
};
const stagedLine = (doc) => {
    if (!isStaged(doc)) return 'nothing staged';
    const c = counts(doc);
    return `staged · ${c.nd} new · ${c.rd} returning · ${c.cal} calendar`;
};

// ---------- the two home views ----------
function pageView(doc, view = 'live', note = null, { pageRow = null } = {}) {
    return view === 'draft' ? draftView(doc, note, pageRow) : liveView(doc, note, pageRow);
}

function liveView(doc, note, pageRow) {
    const e = doc?.currentSeasonTitle ? require('../../../utils/seasonEmoji').seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji) : null;
    const title = doc?.currentSeasonTitle ? require('../../../utils/titleBlock').toBoldItalicUnicode(doc.currentSeasonTitle) : 'Season';
    const components = [text(`## ${e ? `${e} ` : ''}${title}\n-# Live now: what players see`)];
    if (note) components.push(SMALL(), text(note));
    components.push(
        BIG(),
        text(seasonRows(doc)),
        BIG(),
        text(`-# Next season: ${stagedLine(doc)}`),
        row(btn(['tl', 'live'], 'Edit Titles & Deadlines', emojis.edit, 1), btn('wipe', 'Start New Season', emojis.deleteBin, 4), btn(['view', 'draft'], 'Next Season Draft', emojis.newDraws)),
    );
    return panel(components, pageRow ? [pageRow] : []);
}

function draftView(doc, note, pageRow) {
    const d = doc?.draft || {};
    const staged = isStaged(doc);
    const c = counts(doc);
    const components = [text(`${crumb('Next Season Draft')}\n## ${emojis.newDraws} Next Season Draft\n-# ${staged ? 'Staged, not live. Nothing here reaches players until you press Promote to Live.' : 'Nothing is staged, and nothing goes live until you press Promote to Live.'}`)];
    if (note) components.push(SMALL(), text(note));
    components.push(BIG());
    if (!staged) {
        components.push(
            text('-# Stage next season…'),
            row(btn(['tl', 'draft'], 'Edit Titles & Deadlines', emojis.edit, 1), btn('dr', 'Paste Draws', emojis.mngBulkAdd), btn('cal', 'Paste Calendar', emojis.mngBulkAdd)),
            BIG(),
            row(btn('guide', 'Guide', emojis.guide), btn(['view', 'live'], 'Live Season', emojis.returnArrow)),
        );
        return panel(components, pageRow ? [pageRow] : []);
    }
    components.push(
        text(`**Title:** ${seasonName(d.currentSeasonTitle, d.currentSeasonEmoji)}\n${seasonRows(d)}${c.fields ? `\n-# ${emojis.mngInfo} News set ${plural(c.fields, 'season field')} here.` : ''}`),
        BIG(),
        text('-# Staged lists (read only)…'),
        row(btn(['ls', 'nd', 0], `New Draws · ${c.nd}`, emojis.newDraws, 2, !c.nd), btn(['ls', 'rd', 0], `Returning · ${c.rd}`, emojis.returningDraws, 2, !c.rd), btn(['ls', 'cal', 0], `Calendar · ${c.cal}`, emojis.calendar, 2, !c.cal), btn(['ls', 'news', 0], `News · ${c.news}`, emojis.mngInfo, 2, !c.news)),
        SMALL(),
        text('-# Change what is staged…'),
        row(btn(['tl', 'draft'], 'Edit Titles & Deadlines', emojis.edit, 1), btn('dr', 'Paste Draws', emojis.mngBulkAdd), btn('cal', 'Paste Calendar', emojis.mngBulkAdd)),
        BIG(),
        row(btn('promote', 'Promote to Live', emojis.checkmark, 3), btn('discard', 'Discard Draft', emojis.deleteBin, 4)),
        row(btn('guide', 'Guide', emojis.guide), btn(['view', 'live'], 'Live Season', emojis.returnArrow)),
    );
    return panel(components, pageRow ? [pageRow] : []);
}

// ---------- read-only lists ---------- Ten a page, in the order they are staged. `kind`: nd · rd · cal · news.
const dayStamp = (d) => (d ? `<t:${unix(d)}:f>` : 'no date');
function drawLine(r) { return `**${r.title || '(untitled)'}**\n-# ${dayStamp(r.date)} · ${plural((r.items || []).length, 'item')}`; }
function calLine(r) {
    const end = r.isOngoing ? 'All Season' : r.endDate ? `<t:${unix(r.endDate)}:f>` : 'no end date';
    return `**${r.title || '(untitled)'}**\n-# ${r.category || 'event'} · ${dayStamp(r.date)} › ${end}`;
}
function newsLine({ kind, r }) {
    const s = r.newsSource || {};
    const flags = [s.dated === false ? 'placeholder date' : null, s.noEnd ? 'no end date' : null, s.carried ? 'carried over' : null].filter(Boolean);
    return `**${r.title || '(untitled)'}**\n-# ${kind} · ${dayStamp(r.date)}${flags.length ? ` · ${flags.join(' · ')}` : ''}`;
}
const KINDS = () => ({
    nd: { label: 'New Draws', emoji: emojis.newDraws, items: (d) => d.newDraws || [], line: drawLine },
    rd: { label: 'Returning Draws', emoji: emojis.returningDraws, items: (d) => d.returningDraws || [], line: drawLine },
    cal: { label: 'Calendar', emoji: emojis.calendar, items: (d) => d.calendar || [], line: calLine },
    news: { label: 'News Items', emoji: emojis.mngInfo, items: (d) => newsRows(d), line: newsLine },
});
function listView(doc, kind, page = 0) {
    const key = KINDS()[kind] ? kind : 'nd';
    const k = KINDS()[key];
    const list = k.items(doc?.draft || {});
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = list.slice(pg * PAGE, pg * PAGE + PAGE);
    const components = [text(`${crumb('Next Season Draft', k.label)}\n## ${k.emoji} Staged ${k.label}\n-# ${plural(list.length, 'row')}${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''} · read only`), BIG()];
    if (!shown.length) components.push(text(`${emojis.cross} Nothing staged here.`));
    else components.push(text(shown.map(k.line).join('\n').slice(0, 3900)));
    if (pages > 1) components.push(row(arrow(['ls', key, pg - 1], 'left', pg === 0), counter(['pgn', key], `Page ${pg + 1} / ${pages}`), arrow(['ls', key, pg + 1], 'right', pg === pages - 1)));
    components.push(BIG(), row(btn(['view', 'draft'], 'Back', emojis.returnArrow), homeBtn()));
    return panel(components);
}

// ---------- in-place confirms ----------
// What Promote swaps, field by field: the live value struck through, then the staged one. Comparing the strings tells the admin what really moves.
const oneLine = (title, end, tbd, start) => `${title}, ${whenLine(start, end, tbd)}`;
function promoteConfirm(doc) {
    const d = doc?.draft || {};
    const c = counts(doc);
    const live = { nd: (doc.newDraws || []).length, rd: (doc.returningDraws || []).length, cal: (doc.calendar || []).length };
    const lines = [`**Season:** ~~${doc.currentSeasonTitle || 'not set'}~~ → ${d.currentSeasonTitle || '*(not set)*'}`];
    for (const [label, key] of PARTS()) {
        const was = oneLine(doc[`${key}Title`] || label, doc[`${key}End`], doc[`${key}EndTBD`], doc[`${key}Start`]);
        const now = oneLine(d[`${key}Title`] || label, d[`${key}End`], d[`${key}EndTBD`], d[`${key}Start`]);
        lines.push(`**${label}:** ${was === now ? 'unchanged' : `~~${was}~~ → ${now}`}`);
    }
    lines.push(`**Draws:** ~~${live.nd} New, ${live.rd} Returning~~ → ${c.nd} New, ${c.rd} Returning`, `**Calendar:** ~~${plural(live.cal, 'event')}~~ → ${plural(c.cal, 'event')}`);
    return panel([
        text(`${crumb('Next Season Draft', 'Promote')}\n### ${emojis.warn} Promote the staged draft to live?\n-# Players see this at once. The draft is cleared. Every change is recorded in /bot analytics › Changes.`),
        SMALL(),
        text(lines.join('\n').slice(0, 3800)),
        BIG(),
        row(btn('promoteok', 'Yes, Promote', emojis.checkmark, 3), btn(['view', 'draft'], 'Cancel', emojis.returnArrow)),
    ]);
}
function discardConfirm(doc) {
    const d = doc?.draft || {};
    const c = counts(doc);
    const lines = [
        `**Title:** ${d.currentSeasonTitle || '*(not set)*'}`,
        '**Deadlines:** Battle Pass, Ranked and DMZ titles and dates',
        `**Draws:** ${c.nd} New, ${c.rd} Returning`,
        `**Calendar:** ${plural(c.cal, 'event')}`,
        ...(c.news ? [`**News items:** ${c.news}`] : []),
    ];
    return panel([
        text(`${crumb('Next Season Draft', 'Discard')}\n### ${emojis.warn} Discard the staged draft?\n-# This erases everything staged for next season. What is live is untouched. Every change is recorded in /bot analytics › Changes.`),
        SMALL(),
        text(`Erased:\n${lines.join('\n')}`.slice(0, 3800)),
        BIG(),
        row(btn('discardok', 'Yes, Discard', emojis.deleteBin, 4), btn(['view', 'draft'], 'Cancel', emojis.returnArrow)),
    ]);
}

// A result: `### ✅ …` / `### ⚠️ …` with Back and Home.
function resultView({ crumbs = [], title, body = [], ok = true, back = ['view', 'draft'], backLabel = 'Back', extraButtons = [] }) {
    return panel([
        ...(crumbs.length ? [text(crumb(...crumbs))] : []),
        text(`### ${ok === 'warn' ? emojis.warn : ok ? emojis.checkmark : emojis.cross} ${title}`),
        ...(body.length ? [SMALL(), text(body.join('\n').slice(0, 3800))] : []),
        BIG(),
        row(...extraButtons, btn([].concat(back), backLabel, emojis.returnArrow), homeBtn()),
    ]);
}

module.exports = { ID, PAGE, row, text, btn, panel, homeBtn, plural, whenLine, stamp, seasonRows, counts, newsRows, isStaged, pageView, listView, promoteConfirm, discardConfirm, resultView };
