#!/usr/bin/env node
/**
 * analytics.test.mjs — coverage for the PURE half of scripts/analytics.mjs (observability layer stage 4). The Mongo-connecting reports (runSummary/runFailedSearches) are exercised by the live dev-bot boot test instead, per the same split every other script's test file in this repo uses.
 *
 * Run: node scripts/analytics.test.mjs (also via npm test)
 */

import assert from 'node:assert';
import { parseArgs, mergeRollups } from './analytics.mjs';

let pass = 0;
const fails = [];
function t(name, fn) {
    try { fn(); pass++; }
    catch (e) { fails.push(`${name}: ${e.message}`); }
}

// --- parseArgs -----------------------------------------------------------------------------
t('parseArgs defaults to the summary report with days=7, limit=20', () => {
    assert.deepStrictEqual(parseArgs([]), { report: 'summary', days: 7, limit: 20 });
});
t('parseArgs reads the report name positionally', () => {
    assert.strictEqual(parseArgs(['failed-searches']).report, 'failed-searches');
});
t('parseArgs reads --days and --limit', () => {
    const opts = parseArgs(['summary', '--days', '30', '--limit', '5']);
    assert.strictEqual(opts.days, 30);
    assert.strictEqual(opts.limit, 5);
});
t('parseArgs ignores a malformed --days value rather than producing NaN', () => {
    assert.strictEqual(parseArgs(['summary', '--days', 'not-a-number']).days, 7);
});

// --- mergeRollups ----------------------------------------------------------------------------
t('mergeRollups sums invocations, per-command totals, outcomes and entry across multiple days', () => {
    const totals = mergeRollups([
        { command: 'draws', invocations: 3, outcomes: { ok: 2, error: 1 }, entry: { slash: 3 } },
        { command: 'draws', invocations: 2, outcomes: { ok: 2 }, entry: { slash: 2 } },
        { command: 'calendar', invocations: 1, outcomes: { ok: 1 }, entry: { button: 1 } },
    ]);
    assert.strictEqual(totals.invocations, 6);
    assert.strictEqual(totals.byCommand.get('draws'), 5);
    assert.strictEqual(totals.byCommand.get('calendar'), 1);
    assert.strictEqual(totals.outcomes.ok, 5);
    assert.strictEqual(totals.outcomes.error, 1);
    assert.strictEqual(totals.entry.slash, 5);
    assert.strictEqual(totals.entry.button, 1);
});
t('mergeRollups returns empty totals for an empty roll-up set, not a crash', () => {
    const totals = mergeRollups([]);
    assert.strictEqual(totals.invocations, 0);
    assert.strictEqual(totals.byCommand.size, 0);
});
t('mergeRollups tolerates a roll-up doc with no outcomes/entry sub-objects', () => {
    const totals = mergeRollups([{ command: 'draws', invocations: 1 }]);
    assert.strictEqual(totals.invocations, 1);
    assert.deepStrictEqual(totals.outcomes, {});
});

/* ── report ───────────────────────────────────────────────────────────────── */

if (fails.length) {
    console.error(`analytics: ${pass} passed, ${fails.length} FAILED`);
    for (const f of fails) console.error(`  ✗ ${f}`);
    process.exit(1);
}
console.log(`analytics: ${pass}/${pass} checks passed`);
