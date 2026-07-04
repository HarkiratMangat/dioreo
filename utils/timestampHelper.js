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

    // 2. Parse the string using the anchor
    const parsedResult = chrono.parseDate(textString, referenceDate, { forwardDate: true });
    if (!parsedResult) return null;

    // 3. Build a clean dayjs instance enforcing the exact date parts extracted
    const localTarget = dayjs(parsedResult).tz(userTimezone, true);
    
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