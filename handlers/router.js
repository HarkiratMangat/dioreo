// ==========================================
// INTERACTION ROUTER
// ==========================================
// The single `interactionCreate` dispatcher, moved out of index.js on 2026-08-13 17:10 EDT so that file can be what an entrypoint is supposed to be: boot, wiring, login. Nothing about the routing itself changed in that move -- the sections below are the same ones index.js carried, in the same order, because that order is load-bearing (see .claude/rules/interaction-router.md).
//
// ⚠️ THE CRASH NET LIVES HERE NOW. handleInteraction keeps the one top-level try/catch that made an expired-token click (Discord 10062) a dead button rather than a dead bot. index.js registers this as the listener and still registers `client.on('error', ...)` -- BOTH are required, and neither substitutes for the other: discord.js constructs with captureRejections, which reroutes a rejected async listener into a client `error` event that bypasses this try/catch entirely. ⚠️ Any `return interaction.reply/editReply/followUp(...)` in an error branch MUST be awaited -- a bare `return <promise>` can reject after the try has exited and escape the net.
//
// `client` is deliberately NOT imported here. Every former `client.commands` read is now `interaction.client.commands` -- the same Collection, reached through the interaction that is already in hand, which is what lets this file be a pure module instead of depending on the entrypoint that requires it.
//
// WHAT IS LEFT HERE, AND WHY. This file is now the dispatcher and nothing else: the guards that must run before anything (visibility policy, anti-spam, /admin, the admin lock), the per-subsystem dispatch chain, and the two routes that are not custom_id-shaped and so have no subsystem to belong to -- autocomplete and the slash-command engine. Every button, select and modal branch lives in a handlers/*.js module.
//
// ⚠️ ORDER IS LOAD-BEARING ABOVE THE CHAIN, MEANINGLESS INSIDE IT. The guards run in a fixed order for real reasons (see each one's comment). The dispatch chain does not: the modules' prefixes are mutually exclusive, checked mechanically when they were extracted, so no two can claim the same id.

// (resolveThumbnail moved to handlers/manage.js with the bulk draw-save helpers that used it)
const { buildSyntheticInteraction, resolvePanelActor } = require("../utils/interactionContext");
const { runWithContext, getContext, hashUserId } = require("../utils/requestContext");
const { recordInteractionEvent, markOutcome, instrumentAck, instrumentAutocomplete } = require("../utils/eventStore");
const { cancelPanelExpiry } = require("../utils/passiveExpiry");
const { OWNED_PREFIXES: MANAGE_OWNED_PREFIXES } = require("./manage");

// LATE-BOUND (2026-08-20 11:47 EDT, hotpatch). These used to be captured once at require time, which meant
// deleting a handler's require.cache entry changed nothing -- the router kept calling the old
// function object. Resolving through require() at CALL time makes every handler hot-swappable, and
// it costs a Map lookup per interaction (require() on an already-cached module does not re-read
// disk). This is also what makes router.js a BOUNDARY rather than a closure member, so its
// interactionCooldowns Map survives a hotpatch untouched -- see utils/hotpatch.js's header.
//
// ⚠️ The list below IS the contract utils/hotpatch.js validates a reloaded handler against. Add a
// handler here and in the dispatch chain together; scripts/handlerRouting.test.js fails if the
// bindings and the files on disk disagree.
const HANDLER_BINDINGS = [
    ['colors', 'handleColorsButton'],
    ['manage', 'handleManageInteraction'],
    ['timestamp', 'handleTimestampInteraction'],
    ['help', 'handleHelpInteraction'],
    ['invite', 'handleInviteInteraction'],
    ['patchnotes', 'handlePatchnotesInteraction'],
    ['settings', 'handleSettingsInteraction'],
    ['loadouts', 'handleLoadoutsInteraction'],
    ['bot', 'handleBotInteraction'],
    ['autobuild', 'handleAutobuildInteraction'],
    ['drawprices', 'handleDrawpricesInteraction'],
    ['drawCalc', 'handleDrawCalcInteraction'],
    ['share', 'handleShareInteraction'],
    ['pagination', 'handlePaginationInteraction'],
    ['navigation', 'handleNavigationInteraction'],
];
const late = (mod, fn) => (...args) => {
    const impl = require(`./${mod}`)[fn];
    // A reloaded module that lost its export would otherwise fail as "impl is not a function" from
    // deep inside the dispatch chain, where it reads like a routing bug rather than a bad patch.
    if (typeof impl !== 'function') throw new Error(`handlers/${mod}.js no longer exports ${fn}() — hotpatch left it in a bad shape?`);
    return impl(...args);
};
const handleColorsButton = late('colors', 'handleColorsButton');
const handleManageInteraction = late('manage', 'handleManageInteraction');
const handleTimestampInteraction = late('timestamp', 'handleTimestampInteraction');
const handleHelpInteraction = late('help', 'handleHelpInteraction');
const handleInviteInteraction = late('invite', 'handleInviteInteraction');
const handlePatchnotesInteraction = late('patchnotes', 'handlePatchnotesInteraction');
const handleSettingsInteraction = late('settings', 'handleSettingsInteraction');
const handleLoadoutsInteraction = late('loadouts', 'handleLoadoutsInteraction');
const handleBotInteraction = late('bot', 'handleBotInteraction');
const handleAutobuildInteraction = late('autobuild', 'handleAutobuildInteraction');
const handleDrawpricesInteraction = late('drawprices', 'handleDrawpricesInteraction');
const handleDrawCalcInteraction = late('drawCalc', 'handleDrawCalcInteraction');
const handleShareInteraction = late('share', 'handleShareInteraction');
const handlePaginationInteraction = late('pagination', 'handlePaginationInteraction');
const handleNavigationInteraction = late('navigation', 'handleNavigationInteraction');

