// scripts/portSeasonalToLocal.mjs — copy the LIVE season document into local dev Mongo.
//
// Everything the portal's Season realm renders — draws, returning draws, the calendar, the season
// titles and end dates, and the patch notes — lives in ONE document: `seasonaldatas`, `docType:
// 'global'`. So "port the real data down" is a single-document copy, not a multi-collection sync.
//
// Usage:
//   node scripts/portSeasonalToLocal.mjs                 # dry run — prints what WOULD change
//   node scripts/portSeasonalToLocal.mjs --write         # actually writes to local
//   node scripts/portSeasonalToLocal.mjs --write --keep-draft   # preserve the local `draft` field
//
// 🔴 THREE GUARDS, AND THEY EXIST BECAUSE THIS SCRIPT HOLDS BOTH URIS AT ONCE.
//   1. The SOURCE connection is opened read-only in practice and never written to — but more
//      importantly, the script refuses to run if the source does not look like the remote cluster.
//   2. The TARGET must be localhost. Not "should be" — it refuses. A copy that ran the wrong way
//      round would overwrite the live season with dev test data, and this repo has already recorded
//      what a wrong-database write costs (portal/server.js's own assertEnvironment guard exists for
//      the same failure class).
//   3. The local document is BACKED UP to local/db-backups/ before anything is written, so an
//      unwanted port is one file-copy away from undone.
//
// ⚠️ Reads BOTH env files: prod's `.env` for the source, `.env.dev` for the target. Node's
// --env-file only takes one, so this parses them itself rather than being run twice.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const ROOT = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const WRITE = process.argv.includes('--write');
const KEEP_DRAFT = process.argv.includes('--keep-draft');

function readEnvValue(file, key) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) die(`${file} not found — cannot resolve ${key}`);
    // grep rather than sourcing: sourcing an env file executes it and exports every other secret
    // into the process for no reason (same reasoning as scripts/backupDb.sh).
    const line = fs.readFileSync(full, 'utf8').split('\n').find((l) => l.trim().startsWith(`${key}=`));
    if (!line) die(`${key} not set in ${file}`);
    return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
}

function die(msg) { console.error(`portSeasonalToLocal: ${msg}`); process.exit(1); }
const redact = (uri) => uri.replace(/\/\/[^@]+@/, '//<credentials>@');

const SOURCE_URI = readEnvValue('.env', 'MONGODB_URI');
const TARGET_URI = readEnvValue('.env.dev', 'MONGODB_URI');

// GUARD 2 — the one that matters. Checked before a single connection is opened.
const targetIsLocal = /^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(TARGET_URI);
if (!targetIsLocal) die(`REFUSING TO RUN — the target is not a local database.\n  target: ${redact(TARGET_URI)}\n  This script only ever writes to mongodb://localhost. Fix .env.dev's MONGODB_URI.`);
if (SOURCE_URI === TARGET_URI) die('REFUSING TO RUN — source and target are the same database.');
// GUARD 1 — the source should be the remote cluster; a local-to-local copy is almost certainly a
// mistake, and silently doing it would look like success.
if (/^mongodb:\/\/(localhost|127\.0\.0\.1)/.test(SOURCE_URI)) die(`REFUSING TO RUN — the source looks local, not the Atlas cluster.\n  source: ${redact(SOURCE_URI)}`);

const COUNTS = (doc) => ({
    currentSeasonTitle: doc?.currentSeasonTitle || '(unset)',
    bpEnd: doc?.bpEnd ? new Date(doc.bpEnd).toISOString().slice(0, 10) : '(unset)',
    rankEnd: doc?.rankEnd ? new Date(doc.rankEnd).toISOString().slice(0, 10) : '(unset)',
    dmzEnd: doc?.dmzEnd ? new Date(doc.dmzEnd).toISOString().slice(0, 10) : '(unset)',
    newDraws: (doc?.newDraws || []).length,
    returningDraws: (doc?.returningDraws || []).length,
    calendar: (doc?.calendar || []).length,
    patchNotes: (doc?.patchNotes || []).length,
    draft: doc?.draft ? 'present' : 'none',
});

const src = await mongoose.createConnection(SOURCE_URI).asPromise();
const dst = await mongoose.createConnection(TARGET_URI).asPromise();
try {
    console.log(`source : ${redact(SOURCE_URI)}  (db ${src.name})`);
    console.log(`target : ${redact(TARGET_URI)}  (db ${dst.name})`);
    console.log();

    const live = await src.db.collection('seasonaldatas').findOne({ docType: 'global' });
    if (!live) die('no docType:"global" document found in the source — nothing to copy.');
    const before = await dst.db.collection('seasonaldatas').findOne({ docType: 'global' });

    const cur = COUNTS(before), next = COUNTS(live);
    console.log('field                 local (now)          ->  live (incoming)');
    for (const k of Object.keys(next)) {
        const a = String(cur[k]), b = String(next[k]);
        console.log(`  ${k.padEnd(20)}${a.padEnd(21)}${a === b ? '=  ' : '->  '}${b}`);
    }
    console.log();

    if (!WRITE) {
        console.log('DRY RUN — nothing written. Re-run with --write to apply.');
        process.exit(0);
    }

    // GUARD 3 — back the local document up first. An unwanted port is then one restore away.
    if (before) {
        const dir = path.join(ROOT, 'local', 'db-backups');
        fs.mkdirSync(dir, { recursive: true });
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const file = path.join(dir, `local-seasonaldata-${stamp}.json`);
        fs.writeFileSync(file, JSON.stringify(before, null, 2));
        console.log(`backed up the local document -> ${path.relative(ROOT, file)}`);
    } else {
        console.log('no existing local document — nothing to back up.');
    }

    // `_id` is stripped so the local document keeps its own identity; `draft` is optionally kept,
    // because a local draft is work in progress that the live document has no equivalent of.
    const { _id, __v, ...payload } = live;
    if (KEEP_DRAFT && before?.draft) payload.draft = before.draft;

    const res = await dst.db.collection('seasonaldatas').updateOne(
        { docType: 'global' }, { $set: payload }, { upsert: true },
    );
    const after = await dst.db.collection('seasonaldatas').findOne({ docType: 'global' });

    // Verified by re-reading, not by trusting the write result — the same discipline the rest of
    // this repo's migrations use.
    const check = COUNTS(after);
    const mismatched = Object.keys(next).filter((k) => k !== 'draft' && String(check[k]) !== String(next[k]));
    if (mismatched.length) die(`WROTE, BUT THE RE-READ DISAGREES on: ${mismatched.join(', ')}`);

    console.log(`\nwrote (matched ${res.matchedCount}, upserted ${res.upsertedCount ? 1 : 0}) and verified by re-reading.`);
    console.log(`local now has ${check.newDraws} new draws, ${check.returningDraws} returning, ${check.calendar} calendar items, ${check.patchNotes} patch-note seasons.`);
    if (KEEP_DRAFT) console.log(`draft: ${check.draft} (preserved from local)`);
} finally {
    await src.close();
    await dst.close();
}
