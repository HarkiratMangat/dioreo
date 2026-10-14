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
const messageCount = panel => { assertUniqueIds(panel); assertSize(panel); return countComponents([panel, SHARE_ROW]); };

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
// The FORM for a draft with these lines: every input lives here since the redesign (Edit Draws is gone).
function form(banners, stateOverrides = {}, opts = {}) {
    return dc.buildCalculatorPanel(state(stateOverrides), makeBasket({ submitted: false, banners, ...(opts.basket || {}) }), ACCENT, { savedBaskets: opts.saved || [] });
}
const verbOf = c => dc.decodeState(c.custom_id).verb;

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
    const first = selects(form(banners)).find(s => verbOf(s) === 'bpulls' && dc.decodeState(s.custom_id).focus === 0);
    assert.strictEqual(first.options.find(o => o.default).value, '0', 'line #1 must be the array\'s first entry (0 pulls), not the cheaper 9-pulls one a cost-sort would promote');
    const detail = allText(render(makeBasket({ banners }), { detail: true }));
    assert.ok(detail.indexOf('Mythic Weapon — 0/10 Spins') < detail.indexOf('Mythic Weapon — 9/10 Spins'), 'Cost Per Draw keeps the array order too');
    assert.strictEqual(/Priority Plan|Move Up/.test(detail), false, 'the Priority Plan and Move Up are gone (2026-10-14, his call)');
});

// ==========================================
// PAGE 2 -- one dropdown per banner, banner-numbered options
// ==========================================
t('every pulls-done dropdown option carries its line NUMBER and its draw, so a chosen value stays attributable', () => {
    const lines = selects(form([{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }])).filter(s => verbOf(s) === 'bpulls');
    assert.strictEqual(lines.length, 2);
    assert.ok(lines[0].placeholder.startsWith('#1 ') && lines[1].placeholder.startsWith('#2 '));
    const values = s => s.options.filter(o => /^\d+$/.test(o.value));
    const chosen = s => values(s).find(o => o.default);
    assert.ok(/^#1 · 0\/10 Spins · Mythic Weapon$/.test(chosen(lines[0]).label) && /^#2 · 0\/10 Spins · Mythic Character$/.test(chosen(lines[1]).label), 'the CHOSEN value names its line, its spins FIRST, then its draw: it is the one label a closed select shows');
    assert.ok(values(lines[0]).filter(o => !o.default).every(o => /^\d+\/10 Spins$/.test(o.label)), 'the rest are just the count, not the same name eleven times');
    assert.ok(values(lines[0]).every(o => /^[\d,]+ CP Spent · ([\d,]+ CP to Completion|Finished)$/.test(o.description)), 'each value says what those spins cost and what finishing costs');
    assert.strictEqual(values(lines[0])[0].description.startsWith('0 CP Spent · '), true);
    assert.strictEqual(values(lines[0]).at(-1).description, `${values(lines[0]).at(-1).description.split(' · ')[0]} · Finished`);
    const remove = lines[0].options.find(o => o.value === 'del');
    assert.strictEqual(remove.label, 'Remove this Selection');
    assert.ok(remove.emoji && remove.emoji.name, 'Remove carries its mark as an emoji, not in the label');
});

t('setting up to 3 lines costs at most 4 taps -- one dropdown click per line, plus the initial add', () => {
    const lines = selects(form([{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'mythicCharacter', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }])).filter(s => verbOf(s) === 'bpulls');
    assert.strictEqual(lines.length, 3, 'all 3 lines must have their OWN dropdown visible at once');
});

t('the form pages at 5 lines: six measured past Discord\'s message size cap (2026-10-14 00:15 EDT)', () => {
    for (const keys of [Object.keys(DRAW_META).slice(0, 7), Array(7).fill('legendaryGunNonReactive')]) {
        const panel = form(keys.map(k => ({ drawKey: k, pullsDone: 0 })));
        assert.strictEqual(selects(panel).filter(s => verbOf(s) === 'bpulls').length, 5, keys[0]);
        assert.ok(buttons(panel).some(b => /Page 1\//.test(b.label)), 'and a pager');
    }
});

t('a NEW line starts at 0 Items -- no inherited default from a sibling line of the same draw', () => {
    const add = selects(form([{ drawKey: 'mythicWeapon', pullsDone: 7 }])).find(s => verbOf(s) === 'addmore');
    assert.ok(add, 'the form must offer + Add more draws');
    assert.ok(/^In Your Selection ×1 · Pick to Add Another$/.test(add.options[0].description), add.options[0].description);
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
t('region buttons sit on the form AND the result, encode their own target, and the current one is green and disabled', () => {
    for (const panel of [form([{ drawKey: 'mythicWeapon', pullsDone: 6 }]), render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 6 }] }))]) {
        const regionButtons = buttons(panel).filter(b => b.custom_id && verbOf(b) === 'region');
        assert.strictEqual(regionButtons.length, 3);
        assert.ok(regionButtons.find(b => b.custom_id.includes('~r20')), 'a region button must encode its OWN target region');
        const current = regionButtons.find(b => b.custom_id.includes('~r10'));
        assert.ok(current.style === 3 && current.disabled === true, 'the current region is green and disabled (2026-10-14, his ask)');
        assert.ok(regionButtons.filter(b => b !== current).every(b => b.style === 2 && !b.disabled));
    }
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
    for (const panel of [render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }] })), form([{ drawKey: 'mythicWeapon', pullsDone: 3 }])]) {
        const nav = panel.filter(x => x && x.type === 1);
        assert.strictEqual(nav.length, 1, 'exactly one top-level action row (the nav)');
        assert.deepStrictEqual(nav[0].components.map(b => b.label), ['Draw Prices', 'Saved', 'New Calculation', 'Help']);
        assert.strictEqual(container(panel).components.filter(c => c.type === 1).some(r => r.components.some(b => b.label === 'Help')), false, 'the nav must not render inside the Container');
    }
});

