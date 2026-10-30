// utils/helpPages.js -- /help's pages since B6: one page per command, each in a typed and a slash view, and the home page (Harkirat's designs, approved in #testing-spam 2026-10-29 19:02-23:52 EDT; the category pages and their dropdown are gone, his "sure" 2026-10-29 17:07 EDT).
//
// THE LAYOUT, his (2026-10-29 19:02 EDT, refined through 20:59 EDT): `## icon Name` with a `-#` line, a large divider, the usage (`### \`d draws [new|returning]\`` with the aliases under it, or the slash mention), one text box per option, a button row (Slash Command / Text Command, plus Detailed view or Calc Guide where a page has one), a small divider, the reply / right-click / bell section if any and another small divider, `-# **Examples**`, then the Usage legend. The command switcher sits OUTSIDE the card, above /help's footer row.
//
// THE RULES (his, 2026-10-29): a typed page names other commands typed (`d settings`), a slash page keeps slash names (20:45 EDT); every word a typed page shows comes from utils/textCommands/commands.js (`helpWord`, `shown`, a value's `shown` / `group` / `label`), so a page cannot promise a word the parser does not accept (scripts/helpTextCommands.test.js parses them); and each page is written from the command's own code, never from the old help prose (21:52 EDT, after the /admin miss). The seven Bot Admin pages other than /manage carry their old help text unchanged, one page each (his "skip bot admin", 22:49 EDT), and /admin's text waits for B7 (his call, 22:00 EDT).
const emojis = require('./emojiMap');
const { slashMention } = require('./commandMentions');

const code = w => `\`${w}\``;
const dot = list => list.map(code).join(' · ');
const line = spacing => ({ type: 14, spacing, divider: true });
const text = content => ({ type: 10, content });
const VIS = text('`[visibility]`\n-# Show only to you, or everyone in the chat');
const VIS_PUBLIC = text('`[visibility]`\n-# Everyone in the chat by default, or only you');
const GATE = "-# Needs Dioreo's own admin access, not a server permission";

function textCommandOf(name) {
    const { TEXT_COMMANDS } = require('./textCommands/commands');
    return TEXT_COMMANDS.find(c => `/${c.slash}${c.sub ? ` ${c.sub}` : ''}` === name) || null;
}
const valuesOf = (name, option) => (textCommandOf(name)?.options || []).find(o => o.name === option)?.values || [];

// Each page's name, as the title and the switcher show it, and its order in the switcher (the v3 announcement's order, his 2026-10-27 19:03 EDT; then /admin and the Bot Admin pages).
const PAGE_NAMES = {
    '/gunsmith mp': 'MP Gunsmith', '/gunsmith dmz': 'DMZ Gunsmith', '/draws': 'Lucky Draws', '/draw prices': 'Lucky Draw Prices', '/draw calculator': 'Draw Calculator',
    '/today': 'Today', '/calendar': 'Calendar', '/remind': 'Reminders', '/season end': 'Season End', '/patch notes': 'Patch Notes',
    '/timestamp': 'Timestamps', '/colors': 'Profile Colors', '/settings': 'Settings', '/invite': 'Invite Dioreo', '/admin': 'Server Admin',
    '/manage': 'Manage Data', '/manage emojis': 'Emoji Manager', '/autobuild': 'Autobuild', '/bot analytics': 'Bot Analytics', '/bot access': 'Admin Access', '/bot servers': 'Server Rules', '/bot hotpatch': 'Hot Patch', '/embed': 'Embed Preview',
};
const PAGE_ORDER = Object.keys(PAGE_NAMES);
const PAGE_ICON = {
    '/gunsmith mp': 'gunsmithSearch', '/gunsmith dmz': 'dmz', '/draws': 'newDraws', '/draw prices': 'drawPrices', '/draw calculator': 'calculator',
    '/today': 'dailyUpdate', '/calendar': 'calendar', '/remind': 'remind', '/season end': 'bp', '/patch notes': 'patchNotes',
    '/timestamp': 'timestamp', '/colors': 'showColors', '/settings': 'settings', '/invite': 'shareHeart', '/admin': 'serverSettings',
    '/manage': 'database', '/manage emojis': 'swatches', '/autobuild': 'gunsmithCode', '/bot analytics': 'mngInfo', '/bot access': 'botAccess', '/bot servers': 'guide', '/bot hotpatch': 'edit', '/embed': 'edit',
};
// /season end wears the live season's own emoji (his call, 2026-10-29 22:55 EDT); /manage emojis its DB_Emojis where the app has it.
function pageIcon(name, seasonEmoji) {
    if (name === '/season end' && seasonEmoji) return seasonEmoji;
    if (name === '/manage emojis' && emojis.DB_Emojis) return emojis.DB_Emojis;
    return emojis[PAGE_ICON[name]] || emojis.info;
}

