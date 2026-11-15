// Checks the weapon shorthands (utils/search.js WEAPON_ALIASES) against a LIVE database: every weapon in its catalogue and on its builds, MP and DMZ. Read-only.
// npm test checks them against the tracked catalogue seed (scripts/weaponAliases.test.js); this catches what the seed cannot: a weapon added or renamed since.
// Usage: node --env-file=.env.dev scripts/checkWeaponAliases.js      (exits 1 and lists each problem when any shorthand is unsafe)
const mongoose = require('mongoose');
const { weaponAliasProblems } = require('../utils/search');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const Loadout = require('../models/Loadout');
    const CatalogueItem = require('../models/CatalogueItem');
    const { normKey } = require('../utils/catalogue');
    let failed = false;
    for (const mode of ['MP', 'DMZ']) {
        const byKey = new Map();
        // A build's own name wins over the catalogue's, as the lookups see builds; the catalogue adds any weapon with no build yet.
        for (const b of await Loadout.find({ mode }).select('weaponName weaponKey category').lean()) if (!byKey.has(normKey(b.weaponName))) byKey.set(normKey(b.weaponName), b);
        if (mode === 'MP') for (const w of await CatalogueItem.find({ kind: 'weapon', dmzOnly: { $ne: true } }).lean()) if (!byKey.has(normKey(w.name))) byKey.set(normKey(w.name), { weaponName: w.name, weaponKey: w.key, category: w.category });
        const weapons = [...byKey.values()];
        // DMZ has its own short weapon list, so a shorthand whose weapon has no DMZ build is not a DMZ problem.
        const problems = weaponAliasProblems(weapons).filter(p => mode === 'MP' || !/matches 0 weapons/.test(p));
        console.log(`${mongoose.connection.name} ${mode}: ${weapons.length} weapons, ${problems.length ? problems.length + ' problem(s)' : 'no problems'}`);
        for (const p of problems) console.log(`  - ${p}`);
        if (problems.length) failed = true;
    }
    await mongoose.disconnect();
    process.exit(failed ? 1 : 0);
})().catch(e => { console.error('ERR', e.message); process.exit(2); });