t('no button on the nav row or the save/delete row carries an emoji', () => {
    const panel = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }] }));
    const named = ['Draw Info', 'Draw Prices', 'Saved', 'New Calculation', 'Help', 'Save', 'Rename', 'Delete Calculation'];
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
    const stockUp = lines.findIndex(l => l.startsWith('**Stock Up:**'));
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
    const draft = form(banners);
    assert.ok(/## Your Selection\n### Set Current Attempts/.test(allText(draft)), 'a draft renders the form');
    assert.strictEqual(/Cost Breakdown/.test(allText(draft)), false, 'a draft must NOT show a cost breakdown');
    assert.ok(buttonLabelled(draft, 'Calculate'), 'the form must offer Calculate');
    const done = render(makeBasket({ banners, submitted: true }));
    assert.ok(/## Cost Breakdown/.test(allText(done)), 'a submitted calculation shows the breakdown');
    assert.strictEqual(/Set Current Attempts/.test(allText(done)) || Boolean(buttonLabelled(done, 'Calculate')), false, 'and not the form');
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
    assert.strictEqual(Boolean(buttonLabelled(drafted, 'Upgrade: NO').disabled), false);
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

t('the Saved view opens a calculation, deletes several, or deletes all, and Back replaces Saved in the nav', () => {
    const panel = savedView(savedList(3));
    const open = selects(panel).find(s => verbOf(s) === 'load');
    assert.ok(open && open.options.length === 3 && /Reopen a saved calculation \(3\)/.test(open.placeholder));
    assert.ok(allText(panel).includes('## Saved Calculations\n-# Reopen a saved calculation.'), 'his wording for the hint');
    const del = selects(panel).find(s => verbOf(s) === 'savedsel');
    assert.ok(del && del.max_values === 3 && del.min_values === 1);
    assert.strictEqual(verbOf(buttonLabelled(panel, 'Delete All')), 'delallarm', 'Delete All is two-step');
    const armed = buttonLabelled(savedView(savedList(3), { verb: 'delallarm' }), 'Delete All (3) — click again');
    assert.ok(armed && armed.style === 4 && verbOf(armed) === 'delall');
    const nav = panel.filter(x => x && x.type === 1)[0].components.map(b => b.label);
    assert.deepStrictEqual(nav, ['Draw Prices', '◀ Back', 'Help']);
    assert.ok(/3\/25 saved/.test(allText(panel)), 'the limit is stated');
});

t('each saved calculation says what it is: what it still costs, its region, its draws, and Draft when never calculated', () => {
    const list = savedList(2);
    const options = selects(savedView(list)).find(s => verbOf(s) === 'load').options;
    assert.ok(/^[\d,]+ CP Needed · 10 CP · Mythic Weapon/.test(options[0].description), options[0].description);
    assert.ok(/^Draft · [\d,]+ CP Needed · 10 CP · /.test(options[1].description), options[1].description);
    assert.ok(options.every(o => o.description.length <= 100 && o.emoji), 'within Discord\'s 100, with a tier icon');
    assert.strictEqual(dc.savedDescription({ banners: [], region: 'region_10' }), 'Empty');
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

t('a saved calculation\'s name sits on its own line under the title, everywhere it is open', () => {
    const named = makeBasket({ name: 'Season `12` push', banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] });
    for (const panel of [render(named), render(named, { page: 2 })]) {
        assert.ok(texts(panel)[0].endsWith("\n> ### Viewing Saved: `Season '12' push`"), texts(panel)[0]);
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
    assert.ok(/^10 Items · [\d,]+ CP Total · \+ [\d,]+ CP Upgrade$/.test(mythic), mythic);
    assert.ok(picker.options.every(o => !o.description.includes(o.label) && !/Draw/.test(o.description)), 'a description never repeats the draw\'s name');
});

t('the cost breakdown LEADS with CP Needed -- the number the command exists to produce', () => {
    const block = texts(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }], balance: 1000 }))).find(c => c.startsWith('## Cost Breakdown'));
    assert.ok(/CP Needed/.test(block.split('\n')[1]), `the first line under the heading was "${block.split('\n')[1]}"`);
    assert.strictEqual(/Balance:|Region:/.test(block), false, 'no Balance/Region line: the button and the toggle already show both (2026-10-14, his ask)');
    assert.ok(/Still to Buy: \*\*`[\d,]+ CP`\*\* after your balance/.test(block), 'what the balance changes is the one figure that stays');
    assert.strictEqual(/Still to Buy/.test(allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 3 }] })))), false, 'and only when a balance is set');
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
        const bad = strings(p).filter(x => /(?<!Per )\bDraw\b(?! Prices| Calculator)/.test(x)); // the title, the Draw Prices button and the Cost Per Draw heading are names, not a draw
        assert.deepStrictEqual(bad, [], 'a full "... Draw" name crept back in');
    }
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

