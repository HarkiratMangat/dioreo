// core/ops/season.js
//
// Season lifecycle mutations, the highest blast radius in the system.
//
// ⚠️ AUDITED AGAINST THE REAL HANDLER (handlers/manage/season.js) AND THE REAL REGISTRY (utils/manageActions.js's SEASONDRAFT_ACTIONS), not transcribed from the plan document. The plan's own Interfaces line names FOUR op types (setTitlesDeadlines/promoteDraft/discardDraft/startNew) -- it is missing THREE real, registered mutating actions entirely: `seasondraft:settitles`, `seasondraft:bulkdraws`, `seasondraft:bulkcalendar` (handlers/manage/season.js's setDraftTitlesDeadlines/bulkDraftDraws/bulkDraftCalendar), which stage the next-season draft BEFORE Promote/Discard ever run. Because these three ARE real ACTIONS_BY_PAGE.seasondraft entries, Task 7's own conservation test ("every mutating action on every page resolves to an op") would have failed the moment it actually ran against a plan built only from the Interfaces line -- the gap was only visible by reading the real handler and the real registry side by side, not either alone.
//
// ⚠️ A rotation (promoteDraft/startNew) is inverted by a FULL PRE-ROTATION SNAPSHOT via the internal `season.restoreSnapshot` op, never a diff -- a diff of a multi-field, multi-array rotation is not a restore. restoreSnapshot is symmetric (its own apply() snapshots what it's about to overwrite and its invert() returns another restoreSnapshot carrying that snapshot), so it stays revertible indefinitely without needing a second op type for "undo of an undo".
const { registerEntity } = require('./index');
const { splitTitleDate, parseAdminDate, parseAdminDateRange, parseBulkDrawList, parseBulkEvents } = require('../../utils/adminParser');
const { resolveThumbnailsForDraws } = require('../../utils/bulkMerge');
const { seasonEntryIndex } = require('../../commands/patchnotes');
const { syncPatchEntryMetadata } = require('../../utils/patchNotesCache');
const { cleanPatchTitle } = require('../../commands/patchnotes');
const SeasonalData = require('../../models/SeasonalData');
const { splitSeasonEmoji } = require('../../utils/seasonEmoji');

const DOC = { docType: 'global' };

// Shared by setTitlesDeadlines (live) and setDraftTitlesDeadlines (staged) -- each of the 3 deadline fields carries both a title and an end date on one line ("Battle Pass, August 28"). A blank line leaves that title+date pair untouched; typing the literal word "TBD" sets the TBD flag and nulls the date (the L194 bug this guards against: a TBD typo silently becoming a real date). A RANGE sets the start too ("Battle Pass, Aug 6 - Nov 17", 2026-10-21 10:17 EDT, for /season end's progress bar). A single date clears the start: the box pre-fills the range whenever a start is stored, so a submitted single date means it was deleted. `loneDate` decides what one date on its own means. Live ("Edit Titles & Deadlines"): the END, a deadline. Draft: the START, with the end TBD, because next season's start is the date known first (Harkirat, 2026-11-08 10:54 EST: "i put november 12 only, no end date. and it assumed it as the end date instead of the start date").
function applyLine(current, line, label, skipped, { loneDate = 'end' } = {}) {
    const { title, dateStr } = splitTitleDate(line || '');
    const result = { title: current.title, start: current.start, end: current.end, endTBD: current.endTBD };
    if (title) result.title = title;
    if (dateStr) {
        const range = parseAdminDateRange(dateStr);
        if (range) {
            Object.assign(result, range);
        } else if (dateStr.trim().toLowerCase() === 'tbd') {
            result.end = null; result.endTBD = true; result.start = null;
        } else {
            const parsed = parseAdminDate(dateStr);
            if (parsed && loneDate === 'start') { result.start = parsed; result.end = null; result.endTBD = true; }
            else if (parsed) { result.end = parsed; result.endTBD = false; result.start = null; }
            else skipped.push(label);
        }
    }
    return result;
}

