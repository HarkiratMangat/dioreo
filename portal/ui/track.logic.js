// portal/ui/track.logic.js — CommonJS, imports nothing. Pure functions <Track> renders from.
//
// This file (not track.js) is what scripts/portalUi.test.js requires — Node can \u0027t load an ESM module doing `import { html } from \u0027../vendor/htm-preact.mjs\u0027`, and the browser never loads this file\u0027s CJS sibling. See the plan\u0027s R10 finding.

// 🔴 SHAPE carries state, COLOUR carries topic (spec §9) \u2014 do not invert. `state` always maps to a class suffix (live/stag/conf); `topic` never appears in the returned class at all \u2014 it is applied by the caller as a `--c` CSS custom property, exactly like the approved mockup does.
function bandClass({ state }) {
    if (state === 'live') return 'bar live';
    if (state === 'staged') return 'bar stag';
    if (state === 'conflict') return 'bar conf';
    return 'bar';
}

// Which Track lane an item belongs to, derived from its kind \u2014 never hand-assigned per item.
const LANE_ORDER = ['draw', 'returning', 'event', 'playlist', 'patchnote'];
function laneFor(item) {
    const kind = (item && item.kind || '').toLowerCase();
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

// Guarded: a classic <script> in a real browser has no `module` global, and an unguarded assignment throws ReferenceError mid-parse -- silently true here only because every function above already executed before this line ran. Found by actually loading this file in a browser rather than assuming the classic-script plan would just work.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { bandClass, laneFor, tierOf, barGeometry, findOverlaps, findGaps, LANE_ORDER };
}
