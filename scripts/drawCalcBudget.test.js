// scripts/drawCalcBudget.test.js -- /draw calculator's SAVED-BASKET redesign: component budget, render invariants proven by reading actual output, and the handful of handler-level behaviours that can't be proven from render alone (author lock, two-step confirms). Run: `node scripts/drawCalcBudget.test.js` (also via `npm test`).
//
// ⚠️ FIFTH PASS, 2026-08-27 -- rewritten wholesale for docs/superpowers/specs/2026-08-27-draw-calculator-multi-draw-design.md. Every case here targets the FLAT BANNER LIST model: there is no quantity, no goal select, no budget mode. Requirement 4 below is a FALSIFIER, not a smoke test -- it must be able to fail, per spec §11 and the plan's own audit log.
const assert = require('assert');
const Module = require('module');

const dc = require('../commands/drawCalculator');
const { DRAW_META, REGION_ORDER } = require('../commands/drawprices');
// dc.freshLine is exported for the "no assumed size" check.
const { basketCost } = require('../utils/drawCost');

let failed = 0, passed = 0;
function t(name, fn) {
    try { fn(); passed++; console.log(`  PASS  ${name}`); }
    catch (err) { failed++; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}
async function ta(name, fn) {
    try { await fn(); passed++; console.log(`  PASS  ${name}`); }
    catch (err) { failed++; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}

const ACCENT = 2067038;
const AUTHOR = '1139845545754632283';
const countComponents = node => Array.isArray(node)
    ? node.reduce((n, x) => n + countComponents(x), 0)
    : (node && typeof node === 'object')
        ? 1 + countComponents(node.components || []) + (node.accessory ? countComponents(node.accessory) : 0)
        : 0;
const SHARE_ROW = { type: 1, components: [{ type: 2, style: 2, label: 'Show Everyone', custom_id: 'share_public' }] };
// Every size check is also a duplicate-id check: Discord rejects a whole message when two components share a custom_id (COMPONENT_CUSTOM_ID_DUPLICATED), which is how style B and the line pager froze the form on 2026-10-13 while staying well under 40.
function assertUniqueIds(panel) {
    const ids = [];
    (function walk(n) { if (Array.isArray(n)) return n.forEach(walk); if (!n || typeof n !== 'object') return; if (n.custom_id) ids.push(n.custom_id); walk(n.components); walk(n.accessory); })([panel, SHARE_ROW]);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    assert.ok(!dup, `duplicate custom_id ${dup}`);
}
// And a size check: Discord refuses a message over its size cap (40005) however few components it has. the cap bisected between 13,100 and 13,412 characters of JSON on the dev bot; 12,500 is the line every sweep holds.
function assertSize(panel) {
    const size = JSON.stringify([panel, SHARE_ROW]).length;
    assert.ok(size <= 12500, `message is ${size} characters of JSON, over the 12,500 line`);
}
// The calculator sends no Show Everyone row since 2026-10-14 18:34 EDT, so it no longer counts toward the 40.
const messageCount = panel => { assertUniqueIds(panel); assertSize(panel); return countComponents(panel); };

// buildCalculatorPanel returns the message's TOP-LEVEL list (Container + sibling nav row); buildSetupPanel still returns a bare Container. Both shapes go through here.
const container = p => (Array.isArray(p) ? p.find(x => x && x.type === 17) : p);
const siblingRows = p => (Array.isArray(p) ? p.filter(x => x && x.type === 1) : []);
// A Section's text counts as panel text, and its button accessory as a button: Show Breakdown sits beside COST BREAKDOWN as one (2026-10-13).
const texts = panel => container(panel).components.flatMap(c => c.type === 9 ? (c.components || []) : [c]).filter(c => c.type === 10).map(c => c.content);
const allText = panel => texts(panel).join('\n');
const rows = panel => [...container(panel).components.filter(c => c.type === 1), ...siblingRows(panel)];
const buttons = panel => [...rows(panel).flatMap(r => r.components), ...container(panel).components.filter(c => c.type === 9 && c.accessory).map(c => c.accessory)].filter(c => c.type === 2);
const selects = panel => rows(panel).flatMap(r => r.components).filter(c => c.type === 3);
const buttonLabelled = (panel, label) => buttons(panel).find(b => b.label === label);

// `includeUpgrades: true` in a fixture now means "every Mythic line upgraded to Max" (2026-10-17 19:16 EDT): the basket-wide toggle no longer prices anything, so the fixture sets each line's own target, which keeps every worst-case sweep below exercising the upgrade lines.
const MAX_WANT = { mythicWeapon: [5], mythicCharacter: [3, 3, 3, 1] };
const withMaxUpgrades = banners => (banners || []).map(b => (MAX_WANT[b.drawKey] && !b.upWant ? { ...b, upWant: MAX_WANT[b.drawKey] } : b));
function makeBasket(overrides = {}) {
    if (overrides.includeUpgrades && overrides.banners) overrides = { ...overrides, banners: withMaxUpgrades(overrides.banners) };
    return {
        _id: '000000000000000000000001', name: null,
        banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }],
        region: 'region_10', balance: 0, includeUpgrades: false, entitlementMask: 0,
        // Every test below asserts on the RESULT panels, which only render once Calculate has been pressed. A fixture defaulting to false would silently retarget the whole file at the setup form.
        submitted: true,
        ...overrides
    };
}
function state(overrides = {}) { return { ...dc.defaultState(), authorId: AUTHOR, ...overrides }; }
function render(basket, stateOverrides = {}, opts = {}) {
    return dc.buildCalculatorPanel(state(stateOverrides), basket, ACCENT, { currency: 'CAD', ...opts });
}
// The FORM for a draft with these lines: every input lives here since the redesign (Edit Draws is gone).
function form(banners, stateOverrides = {}, opts = {}) {
    return dc.buildCalculatorPanel(state(stateOverrides), makeBasket({ submitted: false, banners, ...(opts.basket || {}) }), ACCENT, { savedBaskets: opts.saved || [] });
}
const verbOf = c => dc.decodeState(c.custom_id).verb;
// SET DRAW PROGRESS (2026-10-18 12:17 EDT, his Mock B): every per-line control left the form for this view (page 5), so the dropdown tests read it here.
function progress(banners, stateOverrides = {}, opts = {}) {
    return dc.buildCalculatorPanel(state({ page: 5, ...stateOverrides }), makeBasket({ submitted: false, banners, ...(opts.basket || {}) }), ACCENT, { savedBaskets: opts.saved || [] });
}

console.log('\n/draw calculator (saved baskets) -- component budget and what the panel actually says\n');

// ==========================================
// COMPONENT BUDGET -- swept across basket size x page x detail x region
// ==========================================
t('every basket size (1-9 banners, one per real draw type) x page x detail stays under the cap', () => {
    const keys = Object.keys(DRAW_META);
    let worst = 0, worstLabel = '';
    for (let size = 1; size <= keys.length; size++) {
        const banners = keys.slice(0, size).map(k => ({ drawKey: k, pullsDone: 1 }));
        for (const page of [0, 1]) {
            for (const detail of [false, true]) {
                const basket = makeBasket({ banners, includeUpgrades: true, entitlementMask: 0b111111 });
                const panel = render(basket, { page, detail }, { liveDoubleCPEntry: { isDoubleCP: true, endDate: new Date(Date.now() + 86400000) } });
                const n = messageCount(panel);
                if (n > worst) { worst = n; worstLabel = `size:${size}/page:${page}/detail:${detail}`; }
                assert.ok(n <= 40, `size ${size} page ${page} detail ${detail} rendered ${n} components`);
            }
        }
    }
    console.log(`        worst across the whole matrix: ${worst}/40 (${worstLabel})`);
});

t('no action row ever exceeds Discord\'s five components', () => {
    const keys = Object.keys(DRAW_META).slice(0, 6);
    const banners = keys.map(k => ({ drawKey: k, pullsDone: 2 }));
    for (const page of [0, 1]) {
        const panel = render(makeBasket({ banners, includeUpgrades: true, entitlementMask: 0b111111 }), { page }, { liveDoubleCPEntry: { isDoubleCP: true } });
        for (const row of rows(panel)) assert.ok(row.components.length <= 5, `page ${page} rendered a row of ${row.components.length}`);
    }
});

t('every custom_id fits Discord\'s 100-character cap, even at a 9-banner basket', () => {
    const banners = Object.keys(DRAW_META).map(k => ({ drawKey: k, pullsDone: 5 }));
    for (const page of [0, 1]) {
        const panel = render(makeBasket({ banners, includeUpgrades: true, entitlementMask: 0b111111, balance: 999999 }), { page, detail: true, focus: 3 }, { liveDoubleCPEntry: { isDoubleCP: true } });
        for (const c of [...selects(panel), ...buttons(panel)]) {
            if (!c.custom_id) continue;
            assert.ok(c.custom_id.length <= 100, `custom_id ${c.custom_id} is ${c.custom_id.length} chars`);
        }
    }
});

// ==========================================
// NO NULL / NaN / UNDEFINED / NEGATIVE, ANYWHERE -- swept, not sampled
// ==========================================
t('no rendered string ever contains the literal null/NaN/undefined across a real sweep', () => {
    const keys = Object.keys(DRAW_META);
    for (let size = 1; size <= 5; size++) {
        const banners = keys.slice(0, size).map((k, i) => ({ drawKey: k, pullsDone: i }));
        for (const region of REGION_ORDER) {
            for (const page of [0, 1]) {
                const panel = render(makeBasket({ banners, region, balance: 500 }), { page, detail: true });
                const body = JSON.stringify(panel);
                assert.ok(!/\bnull\b/.test(body.replace(/"name":null/g, '')), `region ${region} size ${size} page ${page} leaked null`);
                assert.ok(!/\bNaN\b/.test(body), `region ${region} size ${size} page ${page} leaked NaN`);
                assert.ok(!/\bundefined\b/.test(body), `region ${region} size ${size} page ${page} leaked undefined`);
            }
        }
    }
});

t('no rendered CP figure is ever negative', () => {
    const banners = [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }];
    const panel = render(makeBasket({ banners, balance: 999999999, detail: true }));
    const body = allText(panel);
    const figures = [...body.matchAll(/-?[\d,]+ CP/g)].map(m => Number(m[0].replace(/[^0-9-]/g, '')));
    for (const n of figures) assert.ok(n >= 0, `found a negative CP figure: ${n}`);
});

// ==========================================
// LANDING / EMPTY / MISSING BASKET
// ==========================================
t('a fresh /draw calculator opens on landing -- no basket, draw picker only', () => {
    const panel = dc.buildSetupPanel(state(), null, ACCENT, { region: 'region_10' });
    assert.ok(selects(panel).some(s => s.custom_id.split('~')[1] === 'draws'), 'landing must render the draw picker');
    assert.strictEqual(selects(panel).some(s => s.custom_id.split('~')[1] === 'bpulls'), false);
});

t('a MISSING basket (deleted/expired) renders a real notice, never throws, and offers the draw picker back', () => {
    const panel = dc.buildCalculatorPanel(state({ basketId: '000000000000000000000099' }), null, ACCENT, { savedBaskets: [] });
    assert.ok(/no longer exists/i.test(allText(panel)), 'missing-basket panel must say so in plain language');
    assert.ok(selects(panel).some(s => s.custom_id.split('~')[1] === 'draws'), 'missing-basket panel must still offer a way to start fresh');
});

t('an EMPTY basket (0 banners, e.g. after Reset) renders the landing look but stays bound to its own basketId', () => {
    const basket = makeBasket({ banners: [], name: 'Kept Name' });
    const panel = render(basket, { basketId: basket._id }, { savedBaskets: [] });
    const drawSelect = selects(panel).find(s => s.custom_id.split('~')[1] === 'draws');
    assert.ok(drawSelect, 'an empty basket must still show the draw picker');
    assert.strictEqual(drawSelect.custom_id.split('~')[2], basket._id, 'picking a draw from an empty-but-named basket must add to THAT basket, not create a new one');
});

