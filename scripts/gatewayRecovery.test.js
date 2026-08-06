// scripts/gatewayRecovery.test.js
// Regression test for utils/gatewayRecovery.js — the announced-problem→announced-recovery pairing
// added 2026-08-06 15:01 EDT. Run: `node scripts/gatewayRecovery.test.js` (also via `npm test`).
//
// The property under test is SYMMETRY, and both halves of it are load-bearing:
//   · a problem that WAS announced must produce a loud recovery  (the gap Harkirat reported)
//   · a problem that was NEVER announced must stay silent        (the 2026-07-20 anti-noise decision)
// A change that satisfies only the first one looks like a fix and refills the alert channel with the
// routine 1-3h reconnect churn that was deliberately suppressed.
const assert = require('assert');
const { createGatewayRecovery, formatDowntime } = require('../utils/gatewayRecovery');

let pass = 0; const failures = [];
function t(name, fn) {
    try { fn(); pass++; console.log(`  PASS  ${name}`); }
    catch (e) { failures.push([name, e.message]); console.log(`  FAIL  ${name}\n        ${e.message}`); }
}
// A fake clock, so downtime arithmetic is exact instead of timing-dependent.
function harness(startMs = 1_000_000) {
    const sent = [];
    let clock = startMs;
    const gr = createGatewayRecovery({ sendAlert: (...a) => sent.push(a), now: () => clock });
    return { gr, sent, tick: (sec) => { clock += sec * 1000; } };
}

console.log('gatewayRecovery.js — proofs');

t('a recovery with no announced problem stays SILENT', () => {
    // The routine case: reconnect→resume churn every 1-3h. Posting here is the regression that would
    // undo the 2026-07-20 decision, so this is the assertion protecting it.
    const { gr, sent } = harness();
    assert.strictEqual(gr.noteRecovered('resumed'), false, 'should report that it announced nothing');
    assert.strictEqual(sent.length, 0, 'no alert may be sent when nothing was announced');
});

t('a recovery AFTER an announced problem is LOUD', () => {
    const { gr, sent, tick } = harness();
    gr.noteTrouble();
    tick(4);
    assert.strictEqual(gr.noteRecovered('shard 0 resumed and replayed 3 events'), true);
    assert.strictEqual(sent.length, 1);
    const [title, detail, level, opts] = sent[0];
    assert.strictEqual(title, 'Back online');
    assert.strictEqual(level, 'info');
    assert.strictEqual(opts.ping, true, 'must ping — it closes out an alert that pinged');
    assert.match(detail, /after 4s/, 'must report the real downtime');
    assert.match(detail, /replayed 3 events/, 'must carry the caller\'s description of how it recovered');
});

t('the state RESETS, so the next routine blip is silent again', () => {
    // Without the reset, one real outage would make every subsequent routine reconnect loud forever —
    // a slow leak into exactly the noise this is meant to avoid, and one that would only show up days
    // later in a channel nobody wants to read any more.
    const { gr, sent, tick } = harness();
    gr.noteTrouble(); tick(3); gr.noteRecovered('first');
    assert.strictEqual(sent.length, 1);
    assert.strictEqual(gr.noteRecovered('routine churn'), false, 'second recovery had no problem to close');
    assert.strictEqual(sent.length, 1, 'no second alert');
});

t('a FLAPPING connection reports the whole episode, not the last twitch', () => {
    // disconnect → error → disconnect fires noteTrouble() repeatedly. Keeping the LATEST timestamp
    // would report "down 2s" for an outage that actually lasted a minute — technically a number, and
    // a misleading answer to the only question the alert exists to answer.
    const { gr, sent, tick } = harness();
    gr.noteTrouble();          // outage starts
    tick(30); gr.noteTrouble(); // still flapping
    tick(30); gr.noteTrouble();
    tick(2);
    gr.noteRecovered('resumed');
    assert.match(sent[0][1], /after 1m 2s/, `expected the full 62s episode, got: ${sent[0][1]}`);
});

t('isTroubled tracks the outage state', () => {
    const { gr } = harness();
    assert.strictEqual(gr.isTroubled(), false);
    gr.noteTrouble();
    assert.strictEqual(gr.isTroubled(), true);
    gr.noteRecovered('resumed');
    assert.strictEqual(gr.isTroubled(), false);
});

t('a sub-second recovery reports 1s, never 0s', () => {
    // Math.round would give 0 for a 400ms blip, and "restored after 0s" reads like a bug.
    const { gr, sent } = harness();
    gr.noteTrouble();
    gr.noteRecovered('resumed');
    assert.match(sent[0][1], /after 1s/);
});

// --- formatDowntime -------------------------------------------------------------------------------
t('formatDowntime keeps SECONDS visible for short outages', () => {
    // The bug this function exists to avoid: alertStore's formatUptime() floors to minutes, so the
    // typical few-second gateway blip rendered as "restored after 0m". Caught before shipping.
    assert.strictEqual(formatDowntime(1), '1s');
    assert.strictEqual(formatDowntime(4), '4s');
    assert.strictEqual(formatDowntime(59), '59s');
});

t('formatDowntime handles minutes and hours', () => {
    assert.strictEqual(formatDowntime(60), '1m');
    assert.strictEqual(formatDowntime(62), '1m 2s');
    assert.strictEqual(formatDowntime(3600), '1h');
    assert.strictEqual(formatDowntime(3660), '1h 1m');
    assert.strictEqual(formatDowntime(7325), '2h 2m');
});

console.log(`\n  ${pass} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
