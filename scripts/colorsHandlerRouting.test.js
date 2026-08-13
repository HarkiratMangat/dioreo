// Routing-contract test for handlers/colors.js — the FIRST slice of index.js's per-subsystem split
// (2026-08-13 16:53 EDT, v3.16.0-pre). See .claude/rules/interaction-router.md.
//
// WHAT THIS COVERS, and deliberately what it does NOT. The five colours branches each need a live
// Discord interaction plus Mongo, so their BEHAVIOUR is verified by the live click-test, not here.
// What IS checkable cheaply — and is exactly what the split could silently break — is the
// FALL-THROUGH contract: handleColorsButton must return false for any custom_id it does not own, so
// the router keeps matching its remaining branches. Get that wrong (e.g. "simplify" the dispatch to
// a blanket `colors_` prefix match) and unrelated buttons get silently swallowed with no error
// anywhere — the interaction just dies. Every assertion below runs with no network and no DB,
// because a returning-false path never reaches either.

const assert = require('assert');
const { handleColorsButton } = require('../handlers/colors');

let failures = 0;
async function check(name, fn) {
    try {
        await fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        failures++;
        console.error(`  ✗ ${name}\n      ${error.message}`);
    }
}

// A bare stand-in. If a test ever reaches past the customId checks it will throw on a missing
// method rather than quietly passing — which is the intent: only non-matching ids belong here.
const fakeInteraction = (customId) => ({ customId });

(async () => {
    console.log('handlers/colors.js — routing contract\n');

    await check('exports handleColorsButton as a function', () => {
        assert.strictEqual(typeof handleColorsButton, 'function');
    });

    // Ids belonging to branches that sit BELOW the colours dispatch point in index.js. Each of these
    // must fall through, or that subsystem stops working the moment this handler is consulted.
    for (const id of ['nav_prices', 'nav_calendar', 'dmzpage_ak117_0', 'mppage_ak117_0', 'share_public', 'toggle_visibility|123', 'set_page_1', 'price_subpage_region_10_1']) {
        await check(`falls through: ${id}`, async () => {
            assert.strictEqual(await handleColorsButton(fakeInteraction(id)), false);
        });
    }

    // The paginator's own disabled "1 / 2" indicator button. It IS colours-prefixed, which is the
    // trap: a blanket prefix match would consume it. The real branch excludes it explicitly, so the
    // handler must decline it and let it be the no-op it is.
    await check('falls through: colors_subpage_indicator (the disabled page indicator)', async () => {
        assert.strictEqual(await handleColorsButton(fakeInteraction('colors_subpage_indicator')), false);
    });

    // A colours-prefixed id matching no branch — the case the boolean contract exists for. Pre-split
    // this fell through to the branches below; it must still.
    await check('falls through: an unrecognised colors_* id', async () => {
        assert.strictEqual(await handleColorsButton(fakeInteraction('colors_somethingnew_1|123')), false);
    });

    console.log(failures === 0 ? '\nAll routing-contract checks passed.' : `\n${failures} check(s) FAILED.`);
    process.exit(failures === 0 ? 0 : 1);
})();
