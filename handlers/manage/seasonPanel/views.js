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
const PARTS = () => [['Battle Pass', 'bp', emojis.bp1], ['Ranked', 'rank', emojis.rank], ['DMZ', 'dmz', emojis.dmz]];
// Battle Pass / Ranked / DMZ as three rows: the title, then its deadline on a small line. `src` is the live document or its `draft`.
function seasonRows(src) {
    return PARTS().map(([label, key, emoji]) => `${emoji} **${label}** · ${src?.[`${key}Title`] || label}\n-# ${whenLine(src?.[`${key}Start`], src?.[`${key}End`], src?.[`${key}EndTBD`])}`).join('\n');
}
const seasonName = (title, emoji) => {
    if (!title) return '*(not set)*';
    const e = require('../../../utils/seasonEmoji').seasonEmojiFor(title, emoji);
    return `${e ? `${e} ` : ''}${require('../../../utils/titleBlock').toBoldItalicUnicode(title)}`;
};

// ---------- what is staged ---------- News rows are the ones news triage wrote. A CARRIED row (utils/newsTriage/draftMerge.js planCarryOver: a live row still running when the next season starts) also carries newsSource, but it came from the live season, not from a news post, so it is counted apart (2026-11-08 11:30 EST: on prod's Season 10 draft all 21 "News" rows were carried over).
const fromNews = (r) => r.newsSource && !r.newsSource.carried;
const isCarried = (r) => Boolean(r.newsSource?.carried);
const newsRows = (draft) => [
    ...(draft?.newDraws || []).filter(fromNews).map(r => ({ kind: 'New draw', r })),
    ...(draft?.returningDraws || []).filter(fromNews).map(r => ({ kind: 'Returning draw', r })),
    ...(draft?.calendar || []).filter(fromNews).map(r => ({ kind: 'Calendar', r })),
];
const carriedCount = (draft) => [...(draft?.newDraws || []), ...(draft?.returningDraws || []), ...(draft?.calendar || [])].filter(isCarried).length;
// A calendar draw row with no draw of the same title in either list (2026-11-08 11:30 EST): /draws would not show it after Promote, and the draw's end date (read off this row by title) would be lost. On prod's Season 10 draft, "Alchemy Stars — It Goes Two Draw" was on the calendar while the live draw it came from is titled "Alchemy Stars Draw".
const norm = (x) => String(x || '').trim().toLowerCase();
function calendarDrawsWithoutDraw(draft) {
    const titles = new Set([...(draft?.newDraws || []), ...(draft?.returningDraws || [])].map(d => norm(d.title)));
    return (draft?.calendar || []).filter(r => r.category === 'draw' && !titles.has(norm(r.title))).map(r => r.title);
}
function counts(doc) {
    const d = doc?.draft || {};
    return { nd: (d.newDraws || []).length, rd: (d.returningDraws || []).length, cal: (d.calendar || []).length, news: newsRows(d).length, carried: carriedCount(d), fields: Object.keys(d.newsSeasonSet || {}).length };
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

const gapLine = (d) => {
    const orphans = calendarDrawsWithoutDraw(d);
    return orphans.length ? `\n${emojis.warn} **On the calendar, not in the draw lists:** ${orphans.slice(0, 5).join(', ')}${orphans.length > 5 ? ` and ${orphans.length - 5} more` : ''}. /draws will not show ${orphans.length === 1 ? 'it' : 'them'} after Promote; add the draw or match its title.` : '';
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
            row(btn(['tl', 'draft'], 'Edit Titles & Deadlines', emojis.edit, 1), btn(['dd', 'n', 0], 'Draws', emojis.newDraws), btn('cal', 'Paste Calendar', emojis.mngBulkAdd)),
            BIG(),
            row(btn('guide', 'Guide', emojis.guide), btn(['view', 'live'], 'Live Season', emojis.returnArrow)),
        );
        return panel(components, pageRow ? [pageRow] : []);
    }
    components.push(
        text(`**Title:** ${seasonName(d.currentSeasonTitle, d.currentSeasonEmoji)}\n${seasonRows(d)}${c.fields ? `\n-# ${emojis.mngInfo} News set ${plural(c.fields, 'season field')} here.` : ''}${c.carried ? `\n-# ${emojis.mngInfo} ${plural(c.carried, 'row')} carried over: still running when this season starts.` : ''}${gapLine(d)}`),
        BIG(),
        text('-# Staged lists, as players will see them…'),
        row(btn(['lv', 'nd', 0], `New Draws · ${c.nd}`, emojis.newDraws, 2, !c.nd), btn(['lv', 'rd', 0], `Returning · ${c.rd}`, emojis.returningDraws, 2, !c.rd), btn(['lv', 'cal', 0], `Calendar · ${c.cal}`, emojis.calendar, 2, !c.cal), btn(['ls', 'news', 0], `News · ${c.news}`, emojis.mngInfo, 2, !c.news), (() => { const n = needsLook(doc).length; return btn('look', n ? `Needs a Look · ${n}` : 'All Checked', n ? emojis.warn : emojis.checkmark, n ? 4 : 3); })()),
        SMALL(),
        text('-# Change what is staged…'),
        row(btn(['tl', 'draft'], 'Edit Titles & Deadlines', emojis.edit, 1), btn(['dd', 'n', 0], 'Edit Draws', emojis.newDraws), btn('cal', 'Paste Calendar', emojis.mngBulkAdd)),
        BIG(),
        ...(d.autoPromote && d.bpStart ? [text(`${emojis.mngInfo} **Auto-promotes** <t:${Math.floor(new Date(d.bpStart).getTime() / 1000)}:F> · <t:${Math.floor(new Date(d.bpStart).getTime() / 1000)}:R>`)] : []),
        row(btn('promote', d.autoPromote ? 'Promote Now…' : 'Promote to Live', emojis.checkmark, 3), ...(d.autoPromote ? [btn('autooff', 'Cancel Auto-Promote', emojis.cross)] : []), btn('discard', 'Discard Draft', emojis.deleteBin, 4)),
        row(btn('guide', 'Guide', emojis.guide), btn(['view', 'live'], 'Live Season', emojis.returnArrow)),
    );
    return panel(components, pageRow ? [pageRow] : []);
}

