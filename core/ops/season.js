// core/ops/season.js
//
// Season lifecycle mutations, the highest blast radius in the system.
//
// ⚠️ AUDITED AGAINST THE REAL HANDLER (handlers/manage/season.js) AND THE REAL REGISTRY (utils/manageActions.js's SEASONDRAFT_ACTIONS), not transcribed from the plan document. The plan's own Interfaces line names FOUR op types (setTitlesDeadlines/promoteDraft/discardDraft/startNew) -- it is missing THREE real, registered mutating actions entirely: `seasondraft:settitles`, `seasondraft:bulkdraws`, `seasondraft:bulkcalendar` (handlers/manage/season.js's setDraftTitlesDeadlines/bulkDraftDraws/bulkDraftCalendar), which stage the next-season draft BEFORE Promote/Discard ever run. Because these three ARE real ACTIONS_BY_PAGE.seasondraft entries, Task 7's own conservation test ("every mutating action on every page resolves to an op") would have failed the moment it actually ran against a plan built only from the Interfaces line -- the gap was only visible by reading the real handler and the real registry side by side, not either alone.
//
// ⚠️ A rotation (promoteDraft/startNew) is inverted by a FULL PRE-ROTATION SNAPSHOT via the internal `season.restoreSnapshot` op, never a diff -- a diff of a multi-field, multi-array rotation is not a restore. restoreSnapshot is symmetric (its own apply() snapshots what it's about to overwrite and its invert() returns another restoreSnapshot carrying that snapshot), so it stays revertible indefinitely without needing a second op type for "undo of an undo".
const { registerEntity } = require('./index');
const { splitTitleDate, parseAdminDate, parseBulkDrawList, parseBulkEvents } = require('../../utils/adminParser');
const { resolveThumbnailsForDraws } = require('../../utils/bulkMerge');
const SeasonalData = require('../../models/SeasonalData');

const DOC = { docType: 'global' };

// Shared by setTitlesDeadlines (live) and setDraftTitlesDeadlines (staged) -- each of the 3 deadline fields carries both a title and an end date on one line ("Battle Pass, August 28"). A blank line leaves that title+date pair untouched; typing the literal word "TBD" sets the TBD flag and nulls the date (the L194 bug this guards against: a TBD typo silently becoming a real date).
function applyLine(current, line, label, skipped) {
    const { title, dateStr } = splitTitleDate(line || '');
    const result = { title: current.title, end: current.end, endTBD: current.endTBD };
    if (title) result.title = title;
    if (dateStr) {
        if (dateStr.trim().toLowerCase() === 'tbd') {
            result.end = null; result.endTBD = true;
        } else {
            const parsed = parseAdminDate(dateStr);
            if (parsed) { result.end = parsed; result.endTBD = false; }
            else skipped.push(label);
        }
    }
    return result;
}

function mapParsedEvents(parsed) {
    return parsed.map(e => ({ title: e.title, date: e.startDate, endDate: e.isOngoing ? null : e.endDate, isOngoing: e.isOngoing, category: e.category }));
}

