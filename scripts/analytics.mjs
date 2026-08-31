#!/usr/bin/env node
// ==========================================
// ANALYTICS CLI -- reads the observability layer's event/roll-up/search-term data outside Discord
// ==========================================
// Stage 4: docs/superpowers/specs/2026-08-16-observability-layer-design.md §6, "Outside Discord: direct Mongo queries (zero build), plus scripts/analytics.mjs for recurring questions." Two reports:
//
//   node scripts/analytics.mjs summary [--days N]           (default 7)
//   node scripts/analytics.mjs failed-searches [--limit N]  (default 20)
//
// Prefers AnalyticsRollup (utils/rollupStore.js's daily roll-ups) for any day already rolled up, and falls back to a live AnalyticsEvent aggregation for today (never rolled up by design -- see utils/rollupStore.js's catchUpRollups()) and any day the roll-up job hasn't reached yet. This is the same "recent-window questions don't need roll-ups" reasoning commands/bot.js's Usage/Timing pages already use -- this script just extends it across a longer, possibly-mixed window.
//
// ⚠️ NOT run with a read-only Atlas user yet -- the design flags one as "worth creating regardless" for exactly this script, to avoid handing the analysis path a read-write production credential. Creating that user is an Atlas console/API action outside this repo's reach from here; it's filed in docs/db-deferred-list.md rather than done silently. Until then this reads MONGODB_URI from .env like every other script in this repo.

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pure. Exported for scripts/analytics.test.mjs.
export function parseArgs(argv) {
    const [report, ...rest] = argv;
    const opts = { days: 7, limit: 20 };
    for (let i = 0; i < rest.length; i++) {
        if (rest[i] === '--days') opts.days = parseInt(rest[++i], 10) || opts.days;
        if (rest[i] === '--limit') opts.limit = parseInt(rest[++i], 10) || opts.limit;
    }
    return { report: report || 'summary', ...opts };
}

// Pure. Merges a raw AnalyticsRollup document set with live counts for days not yet rolled up, into one flat totals object. Exported for scripts/analytics.test.mjs.
export function mergeRollups(rollupDocs) {
    const totals = { invocations: 0, byCommand: new Map(), outcomes: {}, entry: {} };
    for (const r of rollupDocs) {
        totals.invocations += r.invocations || 0;
        totals.byCommand.set(r.command, (totals.byCommand.get(r.command) || 0) + (r.invocations || 0));
        for (const [k, v] of Object.entries(r.outcomes || {})) totals.outcomes[k] = (totals.outcomes[k] || 0) + v;
        for (const [k, v] of Object.entries(r.entry || {})) totals.entry[k] = (totals.entry[k] || 0) + v;
    }
    return totals;
}

function printTable(title, entries) {
    console.log(`\n${title}`);
    if (!entries.length) { console.log('  (no data)'); return; }
    for (const [k, v] of entries) console.log(`  ${String(k).padEnd(20)} ${v}`);
}

async function connectMongo() {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    const mongoose = require('mongoose');
    // Prefers a read-only credential scoped to this analysis path over the read-write MONGODB_URI every other script uses, per docs/superpowers/specs/2026-08-16-observability-layer-design.md's storage-growth section. Falls back to MONGODB_URI so this script keeps working before the read-only user exists (see docs/db-deferred-list.md) or if ANALYTICS_READONLY_URI is ever unset.
    const uri = process.env.ANALYTICS_READONLY_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error('ANALYTICS_READONLY_URI or MONGODB_URI must be set (check .env)');
    await mongoose.connect(uri);
    return mongoose;
}

