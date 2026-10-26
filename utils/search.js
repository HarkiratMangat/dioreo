// utils/search.js Shared autocomplete matching used everywhere the bot offers a live dropdown (loadout weapon search across /dmz, /gunsmith mp; /manage's draws + loadouts search; /patch notes' version search). Plain substring matching alone missed real queries like "dlq" against a stored name of "DL Q33" -- the space between "DL" and "Q33" breaks the literal character sequence a naive `.includes()` needs. Stripping spaces/hyphens/underscores/periods from both sides before comparing fixes that specific class of miss without going as far as true fuzzy/subsequence matching (skipping letters), which would start returning noisy, hard-to-predict matches for a dataset this size.
function normalizeForSearch(str) {
    return str.toLowerCase().replace(/[\s\-_.]/g, '');
}

function fuzzyMatch(query, target) {
    if (!query) return true;
    return normalizeForSearch(target).includes(normalizeForSearch(query));
}

// Purpose-built for ONE thing: deciding whether a draw in newDraws/returningDraws and an explicit `category: 'draw'` calendar entry refer to the SAME real draw, for calendar.js's Draws-section auto-merge (added 2026-07-31 13:30 EDT). fuzzyMatch() above requires one full name to be a literal substring of the other, which real admin-typed titles for the same draw routinely fail — verified against Harkirat's own live data: "Persona 5 Royal (Operator) Series Armory" vs "Persona 5 Operator Series Armory" (extra word + parens), "Shadow & Shade Mythic Draw" vs "Shadow and Shade Mythic Drop" (different final word entirely), "Crimson Moonlight Howl Double Draw" vs "Crimson Moonlight Howl (It Goes Two Draw)" (differently-worded double-draw suffix) — none of these are a substring of the other, so fuzzyMatch() silently failed to dedupe any of them.
//
// Instead: tokenize both titles into words, strip out CODM's own generic draw/category vocabulary (these appear in nearly every draw title and carry no distinguishing information on their own -- counting them caused a real false positive: "Free Legendary Weapon (Secret Cache)" vs "Persona 5 Weapon Series Armory" only share the word "weapon"), and require at least 2 shared DISTINCTIVE words. Two, not one, because a single shared distinctive word is still too weak a signal at these title lengths -- "The Chariot Draw" vs "Rewired Draw" share zero distinctive words (correct, they are different draws) once "draw" itself is excluded, but a 1-word threshold using a less complete exclusion list would have false-matched them on "draw" alone. Verified against 8 real title pairs from Harkirat's own data (4 genuine matches, 4 genuine non-matches) — see `scripts/calendarDedup.test.js`.
const GENERIC_DRAW_WORDS = new Set([
    'draw', 'draws', 'drop', 'drops', 'series', 'armory', 'armories', 'redux', 'mythic', 'double',
    'the', 'and', 'for', 'with', 'from', 'into'
]);

