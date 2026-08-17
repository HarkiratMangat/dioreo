// scripts/cloudObservability.test.js -- coverage for the PURE half of utils/cloudObservability.js (observability layer stage 4). Everything else in that module makes a real network call (ADC token fetch, Cloud Monitoring/Logging REST) and is deliberately NOT unit-testable without a live GCP service account -- that half is proven by the live dev-bot click-test instead, same split utils/vmpeaks.sh's own header documents for the transport it mirrors. Run: `node scripts/cloudObservability.test.js` (also via `npm test`).

const assert = require('assert');
const S = require('../utils/cloudObservability');

let failures = 0;
const checks = [];
function check(name, fn) { checks.push([name, fn]); }

// --- extractPeak ------------------------------------------------------------------------------
check('extractPeak returns the maximum doubleValue across all series and points', () => {
    const response = {
        timeSeries: [
            { points: [{ value: { doubleValue: 0.12 } }, { value: { doubleValue: 0.45 } }] },
            { points: [{ value: { doubleValue: 0.30 } }] },
        ],
    };
    assert.strictEqual(S.extractPeak(response), 0.45);
});
check('extractPeak returns null for an empty or missing timeSeries -- "no data yet", not zero', () => {
    assert.strictEqual(S.extractPeak({ timeSeries: [] }), null);
    assert.strictEqual(S.extractPeak({}), null);
    assert.strictEqual(S.extractPeak(null), null);
});
check('extractPeak ignores points with a missing or non-numeric doubleValue rather than crashing', () => {
    const response = { timeSeries: [{ points: [{ value: {} }, { value: { doubleValue: 0.2 } }, {}] }] };
    assert.strictEqual(S.extractPeak(response), 0.2);
});
check('extractPeak treats a real zero peak as zero, not "no data"', () => {
    const response = { timeSeries: [{ points: [{ value: { doubleValue: 0 } }] }] };
    assert.strictEqual(S.extractPeak(response), 0);
});

// --- constants worth pinning (regressions here silently change what the Health page queries) --
check('WINDOWS covers 24h/7d/30d, the trimmed set the panel design rule calls for', () => {
    assert.deepStrictEqual(S.WINDOWS.map(w => w.label), ['24h', '7d', '30d']);
    assert.strictEqual(S.WINDOWS.find(w => w.label === '24h').seconds, 86400);
    assert.strictEqual(S.WINDOWS.find(w => w.label === '30d').seconds, 2592000);
});
check('PROJECT/ZONE/VM match the constants scripts/vmpeaks.sh hardcodes -- the queries must target the same instance', () => {
    assert.strictEqual(S.PROJECT, 'gen-lang-client-0549308254');
    assert.strictEqual(S.ZONE, 'us-east1-b');
    assert.strictEqual(S.VM, 'diors-builds-bot');
});

(async () => {
    for (const [name, fn] of checks) {
        try { await fn(); console.log(`  ✓ ${name}`); }
        catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
    }
    if (failures > 0) { console.error(`❌ cloudObservability: ${failures} case(s) failed`); process.exit(1); }
    console.log(`✅ cloudObservability: ${checks.length} cases passed`);
    process.exit(0);
})();
