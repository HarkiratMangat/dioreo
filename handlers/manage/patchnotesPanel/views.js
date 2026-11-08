// ==========================================
// /manage patch-notes — the panels
// ==========================================
// Built 2026-11-07 21:05 EST (the /manage rehaul's remaining panels, builder C2) on the pattern of the draws panel (handlers/manage/drawsPanel/): one message that changes in place, a breadcrumb and Back/Home on every inner view, one card per season. Every function here only BUILDS a message; routing, permission checks and saves are in ./index.js.
//
// custom_ids: `mng_pn|<verb>|…`, at most 100 characters (asserted). `mng_` puts every click behind the router's /manage lock (handlers/router.js); ./index.js checks each action's own tier with resolveAction.
//
// A season's key is its patchNotes[] subdocument `_id`. The LAST entry is the "current" one (utils/manageActions.js currentPatchEntry); every older entry is a past season.

const emojis = require('../../../utils/emojiMap');
const { splitSeasonEmoji, seasonEmojiFor } = require('../../../utils/seasonEmoji');

const ACCENT = 15909424; // /patch notes' Patch Gold (commands/patchnotes.js PRESET_ACCENT)
const MAX_PAST = 25; // one select holds 25 options

function ID(...parts) {
    const id = ['mng_pn', ...parts.map(p => (p === undefined || p === null ? '' : String(p)))].join('|');
    if (id.length > 100) throw new Error(`patch notes custom_id over 100 characters: ${id}`);
    return id;
}
const row = (...c) => ({ type: 1, components: c });
const text = (content) => ({ type: 10, content });
const BIG = () => ({ type: 14, divider: true, spacing: 2 });
const SMALL = () => ({ type: 14, divider: false, spacing: 1 });
const btn = (parts, label, emojiStr, style = 2, disabled = false) => ({ type: 2, style, ...(label ? { label } : {}), custom_id: ID(...[].concat(parts)), disabled, ...(emojiStr ? { emoji: emojis.parseEmoji(emojiStr) } : {}) });
const crumb = (...p) => `-# ${['Patch Notes', ...p].join('  ›  ')}`;
const panel = (components, after = []) => [{ type: 17, accent_color: ACCENT, components }, ...after];
const homeBtn = () => btn('page', 'Home', emojis.returnArrow);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// The same rule as commands/patchnotes.js displayTitle (`titleOverride || title`, the "Balance changes for" prefix and any typed emoji stripped), written out here rather than required: a require would put every /manage handler in the closure of a hotpatch to /patch notes, and utils/hotpatch.js would refuse it. scripts/managePatchAnnounce.test.js asserts the two agree.
function displayTitle(patch) {
    return splitSeasonEmoji(patch.titleOverride || patch.title).title.replace(/^balance changes for\s*/i, '').trim() || 'Untitled season';
}
// The season's own emoji: the one synced onto the entry, else one typed in front of its title, else the season number's (utils/seasonEmoji.js).
function entryEmoji(patch) {
    return seasonEmojiFor(displayTitle(patch), patch.emoji || splitSeasonEmoji(patch.titleOverride || patch.title).emoji);
}

const entries = (doc) => doc?.patchNotes || [];
const currentEntry = (doc) => (entries(doc).length ? entries(doc)[entries(doc).length - 1] : null);
const isCurrent = (doc, id) => String(currentEntry(doc)?._id) === String(id);
const findEntry = (doc, id) => entries(doc).find(p => String(p._id) === String(id)) || null;
// Past seasons, newest first, as many as one select holds.
const pastEntries = (doc) => entries(doc).slice(0, -1).reverse();

const dateText = (p) => (p.releaseDate ? `<t:${Math.floor(new Date(p.releaseDate).getTime() / 1000)}:D>` : 'no release date');
const imageCount = (p) => (p.images || []).filter(Boolean).length;
const firstLine = (s, max = 120) => {
    const line = String(s || '').split('\n').map(x => x.trim()).find(Boolean) || '';
    return line.length > max ? `${line.slice(0, max - 1)}…` : line;
};
// One season as a short card body: a bold title, then the few facts that matter on a small line.
function summaryLines(p, { long = false } = {}) {
    const e = entryEmoji(p);
    const info = long ? String(p.description || '').trim().slice(0, 900) : firstLine(p.description);
    return [
        `### ${e ? `${e} ` : ''}${displayTitle(p)}`,
        `-# Released ${dateText(p)} · ${imageCount(p)}/10 images`,
        info ? (long ? `>>> ${info}` : `> ${info}`) : '-# No additional info',
    ].join('\n');
}

