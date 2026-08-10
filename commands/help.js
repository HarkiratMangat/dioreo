// ==========================================
// COMMAND: PLAYER GUIDE / HELP
// ==========================================
// ARCHITECTURE: Redesigned 2026-08-08 20:56 EDT from Harkirat's own JSON mockups
// (local/landingPageUI.json, local/gunsmithsUI.json), then revised again 21:31 EDT the same day from
// his direct review feedback. Landing page
// is a Section+thumbnail "hero" (mascot + tagline), two Link buttons (Website/Install), a flat
// command DIRECTORY grouped by category, then a category select menu. Picking a category (or using
// the `cmd:` autocomplete option) swaps to that category's own detail page: a real Usage/Options/
// Examples breakdown per command, options split under whichever command actually has them (never
// merged across commands with different option sets -- Gunsmiths is the one deliberate exception,
// since /all, /dmz, and every per-category command share the identical 3 options).
//
// Categories: Gunsmiths (/all, /dmz, and every live per-weapon-category command) / Draws / Seasonal
// Info / Utilities / Preferences (which also carries `/server` for server admins) / Bot Admin
// (whitelist-gated, hidden entirely from everyone else). Gunsmiths' per-category command list
// (`/ar`, `/lmg`, `/sniper`, …)
// is queried live from Mongo the same way index.js's handleBotReady() generates those commands --
// hardcoding it would silently go stale the moment a category is added/removed (see the "no
// duplicated state in prose" lesson + docs/superpowers/specs/2026-08-08-help-command-design.md).
//
// The `hidden` boolean option was renamed BOT-WIDE to `visibility` (every command, not just this
// one), and its TYPE changed from boolean to a 2-choice string (Hidden/Public) -- "visibility:
// True/False" doesn't read sensibly, "visibility: Hidden/Public" does. /help carries the SAME option
// itself now too (2026-08-08 21:29 EDT review pass) -- it's the one command that had been hardcoded
// ephemeral-only with no way to make it public, an inconsistency with every other command in the bot.
// No "Show Everyone" button here anymore (removed same pass, Harkirat's direct request) -- the
// visibility option already covers that case up front.
//
// MASCOT_URL is a permanent Cloudinary URL (`site_assets/dioreo-mascot-coral`, f_auto/q_auto
// delivery defaults applied) -- re-hosted from Harkirat's original upload (which was a Discord CDN
// attachment link with signed ex=/is=/hm= params that would have expired in roughly a day, same
// issue this repo already hit and fixed for calendar banners -- see .claude/rules/design-
// decisions.md's Cloudinary-rehost entry). Square 1:1 (already 2048x2048, full bleed, no transparent
// padding to trim) and horizontally flipped per Harkirat's request before upload.
//
// Every emoji is one of the bot's own existing custom icons (emojiMap.js). Per the emoji-capture
// rule (.claude/rules/rendering-and-ui.md), data below stores `emojiKey` STRINGS, never the emoji
// mention string itself -- every lookup happens inside a render function, never at require()-time.
// ⚠️ `dioreoCombo`/`loadouts` were JUST uploaded to the PROD Discord application and don't exist yet
// on the separate DEV application ("Dioreo (Dev)") -- refreshEmojiIds() reports them "unmatched" on
// boot there (fail-soft: cosmetics never block the bot), so they render broken on the dev bot
// specifically until Harkirat also uploads copies there. Not a code bug -- the payload itself is
// correct (verified directly against the generated JSON).

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const Loadout = require('../models/Loadout');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { sendV2Payload } = require('../utils/sendV2Payload');

// Coral -- matches the DIOREO mascot artwork's own coral branding (mascot filename:
// "DIOREO-mascot2-coral.png"), replacing the earlier standalone Sunbeam Yellow pick.
const PRESET_ACCENT = 16743772; // #FF7D5C

