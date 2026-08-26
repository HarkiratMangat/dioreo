// scripts/portalChrome.test.js — the shared chrome's pure halves, and the one invariant that keeps a native dialog out of the portal.
//
// The chrome is the part every realm renders inside, so a defect here is eight defects. These are the pieces that can be checked without a browser: how the command bar ranks what you typed, whether ⌘K knows to stand down behind a modal, and whether a typed confirmation actually gates.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { paletteHits, paletteBlocked } = require('../portal/ui/palette.logic');
const { typedConfirmReady } = require('../portal/ui/overlay.logic');
const { permsAfter, describePending } = require('../portal/ui/access.logic');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.log(`  ✗ ${name}\n      ${e.message}`); }
}

console.log('portalChrome — the command bar, the modal guard, the typed gate');

// ── THE COMMAND BAR ──────────────────────────────────────────────────────────────────────────
const CMDS = [
    { label: 'Rack', local: true },
    { label: 'Coverage', local: true },
    { label: 'Add a build', local: true, keywords: ['new', 'create'] },
    { label: 'Access' },
    { label: 'Analytics' },
    { label: 'Sign out', keywords: ['logout', 'end session'] },
];

check('an empty query offers everything, in the order it was declared', () => {
    assert.deepStrictEqual(paletteHits(CMDS, '').map((c) => c.label), CMDS.map((c) => c.label));
    assert.deepStrictEqual(paletteHits(CMDS, '   ').map((c) => c.label), CMDS.map((c) => c.label));
});

check('a query that matches nothing returns nothing, so the empty state is reachable', () => {
    assert.deepStrictEqual(paletteHits(CMDS, 'zzzz'), []);
});

check('matching is case-insensitive in both directions', () => {
    assert.deepStrictEqual(paletteHits(CMDS, 'ACCESS').map((c) => c.label), ['Access']);
    assert.deepStrictEqual(paletteHits([{ label: 'ADD A BUILD' }], 'add').map((c) => c.label), ['ADD A BUILD']);
});

// 🔴 THE WHOLE POINT OF RANKING. "a" appears inside half of these labels, so an unranked filter answers a one-letter query with a list whose first row is whatever happened to be declared first.
check('a prefix match outranks a mere containment', () => {
    const hits = paletteHits([{ label: 'Clear the filters' }, { label: 'Armory' }], 'ar').map((c) => c.label);
    assert.deepStrictEqual(hits, ['Armory', 'Clear the filters'], 'Armory starts with the query; Clear only contains it');
});

check('a keyword match is the last tier, behind both label tiers', () => {
    const cmds = [{ label: 'Sign out', keywords: ['logout'] }, { label: 'Logbook' }];
    assert.deepStrictEqual(paletteHits(cmds, 'log').map((c) => c.label), ['Logbook', 'Sign out']);
});

check('being on this realm is a tiebreak, not an override', () => {
    // 'season' PREFIXES the global entry (rank 0) and is merely CONTAINED in the local one (rank 1 - 0.5), so the global still wins: locality is worth half a tier, never a whole one.
    const cmds = [{ label: 'Season' }, { label: 'Clamp to the season', local: true }];
    assert.deepStrictEqual(paletteHits(cmds, 'season').map((c) => c.label), ['Season', 'Clamp to the season']);
    // At the SAME tier — both prefixes — local wins.
    const same = [{ label: 'Season' }, { label: 'Search this page', local: true }];
    assert.deepStrictEqual(paletteHits(same, 'sea').map((c) => c.label), ['Search this page', 'Season']);
});

check('a command with no label and no keywords never matches, rather than matching everything', () => {
    assert.deepStrictEqual(paletteHits([{}], 'x'), []);
});

// ── ⌘K BEHIND A MODAL ────────────────────────────────────────────────────────────────────────
//
// This is the case a browser pass would not have caught either: the shortcut appears to work, the input takes focus, and nothing can be typed into it because the header is inert. The guard is the only thing standing between that and a page that looks broken.
const fakeDoc = (sel) => ({ querySelector: (q) => (q === sel ? {} : null) });

check('the command bar opens normally when no drawer is open', () => {
    assert.strictEqual(paletteBlocked(fakeDoc(null)), false);
});

check('the command bar is BLOCKED while a drawer is open — inert does not stop a document keydown', () => {
    assert.strictEqual(paletteBlocked(fakeDoc('.drawer.open')), true);
});

check('a missing or hostless document is not treated as blocked', () => {
    assert.strictEqual(paletteBlocked(null), false);
    assert.strictEqual(paletteBlocked({}), false);
});

// ── THE TYPED CONFIRMATION ───────────────────────────────────────────────────────────────────
check('the exact word opens the gate', () => {
    assert.strictEqual(typedConfirmReady('1139845545754632283', '1139845545754632283'), true);
});

check('surrounding whitespace is forgiven; a wrong character is not', () => {
    assert.strictEqual(typedConfirmReady('  AB12 ', 'AB12'), true);
    assert.strictEqual(typedConfirmReady('ab12', 'AB12'), false, 'case must matter');
    assert.strictEqual(typedConfirmReady('AB1', 'AB12'), false);
    assert.strictEqual(typedConfirmReady('AB123', 'AB12'), false);
});

// 🔴 THE VACUOUS PASS THIS EXISTS TO PREVENT. If an expectation goes missing — a caller that forgets `typed`, a changeset whose confirmText never got written — an empty-equals-empty comparison would return true and quietly turn a tier-3 drawer into a one-click destructive button.
check('an ABSENT expectation is never satisfied', () => {
    assert.strictEqual(typedConfirmReady('', ''), false);
    assert.strictEqual(typedConfirmReady('', null), false);
    assert.strictEqual(typedConfirmReady('anything', undefined), false);
});

