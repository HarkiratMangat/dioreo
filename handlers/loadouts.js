// ==========================================
// LOADOUTS — INTERACTION HANDLER
// ==========================================
// MP/DMZ loadout cards — browse dropdown + pagination/copy. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js
// split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `mpbrowse`, `dmzbrowse`, `dmz`, `mp`.
// Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so
// deciding ownership up front cannot change which handler wins, and every branch below keeps the
// exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleLoadoutsInteraction is awaited from
// inside handlers/router.js's single top-level try/catch -- do not add one here, do not register
// listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare
// `return interaction.reply(...)` can reject after the try has exited and escape the net.
// See .claude/rules/interaction-router.md.

// (no shared interaction helpers needed here -- these branches never build a synthetic
// interaction or resolve a panel owner. See utils/interactionContext.js if that changes.)

const OWNED_PREFIXES = ["mpbrowse", "dmzbrowse", "gsb~", "dmz", "mp"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // LOADOUT "BROWSE OTHER BUILDS" DROPDOWN (added 2026-07-12) -- lets a user jump
        // straight to a different weapon's card without re-running the slash command. Selected
        // value is just a bare `weaponKey` (see utils/loadoutRender.js's buildCategoryBrowseRow --
        // this used to also encode a build index for a specific build variant, simplified to
        // weapon-only per Harkirat's follow-up request; always opens at build index 0). Mode is
        // inferred from which dropdown fired ('mpbrowse' vs 'dmzbrowse'), matching the
        // dmz/mp-prefixed pagination convention used everywhere else for these two card types.
        //
        // BUG FIX (found live, 2026-07-13): this used to be misplaced inside `if (interaction.
        // isButton())` further down -- a plain copy-paste-adjacent mistake when it was first added.
        // A StringSelectMenuInteraction never satisfies `isButton()`, so the entire block was dead
        // code: no error, no log, nothing -- Discord just timed out the interaction after ~3s with
        // a bare "This interaction failed" and the bot never even attempted to handle it. Moved
        // into the correct `isStringSelectMenu()` block (this one) where it's actually reachable.
        // ⚠️ The type test is load-bearing, and the comment above is the reason. `mpbrowse` matches
        // the pagination branch's `startsWith('mp')` further down, so these two are separated ONLY by
        // interaction type -- pre-split that separation was structural (two different blocks), and
        // flattening them into one function is what made it explicit here. Without it the ordering of
        // these branches would silently decide which one wins.
        if (interaction.isStringSelectMenu() && (interaction.customId === 'mpbrowse' || interaction.customId === 'dmzbrowse')) {
            const Loadout = require('../models/Loadout');
            const { buildLoadoutCard, getMpCategoryAccent } = require('../utils/loadoutRender');
            const isDmz = interaction.customId === 'dmzbrowse';
            const mode = isDmz ? 'DMZ' : 'MP';
            const gunKey = interaction.values[0];

            // Defer FIRST, before any DB round-trip -- matches the dmz/mp pagination handler
            // further down ("PRO FIX: defer first"), for the same reason: an awaited query ahead
            // of the ack risks missing Discord's ~3s interaction window, which surfaces to the
            // user as a bare "This interaction failed" with no detail.
            await interaction.deferUpdate();
            const isEphemeral = Boolean(interaction.message.flags?.bitfield & 64);

            // .lean() -- read-only, same as the pagination handler below.
            const matchingBuilds = await Loadout.find({ weaponKey: gunKey, mode }).lean();
            if (!matchingBuilds || matchingBuilds.length === 0) {
                // Shouldn't happen (the option came from a live DB query moments ago), but guard
                // against a build being deleted via /manage in the gap between render and click
                // rather than throwing on `matchingBuilds[0].category` below.
                try {
                    await interaction.followUp({ content: '❌ That weapon no longer has any builds saved.', ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of missing browse-target builds (interaction likely expired):', notifyError);
                }
                return;
            }

            const categoryBuilds = isDmz
                ? await Loadout.find({ mode: 'DMZ' }).lean()
                : await Loadout.find({ category: matchingBuilds[0].category, mode: 'MP' }).lean();
            const cardPayload = buildLoadoutCard(matchingBuilds, 0,
                { color: getMpCategoryAccent(matchingBuilds[0].category), idPrefix: isDmz ? 'dmz' : 'mp', isEphemeral, categoryBuilds });

            const { sendV2Payload } = require('../utils/sendV2Payload');
            return await sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
        }

        // /gunsmiths list SCOPE JUMP dropdown -- a SELECT. Type-tested because `gsb~jump~...` would
        // otherwise fall through to the button branch below if this file ever lost the explicit
        // isStringSelectMenu() test -- the exact dead-branch bug this file's header documents (a
        // select handler written under isButton() becomes dead code with no error).
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('gsb~jump~')) {
            const scopeToken = interaction.customId.split('~')[2];
            const { parseScopeToken, resolveScopeBuilds } = require('../utils/loadoutScopes');
            const { renderScopeBrowse } = require('../commands/gunsmiths');
            const scope = parseScopeToken(scopeToken);
            const builds = await resolveScopeBuilds(scope);
            if (!builds.length) return await renderScopeBrowse(interaction, scope, 0, { isUpdate: true });
            const target = Math.max(0, builds.findIndex(b => b.weaponKey === interaction.values[0]));
            return await renderScopeBrowse(interaction, scope, target, { isUpdate: true });
        }

        // /gunsmiths list SCOPE PAGING -- a BUTTON. Type-tested for the same reason as the select
        // branch above; `action !== 'next' && action !== 'prev'` guards the disabled `gsb~ind~`
        // page-count label, which is not clickable but shares the `gsb~` prefix.
        if (interaction.isButton() && interaction.customId.startsWith('gsb~')) {
            const [, action, scopeToken, flatIndexRaw] = interaction.customId.split('~');
            if (action !== 'next' && action !== 'prev') return;
            const { parseScopeToken, resolveScopeBuilds } = require('../utils/loadoutScopes');
            const { renderScopeBrowse } = require('../commands/gunsmiths');
            const scope = parseScopeToken(scopeToken);
            const builds = await resolveScopeBuilds(scope);
            // Guard BEFORE the modulo. /manage can purge a scope empty between render and click:
            // `(cur + 1) % 0` is NaN, and flatIndexToPosition's clamp would yield -1 -> builds[-1]
            // is undefined -> throws. renderScopeBrowse has its own empty guard, but it sits
            // DOWNSTREAM of this arithmetic and never gets the chance to fire.
            if (!builds.length) return await renderScopeBrowse(interaction, scope, 0, { isUpdate: true });
            const cur = parseInt(flatIndexRaw, 10) || 0;
            const next = action === 'next'
                ? (cur + 1) % builds.length
                : (cur - 1 + builds.length) % builds.length;
            return await renderScopeBrowse(interaction, scope, next, { isUpdate: true });
        }

        // LOADOUT PAGINATION & COPY (DMZ and MP, both MongoDB-backed)
        // Shared handling for both custom_id prefixes since /dmz and /gunsmiths use identical card
        // layouts — see utils/loadoutRender.js. `mode` is the only real difference in what gets queried.
        if (interaction.isButton() && (interaction.customId.startsWith('dmz') || interaction.customId.startsWith('mp'))) {
            const Loadout = require('../models/Loadout');
            const { buildLoadoutCard, getMpCategoryAccent } = require('../utils/loadoutRender');
            const isDmz = interaction.customId.startsWith('dmz');
            const mode = isDmz ? 'DMZ' : 'MP';

            // Strip the prefix so we can parse the standard action format
            const [action, gunKey, currentIndex] = interaction.customId.replace(isDmz ? 'dmz' : 'mp', '').split('_');

            // .lean() -- these builds are only ever read (rendered into the card or replied with
            // directly), never mutated/saved on this path.
            const matchingBuilds = await Loadout.find({ weaponKey: gunKey, mode }).lean();
            let newIndex = parseInt(currentIndex);

            // Calculate wrap-around pagination index
            if (action === 'next') newIndex = (newIndex + 1) % matchingBuilds.length;
            if (action === 'prev') newIndex = (newIndex - 1 + matchingBuilds.length) % matchingBuilds.length;
            if (action === 'copy' || action === 'copyatt') {
                // Awaited + wrapped in its own try/catch -- see the matching note above. No further
                // fallback reply attempt on failure here (unlike the error-fallback sites): this IS
                // the terminal action, and if the interaction token already failed once, a second
                // reply attempt on the same token would fail too.
                const build = matchingBuilds[newIndex];
                // Prefer the real in-game Gunsmith code (shareCode) if this loadout has one, falling
                // back to buildName for loadouts added via /manage (which never collected a real
                // code) — see models/Loadout.js for why these are two separate fields. "Copy
                // Attachments" is the plain list instead, one per line, no bullets/backticks/
                // formatting -- unlike the card's own "### Attachments" display, this is meant to be
                // pasted straight into Gunsmith.
                const replyContent = action === 'copy' ? (build.shareCode || build.buildName) : build.attachments.join('\n');
                try {
                    await interaction.reply({ content: replyContent, ephemeral: true });
                } catch (replyError) {
                    console.error(`Failed to reply to loadout ${action} action (interaction likely expired):`, replyError);
                }
                return;
            }

            // PRO FIX: defer first — same "LIBRARY SERIALIZATION BYPASS" reasoning used everywhere
            // else in this bot: discord.js's own `interaction.update()` doesn't reliably handle raw
            // Components V2 JSON (no builder classes exist for Container/type 17), so this needs the
            // same deferUpdate() + raw rest.patch('@original') two-step every other V2 command uses,
            // not a single high-level `interaction.update(...)` call.
            await interaction.deferUpdate();

            // Preserve whether the message being edited was ephemeral — Discord can't change that
            // via edit either way, but the card builder still needs to know whether to keep showing
            // the "Share Publicly" button after paging to a different build.
            const isEphemeral = Boolean(interaction.message.flags?.bitfield & 64);

            // Reassemble the updated visual frame card for the new page. Both MP and DMZ resolve
            // their accent color per-category now (see utils/loadoutRender.js's
            // MP_CATEGORY_ACCENT) -- DMZ switched from its own fixed identity color (#1c1c1c) to
            // this same mapping 2026-07-12 (Section 5 of the batch) -- so paging Prev/Next doesn't
            // flip the card back to the old flat color for either mode.
            const categoryBuilds = isDmz
                ? await Loadout.find({ mode: 'DMZ' }).lean()
                : await Loadout.find({ category: matchingBuilds[0].category, mode: 'MP' }).lean();
            const cardPayload = buildLoadoutCard(matchingBuilds, newIndex,
                { color: getMpCategoryAccent(matchingBuilds[0].category), idPrefix: isDmz ? 'dmz' : 'mp', isEphemeral, categoryBuilds });

            const { sendV2Payload } = require('../utils/sendV2Payload');
            return await sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handleLoadoutsInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleLoadoutsInteraction, OWNED_PREFIXES };
