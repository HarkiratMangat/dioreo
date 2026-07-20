// utils/adminParser.js
const chrono = require('chrono-node');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const { fuzzyMatch, normalizeForSearch } = require('./search');

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
// Detects whether the trailing comma field is actually a URL/Cloudinary key, or is actually the
// tail of the date (meaning no URL was given at all). Every date this bot's admin flows accept
// ("July 15", "August 5, 2026") contains a space; a URL or bare Cloudinary key never does. A bare
// 4-digit year ("2026", the comma-split tail of "July 16, 2026") also has no space, so it's
// excluded explicitly -- without that exclusion this would misread the year as a URL and leave the
// date one field short. See the Cloudinary-cache design-decision-log entry in CLAUDE.md for why the
// URL became optional here at all (2026-07-12).
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

        // URL is now OPTIONAL (2026-07-12, Cloudinary-cache feature) -- a blank/omitted URL means
        // "reuse whatever's already cached for this draw name" (see utils/cloudinaryCache.js's
        // resolveThumbnail), resolved later at save time in index.js, not here. Only pop a trailing
        // URL field if the last field actually looks like one.
        let url = null;
        if (parts.length > 1 && looksLikeUrlOrKey(parts[parts.length - 1])) {
            url = parts.pop();
        }

        // Extract Date (now the last remaining part)
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
            // Null means "no URL given, resolve via Cloudinary cache lookup at save time" -- a bare
            // Cloudinary key still gets expanded to a full URL here same as before; a real HTTP URL
            // passes through untouched either way (resolveThumbnail re-uploads it into temp_draws/).
            thumbnailUrl: url ? (url.startsWith('http') ? url : `https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/${url}`) : null,
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

// Formats a stored Date back into the same human-readable form parseAdminDate() accepts as input
// -- used to pre-fill modals that combine a title and a date on one line (e.g. /manage season
// titles-deadlines' "Battle Pass, August 28" fields) so re-submitting without touching a field
// round-trips cleanly instead of showing an ISO timestamp the admin would have to reformat by hand.
function formatAdminDate(date) {
    return date ? dayjs.utc(date).format('MMMM D, YYYY') : '';
}

