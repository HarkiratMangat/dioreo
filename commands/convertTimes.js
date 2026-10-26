// ==========================================
// RIGHT-CLICK → APPS → "Convert Times" (message context menu, PUBLIC)
// ==========================================
// Right-click any message with dates or times in it and get each one as a Discord timestamp, which every reader's client shows in their own time zone (Harkirat, 2026-10-19 11:11 EDT). Built 2026-10-19 11:16 EDT. Public, like /timestamp: guild and user install. The answer is always private, since it is for the person who asked.
//
// ⚠️ A TIME WITHOUT A ZONE ("8 PM") IS A GUESS. The writer's zone cannot be known, so it is read in the reader's /settings time zone, and the reply says so beside it. A time that names its zone ("8 PM EST", "20:00 UTC") is exact. Same wall-clock handling as utils/timestampHelper.js: chrono reads a zoneless time in the host's local clock, and dayjs(...).tz(zone, true) keeps those wall-clock numbers and moves them into the reader's zone, which is right on the UTC VM and on a Mac alike.
const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');
const chrono = require('chrono-node');
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));
const { extractSource } = require('../utils/patchNoteSource');

const MAX_SHOWN = 10;
const DEFAULT_ZONE = 'America/Toronto'; // UserPreference.timezone's own default

// One point of a parsed result as unix seconds, and whether it was a guess.
function toUnix(component, zone) {
    const exact = component.isCertain('timezoneOffset');
    let when = exact ? dayjs(component.date()) : dayjs(component.date()).tz(zone, true);
    const hasTime = component.isCertain('hour');
    if (!hasTime) when = dayjs(component.date()).tz(zone, true).hour(0).minute(0).second(0).millisecond(0);
    return { unix: Math.floor(when.valueOf() / 1000), exact, hasTime };
}

// Every date or time in `text`, oldest reading first, as lines ready to send. `reference` anchors words like "tomorrow" to when the message was posted.
function convertText(text, zone = DEFAULT_ZONE, reference = new Date()) {
    const results = chrono.parse(String(text || ''), reference, { forwardDate: true });
    const seen = new Set();
    const lines = [];
    let guessed = false;
    for (const r of results) {
        const start = toUnix(r.start, zone);
        const end = r.end ? toUnix(r.end, zone) : null;
        const id = `${start.unix}-${end?.unix ?? ''}`;
        if (seen.has(id)) continue;
        seen.add(id);
        if ((!start.exact && start.hasTime) || (end && !end.exact && end.hasTime)) guessed = true;
        const fmt = p => (p.hasTime ? `<t:${p.unix}:F>` : `<t:${p.unix}:D>`);
        const quoted = r.text.replace(/\s+/g, ' ').slice(0, 80);
        lines.push(`> ${quoted}\n${fmt(start)}${end ? ` → ${fmt(end)}` : ` · <t:${start.unix}:R>`}`);
        if (lines.length === MAX_SHOWN) break;
    }
    return { lines, guessed };
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Convert Times')
        .setType(ApplicationCommandType.Message)
        // PUBLIC, like /timestamp: guild and user install, every context.
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]),
    convertText,

    async execute(interaction) {
        const UserPreference = require('../models/UserPreference');
        const prefs = await UserPreference.findOne({ discordId: interaction.user.id }).lean();
        const zone = prefs?.timezone || DEFAULT_ZONE;
        const source = extractSource(interaction.targetMessage);
        const { lines, guessed } = convertText(source.content, zone, source.postedAt || new Date());
        if (!lines.length) {
            return await interaction.reply({ content: 'No dates or times found in that message.', flags: MessageFlags.Ephemeral });
        }
        const note = guessed ? `\n-# A time without a time zone was read as **${zone}**${prefs?.timezone ? ', your /settings time zone' : ' (set yours in /settings)'}.` : '';
        return await interaction.reply({ content: `${lines.join('\n')}${note}`.slice(0, 1990), flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
    },
};