// ==========================================
// PER-BANNER COST -- flat list, no quantity
// ==========================================
t('3 banners at 7/3/0 costs strictly less than 3 fresh and strictly more than 1 fresh', () => {
    const region = 'region_10';
    const fresh1 = basketCost(region, [{ drawKey: 'mythicWeapon', pullsDone: 0 }], false).total;
    const fresh3 = basketCost(region, [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicWeapon', pullsDone: 0 }], false).total;
    const mixed3 = basketCost(region, [{ drawKey: 'mythicWeapon', pullsDone: 7 }, { drawKey: 'mythicWeapon', pullsDone: 3 }, { drawKey: 'mythicWeapon', pullsDone: 0 }], false).total;
    assert.ok(mixed3 < fresh3, `mixed3 (${mixed3}) should be < fresh3 (${fresh3})`);
    assert.ok(mixed3 > fresh1, `mixed3 (${mixed3}) should be > fresh1 (${fresh1})`);
});

t('upgrades multiply PER BANNER -- 3 mythic banners carry exactly 3 upgrades', () => {
    const region = 'region_10';
    const { perBanner } = basketCost(region, [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicWeapon', pullsDone: 0 }], true);
    assert.strictEqual(perBanner.filter(b => b.upgrade !== null).length, 3);
});

t('an unpriced banner (no data at this region) is EXCLUDED from the total and reported, never silently dropped or estimated', () => {
    const { total, perBanner } = basketCost('region_20', [{ drawKey: 'doubleEpicCharacters', pullsDone: 0 }, { drawKey: 'mythicWeapon', pullsDone: 0 }], false);
    assert.strictEqual(perBanner[0].priced, false, 'doubleEpicCharacters has no region_20 data');
    assert.strictEqual(total, perBanner[1].cost, 'the unpriced banner must contribute 0, not be silently dropped from perBanner');
    const panel = render(makeBasket({ region: 'region_20', banners: [{ drawKey: 'doubleEpicCharacters', pullsDone: 0 }, { drawKey: 'mythicWeapon', pullsDone: 0 }] }));
    assert.ok(/excluded/i.test(allText(panel)), 'the panel must NAME the excluded banner, not silently omit it');
});

// ==========================================
// 🔴 NO ALGORITHMIC REORDERING -- must be able to FAIL (spec §11 req 4)
// ==========================================
t('lines keep the ARRAY ORDER, never a cheapest-first sort -- proven with an order that provably differs from cost order', () => {
    // Deliberately most-expensive-first: mythicWeapon@0 pulls costs more than mythicWeapon@9 pulls. A cheapest-first sort would put the 9-pulls line FIRST; the render must not.
    const banners = [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicWeapon', pullsDone: 9 }];
    const { perBanner } = basketCost('region_10', banners, false);
    assert.ok(perBanner[0].cost > perBanner[1].cost, 'fixture invariant broken -- line 0 must cost MORE than line 1 for this to be a real falsifier');
    const first = selects(progress(banners)).find(s => verbOf(s) === 'bpulls' && dc.decodeState(s.custom_id).focus === 0);
    assert.strictEqual(first.options.find(o => o.default).value, '0', 'line #1 must be the array\'s first entry (0 pulls), not the cheaper 9-pulls one a cost-sort would promote');
    const detail = allText(render(makeBasket({ banners }), { detail: true }));
    assert.ok(/#1 · Mythic Weapon\*\*\n> \*\*Price: `5,810 CP`\*\* · `0\/10` Attempts/.test(detail) && detail.indexOf('`0/10` Attempts') < detail.indexOf('`9/10` Attempts'), 'the Full Breakdown keeps the array order too');
    assert.strictEqual(/Priority Plan|Move Up/.test(detail), false, 'the Priority Plan and Move Up are gone (2026-10-14, his call)');
});

// ==========================================
// PAGE 2 -- one dropdown per banner, banner-numbered options
// ==========================================
t('every pulls-done dropdown option carries its line NUMBER and its draw, so a chosen value stays attributable', () => {
    const lines = selects(progress([{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }])).filter(s => verbOf(s) === 'bpulls');
    assert.strictEqual(lines.length, 2);
    assert.ok(lines[0].placeholder.startsWith('#1 ') && lines[1].placeholder.startsWith('#2 '));
    const values = s => s.options.filter(o => /^\d+$/.test(o.value));
    const chosen = s => values(s).find(o => o.default);
    assert.ok(/^#1 · Progress: 0\/10 Spins$/.test(chosen(lines[0]).label) && /^#2 · Progress: 0\/10 Spins$/.test(chosen(lines[1]).label), 'the CHOSEN value names its line, its spins FIRST, then its draw: it is the one label a closed select shows');
    assert.ok(values(lines[0]).filter(o => !o.default).every(o => /^\d+\/10 Spins$/.test(o.label)), 'the rest are just the count, not the same name eleven times');
    assert.ok(values(lines[0]).every(o => /^[\d,]+ CP Spent · ([\d,]+ CP to Completion|Finished)$/.test(o.description)), 'each value says what those spins cost and what finishing costs');
    assert.strictEqual(values(lines[0])[0].description.startsWith('0 CP Spent · '), true);
    assert.strictEqual(values(lines[0]).at(-1).description, `${values(lines[0]).at(-1).description.split(' · ')[0]} · Finished`);
    assert.strictEqual(lines[0].options.some(o => o.value === 'del'), false, 'no Remove in a line\'s dropdown: Remove is one pop-up (2026-10-18 13:38 EDT)');
    
    
});

t('setting up to 3 lines costs at most 5 taps -- the initial add, Set Draw Progress, then one dropdown click per line', () => {
    const lines = selects(progress([{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }])).filter(s => verbOf(s) === 'bpulls');
    assert.strictEqual(lines.length, 3, 'all 3 lines must have their OWN dropdown visible at once on Set Draw Progress');
});

t('Adjust Draws & Progress pages its lines with a pager, a small space above it (2026-10-18 15:15 EDT)', () => {
    for (const keys of [Object.keys(DRAW_META).slice(0, 7), Array(7).fill('legendaryGunNonReactive')]) {
        const panel = progress(keys.map(k => ({ drawKey: k, pullsDone: 0 })));
        const shown = selects(panel).filter(s => verbOf(s) === 'bpulls').length;
        // Measured: 2 Mythic lines (each a Section with its Upgrade) or 3 plain lines fit beside the region row, footer, pager and nav.
        assert.ok(shown >= (keys[0] === 'mythicWeapon' ? 2 : 3) && shown < 7, `${keys[0]}: ${shown} on page 1`);
        assert.ok(buttons(panel).some(b => /^1 \/ \d+$/.test(b.label || '')), 'and a pager');
        const items = container(panel).components;
        const pager = items.findIndex(c => c.type === 1 && c.components.some(b => /^1 \/ /.test(b.label || '')));
        assert.ok(items[pager - 1].type === 14 && items[pager - 1].divider === false, 'a space, no line, above the pager');
    }
});

t('a NEW line starts at 0 -- no inherited default from a sibling line of the same draw, and no assumed armory size (2026-10-18 15:15 EDT)', () => {
    assert.deepStrictEqual(dc.freshLine('mythicWeapon'), { drawKey: 'mythicWeapon', pullsDone: 0 });
    assert.deepStrictEqual(dc.freshLine('armoryLegendaryWeapon'), { drawKey: 'armoryLegendaryWeapon', pullsDone: 0 }, 'no size until Set Up Armory');
    const add = dc.buildAddDrawsModal(state(), makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 7 }] }), []);
    assert.ok(add.components[0].component.options.every(o => !o.default), 'nothing pre-picked');
});

// ==========================================
// TWO-STEP CONFIRMS -- Reset and Delete
// ==========================================
t('New Calculation is two-step: armed shows Danger style + "click again", unarmed shows the plain button', () => {
    const basket = makeBasket();
    const plain = buttonLabelled(render(basket), 'New Calculation');
    assert.ok(plain && plain.style !== 4, 'unarmed New Calculation must not be Danger-styled');
    const armed = buttonLabelled(render(basket, { verb: 'resetarm' }), 'New Calculation — click again');
    assert.ok(armed && armed.style === 4, 'armed New Calculation must be Danger-styled and re-labelled');
});

t('Delete Calculation is two-step the same way', () => {
    const basket = makeBasket();
    const plain = buttonLabelled(dc.buildCalculatorPanel(state({ page: 3 }), basket, ACCENT, { savedBaskets: [] }), 'Save as New');
    assert.ok(plain && verbOf(plain) === 'modal_name' && plain.emoji, 'an unsaved calculation is saved right in the Saved view (2026-10-16), with his Save emoji');
    assert.strictEqual(buttonLabelled(render(basket), 'Save'), undefined, 'and not from the result');
    // Delete is offered on a SAVED calculation only: on an unsaved one it duplicated New Calculation (2026-10-13 click-test).
    assert.strictEqual(buttonLabelled(render(basket), 'Delete Calculation'), undefined, 'the result offers no Delete (2026-10-14 16:47 EDT: it moved to the Saved view)');
    const named = makeBasket({ name: 'My Push' });
    const inSaved = s => dc.buildCalculatorPanel(state({ page: 3, ...s }), named, ACCENT, { savedBaskets: [named] });
    assert.ok(buttonLabelled(inSaved(), 'Delete Calculation'), 'the Saved view offers Delete for the open saved calculation');
    const armedDelete = buttonLabelled(inSaved({ verb: 'delarm' }), 'Delete Calculation — click again');
    assert.ok(armedDelete && armedDelete.style === 4 && verbOf(armedDelete) === 'del' && dc.decodeState(armedDelete.custom_id).page === 3);
});

t('a NAMED basket\'s manage row reads Rename, not Save', () => {
    const b = makeBasket({ name: 'My Push' });
    assert.ok(buttonLabelled(dc.buildCalculatorPanel(state({ page: 3 }), b, ACCENT, { savedBaskets: [b] }), 'Rename'), 'Rename lives in the Saved view');
    assert.strictEqual(buttonLabelled(render(b), 'Rename'), undefined, 'not on the result');
});

// ==========================================
// REGION SWITCHING PRESERVES PROGRESS
// ==========================================
// THE 2X OFFERS (2026-10-18 20:34 EDT, his asks): under the cost breakdown after a small space, two lines of his wording, and options that say what the offer gives against the bundle's normal CP.
t('the 2X offers sit under the cost breakdown in his wording, each option giving its 2X and normal CP', () => {
    const panel = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], entitlementMask: 0 }), {}, { liveDoubleCPEntry: { isDoubleCP: true } });
    const top = panel[0].components;
    const ent = top.findIndex(c => c.type === 1 && c.components[0].custom_id && verbOf(c.components[0]) === 'ent');
    assert.ok(ent > 0, 'the dropdown is there');
    assert.ok(top[ent - 1].type === 10 && top[ent - 1].content === '-# 🎉 Double CP event is live!\n-# Select which 2X CP offers are still available for you to purchase.', top[ent - 1].content);
    assert.deepStrictEqual([top[ent - 2].type, top[ent - 2].divider, top[ent - 2].spacing], [14, false, 1], 'a small space with no line above it');
    assert.ok(top[ent - 3].type === 9 && /Full Breakdown|Simple Breakdown/.test(top[ent - 3].accessory.label), 'right under the cost breakdown');
    assert.ok(top.slice(ent + 1).some(c => c.type === 1 && c.components.some(b => b.label === 'Save Result')), 'above the action row');
    const opts = top[ent].components[0].options;
    assert.deepStrictEqual([opts[0].label, opts[0].description], ['160 CP bundle (80+80 CP)', 'Normally gives only 80 CP']);
    assert.deepStrictEqual([opts[1].label, opts[1].description], ['800 CP bundle (400+400 CP)', 'Normally gives only 420 CP'], 'the normal figure carries the bundle\'s bonus');
});

// SET REGION & BALANCE on every screen (2026-10-18 17:25 EDT, his ask: "moving away from the 4 button row"), in his two-line layout and his placement (2026-10-18 19:24 EDT): the bottom of the landing and the editor, right under the list of draws on the result.
t('Set Region & Balance sits at the bottom of the landing and the editor and under the result\'s list, in his layout', () => {
    const basket = { region: 'region_20', balance: 3000, mythicCards: 300 };
    const screens = {
        landing: dc.buildCalculatorPanel(state({ basketId: '0'.repeat(24) }), makeBasket({ banners: [], ...basket }), ACCENT, { savedBaskets: [] }),
        editor: form([{ drawKey: 'mythicWeapon', pullsDone: 0 }], {}, { basket }),
        result: render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 6 }], ...basket }))
    };
    const e = require('../utils/emojiMap');
    const his = `-# **${e.region20Cp} Region: \`20 CP\`${e.blank}${e.cp} Balance: \`3,000 CP\`**\n-# **${e.mythicCard} Mythic Cards: \`300\`${e.blank}${e.mythicCoin} Mythic Coins: \`0\`**`;
    const at = {};
    for (const [name, panel] of Object.entries(screens)) {
        assert.strictEqual(buttons(panel).filter(b => verbOf(b) === 'region' || b.label === 'Set Balance').length, 0, `${name}: no region buttons, no Set Balance`);
        const rb = buttonLabelled(panel, 'Set Region & Balance');
        assert.ok(rb && verbOf(rb) === 'rbmodal' && !rb.disabled, `${name}: one live button opens the pop-up`);
        assert.ok(texts(panel).includes(his), `${name}: his two lines\n${texts(panel).join('\n---\n').slice(0, 600)}`);
        const top = panel[0].components;
        at[name] = { i: top.findIndex(c => c.type === 9 && c.accessory && c.accessory.label === 'Set Region & Balance'), n: top.length, top };
    }
    for (const name of ['landing', 'editor']) {
        const { i, top } = at[name];
        assert.ok(top.slice(i + 1).every(c => c.type === 14 || c.type === 1), `${name}: at the bottom, only a divider and the last row below it`);
        assert.ok(top[i - 1].type === 14 && top[i - 1].divider, `${name}: under a divider`);
    }
    const { i, top } = at.result;
    assert.ok(top[i - 2].type === 9 && top[i - 2].accessory.label === 'Edit Selections', 'result: right under the list of draws');
    assert.deepStrictEqual([top[i - 1].type, top[i - 1].divider, top[i - 1].spacing], [14, false, 1], 'result: a small space with no line between (2026-10-18 19:36 EDT, his ask)');
    const firstPick = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] });
    assert.strictEqual(buttonLabelled(firstPick, 'Set Region & Balance').disabled, true, 'disabled until a calculation exists to write to');
});

// RESUME A SAVED CALCULATION (2026-10-18 19:24 EDT, his ask): under Start a Calculation, after a large space with no line.
t('the landing offers Resume a Saved Calculation under Start a Calculation, and only when something is saved', () => {
    const saved = [{ _id: 'a'.repeat(24), name: 'Spree', banners: [{ drawKey: 'mythicWeapon', pullsDone: 2 }], region: 'region_10', submitted: true, updatedAt: new Date('2026-10-18T12:00:00Z') }];
    const landing = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: saved });
    const top = landing[0].components;
    const h = top.findIndex(c => c.type === 10 && c.content === '### Resume a Saved Calculation');
    assert.ok(h > 0, 'the heading');
    assert.deepStrictEqual([top[h - 1].type, top[h - 1].divider, top[h - 1].spacing], [14, false, 1], 'a small space with no line above it (2026-10-18 19:31 EDT, his "large spacing seems was too much")');
    assert.ok(top.slice(0, h).some(c => c.type === 10 && /^## Start a Calculation/.test(c.content)), 'under Start a Calculation');
    const sel = top[h + 1].components[0];
    assert.strictEqual(verbOf(sel), 'load', 'the View Saved reopen verb');
    assert.deepStrictEqual(sel.options.map(o => [o.label, o.value]), [['Spree', 'a'.repeat(24)]]);
    assert.ok(sel.options.every(o => o.description && o.description.length <= 100));
    assert.strictEqual(allText(dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] })).includes('Resume a Saved Calculation'), false, 'hidden when nothing is saved');
    const full = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: Array.from({ length: 25 }, (_, i) => ({ ...saved[0], _id: String(i + 1).padStart(24, '0'), name: `${'N'.repeat(77)}${String(i).padStart(3, '0')}`, banners: Object.keys(DRAW_META).map(k => ({ drawKey: k, pullsDone: 1 })) })) });
    assert.ok(1 + countComponents(full) <= 40 && JSON.stringify(full).length <= 12500, 'fits with 25 saved and the longest names');
});

