#!/usr/bin/env node
// One-off: uploads the reviewed draw images (upload-manifest.json, action "upload") to Cloudinary draws/<slug>. Never overwrites (overwrite: false), tags and context come from metadataFor() exactly as the bot's own cache writes them. Cloudinary is ONE account shared by dev and prod, so a real run is live. `--dry` prints the plan and writes nothing.
//   node --env-file=.env.dev scripts/uploadDrawImages.js --dry
//   node --env-file=.env.dev scripts/uploadDrawImages.js
'use strict';
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { metadataFor, FOLDER, DRAW_TAG } = require('../utils/cloudinaryCache');

const IDX = path.join(__dirname, '..', 'local', 'project', 'features', 'draw-image-index');
const manifest = require(path.join(IDX, 'upload-manifest.json')).filter(r => r.action === 'upload');
const DRY = process.argv.includes('--dry');
const errText = (e) => e?.message || e?.error?.message || 'unknown error';

async function listTagged() {
    const out = new Map();
    let cursor;
    do {
        const page = await cloudinary.api.resources_by_tag(DRAW_TAG, { context: true, max_results: 500, next_cursor: cursor });
        for (const r of page.resources || []) out.set(r.public_id, r);
        cursor = page.next_cursor;
    } while (cursor);
    return out;
}

async function main() {
    cloudinary.config(true);
    if (!process.env.CLOUDINARY_URL) throw new Error('CLOUDINARY_URL is not set; run with --env-file=.env.dev');
    const before = await listTagged();
    const plan = manifest.map(r => ({ r, ...metadataFor(r.title, { items: r.items, priceType: r.priceType }), publicId: `${FOLDER}/${r.slug}`, file: path.join(IDX, r.out) }));
    const problems = plan.filter(p => !fs.existsSync(p.file) || before.has(p.publicId) || !p.fp);
    console.log(`${plan.length} in the manifest; Cloudinary holds ${before.size} tagged draws; ${problems.length} problem(s)`);
    for (const p of problems) console.log(`  row ${p.r.row} ${p.publicId}: ${!fs.existsSync(p.file) ? 'file missing' : before.has(p.publicId) ? 'already exists' : 'no fingerprint (no items)'}`);
    if (DRY) { console.log('dry run, nothing written'); return; }

    const results = [];
    let i = 0;
    const worker = async () => {
        while (i < plan.length) {
            const p = plan[i++];
            try {
                const res = await cloudinary.uploader.upload(p.file, { public_id: p.publicId, asset_folder: FOLDER, overwrite: false, resource_type: 'image', tags: p.tags, context: p.context });
                results.push({ row: p.r.row, publicId: p.publicId, fp: p.fp, url: res.secure_url, existed: res.existing === true });
            } catch (e) { results.push({ row: p.r.row, publicId: p.publicId, fp: p.fp, error: errText(e) }); }
        }
    };
    await Promise.all(Array.from({ length: 3 }, worker));

    // Verify: each delivery URL answers 200, and one tag listing shows the fingerprint tag and context on every asset.
    const after = await listTagged();
    for (const r of results.filter(x => !x.error)) {
        try { r.status = (await fetch(r.url, { method: 'HEAD', signal: AbortSignal.timeout(30000) })).status; } catch (e) { r.status = errText(e); }
        const a = after.get(r.publicId);
        r.tagged = Boolean(a && (a.tags || []).includes(`fp_${r.fp}`) && (a.context?.custom || a.context || {}).fp === r.fp);
    }
    fs.writeFileSync(path.join(IDX, 'upload-results.json'), JSON.stringify(results, null, 1));
    const ok = results.filter(r => !r.error);
    console.log(`uploaded ${ok.filter(r => !r.existed).length}, already existed (left alone) ${ok.filter(r => r.existed).length}, errors ${results.filter(r => r.error).length}`);
    console.log(`URL 200: ${ok.filter(r => r.status === 200).length} of ${ok.length}; fingerprint tag + context present: ${ok.filter(r => r.tagged).length} of ${ok.length}; Cloudinary now holds ${after.size} tagged draws (was ${before.size})`);
    for (const r of results.filter(x => x.error || (x.status !== undefined && x.status !== 200) || x.tagged === false)) console.log(`  row ${r.row} ${r.publicId}: ${r.error || `status ${r.status}, tagged ${r.tagged}`}`);
}

main().catch(e => { console.error(`FAILED: ${errText(e)}`); process.exit(1); });
