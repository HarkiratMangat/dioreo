// utils/manageGuides.js
// ==========================================
// /manage BULK FORMAT GUIDES -- rich Components V2 reference views
// ==========================================
// Replaces the old plain-text ephemeral reply (2026-07-31 17:20 EDT build) with a real structured Container -- a paste skeleton, a field-by-field breakdown of what actually gets auto-formatted (title-casing, tier shorthand, emoji substitution, etc.), a concrete before/after example, and tips -- plus a select-menu dropdown so switching topics never means closing the guide and re-clicking a different page's button. Rewritten from scratch 2026-07-31 17:20 EDT (same-day follow-up) after Harkirat's live-testing feedback: the plain-text version didn't explain what was auto vs. literal, the draws example was nonsense filler text, and there was no guide at all for Patch Notes or Next Season Draft -- both real gaps, not stylistic nitpicks (Patch Notes' gap directly caused a real submission mistake -- see that topic's content below).
//
// Content is data (GUIDE_TOPICS), not hardcoded per-render strings -- emoji lookups happen INSIDE buildGuideContainer() at call time, never captured at module load, per the emoji-freshness rule (.claude/rules/rendering-and-ui.md) -- this file is required once at boot like everything else, and refreshEmojiIds() only rewrites emojiMap's values well after that.
const emojis = require('./emojiMap');

// Maps a /manage page's `group` id to the guide topic it opens on -- loadouts_mp/loadouts_dmz share one topic since the bulk format itself doesn't differ by mode (the mode comes from which button you clicked, not a paste field worth a separate guide).
const GROUP_TO_TOPIC = {
    draws: 'draws',
    calendar: 'calendar',
    loadouts_mp: 'loadouts',
    loadouts_dmz: 'loadouts',
    patchnotes: 'patchnotes',
    seasondraft: 'seasondraft',
    announcement: 'announcements'
};

function resolveGuideTopic(group) {
    return GROUP_TO_TOPIC[group] || 'draws';
}

// Ordered for the select menu -- also the canonical topic list.
function topicDefs() {
    // `emoji` is the PARSED {id,name,animated} shape a select option's own `emoji` field needs (emojiMap.js's parseEmoji()); `rawEmoji` is the raw mention STRING for use inside message text content, where a parsed object isn't insertable. Different shapes, different call sites.
    return [
        { key: 'draws', label: 'Draws', description: 'New/Returning bulk paste format', rawEmoji: emojis.newDraws, emoji: emojis.parseEmoji(emojis.newDraws) },
        { key: 'calendar', label: 'Calendar', description: 'Bullet-separated event paste format', rawEmoji: emojis.calendar, emoji: emojis.parseEmoji(emojis.calendar) },
        { key: 'loadouts', label: 'Gunsmith Builds', description: 'MP/DMZ build block paste format', rawEmoji: emojis.newDraws, emoji: emojis.parseEmoji(emojis.newDraws) },
        { key: 'patchnotes', label: 'Patch Notes', description: 'Release date, URLs, Additional Info', rawEmoji: emojis.patchNotes, emoji: emojis.parseEmoji(emojis.patchNotes) },
        // Quick Add (2026-11-01): the one-line-per-draw box on the Draws page. Its own topic because its rules (new/returning, the date and zone defaults, Pick, Add details) are not the bulk format's.
        { key: 'quickadd', label: 'Quick Add', description: 'One line per draw: name, then dates', rawEmoji: emojis.mngAdd, emoji: emojis.parseEmoji(emojis.mngAdd) },
        { key: 'seasondraft', label: 'Next Season Draft', description: 'Same formats, staged instead of live', rawEmoji: emojis.calendar, emoji: emojis.parseEmoji(emojis.calendar) },
        // 'admins' topic REMOVED (v3-pre-release review, finding #62) -- it documented a /manage page that no longer exists (retired to the owner-only /bot access 2026-08-16, see utils/adminAccess.js's own 'manageadmins is RETIRED' comment). This guide is reachable by anyone with ANY manage access, so it was walking a scoped admin through a screen they can't actually reach and that isn't owner-gated here.
        { key: 'announcements', label: 'Announcement', description: 'Posting/editing bot-wide announcements', rawEmoji: emojis.dbAnnouncement, emoji: emojis.parseEmoji(emojis.dbAnnouncement) }
    ];
}