const HARKIRAT_ID = '1139845545754632283';
const WEBSITE_URL = 'https://dioreo.app';
// Matches .env's own CLIENT_ID -- verified 2026-08-08 20:57 EDT, not guessed.
const INSTALL_URL = 'https://discord.com/oauth2/authorize?client_id=1491474871778021550';
const MASCOT_URL = 'https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1786237039/site_assets/dioreo-mascot-coral.png';

// Single source of truth for the visibility option's copy -- reused verbatim as the real
// SlashCommandBuilder description AND every /help category's own [visibility] bullet, so the two
// can never drift apart the way "hidden ephemeral message" vs "True/False" once did.
const VISIBILITY_DESCRIPTION = 'Show this response only to you, or publicly to everyone in the chat.';
const VISIBILITY_BULLET = `-# 🔹 \`[visibility]\` ${VISIBILITY_DESCRIPTION}`;

// `staticCommands` is used for `/help cmd:` matching and autocomplete; Gunsmiths' dynamic
// per-category commands are resolved separately (see getLiveGunsmithCommandNames below) since they
// can't be hardcoded here. `dropdownDescription`s are written to be genuinely useful at a glance,
// not filler -- what you'll actually find in there.
// ⚠️ This USED to be the user-facing command list only, with manage/alerts/autobuild deliberately
// excluded. That changed 2026-08-10 18:57 EDT: they are listed now, in a Bot Admin category gated
// on the whitelist, because a command Harkirat cannot look up in his own help panel is a gap rather
// than a security measure. Restricted entries are HIDDEN from everyone else, not absent.
// Two INDEPENDENT permission levels, and they are not a hierarchy -- a server owner is not a bot
// admin, and Harkirat is a bot admin in servers where he holds no Manage Server. So visibility is a
// `requires` string naming which one a thing needs, checked against a `{ serverAdmin, botAdmin }`
// object, rather than a single boolean that would silently conflate them.
//   · `requires` on a CATEGORY hides the whole section (Bot Admin).
//   · `requires` on a COMMAND hides just that line, leaving its category visible (`/server` inside
//     Preferences), which is the shape Harkirat asked for on 2026-08-10 18:57 EDT.
// Every surface -- dropdown, landing directory, `cmd:` autocomplete, and the detail pages -- reads
// these same fields, so a new restricted command is one entry and cannot be half-added.
const cmd = (name, { requires = null, suffix = null } = {}) => ({ name, requires, suffix });

const permitted = (item, perms) => !item.requires || perms[item.requires] === true;
const visibleCategories = perms => CATEGORY_DEFS.filter(c => permitted(c, perms));
const visibleCommands = (category, perms) => category.staticCommands.filter(c => permitted(c, perms));
// A category whose fields change with permissions. Falls back to the plain field, so a category
// that has no admin variant needs no extra keys.
const categoryEmojiKey = (c, perms) => (perms.serverAdmin && c.emojiKeyServerAdmin) || c.emojiKey;
const categoryDescription = (c, perms) => (perms.serverAdmin && c.dropdownDescriptionServerAdmin) || c.dropdownDescription;

