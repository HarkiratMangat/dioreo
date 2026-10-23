// scripts/today.test.js
//
// /today and /calendar's Today page (Harkirat's layout notes, 2026-10-23 13:02 EDT): Live now lists everything live except what is ending soon; every list puts entries with no end first, then the one that leaves last down to the one that leaves first; Going live is what starts by the next reset and is left out when empty; "Nothing is currently live" shows only when nothing at all is live; /today has no day list while /calendar's Today page shows the next 2 days; the next season's line shows from 96 hours before it starts; /calendar opens on Today, Today is a page pick, and a type pick narrows the Today page. No database and no Discord: a seasonal document is built by hand.
const assert = require('assert');
const { todaySections, buildTodayContainer, buildTodayBody, seasonTeaser, gameDay } = require('../commands/today');
const calendar = require('../commands/calendar');

let failed = 0;
function t(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${String(err.message).split('\n').join('\n      ')}`); }
}

// 14:00 UTC on Oct 23: the game day began at 00:00 UTC Oct 23 and ends at 00:00 UTC Oct 24.
const NOW = Date.UTC(2026, 9, 23, 14);
const d = (day, hour = 0) => new Date(Date.UTC(2026, 9, day, hour)); // a day past 31 rolls into November

function doc(overrides = {}) {
    return {
        currentSeasonTitle: 'Season 7 — Terminated',
        bpEnd: d(31 + 12), rankEnd: d(31 + 12), dmzEnd: d(31 + 11),
        newDraws: [
            { title: 'Widow Bite Draw', date: d(24), items: [{ tier: 'legendary', name: 'X' }] }, // goes live at the next reset
            { title: 'Old Mythic Drop', date: d(10), items: [{ tier: 'mythic', name: 'Y' }] }, // live since earlier, no end
            { title: 'Undead Legion Series Armory', date: d(28), items: [] },
        ],
        returningDraws: [
            { title: 'Deepstar Wraith Mythic Drop', date: d(23), items: [{ tier: 'mythic', name: 'Z' }] }, // went live today, no end
            { title: 'Double Tap Draw', date: d(27), items: [] },
            { title: 'Longquan Sword Draw', date: d(29), items: [] }, // a 3rd day: cut on the Today page
            { title: 'Far Future Draw', date: d(31 + 5), items: [] }, // past the 7-day lookahead
        ],
        calendar: [
            { title: 'Thermal Core Draw', category: 'draw', date: d(15), endDate: d(24, 12) }, // ending soon, leaves first
            { title: 'COD Point Rush Week 8', category: 'event', date: d(23), endDate: d(30) },
            { title: 'Halloween Haunt Event', category: 'event', date: d(16), endDate: d(25) }, // ending soon
            { title: 'Long Event', category: 'event', date: d(10), endDate: d(31 + 10) },
            { title: 'Rebirth Island BR', category: 'playlist', date: d(27), endDate: d(31 + 3) },
            { title: 'Old Event', category: 'event', date: d(1), endDate: d(5) }, // over
        ],
        ...overrides,
    };
}
const titles = list => list.map(e => e.title);
const text = components => JSON.stringify(components);
function count(components) {
    let n = 0;
    const walk = c => { n++; (c.components || []).forEach(walk); if (c.accessory) walk(c.accessory); };
    components.forEach(walk);
    return n;
}

t('the game day runs from the last 00:00 UTC to the next', () => {
    assert.deepStrictEqual(gameDay(NOW), { start: Date.UTC(2026, 9, 23), next: Date.UTC(2026, 9, 24) });
});

t('Live now lists everything live except what is ending soon: no end first, then the last to leave down to the first', () => {
    assert.deepStrictEqual(titles(todaySections(doc(), NOW).liveNow), ['Deepstar Wraith Mythic Drop', 'Old Mythic Drop', 'Long Event', 'COD Point Rush Week 8']);
});

t('Ending soon holds what is live and ends within 2 days, the one leaving quickest at the bottom', () => {
    assert.deepStrictEqual(titles(todaySections(doc(), NOW).endingSoon), ['Halloween Haunt Event', 'Thermal Core Draw']);
});

t('Going live holds what starts by the next reset', () => {
    assert.deepStrictEqual(titles(todaySections(doc(), NOW).goingLive), ['Widow Bite Draw']);
});

t('a draw shows its best item tier; an event and a playlist their own icons', () => {
    const emojis = require('../utils/emojiMap');
    const s = todaySections(doc(), NOW);
    assert.strictEqual(s.liveNow.find(e => e.title.startsWith('Deepstar')).icon, emojis.mythic);
    assert.strictEqual(s.goingLive[0].icon, emojis.legendary);
    assert.strictEqual(s.days[0].entries.find(e => e.title === 'Rebirth Island BR').icon, emojis.modes);
});

t('/today has no day list; the Today page shows the next 2 days with something', () => {
    const today = text(buildTodayBody(doc(), { nowMs: NOW }));
    assert.ok(!today.includes('Tue, Oct 27') && !today.includes('Double Tap Draw'));
    const page = text(buildTodayBody(doc(), { nowMs: NOW, withDays: true }));
    assert.ok(page.includes('**Tue, Oct 27**') && page.includes('**Wed, Oct 28**'));
    assert.ok(!page.includes('Longquan Sword Draw'), 'a 3rd day is cut');
});

t('with nothing going live, the Going live heading is left out entirely', () => {
    const out = text(buildTodayBody(doc({ newDraws: [] }), { nowMs: NOW }));
    assert.ok(!out.includes('Going live'));
    assert.ok(!/nothing goes live/i.test(out));
});

t('"Nothing is currently live" shows only when nothing at all is live, with no divider before what follows', () => {
    assert.ok(!text(buildTodayBody(doc(), { nowMs: NOW })).includes('Nothing is currently live'));
    const quiet = doc({ newDraws: [{ title: 'Widow Bite Draw', date: d(24), items: [] }], returningDraws: [], calendar: [] });
    const body = buildTodayBody(quiet, { nowMs: NOW });
    const at = body.findIndex(c => c.type === 10 && c.content.includes('Nothing is currently live'));
    assert.ok(at >= 0);
    assert.strictEqual(body[at + 1].type, 10, 'the next block follows straight on');
});

t('the footer sits after an empty space, with the daily reset first, a TBD end as TBD, and a past end left out', () => {
    const body = buildTodayBody(doc({ rankEndTBD: true, rankEnd: null, dmzEnd: d(1) }), { nowMs: NOW });
    const footer = body.at(-1).content;
    assert.deepStrictEqual(body.at(-2), { type: 14, spacing: 1, divider: false });
    assert.ok(footer.startsWith(`-# 🔄 Daily reset <t:${Date.UTC(2026, 9, 24) / 1000}:R>`), footer);
    assert.ok(footer.includes('Rank TBD'));
    assert.ok(!footer.includes('DMZ'));
});

