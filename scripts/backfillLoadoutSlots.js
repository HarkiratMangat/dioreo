// scripts/backfillLoadoutSlots.js
// One-time (re-runnable) BATCH: runs the Gemini vision model over every existing loadout IMAGE to
// recover the per-slot attachment mapping (Muzzle/Barrel/Optic/...) that the Mongo-only backfill
// (scripts/backfillLoadoutMetadata.js) could NOT reconstruct -- the slot->attachment mapping only
// exists at vision-extraction time and was never stored in Mongo. Added 2026-07-21 at Harkirat's
// explicit request (he authorized the GCP/Vertex vision spend to close this gap for pre-existing
// builds, so everything ends up with the full metadata set, not just newly /autobuild-ed builds).
//
// KEY DESIGN: the vision output's SLOTS are used, but each slot is mapped back onto the STORED Mongo
// attachment name (which is authoritative and what the bot actually displays) via name-matching --
// so a vision misread of an attachment NAME can't corrupt the metadata; only the slot label is taken
// from vision. syncLoadoutMetadata then writes the full metadata (all fields + the recovered slots).
//
// Cost/robustness: sequential-ish with small concurrency, up to 3 retries per image (transient/429),
// best-effort per doc (a failed image is reported, never fatal). Re-running is safe (idempotent).
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const Loadout = require('../models/Loadout');
const { extractLoadoutFromImage } = require('../utils/visionExtract');
const { buildImageUrl } = require('../utils/loadoutRender');
const { syncLoadoutMetadata, isRealImageKey } = require('../utils/loadoutImageCache');

const CONCURRENCY = 3;
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Optional filter: set SLOT_RERUN_ONLY to a comma-separated list of "weaponName::buildName::mode"
// to re-process ONLY those docs (used to cheaply re-run just the partials after improving the
// matching). Unset = process everything.
const RERUN_ONLY = process.env.SLOT_RERUN_ONLY
    ? new Set(process.env.SLOT_RERUN_ONLY.split(',').map(s => s.trim()))
    : null;
const docKey = (d) => `${d.weaponName}::${d.buildName}::${d.mode}`;

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
        const curr = [i];
        for (let j = 1; j <= n; j++) {
            curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = curr;
    }
    return prev[n];
}

// Map each STORED attachment to a slot label, taking the slot from the vision result whose NAME best
// matches. Three passes, tightest first: exact-normalized, then substring, then a small edit-distance
// (catches stored-data typos like "Supressor"/"Suppressor", "Strippled"/"Stippled"). Returns an array
// parallel to `stored` -- exactly the `attachmentSlots` shape syncLoadoutMetadata expects.
function alignSlots(stored, visionNames, visionSlots) {
    const aligned = new Array(stored.length).fill('');
    const used = new Set();
    const match = (predicate) => {
        for (let i = 0; i < stored.length; i++) {
            if (aligned[i]) continue;
            const sn = norm(stored[i]);
            if (!sn) continue;
            for (let j = 0; j < visionNames.length; j++) {
                if (used.has(j)) continue;
                if (predicate(sn, norm(visionNames[j]))) { aligned[i] = visionSlots[j] || ''; used.add(j); break; }
            }
        }
    };
    match((sn, vn) => vn === sn);
    match((sn, vn) => vn && (vn.includes(sn) || sn.includes(vn)));
    // Edit-distance pass: only for genuine near-typos -- distance <= 2 AND within 20% of the longer
    // string, so two genuinely-different attachment names can't be forced into a false match.
    match((sn, vn) => {
        if (!vn) return false;
        const d = levenshtein(sn, vn);
        return d <= 2 && d / Math.max(sn.length, vn.length) <= 0.2;
    });
    return aligned;
}

async function processOne(doc) {
    const url = buildImageUrl(doc.imageKey);
    // DMZ builds equip up to 9 attachments; MP is always 5. The fixed-5 prompt was truncating DMZ.
    const maxAttachments = doc.mode === 'DMZ' ? 9 : 5;
    let vision;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try { vision = await extractLoadoutFromImage(url, { maxAttachments, taskName: 'backfill_slots_bulk' }); break; }
        catch (e) {
            if (attempt === 3) return { doc, status: 'vision-fail', reason: e.message };
            await new Promise(r => setTimeout(r, 1500 * attempt));
        }
    }
    const aligned = alignSlots(doc.attachments || [], vision.attachments, vision.attachmentSlots);
    const mapped = aligned.filter(Boolean).length;
    const res = await syncLoadoutMetadata(doc, aligned);
    return { doc, status: res.success ? 'ok' : 'sync-fail', mapped, total: (doc.attachments || []).length, reason: res.error };
}

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const docs = await Loadout.find({}).lean();
    let targets = docs.filter(d => isRealImageKey(d.imageKey));
    if (RERUN_ONLY) {
        targets = targets.filter(d => RERUN_ONLY.has(docKey(d)));
        console.log(`SLOT_RERUN_ONLY set -- processing only ${targets.length} targeted doc(s).`);
    }
    console.log(`Vision-processing ${targets.length} loadouts with real image keys (of ${docs.length} total), concurrency=${CONCURRENCY}...\n`);

    const results = [];
    let idx = 0;
    async function worker() {
        while (idx < targets.length) {
            const doc = targets[idx++];
            const r = await processOne(doc);
            results.push(r);
            const tag = r.status === 'ok' ? `✅ ${r.mapped}/${r.total} slots`
                : `⚠️ ${r.status}${r.reason ? ': ' + r.reason.slice(0, 80) : ''}`;
            console.log(`[${results.length}/${targets.length}] ${doc.weaponName} (${doc.buildName}, ${doc.mode}) ${tag}`);
        }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    const ok = results.filter(r => r.status === 'ok');
    const fullyMapped = ok.filter(r => r.mapped === r.total).length;
    const partial = ok.filter(r => r.mapped < r.total);
    const fails = results.filter(r => r.status !== 'ok');
    console.log(`\nDone. ok=${ok.length} (fully-mapped=${fullyMapped}, partial=${partial.length}), problems=${fails.length}`);
    if (partial.length > 0) {
        console.log('\nPartial slot coverage (fewer slots mapped than attachments -- vision name mismatch or >5 attachments on DMZ):');
        partial.forEach(p => console.log(`  ${p.mapped}/${p.total}  ${p.doc.weaponName} (${p.doc.buildName}, ${p.doc.mode})`));
    }
    if (fails.length > 0) {
        console.log('\nFailures (re-run to retry these):');
        fails.forEach(f => console.log(`  ${f.status}  ${f.doc.weaponName} (${f.doc.buildName}, ${f.doc.mode}) -- ${f.reason || ''}`));
    }
    await mongoose.disconnect();
}

run().catch(e => { console.error('Fatal:', e?.message || e); process.exit(1); });
