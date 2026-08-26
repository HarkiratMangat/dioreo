// scripts/drawCalcBudget.test.js  /draw calculator's ONE panel: component budget, and the render invariants that were live defects before the 2026-08-26 rebuild. Run: `node scripts/drawCalcBudget.test.js` (also via `npm test`).
//
// ⚠️ WHY THE BUDGET HALF EXISTS. Components V2 allows 40 components per message, COUNTED RECURSIVELY. Exceeding it is a hard COMPONENT_MAX_TOTAL_COMPONENTS_EXCEEDED send failure -- a real production crash this repo has already taken once (see .claude/rules/rendering-and-ui.md). The panel is now a SINGLE stage rather than two, so it carries every control and every answer at once and the cap matters more than it did, not less. The count asserted here includes the global nav row and the share button, because those are siblings in the same message and Discord counts the message.
//
// ⚠️ WHY THE REST EXISTS. Each remaining case pins a defect that was live in the two-stage build and that every existing gate passed over, because none of them read what the panel SAYS:
//   · the word "null" rendered in three places for a draw with no data at the selected region, and the modal rejected every pull count against it;
//   · "stop at pull 5" printed all ten pulls under a headline that priced five;
//   · the headline read the raw total while the line under it read the balance-netted one, so the two contradicted each other whenever a balance was entered.
// A structural check cannot see any of those. These read the rendered strings.
const assert = require('assert');
const {
    defaultState, clampStateToDraw, buildCalculatorPanel, encodeState, decodeState,
    entryFor, regionsWithData, progressBar, shortfallFor
} = require('../commands/drawCalculator');
const { DRAW_META, REGION_ORDER } = require('../commands/drawprices');
const { pullCount, remainingToFinish, remainingToPull } = require('../utils/drawCost');
const { buildGlobalNavRow } = require('../utils/globalNav');

let failed = 0;
let passed = 0;
function t(name, fn) {
    try { fn(); passed++; console.log(`  PASS  ${name}`); }
    catch (err) { failed++; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}

const LIMIT = 40;
const ACCENT = 2067038;
// The same recursive count Discord applies: every component object, plus anything nested in `components` or `accessory`.
const countComponents = node => Array.isArray(node)
    ? node.reduce((n, x) => n + countComponents(x), 0)
    : (node && typeof node === 'object')
        ? 1 + countComponents(node.components || []) + (node.accessory ? countComponents(node.accessory) : 0)
        : 0;

// The share button is one action row carrying one button; the nav row is real. Counting the whole message rather than the container alone is the point -- the container passing on its own would not stop a send failure.
const SHARE_ROW = { type: 1, components: [{ type: 2, style: 2, label: 'Show Everyone', custom_id: 'share_public' }] };
const messageCount = panel => countComponents([panel, buildGlobalNavRow('nav_prices'), SHARE_ROW]);

const texts = panel => panel.components.filter(c => c.type === 10).map(c => c.content);
const allText = panel => texts(panel).join('\n');
const rows = panel => panel.components.filter(c => c.type === 1);
const selects = panel => rows(panel).flatMap(r => r.components).filter(c => c.type === 3);
const buttons = panel => rows(panel).flatMap(r => r.components).filter(c => c.type === 2);
const selectFor = (panel, verb) => selects(panel).find(s => s.custom_id.split('~')[1] === verb);

console.log('\n/draw calculator -- one panel: budget, degradation, and what the panel actually says\n');

// ==========================================
// COMPONENT BUDGET
// ==========================================
// Worst case: a mythic draw (upgrade toggle renders), a live 2X event (the entitlement note AND its select render), a shortfall large enough that the purchase block renders both cheapest and least-waste, and a client present so the mention footer resolves.
t('worst case stays under the 40-component cap, counting nav + share', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'mythicWeapon', includeUpgrades: true, entitlementMask: 0b111111 });
    const panel = buildCalculatorPanel(state, ACCENT, {
        liveDoubleCPEntry: { isDoubleCP: true, endDate: new Date(Date.now() + 86400000) },
        currency: 'CAD',
        client: { commandIds: new Map() }
    });
    const n = messageCount(panel);
    console.log(`        worst case: ${n}/${LIMIT} components`);
    assert.ok(n <= LIMIT, `rendered ${n} components, over the ${LIMIT} cap`);
});

