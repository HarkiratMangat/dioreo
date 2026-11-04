// scripts/manageQuickAdd.test.js -- /manage's Quick Add end to end: the pasted lines become drafts, Save writes them, Cancel writes nothing (code-housekeeping, 2026-11-04 12:18 EST). Runs on scripts/lib/manageHarness.cjs, so no database and no Discord.
const assert = require('assert');
const h = require('./lib/manageHarness.cjs');
const quick = require('../handlers/manage/quickAdd');

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); }
}
const button = id => Object.assign(h.modal(id), { isButton: () => true, isModalSubmit: () => false });
const lastToken = () => [...quick.DRAFTS.keys()].at(-1);

(async () => {
    await check('pasted lines become one draft each, and nothing is saved yet', async () => {
        h.reset();
        const i = h.modal('modal_quickadd', { lines: 'Iron Wolf Draw\nThermal Core Draw' });
        await quick.submitQuickAdd(i);
        const state = quick.DRAFTS.get(lastToken());
        assert.deepStrictEqual(state.drafts.map(d => d.title), ['Iron Wolf Draw', 'Thermal Core Draw']);
        assert.ok(i.text().includes(`mng_qa_save_${lastToken()}`), i.text());
        assert.strictEqual(h.state.doc.newDraws.length + h.state.doc.returningDraws.length, 0);
    });

    await check('Save writes every draft as a draw, one change each', async () => {
        h.reset();
        await quick.submitQuickAdd(h.modal('modal_quickadd', { lines: 'Iron Wolf Draw\nThermal Core Draw' }));
        const b = button(`mng_qa_save_${lastToken()}`);
        await quick.handleButton(b);
        const all = [...h.state.doc.newDraws, ...h.state.doc.returningDraws].map(d => d.title).sort();
        assert.deepStrictEqual(all, ['Iron Wolf Draw', 'Thermal Core Draw'], b.text());
        assert.strictEqual(h.state.changes.length, 2);
    });

    await check('Cancel throws the drafts away and saves nothing', async () => {
        h.reset();
        await quick.submitQuickAdd(h.modal('modal_quickadd', { lines: 'Iron Wolf Draw' }));
        const token = lastToken();
        const b = button(`mng_qa_cancel_${token}`);
        await quick.handleButton(b);
        assert.ok(!quick.DRAFTS.has(token));
        assert.ok(/Nothing was saved/.test(b.text()), b.text());
        assert.strictEqual(h.state.changes.length, 0);
    });

    await check('an empty box says so and makes no draft', async () => {
        h.reset();
        const before = quick.DRAFTS.size;
        const i = h.modal('modal_quickadd', { lines: '   ' });
        await quick.submitQuickAdd(i);
        assert.ok(/empty/.test(i.text()), i.text());
        assert.strictEqual(quick.DRAFTS.size, before);
    });

    await check("someone else's Save button does nothing to the draft", async () => {
        h.reset();
        await quick.submitQuickAdd(h.modal('modal_quickadd', { lines: 'Iron Wolf Draw' }));
        await quick.handleButton(Object.assign(button(`mng_qa_save_${lastToken()}`), { user: { id: 'SOMEONE_ELSE' } }));
        assert.strictEqual(h.state.changes.length, 0);
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/manage Quick Add: all checks pass');
    process.exit(0);
})();