function section(heading, body) {
    return { type: 10, content: `### ${heading}\n${body}` };
}
function divider() {
    return { type: 14, spacing: 1, divider: true };
}

// The draws example, drawn by /draws itself for a draw three days out (2026-11-10 11:03 EST): the old one was a hand-written copy of a layout /draws dropped, with a placeholder date that read "57 years ago". /draws is reached through the public client, never required, as the draws panel does (a require would tie this file into /draws' hotpatch closure); with no client (a test, a script) it falls back to plain lines.
function drawsExample() {
    const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 3));
    const end = new Date(start.getTime() + 14 * 864e5);
    const sample = { title: 'Void Implosion Draw', date: start, items: [{ tier: 'legendary', name: 'M4 - Void Implosion' }, { tier: 'epic', name: 'Dusk - Otherworld Ensemble' }, { tier: 'comment', name: 'Girls Frontline Collab' }] };
    const dates = require('./drawDates').formatDrawDatesForBulk(start, end);
    const paste = `Void Implosion Draw, type: lw, l M4 - Void Implosion, e Dusk - Otherworld Ensemble, -# Girls Frontline Collab, ${dates}, https://example.com/image.png`;
    let rendered = null;
    try {
        const draws = require('../bot/clients').publicClient()?.commands?.get('draws');
        rendered = draws?.buildDrawSections?.([sample], { seasonalDoc: {}, nowMs: Date.now() })?.[0]?.components?.[0]?.content || null;
    } catch { rendered = null; }
    return '**Paste this:**\n```\n' + paste + '\n```\n**Renders on /draws as:**\n' +
        (rendered || `### Void Implosion Draw\n${emojis.legendary} **M4** — Void Implosion\n${emojis.epic} **Dusk** — Otherworld Ensemble\n-# Girls Frontline Collab`) +
        '\n-# The end goes on its /calendar row; once it is live, the line above reads Live · Ends.';
}

function drawsSections() {
    return [
        // The real order (2026-11-10 11:03 EST): the reader takes the link off the END first, then the dates, so the old skeleton (link before the date) made the link an item and lost the date.
        section('📋 Paste Skeleton',
            '`Title, type: code, [tier] Item 1, [tier] Item 2, …, Start - End, Picture link`\n' +
            '-# One draw per line, split by commas. A title, one item and a start date are enough; the dates come last, then the link.'),
        section('🏷️ Tier Shorthand',
            `\`m\` ${emojis.mythic} Mythic · \`l\` ${emojis.legendary} Legendary · \`lg\` ${emojis.legacy} Legacy · \`e\` ${emojis.epic} Epic\n` +
            '-# Spell the tier out instead if you\'d rather (`mythic`, `legendary`, etc.) — both work.\n' +
            '-# Start an item with `-# ` instead of a tier to add a free-text note (e.g. a collab callout) instead of a tiered item.'),
        // Draw Type tag (2026-10-18 11:06 EDT): the codes are read from utils/drawTypes.js, so a new draw type shows here without editing this guide.
        section('🎟️ Draw Type (optional)',
            'Add `type: <code>` anywhere after the title to say how **/draw prices** and the calculator price the draw. An armory\'s item count comes from its own item list.\n' +
            `-# ${require('./drawTypes').drawTypeOptions().map(o => `\`${o.code}\` ${o.name}`).join(' · ')}\n` +
            `-# Free, never priced: ${require('./drawTypes').FREE_TYPES.map(o => `\`${o.code}\` ${o.name}`).join(' · ')}`),
        section('✨ What Gets Auto-Formatted',
            '• **Title** and every **item name** → auto Title Case (acronyms like `FSS`/`AK`/`MP`/`BR` are preserved, hyphens/slashes capitalize each side independently).\n' +
            '• A `-# note` line is the one exception — kept **exactly as typed**, never title-cased (it\'s free text, not an item name).\n' +
            '• **Picture link** is optional. Without one, a draw already on /draws keeps its picture, and a new one takes the draw index\'s: exact title first, then a close match.\n' +
            '• **Dates** are read as midnight UTC: `July 15`, `July 15 - August 20`, or `September 10, 2026 - November 12, 2026`. The end goes on the draw\'s /calendar row and can be the game\'s countdown (`13d 23h`).'),
        section('🖼️ Example', drawsExample()),
        // Tips rewritten 2026-11-10 11:15 EST: one line each, and short enough that the guide with /draws' own example stays under Discord's 4,000 characters (it reached 4,245 and Discord refused it).
        section('💡 Tips',
            '• **Export** (or `do:Export`) writes this format with your real draws: the quickest correct example.\n' +
            '• **Bulk Paste** and **Edit N** update a draw with the same title and add new ones, after a preview. Edit leaves picture links out: a line with no link keeps its picture.\n' +
            '• **End Date** (on a card, or on many selected) sets only the end: a date, a countdown, With the season, or Not announced yet. An end needs the Calendar permission.\n' +
            '• **Check Names** (in the **Draw Index**) takes up to 20 names and says what the index has; **Quick Add These** carries the ones it found into Quick Add.\n' +
            '• **Search Draws** takes words and lists; on any results, select one to open it or more to change together.\n' +
            '• **Needs a Look** lists running draws missing a picture, items, a draw type or an end date, each with the button that fixes it.')
    ];
}