t("the next season's line shows from 96 hours before it starts, from the Next Season draft", () => {
    const draft = start => ({ active: true, currentSeasonTitle: 'Season 8 — Next', bpStart: start });
    // The season's own emoji leads (utils/seasonEmoji.js falls back to the season number's), so match after it.
    assert.match(seasonTeaser(doc({ draft: draft(d(25)) }), NOW), /^### (<a?:\w+:\d+> )?Season 8 — Next · starts <t:\d+:R>$/);
    assert.strictEqual(seasonTeaser(doc({ draft: draft(d(28)) }), NOW), null, 'more than 96 hours out');
    assert.strictEqual(seasonTeaser(doc({ draft: { ...draft(d(25)), active: false } }), NOW), null, 'no draft');
    assert.ok(text(buildTodayContainer(doc({ draft: draft(d(25)) }), { nowMs: NOW, accentColor: 1 })).includes('Season 8 — Next · starts'));
});

t('/today carries the seasonal nav under the panel, with every slot live', () => {
    const msg = buildTodayContainer(doc(), { nowMs: NOW, accentColor: 1 });
    assert.deepStrictEqual(msg[1].components.map(b => b.custom_id), ['nav_calendar', 'nav_draws', 'nav_prices', 'nav_patchnotes', 'nav_seasonend']);
    assert.ok(msg[1].components.every(b => !b.disabled));
    assert.ok(count(msg) <= 40);
});

t("/calendar's Today page: its own title, the pager starting at Today, the filter, under 40 components with unique ids", () => {
    const msg = calendar.buildContainer(doc(), calendar.TODAY_PAGE, 1, true, 0);
    const out = text(msg);
    assert.ok(msg[0].components[0].content.includes('Season Calendar'));
    assert.ok(out.includes('Today · 1/4'));
    assert.ok(out.includes('"custom_id":"calsel_3"'));
    assert.ok(count(msg) <= 40, `components: ${count(msg)}`);
    const ids = out.match(/"custom_id":"[^"]+"/g) || [];
    assert.strictEqual(new Set(ids).size, ids.length);
});

t('Today is a page pick: with Lucky Draws it walks Today then Draws, and the Today page shows only draws', () => {
    const mask = calendar.TODAY_BIT | 8;
    const out = text(calendar.buildContainer(doc(), calendar.TODAY_PAGE, 1, false, mask));
    assert.ok(out.includes('Today · 1/2'));
    assert.ok(!out.includes('COD Point Rush Week 8') && out.includes('Deepstar Wraith Mythic Drop'));
});

t('a status pick does not narrow the Today page (option C)', () => {
    const out = text(calendar.buildContainer(doc(), calendar.TODAY_PAGE, 1, false, calendar.TODAY_BIT | 2 /* Past/Ended */));
    assert.ok(out.includes('COD Point Rush Week 8'));
});

t("/calendar's slash options: Today under page, not under filter", () => {
    const opts = calendar.data.toJSON().options;
    assert.ok(opts.find(o => o.name === 'page').choices.some(c => c.value === 'today' && c.name === 'Today'));
    assert.ok(!opts.find(o => o.name === 'filter').choices.some(c => c.value === 'today'));
    assert.ok(calendar.FILTER_OPTIONS.some(o => o.value === 'today'));
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
