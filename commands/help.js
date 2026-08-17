// ==========================================
// COMMAND: PLAYER GUIDE / HELP
// ==========================================
// ARCHITECTURE: Redesigned 2026-08-08 20:56 EDT from Harkirat's own JSON mockups (local/landingPageUI.json, local/gunsmithsUI.json), then revised again 21:31 EDT the same day from his direct review feedback. Landing page is a Section+thumbnail "hero" (mascot + tagline), two Link buttons (Website/Install), a flat command DIRECTORY grouped by category, then a category select menu. Picking a category (or using the `cmd:` autocomplete option) swaps to that category's own detail page: a real Usage/Options/ Examples breakdown per command, options split under whichever command actually has them (never merged across commands with different option sets -- `/gunsmiths search` and `/dmz` share one options block since their shapes are identical (weapon/build/visibility); `/gunsmiths list` gets its own, since a `scope` choice replaces weapon+build. Consolidated from `/all` + the eight per-category MP commands 2026-08-15 -- see docs/superpowers/specs/2026-08-15-gunsmiths-command- consolidation-design.md.
//
// Categories: Gunsmiths (/gunsmiths search, /gunsmiths list, /dmz) / Draws / Seasonal Info / Utilities / Preferences (which also carries `/admin` for server admins) / Bot Admin (whitelist-gated, hidden entirely from everyone else).
//
// The `hidden` boolean option was renamed BOT-WIDE to `visibility` (every command, not just this one), and its TYPE changed from boolean to a 2-choice string (Hidden/Public) -- "visibility: True/False" doesn't read sensibly, "visibility: Hidden/Public" does. /help carries the SAME option itself now too (2026-08-08 21:29 EDT review pass) -- it's the one command that had been hardcoded ephemeral-only with no way to make it public, an inconsistency with every other command in the bot. No "Show Everyone" button here anymore (removed same pass, Harkirat's direct request) -- the visibility option already covers that case up front.
//
// MASCOT_URL is a permanent Cloudinary URL (`site_assets/dioreo-mascot-coral`, f_auto/q_auto delivery defaults applied) -- re-hosted from Harkirat's original upload (which was a Discord CDN attachment link with signed ex=/is=/hm= params that would have expired in roughly a day, same issue this repo already hit and fixed for calendar banners -- see .claude/rules/design- decisions.md's Cloudinary-rehost entry). Square 1:1 (already 2048x2048, full bleed, no transparent padding to trim) and horizontally flipped per Harkirat's request before upload.
//
// Every emoji is one of the bot's own existing custom icons (emojiMap.js). Per the emoji-capture rule (.claude/rules/rendering-and-ui.md), data below stores `emojiKey` STRINGS, never the emoji mention string itself -- every lookup happens inside a render function, never at require()-time. ✅ RESOLVED 2026-08-16 21:06 EDT -- this used to warn that `dioreoCombo`/`loadouts` had JUST been uploaded to the PROD application and did not exist yet on the separate DEV application ("Dioreo (Dev)"), so they rendered as literal text there. Harkirat has since uploaded copies: a dev-bot boot now reports "54 re-pointed to this app, 0 dev-overridden, 0 unmatched", so every emoji this panel uses resolves on both applications. Kept as history rather than deleted because the underlying mechanism is still the thing to understand -- refreshEmojiIds() matches on NAME at boot and is fail-soft, so a newly-added emoji that exists on only one of the two applications will show this same symptom again, and "unmatched" in the boot log is where you would see it.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const Loadout = require('../models/Loadout');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { mentionCommand } = require('../utils/commandMentions');
const { fuzzyMatch } = require('../utils/search');