// The rules live in utils/quickAdd.js (parsing, matching, zones) and handlers/manage/quickAdd.js (the draft, Pick, Add details, Save); keep this in step with them.
function quickaddSections() {
    return [
        section('📋 One Line Per Draw',
            '`draw name or an item in it, [new], starts …, ends …`\n' +
            '-# Up to 10 lines. Only the name is needed; the rest is optional and in any order.'),
        section('🆕 New or Returning',
            'Every line goes into **Returning Draws** unless it says `new` (`cx9 mythic, new, ends Nov 5` or `new, cx9 mythic`). A draw already on /draws stays in its own section.\n' +
            '-# A new draw the draw index has never seen is filed there as this season\'s draw. One it already has keeps its own season.'),
        section('🕒 Dates and Times',
            '• `starts …` and `ends …` take a date, a weekday or `in 2 days`. No start means today.\n' +
            '• An end can be the game\'s countdown, as it shows in game (`13d 23h`, `ends 14d`): it is saved as the midnight UTC the draw really ends at, counted from when you type it.\n' +
            '• A date with no time is **midnight UTC**. A time with no zone is **Toronto** time.\n' +
            '• A zone you type wins (`7pm pdt`, `7pm gmt`). `est`/`edt` and the like are read as the region, so the right one is used for that date even if the other was typed.'),
        section(`${emojis.search} Finding the Draw`,
            '• The draw index is searched by title, other names, item names and skins, and forgives small typos (`herscher`, `mythic draw` for Mythic Drop).\n' +
            '• A description like `mythic character` lists every draw that fits: press **Pick** and choose one, or that line is skipped on Save.\n' +
            '• A best guess says so; **Pick** swaps it for another draw or keeps what you typed.'),
        section('➕ Not in the Draw Index',
            'Press **Add Details** to give its items, type and a picture, the same as Add Draw. Without them it is saved as typed, with no items.'),
        section('✂️ Before Save',
            '• **Remove lines from the draft…** takes out the lines you pick. **Add More** opens the box again for lines added to the same draft (10 lines fit one draft).\n' +
            '• Each line links its **Picture** when the draw index has one, or says *no picture*.'),
        section('🏷️ After Save',
            'If the saved draws carry items the draw index has no kind for, one more message asks: **Set item kinds** gives a dropdown per item (weapon, character, vehicle, other). The result has **Open Draw** (or a menu for several), **Quick Add More**, **Draws Home**, and **Revert All**, which undoes the save.'),
        section('🌱 In the Next Season Draft',
            '**Season → Next Season Draft → Edit Draws → Quick Add** stages the draws instead of saving them live. A line takes the tab you opened it from unless it says `new` or `returning`, end dates go on the draft calendar, and a draw with no picture is left out. **Needs a Look → Stage These** fills the box with the draft calendar\'s draws that are not staged yet. Players see nothing until Promote to Live.')
    ];
}

