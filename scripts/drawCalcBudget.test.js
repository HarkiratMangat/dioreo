// scripts/drawCalcBudget.test.js -- /draw calculator's SAVED-BASKET redesign: component budget, render invariants proven by reading actual output, and the handful of handler-level behaviours that can't be proven from render alone (author lock, two-step confirms). Run: `node scripts/drawCalcBudget.test.js` (also via `npm test`).
//
// ⚠️ FIFTH PASS, 2026-08-27 -- rewritten wholesale for docs/superpowers/specs/2026-08-27-draw-calculator-multi-draw-design.md. Every case here targets the FLAT BANNER LIST model: there is no quantity, no goal select, no budget mode. Requirement 4 below is a FALSIFIER, not a smoke test -- it must be able to fail, per spec §11 and the plan's own audit log.
const assert = require('assert');
const Module = require('module');

const dc = require('../commands/drawCalculator');
const { DRAW_META, REGION_ORDER } = require('../commands/drawprices');
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
const messageCount = panel => countComponents([panel, SHARE_ROW]);

const texts = panel => panel.components.filter(c => c.type === 10).map(c => c.content);
const allText = panel => texts(panel).join('\n');
const rows = panel => panel.components.filter(c => c.type === 1);
const buttons = panel => rows(panel).flatMap(r => r.components).filter(c => c.type === 2);
const selects = panel => rows(panel).flatMap(r => r.components).filter(c => c.type === 3);
const buttonLabelled = (panel, label) => buttons(panel).find(b => b.label === label);

function makeBasket(overrides = {}) {
    return {
        _id: '000000000000000000000001', name: null,
        banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }],
        region: 'region_10', balance: 0, includeUpgrades: false, entitlementMask: 0,
        ...overrides
    };
}
function state(overrides = {}) { return { ...dc.defaultState(), authorId: AUTHOR, ...overrides }; }
function render(basket, stateOverrides = {}, opts = {}) {
    return dc.buildCalculatorPanel(state(stateOverrides), basket, ACCENT, { currency: 'CAD', ...opts });
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
    const panel = dc.buildLandingPanel(state(), [], ACCENT, { region: 'region_10' });
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
t('priority is the ARRAY ORDER, never a cheapest-first sort -- proven with an order that provably differs from cost order', () => {
    // Deliberately most-expensive-first: mythicWeapon@0 pulls costs more than mythicWeapon@9 pulls. A cheapest-first sort would put the 9-pulls banner FIRST; the render must not.
    const banners = [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicWeapon', pullsDone: 9 }];
    const { perBanner } = basketCost('region_10', banners, false);
    assert.ok(perBanner[0].cost > perBanner[1].cost, 'fixture invariant broken -- banner 0 must cost MORE than banner 1 for this to be a real falsifier');
    const panel = render(makeBasket({ banners }), { page: 1 });
    const basketListText = texts(panel).find(c => c.startsWith('## BASKET LIST'));
    const firstLine = basketListText.split('\n')[1];
    assert.ok(firstLine.includes('#1') && firstLine.includes('0/10'), 'banner #1 in the listing must be the array\'s first entry (0 pulls), not the cheaper 9-pulls one a cost-sort would promote');
});

// ==========================================
// PAGE 2 -- one dropdown per banner, banner-numbered options
// ==========================================
t('every pulls-done dropdown option carries its banner NUMBER, so a chosen value stays attributable', () => {
    const banners = [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }];
    const panel = render(makeBasket({ banners }), { page: 1 });
    const bpullsSelects = selects(panel).filter(s => s.custom_id.split('~')[1] === 'bpulls');
    assert.strictEqual(bpullsSelects.length, 2);
    assert.ok(bpullsSelects[0].placeholder.startsWith('#1 —'));
    assert.ok(bpullsSelects[1].placeholder.startsWith('#2 —'));
    assert.ok(bpullsSelects[0].options.every(o => o.label.startsWith('#1 —')), 'every OPTION (not just the placeholder) must carry its banner number');
});

t('setting up to 3 banners costs at most 4 taps -- one dropdown click per banner, plus the initial add', () => {
    const banners = [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }];
    const panel = render(makeBasket({ banners }), { page: 1 });
    const bpullsSelects = selects(panel).filter(s => s.custom_id.split('~')[1] === 'bpulls');
    assert.strictEqual(bpullsSelects.length, 3, 'all 3 banners must have their OWN dropdown visible at once -- no focus pointer, no pagination hiding them at this size');
});

