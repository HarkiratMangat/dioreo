// ==========================================
// /manage — DRAWS PAGE
// ==========================================
// Every DB-mutating operation the Draws page reaches: single add/edit, bulk add/replace/delete, and
// purge. Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/
// 2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js, which
// owns the customId parsing and the generic confirm/cancel glue. See handlers/manage/shared.js for
// registerUndo/undoButtonRow/thumbnailNote/resolveThumbnailsForDraws/upsertDrawsByTitle/
// loadOrCreateSeasonalDoc, all shared with calendar.js/season.js.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Every function here is awaited from inside
// handlers/router.js's single top-level try/catch (via handlers/manage/index.js) -- do NOT add a
// try/catch here that swallows, and keep every error-branch reply an AWAITED call. See
// .claude/rules/interaction-router.md.

const { resolveThumbnail } = require('../../utils/cloudinaryCache');
const { recordChange } = require('../../utils/changeStore');
const {
    registerUndo, undoButtonRow, thumbnailNote, resolveThumbnailsForDraws,
    upsertDrawsByTitle, loadOrCreateSeasonalDoc
} = require('./shared');

// --- SAVE NEW SINGLE DRAW --- custom_id: add_draw_{new|returning}
async function addDraw(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { toTitleCase, parseItemLine, parseAdminDate, parseBulkDrawList } = require('../../utils/adminParser');
    const customId = interaction.customId;
    const drawType = customId.replace('add_draw_', '');

    // 5th field: an alternative to filling in the 4 separate fields below -- paste the whole draw as
    // one bulk-style line and it's run through the SAME parser bulk import uses. All 5 fields are
    // setRequired(false) (see commands/manage.js's buildAddDrawModal), so Discord itself won't block
    // a submit with only this one filled.
    const combinedLine = interaction.fields.getTextInputValue('combined')?.trim();

    let newDrawObj;
    let cloudinaryWarning = null;

    if (combinedLine) {
        const [parsed] = parseBulkDrawList(combinedLine);
        if (!parsed) {
            return interaction.followUp({ content: '❌ Could not parse that line -- expected format: `Title, m Item 1, l Item 2, Date, URL` (URL optional).' });
        }
        const thumbResult = await resolveThumbnail(parsed.title, parsed.thumbnailUrl);
        if (!thumbResult.url) {
            return interaction.followUp({ content: `❌ No URL provided and no cached image found for "${parsed.title}" -- provide a thumbnail URL.` });
        }
        cloudinaryWarning = thumbnailNote(thumbResult);
        newDrawObj = { title: parsed.title, items: parsed.items, date: parsed.date, thumbnailUrl: thumbResult.url };
    } else {
        const title = toTitleCase(interaction.fields.getTextInputValue('title'));
        const dateStr = interaction.fields.getTextInputValue('date');
        const rawUrl = interaction.fields.getTextInputValue('url');
        const rawItems = interaction.fields.getTextInputValue('items');

        if (!title || !dateStr || !rawItems) {
            return interaction.followUp({ content: '❌ Fill in Title, Items, and Release Date, or use the "Or Paste As One Line" field instead.' });
        }
        const parsedSingleDate = parseAdminDate(dateStr);
        if (!parsedSingleDate) {
            return interaction.followUp({ content: `❌ Date "${dateStr}" wasn't understood -- nothing was saved.` });
        }

        // URL is optional -- blank reuses a Cloudinary cache hit for this exact title if one exists;
        // no URL AND no cache hit is a real validation error since the draw needs some thumbnail.
        const thumbResult = await resolveThumbnail(title, rawUrl);
        if (!thumbResult.url) {
            return interaction.followUp({ content: `❌ No URL provided and no cached image found for "${title}" -- provide a thumbnail URL.` });
        }
        cloudinaryWarning = thumbnailNote(thumbResult);

        const parsedItems = rawItems.split('\n').filter(l => l.trim().length > 0).map(parseItemLine);
        newDrawObj = { title, items: parsedItems, date: parsedSingleDate, thumbnailUrl: thumbResult.url };
    }

    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const arrayTarget = drawType === 'new' ? seasonalDoc.newDraws : seasonalDoc.returningDraws;
    arrayTarget.push(newDrawObj);
    arrayTarget.sort((a, b) => new Date(a.date) - new Date(b.date));
    await seasonalDoc.save();
    recordChange({ actorId: interaction.user.id, page: 'draws', action: 'add', model: 'SeasonalData', target: newDrawObj.title, summary: `Added ${drawType} draw "${newDrawObj.title}"` });

    let confirmation = `✅ **Draw Added:** "${newDrawObj.title}" (${drawType === 'new' ? 'New' : 'Returning'}, ${newDrawObj.items.length} item(s), releases <t:${Math.floor(new Date(newDrawObj.date).getTime() / 1000)}:D>).`;
    if (cloudinaryWarning) confirmation += `\n${cloudinaryWarning}`;
    return interaction.followUp({ content: confirmation });
}