const CATEGORY_DEFS = [
    { key: 'gunsmiths', label: 'Gunsmiths', emojiKey: 'loadouts', dropdownDescription: 'Search MP and DMZ weapon loadouts', staticCommands: [cmd('/all'), cmd('/dmz')] },
    { key: 'draws', label: 'Draws', emojiKey: 'newDraws', dropdownDescription: 'Browse lucky draws & their CP costs', staticCommands: [cmd('/draws'), cmd('/draw prices')] },
    { key: 'seasonal', label: 'Seasonal Info', emojiKey: 'calendar', dropdownDescription: "This season's calendar, patch notes & end dates", staticCommands: [cmd('/calendar'), cmd('/patch notes'), cmd('/season end')] },
    { key: 'utilities', label: 'Utilities', emojiKey: 'eyedropper', dropdownDescription: 'Timestamp & profile color tools', staticCommands: [cmd('/colors'), cmd('/timestamp')] },
    // `/server` lives HERE rather than in a heading of its own (Harkirat, 2026-08-10 18:57 EDT). It
    // is still hidden from non-admins -- the gating is per-COMMAND now, not per-category -- but a
    // whole section for one command made the directory look top-heavy for the two people in a
    // server who can see it. The suffix is what tells an admin why it is sitting next to
    // `/settings`, and the emoji and description swap so the category reads as covering both.
    {
        key: 'preferences', label: 'Preferences',
        emojiKey: 'settings', emojiKeyServerAdmin: 'serverSettings',
        dropdownDescription: 'Manage your saved bot settings',
        dropdownDescriptionServerAdmin: 'Manage your personal & server admin settings',
        staticCommands: [cmd('/settings'), cmd('/server', { requires: 'serverAdmin', suffix: '(Admin)' })],
    },
    // Whole-category gating, unlike `/server` above: these are useless to anyone who is not on the
    // bot's own admin whitelist, and unlike Manage Server there is no per-guild version of that
    // permission. `database` is the emoji because this is the data-entry surface -- the same family
    // as the `mng*` icons `/manage`'s own panel uses.
    {
        key: 'botadmin', label: 'Bot Admin', emojiKey: 'database',
        dropdownDescription: "Harkirat's own data-entry & ops commands",
        staticCommands: [cmd('/manage'), cmd('/alerts'), cmd('/autobuild')],
        requires: 'botAdmin',
    },
];

const DETAIL_HEADERS = {
    gunsmiths: 'Gunsmith Commands',
    draws: 'Draws Commands',
    seasonal: 'Seasonal Info Commands',
    utilities: 'Utility Commands',
    botadmin: 'Bot Admin Commands',
    preferences: 'Preference Commands'
};

const USAGE_LEGEND = '-# **Usage: `/cmd <required> [optional]`**';

// Queried the SAME way index.js's handleBotReady() derives the live /ar, /lmg, /sniper, etc.
// commands, so this can never drift stale the way a hardcoded copy would the moment a category is
// added, renamed, or removed. Returns bare lowercase names (no leading slash), sorted.
async function getLiveGunsmithCommandNames() {
    const dbCategories = await Loadout.distinct('category', { mode: 'MP' });
    const mpCategories = Array.from(new Set([...dbCategories, 'SECONDARIES']));
    return mpCategories.map(cat => cat.toLowerCase().replace(/\s+/g, '')).sort();
}

async function resolveCommandToCategory(cmdName, perms = {}) {
    // Scoped to what this caller may see, so `/help cmd:/manage` from a non-admin resolves to
    // nothing and lands on the directory rather than opening a page they were never offered.
    for (const cat of visibleCategories(perms)) {
        if (visibleCommands(cat, perms).some(c => c.name === cmdName)) return cat.key;
    }
    const liveNames = await getLiveGunsmithCommandNames();
    if (liveNames.some(n => `/${n}` === cmdName)) return 'gunsmiths';
    return null;
}

// Every real command name this bot has, for /help's `cmd:` autocomplete -- static entries plus the
// live per-category Gunsmiths commands.
// `isAdmin` keeps admin-only commands out of a non-admin's suggestions. Autocomplete is the third
// of the three places the Server Admin category has to be filtered -- suggesting `/server` to
// someone and then handing them the directory when they pick it is worse than never offering it.
async function getAllHelpCommandNames(perms = {}) {
    const liveNames = (await getLiveGunsmithCommandNames()).map(n => `/${n}`);
    const staticNames = visibleCategories(perms).flatMap(c => visibleCommands(c, perms)).map(c => c.name);
    return [...staticNames, ...liveNames];
}

