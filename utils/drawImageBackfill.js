// utils/drawImageBackfill.js -- the plan for moving every draw image into the permanent `draws/` folder (Harkirat, 2026-10-30 16:02 EDT: "backfilling it with the current draws and discontinuing archive/draws since the images will remain forever in a draws/ folder"). PURE: it reads lists and returns what to do, so scripts/drawImageLink.test.js can check it without Cloudinary or Mongo; scripts/backfillDrawImages.js carries the plan out.
//
// Three sources, in this order:
//   1. The draws the database holds now. Each one's image (found by its stored thumbnailUrl) is moved to `draws/<slug>` and tagged with the draw's items, so it can be found by them later. The stored URL is rewritten to the new place in the same run: a Cloudinary rename leaves the old URL dead.
//   2. Anything still in `temp_draws/` that no current draw names: moved to `draws/<slug>`, tagged with its title only.
//   3. `archive/draws/<slug>-<UTC stamp>`: the NEWEST copy of each slug that has no `draws/<slug>` yet is moved to `draws/<slug>`. Older copies of the same slug, and any whose slug a live image already holds, stay where they are and are listed: nothing is deleted without his word.
// A draw's items are attached to a moved image when a current draw's title makes the same slug, which is how an archived image of a draw that is back again picks them up.
const { drawFingerprint, slugify, FOLDER, LEGACY_FOLDER } = require('./cloudinaryCache');

const ARCHIVE_PREFIX = 'archive/draws/';
// archive/draws/molten-fusion-draw-20261021-154012 -> { slug, stamp }
const ARCHIVE_ID = /^archive\/draws\/(.+)-(\d{8}-\d{6})$/;

// The public_id folder and slug a stored Cloudinary delivery URL points at, or null for any other URL (an external host, a loadout key).
function parseStoredUrl(url) {
    try {
        const u = new URL(url);
        if (u.hostname !== 'res.cloudinary.com') return null;
        const m = /\/(temp_draws|draws)\/([^/]+?)(?:\.[a-z0-9]+)?$/i.exec(decodeURIComponent(u.pathname));
        return m ? { folder: m[1].toLowerCase(), slug: m[2] } : null;
    } catch {
        return null;
    }
}
// The same URL pointing at draws/ instead of temp_draws/. The version segment can stay: Cloudinary does not check it.
const toDrawsUrl = url => url.replace('/temp_draws/', `/${FOLDER}/`);