function distinctiveDrawTokens(title) {
    return new Set(
        (title || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
            .filter(w => w.length >= 3 && !GENERIC_DRAW_WORDS.has(w))
    );
}

// The same words in any order and case are the same draw, before the distinctive-word count below (2026-10-23 13:31 EDT): Season 9's "Halloween Series Armory" has only one distinctive word, so the two-word rule never matched it even against itself, and /calendar listed it twice (its calendar row and its /draws entry). Word order is ignored so "Halloween Armory Series" matches too.
const allDrawWords = title => (title || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

function isSameDrawTitle(a, b) {
    if (allDrawWords(a) && allDrawWords(a) === allDrawWords(b)) return true;
    const tokensA = distinctiveDrawTokens(a);
    const tokensB = distinctiveDrawTokens(b);
    let shared = 0;
    for (const w of tokensA) if (tokensB.has(w)) shared++;
    return shared >= 2;
}

// Category-level search synonyms (2026-07-18, v2 quick-wins follow-up) -- a plain name/category substring match can never surface anything for a query like "pistol", since no stored weapon NAME contains that word for most Secondaries weapons (Combat Knife, J358, Crossbow, ...), and the category itself was never being matched against at all before this -- typing the bot's own category keyword ("smg", "lmg", ...) into /all silently returned nothing unless a weapon's name happened to contain those letters by coincidence. Working assumption behind adding this (Harkirat's own framing): meet the player where they actually are/type, don't require them to already know this bot's exact internal category label. Deliberately limited to REAL, unambiguous weapon-class terminology (the game's own category names + their standard full-word/plural forms, plus the common firearm-class words for Secondaries) -- NOT guessed community slang/nicknames, which risks a confidently wrong mapping worse than no mapping at all. 🔁 WIDENED 2026-10-19 20:30 EDT (Harkirat: "please expand the list for more aliases, such as MR for marksman, etc. or rifle, or pistol"). A value may be a LIST: a word that names several classes ("rifle" covers assault, marksman and sniper rifles) shows every one of them. Two-letter aliases (mr, sr, sg, mg) match only when typed in full; the prefix rule below needs three letters.
const RAW_CATEGORY_SYNONYMS = {
    'ar': 'AR', 'ars': 'AR', 'assault': 'AR', 'assault rifle': 'AR', 'assault rifles': 'AR',
    'smg': 'SMG', 'smgs': 'SMG', 'sub': 'SMG', 'submachine gun': 'SMG', 'submachine guns': 'SMG', 'sub machine gun': 'SMG',
    'lmg': 'LMG', 'lmgs': 'LMG', 'mg': 'LMG', 'light machine gun': 'LMG', 'light machine guns': 'LMG', 'machine gun': 'LMG', 'machine guns': 'LMG',
    'marksman': 'MARKSMAN', 'marksman rifle': 'MARKSMAN', 'marksman rifles': 'MARKSMAN', 'mr': 'MARKSMAN', 'mrs': 'MARKSMAN', 'dmr': 'MARKSMAN', 'dmrs': 'MARKSMAN',
    'sniper': 'SNIPER', 'snipers': 'SNIPER', 'sniper rifle': 'SNIPER', 'sniper rifles': 'SNIPER', 'sr': 'SNIPER', 'srs': 'SNIPER', 'bolt action': 'SNIPER',
    'shotgun': 'SHOTGUN', 'shotguns': 'SHOTGUN', 'sg': 'SHOTGUN', 'sgs': 'SHOTGUN', 'shotty': 'SHOTGUN', 'shottie': 'SHOTGUN',
    'secondary': 'SECONDARIES', 'secondaries': 'SECONDARIES', 'side arm': 'SECONDARIES', 'side arms': 'SECONDARIES',
    'pistol': 'SECONDARIES', 'pistols': 'SECONDARIES', 'handgun': 'SECONDARIES', 'handguns': 'SECONDARIES',
    'launcher': 'SECONDARIES', 'launchers': 'SECONDARIES', 'melee': 'SECONDARIES', 'knife': 'SECONDARIES',
    'rifle': ['AR', 'MARKSMAN', 'SNIPER'], 'rifles': ['AR', 'MARKSMAN', 'SNIPER'],
};
// Pre-normalized once at module load (same normalizeForSearch every match already goes through), so a runtime lookup is a plain object-key check, not a re-normalize-every-key scan per query.
const CATEGORY_SEARCH_SYNONYMS = Object.fromEntries(
    Object.entries(RAW_CATEGORY_SYNONYMS).map(([key, category]) => [normalizeForSearch(key), category])
);

// Returns the `Loadout.category` values a query resolves to via the synonym map above (usually one; "rifle" gives three), or `[]` if it isn't a recognized synonym. Deliberately an exact (normalized) match, not a substring/fuzzy one -- a synonym should only fire on a clear, whole-word query, not an accidental partial hit inside some unrelated longer string.
//
// 🔁 WIDENED 2026-10-19 20:09 EDT (Harkirat, on the dev bot: "i typed assault, which should have showed all AR and the 'all ar builds' option yet nothing. and i typed 'snipe' but that only showed 'all snipers'"). The exact match stays first; after it, a query of 3+ letters that BEGINS one of the synonyms counts too, when every synonym it begins names the same class ("assault" -> AR, "snipe" -> SNIPER, "sub" -> SMG, "light" -> LMG). Typing is incremental, so the class has to appear while the word is still being typed. A prefix shared by two classes resolves to nothing rather than to a guess. 🔁 TYPOS 2026-10-19 20:34 EDT (Harkirat: "also consider typos/nearest relevant", with "shoty" finding nothing and "gun" finding only All SHOTGUN builds). After the exact and prefix rules, a word of 4+ letters one edit away from an alias, or from the start of one, counts too (7+ letters: two edits). An edit is a missing, extra, wrong or swapped letter. The same nearest-match rule applies to weapon names in findWeaponMatches below.
function typoLimit(q) {
    return q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
}

// Optimal-string-alignment distance: insertions, deletions, substitutions and adjacent swaps each cost one.
function editDistance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
    }
    return d[a.length][b.length];
}

