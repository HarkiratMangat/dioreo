// ==========================================
// /manage — CALENDAR PAGE
// ==========================================
// Every DB-mutating operation the Calendar page reaches: single add/edit, bulk add/replace/delete, banners, and purge. Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js, which owns the customId parsing and the generic confirm/cancel glue.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and .claude/rules/interaction-router.md.

const { recordChange } = require('../../utils/changeStore');
const { registerUndo, undoButtonRow, upsertEventsByTitle, loadOrCreateSeasonalDoc, registerBulkDelete, removeByTitle } = require('./shared');

// --- ADD SINGLE CALENDAR EVENT --- custom_id: modal_calendar_add A blank End Date means the event runs until the Battle Pass ends (isOngoing), same semantics as the bulk parser's "All Season" handling.
async function addCalendarEvent(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseAdminDate, normalizeCalendarCategory } = require('../../utils/adminParser');
    const title = interaction.fields.getTextInputValue('title').trim();
    const startDateStr = interaction.fields.getTextInputValue('start_date');
    const startDate = parseAdminDate(startDateStr);
    if (!startDate) return interaction.followUp({ content: `❌ Start date "${startDateStr}" wasn't understood -- nothing was saved.` });
    const endDateStr = interaction.fields.getTextInputValue('end_date')?.trim();
    const isOngoing = !endDateStr;
    const endDate = isOngoing ? null : parseAdminDate(endDateStr);
    if (!isOngoing && !endDate) return interaction.followUp({ content: `❌ End date "${endDateStr}" wasn't understood -- nothing was saved.` });
    const category = normalizeCalendarCategory(interaction.fields.getTextInputValue('category'), title);
    // Lenient Y/N parse (added for /draw calculator's 2X detection) -- blank or anything not starting with "y" is No, matching the modal's own "blank = No" placeholder.
    const isDoubleCP = /^y/i.test(interaction.fields.getTextInputValue('double_cp')?.trim() || '');

    const seasonalDoc = await loadOrCreateSeasonalDoc();
    seasonalDoc.calendar.push({ title, date: startDate, endDate, isOngoing, category, isDoubleCP });
    seasonalDoc.calendar.sort((a, b) => new Date(a.date) - new Date(b.date));
    await seasonalDoc.save();
    recordChange({ actorId: interaction.user.id, page: 'calendar', action: 'add', model: 'SeasonalData', target: title, summary: `Added calendar event "${title}"` });

    // Real Discord timestamps instead of plain toDateString() text -- renders in the viewer's own local time/format instead of a fixed string.
    return interaction.followUp({ content: `✅ **Event Added:** "${title}" (<t:${Math.floor(startDate.getTime() / 1000)}:D> -- ${isOngoing ? 'All Season' : `<t:${Math.floor(endDate.getTime() / 1000)}:D>`}).` });
}

// --- SAVE EDITED CALENDAR EVENT --- custom_id: edit_calendar_{id}
async function editCalendarEvent(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseAdminDate, normalizeCalendarCategory } = require('../../utils/adminParser');
    const targetId = interaction.customId.replace('edit_calendar_', '');
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const targetEvent = seasonalDoc.calendar.find(e => e._id.toString() === targetId);

    if (targetEvent) {
        const startDateStr = interaction.fields.getTextInputValue('start_date');
        const parsedStart = parseAdminDate(startDateStr);
        if (!parsedStart) return interaction.followUp({ content: `❌ Start date "${startDateStr}" wasn't understood -- nothing was saved.` });
        const endDateStr = interaction.fields.getTextInputValue('end_date')?.trim();
        const isOngoing = !endDateStr;
        const parsedEnd = isOngoing ? null : parseAdminDate(endDateStr);
        if (!isOngoing && !parsedEnd) return interaction.followUp({ content: `❌ End date "${endDateStr}" wasn't understood -- nothing was saved.` });

        targetEvent.title = interaction.fields.getTextInputValue('title').trim();
        targetEvent.date = parsedStart;
        targetEvent.isOngoing = isOngoing;
        targetEvent.endDate = parsedEnd;
        targetEvent.category = normalizeCalendarCategory(interaction.fields.getTextInputValue('category'), targetEvent.title);
        targetEvent.isDoubleCP = /^y/i.test(interaction.fields.getTextInputValue('double_cp')?.trim() || '');

        seasonalDoc.calendar.sort((a, b) => new Date(a.date) - new Date(b.date));
        await seasonalDoc.save();
        recordChange({ actorId: interaction.user.id, page: 'calendar', action: 'edit', model: 'SeasonalData', target: targetEvent.title, summary: `Edited calendar event "${targetEvent.title}"` });
        return interaction.followUp({ content: `✅ **Event Updated:** "${targetEvent.title}" (<t:${Math.floor(new Date(targetEvent.date).getTime() / 1000)}:D> -- ${targetEvent.isOngoing ? 'All Season' : `<t:${Math.floor(new Date(targetEvent.endDate).getTime() / 1000)}:D>`}).` });
    }
}

