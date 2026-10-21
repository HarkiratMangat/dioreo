// ==========================================
// "ADD TO PATCH NOTES" — THE PANEL'S DROPDOWN AND BUTTONS
// ==========================================
// Answers the private panel commands/addToPatchNotes.js posts after a right-click (added 2026-10-19 10:22 EDT). The season dropdown redraws the panel; Add / Replace / Create open /manage's own Add New Season or Edit Season box, pre-filled, whose submit (modal_patch_addseason / modal_patch_editseason_{id}) is handled by handlers/manage/patchnotes.js like any /manage edit.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Awaited inside handlers/router.js's one try/catch: nothing here swallows, and every error reply is awaited in its own small try/catch. See .claude/rules/interaction-router.md.
//
// ⚠️ MIXED TYPES, SO EVERY BRANCH TYPE-TESTS: `ptn_season|` is a select, the rest are buttons.
//
// ⚠️ GATED HERE, NOT IN THE ROUTER'S ADMIN LOCK: every click checks the Patch Notes page itself (per-click, like utils/manageActions.js's resolveAction), which is stricter than the lock's 'manage' token. The lock's prefix list must equal what handlers/manage/, /autobuild and /bot declare (scripts/handlerRouting.test.js check 10), so `ptn_` stays out of it.

const BOT_EMOJI = require('../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { canDo, denyDo } = require('../utils/adminAccess');
const { mergeImages, mergeInfo } = require('../utils/patchNoteSource');
const { formatReleaseDateTime } = require('../utils/adminParser');
const { sendV2Payload } = require('../utils/sendV2Payload');

const OWNED_PREFIXES = ['ptn_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function notify(interaction, content) {
    try {
        await interaction.reply({ content, flags: 64 });
    } catch (notifyError) {
        console.error('Add to Patch Notes: could not send a notice (interaction likely expired):', notifyError);
    }
}

async function route(interaction) {
    if (!(await canDo(interaction.user.id, 'rightclick.addToPatchNotes'))) {
        return await notify(interaction, denyDo('rightclick.addToPatchNotes'));
    }
    const command = interaction.client.commands.get('Add to Patch Notes');
    const [, key, seasonId] = interaction.customId.split('|');
    const source = command?.heldFor(key);
    if (!source) {
        return await notify(interaction, "These images aren't held any more (the bot restarted, or 30 minutes passed). Right-click the message again.");
    }
    const { loadSeasonalDoc } = require('../utils/manageActions');
    const seasonalDoc = await loadSeasonalDoc();

    // THE SEASON DROPDOWN -- `ptn_season|{key}`. Redraws the panel on the picked season.
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('ptn_season|')) {
        await interaction.deferUpdate();
        return await sendV2Payload(interaction, command.buildPanel(key, source, seasonalDoc, interaction.values[0]));
    }

    if (!interaction.isButton()) return;
    const UserPreference = require('../models/UserPreference');
    const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
    const manageCommand = interaction.client.commands.get('manage');
    const postedDate = source.postedAt ? formatReleaseDateTime(source.postedAt, prefs?.timezone) : '';

    // CREATE SEASON -- `ptn_new|{key}`. The Add New Season box: title blank for him to type, release date = the post's date, the new images.
    if (interaction.isButton() && interaction.customId.startsWith('ptn_new|')) {
        return await interaction.showModal(manageCommand.buildPatchAddSeasonModal({
            releaseDate: postedDate, description: source.info, images: source.images.slice(0, 10),
        }));
    }

    // ADD / REPLACE -- `ptn_add|{key}|{id}`, `ptn_replace|{key}|{id}`. The Edit Season box on that season, its own fields kept.
    if (interaction.isButton() && (interaction.customId.startsWith('ptn_add|') || interaction.customId.startsWith('ptn_replace|'))) {
        const entry = seasonalDoc?.patchNotes?.find(p => String(p._id) === seasonId);
        if (!entry) return await notify(interaction, BOT_EMOJI.cross + ' That season no longer exists. Right-click the message again to pick another.');
        const { images } = mergeImages(entry.images, source.images, interaction.customId.startsWith('ptn_add|') ? 'add' : 'replace');
        return await interaction.showModal(manageCommand.buildPatchEditSeasonModal(entry, prefs?.timezone, {
            images,
            description: mergeInfo(entry.description, source.info),
            // The post's date only fills a season that has none (Harkirat, 2026-10-19 10:19 EDT: "dont overwrite. only fill if its blank").
            releaseDateIfBlank: postedDate,
            modalTitle: interaction.customId.startsWith('ptn_add|') ? 'Add Images to Season' : 'Replace Season Images',
        }));
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleAddToPatchNotesInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleAddToPatchNotesInteraction, OWNED_PREFIXES };
