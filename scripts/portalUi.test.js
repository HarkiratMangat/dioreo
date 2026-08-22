// scripts/portalUi.test.js Render functions are PURE: state in, tree out. No DOM, no browser, no framework harness. That is the whole frontend testing story, and it only works because the components take state as an argument rather than reaching for it.
const assert = require('assert');
const { bandClass, laneFor, tierOf } = require('../portal/ui/track.logic');   // CJS sibling — see the Files note

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  \u2713 ${name}`); }
    catch (e) { failures++; console.error(`  \u2717 ${name}\n      ${e.message}`); }
}

check('SHAPE carries state \u2014 three states, three distinct classes', () => {
    assert.strictEqual(bandClass({ state: 'live' }), 'bar live');
    assert.strictEqual(bandClass({ state: 'staged' }), 'bar stag');
    assert.strictEqual(bandClass({ state: 'conflict' }), 'bar conf');
});

check('COLOUR carries topic and is never used to signal state', () => {
    const live = bandClass({ state: 'live', topic: 'draw' });
    const staged = bandClass({ state: 'staged', topic: 'draw' });
    assert.notStrictEqual(live, staged, 'two states of the same topic must differ by SHAPE');
    assert.strictEqual(bandClass({ state: 'live', topic: 'draw' }), bandClass({ state: 'live', topic: 'event' }),
        'two topics in the same state must share a class \u2014 the topic arrives as a CSS custom property, not a class');
});

check('an item ending after the season end is a conflict, computed not flagged by hand', () => {
    assert.strictEqual(tierOf({ endDate: '2026-09-10' }, { bpEnd: '2026-09-04' }), 'conflict');
    assert.strictEqual(tierOf({ endDate: '2026-09-01' }, { bpEnd: '2026-09-04' }), 'ok');
});

const { dateFromOffset, editOpFor } = require('../portal/ui/track.logic');

check('dateFromOffset is the inverse of barGeometry’s left/width math, snapped to a day', () => {
    const window = { start: '2026-08-01', end: '2026-08-08' }; // exactly 7 days wide
    const half = dateFromOffset(50, window);
    // 50% of 7 days = 3.5 days in = Aug 4 12:00 -- Math.round rounds .5 toward +Infinity, so this snaps UP to Aug 5, not down. (First draft of this assertion assumed "snapped down" and was wrong.)
    assert.strictEqual(half.toISOString().slice(0, 10), '2026-08-05');
});

check('dateFromOffset clamps to the window edges', () => {
    const window = { start: '2026-08-01', end: '2026-08-08' };
    assert.strictEqual(dateFromOffset(-10, window).toISOString().slice(0, 10), '2026-08-01');
    assert.strictEqual(dateFromOffset(150, window).toISOString().slice(0, 10), '2026-08-08');
});

check('editOpFor on a draw writes the new date onto `date`, strips the synthetic `startDate`, and preserves every other field', () => {
    const item = { id: 'r1', lane: 'returning', category: 'returning', title: 'Havoc rerun', items: ['a', 'b'], startDate: '2026-08-04', endDate: '2026-08-13' };
    const op = editOpFor(item, new Date('2026-08-16'));
    assert.strictEqual(op.type, 'draw.edit');
    assert.strictEqual(op.target.category, 'returning');
    assert.strictEqual(op.payload.date, '2026-08-16');
    assert.strictEqual(op.payload.startDate, undefined, 'a stray startDate would reach draw.edit’s $set -- draws have no such schema field');
    assert.strictEqual(op.payload.title, 'Havoc rerun');
    assert.deepStrictEqual(op.payload.items, ['a', 'b']);
});

check('editOpFor on a calendar item writes the new date onto `endDate`, keeps `startDate`, and resolves calendar.edit', () => {
    const item = { id: 'e1', lane: 'event', title: 'Clan wars', startDate: '2026-08-22', endDate: '2026-08-28' };
    const op = editOpFor(item, new Date('2026-08-30'));
    assert.strictEqual(op.type, 'calendar.edit');
    assert.deepStrictEqual(op.target, { elementId: 'e1' });
    assert.strictEqual(op.payload.endDate, '2026-08-30');
    assert.strictEqual(op.payload.startDate, '2026-08-22', 'calendar.edit’s validateEvent reads the start date from payload.startDate, not the stored `date` field');
});

process.exit(failures ? 1 : 0);
