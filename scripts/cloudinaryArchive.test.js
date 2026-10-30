// scripts/cloudinaryArchive.test.js
//
// Cloudinary images are moved to archive/{kind}/, never deleted (Harkirat, 2026-10-21 11:25 EDT), and an image about to be overwritten is copied there first (11:39 EDT). Runs against a recording stand-in for utils/cloudinaryClient.js, so nothing reaches the live account; the dev guard is off because NODE_ENV is not "development" here.
const assert = require('assert');
const path = require('path');
const Module = require('module');

process.env.NODE_ENV = 'test';
const ROOT = path.join(__dirname, '..');

const calls = [];
let resources = [];          // what api.resources() lists
let existing = new Set();    // public_ids api.resource() / rename() can find
let failCopy = false;
const notFound = () => Object.assign(new Error('Resource not found'), { http_code: 404 });
const fake = {
    api: {
        resources: async () => ({ resources }),
        resource: async (id) => {
            calls.push(['resource', id]);
            if (!existing.has(id)) throw notFound();
            return { public_id: id, secure_url: `https://res.cloudinary.com/acct/image/upload/v1/${id}.jpg` };
        },
        update: async (id, opts) => { calls.push(['update', id, opts]); return {}; },
        update_metadata: async () => ({ public_ids: ['x'] }),
        delete_resources: async (ids) => { calls.push(['delete_resources', ids]); return {}; }
    },
    uploader: {
        upload: async (src, opts) => {
            calls.push(['upload', src, opts.public_id]);
            if (failCopy && opts.public_id.startsWith('archive/')) throw Object.assign(new Error('copy failed'), { http_code: 500 });
            return { secure_url: `https://res.cloudinary.com/acct/image/upload/v2/${opts.public_id}.jpg` };
        },
        rename: async (from, to) => {
            calls.push(['rename', from, to]);
            if (!existing.has(from)) throw notFound();
            existing.delete(from); existing.add(to);
            return {};
        },
        destroy: async (id) => { calls.push(['destroy', id]); return {}; }
    }
};
const clientPath = path.join(ROOT, 'utils/cloudinaryClient.js');
const stub = new Module(clientPath, null);
stub.filename = clientPath; stub.loaded = true; stub.exports = fake;
require.cache[clientPath] = stub;

const silence = console.error;
console.error = () => {};
const archive = require('../utils/cloudinaryArchive');
const draws = require('../utils/cloudinaryCache');
const patches = require('../utils/patchNotesCache');
const banners = require('../utils/calendarBannerCache');
const loadouts = require('../utils/loadoutImageCache');

const NOW = new Date('2026-10-21T15:40:12Z');
const reset = () => { calls.length = 0; resources = []; existing = new Set(); failCopy = false; };
const kinds = (c) => calls.map(x => x[0]);

