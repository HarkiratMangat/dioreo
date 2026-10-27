// scripts/announcementBudget.test.js
//
// Discord refuses a Components V2 message holding more than 4,000 characters of text or 40 components (announcements were embeds, capped at 6,000, until 2026-10-26). Two long announcements used to make every delivery fail forever; these checks pin the cap on both sides.
const assert = require('assert');
const { fitEmbedBudget, TEXT_CHAR_BUDGET, COMPONENT_BUDGET, ANNOUNCEMENT_TEXT_MAX, buildAnnouncementContainer, measureComponents, whyButtonRow } = require('../utils/announcement');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
const doc = (n) => ({ text: 'x'.repeat(n), createdAt: new Date(0), color: 0 });

check('two announcements over the budget together go one at a time, the first first', () => {
    const a = doc(2500), b = doc(2500);
    assert.deepStrictEqual(fitEmbedBudget([a, b]), [a]);
});

check('short ones still share one message', () => {
    const list = [doc(100), doc(100), doc(100)];
    assert.strictEqual(fitEmbedBudget(list).length, 3);
    assert.strictEqual(TEXT_CHAR_BUDGET, 4000);
    assert.strictEqual(COMPONENT_BUDGET, 40);
});

check('the longest allowed announcement fits one message with its Posted line and the Why row', () => {
    const msg = [buildAnnouncementContainer(doc(ANNOUNCEMENT_TEXT_MAX)), whyButtonRow()];
    const m = measureComponents(msg);
    assert.ok(m.text <= TEXT_CHAR_BUDGET, `text ${m.text}`);
    assert.ok(m.count <= COMPONENT_BUDGET, `components ${m.count}`);
});

check('an older announcement past the cap is cut, so it can never be refused forever', () => {
    const m = measureComponents([buildAnnouncementContainer(doc(5000)), whyButtonRow()]);
    assert.ok(m.text <= TEXT_CHAR_BUDGET, `text ${m.text}`);
});

check('the 40-component ceiling stops a batch too', () => {
    const many = (n) => ({ text: Array.from({ length: n }, (_, i) => `line ${i}`).join('\n---\n'), createdAt: new Date(0), color: 0 });
    const a = many(12), b = many(12);
    assert.deepStrictEqual(fitEmbedBudget([a, b]), [a]);
});

check('the op refuses a text Discord could never deliver', () => {
    const v = (text) => ops.resolveOp('announcement.post').validate({ type: 'announcement.post', payload: { text, expiry: '1' } });  // a whole number of days: '1d' is refused by itself, which made the old refusal check pass whatever the text
    assert.strictEqual(v('y'.repeat(4001)).ok, false);
    assert.strictEqual(v('y'.repeat(ANNOUNCEMENT_TEXT_MAX + 1)).ok, false);
    assert.ok(v('y'.repeat(ANNOUNCEMENT_TEXT_MAX + 1)).errors.some(e => e.includes(String(ANNOUNCEMENT_TEXT_MAX))));
    assert.strictEqual(v('y'.repeat(ANNOUNCEMENT_TEXT_MAX)).ok, true);
});

if (failures) { console.error(`\n${failures} check(s) failed.`); process.exit(1); }
console.log('\nannouncementBudget: all checks passed.');
process.exit(0);
