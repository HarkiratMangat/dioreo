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

// buildCalculatorPanel returns the message's TOP-LEVEL list (Container + sibling nav row); buildSetupPanel still returns a bare Container. Both shapes go through here.
const container = p => (Array.isArray(p) ? p.find(x => x && x.type === 17) : p);
const siblingRows = p => (Array.isArray(p) ? p.filter(x => x && x.type === 1) : []);
const texts = panel => container(panel).components.filter(c => c.type === 10).map(c => c.content);
const allText = panel => texts(panel).join('\n');
const rows = panel => [...container(panel).components.filter(c => c.type === 1), ...siblingRows(panel)];
const buttons = panel => rows(panel).flatMap(r => r.components).filter(c => c.type === 2);
const selects = panel => rows(panel).flatMap(r => r.components).filter(c => c.type === 3);
const buttonLabelled = (panel, label) => buttons(panel).find(b => b.label === label);

function makeBasket(overrides = {}) {
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
    const panel = dc.buildSetupPanel(state(), null, [], ACCENT, { region: 'region_10' });
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
    const basketListText = texts(panel).find(c => c.startsWith('## YOUR DRAWS'));
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
    assert.ok(bpullsSelects[0].placeholder.startsWith('#1 '));
    assert.ok(bpullsSelects[1].placeholder.startsWith('#2 '));
    assert.ok(bpullsSelects[0].options.every(o => o.label.startsWith('#1 ')), 'every OPTION (not just the placeholder) must carry its banner number');
    // A closed select shows only the chosen option's label, so the label must also name the draw -- two lines of different draws read "#1 — Not started" / "#2 — Not started" before (2026-10-13 click-test).
    assert.ok(bpullsSelects[0].options.every(o => o.label.includes('Mythic Weapon')), 'every option must name its draw');
    assert.ok(bpullsSelects[1].options.every(o => o.label.includes('Mythic Character')), 'every option must name its draw');
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
t('New Calculation is two-step: armed shows Danger style + "click again", unarmed shows the plain button', () => {
    const basket = makeBasket();
    const plain = buttonLabelled(render(basket), 'New Calculation');
    assert.ok(plain && plain.style !== 4, 'unarmed New Calculation must not be Danger-styled');
    const armed = buttonLabelled(render(basket, { verb: 'resetarm' }), 'New Calculation — click again');
    assert.ok(armed && armed.style === 4, 'armed New Calculation must be Danger-styled and re-labelled');
});

t('Delete Calculation is two-step the same way', () => {
    const basket = makeBasket();
    const plain = buttonLabelled(render(basket), 'Save'); // unnamed basket -> button reads "Save"
    assert.ok(plain, 'an unnamed basket\'s manage row must read Save, not Rename');
    // Delete is offered on a SAVED calculation only: on an unsaved one it duplicated New Calculation (2026-10-13 click-test).
    assert.strictEqual(buttonLabelled(render(basket), 'Delete Calculation'), undefined, 'an unsaved calculation must not offer Delete');
    const named = makeBasket({ name: 'My Push' });
    assert.ok(buttonLabelled(render(named), 'Delete Calculation'), 'a saved calculation offers Delete');
    const armedDelete = buttonLabelled(render(named, { verb: 'delarm' }), 'Delete Calculation — click again');
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

t('the bottom nav row is a SIBLING of the Container, never one of its children', () => {
    for (const page of [0, 1]) {
        const panel = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }] }), { page });
        assert.ok(Array.isArray(panel), `page ${page} must return the top-level component list, not a bare Container`);
        const nav = panel.filter(x => x && x.type === 1);
        assert.strictEqual(nav.length, 1, `page ${page} must carry exactly one top-level action row (the nav)`);
        assert.ok(nav[0].components.some(b => b.label === 'Draw Info'), 'that sibling row must be the nav row');
        const inside = container(panel).components.filter(c => c.type === 1);
        assert.strictEqual(inside.some(r => r.components.some(b => b.label === 'Draw Info')), false,
            `page ${page} still renders the nav row INSIDE the Container`);
    }
});

