// ==========================================
// /manage — SEASON (pseudo-page) + SEASON DRAFT PAGE
// ==========================================
// Covers both of the panel's season-transition surfaces: the Season dropdown's two flat entries
// (Titles & Deadlines, Start New Season / "Wipe Season") which open their modal directly with no
// page of their own, and the "Next Season Draft" staging page (seasondraft) -- Promote/Discard plus
// its three bulk-stage modals. Grouped into one file since both are season-lifecycle operations on
// the same SeasonalData document, thematically closer to each other than to any other page. Split
// out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/
// 2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and
// .claude/rules/interaction-router.md.

const { registerUndo, undoButtonRow, prompt, pendingSeasonWipes, loadOrCreateSeasonalDoc } = require('./shared');

// --- START NEW SEASON, STEP 1 --- custom_id: modal_wipe_season
// Used to wipe draws+calendar the INSTANT this modal was submitted -- no confirmation at all, unlike
// every other destructive action in this panel. Now just stashes the entered title in
// pendingSeasonWipes and shows the same Confirm/Cancel step Purge uses -- the actual wipe only
// happens from handleWipeButton below.
async function promptWipeSeason(interaction) {
    const { randomUUID } = require('crypto');
    const newTitle = interaction.fields.getTextInputValue('season_title').trim();
    const token = randomUUID().slice(0, 8);
    pendingSeasonWipes.set(token, { newTitle });
    setTimeout(() => pendingSeasonWipes.delete(token), 10 * 60 * 1000).unref();

    return interaction.reply({
        content: `⚠️ **Are you sure?** This will rename the current season to **${newTitle}** and permanently wipe all Draws and Calendar data (Patch Notes history is kept). This cannot be undone.`,
        components: [{
            type: 1, components: [
                { type: 2, style: 4, label: 'Yes, Start New Season', custom_id: `mng_wipeconfirm_${token}` },
                { type: 2, style: 2, label: 'Cancel', custom_id: `mng_wipecancel_${token}` }
            ]
        }],
        ephemeral: true
    });
}

// --- START NEW SEASON, STEP 2 --- custom_id: mng_wipeconfirm_{token} / mng_wipecancel_{token}
// Snapshots the pre-wipe state so this can be undone -- a season reset is at least as destructive as
// any single Purge and deserves the same safety net.
async function handleWipeButton(interaction) {
    const customId = interaction.customId;

    if (customId.startsWith('mng_wipeconfirm_')) {
        const token = customId.replace('mng_wipeconfirm_', '');
        const pending = pendingSeasonWipes.get(token);
        pendingSeasonWipes.delete(token);
        if (!pending) {
            try {
                await prompt(interaction, { text: '❌ This confirmation has expired -- please start over from the Season dropdown.' });
            } catch (notifyError) {
                console.error('Failed to notify user of expired season-wipe confirmation:', notifyError);
            }
            return;
        }

        const seasonalDoc = await loadOrCreateSeasonalDoc();
        const prevTitle = seasonalDoc.currentSeasonTitle;
        const prevNew = seasonalDoc.newDraws;
        const prevReturning = seasonalDoc.returningDraws;
        const prevCalendar = seasonalDoc.calendar;

        seasonalDoc.currentSeasonTitle = pending.newTitle;
        seasonalDoc.newDraws = [];
        seasonalDoc.returningDraws = [];
        seasonalDoc.calendar = [];
        // Note: patch notes history is deliberately preserved for the dropdown archive.
        await seasonalDoc.save();

        const undoToken = registerUndo(`Start New Season ("${pending.newTitle}")`, async () => {
            const SeasonalData = require('../../models/SeasonalData');
            const doc = await SeasonalData.findOne({ docType: 'global' });
            doc.currentSeasonTitle = prevTitle;
            doc.newDraws = prevNew;
            doc.returningDraws = prevReturning;
            doc.calendar = prevCalendar;
            await doc.save();
        });

        try {
            await prompt(interaction, {
                text: `✅ **Success:** Renamed the season to **${pending.newTitle}** and wiped Draws (${prevNew.length + prevReturning.length} entries) + Calendar (${prevCalendar.length} events). Patch Notes history was kept.`,
                components: [undoButtonRow(undoToken)]
            });
        } catch (notifyError) {
            console.error('Failed to confirm season wipe (interaction likely expired):', notifyError);
        }
        return;
    }

    if (customId.startsWith('mng_wipecancel_')) {
        const token = customId.replace('mng_wipecancel_', '');
        pendingSeasonWipes.delete(token);
        try {
            await prompt(interaction, { text: '❎ Cancelled -- nothing was changed.' });
        } catch (notifyError) {
            console.error('Failed to confirm season-wipe cancellation (interaction likely expired):', notifyError);
        }
        return;
    }
}

