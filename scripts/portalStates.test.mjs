// scripts/portalStates.test.mjs — proves the states harness's three passes CAN FAIL, on the exact defects they were written for.
//
// 🔴 THE HISTORICAL CASE IS THE FIRST TEST. The command bar's input measured 44px tall, with its own 1px border and its own background, inside a 34px wrapper painting both — for weeks, reported twice by a human, with every gate in the suite green. If PASS 1 fed those numbers stays silent, the harness is decoration. Everything else here is the same discipline: feed the shape, assert it is named, then feed the CORRECT version of the same shape and assert silence, because a pass that fires on everything gets suppressed rather than obeyed.
import assert from 'assert';
import { pass1Composite, pass3Space, pass4Keyboard, pass5Motion, pass6Names, diffAgainstKnown, stepSettle } from './lib/portalStatePasses.cjs';
import { isStall, portalTouched, depsChanged } from './portalStates.mjs';

let passed = 0;
const check = (label, fn) => { fn(); passed++; console.log(`  ✓ ${label}`); };
console.log('portal:states self-test\n');

check('PASS 1 names the doubled search bar, with the real measurements it shipped with', () => {
    const found = pass1Composite({ controls: [{ id: 'input.cb-in', h: 44, parentH: 34, border: 1, bg: 'rgb(11, 15, 18)', selfPaintsBg: true, parentPaints: true }] });
    assert.ok(found.length >= 1, 'the 44px-in-34px input must be reported');
    assert.match(found.map((f) => f.detail).join(' '), /second box inside the first|overflows its own container/);
    assert.strictEqual(found[0].pass, 1);
});

check('PASS 1 is silent on the FIXED command bar — a bare input inside the same wrapper', () => {
    const found = pass1Composite({ controls: [{ id: 'input.cb-in', h: 16, parentH: 34, border: 0, bg: 'rgba(0, 0, 0, 0)', selfPaintsBg: false, parentPaints: true }] });
    assert.deepStrictEqual(found, []);
});

// The false positive that would have made the pass useless: an ordinary field, with an ordinary border, inside a panel that also paints one.
check('PASS 1 is silent on a normal field in a panel — the wrapper is not drawn tight around it', () => {
    const found = pass1Composite({ controls: [{ id: 'input.nw-i', h: 44, parentH: 88, border: 1, bg: 'rgb(11, 15, 18)', selfPaintsBg: true, parentPaints: true }] });
    assert.deepStrictEqual(found, []);
});

check('PASS 1 still reports an overflow even when the wrapper is loose', () => {
    const found = pass1Composite({ controls: [{ id: 'input.x', h: 120, parentH: 88, border: 0, bg: 'rgba(0, 0, 0, 0)', selfPaintsBg: false, parentPaints: true }] });
    assert.strictEqual(found.length, 1);
    assert.match(found[0].detail, /overflows its own container/);
});

check('PASS 3 names a clipped component and leaves the visually-hidden pattern alone', () => {
    const found = pass3Space({ clipped: [{ id: 'span.lbl', w: 1, h: 1, textLen: 18, srOnly: false }, { id: 'span.sr', w: 1, h: 1, textLen: 22, srOnly: true }] });
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].id, 'span.lbl');
});

check('PASS 3 names a page that scrolls sideways', () => {
    const found = pass3Space({ overflow: [{ id: 'main', scrollW: 1420, clientW: 1206, overflowX: 'visible' }] });
    assert.strictEqual(found.length, 1);
    assert.match(found[0].detail, /scrolls sideways/);
});

check('PASS 4 names an unreachable control, and a "modal" Tab walks out of', () => {
    const unreachable = pass4Keyboard({ unreachable: [{ id: 'button.x', tag: 'button', why: 'tabindex="-1"' }], modal: { open: false } });
    assert.strictEqual(unreachable.length, 1);
    const leaky = pass4Keyboard({ modal: { open: true, kind: 'drawer open', escapees: [{ id: 'a.realm' }, { id: 'button.who' }] } });
    assert.strictEqual(leaky.length, 2);
    assert.match(leaky[0].detail, /walks out of something that claims to be modal/);
});

check('PASS 4 is silent when the modal actually contains the tab order', () => {
    assert.deepStrictEqual(pass4Keyboard({ modal: { open: true, kind: 'drawer open', escapees: [] } }), []);
});