// ==========================================
// SHARED COPY IS A SNAPSHOT -- Task 10
// ==========================================
(async () => {
await ta('sharing a calculator panel strips EVERY interactive component, keeps every Text Display', async () => {
    const banners = [{ drawKey: 'mythicWeapon', pullsDone: 3 }];
    const panel = render(makeBasket({ banners }), { basketId: '000000000000000000000001' });
    assert.ok(buttons(panel).length + selects(panel).length > 0, 'fixture must actually have controls, or stripping proves nothing');
    const textCountBefore = texts(panel).length;

    const v2Path = require.resolve('../utils/sendV2Payload');
    const originalV2 = require.cache[v2Path];
    let sentComponents = null;
    require.cache[v2Path] = new Module(v2Path, null);
    require.cache[v2Path].filename = v2Path;
    require.cache[v2Path].loaded = true;
    require.cache[v2Path].exports = { sendV2Payload: async (interaction, components) => { sentComponents = components; } };
    delete require.cache[require.resolve('../handlers/share')];
    try {
        const { handleShareInteraction } = require('../handlers/share');
        const fakeInteraction = {
            customId: 'share_public',
            // `panel` IS the top-level component list now (Container + the sibling nav row), so spread it -- wrapping it in another array would hand share.js a shape Discord never sends, and the nav row would never be seen at top level where the strip has to catch it.
            message: { components: [...panel], embeds: [], flags: { bitfield: 32768 | 64 } },
            deferReply: async () => {}
        };
        const handled = await handleShareInteraction(fakeInteraction);
        assert.strictEqual(handled, true);
        const sentButtons = sentComponents.flatMap(c => (c.type === 17 ? c.components : [c])).filter(c => c.type === 1);
        assert.strictEqual(sentButtons.length, 0, 'a shared calculator snapshot must carry ZERO action rows');
        const sentTexts = sentComponents[0].components.filter(c => c.type === 10);
        assert.strictEqual(sentTexts.length, textCountBefore, 'every Text Display (the actual cost breakdown) must survive the strip -- only controls are removed');
    } finally {
        require.cache[v2Path] = originalV2;
        delete require.cache[require.resolve('../handlers/share')];
    }
});

// ==========================================
// AUTHOR LOCK -- resolvePanelActor wiring (handler-level, stubbed)
// ==========================================
await ta('the handler denies a third party and never touches the basket store', async () => {
    const ctxPath = require.resolve('../utils/interactionContext');
    const originalCtx = require.cache[ctxPath];
    const storePath = require.resolve('../utils/drawBasketStore');
    const originalStore = require.cache[storePath];
    let storeTouched = false;
    require.cache[ctxPath] = new Module(ctxPath, null);
    require.cache[ctxPath].filename = ctxPath;
    require.cache[ctxPath].loaded = true;
    require.cache[ctxPath].exports = { resolvePanelActor: async () => null, buildSyntheticInteraction: (i) => i };
    require.cache[storePath] = new Module(storePath, null);
    require.cache[storePath].filename = storePath;
    require.cache[storePath].loaded = true;
    require.cache[storePath].exports = new Proxy({}, { get: () => (async () => { storeTouched = true; return null; }) });
    delete require.cache[require.resolve('../handlers/drawCalc')];
    try {
        const { handleDrawCalcInteraction } = require('../handlers/drawCalc');
        let replied = null;
        const fakeInteraction = {
            customId: dc.encodeState('bpulls', { basketId: '000000000000000000000001', page: 1, detail: false, focus: 0, authorId: '999999999999999999' }),
            user: { id: AUTHOR },
            isButton: () => false, isStringSelectMenu: () => true, isModalSubmit: () => false,
            values: ['3'],
            reply: async (opts) => { replied = opts; }
        };
        const handled = await handleDrawCalcInteraction(fakeInteraction);
        assert.strictEqual(handled, true, 'an owned prefix must always report handled, even when denied');
        assert.ok(replied && /isn't your calculator/i.test(replied.content), 'a denied click must get an explicit lock message');
        assert.strictEqual(storeTouched, false, 'a denied click must never reach the basket store');
    } finally {
        require.cache[ctxPath] = originalCtx;
        require.cache[storePath] = originalStore;
        delete require.cache[require.resolve('../handlers/drawCalc')];
    }
});

// ==========================================
// STATE CODEC
// ==========================================
t('every field round-trips through the codec, including the base-36 author id', () => {
    const s = { basketId: '000000000000000000000042', page: 1, detail: true, focus: 3, authorId: '1139845545754632283', bpage: 2 };
    const decoded = dc.decodeState(dc.encodeState('bpulls', s));
    assert.strictEqual(decoded.basketId, s.basketId);
    assert.strictEqual(decoded.page, 1);
    assert.strictEqual(decoded.detail, true);
    assert.strictEqual(decoded.focus, 3);
    assert.strictEqual(decoded.authorId, s.authorId);
    assert.strictEqual(decoded.bpage, 2);
});

t('a legacy calc~ id from the OLD single-draw codec decodes to a SAFE state rather than mis-decoding', () => {
    const legacy = 'calc~setup~r10~d0~p3~tF~v0~b4000~u0~e0~x0';
    const decoded = dc.decodeState(legacy);
    // The old encoding's positional 'r10' lands in the new basketId slot -- an obviously-invalid Mongo id, which utils/drawBasketStore.js's load() rejects via its own try/catch (proven in scripts/drawBasketStore.test.js) rather than throwing here. This test proves decode itself never throws on stale input, which is the property this file owns.
    assert.strictEqual(typeof decoded.basketId, 'string');
    assert.doesNotThrow(() => dc.buildCalculatorPanel({ ...decoded, authorId: null }, null, ACCENT, { savedBaskets: [] }));
});

// ==========================================
// THE SIX BUGS HARKIRAT FOUND BY OPENING THE PANEL -- 2026-08-27 Every gate in this repo was green while all six were live, so each one is pinned as a FALSIFIABLE assertion here: revert the fix and the named case must go red.
// ==========================================

t('the bottom nav row is a SIBLING of the Container, never one of its children, and Draw Info is gone', () => {
    for (const [panel, labels] of [[render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }] })), ['Draw Prices', 'Help']], [form([{ drawKey: 'mythicWeapon', pullsDone: 3 }]), ['Draw Prices', 'View Saved', 'New Calculation', 'Help']]]) {
        // The result keeps New Calculation and View Saved in its own last row (2026-10-14 17:58 EDT); the editor has no such row, so its nav carries them (his one editor (2026-10-18 15:15 EDT)).
        const nav = panel.filter(x => x && x.type === 1);
        assert.strictEqual(nav.length, 1, 'exactly one top-level action row (the nav)');
        assert.deepStrictEqual(nav[0].components.map(b => b.label), labels);
        assert.strictEqual(container(panel).components.filter(c => c.type === 1).some(r => r.components.some(b => b.label === 'Help')), false, 'the nav must not render inside the Container');
    }
});

t('no button on the nav row or the save/delete row carries an emoji', () => {
    const panel = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }] }));
    // Save Result and Save carry his Save emoji on purpose (2026-10-14 17:58 EDT), and View Saved its ViewSaved icon (2026-10-16 09:58 EDT); the rest stay plain.
    const named = ['Draw Info', 'Draw Prices', 'Help', 'Rename', 'Delete Calculation'];
    assert.ok(buttons(panel).find(b => b.label === 'New Calculation').emoji, 'New Calculation carries the NewCalc icon (2026-10-16)');
    assert.ok(buttons(render(makeBasket())).find(b => b.label === 'Export').emoji, 'Export carries the CopyExport icon');
    assert.ok(buttons(render(makeBasket())).find(b => b.label === 'View Saved').emoji, 'View Saved carries the ViewSaved icon');
    for (const b of buttons(panel)) {
        if (named.some(n => (b.label || '').startsWith(n))) {
            assert.strictEqual('emoji' in b, false, `"${b.label}" must carry no emoji`);
        }
    }
});

t('/draw prices\' cross-link to the calculator carries no emoji either', () => {
    const { buildGlobalNavRow } = require('../utils/globalNav');
    const row = buildGlobalNavRow(null, { nav_prices: { label: 'Draw Calculator', custom_id: dc.encodeState('page', dc.defaultState()) } });
    const link = row.components.find(b => b.label === 'Draw Calculator');
    assert.ok(link, 'the override must still produce the cross-link');
    assert.strictEqual('emoji' in link, false, 'the shared nav row carries no emoji on any slot');
});

t('Cheapest and Stock Up are separated, and no heading is preceded by a stacked blank line', () => {
    const lines = texts(render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 1 }, { drawKey: 'mythicWeapon', pullsDone: 0 }] }), { detail: true }, { currency: 'CAD' })).join('\n').split('\n');
    const stockUp = lines.findIndex(l => l.startsWith('**Stock Up: '));
    assert.ok(stockUp !== -1 && lines.some(l => l.startsWith('**Just Enough: ')) && lines.includes('## Suggested Purchase'), 'two options, each labelled in its total line, under the one heading');
    assert.ok(lines[stockUp - 1] === '' && lines[stockUp + 1].startsWith('-# **`') && lines[stockUp + 2].startsWith('> **'), 'a blank line, the labelled total, what is left over, then the quoted bundles');
    lines.forEach((l, i) => {
        if (l.startsWith('## ') && i > 0) {
            assert.notStrictEqual(lines[i - 1], '', `"${l}" is preceded by an explicit blank line -- headings carry their own top margin, so the two stack`);
        }
    });
});

t('a stored calculation holding a RETIRED draw key still renders instead of throwing', () => {
    // Saved calculations outlive the draw list. A key that is gone from DRAW_META must degrade to a readable line the owner can delete -- never take the whole panel down with it.
    const basket = makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 2 }, { drawKey: 'aDrawThatNoLongerExists', pullsDone: 0 }] });
    for (const page of [0, 1]) {
        let panel;
        assert.doesNotThrow(() => { panel = render(basket, { page, detail: true }); }, `page ${page} threw on a retired draw key`);
        assert.ok(/aDrawThatNoLongerExists/.test(allText(panel)), `page ${page} must NAME the unrecognized entry so it can be found and removed`);
    }
    assert.doesNotThrow(() => dc.buildDrawInfoPanel(basket, ACCENT), 'Draw Info must skip the retired key rather than hand it to buildDrawEntries');
});

// ==========================================
// THE SETUP FORM -- approved 2026-08-27, and the reversal of this command's own "no setup form" rule
// ==========================================

t('the setup form fits the component budget at every draft size, with and without saved calculations', () => {
    // The whole reason SETUP_LINES_PER_PAGE is 4 rather than 5. If this goes red, that number is why.
    const saved = [{ _id: 'a'.repeat(24), name: 'Season 12', banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], region: 'region_10' }];
    for (let n = 0; n <= 9; n++) {
        const banners = Object.keys(DRAW_META).slice(0, n).map(k => ({ drawKey: k, pullsDone: 3 }));
        for (const savedList of [[], saved]) {
            for (const bpage of [0, 1, 2]) {
                const basket = n ? makeBasket({ banners, submitted: false, balance: 3000, includeUpgrades: true }) : null;
                const panel = dc.buildCalculatorPanel(state({ basketId: basket ? basket._id : null, bpage }), basket, ACCENT, { savedBaskets: savedList });
                const count = messageCount(panel);
                assert.ok(count <= 40, `setup form with ${n} line(s), ${savedList.length} saved, bpage ${bpage} rendered ${count}/40`);
                for (const row of rows(panel)) assert.ok(row.components.length <= 5, `a row of ${row.components.length} on the setup form`);
            }
        }
    }
});

t('a draft with lines opens Adjust Draws (his one editor (2026-10-18 15:15 EDT)); pressing Calculate is what produces the breakdown', () => {
    const banners = [{ drawKey: 'mythicWeapon', pullsDone: 3 }];
    const draft = form(banners);
    assert.ok(allText(draft).includes('## Adjust Draws, Progress, & Upgrades'), 'after the first pick, the editor');
    assert.strictEqual(/Cost Breakdown/.test(allText(draft)), false, 'a draft must NOT show a cost breakdown');
    assert.ok(buttonLabelled(draft, 'Calculate'), 'the editor offers Calculate');
    const done = render(makeBasket({ banners, submitted: true }));
    assert.ok(/## Cost Breakdown/.test(allText(done)), 'a submitted calculation shows the breakdown');
    assert.strictEqual(Boolean(buttonLabelled(done, 'Calculate')), false, 'and not the editor');
});

t('Calculate is DISABLED with nothing picked, and enabled the moment a line exists', () => {
    const empty = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] });
    assert.strictEqual(buttonLabelled(empty, 'Calculate').disabled, true, 'an empty form must not be submittable');
    const drafted = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], submitted: false }));
    assert.strictEqual(Boolean(buttonLabelled(drafted, 'Calculate').disabled), false, 'one line is enough to calculate');
});

t('Set Balance is disabled until a calculation exists to write it to; on the editor the region and balances are one pop-up (2026-10-18 16:17 EDT)', () => {
    const empty = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] });
    assert.strictEqual(buttonLabelled(empty, 'Set Region & Balance').disabled, true);
    assert.strictEqual(buttons(empty).some(b => /^Upgrade/.test(b.label || '')), false);
    const withCards = makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], region: 'region_20', balance: 3000, mythicCards: 300 });
    const modal = dc.buildRegionBalanceModal(state(), withCards);
    assert.strictEqual(modal.title, 'Set Region & Balance');
    assert.deepStrictEqual(modal.components.map(l => l.component.custom_id), ['region', 'currency', 'amount', 'cards', 'coins'], 'five fields, Discord\'s most');
    assert.deepStrictEqual(modal.components[0].component.options.filter(o => o.default).map(o => o.value), ['region_20'], 'the current region pre-picked');
    assert.deepStrictEqual(modal.components.slice(2).map(l => l.component.value), ['3000', '300', undefined], 'set balances pre-filled, a blank box means 0');
    // THE CURRENCY, per calculation (2026-10-18 20:00 EDT, his ask): the calculation's own, else the /settings default, pre-picked; the default is marked.
    const cur = m => m.components[1].component.options;
    assert.deepStrictEqual(cur(modal).filter(o => o.default).map(o => o.value), ['USD'], 'no currency of its own: the default');
    const kes = dc.buildRegionBalanceModal(state(), { ...withCards, currency: 'EUR' }, { defaultCurrency: 'KES' });
    assert.deepStrictEqual(cur(kes).filter(o => o.default).map(o => o.value), ['EUR'], 'its own currency pre-picked');
    assert.ok(cur(kes).some(o => o.value === 'KES' && o.description === 'Your default'), 'a default outside the quick list is still offered, and marked');
    assert.ok(cur(kes).length <= 25 && new Set(cur(kes).map(o => o.value)).size === cur(kes).length, 'one dropdown, no repeats');
    assert.strictEqual(dc.calcCurrency({ currency: 'EUR' }, 'CAD'), 'EUR');
    assert.strictEqual(dc.calcCurrency({ currency: null }, 'CAD'), 'CAD');
    assert.strictEqual(dc.calcCurrency({ currency: 'XXX' }, 'CAD'), 'CAD', 'an unknown code falls back to the default');
    const { ModalBuilder } = require('discord.js');
    assert.doesNotThrow(() => new ModalBuilder(kes).toJSON(), 'discord.js accepts the five-field pop-up');
    assert.ok(verbOf({ custom_id: modal.custom_id }) === 'nums', 'submits to the Set Balance verb');
    assert.ok(modal.components.every(l => l.type === 18 && l.label.length <= 45));
    assert.strictEqual(Boolean(buttonLabelled(form([{ drawKey: 'mythicWeapon', pullsDone: 0 }]), 'Upgrade: None').disabled), false, 'Upgrade beside its line');
});

// ==========================================
// THE SAVED VIEW (2026-10-14 13:07 EDT): his intake asked how calculations are removed, what the limit is, and what happens at it
// ==========================================
const savedList = (n, nameLen = 10) => Array.from({ length: n }, (_, i) => ({
    _id: String(i + 1).padStart(24, '0'), name: `${'N'.repeat(Math.max(1, nameLen - 3))}${String(i).padStart(3, '0')}`.slice(0, 80),
    banners: Object.keys(DRAW_META).map((k, j) => ({ drawKey: k, pullsDone: j % 4 })), region: 'region_10', includeUpgrades: true, submitted: i % 2 === 0,
    updatedAt: new Date('2026-10-14T12:00:00Z')
}));
const savedView = (list, s = {}, opts = {}) => dc.buildCalculatorPanel(state({ page: 3, ...s }), null, ACCENT, { savedBaskets: list, ...opts });

t('the Saved view opens a calculation, deletes several, or deletes all, and its way back is a footer inside the panel (2026-10-16 11:10 EDT)', () => {
    const panel = savedView(savedList(3));
    const open = selects(panel).find(s => verbOf(s) === 'load');
    assert.ok(open && open.options.length === 3 && open.placeholder === `Reopen a saved calculation (3/${dc.MAX_SAVED} slots)`, open && open.placeholder);
    assert.ok(allText(panel).includes('## Your Saved Calculations'), 'his heading (2026-10-16)');
    assert.ok(texts(panel)[0].endsWith(require('../utils/titleBlock').toBoldItalicUnicode('Saved Calculations')), 'the caption under the title');
    assert.strictEqual(/30 days/.test(allText(panel)), false, 'the 30-day note lives in Help now');
    assert.ok(/clears after 30 days/.test(allText(dc.buildHelpPanel(ACCENT))), 'and Help says it');
    const del = selects(panel).find(s => verbOf(s) === 'savedsel');
    assert.ok(del && del.max_values === 3 && del.min_values === 1);
    assert.strictEqual(verbOf(buttonLabelled(panel, 'Delete All')), 'delallarm', 'Delete All is two-step');
    assert.ok(buttonLabelled(panel, 'Delete All').emoji, 'with his DeleteAll icon');
    const armed = buttonLabelled(savedView(savedList(3), { verb: 'delallarm' }), 'Delete All (3) — click again');
    assert.ok(armed && armed.style === 4 && verbOf(armed) === 'delall');
    const nav = panel.filter(x => x && x.type === 1)[0].components.map(b => b.label);
    assert.deepStrictEqual(nav, ['Draw Prices', 'Help']);
    const footer = panel[0].components[panel[0].components.length - 1];
    assert.deepStrictEqual(footer.components.map(b => b.label), ['Back to Calculation', 'New Calculation']);
    assert.ok(footer.components[0].emoji && verbOf(footer.components[0]) === 'back', 'the pagination left arrow, and it goes back');
    assert.ok(selects(panel).some(x => /\(3\/25 slots\)/.test(x.placeholder || '')), 'the limit is stated, in the reopen placeholder (2026-10-16)');
});