t('no button on the nav row or the save/delete row carries an emoji', () => {
    const panel = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }] }));
    const named = ['Draw Info', 'Draw Prices', 'New Calculation', 'Help', 'Save', 'Rename', 'Delete Calculation'];
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
    const lines = dc.buildCostBlock(
        state({ detail: true }),
        makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }] }),
        'CAD', null, { compact: false }
    );
    const stockUp = lines.findIndex(l => l.startsWith('**Stock Up Method**'));
    if (stockUp !== -1) assert.strictEqual(lines[stockUp - 1], '', 'Stock Up must be separated from Cheapest by a blank line');
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

t('an unsubmitted calculation shows the FORM; pressing Calculate is what produces the breakdown', () => {
    const banners = [{ drawKey: 'mythicWeapon', pullsDone: 3 }];
    const draft = render(makeBasket({ banners, submitted: false }));
    assert.ok(/SET UP YOUR CALCULATION/.test(allText(draft)), 'a draft must render the setup form');
    assert.strictEqual(/COST BREAKDOWN/.test(allText(draft)), false, 'a draft must NOT show a cost breakdown -- that is what Calculate is for');
    assert.ok(buttonLabelled(draft, 'Calculate'), 'the form must offer Calculate');

    const done = render(makeBasket({ banners, submitted: true }));
    assert.ok(/COST BREAKDOWN/.test(allText(done)), 'a submitted calculation must show the breakdown');
    assert.strictEqual(/SET UP YOUR CALCULATION/.test(allText(done)), false, 'a submitted calculation must not fall back to the form');
});

t('Calculate is DISABLED with nothing picked, and enabled the moment a line exists', () => {
    const empty = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] });
    assert.strictEqual(buttonLabelled(empty, 'Calculate').disabled, true, 'an empty form must not be submittable');
    const drafted = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], submitted: false }));
    assert.strictEqual(Boolean(buttonLabelled(drafted, 'Calculate').disabled), false, 'one line is enough to calculate');
});

t('Set Balance and Upgrade are disabled until a calculation exists to write them to', () => {
    // Both write to a basket document. Offering them before one exists accepts input and discards it silently.
    const empty = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] });
    assert.strictEqual(buttonLabelled(empty, 'Set Balance').disabled, true);
    // With no draw there is nothing to upgrade, so the toggle is absent rather than disabled (2026-10-13).
    assert.strictEqual(buttons(empty).some(b => /^Upgrade/.test(b.label || '')), false);
    const drafted = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], submitted: false }));
    assert.strictEqual(Boolean(buttonLabelled(drafted, 'Set Balance').disabled), false);
    assert.strictEqual(Boolean(buttonLabelled(drafted, 'Upgrade: Not included').disabled), false);
});

t('the saved-calculations list and the form share ONE screen -- both present, no extra hop', () => {
    const saved = [{ _id: 'b'.repeat(24), name: 'Season 12', banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], region: 'region_10' }];
    const panel = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: saved });
    const text = allText(panel);
    assert.ok(/SAVED CALCULATIONS/.test(text), 'the saved list must be on the first screen');
    assert.ok(/SET UP YOUR CALCULATION/.test(text), 'the form must be on that SAME screen');
    assert.ok(selects(panel).some(s => s.custom_id.split('~')[1] === 'load'), 'and the loader must be usable from it');
    assert.ok(selects(panel).some(s => s.custom_id.split('~')[1] === 'draws'), 'and so must the draw picker');
});

t('the setup form offers no New Calculation button -- there is no result to clear yet', () => {
    const drafted = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], submitted: false }));
    assert.strictEqual(buttonLabelled(drafted, 'New Calculation'), undefined, 'a form must not offer to reset itself into a form');
    const done = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], submitted: true }));
    assert.ok(buttonLabelled(done, 'New Calculation'), 'a result must offer the way back to a new one');
});

t('the draw picker is a MULTI-select, so a first pick can carry several draws at once', () => {
    const panel = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] });
    const picker = selects(panel).find(s => s.custom_id.split('~')[1] === 'draws');
    assert.ok(picker.max_values > 1, 'picking three draws must be one interaction, not three');
    assert.ok(picker.options.every(o => o.description && o.description.length <= 100), 'every option must describe itself within Discord\'s limit');
    assert.ok(picker.options.some(o => /CP total/.test(o.description)), 'the picker must quote a real live price, not a bare label');
});