t('every draw x region x goal combination stays under the cap', () => {
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
                const state = clampStateToDraw({ ...defaultState(), drawKey, region, includeUpgrades: true, entitlementMask: 0b111111, ...goal });
                const panel = buildCalculatorPanel(state, ACCENT, {
                    liveDoubleCPEntry: { isDoubleCP: true, endDate: new Date(Date.now() + 86400000) },
                    currency: 'CAD', client: { commandIds: new Map() }
                });
                const n = messageCount(panel);
                if (n > worst) { worst = n; worstLabel = `${drawKey}/${region}/${goal.target}`; }
                assert.ok(n <= LIMIT, `${drawKey} at ${region} (${goal.target}) rendered ${n} components`);
            }
        }
    }
    console.log(`        worst across the whole matrix: ${worst}/${LIMIT} (${worstLabel})`);
});

t('no action row ever exceeds Discord\'s five components', () => {
    for (const drawKey of Object.keys(DRAW_META)) {
        for (const region of REGION_ORDER) {
            const state = clampStateToDraw({ ...defaultState(), drawKey, region, includeUpgrades: true, entitlementMask: 0b111111 });
            const panel = buildCalculatorPanel(state, ACCENT, { liveDoubleCPEntry: { isDoubleCP: true } });
            for (const row of rows(panel)) {
                assert.ok(row.components.length <= 5, `${drawKey} at ${region} rendered a row of ${row.components.length}`);
            }
        }
    }
});

t('every custom_id the panel emits fits Discord\'s 100-character cap', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'mythicWeapon', pullsDone: 9, target: 'P', targetValue: 10, balance: 999999, entitlementMask: 0b111111, includeUpgrades: true });
    const panel = buildCalculatorPanel(state, ACCENT, { liveDoubleCPEntry: { isDoubleCP: true } });
    for (const c of [...selects(panel), ...buttons(panel)]) {
        assert.ok(c.custom_id.length <= 100, `custom_id ${c.custom_id} is ${c.custom_id.length} chars`);
    }
});

// ==========================================
// ABSENT DATA -- the "null" regression
// ==========================================
// doubleEpicCharacters exists only at region_10. Before the rebuild the setup panel never checked: the guide read "is a **null-pull** draw", the goal dropdown read "Complete all null pulls", the draw dropdown read "null pulls", and handlers/drawCalc.js compared `pullsDone > null`, which is true for every positive number -- so the modal rejected every entry with a message that itself said "from 0 to null".
t('a draw with no data at the selected region never renders the word null', () => {
    for (const region of ['region_20', 'region_30']) {
        const state = clampStateToDraw({ ...defaultState(), drawKey: 'doubleEpicCharacters', region });
        const panel = buildCalculatorPanel(state, ACCENT, {});
        const rendered = JSON.stringify(panel);
        // The message is built lazily: assert.ok evaluates its second argument eagerly, so a .match(...)[0] here throws on the PASSING case and reports as a failure with the wrong reason.
        const hit = rendered.match(/.{0,60}null.{0,60}/i);
        assert.ok(!hit, `${region} rendered a literal null: ${hit && hit[0]}`);
    }
});

t('the no-data panel names the regions that DO have the draw, and offers them', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'doubleEpicCharacters', region: 'region_20' });
    const panel = buildCalculatorPanel(state, ACCENT, {});
    const body = allText(panel);
    for (const r of regionsWithData('doubleEpicCharacters')) {
        assert.ok(body.includes(`${r.split('_')[1]} CP`), `no-data panel never mentions ${r}`);
    }
    const regionButtons = buttons(panel).filter(b => b.custom_id.split('~')[1] === 'region');
    assert.strictEqual(regionButtons.length, REGION_ORDER.length, 'the way out of a no-data region is the region row -- it must always render');
});

t('the no-data panel renders no pull or goal select, because there is no count to enumerate', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'doubleEpicCharacters', region: 'region_20' });
    const panel = buildCalculatorPanel(state, ACCENT, {});
    assert.strictEqual(selectFor(panel, 'pulls'), undefined, 'a pulls select rendered with no pull count behind it');
    assert.strictEqual(selectFor(panel, 'goal'), undefined, 'a goal select rendered with no pull count behind it');
    assert.ok(selectFor(panel, 'draw'), 'the draw select must stay -- it is how you leave this draw');
});

t('the draw select flags an unpriced draw in its own description rather than offering it as priced', () => {
    const state = clampStateToDraw({ ...defaultState(), region: 'region_20' });
    const option = selectFor(buildCalculatorPanel(state, ACCENT, {}), 'draw').options.find(o => o.value === 'doubleEpicCharacters');
    assert.ok(/no data/i.test(option.description), `expected a no-data description, got "${option.description}"`);
});

