// ==========================================
// DRAWPRICES — INTERACTION HANDLER
// ==========================================
// /draw prices — region switcher + entry pagination. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js
// split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `price_`.
// Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so
// deciding ownership up front cannot change which handler wins, and every branch below keeps the
// exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleDrawpricesInteraction is awaited from
// inside handlers/router.js's single top-level try/catch -- do not add one here, do not register
// listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare
// `return interaction.reply(...)` can reject after the try has exited and escape the net.
// See .claude/rules/interaction-router.md.

const { buildSyntheticInteraction, resolvePanelActor } = require('../utils/interactionContext');

const OWNED_PREFIXES = ["price_"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // DRAW PRICES REGION SWITCHER -- was a single "switch to the other region" toggle button
        // (per Harkirat's drawPrices_ui.json redesign) until the 20 CP region was added 2026-08-07,
        // at which point a binary toggle stopped making sense (see drawprices.js's REGION_ORDER
        // note) and it became a 3-way button row, one button per region. custom_id encodes the
        // region to JUMP TO directly (same scheme as before, just generalized past 2 regions) plus
        // the CURRENT subpage (added 2026-07-12 once entries got split across 2 pages -- e.g.
        // `price_region_30_1` -- so switching region doesn't reset which page of entries you were
        // on). Deliberately NOT prefixed `toggle_` -- that prefix is claimed by the generic
        // /settings binary-toggle handler in `handlers/settings.js` (`customId.startsWith('toggle_')`), which
        // expects a `|{userId}` suffix; a bare `toggle_price_region_10` would have matched that
        // check first, found no userId to compare against, and always hit its "Action Blocked"
        // branch (caught during a bug-check pass before ever being pushed, not found live). Persists
        // to prefs.defaultRegion same as calendar's active/all filter toggle -- the picked region
        // becomes the new default every subsequent /draw prices lands on until changed again.
        const PRICE_REGION_PREFIXES = { 'price_region_10_': 'region_10', 'price_region_20_': 'region_20', 'price_region_30_': 'region_30' };
        const priceRegionPrefix = Object.keys(PRICE_REGION_PREFIXES).find(prefix => interaction.customId.startsWith(prefix));
        if (priceRegionPrefix) {
            // REVERTED to two-hop 2026-08-07 17:38 EDT (v2.60.0) -- the "pagination perf hybrid"
            // single-hop UPDATE_MESSAGE (2026-08-06 22:17 EDT) causes a real, confirmed Discord
            // client bug: a button's custom emoji (this row's region icons) can go blank after a
            // re-render and sometimes never recover. Extensively investigated live (see
            // docs/db-deferred-list.md's "button emoji goes blank" entry) -- ruled out our own
            // payload (always correct), timing/lead-time (tested 200ms-2000ms delays on the
            // single-hop path, all failed), animated-vs-static emoji, and button/emoji count. Only
            // two-hop (deferUpdate() + PATCH @original) avoids it, on every command tested. Real
            // measured cost: ~200-300ms extra per click -- accepted by Harkirat over losing the
            // emoji or living with the bug.
            await interaction.deferUpdate();
            const selectedRegion = PRICE_REGION_PREFIXES[priceRegionPrefix];
            const currentSubpage = parseInt(interaction.customId.split('_').pop(), 10) || 0;

            const UserPreference = require('../models/UserPreference');
            let prefs = await UserPreference.findOne({ discordId: interaction.user.id });
            if (!prefs) prefs = new UserPreference({ discordId: interaction.user.id });
            prefs.defaultRegion = selectedRegion;
            await prefs.save();

            const pricesCommand = interaction.client.commands.get('draw');
            // Re-use the existing render path (rest.patch on @original), just with the newly picked region
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await pricesCommand.execute(syntheticInteraction, selectedRegion, currentSubpage);
        }

        // DRAW PRICES SUBPAGE (ENTRY) NAVIGATION -- Prev/Next between the 2 pages of draw entries
        // (added 2026-07-12 once splitting entries into up to 3 separate Text Displays each pushed
        // all 9 onto one page over Discord's 40-component cap). custom_id is
        // `price_subpage_{region}_{targetPage}` -- region doesn't change here, only which entries
        // are shown. Not persisted anywhere (unlike region), just carried through the click itself.
        if (interaction.customId.startsWith('price_subpage_') && interaction.customId !== 'price_subpage_indicator') {
            // REVERTED to two-hop 2026-08-07 17:38 EDT (v2.60.0) -- see the price_region_ branch
            // above for the full reasoning (the emoji-blank bug + investigation).
            await interaction.deferUpdate();
            const rest = interaction.customId.replace('price_subpage_', '');
            const lastUnderscore = rest.lastIndexOf('_');
            const region = rest.slice(0, lastUnderscore);
            const targetPage = parseInt(rest.slice(lastUnderscore + 1), 10) || 0;

            const pricesCommand = interaction.client.commands.get('draw');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await pricesCommand.execute(syntheticInteraction, region, targetPage);
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handleDrawpricesInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleDrawpricesInteraction, OWNED_PREFIXES };
