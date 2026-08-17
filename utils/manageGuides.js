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
        { key: 'loadouts', label: 'Loadouts', description: 'MP/DMZ block paste format', rawEmoji: emojis.newDraws, emoji: emojis.parseEmoji(emojis.newDraws) },
        { key: 'patchnotes', label: 'Patch Notes', description: 'Release date, URLs, Additional Info', rawEmoji: emojis.patchNotes, emoji: emojis.parseEmoji(emojis.patchNotes) },
        { key: 'seasondraft', label: 'Next Season Draft', description: 'Same formats, staged instead of live', rawEmoji: emojis.calendar, emoji: emojis.parseEmoji(emojis.calendar) },
        { key: 'admins', label: 'Manage Admins', description: 'Granting/editing admin access', rawEmoji: emojis.serverSettings, emoji: emojis.parseEmoji(emojis.serverSettings) },
        { key: 'announcements', label: 'Announcement', description: 'Posting/editing bot-wide announcements', rawEmoji: emojis.mngInfo, emoji: emojis.parseEmoji(emojis.mngInfo) }
    ];
}

function section(heading, body) {
    return { type: 10, content: `### ${heading}\n${body}` };
}
function divider() {
    return { type: 14, spacing: 1, divider: true };
}

function drawsSections() {
    return [
        section('📋 Paste Skeleton',
            '`Title, [tier] Item 1, [tier] Item 2, ..., Thumbnail URL (optional), Date`\n' +
            '-# One draw per line. Comma-separated.'),
        section('🏷️ Tier Shorthand',
            `\`m\` ${emojis.mythic} Mythic · \`l\` ${emojis.legendary} Legendary · \`lg\` ${emojis.legacy} Legacy · \`e\` ${emojis.epic} Epic\n` +
            '-# Spell the tier out instead if you\'d rather (`mythic`, `legendary`, etc.) -- both work.\n' +
            '-# Start an item with `-# ` instead of a tier to add a free-text note (e.g. a collab callout) instead of a tiered item.'),
        section('✨ What Gets Auto-Formatted',
            '• **Title** and every **item name** → auto Title Case (acronyms like `FSS`/`AK`/`MP`/`BR` are preserved, hyphens/slashes capitalize each side independently).\n' +
            '• A `-# note` line is the one exception -- kept **exactly as typed**, never title-cased (it\'s free text, not an item name).\n' +
            '• **Thumbnail URL** is optional. Blank reuses a cached image for that draw automatically -- exact title match first, then a close/typo\'d match if nothing exact hits.\n' +
            '• **Date** is parsed as UTC-0 -- `July 15` or `July 15, 2026` both work; a date with its own comma is handled correctly.'),
        section('🖼️ Example',
            '**Paste this:**\n' +
            '```\nVoid Implosion Draw, l M4 - Void Implosion, e Dusk - Otherworld Ensemble, -# Girls Frontline Collab, July 15, URL.com/image.png\n```' +
            '\n**Renders as:**\n' +
            `**__Void Implosion Draw__**\n${emojis.legendary} **M4 - Void Implosion**\n${emojis.epic} **Dusk - Otherworld Ensemble**\n-# Girls Frontline Collab\n<t:0:f> (<t:0:R>)\n-# ^ timestamp shown is a placeholder -- yours renders with the real date you typed.`),
        section('💡 Tips',
            '• Use **Export** above to grab this exact format pre-filled with your real current data -- the fastest way to see a live, correct example.\n' +
            '• **Replace Multiple** upserts by title match (updates in place, inserts if new) -- anything you don\'t mention is left untouched. Use **Purge** for a full wipe.')
    ];
}

function calendarSections() {
    return [
        section('📋 Paste Skeleton',
            '`[d|p|e]•M/D - M/D | Event Title` or `[d|p|e]•M/D - All Season | Event Title`\n' +
            '-# Bullet-separated (a `•` character), NOT one-per-line -- this is what survives a copy-paste out of Notes.'),
        section('🏷️ Section Prefix',
            `\`d\` ${emojis.newDraws} Draws · \`p\` ${emojis.modes} Playlists & Modes · \`e\` ${emojis.events} Events\n` +
            '-# The prefix sits directly touching the bullet (`d•`, not `d •`).'),
        section('✨ What Gets Auto-Formatted',
            '• **Title** is kept **exactly as typed** -- NOT title-cased, since event names routinely carry acronyms (`MP`/`BR`/`DMZ`) that auto-casing would mangle.\n' +
            '• **Section prefix is optional.** Leave it off and the title is auto-classified by keyword -- words like "draw"/"mode"/"playlist"/"map", or a standalone `MP`/`BR`, route it automatically. Ambiguous titles (e.g. a bare map name) should keep the explicit prefix.\n' +
            '• `All Season` as the end date means the event runs until the Battle Pass ends -- shown as an open-ended range, no fixed end date stored.\n' +
            '• Dates are UTC-0.'),
        section('🖼️ Example',
            '**Paste this:**\n' +
            '```\nd•7/15 - 8/1 | Jupiter Cannon Draw•p•7/20 - All Season | Krai BR•e•7/18 - 7/25 | Anniversary Celebration\n```' +
            '\n**Renders as:** 3 entries, sorted onto their own pages -- "Jupiter Cannon Draw" under **Draws**, "Krai BR" under **Playlists & Modes** (open-ended, tied to the Battle Pass end), "Anniversary Celebration" under **Events**.'),
        section('💡 Tips',
            '• Use **Export** above to grab this exact format pre-filled with your real current data.\n' +
            '• **Replace Multiple** upserts by title, doesn\'t touch anything unmentioned. **Purge** for a full wipe.')
    ];
}

