// ==========================================
// COMMAND: PLAYER GUIDE / HELP
// ==========================================
// ARCHITECTURE: Redesigned 2026-08-08 20:56 EDT from Harkirat's own JSON mockups (local/landingPageUI.json, local/gunsmithsUI.json), then revised again 21:31 EDT the same day from his direct review feedback. Landing page is a Section+thumbnail "hero" (mascot + tagline), two Link buttons (Website/Install), a flat command DIRECTORY grouped by category, then a category select menu. Picking a category (or using the `cmd:` autocomplete option) swaps to that category's own detail page: a real Usage/Options/ Examples breakdown per command, options split under whichever command actually has them (never merged across commands with different option sets -- `/gunsmith mp` and `/gunsmith dmz` have identical shapes (weapon/build/visibility) but each is its own detailCommands entry with its own options block; the `/gunsmith search` and `list` subcommands this used to document were removed 2026-10-19. Consolidated from `/all` + the eight per-category MP commands 2026-08-15 -- see docs/superpowers/specs/2026-08-15-gunsmiths-command-consolidation-design.md.
//
// 🔄 B6 (2026-10-29, Harkirat's designs, approved 19:02-23:52 EDT): the category pages and the category dropdown are GONE. /help is a home page and one page per command, each in a typed and a slash view, built by utils/helpPages.js; the command switcher sits outside the card. CATEGORY_DEFS below stays as data: it still decides who may see which command (`requires`), feeds the `cmd:` search, and is what the dioreo.app /commands page (scripts/lib/commandCatalog.js) and scripts/commandOptions.test.js read.
//
// Categories: Gunsmith (/gunsmith mp, /gunsmith dmz, /dmz) / Draws / Seasonal Info / Utilities / Preferences (which also carries `/admin` for server admins) / Bot Admin (whitelist-gated, hidden entirely from everyone else).
//
// The `hidden` boolean option was renamed BOT-WIDE to `visibility` (every command, not just this one), and its TYPE changed from boolean to a 2-choice string (Hidden/Public) -- "visibility: True/False" doesn't read sensibly, "visibility: Hidden/Public" does. /help carries the SAME option itself now too (2026-08-08 21:29 EDT review pass) -- it's the one command that had been hardcoded ephemeral-only with no way to make it public, an inconsistency with every other command in the bot. No "Show Everyone" button here anymore (removed same pass, Harkirat's direct request) -- the visibility option already covers that case up front.
//
// MASCOT_URL is a permanent Cloudinary URL (`site_assets/dioreo-mascot-coral`, f_auto/q_auto delivery defaults applied) -- re-hosted from Harkirat's original upload (which was a Discord CDN attachment link with signed ex=/is=/hm= params that would have expired in roughly a day, same issue this repo already hit and fixed for calendar banners -- see .claude/rules/design- decisions.md's Cloudinary-rehost entry). Square 1:1 (already 2048x2048, full bleed, no transparent padding to trim) and horizontally flipped per Harkirat's request before upload.
//
// Every emoji is one of the bot's own existing custom icons (emojiMap.js). Per the emoji-capture rule (.claude/rules/rendering-and-ui.md), data below stores `emojiKey` STRINGS, never the emoji mention string itself -- every lookup happens inside a render function, never at require()-time. ✅ RESOLVED 2026-08-16 21:06 EDT -- this used to warn that `dioreoCombo`/`loadouts` had JUST been uploaded to the PROD application and did not exist yet on the separate DEV application ("Dioreo (Dev)"), so they rendered as literal text there. Harkirat has since uploaded copies: a dev-bot boot now reports "54 re-pointed to this app, 0 dev-overridden, 0 unmatched", so every emoji this panel uses resolves on both applications. Kept as history rather than deleted because the underlying mechanism is still the thing to understand -- refreshEmojiIds() matches on NAME at boot and is fail-soft, so a newly-added emoji that exists on only one of the two applications will show this same symptom again, and "unmatched" in the boot log is where you would see it.

const { SlashCommandBuilder } = require('discord.js');
const UserPreference = require('../models/UserPreference');
const emojis = require('../utils/emojiMap');
const { getAccentColorForCommand } = require('../utils/accentColor');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { mentionCommand } = require('../utils/commandMentions');

