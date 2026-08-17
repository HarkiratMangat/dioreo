// Conservation tests for the draw remainder math (utils/drawCost.js, 2026-08-15 17:48 EDT). Design: docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md.
//
// WHAT THIS IS FOR. Every figure the calculator shows is a slice of DRAW_DATA's per-pull arrays, so the whole class of bugs available here is "the slice was taken wrong". The conservation check below (spent + remaining == total, for EVERY pullsDone) catches an off-by-one at any boundary in one assertion. It also pins the two draws that are NOT ten pulls, which is the specific mistake a hardcoded 10 would produce and which casual testing on the common draws would never surface.

const assert = require('assert');
const { DRAW_DATA, REGION_ORDER } = require('../commands/drawprices');
const cost = require('../utils/drawCost');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
}

const drawKeys = Object.keys(DRAW_DATA.region_10).filter(k => k !== 'label');

check('spent + remaining equals the full total at every pull position', () => {
    for (const region of REGION_ORDER) {
        for (const key of drawKeys) {
            const entry = DRAW_DATA[region][key];
            if (!entry) continue; // doubleEpicCharacters is null at region_20 and region_30
            const total = entry.draws.reduce((a, b) => a + b, 0);
            for (let done = 0; done <= entry.draws.length; done++) {
                const spent = cost.spentSoFar(region, key, done);
                const left = cost.remainingToFinish(region, key, done);
                assert.strictEqual(spent + left, total,
                    `${region}/${key} at ${done} pulls: ${spent} + ${left} != ${total}`);
            }
        }
    }
});

check('the two seven-pull draws are not treated as ten', () => {
    assert.strictEqual(cost.pullCount('region_10', 'sevenSpinLegendaryWeapon'), 7);
    assert.strictEqual(cost.pullCount('region_10', 'pickYourRewardCard'), 7);
    assert.strictEqual(cost.pullCount('region_10', 'mythicWeapon'), 10);
});

check('every draw key across every region resolves the correct pull count from draws.length', () => {
    for (const region of REGION_ORDER) {
        for (const key of drawKeys) {
            const entry = DRAW_DATA[region][key];
            if (!entry) continue;
            assert.strictEqual(cost.pullCount(region, key), entry.draws.length, `${region}/${key} pull count mismatch`);
        }
    }
});

check('absent data returns null rather than a fabricated number', () => {
    assert.strictEqual(cost.remainingToFinish('region_20', 'doubleEpicCharacters', 0), null);
    assert.strictEqual(cost.remainingToFinish('region_30', 'doubleEpicCharacters', 0), null);
    assert.strictEqual(cost.spentSoFar('region_20', 'doubleEpicCharacters', 0), null);
    assert.strictEqual(cost.pullCount('region_20', 'doubleEpicCharacters'), null);
    assert.strictEqual(cost.upgradeCost('region_20', 'mythicWeapon'), null);
    assert.strictEqual(cost.upgradeCost('region_20', 'mythicCharacter'), null);
});

check('upgrade cost is perDraw times count where it exists', () => {
    assert.strictEqual(cost.upgradeCost('region_10', 'mythicWeapon'), 570 * 10);
    assert.strictEqual(cost.upgradeCost('region_10', 'mythicCharacter'), 855 * 14);
    assert.strictEqual(cost.upgradeCost('region_30', 'mythicWeapon'), 1440 * 10);
    assert.strictEqual(cost.upgradeCost('region_30', 'mythicCharacter'), 1440 * 14);
    assert.strictEqual(cost.upgradeCost('region_10', 'legendaryGunReactive'), null);
});

check('remainingToPull is a strict prefix of remainingToFinish', () => {
    const full = cost.remainingToFinish('region_10', 'mythicWeapon', 2);
    const toNine = cost.remainingToPull('region_10', 'mythicWeapon', 2, 9);
    const last = DRAW_DATA.region_10.mythicWeapon.draws[9];
    assert.strictEqual(toNine + last, full);
});

check('budget mode reports how far the money goes and what is still short', () => {
    // region_10 mythicWeapon from a standing start: 10, 30, 50, 120 -> 210 after four pulls.
    const r = cost.reachableWithBudget('region_10', 'mythicWeapon', 0, 210);
    assert.strictEqual(r.pullsReachable, 4);
    assert.strictEqual(r.cpUsed, 210);
    assert.strictEqual(r.cpShortOfNext, 200); // pull 5 costs 200
});

check('budget mode reports null shortfall when the budget finishes the draw outright', () => {
    const total = DRAW_DATA.region_10.sevenSpinLegendaryWeapon.draws.reduce((a, b) => a + b, 0);
    const r = cost.reachableWithBudget('region_10', 'sevenSpinLegendaryWeapon', 0, total + 5000);
    assert.strictEqual(r.pullsReachable, 7);
    assert.strictEqual(r.cpShortOfNext, null);
});

console.log(failures === 0 ? '\nAll draw cost checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
