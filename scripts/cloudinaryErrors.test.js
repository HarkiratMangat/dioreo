// utils/cloudinaryErrors.js: the one Cloudinary error sanitizer (2026-11-08 01:17 EST, replacing ten per-module copies).
// Pins the two halves of the CLAUDE.md secret-logging ban: the message never carries the key or secret, and no module grows its own copy back.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { safeErrorMessage, errorHttpCode } = require('../utils/cloudinaryErrors');

let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}: ${e.message}`); } };

// The Admin API's rejected-promise shape, with a recognisable key and secret.
const adminErr = { request_options: { auth: 'KEY_1234567890:SECRET_abcdefghij' }, error: { message: 'Resource not found - draws/x', http_code: 404 } };

check('the message never carries the API key or secret', () => {
    const m = safeErrorMessage(adminErr);
    assert.strictEqual(m, 'Resource not found - draws/x');
    assert(!/KEY_1234567890|SECRET_abcdefghij/.test(m));
});
check('an Error keeps its own message', () => assert.strictEqual(safeErrorMessage(new Error('boom')), 'boom'));
check('anything else is a fixed string', () => {
    assert.strictEqual(safeErrorMessage(null), 'Unknown Cloudinary error');
    assert.strictEqual(safeErrorMessage({ request_options: { auth: 'K:S' } }), 'Unknown Cloudinary error');
});
check('http_code is read where the Admin API nests it, and at the top', () => {
    assert.strictEqual(errorHttpCode(adminErr), 404);
    assert.strictEqual(errorHttpCode({ http_code: 420 }), 420);
    assert.strictEqual(errorHttpCode({}), null);
});
check('no module defines its own copy', () => {
    const roots = ['utils', 'commands', 'handlers', 'core', 'bot', 'portal', 'scripts'];
    const copies = [];
    const walk = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue; }
            if (!e.name.endsWith('.js') || p.endsWith(path.join('utils', 'cloudinaryErrors.js')) || p.endsWith('cloudinaryErrors.test.js')) continue;
            if (/^\s*((async\s+)?function\s+(safeErrorMessage|errorHttpCode)\s*\(|(const|let|var)\s+(safeErrorMessage|errorHttpCode)\s*=)/m.test(fs.readFileSync(p, 'utf8'))) copies.push(p);
        }
    };
    for (const r of roots) walk(path.join(__dirname, '..', r));
    assert.deepStrictEqual(copies, []);
});

if (failed) { console.log(`❌ cloudinaryErrors: ${failed} case(s) failed`); process.exit(1); }
console.log('✅ cloudinaryErrors: all cases passed');
