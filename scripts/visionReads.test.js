// scripts/visionReads.test.js -- the /autobuild vision read records (models/VisionRead.js, utils/visionReads.js; Harkirat's tracking asks, 2026-10-25 13:31-13:50 EDT): the repeat detector, what Adjust counts as a change, the model's confidence and notes as they are shaped, the review card's "unsure" warning, and that no record is attempted without a database. No Vertex call, no database. Run: `node scripts/visionReads.test.js` (also via `npm test`).
const assert = require('assert');
const reads = require('../utils/visionReads');
const { shapeExtraction, buildPrompt } = require('../utils/visionExtract');

let passed = 0, failed = 0;
const pending = [];
const t = (name, fn) => pending.push(async () => {
    try { await fn(); passed++; console.log(`  PASS  ${name}`); } catch (err) { failed++; console.log(`  FAIL  ${name}\n        ${err.message}`); }
});

console.log('\n/autobuild — vision read records\n');

t('the same attachment in two slots is a repeat, whatever its case or spacing', () => {
    assert.deepStrictEqual(reads.repeatedAttachments({ attachments: [{ name: 'No Stock' }, { name: 'Choke' }, { name: 'no  stock' }, { name: '' }] }), ['No Stock']);
    assert.deepStrictEqual(reads.repeatedAttachments({ attachments: [{ name: 'A' }, { name: 'B' }] }), []);
    assert.deepStrictEqual(reads.repeatedAttachments(null), []);
});

t('Adjust records only the fields that really changed, with their before and after', () => {
    const before = { weaponName: 'FSS HURRICANE', gunsmithCode: '1C2B5B6D7', attachments: ['A', 'B'], category: 'SMG', mode: null, badgesRaw: '', buildLabel: '' };
    const after = { ...before, mode: 'MP', attachments: ['A', 'C'] };
    const changes = reads.adjustmentsBetween(before, after, new Date(0));
    assert.deepStrictEqual(changes.map(c => c.field), ['attachments', 'mode']);
    assert.deepStrictEqual(changes[1], { at: new Date(0), field: 'mode', from: null, to: 'MP' });
    assert.deepStrictEqual(reads.adjustmentsBetween(before, { ...before }), []);
});

t('the model\'s confidence is kept as whole numbers 0-100, and anything else is dropped', () => {
    const shaped = shapeExtraction({ weaponName: 'AK117', gunsmithCode: '', attachments: [], confidence: { weaponName: 92.4, gunsmithCode: '80', attachments: 140, mode: 'high' }, observations: '  Glare over the code.  ' });
    assert.deepStrictEqual(shaped.confidence, { weaponName: 92, gunsmithCode: 80 });
    assert.strictEqual(shaped.observations, 'Glare over the code.');
    const bare = shapeExtraction({ weaponName: 'AK117', gunsmithCode: '', attachments: [] });
    assert.deepStrictEqual([bare.confidence, bare.observations], [{}, '']);
});

t('the prompt asks for a confidence per field and a note', () => {
    const p = buildPrompt(9);
    for (const k of ['"confidence"', '"observations"', 'how sure you are of weaponName']) assert.ok(p.includes(k), k);
});

t('with no database connected, nothing is looked up or written, and nothing throws', async () => {
    assert.strictEqual(await reads.findReuse('abc'), null);
    assert.strictEqual(await reads.recordRead({ fileHash: 'abc' }), null);
    await reads.noteOutcome('x', 'saved');
    await reads.noteAdjustment('x', { mode: null }, { mode: 'MP' });
});

t('the fingerprint is the exact bytes: one changed byte is a different file', () => {
    const a = Buffer.from('screenshot');
    assert.strictEqual(reads.fileHash(a), reads.fileHash(Buffer.from('screenshot')));
    assert.notStrictEqual(reads.fileHash(a), reads.fileHash(Buffer.from('screenshoT')));
    assert.strictEqual(reads.fileHash(a).length, 64);
});

t('a VisionRead names no user: no Discord, user or admin field', () => {
    const paths = Object.keys(require('../models/VisionRead').schema.paths);
    assert.ok(!paths.some(p => /discord|user|admin|actor|owner/i.test(p)), paths.join(', '));
});

(async () => {
    for (const run of pending) await run();
    console.log(`\n  ${passed} passed, ${failed} failed\n`);
    process.exit(failed ? 1 : 0);
})();
