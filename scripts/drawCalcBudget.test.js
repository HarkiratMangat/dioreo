// scripts/drawCalcBudget.test.js
// Regression test for /draw calculator's two panels' COMPONENT BUDGET. Modeled on
// scripts/colorPanelBudget.test.js (read first, per the plan -- same shape, same reasoning).
// Run: `node scripts/drawCalcBudget.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS. Components V2 allows 40 components per message, COUNTED RECURSIVELY. Exceeding
// it is a hard COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED send failure -- a real production crash this
// repo has already taken once (see .claude/rules/rendering-and-ui.md). The design spec sizes a single
// combined panel at ~31 components with "almost no headroom on precisely the section most likely to
// grow", which is exactly why this is a two-stage panel and exactly why the worst case needs
// asserting rather than remembering.
const assert = require('assert');
const { defaultState, buildSetupPanel, buildResultsPanel } = require('../commands/drawCalculator');

let failed = 0;
let passed = 0;
function t(name, fn) {
    try { fn(); passed++; console.log(`  PASS  ${name}`); }
    catch (err) { failed++; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}

const LIMIT = 40;
// The same recursive count Discord applies: every component object, plus anything nested in
// `components` or `accessory`.
const countComponents = node => Array.isArray(node)
    ? node.reduce((n, x) => n + countComponents(x), 0)
    : (node && typeof node === 'object')
        ? 1 + countComponents(node.components || []) + (node.accessory ? countComponents(node.accessory) : 0)
        : 0;

console.log('\n/draw calculator -- component budget and the worst cases that spend it\n');

// Worst case for Stage A: a mythic draw (upgrade toggle renders) with a live 2X event (entitlement
// select renders too) and the upgrade actually included.
t('Stage A (setup) worst case stays under the 40-component cap', () => {
    const state = { ...defaultState(), drawKey: 'mythicWeapon', includeUpgrades: true };
    const panel = buildSetupPanel(state, 2067038, {
        liveDoubleCPEntry: { isDoubleCP: true, endDate: new Date(Date.now() + 86400000) }
    });
    const n = countComponents(panel);
    console.log(`        Stage A worst case: ${n}/${LIMIT} components`);
    assert.ok(n <= LIMIT, `Stage A rendered ${n} components, over the ${LIMIT} cap`);
});

t('Stage A (setup) without upgrade/entitlements is smaller than the worst case', () => {
    const state = { ...defaultState(), drawKey: 'legendaryGunReactive' };
    const panel = buildSetupPanel(state, 2067038, { liveDoubleCPEntry: null });
    const worst = countComponents(buildSetupPanel({ ...defaultState(), drawKey: 'mythicWeapon', includeUpgrades: true }, 2067038, { liveDoubleCPEntry: { isDoubleCP: true } }));
    const n = countComponents(panel);
    console.log(`        Stage A minimal case: ${n}/${LIMIT} components`);
    assert.ok(n < worst, 'a draw with no upgrade and no live event should render FEWER components than the worst case');
});

// Worst case for Stage B: a mythic draw, upgrade included, ALL SIX 2X entitlements available (so
// both the cheapest and least-waste passes have real work to do and are likely to differ), and a
// client present so the mentionCommand footer line renders too.
t('Stage B (results) worst case stays under the 40-component cap', () => {
    const state = { ...defaultState(), drawKey: 'mythicWeapon', pullsDone: 0, balance: 0, includeUpgrades: true, entitlementMask: 0b111111 };
    const panel = buildResultsPanel(state, 2067038, { currency: 'CAD', client: { commandIds: new Map() } });
    const n = countComponents(panel);
    console.log(`        Stage B worst case: ${n}/${LIMIT} components`);
    assert.ok(n <= LIMIT, `Stage B rendered ${n} components, over the ${LIMIT} cap`);
});

t('cheapest and least-waste CAN genuinely differ (so the panel branch that renders both is real, not dead code)', () => {
    // 11000 is one of the shortfalls scripts/cpPackages.test.js's own "least-waste never overshoots
    // more than cheapest" check is pinned against -- reusing a known-differing value here rather
    // than assuming the specific worst-case draw scenario produces one (it happens not to: 11,510
    // CP with all six entitlements available lands both passes on the identical combo).
    const { optimizePurchase } = require('../utils/cpPackages');
    const result = optimizePurchase(11000, { currency: 'USD' });
    const differ = result.leastWaste.totalCents !== result.cheapest.totalCents || result.leastWaste.leftoverCp !== result.cheapest.leftoverCp;
    assert.ok(differ, 'expected 11000 to produce different cheapest/least-waste combos -- if this now fails, buildResultsPanel\'s "render both when they differ" branch may be silently dead');
});

t('Stage B already-covered branch (smallest content) is smaller than the worst case', () => {
    const state = { ...defaultState(), drawKey: 'legendaryGunReactive', pullsDone: 9, balance: 999999 };
    const panel = buildResultsPanel(state, 2067038, { currency: 'USD' });
    const worst = countComponents(buildResultsPanel({ ...defaultState(), drawKey: 'mythicWeapon', pullsDone: 0, balance: 0, includeUpgrades: true, entitlementMask: 0b111111 }, 2067038, { currency: 'CAD', client: { commandIds: new Map() } }));
    const n = countComponents(panel);
    console.log(`        Stage B already-covered case: ${n}/${LIMIT} components`);
    assert.ok(n < worst, 'the already-covered branch renders no optimizer output, so it should be smaller than the worst case');
});

t('Stage B absent-data degradation renders (no crash) and stays small', () => {
    const state = { ...defaultState(), region: 'region_20', drawKey: 'doubleEpicCharacters' };
    const panel = buildResultsPanel(state, 2067038, {});
    const n = countComponents(panel);
    console.log(`        Stage B absent-data case: ${n}/${LIMIT} components`);
    assert.ok(n <= LIMIT, `absent-data panel rendered ${n} components, over the ${LIMIT} cap`);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
