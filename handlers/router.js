// ==========================================
// INTERACTION ROUTER
// ==========================================
// The single `interactionCreate` dispatcher, moved out of index.js on 2026-08-13 17:10 EDT so that
// file can be what an entrypoint is supposed to be: boot, wiring, login. Nothing about the routing
// itself changed in that move -- the STEP 6.x sections below are the same ones index.js carried, in
// the same order, because that order is load-bearing (see .claude/rules/interaction-router.md).
//
// ⚠️ THE CRASH NET LIVES HERE NOW. handleInteraction keeps the one top-level try/catch that made an
// expired-token click (Discord 10062) a dead button rather than a dead bot. index.js registers this
// as the listener and still registers `client.on('error', ...)` -- BOTH are required, and neither
// substitutes for the other: discord.js constructs with captureRejections, which reroutes a rejected
// async listener into a client `error` event that bypasses this try/catch entirely.
// ⚠️ Any `return interaction.reply/editReply/followUp(...)` in an error branch MUST be awaited --
// a bare `return <promise>` can reject after the try has exited and escape the net.
//
// `client` is deliberately NOT imported here. Every former `client.commands` read is now
// `interaction.client.commands` -- the same Collection, reached through the interaction that is
// already in hand, which is what lets this file be a pure module instead of depending on the
// entrypoint that requires it.
//
// PER-SUBSYSTEM HANDLERS: colours already lives in ./colors.js and is dispatched below; the rest of
// the subsystems are being lifted out of this file one at a time. See docs/ROADMAP.md.

// (resolveThumbnail moved to handlers/manage.js with the bulk draw-save helpers that used it)
const { buildSyntheticInteraction, resolvePanelActor } = require("../utils/interactionContext");
const { handleColorsButton } = require("./colors");
const { handleManageInteraction } = require("./manage");

// ==========================================
// ROUTER-PRIVATE HELPERS & SHORT-LIVED STORES
// ==========================================
// Used ONLY by the routing below -- verified against every use site before the move: the /manage
// panel's undo + pending-confirmation stores, its id parsing and search resolution, the bulk upsert
// helpers, the draw-thumbnail resolution shared by the bulk save routes, and the anti-spam cooldown.


// Light anti-spam guard (2026-07-13) -- buttons/selects go through a deferUpdate()+edit cycle that
// can take a moment (DB round-trips, Cloudinary lookups, etc.), so rapid double/triple-clicking one
// while the previous click is still processing can stack up racing edits. One entry per distinct
// user (last-accepted timestamp, not per-click), so this never meaningfully grows -- no TTL needed.
const interactionCooldowns = new Map(); // userId -> last accepted component-interaction timestamp
const INTERACTION_COOLDOWN_MS = 600;

// The "Refresh Colors" 10s cooldown (colorsRefreshCooldowns) used to sit here beside the generic
// guard above. It MOVED to handlers/colors.js on 2026-08-13 16:45 EDT with the rest of the colours
// slice -- it was only ever read by the colors_refresh_ branch, so it belongs to that module, not to
// the router. The generic guard above stays here: it covers every button/select bot-wide.


