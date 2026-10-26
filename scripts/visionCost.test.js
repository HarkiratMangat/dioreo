// scripts/visionCost.test.js
//
// utils/visionExtract.js's cost estimate (2026-10-19 18:14 EDT, the move to gemini-3.8-flash). No Vertex call: usageMetadata is a fixed object. Pins the three things a future edit could break silently, because the estimate only ever shows up as a number in a journald line that nobody checks against the bill:
//  - the model id is the one the pricing table was written for,
//  - 3.8 Flash's introductory rate gives way to the standard one on 2027-01-01 (a single constant would under-report every call after that by half),
//  - thinking tokens count as output, since Google bills them at the output rate.
const assert = require('assert');
const { estimateVisionCostUsd, MODEL } = require('../utils/visionExtract');

let failed = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${err.message.split('\n').join('\n      ')}`); }
}
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !== ${b}`);
const MILLION = { promptTokenCount: 1_000_000, candidatesTokenCount: 1_000_000 };

console.log('visionCost');
check('MODEL is gemini-3.8-flash, the model PRICING_PER_1M_TOKENS was written for', () => {
    assert.strictEqual(MODEL, 'publishers/google/models/gemini-3.8-flash');
});
check('introductory rate through 2026-12-31, regional (the us default) and global', () => {
    const at = new Date('2026-12-31T23:59:59Z');
    close(estimateVisionCostUsd('us', MILLION, at).estimatedCostUsd, 0.825 + 4.125);
    close(estimateVisionCostUsd('global', MILLION, at).estimatedCostUsd, 0.75 + 3.75);
});
check('standard rate from 2027-01-01', () => {
    const at = new Date('2027-01-01T00:00:00Z');
    close(estimateVisionCostUsd('us', MILLION, at).estimatedCostUsd, 1.65 + 8.25);
    close(estimateVisionCostUsd('global', MILLION, at).estimatedCostUsd, 1.50 + 7.50);
});
check('thinking tokens are billed as output', () => {
    const out = estimateVisionCostUsd('us', { promptTokenCount: 0, candidatesTokenCount: 200, thoughtsTokenCount: 800 }, new Date('2026-10-19T22:00:00Z'));
    assert.strictEqual(out.outputTokens, 1000);
    close(out.estimatedCostUsd, (1000 / 1_000_000) * 4.125);
});
check('missing usageMetadata costs zero instead of throwing', () => {
    const out = estimateVisionCostUsd('us', undefined);
    assert.deepStrictEqual(out, { inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 });
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
