// scripts/portalStates.test.mjs — proves the states harness's three passes CAN FAIL, on the exact defects they were written for.
//
// 🔴 THE HISTORICAL CASE IS THE FIRST TEST. The command bar's input measured 44px tall, with its own 1px border and its own background, inside a 34px wrapper painting both — for weeks, reported twice by a human, with every gate in the suite green. If PASS 1 fed those numbers stays silent, the harness is decoration. Everything else here is the same discipline: feed the shape, assert it is named, then feed the CORRECT version of the same shape and assert silence, because a pass that fires on everything gets suppressed rather than obeyed.
import assert from 'assert';
import { pass1Composite, pass3Space, pass4Keyboard, diffAgainstKnown } from './lib/portalStatePasses.cjs';

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

// The ratchet has to move in BOTH directions or the registry rots into a list of names nothing renders — the same failure `portal:orphans`' KNOWN_ORPHANS is shaped to prevent.
check('the registry diff reports a new finding AND a recorded one that has been fixed', () => {
    const findings = [{ pass: 1, id: 'input.a', detail: '' }];
    const { fresh, fixed } = diffAgainstKnown(findings, ['1:input.b']);
    assert.deepStrictEqual(fresh.map((f) => f.id), ['input.a']);
    assert.deepStrictEqual(fixed, ['1:input.b']);
});

console.log(`\n✅ ${passed} cases — every pass proven able to name its own defect, and proven silent on the correct version of the same shape.`);
