// ==========================================
// APPLICATION COMMAND REGISTRATION
// ==========================================
// Everything that decides WHICH slash commands exist and pushes them to Discord. Split out of index.js on 2026-08-13 17:20 EDT; the logic is unchanged, only its address.
//
// Three stages, deliberately kept separate because they run at different TIMES and that timing is load-bearing:
//   1. loadCommandModules(client)  -- at boot, synchronous. Reads commands/*.js off disk, including commands/gunsmiths.js.
//   2. applyGunsmithsScopeChoices(commands) -- after ClientReady, async. Needs a live MongoDB query for the 7 category scope choices, so it CANNOT run at require time.
//   3. registerApplicationCommands(client, commands) -- one REST PUT, after the two above.
//
// The /gunsmiths consolidation (2026-08-15) removed the nine commands (/all + 8 per-category) that used to be built here -- see docs/superpowers/specs/2026-08-15-gunsmiths-command- consolidation-design.md. This file's own ⚠️ used to warn that a commands/ readdir misses those nine; that trap is why the consolidation happened, and it no longer applies -- /gunsmiths is a normal commands/*.js module, found by the same readdir as everything else.

const fs = require('fs');
const path = require('path');
const { REST, Routes, SlashCommandBuilder, Collection } = require('discord.js');

// The names /admin's "always hidden commands" menu never offers (2026-08-10 15:48 EDT, v3 server-admin visibility policy): a server rule has no business quieting Harkirat's own owner-level commands, and /admin must never be able to hide its own answer from the admin trying to undo a rule. 'Add to Patch Notes' (the right-click command, 2026-10-19 10:22 EDT) is /manage's patch-notes editor by another door, so it is excluded with it.
const ADMIN_COMMAND_NAMES = new Set(['admin', 'manage', 'autobuild', 'bot', 'Add to Patch Notes', 'Autobuild Loadout', 'Add to Draws', 'Add to Calendar']);

// The commands that live on DIOREO ADMIN when it is on (2026-10-19 13:44 EDT, his design; /admin stays public, his "yes." 13:26 EDT, because it is a SERVER command gated by Manage Server and already hidden from everyone without it). Plus, per his "yes." at 13:35 EDT, every `devOnly` module and any module exporting `adminApp: true` -- the experimental ones. Nothing is on both apps.
const ADMIN_APP_COMMAND_NAMES = new Set([...ADMIN_COMMAND_NAMES].filter(name => name !== 'admin'));

function commandName(c) {
    return typeof c.toJSON === 'function' ? c.toJSON().name : c.name;
}

function belongsOnAdminApp(name, module) {
    return ADMIN_APP_COMMAND_NAMES.has(name) || Boolean(module?.devOnly) || Boolean(module?.adminApp);
}

// Splits the one staging array into the two apps' lists. With the admin app off, everything stays public -- today's behaviour. `modules` is client.commands, which carries each module's devOnly/adminApp flags.
//
// Discord's cap: an app registers at most 5 message right-clicks, and one over the cap fails the WHOLE registration PUT. With Dioreo Admin on, each app is well under it (public 2, admin 4). With it OFF every command lands on the public app (6 since View Colors gained a message right-click, 2026-10-19 15:22 EDT), so the ones that would live on the admin app are left out first, loudly, rather than the public app losing every command.
const MESSAGE_COMMAND_CAP = 5;
function capMessageCommands(commands, modules) {
    const messages = commands.filter(c => (c.toJSON?.().type ?? c.type) === 3);
    if (messages.length <= MESSAGE_COMMAND_CAP) return commands;
    const ranked = [...messages].sort((a, b) => Number(belongsOnAdminApp(commandName(a), modules?.get?.(`${commandName(a)}#3`))) - Number(belongsOnAdminApp(commandName(b), modules?.get?.(`${commandName(b)}#3`))));
    const dropped = new Set(ranked.slice(MESSAGE_COMMAND_CAP));
    console.warn(`⚠️ ${messages.length} message right-clicks on one app, Discord allows ${MESSAGE_COMMAND_CAP}; left out: ${[...dropped].map(commandName).join(', ')}. Set ADMIN_BOT_TOKEN to register them on Dioreo Admin.`);
    return commands.filter(c => !dropped.has(c));
}

function splitCommands(commands, modules, { adminApp }) {
    if (!adminApp) return { publicCommands: capMessageCommands(commands, modules), adminCommands: [] };
    const publicCommands = [];
    const adminCommands = [];
    for (const c of commands) {
        const name = commandName(c);
        const type = c.toJSON?.().type ?? c.type;
        const module = (type === 2 || type === 3) ? (modules?.get?.(`${name}#${type}`) ?? modules?.get?.(name)) : modules?.get?.(name);
        (belongsOnAdminApp(name, module) ? adminCommands : publicCommands).push(c);
    }
    return { publicCommands, adminCommands };
}