// Extra keywords that should also resolve a `/help cmd:` query -- typed words that don't literally match a command/category name but obviously mean it (added 2026-08-15 13:09 EDT, Harkirat's request to expand every cmd: alias, /admin's "server"/"owner" specifically named). Checked only AFTER every real command/category name fails to match, so a real name always wins over a loose keyword -- see resolveCommandToCategory and suggestHelpCommandNames below, the two places this is consulted. Not meant to be exhaustive linguistic coverage, just the words someone would plausibly type looking for that command.
const COMMAND_ALIASES = {
    '/admin': ['server', 'owner', 'serveradmin', 'permissions', 'visibility', 'moderation'],
    '/manage': ['database', 'data', 'db', 'admins', 'announcement', 'announcements'],
    '/bot analytics': ['alert', 'alerts', 'health', 'log', 'logs', 'uptime', 'usage', 'timing', 'audit', 'changes'],
    '/bot access': ['access', 'admins', 'permissions'],
    '/autobuild': ['screenshot', 'scan', 'ocr', 'import'],
    '/settings': ['preferences', 'prefs', 'config', 'timezone'],
    '/colors': ['color', 'accent', 'palette', 'avatar'],
    '/timestamp': ['time', 'clock', 'date'],
    '/gunsmiths': ['loadout', 'loadouts', 'gunsmith', 'gunsmiths', 'weapon', 'weapons', 'build', 'builds', 'meta', 'category', 'all', 'ar', 'smg', 'lmg', 'sniper', 'marksman', 'shotgun', 'secondaries'],
    '/dmz': ['dmzloadout', 'dmzloadouts'],
    '/draws': ['draw', 'luckydraw', 'luckydraws'],
    '/draw prices': ['prices', 'price', 'cp', 'cost', 'costs'],
    '/draw calculator': ['calculator', 'calc', 'shortfall', 'optimizer', 'howmuch'],
    '/calendar': ['events', 'schedule', 'timeline'],
    '/patch notes': ['patch', 'patchnotes', 'balance', 'changes', 'notes'],
    '/season end': ['seasonend', 'battlepass', 'bp', 'deadlines']
};
// Category-level aliases -- a word that should land on a whole category's page rather than a single command's (e.g. "bot admin" -> the Bot Admin category itself, not any one of its commands).
const CATEGORY_ALIASES = {
    botadmin: ['botadmin', 'admin', 'adminpanel', 'bot admin'],
    preferences: ['pref']
};

// Coral -- matches the DIOREO mascot artwork's own coral branding (mascot filename: "DIOREO-mascot2-coral.png"), replacing the earlier standalone Sunbeam Yellow pick. ⚠️ THIS BRIEFLY BECAME Signal Green #58D05A on 2026-08-16 20:38 EDT, to tie `/help` to the dioreo.app `/commands` page's 121° accent, and Harkirat REVERSED IT at 21:54 EDT after seeing both live: "scratch the green colour on /help, let's keep the coral colour for both /help and /invite." So `/help` and `/invite` deliberately SHARE this coral -- they are the bot's two meta commands (the ones about Dioreo itself rather than about CODM data), and the mascot they both display is coral. Recorded because the green is written up in the [[project_website_commands_page]] memory and in `local/commands-page-directions.html`, and a session finding that trail could reasonably conclude the swap never happened or was left half-done. It happened, and it was undone on purpose.
const PRESET_ACCENT = 16743772; // #FF7D5C

const HARKIRAT_ID = '1139845545754632283';
const WEBSITE_URL = 'https://dioreo.app';
// MOVED to utils/brandAssets.js on 2026-08-17 09:44 EDT -- it was a duplicate literal here and in commands/invite.js, and the width transform added there (measured: 266,911 → 13,601 bytes, 95% smaller) would otherwise have landed on one copy and not the other. The header note above still describes the asset itself correctly; only its address changed.
const { MASCOT_URL } = require('../utils/brandAssets');

// Single source of truth for the visibility option's copy -- reused verbatim as the real SlashCommandBuilder description AND every /help category's own [visibility] bullet, so the two can never drift apart the way "hidden ephemeral message" vs "True/False" once did.
const VISIBILITY_DESCRIPTION = 'Show this response only to you, or publicly to everyone in the chat.';
const VISIBILITY_BULLET = `-# 🔹 \`[visibility]\` ${VISIBILITY_DESCRIPTION}`;

// A body may ask for a REAL divider by embedding this marker; buildContainer splits on it and inserts a type-14 separator. Added 2026-08-10 19:28 EDT because Preferences documents two unrelated commands (`/settings` and `/admin`) on one page and they ran together -- a markdown rule inside a Text Display is not a divider, it is a row of dashes. ⚠️ USE IT BETWEEN SUBJECTS, NOT BETWEEN COMMANDS. Harkirat, 19:31 EDT: "i dont want a divider on EVERY command... i just want it between /settings and /server" -- then, on seeing it removed from the shared-Options boundary too, 19:38 EDT: "revert back to how you implemented it, i kind of liked your idea." So the live rule is the middle one: a divider separates two genuinely different SUBJECTS (one command from another, the commands from the options that apply to all of them), and never sits between a command and its own bullets. Once every section has one they stop marking anything at all.
const SECTION_BREAK = '\n<<<SECTION_BREAK>>>\n';