/**
 * Parses the loadout "badges" segment of /manage's "Category | Mode | Badges" modal field into
 * `{ isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized }` (see models/Loadout.js). Comma-
 * separated, case-insensitive, e.g. "meta, best" or "top3" or "top 5" or "" (no badges). Discord
 * modals cap at 5 fields, and the loadout modal already uses all 5, so this rides along as a 3rd
 * pipe-delimited segment on the existing "Category | Mode" field rather than getting its own input.
 *
 * NOTE (fixed during review): `categoryRank` used to only recognize the literal token "top3" --
 * typing "top 5" (a real ranking some weapons need, not every category caps out at exactly 3)
 * silently matched nothing, with no feedback that it had been ignored. Now accepts any `topN`
 * (with or without a space before the number), and anything that still doesn't match ends up in
 * `unrecognized` so the caller (index.js's add/edit-loadout handlers) can tell the admin exactly
 * which token didn't take instead of the change just silently not applying.
 *
 * NOTE (added for DMZ range badges): `bestclose`/`bestmidlong`/`top{N}close`/`top{N}midlong`
 * (no space before "close"/"midlong") map to `dmzRangeRank` instead of `categoryRank` -- /dmz has
 * no per-category commands, so ranking by combat range role reads more meaningfully there than
 * "Best in category". See buildBadgesLine() in utils/loadoutRender.js for how this renders.
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

// Gunsmith-code structural corrector (added for /autobuild's vision-extraction pipeline) -- CODM
// Gunsmith share codes alternate Number-Letter-Number-Letter... for their full length (confirmed
// against a real shareCode already referenced in this codebase, manage.js's placeholder example
// "1I2C6B8A9D"). A vision model reading a small, low-contrast in-game font is expected to
// occasionally misread a character as its visual look-alike from the WRONG character class for its
// position (digit-shaped glyphs in letter slots, letter-shaped glyphs in digit slots), or with
// incorrect case (lowercase 'l' instead of uppercase 'I'). Position parity (even index = digit,
// odd index = letter) decides what type a position requires. Three distinct corrections apply:
// (1) actual type mismatches get snapped via look-alike maps (DIGIT_TO_LETTER, LETTER_TO_DIGIT),
// (2) lowercase letters in letter positions get case-normalized (uppercase directly, or via
// LOWERCASE_LETTER_CORRECTION for digit-like lowercase like 'l'→'I'), and (3) characters already
// the right type for their position are left untouched even if they visually resemble something
// else (an '8' correctly in a digit slot is never touched, even though '8' resembles 'B') -- this
// prevents speculative corrections from corrupting already-correct input.
const DIGIT_TO_LETTER = { '0': 'O', '1': 'I', '8': 'B', '5': 'S' };
const LETTER_TO_DIGIT = { O: '0', I: '1', L: '1', B: '8', S: '5' };
const LOWERCASE_LETTER_CORRECTION = { 'l': 'I', 'o': 'O' }; // digit-like lowercase letters in letter positions

// Weapon-name-prefix backstop (added 2026-07-20, real bug found live: Vertex AI extraction returned
// "Locus-1B2A4B8C9C" instead of "1B2A4B8C9C" -- the model prepended the weapon name even though the
// prompt (utils/visionExtract.js) never asked for it). Fixed primarily at the prompt level, but this
// is a structural backstop here too: a genuine code is a contiguous digit-letter-digit-letter... run,
// so scan for the LONGEST such run anywhere in the string and use only that, discarding anything
// before/after it (a weapon name prefix, stray punctuation, etc). Safe against false positives from a
// weapon name itself -- a name needs its own digits and letters to alternate perfectly for several
// characters running (e.g. "AK117" fails immediately: '1','1' are two digits in a row, never two
// letters interleaved), which real weapon names don't do. A code with no prefix at all (the normal
// case) matches itself in full, so this is a no-op for already-clean input.
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
        // Normalize lowercase letters to uppercase in letter positions (Gunsmith codes use uppercase);
        // digit-like lowercase letters have specific uppercase mappings.
        if (!expectDigit && /[a-z]/.test(ch)) {
            return LOWERCASE_LETTER_CORRECTION[ch] || ch.toUpperCase();
        }
        return ch; // already the right type for its position -- untouched
    }).join('');
}

// Fuzzy-corrects one vision-extracted attachment name against the set of attachment strings already
// used somewhere in the Loadout collection -- a vision model reading a small in-game label can get
// spacing/punctuation/capitalization slightly wrong ("Gauge-9 Mo" for "Gauge-9 Mono") even when it
// got the actual attachment right. Checks for an exact normalized match first (cheapest, most common
// case once the model gets it basically right), then falls back to a two-directional fuzzyMatch scan
// (either string could be the "noisier" one depending on what the model added or dropped) so a real
// but imperfect read still resolves to the canonical stored spelling. No match at all -- likely a
// genuinely new attachment CODM just added -- passes the extracted text through untouched rather than
// forcing it onto something wrong.
function correctAttachmentName(extracted, knownAttachments) {
    if (!extracted) return extracted;
    const normalizedExtracted = normalizeForSearch(extracted);

    const exact = knownAttachments.find(known => normalizeForSearch(known) === normalizedExtracted);
    if (exact) return exact;

    const fuzzy = knownAttachments.find(known => fuzzyMatch(extracted, known) || fuzzyMatch(known, extracted));
    return fuzzy || extracted;
}

// Cloudinary placeholder used elsewhere for loadouts that don't have a real screenshot yet (see
// scripts/createPlaceholderLoadouts.js) — reused here as the bulk-add default when a block omits
// the image key, so a bulk submission is never blocked on having every image ready up front.
const PLACEHOLDER_IMAGE = 'https://placehold.co/1024x576/1a1a1a/e5e5e5?text=Coming+Soon';

/**
 * Parses /manage loadouts bulk-add's paragraph field into loadout-ready objects. One loadout per
 * block, blocks separated by a blank line:
 *
 *   Weapon | Category | Mode | Build Name | ImageKey | ShareCode | Badges
 *   Attachment line 1
 *   Attachment line 2
 *   ...
 *
 * Only Weapon/Category/Mode are required — Build Name/ImageKey/ShareCode/Badges are optional
 * trailing pipe segments (mirrors the single-add modal's "Category | Mode | Badges" convention,
 * just extended since a bulk block has no separate fields to put them in). A block missing a
 * required piece, with an unrecognized Mode, or with no attachment lines at all doesn't silently
 * vanish -- it's collected in `errors` (with a snippet of the offending block) so the admin gets
 * told exactly what didn't parse, same as parseLoadoutBadges()'s `unrecognized` reporting.
 *
 * Handles MP and DMZ in the same submission (Mode is per-block) -- there's no need for separate
 * "bulk add MP loadouts" / "bulk add DMZ loadouts" flows.
 */
