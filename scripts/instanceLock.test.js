// scripts/instanceLock.test.js
// Regression test for utils/instanceLock.js's `isHolderAlive` helper -- proves the fix for the
// `node --watch` restart race (see docs/db-deferred-list.md's 🐞 Active Bugs entry): a lock held by
// a DEAD pid on THIS host must be treated as stale regardless of how fresh its heartbeat looks,
// while a lock on ANOTHER host must never be probed (this machine can't send a signal to a remote pid).
// Run: `node scripts/instanceLock.test.js` (also runs via `npm test`).
const os = require('os');
const assert = require('assert');
const { isHolderAlive } = require('../utils/instanceLock');

let pass = 0; const failures = [];
function t(name, fn) {
    try { fn(); pass++; console.log(`  PASS  ${name}`); }
    catch (e) { failures.push([name, e.message]); console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

console.log('instanceLock.js — proofs');

const realHostname = os.hostname;
const realKill = process.kill;
function restore() { os.hostname = realHostname; process.kill = realKill; }

t('a dead pid on THIS host is reported not-alive (the --watch race)', () => {
    os.hostname = () => 'this-mac';
    process.kill = () => { const e = new Error('ESRCH'); e.code = 'ESRCH'; throw e; };
    try {
        assert.strictEqual(isHolderAlive({ hostname: 'this-mac', pid: 99999 }), false);
    } finally { restore(); }
});

t('a live pid on THIS host is reported alive', () => {
    os.hostname = () => 'this-mac';
    process.kill = () => true; // no throw = signal delivered = pid exists
    try {
        assert.strictEqual(isHolderAlive({ hostname: 'this-mac', pid: process.pid }), true);
    } finally { restore(); }
});

t('a lock on a DIFFERENT host is never probed and always treated as alive', () => {
    os.hostname = () => 'this-mac';
    process.kill = () => { throw new Error('must never be called for a remote host'); };
    try {
        assert.strictEqual(isHolderAlive({ hostname: 'prod-vm', pid: 1 }), true);
    } finally { restore(); }
});

console.log(`\n  ${pass} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
