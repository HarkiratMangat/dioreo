// core/ops/patchnotes.js
//
// Patch-note mutations, as ops, following core/ops/calendar.js's element-identity shape.
//
// ⚠️ AUDITED AGAINST THE REAL HANDLER (handlers/manage/patchnotes.js), not transcribed from the plan document -- real defects/gaps found:
//   - the real handler uses adminParser.js's parseReleaseDateTime (admin-local-clock-aware when a time is typed), NEVER parseAdminDate -- every other admin date field is UTC-0-only, but patch notes' release date/time is the one deliberate exception (see design-decisions.md). Using parseAdminDate here would silently discard any typed time-of-day.
//   - setDateInfo/setUrls1/setUrls2/addSeason ALL re-host through utils/patchNotesCache.js's cachePatchImage(), keyed by the patch entry's own _id (season-based image retention, not the draws age window -- see models/SeasonalData.js). A plain field $set would skip re-hosting AND leave stale Cloudinary metadata (syncPatchEntryMetadata) unsynced.
//   - the plan's own Interfaces line names FIVE op types (setDateInfo/setUrls1/setUrls2/addSeason/ purge) and is MISSING a sixth real mutation entirely: `handlePatchSeasonPick`'s `modal_patch_editseason_{id}` flow edits any PAST entry in place. Its id embeds a Mongo _id the same way the announcement per-row buttons do (utils/manageActions.js deliberately doesn't carry those either), so it never showed up in ACTIONS_BY_PAGE for the plan's own author to find by reading the registry alone -- only reading the real handler file surfaced it.
//   - setDateInfo/setUrls1/setUrls2 always target an EXISTING entry (element-identity, matching draws.edit/calendar.edit) rather than baking real getOrCreateCurrentPatch()-style "create the first entry on demand" logic into the op itself -- the handler-wiring stage (not done this session) resolves "current entry" to an elementId and, on a freshly-purged season with zero entries, builds a addSeason+setDateInfo changeset instead of a single op, exactly like how draws.js's real bulkDraftDraws already builds "up to two ops... committed together" for its own two-optional-field case.
const mongoose = require('mongoose');
const { registerEntity } = require('./index');
const { updateElement, appendElement, removeElement } = require('../mongo/positional');
const { parseReleaseDateTime } = require('../../utils/adminParser');
const { cachePatchImage, syncPatchEntryMetadata } = require('../../utils/patchNotesCache');
const { displayTitle } = require('../../commands/patchnotes');
const SeasonalData = require('../../models/SeasonalData');

const DOC = { docType: 'global' };
const PATH = 'patchNotes';

// An invert()-produced payload carries a real `releaseDate` (a Date instance) already resolved -- never re-run it through parseReleaseDateTime, which expects a raw modal string.
function resolveReleaseDate(payload) {
    if (payload?.releaseDate instanceof Date) return payload.releaseDate;
    return parseReleaseDateTime(payload?.releaseDate || '', payload?.timezone);
}

function cleanUrls(list) {
    return (list || []).map(u => (u || '').trim()).filter(u => u && u.startsWith('http'));
}

async function cacheUrlList(patchId, urls, meta) {
    const cached = [];
    for (let i = 0; i < urls.length; i++) cached.push((await cachePatchImage(patchId, i, urls[i], meta)).url);
    return cached;
}

function makeSetUrlsOp(slot) {
    const slotOffset = slot === 1 ? 0 : 5;
    return {
        action: `patchnotes:urls${slot}`, tier: 1,
        validate: (op) => op.target?.elementId ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No current patch notes entry to update.'] },
        preview: (op, live) => {
            const cur = live.patchNotes.find(p => String(p._id) === op.target.elementId);
            return { before: { images: (cur?.images || []).slice(slotOffset, slotOffset + 5) }, after: {} };
        },
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const cur = before[PATH].find(p => String(p._id) === op.target.elementId);
            if (!cur) return { ok: false, reason: 'missing' };
            const rawUrls = cleanUrls(op.payload.urls).slice(0, 5);
            const priorImages = cur.images || [];
            const patchMeta = { season: displayTitle(cur), releaseDate: cur.releaseDate };
            // cachePatchImage indexes by the field's ABSOLUTE slot in images[] (URLs 1 = 0-4, URLs 2 = 5-9), matching handlers/manage/patchnotes.js exactly -- resubmitting a slot overwrites the same cached asset in place rather than accumulating duplicates.
            const cachedSlice = [];
            for (let i = 0; i < rawUrls.length; i++) cachedSlice.push((await cachePatchImage(String(cur._id), slotOffset + i, rawUrls[i], patchMeta)).url);
            const otherSlice = slot === 1 ? priorImages.slice(5, 10) : priorImages.slice(0, 5);
            const images = slot === 1 ? [...cachedSlice, ...otherSlice] : [...otherSlice, ...cachedSlice];
            const priorSlice = slot === 1 ? priorImages.slice(0, 5) : priorImages.slice(5, 10);
            const res = await updateElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH,
                                              elementId: op.target.elementId, expect: { images: priorImages }, set: { images }, session });
            if (!res.ok) return res;
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: displayTitle(cur), summary: `Updated Patch Notes URLs ${slot} for "${displayTitle(cur)}"` },
                applied: { elementId: op.target.elementId, priorSlice, slot }
            };
        },
        invert: (c) => ({ type: `patchnote.setUrls${c.applied.slot}`, target: { elementId: c.applied.elementId }, payload: { urls: c.applied.priorSlice } })
    };
}

