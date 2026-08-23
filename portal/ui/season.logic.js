// portal/ui/season.logic.js — CommonJS, imports nothing. Pure op-builders for the Season realm's compose actions, tested directly by scripts/portalRealms.test.js.
//
// 🔴 THE MANIFEST ROW'S `lane` ('newDraws'/'returningDraws'/'calendar' — the SeasonalData ARRAY PATH name, see toManifestRows below) is NOT the vocabulary core/ops/draws.js's validate() accepts for payload.category/target.category ('new'/'returning' — see LANE_TO_CATEGORY below). Passing the lane straight through fails validation silently differently than expected; this mapping is the fix, found by reading core/ops/draws.js's validateOne() before writing this file.
const LANE_TO_CATEGORY = { newDraws: 'new', returningDraws: 'returning' };
// The Manifest column's own humanized label for a row's lane -- gap audit §3.4 finding 1. Season.js references this as a bare global (loaded before it, same as everything else here).
const LANE_LABELS = { newDraws: 'New draw', returningDraws: 'Returning draw', calendar: 'Event' };
// The Manifest row's COLOUR DOT. manifest.js:61 has always read `row.topicVar` -- and nothing in the repo has ever SET it, so every row's dot in every realm rendered the --ink3 grey fallback. The gap audit's §2.2 asserted toManifestRows was the source of it; `rg topicVar portal/` returns the read, a `delete` in buildSeasonEditOp below, and nothing else. Phase 2's token fix therefore reached Track's bars (track.js computes its own --topic-accent) and never reached the Manifest.
//
// Playlist gets its own accent here rather than being folded into Event. --play and TOPIC_VAR.playlist have both existed since the first build with nothing ever assigning them: a playlist-category calendar item was indistinguishable from an event on every Season surface.
const LANE_TOPIC_VAR = { newDraws: '--draw', returningDraws: '--ret', calendar: '--ev' };
function isPlaylist(item) { return String((item && item.category) || '').toLowerCase() === 'playlist'; }
function topicVarFor(laneKey, item) { return (laneKey === 'calendar' && isPlaylist(item)) ? '--play' : (LANE_TOPIC_VAR[laneKey] || '--ink3'); }
function typeLabelFor(laneKey, item) { return (laneKey === 'calendar' && isPlaylist(item)) ? 'Playlist' : (LANE_LABELS[laneKey] || laneKey); }

// The Track's visible date range. It used to be {start: today, end: live.bpEnd || today} inline in season.js -- so when bpEnd is unset (its state in the dev database right now, and the state of any season nobody has typed a battle-pass end into) start EQUALLED end, barGeometry divided by a 1ms window, every bar collapsed to a sliver at 0% and the ruler printed today twice. Derived from the data's own extent instead, with today always inside it so the NOW line has somewhere to land and a 14-day floor so a season holding one item is still a readable axis rather than a point.
function seasonWindow(live, now = Date.now()) {
    const stamps = [now];
    for (const key of ['newDraws', 'returningDraws', 'calendar']) {
        for (const item of (live && live[key]) || []) {
            for (const value of [item.date, item.startDate, item.endDate]) {
                const t = value ? new Date(value).getTime() : NaN;
                if (Number.isFinite(t)) stamps.push(t);
            }
        }
    }
    const bp = live && live.bpEnd ? new Date(live.bpEnd).getTime() : NaN;
    if (Number.isFinite(bp)) stamps.push(bp);
    const lo = Math.min(...stamps);
    let hi = Math.max(...stamps);
    const MIN_SPAN_MS = 14 * 86400000;
    if (hi - lo < MIN_SPAN_MS) hi = lo + MIN_SPAN_MS;
    return { start: new Date(lo).toISOString().slice(0, 10), end: new Date(hi).toISOString().slice(0, 10) };
}
const KIND_TO_ENTITY = { draw: 'draw', returning: 'draw', event: 'calendar', playlist: 'calendar' };
const KIND_TO_DRAW_CATEGORY = { draw: 'new', returning: 'returning' };

// Gap audit §3.4 finding 2: this used to hardcode state:'live' on every row unconditionally, regardless of whether the SIGNED-IN admin's own open Changesets (season.js already fetches these for Board's use via GET /api/changeset?realm=season, scoped to session.discordId per H7) had a pending op against that exact item. Derives the real state instead: an id targeted by a 'blocked' changeset's op reads as a conflict, a 'staged' one reads as staged, otherwise live. Moved here (was a local function in season.js) so it's a real testable pure function rather than browser-only ESM -- same reasoning as LANE_LABELS above.
function elementIdsFor(changeset) {
    const ids = new Set();
    for (const op of changeset.ops || []) {
        if (op.target && op.target.elementId) ids.add(String(op.target.elementId));
        // draw.bulkDelete/calendar.bulkDelete carry payload.ids rather than target.elementId -- season.js's own UI doesn't issue these today (its bulk actions map to per-row .delete ops instead), but core/ops itself supports them, so this stays correct if that changes.
        if (Array.isArray(op.payload && op.payload.ids)) op.payload.ids.forEach((id) => ids.add(String(id)));
    }
    return ids;
}

