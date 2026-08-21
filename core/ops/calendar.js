// core/ops/calendar.js
//
// The eight calendar mutations, as ops. This is the ONLY file that knows a calendar event's shape.
//
// ⚠️ AUDITED AGAINST THE REAL HANDLER (handlers/manage/calendar.js), not transcribed from the plan document -- see docs/superpowers/plans/2026-08-20-portal-core-remaining-entities.md's Audit log for the full list of what the plan's own draft got wrong here:
//   - single add/edit calendar events are NEVER title-cased (unlike draws) -- the real handler just `.trim()`s the title. toTitleCase() here would silently rewrite every acronym-carrying title.
//   - add/edit/bulkAdd all RESORT the whole array by date afterward (matching the sort-by-date bug already found and fixed in core/ops/draws.js for the same reason: commands/calendar.js trusts stored array order).
//   - "Replace" (bulkReplace) has ALWAYS been a fuzzy-title upsert-merge (utils/bulkMerge.js's upsertByTitle, the exact same function draws.js's bulkReplace uses) -- never a wholesale array $set. A wholesale overwrite here would silently delete every event not in the paste.
//   - "Delete Multiple" (bulkDelete) collects fuzzy-matched pasted TITLES from the real modal, never element ids -- no caller could ever construct an ids-shaped payload from that modal.
//   - "Banners" re-hosts through utils/calendarBannerCache.js (Cloudinary cache/clear per field) -- a plain field $set would silently skip that and, worse, never clear a previously-cached asset.
const mongoose = require('mongoose');
const { registerEntity } = require('./index');
const { updateElement, appendElement, removeElement } = require('../mongo/positional');
const { parseBulkEvents, normalizeCalendarCategory, parseAdminDate } = require('../../utils/adminParser');
const { upsertByTitle } = require('../../utils/bulkMerge');
const { fuzzyMatch } = require('../../utils/search');
const { cacheBannerImage, clearBannerImage } = require('../../utils/calendarBannerCache');
const SeasonalData = require('../../models/SeasonalData');

const DOC = { docType: 'global' };
const PATH = 'calendar';

async function resortByDate(session) {
    const fresh = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
    const sorted = [...fresh[PATH]].sort((a, b) => new Date(a.date) - new Date(b.date));
    await SeasonalData.updateOne(DOC, { $set: { [PATH]: sorted } }, { session });
}

// An invert()-produced payload (or a bulk op's already-parsed payload) carries a real `date` (a Date instance) -- never re-run it through parseAdminDate, which expects a raw modal string.
const isAlreadyDated = (payload) => payload?.date instanceof Date;

function validateEvent(payload) {
    if (isAlreadyDated(payload)) {
        return {
            ok: true, errors: [],
            normalized: { payload: { ...payload, isOngoing: !!payload.isOngoing, isDoubleCP: !!payload.isDoubleCP } }
        };
    }
    const errors = [];
    const title = (payload?.title || '').trim();
    if (!title) errors.push('An event needs a title.');
    const parsedStart = payload?.startDate ? parseAdminDate(payload.startDate) : null;
    if (!parsedStart) errors.push(`Could not read the start date "${payload?.startDate || ''}".`);
    const endDateRaw = (payload?.endDate || '').trim();
    const isOngoing = !endDateRaw;
    const parsedEnd = isOngoing ? null : parseAdminDate(endDateRaw);
    if (!isOngoing && !parsedEnd) errors.push(`Could not read the end date "${endDateRaw}".`);
    if (errors.length) return { ok: false, errors };
    const category = normalizeCalendarCategory(payload.category, title);
    return {
        ok: true, errors: [],
        normalized: { payload: { title, date: parsedStart, endDate: parsedEnd, isOngoing, category, isDoubleCP: !!payload.isDoubleCP } }
    };
}

function mapParsedEvents(parsed) {
    return parsed.map(e => ({ title: e.title, date: e.startDate, endDate: e.isOngoing ? null : e.endDate, isOngoing: e.isOngoing, category: e.category }));
}

const BANNER_FIELDS = [
    { key: 'draws', urlKey: 'drawsBannerUrl', page: 'draws' },
    { key: 'events', urlKey: 'eventsBannerUrl', page: 'events' },
    { key: 'playlists', urlKey: 'playlistsBannerUrl', page: 'playlists' }
];

