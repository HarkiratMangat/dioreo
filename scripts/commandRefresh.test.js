// scripts/commandRefresh.test.js
//
// The command-refresh pass (2026-10-21 10:22 EDT): season start dates typed as a range on /manage's season lines, the progress bar they feed in /season end, and /draws' Price These Draws button with its pop-up. Pure functions only, no database.
const assert = require('assert');
const { splitTitleDate, parseAdminDateRange, formatAdminDate } = require('../utils/adminParser');
const { applyFields } = require('../core/ops/season');
const { progressLine } = require('../commands/seasonend');
const { buildPriceDrawsModal } = require('../commands/drawCalculator');
const { buildContainer } = require('../commands/draws');

let failed = 0;
function t(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${String(err.message).split('\n').join('\n      ')}`); }
}
const day = (y, m, d) => new Date(Date.UTC(y, m - 1, d));

t('the box\'s own pre-fill splits back into the title and its date (it used to split on the last comma)', () => {
    const line = `BP Season 7: Terminated, ${formatAdminDate(day(2026, 11, 17))}`;
    assert.deepStrictEqual(splitTitleDate(line), { title: 'BP Season 7: Terminated', dateStr: 'November 17, 2026' });
});

t('a comma inside a title stays in the title', () => {
    assert.deepStrictEqual(splitTitleDate('Season 7, Part 2, November 17'), { title: 'Season 7, Part 2', dateStr: 'November 17' });
});

t('a mistyped date is still split off, so it is reported rather than folded into the title', () => {
    assert.deepStrictEqual(splitTitleDate('Battle Pass, nonsense'), { title: 'Battle Pass', dateStr: 'nonsense' });
});

t('a range gives a start and an end, each at midnight UTC', () => {
    const r = parseAdminDateRange('August 6, 2026 - November 17, 2026');
    assert.strictEqual(r.start.toISOString(), '2026-08-06T00:00:00.000Z');
    assert.strictEqual(r.end.toISOString(), '2026-11-17T00:00:00.000Z');
    assert.strictEqual(r.endTBD, false);
    assert.ok(parseAdminDateRange('Aug 6 to Nov 17'), '"to" works as the separator');
});

t('a start with a TBD end keeps the start and marks the end TBD', () => {
    const r = parseAdminDateRange('Aug 6 - TBD');
    assert.strictEqual(r.start.toISOString().slice(0, 10), `${r.start.getUTCFullYear()}-08-06`);
    assert.strictEqual(r.end, null);
    assert.strictEqual(r.endTBD, true);
});

t('a single date is not a range', () => {
    assert.strictEqual(parseAdminDateRange('November 17, 2026'), null);
    assert.strictEqual(parseAdminDateRange(''), null);
});

t('a season line with a range sets the start; a single date clears it; a blank line changes nothing', () => {
    const current = { title: 'Battle Pass', start: null, end: day(2026, 11, 1), endTBD: false };
    const skipped = [];
    const ranged = applyFields(current, {}, 'bp', 'Battle Pass, Aug 6, 2026 - Nov 17, 2026', 'Battle Pass', skipped);
    assert.strictEqual(ranged.start.toISOString(), '2026-08-06T00:00:00.000Z');
    assert.strictEqual(ranged.end.toISOString(), '2026-11-17T00:00:00.000Z');
    const single = applyFields(ranged, {}, 'bp', 'Battle Pass, Nov 20, 2026', 'Battle Pass', skipped);
    assert.strictEqual(single.start, null);
    assert.strictEqual(single.end.toISOString(), '2026-11-20T00:00:00.000Z');
    const untouched = applyFields(ranged, {}, 'bp', '', 'Battle Pass', skipped);
    assert.strictEqual(untouched.start, ranged.start);
    assert.deepStrictEqual(skipped, []);
});

t('a form sending its own start field (the portal\'s shape) sets it, and an unreadable one is reported', () => {
    const current = { title: 'Battle Pass', start: null, end: day(2026, 11, 17), endTBD: false };
    const skipped = [];
    const out = applyFields(current, { bpStart: 'August 6, 2026' }, 'bp', undefined, 'Battle Pass', skipped);
    assert.strictEqual(out.start.toISOString(), '2026-08-06T00:00:00.000Z');
    applyFields(current, { bpStart: 'nonsense' }, 'bp', undefined, 'Battle Pass', skipped);
    assert.deepStrictEqual(skipped, ['Battle Pass start']);
});

t('the bar: 10 blocks, the percentage and the day, only while the season runs', () => {
    const start = day(2026, 8, 6), end = day(2026, 11, 17).getTime();
    assert.strictEqual(progressLine(start, end, day(2026, 10, 21).getTime() + 14 * 3600e3), '-# ▰▰▰▰▰▰▰▱▱▱ **74%** · Day 77 of 103');
    assert.strictEqual(progressLine(start, end, start.getTime()), '-# ▱▱▱▱▱▱▱▱▱▱ **0%** · Day 1 of 103');
    assert.strictEqual(progressLine(null, end, Date.now()), null, 'no start, no bar');
    assert.strictEqual(progressLine(start, null, Date.now()), null, 'no end, no bar');
    assert.strictEqual(progressLine(start, end, start.getTime() - 1), null, 'before the start, no bar');
    assert.strictEqual(progressLine(start, end, end), null, 'ended, no bar');
});

const draws = [
    { id: 'a', kind: 'new', title: 'Judgment Day', drawKey: 'mythicWeapon' },
    { id: 'b', kind: 'new', title: 'Undead Legion Series Armory', drawKey: 'armoryLegendaryWeapon', size: 4 },
    { id: 'c', kind: 'returning', title: 'Molten Fusion Draw', drawKey: 'legendaryGunReactive' }
];

t('the pop-up: New Draws, Returning Draws, CP Balance, CP Region, and discord.js accepts it', () => {
    const { ModalBuilder } = require('discord.js');
    const m = buildPriceDrawsModal(draws, 'region_20');
    assert.deepStrictEqual(m.components.map(c => c.label), ['New Draws', 'Returning Draws', 'CP Balance', 'CP Region']);
    assert.deepStrictEqual(m.components[0].component.options.map(o => o.value), ['a', 'b']);
    assert.deepStrictEqual(m.components[1].component.options.map(o => o.value), ['c']);
    assert.strictEqual(m.components[3].component.options.find(o => o.default).value, 'region_20');
    assert.ok(m.custom_id.startsWith('calc~drawspicksave'), m.custom_id);
    assert.doesNotThrow(() => new ModalBuilder(m).toJSON());
});

t('a list with no returning draws leaves that dropdown out', () => {
    const m = buildPriceDrawsModal(draws.filter(d => d.kind === 'new'));
    assert.deepStrictEqual(m.components.map(c => c.label), ['New Draws', 'CP Balance', 'CP Region']);
});

function countComponents(list) {
    let n = 0;
    const walk = c => { n++; (c.components || []).forEach(walk); if (c.accessory) walk(c.accessory); };
    list.forEach(walk);
    return n;
}
const doc = priced => ({
    currentSeasonTitle: 'Season 7: Terminated',
    newDraws: Array.from({ length: 5 }, (_, i) => ({ title: `Draw ${i}`, date: day(2026, 8, 6 + i), items: [], priceType: priced && i === 0 ? 'mythicWeapon' : '' })),
    returningDraws: []
});

t('/draws shows Price These Draws only when a draw has a price type, and stays under 40 components', () => {
    const withButton = buildContainer(doc(true), 'new', 0);
    const ids = JSON.stringify(withButton);
    assert.ok(ids.includes('calc~drawspick~'), 'the button is there');
    assert.ok(countComponents(withButton) <= 40, `${countComponents(withButton)} components`);
    assert.ok(!JSON.stringify(buildContainer(doc(false), 'new', 0)).includes('calc~drawspick~'), 'no priced draw, no button');
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\ncommandRefresh: all passed');
