// commands/timestamp.js
const { SlashCommandBuilder, Routes } = require('discord.js'); // Standard Packages — Added 'Routes' for native API endpoint mappings
const { generateTimestamps } = require('../utils/timestampHelper');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { withShareButton } = require('../utils/shareButton');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { getAccentColorForCommand } = require('../utils/accentColor');

// Repalette (2026-07-12, Section 5 of the batch) -- /timestamp was NOT part of the avatar/banner
// accent-color system at all before this (accent_color was hardcoded to Persimmon on every render,
// regardless of the user's /settings Accent Color Style preference). Harkirat's rule: the "All
// Formats" overview -- this command's own default, branded view -- keeps this fixed teal
// regardless of accent preference, same as Loadouts' fixed per-category colors are never
// personalized either. Only once a user has set a SPECIFIC default style in /settings (i.e.
// `prefs.timestampStyle` is anything other than the schema default 'all_formats') does this
// command start respecting avatar/banner personalization like Calendar/Draws/Draw Prices/Patch
// Notes/Season End already do. A one-off `/timestamp style:...` invocation does NOT trigger this
// -- only the user's SAVED default does (Harkirat's explicit confirmation) -- so this always checks
// `prefs.timestampStyle`, never the `style` actually being rendered on this particular call.
const PRESET_ACCENT = 1548962; // Cyber Teal (#17A2A2)

// Shared option list for the style-switch dropdown, used by both view modes below. handlers/timestamp.js's
// 'tsmenu|' select handler calls back into this file's execute() (see overrideState below) rather
// than duplicating this list, so there's only ever one copy to keep in sync.
const STYLE_SELECT_OPTIONS = [
    { label: "All Formats Overview", value: "all_formats", description: "Shows every format together as a summary" },
    { label: "Full Date, Short Time (F)", value: "fullDateTime", description: "e.g., Tuesday, April 20, 2021 at 16:20" },
    { label: "Long Date, Short Time (f)", value: "longDateTime", description: "e.g., April 20, 2021 at 16:20" },
    { label: "Long Date (D)", value: "longDate", description: "e.g., April 20, 2021" },
    { label: "Short Date (d)", value: "shortDate", description: "e.g., 20/04/2021" },
    { label: "Medium Time (T)", value: "mediumTime", description: "e.g., 16:20:30" },
    { label: "Short Time (t)", value: "shortTime", description: "e.g., 16:20" },
    { label: "Short Date, Short Time (s)", value: "shortDateTimeShort", description: "e.g., 20/04/2021, 16:20" },
    { label: "Short Date, Medium Time (S)", value: "shortDateTimeMedium", description: "e.g., 20/04/2021, 16:20:30" },
    { label: "Relative Time (R)", value: "relative", description: "e.g., 4 years ago" }
];

