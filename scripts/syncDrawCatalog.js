#!/usr/bin/env node
// scripts/syncDrawCatalog.js -- compares the draw index (models/DrawCatalog.js, collection `drawcatalogs`) with the tagged draw images in Cloudinary `draws/`, and fills in what the index is missing. Added 2026-11-01 with the model (docs/db-deferred-list.md's DrawCatalog item; the pattern is scripts/syncCatalogToMongo.js).
//
// A DRY RUN UNLESS `--write`. Cloudinary is only ever read. What it writes, with --write:
//   - a document for every tagged draw image the index does not have. Its items come from the image's `items_full` context ("tier:kind:name ; ..."), or, for an image the bot uploaded itself (which carries only normalised item keys), from the live draw on /draws with the same title;
//   - on a document that exists, the fields Cloudinary owns: publicId, imageUrl, tags, price type, and the fingerprint with its items when the image's items changed. Items are MERGED (utils/drawCatalog.js mergeItems), so a hand-written kind, base name or skin name is kept.
// It NEVER writes title, comments, aliases, groupSlug or releaseSeason on a document that exists: those were set by hand and may disagree with Cloudinary on purpose (the Street Fighter Champion's pair). A difference in them is printed, not fixed. A document whose image is gone from Cloudinary is printed and left alone; nothing is deleted.
//
//   node --env-file=.env.dev scripts/syncDrawCatalog.js            # dev database, dry run
//   node --env-file=.env.dev scripts/syncDrawCatalog.js --write
//   MONGODB_URI=<prod> node scripts/syncDrawCatalog.js             # prod: dry run; --write needs Harkirat's go
'use strict';
const mongoose = require('mongoose');
const { slugify, slugOf, drawFingerprint, DRAW_TAG, FOLDER } = require('../utils/cloudinaryCache');
const { withDeliveryDefaults } = require('../utils/cloudinaryDeliveryUrl');
const { mergeItems, topTierOf, splitItemName, isKnownType } = require('../utils/drawCatalog');

const KINDS = new Set(['weapon', 'character', 'vehicle', 'other']);   // 'other' since 2026-11-01 (handlers/manage/itemKinds.js)

// "legendary:weapon:ICR-1 - Wisterian Visage ; epic:character:Kestrel - Twilight Symphony" -> catalog items. The name is everything after the second colon, so a colon inside a name survives. A `comment::<text>` entry is a note, not an item: it goes to `comments`, as the hand-seeded documents have it (Judgment Day's two crate notes, found by comparing a sync-built catalog with prod on 2026-11-01).
function parseItemsFull(text) {
    const items = [];
    const comments = [];
    for (const part of String(text || '').split(' ; ')) {
        const m = /^([a-z]+):([a-z]*):(.+)$/.exec(part.trim());
        if (!m) continue;
        if (m[1] === 'comment') { comments.push(m[3].trim()); continue; }
        items.push({ tier: m[1], kind: KINDS.has(m[2]) ? m[2] : '', name: m[3].trim(), ...splitItemName(m[3]) });
    }
    return { items, comments };
}

const contextOf = asset => asset?.context?.custom || asset?.context || {};
const sameSet = (a, b) => { const x = new Set(a || []), y = new Set(b || []); return x.size === y.size && [...x].every(v => y.has(v)); };

// What Cloudinary says one draw image is, as a catalog document. `liveDraw` ({ title, items }) supplies the items when the image has no items_full. Null when the image says too little to be a draw (no items from either source).
function docFromAsset(asset, liveDraw = null, today = new Date().toISOString().slice(0, 10)) {
    const ctx = contextOf(asset);
    const slug = slugOf(asset.public_id);
    let { items, comments } = parseItemsFull(ctx.items_full);
    // A STALE items_full is ignored (think-pass, 2026-11-01): the bot keeps `fp` and `items` current on every relink, and items_full only since this date (utils/cloudinaryCache.js mirrorCatalogToCloudinary). An older asset whose items an admin edited carries the new fp beside the OLD items_full, and trusting it would write the old items back into the index. Its fingerprint must match the asset's own fp.
    if (items.length && ctx.fp && drawFingerprint({ items }) !== ctx.fp) { items = []; comments = []; }
    if (!items.length && liveDraw?.items?.length) {
        items = mergeItems([], liveDraw.items);
        comments = liveDraw.items.filter(i => i?.tier === 'comment' && i.name).map(i => String(i.name));
    }
    if (!items.length) return null;
    const releaseSeason = /(\d+)/.exec(ctx.release_season || '')?.[1];
    return {
        slug,
        title: ctx.title || liveDraw?.title || slug.replace(/-/g, ' '),
        publicId: asset.public_id,
        imageUrl: withDeliveryDefaults(asset.secure_url),
        priceType: isKnownType(ctx.price_type) ? ctx.price_type : '',
        topTier: topTierOf(items),
        items,
        fp: drawFingerprint({ items }),
        comments,
        aliases: ctx.aliases ? String(ctx.aliases).split(' ; ').map(s => s.trim()).filter(Boolean) : [],
        tags: [...(asset.tags || [])],
        groupSlug: slug,
        ...(releaseSeason ? { releaseSeason: Number(releaseSeason) } : {}),
        source: ctx.source || 'sync',
        indexedOn: ctx.indexed_on || today
    };
}