// --- SEASON TITLES + DEADLINES (merged) --- custom_id: modal_season_titles_deadlines
// Each of the 3 deadline fields carries both a title and an end date on one line ("Battle Pass,
// August 28"), split apart via adminParser.js's splitTitleDate(). A blank line leaves that
// title+date pair untouched.
async function setTitlesDeadlines(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { splitTitleDate, parseAdminDate } = require('../../utils/adminParser');
    const seasonalDoc = await loadOrCreateSeasonalDoc();

    seasonalDoc.currentSeasonTitle = interaction.fields.getTextInputValue('main_title').trim();

    // Unrecognized date text (e.g. a "TDB" typo for "TBD") returns null rather than silently falling
    // back to the literal current instant, so an unparseable date is treated the same as a blank one
    // (field left untouched) rather than corrupted, and the admin gets told which line was skipped.
    const skippedDates = [];
    // Typing the literal word "TBD" (case-insensitive) is a real, explicit directive -- clears the
    // Date field and sets its matching `${dateField}TBD` flag; seasonend.js/calendar.js both read
    // that flag to show "TBD" and treat the deadline as indefinitely running.
    const applyLine = (line, titleField, dateField, label) => {
        const { title, dateStr } = splitTitleDate(line);
        if (title) seasonalDoc[titleField] = title;
        if (dateStr) {
            if (dateStr.trim().toLowerCase() === 'tbd') {
                seasonalDoc[dateField] = null;
                seasonalDoc[`${dateField}TBD`] = true;
            } else {
                const parsed = parseAdminDate(dateStr);
                if (parsed) {
                    seasonalDoc[dateField] = parsed;
                    seasonalDoc[`${dateField}TBD`] = false;
                } else {
                    skippedDates.push(`${label} ("${dateStr}")`);
                }
            }
        }
    };
    applyLine(interaction.fields.getTextInputValue('bp_line'), 'bpTitle', 'bpEnd', 'Battle Pass');
    applyLine(interaction.fields.getTextInputValue('rank_line'), 'rankTitle', 'rankEnd', 'Ranked');
    applyLine(interaction.fields.getTextInputValue('dmz_line'), 'dmzTitle', 'dmzEnd', 'DMZ');

    // patchNotes[].title is captured independently at "Add Patch Notes" time (so older, past-season
    // entries keep their own historical title forever) -- but the MOST RECENT entry always
    // represents the season that's currently live, so keep it in sync here. Without this, renaming a
    // typo'd season title silently left the current patch notes entry (and therefore the default
    // /patch notes view) showing the old name.
    if (seasonalDoc.patchNotes.length > 0) {
        seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1].title = seasonalDoc.currentSeasonTitle;
    }

    await seasonalDoc.save();
    // The most-recent patch's season title just changed -- re-sync its cached images' Patch_Season
    // metadata to match. Best-effort; keyed by the patch _id, which the rename never touches.
    if (seasonalDoc.patchNotes.length > 0) {
        const { syncPatchEntryMetadata } = require('../../utils/patchNotesCache');
        const { cleanPatchTitle } = require('../../commands/patchnotes');
        const latestPatch = seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1];
        await syncPatchEntryMetadata(latestPatch, cleanPatchTitle(latestPatch.title));
    }
    let confirmation = `✅ **Season Titles & Deadlines Updated!** The \`/season end\` module has been synced.`;
    if (skippedDates.length > 0) confirmation += `\n⚠️ Date not understood, left unchanged: ${skippedDates.join(', ')}.`;
    return interaction.followUp({ content: confirmation });
}