// --- BULK ADD/REPLACE CALENDAR EVENTS --- custom_id: modal_calendar_bulk_{add|replace} Replace upserts by fuzzy-matched title via upsertEventsByTitle (update in place if found, insert if not) -- Purge already covers a full wipe, so Replace doesn't need to double as one.
async function bulkAddOrReplaceCalendar(interaction) {
    // Deferred first (fixed 2026-08-07 12:24 EDT) -- this branch does the fetch + parse + fuzzy-match (replace mode) + save() entirely, which can blow Discord's 3-second interaction-ack window with no deferReply. Once the window was blown, interaction.reply() below would fail on a dead token even though seasonalDoc.save() had already succeeded -- so the data WAS saved, just with no visible confirmation, which is the trap that made this look broken.
    await interaction.deferReply({ ephemeral: true });
    const { parseBulkEvents } = require('../../utils/adminParser');
    const customId = interaction.customId;
    const mode = customId === 'modal_calendar_bulk_add' ? 'add' : 'replace';
    const bulkText = interaction.fields.getTextInputValue('bulk_text');
    const parsedEvents = parseBulkEvents(bulkText);

    const newEventDocs = parsedEvents.map(e => ({
        title: e.title,
        date: e.startDate,
        endDate: e.isOngoing ? null : e.endDate,
        isOngoing: e.isOngoing,
        category: e.category
    }));

    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const prevCalendar = seasonalDoc.calendar;
    let finalArray, updatedCount = 0, insertedCount = newEventDocs.length;
    if (mode === 'add') {
        finalArray = [...seasonalDoc.calendar, ...newEventDocs];
    } else {
        ({ finalArray, updatedCount, insertedCount } = upsertEventsByTitle(seasonalDoc.calendar, newEventDocs));
    }

    // AUTO-SORT: Keep the timeline in chronological order
    finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
    seasonalDoc.calendar = finalArray;
    await seasonalDoc.save();
    recordChange({ actorId: interaction.user.id, page: 'calendar', action: mode === 'add' ? 'bulkAdd' : 'bulkReplace', model: 'SeasonalData', target: 'Calendar', summary: `Bulk ${mode === 'add' ? 'add' : 'replace'} calendar events`, detail: `${insertedCount} inserted, ${updatedCount} updated` });

    const undoToken = registerUndo(`Bulk ${mode === 'add' ? 'Add' : 'Replace'} Calendar`, async () => {
        const SeasonalData = require('../../models/SeasonalData');
        const doc = await loadOrCreateSeasonalDoc();
        doc.calendar = prevCalendar;
        await doc.save();
    });

    const summary = mode === 'add'
        ? `Added ${insertedCount} event(s) (now **${finalArray.length}** total).`
        : `Updated ${updatedCount}, added ${insertedCount} (now **${finalArray.length}** total).`;
    // Per-category breakdown of THIS submission's own titles -- the classifier could be correct but a mis-typed source paste could still land titles in the wrong category with no way to catch it without opening /calendar and cross-checking by eye. Grouped from `newEventDocs` (not the full `finalArray`) so a Replace submission only reports what THIS paste actually classified. Capped so one giant bulk paste can't blow Discord's 2000-char content limit on the reply itself.
    const CATEGORY_LABELS = { draw: 'Draws', event: 'Events', playlist: 'Playlists' };
    const byCategory = { draw: [], event: [], playlist: [] };
    for (const e of newEventDocs) (byCategory[e.category] || byCategory.event).push(e.title);
    const breakdownLines = ['draw', 'event', 'playlist']
        .filter(cat => byCategory[cat].length > 0)
        .map(cat => {
            const titles = byCategory[cat];
            const joined = titles.join(', ');
            const line = `**${CATEGORY_LABELS[cat]} (${titles.length}):** ${joined}`;
            return line.length > 400 ? `${line.slice(0, 397)}...` : line;
        });
    return interaction.editReply({
        content: `✅ **Bulk Calendar ${mode === 'add' ? 'Add' : 'Replace'} Complete!**\n${summary} Sorted chronologically.\n${breakdownLines.join('\n')}`,
        components: [undoButtonRow(undoToken)]
    });
}

