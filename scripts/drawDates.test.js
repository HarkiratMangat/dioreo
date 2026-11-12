// scripts/drawDates.test.js the draw forms' "Start - End" box (2026-11-04 00:59 EST, Harkirat: "do it like how the season title command does start/end dates"). Pure, no database: reading the box, writing it back, and which calendar write a submit needs.
const assert = require('assert');
const { formatDrawDates, formatDrawDatesForBulk, parseDrawDates, planEndRow } = require('../utils/drawDates');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
const day = (s) => new Date(`${s}T00:00:00.000Z`);
const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

check('the box reads one date, and a range the way the season box does', () => {
    const one = parseDrawDates('September 10, 2026');
    assert.ok(one.ok && iso(one.start) === '2026-09-10' && one.end === null, JSON.stringify(one));
    const range = parseDrawDates('September 10, 2026 - November 12, 2026');
    assert.ok(range.ok && iso(range.start) === '2026-09-10' && iso(range.end) === '2026-11-13', JSON.stringify(range)); // a listed end day is inclusive (2026-11-11 21:53 EST)
    const shortRange = parseDrawDates('Sep 10 - Nov 12');
    assert.ok(shortRange.ok && iso(shortRange.end).endsWith('-11-13'), JSON.stringify(shortRange));
    const isoRange = parseDrawDates('2026-09-10 - 2026-11-12');
    assert.ok(isoRange.ok && iso(isoRange.end) === '2026-11-12', JSON.stringify(isoRange));
    assert.ok(parseDrawDates('2026-09-10').ok, 'a bare ISO date (the old pre-fill) still reads');
});

check('an end of TBD is no end, and an end that cannot be read is REPORTED, never dropped', () => {
    const tbd = parseDrawDates('September 10, 2026 - TBD');
    assert.ok(tbd.ok && tbd.end === null);
    const bad = parseDrawDates('September 10, 2026 - garbage');
    assert.strictEqual(bad.ok, false, 'a typo in the end must not save a draw with no end and say nothing');
    assert.ok(/end date/i.test(bad.error) && /nothing was saved/.test(bad.error), bad.error);
    assert.strictEqual(parseDrawDates('').ok, false);
    assert.strictEqual(parseDrawDates('not a date').ok, false);
});

check('a range typed back to front is read in date order, as in the season box, and a year-less one rolls into next year', () => {
    const r = parseDrawDates('November 12, 2026 - September 10, 2026');
    assert.ok(r.ok && iso(r.start) === '2026-09-10' && iso(r.end) === '2026-11-13', JSON.stringify(r));
    const wrap = parseDrawDates('Dec 20 - Jan 5');
    assert.ok(wrap.ok && iso(wrap.end).endsWith('-01-06') && wrap.end > wrap.start, JSON.stringify(wrap));
});

check('the box writes back what it reads, and a draw with no end shows the start alone', () => {
    assert.strictEqual(formatDrawDates(day('2026-09-10'), day('2026-11-13')), 'September 10, 2026 - November 12, 2026', 'a stored Nov 13 00:00 end is the listed day Nov 12');
    assert.strictEqual(formatDrawDates(day('2026-09-10'), null), 'September 10, 2026');
    assert.strictEqual(formatDrawDates(undefined, day('2026-11-12')), '', 'an end with no start is not shown as a start');
    assert.strictEqual(formatDrawDates('garbage', null), '');
    const back = parseDrawDates(formatDrawDates(day('2026-09-10'), day('2026-11-13')));
    assert.ok(back.ok && iso(back.start) === '2026-09-10' && iso(back.end) === '2026-11-13', 'round trip');
});

