// ==========================================
// RIGHT-CLICK → APPS → "Add to Draws" (message context menu)
// ==========================================
// Right-click a draw announcement (a post, or a forward of one) and /manage's Add Draw box opens with the post's title, its date and its first image filled in (Harkirat, 2026-10-19 11:11 EDT). Built 2026-10-19 11:16 EDT. The submit is /manage's own (`add_draw_new`), which re-hosts the image to Cloudinary and is gated by the router's /manage lock; the right-click itself is gated here, on the Draws page.
const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');
const { canDo, denyDo } = require('../utils/adminAccess');
const { extractSource } = require('../utils/patchNoteSource');
const { formatAdminDate } = require('../utils/adminParser');

// What the post gives the Add Draw box. The date is when it was posted; a draw announced the day it releases is the common case, and the box shows it to change.
function drawPrefill(source) {
    return {
        title: source.title,
        date: source.postedAt ? formatAdminDate(source.postedAt) : '',
        url: source.images[0] || '',
    };
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Add to Draws')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(0)
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),
    drawPrefill,

    async execute(interaction) {
        // Create on the Draws page (core/permissions.js's OUTSIDE_ACTIONS): the box it opens is /manage's Add Draw.
        if (!(await canDo(interaction.user.id, 'rightclick.addToDraws'))) {
            return await interaction.reply({ content: denyDo('rightclick.addToDraws'), flags: MessageFlags.Ephemeral });
        }
        const manage = interaction.client.commands.get('manage');
        return await interaction.showModal(manage.buildAddDrawModal('new', drawPrefill(extractSource(interaction.targetMessage))));
    },
};
