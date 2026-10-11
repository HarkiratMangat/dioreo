// portal/ui/palette.logic.js — CommonJS + classic script. The pure half of the command bar.
//
// Same contract as review.logic.js: a classic <script> before app.js makes these top-level declarations globals an ESM module reads without an import, and Node's require() reads the same file as CommonJS. buildPortal emits the script tag for every *.logic.js automatically.

// Rank, not just filter. A label that STARTS with what you typed beats one that merely contains it, and a command belonging to the realm you are standing in beats a global navigation entry — typing "add" on Armory should offer "Add a build" before it offers "Access". `keywords` is the third tier: it exists so "logout" finds "Sign out" and "commit" finds "Review", without those words having to appear in the label a person reads.
//
// ⚠️ Array#sort is stable (ES2019+, every engine this runs in), which is load-bearing rather than incidental: within one rank the order is the order the caller declared, and a realm declares its own actions in the order it thinks they belong in. Sorting by rank alone with an unstable sort would shuffle a realm's own menu on every keystroke.
function paletteHits(commands, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return commands.slice();
    const scored = [];
    for (const c of commands) {
        const label = String(c.label || '').toLowerCase();
        const keys = (c.keywords || []).join(' ').toLowerCase();
        let rank;
        if (label.startsWith(q)) rank = 0;
        else if (label.includes(q)) rank = 1;
        else if (keys.includes(q)) rank = 2;
        else continue;
        // Half a rank, so "local and merely contained" still loses to "global and prefixed" — being on this page is a tiebreak, not an override.
        scored.push({ c, rank: rank - (c.local ? 0.5 : 0) });
    }
    return scored.sort((a, b) => a.rank - b.rank).map((s) => s.c);
}

// 🔴 ⌘K MUST NOT REACH THROUGH A MODAL, AND `inert` CANNOT STOP IT. The drawer takes #hdr out of the page with `inert`, which removes it from the pointer and from the tab order — and does nothing whatsoever to a document-level keydown listener. So the shortcut would focus an input behind the scrim: a caret in a field that cannot be typed into, on a page that looks broken. `inert` is a focus and hit-testing primitive, not a shortcut guard; this is the guard.
function paletteBlocked(doc) {
    if (!doc || typeof doc.querySelector !== 'function') return false;
    return Boolean(doc.querySelector('.drawer.open'));
}

// Guarded exactly as the other .logic.js files are: a classic script in a real browser has no `module` global, and an unguarded assignment throws ReferenceError mid-parse.
if (typeof module !== 'undefined' && module.exports) module.exports = { paletteHits, paletteBlocked };
