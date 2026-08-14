// ==========================================
// APPLICATION COMMAND REGISTRATION
// ==========================================
// Everything that decides WHICH slash commands exist and pushes them to Discord. Split out of
// index.js on 2026-08-13 17:20 EDT; the logic is unchanged, only its address.
//
// Three stages, deliberately kept separate because they run at different TIMES and that timing is
// load-bearing:
//   1. loadCommandModules(client)  -- at boot, synchronous. Reads commands/*.js off disk.
//   2. buildCategoryCommands(commands) -- after ClientReady, async. Needs a live MongoDB query, so
//      it CANNOT run at require time (which is why the category commands were de-Excel'd here).
//   3. registerApplicationCommands(client, commands) -- one REST PUT, after the two above.
//
// ⚠️ THE EIGHT PER-CATEGORY WEAPON COMMANDS (/ar, /lmg, /sniper, …) AND `/all` ARE BUILT HERE, NOT
// IN commands/*.js. Any sweep that readdirs that folder misses all nine of them -- exactly what
// happened on the first pass of the v3 guild-install change (2026-08-09 11:38 EDT). If you are
// changing something "on every command", change it here too.

const fs = require('fs');
const path = require('path');
const { REST, Routes, SlashCommandBuilder, Collection } = require('discord.js');

// ==========================================
// STATIC + ON-DISK COMMAND MODULES
// ==========================================

// Initializes client.commands and returns the staging array that buildCategoryCommands() and
// registerApplicationCommands() go on to fill and serialize.
// The array and the Collection are deliberately BOTH maintained: the Collection is what the router
// dispatches through (`interaction.client.commands.get(name)`), the array is what gets serialized
// to Discord and what /server derives its gateable-command list from.
function loadCommandModules(client) {
    client.commands = new Collection();
    const commands = [];

    // Register primary comprehensive fallback lookup module
    commands.push(
        new SlashCommandBuilder()
            .setName('all')
            .setDescription('Search through all available MP gunsmiths')
            // Reworded (2026-07-12, slash-command wording overpass) to match /dmz's phrasing pattern --
            // was just "Type weapon name", inconsistent with every other weapon-search option in the bot.
            // Both option descriptions trimmed 2026-07-18 (mobile-width audit, v2 quick-wins batch) --
            // were truncating on mobile; see the matching trim on /dmz's and /<category>'s copies.
            .addStringOption(opt => opt.setName('weapon').setDescription('The weapon you want a build for').setAutocomplete(true).setRequired(true))
            .addIntegerOption(opt => opt.setName('build').setDescription('Jump to a specific build number').setMinValue(1))
            .addStringOption(opt => opt.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
            .setIntegrationTypes([0, 1]).setContexts([0, 1, 2]) // Guild + user install, all contexts (v3)
    );

    // DYNAMIC COMMAND EXTENSION MODULE LOADER:
    // Scans internal subdirectory directories to dynamically extract and merge independent slash files
    // ⚠️ Resolved against this file's PARENT, not __dirname -- this module lives in bot/, the command
    // modules live in commands/ at the repo root. A plain path.join(__dirname, 'commands') here would
    // silently find nothing and register an empty command set, with no error anywhere.
    const commandsPath = path.join(__dirname, '..', 'commands');
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

    return commands;
}

// ==========================================
// PER-CATEGORY WEAPON COMMANDS (DB-DERIVED)
// ==========================================

/**
 * NOTE (de-Excel'd during review): category commands (/ar, /lmg, /sniper, etc.) used to be
 * auto-compiled synchronously from builds.xlsx's category list at require-time. Now derived from
 * MongoDB instead — queried after ClientReady rather than at module load time, since a DB query
 * can't run synchronously. Safe even if the Mongo connection hasn't finished establishing yet:
 * Mongoose buffers queries by default until the connection is ready, it doesn't throw or return early.
 *
 * Mutates and returns the same `commands` array loadCommandModules built.
 */
async function buildCategoryCommands(commands) {
    const Loadout = require('../models/Loadout');
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
                // Reworded (2026-07-12) to match the same "The name of the weapon you want a build
                // for" pattern as /dmz and /all -- was "Select a {cat}", a third distinct phrasing
                // for the same concept.
                .addStringOption(opt => opt.setName('weapon').setDescription(`The ${cat} weapon you want a build for`).setAutocomplete(true).setRequired(true))
                .addIntegerOption(opt => opt.setName('build').setDescription('Jump to a specific build number').setMinValue(1))
                .addStringOption(opt => opt.setName('visibility').setDescription('Show this response only to you, or publicly to everyone in the chat.').addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
                // Guild + user install, all contexts (v3). ⚠️ These per-category commands are built
                // HERE, not in commands/*.js, so a sweep over that folder misses all 8 of them --
                // exactly what happened on the first pass of this change (2026-08-09 11:38 EDT).
                .setIntegrationTypes([0, 1]).setContexts([0, 1, 2])
        );
    });
    return commands;
}

// ==========================================
// PUSH TO DISCORD
// ==========================================

// Coordinates secure synchronization of compiled structures directly over to active Discord cloud
// endpoints, then caches the two derived lookups that can only exist AFTER registration.
async function registerApplicationCommands(client, commands) {
    // The names /server's "always hidden commands" menu offers (2026-08-10 15:48 EDT, v3 server-admin
    // visibility policy). Derived from `commands` -- the SAME array that is about to be registered --
    // rather than from client.commands or a readdir of commands/*.js, both of which miss the eight
    // per-category weapon commands and `all` built above. A hand-maintained list here would
    // silently go stale the first time a command is added; this cannot.
    // The four admin surfaces are excluded: a server rule has no business quieting Harkirat's own
    // owner-level commands, and /server must never be able to hide its own answer from the admin
    // trying to undo a rule.
    const ADMIN_COMMAND_NAMES = new Set(['server', 'manage', 'alerts', 'autobuild']);
    client.gateableCommandNames = commands
        .map(c => (typeof c.toJSON === 'function' ? c.toJSON().name : c.name))
        .filter(name => name && !ADMIN_COMMAND_NAMES.has(name));

    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        const payload = commands.map(c => typeof c.toJSON === 'function' ? c.toJSON() : c);
        const registered = await rest.put(Routes.applicationCommands(client.user.id), { body: payload });
        console.log(`🚀 Application routing links successfully integrated into Discord Gateway system!`);

        // Real clickable slash-command mentions (</name:id>, see utils/commandMentions.js) need
        // each command's live id -- `registered` IS that data, straight off this same PUT
        // response, so no extra API call is needed. Keyed by top-level command name only; a
        // subcommand mention still resolves off its PARENT's id. Refreshed every boot, same as
        // gateableCommandNames above and refreshEmojiIds -- a value that only exists post-
        // registration must never be frozen at require() time, and it differs between the dev and
        // prod applications for the identical command name.
        client.commandIds = new Map(registered.map(c => [c.name, c.id]));
    } catch (error) {
        console.error('--- DISCORD SYSTEM REGISTRATION FAULT LOG ---');
        if (error.rawError && error.rawError.errors) {
            console.error(JSON.stringify(error.rawError.errors, null, 2));
        } else {
            console.error(error);
        }
    }
}

module.exports = { loadCommandModules, buildCategoryCommands, registerApplicationCommands };