async function runSummary({ days }) {
    const mongoose = await connectMongo();
    const { dayKey, daysBetweenInclusive, prevDayKey } = require('../utils/rollupStore');
    const AnalyticsRollup = require('../models/AnalyticsRollup');
    const AnalyticsEvent = require('../models/AnalyticsEvent');

    const todayKey = dayKey(new Date());
    let fromKey = todayKey;
    for (let i = 0; i < days - 1; i++) fromKey = prevDayKey(fromKey);
    const targetDays = daysBetweenInclusive(fromKey, todayKey);

    const rollupDocs = await AnalyticsRollup.find({ day: { $in: targetDays } }).lean();
    const rolledDays = new Set(rollupDocs.map(r => r.day));
    const missingDays = targetDays.filter(d => !rolledDays.has(d));

    let liveTotals = { invocations: 0, byCommand: new Map(), outcomes: {}, entry: {} };
    if (missingDays.length) {
        const { start } = require('../utils/rollupStore').dayBounds(missingDays[0]);
        const { end } = require('../utils/rollupStore').dayBounds(missingDays[missingDays.length - 1]);
        const [byCommand, byOutcome, byEntry, total] = await Promise.all([
            AnalyticsEvent.aggregate([{ $match: { createdAt: { $gte: start, $lt: end }, isAdmin: false } }, { $group: { _id: '$command', c: { $sum: 1 } } }]),
            AnalyticsEvent.aggregate([{ $match: { createdAt: { $gte: start, $lt: end } } }, { $group: { _id: '$outcome', c: { $sum: 1 } } }]),
            AnalyticsEvent.aggregate([{ $match: { createdAt: { $gte: start, $lt: end } } }, { $group: { _id: '$entry', c: { $sum: 1 } } }]),
            AnalyticsEvent.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        ]);
        liveTotals.invocations = total;
        for (const r of byCommand) liveTotals.byCommand.set(r._id || '?', r.c);
        for (const r of byOutcome) liveTotals.outcomes[r._id || '?'] = r.c;
        for (const r of byEntry) liveTotals.entry[r._id || '?'] = r.c;
    }

    const rolled = mergeRollups(rollupDocs);
    const invocations = rolled.invocations + liveTotals.invocations;
    const byCommand = new Map(rolled.byCommand);
    for (const [k, v] of liveTotals.byCommand) byCommand.set(k, (byCommand.get(k) || 0) + v);
    const outcomes = { ...rolled.outcomes };
    for (const [k, v] of Object.entries(liveTotals.outcomes)) outcomes[k] = (outcomes[k] || 0) + v;
    const entry = { ...rolled.entry };
    for (const [k, v] of Object.entries(liveTotals.entry)) entry[k] = (entry[k] || 0) + v;

    console.log(`Dioreo analytics summary — last ${days} day(s) (${fromKey} to ${todayKey})`);
    console.log(`Roll-ups covered ${rolledDays.size}/${targetDays.length} day(s); ${missingDays.length} queried live.`);
    console.log(`\nTotal interactions: ${invocations.toLocaleString()}`);
    printTable('Top commands:', [...byCommand.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15));
    printTable('Outcome breakdown:', Object.entries(outcomes).sort((a, b) => b[1] - a[1]));
    printTable('Entry point breakdown:', Object.entries(entry).sort((a, b) => b[1] - a[1]));
    await mongoose.disconnect();
}

async function runFailedSearches({ limit }) {
    const mongoose = await connectMongo();
    const SearchTerm = require('../models/SearchTerm');
    const rows = await SearchTerm.find({ zeroResults: { $gt: 0 } }).sort({ zeroResults: -1 }).limit(limit).lean();
    console.log(`Dioreo analytics — top ${rows.length} failed search term(s) (by zero-result count)`);
    if (!rows.length) console.log('  (no failed searches recorded)');
    for (const r of rows) {
        console.log(`  "${r.term}"  (${r.command}.${r.field})  zero-results: ${r.zeroResults}/${r.searches}  picked-after: ${r.picked}`);
    }
    await mongoose.disconnect();
}

async function main() {
    const opts = parseArgs(process.argv.slice(2));
    if (opts.report === 'summary') return runSummary(opts);
    if (opts.report === 'failed-searches') return runFailedSearches(opts);
    console.log('Usage: node scripts/analytics.mjs <summary|failed-searches> [--days N] [--limit N]');
    process.exitCode = 1;
}

// Only run when invoked directly -- scripts/analytics.test.mjs imports parseArgs/mergeRollups without wanting a live Mongo connection, same guard reflow-prose.mjs's header names as a trap it already paid for (a test importing a CLI's exports ran the whole program before any assertion could execute).
//
// pathToFileURL(), not a hand-built `file://${...}` template (v3-pre-release review, finding #13) -- import.meta.url is percent-encoded, so a checkout path containing a space (this repo's own "Diors-Builds" lives under "Claude Code/") could never equal the raw-path template: main() was silently never called, and both subcommands exited 0 having done nothing. Matches the guard scripts/reflow-comments.mjs and scripts/reflow-prose.mjs already use.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
    main().catch((err) => { console.error(err); process.exitCode = 1; });
}