// ==========================================
// PHASE 6: INTERACTION SYSTEM OVERSEER (ROUTING)
// ==========================================
async function handleInteraction(interaction) {
  try {

    // --- SERVER VISIBILITY POLICY (2026-08-10 15:48 EDT, v3) --- resolved ONCE here, before any
    // routing, and attached as interaction.dioreoPolicy. It also clamps reply/deferReply/followUp on
    // this interaction when the server has forced ephemeral, which is what makes the rule impossible
    // for a command to bypass or forget -- including the eight weapon commands built above, which no
    // sweep of commands/*.js would ever reach. See utils/guildPolicy.js for the precedence tiers and
    // why nothing here refuses a command. No-ops outside a guild.
    // Deliberately BEFORE the anti-spam guard: a swallowed click still returns below, and a policy
    // resolved on every interaction (rather than only the ones that survive the cooldown) keeps the
    // per-guild cache warm and the behaviour uniform.
    const { attachGuildPolicy } = require('../utils/guildPolicy');
    await attachGuildPolicy(interaction);

    // --- LIGHT ANTI-SPAM GUARD --- buttons/selects only (modal submits are a deliberate typed
    // action, not spam-clickable; slash commands aren't rapid-fire the same way). A click inside
    // the cooldown window is silently swallowed via a bare deferUpdate() -- acknowledges it so
    // Discord doesn't show a "This interaction failed" toast, but doesn't route it anywhere.
    if (interaction.isButton() || interaction.isStringSelectMenu()) {
        const now = Date.now();
        const lastAccepted = interactionCooldowns.get(interaction.user.id) || 0;
        if (now - lastAccepted < INTERACTION_COOLDOWN_MS) {
            await interaction.deferUpdate().catch(() => {});
            return;
        }
        interactionCooldowns.set(interaction.user.id, now);
    }

    // --- /server PANEL (2026-08-10 15:49 EDT, v3) --- every `server_*` component routes to the one
    // dispatcher in commands/server.js, which owns its own server-admin gate. Deliberately NOT
    // spread across this handler the way older panels are: the whole point of this feature is that
    // exactly one place decides who may change a server's rules, and a second copy of that check
    // living here is how the /manage panel ended up with ~25 handlers that each forgot it.
    if ((interaction.isButton() || interaction.isStringSelectMenu() || interaction.isChannelSelectMenu?.() || interaction.isRoleSelectMenu?.())
        && interaction.customId.startsWith('server_')) {
        const serverCommand = interaction.client.commands.get('server');
        if (serverCommand) return await serverCommand.handleComponent(interaction);
    }

    // --- MANAGE PANEL ADMIN-ONLY LOCK (2026-07-14) --- /manage's own slash-command execute() only
    // ever checked ALLOWED_ADMIN_ID once, at the initial invocation (commands/manage.js) — none of
    // the ~25 button/select/modal-submit handlers this panel spawns re-checked who was clicking, so
    // anyone who could see the panel message (e.g. run non-ephemeral via the `hidden:false` option,
    // or just present in the same channel) could press its buttons and mutate bot data. Rather than
    // patch every individual handler, this is ONE centralized choke point covering every custom_id
    // prefix /manage ever generates — self-maintaining as long as new manage actions keep using
    // these same prefixes, which they always have. Deliberately scoped to ONLY these prefixes (not
    // every button/select/modal bot-wide) so /settings, /colors, draws/calendar pagination, etc.
    // stay completely unaffected.
    if ((interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) && interaction.customId) {
        // ⚠️ EXPANDED 2026-08-13 from one blanket isAdmin() check to a PER-COMMAND gate -- this used
        // to be a flat prefix LIST checked against isAdmin() alone, which meant someone granted
        // access to only ONE admin command (say, /alerts) could still click every button on
        // /manage's own panel, since every prefix shared the exact same check. Per-command
        // permissions (utils/adminAccess.js's hasCommandAccess) are cosmetic on the slash command
        // alone unless this shared choke point also enforces them per-prefix.
        const MANAGE_PREFIX_COMMAND = {
            'mng_': 'manage', 'modal_': 'manage', 'add_loadout_': 'manage', 'edit_loadout_': 'manage',
            'edit_calendar_': 'manage', 'edit_draw_': 'manage', 'add_draw_': 'manage',
            'autobuild_': 'autobuild', // /autobuild's review-card buttons + edit modal (2026-07-19)
            'alerts_': 'alerts' // /alerts panel buttons (export/explain/back/page) (2026-07-20)
        };
        const matchedPrefix = Object.keys(MANAGE_PREFIX_COMMAND).find(prefix => interaction.customId.startsWith(prefix));
        if (matchedPrefix) {
            const { hasCommandAccess } = require('../utils/adminAccess');
            if (!(await hasCommandAccess(interaction.user.id, MANAGE_PREFIX_COMMAND[matchedPrefix]))) {
                // Reworded 2026-07-18 (v2 quick-wins batch) -- clearer about what's actually going
                // on (this is Dior's own admin panel, not a permissions bug) and points at what to
                // do instead, per Harkirat's "easier to understand, some humor, actually useful"
                // request. This is /manage's own admin-only lock -- unlike the per-user panel locks
                // below, there's no "someone else's panel" concept here to admin-override; only
                // ALLOWED_ADMIN_ID was ever meant to pass this one.
                try {
                    await interaction.reply({ content: "🔒 **This one's admin-only.** These buttons run Dioreo's database directly — try any of the bot's public commands instead!", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked manage-panel action (interaction likely expired):', notifyError);
                }
                return;
            }
        }
    }

        // --- /manage PANEL (2026-08-13 17:40 EDT) --- every branch this panel mints lives in
        // handlers/manage.js. Dispatched HERE, immediately after the permission guard above and
        // before any other routing, because every /manage custom_id is uniquely prefixed: no branch
        // below could ever match one, so consulting the panel first changes nothing about which
        // handler wins. It must stay BELOW the guard -- that check is what decides who may click.
        if (await handleManageInteraction(interaction)) return;


    // ==========================================
    // --- STEP 6.1: DATABASE AUTOCOMPLETE ROUTE ---
    // ==========================================
    // Intercepts typing inside search string options to offer live autocomplete choices
    // directly from the MongoDB clusters before the user even presses enter.
    if (interaction.isAutocomplete()) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const commandName = interaction.commandName;
        // NOTE (fixed during review): every autocomplete site below used a plain `.includes()` (or
        // an equivalent raw Mongo $regex), which requires the query to appear as a literal,
        // contiguous substring of the stored name -- so typing "dlq" never matched "DL Q33", since
        // the space between "DL" and "Q33" breaks that literal sequence. fuzzyMatch() strips
        // spaces/punctuation from both sides first, so this now matches. Applied consistently
        // across every autocomplete route in the bot, not just one.
        const { fuzzyMatch, findWeaponMatches } = require('../utils/search');

        try {
            // NOTE (removed 2026-07-09): /manage used to have a "ROUTE A" here for its search
            // options (draws/loadouts/calendar/patchnotes edit/delete autocomplete). That entire
            // subcommand-group/option structure was replaced by the button+modal panel (see
            // manage.js) -- Edit/Delete now collect their search query through a one-field modal
            // instead of a slash-command autocomplete option, resolved in index.js's `mng_search_`
            // modal-submit handler. Nothing on /manage triggers autocomplete anymore.

            // === ROUTE B: USER FRONT-END AUTOCOMPLETE (/all, /dmz, /patch) ===
            // Required because we changed the base command name to 'patch' for subcommands
            if (commandName === 'patch') {
                const SeasonalData = require('../models/SeasonalData');
                const { displayTitle } = require('../commands/patchnotes');
                const doc = await SeasonalData.findOne({ docType: 'global' }).lean(); // read-only here
                if (!doc || !doc.patchNotes) return await interaction.respond([]);

                // displayTitle() strips the legacy "Balance Changes for..." prefix AND prefers a
                // manual titleOverride (2026-07-24), same as the main render + history dropdown, so
                // this stays consistent with what's actually shown everywhere else.
                const filtered = doc.patchNotes
                    .filter(p => fuzzyMatch(focusedValue, displayTitle(p)))
                    .slice(0, 25);

                return await interaction.respond(filtered.map(p => ({ name: displayTitle(p), value: p._id.toString() })));
            }

            // === ROUTE B2: /help's cmd: option -- suggests every real command, including the live
            // per-category Gunsmiths commands (/ar, /lmg, etc.), not just the static entries ===
            if (commandName === 'help') {
                const { getAllHelpCommandNames } = require('../commands/help');
                // Restricted entries (/server for server admins, /manage//alerts//autobuild for the
                // bot's own whitelist) are suggested only to someone who could use them -- see
                // commands/help.js's note on filtering all surfaces, not just the visible menu.
                const { isServerAdmin } = require('../utils/guildPolicy');
                const { isAdmin, hasCommandAccess } = require('../utils/adminAccess');
                const allCommands = await getAllHelpCommandNames({
                    serverAdmin: isServerAdmin(interaction),
                    botAdmin: await isAdmin(interaction.user.id),
                    manage: await hasCommandAccess(interaction.user.id, 'manage'),
                    alerts: await hasCommandAccess(interaction.user.id, 'alerts'),
                    autobuild: await hasCommandAccess(interaction.user.id, 'autobuild'),
                });
                const filtered = allCommands.filter(name => fuzzyMatch(focusedValue, name)).slice(0, 25);
                return await interaction.respond(filtered.map(name => ({ name, value: name })));
            }

            // Standard Loadout Dictionary Autocomplete Mapping
            const Loadout = require('../models/Loadout');
            let queryFilter = {};

            if (commandName === 'dmz') queryFilter.mode = 'DMZ';
            else if (commandName !== 'all') {
                queryFilter.category = commandName.toUpperCase();
                queryFilter.mode = 'MP';
            } else queryFilter.mode = 'MP';

            const matchingWeapons = await Loadout.find(queryFilter).select('weaponName weaponKey category').lean();
            const uniqueMap = new Map();
            matchingWeapons.forEach(w => uniqueMap.set(w.weaponKey, w));
            const distinctChoices = Array.from(uniqueMap.values());

            // BUG FIX (2026-07-12, found live): this list had no sort at all -- Mongo returns docs
            // in natural/insertion order, so whichever weapon happened to be migrated/added FIRST
            // (LOCUS, from the original builds.xlsx migration) always showed up first regardless of
            // category or alphabetical order. Originally sorted by a hand-confirmed CATEGORY_SORT_ORDER
            // list (AR/SMG/LMG only, pending Harkirat confirming the rest); per his 2026-07-12
            // follow-up request, dropped that in favor of just sorting category alphabetically too,
            // then weapon name alphabetically within each category. Only affects display order --
            // doesn't change which weapons match the typed query.
            distinctChoices.sort((a, b) => {
                if (a.category !== b.category) return a.category.localeCompare(b.category);
                return a.weaponName.localeCompare(b.weaponName);
            });

            // findWeaponMatches (2026-07-18) also expands recognized category synonyms (e.g.
            // "pistol"/"smg"/"assault rifle") so typing a weapon-class term surfaces every weapon
            // in that category, not just weapons whose own name happens to contain that word --
            // see utils/search.js's own comment for the full reasoning + the synonym list.
            const filteredChoices = findWeaponMatches(focusedValue, distinctChoices)
                .slice(0, 25); // Hard Discord API limit of 25 choices maximum

            const { displayCategoryLabel } = require('../utils/loadoutRender');
            return await interaction.respond(filteredChoices.map(w => ({
                name: commandName === 'all' ? `[${displayCategoryLabel(w.category)}] ${w.weaponName}` : w.weaponName,
                value: w.weaponKey
            })));

        } catch (error) {
            console.error('Autocomplete Error:', error);
            return await interaction.respond([]);
        }
    }

    // ==========================================
    // --- STEP 6.2: SLASH COMMAND ROUTE ENGINE ---
    // ==========================================
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        // Query modular internal command collections first (Checks the /commands folder)
        const command = interaction.client.commands.get(commandName);
        if (command) {
            try {
                await command.execute(interaction);
                // Fires AFTER the command's own reply has already gone out, once per fresh
                // top-level command invocation -- see utils/announcement.js's header for why this
                // is the only choke point (never buttons/selects/modals) and why the dynamic MP
                // loadout fallback below needs its own identical call. Wrapped in its OWN try/catch,
                // separate from the command's own -- a DB hiccup in here must never fall into the
                // outer catch below and overwrite the command's already-successful reply with
                // "There was an error executing this command!".
                try {
                    const { maybeSendAnnouncement } = require('../utils/announcement');
                    await maybeSendAnnouncement(interaction);
                } catch (announcementError) {
                    console.error('Failed to check/deliver announcement after a successful command:', announcementError);
                }
                return;
            } catch (error) {
                console.error(`Error executing modular slash command ${commandName}:`, error);
                // NOTE (fixed during review): this used to `return interaction.reply(...)` unawaited.
                // A `return <promise>` inside a try block exits the try/catch synchronously -- if that
                // returned promise rejects later (e.g. the interaction token is ALSO already expired,
                // which is exactly what happens after a 10062 on the original deferReply), nothing is
                // listening for it anymore, not even the outer try/catch around this whole handler. That
                // turned into a raw unhandled promise rejection and crashed the entire Node process
                // (seen on Railway: 10062 Unknown interaction -> fallback reply -> 40060 already
                // acknowledged -> process exit). Awaiting + catching here keeps a doubly-failed fallback
                // reply from ever being able to crash the bot.
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

        // MP LOADOUT CATEGORY COMMAND FALLBACK (for the dynamically-generated /all + /<category>
        // commands built in handleBotReady — these have no 'data'+'execute' file in commands/, so
        // interaction.client.commands.get() always misses and control falls through to here). MongoDB-backed,
        // mirroring /dmz's pattern — see utils/loadoutRender.js for the shared card builder.
        const Loadout = require('../models/Loadout');
        const UserPreference = require('../models/UserPreference');
        const { buildLoadoutCard, getMpCategoryAccent } = require('../utils/loadoutRender');
        const { resolveEphemeral } = require('../utils/ephemeral');

        // Same "Weapon Builds" toggle /dmz reads — one shared preference across every loadout
        // lookup command (Option A pattern, matches `seasonalVisibility`). `private` option
        // overrides it explicitly, same explicit-option > saved-preference > default priority
        // every other command uses — lets a user land already-public in one shot instead of
        // relying on "Share Publicly" to flip it after the fact.
        // NOTE (added during review): the weapon query is kicked off alongside prefs instead of
        // after it -- it doesn't depend on prefs at all, so it resolves concurrently with the
        // deferReply() ack below rather than only starting once that's done. Only `prefs` is
        // actually awaited before deferReply (keeps the 3-second ack window fast). .lean() since
        // these builds are only ever read here, never saved.
        const rawQuery = interaction.options.getString('weapon');
        // Normalized the same way dmz.js's own exact-key lookup already does -- harmless for a
        // value that came from picking an autocomplete suggestion (already normalized weaponKey),
        // but lets a free-typed exact name with different casing/spacing still hit exactly.
        const weaponKey = rawQuery.toLowerCase().replace(/\s+/g, '');
        const prefsPromise = UserPreference.findOne({ discordId: interaction.user.id });
        const mpBuildsPromise = Loadout.find({ weaponKey, mode: 'MP' }).lean();

        const prefs = await prefsPromise;
        const visibilityChoice = interaction.options.getString('visibility');
        const argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'loadoutVisibility' });
        await interaction.deferReply({ ephemeral: isEphemeral });

        let mpBuilds = await mpBuildsPromise;

        // Short/partial-query fallback (2026-07-18, v2 quick-wins batch) -- see dmz.js's matching
        // comment for the full explanation: the exact weaponKey lookup above only reliably matches
        // when the option came from an actual autocomplete pick, so a short/partial free-typed
        // query (e.g. "loc") used to just fail with no explanation. Fuzzy-match the raw query
        // against every candidate weapon's real name (same mode/category scope autocomplete
        // itself uses) before giving up -- an unambiguous single match auto-resolves, 2+ matches
        // asks the user to pick one instead of silently guessing which they meant.
        if (!mpBuilds || mpBuilds.length === 0) {
            const { findWeaponMatches } = require('../utils/search');
            const fallbackFilter = commandName === 'all' ? { mode: 'MP' } : { mode: 'MP', category: commandName.toUpperCase() };
            const allCandidates = await Loadout.find(fallbackFilter).select('weaponKey weaponName').lean();
            const uniqueCandidates = Array.from(new Map(allCandidates.map(w => [w.weaponKey, w])).values());
            const fuzzyMatches = findWeaponMatches(rawQuery, uniqueCandidates);

            if (fuzzyMatches.length === 1) {
                mpBuilds = await Loadout.find({ weaponKey: fuzzyMatches[0].weaponKey, mode: 'MP' }).lean();
            } else if (fuzzyMatches.length > 1) {
                const names = fuzzyMatches.slice(0, 10).map(w => w.weaponName).join(', ');
                try {
                    await interaction.followUp({ content: `❌ That's not specific enough — did you mean one of these? **${names}**\nPick a suggestion from the dropdown as you type instead of typing the full name.` });
                } catch (notifyError) {
                    console.error('Failed to notify user of ambiguous MP weapon match (interaction likely expired):', notifyError);
                }
                return;
            }
        }

        if (!mpBuilds || mpBuilds.length === 0) {
            // NOTE (fixed during review): awaited + wrapped in its own try/catch, matching the
            // pattern used elsewhere in this handler -- an unawaited `return interaction.
            // followUp(...)` inside a try block can reject AFTER the block has already exited
            // (the try/catch is no longer "listening" by the time that happens), which used to be
            // able to crash the whole process. See CLAUDE.md's crash-resilience notes.
            const hint = rawQuery.length < 3
                ? ' Try typing a bit more of the weapon\'s name, or pick a suggestion from the dropdown as you type.'
                : ' Double-check the spelling, or pick a suggestion from the dropdown as you type.';
            try {
                await interaction.followUp({ content: `❌ No MP builds were found for that weapon.${hint}` });
            } catch (notifyError) {
                console.error('Failed to notify user of missing MP builds (interaction likely expired):', notifyError);
            }
            return;
        }

        // `build` lets a user jump straight to a specific build number (1-based, matching the
        // "Build N of M" footer text) instead of always landing on the first. Clamped into range
        // rather than rejected outright if it's out of bounds.
        const requestedBuild = interaction.options.getInteger('build');
        const buildIndex = requestedBuild ? Math.min(Math.max(requestedBuild - 1, 0), mpBuilds.length - 1) : 0;

        // NOTE (added during review): color used to be one fixed value (#2b2d31) for every MP
        // loadout regardless of weapon type. Now resolved per-weapon via the queried build's own
        // `category` -- every row for a given weaponKey shares the same category, so mpBuilds[0]
        // is a safe representative. This is what makes /all's accent color change depending on
        // which weapon was searched (e.g. CX9 -> SMG's color, LK24 -> Marksman's color) while
        // /<category> commands like /ar or /smg just always resolve to their own one category's
        // color, since every result they can ever return already shares it. See
        // utils/loadoutRender.js's MP_CATEGORY_ACCENT for the actual color-per-category mapping.
        //
        // LIBRARY SERIALIZATION BYPASS: raw rest.patch instead of interaction.followUp(), same
        // reasoning as every other Components V2 command — discord.js's high-level methods don't
        // reliably handle raw V2 JSON (no builder class exists for Container/type 17).
        // Category-wide build list for the "Browse other builds" dropdown -- every weapon sharing
        // this weapon's category, mirroring /all's own per-category accent color resolution above.
        const categoryBuilds = await Loadout.find({ category: mpBuilds[0].category, mode: 'MP' }).lean();
        const accentColor = getMpCategoryAccent(mpBuilds[0].category);
        const cardPayload = buildLoadoutCard(mpBuilds, buildIndex, { color: accentColor, idPrefix: 'mp', isEphemeral, categoryBuilds });
        const { sendV2Payload } = require('../utils/sendV2Payload');
        await sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
        // Same choke point as the modular-command branch above -- the dynamically-generated
        // /all + /<category> commands never reach interaction.client.commands.get(), so they need their own
        // identical call here or they'd silently never deliver an announcement.
        try {
            const { maybeSendAnnouncement } = require('../utils/announcement');
            await maybeSendAnnouncement(interaction);
        } catch (announcementError) {
            console.error('Failed to check/deliver announcement after a successful MP loadout lookup:', announcementError);
        }
        return;
    }

    // ==========================================
    // --- STEP 6.3: STRING SELECT MENUS (DROPDOWNS) ---
    // ==========================================
    if (interaction.isStringSelectMenu()) {

        // A. TIMESTAMP STYLE SELECTOR
        // Look for the new pipe delimiter prefix to handle stateless timestamp dropdowns
        // NOTE (de-duplicated during review): this used to fully re-implement both of
        // commands/timestamp.js's view layouts inline instead of calling back into that file —
        // the two copies had already drifted out of sync across two earlier redesigns. Now uses
        // the same synthetic-interaction reuse pattern as every other command, passing the
        // already-known unix/tz/queryInput through so timestamp.js's execute() doesn't need to
        // re-parse the original natural-language input (which could resolve differently the
        // second time for a relative input like "tomorrow").
        if (interaction.customId.startsWith('tsmenu|')) {
            // PRO FIX: Instantly defer the update to tell Discord we are processing.
            // This permanently extends the 3-second timeout window to 15 minutes, preventing 10062 crashes.
            await interaction.deferUpdate();

            // Split out parameters safely using the pipe (|) delimiter so timezones like Asia/Hong_Kong don't fracture
            const parts = interaction.customId.split('|');
            const unix = parts[1];
            const tz = parts[2];
            const originalQueryText = parts.slice(3).join('|');
            const selectedStyle = interaction.values[0];

            const timestampCommand = interaction.client.commands.get('timestamp');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });

            // Resolve the same accent color the initial render would have used (2026-07-12) --
            // fixed teal unless the user's SAVED default style (prefs.timestampStyle) isn't
            // 'all_formats', same rule timestamp.js's own execute() applies. Computed here since
            // overrideState skips the normal option-resolution logic entirely.
            const UserPreference = require('../models/UserPreference');
            const { getAccentColorForCommand } = require('../utils/accentColor');
            const tsPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
            const usesPersonalizedAccent = tsPrefs?.timestampStyle && tsPrefs.timestampStyle !== 'all_formats';
            const accentColor = usesPersonalizedAccent
                ? await getAccentColorForCommand(interaction, tsPrefs, timestampCommand.PRESET_ACCENT)
                : timestampCommand.PRESET_ACCENT;

            return await timestampCommand.execute(syntheticInteraction, {
                unix, tz, queryInput: originalQueryText,
                style: selectedStyle === 'all_formats' ? null : selectedStyle,
                // Preserve whether the message being edited was ephemeral — Discord doesn't let an
                // edit change a message's ephemeral state either way, but timestamp.js still needs
                // this to know whether to keep showing the "Share Publicly" button after a style
                // switch (it otherwise has no other way to know, since overrideState skips the
                // normal ephemeral-resolution logic entirely).
                ephemeral: Boolean(interaction.message.flags?.bitfield & 64),
                // isTextMode (2026-07-14): same derive-from-the-existing-message trick as ephemeral
                // above -- text mode never sets the Components V2 flag (32768), so its ABSENCE on
                // the message being edited means "this was rendered as text, stay in text" when
                // switching styles via the dropdown.
                isTextMode: !(interaction.message.flags?.bitfield & 32768),
                accentColor
            });
        }

        // B2. HELP CATEGORY SELECTOR
        if (interaction.customId === 'help_category') {
            await interaction.deferUpdate();
            const helpCommand = interaction.client.commands.get('help');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await helpCommand.execute(syntheticInteraction, interaction.values[0]);
        }

        // C. PATCH NOTES HISTORY SELECTOR
        if (interaction.customId === 'select_patch_history') {
            await interaction.deferUpdate();
            const patchId = interaction.values[0].replace('patch_', '');
            const patchnotesCommand = interaction.client.commands.get('patch');

            // Generate synthetic interaction to trigger the command file seamlessly
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await patchnotesCommand.execute(syntheticInteraction, patchId);
        }

        // D. SETTINGS MENU DROPDOWNS (Timezone & Timestamp Formats only)
        if (interaction.customId.startsWith('set_')) {
            await interaction.deferUpdate(); // Extends execution context limits to handle network delays safely
            // 3rd pipe segment (2026-07-12) -- which /settings page this dropdown lives on, so
            // re-rendering after a selection lands back on the same page instead of resetting to
            // page 0. Only the dropdowns that live on the Preferences page (region mode/timezone/
            // style/accent) carry this; defaults to page 0 if absent. (A 4th `|{expiresAt}` segment
            // used to live here for the old reactive 15-min expiry check -- removed 2026-07-18, see
            // utils/passiveExpiry.js; expiry is now enforced passively by disabling the components
            // themselves, not by rejecting a stale click.)
            const [action, targetUserId, pageStr] = interaction.customId.split('|');
            const currentPage = pageStr ? parseInt(pageStr, 10) : 0;
            const selectedValue = interaction.values[0];

            // SECURITY GATEWAY LOCK: Prevent external users from clicking inside an active configuration trace.
            // Admin-override (2026-07-18) -- resolvePanelActor lets ALLOWED_ADMIN_ID through without
            // being blocked, but still tells us to keep rendering targetUserId's OWN data below
            // (never Harkirat's), via the actingUser it returns. See its own comment for why this
            // can't just be a relaxed identity check.
            const actingUser = await resolvePanelActor(interaction, targetUserId);
            if (!actingUser) {
                // Awaited + wrapped in its own try/catch -- see the matching note above. Reworded
                // 2026-07-18 -- clearer + says what to do instead, per Harkirat's request.
                try {
                    await interaction.followUp({ content: "🔒 **Not your dashboard!** This panel belongs to someone else — run `/settings` yourself to get your own to play with.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked settings action (interaction likely expired):', notifyError);
                }
                return;
            }

            const UserPreference = require('../models/UserPreference');
            let prefs = await UserPreference.findOne({ discordId: targetUserId });
            if (!prefs) prefs = new UserPreference({ discordId: targetUserId });

            // Parse individual dropdown branches and update corresponding document keys
            if (action === 'set_timezone') prefs.timezone = selectedValue;
            if (action === 'set_style') prefs.timestampStyle = selectedValue;
            if (action === 'set_accent_style') prefs.accentColorStyle = selectedValue;
            // Added 2026-07-12 -- the new 3-option "Draw Prices Region" dropdown (replaces the old
            // binary toggle_region_10/toggle_region_30 buttons, see settings.js).
            if (action === 'set_region_mode') prefs.defaultRegionMode = selectedValue;

            await prefs.save();

            // ⚠️ THE "Display Name Colors not set up" ONE-TIME NOTICE WAS REMOVED HERE 2026-08-13 00:00
            // EDT, with the style itself. It fired when a user PICKED that option and had no Nitro name
            // gradient; the option no longer exists in /settings' dropdown, so the branch was
            // unreachable rather than merely unused. `fetchDisplayNameColors` is still exported and
            // still called by commands/settings.js -- but only behind its own
            // `accentColorStyle === 'displayName'` gate, so a retired style costs no REST call on an
            // ordinary render. The notice went; the capability did not.

            // IN-PLACE RE-DRAW REDIRECT: Call the modular command stack directly to redraw updated
            // parameters instantly -- passes the current page through so picking an option on the
            // Preferences page doesn't bounce back to page 0. Renders via actingUser (only swapped
            // to a synthetic interaction when Harkirat is overriding someone else's panel -- the
            // normal same-user case reuses the real interaction unchanged) so the redraw always
            // reflects targetUserId's own data, never the admin's. settings.js's own execute() ends
            // by rescheduling the passive idle-timeout using THIS interaction's fresh token -- no
            // separate call needed here.
            const settingsCommand = interaction.client.commands.get('settings');
            const renderInteraction = actingUser === interaction.user ? interaction : buildSyntheticInteraction(interaction, { user: actingUser });
            return await settingsCommand.execute(renderInteraction, currentPage);
        }


        // F. LOADOUT "BROWSE OTHER BUILDS" DROPDOWN (added 2026-07-12) -- lets a user jump
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
        if (interaction.customId === 'mpbrowse' || interaction.customId === 'dmzbrowse') {
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
    }

    // ==========================================
    // --- STEP 6.4: BUTTON INTERCEPTORS ---
    // ==========================================
    if (interaction.isButton()) {

        // --- /alerts PANEL (admin-only; already auto-gated by the centralized `alerts_` guard above) ---
        // Export: a FRESH ephemeral message carrying the .txt, so the panel itself is left untouched.
        if (interaction.customId === 'alerts_export') {
            await interaction.deferReply({ flags: 64 });
            const { buildAlertExport } = require('../utils/alertStore');
            const text = await buildAlertExport();
            const stamp = new Date().toISOString().slice(0, 10);
            return interaction.editReply({ content: '📄 Alert log export:', files: [{ attachment: Buffer.from(text, 'utf-8'), name: `dior-alerts-${stamp}.txt` }] });
        }
        // Explain <-> Back: re-render the SAME panel message between its main + explainer views. sendV2Payload
        // patches @original (keeps the message's own ephemerality — Discord ignores flag changes on edit).
        if (interaction.customId === 'alerts_explain' || interaction.customId === 'alerts_back') {
            await interaction.deferUpdate();
            const { buildAlertsPanel } = require('../commands/alerts');
            const { sendV2Payload } = require('../utils/sendV2Payload');
            const view = interaction.customId === 'alerts_explain' ? 'explain' : 'main';
            return sendV2Payload(interaction, await buildAlertsPanel({ view }));
        }
        // Pagination through the recent-alert list (custom_id encodes the target page, stateless).
        if (interaction.customId.startsWith('alerts_page_')) {
            await interaction.deferUpdate();
            const { buildAlertsPanel } = require('../commands/alerts');
            const { sendV2Payload } = require('../utils/sendV2Payload');
            const page = parseInt(interaction.customId.replace('alerts_page_', ''), 10) || 0;
            return sendV2Payload(interaction, await buildAlertsPanel({ page, view: 'main' }));
        }

        // --- AUTOBUILD: CONFIRM ---
        if (interaction.customId.startsWith('autobuild_confirm_')) {
            const token = interaction.customId.replace('autobuild_confirm_', '');
            await interaction.deferUpdate();
            const { confirmAndWrite } = require('../utils/autobuildPipeline');
            return await confirmAndWrite(interaction, token);
        }

        // --- AUTOBUILD: CANCEL ---
        if (interaction.customId.startsWith('autobuild_cancel_')) {
            const token = interaction.customId.replace('autobuild_cancel_', '');
            await interaction.deferUpdate();
            const { cancelReview } = require('../utils/autobuildPipeline');
            return await cancelReview(interaction, token);
        }

        // --- AUTOBUILD: OPEN LOADOUT --- answers THIS button's own interaction with a brand-new PUBLIC
        // message (not an edit of the ephemeral confirmation), same shape /dmz's execute() uses for its
        // own initial send. See the design spec's "Open Loadout" section.
        if (interaction.customId.startsWith('autobuild_openloadout_')) {
            const loadoutId = interaction.customId.replace('autobuild_openloadout_', '');
            const Loadout = require('../models/Loadout');
            const { buildLoadoutCard, getMpCategoryAccent } = require('../utils/loadoutRender');
            const doc = await Loadout.findById(loadoutId).lean();
            if (!doc) {
                return interaction.reply({ content: '❌ That loadout no longer exists.', ephemeral: true });
            }
            // Render the weapon's FULL build set (not just this one doc) so the Prev/Next pagination
            // and the correct "Build N of M" footer render, opening ON the just-created build. The PoC
            // passed [doc] alone (found in live testing 2026-07-20): builds.length === 1, so
            // buildPaginationRow returned null and the footer wrongly read "Build 1 of 1" even for a
            // weapon that has several builds. Same weaponKey scope the normal /all + /<category> route
            // already uses. openIndex falls back to 0 if the doc somehow isn't in its own result set.
            const builds = await Loadout.find({ weaponKey: doc.weaponKey, mode: 'MP' }).lean();
            const openIndex = Math.max(0, builds.findIndex(b => String(b._id) === String(doc._id)));
            const categoryBuilds = await Loadout.find({ category: doc.category, mode: 'MP' }).lean();
            const accentColor = getMpCategoryAccent(doc.category);
            const cardPayload = buildLoadoutCard(builds, openIndex, { color: accentColor, idPrefix: 'mp', isEphemeral: false, categoryBuilds });
            await interaction.deferReply({ ephemeral: false });
            const { sendV2Payload } = require('../utils/sendV2Payload');
            return await sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
        }

        // --- AUTOBUILD: EDIT BUTTON --- MUST stay in isButton(), never moved next to autobuild_editmodal_
        // below -- see this feature's "Critical placement rule" (same class of bug CLAUDE.md documents
        // already happening once for /manage's mng_editbtn_/mng_search_ pair). showModal() is valid as a
        // response to a button click; it is NOT valid as a response to a modal submit.
        if (interaction.customId.startsWith('autobuild_editbtn_')) {
            const token = interaction.customId.replace('autobuild_editbtn_', '');
            const { pendingAutobuilds, buildEditModal } = require('../utils/autobuildPipeline');
            const data = pendingAutobuilds.get(token);
            if (!data) {
                return await interaction.reply({ content: '❌ This review has expired. Run `/autobuild` again.', ephemeral: true });
            }
            return await interaction.showModal(buildEditModal(token, data));
        }

        // DRAW PRICES REGION SWITCHER -- was a single "switch to the other region" toggle button
        // (per Harkirat's drawPrices_ui.json redesign) until the 20 CP region was added 2026-08-07,
        // at which point a binary toggle stopped making sense (see drawprices.js's REGION_ORDER
        // note) and it became a 3-way button row, one button per region. custom_id encodes the
        // region to JUMP TO directly (same scheme as before, just generalized past 2 regions) plus
        // the CURRENT subpage (added 2026-07-12 once entries got split across 2 pages -- e.g.
        // `price_region_30_1` -- so switching region doesn't reset which page of entries you were
        // on). Deliberately NOT prefixed `toggle_` -- that prefix is claimed by the generic
        // /settings binary-toggle handler further down (`customId.startsWith('toggle_')`), which
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

        // 0. "SHARE PUBLICLY" — attached below any ephemeral response's own components (see
        // utils/shareButton.js). Doesn't touch the original ephemeral message at all — Discord
        // hands us the FULL original message (content/embeds/components) directly in this click's
        // own interaction payload, ephemeral or not, so there's nothing to look up or reconstruct.
        // We just strip the ephemeral flag and the share button itself, then respond to THIS
        // button click with that same content as a public message.
        //
        // NOTE (fixed during review): this used to defer ephemeral, then try to POST a brand new
        // message directly to the channel via `rest.post(Routes.channelMessages(...))` using the
        // bot's own token. That requires the bot to actually hold View Channel/Send Messages
        // permission in that channel -- but this bot is USER-INSTALLED ONLY, never added to any
        // guild as a member with roles/permissions, so that raw channel POST always fails with
        // DiscordAPIError[50001] "Missing Access" in a real server channel (confirmed live). The
        // fix: don't touch the channel directly at all -- just answer the button-click interaction
        // itself with a NON-ephemeral deferReply + rest.patch('@original'), the exact same
        // interaction-response webhook mechanism every other command in this bot already uses
        // successfully in guilds it was never added to. Interaction responses don't need any
        // standing channel permissions, which is the whole reason a user-installed bot can answer
        // slash commands in a server at all -- so routing "Share Publicly" through that same
        // mechanism (instead of a raw bot-token channel message) makes it work everywhere the bot
        // can already respond, no permissions to check or configure.
        if (interaction.customId === 'share_public') {
            // SERVER VISIBILITY POLICY (2026-08-10 15:49 EDT, v3). This button does not edit the
            // ephemeral message -- it posts a brand new, genuinely public one, so under a forced-
            // ephemeral rule it is a one-click bypass. utils/shareButton.js already declines to
            // RENDER it in that case; this re-check is the one that matters, because a panel opened
            // before the admin set the rule still has the button sitting on it.
            if (interaction.dioreoPolicy && interaction.dioreoPolicy.allowShare === false) {
                try {
                    await interaction.reply({
                        content: "🔇 **This server keeps Dioreo's answers private here.** A server admin set that, so this one stays visible only to you.",
                        ephemeral: true,
                    });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked share (interaction likely expired):', notifyError);
                }
                return;
            }

            const { SHARE_BUTTON_CUSTOM_ID } = require('../utils/shareButton');
            const msg = interaction.message;

            const embeds = (msg.embeds || []).map(e => (typeof e.toJSON === 'function' ? e.toJSON() : e));
            const rawComponents = (msg.components || []).map(c => (typeof c.toJSON === 'function' ? c.toJSON() : c));

            // Drop the share row itself — a message that's already public doesn't need a button
            // offering to make it public. We only ever add it as its OWN dedicated row (never mixed
            // into an existing row), so dropping any row that contains it is safe and precise.
            const components = rawComponents.filter(entry => {
                if (entry.type !== 1) return true;
                return !(entry.components || []).some(c => c.custom_id === SHARE_BUTTON_CUSTOM_ID);
            });

            // Preserve the Components V2 flag (32768) if present, but strip EPHEMERAL (64) — this
            // response IS the public copy now, not a private confirmation about one.
            const flags = (msg.flags?.bitfield || 0) & ~64;

            await interaction.deferReply(); // public — no ephemeral flag
            const { sendV2Payload } = require('../utils/sendV2Payload');
            return sendV2Payload(interaction, components, { content: msg.content || '', embeds, flags });
        }

        // A. SETTINGS BINARY TOGGLE BUTTONS (Public/Private & Region defaults)
        if (interaction.customId.startsWith('toggle_')) {
            // No deferUpdate() -- single-hop UPDATE_MESSAGE (2026-08-06 22:17 EDT, pagination perf
            // hybrid). The old comment here ("Defer to permanently safeguard against API 10062
            // timeouts") was blanket boilerplate from the 2026-07-06 Components V2 rewrite, not a
            // documented incident specific to this branch -- one Mongo find + one save() is well
            // inside the traced 3s-ACK margin the rest of this design already measured.
            // (A 3rd `|{expiresAt}` segment used to live here for the old reactive 15-min expiry
            // check -- removed 2026-07-18, see utils/passiveExpiry.js.)
            const [actionStr, targetUserId, variantToken] = interaction.customId.split('|');
            // Third segment carries which view this panel is in ('g' global / 's' server), so a
            // page, subpage or refresh click stays where the user was instead of snapping back to
            // global. Absent on any id minted before this shipped, so it degrades to global rather
            // than throwing -- a message left open across the deploy keeps working.
            const variant = variantToken === 's' ? 'server' : 'global';

            // SECURITY GATEWAY WALL: Block rogue server members from attempting to adjust another user's preference canvas
            // Admin-override (2026-07-18) -- see resolvePanelActor's own comment.
            const actingUser = await resolvePanelActor(interaction, targetUserId);
            if (!actingUser) {
                // Awaited + wrapped in its own try/catch -- see the matching note above. Reworded
                // 2026-07-18 -- clearer + says what to do instead, per Harkirat's request.
                try {
                    await interaction.followUp({ content: "🔒 **Not your dashboard!** This panel belongs to someone else — run `/settings` yourself to get your own to play with.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked settings action (interaction likely expired):', notifyError);
                }
                return;
            }

            const action = actionStr.replace('toggle_', ''); // Strip prefix to catch clean string maps
            const UserPreference = require('../models/UserPreference');

            let prefs = await UserPreference.findOne({ discordId: targetUserId });
            if (!prefs) prefs = new UserPreference({ discordId: targetUserId });

            // Parse button toggle instructions directly over to matching Atlas database document keys
            if (action === 'loadout_public') prefs.loadoutVisibility = 'public';
            if (action === 'loadout_ephemeral') prefs.loadoutVisibility = 'ephemeral';
            if (action === 'seasonal_public') prefs.seasonalVisibility = 'public';
            if (action === 'seasonal_ephemeral') prefs.seasonalVisibility = 'ephemeral';
            if (action === 'timestamp_public') prefs.timestampVisibility = 'public';
            if (action === 'timestamp_ephemeral') prefs.timestampVisibility = 'ephemeral';
            if (action === 'settings_public') prefs.settingsVisibility = 'public';
            if (action === 'settings_ephemeral') prefs.settingsVisibility = 'ephemeral';
            // Calendar's Active/All Events filter moved here from an in-page /calendar toggle
            // (2026-07-31 14:00 EDT, per Harkirat's explicit request) -- lives on /settings' page 1
            // (Preferences), so the re-render below needs page 1, not the page-0 default every other
            // toggle here uses.
            if (action === 'calfilter_active') prefs.calendarEventFilter = 'active';
            if (action === 'calfilter_all') prefs.calendarEventFilter = 'all';
            const targetPage = (action === 'calfilter_active' || action === 'calfilter_all') ? 1 : 0;
            // NOTE (removed 2026-07-12): region_10/region_30 toggle actions used to live here as a
            // binary button. Replaced by a 3-option dropdown ("Show Last Viewed Region" / "10 CP" /
            // "30 CP") writing to the new `defaultRegionMode` field instead -- see the `set_region_mode`
            // branch in the generic `set_` dropdown handler above. All 4 of these visibility toggles
            // stay on /settings' page 0 (Visibility), so no page param is needed here.

            await prefs.save(); // Write preferences live to the Atlas cluster

            // LIVE RE-DRAW ROUTE: Call the settings engine module to rewrite the canvas on screen.
            // Renders via actingUser (see the D. handler's matching comment above) so an admin
            // override never swaps in Harkirat's own data. settings.js's own execute() reschedules
            // the passive idle-timeout using THIS interaction's fresh token at the end of its render.
            // ⚠️ ALWAYS synthetic, even when actingUser === interaction.user (fixed 2026-08-06 22:18
            // EDT while removing this branch's deferUpdate() above) -- settings.js's execute() guards
            // its deferReply() with `if (!interaction.deferred && !interaction.replied)`, which used
            // to be false here only because deferUpdate() had already run at the top of this branch.
            // With that call gone, passing the REAL interaction straight through would let settings.js
            // fire a genuine deferReply() -- type 5, a NEW reply -- instead of staying single-hop.
            // The no-op override keeps this branch on the same single-hop path as set_page_ above.
            const settingsCommand = interaction.client.commands.get('settings');
            const renderInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { }, user: actingUser });
            return await settingsCommand.execute(renderInteraction, targetPage);
        }

        // B. DRAWS PAGINATION (New vs Returning)
        if (interaction.customId === 'page_returning_draws' || interaction.customId === 'page_new_draws') {
            // No deferUpdate() -- single-hop, see sendV2Payload.js's header comment.
            const targetPage = interaction.customId === 'page_returning_draws' ? 'returning' : 'new';
            const drawsCommand = interaction.client.commands.get('draws');

            // Build synthetic routing payload
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await drawsCommand.execute(syntheticInteraction, targetPage);
        }

        // B.2 DRAWS SUB-PAGE PAGINATION (Prev/Next within a category, once it exceeds CHUNK_SIZE)
        // custom_id format: subpage_<new|returning>_<targetIndex>, e.g. "subpage_new_2"
        if (interaction.customId.startsWith('subpage_new_') || interaction.customId.startsWith('subpage_returning_')) {
            // No deferUpdate() -- single-hop, see sendV2Payload.js's header comment.
            const isNewCategory = interaction.customId.startsWith('subpage_new_');
            const targetPage = isNewCategory ? 'new' : 'returning';
            const targetSubPage = parseInt(interaction.customId.replace(isNewCategory ? 'subpage_new_' : 'subpage_returning_', ''), 10) || 0;
            const drawsCommand = interaction.client.commands.get('draws');

            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await drawsCommand.execute(syntheticInteraction, targetPage, targetSubPage);
        }

        // B.3 CALENDAR PAGE TOGGLE (Draws / Events / Playlists-Modes -- replaces the old Prev/Next
        // sub-page pagination, 2026-07-31 14:00 EDT, per Harkirat's explicit request for named
        // section-toggle buttons instead of arrows). custom_id format: calpage_<0|1|2>.
        if (interaction.customId.startsWith('calpage_')) {
            // REVERTED to two-hop 2026-08-07 17:38 EDT (v2.60.0) -- see the price_region_ branch's
            // comment above for the full reasoning (the emoji-blank bug + investigation).
            await interaction.deferUpdate();
            const targetPage = parseInt(interaction.customId.replace('calpage_', ''), 10) || 0;
            const calendarCommand = interaction.client.commands.get('calendar');

            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await calendarCommand.execute(syntheticInteraction, targetPage);
        }

        // (The old B.4 CALENDAR EVENT-FILTER TOGGLE handler was removed 2026-07-31 14:00 EDT -- the
        // Active/All Events filter moved to /settings entirely, per Harkirat's explicit request. See
        // the generic `toggle_` handler below for `calfilter_active`/`calfilter_all`.)

        // B.5 SETTINGS PAGE NAVIGATION -- /settings paginated into 2 pages (2026-07-12, once the new
        // region dropdown + hex codes + footer line pushed it close to Discord's 40-component cap):
        // page 0 = Visibility toggles, page 1 = Preferences. custom_id is `set_page_{targetPage}`,
        // same Prev/Next pattern as calendar/draws sub-pages -- the banner/profile header section
        // stays identical on both pages (re-rendered each time, not truly "shared" state).
        if (interaction.customId.startsWith('set_page_') && interaction.customId !== 'set_page_indicator') {
            // REVERTED to two-hop 2026-08-07 17:44 EDT (v2.60.0) -- same emoji-blank bug as
            // calpage_/price_region_/price_subpage_ above, directly confirmed on THIS handler during
            // that investigation (docs/db-deferred-list.md's "button emoji goes blank after a
            // single-hop re-render" entry) even though it was found mid-investigation rather than
            // part of the original report. Applying the same already-decided fix rather than leaving
            // a confirmed-broken path in place.
            await interaction.deferUpdate();
            // custom_id shape: `set_page_{targetPage}|{userId}` -- this button previously carried NO
            // author-lock at all (a real gap; every other settings component already embedded
            // |userId). Page number lives before the first pipe since the action verb itself encodes
            // it, unlike toggle_/set_ which encode the target in a separate value. (A 3rd
            // `|{expiresAt}` segment used to live here for the old reactive 15-min expiry check --
            // removed 2026-07-18, see utils/passiveExpiry.js.)
            const [pagePart, targetUserId] = interaction.customId.split('|');
            const targetPage = parseInt(pagePart.replace('set_page_', ''), 10) || 0;

            // Admin-override (2026-07-18) -- see resolvePanelActor's own comment.
            const actingUser = await resolvePanelActor(interaction, targetUserId);
            if (!actingUser) {
                try {
                    await interaction.followUp({ content: "🔒 **Not your dashboard!** This panel belongs to someone else — run `/settings` yourself to get your own to play with.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked settings action (interaction likely expired):', notifyError);
                }
                return;
            }

            // Renders via actingUser (see the D. handler's matching comment above) -- deferReply is
            // no-op'd on the synthetic interaction since the REAL interaction was already deferred
            // above (two-hop); settingsCommand.execute() must not try to ack it a second time.
            const settingsCommand = interaction.client.commands.get('settings');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { }, user: actingUser });
            return await settingsCommand.execute(syntheticInteraction, targetPage);
        }

        // --- VIEW COLORS PANEL (2026-08-13 16:45 EDT) --- the five `colors_*` buttons live in
        // handlers/colors.js now; this is the whole of their routing. FIRST slice of the per-subsystem
        // split (docs/ROADMAP.md). Sits exactly where the colours block itself used to, so ordering
        // relative to the branches above and below is unchanged -- and it is AWAITED inside this
        // handler's one top-level try/catch, which is what keeps the crash net over it.
        // Returns false for an unrecognised `colors_*` id, which then falls through to the branches
        // below exactly as it did pre-split.
        if (await handleColorsButton(interaction)) return;

        // C. GLOBAL UI NAVIGATION BAR
        if (interaction.customId.startsWith('nav_')) {
            await interaction.deferUpdate();

            // Dictionary mapper: Connects the button IDs to the newly renamed Subcommand bases
            const commandMap = {
                'nav_seasonend': 'season',
                'nav_draws': 'draws',
                'nav_prices': 'draw',
                'nav_patchnotes': 'patch',
                'nav_calendar': 'calendar'
            };
            const targetCommandName = commandMap[interaction.customId];
            const targetCommand = interaction.client.commands.get(targetCommandName);

            if (!targetCommand) {
                // Awaited + wrapped in its own try/catch -- see the matching note above.
                try {
                    await interaction.followUp({ content: '❌ Target interface module is currently offline.', ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of offline nav target (interaction likely expired):', notifyError);
                }
                return;
            }

            try {
                // We temporarily override the interaction's deferral methods so the target command 
                // processes it as an in-place update rather than trying to spawn a new reply.
                const syntheticInteraction = buildSyntheticInteraction(interaction, {
                    deferReply: async () => { }, // Nullify to prevent double-deferral crashes
                    reply: async (payload) => interaction.editReply(payload),
                    followUp: async (payload) => interaction.followUp(payload),
                    // Button interactions have no `.options` resolver at all (that only exists on
                    // slash command interactions). Commands re-used via nav buttons call things like
                    // interaction.options.getString('visibility'), which would otherwise throw
                    // "Cannot read properties of undefined". Stub it out safely.
                    options: {
                        getBoolean: () => null, getString: () => null, getInteger: () => null,
                        getNumber: () => null, getUser: () => null, getChannel: () => null,
                        getRole: () => null, getMentionable: () => null, getAttachment: () => null,
                        getSubcommand: () => null
                    }
                });
                return await targetCommand.execute(syntheticInteraction);
            } catch (error) {
                console.error(`UI Navigation Routing Error for ${interaction.customId}:`, error);
                // See the matching comment in the slash-command error handler above -- an unawaited
                // `return interaction.followUp(...)` here can reject after this try/catch has already
                // exited, escaping as an unhandled rejection that crashes the whole process instead of
                // just failing this one nav click.
                try {
                    await interaction.followUp({ content: '❌ An error occurred while swapping the interface view.', ephemeral: true });
                } catch (notifyError) {
                    console.error(`Failed to notify user of nav routing error for ${interaction.customId} (interaction likely expired):`, notifyError);
                }
                return;
            }
        }

        // D/E. LOADOUT PAGINATION & COPY (DMZ and MP, both MongoDB-backed)
        // Shared handling for both custom_id prefixes since /dmz and the MP category commands
        // (/all, /<category>) now use identical card layouts — see utils/loadoutRender.js. `mode`
        // is the only real difference in what gets queried.
        if (interaction.customId.startsWith('dmz') || interaction.customId.startsWith('mp')) {
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

    // ==========================================
    // --- STEP 6.5: MODAL SUBMITS (ADMIN FORMS) ---
    // ==========================================
    // This block catches all form submissions from the /update and /manage command overlay modals.
    // It processes natural language dates, auto-sorts chronological arrays, and syncs to MongoDB.
    if (interaction.isModalSubmit()) {
        const { customId } = interaction;


        // --- AUTOBUILD: EDIT MODAL SUBMIT --- see the breadcrumb on autobuild_editbtn_ above (isButton()
        // block) for why this is a SEPARATE handler in a SEPARATE block, not a shared one.
        if (customId.startsWith('autobuild_editmodal_')) {
            const token = customId.replace('autobuild_editmodal_', '');
            const { applyEditSubmission } = require('../utils/autobuildPipeline');
            return await applyEditSubmission(interaction, token);
        }

    }
  } catch (err) {
    // Any uncaught rejection in this handler (e.g. a button/select interaction whose
    // token already expired -- Discord error 10062 "Unknown interaction") used to bubble
    // up as an unhandled 'error' event and crash the entire process, taking the bot
    // offline until a manual restart. Discord interaction tokens are only valid for a few
    // seconds/minutes, so this is expected to happen occasionally under normal use, not
    // just as a bug symptom -- log it and keep the bot alive instead of crashing.
    console.error('Unhandled error in interactionCreate:', err);
  }
}

module.exports = { handleInteraction };