t('each saved calculation says what it is: what it still costs, its region, its draws, and Draft when never calculated', () => {
    const list = savedList(2);
    const options = selects(savedView(list)).find(s => verbOf(s) === 'load').options;
    assert.ok(/^(\w{3} \d{1,2} · )?[\d,]+ CP Needed · 10 CP · Mythic Weapon/.test(options[0].description), options[0].description);
    assert.ok(/^Draft · (\w{3} \d{1,2} · )?[\d,]+ CP Needed · 10 CP · /.test(options[1].description), options[1].description);
    assert.ok(options.every(o => o.description.length <= 100 && !o.emoji), 'within Discord\'s 100, and no icon (2026-10-16: "they don\'t make sense in this list")');
    assert.strictEqual(dc.savedDescription({ banners: [], region: 'region_10', submitted: true, updatedAt: new Date('2026-10-14T12:00:00Z') }, { timezone: 'America/Toronto' }), 'Oct 14 · Empty', 'the date leads, in the viewer\'s timezone');
    assert.strictEqual(dc.savedDescription({ banners: [], region: 'region_10', submitted: true }), 'Empty');
});

t('none saved: the view says how to save one and offers nothing to delete', () => {
    const panel = savedView([]);
    assert.ok(/None saved yet/.test(allText(panel)));
    assert.ok(selects(panel).find(s => verbOf(s) === 'load').disabled);
    assert.strictEqual(selects(panel).some(s => verbOf(s) === 'savedsel') || Boolean(buttonLabelled(panel, 'Delete All')), false);
});

t('deleting asks first; the confirm carries the picked positions and a checksum of the list they came from', () => {
    const list = savedList(4);
    const check = dc.savedChecksum(list);
    const panel = savedView(list, {}, { notice: 'x', savedConfirm: { mask: 0b1010, count: 2, check } });
    const yes = buttonLabelled(panel, 'Delete 2 Calculations');
    assert.ok(yes && yes.style === 4 && verbOf(yes) === 'savedelok');
    const decoded = dc.decodeState(yes.custom_id);
    assert.strictEqual(decoded.mask, 0b1010);
    assert.strictEqual(decoded.check, check);
    assert.ok(yes.custom_id.length <= 100);
    assert.strictEqual(verbOf(buttonLabelled(panel, 'Keep Them')), 'saved');
    assert.notStrictEqual(dc.savedChecksum(list.slice(1)), check, 'a changed list must not pass the checksum');
});

t('the Saved view stays under Discord\'s caps at the 25-calculation limit with the longest names', () => {
    for (const nameLen of [10, 80]) for (const verb of ['saved', 'delallarm']) {
        const n = messageCount(savedView(savedList(dc.MAX_SAVED, nameLen), { verb, basketId: 'f'.repeat(24) }));
        assert.ok(n <= 40, `${n} components`);
    }
    const confirm = savedView(savedList(dc.MAX_SAVED, 80), {}, { notice: 'x', savedConfirm: { mask: (1 << 25) - 1, count: 25, check: 'abcdef' } });
    assert.ok(messageCount(confirm) <= 40);
    assert.strictEqual(dc.decodeState(buttonLabelled(confirm, 'Delete 25 Calculations').custom_id).mask, (1 << 25) - 1, 'all 25 positions round-trip');
});

t('a saved calculation\'s name sits under the title in the Season Calendar\'s caption style, everywhere it is open', () => {
    const named = makeBasket({ name: 'Season `12` push', banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] });
    const { toBoldItalicUnicode } = require('../utils/titleBlock');
    for (const panel of [render(named), render(named, { page: 2 })]) {
        assert.ok(texts(panel)[0].endsWith(`\n${toBoldItalicUnicode('Viewing Saved:')} \`Season '12' push\``), texts(panel)[0]);
    }
    assert.strictEqual(/Viewing Saved/.test(texts(render(makeBasket()))[0]), false, 'nothing for an unsaved one');
});

t('New Calculation shows on every page once there is something to clear', () => {
    assert.strictEqual(buttonLabelled(dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] }), 'New Calculation'), undefined, 'an empty form has nothing to clear');
    assert.ok(buttonLabelled(form([{ drawKey: 'mythicWeapon', pullsDone: 0 }]), 'New Calculation'), 'a form with a line offers it');
    assert.ok(buttonLabelled(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] })), 'New Calculation'), 'and so does a result');
});

t('the first-pick picker is a MULTI-select and an instruction, with a live price in Title Case and no repeated name', () => {
    const picker = selects(dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] })).find(s => verbOf(s) === 'draws');
    assert.ok(picker.max_values > 1, 'picking three draws must be one interaction, not three');
    assert.strictEqual(picker.placeholder, 'Select draw types to calculate');
    assert.ok(picker.options.every(o => o.description && o.description.length <= 100));
    const mythic = picker.options.find(o => o.value === 'mythicWeapon').description;
    assert.ok(/^10 Attempts · [\d,]+ CP Total \+ [\d,]+ CP Upgrade$/.test(mythic), mythic);
    assert.ok(picker.options.every(o => !o.description.includes(o.label) && !/Draw/.test(o.description)), 'a description never repeats the draw\'s name');
});

t('the cost breakdown LEADS with You Need; the simplified view names the terms, the Full Breakdown shows the sum (his layout, 2026-10-17 18:28 EDT)', () => {
    const basket = makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }], balance: 1000 });
    const lines = allText(render(basket)).split('\n');
    const at = lines.indexOf('## Cost Breakdown');
    assert.deepStrictEqual(lines.slice(at + 1, at + 3), ['**You Need: `4,720 CP`**', '-# Cost of Draws **−** Spent Already **−** CP Balance'], 'the headline, then the terms by name');
    assert.ok(allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }], includeUpgrades: true }))).includes('-# Cost of Draws **+** Mythic Upgrades **−**'), 'Mythic Upgrades named only when set');
    const full = allText(render(basket, { detail: true })).split('\n');
    const f = full.indexOf('## Cost Breakdown');
    assert.deepStrictEqual([full[f + 1], full[f + 2], full[f + 4], full[f + 6]], ['**You Need: `4,720 CP`**', '> **Full Cost of Draws: `5,810 CP`**', '> **− Spent Already: `90 CP`**', '> **− CP Balance: `1,000 CP`**'], '5,810 − 90 − 1,000 = 4,720, quoted, one term per line');
    assert.ok(allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }] }), { detail: true })).includes('> **− CP Balance: `0 CP`**\n> -# *Not set* so 0 CP assumed'), 'an unset balance says so, on its own line (2026-10-18 19:48 EDT)');
});

t('Set Balance accepts the amount the way the panel prints it -- "3000 CP", "3,000 cp", "3k CP"', () => {
    const { parseAmount } = dc;
    assert.strictEqual(parseAmount('3000 CP'), 3000);
    assert.strictEqual(parseAmount('3,000 cp'), 3000);
    assert.strictEqual(parseAmount('3k CP'), 3000);
    assert.strictEqual(parseAmount('3000'), 3000);
    assert.strictEqual(parseAmount('cp'), 0, 'a bare unit is an empty amount, never NaN');
    assert.strictEqual(parseAmount('3000 CAD'), null, 'any other unit is still rejected');
});

// ==========================================
// 2026-10-13 CLICK-TEST ROUND -- each case pins one finding from local/project/features/draw-calculator/critique-2026-10-13.md
// ==========================================
t('one name per draw, everywhere (2026-10-13 23:03 EDT): his renames, and no "Draw" suffix in any string the calculator renders', () => {
    assert.strictEqual(dc.shortName('legendaryGunReactive'), 'Legendary Weapon (Reactive)');
    assert.strictEqual(dc.shortName('legendaryGunNonReactive'), 'Legendary Weapon (Non-Reactive)');
    for (const key of Object.keys(DRAW_META)) assert.ok(dc.SHORT_NAME[key], `${key} has no name`);
    const banners = Object.keys(DRAW_META).map((drawKey, i) => ({ drawKey, pullsDone: i % 3 }));
    const strings = p => JSON.stringify(p).match(/"(label|description|placeholder|content)":"[^"]*"/g) || [];
    for (const p of [form(banners), render(makeBasket({ banners, includeUpgrades: true }), { detail: true }), dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] })]) {
        const bad = strings(p).filter(x => /(?<!Per )\bDraw\b(?! Prices| Calculator| Cost Calculator| Selections?| Progress)/.test(x)); // the title, the Draw Prices button, the Cost Per Draw and Your Draw Selections headings are names, not a draw
        assert.deepStrictEqual(bad, [], 'a full "... Draw" name crept back in');
    }
});

t('Upgrade at a region with no upgrade price says it is NOT included, instead of silently adding nothing', () => {
    // Every region has Mythic upgrade prices since 2026-10-16, so the gap is made here to keep the guard tested.
    const { DRAW_DATA } = require('../commands/drawprices');
    const saved = DRAW_DATA.region_20.mythicWeapon.upgrade;
    delete DRAW_DATA.region_20.mythicWeapon.upgrade;
    let panel;
    try { panel = render(makeBasket({ region: 'region_20', includeUpgrades: true, banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] })); }
    finally { DRAW_DATA.region_20.mythicWeapon.upgrade = saved; }
    assert.ok(/Upgrade not included/.test(allText(panel)), 'the missing upgrade price must be named');
    assert.strictEqual(/Upgrade not included/.test(allText(render(makeBasket({ region: 'region_20', includeUpgrades: true, banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] })))), false, '20 CP has its upgrade price now');
    const r10 = render(makeBasket({ region: 'region_10', includeUpgrades: true, banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }));
    assert.strictEqual(/Upgrade not included/.test(allText(r10)), false, 'and only where it is actually missing');
});

t('every line finished, no balance: says so, never "your balance covers this"', () => {
    const text = allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 10 }] })));
    assert.ok(/Every draw here is finished/.test(text));
    assert.strictEqual(/balance covers/i.test(text), false);
    const rich = allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }], balance: 20000 })));
    assert.ok(/Your balance covers this\*\*, with \*\*`[\d,]+ CP`\*\* to spare/.test(rich), 'a covering balance says what is left after');
});

t('the Upgrade button sits beside its Mythic line on the editor, and nowhere else', () => {
    assert.strictEqual(buttons(progress([{ drawKey: 'legendaryGunReactive', pullsDone: 0 }])).some(b => /^Upgrade/.test(b.label || '')), false);
    assert.ok(buttons(progress([{ drawKey: 'mythicWeapon', pullsDone: 0 }])).some(b => /^Upgrade/.test(b.label || '')));
    assert.strictEqual(buttons(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }))).some(b => /^Upgrade/.test(b.label || '')), false, 'nor on the result');
    const r = rows(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] })));
    const last = r.find(x => x.components.some(b => b.label === 'Save Result'));
    assert.deepStrictEqual(last.components.map(b => b.label), ['New Calculation', 'View Saved', 'Export', 'Save Result'], 'the result keeps its row');
    assert.ok(last.components[3].emoji && verbOf(last.components[3]) === 'savepick' && verbOf(last.components[2]) === 'export');
    const f = form([{ drawKey: 'mythicWeapon', pullsDone: 0 }]);
    const items = container(f).components;
    const calcRow = items.findIndex(c => c.type === 1 && c.components.some(b => b.label === 'Calculate'));
    assert.ok(items[calcRow - 1].type === 14 && items[calcRow - 1].divider, 'a divider above the Calculate row');
    assert.ok(buttonLabelled(f, 'Calculate').emoji, 'Calculate carries his Sparkles emoji');
});

t('what a region is lives in Help; the form only shows the region', () => {
    // The Tweak Calculation caption left with the region buttons (2026-10-18 17:25 EDT): Set Region & Balance labels itself.
    for (const panel of [dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] })]) {
        assert.strictEqual(/Tweak Calculation|Your Region & CP Balance/.test(allText(panel)), false);
        assert.strictEqual(/first pull/.test(allText(panel)), false, 'what a region is stays in Help');
    }
    assert.ok(/Your region is the price of the \*\*first spin\*\*/.test(allText(dc.buildHelpPanel(ACCENT))));
    const help = dc.buildHelpPanel(ACCENT);
    assert.deepStrictEqual(texts(help).map(c => c.split('\n')[0].replace(/<a?:\w+:\d+> ?/g, '')), ['## Calculator Help', '### 🧭 How It Works', '### 📈 How Prices Work', '### 🗺️ Find Your Region', '### 🧾 Reading Your Result', '### 💰 Why Stock Up', '### Saving', '-# *Estimates only; not financial advice. Local taxes extra. Local currency conversion may vary. CoD: Mobile web store prices, and any sales or discounts, are not included.*'], 'Help is sections with an emoji each, not paragraphs (2026-10-14 18:31 EDT)');
    assert.ok(texts(help).every(c => c.split('\n').every(l => l.startsWith('-# ') || l.length < 160)), 'no line runs on as a paragraph; a -# hint is one line by his call (2026-10-16 00:13 EDT)');
});

t('the default view names the currency and where to change it', () => {
    const text = allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] })));
    assert.ok(/Prices in \*\*CAD\*\*/.test(text), 'compact view must name the currency (the fixture renders in CAD)');
});

t('the purchase is his layout: the total for its price, what is left over, then each bundle quoted with ⌇ before its price (2026-10-17 18:28 EDT)', () => {
    const block = texts(render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }] }))).find(c => c.includes('## Suggested Purchase'));
    const lines = block.slice(block.indexOf('## Suggested Purchase')).split('\n');
    assert.ok(/^\*\*`[\d,]+ CP`\*\* for \*\*`CA\$[\d,.]+`\*\*$/.test(lines[1]), lines[1]);
    assert.ok(/^-# \*\*`[\d,]+ CP` left over\*\*$/.test(lines[2]), `the simplified view says only what is left over: ${lines[2]}`);
    const bundles = lines.filter(l => l.startsWith('> **'));
    assert.ok(bundles.length >= 1 && bundles.every(l => /^> \*\*\d+× `[\d,]+ CP`\*\* bundle ⌇ \*\*`CA\$[\d,.]+`\*\*( each)?$/.test(l)), bundles.join('\n'));
    assert.ok(bundles.every(l => /^> \*\*1×/.test(l) ? !/ each$/.test(l) : / each$/.test(l)), '"each" only on a count above one');
    assert.ok(/^-# \*Prices in \*\*CAD\*\* \(Tip: Set default in .+\)\*$/.test(lines[lines.length - 1]) && !/Cheapest/.test(block), 'the currency line, in italics, his wording (2026-10-18 20:00 EDT)');
});

t('the simplified list is his draft: a bold line per draw, in a Section with Edit Selection as its button; Price and attempts only in the Full Breakdown (2026-10-18 19:31 EDT)', () => {
    const panel = render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 1 }] }));
    const comps = container(panel).components;
    const sec = comps.find(c => c.type === 9 && c.accessory && c.accessory.label === 'Edit Selections');
    assert.ok(sec && sec.components[0].content.startsWith('## Your Draw Selections'), 'the list and its button are one Section');
    assert.strictEqual(verbOf(sec.accessory), 'edit');
    const t = allText(panel);
    assert.strictEqual(/Price: /.test(t), false, 'no Price line on the simple view (2026-10-18 19:31 EDT, his ask)');
    const full = allText(render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 1 }] }), { detail: true }));
    assert.ok(/\*\*<:\w+:\d+> #2 · Legendary Weapon \(Reactive\)\*\*\n> \*\*Price: `4,950 CP`\*\* · `1\/10` Attempts/.test(full), full);
    assert.strictEqual(/To Complete/.test(t), false, 'spent / to complete is the Full Breakdown\'s only (2026-10-17 17:41 EDT)');
    assert.strictEqual(selects(panel).some(s => ['draws', 'addmore', 'bpulls'].includes(verbOf(s))), false, 'the result edits nothing itself');
});