function stateForElement(elementId, changesets) {
    for (const c of changesets || []) {
        if (c.state !== 'staged' && c.state !== 'blocked') continue;
        if (elementIdsFor(c).has(String(elementId))) return c.state === 'blocked' ? 'conflict' : 'staged';
    }
    return 'live';
}

function toManifestRows(live, changesets) {
    if (!live) return [];
    const rows = [];
    for (const key of ['newDraws', 'returningDraws', 'calendar']) {
        for (const item of live[key] || []) {
            rows.push({
                // The full item ships on the row (not just the display fields below) so buildSeasonEditOp has every field draw.edit/calendar.edit's validate() needs -- an edit op built from a display-only row would silently drop items/startDate/category on every commit.
                ...item,
                id: item._id, title: item.title, lane: key,
                state: stateForElement(item._id, changesets),
                // Display-only, both stripped again by buildSeasonEditOp before an op is built.
                topicVar: topicVarFor(key, item), typeLabel: typeLabelFor(key, item),
                // A draw's real schema field is `date` (no separate start/end); calendar events have both `date`(start) and `endDate`. This pre-existing display line always fell to '—' for every draw before this fix, since item.endDate is never set on a draw record.
                window: (item.endDate || item.date) ? `→ ${new Date(item.endDate || item.date).toDateString()}` : '—',
            });
        }
    }
    return rows;
}

function buildSeasonAddOp(kind, fields) {
    const entity = KIND_TO_ENTITY[kind];
    if (entity === 'draw') {
        // core/ops/draws.js validates payload.date (matching the SeasonalData schema's newDraws/ returningDraws[].date field, and utils/adminParser.js's parseBulkDrawList -- draws have no separate start/end, unlike calendar events, whose schema genuinely has both).
        return { type: 'draw.add', target: null, payload: { title: fields.title, category: KIND_TO_DRAW_CATEGORY[kind], date: fields.endDate, items: fields.items || [] } };
    }
    return { type: 'calendar.add', target: null, payload: { title: fields.title, startDate: fields.startDate, endDate: fields.endDate, category: fields.category || (kind === 'playlist' ? 'Playlist' : 'Event'), isOngoing: !!fields.isOngoing, isDoubleCP: !!fields.isDoubleCP } };
}

// Edits one field of an existing row, preserving the rest -- draw.edit/calendar.edit's validate() needs the full record, not a partial patch (core/ops/draws.js, core/ops/calendar.js). Dates are passed as bare ISO date strings (YYYY-MM-DD) rather than a full ISO datetime, since validate() re-parses them through chrono-node's parseAdminDate() (an op arriving as JSON over HTTP never satisfies the "already a real Date instance" fast path those functions also support) and a bare date is the form that parser is built for.
function toChronoDateString(value) {
    if (!value) return value;
    return new Date(value).toISOString().slice(0, 10);
}

function buildSeasonEditOp(row, columnKey, newValue) {
    const isDraw = row.lane === 'newDraws' || row.lane === 'returningDraws';
    const type = isDraw ? 'draw.edit' : 'calendar.edit';
    const target = isDraw ? { category: LANE_TO_CATEGORY[row.lane], elementId: row.id } : { elementId: row.id };
    // The Manifest row's own display field is called `window`/`endDate` regardless of entity (see toManifestRows above), but a draw's real schema/op field is `date`, not `endDate` -- a row edit on the Manifest's synthetic `endDate` display key must be routed onto the correct real payload key per entity before it reaches core/ops.
    const rawPayload = { ...row, [columnKey]: newValue };
    delete rawPayload.id; delete rawPayload.lane; delete rawPayload.state; delete rawPayload.window; delete rawPayload.topicVar; delete rawPayload.typeLabel;
    if (isDraw) {
        rawPayload.date = rawPayload.endDate ?? rawPayload.date; delete rawPayload.endDate;
    } else {
        // core/ops/calendar.js's validateEvent reads the START date as raw payload.startDate, even though the STORED field is `date` -- a real field-name mismatch (matching the class of bug already fixed for draws) found auditing Task 4's editOpFor, which shares this exact contract. A Manifest row's own field is `date` (the raw SeasonalData subdocument's real name), so it must be renamed before it reaches validateEvent, or a calendar edit fails validation outright ("Could not read the start date").
        rawPayload.startDate = rawPayload.date; delete rawPayload.date;
    }
    const payload = { ...rawPayload };
    if (payload.startDate) payload.startDate = toChronoDateString(payload.startDate);
    if (payload.endDate) payload.endDate = toChronoDateString(payload.endDate);
    if (isDraw && payload.date) payload.date = toChronoDateString(payload.date);
    return { type, target, payload };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildSeasonAddOp, buildSeasonEditOp, LANE_TO_CATEGORY, KIND_TO_ENTITY, LANE_LABELS, toManifestRows, stateForElement, seasonWindow, topicVarFor, typeLabelFor, isPlaylist };
}