// Gunsmiths keeps ONE shared Options block (unlike every other category below) because /all, every
// per-category command, and /dmz genuinely share the identical 3 options -- splitting it three ways
// would just repeat the same lines three times, not clarify anything.
function buildGunsmithsBody(liveNames) {
    const categoryLine = liveNames.map(n => `\`/${n}\``).join(' · ');
    return `### \`/all\`\nSearch across all available MP loadouts\n### ${categoryLine}\nSearch for MP loadouts in a specific category\n### \`/dmz\`\nSearch for DMZ specific loadouts\n\n`
        + `-# **Options**\n-# 🔹 \`<weapon>\` Select weapon (supports autocomplete & partial word matching)\n-# 🔹 \`[build]\` Specify build number\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/all** weapon:\`AK117\`\n-# 🔸 **/smg** weapon:\`Switchblade X9\` build:\`2\` visibility:\`Hidden\``;
}

function buildDrawsBody() {
    return `### \`/draws\`\nBrowse this season's New and Returning lucky draws\n-# **Options**\n-# 🔹 \`[page]\` Jump directly to New Draws or Returning Draws\n${VISIBILITY_BULLET}\n`
        + `### \`/draw prices\`\nCP cost breakdown for every draw type, split by CP region\n-# **Options**\n-# 🔹 \`[region]\` Jump directly to the 10, 20, or 30 CP region\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/draws** page:\`Returning Draws\`\n-# 🔸 **/draw prices** region:\`30 CP Region\``;
}

function buildSeasonalBody() {
    return `### \`/calendar\`\nThis season's event timeline — Draws, Events, and Game Modes\n-# **Options**\n-# 🔹 \`[page]\` Jump directly to Draws/Events/Playlists & Modes\n-# 🔹 \`[view]\` Show all events, or only active/upcoming (defaults to your /settings choice)\n${VISIBILITY_BULLET}\n`
        + `### \`/patch notes\`\nLatest weapon balance changes, plus the full patch-note history\n-# **Options**\n-# 🔹 \`[season]\` Search for a specific previous season (start typing to see suggestions)\n${VISIBILITY_BULLET}\n`
        + `### \`/season end\`\nSee when this season's Battle Pass, Ranked, and DMZ seasons end\n-# **Options**\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/calendar** page:\`Events\` view:\`Active/Upcoming Only\`\n-# 🔸 **/patch notes** season:\`Season 6 — Take Your Heart\``;
}

function buildUtilitiesBody() {
    return `### \`/colors\`\nView the colors extracted from your Discord profile and pick which one accents your panels\n-# **Options**\n${VISIBILITY_BULLET}\n`
        + `### \`/timestamp\`\nConvert almost any date or time — including natural language — into a Discord timestamp that displays correctly in everyone's own timezone\n-# **Options**\n-# 🔹 \`<datetime>\` e.g. "tomorrow", "in 2 hours", "dec 25 at 9am", "19:30", "next monday"\n-# 🔹 \`[timezone]\` Defaults to your saved /settings timezone\n-# 🔹 \`[style]\` Pick one format, or leave blank for all formats\n-# 🔹 \`[view]\` Embed or plain Text, one-off only\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/colors** visibility:\`Public\`\n-# 🔸 **/timestamp** datetime:\`this saturday 7pm\` timezone:\`Pacific Time\`\n-# 🔸 **/timestamp** datetime:\`august 20\` style:\`Short Date (d)\`\n-# 🔸 **/timestamp** datetime:\`in 45 minutes\` view:\`Text\``;
}

