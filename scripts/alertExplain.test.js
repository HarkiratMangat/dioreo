// scripts/alertExplain.test.js Regression test for utils/alertExplain.js — the plain-language layer added 2026-08-06 14:58 EDT after a live `🔴 Gateway shard error` alert that Harkirat had "absolutely no clue" how to read. Run: `node scripts/alertExplain.test.js` (also runs via `npm test`, which CI calls).
//
// ⚠️ WHY A UNIT TEST AND NOT THE RENDER SCRIPT. The obvious check is to fire sample alerts through sendAlert() and read the embeds — and that IS how the layout was verified. But sendAlert throttles to 1/min per `${level}:${title}`, so a second 'Gateway disconnected' with a DIFFERENT close code is silently dropped: the transient-vs-fatal branch, the single most valuable distinction in this module, cannot be exercised that way at all. It looked covered and was not. Calling explain() directly is the only way those branches get proven.
const assert = require('assert');
const { explain, displayTitle, DISPLAY_TITLE, FATAL_CLOSE_CODES } = require('../utils/alertExplain');

let pass = 0; const failures = [];
function t(name, fn) {
    try { fn(); pass++; console.log(`  PASS  ${name}`); }
    catch (e) { failures.push([name, e.message]); console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

console.log('alertExplain.js — proofs');

// --- The live case that prompted the module -------------------------------------------------------
t('a 503 shard error names the cause in plain words', () => {
    const ex = explain('Gateway shard error', '**Error:** Unexpected server response: 503');
    assert.ok(ex, 'expected an explanation');
    assert.match(ex.what, /503/, 'should name the 503 so it ties back to the technical detail');
    assert.match(ex.what, /overloaded|refused/, 'should say what a 503 MEANS, not just repeat the number');
    assert.match(ex.selfFix, /yes/i, 'a 503 is transient — must say so');
});

t('a shard error states the bot kept running', () => {
    // The reason this line matters: a red 🔴 alert reads as "the bot is down" when it usually is not, and that misread is what turns a nothing-event into a panic at 03:00.
    const ex = explain('Gateway shard error', 'Unexpected server response: 503');
    assert.match(ex.what, /never stopped running/);
});

// --- THE branch the render script could not reach (throttled) --------------------------------------
t('a FATAL close code says it will NOT self-heal', () => {
    const ex = explain('Gateway disconnected', 'Shard 0 disconnected (close code 4004).');
    assert.match(ex.what, /NOT come back/, 'must contradict the usual "it reconnects itself"');
    assert.match(ex.selfFix, /^No\./, 'selfFix must open with an unambiguous No');
    assert.match(ex.action, /token/i, '4004 is a bad token — the action must say so concretely');
});

t('a TRANSIENT close code says it usually self-heals', () => {
    const ex = explain('Gateway disconnected', 'Shard 0 disconnected (close code 1006).');
    assert.match(ex.selfFix, /[Uu]sually yes/);
    assert.doesNotMatch(ex.what, /NOT come back/);
});

t('every fatal close code produces a No', () => {
    // Guards the table itself: adding a code to FATAL_CLOSE_CODES without it flowing through the fatal branch would silently reintroduce "probably transient" for a permanent outage.
    for (const code of Object.keys(FATAL_CLOSE_CODES)) {
        const ex = explain('Gateway disconnected', `Shard 0 disconnected (close code ${code}).`);
        assert.match(ex.selfFix, /^No\./, `close code ${code} should be reported as not self-healing`);
    }
});

t('a missing close code degrades to the transient wording, not a crash', () => {
    const ex = explain('Gateway disconnected', 'Shard 0 disconnected.');
    assert.ok(ex && ex.selfFix, 'must still produce an explanation with no code present');
});

// --- Unknown titles must never LOSE information ---------------------------------------------------
t('an unknown title returns null so the old layout is kept', () => {
    // This is the safety property of the whole feature: explain() is additive. If it ever started returning a stub object for unknown titles, sendAlert would move the technical detail into a field and print an empty explanation above it — strictly worse than before the layer existed.
    assert.strictEqual(explain('Bot online', 'v2.56.3'), null);
    assert.strictEqual(explain('Daily health check', 'ok'), null);
    assert.strictEqual(explain('Some future alert nobody has written yet', 'x'), null);
});

// --- Cross-references must name what the reader will actually SEE ----------------------------------
t('every alert name quoted in an explanation is a real DISPLAY title', () => {
    // A draft pointed the reader at "Discord connection lost" while the alert still displayed as "Gateway disconnected" — telling someone to look for a message that does not exist under that name is the exact failure this module exists to remove. This asserts it structurally instead of trusting a proofread.
    const shown = new Set([...Object.values(DISPLAY_TITLE), 'Bot online', 'Back online',
        'Reconnecting to Discord', 'Daily health check']);
    const titles = [...Object.keys(DISPLAY_TITLE), 'Back online', 'Reconnecting to Discord'];
    for (const title of titles) {
        const ex = explain(title, 'close code 1006');
        if (!ex) continue;
        for (const field of [ex.what, ex.selfFix, ex.action]) {
            for (const [, quoted] of field.matchAll(/"([^"]+)"/g)) {
                assert.ok(shown.has(quoted),
                    `${title}: quotes alert name "${quoted}", which is not a display title any alert uses`);
            }
        }
    }
});

// --- Display titles ------------------------------------------------------------------------------
t('display titles replace the jargon ones', () => {
    assert.strictEqual(displayTitle('Gateway shard error'), 'Discord connection error');
    assert.strictEqual(displayTitle('MongoDB connection failure'), 'Database unreachable');
});

t('an unmapped title passes through unchanged', () => {
    assert.strictEqual(displayTitle('Bot online'), 'Bot online');
    assert.strictEqual(displayTitle('Totally new alert'), 'Totally new alert');
});

t('no display title is mapped to itself', () => {
    // A self-mapping is a line that has to be kept in sync and buys nothing; the fallthrough in displayTitle() already handles it.
    for (const [k, v] of Object.entries(DISPLAY_TITLE)) {
        assert.notStrictEqual(k, v, `${k} maps to itself — delete the entry instead`);
    }
});

// --- Every explained title must answer all three questions ----------------------------------------
t('every explanation answers all three questions, non-empty', () => {
    const titles = [...Object.keys(DISPLAY_TITLE), 'Back online', 'Reconnecting to Discord'];
    for (const title of titles) {
        const ex = explain(title, 'close code 1006');
        assert.ok(ex, `${title} should have an explanation`);
        // ⚠️ NO MINIMUM LENGTH on `action`. The first version of this test demanded >10 chars for all three fields and failed on `action: 'Nothing.'` — which is the RIGHT answer for a recovery alert, and the one a reader most wants to see. The assertion was measuring verbosity and calling it usefulness. `what` and `selfFix` do have to explain something; `action` is allowed to be a single word, so it is only required to be a real, non-empty sentence.
        for (const k of ['what', 'selfFix']) {
            assert.ok(ex[k] && ex[k].trim().length > 20, `${title}.${k} is empty or too short to explain anything`);
        }
        // ...and it may end in `?` — the database action legitimately ends "is the VM's IP still allow-listed?". This assertion has now been wrong twice in the same direction (first demanding length, then demanding a full stop), which is a standing warning about this kind of test: it is easy to encode a style preference and read the failure as a content bug.
        assert.ok(ex.action && /[.?!]$/.test(ex.action.trim()), `${title}.action is empty or not a sentence`);
    }
});

t('explanations stay within Discord\'s 1024-char field cap', () => {
    // selfFix and action render as embed FIELDS, capped at 1024 by Discord. sendAlert slices as a backstop, but a silently truncated sentence is a bad answer — keep them genuinely short.
    const titles = [...Object.keys(DISPLAY_TITLE), 'Back online', 'Reconnecting to Discord'];
    for (const title of titles) {
        const ex = explain(title, 'close code 4004');
        for (const k of ['selfFix', 'action']) {
            assert.ok(ex[k].length <= 1024, `${title}.${k} is ${ex[k].length} chars, over Discord's field cap`);
        }
    }
});

console.log(`\n  ${pass} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
