// utils/adminParser.js
const chrono = require('chrono-node');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);

// NOTE (fixed during review): the old implementation did `str.toLowerCase()` on the WHOLE string
// first, then re-capitalized only the character immediately following whitespace. Real bugs fell
// out of that: (1) an already-uppercase acronym like "FSS Hurricane" got globally lowercased first
// and only its "F"/"H" recapitalized, producing "Fss Hurricane"; (2) a parenthesized word like
// "(Operator)" has "(" — not a letter — as the character right after the space, so nothing got
// recapitalized and "operator" stayed lowercase inside the parens; (3) a HYPHENATED word like
// "Blood-Red" was treated as ONE whitespace-delimited token, so only its very first letter ("B")
// got capitalized and everything else — including the "R" in "Red" — got lowercased into
// "Blood-red". Fixed by additionally splitting each whitespace-delimited word on its own hyphens
// and running the same acronym-preserve-or-capitalize logic on each hyphen segment independently,
// so "Blood-Red" capitalizes both "Blood" AND "Red" instead of just the first.
function capitalizeSegment(segment) {
    const letters = segment.replace(/[^A-Za-z]/g, '');
    if (letters.length > 1 && letters === letters.toUpperCase()) return segment; // acronym, e.g. "FSS"
    return segment.replace(/^(\P{L}*)(\p{L})(.*)$/u, (_, lead, first, rest) => lead + first.toUpperCase() + rest.toLowerCase());
}

function toTitleCase(str) {
    return str.split(/(\s+)/).map(word => {
        if (/^\s*$/.test(word)) return word; // preserve whitespace runs as-is
        return word.split(/(-)/).map(part => part === '-' ? part : capitalizeSegment(part)).join('');
    }).join('');
}

function resolveTier(shorthand) {
    const clean = shorthand.toLowerCase().trim();
    if (['m', 'mythic'].includes(clean)) return 'mythic';
    if (['l', 'leggy', 'legendary'].includes(clean)) return 'legendary';
    if (['ll', 'lega', 'legacy'].includes(clean)) return 'legacy';
    if (['e', 'epic'].includes(clean)) return 'epic';
    return toTitleCase(shorthand);
}

// Shared by parseBulkDrawList below AND index.js's single add-draw/edit-draw modal handlers --
// used to be copy-pasted verbatim in all three places. Matches the first word as the tier
// shorthand, the rest as the item name; falls back to 'epic' if there's no tier prefix at all.
function parseItemLine(itemStr) {
    const match = itemStr.match(/^(\S+)\s+(.+)$/);
    if (match) {
        return { tier: resolveTier(match[1]), name: toTitleCase(match[2]) };
    }
    return { tier: 'epic', name: toTitleCase(itemStr) }; // Fallback
}

