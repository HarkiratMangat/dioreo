// utils/timestampHelper.js
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const chrono = require('chrono-node');

// Extend dayjs with required plugins to process timezones correctly
dayjs.extend(utc);
dayjs.extend(timezone);

// The "now" chrono measures relative words from ("in 2 hours", "tomorrow"), pinned to `zone` (fixed 2026-10-20 16:50 EDT). chrono reads a plain Date reference in the HOST's local fields, so the old `dayjs().tz(zone).toDate()` -- which is just the real instant again -- made every relative phrase depend on the machine's own time zone: on the prod VM (Etc/UTC, checked 2026-10-20 16:50 EDT) "in 2 hours" for a Toronto user came out +6 h and "tomorrow" a day late after 20:00 Toronto. A `{ instant, timezone }` reference makes chrono work in the zone's offset instead, so nothing reads the host's clock fields. The offset is the zone's offset AT `instant`; componentInstant() below re-resolves the real offset for the parsed date, so a date on the other side of a daylight-time change still lands right. Toronto is UserPreference.timezone's own default. A caller can hand in null (a prefs doc with no zone reaches parseReleaseDateTime as `timezone: null`), and dayjs throws on a null zone, so both helpers fall back rather than crash.
const DEFAULT_ZONE = 'America/Toronto';

function zoneReference(zone, instant = new Date()) {
    zone = zone || DEFAULT_ZONE;
    return { instant, timezone: dayjs(instant).tz(zone).utcOffset() };
}

// One chrono point as a dayjs instant in `zone`. A point that names its own zone ("2am UTC") is already absolute. Otherwise its date/time fields are the zone's wall clock (chrono worked in the zone's offset, see zoneReference), so they are rebuilt with dayjs.tz, which applies the offset the zone really has on that date. A point with no time of day becomes midnight in the zone: chrono's implied hour is 12:00, so "july 17" used to come out as noon.
function componentInstant(component, zone) {
    zone = zone || DEFAULT_ZONE;
    const hasTime = component.isCertain('hour');
    if (hasTime && component.isCertain('timezoneOffset')) return dayjs(component.date());
    const pad = (n) => String(n).padStart(2, '0');
    const time = hasTime ? `${pad(component.get('hour'))}:${pad(component.get('minute'))}:${pad(component.get('second'))}` : '00:00:00';
    return dayjs.tz(`${component.get('year')}-${pad(component.get('month'))}-${pad(component.get('day'))}T${time}`, zone);
}

/**
 * Converts natural language strings into Discord timestamp variations
 * @param {string} textString - e.g., "tomorrow at 5pm"
 * @param {string} userTimezone - e.g., "America/Toronto"
 * @param {Date} [now] - the moment relative words count from; tests pin it
 */
function generateTimestamps(textString, userTimezone = 'America/Toronto', now = new Date()) {
    // chrono.parse() rather than parseDate(), because componentInstant() needs the ParsedComponents, not just a Date.
    const parseResults = chrono.parse(textString, zoneReference(userTimezone, now), { forwardDate: true });
    if (!parseResults || parseResults.length === 0) return null;

    const unixSeconds = Math.floor(componentInstant(parseResults[0].start, userTimezone).valueOf() / 1000);
    // A range ("8pm to 10pm", "oct 24 to oct 27") also has an end (2026-10-20 19:14 EDT); `endUnix` is null otherwise.
    const end = parseResults[0].end;
    const endUnix = end ? Math.floor(componentInstant(end, userTimezone).valueOf() / 1000) : null;

    // 5. Structure every format option Discord supports
    return {
        unix: unixSeconds,
        endUnix,
        shortTime: `<t:${unixSeconds}:t>`,
        longTime: `<t:${unixSeconds}:T>`,
        shortDate: `<t:${unixSeconds}:d>`,
        longDate: `<t:${unixSeconds}:D>`,
        shortDateTime: `<t:${unixSeconds}:f>`,
        longDateTime: `<t:${unixSeconds}:F>`,
        relative: `<t:${unixSeconds}:R>`
    };
}

// One format of a range as Discord markdown, start and end together, so ONE code copies the whole range (Harkirat's layout A, 2026-10-20 19:14 EDT). On a single day in `zone` the end drops its date: a date-and-time format ends on the time alone, a date-only format shows once. Relative time shows the start only. `end` null means a single time.
const TIME_OF = { F: 't', f: 't', s: 't', S: 'T' };
function rangeText(start, end, c, zone = 'America/Toronto') {
    if (!end || end === start) return `<t:${start}:${c}>`;
    if (c === 'R') return `<t:${start}:R>`;
    const sameDay = dayjs.unix(start).tz(zone || 'America/Toronto').format('YYYY-MM-DD') === dayjs.unix(end).tz(zone || 'America/Toronto').format('YYYY-MM-DD');
    if (sameDay && (c === 'D' || c === 'd')) return `<t:${start}:${c}>`;
    const endFormat = sameDay && TIME_OF[c] ? TIME_OF[c] : c;
    return `<t:${start}:${c}> – <t:${end}:${endFormat}>`;
}

module.exports = { generateTimestamps, zoneReference, componentInstant, rangeText };