// scripts/migrateLoadoutKeys.js
//
// Moves every MP build's picture to its gunsmith-code key (`WEAPON-CODE`, utils/loadoutImageCache.js codeImageKey) and gives every build a `Build N` name with its label in its own field (Harkirat, 2026-10-25 21:48 EDT; plan: local/project/features/bot-polish/loadout-key-plan.md). Written 2026-10-26 01:23 EDT.
//
// DRY RUN BY DEFAULT: reads the database and one Cloudinary listing, writes nothing, and prints what it would do. `--write` copies the pictures and updates the builds.
//
//   node --env-file=.env.dev scripts/migrateLoadoutKeys.js            # dev database, dry run
//   node --env-file=.env.dev scripts/migrateLoadoutKeys.js --write    # dev: copies to DEV- keys, then updates the dev builds
//
// 🔴 EVERY RUN NEEDS --env-file. dotenv backfills anything an env file leaves out from `.env`, which on the main checkout is PROD (CLAUDE.md, the dev-bot section), so this script refuses to start without an explicit env file and refuses a database whose name is not `diors-builds-dev` unless `--prod` is passed. A prod run, read or write, waits for Harkirat's word, restated at the moment.
//
// What it does, per build:
//   · MP with a code and a real picture: the picture is copied (never moved) to the code key from the asset's own versioned URL, then the build points at it. The old key stays, because Revert restores old keys. A picture whose Cloudinary `Gunsmith_Code` metadata differs from the build's code is LISTED and left alone: that is the BAL-27 kind of mix-up, and copying it would bless it.
//   · MP without a code (other than a "Coming Soon" placeholder): listed, untouched. The code is required now; these need one typed in.
//   · DMZ: no code in the game, so the key stays `DMZ-WEAPON-N`.
//   · Every build: a name that is not `Build N` (a legacy label stored as the name) becomes the label, and the weapon's builds are numbered 1..n in their shown order (utils/loadoutForm.js compareBuilds).
//   · Two builds of one weapon with the same code, or one screenshot hash on two builds: listed.
//
// Cloudinary cost: one Admin API listing per run (the account's 500 an hour is shared with the live bot), plus one upload per copied picture on --write. Copies use overwrite:false, so an existing key is never replaced, and they skip the archive step (a new key has nothing to archive).
//
// A --write run saves every changed build's previous values to local/project/features/loadout-keys/migration-backup-<db>-<time>.json before touching it, so the database half can be put back by hand.
const path = require('path');
const fs = require('fs');

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const PROD = args.has('--prod');

const mongoose = require('mongoose');
const Loadout = require('../models/Loadout');
const cloudinary = require('../utils/cloudinaryClient');
const cache = require('../utils/loadoutImageCache');
const { isCloudinaryWriteBlocked } = require('../utils/cloudinaryDevGuard');
const { isPlaceholderBuild } = require('../utils/loadoutRender');
const form = require('../utils/loadoutForm');

const safe = (err) => err?.message || err?.error?.message || 'Unknown Cloudinary error';

async function listPictures() {
    // Every asset in the folder with its structured metadata, paged. Read-only.
    const out = new Map();
    let next;
    do {
        const page = await cloudinary.api.resources_by_asset_folder(cache.FOLDER, { max_results: 500, metadata: true, ...(next ? { next_cursor: next } : {}) });
        for (const r of page.resources || []) out.set(String(r.public_id).toUpperCase(), r);
        next = page.next_cursor;
    } while (next);
    return out;
}

function planFor(builds, pictures) {
    const rows = [];
    // Weapons whose cards change order. /gunsmith listed a weapon's builds in _id order and now lists them by build number (utils/loadoutForm.js compareBuilds), so a weapon whose numbers disagree with its _id order is REORDERED for players the moment this ships (2026-10-26 12:32 EDT: BAL-27's Build 1 had the newest _id on the dev data, so it showed fifth). Listed so the dry run shows it before the switch.
    rows.orderChanges = [];
    const groups = new Map();
    for (const b of builds) {
        const k = `${b.mode}|${b.weaponKey}`;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(b);
    }
    const hashOwners = new Map();
    for (const b of builds) if (b.sourceHash) hashOwners.set(b.sourceHash, [...(hashOwners.get(b.sourceHash) || []), b]);

    for (const group of groups.values()) {
        // A "Coming Soon" placeholder is no build yet: it keeps its name and takes no number.
        const ordered = [...group].filter(b => !isPlaceholderBuild(b)).sort(form.compareBuilds);
        const byId = [...ordered].sort((a, b) => String(a._id).localeCompare(String(b._id)));
        if (byId.some((b, i) => b !== ordered[i])) {
            const show = (list) => list.map(b => b.shareCode || b.label || b.buildName).join(', ');
            rows.orderChanges.push(`${ordered[0].mode} ${ordered[0].weaponName}: was ${show(byId)} · now ${show(ordered)}`);
        }
        ordered.forEach((b, i) => {
            const row = { id: String(b._id), weapon: b.weaponName, mode: b.mode, from: { buildName: b.buildName, label: b.label || '', imageKey: b.imageKey }, set: {}, notes: [] };
            // Names: `Build N` in shown order, a legacy label kept as the label.
            const legacyLabel = form.buildNumberOf(b.buildName) === null && b.buildName !== 'Standard Build' ? b.buildName : '';
            if (`Build ${i + 1}` !== b.buildName) row.set.buildName = `Build ${i + 1}`;
            if (legacyLabel && !b.label) row.set.label = legacyLabel;

            if (b.mode === 'MP') {
                if (!b.shareCode) row.notes.push('NO CODE: needs a gunsmith code typed in');
                const twin = b.shareCode && group.find(o => o !== b && form.sameCode(o.shareCode, b.shareCode));
                if (twin) row.notes.push(`SAME CODE as ${twin.buildName}: one of them is a duplicate`);
                const target = b.shareCode ? cache.codeImageKey(b.weaponName, b.shareCode) : null;
                if (target && cache.isRealImageKey(b.imageKey) && target !== b.imageKey) {
                    const pic = pictures.get(cache.imageKeyToPublicId(b.imageKey).toUpperCase());
                    const picCode = pic?.metadata?.Gunsmith_Code;
                    if (!pic) row.notes.push(`NO PICTURE at ${b.imageKey}: nothing to copy`);
                    else if (picCode && !form.sameCode(picCode, b.shareCode)) row.notes.push(`MISMATCH: the picture's Gunsmith_Code is ${picCode}, the build's is ${b.shareCode}; left alone`);
                    else if (!twin) { row.copy = { from: pic.secure_url, to: target, exists: pictures.has(target.toUpperCase()) }; row.set.imageKey = target; }
                }
            }
            if (b.sourceHash && (hashOwners.get(b.sourceHash) || []).length > 1) row.notes.push('SAME SCREENSHOT as another build');
            if (Object.keys(row.set).length || row.notes.length) rows.push(row);
        });
    }
    return rows;
}

