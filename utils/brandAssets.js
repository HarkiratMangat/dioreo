// utils/brandAssets.js The bot's own branding images — one definition each, shared by every command that renders them.
//
// WHY THIS EXISTS: `MASCOT_URL` was declared verbatim in BOTH commands/help.js and commands/invite.js. Two copies of one asset URL is the drift shape this repo keeps paying for, and it bit immediately: the width transform added below is a 95% byte reduction, and applying it to one copy and not the other would have left `/help` slow while `/invite` was fast, with nothing to reveal the difference.
//
// ⚠️ THE MASCOT IS A 2048×2048 SOURCE ASSET rendered as a small type-11 thumbnail accessory. Before 2026-08-17 09:42 EDT it was delivered at full size with only `f_auto,q_auto`, so every render shipped a 2048px image to paint roughly 80 points of screen. MEASURED against the live CDN that day, same asset, same account:
//     f_auto,q_auto            266,911 bytes   ← what shipped
//     f_auto,q_auto,w_256       13,601 bytes   ← 94.9% smaller, this file's choice
//     f_auto,q_auto,w_160        7,143 bytes
//     f_auto,q_auto,w_128        5,450 bytes
// `w_256` rather than something smaller on purpose: Discord renders that accessory at ~80 points, and a 3× device pixel ratio wants ~240px of real image, so 256 is the first width that cannot soften on the densest common display. The remaining widths are recorded because they are the levers if this ever needs to shrink further — the numbers, not a guess, are what make that a decision.
//
// ⚠️ NOT the same problem the #146 Cloudinary memoization solved, and worth stating so nobody "extends" that fix here. PR #146 memoizes `cloudinary.api.resource()` ADMIN API lookups (measured 138–470ms each) for assets whose public_id has to be resolved at runtime. This URL is a constant: there is no lookup, so that cost is already zero and there is nothing to memoize. The cost here was always BYTES ON THE WIRE, which is a delivery-transform problem instead.
//
// ⚠️ Keep this a permanent res.cloudinary.com URL. It must never be a cdn.discordapp.com attachment link: those carry signed `ex=`/`is=`/`hm=` params that EXPIRE within about a day. This asset was re-hosted here for exactly that reason (see commands/help.js's header), and a hand-built mockup reintroduced the expiring form once — `local/invite_ui.json`, 2026-08-17 — so the trap is live.

// The transform prefix follows utils/cloudinaryDeliveryUrl.js's `f_auto,q_auto` convention and adds the measured width cap. Kept as one string so the two halves cannot be separated by accident.
const MASCOT_TRANSFORM = 'f_auto,q_auto,w_256';

// Coral DIOREO mascot, square 1:1, full bleed, horizontally flipped before upload (Harkirat's request). Rendered by `/help`'s landing hero and `/invite`'s hero.
const MASCOT_URL = `https://res.cloudinary.com/dr6dn61eh/image/upload/${MASCOT_TRANSFORM}/v1786237039/site_assets/dioreo-mascot-coral.png`;

// MASCOT_TRANSFORM is deliberately NOT exported -- nothing outside needs it, and an unused export is how a value and the reasoning attached to it get "cleaned up" together later. It stays a local constant so the width and the format defaults cannot be edited apart.
module.exports = { MASCOT_URL };
