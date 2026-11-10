// ==========================================
// RIGHT-CLICK → APPS → "Add to Calendar" (message context menu)
// ==========================================
// Right-click an event post (a post, or a forward of one) and /manage's Add Calendar Event box opens with the post's title and the first date range found in its text (Harkirat, 2026-10-19 11:11 EDT). Built 2026-10-19 11:16 EDT. The submit is /manage's own (`modal_calendar_add`); the right-click is gated here, on the Calendar page.
const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');
const chrono = require('chrono-node');
const { pullBackYear } = require('../utils/chronoYear');
const { canDo, denyDo } = require('../utils/adminAccess');
const { extractSource } = require('../utils/patchNoteSource');
const { formatAdminDate } = require('../utils/adminParser');

// The first date or range chrono finds in the post, read relative to when it was posted (so "Oct 20" in an October post means this year's). No end date leaves End Date blank, which the box reads as All Season.
function calendarPrefill(source) {
    const ref = source.postedAt || new Date();
    // The first result that names a month: "live now, 11/5 - 11/19" read "now" first and prefilled the post's own time (2026-11-09).
    const all = chrono.parse(source.content, ref, { forwardDate: true });
    const found = all.find(r => !/^(right )?now$|^today$|^tonight$/i.test(r.text.trim())) || all[0];
    // A date already behind the post stays this year (utils/chronoYear.js), as in Quick Add and news triage.
    const at = (c) => pullBackYear(c, c.date(), ref);
    const endOf = (r) => { const s = at(r.start); const e = at(r.end); if (!r.end.isCertain('year') && e - s > 300 * 864e5) e.setUTCFullYear(e.getUTCFullYear() - 1); return e; };
    return {
        title: source.title,
        startDate: found ? formatAdminDate(at(found.start)) : '',
        endDate: found?.end ? formatAdminDate(endOf(found)) : '',
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
        // Create on the Calendar page (core/permissions.js's OUTSIDE_ACTIONS): the box it opens is /manage's Add Calendar Event.
        if (!(await canDo(interaction.user.id, 'rightclick.addToCalendar'))) {
            return await interaction.reply({ content: denyDo('rightclick.addToCalendar'), flags: MessageFlags.Ephemeral });
        }
        const manage = interaction.client.commands.get('manage');
        return await interaction.showModal(manage.buildCalendarAddModal(calendarPrefill(extractSource(interaction.targetMessage))));
    },
};
