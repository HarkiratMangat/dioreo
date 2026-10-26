// scripts/autobuildDmz.test.js
//
// /autobuild reading DMZ builds (2026-10-19 17:55 EDT, docs/db-deferred-list.md's "/autobuild: recognise DMZ builds, not just MP"). No Vertex call and no database: the model's answer is a fixed JSON object driven through the real utils/visionExtract.js shaping, and models/Loadout.js, Cloudinary and the Discord send are stubbed through require.cache so the real utils/autobuildPipeline.js runs end to end. The attachment lists are the stored DMZ AK117 and DMZ AS VAL builds, copied from the database export the portal mockup reads.
//
// ⚠️ What this cannot prove is that Gemini answers the four `screen` questions correctly on a real screenshot. That is scripts/autobuildDmzCheck.js, which runs the stored DMZ and MP screenshots through the live model and needs Vertex credentials.
const assert = require('assert');
const path = require('path');
const Module = require('module');

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${err.message.split('\n').join('\n      ')}`); }
}
function stub(rel, exports) {
    const file = path.join(__dirname, '..', rel);
    const m = new Module(file, null);
    m.filename = file;
    m.loaded = true;
    m.exports = exports;
    require.cache[file] = m;
}

// Real shaping, loaded before the stub replaces the module's network call.
const vision = require('../utils/visionExtract');
const { classifyMode, shapeExtraction, buildPrompt, MAX_ATTACHMENTS } = vision;

const DMZ_AK117 = ['Monolithic Suppressor', 'OWC Marksman', 'Classic Red Dot Sight', 'No Stock', 'Long Shot', 'OWC Laser - Tactical', 'Operator Foregrip', '48 Round Extended Mag', 'Granulated Grip Tape'];
const DMZ_ASVAL = ['MIP Quick Response Barrel', 'OWC 4.4X Tactical Scope', 'OWC Ranger Stock', 'Wounding', 'OWC Laser - Tactical', 'Ranger Foregrip', '15 Round FMJ', 'Granulated Grip Tape'];
const MP_AK117 = ['Monolithic Suppressor', 'MIP Extended Light Barrel', 'No Stock', '48 Round Extended Mag', 'Granulated Grip Tape'];
const DMZ_SCREEN = { penStats: true, selectBlueprints: false, equipCustomizeTabs: true, codeInTitle: false };
const MP_SCREEN = { penStats: false, selectBlueprints: true, equipCustomizeTabs: false, codeInTitle: true };

// A model answer for a DMZ screen. The slot labels are what a model that guessed anyway would send -- the pipeline must throw them away, since a DMZ screen prints none.
const dmzAnswer = (names, slots = []) => ({ weaponName: 'AK117', gunsmithCode: '', screen: DMZ_SCREEN, attachments: names.map((name, i) => ({ slot: slots[i] || '', name })) });

// ---- the stubbed world for the pipeline ----
let builds = [];
const saved = [];
const updates = [];
const sends = [];
let nextAnswer = null;
function Loadout(doc) { Object.assign(this, doc); this._id = `new${saved.length}`; this.save = async () => { saved.push({ ...doc }); return this; }; }
const matches = (doc, q) => Object.entries(q).every(([k, v]) => {
    if (v instanceof RegExp) return v.test(doc[k] || '');
    if (v && typeof v === 'object' && '$ne' in v) return doc[k] !== v.$ne;
    return (k === 'mode' ? (doc.mode || 'MP') : doc[k]) === v;
});
const query = (rows) => ({ select() { return this; }, lean: async () => rows, then: (res, rej) => Promise.resolve(rows).then(res, rej) });
Loadout.find = (q = {}) => query(builds.filter(b => matches(b, q)));
Loadout.findOne = (q = {}) => query(builds.find(b => matches(b, q)) || null);
Loadout.updateMany = async (filter, set) => { updates.push({ filter, set }); };
stub('models/Loadout.js', Loadout);
// The real deriveImageKey (the DMZ- key rule under test); only the two Cloudinary calls are replaced.
const imageCache = require('../utils/loadoutImageCache');
stub('utils/loadoutImageCache.js', { ...imageCache, uploadLoadoutImage: async () => ({ success: true }), syncLoadoutMetadata: async () => {} });
stub('utils/sendV2Payload.js', { sendV2Payload: async (interaction, components, opts) => { sends.push(components); } });
stub('utils/visionExtract.js', { ...vision, extractLoadoutFromImage: async () => shapeExtraction(nextAnswer) });

const pipeline = require('../utils/autobuildPipeline');
const fakeInteraction = () => ({ user: { id: '1' }, client: {}, followUp: async (m) => { sends.push(m); } });
const cardText = (components) => JSON.stringify(components);
const lastToken = () => [...pipeline.pendingAutobuilds.keys()].pop();

(async () => {
    // ---- classifyMode: the rule, with no model in the loop ----
    await check('two DMZ signals and no MP one is DMZ; two MP signals and no DMZ one is MP', () => {
        assert.strictEqual(classifyMode(DMZ_SCREEN), 'DMZ');
        assert.strictEqual(classifyMode(MP_SCREEN), 'MP');
    });
    await check('one signal alone, or any conflict, is unknown rather than a guess', () => {
        assert.strictEqual(classifyMode({ penStats: true }), null, 'one DMZ signal');
        assert.strictEqual(classifyMode({ codeInTitle: true }), null, 'one MP signal');
        assert.strictEqual(classifyMode({ ...DMZ_SCREEN, selectBlueprints: true }), null, 'DMZ pair plus an MP signal');
        assert.strictEqual(classifyMode({ penStats: true, equipCustomizeTabs: true, selectBlueprints: true, codeInTitle: true }), null, 'everything');
    });
    await check('a malformed answer is never a vote: strings, nulls and a missing object all read as unknown', () => {
        assert.strictEqual(classifyMode({ penStats: 'true', equipCustomizeTabs: 'true' }), null, 'strings are not booleans');
        assert.strictEqual(classifyMode(null), null);
        assert.strictEqual(classifyMode(undefined), null);
        assert.strictEqual(classifyMode({}), null);
    });

    // ---- the cap and the prompt ----
    await check('a nine-attachment DMZ build survives extraction whole (the old cap of 5 cut it to five)', () => {
        assert.strictEqual(MAX_ATTACHMENTS, 9);
        const out = shapeExtraction(dmzAnswer(DMZ_AK117));
        assert.deepStrictEqual(out.attachments, DMZ_AK117);
        assert.strictEqual(out.mode, 'DMZ');
    });
    await check('an answer with no `screen` object still extracts, with the mode unknown', () => {
        const out = shapeExtraction({ weaponName: 'AK117', gunsmithCode: '1C2B4A8B9A', attachments: MP_AK117.map(name => ({ slot: 'Muzzle', name })) });
        assert.strictEqual(out.mode, null);
        assert.strictEqual(out.attachments.filter(Boolean).length, 5);
    });
    await check('the prompt keeps the empty/restricted skip wording, asks for nine, and never mentions the dot row or the MAX badge', () => {
        const p = buildPrompt(MAX_ATTACHMENTS);
        assert.ok(p.includes('up to 9'), 'asks for up to nine');
        assert.ok(/skip any slot that is EMPTY/.test(p) && /RESTRICTED/.test(p), 'skip wording kept');
        assert.ok(p.includes("never output a slot's label as if it were the attachment name"), 'label-as-name ban kept');
        for (const k of ['penStats', 'selectBlueprints', 'equipCustomizeTabs', 'codeInTitle']) assert.ok(p.includes(`"${k}"`), `asks ${k}`);
        assert.ok(!/●|dot/i.test(p), 'no dot-row signal');
        assert.ok(!/\bMAX\b|GOLD/.test(p), 'no MAX/GOLD badge signal');
        assert.ok(p.includes('If no label is printed for the slot, use an empty string'), 'DMZ slots left blank, not guessed');
    });

    // ---- the pipeline's small rules ----
    await check('`mode:` beats the screenshot, the screenshot beats nothing, and junk is unknown', () => {
        assert.strictEqual(pipeline.resolveMode('MP', 'DMZ'), 'MP');
        assert.strictEqual(pipeline.resolveMode(null, 'DMZ'), 'DMZ');
        assert.strictEqual(pipeline.resolveMode(null, null), null);
        assert.strictEqual(pipeline.resolveMode('dmz', 'nope'), null);
    });
    await check('the Edit box reads "Category | Mode"; a bare category keeps the mode; a bad mode clears it', () => {
        assert.deepStrictEqual(pipeline.parseCategoryAndMode('ar | dmz', null), { category: 'AR', mode: 'DMZ' });
        assert.deepStrictEqual(pipeline.parseCategoryAndMode('SNIPER', 'DMZ'), { category: 'SNIPER', mode: 'DMZ' });
        assert.deepStrictEqual(pipeline.parseCategoryAndMode('AR | Ranked', 'MP'), { category: 'AR', mode: null });
        assert.deepStrictEqual(pipeline.parseCategoryAndMode(' | MP', null), { category: null, mode: 'MP' });
    });
    await check('DMZ rank badges survive the round trip through the Badges box; a bare tier lands on dmzRangeRank', () => {
        const dmz = { mode: 'DMZ', isMeta: true, dmzRangeRank: 'best-close', isToxic: false };
        assert.strictEqual(pipeline.badgeTokensOf(dmz), 'meta,bestclose');
        assert.deepStrictEqual(pipeline.badgeFieldsFor('DMZ', 'meta,bestclose'), { isMeta: true, isToxic: false, categoryRank: null, dmzRangeRank: 'best-close' });
        assert.deepStrictEqual(pipeline.badgeFieldsFor('DMZ', 'top3'), { isMeta: false, isToxic: false, categoryRank: null, dmzRangeRank: 'top3' });
        assert.deepStrictEqual(pipeline.badgeFieldsFor('MP', 'meta,top5,toxic'), { isMeta: true, isToxic: true, categoryRank: 'top5', dmzRangeRank: null });
        assert.strictEqual(pipeline.badgeTokensOf({ mode: 'MP', categoryRank: 'top5', isToxic: true }), 'top5,toxic');
    });
    await check('a DMZ duplicate is the same weapon with the same attachment set in any order; MP builds never count', () => {
        const stored = [
            { weaponKey: 'ak117', weaponName: 'AK117', buildName: 'Build 1', mode: 'DMZ', attachments: DMZ_AK117 },
            { weaponKey: 'asval', weaponName: 'AS VAL', buildName: 'Build 1', mode: 'DMZ', attachments: DMZ_ASVAL }
        ];
        assert.strictEqual(pipeline.findDmzDuplicates('ak117', [...DMZ_AK117].reverse(), stored).length, 1);
        assert.strictEqual(pipeline.findDmzDuplicates('ak117', DMZ_AK117.slice(0, 8), stored).length, 0, 'one attachment different');
        const data = { weaponName: 'AK117', mode: 'DMZ', gunsmithCode: '', attachments: MP_AK117, category: 'AR' };
        pipeline.refreshReviewWarnings(data, [{ weaponKey: 'ak117', weaponName: 'AK117', buildName: 'Build 1', mode: 'MP', category: 'AR', shareCode: '', attachments: MP_AK117 }]);
        assert.strictEqual(data.duplicateWarning, null, 'an MP build of the same gun is not a DMZ duplicate');
    });
    await check('the category check reads every mode; six attachments on an MP build is flagged', () => {
        const data = { weaponName: 'AK117', mode: 'MP', gunsmithCode: '1A2B', attachments: DMZ_AK117.slice(0, 6), category: 'SMG' };
        pipeline.refreshReviewWarnings(data, [{ weaponKey: 'ak117', weaponName: 'AK117', buildName: 'Build 1', mode: 'DMZ', category: 'AR', attachments: DMZ_AK117 }]);
        assert.strictEqual(data.categoryConflict, 'AR', 'a DMZ sibling still says what category the weapon is');
        assert.ok(data.equipCapWarning && data.equipCapWarning.includes('6 attachments'));
        const dmz = { weaponName: 'AK117', mode: 'DMZ', gunsmithCode: '', attachments: DMZ_AK117, category: 'AR' };
        pipeline.refreshReviewWarnings(dmz, []);
        assert.strictEqual(dmz.equipCapWarning, null, 'nine is fine in DMZ');
    });

    // ---- end to end, stubbed ----
    await check('a DMZ screenshot reaches the review card as DMZ, all nine attachments in on-screen order, no code asked for', async () => {
        builds = [{ weaponKey: 'ak117', weaponName: 'AK117', mode: 'MP', category: 'AR', buildName: 'Build 1', shareCode: '1C2B4A8B9A', attachments: MP_AK117, isMeta: true, categoryRank: 'top5' }];
        sends.length = 0;
        // Guessed labels in canonical-looking order: if they were kept, orderAttachmentsBySlot would move the optic to the front.
        nextAnswer = dmzAnswer(DMZ_AK117, ['Muzzle', 'Barrel', 'Optic', 'Stock', 'Perk', 'Laser', 'Underbarrel', 'Ammunition', 'Rear Grip']);
        await pipeline.runExtraction(fakeInteraction(), 'https://example.test/dmz.png', null, null);
        const data = pipeline.pendingAutobuilds.get(lastToken());
        assert.strictEqual(data.mode, 'DMZ');
        assert.strictEqual(data.modeSource, 'detected');
        assert.deepStrictEqual(data.attachments, DMZ_AK117, 'screen order kept');
        assert.ok(data.attachmentSlots.every(s => s === ''), 'guessed DMZ slot labels dropped');
        assert.strictEqual(data.category, 'AR', 'category inherited from the MP build');
        assert.strictEqual(data.badgesRaw, '', 'MP badges are not inherited by a DMZ build');
        const text = cardText(sends[0]);
        assert.ok(text.includes('**Mode:** DMZ _(detected from the screenshot)_'));
        assert.ok(text.includes('DMZ builds have no code'));
        assert.ok(text.includes('9. `Granulated Grip Tape`'));
    });
    await check('confirming it writes a DMZ Loadout under a free DMZ- key, and badges spread only to DMZ siblings', async () => {
        builds.push({ weaponKey: 'ak117', weaponName: 'AK117', mode: 'DMZ', category: 'AR', buildName: 'Aggressive', imageKey: 'DMZ-AK117-1', attachments: DMZ_ASVAL });
        const token = lastToken();
        pipeline.pendingAutobuilds.get(token).badgesRaw = 'meta,bestmidlong';
        saved.length = 0; updates.length = 0;
        await pipeline.confirmAndWrite(fakeInteraction(), token);
        assert.strictEqual(saved.length, 1, 'one build written');
        const doc = saved[0];
        assert.strictEqual(doc.mode, 'DMZ');
        assert.strictEqual(doc.imageKey, 'DMZ-AK117-2', 'DMZ-AK117-1 is taken by a build with a human name');
        assert.strictEqual(doc.buildName, 'Build 1', 'numbered among DMZ builds only');
        assert.strictEqual(doc.shareCode, '');
        assert.deepStrictEqual(doc.attachments, DMZ_AK117);
        assert.deepStrictEqual([doc.dmzRangeRank, doc.categoryRank, doc.isMeta], ['best-midlong', null, true]);
        assert.strictEqual(updates.length, 1);
        assert.strictEqual(updates[0].filter.mode, 'DMZ', 'MP siblings untouched');
        assert.deepStrictEqual(Object.keys(updates[0].set).sort(), ['dmzRangeRank', 'isMeta', 'isToxic']);
    });
    await check('an ambiguous screenshot asks, and Confirm refuses until the mode is set', async () => {
        sends.length = 0;
        nextAnswer = { ...dmzAnswer(DMZ_AK117), screen: { penStats: true } };
        await pipeline.runExtraction(fakeInteraction(), 'https://example.test/unclear.png', 'AR', null);
        const token = lastToken();
        assert.strictEqual(pipeline.pendingAutobuilds.get(token).mode, null);
        assert.ok(cardText(sends[0]).includes("couldn't tell MP from DMZ"));
        saved.length = 0; sends.length = 0;
        await pipeline.confirmAndWrite(fakeInteraction(), token);
        assert.strictEqual(saved.length, 0, 'nothing written');
        assert.ok(/MP or DMZ is still unresolved/.test(sends[0].content));
    });
    await check('`mode:MP` overrides a DMZ-looking screenshot, and an MP build keeps its slot labels and canonical order', async () => {
        sends.length = 0;
        nextAnswer = { weaponName: 'AK117', gunsmithCode: '1C2B4A8B9A', screen: DMZ_SCREEN, attachments: [
            { slot: 'Muzzle', name: 'Monolithic Suppressor' }, { slot: 'Optic', name: 'Classic Red Dot Sight' }] };
        await pipeline.runExtraction(fakeInteraction(), 'https://example.test/mp.png', 'AR', null, 'MP');
        const data = pipeline.pendingAutobuilds.get(lastToken());
        assert.strictEqual(data.mode, 'MP');
        assert.strictEqual(data.modeSource, 'explicit');
        assert.deepStrictEqual(data.attachmentSlots, ['Optic', 'Muzzle'], 'MP still orders by slot and keeps labels');
        assert.ok(cardText(sends[0]).includes('_(set by you)_'));
    });
    await check('the Edit box pre-fills "Category | Mode" and no longer demands a Gunsmith code', () => {
        const json = pipeline.buildEditModal('t', { weaponName: 'AK117', gunsmithCode: '', attachments: DMZ_AK117, category: 'AR', mode: 'DMZ', badgesRaw: '' }).toJSON();
        const inputs = Object.fromEntries(json.components.map(r => { const c = r.components[0]; return [c.custom_id, c]; }));
        assert.strictEqual(inputs.category.value, 'AR | DMZ');
        assert.strictEqual(inputs.code.required, false);
    });

    if (failed) { console.log(`\n${failed} check(s) failed.`); process.exit(1); }
    console.log('\nAll /autobuild DMZ checks passed.');
})();
