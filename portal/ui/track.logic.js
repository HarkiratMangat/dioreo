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
const LANE_ORDER = ['draw', 'returning', 'drawwindow', 'event', 'playlist', 'patchnote'];
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

// 🔴 TWO RELEASES ON ONE DAY DREW TWO DIAMONDS AT ONE COORDINATE, and the second was invisible. Measured live on the fixture season: "Void Implosion Draw" and "Wisterian Visage Draw" are both dated Aug 22 and rendered at exactly the same x, so one draw was unreachable by mouse, by keyboard and by tooltip — a record on the page that the page could not show you. A cluster REPLACES its members; it never sits on them. ⚠️ AND THE SENTENCE BRANCHES ON THE FACT, NOT ON THE PIXEL CONDITION THAT TRIGGERED IT. "zoom in to separate them" is an instruction that cannot succeed for two points at one coordinate, and it leaks a pixel constant into a sentence a person reads. `sameDay` says so instead, and offers the action that actually exists.
const CLUSTER_PX = 17;
function clusterPoints(points, plotW, gapPx = CLUSTER_PX) {
    if (!plotW || !points || points.length < 2) return [];
    const xs = points.map((p) => ({ ...p, x: (p.pct / 100) * plotW })).sort((a, b) => a.x - b.x);
    const groups = []; let g = [xs[0]];
    for (let i = 1; i < xs.length; i++) {
        if (xs[i].x - g[g.length - 1].x < gapPx) g.push(xs[i]);
        else { groups.push(g); g = [xs[i]]; }
    }
    groups.push(g);
    return groups.filter((grp) => grp.length > 1).map((grp) => {
        const a = grp[0], z = grp[grp.length - 1];
        return {
            members: grp, ids: grp.map((p) => p.id),
            sameDay: grp.every((p) => p.date === a.date),
            gapDays: Math.round(Math.abs(new Date(z.date) - new Date(a.date)) / 86400000),
            midPct: (((a.x + z.x) / 2) / plotW) * 100,
        };
    });
}

// The rail is a fixed 52px box holding TOP-anchored flags and a BOTTOM-anchored pin, so the moment the flags needed a second row the pin was inside them — which is what was measured. The height is derived from the rows actually used, and the same number gives `--xtop` its first writer: the token has been read by `.xhair::before` and `.xd` since the port and set by nothing, so the crosshair has always used its hard-coded 60px fallback. ⚠️ THE SPAN IS THE ONE IN-FLOW CHILD OF THE RAIL — `.dspan{position:relative}` overrides the `position:absolute` it shares with `.dflag`, so it cannot be placed by the flags' `top` ladder and takes a margin instead. It is also taller than a flag row (32px against 21px), which is why it gets its own constant rather than reusing one. RAIL_MIN was 52 and the computed height for one flag row plus one pin is 45 — so the floor, not the content, was setting the rail's height, and every lane below it sat 7px low against the design.
const RAIL_ROW_H = 21, RAIL_PAD = 4, RAIL_PIN_H = 20, RAIL_SPAN_H = 34, RAIL_MIN = 45, RULER_H = 44;
function railBox(rail, hasSpan) {
    const flags = (rail && rail.flags) || [], pins = (rail && rail.pins) || [];
    const levels = flags.reduce((m, f) => Math.max(m, f.level || 0), 0);
    // The DEEPEST side, not the total: a pin on the left and one on the right occupy the same row.
    const deepest = pins.reduce((m, p) => Math.max(m, (p.level || 0) + 1), 0);
    // 🔴 A FLIPPED CHIP EXTENDS LEFT ALONG THE VERY BAR IT LABELS. Merging Battle Pass and Ranked made the chip 205px, wide enough to run off the right edge, so it flips — and the time-remaining span ENDS at that same deadline, so the flipped chip landed on its last 200px. Rows below the flags, not on them: the two describe one date and the picture should show one above the other, not one through the other.
    const spanTop = hasSpan ? RAIL_ROW_H * (levels + 1) : 0;
    const height = Math.max(RAIL_MIN, RAIL_PAD + RAIL_ROW_H * (levels + 1)
        + (hasSpan ? RAIL_SPAN_H : 0) + RAIL_PIN_H * deepest);
    return { height, xtop: height + RULER_H, spanTop };
}

