// ==========================================
// /manage — DRAWS PAGE
// ==========================================
// Every DB-mutating operation the Draws page reaches: single add/edit, bulk add/replace/delete, and purge. Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/ 2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js, which owns the customId parsing and the generic confirm/cancel glue. See handlers/manage/shared.js for thumbnailNote/resolveThumbnailsForDraws/extractCommitError/loadOrCreateSeasonalDoc, all shared with calendar.js/season.js -- the old in-memory Undo mechanism that also used to live there was retired in plan 2 Task 7.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Every function here is awaited from inside handlers/router.js's single top-level try/catch (via handlers/manage/index.js) -- do NOT add a try/catch here that swallows, and keep every error-branch reply an AWAITED call. See .claude/rules/interaction-router.md.
//
// ⚠️ MUTATIONS ROUTE THROUGH THE OPERATION CORE (core/changeset.js's commitSet), as of the portal operation core (plan 1 Task 6, 2026-08-20 23:51 EDT). Every mutation body below used to read the document, mutate it in memory, .save() it, then call utils/changeStore.js's recordChange() -- that write path still exists (utils/changeStore.js) but this page no longer calls it directly. commitSet() applies the op transactionally, records the ChangeLog row itself with an `inverse`, and returns the changeId. Undo for draws-page changes now lives on /bot analytics' Changes page (core/revert.js, Task 7) instead of the inline Undo button that used to render here -- that mechanism is simply GONE from this file, not replaced. Modal parsing and reply formatting are UNTOUCHED; only the mutate+audit section of each function changed. See core/ops/draws.js for the op contract, and its own header for two real defects (bulkReplace's merge semantics, and the bulk-parse payload shape) found and fixed during this exact integration pass.

const { resolveThumbnail } = require('../../utils/cloudinaryCache');
const { commitSet } = require('../../core/changeset');
const {
    thumbnailNote, loadOrCreateSeasonalDoc, registerBulkDelete, extractCommitError
} = require('./shared');