t('the upgrade toggle is on the form AND the result, and only for draws that have an upgrade', () => {
    assert.strictEqual(buttons(form([{ drawKey: 'legendaryGunReactive', pullsDone: 0 }])).some(b => /^Upgrade/.test(b.label || '')), false);
    assert.ok(buttons(form([{ drawKey: 'mythicWeapon', pullsDone: 0 }])).some(b => /^Upgrade/.test(b.label || '')));
    assert.ok(buttons(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }))).some(b => /^Upgrade/.test(b.label || '')), 'the result re-prices with it too (2026-10-14, his ask)');
    assert.strictEqual(buttons(render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }] }))).some(b => /^Upgrade/.test(b.label || '')), false);
    const step2 = rows(form([{ drawKey: 'mythicWeapon', pullsDone: 0 }])).find(r => r.components.some(b => b.label === 'Calculate'));
    assert.deepStrictEqual(step2.components.map(b => b.label), ['Set Balance', 'Calculate'], 'step 2 ends with Balance and Calculate only');
});

t('what a region is lives in Help; the form only labels the row with a hint', () => {
    for (const panel of [form([{ drawKey: 'mythicWeapon', pullsDone: 0 }]), dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] })]) {
        assert.ok(texts(panel).includes('-# Set your CP region and current balance.'), 'the hint alone, no heading (2026-10-14, his ask)');
        assert.strictEqual(/Your Region & CP Balance/.test(allText(panel)), false);
        assert.strictEqual(/first pull/.test(allText(panel)), false, 'what a region is stays in Help');
    }
    assert.ok(/\*\*Region\*\* — the CP price of your first pull/.test(allText(dc.buildHelpPanel(ACCENT))));
});