function calendarSections() {
    return [
        section('📋 Paste Skeleton',
            '`[d|p|e]•M/D - M/D | Event Title` or `[d|p|e]•M/D - All Season | Event Title`\n' +
            '-# Bullet-separated (a `•` character), NOT one-per-line — this is what survives a copy-paste out of Notes.'),
        section('🏷️ Section Prefix',
            `\`d\` ${emojis.newDraws} Draws · \`p\`/\`g\`/\`m\` ${emojis.modes} Playlists & Modes · \`e\` ${emojis.events} Events\n` +
            '-# The prefix sits directly touching the bullet (`d•`, not `d •`). `g`/`m` are aliases for `p` (playlist = game mode = mode).'),
        section(`${emojis.returnArrow} No-Bullet Lines`,
            'Each entry can ALSO stand on its own line with no `•` at all — prefix (optional) then a space instead of a bullet: `p 8/6 - 8/19 | Krai BR`. Mixing both styles in one paste is fine; a line with no `•` anywhere is read as one complete entry.'),
        section('🎁 Double CP',
            'Add `2x`, `(2x)`, `CP`, `2xCP`, or similar to a title to flag it as a Double CP event — `Krai BR 2x` strips the marker off the saved title; `Krai BR 2x CP Sale` keeps it (it reads as the event\'s real name) and still sets the flag.'),
        section('✨ What Gets Auto-Formatted',
            '• **Title** is kept **exactly as typed** — NOT title-cased, since event names routinely carry acronyms (`MP`/`BR`/`DMZ`) that auto-casing would mangle.\n' +
            '• **Section prefix is optional.** Leave it off and the title is auto-classified by keyword — words like "draw"/"mode"/"playlist"/"map", or a standalone `MP`/`BR`, route it automatically. Ambiguous titles (e.g. a bare map name) should keep the explicit prefix.\n' +
            '• `All Season` as the end date means the event runs until the Battle Pass ends — shown as an open-ended range, no fixed end date stored.\n' +
            '• `TBD` as the end date means the end is not announced yet: the event is saved with no end date (Needs a Look lists it), and exports back as `TBD`.\n' +
            '• Dates are UTC-0.'),
        section('🖼️ Example',
            '**Paste this:**\n' +
            '```\nd•7/15 - 8/1 | Jupiter Cannon Draw•p•7/20 - All Season | Krai BR•e•7/18 - 7/25 | Anniversary Celebration\n```' +
            '\n**Renders as:** 3 entries, sorted onto their own pages — "Jupiter Cannon Draw" under **Draws**, "Krai BR" under **Playlists & Modes** (open-ended, tied to the Battle Pass end), "Anniversary Celebration" under **Events**.'),
        section('💡 Tips',
            '• Use the calendar panel\'s **Export** (or `/manage calendar do:Export`) to grab this exact format pre-filled with your real current data.\n' +
            '• **Bulk Paste**, and **Edit N** on entries you select, update an entry with the same title and add a new one; a preview shows what changes before **Save**, and nothing unmentioned is touched. **Purge Calendar** is the full wipe.\n' +
            '• A **draw** row\'s card has **Open the Draw**, its card in /manage draws. A draw row with no draw of that title on /draws is marked and listed under **Needs a Look**: players see dates with no items or picture, and **Add the Draw** opens Quick Add with the row\'s dates.')
    ];
}

