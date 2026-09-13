// scripts/seedAnalyticsTraffic.js — DEV-ONLY: 30 days of realistic analytics traffic, so Usage, Timing, Reach and Search can be judged POPULATED.
//
// WHY THIS EXISTS. Portal pins batch 2 (spec §2 and §9, pin `pmtxvgtt6`): the Analytics "icons are bugged" pin was four empty states, because the dev database holds no traffic. Harkirat has never seen those four views with data. `scripts/seedAnalyticsShapes.js` is the sibling and is deliberately tiny — one row per severity and speed band, a rehearsal of LAYOUT extremes. This one is the opposite job: VOLUME and spread over a month, so a populated panel can be looked at the way production will fill it.
//
// ⚠️ THE GUARD IS THE POINT. It refuses unless the Mongo host is loopback AND the database name is dev-named — the same two-condition rule as `scripts/seedDevData.js`'s assertDevTarget, because either alone is defeated by one ordinary mistake. `--refuse-test-remote` exercises the refusal against a fabricated remote URI so the guard is proven able to fire.
//
// ⚠️ NO REAL PERSON IN IT. `userHash` values are `seed-user-NN`, not HMAC-shaped, so they can never collide with or be mistaken for a pseudonym of a real account. Every row carries `detail.seed` so `--clear` removes exactly what this wrote and nothing else.
//
// 🔴 ROLL-UPS. utils/rollupStore.js rolls AnalyticsEvent into AnalyticsRollup from the dev bot's daily heartbeat, catching up 14 days. Once the dev bot runs, the seeded days become roll-up documents that deleting events alone would leave behind — measured 2026-09-13 18:59 EDT: 0 roll-ups written since seeding, because the dev bot was not running. So `--clear` also deletes the roll-ups for every day this seed covers; the next catch-up recomputes them from whatever real events remain.
//
// ⚠️ Deterministic (seeded PRNG), so two runs produce the same distribution and a screenshot is reproducible. Re-running clears its own rows first rather than appending.
//
//   node --env-file=.env.dev scripts/seedAnalyticsTraffic.js           # replace this seed's rows
//   node --env-file=.env.dev scripts/seedAnalyticsTraffic.js --clear   # remove them
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const MARK = 'seed:analytics-traffic';
const DAYS = 30;
const DAY_MS = 86400 * 1000;

function assertDevTarget(uri) {
    if (!uri) throw new Error('MONGODB_URI is not set. Run with --env-file=.env.dev.');
    const local = /(^|@|\/\/)(localhost|127\.0\.0\.1)(:|\/)/.test(uri);
    const dbName = (uri.split('/').pop() || '').split('?')[0];
    const devNamed = /-dev\b|_dev\b|^dev-/.test(dbName);
    if (!local || !devNamed) {
        throw new Error(`REFUSING TO RUN: this writes fabricated analytics rows and only runs against a local, dev-named database.\n  host is loopback : ${local}\n  database name    : ${dbName || '(none)'} (dev-named: ${devNamed})`);
    }
    return dbName;
}

// mulberry32 — small, seeded, good enough for a spread.
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(20260913);
const pick = (arr) => arr[Math.floor(R() * arr.length)];
const weighted = (pairs) => { const total = pairs.reduce((s, [, w]) => s + w, 0); let x = R() * total; for (const [v, w] of pairs) { if ((x -= w) < 0) return v; } return pairs[0][0]; };
const around = (median, spread) => Math.max(20, Math.round(median * Math.exp((R() - 0.5) * spread)));

// Weight = relative popularity; ack/dur = median ms. `drawprices` is the slow one and `colors` the heavy renderer, which is what production shows.
const COMMANDS = [
    { command: 'gunsmiths', subs: ['search', 'list'], w: 30, ack: 260, dur: 900, deps: ['mongo'], search: { field: 'weapon', terms: ['kilo', 'krig 6', 'ak117', 'dl q33', 'cbr4', 'maddox', 'hvk', 'qq9', 'rus-79u', 'fennec', 'kilo 141', 'bp50', 'xyz rifle'] } },
    { command: 'draws', subs: ['current', 'upcoming'], w: 22, ack: 180, dur: 320, deps: ['mongo', 'cloudinary'] },
    { command: 'calendar', subs: [null], w: 12, ack: 200, dur: 420, deps: ['mongo'] },
    { command: 'timestamp', subs: [null], w: 10, ack: 90, dur: 120, deps: [] },
    { command: 'patchnotes', subs: [null], w: 8, ack: 210, dur: 650, deps: ['mongo', 'cloudinary'] },
    { command: 'colors', subs: [null], w: 7, ack: 420, dur: 4800, deps: ['cloudinary'] },
    { command: 'drawprices', subs: [null], w: 5, ack: 1400, dur: 3200, deps: ['mongo'] },
    { command: 'dmz', subs: [null], w: 4, ack: 240, dur: 700, deps: ['mongo'], search: { field: 'weapon', terms: ['m4', 'fennec', 'dmz kilo', 'ghost rifle'] } },
    { command: 'settings', subs: [null], w: 3, ack: 150, dur: 260, deps: ['mongo'] },
    { command: 'help', subs: [null], w: 3, ack: 80, dur: 110, deps: [] },
];
const ADMIN = [{ command: 'manage', subs: [null], ack: 300, dur: 1600, deps: ['mongo'] }, { command: 'bot', subs: ['analytics'], ack: 350, dur: 2100, deps: ['mongo'] }];
const GUILDS = ['900000000000000001', '900000000000000002', '900000000000000003', '900000000000000004'];