// ---------- read-only lists ---------- Ten a page, in the order they are staged. `kind`: nd · rd · cal · news.
const dayStamp = (d) => (d ? `<t:${unix(d)}:f>` : 'no date');
// Where a staged row came from (2026-11-08 12:23 EST, Harkirat: "how do i check if something in the draft was stated by me manually or auto-set by the news-distill feature?"): typed (no news tag), news (official, a leak, or an expected leak, by the source's rank), carried over (still running when the season starts), or a news row he has since edited, which news triage no longer touches (its sig no longer matches, utils/newsTriage/draftMerge.js).
function origin(r) {
    const s = r?.newsSource;
    if (!s) return 'typed';
    let now = s.sig;
    try { now = require('../../../utils/newsTriage/draftMerge').sig(r); } catch { /* keep the stored sig */ }
    if (s.sig && now !== s.sig) return 'news, edited by you';
    if (s.carried) return 'carried over';
    return s.rank === 3 ? 'news, official' : s.rank === 1 ? 'news, expected leak' : 'news, leak';
}
function provenance(draft) {
    const rows = [...(draft?.newDraws || []), ...(draft?.returningDraws || []), ...(draft?.calendar || [])];
    const tally = { typed: 0, news: 0, carried: 0, edited: 0 };
    for (const r of rows) { const o = origin(r); if (o === 'typed') tally.typed++; else if (o === 'carried over') tally.carried++; else if (o.includes('edited')) tally.edited++; else tally.news++; }
    return tally;
}
function drawLine(r) { return `**${r.title || '(untitled)'}**\n-# ${dayStamp(r.date)} · ${plural((r.items || []).length, 'item')} · *${origin(r)}*`; }
function calLine(r) {
    const end = r.isOngoing ? 'All Season' : r.endDate ? `<t:${unix(r.endDate)}:f>` : 'no end date';
    return `**${r.title || '(untitled)'}**\n-# ${r.category || 'event'} · ${dayStamp(r.date)} › ${end} · *${origin(r)}*`;
}
function newsLine({ kind, r }) {
    const s = r.newsSource || {};
    const flags = [s.dated === false ? 'placeholder date' : null, s.noEnd ? 'no end date' : null, s.carried ? 'carried over' : null].filter(Boolean);
    return `**${r.title || '(untitled)'}**\n-# ${kind} · ${dayStamp(r.date)}${flags.length ? ` · ${flags.join(' · ')}` : ''}`;
}
const KINDS = () => ({
    nd: { label: 'New Draws', emoji: emojis.newDraws, items: (d) => require('../../../utils/drawDates').byRelease(d.newDraws), line: drawLine },
    rd: { label: 'Returning Draws', emoji: emojis.returningDraws, items: (d) => require('../../../utils/drawDates').byRelease(d.returningDraws), line: drawLine },
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

// ---------- the draft's draws, one at a time ---------- (2026-11-08 12:27 EST, Harkirat, 2026-11-08 11:52 EST: "i want a better draws drafting method. i basically want a version of the new/returning draws panel but with the design/mix of how the /draw calculator handles the \"draw selections/edit\" panel. so I'm able to add draws or delete draws 1 by 1 or also bulk paste."). The calculator's selection editor, for draws: the list with each draw's Edit beside its heading, New and Returning as two buttons, and a footer of Add Draw · Remove Draws (pop-ups) · Paste Draws · Back. Six draws a page (a draw is a Section: 3 of Discord's 40).
const DD_PER_PAGE = 6;
const SEC = { n: { key: 'newDraws', label: 'New Draws', emoji: () => emojis.newDraws }, r: { key: 'returningDraws', label: 'Returning Draws', emoji: () => emojis.returningDraws } };
const topTier = (d) => { const order = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common']; const tiers = (d.items || []).map(i => String(i.tier || '').toLowerCase()); return order.find(t => tiers.includes(t)) || null; };
function draftDrawsView(doc, sec = 'n', page = 0, note = null) {
    const s = SEC[sec] ? sec : 'n';
    const list = require('../../../utils/draftDraws').byDate(doc?.draft?.[SEC[s].key] || []);
    const pages = Math.max(1, Math.ceil(list.length / DD_PER_PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = list.slice(pg * DD_PER_PAGE, pg * DD_PER_PAGE + DD_PER_PAGE);
    const nN = (doc?.draft?.newDraws || []).length, nR = (doc?.draft?.returningDraws || []).length;
    const components = [text(`${crumb('Next Season Draft', 'Draws')}\n## ${SEC[s].emoji()} Draft ${SEC[s].label}\n-# Add, edit or remove one draw at a time, or paste many. Nothing goes live until Promote to Live.`)];
    if (note) components.push(SMALL(), text(note));
    components.push(BIG(), row(btn(['dd', 'n', 0], `New Draws · ${nN}`, emojis.newDraws, s === 'n' ? 3 : 2, s === 'n'), btn(['dd', 'r', 0], `Returning Draws · ${nR}`, emojis.returningDraws, s === 'r' ? 3 : 2, s === 'r')), SMALL());
    if (!shown.length) components.push(text(`-# Nothing staged here yet. Add Draw adds one; Paste Draws adds many.`));
    for (const d of shown) {
        const tier = topTier(d);
        const items = (d.items || []).filter(i => i.tier !== 'comment').length;
        components.push({ type: 9, components: [text(`### ${tier && emojis[tier] ? `${emojis[tier]} ` : ''}${d.title || '(untitled)'}\n-# ${dayStamp(d.date)} · ${plural(items, 'item')}${d.thumbnailUrl ? '' : ' · no picture'} · *${origin(d)}*`)], accessory: btn(['ddedit', s, String(d._id || '')], 'Edit', emojis.edit) });
    }
    if (pages > 1) components.push(row(arrow(['dd', s, pg - 1], 'left', pg === 0), counter(['ddpg', s], `Page ${pg + 1} / ${pages}`), arrow(['dd', s, pg + 1], 'right', pg === pages - 1)));
    components.push(BIG(), row(btn(['ddadd', s], 'Add Draw', emojis.mngAdd, 3), btn(['ddrm', s], 'Remove Draws', emojis.deleteBin, 4, !list.length), btn('dr', 'Paste Draws', emojis.mngBulkAdd), btn(['view', 'draft'], 'Back', emojis.returnArrow)));
    return panel(components);
}
// The Add / Edit Draw pop-up: Title, Items (one per line, as the bulk format writes them), Release Date, Image Link, Draw Type.
function draftDrawModal(sec, draw = null) {
    const s = SEC[sec] ? sec : 'n';
    const { itemLines } = require('../../../utils/draftDraws');
    const { formatAdminDate } = require('../../../utils/adminParser');
    const code = draw?.priceType ? (require('../../../utils/drawTypes').drawTypeCode?.(draw.priceType) || '') : '';
    const input = (id, label, style, value, required, placeholder) => ({ type: 1, components: [{ type: 4, custom_id: id, label, style, required, ...(value ? { value: String(value).slice(0, 4000) } : {}), ...(placeholder ? { placeholder } : {}) }] });
    return {
        title: draw ? 'Edit Draft Draw' : `Add a ${s === 'n' ? 'New' : 'Returning'} Draw`,
        custom_id: draw ? ID('ddeditm', s, String(draw._id || '')) : ID('ddaddm', s),
        components: [
            input('title', 'Title', 1, draw?.title, true, 'e.g. Botanist Mythic Drop'),
            input('items', 'Items, one per line', 2, draw ? itemLines(draw) : '', true, 'm Weapon - Skin\nl Weapon - Skin\n-# a note'),
            input('date', 'Release Date', 1, draw?.date ? formatAdminDate(draw.date) : '', true, 'e.g. November 26'),
            input('image', 'Image Link', 1, draw?.thumbnailUrl, false, 'Blank keeps the picture, or finds one by name'),
            input('type', 'Draw Type (optional)', 1, code, false, 'e.g. 7s, mw, lw'),
        ],
    };
}
function draftRemoveModal(doc, sec) {
    const s = SEC[sec] ? sec : 'n';
    const list = require('../../../utils/draftDraws').byDate(doc?.draft?.[SEC[s].key] || []).slice(0, 25);
    return { title: `Remove ${SEC[s].label}`, custom_id: ID('ddrmm', s), components: [{ type: 18, label: 'Draws to remove', description: 'Revert brings them back.', component: { type: 3, custom_id: 'pick', required: true, min_values: 1, max_values: Math.max(1, list.length), options: list.map(d => ({ label: String(d.title || '(untitled)').slice(0, 100), value: String(d._id), description: `${d.date ? new Date(d.date).toISOString().slice(0, 10) : 'no date'} · ${origin(d)}`.slice(0, 100) })) } }] };
}

// ---------- Needs a Look ---------- (2026-11-08 12:23 EST, Harkirat: "how do i check what's still pending in the draft or needs my notice/double-check? such as info, images, dates, etc."). The promote check's own checks (utils/newsTriage/readiness.js), plus what it does not look at: a draw with no picture or no items, and draw names matched as the same draw (utils/search.js) rather than letter for letter.
function needsLook(doc) {
    const r = require('../../../utils/newsTriage/readiness').draftReadiness(doc);
    if (!r) return [];
    const { isSameDrawTitle } = require('../../../utils/search');
    const d = doc?.draft || {};
    const draws = [...(d.newDraws || []), ...(d.returningDraws || [])];
    const calDraws = (d.calendar || []).filter(x => x.category === 'draw');
    const names = l => (l.length > 6 ? `${l.slice(0, 6).join(', ')} and ${l.length - 6} more` : l.join(', '));
    const w = [];
    if (!r.title) w.push('No season title');
    if (!d.bpStart) w.push('No Battle Pass start date (auto-promote needs one)');
    if (!r.bpEnd) w.push('No Battle Pass end date, or TBD');
    if (!r.ranked) w.push('Ranked not set');
    if (!r.dmz) w.push('DMZ not set');
    const noPic = draws.filter(x => !x.thumbnailUrl).map(x => x.title);
    if (noPic.length) w.push(`Draws with no picture: ${names(noPic)}`);
    const noItems = draws.filter(x => !(x.items || []).some(i => i.tier !== 'comment')).map(x => x.title);
    if (noItems.length) w.push(`Draws with no items: ${names(noItems)}`);
    const noDraw = calDraws.filter(c => !draws.some(x => isSameDrawTitle(x.title, c.title))).map(c => c.title);
    if (noDraw.length) w.push(`On the calendar, not in the draw lists: ${names(noDraw)}`);
    const noRow = draws.filter(x => !calDraws.some(c => isSameDrawTitle(x.title, c.title))).map(x => x.title);
    // Worded as the missing END, never "no calendar row" (2026-11-08 12:52 EST): such a draw still shows on /calendar, and the row phrasing is what made him think it would not.
    if (noRow.length) w.push(`Draws with no end date yet: ${names(noRow)}`);
    if (r.noEnd.length) w.push(`Calendar rows with no end date: ${names(r.noEnd)}`);
    if (r.early.length) w.push(`Dated before the season starts: ${names(r.early)}`);
    if (r.twice) w.push(`${plural(r.twice, 'title')} listed twice`);
    if (r.seamGap) w.push(`The seasons do not meet: ${r.seamGap}`);
    if (r.leakOnly.length) w.push(`Expected, not confirmed yet: ${names(r.leakOnly)}`);
    if ((r.undated || []).length) w.push(`No post ever dated these, so they show as starting on day one: ${names(r.undated)}`);
    if ((r.fullBoxes || []).length) w.push(`Nearly full in /manage (a box holds 4,000 characters): ${r.fullBoxes.join(' · ')}`);
    if ((r.stillRunning || []).length) w.push(`Live with no end date, may run into this season: ${names(r.stillRunning)}`);
    return w;
}
function needsLookView(doc) {
    const w = needsLook(doc);
    const p = provenance(doc?.draft);
    return panel([
        text(`${crumb('Next Season Draft', 'Needs a Look')}\n## ${w.length ? emojis.warn : emojis.checkmark} Needs a Look\n-# What to check before this draft goes live. Fix it with Edit Titles & Deadlines, Paste Draws or Paste Calendar.`),
        SMALL(),
        text((w.length ? w.map(x => `${emojis.warn} ${x}`).join('\n') : `${emojis.checkmark} **Everything checked is ready.**`).slice(0, 3600)),
        SMALL(),
        text(`-# **Where the rows came from:** ${p.typed} typed by you · ${p.news} from news · ${p.carried} carried over · ${p.edited} news rows you edited. Each row says which in the Compact List.`),
        BIG(),
        row(btn(['view', 'draft'], 'Back', emojis.returnArrow), homeBtn()),
    ]);
}

// ---------- staged lists, as players will see them ---------- (2026-11-08 12:21 EST, Harkirat, 2026-11-08 11:52 EST: "the \"staged list\", i essentially want to see those lists as they would appear in the bot"). The draft is laid over the live document and drawn by /draws and /calendar themselves, as of the moment the season starts (or now, once it has), so every line reads as it will on day one. Their own buttons are taken off (they would act on the LIVE lists) and this panel's pager and Back go under. /draws and /calendar are read off the public client, never required (a require would put every /manage handler in their hotpatch closure, .claude/rules/hotpatch.md). Anything that cannot be drawn falls back to the compact list.
function previewDoc(doc) {
    const d = doc?.draft || {};
    const out = { ...doc, currentSeasonTitle: d.currentSeasonTitle || doc?.currentSeasonTitle || '', currentSeasonEmoji: d.currentSeasonEmoji || '', newDraws: d.newDraws || [], returningDraws: d.returningDraws || [], calendar: d.calendar || [] };
    for (const [, key] of PARTS()) for (const f of ['Title', 'Start', 'End', 'EndTBD']) out[`${key}${f}`] = d[`${key}${f}`];
    return out;
}
const previewNow = (doc, nowMs = Date.now()) => { const s = doc?.draft?.bpStart ? new Date(doc.draft.bpStart).getTime() : NaN; return Number.isFinite(s) ? Math.max(nowMs, s) : nowMs; };
// Takes every button and dropdown off a drawn page: action rows go, and a Section whose accessory is a button (the reminders bell) keeps only its text.
function stripControls(components) {
    const out = [];
    for (const c of components || []) {
        if (c.type === 1) continue;
        if (c.type === 9 && c.accessory?.type === 2) { out.push(...stripControls(c.components)); continue; }
        out.push(c.components && c.type !== 9 ? { ...c, components: stripControls(c.components) } : c);
    }
    return out;
}
const countAll = (c) => (Array.isArray(c) ? c.reduce((n, x) => n + countAll(x), 0) : 1 + (c.components ? countAll(c.components) : 0) + (c.accessory ? 1 : 0));
const pageOf = (components) => { const m = /(\d+)\s*\/\s*(\d+)/.exec(JSON.stringify((components || []).filter(c => c.type === 1).map(r => (r.components || []).map(b => b.label || '')))); return m ? Number(m[2]) : 1; };
function botLookView(doc, kind, page = 0, nowMs = Date.now()) {
    const key = ['nd', 'rd', 'cal'].includes(kind) ? kind : 'nd';
    const cmd = require('../../../bot/clients').publicClient()?.commands?.get(key === 'cal' ? 'calendar' : 'draws');
    if (!cmd?.buildContainer) return listView(doc, key, 0);
    const at = previewNow(doc, nowMs);
    const pd = previewDoc(doc);
    let pg = Math.max(0, Number(page) || 0), pages, drawn;
    try {
        if (key === 'cal') {
            pages = 3; pg = Math.min(pg, 2);
            drawn = cmd.buildContainer(pd, pg, undefined, true, 'all', undefined, { nowMs: at });
        } else {
            const first = cmd.buildContainer(pd, key === 'nd' ? 'new' : 'returning', 0, undefined, true, key === 'nd' ? 1 : 2, { nowMs: at });
            pages = pageOf(first[0]?.components);
            pg = Math.min(pg, pages - 1);
            drawn = pg ? cmd.buildContainer(pd, key === 'nd' ? 'new' : 'returning', pg, undefined, true, key === 'nd' ? 1 : 2, { nowMs: at }) : first;
        }
    } catch (e) { console.error('season panel: staged preview failed, showing the list:', e.message); return listView(doc, key, 0); }
    const container = drawn?.[0];
    if (!container?.components) return listView(doc, key, 0);
    const startAt = doc?.draft?.bpStart ? Math.floor(new Date(doc.draft.bpStart).getTime() / 1000) : null;
    const when = startAt && at > nowMs ? `on <t:${startAt}:F>, when the season starts` : 'right now';
    const nav = [
        { type: 14, spacing: 1, divider: true },
        text(`-# ${emojis.mngInfo} **Staged, not live.** Shown as players will see it ${when}. Its buttons are off here.`),
        ...(pages > 1 ? [row(arrow(['lv', key, pg - 1], 'left', pg === 0), counter(['pgv', key], `Page ${pg + 1} / ${pages}`), arrow(['lv', key, pg + 1], 'right', pg === pages - 1))] : []),
        row(btn(['view', 'draft'], 'Back', emojis.returnArrow), btn(['ls', key, 0], 'Compact List', emojis.mngInfo)),
    ];
    let body = stripControls(container.components);
    const out = [{ ...container, components: [...body, ...nav] }];
    if (countAll(out) > 40) return listView(doc, key, 0);
    return out;
}

// ---------- in-place confirms ---------- What Promote swaps, field by field: the live value struck through, then the staged one. Comparing the strings tells the admin what really moves.
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
    // What the draft has not staged, named before the Yes (the lead, 2026-11-07 21:19 EST, click-testing a dev draft with no title and no end dates): promoting copies the draft as it is, so a gap here becomes a gap on /season end and /calendar.
    const missing = [...(d.currentSeasonTitle ? [] : ['the season title']), ...PARTS().filter(([, key]) => !d[`${key}End`] && !d[`${key}EndTBD`]).map(([label]) => `the ${label} end`)];
    if (missing.length) lines.push('', `${emojis.warn} **Not staged:** ${missing.join(', ')}. Promoting now leaves ${missing.length === 1 ? 'it' : 'them'} blank for players.`);
    const gap = gapLine(d);
    if (gap) lines.push(gap.trim());
    return panel([
        text(`${crumb('Next Season Draft', 'Promote')}\n### ${emojis.warn} Promote the staged draft to live?\n-# Players see this at once. The draft is cleared. Every change is recorded in /bot analytics › Changes.`),
        SMALL(),
        text(lines.join('\n').slice(0, 3800)),
        BIG(),
        row(btn('promoteok', 'Yes, Promote', emojis.checkmark, 3), btn(['view', 'draft'], 'Cancel', emojis.returnArrow)),
    ]);
}
// The Promote pop-up (2026-11-08 12:09 EST, Harkirat, 2026-11-08 11:52 EST: "the \"promote to live\" button should open a pop-up with 2 options for me to select: promote to live right now or auto promote on BP start date/time"). One choice: now, or at the Battle Pass start (only offered while that start is still ahead). Its label line carries what would go live; the Not staged warnings sit on the draft view and the Needs a look card.
function promoteModal(doc, nowMs = Date.now()) {
    const d = doc?.draft || {};
    const c = counts(doc);
    const start = d.bpStart ? new Date(d.bpStart) : null;
    const later = start && start.getTime() > nowMs;
    const when = later ? `${start.toISOString().slice(0, 16).replace('T', ' ')} UTC` : '';
    const options = [
        ...(later ? [{ label: 'Auto-promote at the Battle Pass start', value: 'auto', description: when, default: true }] : []),
        { label: 'Promote to live right now', value: 'now', description: 'Players see it at once', default: !later },
    ];
    const what = `${d.currentSeasonTitle || 'Untitled season'} · ${c.nd} New, ${c.rd} Returning, ${c.cal} calendar`;
    return { title: 'Promote to Live', custom_id: ID('promm'), components: [{ type: 18, label: 'When should it go live?', description: what.slice(0, 100), component: { type: 3, custom_id: 'when', required: true, options } }] };
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
        ...(c.carried ? [`**Carried over:** ${c.carried}`] : []),
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

module.exports = { ID, PAGE, row, text, btn, panel, homeBtn, plural, whenLine, stamp, seasonRows, counts, newsRows, calendarDrawsWithoutDraw, isStaged, pageView, listView, botLookView, previewDoc, needsLook, needsLookView, origin, draftDrawsView, draftDrawModal, draftRemoveModal, promoteConfirm, promoteModal, discardConfirm, resultView };
