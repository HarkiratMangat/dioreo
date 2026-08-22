// portal/ui/season.logic.js — CommonJS, imports nothing. Pure op-builders for the Season realm's compose actions, tested directly by scripts/portalRealms.test.js.
//
// 🔴 THE MANIFEST ROW'S `lane` ('newDraws'/'returningDraws'/'calendar' — the SeasonalData ARRAY PATH name, see season.js's toManifestRows) is NOT the vocabulary core/ops/draws.js's validate() accepts for payload.category/target.category ('new'/'returning' — see LANE_TO_CATEGORY below). Passing the lane straight through fails validation silently differently than expected; this mapping is the fix, found by reading core/ops/draws.js's validateOne() before writing this file.
const LANE_TO_CATEGORY = { newDraws: 'new', returningDraws: 'returning' };
const KIND_TO_ENTITY = { draw: 'draw', returning: 'draw', event: 'calendar', playlist: 'calendar' };
const KIND_TO_DRAW_CATEGORY = { draw: 'new', returning: 'returning' };

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
    // The Manifest row's own display field is called `window`/`endDate` regardless of entity (see toManifestRows in season.js), but a draw's real schema/op field is `date`, not `endDate` -- a row edit on the Manifest's synthetic `endDate` display key must be routed onto the correct real payload key per entity before it reaches core/ops.
    const rawPayload = { ...row, [columnKey]: newValue };
    delete rawPayload.id; delete rawPayload.lane; delete rawPayload.state; delete rawPayload.window; delete rawPayload.topicVar;
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
    module.exports = { buildSeasonAddOp, buildSeasonEditOp, LANE_TO_CATEGORY, KIND_TO_ENTITY };
}