// ── NO NATIVE DIALOGS, EVER AGAIN ────────────────────────────────────────────────────────────
//
// 🔴 A CONSERVATION GATE, NOT A STYLE RULE. board.js kept a native confirm() through the entire overlay build precisely because it WORKED — nothing was broken, so nothing looked. A browser dialog cannot carry a tier, cannot name the operation, cannot be made modal on the portal's own terms and cannot be styled at all, which is why the shared drawer exists; the count of native dialogs in portal/ui must be zero and stay zero.
check('no native confirm/alert/prompt survives anywhere in portal/ui', () => {
    const dir = path.join(__dirname, '..', 'portal', 'ui');
    const offenders = [];
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js'))) {
        fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((line, i) => {
            if (/^\s*(\/\/|\*|<!--)/.test(line.trim()) || line.includes('-->')) return;
            const m = line.match(/(?<![.\w$])(confirm|alert|prompt)\s*\(/);
            if (m) offenders.push(`portal/ui/${f}:${i + 1}  ${m[0]}`);
        });
    }
    assert.deepStrictEqual(offenders, [], 'a native dialog cannot say a tier or name an operation:\n  ' + offenders.join('\n  '));
});

check('THE DIALOG GATE CAN FAIL: a bare confirm( is caught and a namespaced one is not', () => {
    const hit = (s) => /(?<![.\w$])(confirm|alert|prompt)\s*\(/.test(s);
    assert.ok(hit('if (confirm(\'sure?\')) go();'), 'a bare native call must be caught');
    assert.ok(!hit('overlay.confirm({ title: 1 })'), 'the shared drawer must not be a false positive');
    assert.ok(!hit('confirmDiscard(c)'), 'a function whose NAME contains confirm must not be a false positive');
});

// ── THE ACCESS GRID'S RECOMPUTED PERMISSION LIST ─────────────────────────────────────────────
//
// The grid stages toggles and then writes the WHOLE list, because /api/access/grant replaces it. That makes the recomputation the one place a permission can be silently gained or lost.
check('a toggle on adds the scope and a toggle off removes it', () => {
    assert.deepStrictEqual(permsAfter(['manage.draws'], { 'manage.calendar': true }).sort(),
        ['manage.calendar', 'manage.draws']);
    assert.deepStrictEqual(permsAfter(['manage.draws', 'bot'], { bot: false }), ['manage.draws']);
});

check('no pending changes leaves the list exactly as it was', () => {
    assert.deepStrictEqual(permsAfter(['bot', 'manage'], {}), ['bot', 'manage']);
    assert.deepStrictEqual(permsAfter(['bot'], null), ['bot']);
});

// 🔴 A LIVE DOCUMENT CAN ALREADY HOLD A DUPLICATE. parsePermissionsInput accepts "manage, manage.draws", so a token can appear twice in models/AdminUser.js's array — and adding one with concat would make it three. Every duplicate is invisible in the grid and permanent.
check('the result is a SET, so an existing duplicate cannot be multiplied', () => {
    assert.deepStrictEqual(permsAfter(['bot', 'bot'], { bot: true }), ['bot']);
    assert.deepStrictEqual(permsAfter(['bot', 'bot'], { bot: false }), []);
});

check('turning a scope on that is already held changes nothing', () => {
    assert.deepStrictEqual(permsAfter(['manage'], { manage: true }), ['manage']);
});

check('the confirmation names the acts, split by direction, sorted', () => {
    const d = describePending({ b: true, a: false, c: true }, (k) => k.toUpperCase());
    assert.deepStrictEqual(d, { granted: ['B', 'C'], revoked: ['A'] });
    assert.deepStrictEqual(describePending({}, null), { granted: [], revoked: [] });
});

// ── THE MODULE-PARSE GATE ────────────────────────────────────────────────────────────────────
//
// 🔴 `node --check` PARSES AS COMMONJS, so it is a FALSE GREEN on these files. A stray backtick inside an HTML comment inside an html`` template closes the template early; the result parses fine as a script and fails as a module, which means the CommonJS check passes and the browser gets a SyntaxError. It has fired five times on this branch, twice inside the comment documenting the previous occurrence. buildPortal now parses every ESM file the way the browser will; this proves that check is not vacuous.
const { spawnSync } = require('child_process');
const parsesAsModule = (src) => spawnSync(process.execPath, ['--input-type=module', '--check'], { input: src, encoding: 'utf8' }).status === 0;

check('THE MODULE GATE CAN FAIL: a backtick inside an HTML comment in a template is caught', () => {
    const good = 'export const a = html`<div><!-- a plain comment --></div>`;';
    const bad = 'export const a = html`<div><!-- a comment with a ' + String.fromCharCode(96) + 'chip' + String.fromCharCode(96) + ' in it --></div>`;';
    assert.strictEqual(parsesAsModule(good), true, 'the clean form must pass, or the gate proves nothing');
    assert.strictEqual(parsesAsModule(bad), false, 'the backtick form must fail — this is the trap the gate exists for');
});

check('every ESM file the build emits parses as a module', () => {
    const dir = path.join(__dirname, '..', 'portal', 'ui');
    const bad = fs.readdirSync(dir)
        .filter((f) => f.endsWith('.js') && !f.endsWith('.logic.js'))
        .filter((f) => !parsesAsModule(fs.readFileSync(path.join(dir, f), 'utf8')));
    assert.deepStrictEqual(bad, [], 'these would reach the browser as a SyntaxError: ' + bad.join(', '));
});

process.exit(failures ? 1 : 0);
