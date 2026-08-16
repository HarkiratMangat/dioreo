// Shared interaction helpers used by handlers/router.js AND by every per-subsystem handler
// under handlers/ (see docs/ROADMAP.md's "Split index.js into per-subsystem handler modules").
//
// These two functions lived in index.js's PHASE 3 until 2026-08-13 16:45 EDT, when the first handler slice
// (handlers/colors.js) was extracted and needed them. They were moved rather than duplicated
// deliberately: buildSyntheticInteraction in particular encodes the fix for two real crashes, and a
// second copy that drifts from this one would reintroduce them silently. Both are pure -- they close
// over no module-level state -- so a plain require() from anywhere is safe and there is nothing to
// pass in or wire up. See .claude/rules/interaction-router.md.

// Builds a "synthetic" interaction object so a slash command's execute() can be reused
// when triggered from a button/select menu instead of a fresh chat input command.
//
// IMPORTANT: discord.js sets `client` and `token` on every interaction via
// Object.defineProperty(this, 'client'/'token', { value }) with no `enumerable: true`.
// That means Object.assign(target, interaction) silently DROPS both of them, since
// Object.assign only copies enumerable own properties. Any command that then calls
// interaction.client.rest.patch(...) or Routes.webhookMessage(..., interaction.token, ...)
// will crash or silently fail with an invalid route. Always build synthetic interactions
// through this helper instead of hand-rolling Object.assign(...) each time.
function buildSyntheticInteraction(interaction, overrides = {}) {
    const synthetic = Object.assign(Object.create(Object.getPrototypeOf(interaction)), interaction, overrides);
    Object.defineProperty(synthetic, 'client', { value: interaction.client, enumerable: true });
    Object.defineProperty(synthetic, 'token', { value: interaction.token, enumerable: true });
    // Read by utils/eventStore.js's deriveEntry() (2026-08-16, observability stage 2) so a synthetic
    // re-invocation is labelled as one rather than as whatever it is impersonating. Today nothing
    // re-enters handlers/router.js this way -- a synthetic interaction goes straight into a command's
    // execute() -- so this records intent rather than firing; without it the event schema's
    // `entry: 'synthetic'` value would be documented and permanently unreachable, which is worse than
    // a flag that is set and rarely read.
    Object.defineProperty(synthetic, '__dioreoSynthetic', { value: true, enumerable: true });
    return synthetic;
}

// Admin override for per-user panel author-locks (2026-07-18, v2 quick-wins batch) -- Harkirat
// (ALLOWED_ADMIN_ID) should never be action-blocked just because he's clicking on a DIFFERENT
// user's /settings or View Colors panel (e.g. one made public via Show Everyone, or while
// investigating a live bug report) -- only a genuine third party should ever hit these locks.
// CRITICAL, per Harkirat's explicit spec: the override must NOT swap the ORIGINAL user's data for
// Harkirat's own. Every one of these panels is keyed by whichever discordId is embedded in the
// custom_id (targetUserId) for DB reads/writes already, but several call sites downstream also
// re-derive that same person's LIVE profile data straight off `interaction.user` (avatar/banner
// URL, username, createdAt -- see settings.js, utils/colorPalette.js's getSourceImageInfo) --
// simply skipping the block without also fixing what `.user` resolves to would silently render
// Harkirat's own profile on someone else's panel. Returns the discord.js User object callers
// should treat as "whose data is this", or `null` if the click should be denied outright (a real
// non-admin clicking someone else's panel). Callers only need to build a synthetic interaction
// (see buildSyntheticInteraction above) when the returned user differs from interaction.user.
async function resolvePanelActor(interaction, targetUserId) {
    if (interaction.user.id === targetUserId) return interaction.user;
    const { isAdmin } = require('./adminAccess');
    if (!(await isAdmin(interaction.user.id))) return null;
    // Fetched fresh (not guessed/cached) so the panel shows the target's genuinely current avatar/
    // banner, same as every other render path in this bot already force-fetches for accuracy.
    return interaction.client.users.fetch(targetUserId);
}

module.exports = { buildSyntheticInteraction, resolvePanelActor };
