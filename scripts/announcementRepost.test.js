// scripts/announcementRepost.test.js: the word matching behind `d announcement` / `d repost` (utils/announcementRepost.js, his option 3, 2026-10-30 22:15 EDT; `|` groups 22:44 EDT). Pure functions only; the Discord sends are covered by the dev-bot click-test.
const assert = require('assert');
const R = require('../utils/announcementRepost');

const RUNNING = [
    { _id: 'a1', text: '# <a:DioreoTada:123> Dioreo is out of beta!\n**Polished up and officially launched!**\n---\nmore' },
    { _id: 'a2', text: '## :DioreoTada: Dioreo now supports text commands!\n:Command: Mention @Dioreo, or use d or dior as a prefix.' },
    { _id: 'a3', text: '## Halloween test\n--\nA second test announcement' },
];
const ids = r => (r.docs || []).map(d => d._id);
let failed = 0;
function check(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message}`); } }

check('headline drops emoji, markdown and layout marks', () => {
    assert.deepStrictEqual(R.headline(RUNNING[0]), ['Dioreo is out of beta!', 'Polished up and officially launched!']);
    assert.deepStrictEqual(R.headline(RUNNING[1]), ['Dioreo now supports text commands!', 'Mention @Dioreo, or use d or dior as a prefix.']);
    assert.deepStrictEqual(R.headline(RUNNING[2]), ['Halloween test', 'A second test announcement']);
});
check('one word matches within the first two lines only', () => {
    assert.deepStrictEqual(ids(R.matchGroups(RUNNING, 'beta')), ['a1']);
    assert.deepStrictEqual(R.matchGroups(RUNNING, 'more'), { missing: 'more' });
});
check('every word of a group must match', () => {
    assert.deepStrictEqual(ids(R.matchGroups(RUNNING, 'out of beta')), ['a1']);
    assert.deepStrictEqual(R.matchGroups(RUNNING, 'beta halloween'), { missing: 'beta halloween' });
});
check('beta|prefix posts both, in posting order, without repeats', () => {
    assert.deepStrictEqual(ids(R.matchGroups(RUNNING, 'prefix | beta')), ['a1', 'a2']);
    assert.deepStrictEqual(ids(R.matchGroups(RUNNING, 'dioreo|beta')), ['a1', 'a2']);
});
check('a group that matches nothing posts nothing and is named', () => {
    assert.deepStrictEqual(R.matchGroups(RUNNING, 'beta|nothing'), { missing: 'nothing' });
});
check('a trailing channel id or #mention is split off', () => {
    assert.deepStrictEqual(R.splitChannel(['beta', '1562645463067529240']), { words: ['beta'], channelId: '1562645463067529240' });
    assert.deepStrictEqual(R.splitChannel(['beta', '<#1562645463067529240>']), { words: ['beta'], channelId: '1562645463067529240' });
    assert.deepStrictEqual(R.splitChannel(['beta', '2026']), { words: ['beta', '2026'], channelId: null });
});
check('the picker is locked to its asker and lists at most 25', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ _id: `x${i}`, text: `Item ${i}\nline` }));
    const select = R.buildPicker(many, { userId: '42', where: 't' })[0].components[1].components[0];
    assert.strictEqual(select.custom_id, 'ann_pick~42~t');
    assert.strictEqual(select.options.length, 25);
    assert.strictEqual(select.max_values, 25);
});
if (failed) { console.log(`\n${failed} check(s) failed.`); process.exit(1); }
console.log('\nAll announcement repost checks passed.');
