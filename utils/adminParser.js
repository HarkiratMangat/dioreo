// utils/adminParser.js
const chrono = require('chrono-node');

function toTitleCase(str) {
    return str.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
}

function resolveTier(shorthand) {
    const clean = shorthand.toLowerCase().trim();
    if (['m', 'mythic'].includes(clean)) return 'mythic';
    if (['l', 'leggy', 'legendary'].includes(clean)) return 'legendary';
    if (['ll', 'lega', 'legacy'].includes(clean)) return 'legacy';
    if (['e', 'epic'].includes(clean)) return 'epic';
    return toTitleCase(shorthand);
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
 * Parses bulk comma-separated strings into Draw objects
 * Format: [n/r] Title, [tier] Item 1, [tier] Item 2, Date, URL
 */
function parseBulkDraws(bulkText) {
    const lines = bulkText.split('\n').filter(line => line.trim().length > 0);
    const parsedDraws = { newDraws: [], returningDraws: [] };

    for (const line of lines) {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 4) continue; // Skip malformed lines

        // 1. Extract Type and Title (First part)
        const firstPart = parts[0];
        const typeMatch = firstPart.match(/^(n|r|new|returning)\s+(.+)$/i);
        const isNew = typeMatch ? typeMatch[1].toLowerCase().startsWith('n') : true;
        const title = toTitleCase(typeMatch ? typeMatch[2] : firstPart);

        // 2. Extract URL and Date (Last two parts)
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

        // 3. Extract Items (Everything left in the middle)
        const items = parts.slice(1).map(itemStr => {
            // Match the first word as the tier shorthand, the rest as the name
            const match = itemStr.match(/^(\S+)\s+(.+)$/);
            if (match) {
                return { tier: resolveTier(match[1]), name: toTitleCase(match[2]) };
            }
            return { tier: 'epic', name: toTitleCase(itemStr) }; // Fallback
        });

        const drawObj = {
            title: title,
            date: parsedDate,
            thumbnailUrl: url.startsWith('http') ? url : `https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/${url}`,
            items: items
        };

        if (isNew) parsedDraws.newDraws.push(drawObj);
        else parsedDraws.returningDraws.push(drawObj);
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

module.exports = { toTitleCase, resolveTier, parseAdminDate, parseBulkDraws, parseBulkEvents };