// How far a typed word is from a target: from the whole target, or from its start (so a half-typed word with a typo still counts). Infinity when it is past the word's typo limit.
function typoDistance(query, target) {
    const q = normalizeForSearch(query), t = normalizeForSearch(target);
    const limit = typoLimit(q);
    if (!limit) return Infinity;
    const best = Math.min(editDistance(q, t), editDistance(q, t.slice(0, q.length)));
    return best <= limit ? best : Infinity;
}

// Words that name no class but mean "a weapon": they show every class row and every weapon rather than whichever class happens to contain the letters ("gun" used to find only SHOTGUN).
const GENERIC_WEAPON_WORDS = new Set(['gun', 'guns', 'weapon', 'weapons', 'all']);
function isGenericWeaponQuery(query) {
    return Boolean(query) && GENERIC_WEAPON_WORDS.has(normalizeForSearch(query));
}

// The one class an alias names, matched exactly (no prefix, no typo rule), or null; a word naming several classes ("rifle") is null. /autobuild's form presets read two- and three-word class names with it (2026-10-25 12:49 EDT), where the prefix and typo rules would turn a run of unrelated words into a class.
function categoryByExactAlias(text) {
    const v = CATEGORY_SEARCH_SYNONYMS[normalizeForSearch(text || '')];
    return v && !Array.isArray(v) ? v : null;
}

function resolveCategorySynonyms(query) {
    if (!query) return [];
    const q = normalizeForSearch(query);
    const asList = (v) => (Array.isArray(v) ? v : [v]);
    if (CATEGORY_SEARCH_SYNONYMS[q]) return asList(CATEGORY_SEARCH_SYNONYMS[q]);
    if (q.length < 3) return [];
    // Every alias the letters begin must name the same classes; a prefix that would mix different ones resolves to nothing rather than to a guess.
    const sets = new Set(Object.entries(CATEGORY_SEARCH_SYNONYMS).filter(([key]) => key.startsWith(q)).map(([, v]) => asList(v).join('|')));
    if (sets.size) return sets.size === 1 ? [...sets][0].split('|') : [];
    // Nearest alias by typo distance; a tie between different classes resolves to nothing.
    const scored = Object.entries(CATEGORY_SEARCH_SYNONYMS).map(([key, v]) => [typoDistance(q, key), asList(v).join('|')]).filter(([dist]) => dist !== Infinity);
    if (!scored.length) return [];
    const nearest = Math.min(...scored.map(([dist]) => dist));
    const nearSets = new Set(scored.filter(([dist]) => dist === nearest).map(([, set]) => set));
    return nearSets.size === 1 ? [...nearSets][0].split('|') : [];
}

// findWeaponMatches (2026-07-18, v2 quick-wins batch; extended same day with synonym support) -- backs the loadout-lookup fallback in /dmz and /gunsmith mp for a short/partial weapon name (e.g. "loc") that doesn't exact-match any stored weaponKey. The slash command's `weapon` option is autocomplete-backed but NOT `.setRequired` to a strict choice list -- Discord still submits whatever raw text a user typed if they hit enter without picking a suggestion (confirmed a real live complaint on mobile, where the autocomplete dropdown is easy to dismiss by accident), and that raw text almost never equals a normalized weaponKey exactly for a partial query. Returns every candidate (from the caller's mode/category-scoped list, expected to carry `weaponKey`/ `weaponName`/`category`) whose weaponName fuzzy-matches the raw query OR whose category matches a resolved synonym (e.g. "pistol" -> every SECONDARIES weapon, not just the ones whose own name happens to contain the word "pistol"), deduped by weaponKey -- so a caller can auto-resolve an unambiguous single match or ask the user to pick from a short list of real candidates instead of just saying "not found" with no explanation. Look-alike characters folded together for weapon search only (Harkirat, 2026-10-25 21:56 EDT: "hso" for "hs0" found nothing): 0 and o, 1 i and l, 5 and s. Not in fuzzyMatch, which draws, patch notes and bulk delete share.
const LOOKALIKE = { 0: 'o', 1: 'l', i: 'l', 5: 's' };
function foldLookalikes(str) {
    return normalizeForSearch(String(str || '')).replace(/[015i]/g, ch => LOOKALIKE[ch]);
}