function loadoutsSections() {
    return [
        section('📋 Paste Skeleton',
            '`Weapon | Category | MP or DMZ | Build Name | Cloudinary Image Key | Gunsmith Code | Badges`\n`Attachment 1`\n`Attachment 2`\n`...`\n' +
            '-# One build per BLOCK (blank line between blocks). First line is the header, every line after it is one attachment.'),
        section('🏷️ Badges (comma-separated, optional)',
            '`meta` · `toxic` · `best` · `top5` (or any `topN`) · `bestclose` · `top3midlong` (rank + range combos for DMZ)'),
        section('✨ What Gets Auto-Formatted',
            '• **Mode** is force-set to whichever page/button you clicked (MP or DMZ) regardless of what\'s typed in that field -- a stray mismatched value can\'t misfile a loadout onto the wrong page.\n' +
            '• **Image Key** and **Gunsmith Code** are optional -- leave blank if not set yet.\n' +
            '• Attachment names are kept **exactly as typed** -- no auto-casing, since these must match the real in-game names precisely.'),
        section('🖼️ Example',
            '```\nBAL-27 | AR | MP | Aggro Build | BAL-27-1 | ABCD1234 | meta, top3\nMonolithic Suppressor\nFTAC Champion\n```'),
        section('💡 Tips',
            '• Use one of the **Export** options above to grab this exact format pre-filled with your real current data.\n' +
            '• See the "How Images Work" info block on this page for the full Cloudinary Image Key workflow.')
    ];
}

function patchnotesSections() {
    return [
        section('📋 This Page Isn\'t a Bulk Paste — Here\'s What Each Field Actually Does',
            'Patch Notes has no bulk-import format (nothing to paste multiple of) -- these are the 3 fields admins get confused by most.'),
        section('📅 Release Date',
            '`July 15` → midnight UTC, same as every other date field.\n' +
            '`July 15, 7:20 AM` → **this one field is different** -- the moment you add a time, it\'s read as **your own local clock** (`/settings`' + '\u2019s timezone), not UTC, then converted correctly. Every other date field in the bot ignores time-of-day entirely; this is the one exception.'),
        section('🔗 URLs 1 / URLs 2',
            'Each is 5 separate fields (image 1-5 / image 6-10), not one big paste. Blank = no image in that slot. Every submitted URL is auto re-hosted to Cloudinary so a dead source link never breaks the carousel later.'),
        section('⚔️ Additional Info — one weapon per line, comma-separated',
            'Typing `b:`/`n:`/`f:` ANYWHERE always swaps in the buff/nerf/fix icon -- that part always worked.\n' +
            '**The structured "ADDITIONAL CHANGES" layout is a SEPARATE, opt-in thing** that only turns on once a line starts with `#`. Same comma-delimited feel as the Draws/Calendar bulk formats: `#, then Weapon, then Attachment, then n:/b:/f: text` -- ONE weapon per line, a NEW LINE for the next weapon:\n' +
            '```\n# Fennec (DMZ only), Ultra Extended Mag, n: Ammo capacity reduced from 40 Rounds to 20 Rounds\n```\n' +
            `Renders as:\n### ADDITIONAL CHANGES\n__**Fennec (DMZ only)**__\nUltra Extended Mag\n> ${emojis.nerf} Ammo capacity reduced from 40 Rounds to 20 Rounds\n` +
            '-# How it\'s read: the first thing after `#` is the WEAPON name. Every comma-separated thing after that is a new ATTACHMENT — UNLESS it starts with `b:`/`n:`/`f:`, in which case it\'s a CHANGE under whichever attachment came right before it. A weapon can carry as many attachments/changes as you want on its one line; the NEXT weapon just needs its own new line.'),
        section('💡 Tip',
            'Not writing structured changes this patch? Just type a normal sentence -- no `#` needed, nothing forces the structured layout on you.')
    ];
}

