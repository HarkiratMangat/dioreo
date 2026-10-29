// ==========================================
// COMMAND: PLAYER GUIDE / HELP
// ==========================================
// ARCHITECTURE: Redesigned 2026-08-08 20:56 EDT from Harkirat's own JSON mockups (local/landingPageUI.json, local/gunsmithsUI.json), then revised again 21:31 EDT the same day from his direct review feedback. Landing page is a Section+thumbnail "hero" (mascot + tagline), two Link buttons (Website/Install), a flat command DIRECTORY grouped by category, then a category select menu. Picking a category (or using the `cmd:` autocomplete option) swaps to that category's own detail page: a real Usage/Options/ Examples breakdown per command, options split under whichever command actually has them (never merged across commands with different option sets -- `/gunsmith mp` and `/gunsmith dmz` have identical shapes (weapon/build/visibility) but each is its own detailCommands entry with its own options block; the `/gunsmith search` and `list` subcommands this used to document were removed 2026-10-19. Consolidated from `/all` + the eight per-category MP commands 2026-08-15 -- see docs/superpowers/specs/2026-08-15-gunsmiths-command-consolidation-design.md.
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
const VISIBILITY_BULLET = `-# 🔹 \`[visibility]\` ${VISIBILITY_DESCRIPTION}`;

// A body may ask for a REAL divider by embedding this marker; buildContainer splits on it and inserts a type-14 separator. Added 2026-08-10 19:28 EDT because Preferences documents two unrelated commands (`/settings` and `/admin`) on one page and they ran together -- a markdown rule inside a Text Display is not a divider, it is a row of dashes. ⚠️ USE IT BETWEEN SUBJECTS, NOT BETWEEN COMMANDS. Harkirat, 19:31 EDT: "i dont want a divider on EVERY command... i just want it between /settings and /server" -- then, on seeing it removed from the shared-Options boundary too, 19:38 EDT: "revert back to how you implemented it, i kind of liked your idea." So the live rule is the middle one: a divider separates two genuinely different SUBJECTS (one command from another, the commands from the options that apply to all of them), and never sits between a command and its own bullets. Once every section has one they stop marking anything at all.
const SECTION_BREAK = '\n<<<SECTION_BREAK>>>\n';

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

// The landing's Text commands block (text commands, B3, 2026-10-29): a member in a server that hides slash commands, or that lists so many bots Discord stops showing Dioreo's, learns they can type one instead. `@Dioreo` works wherever Dioreo can post; the prefixes only where Discord grants the app Message Content, which bot/textCommands.js reads off the app's flags before login and leaves on `client.textMessageContent`. The forms are the ones bot/textCommands.js's own help card shows.
function textCommandsBlock(client) {
    const forms = client?.textMessageContent ? ['@Dioreo today', 'd today', 'dior today', '/today'] : ['@Dioreo today'];
    return `### 💬 **TEXT COMMANDS**\n**Type one in a message:** ${forms.map(f => `\`${f}\``).join(' · ')}\n-# Works anywhere Dioreo can post, for when this server hides slash commands`;
}