function loadoutsSections() {
    return [
        section('📋 Paste Skeleton',
            '```\nWeapon | Category\nBuild: Build 2\nLabel: Ranked\nCode: Gunsmith Code\nImage: Cloudinary Key\nBadges: meta, best\nComment: Best for close range\n- Attachment 1\n- Attachment 2\n```\n' +
            '-# One build per BLOCK (blank line between blocks). **First line is the weapon\'s identity, every optional field is its own labelled line, everything else is an attachment.** The labelled lines can be in any order and any of them can be left out.'),
        section('🏷️ Badges (comma-separated, optional)',
            '`meta` · `toxic` · `ass` · `best` · `top3` · `top5` · `hm` · `bestclose` · `top3midlong` · `hmclose` (rank + range combos for DMZ)\n' +
            '**Rank modes (MP only, any number):** `hp` · `s&d` · `dom` · `tdm` · `ftl` · `control`\n' +
            '-# Badges belong to the one build they are typed on. `ass` can\'t sit with `meta` or a tier; `top4` is retired and reads as `top5`.'),
        section('✨ What Gets Auto-Formatted',
            '• **Mode** is not a field: pasting on `/manage gunsmith mp` or `dmz` decides it.\n' +
            '• **Code** is required on the MP page (a block without one is skipped and named); DMZ has no code.\n' +
            '• **Options of a merged build:** `Build: Build 2b` is Build 2\'s Option B (`2c` Option C, and so on). It replaces that option, or adds it if it is the next letter; Build 2 must exist, or come earlier in the paste. Badges and Label go on Build 2\'s own block. An Export writes every option this way.\n' +
            '• **Comment** is the line players see quoted under the attachments, one per build (every option shares it). Several Comment lines make one comment over several lines; `Comment:` with nothing after it clears it, and leaving the line out keeps the stored one. The single Add/Edit pop-up takes it as a `Comment:` line at the end of the attachments box.\n' +
            '• **Build**, **Label**, **Image** and **Badges** are optional — omit the whole line if it doesn\'t apply. With no Build line the block is a new build, numbered after the weapon\'s others. **Label** is back end only. Re-pasting a build that already exists keeps its stored Image, Code and Label when you leave those lines out.\n' +
            '• **Image** takes a Cloudinary key, as an Export writes it; the single Add/Edit pop-up takes a URL or a screenshot and files it under the build\'s code for you.\n' +
            '• Attachment names are kept **exactly as typed** — no auto-casing, since these must match the real in-game names precisely. A `-` bullet is optional, and is how you force a line containing a colon to be read as an attachment.'),
        section('🖼️ Example',
            '```\nBAL-27 | AR\nBuild: Build 2\nLabel: Aggro\nCode: 1I2C6B8A9D\nBadges: meta, top3\nComment: Best for close range\n- Monolithic Suppressor\n- FTAC Champion\n```'),
        section('💡 Tips',
            '• Use the gunsmith panel\'s **Export** (or `do:Export`) to get this format filled in with your real data; **Edit N** on selected builds opens the selected builds in it.\n' +
            '• **Expand View** on selected builds walks the selected builds one card at a time, each with its own **Edit** that saves at once; **Finish** says which you edited.\n' +
            '• The old one-line pipe format (`Weapon | Category | Mode | Build | ...`) is refused with an error naming this format; re-export anything saved in it.\n' +
            '• A build\'s picture is filed under its gunsmith code: the Add and Edit pop-ups take a URL or a screenshot and file it for you, and **/autobuild** does it from a Gunsmith screenshot.')
    ];
}

function patchnotesSections() {
    return [
        section('📋 This Page Isn\'t a Bulk Paste — Here\'s What Each Field Actually Does',
            'Patch Notes has no bulk-import format (nothing to paste multiple of) — these are the 3 fields admins get confused by most.'),
        section('📅 Release Date',
            '`July 15` → midnight UTC, same as every other date field.\n' +
            '`July 15, 7:20 AM` → **this one field is different** — the moment you add a time, it\'s read as **your own local clock** (`/settings`' + '\u2019s timezone), not UTC, then converted correctly. Every other date field in the bot ignores time-of-day entirely; this is the one exception.'),
        section('🔗 Images 1-5 / Images 6-10',
            'Each opens 5 separate fields (image 1-5 / image 6-10), not one big paste. Blank = no image in that slot. Every submitted URL is auto re-hosted to Cloudinary so a dead source link never breaks the carousel later.\n' +
            '-# These, and **Edit Date & Info**, are on the current season\'s card. A past season (the **Past seasons** dropdown, or `season:`) edits in one pop-up: its title, date, info and all ten images.\n' +
            '-# **Upload Images** on any season\'s card takes up to 10 pictures from your device, added after the ones it has or replacing them. The card shows the season\'s pictures as players see them.'),
        section('📆 Season Dates and Delete Season',
            '**Season Dates** (a past season\'s card) sets its Battle Pass start and end, which /draws uses to say a draw carried over from that season; blank both to clear them. **Delete Season** asks first. Every save answers on the card with **Revert**, and so does Purge.'),
        section('⚔️ Additional Info — one weapon per line, comma-separated',
            'Typing `b:`/`n:`/`f:` ANYWHERE always swaps in the buff/nerf/fix icon — that part always worked.\n' +
            '**The structured "ADDITIONAL CHANGES" layout is a SEPARATE, opt-in thing** that only turns on once a line starts with `#`. Same comma-delimited feel as the Draws/Calendar bulk formats: `#, then Weapon, then Attachment, then n:/b:/f: text` — ONE weapon per line, a NEW LINE for the next weapon:\n' +
            '```\n# Fennec (DMZ only), Ultra Extended Mag, n: Ammo capacity reduced from 40 Rounds to 20 Rounds\n```\n' +
            `Renders as:\n### ADDITIONAL CHANGES\n__**Fennec (DMZ only)**__\nUltra Extended Mag\n> ${emojis.nerf} Ammo capacity reduced from 40 Rounds to 20 Rounds\n` +
            '-# How it\'s read: the first thing after `#` is the WEAPON name. Every comma-separated thing after that is a new ATTACHMENT — UNLESS it starts with `b:`/`n:`/`f:`, in which case it\'s a CHANGE under whichever attachment came right before it. A weapon can carry as many attachments/changes as you want on its one line; the NEXT weapon just needs its own new line.'),
        section('💡 Tip',
            'Not writing structured changes this patch? Just type a normal sentence — no `#` needed, nothing forces the structured layout on you.')
    ];
}

