// Scope descriptor: {mode:'MP'|'DMZ', category:string|null, metaOnly:boolean}. Token form `<mode>.<category|*>.<meta|std>` is what travels in a gsb~ custom_id.
const Loadout = require('../models/Loadout');

function formatScopeToken({ mode, category, metaOnly }) {
    return `${mode}.${category || '*'}.${metaOnly ? 'meta' : 'std'}`;
}
function parseScopeToken(token) {
    const [mode, category, kind] = String(token).split('.');
    return { mode, category: category === '*' ? null : category, metaOnly: kind === 'meta' };
}

// Deterministic ordering is REQUIRED: nothing is stored server-side, so every click re-derives this list and must get the same order or the flat index points somewhere else.
async function resolveScopeBuilds({ mode, category, metaOnly }) {
    const filter = { mode };
    if (category) filter.category = category;
    if (metaOnly) filter.isMeta = true;
    // A "Coming Soon" placeholder is never part of a browse (Harkirat, 2026-10-24 09:45 EDT: "in lists, if a weapon is missing, do not show it in the list").
    const { isPlaceholderBuild } = require('./loadoutRender');
    const builds = (await Loadout.find(filter).lean()).filter(b => !isPlaceholderBuild(b));
    return builds.sort((a, b) =>
        a.category.localeCompare(b.category) ||
        a.weaponName.localeCompare(b.weaponName) ||
        // A weapon's builds by build number, then by _id (utils/loadoutForm.js compareBuilds, 2026-10-26 01:19 EDT). Text order put Build 10 before Build 2.
        require('./loadoutForm').compareBuilds(a, b) ||
        // FINAL TIE-BREAK, and it is load-bearing: `buildName` defaults to 'Standard Build' for every row that does not set one, so all three keys can tie. Without this the order falls back to whatever Mongo returned, which is not stable across two queries -- and since every click re-derives this list, an unstable tie silently moves the flat index onto a different build. That is the exact drift this design claims to bound.
        String(a._id).localeCompare(String(b._id)));
}

// Clamped, never throwing: /manage can add or delete a build between two clicks.
function flatIndexToPosition(builds, flatIndex) {
    const i = Math.min(Math.max(Number(flatIndex) || 0, 0), builds.length - 1);
    const weaponKey = builds[i].weaponKey;
    const weaponBuilds = builds.filter(b => b.weaponKey === weaponKey);
    // IDENTITY comparison, not _id: weaponBuilds is filtered FROM this same array, so the object reference is exact. An _id comparison looks more careful and is actually WRONG -- two builds whose _id is undefined (any fixture, any projection that omits it) both stringify to "undefined" and collapse onto index 0. Found while re-reading this plan, 2026-08-15 20:55 EDT.
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

// The browse rows at the top of /gunsmith mp and /gunsmith dmz's weapon suggestions (Harkirat, 2026-10-19 19:43 EDT: "lets just remove gunsmith list, instead put the 'all mp builds, all ar, all lmg, etc' at the top of the /gunsmiths mp command"). Their earlier order and the single META entry came from the same evening (19:38 EDT): META first, then everything in the mode, then each MP class. META opens that mode's meta, and the switch under the panel moves to the other mode's (utils/loadoutRender.js, `gsb~meta~`). A row's value is its scope token; commands/gunsmith.js reads it back as `~scope~<token>`.
function browseRows(mode, categories = []) {
    const { displayCategoryLabel } = require('./loadoutRender');
    if (mode === 'DMZ') {
        return [
            { label: 'All META builds', value: 'DMZ.*.meta' },
            { label: 'All DMZ builds', value: 'DMZ.*.std' },
        ];
    }
    return [
        // "All MP builds" dropped (Harkirat, 2026-10-25 16:10 EDT: "keep all meta builds, drop the 'all mp builds'"); its scope token still opens for a suggestion list a client kept open.
        { label: 'All META builds', value: 'MP.*.meta' },
        ...categories.map(c => ({ label: `All ${displayCategoryLabel(c)} builds`, value: `MP.${c}.std` })),
    ];
}

module.exports = { formatScopeToken, parseScopeToken, resolveScopeBuilds, flatIndexToPosition, FIXED_SCOPES, browseRows };
