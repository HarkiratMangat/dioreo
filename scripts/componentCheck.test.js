// scripts/componentCheck.test.js
//
// utils/componentCheck.js and the refusal path in utils/sendV2Payload.js (2026-11-12 19:30 EST, gunsmith-autobuild-fixes). Each case is a shape that froze a real panel, so the check must name it; a clean panel must come back empty; and a send Discord refuses (50035) must answer the clicker privately unless the caller asked to stay quiet. No Discord, no database.
const assert = require('assert');
const { checkComponents } = require('../utils/componentCheck');

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${err.message.split('\n').join('\n      ')}`); }
}
const btn = (id, label = 'B') => ({ type: 2, style: 2, label, custom_id: id });
const row = (...c) => ({ type: 1, components: c });
const sel = (id, values) => row({ type: 3, custom_id: id, options: values.map(v => ({ label: String(v), value: String(v) })) });
const panel = (...c) => [{ type: 17, components: c }];

(async () => {
    await check('a clean panel has no problems', () => {
        assert.deepStrictEqual(checkComponents(panel({ type: 10, content: 'hi' }, row(btn('a'), btn('b')), sel('s', [1, 2]))), []);
    });
    await check('the /autobuild Save All shape: one build twice in a select', () => {
        assert.match(checkComponents(panel(sel('autobuild_b|open|k|', ['d1', 'd1']))).join(), /repeats the option value "d1"/);
    });
    await check('the Promote shape: two buttons with one custom_id', () => {
        assert.match(checkComponents(panel(row(btn('mng_ss|view|live'), btn('mng_ss|view|live')))).join(), /duplicate custom_id/);
    });
    await check('more than 40 components, nested ones counted', () => {
        const many = Array.from({ length: 14 }, (_, i) => ({ type: 9, components: [{ type: 10, content: 'x' }], accessory: btn(`o${i}`) }));
        assert.match(checkComponents(panel(...many)).join(), /40 at most/);
    });
    await check('six buttons in a row, a select sharing its row, 26 options', () => {
        const p = checkComponents(panel(row(...'abcdef'.split('').map(x => btn(x))), row({ type: 3, custom_id: 's1', options: [{ label: 'a', value: 'a' }] }, btn('z')), sel('s2', Array.from({ length: 26 }, (_, i) => i)))).join(' | ');
        assert.match(p, /6 components \(5 at most\)/);
        assert.match(p, /a select shares its action row/);
        assert.match(p, /26 options/);
    });
    await check('a /manage gunsmith weapon with 12 builds fits: the page holds 8', async () => {
        const modelPath = require.resolve('../models/Loadout');
        const saved = require.cache[modelPath];
        const docs = Array.from({ length: 12 }, (_, i) => ({ _id: String(i + 1).padStart(24, 'a'), mode: 'MP', weaponKey: 'grav', weaponName: 'GRAV', category: 'AR', buildName: `Build ${i + 1}`, variants: [] }));
        const q = (v) => ({ lean: async () => v, select() { return q(v); } });
        require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: { find: () => q(docs), findById: () => q(docs[0]) } };
        try {
            const V = require('../handlers/manage/gunsmith/views');
            for (const pg of [0, 1]) assert.deepStrictEqual(checkComponents(await V.weaponView('MP', 'grav', 'a note', pg)), [], `page ${pg + 1}`);
            const p2 = JSON.stringify(await V.weaponView('MP', 'grav', null, 1));
            assert.ok(p2.includes('Build 9') && p2.includes('Build 12') && !p2.includes('"**Build 1**'), 'page 2 holds builds 9 to 12');
        } finally {
            if (saved) require.cache[modelPath] = saved; else delete require.cache[modelPath];
        }
    });
    await check('a refused send answers the clicker privately, unless the caller stays quiet', async () => {
        const { sendV2Payload } = require('../utils/sendV2Payload');
        const make = () => {
            const notes = [];
            const err = Object.assign(new Error('Invalid Form Body'), { code: 50035 });
            return { notes, i: { deferred: true, replied: false, applicationId: 'a', token: 't', message: { id: 'm' }, client: { rest: { patch: async () => { throw err; } } }, followUp: async (p) => { notes.push(p); } } };
        };
        const loud = make();
        await assert.rejects(sendV2Payload(loud.i, panel(sel('s', ['x', 'x']))));
        assert.strictEqual(loud.notes.length, 1);
        assert.ok(loud.notes[0].ephemeral && /couldn't draw this panel/.test(loud.notes[0].content) && /repeats the option value/.test(loud.notes[0].content), JSON.stringify(loud.notes[0]));
        const quiet = make();
        await assert.rejects(sendV2Payload(quiet.i, panel(sel('s', ['x', 'x'])), { quietRefusal: true }));
        assert.strictEqual(quiet.notes.length, 0);
    });

    if (failed) { console.log(`\n${failed} component check(s) failed.`); process.exit(1); }
    console.log('\nAll component checks passed.');
    process.exit(0);
})();