// --- SAVE NEW SINGLE DRAW --- custom_id: add_draw_{new|returning}
async function addDraw(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { toTitleCase, parseItemLine, parseAdminDate, parseBulkDrawList } = require('../../utils/adminParser');
    const customId = interaction.customId;
    const drawType = customId.replace('add_draw_', '');

    // 5th field: an alternative to filling in the 4 separate fields below -- paste the whole draw as one bulk-style line and it's run through the SAME parser bulk import uses. All 5 fields are setRequired(false) (see commands/manage.js's buildAddDrawModal), so Discord itself won't block a submit with only this one filled.
    const combinedLine = interaction.fields.getTextInputValue('combined')?.trim();

    let newDrawObj;
    let cloudinaryWarning = null;

    if (combinedLine) {
        const [parsed] = parseBulkDrawList(combinedLine);
        if (!parsed) {
            return interaction.followUp({ content: '❌ Could not parse that line -- expected format: `Title, m Item 1, l Item 2, Date, URL` (URL optional).' });
        }
        // No URL + no cache hit used to hard-reject the whole submission -- relaxed 2026-08-22 19:40 EDT (click-test fix): a draw's info is sometimes known before any image exists to link/cache. thumbnailUrl has no `required` on the schema (models/SeasonalData.js) -- this was purely an app-level choice. commands/draws.js's render renders a plain no-image row instead of a broken thumbnail when thumbnailUrl is null.
        const thumbResult = await resolveThumbnail(parsed.title, parsed.thumbnailUrl);
        cloudinaryWarning = thumbResult.url ? thumbnailNote(thumbResult) : '⚠️ No image URL provided and none cached for this title -- draw saved without an image.';
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

        // URL is optional -- blank reuses a Cloudinary cache hit for this exact title if one exists. No URL AND no cache hit used to be a hard rejection; relaxed 2026-08-22 19:40 EDT (click-test fix) to save without an image instead -- see the combined-line branch above for the full reasoning.
        const thumbResult = await resolveThumbnail(title, rawUrl);
        cloudinaryWarning = thumbResult.url ? thumbnailNote(thumbResult) : '⚠️ No image URL provided and none cached for this title -- draw saved without an image.';

        const parsedItems = rawItems.split('\n').filter(l => l.trim().length > 0).map(parseItemLine);
        newDrawObj = { title, items: parsedItems, date: parsedSingleDate, thumbnailUrl: thumbResult.url };
    }

    const result = await commitSet(
        [{ type: 'draw.add', payload: { ...newDrawObj, category: drawType } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }

    let confirmation = `✅ **Draw Added:** "${newDrawObj.title}" (${drawType === 'new' ? 'New' : 'Returning'}, ${newDrawObj.items.length} item(s), releases <t:${Math.floor(new Date(newDrawObj.date).getTime() / 1000)}:D>).`;
    if (cloudinaryWarning) confirmation += `\n${cloudinaryWarning}`;
    return interaction.followUp({ content: confirmation });
}

// --- SAVE EDITED DRAW --- custom_id: edit_draw_{id}_{new|returning}
async function editDraw(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { toTitleCase, parseItemLine, parseAdminDate } = require('../../utils/adminParser');
    const [_, __, targetId, drawType] = interaction.customId.split('_');

    // Existence pre-check kept exactly as before the refactor -- draw.edit's op would also report this as `reason: 'missing'`, but the pre-core handler simply returned with no reply at all when the id wasn't found (a stale search result), and this preserves that exact silent behaviour rather than introducing a new error reply where none existed.
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const arrayTarget = drawType === 'new' ? seasonalDoc.newDraws : seasonalDoc.returningDraws;
    const drawIndex = arrayTarget.findIndex(d => d._id.toString() === targetId);

    if (drawIndex > -1) {
        const drawDateStr = interaction.fields.getTextInputValue('date');
        const parsedDrawDate = parseAdminDate(drawDateStr);
        if (!parsedDrawDate) return interaction.followUp({ content: `❌ Date "${drawDateStr}" wasn't understood -- nothing was saved.` });
        const newTitle = toTitleCase(interaction.fields.getTextInputValue('title'));

        // URL field is optional -- blank reuses whatever's cached in Cloudinary for this draw's (possibly just-renamed) title. No URL AND no cache hit used to be a hard rejection; relaxed 2026-08-22 19:40 EDT (click-test fix) to save without an image instead (matches addDraw's same-day fix) rather than blocking an otherwise-valid edit.
        const rawUrl = interaction.fields.getTextInputValue('url');
        const thumbResult = await resolveThumbnail(newTitle, rawUrl);

        const rawItems = interaction.fields.getTextInputValue('items');
        const parsedItems = rawItems.split('\n').filter(l => l.trim().length > 0).map(parseItemLine);

        const result = await commitSet(
            [{ type: 'draw.edit', target: { elementId: targetId, category: drawType },
               payload: { title: newTitle, date: parsedDrawDate, thumbnailUrl: thumbResult.url, items: parsedItems } }],
            { actorId: interaction.user.id }
        );
        if (!result.ok) {
            const why = extractCommitError(result);
            return await interaction.followUp({ content: `❌ ${why}` });
        }

        let confirmation = `✅ **Draw Updated:** "${newTitle}" (${drawType === 'new' ? 'New' : 'Returning'}, ${parsedItems.length} item(s), releases <t:${Math.floor(parsedDrawDate.getTime() / 1000)}:D>).`;
        const editThumbNote = thumbResult.url ? thumbnailNote(thumbResult) : '⚠️ No image URL provided and none cached for this title -- draw saved without an image.';
        if (editThumbNote) confirmation += `\n${editThumbNote}`;
        return interaction.followUp({ content: confirmation });
    }
}

// --- BULK ADD/REPLACE BOTH DRAW CATEGORIES AT ONCE --- custom_id: modal_draws_bulk_{add|replace}_both One modal, two independently-optional fields -- only whichever field was actually filled in gets touched. Replace upserts by fuzzy-matched title (update in place, keep _id) rather than wholesale- overwriting the array; Add just appends everything parsed. Both categories commit in ONE changeset (matching the pre-core handler's single seasonalDoc.save() for both).
async function bulkAddOrReplaceDraws(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const customId = interaction.customId;
    const mode = customId === 'modal_draws_bulk_add_both' ? 'add' : 'replace';
    const opType = mode === 'add' ? 'draw.bulkAdd' : 'draw.bulkReplace';
    const newText = interaction.fields.getTextInputValue('new_text')?.trim();
    const returningText = interaction.fields.getTextInputValue('returning_text')?.trim();

    if (!newText && !returningText) {
        return interaction.followUp({ content: '❌ Both fields were left blank -- nothing was changed.' });
    }

    const ops = [];
    if (newText) ops.push({ type: opType, target: { category: 'new' }, payload: { text: newText } });
    if (returningText) ops.push({ type: opType, target: { category: 'returning' }, payload: { text: returningText } });

    const result = await commitSet(ops, { actorId: interaction.user.id });
    if (!result.ok) {
        const why = result.failures?.map(f => f.errors.join(' ')).join(' ') || result.error;
        return await interaction.followUp({ content: `❌ ${why}` });
    }

    const updated = [];
    const allSkipped = [];
    const allWarnings = [];
    for (const r of result.results) {
        const label = r.applied.category === 'new' ? 'New Draws' : 'Returning Draws';
        if (mode === 'add') {
            const titleList = r.applied.added.map(d => `"${d.title}"`).join(', ');
            updated.push(`**${label}:** added ${r.applied.ids.length} (now ${r.applied.total} total)`
                + (titleList ? `\n-# ${titleList}` : ''));
            allSkipped.push(...r.applied.skipped);
            allWarnings.push(...r.applied.warnings);
        } else {
            updated.push(`**${label}:** updated ${r.applied.updatedCount}, added ${r.applied.insertedCount} (now ${r.applied.total} total)`);
        }
    }

    let confirmation = `✅ **Bulk ${mode === 'add' ? 'Add' : 'Replace'} Complete!**\n${updated.join('\n')}`;
    if (allSkipped.length) confirmation += `\n⚠️ Skipped (no URL given and nothing cached yet): ${allSkipped.join(', ')}`;
    if (allWarnings.length) confirmation += `\n⚠️ Cloudinary caching failed, kept the original URL instead: ${allWarnings.join('; ')}`;
    return interaction.followUp({ content: confirmation });
}

// --- BULK DELETE DRAWS --- custom_id: modal_draws_bulk_remove_{new|returning|either} Dry-run only: computes what WOULD be removed and shows a Confirm/Cancel prompt; the actual save happens from index.js's mng_bulkdelconfirm_ dispatch, via the `apply()` closure stashed here.
async function bulkDeleteDraws(interaction) {
    const { fuzzyMatch } = require('../../utils/search');
    const customId = interaction.customId;
    const drawType = customId.replace('modal_draws_bulk_remove_', ''); // 'new' | 'returning' | 'either'
    const newTitlesRaw = drawType !== 'returning' ? interaction.fields.getTextInputValue('new_titles')?.trim() : '';
    const returningTitlesRaw = drawType !== 'new' ? interaction.fields.getTextInputValue('returning_titles')?.trim() : '';

    const seasonalDoc = await loadOrCreateSeasonalDoc();

    // Dry-run preview only -- fuzzy-matches against the CURRENT live doc, same as before the refactor, so the Confirm prompt shows real matches. The actual removal (by exact id, not a second fuzzy match against possibly-changed data) happens in the op's apply() on Confirm.
    function preview(array, titlesRaw) {
        const requested = titlesRaw.split('\n').map(t => t.trim()).filter(Boolean);
        const removedTitles = [], notFound = [], ids = [];
        let remaining = array;
        for (const title of requested) {
            const match = remaining.find(item => fuzzyMatch(title, item.title));
            if (match) { removedTitles.push(match.title); ids.push(String(match._id)); remaining = remaining.filter(i => i !== match); }
            else notFound.push(title);
        }
        return { removedTitles, notFound, ids };
    }

    const summary = [];
    const idsByPath = {};
    let anyRemoved = false;
    if (newTitlesRaw) {
        const { removedTitles, notFound, ids } = preview(seasonalDoc.newDraws, newTitlesRaw);
        if (removedTitles.length) { summary.push(`Removed from New: ${removedTitles.join(', ')}`); anyRemoved = true; idsByPath.newDraws = ids; }
        if (notFound.length) summary.push(`⚠️ Not found in New: ${notFound.join(', ')}`);
    }
    if (returningTitlesRaw) {
        const { removedTitles, notFound, ids } = preview(seasonalDoc.returningDraws, returningTitlesRaw);
        if (removedTitles.length) { summary.push(`Removed from Returning: ${removedTitles.join(', ')}`); anyRemoved = true; idsByPath.returningDraws = ids; }
        if (notFound.length) summary.push(`⚠️ Not found in Returning: ${notFound.join(', ')}`);
    }

    if (!anyRemoved) {
        return interaction.reply({ content: `❌ Nothing matched -- nothing to delete.\n${summary.join('\n')}`, ephemeral: true });
    }

    return registerBulkDelete(interaction, {
        description: 'Bulk Delete Draws',
        summary,
        apply: async () => {
            const result = await commitSet(
                [{ type: 'draw.bulkDelete', payload: { ids: idsByPath } }],
                { actorId: interaction.user.id }
            );
            if (!result.ok) throw new Error(result.failures?.map(f => f.errors.join(' ')).join(' ') || result.error);
            return null;   // Undo now lives on /bot analytics' Changes page (core/revert.js) -- no inline undo token.
        }
    });
}

// --- PURGE (draws) --- called from index.js's mng_purgeconfirm_ dispatch. scope: 'new'|'returning'|'all'.
async function purgeDraws(scope, actorId) {
    const result = await commitSet([{ type: 'draw.purge', target: { scope } }], { actorId });
    if (!result.ok) {
        return { confirmMsg: `❌ ${extractCommitError(result)}` };
    }
    const { applied } = result.results[0];
    const removedCounts = [];
    if (scope === 'new' || scope === 'all') removedCounts.push(`${applied.newDraws.length} New`);
    if (scope === 'returning' || scope === 'all') removedCounts.push(`${applied.returningDraws.length} Returning`);
    const confirmMsg = `✅ Purged ${scope === 'all' ? 'all New and Returning draws' : `all ${scope} draws`} (${removedCounts.join(', ')} removed).`;
    return { confirmMsg };
}

// --- DELETE (draws) --- called from index.js's mng_delconfirm_ dispatch with the resolved match.
async function deleteDraw(match, actorId) {
    const result = await commitSet(
        [{ type: 'draw.delete', target: { category: match.type, elementId: match.id } }],
        { actorId }
    );
    if (!result.ok) throw new Error(extractCommitError(result));
    return null;   // Undo now lives on /bot analytics' Changes page (core/revert.js) -- no inline undo token.
}

module.exports = { addDraw, editDraw, bulkAddOrReplaceDraws, bulkDeleteDraws, purgeDraws, deleteDraw };