// ==========================================
// ROUTER-PRIVATE STATE
// ==========================================
// One Map, and it stays here on purpose: the anti-spam guard covers EVERY button and select in the bot, so it belongs to the dispatcher rather than to any one subsystem. The /manage stores that used to sit beside it moved into handlers/manage.js, which is their only reader.


// Light anti-spam guard (2026-07-13) -- buttons/selects go through a deferUpdate()+edit cycle that can take a moment (DB round-trips, Cloudinary lookups, etc.), so rapid double/triple-clicking one while the previous click is still processing can stack up racing edits. One entry per distinct user (last-accepted timestamp, not per-click), so this never meaningfully grows -- no TTL needed.
const interactionCooldowns = new Map(); // userId -> last accepted component-interaction timestamp
const INTERACTION_COOLDOWN_MS = 600;

// The "Refresh Colors" 10s cooldown (colorsRefreshCooldowns) used to sit here beside the generic guard above. It MOVED to handlers/colors.js on 2026-08-13 16:45 EDT with the rest of the colours slice -- it was only ever read by the colors_refresh_ branch, so it belongs to that module, not to the router. The generic guard above stays here: it covers every button/select bot-wide.


// ==========================================
// INTERACTION-CONTEXT ATTRIBUTION (2026-08-16 12:21 EDT, observability layer stage 1)
// ==========================================
// Established ONCE per interaction, wrapping the entire handler body below -- every console.* call anywhere downstream (any handler, any util, any await depth) inherits { interactionId, command, handler, userHash } automatically through utils/logger.js's patchConsole(). See docs/superpowers/specs/2026-08-16-observability-layer-design.md §4 and utils/requestContext.js's header for the full reasoning -- this is one edit instead of touching ~146 call sites.
//
// `command` is best-effort: the slash command name for a chat-input interaction, or the raw customId for a button/select/modal (still greppable, just not a "friendly" name -- the richer per-type schema belongs to stage 2's event plane, not this attribution-only stage).
//
// `handler` starts null and is filled in by markHandler() right before each dispatch call below, so a log line emitted from inside e.g. handlers/manage/*.js says "manage", not just the raw customId. It stays null for a guard that rejects the interaction before any subsystem ever gets it (anti-spam cooldown, the /manage admin-only lock) -- there is no handler to attribute those lines to. ⚠️ STAGE 2 (2026-08-16) ADDED THE MUTABLE HALF. Everything from `startedAt` down is written to by guards and dependency wrappers DURING the interaction and read once by the finally below. It lives on the same object for the same reason `handler` does: getContext() returns it by reference, so a guard eleven frames deep can report an outcome without threading a return value back up through every caller. None of it is logged by patchConsole -- utils/logger.js reads only the four stage-1 fields, which is deliberate: a log line wants attribution, not a timing accumulator.
function buildInteractionContext(interaction) {
    return {
        interactionId: interaction.id,
        command: interaction.commandName || interaction.customId || null,
        handler: null,
        userHash: hashUserId(interaction.user?.id),
        startedAt: Date.now(),
        outcome: null,     // set by the guards below and by the catch; first writer wins
        ackMs: null,       // stamped by instrumentAck() on the first defer/reply
        deps: null,        // aggregated per dependency name by noteDep()
        detail: null,      // subsystem fields via mergeDetail() -- absorbs the retired RenderTiming
    };
}

