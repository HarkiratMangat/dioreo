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
    const mpCategories = await Loadout.distinct('category', { mode: 'MP' });
    mpCategories.forEach(cat => {
        const cmdName = cat.toLowerCase().replace(/\s+/g, '');
        commands.push(
            new SlashCommandBuilder()
                .setName(cmdName)
                .setDescription(`Search through ${cat} gunsmiths only`)
                .addStringOption(opt => opt.setName('weapon').setDescription(`Select a ${cat}`).setAutocomplete(true).setRequired(true))
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

// ==========================================
// PHASE 5: INTERACTIVE ELEMENT GENERATORS
// ==========================================

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

        try {
            // === ROUTE A: ADMIN MANAGEMENT AUTOCOMPLETE ===
            if (commandName === 'manage') {
                const group = interaction.options.getSubcommandGroup();

                if (group === 'draws') {
                    const SeasonalData = require('./models/SeasonalData');
                    const doc = await SeasonalData.findOne({ docType: 'global' });
                    if (!doc) return await interaction.respond([]);

                    // Combine both arrays (New & Returning) and map them for the dropdown
                    const allDraws = [...doc.newDraws, ...doc.returningDraws];
                    const filtered = allDraws
                        .filter(d => d.title.toLowerCase().includes(focusedValue))
                        .slice(0, 25);

                    return await interaction.respond(filtered.map(d => ({
                        name: `${d.title} (${new Date(d.date).toLocaleDateString()})`,
                        value: d._id.toString() // We pass the MongoDB ID secretly as the value
                    })));
                }

                if (group === 'loadouts') {
                    const Loadout = require('./models/Loadout');
                    // Find loadouts matching weapon name or build name specifically
                    const matching = await Loadout.find({
                        $or: [
                            { weaponName: { $regex: focusedValue, $options: 'i' } },
                            { buildName: { $regex: focusedValue, $options: 'i' } }
                        ]
                    }).limit(25);

                    return await interaction.respond(matching.map(l => ({
                        name: `[${l.mode}] ${l.weaponName} - ${l.buildName}`,
                        value: l._id.toString()
                    })));
                }
            }

            // === ROUTE B: USER FRONT-END AUTOCOMPLETE (/all, /dmz, /patch) ===
            // Required because we changed the base command name to 'patch' for subcommands
            if (commandName === 'patch') {
                const SeasonalData = require('./models/SeasonalData');
                const { cleanPatchTitle } = require('./commands/patchnotes');
                const doc = await SeasonalData.findOne({ docType: 'global' });
                if (!doc || !doc.patchNotes) return await interaction.respond([]);

                // Strip the legacy "Balance Changes for..." prefix here too, same as the main
                // render + history dropdown, so pre-redesign entries don't look inconsistent here.
                const filtered = doc.patchNotes
                    .filter(p => cleanPatchTitle(p.title).toLowerCase().includes(focusedValue))
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

            const matchingWeapons = await Loadout.find(queryFilter).select('weaponName weaponKey category');
            const uniqueMap = new Map();
            matchingWeapons.forEach(w => uniqueMap.set(w.weaponKey, w));
            const distinctChoices = Array.from(uniqueMap.values());

            const filteredChoices = distinctChoices
                .filter(w => w.weaponName.toLowerCase().includes(focusedValue))
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
        const { buildLoadoutCard } = require('./utils/loadoutRender');

        // Same "Weapon Builds" toggle /dmz reads — one shared preference across every loadout
        // lookup command (Option A pattern, matches `seasonalVisibility`).
        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        const isEphemeral = prefs ? prefs.loadoutVisibility === 'ephemeral' : false;
        await interaction.deferReply({ ephemeral: isEphemeral });

        const weaponKey = interaction.options.getString('weapon');
        const mpBuilds = await Loadout.find({ weaponKey, mode: 'MP' });

        if (!mpBuilds || mpBuilds.length === 0) {
            return interaction.followUp({ content: '❌ No MP builds were found for that weapon.' });
        }

        // LIBRARY SERIALIZATION BYPASS: raw rest.patch instead of interaction.followUp(), same
        // reasoning as every other Components V2 command — discord.js's high-level methods don't
        // reliably handle raw V2 JSON (no builder class exists for Container/type 17).
        const cardPayload = buildLoadoutCard(mpBuilds, 0, { color: 2829617, idPrefix: 'mp', isEphemeral }); // #2b2d31
        return interaction.client.rest.patch(
            Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
            { body: { content: '', components: cardPayload.components, flags: cardPayload.flags } }
        );
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

        // B. DRAW PRICES REGION SELECTOR
        if (interaction.customId === 'select_price_region') {
            await interaction.deferUpdate();
            const selectedRegion = interaction.values[0];
            const pricesCommand = client.commands.get('draw');

            // Re-use the existing render path (rest.patch on @original), just with the newly picked region
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });
            return await pricesCommand.execute(syntheticInteraction, selectedRegion);
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
                return interaction.followUp({ content: "❌ **Action Blocked:** You do not possess clearance to override settings options on another user's interactive panel.", ephemeral: true });
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
    }

    // ==========================================
    // --- STEP 6.4: BUTTON INTERCEPTORS ---
    // ==========================================
    if (interaction.isButton()) {

        // 0. "SHARE PUBLICLY" — attached below any ephemeral response's own components (see
        // utils/shareButton.js). Doesn't touch the original ephemeral message at all — Discord
        // hands us the FULL original message (content/embeds/components) directly in this click's
        // own interaction payload, ephemeral or not, so there's nothing to look up or reconstruct.
        // We just strip the ephemeral flag and the share button itself, then post a real message.
        if (interaction.customId === 'share_public') {
            // PRO FIX: defer first, same reasoning as the tsmenu handler — the channel-message POST
            // below is normally fast but there's no reason to risk the 3-second ack window on it.
            await interaction.deferReply({ ephemeral: true });

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

            // Preserve the Components V2 flag (32768) if present, but strip EPHEMERAL (64) — that
            // flag only means anything on an interaction response, not a normal channel message,
            // and would otherwise carry over from the original ephemeral message's flags.
            const flags = (msg.flags?.bitfield || 0) & ~64;

            await interaction.client.rest.post(Routes.channelMessages(interaction.channelId), {
                body: { content: msg.content || '', embeds, components, flags }
            });

            return interaction.followUp({ content: '✅ Shared publicly below!', ephemeral: true });
        }

        // A. SETTINGS BINARY TOGGLE BUTTONS (Public/Private & Region defaults)
        if (interaction.customId.startsWith('toggle_')) {
            await interaction.deferUpdate(); // Defer to permanently safeguard against API 10062 timeouts
            const [actionStr, targetUserId] = interaction.customId.split('|');

            // SECURITY GATEWAY WALL: Block rogue server members from attempting to adjust another user's preference canvas
            if (interaction.user.id !== targetUserId) {
                return interaction.followUp({ content: "❌ **Action Blocked:** You do not possess authorization to alter option nodes on this account dashboard profile.", ephemeral: true });
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

            if (!targetCommand) return interaction.followUp({ content: '❌ Target interface module is currently offline.', ephemeral: true });

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
            const { buildLoadoutCard } = require('./utils/loadoutRender');
            const isDmz = interaction.customId.startsWith('dmz');
            const mode = isDmz ? 'DMZ' : 'MP';

            // Strip the prefix so we can parse the standard action format
            const [action, gunKey, currentIndex] = interaction.customId.replace(isDmz ? 'dmz' : 'mp', '').split('_');

            const matchingBuilds = await Loadout.find({ weaponKey: gunKey, mode });
            let newIndex = parseInt(currentIndex);

            // Calculate wrap-around pagination index
            if (action === 'next') newIndex = (newIndex + 1) % matchingBuilds.length;
            if (action === 'prev') newIndex = (newIndex - 1 + matchingBuilds.length) % matchingBuilds.length;
            if (action === 'copy') {
                // Prefer the real in-game Gunsmith code (shareCode) if this loadout has one, falling
                // back to buildName for loadouts added via /manage (which never collected a real
                // code) — see models/Loadout.js for why these are two separate fields.
                const build = matchingBuilds[newIndex];
                return interaction.reply({ content: build.shareCode || build.buildName, ephemeral: true });
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

            // Reassemble the updated visual frame card for the new page
            const cardPayload = buildLoadoutCard(matchingBuilds, newIndex, isDmz
                ? { color: 1842204, idPrefix: 'dmz', isEphemeral } // #1c1c1c
                : { color: 2829617, idPrefix: 'mp', isEphemeral }); // #2b2d31

            return await interaction.client.rest.patch(
                Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
                { body: { content: '', components: cardPayload.components, flags: cardPayload.flags } }
            );
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
        const { parseAdminDate } = require('./utils/adminParser'); // Requires date utility

        // Initialize connection to the global document
        let seasonalDoc = await SeasonalData.findOne({ docType: 'global' });
        if (!seasonalDoc) seasonalDoc = new SeasonalData({ docType: 'global' });

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

        // --- ADMIN ROUTE B: BULK IMPORT DRAWS (WITH AUTO-SORT) ---
        if (customId === 'modal_draws_bulk') {
            await interaction.deferReply({ ephemeral: true });
            const bulkText = interaction.fields.getTextInputValue('bulk_text');
            const { parseBulkDraws } = require('./utils/adminParser');
            const { newDraws, returningDraws } = parseBulkDraws(bulkText);

            // OVERRIDE, not append: each bulk paste is the full current draw list, not an addition
            // to whatever was already there — re-running the import (e.g. to fix a typo) should
            // replace the old entries, not pile duplicates on top of them.
            seasonalDoc.newDraws = newDraws;
            seasonalDoc.returningDraws = returningDraws;

            // AUTO-SORT: Chronological sorting by release date so your UI is always perfectly ordered
            seasonalDoc.newDraws.sort((a, b) => new Date(a.date) - new Date(b.date));
            seasonalDoc.returningDraws.sort((a, b) => new Date(a.date) - new Date(b.date));

            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Bulk Import Complete!**\nReplaced the draw list with **${newDraws.length}** New Draws and **${returningDraws.length}** Returning Draws. Sorted chronologically.` });
        }

        // --- ADMIN ROUTE C: BULK IMPORT CALENDAR EVENTS ---
        // NOTE (redesigned during review): previously took one event (title + date) at a time.
        // Now parses a bulk bullet-separated paste — "M/D - M/D | Title" or "M/D - All Season |
        // Title" — into { title, startDate, endDate, isOngoing } objects via parseBulkEvents.
        if (customId === 'modal_calendar_bulk') {
            await interaction.deferReply({ ephemeral: true });
            const bulkText = interaction.fields.getTextInputValue('bulk_text');
            const { parseBulkEvents } = require('./utils/adminParser');
            const parsedEvents = parseBulkEvents(bulkText);

            const newEventDocs = parsedEvents.map(e => ({
                title: e.title,
                date: e.startDate,
                endDate: e.isOngoing ? null : e.endDate,
                isOngoing: e.isOngoing
            }));

            // OVERRIDE, not append: same reasoning as the draws bulk import above — a bulk paste
            // represents the complete calendar for the season, not an addition to the old one.
            seasonalDoc.calendar = newEventDocs;

            // AUTO-SORT: Keep the timeline in chronological order
            seasonalDoc.calendar.sort((a, b) => new Date(a.date) - new Date(b.date));

            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Bulk Calendar Import Complete!**\nReplaced the calendar with **${newEventDocs.length}** events. Sorted chronologically.` });
        }

        // --- ADMIN ROUTE D: PATCH NOTES ---
        if (customId === 'modal_add_patchnotes') {
            await interaction.deferReply({ ephemeral: true });
            const title = interaction.fields.getTextInputValue('patch_title').trim();
            // NOTE: optional field added during the patch notes redesign — shows as a section
            // beneath the release date in patchnotes.js, or nothing at all if left blank.
            const description = interaction.fields.getTextInputValue('patch_description')?.trim() || '';
            const rawUrls = interaction.fields.getTextInputValue('patch_urls');

            // Split URLs by line breaks or commas, clean whitespace, and filter out empties
            const imageUrls = rawUrls.split(/[\n,]+/).map(url => url.trim()).filter(url => url.startsWith('http'));

            seasonalDoc.patchNotes.push({ title: title, description: description, releaseDate: new Date(), images: imageUrls });
            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Patch Notes Published!**\n**${title}** uploaded with ${imageUrls.length} image slides.` });
        }

        // --- ADMIN ROUTE E: SEASON DEADLINES ---
        if (customId === 'modal_edit_deadlines') {
            await interaction.deferReply({ ephemeral: true });
            const bpStr = interaction.fields.getTextInputValue('bp_end');
            const rankStr = interaction.fields.getTextInputValue('rank_end');
            const dmzStr = interaction.fields.getTextInputValue('dmz_end');

            // Only update the dates that were actively filled out in the modal
            if (bpStr) seasonalDoc.bpEnd = parseAdminDate(bpStr);
            if (rankStr) seasonalDoc.rankEnd = parseAdminDate(rankStr);
            if (dmzStr) seasonalDoc.dmzEnd = parseAdminDate(dmzStr);

            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Deadlines Updated!** The \`/seasonend\` countdowns have been synced.` });
        }

        // --- ADMIN ROUTE F: SAVE EDITED DRAW ---
        if (customId.startsWith('edit_draw_')) {
            await interaction.deferReply({ ephemeral: true });
            const [_, __, targetId, drawType] = customId.split('_');
            const { parseAdminDate, toTitleCase, resolveTier } = require('./utils/adminParser');

            // Find and update the exact object in the array
            const arrayTarget = drawType === 'new' ? seasonalDoc.newDraws : seasonalDoc.returningDraws;
            const drawIndex = arrayTarget.findIndex(d => d._id.toString() === targetId);

            if (drawIndex > -1) {
                arrayTarget[drawIndex].title = toTitleCase(interaction.fields.getTextInputValue('title'));
                arrayTarget[drawIndex].date = parseAdminDate(interaction.fields.getTextInputValue('date'));
                arrayTarget[drawIndex].thumbnailUrl = interaction.fields.getTextInputValue('url');

                // Re-parse the text area items back into objects
                const rawItems = interaction.fields.getTextInputValue('items');
                arrayTarget[drawIndex].items = rawItems.split('\n').filter(l => l.trim().length > 0).map(itemStr => {
                    const match = itemStr.match(/^(\S+)\s+(.+)$/);
                    return match ? { tier: resolveTier(match[1]), name: toTitleCase(match[2]) } : { tier: 'epic', name: toTitleCase(itemStr) };
                });

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

            const metaParts = interaction.fields.getTextInputValue('meta').split('|').map(s => s.trim());
            const attachmentsArray = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);

            await Loadout.findByIdAndUpdate(targetId, {
                weaponName: interaction.fields.getTextInputValue('weapon'),
                weaponKey: interaction.fields.getTextInputValue('weapon').toLowerCase().replace(/\s+/g, ''),
                buildName: interaction.fields.getTextInputValue('build'),
                attachments: attachmentsArray,
                imageKey: interaction.fields.getTextInputValue('image'),
                category: metaParts[0]?.toUpperCase() || 'AR',
                mode: metaParts[1]?.toUpperCase() || 'MP'
            });

            return interaction.followUp({ content: `✅ **Loadout Updated Successfully!**` });
        }

        // --- ADMIN ROUTE H: SAVE NEW SINGLE DRAW ---
        if (customId === 'add_draw_new' || customId === 'add_draw_returning') {
            await interaction.deferReply({ ephemeral: true });
            const drawType = customId.replace('add_draw_', '');
            const { parseAdminDate, toTitleCase, resolveTier } = require('./utils/adminParser');

            const title = interaction.fields.getTextInputValue('title');
            const dateStr = interaction.fields.getTextInputValue('date');
            const url = interaction.fields.getTextInputValue('url');

            // Parse items string block
            const rawItems = interaction.fields.getTextInputValue('items');
            const parsedItems = rawItems.split('\n').filter(l => l.trim().length > 0).map(itemStr => {
                const match = itemStr.match(/^(\S+)\s+(.+)$/);
                return match ? { tier: resolveTier(match[1]), name: toTitleCase(match[2]) } : { tier: 'epic', name: toTitleCase(itemStr) };
            });

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

        // --- ADMIN ROUTE I: SAVE NEW SINGLE LOADOUT ---
        if (customId === 'add_loadout') {
            await interaction.deferReply({ ephemeral: true });
            const Loadout = require('./models/Loadout');

            const metaParts = interaction.fields.getTextInputValue('meta').split('|').map(s => s.trim());
            const attachmentsArray = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);

            const newLoadout = new Loadout({
                weaponName: interaction.fields.getTextInputValue('weapon'),
                weaponKey: interaction.fields.getTextInputValue('weapon').toLowerCase().replace(/\s+/g, ''),
                buildName: interaction.fields.getTextInputValue('build'),
                attachments: attachmentsArray,
                imageKey: interaction.fields.getTextInputValue('image'),
                category: metaParts[0]?.toUpperCase() || 'AR',
                mode: metaParts[1]?.toUpperCase() || 'MP'
            });

            await newLoadout.save();
            return interaction.followUp({ content: `✅ **Successfully saved Loadout: ${newLoadout.weaponName} (${newLoadout.mode})!**` });
        }

        // --- ADMIN ROUTE J: SAVE EDITED SEASON TITLES ---
        if (customId === 'edit_season_titles') {
            await interaction.deferReply({ ephemeral: true }); // Admin feedbacks remain private

            // Trim whitespace and assign to the master document
            seasonalDoc.currentSeasonTitle = interaction.fields.getTextInputValue('main_title').trim();
            seasonalDoc.bpTitle = interaction.fields.getTextInputValue('bp_title').trim();
            seasonalDoc.rankTitle = interaction.fields.getTextInputValue('rank_title').trim();
            seasonalDoc.dmzTitle = interaction.fields.getTextInputValue('dmz_title').trim();

            // patchNotes[].title is captured independently at "Add Patch Notes" time (so older,
            // past-season entries keep their own historical title forever) — but the MOST RECENT
            // entry always represents the season that's currently live, so keep it in sync here.
            // Without this, renaming a typo'd season title via /manage silently left the current
            // patch notes entry (and therefore the default /patch notes view) showing the old name.
            if (seasonalDoc.patchNotes.length > 0) {
                seasonalDoc.patchNotes[seasonalDoc.patchNotes.length - 1].title = seasonalDoc.currentSeasonTitle;
            }

            await seasonalDoc.save();
            return interaction.followUp({ content: `✅ **Season Titles Updated!** The \`/season end\` module has been synced.` });
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