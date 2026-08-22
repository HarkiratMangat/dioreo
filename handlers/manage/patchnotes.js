// ==========================================
// /manage — PATCH NOTES PAGE
// ==========================================
// Patch Notes operates on a single "current entry" model (the last item in patchNotes[]) rather than a search-and-pick flow -- see .claude/rules/manage-panel.md's Patch Notes bullet for the full design reasoning. Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js, which owns the customId parsing and the generic confirm/cancel glue.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and .claude/rules/interaction-router.md.
//
// ⚠️ MUTATIONS ROUTE THROUGH THE OPERATION CORE (core/changeset.js's commitSet), as of plan 2 Task 4 (2026-08-21 13:06 EDT). core/ops/patchnotes.js's setDateInfo/setUrls1/setUrls2 all require an EXISTING entry (element-identity, matching draws.edit/calendar.edit) -- they cannot create one on demand the way the pre-core getOrCreateCurrentPatch() did. So when no entry exists yet (fresh install, or right after Wipe Season), this handler routes the SAME submission into a single patchnote.addSeason op instead -- addSeason's own payload already accepts titleOverride/description/releaseDate/urls1/urls2, so folding one action's fields into it needs no chaining across two ops (commitSet validates every op BEFORE any of them apply, so a later op can never target an id an earlier op in the same batch just minted). The confirmation wording always matches which BUTTON was clicked, not which op actually ran underneath. Undo now lives on /bot analytics' Changes page (core/revert.js) -- the old in-memory Undo mechanism is GONE from every mutation here (see handlers/manage/shared.js's own header for where it used to live), except purge, which still returns a confirmMsg the same shape as every other page's purge().

const { commitSet } = require('../../core/changeset');
const { loadOrCreateSeasonalDoc, prompt, extractCommitError } = require('./shared');
// The "current entry" is simply the last item in patchNotes[] -- null when the array is empty.
async function currentPatchElementId() {
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    if (!seasonalDoc.patchNotes.length) return null;
    return String(seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1]._id);
}