// 🔴 THE PORTAL'S IDENTITY EDITOR WROTE NOTHING, SILENTLY, ON EVERY FIELD. applyLine reads the Discord modal's one-line-per-deadline format ("Battle Pass 7 | Sep 10"), and the portal composes discrete fields — currentSeasonTitle, bpTitle, bpEnd, bpEndTBD — because a web form with three inputs is not a modal with one textarea. It sent those keys straight through as the payload, so `op.payload.bpLine` was undefined for every line, applyLine returned `current` unchanged for all three, and `(op.payload.mainTitle || '')` fell back to the existing title. The op validated, the changeset staged, Review showed it, committing it applied EXACTLY NOTHING, and every surface reported success. Nothing could catch it: validate() passes anything, preview() reads mainTitle and so agreed with the no-op, and no test exercised the caller's payload against the op's reader.
//
// ⚠️ ADDITIVE, AND THE LINE PATH IS UNTOUCHED. Discord still sends lines and still behaves identically; a field payload simply takes precedence when one is present. Making the portal build "title | date" strings instead would have put a parser between a form and a field that already has the value, and would break on any title containing the separator.
function applyFields(current, payload, prefix, line, label, skipped, opts = {}) {
    const tKey = `${prefix}Title`, eKey = `${prefix}End`, bKey = `${prefix}EndTBD`, sKey = `${prefix}Start`;
    const hasFields = payload && (payload[tKey] !== undefined || payload[eKey] !== undefined || payload[bKey] !== undefined || payload[sKey] !== undefined);
    if (!hasFields) return applyLine(current, line, label, skipped, opts);

    const out = { title: current.title, start: current.start, end: current.end, endTBD: current.endTBD };
    // The start date (2026-10-21 10:17 EDT) as its own field, for a form like the portal's. Blank clears it; an unparseable one is reported, as the end is.
    if (payload[sKey] !== undefined) {
        const raw = payload[sKey];
        if (!raw) out.start = null;
        else if (raw instanceof Date) out.start = raw;
        else { const parsed = parseAdminDate(String(raw)); if (parsed) out.start = parsed; else skipped.push(`${label} start`); }
    }
    if (payload[tKey] !== undefined) out.title = String(payload[tKey]).trim() || current.title;
    // TBD is resolved BEFORE the date, because they contradict each other and the toggle is the more explicit statement: a form that submits both is saying "no date yet", not "this date, and also no date".
    if (payload[bKey] !== undefined) { out.endTBD = Boolean(payload[bKey]); if (out.endTBD) out.end = null; }
    if (payload[eKey] !== undefined && !out.endTBD) {
        const raw = payload[eKey];
        if (!raw) { out.end = null; }
        else {
            const parsed = parseAdminDate(String(raw));
            // An unparseable date is REPORTED, never silently kept as the old one -- that is the failure mode this whole comment is about.
            if (parsed) { out.end = parsed; out.endTBD = false; } else skipped.push(label);
        }
    }
    return out;
}

// THE SEASON'S EMOJI (2026-10-19 09:30 EDT, Harkirat: "can I just input the <emoji:id> infront of the season title?"). A custom emoji typed in front of the title is split off into its own field, so the title stays plain text everywhere it is read. Discord's modal pre-fills emoji + title, so a title submitted through it (`mainTitle`) with no emoji in front means the emoji was deleted, and it clears. The portal sends `currentSeasonTitle` and has no emoji box, so its edit keeps the stored one unless it types one or sends `currentSeasonEmoji` itself.
function readSeasonTitle(payload, currentEmoji) {
    const { emoji, title } = splitSeasonEmoji(payload.mainTitle || payload.currentSeasonTitle || '');
    let next = emoji || (payload.mainTitle ? '' : currentEmoji || '');
    if (payload.currentSeasonEmoji !== undefined) next = String(payload.currentSeasonEmoji || '').trim();
    return { title, emoji: next };
}

function mapParsedEvents(parsed) {
    return parsed.map(e => ({ title: e.title, date: e.startDate, endDate: e.isOngoing ? null : e.endDate, isOngoing: e.isOngoing, category: e.category }));
}