// `staticCommands` is used for `/help cmd:` matching and autocomplete. `dropdownDescription`s are written to be genuinely useful at a glance, not filler -- what you'll actually find in there. ⚠️ This USED to be the user-facing command list only, with manage/alerts/autobuild deliberately excluded. That changed 2026-08-10 18:57 EDT: they are listed now, in a Bot Admin category gated on the whitelist, because a command Harkirat cannot look up in his own help panel is a gap rather than a security measure. Restricted entries are HIDDEN from everyone else, not absent. Two INDEPENDENT permission levels, and they are not a hierarchy -- a server owner is not a bot admin, and Harkirat is a bot admin in servers where he holds no Manage Server. So visibility is a `requires` string naming which one a thing needs, checked against a `{ serverAdmin, botAdmin }` object, rather than a single boolean that would silently conflate them.
//   · `requires` on a CATEGORY hides the whole section (Bot Admin).
//   · `requires` on a COMMAND hides just that line, leaving its category visible (`/admin` inside
//     Preferences), which is the shape Harkirat asked for on 2026-08-10 18:57 EDT.
// Every surface -- dropdown, landing directory, `cmd:` autocomplete, and the detail pages -- reads these same fields, so a new restricted command is one entry and cannot be half-added.
const cmd = (name, { requires = null, suffix = null } = {}) => ({ name, requires, suffix });

const permitted = (item, perms) => !item.requires || perms[item.requires] === true;
const visibleCategories = perms => CATEGORY_DEFS.filter(c => permitted(c, perms));
const visibleCommands = (category, perms) => category.staticCommands.filter(c => permitted(c, perms));
// A category whose fields change with permissions. Falls back to the plain field, so a category that has no admin variant needs no extra keys.
const categoryEmojiKey = (c, perms) => (perms.serverAdmin && c.emojiKeyServerAdmin) || c.emojiKey;
const categoryDescription = (c, perms) => (perms.serverAdmin && c.dropdownDescriptionServerAdmin) || c.dropdownDescription;

