// scripts/patchnoteOps.test.js
const assert = require('assert');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('addSeason is tier 2 and its inverse removes only the entry it created', () => {
    const impl = ops.resolveOp('patchnote.addSeason');
    assert.strictEqual(impl.tier, 2);
    const inv = impl.invert({ action: 'add', applied: { elementId: 'a' } });
    assert.strictEqual(inv.type, 'patchnote.removeSeason');
    assert.strictEqual(inv.target.elementId, 'a');
});

check('setDateInfo edits IN PLACE, preserving the subdocument _id', () => {
    const inv = ops.resolveOp('patchnote.setDateInfo').invert({
        action: 'edit', applied: { elementId: 'a', prior: { description: 'old', releaseDate: new Date(), titleOverride: '' } }
    });
    assert.strictEqual(inv.target.elementId, 'a',
        'the image cache is keyed on this _id -- an op that changes it orphans every cached image');
});

check('setDateInfo requires an existing entry -- it does not silently invent one', () => {
    const r = ops.resolveOp('patchnote.setDateInfo').validate({ type: 'patchnote.setDateInfo', payload: {} });
    assert.strictEqual(r.ok, false);
});

// ⚠️ CORRECTED from the plan's own draft assumption -- the real handler uses parseReleaseDateTime (admin-local-clock-aware), never parseAdminDate. A round-tripped inverse carries a real Date and must not be re-parsed as a modal string.
check('setDateInfo round-trips an inverse without re-parsing releaseDate as a string', () => {
    const inv = ops.resolveOp('patchnote.setDateInfo').invert({
        action: 'edit', applied: { elementId: 'a', prior: { description: 'old', releaseDate: new Date('2026-08-01'), titleOverride: '' } }
    });
    const r = ops.resolveOp('patchnote.setDateInfo').validate(inv);
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
});

check('setUrls1/setUrls2 invert to the matching slot number, restoring the prior slice', () => {
    const inv1 = ops.resolveOp('patchnote.setUrls1').invert({ action: 'edit', applied: { elementId: 'a', priorSlice: ['x'], slot: 1 } });
    assert.strictEqual(inv1.type, 'patchnote.setUrls1');
    assert.deepStrictEqual(inv1.payload.urls, ['x']);
    const inv2 = ops.resolveOp('patchnote.setUrls2').invert({ action: 'edit', applied: { elementId: 'a', priorSlice: ['y'], slot: 2 } });
    assert.strictEqual(inv2.type, 'patchnote.setUrls2');
});

check('purge is tier 3 and its inverse carries every entry', () => {
    const impl = ops.resolveOp('patchnote.purge');
    assert.strictEqual(impl.tier, 3);
    const entries = [{ title: 'S6' }, { title: 'S7' }];
    assert.deepStrictEqual(impl.invert({ action: 'purge', applied: { entries } }).payload.entries, entries);
});

// The plan's own Interfaces line names only 5 op types and is missing this one entirely -- found by reading handlers/manage/patchnotes.js's handlePatchSeasonPick, not by reading the registry (this action's id embeds a Mongo _id the registry's group/action split can't represent).
check('editSeason exists -- the plan omitted the real Past Seasons edit flow entirely', () => {
    const impl = ops.resolveOp('patchnote.editSeason');
    assert.strictEqual(typeof impl.apply, 'function');
    const r = impl.validate({ type: 'patchnote.editSeason', payload: {} });
    assert.strictEqual(r.ok, false, 'must require a target entry, same as setDateInfo');
});

process.exit(failures ? 1 : 0);
