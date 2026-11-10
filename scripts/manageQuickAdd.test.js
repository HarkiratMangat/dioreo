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
    await check("Stage These: the draft calendar's unstaged draws become Quick Add lines with their own dates", async () => {
        const SV = require('../handlers/manage/seasonPanel/views');
        const doc = draftDoc({ newDraws: [{ _id: h.id(), title: 'Thermal Core Draw', items: [], date: new Date('2026-12-01T00:00:00Z') }], calendar: [
            { title: 'Iron Wolf Draw', category: 'draw', date: new Date('2026-11-20T00:00:00Z'), endDate: new Date('2027-02-17T00:00:00Z') },
            { title: 'thermal core draw', category: 'draw', date: new Date('2026-12-01T00:00:00Z') },
            { title: 'Lunar Festival', category: 'event', date: new Date('2026-12-02T00:00:00Z') },
            { title: 'Night Market Draw', category: 'draw', date: new Date('2026-12-05T19:00:00Z') },
        ] });
        assert.deepStrictEqual(SV.unstagedCalendarLines(doc), ['Iron Wolf Draw, starts 2026-11-20, ends 2027-02-17', 'Night Market Draw, starts 2026-12-05 19:00 UTC']);
        const view = JSON.stringify(SV.needsLookView(doc));
        assert.ok(/Stage These · 2/.test(view) && view.includes('ddstage'), 'the button, with its count');
        assert.ok(!/Stage These/.test(JSON.stringify(SV.needsLookView(draftDoc()))), 'no button when nothing is unstaged');
        // A draw still live on /draws keeps its live section, as the carry-over files it.
        assert.deepStrictEqual(SV.unstagedCalendarLines({ ...doc, returningDraws: [{ title: 'Iron Wolf Draw' }] })[0], 'Iron Wolf Draw, returning, starts 2026-11-20, ends 2027-02-17');
    });

    await check("Stage These: staging a line copied from its calendar row adds the draw and leaves the row alone", async () => {
        const row = { _id: h.id(), title: 'Iron Wolf Draw', category: 'draw', date: new Date('2026-11-20T00:00:00Z'), endDate: new Date('2027-02-17T00:00:00Z'), isOngoing: false };
        h.reset(draftDoc({ calendar: [row] }));
        const lines = require('../handlers/manage/seasonPanel/views').unstagedCalendarLines(h.state.doc).join('\n');
        await quick.submitQuickAdd(h.modal('modal_draws_quickadd_draft_n', { lines }), { target: 'draft', section: 'n' });
        await quick.handleButton(button(`mng_qa_save_${lastToken()}`));
        const staged = h.state.doc.draft.newDraws;
        assert.deepStrictEqual(staged.map(d => [d.title, new Date(d.date).toISOString()]), [['Iron Wolf Draw', '2026-11-20T00:00:00.000Z']]);
        assert.strictEqual(h.state.changes.length, 1, 'the draws change only, no empty calendar change');
        assert.strictEqual(new Date(h.state.doc.draft.calendar[0].endDate).toISOString(), '2027-02-17T00:00:00.000Z');
    });
    // His QoL asks, 2026-11-10: Remove lines, Add More, pictures as links, and where to go after Save.
    await check('ten lines fit Discord with the Remove menu and Add More (40 components, own ids)', async () => {
        h.reset();
        const lines = Array.from({ length: 10 }, (_, i) => `Draw Number ${i + 1}`).join('\n');
        await quick.submitQuickAdd(h.modal('modal_quickadd', { lines }));
        const panel = quick.draftPanel(lastToken(), quick.DRAFTS.get(lastToken()));
        let n = 0; const ids = [];
        const walk = c => { if (Array.isArray(c)) return c.forEach(walk); n++; if (c.custom_id) ids.push(c.custom_id); (c.components || []).forEach(walk); if (c.accessory) walk(c.accessory); };
        walk(panel);
        assert.ok(n <= 40, `${n} components`);
        assert.strictEqual(new Set(ids).size, ids.length, 'no duplicate ids');
        assert.ok(ids.includes(`mng_qa_rm_${lastToken()}`) && ids.includes(`mng_qa_more_${lastToken()}`));
        assert.ok(panel[0].components.some(c => c.type === 1 && c.components.some(b => b.custom_id === `mng_qa_more_${lastToken()}` && b.disabled)), 'Add More is off once ten lines are in');
    });
    await check('Remove takes the picked lines out; removing every line cancels', async () => {
        h.reset();
        await quick.submitQuickAdd(h.modal('modal_quickadd', { lines: 'Iron Wolf Draw\nThermal Core Draw\nGhost Draw' }));
        const token = lastToken();
        const pick = Object.assign(h.modal(`mng_qa_rm_${token}`, {}, { values: ['0', '2'] }), { isButton: () => false, isModalSubmit: () => false, isStringSelectMenu: () => true });
        await quick.handleButton(pick);
        assert.deepStrictEqual(quick.DRAFTS.get(token).drafts.map(d => d.title), ['Thermal Core Draw']);
        const all = Object.assign(h.modal(`mng_qa_rm_${token}`, {}, { values: ['0'] }), { isButton: () => false, isModalSubmit: () => false, isStringSelectMenu: () => true });
        await quick.handleButton(all);
        assert.ok(!quick.DRAFTS.has(token) && /Every line was removed/.test(all.text()), all.text());
    });
    await check('Add More opens the box and its lines join the same draft', async () => {
        h.reset();
        await quick.submitQuickAdd(h.modal('modal_quickadd', { lines: 'Iron Wolf Draw' }));
        const token = lastToken();
        const b = button(`mng_qa_more_${token}`);
        await quick.handleButton(b);
        assert.ok(b.sent.some(x => x.modal), 'a pop-up opened');
        await quick.submitMore(h.modal(`modal_qa_more_${token}`, { lines: 'Thermal Core Draw\nIron Wolf Draw' }));
        const d = quick.DRAFTS.get(token).drafts;
        assert.deepStrictEqual(d.map(x => x.title), ['Iron Wolf Draw', 'Thermal Core Draw', 'Iron Wolf Draw']);
        assert.strictEqual(d[2].duplicateOf, 0, 'the same draw twice is still written once');
    });
    await check('the saved card offers Open Draw, Quick Add More and Draws Home', async () => {
        h.reset();
        await quick.submitQuickAdd(h.modal('modal_quickadd', { lines: 'Quasar Test Draw' }));
        const b = button(`mng_qa_save_${lastToken()}`);
        await quick.handleButton(b);
        const saved = h.state.doc.returningDraws[0] ? `r:${h.state.doc.returningDraws[0]._id}` : `n:${h.state.doc.newDraws[0]._id}`;
        assert.ok(b.text().includes(`mng_dr|card|${saved}`) && b.text().includes('mng_dr|quickadd') && b.text().includes('mng_dr|page'), b.text());
        h.reset();
        await quick.submitQuickAdd(h.modal('modal_quickadd', { lines: 'Quasar Test Draw\nNimbus Test Draw' }));
        const b2 = button(`mng_qa_save_${lastToken()}`);
        await quick.handleButton(b2);
        assert.ok(b2.text().includes('mng_dr|open|'), 'several saved draws get an Open menu');
    });
    drawCatalog.loadCatalog = realLoad;

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/manage Quick Add: all checks pass');
    process.exit(0);
})();