// --- NEXT SEASON DRAFT: PROMOTE / DISCARD --- custom_id: mng_draftpromoteconfirm /
// mng_draftpromotecancel / mng_draftdiscardconfirm / mng_draftdiscardcancel. Promote snapshots the
// pre-swap LIVE values (not the draft) so Undo restores exactly what was live before -- the draft
// itself is simply cleared, not restorable via Undo (it's reachable again the normal way: just
// re-stage it).
async function handleDraftButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'mng_draftpromoteconfirm') {
        const SeasonalData = require('../../models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
        const draft = seasonalDoc.draft || {};
        if (!draft.active) {
            try { await prompt(interaction, { text: '❌ No draft in progress -- nothing to promote.' }); }
            catch (notifyError) { console.error('Failed to notify empty-draft promote attempt:', notifyError); }
            return;
        }
        const prevLive = {
            currentSeasonTitle: seasonalDoc.currentSeasonTitle, bpTitle: seasonalDoc.bpTitle,
            rankTitle: seasonalDoc.rankTitle, dmzTitle: seasonalDoc.dmzTitle,
            bpEnd: seasonalDoc.bpEnd, rankEnd: seasonalDoc.rankEnd, dmzEnd: seasonalDoc.dmzEnd,
            bpEndTBD: seasonalDoc.bpEndTBD, rankEndTBD: seasonalDoc.rankEndTBD, dmzEndTBD: seasonalDoc.dmzEndTBD,
            newDraws: seasonalDoc.newDraws, returningDraws: seasonalDoc.returningDraws, calendar: seasonalDoc.calendar,
            drawsBannerUrl: seasonalDoc.drawsBannerUrl, eventsBannerUrl: seasonalDoc.eventsBannerUrl, playlistsBannerUrl: seasonalDoc.playlistsBannerUrl
        };
        if (draft.currentSeasonTitle) seasonalDoc.currentSeasonTitle = draft.currentSeasonTitle;
        if (draft.bpTitle) seasonalDoc.bpTitle = draft.bpTitle;
        if (draft.rankTitle) seasonalDoc.rankTitle = draft.rankTitle;
        if (draft.dmzTitle) seasonalDoc.dmzTitle = draft.dmzTitle;
        // A `if (draft.bpEnd)` truthy check alone would silently skip promoting a TBD deadline -- TBD
        // leaves draft.bpEnd explicitly null, so the TBD flag has to be checked FIRST.
        if (draft.bpEndTBD) { seasonalDoc.bpEnd = null; seasonalDoc.bpEndTBD = true; }
        else if (draft.bpEnd) { seasonalDoc.bpEnd = draft.bpEnd; seasonalDoc.bpEndTBD = false; }
        if (draft.rankEndTBD) { seasonalDoc.rankEnd = null; seasonalDoc.rankEndTBD = true; }
        else if (draft.rankEnd) { seasonalDoc.rankEnd = draft.rankEnd; seasonalDoc.rankEndTBD = false; }
        if (draft.dmzEndTBD) { seasonalDoc.dmzEnd = null; seasonalDoc.dmzEndTBD = true; }
        else if (draft.dmzEnd) { seasonalDoc.dmzEnd = draft.dmzEnd; seasonalDoc.dmzEndTBD = false; }
        seasonalDoc.newDraws = draft.newDraws || [];
        seasonalDoc.returningDraws = draft.returningDraws || [];
        seasonalDoc.calendar = draft.calendar || [];
        // No staging UI exists for draft banners yet (schema-only forward compat) -- these are no-ops
        // today, but copy the same "truthy draft value wins, blank leaves live untouched" convention
        // titles use above, so a future staging modal doesn't ALSO need this promote logic added
        // separately.
        if (draft.drawsBannerUrl) seasonalDoc.drawsBannerUrl = draft.drawsBannerUrl;
        if (draft.eventsBannerUrl) seasonalDoc.eventsBannerUrl = draft.eventsBannerUrl;
        if (draft.playlistsBannerUrl) seasonalDoc.playlistsBannerUrl = draft.playlistsBannerUrl;
        // Most-recent patchNotes[] entry stays synced to the live title, same as the manual Season
        // Titles & Deadlines flow above.
        if (draft.currentSeasonTitle && seasonalDoc.patchNotes.length > 0) {
            seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1].title = seasonalDoc.currentSeasonTitle;
        }
        seasonalDoc.draft = { active: false, newDraws: [], returningDraws: [], calendar: [] };
        seasonalDoc.markModified('draft');
        await seasonalDoc.save();
        const undoToken = registerUndo('Promote Draft to Live', async () => {
            const doc = await SeasonalData.findOne({ docType: 'global' });
            Object.assign(doc, prevLive);
            await doc.save();
        });
        try {
            await prompt(interaction, {
                text: `✅ **Draft promoted to live!** "${seasonalDoc.currentSeasonTitle}" is now the live season (${seasonalDoc.newDraws.length} New, ${seasonalDoc.returningDraws.length} Returning, ${seasonalDoc.calendar.length} calendar event(s)). The draft has been cleared.`,
                components: [undoButtonRow(undoToken)]
            });
        } catch (notifyError) {
            console.error('Failed to confirm draft promote (interaction likely expired):', notifyError);
        }
        return;
    }

    if (customId === 'mng_draftpromotecancel') {
        try { await prompt(interaction, { text: '❎ Promote cancelled -- the draft is untouched.' }); }
        catch (notifyError) { console.error('Failed to confirm draft promote cancellation (interaction likely expired):', notifyError); }
        return;
    }

    if (customId === 'mng_draftdiscardconfirm') {
        const SeasonalData = require('../../models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
        seasonalDoc.draft = { active: false, newDraws: [], returningDraws: [], calendar: [] };
        seasonalDoc.markModified('draft');
        await seasonalDoc.save();
        try { await prompt(interaction, { text: "✅ Draft discarded. What's live is untouched." }); }
        catch (notifyError) { console.error('Failed to confirm draft discard (interaction likely expired):', notifyError); }
        return;
    }

    if (customId === 'mng_draftdiscardcancel') {
        try { await prompt(interaction, { text: '❎ Discard cancelled -- the draft is untouched.' }); }
        catch (notifyError) { console.error('Failed to confirm draft discard cancellation (interaction likely expired):', notifyError); }
        return;
    }
}