// draws: [{ key, title, items, priceType, thumbnailUrl }] (key says where the draw lives so the script can write the URL back). legacy / live / archived: asset lists from Cloudinary, each { public_id }.
function planDrawBackfill({ draws = [], legacy = [], live = [], archived = [] }) {
    const plan = { renames: [], metadata: [], urlUpdates: [], leftInArchive: [], skipped: [] };
    const taken = new Set(live.map(a => a.public_id)); // draws/<slug> ids that exist or will
    const legacyIds = new Set(legacy.map(a => a.public_id));
    const bySlug = new Map(); // slug -> the current draw that makes it
    for (const d of draws) if (d.title) bySlug.set(slugify(d.title), d);
    const metadata = new Map(); // publicId -> { title, draw }
    const moved = new Set();

    const move = (from, slug, reason) => {
        const to = `${FOLDER}/${slug}`;
        if (taken.has(to)) return false;
        plan.renames.push({ from, to, reason });
        taken.add(to);
        moved.add(from);
        return true;
    };

    // 1. Current draws.
    for (const d of draws) {
        if (!d.thumbnailUrl) continue;
        const parsed = parseStoredUrl(d.thumbnailUrl);
        if (!parsed) { plan.skipped.push({ title: d.title, reason: 'its image is not a Cloudinary draw image' }); continue; }
        const target = `${FOLDER}/${parsed.slug}`;
        if (parsed.folder === LEGACY_FOLDER) {
            const from = `${LEGACY_FOLDER}/${parsed.slug}`;
            if (legacyIds.has(from) && !moved.has(from)) move(from, parsed.slug, 'current draw');
            else if (!taken.has(target)) { plan.skipped.push({ title: d.title, reason: `${from} is gone and nothing is at ${target}` }); continue; }
            plan.urlUpdates.push({ key: d.key, from: d.thumbnailUrl, to: toDrawsUrl(d.thumbnailUrl) });
        }
        if (!metadata.has(target)) metadata.set(target, { title: d.title, draw: { items: d.items, priceType: d.priceType || '' } });
    }

    // 2. What is left in temp_draws/.
    for (const a of legacy) {
        if (moved.has(a.public_id)) continue;
        const slug = a.public_id.slice(LEGACY_FOLDER.length + 1);
        if (move(a.public_id, slug, 'unreferenced legacy image')) {
            const d = bySlug.get(slug);
            metadata.set(`${FOLDER}/${slug}`, { title: d?.title || slug.replace(/-/g, ' '), draw: d ? { items: d.items, priceType: d.priceType || '' } : null });
        } else {
            plan.skipped.push({ title: a.public_id, reason: `${FOLDER}/${slug} already holds an image, this copy is left in ${LEGACY_FOLDER}/` });
        }
    }

    // 3. The archive: newest copy of each slug.
    const groups = new Map();
    for (const a of archived) {
        const m = ARCHIVE_ID.exec(a.public_id);
        if (!m) { plan.leftInArchive.push({ publicId: a.public_id, reason: 'not an archive/draws/<slug>-<stamp> id' }); continue; }
        if (!groups.has(m[1])) groups.set(m[1], []);
        groups.get(m[1]).push({ publicId: a.public_id, stamp: m[2] });
    }
    for (const [slug, copies] of groups) {
        copies.sort((x, y) => y.stamp.localeCompare(x.stamp));
        const [newest, ...older] = copies;
        if (move(newest.publicId, slug, 'archived copy')) {
            const d = bySlug.get(slug);
            metadata.set(`${FOLDER}/${slug}`, { title: d?.title || slug.replace(/-/g, ' '), draw: d ? { items: d.items, priceType: d.priceType || '' } : null });
        } else {
            plan.leftInArchive.push({ publicId: newest.publicId, reason: `${FOLDER}/${slug} already holds an image` });
        }
        for (const o of older) plan.leftInArchive.push({ publicId: o.publicId, reason: 'an older copy of the same draw' });
    }

    for (const [publicId, { title, draw }] of metadata) plan.metadata.push({ publicId, title, draw, fingerprint: draw ? drawFingerprint(draw) : null });
    return plan;
}

// Every place that remembers a draw's old image URL must follow the rename, or it points at nothing: the draws themselves, and the ChangeLog `inverse` that Undo restores from (a draw.edit / draw.delete inverse carries the previous draw, thumbnailUrl included). Returns a copy of `value` with `/temp_draws/<slug>` rewritten to `/draws/<slug>` for the slugs in `renamed` ONLY, so a URL of an image that did not move is left alone; `.changed` says whether anything differed.
function rewriteDeep(value, renamed) {
    let changed = false;
    const fix = str => str.replace(/\/temp_draws\/([^/?#"]+?)(?=\.[a-z0-9]+(?:$|[?#"])|$|[?#"])/gi, (m, slug) => {
        if (!renamed.has(slug)) return m;
        changed = true;
        return `/${FOLDER}/${slug}`;
    });
    const walk = v => {
        if (typeof v === 'string') return v.includes('/temp_draws/') ? fix(v) : v;
        if (Array.isArray(v)) return v.map(walk);
        if (v && typeof v === 'object' && !(v instanceof Date) && typeof v.toHexString !== 'function') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
        return v;
    };
    const out = walk(value);
    return { value: out, changed };
}

module.exports = { planDrawBackfill, parseStoredUrl, toDrawsUrl, rewriteDeep, ARCHIVE_PREFIX, ARCHIVE_ID };