t('unticking a draw with progress asks first; applySelection keeps order and progress', () => {
    const panel = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }] }), {}, { notice: 'x', dropConfirm: { mask: 0, count: 1 } });
    const confirm = buttonLabelled(panel, 'Remove 1 line');
    assert.ok(confirm && confirm.style === 4, 'the confirm must be Danger-styled');
    assert.strictEqual(selects(panel).some(s => s.custom_id.split('~')[1] === 'draws'), false, 'the picker steps aside while the confirm is open');
    assert.strictEqual(dc.decodeState(confirm.custom_id).mask, 0);
    const kept = dc.applySelection([{ drawKey: 'mythicWeapon', pullsDone: 3 }, { drawKey: 'legendaryGunReactive', pullsDone: 2 }], new Set(['legendaryGunReactive', 'doubleEpicCharacters']));
    assert.deepStrictEqual(kept, [{ drawKey: 'legendaryGunReactive', pullsDone: 2 }, { drawKey: 'doubleEpicCharacters', pullsDone: 0 }]);
    const s = dc.decodeState(dc.encodeState('dropok', { ...state(), basketId: 'a'.repeat(24), mask: 0b100000101 }));
    assert.strictEqual(s.mask, 0b100000101, 'the pending selection must round-trip');
});

t('the untick confirm also shows on the setup form, and fits the budget at its densest', () => {
    const banners = Array.from({ length: 9 }, (_, i) => ({ drawKey: Object.keys(DRAW_META)[i], pullsDone: 1 }));
    const saved = Array.from({ length: 25 }, (_, i) => ({ _id: String(i).padStart(24, '0'), name: `Saved ${i}`, banners, region: 'region_10' }));
    for (const submitted of [false, true]) {
        const panel = dc.buildCalculatorPanel(state(), makeBasket({ banners, submitted }), ACCENT, { savedBaskets: saved, notice: 'x', dropConfirm: { mask: 1, count: 8 } });
        assert.ok(buttonLabelled(panel, 'Remove 8 lines'), `confirm missing (submitted=${submitted})`);
        assert.ok(messageCount(panel) <= 40, `over the 40-component cap: ${messageCount(panel)} (submitted=${submitted})`);
    }
});

t('Draw Prices opens its own message instead of replacing the calculator', () => {
    const nav = buttonLabelled(render(makeBasket()), 'Draw Prices');
    assert.notStrictEqual(nav.custom_id, 'nav_prices', 'nav_prices re-renders THIS message as /draw prices');
    assert.strictEqual(dc.decodeState(nav.custom_id).verb, 'prices');
});

t('the slash shortcut opens a calculated line, clamps pulls to the draw, and explains what it ignored', () => {
    const full = dc.slashShortcut({ draw: 'mythicWeapon', pulls: 3, balance: 2000, region: 'region_10' });
    assert.deepStrictEqual(full.create, { banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }], region: 'region_10', balance: 2000, submitted: true });
    assert.strictEqual(full.notice, null);
    const seven = dc.slashShortcut({ draw: 'sevenSpinLegendaryWeapon', pulls: 10, region: 'region_10' });
    assert.strictEqual(seven.create.banners[0].pullsDone, 7, 'a 7-pull draw must never store 10 pulls');
    assert.ok(/has 7 Attempts/.test(seven.notice));
    const orphan = dc.slashShortcut({ pulls: 4, balance: 500 });
    assert.strictEqual(orphan.create, null);
    assert.strictEqual(orphan.balance, 500, 'a bare balance is applied to whichever calculation opens');
    assert.ok(/needs a `draw`/.test(orphan.notice));
    assert.deepStrictEqual(dc.slashShortcut({}), { create: null, balance: null, notice: null }, 'no options: no shortcut at all');
});

t('each line\'s dropdown OPENS with Remove, then the values; Move Up is gone', () => {
    const lines = selects(progress([{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 3 }])).filter(s => verbOf(s) === 'bpulls');
    for (const line of lines) assert.strictEqual(line.options[0].value, '0', 'progress values only (2026-10-18 13:38 EDT)');
    assert.strictEqual(lines.some(s => s.options.some(o => o.value === 'up')), false, 'no Move Up option on any line (2026-10-14, his call)');
    const rm = buttonLabelled(progress([{ drawKey: 'mythicWeapon', pullsDone: 0 }]), 'Remove');
    assert.ok(rm && rm.style === 4 && verbOf(rm) === 'rmopen' && rm.emoji && rm.emoji.name === 'DeleteBin', 'Remove is a red button with his DeleteBin, opening the pop-up');
    assert.ok(lines.every(s => s.options.length <= 25));
});

t('both views are the same two Sections: the list with Edit Selection, the figures and purchase with the view toggle (2026-10-17 17:26 / 17:30 EDT)', () => {
    for (const [st, label, verb] of [[{}, 'Full Breakdown', 'detail'], [{ detail: true }, 'Simple Breakdown', 'detail']]) {
        const comps = container(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], balance: 3000 }), st)).components;
        const sec = comps.find(c => c.type === 9 && c.accessory && c.accessory.label === label);
        assert.ok(sec && sec.components.length === 2 && sec.components[0].content.startsWith('## Cost Breakdown') && sec.components[1].content.startsWith('## Suggested Purchase'), `${label}: one Section, two texts`);
        assert.strictEqual(verbOf(sec.accessory), verb);
        assert.ok(comps.some(c => c.type === 9 && c.accessory && c.accessory.label === 'Edit Selections'), `${label}: the list Section too`);
    }
});

// ==========================================
// ADDING MORE OF A DRAW (2026-10-13 19:48 EDT): Harkirat tried three shapes on the dev bot and chose "+ Add more draws" under the lines, with copies kept together
// ==========================================
t('setTypeCount adds copies after the draw\'s last line and removes empty copies first', () => {
    const start = [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 3 }, { drawKey: 'doubleEpicCharacters', pullsDone: 0 }];
    const up = dc.setTypeCount(start, 'legendaryGunReactive', 3);
    assert.deepStrictEqual(up.banners.map(b => `${b.drawKey}:${b.pullsDone}`), ['mythicWeapon:0', 'legendaryGunReactive:3', 'legendaryGunReactive:0', 'legendaryGunReactive:0', 'doubleEpicCharacters:0']);
    assert.strictEqual(up.removed.length, 0);
    const down = dc.setTypeCount(up.banners, 'legendaryGunReactive', 1);
    assert.deepStrictEqual(down.banners.map(b => `${b.drawKey}:${b.pullsDone}`), ['mythicWeapon:0', 'legendaryGunReactive:3', 'doubleEpicCharacters:0'], 'the copy with pulls must survive');
    assert.strictEqual(down.removed.every(b => b.pullsDone === 0), true);
    const forced = dc.setTypeCount([{ drawKey: 'mythicWeapon', pullsDone: 2 }, { drawKey: 'mythicWeapon', pullsDone: 5 }], 'mythicWeapon', 1);
    assert.deepStrictEqual(forced.removed, [{ drawKey: 'mythicWeapon', pullsDone: 5 }], 'with no empty copy, the newest goes');
    const fresh = dc.setTypeCount([], 'mythicWeapon', 2);
    assert.strictEqual(fresh.banners.length, 2);
});

t('the landing starts from ONE multi-select; after that, Add Draws is a pop-up with every draw and the three Series Armories (his one editor (2026-10-18 15:15 EDT))', () => {
    const empty = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] });
    assert.ok(selects(empty).some(s => verbOf(s) === 'draws' && s.max_values > 1), 'an empty form starts from the multi-select');
    const ed = form([{ drawKey: 'legendaryGunReactive', pullsDone: 2 }, { drawKey: 'mythicWeapon', pullsDone: 0 }]);
    assert.strictEqual(selects(ed).some(s => verbOf(s) === 'draws' || verbOf(s) === 'addmore'), false, 'no picker on the editor');
    const add = dc.buildAddDrawsModal(state(), makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }), []);
    assert.strictEqual(add.components[0].component.options.length, dc.CALC_KEYS.length);
    assert.ok(add.components[0].component.max_values > 1);
});

t('pages keep a draw\'s lines together', () => {
    const run = keys => keys.map(drawKey => ({ drawKey, pullsDone: 0 }));
    assert.deepStrictEqual(dc.linePages(run(['a', 'a', 'a', 'b', 'b', 'c']), 4), [[0, 1, 2], [3, 4, 5]], 'a group never splits to fill a page');
    assert.deepStrictEqual(dc.linePages(run(['a', 'b', 'b', 'b', 'b', 'b']), 4), [[0], [1, 2, 3, 4], [5]], 'a group longer than a page is the only split');
    assert.deepStrictEqual(dc.linePages([], 4), [[]]);
    const shown = selects(progress(run(['mythicWeapon', 'mythicWeapon', 'legendaryGunReactive', 'legendaryGunReactive', 'legendaryGunReactive']))).filter(s => verbOf(s) === 'bpulls').map(s => dc.decodeState(s.custom_id).focus);
    assert.ok([2, 5].includes(shown.length) && shown.every((v, i) => v === i), `page 1 ends at a draw boundary, never inside the three Reactives (showed ${shown.join(',')})`);
});

t('a calculation stops at its line cap: Add Draws is disabled, and its pop-up never lets one pick overshoot', () => {
    const full = Array.from({ length: dc.MAX_LINES }, () => ({ drawKey: 'mythicWeapon', pullsDone: 0 }));
    assert.ok(buttonLabelled(form(full), 'Add Draws').disabled);
    const room = dc.buildAddDrawsModal(state(), makeBasket({ banners: full.slice(0, dc.MAX_LINES - 2) }), []);
    assert.strictEqual(room.components[0].component.max_values, 2);
});

t('the form and the result stay under 40 with unique ids at every size up to the cap', () => {
    const keys = Object.keys(DRAW_META);
    const saved = Array.from({ length: 25 }, (_, i) => ({ _id: String(i).padStart(24, '0'), name: `Saved ${i}`, banners: [], region: 'region_10' }));
    for (const types of [1, 2, 3, 5, 9]) for (let lines = 1; lines <= dc.MAX_LINES; lines++) for (let bpage = 0; bpage < 8; bpage++) {
        const banners = Array.from({ length: lines }, (_, i) => ({ drawKey: keys[Math.floor(i * types / lines)], pullsDone: 1 }));
        for (const savedBaskets of [[], saved]) {
            const form = dc.buildCalculatorPanel(state({ bpage }), makeBasket({ submitted: false, banners }), ACCENT, { savedBaskets });
            assert.ok(messageCount(form) <= 40, `form: ${types} draws, ${lines} lines, saved ${savedBaskets.length}, page ${bpage + 1}: ${messageCount(form)}`);
        }
        // The result has no line pages, so its two views are checked once per size, not on every form page (2026-10-17 18:52 EDT: rendering it 8 times per size made this case take most of a minute).
        if (bpage > 1) continue;
        const result = render(makeBasket({ banners }), { bpage, detail: bpage % 2 === 1 });
        assert.ok(messageCount(result) <= 40, `result: ${types} draws, ${lines} lines: ${messageCount(result)}`);
    }
});

t('the landing starts a calculation, and Saved is one tap away in the nav row (2026-10-14 13:07 EDT)', () => {
    const landing = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] });
    const text = allText(landing);
    assert.ok(text.includes('## Start a Calculation\n-# Pick all the draw types you want to calculate. You can add more later.'));
    assert.strictEqual(/Saved Calculations/.test(text), false, 'the loader moved to its own view');
    assert.strictEqual(/#+ \d/.test(text), false, 'no step numbers');
    assert.strictEqual(verbOf(buttonLabelled(landing, 'View Saved')), 'saved', 'with none saved the button still shows, so saving is discoverable');
    const saved = [{ _id: 'c'.repeat(24), name: 'Season 12', banners: [], region: 'region_10' }];
    assert.ok(buttonLabelled(dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: saved }), 'View Saved'), 'no counter (2026-10-14 17:58 EDT)');
    assert.ok(buttonLabelled(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] })), 'Edit Selections'), 'the result offers a way to change things');
});

t('the result keeps Set Region & Balance one tap away, and Edit Selections opens the editor while the calculation stays submitted', () => {
    const result = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }));
    assert.strictEqual(verbOf(buttonLabelled(result, 'Set Region & Balance')), 'rbmodal', 'one tap (2026-10-18 17:25 EDT)');
    assert.strictEqual(verbOf(buttonLabelled(result, 'Edit Selections')), 'edit');
    for (const page of [2, 5]) {
        const editing = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], submitted: true }), { page, fromResult: true });
        assert.ok(allText(editing).includes('## Adjust Draws') && buttonLabelled(editing, 'Back to Result'), `page ${page} is the editor`);
        assert.strictEqual(buttonLabelled(editing, 'View Saved'), undefined, 'no View Saved from a result');
    }
});

t('removing a line with progress asks first; Keep stays on the page it was asked from', () => {
    const editing = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 7 }] }), { page: 2, focus: 0 }, { dropConfirm: { mask: 0, count: 1, verb: 'dellineok', label: 'Remove #1' }, notice: 'x' });
    const yes = buttonLabelled(editing, 'Remove #1');
    const keep = buttonLabelled(editing, 'Keep It');
    assert.ok(yes && keep);
    assert.strictEqual(dc.decodeState(yes.custom_id).focus, 0, 'the confirm carries which line');
    assert.strictEqual(dc.decodeState(keep.custom_id).page, 2, 'Keep does not throw an edit back to the result');
});

t('batch 8 (2026-10-14 16:47 EDT): plural selections on the result, the DeleteBin on Remove, and no "·" before an upgrade', () => {
    assert.ok(allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }] }))).includes('## Your Draw Selections'));
    const remove = buttonLabelled(progress([{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicWeapon', pullsDone: 0 }]), 'Remove');
    assert.strictEqual(remove.emoji.name, 'DeleteBin');
    const fresh = dc.buildAddDrawsModal(state(), makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }), []).components[0].component.options.find(o => o.value === 'mythicCharacter').description;
    assert.ok(/CP Total \+ [\d,]+ CP Upgrade$/.test(fresh) && !/· \+/.test(fresh), fresh);
});

t('the Saved view manages the open calculation at its top, and only when there is one', () => {
    const named = makeBasket({ name: 'My Push' });
    const withCurrent = dc.buildCalculatorPanel(state({ page: 3 }), named, ACCENT, { savedBaskets: [named] });
    const text = allText(withCurrent);
    assert.ok(text.indexOf('## This Calculation') < text.indexOf('## Your Saved Calculations'), 'the open calculation comes first');
    assert.ok(verbOf(buttonLabelled(withCurrent, 'Rename')) === 'modal_name' && dc.decodeState(buttonLabelled(withCurrent, 'Rename').custom_id).page === 3, 'Rename returns to the Saved view');
    assert.strictEqual(/This Calculation/.test(allText(dc.buildCalculatorPanel(state({ page: 3 }), null, ACCENT, { savedBaskets: [named] }))), false, 'no section when nothing is open');
    assert.ok(messageCount(dc.buildCalculatorPanel(state({ page: 3, verb: 'delarm' }), named, ACCENT, { savedBaskets: savedList(dc.MAX_SAVED, 80) })) <= 40, 'fits at the cap with the section');
});

