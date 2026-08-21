// ==========================================
// /manage — CALENDAR PAGE
// ==========================================
// Every DB-mutating operation the Calendar page reaches: single add/edit, bulk add/replace/delete, banners, and purge. Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js, which owns the customId parsing and the generic confirm/cancel glue. See handlers/manage/shared.js for thumbnailNote/loadOrCreateSeasonalDoc/registerBulkDelete/removeByTitle, all shared with draws.js/season.js.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and .claude/rules/interaction-router.md.
//
// ⚠️ MUTATIONS ROUTE THROUGH THE OPERATION CORE (core/changeset.js's commitSet), as of plan 2 Task 2 (2026-08-21 12:56 EDT). Every mutation body below used to read the document, mutate it in memory, .save() it, then call utils/changeStore.js's recordChange() directly -- this page no longer does either. commitSet() applies the op transactionally, records the ChangeLog row itself with an `inverse`, and returns the changeId. Undo for calendar-page changes now lives on /bot analytics' Changes page (core/revert.js) instead of the inline Undo button `registerUndo`/`undoButtonRow` used to render here -- those two calls are simply GONE from this file. Modal parsing and reply formatting are UNTOUCHED where the op's contract allows it to stay in the handler; single add/edit's date-parsing and category-normalization stay HERE (the op accepts either raw modal strings or an already-parsed Date, and passing a Date keeps this handler's user-facing wording byte-identical). See core/ops/calendar.js for the op contract and its own header for the real defects found and fixed during this integration pass.

const { commitSet } = require('../../core/changeset');
const { loadOrCreateSeasonalDoc, registerBulkDelete, removeByTitle } = require('./shared');

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

    const result = await commitSet(
        [{ type: 'calendar.add', payload: { title, date: startDate, endDate, isOngoing, category, isDoubleCP } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        const why = result.failures?.[0]?.errors?.join(' ') || result.error;
        return await interaction.followUp({ content: `❌ ${why}` });
    }

    // Real Discord timestamps instead of plain toDateString() text -- renders in the viewer's own local time/format instead of a fixed string.
    return interaction.followUp({ content: `✅ **Event Added:** "${title}" (<t:${Math.floor(startDate.getTime() / 1000)}:D> -- ${isOngoing ? 'All Season' : `<t:${Math.floor(endDate.getTime() / 1000)}:D>`}).` });
}

// --- SAVE EDITED CALENDAR EVENT --- custom_id: edit_calendar_{id}
async function editCalendarEvent(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseAdminDate, normalizeCalendarCategory } = require('../../utils/adminParser');
    const targetId = interaction.customId.replace('edit_calendar_', '');

    // Existence pre-check kept exactly as before the refactor -- calendar.edit's op would also report this as `reason: 'missing'`, but the pre-core handler simply returned with no reply at all when the id wasn't found (a stale search result), and this preserves that exact silent behaviour rather than introducing a new error reply where none existed.
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

        const title = interaction.fields.getTextInputValue('title').trim();
        const category = normalizeCalendarCategory(interaction.fields.getTextInputValue('category'), title);
        const isDoubleCP = /^y/i.test(interaction.fields.getTextInputValue('double_cp')?.trim() || '');

        const result = await commitSet(
            [{ type: 'calendar.edit', target: { elementId: targetId },
               payload: { title, date: parsedStart, endDate: parsedEnd, isOngoing, category, isDoubleCP } }],
            { actorId: interaction.user.id }
        );
        if (!result.ok) {
            const why = result.failures?.[0]?.errors?.join(' ') || result.error;
            return await interaction.followUp({ content: `❌ ${why}` });
        }

        return interaction.followUp({ content: `✅ **Event Updated:** "${title}" (<t:${Math.floor(parsedStart.getTime() / 1000)}:D> -- ${isOngoing ? 'All Season' : `<t:${Math.floor(parsedEnd.getTime() / 1000)}:D>`}).` });
    }
}

// --- BULK ADD/REPLACE CALENDAR EVENTS --- custom_id: modal_calendar_bulk_{add|replace} Replace upserts by fuzzy-matched title (update in place if found, insert if not) -- Purge already covers a full wipe, so Replace doesn't need to double as one. Parsing now happens INSIDE the op (core/ops/calendar.js), which is the only file that knows a calendar event's shape -- this handler just relays the raw pasted text and re-derives the same per-category breakdown from the op's own result.
async function bulkAddOrReplaceCalendar(interaction) {
    // Deferred first (fixed 2026-08-07 12:24 EDT) -- the parse + fuzzy-match (replace mode) + save() inside the op can still blow Discord's 3-second interaction-ack window with no deferReply.
    await interaction.deferReply({ ephemeral: true });
    const customId = interaction.customId;
    const mode = customId === 'modal_calendar_bulk_add' ? 'add' : 'replace';
    const opType = mode === 'add' ? 'calendar.bulkAdd' : 'calendar.bulkReplace';
    const bulkText = interaction.fields.getTextInputValue('bulk_text');

    const result = await commitSet([{ type: opType, payload: { text: bulkText } }], { actorId: interaction.user.id });
    if (!result.ok) {
        const why = result.failures?.[0]?.errors?.join(' ') || result.error;
        return await interaction.editReply({ content: `❌ ${why}` });
    }

    const { applied } = result.results[0];
    const summary = mode === 'add'
        ? `Added ${applied.added.length} event(s) (now **${applied.total}** total).`
        : `Updated ${applied.updatedCount}, added ${applied.insertedCount} (now **${applied.total}** total).`;
    // Per-category breakdown of THIS submission's own titles -- the classifier could be correct but a mis-typed source paste could still land titles in the wrong category with no way to catch it without opening /calendar and cross-checking by eye. Grouped from `applied.added` (not the full live array) so a Replace submission only reports what THIS paste actually classified. Capped so one giant bulk paste can't blow Discord's 2000-char content limit on the reply itself.
    const CATEGORY_LABELS = { draw: 'Draws', event: 'Events', playlist: 'Playlists' };
    const byCategory = { draw: [], event: [], playlist: [] };
    for (const e of applied.added) (byCategory[e.category] || byCategory.event).push(e.title);
    const breakdownLines = ['draw', 'event', 'playlist']
        .filter(cat => byCategory[cat].length > 0)
        .map(cat => {
            const titles = byCategory[cat];
            const joined = titles.join(', ');
            const line = `**${CATEGORY_LABELS[cat]} (${titles.length}):** ${joined}`;
            return line.length > 400 ? `${line.slice(0, 397)}...` : line;
        });
    return interaction.editReply({
        content: `✅ **Bulk Calendar ${mode === 'add' ? 'Add' : 'Replace'} Complete!**\n${summary} Sorted chronologically.\n${breakdownLines.join('\n')}`
    });
}