// The bell line a page carries where its panel has the reminders bell.
const bell = () => emojis.addReminder || emojis.remind;

// THE PAGES. Each returns { blurb, args (typed usage after the command word), usageNote, boxes, buttons, sections, examples, tail } for one view. `x` is { client, p (the typed prefix), view, detail }. An example is [code, description?].
const PAGES = {
    '/today': {
        blurb: "Your daily brief: what changed at the daily update, and what's next",
        page(x) {
            const shows = text("**What's in it**\n> -# **Released**  *New since the daily update*\n> -# **Going live**  *At the next daily update*\n> -# **Leaving soon**  *Ends within 2 days*\n> -# **Countdowns**  *Next update, BP, Ranked, DMZ*");
            const getIt = text(`**Get it by DM**\n-# Tap ${bell()} on the brief to set reminders, this brief every day included${x.view === 'text' ? `, or ${code(`${x.p} remind`)}` : ''}`);
            return x.view === 'text'
                ? { boxes: [shows], sections: [getIt], examples: [[`${x.p} today`, "Today's brief"], [`${x.p} td`, 'The same, shortest'], [`${x.p} calendar`, 'The whole season instead']] }
                : { boxes: [VIS, shows], sections: [getIt], examples: [['/today'], ['/today visibility:Public']] };
        },
    },
    '/season end': {
        blurb: "When this season's Battle Pass, Ranked and DMZ end",
        page(x) {
            const shows = text("**What's in it**\n> -# **Battle Pass** · **Ranked Series** · **DMZ Season**\n-# Each with its end date, a countdown, and a progress bar while it runs");
            const remind = text(`**Get reminded**\n-# Tap ${bell()} on the page to set Battle Pass, Ranked and DMZ end reminders${x.view === 'text' ? `, or ${code(`${x.p} remind`)}` : ''}`);
            return x.view === 'text'
                ? { boxes: [shows], sections: [remind], examples: [[`${x.p} end`, 'Every end date'], [`${x.p} se`, 'The same, shortest']] }
                : { boxes: [VIS, shows], sections: [remind], examples: [['/season end'], ['/season end visibility:Public']] };
        },
    },
    '/invite': {
        blurb: 'Add Dioreo to a server or your own apps, or share it',
        page(x) {
            const shows = text("**What's in it**\n> -# **Add to Server**  *For everyone in a server*\n> -# **Add to My Apps**  *Use it anywhere, just you*\n> -# **Website**  *[dioreo.app](<https://dioreo.app>)*\n> -# **Share Link**  *Posts an Add Dioreo link*");
            return x.view === 'text'
                ? { boxes: [shows], examples: [[`${x.p} invite`, 'The invite panel'], [`${x.p} link`, 'The same']] }
                : { boxes: [VIS_PUBLIC, shows], examples: [['/invite'], ['/invite visibility:Hidden']] };
        },
    },
    '/remind': {
        blurb: 'A DM when draws, events and modes go live or leave, and before the season ends',
        page(x) {
            const groups = text("**Turn on a group**\n> -# **Draws, events & modes**  *Going live, or leaving soon*\n> -# **Season**  *New season, BP, Ranked, DMZ ends*\n> -# **Updates**  *Patch notes, the daily brief*\n-# Or pick single draws, events and modes in the panel's two lists");
            const good = text("**Good to know**\n> -# One DM a day, just after the daily update\n> -# Leaving: 2 days and 1 day before · Season ends: 3 days before and the last day\n> -# **Send a test** shows today's DM now · **Stop all** turns everything off");
            const where = x.view === 'text' ? dot(['today', 'calendar', 'draws', 'patch notes', 'end'].map(w => `${x.p} ${w}`)) : '/today, /calendar, /draws, /patch notes and /season end';
            const bellLine = text(`**The ${bell()} bell**\n-# On ${where}: opens your reminders privately`);
            return x.view === 'text'
                ? { boxes: [groups, good], sections: [bellLine], examples: [[`${x.p} remind`, 'Your reminders panel'], [`${x.p} r`, 'The same, shortest']] }
                : { boxes: [text('`[releases]`\n-# Turn one reminder on or off for when something goes live (start typing)'), text('`[leaving]`\n-# The same, for when something is leaving'), text('`[visibility]`\n-# Everyone in the chat by default, or only you. Only you can press it'), groups, good], sections: [bellLine], examples: [['/remind', 'Your reminders panel'], ['/remind releases:New draws', 'Every new draw, on or off'], ['/remind leaving:Events leaving']] };
        },
    },
    '/draws': {
        blurb: "This season's new and returning Lucky Draws, with their items",
        page(x) {
            const shows = text(`**On the page**\n> -# **New / Returning Draws**  *Jump to the other list*\n> -# **Calculate**  *Price a draw in the calculator*\n> -# ${bell()} **Bell**  *Opens your reminders privately*`);
            if (x.view !== 'text') return { boxes: [text('`[page]`\n-# Open on New Draws or Returning Draws'), VIS, shows], examples: [['/draws'], ['/draws page:Returning Draws']] };
            const words = value => valuesOf('/draws', 'page').find(v => v.value === value).aliases.filter(a => a !== 'all');
            return {
                args: '[new|returning]',
                boxes: [text(`**Page**\n-# Open on New or Returning. Blank opens on New\n> -# **New** ${dot(words('new'))}\n> -# **Returning** ${dot(words('returning'))}`), shows],
                examples: [[`${x.p} draws`, "This season's draws"], [`${x.p} draws returning`, 'Straight to Returning'], [`${x.p} ld r`, 'The same, shortest']],
            };
        },
    },
    '/calendar': {
        blurb: "This season's draws, events and modes on one timeline",
        page(x) {
            const shows = text(`**On the page**\n> -# **Filter menu**  *Mix statuses and types*\n> -# ${bell()} **Bell**  *Opens your reminders privately*`);
            if (x.view !== 'text') return { boxes: [text('`[page]`\n-# Today, Draws, Events, or Playlists & Modes. Blank opens on Today'), text('`[filter]`\n-# Full Timeline, Past/Ended, Live Right Now or Upcoming'), VIS, shows], examples: [['/calendar page:Events filter:Live Right Now'], ['/calendar page:Draws filter:Upcoming']] };
            return {
                args: '[page] [filter]',
                boxes: [
                    text(`**Page**\n-# Blank opens on Today\n> -# **Draws** ${dot(['draws', 'd'])}\n> -# **Events** ${dot(['events', 'ev', 'e'])}\n> -# **Modes** ${dot(['modes', 'playlists', 'pl', 'gm'])}\n-# ${code(`${x.p} events`)} and ${code(`${x.p} modes`)} work on their own too`),
                    text(`**Filter**\n-# Blank shows the full timeline\n> -# **Live** ${dot(['live', 'now', 'active'])}\n> -# **Upcoming** ${dot(['upcoming', 'soon', 'next'])}\n> -# **Past** ${dot(['past', 'ended', 'over'])}`),
                    shows,
                ],
                examples: [[`${x.p} calendar`, "Today's page"], [`${x.p} cal events live`, 'Events running now'], [`${x.p} modes soon`, 'Modes coming up'], [`${x.p} c draws past`, 'Draws that ended']],
            };
        },
    },
    '/patch notes': {
        blurb: 'Weapon buffs, nerfs and fixes for this season, or any past one',
        page(x) {
            const shows = text(`**On the page**\n> -# **Previous seasons**  *Pick one, each with its dates*\n> -# **Search Older Seasons**  *Once there are too many to list*\n> -# ${bell()} **Bell**  *Opens your reminders privately*`);
            if (x.view !== 'text') return { boxes: [text('`[season]`\n-# A past season, by number or name (it searches as you type). Blank is this season'), VIS, shows], examples: [['/patch notes'], ['/patch notes season:8']] };
            return {
                args: '[season]',
                boxes: [text(`**Season**\n-# Blank opens this season's notes\n> -# **A past season**  ${dot(['8', 's8', 'season 8'])} or a word from its title\n> -# **The newest posted**  ${dot(valuesOf('/patch notes', 'season')[0].aliases)}`), shows],
                examples: [[`${x.p} pn`, "This season's notes"], [`${x.p} pn s8`, "Season 8's"], [`${x.p} patch notes terminated`, 'By a word from its title'], [`${x.p} pn latest`, 'The newest posted, even before its season starts']],
            };
        },
    },
    '/draw prices': {
        blurb: 'CP cost breakdown for every draw type, split by CP region',
        page(x) {
            if (x.view !== 'text') return { boxes: [text('`[filter]`\n-# Quickly open a draw type'), text('`[region]`\n-# View costs for a specific CP region'), VIS], examples: [['/draw prices filter:Mythic Weapon Draw visibility:Hidden'], ['/draw prices region:30 CP Region']] };
            const types = valuesOf('/draw prices', 'filter');
            const regions = valuesOf('/draw prices', 'region');
            const groupWords = types.filter(v => !/\s/.test(v.aliases[0]) && [].concat(v.value).length > 1).map(v => v.aliases[0]);
            const row = v => `-# **${code(v.aliases[0])}**${(v.shown || []).length ? ` · ${dot(v.shown)}` : ''}`;
            const examples = [[`${x.p} price 30cp`, '30 CP region'], [`${x.p} cost mythic weapon`, 'Mythic Weapon'], [`${x.p} cp armory 10cp`, 'Armory, 10 CP'], [`${x.p} price type:dl`, 'Double Legendary']];
            // Simple view: the group words; Detailed view: every type in its group, quoted (his "quoted better", 2026-10-29 18:33 EDT), with his short forms (lcw and dlw hidden).
            const boxes = x.detail
                ? [...['Mythic', 'Legendary', 'Special', 'More'].map((g, i) => text(`${i === 0 ? '**Type**\n' : ''}-# **${g}**\n${types.filter(v => v.group === g).map(v => `> ${row(v)}`).join('\n')}`)),
                    text(`**Region**\n${dot(regions.map(v => v.aliases[0]))}\n-# or just ${dot(regions.map(v => v.shown[0]))}`)]
                : [text(`**Type**\n${dot(groupWords)}\n-# *+${types.length - groupWords.length} more in Detailed view*`), text(`**Region**\n${dot(regions.map(v => v.aliases[0]))}`)];
            const toggle = { type: 2, style: 2, label: x.detail ? 'Simple view' : 'Detailed view', custom_id: `help_view~${x.detail ? 'text' : 'detail'}~/draw prices`, ...emojiField(x.detail ? 'collapse' : 'expand') };
            return { args: '[type] [region]', boxes, buttons: [toggle], examples: examples.slice(0, x.detail ? 4 : 3) };
        },
    },
    '/draw calculator': {
        blurb: 'Work out the CP for your draws and Mythic upgrades, what you still need, and the bundles to buy',
        page(x) {
            const dc = require('../commands/drawCalculator');
            const guide = { type: 2, style: 2, label: 'Calc Guide', custom_id: dc.encodeState('help', dc.defaultState()), ...emojiField('calculator') };
            if (x.view !== 'text') return { boxes: [text('`[page]`\n-# Open on Home, New Calculation, View Saved, or Help'), VIS], buttons: [guide], examples: [['/draw calculator page:New Calculation'], ['/draw calculator page:View Saved']] };
            const order = ['start', 'new', 'saved', 'help'];
            const screens = [...valuesOf('/draw calculator', 'page')].sort((a, b) => order.indexOf(a.value) - order.indexOf(b.value))
                .map(v => `> -# **${code(v.aliases[0])}** · ${dot(v.shown || [])}  ${v.label}`).join('\n');
            return {
                args: '[screen]', boxes: [text(`**Screen**\n${screens}`)], buttons: [guide],
                examples: [[`${x.p} calc new`, 'A fresh calculation'], [`${x.p} calc saved`, 'Your saved calculations'], [`${x.p} dc help`, "The calculator's help"]],
            };
        },
    },
    '/gunsmith mp': { blurb: "Find an MP weapon's loadout, or browse a whole class or the Meta", page: x => gunsmithPage(x, 'MP') },
    '/gunsmith dmz': { blurb: "Find a DMZ weapon's loadout, or browse a whole class or the Meta", page: x => gunsmithPage(x, 'DMZ') },
    '/timestamp': {
        blurb: 'Turn any date or time into a timestamp everyone sees in their own time zone',
        page(x) {
            const rightClick = text('**Right-click or tap and hold a message**\n-# Apps → **Convert Times**: every date and time in it, in your own time zone');
            if (x.view !== 'text') {
                return {
                    boxes: [text(`\`<datetime>\`\nType it the way you'd say it.\n-# Such as ${dot(['tomorrow', 'sun 4:30pm', '8pm to 10pm', '8pm utc+5'])}`), text('`[timezone]`\n-# Any short name, city or country (it searches as you type); blank uses your /settings one'), text('`[style]`\n-# Short List, All Formats, or one format'), text('`[view]`\n-# Embed panel or plain text'), VIS],
                    sections: [rightClick], examples: [['/timestamp datetime:tomorrow 8pm'], ['/timestamp datetime:dec 25 view:Text']],
                };
            }
            return {
                args: '<date/time> [zone]',
                boxes: [
                    text(`**Date or time**\nType it the way you'd say it, or a range.\n-# Such as ${dot(['tomorrow 8pm', 'in 2 days', '8pm to 10pm', 'dec 24 to dec 26'])}`),
                    text(`**Time zone**\nAt the end, any IANA name, short name, city or country. ${code('tz:')} in front works too.\n> -# **IANA names** ${dot(['asia/tokyo', 'europe/london', 'america/chicago'])} *+ more*\n> -# **Short names** ${dot(['est', 'pst', 'cst', 'gmt', 'cet', 'ist', 'jst'])} *+ more*\n> -# **Cities** ${dot(['nyc', 'london', 'tokyo', 'sydney', 'dubai'])} *+ more*\n> -# **Countries** ${dot(['uk', 'india'])} *+ more*\n> -# **Offsets** ${dot(['utc+5', 'gmt-4', 'utc+5:30'])} *+ more*\n-# Blank uses your ${code(`${x.p} settings`)} time zone default`),
                ],
                sections: [text(`**Reply to a message**\n-# Reply with ${code(`${x.p} ts`)} and every time in that message is converted`), rightClick],
                examples: [[`${x.p} ts tomorrow 8pm`, 'Tomorrow, 8 PM'], [`${x.p} time fri 6pm tokyo`, 'Friday, 6 PM in Tokyo'], [`${x.p} ts 8pm to 10pm tz:pst`, 'A range, Pacific'], [`${x.p} ts`, "As a reply: that message's times"]],
            };
        },
    },
    '/colors': {
        blurb: 'The colors in your Discord profile, and which one accents your panels',
        page(x) {
            const rightClick = text("**Right-click or tap and hold a member or their message**\n-# Apps → **View Colors**: that person's profile colors");
            const refresh = text('**Refresh Colors**\n-# Changed your avatar, banner, nameplate or deco? Press **Refresh Colors** on your colors panel and Dioreo reads them again, and updates the accent on your panels too.');
            if (x.view !== 'text') return { boxes: [text('`[page]`\n-# Open on Avatar, Banner, Deco, Nameplate, Username'), text('`[source]`\n-# Your main profile, or the one for this server'), VIS], sections: [rightClick, refresh], examples: [['/colors page:Banner'], ['/colors page:Nameplate source:From Server Profile']] };
            return {
                args: '[@someone]',
                sections: [text(`**Someone else's colors**\nMention them, or reply to their message with ${code(`${x.p} colors`)}.`), rightClick, refresh],
                examples: [[`${x.p} colors`, 'Your colors'], [`${x.p} colors @dior`, 'Their colors'], [`${x.p} col`, "As a reply: that person's colors"]],
            };
        },
    },
    '/settings': {
        blurb: 'Your time zone, reply visibility, CP region, timestamp style and colors',
        page(x) {
            // One view, his layout (2026-10-29 21:35-21:39 EDT): what each setting does, the visibility list in rows of two so no name breaks on a phone. Colors is its own command.
            const detail = [
                text('**Visibility settings**\n-# Set default visibility, public or private, for slash commands.\n> -# Weapon Builds · Seasonal Content\n> -# Draw Calculator · Timestamps\n> -# Settings Dashboard · Colors'),
                text('**Preference settings**\n-# Set your own defaults.\n> -# **CP Region**  *The region draw prices use*\n> -# **Currency**  *The currency prices show in*\n> -# **Time Zone**  *Used for times you type*\n> -# **Timestamp Style**  *Default timestamp format*\n> -# **Accent Color**  *Embed accent color*\n> -# **Announcements**  *Dioreo news & updates*'),
            ];
            return x.view === 'text'
                ? { boxes: detail, examples: [[`${x.p} settings`, 'Your settings'], [`${x.p} s`, 'The same, shortest']] }
                : { boxes: [text('`[open]`\n-# Open straight on Visibility, Preferences or Colors'), VIS, ...detail], examples: [['/settings open:Preferences'], ['/settings visibility:Public']] };
        },
    },
    // /admin's own text, carried over unchanged (his call, 2026-10-29 22:00 EDT: "leave the full /admin help panel review and fix to b7").
    '/admin': {
        blurb: "Choose where Dioreo's replies stay private in your server",
        slashOnly: true,
        page(x) {
            return {
                usageNote: 'Where Dioreo answers **publicly** and where it stays **private**, for the whole server. Needs **Manage Server**.',
                boxes: [
                    text('-# Opens a four-page panel — **Overview · Channels · Roles · Commands**\n\n-# **Rule order** · the most specific one wins\n-# 🔹 Command **→** Role **→** Channel **→** the Overview default\n-# 🔹 Threads follow their parent channel · if two roles disagree, **public wins**'),
                    text(`-# **Setting it up**\n-# 🔸 Pick a default on **Overview**, then hand-pick the few channels or roles that should differ\n-# 🔸 Rules only make Dioreo **quieter** — Public *permits* a public answer, it never overrides someone's own ${slashMention(x.client, '/settings')}\n\n-# **Worth knowing**\n-# 🔸 Each menu holds up to **25 picks** (Discord's limit). Needing more usually means a different default would suit better\n-# 🔸 It hides the **answer**, not the command — to remove a command entirely, use **Server Settings → Integrations**`),
                    VIS,
                ],
                examples: [['-# 🔸 **/admin** → **Overview** → Default *Private*, then **Channels** → allow `#bot-spam`'], ['-# 🔸 **/admin** → **Roles** → *Always public for these roles* → `@Moderator`'], ['-# 🔸 **/admin** → **Commands** → `/colors` → *Private*: only `/colors` answers privately']],
                legendNote: ' · no text command',
            };
        },
    },
    // /manage, his approved page (2026-10-29 22:50 EDT): its sections as mentions, the bulk format guides dropdown on this page now, the three right-clicks.
    '/manage': {
        blurb: 'Add and edit what Dioreo shows: draws, calendar, patch notes, builds, seasons and announcements',
        slashOnly: true, admin: true,
        page(x) {
            const m = n => slashMention(x.client, n);
            const SECTIONS = [['manage draws', 'New and returning draws'], ['manage calendar', 'Events, playlists and banners'], ['manage patch-notes', 'Season patch notes'], ['manage gunsmith mp', 'MP builds'], ['manage gunsmith dmz', 'DMZ builds'], ['manage season titles', 'Titles and deadlines'], ['manage season draft', 'Stage the next season'], ['manage announcement', 'Bot-wide announcements'], ['manage guide', 'The bulk format guides']];
            const { topicDefs } = require('./manageGuides');
            return {
                usageNote: "-# One subcommand per section; each opens that section's panel",
                boxes: [
                    text(`**Sections**\n${SECTIONS.map(([n, d]) => `> -# ${m(`/${n}`)}  *${d}*`).join('\n')}`),
                    text("`[action]`\n-# Open one of that section's buttons directly, e.g. **Add Multiple** or **Export**. Purge, Promote and Discard stay on the panel"),
                    text('`[visibility]`\n-# Only you by default, or everyone in the chat. Not on season titles'),
                ],
                sections: [
                    text("**Bulk format guides**\n-# The paste format for each section's Multiple boxes"),
                    { type: 1, components: [{ type: 3, custom_id: 'help_guide_pick', placeholder: 'Open a guide…', options: topicDefs().map(t => ({ label: t.label, value: t.key, description: t.description, emoji: t.emoji || undefined })) }] },
                    line(1),
                    text("**Right-click or tap and hold a message**\n-# Apps → **Add to Calendar** · **Add to Draws** · **Add to Patch Notes**: that section's Add box, filled from the post"),
                ],
                examples: [['/manage draws action:Add Multiple'], ['/manage season draft', "Stage next season without touching what's live"], ['/manage patch-notes visibility:Public']],
                legendNote: ' · no text command', gate: true,
            };
        },
    },
    // The other Bot Admin pages carry their old /help text, one page each (his "skip bot admin", 2026-10-29 22:49 EDT).
    '/bot analytics': adminPage("The bot's usage, timing and health, without opening the server it runs on", [text('`[page]`\n-# Jump directly to a page: `Health` · `Alerts` · `Changes` · `Usage` · `Timing`'), VIS], [['/bot analytics page:Usage visibility:Public', 'Share usage data in a channel']]),
    '/bot access': adminPage('Who has admin access, and to what — owner-only', [VIS], [['/bot access']]),
    '/bot servers': adminPage("View, reset or delete one server's /admin rules, for an admin who lost access — owner-only", [text("`[server]`\n-# A server ID; leave it blank to pick the server you're in or type one")], [['/bot servers']]),
    '/bot hotpatch': adminPage('Reload changed files into the running bot without a restart — owner-only', [text('`[pull]`\n-# git pull first (default: yes)'), text('`[dry_run]`\n-# Show the plan and change nothing'), text('`[file]`\n-# Limit to one changed file (default: everything the pull brought in)')], [['/bot hotpatch dry_run:True']]),
    '/embed': adminPage('Render pasted message JSON as a real Components V2 message, to check a design — owner-only', [text('`[json]`\n-# The message JSON; leave both this and `file` empty to paste it in a box'), text('`[file]`\n-# A .json or .txt file, for JSON too long to paste'), text('`[clean]`\n-# Render only the JSON: no Edit JSON button and no emoji note'), VIS], [['/embed clean:True']]),
    '/manage emojis': adminPage('Every app emoji, which bots lack it, and its saved original: sync, upload or find one — owner-only', [VIS], [['/manage emojis']]),
    '/autobuild': adminPage('Read an MP or DMZ loadout out of a Gunsmith screenshot and stage it for review — nothing is saved until you press Save', [
        text('`[screenshot]`\n-# The Gunsmith screenshot to read; or `url`, never both'), text('`[url]`\n-# A link to the screenshot, if it is already hosted'),
        text('`[category]`\n-# `AR` · `SMG` · `LMG` · `Marksman` · `Sniper` · `Shotgun` · `Secondary`; blank: from the weapon, or asked'), text('`[mode]`\n-# `MP` · `DMZ`; blank: read from the screenshot, or asked'),
        text('`[badges]`\n-# e.g. `meta,top5`: meta, toxic, ass, best, top3, top5, capable or a rank mode; blank means none'), text('`[retry_token]`\n-# Only to retry an image after a failed upload'), VIS,
    ], [['/autobuild screenshot:[upload] category:SMG badges:meta,top5']], {
        usageNote: '-# On its own: a form for up to 10 screenshots or links, each with its own mode, category and badges',
        sections: [text('**Right-click or tap and hold a message**\n-# Apps → **Autobuild Gunsmith** on a message with a Gunsmith screenshot: the same review as /autobuild')],
    }),
};

function adminPage(blurb, boxes, examples, extra = {}) {
    return { blurb, slashOnly: true, admin: true, page: () => ({ boxes, examples, legendNote: ' · no text command', gate: true, ...extra }) };
}

// MP and DMZ Gunsmith (his layouts, 2026-10-29 20:04 EDT and 23:13 EDT): weapon, class and meta in one usage, no Detailed view ("Not every command needs a detailed view"), the build note at the foot with Dispute a Build beside its text.
function gunsmithPage(x, mode) {
    const { ALLOWED_ADMIN_ID } = require('./owner');
    const { BARE_CLASS_WORDS } = require('./textCommands/commands');
    const dmz = mode === 'DMZ';
    const submit = text('**Submit or dispute a build**\n-# **Have a build to share?**\n-# Use **Submit a Build** below.');
    const dispute = { type: 9, components: [text(`-# **Want to dispute a shared build?**\n-# If a shared build uses your screenshot, use **Dispute a Build** with proof you posted it first, for its removal or credit. Or DM the dev <@${ALLOWED_ADMIN_ID}>.`)], accessory: { type: 2, style: 2, label: 'Dispute a Build', custom_id: 'gsb~dispute', ...emojiField('dispute') } };
    if (x.view !== 'text') {
        return {
            boxes: [text(`\`<weapon>\`\n-# Type any ${mode} weapon's name, or pick All META / All ${dmz ? 'DMZ' : 'class'} builds`), VIS],
            examples: dmz ? [['/gunsmith dmz weapon:Fennec'], ['/gunsmith dmz weapon:All DMZ builds']] : [['/gunsmith mp weapon:FSS Hurricane'], ['/gunsmith mp weapon:All SMG builds']],
            tail: [submit, dispute],
        };
    }
    return {
        args: '[weapon|class|meta]',
        usageExtra: dmz ? '' : `\n> -# Or just the weapon, class or meta: ${dot([`${x.p} ak117`, `${x.p} smg`, `${x.p} meta`])}`,
        boxes: [text(`**Weapon**\nType any weapon's name.\n-# Such as ${dot(['ak117', 'kilo 141', 'fennec'])}\n> -# Part of the name works too`), text(`**Class**\n${dot(Object.keys(BARE_CLASS_WORDS))}`)],
        examples: dmz
            ? [[`${x.p} dmz fennec`, "Fennec's DMZ build"], [`${x.p} dmz smg`, 'The first SMG build'], [`${x.p} gsd meta`, 'The DMZ Meta']]
            : [[`${x.p} gs fss`, 'FSS Hurricane build'], [`${x.p} build smg`, 'Just the class'], [`${x.p} fennec`, 'Just the weapon']],
        tail: [submit, dispute],
    };
}

// A button's emoji, only where the booted app has it (utils/emojiMap.js parseEmoji, B4's COMPONENT_INVALID_EMOJI guard).
function emojiField(key) {
    const emoji = emojis.parseEmoji(emojis[key] || '');
    return emoji ? { emoji } : {};
}

const hasPage = name => Boolean(PAGES[name]);
const hasTextView = name => Boolean(PAGES[name] && !PAGES[name].slashOnly && textCommandOf(name));

// One command's page: the card's components. `canSwitch` says the other view works here (typed forms where Dioreo is in the server, and a command with a text form).
function buildPage(name, { client, view, detail = false, canSwitch = false, seasonEmoji = null }) {
    const def = PAGES[name];
    const typed = view === 'text';
    const p = client?.textMessageContent === false ? '@Dioreo' : 'd';
    const part = def.page({ client, p, view, detail });
    const tc = textCommandOf(name);
    const usage = typed
        ? text(`### ${code(`${p} ${tc.helpWord}${part.args ? ` ${part.args}` : ''}`)}\n${dot(tc.shown || [])}${part.usageExtra || ''}`)
        : text(`### ${slashMention(client, name)}${part.usageNote ? `\n${part.usageNote}` : ''}`);
    const buttons = [];
    if (canSwitch) buttons.push({ type: 2, style: 2, label: typed ? 'Slash Command' : 'Text Command', custom_id: `help_view~${typed ? 'slash' : 'text'}~${name}`, ...emojiField('command') });
    buttons.push(...(part.buttons || []));
    const out = [text(`## ${pageIcon(name, seasonEmoji)} ${PAGE_NAMES[name]}\n-# ${def.blurb}`), line(2), usage, ...(part.boxes || [])];
    if (buttons.length) out.push({ type: 1, components: buttons });
    out.push(line(1));
    if (part.sections?.length) out.push(...part.sections, line(1));
    // An example is [code, description?]; one already written as a line (/admin's recipes, kept as they were) is used as it is.
    out.push(text(`-# **Examples**\n${part.examples.map(([ex, d]) => (ex.startsWith('-# ') ? ex : `-# ${code(ex)}${d ? `  ${d}` : ''}`)).join('\n')}`));
    out.push(text(`-# Usage: ${code(typed ? `${p} cmd <required> [optional]` : '/cmd <required> [optional]')}${part.legendNote || ''}${part.gate ? `\n${GATE}` : ''}`));
    if (part.tail?.length) out.push(line(1), ...part.tail);
    return out;
}

// The home page, his approved layout (2026-10-29 23:52 EDT): today's hero, links and sign-off; the #1 card's four groups in short words (typed) or as mentions (slash); a Text commands line and its button where typed forms work.
const HOME_GROUPS = [['gunsmithSearch', 'Gunsmith', ['gunsmith', 'dmz'], ['/gunsmith mp', '/gunsmith dmz']], ['newDraws', 'Draws', ['draws', 'prices', 'calculator'], ['/draws', '/draw prices', '/draw calculator']], ['calendar', 'Season', ['today', 'calendar', 'remind', 'patch notes', 'end'], ['/today', '/calendar', '/remind', '/patch notes', '/season end']], ['eyedropper', 'Utilities', ['timestamp', 'colors', 'settings', 'invite', 'help'], ['/timestamp', '/colors', '/settings', '/invite', '/help']]];
function buildHome({ client, view, canSwitch, hero, adminNames = [] }) {
    const typed = view === 'text';
    const p = client?.textMessageContent === false ? '@Dioreo' : 'd';
    const out = [...hero, line(2)];
    if (typed) {
        const start = client?.textMessageContent === false ? `**${code('@Dioreo')}**` : `**${code('@Dioreo')}**, **${code('d')}** or **${code('dior')}**`;
        out.push(text(`### ${emojis.command || ''} Type a command\n-# Start with ${start}, such as ${code(`${p} today`)}`.replace('###  ', '### ')));
        out.push(...HOME_GROUPS.map(([icon, label, words]) => text(`**${emojis[icon]} ${label}**\n${dot(words)}`)));
    } else {
        out.push(...HOME_GROUPS.map(([icon, label, , names]) => text(`**${emojis[icon]} ${label}**\n${names.map(n => slashMention(client, n)).join(' · ')}`)));
    }
    // A server admin's /admin and a bot admin's tools: slash only, so they read the same on both views.
    if (adminNames.length) out.push(text(`**${emojis.serverSettings} Admin**${typed ? ' *(slash only)*' : ''}\n${adminNames.map(n => slashMention(client, n)).join(' · ')}`));
    out.push(text(typed ? `-# ${emojis.info} ${code(`${p} help <command>`)} opens its page, such as ${code(`${p} help calc`)}` : `-# ${emojis.info} **/help** ${code('cmd:')} opens one command's page`));
    if (!typed && canSwitch) out.push(line(1), text(`**Text commands**\n-# Or type one in a message, such as ${code(`${p} today`)}. Works where a server hides slash commands`));
    if (canSwitch) out.push({ type: 1, components: [{ type: 2, style: 2, label: typed ? 'Slash Commands' : 'Text Commands', custom_id: `help_view~${typed ? 'slash' : 'text'}~landing`, ...emojiField('command') }] });
    return out;
}

// The command switcher, outside the card above the footer (his ask, 2026-10-29 18:17 EDT): All commands first; on a typed view each page's name with its typed word under it, on a slash view the slash command with the name under it (18:56 EDT). Commands with no text form show as slash on both. A full admin's list is 24 of Discord's 25.
function buildSwitcher({ names, current = null, view, client, seasonEmoji = null }) {
    const typed = view === 'text';
    const p = client?.textMessageContent === false ? '@Dioreo' : 'd';
    const options = [{ label: 'All commands', value: 'landing', description: 'Back to the list of every command', default: !current, ...emojiField('dioreoCombo') }];
    for (const name of names.slice(0, 24)) {
        const tc = hasTextView(name) ? textCommandOf(name) : null;
        const emoji = emojis.parseEmoji(pageIcon(name, seasonEmoji) || '');
        options.push({ label: typed && tc ? PAGE_NAMES[name] : name, value: name, description: typed && tc ? `${p} ${tc.helpWord}` : PAGE_NAMES[name], default: name === current, ...(emoji ? { emoji } : {}) });
    }
    return { type: 1, components: [{ type: 3, custom_id: typed ? 'help_command~text' : 'help_command', placeholder: 'Jump to a command…', options }] };
}

module.exports = { PAGES, PAGE_NAMES, PAGE_ORDER, buildPage, buildHome, buildSwitcher, hasPage, hasTextView, pageIcon };