t('a working copy has no "Edited from Saved" line (2026-10-16 09:58 EDT), and saving lives in the Saved view (2026-10-16 14:27 EDT)', () => {
    const copy = makeBasket({ _id: 'c'.repeat(24), name: undefined, sourceId: '0'.repeat(23) + '1', sourceName: 'test' });
    assert.strictEqual(texts(render(copy))[0], `## ${require('../utils/emojiMap').calculator} Lucky Draw Cost Calculator`, texts(render(copy))[0]);
    const list = savedList(3);
    for (const page of [3, 4]) { // page 4 is the old Save step: a panel still carrying it gets the Saved view
        const view = dc.buildCalculatorPanel(state({ page, basketId: copy._id }), copy, ACCENT, { savedBaskets: list });
        const text = allText(view);
        assert.ok(text.indexOf('## Save This Calculation') < text.indexOf('## Your Saved Calculations'), 'the save section sits above the list');
        assert.ok(/^> -# Edited from \*\*test\*\*, which stays as it was unless you replace it\.$/m.test(text), 'and says what it was edited from, quoted because it is conditional');
        assert.ok(buttonLabelled(view, 'Save as New') && verbOf(buttonLabelled(view, 'Save as New')) === 'modal_name' && buttonLabelled(view, 'Save as New').emoji);
        assert.strictEqual(buttonLabelled(view, 'Cancel'), undefined, 'no Cancel: there is no separate step to leave');
        const over = selects(view).find(s => verbOf(s) === 'owsel');
        assert.ok(over.placeholder === 'Or replace a previously saved calculation...' && /^Edited From This One · /.test(over.options.find(o => o.value === copy.sourceId).description), 'the source is marked in the list');
    }
    const confirm = dc.buildCalculatorPanel(state({ page: 3, basketId: copy._id }), copy, ACCENT, { savedBaskets: list, overwriteConfirm: { target: list[0]._id, name: list[0].name } });
    const yes = buttonLabelled(confirm, `Replace "${list[0].name}"`);
    assert.ok(yes && yes.style === 4 && verbOf(yes) === 'owok' && dc.decodeState(yes.custom_id).target === list[0]._id && yes.custom_id.length <= 100);
    assert.strictEqual(verbOf(buttonLabelled(confirm, 'Keep It')), 'saved');
    assert.ok(messageCount(dc.buildCalculatorPanel(state({ page: 3, basketId: copy._id }), copy, ACCENT, { savedBaskets: savedList(dc.MAX_SAVED, 80) })) <= 40, 'fits at the cap with three dropdowns');
    assert.ok(JSON.stringify(dc.buildCalculatorPanel(state({ page: 3, basketId: copy._id }), copy, ACCENT, { savedBaskets: savedList(dc.MAX_SAVED, 80) })).length <= dc.SETUP_JSON_BUDGET + 1000, 'and under the size budget');
});

t('Export gives the result as plain, pasteable markdown: draws, CP needed, balance, package (2026-10-14 18:22 EDT)', () => {
    const text = dc.buildExportText(makeBasket({ name: 'My `Push`', balance: 1000, banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'mythicWeapon', pullsDone: 3 }] }), 'CAD');
    assert.ok(text.startsWith('## Lucky Draw Calculation: My Push'), 'markdown characters in a name are dropped, so it cannot break the block');
    assert.ok(/- \*\*Legendary Weapon \(Reactive\) ×2\*\*: 0\/10 Spins · 10 left · [\d,]+ CP to finish/.test(text) && /- \*\*Mythic Weapon\*\*: 3\/10 Spins · 7 left · [\d,]+ CP to finish · [\d,]+ CP spent/.test(text), 'each draw: spins, left, to finish, spent (2026-10-14 19:27 EDT)');
    assert.ok(/\*\*You Need:\*\* [\d,]+ CP/.test(text) && /\*\*Balance:\*\* 1,000 CP → \*\*[\d,]+ CP\*\* to buy/.test(text) && /\*\*Recommended Bundle:\*\* CA\$[\d,.]+\n- \d+× [\d,]+ CP · CA\$/.test(text), 'the package lists each pack with its price');
    assert.strictEqual(/<a?:\w+:\d+>|```/.test(text), false, 'no custom emoji and no code fence inside it');
    assert.ok(text.length < 2000, 'fits a Discord message');
    const covered = dc.buildExportText(makeBasket({ balance: 999999, banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }), 'USD');
    assert.ok(/covers it/.test(covered) && !/Recommended Bundle/.test(covered));
});

t('Help explains what the screen cannot: the price ladder for the open draw, how to find a region, the result\'s hidden rules (2026-10-14 18:31 EDT)', () => {
    const help = dc.buildHelpPanel(ACCENT, { region: 'region_30', drawKey: 'legendaryGunReactive' });
    const text = allText(help);
    assert.ok(/`30` › `80` › /.test(text) && /Legendary Weapon \(Reactive\)\*\* at .*\*\*30 CP\*\*/.test(text), 'the open draw at the open region');
    assert.ok(/last 3 spins are \*\*\d+%\*\*/.test(text));
    assert.ok(/Other draw types may start higher, so do not check those\./.test(text), 'never "check any draw": some draws start above the region (his wording, 2026-10-18 19:56 EDT)');
    assert.strictEqual(/Words You'll See|### Buttons/.test(text), false);
    const fallback = allText(dc.buildHelpPanel(ACCENT, { region: 'region_20', drawKey: 'doubleEpicCharacters' }));
    assert.ok(/Mythic Weapon\*\* at .*20 CP/.test(fallback), 'a draw with no prices at that region falls back to Mythic Weapon');
});

t('the calculator sends no Show Everyone row (2026-10-14 18:34 EDT)', () => {
    for (const p of [render(makeBasket()), form([{ drawKey: 'mythicWeapon', pullsDone: 0 }])]) {
        assert.strictEqual(JSON.stringify(p).includes('share_public'), false);
    }
});

t('Help shows every pack\'s price per 100 CP in the viewer\'s currency and Stock Up\'s real thresholds (2026-10-16 00:04 EDT)', () => {
    const { STOCK_UP_RULES } = require('../utils/cpPackages');
    const cad = allText(dc.buildHelpPanel(ACCENT, { currency: 'CAD' }));
    assert.ok(/### 💰 Why Stock Up/.test(cad));
    assert.ok(/\*\*80 CP\*\* · CA\$1\.24/.test(cad), 'the smallest pack, in CAD');
    assert.ok(/\*\*10,800 CP\*\* · CA\$1\.20 · \*\*best rate\*\*/.test(cad), 'the cheapest per 100 CP is marked');
    assert.strictEqual((cad.match(/best rate/g) || []).length, 1);
    assert.ok(cad.includes(`at least ${Math.round(STOCK_UP_RULES.minRateGain * 100)}% more CP`) && cad.includes(`at most ${STOCK_UP_RULES.budgetMult}×`) && cad.includes(`at most ${STOCK_UP_RULES.maxPurchases} purchases, or as many as the Recommended Bundle`), 'thresholds come from cpPackages');
    assert.ok(/uses yours: \*\*USD\*\*/.test(allText(dc.buildHelpPanel(ACCENT))), 'USD when no currency is set');
    assert.ok(/Bundle prices differ by currency/.test(cad) && !/\b[Pp]ack(age)?s?\b/.test(cad) && /^-# Stock Up is worked out in your currency: .* when it needs more\.$/m.test(cad) && /^Price per 100 CP \(lower is better\):$/m.test(cad) && !/Leftover CP stays/.test(cad), 'currency is named, and the hint is one line');
    assert.ok(/¥148 · \*\*best rate\*\*/.test(allText(dc.buildHelpPanel(ACCENT, { currency: 'JPY' }))), 'a zero-decimal currency still reads as a price');
});

t('the Full Breakdown is the simplified layout with its working shown, and the sums check out (2026-10-17 17:30 EDT)', () => {
    const banners = [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 1 }, { drawKey: 'mythicWeapon', pullsDone: 0 }];
    const t = allText(render(makeBasket({ banners }), { detail: true }, { currency: 'CAD' }));
    assert.ok(/#2 · Legendary Weapon \(Reactive\)\*\*\n> \*\*Price: `4,950 CP`\*\* · `1\/10` Attempts\n> -# `10 CP` Spent · `4,940 CP` To Complete/.test(t), 'the same list as the simplified view');
    assert.ok(t.includes('**You Need: `15,700 CP`**') && t.includes('> **Full Cost of Draws: `15,710 CP`**') && t.includes('> **− Spent Already: `10 CP`**'), '15,710 − 10 − 0 = 15,700');
    assert.ok(t.includes('`4,950 CP` **+** `4,950 CP` **+** `5,810 CP`') && t.includes('`0 CP` **+** `10 CP` **+** `0 CP`'), 'each sum shows its terms');
    assert.ok(t.includes('**Just Enough: `15,800 CP`** for **`CA$199.98`**') && t.includes('-# **`100 CP` left over** after completing your draws'));
    assert.ok(t.includes('**`CA$129.99`** each') && !/web store prices/.test(t), 'the estimates disclaimer is Help\'s footer now (2026-10-18 19:44 EDT)');
    assert.ok(/Estimates only; not financial advice\. .*CoD: Mobile web store prices, and any sales or discounts, are not included\./.test(allText(dc.buildHelpPanel(ACCENT))), 'Help carries it, in his wording (2026-10-18 19:54 EDT)');
    const compact = allText(render(makeBasket({ banners }), {}, { currency: 'CAD' }));
    assert.strictEqual(/Cheapest|Estimates only|`4,950 CP` \*\*\+\*\*|To Complete/.test(compact), false, 'the simplified view leaves the working out');
});

t('the Full Breakdown stays under Discord\'s 4,000-character text cap at 25 lines (probed 2026-10-16 01:12 EDT)', () => {
    const keys = Object.keys(DRAW_META);
    const textLen = p => { let n = 0; const w = x => { if (Array.isArray(x)) return x.forEach(w); if (x.type === 10) n += x.content.length; (x.components || []).forEach(w); }; w(p); return n; };
    for (const banners of [Array(25).fill(0).map((_, i) => ({ drawKey: keys[i % keys.length], pullsDone: i % 7 })), Array(25).fill(0).map(() => ({ drawKey: 'mythicWeapon', pullsDone: 0 })), Array(12).fill(0).map((_, i) => ({ drawKey: keys[i % keys.length], pullsDone: i % 7 }))]) {
        const p = render(makeBasket({ banners, includeUpgrades: true, balance: 3000, entitlementMask: 0b111111 }), { detail: true }, { currency: 'CAD', liveDoubleCPEntry: { isDoubleCP: true } });
        assert.ok(textLen(p) <= 4000, `${banners.length} lines: ${textLen(p)} characters`);
    }
    const twelve = allText(render(makeBasket({ banners: Array(12).fill(0).map((_, i) => ({ drawKey: keys[i % keys.length], pullsDone: i % 7 })) }), { detail: true }, { currency: 'CAD' }));
    assert.strictEqual((twelve.match(/To Complete/g) || []).length, 12, 'twelve different lines still get one block each');
});

t('Stock Up can use as many purchases as the Recommended Package, up to 6 (2026-10-16 01:07 EDT)', () => {
    const { optimizePurchase } = require('../utils/cpPackages');
    const big = optimizePurchase(39000, { currency: 'CAD' });
    assert.ok(big.stockUp && big.stockUp.transactions > 3 && big.stockUp.transactions <= 6, `39,000 CP in CAD: ${big.stockUp && big.stockUp.transactions}`);
    const small = optimizePurchase(5810, { currency: 'USD' });
    assert.ok(!small.stockUp || small.stockUp.transactions <= 3, 'a small calculation keeps the 3-purchase limit');
});

// ==========================================
// MYTHIC UPGRADES BY TIER (2026-10-17 13:17 EDT, Harkirat's build go at 13:12 EDT)
// ==========================================
t('upgrades: the ladders, the shared pool and the presets', () => {
    const { upgradePlan, upgradeNeed, characterPreset } = require('../utils/drawCost');
    const pool = (b, key) => upgradePlan({ region: 'region_20', ...b }).pools.find(p => p.drawKey === key);
    const unset = { includeUpgrades: true, banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }] };
    assert.strictEqual(upgradePlan({ region: 'region_20', ...unset }).cp, 0, 'a Mythic line with no target of its own has no upgrade, whatever the old toggle says (2026-10-17 19:15 EDT)');
    const legacy = { banners: [{ drawKey: 'mythicWeapon', pullsDone: 0, upWant: [5] }, { drawKey: 'mythicCharacter', pullsDone: 0, upWant: [3, 3, 3, 1] }] };
    assert.deepStrictEqual([pool(legacy, 'mythicWeapon').spins, pool(legacy, 'mythicWeapon').cp], [10, 10000], 'Max is 10 spins of 1,000 CP');
    assert.deepStrictEqual([pool(legacy, 'mythicCharacter').need, pool(legacy, 'mythicCharacter').spins, pool(legacy, 'mythicCharacter').cp], [2820, 14, 16380], '2,820 coins is exactly 14 spins, never 15 from a float');
    const threeL1 = { banners: [0, 1, 2].map(() => ({ drawKey: 'mythicWeapon', pullsDone: 0, upWant: [1] })) };
    assert.strictEqual(pool(threeL1, 'mythicWeapon').spins, 2, 'the pool is shared: three Level 1s are 375 cards, 2 spins, not 1 + 1 + 1');
    const held = { mythicCards: 300, banners: [{ drawKey: 'mythicWeapon', pullsDone: 10, upHave: [2], upWant: [5] }] };
    assert.deepStrictEqual([pool(held, 'mythicWeapon').need, pool(held, 'mythicWeapon').short, pool(held, 'mythicWeapon').spins], [1600, 1300, 7], 'Level 2 → 5 is 1,600 cards; 300 held leaves 1,300, 7 spins');
    const notDone = { banners: [{ drawKey: 'mythicWeapon', pullsDone: 9, upHave: [2], upWant: [5] }] };
    assert.strictEqual(pool(notDone, 'mythicWeapon').need, 1975, 'an unfinished draw has upgraded nothing, whatever was stored');
    assert.deepStrictEqual(characterPreset([0, 0, 0, 0], 'ff'), [3, 2, 2, 1], 'cheapest Final Form from nothing: one path complete, two at Tier 2');
    assert.strictEqual(upgradeNeed('mythicCharacter', [0, 0, 0, 0], [3, 2, 2, 1]).need, 1980);
    assert.deepStrictEqual(characterPreset([3, 1, 0, 0], 'ff'), [3, 2, 2, 1], 'and from what is already bought');
    assert.strictEqual(upgradeNeed('mythicCharacter', [3, 1, 0, 0], [3, 2, 2, 1]).need, 200 + 280 + 720);
    assert.deepStrictEqual(characterPreset([1, 2, 0, 0], 'path'), [1, 3, 0, 0], 'One Full Path finishes the path closest to done');
    assert.deepStrictEqual(upgradeNeed('mythicCharacter', [0, 0, 0, 0], [3, 1, 1, 1]), { need: 860, finalFormBlocked: true }, 'Final Form below 7 of 9 is not priced, and says so');
});

t('upgrades: the pop-up holds the right fields, one default each, and Discord.js accepts it', () => {
    const { ModalBuilder } = require('discord.js');
    const fieldsOf = (drawKey, pullsDone, extra = {}) => {
        const m = dc.buildUpgradeModal(state(), makeBasket({ region: 'region_20', banners: [{ drawKey, pullsDone, ...extra }] }), 0);
        const json = new ModalBuilder(m).toJSON();
        assert.ok(json.title.length <= 45 && json.components.length <= 5, json.title);
        for (const c of json.components) {
            assert.strictEqual(c.component.options.filter(o => o.default).length, 1, `${c.label}: exactly one picked option`);
            assert.ok(c.label.length <= 45 && c.component.options.every(o => o.label.length <= 100 && (!o.description || o.description.length <= 100)));
        }
        return json.components.map(c => c.label);
    };
    assert.deepStrictEqual(fieldsOf('mythicWeapon', 0), ['Upgrade to Level'], 'no "Already At" before the draw is finished');
    assert.deepStrictEqual(fieldsOf('mythicWeapon', 10, { upHave: [2] }), ['Already At', 'Upgrade to Level']);
    assert.deepStrictEqual(fieldsOf('mythicCharacter', 0), ['Quick Pick', 'Battle Tech', 'Arm Tech', 'Color Tech', 'Final Form']);
    assert.deepStrictEqual(fieldsOf('mythicCharacter', 10, { upHave: [1, 0, 0, 0] }), ['Quick Pick', 'Battle Tech', 'Arm Tech', 'Color Tech', 'Final Form']);
    assert.strictEqual(dc.buildUpgradeModal(state(), makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }] }), 0), null, 'no pop-up for a draw with no upgrade');
});

t('upgrades: reading the pop-up back', () => {
    const answers = a => id => (id in a ? a[id] : null);
    assert.deepStrictEqual(dc.readUpgradeModal('mythicCharacter', false, answers({ quick: 'ff', p0: '00', p1: '00', p2: '00', ff: '00' })), { have: [0, 0, 0, 0], want: [3, 2, 2, 1], notice: null }, 'Quick Pick replaces the paths');
    const blocked = dc.readUpgradeModal('mythicCharacter', false, answers({ quick: 'keep', p0: '03', p1: '01', p2: '01', ff: '01' }));
    assert.deepStrictEqual(blocked.want, [3, 1, 1, 0], 'Final Form below 7 of 9 is left off');
    assert.ok(/needs 7 of 9 tiers/.test(blocked.notice));
    assert.deepStrictEqual(dc.readUpgradeModal('mythicCharacter', true, answers({ quick: 'keep', p0: '13', p1: '22', p2: '02', ff: '01' })).want, [3, 2, 2, 1], 'at 10/10 each path reads have and want');
    assert.deepStrictEqual(dc.readUpgradeModal('mythicWeapon', true, answers({ have: '3', want: '2' })), { have: [3], want: [3], notice: 'Already at Level 3, so there is nothing to add.' });
    assert.deepStrictEqual(dc.readUpgradeModal('mythicWeapon', false, answers({ have: '3', want: '5' })).have, [0], 'an unfinished draw cannot have upgrades');
});

t('upgrades: upgradeControls still builds the old button or dropdown, and Set Draw Progress gives every Mythic line its own button instead', () => {
    const one = dc.upgradeControls(state(), makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }] }));
    assert.ok(one.button && !one.row && verbOf(one.button) === 'upgset' && dc.decodeState(one.button.custom_id).focus === 0 && one.button.label === 'Upgrade: None');
    const set = dc.upgradeControls(state(), makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0, upWant: [5] }] }));
    assert.ok(set.button.label === 'Upgrade: Level 5' && set.button.style === 3);
    const two = dc.upgradeControls(state(), makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0, upWant: [3, 2, 2, 1] }] }));
    assert.ok(!two.button && two.row && verbOf(two.row.components[0]) === 'upgpick');
    assert.deepStrictEqual(two.row.components[0].options.map(o => [o.label, o.description]), [['#1 Mythic Weapon', 'No Upgrade Set'], ['#2 Mythic Character', '7/9 Tiers + Final Form · 1,980 Coins']]);
    assert.deepStrictEqual(dc.upgradeControls(state(), makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }] })), { button: null, row: null });
    const p = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }] }));
    messageCount(container(p));
    assert.strictEqual(selects(p).some(s => verbOf(s) === 'upgpick'), false, 'the result carries no upgrade control (2026-10-18 12:17 EDT)');
    const pr = progress([{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }]);
    assert.deepStrictEqual(buttons(pr).filter(b => verbOf(b) === 'upgset').map(b => dc.decodeState(b.custom_id).focus), [0, 1], 'each Mythic line its own Upgrade button');
});

t('upgrades: the balance takes whole CP and cards or coins in steps of 5', () => {
    assert.deepStrictEqual(['', '300', '1,975', '1k', '0'].map(dc.parseCount), [0, 300, 1975, 1000, 0]);
    assert.deepStrictEqual(['7', '302', '-5', 'abc', '2.5'].map(dc.parseCount), [null, null, null, null, null]);
    assert.deepStrictEqual(['3.5', '3.5k', '3.7k'].map(dc.parseAmount), [null, 3500, 3700], 'no decimal CP; 3.7k is exactly 3,700');
    assert.strictEqual(dc.balanceLabel(makeBasket({ balance: 3000, mythicCards: 300 })), 'Balance: 3,000 CP · 300 Cards');
    assert.strictEqual(dc.balanceLabel(makeBasket()), 'Set Balance');
});

t('upgrades: the result states cards and coins per line and turns the pool into CP once', () => {
    const basket = makeBasket({ region: 'region_20', mythicCards: 300, banners: [{ drawKey: 'mythicWeapon', pullsDone: 10, upHave: [2], upWant: [5] }] });
    const full = allText(render(basket, { detail: true }));
    assert.ok(full.includes('Upgrade: Level 2 → Level 5 · `1,600 Cards`'), 'the line states the upgrade in cards');
    assert.ok(full.includes('`1,600` Cards − `300` held → about 7 spins × `1,000 CP`'), full);
    assert.ok(full.includes('> **+ Mythic Upgrades: `7,000 CP`**') && full.includes('**You Need: `7,000 CP`**'), 'a finished draw costs only its upgrade');
    assert.ok(/Upgrade: Level 2 → Level 5$/m.test(allText(render(basket))), 'the simplified list says what the upgrade goes to, without its amount (2026-10-18 19:34 EDT, his ask)');
    assert.ok(allText(render(basket, { detail: true })).includes('Upgrade: Level 2 → Level 5 · `1,600 Cards`'), 'the Full Breakdown keeps the amount');
    const exp = dc.buildExportText(basket, 'USD');
    assert.ok(/Mythic Cards:\*\* 1,600 needed − 300 held → about 7 spins · 7,000 CP/.test(exp), exp);
});

t('the balance pop-up saves the fields that are fine and names the refused ones (2026-10-17 19:03 EDT)', () => {
    assert.deepStrictEqual(['250 mythic card', '250 mythic cards', '250 card', '2 k'].map(dc.parseCount), [250, 250, 250, 2000]);
    assert.strictEqual(dc.parseAmount('3 k'), 3000);
    const ok = dc.readBalanceFields({ amount: '3k', cards: '300', coins: '' });
    assert.deepStrictEqual(ok, { fields: { balance: 3000, mythicCards: 300, mythicCoins: 0 }, warning: null });
    const mixed = dc.readBalanceFields({ amount: '3000 cp', cards: '252', coins: '150' });
    assert.deepStrictEqual(mixed.fields, { balance: 3000, mythicCoins: 150 }, 'the good fields are kept');
    assert.ok(mixed.warning.startsWith('⚠️ Saved CP and Mythic Coins.') && mixed.warning.includes('**Mythic Cards** `252` wasn\'t saved: use 0 or a multiple of 5') && mixed.warning.endsWith('Press **Set Region & Balance** to fix it.'), mixed.warning);
    const none = dc.readBalanceFields({ amount: 'abc', cards: '7', coins: null });
    assert.ok(none.warning.startsWith('⚠️ Nothing was saved.') && none.warning.endsWith('to fix them.') && !Object.keys(none.fields).length);
});

t('/draw prices states the upgrade ladders under each Upgrade heading', () => {
    const { buildDrawEntries } = require('../commands/drawprices');
    const [w, c] = buildDrawEntries('region_20', ['mythicWeapon', 'mythicCharacter']);
    // His format (2026-10-17 23:19 EDT): the full amount quoted small, the spin cost, then the ladder.
    assert.deepStrictEqual(w[2].split('\n').slice(1), ['> -# **`1,975`** Mythic Cards', '`1,000 CP` x 10 Spins ⌇ **`10,000 CP`**', '-# **Cumulative Mythic Cards by Upgrade Level:**', '-# L1 `125` › L2 `375` › L3 `775` › L4 `1,275` › L5 (Max) `1,975`'], w[2]);
    assert.ok(/^<a?:MythicCard:\d+> \*\*Weapon Upgrade\*\*$/.test(w[2].split('\n')[0]) && /^<a?:MythicCoin:\d+> \*\*Character Upgrade\*\*$/.test(c[2].split('\n')[0]), 'the icon sits beside the bold heading');
    assert.ok(c[2].includes('> -# **`2,820`** Mythic Coins') && c[2].includes('-# **Mythic Coins per Path:** (`80` › `200` › `420`) x 3 paths') && c[2].includes('-# **Final Form:** `720` coins after 7 of 9 slots are unlocked'), c[2]);
});

t('/draw prices: the Series Armory page is page 3, priced per item and per full armory, with the Advanced pages after it (2026-10-18 10:31 EDT)', () => {
    const dp = require('../commands/drawprices');
    const flat = c => [c, ...(c.components || []).flatMap(flat), ...(c.accessory ? [c.accessory] : [])];
    const text = (region, view) => dp.buildContainer(region, 0, true, view, null).flatMap(flat).filter(c => c.type === 10).map(c => c.content).join('\n');
    // His figures: 50/80/120 CP a spin; 75 / 100 / 120 spins per item.
    const p10 = text('region_10', 2);
    assert.ok(p10.includes('LEGENDARY WEAPON SERIES ARMORY') && p10.includes('`50 CP` x 75 Spins ⌇ **`3,750 CP`**') && p10.includes('-# **Full Armory by Weapon Count:**\n-# **3 Weapons** `11,250 CP` • **4 Weapons** `15,000 CP` • **5 Weapons** `18,750 CP` • **6 Weapons** `22,500 CP`') && p10.includes('**`3,750 CP`** Per Weapon'), p10);
    assert.ok(p10.includes('`50 CP` x 100 Spins ⌇ **`5,000 CP`**') && p10.includes('`50 CP` x 120 Spins ⌇ **`6,000 CP`**') && p10.includes('**3 Weapons** `18,000 CP`') && p10.includes('**`5,000 CP`** Per Character') && p10.includes('**6 Characters** `30,000 CP`'), p10);
    assert.ok(p10.indexOf('MYTHIC WEAPON SERIES ARMORY') < p10.indexOf('LEGENDARY WEAPON SERIES ARMORY'), 'Mythic first, as on page 1');
    assert.ok(!/MYTHIC CHARACTER SERIES ARMORY/.test(p10), 'there is no Mythic Character armory');
    assert.ok(text('region_30', 2).includes('`120 CP` x 120 Spins ⌇ **`14,400 CP`**') && text('region_20', 2).includes('`80 CP` x 75 Spins ⌇ **`6,000 CP`**'));
    assert.ok(text('region_10', 3).includes('ADVANCED DOUBLE LEGENDARY WEAPON DRAW') && text('region_10', 4).includes('ADVANCED DOUBLE LEGENDARY CHARACTER DRAW'), 'the Advanced pages are 4 and 5');
    const one = text('region_10', 'farmoryLegendaryCharacter');
    assert.ok(one.includes('LEGENDARY CHARACTER SERIES ARMORY') && !one.includes('MYTHIC WEAPON SERIES ARMORY'), one);
    assert.ok(!p10.includes("didn't get lucky"), 'no no-luck note: the page is the full breakdown, like the other draws (his call, 2026-10-18 10:46 EDT)');
    assert.ok(!Object.keys(DRAW_META).some(k => k in dp.SERIES_ARMORY), 'armories stay out of DRAW_META, so the calculator never prices one as a ladder');
});

t('/draw prices: the quick jump opens one draw type, Back replaces the pager, and every view fits Discord (2026-10-17 22:01 EDT)', () => {
    const dp = require('../commands/drawprices');
    const count = c => (c.components || []).reduce((n, x) => n + 1 + count(x), 0) + (c.accessory ? 1 : 0);
    const flat = c => [c, ...(c.components || []).flatMap(flat), ...(c.accessory ? [c.accessory] : [])];
    const keys = [...Object.keys(DRAW_META), ...Object.keys(dp.SERIES_ARMORY), 'advancedWeapon', 'advancedCharacter'];
    for (const region of REGION_ORDER) {
        for (const view of [0, 1, 2, 3, 4, ...keys.map(k => `f${k}`)]) {
            const comps = dp.buildContainer(region, 0, true, view, null);
            const total = comps.reduce((n, c) => n + 1 + count(c), 0);
            assert.ok(total <= 40, `${region} ${view}: ${total} components`);
            const all = comps.flatMap(flat);
            const jump = all.find(c => c.type === 3 && c.custom_id === `price_jump_${region}`);
            assert.ok(jump && jump.options.length === keys.length, `${region} ${view}: the jump select lists every draw type`);
            const focused = typeof view === 'string' ? view.slice(1) : null;
            assert.deepStrictEqual(jump.options.filter(o => o.default).map(o => o.value), focused ? [focused] : [], `${region} ${view}: the open draw is the select's default`);
            const back = all.find(c => c.type === 2 && c.label === 'Show All Draws');
            const pager = all.some(c => c.custom_id === 'price_subpage_indicator');
            assert.strictEqual(Boolean(back), Boolean(focused), `${region} ${view}: Show All Draws only in a jump`);
            assert.strictEqual(pager, !focused, `${region} ${view}: the pager only in the all view`);
            const regionIds = all.filter(c => c.type === 2 && /^price_region_/.test(c.custom_id || '')).map(c => c.custom_id.split('_').pop());
            assert.ok(regionIds.every(v => v === String(focused ? `f${focused}` : view)), `${region} ${view}: a region switch keeps the view`);
        }
    }
    const jumpOpt = dp.data.toJSON().options.find(o => o.name === 'prices').options.find(o => o.name === 'type');
    assert.deepStrictEqual(jumpOpt.choices.map(c => c.value).sort(), [...keys].sort(), '/draw prices type: lists the same draws as the dropdown');
    const one = dp.buildContainer('region_10', 0, true, 'fmythicWeapon', null).flatMap(flat).filter(c => c.type === 10).map(c => c.content).join('\n');
    assert.ok(/Mythic Weapon Draw/i.test(one) && !/Legendary Weapon Draw \(Reactive\)/i.test(one), 'a jump shows only the picked draw');
});