// --- NEXT SEASON DRAFT: submit handlers --- custom_id: modal_draft_titles_dates
// Same parsing as the live equivalent above, writing into seasonalDoc.draft.* instead of the
// top-level fields -- none of this touches what's currently live.
async function setDraftTitlesDeadlines(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { splitTitleDate, parseAdminDate } = require('../../utils/adminParser');
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    if (!seasonalDoc.draft) seasonalDoc.draft = {};
    const mainTitle = interaction.fields.getTextInputValue('main_title').trim();
    if (mainTitle) seasonalDoc.draft.currentSeasonTitle = mainTitle;

    const skippedDraftDates = [];
    const applyDraftLine = (line, titleField, dateField, label) => {
        const { title, dateStr } = splitTitleDate(line);
        if (title) seasonalDoc.draft[titleField] = title;
        if (dateStr) {
            if (dateStr.trim().toLowerCase() === 'tbd') {
                seasonalDoc.draft[dateField] = null;
                seasonalDoc.draft[`${dateField}TBD`] = true;
            } else {
                const parsed = parseAdminDate(dateStr);
                if (parsed) {
                    seasonalDoc.draft[dateField] = parsed;
                    seasonalDoc.draft[`${dateField}TBD`] = false;
                } else {
                    skippedDraftDates.push(`${label} ("${dateStr}")`);
                }
            }
        }
    };
    applyDraftLine(interaction.fields.getTextInputValue('bp_line'), 'bpTitle', 'bpEnd', 'Battle Pass');
    applyDraftLine(interaction.fields.getTextInputValue('rank_line'), 'rankTitle', 'rankEnd', 'Ranked');
    applyDraftLine(interaction.fields.getTextInputValue('dmz_line'), 'dmzTitle', 'dmzEnd', 'DMZ');
    seasonalDoc.draft.active = true;
    seasonalDoc.markModified('draft');
    await seasonalDoc.save();
    let draftConfirmation = '✅ **Draft Titles & Deadlines Staged!** Nothing is live yet — use Promote to Live when ready.';
    if (skippedDraftDates.length > 0) draftConfirmation += `\n⚠️ Date not understood, left unchanged: ${skippedDraftDates.join(', ')}.`;
    return interaction.followUp({ content: draftConfirmation });
}