// --- SAVE EDITED DRAW --- custom_id: edit_draw_{id}_{new|returning}
async function editDraw(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { toTitleCase, parseItemLine, parseAdminDate } = require('../../utils/adminParser');
    const [_, __, targetId, drawType] = interaction.customId.split('_');

    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const arrayTarget = drawType === 'new' ? seasonalDoc.newDraws : seasonalDoc.returningDraws;
    const drawIndex = arrayTarget.findIndex(d => d._id.toString() === targetId);

    if (drawIndex > -1) {
        const drawDateStr = interaction.fields.getTextInputValue('date');
        const parsedDrawDate = parseAdminDate(drawDateStr);
        if (!parsedDrawDate) return interaction.followUp({ content: `❌ Date "${drawDateStr}" wasn't understood -- nothing was saved.` });
        const newTitle = toTitleCase(interaction.fields.getTextInputValue('title'));
        arrayTarget[drawIndex].title = newTitle;
        arrayTarget[drawIndex].date = parsedDrawDate;

        // URL field is optional -- blank reuses whatever's cached in Cloudinary for this draw's
        // (possibly just-renamed) title. A blank field with no cache hit at all is a real validation
        // error -- the draw needs SOME thumbnail, so this rejects the edit rather than saving with a
        // broken image field.
        const rawUrl = interaction.fields.getTextInputValue('url');
        const thumbResult = await resolveThumbnail(newTitle, rawUrl);
        if (!thumbResult.url) {
            return interaction.followUp({ content: `❌ No URL provided and no cached image found for "${newTitle}" -- provide a thumbnail URL.` });
        }
        arrayTarget[drawIndex].thumbnailUrl = thumbResult.url;

        const rawItems = interaction.fields.getTextInputValue('items');
        arrayTarget[drawIndex].items = rawItems.split('\n').filter(l => l.trim().length > 0).map(parseItemLine);

        arrayTarget.sort((a, b) => new Date(a.date) - new Date(b.date));
        await seasonalDoc.save();
        recordChange({ actorId: interaction.user.id, page: 'draws', action: 'edit', model: 'SeasonalData', target: newTitle, summary: `Edited ${drawType} draw "${newTitle}"` });
        let confirmation = `✅ **Draw Updated:** "${newTitle}" (${drawType === 'new' ? 'New' : 'Returning'}, ${arrayTarget[drawIndex].items.length} item(s), releases <t:${Math.floor(new Date(arrayTarget[drawIndex].date).getTime() / 1000)}:D>).`;
        const editThumbNote = thumbnailNote(thumbResult);
        if (editThumbNote) confirmation += `\n${editThumbNote}`;
        return interaction.followUp({ content: confirmation });
    }
}

