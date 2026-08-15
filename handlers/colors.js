// ==========================================
// VIEW COLORS PANEL — BUTTON HANDLERS
// ==========================================
// The five `colors_*` button branches, extracted verbatim from the interaction router (then `index.js`, now `handlers/router.js`)
// on 2026-08-13 16:45 EDT (v3.16.0-pre) as the FIRST slice of the per-subsystem handler split — see
// docs/ROADMAP.md and docs/superpowers/specs. Colours were picked as the first slice because this
// block was the most self-contained one in the router: it touches neither `client` nor
// `client.commands`, every branch terminates, and its 10s refresh cooldown is used nowhere else.
//
// ⚠️ THE CRASH NET STILL LIVES IN handlers/router.js, NOT HERE. handleColorsButton is awaited from inside
// handlers/router.js's single top-level try/catch, which is what keeps an expired-token click (Discord 10062)
// a dead button rather than a dead bot. So: do NOT wrap the body below in its own try/catch, do NOT
// register listeners here, and keep every error-branch reply as an AWAITED call inside its own small
// try/catch (the shape already used throughout) — a bare `return interaction.reply(...)` can reject
// after the enclosing try has exited and escape the net entirely. Full reasoning, including the two
// real crashes behind this: .claude/rules/interaction-router.md.
//
// ⚠️ MODULE-LEVEL STATE BELOW. colorsRefreshCooldowns relies on Node caching this module so exactly
// one instance exists per process. There is one require() of this file (handlers/router.js). Do not add a
// second path to it — utils/nameplateWebpCache.js once lost its resolvedCache to exactly that,
// getting a fresh module instance and silently short-circuiting.

const { buildSyntheticInteraction, resolvePanelActor } = require('../utils/interactionContext');
const { logRenderTiming } = require('../utils/renderTiming'); // /colors panel perf instrumentation, see models/RenderTiming.js

// "Refresh Colors" cooldown (2026-07-14, Harkirat's request) -- a SEPARATE, longer cooldown from the
// generic 600ms anti-spam guard in handlers/router.js, specific to the colors_refresh_ button, since that
// button does real work (re-downloads + re-extracts a source's palette) that the generic guard's
// window wouldn't meaningfully throttle. userId-keyed, same "one entry per distinct user, no TTL
// needed" shape as handlers/router.js's interactionCooldowns.
const colorsRefreshCooldowns = new Map(); // userId -> last accepted refresh timestamp
const COLORS_REFRESH_COOLDOWN_MS = 10 * 1000;

// ⚠️ DECLARATIVE ONLY — this module does NOT gate on it, unlike every other handler. Ownership here
// is decided branch by branch so an unrecognised `colors_*` id falls THROUGH (see the contract note
// on handleColorsButton below); gating on the prefix would swallow it and change behaviour.
// It is exported anyway because `scripts/handlerRouting.test.js` checks that no two handlers claim
// overlapping prefixes, and that check can only see what a module declares. Before this existed the
// test carried a hardcoded `['colors_']`, which meant a NEW colours prefix would have been invisible
// to the one check protecting the whole dispatch design. Keep this list in step with the branches.
const OWNED_PREFIXES = ['colors_'];