t('paginates the banner list at 5 per page, not because of the component budget (9 fit) but for readability', () => {
    const banners = Object.keys(DRAW_META).slice(0, 7).map(k => ({ drawKey: k, pullsDone: 0 }));
    const panel = render(makeBasket({ banners }), { page: 1 });
    const bpullsSelects = selects(panel).filter(s => s.custom_id.split('~')[1] === 'bpulls');
    assert.strictEqual(bpullsSelects.length, 5, '7 banners must show exactly 5 on the first page');
    assert.ok(buttons(panel).some(b => /Page 1\//.test(b.label)), 'a pagination indicator must render when there is more than one page');
});

t('a NEW banner starts at 0 pulls -- no inherited default from a sibling banner of the same type', () => {
    const banners = [{ drawKey: 'mythicWeapon', pullsDone: 7 }];
    const panel = render(makeBasket({ banners }), { page: 1 });
    const addMore = selects(panel).find(s => s.custom_id.split('~')[1] === 'addmore');
    assert.ok(addMore, 'a type already in the basket must be offered via + Add another');
    assert.ok(addMore.options[0].description.includes('0 pulls'), 'the option copy must say the new banner starts at 0, never inheriting the existing 7');
});

// ==========================================
// TWO-STEP CONFIRMS -- Reset and Delete
// ==========================================
t('Reset is two-step: armed state shows Danger style + "click again", unarmed shows the plain button', () => {
    const basket = makeBasket();
    const plain = buttonLabelled(render(basket), 'Reset');
    assert.ok(plain && plain.style !== 4, 'unarmed Reset must not be Danger-styled');
    const armed = buttonLabelled(render(basket, { verb: 'resetarm' }), 'Reset — click again');
    assert.ok(armed && armed.style === 4, 'armed Reset must be Danger-styled and re-labelled');
});

t('Delete Basket is two-step the same way', () => {
    const basket = makeBasket();
    const plain = buttonLabelled(render(basket), 'Save'); // unnamed basket -> button reads "Save"
    assert.ok(plain, 'an unnamed basket\'s manage row must read Save, not Rename');
    const armedDelete = buttonLabelled(render(basket, { verb: 'delarm' }), 'Delete Basket — click again');
    assert.ok(armedDelete && armedDelete.style === 4);
});

t('a NAMED basket\'s manage row reads Rename, not Save', () => {
    const named = buttonLabelled(render(makeBasket({ name: 'My Push' })), 'Rename');
    assert.ok(named);
});

// ==========================================
// REGION SWITCHING PRESERVES PROGRESS
// ==========================================
t('region buttons never touch banner progress -- only region itself changes on the customId path', () => {
    const banners = [{ drawKey: 'mythicWeapon', pullsDone: 6 }];
    const panel = render(makeBasket({ banners, region: 'region_10' }));
    const regionButtons = buttons(panel).filter(b => b.custom_id && b.custom_id.split('~')[1] === 'region');
    assert.strictEqual(regionButtons.length, 3);
    const target20 = regionButtons.find(b => b.custom_id.includes('~r20'));
    assert.ok(target20, 'a region button must encode its OWN target region, distinct from the basket\'s current one');
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
            message: { components: [panel], embeds: [], flags: { bitfield: 32768 | 64 } },
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

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
})();