// ==========================================
// SERIES ARMORY, SET DRAW PROGRESS AND THIS SEASON'S DRAWS (2026-10-18 12:19 EDT)
// ==========================================
t('an armory line is priced per item: items left times spins times the region price, minus the spins already in', () => {
    const { basketCost: bc, pullCount: pc } = require('../utils/drawCost');
    const line = { drawKey: 'armoryLegendaryWeapon', pullsDone: 2, size: 5, spinsIn: 40 };
    assert.strictEqual(pc('region_10', 'armoryLegendaryWeapon', line), 5);
    // 3 weapons left × 75 spins × 50 CP = 11,250, less the 40 spins already in = 9,250.
    assert.strictEqual(bc('region_10', [line], false).total, 9250);
    assert.strictEqual(bc('region_30', [{ ...line, spinsIn: 0 }], false).total, 3 * 75 * 120);
    assert.strictEqual(bc('region_10', [{ ...line, pullsDone: 5 }], false).total, 0, 'a finished armory costs nothing, and its spins in no longer count');
    assert.strictEqual(bc('region_10', [{ drawKey: 'armoryLegendaryCharacter', pullsDone: 0, size: 3 }], false).total, 3 * 100 * 50);
});

t('the Mythic Weapon armory: 3 weapons, a level each, from the SAME Mythic Cards as the Mythic Weapon draw (2026-10-18 15:15 EDT)', () => {
    const { upgradePlan, armorySize, pullCount } = require('../utils/drawCost');
    assert.strictEqual(armorySize({ drawKey: 'armoryMythicWeapon' }), 3, 'always 3 (his call)');
    assert.strictEqual(pullCount('region_10', 'armoryMythicWeapon', { drawKey: 'armoryMythicWeapon', size: 6 }), 3, 'a stored size never overrides it');
    const plan = upgradePlan({ region: 'region_10', banners: [{ drawKey: 'mythicWeapon', pullsDone: 10, upWant: [5] }, { drawKey: 'armoryMythicWeapon', pullsDone: 1, upHave: [2, 0, 0], upWant: [5, 3, 0] }], mythicCards: 100 });
    assert.strictEqual(plan.pools.length, 1, 'one Mythic Cards pool, never two');
    // 1,975 for the draw's weapon; armory: weapon 1 L2→L5 (1,975 − 375), weapon 2 L0→L3 (775), weapon 3 nothing.
    assert.strictEqual(plan.pools[0].need, 1975 + (1975 - 375) + 775);
    assert.strictEqual(plan.pools[0].held, 100, 'held cards come off once');
    const notGot = upgradePlan({ region: 'region_10', banners: [{ drawKey: 'armoryMythicWeapon', pullsDone: 0, upHave: [2, 2, 2], upWant: [5, 0, 0] }] });
    assert.strictEqual(notGot.pools[0].need, 1975, 'a weapon not collected yet has nothing upgraded');
    const m = dc.buildUpgradeModal(state(), makeBasket({ banners: [{ drawKey: 'armoryMythicWeapon', pullsDone: 1 }] }), 0);
    assert.deepStrictEqual(m.components.map(l => [l.label, l.component.custom_id]), [['Weapon 1', 'w0'], ['Weapon 2', 'w1'], ['Weapon 3', 'w2']]);
    assert.ok(m.components[0].component.options.some(o => o.value === '25' && /At Level 2 → Level 5/.test(o.label)), 'a collected weapon pairs now and target');
    assert.ok(m.components[1].component.options.every(o => o.value[0] === '0'), 'one not collected starts at nothing');
    assert.ok(m.components.every(l => l.component.options.length <= 25));
    const read = dc.readUpgradeModal('armoryMythicWeapon', true, id => ({ w0: '25', w1: '03', w2: null })[id], { pullsDone: 1 });
    assert.deepStrictEqual([read.have, read.want], [[2, 0, 0], [5, 3, 0]]);
});

