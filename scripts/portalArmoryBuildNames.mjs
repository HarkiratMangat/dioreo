#!/usr/bin/env node
// scripts/portalArmoryBuildNames.mjs — read-only report for pin pmtylf7gz (2026-09-13 17:41 EDT, pins batch 2, spec §6): buildName is an IDENTITY in this codebase, not just a display string -- /autobuild derives the next build number AND the Cloudinary imageKey from "Build N" names (utils/loadoutRender.js's computeWeaponKeyAndBuild), the add/bulk-upsert match on {weaponKey, mode, buildName} (core/ops/loadouts.js, portal/api/bulk.js), delete-by-"weapon | build" matches it (core/ops/loadouts.js), Cloudinary metadata parses Build_Number out of it (utils/loadoutImageCache.js), and the scope sort tie-breaks on it (utils/loadoutScopes.js).
//
// 🔴 THIS SCRIPT WRITES NOTHING. It exists so G6 can hand Harkirat two options with real numbers behind them: (a) display-only labels — armory.logic.js's displayBuildLabel(), nothing stored changes — or (b) an identity refactor, filed as its own item. No migration is written here on purpose.
//
// ⚠️ DEV MONGO ONLY, ASSERTED RATHER THAN ASSUMED — same reasoning as scripts/lib/portalSession.cjs's mintSession(): a report script that can read the production database by accident is not a report script. Refuses anything whose URI is not localhost/127.0.0.1, AND whose database name does not look like a dev database (contains "dev" — the only convention this repo has ever used, see `diors-builds-dev` in CLAUDE.md's local-dev-bot section).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readDevMongoUri() {
    const envPath = path.join(ROOT, '.env.dev');
    if (!fs.existsSync(envPath)) {
        throw new Error('portalArmoryBuildNames: no .env.dev at repo root -- refusing to guess a database. Copy .env.dev.example or create one with a localhost MONGODB_URI.');
    }
    const line = fs.readFileSync(envPath, 'utf8').split(/\r?\n/).find((l) => l.trimStart().startsWith('MONGODB_URI='));
    const uri = line ? line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '') : '';
    if (!uri) throw new Error('portalArmoryBuildNames: .env.dev has no MONGODB_URI -- refusing to run with no database to check.');
    if (!/mongodb:\/\/(localhost|127\.0\.0\.1)/.test(uri)) {
        throw new Error(`portalArmoryBuildNames refuses to run against a non-local database: ${uri.replace(/\/\/.*@/, '//***@')}`);
    }
    const dbName = (uri.split('/').pop() || '').split('?')[0];
    if (!/dev/i.test(dbName)) {
        throw new Error(`portalArmoryBuildNames refuses to run against a database whose name doesn't look like a dev database: "${dbName}" (this repo's convention is "diors-builds-dev")`);
    }
    return uri;
}

// ── THE CONSUMER LEDGER ───────────────────────────────────────────────────────────────────────
//
// ⚠️ THIS TABLE IS HAND-CURATED, NOT DERIVED — a grep can find every file that MENTIONS buildName, but only a reader can tell whether a given use is a genuine identity dependency (a match key, a derivation input, a delete target) or a display string with no consequence if it changes. The FRESHNESS CHECK below re-greps the repo and warns if a file appears or disappears from that set, so this table can go STALE LOUDLY instead of silently -- it can never go stale SILENTLY, but it can absolutely go stale, and the warning is the whole point of running this instead of trusting memory.
const CONSUMERS = [
    { file: 'models/Loadout.js', kind: 'SCHEMA', why: 'declares buildName, default "Standard Build" -- the field every other row depends on existing' },
    { file: 'core/ops/loadouts.js', kind: 'IDENTITY', why: 'add/edit/bulk-upsert match existing docs on {weaponKey, mode, buildName}; delete-by-"weapon | build" matches buildName exactly' },
    { file: 'portal/api/bulk.js', kind: 'IDENTITY', why: 'the bulk-paste preview decides update-vs-new by matching {weaponKey, mode, buildName} against the live collection' },
    { file: 'utils/loadoutRender.js', kind: 'IDENTITY + DISPLAY', why: 'computeWeaponKeyAndBuild() derives the NEXT "Build N" from every sibling buildName, and also derives the Cloudinary imageKey from it (identity); buildLoadoutCard() also prints buildName on the Discord embed (display)' },
    { file: 'utils/loadoutImageCache.js', kind: 'IDENTITY', why: 'buildLoadoutMetadata() parses Build_Number out of buildName via /Build\\s+(\\d+)/i for Cloudinary structured metadata' },
    { file: 'utils/loadoutScopes.js', kind: 'IDENTITY', why: 'resolveScopeBuilds() tie-breaks its sort on buildName before falling back to _id -- an unstable tie here silently moves a flat browse index onto a different build' },
    { file: 'utils/autobuildPipeline.js', kind: 'IDENTITY + DISPLAY', why: 'reads every sibling buildName to compute the next one (computeWeaponKeyAndBuild), stores the computed value through a retry token, and also prints it in the confirmation/duplicate-warning text shown to the admin' },
    { file: 'utils/adminParser.js', kind: 'IDENTITY', why: 'LOADOUT_BLOCK_KEYS maps a bulk-paste "Build:" line onto buildName (write path); formatLoadoutsAsBulkText() round-trips it back out in the same export format the parser re-reads' },
    { file: 'handlers/manage/loadouts.js', kind: 'IDENTITY', why: 'the single add/edit modal\'s "Build Name | Share Code" field is the ORIGIN of a written buildName -- splits the pipe-delimited value and sends buildName straight into the op payload' },
    { file: 'handlers/manage/retry.js', kind: 'IDENTITY', why: 'the retry-after-image-failure modal parses the same pipe convention and rebuilds the edit modal\'s pre-filled buildName' },
    { file: 'commands/manage.js', kind: 'IDENTITY', why: 'declares the "Build Name | Share Code" modal field (add + edit) and the bulk-delete "Weapon | [Build Name]" field that core/ops/loadouts.js matches against' },
    { file: 'handlers/manage/shared.js', kind: 'DISPLAY', why: 'fuzzy-matches a typed search query against buildName as a convenience, and builds a "{weapon} - {buildName}" disambiguation label -- does not gate a write' },
    { file: 'handlers/loadouts.js', kind: 'DISPLAY', why: 'the "Copy" button falls back to buildName as the pasted text only when a build has no real shareCode -- a fallback string a player reads, not a DB match key' },
    { file: 'commands/bot.js', kind: 'DISPLAY', why: 'a field-name-to-label map on the Changes/audit page ("buildName" -> "Build") -- pure UI copy' },
    { file: 'portal/ui/armory.js', kind: 'IDENTITY + DISPLAY', why: 'the row/build-chip UI shows buildName as text (display), AND the edit drawer round-trips the selected build\'s buildName through buildArmoryEditOp\'s payload spread (identity, since an unedited field still travels back out as the match value)' },
    { file: 'portal/ui/armory.logic.js', kind: 'IDENTITY + DISPLAY', why: 'buildArmoryAddOp/buildArmoryEditOp write buildName into the op payload (identity); the new displayBuildLabel()/buildNumberOf() (this pin) are display-only and change nothing stored' },
    { file: 'portal/ui/manifest.js', kind: 'DISPLAY', why: 'one comment documenting that Armory declares buildName as an editable Manifest cell -- the edit itself routes through the op layer\'s edit-by-id, not a buildName match' },
    { file: 'portal/ui/harness/stub.js', kind: 'DISPLAY', why: 'harness-only fixture rendering, never served in production (see the file\'s own header)' },
];

