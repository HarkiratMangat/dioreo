// scripts/portalUi.test.js Render functions are PURE: state in, tree out. No DOM, no browser, no framework harness. That is the whole frontend testing story, and it only works because the components take state as an argument rather than reaching for it.
const assert = require('assert');
const { bandClass, laneFor, tierOf } = require('../portal/ui/track.logic');   // CJS sibling — see the Files note
const { columnFor, groupByColumn, blockedReason, describeOp, describeInverse, diffRows, fmtDiffValue } = require('../portal/ui/board.logic');
const { seasonWindow, topicVarFor, typeLabelFor } = require('../portal/ui/season.logic');
const { announcementState } = require('../portal/api/broadcast');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  \u2713 ${name}`); }
    catch (e) { failures++; console.error(`  \u2717 ${name}\n      ${e.message}`); }
}

check('SHAPE carries state \u2014 three states, three distinct classes', () => {
    assert.strictEqual(bandClass({ state: 'live' }), 'bar saved');
    assert.strictEqual(bandClass({ state: 'staged' }), 'bar staged');
    assert.strictEqual(bandClass({ state: 'conflict' }), 'bar conflict');
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

// ─── Board column semantics (Phase 3) ──────────────────────────────────────── 🔴 THESE TWO DEFECTS SHIPPED BECAUSE NOTHING ASSERTED THE COLUMN MAPPING. columnFor only ever tested the tier-3 export gate, so a changeset whose own state was 'blocked' -- set by portal/api/changesets.js when validateSet FAILS -- landed in Ready, under the Commit button; and 'staged' was never returned by anything, so that column was structurally unreachable.

check('a changeset that failed validation belongs in Blocked, never in Ready', () => {
    assert.strictEqual(columnFor({ state: 'blocked', tier: 1 }), 'blocked');
    assert.ok(blockedReason({ state: 'blocked', tier: 1 }), 'Blocked must always state a reason');
});

check('the Staged column is reachable — a validated tier-1 set lands there', () => {
    assert.strictEqual(columnFor({ state: 'staged', tier: 1 }), 'staged');
});

check('the tier-3 export gate still routes to Blocked, and clears once exported', () => {
    assert.strictEqual(columnFor({ state: 'staged', tier: 3, exportedAt: null }), 'blocked');
    assert.strictEqual(columnFor({ state: 'staged', tier: 3, exportedAt: new Date() }), 'staged');
});

check('committed and discarded sets leave the board entirely', () => {
    assert.strictEqual(columnFor({ state: 'committed', tier: 1 }), null);
    assert.strictEqual(columnFor({ state: 'discarded', tier: 1 }), null);
});

check('Ready is ALL-OR-NOTHING — one blocker holds every staged set out of it', () => {
    const withBlocker = groupByColumn([{ state: 'staged', tier: 1 }, { state: 'staged', tier: 3, exportedAt: null }]);
    assert.strictEqual(withBlocker.ready.length, 0, 'nothing is ready while anything is blocked');
    assert.strictEqual(withBlocker.staged.length, 1);
    assert.strictEqual(withBlocker.blocked.length, 1);
    const clean = groupByColumn([{ state: 'staged', tier: 1 }, { state: 'staged', tier: 1 }]);
    assert.strictEqual(clean.ready.length, 2, 'with no blocker, staged work promotes to ready');
    assert.strictEqual(clean.staged.length, 0);
});

// ─── An op, and its inverse, described in words ──────────────────────────────

check('describeOp names the entity and the thing, not just a count', () => {
    assert.strictEqual(describeOp({ type: 'draw.add', payload: { title: 'Iron Wolf' } }), 'Add draw \u201cIron Wolf\u201d');
    assert.strictEqual(describeOp({ type: 'loadout.bulkDelete', payload: { ids: [1, 2, 3] } }), 'Delete 3 builds');
    assert.strictEqual(describeOp({ type: 'announcement.post', payload: { text: 'Season 7 is live' } }), 'Post announcement \u201cSeason 7 is live\u201d');
});

check('describeInverse states what undoing would do', () => {
    assert.strictEqual(describeInverse({ type: 'draw.delete' }), 'Undo would restore the draw');
    assert.strictEqual(describeInverse({ type: 'calendar.add' }), 'Undo would remove the calendar item');
    assert.strictEqual(describeInverse({ type: 'season.restoreSnapshot' }), null, 'an op with no stated inverse says nothing rather than guessing');
});

check('diffRows returns ONLY the fields that changed', () => {
    const rows = diffRows({ title: 'A', items: [1, 2] }, { title: 'B', items: [1, 2] });
    assert.deepStrictEqual(rows, [{ key: 'title', from: 'A', to: 'B', kind: 'change' }]);
});

check('a nested record renders by its own name, never as raw JSON', () => {
    assert.strictEqual(fmtDiffValue({ title: 'Judgment Day', date: '2026-08-07T00:00:00Z' }), 'Judgment Day');
    assert.strictEqual(fmtDiffValue({ a: 1, b: 2 }), '2 fields');
    assert.strictEqual(fmtDiffValue('2026-08-07T00:00:00Z'), '2026-08-07', 'a raw ISO datetime is unreadable next to its neighbour');
});

// ─── Season: the Track window, and the Manifest's topic accent ───────────────

check('seasonWindow never collapses to a point when bpEnd is unset', () => {
    const w = seasonWindow(null, Date.parse('2026-08-23'));
    assert.notStrictEqual(w.start, w.end, 'start === end divides by a 1ms span and every bar renders at 0%');
    assert.ok(new Date(w.end) - new Date(w.start) >= 14 * 86400000, 'a 14-day floor keeps a one-item season readable');
});

check('seasonWindow spans the data\u2019s own extent when it has one', () => {
    const w = seasonWindow({ newDraws: [{ date: '2026-08-06' }], calendar: [{ date: '2026-08-01', endDate: '2026-09-13' }] }, Date.parse('2026-08-23'));
    assert.strictEqual(w.start, '2026-08-01');
    assert.strictEqual(w.end, '2026-09-13');
});

check('every Manifest lane resolves a REAL topic token, and Playlist is not Event', () => {
    // manifest.js reads row.topicVar and nothing ever set it — every row drew the --ink3 fallback.
    assert.strictEqual(topicVarFor('newDraws', {}), '--draw');
    assert.strictEqual(topicVarFor('returningDraws', {}), '--ret');
    assert.strictEqual(topicVarFor('calendar', { category: 'Event' }), '--ev');
    assert.strictEqual(topicVarFor('calendar', { category: 'Playlist' }), '--play');
    assert.strictEqual(typeLabelFor('calendar', { category: 'Playlist' }), 'Playlist');
    assert.notStrictEqual(topicVarFor('calendar', { category: 'Playlist' }), topicVarFor('calendar', { category: 'Event' }));
});

// ─── Broadcast: the portal must agree with what Discord shows ────────────────

check('an announcement that has not started yet is SCHEDULED, never live', () => {
    const now = new Date('2026-08-23T19:00:00Z');
    assert.strictEqual(announcementState({}, now), 'live');
    assert.strictEqual(announcementState({ startsAt: new Date('2026-08-26') }, now), 'scheduled');
    assert.strictEqual(announcementState({ expiresAt: new Date('2026-08-11') }, now), 'expired');
    assert.strictEqual(announcementState({ startsAt: new Date('2026-08-01'), expiresAt: null }, now), 'live');
    assert.strictEqual(announcementState({ startsAt: new Date('2026-08-26'), expiresAt: new Date('2026-08-11') }, now), 'expired',
        'expiry wins over a future start — a set that already ended is not waiting to begin');
});

process.exit(failures ? 1 : 0);
