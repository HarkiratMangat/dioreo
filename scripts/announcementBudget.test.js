// scripts/announcementBudget.test.js
//
// Discord refuses a message whose embeds total more than 6,000 characters, and an embed description past 4,096. Two long announcements used to make every delivery fail forever; these checks pin the cap on both sides.
const assert = require('assert');
const { fitEmbedBudget, EMBED_CHAR_BUDGET } = require('../utils/announcement');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
const doc = (n) => ({ text: 'x'.repeat(n), createdAt: new Date(0), color: 0 });

check('two announcements over the budget together go one at a time, the first first', () => {
    const a = doc(3500), b = doc(3500);
    assert.deepStrictEqual(fitEmbedBudget([a, b]), [a]);
});

check('short ones still share one message', () => {
    const list = [doc(100), doc(100), doc(100)];
    assert.strictEqual(fitEmbedBudget(list).length, 3);
    assert.strictEqual(EMBED_CHAR_BUDGET, 6000);
});

check('the op refuses a text Discord could never deliver', () => {
    const v = (text) => ops.resolveOp('announcement.post').validate({ type: 'announcement.post', payload: { text, expiry: '1d' } });
    assert.strictEqual(v('y'.repeat(4001)).ok, false);
    assert.ok(v('y'.repeat(4001)).errors.some(e => /4000/.test(e)));
});

if (failures) { console.error(`\n${failures} check(s) failed.`); process.exit(1); }
console.log('\nannouncementBudget: all checks passed.');
process.exit(0);