// Returns TRUE when this handler consumed the interaction, FALSE when it did not recognise the
// custom_id and the router should keep matching its remaining branches. The boolean contract (rather
// than a blanket `colors_` prefix match in handlers/router.js) is what preserves the pre-split behaviour
// exactly: an unrecognised `colors_*` id falls through, same as it always did.
async function handleColorsButton(interaction) {
    // ⚠️ FOUND LIVE 2026-08-14 18:15 EDT boot-testing stage 3 of the /manage decomposition: this was
    // the ONLY per-subsystem handler with no customId guard at all -- every other handlers/*.js module
    // opens with `if (!ownsCustomId(interaction.customId)) return false;`, whose ownsCustomId() checks
    // `typeof customId === 'string'` first. Without it, ANY interaction with no customId (a plain slash
    // command OR an autocomplete interaction -- neither carries one) that reaches this point in
    // handlers/router.js's dispatch chain (colours sits last) threw here unconditionally, and the
    // outer crash net just logged it -- so the interaction was never acknowledged, bot-wide, for every
    // command, since colors.js was first extracted 2026-08-13 16:45 EDT (predating the type-test fix
    // documented in .claude/rules/interaction-router.md, found later that same day at 18:45 EDT and
    // applied to the other twelve handlers but never backported here). Deliberately just a presence
    // check, NOT `ownsCustomId`/OWNED_PREFIXES gating -- this module's whole contract is that an
    // unrecognised `colors_*` id still falls through to `return false` at the bottom (see that
    // function's own comment); gating on the prefix would swallow ids this handler doesn't own.
    if (typeof interaction.customId !== 'string') return false;

    // "VIEW COLORS" PANEL ENTRY (2026-07-13) -- opens as its OWN new message (deferReply, not
    // deferUpdate) so /settings itself stays open underneath, unlike every other settings button
    // here which edits @original in place. custom_id: `colors_view|{userId}`. Ephemeral state
    // matches the user's own `/settings` visibility preference (Harkirat's request) -- same
    // resolution settings.js itself uses, not a hardcoded always-ephemeral default.
    if (interaction.customId.startsWith('colors_view|')) {
        // custom_id: `colors_view|{userId}` -- this button is itself a component ON the
        // /settings message, so it's subject to THAT message's own passive idle-timeout (see
        // utils/passiveExpiry.js) same as every other settings component; no separate expiry
        // check needed here anymore (removed 2026-07-18, a 3rd `|{expiresAt}` segment used to
        // live here for the old reactive check). The NEW colors panel this opens is a SEPARATE
        // message with its own existing |userId lock and no timeout of its own (Harkirat's
        // explicit "/settings only" call) -- unaffected either way.
        const [, targetUserId] = interaction.customId.split('|');
        // Admin-override (2026-07-18) -- see resolvePanelActor's own comment. colorsInteraction
        // is only a synthetic (user-swapped) interaction when Harkirat is overriding someone
        // else's panel -- getSourceImageInfo/getPalettePanelData read `.user` directly, so this
        // is what keeps the extracted colors targetUserId's own, never the admin's.
        const actingUser = await resolvePanelActor(interaction, targetUserId);
        if (!actingUser) {
            try {
                await interaction.reply({ content: "🔒 **Those aren't your colors!** Run `/colors` (or `/settings` → View Colors) to see your own palette.", ephemeral: true });
            } catch (notifyError) {
                console.error('Failed to notify user of blocked View Colors action (interaction likely expired):', notifyError);
            }
            return true;
        }
        const colorsInteraction = actingUser === interaction.user ? interaction : buildSyntheticInteraction(interaction, { user: actingUser });

        const UserPreference = require('../models/UserPreference');
        let prefs = await UserPreference.findOne({ discordId: targetUserId });
        if (!prefs) prefs = new UserPreference({ discordId: targetUserId });
        const isEphemeral = (prefs.settingsVisibility || 'public').toUpperCase() !== 'PUBLIC';

        await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });
        const panelStartedAt = Date.now();
        const { getPalettePanelData } = require('../utils/colorPalette');
        const { buildColorPalettePanel } = require('../utils/colorPaletteView');

        // forceRefresh: true (2026-07-14, Harkirat's explicit request) -- the main "View Colors"
        // button is a deliberate exception to this bot's general "buttons never re-run
        // extraction/re-fetch" rule, since clicking it is a genuine new look-up action, not a
        // rapid re-render of something already on screen. Page-switch navigation below (`colors_page_`)
        // stays cache-only as normal; only this entry point and the explicit "Refresh Colors"
        // button (`colors_refresh_`) force a real re-extraction. Extracts ONLY the avatar landing page now (not
        // all 4 sources) -- other pages lazily extract on navigation (see getPalettePanelData).
        // Opens the SERVER view when the user has a profile for this guild, per Harkirat's spec:
        // the /settings colour button shows guild colours inside a guild when they exist and
        // global otherwise. Asking for 'server' is safe even when there is none -- every source
        // falls back individually -- and hasServerProfile is what decides which view we're
        // actually in, so the switch button gets the right label.
        const data = await getPalettePanelData(colorsInteraction, prefs, 'avatar', true, 'server');
        const variant = data.hasServerProfile ? 'server' : 'global';

        const { components, files } = await buildColorPalettePanel({
            source: 'avatar',
            data,
            targetUserId,
            // data.avatarThumbnailUrl already reflects whichever variant was resolved (the
            // server avatar in the server view), so it wins; the direct read stays as the
            // fallback for the global view and for the admin-override path, where the synthetic
            // interaction's .user is deliberately the panel's owner rather than the clicker.
            avatarThumbnailUrl: data.avatarThumbnailUrl || colorsInteraction.user.displayAvatarURL({ extension: 'png', size: 256 }),
            variant
        });
        const { sendV2Payload } = require('../utils/sendV2Payload');
        await sendV2Payload(interaction, components, { flags: 32768 | (isEphemeral ? 64 : 0), allowedMentions: { users: [] }, files });
        // Instrumentation only, see models/RenderTiming.js -- not awaited, never allowed to affect
        // the actual response. `cold: true` unconditionally: colors_view always forceRefresh:true.
        logRenderTiming({ area: 'colors_panel', action: 'view', source: 'avatar', variant, cold: true, durationMs: Date.now() - panelStartedAt, discordId: targetUserId, guildId: interaction.guildId });
        return true;
    }

    // "VIEW COLORS" SOURCE PAGE SWITCH -- Avatar/Banner/Name/Nameplate/Deco buttons on the panel
    // above. Edits that panel message in place (deferUpdate, unlike colors_view's deferReply
    // above, since this interaction's own @original IS the already-open palette message) --
    // ephemeral state can't change via an edit anyway, so this just preserves whatever the
    // message already has (same pattern the loadout pagination handler uses). Deliberately
    // cache-only (no forceRefresh) -- ordinary page navigation should stay fast and NOT re-run
    // extraction on every click, unlike colors_view/colors_refresh_ above/below.
    // GLOBAL <-> SERVER switch on the View Colors panel (2026-08-09 17:06 EDT).
    // custom_id: `colors_variant_{g|s}_{source}_{subpage}|{userId}` -- note the target variant is
    // the FIRST token, so the button says where it's going, not where it is. This is also the
    // target of the "Show Global Colors" button on /colors' no-server-profile warning panel, so
    // there is exactly one implementation of "render this variant" rather than two.
    //   Deferred, not single-hop: switching variant changes every source hash, so it is normally
    //   a genuine cache miss and a real k-means extraction -- the heavy path that the pagination
    //   perf work deliberately kept on defer-then-patch (see docs/db-deferred-list.md).
    if (interaction.customId.startsWith('colors_variant_')) {
        const [actionStr, targetUserId] = interaction.customId.split('|');
        // `colors_variant_g_avatar_0` -> ['colors','variant','g','avatar','0']. No source name
        // contains an underscore, so this split is unambiguous.
        const parts = actionStr.split('_');
        const variant = parts[2] === 's' ? 'server' : 'global';
        const source = parts[3] || 'avatar';
        const subpage = parseInt(parts[4], 10) || 0;

        // Admin-override (2026-07-18) -- see resolvePanelActor's own comment.
        const actingUser = await resolvePanelActor(interaction, targetUserId);
        if (!actingUser) {
            try {
                await interaction.reply({ content: "🔒 **Those aren't your colors!** Run `/colors` (or `/settings` → View Colors) to see your own palette.", ephemeral: true });
            } catch (notifyError) {
                console.error('Failed to notify user of blocked View Colors action (interaction likely expired):', notifyError);
            }
            return true;
        }
        const colorsInteraction = actingUser === interaction.user ? interaction : buildSyntheticInteraction(interaction, { user: actingUser });

        await interaction.deferUpdate();
        const panelStartedAt = Date.now();
        const UserPreference = require('../models/UserPreference');
        const { getPalettePanelData } = require('../utils/colorPalette');
        const { buildColorPalettePanel } = require('../utils/colorPaletteView');

        let prefs = await UserPreference.findOne({ discordId: targetUserId });
        if (!prefs) prefs = new UserPreference({ discordId: targetUserId });

        const data = await getPalettePanelData(colorsInteraction, prefs, source, false, variant);
        const isEphemeral = Boolean(interaction.message.flags?.bitfield & 64);

        const { components, files } = await buildColorPalettePanel({
            source,
            subpage,
            data,
            targetUserId,
            avatarThumbnailUrl: data.avatarThumbnailUrl || colorsInteraction.user.displayAvatarURL({ extension: 'png', size: 256 }),
            variant
        });
        const { sendV2Payload } = require('../utils/sendV2Payload');
        await sendV2Payload(interaction, components, { flags: 32768 | (isEphemeral ? 64 : 0), allowedMentions: { users: [] }, files });
        // Instrumentation only, see models/RenderTiming.js. `cold` is unknown here (getCachedPalette
        // decides cache-hit-vs-extract internally, not surfaced to this caller) -- left null rather
        // than guessed; a switch to a genuinely new variant is usually a real extraction in practice.
        logRenderTiming({ area: 'colors_panel', action: 'variant', source, subpage, variant, cold: null, durationMs: Date.now() - panelStartedAt, discordId: targetUserId, guildId: interaction.guildId });
        return true;
    }

    if (interaction.customId.startsWith('colors_page_')) {
        const [actionStr, targetUserId, variantToken] = interaction.customId.split('|');
        // Third segment carries which view this panel is in ('g' global / 's' server), so a
        // page, subpage or refresh click stays where the user was instead of snapping back to
        // global. Absent on any id minted before this shipped, so it degrades to global rather
        // than throwing -- a message left open across the deploy keeps working.
        const variant = variantToken === 's' ? 'server' : 'global';
        // Admin-override (2026-07-18) -- see resolvePanelActor's own comment.
        const actingUser = await resolvePanelActor(interaction, targetUserId);
        if (!actingUser) {
            try {
                await interaction.reply({ content: "🔒 **Those aren't your colors!** Run `/colors` (or `/settings` → View Colors) to see your own palette.", ephemeral: true });
            } catch (notifyError) {
                console.error('Failed to notify user of blocked View Colors action (interaction likely expired):', notifyError);
            }
            return true;
        }
        const colorsInteraction = actingUser === interaction.user ? interaction : buildSyntheticInteraction(interaction, { user: actingUser });

        await interaction.deferUpdate();
        const panelStartedAt = Date.now();
        const source = actionStr.replace('colors_page_', '');
        const UserPreference = require('../models/UserPreference');
        const { getPalettePanelData } = require('../utils/colorPalette');
        const { buildColorPalettePanel } = require('../utils/colorPaletteView');

        let prefs = await UserPreference.findOne({ discordId: targetUserId });
        if (!prefs) prefs = new UserPreference({ discordId: targetUserId });

        // Extract just the source being switched TO (cache-only unless it's this source's first
        // visit -- getCachedPalette still extracts an uncached source even without forceRefresh).
        const data = await getPalettePanelData(colorsInteraction, prefs, source, false, variant);
        const isEphemeral = Boolean(interaction.message.flags?.bitfield & 64);

        const { components, files } = await buildColorPalettePanel({
            source,
            data,
            targetUserId,
            // data.avatarThumbnailUrl already reflects whichever variant was resolved (the
            // server avatar in the server view), so it wins; the direct read stays as the
            // fallback for the global view and for the admin-override path, where the synthetic
            // interaction's .user is deliberately the panel's owner rather than the clicker.
            avatarThumbnailUrl: data.avatarThumbnailUrl || colorsInteraction.user.displayAvatarURL({ extension: 'png', size: 256 }),
            variant
        });
        const { sendV2Payload } = require('../utils/sendV2Payload');
        await sendV2Payload(interaction, components, { flags: 32768 | (isEphemeral ? 64 : 0), allowedMentions: { users: [] }, files });
        // Instrumentation only, see models/RenderTiming.js -- this is the handler Harkirat flagged
        // as "felt slightly slower" switching between e.g. Nameplate and Deco (2026-08-11 22:03 EDT).
        logRenderTiming({ area: 'colors_panel', action: 'page', source, variant, cold: null, durationMs: Date.now() - panelStartedAt, discordId: targetUserId, guildId: interaction.guildId });
        return true;
    }

    // "VIEW COLORS" SUB-PAGE SWITCH -- Prev/Next WITHIN the current source (avatar/banner's
    // 8 colors need this at 4-per-page; display name/nameplate/decoration's smaller counts never
    // show this row at all, see buildPaginationRow's own totalChunks<=1 check). custom_id:
    // `colors_subpage_{source}_{subpage}|{userId}`. Same shape as `colors_page_` above (cache-only, no
    // forceRefresh), just staying on the same source instead of switching to a different one.
    if (interaction.customId.startsWith('colors_subpage_') && interaction.customId !== 'colors_subpage_indicator') {
        const [actionStr, targetUserId, variantToken] = interaction.customId.split('|');
        // Third segment carries which view this panel is in ('g' global / 's' server), so a
        // page, subpage or refresh click stays where the user was instead of snapping back to
        // global. Absent on any id minted before this shipped, so it degrades to global rather
        // than throwing -- a message left open across the deploy keeps working.
        const variant = variantToken === 's' ? 'server' : 'global';
        // Admin-override (2026-07-18) -- see resolvePanelActor's own comment.
        const actingUser = await resolvePanelActor(interaction, targetUserId);
        if (!actingUser) {
            try {
                await interaction.reply({ content: "🔒 **Those aren't your colors!** Run `/colors` (or `/settings` → View Colors) to see your own palette.", ephemeral: true });
            } catch (notifyError) {
                console.error('Failed to notify user of blocked View Colors action (interaction likely expired):', notifyError);
            }
            return true;
        }
        const colorsInteraction = actingUser === interaction.user ? interaction : buildSyntheticInteraction(interaction, { user: actingUser });

        await interaction.deferUpdate();
        const panelStartedAt = Date.now();
        const [source, subpageStr] = actionStr.replace('colors_subpage_', '').split('_');
        const subpage = parseInt(subpageStr, 10) || 0;
        const UserPreference = require('../models/UserPreference');
        const { getPalettePanelData } = require('../utils/colorPalette');
        const { buildColorPalettePanel } = require('../utils/colorPaletteView');

        let prefs = await UserPreference.findOne({ discordId: targetUserId });
        if (!prefs) prefs = new UserPreference({ discordId: targetUserId });

        // Same source as the current page (just a different sub-page of its swatches) -- a cache
        // hit in the normal case, since navigating here means this source was already extracted.
        const data = await getPalettePanelData(colorsInteraction, prefs, source, false, variant);
        const isEphemeral = Boolean(interaction.message.flags?.bitfield & 64);

        const { components, files } = await buildColorPalettePanel({
            source,
            subpage,
            data,
            targetUserId,
            // data.avatarThumbnailUrl already reflects whichever variant was resolved (the
            // server avatar in the server view), so it wins; the direct read stays as the
            // fallback for the global view and for the admin-override path, where the synthetic
            // interaction's .user is deliberately the panel's owner rather than the clicker.
            avatarThumbnailUrl: data.avatarThumbnailUrl || colorsInteraction.user.displayAvatarURL({ extension: 'png', size: 256 }),
            variant
        });
        const { sendV2Payload } = require('../utils/sendV2Payload');
        await sendV2Payload(interaction, components, { flags: 32768 | (isEphemeral ? 64 : 0), allowedMentions: { users: [] }, files });
        // Instrumentation only, see models/RenderTiming.js. This should be the FASTEST of the four
        // panel actions (same source, cache hit in the normal case) -- a useful baseline to compare
        // colors_page_'s numbers against when Session C looks at this data.
        logRenderTiming({ area: 'colors_panel', action: 'subpage', source, subpage, variant, cold: null, durationMs: Date.now() - panelStartedAt, discordId: targetUserId, guildId: interaction.guildId });
        return true;
    }

    // "VIEW COLORS" MANUAL REFRESH (2026-07-14, Harkirat's request) -- the "Refresh Colors"
    // button on the panel. custom_id: `colors_refresh_{source}_{subpage}|{userId}` (stays on the
    // same page/subpage that was showing when clicked). forceRefresh: true bypasses the cache and
    // actually re-runs
    // extraction -- the one other deliberate exception to "buttons never re-fetch", alongside
    // colors_view (`colors_view|`) above. Also gated by a dedicated 10s cooldown (colorsRefreshCooldowns,
    // separate from the generic 600ms anti-spam guard -- this button does real work, unlike a
    // plain re-render) and reports back whether anything actually changed, via an ephemeral
    // follow-up alongside the panel update.
    if (interaction.customId.startsWith('colors_refresh_')) {
        const [actionStr, targetUserId, variantToken] = interaction.customId.split('|');
        // Third segment carries which view this panel is in ('g' global / 's' server), so a
        // page, subpage or refresh click stays where the user was instead of snapping back to
        // global. Absent on any id minted before this shipped, so it degrades to global rather
        // than throwing -- a message left open across the deploy keeps working.
        const variant = variantToken === 's' ? 'server' : 'global';
        // Admin-override (2026-07-18) -- see resolvePanelActor's own comment.
        const actingUser = await resolvePanelActor(interaction, targetUserId);
        if (!actingUser) {
            try {
                await interaction.reply({ content: "🔒 **Those aren't your colors!** Run `/colors` (or `/settings` → View Colors) to see your own palette.", ephemeral: true });
            } catch (notifyError) {
                console.error('Failed to notify user of blocked View Colors action (interaction likely expired):', notifyError);
            }
            return true;
        }
        const colorsInteraction = actingUser === interaction.user ? interaction : buildSyntheticInteraction(interaction, { user: actingUser });

        const now = Date.now();
        const lastRefresh = colorsRefreshCooldowns.get(interaction.user.id) || 0;
        if (now - lastRefresh < COLORS_REFRESH_COOLDOWN_MS) {
            const remainingSec = Math.ceil((COLORS_REFRESH_COOLDOWN_MS - (now - lastRefresh)) / 1000);
            try {
                await interaction.reply({ content: `⏳ **Slow down!** Please wait ${remainingSec}s before refreshing colors again.`, ephemeral: true });
            } catch (notifyError) {
                console.error('Failed to notify user of colors-refresh cooldown (interaction likely expired):', notifyError);
            }
            return true;
        }
        colorsRefreshCooldowns.set(interaction.user.id, now);

        await interaction.deferUpdate();
        const panelStartedAt = Date.now();
        const [source, subpageStr] = actionStr.replace('colors_refresh_', '').split('_');
        const subpage = parseInt(subpageStr, 10) || 0;
        const UserPreference = require('../models/UserPreference');
        const { getPalettePanelData } = require('../utils/colorPalette');
        const { buildColorPalettePanel } = require('../utils/colorPaletteView');

        let prefs = await UserPreference.findOne({ discordId: targetUserId });
        if (!prefs) prefs = new UserPreference({ discordId: targetUserId });

        // Snapshot the cache-only "before" state first, THEN force a real refresh -- comparing
        // the two is what lets the follow-up message honestly say whether anything actually
        // changed, rather than just claiming success unconditionally. Only the ACTIVE source is
        // re-extracted (the one whose swatches are on screen and that this Refresh button targets)
        // -- refreshing one page no longer needlessly re-extracts the other three sources.
        // `refreshStale: true` on the SECOND call only (2026-08-11 18:44 EDT, Harkirat's design):
        // besides force-re-extracting the source on screen, pick up any OTHER equipped source
        // whose image has genuinely changed since it was cached, and leave the untouched ones
        // alone. Passing it on the `before` snapshot too would defeat the whole comparison -- that
        // call exists precisely to read what was cached BEFORE anything was recomputed.
        const before = await getPalettePanelData(colorsInteraction, prefs, source, false, variant);
        const after = await getPalettePanelData(colorsInteraction, prefs, source, true, variant, true);
        const beforeVal = source === 'name' ? before.displayNameColors : before[source];
        const afterVal = source === 'name' ? after.displayNameColors : after[source];
        const changed = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);

        // Finish the job the button's NAME promises. The palettes above are re-extracted, but the
        // accent colour that tints every OTHER command's embeds lives in a separate cache with no
        // forceRefresh path of its own, so without this a user presses "Refresh Colors" and every
        // embed keeps its old tint. INVALIDATED rather than recomputed: an accent colour resolves
        // on the next accent-using command anyway, so clearing it guarantees a fresh value without
        // spending CPU inside a button press -- and costs nothing at all for a 'preset'-style user,
        // who never resolves one. Scoped to this user and to the sources actually refreshed.
        //
        // ⚠️ ONE CALL PER FIELD PAIR, because the sweep now covers BOTH views. invalidateAccentCache
        // clears the guild pair or the global pair from its boolean and deliberately never both (see
        // its own comment: the two pairs exist so moving between a server and a DM does not have
        // each context evict the other's colour). That contract is unchanged -- what changed is that
        // there are now genuinely two sets of refreshed sources to hand it.
        // ⚠️ The ACTIVE source uses `after.activeIsGuild`, NOT `variant === 'server'`, and that was a
        // real bug: a source with no server override resolves to the global image even in the server
        // view and caches under the GLOBAL field, so the old flag cleared the GUILD accent pair and
        // left the stale global one live. No error, and the symptom is an embed keeping its old tint.
        const { invalidateAccentCache } = require('../utils/accentColor');
        const refreshedAll = after.refreshedSources || [];
        const clearedAccents = [
            ...invalidateAccentCache(prefs, [...(after.activeIsGuild ? [] : [source]), ...refreshedAll.filter(r => !r.isGuild).map(r => r.kind)], false),
            ...invalidateAccentCache(prefs, [...(after.activeIsGuild ? [source] : []), ...refreshedAll.filter(r => r.isGuild).map(r => r.kind)], true)
        ];
        if (clearedAccents.length) await prefs.save();

        const isEphemeral = Boolean(interaction.message.flags?.bitfield & 64);
        const { components, files } = await buildColorPalettePanel({
            source,
            subpage,
            data: after,
            targetUserId,
            // ⚠️ `after`, NOT `data` -- this handler names its panel data `after` (it holds a
            // `before` too, for the change-detection message). The other three call sites use
            // `data`, so a blanket edit across all four lands a ReferenceError here and nowhere
            // else, which only shows up when someone actually clicks Refresh.
            avatarThumbnailUrl: after.avatarThumbnailUrl || colorsInteraction.user.displayAvatarURL({ extension: 'png', size: 256 }),
            variant
        });
        const { sendV2Payload } = require('../utils/sendV2Payload');
        await sendV2Payload(interaction, components, { flags: 32768 | (isEphemeral ? 64 : 0), allowedMentions: { users: [] }, files });
        // Instrumentation only, see models/RenderTiming.js. `cold: true` -- this handler always
        // does two real getPalettePanelData calls (before/after) plus a forced re-extraction, so
        // it's expected to be the slowest of the four panel actions.
        logRenderTiming({ area: 'colors_panel', action: 'refresh', source, subpage, variant, cold: true, durationMs: Date.now() - panelStartedAt, discordId: targetUserId, guildId: interaction.guildId });

        const { buildRefreshNotice } = require('../utils/colorPaletteView');
        // Other sources whose image had genuinely changed and were refreshed in passing. Reported
        // because the work is invisible otherwise -- the panel only ever renders ONE source, so a
        // silently-updated Banner would look like nothing happened until the user navigated there.
        // Wording, the per-view rows and the trailing-line rule all live in buildRefreshNotice --
        // see its own comment for the shape Harkirat picked and why the trailing line is exclusive.
        const resultMessage = buildRefreshNotice({
            source,
            // Which profile the PRESSED source actually resolved from -- not which view the panel
            // is in. Same distinction the accent invalidation above turns on.
            activeIsGuild: Boolean(after.activeIsGuild),
            changed,
            accentCleared: clearedAccents.length > 0,
            refreshed: refreshedAll
        });
        try {
            await interaction.followUp({ content: resultMessage, ephemeral: true });
        } catch (notifyError) {
            console.error('Failed to send colors-refresh result notice (interaction likely expired):', notifyError);
        }
        return true;
    }

    // Not a colors_* id this handler owns -- hand it back to the router, which still has its own
    // branches to try below the dispatch point. Pre-split, an unrecognised colors_* id fell through
    // exactly this way; returning true here instead would silently swallow it.
    return false;
}

module.exports = { handleColorsButton, OWNED_PREFIXES };
