// ==========================================
// PHASE 1: WEB SERVER ARCHITECTURE (KEEP-ALIVE)
// ==========================================
// Express setup acts as a lightweight web server endpoint. This prevents modern hosting 
// environments (like Render or Railway) from spinning down or idling the bot container 
// during periods of inactivity on free/hobby tiers.
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("Dior's Build Bot is running successfully!");
});

app.listen(port, "0.0.0.0", () => {
    console.log(`📡 Keep-alive web infrastructure listening on port ${port}`);
});

// SAFETY NET: Node crashes the whole process on an unhandled promise rejection by default
// (since Node 15). The interactionCreate handler's own try/catch already covers most Discord
// API failures, but a rejection from a `return interaction.reply(...)`-style call inside a catch
// block can still slip past it -- the try/catch has already exited by the time that promise
// settles, so nothing downstream is listening. This is exactly what took the bot offline on
// Railway (10062 Unknown interaction -> fallback reply -> 40060 already acknowledged -> crash).
// Logging instead of crashing here is a last-resort net, not a substitute for fixing the actual
// unawaited call sites -- see the fixed handlers in PHASE 6 for the real fix.
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection (bot stays alive):', reason);
});

// ==========================================
// PHASE 2: CORE MODULES & DEPENDENCY IMPORTS
// ==========================================
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Secure injection of environment variables from local or cloud environment

const mongoose = require('mongoose'); // Add to dependency imports

// CONNECT TO MONGO DB ATLAS STORAGE CLUSTER
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('🍃 Successfully authenticated and established secure link to MongoDB Atlas Cluster!'))
    .catch(err => console.error('❌ Database connection failure detailed error:', err));

// Destructuring modern discord.js elements with structural lifecycle elements (Events binding)
const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    Collection,
    Events
} = require('discord.js');

// ==========================================
// PHASE 3: CORE UTILITIES
// ==========================================

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
    return synthetic;
}

// Instantiate internal client data models
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// CRASH FIX (found live on Railway, 2026-07-07): discord.js's BaseClient constructs itself with
// `super({ captureRejections: true })` (node_modules/discord.js/src/client/BaseClient.js) -- this
// is a Node EventEmitter option that reroutes a rejected promise from an async event listener
// (e.g. our `client.on('interactionCreate', async interaction => {...})` below) into an `error`
// event emitted ON THE CLIENT ITSELF, instead of surfacing through Node's normal global
// `process.on('unhandledRejection')` mechanism. Since nothing was listening for a plain `error`
// event on the client, and EventEmitter's default behavior for an unhandled `error` event is to
// throw synchronously, ANY interaction handler code that ever let a rejection escape (even
// somewhere our top-level try/catch below doesn't cover, or in a future edit that misses it) would
// crash the whole process — completely bypassing the `process.on('unhandledRejection')` net
// further down, since captureRejections intercepts it before it ever becomes a "global" unhandled
// rejection. This IS the standard discord.js gotcha their own guide warns about; the fix is simply
// to always have a listener here so EventEmitter's default "throw when no listener" never triggers.
client.on('error', (error) => {
    console.error('Discord client error (bot stays alive):', error);
});

// Initialize command collections and staging cache array
client.commands = new Collection();
const commands = [];

// ==========================================
// PHASE 4: APPLICATION COMMAND REGISTRATION
// ==========================================

// Register primary comprehensive fallback lookup module
commands.push(
    new SlashCommandBuilder()
        .setName('all')
        .setDescription('Search through all available gunsmiths')
        .addStringOption(opt => opt.setName('weapon').setDescription('Type weapon name').setAutocomplete(true).setRequired(true))
        .addIntegerOption(opt => opt.setName('build').setDescription('Jump directly to a specific build number, if this weapon has more than one').setMinValue(1))
        .addBooleanOption(opt => opt.setName('private').setDescription('Hide this response so only you can see it'))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]) // User-install app permissions enabled
);

// DYNAMIC COMMAND EXTENSION MODULE LOADER:
// Scans internal subdirectory directories to dynamically extract and merge independent slash files
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            commands.push(command.data);
        }
    }
}

/**
 * Coordinates secure synchronization of compiled structures directly over to active Discord cloud endpoints.
 *
 * NOTE (de-Excel'd during review): category commands (/ar, /lmg, /sniper, etc.) used to be
 * auto-compiled synchronously from builds.xlsx's category list at require-time, before this
 * function ever ran. Now derived from MongoDB instead — querying here (inside the async
 * ClientReady handler) rather than at module load time, since a DB query can't run synchronously.
 * This is safe even if the Mongo connection hasn't finished establishing yet: Mongoose buffers
 * queries by default until the connection is ready, it doesn't throw or return early.
 */
async function handleBotReady() {
    console.log(`✅ Dior's Builds instance fully authenticated!`);

    const Loadout = require('./models/Loadout');
    const dbCategories = await Loadout.distinct('category', { mode: 'MP' });
    // Secondaries has no loadouts saved yet -- Harkirat wants the command ready to go the moment
    // he starts adding them, rather than it silently appearing only after the first /manage entry.
    // Merged in (not just appended) so re-running this after real Secondaries data exists doesn't
    // register it twice.
    const mpCategories = Array.from(new Set([...dbCategories, 'SECONDARIES']));
    mpCategories.forEach(cat => {
        const cmdName = cat.toLowerCase().replace(/\s+/g, '');
        commands.push(
            new SlashCommandBuilder()
                .setName(cmdName)
                .setDescription(`Search through ${cat} gunsmiths only`)
                .addStringOption(opt => opt.setName('weapon').setDescription(`Select a ${cat}`).setAutocomplete(true).setRequired(true))
                .addIntegerOption(opt => opt.setName('build').setDescription('Jump directly to a specific build number, if this weapon has more than one').setMinValue(1))
                .addBooleanOption(opt => opt.setName('private').setDescription('Hide this response so only you can see it'))
                .setIntegrationTypes([1]).setContexts([0, 1, 2])
        );
    });

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        const payload = commands.map(c => typeof c.toJSON === 'function' ? c.toJSON() : c);
        await rest.put(Routes.applicationCommands(client.user.id), { body: payload });
        console.log(`🚀 Application routing links successfully integrated into Discord Gateway system!`);
    } catch (error) {
        console.error('--- DISCORD SYSTEM REGISTRATION FAULT LOG ---');
        if (error.rawError && error.rawError.errors) {
            console.error(JSON.stringify(error.rawError.errors, null, 2));
        } else {
            console.error(error);
        }
    }
}

client.once(Events.ClientReady, handleBotReady);

// NOTE (removed during review): a "PHASE 5: INTERACTIVE ELEMENT GENERATORS" banner used to sit
// here with no code under it -- the generators it originally described (loadBuildsFromExcel()'s
// in-memory builders) moved to utils/loadoutRender.js during the MP-migration work and were never
// cleaned up from this file's phase numbering. Removed rather than left as a gap between Phase 4
// and Phase 6 that reads like something's missing.

// Splits an `mng_act_`/`mng_search_`/`mng_pick_` custom_id's remainder (after that prefix is
// stripped) into [group, action] on the LAST underscore, not a naive `.split('_')` -- some group
// keys now contain their own underscore (`loadouts_mp`, `loadouts_dmz`, added 2026-07-12 once MP
// and DMZ Loadouts became separate panel pages), and every action id is deliberately kept
// underscore-free (camelCase, e.g. `bulkaddnew`) specifically so this split stays unambiguous.
function parseMngId(raw) {
    const idx = raw.lastIndexOf('_');
    return [raw.slice(0, idx), raw.slice(idx + 1)];
}