function seasondraftSections() {
    return [
        section('📋 Same Formats As The Live Pages — Just Staged, Not Live',
            'Next Season Draft writes into a SEPARATE staging area (`seasonalDoc.draft`), completely isolated from what\'s currently public. Nothing here goes live until you press **Promote to Live**.'),
        section('🏷️ Draws / Calendar',
            'Identical paste formats to the live **Draws**/**Calendar** guides (see their own topics in this dropdown) -- same tier shorthand, same `d•`/`p•`/`e•` prefixes, same auto title-casing rules.'),
        section('📅 Titles & Deadlines',
            '`Title, End Date` on one line per deadline, e.g. `Battle Pass, August 28`.\n' +
            'Typing `TBD` as the date (case-insensitive) marks that deadline as **not yet announced** instead of parsing it as a real date -- shown as "TBD" and treated as running indefinitely until it\'s updated. Same rule as the live Season Titles & Deadlines modal.'),
        section('💡 Tips',
            '• Re-running Titles & Deadlines / Draws / Calendar just REPLACES the staged version -- fixing a typo is "paste it again," not "undo first."\n' +
            '• **Promote to Live** swaps title/deadlines/draws/calendar (and banner fields, if ever staged) onto the live document in one shot and snapshots the previous live state for **Undo**.')
    ];
}

function adminsSections() {
    return [
        section('📋 This Isn\'t A Bulk Paste Either — It\'s An Access List',
            'Manage Admins is a runtime-editable allowlist that SUPPLEMENTS the owner -- trusted people can be granted admin access without a code deploy per grant/revoke. Owner-only to change; any admin can see this page.'),
        section('➕ Grant Admin',
            'Type a Discord user ID, then pick what they can access: specific `/manage` pages, or whole admin commands (`/manage`/`/bot`/`/autobuild`), or "all".\n' +
            '-# A granted admin can use the admin commands they were given -- they can never edit this allowlist itself, even if granted "all".'),
        section('✏️ Edit Permissions / Revoke',
            'Live directly on each admin\'s own card (no search-by-ID modal needed) -- **Edit Permissions** re-opens the same scoped picker Grant used; **Revoke** removes that person entirely, immediately, no second confirm.'),
        section('💡 Tip',
            'This list is separate from the one hardcoded owner ID -- revoking or narrowing an admin here never affects the owner\'s own access.')
    ];
}

function announcementsSections() {
    return [
        section('📋 This Isn\'t A Bulk Paste Either — It\'s A Notice Feed',
            'Announcement posts a message every user sees (once) on their next command, until it expires. Each one is its own independent entry -- posting a new one never touches the others.'),
        section('📝 Post New Announcement',
            'Write the message, then optionally set an expiry -- defaults to **60 days**, or type your own number of days, or `never`.'),
        section('✏️ Edit / Delete',
            'Live directly on each announcement\'s own card, same as Manage Admins\' per-row buttons above -- **Edit** re-opens that announcement\'s text/expiry for changes, **Delete** removes it immediately, no second confirm.'),
        section('💡 Tip',
            'Only ACTIVE (non-expired) announcements are listed here -- an expired one has already stopped showing to users and drops off this list on its own.')
    ];
}

const TOPIC_SECTIONS = {
    draws: drawsSections,
    calendar: calendarSections,
    loadouts: loadoutsSections,
    patchnotes: patchnotesSections,
    seasondraft: seasondraftSections,
    admins: adminsSections,
    announcements: announcementsSections
};

// Per-topic accent -- reuses each subsystem's own live PRESET_ACCENT rather than one flat guide color, so the guide visually matches whichever page opened it (same philosophy as manage.js's own PAGE_ACCENT map -- see .claude/rules/manage-panel.md).
const TOPIC_ACCENT = {
    draws: 7032445,       // Plum Fortune -- draws.js's PRESET_ACCENT
    calendar: 3821672,    // Slate Harbor -- calendar.js's PRESET_ACCENT
    loadouts: 16725040,   // MP red, sampled from the Rank_7Legendary emoji (manage.js's PAGE_ACCENT.loadouts_mp)
    patchnotes: 15909424, // Patch Gold -- patchnotes.js's PRESET_ACCENT
    seasondraft: 3821672, // Slate Harbor -- same family as Calendar (draft mirrors draws+calendar)
    admins: 2831409,       // #2b2d31 -- manage.js's PANEL_ACCENT fallback (manageadmins has no PAGE_ACCENT entry of its own)
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
