// scripts/drawCatalog.test.js -- the draw index (models/DrawCatalog.js) as the bot reads and writes it: the matchers and item merge in utils/drawCatalog.js, resolveThumbnail asking the index before Cloudinary, the draw type a bulk paste or a single add takes from it, and scripts/syncDrawCatalog.js's plan. Cloudinary is a recording stand-in (the same trick as scripts/drawImageLink.test.js) and the catalog is a list handed in, so nothing real is read or written and no database is needed.
const assert = require('assert');
const path = require('path');
const Module = require('module');

process.env.NODE_ENV = 'test';
const ROOT = path.join(__dirname, '..');

const calls = [];
const notFound = () => Object.assign(new Error('Resource not found'), { http_code: 404 });
const fake = {
    api: {
        resource: async (id) => { calls.push(['resource', id]); throw notFound(); },
        resources: async () => { calls.push(['resources']); return { resources: [] }; },
        resources_by_tag: async (tag) => { calls.push(['resources_by_tag', tag]); return { resources: [] }; },
    },
    uploader: {
        upload: async (src, opts) => { calls.push(['upload', opts.public_id]); return { secure_url: `https://res.cloudinary.com/acct/image/upload/v9/${opts.public_id}.jpg` }; },
        add_tag: async () => ({}), remove_tag: async () => ({}), add_context: async () => ({}),
    }
};
const clientPath = path.join(ROOT, 'utils/cloudinaryClient.js');
const stub = new Module(clientPath, null);
stub.filename = clientPath; stub.loaded = true; stub.exports = fake;
require.cache[clientPath] = stub;

const silence = console.error;
console.error = () => {};
const cache = require('../utils/cloudinaryCache');
const catalog = require('../utils/drawCatalog');
const { resolveThumbnailsForDraws } = require('../utils/bulkMerge');
const { parseItemsFull, docFromAsset, planSync } = require('./syncDrawCatalog');

// ---- a small catalog, shaped like the prod documents ----
const url = slug => `https://res.cloudinary.com/acct/image/upload/f_auto,q_auto/v1/draws/${slug}.jpg`;
const item = (tier, name, kind = 'weapon') => { const [baseName, skinName = ''] = name.split(' - '); return { tier, kind, name, baseName, skinName }; };
const entry = (slug, title, items, extra = {}) => ({ slug, title, publicId: `draws/${slug}`, imageUrl: url(slug), priceType: '', items, fp: cache.drawFingerprint({ items }), aliases: [], comments: [], tags: [], groupSlug: slug, ...extra });
const SF = [item('legendary', 'MG42 - Gouki'), item('legendary', 'USS 9 - Chun-Li'), item('legendary', 'LW3-Tundra - Cammy'), item('legendary', 'Grau 5.56 - Ryu')];
const WV = [item('legendary', 'ICR-1 - Wisterian Visage'), item('epic', 'Kestrel - Twilight Symphony', 'character')];
const ENTRIES = [
    entry('wisterian-visage-draw', 'Wisterian Visage Draw', WV, { priceType: 'legendaryGunReactive', aliases: ['Midnight Crescendo Draw'], comments: ['*aka* Midnight Crescendo Draw'] }),
    entry('street-fighter-champion-s-collection-series-armory', "Street Fighter: Champion's Collection Series Armory", SF, { priceType: 'armoryLegendaryWeapon', groupSlug: 'street-fighter-champion-s-collection-series-armory-weapons' }),
    entry('street-fighter-champion-s-collection-series-armory-weapons', "Street Fighter: Champion's Collection Series Armory (Weapons)", SF, { priceType: 'armoryLegendaryWeapon' }),
    entry('hunger-eternal-draw', 'Hunger Eternal Draw', [item('legendary', 'Grav - Vitae Devourer'), item('epic', 'Samael - The Soul Eater', 'character')], { priceType: 'sevenSpinLegendaryWeapon', releaseSeason: 9, tags: ['dioreo_draw', 'season_9_2026'] }),
];
// What an admin types: { tier, name } lines.
const typed = items => items.map(i => ({ tier: i.tier, name: i.name }));

