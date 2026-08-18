// scripts/colorPaletteCrossViewFetch.test.js -- regression test for utils/colorPalette.js's getPalettePanelData cross-view refresh sweep (v3-pre-release review finding #57, closed 2026-08-18 13:16 EDT). Run: `node scripts/colorPaletteCrossViewFetch.test.js` (also via `npm test`).
//
// The `refreshStale` cross-view pass re-derives the OPPOSITE variant's source info by calling
// getSourceImageInfo(interaction, !useGuild) a second time. That function's global-profile fetch
// (interaction.client.users.fetch({force:true}) + fetchProfileExtras's raw REST GET) is guild-
// INDEPENDENT -- the file's own comment says the global profile is identical between the two views
// -- so a second call re-issues two real network round trips for data the primary call already has
// in hand. This test instruments both calls and asserts they fire exactly ONCE each across a single
// getPalettePanelData({refreshStale: true}) call whose guild profile only partially overrides (so
// BOTH views independently need the global fetch), which is exactly the shape that exposes the bug.
//
// Runs with no Discord/Mongo: utils/guildProfile.js and utils/accentColor.js are stubbed via
// require.cache, matching the pattern scripts/eventStore.test.js already uses.
const assert = require('assert');
const Module = require('module');

const callLog = [];

// A server profile that overrides ONLY avatar -- banner/decoration/nameplate/displayNameColors all
// fall through to the global fetch in BOTH the global view (guildProfile === null there) and the
// guild view (those four fields are absent from this fixture), so `needsGlobal` is true for both
// and the redundant-fetch path is genuinely exercised, not skipped by the zero-network fast path.
const guildProfileFixture = {
    avatarHash: 'guildAvatarHash123', avatarUrl: 'https://cdn.example/guild-avatar.png',
    avatarFullUrl: 'https://cdn.example/guild-avatar-full.png', avatarAnimatedUrl: null,
    bannerHash: null, bannerUrl: null, bannerExtractUrl: null, bannerFullUrl: null,
    decorationAsset: null, decorationUrl: null, decorationSkuId: null,
    nameplateAsset: null, nameplateUrl: null, nameplateAnimatedUrl: null,
    nameplatePalette: null, nameplateSkuId: null, nameplateName: null,
    displayNameColors: null
};

const guildProfilePath = require.resolve('../utils/guildProfile');
const { hasAnyGuildOverride: realHasAnyGuildOverride, isAnimatedHash: realIsAnimatedHash } = require(guildProfilePath);
require.cache[guildProfilePath] = new Module(guildProfilePath, null);
require.cache[guildProfilePath].filename = guildProfilePath;
require.cache[guildProfilePath].loaded = true;
require.cache[guildProfilePath].exports = {
    readGuildProfile: () => guildProfileFixture,
    hasAnyGuildOverride: realHasAnyGuildOverride,
    isAnimatedHash: realIsAnimatedHash
};

const accentColorPath = require.resolve('../utils/accentColor');
require.cache[accentColorPath] = new Module(accentColorPath, null);
require.cache[accentColorPath].filename = accentColorPath;
require.cache[accentColorPath].loaded = true;
require.cache[accentColorPath].exports = {
    // The two REST-costly calls getSourceImageInfo makes when needsGlobal is true. Stubbed rather
    // than wrapping the real implementation so this test needs no fake Discord REST payload shape.
    fetchProfileExtras: async () => {
        callLog.push('fetchProfileExtras');
        return {
            decorationUrl: null, decorationAsset: null, decorationSkuId: null,
            nameplateUrl: null, nameplateAnimatedUrl: null, nameplateAsset: null,
            nameplateSkuId: null, nameplateName: null, nameplatePalette: null,
            displayNameColors: null
        };
    },
    // Only reached on the guild-view call (useGuild=true); cheap stub keeps the call log focused
    // on the two calls actually under test.
    resolveGuildNameColors: async () => null
};

const { getPalettePanelData } = require('../utils/colorPalette');
const { PALETTE_ALGO_VERSION } = require('../utils/colorExtract');

const interaction = {
    user: {
        id: 'user1',
        avatar: 'globalAvatarHash',
        displayAvatarURL: (opts = {}) => `https://cdn.example/avatar.${opts.extension || 'webp'}?size=${opts.size || 128}`
    },
    isChatInputCommand: () => false,
    client: {
        users: {
            fetch: async () => { callLog.push('users.fetch'); return { banner: null }; }
        },
        rest: {
            get: async () => { throw new Error('client.rest.get was called directly -- fetchProfileExtras should have been the only REST path, and it is fully stubbed above'); }
        }
    }
};

// Both sources' cache entries are already fresh (palette + matching identity hash), so the
// refreshStale sweep's own `continue` fires for both without ever reaching getCachedPalette --
// isolating this test to the redundant PROFILE RESOLVE the review finding is actually about,
// not the separate (and separately tested) extraction pipeline.
const prefs = {
    avatarPalette: ['#ABCDEF'],
    avatarPaletteSource: `globalAvatarHash@${PALETTE_ALGO_VERSION}`,
    guildAvatarPalette: ['#123456'],
    guildAvatarPaletteSource: `guildAvatarHash123@${PALETTE_ALGO_VERSION}`,
    save: async () => { throw new Error('prefs.save() should not be reached -- both sources are pinned fresh so the sweep must short-circuit before any write'); }
};

async function run() {
    // activeSource 'name' skips per-source extraction entirely (see the function's own comment),
    // so this exercises exactly the cross-view profile-resolve path and nothing downstream of it.
    const result = await getPalettePanelData(interaction, prefs, 'name', false, 'global', true);

    assert.ok(result.hasServerProfile, 'fixture must actually have a server override, or the cross-view sweep never runs and this test proves nothing');

    const usersFetchCalls = callLog.filter(c => c === 'users.fetch').length;
    const extrasCalls = callLog.filter(c => c === 'fetchProfileExtras').length;

    assert.strictEqual(usersFetchCalls, 1,
        `expected users.fetch to run ONCE -- the global profile is identical across both views, so the cross-view sweep must reuse the primary call's result instead of re-fetching. Got ${usersFetchCalls}. Full call log: ${JSON.stringify(callLog)}`);
    assert.strictEqual(extrasCalls, 1,
        `expected fetchProfileExtras to run ONCE, for the same reason. Got ${extrasCalls}. Full call log: ${JSON.stringify(callLog)}`);
    assert.strictEqual(callLog.length, 2,
        `expected exactly 2 total profile-resolve calls (one users.fetch + one fetchProfileExtras) across BOTH views combined. Full call log: ${JSON.stringify(callLog)}`);

    console.log('  PASS  cross-view refresh reuses the primary global profile resolve instead of re-fetching');
    console.log(`        call log: ${JSON.stringify(callLog)}`);
    console.log('\n  1 passed, 0 failed\n');
    process.exit(0);
}

run().catch(err => {
    console.log(`  FAIL  cross-view refresh reuses the primary global profile resolve instead of re-fetching\n        ${err.message}`);
    console.log(`        call log: ${JSON.stringify(callLog)}`);
    console.log('\n  0 passed, 1 failed\n');
    process.exit(1);
});
