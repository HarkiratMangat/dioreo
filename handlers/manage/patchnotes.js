// ==========================================
// /manage — PATCH NOTES PAGE
// ==========================================
// Patch Notes operates on a single "current entry" model (the last item in patchNotes[]) rather than a search-and-pick flow -- see .claude/rules/manage-panel.md's Patch Notes bullet for the full design reasoning. Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js, which owns the customId parsing and the generic confirm/cancel glue.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and .claude/rules/interaction-router.md.

const { recordChange } = require('../../utils/changeStore');
const { registerUndo, loadOrCreateSeasonalDoc, prompt } = require('./shared');

// All 3 dateinfo/urls1/urls2 actions operate on the LAST item in patchNotes[] -- the one whose title stays synced to currentSeasonTitle. If none exists yet at all (fresh install, or right after a Wipe Season), whichever of these 3 is submitted first creates it.
function getOrCreateCurrentPatch(seasonalDoc) {
    if (seasonalDoc.patchNotes.length === 0) {
        seasonalDoc.patchNotes.push({ title: seasonalDoc.currentSeasonTitle || 'Untitled Season', description: '', releaseDate: new Date(), images: [] });
    }
    return seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1];
}

// --- DATE/INFO --- custom_id: modal_patch_dateinfo
async function setDateInfo(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseReleaseDateTime } = require('../../utils/adminParser');
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const current = getOrCreateCurrentPatch(seasonalDoc);
    // parseReleaseDateTime (not the plain parseAdminDate every other admin date field uses) -- patch notes release times are typed in the admin's own local clock whenever a time is included at all; see the function's own comment in adminParser.js for why this field alone gets that treatment.
    const UserPreference = require('../../models/UserPreference');
    const adminPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
    current.releaseDate = parseReleaseDateTime(interaction.fields.getTextInputValue('release_date'), adminPrefs?.timezone);
    current.description = interaction.fields.getTextInputValue('description')?.trim() || '';
    // Manual title override -- blank clears it, which reverts the effective display title back to the auto-synced `title` (currentSeasonTitle).
    current.titleOverride = interaction.fields.getTextInputValue('season_title')?.trim() || '';
    await seasonalDoc.save();
    // Keep this patch's cached images' Cloudinary metadata (release date/season) in sync -- the release date just changed and applies to every image of this entry.
    const { syncPatchEntryMetadata } = require('../../utils/patchNotesCache');
    const { displayTitle } = require('../../commands/patchnotes');
    const effectiveTitle = displayTitle(current);
    await syncPatchEntryMetadata(current, effectiveTitle);
    recordChange({ actorId: interaction.user.id, page: 'patchnotes', action: 'edit', model: 'SeasonalData', target: effectiveTitle, summary: `Updated Patch Notes date/info for "${effectiveTitle}"` });
    return interaction.followUp({ content: `✅ **Patch Notes Date/Info Updated!** ${effectiveTitle}` });
}

// --- URLS 1 / URLS 2 --- custom_id: modal_patch_urls_{1|2} Each of the 5 URLs is its own field -- a blank field means "no image in this slot". URLs 1 owns images[0..4], URLs 2 owns images[5..9] -- each submit only replaces its own half, preserving whatever the other slot has saved.
async function setUrls(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const customId = interaction.customId;
    const slot = customId === 'modal_patch_urls_1' ? 1 : 2;
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const current = getOrCreateCurrentPatch(seasonalDoc);
    const rawUrls = [0, 1, 2, 3, 4]
        .map(i => interaction.fields.getTextInputValue(`url${i}`)?.trim())
        .filter(url => url && url.startsWith('http'));

    // Re-host each submitted URL into this season's own Cloudinary folder, keyed by this patch note's own _id -- NOT the season title, since a title can be renamed later without touching this doc's _id. slotOffset maps each field to its ABSOLUTE position in images[] (URLs 1 = 0-4, URLs 2 = 5-9) so re-submitting a slot overwrites the same cached asset in place rather than accumulating duplicates. A Cloudinary hiccup must never block the save -- cachePatchImage() falls back to the raw URL on failure.
    const { cachePatchImage } = require('../../utils/patchNotesCache');
    const { displayTitle } = require('../../commands/patchnotes');
    const patchId = current._id.toString();
    const slotOffset = slot === 1 ? 0 : 5;
    const patchMeta = { season: displayTitle(current), releaseDate: current.releaseDate };
    const newSlice = [];
    for (let i = 0; i < rawUrls.length; i++) {
        const result = await cachePatchImage(patchId, slotOffset + i, rawUrls[i], patchMeta);
        newSlice.push(result.url);
    }

    const otherSlice = slot === 1 ? current.images.slice(5, 10) : current.images.slice(0, 5);
    current.images = slot === 1 ? [...newSlice, ...otherSlice] : [...otherSlice, ...newSlice];

    await seasonalDoc.save();
    recordChange({ actorId: interaction.user.id, page: 'patchnotes', action: 'edit', model: 'SeasonalData', target: displayTitle(current), summary: `Updated Patch Notes URLs ${slot} for "${displayTitle(current)}"` });
    return interaction.followUp({ content: `✅ **Patch Notes URLs ${slot} Updated!** ${displayTitle(current)} now has ${current.images.length} image(s) total.` });
}

