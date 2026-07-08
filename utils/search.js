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

module.exports = { fuzzyMatch, normalizeForSearch };