// Server admins get a second command appended rather than a page of their own. The `/server` detail
// is the one place carrying the full precedence order and the two Discord limits, because the panel
// itself deliberately stays short -- see commands/server.js's note on the wall-of-text draft that
// got rejected 2026-08-10 18:23 EDT. Harkirat's framing on the caps: they are not a real constraint
// in practice ("why is a server adding 25 role overrides"), so they read as guidance about the
// intended workflow -- set a default, hand-pick the exceptions -- not as a warning.
function buildPreferencesBody(perms = {}) {
    const personal = `### \`/settings\`\nTwo pages: Visibility (who sees your responses by default) and Preferences (timezone, calendar filter, accent style, and more)\n-# **Options**\n${VISIBILITY_BULLET}\n\n`;
    if (!perms.serverAdmin) return personal + `-# **Examples**\n-# 🔸 **/settings**`;

    return personal
        + `### \`/server\` **(Admin)**\nDecide where Dioreo answers **publicly** and where it answers **only to the person who asked**. Needs **Manage Server**.\n-# **Options**\n-# 🔹 No options — it opens a panel with four pages: Overview, Channels, Roles and Commands\n\n`
        + `-# **How \`/server\`'s rules stack** — the most specific one wins\n-# 🔹 **1. Command** — a command listed as always-hidden answers privately everywhere. Admins are exempt.\n-# 🔹 **2. Role** — a role rule limited to certain channels, then a role rule that applies everywhere\n-# 🔹 **3. Channel** — a rule on that channel, or on its parent if you are in a thread\n-# 🔹 **4. Default** — whatever Overview is set to. New servers start fully public.\n-# 🔸 If two roles disagree at the same level, **public wins** — the same way an allow beats a deny in Discord's own permissions.\n\n`
        + `-# **The intended way to set it up**\n-# 🔸 Pick a server-wide default on **Overview** first, then hand-pick the handful of channels or roles that should differ. Building it exception-by-exception is the slow way round.\n-# 🔸 A rule can only make Dioreo **quieter**. Setting something to Public *permits* a public answer — it never overrides a member who chose hidden in their own \`/settings\`.\n\n`
        + `-# **Two Discord limits worth knowing**\n-# 🔸 Each menu takes **25 picks**. That is Discord's cap, not ours, and it is why the default-plus-exceptions approach above is the right shape — a server needing 25+ overrides usually wants a different default instead.\n-# 🔸 **Nothing here removes a command from your server.** Discord does not let a bot hide its own commands in one server. \`/server\` hides the *answer*; to remove the command itself, use **Server Settings → Integrations**.\n\n`
        + `-# **Examples**\n-# 🔸 **/settings**\n-# 🔸 **/server** → Overview → *Switch default to Hidden*, then Channels → allow \`#bot-spam\` publicly\n-# 🔸 **/server** → Roles → *Always public for these roles* → \`@Moderator\``;
}

// Gated on the bot's own admin whitelist, not on any guild permission -- these write to shared
// global data (one SeasonalData document, the Loadout collection) rather than to anything scoped to
// the server they are run in, which is exactly why no per-guild permission could ever grant them.
function buildBotAdminBody() {
    return `### \`/manage\`\nThe data-entry panel: seasonal info, draws, calendar, patch notes, loadouts, banners, and the next-season draft\n-# **Options**\n${VISIBILITY_BULLET}\n`
        + `### \`/alerts\`\nRead the bot's own alert history and health, straight from Discord instead of the VM\n-# **Options**\n${VISIBILITY_BULLET}\n`
        + `### \`/autobuild\`\nExtract a weapon loadout from a screenshot and stage it for review before it is saved\n-# **Options**\n${VISIBILITY_BULLET}\n\n`
        + `-# 🔸 These are gated on the bot's own admin whitelist, not on a server permission — Manage Server does not grant them, and they are not registered for guild install at all.\n\n`
        + `-# **Examples**\n-# 🔸 **/manage** → Calendar → *Bulk Add*\n-# 🔸 **/alerts**`;
}

const BODY_BUILDERS = {
    draws: buildDrawsBody,
    seasonal: buildSeasonalBody,
    utilities: buildUtilitiesBody,
    preferences: buildPreferencesBody,
    botadmin: buildBotAdminBody
};

