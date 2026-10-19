// scripts/autobuildDmzCheck.js
//
// The live half of /autobuild's DMZ detection (2026-10-19 17:56 EDT). Runs the screenshots already stored for every DMZ build through the real vision call, plus the MP builds of the same weapons as the control group, and reports for each one whether the mode came back right and how many of its stored attachments were read back. Harkirat, 2026-10-19 17:45 EDT: use "the screenshots that are already in the bot for the current DMZ builds as a detection method", since he could not supply new ones. scripts/autobuildDmz.test.js proves the rules with a fixed model answer; only this proves the model answers the four `screen` questions correctly on real images.
//
//   node --env-file=.env.dev scripts/autobuildDmzCheck.js            every DMZ build + the MP builds of the same weapons
//   node --env-file=.env.dev scripts/autobuildDmzCheck.js --limit 4  the first four of each, for a cheap first look
//
// READ-ONLY: it reads Loadout documents and fetches each build's public Cloudinary image, and writes nothing anywhere. It refuses any database whose name lacks "dev" unless --any-db is passed, because the dev database is a copy of prod's loadouts and is the right thing to test against. ⚠️ IT SPENDS VERTEX TOKENS: one gemini-3.5-flash call per screenshot, logged as `vision_call_cost` with taskName `autobuild_dmz_check`. At the volumes in utils/visionExtract.js's own cost note that is cents for the whole set, but it is a real charge on the GCP project, so it is never part of `npm test`.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const Loadout = require('../models/Loadout');
const { extractLoadoutFromImage } = require('../utils/visionExtract');
const { buildImageUrl } = require('../utils/loadoutRender');

const argv = process.argv.slice(2);
const limitAt = argv.indexOf('--limit');
const LIMIT = limitAt === -1 ? Infinity : Number(argv[limitAt + 1]) || Infinity;
const ANY_DB = argv.includes('--any-db');

const norm = (a) => String(a || '').trim().toLowerCase();

async function main() {
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI is not set. Run with --env-file=.env.dev.');
        process.exit(2);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    const dbName = mongoose.connection.name;
    if (!/dev/i.test(dbName) && !ANY_DB) {
        console.error(`Refusing database "${dbName}": it does not look like the dev copy. Run with --env-file=.env.dev, or pass --any-db to read it anyway (still read-only).`);
        await mongoose.disconnect();
        process.exit(2);
    }

    const dmz = (await Loadout.find({ mode: 'DMZ' }).lean()).slice(0, LIMIT);
    const weaponKeys = [...new Set(dmz.map(b => b.weaponKey))];
    const mp = (await Loadout.find({ mode: 'MP', weaponKey: { $in: weaponKeys } }).lean()).slice(0, LIMIT);
    console.log(`Database "${dbName}": ${dmz.length} DMZ build(s), ${mp.length} MP control build(s) of the same weapons.\n`);

    const rows = [];
    for (const build of [...dmz, ...mp]) {
        if (!build.imageKey || build.imageKey.startsWith('PENDING-UPLOAD-')) {
            rows.push({ build, error: 'no image' });
            continue;
        }
        try {
            const out = await extractLoadoutFromImage(buildImageUrl(build.imageKey), { taskName: 'autobuild_dmz_check' });
            const read = new Set(out.attachments.map(norm).filter(Boolean));
            const stored = (build.attachments || []).map(norm).filter(Boolean);
            rows.push({ build, out, hits: stored.filter(a => read.has(a)).length, total: stored.length, extra: read.size - stored.filter(a => read.has(a)).length });
        } catch (err) {
            rows.push({ build, error: err.message.slice(0, 120) });
        }
    }

    const sig = (s) => ['penStats', 'equipCustomizeTabs', 'selectBlueprints', 'codeInTitle'].map(k => (s?.[k] ? k : null)).filter(Boolean).join(',') || '-';
    for (const r of rows) {
        const label = `${r.build.mode.padEnd(3)} ${r.build.weaponName} — ${r.build.buildName} (${r.build.imageKey})`;
        if (r.error) { console.log(`  ⚠️  ${label}: ${r.error}`); continue; }
        const modeOk = r.out.mode === r.build.mode;
        console.log(`  ${modeOk ? '✓' : (r.out.mode === null ? '?' : '✗')}  ${label}`);
        console.log(`       mode read: ${r.out.mode ?? 'unknown'}  signals: ${sig(r.out.modeSignals)}  attachments: ${r.hits}/${r.total} stored read back${r.extra ? `, ${r.extra} not in the stored build` : ''}`);
    }

    const scored = rows.filter(r => !r.error);
    const right = scored.filter(r => r.out.mode === r.build.mode).length;
    const unknown = scored.filter(r => r.out.mode === null).length;
    const wrong = scored.length - right - unknown;
    const dmzFull = scored.filter(r => r.build.mode === 'DMZ' && r.hits === r.total).length;
    const dmzScored = scored.filter(r => r.build.mode === 'DMZ').length;
    console.log(`\nMode: ${right} right, ${unknown} unknown (the review card would ask), ${wrong} WRONG, of ${scored.length}. ${rows.length - scored.length} skipped.`);
    console.log(`DMZ attachments: ${dmzFull} of ${dmzScored} DMZ builds read back in full.`);
    console.log('A WRONG mode is the result that matters: unknown only costs a click on Edit, wrong files a build under the other mode.');
    await mongoose.disconnect();
    process.exit(wrong > 0 ? 1 : 0);
}

main().catch(async (err) => {
    console.error('autobuildDmzCheck failed:', err);
    try { await mongoose.disconnect(); } catch { /* already down */ }
    process.exit(1);
});
