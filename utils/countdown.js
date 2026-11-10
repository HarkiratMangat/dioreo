// utils/countdown.js -- an end date typed as the game's countdown ("13d 23h"), snapped to the midnight UTC the draw really ends at (2026-11-10, Harkirat: "i checked ingame and it said the draw would finish in "13d 23h". If taken literally, that would mean nov 24 00:20 utc, which is incorrect since we know the draws always start or end at midnight utc. so can the field smartly detect that discrepancy and automatically adjust it").
//
// The rule, his pick after a long back and forth (01:03–01:10 UTC): it works from the moment it is typed, so the time since the daily update always counts.
//   - The game drops what is left below its smallest unit, so "13d 23h" means at least 13d 23h and under 13d 24h. The midnight inside that window is the end.
//   - Days only ("13d", "14d") is ambiguous in the 12 hours after an update: "13d" could be "13d 23h" with the hours dropped or "12d 23h" rounded up. The ROUNDED reading wins (his "sure, but no need for the button", 01:10 UTC), so it is the midnight nearest the typed time; 14d typed at 7:20 pm Toronto, the game showing 13d 23h, is Nov 24.
//   - Hours given and no midnight inside the window (13d 22h at 7:20 pm): the midnight nearest the middle of the window.
// Only the short game form counts (`13d`, `13d 23h`, `23h 40m`, optionally after "ends in" / "in"); the spelled form only with two units or more (`13 days 23 hours`), so "in 2 days" stays the calendar day two days out, as utils/adminParser.js has always read it.
const DAY = 864e5, HOUR = 36e5, MIN = 6e4;

const SHORT = /^\s*(?:(?:ends?|ending|finish(?:es)?)\s+)?(?:in\s+)?(?:(\d{1,3})\s*d)?\s*(?:(\d{1,2})\s*h)?\s*(?:(\d{1,2})\s*m)?\s*(?:left)?\s*$/i;
const LONG = /^\s*(?:(?:ends?|ending|finish(?:es)?)\s+)?(?:in\s+)?(?:(\d{1,3})\s*days?)?\s*,?\s*(?:(\d{1,2})\s*(?:hours?|hrs?))?\s*,?\s*(?:(\d{1,2})\s*(?:minutes?|mins?))?\s*(?:left)?\s*$/i;

// "13d 23h" -> { ms, unit } (unit: the smallest unit typed, in ms), or null when the text is not a countdown.
function parseCountdown(text) {
    const s = String(text || '');
    let m = SHORT.exec(s);
    if (!m || (m[1] === undefined && m[2] === undefined && m[3] === undefined)) {
        m = LONG.exec(s);
        if (!m || [m[1], m[2], m[3]].filter(v => v !== undefined).length < 2) return null;
    }
    const [d, h, mi] = [m[1], m[2], m[3]].map(v => (v === undefined ? null : Number(v)));
    const ms = (d || 0) * DAY + (h || 0) * HOUR + (mi || 0) * MIN;
    const unit = mi !== null ? MIN : h !== null ? HOUR : DAY;
    return { ms, unit };
}

const midnightsIn = (from, to) => { const out = []; for (let at = Math.ceil(from / DAY) * DAY; at < to; at += DAY) out.push(at); return out; };

// The midnight UTC a countdown typed at `now` ends at, or null when the text is not a countdown.
function snapCountdown(text, now = new Date()) {
    const c = parseCountdown(text);
    if (!c) return null;
    const t = new Date(now).getTime() + c.ms;
    // Days only: the rounded reading (the nearest midnight). The window [t - 12h, t + 12h) holds exactly one.
    if (c.unit === DAY) return new Date(midnightsIn(t - DAY / 2, t + DAY / 2)[0]);
    const inside = midnightsIn(t, t + c.unit);
    if (inside.length) return new Date(inside[0]);
    return new Date(Math.round((t + c.unit / 2) / DAY) * DAY);
}

module.exports = { parseCountdown, snapCountdown };