// Extra keywords that should also resolve a `/help cmd:` query -- typed words that don't literally match a command/category name but obviously mean it (added 2026-08-15 13:09 EDT, Harkirat's request to expand every cmd: alias, /admin's "server"/"owner" specifically named). Checked only AFTER every real command/category name fails to match, so a real name always wins over a loose keyword -- see resolveCommandToCategory and suggestHelpCommandNames below, the two places this is consulted. Not meant to be exhaustive linguistic coverage, just the words someone would plausibly type looking for that command.
const COMMAND_ALIASES = {
    '/admin': ['server', 'owner', 'serveradmin', 'permissions', 'visibility', 'moderation'],
    '/manage': ['database', 'data', 'db', 'admins', 'announcement', 'announcements'],
    '/bot analytics': ['alert', 'alerts', 'health', 'log', 'logs', 'uptime', 'usage', 'timing', 'audit', 'changes'],
    '/bot access': ['access', 'admins', 'permissions'],
    '/bot servers': ['servers', 'server settings', 'override', 'reset'],
    '/bot penalties': ['penalties', 'spam', 'penalty', 'lift', 'block user'],
    '/bot freeze': ['freeze', 'pause', 'kill switch', 'stop'],
    '/autobuild': ['screenshot', 'scan', 'ocr', 'import'],
    '/settings': ['preferences', 'prefs', 'config', 'timezone'],
    '/invite': ['add', 'install', 'addbot', 'share', 'link'],
    '/colors': ['color', 'accent', 'palette', 'avatar'],
    '/timestamp': ['time', 'clock', 'date'],
    '/gunsmith': ['loadout', 'loadouts', 'gunsmith', 'gunsmiths', 'weapon', 'weapons', 'build', 'builds', 'meta', 'category', 'all', 'ar', 'smg', 'lmg', 'sniper', 'marksman', 'shotgun', 'secondaries'],
    // '/dmz' aliases removed while /dmz is hidden (2026-10-21 21:05 EDT); restore ['dmzloadout', 'dmzloadouts'] with it.
    '/draws': ['draw', 'luckydraw', 'luckydraws'],
    '/draw prices': ['prices', 'price', 'cp', 'cost', 'costs'],
    '/draw calculator': ['calculator', 'calc', 'shortfall', 'optimizer', 'howmuch'],
    '/calendar': ['events', 'schedule', 'timeline'],
    '/today': ['today', 'reset', 'daily', 'live', 'now'],
    '/remind': ['remind', 'reminder', 'reminders', 'notify', 'notification', 'notifications', 'dm', 'alert'],
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


// `staticCommands` is used for `/help cmd:` matching and autocomplete. `dropdownDescription`s are written to be genuinely useful at a glance, not filler -- what you'll actually find in there. ⚠️ This USED to be the user-facing command list only, with manage/alerts/autobuild deliberately excluded. That changed 2026-08-10 18:57 EDT: they are listed now, in a Bot Admin category gated on the whitelist, because a command Harkirat cannot look up in his own help panel is a gap rather than a security measure. Restricted entries are HIDDEN from everyone else, not absent. Two INDEPENDENT permission levels, and they are not a hierarchy -- a server owner is not a bot admin, and Harkirat is a bot admin in servers where he holds no Manage Server. So visibility is a `requires` string naming which one a thing needs, checked against a `{ serverAdmin, botAdmin }` object, rather than a single boolean that would silently conflate them.
//   · `requires` on a CATEGORY hides the whole section (Bot Admin).
//   · `requires` on a COMMAND hides just that line, leaving its category visible (`/admin` inside
//     Preferences), which is the shape Harkirat asked for on 2026-08-10 18:57 EDT.
// Every surface -- dropdown, landing directory, `cmd:` autocomplete, and the detail pages -- reads these same fields, so a new restricted command is one entry and cannot be half-added. `description`/`options` (v3-pre-release review finding #49) carry a command's DETAIL-PAGE body as data instead of hand-concatenated markdown -- only the four categories whose commands render a per-command "-# **Options**" block inline (gunsmith/draws/seasonal/utilities) use them; the two admin categories keep bespoke prose (see buildPreferencesBody/buildBotAdminBody below) since their shape genuinely isn't "one command, one options list". An option's `desc` (or a command's `description`) may be a plain string or a `(client) => string` function, for the one case (/timestamp's `[timezone]`) that needs a live mentionCommand() call -- see resolveText() below.
const cmd = (name, { requires = null, suffix = null, description = null, jumpDescription = null, options = [] } = {}) => ({ name, requires, suffix, description, jumpDescription, options });

const permitted = (item, perms) => !item.requires || perms[item.requires] === true;
const visibleCategories = perms => CATEGORY_DEFS.filter(c => permitted(c, perms));
const visibleCommands = (category, perms) => category.staticCommands.filter(c => permitted(c, perms));
// A category whose fields change with permissions. Falls back to the plain field, so a category that has no admin variant needs no extra keys.
const categoryEmojiKey = (c, perms) => (perms.serverAdmin && c.emojiKeyServerAdmin) || c.emojiKey;
const categoryDescription = (c, perms) => (perms.serverAdmin && c.dropdownDescriptionServerAdmin) || c.dropdownDescription;

const resolveText = (value, client) => typeof value === 'function' ? value(client) : value;

// Where typed forms can work: a server Dioreo is in (Harkirat, 2026-10-29 00:45 EDT, "sure" to hiding them outside servers). The listener ignores DMs, and a user-installed /help run in a server Dioreo was never added to has a guildId but no listener there either, so both get slash forms only. `client.guilds.cache` holds exactly the servers Dioreo is in (the Guilds intent). A synthetic re-entry (a dropdown click) and a text command's adapter both carry guildId and client, so every page of one /help agrees.
const typedFormsHere = interaction => Boolean(interaction?.guildId && interaction.client?.guilds?.cache?.has(interaction.guildId));

const CATEGORY_DEFS = [
    {
        key: 'gunsmith', label: 'Gunsmith', emojiKey: 'gunsmithSearch', dropdownDescription: 'The best MP & DMZ builds and Gunsmith Codes',
        // staticCommands is [/gunsmith] only (/dmz is hidden for now) -- the directory/dropdown/autocomplete mention `/gunsmith` as one entry (Discord resolves that base mention regardless of which subcommand someone picks), but the detail page below documents its two REAL subcommands separately. detailCommands is the finer-grained list that divergence needs -- unlike draws/seasonal/utilities, where staticCommands already matches 1:1 and no second list is needed. Neither list carries a `requires`, so there is no permission-filtering concern for this category either way. ⚠️ CORRECTED 2026-10-17 23:51 EDT: the landing directory used to mention bare `/gunsmith`, and Discord renders a mention of a command that has subcommands as plain text, never a link (Harkirat: "the /gunsmith command link seems to be broken in the /help command landing"). The landing now lists detailCommands when a category has them, so it reads `/gunsmith mp` · `/gunsmith dmz` · `/dmz`, each a real link (it read `/gunsmith search` · `/gunsmith list` · `/dmz` until 2026-10-19 19:43 EDT). staticCommands keeps `/gunsmith` for `cmd:` lookup and its aliases. /dmz left out while it is hidden (2026-10-21 21:05 EDT, commands/dmz.js's devOnly note); add cmd('/dmz') back here and its detail entry below when it returns.
        staticCommands: [cmd('/gunsmith')],
        detailCommands: [
            cmd('/gunsmith mp', {
                description: "Find an MP weapon's loadout, or browse a whole class or the Meta",
                options: [
                    { name: 'weapon', required: true, desc: 'Pick a weapon, or an "All … builds" row at the top to browse' }
                ]
            }),
            cmd('/gunsmith dmz', {
                description: "Find a DMZ weapon's loadout, or browse Meta or every DMZ build",
                options: [
                    { name: 'weapon', required: true, desc: 'Pick a weapon, or an "All … builds" row at the top to browse' }
                ]
            })
        ]
    },
    {
        key: 'draws', label: 'Draws', emojiKey: 'newDraws', dropdownDescription: 'Lucky Draws, CP prices and the calculator',
        staticCommands: [
            cmd('/draws', {
                description: "Browse this season's New and Returning lucky draws",
                options: [{ name: 'page', required: false, desc: 'Jump directly to New Draws or Returning Draws' }]
            }),
            cmd('/draw prices', {
                description: 'CP cost breakdown for every draw type, split by CP region',
                options: [
                    { name: 'filter', required: false, desc: 'Quickly open a draw type' },
                    { name: 'region', required: false, desc: 'View costs for a specific CP region' }
                ]
            }),
            cmd('/draw calculator', {
                description: 'Work out the CP for your draws and Mythic upgrades, what you still need, and the bundles to buy',
                options: [{ name: 'page', required: false, desc: 'Open on Start a Calculation, View Saved, or Help' }]
            })
        ]
    },
    {
        key: 'seasonal', label: 'Seasonal Info', emojiKey: 'calendar', dropdownDescription: 'Today, the calendar, reminders and patch notes',
        staticCommands: [
            cmd('/calendar', {
                description: "Today's screen, then this season's timeline: Draws, Events, and Playlists & Modes",
                // [view] (renamed [filter] 2026-10-21) description corrected (v3-pre-release review, finding #63) -- commands/calendar.js silenced the /settings-saved default 2026-08-15; it is a one-off per-invocation choice only, never saved.
                options: [
                    { name: 'page', required: false, desc: 'Open on Today, Draws, Events, or Playlists & Modes' },
                    { name: 'filter', required: false, desc: 'Full timeline, or only past, ended, live or upcoming entries (not saved)' }
                ]
            }),
            cmd('/today', { description: "What's new today, what's going live, and what's leaving soon" }),
            cmd('/remind', {
                description: 'Set and manage your reminders',
                options: [
                    { name: 'releases', required: false, desc: 'A reminder for when something goes live; pick it again to turn it off' },
                    { name: 'leaving', required: false, desc: 'A reminder for when something is leaving; pick it again to turn it off' }
                ]
            }),
            cmd('/patch notes', {
                description: 'Latest weapon balance changes, plus the full patch-note history',
                options: [{ name: 'season', required: false, desc: 'Search for a specific previous season (start typing to see suggestions)' }]
            }),
            cmd('/season end', { description: "See when this season's Battle Pass, Ranked, and DMZ seasons end" })
        ]
    },
    {
        key: 'utilities', label: 'Utilities', emojiKey: 'eyedropper', dropdownDescription: 'Profile colors, timestamps and adding Dioreo',
        staticCommands: [
            cmd('/colors', {
                description: 'View the colors extracted from your Discord profile and pick which one accents your panels',
                options: [
                    { name: 'page', required: false, desc: 'Open on Avatar, Banner, Username, Nameplate, or Deco' },
                    { name: 'source', required: false, desc: 'Your main profile, or your profile for this server' }
                ]
            }),
            cmd('/timestamp', {
                description: 'Convert almost any date or time — including natural language — into a Discord timestamp that displays correctly in everyone\'s own timezone',
                options: [
                    { name: 'datetime', required: true, desc: 'e.g. "tomorrow", "in 2 hours", "dec 25 at 9am", "8pm to 10pm", "19:30"' },
                    { name: 'timezone', required: false, desc: (client) => `Defaults to your saved ${mentionCommand(client, '/settings')} timezone` },
                    { name: 'style', required: false, desc: 'Short List, All Formats, or one format; blank uses your saved style' },
                    { name: 'view', required: false, desc: 'Embed or plain Text, one-off only' }
                ]
            }),
            cmd('/invite', {
                description: 'Get a link to add Dioreo to a server or your own account, or a plain URL to share outside Discord'
            })
        ]
    },
    // `/admin` lives HERE rather than in a heading of its own (Harkirat, 2026-08-10 18:57 EDT). It is still hidden from non-admins -- the gating is per-COMMAND now, not per-category -- but a whole section for one command made the directory look top-heavy for the two people in a server who can see it. The suffix is what tells an admin why it is sitting next to `/settings`, and the emoji and description swap so the category reads as covering both.
    {
        key: 'preferences', label: 'Preferences',
        emojiKey: 'settings', emojiKeyServerAdmin: 'serverSettings',
        dropdownDescription: 'Your saved preferences',
        dropdownDescriptionServerAdmin: "Your preferences and your server's rules",
        staticCommands: [cmd('/settings', { jumpDescription: 'Your timezone, reply visibility, CP region and colors' }), cmd('/admin', { requires: 'serverAdmin', suffix: '(server)', jumpDescription: "Choose where Dioreo's replies stay private in your server" })],
    },
    // Whole-category gating, unlike `/admin` above: these are useless to anyone who is not on the bot's own admin whitelist, and unlike Manage Server there is no per-guild version of that permission. `botAccess` is the emoji (2026-08-22, Harkirat's call) -- the SAME icon /bot access's own panel heading uses, so the category and the surface it leads to read as one thing. It replaced `database`, which was borrowed from the `mng*` data-entry family and described only one of the five commands listed here.
    {
        key: 'botadmin', label: 'Bot Admin', emojiKey: 'botAccess',
        dropdownDescription: 'Data entry, analytics and admin tools',
        // Alphabetical, and it must MATCH buildBotAdminBody's order below -- the first draft listed these one way in the directory and another in the body, which reads as the page having lost track of itself. Harkirat asked for alphabetical here on 2026-08-10 19:34 EDT. ⚠️ Per-command `requires` (added 2026-08-13, per-command admin permissions) -- an admin granted only /bot analytics must not see /manage or /autobuild listed here even though the whole category is visible to them. Category-level `requires: 'botAdmin'` still gates the SECTION (shows if the user has ANY admin access at all, per utils/adminAccess.js's isAdmin()); each command's own key gates that ONE line, same pattern `/admin` already uses inside Preferences. `/bot access` is gated on `botAccess` (isOwner(), not a permission token -- see utils/adminAccess.js's header on why it can never have one).
        staticCommands: [cmd('/bot analytics', { requires: 'bot', jumpDescription: 'Usage, timing, health, alerts and recent changes' }), cmd('/bot access', { requires: 'botAccess', jumpDescription: 'Grant or revoke admin access' }), cmd('/bot hotpatch', { requires: 'botAccess', jumpDescription: 'Reload changed files into the running bot' }), cmd('/bot servers', { requires: 'botAccess', jumpDescription: 'The servers Dioreo is in, and their settings' }), cmd('/bot penalties', { requires: 'botAccess', jumpDescription: 'Spam penalties: lift, extend, exempt, block' }), cmd('/bot freeze', { requires: 'botAccess', jumpDescription: 'Pause Dioreo or some commands, no deploy' }), cmd('/embed', { requires: 'botAccess', jumpDescription: 'Render pasted message JSON to check a design' }), cmd('/manage emojis', { requires: 'botAccess', jumpDescription: 'Every emoji on each bot, with one-tap sync' }), cmd('/autobuild', { requires: 'autobuild', jumpDescription: 'Turn Gunsmith screenshots into builds' }), cmd('/manage', { requires: 'manage', jumpDescription: 'Add and edit draws, calendar, patch notes, loadouts and more' })],
        requires: 'botAdmin',
    },
];

// The right-click apps /help's search can find (2026-10-25 23:05 EDT, his "right" and "app" searches found nothing). Each opens the page that documents it, and an admin one shows only to whoever can use the command it feeds.
const HELP_APPS = [
    { name: 'View Colors', category: 'utilities' },
    { name: 'Convert Times', category: 'utilities' },
    { name: 'Add to Calendar', category: 'botadmin', requires: 'manage' },
    { name: 'Add to Draws', category: 'botadmin', requires: 'manage' },
    { name: 'Add to Patch Notes', category: 'botadmin', requires: 'manage' },
    { name: 'Autobuild Gunsmith', category: 'botadmin', requires: 'autobuild' },
];

// Everything `cmd:` can find, in directory order: each visible command (a category's detail commands where it has them, so /gunsmith mp and /gunsmith dmz rather than bare /gunsmith, his ask 2026-10-25 23:05 EDT), then that category's right-click apps.
function searchEntries(perms = {}) {
    const out = [];
    for (const cat of visibleCategories(perms)) {
        for (const c of cat.detailCommands || visibleCommands(cat, perms)) out.push({ name: c.name, category: cat.key, aliases: COMMAND_ALIASES[c.name] || COMMAND_ALIASES[c.name.split(' ')[0]] || [] });
        for (const a of HELP_APPS) if (a.category === cat.key && permitted(a, perms)) out.push({ name: a.name, category: cat.key, app: true, aliases: [] });
    }
    return out;
}

async function resolveCommandToCategory(cmdName, perms = {}) {
    // Scoped to what this caller may see, so `/help cmd:/manage` from a non-admin resolves to nothing and lands on the directory rather than opening a page they were never offered. A bare `/gunsmith` (staticCommands) still opens Gunsmith.
    for (const cat of visibleCategories(perms)) {
        if (visibleCommands(cat, perms).some(c => c.name === cmdName)) return cat.key;
    }
    const entries = searchEntries(perms);
    const exact = entries.find(e => e.name.toLowerCase() === String(cmdName).toLowerCase());
    if (exact) return exact.category;
    // Alias fallback -- an alias word names its command before any looser match, so "server" means /admin.
    const normalized = cmdName.toLowerCase().replace(/^\//, '').trim();
    for (const cat of visibleCategories(perms)) {
        for (const c of visibleCommands(cat, perms)) {
            if ((COMMAND_ALIASES[c.name] || []).includes(normalized)) return cat.key;
        }
        if ((CATEGORY_ALIASES[cat.key] || []).includes(normalized)) return cat.key;
    }
    // Everyday words, typos and look-alikes (utils/helpSearch.js): the best match's page.
    const [best] = require('../utils/helpSearch').rank(cmdName, entries);
    return best ? best.category : null;
}

// What `cmd:` suggests for a query, best first, as names (the value Discord sends back). Empty: everything, in directory order.
async function suggestHelpCommandNames(query, perms = {}) {
    return require('../utils/helpSearch').rank(query, searchEntries(perms)).map(e => e.name).slice(0, 25);
}

// The same, as Discord autocomplete choices: each name with a short plain line, so a confused reader sees what it does.
async function helpChoices(query, perms = {}) {
    const S = require('../utils/helpSearch');
    const choices = S.rank(query, searchEntries(perms)).slice(0, 25).map(e => ({ name: S.choiceLabel(e), value: e.name }));
    // `announcement` is not a command, so the ranked list never offers it and Enter picked /manage (its alias match) instead of the word typed (found in the 2026-10-28 click-test). Two letters put it first: at three (v3.1.1) a player typing `an` saw "No options match your search", because helpSearch drops `an` as a stop word and no command a non-admin sees starts with it (a player's report, 2026-10-28 13:51 EDT). One letter still shows the ranked list alone.
    const typed = String(query || '').toLowerCase().replace(/^\//, '').trim();
    if (typed.length >= 2 && ('announcement'.startsWith(typed) || typed === 'announcements')) {
        return [{ name: 'Announcement', value: 'announcement' }, ...choices].slice(0, 25);
    }
    return choices;
}

// The command a typed `cmd:` means: an exact name, else an alias word ("server" -> /admin), else the best search match. Used to open its category AND to put that command first on the page. A right-click app is not a command block, so it focuses nothing.
async function matchHelpCommand(cmdName, perms = {}) {
    const entries = searchEntries(perms);
    const exact = entries.find(e => e.name.toLowerCase() === String(cmdName).toLowerCase());
    if (exact) return exact.app ? null : exact.name;
    const normalized = String(cmdName).toLowerCase().replace(/^\//, '').trim();
    const byAlias = entries.find(e => !e.app && (COMMAND_ALIASES[e.name] || []).includes(normalized));
    if (byAlias) return byAlias.name;
    const best = require('../utils/helpSearch').rank(cmdName, entries)[0];
    return best && !best.app ? best.name : null;
}

// The permission set every /help surface reads -- the page, the dropdown and the `cmd:` autocomplete -- built in ONE place. handlers/router.js built its own copy for the autocomplete without `botAccess`, so /emojis and the owner-only /bot commands were never suggested to the owner (found in the 2026-10-25 click-test).
async function helpPerms(interaction) {
    const { isServerAdmin } = require('../utils/guildPolicy');
    const { isAdmin, hasCommandAccess, isOwner } = require('../utils/adminAccess');
    return {
        serverAdmin: isServerAdmin(interaction),
        botAdmin: await isAdmin(interaction.user.id),
        manage: await hasCommandAccess(interaction.user.id, 'manage'),
        bot: await hasCommandAccess(interaction.user.id, 'bot'),
        botAccess: isOwner(interaction.user.id),
        autobuild: await hasCommandAccess(interaction.user.id, 'autobuild')
    };
}

// Every real command name this bot has, for /help's `cmd:` autocomplete -- the static entries only (/gunsmith is one entry; the per-category Gunsmith commands it once added are gone). `isAdmin` keeps admin-only commands out of a non-admin's suggestions. Autocomplete is the third of the three places the Server Admin category has to be filtered -- suggesting `/admin` to someone and then handing them the directory when they pick it is worse than never offering it.
async function getAllHelpCommandNames(perms = {}) {
    return searchEntries(perms).map(e => e.name);
}

// The current season's emoji, as /today and /calendar find it. Only when the database is connected: the snapshot test renders this panel with no Mongo, and a buffered query there would wait ten seconds and fail.
async function currentSeasonEmoji() {
    try {
        if (require('mongoose').connection.readyState !== 1) return null;
        const doc = await require('../models/SeasonalData').findOne({ docType: 'global' }).select('currentSeasonTitle currentSeasonEmoji').lean();
        return doc ? require('../utils/seasonEmoji').seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji) : null;
    } catch { return null; }
}

// The pages this viewer may open, in the switcher's order (utils/helpPages.js PAGE_ORDER): what CATEGORY_DEFS lets them see, so a restricted command is hidden from the page, the switcher and `cmd:` alike.
function visiblePageNames(perms = {}) {
    const { PAGE_ORDER, hasPage } = require('../utils/helpPages');
    const seen = new Set(searchEntries(perms).filter(e => !e.app).map(e => e.name));
    return PAGE_ORDER.filter(n => seen.has(n) && hasPage(n));
}

// A right-click app has no page of its own: it opens the page of the command it belongs to.
const APP_PAGE = { 'View Colors': '/colors', 'Convert Times': '/timestamp', 'Add to Calendar': '/manage', 'Add to Draws': '/manage', 'Add to Patch Notes': '/manage', 'Autobuild Gunsmith': '/autobuild' };

// The page a `cmd:` (or `d help <word>`) means: an exact page, `/gunsmith` as MP, an app as its command, else what matchHelpCommand and the search find. Null: the home page.
async function resolvePage(query, perms = {}) {
    if (!query) return null;
    const visible = visiblePageNames(perms);
    const lower = String(query).trim().toLowerCase();
    const slashed = lower.startsWith('/') ? lower : `/${lower}`;
    if (visible.includes(slashed)) return slashed;
    // A page this viewer may not open, named exactly, is the home page, never a near miss (`manage` must not land on Reminders).
    if (require('../utils/helpPages').hasPage(slashed)) return null;
    if (slashed === '/gunsmith' && visible.includes('/gunsmith mp')) return '/gunsmith mp';
    const entries = searchEntries(perms);
    const app = entries.find(e => e.app && e.name.toLowerCase() === lower);
    if (app) return visible.includes(APP_PAGE[app.name]) ? APP_PAGE[app.name] : null;
    const name = await matchHelpCommand(query, perms);
    if (name) return visible.includes(name) ? name : name === '/gunsmith' && visible.includes('/gunsmith mp') ? '/gunsmith mp' : null;
    const best = require('../utils/helpSearch').rank(query, entries)[0];
    const fromApp = best?.app ? APP_PAGE[best.name] : null;
    return fromApp && visible.includes(fromApp) ? fromApp : null;
}

// The home page's hero, link rows and sign-off, as they were (2026-08-08 to 2026-10-27 EDT, his calls in the comments that came with them).
function homeHero(client) {
    // `INSTALL_URL` used to be a hardcoded const with the PROD client_id baked in, which meant the DEV bot's own help panel offered an install link for the production application. utils/inviteLinks.js resolves the id off the live client instead.
    const { buildInviteUrls } = require('../utils/inviteLinks');
    return [
        { type: 9, components: [{ type: 10, content: `## ${emojis.dioreoCombo} Dioreo's Commands\n> **Dioreo** helps you look up CODM loadouts, lucky draw pricing, the seasonal event calendar, patch notes, and more!` }], accessory: { type: 11, media: { url: MASCOT_URL } } },
        // "Add to server or apps" since 2026-10-27 10:44 EDT (Harkirat).
        { type: 1, components: [{ type: 2, style: 5, label: 'Website', url: WEBSITE_URL }, { type: 2, style: 5, label: 'Add to server or apps', url: buildInviteUrls(client).chooser }] },
        // Credits · Terms · Privacy Policy (2026-10-19 09:41 EDT, Harkirat). NOTICE carries every third-party credit, hence its button's name.
        { type: 1, components: [{ type: 2, style: 5, label: 'Credits', url: `${WEBSITE_URL}/notice` }, { type: 2, style: 5, label: 'Terms', url: `${WEBSITE_URL}/terms` }, { type: 2, style: 5, label: 'Policy', url: `${WEBSITE_URL}/privacy` }] },
    ];
}

// One /help message: the card (the home page or one command's page) and the command switcher under it; execute() adds the footer row. `view` is 'text' or 'slash'; a typed view is offered only where typed forms work (typedFormsHere) and for a command that has one, and falls back to slash otherwise. `detail` is Draw Prices' Detailed view.
async function buildHelpMessage({ perms = {}, client, accentColor = PRESET_ACCENT, cmd = null, view = 'slash', detail = false, typedForms = true, prefixes = null } = {}) {
    const H = require('../utils/helpPages');
    const seasonEmoji = await currentSeasonEmoji();
    const names = visiblePageNames(perms);
    if (cmd && !names.includes(cmd)) cmd = null;
    const canSwitch = typedForms && (!cmd || H.hasTextView(cmd));
    if (view === 'text' && !canSwitch) view = 'slash';
    const card = cmd
        ? H.buildPage(cmd, { client, view, detail: detail && view === 'text', canSwitch, seasonEmoji, prefixes })
        : [...H.buildHome({ client, view, canSwitch, hero: homeHero(client), adminNames: names.filter(n => !H.hasTextView(n)), prefixes }),
            { type: 14, spacing: 1, divider: true },
            // The sign-off in the launch announcement's style (2026-10-27 01:23 EDT, Harkirat).
            { type: 10, content: `-# Made with ${emojis.diorHeart} by <@${HARKIRAT_ID}>` }];
    return [{ type: 17, accent_color: accentColor, components: card }, H.buildSwitcher({ names, current: cmd, view, client, seasonEmoji, prefixes })];
}

function helpFooterRow() {
    const { FEEDBACK_BUTTON_ID } = require('../utils/feedback');
    return { type: 1, components: [
        { type: 2, style: 2, label: 'Announcements', custom_id: 'help_announcements', emoji: emojis.parseEmoji(emojis.announcements) },
        { type: 2, style: 2, label: 'Bugs & Suggestions', custom_id: FEEDBACK_BUTTON_ID, emoji: emojis.parseEmoji(emojis.feedback) },
        // Any build, even for a weapon that already has some (2026-10-28 00:08 EDT, Harkirat: "can we add it as a button in the /help footer nav?"); the No build yet card's button opens the same pop-up. `-` means no weapon to prefill (handlers/loadouts.js).
        { type: 2, style: 2, label: 'Submit a Build', custom_id: 'gsb~submit~MP~-', emoji: emojis.parseEmoji(emojis.share) },
    ] };
}

module.exports = {
    helpFooterRow,
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription("See what Dioreo can do and how to report bugs")
        .addStringOption(option => option.setName('cmd').setDescription('Jump straight to a specific command').setAutocomplete(true))
        .addStringOption(option => option.setName('visibility').setDescription(`${VISIBILITY_DESCRIPTION} (Defaults to only you.)`).addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]), // Guild + user install, all contexts (v3: usable in a server without a user install)

    CATEGORY_DEFS,
    PRESET_ACCENT,
    buildHelpMessage,
    resolvePage,
    getAllHelpCommandNames,
    resolveCommandToCategory,
    suggestHelpCommandNames,
    matchHelpCommand,
    helpPerms,
    helpChoices,
    searchEntries,
    typedFormsHere,
    visiblePageNames,

    // `override` comes from handlers/help.js: { cmd, view, detail } from the switcher and the view buttons, or the older `cmd:<name>` / 'landing' strings a panel posted before B6 still sends. A typed view is the default inside a text command or a click on its reply (utils/commandMentions.js inTextCommand), a slash view everywhere else.
    async execute(interaction, override = null) {
        // The two permission levels, resolved once and threaded everywhere. Both are free: server admin comes off the interaction's own computed permissions (no REST call, no privileged intent, false outside a guild), and bot admin is an id comparison.
        const perms = await helpPerms(interaction);

        let cmd = null, view = null, detail = false;
        if (override && typeof override === 'object') ({ cmd = null, view = null, detail = false } = override);
        else if (typeof override === 'string' && override.startsWith('cmd:')) cmd = override.slice(4);
        if (!override && interaction.isChatInputCommand()) {
            const cmdOption = interaction.options.getString('cmd');
            // `cmd:announcement` posts the announcements running now instead of a command page (2026-10-28 16:40 EDT, Harkirat: "if i type /help cmd:announcement visibility:public that it'll send the launch announcement as a public message"). Hidden unless visibility says public, like every /help answer. It claims the word before the page lookup, which sent `announcement` to /manage.
            if (cmdOption && /^\/?announcements?$/i.test(cmdOption.trim())) {
                const choice = interaction.options.getString('visibility');
                await interaction.deferReply({ flags: choice === 'public' ? 0 : 64 });
                return await sendV2Payload(interaction, await require('../utils/announcement').buildActiveAnnouncementComponents(), { allowedMentions: { parse: [] } });
            }
            cmd = cmdOption || null;
        }
        if (cmd === 'landing') cmd = null;
        if (cmd) cmd = await resolvePage(cmd, perms);
        if (!view) view = require('../utils/commandMentions').inTextCommand() ? 'text' : 'slash';

        // Unlike every other command, /help has no saved preference to fall back to -- defaults to hidden (matches /manage's own-panel convention) unless explicitly made public.
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);

        // No "Show Everyone" button -- the visibility option above already covers that case up front, and repeating it here would be redundant (Harkirat's direct request).
        // The server's own text-command prefixes on every typed page (B7).
        const prefixes = await require('../utils/textCommands/server').prefixesFor(interaction.guildId);
        const components = await buildHelpMessage({ perms, client: interaction.client, accentColor, cmd, view, detail, typedForms: typedFormsHere(interaction), prefixes });
        // Under every /help page, outside its card (2026-10-27 01:23 EDT, Harkirat; "regardless of whatever cmd/page of /help is being viewed", 01:21 EDT): Announcements shows what is running now, privately, Bugs & Suggestions opens the pop-up utils/feedback.js sends to the owner, and Submit a Build. Answered by handlers/help.js and handlers/loadouts.js.
        components.push(helpFooterRow());
        // No mention pings or highlights (2026-10-27 10:44 EDT, Harkirat: "i want the clickable username but not the highlight"): the sign-off's <@dior> stays a clickable name, but the panel no longer lights up yellow for him. Same suppression /settings uses.
        return await sendV2Payload(interaction, components, { allowedMentions: { parse: [] } });
    }
};