let failed = 0;
async function t(name, fn) {
    reset();
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${String(err.message).split('\n').join('\n      ')}`); }
}

(async () => {
    await t('archived ids land in archive/{kind}/ with a UTC stamp, the source folder dropped', () => {
        assert.strictEqual(archive.archivePublicIdFor('temp_draws/molten-fusion-draw', 'draws', NOW), 'archive/draws/molten-fusion-draw-20261021-154012');
        assert.strictEqual(archive.archivePublicIdFor('patch_notes/abc123/4', 'patch_notes', NOW), 'archive/patch_notes/abc123/4-20261021-154012');
        assert.strictEqual(archive.archivePublicIdFor('calendar_banners/events', 'calendar_banners', NOW), 'archive/calendar_banners/events-20261021-154012');
        assert.strictEqual(archive.archivePublicIdFor('AK117-1', 'loadouts', NOW), 'archive/loadouts/AK117-1-20261021-154012');
        assert.throws(() => archive.archivePublicIdFor('x', 'nope', NOW), /Unknown Cloudinary archive kind/);
    });

    await t('the stored URL of the same image is recognised, so re-saving it archives nothing', () => {
        assert.ok(archive.isSameAsset('https://res.cloudinary.com/acct/image/upload/f_auto,q_auto/v17/temp_draws/molten-fusion-draw.jpg', 'temp_draws/molten-fusion-draw'));
        assert.ok(!archive.isSameAsset('https://res.cloudinary.com/acct/image/upload/v17/temp_draws/molten-fusion-draw-2.jpg', 'temp_draws/molten-fusion-draw'));
        assert.ok(!archive.isSameAsset('https://example.com/temp_draws/molten-fusion-draw.jpg', 'temp_draws/molten-fusion-draw'));
        assert.ok(!archive.isSameAsset('not a url', 'temp_draws/molten-fusion-draw'));
    });

    await t('draw images are permanent: nothing prunes them and nothing archives them (his rule, 2026-10-30 16:02 EDT)', () => {
        assert.strictEqual(draws.pruneExpiredThumbnails, undefined);
        assert.strictEqual(draws.selectExpiredThumbnails, undefined);
        assert.strictEqual(draws.FOLDER, 'draws');
    });

    await t('the patch-notes prune moves a deleted season\'s images to archive/patch_notes/', async () => {
        resources = [{ public_id: 'patch_notes/keep/0' }, { public_id: 'patch_notes/gone/0' }, { public_id: 'patch_notes/gone/1' }];
        existing = new Set(resources.map(r => r.public_id));
        const result = await patches.pruneOrphanedPatchFolders(new Set(['keep']));
        assert.strictEqual(result.archivedCount, 2);
        assert.deepStrictEqual(calls.filter(c => c[0] === 'rename').map(c => c[1]), ['patch_notes/gone/0', 'patch_notes/gone/1']);
        assert.ok(calls.filter(c => c[0] === 'rename').every(c => c[2].startsWith('archive/patch_notes/gone/')));
        assert.ok(!kinds(calls).includes('delete_resources'));
    });

    await t('clearing a calendar banner moves it, and a banner that was never cached is not an error', async () => {
        existing = new Set(['calendar_banners/events']);
        await banners.clearBannerImage('events');
        assert.ok(calls.some(c => c[0] === 'rename' && c[1] === 'calendar_banners/events' && c[2].startsWith('archive/calendar_banners/events-')));
        assert.ok(!kinds(calls).includes('destroy'));
        const moved = await archive.archiveByMove(['calendar_banners/draws'], 'calendar_banners', NOW);
        assert.deepStrictEqual(moved, { archived: [], missing: ['calendar_banners/draws'], failed: [] });
    });

    await t('replacing a draw image overwrites it in place and keeps no copy', async () => {
        existing = new Set(['draws/molten-fusion-draw']);
        const out = await draws.cacheThumbnail('Molten Fusion Draw', 'https://example.com/new.jpg');
        assert.ok(out.cached);
        const uploads = calls.filter(c => c[0] === 'upload');
        assert.deepStrictEqual(uploads.map(c => c[2]), ['draws/molten-fusion-draw'], 'one upload, same public_id, nothing under archive/');
    });

    await t('a first upload, or re-saving the same stored image, archives nothing', async () => {
        await draws.cacheThumbnail('Brand New Draw', 'https://example.com/a.jpg');
        assert.deepStrictEqual(calls.filter(c => c[0] === 'upload').map(c => c[2]), ['draws/brand-new-draw']);
        reset();
        existing = new Set(['patch_notes/p1/0']);
        await patches.cachePatchImage('p1', 0, 'https://res.cloudinary.com/acct/image/upload/f_auto,q_auto/v3/patch_notes/p1/0.webp');
        assert.ok(!calls.some(c => c[0] === 'resource'), 'no lookup for its own image');
        assert.deepStrictEqual(calls.filter(c => c[0] === 'upload').map(c => c[2]), ['patch_notes/p1/0']);
    });

    await t('banners and loadout images are archived before they are replaced', async () => {
        existing = new Set(['calendar_banners/draws', 'AK117-1']);
        await banners.cacheBannerImage('draws', 'https://example.com/banner.png');
        await loadouts.uploadLoadoutImage('https://example.com/build.png', 'AK117-1');
        const archivedTo = calls.filter(c => c[0] === 'upload' && c[2].startsWith('archive/')).map(c => c[2].replace(/-\d{8}-\d{6}$/, ''));
        assert.deepStrictEqual(archivedTo, ['archive/calendar_banners/draws', 'archive/loadouts/AK117-1']);
    });

    await t('a failed archive copy does not stop the replacement', async () => {
        existing = new Set(['calendar_banners/draws']);
        failCopy = true;
        const out = await banners.cacheBannerImage('draws', 'https://example.com/banner.png');
        assert.ok(out.cached, 'the admin\'s new image still saves');
        assert.ok(calls.some(c => c[0] === 'upload' && c[2] === 'calendar_banners/draws'));
    });

    console.error = silence;
    if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
    console.log('\ncloudinaryArchive: all passed');
})();