registerEntity('season', {
    'season.setTitlesDeadlines': {
        action: 'season:titlesdeadlines', tier: 1,
        validate: (op) => ({ ok: true, errors: [], normalized: op }),
        preview: (op, live) => ({ before: { title: live.currentSeasonTitle }, after: { title: (op.payload.mainTitle || '').trim() || live.currentSeasonTitle } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const prior = {
                currentSeasonTitle: before.currentSeasonTitle, bpTitle: before.bpTitle, rankTitle: before.rankTitle, dmzTitle: before.dmzTitle,
                bpEnd: before.bpEnd, rankEnd: before.rankEnd, dmzEnd: before.dmzEnd,
                bpEndTBD: before.bpEndTBD, rankEndTBD: before.rankEndTBD, dmzEndTBD: before.dmzEndTBD
            };
            const currentSeasonTitle = (op.payload.mainTitle || '').trim() || before.currentSeasonTitle;
            const skipped = [];
            const bp = applyLine({ title: before.bpTitle, end: before.bpEnd, endTBD: before.bpEndTBD }, op.payload.bpLine, 'Battle Pass', skipped);
            const rank = applyLine({ title: before.rankTitle, end: before.rankEnd, endTBD: before.rankEndTBD }, op.payload.rankLine, 'Ranked', skipped);
            const dmz = applyLine({ title: before.dmzTitle, end: before.dmzEnd, endTBD: before.dmzEndTBD }, op.payload.dmzLine, 'DMZ', skipped);
            const $set = {
                currentSeasonTitle, bpTitle: bp.title, rankTitle: rank.title, dmzTitle: dmz.title,
                bpEnd: bp.end, rankEnd: rank.end, dmzEnd: dmz.end, bpEndTBD: bp.endTBD, rankEndTBD: rank.endTBD, dmzEndTBD: dmz.endTBD
            };
            await SeasonalData.updateOne(DOC, { $set }, { session });
            let patchPrior = null;
            if (before.patchNotes.length > 0 && currentSeasonTitle !== before.currentSeasonTitle) {
                const last = before.patchNotes[before.patchNotes.length - 1];
                patchPrior = { elementId: String(last._id), title: last.title };
                await SeasonalData.updateOne({ ...DOC, 'patchNotes._id': last._id }, { $set: { 'patchNotes.$.title': currentSeasonTitle } }, { session });
            }
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: currentSeasonTitle, summary: 'Updated season titles & deadlines',
                          detail: skipped.length ? `Date not understood, left unchanged: ${skipped.join(', ')}` : undefined },
                applied: { prior, patchPrior }
            };
        },
        invert: (c) => ({ type: 'season.restoreSnapshot', payload: { ...c.applied.prior, ...(c.applied.patchPrior ? { __patchTitleRestore: c.applied.patchPrior } : {}) } })
    },

    'season.startNew': {
        action: 'season:wipe', tier: 3,
        validate: (op) => (op.payload?.newTitle || '').trim() ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['A new season needs a title.'] },
        preview: (op, live) => ({
            before: { title: live.currentSeasonTitle, draws: live.newDraws.length + live.returningDraws.length, events: live.calendar.length },
            after: { title: op.payload.newTitle, draws: 0, events: 0 }
        }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const prior = { currentSeasonTitle: before.currentSeasonTitle, newDraws: before.newDraws, returningDraws: before.returningDraws, calendar: before.calendar };
            const newTitle = op.payload.newTitle.trim();
            await SeasonalData.updateOne(DOC, { $set: { currentSeasonTitle: newTitle, newDraws: [], returningDraws: [], calendar: [] } }, { session });
            return {
                ok: true,
                change: { action: 'wipe', model: 'SeasonalData', target: newTitle, summary: `Started new season "${newTitle}" (wiped Draws + Calendar)` },
                applied: { prior }
            };
        },
        invert: (c) => ({ type: 'season.restoreSnapshot', payload: c.applied.prior })
    },

    'season.promoteDraft': {
        action: 'seasondraft:promote', tier: 3,
        // real handler's draftGuard('promote') (utils/manageActions.js) already replies and refuses BEFORE this op is even reached if no draft is active -- apply() still re-checks, since a draft could be discarded between the confirm prompt and the click.
        validate: (op) => ({ ok: true, errors: [], normalized: op }),
        preview: (op, live) => {
            const d = live.draft || {};
            return {
                before: { title: live.currentSeasonTitle },
                after: { title: d.currentSeasonTitle || live.currentSeasonTitle, newDraws: d.newDraws?.length || 0, returningDraws: d.returningDraws?.length || 0, calendar: d.calendar?.length || 0 }
            };
        },
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const draft = before.draft || {};
            if (!draft.active) return { ok: false, reason: 'missing' };
            const prior = {
                currentSeasonTitle: before.currentSeasonTitle, bpTitle: before.bpTitle, rankTitle: before.rankTitle, dmzTitle: before.dmzTitle,
                bpEnd: before.bpEnd, rankEnd: before.rankEnd, dmzEnd: before.dmzEnd,
                bpEndTBD: before.bpEndTBD, rankEndTBD: before.rankEndTBD, dmzEndTBD: before.dmzEndTBD,
                newDraws: before.newDraws, returningDraws: before.returningDraws, calendar: before.calendar,
                drawsBannerUrl: before.drawsBannerUrl, eventsBannerUrl: before.eventsBannerUrl, playlistsBannerUrl: before.playlistsBannerUrl
            };
            const $set = {};
            if (draft.currentSeasonTitle) $set.currentSeasonTitle = draft.currentSeasonTitle;
            if (draft.bpTitle) $set.bpTitle = draft.bpTitle;
            if (draft.rankTitle) $set.rankTitle = draft.rankTitle;
            if (draft.dmzTitle) $set.dmzTitle = draft.dmzTitle;
            // The TBD flag is checked BEFORE the date -- a plain truthy check on bpEnd would silently skip promoting a TBD deadline, since TBD leaves draft.bpEnd explicitly null.
            if (draft.bpEndTBD) { $set.bpEnd = null; $set.bpEndTBD = true; } else if (draft.bpEnd) { $set.bpEnd = draft.bpEnd; $set.bpEndTBD = false; }
            if (draft.rankEndTBD) { $set.rankEnd = null; $set.rankEndTBD = true; } else if (draft.rankEnd) { $set.rankEnd = draft.rankEnd; $set.rankEndTBD = false; }
            if (draft.dmzEndTBD) { $set.dmzEnd = null; $set.dmzEndTBD = true; } else if (draft.dmzEnd) { $set.dmzEnd = draft.dmzEnd; $set.dmzEndTBD = false; }
            $set.newDraws = draft.newDraws || [];
            $set.returningDraws = draft.returningDraws || [];
            $set.calendar = draft.calendar || [];
            if (draft.drawsBannerUrl) $set.drawsBannerUrl = draft.drawsBannerUrl;
            if (draft.eventsBannerUrl) $set.eventsBannerUrl = draft.eventsBannerUrl;
            if (draft.playlistsBannerUrl) $set.playlistsBannerUrl = draft.playlistsBannerUrl;
            $set.draft = { active: false, newDraws: [], returningDraws: [], calendar: [] };
            await SeasonalData.updateOne(DOC, { $set }, { session });
            const newTitle = $set.currentSeasonTitle || before.currentSeasonTitle;
            let patchPrior = null;
            if (draft.currentSeasonTitle && before.patchNotes.length > 0) {
                const last = before.patchNotes[before.patchNotes.length - 1];
                patchPrior = { elementId: String(last._id), title: last.title };
                await SeasonalData.updateOne({ ...DOC, 'patchNotes._id': last._id }, { $set: { 'patchNotes.$.title': newTitle } }, { session });
            }
            return {
                ok: true,
                change: { action: 'promote', model: 'SeasonalData', target: newTitle, summary: `Promoted draft to live: "${newTitle}"` },
                applied: { prior, patchPrior }
            };
        },
        invert: (c) => ({ type: 'season.restoreSnapshot', payload: { ...c.applied.prior, ...(c.applied.patchPrior ? { __patchTitleRestore: c.applied.patchPrior } : {}) } })
    },

    // Not a registry action -- exists solely as promoteDraft's/startNew's inverse. Symmetric: its own apply() snapshots exactly the top-level fields it is about to overwrite (plus, optionally, one patch-notes title) and its invert() hands back another restoreSnapshot carrying that snapshot -- so reverting a revert stays correctly revertible without a second op type.
    'season.restoreSnapshot': {
        tier: 3,
        validate: (op) => (op.payload && typeof op.payload === 'object') ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['Nothing to restore.'] },
        preview: (op, live) => ({ before: {}, after: op.payload }),
        apply: async (op, { session }) => {
            const { __patchTitleRestore, ...fields } = op.payload;
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const prior = {};
            for (const key of Object.keys(fields)) prior[key] = before[key];
            if (Object.keys(fields).length) await SeasonalData.updateOne(DOC, { $set: fields }, { session });
            let patchPrior = null;
            if (__patchTitleRestore) {
                const last = before.patchNotes.find(p => String(p._id) === __patchTitleRestore.elementId);
                if (last) {
                    patchPrior = { elementId: __patchTitleRestore.elementId, title: last.title };
                    await SeasonalData.updateOne({ ...DOC, 'patchNotes._id': __patchTitleRestore.elementId }, { $set: { 'patchNotes.$.title': __patchTitleRestore.title } }, { session });
                }
            }
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'season snapshot', summary: 'Restored a prior season snapshot' },
                applied: { prior, patchPrior }
            };
        },
        invert: (c) => ({ type: 'season.restoreSnapshot', payload: { ...c.applied.prior, ...(c.applied.patchPrior ? { __patchTitleRestore: c.applied.patchPrior } : {}) } })
    },

    'season.discardDraft': {
        action: 'seasondraft:discard', tier: 2,
        validate: () => ({ ok: true, errors: [], normalized: {} }),
        preview: (op, live) => ({ before: { active: !!live.draft?.active }, after: { active: false } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select('draft').lean().session(session);
            const draft = before.draft || { active: false, newDraws: [], returningDraws: [], calendar: [] };
            await SeasonalData.updateOne(DOC, { $set: { draft: { active: false, newDraws: [], returningDraws: [], calendar: [] } } }, { session });
            return {
                ok: true,
                change: { action: 'discard', model: 'SeasonalData', target: 'draft', summary: 'Discarded the staged season draft' },
                applied: { draft }
            };
        },
        invert: (c) => ({ type: 'season.restoreDraft', payload: { draft: c.applied.draft } })
    },

    // Not a registry action -- exists solely as discardDraft's inverse. Self-symmetric, same pattern as season.restoreSnapshot.
    'season.restoreDraft': {
        tier: 2,
        validate: (op) => op.payload?.draft ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['Nothing to restore.'] },
        preview: (op, live) => ({ before: { active: !!live.draft?.active }, after: { active: !!op.payload.draft.active } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select('draft').lean().session(session);
            const priorDraft = before.draft || { active: false, newDraws: [], returningDraws: [], calendar: [] };
            await SeasonalData.updateOne(DOC, { $set: { draft: op.payload.draft } }, { session });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'draft', summary: 'Restored the staged season draft' },
                applied: { draft: priorDraft }
            };
        },
        invert: (c) => ({ type: 'season.restoreDraft', payload: { draft: c.applied.draft } })
    },

    // ⚠️ MISSING FROM THE PLAN ENTIRELY -- see the header note. Stages titles/deadlines into seasonalDoc.draft.* rather than the live top-level fields; never touches patch notes.
    'season.setDraftTitlesDeadlines': {
        action: 'seasondraft:settitles', tier: 1,
        validate: (op) => ({ ok: true, errors: [], normalized: op }),
        preview: (op, live) => ({ before: { active: !!live.draft?.active }, after: { active: true } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select('draft').lean().session(session);
            const draft = before.draft || {};
            const prior = { ...draft };
            const mainTitle = (op.payload.mainTitle || '').trim();
            const skipped = [];
            const bp = applyLine({ title: draft.bpTitle || 'Battle Pass', end: draft.bpEnd, endTBD: draft.bpEndTBD }, op.payload.bpLine, 'Battle Pass', skipped);
            const rank = applyLine({ title: draft.rankTitle || 'Ranked Series', end: draft.rankEnd, endTBD: draft.rankEndTBD }, op.payload.rankLine, 'Ranked', skipped);
            const dmz = applyLine({ title: draft.dmzTitle || 'DMZ Season', end: draft.dmzEnd, endTBD: draft.dmzEndTBD }, op.payload.dmzLine, 'DMZ', skipped);
            const $set = {
                'draft.active': true,
                ...(mainTitle ? { 'draft.currentSeasonTitle': mainTitle } : {}),
                'draft.bpTitle': bp.title, 'draft.rankTitle': rank.title, 'draft.dmzTitle': dmz.title,
                'draft.bpEnd': bp.end, 'draft.rankEnd': rank.end, 'draft.dmzEnd': dmz.end,
                'draft.bpEndTBD': bp.endTBD, 'draft.rankEndTBD': rank.endTBD, 'draft.dmzEndTBD': dmz.endTBD
            };
            await SeasonalData.updateOne(DOC, { $set }, { session });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'draft titles/deadlines', summary: 'Staged draft titles & deadlines',
                          detail: skipped.length ? `Date not understood, left unchanged: ${skipped.join(', ')}` : undefined },
                applied: { prior }
            };
        },
        invert: (c) => ({ type: 'season.restoreDraft', payload: { draft: c.applied.prior } })
    },

    // ⚠️ MISSING FROM THE PLAN ENTIRELY -- see the header note. Both fields independently optional (blank = leave that half of the draft untouched), same convention as draws' own bulk-both modal.
    'season.bulkDraftDraws': {
        action: 'seasondraft:bulkdraws', tier: 2,
        validate: (op) => {
            if (!op.payload?.newText && !op.payload?.returningText && !op.payload?.parsed) {
                return { ok: false, errors: ['Both fields were left blank -- nothing was changed.'] };
            }
            return { ok: true, errors: [], normalized: op };
        },
        preview: (op, live) => ({ before: { new: live.draft?.newDraws?.length || 0, returning: live.draft?.returningDraws?.length || 0 }, after: {} }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select('draft').lean().session(session);
            const draft = before.draft || {};
            const prior = { newDraws: draft.newDraws || [], returningDraws: draft.returningDraws || [] };
            const $set = { 'draft.active': true };
            const summary = [];
            if (op.payload.parsed) {
                // an inverse -- restore both fields verbatim, no re-parsing/re-resolving thumbnails.
                if (op.payload.parsed.newDraws) $set['draft.newDraws'] = op.payload.parsed.newDraws;
                if (op.payload.parsed.returningDraws) $set['draft.returningDraws'] = op.payload.parsed.returningDraws;
            } else {
                if (op.payload.newText) {
                    const { validDraws } = await resolveThumbnailsForDraws(parseBulkDrawList(op.payload.newText));
                    validDraws.sort((a, b) => new Date(a.date) - new Date(b.date));
                    $set['draft.newDraws'] = validDraws;
                    summary.push(`New Draws: staged ${validDraws.length}`);
                }
                if (op.payload.returningText) {
                    const { validDraws } = await resolveThumbnailsForDraws(parseBulkDrawList(op.payload.returningText));
                    validDraws.sort((a, b) => new Date(a.date) - new Date(b.date));
                    $set['draft.returningDraws'] = validDraws;
                    summary.push(`Returning Draws: staged ${validDraws.length}`);
                }
            }
            await SeasonalData.updateOne(DOC, { $set }, { session });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'draft draws', summary: 'Staged draft draws', detail: summary.join(' | ') || undefined },
                applied: { prior }
            };
        },
        invert: (c) => ({ type: 'season.bulkDraftDraws', payload: { parsed: c.applied.prior } })
    },

    // ⚠️ MISSING FROM THE PLAN ENTIRELY -- see the header note. Always replaces the whole draft calendar wholesale (unlike the live calendar's merge-based Replace) -- there is no separate add/replace distinction for the draft, matching the real single bulkDraftCalendar handler.
    'season.bulkDraftCalendar': {
        action: 'seasondraft:bulkcalendar', tier: 2,
        validate: (op) => {
            if (op.payload?.parsed) return { ok: true, errors: [], normalized: op };
            const parsed = parseBulkEvents(op.payload.text || '');
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed: mapParsedEvents(parsed) } } };
        },
        preview: (op, live) => ({ before: { count: live.draft?.calendar?.length || 0 }, after: { count: op.payload.parsed.length } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select('draft').lean().session(session);
            const prior = before.draft?.calendar || [];
            const sorted = [...op.payload.parsed].sort((a, b) => new Date(a.date) - new Date(b.date));
            await SeasonalData.updateOne(DOC, { $set: { 'draft.calendar': sorted, 'draft.active': true } }, { session });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'draft calendar', summary: `Staged ${sorted.length} draft calendar event(s)` },
                applied: { prior }
            };
        },
        invert: (c) => ({ type: 'season.bulkDraftCalendar', payload: { parsed: c.applied.prior } })
    }
});