t('the default view names the currency and where to change it', () => {
    const text = allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] })));
    assert.ok(/Prices in \*\*CAD\*\*/.test(text), 'compact view must name the currency (the fixture renders in CAD)');
});

t('the compact package line states the price once, the packs, and the leftover', () => {
    const block = texts(render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }] }))).find(c => c.includes('### Recommended Package'));
    const line = block.split('\n').find(l => l.startsWith('**Cheapest:**'));
    assert.ok(/left over/.test(line), `leftover missing from "${line}"`);
    assert.strictEqual((line.match(/10,800 CP/g) || []).length <= 1, true, `the pack total is repeated in "${line}"`);
});

t('the result heads the list "Your Selection" with Edit beside it; a grouped ×N keeps its progress', () => {
    const panel = render(makeBasket({ banners: [{ drawKey: 'legendaryGunReactive', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 0 }] }));
    const section = container(panel).components.find(c => c.type === 9 && c.accessory && c.accessory.label === 'Edit');
    assert.ok(section && section.components[0].content.startsWith('## Your Selection'), 'Edit sits beside Your Selection');
    assert.strictEqual(verbOf(section.accessory), 'edit');
    assert.ok(/Legendary Weapon \(Reactive\) ×2 — 0\/10 Spins/.test(allText(panel)));
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
    assert.ok(/has 7 Items/.test(seven.notice));
    const orphan = dc.slashShortcut({ pulls: 4, balance: 500 });
    assert.strictEqual(orphan.create, null);
    assert.strictEqual(orphan.balance, 500, 'a bare balance is applied to whichever calculation opens');
    assert.ok(/needs a `draw`/.test(orphan.notice));
    assert.deepStrictEqual(dc.slashShortcut({}), { create: null, balance: null, notice: null }, 'no options: no shortcut at all');
});

t('each line\'s dropdown OPENS with Remove, then the values; Move Up is gone', () => {
    const lines = selects(form([{ drawKey: 'mythicWeapon', pullsDone: 0 }, { drawKey: 'legendaryGunReactive', pullsDone: 3 }])).filter(s => verbOf(s) === 'bpulls');
    for (const line of lines) assert.deepStrictEqual(line.options.slice(0, 2).map(o => o.value), ['del', '0']);
    assert.strictEqual(lines.some(s => s.options.some(o => o.value === 'up')), false, 'no Move Up option on any line (2026-10-14, his call)');
    assert.ok(/3\/10 Spins/.test(lines[1].options[0].description), 'Remove says what progress goes with it');
    assert.ok(lines.every(s => s.options.length <= 25));
});

t('Show Breakdown sits beside the Cost Breakdown heading, not in an action row', () => {
    const panel = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], balance: 3000 }));
    const section = container(panel).components.find(c => c.type === 9 && c.accessory && c.accessory.label === 'Show Breakdown');
    assert.ok(section && section.components[0].content.startsWith('## Cost Breakdown'));
    assert.strictEqual(rows(panel).some(r => r.components.some(b => b.label === 'Show Breakdown')), false);
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

t('the form adds from ONE picker below the lines: nothing pre-ticked, every draw listed', () => {
    const all = selects(form([{ drawKey: 'legendaryGunReactive', pullsDone: 2 }, { drawKey: 'mythicWeapon', pullsDone: 0 }]));
    assert.strictEqual(all.some(s => verbOf(s) === 'draws'), false, 'with lines, the multi-select gives way to + Add more draws');
    const addIdx = all.findIndex(s => verbOf(s) === 'addmore');
    assert.ok(addIdx > 0 && all.slice(0, addIdx).every(s => verbOf(s) === 'bpulls'), 'the add picker comes after the lines');
    const add = all[addIdx];
    assert.strictEqual(add.options.length, Object.keys(DRAW_META).length);
    assert.ok(add.max_values > 1);
    assert.strictEqual(add.options.some(o => o.default), false, 'nothing is shown ticked: ticking always ADDS');
    assert.strictEqual(add.placeholder, 'Add more draws to selection');
    assert.ok(texts(form([{ drawKey: 'mythicWeapon', pullsDone: 0 }])).some(c => c.startsWith('## Calculate Multiple Draws\n-# Select more draw types')), 'a heading and a hint above it (2026-10-14, his ask)');
    const empty = dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: [] });
    assert.ok(selects(empty).some(s => verbOf(s) === 'draws' && s.max_values > 1), 'an empty form starts from the multi-select');
});

