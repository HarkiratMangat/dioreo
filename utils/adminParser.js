// utils/adminParser.js
const chrono = require('chrono-node');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
const { fuzzyMatch, normalizeForSearch } = require('./search');

// NOTE (fixed during review): the old implementation did `str.toLowerCase()` on the WHOLE string first, then re-capitalized only the character immediately following whitespace. Real bugs fell out of that: (1) an already-uppercase acronym like "FSS Hurricane" got globally lowercased first and only its "F"/"H" recapitalized, producing "Fss Hurricane"; (2) a parenthesized word like "(Operator)" has "(" — not a letter — as the character right after the space, so nothing got recapitalized and "operator" stayed lowercase inside the parens; (3) a HYPHENATED word like "Blood-Red" was treated as ONE whitespace-delimited token, so only its very first letter ("B") got capitalized and everything else — including the "R" in "Red" — got lowercased into "Blood-red". Fixed by additionally splitting each whitespace-delimited word on its own hyphens and running the same acronym-preserve-or-capitalize logic on each hyphen segment independently, so "Blood-Red" capitalizes both "Blood" AND "Red" instead of just the first.
function capitalizeSegment(segment) {
    const letters = segment.replace(/[^A-Za-z]/g, '');
    if (letters.length > 1 && letters === letters.toUpperCase()) return segment; // acronym, e.g. "FSS"
    return segment.replace(/^(\P{L}*)(\p{L})(.*)$/u, (_, lead, first, rest) => lead + first.toUpperCase() + rest.toLowerCase());
}

function toTitleCase(str) {
    return str.split(/(\s+)/).map(word => {
        if (/^\s*$/.test(word)) return word; // preserve whitespace runs as-is
        // Split on hyphens AND slashes (found live 2026-07-30 22:24 EDT: "Jupiter Cannon/Void Implosion Draw" came out "Jupiter Cannon/void Implosion Draw" -- "Cannon/Void" is one whitespace-delimited token with no hyphen, so it went through capitalizeSegment() as a single unit, which only capitalizes the FIRST letter of the whole token and lowercases everything after it, clobbering the "V" in "Void". Same fix shape as the hyphen case above: split each side of the separator into its own segment and capitalize them independently.
        return word.split(/([-/])/).map(part => (part === '-' || part === '/') ? part : capitalizeSegment(part)).join('');
    }).join('');
}

function resolveTier(shorthand) {
    const clean = shorthand.toLowerCase().trim();
    if (['m', 'mythic'].includes(clean)) return 'mythic';
    if (['l', 'leggy', 'legendary'].includes(clean)) return 'legendary';
    if (['lg', 'lega', 'legacy'].includes(clean)) return 'legacy';
    if (['e', 'epic'].includes(clean)) return 'epic';
    return toTitleCase(shorthand);
}

