// scripts/sweepFixes.test.js — pins the fixes from the 2026-10-20 v3 sweep that can be checked without Discord, Mongo or Cloudinary.
//
// Each check names the bug it guards. All of them failed, or could not have been written, against v3-pre-release at 0c7b979.
const assert = require('assert');

let failures = 0;
const pending = [];
function check(name, fn) { pending.push([name, fn]); }

// Recursive Text Display total, the number Discord's 4,000-character cap is measured against.
function textLength(node) {
    if (Array.isArray(node)) return node.reduce((n, c) => n + textLength(c), 0);
    let n = node && node.type === 10 ? (node.content || '').length : 0;
    for (const c of (node && node.components) || []) n += textLength(c);
    if (node && node.accessory) n += textLength(node.accessory);
    return n;
}

// ── #1 the thumbnail cleanup ──────────────────────────────────────────────
const { selectExpiredThumbnails, EXPIRY_DAYS } = require('../utils/cloudinaryCache');
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 20);
const asset = (id, ageDays) => ({
    public_id: `temp_draws/${id}`,
    secure_url: `https://res.cloudinary.com/demo/image/upload/v1/temp_draws/${id}.png`,
    created_at: new Date(NOW - ageDays * DAY).toISOString()
});

check('an in-use thumbnail older than 45 days is KEPT, whatever URL form it was stored in', () => {
    const assets = [asset('live', EXPIRY_DAYS + 15), asset('legacy', EXPIRY_DAYS + 15)];
    const inUse = new Set([
        'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/temp_draws/live.png', // what cacheThumbnail stores today
        'https://res.cloudinary.com/demo/image/upload/v1/temp_draws/legacy.png'               // a URL stored before the f_auto,q_auto convention
    ]);
    assert.deepStrictEqual(selectExpiredThumbnails(assets, inUse, NOW), []);
});

check('an unused thumbnail is deleted only once it is past 45 days', () => {
    const assets = [asset('old', EXPIRY_DAYS + 1), asset('young', EXPIRY_DAYS - 1)];
    assert.deepStrictEqual(selectExpiredThumbnails(assets, new Set([undefined, null]), NOW).map(a => a.public_id), ['temp_draws/old']);
});

// ── #4 /draws and the 4,000-character text cap ─────────────────────────────
const draws = require('../commands/draws');
const item = (i) => ({ name: `Legendary Blueprint Number ${i} - With A Long Variant Name`, tier: i % 2 ? 'legendary' : 'mythic' });
const draw = (i, items) => ({ title: `Draw ${i}: A Fairly Long Lucky Draw Title`, date: new Date(NOW), thumbnailUrl: `https://example.com/${i}.png`, items: Array.from({ length: items }, (_, k) => item(k)) });
const season = (list) => ({ currentSeasonTitle: 'Season 10: Test', newDraws: list, returningDraws: [] });

check('every /draws page stays under 4,000 characters of text, however many items its draws carry', () => {
    for (const items of [3, 9, 12, 20]) {
        const list = Array.from({ length: 14 }, (_, i) => draw(i, items));
        const pages = draws.paginateDraws(list);
        assert.strictEqual(pages.flat().length, list.length, 'no draw may be dropped between pages');
        for (let p = 0; p < pages.length; p++) {
            const n = textLength(draws.buildContainer(season(list), 'new', p));
            assert.ok(n <= 4000, `${items}-item draws, page ${p + 1}: ${n} characters`);
        }
    }
});

check('small draws still page at six, the component cap', () => {
    const pages = draws.paginateDraws(Array.from({ length: 13 }, (_, i) => draw(i, 2)));
    assert.deepStrictEqual(pages.map(p => p.length), [6, 6, 1]);
});

check('one draw too long for any page is trimmed with a "…and N more" line', () => {
    const sections = draws.buildDrawSections([draw(0, 200)]);
    const text = sections[0].components[0].content;
    assert.ok(text.length <= draws.DRAW_TEXT_BUDGET, `${text.length} characters`);
    assert.match(text, /…and \d+ more/);
});

