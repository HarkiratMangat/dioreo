// scripts/devCommands.js — list or clear the DEV app's registered slash commands.
//
// Why this exists: slash-command registration lives on Discord's servers, attached to the
// APPLICATION, not to the running process. `bot/registry.js` writes it once per boot with
// `rest.put(Routes.applicationCommands(client.user.id), { body: payload })` and Discord keeps it
// forever after — so killing the dev bot does NOT remove `Dioreo (Dev)`'s commands from the `/` picker.
// Since it's a user-installed app (`setIntegrationTypes([1])`), those duplicates follow Harkirat into
// every server and DM, sitting right next to prod's identical command list. This script empties the
// dev app's registry so the picker is clean while he isn't testing.
//
// Restoring them is not this script's job and doesn't need to be: the next dev-bot boot re-registers
// everything automatically, because that PUT runs on every startup.
//
//   node scripts/devCommands.js list    # show what the dev app currently has registered
//   node scripts/devCommands.js clear   # register an empty list -> commands vanish from the picker
//
// ⚠️ This script reads `.env.dev` DIRECTLY off disk and never consults process.env. That's
// deliberate: `dotenv.config()` does not override variables that are already set (the documented
// backfill gotcha in CLAUDE.md), so a script that trusted process.env could silently end up holding
// the PROD token and wipe the real bot's commands. Parsing the file itself makes that impossible,
// and the prod-token comparison below is a second, independent backstop.

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const REPO_ROOT = path.join(__dirname, '..');

/**
 * Minimal .env reader. Returns {} for a missing file rather than throwing -- a machine without
 * `.env.dev` should get this script's own clear error message, not a stack trace from fs.
 * Handles `KEY=value`, optional `export ` prefix, surrounding quotes, blank lines and `#` comments.
 * Deliberately NOT dotenv: dotenv's job is to mutate process.env, which is the exact thing this
 * script must avoid (see the header note).
 */
function readEnvFile(file) {
    let raw;
    try {
        raw = fs.readFileSync(file, 'utf8');
    } catch {
        return {};
    }
    const out = {};
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).replace(/^export\s+/, '').trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        out[key] = value;
    }
    return out;
}

async function main() {
    const mode = process.argv[2];
    if (mode !== 'list' && mode !== 'clear') {
        console.error('Usage: node scripts/devCommands.js <list|clear>');
        console.error('  list   show the dev app\'s currently registered slash commands');
        console.error('  clear  register an empty list (the next dev-bot boot re-registers them)');
        process.exit(1);
    }

    const devEnv = readEnvFile(path.join(REPO_ROOT, '.env.dev'));
    const devToken = devEnv.BOT_TOKEN;
    if (!devToken) {
        console.error('❌ No BOT_TOKEN found in .env.dev — is the dev bot set up on this machine?');
        console.error('   (See docs/reference/deployment-and-ops.md, "The local dev bot".)');
        process.exit(1);
    }

    // Backstop: refuse outright if .env.dev somehow carries the PRODUCTION token. Clearing prod's
    // commands would take every command away from every user of the real bot until someone noticed
    // and restarted the VM -- a genuinely bad, user-visible outage from a one-word mistake.
    const prodToken = readEnvFile(path.join(REPO_ROOT, '.env')).BOT_TOKEN;
    if (prodToken && prodToken === devToken) {
        console.error('❌ Refusing to run: .env.dev\'s BOT_TOKEN is identical to .env\'s (the PROD token).');
        console.error('   This script only ever touches the dev application. Fix .env.dev first.');
        process.exit(1);
    }

    const rest = new REST({ version: '10' }).setToken(devToken);

    // Identify the app from the token rather than hardcoding an id, and print it before doing
    // anything destructive -- if this ever says "Dioreo" instead of "Dioreo (Dev)", stop.
    const app = await rest.get(Routes.currentApplication());
    console.log(`🤖 Application: ${app.name} (${app.id})`);

    const existing = await rest.get(Routes.applicationCommands(app.id));
    if (mode === 'list') {
        if (!existing.length) {
            console.log('📭 No commands registered — the dev app is already absent from the / picker.');
            return;
        }
        console.log(`📋 ${existing.length} command(s) registered:`);
        for (const cmd of existing) console.log(`   /${cmd.name} — ${cmd.description || '(no description)'}`);
        return;
    }

    if (!existing.length) {
        console.log('📭 Nothing to clear — no commands are registered.');
        return;
    }

    await rest.put(Routes.applicationCommands(app.id), { body: [] });
    console.log(`🧹 Cleared ${existing.length} command(s) from ${app.name}.`);
    console.log('   They disappear from the / picker within a few seconds (restart Discord if it lags).');
    console.log('   To get them back: boot the dev bot normally — it re-registers on every startup.');
}

main().catch(err => {
    // Discord REST errors carry a `rawError` with the useful detail; the bare message is often just
    // the HTTP status. Never print the token or the whole error object.
    console.error('❌ Failed:', err?.rawError?.message || err?.message || err);
    process.exit(1);
});