t('the cost breakdown LEADS with CP Needed -- the number the command exists to produce', () => {
    const panel = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }], balance: 1000 }));
    const block = texts(panel).find(c => c.startsWith('## COST BREAKDOWN'));
    const firstBullet = block.split('\n')[1];
    assert.ok(/CP Needed/.test(firstBullet), `the first line under the heading was "${firstBullet}"`);
    assert.strictEqual(/Draws in basket/.test(block), false, 'the redundant line count must be gone -- the list above already shows every line');
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
t('the picker labels fit before Discord cuts a chosen chip, and lead with what tells draws apart', () => {
    for (const [key, label] of Object.entries(dc.SHORT_NAME)) assert.ok(label.length <= 22, `${key} label "${label}" is ${label.length} characters`);
    assert.notStrictEqual(dc.shortName('legendaryGunReactive').slice(0, 12), dc.shortName('legendaryGunNonReactive').slice(0, 12), 'Reactive and Non-Reactive must differ within the first characters a chip shows');
    for (const key of Object.keys(DRAW_META)) assert.ok(dc.SHORT_NAME[key], `${key} has no short name`);
});

t('Upgrade on a Mythic at 20 CP says it is NOT included, instead of silently adding nothing', () => {
    const panel = render(makeBasket({ region: 'region_20', includeUpgrades: true, banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }));
    assert.ok(/Upgrade not included/.test(allText(panel)), 'the missing upgrade price must be named');
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

t('the upgrade toggle appears only for draws that have an upgrade', () => {
    const legendary = render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }] }));
    assert.strictEqual(buttons(legendary).some(b => /^Upgrade/.test(b.label || '')), false);
    const mythic = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }));
    assert.ok(buttons(mythic).some(b => /^Upgrade/.test(b.label || '')));
});

t('the region buttons carry a caption saying what a region is', () => {
    for (const panel of [render(makeBasket()), dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] })]) {
        assert.ok(/\*\*Region\*\* · the CP price of your first pull/.test(allText(panel)));
    }
});

t('the default view names the currency and where to change it', () => {
    const text = allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] })));
    assert.ok(/Prices in \*\*CAD\*\*/.test(text), 'compact view must name the currency (the fixture renders in CAD)');
});

t('the compact package line states the price once, the packs, and the leftover', () => {
    const block = texts(render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }] }))).find(c => c.includes('## RECOMMENDED PACKAGE'));
    const line = block.split('\n').find(l => l.startsWith('**Cheapest:**'));
    assert.ok(/left over/.test(line), `leftover missing from "${line}"`);
    assert.strictEqual((line.match(/10,800 CP/g) || []).length <= 1, true, `the pack total is repeated in "${line}"`);
});

t('a grouped ×N keeps its progress figure, and the list is headed YOUR DRAWS', () => {
    const text = allText(render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }] })));
    assert.ok(/## YOUR DRAWS/.test(text));
    assert.ok(/×2 — 0\/10/.test(text));
});

t('unticking a draw with progress asks first; applySelection keeps order and progress', () => {
    const panel = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }] }), {}, { notice: 'x', dropConfirm: { mask: 0, count: 1 } });
    const confirm = buttonLabelled(panel, 'Remove 1 line with progress');
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
        assert.ok(buttonLabelled(panel, 'Remove 8 lines with progress'), `confirm missing (submitted=${submitted})`);
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
    assert.ok(/has 7 pulls/.test(seven.notice));
    const orphan = dc.slashShortcut({ pulls: 4, balance: 500 });
    assert.strictEqual(orphan.create, null);
    assert.strictEqual(orphan.balance, 500, 'a bare balance is applied to whichever calculation opens');
    assert.ok(/needs a `draw`/.test(orphan.notice));
    assert.deepStrictEqual(dc.slashShortcut({}), { create: null, balance: null, notice: null }, 'no options: no shortcut at all');
});

t('the first screen leads with what the player gets', () => {
    const text = allText(dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] }));
    assert.ok(/See how much CP you still need, and the cheapest way to buy it/.test(text));
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
})();
