// commands/timestamp.js
const BOT_EMOJI = require('../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { SlashCommandBuilder, Routes } = require('discord.js'); // Standard Packages — Added 'Routes' for native API endpoint mappings
const { generateTimestamps } = require('../utils/timestampHelper');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { withShareButton } = require('../utils/shareButton');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { getAccentColorForCommand } = require('../utils/accentColor');

// Repalette (2026-07-12, Section 5 of the batch) -- /timestamp was NOT part of the avatar/banner accent-color system at all before this (accent_color was hardcoded to Persimmon on every render, regardless of the user's /settings Accent Color Style preference). Harkirat's rule: the "All Formats" overview -- this command's own default, branded view -- keeps this fixed teal regardless of accent preference, same as Loadouts' fixed per-category colors are never personalized either. Only once a user has set a SPECIFIC default style in /settings (i.e. `prefs.timestampStyle` is a single format, not one of the two overviews in OVERVIEW_STYLES, All Formats and Short List; Short List became the default 2026-10-20 18:31 EDT) does this command start respecting avatar/banner personalization like Calendar/Draws/Draw Prices/Patch Notes/Season End already do. A one-off `/timestamp style:...` invocation does NOT trigger this -- only the user's SAVED default does (Harkirat's explicit confirmation) -- so this always checks `prefs.timestampStyle`, never the `style` actually being rendered on this particular call.
const PRESET_ACCENT = 1548962; // Cyber Teal (#17A2A2)

// Shared option list for the style-switch dropdown, used by both view modes below. handlers/timestamp.js's 'tsmenu|' select handler calls back into this file's execute() (see overrideState below) rather than duplicating this list, so there's only ever one copy to keep in sync.
const STYLE_SELECT_OPTIONS = [
    { label: "All Formats Overview", value: "all_formats", description: "Shows every format together as a summary" },
    { label: "Short List", value: "short_list", description: "The 6 most used formats" },
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

// The format each style value stands for, and the label shown above it: Discord's own names, the words the dropdown already uses. The overview shows ALL_CODES; Short List (added 2026-10-20 18:23 EDT, Harkirat) shows the six people paste most, longest first.
const STYLE_CHAR = {
    fullDateTime: 'F', longDateTime: 'f', longDate: 'D', shortDate: 'd',
    mediumTime: 'T', shortTime: 't', shortDateTimeShort: 's',
    shortDateTimeMedium: 'S', relative: 'R'
};
const FORMAT_LABELS = {
    F: 'FULL DATE, SHORT TIME', f: 'LONG DATE, SHORT TIME', D: 'LONG DATE', d: 'SHORT DATE',
    T: 'MEDIUM TIME', t: 'SHORT TIME', s: 'SHORT DATE, SHORT TIME', S: 'SHORT DATE, MEDIUM TIME', R: 'RELATIVE TIME'
};
const ALL_CODES = ['F', 'f', 'D', 'd', 'T', 't', 's', 'S', 'R'];
// The two overview views. Either one keeps the fixed teal accent; only a saved SINGLE format turns on personalised colour (Harkirat's 2026-07-12 rule, carried over when Short List arrived).
const OVERVIEW_STYLES = ['all_formats', 'short_list'];

// Which view to draw: an explicit `style:` wins, then the saved /settings style, then Short List, the default for anyone who never chose (2026-10-20 18:31 EDT, Harkirat: "let's make the default view ... be the shortlist view"). `null` means the All Formats overview, which is how the rest of this file reads it.
function resolveStyle(argStyle, savedStyle) {
    const chosen = argStyle ?? savedStyle ?? 'short_list';
    return chosen === 'all_formats' ? null : chosen;
}
const SHORT_LIST_CODES = ['F', 'f', 'D', 'd', 't', 'R'];

// Shorthand-day/relative-word expansions for the chrono parser, compiled once here at module load instead of being rebuilt (10 `new RegExp(...)` calls) on every single /timestamp invocation -- this data never depends on anything per-call, so there's no reason to recreate it each time.
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
 * Calculates current UTC offset string and abbreviation for a given timezone, and formats a clean display name.
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

// The timezone option's suggestions: /settings' common zones when nothing is typed, else the search over every zone (utils/timezoneData.js).
async function timezoneAutocomplete(interaction) {
    const { searchTimezones, quickZoneOptions } = require('../utils/timezoneData');
    const typed = interaction.options.getFocused() || '';
    const list = typed ? searchTimezones(typed, 25) : quickZoneOptions();
    return await interaction.respond(list.slice(0, 25).map(o => ({ name: o.label.slice(0, 100), value: o.value })));
}

module.exports = {
    autocomplete: timezoneAutocomplete,
    resolveStyle, OVERVIEW_STYLES,
    PRESET_ACCENT, // Exposed so handlers/timestamp.js's tsmenu re-render handler can resolve the same accent
                   // color the initial render would have used (see overrideState.accentColor above).
    data: new SlashCommandBuilder()
        .setName('timestamp')
        // Trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) -- was truncating on mobile.
        .setDescription('Convert text into copyable Discord timestamps')
        .addStringOption(option =>
            option.setName('datetime')
                // Trimmed 2026-07-18 (mobile-width audit) -- kept the examples (the actually useful part) and dropped the trailing "type how you want" hint to fit mobile's width.
                .setDescription('e.g. "tomorrow", "sun 4:30pm", "19:30"')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('timezone')
                // Trimmed 2026-07-18 (mobile-width audit) -- also fixed "leave blank to defaults to" grammar while touching this line. Blank now means the /settings timezone, as /help already promised (fixed 2026-10-20 16:50 EDT).
                .setDescription('Your timezone: type a city to search (blank = your /settings one)')
                // An autocomplete over every zone the runtime knows (utils/timezoneData.js), where there used to be 15 fixed choices (Harkirat, 2026-10-24 21:15 EDT: "Yes extend, as well to /timestamp"). A typed value that was never picked is resolved by the same search in execute().
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('style')
                .setDescription('Pick a view or one format (blank = your saved view)')
                .addChoices(
                    { name: 'Short List — the 6 most used formats', value: 'short_list' },
                    { name: 'All Formats — every format', value: 'all_formats' },
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
        // Slash-command-exclusive (2026-07-14, Harkirat's request) -- deliberately NOT saved to /settings or UserPreference; every invocation defaults to Embed unless explicitly typed. Works identically for the All Formats overview and every individual style view. Renamed 'format' -> 'view' (2026-07-18, v2 quick-wins batch) -- "format" read as if it picked a TIMESTAMP format (fullDateTime/shortDate/etc, already the job of the `style` option above); "view" is what this option actually controls (Embed panel vs plain text).
        .addStringOption(option =>
            option.setName('view')
                // Trimmed 2026-07-18 (mobile-width audit) -- was truncating on mobile.
                .setDescription('Embed panel or plain text (default: Embed)')
                .addChoices(
                    { name: 'Embed (Styled Panel)', value: 'embed' },
                    { name: 'Text (Plain, Copyable)', value: 'text' }
                ))
        // Renamed 'ephemeral' -> 'private' -> 'hidden' across the same day (2026-07-12), then every command (including this one) got renamed again to `hidden` with a fuller description explaining who actually sees the response. LAST, after `view` (2026-10-25 22:40 EDT, Harkirat: "visibility is always the last option on a slash command"; scripts/commandOptions.test.js holds every command to it).
        .addStringOption(option =>
            option.setName('visibility')
                .setDescription('Show this response only to you, or publicly to everyone in the chat.')
                .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        // Context configuration ensuring the command works in Guilds, DMs, and User-installed apps seamlessly
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]),

    // NOTE (de-duplicated during review): this used to have a full second copy of both view layouts living in handlers/timestamp.js's 'tsmenu|' select handler, because that handler needed to re-render the SAME already-parsed timestamp under a different style without re-running chrono (a relative input like "tomorrow" would resolve to a different date if re-parsed later). The two copies had already drifted out of sync twice across earlier redesigns. Fixed properly now via the same synthetic-interaction pattern every other command uses: `overrideState` lets handlers/timestamp.js pass in the already-known { unix, tz, queryInput, style } instead of re-deriving them from slash command options, while both code paths still share this single render implementation below.
    async execute(interaction, overrideState = null) {
        let queryInput, tz, style, unix, endUnix = null, ephemeral, accentColor, isTextMode;

        if (overrideState) {
            // Invoked from handlers/timestamp.js's tsmenu dropdown handler — reuse the exact original parse instead of re-parsing. Never ephemeral here since the dropdown-driven re-render path never applied the ephemeral flag (matches prior behavior).
            ({ unix, tz, queryInput, style } = overrideState);
            endUnix = overrideState.endUnix || null;
            // Preserve whatever ephemeral state the message already had (Discord can't change it via edit anyway) — needed so the "Share Publicly" button doesn't disappear the moment someone switches timestamp styles. handlers/timestamp.js passes this in from the message being edited since overrideState skips the normal ephemeral-resolution logic entirely.
            ephemeral = Boolean(overrideState.ephemeral);
            // accentColor is precomputed by handlers/timestamp.js's tsmenu handler (it already needs to fetch prefs there to decide this) and passed through the same way ephemeral is — this render path skips the normal option-resolution logic entirely, so there's no `prefs` available here to resolve it from directly.
            accentColor = overrideState.accentColor ?? PRESET_ACCENT;
            // textMode (2026-07-14) -- same "preserve whatever the message already had" logic as ephemeral above, so switching styles via the dropdown doesn't silently bounce a text response back to the embed layout. handlers/timestamp.js derives this from the message's OWN Components V2 flag (32768) before calling in, the same way it derives ephemeral from the 64 bit — there's no `format` option to read here since overrideState skips normal option resolution entirely.
            isTextMode = Boolean(overrideState.isTextMode);
        } else {
            queryInput = interaction.options.getString('datetime');
            isTextMode = interaction.options.getString('view') === 'text';
            const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
            // explicit option > saved /settings timezone > Toronto (UserPreference.timezone's own default). The saved zone was fetched a few lines below and never read for this until 2026-10-20 16:50 EDT, so a user who saved Tokyo got Toronto's 9am while /help said otherwise.
            tz = require('../utils/timezoneData').resolveTimezone(interaction.options.getString('timezone')) || prefs?.timezone || 'America/Toronto';

            // NOTE (fixed during review): this option was previously ALWAYS taken as-is, so leaving it blank meant "all formats" no matter what a user had saved as their default Timestamp Style in /settings — that saved preference was stored and shown in the dashboard but never actually consulted (flagged as a known gap in CLAUDE.md). Now falls back the same way `ephemeral` already does below: explicit option > saved preference > "all formats". `prefs.timestampStyle` defaults to the literal string 'all_formats' in the schema, which needs to be treated as "no specific style" (i.e. `style = null`) here, since that's how the rest of this function distinguishes the two view modes.
            const argStyle = interaction.options.getString('style');
            const savedStyle = prefs?.timestampStyle;
            style = resolveStyle(argStyle, savedStyle);

            // NOTE (Option A wiring): /timestamp previously never checked any saved preference — the `private` option (renamed from `ephemeral` 2026-07-12) always defaulted to false if you didn't type it. Now it falls back to the "Timestamps" toggle from /settings (prefs.timestampVisibility) when the option is left blank, same priority pattern used by the other commands: explicit option > saved preference > public default.
            const visibilityChoice = interaction.options.getString('visibility');
            const argEphemeral = visibilityChoice === null ? null : visibilityChoice === 'hidden';
            ephemeral = argEphemeral !== null ? argEphemeral : (prefs ? prefs.timestampVisibility === 'ephemeral' : false);

            // Accent color: fixed teal UNLESS the user has saved a specific default style in /settings (i.e. `prefs.timestampStyle` is a single format, not an overview in OVERVIEW_STYLES) -- checks the SAVED preference, not `style` above, so a one-off `style:` option on this particular call never triggers personalization by itself (Harkirat's explicit call).
            const usesPersonalizedAccent = Boolean(savedStyle) && !OVERVIEW_STYLES.includes(savedStyle);
            accentColor = usesPersonalizedAccent ? await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT) : PRESET_ACCENT;

            // FIXED V14 EPHEMERAL DEFERRAL FORMAT: discord.js v14 strictly expects a boolean payload configuration object { ephemeral: true }
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
                    { body: { content: `${BOT_EMOJI.cross} Could not parse your time input from "${queryInput}".\n• Try formats like: \`tomorrow\`, \`sun at 4:30pm\`, \`july17 8pm\`, or \`19:30\`.` } }
                );
            }

            unix = timestampsBase.unix;
            endUnix = timestampsBase.endUnix;
        }

        // A saved /settings zone can be any IANA zone, not only the 15 in tzLabels; fall back to its id so the label never reads "undefined".
        const currentFullTzLabel = getTimezoneLabel(tz, tzLabels[tz] || require('../utils/timezoneData').timezoneBaseLabel(tz));

        // STATE STORAGE ID DESIGN: We encode critical query context properties inside the string key. Using a pipe (|) delimiter completely prevents crashes with timezone names containing underscores (e.g., Asia/Hong_Kong). A range carries its end after a `~` in the time segment (2026-10-20 19:14 EDT); an old message without one still parses. The query is trimmed to whatever room is left under Discord's 100-character custom_id cap.
        const timeSegment = endUnix ? `${unix}~${endUnix}` : `${unix}`;
        const idHead = `tsmenu|${timeSegment}|${tz}|`;
        const cleanQueryText = queryInput.substring(0, Math.min(40, 100 - idHead.length)).replace(/\|/g, ' ');
        const statelessCustomId = `${idHead}${cleanQueryText}`;
        const parsedLine = `-# Parsed \`${queryInput}\` using timezone \`${currentFullTzLabel}\``;

        // One dropdown for every view (the overview, Short List and each single format), selected value pre-marked.
        const dropdownComponent = {
            type: 3,
            custom_id: statelessCustomId,
            placeholder: "Switch to a singular layout style...",
            options: STYLE_SELECT_OPTIONS.map(opt => ({ ...opt, default: opt.value === (style || 'all_formats') }))
        };

        // LAYOUT (Harkirat's, approved on the #testing-spam mock-ups 2026-10-20 18:23 EDT): a title that says what the panel is, then one row per format -- its name as an ALL-CAPS label, the time as each reader sees it, and the copyable code -- so neither the time nor the code wraps mid-line on a phone. The single-format view is this same panel with one row, so the two views cannot drift apart again (they did twice when each had its own layout). An unknown saved style falls back to the overview.
        const codes = style === 'short_list' ? SHORT_LIST_CODES : (style && STYLE_CHAR[style] ? [STYLE_CHAR[style]] : ALL_CODES);
        const headingLine = `## ${emojis.timestamp} Timestamp Codes\n-# Everyone sees these in their own time zone.\n-# **Tap a \`<code>\` to copy it.**`;
        const { rangeText } = require('../utils/timestampHelper');
        const rowsBlock = codes.map(c => {
            const text = rangeText(Number(unix), endUnix ? Number(endUnix) : null, c, tz);
            const label = endUnix && c === 'R' ? `${FORMAT_LABELS[c]} (STARTS)` : FORMAT_LABELS[c];
            return `-# **${label}**\n**${text}**\n-# \`${text}\``;
        }).join('\n\n');
        const hintLine = `-# Switch views or pick a format`; // Harkirat's wording, 2026-10-20 18:30 EDT

        let componentPayload;
        // Plain message content for text mode (2026-07-14) -- undefined in embed mode, where the container's own Text Display components carry everything instead. See sendV2Payload's `content` param.
        let textContent;
        if (isTextMode) {
            // Text mode: the same strings with no container chrome; a blank line stands in for each divider, and the dropdown becomes a top-level row.
            textContent = [headingLine, rowsBlock, parsedLine, hintLine].join('\n\n');
            componentPayload = [{ type: 1, components: [dropdownComponent] }];
        } else {
            componentPayload = [{
                type: 17, // Components v2: Container
                accent_color: accentColor,
                components: [
                    { type: 10, content: headingLine },
                    { type: 14, spacing: 2, divider: true },
                    { type: 10, content: rowsBlock },
                    { type: 14, spacing: 2, divider: true },
                    { type: 10, content: parsedLine },
                    { type: 10, content: hintLine },
                    { type: 1, components: [dropdownComponent] } // Action Row nested inside the container, not a sibling
                ]
            }];
        }

        // --- LIBRARY SERIALIZATION BYPASS --- 32768 (1 << 15) forces Discord's gateway API to open the Components V2 engine route -- OMITTED entirely in text mode (2026-07-14) so the message renders as a classic plain-text response instead (content field + non-V2 action rows, which Discord supports identically in both systems). `flags` explicitly re-ORs in the ephemeral bit (64) rather than relying on sendV2Payload's plain 32768 default -- this render path (via overrideState, see the dropdown-driven re-render at the top of this function) doesn't go through a normal deferReply() that would set ephemeral state on its own, so it has to be preserved here. `flags: 0` (public + text mode) is intentional, not a bug -- sendV2Payload's default param only triggers on `undefined`, not on falsy values, so 0 is never silently overridden.
        return await sendV2Payload(interaction, withShareButton(componentPayload, ephemeral), {
            content: textContent || '',
            flags: isTextMode ? (ephemeral ? 64 : 0) : (ephemeral ? (32768 | 64) : 32768)
        });
    }
};