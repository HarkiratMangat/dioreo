// scripts/drawCalcBudget.test.js  /draw calculator's ONE panel: component budget, and the render invariants proven by reading the actual output rather than trusting a structural pass. Run: `node scripts/drawCalcBudget.test.js` (also via `npm test`).
//
// ⚠️ FOURTH PASS, 2026-08-26 17:29 EDT -- rewritten wholesale for the rebuild against Harkirat's own mockup (see commands/drawCalculator.js's header). The Section/accessory structure the third pass's tests pinned is gone; everything here targets plain Text Displays + Action Rows, matching what actually ships now.
//
// ⚠️ WHY THE BUDGET HALF EXISTS. Components V2 allows 40 components per message, COUNTED RECURSIVELY. Exceeding it is a hard COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED send failure -- a real production crash this repo has already taken once (see .claude/rules/rendering-and-ui.md). The count asserted here includes the global nav row and the share button, because those are siblings in the same message and Discord counts the message.
//
// ⚠️ WHY THE INVARIANTS EXIST. A structural/component-count check cannot see WHAT a panel says -- it was a live defect here (the literal word "null" rendered for a draw with no data at the selected region, three months, six green suites) that made rendering-and-reading the standing practice for this file. Every case below reads the actual rendered content.
const assert = require('assert');
const {
    defaultState, clampStateToDraw, buildCalculatorPanel, encodeState, decodeState,
    entryFor, regionsWithData, progressBar, shortfallFor
} = require('../commands/drawCalculator');
const { DRAW_META, REGION_ORDER } = require('../commands/drawprices');
const { pullCount } = require('../utils/drawCost');
const { buildGlobalNavRow } = require('../utils/globalNav');