// ── #11 /patch notes and the same cap ─────────────────────────────────────
const patchnotes = require('../commands/patchnotes');

check('a very long Additional Info is cut at a line break and still renders under 4,000 characters', () => {
    const description = Array.from({ length: 400 }, (_, i) => `# Weapon ${i}\nb: damage up, n: recoil down`).join('\n');
    const doc = { patchNotes: [{ _id: { toString: () => 'p1' }, title: 'Season 10: Test', releaseDate: new Date(NOW), description, images: [] }] };
    const n = textLength(patchnotes.buildContainer(doc, null));
    assert.ok(n <= 4000, `${n} characters`);
    assert.match(patchnotes.clampInfoText('x\n'.repeat(5000)), /too long to show here/);
    assert.strictEqual(patchnotes.clampInfoText('short'), 'short', 'a normal note is left alone');
});

// ── #8 /calendar's Active/Upcoming view survives a page click ──────────────
const calendar = require('../commands/calendar');
const calendarDoc = { currentSeasonTitle: 'Season 10: Test', calendar: [], newDraws: [], returningDraws: [] };
const toggleIds = (filterMode) => JSON.stringify(calendar.buildContainer(calendarDoc, 0, undefined, false, filterMode)).match(/calpage_[0-9a-z_]+/g);

check('the page toggles carry the Active view, and only the Active view', () => {
    assert.ok(toggleIds('active').every(id => id.endsWith('_a')), JSON.stringify(toggleIds('active')));
    assert.ok(toggleIds('all').every(id => !id.endsWith('_a')), JSON.stringify(toggleIds('all')));
});

check('the empty Active view no longer points at the removed /settings control', () => {
    const doc = { ...calendarDoc, calendar: [{ name: 'Old event', category: 'event', date: new Date(NOW - 400 * DAY), endDate: new Date(NOW - 300 * DAY) }] };
    const text = JSON.stringify(calendar.buildContainer(doc, 1, undefined, false, 'active'));
    assert.ok(!/Preferences page/.test(text), 'the stale /settings pointer is back');
});

// ── #3 unnamed draw calculations expire ───────────────────────────────────
const { expiredBasketFilter, BASKET_EXPIRY_MS } = require('../utils/drawBasketStore');

check('the expiry matches only unnamed baskets created more than 30 days ago', () => {
    const f = expiredBasketFilter(NOW);
    assert.deepStrictEqual(f.$or, [{ name: { $exists: false } }, { name: '' }], 'a named basket must never match');
    assert.strictEqual(f.createdAt.$lt.getTime(), NOW - BASKET_EXPIRY_MS);
    assert.strictEqual(BASKET_EXPIRY_MS, 30 * DAY, 'PRIVACY §2.1d promises 30 days');
});

check('models/DrawBasket.js declares no partial TTL index MongoDB would refuse', () => {
    const DrawBasket = require('../models/DrawBasket');
    const refused = DrawBasket.schema.indexes().filter(([, opts]) => JSON.stringify(opts.partialFilterExpression || {}).includes('"$exists":false'));
    assert.deepStrictEqual(refused, []);
});

// ── #5 hotpatch sees core/ ────────────────────────────────────────────────
const { planHotpatch } = require('../utils/hotpatch');

check('core/ is in the graph: its edges count, and a core file resolves', () => {
    const viaUtils = planHotpatch({ files: ['utils/loadoutImageCache.js'] });
    assert.ok(viaUtils.members.includes('core/ops/loadouts.js'), 'core/ops/loadouts.js holds this module\'s functions, so it belongs in the closure');
    const direct = planHotpatch({ files: ['core/ops/loadouts.js'] });
    assert.deepStrictEqual(direct.unresolved, [], 'a core/ file must resolve to a scanned module');
    assert.notStrictEqual(direct.verdict, 'ALLOW', 'core/ops/index.js holds the op registry, so a core op patch must refuse rather than half-apply');
});

