// portal/ui/track.logic.js — CommonJS, imports nothing. Pure functions <Track> renders from.
//
// This file (not track.js) is what scripts/portalUi.test.js requires — Node can \u0027t load an ESM module doing `import { html } from \u0027../vendor/htm-preact.mjs\u0027`, and the browser never loads this file\u0027s CJS sibling. See the plan\u0027s R10 finding.

// 🔴 SHAPE carries state, COLOUR carries topic (spec §9) \u2014 do not invert. `state` always maps to a class suffix (live/stag/conf); `topic` never appears in the returned class at all \u2014 it is applied by the caller as a `--c` CSS custom property, exactly like the approved mockup does.
function bandClass({ state }) {
    // ⚠️ THE CLASS SUFFIXES CHANGED 2026-08-25 — live/stag/conf became saved/staged/conflict, which is the vocabulary the adopted design's stylesheet actually keys on (portal/ui/track.css, from the mockup). Two vocabularies for one idea is how a bar renders unstyled while every gate passes: the class was emitted, the rule simply never matched it. `state` is unchanged — only the class it maps to moved.
    if (state === 'live' || state === 'saved') return 'bar saved';
    if (state === 'staged') return 'bar staged';
    if (state === 'conflict') return 'bar conflict';
    return 'bar';
}

// Which Track lane an item belongs to, derived from its kind \u2014 never hand-assigned per item.
const LANE_ORDER = ['draw', 'returning', 'event', 'playlist', 'patchnote'];
function laneFor(item) {
    // 🔴 `lane` FIRST, AND THE OMISSION MADE findOverlaps REPORT EVERYTHING. The Track's own items carry an explicit `lane` (season.js's toTrackItems sets it) and no `kind` at all, so this read undefined and fell through to the 'event' default for EVERY item — which meant findOverlaps saw one lane containing the whole season and reported 61 overlaps across 37 items, including a playlist "overlapping" a draw. It went unnoticed because findOverlaps had no caller anywhere until the Repairs view was built; a pure function with no reader cannot be wrong in a way anybody sees.
    const kind = (item && (item.lane || item.kind) || '').toLowerCase();
    return LANE_ORDER.includes(kind) ? kind : 'event';
}

// An item is a conflict when it runs past the battle-pass end \u2014 computed from real dates, never flagged by hand. `ok` is the only other tier this function returns; staged/live is a SEPARATE axis (state), not something tierOf decides.
function tierOf(item, season) {
    if (!item || !item.endDate || !season || !season.bpEnd) return 'ok';
    return new Date(item.endDate) > new Date(season.bpEnd) ? 'conflict' : 'ok';
}

// Percent-of-window left/width for a Track bar, given the visible window\u0027s [start,end] and the item\u0027s own [start,end]. Clamped to the visible window so an item that starts before/ends after it still renders sensibly instead of running off the ruler.
function barGeometry(item, window) {
    const wStart = new Date(window.start).getTime();
    const wEnd = new Date(window.end).getTime();
    const span = Math.max(1, wEnd - wStart);
    const iStart = Math.max(wStart, new Date(item.startDate || item.endDate).getTime());
    const iEnd = Math.min(wEnd, new Date(item.endDate || item.startDate).getTime());
    const left = ((iStart - wStart) / span) * 100;
    const width = Math.max(1, ((iEnd - iStart) / span) * 100);
    return { left, width };
}

// Overlap detection for the Track\u0027s "these two overlap" flag \u2014 same lane, date ranges intersect.
function findOverlaps(items) {
    const out = [];
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const a = items[i], b = items[j];
            if (laneFor(a) !== laneFor(b)) continue;
            const aStart = new Date(a.startDate || a.endDate), aEnd = new Date(a.endDate || a.startDate);
            const bStart = new Date(b.startDate || b.endDate), bEnd = new Date(b.endDate || b.startDate);
            if (aStart < bEnd && bStart < aEnd) out.push([a, b]);
        }
    }
    return out;
}

// 🔴 A DOUBLE ENTRY, NOT A SCHEDULING CONFLICT — and that distinction was measured, not assumed. `findOverlaps` reports any two items sharing days, which on the live season is **61 findings across 37 items**; scoping it to one lane gave **47**, every one a pair of playlists, and CODM plainly runs many playlists at once. Two definitions, both wrong, both plausible before they were run. Harkirat settled it 2026-08-26: the flaggable case is the same thing entered twice — a title repeated over days that overlap — which is a MISTAKE rather than a schedule.
//
// ⚠️ NORMALISED, THEN CONTAINMENT, AND THE FLOOR IS WHAT KEEPS IT HONEST. Exact-after-normalising catches "COD Point Rush Week 2" against "cod point rush week 2"; containment catches "Nuketown Dedicated" against "Nuketown Dedicated MP Playlist". The 8-character floor on the shorter title is what stops containment matching everything — without it "Krai BR" is inside "Krai BR Mode" and so is every three-letter fragment of every other title. ⚠️ It deliberately does NOT do fuzzy distance: "Week 2" and "Week 3" differ by one character and are not duplicates, which is exactly the case a distance metric gets wrong.
function normalizeTitle(t) {
    return String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findDuplicateTitles(items, minContained = 8) {
    const out = [];
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const a = items[i], b = items[j];
            const na = normalizeTitle(a.title), nb = normalizeTitle(b.title);
            if (!na || !nb) continue;
            const same = na === nb;
            const shorter = na.length <= nb.length ? na : nb;
            const longer = na.length <= nb.length ? nb : na;
            const contained = !same && shorter.length >= minContained && longer.includes(shorter);
            if (!same && !contained) continue;
            // "covering the same days" — a title reused in a later season is not a double entry.
            const aStart = new Date(a.startDate || a.endDate), aEnd = new Date(a.endDate || a.startDate);
            const bStart = new Date(b.startDate || b.endDate), bEnd = new Date(b.endDate || b.startDate);
            if (aStart <= bEnd && bStart <= aEnd) out.push([a, b, same ? 'same' : 'contains']);
        }
    }
    return out;
}

