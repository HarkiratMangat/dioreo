// ==========================================
// RIGHT-CLICK → APPS → "Autobuild Loadout" (message context menu)
// ==========================================
// Right-click a Gunsmith screenshot (a post, or a forward of one) and it goes straight into /autobuild's reader and review card (Harkirat, 2026-10-19 11:11 EDT: "lets builds them all except the announcement one"). Built 2026-10-19 11:16 EDT.
//
// One image runs at once. Several ask which one first: the picker is held in memory for 30 minutes, because a forward cannot be re-read later (its snapshot comes back blank over REST without the Message Content intent), and its select (`autobuild_pick|`) is answered in handlers/autobuild.js, under the router's own /autobuild lock.
const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');
const { hasCommandAccess } = require('../utils/adminAccess');
const { extractSource } = require('../utils/patchNoteSource');
const { sendV2Payload } = require('../utils/sendV2Payload');

const HOLD_MS = 30 * 60 * 1000;
const held = new Map(); // key -> { images, at }

function hold(key, images) {
    const now = Date.now();
    for (const [k, v] of held) if (now - v.at > HOLD_MS) held.delete(k);
    held.set(key, { images, at: now });
}

function heldFor(key) {
    const v = held.get(key);
    if (!v || Date.now() - v.at > HOLD_MS) { held.delete(key); return null; }
    return v;
}

function buildPicker(key, images) {
    const shown = images.slice(0, 10);
    return [{ type: 17, components: [
        { type: 10, content: `## Autobuild Loadout\nThis message has **${images.length} images**. Pick the Gunsmith screenshot.` },
        { type: 12, items: shown.map((url, i) => ({ media: { url }, description: `Image ${i + 1}` })) },
        { type: 1, components: [{
            type: 3, custom_id: `autobuild_pick|${key}`, placeholder: 'Pick the screenshot to read',
            options: shown.map((_, i) => ({ label: `Image ${i + 1}`, value: String(i) })),
        }] },
    ] }];
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Autobuild Loadout')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(0)
        // ADMIN-ONLY, like /autobuild: user-install only, and in bot/registry.js's ADMIN_COMMAND_NAMES.
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),
    buildPicker,
    heldFor,

    async execute(interaction) {
        if (!(await hasCommandAccess(interaction.user.id, 'autobuild'))) {
            return await interaction.reply({ content: "🔒 **This one's admin-only.** Try any of the bot's public commands instead!", flags: MessageFlags.Ephemeral });
        }
        const { images } = extractSource(interaction.targetMessage);
        if (!images.length) {
            return await interaction.reply({ content: 'No images found on that message.', flags: MessageFlags.Ephemeral });
        }
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (images.length === 1) {
            const { runExtraction } = require('../utils/autobuildPipeline');
            return await runExtraction(interaction, images[0], null, null);
        }
        hold(interaction.id, images);
        return await sendV2Payload(interaction, buildPicker(interaction.id, images));
    },
};