// --- BULK REMOVE CALENDAR EVENTS --- custom_id: modal_calendar_bulk_remove Dry-run only, same 2-step confirm every other bulk-delete route uses. The dry-run collects exact element ids (not just titles) so the confirmed delete targets precisely what was previewed even if the live data shifts between preview and confirm -- same reasoning as draws.js's bulkDeleteDraws.
async function bulkDeleteCalendar(interaction) {
    const titlesRaw = interaction.fields.getTextInputValue('titles');
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const { removed, ids, notFound } = removeByTitle(seasonalDoc.calendar, titlesRaw);

    if (removed.length === 0) {
        return interaction.reply({ content: `❌ Nothing matched -- nothing to delete.${notFound.length ? `\n⚠️ Not found: ${notFound.join(', ')}` : ''}`, ephemeral: true });
    }

    const summary = [`Removed: ${removed.join(', ')}`];
    if (notFound.length) summary.push(`⚠️ Not found: ${notFound.join(', ')}`);

    return registerBulkDelete(interaction, {
        description: 'Bulk Delete Calendar Events',
        summary,
        apply: async () => {
            const result = await commitSet([{ type: 'calendar.bulkDelete', payload: { ids } }], { actorId: interaction.user.id });
            if (!result.ok) throw new Error(result.failures?.[0]?.errors?.join(' ') || result.error);
            return null;   // Undo now lives on /bot analytics' Changes page (core/revert.js) -- no inline undo token.
        }
    });
}

// --- PAGE BANNERS --- custom_id: modal_calendar_banners 3 independently-clearable fields in one modal, each handled by the op the same way as before the refactor: a filled field re-hosts through calendarBannerCache (falls back to the raw URL on a Cloudinary hiccup, never blocks the save); a blank field that previously had a value clears it (best-effort Cloudinary delete + resets the DB field to ''); a blank field that was already empty is a no-op. This handler just relays the 3 raw values and renders the op's `changes` report back into the same wording the pre-core handler used.
async function setBanners(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const fieldMap = [
        { field: 'draws_banner', key: 'draws', label: 'Draws' },
        { field: 'events_banner', key: 'events', label: 'Events' },
        { field: 'playlists_banner', key: 'playlists', label: 'Playlists' }
    ];
    const payload = {};
    for (const { field, key } of fieldMap) payload[key] = interaction.fields.getTextInputValue(field)?.trim() || '';

    const result = await commitSet([{ type: 'calendar.setBanners', payload }], { actorId: interaction.user.id });
    if (!result.ok) {
        const why = result.failures?.[0]?.errors?.join(' ') || result.error;
        return await interaction.followUp({ content: `❌ ${why}` });
    }

    const labelFor = Object.fromEntries(fieldMap.map(f => [f.key, f.label]));
    const changes = (result.results[0].applied.changes || []).map(c =>
        c.action === 'cleared'
            ? `${labelFor[c.key]}: cleared`
            : `${labelFor[c.key]}: banner set${c.cached ? '' : ' (not re-hosted -- Cloudinary hiccup, using the raw URL)'}`
    );
    return interaction.followUp({
        content: changes.length
            ? `✅ **Calendar Banners Updated!**\n${changes.map(c => `-# ${c}`).join('\n')}`
            : 'ℹ️ No changes made.'
    });
}

// --- PURGE (calendar) --- called from index.js's mng_purgeconfirm_ dispatch. Calendar has only one scope ('all') -- there's no per-sub-category purge the way Draws has new/returning.
async function purge(actorId) {
    const result = await commitSet([{ type: 'calendar.purge' }], { actorId });
    if (!result.ok) {
        return { confirmMsg: `❌ ${result.failures?.[0]?.errors?.join(' ') || result.error}` };
    }
    const { applied } = result.results[0];
    return { confirmMsg: `✅ Purged the calendar (${applied.events.length} event(s) removed).` };
}

// --- DELETE (calendar) --- called from index.js's mng_delconfirm_ dispatch with the resolved match.
async function deleteItem(match, actorId) {
    const result = await commitSet([{ type: 'calendar.delete', target: { elementId: match.id } }], { actorId });
    if (!result.ok) throw new Error(result.failures?.[0]?.errors?.join(' ') || result.error);
    return null;   // Undo now lives on /bot analytics' Changes page (core/revert.js) -- no inline undo token.
}

module.exports = { addCalendarEvent, editCalendarEvent, bulkAddOrReplaceCalendar, bulkDeleteCalendar, setBanners, purge, deleteItem };
