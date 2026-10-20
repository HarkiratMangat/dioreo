// scripts/firstCommand.test.js -- "Dioreo User Since" bookkeeping (added 2026-10-20 17:54 EDT). No database: a fake model records the update it was given.
const assert = require('assert');
const mongoose = require('mongoose');
const { noteFirstCommand, _recorded } = require('../utils/firstCommand');
const { backfillOps } = require('./backfillFirstCommandAt');

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ok   ${name}`); }
    catch (e) { failures++; console.error(`  FAIL ${name}\n       ${e.message}`); }
}
function fakeModel() {
    const calls = [];
    return { calls, updateOne: async (filter, update, opts) => { calls.push({ filter, update, opts }); } };
}

(async () => {
    await check('the first command writes $min with an upsert, so it only ever moves earlier', async () => {
        _recorded.clear();
        const m = fakeModel(); const at = new Date('2026-10-20T21:00:00Z');
        assert.strictEqual(await noteFirstCommand('111', at, m), true);
        assert.deepStrictEqual(m.calls[0].filter, { discordId: '111' });
        assert.deepStrictEqual(m.calls[0].update, { $min: { firstCommandAt: at } });
        assert.strictEqual(m.calls[0].opts.upsert, true);
    });
    await check('a second command from the same user in this process does not touch the database', async () => {
        _recorded.clear();
        const m = fakeModel();
        await noteFirstCommand('222', new Date(), m);
        assert.strictEqual(await noteFirstCommand('222', new Date(), m), false);
        assert.strictEqual(m.calls.length, 1);
    });
    await check('no user id writes nothing', async () => {
        const m = fakeModel();
        assert.strictEqual(await noteFirstCommand(undefined, new Date(), m), false);
        assert.strictEqual(m.calls.length, 0);
    });
    await check('a failed write is not remembered, so the next command retries', async () => {
        _recorded.clear();
        const bad = { updateOne: async () => { throw new Error('db down'); } };
        await assert.rejects(noteFirstCommand('333', new Date(), bad));
        const m = fakeModel();
        assert.strictEqual(await noteFirstCommand('333', new Date(), m), true);
    });
    await check('the backfill uses each record\'s own creation time, through $min', () => {
        const id = mongoose.Types.ObjectId.createFromTime(Math.floor(Date.parse('2026-07-01T12:00:00Z') / 1000));
        const [op] = backfillOps([{ _id: id }]);
        assert.deepStrictEqual(op.updateOne.filter, { _id: id });
        assert.strictEqual(op.updateOne.update.$min.firstCommandAt.toISOString(), '2026-07-01T12:00:00.000Z');
    });
    process.exit(failures ? 1 : 0);
})();