// Shorthand-day/relative-word expansions for the chrono parser, compiled once here at module load
// instead of being rebuilt (10 `new RegExp(...)` calls) on every single /timestamp invocation --
// this data never depends on anything per-call, so there's no reason to recreate it each time.
const SHORTHAND_EXPANSIONS = Object.entries({
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
}).map(([pattern, replacement]) => ({ regex: new RegExp(pattern, 'g'), replacement }));

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
    PRESET_ACCENT, // Exposed so handlers/timestamp.js's tsmenu re-render handler can resolve the same accent
                   // color the initial render would have used (see overrideState.accentColor above).
    data: new SlashCommandBuilder()
        .setName('timestamp')
        // Trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) -- was truncating on mobile.
        .setDescription('Convert text into copyable Discord timestamps')
        .addStringOption(option =>
            option.setName('datetime')
                // Trimmed 2026-07-18 (mobile-width audit) -- kept the examples (the actually useful
                // part) and dropped the trailing "type how you want" hint to fit mobile's width.
                .setDescription('e.g. "tomorrow", "sun 4:30pm", "19:30"')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('timezone')
                // Trimmed 2026-07-18 (mobile-width audit) -- also fixed "leave blank to defaults to"
                // grammar while touching this line.
                .setDescription('Your timezone (leave blank for local default)')
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
        // Renamed 'ephemeral' -> 'private' -> 'hidden' across the same day (2026-07-12): first
        // standardized to match every other command's naming, then every command (including this
        // one) got renamed again to `hidden` with a fuller description explaining who actually sees
        // the response.
        .addStringOption(option =>
            option.setName('visibility')
                .setDescription('Show this response only to you, or publicly to everyone in the chat.')
                .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        // Slash-command-exclusive (2026-07-14, Harkirat's request) -- deliberately NOT saved to
        // /settings or UserPreference; every invocation defaults to Embed unless explicitly typed.
        // Works identically for the All Formats overview and every individual style view.
        // Renamed 'format' -> 'view' (2026-07-18, v2 quick-wins batch) -- "format" read as if it
        // picked a TIMESTAMP format (fullDateTime/shortDate/etc, already the job of the `style`
        // option above); "view" is what this option actually controls (Embed panel vs plain text).
        .addStringOption(option =>
            option.setName('view')
                // Trimmed 2026-07-18 (mobile-width audit) -- was truncating on mobile.
                .setDescription('Embed panel or plain text (default: Embed)')
                .addChoices(
                    { name: 'Embed (Styled Panel)', value: 'embed' },
                    { name: 'Text (Plain, Copyable)', value: 'text' }
                ))
        // Context configuration ensuring the command works in Guilds, DMs, and User-installed apps seamlessly
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]),

    // NOTE (de-duplicated during review): this used to have a full second copy of both view
    // layouts living in handlers/timestamp.js's 'tsmenu|' select handler, because that handler needed to
    // re-render the SAME already-parsed timestamp under a different style without re-running
    // chrono (a relative input like "tomorrow" would resolve to a different date if re-parsed
    // later). The two copies had already drifted out of sync twice across earlier redesigns.
    // Fixed properly now via the same synthetic-interaction pattern every other command uses:
    // `overrideState` lets handlers/timestamp.js pass in the already-known { unix, tz, queryInput, style }
    // instead of re-deriving them from slash command options, while both code paths still share
    // this single render implementation below.
    async execute(interaction, overrideState = null) {
        let queryInput, tz, style, unix, ephemeral, accentColor, isTextMode;

        if (overrideState) {
            // Invoked from handlers/timestamp.js's tsmenu dropdown handler — reuse the exact original parse
            // instead of re-parsing. Never ephemeral here since the dropdown-driven re-render
            // path never applied the ephemeral flag (matches prior behavior).
            ({ unix, tz, queryInput, style } = overrideState);
            // Preserve whatever ephemeral state the message already had (Discord can't change it
            // via edit anyway) — needed so the "Share Publicly" button doesn't disappear the moment
            // someone switches timestamp styles. handlers/timestamp.js passes this in from the message being
            // edited since overrideState skips the normal ephemeral-resolution logic entirely.
            ephemeral = Boolean(overrideState.ephemeral);
            // accentColor is precomputed by handlers/timestamp.js's tsmenu handler (it already needs to fetch
            // prefs there to decide this) and passed through the same way ephemeral is — this
            // render path skips the normal option-resolution logic entirely, so there's no `prefs`
            // available here to resolve it from directly.
            accentColor = overrideState.accentColor ?? PRESET_ACCENT;
            // textMode (2026-07-14) -- same "preserve whatever the message already had" logic as
            // ephemeral above, so switching styles via the dropdown doesn't silently bounce a text
            // response back to the embed layout. handlers/timestamp.js derives this from the message's OWN
            // Components V2 flag (32768) before calling in, the same way it derives ephemeral from
            // the 64 bit — there's no `format` option to read here since overrideState skips normal
            // option resolution entirely.
            isTextMode = Boolean(overrideState.isTextMode);
        } else {
            queryInput = interaction.options.getString('datetime');
            tz = interaction.options.getString('timezone') || 'America/Toronto';
            isTextMode = interaction.options.getString('view') === 'text';

            // NOTE (fixed during review): this option was previously ALWAYS taken as-is, so leaving
            // it blank meant "all formats" no matter what a user had saved as their default Timestamp
            // Style in /settings — that saved preference was stored and shown in the dashboard but
            // never actually consulted (flagged as a known gap in CLAUDE.md). Now falls back the same
            // way `ephemeral` already does below: explicit option > saved preference > "all formats".
            // `prefs.timestampStyle` defaults to the literal string 'all_formats' in the schema, which
            // needs to be treated as "no specific style" (i.e. `style = null`) here, since that's how
            // the rest of this function distinguishes the two view modes.
            const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
            const argStyle = interaction.options.getString('style');
            const savedStyle = prefs?.timestampStyle;
            style = argStyle !== null ? argStyle : (savedStyle && savedStyle !== 'all_formats' ? savedStyle : null);

            // NOTE (Option A wiring): /timestamp previously never checked any saved preference —
            // the `private` option (renamed from `ephemeral` 2026-07-12) always defaulted to false
            // if you didn't type it. Now it falls back to the "Timestamps" toggle from /settings
            // (prefs.timestampVisibility) when the option is left blank, same priority pattern used
            // by the other commands: explicit option > saved preference > public default.
            const visibilityChoice = interaction.options.getString('visibility');
            const argEphemeral = visibilityChoice === null ? null : visibilityChoice === 'hidden';
            ephemeral = argEphemeral !== null ? argEphemeral : (prefs ? prefs.timestampVisibility === 'ephemeral' : false);

            // Accent color: fixed teal UNLESS the user has saved a specific default style in
            // /settings (i.e. `prefs.timestampStyle` isn't the schema default 'all_formats') --
            // checks the SAVED preference, not `style` above, so a one-off `style:` option on this
            // particular call never triggers personalization by itself (Harkirat's explicit call).
            const usesPersonalizedAccent = savedStyle && savedStyle !== 'all_formats';
            accentColor = usesPersonalizedAccent ? await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT) : PRESET_ACCENT;

            // FIXED V14 EPHEMERAL DEFERRAL FORMAT:
            // discord.js v14 strictly expects a boolean payload configuration object { ephemeral: true }
            if (ephemeral) {
                await interaction.deferReply({ ephemeral: true });
            } else {
                await interaction.deferReply();
            }

            // Clean text input and expand shorthand variations into complete words for the chrono parser engine
            let processedQuery = queryInput.toLowerCase().trim();
            for (const { regex, replacement } of SHORTHAND_EXPANSIONS) {
                processedQuery = processedQuery.replace(regex, replacement);
            }

            const timestampsBase = generateTimestamps(processedQuery, tz);
            if (!timestampsBase || !timestampsBase.unix) {
                // LIBRARY SERIALIZATION BYPASS PROTOCOL (ON ERROR RENDER):
                return interaction.client.rest.patch(
                    Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
                    { body: { content: `❌ Could not parse your time input from "${queryInput}".\n• Try formats like: \`tomorrow\`, \`sun at 4:30pm\`, \`july17 8pm\`, or \`19:30\`.` } }
                );
            }

            unix = timestampsBase.unix;
        }

        const currentFullTzLabel = getTimezoneLabel(tz, tzLabels[tz]);

        const styleCharMap = {
            fullDateTime: 'F', longDateTime: 'f', longDate: 'D', shortDate: 'd',
            mediumTime: 'T', shortTime: 't', shortDateTimeShort: 's',
            shortDateTimeMedium: 'S', relative: 'R'
        };

        // STATE STORAGE ID DESIGN: We encode critical query context properties inside the string key.
        // Using a pipe (|) delimiter completely prevents crashes with timezone names containing underscores (e.g., Asia/Hong_Kong).
        const cleanQueryText = queryInput.substring(0, 40).replace(/\|/g, ' ');
        const statelessCustomId = `tsmenu|${unix}|${tz}|${cleanQueryText}`;
        const parsedLine = `-# Parsed \`${queryInput}\` using timezone \`${currentFullTzLabel}\``;

        // Shared dropdown component (2026-07-14) -- built once here instead of inline per-branch
        // below, since text mode and embed mode both need the exact same select menu, just wrapped
        // differently (nested inside the container vs. a top-level sibling row).
        const dropdownComponent = {
            type: 3,
            custom_id: statelessCustomId,
            placeholder: "Switch to a singular layout style...",
            options: STYLE_SELECT_OPTIONS.map(opt => ({ ...opt, default: opt.value === (style || 'all_formats') }))
        };

        let componentPayload = [];
        // Plain message content for text mode (2026-07-14) -- undefined in embed mode, where the
        // container's own Text Display components carry everything instead. See sendV2Payload's
        // `content` param.
        let textContent;

        if (style) {
            // VIEW MODE: SINGULAR TARGET LAYOUT
            // NOTE (redesigned during review): this view previously told users to "use the dropdown
            // below" without actually including one — the only place a dropdown ever appeared for
            // this view was if you arrived here via the all-formats select menu (see handlers/timestamp.js's
            // 'tsmenu|' handler, which reuses the incoming select component). Landing here directly
            // via `/timestamp style:...` showed no dropdown at all. Now always included, nested at
            // the bottom of the container per the redesign, with the selected style pre-marked.
            const char = styleCharMap[style];
            const headingLine = `### \`<t:${unix}:${char}>\` — <t:${unix}:${char}>`;
            const hintLine = `-# Use the dropdown below to change timestamp style`;

            if (isTextMode) {
                // Text mode (2026-07-14): same content, no container/accent-color/divider chrome --
                // a blank line stands in for the divider since plain message content has no real
                // divider component. Dropdown becomes a top-level sibling row instead of nested.
                textContent = [headingLine, parsedLine, hintLine].join('\n\n');
                componentPayload = [{ type: 1, components: [dropdownComponent] }];
            } else {
                // Layout per redesign: timestamp > divider > parsed line > "use dropdown" line >
                // dropdown (parsed line moved back above the divider, under the timestamp itself).
                componentPayload = [
                    {
                        type: 17, // Components v2: Section Container
                        accent_color: accentColor,
                        components: [
                            { type: 10, content: headingLine }, // Type 10: Text Block
                            { type: 14, spacing: 2, divider: true }, // Type 14: Interactive Separator/Divider
                            { type: 10, content: parsedLine },
                            { type: 10, content: hintLine },
                            { type: 1, components: [dropdownComponent] }
                        ]
                    }
                ];
            }
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
            const headingLine = `## ${emojis.timestamp} Time Converted to Each User’s Local Timezone`;
            const linesBlock = lines + `\n\n-# ✦ Tap on any \`<t:###:F>\` text above to instantly copy it`;
            const hintLine = `-# Select a specific layout below to change views`;

            if (isTextMode) {
                textContent = [headingLine, linesBlock, parsedLine, hintLine].join('\n\n');
                componentPayload = [{ type: 1, components: [dropdownComponent] }];
            } else {
                // Layout per redesign: title > divider > timestamps+tap-on-any > divider > parsed
                // line > "select a specific layout" line > dropdown (parsed line moved back down
                // below the timestamps list, not directly under the title).
                componentPayload = [
                    {
                        type: 17, // Components v2: Section Container
                        accent_color: accentColor,
                        components: [
                            { type: 10, content: headingLine },
                            { type: 14, spacing: 2, divider: true },
                            { type: 10, content: linesBlock },
                            { type: 14, spacing: 2, divider: true },
                            { type: 10, content: parsedLine },
                            { type: 10, content: hintLine },
                            { type: 1, components: [dropdownComponent] } // Action Row — nested inside the container, not a sibling
                        ]
                    }
                ];
            }
        }

        // --- LIBRARY SERIALIZATION BYPASS ---
        // 32768 (1 << 15) forces Discord's gateway API to open the Components V2 engine route --
        // OMITTED entirely in text mode (2026-07-14) so the message renders as a classic plain-text
        // response instead (content field + non-V2 action rows, which Discord supports identically
        // in both systems). `flags` explicitly re-ORs in the ephemeral bit (64) rather than relying
        // on sendV2Payload's plain 32768 default -- this render path (via overrideState, see the
        // dropdown-driven re-render at the top of this function) doesn't go through a normal
        // deferReply() that would set ephemeral state on its own, so it has to be preserved here.
        // `flags: 0` (public + text mode) is intentional, not a bug -- sendV2Payload's default param
        // only triggers on `undefined`, not on falsy values, so 0 is never silently overridden.
        return await sendV2Payload(interaction, withShareButton(componentPayload, ephemeral), {
            content: textContent || '',
            flags: isTextMode ? (ephemeral ? 64 : 0) : (ephemeral ? (32768 | 64) : 32768)
        });
    }
};