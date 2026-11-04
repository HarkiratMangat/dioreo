// scripts/drawCalcHandler.test.js -- /draw calculator's buttons end to end on a saved calculation: Calculate, moving a line, removing one with its confirm, New Calculation and Restore, and someone else's button (code-housekeeping, 2026-11-04 12:26 EST). Runs on scripts/lib/manageHarness.cjs: DrawBasket is an in-memory collection.
const assert = require('assert');
const h = require('./lib/manageHarness.cjs');
const { encodeState } = require('../commands/drawCalculator');
const { handleDrawCalcInteraction } = require('../handlers/drawCalc');
const store = require('../utils/drawBasketStore');
const { DrawBasket } = h.collections;

const ME = '111111111111111111';           // calculator ids carry the author in base 36, so a test id must be a real snowflake shape
const SOMEONE = '222222222222222222';
const keys = () => DrawBasket.rows[0].banners.map(b => b.drawKey).join('|');
async function fresh() {
    DrawBasket.seed([]);
    return store.save(ME, { banners: [{ drawKey: 'legendaryGunReactive' }, { drawKey: 'mythicWeapon' }] });
}
async function press(basket, verb, { focus, user = ME } = {}) {
    const id = encodeState(verb, { basketId: String(basket._id), authorId: ME, ...(focus === undefined ? {} : { focus }) });
    const i = Object.assign(h.modal(id, {}, { user }), { isButton: () => true, isModalSubmit: () => false, isStringSelectMenu: () => false });
    await handleDrawCalcInteraction(i);
    return i;
}
let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); }
}

(async () => {
    await check('Calculate marks the calculation submitted and redraws the panel', async () => {
        const b = await fresh();
        const i = await press(b, 'submit');
        assert.strictEqual(DrawBasket.rows[0].submitted, true);
        assert.ok(i.sent.length, 'the panel is redrawn');
    });

    await check('moving a line down swaps it with the next one', async () => {
        const b = await fresh();
        await press(b, 'down', { focus: 0 });
        assert.strictEqual(keys(), 'mythicWeapon|legendaryGunReactive');
    });

    await check('Remove asks first; Yes removes only the focused line', async () => {
        const b = await fresh();
        await press(b, 'delarm', { focus: 0 });
        assert.strictEqual(keys(), 'legendaryGunReactive|mythicWeapon', 'nothing removed before the confirm');
        await press(b, 'dellineok', { focus: 0 });
        assert.strictEqual(keys(), 'mythicWeapon');
    });

    await check('New Calculation clears the lines and keeps a copy; Restore brings it back', async () => {
        const b = await fresh();
        await press(b, 'submit');
        await press(b, 'reset');
        assert.strictEqual(DrawBasket.rows[0].banners.length, 0);
        assert.ok(DrawBasket.rows[0].previous, 'the cleared calculation is kept');
        await press(b, 'restore');
        assert.strictEqual(keys(), 'legendaryGunReactive|mythicWeapon');
        assert.strictEqual(DrawBasket.rows[0].submitted, true);
    });

    await check("someone else's button changes nothing and says whose calculator it is", async () => {
        const b = await fresh();
        const i = await press(b, 'submit', { user: SOMEONE });
        assert.strictEqual(DrawBasket.rows[0].submitted, false);
        assert.ok(/isn't your calculator/.test(i.text()), i.text());
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/draw calculator buttons: all checks pass');
    process.exit(0);
})();
