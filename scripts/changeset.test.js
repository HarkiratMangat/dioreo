// scripts/changeset.test.js The property under test is ALL-OR-NOTHING. The bot reads fresh on every interaction, so a half-applied set is served to real users within seconds — this is the highest-consequence invariant in the whole core.
const assert = require('assert');
const { validateSet } = require('../core/changeset');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('validateSet reports EVERY invalid op, not just the first', () => {
    const r = validateSet([
        { type: 'draw.add', payload: { title: '', category: 'new' } },
        { type: 'draw.add', payload: { title: 'Fine', category: 'nonsense' } }
    ]);
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.failures.length, 2, 'a set that stops at the first error makes you fix them one round trip at a time');
});

check('validateSet reports the INDEX of each failure', () => {
    const r = validateSet([
        { type: 'draw.add', payload: { title: 'Fine', category: 'new', items: [] } },
        { type: 'draw.add', payload: { title: '', category: 'new' } }
    ]);
    assert.strictEqual(r.failures[0].index, 1, 'without an index you cannot show the user WHICH row is wrong');
});

check('the highest tier in the set is reported, because it gates the commit', () => {
    const r = validateSet([
        { type: 'draw.add', payload: { title: 'A', category: 'new', items: [] } },
        { type: 'draw.purge', target: { scope: 'all' } }
    ]);
    assert.strictEqual(r.tier, 3, 'one tier-3 op makes the whole set tier 3');
});

// Found live against the real portal server, not by inspection: draw.add's (and calendar.add/edit's,
// loadout.add/edit's, announcement.post/edit's) validate() deliberately returns ONLY `{payload}` in
// `normalized`, relying on the caller to carry type/target forward. validateSet used to do
// `r.normalized || op` -- a straight OR, which silently dropped type/target the moment `r.normalized`
// was truthy (any object is truthy, including `{payload:{...}}`). previewSet/commitSet then both call
// resolveOp(op.type) on the result and throw "unknown op type \"undefined\"" -- so staging a draw.add
// validated fine (this property is invisible to `ok`/`failures`) and committing it 409'd. The two
// checks below are what would have caught this before it ever reached a real server.
check('validateSet PRESERVES type/target on an op whose validate() returns only {payload} in normalized (the bug this regression pins)', () => {
    const r = validateSet([{ type: 'draw.add', payload: { title: 'Nightfall', category: 'new', items: [] } }]);
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.normalized[0].type, 'draw.add', 'type was silently dropped -- previewSet/commitSet would throw "unknown op type undefined"');
});

check('validateSet PRESERVES target.elementId on an edit op whose validate() returns only {payload} in normalized', () => {
    const r = validateSet([{ type: 'draw.edit', target: { category: 'new', elementId: 'abc123' }, payload: { title: 'Renamed', category: 'new', items: [] } }]);
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.normalized[0].type, 'draw.edit');
    assert.deepStrictEqual(r.normalized[0].target, { category: 'new', elementId: 'abc123' }, 'target was silently dropped -- apply() would read op.target.elementId off undefined');
});

check('validateSet stays correct for an op whose validate() already returns the FULL op in normalized (season.setTitlesDeadlines-shaped) -- merging must be a no-op here, not a regression', () => {
    const r = validateSet([{ type: 'season.setTitlesDeadlines', target: null, payload: { mainTitle: 'Season 8' } }]);
    assert.strictEqual(r.normalized[0].type, 'season.setTitlesDeadlines');
    assert.strictEqual(r.normalized[0].payload.mainTitle, 'Season 8');
});

process.exit(failures ? 1 : 0);