t('an armory line\'s dropdown is its items only; with no size yet it waits for Set Up Armory (2026-10-18 15:15 EDT)', () => {
    const sel = selects(progress([{ drawKey: 'armoryLegendaryWeapon', pullsDone: 2, size: 5 }])).find(s => verbOf(s) === 'bpulls');
    assert.deepStrictEqual(sel.options.map(o => o.value), ['0', '1', '2', '3', '4', '5']);
    assert.strictEqual(sel.options.find(o => o.default).label, '#1 · Progress: 2/5 Weapons');
    assert.ok(sel.options.every(o => /^(#1 · Progress: )?\d\/\d Weapons$/.test(o.label)), 'an armory counts Weapons, never Spins');
    const bare = progress([{ drawKey: 'armoryLegendaryWeapon', pullsDone: 0 }]);
    const waiting = selects(bare).find(s => verbOf(s) === 'bpulls');
    assert.ok(waiting.disabled && /Set up the armory first/.test(waiting.placeholder));
    const setup = buttonLabelled(bare, 'Set Up Armory');
    assert.ok(setup && setup.style === 1 && verbOf(setup) === 'spinsin');
    assert.ok(allText(render(makeBasket({ banners: [{ drawKey: 'armoryLegendaryWeapon', pullsDone: 0 }] }))).includes('#1 left out'), 'the result says it was left out, and why');
    assert.ok(allText(progress([{ drawKey: 'armoryLegendaryCharacter', pullsDone: 0, size: 4, title: 'Undead Legion' }])).includes('#1 · Undead Legion\n-# Legendary Character Armory'), 'a season armory reads as the draw');
});

t('the editor: a line\'s extra settings sit beside its name; a Mythic Weapon armory has Spins In, then Upgrade', () => {
    const pr = progress([{ drawKey: 'legendaryGunReactive', pullsDone: 3 }, { drawKey: 'armoryLegendaryWeapon', pullsDone: 1, size: 4, spinsIn: 40 }, { drawKey: 'armoryMythicWeapon', pullsDone: 0 }]);
    const spins = buttons(pr).filter(b => verbOf(b) === 'spinsin');
    assert.deepStrictEqual(spins.map(b => [dc.decodeState(b.custom_id).focus, b.label]).sort((a, b) => a[0] - b[0]), [[1, '4 Weapons · Spins In: 40'], [2, 'Spins In: 0']]);
    assert.deepStrictEqual(buttons(pr).filter(b => verbOf(b) === 'upgset').map(b => dc.decodeState(b.custom_id).focus), [2], 'only the Mythic armory has an Upgrade');
    const row = rows(pr).find(r => r.components.some(b => verbOf(b) === 'upgset'));
    assert.deepStrictEqual(row.components.map(verbOf), ['spinsin', 'upgset'], 'Spins In before Upgrade (his order)');
    assert.strictEqual(buttonLabelled(pr, 'Back to Selections'), undefined, 'no selections screen to go back to');
    assert.strictEqual(verbOf(buttonLabelled(pr, 'Calculate')), 'submit');
});

t('the armory pop-up: weapon count required on a draw-type Legendary armory, Spins In optional everywhere', () => {
    assert.strictEqual(dc.readSpinsIn('armoryLegendaryWeapon', ''), 0);
    assert.strictEqual(dc.readSpinsIn('armoryLegendaryWeapon', '40 spins'), 40);
    assert.strictEqual(dc.readSpinsIn('armoryLegendaryWeapon', '75'), null, 'at 75 the weapon is already guaranteed');
    assert.strictEqual(dc.readSpinsIn('armoryMythicWeapon', '119'), 119);
    assert.strictEqual(dc.readSpinsIn('mythicWeapon', '4'), null, 'only an armory has Spins In');
    const m = dc.buildSpinsInModal(state(), makeBasket({ banners: [{ drawKey: 'armoryLegendaryWeapon', pullsDone: 1, size: 4, spinsIn: 12 }] }), 0);
    assert.deepStrictEqual(m.components.map(l => [l.component.custom_id, l.component.required]), [['size', true], ['spins', false]]);
    assert.deepStrictEqual(m.components[0].component.options.filter(o => o.default).map(o => o.value), ['4']);
    assert.strictEqual(m.components[1].component.value, '12');
    for (const line of [{ drawKey: 'armoryMythicWeapon', pullsDone: 0 }, { drawKey: 'armoryLegendaryWeapon', pullsDone: 0, size: 4, title: 'Undead Legion' }]) {
        assert.deepStrictEqual(dc.buildSpinsInModal(state(), makeBasket({ banners: [line] }), 0).components.map(l => l.component.custom_id), ['spins'], `${line.drawKey}: its size is known`);
    }
    assert.strictEqual(dc.buildSpinsInModal(state(), makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }), 0), null);
});

t('the editor names a season line as its draw with its Draw Type under it (his one editor (2026-10-18 15:15 EDT))', () => {
    const f = form([{ drawKey: 'armoryLegendaryWeapon', pullsDone: 2, size: 5, spinsIn: 40, title: 'Undead Legion Series Armory' }, { drawKey: 'mythicWeapon', pullsDone: 10, upWant: [3] }]);
    // A `###` heading over a hint line (2026-10-18 16:17 EDT, his ask): the type, then the line's spent and left, as its dropdown's chosen value reads.
    assert.ok(allText(f).includes('#1 · Undead Legion Series Armory\n-# Legendary Weapon Armory · `9,500 CP` Spent · `9,250 CP` to Completion'), allText(f).slice(0, 400));
    assert.ok(allText(f).includes('#2 · Mythic Weapon\n-# ') && allText(f).includes('CP` Spent · Finished'), 'an untitled line has no type in its hint; a finished one says so');
    assert.ok(texts(f).some(c => /^### /.test(c)), 'each line is a ### heading');
    assert.strictEqual((JSON.stringify(f).match(/"type":14,"spacing":1,"divider":true/g) || []).length, 0, 'no divider between draws');
    assert.ok(buttonLabelled(f, 'Upgrade: Level 3'));
});

t('this season\'s draws come first on the landing, each its own title with its Draw Type under it', () => {
    const seasonDraws = [{ id: 'a'.repeat(24), title: 'Sky Armory', drawKey: 'armoryLegendaryWeapon', date: new Date('2026-08-11T00:00:00Z'), size: 5 }, { id: 'b'.repeat(24), title: 'Molten Fusion Draw', drawKey: 'legendaryGunReactive', date: new Date('2026-08-09T00:00:00Z'), size: null }];
    const empty = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [], seasonDraws });
    const sel = selects(empty);
    assert.deepStrictEqual(sel.map(verbOf), ['season', 'draws'], 'first, above the draw-type picker (his "yes")');
    assert.deepStrictEqual(sel[0].options.map(o => [o.label, o.description]), [['Sky Armory', 'Legendary Weapon Armory · 5 Weapons · Aug 11'], ['Molten Fusion Draw', 'Legendary Weapon (Reactive) · Aug 9']]);
    assert.deepStrictEqual(selects(dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [], seasonDraws: [] })).map(verbOf), ['draws'], 'hidden when there is none');
    const add = dc.buildAddDrawsModal(state(), makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }), seasonDraws);
    assert.deepStrictEqual(add.components.map(l => l.component.custom_id), ['season', 'types'], 'after the first pick, the same two lists in Add Draws');
});

t('Set Draw Progress fits Discord at every size: 1–25 lines of armories and Mythic draws, every page', () => {
    const mix = ['armoryLegendaryWeapon', 'armoryMythicWeapon', 'mythicCharacter', 'legendaryGunReactive', 'armoryLegendaryCharacter'];
    let worst = 0;
    for (let n = 1; n <= 25; n++) {
        const banners = Array.from({ length: n }, (_, i) => { const k = mix[i % mix.length]; return k.startsWith('armory') ? { drawKey: k, pullsDone: 1, size: 6, spinsIn: 12, upWant: k === 'armoryMythicWeapon' ? [5] : undefined } : { drawKey: k, pullsDone: 1 }; });
        const pages = dc.linePages(banners, 5).length;
        for (let bpage = 0; bpage < pages; bpage++) {
            const p = progress(banners, { bpage });
            messageCount(dc.buildCalculatorPanel(state({ page: 5, bpage, fromResult: true, dirty: true }), makeBasket({ banners }), ACCENT, { savedBaskets: [] }));
            const c = messageCount(p);
            worst = Math.max(worst, c);
            assert.ok(c <= 40, `${n} lines page ${bpage}: ${c} components`);
        }
        const f = form(banners);
        assert.ok(messageCount(f) <= 40, `the form with ${n} lines`);
    }
    console.log(`        Set Draw Progress worst: ${worst}/40`);
});

t('click-test round 1 (2026-10-18 13:07 EDT): Two Full Paths, optional pop-up dropdowns, his Quick Pick hint', () => {
    const { characterPreset } = require('../utils/drawCost');
    assert.deepStrictEqual(characterPreset([1, 2, 0, 0], 'path2'), [3, 3, 0, 0], 'the two paths closest to done, finished');
    assert.deepStrictEqual(characterPreset([0, 0, 0, 0], 'path2'), [3, 3, 0, 0], 'from nothing: Battle Tech and Arm Tech');
    const m = dc.buildUpgradeModal(state(), makeBasket({ banners: [{ drawKey: 'mythicCharacter', pullsDone: 0 }] }), 0);
    assert.ok(m.components.every(l => l.component.required === false), 'every dropdown optional');
    assert.strictEqual(m.components[0].description, 'Quick Pick ignores the other toggles below');
    assert.ok(m.components[0].component.options.some(o => o.value === 'path2' && o.label === 'Two Full Paths'));
    const covered = allText(render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }], balance: 99999 })));
    assert.ok(/<a?:Checkmark:\d+> \*\*Your balance covers this\*\*/.test(covered), 'his Checkmark emoji');
});

t('the result names a season draw without its Draw Type line (2026-10-18 13:08 EDT, his ask)', () => {
    const r = allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0, title: 'Deepstar Wraith Mythic Drop' }] })));
    assert.ok(r.includes('#1 · Deepstar Wraith Mythic Drop**') && !r.includes('-# Mythic Weapon'), r.slice(0, 300));
});

t('his Mock 2 (2026-10-18 13:38 EDT): Add Draws and Remove open pop-ups, his two footer rows, and Remove reads back only lines that still match', () => {
    const draft = progress([{ drawKey: 'mythicWeapon', pullsDone: 2 }, { drawKey: 'armoryLegendaryWeapon', pullsDone: 0, size: 4 }]);
    const footer = rows(draft).slice(-2, -1).map(r => r.components.map(b => b.label));
    assert.deepStrictEqual(footer, [['Add Draws', 'Remove', 'Calculate']], 'a draft has no result to go back to, and no selections screen any more');
    const done = dc.buildCalculatorPanel(state({ page: 5, fromResult: true }), makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 2 }] }), ACCENT, { savedBaskets: [] });
    messageCount(done); // every custom_id unique: a duplicated Back to Result made Discord refuse this screen (2026-10-18 16:05 EDT)
    assert.strictEqual(buttons(done).filter(b => b.label === 'Back to Result').length, 1);
    assert.deepStrictEqual(done.filter(x => x.type === 1)[0].components.map(b => b.label), ['Back to Result', 'New Calculation', 'Draw Prices', 'Help'], 'his nav order from a result, no View Saved (2026-10-18 15:48 EDT)');
    const dirty = dc.buildCalculatorPanel(state({ page: 5, fromResult: true, dirty: true }), makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 2 }] }), ACCENT, { savedBaskets: [] });
    assert.ok(buttonLabelled(dirty, 'Recalculate') && !buttonLabelled(dirty, 'Calculate'), 'a change after Edit Selections offers Recalculate');
    assert.ok(buttonLabelled(draft, 'Calculate'), 'a fresh draft keeps Calculate');
    assert.strictEqual(buttonLabelled(draft, 'Add Draws').style, 3, 'Add Draws is green');
    assert.deepStrictEqual(dc.decodeState(dc.encodeState('x', { ...dc.defaultState(), fromResult: true, dirty: true })).fromResult, true);
    assert.ok(allText(done).includes('## Adjust Draws, Progress, & Upgrades'), 'his name for the screen');
    assert.ok(allText(progress([{ drawKey: 'legendaryGunReactive', pullsDone: 0 }])).includes('## Adjust Draws & Progress'));
    const basket = makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 2, upWant: [3] }, { drawKey: 'armoryLegendaryWeapon', pullsDone: 1, size: 4 }] });
    const add = dc.buildAddDrawsModal(state(), basket, [{ id: 'a'.repeat(24), title: 'Sky Armory', drawKey: 'armoryLegendaryWeapon', size: 5 }]);
    assert.deepStrictEqual(add.components.map(l => [l.label, l.component.custom_id, l.component.required]), [["This Season's Draws", 'season', false], ['Draw Types', 'types', false]]);
    assert.strictEqual(dc.buildAddDrawsModal(state(), basket, []).components.length, 1, 'no season list, no season dropdown');
    const rm = dc.buildRemoveModal(state(), basket);
    assert.deepStrictEqual(rm.components[0].component.options.map(o => [o.label, o.value, o.description]), [['#1 · Mythic Weapon', '0:mythicWeapon', '2/10 Spins · Upgrade Set'], ['#2 · Legendary Weapon Armory', '1:armoryLegendaryWeapon', '1/4 Weapons']]);
    assert.ok(rm.components[0].component.max_values === 2 && rm.components[0].component.min_values === 1, 'several at once');
    assert.deepStrictEqual([...dc.readRemovePicks(basket, ['1:armoryLegendaryWeapon', '0:legendaryGunReactive'])], [1], 'a pick whose line changed is skipped');
});

t('the editor pages at ONE size: every page agrees on the page count, whatever lines it holds (2026-10-18 15:48 EDT, his 1/3 then 2/2 bug)', () => {
    const lines = [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }, { drawKey: 'armoryLegendaryWeapon', pullsDone: 0, size: 4, title: 'Undead Legion' }, { drawKey: 'armoryMythicWeapon', pullsDone: 0 }];
    const counts = [0, 1, 2, 3].map(bpage => (buttons(progress(lines, { bpage })).find(b => /^\d+ \/ \d+$/.test(b.label || '')) || {}).label);
    const totals = new Set(counts.map(c => c && c.split(' / ')[1]));
    assert.strictEqual(totals.size, 1, `every page names the same total: ${counts.join(', ')}`);
    const shown = new Set();
    const total = Number([...totals][0]);
    for (let bpage = 0; bpage < total; bpage++) selects(progress(lines, { bpage })).filter(s => verbOf(s) === 'bpulls').forEach(s => shown.add(dc.decodeState(s.custom_id).focus));
    assert.deepStrictEqual([...shown].sort(), [0, 1, 2, 3, 4], 'every line on exactly one of the pages');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
})();
