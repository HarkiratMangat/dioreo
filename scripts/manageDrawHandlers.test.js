// scripts/manageDrawHandlers.test.js -- /manage's draw handlers end to end: modal submit → op → saved draws → the reply (code-housekeeping, 2026-11-04 12:08 EST). Runs on scripts/lib/manageHarness.cjs, so no database and no Discord.
const assert = require('assert');
const h = require('./lib/manageHarness.cjs');
const draws = require('../handlers/manage/draws');

const titles = arr => arr.map(d => d.title).join(',');
let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); }
}

(async () => {
    await check('Add Draw saves a title-cased draw and answers with its panel', async () => {
        h.reset();
        const i = h.modal('add_draw_new', { title: 'iron wolf draw', date: 'Nov 5 2026', url: 'https://img/iron', items: 'Legendary AK117 - Iron Wolf' });
        await draws.addDraw(i);
        assert.strictEqual(titles(h.state.doc.newDraws), 'Iron Wolf Draw', i.text());
        assert.strictEqual(h.state.doc.newDraws[0].thumbnailUrl, 'https://img/iron');
        assert.strictEqual(h.state.changes.length, 1, 'one change recorded');
        assert.ok(h.state.changes[0].inverse, 'the change carries its undo');
        assert.ok(i.text().includes('Iron Wolf Draw'), 'the reply names the draw');
    });

    await check('Add Draw with a field left blank saves nothing and says what is missing', async () => {
        h.reset();
        const i = h.modal('add_draw_new', { title: 'Iron Wolf', date: '', items: '' });
        await draws.addDraw(i);
        assert.strictEqual(h.state.doc.newDraws.length, 0);
        assert.ok(/Fill in/.test(i.text()), i.text());
    });

    await check('Edit Draw changes the stored draw in place, same id', async () => {
        h.reset({ returningDraws: [{ _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', title: 'Old Name', date: '2026-10-01T12:00:00.000Z', items: [], thumbnailUrl: 'https://img/old' }] });
        const i = h.modal('edit_draw_aaaaaaaaaaaaaaaaaaaaaaaa_returning', { title: 'new name', date: 'Oct 2 2026', url: 'https://img/new', items: 'Epic Fennec' });
        await draws.editDraw(i);
        const [d] = h.state.doc.returningDraws;
        assert.strictEqual(d._id, 'aaaaaaaaaaaaaaaaaaaaaaaa');
        assert.strictEqual(d.title, 'New Name', i.text());
        assert.strictEqual(d.thumbnailUrl, 'https://img/new');
    });

    // 2026-11-11 22:34 EST, his "go": the draw index follows a live edit (utils/drawIndexSync.js), and a Revert puts the entry back exactly.
    await check('Edit Draw updates the draw index entry with its items and draw type, and Revert puts the entry back', async () => {
        h.collections.DrawCatalog.seed([{ slug: 'world-champs-final-draw', title: 'World Champs Final Draw', publicId: 'draws/world-champs-final-draw', imageUrl: 'https://x/y.jpg', priceType: 'legendaryGunReactive', items: [{ tier: 'legendary', name: 'Ak117 - Final', kind: 'weapon' }] }]);
        h.reset({ newDraws: [{ _id: 'cccccccccccccccccccccccc', title: 'World Champs Final Draw', date: '2026-11-10T00:00:00.000Z', items: [{ tier: 'legendary', name: 'Ak117 - Final' }], thumbnailUrl: 'https://x/y.jpg', priceType: 'legendaryGunReactive' }] });
        const i = h.modal('edit_draw_cccccccccccccccccccccccc_new', { draw: 'World Champs Final Draw\nNovember 10, 2026', items: 'l Ak117 - Final\ne Ghost - Champ', image: 'https://x/y.jpg', price_type: 'sevenSpinLegendaryWeapon' });
        await draws.editDraw(i);
        const [entry] = h.collections.DrawCatalog.rows;
        assert.deepStrictEqual(entry.items.map(x => x.name), ['Ak117 - Final', 'Ghost - Champ'], i.text().slice(0, 400));
        assert.strictEqual(entry.items[0].kind, 'weapon', 'the kind he set is kept');
        const edit = h.state.changes.find(c => c.type === 'draw.edit' || /Edited draw/.test(c.summary || ''));
        assert.ok(edit?.inverse?.payload?.__indexRestore, 'the inverse carries the entry as it was');
        const { commitSet } = require('../core/changeset');
        const undo = await commitSet([edit.inverse], { actorId: h.OWNER, revertOf: { changeId: edit.changeId, page: 'draws', actorId: h.OWNER } });
        assert.ok(undo.ok, JSON.stringify(undo.failedAt || undo));
        assert.deepStrictEqual(h.collections.DrawCatalog.rows[0].items.map(x => x.name), ['Ak117 - Final'], 'Revert put the entry back');
        h.collections.DrawCatalog.seed([]);
    });

    await check('Edit Draw on a draw that was deleted meanwhile says so and saves nothing', async () => {
        h.reset();
        const i = h.modal('edit_draw_bbbbbbbbbbbbbbbbbbbbbbbb_new', { title: 'X', date: 'Oct 2 2026', items: 'Epic Fennec' });
        await draws.editDraw(i);
        assert.ok(/no longer exists/.test(i.text()), i.text());
        assert.strictEqual(h.state.changes.length, 0);
    });

    await check('Bulk Add puts each pasted draw in its own list', async () => {
        h.reset();
        const i = h.modal('modal_draws_bulk_add_both', { new_text: 'Iron Wolf, l AK117, Nov 5, https://img/iw', returning_text: 'Thermal Core, e Fennec, Oct 1, https://img/tc' });
        await draws.bulkAddOrReplaceDraws(i);
        assert.strictEqual(titles(h.state.doc.newDraws), 'Iron Wolf', i.text());
        assert.strictEqual(titles(h.state.doc.returningDraws), 'Thermal Core');
        assert.ok(/Bulk add done/.test(i.text()));
    });

    await check('Bulk Replace updates a matched draw and adds the rest, then its undo puts the list back', async () => {
        h.reset({ newDraws: [{ _id: 'cccccccccccccccccccccccc', title: 'Iron Wolf', date: '2026-11-05T12:00:00.000Z', thumbnailUrl: 'https://img/iw', items: [] }] });
        const before = JSON.parse(JSON.stringify(h.state.doc.newDraws));
        const i = h.modal('modal_draws_bulk_replace_both', { new_text: 'Iron Wolf, l AK117, Nov 6, https://img/iw2\nNightfall, e Fennec, Nov 7, https://img/nf', returning_text: '' });
        await draws.bulkAddOrReplaceDraws(i);
        assert.strictEqual(titles(h.state.doc.newDraws), 'Iron Wolf,Nightfall', i.text());
        assert.strictEqual(h.state.doc.newDraws[0]._id, 'cccccccccccccccccccccccc', 'a matched draw keeps its id');
        const { commitSet } = require('../core/changeset');
        const undo = await commitSet([h.state.changes[0].inverse], { actorId: h.OWNER, revertOf: { changeId: h.state.changes[0].changeId, page: 'draws', actorId: h.OWNER } });
        assert.ok(undo.ok, JSON.stringify(undo));
        assert.deepStrictEqual(h.state.doc.newDraws, before);
    });

    await check('a pasted draw with no image and nothing cached is skipped and named', async () => {
        h.reset();
        const i = h.modal('modal_draws_bulk_add_both', { new_text: 'Iron Wolf, l AK117, Nov 5', returning_text: '' });
        await draws.bulkAddOrReplaceDraws(i);
        assert.strictEqual(h.state.doc.newDraws.length, 0);
        assert.ok(/Skipped/.test(i.text()) && /Iron Wolf/.test(i.text()), i.text());
    });

    await check('Bulk Add with both boxes blank saves nothing', async () => {
        h.reset();
        const i = h.modal('modal_draws_bulk_add_both', { new_text: '', returning_text: '' });
        await draws.bulkAddOrReplaceDraws(i);
        assert.ok(/left blank/.test(i.text()));
        assert.strictEqual(h.state.changes.length, 0);
    });

    await check('Bulk Delete asks to confirm the matched titles and names the ones it could not find', async () => {
        h.reset({ newDraws: [{ _id: 'dddddddddddddddddddddddd', title: 'Iron Wolf', date: '2026-11-05T12:00:00.000Z', items: [] }] });
        const i = h.modal('modal_draws_bulk_remove_new', { new_titles: 'iron wolf\nNo Such Draw' });
        await draws.bulkDeleteDraws(i);
        assert.ok(/Iron Wolf/.test(i.text()) && /No Such Draw/.test(i.text()), i.text());
        assert.strictEqual(h.state.doc.newDraws.length, 1, 'nothing is deleted before the confirm');
        const { pendingBulkDeletes } = require('../handlers/manage/shared');
        const [token, pending] = [...pendingBulkDeletes.entries()].at(-1);
        assert.ok(i.text().includes(`mng_bulkdelconfirm_${token}`), 'the confirm button carries the token');
        const changeIds = await pending.apply();
        assert.strictEqual(h.state.doc.newDraws.length, 0);
        assert.deepStrictEqual(changeIds, ['T1']);
    });

    await check('Purge empties only the chosen list and counts what went', async () => {
        h.reset({ newDraws: [{ _id: 'eeeeeeeeeeeeeeeeeeeeeeee', title: 'A', date: '2026-11-01T12:00:00.000Z' }], returningDraws: [{ _id: 'ffffffffffffffffffffffff', title: 'B', date: '2026-10-01T12:00:00.000Z' }] });
        const { confirmMsg } = await draws.purgeDraws('new', h.OWNER);
        assert.strictEqual(h.state.doc.newDraws.length, 0);
        assert.strictEqual(h.state.doc.returningDraws.length, 1);
        assert.ok(/1 New/.test(confirmMsg), confirmMsg);
    });

    await check('Delete one draw removes it and returns the change id for Revert', async () => {
        h.reset({ newDraws: [{ _id: '111111111111111111111111', title: 'A', date: '2026-11-01T12:00:00.000Z' }] });
        const ids = await draws.deleteDraw({ type: 'new', id: '111111111111111111111111' }, h.OWNER);
        assert.strictEqual(h.state.doc.newDraws.length, 0);
        assert.deepStrictEqual(ids, ['T1']);
    });

    await check('someone who is not an admin changes nothing', async () => {
        h.reset();
        const i = h.modal('add_draw_new', { title: 'Iron Wolf', date: 'Nov 5 2026', url: 'https://img/iw', items: 'Legendary AK117' }, { user: 'SOMEONE_ELSE' });
        await draws.addDraw(i);
        assert.strictEqual(h.state.doc.newDraws.length, 0, i.text());
        assert.strictEqual(h.state.changes.length, 0);
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/manage draw handlers: all checks pass');
    process.exit(0);
})();