// Mutates the SAME context object runWithContext() is already running with (getContext() returns it by reference), so every console.* call made from inside the handler about to run sees the updated value -- setting it has to happen before the call, not after, or a log line from deep inside the handler would still read the stale value.
function markHandler(name) {
    const ctx = getContext();
    if (ctx) ctx.handler = name;
}

// The event is written in a FINALLY, so an interaction that threw still records -- those are the events most worth having. It sits out here rather than inside handleInteractionInner's own try because that function returns from ~20 different places; a finally at this level is the only spot that is genuinely unmissable. ⚠️ The raw Discord id is passed to recordInteractionEvent for ONE purpose: so the finished document can be SCRUBBED against it. It is never stored. See utils/eventStore.js's buildEventDocument().
async function handleInteraction(interaction) {
    const ctx = buildInteractionContext(interaction);
    return runWithContext(ctx, async () => {
        try {
            return await handleInteractionInner(interaction);
        } finally {
            recordInteractionEvent(interaction, ctx, interaction.user?.id);
        }
    });
}

async function handleInteractionInner(interaction) {
  try {

    // --- SERVER VISIBILITY POLICY (2026-08-10 15:48 EDT, v3) --- resolved ONCE here, before any routing, and attached as interaction.dioreoPolicy. It also clamps reply/deferReply/followUp on this interaction when the server has forced ephemeral, which is what makes the rule impossible for ANY command to bypass or forget -- applied here in the router rather than per-command precisely so a command module can't (accidentally or otherwise) skip it. See utils/guildPolicy.js for the precedence tiers and why nothing here refuses a command. No-ops outside a guild. Deliberately BEFORE the anti-spam guard: a swallowed click still returns below, and a policy resolved on every interaction (rather than only the ones that survive the cooldown) keeps the per-guild cache warm and the behaviour uniform.
    const { attachGuildPolicy } = require('../utils/guildPolicy');
    await attachGuildPolicy(interaction);

    // Deliberately AFTER attachGuildPolicy: that call replaces reply/deferReply/followUp with its ephemeral-forcing versions, so instrumenting first would wrap functions that get overwritten a line later. Wrapping second puts the measurement outside the clamp, and both still run.
    instrumentAck(interaction);

    // --- LIGHT ANTI-SPAM GUARD --- buttons/selects only (modal submits are a deliberate typed action, not spam-clickable; slash commands aren't rapid-fire the same way). A click inside the cooldown window is silently swallowed via a bare deferUpdate() -- acknowledges it so Discord doesn't show a "This interaction failed" toast, but doesn't route it anywhere.
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        const now = Date.now();
        const lastAccepted = interactionCooldowns.get(interaction.user.id) || 0;
        if (now - lastAccepted < INTERACTION_COOLDOWN_MS) {
            // The guard already existed; all it needed was to REPORT rather than only act. Without this the click leaves no trace anywhere -- no handler ran, nothing logged -- which is exactly the "dead click" the event plane exists to make countable.
            markOutcome('swallowed_by_cooldown');
            await interaction.deferUpdate().catch(() => {});
            return;
        }
        interactionCooldowns.set(interaction.user.id, now);
    }

    // --- /admin PANEL (2026-08-10 15:49 EDT, v3) --- every `admin_*` component routes to the one dispatcher in commands/admin.js, which owns its own server-admin gate. Deliberately NOT spread across this handler the way older panels are: the whole point of this feature is that exactly one place decides who may change a server's rules, and a second copy of that check living here is how the /manage panel ended up with ~25 handlers that each forgot it.
    if ((interaction.isButton() || interaction.isStringSelectMenu() || interaction.isChannelSelectMenu?.() || interaction.isRoleSelectMenu?.())
        && interaction.customId.startsWith('admin_')) {
        markHandler('admin');
        const adminCommand = interaction.client.commands.get('admin');
        if (adminCommand) return await adminCommand.handleComponent(interaction);
    }

    // --- MANAGE PANEL ADMIN-ONLY LOCK (2026-07-14) --- /manage's own slash-command execute() only ever checked ALLOWED_ADMIN_ID once, at the initial invocation (commands/manage.js) — none of the ~25 button/select/modal-submit handlers this panel spawns re-checked who was clicking, so anyone who could see the panel message (e.g. run non-ephemeral via the `hidden:false` option, or just present in the same channel) could press its buttons and mutate bot data. Rather than patch every individual handler, this is ONE centralized choke point covering every custom_id prefix /manage ever generates — self-maintaining as long as new manage actions keep using these same prefixes, which they always have. Deliberately scoped to ONLY these prefixes (not every button/select/modal bot-wide) so /settings, /colors, draws/calendar pagination, etc. stay completely unaffected. ⚠️ NO TYPE TEST HERE, DELIBERATELY (2026-08-14 09:59 EDT). This used to read `isButton() || isStringSelectMenu() || isModalSubmit()`, which is NARROWER than the `admin_` dispatcher fifteen lines above — that one also covers channel- and role-selects, and commands/admin.js mints both. Nothing was ungated, because /manage happens to use only those three types today; the day it grows a channel-select (picking an announcement channel, say) that component would have routed straight past this gate, silently. The prefix match below is what selects the guarded set, so the type list added no protection and only supplied a way to fall out of scope. `customId` is present on every component and modal interaction and absent on slash commands and autocomplete, which is exactly the boundary wanted.
    if (interaction.customId) {
        // ⚠️ EXPANDED 2026-08-13 from one blanket isAdmin() check to a PER-COMMAND gate -- this used to be a flat prefix LIST checked against isAdmin() alone, which meant someone granted access to only ONE admin command (say, /alerts) could still click every button on /manage's own panel, since every prefix shared the exact same check. Per-command permissions (utils/adminAccess.js's hasCommandAccess) are cosmetic on the slash command alone unless this shared choke point also enforces them per-prefix.
        const MANAGE_PREFIX_COMMAND = {
            'mng_': 'manage', 'modal_': 'manage', 'add_loadout_': 'manage', 'edit_loadout_': 'manage',
            'edit_calendar_': 'manage', 'edit_draw_': 'manage', 'add_draw_': 'manage',
            'autobuild_': 'autobuild', // /autobuild's review-card buttons + edit modal (2026-07-19)
            'bot_': 'bot' // /bot analytics+access panel buttons/selects/modals (2026-08-16, observability
                          // stage 3 -- replaces the retired alerts_/audit_ prefixes, which mapped to the now-retired /alerts and /audit commands)
        };
        const matchedPrefix = Object.keys(MANAGE_PREFIX_COMMAND).find(prefix => interaction.customId.startsWith(prefix));
        if (matchedPrefix) {
            const { hasCommandAccess } = require('../utils/adminAccess');
            if (!(await hasCommandAccess(interaction.user.id, MANAGE_PREFIX_COMMAND[matchedPrefix]))) {
                // Reworded 2026-07-18 (v2 quick-wins batch) -- clearer about what's actually going on (this is Dior's own admin panel, not a permissions bug) and points at what to do instead, per Harkirat's "easier to understand, some humor, actually useful" request. This is /manage's own admin-only lock -- unlike the per-user panel locks below, there's no "someone else's panel" concept here to admin-override; only ALLOWED_ADMIN_ID was ever meant to pass this one.
                markOutcome('rejected_admin');
                try {
                    await interaction.reply({ content: "🔒 **This one's admin-only.** These buttons run Dioreo's database directly — try any of the bot's public commands instead!", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked manage-panel action (interaction likely expired):', notifyError);
                }
                return;
            }
        }
    }

        // PASSIVE EXPIRY SAFETY NET -- PENDING REMOVAL, KEPT AS A BELT-AND-SUSPENDERS MARGIN (added 2026-08-14 11:05 EDT; its original justification retired 2026-08-14 17:17 EDT). ⚠️ The paragraph this replaced described /manage's confirm/cancel/undo prompts as raw, uninstrumented `interaction.update()` calls -- that is no longer true. Stage 2 of docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md moved handlers/manage.js into handlers/manage/ and replaced every one of those ~25 call sites with handlers/manage/shared.js's `prompt()` helper, which routes through sendV2Payload the same as every other panel render in the bot -- so those prompts now get real passive-expiry scheduling of their own, and this cancel-only block is no longer covering a real gap. **NOT YET DELETED**, on purpose: the design doc's own instruction was to verify the swap on the dev bot before removing this net, and that live click-test is still owed (Harkirat, 2026-08-14 17:15 EDT: "i'm not available to click-test at the moment so that part needs to be deferred") -- see docs/db-deferred-list.md's LIVE CLICK-TEST OWED entry. Until that click-test happens, cancelling here is provably harmless (a cancelled timer that a moment later gets rescheduled by the new V2 render, same as it always did for /alerts/ /autobuild below) rather than load-bearing, so leaving it costs nothing while removing it unverified would violate the very caution the design doc wrote in for this step. Delete this whole block (and update this comment's cross-references) once that click-test confirms the V2-rendered prompts behave correctly.
        if (interaction.message?.id && MANAGE_OWNED_PREFIXES.some(p => interaction.customId?.startsWith(p))) {
            cancelPanelExpiry(interaction.message.id);
        }

        // --- /manage PANEL (2026-08-13 17:40 EDT) --- every branch this panel mints lives in handlers/manage.js. Dispatched HERE, immediately after the permission guard above and before any other routing, because every /manage custom_id is uniquely prefixed: no branch below could ever match one, so consulting the panel first changes nothing about which handler wins. It must stay BELOW the guard -- that check is what decides who may click.
        markHandler('manage');
        if (await handleManageInteraction(interaction)) return;

        // --- PER-SUBSYSTEM HANDLERS (2026-08-13 17:45 EDT) --- each module owns a set of custom_id prefixes and answers TRUE once it has handled the interaction. The prefixes are mutually exclusive and were checked to be so mechanically at extraction time, so the ORDER of this chain carries no meaning -- unlike the guards above it, which are strictly ordered. Every call is AWAITED inside this handler's one try/catch, which is what keeps the crash net over all of them. Colours is last only because it predates the others.
        markHandler('timestamp');
        if (await handleTimestampInteraction(interaction)) return;
        markHandler('help');
        if (await handleHelpInteraction(interaction)) return;
        markHandler('invite');
        if (await handleInviteInteraction(interaction)) return;
        markHandler('patchnotes');
        if (await handlePatchnotesInteraction(interaction)) return;
        markHandler('settings');
        if (await handleSettingsInteraction(interaction)) return;
        markHandler('loadouts');
        if (await handleLoadoutsInteraction(interaction)) return;
        markHandler('bot');
        if (await handleBotInteraction(interaction)) return;
        markHandler('autobuild');
        if (await handleAutobuildInteraction(interaction)) return;
        markHandler('drawprices');
        if (await handleDrawpricesInteraction(interaction)) return;
        markHandler('drawCalc');
        if (await handleDrawCalcInteraction(interaction)) return;
        markHandler('share');
        if (await handleShareInteraction(interaction)) return;
        markHandler('pagination');
        if (await handlePaginationInteraction(interaction)) return;
        markHandler('navigation');
        if (await handleNavigationInteraction(interaction)) return;
        markHandler('colors');
        if (await handleColorsButton(interaction)) return;

        // Nothing in the button/select chain above consumed this interaction (v3-pre-release review, finding #30) -- markHandler('colors') was the last name set purely because colors happens to be checked last, and left uncleared it misattributed a genuinely dead click (a stale button from an earlier deploy, say) to a subsystem that never touched it. Reset so recordInteractionEvent's finally sees the honest "nothing claimed this" value this file's own contract documents. Must stay AFTER every markHandler(name) call above, never before -- those still need to fire pre-call so in-handler log lines see the right name.
        markHandler(null);

    // ==========================================
    // --- DATABASE AUTOCOMPLETE ROUTE ---
    // ==========================================
    // Intercepts typing inside search string options to offer live autocomplete choices directly from the MongoDB clusters before the user even presses enter.
    if (interaction.isAutocomplete()) {
        markHandler('autocomplete');
        // Discord fires one of these per KEYSTROKE. This does not emit an event -- it opens (or extends) a debounced search session that flushes ONE row when typing stops, and patches respond() so the result count comes along for free. One call here covers every autocomplete route in the bot. See utils/eventStore.js's autocomplete section.
        instrumentAutocomplete(interaction);
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const commandName = interaction.commandName;
        // NOTE (fixed during review): every autocomplete site below used a plain `.includes()` (or an equivalent raw Mongo $regex), which requires the query to appear as a literal, contiguous substring of the stored name -- so typing "dlq" never matched "DL Q33", since the space between "DL" and "Q33" breaks that literal sequence. fuzzyMatch() strips spaces/punctuation from both sides first, so this now matches. Applied consistently across every autocomplete route in the bot, not just one.
        const { fuzzyMatch, findWeaponMatches } = require('../utils/search');

        try {
            // NOTE (removed 2026-07-09): /manage used to have its own autocomplete route here, for its search options (draws/loadouts/calendar/patchnotes edit/delete autocomplete). That entire subcommand-group/option structure was replaced by the button+modal panel (see manage.js) -- Edit/Delete now collect their search query through a one-field modal instead of a slash-command autocomplete option, resolved in handlers/manage.js's `mng_search_` modal-submit handler. Nothing on /manage triggers autocomplete anymore.

            // === USER FRONT-END AUTOCOMPLETE (/all, /dmz, /patch) === Required because we changed the base command name to 'patch' for subcommands
            if (commandName === 'patch') {
                const SeasonalData = require('../models/SeasonalData');
                const { displayTitle } = require('../commands/patchnotes');
                const doc = await SeasonalData.findOne({ docType: 'global' }).lean(); // read-only here
                if (!doc || !doc.patchNotes) return await interaction.respond([]);

                // displayTitle() strips the legacy "Balance Changes for..." prefix AND prefers a manual titleOverride (2026-07-24), same as the main render + history dropdown, so this stays consistent with what's actually shown everywhere else.
                const filtered = doc.patchNotes
                    .filter(p => fuzzyMatch(focusedValue, displayTitle(p)))
                    .slice(0, 25);

                return await interaction.respond(filtered.map(p => ({ name: displayTitle(p), value: p._id.toString() })));
            }

            // === ROUTE B2: /help's cmd: option -- suggests every real command, including the live per-category Gunsmiths commands (/ar, /lmg, etc.), not just the static entries ===
            if (commandName === 'help') {
                const { suggestHelpCommandNames } = require('../commands/help');
                // Restricted entries (/admin for server admins, /manage//alerts//autobuild for the bot's own whitelist) are suggested only to someone who could use them -- see commands/help.js's note on filtering all surfaces, not just the visible menu.
                const { isServerAdmin } = require('../utils/guildPolicy');
                const { isAdmin, hasCommandAccess } = require('../utils/adminAccess');
                // suggestHelpCommandNames also matches on alias keywords (e.g. "server" -> /admin, "database" -> /manage) -- see commands/help.js's COMMAND_ALIASES.
                const filtered = await suggestHelpCommandNames(focusedValue, {
                    serverAdmin: isServerAdmin(interaction),
                    botAdmin: await isAdmin(interaction.user.id),
                    manage: await hasCommandAccess(interaction.user.id, 'manage'),
                    bot: await hasCommandAccess(interaction.user.id, 'bot'),
                    autobuild: await hasCommandAccess(interaction.user.id, 'autobuild'),
                });
                return await interaction.respond(filtered.map(name => ({ name, value: name })));
            }

            // === ROUTE B3 (stage 3, 2026-08-14 18:05 EDT): /manage's action: option -- scoped by the sibling content option (renamed from `data_for` 2026-08-15 13:27 EDT), since Discord cannot scope one option's static choices by another option's live value (the whole reason this is autocomplete, not a `choices()` list -- see the registry's comment in utils/manageActions.js). NOTE (removed 2026-07-09, re-added here for a different reason): /manage's old autocomplete route was for search-by-name (draws/loadouts/ calendar/patchnotes edit/delete), replaced by the one-field search modal and never coming back. This route only ever suggests ACTION IDS off the registry, never touches a collection. ===
            if (commandName === 'manage') {
                const page = interaction.options.getString('content');
                if (!page) return await interaction.respond([]); // description tells the user to pick a page first
                // Same admin gate execute() itself opens with, checked here too so a non-admin (or an admin scoped away from this page) never even sees the action names -- an autocomplete interaction carries no customId, so the router's prefix guard doesn't cover this route the way it covers buttons/selects/modals.
                const { hasCommandAccess, getManagePages } = require('../utils/adminAccess');
                if (!(await hasCommandAccess(interaction.user.id, 'manage'))) return await interaction.respond([]);
                const allowedPages = await getManagePages(interaction.user.id);
                if (!allowedPages.includes(page)) return await interaction.respond([]);
                const { listSlashActions } = require('../utils/manageActions');
                const filtered = listSlashActions(page)
                    .filter(a => fuzzyMatch(focusedValue, a.label))
                    .slice(0, 25); // Hard Discord API limit -- defensive even though no page is close today
                return await interaction.respond(filtered.map(a => ({ name: a.label, value: a.id })));
            }

            // Standard Loadout Dictionary Autocomplete Mapping (/dmz, /gunsmiths search)
            const Loadout = require('../models/Loadout');
            let queryFilter = {};

            if (commandName === 'dmz') {
                queryFilter.mode = 'DMZ';
            } else if (commandName === 'gunsmiths') {
                // `list` uses static choices (injected at registration by bot/registry.js's applyGunsmithsScopeChoices) and must never reach here -- only `search` autocompletes.
                if (interaction.options.getSubcommand() !== 'search') return await interaction.respond([]);
                queryFilter.mode = 'MP';
            } else {
                return await interaction.respond([]);
            }

            const matchingWeapons = await Loadout.find(queryFilter).select('weaponName weaponKey category').lean();
            const uniqueMap = new Map();
            matchingWeapons.forEach(w => uniqueMap.set(w.weaponKey, w));
            const distinctChoices = Array.from(uniqueMap.values());

            // BUG FIX (2026-07-12, found live): this list had no sort at all -- Mongo returns docs in natural/insertion order, so whichever weapon happened to be migrated/added FIRST (LOCUS, from the original builds.xlsx migration) always showed up first regardless of category or alphabetical order. Originally sorted by a hand-confirmed CATEGORY_SORT_ORDER list (AR/SMG/LMG only, pending Harkirat confirming the rest); per his 2026-07-12 follow-up request, dropped that in favor of just sorting category alphabetically too, then weapon name alphabetically within each category. Only affects display order -- doesn't change which weapons match the typed query.
            distinctChoices.sort((a, b) => {
                if (a.category !== b.category) return a.category.localeCompare(b.category);
                return a.weaponName.localeCompare(b.weaponName);
            });

            const { displayCategoryLabel } = require('../utils/loadoutRender');

            // /gunsmiths search gets "sticky" category rows ahead of weapon matches -- WE author every slot on every keystroke (Discord has no real pinning). Filtered by the same fuzzyMatch as weapons, so a typed "ak" spends all 25 slots on weapons and an empty box shows all seven categories -- the discovery surface that replaces losing /smg. `~` can never appear in a weaponKey (checked against all 70), so the `~cat~` sentinel this produces cannot collide with a real weapon value.
            if (commandName === 'gunsmiths') {
                const categoryCounts = new Map();
                for (const w of distinctChoices) categoryCounts.set(w.category, (categoryCounts.get(w.category) || 0) + 1);
                // Fixed per-list budgets, not a cap on the concatenated union (v3-pre-release review, finding #26) -- catRows is unfiltered when focusedValue is falsy, so the old union-then-slice(0,25) let categories crowd out every weapon slot once enough categories exist (7 today -> 18 weapon slots left; each new DB category takes another), and a short query fuzzy-matching several category names could push the intended weapon off the list entirely.
                const CATEGORY_BUDGET = 5;
                const catRows = Array.from(categoryCounts.keys())
                    .sort()
                    .filter(c => !focusedValue || fuzzyMatch(focusedValue, c))
                    .slice(0, CATEGORY_BUDGET)
                    .map(c => ({ name: `▸ All ${displayCategoryLabel(c)} builds (${categoryCounts.get(c)} weapons)`, value: `~cat~${c}` }));
                const weaponRows = findWeaponMatches(focusedValue, distinctChoices)
                    .slice(0, 25 - catRows.length)
                    .map(w => ({ name: `[${displayCategoryLabel(w.category)}] ${w.weaponName}`, value: w.weaponKey }));
                return await interaction.respond([...catRows, ...weaponRows]);
            }

            // /dmz: unchanged -- plain weapon names, no category prefix (that's gunsmiths-only, and /dmz has no per-category split -- see models/Loadout.js on categoryRank/DMZ). findWeaponMatches (2026-07-18) also expands recognized category synonyms (e.g. "pistol"/"smg"/"assault rifle") so typing a weapon-class term surfaces every weapon in that category, not just weapons whose own name happens to contain that word -- see utils/search.js's own comment for the full reasoning + the synonym list.
            const filteredChoices = findWeaponMatches(focusedValue, distinctChoices)
                .slice(0, 25); // Hard Discord API limit of 25 choices maximum
            return await interaction.respond(filteredChoices.map(w => ({ name: w.weaponName, value: w.weaponKey })));

        } catch (error) {
            console.error('Autocomplete Error:', error);
            return await interaction.respond([]);
        }
    }

    // ==========================================
    // --- SLASH COMMAND ROUTE ENGINE ---
    // ==========================================
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // Query modular internal command collections first (Checks the /commands folder)
        const command = interaction.client.commands.get(commandName);
        if (command) {
            markHandler(commandName);
            try {
                await command.execute(interaction);
                // Fires AFTER the command's own reply has already gone out, once per fresh top-level command invocation -- see utils/announcement.js's header for why this is the only choke point (never buttons/selects/modals) and why the dynamic MP loadout fallback below needs its own identical call. Wrapped in its OWN try/catch, separate from the command's own -- a DB hiccup in here must never fall into the outer catch below and overwrite the command's already-successful reply with "There was an error executing this command!".
                try {
                    const { maybeSendAnnouncement } = require('../utils/announcement');
                    await maybeSendAnnouncement(interaction);
                } catch (announcementError) {
                    console.error('Failed to check/deliver announcement after a successful command:', announcementError);
                }
                return;
            } catch (error) {
                console.error(`Error executing modular slash command ${commandName}:`, error);
                // NOTE (fixed during review): this used to `return interaction.reply(...)` unawaited. A `return <promise>` inside a try block exits the try/catch synchronously -- if that returned promise rejects later (e.g. the interaction token is ALSO already expired, which is exactly what happens after a 10062 on the original deferReply), nothing is listening for it anymore, not even the outer try/catch around this whole handler. That turned into a raw unhandled promise rejection and crashed the entire Node process (seen on Railway: 10062 Unknown interaction -> fallback reply -> 40060 already acknowledged -> process exit). Awaiting + catching here keeps a doubly-failed fallback reply from ever being able to crash the bot.
                try {
                    if (interaction.deferred || interaction.replied) {
                        await interaction.editReply({ content: 'There was an error executing this command!' });
                    } else {
                        await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
                    }
                } catch (notifyError) {
                    console.error(`Failed to notify user of command error for ${commandName} (interaction likely expired):`, notifyError);
                }
                return;
            }
        }

    }

    // ==========================================
    // COMPONENT INTERACTIONS (buttons · selects · modal submits)
    // ==========================================
    // Handled entirely by the per-subsystem dispatch chain above. The three separate `isStringSelectMenu()` / `isButton()` / `isModalSubmit()` blocks that used to live here are gone: every branch they held now lives in a handlers/*.js module, and each module checks the interaction TYPE itself where that still matters. ⚠️ That type check is not ceremony. `mpbrowse` was once written inside the isButton() block when it is a SELECT, and the branch was simply dead -- no error, no log, just a timed-out interaction. If you add a branch to a handler, make sure it sits under the right type.
  } catch (err) {
    // Any uncaught rejection in this handler (e.g. a button/select interaction whose token already expired -- Discord error 10062 "Unknown interaction") used to bubble up as an unhandled 'error' event and crash the entire process, taking the bot offline until a manual restart. Discord interaction tokens are only valid for a few seconds/minutes, so this is expected to happen occasionally under normal use, not just as a bug symptom -- log it and keep the bot alive instead of crashing.
    markOutcome('error');
    console.error('Unhandled error in interactionCreate:', err);
  }
}

module.exports = { handleInteraction, HANDLER_BINDINGS };