registerEntity('season', {
    'season.setTitlesDeadlines': {
        action: 'season:titlesdeadlines', tier: 1,
        validate: (op) => ({ ok: true, errors: [], normalized: op }),
        // ⚠️ THE PREVIEW HAS TO READ THE SAME KEYS APPLY DOES. It read only mainTitle, so it agreed with the broken no-op and the Review screen showed "Season title: unchanged" — the one surface whose entire job is saying what a commit will do, confirming that it would do nothing.
        preview: (op, live) => ({ before: { title: live.currentSeasonTitle }, after: { title: readSeasonTitle(op.payload, live.currentSeasonEmoji).title || live.currentSeasonTitle } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const prior = {
                currentSeasonTitle: before.currentSeasonTitle, currentSeasonEmoji: before.currentSeasonEmoji || '', bpTitle: before.bpTitle, rankTitle: before.rankTitle, dmzTitle: before.dmzTitle,
                bpEnd: before.bpEnd, rankEnd: before.rankEnd, dmzEnd: before.dmzEnd,
                bpStart: before.bpStart || null, rankStart: before.rankStart || null, dmzStart: before.dmzStart || null,
                bpEndTBD: before.bpEndTBD, rankEndTBD: before.rankEndTBD, dmzEndTBD: before.dmzEndTBD
            };
            // `currentSeasonTitle` beside `mainTitle` for the same reason as the lines: the portal's field is named after the schema, Discord's modal field is named after the sentence it reads as.
            const typed = readSeasonTitle(op.payload, before.currentSeasonEmoji);
            const currentSeasonTitle = typed.title || before.currentSeasonTitle;
            const currentSeasonEmoji = typed.emoji;
            const skipped = [];
            const bp = applyFields({ title: before.bpTitle, start: before.bpStart || null, end: before.bpEnd, endTBD: before.bpEndTBD }, op.payload, 'bp', op.payload.bpLine, 'Battle Pass', skipped);
            const rank = applyFields({ title: before.rankTitle, start: before.rankStart || null, end: before.rankEnd, endTBD: before.rankEndTBD }, op.payload, 'rank', op.payload.rankLine, 'Ranked', skipped);
            const dmz = applyFields({ title: before.dmzTitle, start: before.dmzStart || null, end: before.dmzEnd, endTBD: before.dmzEndTBD }, op.payload, 'dmz', op.payload.dmzLine, 'DMZ', skipped);
            const $set = {
                currentSeasonTitle, currentSeasonEmoji, bpTitle: bp.title, rankTitle: rank.title, dmzTitle: dmz.title,
                bpEnd: bp.end, rankEnd: rank.end, dmzEnd: dmz.end, bpEndTBD: bp.endTBD, rankEndTBD: rank.endTBD, dmzEndTBD: dmz.endTBD,
                bpStart: bp.start, rankStart: rank.start, dmzStart: dmz.start
            };
            await SeasonalData.updateOne(DOC, { $set }, { session });
            let patchPrior = null;
            const titleChanged = currentSeasonTitle !== before.currentSeasonTitle;
            // The emoji rides the same sync as the title, and an emoji-only edit syncs too: the current entry is what /patch notes shows, so it shows this season's emoji.
            if (before.patchNotes.length > 0 && (titleChanged || currentSeasonEmoji !== (before.currentSeasonEmoji || ''))) {
                const last = before.patchNotes[before.patchNotes.length - 1];
                patchPrior = { elementId: String(last._id), title: last.title, emoji: last.emoji || '' };
                await SeasonalData.updateOne({ ...DOC, 'patchNotes._id': last._id }, { $set: { 'patchNotes.$.title': currentSeasonTitle, 'patchNotes.$.emoji': currentSeasonEmoji } }, { session });
                // The pre-core handler always re-synced the latest patch entry's cached-image Cloudinary metadata after a title rename -- missed on a first pass of this op (DB field updates fine; only the Cloudinary-side metadata would have gone stale). Best-effort, matching the original's own no-throw contract.
                if (titleChanged) await syncPatchEntryMetadata({ ...last, title: currentSeasonTitle }, cleanPatchTitle(currentSeasonTitle));
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
        // An emoji typed in front of the new season's title is split off the same way as an edit's; a new season with none typed starts with none, never the old season's.
        validate: (op) => splitSeasonEmoji(op.payload?.newTitle).title ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['A new season needs a title.'] },
        preview: (op, live) => ({
            before: { title: live.currentSeasonTitle, draws: live.newDraws.length + live.returningDraws.length, events: live.calendar.length },
            after: { title: splitSeasonEmoji(op.payload.newTitle).title, draws: 0, events: 0 }
        }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const prior = { currentSeasonTitle: before.currentSeasonTitle, currentSeasonEmoji: before.currentSeasonEmoji || '', newDraws: before.newDraws, returningDraws: before.returningDraws, calendar: before.calendar };
            const { title: newTitle, emoji } = splitSeasonEmoji(op.payload.newTitle);
            await SeasonalData.updateOne(DOC, { $set: { currentSeasonTitle: newTitle, currentSeasonEmoji: emoji, newDraws: [], returningDraws: [], calendar: [] } }, { session });
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
                currentSeasonTitle: before.currentSeasonTitle, currentSeasonEmoji: before.currentSeasonEmoji || '', bpTitle: before.bpTitle, rankTitle: before.rankTitle, dmzTitle: before.dmzTitle,
                bpEnd: before.bpEnd, rankEnd: before.rankEnd, dmzEnd: before.dmzEnd,
                bpStart: before.bpStart || null, rankStart: before.rankStart || null, dmzStart: before.dmzStart || null,
                bpEndTBD: before.bpEndTBD, rankEndTBD: before.rankEndTBD, dmzEndTBD: before.dmzEndTBD,
                newDraws: before.newDraws, returningDraws: before.returningDraws, calendar: before.calendar,
                drawsBannerUrl: before.drawsBannerUrl, eventsBannerUrl: before.eventsBannerUrl, playlistsBannerUrl: before.playlistsBannerUrl,
                // The staged draft too (found 2026-11-07 22:00 EST, round-tripping Promote and its Revert on the dev bot): Promote clears the draft below, and a snapshot without it put the live season back but lost everything that had been staged. restoreSnapshot sets whatever top-level fields it is given, so carrying `draft` is all a Revert needs. Rows recorded before this have no `draft` and restore as they always did.
                draft: before.draft || { active: false, newDraws: [], returningDraws: [], calendar: [] }
            };
            const $set = {};
            // The draft's emoji goes live WITH its title, blank included: a new season never keeps the old one's emoji.
            if (draft.currentSeasonTitle) { $set.currentSeasonTitle = draft.currentSeasonTitle; $set.currentSeasonEmoji = draft.currentSeasonEmoji || ''; }
            if (draft.bpTitle) $set.bpTitle = draft.bpTitle;
            if (draft.rankTitle) $set.rankTitle = draft.rankTitle;
            if (draft.dmzTitle) $set.dmzTitle = draft.dmzTitle;
            // A blank end goes live blank, like a blank start below (Harkirat, 2026-11-04 12:25 EST: "go" on clearing them): before, the new season kept the old season's end, already past, so a Battle Pass could start after it ended. The TBD flag is checked BEFORE the date -- a plain truthy check on bpEnd would silently skip promoting a TBD deadline, since TBD leaves draft.bpEnd explicitly null.
            if (draft.bpEndTBD) { $set.bpEnd = null; $set.bpEndTBD = true; } else if (draft.bpEnd) { $set.bpEnd = draft.bpEnd; $set.bpEndTBD = false; } else { $set.bpEnd = null; $set.bpEndTBD = false; }
            if (draft.rankEndTBD) { $set.rankEnd = null; $set.rankEndTBD = true; } else if (draft.rankEnd) { $set.rankEnd = draft.rankEnd; $set.rankEndTBD = false; } else { $set.rankEnd = null; $set.rankEndTBD = false; }
            if (draft.dmzEndTBD) { $set.dmzEnd = null; $set.dmzEndTBD = true; } else if (draft.dmzEnd) { $set.dmzEnd = draft.dmzEnd; $set.dmzEndTBD = false; } else { $set.dmzEnd = null; $set.dmzEndTBD = false; }
            // The starts go live with the draft, blank included: a new season never keeps the old one's start, or its bar would count from the wrong day.
            $set.bpStart = draft.bpStart || null; $set.rankStart = draft.rankStart || null; $set.dmzStart = draft.dmzStart || null;
            // In date order (2026-11-08 11:30 EST, a click-walk of /manage season draft on a copy of prod): /draws shows its lists in stored order and every draw op re-sorts after a write, but the draft is filled by carry-over and news triage in arrival order, so promoting it as it was put Samurai's Soul (Nov 1) after Ultra Violet (Nov 6).
            const byDate = (rows) => [...(rows || [])].sort((x, y) => new Date(x.date || 0) - new Date(y.date || 0));
            $set.newDraws = byDate(draft.newDraws);
            $set.returningDraws = byDate(draft.returningDraws);
            $set.calendar = byDate(draft.calendar);
            if (draft.drawsBannerUrl) $set.drawsBannerUrl = draft.drawsBannerUrl;
            if (draft.eventsBannerUrl) $set.eventsBannerUrl = draft.eventsBannerUrl;
            if (draft.playlistsBannerUrl) $set.playlistsBannerUrl = draft.playlistsBannerUrl;
            $set.draft = { active: false, newDraws: [], returningDraws: [], calendar: [] };
            await SeasonalData.updateOne(DOC, { $set }, { session });
            // Post-promote counts -- the handler's confirmation reports what's now LIVE, and `prior` above only carries the pre-promote snapshot needed for the inverse.
            const counts = { newDraws: $set.newDraws.length, returningDraws: $set.returningDraws.length, calendar: $set.calendar.length };
            const newTitle = $set.currentSeasonTitle || before.currentSeasonTitle;
            let patchPrior = null;
            const last = before.patchNotes[before.patchNotes.length - 1];
            if (draft.currentSeasonTitle && last) {
                patchPrior = { elementId: String(last._id), title: last.title, emoji: last.emoji || '' };
                await SeasonalData.updateOne({ ...DOC, 'patchNotes._id': last._id }, { $set: { 'patchNotes.$.title': newTitle, 'patchNotes.$.emoji': $set.currentSeasonEmoji } }, { session });
            }
            // The outgoing season keeps its Battle Pass dates on its own patch-notes entry (2026-10-28, Harkirat: "The BP start/end is the season start/end"), since the top-level bpStart/bpEnd now belong to the new season and /patch notes' dropdown would otherwise only have release dates for it. Its end is its Battle Pass end, else (TBD) the new season's start, else today. Skipped when that entry is the one just renamed to the new season above: it is the new season now.
            let datesPrior = null;
            const outgoingAt = seasonEntryIndex([...before.patchNotes].reverse(), before.currentSeasonTitle);
            const outgoing = outgoingAt === -1 ? null : before.patchNotes[before.patchNotes.length - 1 - outgoingAt];
            if (outgoing && before.bpStart && !(patchPrior && String(outgoing._id) === patchPrior.elementId)) {
                const seasonEnd = (!before.bpEndTBD && before.bpEnd) || draft.bpStart || new Date();
                datesPrior = { elementId: String(outgoing._id), seasonStart: outgoing.seasonStart || null, seasonEnd: outgoing.seasonEnd || null };
                await SeasonalData.updateOne({ ...DOC, 'patchNotes._id': outgoing._id }, { $set: { 'patchNotes.$.seasonStart': before.bpStart, 'patchNotes.$.seasonEnd': seasonEnd } }, { session });
            }
            return {
                ok: true,
                change: { action: 'promote', model: 'SeasonalData', target: newTitle, summary: `Promoted draft to live: "${newTitle}"` },
                applied: { prior, patchPrior, datesPrior, counts }
            };
        },
        invert: (c) => ({ type: 'season.restoreSnapshot', payload: { ...c.applied.prior, ...(c.applied.patchPrior ? { __patchTitleRestore: c.applied.patchPrior } : {}), ...(c.applied.datesPrior ? { __patchDatesRestore: c.applied.datesPrior } : {}) } })
    },

    // Not a registry action -- exists solely as promoteDraft's/startNew's inverse. Symmetric: its own apply() snapshots exactly the top-level fields it is about to overwrite (plus, optionally, one patch-notes title) and its invert() hands back another restoreSnapshot carrying that snapshot -- so reverting a revert stays correctly revertible without a second op type.
    'season.restoreSnapshot': {
        page: 'season', tier: 3,
        validate: (op) => (op.payload && typeof op.payload === 'object') ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['Nothing to restore.'] },
        preview: (op, live) => ({ before: {}, after: op.payload }),
        apply: async (op, { session }) => {
            const { __patchTitleRestore, __patchDatesRestore, ...fields } = op.payload;
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const prior = {};
            for (const key of Object.keys(fields)) prior[key] = before[key];
            if (Object.keys(fields).length) await SeasonalData.updateOne(DOC, { $set: fields }, { session });
            let patchPrior = null;
            if (__patchTitleRestore) {
                const last = before.patchNotes.find(p => String(p._id) === __patchTitleRestore.elementId);
                if (last) {
                    // `emoji` only when the record carries one: a restore recorded before the season emoji existed (2026-10-19 09:30 EDT) restores the title alone, as it always did.
                    const hasEmoji = __patchTitleRestore.emoji !== undefined;
                    patchPrior = { elementId: __patchTitleRestore.elementId, title: last.title, ...(hasEmoji ? { emoji: last.emoji || '' } : {}) };
                    await SeasonalData.updateOne({ ...DOC, 'patchNotes._id': __patchTitleRestore.elementId }, { $set: { 'patchNotes.$.title': __patchTitleRestore.title, ...(hasEmoji ? { 'patchNotes.$.emoji': __patchTitleRestore.emoji } : {}) } }, { session });
                }
            }
            // The outgoing season's dates that Promote to Live saved on its entry (2026-10-28), put back the same way.
            let datesPrior = null;
            if (__patchDatesRestore) {
                const entry = before.patchNotes.find(p => String(p._id) === __patchDatesRestore.elementId);
                if (entry) {
                    datesPrior = { elementId: __patchDatesRestore.elementId, seasonStart: entry.seasonStart || null, seasonEnd: entry.seasonEnd || null };
                    await SeasonalData.updateOne({ ...DOC, 'patchNotes._id': __patchDatesRestore.elementId }, { $set: { 'patchNotes.$.seasonStart': __patchDatesRestore.seasonStart, 'patchNotes.$.seasonEnd': __patchDatesRestore.seasonEnd } }, { session });
                }
            }
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'season snapshot', summary: 'Restored a prior season snapshot' },
                applied: { prior, patchPrior, datesPrior }
            };
        },
        invert: (c) => ({ type: 'season.restoreSnapshot', payload: { ...c.applied.prior, ...(c.applied.patchPrior ? { __patchTitleRestore: c.applied.patchPrior } : {}), ...(c.applied.datesPrior ? { __patchDatesRestore: c.applied.datesPrior } : {}) } })
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
        page: 'seasondraft', tier: 2,
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

    // The Promote pop-up's "Auto-promote at the Battle Pass start" (2026-11-08 12:09 EST). Sets or clears draft.autoPromote; utils/autoPromote.js does the promoting. Not a /manage action of its own (it rides on the Promote pop-up, gated as promote), so it declares page:. Its own inverse.
    'season.setAutoPromote': {
        page: 'seasondraft', tier: 3,
        validate: (op) => ({ ok: true, errors: [], normalized: { ...op, payload: { on: Boolean(op.payload?.on), by: String(op.payload?.by || '') } } }),
        preview: (op, live) => ({ before: { autoPromote: !!live.draft?.autoPromote }, after: { autoPromote: !!op.payload.on } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select('draft').lean().session(session);
            const d = before?.draft || {};
            if (op.payload.on && (!d.active || !d.bpStart)) return { ok: false, reason: 'invalid', errors: ['The draft has no Battle Pass start to promote at.'] };
            await SeasonalData.updateOne(DOC, { $set: { 'draft.autoPromote': op.payload.on, 'draft.autoPromoteBy': op.payload.on ? op.payload.by : '' } }, { session });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'draft', summary: op.payload.on ? 'Set the draft to promote at the Battle Pass start' : 'Cancelled the draft\'s auto-promote' },
                applied: { prev: { on: !!d.autoPromote, by: d.autoPromoteBy || '' } }
            };
        },
        invert: (c) => ({ type: 'season.setAutoPromote', payload: c.applied.prev })
    },

    // News triage's automatic Next Season Draft writes (utils/newsTriage/draftMerge.js, Harkirat's "yeah" to auto-filling the draft, 2026-11-04 23:59 EST). Not a /manage action, so it declares page:. The changes are planned outside the transaction and re-checked row by row inside it (applyDraftChanges skips a row edited since), and the op is its own inverse: forward applies the changes, reverse undoes them by id.
    'season.newsDraft': {
        page: 'seasondraft', tier: 1,
        // Three forward shapes: `plan` (a post's items, planned HERE against the draft read in this transaction, so a read that took minutes cannot plan against a stale copy; 2026-11-05 15:33 EST), `carry` (carry-over, planned here against the live lists), or `changes` (a replayed redo). `reverse` undoes by id, and is refused when the draft has moved to another season since (draftMerge.js undoAllowed).
        validate: (op) => (op.payload?.plan || op.payload?.carry || (Array.isArray(op.payload?.changes) && (op.payload.changes.length || op.payload.reverse)))
            ? { ok: true, errors: [], normalized: op }
            : { ok: false, errors: ['Nothing to draft.'] },
        preview: (op, live) => ({ before: { active: !!live.draft?.active }, after: { active: true } }),
        apply: async (op, { session }) => {
            const M = require('../../utils/newsTriage/draftMerge');
            const before = await SeasonalData.findOne(DOC).select('draft calendar newDraws returningDraws').lean().session(session);
            const draft = JSON.parse(JSON.stringify(before?.draft || {}));
            let applied; let names;
            if (op.payload.reverse) {
                if (!M.undoAllowed(draft, op.payload.after)) return { ok: false, reason: 'the Next Season Draft has moved to another season since this change, so undoing it would write last season into it. Change the rows in /manage instead' };
                const stats = {};
                M.undoDraftChanges(draft, op.payload.undo || {}, stats);
                // Every row it wrote was changed since: say so, rather than report an Undo that changed nothing (the fresh review R1).
                if (!stats.restored && stats.kept) return { ok: false, reason: 'every row this change wrote has been changed since (in /manage or by a later post), so there is nothing left to undo' };
                applied = { reversed: true, changes: op.payload.changes };
                names = 'Undid news triage\'s draft changes';
            } else {
                let changes = op.payload.changes || []; let notes = []; let needsBox = [];
                if (op.payload.plan) {
                    const P = op.payload.plan;
                    const plan = M.planDraftChanges(draft, P.items || [], P.post || {}, { skipKinds: P.skipKinds });
                    changes = plan.changes; notes = plan.notes; needsBox = plan.needsBox.map(i => i.name);
                }
                if (op.payload.carry) changes = M.planCarryOver(draft, before || {}).changes;
                const r = M.applyDraftChanges(draft, changes);
                applied = { undo: r.undo, changes: r.applied, after: M.afterOf(draft), notes, needsBox };
                names = r.applied.length ? `News triage drafted ${[...new Set(r.applied.map(c => c.name))].slice(0, 6).join(', ')}${r.applied.length > 6 ? '…' : ''}` : 'News triage: nothing new to draft';
            }
            const $set = {
                'draft.newDraws': draft.newDraws || [], 'draft.returningDraws': draft.returningDraws || [], 'draft.calendar': draft.calendar || [],
                'draft.active': draft.active === undefined ? true : Boolean(draft.active),
                'draft.currentSeasonTitle': draft.currentSeasonTitle || '', 'draft.bpStart': draft.bpStart || null,
            };
            // The battle pass, ranked and DMZ parts a season post can name (draftMerge.js); written only when present, so an op from before them leaves the fields alone.
            for (const k of ['newsSeasonSet', 'bpTitle', 'rankTitle', 'dmzTitle', 'bpEnd', 'rankEnd', 'dmzEnd', 'rankStart', 'dmzStart', 'bpEndTBD', 'rankEndTBD', 'dmzEndTBD']) if (k in draft) $set[`draft.${k}`] = draft[k];
            await SeasonalData.updateOne(DOC, { $set }, { session });
            return { ok: true, change: { action: 'edit', model: 'SeasonalData', target: 'draft (news)', summary: names }, applied };
        },
        invert: (c) => (c.applied.reversed
            ? { type: 'season.newsDraft', payload: { changes: c.applied.changes } }
            : { type: 'season.newsDraft', payload: { reverse: true, undo: c.applied.undo, changes: c.applied.changes, after: c.applied.after } })
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
            const typed = readSeasonTitle(op.payload, draft.currentSeasonEmoji);
            const mainTitle = typed.title;
            const skipped = [];
            const bp = applyFields({ title: draft.bpTitle || 'Battle Pass', start: draft.bpStart || null, end: draft.bpEnd, endTBD: draft.bpEndTBD }, op.payload, 'bp', op.payload.bpLine, 'Battle Pass', skipped, { loneDate: 'start' });
            const rank = applyFields({ title: draft.rankTitle || 'Ranked Series', start: draft.rankStart || null, end: draft.rankEnd, endTBD: draft.rankEndTBD }, op.payload, 'rank', op.payload.rankLine, 'Ranked', skipped, { loneDate: 'start' });
            const dmz = applyFields({ title: draft.dmzTitle || 'DMZ Season', start: draft.dmzStart || null, end: draft.dmzEnd, endTBD: draft.dmzEndTBD }, op.payload, 'dmz', op.payload.dmzLine, 'DMZ', skipped, { loneDate: 'start' });
            const $set = {
                'draft.active': true,
                ...(mainTitle ? { 'draft.currentSeasonTitle': mainTitle, 'draft.currentSeasonEmoji': typed.emoji } : {}),
                'draft.bpTitle': bp.title, 'draft.rankTitle': rank.title, 'draft.dmzTitle': dmz.title,
                'draft.bpEnd': bp.end, 'draft.rankEnd': rank.end, 'draft.dmzEnd': dmz.end,
                'draft.bpEndTBD': bp.endTBD, 'draft.rankEndTBD': rank.endTBD, 'draft.dmzEndTBD': dmz.endTBD,
                'draft.bpStart': bp.start, 'draft.rankStart': rank.start, 'draft.dmzStart': dmz.start
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
            // A filled box replaces that half of the staged draws wholesale, so text that parses to nothing used to empty it (found 2026-11-04 00:33 EST, /manage audit).
            if (!op.payload.parsed) {
                for (const [label, text] of [['New Draws', op.payload.newText], ['Returning Draws', op.payload.returningText]]) {
                    if (text && !parseBulkDrawList(text)?.length) return { ok: false, errors: [`${label}: nothing in that text parsed as a draw. Check the Bulk Format Guide. The staged draws were not changed.`] };
                }
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
                    // A staged New draw belongs to the DRAFT's season, never the live one (utils/drawCatalog.js insertFields).
                    const { validDraws, skipped } = await resolveThumbnailsForDraws(parseBulkDrawList(op.payload.newText), { releaseSeason: require('../../utils/quickAdd').seasonNumber(draft.currentSeasonTitle), releaseYear: require('../../utils/quickAdd').seasonYear(draft) });
                    validDraws.sort((a, b) => new Date(a.date) - new Date(b.date));
                    $set['draft.newDraws'] = require('../../utils/newsTriage/draftMerge').keepNewsRows(prior.newDraws, validDraws, 'draw');
                    summary.push(`New Draws: staged ${validDraws.length}`);
                    // A draw with no image link and nothing cached is left out, as the live bulk add leaves it out; the live add says so, and the draft stayed silent (found 2026-11-04 00:33 EST).
                    if (skipped.length) summary.push(`New Draws skipped (no image link given and nothing cached yet): ${skipped.join(', ')}`);
                }
                if (op.payload.returningText) {
                    const { validDraws, skipped } = await resolveThumbnailsForDraws(parseBulkDrawList(op.payload.returningText));
                    validDraws.sort((a, b) => new Date(a.date) - new Date(b.date));
                    $set['draft.returningDraws'] = require('../../utils/newsTriage/draftMerge').keepNewsRows(prior.returningDraws, validDraws, 'draw');
                    summary.push(`Returning Draws: staged ${validDraws.length}`);
                    if (skipped.length) summary.push(`Returning Draws skipped (no image link given and nothing cached yet): ${skipped.join(', ')}`);
                }
            }
            await SeasonalData.updateOne(DOC, { $set }, { session });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'draft draws', summary: 'Staged draft draws', detail: summary.join(' | ') || undefined },
                applied: { prior, summary }
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
            // This op REPLACES the whole staged calendar, so text that parses to nothing used to stage an empty list and wipe what was staged, reporting "Staged 0 event(s)" (found 2026-11-04 00:33 EST, /manage audit). Same refusal as calendar.bulkAdd.
            if (!parsed?.length) return { ok: false, errors: ['Nothing in that text parsed as an event. Check the Bulk Format Guide. The staged calendar was not changed.'] };
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed: mapParsedEvents(parsed) } } };
        },
        preview: (op, live) => ({ before: { count: live.draft?.calendar?.length || 0 }, after: { count: op.payload.parsed.length } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select('draft').lean().session(session);
            const prior = before.draft?.calendar || [];
            // A line he left as it was keeps news triage's id and source, so its Undo and later posts still find it (utils/newsTriage/draftMerge.js keepNewsRows).
            const sorted = require('../../utils/newsTriage/draftMerge').keepNewsRows(prior, [...op.payload.parsed].sort((a, b) => new Date(a.date) - new Date(b.date)), 'calendar');
            await SeasonalData.updateOne(DOC, { $set: { 'draft.calendar': sorted, 'draft.active': true } }, { session });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'draft calendar', summary: `Staged ${sorted.length} draft calendar event(s)` },
                applied: { prior, count: sorted.length }
            };
        },
        invert: (c) => ({ type: 'season.bulkDraftCalendar', payload: { parsed: c.applied.prior } })
    }
});

// ⚠️ EXPORTED FOR ONE REASON: apply() needs a Mongo session, so every existing test here reaches only validate() and invert() — which is precisely why a payload the op could not read survived. This is the seam where the portal's field names meet the op's reader, and it is the only part of that path testable without a database. readSeasonTitle for the same reason (2026-10-19 09:30 EDT): it decides whether a submit keeps, sets or clears the season emoji, and apply() is out of reach without a database.
module.exports = { applyFields, readSeasonTitle };