check('the copyable retry line has no comma and reads back, with and without an end', () => {
    const both = formatDrawDatesForBulk(day('2026-09-10'), day('2026-11-13'));
    assert.strictEqual(both, 'September 10 2026 - November 12 2026');
    assert.strictEqual(formatDrawDatesForBulk(day('2026-09-10'), null), 'September 10 2026');
    assert.ok(!both.includes(','));
    const back = parseDrawDates(both);
    assert.ok(back.ok && iso(back.start) === '2026-09-10' && iso(back.end) === '2026-11-13', JSON.stringify(back));
    assert.ok(parseDrawDates('September 10 2026').ok);
});

const row = (over = {}) => ({ _id: 'row1', title: 'Row Title', date: day('2026-09-10'), endDate: null, isOngoing: true, category: 'draw', isDoubleCP: false, ...over });

check('no row and no end writes nothing; no row and an end adds one draw row', () => {
    assert.strictEqual(planEndRow({ row: null, title: 'T', start: day('2026-09-10'), end: null }), null);
    const add = planEndRow({ row: null, title: 'T', start: day('2026-09-10'), end: day('2026-11-12') });
    assert.strictEqual(add.type, 'calendar.add');
    assert.deepStrictEqual([add.payload.category, add.payload.isOngoing, iso(add.payload.endDate), add.payload.title], ['draw', false, '2026-11-12', 'T']);
});

check('an edit of something else leaves the row alone, even when the row title differs from the draw title', () => {
    const r = row();
    assert.strictEqual(planEndRow({ row: r, prev: { title: 'Draw Title', start: day('2026-09-10') }, title: 'Draw Title', start: day('2026-09-10'), end: null }), null,
        'an ongoing row that stays ongoing is not rewritten; and a row title that differs from the draw title is not a rename');
});

check('a typed end sets the row (keeping its own title and its Double CP flag)', () => {
    const r = row({ isDoubleCP: true });
    const op = planEndRow({ row: r, prev: { title: 'Draw Title', start: day('2026-09-10') }, title: 'Draw Title', start: day('2026-09-10'), end: day('2026-11-12') });
    assert.strictEqual(op.type, 'calendar.edit');
    assert.strictEqual(op.target.elementId, 'row1');
    assert.deepStrictEqual([op.payload.title, op.payload.isOngoing, iso(op.payload.endDate), op.payload.isDoubleCP], ['Row Title', false, '2026-11-12', true],
        'the row keeps its own title, and a draw row marked Double CP stays so (Quick Add used to reset it)');
});

check('a deleted end clears it back to ongoing, and a changed end moves it', () => {
    const r = row({ endDate: day('2026-11-12'), isOngoing: false });
    const cleared = planEndRow({ row: r, prev: { title: 'T', start: day('2026-09-10') }, title: 'T', start: day('2026-09-10'), end: null });
    assert.deepStrictEqual([cleared.payload.endDate, cleared.payload.isOngoing], [null, true]);
    const moved = planEndRow({ row: r, prev: { title: 'T', start: day('2026-09-10') }, title: 'T', start: day('2026-09-10'), end: day('2026-11-20') });
    assert.strictEqual(iso(moved.payload.endDate), '2026-11-20');
    assert.strictEqual(planEndRow({ row: r, prev: { title: 'T', start: day('2026-09-10') }, title: 'T', start: day('2026-09-10'), end: day('2026-11-12') }), null, 'an end re-typed unchanged writes nothing');
});

check('the row follows a rename and a new start', () => {
    const r = row({ endDate: day('2026-11-12'), isOngoing: false });
    const renamed = planEndRow({ row: r, prev: { title: 'Old', start: day('2026-09-10') }, title: 'New', start: day('2026-09-10'), end: day('2026-11-12') });
    assert.strictEqual(renamed.payload.title, 'New');
    const moved = planEndRow({ row: r, prev: { title: 'T', start: day('2026-09-10') }, title: 'T', start: day('2026-09-12'), end: day('2026-11-12') });
    assert.strictEqual(iso(moved.payload.date), '2026-09-12');
});

const { parseBulkDrawList, formatDrawsAsBulkText } = require('../utils/adminParser');
const first = (line) => parseBulkDrawList(line)[0];

