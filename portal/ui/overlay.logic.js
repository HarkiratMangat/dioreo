// portal/ui/overlay.logic.js — CommonJS + classic script. The pure half of the shared overlay.

// 🔴 EXACT MATCH, AND THE TRIM IS THE ONLY MERCY. A typed confirmation exists so that the person has to READ the thing they are about to do and reproduce it — case-folding or fuzzy matching hands that back. Leading and trailing whitespace is stripped because a trailing space from a paste or an autocorrect is not a failure to read, and refusing it teaches nothing except that the box is broken.
//
// ⚠️ An EMPTY expectation must never read as satisfied. `typedConfirmReady('', '')` returning true would silently turn a mis-wired tier-3 drawer into a one-click destructive button, which is exactly the failure this function exists to prevent — so an absent word is a hard false, and the caller decides whether to require typing at all.
function typedConfirmReady(typed, expected) {
    const want = String(expected == null ? '' : expected).trim();
    if (!want) return false;
    return String(typed == null ? '' : typed).trim() === want;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { typedConfirmReady };