function parseBulkLoadoutList(bulkText) {
    const blocks = bulkText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    const parsed = [];
    const errors = [];

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        const headerLine = lines[0];
        const snippet = headerLine.length > 60 ? `${headerLine.slice(0, 60)}...` : headerLine;

        const headerParts = headerLine.split('|').map(p => p.trim());
        const [weaponName, categoryRaw, modeRaw, buildNameRaw, imageKeyRaw, shareCodeRaw, badgesRaw] = headerParts;

        if (!weaponName || !categoryRaw || !modeRaw) {
            errors.push(`"${snippet}" -- missing Weapon/Category/Mode (need at least 3 pipe-delimited fields)`);
            continue;
        }

        const mode = modeRaw.toUpperCase();
        if (mode !== 'MP' && mode !== 'DMZ') {
            errors.push(`"${snippet}" -- Mode must be MP or DMZ, got "${modeRaw}"`);
            continue;
        }

        const attachments = lines.slice(1);
        if (attachments.length === 0) {
            errors.push(`"${snippet}" -- no attachment lines found under the header`);
            continue;
        }

        const { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized } = parseLoadoutBadges(badgesRaw);
        if (unrecognized.length > 0) {
            errors.push(`"${snippet}" -- unrecognized badge token(s): ${unrecognized.join(', ')} (loadout still saved, just without these)`);
        }

        parsed.push({
            weaponName,
            weaponKey: weaponName.toLowerCase().replace(/\s+/g, ''),
            category: categoryRaw.toUpperCase(),
            mode,
            buildName: buildNameRaw || 'Standard Build',
            attachments,
            imageKey: imageKeyRaw || PLACEHOLDER_IMAGE,
            shareCode: shareCodeRaw || '',
            isMeta,
            categoryRank,
            dmzRangeRank,
            isToxic
        });
    }

    return { parsed, errors };
}

/**
 * Splits a "Title, End Date" line on the LAST comma -- used by /manage season's combined
 * titles-deadlines modal, where each of the 3 deadline fields carries both a title and a date on
 * one line (e.g. "Battle Pass, August 28"). Splitting on the last comma (not the first) means a
 * title that happens to contain a comma still parses correctly, since the date is always the
 * trailing segment. Returns { title, dateStr } -- either can be empty if the line itself is blank,
 * letting the caller leave that field's existing value untouched (same partial-update convention
 * as the old "Edit Season Deadlines" modal).
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
 * Reverse of parseBulkEvents -- reconstructs the bullet-separated "M/D - M/D | Title" bulk-import
 * text from Calendar subdocuments already in the database, so /export can hand back text that
 * pastes right back into /manage's calendar Bulk Add modal (same round-trip purpose as
 * formatDrawsAsBulkText above, just for the calendar's own format).
 */
function formatCalendarAsBulkText(calendar) {
    return calendar.map(event => {
        const startStr = dayjs.utc(event.date).format('M/D');
        const endStr = event.isOngoing ? 'All Season' : dayjs.utc(event.endDate).format('M/D');
        return `• ${startStr} - ${endStr} | ${event.title}`;
    }).join('\n');
}

/**
 * Plain re-postable export of patch note entries -- NOT a true bulk-import format, since patch
 * notes have no bulk-add flow to paste this back into (only single add/edit exists). Just a
 * readable one-entry-per-block dump (title/release date/description/URLs) for reference or to
 * manually re-type into the single-add modal, per Harkirat's call when /export was split out
 * (2026-07-09) rather than inventing a bulk-patch-notes format that doesn't otherwise exist yet.
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
 * Bulk-import-compatible export of loadouts -- round-trips straight back into
 * parseBulkLoadoutList()'s expected "Weapon | Category | Mode | Build | Image | Code | Badges" +
 * attachment-lines format (blocks separated by a blank line), added for /manage's Loadouts Export
 * (2026-07-12 panel redesign). Badge reconstruction mirrors manage.js's buildEditLoadoutModal
 * (dmzRangeRank is stored hyphenated -- "best-close" -- but the parser's token format has no
 * hyphen, so it's stripped back out here too).
 */
function formatLoadoutsAsBulkText(loadouts) {
    return loadouts.map(l => {
        const badges = [
            l.isMeta ? 'meta' : null,
            l.categoryRank,
            l.dmzRangeRank ? l.dmzRangeRank.replace('-', '') : null,
            l.isToxic ? 'toxic' : null
        ].filter(Boolean).join(',');
        const header = [l.weaponName, l.category, l.mode, l.buildName, l.imageKey, l.shareCode || '', badges].join(' | ');
        return [header, ...l.attachments].join('\n');
    }).join('\n\n');
}

module.exports = { toTitleCase, resolveTier, parseAdminDate, parseItemLine, parseBulkDrawList, parseBulkEvents, formatDrawsAsBulkText, formatAdminDate, parseLoadoutBadges, parseBulkLoadoutList, splitTitleDate, formatCalendarAsBulkText, formatPatchNotesAsText, formatLoadoutsAsBulkText, correctGunsmithCode, correctAttachmentName };