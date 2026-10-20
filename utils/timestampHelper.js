// utils/timestampHelper.js
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const chrono = require('chrono-node');

// Extend dayjs with required plugins to process timezones correctly
dayjs.extend(utc);
dayjs.extend(timezone);

// The "now" chrono measures relative words from ("in 2 hours", "tomorrow"), pinned to `zone` (fixed 2026-10-20 16:50 EDT). chrono reads a plain Date reference in the HOST's local fields, so the old `dayjs().tz(zone).toDate()` -- which is just the real instant again -- made every relative phrase depend on the machine's own time zone: on the prod VM (Etc/UTC, checked 2026-10-20 16:50 EDT) "in 2 hours" for a Toronto user came out +6 h and "tomorrow" a day late after 20:00 Toronto. A `{ instant, timezone }` reference makes chrono work in the zone's offset instead, so nothing reads the host's clock fields. The offset is the zone's offset AT `instant`; componentInstant() below re-resolves the real offset for the parsed date, so a date on the other side of a daylight-time change still lands right.
function zoneReference(zone, instant = new Date()) {
    return { instant, timezone: dayjs(instant).tz(zone).utcOffset() };
}

// One chrono point as a dayjs instant in `zone`. A point that names its own zone ("2am UTC") is already absolute. Otherwise its date/time fields are the zone's wall clock (chrono worked in the zone's offset, see zoneReference), so they are rebuilt with dayjs.tz, which applies the offset the zone really has on that date. A point with no time of day becomes midnight in the zone: chrono's implied hour is 12:00, so "july 17" used to come out as noon.
function componentInstant(component, zone) {
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

    // 5. Structure every format option Discord supports
    return {
        unix: unixSeconds,
        shortTime: `<t:${unixSeconds}:t>`,
        longTime: `<t:${unixSeconds}:T>`,
        shortDate: `<t:${unixSeconds}:d>`,
        longDate: `<t:${unixSeconds}:D>`,
        shortDateTime: `<t:${unixSeconds}:f>`,
        longDateTime: `<t:${unixSeconds}:F>`,
        relative: `<t:${unixSeconds}:R>`
    };
}

module.exports = { generateTimestamps, zoneReference, componentInstant };