registerEntity('patchnotes', {
    'patchnote.setDateInfo': {
        action: 'patchnotes:dateinfo', tier: 1,
        validate: (op) => op.target?.elementId ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No current patch notes entry to update.'] },
        preview: (op, live) => {
            const cur = live.patchNotes.find(p => String(p._id) === op.target.elementId);
            return { before: cur, after: { ...cur, ...op.payload } };
        },
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const cur = before[PATH].find(p => String(p._id) === op.target.elementId);
            if (!cur) return { ok: false, reason: 'missing' };
            const releaseDate = resolveReleaseDate(op.payload);
            const description = (op.payload.description || '').trim();
            const titleOverride = (op.payload.titleOverride || '').trim();
            const set = { releaseDate, description, titleOverride };
            const expect = { releaseDate: cur.releaseDate, description: cur.description, titleOverride: cur.titleOverride };
            const res = await updateElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, elementId: op.target.elementId, expect, set, session });
            if (!res.ok) return res;
            const effectiveTitle = displayTitle({ ...cur, titleOverride });
            await syncPatchEntryMetadata({ ...cur, ...set }, effectiveTitle);
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: effectiveTitle, summary: `Updated Patch Notes date/info for "${effectiveTitle}"` },
                applied: { elementId: op.target.elementId, prior: expect }
            };
        },
        invert: (c) => ({ type: 'patchnote.setDateInfo', target: { elementId: c.applied.elementId }, payload: c.applied.prior })
    },

    'patchnote.setUrls1': makeSetUrlsOp(1),
    'patchnote.setUrls2': makeSetUrlsOp(2),

    'patchnote.addSeason': {
        action: 'patchnotes:addseason', tier: 2,
        validate: (op) => ({ ok: true, errors: [], normalized: op }),
        preview: (op, live) => ({ before: { count: live.patchNotes.length }, after: { count: live.patchNotes.length + 1 } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const releaseDate = resolveReleaseDate(op.payload);
            const element = {
                title: before.currentSeasonTitle || 'Untitled Season',
                titleOverride: (op.payload.titleOverride || '').trim(),
                description: (op.payload.description || '').trim(),
                releaseDate, images: [], _id: new mongoose.Types.ObjectId()
            };
            await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, element, session });
            const rawUrls = [...cleanUrls(op.payload.urls1), ...cleanUrls(op.payload.urls2)].slice(0, 10);
            if (rawUrls.length) {
                const patchMeta = { season: displayTitle(element), releaseDate };
                const cachedUrls = await cacheUrlList(String(element._id), rawUrls, patchMeta);
                await updateElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, elementId: String(element._id),
                                      expect: { images: [] }, set: { images: cachedUrls }, session });
            }
            return {
                ok: true,
                change: { action: 'add', model: 'SeasonalData', target: displayTitle(element), summary: `Added new Patch Notes season "${displayTitle(element)}"` },
                applied: { elementId: String(element._id) }
            };
        },
        invert: (c) => ({ type: 'patchnote.removeSeason', target: { elementId: c.applied.elementId } })
    },

    // Not a registry action -- exists solely as addSeason's inverse (the way core/ops/season.js's season.restoreSnapshot exists solely as promoteDraft's inverse). Not reachable from /manage.
    'patchnote.removeSeason': {
        tier: 2,
        validate: (op) => op.target?.elementId ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No entry to remove.'] },
        preview: (op, live) => ({ before: { entry: live.patchNotes.find(p => String(p._id) === op.target.elementId) }, after: { entry: null } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const gone = before[PATH].find(p => String(p._id) === op.target.elementId);
            if (!gone) return { ok: false, reason: 'missing' };
            const res = await removeElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, elementId: op.target.elementId, session });
            if (!res.ok) return res;
            return {
                ok: true,
                change: { action: 'delete', model: 'SeasonalData', target: displayTitle(gone), summary: `Removed patch notes entry "${displayTitle(gone)}"` },
                applied: { removed: gone }
            };
        },
        // ⚠️ ACCEPTED LIMITATION: reverting a revert (undoing THIS op) mints a brand-new _id via addSeason rather than restoring the original one, so the original Cloudinary image cache keyed on the old _id is orphaned. Only reachable by reverting an already-reverted addSeason -- a double-undo -- which is a low-frequency enough path that a full restore-by-exact-id op wasn't built for it. Documented, not silent.
        invert: (c) => ({
            type: 'patchnote.addSeason',
            payload: {
                titleOverride: c.applied.removed.titleOverride, description: c.applied.removed.description,
                releaseDate: c.applied.removed.releaseDate,
                urls1: (c.applied.removed.images || []).slice(0, 5), urls2: (c.applied.removed.images || []).slice(5, 10)
            }
        })
    },

    // Not in the plan's own Interfaces line at all -- found by reading the real handler's handlePatchSeasonPick -> modal_patch_editseason_{id} flow, not by reading utils/manageActions.js (its id embeds a Mongo _id the registry's group/action split can't represent, so it never shows up in ACTIONS_BY_PAGE for a registry-only read to find).
    'patchnote.editSeason': {
        tier: 1,
        validate: (op) => op.target?.elementId ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No entry to edit.'] },
        preview: (op, live) => ({ before: live.patchNotes.find(p => String(p._id) === op.target.elementId), after: op.payload }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const cur = before[PATH].find(p => String(p._id) === op.target.elementId);
            if (!cur) return { ok: false, reason: 'missing' };
            const releaseDate = resolveReleaseDate(op.payload);
            const titleOverride = (op.payload.titleOverride || '').trim();
            const description = (op.payload.description || '').trim();
            const rawUrls = [...cleanUrls(op.payload.urls1), ...cleanUrls(op.payload.urls2)].slice(0, 10);
            const patchMeta = { season: displayTitle({ ...cur, titleOverride }), releaseDate };
            const cachedUrls = await cacheUrlList(String(cur._id), rawUrls, patchMeta);
            const set = { titleOverride, description, releaseDate, images: cachedUrls };
            const expect = { titleOverride: cur.titleOverride, description: cur.description, releaseDate: cur.releaseDate, images: cur.images };
            const res = await updateElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, elementId: op.target.elementId, expect, set, session });
            if (!res.ok) return res;
            const effectiveTitle = displayTitle({ ...cur, titleOverride });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: effectiveTitle, summary: `Edited past Patch Notes season "${effectiveTitle}"` },
                applied: { elementId: op.target.elementId, prior: expect }
            };
        },
        invert: (c) => ({
            type: 'patchnote.editSeason', target: { elementId: c.applied.elementId },
            payload: {
                titleOverride: c.applied.prior.titleOverride, description: c.applied.prior.description,
                releaseDate: c.applied.prior.releaseDate,
                urls1: (c.applied.prior.images || []).slice(0, 5), urls2: (c.applied.prior.images || []).slice(5, 10)
            }
        })
    },

    'patchnote.purge': {
        action: 'patchnotes:purge', tier: 3,
        validate: () => ({ ok: true, errors: [], normalized: {} }),
        preview: (op, live) => ({ before: { count: live.patchNotes.length }, after: { count: 0 } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            await SeasonalData.updateOne(DOC, { $set: { [PATH]: [] } }, { session });
            return {
                ok: true,
                change: { action: 'purge', model: 'SeasonalData', target: 'all', summary: `Purged the patch notes history (${before[PATH].length} entry(s) removed)` },
                applied: { entries: before[PATH] }
            };
        },
        invert: (c) => ({ type: 'patchnote.restore', payload: { entries: c.applied.entries } })
    },

    // Not a registry action -- exists solely as purge's inverse, restoring the whole history verbatim (exact _ids preserved, unlike addSeason) in one wholesale $set. A snapshot restore, not a merge -- purge is the one place patch notes history can be fully wiped, so its undo is a full replace.
    'patchnote.restore': {
        tier: 3,
        validate: (op) => Array.isArray(op.payload?.entries) ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['Nothing to restore.'] },
        preview: (op, live) => ({ before: { count: live.patchNotes.length }, after: { count: op.payload.entries.length } }),
        apply: async (op, { session }) => {
            await SeasonalData.updateOne(DOC, { $set: { [PATH]: op.payload.entries } }, { session });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'all', summary: `Restored ${op.payload.entries.length} patch notes entry(s)` },
                applied: { entries: op.payload.entries }
            };
        },
        invert: (c) => ({ type: 'patchnote.purge' })
    }
});
