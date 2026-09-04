// scripts/lib/handoffPlans.cjs — which plans does SESSION-START name?
//
// 🔴 EXTRACTED 2026-09-04 14:04 EDT SO IT CAN BE FALSIFIED. `handoffCheck.mjs` carried this inline as a `String.match()` returning the FIRST path, directly beneath a comment of its own asserting that there are legitimately SEVERAL live plans at once. A function contradicting the comment above it is the receipt class this repo keeps finding, and this one had a downstream cost: the singular answer was always whichever plan SESSION-START happens to name first, so the `.remember` assertion demanded that a session working portal realms point at a plan about working MECHANISMS. Three sessions then recorded "which plan governs?" as an open question in `.remember` and in `docs/db-deferred-list.md` while three primary sources already answered it — the remediation plan's own "the conformance plan is NOT superseded", SESSION-START's 2026-09-01 amendment, and that very comment.
//
// ⚠️ ORDER IS PRESERVED AND DUPLICATES ARE DROPPED. The order is SESSION-START's own, which is the only ranking any of this has; de-duplicating matters because a plan named in both the FIRST ACTION line and its amendment is one plan, not two.
const RE = /docs\/superpowers\/plans\/[\w.-]+\.md/g;

function plansNamedIn(text) {
    // A fresh regex per call: `RE` carries the `g` flag, and a shared lastIndex across calls is the
    // silent-wrong-answer bug this file exists to stop repeating.
    return [...new Set(String(text || '').match(new RegExp(RE.source, 'g')) || [])];
}

module.exports = { plansNamedIn, RE };
