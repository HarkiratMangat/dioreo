// utils/ephemeral.js
// Shared "explicit option > saved preference > default (public)" priority resolution, hand-rolled
// identically 7 times across calendar/draws/patchnotes/drawprices/seasonend/dmz/index.js's MP
// loadout fallback, differing only in which UserPreference field to check. One place to change if
// the priority rule itself ever needs to change, instead of 7.
function resolveEphemeral({ argPrivate, prefs, prefsField }) {
    if (argPrivate !== null) return argPrivate;
    return prefs ? prefs[prefsField] === 'ephemeral' : false;
}

module.exports = { resolveEphemeral };
