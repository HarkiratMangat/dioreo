// scripts/drawBasketStore.test.js -- coverage for utils/drawBasketStore.js. Pure logic against an in-memory stub of the DrawBasket model (same require.cache-stubbing technique as scripts/eventStore.test.js): no Mongo needed, and the stub's findById THROWS on a malformed id the way Mongoose's real CastError does, so the store's try/catch is actually exercised, not just assumed. Run: `node scripts/drawBasketStore.test.js` (also via `npm test`).
const assert = require('assert');
const Module = require('module');

// --- In-memory fake DrawBasket, stubbed BEFORE utils/drawBasketStore requires it. ---
const rows = new Map();
let counter = 1;
function newId() { return String(counter++).padStart(24, '0'); }
function isValidId(id) { return typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id); }

// Wraps an async factory in the same shape Mongoose query objects have: awaitable directly, or via a trailing .lean()/.sort() call. drawBasketStore.js only ever uses those two chain shapes.
function chain(run) {
    const obj = {
        then: (...a) => run().then(...a),
        catch: (...a) => run().catch(...a),
        lean: () => run(),
        sort: () => obj
    };
    return obj;
}

const modelPath = require.resolve('../models/DrawBasket');
require.cache[modelPath] = new Module(modelPath, null);
require.cache[modelPath].filename = modelPath;
require.cache[modelPath].loaded = true;
require.cache[modelPath].exports = {
    create: async (data) => {
        const _id = newId();
        const doc = { banners: [], region: 'region_10', balance: 0, includeUpgrades: false, entitlementMask: 0, createdAt: new Date(), ...data, _id };
        rows.set(_id, doc);
        return { toObject: () => ({ ...doc }) };
    },
    findById: (id) => chain(async () => {
        if (!isValidId(id)) throw new Error('CastError: malformed ObjectId'); // mirrors real Mongoose behaviour on a bad id
        const doc = rows.get(String(id));
        return doc ? { ...doc } : null;
    }),
    findByIdAndUpdate: (id, update) => chain(async () => {
        const doc = rows.get(String(id));
        if (!doc) return null;
        if (update.$set) Object.assign(doc, update.$set);
        if (update.$unset) for (const k of Object.keys(update.$unset)) delete doc[k];
        rows.set(String(id), doc);
        return { ...doc };
    }),
    find: (query) => chain(async () => [...rows.values()]
        .filter(d => d.discordId === query.discordId && d.name !== undefined && d.name !== '')
        .map(d => ({ ...d }))),
    deleteOne: async (query) => { rows.delete(String(query._id)); }
};

const store = require('../utils/drawBasketStore');

let failed = 0, passed = 0;
async function t(name, fn) {
    try { await fn(); passed++; console.log(`  PASS  ${name}`); }
    catch (err) { failed++; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}

const OWNER = '1139845545754632283';
const OTHER = '999999999999999999';

(async () => {
    console.log('\ndrawBasketStore -- create/load/save/rename/remove against a stubbed model\n');

    let basketId;
    await t('save with no _id CREATES a new basket, unnamed', async () => {
        const created = await store.save(OWNER, { banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] });
        assert.ok(created._id, 'created basket must carry an id');
        assert.strictEqual(created.name, undefined, 'a freshly created basket must be unnamed');
        assert.strictEqual(created.banners.length, 1);
        basketId = created._id;
    });

    await t('load returns the basket for its OWNER', async () => {
        const loaded = await store.load(OWNER, basketId);
        assert.ok(loaded, 'owner must be able to load their own basket');
        assert.strictEqual(loaded.banners[0].drawKey, 'mythicWeapon');
    });

    await t('load returns null for a THIRD PARTY, never the basket', async () => {
        const loaded = await store.load(OTHER, basketId);
        assert.strictEqual(loaded, null, 'a non-owner must never see the basket, not even read-only');
    });

    await t('load returns null for a missing basketId, never throws', async () => {
        const loaded = await store.load(OWNER, '000000000000000000009999');
        assert.strictEqual(loaded, null);
    });

    await t('load returns null (not a thrown error) for a MALFORMED id -- a stale/forged customId must not crash the panel', async () => {
        const loaded = await store.load(OWNER, 'not-a-real-object-id');
        assert.strictEqual(loaded, null);
    });

    await t('save with an existing _id updates banners/region/balance in place', async () => {
        const updated = await store.save(OWNER, {
            _id: basketId,
            banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }, { drawKey: 'mythicCharacter', pullsDone: 0 }],
            region: 'region_20',
            balance: 5000
        });
        assert.strictEqual(updated.banners.length, 2, 'the flat banner list must be exactly what was saved -- no quantity merging');
        assert.strictEqual(updated.region, 'region_20');
        assert.strictEqual(updated.balance, 5000);
    });

    await t('save cannot be used by a non-owner to edit someone else\'s basket', async () => {
        const result = await store.save(OTHER, { _id: basketId, balance: 999999 });
        assert.strictEqual(result, null, 'a save targeting a basket the caller does not own must be refused, not silently redirected');
        const stillOwners = await store.load(OWNER, basketId);
        assert.strictEqual(stillOwners.balance, 5000, 'the real owner\'s data must be untouched by the refused save');
    });

    await t('save NEVER touches name -- only rename does', async () => {
        await store.rename(OWNER, basketId, 'Season 12 push');
        const afterSave = await store.save(OWNER, { _id: basketId, balance: 6000 });
        assert.strictEqual(afterSave.name, 'Season 12 push', 'a generic save must not clear a name it was never given');
    });

    await t('listForUser returns only NAMED baskets', async () => {
        const unnamed = await store.save(OWNER, {});
        const named = await store.listForUser(OWNER);
        assert.ok(named.some(b => b._id === basketId), 'the named basket must appear in the list');
        assert.ok(!named.some(b => b._id === unnamed._id), 'an unnamed basket must never appear in the saved-basket list');
    });

    await t('rename to a blank string returns the basket to unnamed (drops out of listForUser again)', async () => {
        await store.rename(OWNER, basketId, '   ');
        const list = await store.listForUser(OWNER);
        assert.ok(!list.some(b => b._id === basketId), 'renaming to blank must remove it from the named list');
        const stillLoadable = await store.load(OWNER, basketId);
        assert.ok(stillLoadable, 'the basket itself must still exist -- renaming to blank is not deleting');
    });

    await t('rename refuses a non-owner', async () => {
        const result = await store.rename(OTHER, basketId, 'hijacked');
        assert.strictEqual(result, null);
    });

    await t('remove deletes the basket for its owner, and load then returns null', async () => {
        const created = await store.save(OWNER, { banners: [] });
        const ok = await store.remove(OWNER, created._id);
        assert.strictEqual(ok, true);
        assert.strictEqual(await store.load(OWNER, created._id), null);
    });

    await t('remove refuses a non-owner and leaves the basket intact', async () => {
        const created = await store.save(OWNER, { banners: [] });
        const ok = await store.remove(OTHER, created._id);
        assert.strictEqual(ok, false, 'a non-owner must never be able to delete another user\'s basket');
        assert.ok(await store.load(OWNER, created._id), 'the basket must still exist after a refused delete');
    });

    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(failed === 0 ? 0 : 1);
})();
