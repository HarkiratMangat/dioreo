// scripts/today.test.js
//
// /today (2026-10-23 11:53 EDT, Harkirat's approved template): which entries land in Live now, Ending soon, Going live and the day list on a fixed clock; Going live left out when empty; the day list capped at 3 days; the footer's TBD and past ends; and /calendar's Today option (its filter choice, its dropdown entry, and the mask that routes to /today). No database and no Discord: a seasonal document is built by hand.
const assert = require('assert');
const { todaySections, buildTodayContainer, gameDay } = require('../commands/today');
const calendar = require('../commands/calendar');

let failed = 0;
function t(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${String(err.message).split('\n').join('\n      ')}`); }
}

const DAY = 86400000;
// 14:00 UTC on Oct 23: the game day began at 00:00 UTC Oct 23 and ends at 00:00 UTC Oct 24.
const NOW = Date.UTC(2026, 9, 23, 14);
const d = (day, hour = 0) => new Date(Date.UTC(2026, 9, day, hour));

function doc(overrides = {}) {
    return {
        currentSeasonTitle: 'Season 7 — Terminated',
        bpEnd: d(30 + 12), rankEnd: d(30 + 12), dmzEnd: d(30 + 11), // Nov 12 / Nov 11, written as Oct days past the month end
        newDraws: [
            { title: 'Widow Bite Draw', date: d(24), items: [{ tier: 'legendary', name: 'X' }] }, // goes live at the next reset
            { title: 'Old Mythic Drop', date: d(10), items: [{ tier: 'mythic', name: 'Y' }] }, // live since earlier: not "Live now"
            { title: 'Undead Legion Series Armory', date: d(28), items: [] },
        ],
        returningDraws: [
            { title: 'Deepstar Wraith Mythic Drop', date: d(23), items: [{ tier: 'mythic', name: 'Z' }] }, // went live today
            { title: 'Double Tap Draw', date: d(27), items: [] },
            { title: 'Longquan Sword Draw', date: d(29), items: [] },
            { title: 'Far Future Draw', date: d(31 + 5), items: [] }, // past the 7-day lookahead
        ],
        calendar: [
            { title: 'Thermal Core Draw', category: 'draw', date: d(15), endDate: d(24, 12) }, // ending soon
            { title: 'COD Point Rush Week 8', category: 'event', date: d(23), endDate: d(30) }, // went live today
            { title: 'Halloween Haunt Event', category: 'event', date: d(16), endDate: d(25) }, // ending soon
            { title: 'Long Event', category: 'event', date: d(10), endDate: d(31 + 10) }, // live, not ending soon
            { title: 'Rebirth Island BR', category: 'playlist', date: d(27), endDate: d(31 + 3) },
            { title: 'COD Point Rush Week 9', category: 'event', date: d(30), endDate: d(31 + 6) }, // 4th day: cut by the 3-day cap
            { title: 'Old Event', category: 'event', date: d(1), endDate: d(5) }, // over
        ],
        ...overrides,
    };
}
const titles = list => list.map(e => e.title);

t('the game day runs from the last 00:00 UTC to the next', () => {
    assert.deepStrictEqual(gameDay(NOW), { start: Date.UTC(2026, 9, 23), next: Date.UTC(2026, 9, 24) });
});

t('Live now holds only what went live during this game day', () => {
    const s = todaySections(doc(), NOW);
    assert.deepStrictEqual(titles(s.liveNow).sort(), ['COD Point Rush Week 8', 'Deepstar Wraith Mythic Drop']);
});

t('Ending soon holds what is live and ends within 2 days, soonest first, and nothing already in Live now', () => {
    assert.deepStrictEqual(titles(todaySections(doc(), NOW).endingSoon), ['Thermal Core Draw', 'Halloween Haunt Event']);
});

t('Going live holds what starts by the next reset', () => {
    assert.deepStrictEqual(titles(todaySections(doc(), NOW).goingLive), ['Widow Bite Draw']);
});

t('the day list shows the first 3 days that have something, within 7 days', () => {
    const s = todaySections(doc(), NOW);
    assert.deepStrictEqual(s.days.map(x => x.label), ['Tue, Oct 27', 'Wed, Oct 28', 'Thu, Oct 29']);
    assert.ok(!s.days.flatMap(x => titles(x.entries)).includes('COD Point Rush Week 9'), 'a 4th day is cut');
    assert.deepStrictEqual(titles(s.days[0].entries).sort(), ['Double Tap Draw', 'Rebirth Island BR']);
    assert.ok(!s.days.flatMap(x => titles(x.entries)).includes('Far Future Draw'));
});

t('a draw shows its best item tier; an event and a playlist their own icons', () => {
    const s = todaySections(doc(), NOW);
    const emojis = require('../utils/emojiMap');
    assert.strictEqual(s.liveNow.find(e => e.title.startsWith('Deepstar')).icon, emojis.mythic);
    assert.strictEqual(s.goingLive[0].icon, emojis.legendary);
    assert.strictEqual(s.days[0].entries.find(e => e.title === 'Rebirth Island BR').icon, emojis.modes);
});

const text = components => JSON.stringify(components);

t('with nothing going live, the Going live heading is left out entirely (never a "nothing goes live" line)', () => {
    const quiet = doc({ newDraws: [] });
    const out = text(buildTodayContainer(quiet, { nowMs: NOW, accentColor: 1 }));
    assert.ok(!out.includes('Going live'));
    assert.ok(!/nothing goes live/i.test(out));
});

t('the footer carries the daily reset first, a TBD end as TBD, and leaves out a past end', () => {
    const out = text(buildTodayContainer(doc({ rankEndTBD: true, rankEnd: null, dmzEnd: d(1) }), { nowMs: NOW, accentColor: 1 }));
    const footer = JSON.parse(out)[0].components.at(-1).content;
    assert.ok(footer.startsWith(`-# 🔄 Daily reset <t:${Date.UTC(2026, 9, 24) / 1000}:R>`), footer);
    assert.ok(footer.includes('Rank TBD'));
    assert.ok(!footer.includes('DMZ'));
});