// The typed form beside each command on its detail page (text commands, B5, 2026-10-29 00:15 EDT; B3's gap 2: every Usage line and Example was slash syntax only). Built from utils/textCommands/commands.js, never written per page: the command's first word, and the first spelling of each value its options take, so a page cannot promise a word the parser does not accept (scripts/helpTextCommands.test.js parses every one). `d`, or `@Dioreo` where the app has no Message Content, the same rule utils/commandMentions.js's textForm uses. A command with no text form (/admin, Dioreo Admin's) gets no line.
function textCommandFor(name) {
    const { TEXT_COMMANDS } = require('../utils/textCommands/commands');
    const clean = String(name).replace(/^\//, '');
    return TEXT_COMMANDS.find(c => `${c.slash}${c.sub ? ` ${c.sub}` : ''}` === clean) || null;
}
const textPrefix = client => (client?.textMessageContent === false ? '@Dioreo' : 'd');
const shortestKey = o => [...(o.keys || [o.name])].sort((a, b) => a.length - b.length)[0];

// `d draws [new|returning]`, in the slash Usage's own brackets: <required> [optional]. A rest option (a weapon, a date, a season) is named by its option; a key-only one shows its key.
function textUsage(client, name) {
    const tc = textCommandFor(name);
    if (!tc) return null;
    const parts = (tc.options || []).filter(o => o.name !== 'visibility').map(o => {
        let inner;
        if (o.keyOnly) inner = `${shortestKey(o)}:${o.name}`;
        else if (o.mention) inner = `@${o.name}`;
        else inner = [...(o.values || []).map(v => v.aliases[0]), ...(o.rest ? [o.name] : [])].join('|');
        return o.required ? `<${inner}>` : `[${inner}]`;
    });
    return [textPrefix(client), tc.words[0], ...parts].join(' ');
}

// What a reply form acts on: `d timestamp` sent as a reply converts that message's times, `d colors` shows that person's colors.
const REPLY_FORM_TARGET = { convertTimes: 'a message', viewColors: 'someone' };
function textUsageLine(client, name) {
    const usage = textUsage(client, name);
    if (!usage) return null;
    const tc = textCommandFor(name);
    const reply = tc.replyForm ? `, or reply to ${REPLY_FORM_TARGET[tc.replyForm]} with \`${textPrefix(client)} ${tc.words[0]}\`` : '';
    return `-# 💬 Or type \`${usage}\`${reply}`;
}

// The typed twin of one slash example, from the slash values it uses: each value's first spelling, a rest option's own text. Null when any option has no text form (visibility, style, view, a page with no text option), because a twin without it would be a different answer.
function textExample(client, name, values) {
    const tc = textCommandFor(name);
    if (!tc || !values) return null;
    const words = [];
    for (const [key, val] of Object.entries(values)) {
        const o = (tc.options || []).find(x => x.name === key);
        if (!o) return null;
        const hit = (o.values || []).find(v => [].concat(v.value).join(',') === [].concat(val).join(','));
        if (hit) words.push(hit.aliases[0]);
        else if (o.keyOnly && !/\s/.test(val)) words.push(`${shortestKey(o)}:${val}`);
        else if (o.rest) words.push(String(val).toLowerCase());
        else return null;
    }
    return [textPrefix(client), tc.words[0], ...words].join(' ');
}

// Each page's Examples as data: the slash line as shown, the command, and the slash values it uses (null: a browse row, which no typed word names -- a class word opens that class's first weapon instead). Read by examplesBlock() and by scripts/helpTextCommands.test.js.
const HELP_EXAMPLES = {
    gunsmith: [
        ['**/gunsmith mp** weapon:`AK117`', '/gunsmith mp', { weapon: 'AK117' }],
        ['**/gunsmith mp** weapon:`Switchblade X9` visibility:`Hidden`', '/gunsmith mp', { weapon: 'Switchblade X9', visibility: 'hidden' }],
        ['**/gunsmith mp** weapon:`All SMG builds`', '/gunsmith mp', null],
        ['**/gunsmith mp** weapon:`All META builds`', '/gunsmith mp', null],
        ['**/gunsmith dmz** weapon:`Fennec`', '/gunsmith dmz', { weapon: 'Fennec' }],
    ],
    draws: [
        ['**/draws** page:`Returning Draws`', '/draws', { page: 'returning' }],
        ['**/draw prices** region:`30 CP Region`', '/draw prices', { region: 'region_30' }],
        ['**/draw prices** filter:`Mythic Weapon Draw`', '/draw prices', { filter: 'mythicWeapon' }],
        ['**/draw calculator** page:`View Saved`', '/draw calculator', { page: 'saved' }],
    ],
    seasonal: [
        ['**/calendar** page:`Events` filter:`Upcoming`', '/calendar', { page: 'events', filter: 'soon' }],
        ['**/remind** releases:`New draws` (run it again to turn it off)', '/remind', { releases: 'new draws' }],
        ['**/remind** leaving:`Leaving soon (everything)`', '/remind', { leaving: 'leaving soon' }],
        ['**/patch notes** season:`Season 6 — Take Your Heart`', '/patch notes', { season: 'Season 6' }],
    ],
    utilities: [
        ['**/colors** page:`Nameplate` source:`From Server Profile`', '/colors', { page: 'nameplate', source: 'server' }],
        ['**/timestamp** datetime:`this saturday 7pm` timezone:`Pacific Time`', '/timestamp', { datetime: 'this saturday 7pm', timezone: 'Pacific Time' }],
        ['**/timestamp** datetime:`august 20` style:`Short Date (d)`', '/timestamp', { datetime: 'august 20', style: 'shortDate' }],
        ['**/timestamp** datetime:`in 45 minutes` view:`Text`', '/timestamp', { datetime: 'in 45 minutes', view: 'text' }],
    ],
};
function exampleLine(client, slashText, name, values) {
    const twin = textExample(client, name, values);
    return `-# 🔸 ${slashText}${twin ? ` · \`${twin}\`` : ''}`;
}
const examplesBlock = (client, key) => `-# **Examples**\n${HELP_EXAMPLES[key].map(e => exampleLine(client, ...e)).join('\n')}`;

// The ONE renderer every per-command "-# **Options**" detail block parameterizes into (v3-pre-release review finding #49) -- replaces four hand-built escaped-markdown concatenations. Reproduces the exact pre-rewrite shape byte-for-byte, pinned by scripts/helpBodySnapshot.test.js: a header, the description, an Options block (bulleted if the command has any, otherwise just the shared visibility bullet), always ending in VISIBILITY_BULLET -- the shape gunsmith/draws/seasonal/ utilities all already shared before this rewrite, just typed out by hand each time.
function renderCommandBlock(command, client) {
    const optionLines = command.options.map(o =>
        `-# 🔹 \`${o.required ? '<' : '['}${o.name}${o.required ? '>' : ']'}\` ${resolveText(o.desc, client)}`
    ).join('\n');
    // [visibility] is no longer repeated under every command (2026-10-25 22:44 EDT, critique #19): each page states it once, in SHARED_VISIBILITY, the way Preferences and Bot Admin already did. A command with no options of its own has no Options heading.
    // The typed form sits under the description, above the slash options (B5): `d draws [new|returning]`.
    const typed = textUsageLine(client, command.name);
    return `### ${mentionCommand(client, command.name)}\n${resolveText(command.description, client)}\n`
        + (typed ? `${typed}\n` : '')
        + (optionLines ? `-# **Options**\n${optionLines}\n` : '');
}
const SHARED_VISIBILITY = `\n-# **Every command above also takes**\n${VISIBILITY_BULLET}\n`;

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
        staticCommands: [cmd('/settings', { jumpDescription: 'Your timezone, reply visibility, CP region, colors and stats' }), cmd('/admin', { requires: 'serverAdmin', suffix: '(server)', jumpDescription: "Choose where Dioreo's replies stay private in your server" })],
    },
    // Whole-category gating, unlike `/admin` above: these are useless to anyone who is not on the bot's own admin whitelist, and unlike Manage Server there is no per-guild version of that permission. `botAccess` is the emoji (2026-08-22, Harkirat's call) -- the SAME icon /bot access's own panel heading uses, so the category and the surface it leads to read as one thing. It replaced `database`, which was borrowed from the `mng*` data-entry family and described only one of the five commands listed here.
    {
        key: 'botadmin', label: 'Bot Admin', emojiKey: 'botAccess',
        dropdownDescription: 'Data entry, analytics and admin tools',
        // Alphabetical, and it must MATCH buildBotAdminBody's order below -- the first draft listed these one way in the directory and another in the body, which reads as the page having lost track of itself. Harkirat asked for alphabetical here on 2026-08-10 19:34 EDT. ⚠️ Per-command `requires` (added 2026-08-13, per-command admin permissions) -- an admin granted only /bot analytics must not see /manage or /autobuild listed here even though the whole category is visible to them. Category-level `requires: 'botAdmin'` still gates the SECTION (shows if the user has ANY admin access at all, per utils/adminAccess.js's isAdmin()); each command's own key gates that ONE line, same pattern `/admin` already uses inside Preferences. `/bot access` is gated on `botAccess` (isOwner(), not a permission token -- see utils/adminAccess.js's header on why it can never have one).
        staticCommands: [cmd('/bot analytics', { requires: 'bot', jumpDescription: 'Usage, timing, health, alerts and recent changes' }), cmd('/bot access', { requires: 'botAccess', jumpDescription: 'Grant or revoke admin access' }), cmd('/bot hotpatch', { requires: 'botAccess', jumpDescription: 'Reload changed files into the running bot' }), cmd('/bot servers', { requires: 'botAccess', jumpDescription: 'The servers Dioreo is in, and their settings' }), cmd('/embed', { requires: 'botAccess', jumpDescription: 'Render pasted message JSON to check a design' }), cmd('/manage emojis', { requires: 'botAccess', jumpDescription: 'Every emoji on each bot, with one-tap sync' }), cmd('/autobuild', { requires: 'autobuild', jumpDescription: 'Turn Gunsmith screenshots into builds' }), cmd('/manage', { requires: 'manage', jumpDescription: 'Add and edit draws, calendar, patch notes, loadouts and more' })],
        requires: 'botAdmin',
    },
];