function seasondraftSections() {
    return [
        section('📋 Same Formats As The Live Pages — Just Staged, Not Live',
            'Next Season Draft writes into a SEPARATE staging area (`seasonalDoc.draft`), completely isolated from what\'s currently public. Nothing here goes live until you press **Promote to Live**.'),
        section('🏷️ Draws / Calendar',
            'Identical paste formats to the live **Draws**/**Calendar** guides (see their own topics in this dropdown) — same tier shorthand, same `d•`/`p•`/`e•` prefixes, same auto title-casing rules.'),
        section('📅 Titles & Deadlines',
            '`Title, End Date` on one line per deadline, e.g. `Battle Pass, August 28`.\n' +
            'Typing `TBD` as the date (case-insensitive) marks that deadline as **not yet announced** instead of parsing it as a real date — shown as "TBD" and treated as running indefinitely until it\'s updated. Same rule as the live Season Titles & Deadlines modal.'),
        section('➕ Paste, Quick Add and the Editors',
            '• **Bulk Paste Draws** and **Bulk Paste Calendar** add and update: a line matching a staged title updates it, a new one is added, and rows you leave out stay staged. A preview shows Added and Changed before **Stage**.\n' +
            '• **Edit Draws** opens the staged draws six a page: **Quick Add**, **Add Draw**, and each draw\'s card with **Edit**, **Set End Date** (on the draft calendar) and **Move** between New and Returning. **Edit Calendar** adds, edits and removes one row at a time; **Banners** sets the draft\'s /calendar page banners.\n' +
            '• **Needs a Look** lists what to check before Promote, each line with a button that opens its fix; **Stage These** turns calendar draws with no staged draw into Quick Add lines. **Players\' View** on a staged list draws it as /draws or /calendar will.'),
        section('💡 Tips',
            '• **Promote to Live** shows what changes (and anything not staged yet), then asks: **Auto-promote** at the Battle Pass start (Dioreo DMs you when it runs; any draft edit by someone else switches it off) or **Promote now**. It swaps title, deadlines, draws, calendar and banners onto the live season in one shot, and keeps last season\'s patch notes title. **Revert** on its result, or in `/bot analytics` › Changes, puts back the live season and the staged draft.')
    ];
}

function adminsSections() {
    return [
        section('📋 This Isn\'t A Bulk Paste Either — It\'s An Access List',
            'Manage Admins is a runtime-editable allowlist that SUPPLEMENTS the owner — trusted people can be granted admin access without a code deploy per grant/revoke. Owner-only to change; any admin can see this page.'),
        section('➕ Grant Admin',
            'Type a Discord user ID, then pick what they can access: specific `/manage` pages, or whole admin commands (`/manage`/`/bot`/`/autobuild`), or "all".\n' +
            '-# A granted admin can use the admin commands they were given — they can never edit this allowlist itself, even if granted "all".'),
        section('✏️ Edit Permissions / Revoke',
            'Live directly on each admin\'s own card (no search-by-ID modal needed) — **Edit Permissions** re-opens the same scoped picker Grant used; **Revoke** removes that person entirely, immediately, no second confirm.'),
        section('💡 Tip',
            'This list is separate from the one hardcoded owner ID — revoking or narrowing an admin here never affects the owner\'s own access.')
    ];
}