function findWeaponMatches(query, candidates) {
    const synonymCategories = resolveCategorySynonyms(query);
    const seen = new Set();
    const results = [];
    for (const c of candidates) {
        const isMatch = isGenericWeaponQuery(query) || fuzzyMatch(query, c.weaponName) || synonymCategories.includes(c.category);
        if (isMatch && !seen.has(c.weaponKey)) {
            seen.add(c.weaponKey);
            results.push(c);
        }
    }
    if (results.length) return results;
    // Then the same letters with look-alikes folded ("hso" -> HS0405), before the typo distance below, which needs four letters.
    const folded = foldLookalikes(query);
    if (folded) for (const c of candidates) {
        if (foldLookalikes(c.weaponName).includes(folded) && !seen.has(c.weaponKey)) { seen.add(c.weaponKey); results.push(c); }
    }
    if (results.length) return results;
    // Nothing matched the letters or a class: fall back to the nearest weapon names by typo distance ("lokus" -> LOCUS). Only as a fallback, so "shot" lists the shotguns and not SHORTY beside them.
    const near = candidates.map(c => [typoDistance(query, c.weaponName), c]).filter(([dist]) => dist !== Infinity);
    const best = Math.min(...near.map(([dist]) => dist));
    for (const [dist, c] of near) {
        if (dist === best && !seen.has(c.weaponKey)) { seen.add(c.weaponKey); results.push(c); }
    }
    return results;
}

// What /gunsmith shows before anything is typed (Harkirat, 2026-10-25 23:26 EDT: "instead of the example list only being AR weapons, can you list a few weapons from each category ... the more popular ones ... if they have the meta badge or the top badge"). A few from every class, each class's best first by its builds' badges (Meta, then Best › Top 3 › Top 5 › Capable, then Toxic), taken round-robin so every class gets one before any gets a second; shown grouped by class. `weapons`: one entry per weapon with `category`, `weaponName` and the badge fields of its best build.
const RANK_ORDER = { best: 1, top3: 3, top5: 5, capable: 6 };
function featuredScore(w) {
    return (w.isMeta ? 0 : 100) + (RANK_ORDER[w.categoryRank] ?? 50) + (w.isToxic ? 0 : 1);
}
const EXTRA_ORDER = ['AR', 'SMG', 'SNIPER', 'SHOTGUN', 'MARKSMAN', 'SECONDARIES', 'LMG'];
function featuredWeapons(weapons, slots) {
    const byClass = new Map();
    for (const w of weapons) (byClass.get(w.category) || byClass.set(w.category, []).get(w.category)).push(w);
    const classes = [...byClass.keys()].sort();
    for (const c of classes) byClass.get(c).sort((a, b) => featuredScore(a) - featuredScore(b) || a.weaponName.localeCompare(b.weaponName));
    const picked = new Set();
    // Two from every class first; any slots left go to the classes in EXTRA_ORDER, in that order (Harkirat, 2026-10-25 23:28 EDT: "reduce LMGs to just 2 and increase SMGs to 3", so with 16 slots AR and SMG get three).
    const order = (round) => round < 2 ? classes : [...EXTRA_ORDER.filter(c => byClass.has(c)), ...classes.filter(c => !EXTRA_ORDER.includes(c))];
    for (let round = 0; picked.size < slots && classes.some(c => byClass.get(c)[round]); round++) {
        for (const c of order(round)) { const w = byClass.get(c)[round]; if (w && picked.size < slots) picked.add(w); }
    }
    return classes.flatMap(c => byClass.get(c).filter(w => picked.has(w)));
}

// CATEGORY_SEARCH_SYNONYMS and GENERIC_WEAPON_WORDS are exported for the site's /commands page (scripts/lib/commandsPage.js), whose weapon search ships this same table so it answers a class word the way the bot does.
module.exports = { featuredWeapons, fuzzyMatch, normalizeForSearch, foldLookalikes, findWeaponMatches, resolveCategorySynonyms, categoryByExactAlias, isGenericWeaponQuery, typoDistance, isSameDrawTitle, CATEGORY_SEARCH_SYNONYMS, GENERIC_WEAPON_WORDS };