const DETAIL_HEADERS = {
    gunsmith: 'Gunsmith Commands',
    draws: 'Draw Commands',
    seasonal: 'Seasonal Info Commands',
    utilities: 'Utility Commands',
    botadmin: 'Bot Admin Commands',
    preferences: 'Preference Commands'
};

const USAGE_LEGEND = '-# **Usage: `/cmd <required> [optional]`**';

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

// Each of these four now composes its per-command "-# **Options**" blocks from CATEGORY_DEFS' own data via renderCommandBlock() (v3-pre-release review finding #49) instead of hand-built escaped-markdown concatenation. Their "-# **Examples**" trailers are data too since B5 (2026-10-29 00:15 EDT), in HELP_EXAMPLES above, so each slash example can carry its typed twin. `commands` is the category's own detailCommands (gunsmith) or staticCommands (draws/seasonal/utilities) -- see buildContainer's dispatch below. PARTS since 2026-10-25 17:10 EDT: the Dispute a Build section carries its button as an accessory (Harkirat's /gunsmith review: the dispute form lives in /help only, beside "or DM <@owner>", his clickable @mention). handlers/loadouts.js answers `gsb~dispute`.
function buildGunsmithBody(commands, client) {
    const { ALLOWED_ADMIN_ID } = require('../utils/owner');
    return [
        { content: buildGunsmithText(commands, client) },
        { divider: true },
        { content: `### Submit or dispute a build\nHave a build to share? **Submit a Build** is under every /help page, and on a weapon's **No build yet** card.\nIf a submitted build uses your screenshot, ask for its removal or the credit. You'll need proof the original is yours and was posted before the build went live. Or DM <@${ALLOWED_ADMIN_ID}> with your proof.`,
            accessory: { type: 2, style: 2, label: 'Dispute a Build', custom_id: 'gsb~dispute' } },
    ];
}
function buildGunsmithText(commands, client) {
    return commands.map(c => renderCommandBlock(c, client)).join('') + SHARED_VISIBILITY
        + `\n${examplesBlock(client, 'gunsmith')}`;
}

// Returns PARTS, not one string (2026-10-17 23:51 EDT): the /draw calculator block is a Section whose button opens the calculator's full Help (Harkirat: "add a button in the /help draws page, as a section+accessory for the /draw calc section, to view the full help panel"). The button reuses the calculator's own `help` verb, so it opens the same private panel the calculator's Help button does; with no author on the state, anyone may press it.
function buildDrawsBody(commands, client) {
    const calc = commands.find(c => c.name === '/draw calculator');
    const others = commands.filter(c => c !== calc);
    const parts = [{ content: others.map(c => renderCommandBlock(c, client)).join('').trimEnd() }];
    if (calc) {
        const dc = require('./drawCalculator');
        parts.push({ content: renderCommandBlock(calc, client).trimEnd(), accessory: { type: 2, style: 2, label: 'Calculator Guide', emoji: emojis.parseEmoji(emojis.calculator), custom_id: dc.encodeState('help', dc.defaultState()) } });
    }
    parts.push({ content: `${SHARED_VISIBILITY.trim()}\n\n${examplesBlock(client, 'draws')}` });
    return parts;
}

