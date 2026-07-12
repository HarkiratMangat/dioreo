// ==========================================
// DYNAMIC USER SETTINGS DASHBOARD COMMAND
// ==========================================
// ARCHITECTURE: Implements native Type 9 Item Rows with Button Accessories to 
// bypass Action Row limits while maintaining a clean, compact UI design.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { resolveAccentColor } = require('../utils/accentColor');
const { withShareButton } = require('../utils/shareButton');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { buildPaginationRow } = require('../utils/paginationRow');

// Harkirat's Discord ID, for the "Made with love by @dior" footer's silent mention -- see the
// bottom of buildContainer() below.
const DIOR_ID = '1139845545754632283';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('Configure your custom loadout, timestamp, and timezone preferences!')
        .setIntegrationTypes([1]).setContexts([0, 1, 2]), // User-install app + DM support

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
        const isEphemeral = (prefs.settingsVisibility || 'public').toUpperCase() !== 'PUBLIC';
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        }

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
        // full style resolution (default/avatar/banner), which is shared across every command.
        const panelColorHex = await resolveAccentColor({
            prefs, userFetch, presetHex: 16741953, defaultBehavior: 'avatar'
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
        containerComponents.push({ type: 1, components: profileLinkButtons });

        containerComponents.push({ type: 14, spacing: 2, divider: true });

        if (page === 0) {
            containerComponents.push({ type: 10, content: `### Default Visibility:\n-# Change if the bot responds to you publicly or as a hidden, only visible to you, message.` });

            // HELPER: Generates the clean Type 9 Accessory layout you designed
            // Internal stored state is still 'PUBLIC'/'EPHEMERAL' (unchanged, matches the DB field
            // values everywhere else) and the button labels stay "PUBLIC"/"HIDDEN" (all-caps,
            // unchanged) -- only the DESCRIPTIVE text next to them was reworded (2026-07-12,
            // Harkirat's request) from the raw state name to a plain-language sentence, since
            // "PUBLIC"/"HIDDEN" alone doesn't explain what actually happens.
            const buildToggleRow = (label, currentState, publicId, ephemeralId) => {
                const isPub = currentState === 'PUBLIC';
                const displayText = isPub ? 'Everyone can see' : 'Visible only to me';
                return {
                    type: 9,
                    components: [{ type: 10, content: `\`• ${label}\` = **${displayText}**` }],
                    accessory: {
                        type: 2, style: 2,
                        label: isPub ? "HIDDEN" : "PUBLIC",
                        custom_id: isPub ? ephemeralId : publicId
                    }
                };
            };

            containerComponents.push(buildToggleRow('Weapon Builds', loadoutVis, `toggle_loadout_public|${userId}`, `toggle_loadout_ephemeral|${userId}`));
            containerComponents.push(buildToggleRow('Seasonal Content', seasonVis, `toggle_seasonal_public|${userId}`, `toggle_seasonal_ephemeral|${userId}`));
            containerComponents.push(buildToggleRow('Timestamps', timeVis, `toggle_timestamp_public|${userId}`, `toggle_timestamp_ephemeral|${userId}`));
            containerComponents.push(buildToggleRow('Settings Dashboard', settingsVis, `toggle_settings_public|${userId}`, `toggle_settings_ephemeral|${userId}`));

            containerComponents.push({ type: 10, content: `-# More settings on page 2 →` });
        } else {
            containerComponents.push({ type: 10, content: `### Default Preferences:\n-# Change the default preferences the bot uses when responding to you.` });

            // Draw Prices region: converted from a binary toggle button to a 3-option dropdown
            // (2026-07-12) -- "Show Last Viewed Region" (new default, `defaultRegionMode:
            // 'last_viewed'`) behaves exactly like the old toggle always did (whatever was last
            // clicked in /draw prices itself); "10 CP"/"30 CP" now PIN the opening view to that
            // region regardless of what gets toggled elsewhere. See models/UserPreference.js and
            // drawprices.js's execute() for the resolution priority.
            const regionMode = prefs.defaultRegionMode || 'last_viewed';
            const regionModeLabelMap = {
                last_viewed: 'Show Last Viewed Region',
                region_10: '10 CP Region Pricing',
                region_30: '30 CP Region Pricing'
            };
            containerComponents.push({ type: 10, content: `\`• Draw Prices Region\` = **${regionModeLabelMap[regionMode] || regionModeLabelMap.last_viewed}**` });
            containerComponents.push({
                type: 1,
                components: [{
                    type: 3, custom_id: `set_region_mode|${userId}|1`, placeholder: "Choose which draw prices region to open on...",
                    options: [
                        { label: "Show Last Viewed Region", value: "last_viewed", description: "Opens on whichever region you last viewed/toggled", default: regionMode === 'last_viewed' },
                        { label: "10 CP Region Pricing", value: "region_10", description: "Always opens on the 10 CP region", default: regionMode === 'region_10' },
                        { label: "30 CP Region Pricing", value: "region_30", description: "Always opens on the 30 CP region", default: regionMode === 'region_30' }
                    ]
                }]
            });

            containerComponents.push({ type: 10, content: `\`• Timezone\` = **${currentTzLabel}**` });
            // NOTE (redesigned during review): moved inside the container, directly under its summary
            // line, instead of living as a separate action row below/outside the embed.
            containerComponents.push({
                type: 1,
                components: [{
                    type: 3, custom_id: `set_timezone|${userId}|1`, placeholder: "Set Your Local Clock Timezone Filters...",
                    options: Object.entries(tzDisplayMap).map(([val, lab]) => ({ label: lab, value: val, default: tz === val }))
                }]
            });

            containerComponents.push({ type: 10, content: `\`• Timestamp Style\` = **${currentStyleLabel}**` });
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
            // utils/accentColor.js. Renamed 'default' -> 'preset' / "Pre-Designed Palette" since
            // avatar-matching is now the ACTUAL default (see UserPreference.js's schema default and
            // accentColor.js's resolveAccentColor, which still treats the legacy 'default' value the
            // same way for any pre-existing saved docs). "Pre-Designed Palette" keeps each command's
            // own themed color (Settings still falls back to avatar since it has no theme color of
            // its own); "Avatar"/"Banner" override every command's accent to match that image instead.
            const accentStyle = prefs.accentColorStyle || 'avatar';
            const accentStyleDisplayMap = {
                default: 'Pre-Designed Palette',
                preset: 'Pre-Designed Palette',
                avatar: 'Avatar Color',
                banner: 'Banner Color'
            };
            // Hex code shown next to Avatar/Banner style (2026-07-12) -- pulled straight from the
            // already-cached avatarColorHex/bannerColorHex fields, no new lookup needed. Formatted
            // as a 6-digit uppercase hex string; `#` + the value's hex representation, zero-padded.
            const hexSuffix = (hexNum) => hexNum != null ? ` \`(#${hexNum.toString(16).padStart(6, '0').toUpperCase()})\`` : '';
            let accentDisplay = accentStyleDisplayMap[accentStyle] || 'Avatar Color';
            if (accentStyle === 'avatar') accentDisplay += hexSuffix(prefs.avatarColorHex);
            if (accentStyle === 'banner') accentDisplay += hexSuffix(prefs.bannerColorHex);
            containerComponents.push({ type: 10, content: `\`• Accent Color Style\` = **${accentDisplay}**` });
            containerComponents.push({
                type: 1,
                components: [{
                    type: 3, custom_id: `set_accent_style|${userId}|1`, placeholder: "Choose how embed accent colors are picked...",
                    options: [
                        { label: "Pre-Designed Palette", value: "preset", description: "Each command uses its own themed color; Settings uses your avatar", default: accentStyle === 'preset' || accentStyle === 'default' },
                        { label: "Avatar Color", value: "avatar", description: "Every embed matches your avatar's dominant color", default: accentStyle === 'avatar' },
                        { label: "Banner Color", value: "banner", description: "Every embed matches your banner's dominant color", default: accentStyle === 'banner' }
                    ]
                }]
            });

            containerComponents.push({ type: 10, content: `-# ← Back to page 1 for Visibility settings` });
        }

        // Prev/Next between the 2 pages -- same shared helper /calendar and /draws use.
        const paginationRow = buildPaginationRow({
            totalChunks: 2, currentPage: page,
            prevCustomId: `set_page_${page - 1}`, nextCustomId: `set_page_${page + 1}`,
            indicatorCustomId: 'set_page_indicator'
        });
        if (paginationRow) {
            containerComponents.push({ type: 14, spacing: 1, divider: true });
            containerComponents.push(paginationRow);
        }

        // FOOTER (2026-07-12) -- silent mention (doesn't ping Harkirat when someone else opens
        // /settings) using the same `allowed_mentions: { users: [] }` suppression already applied to
        // the header's own self-mention below; renders as a normal clickable mention either way. A
        // Text Display can paste a raw emoji mention string directly (unlike a button's `label`,
        // which needs the parsed { id, name, animated } shape -- see parseEmoji()'s own comment).
        containerComponents.push({ type: 10, content: `-# Made with love by <@${DIOR_ID}> ${emojis.dioreo}` });

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
        return await sendV2Payload(interaction, payload, { allowedMentions: { users: [] } });
    }
};