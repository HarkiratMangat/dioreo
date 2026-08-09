// ==========================================
// DYNAMIC USER SETTINGS DASHBOARD COMMAND
// ==========================================
// ARCHITECTURE: Implements native Type 9 Item Rows with Button Accessories to 
// bypass Action Row limits while maintaining a clean, compact UI design.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { resolveAccentColor, fetchDisplayNameColors, resolveDynamicProfileColor } = require('../utils/accentColor');
const { withShareButton } = require('../utils/shareButton');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildPaginationRow } = require('../utils/paginationRow');
const { resolveEphemeral } = require('../utils/ephemeral');
const { schedulePanelExpiry } = require('../utils/passiveExpiry');

// Harkirat's Discord ID, for the "Made with love by @dior" footer's silent mention -- see the
// bottom of buildContainer() below.
const DIOR_ID = '1139845545754632283';

// AUTHOR-LOCK (2026-07-14) -- /settings previously had no author-lock at all on some of its own
// components (set_page_ carried no userId whatsoever); every custom_id this file builds now carries
// `|{userId}` so index.js's handlers can check identity before acting.
//
// Idle-timeout expiry used to ALSO be encoded here (a `|{expiresAt}` 3rd segment, checked reactively
// on click) but that's gone (2026-07-18) -- replaced by `utils/passiveExpiry.js`'s PASSIVE
// setTimeout-based auto-disable, scheduled at the bottom of execute() after every send. See that
// module's own comment for the full mechanism and why it replaces rather than supplements the old
// design.

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        // Trimmed 2026-07-18 (v2 quick-wins batch, mobile-width audit) -- the old 83-char version
        // truncated to "..." on Discord mobile's command picker row; every top-level/subcommand
        // description in this pass was checked against that same narrow row, not desktop.
        .setDescription('Customize your bot settings and preferences')
        // Added 2026-07-18 (v2 quick-wins batch) -- every other command already has this option;
        // /settings was simply missed. Same name/description/priority pattern as everywhere else
        // (explicit option > saved settingsVisibility preference > public default, see
        // resolveEphemeral below) -- the in-panel Show/Hide toggle button still works exactly as
        // before for changing the SAVED preference; this just lets one specific invocation override it.
        .addStringOption(option => option.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    // pageOverride (2026-07-12): 0 = Visibility, 1 = Preferences. Added once the new region
    // dropdown + hex-code lines + footer pushed the single-page layout close to Discord's
    // 40-component cap -- see the B.5 button handler in index.js for how page navigation re-invokes
    // this with a target page.
    async execute(interaction, pageOverride = 0) {
        const userId = interaction.user.id;
        const page = Math.min(Math.max(pageOverride, 0), 1);

        // 1. DATA SYNCHRONIZATION
        let prefs = await UserPreference.findOne({ discordId: userId });
        if (!prefs) {
            prefs = new UserPreference({ discordId: userId });
            await prefs.save();
        }

        // 2. SAFE DEFERRAL (Fixes InteractionAlreadyReplied Crash)
        // Check if index.js button router already deferred this interaction. If not, defer it.
        // We now respect the user's custom settings visibility preference natively! Default
        // flipped from 'ephemeral' to 'public' per Harkirat's request — matches the schema
        // default in UserPreference.js, kept in sync here for existing docs missing the field.
        // `hidden` option added 2026-07-18 -- same explicit-option > saved-preference > public
        // priority every other command already uses (utils/ephemeral.js's resolveEphemeral).
        // `interaction.isChatInputCommand()` guards reading `.options` at all -- every re-render
        // path here (toggle/set/set_page/colors button+select handlers in index.js) calls this
        // execute() with a button/select interaction that has no real options resolver, so
        // argPrivate naturally falls through to null on those, leaving the saved preference (not
        // this option) in control exactly as before this change.
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'settingsVisibility' });
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        }

        // REMOVED (2026-07-14, CPU pass): a fire-and-forget "soft refresh" used to run here on EVERY
        // /settings open, warming the View Colors palette cache for all 4 sources in the background so
        // the panel would be pre-extracted by the time someone clicked View Colors. It was pulled
        // because it was a major, unconditional CPU drain -- every /settings open (whether or not the
        // user ever opened View Colors) kicked off up to 4 background Jimp+k-means extractions, one
        // spawning an ffmpeg subprocess, all competing for Render's free-tier shared core and blocking
        // the event loop enough to make unrelated interactions miss Discord's 3s ACK window (10062).
        // The View Colors panel now extracts lazily and only the one source being viewed (see
        // utils/colorPalette.js's getPalettePanelData), so the pre-warm bought little and cost a lot --
        // correctness is unchanged, first-open of each page just shows a brief spinner instead.

        // 3. LIVE PROFILE LOOKUP
        const userFetch = await interaction.client.users.fetch(userId, { force: true });

        const userAvatarUrl = interaction.user.displayAvatarURL({ extension: 'png', size: 256 });
        const userBannerUrl = userFetch.bannerURL({ extension: 'png', size: 512 }) || "";
        // Full-quality versions for the download link buttons below — separate from the small
        // thumbnail/gallery sizes above used for the actual dashboard display.
        const userAvatarFullUrl = interaction.user.displayAvatarURL({ size: 4096 });
        const userBannerFullUrl = userFetch.bannerURL({ size: 4096 }) || "";

        // ACCENT COLOR: /settings has no fixed brand color of its own (unlike calendar/draws/etc),
        // so its "default" behavior is to use the avatar color — see utils/accentColor.js for the
        // full style resolution (default/avatar/banner/displayName/dynamicProfile), which is shared
        // across every command. /settings already force-fetches userFetch unconditionally on every
        // render (line above, for the avatar/banner download buttons regardless of accent style), so
        // unlike getAccentColorForCommand's throttled path, there's no extra hesitation being
        // introduced here by also always fetching Display Name Colors fresh when that style is
        // selected — it's the same "always fresh on this page" behavior /settings already has for
        // avatar/banner. 'dynamicProfile' is routed around resolveAccentColor entirely (needs
        // `interaction` itself for its message-based pick caching, not just a resolved userFetch —
        // see resolveDynamicProfileColor's own comment) — this also means visiting /settings while on
        // this style shows whatever was picked for the message /settings itself is rendered on, same
        // "one pick per message, held steady across re-renders" rule every other command follows.
        const displayNameColors = prefs.accentColorStyle === 'displayName'
            ? await fetchDisplayNameColors(interaction.client, userId)
            : null;
        const panelColorHex = prefs.accentColorStyle === 'dynamicProfile'
            ? await resolveDynamicProfileColor(interaction, prefs, 16741953)
            : await resolveAccentColor({
                prefs, userFetch, presetHex: 16741953, defaultBehavior: 'avatar', displayNameColors
            });

        const userCreatedAt = Math.floor(interaction.user.createdAt.getTime() / 1000);

        // 4. BULLETPROOF STATE SYNCING
        const loadoutVis = (prefs.loadoutVisibility || 'public').toUpperCase();
        const seasonVis = (prefs.seasonalVisibility || 'public').toUpperCase();
        const timeVis = (prefs.timestampVisibility || 'public').toUpperCase();
        const settingsVis = (prefs.settingsVisibility || 'public').toUpperCase();
        const tz = prefs.timezone || 'America/Toronto';
        const style = prefs.timestampStyle || 'all_formats';

        // Prettify the visual labels
        const tzDisplayMap = {
            "America/Toronto": "Eastern (Toronto/NY) (EDT)",
            "America/Winnipeg": "Central (Winnipeg/Chicago) (CDT)",
            "America/Edmonton": "Mountain (Edmonton/Denver) (MDT)",
            "America/Vancouver": "Pacific (Vancouver/LA) (PDT)",
            "Europe/London": "United Kingdom (London) (GMT)",
            "Europe/Paris": "Central Europe (Paris/Berlin) (CET)",
            "Europe/Athens": "Eastern Europe (Athens/Cairo) (EET)",
            "Asia/Dubai": "Gulf Standard Time (Dubai) (GST)",
            "Asia/Kolkata": "India Standard Time (New Delhi) (IST)",
            "Asia/Singapore": "Singapore Standard Time (SGT)",
            "Asia/Tokyo": "Japan Standard Time (Tokyo) (JST)",
            "Australia/Sydney": "Eastern Australia Time (Sydney) (AEST)",
            "Australia/Perth": "Western Australia Time (Perth) (AWST)",
            "Pacific/Auckland": "New Zealand Time (Auckland) (NZST)",
            "America/Sao_Paulo": "Brazil Standard Time (São Paulo) (BRT)"
        };
        const currentTzLabel = tzDisplayMap[tz] || tz;

        // NOTE (redesigned during review): aligned these value keys to match the exact style
        // options /timestamp itself already offers (fullDateTime/longDateTime/longDate/shortDate/
        // mediumTime/shortTime/shortDateTimeShort/shortDateTimeMedium/relative). Discord's docs
        // (docs.discord.com/developers/reference#message-formatting-timestamp-styles) confirm 's'
        // and 'S' ARE real native styles ("Short Date, Short Time" / "Short Date, Medium Time") —
        // the older CLAUDE.md note claiming they don't exist was wrong/stale; /timestamp.js already
        // renders them correctly, so they belong here too.
        const styleDisplayMap = {
            all_formats: 'All Formats',
            fullDateTime: 'Full Date, Short Time (F)',
            longDateTime: 'Long Date, Short Time (f)',
            longDate: 'Long Date (D)',
            shortDate: 'Short Date (d)',
            mediumTime: 'Medium Time (T)',
            shortTime: 'Short Time (t)',
            shortDateTimeShort: 'Short Date, Short Time (s)',
            shortDateTimeMedium: 'Short Date, Medium Time (S)',
            relative: 'Relative Time (R)'
        };
        // Canonical example text per style — shown as the dropdown option's description line
        const styleExampleMap = {
            all_formats: 'Shows every format together as a summary',
            fullDateTime: 'e.g. Tuesday, April 20, 2021 at 16:20',
            longDateTime: 'e.g. April 20, 2021 at 16:20',
            longDate: 'e.g. April 20, 2021',
            shortDate: 'e.g. 20/04/2021',
            mediumTime: 'e.g. 16:20:30',
            shortTime: 'e.g. 16:20',
            shortDateTimeShort: 'e.g. 20/04/2021, 16:20',
            shortDateTimeMedium: 'e.g. 20/04/2021, 16:20:30',
            relative: 'e.g. 4 years ago'
        };
        const currentStyleLabel = styleDisplayMap[style] || 'All Formats';

        // 5. INTERNAL CANVAS ELEMENTS ARRAY
        const containerComponents = [];

        if (userBannerUrl) {
            containerComponents.push({ type: 12, items: [{ media: { url: userBannerUrl } }] });
        }

        // Profile Header
        // NOTE (redesigned during review, matches settings_update_ui.json): now uses a real Discord
        // mention (<@userId>) so it's actually pingable, per the new design — the old version just
        // wrote the literal text "@username" which looked like a mention but wasn't clickable. The
        // mention would normally ping the user on every /settings run though, which makes no sense
        // for a command they just invoked themselves — suppressed via `allowed_mentions` on the
        // final payload below rather than dropping the mention format entirely.
        containerComponents.push({
            type: 9,
            components: [{
                type: 10,
                content: `# ${emojis.settings} Settings Dashboard\n### <@${userId}> | \`${interaction.user.username}\`\n(\`${userId}\`)\n\n-# Member Since: \n-# <t:${userCreatedAt}:F> (<t:${userCreatedAt}:R>)`
            }],
            accessory: { type: 11, media: { url: userAvatarUrl } }
        });

        // AVATAR/BANNER DOWNLOAD LINKS: Link-style buttons (style 5) point straight at the
        // full-quality (4096px) CDN asset, so a user can save their own avatar/banner without
        // needing to open Discord's own profile settings. A Section's accessory slot (used above
        // for the avatar thumbnail) only supports ONE thumbnail-or-button, not both, so these live
        // in their own Action Row instead of being crammed into the header Section.
        const profileLinkButtons = [{ type: 2, style: 5, label: "Avatar", url: userAvatarFullUrl }];
        if (userBannerFullUrl) profileLinkButtons.push({ type: 2, style: 5, label: "Banner", url: userBannerFullUrl });
        // "View Colors" (2026-07-13) -- opens utils/colorPaletteView.js's panel as its OWN new
        // message (index.js's colors_view handler, ephemeral state matches the user's own
        // settingsVisibility preference) rather than editing this settings panel in place, so the
        // settings dashboard stays open underneath. Style 1 (blurple/Primary) -- the eyedropper icon
        // was recolored to match this exact button color, so Secondary/gray would've clashed.
        profileLinkButtons.push({
            type: 2, style: 1, label: "View Colors", custom_id: `colors_view|${userId}`,
            emoji: emojis.parseEmoji(emojis.eyedropper)
        });
        containerComponents.push({ type: 1, components: profileLinkButtons });

        containerComponents.push({ type: 14, spacing: 2, divider: true });

        if (page === 0) {
            containerComponents.push({ type: 10, content: `### Default Visibility:\n-# Change if the bot responds to you publicly or as a hidden, only visible to you, message.` });

            // HELPER: Generates the clean Type 9 Accessory layout you designed
            // Internal stored state is still 'PUBLIC'/'EPHEMERAL' (unchanged, matches the DB field
            // values everywhere else). Button labels reworded 2026-07-12 (same day, follow-up
            // correction) from all-caps "PUBLIC"/"HIDDEN" to plain "Show"/"Hide".
            // Reformatted 2026-08-07 17:55 EDT, Harkirat's direct request -- was `` `• Label` =
            // **Visible to *everyone in chat*** `` (the LABEL in inline code with a leading bullet,
            // the VALUE in bold+italic markdown). Backwards: inline code reads as a literal value,
            // and a label isn't one. First pass put only the state word in code (`everyone in
            // chat`); a follow-up (19:21 EDT) put the WHOLE phrase in the code span instead:
            // **Label** = `Visible to everyone in chat`. Label is bold plain text (no backticks, no
            // bullet); the entire "Visible to ..."/"Visible only to me" phrase is one inline-code
            // span. "in chat" DROPPED entirely (19:36 EDT, Harkirat's follow-up) -- "Visible to
            // everyone" already says what it means without it. This obsoletes the non-breaking-space
            // wrap fix from earlier (removed per Harkirat's prior follow-up) -- inline code renders
            // monospace, wrapping differently than the italic markdown span that had the
            // orphan-word problem. Discord does NOT parse markdown inside a single-backtick span, so
            // italic on the value is gone entirely, not just moved -- keeping it would have shown
            // literal asterisks.
            const buildToggleRow = (label, currentState, publicId, ephemeralId) => {
                const isPub = currentState === 'PUBLIC';
                const displayText = isPub ? '`Visible to everyone`' : '`Visible only to me`';
                return {
                    type: 9,
                    components: [{ type: 10, content: `**${label}** = ${displayText}` }],
                    accessory: {
                        type: 2, style: 2,
                        label: isPub ? "Hide" : "Show",
                        custom_id: `${isPub ? ephemeralId : publicId}|${userId}`
                    }
                };
            };

            containerComponents.push(buildToggleRow('Weapon Builds', loadoutVis, `toggle_loadout_public`, `toggle_loadout_ephemeral`));
            containerComponents.push(buildToggleRow('Seasonal Content', seasonVis, `toggle_seasonal_public`, `toggle_seasonal_ephemeral`));
            containerComponents.push(buildToggleRow('Timestamps', timeVis, `toggle_timestamp_public`, `toggle_timestamp_ephemeral`));
            containerComponents.push(buildToggleRow('Settings Dashboard', settingsVis, `toggle_settings_public`, `toggle_settings_ephemeral`));

            containerComponents.push({ type: 10, content: `-# Choose your Preferences settings on page 2 →` });
        } else {
            containerComponents.push({ type: 10, content: `### Default Preferences:\n-# Change the default preferences the bot uses when responding to you.` });

            // Draw Prices region: converted from a binary toggle button to a 3-option dropdown
            // (2026-07-12) -- "Show Last Viewed Region" (new default, `defaultRegionMode:
            // 'last_viewed'`) behaves exactly like the old toggle always did (whatever was last
            // clicked in /draw prices itself); "10 CP"/"20 CP"/"30 CP" now PIN the opening view to
            // that region regardless of what gets toggled elsewhere. Gained the 20 CP option
            // 2026-08-07 alongside drawprices.js's new region. See models/UserPreference.js and
            // drawprices.js's execute() for the resolution priority.
            const regionMode = prefs.defaultRegionMode || 'last_viewed';
            const regionModeLabelMap = {
                last_viewed: 'Show Last Viewed Region',
                region_10: '10 CP Region Pricing',
                region_20: '20 CP Region Pricing',
                region_30: '30 CP Region Pricing'
            };
            containerComponents.push({ type: 10, content: `**Draw Prices Region** = \`${regionModeLabelMap[regionMode] || regionModeLabelMap.last_viewed}\`` });
            containerComponents.push({
                type: 1,
                components: [{
                    type: 3, custom_id: `set_region_mode|${userId}|1`, placeholder: "Choose which draw prices region to open on...",
                    options: [
                        { label: "Show Last Viewed Region", value: "last_viewed", description: "Opens on whichever region you last viewed/toggled", default: regionMode === 'last_viewed' },
                        { label: "10 CP Region Pricing", value: "region_10", description: "Always opens on the 10 CP region", default: regionMode === 'region_10' },
                        { label: "20 CP Region Pricing", value: "region_20", description: "Always opens on the 20 CP region", default: regionMode === 'region_20' },
                        { label: "30 CP Region Pricing", value: "region_30", description: "Always opens on the 30 CP region", default: regionMode === 'region_30' }
                    ]
                }]
            });

            containerComponents.push({ type: 10, content: `**Timezone** = \`${currentTzLabel}\`` });
            // NOTE (redesigned during review): moved inside the container, directly under its summary
            // line, instead of living as a separate action row below/outside the embed.
            containerComponents.push({
                type: 1,
                components: [{
                    type: 3, custom_id: `set_timezone|${userId}|1`, placeholder: "Set Your Local Clock Timezone Filters...",
                    options: Object.entries(tzDisplayMap).map(([val, lab]) => ({ label: lab, value: val, default: tz === val }))
                }]
            });

            containerComponents.push({ type: 10, content: `**Timestamp Style** = \`${currentStyleLabel}\`` });
            containerComponents.push({
                type: 1,
                components: [{
                    type: 3, custom_id: `set_style|${userId}|1`, placeholder: "Set Your Default Chat Timestamp Format Style...",
                    options: Object.entries(styleDisplayMap).map(([val, lab]) => ({
                        label: lab,
                        value: val,
                        description: styleExampleMap[val],
                        default: style === val
                    }))
                }]
            });

            // ACCENT COLOR STYLE: controls what color every embed's container accent uses — see
            // utils/accentColor.js. Renamed 'default' -> 'preset' / "Pre-Designed Palette", which is
            // now the ACTUAL default again (flipped back 2026-08-08 00:24 EDT, per Harkirat's direct
            // request -- see UserPreference.js's schema default and accentColor.js's
            // resolveAccentColor, which still treats the legacy 'default' value the same way for any
            // pre-existing saved docs). "Pre-Designed Palette" keeps each command's own themed color
            // (Settings still falls back to avatar since it has no theme color of its own);
            // "Avatar"/"Banner" override every command's accent to match that image instead.
            const accentStyle = prefs.accentColorStyle || 'preset';
            const accentStyleDisplayMap = {
                default: 'Pre-Designed Palette',
                preset: 'Pre-Designed Palette',
                avatar: 'Avatar Color',
                banner: 'Banner Color',
                displayName: 'Display Name Colors',
                dynamicProfile: 'Dynamic Profile Colors'
            };
            // Hex code shown next to Avatar/Banner style (2026-07-12) -- pulled straight from the
            // already-cached avatarColorHex/bannerColorHex fields, no new lookup needed. Formatted
            // as a 6-digit uppercase hex string; `#` + the value's hex representation, zero-padded.
            const hexSuffix = (hexNum) => hexNum != null ? ` \`(#${hexNum.toString(16).padStart(6, '0').toUpperCase()})\`` : '';
            // Reformatted 2026-08-07 19:37 EDT to match page 1's **Label** = `Value` style -- only
            // the CORE label text (the accentStyleDisplayMap lookup) goes in backticks here, not the
            // whole accentDisplay string, since the hex-code suffixes below (hexSuffix, the
            // displayName gradient stops, the dynamicProfile hex) already wrap THEMSELVES in their
            // own separate backtick spans -- nesting one code span inside another isn't valid
            // markdown (the first inner backtick would prematurely close the outer span), so this
            // stays as adjacent same-styled spans instead of one merged span.
            let accentDisplay = `\`${accentStyleDisplayMap[accentStyle] || 'Avatar Color'}\``;
            if (accentStyle === 'avatar') accentDisplay += hexSuffix(prefs.avatarColorHex);
            if (accentStyle === 'banner') accentDisplay += hexSuffix(prefs.bannerColorHex);
            // 'displayName' shows BOTH real gradient stops (not just the blended hex actually applied
            // to containers) since these are the user's own literal chosen colors -- more informative
            // than the blend alone. displayNameColors was already resolved above (panelColorHex), so
            // prefs.displayNameColorHex/Source are already fresh on this same in-memory prefs object
            // -- no second fetch needed here. A null displayNameColors means the Nitro feature isn't
            // set up at all, so this falls back to Avatar Color (matching resolveAccentColor's own
            // fallback) with a short inline note instead of a broken/blank hex.
            if (accentStyle === 'displayName') {
                if (displayNameColors) {
                    const [c1, c2] = displayNameColors;
                    accentDisplay += ` \`(#${c1.toString(16).padStart(6, '0').toUpperCase()} → #${c2.toString(16).padStart(6, '0').toUpperCase()})\``;
                } else {
                    accentDisplay = `\`${accentStyleDisplayMap.avatar}\`${hexSuffix(prefs.avatarColorHex)} *(Display Name Colors not set up)*`;
                }
            }
            // 'dynamicProfile' shows the hex ACTUALLY picked for this render (panelColorHex,
            // resolved above via resolveDynamicProfileColor) plus a short explainer, since there's no
            // single fixed hex to show like every other style -- the whole point is it changes on
            // every new command launch. Always has at least Avatar to draw from, so unlike
            // displayName there's no "not set up" fallback state to handle here.
            if (accentStyle === 'dynamicProfile') {
                accentDisplay += ` \`(#${panelColorHex.toString(16).padStart(6, '0').toUpperCase()})\`\n-# Randomly picks from your Avatar, Banner, Display Name, Decoration & Nameplate colors — new pick on every command, held steady while paging/toggling`;
            }
            containerComponents.push({ type: 10, content: `**Accent Color Style** = ${accentDisplay}` });
            containerComponents.push({
                type: 1,
                components: [{
                    type: 3, custom_id: `set_accent_style|${userId}|1`, placeholder: "Choose how embed accent colors are picked...",
                    options: [
                        { label: "Pre-Designed Palette", value: "preset", description: "Each command uses its own themed color; Settings uses your avatar", default: accentStyle === 'preset' || accentStyle === 'default' },
                        { label: "Avatar Color", value: "avatar", description: "Every command matches your avatar's dominant color", default: accentStyle === 'avatar' },
                        { label: "Banner Color", value: "banner", description: "Every command matches your banner's dominant color", default: accentStyle === 'banner' },
                        { label: "Display Name Colors", value: "displayName", description: "Matches your Nitro name-style gradient (requires setup)", default: accentStyle === 'displayName' },
                        { label: "Dynamic Profile Colors", value: "dynamicProfile", description: "Randomly picks from all your profile colors on each command", default: accentStyle === 'dynamicProfile' }
                    ]
                }]
            });

            // Calendar's Active/All Events filter (2026-07-31 14:00 EDT) -- moved here from an
            // in-page /calendar toggle, per Harkirat's explicit request. Same binary-toggle shape as
            // page 0's buildToggleRow above, but that helper is hardcoded to PUBLIC/EPHEMERAL
            // wording, so this is its own small block rather than a reused call. Default 'all',
            // matching the UserPreference schema default.
            const eventFilter = prefs.calendarEventFilter || 'all';
            const isActiveOnly = eventFilter === 'active';
            containerComponents.push({
                type: 9,
                components: [{ type: 10, content: `**Calendar Events** = \`${isActiveOnly ? 'Active/Upcoming Only' : 'All Events'}\`` }],
                accessory: {
                    type: 2, style: 2,
                    label: isActiveOnly ? 'Show All' : 'Show Active Only',
                    custom_id: `${isActiveOnly ? 'toggle_calfilter_all' : 'toggle_calfilter_active'}|${userId}`
                }
            });

            containerComponents.push({ type: 10, content: `-# ← Back to page 1 for Visibility settings` });
        }

        // Prev/Next between the 2 pages -- same shared helper /calendar and /draws use. Ordered
        // hint text > nav row > divider > footer (2026-07-12 correction) -- the divider used to sit
        // directly above the nav row, which read as separating the hint text from the buttons it
        // was describing; moved below the nav row instead, right before the footer.
        const paginationRow = buildPaginationRow({
            totalChunks: 2, currentPage: page,
            makeCustomId: (p) => `set_page_${p}|${userId}`,
            indicatorCustomId: 'set_page_indicator'
        });
        if (paginationRow) containerComponents.push(paginationRow);
        containerComponents.push({ type: 14, spacing: 2, divider: true });

        // FOOTER (2026-07-12) -- silent mention (doesn't ping Harkirat when someone else opens
        // /settings) using the same `allowed_mentions: { users: [] }` suppression already applied to
        // the header's own self-mention below; renders as a normal clickable mention either way. A
        // Text Display can paste a raw emoji mention string directly (unlike a button's `label`,
        // which needs the parsed { id, name, animated } shape -- see parseEmoji()'s own comment).
        containerComponents.push({ type: 10, content: `-# ${emojis.diorHeart} Made with love by <@${DIOR_ID}>` });

        // 6. MASTER PAYLOAD MATRIX
        const payload = withShareButton([
            {
                type: 17,
                accent_color: panelColorHex,
                components: containerComponents
            }
        ], isEphemeral);

        // `allowed_mentions: { users: [] }` suppresses the notification/highlight for the <@userId>
        // mention in the header above while still rendering it as a normal clickable blue mention —
        // a "silent" mention. Without this, every /settings run would ping the user for mentioning
        // themselves, which is pure noise since they're the one who ran the command.
        const sentMessage = await sendV2Payload(interaction, payload, { allowedMentions: { users: [] } });

        // PASSIVE IDLE-TIMEOUT (2026-07-18) -- schedules/reschedules the auto-disable timer for
        // THIS message, using THIS render's own fresh interaction token. Runs on every render
        // (initial command + every button/select re-render), so an actively-used panel never goes
        // idle mid-session; only 10 straight minutes of no interaction on this specific message
        // triggers it. `sentMessage.id` comes straight back from the PATCH response above -- no
        // extra `fetchReply()` round-trip needed even on the very first render, unlike the
        // `dynamicProfile` accent style's message-id caching (see CLAUDE.md), which had no such
        // response to read from. See utils/passiveExpiry.js for the full mechanism.
        schedulePanelExpiry(interaction, sentMessage.id, payload);

        return sentMessage;
    }
};