registerEntity('calendar', {
    'calendar.add': {
        action: 'calendar:add', tier: 1,
        validate: (op) => validateEvent(op.payload),
        preview: (op, live) => ({ before: { count: live.calendar.length }, after: { count: live.calendar.length + 1 } }),
        apply: async (op, { session }) => {
            const element = { ...op.payload, _id: new mongoose.Types.ObjectId() };
            const res = await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, element, session });
            if (!res.ok) return res;
            await resortByDate(session);
            return {
                ok: true,
                change: { action: 'add', model: 'SeasonalData', target: op.payload.title, summary: `Added calendar event "${op.payload.title}"` },
                applied: { elementId: String(element._id), title: op.payload.title }
            };
        },
        invert: (c) => ({ type: 'calendar.delete', target: { elementId: c.applied.elementId }, payload: { title: c.applied.title } })
    },

    'calendar.delete': {
        action: 'calendar:delete', tier: 1,
        validate: (op) => op.target?.elementId ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No event was selected.'] },
        preview: (op, live) => ({ before: { event: live.calendar.find(e => String(e._id) === op.target.elementId) }, after: { event: null } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const gone = before[PATH].find(e => String(e._id) === op.target.elementId);
            if (!gone) return { ok: false, reason: 'missing' };
            const res = await removeElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, elementId: op.target.elementId, session });
            if (!res.ok) return res;
            return {
                ok: true,
                change: { action: 'delete', model: 'SeasonalData', target: gone.title, summary: `Deleted calendar event "${gone.title}"` },
                applied: { removed: gone }
            };
        },
        invert: (c) => ({ type: 'calendar.add', payload: c.applied.removed })
    },

    'calendar.edit': {
        action: 'calendar:edit', tier: 1,
        validate: (op) => op.target?.elementId ? validateEvent(op.payload) : { ok: false, errors: ['No event was selected.'] },
        preview: (op, live) => {
            const cur = live.calendar.find(e => String(e._id) === op.target.elementId);
            return { before: cur, after: { ...cur, ...op.payload } };
        },
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const cur = before[PATH].find(e => String(e._id) === op.target.elementId);
            if (!cur) return { ok: false, reason: 'missing' };
            const expect = Object.fromEntries(Object.keys(op.payload).map(k => [k, cur[k]]));
            const res = await updateElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH,
                                              elementId: op.target.elementId, expect, set: op.payload, session });
            if (!res.ok) return res;
            await resortByDate(session);
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: cur.title, summary: `Edited calendar event "${cur.title}"` },
                applied: { elementId: op.target.elementId, prior: expect }
            };
        },
        invert: (c) => ({ type: 'calendar.edit', target: { elementId: c.applied.elementId }, payload: c.applied.prior })
    },

    'calendar.bulkAdd': {
        action: 'calendar:addmultiple', tier: 2,
        validate: (op) => {
            if (op.payload?.parsed) return { ok: true, errors: [], normalized: op }; // an inverse -- do not re-parse
            const parsed = parseBulkEvents(op.payload.text || '');
            if (!parsed?.length) return { ok: false, errors: ['Nothing in that text parsed as an event. Check the Bulk Format Guide.'] };
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed: mapParsedEvents(parsed) } } };
        },
        preview: (op, live) => ({ before: { count: live.calendar.length }, after: { count: live.calendar.length + op.payload.parsed.length } }),
        apply: async (op, { session }) => {
            const withIds = op.payload.parsed.map(e => ({ ...e, _id: new mongoose.Types.ObjectId() }));
            for (const e of withIds) {
                await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, element: e, session });
            }
            if (withIds.length) await resortByDate(session);
            return {
                ok: true,
                change: { action: 'bulkAdd', model: 'SeasonalData', target: `${withIds.length} events`, summary: `Added ${withIds.length} calendar events in bulk` },
                applied: { ids: withIds.map(e => String(e._id)) }
            };
        },
        invert: (c) => ({ type: 'calendar.bulkDelete', payload: { ids: c.applied.ids } })
    },

    'calendar.bulkReplace': {
        action: 'calendar:replacemultiple', tier: 2,
        validate: (op) => {
            if (op.payload?.parsed) return { ok: true, errors: [], normalized: op }; // an inverse -- do not re-parse
            const parsed = parseBulkEvents(op.payload.text || '');
            if (!parsed?.length) return { ok: false, errors: ['Nothing in that text parsed as an event.'] };
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed: mapParsedEvents(parsed) } } };
        },
        preview: (op, live) => ({ before: { events: live.calendar }, after: { events: op.payload.parsed } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const replaced = before[PATH];
            const { finalArray, updatedCount, insertedCount } = upsertByTitle(replaced, op.payload.parsed);
            finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
            await SeasonalData.updateOne(DOC, { $set: { [PATH]: finalArray } }, { session });
            return {
                ok: true,
                change: { action: 'bulkReplace', model: 'SeasonalData', target: 'calendar',
                          summary: `Replaced calendar events -- updated ${updatedCount}, added ${insertedCount} (now ${finalArray.length} total)` },
                applied: { replaced, added: op.payload.parsed, updatedCount, insertedCount, total: finalArray.length }
            };
        },
        invert: (c) => ({ type: 'calendar.bulkReplace', payload: { parsed: c.applied.replaced } })
    },

    'calendar.bulkDelete': {
        action: 'calendar:deletemultiple', tier: 2,
        validate: (op) => {
            const hasIds = op.payload?.ids?.length > 0;
            const hasTitles = op.payload?.titles?.length > 0;
            return (hasIds || hasTitles) ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['Nothing was selected to delete.'] };
        },
        preview: (op, live) => {
            if (op.payload.ids?.length) return { before: { count: live.calendar.length }, after: { removing: op.payload.ids.length } };
            let remaining = live.calendar; let count = 0;
            for (const title of op.payload.titles || []) {
                const match = remaining.find(e => fuzzyMatch(title, e.title));
                if (match) { count++; remaining = remaining.filter(e => e !== match); }
            }
            return { before: { count: live.calendar.length }, after: { removing: count } };
        },
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const removed = []; const notFound = [];
            if (op.payload.ids?.length) {
                for (const id of op.payload.ids) {
                    const gone = before[PATH].find(e => String(e._id) === id);
                    if (gone) removed.push(gone);
                }
            } else {
                let remaining = [...before[PATH]];
                for (const title of op.payload.titles || []) {
                    const match = remaining.find(e => fuzzyMatch(title, e.title));
                    if (match) { removed.push(match); remaining = remaining.filter(e => e !== match); }
                    else notFound.push(title);
                }
            }
            if (!removed.length) return { ok: false, reason: 'missing' };
            for (const gone of removed) {
                await removeElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, elementId: String(gone._id), session });
            }
            return {
                ok: true,
                change: { action: 'bulkDelete', model: 'SeasonalData', target: `${removed.length} events`,
                          summary: `Deleted ${removed.length} calendar events in bulk`,
                          detail: notFound.length ? `Not found: ${notFound.join(', ')}` : undefined },
                applied: { removed, notFound }
            };
        },
        invert: (c) => ({ type: 'calendar.bulkAdd', payload: { parsed: c.applied.removed } })
    },

    'calendar.setBanners': {
        action: 'calendar:banners', tier: 1,
        validate: (op) => {
            const bad = Object.keys(op.payload || {}).filter(k => !BANNER_FIELDS.some(f => f.key === k));
            return bad.length ? { ok: false, errors: [`Unknown banner page: ${bad.join(', ')}`] } : { ok: true, errors: [], normalized: op };
        },
        preview: (op, live) => {
            const before = {};
            for (const f of BANNER_FIELDS) before[f.key] = live[f.urlKey] || '';
            return { before, after: { ...before, ...op.payload } };
        },
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const prior = {}; const $set = {};
            for (const f of BANNER_FIELDS) {
                if (!(f.key in (op.payload || {}))) continue;
                prior[f.key] = before[f.urlKey] || '';
                const raw = (op.payload[f.key] || '').trim();
                if (!raw) {
                    if (before[f.urlKey]) await clearBannerImage(f.page);
                    $set[f.urlKey] = '';
                } else {
                    const result = await cacheBannerImage(f.page, raw);
                    $set[f.urlKey] = result.url || '';
                }
            }
            if (Object.keys($set).length) await SeasonalData.updateOne(DOC, { $set }, { session });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'Calendar Banners', summary: 'Updated calendar banners' },
                applied: { prior }
            };
        },
        invert: (c) => ({ type: 'calendar.setBanners', payload: c.applied.prior })
    },

    'calendar.purge': {
        action: 'calendar:purge', tier: 3,
        validate: () => ({ ok: true, errors: [], normalized: {} }),
        preview: (op, live) => ({ before: { count: live.calendar.length }, after: { count: 0 } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            await SeasonalData.updateOne(DOC, { $set: { [PATH]: [] } }, { session });
            return {
                ok: true,
                change: { action: 'purge', model: 'SeasonalData', target: 'calendar', summary: `Purged calendar (${before[PATH].length} event(s) removed)` },
                applied: { events: before[PATH] }
            };
        },
        invert: (c) => ({ type: 'calendar.bulkReplace', payload: { parsed: c.applied.events } })
    }
});
