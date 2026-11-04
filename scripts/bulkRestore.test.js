// scripts/bulkRestore.test.js -- Undo of a bulk draw or calendar change puts back exactly what was there (code-housekeeping, 2026-11-04 12:00 EST). Found by the read-only bug pass that day: Replace Multiple's undo re-ran the forward upsert, so draws or events it had ADDED stayed after Undo; and every bulk undo (Delete Multiple, Purge) re-ran the Cloudinary resolver, which drops a draw with no image and can hand a draw another draw's image. The database is an in-memory stand-in: SeasonalData's two query methods and core/mongo/positional's helpers are replaced before core/ops is loaded, so apply() and invert() run for real.
const assert = require('assert');
const mongoose = require('mongoose');

const store = { newDraws: [], returningDraws: [], calendar: [] };
const clone = v => JSON.parse(JSON.stringify(v));
const chain = (value) => { const c = { select: () => c, lean: () => c, session: () => c, then: (ok, bad) => Promise.resolve(clone(value)).then(ok, bad) }; return c; };

const SeasonalData = require('../models/SeasonalData');
SeasonalData.findOne = () => chain(store);
SeasonalData.updateOne = async (q, u) => { Object.assign(store, clone(u.$set || {})); return {}; };
const positional = require('../core/mongo/positional');
positional.appendElement = async ({ arrayPath, element }) => { store[arrayPath].push(clone(element)); };
positional.removeElement = async ({ arrayPath, elementId }) => { store[arrayPath] = store[arrayPath].filter(e => String(e._id) !== String(elementId)); return true; };
positional.resortByDate = async (Model, f, arrayPath) => { store[arrayPath].sort((a, b) => new Date(a.date) - new Date(b.date)); return clone(store[arrayPath]); };
// Every image "resolves" to the URL it already has; a draw with none resolves to nothing, as Cloudinary does when no cache entry matches.
const cloudinaryCache = require('../utils/cloudinaryCache');
cloudinaryCache.resolveThumbnail = async (title, url) => ({ url: url || null });

const ops = require('../core/ops');
const id = () => String(new mongoose.Types.ObjectId());
const draw = (title, date, thumbnailUrl = `https://img/${title}`) => ({ _id: id(), title, date, thumbnailUrl });
const event = (title, date) => ({ _id: id(), title, date, type: 'event' });
const titles = arr => arr.map(d => d.title).join(',');

// Runs the op forward, then its stored inverse the way core/revert.js does (restoring: true), and returns what each left behind.
async function roundTrip(op) {
    const impl = ops.resolveOp(op.type);
    const res = await impl.apply(op, { session: null, restoring: false });
    assert.ok(res.ok, `forward ${op.type} failed: ${res.reason}`);
    const after = clone(store);
    const inverse = [impl.invert({ ...res.change, applied: res.applied })].flat();
    for (const inv of inverse) {
        const r = await ops.resolveOp(inv.type).apply(inv, { session: null, restoring: true });
        assert.ok(r.ok, `inverse ${inv.type} failed: ${r.reason}`);
    }
    return { after, restored: clone(store) };
}

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

(async () => {
    await check('draw Replace Multiple, then Undo: the added draw is gone and the updated one is back as it was', async () => {
        store.newDraws = [draw('Alpha', '2026-11-01'), draw('Bravo', '2026-11-02')];
        const before = clone(store.newDraws);
        const { after, restored } = await roundTrip({ type: 'draw.bulkReplace', target: { category: 'new' },
            payload: { text: 'pasted', parsed: [{ title: 'Alpha', date: '2026-11-01', thumbnailUrl: 'https://img/alpha-2' }, { title: 'Charlie', date: '2026-11-03', thumbnailUrl: 'https://img/Charlie' }] } });
        assert.strictEqual(titles(after.newDraws), 'Alpha,Bravo,Charlie', 'the forward replace should update Alpha and add Charlie');
        assert.deepStrictEqual(restored.newDraws, before);
    });

    await check('draw Purge, then Undo: a draw with no image comes back too', async () => {
        store.newDraws = [draw('Alpha', '2026-11-01'), draw('Noimage', '2026-11-02', null)];
        store.returningDraws = [draw('Delta', '2026-10-01')];
        const before = clone({ n: store.newDraws, r: store.returningDraws });
        const { after, restored } = await roundTrip({ type: 'draw.purge', target: { scope: 'all' }, payload: {} });
        assert.strictEqual(after.newDraws.length + after.returningDraws.length, 0);
        assert.deepStrictEqual({ n: restored.newDraws, r: restored.returningDraws }, before);
    });

    await check('draw Delete Multiple, then Undo: a draw with no image comes back, with its own id', async () => {
        store.newDraws = [draw('Alpha', '2026-11-01'), draw('Noimage', '2026-11-02', null)];
        store.returningDraws = [];
        const before = clone(store.newDraws);
        const { after, restored } = await roundTrip({ type: 'draw.bulkDelete', payload: { ids: { newDraws: before.map(d => d._id) } } });
        assert.strictEqual(after.newDraws.length, 0);
        assert.deepStrictEqual(restored.newDraws, before);
    });

    await check('a draw added after the Purge survives its Undo', async () => {
        store.newDraws = [draw('Alpha', '2026-11-01')];
        store.returningDraws = [];
        const impl = ops.resolveOp('draw.purge');
        const res = await impl.apply({ type: 'draw.purge', target: { scope: 'new' }, payload: {} }, { session: null });
        store.newDraws.push(draw('Later', '2026-11-05'));
        for (const inv of [impl.invert({ ...res.change, applied: res.applied })].flat()) await ops.resolveOp(inv.type).apply(inv, { session: null, restoring: true });
        assert.strictEqual(titles(store.newDraws), 'Alpha,Later');
    });

    await check('calendar Replace Multiple, then Undo: the added event is gone', async () => {
        store.calendar = [event('Ranked Reset', '2026-11-01')];
        const before = clone(store.calendar);
        const { after, restored } = await roundTrip({ type: 'calendar.bulkReplace', payload: { text: 'pasted', parsed: [{ title: 'Ranked Reset', date: '2026-11-02', type: 'event' }, { title: 'New Mode', date: '2026-11-04', type: 'mode' }] } });
        assert.strictEqual(titles(after.calendar), 'Ranked Reset,New Mode');
        assert.deepStrictEqual(restored.calendar, before);
    });

    await check('calendar Purge and Delete Multiple undo keep each event\'s own id', async () => {
        store.calendar = [event('One', '2026-11-01'), event('Two', '2026-11-02')];
        const before = clone(store.calendar);
        assert.deepStrictEqual((await roundTrip({ type: 'calendar.purge', payload: {} })).restored.calendar, before);
        assert.deepStrictEqual((await roundTrip({ type: 'calendar.bulkDelete', payload: { ids: before.map(e => e._id) } })).restored.calendar, before);
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\nbulk undo: all checks pass');
    process.exit(0);
})();