async function seasonLine(doc) {
    if (!doc?.currentSeasonTitle) return '';
    const emoji = seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji);
    return `\n${emoji ? `${emoji} ` : ''}${require('../../../utils/titleBlock').toBoldItalicUnicode(doc.currentSeasonTitle)}`;
}

// ---------- home ----------
async function pageView(doc, note = null, { pageRow = null } = {}) {
    const cur = currentEntry(doc);
    const past = pastEntries(doc);
    const components = [text(`## ${emojis.patchNotes} Patch Notes${await seasonLine(doc)}\n-# ${plural(entries(doc).length, 'season')} saved`)];
    if (note) components.push(SMALL(), text(note));
    components.push(
        BIG(),
        text('-# Current season…'),
        text(cur ? summaryLines(cur) : `${emojis.cross} **No patch notes yet.** Edit Date & Info or Add New Season creates the first one.`),
        row(btn('dateinfo', 'Edit Date & Info', emojis.edit, 1), btn(['urls', 1], 'Images 1-5', emojis.mngUrls), btn(['urls', 2], 'Images 6-10', emojis.mngUrls)),
        BIG(),
        text('-# Add…'),
        row(btn('add', 'Add New Season', emojis.mngAdd, 3)),
        SMALL(),
        text('-# Past seasons…'),
    );
    if (past.length) {
        components.push({ type: 1, components: [{ type: 3, custom_id: ID('past'), placeholder: 'Open a past season…', options: past.slice(0, MAX_PAST).map(p => ({ label: displayTitle(p).slice(0, 100), value: String(p._id), description: `${p.releaseDate ? new Date(p.releaseDate).toISOString().slice(0, 10) : 'no release date'} · ${imageCount(p)}/10 images` })) }] });
        if (past.length > MAX_PAST) components.push(text(`-# ${past.length - MAX_PAST} older seasons are not listed here. Type \`season:\` in the slash command to reach them.`));
    } else components.push(text('-# No past seasons yet.'));
    components.push(
        BIG(),
        row(btn('guide', 'Guide', emojis.guide)),
        SMALL(),
        text('-# End of season…'),
        row(btn('purge', 'Purge Patch Notes', emojis.deleteBin, 4)),
    );
    return panel(components, pageRow ? [pageRow] : []);
}

// ---------- one season ---------- `header` sits above the card (a saved note); `extra` replaces the action rows.
function cardView(doc, id, { header = null, extra = null } = {}) {
    const p = findEntry(doc, id);
    if (!p) return null;
    const cur = isCurrent(doc, id);
    const components = [text(crumb(cur ? 'Current Season' : 'Past Seasons', displayTitle(p)))];
    if (header) components.push(text(header), SMALL());
    components.push(text(summaryLines(p, { long: true })), text(`-# ${cur ? 'The current season. /patch notes opens on it.' : 'A past season. /patch notes lists it in its season dropdown.'}`), BIG());
    if (extra) components.push(...extra);
    else if (cur) components.push(row(btn('dateinfo', 'Edit Date & Info', emojis.edit, 1), btn(['urls', 1], 'Images 1-5', emojis.mngUrls), btn(['urls', 2], 'Images 6-10', emojis.mngUrls)), row(homeBtn()));
    // A past season has one pop-up (the old Past Seasons box): title, date, info and every image in it. There is no separate images or date/info pop-up for it, so none is offered.
    else components.push(text('-# A past season edits in one pop-up: its title, date, info and all ten images.'), row(btn(['edit', String(p._id)], 'Edit', emojis.edit, 1), homeBtn()));
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

module.exports = { ID, MAX_PAST, row, text, btn, homeBtn, panel, plural, displayTitle, entryEmoji, currentEntry, isCurrent, findEntry, pastEntries, entries, pageView, cardView, resultView };