async function main() {
    if (!process.execArgv.some(a => a.startsWith('--env-file'))) {
        console.error('Refusing to run without --env-file (dotenv would backfill from .env). Use: node --env-file=.env.dev scripts/migrateLoadoutKeys.js');
        process.exit(2);
    }
    const uri = process.env.MONGODB_URI || '';
    const dbName = (/\/([^/?]+)(\?|$)/.exec(uri) || [])[1] || '';
    if (dbName !== 'diors-builds-dev' && !PROD) {
        console.error(`Refusing: database "${dbName || '(unknown)'}" is not diors-builds-dev. A prod run needs --prod and Harkirat's word.`);
        process.exit(2);
    }
    await mongoose.connect(uri);
    const builds = await Loadout.find({}).lean();
    const pictures = await listPictures();
    const rows = planFor(builds, pictures);

    const copies = rows.filter(r => r.copy);
    const flagged = rows.filter(r => r.notes.length);
    console.log(`${dbName}: ${builds.length} builds, ${pictures.size} pictures in ${cache.FOLDER}/. Key prefix: "${cache.devKeyPrefix() || '(none)'}". ${WRITE ? 'WRITING' : 'dry run'}.\n`);
    console.log(`Pictures to copy to a code key: ${copies.length} (${copies.filter(r => r.copy.exists).length} already there)`);
    console.log(`Builds renamed or relabelled:   ${rows.filter(r => r.set.buildName || r.set.label).length}`);
    console.log(`Builds flagged for a person:    ${flagged.length}`);
    console.log(`Weapons whose card order changes: ${rows.orderChanges.length}\n`);
    for (const line of rows.orderChanges) console.log(`  ORDER ${line}`);
    for (const r of rows) {
        const parts = [];
        if (r.set.buildName) parts.push(`${r.from.buildName} -> ${r.set.buildName}`);
        if (r.set.label) parts.push(`label "${r.set.label}"`);
        if (r.set.imageKey) parts.push(`${r.from.imageKey} -> ${r.set.imageKey}`);
        console.log(`  ${r.mode} ${r.weapon}: ${[...parts, ...r.notes].join(' · ')}`);
    }

    if (!WRITE) { await mongoose.disconnect(); return; }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = path.join(__dirname, '..', 'local', 'project', 'features', 'loadout-keys', `migration-backup-${dbName}-${stamp}.json`);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, JSON.stringify(rows.filter(r => Object.keys(r.set).length).map(r => ({ id: r.id, from: r.from, set: r.set })), null, 2));
    console.log(`\nBackup of previous values: ${backup}`);

    let copied = 0, updated = 0;
    for (const r of rows) {
        if (r.copy && !r.copy.exists) {
            if (isCloudinaryWriteBlocked('upload', `${cache.FOLDER}/${r.copy.to}`, { devNamespaceSafe: cache.isDevNamespaceKey(r.copy.to) })) {
                console.log(`  BLOCKED ${r.copy.to}: build left on its old key`); delete r.set.imageKey;
            } else {
                try {
                    await cloudinary.uploader.upload(r.copy.from, { public_id: r.copy.to, asset_folder: cache.FOLDER, overwrite: false, resource_type: 'image' });
                    copied++;
                } catch (err) {
                    console.log(`  COPY FAILED ${r.copy.to} (${safe(err)}): build left on its old key`); delete r.set.imageKey;
                }
            }
        }
        if (Object.keys(r.set).length) {
            await Loadout.updateOne({ _id: r.id }, { $set: r.set });
            updated++;
            const doc = await Loadout.findById(r.id).lean();
            await cache.syncLoadoutMetadata(doc);
        }
    }
    console.log(`\nDone: ${copied} pictures copied, ${updated} builds updated.`);
    await mongoose.disconnect();
}

if (require.main === module) main().catch(err => { console.error('Fatal:', safe(err)); process.exit(1); });

module.exports = { planFor };
