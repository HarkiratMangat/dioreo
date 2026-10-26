// DEV-ONLY seed for the two /bot analytics pages that have never been seen with production-shaped data.
//
// WHY THIS EXISTS. The dev bot emits almost nothing but `info` alerts and a handful of AnalyticsEvent rows, so the Alerts page's severity signature and the Usage/Timing pages' dense layouts have only ever been verified EMPTY. Three identical rows prove nothing about whether severities are distinguishable, and a two-command bar chart proves nothing about whether bars stay inside 32 columns once a long command name is in the mix.
//
// ⚠️ THIS IS A REHEARSAL, NOT THE THING. A seed you keep adjusting until the page looks right proves only that you can adjust a seed. The spread below is fixed deliberately -- one row per severity, and durations placed one per felt-speed band including a genuine ack breach -- so "the three most recent are STILL not distinguishable at a glance" is a reportable result about the page's design, not a cue to re-run with nicer numbers. Re-check against real traffic after the first deploy; a seeded shape is a rehearsal.
//
// ⚠️ WRITES THROUGH THE REAL STORES, never raw Model.create(). recordAlert() allocates the daily alertId (a raw create leaves it null, and the field is `unique` -- the second row would collide), and buildEventDocument() is the only thing that knows an AnalyticsEvent's real shape. A hand-built document would drift from both, and Mongoose silently DROPS any field the schema does not declare -- so a seed built on invented field names looks like it worked and stores nothing. That is this repo's oldest recorded bug class (CLAUDE.md's schema gotcha) and it very nearly happened writing this file.
//
// ⚠️ REFUSES TO RUN OUTSIDE DEVELOPMENT. It writes fabricated alert and analytics rows; those must never enter the real log.
//
// Run: node --env-file=.env.dev scripts/seedAnalyticsShapes.js          (add --clear to remove what it wrote)
require('dotenv').config();
const mongoose = require('mongoose');

const CLEAR = process.argv.includes('--clear');
// Carried in a field that REALLY EXISTS on each schema, so --clear is exact rather than a date-range guess: AlertLog has `detail` (a string), AnalyticsEvent has `detail` (an object).
const MARK = 'seed:analytics-shapes';

// One per level, so the page's own severity signature is exercised rather than asserted. Levels match models/AlertLog.js's `level` field, not an invented `severity`.
const ALERTS = [
    { level: 'error', title: 'Gateway disconnected', detail: 'Shard 0 closed with code 4000 and did not resume.' },
    { level: 'warn', title: 'Cloudinary upload failed', detail: 'A draw thumbnail fell back to its source URL.' },
    { level: 'caution', title: 'Slow interaction', detail: '/colors took 9.1s after deferring.' },
    { level: 'info', title: 'Daily heartbeat', detail: 'Uptime 21h, 0 restarts.' },
];

// One per felt-speed band, plus a genuine ACK breach and a deliberately long command name -- the two cases a 32-column bar chart is most likely to break on.
const TIMINGS = [
    { command: 'draws', ackMs: 180, durations: [210, 240, 260, 300, 280] },
    { command: 'gunsmiths', ackMs: 320, durations: [800, 950, 1100, 1250, 900] },
    { command: 'colors', ackMs: 410, durations: [4200, 5100, 9100, 6300, 4800] },
    { command: 'timestamp', ackMs: 90, durations: [110, 120, 105, 130, 115] },
    // The ONLY thing Discord's 3,000ms limit actually governs is the ack. Post-defer the window is 15 minutes -- see the spec's finding #1.
    { command: 'drawprices', ackMs: 3400, durations: [3600, 3800, 3500, 3900, 3700] },
];

(async () => {
    if (process.env.NODE_ENV !== 'development') {
        console.error('Refusing to run: NODE_ENV is not "development". This writes fabricated alert and analytics rows and must never touch prod.');
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    const AlertLog = require('../models/AlertLog');
    const AnalyticsEvent = require('../models/AnalyticsEvent');
    const { recordAlert } = require('../utils/alertStore');

    if (CLEAR) {
        const a = await AlertLog.deleteMany({ detail: new RegExp(MARK) });
        const e = await AnalyticsEvent.deleteMany({ 'detail.seed': MARK });
        console.log(`Cleared ${a.deletedCount} alert row(s) and ${e.deletedCount} analytics row(s).`);
        await mongoose.disconnect();
        return;
    }

    const now = Date.now();
    let n = 0;
    for (const a of ALERTS) {
        // recordAlert is fire-and-forget by contract (it can never throw into its caller), so it is awaited here only if it returns a promise -- and the rows are written oldest-first so the page's newest-first ordering puts `error` on top.
        await Promise.resolve(recordAlert({ ...a, detail: `${a.detail} [${MARK}]` }));
        n++;
    }
    for (const t of TIMINGS) {
        for (const [i, d] of t.durations.entries()) {
            await AnalyticsEvent.create({
                command: t.command, entry: 'slash', outcome: 'ok', context: 'guild',
                ackMs: t.ackMs, durationMs: d,
                detail: { seed: MARK },
                createdAt: new Date(now - i * 600_000),
            });
            n++;
        }
    }
    console.log(`Seeded ${n} row(s). Open /bot analytics -> Alerts, Usage and Timing ON A PHONE and report what you see -- including "still not distinguishable", which is a finding about the page, not about the data.`);
    await mongoose.disconnect();
})();
