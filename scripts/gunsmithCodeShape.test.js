// scripts/gunsmithCodeShape.test.js
//
// A gunsmith code read as `1C2B4C5B70` (the game draws O like 0) was saved cut short as `1C2B4C5B7`, on two FSS Hurricane builds on prod, and nothing asked (Harkirat, 2026-10-28 01:06 EDT: fix the cleaner, and warn before saving a code that looks cut off). Pins both halves: utils/adminParser.js's cleaner keeps the last O, and gunsmithCodeProblem names a code that is not number-letter pairs, which /manage (utils/loadoutPanels.js codePanel) and /autobuild (refreshReviewWarnings, Save All) act on.
const assert = require('assert');
const { correctGunsmithCode, gunsmithCodeProblem } = require('../utils/adminParser');
const panels = require('../utils/loadoutPanels');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('a trailing 0 in a letter position becomes O, not dropped', () => {
    assert.strictEqual(correctGunsmithCode('1C2B4C5B70'), '1C2B4C5B7O');
    assert.strictEqual(correctGunsmithCode('1C2B5B6A70'), '1C2B5B6A7O');
});
check('the weapon-name prefix is still stripped', () => {
    assert.strictEqual(correctGunsmithCode('FSS Hurricane-1C2B4C5B70'), '1C2B4C5B7O');
    assert.strictEqual(correctGunsmithCode('Locus-1B2A4B8C9C'), '1B2A4B8C9C');
});
check('other look-alike digits in letter positions are kept and mapped', () => {
    assert.strictEqual(correctGunsmithCode('1C2B381A'), '1C2B3B1A');
    assert.strictEqual(correctGunsmithCode('1C251A'), '1C2S1A');
});
check('codes that were already right are unchanged', () => {
    for (const c of ['1C2B4C5B7O', '1C2B6B9A', '1C6C7A8A9A', '1I2C6B8A9D']) assert.strictEqual(correctGunsmithCode(c), c);
});

check('a complete code has no problem', () => {
    for (const c of ['1C2B4C5B7O', '1C2B6B9A', '1A2B', '', null]) assert.strictEqual(gunsmithCodeProblem(c), null, String(c));
});
check('an odd length ending on a number is named as cut off', () => {
    assert.match(gunsmithCodeProblem('1C2B4C5B7'), /ends on a number/);
});
check('anything else that is not number-letter pairs is named too', () => {
    for (const c of ['1C2BB4', '0C2B', '1C2B4']) assert.ok(gunsmithCodeProblem(c), c);
    assert.match(gunsmithCodeProblem('1C2BB4'), /number-letter pairs/);
});

check('the /manage code warning offers Back to edit and Save anyway, and says what it saw', () => {
    const [c] = panels.codePanel({ lines: ['`1C2B4C5B7`: it ends on a number with no letter after it.'], token: 't' });
    const ids = c.components.flatMap(x => x.components || []).map(b => b.custom_id).filter(Boolean);
    assert.deepStrictEqual(ids, ['mng_codeedit|t', 'mng_codeok|t']);
    assert.match(c.components[0].content, /This code looks cut off/);
    assert.match(c.components[0].content, /1C2B4C5B7/);
    assert.match(panels.codePanel({ lines: ['a', 'b'], token: 't' })[0].components[0].content, /These codes look cut off/);
});

check('/autobuild: the review warns, Save reads Save anyway, and Save All stops on it', () => {
    const { refreshReviewWarnings, buildReviewCard } = require('../utils/autobuildPipeline');
    const data = { weaponName: 'FSS Hurricane', gunsmithCode: '1C2B4C5B7', attachments: ['A', 'B', 'C', 'D', 'E'], category: 'SMG', mode: 'MP', sourceImageUrl: 'https://example.com/x.png' };
    refreshReviewWarnings(data, []);
    assert.match(data.codeWarning, /looks cut off/);
    const card = JSON.stringify(buildReviewCard('tok', data));
    assert.match(card, /"label":"Save anyway"/);
    const ok = { ...data, gunsmithCode: '1C2B4C5B7O' };
    refreshReviewWarnings(ok, []);
    assert.strictEqual(ok.codeWarning, null);
    assert.match(JSON.stringify(buildReviewCard('tok', ok)), /"label":"Save Build"/);
    const dmz = { ...data, mode: 'DMZ' };
    refreshReviewWarnings(dmz, []);
    assert.strictEqual(dmz.codeWarning, null, 'DMZ has no code to check');
});

check('/autobuild Save All stops at a build whose code looks cut off, before saving it', async () => {});
(async () => {
    const { confirmAllItems, flagsOf } = require('../utils/autobuildBulk');
    const saved = [];
    const batch = { items: [
        { status: 'pending', token: 'a', data: { codeWarning: null } },
        { status: 'pending', token: 'b', data: { codeWarning: 'cut' } },
        { status: 'pending', token: 'c', data: { codeWarning: null } },
    ] };
    const out = await confirmAllItems(batch, async (t) => { saved.push(t); return { status: 'saved', doc: {} }; });
    check('Save All saves up to it, then stops there with cutcode', () => {
        assert.deepStrictEqual(saved, ['a']);
        assert.strictEqual(out.stoppedAt, 1);
        assert.strictEqual(out.result.status, 'cutcode');
        assert.ok(flagsOf(batch.items, 1).includes('code looks cut off'));
    });
    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\ngunsmith code shape: all passing');
    process.exit(0);
})();
