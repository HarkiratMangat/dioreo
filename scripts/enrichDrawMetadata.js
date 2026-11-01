#!/usr/bin/env node
// One-off: adds searchable tags and richer context to every draw in Cloudinary draws/ (the 75 just imported plus the 12 the bot already had), and fixes the Alchemy Stars fingerprint after its two epics were added. Existing keys (title, price_type, fp, items) are never changed except Alchemy's fp/items. Adds, per asset: tags ptype_<key>, top_<rarity>, season_<n>_2026 (only for the new draws Harkirat named); context items_full, source, indexed_on, release_season. Cloudinary is shared by dev and prod, so a real run is live. `--dry` writes nothing.
//   node --env-file=.env.dev scripts/enrichDrawMetadata.js --dry
//   node --env-file=.env.dev scripts/enrichDrawMetadata.js
'use strict';
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { metadataFor, slugify, FOLDER, DRAW_TAG } = require('../utils/cloudinaryCache');

const IDX = path.join(__dirname, '..', 'local', 'project', 'features', 'draw-image-index');
const DRY = process.argv.includes('--dry');
const INDEXED_ON = '2026-10-31';
const errText = (e) => e?.message || e?.error?.message || 'unknown error';
const norm = (n) => String(n || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

// Seasons of release, for NEW draws only, exactly as Harkirat listed them (returning draws are never guessed).
const SEASONS = {
    9: ['Sapphire Winter Draw', 'Weresoldier Unleashed Draw', 'Hunger Eternal Draw'],
    8: ["Herrscher's Armory", 'Herrscher of Reason Draw', 'Herrscher of Flamescion Draw', 'Herrscher of Thunder Draw'],
    7: ['Widow’s Bite Draw', 'Undead Legion Series Armory', 'Judgment Day Draw'],
};
const seasonOf = {};
for (const [n, titles] of Object.entries(SEASONS)) for (const t of titles) seasonOf[slugify(t)] = Number(n);

const manifest = require(path.join(IDX, 'upload-manifest.json')).filter(r => r.action === 'upload');
const final = require(path.join(IDX, 'final-decisions.json'));
const kindByName = new Map();
for (const r of final) for (const i of r.items) if (i.kind) kindByName.set(norm(i.name), i.kind);
const row81 = final.find(r => r.row === 81).items.map(i => ({ tier: i.tier, name: i.name, kind: i.kind || 'weapon' }));

const entries = [];
for (const r of manifest) entries.push({ slug: r.slug, title: r.title, priceType: r.priceType, items: r.items, source: 'folder-import-2026-10-31' });
for (const e of require(path.join(IDX, 'existing-draws.json'))) {
    const items = (e.items === 'FROM_ROW_81' ? row81 : e.items).map(i => ({ tier: i.tier, name: i.name, kind: i.kind || kindByName.get(norm(i.name)) || '' }));
    entries.push({ slug: slugify(e.title), title: e.title, priceType: e.priceType, items, source: 'bot-cache', fixFp: e.items === 'FROM_ROW_81' });
}

const RANK = { mythic: 3, legendary: 2, epic: 1 };
const plan = entries.map(e => {
    const real = e.items.filter(i => RANK[i.tier]);
    const top = real.sort((a, b) => RANK[b.tier] - RANK[a.tier])[0]?.tier;
    const season = seasonOf[e.slug];
    const meta = metadataFor(e.title, { items: e.items, priceType: e.priceType });
    const tags = [...(e.priceType ? [`ptype_${e.priceType}`] : []), ...(top ? [`top_${top}`] : []), ...(season ? [`season_${season}_2026`] : [])];
    const itemsFull = e.items.map(i => `${i.tier}:${i.kind || ''}:${i.name}`).join(' ; ');
    const context = { items_full: itemsFull, source: e.source, indexed_on: INDEXED_ON, ...(season ? { release_season: `Season ${season} 2026` } : {}), ...(e.fixFp ? { fp: meta.fp, items: meta.context.items } : {}) };
    return { ...e, publicId: `${FOLDER}/${e.slug}`, tags, context, season, newFpTag: e.fixFp ? `fp_${meta.fp}` : null, itemsFullLen: itemsFull.length };
});

async function main() {
    cloudinary.config(true);
    const have = new Map();
    let cursor;
    do {
        const page = await cloudinary.api.resources_by_tag(DRAW_TAG, { context: true, tags: true, max_results: 500, next_cursor: cursor });
        for (const r of page.resources || []) have.set(r.public_id, r);
        cursor = page.next_cursor;
    } while (cursor);
    const missing = plan.filter(p => !have.has(p.publicId));
    const longest = Math.max(...plan.map(p => p.itemsFullLen));
    const seasonHits = plan.filter(p => p.season).map(p => `${p.slug} -> S${p.season}`);
    const seasonMiss = Object.entries(SEASONS).flatMap(([n, ts]) => ts.filter(t => !plan.some(p => p.slug === slugify(t))).map(t => `S${n} ${t}`));
    console.log(`${plan.length} planned, ${have.size} tagged draws in Cloudinary, ${missing.length} planned but missing: ${missing.map(m => m.publicId).join(', ') || '-'}`);
    console.log(`items_full longest ${longest} chars; season tags (${seasonHits.length}): ${seasonHits.join(', ')}`);
    console.log(`season titles with no asset: ${seasonMiss.join(', ') || 'none'}`);
    const unplanned = [...have.keys()].filter(id => id.startsWith(`${FOLDER}/`) && !plan.some(p => p.publicId === id));
    console.log(`assets in draws/ not in the plan: ${unplanned.join(', ') || 'none'}`);
    if (DRY) { console.log('dry run, nothing written'); return; }

    const results = [];
    let i = 0;
    const worker = async () => {
        while (i < plan.length) {
            const p = plan[i++];
            if (!have.has(p.publicId)) { results.push({ id: p.publicId, error: 'asset missing' }); continue; }
            try {
                if (p.newFpTag) { const old = (have.get(p.publicId).tags || []).filter(t => t.startsWith('fp_') && t !== p.newFpTag); if (old.length) await cloudinary.uploader.remove_tag(old.join(','), [p.publicId]); await cloudinary.uploader.add_tag([...p.tags, p.newFpTag].join(','), [p.publicId]); }
                else if (p.tags.length) await cloudinary.uploader.add_tag(p.tags.join(','), [p.publicId]);
                await cloudinary.uploader.add_context(p.context, [p.publicId]);
                results.push({ id: p.publicId, ok: true });
            } catch (e) { results.push({ id: p.publicId, error: errText(e) }); }
        }
    };
    await Promise.all(Array.from({ length: 4 }, worker));

    // Verify from a fresh listing.
    const after = new Map();
    cursor = undefined;
    do {
        const page = await cloudinary.api.resources_by_tag(DRAW_TAG, { context: true, tags: true, max_results: 500, next_cursor: cursor });
        for (const r of page.resources || []) after.set(r.public_id, r);
        cursor = page.next_cursor;
    } while (cursor);
    let good = 0;
    const bad = [];
    for (const p of plan) {
        const a = after.get(p.publicId), ctx = (a?.context?.custom) || a?.context || {};
        const tagsOk = a && p.tags.every(t => (a.tags || []).includes(t)) && (!p.newFpTag || (a.tags || []).includes(p.newFpTag));
        const ctxOk = a && ctx.items_full === p.context.items_full && ctx.source === p.source && ctx.indexed_on === INDEXED_ON && ctx.title === (ctx.title || p.title) && (!p.season || ctx.release_season === `Season ${p.season} 2026`);
        if (tagsOk && ctxOk) good++; else bad.push(`${p.publicId} tags:${tagsOk} ctx:${ctxOk}`);
    }
    fs.writeFileSync(path.join(IDX, 'enrich-results.json'), JSON.stringify(results, null, 1));
    console.log(`written ${results.filter(r => r.ok).length}, errors ${results.filter(r => r.error).length}; verified from a fresh listing ${good} of ${plan.length}`);
    for (const b of bad) console.log('  NOT VERIFIED', b);
    for (const r of results.filter(r => r.error)) console.log('  ERROR', r.id, r.error);
}
main().catch(e => { console.error(`FAILED: ${errText(e)}`); process.exit(1); });