t('pages keep a draw\'s lines together', () => {
    const run = keys => keys.map(drawKey => ({ drawKey, pullsDone: 0 }));
    assert.deepStrictEqual(dc.linePages(run(['a', 'a', 'a', 'b', 'b', 'c']), 4), [[0, 1, 2], [3, 4, 5]], 'a group never splits to fill a page');
    assert.deepStrictEqual(dc.linePages(run(['a', 'b', 'b', 'b', 'b', 'b']), 4), [[0], [1, 2, 3, 4], [5]], 'a group longer than a page is the only split');
    assert.deepStrictEqual(dc.linePages([], 4), [[]]);
    const shown = selects(form(run(['mythicWeapon', 'mythicWeapon', 'mythicWeapon', 'mythicWeapon', 'legendaryGunReactive', 'legendaryGunReactive', 'legendaryGunReactive']))).filter(s => verbOf(s) === 'bpulls').map(s => dc.decodeState(s.custom_id).focus);
    assert.deepStrictEqual(shown, [0, 1, 2, 3], 'four Mythic Weapons fill page 1 rather than splitting the three Reactives');
});

t('a calculation stops at its line cap: the add picker says so and is disabled', () => {
    const full = Array.from({ length: dc.MAX_LINES }, () => ({ drawKey: 'mythicWeapon', pullsDone: 0 }));
    const add = selects(form(full)).find(s => verbOf(s) === 'addmore');
    assert.ok(add.disabled && /up to 25 draws/.test(add.placeholder));
    const room = selects(form(full.slice(0, dc.MAX_LINES - 2))).find(s => verbOf(s) === 'addmore');
    assert.strictEqual(room.max_values, 2, 'it never lets one pick overshoot the cap');
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
    assert.strictEqual(verbOf(buttonLabelled(landing, 'Saved')), 'saved', 'with none saved the button still shows, so saving is discoverable');
    const saved = [{ _id: 'c'.repeat(24), name: 'Season 12', banners: [], region: 'region_10' }];
    assert.ok(buttonLabelled(dc.buildCalculatorPanel(state(), null, ACCENT, { savedBaskets: saved }), 'Saved (1)'), 'and counts them when there are some');
    assert.ok(/Press \*\*Edit\*\*/.test(allText(render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] })))), 'the result says how to change things');
});

t('the result keeps Set Balance one tap away, and Edit is a VIEW that leaves the calculation submitted', () => {
    const result = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }] }));
    const row = rows(result).find(r => r.components.some(b => b.label === 'Save'));
    assert.deepStrictEqual(row.components.map(b => b.label), ['Set Balance', 'Upgrade: NO', 'Save'], 'the commonest return visit, "I have more CP now", is one tap');
    const editing = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 0 }], submitted: true }), { page: 2 });
    assert.ok(/Set Current Attempts/.test(allText(editing)) && buttonLabelled(editing, 'Calculate'), 'page 2 of a submitted calculation is the form');
    assert.strictEqual(dc.decodeState(buttonLabelled(editing, 'Calculate').custom_id).page, 2, 'its controls keep the view');
});

t('removing a line with progress asks first; Keep stays on the page it was asked from', () => {
    const editing = render(makeBasket({ banners: [{ drawKey: 'mythicWeapon', pullsDone: 7 }] }), { page: 2, focus: 0 }, { dropConfirm: { mask: 0, count: 1, verb: 'dellineok', label: 'Remove #1' }, notice: 'x' });
    const yes = buttonLabelled(editing, 'Remove #1');
    const keep = buttonLabelled(editing, 'Keep it');
    assert.ok(yes && keep);
    assert.strictEqual(dc.decodeState(yes.custom_id).focus, 0, 'the confirm carries which line');
    assert.strictEqual(dc.decodeState(keep.custom_id).page, 2, 'Keep does not throw an edit back to the result');
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
})();
