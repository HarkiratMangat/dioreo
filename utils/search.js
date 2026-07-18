// utils/search.js
// Shared autocomplete matching used everywhere the bot offers a live dropdown (loadout weapon
// search across /dmz, /all, /<category>; /manage's draws + loadouts search; /patch notes' version
// search). Plain substring matching alone missed real queries like "dlq" against a stored name of
// "DL Q33" -- the space between "DL" and "Q33" breaks the literal character sequence a naive
// `.includes()` needs. Stripping spaces/hyphens/underscores/periods from both sides before
// comparing fixes that specific class of miss without going as far as true fuzzy/subsequence
// matching (skipping letters), which would start returning noisy, hard-to-predict matches for a
// dataset this size.
function normalizeForSearch(str) {
    return str.toLowerCase().replace(/[\s\-_.]/g, '');
}

function fuzzyMatch(query, target) {
    if (!query) return true;
    return normalizeForSearch(target).includes(normalizeForSearch(query));
}

// Category-level search synonyms (2026-07-18, v2 quick-wins follow-up) -- a plain name/category
// substring match can never surface anything for a query like "pistol", since no stored weapon
// NAME contains that word for most Secondaries weapons (Combat Knife, J358, Crossbow, ...), and the
// category itself was never being matched against at all before this -- typing the bot's own
// category keyword ("smg", "lmg", ...) into /all silently returned nothing unless a weapon's name
// happened to contain those letters by coincidence. Working assumption behind adding this
// (Harkirat's own framing): meet the player where they actually are/type, don't require them to
// already know this bot's exact internal category label. Deliberately limited to REAL, unambiguous
// weapon-class terminology (the game's own category names + their standard full-word/plural forms,
// plus the common firearm-class words for Secondaries) -- NOT guessed community slang/nicknames,
// which risks a confidently wrong mapping worse than no mapping at all.
const RAW_CATEGORY_SYNONYMS = {
    'ar': 'AR', 'assault rifle': 'AR', 'assault rifles': 'AR',
    'smg': 'SMG', 'submachine gun': 'SMG', 'submachine guns': 'SMG',
    'lmg': 'LMG', 'light machine gun': 'LMG', 'light machine guns': 'LMG',
    'marksman': 'MARKSMAN', 'marksman rifle': 'MARKSMAN', 'marksman rifles': 'MARKSMAN', 'dmr': 'MARKSMAN',
    'sniper': 'SNIPER', 'sniper rifle': 'SNIPER', 'sniper rifles': 'SNIPER',
    'shotgun': 'SHOTGUN', 'shotguns': 'SHOTGUN',
    'secondary': 'SECONDARIES', 'secondaries': 'SECONDARIES',
    'pistol': 'SECONDARIES', 'pistols': 'SECONDARIES', 'handgun': 'SECONDARIES', 'handguns': 'SECONDARIES'
};
// Pre-normalized once at module load (same normalizeForSearch every match already goes through),
// so a runtime lookup is a plain object-key check, not a re-normalize-every-key scan per query.
const CATEGORY_SEARCH_SYNONYMS = Object.fromEntries(
    Object.entries(RAW_CATEGORY_SYNONYMS).map(([key, category]) => [normalizeForSearch(key), category])
);

// Returns the `Loadout.category` a query resolves to via the synonym map above, or `null` if it
// isn't a recognized synonym. Deliberately an exact (normalized) match, not a substring/fuzzy one --
// a synonym should only fire on a clear, whole-word query, not an accidental partial hit inside some
// unrelated longer string.
function resolveCategorySynonym(query) {
    if (!query) return null;
    return CATEGORY_SEARCH_SYNONYMS[normalizeForSearch(query)] || null;
}

// findWeaponMatches (2026-07-18, v2 quick-wins batch; extended same day with synonym support) --
// backs the loadout-lookup fallback in /dmz, /all, and /<category> for a short/partial weapon name
// (e.g. "loc") that doesn't exact-match any stored weaponKey. The slash command's `weapon` option is
// autocomplete-backed but NOT `.setRequired` to a strict choice list -- Discord still submits
// whatever raw text a user typed if they hit enter without picking a suggestion (confirmed a real
// live complaint on mobile, where the autocomplete dropdown is easy to dismiss by accident), and
// that raw text almost never equals a normalized weaponKey exactly for a partial query. Returns
// every candidate (from the caller's mode/category-scoped list, expected to carry `weaponKey`/
// `weaponName`/`category`) whose weaponName fuzzy-matches the raw query OR whose category matches a
// resolved synonym (e.g. "pistol" -> every SECONDARIES weapon, not just the ones whose own name
// happens to contain the word "pistol"), deduped by weaponKey -- so a caller can auto-resolve an
// unambiguous single match or ask the user to pick from a short list of real candidates instead of
// just saying "not found" with no explanation.
function findWeaponMatches(query, candidates) {
    const synonymCategory = resolveCategorySynonym(query);
    const seen = new Set();
    const results = [];
    for (const c of candidates) {
        const isMatch = fuzzyMatch(query, c.weaponName) || (synonymCategory && c.category === synonymCategory);
        if (isMatch && !seen.has(c.weaponKey)) {
            seen.add(c.weaponKey);
            results.push(c);
        }
    }
    return results;
}

module.exports = { fuzzyMatch, normalizeForSearch, findWeaponMatches, resolveCategorySynonym };
