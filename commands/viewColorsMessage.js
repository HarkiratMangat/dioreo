// ==========================================
// RIGHT-CLICK A MESSAGE → APPS → "View Colors" (message context menu, PUBLIC)
// ==========================================
// The same panel as right-clicking a user, opened from one of their messages instead (Harkirat, 2026-10-19 15:22 EDT: "Can you implement the color command if I tap and hold on a message instead of the users literal avatar?"). On the phone, holding a message is the easy gesture; reaching the avatar's own menu is not.
//
// Everything about the panel is commands/viewColors.js's: whose colours (the message's author), who may press its buttons (anyone), public by default, no idle timeout. Only the subject comes from somewhere else: interaction.targetMessage.author, and its member when the message was sent in a server.
//
// ⚠️ It shares the label "View Colors" with the user right-click. Discord allows that across the two types, but client.commands is keyed by name, so bot/registry.js also stores every right-click under `name#type` and the router looks that key up first.
const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const { renderPanel } = require('./viewColors');
const { sendV2Payload } = require('../utils/sendV2Payload');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('View Colors')
        .setType(ApplicationCommandType.Message)
        // PUBLIC, like the user right-click: guild and user install, every context.
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]),

    async execute(interaction) {
        await interaction.deferReply();
        const message = interaction.targetMessage;
        const { panel, files } = await renderPanel(interaction, message.author, message.member || null, 'avatar');
        return await sendV2Payload(interaction, panel, { flags: 32768, allowedMentions: { users: [] }, files, skipExpiry: true });
    },
};