function event(cmd, at, isAdmin) {
    const dm = R() < 0.22;
    const entry = cmd.search && R() < 0.35 ? 'autocomplete' : weighted([['slash', 70], ['button', 18], ['select', 10], ['modal', 2]]);
    const doc = {
        userHash: `seed-user-${String(Math.floor(R() * (isAdmin ? 2 : 140))).padStart(2, '0')}`,
        guildId: dm ? null : pick(GUILDS), context: dm ? 'dm' : 'guild',
        installType: weighted([[dm ? 'user' : 'guild', 70], [dm ? 'guild' : 'user', 22], [null, 8]]),
        isAdmin, command: cmd.command, subcommand: pick(cmd.subs), entry,
        customIdPrefix: entry === 'button' || entry === 'select' ? cmd.command.slice(0, 4) : undefined,
        outcome: weighted([['ok', 92], ['error', 2.5], ['expired', 3], ['blocked_by_policy', 1], ['swallowed_by_cooldown', 1.2], ['rejected_admin', 0.3]]),
        ackMs: around(cmd.ack, 1.2), durationMs: around(cmd.dur, 1.4),
        deps: cmd.deps.length ? cmd.deps.map((name) => ({ name, ms: around(name === 'cloudinary' ? 380 : 45, 1.5), calls: 1 + Math.floor(R() * 3), ok: R() > 0.02 })) : undefined,
        detail: { seed: MARK }, version: '3.80.0-pre', host: 'seed', createdAt: at,
    };
    if (entry === 'autocomplete') {
        const term = pick(cmd.search.terms);
        const results = /xyz|ghost/.test(term) ? 0 : 1 + Math.floor(R() * 6);
        doc.search = { term, field: cmd.search.field, keystrokes: term.length + Math.floor(R() * 3), results, picked: results > 0 && R() < 0.7 };
    }
    return doc;
}

(async () => {
    if (process.argv.includes('--refuse-test-remote')) {
        try { assertDevTarget('mongodb+srv://user:pw@cluster0.example.mongodb.net/diors-builds'); console.error('GUARD DID NOT FIRE'); process.exit(2); }
        catch (e) { console.log('guard fired as expected:', e.message.split('\n')[0]); process.exit(1); }
    }
    const db = assertDevTarget(process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    const AnalyticsEvent = require('../models/AnalyticsEvent');
    const cleared = await AnalyticsEvent.deleteMany({ 'detail.seed': MARK });
    if (process.argv.includes('--clear')) {
        const AnalyticsRollup = require('../models/AnalyticsRollup');
        const days = Array.from({ length: DAYS + 1 }, (_, i) => new Date(Date.now() - i * DAY_MS).toISOString().slice(0, 10));
        const rolled = await AnalyticsRollup.deleteMany({ day: { $in: days } });
        console.log(`Cleared ${cleared.deletedCount} row(s) and ${rolled.deletedCount} roll-up(s) for the seeded days from ${db}.`);
        return mongoose.disconnect();
    }
    const now = Date.now();
    const docs = [];
    const weights = COMMANDS.map((c) => [c, c.w]);
    for (let d = DAYS - 1; d >= 0; d--) {
        // Weekends run hotter and the month trends upward, so a 7-day comparison has something to say.
        const dow = new Date(now - d * DAY_MS).getUTCDay();
        const perDay = Math.round((50 + (DAYS - d) * 1.6) * (dow === 0 || dow === 6 ? 1.35 : 1));
        for (let i = 0; i < perDay; i++) {
            const hour = weighted([[1, 2], [4, 1], [9, 3], [13, 5], [17, 7], [20, 9], [22, 6]]) + R();
            const at = new Date(Math.floor((now - d * DAY_MS) / DAY_MS) * DAY_MS + hour * 3600 * 1000);
            if (at.getTime() > now) continue;
            docs.push(event(weighted(weights), at, false));
        }
        for (let i = 0; i < 3; i++) docs.push(event(pick(ADMIN), new Date(now - d * DAY_MS - R() * DAY_MS / 2), true));
    }
    await AnalyticsEvent.insertMany(docs, { ordered: false });
    const since7d = new Date(now - 7 * DAY_MS);
    const last7 = docs.filter((x) => x.createdAt >= since7d && !x.isAdmin).length;
    const searches = docs.filter((x) => x.search).length;
    console.log(`Seeded ${docs.length} row(s) into ${db} (replaced ${cleared.deletedCount}) — ${last7} public in the last 7 days, ${searches} autocomplete searches. SYNTHETIC: Analytics on the dev portal now shows this traffic as if it were real. Remove it, and any roll-ups the dev bot builds from it, with --clear.`);
    await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
