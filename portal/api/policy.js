// portal/api/policy.js
//
// 🔴 The tier-3 "irreversible" gate lives HERE, not in any one realm's file. Season (purgeall, promote), Armory (bulk replace) and Access (grant/revoke) all import this — a second copy of the one control standing between an admin and irreversible data loss is exactly the failure utils/manageActions.js exists to prevent, reproduced inside this plan otherwise.
function gateCommit({ tier, exportedAt, confirmText, expectText }) {
    if (tier < 3) return { ok: true };
    if (!exportedAt) return { ok: false, reason: 'This change must be exported before it can commit.' };
    if (confirmText !== expectText) {
        return { ok: false, reason: 'Typed confirmation does not match. Type the exact name shown to confirm.' };
    }
    return { ok: true };
}

module.exports = { gateCommit };
