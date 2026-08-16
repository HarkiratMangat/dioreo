// ==========================================
// APPLICATION COMMAND REGISTRATION
// ==========================================
// Everything that decides WHICH slash commands exist and pushes them to Discord. Split out of
// index.js on 2026-08-13 17:20 EDT; the logic is unchanged, only its address.
//
// Three stages, deliberately kept separate because they run at different TIMES and that timing is
// load-bearing:
//   1. loadCommandModules(client)  -- at boot, synchronous. Reads commands/*.js off disk, including
//      commands/gunsmiths.js.
//   2. applyGunsmithsScopeChoices(commands) -- after ClientReady, async. Needs a live MongoDB
//      query for the 7 category scope choices, so it CANNOT run at require time.
//   3. registerApplicationCommands(client, commands) -- one REST PUT, after the two above.
//
// The /gunsmiths consolidation (2026-08-15) removed the nine commands (/all + 8 per-category)
// that used to be built here -- see docs/superpowers/specs/2026-08-15-gunsmiths-command-
// consolidation-design.md. This file's own ⚠️ used to warn that a commands/ readdir misses those
// nine; that trap is why the consolidation happened, and it no longer applies -- /gunsmiths is a
// normal commands/*.js module, found by the same readdir as everything else.

const fs = require('fs');
const path = require('path');
const { REST, Routes, SlashCommandBuilder, Collection } = require('discord.js');

// ==========================================
// STATIC + ON-DISK COMMAND MODULES
// ==========================================

// Initializes client.commands and returns the staging array that applyGunsmithsScopeChoices() and
// registerApplicationCommands() go on to fill and serialize.
// The array and the Collection are deliberately BOTH maintained: the Collection is what the router
// dispatches through (`interaction.client.commands.get(name)`), the array is what gets serialized
// to Discord and what /admin derives its gateable-command list from.
function loadCommandModules(client) {
    client.commands = new Collection();
    const commands = [];

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
 * Was buildCategoryCommands(): it used to CREATE the eight per-category commands (/ar, /lmg,
 * /sniper, etc.). It now fills in /gunsmiths list's `scope` choices from the same live query, so a
 * new category appears on its own without a code change. Still runs after ClientReady and before
 * the REST PUT -- it needs a DB round-trip, and `commands` holds the SAME SlashCommandBuilder
 * object client.commands does (see loadCommandModules), so mutating its nested option here keeps
 * both consistent.
 *
 * Mutates and returns the same `commands` array loadCommandModules built.
 */
async function applyGunsmithsScopeChoices(commands) {
    const Loadout = require('../models/Loadout');
    const { FIXED_SCOPES } = require('../utils/loadoutScopes');
    const dbCategories = await Loadout.distinct('category', { mode: 'MP' });
    // SECONDARIES is merged in (not appended) so it is ready the moment Harkirat adds one, and so
    // re-running this after real data exists cannot register it twice. Sorted for a stable,
    // predictable choice order in the Discord picker.
    const cats = Array.from(new Set([...dbCategories, 'SECONDARIES'])).sort();
    const choices = [
        ...cats.map(c => ({ name: c, value: `MP.${c}.std` })),
        ...FIXED_SCOPES.map(s => ({ name: s.label, value: s.value })),
    ];
    const gunsmiths = commands.find(c => (c.toJSON ? c.toJSON().name : c.name) === 'gunsmiths');
    if (!gunsmiths) {
        console.error('⚠️ /gunsmiths not found in the command array — scope choices NOT applied');
        return commands;
    }
    const listSub = gunsmiths.options.find(o => o.name === 'list');
    listSub.options.find(o => o.name === 'scope').setChoices(...choices);
    return commands;
}

// ==========================================
// PUSH TO DISCORD
// ==========================================

// Coordinates secure synchronization of compiled structures directly over to active Discord cloud
// endpoints, then caches the two derived lookups that can only exist AFTER registration.
async function registerApplicationCommands(client, commands) {
    // The names /admin's "always hidden commands" menu offers (2026-08-10 15:48 EDT, v3 server-admin
    // visibility policy). Derived from `commands` -- the SAME array that is about to be registered --
    // rather than a hand-maintained list, which would silently go stale the first time a command is
    // added or removed. (Until the 2026-08-15 /gunsmiths consolidation, this also covered `/all` +
    // the eight per-category commands, which lived only in this array and not in commands/*.js --
    // deriving from the array rather than a readdir was what made that safe.)
    // The four admin surfaces are excluded: a server rule has no business quieting Harkirat's own
    // owner-level commands, and /admin must never be able to hide its own answer from the admin
    // trying to undo a rule.
    const ADMIN_COMMAND_NAMES = new Set(['admin', 'manage', 'autobuild', 'bot']);
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
        client.registeredCommandCount = registered.length; // read by the boot record in bot/lifecycle.js
    } catch (error) {
        console.error('--- DISCORD SYSTEM REGISTRATION FAULT LOG ---');
        if (error.rawError && error.rawError.errors) {
            console.error(JSON.stringify(error.rawError.errors, null, 2));
        } else {
            console.error(error);
        }
    }
}

module.exports = { loadCommandModules, applyGunsmithsScopeChoices, registerApplicationCommands };
