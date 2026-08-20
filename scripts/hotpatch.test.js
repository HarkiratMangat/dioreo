// scripts/hotpatch.test.js
const assert = require('assert');
const { planHotpatch } = require('../utils/hotpatch');

let failures = 0;
const checks = [];
function check(name, fn) { checks.push([name, fn]); }

// A pure command file: closure stays inside commands/ + pure utils.
check('a pure command file is ALLOW', () => {
    const p = planHotpatch({ files: ['commands/drawprices.js'] });
    assert.strictEqual(p.verdict, 'ALLOW', `expected ALLOW, got ${p.verdict}: ${JSON.stringify(p.blocked)}`);
    assert.ok(p.members.includes('commands/drawprices.js'));
});

// eventStore is required by index.js and bot/lifecycle.js -> structurally unswappable, forever.
check('utils/eventStore.js is REFUSE_STRUCTURAL', () => {
    const p = planHotpatch({ files: ['utils/eventStore.js'] });
    assert.strictEqual(p.verdict, 'REFUSE_STRUCTURAL');
    assert.ok(p.escaped.some(f => f === 'index.js' || f.startsWith('bot/')),
        `expected an index.js/bot/ escape, got ${JSON.stringify(p.escaped)}`);
});

// colors.js mutates colorsRefreshCooldowns and declares no contract.
check('handlers/colors.js is REFUSE_STATE and names the binding', () => {
    const p = planHotpatch({ files: ['handlers/colors.js'] });
    assert.strictEqual(p.verdict, 'REFUSE_STATE');
    assert.ok(JSON.stringify(p.blocked).includes('colorsRefreshCooldowns'),
        `expected colorsRefreshCooldowns in ${JSON.stringify(p.blocked)}`);
});

// router.js is the BOUNDARY: its interactionCooldowns Map must never appear as a blocker.
check('handlers/router.js is a boundary, never a member', () => {
    const p = planHotpatch({ files: ['handlers/drawprices.js'] });
    assert.ok(!p.members.includes('handlers/router.js'),
        'router.js must be a boundary, not a closure member');
    assert.strictEqual(p.verdict, 'ALLOW');
});

// A constant lookup table is not state. This is the false positive that must stay fixed.
check('a never-mutated `new Set([...])` is not treated as state', () => {
    const p = planHotpatch({ files: ['utils/colorNames.js'] });
    assert.ok(!JSON.stringify(p.blocked).includes('DROPPED_NAMES'),
        'a constant Set must not count as mutable state');
});

// models/ can never be re-required (mongoose.model throws OverwriteModelError on the second call).
check('a models/ member forces REFUSE_STRUCTURAL', () => {
    const p = planHotpatch({ files: ['models/UserPreference.js'] });
    assert.strictEqual(p.verdict, 'REFUSE_STRUCTURAL');
});

// The router late-binding change (Task 2) rests on "require() on a cached module is a Map lookup".
// That is true by CommonJS's definition -- which is exactly the kind of premise this project's rules
// say to TEST rather than assert (a precondition that drives an expensive decision).
check('a late-bound call costs nothing meaningful per interaction', () => {
    const t0 = process.hrtime.bigint();
    for (let i = 0; i < 100_000; i++) require('../utils/hotpatch');
    const perCallNs = Number(process.hrtime.bigint() - t0) / 100_000;
    assert.ok(perCallNs < 2000, `cached require() cost ${perCallNs.toFixed(0)}ns/call — too slow to sit in the dispatch path`);
});

// handlers/manage is a DIRECTORY. The edge router.js -> handlers/manage/index.js must resolve, or
// the graph silently loses it.
check('a directory require resolves to its index.js', () => {
    const p = planHotpatch({ files: ['handlers/manage/shared.js'] });
    assert.ok(p.members.includes('handlers/manage/index.js'),
        `manage/index.js must appear as a dependent of shared.js — got ${JSON.stringify(p.members)}`);
});

const { applyHotpatch } = require('../utils/hotpatch');
const fsx = require('fs'); const pathx = require('path');
const FIXTURE = pathx.join(__dirname, '..', 'utils', '__hotpatchFixture.js');

check('applyHotpatch swaps a module and the new body runs', async () => {
    fsx.writeFileSync(FIXTURE, 'module.exports = { value: () => "old" };');
    assert.strictEqual(require(FIXTURE).value(), 'old');
    fsx.writeFileSync(FIXTURE, 'module.exports = { value: () => "new" };');
    const result = await applyHotpatch({ verdict: 'ALLOW', members: ['utils/__hotpatchFixture.js'], blocked: {}, escaped: [] }, { client: null });
    assert.ok(result.ok, result.error);
    assert.strictEqual(require(FIXTURE).value(), 'new');
    fsx.unlinkSync(FIXTURE);
});

check('a syntactically broken file leaves the OLD module live', async () => {
    fsx.writeFileSync(FIXTURE, 'module.exports = { value: () => "good" };');
    require(FIXTURE);
    fsx.writeFileSync(FIXTURE, 'module.exports = { value: () => {{{ };');   // deliberate syntax error
    const result = await applyHotpatch({ verdict: 'ALLOW', members: ['utils/__hotpatchFixture.js'], blocked: {}, escaped: [] }, { client: null });
    assert.strictEqual(result.ok, false, 'a broken file must not apply');
    assert.strictEqual(require(FIXTURE).value(), 'good', 'the old module must still be live');
    fsx.unlinkSync(FIXTURE);
});

check('applyHotpatch refuses a plan it did not approve', async () => {
    const result = await applyHotpatch({ verdict: 'REFUSE_STATE', members: [], blocked: { x: ['y'] }, escaped: [] }, { client: null });
    assert.strictEqual(result.ok, false);
});

check('__hotSwap state is carried across a reload', async () => {
    fsx.writeFileSync(FIXTURE, 'const seen = new Map(); seen.set("a", 1);\nmodule.exports = { seen, __hotSwap: { retain: () => seen, adopt: (p) => { for (const [k,v] of p) seen.set(k,v); } } };');
    require(FIXTURE).seen.set('b', 2);
    await applyHotpatch({ verdict: 'ALLOW', members: ['utils/__hotpatchFixture.js'], blocked: {}, escaped: [] }, { client: null });
    assert.strictEqual(require(FIXTURE).seen.get('b'), 2, 'adopted state was lost');
    fsx.unlinkSync(FIXTURE);
});

check('runHotpatch plans over the whole changed set, not just the named file', async () => {
    const { runHotpatch } = require('../utils/hotpatch');
    const out = await runHotpatch({ client: null, files: ['commands/drawprices.js'], pull: false, dryRun: true });
    assert.ok(Array.isArray(out.changed), 'changed set must be reported');
    assert.ok(out.plan, 'a plan must be produced even in dry-run');
    assert.strictEqual(out.result, null, 'dry-run must not apply anything');
});

(async () => {
    for (const [name, fn] of checks) {
        try { await fn(); console.log(`  ✓ ${name}`); }
        catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
    }
    console.log(failures ? `\n${failures} failing` : '\nAll hotpatch checks passed');
    process.exit(failures ? 1 : 0);
})();