// ── SHARED-PREFIX STEMMING ────────────────────────────────────────────────────────────────────
//
// Five bars reading "COD Point Rush Week 1".."Week 5" say the same eleven characters five times and then run out of room for the part that differs. The mockup strips the shared stem and marks the bar with `.bar.stemmed` — a dotted left edge, the "continues from" convention — with the full name on the tooltip. Both the rule and the convention were ported into app.css; the pass that emits the class was not, so `.bar.stemmed` had two rules and no element.
//
// 🔴 IT IS COMPUTED FROM THE TITLES, NEVER FROM THE RENDERED WIDTH, and that is the whole reason it is safe to port when its sibling was not. useMeasured.js records why the mockup's label pass had to be dropped: `lbl-cut` truncates a label, which changes the label's width, which flips the branch that added it — a two-cycle no compare-the-previous-result guard can break. Nothing here reads geometry, so nothing it changes can feed back into the decision. Same file, same origin, opposite risk.
//
// ⚠️ PER GROUP, NOT PER LANE — the mockup's own recorded correction. The events lane is five "COD Point Rush Week N" plus one "Terminator 2 Themed Event"; requiring every bar in the lane to share a stem meant none did and the five identical fragments survived untouched.
//
// ⚠️ AND NEVER STRIP TO A BARE TOKEN. Cutting all the way to "1".."5" trades one unreadable label for another, so the cut backs off until at least two words survive: "Week 1".."Week 5".
function stemLabels(list) {
    const out = new Map();
    if (!Array.isArray(list) || list.length < 3) return out;
    const groups = new Map();
    for (const it of list) {
        const full = String((it && it.title) || '');
        if (!full) continue;
        const k = full.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(it);
    }
    for (const g of groups.values()) {
        if (g.length < 3) continue;
        const names = g.map((it) => String(it.title));
        let n = 0;
        while (n < names[0].length && names.every((t) => t[n] === names[0][n])) n++;
        while (n > 0 && !/\s/.test(names[0][n - 1])) n--;
        if (n < 4) continue;
        let cut = n;
        const tailWords = (t) => t.slice(cut).trim().split(/\s+/).filter(Boolean).length;
        while (cut > 0 && names.some((t) => tailWords(t) < 2)) {
            const prev = names[0].lastIndexOf(' ', cut - 2);
            if (prev < 0) { cut = 0; break; }
            cut = prev + 1;
        }
        if (cut < 4) continue;
        g.forEach((it, i) => out.set(it.id, names[i].slice(cut).trim()));
    }
    return out;
}

// ── A CALENDAR BANNER ON A LINK THAT WILL STOP RESOLVING ──────────────────────────────────────
//
// COMPANION §5.2 lists six Repairs checks and this is the one with the most live findings against the real document: a `media.discordapp.net` URL is SIGNED — it carries an `ex=` parameter and 404s once that timestamp passes. `utils/calendarBannerCache.js` exists to re-host these through Cloudinary, and two of three banners had never been through it. The failure is silent at both ends: the URL is well-formed, the field is set, and the image simply stops arriving.
//
// ⚠️ IT IS A HOST TEST, NOT AN `ex=` TEST. A signed link that has already expired and one that expires next week are the same defect — the fix is identical and the deadline is not the point. Testing for the parameter would also miss `cdn.discordapp.com` links, which are the same problem with a different signature scheme.
//
// ⚠️ AND IT REPORTS ZERO MOST OF THE TIME, WHICH IS THE POINT. Both databases were re-hosted on 2026-08-27, so against the live season this finds nothing — and COMPANION's rule is that a check reporting zero stays on screen with its reason, because a panel that only shows problems cannot tell you what it is watching.
const BANNER_FIELDS = [
    { key: 'drawsBannerUrl', label: 'Draws banner' },
    { key: 'eventsBannerUrl', label: 'Events banner' },
    { key: 'playlistsBannerUrl', label: 'Playlists banner' },
];
const SIGNED_HOSTS = ['media.discordapp.net', 'cdn.discordapp.com'];
function findExpiringBanners(season) {
    if (!season) return [];
    return BANNER_FIELDS
        .map((f) => ({ ...f, url: String(season[f.key] || '').trim() }))
        .filter((f) => f.url && SIGNED_HOSTS.some((h) => f.url.includes(h)))
        .map((f) => ({ key: f.key, label: f.label, url: f.url,
            // Under the conformance flag this is the design's shorter line; the portal's own is the one that explains WHY, and it comes back with the rest of the re-apply phase.
            why: (typeof document !== 'undefined' && document.documentElement.dataset.conform === '1')
                ? 'signed Discord CDN link — will expire'
                : 'a signed Discord link — it stops resolving once its own deadline passes' }));
}