// custom_id: modal_draft_bulk_draws
async function bulkDraftDraws(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseBulkDrawList } = require('../../utils/adminParser');
    const { resolveThumbnailsForDraws } = require('./shared');
    const newText = interaction.fields.getTextInputValue('new_text')?.trim();
    const returningText = interaction.fields.getTextInputValue('returning_text')?.trim();
    if (!newText && !returningText) {
        return interaction.followUp({ content: '❌ Both fields were left blank -- nothing was changed.' });
    }
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    if (!seasonalDoc.draft) seasonalDoc.draft = {};
    const summary = [];
    if (newText) {
        const { validDraws } = await resolveThumbnailsForDraws(parseBulkDrawList(newText));
        validDraws.sort((a, b) => new Date(a.date) - new Date(b.date));
        seasonalDoc.draft.newDraws = validDraws;
        summary.push(`New Draws: staged ${validDraws.length}`);
    }
    if (returningText) {
        const { validDraws } = await resolveThumbnailsForDraws(parseBulkDrawList(returningText));
        validDraws.sort((a, b) => new Date(a.date) - new Date(b.date));
        seasonalDoc.draft.returningDraws = validDraws;
        summary.push(`Returning Draws: staged ${validDraws.length}`);
    }
    seasonalDoc.draft.active = true;
    seasonalDoc.markModified('draft');
    await seasonalDoc.save();
    return interaction.followUp({ content: `✅ **Draft Draws Staged!**\n${summary.join('\n')}\nNothing is live yet — use Promote to Live when ready.` });
}

// custom_id: modal_draft_bulk_calendar
async function bulkDraftCalendar(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseBulkEvents } = require('../../utils/adminParser');
    const bulkText = interaction.fields.getTextInputValue('bulk_text');
    const parsedEvents = parseBulkEvents(bulkText);
    const eventDocs = parsedEvents.map(e => ({
        title: e.title, date: e.startDate, endDate: e.isOngoing ? null : e.endDate, isOngoing: e.isOngoing, category: e.category
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    if (!seasonalDoc.draft) seasonalDoc.draft = {};
    seasonalDoc.draft.calendar = eventDocs;
    seasonalDoc.draft.active = true;
    seasonalDoc.markModified('draft');
    await seasonalDoc.save();
    return interaction.followUp({ content: `✅ **Draft Calendar Staged!** ${eventDocs.length} event(s). Nothing is live yet — use Promote to Live when ready.` });
}

module.exports = { promptWipeSeason, handleWipeButton, setTitlesDeadlines, handleDraftButton, setDraftTitlesDeadlines, bulkDraftDraws, bulkDraftCalendar };
