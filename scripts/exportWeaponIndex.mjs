#!/usr/bin/env node
/**
 * Dumps the weapon names the bot answers to into a committed JSON the website can read at build time.
 *
 * ⚠️ THIS EXISTS BECAUSE THE SITE BUILDS WITH NO DATABASE. `/gunsmiths search` and `/dmz` autocomplete against the live `loadouts` collection inside Discord; the website's build has no connection, so without an artifact the page can only offer a bare text box while the bot offers real search. Harkirat's call, 2026-08-19 17:03 EDT, after being shown the trade-off: commit a generated list rather than hand-write a partial one, because a hand-written list disagrees with the bot silently and that drift is the exact thing this page was built to prevent.
 *
 * ⚠️ THE ARTIFACT CAN GO STALE, AND THAT IS THE COST OF THIS CHOICE. `scripts/weaponIndex.test.js` fails when the file is missing or malformed, and the file records the date and document count it was generated from so a reader can see how old it is. Re-run after any bulk loadout import.
 *
 *   node --env-file=<path-to-.env> scripts/exportWeaponIndex.mjs
 *
 * Reads only. It never writes to the database.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'data', 'weapon-index.json');

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error('exportWeaponIndex: MONGODB_URI is not set. Run with --env-file pointing at the repo .env.');
    process.exit(1);
}

await mongoose.connect(uri);
const Loadout = mongoose.connection.collection('loadouts');

// One row per distinct weapon, carrying the fields the page needs: the display name the reader types, the key the bot matches on, its category (which decides the answer's colour) and how many builds exist (which is what the `build` option is for).
const rows = await Loadout.aggregate([
    /* ⚠️ The display field is `weaponName`, NOT `weapon`. Grouping on `$weapon` returns ONE
       group per mode with a null key and silently reports "1 MP + 1 DMZ weapons" — a
       well-formed file that is completely wrong. Caught only because the printed sample read
       "undefined(SNIPER,125)"; a script that merely reported "file written" would have shipped it. */
    { $group: {
        _id: { weapon: '$weaponName', mode: '$mode' },
        weaponKey: { $first: '$weaponKey' },
        category: { $first: '$category' },
        builds: { $sum: 1 },
    } },
    { $match: { '_id.weapon': { $type: 'string', $ne: '' } } },
    { $sort: { '_id.weapon': 1 } },
]).toArray();

const byMode = { MP: [], DMZ: [] };
for (const r of rows) {
    const mode = r._id.mode === 'DMZ' ? 'DMZ' : 'MP';
    byMode[mode].push({ name: r._id.weapon, key: r.weaponKey, category: r.category, builds: r.builds });
}

const payload = {
    generated: new Date().toISOString().slice(0, 10),
    source: 'loadouts collection',
    counts: { MP: byMode.MP.length, DMZ: byMode.DMZ.length },
    MP: byMode.MP,
    DMZ: byMode.DMZ,
};

/* Refuse to overwrite a good artifact with a broken one. The first run of this script wrote
   "1 MP + 1 DMZ" from a wrong field name and exited 0; a floor makes that failure loud. */
if (payload.counts.MP < 20 || payload.counts.DMZ < 3) {
    console.error(`exportWeaponIndex: only ${payload.counts.MP} MP + ${payload.counts.DMZ} DMZ weapons came back. ` +
        'That is far below what the collection holds, so the query is wrong rather than the data being small. ' +
        'Nothing written.');
    await mongoose.disconnect();
    process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 1) + '\n');
console.log(`exportWeaponIndex: wrote ${payload.counts.MP} MP + ${payload.counts.DMZ} DMZ weapons to ${path.relative(process.cwd(), OUT)}`);
await mongoose.disconnect();
