// commands/timestamp.js
const { SlashCommandBuilder, Routes } = require('discord.js'); // Standard Packages — Added 'Routes' for native API endpoint mappings
const { generateTimestamps } = require('../utils/timestampHelper');

// Global lookup table mapping standard IANA timezones to descriptive user-facing labels
const tzLabels = {
    'America/Toronto': 'Eastern (Toronto/NY)',
    'America/Winnipeg': 'Central (Winnipeg/Chicago)',
    'America/Edmonton': 'Mountain (Edmonton/Denver)',
    'America/Vancouver': 'Pacific (Vancouver/LA)',
    'Pacific/Honolulu': 'Hawaii Standard Time',
    'UTC': 'Coordinated Universal Time (UTC 0)',
    'Europe/London': 'United Kingdom (London)',
    'Europe/Paris': 'Central Europe (Paris/Berlin)',
    'Europe/Stockholm': 'Sweden (Stockholm)',
    'Asia/Kolkata': 'India Standard Time (Delhi)',
    'Asia/Singapore': 'Singapore Standard Time',
    'Asia/Hong_Kong': 'Hong Kong Time',
    'Asia/Shanghai': 'Mainland China (Beijing)',
    'Asia/Tokyo': 'Japan Standard Time (Tokyo)',
    'Australia/Sydney': 'Eastern Australia (Sydney)'
};

/**
 * Calculates current UTC offset string and abbreviation for a given timezone,
 * and formats a clean display name.
 * * CRITICAL DISCORD API CONSTRAINT: Option 'name' strings CANNOT exceed 100 characters.
 * We enforce a strict .substring(0, 100) safety net to prevent API registration errors.
 */
