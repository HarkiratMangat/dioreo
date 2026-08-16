// Interaction-context propagation for structured logging (stage 1 of the observability layer).
// See docs/superpowers/specs/2026-08-16-observability-layer-design.md §4 ("Attribution") — this file
// is the one edit that replaces instrumenting ~146 individual console.* call sites. handlers/router.js
// establishes a context ONCE per interaction via runWithContext(); every console.* call anywhere below
// that point, at any call depth, across any number of async hops, picks it up automatically through
// utils/logger.js's patchConsole(). Non-interaction paths (bot/lifecycle.js's heartbeat, boot, gateway
// diagnostics, Cloudinary cleanup) never call runWithContext(), so getContext() correctly returns
// undefined there — logger.js's own fallback (a `lifecycle` tag) covers them without this file needing
// to know they exist.
//
// ⚠️ NEVER put a raw Discord ID in the context. hashUserId() is the ONLY way a user identifier enters
// it — see the NEVER list in docs/superpowers/specs/2026-08-16-observability-layer-design.md and the
// design's own §4: a raw ID permitted in the diagnostic plane is a raw ID sitting in the async context,
// one careless log line away from leaking. Both this stage and the stage-2 event plane read the SAME
// context object, so a raw ID here would be a raw ID there too.

const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');

const store = new AsyncLocalStorage();

// Runs fn() with `context` as the active store for its entire async lifetime — every await inside it,
// at any depth, sees the same object via getContext(). Call ONCE per interaction, wrapping the whole
// handler body (not per-branch), so concurrent interactions each get their own isolated context and
// never interleave.
function runWithContext(context, fn) {
    return store.run(context, fn);
}

function getContext() {
    return store.getStore();
}

// HMAC-SHA256(ANALYTICS_HMAC_KEY, discordId) -- the identity scheme the design commits to (§3), read
// here because the router's context needs a userHash the moment an interaction arrives, before the
// stage-2 event plane exists to consume it. Stage 2 reuses this same function rather than inventing a
// second one.
//
// ⚠️ FALLS BACK TO AN EPHEMERAL PER-PROCESS KEY when ANALYTICS_HMAC_KEY is unset, so a missing key
// degrades (hashes stop correlating across restarts) instead of crashing the bot. This should not
// trigger in practice -- the key is provisioned in .env and .env.dev as part of this stage -- but a
// logging path must never be able to take the bot down over a missing env var.
let warnedMissingKey = false;
let ephemeralKey = null;
function getHmacKey() {
    const configured = process.env.ANALYTICS_HMAC_KEY;
    if (configured) return Buffer.from(configured, 'base64');
    if (!warnedMissingKey) {
        warnedMissingKey = true;
        console.warn('ANALYTICS_HMAC_KEY is not set -- using an ephemeral per-process key; user hashes will not correlate across restarts.');
    }
    if (!ephemeralKey) ephemeralKey = crypto.randomBytes(32);
    return ephemeralKey;
}

function hashUserId(discordId) {
    if (!discordId) return null;
    return crypto.createHmac('sha256', getHmacKey()).update(String(discordId)).digest('hex');
}

module.exports = { runWithContext, getContext, hashUserId };