// --- MANAGE PANEL SEARCH RESOLUTION (2026-07-09 button/modal redesign) ---
// Edit/Delete on the /manage panel can't autocomplete like a slash-command option could (they're
// plain buttons), so they collect a search query through a one-field modal instead (see manage.js's
// buildSearchModal) and resolve it here via the same fuzzyMatch() convention every other
// admin-search route in the bot already uses. Returns up to 25 `{ id, label, doc, type? }` matches
// -- `type` ('new'/'returning') only applies to draws, since those live in two separate arrays on
// one document; every other group's docs are independently addressable by _id alone.
async function resolveManagePanelMatches(group, rawQuery) {
    const { fuzzyMatch } = require('./utils/search');
    const query = rawQuery.trim();

    if (group === 'draws') {
        const SeasonalData = require('./models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        if (!seasonalDoc) return [];
        const tagged = [
            ...seasonalDoc.newDraws.map(doc => ({ doc, type: 'new' })),
            ...seasonalDoc.returningDraws.map(doc => ({ doc, type: 'returning' }))
        ];
        return tagged.filter(t => fuzzyMatch(query, t.doc.title)).slice(0, 25).map(t => ({
            id: t.doc._id.toString(), type: t.type, doc: t.doc,
            label: `${t.doc.title} (${t.type === 'new' ? 'New' : 'Returning'})`
        }));
    }

    if (group === 'calendar') {
        const SeasonalData = require('./models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        if (!seasonalDoc) return [];
        return seasonalDoc.calendar.filter(e => fuzzyMatch(query, e.title)).slice(0, 25)
            .map(e => ({ id: e._id.toString(), doc: e, label: e.title }));
    }

    // Loadouts is now two separate panel pages (MP/DMZ, 2026-07-12) instead of one combined group --
    // scope the search to whichever mode the page/group encodes rather than searching both.
    if (group === 'loadouts_mp' || group === 'loadouts_dmz') {
        const mode = group === 'loadouts_mp' ? 'MP' : 'DMZ';
        const Loadout = require('./models/Loadout');
        const modeLoadouts = await Loadout.find({ mode }).lean();
        return modeLoadouts.filter(l => fuzzyMatch(query, l.weaponName) || fuzzyMatch(query, l.buildName)).slice(0, 25)
            .map(l => ({ id: l._id.toString(), doc: l, label: `${l.weaponName} - ${l.buildName}` }));
    }

    // Patch Notes no longer has a search-based edit/delete flow (2026-07-12 redesign moved it to a
    // single "current entry" model -- see manage.js's buildPatchDateInfoModal/buildPatchUrlsModal),
    // so this group is intentionally absent here now.

    return [];
}

// Given one resolved match (single fuzzy hit, or a disambiguation-select pick), either chains
// straight into the real edit modal -- `showModal` is valid as the FIRST response to a modal-submit
// or select-menu interaction too, not just a button, same as any other interaction that hasn't
// been acknowledged yet -- or performs the delete directly and confirms. Shared by both the
// single-match fast path in the `mng_search_` modal-submit handler and the `mng_pick_`
// disambiguation-select handler below.
async function resolveManagePanelAction(interaction, group, action, match) {
    const manageCommand = client.commands.get('manage');

    if (action === 'edit') {
        if (group === 'draws') return interaction.showModal(manageCommand.buildEditDrawModal(match.doc, match.id, match.type));
        if (group === 'calendar') return interaction.showModal(manageCommand.buildEditCalendarModal(match.doc, match.id));
        if (group === 'loadouts_mp' || group === 'loadouts_dmz') return interaction.showModal(manageCommand.buildEditLoadoutModal(match.doc, match.id));
    }

    if (action === 'delete') {
        if (group === 'draws') {
            const SeasonalData = require('./models/SeasonalData');
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
            if (match.type === 'new') seasonalDoc.newDraws = seasonalDoc.newDraws.filter(d => d._id.toString() !== match.id);
            else seasonalDoc.returningDraws = seasonalDoc.returningDraws.filter(d => d._id.toString() !== match.id);
            await seasonalDoc.save();
        } else if (group === 'calendar') {
            const SeasonalData = require('./models/SeasonalData');
            const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
            seasonalDoc.calendar = seasonalDoc.calendar.filter(e => e._id.toString() !== match.id);
            await seasonalDoc.save();
        } else if (group === 'loadouts_mp' || group === 'loadouts_dmz') {
            const Loadout = require('./models/Loadout');
            await Loadout.findByIdAndDelete(match.id);
        }
        // Both a modal-submit interaction and a select-menu interaction (mng_pick_ never
        // deferUpdate()s before reaching here) can answer with a plain reply -- neither has been
        // acknowledged yet at this point.
        return interaction.reply({ content: `🗑️ Successfully deleted **${match.label}**!`, ephemeral: true });
    }
}

// ==========================================
// PHASE 6: INTERACTION SYSTEM OVERSEER (ROUTING)
// ==========================================
client.on('interactionCreate', async interaction => {
  try {

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
        const { fuzzyMatch } = require('./utils/search');

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
                const SeasonalData = require('./models/SeasonalData');
                const { cleanPatchTitle } = require('./commands/patchnotes');
                const doc = await SeasonalData.findOne({ docType: 'global' }).lean(); // read-only here
                if (!doc || !doc.patchNotes) return await interaction.respond([]);

                // Strip the legacy "Balance Changes for..." prefix here too, same as the main
                // render + history dropdown, so pre-redesign entries don't look inconsistent here.
                const filtered = doc.patchNotes
                    .filter(p => fuzzyMatch(focusedValue, cleanPatchTitle(p.title)))
                    .slice(0, 25);

                return await interaction.respond(filtered.map(p => ({ name: cleanPatchTitle(p.title), value: p._id.toString() })));
            }

            // Standard Loadout Dictionary Autocomplete Mapping
            const Loadout = require('./models/Loadout');
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

            const filteredChoices = distinctChoices
                .filter(w => fuzzyMatch(focusedValue, w.weaponName))
                .slice(0, 25); // Hard Discord API limit of 25 choices maximum

            return await interaction.respond(filteredChoices.map(w => ({
                name: commandName === 'all' ? `[${w.category}] ${w.weaponName}` : w.weaponName,
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
        const command = client.commands.get(commandName);
        if (command) {
            try {
                return await command.execute(interaction);
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
        // client.commands.get() always misses and control falls through to here). MongoDB-backed,
        // mirroring /dmz's pattern — see utils/loadoutRender.js for the shared card builder.
        const Loadout = require('./models/Loadout');
        const UserPreference = require('./models/UserPreference');
        const { buildLoadoutCard, getMpCategoryAccent } = require('./utils/loadoutRender');
        const { resolveEphemeral } = require('./utils/ephemeral');

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
        const weaponKey = interaction.options.getString('weapon');
        const prefsPromise = UserPreference.findOne({ discordId: interaction.user.id });
        const mpBuildsPromise = Loadout.find({ weaponKey, mode: 'MP' }).lean();

        const prefs = await prefsPromise;
        const argPrivate = interaction.options.getBoolean('private');
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'loadoutVisibility' });
        await interaction.deferReply({ ephemeral: isEphemeral });

        const mpBuilds = await mpBuildsPromise;

        if (!mpBuilds || mpBuilds.length === 0) {
            // NOTE (fixed during review): awaited + wrapped in its own try/catch, matching the
            // pattern used elsewhere in this handler -- an unawaited `return interaction.
            // followUp(...)` inside a try block can reject AFTER the block has already exited
            // (the try/catch is no longer "listening" by the time that happens), which used to be
            // able to crash the whole process. See CLAUDE.md's crash-resilience notes.
            try {
                await interaction.followUp({ content: '❌ No MP builds were found for that weapon.' });
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
        const accentColor = getMpCategoryAccent(mpBuilds[0].category);
        const cardPayload = buildLoadoutCard(mpBuilds, buildIndex, { color: accentColor, idPrefix: 'mp', isEphemeral });
        const { sendV2Payload } = require('./utils/sendV2Payload');
        return sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
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

            const timestampCommand = client.commands.get('timestamp');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await timestampCommand.execute(syntheticInteraction, {
                unix, tz, queryInput: originalQueryText,
                style: selectedStyle === 'all_formats' ? null : selectedStyle,
                // Preserve whether the message being edited was ephemeral — Discord doesn't let an
                // edit change a message's ephemeral state either way, but timestamp.js still needs
                // this to know whether to keep showing the "Share Publicly" button after a style
                // switch (it otherwise has no other way to know, since overrideState skips the
                // normal ephemeral-resolution logic entirely).
                ephemeral: Boolean(interaction.message.flags?.bitfield & 64)
            });
        }

        // C. PATCH NOTES HISTORY SELECTOR
        if (interaction.customId === 'select_patch_history') {
            await interaction.deferUpdate();
            const patchId = interaction.values[0].replace('patch_', '');
            const patchnotesCommand = client.commands.get('patch');

            // Generate synthetic interaction to trigger the command file seamlessly
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await patchnotesCommand.execute(syntheticInteraction, patchId);
        }

        // D. SETTINGS MENU DROPDOWNS (Timezone & Timestamp Formats only)
        if (interaction.customId.startsWith('set_')) {
            await interaction.deferUpdate(); // Extends execution context limits to handle network delays safely
            const [action, targetUserId] = interaction.customId.split('|');
            const selectedValue = interaction.values[0];

            // SECURITY GATEWAY LOCK: Prevent external users from clicking inside an active configuration trace.
            if (interaction.user.id !== targetUserId) {
                // Awaited + wrapped in its own try/catch -- see the matching note above.
                try {
                    await interaction.followUp({ content: "❌ **Action Blocked:** You do not possess clearance to override settings options on another user's interactive panel.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked settings action (interaction likely expired):', notifyError);
                }
                return;
            }

            const UserPreference = require('./models/UserPreference');
            let prefs = await UserPreference.findOne({ discordId: targetUserId });
            if (!prefs) prefs = new UserPreference({ discordId: targetUserId });

            // Parse individual dropdown branches and update corresponding document keys
            if (action === 'set_timezone') prefs.timezone = selectedValue;
            if (action === 'set_style') prefs.timestampStyle = selectedValue;
            if (action === 'set_accent_style') prefs.accentColorStyle = selectedValue;

            await prefs.save();

            // IN-PLACE RE-DRAW REDIRECT: Call the modular command stack directly to redraw updated parameters instantly.
            const settingsCommand = client.commands.get('settings');
            return await settingsCommand.execute(interaction);
        }

        // E.0 MANAGE PANEL PAGE SELECT -- a select menu (not a row of nav buttons) since the panel
        // has more sections than a button row's 5-cap allows. Season has NO page of its own at all
        // (not a key in manage.js's PAGES) -- both its actions are flat dropdown entries that open
        // their modal directly instead of rendering anything, per Harkirat's request ("let that
        // selection open the editing modal right away instead of a dedicated management page").
        // `showModal` is valid as the first response to a select-menu interaction, same as it is for
        // a button or modal-submit.
        if (interaction.customId === 'mng_pagesel') {
            const targetPage = interaction.values[0];
            const manageCommand = client.commands.get('manage');

            if (targetPage === 'season_titlesdeadlines') {
                const SeasonalData = require('./models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                return await interaction.showModal(manageCommand.buildSeasonTitlesDeadlinesModal(seasonalDoc));
            }
            if (targetPage === 'season_wipe') {
                return await interaction.showModal(manageCommand.buildWipeSeasonModal());
            }

            await interaction.deferUpdate();
            const { sendV2Payload } = require('./utils/sendV2Payload');
            return sendV2Payload(interaction, manageCommand.buildManagePage(targetPage));
        }

        // E. MANAGE PANEL DISAMBIGUATION SELECT -- shown by the `mng_search_` modal-submit handler
        // (below) when a search query matched more than one item. Looks the pick up directly by
        // _id (encoded in the option value, `|type` appended for draws since those need to know
        // which of the two arrays they came from) rather than re-running the fuzzy search, then
        // hands off to the same resolveManagePanelAction() the single-match fast path uses.
        if (interaction.customId.startsWith('mng_pick_')) {
            const [group, action] = parseMngId(interaction.customId.replace('mng_pick_', ''));
            const [id, type] = interaction.values[0].split('|');

            let match = null;
            if (group === 'draws') {
                const SeasonalData = require('./models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                const doc = type === 'new'
                    ? seasonalDoc.newDraws.find(d => d._id.toString() === id)
                    : seasonalDoc.returningDraws.find(d => d._id.toString() === id);
                if (doc) match = { id, type, doc, label: `${doc.title} (${type === 'new' ? 'New' : 'Returning'})` };
            } else if (group === 'calendar') {
                const SeasonalData = require('./models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                const doc = seasonalDoc.calendar.find(e => e._id.toString() === id);
                if (doc) match = { id, doc, label: doc.title };
            } else if (group === 'loadouts_mp' || group === 'loadouts_dmz') {
                const Loadout = require('./models/Loadout');
                const doc = await Loadout.findById(id).lean();
                if (doc) match = { id, doc, label: `${doc.weaponName} - ${doc.buildName}` };
            }

            if (!match) {
                // Awaited + wrapped in its own try/catch -- see the matching note elsewhere in this
                // handler. Shouldn't normally happen (the pick came from a list built moments ago),
                // but the underlying doc could've been deleted/edited away in between.
                try {
                    await interaction.update({ content: '❌ That item no longer exists -- it may have been changed or removed since you searched.', components: [] });
                } catch (notifyError) {
                    console.error('Failed to notify user of stale manage-panel pick (interaction likely expired):', notifyError);
                }
                return;
            }

            return await resolveManagePanelAction(interaction, group, action, match);
        }
    }

    // ==========================================
    // --- STEP 6.4: BUTTON INTERCEPTORS ---
    // ==========================================
    if (interaction.isButton()) {

        // DRAW PRICES REGION TOGGLE BUTTON -- replaced the old select-menu ('select_price_region')
        // with a single toggle button per Harkirat's drawPrices_ui.json redesign. custom_id encodes
        // the region to SWITCH TO directly (drawprices.js always labels/IDs the button with the
        // other region), so no values[] to read. Deliberately NOT prefixed `toggle_` -- that prefix
        // is claimed by the generic /settings binary-toggle handler further down
        // (`customId.startsWith('toggle_')`), which expects a `|{userId}` suffix; a bare
        // `toggle_price_region_10` would have matched that check first, found no userId to compare
        // against, and always hit its "Action Blocked" branch (caught during a bug-check pass before
        // ever being pushed, not found live). Persists to prefs.defaultRegion same as calendar's
        // active/all filter toggle -- the picked region becomes the new default every subsequent
        // /draw prices lands on until changed again.
        if (interaction.customId === 'price_region_10' || interaction.customId === 'price_region_30') {
            await interaction.deferUpdate();
            const selectedRegion = interaction.customId === 'price_region_10' ? 'region_10' : 'region_30';

            const UserPreference = require('./models/UserPreference');
            let prefs = await UserPreference.findOne({ discordId: interaction.user.id });
            if (!prefs) prefs = new UserPreference({ discordId: interaction.user.id });
            prefs.defaultRegion = selectedRegion;
            await prefs.save();

            const pricesCommand = client.commands.get('draw');
            // Re-use the existing render path (rest.patch on @original), just with the newly picked region
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await pricesCommand.execute(syntheticInteraction, selectedRegion);
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
            const { SHARE_BUTTON_CUSTOM_ID } = require('./utils/shareButton');
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
            const { sendV2Payload } = require('./utils/sendV2Payload');
            return sendV2Payload(interaction, components, { content: msg.content || '', embeds, flags });
        }

        // A. SETTINGS BINARY TOGGLE BUTTONS (Public/Private & Region defaults)
        if (interaction.customId.startsWith('toggle_')) {
            await interaction.deferUpdate(); // Defer to permanently safeguard against API 10062 timeouts
            const [actionStr, targetUserId] = interaction.customId.split('|');

            // SECURITY GATEWAY WALL: Block rogue server members from attempting to adjust another user's preference canvas
            if (interaction.user.id !== targetUserId) {
                // Awaited + wrapped in its own try/catch -- see the matching note above.
                try {
                    await interaction.followUp({ content: "❌ **Action Blocked:** You do not possess authorization to alter option nodes on this account dashboard profile.", ephemeral: true });
                } catch (notifyError) {
                    console.error('Failed to notify user of blocked settings action (interaction likely expired):', notifyError);
                }
                return;
            }

            const action = actionStr.replace('toggle_', ''); // Strip prefix to catch clean string maps
            const UserPreference = require('./models/UserPreference');

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
            if (action === 'region_10') prefs.defaultRegion = 'region_10';
            if (action === 'region_30') prefs.defaultRegion = 'region_30';

            await prefs.save(); // Write preferences live to the Atlas cluster

            // LIVE RE-DRAW ROUTE: Call the settings engine module to rewrite the canvas on screen
            const settingsCommand = client.commands.get('settings');
            return await settingsCommand.execute(interaction);
        }

        // B. DRAWS PAGINATION (New vs Returning)
        if (interaction.customId === 'page_returning_draws' || interaction.customId === 'page_new_draws') {
            await interaction.deferUpdate();
            const targetPage = interaction.customId === 'page_returning_draws' ? 'returning' : 'new';
            const drawsCommand = client.commands.get('draws');

            // Build synthetic routing payload
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await drawsCommand.execute(syntheticInteraction, targetPage);
        }

        // B.2 DRAWS SUB-PAGE PAGINATION (Prev/Next within a category, once it exceeds CHUNK_SIZE)
        // custom_id format: subpage_<new|returning>_<targetIndex>, e.g. "subpage_new_2"
        if (interaction.customId.startsWith('subpage_new_') || interaction.customId.startsWith('subpage_returning_')) {
            await interaction.deferUpdate();
            const isNewCategory = interaction.customId.startsWith('subpage_new_');
            const targetPage = isNewCategory ? 'new' : 'returning';
            const targetSubPage = parseInt(interaction.customId.replace(isNewCategory ? 'subpage_new_' : 'subpage_returning_', ''), 10) || 0;
            const drawsCommand = client.commands.get('draws');

            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await drawsCommand.execute(syntheticInteraction, targetPage, targetSubPage);
        }

        // B.3 CALENDAR SUB-PAGE PAGINATION (Prev/Next, once event list exceeds CHUNK_SIZE)
        // custom_id format: calsubpage_<targetIndex>, e.g. "calsubpage_1"
        if (interaction.customId.startsWith('calsubpage_') && interaction.customId !== 'calsubpage_indicator') {
            await interaction.deferUpdate();
            const targetSubPage = parseInt(interaction.customId.replace('calsubpage_', ''), 10) || 0;
            const calendarCommand = client.commands.get('calendar');

            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await calendarCommand.execute(syntheticInteraction, targetSubPage);
        }

        // B.4 CALENDAR EVENT-FILTER TOGGLE ("Show All Events" <-> "Show Active Events Only")
        // Persisted straight to UserPreference.calendarEventFilter -- deliberately NOT a /settings
        // toggle (Harkirat's request), so this is the only place that field ever gets written.
        // Resets to sub-page 0 on every toggle since the filtered event count (and therefore chunk
        // layout) changes along with the filter.
        if (interaction.customId === 'calendar_filter_all' || interaction.customId === 'calendar_filter_active') {
            await interaction.deferUpdate();
            const targetFilter = interaction.customId === 'calendar_filter_all' ? 'all' : 'active';

            const UserPreference = require('./models/UserPreference');
            let prefs = await UserPreference.findOne({ discordId: interaction.user.id });
            if (!prefs) prefs = new UserPreference({ discordId: interaction.user.id });
            prefs.calendarEventFilter = targetFilter;
            await prefs.save();

            const calendarCommand = client.commands.get('calendar');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await calendarCommand.execute(syntheticInteraction, 0, targetFilter);
        }

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
            const targetCommand = client.commands.get(targetCommandName);

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
                    // interaction.options.getBoolean('ephemeral'), which would otherwise throw
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
            const Loadout = require('./models/Loadout');
            const { buildLoadoutCard, getMpCategoryAccent } = require('./utils/loadoutRender');
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

            // Reassemble the updated visual frame card for the new page. MP's accent color is
            // resolved per-category (see utils/loadoutRender.js's MP_CATEGORY_ACCENT) same as the
            // initial /all + /<category> render, so paging Prev/Next doesn't flip the card back to
            // the old flat color -- DMZ keeps its own separate fixed identity color, unaffected by
            // this MP-specific category mapping.
            const cardPayload = buildLoadoutCard(matchingBuilds, newIndex, isDmz
                ? { color: 1842204, idPrefix: 'dmz', isEphemeral } // #1c1c1c
                : { color: getMpCategoryAccent(matchingBuilds[0].category), idPrefix: 'mp', isEphemeral });

            const { sendV2Payload } = require('./utils/sendV2Payload');
            return await sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
        }

        // F. MANAGE PANEL -- action buttons (2026-07-09 redesign, rebuilt again 2026-07-12 per the
        // 4 mockup JSONs -- see manage.js's buildManagePage/build*Modal helpers). /manage opens one
        // ephemeral panel message, and every data-entry action is reached by clicking a button on
        // it instead of picking a subcommand. Page switching itself is a select menu (`mng_pagesel`,
        // handled in the isStringSelectMenu() block above) rather than a row of nav buttons, since a
        // button row caps out at 5 sections and this panel has more than that.
        if (interaction.customId.startsWith('mng_act_')) {
            const [group, action] = parseMngId(interaction.customId.replace('mng_act_', ''));
            const manageCommand = client.commands.get('manage');
            const isLoadoutsGroup = group === 'loadouts_mp' || group === 'loadouts_dmz';
            const loadoutMode = group === 'loadouts_mp' ? 'MP' : 'DMZ';

            // Edit/Delete need a specific item picked first -- a button can't autocomplete the way
            // a slash-command option could, so these open a one-field "search by name" modal
            // instead of the real edit/delete modal directly. Resolved in this file's
            // `mng_search_` modal-submit handler further down. (Patch Notes has no edit/delete
            // button anymore -- see its dateinfo/urls1/urls2 branch below.)
            if (action === 'edit' || action === 'delete') {
                return await interaction.showModal(manageCommand.buildSearchModal(group, action));
            }

            // "Purge" (draws/calendar/patchnotes only -- Loadouts deliberately has none, see
            // manage.js's PURGE_LABELS note) needs a second confirmation before it actually deletes
            // anything -- a single misclick on a destructive button shouldn't be enough to wipe a
            // whole collection. This first click just shows a Confirm/Cancel prompt; the actual
            // deletion only happens from `mng_purgeconfirm_` below.
            if (action === 'purge') {
                return interaction.reply({
                    content: `⚠️ **Are you sure?** This will permanently delete ${manageCommand.PURGE_LABELS[group]}. This cannot be undone.`,
                    components: [{
                        type: 1, components: [
                            { type: 2, style: 4, label: 'Yes, Purge', custom_id: `mng_purgeconfirm_${group}` },
                            { type: 2, style: 2, label: 'Cancel', custom_id: `mng_purgecancel_${group}` }
                        ]
                    }],
                    ephemeral: true
                });
            }

            if (group === 'draws') {
                if (action === 'addnew') return await interaction.showModal(manageCommand.buildAddDrawModal('new'));
                if (action === 'addreturning') return await interaction.showModal(manageCommand.buildAddDrawModal('returning'));
                // Add Multiple (additive) vs Bulk Replace (destructive) share the same modal shape
                // and parser -- only what index.js's submit handler does with the parsed result
                // differs (push vs wholesale-replace). `mode` ('add'/'replace') rides in the
                // modal's own custom_id, set by manage.js's buildBulkDrawsModal/buildBulkBothDrawsModal.
                if (action === 'bulkaddnew') return await interaction.showModal(manageCommand.buildBulkDrawsModal(true, 'add'));
                if (action === 'bulkaddreturning') return await interaction.showModal(manageCommand.buildBulkDrawsModal(false, 'add'));
                if (action === 'bulkaddeither') return await interaction.showModal(manageCommand.buildBulkBothDrawsModal('add'));
                if (action === 'bulkreplacenew') return await interaction.showModal(manageCommand.buildBulkDrawsModal(true, 'replace'));
                if (action === 'bulkreplacereturning') return await interaction.showModal(manageCommand.buildBulkDrawsModal(false, 'replace'));
                if (action === 'bulkreplaceeither') return await interaction.showModal(manageCommand.buildBulkBothDrawsModal('replace'));
                if (action === 'bulkdeletenew') return await interaction.showModal(manageCommand.buildBulkRemoveDrawsModal('new'));
                if (action === 'bulkdeletereturning') return await interaction.showModal(manageCommand.buildBulkRemoveDrawsModal('returning'));
                if (action === 'bulkdeleteeither') return await interaction.showModal(manageCommand.buildBulkRemoveDrawsModal('either'));

                // Export -- replies directly with the exported file, no modal, nothing to submit.
                // Now lives INSIDE the Draws page itself (2026-07-12) rather than a separate Export
                // page, reusing the same bulk-import-compatible formatter as before.
                if (action === 'exportnew' || action === 'exportreturning') {
                    const SeasonalData = require('./models/SeasonalData');
                    const { formatDrawsAsBulkText } = require('./utils/adminParser');
                    const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                    const isNew = action === 'exportnew';
                    const text = formatDrawsAsBulkText(isNew ? seasonalDoc?.newDraws || [] : seasonalDoc?.returningDraws || []) || `(no ${isNew ? 'New' : 'Returning'} Draws currently saved)`;
                    return interaction.reply({
                        content: `📤 **Exported ${isNew ? 'New' : 'Returning'} Draws** in Bulk Add format. Paste this back into the matching Bulk action.`,
                        files: [{ attachment: Buffer.from(text, 'utf-8'), name: `${isNew ? 'new' : 'returning'}_draws_bulk.txt` }],
                        ephemeral: true
                    });
                }
            }

            if (group === 'calendar') {
                if (action === 'add') return await interaction.showModal(manageCommand.buildCalendarAddModal());
                if (action === 'addmultiple') return await interaction.showModal(manageCommand.buildCalendarBulkModal('add'));
                if (action === 'replacemultiple') return await interaction.showModal(manageCommand.buildCalendarBulkModal('replace'));
                if (action === 'deletemultiple') return await interaction.showModal(manageCommand.buildCalendarBulkRemoveModal());
                if (action === 'export') {
                    const SeasonalData = require('./models/SeasonalData');
                    const { formatCalendarAsBulkText } = require('./utils/adminParser');
                    const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                    const text = formatCalendarAsBulkText(seasonalDoc?.calendar || []) || '(no calendar events currently saved)';
                    return interaction.reply({
                        content: `📤 **Exported Calendar** in Bulk Add format. Paste this back into the Replace action.`,
                        files: [{ attachment: Buffer.from(text, 'utf-8'), name: 'calendar_bulk.txt' }],
                        ephemeral: true
                    });
                }
            }

            if (isLoadoutsGroup) {
                if (action === 'add') return await interaction.showModal(manageCommand.buildAddLoadoutModal(loadoutMode));
                if (action === 'bulkadd') return await interaction.showModal(manageCommand.buildLoadoutsBulkAddModal(loadoutMode));
                // "Replace Multiple" reuses the exact same upsert-by-name modal as "Add Multiple" for
                // now -- the upsert behavior (update in place if that build already exists, insert
                // if not) already covers "replace" semantics for anything you paste back in. The
                // real search-then-pick-from-a-list interaction described in the mockup is the
                // deferred future work (see this file's top-of-file note) -- Harkirat's explicit
                // call was to hold that off until the rest of this panel redesign lands cleanly.
                if (action === 'bulkreplace') return await interaction.showModal(manageCommand.buildLoadoutsBulkAddModal(loadoutMode));
                if (action === 'bulkdelete') return await interaction.showModal(manageCommand.buildLoadoutsBulkRemoveModal(loadoutMode));
                if (action === 'exportupto5') return await interaction.showModal(manageCommand.buildLoadoutsExportUpTo5Modal(loadoutMode));
                if (action === 'exportcategory') return await interaction.showModal(manageCommand.buildLoadoutsExportCategoryModal(loadoutMode));
                if (action === 'exportall') {
                    const Loadout = require('./models/Loadout');
                    const { formatLoadoutsAsBulkText } = require('./utils/adminParser');
                    const loadouts = await Loadout.find({ mode: loadoutMode }).lean();
                    const text = formatLoadoutsAsBulkText(loadouts) || `(no ${loadoutMode} loadouts currently saved)`;
                    return interaction.reply({
                        content: `📤 **Exported all ${loadoutMode} loadouts** in Bulk Add format. Paste this back into the Bulk Add action.`,
                        files: [{ attachment: Buffer.from(text, 'utf-8'), name: `${loadoutMode.toLowerCase()}_loadouts_bulk.txt` }],
                        ephemeral: true
                    });
                }
            }

            // Patch Notes now operates on a single "current" entry (the last item in patchNotes[],
            // the one whose title stays synced to currentSeasonTitle) rather than add-a-new-entry or
            // search-and-edit -- see manage.js's buildPatchDateInfoModal/buildPatchUrlsModal. If no
            // entry exists yet at all, these modals just open blank/empty; the submit handler below
            // creates the first entry the first time any of the three is actually submitted.
            if (group === 'patchnotes') {
                const SeasonalData = require('./models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
                const currentEntry = seasonalDoc?.patchNotes?.length ? seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1] : null;
                if (action === 'dateinfo') return await interaction.showModal(manageCommand.buildPatchDateInfoModal(currentEntry));
                if (action === 'urls1') return await interaction.showModal(manageCommand.buildPatchUrlsModal(1, currentEntry));
                if (action === 'urls2') return await interaction.showModal(manageCommand.buildPatchUrlsModal(2, currentEntry));
            }
        }

        // G. MANAGE PANEL: PURGE CONFIRM / CANCEL -- the second step of the two-tap confirmation
        // above. Each group purges only its OWN data, independent of Season's "Wipe Season" (which
        // resets draws+calendar together as part of starting a new season but deliberately keeps
        // patch notes forever) -- Patch Notes' purge in particular is the one place that history can
        // actually be cleared, and only ever fires from this exact confirmed click.
        if (interaction.customId.startsWith('mng_purgeconfirm_')) {
            const group = interaction.customId.replace('mng_purgeconfirm_', '');
            let confirmMsg = '';

            if (group === 'draws') {
                const SeasonalData = require('./models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
                seasonalDoc.newDraws = [];
                seasonalDoc.returningDraws = [];
                await seasonalDoc.save();
                confirmMsg = '✅ Purged all New and Returning draws.';
            } else if (group === 'calendar') {
                const SeasonalData = require('./models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
                seasonalDoc.calendar = [];
                await seasonalDoc.save();
                confirmMsg = '✅ Purged the calendar.';
            } else if (group === 'loadouts') {
                const Loadout = require('./models/Loadout');
                await Loadout.deleteMany({});
                confirmMsg = '✅ Purged every MP and DMZ loadout.';
            } else if (group === 'patchnotes') {
                const SeasonalData = require('./models/SeasonalData');
                const seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
                seasonalDoc.patchNotes = [];
                await seasonalDoc.save();
                confirmMsg = '✅ Purged the patch notes history.';
            }

            // Awaited + wrapped in its own try/catch -- see the matching note elsewhere in this
            // handler for why a bare `return interaction.update(...)` isn't safe here.
            try {
                await interaction.update({ content: confirmMsg, components: [] });
            } catch (notifyError) {
                console.error(`Failed to confirm manage-panel purge for ${group} (interaction likely expired):`, notifyError);
            }
            return;
        }

        if (interaction.customId.startsWith('mng_purgecancel_')) {
            try {
                await interaction.update({ content: '❎ Purge cancelled -- nothing was deleted.', components: [] });
            } catch (notifyError) {
                console.error('Failed to confirm manage-panel purge cancellation (interaction likely expired):', notifyError);
            }
            return;
        }
    }

    // ==========================================
    // --- STEP 6.5: MODAL SUBMITS (ADMIN FORMS) ---
    // ==========================================
    // This block catches all form submissions from the /update and /manage command overlay modals.
    // It processes natural language dates, auto-sorts chronological arrays, and syncs to MongoDB.
    if (interaction.isModalSubmit()) {
        const { customId } = interaction;
        const SeasonalData = require('./models/SeasonalData');
        const Loadout = require('./models/Loadout');
        // Hoisted once here instead of being re-required with a different destructured subset in
        // nearly every branch below (all inside the same already-required module scope).
        const { parseAdminDate, toTitleCase, resolveTier, parseItemLine, parseBulkDrawList, parseBulkEvents, parseLoadoutBadges, parseBulkLoadoutList, splitTitleDate, formatAdminDate } = require('./utils/adminParser');
        const { fuzzyMatch } = require('./utils/search');

        // --- MANAGE PANEL: SEARCH RESOLVER (Edit/Delete) ---
        // Handles its own per-group fetching via resolveManagePanelMatches (defined above, near
        // buildSyntheticInteraction) rather than the shared seasonalDoc gate below, and always
        // returns before reaching it -- see manage.js's buildSearchModal for where this modal comes
        // from (opened when Edit/Delete is clicked on the panel, since a button can't autocomplete
        // like a slash option could).
        if (customId.startsWith('mng_search_')) {
            const [group, action] = parseMngId(customId.replace('mng_search_', ''));
            const query = interaction.fields.getTextInputValue('query');
            const matches = await resolveManagePanelMatches(group, query);

            if (matches.length === 0) {
                return interaction.reply({ content: `❌ No matches found for "${query}".`, ephemeral: true });
            }

            if (matches.length === 1) {
                return await resolveManagePanelAction(interaction, group, action, matches[0]);
            }

            // Multiple matches -- disambiguate via a select menu rather than guessing which one was
            // meant. NOTE (Components V2 lesson, see CLAUDE.md): a select menu (type 3) still needs
            // an Action Row (type 1) wrapper, even though this particular reply isn't a V2 container.
            const options = matches.map(m => ({
                label: m.label.slice(0, 100),
                value: group === 'draws' ? `${m.id}|${m.type}` : m.id
            }));
            return interaction.reply({
                content: `🔎 Found **${matches.length}** matches for "${query}" -- pick one:`,
                components: [{ type: 1, components: [{ type: 3, custom_id: `mng_pick_${group}_${action}`, placeholder: 'Select one...', options }] }],
                ephemeral: true
            });
        }

        // NOTE (fixed during review): this used to fetch unconditionally before branching on
        // customId, but the loadout-only routes below never touch seasonalDoc at all -- every
        // loadout modal submit was paying for a wasted findOne (and a throwaway `new
        // SeasonalData()` construction on a fresh install). Only fetch it for the branches that
        // actually use it. Loadout custom_ids all carry a mode suffix now (`add_loadout_MP`,
        // `modal_loadouts_bulk_add_DMZ`, etc. -- 2026-07-12 MP/DMZ page split), so this checks
        // prefixes rather than an exact-match list.
        const isLoadoutOnlyRoute = customId.startsWith('edit_loadout_') || customId.startsWith('add_loadout_')
            || customId.startsWith('modal_loadouts_bulk_add_') || customId.startsWith('modal_loadouts_bulk_remove_')
            || customId.startsWith('modal_loadouts_export5_') || customId.startsWith('modal_loadouts_exportcategory_');
        let seasonalDoc = null;
        if (!isLoadoutOnlyRoute) {
            seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
            if (!seasonalDoc) seasonalDoc = new SeasonalData({ docType: 'global' });
        }

        // --- ADMIN ROUTE A: WIPE SEASON DATA ---
        if (customId === 'modal_wipe_season') {
            await interaction.deferReply({ ephemeral: true });
            seasonalDoc.currentSeasonTitle = interaction.fields.getTextInputValue('season_title').trim();
            seasonalDoc.newDraws = [];
            seasonalDoc.returningDraws = [];
            seasonalDoc.calendar = [];
            // Note: We preserve patch notes history for the dropdown archive
            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Success:** Purged old data and initialized **${seasonalDoc.currentSeasonTitle}**!` });
        }

        // --- ADMIN ROUTE B: BULK ADD/REPLACE DRAWS (WITH AUTO-SORT, New/Returning split) ---
        // custom_id is `modal_draws_bulk_{add|replace}_{new|returning}` -- `mode` distinguishes the
        // NEW additive behavior (appends onto the existing array) from the pre-existing REPLACE
        // behavior (wholesale-overwrites it), added 2026-07-12 so "Add Multiple" and "Bulk Replace"
        // can be two distinct buttons instead of only ever replacing. Each modal still only ever
        // touches ITS OWN array -- re-running the New Draws import to fix a typo doesn't touch
        // seasonalDoc.returningDraws at all. See utils/adminParser.js's parseBulkDrawList.
        // NOTE (fixed during bug-check review): excludes `_both` -- `modal_draws_bulk_add_both`
        // starts with `modal_draws_bulk_add_` too, so without this guard the Either/Both submission
        // was getting caught here first (before ever reaching ROUTE B.1's dedicated `_both` handler
        // below) and calling `getTextInputValue('bulk_text')` on a modal that only has
        // `new_text`/`returning_text` fields -- a guaranteed runtime error on every "Bulk Add
        // Either/Both" or "Bulk Replace Either/Both" submission, caught here before ever being
        // pushed live.
        if ((customId.startsWith('modal_draws_bulk_add_') || customId.startsWith('modal_draws_bulk_replace_')) && !customId.endsWith('_both')) {
            await interaction.deferReply({ ephemeral: true });
            const mode = customId.startsWith('modal_draws_bulk_add_') ? 'add' : 'replace';
            const isNew = customId.endsWith('_new');
            const bulkText = interaction.fields.getTextInputValue('bulk_text');
            const parsedDraws = parseBulkDrawList(bulkText);

            const existingArray = isNew ? seasonalDoc.newDraws : seasonalDoc.returningDraws;
            const finalArray = mode === 'add' ? [...existingArray, ...parsedDraws] : parsedDraws;
            finalArray.sort((a, b) => new Date(a.date) - new Date(b.date));
            if (isNew) seasonalDoc.newDraws = finalArray;
            else seasonalDoc.returningDraws = finalArray;

            await seasonalDoc.save();
            const verb = mode === 'add' ? 'Added' : 'Replaced';
            return interaction.followUp({ content: `✅ **Bulk ${mode === 'add' ? 'Add' : 'Replace'} Complete!**\n${verb} ${parsedDraws.length} entries in the ${isNew ? 'New' : 'Returning'} Draws list (now **${finalArray.length}** total). Sorted chronologically.` });
        }

        // --- ADMIN ROUTE B.1: BULK ADD/REPLACE BOTH DRAW CATEGORIES AT ONCE ---
        // custom_id is `modal_draws_bulk_{add|replace}_both`. One modal, two independently-optional
        // fields -- only whichever field was actually filled in gets touched, exactly like the two
        // separate flows above. Lets Harkirat update both lists in one round-trip without
        // reintroducing the old type-prefixed combined-modal bug (see parseBulkDrawList's history
        // note) since each array is still touched independently.
        if (customId === 'modal_draws_bulk_add_both' || customId === 'modal_draws_bulk_replace_both') {
            await interaction.deferReply({ ephemeral: true });
            const mode = customId === 'modal_draws_bulk_add_both' ? 'add' : 'replace';
            const newText = interaction.fields.getTextInputValue('new_text')?.trim();
            const returningText = interaction.fields.getTextInputValue('returning_text')?.trim();

            const updated = [];
            if (newText) {
                const parsedNew = parseBulkDrawList(newText);
                const finalNew = mode === 'add' ? [...seasonalDoc.newDraws, ...parsedNew] : parsedNew;
                finalNew.sort((a, b) => new Date(a.date) - new Date(b.date));
                seasonalDoc.newDraws = finalNew;
                updated.push(`New Draws (${finalNew.length} total)`);
            }
            if (returningText) {
                const parsedReturning = parseBulkDrawList(returningText);
                const finalReturning = mode === 'add' ? [...seasonalDoc.returningDraws, ...parsedReturning] : parsedReturning;
                finalReturning.sort((a, b) => new Date(a.date) - new Date(b.date));
                seasonalDoc.returningDraws = finalReturning;
                updated.push(`Returning Draws (${finalReturning.length} total)`);
            }

            if (updated.length === 0) {
                return interaction.followUp({ content: '❌ Both fields were left blank -- nothing was changed.' });
            }

            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Bulk ${mode === 'add' ? 'Add' : 'Replace'} Complete!**\n${mode === 'add' ? 'Added onto' : 'Replaced'}: ${updated.join(', ')}.` });
        }

        // --- ADMIN ROUTE B.2: BULK DELETE DRAWS ---
        // custom_id is `modal_draws_bulk_remove_{new|returning|either}` -- only the field(s) that
        // variant's modal actually included exist on `interaction.fields`, so this reads the type
        // from the custom_id rather than blindly calling getTextInputValue on both (which throws for
        // a field that isn't on the modal). Fuzzy-matches each pasted title (utils/search.js's
        // fuzzyMatch, same punctuation-insensitive matching used everywhere else in the bot) against
        // the target array and removes hits -- reports both what was removed and what didn't match
        // anything, so a typo'd title doesn't just silently do nothing.
        if (customId.startsWith('modal_draws_bulk_remove_')) {
            await interaction.deferReply({ ephemeral: true });
            const drawType = customId.replace('modal_draws_bulk_remove_', ''); // 'new' | 'returning' | 'either'
            const newTitlesRaw = drawType !== 'returning' ? interaction.fields.getTextInputValue('new_titles')?.trim() : '';
            const returningTitlesRaw = drawType !== 'new' ? interaction.fields.getTextInputValue('returning_titles')?.trim() : '';

            const removeFrom = (array, titlesRaw) => {
                const requested = titlesRaw.split('\n').map(t => t.trim()).filter(Boolean);
                const removed = [];
                const notFound = [];
                let remaining = array;
                for (const title of requested) {
                    const match = remaining.find(d => fuzzyMatch(title, d.title));
                    if (match) {
                        removed.push(match.title);
                        remaining = remaining.filter(d => d !== match);
                    } else {
                        notFound.push(title);
                    }
                }
                return { remaining, removed, notFound };
            };

            const summary = [];
            if (newTitlesRaw) {
                const { remaining, removed, notFound } = removeFrom(seasonalDoc.newDraws, newTitlesRaw);
                seasonalDoc.newDraws = remaining;
                if (removed.length) summary.push(`Removed from New: ${removed.join(', ')}`);
                if (notFound.length) summary.push(`⚠️ Not found in New: ${notFound.join(', ')}`);
            }
            if (returningTitlesRaw) {
                const { remaining, removed, notFound } = removeFrom(seasonalDoc.returningDraws, returningTitlesRaw);
                seasonalDoc.returningDraws = remaining;
                if (removed.length) summary.push(`Removed from Returning: ${removed.join(', ')}`);
                if (notFound.length) summary.push(`⚠️ Not found in Returning: ${notFound.join(', ')}`);
            }

            if (summary.length === 0) {
                return interaction.followUp({ content: '❌ Nothing was entered -- nothing was removed.' });
            }

            await seasonalDoc.save();
            return interaction.followUp({ content: `🗑️ **Bulk Delete Complete!**\n${summary.join('\n')}` });
        }

        // --- ADMIN ROUTE C: BULK ADD/REPLACE CALENDAR EVENTS ---
        // custom_id is `modal_calendar_bulk_{add|replace}` -- `add` (new 2026-07-12, "Add Multiple")
        // appends onto the existing calendar; `replace` is the pre-existing wholesale-overwrite
        // behavior ("Replace Multiple"). Parses a bulk bullet-separated paste — "M/D - M/D | Title"
        // or "M/D - All Season | Title" — into { title, startDate, endDate, isOngoing } objects via
        // parseBulkEvents either way.
        if (customId === 'modal_calendar_bulk_add' || customId === 'modal_calendar_bulk_replace') {
            await interaction.deferReply({ ephemeral: true });
            const mode = customId === 'modal_calendar_bulk_add' ? 'add' : 'replace';
            const bulkText = interaction.fields.getTextInputValue('bulk_text');
            const parsedEvents = parseBulkEvents(bulkText);

            const newEventDocs = parsedEvents.map(e => ({
                title: e.title,
                date: e.startDate,
                endDate: e.isOngoing ? null : e.endDate,
                isOngoing: e.isOngoing
            }));

            seasonalDoc.calendar = mode === 'add' ? [...seasonalDoc.calendar, ...newEventDocs] : newEventDocs;

            // AUTO-SORT: Keep the timeline in chronological order
            seasonalDoc.calendar.sort((a, b) => new Date(a.date) - new Date(b.date));

            await seasonalDoc.save();
            const verb = mode === 'add' ? 'Added' : 'Replaced the calendar with';
            return interaction.followUp({ content: `✅ **Bulk Calendar ${mode === 'add' ? 'Add' : 'Replace'} Complete!**\n${verb} ${newEventDocs.length} events (now **${seasonalDoc.calendar.length}** total). Sorted chronologically.` });
        }

        // --- ADMIN ROUTE C.1: BULK REMOVE CALENDAR EVENTS ---
        // Same fuzzy-match-and-report convention as the draws bulk-remove route above.
        if (customId === 'modal_calendar_bulk_remove') {
            await interaction.deferReply({ ephemeral: true });
            const requested = interaction.fields.getTextInputValue('titles').split('\n').map(t => t.trim()).filter(Boolean);

            const removed = [];
            const notFound = [];
            let remaining = seasonalDoc.calendar;
            for (const title of requested) {
                const match = remaining.find(e => fuzzyMatch(title, e.title));
                if (match) {
                    removed.push(match.title);
                    remaining = remaining.filter(e => e !== match);
                } else {
                    notFound.push(title);
                }
            }
            seasonalDoc.calendar = remaining;
            await seasonalDoc.save();

            let confirmation = `🗑️ **Bulk Remove Complete!**`;
            if (removed.length) confirmation += `\nRemoved: ${removed.join(', ')}`;
            if (notFound.length) confirmation += `\n⚠️ Not found: ${notFound.join(', ')}`;
            return interaction.followUp({ content: confirmation });
        }

        // --- ADMIN ROUTE C.2: ADD SINGLE CALENDAR EVENT ---
        // A blank End Date means the event runs until the Battle Pass ends (isOngoing), same
        // semantics as the bulk parser's "All Season" handling -- see parseBulkEvents.
        if (customId === 'modal_calendar_add') {
            await interaction.deferReply({ ephemeral: true });
            const title = interaction.fields.getTextInputValue('title').trim();
            const startDate = parseAdminDate(interaction.fields.getTextInputValue('start_date'));
            const endDateStr = interaction.fields.getTextInputValue('end_date')?.trim();
            const isOngoing = !endDateStr;
            const endDate = isOngoing ? null : parseAdminDate(endDateStr);

            seasonalDoc.calendar.push({ title, date: startDate, endDate, isOngoing });
            seasonalDoc.calendar.sort((a, b) => new Date(a.date) - new Date(b.date));
            await seasonalDoc.save();

            return interaction.followUp({ content: `✅ **Event Added!** ${title} added to the calendar.` });
        }

        // --- ADMIN ROUTE C.3: SAVE EDITED CALENDAR EVENT ---
        if (customId.startsWith('edit_calendar_')) {
            await interaction.deferReply({ ephemeral: true });
            const targetId = customId.replace('edit_calendar_', '');
            const targetEvent = seasonalDoc.calendar.find(e => e._id.toString() === targetId);

            if (targetEvent) {
                targetEvent.title = interaction.fields.getTextInputValue('title').trim();
                targetEvent.date = parseAdminDate(interaction.fields.getTextInputValue('start_date'));
                const endDateStr = interaction.fields.getTextInputValue('end_date')?.trim();
                targetEvent.isOngoing = !endDateStr;
                targetEvent.endDate = targetEvent.isOngoing ? null : parseAdminDate(endDateStr);

                seasonalDoc.calendar.sort((a, b) => new Date(a.date) - new Date(b.date));
                await seasonalDoc.save();
                return interaction.followUp({ content: `✅ **Event Updated Successfully!** ${targetEvent.title}` });
            }
        }

        // --- ADMIN ROUTE D: PATCH NOTES (single "current entry" model, 2026-07-12 redesign) ---
        // All 3 actions operate on the LAST item in patchNotes[] -- the one whose title stays synced
        // to currentSeasonTitle (see the Season Titles+Deadlines handler below) -- rather than a
        // search-and-pick flow. If none exists yet at all (fresh install, or right after a Wipe
        // Season), whichever of these 3 is submitted first creates it.
        const getOrCreateCurrentPatch = () => {
            if (seasonalDoc.patchNotes.length === 0) {
                seasonalDoc.patchNotes.push({ title: seasonalDoc.currentSeasonTitle || 'Untitled Season', description: '', releaseDate: new Date(), images: [] });
            }
            return seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1];
        };

        if (customId === 'modal_patch_dateinfo') {
            await interaction.deferReply({ ephemeral: true });
            const current = getOrCreateCurrentPatch();
            current.releaseDate = parseAdminDate(interaction.fields.getTextInputValue('release_date'));
            current.description = interaction.fields.getTextInputValue('description')?.trim() || '';
            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Patch Notes Date/Info Updated!** ${current.title}` });
        }

        if (customId === 'modal_patch_urls_1' || customId === 'modal_patch_urls_2') {
            await interaction.deferReply({ ephemeral: true });
            const slot = customId === 'modal_patch_urls_1' ? 1 : 2;
            const current = getOrCreateCurrentPatch();
            const rawUrls = interaction.fields.getTextInputValue('urls') || '';
            const newSlice = rawUrls.split(/[\n,]+/).map(url => url.trim()).filter(url => url.startsWith('http'));

            // URLs 1 owns images[0..4], URLs 2 owns images[5..9] -- each submit only replaces its own
            // half, preserving whatever the other slot has saved.
            const otherSlice = slot === 1 ? current.images.slice(5, 10) : current.images.slice(0, 5);
            current.images = slot === 1 ? [...newSlice, ...otherSlice] : [...otherSlice, ...newSlice];

            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Patch Notes URLs ${slot} Updated!** ${current.title} now has ${current.images.length} image(s) total.` });
        }

        // --- ADMIN ROUTE E: SEASON TITLES + DEADLINES (merged) ---
        // Replaces the old separate "/manage season titles" (4-title modal) and "Edit Season
        // Deadlines" (3-date modal) with one action -- each of the 3 deadline fields carries both a
        // title and an end date on one line ("Battle Pass, August 28"), split apart via
        // adminParser.js's splitTitleDate(). A blank line leaves that title+date pair untouched
        // (same partial-update convention the old deadlines modal already used).
        if (customId === 'modal_season_titles_deadlines') {
            await interaction.deferReply({ ephemeral: true });

            seasonalDoc.currentSeasonTitle = interaction.fields.getTextInputValue('main_title').trim();

            const applyLine = (line, titleField, dateField) => {
                const { title, dateStr } = splitTitleDate(line);
                if (title) seasonalDoc[titleField] = title;
                if (dateStr) seasonalDoc[dateField] = parseAdminDate(dateStr);
            };
            applyLine(interaction.fields.getTextInputValue('bp_line'), 'bpTitle', 'bpEnd');
            applyLine(interaction.fields.getTextInputValue('rank_line'), 'rankTitle', 'rankEnd');
            applyLine(interaction.fields.getTextInputValue('dmz_line'), 'dmzTitle', 'dmzEnd');

            // patchNotes[].title is captured independently at "Add Patch Notes" time (so older,
            // past-season entries keep their own historical title forever) -- but the MOST RECENT
            // entry always represents the season that's currently live, so keep it in sync here.
            // Without this, renaming a typo'd season title silently left the current patch notes
            // entry (and therefore the default /patch notes view) showing the old name.
            if (seasonalDoc.patchNotes.length > 0) {
                seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1].title = seasonalDoc.currentSeasonTitle;
            }

            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Season Titles & Deadlines Updated!** The \`/season end\` module has been synced.` });
        }

        // --- ADMIN ROUTE F: SAVE EDITED DRAW ---
        if (customId.startsWith('edit_draw_')) {
            await interaction.deferReply({ ephemeral: true });
            const [_, __, targetId, drawType] = customId.split('_');

            // Find and update the exact object in the array
            const arrayTarget = drawType === 'new' ? seasonalDoc.newDraws : seasonalDoc.returningDraws;
            const drawIndex = arrayTarget.findIndex(d => d._id.toString() === targetId);

            if (drawIndex > -1) {
                arrayTarget[drawIndex].title = toTitleCase(interaction.fields.getTextInputValue('title'));
                arrayTarget[drawIndex].date = parseAdminDate(interaction.fields.getTextInputValue('date'));
                arrayTarget[drawIndex].thumbnailUrl = interaction.fields.getTextInputValue('url');

                // Re-parse the text area items back into objects
                const rawItems = interaction.fields.getTextInputValue('items');
                arrayTarget[drawIndex].items = rawItems.split('\n').filter(l => l.trim().length > 0).map(parseItemLine);

                // Auto-sort to maintain order after edit
                arrayTarget.sort((a, b) => new Date(a.date) - new Date(b.date));
                await seasonalDoc.save();
                return interaction.followUp({ content: `✅ **Draw Updated Successfully!**` });
            }
        }

        // --- ADMIN ROUTE G: SAVE EDITED LOADOUT ---
        if (customId.startsWith('edit_loadout_')) {
            await interaction.deferReply({ ephemeral: true });
            const targetId = customId.replace('edit_loadout_', '');
            const Loadout = require('./models/Loadout');

            // Field is now "Category | Badges" (2 segments, not 3) -- Mode is no longer editable
            // through this modal at all (2026-07-12: MP/DMZ became separate panel pages, so there's
            // no "move a loadout to the other mode" action anymore) -- it's read straight off the
            // existing document instead. See manage.js's buildEditLoadoutModal + parseLoadoutBadges.
            const existingLoadout = await Loadout.findById(targetId).lean();
            const metaParts = interaction.fields.getTextInputValue('meta').split('|').map(s => s.trim());
            const attachmentsArray = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);
            let { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized } = parseLoadoutBadges(metaParts[1]);

            const weaponName = interaction.fields.getTextInputValue('weapon');
            const weaponKey = weaponName.toLowerCase().replace(/\s+/g, '');
            const buildName = interaction.fields.getTextInputValue('build');
            const mode = existingLoadout?.mode || 'MP';

            // DMZ never uses the per-category Best/TopN system -- a bare "best"/"topN" token (no
            // -close/-midlong suffix) still parses into categoryRank since the parser doesn't know
            // the mode, so move it over to dmzRangeRank here instead (see buildBadgesLine()).
            if (mode === 'DMZ' && categoryRank && !dmzRangeRank) {
                dmzRangeRank = categoryRank;
                categoryRank = null;
            }

            await Loadout.findByIdAndUpdate(targetId, {
                weaponName,
                weaponKey,
                buildName,
                attachments: attachmentsArray,
                imageKey: interaction.fields.getTextInputValue('image'),
                category: metaParts[0]?.toUpperCase() || 'AR',
                mode,
                isMeta,
                categoryRank,
                dmzRangeRank,
                isToxic
            });

            // NOTE (fixed during review): badges describe the WEAPON, not one specific build
            // variant -- setting "Meta" while editing Build 1 used to leave Build 2/3/etc. of the
            // same weapon showing no badge at all, which read as broken/inconsistent. Propagate the
            // same isMeta/categoryRank/dmzRangeRank/isToxic to every other build sharing this
            // weaponKey+mode. Only done on edit (not on creating a brand-new build) -- the
            // add-loadout modal has no badges pre-filled, so propagating from there would silently
            // wipe existing siblings' badges any time a new build is added without retyping them.
            const propagateResult = await Loadout.updateMany(
                { weaponKey, mode, _id: { $ne: targetId } },
                { isMeta, categoryRank, dmzRangeRank, isToxic }
            );

            let confirmation = `✅ **Loadout Updated Successfully!** ${weaponName} (${buildName})`;
            if (propagateResult.modifiedCount > 0) {
                confirmation += `\n-# Badges also synced to ${propagateResult.modifiedCount} other build(s) of this weapon.`;
            }
            if (unrecognized.length > 0) {
                confirmation += `\n⚠️ Badge input not recognized and ignored: \`${unrecognized.join(', ')}\`. Valid options: \`meta\`, \`best\`, \`toxic\`, \`topN\` (e.g. \`top3\`), or a DMZ range badge (\`bestclose\`, \`bestmidlong\`, \`top3close\`, \`top5midlong\`).`;
            }

            return interaction.followUp({ content: confirmation });
        }

        // --- ADMIN ROUTE H: SAVE NEW SINGLE DRAW ---
        if (customId === 'add_draw_new' || customId === 'add_draw_returning') {
            await interaction.deferReply({ ephemeral: true });
            const drawType = customId.replace('add_draw_', '');

            const title = interaction.fields.getTextInputValue('title');
            const dateStr = interaction.fields.getTextInputValue('date');
            const url = interaction.fields.getTextInputValue('url');

            // Parse items string block
            const rawItems = interaction.fields.getTextInputValue('items');
            const parsedItems = rawItems.split('\n').filter(l => l.trim().length > 0).map(parseItemLine);

            const newDrawObj = {
                title: toTitleCase(title),
                items: parsedItems,
                date: parseAdminDate(dateStr),
                thumbnailUrl: url
            };

            const arrayTarget = drawType === 'new' ? seasonalDoc.newDraws : seasonalDoc.returningDraws;
            arrayTarget.push(newDrawObj);

            // Auto-sort to maintain chronological order
            arrayTarget.sort((a, b) => new Date(a.date) - new Date(b.date));
            await seasonalDoc.save();

            return interaction.followUp({ content: `✅ **Successfully injected new draw: ${newDrawObj.title}!**` });
        }

        // --- ADMIN ROUTE I: SAVE NEW SINGLE LOADOUT --- custom_id: add_loadout_{MP|DMZ}
        if (customId.startsWith('add_loadout_')) {
            await interaction.deferReply({ ephemeral: true });
            const pageMode = customId.replace('add_loadout_', '');

            // Field is now "Category | Badges" (2 segments, not 3) -- Mode no longer has its own
            // modal field since the Add button itself is already MP/DMZ-scoped by which page it's on.
            const metaParts = interaction.fields.getTextInputValue('meta').split('|').map(s => s.trim());
            const attachmentsArray = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);
            // NOTE: unlike edit_loadout_ above, this does NOT propagate badges to sibling builds of
            // the same weapon -- this modal has nothing pre-filled, so a blank badges field here
            // (the common case when just adding another build variant) would silently wipe any
            // badges already set on the weapon's existing builds. Re-editing an existing build is
            // the supported way to (re)sync badges across all of a weapon's builds.
            let { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized } = parseLoadoutBadges(metaParts[1]);
            // DMZ never uses the per-category Best/TopN system -- see the matching note in
            // edit_loadout_ above.
            if (pageMode === 'DMZ' && categoryRank && !dmzRangeRank) {
                dmzRangeRank = categoryRank;
                categoryRank = null;
            }

            const newLoadout = new Loadout({
                weaponName: interaction.fields.getTextInputValue('weapon'),
                weaponKey: interaction.fields.getTextInputValue('weapon').toLowerCase().replace(/\s+/g, ''),
                buildName: interaction.fields.getTextInputValue('build'),
                attachments: attachmentsArray,
                imageKey: interaction.fields.getTextInputValue('image'),
                category: metaParts[0]?.toUpperCase() || 'AR',
                mode: pageMode,
                isMeta,
                categoryRank,
                dmzRangeRank,
                isToxic
            });

            await newLoadout.save();
            let confirmation = `✅ **Successfully saved Loadout: ${newLoadout.weaponName} (${newLoadout.buildName}, ${newLoadout.mode})!**`;
            if (unrecognized.length > 0) {
                confirmation += `\n⚠️ Badge input not recognized and ignored: \`${unrecognized.join(', ')}\`. Valid options: \`meta\`, \`best\`, \`toxic\`, \`topN\` (e.g. \`top3\`), or a DMZ range badge (\`bestclose\`, \`bestmidlong\`, \`top3close\`, \`top5midlong\`).`;
            }
            return interaction.followUp({ content: confirmation });
        }

        // --- ADMIN ROUTE K: BULK ADD/REPLACE LOADOUTS (upsert, never wholesale-replaces) ---
        // custom_id: modal_loadouts_bulk_add_{MP|DMZ} -- "Replace Multiple" also routes into this
        // exact same modal/handler for now (see the mng_act_ handler's comment on why), so this one
        // handler covers both buttons. Unlike the draws/calendar bulk routes above, this NEVER
        // wholesale-replaces the Loadout collection -- that would wipe every loadout in the database.
        // Each parsed block upserts by {weaponKey, mode, buildName}: updates in place if that exact
        // build already exists, inserts if not. `pageMode` (from the custom_id, i.e. which page this
        // modal was opened from) force-overrides every parsed entry's mode regardless of what's typed
        // in the pasted text's Mode field -- the page already scopes it, this just guards against a
        // stray mismatched Mode value silently filing a loadout under the wrong page. Badge
        // propagation afterward matches the single edit-loadout handler's convention (badges describe
        // the weapon, not one build variant). See adminParser.js's parseBulkLoadoutList() for the
        // text format.
        if (customId.startsWith('modal_loadouts_bulk_add_')) {
            await interaction.deferReply({ ephemeral: true });
            const pageMode = customId.replace('modal_loadouts_bulk_add_', '');
            const bulkText = interaction.fields.getTextInputValue('bulk_text');
            const { parsed, errors } = parseBulkLoadoutList(bulkText);

            let created = 0;
            let updated = 0;
            for (const rawEntry of parsed) {
                const entry = { ...rawEntry, mode: pageMode };
                const { weaponKey, mode, buildName } = entry;
                const existing = await Loadout.findOne({ weaponKey, mode, buildName });
                if (existing) {
                    await Loadout.updateOne({ _id: existing._id }, entry);
                    updated++;
                } else {
                    await new Loadout(entry).save();
                    created++;
                }
                // Weapon-level badges sync across every other build sharing this weaponKey+mode --
                // same reasoning as index.js's edit_loadout_ handler.
                await Loadout.updateMany(
                    { weaponKey, mode, buildName: { $ne: buildName } },
                    { isMeta: entry.isMeta, categoryRank: entry.categoryRank, dmzRangeRank: entry.dmzRangeRank, isToxic: entry.isToxic }
                );
            }

            let confirmation = `✅ **Bulk Loadout Import Complete!**\n${created} new build(s) added, ${updated} existing build(s) updated.`;
            if (errors.length > 0) {
                confirmation += `\n⚠️ ${errors.length} block(s) skipped:\n${errors.map(e => `- ${e}`).join('\n')}`;
            }
            return interaction.followUp({ content: confirmation });
        }

        // --- ADMIN ROUTE K.1: BULK DELETE LOADOUTS --- custom_id: modal_loadouts_bulk_remove_{MP|DMZ}
        // Lines are "Weapon" (removes every build of that weapon) or "Weapon | Build Name" (removes
        // just that one build) -- mode no longer needs its own line segment since it's fixed by which
        // page this modal was opened from. Fuzzy-matches the weapon name (utils/search.js's
        // fuzzyMatch) scoped to that mode, same matching convention as the draws/calendar bulk-remove
        // routes above.
        if (customId.startsWith('modal_loadouts_bulk_remove_')) {
            await interaction.deferReply({ ephemeral: true });
            const mode = customId.replace('modal_loadouts_bulk_remove_', '');
            const lines = interaction.fields.getTextInputValue('lines').split('\n').map(l => l.trim()).filter(Boolean);

            const removed = [];
            const notFound = [];
            const candidates = await Loadout.find({ mode }).lean();
            for (const line of lines) {
                const [weaponPart, buildPart] = line.split('|').map(p => p?.trim());
                if (!weaponPart) {
                    notFound.push(`"${line}" (need at least a weapon name)`);
                    continue;
                }
                const match = candidates.find(l => fuzzyMatch(weaponPart, l.weaponName));

                if (!match) {
                    notFound.push(`${weaponPart} (${mode})`);
                    continue;
                }

                if (buildPart) {
                    const res = await Loadout.deleteOne({ weaponKey: match.weaponKey, mode, buildName: buildPart });
                    if (res.deletedCount > 0) removed.push(`${match.weaponName} (${buildPart})`);
                    else notFound.push(`${weaponPart} | ${mode} | ${buildPart}`);
                } else {
                    const res = await Loadout.deleteMany({ weaponKey: match.weaponKey, mode });
                    removed.push(`${match.weaponName} (all ${res.deletedCount} build(s))`);
                }
            }

            let confirmation = `🗑️ **Bulk Remove Complete!**`;
            if (removed.length) confirmation += `\nRemoved: ${removed.join(', ')}`;
            if (notFound.length) confirmation += `\n⚠️ Not found: ${notFound.join(', ')}`;
            return interaction.followUp({ content: confirmation });
        }

        // --- ADMIN ROUTE K.2: EXPORT UP TO 5 LOADOUTS --- custom_id: modal_loadouts_export5_{MP|DMZ}
        // Fuzzy-matches each pasted weapon name (up to 5) against that mode's collection -- the real
        // search+multi-select-from-a-list version this mockup describes is the deferred future work
        // (see this file's top-of-file note); this is a working placeholder for the same outcome.
        if (customId.startsWith('modal_loadouts_export5_')) {
            await interaction.deferReply({ ephemeral: true });
            const mode = customId.replace('modal_loadouts_export5_', '');
            const { formatLoadoutsAsBulkText } = require('./utils/adminParser');
            const requested = interaction.fields.getTextInputValue('weapons').split('\n').map(w => w.trim()).filter(Boolean).slice(0, 5);
            const candidates = await Loadout.find({ mode }).lean();

            const matched = [];
            const notFound = [];
            for (const weapon of requested) {
                const hits = candidates.filter(l => fuzzyMatch(weapon, l.weaponName));
                if (hits.length > 0) matched.push(...hits);
                else notFound.push(weapon);
            }

            if (matched.length === 0) {
                return interaction.followUp({ content: `❌ No matches found for: ${requested.join(', ')}` });
            }

            const text = formatLoadoutsAsBulkText(matched);
            let content = `📤 **Exported ${matched.length} ${mode} loadout(s)** in Bulk Add format. Paste this back into the Bulk Add action.`;
            if (notFound.length) content += `\n⚠️ Not found: ${notFound.join(', ')}`;
            return interaction.followUp({ content, files: [{ attachment: Buffer.from(text, 'utf-8'), name: `${mode.toLowerCase()}_loadouts_export.txt` }] });
        }

        // --- ADMIN ROUTE K.3: EXPORT A LOADOUT CATEGORY --- custom_id: modal_loadouts_exportcategory_{MP|DMZ}
        if (customId.startsWith('modal_loadouts_exportcategory_')) {
            await interaction.deferReply({ ephemeral: true });
            const mode = customId.replace('modal_loadouts_exportcategory_', '');
            const { formatLoadoutsAsBulkText } = require('./utils/adminParser');
            const category = interaction.fields.getTextInputValue('category').trim().toUpperCase();
            const loadouts = await Loadout.find({ mode, category }).lean();

            if (loadouts.length === 0) {
                return interaction.followUp({ content: `❌ No ${mode} loadouts found in category "${category}".` });
            }

            const text = formatLoadoutsAsBulkText(loadouts);
            return interaction.followUp({
                content: `📤 **Exported ${loadouts.length} ${mode} ${category} loadout(s)** in Bulk Add format. Paste this back into the Bulk Add action.`,
                files: [{ attachment: Buffer.from(text, 'utf-8'), name: `${mode.toLowerCase()}_${category.toLowerCase()}_loadouts_export.txt` }]
            });
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
});

// Initialize system authorization
client.login(process.env.BOT_TOKEN);