const CATEGORY_DEFS = [
    { key: 'gunsmiths', label: 'Gunsmiths', emojiKey: 'loadouts', dropdownDescription: 'Search MP and DMZ weapon loadouts', staticCommands: [cmd('/gunsmiths'), cmd('/dmz')] },
    { key: 'draws', label: 'Draws', emojiKey: 'newDraws', dropdownDescription: 'Browse lucky draws & their CP costs', staticCommands: [cmd('/draws'), cmd('/draw prices'), cmd('/draw calculator')] },
    { key: 'seasonal', label: 'Seasonal Info', emojiKey: 'calendar', dropdownDescription: "This season's calendar, patch notes & end dates", staticCommands: [cmd('/calendar'), cmd('/patch notes'), cmd('/season end')] },
    { key: 'utilities', label: 'Utilities', emojiKey: 'eyedropper', dropdownDescription: 'Timestamp & profile color tools', staticCommands: [cmd('/colors'), cmd('/timestamp')] },
    // `/admin` lives HERE rather than in a heading of its own (Harkirat, 2026-08-10 18:57 EDT). It is still hidden from non-admins -- the gating is per-COMMAND now, not per-category -- but a whole section for one command made the directory look top-heavy for the two people in a server who can see it. The suffix is what tells an admin why it is sitting next to `/settings`, and the emoji and description swap so the category reads as covering both.
    {
        key: 'preferences', label: 'Preferences',
        emojiKey: 'settings', emojiKeyServerAdmin: 'serverSettings',
        dropdownDescription: 'Manage your saved bot settings',
        dropdownDescriptionServerAdmin: 'Manage your personal & server admin settings',
        staticCommands: [cmd('/settings'), cmd('/admin', { requires: 'serverAdmin', suffix: '(server)' })],
    },
    // Whole-category gating, unlike `/admin` above: these are useless to anyone who is not on the bot's own admin whitelist, and unlike Manage Server there is no per-guild version of that permission. `database` is the emoji because this is the data-entry surface -- the same family as the `mng*` icons `/manage`'s own panel uses.
    {
        key: 'botadmin', label: 'Bot Admin', emojiKey: 'database',
        dropdownDescription: "Dioreo's data management & ops commands",
        // Alphabetical, and it must MATCH buildBotAdminBody's order below -- the first draft listed these one way in the directory and another in the body, which reads as the page having lost track of itself. Harkirat asked for alphabetical here on 2026-08-10 19:34 EDT. ⚠️ Per-command `requires` (added 2026-08-13, per-command admin permissions) -- an admin granted only /bot analytics must not see /manage or /autobuild listed here even though the whole category is visible to them. Category-level `requires: 'botAdmin'` still gates the SECTION (shows if the user has ANY admin access at all, per utils/adminAccess.js's isAdmin()); each command's own key gates that ONE line, same pattern `/admin` already uses inside Preferences. `/bot access` is gated on `botAccess` (isOwner(), not a permission token -- see utils/adminAccess.js's header on why it can never have one).
        staticCommands: [cmd('/bot analytics', { requires: 'bot' }), cmd('/bot access', { requires: 'botAccess' }), cmd('/autobuild', { requires: 'autobuild' }), cmd('/manage', { requires: 'manage' })],
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

async function resolveCommandToCategory(cmdName, perms = {}) {
    // Scoped to what this caller may see, so `/help cmd:/manage` from a non-admin resolves to nothing and lands on the directory rather than opening a page they were never offered.
    for (const cat of visibleCategories(perms)) {
        if (visibleCommands(cat, perms).some(c => c.name === cmdName)) return cat.key;
    }
    // Alias fallback -- only reached once no real command/category name matched, so "server" only ever means /admin when nothing is literally named "server". Scoped by the same `perms` as above, so an alias can never surface a page its own command wouldn't have.
    const normalized = cmdName.toLowerCase().replace(/^\//, '').trim();
    for (const cat of visibleCategories(perms)) {
        for (const c of visibleCommands(cat, perms)) {
            if ((COMMAND_ALIASES[c.name] || []).includes(normalized)) return cat.key;
        }
        if ((CATEGORY_ALIASES[cat.key] || []).includes(normalized)) return cat.key;
    }
    return null;
}

// Every real command name a query could resolve to, INCLUDING a match via alias -- used by /help's `cmd:` autocomplete so typing "server" suggests real entry "/admin" rather than nothing. The suggested VALUE is always a real command name (never a bare alias word), so selecting it and pressing enter always hits the direct-match branch above with no alias lookup needed at that point.
async function suggestHelpCommandNames(query, perms = {}) {
    const allNames = await getAllHelpCommandNames(perms);
    const direct = allNames.filter(name => fuzzyMatch(query, name));

    const aliasMatched = new Set();
    for (const cat of visibleCategories(perms)) {
        for (const c of visibleCommands(cat, perms)) {
            const aliases = COMMAND_ALIASES[c.name] || [];
            if (aliases.some(a => fuzzyMatch(query, a))) aliasMatched.add(c.name);
        }
    }

    return [...new Set([...direct, ...aliasMatched])].slice(0, 25);
}

// Every real command name this bot has, for /help's `cmd:` autocomplete -- static entries plus the live per-category Gunsmiths commands. `isAdmin` keeps admin-only commands out of a non-admin's suggestions. Autocomplete is the third of the three places the Server Admin category has to be filtered -- suggesting `/admin` to someone and then handing them the directory when they pick it is worse than never offering it.
async function getAllHelpCommandNames(perms = {}) {
    return visibleCategories(perms).flatMap(c => visibleCommands(c, perms)).map(c => c.name);
}

// `/gunsmiths search` and `/dmz` share one Options block -- their shapes are genuinely identical (weapon/build/visibility). `/gunsmiths list` gets its own -- a `scope` choice replaces weapon+build, so folding it into the shared block would describe an option neither /search nor /dmz has.
function buildGunsmithsBody(perms, client) {
    return `### ${mentionCommand(client, '/gunsmiths search')}\nFind a specific MP weapon's loadout\n-# **Options**\n-# 🔹 \`<weapon>\` Select weapon (supports autocomplete & partial word matching)\n-# 🔹 \`[build]\` Specify build number\n${VISIBILITY_BULLET}\n`
        + `### ${mentionCommand(client, '/gunsmiths list')}\nBrowse a whole set of builds -- a weapon category, all MP builds, Meta (MP or DMZ), or DMZ\n-# **Options**\n-# 🔹 \`<scope>\` Pick what to browse\n${VISIBILITY_BULLET}\n`
        + `### ${mentionCommand(client, '/dmz')}\nSearch for DMZ specific loadouts\n-# **Options**\n-# 🔹 \`<weapon>\` Select weapon (supports autocomplete & partial word matching)\n-# 🔹 \`[build]\` Specify build number\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/gunsmiths search** weapon:\`AK117\`\n-# 🔸 **/gunsmiths search** weapon:\`Switchblade X9\` build:\`2\` visibility:\`Hidden\`\n-# 🔸 **/gunsmiths list** scope:\`SMG\`\n-# 🔸 **/gunsmiths list** scope:\`Meta — MP\`\n-# 🔸 **/dmz** weapon:\`Fennec\``;
}

function buildDrawsBody(perms, client) {
    return `### ${mentionCommand(client, '/draws')}\nBrowse this season's New and Returning lucky draws\n-# **Options**\n-# 🔹 \`[page]\` Jump directly to New Draws or Returning Draws\n${VISIBILITY_BULLET}\n`
        + `### ${mentionCommand(client, '/draw prices')}\nCP cost breakdown for every draw type, split by CP region\n-# **Options**\n-# 🔹 \`[region]\` Jump directly to the 10, 20, or 30 CP region\n${VISIBILITY_BULLET}\n`
        + `### ${mentionCommand(client, '/draw calculator')}\nHow much more CP you need to finish a draw, and the cheapest way to buy it\n-# **Options**\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/draws** page:\`Returning Draws\`\n-# 🔸 **/draw prices** region:\`30 CP Region\`\n-# 🔸 **/draw calculator**`;
}

function buildSeasonalBody(perms, client) {
    return `### ${mentionCommand(client, '/calendar')}\nThis season's event timeline — Draws, Events, and Game Modes\n-# **Options**\n-# 🔹 \`[page]\` Jump directly to Draws/Events/Playlists & Modes\n-# 🔹 \`[view]\` Show all events, or only active/upcoming (defaults to your ${mentionCommand(client, '/settings')} choice)\n${VISIBILITY_BULLET}\n`
        + `### ${mentionCommand(client, '/patch notes')}\nLatest weapon balance changes, plus the full patch-note history\n-# **Options**\n-# 🔹 \`[season]\` Search for a specific previous season (start typing to see suggestions)\n${VISIBILITY_BULLET}\n`
        + `### ${mentionCommand(client, '/season end')}\nSee when this season's Battle Pass, Ranked, and DMZ seasons end\n-# **Options**\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/calendar** page:\`Events\` view:\`Active/Upcoming Only\`\n-# 🔸 **/patch notes** season:\`Season 6 — Take Your Heart\``;
}

function buildUtilitiesBody(perms, client) {
    return `### ${mentionCommand(client, '/colors')}\nView the colors extracted from your Discord profile and pick which one accents your panels\n-# **Options**\n-# 🔹 \`[page]\` Jump directly to Avatar, Banner, Name, Nameplate, or Deco\n-# 🔹 \`[source]\` Read from your main profile, or your profile for this server\n${VISIBILITY_BULLET}\n`
        + `### ${mentionCommand(client, '/timestamp')}\nConvert almost any date or time — including natural language — into a Discord timestamp that displays correctly in everyone's own timezone\n-# **Options**\n-# 🔹 \`<datetime>\` e.g. "tomorrow", "in 2 hours", "dec 25 at 9am", "19:30", "next monday"\n-# 🔹 \`[timezone]\` Defaults to your saved ${mentionCommand(client, '/settings')} timezone\n-# 🔹 \`[style]\` Pick one format, or leave blank for all formats\n-# 🔹 \`[view]\` Embed or plain Text, one-off only\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n-# 🔸 **/colors** page:\`Nameplate\` source:\`From Server Profile\`\n-# 🔸 **/timestamp** datetime:\`this saturday 7pm\` timezone:\`Pacific Time\`\n-# 🔸 **/timestamp** datetime:\`august 20\` style:\`Short Date (d)\`\n-# 🔸 **/timestamp** datetime:\`in 45 minutes\` view:\`Text\``;
}

// Server admins get a second command appended rather than a page of their own. The `/admin` detail is the one place carrying the full precedence order and the two Discord limits, because the panel itself deliberately stays short -- see commands/admin.js's note on the wall-of-text draft that got rejected 2026-08-10 18:23 EDT. Harkirat's framing on the caps: they are not a real constraint in practice ("why is a server adding 25 role overrides"), so they read as guidance about the intended workflow -- set a default, hand-pick the exceptions -- not as a warning. TWO commands on one page, so they get a real divider between them and the shared `[visibility]` option is stated ONCE at the end rather than under each -- repeating it per command was Harkirat's call on 2026-08-10 19:28 EDT ("visibility is shared in all the commands so having it individually under each of them makes no sense"), and the same pass cut the /admin section roughly in half for being overwhelming to read. Gunsmiths already used the shared-options shape for the same reason.
function buildPreferencesBody(perms = {}, client) {
    const settings = `### ${mentionCommand(client, '/settings')}\nYour own preferences, in two pages — **Visibility** (who sees your responses by default) and **Preferences** (timezone, timestamp style, accent style, and more)`;

    if (!perms.serverAdmin) {
        return `${settings}\n\n-# **Options**\n${VISIBILITY_BULLET}\n\n-# **Examples**\n-# 🔸 **/settings**`;
    }

    return settings
        + SECTION_BREAK
        + `### ${mentionCommand(client, '/admin')}\nWhere Dioreo answers **publicly** and where it stays **private**, for the whole server. Needs **Manage Server**.\n`
        + `-# Opens a four-page panel — **Overview · Channels · Roles · Commands**\n\n`
        + `-# **Rule order** · the most specific one wins\n`
        + `-# 🔹 Command **→** Role **→** Channel **→** the Overview default\n`
        + `-# 🔹 Threads follow their parent channel · if two roles disagree, **public wins**\n\n`
        + `-# **Setting it up**\n`
        + `-# 🔸 Pick a default on **Overview**, then hand-pick the few channels or roles that should differ\n`
        + `-# 🔸 Rules only make Dioreo **quieter** — Public *permits* a public answer, it never overrides someone's own \`/settings\`\n\n`
        + `-# **Worth knowing**\n`
        + `-# 🔸 Each menu takes **25 picks** — Discord's cap, and a sign you want a different default instead\n`
        + `-# 🔸 It hides the **answer**, not the command — to remove a command entirely, use **Server Settings → Integrations**`
        + SECTION_BREAK
        + `-# **Options** · both commands\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n`
        + `-# 🔸 **/settings** visibility:\`Public\`\n`
        + `-# 🔸 **/admin** → **Overview** → *Switch default to Hidden*, then **Channels** → allow \`#bot-spam\`\n`
        + `-# 🔸 **/admin** → **Roles** → *Always public for these roles* → \`@Moderator\`\n`
        + `-# 🔸 **/admin** → **Commands** → mark \`/colors\` always-hidden, everything else stays public`;
}

// Gated on the bot's own admin whitelist, not on any guild permission -- these write to shared global data (one SeasonalData document, the Loadout collection) rather than to anything scoped to the server they are run in, which is exactly why no per-guild permission could ever grant them. That fact is a HINT at the foot of the page rather than a bullet in the middle: it explains the section, it is not something you do. ⚠️ Filtered per-command, not just per-category (fixed 2026-08-15 13:10 EDT) -- this used to render all three commands' full detail unconditionally, so an admin granted only /bot analytics still read the complete /manage and /autobuild writeups even though the directory/dropdown correctly hid those commands from them elsewhere. Category-level `requires: 'botAdmin'` only gates whether this page exists at all; each command's own perms key (perms.bot/perms.botAccess/perms.autobuild/ perms.manage) has to be checked again HERE, same as visibleCommands() already does for the directory and dropdown.
function buildBotAdminBody(perms, client) {
    const sections = [];
    if (perms.bot) {
        sections.push(`### ${mentionCommand(client, '/bot analytics')}\nThe bot's own usage, timing and health data, read from Discord instead of the VM\n`
            + `-# 🔹 \`[page]\` Jump directly to a page: \`Health\` · \`Alerts\` · \`Changes\` · \`Usage\` · \`Timing\``);
    }
    if (perms.botAccess) {
        sections.push(`### ${mentionCommand(client, '/bot access')}\nThe admin allowlist -- owner-only\n`
            + `-# 🔹 No options of its own`);
    }
    if (perms.autobuild) {
        sections.push(`### ${mentionCommand(client, '/autobuild')}\nRead an MP loadout out of a Gunsmith screenshot and stage it for review — nothing is saved until it is confirmed\n`
            + `-# 🔹 \`[screenshot]\` The Gunsmith screenshot to read — or use \`url\` instead, never both\n`
            + `-# 🔹 \`[url]\` A link to the screenshot, when the image is already hosted somewhere\n`
            + `-# 🔹 \`[category]\` \`AR\` · \`SMG\` · \`LMG\` · \`MARKSMAN\` · \`SNIPER\` · \`SHOTGUN\` · \`SECONDARIES\` — looked up from the weapon, or asked for, if left blank\n`
            + `-# 🔹 \`[badges]\` \`meta,best,top5,toxic\` — blank inherits from an existing build of the same weapon\n`
            + `-# 🔹 \`[retry_token]\` Only for re-submitting an image after a Cloudinary upload failure`);
    }
    if (perms.manage) {
        sections.push(`### ${mentionCommand(client, '/manage')}\nThe data-entry panel — seasonal info, draws, calendar, patch notes, loadouts, banners, admin access, announcements, and the next-season draft\n`
            + `-# 🔹 \`[content]\` Open a section directly: \`Draws\` · \`Calendar\` · \`Patch Notes\` · \`MP Loadouts\` · \`DMZ Loadouts\` · \`Season: Titles & Deadlines\` · \`Season: Next Season Draft\` · \`Manage Admins\` · \`Announcement\` · \`Bulk Format Guide\`\n`
            + `-# 🔹 On **Manage Admins**, Grant/Revoke are owner-only — every other whitelisted admin can still view the page and use Announcement.`);
    }

    const examples = [];
    if (perms.bot) examples.push(`-# 🔸 **/bot analytics** page:\`Usage\` visibility:\`Public\` — share usage data in a channel`);
    if (perms.autobuild) {
        examples.push(`-# 🔸 **/autobuild** screenshot:\`[upload]\` category:\`SMG\` badges:\`meta,top5\``);
        examples.push(`-# 🔸 **/autobuild** url:\`https://…\` — when the screenshot is already hosted`);
    }
    if (perms.manage) {
        examples.push(`-# 🔸 **/manage** content:\`Patch Notes\` — straight to the section, no clicking through`);
        examples.push(`-# 🔸 **/manage** content:\`Season: Next Season Draft\` — stage next season without touching what is live`);
    }

    return sections.join('\n')
        + SECTION_BREAK
        + `-# **Options** · every command above\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n${examples.join('\n')}\n\n`
        + `-# 💠 These are gated on **Dioreo's own admin whitelist**, not on a server permission — Manage Server does not grant them, and they are not registered for guild install at all.`;
}

const BODY_BUILDERS = {
    gunsmiths: buildGunsmithsBody,
    draws: buildDrawsBody,
    seasonal: buildSeasonalBody,
    utilities: buildUtilitiesBody,
    preferences: buildPreferencesBody,
    botadmin: buildBotAdminBody
};

// `isAdmin` hides the Server Admin category from everyone who could not use `/admin` anyway. Harkirat's call, 2026-08-10 18:36 EDT. It is filtered in THREE places, not one -- the dropdown here, the landing directory, and the `cmd:` lookup in execute() -- because filtering only the visible menu leaves `/help cmd:server` working, which reads as the gate being broken rather than as a deliberate exception. Nothing here is secret; the point is that a member who cannot open the panel should not be shown a page about it.
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

async function buildContainer(selectedKey, accentColor, perms = {}, client) {
    const components = [];

    // Someone who reaches a restricted category (a stale dropdown on an older panel, or `/help cmd:manage`) is silently returned to the directory rather than refused -- there is nothing to protect here, and an error message about a page they cannot see is worse than simply not having the page.
    const requested = selectedKey && CATEGORY_DEFS.find(c => c.key === selectedKey);
    if (requested && !permitted(requested, perms)) selectedKey = null;

    if (!selectedKey) {
        components.push({
            type: 9,
            components: [{
                type: 10,
                content: `## ${emojis.dioreoCombo} Dioreo's Commands\n> **Dioreo** helps you look up CODM loadouts, lucky draw pricing, the seasonal event calendar, patch notes, and more!`
            }],
            accessory: { type: 11, media: { url: MASCOT_URL } }
        });
        // `INSTALL_URL` used to be a hardcoded const with the PROD client_id baked in, which meant the DEV bot's own help panel offered an install link for the production application -- silent, and wrong. utils/inviteLinks.js resolves the id off the live client instead; its `chooser` shape is byte-identical to the old literal, so this button is unchanged on prod.
        const { buildInviteUrls } = require('../utils/inviteLinks');
        components.push({
            type: 1,
            components: [
                { type: 2, style: 5, label: 'Website', url: WEBSITE_URL },
                { type: 2, style: 5, label: 'Install Dioreo', url: buildInviteUrls(client).chooser }
            ]
        });
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({
            type: 10,
            // GENERATED FROM CATEGORY_DEFS, not hand-written -- this used to be five hardcoded lines, and adding the Server Admin category on 2026-08-10 walked straight into the trap: the entry appeared in the dropdown (which does map over CATEGORY_DEFS) and was missing from this list, because nothing ties the two together. Harkirat's call the same day, on being told about it: "that's a real gap that will create staleness and needs a proper solution." One source of truth is that solution -- a new category is now a single array entry and cannot be half-added. Byte-for-byte identical output to the hardcoded version, checked by diffing the rendered container before and after. scripts/guildPolicyEnforcement.test.js asserts every category reaches this list.
            content: visibleCategories(perms)
                .map(c => {
                    // A command's `suffix` rides here too -- that is how `/admin` announces itself as an admin command while sitting inside Preferences.
                    const commands = visibleCommands(c, perms).map(x => `${mentionCommand(client, x.name)}${x.suffix ? ` *${x.suffix}*` : ''}`).join(' · ');
                    return `### ${emojis[categoryEmojiKey(c, perms)]} **${c.label.toUpperCase()}**\n**${commands}**\n`;
                })
                .join('')
                + `\n`
                + `-# 💠 **Learn more about a command:** **\`/help <command>\`**\n-# 💠 e.g: **/help** cmd:\`draws\`\n-# 💠 Or use the Dropdown below!\n\n`
                + `-# Report bugs & suggestions to <@${HARKIRAT_ID}>.`
        });
        components.push({ type: 14, spacing: 2, divider: true });
        // Deliberately NOT re-mentioning `/help cmd:` here -- the directory above already covers it ("Learn more about a command: /help <command>... Or use the Dropdown below!"); repeating it right below would just be the same instruction twice in one panel.
        components.push({ type: 10, content: `-# Select a category from the dropdown below` });
        components.push(buildCategorySelectRow(null, perms));
        components.push({ type: 14, spacing: 1, divider: true });
        components.push({ type: 10, content: `-# ${emojis.diorHeart} Made with love by <@${HARKIRAT_ID}>` });
    } else {
        const body = BODY_BUILDERS[selectedKey](perms, client);

        components.push({ type: 10, content: `## ${emojis[categoryEmojiKey(CATEGORY_DEFS.find(c => c.key === selectedKey), perms)]} **${DETAIL_HEADERS[selectedKey]}**\n${USAGE_LEGEND}` });
        components.push({ type: 14, spacing: 2, divider: true });
        body.split(SECTION_BREAK).forEach((chunk, i) => {
            if (i > 0) components.push({ type: 14, spacing: 1, divider: true });
            components.push({ type: 10, content: chunk });
        });
        components.push({ type: 14, spacing: 2, divider: true });
        // Detail pages DON'T already mention /help cmd: in their main content (unlike the landing page above), so it's worth surfacing here -- reworded from the landing hint rather than reused verbatim, since the two pages need different things said.
        components.push({ type: 10, content: `-# To see other commands, use the dropdown below or **\`/help <cmd>\`**` });
        components.push(buildCategorySelectRow(selectedKey, perms));

        // Bulk Format Guide dropdown (item 10, added 2026-08-15 13:11 EDT) -- lets an admin jump straight to one of /manage's rich guide topics from THIS page, without having to open /manage first. Only offered when perms.manage is true (Announcement's own guide is manage-gated, same as every other /manage guide topic) -- gating this on perms.botAdmin instead would offer it to an admin granted only /bot analytics, who cannot open /manage at all. handlers/help.js's `help_guide_pick` branch opens the real guide container.
        if (selectedKey === 'botadmin' && perms.manage) {
            const { topicDefs } = require('../utils/manageGuides');
            components.push({ type: 14, spacing: 1, divider: true });
            components.push({ type: 10, content: `-# ${emojis.guide} Jump straight to a \`/manage\` bulk format guide:` });
            components.push({
                type: 1,
                components: [{
                    type: 3,
                    custom_id: 'help_guide_pick',
                    placeholder: 'Open a /manage guide topic...',
                    options: topicDefs().map(t => ({ label: t.label, value: t.key, description: t.description, emoji: t.emoji || undefined }))
                }]
            });
        }
    }

    return { type: 17, accent_color: accentColor, components };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("See what Dioreo can do, and how to reach Dior with bugs or ideas")
        .addStringOption(option => option.setName('cmd').setDescription('Jump straight to a specific command').setAutocomplete(true))
        .addStringOption(option => option.setName('visibility').setDescription(`${VISIBILITY_DESCRIPTION} (Defaults to only you.)`).addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    CATEGORY_DEFS,
    PRESET_ACCENT,
    buildContainer,
    getAllHelpCommandNames,
    resolveCommandToCategory,
    suggestHelpCommandNames,

    // `categoryOverride` (passed by handlers/help.js's `help_category` select-menu handler via a synthetic interaction) skips re-resolving the `cmd` option -- same shape as calendar.js's `pageOverride`. 'landing' is a real dropdown VALUE (the "Commands List" reset option) but behaves identically to null/no-selection, so it's normalized here rather than threading a 6th special case through buildContainer.
    async execute(interaction, categoryOverride = null) {
        // The two permission levels, resolved once and threaded everywhere. Both are free: server admin comes off the interaction's own computed permissions (no REST call, no privileged intent, false outside a guild), and bot admin is an id comparison.
        const { isServerAdmin } = require('../utils/guildPolicy');
        const { isAdmin, hasCommandAccess, isOwner } = require('../utils/adminAccess');
        // Per-command keys (2026-08-13) alongside the coarse `botAdmin` (any access, gates the whole category) -- an admin granted only /bot analytics must not see /manage or /autobuild listed under it, even though the section itself is visible to them. `botAccess` is isOwner(), never a permission token -- /bot access can't be granted.
        const perms = {
            serverAdmin: isServerAdmin(interaction),
            botAdmin: await isAdmin(interaction.user.id),
            manage: await hasCommandAccess(interaction.user.id, 'manage'),
            bot: await hasCommandAccess(interaction.user.id, 'bot'),
            botAccess: isOwner(interaction.user.id),
            autobuild: await hasCommandAccess(interaction.user.id, 'autobuild')
        };

        let selectedKey = categoryOverride;
        if (selectedKey === null && interaction.isChatInputCommand()) {
            const cmdOption = interaction.options.getString('cmd');
            if (cmdOption) selectedKey = await resolveCommandToCategory(cmdOption, perms);
        }
        if (selectedKey === 'landing') selectedKey = null;

        // Unlike every other command, /help has no saved preference to fall back to -- defaults to hidden (matches /manage's/`/alerts`' own-panel convention) unless explicitly made public.
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);

        // No "Show Everyone" button -- the visibility option above already covers that case up front, and repeating it here would be redundant (Harkirat's direct request).
        const components = [await buildContainer(selectedKey, accentColor, perms, interaction.client)];
        return await sendV2Payload(interaction, components);
    }
};