// ==========================================
// WHAT THE PANEL SAYS
// ==========================================
t('the ladder stops at the chosen target pull, not at the end of the draw', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'mythicWeapon', pullsDone: 2, target: 'P', targetValue: 5 });
    const panel = buildCalculatorPanel(state, ACCENT, {});
    // The ladder is the first plain (non `-#`) line after the "Stops you at"/"Finishes all" line -- anchoring on POSITION rather than on a running-cumulative label that no longer exists (that line was cut 2026-08-26 12:23 EDT, prose-density pass; the ladder itself is the structural invariant, not any particular label around it).
    const block = texts(panel).find(c => c.includes('still needed')).split('\n');
    const goalLineIndex = block.findIndex(l => l.startsWith('Stops you at') || l.startsWith('Finishes all'));
    const ladder = block[goalLineIndex + 1].split('/').map(x => x.trim());
    assert.strictEqual(ladder.length, 3, `stop-at-pull-5 from pull 2 should list 3 pulls, listed ${ladder.length}: ${block[goalLineIndex + 1]}`);
    assert.ok(ladder.every(x => x.startsWith('**')), 'every remaining pull should render bold in a goal-mode ladder');
});

t('the headline figure is the balance-netted shortfall, and shortfallFor agrees with it', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'mythicWeapon', pullsDone: 3, balance: 4000 });
    const total = pullCount(state.region, state.drawKey);
    const expected = shortfallFor(state, total, null);
    const panel = buildCalculatorPanel(state, ACCENT, {});
    const headline = texts(panel).find(c => c.includes('still needed'));
    assert.ok(headline.includes(expected.toLocaleString('en-US')), `headline "${headline.split('\n')[0]}" does not carry the netted shortfall ${expected}`);
    // The equation line beneath it must resolve to the SAME number -- the pair contradicting each other is the defect this pins.
    const equation = headline.split('\n').find(l => l.includes('balance ='));
    assert.ok(equation && equation.includes(expected.toLocaleString('en-US')), 'the equation line disagrees with the headline it sits under');
});

t('a balance that covers the goal recommends buying nothing, with no purchase block at all', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'mythicWeapon', pullsDone: 0, balance: 999999 });
    const panel = buildCalculatorPanel(state, ACCENT, { currency: 'USD' });
    const body = allText(panel);
    assert.ok(/buy nothing/i.test(body), 'a covered balance must say so');
    assert.ok(!/Cheapest/.test(body), 'no purchase recommendation should render when nothing needs buying');
});

t('budget mode bolds exactly the pulls the budget covers', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'mythicWeapon', pullsDone: 0, target: 'B', targetValue: 5000 });
    const { reachableWithBudget } = require('../utils/drawCost');
    const reachable = reachableWithBudget(state.region, state.drawKey, 0, 5000).pullsReachable;
    const line = texts(buildCalculatorPanel(state, ACCENT, {})).find(c => c.includes('**Pulls from here:**'));
    const entries = line.split('**Pulls from here:**')[1].split('/').map(s => s.trim());
    const bolded = entries.filter(e => e.startsWith('**')).length;
    assert.strictEqual(bolded, reachable, `budget reaches ${reachable} pulls but ${bolded} are bolded`);
});

t('the goal select enumerates this draw\'s real pull count -- seven, not ten', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'sevenSpinLegendaryWeapon' });
    const total = pullCount(state.region, state.drawKey);
    assert.strictEqual(total, 7, 'fixture assumption: sevenSpinLegendaryWeapon is a seven-pull draw');
    const panel = buildCalculatorPanel(state, ACCENT, {});
    // Finish + one per pull + budget.
    assert.strictEqual(selectFor(panel, 'goal').options.length, total + 2, 'goal select does not match the draw\'s pull count');
    // 0..total inclusive.
    assert.strictEqual(selectFor(panel, 'pulls').options.length, total + 1, 'pulls select does not match the draw\'s pull count');
    assert.ok(!selectFor(panel, 'goal').options.some(o => o.label === 'Stop at pull 8'), 'a seven-pull draw offered an eighth pull');
});