let failed = 0;
let passed = 0;
function t(name, fn) {
    try { fn(); passed++; console.log(`  PASS  ${name}`); }
    catch (err) { failed++; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}

const LIMIT = 40;
const ACCENT = 2067038;
const CLIENT = { commandIds: new Map() };
// The same recursive count Discord applies: every component object, plus anything nested in `components` or `accessory`.
const countComponents = node => Array.isArray(node)
    ? node.reduce((n, x) => n + countComponents(x), 0)
    : (node && typeof node === 'object')
        ? 1 + countComponents(node.components || []) + (node.accessory ? countComponents(node.accessory) : 0)
        : 0;
const SHARE_ROW = { type: 1, components: [{ type: 2, style: 2, label: 'Show Everyone', custom_id: 'share_public' }] };
const messageCount = panel => countComponents([panel, buildGlobalNavRow('nav_prices'), SHARE_ROW]);

const texts = panel => panel.components.filter(c => c.type === 10).map(c => c.content);
const allText = panel => texts(panel).join('\n');
const rows = panel => panel.components.filter(c => c.type === 1);
const buttons = panel => rows(panel).flatMap(r => r.components).filter(c => c.type === 2);
const selects = panel => rows(panel).flatMap(r => r.components).filter(c => c.type === 3);
const selectFor = (panel, verb) => selects(panel).find(s => s.custom_id.split('~')[1] === verb);
const buttonLabelled = (panel, label) => buttons(panel).find(b => b.label === label);
const render = (extra, opts) => buildCalculatorPanel(clampStateToDraw({ ...defaultState(), ...extra }), ACCENT, { currency: 'CAD', client: CLIENT, ...opts });

console.log('\n/draw calculator -- component budget and what the panel actually says\n');

// ==========================================
// COMPONENT BUDGET
// ==========================================
t('every draw x region x goal x detail-state combination stays under the cap', () => {
    let worst = 0;
    let worstLabel = '';
    for (const drawKey of Object.keys(DRAW_META)) {
        for (const region of REGION_ORDER) {
            const total = pullCount(region, drawKey);
            const goals = total === null ? [{ target: 'F', targetValue: 0 }] : [
                { target: 'F', targetValue: 0 },
                { target: 'P', targetValue: total },
                { target: 'B', targetValue: 5000 }
            ];
            for (const goal of goals) {
                for (const detail of [false, true]) {
                    const panel = render({ drawKey, region, includeUpgrades: true, entitlementMask: 0b111111, detail, ...goal },
                        { liveDoubleCPEntry: { isDoubleCP: true, endDate: new Date(Date.now() + 86400000) } });
                    const n = messageCount(panel);
                    if (n > worst) { worst = n; worstLabel = `${drawKey}/${region}/${goal.target}/detail:${detail}`; }
                    assert.ok(n <= LIMIT, `${drawKey} at ${region} (${goal.target}, detail:${detail}) rendered ${n} components`);
                }
            }
        }
    }
    console.log(`        worst across the whole matrix: ${worst}/${LIMIT} (${worstLabel})`);
});

t('no action row ever exceeds Discord\'s five components', () => {
    for (const drawKey of Object.keys(DRAW_META)) {
        for (const region of REGION_ORDER) {
            for (const detail of [false, true]) {
                const panel = render({ drawKey, region, includeUpgrades: true, entitlementMask: 0b111111, detail }, { liveDoubleCPEntry: { isDoubleCP: true } });
                for (const row of rows(panel)) {
                    assert.ok(row.components.length <= 5, `${drawKey} at ${region} (detail:${detail}) rendered a row of ${row.components.length}`);
                }
            }
        }
    }
});

t('every custom_id the panel emits fits Discord\'s 100-character cap', () => {
    const panel = render({ drawKey: 'mythicWeapon', pullsDone: 9, target: 'P', targetValue: 10, balance: 999999, entitlementMask: 0b111111, includeUpgrades: true, detail: true }, { liveDoubleCPEntry: { isDoubleCP: true } });
    for (const c of [...selects(panel), ...buttons(panel)]) {
        assert.ok(c.custom_id.length <= 100, `custom_id ${c.custom_id} is ${c.custom_id.length} chars`);
    }
});

// ==========================================
// LANDING STATE
// ==========================================
t('a fresh /draw calculator opens on the LANDING state -- no draw picked, no number computed', () => {
    assert.strictEqual(defaultState().drawKey, null, 'defaultState() must not pre-pick a draw');
    const panel = render({});
    assert.ok(!/null/i.test(JSON.stringify(panel)), 'landing must never leak the literal word null');
    assert.ok(!/CP\*\*/.test(allText(panel)), 'no CP figure should be computed before a draw is chosen');
    const draw = selectFor(panel, 'draw');
    assert.ok(draw, 'the draw select must render on landing');
    assert.ok(!draw.options.some(o => o.default), 'no option may carry default:true on landing -- that is what makes Discord show the real placeholder');
    assert.strictEqual(selectFor(panel, 'pulls'), undefined, 'no pulls select on landing');
    assert.strictEqual(selectFor(panel, 'goal'), undefined, 'no goal select on landing');
});

t('picking a draw from landing transitions cleanly into the live panel', () => {
    const picked = decodeState(encodeState('draw', { ...defaultState(), drawKey: 'mythicWeapon' }));
    assert.strictEqual(picked.drawKey, 'mythicWeapon');
    const panel = buildCalculatorPanel(clampStateToDraw(picked), ACCENT, {});
    assert.ok(selectFor(panel, 'pulls'), 'pulls select must appear once a draw is chosen');
});

t('a customId with no drawKey field at all decodes to landing, not to the first draw', () => {
    const decoded = decodeState('calc~region~r10~p0~tF~v0~b0~u0~e0~x0');
    assert.strictEqual(decoded.drawKey, null, 'a missing d field must decode to landing, never to DRAW_KEYS[0]');
});

// ==========================================
// ABSENT DATA
// ==========================================
t('a draw with no data at the selected region never renders the word null', () => {
    for (const region of ['region_20', 'region_30']) {
        const panel = render({ drawKey: 'doubleEpicCharacters', region });
        assert.ok(!/null/i.test(JSON.stringify(panel)), `${region} rendered a literal null`);
    }
});

t('the no-data panel names the regions that DO have the draw and renders no pull/goal select', () => {
    const panel = render({ drawKey: 'doubleEpicCharacters', region: 'region_20' });
    assert.ok(allText(panel).includes('10 CP'), 'no-data panel must name the region that DOES have the draw');
    assert.strictEqual(selectFor(panel, 'pulls'), undefined);
    assert.strictEqual(selectFor(panel, 'goal'), undefined);
    assert.ok(selectFor(panel, 'draw'), 'the draw select must stay -- it is how you leave this draw');
});

// ==========================================
// THE TOP SUMMARY BLOCK (reused from /draw prices)
// ==========================================
t('the top block matches buildDrawEntries verbatim, including the FULL-CAPS heading and the CP-Spent ladder', () => {
    const panel = render({ drawKey: 'mythicWeapon' });
    const body = allText(panel);
    assert.ok(body.includes('MYTHIC WEAPON DRAW'), 'full-caps heading must appear, matching /draw prices\' own convention');
    assert.ok(body.includes('**CP Spent:**'), 'the cumulative spend ladder must appear');
    assert.ok(body.includes('5,700 CP Upgrade'), 'the Weapon Upgrade sub-block must appear unconditionally, regardless of the Upgrade toggle');
});

t('the upgrade sub-heading gets its OWN card emoji, and only for the two draws that have one', () => {
    const withCard = allText(render({ drawKey: 'mythicWeapon' }));
    assert.ok(withCard.includes('<:MythicCard:1542258676889288794> **Weapon Upgrade**'), 'mythicWeapon must get the MythicCard emoji on its upgrade sub-heading');
    const withCoin = allText(render({ drawKey: 'mythicCharacter' }));
    assert.ok(withCoin.includes('<:MythicCoin:1542258675706757150> **Character Upgrade**'), 'mythicCharacter must get the MythicCoin emoji on its upgrade sub-heading');
    const noUpgrade = allText(render({ drawKey: 'legendaryGunReactive' }));
    assert.ok(!/MythicCard|MythicCoin/.test(noUpgrade), 'a draw with no upgrade step must carry neither emoji');
});

// ==========================================
// COST BREAKDOWN -- collapsed vs expanded
// ==========================================
t('no lingering "-# > " blockquote marker anywhere -- replaced with the diamond emoji per Harkirat\'s direct request', () => {
    const panel = render({ drawKey: 'mythicCharacter', detail: true });
    assert.ok(!/-# >/.test(allText(panel)), 'the blockquote-prefixed small-text label must be gone');
    assert.ok(allText(panel).includes('🔹 TYPE:'), 'replaced with the diamond marker');
});

t('the reused /draw-prices summary renders as SEPARATE Text Displays, not one joined block -- that gap IS the vertical spacing', () => {
    const panel = render({ drawKey: 'mythicCharacter' });
    const summaryTexts = texts(panel).slice(1, 4); // title, then the 3 buildDrawEntries blocks
    assert.strictEqual(summaryTexts.length, 3, 'mythicCharacter has an upgrade step, so buildDrawEntries returns 3 blocks -- each must be its own component');
    assert.ok(summaryTexts[0].includes('MYTHIC CHARACTER'));
    assert.ok(summaryTexts[2].includes('Character Upgrade'));
});

t('collapsed view shows PROGRESS + CP SPENT/NEEDED + one compact Cheapest line -- no TYPE, TOTAL PRICE, PENDING, BALANCE, Least Waste, or NOTE', () => {
    const panel = render({ drawKey: 'mythicWeapon' });
    const body = allText(panel);
    assert.ok(/PROGRESS:/.test(body) && /CP SPENT:/.test(body), 'progress + spent/needed must always show');
    assert.ok(/\*\*Cheapest:\*\*/.test(body), 'the compact one-line Cheapest must render');
    assert.ok(!/🔹 TYPE:/.test(body), 'TYPE is full-mode only -- it duplicates the top block, collapsed drops it');
    assert.ok(!/🔹 TOTAL PRICE:/.test(body), 'TOTAL PRICE is full-mode only');
    assert.ok(!/> PENDING:/.test(body), 'PENDING is full-mode only');
    assert.ok(!/> BALANCE:/.test(body), 'BALANCE is full-mode only');
    assert.ok(!/Least Waste Method/.test(body), 'Least Waste is full-mode only');
    assert.ok(!/NOTE: Estimate/.test(body), 'the NOTE disclaimer is full-mode only');
    assert.ok(buttonLabelled(panel, 'Show Breakdown'), 'the toggle must read "Show Breakdown" while collapsed');
});

t('expanded view shows every field from the mockup: TYPE, TOTAL PRICE, PROGRESS, PENDING, BALANCE, CP SPENT/NEEDED, RECOMMENDED PACKAGE with per-item pricing and Left Over, and the NOTE', () => {
    const panel = render({ drawKey: 'mythicWeapon', detail: true });
    const body = allText(panel);
    for (const needle of ['🔹 TYPE:', '🔹 TOTAL PRICE:', '🔹 PROGRESS:', '🔹 PENDING:', '🔹 BALANCE:', '🔹 CP SPENT:', 'Cheapest Method', 'Left Over:', 'NOTE: Estimate']) {
        assert.ok(body.includes(needle), `expanded view is missing "${needle}"`);
    }
    assert.ok(!/\*\*Cheapest:\*\*/.test(body), 'the compact one-liner must not ALSO render -- one or the other, never both');
    assert.ok(buttonLabelled(panel, 'Simplify'), 'the toggle must read "Simplify" once expanded, per Harkirat\'s own wording');
});

t('CP NEEDED includes the upgrade whenever the Upgrade toggle is on, in BOTH compact and full modes', () => {
    const withUpgrade = allText(render({ drawKey: 'mythicWeapon', includeUpgrades: true }));
    assert.ok(withUpgrade.includes('CP NEEDED: **`11,510 CP`**'), 'compact mode must still reflect the upgrade toggle');
    const withUpgradeFull = allText(render({ drawKey: 'mythicWeapon', includeUpgrades: true, detail: true }));
    assert.ok(withUpgradeFull.includes('CP NEEDED: **`11,510 CP`**'));
    const without = allText(render({ drawKey: 'mythicWeapon' }));
    assert.ok(without.includes('CP NEEDED: **`5,810 CP`**'), 'upgrade off must exclude it from CP NEEDED');
});

t('a balance that covers the goal shows the covered message and no RECOMMENDED PACKAGE at all', () => {
    const panel = render({ drawKey: 'mythicWeapon', balance: 99999, detail: true });
    const body = allText(panel);
    assert.ok(/already covers this/.test(body));
    assert.ok(!/RECOMMENDED PACKAGE/.test(body), 'no purchase recommendation should render when nothing needs buying');
});

t('the Left Over equation nets against the BALANCE-ADJUSTED shortfall, not the raw CP needed', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'mythicWeapon', balance: 4000, detail: true });
    const total = pullCount(state.region, state.drawKey);
    const shortfall = shortfallFor(state, total, null);
    const panel = buildCalculatorPanel(state, ACCENT, { currency: 'CAD' });
    assert.ok(allText(panel).includes(`${shortfall.toLocaleString('en-US')} CP Needed)`), 'Left Over\'s equation must use the netted shortfall, matching shortfallFor exactly');
});