// `isAdmin` hides the Server Admin category from everyone who could not use `/server` anyway.
// Harkirat's call, 2026-08-10 18:36 EDT. It is filtered in THREE places, not one -- the dropdown
// here, the landing directory, and the `cmd:` lookup in execute() -- because filtering only the
// visible menu leaves `/help cmd:server` working, which reads as the gate being broken rather than
// as a deliberate exception. Nothing here is secret; the point is that a member who cannot open the
// panel should not be shown a page about it.
function buildCategorySelectRow(selectedKey, perms = {}) {
    const isLanding = !selectedKey;
    const options = [
        { label: 'Commands List', value: 'landing', description: 'Back to the full command overview', emoji: emojis.parseEmoji(emojis.dioreoCombo), default: isLanding },
        ...visibleCategories(perms).map(c => ({
            label: c.label,
            value: c.key,
            description: categoryDescription(c, perms),
            emoji: emojis.parseEmoji(emojis[categoryEmojiKey(c, perms)]),
            default: c.key === selectedKey
        }))
    ];
    return { type: 1, components: [{ type: 3, custom_id: 'help_category', placeholder: 'Choose a category to explore…', options }] };
}

async function buildContainer(selectedKey, accentColor, perms = {}) {
    const components = [];

    // Someone who reaches a restricted category (a stale dropdown on an older panel, or
    // `/help cmd:manage`) is silently returned to the directory rather than refused -- there is
    // nothing to protect here, and an error message about a page they cannot see is worse than
    // simply not having the page.
    const requested = selectedKey && CATEGORY_DEFS.find(c => c.key === selectedKey);
    if (requested && !permitted(requested, perms)) selectedKey = null;

    if (!selectedKey) {
        const liveNames = await getLiveGunsmithCommandNames();
        const gunsmithsLine = ['all', ...liveNames, 'dmz'].map(n => `\`/${n}\``).join(' · ');

        components.push({
            type: 9,
            components: [{
                type: 10,
                content: `## ${emojis.dioreoCombo} Dioreo's Commands\n> **Dioreo** helps you look up CODM loadouts, lucky draw pricing, the seasonal event calendar, patch notes, and more!`
            }],
            accessory: { type: 11, media: { url: MASCOT_URL } }
        });
        components.push({
            type: 1,
            components: [
                { type: 2, style: 5, label: 'Website', url: WEBSITE_URL },
                { type: 2, style: 5, label: 'Install Dioreo', url: INSTALL_URL }
            ]
        });
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({
            type: 10,
            // GENERATED FROM CATEGORY_DEFS, not hand-written -- this used to be five hardcoded
            // lines, and adding the Server Admin category on 2026-08-10 walked straight into the
            // trap: the entry appeared in the dropdown (which does map over CATEGORY_DEFS) and was
            // missing from this list, because nothing ties the two together. Harkirat's call the
            // same day, on being told about it: "that's a real gap that will create staleness and
            // needs a proper solution." One source of truth is that solution -- a new category is
            // now a single array entry and cannot be half-added. Byte-for-byte identical output to
            // the hardcoded version, checked by diffing the rendered container before and after.
            // scripts/guildPolicyEnforcement.test.js asserts every category reaches this list.
            content: visibleCategories(perms)
                .map(c => {
                    // Gunsmiths is the one category whose commands are not a fixed list: the
                    // per-weapon commands are generated at boot from the categories present in
                    // MongoDB, so its line is built from the live names rather than staticCommands.
                    // A command's `suffix` rides here too -- that is how `/server` announces itself
                    // as an admin command while sitting inside Preferences.
                    const commands = c.key === 'gunsmiths'
                        ? gunsmithsLine
                        : visibleCommands(c, perms).map(x => `\`${x.name}\`${x.suffix ? ` *${x.suffix}*` : ''}`).join(' · ');
                    return `### ${emojis[categoryEmojiKey(c, perms)]} **${c.label.toUpperCase()}**\n**${commands}**\n`;
                })
                .join('')
                + `\n`
                + `-# 💠 **Learn more about a command:** **\`/help <command>\`**\n-# 💠 e.g: **/help** cmd:\`draws\`\n-# 💠 Or use the Dropdown below!\n\n`
                + `-# Report bugs & suggestions to <@${HARKIRAT_ID}>.`
        });
        components.push({ type: 14, spacing: 2, divider: true });
        // Deliberately NOT re-mentioning `/help cmd:` here -- the directory above already covers it
        // ("Learn more about a command: /help <command>... Or use the Dropdown below!"); repeating it
        // right below would just be the same instruction twice in one panel.
        components.push({ type: 10, content: `-# Select a category from the dropdown below` });
        components.push(buildCategorySelectRow(null, perms));
        components.push({ type: 14, spacing: 1, divider: true });
        components.push({ type: 10, content: `-# ${emojis.diorHeart} Made with love by <@${HARKIRAT_ID}>` });
    } else {
        const body = selectedKey === 'gunsmiths'
            ? buildGunsmithsBody(await getLiveGunsmithCommandNames())
            : BODY_BUILDERS[selectedKey](perms);

        components.push({ type: 10, content: `## ${emojis[categoryEmojiKey(CATEGORY_DEFS.find(c => c.key === selectedKey), perms)]} **${DETAIL_HEADERS[selectedKey]}**\n${USAGE_LEGEND}` });
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({ type: 10, content: body });
        components.push({ type: 14, spacing: 2, divider: true });
        // Detail pages DON'T already mention /help cmd: in their main content (unlike the landing
        // page above), so it's worth surfacing here -- reworded from the landing hint rather than
        // reused verbatim, since the two pages need different things said.
        components.push({ type: 10, content: `-# To see other commands, use the dropdown below or **\`/help <cmd>\`**` });
        components.push(buildCategorySelectRow(selectedKey, perms));
    }

    return { type: 17, accent_color: accentColor, components };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("See what Dioreo can do, and how to reach Harkirat with bugs or ideas")
        .addStringOption(option => option.setName('cmd').setDescription('Jump straight to a specific command').setAutocomplete(true))
        .addStringOption(option => option.setName('visibility').setDescription(`${VISIBILITY_DESCRIPTION} (Defaults to only you.)`).addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    CATEGORY_DEFS,
    PRESET_ACCENT,
    buildContainer,
    getAllHelpCommandNames,
    resolveCommandToCategory,

    // `categoryOverride` (passed by index.js's `help_category` select-menu handler via a synthetic
    // interaction) skips re-resolving the `cmd` option -- same shape as calendar.js's `pageOverride`.
    // 'landing' is a real dropdown VALUE (the "Commands List" reset option) but behaves identically
    // to null/no-selection, so it's normalized here rather than threading a 6th special case through
    // buildContainer.
    async execute(interaction, categoryOverride = null) {
        // The two permission levels, resolved once and threaded everywhere. Both are free: server
        // admin comes off the interaction's own computed permissions (no REST call, no privileged
        // intent, false outside a guild), and bot admin is an id comparison.
        const { isServerAdmin } = require('../utils/guildPolicy');
        const { ALLOWED_ADMIN_ID } = require('./manage');
        const perms = { serverAdmin: isServerAdmin(interaction), botAdmin: interaction.user.id === ALLOWED_ADMIN_ID };

        let selectedKey = categoryOverride;
        if (selectedKey === null && interaction.isChatInputCommand()) {
            const cmdOption = interaction.options.getString('cmd');
            if (cmdOption) selectedKey = await resolveCommandToCategory(cmdOption, perms);
        }
        if (selectedKey === 'landing') selectedKey = null;

        // Unlike every other command, /help has no saved preference to fall back to -- defaults to
        // hidden (matches /manage's/`/alerts`' own-panel convention) unless explicitly made public.
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);

        // No "Show Everyone" button -- the visibility option above already covers that case up
        // front, and repeating it here would be redundant (Harkirat's direct request).
        const components = [await buildContainer(selectedKey, accentColor, perms)];
        return await sendV2Payload(interaction, components);
    }
};