check('Add Multiple reads a Start - End date in every shape the season box takes, and still reads a single date', () => {
    for (const line of [
        'X Draw, type: lcw, l A - B, l C - D, 2026-09-10 - 2026-11-12, https://x.test/y.jpg',
        'X Draw, l A - B, September 10, 2026 - November 12, 2026',
        'X Draw, l A - B, September 10, 2026 - November 12, 2026, https://x.test/y.jpg',
        'X Draw, l A - B, September 10 2026 - November 12 2026',
    ]) {
        const d = first(line);
        assert.ok(d, `skipped: ${line}`);
        // A typed end day is inclusive (2026-11-11 21:55 EST); an ISO day is read as it is (the portal's own form).
        assert.deepStrictEqual([iso(d.date), iso(d.endDate)], ['2026-09-10', /2026-11-12, https/.test(line) && /^X Draw, type/.test(line) ? '2026-11-12' : '2026-11-13'], line);
        assert.ok(d.items.length >= 1 && d.items.every(i => i.name), `items kept: ${line}`);
    }
    const one = first('X Draw, l A - B, July 15, 2026');
    assert.deepStrictEqual([iso(one.date), one.endDate], ['2026-07-15', undefined], 'a single date has no endDate key at all');
    const withLink = first('X Draw, l M4 - Void Implosion, e Dusk - Otherworld, July 15, https://x.test/y.jpg');
    assert.strictEqual(withLink.items.length, 2, 'an item with " - " in its name is not read as a range');
    assert.strictEqual(withLink.endDate, undefined);
});

check('a range never swallows the title or an item', () => {
    const d = first('Void Draw, l M4 - Void, August 5 - August 20');
    assert.strictEqual(d.title, 'Void Draw');
    assert.deepStrictEqual(d.items.map(i => i.name), ['M4 - Void']);
    assert.ok(!first('Void Draw, August 5 - August 20'), 'a line with no item is still malformed');
});

check('Export writes a draw\'s end beside its date, and the line reads back to the same dates', () => {
    const draw = { title: 'Row Draw', date: day('2026-09-10'), items: [{ tier: 'legendary', name: 'A - B' }], thumbnailUrl: 'https://x.test/y.jpg', priceType: '' };
    const withEnd = formatDrawsAsBulkText([draw], () => ({ endDate: day('2026-11-13') }));
    assert.ok(withEnd.includes('September 10, 2026 - November 12, 2026'), withEnd);
    const back = first(withEnd);
    assert.deepStrictEqual([iso(back.date), iso(back.endDate)], ['2026-09-10', '2026-11-13']);
    const without = formatDrawsAsBulkText([draw], () => null);
    assert.ok(!without.includes(' - November'), 'no row, no end');
    assert.strictEqual(formatDrawsAsBulkText([draw]), without, 'callers that pass no lookup are unchanged');
});

// Lead review of #249 (2026-11-04 09:26 EST). Each of these failed on the branch as the first thread left it.
check('an Add with one date leaves an existing /calendar row alone (it used to clear the row\'s end and make it All Season)', () => {
    const r = row({ endDate: day('2026-11-12'), isOngoing: false });
    assert.strictEqual(planEndRow({ row: r, title: 'Row Title', start: day('2026-09-10'), end: null }), null);
    const typed = planEndRow({ row: r, title: 'Row Title', start: day('2026-09-10'), end: day('2026-11-20') });
    assert.ok(typed && typed.type === 'calendar.edit' && iso(typed.payload.endDate) === '2026-11-20', 'an Add that types an end still writes it');
});

