// portal/ui/access.logic.js — CommonJS + classic script. The pure half of the Access realm.

// What an admin's stored permission list becomes after a set of grid toggles. `pending` is { scopeKey: true | false }.
//
// 🔴 A SET, BECAUSE THE LIST IS A SET AND MONGO DOES NOT KNOW THAT. models/AdminUser.js stores `permissions` as a plain array and parsePermissionsInput accepts "manage, manage.draws" — so a token can already appear twice in a live document, and adding one with `.concat()` would make it appear three times. Every duplicate is invisible in the grid (the cell is on either way) and permanent.
//
// ⚠️ IT DOES NOT EXPAND `manage`. A bare manage token INHERITS every page, and the grid renders that as a distinct cell state precisely so the two are not confused — turning an inherited page off has to mean revoking manage, which is a different act, so the caller refuses that click rather than quietly rewriting the token into eight explicit ones.
function permsAfter(permissions, pending) {
    const next = new Set(permissions || []);
    for (const [scope, on] of Object.entries(pending || {})) {
        if (on) next.add(scope);
        else next.delete(scope);
    }
    return [...next];
}

// What the grid is about to change, in words, so the confirmation names the acts rather than a count.
function describePending(pending, labelOf) {
    const granted = [], revoked = [];
    for (const [scope, on] of Object.entries(pending || {})) {
        (on ? granted : revoked).push(labelOf ? labelOf(scope) : scope);
    }
    return { granted: granted.sort(), revoked: revoked.sort() };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { permsAfter, describePending };
