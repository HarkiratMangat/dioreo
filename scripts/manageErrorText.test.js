// scripts/manageErrorText.test.js /manage's commit failures read as sentences, not as `op 0 failed: conflict`. Pure, no database.
const assert = require('assert');
const { humanCommitError, extractCommitError } = require('../handlers/manage/shared');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('a positional conflict reads as a sentence that says nothing was saved', () => {
    const t = humanCommitError('op 0 failed: conflict');
    assert.ok(!/op 0|failed:/.test(t), t);
    assert.ok(/nothing was saved/.test(t) && /try again/i.test(t), t);
});

check('a missing element reads as a sentence, whatever the op index', () => {
    const t = humanCommitError('op 3 failed: missing');
    assert.ok(/no longer exists/.test(t) && !/op 3/.test(t), t);
});

check('any other failure text passes through untouched', () => {
    assert.strictEqual(humanCommitError('Could not read the date "abc".'), 'Could not read the date "abc".');
    assert.strictEqual(humanCommitError('op 0 failed: something else'), 'op 0 failed: something else');
    assert.strictEqual(humanCommitError(undefined), undefined);
});

check('extractCommitError applies it to both result shapes', () => {
    assert.ok(/nothing was saved/.test(extractCommitError({ error: 'op 0 failed: conflict' })));
    assert.strictEqual(extractCommitError({ failures: [{ errors: ['A draw needs a title.'] }] }), 'A draw needs a title.');
});

process.exit(failures ? 1 : 0);
