// scripts/drawImageLink.test.js -- a draw's image is linked to the draw by its items, and kept forever in draws/ (Harkirat, 2026-10-30 16:02 EDT). Runs utils/cloudinaryCache.js against a recording stand-in for utils/cloudinaryClient.js, so nothing real is read or written, plus the backfill's plan (utils/drawImageBackfill.js), which is pure.
const assert = require('assert');
const path = require('path');
const Module = require('module');

process.env.NODE_ENV = 'test';
const ROOT = path.join(__dirname, '..');

// ---- a tiny Cloudinary: public_id -> { secure_url, created_at, tags, context } ----
let store = new Map();
let clock = 1;
const calls = [];
const notFound = () => Object.assign(new Error('Resource not found'), { http_code: 404 });
const url = (id, v = 1) => `https://res.cloudinary.com/acct/image/upload/v${v}/${id}.jpg`;
const shape = (id, a, withContext) => ({ public_id: id, secure_url: a.secure_url, created_at: a.created_at, tags: a.tags, ...(withContext ? { context: { custom: { ...a.context } } } : {}) });
const parseContext = str => Object.fromEntries(String(str).split('|').map(kv => [kv.slice(0, kv.indexOf('=')), kv.slice(kv.indexOf('=') + 1)]));
const put = (id, { tags = [], context = {}, v = 1 } = {}) => store.set(id, { secure_url: url(id, v), created_at: new Date(Date.UTC(2026, 9, 1) + (clock++) * 1000).toISOString(), tags: [...tags], context: { ...context } });
const fake = {
    api: {
        resource: async (id, opts = {}) => { calls.push(['resource', id]); if (!store.has(id)) throw notFound(); return shape(id, store.get(id), opts.context); },
        resources: async (opts) => ({ resources: [...store].filter(([id]) => id.startsWith(opts.prefix)).map(([id, a]) => shape(id, a, opts.context)) }),
        resources_by_tag: async (tag, opts = {}) => ({ resources: [...store].filter(([, a]) => a.tags.includes(tag)).map(([id, a]) => shape(id, a, opts.context)) }),
        update: async () => ({}),
    },
    uploader: {
        upload: async (src, opts) => {
            calls.push(['upload', src, opts.public_id]);
            put(opts.public_id, { tags: opts.tags || [], context: opts.context || {}, v: 2 });
            return { secure_url: store.get(opts.public_id).secure_url };
        },
        add_tag: async (tags, ids) => { calls.push(['add_tag', tags, ids]); for (const id of ids) { const a = store.get(id); for (const t of tags.split(',')) if (!a.tags.includes(t)) a.tags.push(t); } return {}; },
        remove_tag: async (tag, ids) => { calls.push(['remove_tag', tag, ids]); for (const id of ids) { const a = store.get(id); if (a) a.tags = a.tags.filter(t => t !== tag); } return {}; },
        add_context: async (ctx, ids) => { calls.push(['add_context', ctx, ids]); for (const id of ids) Object.assign(store.get(id).context, parseContext(ctx)); return {}; },
    }
};
const clientPath = path.join(ROOT, 'utils/cloudinaryClient.js');
const stub = new Module(clientPath, null);
stub.filename = clientPath; stub.loaded = true; stub.exports = fake;
require.cache[clientPath] = stub;

const silence = console.error;
console.error = () => {};
const cache = require('../utils/cloudinaryCache');
const { planDrawBackfill, parseStoredUrl, toDrawsUrl, rewriteDeep } = require('../utils/drawImageBackfill');

let failed = 0;
async function t(name, fn) {
    store = new Map(); calls.length = 0;
    try { await fn(); console.log(`  ok   ${name}`); } catch (err) { failed++; console.log(`  FAIL ${name}\n       ${String(err.message).split('\n').join('\n       ')}`); }
}
const it = (tier, name) => ({ tier, name });
// Each test uses its own item names: the module keeps a per-process memo of what it has resolved.
const draw = (tag, extra = {}) => ({ items: [it('legendary', `${tag} Alpha`), it('epic', `${tag} Beta`), it('epic', `${tag} Gamma`), it('rare', `${tag} Delta`), it('rare', `${tag} Epsilon`)], priceType: '', ...extra });