// PURE: what to do. catalog = the documents now; assets = Cloudinary resources with context and tags; liveDraws = [{ title, items }] from /draws.
function planSync({ catalog = [], assets = [], liveDraws = [], today } = {}) {
    const plan = { inserts: [], updates: [], onlyInCatalog: [], skipped: [], differences: [] };
    const bySlug = new Map(catalog.map(d => [d.slug, d]));
    const liveBySlug = new Map(liveDraws.filter(d => d?.title).map(d => [slugify(d.title), d]));
    const seen = new Set();
    for (const asset of assets) {
        if (!String(asset.public_id).startsWith(`${FOLDER}/`) || !(asset.tags || []).includes(DRAW_TAG)) continue;
        const slug = slugOf(asset.public_id);
        seen.add(slug);
        const want = docFromAsset(asset, liveBySlug.get(slug), today);
        if (!want) { plan.skipped.push({ slug, reason: 'no items in Cloudinary and no live draw with this title' }); continue; }
        const have = bySlug.get(slug);
        if (!have) { plan.inserts.push(want); continue; }

        const set = {};
        if (have.publicId !== want.publicId) set.publicId = want.publicId;
        if (have.imageUrl !== want.imageUrl) set.imageUrl = want.imageUrl;
        if (!sameSet(have.tags, want.tags)) set.tags = want.tags;
        if (want.priceType && have.priceType !== want.priceType) set.priceType = want.priceType;
        if (want.fp && have.fp !== want.fp) {
            set.fp = want.fp;
            set.items = mergeItems(have.items, want.items, catalog);
            // A kind Cloudinary knows and the document did not.
            set.items.forEach((item, i) => { if (!item.kind && want.items[i]?.kind) item.kind = want.items[i].kind; });
            set.topTier = topTierOf(set.items);
        }
        if (Object.keys(set).length) plan.updates.push({ slug, set });

        // Hand-curated fields: printed, never written.
        if (have.title !== want.title) plan.differences.push({ slug, field: 'title', catalog: have.title, cloudinary: want.title });
        if (!sameSet(have.aliases, want.aliases)) plan.differences.push({ slug, field: 'aliases', catalog: (have.aliases || []).join(' ; '), cloudinary: want.aliases.join(' ; ') });
    }
    for (const d of catalog) if (!seen.has(d.slug)) plan.onlyInCatalog.push(d.slug);
    return plan;
}

async function listDrawAssets(cloudinary) {
    const out = [];
    let cursor;
    do {
        const page = await cloudinary.api.resources({ type: 'upload', prefix: `${FOLDER}/`, max_results: 500, context: true, tags: true, next_cursor: cursor });
        out.push(...(page.resources || []));
        cursor = page.next_cursor;
    } while (cursor);
    return out;
}

async function main() {
    const write = process.argv.includes('--write');
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
    const cloudinary = require('cloudinary').v2;
    const DrawCatalog = require('../models/DrawCatalog');
    const SeasonalData = require('../models/SeasonalData');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Connected to ${mongoose.connection.name}. ${write ? 'WRITING.' : 'Dry run: nothing is written (--write to apply).'}`);
    const [catalog, assets, seasonal] = await Promise.all([
        DrawCatalog.find({}).lean(),
        listDrawAssets(cloudinary),
        SeasonalData.findOne({ docType: 'global' }).lean()
    ]);
    const liveDraws = [
        ...(seasonal?.newDraws || []), ...(seasonal?.returningDraws || []),
        ...(seasonal?.draft?.newDraws || []), ...(seasonal?.draft?.returningDraws || [])
    ];
    const plan = planSync({ catalog, assets, liveDraws });

    console.log(`Catalog ${catalog.length} · Cloudinary ${FOLDER}/ ${assets.length} (${assets.filter(a => (a.tags || []).includes(DRAW_TAG)).length} tagged) · live draws ${liveDraws.length}`);
    console.log(`To add ${plan.inserts.length} · to update ${plan.updates.length} · only in the catalog ${plan.onlyInCatalog.length} · skipped ${plan.skipped.length} · hand-curated differences ${plan.differences.length}`);
    for (const d of plan.inserts) console.log(`  + ${d.slug} (${d.items.length} items, ${d.priceType || 'no type'})`);
    for (const u of plan.updates) console.log(`  ~ ${u.slug}: ${Object.keys(u.set).join(', ')}`);
    for (const s of plan.onlyInCatalog) console.log(`  ? ${s}: in the catalog, no tagged image in ${FOLDER}/`);
    for (const s of plan.skipped) console.log(`  - ${s.slug}: ${s.reason}`);
    for (const d of plan.differences) console.log(`  ≠ ${d.slug} ${d.field}: catalog "${d.catalog}" · Cloudinary "${d.cloudinary}" (left as is)`);

    if (write && (plan.inserts.length || plan.updates.length)) {
        const ops = [
            ...plan.inserts.map(doc => ({ updateOne: { filter: { slug: doc.slug }, update: { $setOnInsert: doc }, upsert: true } })),
            ...plan.updates.map(u => ({ updateOne: { filter: { slug: u.slug }, update: { $set: u.set } } }))
        ];
        const res = await DrawCatalog.bulkWrite(ops, { ordered: false });
        console.log(`Written: ${res.upsertedCount} added, ${res.modifiedCount} updated. Catalog now ${await DrawCatalog.countDocuments()}.`);
    }
    await mongoose.disconnect();
}

module.exports = { parseItemsFull, docFromAsset, planSync };

if (require.main === module) {
    main().catch(err => { console.error('Fatal:', err?.message || err?.error?.message || err); process.exit(1); });
}