// ==========================================
// STATIC + ON-DISK COMMAND MODULES
// ==========================================

// Initializes client.commands and returns the staging array that applyGunsmithsScopeChoices() and registerApplicationCommands() go on to fill and serialize. The array and the Collection are deliberately BOTH maintained: the Collection is what the router dispatches through (`interaction.client.commands.get(name)`), the array is what gets serialized to Discord and what /admin derives its gateable-command list from.
function loadCommandModules(client) {
    client.commands = new Collection();
    const commands = [];

    // DYNAMIC COMMAND EXTENSION MODULE LOADER: Scans internal subdirectory directories to dynamically extract and merge independent slash files ⚠️ Resolved against this file's PARENT, not __dirname -- this module lives in bot/, the command modules live in commands/ at the repo root. A plain path.join(__dirname, 'commands') here would silently find nothing and register an empty command set, with no error anywhere.
    const commandsPath = path.join(__dirname, '..', 'commands');
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            // DEV-ONLY COMMANDS (2026-10-17, /embedtest): a module exporting `devOnly: true` registers only when NODE_ENV is 'development', which .env.dev sets and prod's .env never does (utils/cloudinaryDevGuard.js's header). Skipped before both client.commands and the registration array, so prod neither shows nor routes it.
            if (command.devOnly && process.env.NODE_ENV !== 'development') continue;

            if ('data' in command && 'execute' in command) {
                // A right-click is ALSO stored under `name#type` (2026-10-19 15:22 EDT): "View Colors" is both a user and a message right-click, Discord allows one name per type, and the router looks the typed key up first. The plain name keeps the first module with it, so slash commands are unaffected.
                const type = command.data.toJSON?.().type;
                if (type === 2 || type === 3) client.commands.set(`${command.data.name}#${type}`, command);
                if (!client.commands.has(command.data.name)) client.commands.set(command.data.name, command);
                commands.push(command.data);
            }
        }
    }

    return commands;
}

// ==========================================
// PUSH TO DISCORD
// ==========================================

// Coordinates secure synchronization of compiled structures directly over to active Discord cloud endpoints, then caches the two derived lookups that can only exist AFTER registration. Called once per application: the public client with its list and BOT_TOKEN, and (when on) the admin client with its list and ADMIN_BOT_TOKEN. A PUT replaces the app's whole list, so the admin commands leave the public app on the first boot after the split.
async function registerApplicationCommands(client, commands, { token = process.env.BOT_TOKEN, gateable = true } = {}) {
    // The names /admin's "always hidden commands" menu offers. Derived from `commands` -- the SAME array that is about to be registered -- rather than a hand-maintained list, which would silently go stale the first time a command is added or removed. Only the public app's list feeds it: /admin is a public command, and an admin-app command is never gateable.
    if (gateable) {
        // A Set: "View Colors" is two commands (user and message right-click) with one name, and /admin's menu lists it once.
        client.gateableCommandNames = [...new Set(commands
            .map(commandName)
            .filter(name => name && !ADMIN_COMMAND_NAMES.has(name)))];
    }

    const rest = new REST({ version: '10' }).setToken(token);
    try {
        const payload = commands.map(c => typeof c.toJSON === 'function' ? c.toJSON() : c);
        const registered = await rest.put(Routes.applicationCommands(client.user.id), { body: payload });
        console.log(`🚀 Application routing links successfully integrated into Discord Gateway system!`);

        // Real clickable slash-command mentions (</name:id>, see utils/commandMentions.js) need each command's live id -- `registered` IS that data, straight off this same PUT response, so no extra API call is needed. Keyed by top-level command name only; a subcommand mention still resolves off its PARENT's id. Refreshed every boot, same as gateableCommandNames above and refreshEmojiIds -- a value that only exists post- registration must never be frozen at require() time, and it differs between the dev and prod applications for the identical command name.
        client.commandIds = new Map(registered.map(c => [c.name, c.id]));
        // Also into the process-wide list, so a mention in one app's message resolves a command that lives on the other (/help on Dioreo linking /bot on Dioreo Admin).
        require('../utils/commandMentions').recordCommandIds(client.commandIds);
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

module.exports = { loadCommandModules, registerApplicationCommands, splitCommands, capMessageCommands, belongsOnAdminApp, ADMIN_COMMAND_NAMES, ADMIN_APP_COMMAND_NAMES, MESSAGE_COMMAND_CAP };