// ==========================================
// BUDGET MODE
// ==========================================
t('budget mode with no value yet prompts for Set Budget and computes nothing', () => {
    const panel = render({ drawKey: 'mythicWeapon', target: 'B' });
    assert.ok(/Press \*\*Set Budget\*\*/.test(allText(panel)));
    assert.ok(buttonLabelled(panel, 'Set Budget'));
});

t('budget mode with a value set reaches the correct pull, and the ladder bolds exactly the pulls covered', () => {
    const { reachableWithBudget } = require('../utils/drawCost');
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'mythicWeapon', target: 'B', targetValue: 5000, detail: true });
    const reachable = reachableWithBudget(state.region, state.drawKey, 0, 5000).pullsReachable;
    const panel = buildCalculatorPanel(state, ACCENT, {});
    const line = texts(panel).find(c => c.includes('**Pulls from here:**'));
    const bolded = line.split('**Pulls from here:**')[1].split('/').filter(s => s.trim().startsWith('**')).length;
    assert.strictEqual(bolded, reachable, `budget reaches ${reachable} pulls but ${bolded} are bolded`);
});

// ==========================================
// CONTROLS
// ==========================================
t('the goal select enumerates this draw\'s real pull count -- seven, not ten', () => {
    const panel = render({ drawKey: 'sevenSpinLegendaryWeapon' });
    assert.strictEqual(selectFor(panel, 'goal').options.length, 7 + 2, 'goal select does not match the draw\'s pull count');
    assert.strictEqual(selectFor(panel, 'pulls').options.length, 7 + 1);
});

