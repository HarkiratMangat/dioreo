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

    // ---- the Next Season Draft's Quick Add (2026-11-09 14:10 EST, Harkirat: "theres no 'quick add' options in /manage season draft when adding draws") ----
    const drawCatalog = require('../utils/drawCatalog');
    const realLoad = drawCatalog.loadCatalog;
    const INDEX = [
        { slug: 'iron-wolf-draw', title: 'Iron Wolf Draw', imageUrl: 'https://x/iron.png', priceType: 'legendaryWeapon', items: [{ tier: 'legendary', kind: 'weapon', name: 'AK-47 - Iron Wolf', baseName: 'AK-47', skinName: 'Iron Wolf' }] },
        { slug: 'thermal-core-draw', title: 'Thermal Core Draw', imageUrl: 'https://x/thermal.png', priceType: 'mythicWeapon', items: [{ tier: 'mythic', kind: 'weapon', name: 'CX-9 - Thermal Core', baseName: 'CX-9', skinName: 'Thermal Core' }] },
    ];
    drawCatalog.loadCatalog = async () => INDEX;
    const draftDoc = (draft = {}) => ({ draft: { active: true, currentSeasonTitle: 'Season 10: Next', newDraws: [], returningDraws: [], calendar: [], ...draft } });

    await check('the draft Quick Add box has its own custom_id per tab', async () => {
        const { buildQuickAddModal } = require('../commands/manage');
        assert.strictEqual(buildQuickAddModal({ draftSection: 'n' }).data.custom_id, 'modal_draws_quickadd_draft_n');
        assert.strictEqual(buildQuickAddModal({ draftSection: 'r' }).data.custom_id, 'modal_draws_quickadd_draft_r');
        assert.strictEqual(buildQuickAddModal().data.custom_id, 'modal_draws_quickadd');
    });

    await check('the draft: Stage puts index draws in the tab it was opened from, and /draws is untouched', async () => {
        h.reset(draftDoc());
        const i = h.modal('modal_draws_quickadd_draft_n', { lines: 'iron wolf\nthermal core, returning' });
        await quick.submitQuickAdd(i, { target: 'draft', section: 'n' });
        assert.ok(/Next Season Draft/.test(i.text()) && /Stage 2/.test(i.text()), i.text());
        await quick.handleButton(button(`mng_qa_save_${lastToken()}`));
        assert.deepStrictEqual(h.state.doc.draft.newDraws.map(d => d.title), ['Iron Wolf Draw']);
        assert.deepStrictEqual(h.state.doc.draft.returningDraws.map(d => d.title), ['Thermal Core Draw']);
        assert.strictEqual(h.state.doc.draft.newDraws[0].thumbnailUrl, 'https://x/iron.png');
        assert.strictEqual(h.state.doc.newDraws.length + h.state.doc.returningDraws.length, 0, 'nothing live');
        assert.strictEqual(h.state.changes.length, 1, 'one staged change');
    });

    await check('the draft: a draw already staged is not staged twice; its end date goes on the draft calendar', async () => {
        h.reset(draftDoc({ newDraws: [{ _id: h.id(), title: 'Iron Wolf Draw', items: [], date: new Date('2026-12-01T00:00:00Z'), thumbnailUrl: 'https://x/iron.png' }] }));
        const i = h.modal('modal_draws_quickadd_draft_n', { lines: 'iron wolf, ends Dec 15' });
        await quick.submitQuickAdd(i, { target: 'draft', section: 'n' });
        assert.ok(/Already staged as/.test(i.text()), i.text());
        await quick.handleButton(button(`mng_qa_save_${lastToken()}`));
        assert.strictEqual(h.state.doc.draft.newDraws.length, 1);
        assert.deepStrictEqual(h.state.doc.draft.calendar.map(e => [e.title, e.category]), [['Iron Wolf Draw', 'draw']]);
        assert.strictEqual(h.state.doc.calendar.length, 0, 'nothing on the live calendar');
    });

    await check("the draft: a line with no start starts with the draft's Battle Pass, one with a start keeps it", async () => {
        h.reset(draftDoc({ bpStart: new Date('2026-12-04T00:00:00Z') }));
        await quick.submitQuickAdd(h.modal('modal_draws_quickadd_draft_n', { lines: 'iron wolf\nthermal core, starts Dec 10' }), { target: 'draft', section: 'n' });
        const [a, b] = quick.DRAFTS.get(lastToken()).drafts;
        assert.strictEqual(new Date(a.start).toISOString(), '2026-12-04T00:00:00.000Z');
        assert.strictEqual(new Date(b.start).toISOString().slice(0, 10), '2026-12-10');
    });

    await check('the draft: a draw with no picture is left out and named', async () => {
        h.reset(draftDoc());
        await quick.submitQuickAdd(h.modal('modal_draws_quickadd_draft_r', { lines: 'iron wolf\nMoonlit Sorrow Draw' }), { target: 'draft', section: 'r' });
        const b = button(`mng_qa_save_${lastToken()}`);
        await quick.handleButton(b);
        assert.deepStrictEqual(h.state.doc.draft.returningDraws.map(d => d.title), ['Iron Wolf Draw']);
        assert.ok(/Left out: no picture \(1\)/.test(b.text()) && /Moonlit Sorrow Draw/.test(b.text()), b.text());
    });

    await check("the draft: Stage keeps its change ids for Revert All (the shared revertChanges, as the live Save)", async () => {
        h.reset(draftDoc());
        await quick.submitQuickAdd(h.modal('modal_draws_quickadd_draft_n', { lines: 'iron wolf' }), { target: 'draft', section: 'n' });
        const token = lastToken();
        const b = button(`mng_qa_save_${token}`);
        await quick.handleButton(b);
        assert.deepStrictEqual(quick.SAVED.get(token).changeIds, h.state.changes.map(c => c.changeId));
        assert.strictEqual(quick.SAVED.get(token).target, 'draft', 'so Revert All names the draft, not /calendar');
        assert.ok(b.text().includes(`mng_qa_revert_${token}`) && /Draft Draws/.test(b.text()), b.text());
    });
    drawCatalog.loadCatalog = realLoad;

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/manage Quick Add: all checks pass');
    process.exit(0);
})();