// --- DATE/INFO --- custom_id: modal_patch_dateinfo
async function setDateInfo(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const UserPreference = require('../../models/UserPreference');
    const adminPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
    const releaseDate = interaction.fields.getTextInputValue('release_date');
    const description = interaction.fields.getTextInputValue('description')?.trim() || '';
    const titleOverride = interaction.fields.getTextInputValue('season_title')?.trim() || '';

    const elementId = await currentPatchElementId();
    const op = elementId
        ? { type: 'patchnote.setDateInfo', target: { elementId },
            payload: { releaseDate, timezone: adminPrefs?.timezone, description, titleOverride } }
        : { type: 'patchnote.addSeason',
            payload: { releaseDate, timezone: adminPrefs?.timezone, description, titleOverride } };

    const result = await commitSet([op], { actorId: interaction.user.id });
    if (!result.ok) {
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    return interaction.followUp({ content: `✅ **Patch Notes Date/Info Updated!** ${result.results[0].change.target}` });
}

// --- URLS 1 / URLS 2 --- custom_id: modal_patch_urls_{1|2} Each of the 5 URLs is its own field -- a blank field means "no image in this slot". URLs 1 owns images[0..4], URLs 2 owns images[5..9] -- each submit only replaces its own half, preserving whatever the other slot has saved.
async function setUrls(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const customId = interaction.customId;
    const slot = customId === 'modal_patch_urls_1' ? 1 : 2;
    const rawUrls = [0, 1, 2, 3, 4].map(i => interaction.fields.getTextInputValue(`url${i}`));

    const elementId = await currentPatchElementId();
    const op = elementId
        ? { type: `patchnote.setUrls${slot}`, target: { elementId }, payload: { urls: rawUrls } }
        : { type: 'patchnote.addSeason', payload: slot === 1 ? { urls1: rawUrls } : { urls2: rawUrls } };

    const result = await commitSet([op], { actorId: interaction.user.id });
    if (!result.ok) {
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { title, imageCount } = result.results[0].applied;
    return interaction.followUp({ content: `✅ **Patch Notes URLs ${slot} Updated!** ${title} now has ${imageCount} image(s) total.` });
}

// --- ADD NEW SEASON --- custom_id: modal_patch_addseason Always PUSHES a brand-new patchNotes[] entry, becoming the new "current" entry (the old current entry automatically becomes a past season). URLs come in as two multi-line fields instead of 5 individually-addressable Short fields, matching the original mockup shape.
async function addSeason(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const UserPreference = require('../../models/UserPreference');
    const adminPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
    // Filter-then-slice, same order as the pre-core handler -- taking the first 5 RAW lines before filtering out blanks/non-http would silently drop a later valid url in favor of an earlier blank one.
    const parseUrlLines = text => (text || '').split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http')).slice(0, 5);

    const result = await commitSet(
        [{ type: 'patchnote.addSeason',
           payload: {
               titleOverride: interaction.fields.getTextInputValue('season_title')?.trim() || '',
               description: interaction.fields.getTextInputValue('description')?.trim() || '',
               releaseDate: interaction.fields.getTextInputValue('release_date'), timezone: adminPrefs?.timezone,
               urls1: parseUrlLines(interaction.fields.getTextInputValue('urls1')),
               urls2: parseUrlLines(interaction.fields.getTextInputValue('urls2'))
           } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { title, imageCount } = result.results[0].applied;
    return interaction.followUp({ content: `✅ **New Season Added!** "${title}" is now the Current Season (${imageCount} image(s)). The previous entry has moved to Past Seasons.` });
}

// --- PAST SEASONS: EDIT --- custom_id: modal_patch_editseason_{id} Updates ONE SPECIFIC existing entry in place (picked via handlePatchSeasonPick below), never touches which entry is "current".
async function editSeason(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const entryId = interaction.customId.replace('modal_patch_editseason_', '');
    const UserPreference = require('../../models/UserPreference');
    const adminPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
    const parseUrlLines = text => (text || '').split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http')).slice(0, 5);

    const result = await commitSet(
        [{ type: 'patchnote.editSeason', target: { elementId: entryId },
           payload: {
               titleOverride: interaction.fields.getTextInputValue('season_title')?.trim() || '',
               description: interaction.fields.getTextInputValue('description')?.trim() || '',
               releaseDate: interaction.fields.getTextInputValue('release_date'), timezone: adminPrefs?.timezone,
               urls1: parseUrlLines(interaction.fields.getTextInputValue('urls1')),
               urls2: parseUrlLines(interaction.fields.getTextInputValue('urls2'))
           } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        // Matches the pre-core handler's own wording for a stale/removed target.
        if (result.failedAt?.reason === 'missing') {
            return await interaction.followUp({ content: '❌ That season no longer exists -- it may have been changed or removed since this modal opened.' });
        }
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { title, imageCount } = result.results[0].applied;
    return interaction.followUp({ content: `✅ **Past Season Updated!** "${title}" now has ${imageCount} image(s).` });
}

// --- PURGE (patch notes) --- called from index.js's mng_purgeconfirm_ dispatch. Only scope 'all' -- the one place patch notes HISTORY can actually be cleared (distinct from "Wipe Season", which deliberately keeps patch notes forever).
async function purge(actorId) {
    const result = await commitSet([{ type: 'patchnote.purge' }], { actorId });
    if (!result.ok) {
        return { confirmMsg: `❌ ${extractCommitError(result)}` };
    }
    const { applied } = result.results[0];
    return { confirmMsg: `✅ Purged the patch notes history (${applied.entries.length} entry(s) removed).` };
}

// --- PAST SEASONS PICK --- custom_id: mng_patchseason_pick (select menu, rendered on the Patch Notes page itself). Its options ARE the full list already, so picking one goes straight to its edit modal -- no search step, unlike the generic mng_pick_ disambiguation select. Read-only -- unchanged by the operation-core migration.
async function handlePatchSeasonPick(interaction) {
    const pickedId = interaction.values[0];
    if (pickedId === 'none') return await interaction.deferUpdate(); // the disabled placeholder option -- shouldn't normally fire, but no-op if it somehow does
    const { loadSeasonalDoc } = require('../../utils/manageActions');
    const seasonalDoc = await loadSeasonalDoc();
    const entry = seasonalDoc?.patchNotes?.find(p => p._id.toString() === pickedId);
    if (!entry) {
        try {
            await prompt(interaction, { text: '❌ That season no longer exists -- it may have been changed or removed since this panel loaded.' });
        } catch (notifyError) {
            console.error('Failed to notify user of stale patch-season pick (interaction likely expired):', notifyError);
        }
        return;
    }
    const manageCommand = interaction.client.commands.get('manage');
    const UserPreference = require('../../models/UserPreference');
    const adminPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
    return await interaction.showModal(manageCommand.buildPatchEditSeasonModal(entry, adminPrefs?.timezone));
}

module.exports = { setDateInfo, setUrls, addSeason, editSeason, purge, handlePatchSeasonPick };