function getTimezoneLabel(tz, baseName) {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' });
        const parts = formatter.formatToParts(now);
        const tzPart = parts.find(part => part.type === 'timeZoneName');
        const zoneAbbr = tzPart ? tzPart.value : '';
        
        const tzString = now.toLocaleString('en-US', { timeZone: tz });
        const utcString = now.toLocaleString('en-US', { timeZone: 'UTC' });
        const tzNow = new Date(tzString);
        const utcNow = new Date(utcString);
        
        const offsetMin = Math.round((tzNow - utcNow) / 60000);
        const hours = Math.floor(Math.abs(offsetMin) / 60);
        const mins = Math.abs(offsetMin) % 60;
        const sign = offsetMin >= 0 ? '+' : '-';
        const offsetStr = `UTC${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;

        const fullLabel = `(${offsetStr}) ${baseName} (${zoneAbbr})`;
        return fullLabel.substring(0, 100); // Strict safety truncation for Discord API limits
    } catch (e) {
        console.error(`Label warning for ${tz}:`, e.message);
        return baseName.substring(0, 100); 
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timestamp')
        .setDescription('Convert natural language into copyable Discord timestamps!')
        .addStringOption(option =>
            option.setName('datetime')
                // FIXED 100-CHARACTER LIMIT CRASH PROTECTION: Combined short string under 100 characters perfectly
                .setDescription('Convert text (e.g. "tomorrow", "sun 4:30pm", "july17 8pm", "19:30") — type how you want')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('timezone')
                .setDescription('Select local timezone, or leave blank to defaults to your current timezone')
                .addChoices(
                    { name: getTimezoneLabel('America/Toronto', tzLabels['America/Toronto']), value: 'America/Toronto' },
                    { name: getTimezoneLabel('America/Winnipeg', tzLabels['America/Winnipeg']), value: 'America/Winnipeg' },
                    { name: getTimezoneLabel('America/Edmonton', tzLabels['America/Edmonton']), value: 'America/Edmonton' },
                    { name: getTimezoneLabel('America/Vancouver', tzLabels['America/Vancouver']), value: 'America/Vancouver' },
                    { name: getTimezoneLabel('Pacific/Honolulu', tzLabels['Pacific/Honolulu']), value: 'Pacific/Honolulu' },
                    { name: getTimezoneLabel('UTC', tzLabels['UTC']), value: 'UTC' },
                    { name: getTimezoneLabel('Europe/London', tzLabels['Europe/London']), value: 'Europe/London' },
                    { name: getTimezoneLabel('Europe/Paris', tzLabels['Europe/Paris']), value: 'Europe/Paris' },
                    { name: getTimezoneLabel('Europe/Stockholm', tzLabels['Europe/Stockholm']), value: 'Europe/Stockholm' },
                    { name: getTimezoneLabel('Asia/Kolkata', tzLabels['Asia/Kolkata']), value: 'Asia/Kolkata' },
                    { name: getTimezoneLabel('Asia/Singapore', tzLabels['Asia/Singapore']), value: 'Asia/Singapore' },
                    { name: getTimezoneLabel('Asia/Hong_Kong', tzLabels['Asia/Hong_Kong']), value: 'Asia/Hong_Kong' },
                    { name: getTimezoneLabel('Asia/Shanghai', tzLabels['Asia/Shanghai']), value: 'Asia/Shanghai' },
                    { name: getTimezoneLabel('Asia/Tokyo', tzLabels['Asia/Tokyo']), value: 'Asia/Tokyo' },
                    { name: getTimezoneLabel('Australia/Sydney', tzLabels['Australia/Sydney']), value: 'Australia/Sydney' }
                ))
        .addStringOption(option =>
            option.setName('style')
                .setDescription('Select a specific style, or leave blank for all formats')
                .addChoices(
                    { name: 'Full Date, Short Time (F) — e.g., Tuesday, April 20, 2021 at 16:20', value: 'fullDateTime' },
                    { name: 'Long Date, Short Time (f) — e.g., April 20, 2021 at 16:20', value: 'longDateTime' },
                    { name: 'Long Date (D) — e.g., April 20, 2021', value: 'longDate' },
                    { name: 'Short Date (d) — e.g., 20/04/2021', value: 'shortDate' },
                    { name: 'Medium Time (T) — e.g., 16:20:30', value: 'mediumTime' },
                    { name: 'Short Time (t) — e.g., 16:20', value: 'shortTime' },
                    { name: 'Short Date, Short Time (s) — e.g., 20/04/2021, 16:20', value: 'shortDateTimeShort' },
                    { name: 'Short Date, Medium Time (S) — e.g., 20/04/2021, 16:20:30', value: 'shortDateTimeMedium' },
                    { name: 'Relative Time (R) — e.g., 4 years ago', value: 'relative' }
                ))
        .addBooleanOption(option =>
            option.setName('ephemeral')
                .setDescription('Set to true to make the response visible only to you (Default: false)'))
        // Context configuration ensuring the command works in Guilds, DMs, and User-installed apps seamlessly
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),

    async execute(interaction) {
        const queryInput = interaction.options.getString('datetime');
        const tz = interaction.options.getString('timezone') || 'America/Toronto';
        const style = interaction.options.getString('style');
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;

        // FIXED V14 EPHEMERAL DEFERRAL FORMAT:
        // discord.js v14 strictly expects a boolean payload configuration object { ephemeral: true } 
        if (ephemeral) {
            await interaction.deferReply({ ephemeral: true });
        } else {
            await interaction.deferReply();
        }

        // Clean text input and expand shorthand variations into complete words for the chrono parser engine
        let processedQuery = queryInput.toLowerCase().trim();
        const expansions = {
            '\\btom\\b|\\btomorr\\b|\\btomorrow\\b': 'tomorrow',
            '\\btod\\b|\\btoday\\b': 'today',
            '\\byest\\b|\\byesterday\\b': 'yesterday',
            '\\bsun\\b|\\bsunday\\b': 'Sunday',
            '\\bmon\\b|\\bmonday\\b': 'Monday',
            '\\btue\\b|\\btues\\b|\\btuesday\\b': 'Tuesday',
            '\\bwed\\b|\\bweds\\b|\\bwednesday\\b': 'Wednesday',
            '\\bthu\\b|\\bthur\\b|\\bthurs\\b|\\bthursday\\b': 'Thursday',
            '\\bfri\\b|\\bfriday\\b': 'Friday',
            '\\bsat\\b|\\bsaturday\\b': 'Saturday'
        };

        for (const [regex, replacement] of Object.entries(expansions)) {
            processedQuery = processedQuery.replace(new RegExp(regex, 'g'), replacement);
        }

        const timestampsBase = generateTimestamps(processedQuery, tz);
        if (!timestampsBase || !timestampsBase.unix) {
            // LIBRARY SERIALIZATION BYPASS PROTOCOL (ON ERROR RENDER):
            return interaction.client.rest.patch(
                Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
                { body: { content: `❌ Could not parse your time input from "${queryInput}".\n• Try formats like: \`tomorrow\`, \`sun at 4:30pm\`, \`july17 8pm\`, or \`19:30\`.` } }
            );
        }

        const unix = timestampsBase.unix;
        const currentFullTzLabel = getTimezoneLabel(tz, tzLabels[tz]);

        const styleCharMap = {
            fullDateTime: 'F', longDateTime: 'f', longDate: 'D', shortDate: 'd',
            mediumTime: 'T', shortTime: 't', shortDateTimeShort: 's',
            shortDateTimeMedium: 'S', relative: 'R'
        };

        let componentPayload = [];

        if (style) {
            // VIEW MODE: SINGULAR TARGET LAYOUT
            const char = styleCharMap[style];
            componentPayload = [
                {
                    type: 17, // Components v2: Section Container
                    accent_color: 16741953, // Precious Persimmon (#ff7641)
                    components: [
                        { type: 10, content: `### \`<t:${unix}:${char}>\` — <t:${unix}:${char}>` }, // Type 10: Text Block
                        { type: 14, spacing: 1, divider: true }, // Type 14: Interactive Separator/Divider
                        // Removed double line break gap between descriptor and parsed context
                        { type: 10, content: `-# Use the dropdown below to change timestamp style\n-# Parsed \`${queryInput}\` using timezone \`${currentFullTzLabel}\`` }
                    ]
                }
            ];
        } else {
            // VIEW MODE: ALL FORMATS OVERVIEW (DEFAULT)
            const lines = [
                `\`<t:${unix}:F>\` — <t:${unix}:F>`,
                `\`<t:${unix}:f>\` — <t:${unix}:f>`,
                `\`<t:${unix}:D>\` — <t:${unix}:D>`,
                `\`<t:${unix}:d>\` — <t:${unix}:d>`,
                `\`<t:${unix}:T>\` — <t:${unix}:T>`,
                `\`<t:${unix}:t>\` — <t:${unix}:t>`,
                `\`<t:${unix}:s>\` — <t:${unix}:s>`,
                `\`<t:${unix}:S>\` — <t:${unix}:S>`,
                `\`<t:${unix}:R>\` — <t:${unix}:R>`
            ].join('\n');

            // STATE STORAGE ID DESIGN: We encode critical query context properties inside the string key.
            // Using a pipe (|) delimiter completely prevents crashes with timezone names containing underscores (e.g., Asia/Hong_Kong).
            const cleanQueryText = queryInput.substring(0, 40).replace(/\|/g, ' ');
            const statelessCustomId = `tsmenu|${unix}|${tz}|${cleanQueryText}`;

            componentPayload = [
                {
                    type: 17, // Components v2: Section Container
                    accent_color: 16741953, // Precious Persimmon (#ff7641)
                    components: [
                        { type: 10, content: "### Time Converted to Each User’s Local Timezone" },
                        // Injected the ✦ prompt directly below the timestamps list with a double line break for clean padding
                        { type: 10, content: lines + `\n\n-# ✦ Tap on any \`<t:###:F>\` text above to instantly copy it` },
                        { type: 14, spacing: 1, divider: true },
                        // Removed double line break gap between descriptor and parsed context
                        { type: 10, content: `-# Select a specific layout below to change views\n-# Parsed \`${queryInput}\` using timezone \`${currentFullTzLabel}\`` }
                    ]
                },
                {
                    type: 1, // Action Row Container
                    components: [
                        {
                            type: 3, // String Select Menu Component
                            custom_id: statelessCustomId, // Uses the newly formatted pipe-delimited ID
                            placeholder: "Switch to a singular layout style...",
                            options: [
                                { label: "All Formats Overview", value: "all_formats", default: true },
                                { label: "Full Date, Short Time (F)", value: "fullDateTime", description: "e.g., Tuesday, April 20, 2021 at 16:20" },
                                { label: "Long Date, Short Time (f)", value: "longDateTime", description: "e.g., April 20, 2021 at 16:20" },
                                { label: "Long Date (D)", value: "longDate", description: "e.g., April 20, 2021" },
                                { label: "Short Date (d)", value: "shortDate", description: "e.g., 20/04/2021" },
                                { label: "Medium Time (T)", value: "mediumTime", description: "e.g., 16:20:30" },
                                { label: "Short Time (t)", value: "shortTime", description: "e.g., 16:20" },
                                { label: "Short Date, Short Time (s)", value: "shortDateTimeShort", description: "e.g., 20/04/2021, 16:20" },
                                { label: "Short Date, Medium Time (S)", value: "shortDateTimeMedium", description: "e.g., 20/04/2021, 16:20:30" },
                                { label: "Relative Time (R)", value: "relative", description: "e.g., 4 years ago" }
                            ]
                        }
                    ]
                }
            ];
        }

        // --- LIBRARY SERIALIZATION BYPASS ---
        // 32768 (1 << 15) forces Discord's gateway API to open the Components V2 engine route.
        return await interaction.client.rest.patch(
            Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
            {
                body: {
                    content: "",
                    components: componentPayload,
                    flags: ephemeral ? (32768 | 64) : 32768
                }
            }
        );
    }
};