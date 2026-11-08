// scripts/autoPromote.test.js -- the Next Season Draft's auto-promote (2026-11-08 12:09 EST): when it is due, the Promote pop-up's choices, and the op's own inverse. No database.
const assert = require('assert');
const { isDue } = require('../utils/autoPromote');
const V = require('../handlers/manage/seasonPanel/views');
const ops = require('../core/ops');

let failed = 0;
function t(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); } }
const NOW = Date.UTC(2026, 10, 8, 17, 0);
const draft = (o = {}) => ({ draft: { active: true, autoPromote: true, bpStart: new Date(Date.UTC(2026, 10, 12)), currentSeasonTitle: 'Season 10 — 7th Anniversary', newDraws: [{}], returningDraws: [], calendar: [], ...o } });

t('due only once the Battle Pass start has passed, with auto-promote on and a draft staged', () => {
    assert.strictEqual(isDue(draft(), NOW), false, 'before the start');
    assert.strictEqual(isDue(draft(), Date.UTC(2026, 10, 12, 0, 0, 30)), true, 'just after');
    assert.strictEqual(isDue(draft({ autoPromote: false }), Date.UTC(2026, 10, 13)), false, 'switched off');
    assert.strictEqual(isDue(draft({ active: false }), Date.UTC(2026, 10, 13)), false, 'no draft');
    assert.strictEqual(isDue(draft({ bpStart: null }), Date.UTC(2026, 10, 13)), false, 'no start');
});
t('the pop-up offers auto first while the start is ahead, and only now once it has passed', () => {
    const m = V.promoteModal(draft(), NOW);
    const sel = m.components[0].component;
    assert.strictEqual(m.title, 'Promote to Live');
    assert.deepStrictEqual(sel.options.map(o => o.value), ['auto', 'now']);
    assert.strictEqual(sel.options[0].description, '2026-11-12 00:00 UTC');
    assert.ok(m.components[0].description.length <= 100 && m.components[0].label.length <= 45);
    assert.deepStrictEqual(V.promoteModal(draft(), Date.UTC(2026, 10, 13)).components[0].component.options.map(o => o.value), ['now']);
    assert.ok(m.custom_id.length <= 100);
});
t('setAutoPromote is registered on the Next Season Draft page and is its own inverse', () => {
    assert.ok(ops.listOpTypes().includes('season.setAutoPromote'));
    const impl = ops.getOp ? ops.getOp('season.setAutoPromote') : null;
    if (impl) assert.deepStrictEqual(impl.invert({ applied: { prev: { on: false, by: '' } } }), { type: 'season.setAutoPromote', payload: { on: false, by: '' } });
});

console.log(failed ? `\n${failed} failed` : '\nautoPromote: all checks passed');
process.exit(failed ? 1 : 0);