// --- BULK REMOVE CALENDAR EVENTS --- custom_id: modal_calendar_bulk_remove Dry-run only, same 2-step confirm every other bulk-delete route uses.
async function bulkDeleteCalendar(interaction) {
    // Shared removeByTitle, not an inline loop (v3-pre-release review, finding #40).
    const titlesRaw = interaction.fields.getTextInputValue('titles');
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const { remaining, removed, notFound } = removeByTitle(seasonalDoc.calendar, titlesRaw);

    if (removed.length === 0) {
        return interaction.reply({ content: `❌ Nothing matched -- nothing to delete.${notFound.length ? `\n⚠️ Not found: ${notFound.join(', ')}` : ''}`, ephemeral: true });
    }

    const summary = [`Removed: ${removed.join(', ')}`];
    if (notFound.length) summary.push(`⚠️ Not found: ${notFound.join(', ')}`);

    // registerBulkDelete, not a hand-rolled confirm scaffold (v3-pre-release review, finding #37).
    return registerBulkDelete(interaction, {
        description: 'Bulk Delete Calendar Events',
        summary,
        apply: async () => {
            const doc = await loadOrCreateSeasonalDoc();
            const prevCalendar = doc.calendar;
            doc.calendar = remaining;
            await doc.save();
            recordChange({ actorId: interaction.user.id, page: 'calendar', action: 'bulkDelete', model: 'SeasonalData', target: 'Calendar', summary: 'Bulk delete calendar events', detail: summary.join(' | ') });
            return registerUndo('Bulk Delete Calendar Events', async () => {
                const d = await loadOrCreateSeasonalDoc();
                d.calendar = prevCalendar;
                await d.save();
            });
        }
    });
}

// --- PAGE BANNERS --- custom_id: modal_calendar_banners 3 independently-clearable fields in one modal -- each is handled on its own: a filled field re-hosts through calendarBannerCache (falls back to the raw URL on a Cloudinary hiccup, never blocks the save); a blank field that previously had a value clears it (best-effort Cloudinary delete + resets the DB field to ''); a blank field that was already empty is a no-op.
async function setBanners(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { cacheBannerImage, clearBannerImage } = require('../../utils/calendarBannerCache');
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const fieldMap = [
        { field: 'draws_banner', urlKey: 'drawsBannerUrl', page: 'draws', label: 'Draws' },
        { field: 'events_banner', urlKey: 'eventsBannerUrl', page: 'events', label: 'Events' },
        { field: 'playlists_banner', urlKey: 'playlistsBannerUrl', page: 'playlists', label: 'Playlists' }
    ];
    const changes = [];
    for (const { field, urlKey, page, label } of fieldMap) {
        const raw = interaction.fields.getTextInputValue(field)?.trim();
        if (!raw) {
            if (seasonalDoc[urlKey]) {
                await clearBannerImage(page);
                seasonalDoc[urlKey] = '';
                changes.push(`${label}: cleared`);
            }
            continue;
        }
        const result = await cacheBannerImage(page, raw);
        seasonalDoc[urlKey] = result.url || '';
        changes.push(`${label}: banner set${result.cached ? '' : ' (not re-hosted -- Cloudinary hiccup, using the raw URL)'}`);
    }
    await seasonalDoc.save();
    if (changes.length) {
        recordChange({ actorId: interaction.user.id, page: 'calendar', action: 'edit', model: 'SeasonalData', target: 'Calendar Banners', summary: 'Updated calendar banners', detail: changes.join(' | ') });
    }
    return interaction.followUp({
        content: changes.length
            ? `✅ **Calendar Banners Updated!**\n${changes.map(c => `-# ${c}`).join('\n')}`
            : 'ℹ️ No changes made.'
    });
}

// --- PURGE (calendar) --- called from index.js's mng_purgeconfirm_ dispatch. Calendar has only one scope ('all') -- there's no per-sub-category purge the way Draws has new/returning.
async function purge(actorId) {
    const SeasonalData = require('../../models/SeasonalData');
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const prevCalendar = seasonalDoc.calendar;
    seasonalDoc.calendar = [];
    await seasonalDoc.save();
    const confirmMsg = `✅ Purged the calendar (${prevCalendar.length} event(s) removed).`;
    recordChange({ actorId, page: 'calendar', action: 'purge', model: 'SeasonalData', target: 'all', summary: confirmMsg });
    const undoToken = registerUndo('Purge (calendar)', async () => {
        const doc = await loadOrCreateSeasonalDoc();
        doc.calendar = prevCalendar;
        await doc.save();
    });
    return { confirmMsg, undoToken };
}

// --- DELETE (calendar) --- called from index.js's mng_delconfirm_ dispatch with the resolved match.
async function deleteItem(match, actorId) {
    const SeasonalData = require('../../models/SeasonalData');
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const removedDoc = match.doc;
    seasonalDoc.calendar = seasonalDoc.calendar.filter(e => e._id.toString() !== match.id);
    await seasonalDoc.save();
    recordChange({ actorId, page: 'calendar', action: 'delete', model: 'SeasonalData', target: match.label, summary: `Deleted calendar event "${match.label}"` });
    return registerUndo(`Delete calendar event "${match.label}"`, async () => {
        const doc = await loadOrCreateSeasonalDoc();
        doc.calendar.push(removedDoc);
        await doc.save();
    });
}

module.exports = { addCalendarEvent, editCalendarEvent, bulkAddOrReplaceCalendar, bulkDeleteCalendar, setBanners, purge, deleteItem };