// 🔴 THE FINDING NAMES THE ROW IT IS ABOUT, AND NOTHING CARRIED THAT BACK TO THE BAR. The design's markFlagged() strips the finding-kind prefix off the id and marks the matching bar, so a reader scanning the Track can see WHICH item the finding underneath is talking about. Every ingredient was already here — the bars emit data-id, the findings are computed in this file — and only the mapping was missing, which is why the audit reported div.bar.flagged.saved as mockup-only.
//
// ⚠️ past-bp- IS STRIPPED BEFORE past-, because a regex that takes the shorter prefix first leaves bp-<id>, which matches no bar and marks nothing. That is a silent miss, and the design's own version keeps a console.warn for exactly this shape of failure.
//
// ⚠️ An id with no recognised prefix is used AS-IS rather than dropped: a finding kind added later should mark its row by default and be narrowed deliberately, not vanish because this list is stale.
const FLAG_PREFIX = /^(past-bp|ovl|past|gap|dupe)-/;
function flaggedIds(flags) {
    const out = new Set();
    for (const f of flags || []) {
        if (!f || f.sev === 'info') continue;
        out.add(String(f.id).replace(FLAG_PREFIX, ''));
    }
    return out;
}

// 🔴 ONE RULE, TWO CONSUMERS. Repairs computed these six inline and the Track marked nothing, so the bar a finding is ABOUT carried no sign of it — the audit reported div.bar.flagged.saved as mockup-only twice over. Extracted here so the Track can mark the rows without a second implementation of the same question: two implementations of one idea is exactly the failure this file already carries a comment about, where assignRows and the mockup's version disagreed.
//
// ⚠️ THE COPY STAYS IN THE COMPONENT. Only the row SELECTION moves — the notes, the labels and the conform-flag wording belong where they are read, and dragging them in here would make this file answer a question it has no business holding.
function findingRows(data, season, opts) {
    const o = opts || {};
    const all = Object.values(data || {}).flat();
    const spans = all.filter((i) => i.kind !== 'point');
    const draws = [...((data || {}).draw || []), ...((data || {}).returning || [])];
    const bpEnd = season && season.bpEnd ? String(season.bpEnd).slice(0, 10) : '';
    const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

    const seen = new Map(); const dupe = [];
    for (const e of ((data || {}).event || []).concat((data || {}).playlist || [], (data || {}).drawwindow || [])) {
        const k = norm(e.title) + '|' + String(e.startDate || e.date || '').slice(0, 10);
        if (seen.has(k)) dupe.push({ id: e.id, label: e.title, seenAs: seen.get(k) });
        // The design names an ALREADY-SEEN row by the last six of its id, not by its title: in a duplicate the titles are identical by definition, so repeating one says nothing the label has not.
        else seen.set(k, String(e.id || '').slice(-6));
    }
    const banner = findExpiringBanners(season).map((b) => ({ id: b.key, label: b.label, why: b.why }));
    const pastBp = (bpEnd ? all.filter((i) => i.endDate && String(i.endDate).slice(0, 10) > bpEnd) : [])
        .map((i) => ({ id: i.id, label: i.title, item: i }));
    const orphanWindows = ((data || {}).drawwindow || [])
        .filter((w) => !draws.some((d) => { const a = norm(d.title), b = norm(w.title); return a && b && (a.includes(b) || b.includes(a)); }))
        .map((w) => ({ id: w.id, label: w.title }));
    const noWindow = draws.filter((d) => d.dateOnly).map((d) => ({ id: d.id, label: d.title, item: d }));
    // BOTH a CP token AND a doubling word: "CP Rebate Offer" is not a 2x event and neither is "2x Weapon XP".
    const untagged2x = spans.filter((i) => !i.isDoubleCP
            && /\b(cp|cod points?)\b/i.test(i.title || '') && /(^|\W)(2\s*[x×]|double)\b/i.test(i.title || ''))
        .map((i) => ({ id: i.id, label: i.title }));
    return { dupe, banner, pastBp, orphanWindows, noWindow, untagged2x, bpEnd };
}

// 🔴 ONLY THE MECHANICAL FINDINGS MARK A ROW. The first version marked THIRTEEN where the design marks two, because it included the judgement checks — and eleven of those thirteen were draws served without a calendar window, which is a question about eleven perfectly valid rows rather than a fault in them. Painting all eleven says "these are wrong", the exact sentence the mechanical/judgement split in Repairs exists to avoid making.
//
// ⚠️ The banner rows are excluded for a different reason and it is not severity: their id is a season FIELD KEY, never an item id, so it could not match a bar even if it were meant to.
function findingBarIds(data, season, opts) {
    const r = findingRows(data, season, opts);
    const out = new Set();
    for (const g of [r.dupe, r.pastBp, r.orphanWindows]) {
        for (const row of g) if (row && row.id) out.add(String(row.id));
    }
    return out;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { flaggedIds, findingRows, findingBarIds, bandClass, laneFor, tierOf, barGeometry, findOverlaps, findGaps, findDuplicateTitles, normalizeTitle, assignRows, LANE_ORDER, dateFromOffset, editOpFor, clusterPoints, railBox, CLUSTER_PX, stemLabels, findExpiringBanners };
}