// A gap flag: a lane with a stretch of the visible window covered by nothing \u2014 the third defect the Track exists to surface (spec §8.2).
function findGaps(items, window, minGapMs = 2 * 24 * 60 * 60 * 1000) {
    const sorted = [...items].sort((a, b) => new Date(a.startDate || a.endDate) - new Date(b.startDate || b.endDate));
    const gaps = [];
    let cursor = new Date(window.start).getTime();
    const end = new Date(window.end).getTime();
    for (const item of sorted) {
        const s = new Date(item.startDate || item.endDate).getTime();
        if (s - cursor > minGapMs) gaps.push({ start: new Date(cursor), end: new Date(s) });
        cursor = Math.max(cursor, new Date(item.endDate || item.startDate).getTime());
    }
    if (end - cursor > minGapMs) gaps.push({ start: new Date(cursor), end: new Date(end) });
    return gaps;
}

// The inverse of barGeometry's left-percent math: given a pointer's percent-position across the visible window, return the snapped (day-granularity) date under it. Clamped to the window.
function dateFromOffset(offsetPercent, window) {
    const wStart = new Date(window.start).getTime();
    const wEnd = new Date(window.end).getTime();
    const clamped = Math.max(0, Math.min(100, offsetPercent));
    const ms = wStart + (clamped / 100) * (wEnd - wStart);
    const snapped = Math.round(ms / 86400000) * 86400000;
    return new Date(Math.max(wStart, Math.min(wEnd, snapped)));
}

// Builds an edit op for a dragged Track item, preserving every field except the edited date. draw.edit/calendar.edit's validate() needs the full record -- same contract as season.logic.js's buildSeasonEditOp, duplicated here (not imported) because this file must import nothing (see the header comment above) and season.js's ESM sibling can't be required from a CJS file. A draw's real schema/op field is `date` (see the LANE_TO_CATEGORY note in season.logic.js), so a dragged draw item writes its new date onto `date`, never `endDate` -- the exact bug already found once there.
//
// item.startDate is a SYNTHETIC field season.js's toTrackItems adds only so barGeometry (this file) has something to read for a draw, which has no real startDate/endDate in its own schema -- for a draw it must be stripped before this reaches core/ops/draws.js's validateOne, which SPREADS the whole payload through unlike calendar's validateEvent (see the else-branch comment below), so a stray key here would reach Mongo's $set verbatim. For a calendar item the same synthetic field already equals the item's real stored `date` (start) value, and validateEvent's own contract reads raw input on `payload.startDate` -- a real, previously-unverified field-name mismatch against the STORED field name `date` (core/ops/calendar.js's own header explains why validate's input vocabulary and its stored vocabulary differ) -- so for calendar it is kept, not deleted.
function editOpFor(item, newEndDate) {
    const isDraw = item.lane === 'draw' || item.lane === 'returning';
    const type = isDraw ? 'draw.edit' : 'calendar.edit';
    const category = item.lane === 'returning' ? 'returning' : 'new';
    const target = isDraw ? { category, elementId: item.id } : { elementId: item.id };
    const dateStr = newEndDate.toISOString().slice(0, 10);
    const payload = { ...item };
    delete payload.id; delete payload.lane; delete payload.kind; delete payload.state;
    if (isDraw) {
        delete payload.startDate;
        payload.date = dateStr;
    } else {
        payload.endDate = dateStr;
    }
    return { type, target, payload };
}

// Guarded: a classic <script> in a real browser has no `module` global, and an unguarded assignment throws ReferenceError mid-parse -- silently true here only because every function above already executed before this line ran. Found by actually loading this file in a browser rather than assuming the classic-script plan would just work. 🔴 OVERLAPPING BARS IN ONE LANE RENDERED ON TOP OF EACH OTHER, TEXT AND ALL. findOverlaps() already DETECTS a same-lane overlap for the flags row, but nothing gave the Bar components themselves a second row to sit in -- two events sharing a week collided into unreadable overlaid text (measured live: "COD Point Rush Week 1" and "Terminator 2 Themed Event" painted on the same pixels). Simple greedy interval-graph row assignment: sort by start, place each item in the first row whose last-placed item ends before this one starts, else open a new row.
function assignRows(items) {
    const sorted = [...items].sort((a, b) => new Date(a.startDate || a.endDate) - new Date(b.startDate || b.endDate));
    const rowEnds = []; // rowEnds[r] = end time of the last item placed in row r
    const rows = new Map();
    for (const item of sorted) {
        const start = new Date(item.startDate || item.endDate).getTime();
        const end = new Date(item.endDate || item.startDate).getTime();
        let row = rowEnds.findIndex((rEnd) => rEnd <= start);
        if (row === -1) { row = rowEnds.length; rowEnds.push(end); } else { rowEnds[row] = end; }
        rows.set(item, row);
    }
    return items.map((item) => ({ ...item, row: rows.get(item) || 0 }));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { bandClass, laneFor, tierOf, barGeometry, findOverlaps, findGaps, findDuplicateTitles, normalizeTitle, assignRows, LANE_ORDER, dateFromOffset, editOpFor };
}