function buildSeasonalBody(commands, client) {
    return commands.map(c => renderCommandBlock(c, client)).join('') + SHARED_VISIBILITY
        + `\n${examplesBlock(client, 'seasonal')}`;
}

function buildUtilitiesBody(commands, client) {
    return commands.map(c => renderCommandBlock(c, client)).join('') + SHARED_VISIBILITY
        + `\n### Right-click (Apps)\n**View Colors** on a member or one of their messages: their profile colors\n**Convert Times** on a message: every date and time in it, as a timestamp in your own time zone\n`
        + `\n${examplesBlock(client, 'utilities')}`;
}

// Server admins get a second command appended rather than a page of their own. The `/admin` detail is the one place carrying the full precedence order and the two Discord limits, because the panel itself deliberately stays short -- see commands/admin.js's note on the wall-of-text draft that got rejected 2026-08-10 18:23 EDT. Harkirat's framing on the caps: they are not a real constraint in practice ("why is a server adding 25 role overrides"), so they read as guidance about the intended workflow -- set a default, hand-pick the exceptions -- not as a warning. TWO commands on one page, so they get a real divider between them and the shared `[visibility]` option is stated ONCE at the end rather than under each -- repeating it per command was Harkirat's call on 2026-08-10 19:28 EDT ("visibility is shared in all the commands so having it individually under each of them makes no sense"), and the same pass cut the /admin section roughly in half for being overwhelming to read. Gunsmith already used the shared-options shape for the same reason. `commands` is the category's own visibleCommands(category, perms) result (v3-pre-release review finding #49) -- whether /admin is present is derived from THAT list rather than re-checking perms.serverAdmin directly, so this page's admin filtering can never drift from the directory/ dropdown/autocomplete, which already filter through the exact same CATEGORY_DEFS `requires`.
function buildPreferencesBody(commands, client) {
    // /settings' typed form (B5) under its description; /admin has none, so it keeps slash only.
    const settings = `### ${mentionCommand(client, '/settings')}\nYour own preferences: **Visibility** (who sees your responses by default), **Preferences** (timezone, timestamp style, accent style, and more), and your **Colors**\n${textUsageLine(client, '/settings')}`;
    // `[open]` (2026-10-19 17:49 EDT, named `[customize]` until 2026-10-19 19:33 EDT) is /settings' jump-to option -- see commands/settings.js. Written once here because both branches below print the /settings options.
    const openBullet = '-# 🔹 `[open]` Open straight on Visibility, Preferences, or your Colors';
    const hasAdmin = commands.some(c => c.name === '/admin');

    if (!hasAdmin) {
        return `${settings}\n\n-# **Options**\n${openBullet}\n${VISIBILITY_BULLET}\n\n-# **Examples**\n${exampleLine(client, '**/settings**', '/settings', {})}\n${exampleLine(client, '**/settings** open:`Preferences`', '/settings', { open: 'preferences' })}`;
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
        + `-# 🔸 Rules only make Dioreo **quieter** — Public *permits* a public answer, it never overrides someone's own ${mentionCommand(client, '/settings')}\n\n`
        + `-# **Worth knowing**\n`
        + `-# 🔸 Each menu holds up to **25 picks** (Discord's limit). Needing more usually means a different default would suit better\n`
        + `-# 🔸 It hides the **answer**, not the command — to remove a command entirely, use **Server Settings → Integrations**`
        + SECTION_BREAK
        + `-# **Options** · \`[open]\` is /settings only; both take \`[visibility]\`\n${openBullet}\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n`
        + `${exampleLine(client, '**/settings** visibility:`Public`', '/settings', { visibility: 'public' })}\n`
        + `${exampleLine(client, '**/settings** open:`Colors`', '/settings', { open: 'colors' })}\n`
        + `-# 🔸 **/admin** → **Overview** → Default *Private*, then **Channels** → allow \`#bot-spam\`\n`
        + `-# 🔸 **/admin** → **Roles** → *Always public for these roles* → \`@Moderator\`\n`
        + `-# 🔸 **/admin** → **Commands** → \`/colors\` → *Private*: only \`/colors\` answers privately`;
}

// Gated on the bot's own admin whitelist, not on any guild permission -- these write to shared global data (one SeasonalData document, the Loadout collection) rather than to anything scoped to the server they are run in, which is exactly why no per-guild permission could ever grant them. That fact is a HINT at the foot of the page rather than a bullet in the middle: it explains the section, it is not something you do. ⚠️ Filtered per-command, not just per-category (fixed 2026-08-15 13:10 EDT) -- this used to render all three commands' full detail unconditionally, so an admin granted only /bot analytics still read the complete /manage and /autobuild writeups even though the directory/dropdown correctly hid those commands from them elsewhere. Category-level `requires: 'botAdmin'` only gates whether this page exists at all; each command's own perms key (perms.bot/perms.botAccess/perms.autobuild/ perms.manage) has to be checked again HERE, same as visibleCommands() already does for the directory and dropdown. `commands` is visibleCommands(category, perms) -- same reasoning as buildPreferencesBody above. Membership (`has(name)`) replaces the old direct `perms.X` checks, so a command's visibility here can never drift from the directory/dropdown/autocomplete again (the exact class of bug that let the per-command filter go missing from this function until 2026-08-15).
function buildBotAdminBody(commands, client) {
    const has = (name) => commands.some(c => c.name === name);
    const sections = [];
    if (has('/bot analytics')) {
        sections.push(`### ${mentionCommand(client, '/bot analytics')}\nThe bot's usage, timing and health, without opening the server it runs on\n`
            + `-# 🔹 \`[page]\` Jump directly to a page: \`Health\` · \`Alerts\` · \`Changes\` · \`Usage\` · \`Timing\``);
    }
    if (has('/bot access')) {
        sections.push(`### ${mentionCommand(client, '/bot access')}\nWho has admin access, and to what — owner-only\n`
            + `-# 🔹 No options of its own`);
    }
    if (has('/bot servers')) {
        sections.push(`### ${mentionCommand(client, '/bot servers')}\nView, reset or delete one server's /admin rules, for an admin who lost access — owner-only\n`
            + `-# 🔹 \`[server]\` A server ID; leave it blank to pick the server you're in or type one`);
    }
    if (has('/bot hotpatch')) {
        sections.push(`### ${mentionCommand(client, '/bot hotpatch')}\nReload changed files into the running bot without a restart — owner-only\n`
            + `-# 🔹 \`[pull]\` git pull first (default: yes)\n`
            + `-# 🔹 \`[dry_run]\` Show the plan and change nothing\n`
            + `-# 🔹 \`[file]\` Limit to one changed file (default: everything the pull brought in)`);
    }
    if (has('/embed')) {
        sections.push(`### ${mentionCommand(client, '/embed')}\nRender pasted message JSON as a real Components V2 message, to check a design — owner-only\n`
            + `-# 🔹 \`[json]\` The message JSON; leave both this and \`file\` empty to paste it in a box\n`
            + `-# 🔹 \`[file]\` A .json or .txt file, for JSON too long to paste\n`
            + `-# 🔹 \`[clean]\` Render only the JSON: no Edit JSON button and no emoji note`);
    }
    if (has('/manage emojis')) {
        sections.push(`### ${mentionCommand(client, '/manage emojis')}\nEvery app emoji, which bots lack it and whether its original is saved: sync, upload or find one — owner-only. Also the Emojis entry in the /manage dropdown\n`
            + `-# 🔹 Only the visibility option below`);
    }
    if (has('/autobuild')) {
        sections.push(`### ${mentionCommand(client, '/autobuild')}\nRead an MP or DMZ loadout out of a Gunsmith screenshot and stage it for review — nothing is saved until you press Save\n`
            + `-# 🔹 Run it on its own for a form that reads up to 10 screenshots and links at once, each with its own mode, category and badges\n`
            + `-# 🔹 \`[screenshot]\` The Gunsmith screenshot to read — or use \`url\` instead, never both\n`
            + `-# 🔹 \`[url]\` A link to the screenshot, when the image is already hosted somewhere\n`
            + `-# 🔹 \`[category]\` \`AR\` · \`SMG\` · \`LMG\` · \`Marksman\` · \`Sniper\` · \`Shotgun\` · \`Secondary\` — looked up from the weapon, or asked for, if left blank\n`
            + `-# 🔹 \`[mode]\` \`MP\` · \`DMZ\` — read from the screenshot if left blank, and asked for when the screenshot can't tell\n`
            + `-# 🔹 \`[badges]\` e.g. \`meta,top5\`: any of meta, toxic, ass, best, top3, top5, capable and the rank modes — this build only; blank means none\n`
            + `-# 🔹 \`[retry_token]\` Only for re-submitting an image after a Cloudinary upload failure`);
    }
    if (has('/manage')) {
        sections.push(`### ${mentionCommand(client, '/manage')}\nThe data-entry panel — seasonal info, draws, calendar, patch notes, loadouts, banners, announcements, and the next-season draft\n`
            + `-# 🔹 One subcommand per section: \`draws\` · \`calendar\` · \`patch-notes\` · \`gunsmith mp\` · \`gunsmith dmz\` · \`season titles\` · \`season draft\` · \`announcement\` · \`guide\`\n`
            + `-# 🔹 \`[action]\` Jump straight to one of that section's own actions (not on \`season titles\` or \`guide\`)`);
    }

    // The admin right-clicks (critique #44), each shown to whoever can use the command it feeds.
    const apps = [];
    if (has('/manage')) apps.push('**Add to Calendar** · **Add to Draws** · **Add to Patch Notes** on a message: stage its text into that /manage page');
    if (has('/autobuild')) apps.push('**Autobuild Gunsmith** on a message with a Gunsmith screenshot: the same review as /autobuild');
    if (apps.length) sections.push(`### Right-click (Apps)\n${apps.join('\n')}`);

    const examples = [];
    if (has('/bot analytics')) examples.push(`-# 🔸 **/bot analytics** page:\`Usage\` visibility:\`Public\` — share usage data in a channel`);
    if (has('/autobuild')) {
        examples.push(`-# 🔸 **/autobuild** screenshot:\`[upload]\` category:\`SMG\` badges:\`meta,top5\``);
        examples.push(`-# 🔸 **/autobuild** url:\`https://…\` — when the screenshot is already hosted`);
    }
    if (has('/manage')) {
        examples.push(`-# 🔸 **/manage patch-notes** — straight to the section, no clicking through`);
        examples.push(`-# 🔸 **/manage season draft** — stage next season without touching what is live`);
    }

    return sections.join('\n')
        + SECTION_BREAK
        + `-# **Options** · every command above except /bot hotpatch and /bot servers\n${VISIBILITY_BULLET}\n\n`
        + `-# **Examples**\n${examples.join('\n')}\n\n`
        + `-# These are gated on **Dioreo's own admin allowlist** (four are owner-only), not on a server permission — Manage Server does not grant them, and they are not registered for guild install at all.`;
}

const BODY_BUILDERS = {
    gunsmith: buildGunsmithBody,
    draws: buildDrawsBody,
    seasonal: buildSeasonalBody,
    utilities: buildUtilitiesBody,
    preferences: buildPreferencesBody,
    botadmin: buildBotAdminBody
};

// `isAdmin` hides the Server Admin category from everyone who could not use `/admin` anyway. Harkirat's call, 2026-08-10 18:36 EDT. It is filtered in THREE places, not one -- the dropdown here, the landing directory, and the `cmd:` lookup in execute() -- because filtering only the visible menu leaves `/help cmd:server` working, which reads as the gate being broken rather than as a deliberate exception. Nothing here is secret; the point is that a member who cannot open the panel should not be shown a page about it. `selectedKey` is 'landing', a category key, or null. Null leaves every option unselected so the placeholder shows: the one-command page belongs to no category, and marking Commands List there said you were on it (2026-10-27 19:16 EDT, Harkirat: "That should be switching to the unselected 'Jump to a category…'").
function buildCategorySelectRow(selectedKey, perms = {}) {
    const isLanding = selectedKey === 'landing';
    const options = [
        { label: 'Commands List', value: 'landing', description: 'Every command at a glance', emoji: emojis.parseEmoji(emojis.dioreoCombo), default: isLanding },
        ...visibleCategories(perms).map(c => ({
            label: c.label,
            value: c.key,
            description: categoryDescription(c, perms),
            emoji: emojis.parseEmoji(emojis[categoryEmojiKey(c, perms)]),
            default: c.key === selectedKey
        }))
    ];
    return { type: 1, components: [{ type: 3, custom_id: 'help_category', placeholder: 'Jump to a category…', options }] };
}

// Each command's own icon in the Jump to one command list (2026-10-27 18:51 EDT, Harkirat: "Give /gunsmith dmz the dmz emoji. Draw prices its own. Draw calc its own. And so on"). Before this every row wore its category's icon, so a category's commands looked identical. The icons match the ones those commands use themselves (and the v3 announcement), and a command missing here falls back to its category's. /emojis wears DB_Emojis where the booted app has it (2026-10-28, Harkirat uploaded it; found by name, see utils/emojiMap.js), and the swatches icon below where it does not.
const COMMAND_EMOJI = {
    '/gunsmith mp': 'gunsmithSearch', '/gunsmith dmz': 'dmz',
    '/draws': 'newDraws', '/draw prices': 'drawPrices', '/draw calculator': 'calculator',
    '/calendar': 'calendar', '/today': 'dailyUpdate', '/remind': 'remind', '/patch notes': 'patchNotes', '/season end': 'bp',
    '/colors': 'showColors', '/timestamp': 'timestamp', '/invite': 'shareHeart',
    '/settings': 'settings', '/admin': 'serverSettings',
    '/bot analytics': 'mngInfo', '/bot access': 'botAccess', '/bot hotpatch': 'edit', '/bot servers': 'guide', '/embed': 'edit', '/manage emojis': 'swatches', '/autobuild': 'gunsmithCode', '/manage': 'database'
};

// One command at a time (2026-10-27 10:44 EDT, Harkirat: "add another dropdown so a user can filter for 1 specific command instead of only per category"). Every slash command this viewer may see, in directory order, capped at Discord's 25 options; right-click apps stay out (they have no page of their own). Picking one opens a page with only that command (handlers/help.js, `help_command`). `seasonEmoji` is the current season's own emoji for /season end (2026-10-27 19:01 EDT, Harkirat: "make sure it's using this current season's emoji and not the generic battle pass one"); BP stands in when it is unknown. `jumpDescription` fills the rows whose command has no `description` here (/settings, /admin and the admin tools); it is read only by this list, so their own pages are unchanged (his ask, same message). The list follows the v3 announcement's order (2026-10-27 19:03 EDT, Harkirat: "sort the items so they're following the same order as the list we used in announcements with all of the ... admin type commands after them"). A command not named here keeps its category order, after these; /admin and the admin tools are left out on purpose so they come last.
const JUMP_ORDER = ['/gunsmith mp', '/gunsmith dmz', '/draws', '/draw prices', '/draw calculator', '/today', '/calendar', '/remind', '/season end', '/patch notes', '/timestamp', '/colors', '/settings', '/invite'];
const jumpRank = name => { const i = JUMP_ORDER.indexOf(name); return i === -1 ? JUMP_ORDER.length : i; };

function buildCommandSelectRow(focusName, perms = {}, seasonEmoji = null) {
    const options = [];
    for (const cat of visibleCategories(perms)) {
        for (const c of cat.detailCommands || visibleCommands(cat, perms)) {
            if (options.length >= 25) break;
            const text = c.description || c.jumpDescription || '';
            const description = text.length > 100 ? `${text.slice(0, 99)}…` : (text || undefined);
            options.push({ label: c.name, value: c.name, ...(description ? { description } : {}), emoji: emojis.parseEmoji((c.name === '/season end' && seasonEmoji) || (c.name === '/manage emojis' && emojis.DB_Emojis) || emojis[COMMAND_EMOJI[c.name]] || emojis[categoryEmojiKey(cat, perms)]), default: c.name === focusName });
        }
    }
    options.sort((a, b) => jumpRank(a.value) - jumpRank(b.value)); // stable: unlisted commands keep their category order
    return { type: 1, components: [{ type: 3, custom_id: 'help_command', placeholder: 'Jump to one command…', options }] };
}

// The current season's emoji, as /today and /calendar find it. Only when the database is connected: the snapshot test renders this panel with no Mongo, and a buffered query there would wait ten seconds and fail.
async function currentSeasonEmoji() {
    try {
        if (require('mongoose').connection.readyState !== 1) return null;
        const doc = await require('../models/SeasonalData').findOne({ docType: 'global' }).select('currentSeasonTitle currentSeasonEmoji').lean();
        return doc ? require('../utils/seasonEmoji').seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji) : null;
    } catch { return null; }
}