// PASS 5 · the real animation the Track carries — a 2800ms `pulse` on the now-marker, running forever.
check('PASS 5 names an animation still running under reduced motion', () => {
    const found = pass5Motion({ reducedMotion: true, animations: [{ name: 'pulse', duration: 2800, iterations: null, el: 'div.now' }] });
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].pass, 5);
    assert.match(found[0].detail, /forever/);
});

check('PASS 5 says nothing about the same animation when reduced motion was NOT asked for', () => {
    assert.deepStrictEqual(pass5Motion({ reducedMotion: false, animations: [{ name: 'pulse', duration: 2800, iterations: null, el: 'div.now' }] }), []);
});

// ⚠️ A state change landing in 90ms is not an animation the reader is being asked to sit through; flagging it would make the pass fire on every well-built transition and get it suppressed.
check('PASS 5 ignores a short transition even under reduced motion', () => {
    assert.deepStrictEqual(pass5Motion({ reducedMotion: true, animations: [{ name: 'fade', duration: 90, iterations: 1, el: 'div.x' }] }), []);
});

// The ratchet has to move in BOTH directions or the registry rots into a list of names nothing renders — the same failure `portal:orphans`' KNOWN_ORPHANS is shaped to prevent. 🔴 THE SETTLE POLICY IS TESTED BECAUSE THE GATE ITSELF WENT NON-DETERMINISTIC ON IT. A fixed sleep is load-dependent, so `npm test` failed on Season's "closed again from the header's dead space" inside the full suite and passed five times when the same walk was run alone — the most expensive shape a gate can have, because a red run with no defect behind it sends the next session hunting. The earlier remedy was to raise that state's `waitMs` to 700, the highest in the registry; the class fix is to stop guessing at a duration and wait for the element the next step needs.
check('a step with no settle of its own keeps the 160ms default, and an explicit 0 means 0', () => {
    assert.deepStrictEqual(stepSettle({ click: '.x' }), { until: null, timeoutMs: 0, sleepMs: 160 });
    assert.deepStrictEqual(stepSettle({ click: '.x', waitMs: 700 }), { until: null, timeoutMs: 0, sleepMs: 700 });
    // ⚠️ `waitMs: 0` must NOT fall through to the default — the `slow` state is measured mid-flight and any wait at all would let its data arrive and destroy the thing being walked.
    assert.deepStrictEqual(stepSettle({ click: '.x', waitMs: 0 }), { until: null, timeoutMs: 0, sleepMs: 0 });
});

check('`until` replaces the sleep with a poll, and the two still compose when a step needs both', () => {
    assert.deepStrictEqual(stepSettle({ click: '.x', until: '.y' }), { until: '.y', timeoutMs: 5000, sleepMs: 0 });
    assert.deepStrictEqual(stepSettle({ click: '.x', until: '.y', untilMs: 900, waitMs: 50 }), { until: '.y', timeoutMs: 900, sleepMs: 50 });
});

// PASS 6 · the fused accessible name. The two it found on its first run were both real and both invisible to every other gate in this repo: the shell's commit link announced "4staged · review" on EVERY realm and every state, and Season's deadline flag announced "BATTLE PASS + RANKEDSep 10".
check('PASS 6 names an element whose accessible name runs two words together', () => {
    const found = pass6Names({ fusedNames: [{ id: 'a.hdr-commit', name: '4staged · review', joins: ['4\u205estaged · revie'] }] });
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].pass, 6);
    assert.match(found[0].detail, /runs words together/);
    assert.match(found[0].detail, /4staged/, 'the announced string is the evidence and must appear');
});

// The silence half, and it is the half that decides whether this pass survives contact. Three shapes must NOT fire: an element with nothing fused, one whose seam is punctuation ("5" + "%" is meant to read "5%"), and one carrying an explicit aria-label — which wins over name-from-contents, so Board's column headers announce correctly despite their fused text. The first two are filtered in COLLECT by requiring a word character on BOTH sides of the seam; the third by skipping labelled elements.
check('PASS 6 is silent when there is nothing fused to report', () => {
    assert.deepStrictEqual(pass6Names({ fusedNames: [] }), []);
    assert.deepStrictEqual(pass6Names({}), []);
});