t('every option value round-trips through the state codec, including detail', () => {
    const flipped = decodeState(encodeState('detail', { ...defaultState(), drawKey: 'mythicWeapon', pullsDone: 3, balance: 4000, detail: true }));
    assert.strictEqual(flipped.detail, true);
    assert.strictEqual(flipped.pullsDone, 3);
    assert.strictEqual(flipped.balance, 4000);
});

t('switching to a shorter draw cannot leave an impossible pulls-done or target behind', () => {
    const stale = { ...defaultState(), drawKey: 'sevenSpinLegendaryWeapon', pullsDone: 10, target: 'P', targetValue: 10 };
    const clamped = clampStateToDraw(stale);
    assert.strictEqual(clamped.pullsDone, 7);
    assert.strictEqual(clamped.target, 'F');
});

t('the progress bar has exactly one cell per pull', () => {
    assert.strictEqual([...progressBar(3, 10)].length, 10);
    assert.strictEqual([...progressBar(99, 7)].length, 7);
});

t('entryFor and regionsWithData agree with DRAW_DATA itself', () => {
    for (const drawKey of Object.keys(DRAW_META)) {
        const expected = REGION_ORDER.filter(r => entryFor(r, drawKey));
        assert.deepStrictEqual(regionsWithData(drawKey), expected);
    }
    assert.deepStrictEqual(regionsWithData('doubleEpicCharacters'), ['region_10']);
});

t('cheapest and least-waste CAN genuinely differ (so the panel branch that renders both is real, not dead code)', () => {
    const { optimizePurchase } = require('../utils/cpPackages');
    const result = optimizePurchase(11000, { currency: 'USD' });
    const differ = result.leastWaste.totalCents !== result.cheapest.totalCents || result.leastWaste.leftoverCp !== result.cheapest.leftoverCp;
    assert.ok(differ, 'expected 11000 to produce different cheapest/least-waste combos');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
