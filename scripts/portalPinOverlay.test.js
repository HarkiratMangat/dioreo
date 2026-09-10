// scripts/portalPinOverlay.test.js — the dev-only annotation overlay stays dev-only.
//
// 🔴 THE WHOLE RISK OF THIS FEATURE IS ONE BIT. `portal/dev/pin.js` mounts a click-capturing overlay over every element on the page; on production that is not a nice-to-have gone wrong, it is a portal whose controls no longer work. Three independent things have to hold, and each is checked separately below rather than inferred from the others: the gate says no in production, the script is not in the module graph the build bundles, and the built `index.html` does not carry the tag.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pinEnabled, injectPin } = require('../portal/server');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('the overlay is OFF in production and on everywhere else', () => {
    assert.strictEqual(pinEnabled('production'), false, 'production must never mount it');
    assert.strictEqual(pinEnabled('development'), true);
    assert.strictEqual(pinEnabled(undefined), true, 'an unset NODE_ENV is a dev machine, matching server.js line 96');
});

check('THE GATE CAN FAIL: a truthy env that is not production still mounts it', () => {
    // The mistake this forbids is `pinEnabled = (env) => env === 'development'`, which silently turns the overlay off on every machine that sets NODE_ENV to anything else — test, staging, a bare shell.
    assert.strictEqual(pinEnabled('test'), true);
    assert.strictEqual(pinEnabled('staging'), true);
});

check('injectPin puts the tag inside the document and nowhere else', () => {
    const out = injectPin('<html><body><div id="app"></div></body></html>');
    assert.ok(out.includes('<script src="/__pin.js" defer></script>'), 'the tag is added');
    assert.ok(out.indexOf('__pin.js') < out.indexOf('</body>'), 'and it is inside the body');
    assert.ok(out.includes('<div id="app"></div>'), 'the document is otherwise untouched');
});

check('injectPin leaves a document with no </body> alone rather than throwing', () => {
    const odd = '<html><div>fragment</div>';
    assert.strictEqual(injectPin(odd), odd, 'a fragment is returned unchanged');
});

check('the overlay is NOT in portal/ui, so the build cannot bundle it', () => {
    // scripts/buildPortal.js globs `portal/ui/*.js` and turns every one into a module in the shipped graph. A file placed there would ship to production no matter what pinEnabled says, and no test of the gate would notice — which is why the location is asserted rather than the gate alone.
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'portal', 'dev', 'pin.js')), 'it lives in portal/dev');
    assert.ok(!fs.existsSync(path.join(__dirname, '..', 'portal', 'ui', 'pin.js')), 'and must never appear in portal/ui');
    const ui = fs.readdirSync(path.join(__dirname, '..', 'portal', 'ui'));
    assert.ok(!ui.some((f) => /pin/i.test(f)), `no pin file in the bundled directory: ${ui.filter((f) => /pin/i.test(f)).join(', ')}`);
});

check('the BUILT index.html does not carry the tag — it is injected at serve time', () => {
    const built = path.join(__dirname, '..', 'portal', 'public', 'index.html');
    if (!fs.existsSync(built)) return;                    // a fresh clone before the first build
    const html = fs.readFileSync(built, 'utf8');
    assert.ok(!html.includes('__pin'), 'a built artifact that carries the tag would ship the overlay');
});

process.exit(failures ? 1 : 0);