// --- BULK ADD/REPLACE BOTH DRAW CATEGORIES AT ONCE --- custom_id: modal_draws_bulk_{add|replace}_both
// One modal, two independently-optional fields -- only whichever field was actually filled in gets
// touched. Replace upserts by fuzzy-matched title (update in place, keep _id) rather than wholesale-
// overwriting the array; Add just appends everything parsed.
async function bulkAddOrReplaceDraws(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseBulkDrawList } = require('../../utils/adminParser');
    const customId = interaction.customId;
    const mode = customId === 'modal_draws_bulk_add_both' ? 'add' : 'replace';
    const newText = interaction.fields.getTextInputValue('new_text')?.trim();
    const returningText = interaction.fields.getTextInputValue('returning_text')?.trim();

    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const updated = [];
    const allSkipped = [];
    const allWarnings = [];
    // Snapshot BEFORE mutating either array, so Undo can restore exactly what was there.
    const prevNew = seasonalDoc.newDraws;
    const prevReturning = seasonalDoc.returningDraws;

    if (newText) {
        const { validDraws, skipped, warnings } = await resolveThumbnailsForDraws(parseBulkDrawList(newText));
        const { finalArray, updatedCount, insertedCount } = mode === 'add'
            ? { finalArray: [...seasonalDoc.newDraws, ...validDraws], updatedCount: 0, insertedCount: validDraws.length }
            : upsertDrawsByTitle(seasonalDoc.newDraws, validDraws);
        finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
        seasonalDoc.newDraws = finalArray;
        const newTitleList = validDraws.map(d => `"${d.title}"`).join(', ');
        updated.push((mode === 'add'
            ? `**New Draws:** added ${insertedCount} (now ${finalArray.length} total)`
            : `**New Draws:** updated ${updatedCount}, added ${insertedCount} (now ${finalArray.length} total)`)
            + (newTitleList ? `\n-# ${newTitleList}` : ''));
        allSkipped.push(...skipped);
        allWarnings.push(...warnings);
    }
    if (returningText) {
        const { validDraws, skipped, warnings } = await resolveThumbnailsForDraws(parseBulkDrawList(returningText));
        const { finalArray, updatedCount, insertedCount } = mode === 'add'
            ? { finalArray: [...seasonalDoc.returningDraws, ...validDraws], updatedCount: 0, insertedCount: validDraws.length }
            : upsertDrawsByTitle(seasonalDoc.returningDraws, validDraws);
        finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
        seasonalDoc.returningDraws = finalArray;
        const returningTitleList = validDraws.map(d => `"${d.title}"`).join(', ');
        updated.push((mode === 'add'
            ? `**Returning Draws:** added ${insertedCount} (now ${finalArray.length} total)`
            : `**Returning Draws:** updated ${updatedCount}, added ${insertedCount} (now ${finalArray.length} total)`)
            + (returningTitleList ? `\n-# ${returningTitleList}` : ''));
        allSkipped.push(...skipped);
        allWarnings.push(...warnings);
    }

    if (updated.length === 0) {
        return interaction.followUp({ content: '❌ Both fields were left blank -- nothing was changed.' });
    }

    await seasonalDoc.save();
    recordChange({ actorId: interaction.user.id, page: 'draws', action: mode === 'add' ? 'bulkAdd' : 'bulkReplace', model: 'SeasonalData', target: 'New/Returning Draws', summary: `Bulk ${mode === 'add' ? 'add' : 'replace'} draws`, detail: updated.join(' | ') });
    const undoToken = registerUndo(`Bulk ${mode === 'add' ? 'Add' : 'Replace'} Draws`, async () => {
        const SeasonalData = require('../../models/SeasonalData');
        const doc = await SeasonalData.findOne({ docType: 'global' });
        if (newText) doc.newDraws = prevNew;
        if (returningText) doc.returningDraws = prevReturning;
        await doc.save();
    });

    let confirmation = `✅ **Bulk ${mode === 'add' ? 'Add' : 'Replace'} Complete!**\n${updated.join('\n')}`;
    if (allSkipped.length) confirmation += `\n⚠️ Skipped (no URL given and nothing cached yet): ${allSkipped.join(', ')}`;
    if (allWarnings.length) confirmation += `\n⚠️ Cloudinary caching failed, kept the original URL instead: ${allWarnings.join('; ')}`;
    return interaction.followUp({ content: confirmation, components: [undoButtonRow(undoToken)] });
}

// --- BULK DELETE DRAWS --- custom_id: modal_draws_bulk_remove_{new|returning|either}
// Dry-run only: computes what WOULD be removed and shows a Confirm/Cancel prompt; the actual save
// happens from index.js's mng_bulkdelconfirm_ dispatch, via the `apply()` closure stashed here.
async function bulkDeleteDraws(interaction) {
    const { fuzzyMatch } = require('../../utils/search');
    const { randomUUID } = require('crypto');
    const { pendingBulkDeletes } = require('./shared');
    const customId = interaction.customId;
    const drawType = customId.replace('modal_draws_bulk_remove_', ''); // 'new' | 'returning' | 'either'
    const newTitlesRaw = drawType !== 'returning' ? interaction.fields.getTextInputValue('new_titles')?.trim() : '';
    const returningTitlesRaw = drawType !== 'new' ? interaction.fields.getTextInputValue('returning_titles')?.trim() : '';

    const seasonalDoc = await loadOrCreateSeasonalDoc();

    const removeFrom = (array, titlesRaw) => {
        const requested = titlesRaw.split('\n').map(t => t.trim()).filter(Boolean);
        const removed = [];
        const notFound = [];
        let remaining = array;
        for (const title of requested) {
            const match = remaining.find(d => fuzzyMatch(title, d.title));
            if (match) {
                removed.push(match.title);
                remaining = remaining.filter(d => d !== match);
            } else {
                notFound.push(title);
            }
        }
        return { remaining, removed, notFound };
    };

    const summary = [];
    let newRemaining = null, returningRemaining = null;
    let anyRemoved = false;
    if (newTitlesRaw) {
        const { remaining, removed, notFound } = removeFrom(seasonalDoc.newDraws, newTitlesRaw);
        newRemaining = remaining;
        if (removed.length) { summary.push(`Removed from New: ${removed.join(', ')}`); anyRemoved = true; }
        if (notFound.length) summary.push(`⚠️ Not found in New: ${notFound.join(', ')}`);
    }
    if (returningTitlesRaw) {
        const { remaining, removed, notFound } = removeFrom(seasonalDoc.returningDraws, returningTitlesRaw);
        returningRemaining = remaining;
        if (removed.length) { summary.push(`Removed from Returning: ${removed.join(', ')}`); anyRemoved = true; }
        if (notFound.length) summary.push(`⚠️ Not found in Returning: ${notFound.join(', ')}`);
    }

    if (!anyRemoved) {
        return interaction.reply({ content: `❌ Nothing matched -- nothing to delete.\n${summary.join('\n')}`, ephemeral: true });
    }

    const token = randomUUID().slice(0, 8);
    pendingBulkDeletes.set(token, {
        description: 'Bulk Delete Draws',
        summary,
        apply: async () => {
            const SeasonalData = require('../../models/SeasonalData');
            const doc = await SeasonalData.findOne({ docType: 'global' });
            const prevNew = doc.newDraws, prevReturning = doc.returningDraws;
            if (newRemaining !== null) doc.newDraws = newRemaining;
            if (returningRemaining !== null) doc.returningDraws = returningRemaining;
            await doc.save();
            recordChange({ actorId: interaction.user.id, page: 'draws', action: 'bulkDelete', model: 'SeasonalData', target: 'New/Returning Draws', summary: 'Bulk delete draws', detail: summary.join(' | ') });
            return registerUndo('Bulk Delete Draws', async () => {
                const d = await SeasonalData.findOne({ docType: 'global' });
                if (newRemaining !== null) d.newDraws = prevNew;
                if (returningRemaining !== null) d.returningDraws = prevReturning;
                await d.save();
            });
        }
    });
    setTimeout(() => pendingBulkDeletes.delete(token), 10 * 60 * 1000).unref();

    return interaction.reply({
        content: `⚠️ **Confirm Bulk Delete?**\n${summary.join('\n')}`,
        components: [{
            type: 1, components: [
                { type: 2, style: 4, label: 'Yes, Delete', custom_id: `mng_bulkdelconfirm_${token}` },
                { type: 2, style: 2, label: 'Cancel', custom_id: `mng_bulkdelcancel_${token}` }
            ]
        }],
        ephemeral: true
    });
}

