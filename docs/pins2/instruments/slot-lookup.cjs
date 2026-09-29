// Read-only: can the 34 attachment names the slot backfill cannot place be resolved from OTHER builds?
// Cloudinary's per-image metadata is the only record of which slot an attachment sits in — there is no
// catalogue in the repo. But a name that one image failed to identify may be identified on another, so
// this builds name→slot from EVERY gun-builds image and looks the 34 up in it, using the same three
// passes alignSlots uses (exact-normalised, substring, near-typo) so a hit here means a hit there.
// Dev and prod point at the same Cloudinary cloud (checked 2026-09-16 11:08 EDT), so .env.dev reads
// exactly the metadata the prod backfill would. No write of any kind.
// Usage: node --env-file=.env.dev local/pins2/slot-lookup.cjs
const cloudinary = require('cloudinary').v2;
const SLOT_FIELDS = [['Muzzle', 'Muzzle'], ['Barrel', 'Barrel'], ['Optic', 'Optic'], ['Stock', 'Stock'], ['Perk', 'Perk'],
    ['Laser', 'Laser'], ['Underbarrel', 'Underbarrel'], ['Ammunition', 'Ammunition'], ['Rear_Grip', 'Rear Grip']];
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = cur;
    }
    return prev[n];
}
const WANTED = ['Bandit Steady Stock', 'Tactical Suppressor', 'Fast Reload Reload Case', '270mm VOZ Carbine',
    'Empress 514mm F01', 'Light Bolt', 'Classical Lever', 'Agile Stock', 'FMJ', 'Hi-Accuracy Sniper Ammo',
    'Steady Stock', 'Long Shot', 'Fast Reload Mag', 'Rapid Action', 'BO Foregrip', '2B Bowstring',
    'Heavy Limb', 'Lightweight Single-Action', 'OWC Stable', 'MFT Heavy Smoothbore'];
(async () => {
    const corpus = new Map();   // normalised name -> Map(slot -> count)
    let images = 0, cursor;
    do {
        let q = cloudinary.search.expression('asset_folder="gun-builds"').with_field('metadata').max_results(500);
        if (cursor) q = q.next_cursor(cursor);
        const res = await q.execute();
        for (const r of res.resources) {
            images += 1;
            const md = r.metadata || {};
            for (const [field, slot] of SLOT_FIELDS) {
                const name = norm(md[field]);
                if (!name) continue;
                if (!corpus.has(name)) corpus.set(name, new Map());
                const m = corpus.get(name);
                m.set(slot, (m.get(slot) || 0) + 1);
            }
        }
        cursor = res.next_cursor;
    } while (cursor);
    const best = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]);
    const rows = WANTED.map((w) => {
        const sn = norm(w);
        let hit = corpus.get(sn) ? ['exact', corpus.get(sn)] : null;
        if (!hit) for (const [k, v] of corpus) if (k.includes(sn) || sn.includes(k)) { hit = ['substring → ' + k, v]; break; }
        if (!hit) for (const [k, v] of corpus) { const d = lev(sn, k); if (d <= 2 && d / Math.max(sn.length, k.length) <= 0.2) { hit = ['near → ' + k, v]; break; } }
        if (!hit) return { name: w, slot: null, how: null, counts: null };
        const b = best(hit[1]);
        return { name: w, slot: b[0][0], how: hit[0], counts: b.map(([s, c]) => `${s}×${c}`).join(' ') };
    });
    console.log(`images read: ${images} · distinct attachment names with a slot: ${corpus.size}\n`);
    for (const r of rows) console.log(`${r.slot ? '✓' : '✗'} ${r.name.padEnd(26)} ${String(r.slot || '—').padEnd(12)} ${r.how || 'no match anywhere'}${r.counts && r.counts.includes(' ') ? '   [' + r.counts + ']' : ''}`);
    const un = rows.filter((r) => !r.slot);
    console.log(`\nresolved ${rows.length - un.length}/${rows.length}; still unknown: ${un.map((r) => r.name).join(', ') || 'none'}`);
})().catch((e) => { console.error('failed:', (e && e.error && e.error.message) || (e && e.message) || 'unknown'); process.exit(1); });