// Shared by parseBulkDrawList below AND handlers/manage.js's single add-draw/edit-draw modal handlers -- used to be copy-pasted verbatim in all three places. Matches the first word as the tier shorthand, the rest as the item name; falls back to 'epic' if there's no tier prefix at all.
function parseItemLine(itemStr) {
    const trimmed = itemStr.trim();
    // "-# comment" lines (2026-07-30 22:24 EDT) -- a free-text note attached to a draw's item list (e.g. "-# Character bundle only, no weapon this time"), rendered later as Discord subtext instead of a tiered item (see draws.js's buildDrawSections). Must be checked BEFORE the generic tier-shorthand parse below: "-#" doesn't match any known tier shorthand, so it used to fall through to resolveTier's toTitleCase() fallback and get stored as a nonsense tier, AND the comment text itself got title-cased like a weapon/character name, mangling it.
    if (/^-#\s*/.test(trimmed)) {
        return { tier: 'comment', name: trimmed.replace(/^-#\s*/, '') };
    }
    const match = itemStr.match(/^(\S+)\s+(.+)$/);
    if (match) {
        return { tier: resolveTier(match[1]), name: toTitleCase(match[2]) };
    }
    return { tier: 'epic', name: toTitleCase(itemStr) }; // Fallback
}

function parseAdminDate(dateStr) {
    const cleanStr = dateStr.trim();
    // NOTE (fixed during review — likely cause of the DMZ season-end time showing 1 hour off from the others): this previously let chrono parse using the HOST MACHINE's local system timezone, then reconstructed a "UTC midnight" from the local calendar day it landed on. That roundtrip is fragile — it depends on whatever timezone the bot's machine happens to be configured with, and can drift by an hour across DST boundaries. Passing { timezone: 0 } tells chrono to interpret the input AS IF it's already UTC-0, matching the actual admin workflow (dates are always typed in UTC-0), and removes any dependency on the host machine's local settings.
    const parsedResult = chrono.parseDate(cleanStr, new Date(), { timezone: 0 });
    // Returns null (not a "now" fallback) on unparseable input -- a typo like "TDB" used to silently become the literal current instant, which on 2026-07-31 landed almost exactly on Aug 1 00:00 UTC (Harkirat's local evening crossing the UTC day boundary) and read as a real, intentional date. Every caller must now treat null as "not a valid date" -- either leave the field untouched (same as blank input) or reject the submission, never write it silently.
    if (!parsedResult) return null;

    // Normalize to midnight UTC on the parsed calendar day — deadlines/events are date-only, no specific time-of-day is collected from the admin. Use the UTC getters here (not the local getters used previously) since parsedResult is already anchored in UTC.
    return new Date(Date.UTC(parsedResult.getUTCFullYear(), parsedResult.getUTCMonth(), parsedResult.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Patch notes' own release date/time parser -- unlike parseAdminDate above (draws/calendar/season end deadlines, always date-only, always UTC-0), Harkirat actually wants a real release TIME here, and per his own stated habit (2026-07-27 08:02 EDT) the two fields carry different implied timezones: a bare date ("July 22") is still typed in UTC-0 (same convention as everywhere else), but the MOMENT he also types a time ("2026-07-22, 7:20 AM") that time is his own local clock, not UTC -- he's never in the habit of hand-converting to UTC before typing a patch-notes time (per his own stated habit, confirmed directly with him during this fix). Detecting which case applies uses the same `isCertain('hour')` chrono-components check timestampHelper.js's generateTimestamps() already relies on for the same "was a time actually typed, or just inferred" distinction.
 *
 * `userTimezone` should be the admin's own UserPreference.timezone (see commands/settings.js) -- defaults to 'America/Toronto' to match every other timezone default in this codebase.
 */
function parseReleaseDateTime(dateStr, userTimezone = 'America/Toronto') {
    const cleanStr = dateStr.trim();
    const parseResults = chrono.parse(cleanStr, new Date());
    if (!parseResults || parseResults.length === 0) return new Date();

    const parsedComponents = parseResults[0].start;
    if (!parsedComponents.isCertain('hour')) {
        // No time typed -- same UTC-midnight, date-only convention as parseAdminDate. chrono.parse already matched cleanStr above, so parseAdminDate's own chrono.parseDate call practically always succeeds too; the `|| new Date()` is just a safety net, not the new bug's fallback.
        return parseAdminDate(cleanStr) || new Date();
    }

    // An input that CARRIES ITS OWN OFFSET is already an absolute instant -- return it untouched. 🔴 CI-only failure, fixed 2026-08-31: the reinterpretation below is correct for a human typing "July 22, 2026 7:20 AM" and WRONG for a stored ISO string like "2026-07-06T16:27:56.919Z". `.tz(tz, true)` keeps the wall clock as rendered in the SYSTEM timezone, so on a machine already set to userTimezone the two readings cancel and an ISO round-trips by luck. On a UTC host they do not: 16:27Z reads as 16:27, gets re-anchored to Toronto, and comes back 20:27Z -- a real four-hour shift of a published release time, since the GCP VM runs UTC while every local test ran in EDT. `scripts/portalPatchNotes.test.js` asserts the round-trip and passed locally for exactly that reason; only CI could see it. ⚠️ The NAIVE path below is already timezone-independent and must stay as it is -- verified 2026-08-31 under UTC, America/Toronto and Asia/Tokyo, all three returning 11:20Z for "July 22, 2026 7:20 AM" -- because chrono builds the naive Date in the system zone and dayjs reads it back in the same zone, so the two cancel. Do not "fix" it to match the branch above.
    if (parsedComponents.isCertain('timezoneOffset')) return parsedComponents.date();

    // A time was typed with no offset -- treat the literal date/time numbers as Harkirat's own local clock (userTimezone), then convert that wall-clock moment to its real UTC instant. `.tz(tz, true)` (keepLocalTime) re-anchors the exact Y/M/D H:M chrono extracted into userTimezone rather than reinterpreting whatever offset the initial naive parse assumed -- same pattern timestampHelper.js's generateTimestamps() already uses for user-facing /timestamp input.
    const localTarget = dayjs(parsedComponents.date()).tz(userTimezone, true);
    return localTarget.toDate();
}

/**
 * Parses a bulk comma-separated string into Draw objects for ONE category (New or Returning). Format: Title, [tier] Item 1, [tier] Item 2, Date, URL
 *
 * NOTE (redesigned during review): this used to parse both categories out of one combined modal, distinguishing them via a leading "n "/"r " prefix on each line (and replacing BOTH seasonalDoc.newDraws and seasonalDoc.returningDraws together on every submit). Split into two separate admin flows (/update > "Bulk Add New Draws" / "Bulk Add Returning Draws") so each one only ever touches its own array -- re-running the New Draws import to fix a typo no longer risks silently overwriting/reordering a Returning Draws list you weren't even touching. The per-line format is otherwise unchanged, just without the type-prefix token.
 */
// Detects whether the trailing comma field is actually a URL/Cloudinary key, or is actually the tail of the date (meaning no URL was given at all). Every date this bot's admin flows accept ("July 15", "August 5, 2026") contains a space; a URL or bare Cloudinary key never does. A bare 4-digit year ("2026", the comma-split tail of "July 16, 2026") also has no space, so it's excluded explicitly -- without that exclusion this would misread the year as a URL and leave the date one field short. See the Cloudinary-cache design-decision-log entry in CLAUDE.md for why the URL became optional here at all (2026-07-12).
function looksLikeUrlOrKey(field) {
    return !field.includes(' ') && !/^\d{4}$/.test(field);
}

function parseBulkDrawList(bulkText) {
    const lines = bulkText.split('\n').filter(line => line.trim().length > 0);
    const parsedDraws = [];

    for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 3) continue; // Skip malformed lines -- Title + at least 1 item + Date

        const title = toTitleCase(parts[0]);

        // URL is now OPTIONAL (2026-07-12, Cloudinary-cache feature) -- a blank/omitted URL means "reuse whatever's already cached for this draw name" (see utils/cloudinaryCache.js's resolveThumbnail), resolved later at save time in handlers/manage.js, not here. Only pop a trailing URL field if the last field actually looks like one.
        let url = null;
        if (parts.length > 1 && looksLikeUrlOrKey(parts[parts.length - 1])) {
            url = parts.pop();
        }

        // Extract Date (now the last remaining part)
        let dateStr = parts.pop();
        // Bulk entries are comma-delimited overall, so a date written as "July 16, 2026" itself gets sliced into two fields by the same split(',') above ("July 16" and "2026") -- without this, the bare year was silently dropped and misread as a leftover "item" instead of part of the date. If what we just popped is nothing but a 4-digit year, it's actually the tail of the previous field's date; merge them back into one string before parsing. (Requires `parts.length > 1` so we never eat into index 0, which is always the title.)
        if (/^\d{4}$/.test(dateStr) && parts.length > 1) {
            dateStr = `${parts.pop()}, ${dateStr}`;
        }
        const parsedDate = parseAdminDate(dateStr);
        if (!parsedDate) continue; // Unparseable date -- skip this line rather than import a wrong one

        // Extract Items (everything left in the middle)
        const items = parts.slice(1).map(parseItemLine);

        parsedDraws.push({
            title: title,
            date: parsedDate,
            // Null means "no URL given, resolve via Cloudinary cache lookup at save time" -- a bare Cloudinary key still gets expanded to a full URL here same as before; a real HTTP URL passes through untouched either way (resolveThumbnail re-uploads it into temp_draws/).
            thumbnailUrl: url ? (url.startsWith('http') ? url : `https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/${url}`) : null,
            items: items
        });
    }
    return parsedDraws;
}

/**
 * Parses bulk bullet-separated calendar event strings into Calendar Event objects. Expected format per entry: "M/D - M/D | Event Title" or "M/D - All Season | Event Title" Entries are bullet-separated ("• ") rather than newline-separated, since this is the format that survives when copy-pasting a bulleted list out of Notes/RTF documents (line breaks don't survive that copy, but the bullet characters do). Dates are assumed to be UTC-0, same as parseAdminDate.
 */
// Optional single-letter category prefix directly touching the bullet ("d•"/"p•"/"e•" -- draw/ playlist/event), added for the 3-section calendar redesign (2026-07-31 12:10 EDT) to match Harkirat's own convention from his calendar_bulk.txt reference paste. Still the highest-priority signal -- it's how an admin overrides the keyword guess below for a genuinely ambiguous title (Harkirat's own bulk file explicitly prefixes bare map names like "Krai BR" for exactly this). `g`/`m` added as input-only aliases for `p` (2026-08-22, click-test feedback) -- playlist/game-mode/mode all name the same section to an admin typing a bulk line, so all three are accepted on input. CALENDAR_CATEGORY_TO_PREFIX (below) is the OUTPUT map and deliberately keeps emitting the canonical `p` only -- aliases never change what Export writes.
const CALENDAR_CATEGORY_PREFIX = { d: 'draw', p: 'playlist', e: 'event', g: 'playlist', m: 'playlist' };
const CALENDAR_CATEGORY_TO_PREFIX = { draw: 'd', playlist: 'p', event: 'e' };

// Keyword-based fallback classification (added 2026-07-31 12:40/12:55 EDT, per Harkirat's explicit request to not have to prefix every line by hand -- then tightened the same session when he asked for real word-form handling: "draw" vs "draws", "gamemode" vs "game mode", etc). Only consulted when there's NO explicit prefix/typed category. Word-boundaried (`\b`) with optional plural suffixes rather than a plain .includes() -- a bare substring check would both MISS "Armories" against a literal "armory" keyword, and FALSE-POSITIVE on an unrelated word that merely contains one (e.g. "Roadmap Update" containing "map"). `gamemode` is the one deliberate exception: it's a single fused word with no natural boundary between "game" and "mode" to anchor `\bmodes?\b` on, so it needs its own unboundaried pattern. Checked in this order (draw, then playlist) because a title can plausibly contain both an event-ish and a draw-ish word; draw/playlist are the more specific signals, so they win, and "event" is never actually matched against -- it's just wherever nothing else hits, exactly as Harkirat asked ("otherwise just default unknown things to the event section").
const DRAW_KEYWORDS = [
    /\bdraws?\b/i,             // Draw, Draws
    /\barmor(?:y|ies|ed)?\b/i, // Armory, Armories, Armored
    // Matches BOTH the spelled-out word and the numeral -- fixed 2026-08-07 12:48 EDT after "Judgment Day: It Goes 2" (the numeral, the real in-game title format) silently missed this and fell through to the 'event' default, because the regex only ever matched "two" spelled out.
    /\bit goes (?:two|2)\b/i,
    /\bredux\b/i,
    /\bmythic drops?\b/i       // Mythic Drop, Mythic Drops
];
const PLAYLIST_KEYWORDS = [
    /\bmodes?\b/i,     // Mode, Modes ("MP Mode", "Game Mode" -- any spaced form)
    /gamemode/i,       // fused compound with no word boundary to anchor \bmodes?\b on
    /\bplaylists?\b/i, // Playlist, Playlists
    /\bmaps?\b/i,      // Map, Maps -- boundaried so "Roadmap"/"Mapping" don't false-positive
    // Standalone "MP"/"BR" (added 2026-07-31 13:05 EDT, Harkirat's direct correction -- "Krai BR" and "Rebirth Island BR" are unambiguous mode names to him even with no "mode"/"playlist" word at all, the same way "Nuketown MP" would be). Both are 2-letter tokens, so `\b` on both sides is load-bearing here specifically -- without it "MP"/"BR" would match as substrings of unrelated words constantly.
    /\bmp\b/i,
    /\bbr\b/i
];

function guessCalendarCategory(title) {
    const t = title || '';
    if (DRAW_KEYWORDS.some(re => re.test(t))) return 'draw';
    if (PLAYLIST_KEYWORDS.some(re => re.test(t))) return 'playlist';
    return 'event';
}

// Shared by the single add/edit calendar-event modals (handlers/manage.js) -- accepts a full word ("draw"/"playlist"/"event") or a single letter (d/p/e), case-insensitive. Blank/unrecognized falls through to the keyword guess above against `title` (2nd arg) instead of a flat 'event' default.
function normalizeCalendarCategory(raw, title) {
    const cleaned = (raw || '').trim().toLowerCase();
    if (!cleaned) return guessCalendarCategory(title);
    if (CALENDAR_CATEGORY_PREFIX[cleaned]) return CALENDAR_CATEGORY_PREFIX[cleaned];
    if (['draw', 'event', 'playlist'].includes(cleaned)) return cleaned;
    return guessCalendarCategory(title);
}

// Double-CP marker on a bulk-pasted calendar title (added 2026-08-22 19:47 EDT, Harkirat's direct syntax pick: "2x or (2x) or CP or 2xCP or 2X CP or basically anything along those lines at the end of a title. AND auto detect from title"). Two passes: strip a marker sitting at the very END of the title (pure metadata like a trailing "2x CP" that isn't part of the real event name); anything that doesn't strip cleanly (the marker is followed by more real title text, e.g. "...2x CP Sale") falls through to a same-wording ANYWHERE check that sets the flag WITHOUT touching the title, since "2x CP Sale" is plausibly the event's real name. "CP" is COD Points (CODM's premium currency) -- a spelled-out title ("2x COD Points Weekend") is accepted the same as the abbreviation. 🔴 BOTH a CP token AND a doubling indicator (2x/double/x2) are REQUIRED TOGETHER -- neither alone is enough, corrected twice live 2026-08-22 20:02-20:06 EDT after real CODM event names broke each looser version in turn: (1) bare "CP"/"COD Points" alone falsely matched real non-2x CP promotions ("CP Rebate Offer", "CP Cash Back Bonus", "CP Summer Sale" are real CP-related events that are NOT double-CP); (2) bare "2x" alone falsely matched CODM's OTHER 2x events that have nothing to do with CP ("2x XP", "2x Weapon XP", "Double Points" for a different point system entirely). A title needs BOTH tokens, adjacent to each other, to count -- see the test cases in scripts/calendarOps.test.js (or re-derive with parseBulkEvents) before loosening this again.
const CP_TOKEN = '(?:cp|cod\\s*points?)';
const DOUBLE_CP_TRAILING = new RegExp(`[\\s,]*[\\(\\[]?\\s*\\b(?:2\\s*x\\s*${CP_TOKEN}|${CP_TOKEN}\\s*x?\\s*2|double\\s*${CP_TOKEN})\\b\\s*[\\)\\]]?\\s*$`, 'i');
const DOUBLE_CP_ANYWHERE = new RegExp(`\\b(?:2\\s*x\\s*${CP_TOKEN}|${CP_TOKEN}\\s*x?\\s*2|double\\s*${CP_TOKEN})\\b`, 'i');

function extractDoubleCp(rawTitle) {
    const trailingMatch = rawTitle.match(DOUBLE_CP_TRAILING);
    if (trailingMatch) {
        const stripped = rawTitle.slice(0, trailingMatch.index).trim();
        // Guard against stripping a title down to nothing (a paste that's JUST "2x" with no real title) -- that's not a real marker on a real title, leave it alone and let it fail malformed-entry checks downstream the same way it would have before this feature existed.
        if (stripped) return { title: stripped, isDoubleCP: true };
    }
    if (DOUBLE_CP_ANYWHERE.test(rawTitle)) return { title: rawTitle, isDoubleCP: true };
    return { title: rawTitle, isDoubleCP: false };
}

// Shared by both bulk-entry grammars below (bulleted and bulletless) -- takes the already-isolated prefix letter (or undefined) and the entry's raw body text ("M/D - M/D | Title"), returns a finished event object or null for anything malformed. Pulled out 2026-08-22 19:47 EDT when the bulletless grammar was added, so there is exactly one place that knows how to turn "prefix + body" into an event, not two copies to keep in sync.
function buildCalendarEventFromParts(prefixChar, rawEntry) {
    const entry = (rawEntry || '').trim();
    if (!entry) return null;

    const pipeIndex = entry.indexOf('|');
    if (pipeIndex === -1) return null; // Skip malformed entries missing the "| Title" portion

    const dateRange = entry.slice(0, pipeIndex).trim();
    // Title is preserved EXACTLY as typed (no toTitleCase) — event names routinely include acronyms like "MP"/"BR"/"DMZ" that title-casing would mangle into "Mp"/"Br"/"Dmz". extractDoubleCp() may still strip a trailing marker token off the end -- that's metadata, not part of the real title, same reasoning.
    const { title, isDoubleCP } = extractDoubleCp(entry.slice(pipeIndex + 1).trim());
    // Explicit prefix wins; no prefix falls through to the keyword guess against the title.
    const category = CALENDAR_CATEGORY_PREFIX[prefixChar] || guessCalendarCategory(title);

    const dashIndex = dateRange.indexOf('-');
    if (dashIndex === -1) return null; // Skip malformed entries missing the "start - end" portion

    const startStr = dateRange.slice(0, dashIndex).trim();
    const endStr = dateRange.slice(dashIndex + 1).trim();

    const startDate = parseAdminDate(startStr);
    if (!startDate) return null; // Unparseable start date -- skip this entry rather than import a wrong one
    // "All Season" means the event runs through the rest of the season with no fixed end date
    const isOngoing = /all season/i.test(endStr);
    const endDate = isOngoing ? null : parseAdminDate(endStr);
    if (!isOngoing && !endDate) return null; // Unparseable end date -- same skip

    return { title, startDate, endDate, isOngoing, category, isDoubleCP };
}

// A literal '•' is an unambiguous delimiter in this format (per buildCalendarEventFromParts's own header comment: '•' never appears inside content), so line.split('•') always yields a clean, strictly alternating [prefixCandidate, body, prefixCandidate, body, ...] array -- no regex guessing required. The PREVIOUS implementation used a non-greedy lookahead regex ("[depgm]?•|$") that had to GUESS where a body ended, and a non-greedy engine always prefers the EARLIEST position that satisfies the lookahead -- so whenever a title's own last character happened to be one of d/p/e/g/m and was immediately followed by a real bullet, it silently swallowed that trailing letter as if it were the NEXT entry's optional prefix, truncating the title by one character (found live 2026-08-22 19:30 EDT, "Krai BR Mode" -> "Krai BR Mod"; see docs/db-deferred-list.md). Bulletless, newline-delimited entry (added 2026-08-22 19:47 EDT, Harkirat's direct pick -- "newline ends it", offered as an alternative to bullet-joined pastes rather than a replacement for them): prefix letter optionally followed by whitespace instead of a bullet ("p 8/6-8/19 | Krai BR").
const BARE_LINE = /^\s*(?:([depgm])\s+)?(.*)$/;

function parseBulkEvents(bulkText) {
    const parsedEvents = [];

    // Processed LINE BY LINE, deliberately -- a real bulleted paste out of Notes is always a single line (the whole reason entries are bullet-separated instead of newline-separated is that line breaks don't survive that copy), so scoping BULLETED_ENTRY to one line at a time reproduces the exact same result as the old whole-text scan for every real-world paste. What it FIXES: running the bulleted regex over the whole multi-line text let its own end-of-string fallback (`(?=[depgm]?•|$)`) swallow every bulletless line that happened to follow the last bulleted line on a LATER line into that last entry's title -- caught live testing a mixed paste (bulleted line, then several bare lines): "Anniversary Celebration" ate six trailing lines whole. Scoping per-line means each line's own `$` is that line's own end, never the rest of the document.
    for (const line of bulkText.split('\n')) {
        if (!line.trim()) continue;
        if (line.includes('•')) {
            // Pair the split output two at a time: even indices are the prefix candidate for the entry that follows (possibly '', meaning no explicit prefix), odd indices are that entry's body. A trailing unpaired fragment (an incomplete paste ending mid-bullet) is silently dropped by the `i + 1 < parts.length` bound, same as it would have been before.
            const parts = line.split('•');
            for (let i = 0; i + 1 < parts.length; i += 2) {
                const prefixChar = /^[depgm]$/.test(parts[i]) ? parts[i] : undefined;
                const built = buildCalendarEventFromParts(prefixChar, parts[i + 1]);
                if (built) parsedEvents.push(built);
            }
        } else {
            const lineMatch = line.match(BARE_LINE);
            const built = buildCalendarEventFromParts(lineMatch[1], lineMatch[2]);
            if (built) parsedEvents.push(built);
        }
    }

    return parsedEvents;
}

// Reverse of resolveTier's shorthand->full-word mapping, used to reconstruct the compact bulk-add tier token ("m"/"l"/"lg"/"e") from what's actually stored in the DB ("mythic"/"legendary"/ "legacy"/"epic"). `lg` was `ll` until 2026-07-31 17:20 EDT (Harkirat's direct request) -- changed here only, no back-compat kept for the old token, since it's purely an admin-typed shorthand with no stored data depending on it (the DB always stores the full word "legacy"). Falls back to the stored value itself for anything unrecognized (shouldn't happen from data that went through resolveTier, but keeps this from ever throwing). 'comment' isn't a real tier -- it's the free-text "-# note" item type (see parseItemLine below) -- but it goes through this same reverse map when reconstructing bulk-add/edit text, so it needs an entry too or a comment line round-trips back out as the literal word "comment" instead of "-#".
const TIER_SHORTHAND = { mythic: 'm', legendary: 'l', legacy: 'lg', epic: 'e', comment: '-#' };

/**
 * Reconstructs the bulk-add text format (see parseBulkDrawList) from Draw documents already in the database -- lets Harkirat re-export the current New/Returning Draws list as re-importable text (e.g. after losing his original notes-app source file), fix a typo in the resulting text, and paste it right back into the matching Bulk Add modal.
 */
function formatDrawsAsBulkText(draws) {
    return draws.map(draw => {
        const itemsStr = draw.items.map(item => `${TIER_SHORTHAND[item.tier] || item.tier} ${item.name}`).join(', ');
        const dateStr = dayjs.utc(draw.date).format('MMMM D, YYYY');
        return `${draw.title}, ${itemsStr}, ${dateStr}, ${draw.thumbnailUrl}`;
    }).join('\n');
}

// Formats a stored Date back into the same human-readable form parseAdminDate() accepts as input -- used to pre-fill modals that combine a title and a date on one line (e.g. /manage season titles-deadlines' "Battle Pass, August 28" fields) so re-submitting without touching a field round-trips cleanly instead of showing an ISO timestamp the admin would have to reformat by hand.
function formatAdminDate(date) {
    return date ? dayjs.utc(date).format('MMMM D, YYYY') : '';
}

// Reverse of parseReleaseDateTime -- pre-fills the patch-notes release_date field so reopening the modal and resubmitting without touching this field round-trips cleanly. A plain formatAdminDate() call would ALWAYS drop back to a date-only string, and since parseReleaseDateTime treats a date-only resubmit as "no time given" (falls back to UTC midnight), that would silently erase a previously-set release time the next time this modal was reopened for something unrelated (e.g. just fixing a typo in the description). Only prints a time-of-day at all when the stored instant isn't already exact UTC midnight -- a genuinely date-only entry still round-trips as a bare date.
function formatReleaseDateTime(date, userTimezone = 'America/Toronto') {
    if (!date) return '';
    const d = dayjs(date);
    const isExactUtcMidnight = d.utc().hour() === 0 && d.utc().minute() === 0 && d.utc().second() === 0 && d.utc().millisecond() === 0;
    if (isExactUtcMidnight) return d.utc().format('MMMM D, YYYY');
    return d.tz(userTimezone).format('MMMM D, YYYY h:mm A');
}

/**
 * Parses the loadout "badges" segment of /manage's "Category | Mode | Badges" modal field into `{ isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized }` (see models/Loadout.js). Comma- separated, case-insensitive, e.g. "meta, best" or "top3" or "top 5" or "" (no badges). Discord modals cap at 5 fields, and the loadout modal already uses all 5, so this rides along as a 3rd pipe-delimited segment on the existing "Category | Mode" field rather than getting its own input.
 *
 * NOTE (fixed during review): `categoryRank` used to only recognize the literal token "top3" -- typing "top 5" (a real ranking some weapons need, not every category caps out at exactly 3) silently matched nothing, with no feedback that it had been ignored. Now accepts any `topN` (with or without a space before the number), and anything that still doesn't match ends up in `unrecognized` so the caller (handlers/manage.js's add/edit-loadout handlers) can tell the admin exactly which token didn't take instead of the change just silently not applying.
 *
 * NOTE (added for DMZ range badges): `bestclose`/`bestmidlong`/`top{N}close`/`top{N}midlong` (no space before "close"/"midlong") map to `dmzRangeRank` instead of `categoryRank` -- /dmz has no per-category commands, so ranking by combat range role reads more meaningfully there than "Best in category". See buildBadgesLine() in utils/loadoutRender.js for how this renders.
 */
function parseLoadoutBadges(badgesStr) {
    const tokens = (badgesStr || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    let isMeta = false;
    let categoryRank = null;
    let dmzRangeRank = null;
    let isToxic = false;
    const unrecognized = [];

    for (const token of tokens) {
        if (token === 'meta') { isMeta = true; continue; }
        if (token === 'best') { categoryRank = 'best'; continue; }
        if (token === 'toxic') { isToxic = true; continue; }
        const rangeMatch = token.match(/^(best|top\s*\d+)(close|midlong)$/);
        if (rangeMatch) {
            const tier = rangeMatch[1].replace(/\s+/g, '');
            dmzRangeRank = `${tier}-${rangeMatch[2]}`;
            continue;
        }
        const topMatch = token.match(/^top\s*(\d+)$/);
        if (topMatch) { categoryRank = `top${topMatch[1]}`; continue; }
        unrecognized.push(token);
    }

    return { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized };
}

// Gunsmith-code structural corrector (added for /autobuild's vision-extraction pipeline) -- CODM Gunsmith share codes alternate Number-Letter-Number-Letter... for their full length (confirmed against a real shareCode already referenced in this codebase, manage.js's placeholder example "1I2C6B8A9D"). A vision model reading a small, low-contrast in-game font is expected to occasionally misread a character as its visual look-alike from the WRONG character class for its position (digit-shaped glyphs in letter slots, letter-shaped glyphs in digit slots), or with incorrect case (lowercase 'l' instead of uppercase 'I'). Position parity (even index = digit, odd index = letter) decides what type a position requires. Three distinct corrections apply: (1) actual type mismatches get snapped via look-alike maps (DIGIT_TO_LETTER, LETTER_TO_DIGIT), (2) lowercase letters in letter positions get case-normalized (uppercase directly, or via LOWERCASE_LETTER_CORRECTION for digit-like lowercase like 'l'→'I'), and (3) characters already the right type for their position are left untouched even if they visually resemble something else (an '8' correctly in a digit slot is never touched, even though '8' resembles 'B') -- this prevents speculative corrections from corrupting already-correct input.
const DIGIT_TO_LETTER = { '0': 'O', '1': 'I', '8': 'B', '5': 'S' };
const LETTER_TO_DIGIT = { O: '0', I: '1', L: '1', B: '8', S: '5' };
const LOWERCASE_LETTER_CORRECTION = { 'l': 'I', 'o': 'O' }; // digit-like lowercase letters in letter positions

// Weapon-name-prefix backstop (added 2026-07-20, real bug found live: Vertex AI extraction returned "Locus-1B2A4B8C9C" instead of "1B2A4B8C9C" -- the model prepended the weapon name even though the prompt (utils/visionExtract.js) never asked for it). Fixed primarily at the prompt level, but this is a structural backstop here too: a genuine code is a contiguous digit-letter-digit-letter... run, so scan for the LONGEST such run anywhere in the string and use only that, discarding anything before/after it (a weapon name prefix, stray punctuation, etc). Safe against false positives from a weapon name itself -- a name needs its own digits and letters to alternate perfectly for several characters running (e.g. "AK117" fails immediately: '1','1' are two digits in a row, never two letters interleaved), which real weapon names don't do. A code with no prefix at all (the normal case) matches itself in full, so this is a no-op for already-clean input.
function stripCodePrefix(code) {
    const runs = code.match(/\d[A-Za-z](?:\d[A-Za-z])*\d?/g);
    if (!runs || runs.length === 0) return code; // nothing alternating found -- leave as-is, let the per-char corrector below do what it can
    return runs.reduce((longest, run) => run.length > longest.length ? run : longest, runs[0]);
}

function correctGunsmithCode(code) {
    if (!code) return code;
    code = stripCodePrefix(code);
    return code.split('').map((ch, i) => {
        const expectDigit = i % 2 === 0; // position 0,2,4,... = digit; 1,3,5,... = letter
        if (expectDigit && /[A-Za-z]/.test(ch)) {
            return LETTER_TO_DIGIT[ch.toUpperCase()] || ch; // no known look-alike -- leave as-is
        }
        if (!expectDigit && /[0-9]/.test(ch)) {
            return DIGIT_TO_LETTER[ch] || ch;
        }
        // Normalize lowercase letters to uppercase in letter positions (Gunsmith codes use uppercase); digit-like lowercase letters have specific uppercase mappings.
        if (!expectDigit && /[a-z]/.test(ch)) {
            return LOWERCASE_LETTER_CORRECTION[ch] || ch.toUpperCase();
        }
        return ch; // already the right type for its position -- untouched
    }).join('');
}

// Fuzzy-corrects one vision-extracted attachment name against the set of attachment strings already used somewhere in the Loadout collection -- a vision model reading a small in-game label can get spacing/punctuation/capitalization slightly wrong ("Gauge-9 Mo" for "Gauge-9 Mono") even when it got the actual attachment right. Checks for an exact normalized match first (cheapest, most common case once the model gets it basically right), then falls back to a two-directional fuzzyMatch scan (either string could be the "noisier" one depending on what the model added or dropped) so a real but imperfect read still resolves to the canonical stored spelling. No match at all -- likely a genuinely new attachment CODM just added -- passes the extracted text through untouched rather than forcing it onto something wrong.
function correctAttachmentName(extracted, knownAttachments) {
    if (!extracted) return extracted;
    const normalizedExtracted = normalizeForSearch(extracted);

    const exact = knownAttachments.find(known => normalizeForSearch(known) === normalizedExtracted);
    if (exact) return exact;

    const fuzzy = knownAttachments.find(known => fuzzyMatch(extracted, known) || fuzzyMatch(known, extracted));
    return fuzzy || extracted;
}

// Weapon-name normalizer for /autobuild (added 2026-07-21, live v2 testing). Two jobs:
//  (1) Strip a cosmetic SKIN/blueprint name. In CODM's Gunsmith the base weapon (e.g. "R9-0") is what
//      identifies a build, but the screen also shows the equipped skin's stylized title ("R9-0 -
//      Death's Voice"), which the vision model tends to grab. Skin names are appended after a SPACED
//      separator (" - " / " – " / " — "); base weapon names use UNspaced hyphens (R9-0, CX-9, DR-H,
//      L-CAR 9), so cutting at the first spaced dash/em-dash drops the skin without touching a
//      hyphenated base name. The prompt (utils/visionExtract.js) is the primary fix; this is a
//      structural backstop, same pattern as stripCodePrefix() for the gunsmith code.
//  (2) Uppercase + collapse whitespace, so a title-cased read ("Machine Pistol") is stored as
//      "MACHINE PISTOL" -- matching the all-caps convention every migrated weaponName already uses
//      (a title-cased autobuild entry showed up out of place in /manage's disambiguation dropdown).
//      weaponKey is case-insensitive and imageKey is uppercased downstream (loadoutRender.js's
//      computeWeaponKeyAndBuild), so this only fixes the stored DISPLAY value -- but the skin strip in
//      (1) genuinely fixes the key/imageKey too.
function normalizeWeaponName(raw) {
    if (!raw) return raw;
    const base = String(raw).trim().replace(/\s+[-–—]\s+.*$/, '').trim();
    return base.toUpperCase().replace(/\s+/g, ' ');
}

// Canonical CODM Gunsmith slot order, used to display a build's attachments consistently regardless of the order the vision model happened to read them in (Harkirat's request, 2026-07-21). Only applies where per-slot labels exist -- i.e. /autobuild extractions; builds stored before this (plain-string attachments, no slot labels) keep their original entry order until a separate reorder pass.
const CANONICAL_SLOT_ORDER = ['optic', 'muzzle', 'barrel', 'stock', 'laser', 'underbarrel', 'trigger action', 'rear grip', 'ammunition', 'perk'];
// Slot-label variants the vision model (or the game) might use, normalized to the canonical labels above.
const SLOT_ALIASES = { sight: 'optic', 'under barrel': 'underbarrel', ammo: 'ammunition', 'rear_grip': 'rear grip', grip: 'rear grip', 'trigger_action': 'trigger action' };
function canonicalSlot(slot) {
    const s = (slot || '').toLowerCase().trim();
    return SLOT_ALIASES[s] || s;
}
function slotRank(slot) {
    const idx = CANONICAL_SLOT_ORDER.indexOf(canonicalSlot(slot));
    return idx === -1 ? CANONICAL_SLOT_ORDER.length : idx; // unknown/blank slots sort to the end
}
// Reorders parallel attachments[] / slots[] arrays into CANONICAL_SLOT_ORDER. Stable: entries with the same rank (or unknown slots) keep their relative order. Returns new aligned arrays.
function orderAttachmentsBySlot(attachments, slots) {
    const rows = (attachments || []).map((name, i) => ({ name, slot: (slots || [])[i] || '', i }));
    rows.sort((a, b) => slotRank(a.slot) - slotRank(b.slot) || a.i - b.i);
    return { attachments: rows.map(r => r.name), slots: rows.map(r => r.slot) };
}

// Cloudinary placeholder used elsewhere for loadouts that don't have a real screenshot yet (see scripts/createPlaceholderLoadouts.js) — reused here as the bulk-add default when a block omits the image key, so a bulk submission is never blocked on having every image ready up front.
const PLACEHOLDER_IMAGE = 'https://placehold.co/1024x576/1a1a1a/e5e5e5?text=Coming+Soon';

/**
 * Parses /manage loadouts bulk-add's paragraph field into loadout-ready objects. One loadout per block, blocks separated by a blank line:
 *
 *   Weapon | Category
 *   Build: Aggressive Flex
 *   Image: BAL-27-1
 *   Code: 1I2C6B8A9D
 *   Badges: meta, best
 *   - Gauge-9 Mono
 *   - Crown-H3 Barrel
 *
 * ⚠️ FORMAT REDESIGNED 2026-08-22 (Harkirat: "why are some things in 1 line, while other things are in their own lines... there's no intuitiveness to its structure at all"). The old shape was ONE line of seven positional pipe segments (`Weapon | Category | Mode | Build | Image | Code | Badges`) followed by bare attachment lines -- four of the seven were optional, their order was unmemorable, and one of them did nothing at all (see the Mode note below). There is now a single stated principle: **the first line is the weapon's IDENTITY, every optional field gets its own `Key: value` line, and everything else is an attachment.** Key lines may appear in any order and any of them may be omitted entirely. Attachments may be bulleted (`-`, `•`, `*`) or bare -- a bullet is checked FIRST, which doubles as the escape hatch for an attachment name that would otherwise read as a `Key:` line.
 *
 * ⚠️ THE OLD PIPE FORMAT IS DELIBERATELY REJECTED, not quietly accepted (Harkirat's explicit call: no back-compat). A header line carrying more than two pipe segments produces an error naming the new shape, so an old export file fails LOUDLY instead of half-parsing -- under the old positional reading, `Weapon | Category | Mode | Build` would have silently become a weapon named "Weapon" in category "Category" with the remaining fields dropped.
 *
 * ⚠️ MODE IS GONE FROM THIS FORMAT, and that is a BUG FIX rather than a feature removal. It used to be REQUIRED as pipe-segment 3 -- a block omitting it was rejected outright -- while core/ops/loadouts.js's upsertBulkBlocks does `{ ...rawEntry, mode }` and overwrites it with the page's own mode unconditionally. Verified live 2026-08-22: a block typed `DMZ` pasted into the MP page parsed with ZERO errors and saved as MP, and formatLoadoutsAsBulkText emitted that same Mode, so exporting DMZ builds and pasting them on the MP page silently reassigned every one of them. So the parser demanded a field whose value it then threw away, and the exporter round-tripped a value that could not survive the trip. Which page the modal was opened from is the only thing that has ever decided the mode; the format now says so by not asking.
 *
 * A block missing its Weapon/Category header, carrying an unrecognized `Key:`, or with no attachment lines at all doesn't silently vanish -- it's collected in `errors` (with a snippet of the offending block) so the admin is told exactly what didn't parse, same as parseLoadoutBadges()'s `unrecognized` reporting.
 */
const LOADOUT_BLOCK_KEYS = { build: 'buildName', image: 'imageKey', code: 'shareCode', badges: 'badges' };
// A `Key: value` line. Deliberately NARROW (a letter, then at most 13 more letters/spaces, then the colon) so a real attachment name can't be swallowed as a mistyped field -- and the bullet test below runs first regardless, so `- Ammo: 40 Round` is always an attachment no matter what precedes the colon.
const LOADOUT_KEYED_LINE = /^([A-Za-z][A-Za-z ]{0,13})\s*:\s*(.*)$/;
const LOADOUT_BULLET = /^[-•*]\s+/;

function parseBulkLoadoutList(bulkText) {
    const blocks = bulkText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const parsed = [];
    const errors = [];

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        const headerLine = lines[0];
        const snippet = headerLine.length > 60 ? `${headerLine.slice(0, 60)}...` : headerLine;

        // Trailing EMPTY segments are dropped before the length test -- a half-typed `BAL-27 | AR |` (and the muscle memory of the old seven-segment format, which ended in optional empties) would otherwise be diagnosed as "the OLD pipe format" when it is really just a stray pipe. Found in the audit pass, not in testing: the guidance that followed was still correct, so nobody would have been misled into a wrong save, but being told you are using a retired format when you made a typo is its own kind of wrong.
        const headerParts = headerLine.split('|').map(p => p.trim());
        while (headerParts.length > 2 && headerParts[headerParts.length - 1] === '') headerParts.pop();
        if (headerParts.length > 2) {
            errors.push(`"${snippet}" -- that looks like the OLD pipe format. The first line is now just "Weapon | Category"; Build, Image, Code and Badges each go on their own line below it (e.g. "Build: Aggressive Flex").`);
            continue;
        }
        const [weaponName, categoryRaw] = headerParts;
        if (!weaponName || !categoryRaw) {
            errors.push(`"${snippet}" -- a block's first line must be "Weapon | Category", and both halves are required.`);
            continue;
        }

        const fields = {};
        const attachments = [];
        let badKey = null;
        for (const line of lines.slice(1)) {
            if (LOADOUT_BULLET.test(line)) { attachments.push(line.replace(LOADOUT_BULLET, '').trim()); continue; }
            const keyed = LOADOUT_KEYED_LINE.exec(line);
            if (!keyed) { attachments.push(line); continue; }
            const key = keyed[1].trim().toLowerCase();
            // A typo'd key must NOT fall through into `attachments` -- "Buld: Aggressive Flex" quietly becoming an attachment named "Buld: Aggressive Flex" is precisely the silent-wrong-result this format redesign exists to remove.
            if (!Object.prototype.hasOwnProperty.call(LOADOUT_BLOCK_KEYS, key)) { badKey = keyed[1].trim(); break; }
            fields[LOADOUT_BLOCK_KEYS[key]] = keyed[2].trim();
        }
        if (badKey) {
            errors.push(`"${snippet}" -- unrecognized field "${badKey}:". Valid fields are Build, Image, Code and Badges; an attachment whose name contains a colon needs a leading "- " bullet.`);
            continue;
        }

        const cleanAttachments = attachments.filter(Boolean);
        if (cleanAttachments.length === 0) {
            errors.push(`"${snippet}" -- no attachment lines found under the header`);
            continue;
        }

        const { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized } = parseLoadoutBadges(fields.badges);
        if (unrecognized.length > 0) {
            errors.push(`"${snippet}" -- unrecognized badge token(s): ${unrecognized.join(', ')} (loadout still saved, just without these)`);
        }

        // No `mode` here, deliberately -- see the Mode note in this function's docblock. core/ops/loadouts.js's upsertBulkBlocks supplies it from the page.
        parsed.push({
            weaponName,
            weaponKey: weaponName.toLowerCase().replace(/\s+/g, ''),
            category: categoryRaw.toUpperCase(),
            buildName: fields.buildName || 'Standard Build',
            attachments: cleanAttachments,
            imageKey: fields.imageKey || PLACEHOLDER_IMAGE,
            shareCode: fields.shareCode || '',
            isMeta,
            categoryRank,
            dmzRangeRank,
            isToxic
        });
    }

    return { parsed, errors };
}

/**
 * Splits a "Title, End Date" line on the LAST comma -- used by /manage season's combined titles-deadlines modal, where each of the 3 deadline fields carries both a title and a date on one line (e.g. "Battle Pass, August 28"). Splitting on the last comma (not the first) means a title that happens to contain a comma still parses correctly, since the date is always the trailing segment. Returns { title, dateStr } -- either can be empty if the line itself is blank, letting the caller leave that field's existing value untouched (same partial-update convention as the old "Edit Season Deadlines" modal).
 */
function splitTitleDate(line) {
    const trimmed = (line || '').trim();
    if (!trimmed) return { title: '', dateStr: '' };

    const lastComma = trimmed.lastIndexOf(',');
    if (lastComma === -1) return { title: trimmed, dateStr: '' };

    return {
        title: trimmed.slice(0, lastComma).trim(),
        dateStr: trimmed.slice(lastComma + 1).trim()
    };
}

/**
 * Reverse of parseBulkEvents -- reconstructs the bullet-separated "M/D - M/D | Title" bulk-import text from Calendar subdocuments already in the database, so /export can hand back text that pastes right back into /manage's calendar Bulk Add modal (same round-trip purpose as formatDrawsAsBulkText above, just for the calendar's own format).
 */
function formatCalendarAsBulkText(calendar) {
    return calendar.map(event => {
        const startStr = dayjs.utc(event.date).format('M/D');
        const endStr = event.isOngoing ? 'All Season' : dayjs.utc(event.endDate).format('M/D');
        const prefix = CALENDAR_CATEGORY_TO_PREFIX[event.category] || 'e';
        return `${prefix}• ${startStr} - ${endStr} | ${event.title}`;
    }).join('\n');
}

/**
 * Plain re-postable export of patch note entries -- NOT a true bulk-import format, since patch notes have no bulk-add flow to paste this back into (only single add/edit exists). Just a readable one-entry-per-block dump (title/release date/description/URLs) for reference or to manually re-type into the single-add modal, per Harkirat's call when /export was split out (2026-07-09) rather than inventing a bulk-patch-notes format that doesn't otherwise exist yet.
 */
function formatPatchNotesAsText(patchNotes) {
    return patchNotes.map(patch => {
        const lines = [
            `Title: ${patch.title}`,
            `Release Date: ${formatAdminDate(patch.releaseDate)}`,
            `Description: ${patch.description && patch.description.trim() ? patch.description : '(none)'}`,
            `URLs:`,
            ...patch.images
        ];
        return lines.join('\n');
    }).join('\n\n---\n\n');
}

/**
 * Bulk-import-compatible export of loadouts -- round-trips straight back into parseBulkLoadoutList()'s labelled-block format (see that function for the format itself and for why it changed on 2026-08-22). An optional field with no value is OMITTED rather than emitted empty: a trailing `Code:` with nothing after it is exactly the noise the redesign set out to delete, and the old format's `... | | meta` gap was the same problem in pipe form. Mode is deliberately NOT emitted -- the page a paste lands on decides it, and emitting it used to let a DMZ export silently reassign itself to MP. Badge reconstruction mirrors manage.js's buildEditLoadoutModal (dmzRangeRank is stored hyphenated -- "best-close" -- but the parser's token format has no hyphen, so it's stripped back out here too).
 */
function formatLoadoutsAsBulkText(loadouts) {
    return loadouts.map(l => {
        const badges = [
            l.isMeta ? 'meta' : null,
            l.categoryRank,
            l.dmzRangeRank ? l.dmzRangeRank.replace('-', '') : null,
            l.isToxic ? 'toxic' : null
        ].filter(Boolean).join(', ');
        const lines = [`${l.weaponName} | ${l.category}`];
        if (l.buildName) lines.push(`Build: ${l.buildName}`);
        // A raw-URL imageKey is a legitimate stored state (see loadoutRender.js's buildImageUrl) but re-importing one would only re-save the same external URL, so only a real Cloudinary key round-trips.
        if (l.imageKey && !String(l.imageKey).startsWith('http')) lines.push(`Image: ${l.imageKey}`);
        if (l.shareCode) lines.push(`Code: ${l.shareCode}`);
        if (badges) lines.push(`Badges: ${badges}`);
        lines.push(...(l.attachments || []).map(a => `- ${a}`));
        return lines.join('\n');
    }).join('\n\n');
}

module.exports = { toTitleCase, resolveTier, parseAdminDate, parseReleaseDateTime, parseItemLine, parseBulkDrawList, parseBulkEvents, formatDrawsAsBulkText, formatAdminDate, formatReleaseDateTime, parseLoadoutBadges, parseBulkLoadoutList, splitTitleDate, formatCalendarAsBulkText, formatPatchNotesAsText, formatLoadoutsAsBulkText, correctGunsmithCode, correctAttachmentName, normalizeWeaponName, orderAttachmentsBySlot, normalizeCalendarCategory, guessCalendarCategory };