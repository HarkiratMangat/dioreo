// scripts/backfillDrawImages.js -- moves every draw image into the permanent `draws/` folder and links each to its draw's items (Harkirat, 2026-10-30 16:02 EDT). The plan itself is utils/drawImageBackfill.js (pure, tested); this reads Cloudinary and Mongo, prints the plan, and with --write carries it out.
//
//   node --env-file=.env.dev scripts/backfillDrawImages.js            # DRY RUN: reads only, prints the plan
//   DRAW_BACKFILL_APPROVED=1 node --env-file=.env scripts/backfillDrawImages.js --write
//
// ⚠️ DEV AND PROD SHARE ONE CLOUDINARY ACCOUNT (utils/cloudinaryDevGuard.js), so `--write` renames the LIVE images whichever database it is pointed at, and the stored URLs it rewrites are only the ones in THAT database. Run against a database that is not prod's and the prod bot's thumbnails 404 until the same run is repeated there. Hence `--write` refuses without DRAW_BACKFILL_APPROVED=1, which is Harkirat's word for the run, and it is meant to be run ONCE, on the prod database, right after the deploy of the code that reads draws/ (the code still finds a legacy temp_draws/ image, so deploying first is safe).
//
// Re-runnable: a moved image is no longer in temp_draws/, so a second run plans nothing for it. It deletes nothing: archive/draws/ copies that are not moved are listed and left. SECURITY: every Cloudinary error goes through safeErrorMessage() (CLAUDE.md's secret-logging ban).
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const SeasonalData = require('../models/SeasonalData');
const { planDrawBackfill, parseStoredUrl, rewriteDeep } = require('../utils/drawImageBackfill');
const ChangeLog = require('../models/ChangeLog');
const { metadataFor, DRAW_TAG, FOLDER, LEGACY_FOLDER } = require('../utils/cloudinaryCache');

const safeErrorMessage = err => err?.message || err?.error?.message || 'Unknown Cloudinary error';
const WRITE = process.argv.includes('--write');

async function listFolder(prefix) {
    const assets = [];
    let next;
    do {
        const page = await cloudinary.api.resources({ type: 'upload', prefix, max_results: 500, next_cursor: next });
        assets.push(...page.resources);
        next = page.next_cursor;
    } while (next);
    return assets;
}

// The four arrays a draw can sit in: live new/returning, and the next-season draft's.
function drawLists(doc) {
    return [
        ['newDraws', doc.newDraws], ['returningDraws', doc.returningDraws],
        ['draft.newDraws', doc.draft?.newDraws], ['draft.returningDraws', doc.draft?.returningDraws],
    ];
}