function announcementsSections() {
    return [
        section('📋 This Isn\'t A Bulk Paste Either — It\'s A Notice Feed',
            'Announcement posts a message every user sees (once) on their next command, until it expires. Each one is its own independent entry — posting a new one never touches the others.'),
        section('📝 Post New Announcement',
            'Write the message, then optionally set an expiry — defaults to **60 days**, or type your own number of days, or `never`. Submitting shows a **draft** exactly as players will get it, with its real expiry and start: **Post** sends it, **Edit** reopens the box, **Discard** drops it. Nothing goes out before Post.'),
        section('✏️ Edit / End Now / Delete',
            'Open one from the panel\'s **Open an announcement…** dropdown (or `/manage announcement announcement:`): its card shows it exactly as players get it. **Edit** re-opens its text and expiry, as a draft too. **End Now** stops it without deleting it (a scheduled one: **Cancel It**), so it moves to Expired. **Delete** asks you to confirm. Each result has **Revert**, which brings back the same announcement (nobody who saw it is shown it again).'),
        section('🔎 Expired and Search',
            '**Expired** lists every expired announcement, a page at a time; its card offers **Post Again** (Post New with its text filled in) and **Delete**. **Search** finds active, scheduled and expired ones by every word you type.')
    ];
}

const TOPIC_SECTIONS = {
    draws: drawsSections,
    quickadd: quickaddSections,
    calendar: calendarSections,
    loadouts: loadoutsSections,
    patchnotes: patchnotesSections,
    seasondraft: seasondraftSections,
    admins: adminsSections,
    announcements: announcementsSections
};

// Per-topic accent -- reuses each subsystem's own live PRESET_ACCENT rather than one flat guide color, so the guide visually matches whichever page opened it (same philosophy as manage.js's own PAGE_ACCENT map -- see .claude/rules/manage-panel.md).
const TOPIC_ACCENT = {
    draws: 7032445,       // Plum Fortune — draws.js's PRESET_ACCENT
    quickadd: 7032445,    // the Draws page's accent: Quick Add lives there
    calendar: 3821672,    // Slate Harbor — calendar.js's PRESET_ACCENT
    loadouts: 16725040,   // MP red, sampled from the Rank_7Legendary emoji (manage.js's PAGE_ACCENT.loadouts_mp)
    patchnotes: 15909424, // Patch Gold — patchnotes.js's PRESET_ACCENT
    seasondraft: 3821672, // Slate Harbor -- same family as Calendar (draft mirrors draws+calendar)
    admins: 2831409,       // #2b2d31 — manage.js's PANEL_ACCENT fallback (manageadmins has no PAGE_ACCENT entry of its own)
    announcements: 2831409 // #2b2d31 -- same PANEL_ACCENT fallback (announcement has no PAGE_ACCENT entry of its own)
};

function buildGuideContainer(topicKey) {
    const topics = topicDefs();
    const safeKey = TOPIC_SECTIONS[topicKey] ? topicKey : 'draws';
    const topic = topics.find(t => t.key === safeKey);
    const sections = TOPIC_SECTIONS[safeKey]();

    const components = [
        { type: 10, content: `# ${emojis.guide} Bulk Format Guide\n## ${topic.rawEmoji} ${topic.label}` },
        divider(),
        ...sections.flatMap((s, i) => i === 0 ? [s] : [divider(), s]),
        divider(),
        {
            type: 1,
            components: [{
                type: 3,
                custom_id: 'mng_guide_pick',
                placeholder: 'Switch guide topic...',
                options: topics.map(t => ({
                    label: t.label,
                    value: t.key,
                    description: t.description,
                    emoji: t.emoji || undefined,
                    default: t.key === safeKey
                }))
            }]
        }
    ];

    const containerPayload = {
        type: 17,
        accent_color: TOPIC_ACCENT[safeKey] || 0x2b2d31,
        components
    };
    return [containerPayload];
}

module.exports = { resolveGuideTopic, buildGuideContainer, topicDefs };
