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

t('the pop-up: New Draws, Returning Draws, CP Balance, CP Region, Calculation Visibility, in his words, and discord.js accepts it', () => {
    const { ModalBuilder } = require('discord.js');
    const m = buildPriceDrawsModal(draws, 'region_20');
    assert.deepStrictEqual(m.components.map(c => c.label), ['New Draws', 'Returning Draws', 'CP Balance', 'CP Region', 'Calculation Visibility']);
    assert.strictEqual(m.components[0].description, 'Select any draws you want to calculate');
    assert.strictEqual(m.components[2].description, 'Set CP you already own or leave it blank');
    assert.strictEqual(m.components[4].component.placeholder, '(Optional) Choose message visibility...');
    assert.strictEqual(m.components[4].component.required, false);
    assert.deepStrictEqual(m.components[0].component.options.map(o => o.value), ['a', 'b']);
    assert.deepStrictEqual(m.components[1].component.options.map(o => o.value), ['c']);
    assert.strictEqual(m.components[3].component.options.find(o => o.default).value, 'region_20');
    assert.ok(m.custom_id.startsWith('calc~drawspicksave'), m.custom_id);
    assert.doesNotThrow(() => new ModalBuilder(m).toJSON());
});

t('a list with no returning draws leaves that dropdown out', () => {
    const m = buildPriceDrawsModal(draws.filter(d => d.kind === 'new'));
    assert.deepStrictEqual(m.components.map(c => c.label), ['New Draws', 'CP Balance', 'CP Region', 'Calculation Visibility']);
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

t('/calendar: finished first by when they ended, then live by when they end, then upcoming by when they start; each with its dot and status (2026-10-21 14:39 EDT)', () => {
    const cal = require('../commands/calendar');
    const emojis = require('../utils/emojiMap');
    const now = day(2026, 10, 21).getTime();
    const doc = { bpEnd: day(2026, 11, 12), bpEndTBD: false };
    const entries = [
        { title: 'Soon B', date: day(2026, 10, 30), endDate: day(2026, 11, 5) },
        { title: 'Live late', date: day(2026, 10, 1), endDate: day(2026, 11, 20) },
        { title: 'Over late', date: day(2026, 9, 1), endDate: day(2026, 10, 15) },
        { title: 'Soon A', date: day(2026, 10, 25), dateOnly: true, drawType: 'returning' },
        { title: 'Live early', date: day(2026, 10, 1), endDate: day(2026, 10, 28) },
        { title: 'Back', date: day(2026, 10, 10), dateOnly: true, drawType: 'returning' },
        { title: 'Over early', date: day(2026, 9, 1), endDate: day(2026, 10, 2) },
        { title: 'Longquan Sword Draw', date: null }
    ];
    const order = [...entries].sort(cal.compareEntries(doc, now)).map(e => e.title);
    assert.deepStrictEqual(order, ['Over early', 'Over late', 'Live early', 'Live late', 'Back', 'Soon A', 'Soon B', 'Longquan Sword Draw']);
    const line = title => cal.buildEntryLine(entries.find(e => e.title === title), doc, now);
    assert.ok(line('Over early').startsWith(`${emojis.redDotGlow} ~~**Over early**~~\n-# `) && line('Over early').includes('Ended <t:'), line('Over early'));
    assert.ok(line('Live early').startsWith(`${emojis.greenDotGlow} **Live early**`) && line('Live early').includes('**Live** · ends <t:'));
    assert.ok(line('Back').includes('**Back** · returned <t:'));
    assert.ok(line('Soon A').startsWith(`${emojis.whiteDotGlow} **Soon A**`) && line('Soon A').includes('Returns <t:'));
    assert.ok(line('Longquan Sword Draw').endsWith('Releases TBA'));
});

t('/calendar: a looping pager over the pages the filter keeps, and a filter dropdown with his six options (2026-10-21 15:32 EDT)', () => {
    const calendar = require('../commands/calendar');
    const now = Date.now(), DAYMS = 864e5;
    const doc = { currentSeasonTitle: 'Season 10: Test', newDraws: [], returningDraws: [], calendar: [
        { title: 'Over Event', category: 'event', date: new Date(now - 9 * DAYMS), endDate: new Date(now - 2 * DAYMS) },
        { title: 'Live Event', category: 'event', date: new Date(now - DAYMS), endDate: new Date(now + 3 * DAYMS) },
        { title: 'Soon Event', category: 'event', date: new Date(now + 2 * DAYMS), endDate: new Date(now + 5 * DAYMS) },
        { title: 'Live Mode', category: 'playlist', date: new Date(now - DAYMS), endDate: new Date(now + 3 * DAYMS) }
    ] };
    const json = (page, mode) => JSON.stringify(calendar.buildContainer(doc, page, undefined, false, mode));
    const select = JSON.parse(json(1, 0)).flatMap(c => c.components || []).flatMap(c => c.components || []).find(c => c.type === 3);
    assert.deepStrictEqual(select.options.map(o => o.label), ['Live', 'Past/Ended', 'Upcoming', 'Lucky Draws', 'Special Events', 'Playlists & Modes']);
    assert.strictEqual(select.min_values, 0, 'clearing every pick is the full timeline');
    assert.ok(!/Draws \| Events|"label":"Modes"/.test(json(1, 0)), 'the three page buttons are gone');
    // Statuses filter the entries.
    const liveOnly = json(1, calendar.filterMask('live'));
    assert.ok(liveOnly.includes('Live Event') && !liveOnly.includes('Over Event') && !liveOnly.includes('Soon Event'));
    assert.ok(json(1, 'active').includes('Soon Event') && !json(1, 'active').includes('Over Event'), "an old panel's Active view is Live + Upcoming");
    // Pages: all three loop (Draws <- Events -> Modes); picking Events + Modes walks only those, and a left-out page falls back.
    assert.deepStrictEqual(json(1, 0).match(/calpage_\d_m0_[pn]/g), ['calpage_0_m0_p', 'calpage_2_m0_n']);
    const mask = calendar.filterMask('events') | calendar.filterMask('modes');
    assert.deepStrictEqual(json(1, mask).match(/calpage_\d_m\d+_[pn]/g), [`calpage_2_m${mask}_p`, `calpage_2_m${mask}_n`]);
    assert.ok(json(0, mask).includes('Live Event'), 'Draws is left out, so it opens on Events');
    assert.ok(!/calpage_\d_m/.test(json(1, calendar.filterMask('events'))), 'one page kept: no pager');
    // An empty filtered page keeps its heading and leads with the warning icon (2026-10-21 15:53 EDT).
    const noMatch = { ...doc, calendar: doc.calendar.filter(e => e.title === 'Over Event') };
    const emptyJson = JSON.stringify(calendar.buildContainer(noMatch, 1, undefined, false, calendar.filterMask('live')));
    assert.ok(/## [^"]*Special Events.*:Warn:.*Nothing on this page matches the filter/.test(emptyJson), emptyJson.slice(0, 600));
    const navCalendar = (mode) => JSON.parse(json(1, mode)).find(c => c.type === 1 && c.components.some(b => b.custom_id === 'nav_calendar')).components.find(b => b.custom_id === 'nav_calendar');
    assert.deepStrictEqual([navCalendar(calendar.filterMask('live')).label, navCalendar(calendar.filterMask('live')).style, !!navCalendar(calendar.filterMask('live')).disabled], ['Full Calendar', 1, false], 'filtered: a live blurple Full Calendar');
    assert.deepStrictEqual([navCalendar(0).label, !!navCalendar(0).disabled], ['Calendar', true], 'unfiltered: the usual disabled Calendar');
    const hint = (mode) => json(1, mode).match(/-# Viewing [^"]+/)[0];
    assert.strictEqual(hint(0), '-# Viewing **Draws**, **Events**, and **Playlists & Modes**');
    assert.strictEqual(hint(calendar.filterMask('draws') | calendar.filterMask('events')), '-# Viewing **Draws** and **Events**');
    assert.strictEqual(hint(calendar.filterMask('modes')), '-# Viewing **Playlists & Modes**');
    assert.ok(json(1, 0).includes('Filter the timeline...'));
});

t('the owner is DM\'d once about a returning draw that went live in the last week with no end date (2026-10-21 14:39 EDT)', () => {
    const { drawsNeedingEndDate, reminderComponents, drawForEndCustomId } = require('../utils/drawEndReminder');
    const now = day(2026, 10, 21).getTime();
    const doc = {
        returningDraws: [
            { title: 'Thermal Core Draw', date: day(2026, 10, 18) },
            { title: 'Molten Fusion Draw', date: day(2026, 10, 17) },
            { title: 'Double Tap Draw', date: day(2026, 10, 25) },
            { title: 'Void Implosion Draw', date: day(2026, 9, 20) },
            { title: 'Bloody Seas Draw', date: day(2026, 10, 19) },
            { title: 'Longquan Sword Draw', date: null }
        ],
        calendar: [{ title: 'Molten Fusion Draw', category: 'draw', date: day(2026, 10, 17), endDate: day(2026, 10, 30) }],
        drawEndReminders: ['bloody seas draw']
    };
    assert.deepStrictEqual(drawsNeedingEndDate(doc, now).map(d => d.title), ['Thermal Core Draw']);
    const card = reminderComponents(drawsNeedingEndDate(doc, now));
    const button = card[0].components.find(c => c.type === 9).accessory;
    assert.strictEqual(button.label, 'Set End Date');
    assert.strictEqual(card[0].accent_color, 7032445, "/draws' accent");
    assert.strictEqual(button.emoji.name, 'DB_Edit', "/manage's database edit emoji");
    // After he sets it: the same card shows the end date and keeps the button as Change End Date (2026-10-21 14:52 EDT).
    const thermal = doc.returningDraws[0];
    const saved = { ...doc, calendar: [...doc.calendar, { title: 'Thermal Core Draw', category: 'draw', date: day(2026, 10, 18), endDate: day(2026, 10, 27) }] };
    const after = reminderComponents([thermal], saved);
    const afterButton = after[0].components.find(c => c.type === 9).accessory;
    assert.strictEqual(afterButton.label, 'Change End Date');
    assert.strictEqual(afterButton.custom_id, button.custom_id, 'the button still opens the same draw');
    assert.ok(JSON.stringify(after).includes('Ends <t:') && JSON.stringify(after).includes('saved'));
    const { drawsOnMessage, isReminderMessage } = require('../utils/drawEndReminder');
    assert.deepStrictEqual(drawsOnMessage(doc, { components: card }).map(d => d.title), ['Thermal Core Draw'], 'a submit finds the card\'s draws');
    assert.ok(isReminderMessage({ components: card }) && !isReminderMessage({ components: [] }) && !isReminderMessage(undefined));
    assert.ok(button.custom_id.startsWith('mng_drawend_') && button.custom_id.length <= 100, button.custom_id);
    assert.strictEqual(drawForEndCustomId(doc, button.custom_id).title, 'Thermal Core Draw', 'the button finds its draw again');
    const { msUntilNextDailyRun } = require('../utils/drawEndReminder');
    assert.strictEqual(msUntilNextDailyRun(Date.UTC(2026, 9, 21, 18, 50)), (5 * 60 + 15) * 60 * 1000, 'from 14:50 EDT it waits until 00:05 UTC (20:05 EDT)');
    assert.strictEqual(msUntilNextDailyRun(Date.UTC(2026, 9, 22, 0, 5)), 24 * 60 * 60 * 1000, 'right at 00:05 UTC it waits a full day');
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\ncommandRefresh: all passed');