async function main() {
    if (!process.env.CLOUDINARY_URL || !process.env.MONGODB_URI) throw new Error('CLOUDINARY_URL and MONGODB_URI are both needed.');
    if (WRITE && process.env.DRAW_BACKFILL_APPROVED !== '1') throw new Error('--write needs DRAW_BACKFILL_APPROVED=1: it renames LIVE Cloudinary images (see this file\'s header).');
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await SeasonalData.findOne({ docType: 'global' });
    if (!doc) { console.log('No global SeasonalData document found -- nothing to backfill.'); return; }

    const draws = drawLists(doc).flatMap(([where, list]) => (list || []).map(d => ({ key: `${where}:${d._id}`, title: d.title, items: (d.items || []).map(i => ({ tier: i.tier, name: i.name })), priceType: d.priceType || '', thumbnailUrl: d.thumbnailUrl })));
    const [legacy, live, archived] = await Promise.all([listFolder(`${LEGACY_FOLDER}/`), listFolder(`${FOLDER}/`), listFolder('archive/draws/')]);
    const plan = planDrawBackfill({ draws, legacy, live, archived });

    console.log(`${WRITE ? 'WRITING' : 'DRY RUN'} -- ${draws.length} current draws · ${legacy.length} in ${LEGACY_FOLDER}/ · ${live.length} already in ${FOLDER}/ · ${archived.length} in archive/draws/`);
    // Undo restores from ChangeLog.inverse, which carries the previous draw and its image URL: those follow the rename too.
    const renamedSlugs = new Set(plan.renames.filter(r => r.from.startsWith(`${LEGACY_FOLDER}/`)).map(r => r.from.slice(LEGACY_FOLDER.length + 1)));
    const logRows = [];
    for await (const row of ChangeLog.find({ inverse: { $ne: null } }).select('inverse').lean().cursor()) {
        const out = rewriteDeep(row.inverse, renamedSlugs);
        if (out.changed) logRows.push({ _id: row._id, inverse: out.value });
    }
    console.log(`  rename ${plan.renames.length} · tag ${plan.metadata.length} · rewrite ${plan.urlUpdates.length} stored URL(s) + ${logRows.length} Undo record(s) · leave ${plan.leftInArchive.length} in archive · skip ${plan.skipped.length}`);
    for (const r of plan.renames) console.log(`  rename  ${r.from}  ->  ${r.to}   (${r.reason})`);
    for (const m of plan.metadata) console.log(`  tag     ${m.publicId}  "${m.title}"${m.fingerprint ? `  fp ${m.fingerprint}` : '  (title only)'}`);
    for (const u of plan.urlUpdates) console.log(`  url     ${u.key}`);
    for (const l of plan.leftInArchive) console.log(`  left    ${l.publicId}   (${l.reason})`);
    for (const s of plan.skipped) console.log(`  skipped ${s.title}   (${s.reason})`);
    if (!WRITE) { console.log('\nDry run: nothing was changed. Re-run with --write once Harkirat has said so.'); return; }

    const failed = [];
    for (const r of plan.renames) {
        try {
            await cloudinary.uploader.rename(r.from, r.to, { overwrite: false, invalidate: true });
            await cloudinary.api.update(r.to, { asset_folder: FOLDER }).catch(() => {});
        } catch (err) { failed.push(`rename ${r.from}: ${safeErrorMessage(err)}`); }
    }
    for (const m of plan.metadata) {
        try {
            const meta = m.draw ? metadataFor(m.title, m.draw) : { tags: [DRAW_TAG], context: { title: m.title } };
            await cloudinary.uploader.add_tag(meta.tags.join(','), [m.publicId]);
            await cloudinary.uploader.add_context(Object.entries(meta.context).map(([k, v]) => `${k}=${v}`).join('|'), [m.publicId]);
        } catch (err) { failed.push(`tag ${m.publicId}: ${safeErrorMessage(err)}`); }
    }
    // The stored URLs, only for images whose rename did not fail.
    const failedFrom = new Set(failed.filter(f => f.startsWith('rename ')).map(f => f.slice(7, f.indexOf(':'))));
    const legacyIdOf = u => `${LEGACY_FOLDER}/${parseStoredUrl(u.from).slug}`;
    const rewrite = new Map(plan.urlUpdates.filter(u => !failedFrom.has(legacyIdOf(u))).map(u => [u.key, u.to]));
    let changed = 0;
    for (const [where, list] of drawLists(doc)) for (const d of list || []) {
        const to = rewrite.get(`${where}:${d._id}`);
        if (to) { d.thumbnailUrl = to; changed++; }
    }
    if (changed) { doc.markModified('newDraws'); doc.markModified('returningDraws'); doc.markModified('draft'); await doc.save(); }
    // Undo records, only for images that really moved (a failed rename keeps its old URL alive).
    const moved = new Set([...renamedSlugs].filter(s => !failedFrom.has(`${LEGACY_FOLDER}/${s}`)));
    let logged = 0;
    for (const row of logRows) {
        const out = rewriteDeep(row.inverse, moved);
        if (out.changed) { await ChangeLog.updateOne({ _id: row._id }, { $set: { inverse: out.value } }); logged++; }
    }
    console.log(`\nDone. ${plan.renames.length - failedFrom.size} renamed, ${changed} stored URL(s) and ${logged} Undo record(s) rewritten, ${failed.length} failure(s).`);
    for (const f of failed) console.log(`  FAILED ${f}`);
    if (failed.length) process.exitCode = 1;
}

main().catch(err => { console.error(`Backfill failed: ${safeErrorMessage(err)}`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