check('the registry diff reports a new finding AND a recorded one that has been fixed', () => {
    const findings = [{ pass: 1, id: 'input.a', detail: '' }];
    const { fresh, fixed } = diffAgainstKnown(findings, ['1:input.b']);
    assert.deepStrictEqual(fresh.map((f) => f.id), ['input.a']);
    assert.deepStrictEqual(fixed, ['1:input.b']);
});

// 🔴 THE RETRY'S PREDICATE, AND THE CASE THAT MATTERS IS THE SILENT ONE. A stalled state is now re-walked once and classified, because a bigger deadline was tried three times (4000 → 12000 → 45000) and still failed on four different states across four runs. The danger of a retry is not the retry: it is retrying a GENUINE CRASH, which would then be run twice, might pass the second time, and would be reported as a race. So this predicate has to match the two sentences this file throws for an unreached subject and NOTHING else.
check('isStall names a subject that never appeared', () => assert.ok(isStall('state "manifest selection bar" did not reach its own subject — nothing matches .selbar.on within 45s after its steps ran')));
check('isStall names a step whose settle never landed', () => assert.ok(isStall('state "identity · closed again" stalled: nothing matched .identity.collapsed .srec-grid within 5000ms after its step ran')));
check('isStall is SILENT on a real crash, so a TypeError is never retried', () => assert.ok(!isStall("TypeError: Cannot read properties of undefined (reading 'getBoundingClientRect')")));
check('isStall is SILENT on a navigation failure', () => assert.ok(!isStall('net::ERR_CONNECTION_REFUSED at http://127.0.0.1:8901/harness.html')));
check('isStall is SILENT on a pass finding, which must fail the run rather than be re-walked', () => assert.ok(!isStall('PASS 1  cmdbar-input-composite  a 44px input inside a 34px wrapper')));
check('isStall tolerates a null message rather than throwing inside the catch', () => assert.ok(!isStall(null)));

// ── the --ci skip, added 2026-09-02 18:07 EDT ──────────────────────────────────────── The dangerous direction here is skipping on UNCERTAINTY: that turns a real portal change into a silent pass. Three of these five cases exist to pin the fail-closed behaviour rather than the skip.
check('a portal file means RUN', () => {
    assert.strictEqual(portalTouched(['docs/CHANGELOG.md', 'portal/ui/season.js']), true);
});
check('a scripts/portal* or mockup change means RUN', () => {
    assert.strictEqual(portalTouched(['scripts/portalDiff.mjs']), true);
    assert.strictEqual(portalTouched(['docs/superpowers/mockups/2026-08-20-portal/season.html']), true);
});
check('a dependency bump means RUN — it can move puppeteer under the walk', () => {
    assert.strictEqual(portalTouched(['package-lock.json']), true);
});
check('THE SKIP CAN HAPPEN: a docs-and-hooks diff means SKIP', () => {
    assert.strictEqual(portalTouched(['docs/CHANGELOG.md', '.claude/hooks/timestamp-check.sh', 'scripts/docs-audit.mjs', 'CLAUDE.md']), false);
});
check('a VERSION-only manifest bump is not a dependency change', () => {
    // Every release touches these two files. Counting that as a dependency change made the filter match everything, which is the same as having no filter -- caught on the first PR it met.
    assert.strictEqual(depsChanged('--- a/package.json\n+++ b/package.json\n-  "version": "3.73.0-pre",\n+  "version": "3.74.0-pre",'), false);
});
check('a REAL dependency change still counts', () => {
    assert.strictEqual(depsChanged('--- a/package.json\n+++ b/package.json\n-    "puppeteer-core": "^22.0.0",\n+    "puppeteer-core": "^23.0.0",'), true);
});
check('depsChanged fails closed on an empty diff', () => {
    assert.strictEqual(depsChanged(''), false);   // no manifest lines to keep => the files drop out, other files still decide
});

check('FAILS CLOSED: an empty or unknown file list means RUN, never skip', () => {
    assert.strictEqual(portalTouched([]), true);
    assert.strictEqual(portalTouched(null), true);
    assert.strictEqual(portalTouched(undefined), true);
});

console.log(`\n✅ ${passed} cases — every pass proven able to name its own defect, and proven silent on the correct version of the same shape.`);