// --- PURGE (draws) --- called from index.js's mng_purgeconfirm_ dispatch. scope: 'new'|'returning'|'all'.
async function purgeDraws(scope, actorId) {
    const SeasonalData = require('../../models/SeasonalData');
    const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
    // Snapshot whatever's about to be wiped so Undo can restore it exactly.
    const prevNew = seasonalDoc.newDraws;
    const prevReturning = seasonalDoc.returningDraws;
    if (scope === 'new' || scope === 'all') seasonalDoc.newDraws = [];
    if (scope === 'returning' || scope === 'all') seasonalDoc.returningDraws = [];
    await seasonalDoc.save();
    const removedCounts = [];
    if (scope === 'new' || scope === 'all') removedCounts.push(`${prevNew.length} New`);
    if (scope === 'returning' || scope === 'all') removedCounts.push(`${prevReturning.length} Returning`);
    const confirmMsg = `✅ Purged ${scope === 'all' ? 'all New and Returning draws' : `all ${scope} draws`} (${removedCounts.join(', ')} removed).`;
    recordChange({ actorId, page: 'draws', action: 'purge', model: 'SeasonalData', target: scope, summary: confirmMsg });
    const undoToken = registerUndo(`Purge (${scope} draws)`, async () => {
        const doc = await SeasonalData.findOne({ docType: 'global' });
        if (scope === 'new' || scope === 'all') doc.newDraws = prevNew;
        if (scope === 'returning' || scope === 'all') doc.returningDraws = prevReturning;
        await doc.save();
    });
    return { confirmMsg, undoToken };
}

// --- DELETE (draws) --- called from index.js's mng_delconfirm_ dispatch with the resolved match.
async function deleteDraw(match, actorId) {
    const SeasonalData = require('../../models/SeasonalData');
    const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
    const removedDoc = match.doc;
    if (match.type === 'new') seasonalDoc.newDraws = seasonalDoc.newDraws.filter(d => d._id.toString() !== match.id);
    else seasonalDoc.returningDraws = seasonalDoc.returningDraws.filter(d => d._id.toString() !== match.id);
    await seasonalDoc.save();
    recordChange({ actorId, page: 'draws', action: 'delete', model: 'SeasonalData', target: match.label, summary: `Deleted draw "${match.label}"` });
    return registerUndo(`Delete draw "${match.label}"`, async () => {
        const doc = await SeasonalData.findOne({ docType: 'global' });
        if (match.type === 'new') doc.newDraws.push(removedDoc); else doc.returningDraws.push(removedDoc);
        await doc.save();
    });
}

module.exports = { addDraw, editDraw, bulkAddOrReplaceDraws, bulkDeleteDraws, purgeDraws, deleteDraw };