t('an empty calendar says so once, with no sections', () => {
    const out = text(buildTodayContainer(doc({ newDraws: [], returningDraws: [], calendar: [] }), { nowMs: NOW, accentColor: 1 }));
    assert.ok(out.includes('Nothing on the calendar for the next 7 days.'));
    assert.ok(!out.includes('Live now') && !out.includes('Ending soon'));
});

function count(components) {
    let n = 0;
    const walk = c => { n++; (c.components || []).forEach(walk); if (c.accessory) walk(c.accessory); };
    components.forEach(walk);
    return n;
}

t('the /calendar version stays under 40 components with unique ids, and keeps the filter with Today picked', () => {
    const msg = buildTodayContainer(doc(), { nowMs: NOW, accentColor: 1, fromCalendar: true, isEphemeral: true });
    assert.ok(count(msg) <= 40, `components: ${count(msg)}`);
    const ids = JSON.stringify(msg).match(/"custom_id":"[^"]+"/g) || [];
    assert.strictEqual(new Set(ids).size, ids.length);
    const select = JSON.stringify(msg).includes('"value":"today"') && msg[0].components.at(-1).components[0];
    assert.ok(select && select.options.find(o => o.value === 'today').default === true);
});

t("/calendar's filter option and dropdown both offer Today, and its mask routes to /today", () => {
    const filter = calendar.data.toJSON().options.find(o => o.name === 'filter');
    assert.ok(filter.choices.some(c => c.value === 'today' && c.name === 'Today'));
    assert.ok(calendar.FILTER_OPTIONS.some(o => o.value === 'today'));
    assert.ok(calendar.filterMask('today') & calendar.TODAY_BIT);
    assert.ok(!(calendar.filterMask('live') & calendar.TODAY_BIT));
    assert.strictEqual(calendar.filterMask(calendar.TODAY_BIT | 1) & calendar.TODAY_BIT, calendar.TODAY_BIT, 'a mask from a custom_id keeps the Today bit');
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
