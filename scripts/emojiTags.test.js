// scripts/emojiTags.test.js -- the emoji tag table (utils/emojiTags.js) names only real emojis, and finds the ones his round-3 notes asked about.
const assert = require('assert');
const map = require('../utils/emojiMap');
const { TAGS, tagsFor, findEmoji } = require('../utils/emojiTags');
const keys = Object.keys(map).filter(k => typeof map[k] === 'string' && /^<a?:\w+:\d+>$/.test(map[k]));
let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message}`); } };
console.log('emoji tags');
check('every tagged key is a real emoji', () => { const missing = Object.keys(TAGS).filter(k => !keys.includes(k)); assert.deepStrictEqual(missing, []); });
check('every emoji answers to at least one word', () => { const bare = keys.filter(k => !tagsFor(k).length); assert.deepStrictEqual(bare, []); });
check('the words his notes asked about find the right emoji first', () => {
    assert.strictEqual(findEmoji('search')[0], 'search', 'search');
    assert.ok(findEmoji('next season').includes('season10') || findEmoji('next season').includes('bp'), 'next season');
    assert.ok(findEmoji('review').length > 0, 'review finds something');
    assert.strictEqual(findEmoji('quick add')[0], 'plus', 'quick add');
    assert.strictEqual(findEmoji('bulk paste')[0], 'pasteImport', 'bulk paste');
    assert.deepStrictEqual(findEmoji(''), []);
});
console.log(failed ? `\n${failed} check(s) FAILED.` : '\nAll emoji tag checks passed.');
process.exit(failed ? 1 : 0);