t('every goal and pulls option value round-trips through the state codec', () => {
    const state = clampStateToDraw({ ...defaultState(), drawKey: 'mythicWeapon' });
    const panel = buildCalculatorPanel(state, ACCENT, {});
    for (const option of selectFor(panel, 'goal').options) {
        const next = option.value.startsWith('P')
            ? { ...state, target: 'P', targetValue: Number(option.value.slice(1)) }
            : { ...state, target: option.value };
        const decoded = decodeState(encodeState('goal', next));
        assert.strictEqual(decoded.target, next.target, `goal value ${option.value} did not survive the codec`);
        if (next.target === 'P') assert.strictEqual(decoded.targetValue, next.targetValue, `goal value ${option.value} lost its pull number`);
    }
    for (const option of selectFor(panel, 'pulls').options) {
        const decoded = decodeState(encodeState('pulls', { ...state, pullsDone: Number(option.value) }));
        assert.strictEqual(decoded.pullsDone, Number(option.value), `pulls value ${option.value} did not survive the codec`);
    }
});

t('switching to a shorter draw cannot leave an impossible pulls-done or target behind', () => {
    const stale = { ...defaultState(), drawKey: 'sevenSpinLegendaryWeapon', pullsDone: 10, target: 'P', targetValue: 10 };
    const clamped = clampStateToDraw(stale);
    assert.strictEqual(clamped.pullsDone, 7, 'pullsDone was not clamped to the shorter draw');
    assert.strictEqual(clamped.target, 'F', 'an out-of-range target pull should fall back to finishing the draw');
    // And the clamped state must render -- an unclamped one is what would produce a negative remainder.
    const panel = buildCalculatorPanel(clamped, ACCENT, {});
    assert.ok(!/-\d/.test(allText(panel).replace(/<t:-?\d+/g, '')), 'a negative figure reached the rendered panel');
});

t('the progress bar has exactly one cell per pull', () => {
    assert.strictEqual([...progressBar(3, 10)].length, 10);
    assert.strictEqual([...progressBar(0, 7)].length, 7);
    assert.strictEqual([...progressBar(10, 10)].length, 10);
    // Over-long input is clamped rather than growing the bar.
    assert.strictEqual([...progressBar(99, 7)].length, 7);
});

t('cheapest and least-waste CAN genuinely differ (so the panel branch that renders both is real, not dead code)', () => {
    // 11000 is one of the shortfalls scripts/cpPackages.test.js's own "least-waste never overshoots more than cheapest" check is pinned against -- reusing a known-differing value here rather than assuming the worst-case draw scenario produces one (it happens not to).
    const { optimizePurchase } = require('../utils/cpPackages');
    const result = optimizePurchase(11000, { currency: 'USD' });
    const differ = result.leastWaste.totalCents !== result.cheapest.totalCents || result.leastWaste.leftoverCp !== result.cheapest.leftoverCp;
    assert.ok(differ, 'expected 11000 to produce different cheapest/least-waste combos -- if this now fails, the "render both when they differ" branch may be silently dead');
});

t('entryFor and regionsWithData agree with DRAW_DATA itself', () => {
    for (const drawKey of Object.keys(DRAW_META)) {
        const expected = REGION_ORDER.filter(r => entryFor(r, drawKey));
        assert.deepStrictEqual(regionsWithData(drawKey), expected);
    }
    assert.deepStrictEqual(regionsWithData('doubleEpicCharacters'), ['region_10'], 'fixture assumption: doubleEpicCharacters is priced at region_10 only');
});

t('the full-draw figure quoted in the draw select matches what the panel then computes', () => {
    const state = clampStateToDraw(defaultState());
    const select = selectFor(buildCalculatorPanel(state, ACCENT, {}), 'draw');
    for (const option of select.options) {
        const total = pullCount(state.region, option.value);
        if (total === null) continue;
        const full = remainingToFinish(state.region, option.value, 0).toLocaleString('en-US');
        assert.ok(option.description.includes(full), `${option.value}'s description quotes a different full cost than remainingToFinish`);
    }
});

t('each goal option quotes the same figure the panel shows once that goal is picked', () => {
    const base = clampStateToDraw({ ...defaultState(), drawKey: 'mythicWeapon', pullsDone: 2 });
    const select = selectFor(buildCalculatorPanel(base, ACCENT, {}), 'goal');
    for (const option of select.options) {
        if (!option.value.startsWith('P')) continue;
        const p = Number(option.value.slice(1));
        if (p <= base.pullsDone) continue;
        const need = remainingToPull(base.region, base.drawKey, base.pullsDone, p).toLocaleString('en-US');
        assert.ok(option.description.includes(need), `"Stop at pull ${p}" quotes "${option.description}" but the panel computes ${need}`);
        const picked = buildCalculatorPanel({ ...base, target: 'P', targetValue: p }, ACCENT, {});
        assert.ok(allText(picked).includes(need), `picking pull ${p} shows a different figure than its own option promised`);
    }
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