// ── #7 a re-paste keeps what its block left out ───────────────────────────
const { parseBulkLoadoutList } = require('../utils/adminParser');
const { bulkEntryWrite } = require('../core/ops/loadouts');

check('a bulk paste over an existing build keeps its image and share code when the block omits them', () => {
    const { parsed } = parseBulkLoadoutList('BAL-27 | AR\nBuild: Stealth\n- Gauge-9 Mono');
    assert.deepStrictEqual(parsed[0].defaulted, ['imageKey', 'shareCode']);
    const update = bulkEntryWrite(parsed[0], 'MP', { imageKey: 'BAL-27-1.png', shareCode: 'ABC123' });
    assert.ok(!('imageKey' in update) && !('shareCode' in update), JSON.stringify(update));
    assert.ok(!('defaulted' in update), 'the marker must never reach Mongo');
    assert.deepStrictEqual(update.attachments, ['Gauge-9 Mono']);
});

check('a new build still gets the defaults, and a block that gives the lines still writes them', () => {
    const { parsed } = parseBulkLoadoutList('BAL-27 | AR\nBuild: Stealth\n- Gauge-9 Mono');
    const create = bulkEntryWrite(parsed[0], 'MP', null);
    assert.strictEqual(create.shareCode, '');
    assert.ok(create.imageKey, 'a new build needs its placeholder image');
    const given = parseBulkLoadoutList('BAL-27 | AR\nBuild: Stealth\nImage: BAL-27-2.png\nCode: XYZ\n- Gauge-9 Mono').parsed[0];
    assert.deepStrictEqual(given.defaulted, []);
    const update = bulkEntryWrite(given, 'MP', { imageKey: 'old.png', shareCode: 'OLD' });
    assert.strictEqual(update.imageKey, 'BAL-27-2.png');
    assert.strictEqual(update.shareCode, 'XYZ');
});

// ── #9 Undo claims the change before applying it ───────────────────────── Stubbed BEFORE core/revert.js is required, because it destructures both modules at require time.
const changeStore = require('../utils/changeStore');
const changeset = require('../core/changeset');
const claimed = new Set();
let applied = 0;
let failNext = false;
changeStore.getChange = async (id) => ({ changeId: id, inverse: { type: 'draw.add' }, undone: claimed.has(id) });
changeStore.claimUndo = async (id) => { if (claimed.has(id)) return null; claimed.add(id); return { changeId: id }; };
changeStore.releaseUndo = async (id) => { claimed.delete(id); };
changeset.commitSet = async () => {
    await new Promise(r => setImmediate(r));
    if (failNext) { failNext = false; return { ok: false, error: 'nope' }; }
    applied++;
    return { ok: true, changeIds: ['new-1'] };
};
const { revertChange } = require('../core/revert');

check('two concurrent Undo clicks apply the inverse once', async () => {
    const [a, b] = await Promise.all([revertChange('Oct20-01', { actorId: 'u' }), revertChange('Oct20-01', { actorId: 'u' })]);
    assert.strictEqual(applied, 1, 'the inverse ran twice');
    assert.deepStrictEqual([a.ok, b.ok].sort(), [false, true]);
});

check('a failed revert hands the claim back, so it can be tried again', async () => {
    failNext = true;
    const first = await revertChange('Oct20-02', { actorId: 'u' });
    assert.strictEqual(first.ok, false);
    assert.ok(!claimed.has('Oct20-02'), 'the change still reads as undone after a failed revert');
    assert.strictEqual((await revertChange('Oct20-02', { actorId: 'u' })).ok, true);
});

(async () => {
    for (const [name, fn] of pending) {
        try { await fn(); console.log(`  ✓ ${name}`); }
        catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
    }
    process.exit(failures ? 1 : 0);
})();
