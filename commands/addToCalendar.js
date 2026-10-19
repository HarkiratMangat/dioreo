// ==========================================
// RIGHT-CLICK → APPS → "Add to Calendar" (message context menu)
// ==========================================
// Right-click an event post (a post, or a forward of one) and /manage's Add Calendar Event box opens with the post's title and the first date range found in its text (Harkirat, 2026-10-19 11:11 EDT). Built 2026-10-19 11:16 EDT. The submit is /manage's own (`modal_calendar_add`); the right-click is gated here, on the Calendar page.
const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');
const chrono = require('chrono-node');
const { hasManagePageAccess } = require('../utils/adminAccess');
const { extractSource } = require('../utils/patchNoteSource');
const { formatAdminDate } = require('../utils/adminParser');

// The first date or range chrono finds in the post, read relative to when it was posted (so "Oct 20" in an October post means this year's). No end date leaves End Date blank, which the box reads as All Season.
function calendarPrefill(source) {
    const found = chrono.parse(source.content, source.postedAt || new Date(), { forwardDate: true })[0];
    return {
        title: source.title,
        startDate: found ? formatAdminDate(found.start.date()) : '',
        endDate: found?.end ? formatAdminDate(found.end.date()) : '',
    };
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Add to Calendar')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(0)
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),
    calendarPrefill,

    async execute(interaction) {
        if (!(await hasManagePageAccess(interaction.user.id, 'calendar'))) {
            return await interaction.reply({ content: "🔒 **This one's admin-only.** It edits Dioreo's calendar directly.", flags: MessageFlags.Ephemeral });
        }
        const manage = interaction.client.commands.get('manage');
        return await interaction.showModal(manage.buildCalendarAddModal(calendarPrefill(extractSource(interaction.targetMessage))));
    },
};