(async () => {
    await t('the fingerprint is the items and their rarities: case, dashes and the comment line do not change it; a rarity or an item does', () => {
        const a = { items: [it('legendary', 'HS0405 - Final Judgement'), it('epic', 'Model T-800'), it('comment', 'Acquire both to unlock')] };
        const b = { items: [it('epic', 'model  t800'), it('legendary', 'HS0405 – Final  Judgement'), it('comment', 'a different note')] };
        assert.strictEqual(cache.drawFingerprint(a), cache.drawFingerprint(b));
        assert.notStrictEqual(cache.drawFingerprint(a), cache.drawFingerprint({ items: [it('legendary', 'HS0405 - Final Judgement'), it('legendary', 'Model T-800')] }), 'a changed rarity is another draw');
        assert.notStrictEqual(cache.drawFingerprint(a), cache.drawFingerprint({ items: [it('legendary', 'HS0405 - Final Judgement'), it('epic', 'Model T-1000')] }));
        assert.strictEqual(cache.drawFingerprint({ items: [it('comment', 'only a note')] }), null);
        assert.strictEqual(cache.drawFingerprint({}), null);
    });

    await t('an upload goes to draws/<slug> with the draw\'s tags and context, and nothing is archived', async () => {
        const d = draw('Up1');
        const out = await cache.cacheThumbnail('Molten Fusion Draw', 'https://example.com/a.jpg', d);
        assert.ok(out.cached);
        assert.deepStrictEqual([...store.keys()], ['draws/molten-fusion-draw']);
        const a = store.get('draws/molten-fusion-draw');
        const fp = cache.drawFingerprint(d);
        assert.deepStrictEqual(a.tags, ['dioreo_draw', `fp_${fp}`]);
        assert.strictEqual(a.context.title, 'Molten Fusion Draw');
        assert.strictEqual(a.context.fp, fp);
        assert.ok(a.context.items.split(',').length === 5);
        assert.ok(!calls.some(c => c[2]?.startsWith('archive/')));
    });

    await t('a renamed draw with no image finds its old one by its items, and says which draw it came from', async () => {
        const d = draw('Ren1');
        await cache.cacheThumbnail('Old Name Draw', 'https://example.com/a.jpg', d);
        const out = await cache.resolveThumbnail('Totally New Name', '', d);
        assert.strictEqual(out.reused, true);
        assert.strictEqual(out.matchedBy, 'items');
        assert.strictEqual(out.matchedTitle, 'Old Name Draw');
        assert.ok(out.url.includes('draws/old-name-draw'));
    });

    await t('the same title\'s new image replaces it in place; a RENAMED draw\'s new image never lands on another draw\'s asset, and the items link follows the newest', async () => {
        const d = draw('Ovr1');
        await cache.cacheThumbnail('First Name', 'https://example.com/a.jpg', d);
        await cache.resolveThumbnail('First Name', 'https://example.com/a2.jpg', d);
        assert.deepStrictEqual([...store.keys()], ['draws/first-name'], 'same title: one asset, replaced in place');
        const out = await cache.resolveThumbnail('Second Name', 'https://example.com/b.jpg', d);
        assert.ok(out.cached && !out.reused);
        assert.deepStrictEqual([...store.keys()].sort(), ['draws/first-name', 'draws/second-name'], 'the first draw\'s image is untouched');
        assert.strictEqual(store.get('draws/first-name').secure_url.includes('/v2/'), true);
        const later = await cache.resolveThumbnail('Third Name', '', d);
        assert.strictEqual(later.matchedBy, 'items');
        assert.strictEqual(later.matchedTitle, 'Second Name', 'the newest image carrying these items');
    });

    await t('a changed item is another draw: nothing is reused, and the error names the closest one without using it', async () => {
        const d = draw('Chg1');
        await cache.cacheThumbnail('Original Draw', 'https://example.com/a.jpg', d);
        const changed = { ...d, items: [...d.items.slice(0, 4), it('rare', 'Chg1 Zeta')] };
        const out = await cache.resolveThumbnail('Reworked Draw Of Something Else', '', changed);
        assert.strictEqual(out.url, null);
        assert.match(out.error, /Closest by items: "Original Draw" \(4 of 5 the same\), not reused/);
        const far = { ...d, items: [...d.items.slice(0, 2), it('rare', 'Chg1 X'), it('rare', 'Chg1 Y'), it('rare', 'Chg1 Z')] };
        const out2 = await cache.resolveThumbnail('Reworked Draw Of Something Else', '', far);
        assert.ok(!/Closest/.test(out2.error), 'two of five shared is not close');
    });

    await t('price type is a veto only when both draws name one', async () => {
        const d = draw('Pt1', { priceType: 'mythicWeapon' });
        await cache.cacheThumbnail('Typed Draw', 'https://example.com/a.jpg', d);
        const other = await cache.resolveThumbnail('Elsewhere', '', { ...d, priceType: 'legendaryGunReactive' });
        assert.strictEqual(other.url, null, 'two different types');
        const unset = await cache.resolveThumbnail('Elsewhere Two', '', { ...d, priceType: '' });
        assert.strictEqual(unset.matchedBy, 'items', 'one side unset still matches');
    });

    await t('the title still wins first, and a title match relinks the image to the draw\'s current items', async () => {
        const first = draw('Rel1');
        await cache.cacheThumbnail('Same Title Draw', 'https://example.com/a.jpg', first);
        const reworked = { ...first, items: [...first.items.slice(0, 4), it('rare', 'Rel1 New Item')] };
        const out = await cache.resolveThumbnail('Same Title Draw', '', reworked);
        assert.strictEqual(out.matchedBy, 'title');
        const a = store.get('draws/same-title-draw');
        assert.ok(a.tags.includes(`fp_${cache.drawFingerprint(reworked)}`), 'the new items point at it');
        assert.ok(!a.tags.includes(`fp_${cache.drawFingerprint(first)}`), 'the old ones no longer do');
    });

    await t('an image still in temp_draws/ is found by title until the backfill has moved it', async () => {
        put('temp_draws/legacy-draw');
        const out = await cache.resolveThumbnail('Legacy Draw', '', draw('Leg1'));
        assert.strictEqual(out.reused, true);
        assert.ok(out.url.includes('temp_draws/legacy-draw'));
    });

    await t('a draw saved without items still works, by title only, and tags nothing', async () => {
        await cache.cacheThumbnail('Bare Draw', 'https://example.com/a.jpg');
        assert.deepStrictEqual(store.get('draws/bare-draw').tags, []);
        const out = await cache.resolveThumbnail('Bare Draw', '');
        assert.strictEqual(out.matchedBy, 'title');
    });

    // ---- the backfill plan ----
    const A = (id) => ({ public_id: id });
    const stored = id => `https://res.cloudinary.com/acct/image/upload/f_auto,q_auto/v7/${id}.jpg`;
    await t('the plan: current draws move and are linked, leftovers move, the newest archived copy moves, the rest stay', () => {
        const draws = [
            { key: 'newDraws:1', title: 'Live Draw', items: [it('legendary', 'A'), it('epic', 'B')], priceType: 'mythicWeapon', thumbnailUrl: stored('temp_draws/live-draw') },
            { key: 'returningDraws:2', title: 'Already Moved', items: [it('epic', 'C')], priceType: '', thumbnailUrl: stored('draws/already-moved') },
            { key: 'newDraws:3', title: 'Elsewhere', items: [it('epic', 'D')], priceType: '', thumbnailUrl: 'https://scontent.example.com/x.jpg' },
            { key: 'draft.newDraws:4', title: 'Back Again', items: [it('epic', 'E')], priceType: '', thumbnailUrl: null },
        ];
        const plan = planDrawBackfill({
            draws,
            legacy: [A('temp_draws/live-draw'), A('temp_draws/stray')],
            live: [A('draws/already-moved')],
            archived: [A('archive/draws/old-one-20261001-100000'), A('archive/draws/old-one-20261015-120000'), A('archive/draws/back-again-20261010-090000'), A('archive/draws/stray-20261010-090000')],
        });
        assert.deepStrictEqual(plan.renames.map(r => [r.from, r.to]).sort((x, y) => x[1].localeCompare(y[1])), [
            ['archive/draws/back-again-20261010-090000', 'draws/back-again'],
            ['temp_draws/live-draw', 'draws/live-draw'],
            ['archive/draws/old-one-20261015-120000', 'draws/old-one'],
            ['temp_draws/stray', 'draws/stray'],
        ]);
        assert.deepStrictEqual(plan.urlUpdates, [{ key: 'newDraws:1', from: stored('temp_draws/live-draw'), to: stored('draws/live-draw') }]);
        const meta = Object.fromEntries(plan.metadata.map(m => [m.publicId, m]));
        assert.ok(meta['draws/live-draw'].fingerprint, 'a current draw is linked by its items');
        assert.ok(meta['draws/already-moved'].fingerprint, 'one already in draws/ is tagged too');
        assert.ok(meta['draws/back-again'].fingerprint, 'an archived image picks up the items of the draw that is back');
        assert.strictEqual(meta['draws/old-one'].fingerprint, null, 'no current draw: title only');
        assert.strictEqual(meta['draws/old-one'].title, 'old one');
        assert.deepStrictEqual(plan.leftInArchive.map(l => l.publicId).sort(), ['archive/draws/old-one-20261001-100000', 'archive/draws/stray-20261010-090000']);
        assert.strictEqual(plan.skipped.length, 1, 'the external image');
        assert.ok(!plan.renames.some(r => r.reason === undefined));
    });
    await t('the plan is empty once everything has moved, and never overwrites a draws/ image', () => {
        const done = planDrawBackfill({ draws: [], legacy: [], live: [A('draws/a')], archived: [] });
        assert.deepStrictEqual(done.renames, []);
        const clash = planDrawBackfill({ draws: [], legacy: [A('temp_draws/a')], live: [A('draws/a')], archived: [A('archive/draws/a-20261001-100000')] });
        assert.deepStrictEqual(clash.renames, []);
        assert.strictEqual(clash.skipped.length, 1);
        assert.strictEqual(clash.leftInArchive.length, 1);
    });
    await t('stored URLs are read and rewritten only for Cloudinary draw images', () => {
        assert.deepStrictEqual(parseStoredUrl(stored('temp_draws/x-y')), { folder: 'temp_draws', slug: 'x-y' });
        assert.strictEqual(parseStoredUrl('https://example.com/temp_draws/x.jpg'), null);
        assert.strictEqual(toDrawsUrl(stored('temp_draws/x-y')), stored('draws/x-y'));
    });

    await t('Undo records follow a rename: only the slugs that moved are rewritten, anywhere in the record', () => {
        const inverse = { type: 'draw.edit', payload: { thumbnailUrl: stored('temp_draws/moved-one'), nested: [{ thumbnailUrl: stored('temp_draws/stays-put') }, { when: new Date(0), n: 3 }] } };
        const out = rewriteDeep(inverse, new Set(['moved-one']));
        assert.ok(out.changed);
        assert.strictEqual(out.value.payload.thumbnailUrl, stored('draws/moved-one'));
        assert.strictEqual(out.value.payload.nested[0].thumbnailUrl, stored('temp_draws/stays-put'), 'an image that did not move keeps its URL');
        assert.ok(out.value.payload.nested[1].when instanceof Date);
        assert.strictEqual(inverse.payload.thumbnailUrl, stored('temp_draws/moved-one'), 'the input is not mutated');
        assert.strictEqual(rewriteDeep({ a: 'nothing here' }, new Set(['moved-one'])).changed, false);
    });
    await t('a second run repairs a half-finished one: the image moved but the stored URL did not', () => {
        const plan = planDrawBackfill({
            draws: [{ key: 'newDraws:1', title: 'Half', items: [it('epic', 'A')], priceType: '', thumbnailUrl: stored('temp_draws/half') }],
            legacy: [], live: [A('draws/half')], archived: [],
        });
        assert.deepStrictEqual(plan.renames, []);
        assert.deepStrictEqual(plan.urlUpdates.map(u => u.to), [stored('draws/half')]);
    });

    console.error = silence;
    if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
    console.log('\ndrawImageLink: all passing');
})();
