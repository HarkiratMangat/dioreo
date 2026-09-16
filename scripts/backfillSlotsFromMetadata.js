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

// Twelve attachments Cloudinary's metadata cannot answer for, supplied by Harkirat 2026-09-16 11:28 EDT, and the reason each one is missing. EIGHT carry a slot label Cloudinary has no field for at all (SLOT_TO_FIELD in utils/loadoutImageCache.js holds nine names; see its header): Smoothbore, Bolt, Trigger Action, Bowstring, Guard, Limb. THREE name a perfectly canonical slot whose field exists and is simply EMPTY, because the 2026-07-21 vision pass never captured that attachment -- the two 3-LINE RIFLE barrels (both images hold identical 4-of-9 metadata and differ in life only by the barrel that got dropped) and the STRIKER's reload case. ONE is different again, and Harkirat named it 2026-09-16 11:31 EDT: Hi-Accuracy Sniper Ammo was only ever seen on a DMZ build, and a DMZ screenshot prints no slot label at all, so the vision pass had nothing to read. The attachment is NOT DMZ-only -- it exists in MP too and simply has not appeared on an MP screenshot yet -- so the corpus pass above will resolve it on its own the day one does. So no amount of better name-matching could have filled any of these; they are a correction, and they are consulted only where the metadata has nothing to say.
const KNOWN_SLOTS = {
    '270mm VOZ Carbine': 'Barrel',
    'Empress 514mm F01': 'Barrel',
    'Hi-Accuracy Sniper Ammo': 'Ammunition',
    'Fast Reload Reload Case': 'Ammunition',
    'MFT Heavy Smoothbore': 'Smoothbore',
    'Light Bolt': 'Bolt',
    'Classical Lever': 'Trigger Action',
    'Lightweight Single-Action': 'Trigger Action',
    'Rapid Action': 'Trigger Action',
    '2B Bowstring': 'Bowstring',
    'Heavy Limb': 'Limb',
    'OWC Stable': 'Guard',
};
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
function alignSlots(stored, names, slots, corpus) {
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
    // THE CORPUS PASS, and it is the one that needed writing. The three passes above only ever compare a build's attachments against ITS OWN image's metadata, so an attachment the vision run missed on this image stays blank even when the very same attachment was identified on another weapon's image. Measured 2026-09-16 11:29 EDT: eight of the twelve unplaceable names are identified elsewhere in the same 134-image corpus, exactly, with no judgement involved -- Bandit Steady Stock, Tactical Suppressor, Agile Stock, FMJ, Steady Stock, Long Shot, Fast Reload Mag and BO Foregrip. It is evidence from the same source, not a guess, so it outranks the hand-supplied table below.
    if (corpus) for (let i = 0; i < stored.length; i++) { if (aligned[i]) continue; const hit = corpus.get(norm(stored[i])); if (hit) aligned[i] = hit; }
    // Last, and only into a blank: a correction never overrides what the image itself, or the corpus, recorded.
    const known = new Map(Object.entries(KNOWN_SLOTS).map(([k, v]) => [norm(k), v]));
    for (let i = 0; i < stored.length; i++) if (!aligned[i] && known.has(norm(stored[i]))) aligned[i] = known.get(norm(stored[i]));
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
    // name -> the slot it was identified in, across EVERY image; the commonest wins when two images disagree.
    const tally = new Map();
    for (const md of byId.values()) for (const [f, slot] of SLOT_FIELDS) { const n = norm(md[f]); if (!n) continue; if (!tally.has(n)) tally.set(n, new Map()); const m = tally.get(n); m.set(slot, (m.get(slot) || 0) + 1); }
    const corpus = new Map([...tally].map(([n, m]) => [n, [...m].sort((a, b) => b[1] - a[1])[0][0]]));
    await mongoose.connect(uri);
    const builds = await Loadout.find({}, { weaponName: 1, buildName: 1, mode: 1, imageKey: 1, attachments: 1, attachmentSlots: 1 }).lean();

    const report = { builds: builds.length, images: byId.size, imagesWithSlotMetadata: withSlotMd, urlKey: [], noImage: [], noSlotMetadata: [], matchedWithSlots: 0, fullyPlaced: 0, unplaced: [], unplacedCount: 0, toWrite: 0 };
    const writes = [];
    for (const b of builds) {
        const label = `${b.weaponName} · ${b.mode} · ${b.buildName} (${b.imageKey})`;
        if (/^https?:\/\//i.test(b.imageKey || '')) { report.urlKey.push(label); continue; }
        const md = byId.get(publicIdOf(b.imageKey));
        if (!md) { report.noImage.push(label); continue; }
        const present = SLOT_FIELDS.filter(([f]) => md[f]);
        if (!present.length) { report.noSlotMetadata.push(label); continue; }
        report.matchedWithSlots++;
        const aligned = alignSlots(b.attachments || [], present.map(([f]) => md[f]), present.map(([, l]) => l), corpus);
        const missing = (b.attachments || []).filter((_, i) => !aligned[i]);
        if (missing.length) { report.unplaced.push(`${label}: ${missing.join(', ')}`); report.unplacedCount += missing.length; } else report.fullyPlaced++;
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
        // The number that says whether the corpus pass and the corrections did their job. It counts EVERY build examined, not only the ones that would change -- counting the write list under-reports, because a build already carrying the right slots never enters it.
        console.log(`Attachments still unplaced across all ${report.matchedWithSlots} matched build(s): ${report.unplacedCount}.`);
    }
    await mongoose.disconnect();
}

run().catch(async (err) => { console.error(`Failed: ${err && err.message}`); try { await mongoose.disconnect(); } catch (_) {} process.exit(1); });
