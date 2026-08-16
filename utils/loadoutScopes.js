// Scope descriptor: {mode:'MP'|'DMZ', category:string|null, metaOnly:boolean}.
// Token form `<mode>.<category|*>.<meta|std>` is what travels in a gsb~ custom_id.
const Loadout = require('../models/Loadout');

function formatScopeToken({ mode, category, metaOnly }) {
    return `${mode}.${category || '*'}.${metaOnly ? 'meta' : 'std'}`;
}
function parseScopeToken(token) {
    const [mode, category, kind] = String(token).split('.');
    return { mode, category: category === '*' ? null : category, metaOnly: kind === 'meta' };
}

// Deterministic ordering is REQUIRED: nothing is stored server-side, so every click re-derives
// this list and must get the same order or the flat index points somewhere else.
async function resolveScopeBuilds({ mode, category, metaOnly }) {
    const filter = { mode };
    if (category) filter.category = category;
    if (metaOnly) filter.isMeta = true;
    const builds = await Loadout.find(filter).lean();
    return builds.sort((a, b) =>
        a.category.localeCompare(b.category) ||
        a.weaponName.localeCompare(b.weaponName) ||
        String(a.buildName).localeCompare(String(b.buildName)) ||
        // FINAL TIE-BREAK, and it is load-bearing: `buildName` defaults to 'Standard Build' for
        // every row that does not set one, so all three keys can tie. Without this the order falls
        // back to whatever Mongo returned, which is not stable across two queries -- and since every
        // click re-derives this list, an unstable tie silently moves the flat index onto a different
        // build. That is the exact drift this design claims to bound.
        String(a._id).localeCompare(String(b._id)));
}

// Clamped, never throwing: /manage can add or delete a build between two clicks.
function flatIndexToPosition(builds, flatIndex) {
    const i = Math.min(Math.max(Number(flatIndex) || 0, 0), builds.length - 1);
    const weaponKey = builds[i].weaponKey;
    const weaponBuilds = builds.filter(b => b.weaponKey === weaponKey);
    // IDENTITY comparison, not _id: weaponBuilds is filtered FROM this same array, so the object
    // reference is exact. An _id comparison looks more careful and is actually WRONG -- two builds
    // whose _id is undefined (any fixture, any projection that omits it) both stringify to
    // "undefined" and collapse onto index 0. Found while re-reading this plan, 2026-08-15 20:55 EDT.
    const indexWithinWeapon = Math.max(0, weaponBuilds.indexOf(builds[i]));
    return { weaponKey, weaponBuilds, indexWithinWeapon };
}

// The 4 fixed scopes; the 7 category scopes are appended at registration from the live DB.
const FIXED_SCOPES = [
    { value: 'MP.*.std',   label: 'All MP builds', mode: 'MP',  category: null, metaOnly: false },
    { value: 'MP.*.meta',  label: 'Meta — MP',     mode: 'MP',  category: null, metaOnly: true  },
    { value: 'DMZ.*.meta', label: 'Meta — DMZ',    mode: 'DMZ', category: null, metaOnly: true  },
    { value: 'DMZ.*.std',  label: 'DMZ',           mode: 'DMZ', category: null, metaOnly: false },
];

module.exports = { formatScopeToken, parseScopeToken, resolveScopeBuilds, flatIndexToPosition, FIXED_SCOPES };
