// Read-only: what does Cloudinary's metadata actually hold for the builds whose slots came back blank?
const cloudinary = require('cloudinary').v2;
const FIELDS = ['Muzzle','Barrel','Optic','Stock','Perk','Laser','Underbarrel','Ammunition','Rear_Grip'];
const WANT = ['striker-1','dmz-type-19-1','crossbow-2','dobvra-1','shorty-1','machine-pistol-1','l-car-9-1','lw3-tundra-1'];
(async () => {
  const seen = new Map(); let cursor;
  do {
    let q = cloudinary.search.expression('asset_folder="gun-builds"').with_field('metadata').max_results(500);
    if (cursor) q = q.next_cursor(cursor);
    const res = await q.execute();
    for (const r of res.resources) seen.set(String(r.public_id).toLowerCase().replace(/^gun-builds\//,''), r.metadata || {});
    cursor = res.next_cursor;
  } while (cursor);
  console.log(`images: ${seen.size}\n`);
  for (const k of WANT) {
    const md = seen.get(k);
    if (!md) { console.log(`${k.padEnd(16)} NO IMAGE with that public id`); continue; }
    const filled = FIELDS.filter((f) => md[f]);
    console.log(`${k.padEnd(16)} ${filled.length}/9 filled`);
    for (const f of FIELDS) console.log(`    ${f.padEnd(12)} ${md[f] ? JSON.stringify(md[f]) : '—'}`);
  }
})().catch((e) => { console.error('failed:', (e && e.error && e.error.message) || e.message); process.exit(1); });