async function buildContainer(selectedKey, accentColor, perms = {}, client, focusName = null, onlyFocus = false) {
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
                // "Invite Dioreo" (2026-10-18 20:15 EDT, Harkirat), the same word /invite uses. "Add to server or apps" since 2026-10-27 10:44 EDT (Harkirat).
                { type: 2, style: 5, label: 'Add to server or apps', url: buildInviteUrls(client).chooser }
            ]
        });
        // Credits · Terms · Privacy Policy, under Website and Invite (2026-10-19 09:41 EDT, Harkirat: "a button to 'Credits' that links to the notice page on the dioreo.app website. ToS and Privacy Policy as well"; "Terms", short, 09:42 EDT). NOTICE carries every third-party credit, hence its button's name.
        components.push({
            type: 1,
            components: [
                { type: 2, style: 5, label: 'Credits', url: `${WEBSITE_URL}/notice` },
                { type: 2, style: 5, label: 'Terms', url: `${WEBSITE_URL}/terms` },
                { type: 2, style: 5, label: 'Policy', url: `${WEBSITE_URL}/privacy` }
            ]
        });
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({
            type: 10,
            // GENERATED FROM CATEGORY_DEFS, not hand-written -- this used to be five hardcoded lines, and adding the Server Admin category on 2026-08-10 walked straight into the trap: the entry appeared in the dropdown (which does map over CATEGORY_DEFS) and was missing from this list, because nothing ties the two together. Harkirat's call the same day, on being told about it: "that's a real gap that will create staleness and needs a proper solution." One source of truth is that solution -- a new category is now a single array entry and cannot be half-added. Byte-for-byte identical output to the hardcoded version, checked by diffing the rendered container before and after. scripts/guildPolicyEnforcement.test.js asserts every category reaches this list.
            content: visibleCategories(perms)
                .map(c => {
                    // A command's `suffix` rides here too -- that is how `/admin` announces itself as an admin command while sitting inside Preferences.
                    const commands = (c.detailCommands || visibleCommands(c, perms)).map(x => `${mentionCommand(client, x.name)}${x.suffix ? ` *${x.suffix}*` : ''}`).join(' · ');
                    return `### ${emojis[categoryEmojiKey(c, perms)]} **${c.label.toUpperCase()}**\n**${commands}**\n`;
                })
                .join('')
                + `\n`
                // In a `d help` reply the tip names the typed form, like every mention above it (text commands, B3, 2026-10-29).
                + `-# ${emojis.info} Tip: ${require('../utils/commandMentions').inTextCommand() ? `\`${client?.textMessageContent === false ? '@Dioreo' : 'd'} help <command>\`` : '**/help** \`cmd:\`'} opens one command`
        });
        // One block under the directory, no new page. It costs 2 of the message's 40 components (27 on the landing with the footer row, counted by scripts/helpTextCommands.test.js).
        components.push({ type: 14, spacing: 1, divider: true });
        components.push({ type: 10, content: textCommandsBlock(client) });
        components.push({ type: 14, spacing: 2, divider: true });
        // Deliberately NOT re-mentioning `/help cmd:` here -- the directory above already covers it ("Learn more about a command: /help <cmd>"); this line is the dropdown's own label, and the directory no longer says "Or use the Dropdown below!" as well (critique #28).
        components.push({ type: 10, content: `-# Browse by category, or jump to one command` });
        components.push(buildCategorySelectRow('landing', perms));
        components.push(buildCommandSelectRow(null, perms, await currentSeasonEmoji()));
        components.push({ type: 14, spacing: 1, divider: true });
        // The sign-off in the launch announcement's style (2026-10-27 01:23 EDT, Harkirat). "Report bugs & suggestions to @dior" went with it: the Bugs & Suggestions button under this panel does that now.
        components.push({ type: 10, content: `-# Made with ${emojis.diorHeart} by <@${HARKIRAT_ID}>` });
    } else {
        // `requested` is the already-permission-checked category from the guard above. detailCommands (gunsmith only) or visibleCommands(requested, perms) -- see each builder's own comment for why membership drives filtering instead of raw `perms`.
        let detailSource = requested.detailCommands || visibleCommands(requested, perms);
        // `/help cmd:<x>` opens x's whole page (critique #4): x moves to the top where a page lists one block per command, and the header says what was asked for.
        const focusAt = focusName ? detailSource.findIndex(c => c.name === focusName) : -1;
        if (focusAt > 0) detailSource = [detailSource[focusAt], ...detailSource.filter((_, i) => i !== focusAt)];
        // From the one-command dropdown (2026-10-27 10:44 EDT): that command's block alone.
        if (onlyFocus && focusAt >= 0) detailSource = [detailSource[0]];
        const body = BODY_BUILDERS[selectedKey](detailSource, client);
        const asked = focusAt >= 0 ? `\n-# You asked about ${mentionCommand(client, focusName)}` : '';

        components.push({ type: 10, content: `## ${emojis[categoryEmojiKey(CATEGORY_DEFS.find(c => c.key === selectedKey), perms)]} **${DETAIL_HEADERS[selectedKey]}**\n${USAGE_LEGEND}${asked}` });
        components.push({ type: 14, spacing: 2, divider: true });
        // A builder returns either one string (split on SECTION_BREAK into Text Displays with dividers) or a list of parts, where a part with an `accessory` becomes a Section. Parts sit together with no divider, as one page.
        if (Array.isArray(body)) {
            body.forEach(p => components.push(p.divider ? { type: 14, spacing: 1, divider: true } : p.accessory ? { type: 9, components: [{ type: 10, content: p.content }], accessory: p.accessory } : { type: 10, content: p.content }));
        } else {
            body.split(SECTION_BREAK).forEach((chunk, i) => {
                if (i > 0) components.push({ type: 14, spacing: 1, divider: true });
                components.push({ type: 10, content: chunk });
            });
        }
        components.push({ type: 14, spacing: 2, divider: true });
        // Detail pages DON'T already mention /help cmd: in their main content (unlike the landing page above), so it's worth surfacing here -- reworded from the landing hint rather than reused verbatim, since the two pages need different things said.
        components.push({ type: 10, content: `-# Browse by category, or jump to one command` });
        components.push(buildCategorySelectRow(onlyFocus ? null : selectedKey, perms));
        components.push(buildCommandSelectRow(onlyFocus ? focusName : null, perms, await currentSeasonEmoji()));

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
                    placeholder: 'Open a /manage guide topic…',
                    options: topicDefs().map(t => ({ label: t.label, value: t.key, description: t.description, emoji: t.emoji || undefined }))
                }]
            });
        }
    }

    return { type: 17, accent_color: accentColor, components };
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
    buildContainer,
    getAllHelpCommandNames,
    resolveCommandToCategory,
    suggestHelpCommandNames,
    matchHelpCommand,
    helpPerms,
    helpChoices,
    searchEntries,
    textCommandsBlock,
    textUsage,
    textExample,
    HELP_EXAMPLES,

    // `categoryOverride` (passed by handlers/help.js's `help_category` select-menu handler via a synthetic interaction) skips re-resolving the `cmd` option -- same shape as calendar.js's `pageOverride`. 'landing' is a real dropdown VALUE (the "Commands List" reset option) but behaves identically to null/no-selection, so it's normalized here rather than threading a 6th special case through buildContainer.
    async execute(interaction, categoryOverride = null) {
        // The two permission levels, resolved once and threaded everywhere. Both are free: server admin comes off the interaction's own computed permissions (no REST call, no privileged intent, false outside a guild), and bot admin is an id comparison.
        const perms = await helpPerms(interaction);

        let selectedKey = categoryOverride;
        let focusName = null;
        // `cmd:<name>` comes from the one-command dropdown: open that command's page with only its block.
        const onlyFocus = typeof categoryOverride === 'string' && categoryOverride.startsWith('cmd:');
        if (onlyFocus) {
            const name = categoryOverride.slice(4);
            selectedKey = await resolveCommandToCategory(name, perms);
            focusName = selectedKey ? await matchHelpCommand(name, perms) : null;
        }
        if (selectedKey === null && interaction.isChatInputCommand()) {
            const cmdOption = interaction.options.getString('cmd');
            // `cmd:announcement` posts the announcements running now instead of a command page (2026-10-28 16:40 EDT, Harkirat: "if i type /help cmd:announcement visibility:public that it'll send the launch announcement as a public message"). Hidden unless visibility says public, like every /help answer. It claims the word before the alias match below, which sent `announcement` to /manage.
            if (cmdOption && /^\/?announcements?$/i.test(cmdOption.trim())) {
                const choice = interaction.options.getString('visibility');
                await interaction.deferReply({ flags: choice === 'public' ? 0 : 64 });
                return await sendV2Payload(interaction, await require('../utils/announcement').buildActiveAnnouncementComponents(), { allowedMentions: { parse: [] } });
            }
            if (cmdOption) {
                selectedKey = await resolveCommandToCategory(cmdOption, perms);
                focusName = selectedKey ? await matchHelpCommand(cmdOption, perms) : null;
            }
        }
        if (selectedKey === 'landing') selectedKey = null;

        // Unlike every other command, /help has no saved preference to fall back to -- defaults to hidden (matches /manage's own-panel convention) unless explicitly made public.
        const visibilityChoice = interaction.isChatInputCommand() ? interaction.options.getString('visibility') : null;
        const isEphemeral = visibilityChoice === null ? true : visibilityChoice === 'hidden';
        if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);

        // No "Show Everyone" button -- the visibility option above already covers that case up front, and repeating it here would be redundant (Harkirat's direct request).
        const components = [await buildContainer(selectedKey, accentColor, perms, interaction.client, focusName, onlyFocus)];
        // Under every /help page, outside its card (2026-10-27 01:23 EDT, Harkirat; "regardless of whatever cmd/page of /help is being viewed", 01:21 EDT): Announcements shows what is running now, privately, and Bugs & Suggestions opens the pop-up utils/feedback.js sends to the owner. Answered by handlers/help.js. It costs 3 of the message's 40 components; scripts/feedback.test.js counts every page with it.
        components.push(helpFooterRow());
        // No mention pings or highlights (2026-10-27 10:44 EDT, Harkirat: "i want the clickable username but not the highlight"): the sign-off's <@dior> stays a clickable name, but the panel no longer lights up yellow for him. Same suppression /settings uses.
        return await sendV2Payload(interaction, components, { allowedMentions: { parse: [] } });
    }
};
