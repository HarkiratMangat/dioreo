// scripts/portalTips.test.js — the tooltip nobody could read, and the placement that fails only at the edges.
//
// 🔴 TWENTY-SIX `data-tip` HOSTS AND NO RUNTIME TO READ THEM. The attribute is written across the Track's lane headers, its drag handles, the deadline rail and Review's rollback note, and the portal had no tooltip mechanism at all — so every one of those sentences was markup nobody could reach. `.tip` and `.tip .sub` sat defined and unused in the adopted stylesheet, which is precisely what hid it: an orphan check asks whether a class has a RULE, and these had one. Same shape as the six async states and the seven tier-3 ops before them.
//
// ⚠️ THE PLACEMENT ARITHMETIC IS TESTED HERE BECAUSE IT ONLY FAILS AT THE EDGES, which is where a hand-check does not look: a tip on the rightmost lane flows off screen, a tall one on the top row is clipped by the viewport rather than by anything visible, and a tip wider than either side of a centred mark overflows LEFT once it flips.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let failures = 0;
const say = console.log.bind(console);
function check(name, fn) {
    try { fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

say('portalTips — can the explanations be read, and do they land beside what they explain?');

const { tipPlacement, tipLines, TIP_GAP, TIP_EDGE } = require('../portal/ui/tips.logic');
const VP = { width: 1280, height: 900 };
const host = (left, right, top = 400, height = 20) => ({ left, right, top, height });

check('the tip sits to the RIGHT of the mark by default — the explanation follows the thing explained', () => {
    const p = tipPlacement(host(100, 180), { width: 200, height: 40 }, VP);
    assert.strictEqual(p.side, 'right');
    assert.strictEqual(p.x, 180 + TIP_GAP);
});

check('it flips left rather than running off the right edge', () => {
    const p = tipPlacement(host(1100, 1270), { width: 200, height: 40 }, VP);
    assert.strictEqual(p.side, 'left');
    assert.strictEqual(p.x, 1100 - 200 - TIP_GAP);
    assert.ok(p.x >= TIP_EDGE, 'the flip must not put it off the other edge');
});

// 🔴 THE HALF A HAND-CHECK NEVER REACHES. Clamping only the right edge leaves the failure in the other direction: a tip wider than the space on either side of a centred mark goes off screen LEFT the moment it flips, and nothing on the page shows it.
check('a tip too wide for either side is clamped, not flipped off the left edge', () => {
    const p = tipPlacement(host(600, 700), { width: 1200, height: 40 }, VP);
    assert.strictEqual(p.side, 'clamped');
    assert.strictEqual(p.x, TIP_EDGE);
});

check('THE CLAMP CAN FAIL: flipping without a floor puts the tip at a negative x', () => {
    assert.throws(() => {
        const x = 600 - 1200 - TIP_GAP;      // the flip, with no clamp after it
        assert.ok(x >= TIP_EDGE, `a bare flip lands at x=${x}`);
    }, /lands at x=-610/);
});

check('a mark at the top of the viewport does not push the tip above it', () => {
    const p = tipPlacement(host(100, 180, 2, 20), { width: 200, height: 120 }, VP);
    assert.strictEqual(p.y, TIP_EDGE);
});

check('a mark at the bottom does not push the tip below it', () => {
    const p = tipPlacement(host(100, 180, 890, 20), { width: 200, height: 120 }, VP);
    assert.strictEqual(p.y, VP.height - 120 - TIP_EDGE);
    assert.ok(p.y >= TIP_EDGE);
});

// ⚠️ A viewport SHORTER than the tip is not hypothetical — a three-line tip on a phone in landscape. The vertical clamp must still return a usable number rather than a negative one.
check('a tip taller than the viewport still lands at the top edge, never above it', () => {
    const p = tipPlacement(host(100, 180, 200, 20), { width: 200, height: 2000 }, VP);
    assert.strictEqual(p.y, TIP_EDGE);
});

check('the first line is the statement and the rest are qualifications', () => {
    assert.deepStrictEqual(tipLines('Outside the current window.\nPress FIT to bring it back.'),
        ['Outside the current window.', 'Press FIT to bring it back.']);
    assert.deepStrictEqual(tipLines('one line'), ['one line']);
    assert.deepStrictEqual(tipLines(''), [], 'an empty tip must produce no element at all rather than an empty box');
    assert.deepStrictEqual(tipLines('a\n\n  \nb'), ['a', 'b'], 'blank lines are spacing in the source, not rows in the tip');
});

// 🔴 CONSERVATION: every `data-tip` written must have something to say, and the runtime must actually be installed. Either half missing puts the portal back where it started — an attribute with no reader, or a reader with nothing to read.
check('every data-tip in portal/ui carries real text, and the runtime is installed from the Shell', () => {
    const UI = path.join(__dirname, '..', 'portal', 'ui');
    const files = fs.readdirSync(UI).filter((f) => f.endsWith('.js'));
    let hosts = 0;
    for (const f of files) {
        const src = fs.readFileSync(path.join(UI, f), 'utf8');
        for (const m of src.matchAll(/data-tip=(\$\{[^}]*\}|"[^"]*"|'[^']*')/g)) {
            hosts++;
            const v = m[1];
            assert.ok(v !== '""' && v !== "''", `${f} writes an empty data-tip — an attribute with nothing to say`);
        }
    }
    assert.ok(hosts >= 10, `only ${hosts} data-tip hosts found — the attribute spelling changed and this check has gone blind`);
    const shell = fs.readFileSync(path.join(UI, 'shell.js'), 'utf8');
    assert.ok(shell.includes('installTips()'), 'the Shell no longer installs the tooltip runtime, so every data-tip is unreadable again');
});

check('THE INSTALL CHECK CAN FAIL: a Shell that never installs the runtime is caught', () => {
    assert.throws(() => {
        assert.ok('export function Shell() {}'.includes('installTips()'), 'the runtime is not installed');
    }, /not installed/);
});

say(failures ? `\n✗ ${failures} failed` : '\n✅ portalTips: the explanations are reachable, and they land beside what they explain at every edge');
process.exit(failures ? 1 : 0);
