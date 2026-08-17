// Regression test for utils/requestContext.js — the AsyncLocalStorage interaction-context propagation + userHash hashing added for observability layer stage 1 (2026-08-16 12:22 EDT). Run: `node scripts/requestContext.test.js` (also via `npm test`).
//
// WHAT THIS CHECKS: (1) the property the whole design depends on — a context established for one interaction survives every await inside it and is never visible to a CONCURRENT interaction's own context; (2) userHash is a real keyed HMAC (deterministic, changes with the key, never the raw ID); (3) getContext() outside any runWithContext() call returns undefined, which is what makes logger.js's `lifecycle` fallback for non-interaction paths automatic rather than something each caller opts into.
const assert = require('assert');
const crypto = require('crypto');

let pass = 0; const failures = [];
async function t(name, fn) {
    try { await fn(); pass++; console.log(`  PASS  ${name}`); }
    catch (e) { failures.push([name, e.message]); console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

function freshModule() {
    delete require.cache[require.resolve('../utils/requestContext')];
    return require('../utils/requestContext');
}

async function main() {
    console.log('utils/requestContext.js — AsyncLocalStorage propagation + userHash');

    await t('getContext() is undefined outside any runWithContext() call', () => {
        const { getContext } = freshModule();
        assert.strictEqual(getContext(), undefined);
    });

    await t('context set at the top survives an await deep inside nested async calls', async () => {
        const { runWithContext, getContext } = freshModule();

        async function level3() {
            await new Promise((r) => setImmediate(r)); // force a real async hop
            return getContext();
        }
        async function level2() { return level3(); }
        async function level1() { return level2(); }

        const seen = await runWithContext({ command: 'probe' }, () => level1());
        assert.strictEqual(seen && seen.command, 'probe');
    });

    await t('two "concurrent" interactions never see each other\'s context', async () => {
        const { runWithContext, getContext } = freshModule();

        // Simulates the real router shape: each interaction gets its OWN runWithContext() call, and both are in flight at once (interleaved via setImmediate), same as two real Discord interactions arriving close together would be.
        async function simulateInteraction(id) {
            return runWithContext({ command: id }, async () => {
                await new Promise((r) => setImmediate(r));
                const mid = getContext();
                await new Promise((r) => setImmediate(r));
                const end = getContext();
                return { mid: mid && mid.command, end: end && end.command };
            });
        }

        const [a, b] = await Promise.all([simulateInteraction('A'), simulateInteraction('B')]);
        assert.strictEqual(a.mid, 'A'); assert.strictEqual(a.end, 'A');
        assert.strictEqual(b.mid, 'B'); assert.strictEqual(b.end, 'B');
    });

    await t('EventEmitter listeners registered inside runWithContext() keep the context', async () => {
        // The propagation risk the design spec explicitly calls out: "across the discord.js event boundary". discord.js dispatches interactionCreate through a plain Node EventEmitter, so this reproduces that shape directly rather than trusting it by analogy.
        const { EventEmitter } = require('events');
        const { runWithContext, getContext } = freshModule();

        const emitter = new EventEmitter();
        let observed;
        emitter.on('interactionCreate', async () => {
            await new Promise((r) => setImmediate(r));
            observed = getContext();
        });

        await runWithContext({ command: 'emitter-probe' }, async () => {
            emitter.emit('interactionCreate');
            await new Promise((r) => setTimeout(r, 10)); // let the listener's own hop finish
        });
        assert.strictEqual(observed && observed.command, 'emitter-probe');
    });

    await t('hashUserId never returns the raw id', () => {
        process.env.ANALYTICS_HMAC_KEY = Buffer.alloc(32, 7).toString('base64');
        const { hashUserId } = freshModule();
        const raw = '1139845545754632283';
        const hashed = hashUserId(raw);
        assert.notStrictEqual(hashed, raw);
        assert.ok(!hashed.includes(raw), 'hash must not embed the raw id as a substring');
        delete process.env.ANALYTICS_HMAC_KEY;
    });

    await t('hashUserId is deterministic and matches a real HMAC-SHA256 under the same key', () => {
        const key = Buffer.alloc(32, 7).toString('base64');
        process.env.ANALYTICS_HMAC_KEY = key;
        const { hashUserId } = freshModule();
        const raw = '1139845545754632283';
        const expected = crypto.createHmac('sha256', Buffer.from(key, 'base64')).update(raw).digest('hex');
        assert.strictEqual(hashUserId(raw), expected);
        assert.strictEqual(hashUserId(raw), hashUserId(raw), 'must be deterministic for the same id + key');
        delete process.env.ANALYTICS_HMAC_KEY;
    });

    await t('hashUserId changes when the key changes', () => {
        process.env.ANALYTICS_HMAC_KEY = Buffer.alloc(32, 1).toString('base64');
        const { hashUserId: hashA } = freshModule();
        const raw = '1139845545754632283';
        const a = hashA(raw);

        process.env.ANALYTICS_HMAC_KEY = Buffer.alloc(32, 2).toString('base64');
        const { hashUserId: hashB } = freshModule();
        const b = hashB(raw);

        assert.notStrictEqual(a, b, 'different keys must produce different hashes for the same id');
        delete process.env.ANALYTICS_HMAC_KEY;
    });

    await t('hashUserId(null/undefined) returns null rather than hashing a placeholder', () => {
        const { hashUserId } = freshModule();
        assert.strictEqual(hashUserId(null), null);
        assert.strictEqual(hashUserId(undefined), null);
    });

    console.log(`\n  ${pass} passed, ${failures.length} failed`);
    if (failures.length) process.exit(1);
}

main();