check('a dash typed with no spaces is still a range, never a wrong single date', () => {
    for (const [text, start, end] of [['July 15-August 20', '-07-15', '-08-20'], ['Aug 6-Nov 17', '-08-06', '-11-17'], ['7/15-8/20', '-07-15', '-08-20'], ['September 10, 2026-November 12, 2026', '2026-09-10', '2026-11-12'], ['July 15–August 20', '-07-15', '-08-20']]) {
        const r = parseDrawDates(text);
        // The listed end day is the day before the stored end (inclusive ends, 2026-11-11 21:56 EST).
        assert.ok(r.ok && iso(r.start).endsWith(start) && r.end && iso(new Date(r.end - 864e5)).endsWith(end), `${text}: ${JSON.stringify(r)}`);
    }
    assert.strictEqual(iso(parseDrawDates('2026-09-10').start), '2026-09-10', 'an ISO date\'s own dashes are not a range');
    const d = first('X Draw, l A - B, July 15-August 20');
    assert.ok(d && iso(d.date).endsWith('-07-15') && iso(new Date(d.endDate - 864e5)).endsWith('-08-20'), 'Add Multiple reads it too');
});

check('text the date reader only half understood is refused, not saved as its first date', () => {
    const r = parseDrawDates('July 15 maybe 20');
    assert.ok(!r.ok, JSON.stringify(r));
    assert.ok(parseDrawDates('September 10, 2026').ok && parseDrawDates('today').ok, 'plain dates still read');
});

check('the game\'s countdown on its own is the end, from today or from the start Edit keeps (2026-11-11 11:40 EST click test)', () => {
    const now = new Date('2026-11-11T16:40:00Z');
    const r = parseDrawDates('13d 23h', { now });
    assert.ok(r.ok, JSON.stringify(r));
    assert.strictEqual(r.start.toISOString(), '2026-11-11T00:00:00.000Z', 'today at 00:00 UTC, Quick Add\'s rule');
    assert.strictEqual(r.end.toISOString(), '2026-11-26T00:00:00.000Z', 'the midnight inside the countdown window');
    const kept = parseDrawDates('13d 23h', { now, start: new Date('2026-11-01T00:00:00Z') });
    assert.strictEqual(kept.start.toISOString(), '2026-11-01T00:00:00.000Z', 'Edit keeps the draw\'s start');
    assert.ok(!parseDrawDates('2h', { now, start: new Date('2026-12-01T00:00:00Z') }).ok, 'a countdown ending before the start is refused');
    assert.ok(require('../utils/drawForm').readDrawBox('Zz Draw\n13d 23h\nSeason 7', { allowSeason: true }).dates === '13d 23h', 'the Draw box takes it as the dates line');
});

const { calendarRowFor } = require('../utils/drawEndReminder');
check('a draw never takes a sibling draw\'s /calendar row', () => {
    const champ = "Street Fighter: Champion's Collection Series Armory (Weapons)";
    const hero = "Street Fighter: Hero's Collection Series Armory (Operators)";
    const champRow = { _id: 'c', title: champ, category: 'draw', date: day('2026-10-16') };
    const doc = { newDraws: [], returningDraws: [{ title: champ }, { title: hero }], calendar: [champRow] };
    assert.strictEqual(calendarRowFor(doc, champ), champRow);
    assert.strictEqual(calendarRowFor(doc, hero), null, 'Hero has no row of its own');
    assert.strictEqual(calendarRowFor({ ...doc, returningDraws: [{ title: champ }] }, hero), null, 'nor while Hero is still being added');
    const heroRow = { _id: 'h', title: hero, category: 'draw', date: day('2026-10-17') };
    assert.strictEqual(calendarRowFor({ ...doc, calendar: [champRow, heroRow] }, hero), heroRow);
    const loose = { newDraws: [{ title: 'Hunger Eternal Draw' }], returningDraws: [], calendar: [{ _id: 'x', title: 'Hunger Eternal', category: 'draw' }] };
    assert.ok(calendarRowFor(loose, 'Hunger Eternal Draw'), 'a row titled a little differently is still its draw\'s');
});

process.exit(failures ? 1 : 0);