// --- ADD NEW SEASON --- custom_id: modal_patch_addseason Always PUSHES a brand-new patchNotes[] entry, becoming the new "current" entry (the old current entry automatically becomes a past season). URLs come in as two multi-line fields instead of 5 individually-addressable Short fields, matching the original mockup shape.
async function addSeason(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseReleaseDateTime } = require('../../utils/adminParser');
    const parseUrlLines = text => (text || '').split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http')).slice(0, 5);
    const urlList = [...parseUrlLines(interaction.fields.getTextInputValue('urls1')), ...parseUrlLines(interaction.fields.getTextInputValue('urls2'))];

    const UserPreference = require('../../models/UserPreference');
    const adminPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    seasonalDoc.patchNotes.push({
        title: seasonalDoc.currentSeasonTitle || 'Untitled Season',
        titleOverride: interaction.fields.getTextInputValue('season_title')?.trim() || '',
        description: interaction.fields.getTextInputValue('description')?.trim() || '',
        releaseDate: parseReleaseDateTime(interaction.fields.getTextInputValue('release_date'), adminPrefs?.timezone),
        images: []
    });
    const newEntry = seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1];

    const { cachePatchImage } = require('../../utils/patchNotesCache');
    const { displayTitle } = require('../../commands/patchnotes');
    const patchId = newEntry._id.toString();
    const patchMeta = { season: displayTitle(newEntry), releaseDate: newEntry.releaseDate };
    const cachedUrls = [];
    for (let i = 0; i < urlList.length; i++) {
        const result = await cachePatchImage(patchId, i, urlList[i], patchMeta);
        cachedUrls.push(result.url);
    }
    newEntry.images = cachedUrls;

    await seasonalDoc.save();
    recordChange({ actorId: interaction.user.id, page: 'patchnotes', action: 'add', model: 'SeasonalData', target: displayTitle(newEntry), summary: `Added new Patch Notes season "${displayTitle(newEntry)}"` });
    return interaction.followUp({ content: `✅ **New Season Added!** "${displayTitle(newEntry)}" is now the Current Season (${cachedUrls.length} image(s)). The previous entry has moved to Past Seasons.` });
}

// --- PAST SEASONS: EDIT --- custom_id: modal_patch_editseason_{id} Updates ONE SPECIFIC existing entry in place (picked via handlePatchSeasonPick below), never touches which entry is "current".
async function editSeason(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseReleaseDateTime } = require('../../utils/adminParser');
    const entryId = interaction.customId.replace('modal_patch_editseason_', '');
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const entry = seasonalDoc.patchNotes.id(entryId);
    if (!entry) return await interaction.followUp({ content: '❌ That season no longer exists -- it may have been changed or removed since this modal opened.' });

    entry.titleOverride = interaction.fields.getTextInputValue('season_title')?.trim() || '';
    const UserPreference = require('../../models/UserPreference');
    const adminPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
    entry.releaseDate = parseReleaseDateTime(interaction.fields.getTextInputValue('release_date'), adminPrefs?.timezone);
    entry.description = interaction.fields.getTextInputValue('description')?.trim() || '';

    const parseUrlLines = text => (text || '').split('\n').map(u => u.trim()).filter(u => u && u.startsWith('http')).slice(0, 5);
    const urlList = [...parseUrlLines(interaction.fields.getTextInputValue('urls1')), ...parseUrlLines(interaction.fields.getTextInputValue('urls2'))];

    const { cachePatchImage } = require('../../utils/patchNotesCache');
    const { displayTitle } = require('../../commands/patchnotes');
    const patchId = entry._id.toString();
    const patchMeta = { season: displayTitle(entry), releaseDate: entry.releaseDate };
    const cachedUrls = [];
    for (let i = 0; i < urlList.length; i++) {
        const result = await cachePatchImage(patchId, i, urlList[i], patchMeta);
        cachedUrls.push(result.url);
    }
    entry.images = cachedUrls;

    await seasonalDoc.save();
    recordChange({ actorId: interaction.user.id, page: 'patchnotes', action: 'edit', model: 'SeasonalData', target: displayTitle(entry), summary: `Edited past Patch Notes season "${displayTitle(entry)}"` });
    return interaction.followUp({ content: `✅ **Past Season Updated!** "${displayTitle(entry)}" now has ${cachedUrls.length} image(s).` });
}

// --- PURGE (patch notes) --- called from index.js's mng_purgeconfirm_ dispatch. Only scope 'all' -- the one place patch notes HISTORY can actually be cleared (distinct from "Wipe Season", which deliberately keeps patch notes forever).
async function purge(actorId) {
    const SeasonalData = require('../../models/SeasonalData');
    const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
    const prevPatchNotes = seasonalDoc.patchNotes;
    seasonalDoc.patchNotes = [];
    await seasonalDoc.save();
    const confirmMsg = `✅ Purged the patch notes history (${prevPatchNotes.length} entry(s) removed).`;
    recordChange({ actorId, page: 'patchnotes', action: 'purge', model: 'SeasonalData', target: 'all', summary: confirmMsg });
    const undoToken = registerUndo('Purge (patch notes history)', async () => {
        const doc = await SeasonalData.findOne({ docType: 'global' });
        doc.patchNotes = prevPatchNotes;
        await doc.save();
    });
    return { confirmMsg, undoToken };
}

// --- PAST SEASONS PICK --- custom_id: mng_patchseason_pick (select menu, rendered on the Patch Notes page itself). Its options ARE the full list already, so picking one goes straight to its edit modal -- no search step, unlike the generic mng_pick_ disambiguation select.
async function handlePatchSeasonPick(interaction) {
    const pickedId = interaction.values[0];
    if (pickedId === 'none') return await interaction.deferUpdate(); // the disabled placeholder option -- shouldn't normally fire, but no-op if it somehow does
    const SeasonalData = require('../../models/SeasonalData');
    const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
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