// resolveThumbnail reads the catalog through loadCatalog and writes through recordCatalogImage, both looked up on the module when called, so the test swaps them.
let entries = ENTRIES;
const recorded = [];
const realLoad = catalog.loadCatalog, realRecord = catalog.recordCatalogImage;
catalog.loadCatalog = async () => entries;
catalog.recordCatalogImage = async (args) => { recorded.push(args); return true; };

let failed = 0;
async function t(name, fn) {
    calls.length = 0; recorded.length = 0; entries = ENTRIES;
    try { await fn(); console.log(`  ok   ${name}`); } catch (err) { failed++; console.log(`  FAIL ${name}\n       ${String(err.message).split('\n').join('\n       ')}`); }
}

(async () => {
    console.log('matchers');
    await t('a title finds its own document', () => {
        assert.strictEqual(catalog.matchByName(ENTRIES, 'wisterian visage draw').entry.slug, 'wisterian-visage-draw');
        assert.strictEqual(catalog.matchByName(ENTRIES, 'Wisterian Visage Draw').matchedBy, 'title');
    });
    await t('another name the draw ran under finds it, as an alias', () => {
        const m = catalog.matchByName(ENTRIES, 'Midnight Crescendo Draw');
        assert.strictEqual(m.entry.slug, 'wisterian-visage-draw');
        assert.strictEqual(m.matchedBy, 'alias');
        assert.strictEqual(catalog.matchByName(ENTRIES, 'Some Other Draw'), null);
    });
    await t('same items: the group\'s own document wins over its twin', () => {
        const m = catalog.matchByItems(ENTRIES, { items: typed(SF).reverse(), priceType: '' });
        assert.strictEqual(m.entry.slug, 'street-fighter-champion-s-collection-series-armory-weapons');
        assert.strictEqual(m.matchedBy, 'items');
    });
    await t('a different named type vetoes an items match; blank and Unsure do not', () => {
        assert.strictEqual(catalog.matchByItems(ENTRIES, { items: typed(WV), priceType: 'mythicWeapon' }), null);
        assert.ok(catalog.matchByItems(ENTRIES, { items: typed(WV), priceType: '' }));
        assert.ok(catalog.matchByItems(ENTRIES, { items: typed(WV), priceType: 'unknown' }));
        assert.ok(cache.priceTypesAgree('unknown', 'mythicWeapon'));
        assert.ok(!cache.priceTypesAgree('legendaryGunReactive', 'mythicWeapon'));
    });
    await t('a typo finds the draw by similar title; a different name does not', () => {
        assert.strictEqual(catalog.matchBySimilarTitle(ENTRIES, 'Wisterian Visge Draw').entry.slug, 'wisterian-visage-draw');
        assert.strictEqual(catalog.matchBySimilarTitle(ENTRIES, 'Midnight Crescendoo Draw').entry.slug, 'wisterian-visage-draw');
        assert.strictEqual(catalog.matchBySimilarTitle(ENTRIES, 'Totally Unrelated'), null);
    });
    await t('closest by items names a near draw, never a far one', () => {
        const near = catalog.closestByItems(ENTRIES, { items: [...typed(SF).slice(0, 3), { tier: 'legendary', name: 'AK-47 - Something' }] });
        assert.strictEqual(near.shared, 3);
        assert.strictEqual(catalog.closestByItems(ENTRIES, { items: [{ tier: 'legendary', name: 'Nothing - Here' }] }), null);
    });

    console.log('merging items');
    await t('a hand-written kind, base name and skin name survive a retype', () => {
        const existing = [{ tier: 'legendary', kind: 'weapon', name: 'MG42 - Gouki', baseName: 'MG42', skinName: 'Gouki (Akuma)' }];
        const out = catalog.mergeItems(existing, [{ tier: 'legendary', name: 'Mg42 - Gouki' }]);
        assert.deepStrictEqual(out[0], { tier: 'legendary', kind: 'weapon', name: 'Mg42 - Gouki', baseName: 'MG42', skinName: 'Gouki (Akuma)' });
    });
    await t('a new item is split on " - ", takes a kind another draw knows, and comments are dropped', () => {
        const out = catalog.mergeItems([], [{ tier: 'epic', name: 'Kestrel - Twilight Symphony' }, { tier: 'legendary', name: 'Brand New - Skin' }, { tier: 'comment', name: 'a note' }], ENTRIES);
        assert.deepStrictEqual(out.map(i => [i.kind, i.baseName, i.skinName]), [['character', 'Kestrel', 'Twilight Symphony'], ['', 'Brand New', 'Skin']]);
    });
    await t('a new item\'s kind is guessed from another skin of the same base, then the weapon list; the rest stay blank for the question', () => {
        const out = catalog.mergeItems([], [{ tier: 'legendary', name: 'Kestrel - A Brand New Skin' }, { tier: 'legendary', name: 'Kilo 141 - Fresh' }, { tier: 'epic', name: 'Mystery Thing - X' }], ENTRIES, new Set(['kilo141']));
        assert.deepStrictEqual(out.map(i => i.kind), ['character', 'weapon', '']);
        const missing = catalog.itemsWithoutKind([{ slug: 'some-draw', title: 'Some Draw', aliases: [], items: [{ name: 'A', kind: '' }, { name: 'B', kind: 'weapon' }] }], ['Some Draw', 'Not Indexed Draw']);
        assert.deepStrictEqual(missing, [{ slug: 'some-draw', title: 'Some Draw', name: 'A' }]);
    });
    await t('a new document gets the release season only when the save says New, and only on insert', () => {
        const now = new Date('2026-11-01T16:00:00Z');
        assert.strictEqual(catalog.insertFields('Starfall Echo Draw', 'starfall-echo-draw', { items: [], releaseSeason: 9 }, now).releaseSeason, 9);
        assert.ok(!('releaseSeason' in catalog.insertFields('Old Draw', 'old-draw', { items: [] }, now)), 'a returning draw is never given one');
        assert.ok(!('releaseSeason' in catalog.insertFields('X', 'x', { items: [], releaseSeason: null }, now)));
        // The year travels with the season (2026-11-04: seasons 1-12 repeat each year). A staged draw may name its own year; a live one is this year; no season means no year.
        assert.strictEqual(catalog.insertFields('Starfall Echo Draw', 'starfall-echo-draw', { items: [], releaseSeason: 9 }, now).releaseYear, 2026);
        assert.strictEqual(catalog.insertFields('January Draw', 'january-draw', { items: [], releaseSeason: 1, releaseYear: 2027 }, now).releaseYear, 2027);
        assert.ok(!('releaseYear' in catalog.insertFields('Old Draw', 'old-draw', { items: [] }, now)));
        // recordCatalogImage uses insertFields only under `$setOnInsert`, so an existing document keeps its season.
        assert.match(require('fs').readFileSync(require('path').join(__dirname, '../utils/drawCatalog.js'), 'utf8'), /if \(!existing\) update\.\$setOnInsert = insertFields\(/);
    });
    await t('the Cloudinary mirror writes items_full, the bot tags, and the season only on insert', () => {
        const doc = { ...ENTRIES[3], tags: ['dioreo_draw', 'ptype_sevenSpinLegendaryWeapon', 'top_legendary'], indexedOn: '2026-11-01' };
        const plan = cache.catalogMirrorPlan(doc, { previousTags: ['dioreo_draw', 'ptype_mythicWeapon', 'top_legendary', 'season_9_2026'], inserted: false, year: 2026 });
        assert.strictEqual(plan.context.items_full, 'legendary:weapon:Grav - Vitae Devourer ; epic:character:Samael - The Soul Eater');
        assert.deepStrictEqual(plan.addTags, ['ptype_sevenSpinLegendaryWeapon', 'top_legendary']);
        assert.deepStrictEqual(plan.removeTags, ['ptype_mythicWeapon'], 'only a stale bot tag goes; dioreo_draw and the season tag stay');
        assert.ok(!('release_season' in plan.context) && !('source' in plan.context), 'an existing asset keeps its own season and source');
        const ins = cache.catalogMirrorPlan({ ...doc, releaseSeason: 9 }, { inserted: true, year: 2026 });
        assert.strictEqual(ins.context.release_season, 'Season 9 2026');
        assert.ok(ins.addTags.includes('season_9_2026'));
        assert.strictEqual(ins.context.source, 'bot');
        // What the mirror writes, sync reads back unchanged.
        assert.deepStrictEqual(parseItemsFull(plan.context.items_full).items.map(i => i.kind), ['weapon', 'character']);
    });
    await t('sync ignores an items_full older than the asset fp, and falls back to the live draw', () => {
        const asset = { public_id: 'draws/hunger-eternal-draw', secure_url: url('hunger-eternal-draw'), tags: [], context: { custom: {
            title: 'Hunger Eternal Draw', items_full: 'legendary:weapon:Old Gun - Old Skin', fp: ENTRIES[3].fp } } };
        assert.strictEqual(docFromAsset(asset), null, 'the stale items are not written back');
        const live = { title: 'Hunger Eternal Draw', items: typed(ENTRIES[3].items) };
        assert.strictEqual(docFromAsset(asset, live).fp, ENTRIES[3].fp);
        const fresh = { ...asset, context: { custom: { ...asset.context.custom, items_full: cache.catalogMirrorPlan(ENTRIES[3]).context.items_full } } };
        assert.strictEqual(docFromAsset(fresh).items[1].kind, 'character', 'a current items_full is read, kinds included');
        const seasoned = { ...fresh, context: { custom: { ...fresh.context.custom, release_season: 'Season 10 2026' } } };
        assert.strictEqual(docFromAsset(seasoned).releaseSeason, 10);
        assert.strictEqual(docFromAsset(seasoned).releaseYear, 2026, 'the year is read back from release_season');
    });
    await t('Add or Replace Multiple pass the live season only for New text', () => {
        const src = require('fs').readFileSync(require('path').join(__dirname, '../core/ops/draws.js'), 'utf8');
        assert.match(src, /if \(op\.target\?\.category !== 'new' \|\| !op\.payload\.text\) return null;/);
        assert.ok((src.match(/releaseSeason: await newSeasonFor\(op, session\)|newSeasonFor\(op, session\)/g) || []).length >= 2, 'both bulk ops ask for it');
    });
    await t('top tier and tags: bot tags recomputed, a season tag kept', () => {
        assert.strictEqual(catalog.topTierOf([{ tier: 'epic' }, { tier: 'mythic' }, { tier: 'legendary' }]), 'mythic');
        assert.deepStrictEqual(catalog.catalogTags(['dioreo_draw', 'fp_old', 'ptype_x', 'top_epic', 'season_9_2026'], { fp: 'new', priceType: 'mythicWeapon', topTier: 'mythic' }),
            ['dioreo_draw', 'fp_new', 'ptype_mythicWeapon', 'top_mythic', 'season_9_2026']);
    });
    await t('recordCatalogImage does nothing without a database (scripts, tests)', async () => {
        assert.strictEqual(await realRecord({ title: 'X', publicId: 'draws/x', url: url('x'), draw: { items: typed(WV) } }), false);
        assert.deepStrictEqual(await realLoad(), []);
    });

    console.log('resolveThumbnail asks the index first');
    await t('a title in the index: its image, with no Cloudinary lookup', async () => {
        const out = await cache.resolveThumbnail('Hunger Eternal Draw', '');
        assert.strictEqual(out.url, url('hunger-eternal-draw'));
        assert.strictEqual(out.matchedBy, 'title');
        assert.strictEqual(out.matchedTitle, null);
        assert.deepStrictEqual(calls, []);
        assert.strictEqual(out.catalog.priceType, 'sevenSpinLegendaryWeapon');
    });
    await t('another name: the same draw\'s image, named in the result', async () => {
        const out = await cache.resolveThumbnail('Midnight Crescendo Draw', '');
        assert.strictEqual(out.url, url('wisterian-visage-draw'));
        assert.strictEqual(out.matchedBy, 'alias');
        assert.strictEqual(out.matchedTitle, 'Wisterian Visage Draw');
    });
    await t('new title, known items: found by items after one Cloudinary title miss', async () => {
        const out = await cache.resolveThumbnail('Fighters Return Draw', '', { items: typed(SF), priceType: '' });
        assert.strictEqual(out.url, url('street-fighter-champion-s-collection-series-armory-weapons'));
        assert.strictEqual(out.matchedBy, 'items');
        assert.ok(!calls.some(c => c[0] === 'resources_by_tag'), 'no fingerprint lookup in Cloudinary');
        assert.strictEqual(out.catalog.matchedBy, 'items');
    });
    await t('not in the index: Cloudinary is asked exactly as before', async () => {
        entries = [];
        const out = await cache.resolveThumbnail('Unknown Draw', '', { items: typed(WV), priceType: '' });
        assert.strictEqual(out.url, null);
        assert.ok(calls.some(c => c[0] === 'resource'), 'title lookup');
        assert.ok(calls.some(c => c[0] === 'resources_by_tag'), 'fingerprint lookup');
        assert.ok(calls.some(c => c[0] === 'resources'), 'fuzzy listing');
        assert.strictEqual(out.catalog, null);
    });
    await t('a provided URL still reports what the index knows, and the upload is recorded', async () => {
        const out = await cache.resolveThumbnail('Wisterian Visage Draw', 'https://example.com/new.jpg', { items: typed(WV), priceType: '' });
        assert.strictEqual(out.reused, false);
        assert.strictEqual(out.catalog.priceType, 'legendaryGunReactive');
        assert.strictEqual(recorded.length, 1);
        assert.strictEqual(recorded[0].publicId, 'draws/wisterian-visage-draw');
    });
    await t('an upload with no items (a calendar image) is not recorded as a draw', async () => {
        await cache.resolveThumbnail('Some Calendar Event', 'https://example.com/cal.jpg');
        assert.strictEqual(recorded.length, 0);
    });
    await t('the error names the closest draw from the index', async () => {
        const out = await cache.resolveThumbnail('Zzz Qqq', '', { items: [...typed(SF).slice(0, 3), { tier: 'legendary', name: 'AK-47 - Something' }], priceType: '' });
        assert.match(out.error, /Closest by items: "Street Fighter/);
    });

    console.log('draw type from the index');
    await t('a fresh paste with no type or Unsure takes the index\'s type and says so', async () => {
        const draws = [
            { title: 'Hunger Eternal Draw', items: typed(ENTRIES[3].items), priceType: '', thumbnailUrl: null },
            { title: 'Midnight Crescendo Draw', items: typed(WV), priceType: 'unknown', thumbnailUrl: null },
            { title: 'Wisterian Visage Draw', items: typed(WV), priceType: 'mythicWeapon', thumbnailUrl: null },
        ];
        const out = await resolveThumbnailsForDraws(draws, { fillTypes: true });
        assert.deepStrictEqual(draws.map(d => d.priceType), ['sevenSpinLegendaryWeapon', 'legendaryGunReactive', 'mythicWeapon']);
        assert.strictEqual(out.typesFilled.length, 2);
        assert.match(out.typesFilled[0], /^Hunger Eternal Draw: /);
    });
    await t('an Undo replay (no fillTypes) is left exactly as stored', async () => {
        const draws = [{ title: 'Hunger Eternal Draw', items: typed(ENTRIES[3].items), priceType: '', thumbnailUrl: null }];
        const out = await resolveThumbnailsForDraws(draws);
        assert.strictEqual(draws[0].priceType, '');
        assert.deepStrictEqual(out.typesFilled, []);
    });
    await t('a near-miss title never sets a type', async () => {
        const draws = [{ title: 'Hunger Eternl Draw', items: [{ tier: 'legendary', name: 'Other - Gun' }], priceType: '', thumbnailUrl: null }];
        await resolveThumbnailsForDraws(draws, { fillTypes: true });
        assert.strictEqual(draws[0].priceType, '');
    });

    console.log('scripts/syncDrawCatalog.js');
    const asset = (slug, ctx, tags = ['dioreo_draw']) => ({ public_id: `draws/${slug}`, secure_url: `https://res.cloudinary.com/acct/image/upload/v1/draws/${slug}.jpg`, tags, context: { custom: ctx } });
    await t('items_full parses into catalog items, a colon in a name kept, a comment to comments', () => {
        assert.deepStrictEqual(parseItemsFull('legendary:weapon:ICR-1 - Wisterian Visage ; epic:character:Kestrel - Time: Zero ; comment::Bought separately; as a crate.'), { items: [
            { tier: 'legendary', kind: 'weapon', name: 'ICR-1 - Wisterian Visage', baseName: 'ICR-1', skinName: 'Wisterian Visage' },
            { tier: 'epic', kind: 'character', name: 'Kestrel - Time: Zero', baseName: 'Kestrel', skinName: 'Time: Zero' },
        ], comments: ['Bought separately; as a crate.'] });
    });
    await t('an image the bot uploaded (no items_full) takes its items from the live draw', () => {
        const doc = docFromAsset(asset('new-draw', { title: 'New Draw', price_type: 'mythicWeapon' }), { title: 'New Draw', items: [{ tier: 'mythic', name: 'AK117 - Thing' }, { tier: 'comment', name: 'a note' }] }, '2026-11-01');
        assert.strictEqual(doc.items.length, 1);
        assert.strictEqual(doc.topTier, 'mythic');
        assert.deepStrictEqual(doc.comments, ['a note']);
        assert.strictEqual(doc.imageUrl, 'https://res.cloudinary.com/acct/image/upload/f_auto,q_auto/v1/draws/new-draw.jpg');
        assert.strictEqual(docFromAsset(asset('bare', { title: 'Bare' }), null), null);
    });
    await t('the plan: adds the missing, updates Cloudinary-owned fields, never the hand-curated ones', () => {
        const have = ENTRIES.map(e => ({ ...e, tags: ['dioreo_draw', `fp_${e.fp}`] }));
        const assets = [
            // same as the catalog, but a renamed title in Cloudinary: a difference, not a write
            asset('wisterian-visage-draw', { title: 'Wisterian Visage', price_type: 'legendaryGunReactive', items_full: 'legendary:weapon:ICR-1 - Wisterian Visage ; epic:character:Kestrel - Twilight Symphony', aliases: 'Midnight Crescendo Draw' }, ['dioreo_draw', `fp_${ENTRIES[0].fp}`]),
            // items changed: fp and items written, curated skin name kept
            asset('hunger-eternal-draw', { title: 'Hunger Eternal Draw', price_type: 'sevenSpinLegendaryWeapon', items_full: 'legendary:weapon:Grav - Vitae Devourer ; epic:character:Samael - The Soul Eater ; epic:weapon:AK-47 - Extra' }, ['dioreo_draw']),
            // new
            asset('brand-new-draw', { title: 'Brand New Draw', price_type: 'mythicWeapon', items_full: 'mythic:weapon:AK117 - Thing' }),
            // not a draw image
            asset('loose', { title: 'Loose' }, []),
        ];
        const plan = planSync({ catalog: have, assets, today: '2026-11-01' });
        assert.deepStrictEqual(plan.inserts.map(d => d.slug), ['brand-new-draw']);
        const upd = Object.fromEntries(plan.updates.map(u => [u.slug, u.set]));
        assert.ok(!upd['wisterian-visage-draw']?.title, 'title never written');
        assert.deepStrictEqual(Object.keys(upd['hunger-eternal-draw']).sort(), ['fp', 'items', 'tags', 'topTier']);
        assert.strictEqual(upd['hunger-eternal-draw'].items[1].kind, 'character');
        assert.deepStrictEqual(plan.differences.map(d => `${d.slug}:${d.field}`), ['wisterian-visage-draw:title']);
        assert.deepStrictEqual(plan.onlyInCatalog.sort(), ['street-fighter-champion-s-collection-series-armory', 'street-fighter-champion-s-collection-series-armory-weapons']);
    });

    console.error = silence;
    console.log(failed ? `\n${failed} FAILED` : '\nall passed');
    process.exit(failed ? 1 : 0);
})();