function printConsumerLedger() {
    console.log('\n── buildName consumers outside tests ──────────────────────────────────────────\n');
    for (const c of CONSUMERS) {
        console.log(`${c.kind.padEnd(18)} ${c.file}`);
        console.log(`                   ${c.why}`);
    }
}

// The freshness check: re-derive the file set with a plain filesystem walk (no subprocess -- rg via execFileSync was observed returning a false "no matches" here, likely an environment/config difference between an interactive shell's rg and a bare child_process spawn; a pure-Node regex walk cannot have that class of failure), and warn (never fail -- this is a report, not a gate) about anything the table doesn't cover, or anything the table lists that no longer mentions buildName at all.
const SKIP_DIRS = new Set(['node_modules', '.git', 'docs', 'scripts', '.claude', 'public', 'local']);
function walkJsFiles(dir, out) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            walkJsFiles(full, out);
        } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) {
            out.push(full);
        }
    }
    return out;
}

function freshnessWarning() {
    const files = walkJsFiles(ROOT, []);
    const liveFiles = new Set();
    for (const full of files) {
        const rel = path.relative(ROOT, full);
        if (/\bbuildName\b/.test(fs.readFileSync(full, 'utf8'))) liveFiles.add(rel);
    }
    const known = new Set(CONSUMERS.map((c) => c.file));
    const missingFromTable = [...liveFiles].filter((f) => !known.has(f));
    const staleInTable = [...known].filter((f) => !liveFiles.has(f));
    if (missingFromTable.length || staleInTable.length) {
        console.log('\n⚠️  THE CONSUMER LEDGER ABOVE MAY BE STALE -- re-check before trusting it:');
        if (missingFromTable.length) console.log('   new files mentioning buildName, not yet classified: ' + missingFromTable.join(', '));
        if (staleInTable.length) console.log('   files the ledger lists that no longer mention buildName: ' + staleInTable.join(', '));
    } else {
        console.log('\n✅ freshness check: the ledger above still matches every non-test source file that mentions buildName.');
    }
}


async function main() {
    printConsumerLedger();
    freshnessWarning();

    const uri = readDevMongoUri();
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(uri);
    const loadoutModule = await import(path.join(ROOT, 'models', 'Loadout.js'));
    const Loadout = loadoutModule.default ?? mongoose.model('Loadout');
    const armoryLogic = await import(path.join(ROOT, 'portal', 'ui', 'armory.logic.js'));
    const logic = armoryLogic.default ?? armoryLogic;
    const { displayBuildLabel, buildNumberOf } = logic;

    const builds = await Loadout.find({}).lean();
    console.log(`\n── per-build report (${builds.length} builds, dev database) ──────────────────────────────\n`);
    console.log(['id', 'weapon', 'mode', 'buildName', 'displayBuildLabel', 'build n of m', 'shareCode'].join(' | '));
    for (const b of builds) {
        const { n, of } = buildNumberOf(builds, b);
        console.log([
            String(b._id),
            b.weaponName,
            b.mode,
            JSON.stringify(b.buildName || ''),
            JSON.stringify(displayBuildLabel(b)),
            `${n} of ${of}`,
            b.shareCode || '(none)',
        ].join(' | '));
    }

    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(`\n❌ ${e.message}`);
    process.exitCode = 1;
});
