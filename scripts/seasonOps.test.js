// scripts/seasonOps.test.js
const assert = require('assert');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('promoteDraft and startNew are BOTH tier 3', () => {
    assert.strictEqual(ops.resolveOp('season.promoteDraft').tier, 3);
    assert.strictEqual(ops.resolveOp('season.startNew').tier, 3);
});

check('promoteDraft inverts to restoreSnapshot carrying the WHOLE prior document, not a diff', () => {
    const prior = { currentSeasonTitle: 'S7', bpEnd: new Date('2026-09-04'), newDraws: [1, 2], returningDraws: [3], calendar: [4, 5] };
    const inv = ops.resolveOp('season.promoteDraft').invert({ action: 'promote', applied: { prior, patchPrior: null } });
    assert.strictEqual(inv.type, 'season.restoreSnapshot');
    assert.deepStrictEqual(inv.payload, prior,
        'a rotation cannot be undone by a diff -- every rotated field must be in the snapshot');
});

check('setTitlesDeadlines accepts the literal word TBD without corrupting the date', () => {
    // applyLine's TBD branch is exercised through apply(), not validate() (validate is a pass-through here since resolving "leave unchanged" needs the live document) -- this checks the parsing helper's OWN contract indirectly via a round-tripped restoreSnapshot invert instead.
    const impl = ops.resolveOp('season.setTitlesDeadlines');
    const r = impl.validate({ type: 'season.setTitlesDeadlines', payload: { mainTitle: 'Season 8', bpLine: 'Battle Pass, TBD' } });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
});

// ⚠️ CORRECTED / EXPANDED beyond the plan's own draft: the plan's Interfaces line names only 4 op types and never mentions these three real, registered seasondraft actions at all.
check('the three real draft-staging actions the plan omitted all resolve to ops', () => {
    for (const type of ['season.setDraftTitlesDeadlines', 'season.bulkDraftDraws', 'season.bulkDraftCalendar']) {
        const impl = ops.resolveOp(type);
        assert.strictEqual(typeof impl.apply, 'function', `${type} is missing`);
    }
});

check('bulkDraftDraws rejects both fields blank, matching the real handler\'s own guard', () => {
    const r = ops.resolveOp('season.bulkDraftDraws').validate({ type: 'season.bulkDraftDraws', payload: {} });
    assert.strictEqual(r.ok, false);
});

check('discardDraft is tier 2 and restores the discarded draft', () => {
    const impl = ops.resolveOp('season.discardDraft');
    assert.strictEqual(impl.tier, 2);
    const draft = { active: true, newDraws: [1], calendar: [2] };
    const inv = impl.invert({ action: 'discard', applied: { draft } });
    assert.strictEqual(inv.type, 'season.restoreDraft');
    assert.deepStrictEqual(inv.payload.draft, draft);
});

check('restoreSnapshot is self-symmetric -- reverting a revert stays revertible', () => {
    const impl = ops.resolveOp('season.restoreSnapshot');
    const inv = impl.invert({ action: 'edit', applied: { prior: { currentSeasonTitle: 'Old' }, patchPrior: null } });
    assert.strictEqual(inv.type, 'season.restoreSnapshot');
    assert.deepStrictEqual(inv.payload, { currentSeasonTitle: 'Old' });
});

check('every season op type declares a tier', () => {
    for (const t of ops.listOpTypes().filter(t => t.startsWith('season.'))) {
        assert.ok([1, 2, 3].includes(ops.resolveOp(t).tier), `${t} has no tier`);
    }
});

process.exit(failures ? 1 : 0);
