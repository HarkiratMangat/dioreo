// utils/timestampHelper.js
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const chrono = require('chrono-node');

// Extend dayjs with required plugins to process timezones correctly
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converts natural language strings into Discord timestamp variations
 * @param {string} textString - e.g., "tomorrow at 5pm"
 * @param {string} userTimezone - e.g., "America/Toronto"
 */
function generateTimestamps(textString, userTimezone = 'America/Toronto') {
    // 1. Establish an anchor time relative to the target timezone
    const referenceDate = dayjs().tz(userTimezone).toDate();

    // 2. Parse the string using the anchor. Using chrono.parse() (not the parseDate() shortcut)
    // because we need access to the ParsedComponents, not just the final Date -- see step 3.
    const parseResults = chrono.parse(textString, referenceDate, { forwardDate: true });
    if (!parseResults || parseResults.length === 0) return null;

    const parsedComponents = parseResults[0].start;
    const parsedResult = parsedComponents.date();

    // 3. Build a clean dayjs instance enforcing the exact date parts extracted
    let localTarget = dayjs(parsedResult).tz(userTimezone, true);

    // FIXED: a bare date with no time-of-day (e.g. "july 17") used to silently become NOON, not
    // midnight -- chrono-node's default "implied" hour when none is stated is 12:00, not 00:00.
    // isCertain('hour') tells us whether the input text actually specified a time vs. chrono just
    // inferring one, so we can zero it back out to true midnight in the target timezone whenever
    // the user only gave a date.
    if (!parsedComponents.isCertain('hour')) {
        localTarget = localTarget.hour(0).minute(0).second(0).millisecond(0);
    }

    // 4. Derive the Unix epoch in seconds
    const unixSeconds = Math.floor(localTarget.valueOf() / 1000);

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

module.exports = { generateTimestamps };