// scripts/backfillSlotsFromMetadata.js — copies each loadout's attachment SLOTS from its Cloudinary structured metadata into Loadout.attachmentSlots. Plan docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md §5.2 Step 9b, written 2026-09-14 23:59 EDT.
//
// WHY: the 2026-07-21 vision backfill (scripts/backfillLoadoutSlots.js) wrote the slots into Cloudinary metadata on 130 of 134 images, but it ran before the 2026-07-24 change that also persists them in Mongo — so every build's attachmentSlots is empty while the answer sits in Cloudinary. Compare's slot rows and the New Build drawer's code fill and slot search read the Mongo field. No Gemini call and no Cloudinary write: this only READS metadata.
//
// Usage: node --env-file=.env.dev scripts/backfillSlotsFromMetadata.js            (dry run, prints what it would write)
//        node --env-file=.env.dev scripts/backfillSlotsFromMetadata.js --write    (applies it)
//        add --prod to allow a non-localhost database — prod is outward and needs Harkirat's restated approval.
//
// MATCHING, and the trap it avoids: an image matches its build by imageKey with any image extension stripped, compared case-insensitively. 104 of 133 prod keys end in ".png" while Cloudinary public ids carry none (measured 2026-09-14 01:46 EDT), so a literal match would silently miss four builds in five. A full-URL key is reported and never matched. PLACEMENT: attachmentSlots is a PARALLEL array to attachments, so every stored attachment keeps its index — a name that cannot be placed gets '' at its index rather than shortening the array, which would shift every slot after it. The placement passes are alignSlots' from scripts/backfillLoadoutSlots.js (exact-normalised, substring, near-typo edit distance), copied rather than required because that file loads the vision SDK at require time.
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const Loadout = require('../models/Loadout');

const WRITE = process.argv.includes('--write');
const PROD = process.argv.includes('--prod');
// Metadata external_id → the slot label stored in attachmentSlots (utils/loadoutImageCache.js METADATA_FIELDS / SLOT_TO_FIELD).
const SLOT_FIELDS = [['Muzzle', 'Muzzle'], ['Barrel', 'Barrel'], ['Optic', 'Optic'], ['Stock', 'Stock'], ['Perk', 'Perk'], ['Laser', 'Laser'], ['Underbarrel', 'Underbarrel'], ['Ammunition', 'Ammunition'], ['Rear_Grip', 'Rear Grip']];

// Never log a raw Cloudinary error: its rejected promise carries the account's API key and secret (CLAUDE.md, Cloudinary secret-logging ban).
function safeErrorMessage(err) {
    return (err && err.error && err.error.message) || (err && err.message) || 'unknown Cloudinary error';
}

const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
        const curr = [i];
        for (let j = 1; j <= n; j++) curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = curr;
    }
    return prev[n];
}
function alignSlots(stored, names, slots) {
    const aligned = new Array(stored.length).fill('');
    const used = new Set();
    const match = (predicate) => {
        for (let i = 0; i < stored.length; i++) {
            if (aligned[i]) continue;
            const sn = norm(stored[i]);
            if (!sn) continue;
            for (let j = 0; j < names.length; j++) {
                if (used.has(j)) continue;
                if (predicate(sn, norm(names[j]))) { aligned[i] = slots[j] || ''; used.add(j); break; }
            }
        }
    };
    match((sn, vn) => vn === sn);
    match((sn, vn) => vn && (vn.includes(sn) || sn.includes(vn)));
    match((sn, vn) => { if (!vn) return false; const d = levenshtein(sn, vn); return d <= 2 && d / Math.max(sn.length, vn.length) <= 0.2; });
    return aligned;
}

const publicIdOf = (imageKey) => String(imageKey || '').replace(/\.(png|jpe?g|webp|gif|avif)$/i, '').toLowerCase();

async function fetchMetadata() {
    const byId = new Map();
    let cursor;
    do {
        let q = cloudinary.search.expression('asset_folder="gun-builds"').with_field('metadata').max_results(500);
        if (cursor) q = q.next_cursor(cursor);
        const res = await q.execute();
        for (const r of res.resources) byId.set(String(r.public_id).toLowerCase(), r.metadata || {});
        cursor = res.next_cursor;
    } while (cursor);
    return byId;
}

async function run() {
    const uri = process.env.MONGODB_URI || '';
    if (!/^mongodb:\/\/(localhost|127\.0\.0\.1)/.test(uri) && !PROD) {
        console.error('Refusing a non-localhost database without --prod.');
        process.exit(2);
    }
    let byId;
    try { byId = await fetchMetadata(); } catch (err) { console.error(`Cloudinary search failed: ${safeErrorMessage(err)}`); process.exit(1); }
    const withSlotMd = [...byId.values()].filter(md => SLOT_FIELDS.some(([f]) => md[f])).length;
    await mongoose.connect(uri);
    const builds = await Loadout.find({}, { weaponName: 1, buildName: 1, mode: 1, imageKey: 1, attachments: 1, attachmentSlots: 1 }).lean();

    const report = { builds: builds.length, images: byId.size, imagesWithSlotMetadata: withSlotMd, urlKey: [], noImage: [], noSlotMetadata: [], matchedWithSlots: 0, fullyPlaced: 0, unplaced: [], toWrite: 0 };
    const writes = [];
    for (const b of builds) {
        const label = `${b.weaponName} · ${b.mode} · ${b.buildName} (${b.imageKey})`;
        if (/^https?:\/\//i.test(b.imageKey || '')) { report.urlKey.push(label); continue; }
        const md = byId.get(publicIdOf(b.imageKey));
        if (!md) { report.noImage.push(label); continue; }
        const present = SLOT_FIELDS.filter(([f]) => md[f]);
        if (!present.length) { report.noSlotMetadata.push(label); continue; }
        report.matchedWithSlots++;
        const aligned = alignSlots(b.attachments || [], present.map(([f]) => md[f]), present.map(([, l]) => l));
        const missing = (b.attachments || []).filter((_, i) => !aligned[i]);
        if (missing.length) report.unplaced.push(`${label}: ${missing.join(', ')}`); else report.fullyPlaced++;
        if (JSON.stringify(aligned) !== JSON.stringify(b.attachmentSlots || [])) writes.push({ _id: b._id, aligned });
    }
    report.toWrite = writes.length;
    console.log(JSON.stringify({ ...report, urlKey: report.urlKey.length, noImage: report.noImage.length, noSlotMetadata: report.noSlotMetadata.length, unplaced: report.unplaced.length }, null, 2));
    for (const [k, list] of [['URL key, not matched', report.urlKey], ['no Cloudinary image', report.noImage], ['image has no slot metadata', report.noSlotMetadata], ['attachment could not be placed', report.unplaced]]) {
        for (const line of list) console.log(`  ${k}: ${line}`);
    }
    if (WRITE) {
        for (const w of writes) await Loadout.updateOne({ _id: w._id }, { $set: { attachmentSlots: w.aligned } });
        console.log(`Wrote attachmentSlots on ${writes.length} build(s).`);
    } else {
        console.log(`Dry run: ${writes.length} build(s) would change. Re-run with --write to apply.`);
    }
    await mongoose.disconnect();
}

run().catch(async (err) => { console.error(`Failed: ${err && err.message}`); try { await mongoose.disconnect(); } catch (_) {} process.exit(1); });