function parseAdminDate(dateStr) {
    const cleanStr = dateStr.trim();
    // NOTE (fixed during review — likely cause of the DMZ season-end time showing 1 hour off from
    // the others): this previously let chrono parse using the HOST MACHINE's local system timezone,
    // then reconstructed a "UTC midnight" from the local calendar day it landed on. That roundtrip
    // is fragile — it depends on whatever timezone the bot's machine happens to be configured with,
    // and can drift by an hour across DST boundaries. Passing { timezone: 0 } tells chrono to
    // interpret the input AS IF it's already UTC-0, matching the actual admin workflow (dates are
    // always typed in UTC-0), and removes any dependency on the host machine's local settings.
    const parsedResult = chrono.parseDate(cleanStr, new Date(), { timezone: 0 });
    if (!parsedResult) return new Date();

    // Normalize to midnight UTC on the parsed calendar day — deadlines/events are date-only,
    // no specific time-of-day is collected from the admin. Use the UTC getters here (not the
    // local getters used previously) since parsedResult is already anchored in UTC.
    return new Date(Date.UTC(parsedResult.getUTCFullYear(), parsedResult.getUTCMonth(), parsedResult.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Parses a bulk comma-separated string into Draw objects for ONE category (New or Returning).
 * Format: Title, [tier] Item 1, [tier] Item 2, Date, URL
 *
 * NOTE (redesigned during review): this used to parse both categories out of one combined modal,
 * distinguishing them via a leading "n "/"r " prefix on each line (and replacing BOTH
 * seasonalDoc.newDraws and seasonalDoc.returningDraws together on every submit). Split into two
 * separate admin flows (/update > "Bulk Add New Draws" / "Bulk Add Returning Draws") so each one
 * only ever touches its own array -- re-running the New Draws import to fix a typo no longer risks
 * silently overwriting/reordering a Returning Draws list you weren't even touching. The per-line
 * format is otherwise unchanged, just without the type-prefix token.
 */
function parseBulkDrawList(bulkText) {
    const lines = bulkText.split('\n').filter(line => line.trim().length > 0);
    const parsedDraws = [];

    for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 4) continue; // Skip malformed lines

        const title = toTitleCase(parts[0]);

        // Extract URL and Date (Last two parts)
        const url = parts.pop();
        let dateStr = parts.pop();
        // Bulk entries are comma-delimited overall, so a date written as "July 16, 2026" itself
        // gets sliced into two fields by the same split(',') above ("July 16" and "2026") -- without
        // this, the bare year was silently dropped and misread as a leftover "item" instead of part
        // of the date. If what we just popped is nothing but a 4-digit year, it's actually the tail
        // of the previous field's date; merge them back into one string before parsing. (Requires
        // `parts.length > 1` so we never eat into index 0, which is always the title.)
        if (/^\d{4}$/.test(dateStr) && parts.length > 1) {
            dateStr = `${parts.pop()}, ${dateStr}`;
        }
        const parsedDate = parseAdminDate(dateStr);

        // Extract Items (everything left in the middle)
        const items = parts.slice(1).map(parseItemLine);

        parsedDraws.push({
            title: title,
            date: parsedDate,
            thumbnailUrl: url.startsWith('http') ? url : `https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/${url}`,
            items: items
        });
    }
    return parsedDraws;
}

/**
 * Parses bulk bullet-separated calendar event strings into Calendar Event objects.
 * Expected format per entry: "M/D - M/D | Event Title" or "M/D - All Season | Event Title"
 * Entries are bullet-separated ("• ") rather than newline-separated, since this is the format
 * that survives when copy-pasting a bulleted list out of Notes/RTF documents (line breaks don't
 * survive that copy, but the bullet characters do).
 * Dates are assumed to be UTC-0, same as parseAdminDate.
 */
function parseBulkEvents(bulkText) {
    const entries = bulkText.split('•').map(e => e.trim()).filter(e => e.length > 0);
    const parsedEvents = [];

    for (const entry of entries) {
        const pipeIndex = entry.indexOf('|');
        if (pipeIndex === -1) continue; // Skip malformed entries missing the "| Title" portion

        const dateRange = entry.slice(0, pipeIndex).trim();
        // Title is preserved EXACTLY as typed (no toTitleCase) — event names routinely include
        // acronyms like "MP"/"BR"/"DMZ" that title-casing would mangle into "Mp"/"Br"/"Dmz".
        const title = entry.slice(pipeIndex + 1).trim();

        const dashIndex = dateRange.indexOf('-');
        if (dashIndex === -1) continue; // Skip malformed entries missing the "start - end" portion

        const startStr = dateRange.slice(0, dashIndex).trim();
        const endStr = dateRange.slice(dashIndex + 1).trim();

        const startDate = parseAdminDate(startStr);
        // "All Season" means the event runs through the rest of the season with no fixed end date
        const isOngoing = /all season/i.test(endStr);
        const endDate = isOngoing ? null : parseAdminDate(endStr);

        parsedEvents.push({ title, startDate, endDate, isOngoing });
    }

    return parsedEvents;
}

// Reverse of resolveTier's shorthand->full-word mapping, used to reconstruct the compact bulk-add
// tier token ("m"/"l"/"ll"/"e") from what's actually stored in the DB ("mythic"/"legendary"/
// "legacy"/"epic"). Falls back to the stored value itself for anything unrecognized (shouldn't
// happen from data that went through resolveTier, but keeps this from ever throwing).
const TIER_SHORTHAND = { mythic: 'm', legendary: 'l', legacy: 'll', epic: 'e' };

/**
 * Reconstructs the bulk-add text format (see parseBulkDrawList) from Draw documents already in
 * the database -- lets Harkirat re-export the current New/Returning Draws list as re-importable
 * text (e.g. after losing his original notes-app source file), fix a typo in the resulting text,
 * and paste it right back into the matching Bulk Add modal.
 */
function formatDrawsAsBulkText(draws) {
    return draws.map(draw => {
        const itemsStr = draw.items.map(item => `${TIER_SHORTHAND[item.tier] || item.tier} ${item.name}`).join(', ');
        const dateStr = dayjs.utc(draw.date).format('MMMM D, YYYY');
        return `${draw.title}, ${itemsStr}, ${dateStr}, ${draw.thumbnailUrl}`;
    }).join('\n');
}

/**
 * Parses the loadout "badges" segment of /manage's "Category | Mode | Badges" modal field into
 * `{ isMeta, categoryRank, unrecognized }` (see models/Loadout.js). Comma-separated, case-
 * insensitive, e.g. "meta, best" or "top3" or "top 5" or "" (no badges). Discord modals cap at 5
 * fields, and the loadout modal already uses all 5, so this rides along as a 3rd pipe-delimited
 * segment on the existing "Category | Mode" field rather than getting its own input.
 *
 * NOTE (fixed during review): `categoryRank` used to only recognize the literal token "top3" --
 * typing "top 5" (a real ranking some weapons need, not every category caps out at exactly 3)
 * silently matched nothing, with no feedback that it had been ignored. Now accepts any `topN`
 * (with or without a space before the number), and anything that still doesn't match ends up in
 * `unrecognized` so the caller (index.js's add/edit-loadout handlers) can tell the admin exactly
 * which token didn't take instead of the change just silently not applying.
 */
function parseLoadoutBadges(badgesStr) {
    const tokens = (badgesStr || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    let isMeta = false;
    let categoryRank = null;
    let isToxic = false;
    const unrecognized = [];

    for (const token of tokens) {
        if (token === 'meta') { isMeta = true; continue; }
        if (token === 'best') { categoryRank = 'best'; continue; }
        if (token === 'toxic') { isToxic = true; continue; }
        const topMatch = token.match(/^top\s*(\d+)$/);
        if (topMatch) { categoryRank = `top${topMatch[1]}`; continue; }
        unrecognized.push(token);
    }

    return { isMeta, categoryRank, isToxic, unrecognized };
}

module.exports = { toTitleCase, resolveTier, parseAdminDate, parseItemLine, parseBulkDrawList, parseBulkEvents, formatDrawsAsBulkText, parseLoadoutBadges };