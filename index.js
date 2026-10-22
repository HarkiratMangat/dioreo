// NOTE (removed 2026-07-20): a small Express keep-alive server used to sit here, whose only job was stopping Render/Railway's free tier from idling the bot container during inactivity — a hosting-specific workaround, not part of the bot's own logic. Removed once the bot moved to a GCP VM under systemd (2026-07-17), which runs the process continuously and doesn't idle/spin down, so the keep-alive ping had nothing left to do. Kept as a breadcrumb so nobody re-adds it wondering why a bot with no HTTP surface has no health endpoint. FIRST, before anything else can log. patchConsole() tags error/warn output with a systemd severity prefix (so `journalctl -p err` and Cloud Logging severity stop being permanently zero) and tees a structured copy to the Ops Agent's JSON sink. It must run ahead of the crash handlers below, or the two most important lines the bot can ever emit -- an unhandled rejection and an uncaught exception -- would be the only ones still logged as plain `info`. See utils/logger.js for the full why. ⚠️ logger.js reads DIORS_COMMIT / DIORS_LOG_FILE at require time, which is BEFORE dotenv.config() runs further down. Both are set by systemd/deploy.sh as real environment variables on purpose -- putting either in `.env` would silently do nothing (same ordering trap as the .env.dev backfill).
const { patchConsole, logBootBanner } = require('./utils/logger');
patchConsole();
// Emitted before any other output so vmstatus.sh can attribute every subsequent journal line to this version/commit -- including lines from a startup that never reaches ClientReady.
logBootBanner();

const { sendAlert } = require('./utils/alertWebhook'); // Discord webhook alerting; reads LOG_WEBHOOK_URL lazily, no-op if unset
const bootFailures = require('./utils/bootFailures');
// Boots that have failed in a row before this one: a retry after the first still posts its alerts, but never pings (utils/bootFailures.js).
const priorBootFailures = bootFailures.read();
// (gatewayRecovery moved with the shard listeners it pairs alerts for -- see bot/lifecycle.js)

// SAFETY NET: Node crashes the whole process on an unhandled promise rejection by default (since Node 15). The interactionCreate handler's own try/catch already covers most Discord API failures, but a rejection from a `return interaction.reply(...)`-style call inside a catch block can still slip past it -- the try/catch has already exited by the time that promise settles, so nothing downstream is listening. This is exactly what took the bot offline on Railway (10062 Unknown interaction -> fallback reply -> 40060 already acknowledged -> crash). Logging instead of crashing here is a last-resort net, not a substitute for fixing the actual unawaited call sites -- see handlers/router.js and the handlers it dispatches for the real fix.
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection (bot stays alive):', reason);
    sendAlert('Unhandled promise rejection', reason, 'error');
});

// Companion net for a SYNCHRONOUS throw with no handler (which would otherwise crash the process). Log + alert (with an active ping — a crash is exactly the "something you should notice" case) and STAY ALIVE, matching this bot's established "degrade to 'that one path failed', never take the whole bot down" philosophy (see CLAUDE.md crash-resilience). systemd would auto-restart anyway, but staying up avoids dropping every other in-flight interaction over one bad code path.
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception (bot stays alive):', err);
    sendAlert('Uncaught exception', err, 'error');
});

// ==========================================
// CORE MODULES & DEPENDENCY IMPORTS
// ==========================================
require("dotenv").config({ quiet: true }); // quiet: true suppresses dotenv's runtime log line (incl. its rotating promotional "tip" text)

const mongoose = require("mongoose");
// Atlas dependency timing (2026-08-16, observability stage 2). Installed HERE, before any model is required or any query runs, because it patches Query/Aggregate exec -- see utils/mongoTiming.js.
require("./utils/mongoTiming").installMongoTiming();
const { Client, GatewayIntentBits } = require("discord.js");
const { acquireInstanceLock } = require("./utils/instanceLock");

// The three modules this file wires together. Everything that used to live inline here moved into them on 2026-08-13 17:20 EDT (docs/ROADMAP.md's index.js split) -- this file is the entrypoint again: connect, construct, wire, log in. Nothing else.
const { loadCommandModules, splitCommands } = require("./bot/registry");
const { registerLifecycle, registerAdminLifecycle } = require("./bot/lifecycle");
const { setClients, adminTokenFrom } = require("./bot/clients");
const { handleInteraction } = require("./handlers/router");

// CONNECT TO MONGO (Atlas in prod; a LOCAL mongodb://localhost database under `.env.dev`) The success line names the actual host rather than hardcoding "Atlas Cluster" -- it used to claim Atlas unconditionally, which reads like the DEV bot just connected to the PRODUCTION database when it did nothing of the sort (mis-read exactly that way 2026-07-26 21:04 EDT). Host only, never the full URI: that string carries the Atlas credentials.
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        const host = mongoose.connection.host || "unknown host";
        const dbName = mongoose.connection.name || "unknown db";
        console.log(`🍃 Successfully authenticated and established secure link to MongoDB (${host}/${dbName})!`);
    })
    .catch(err => { console.error("❌ Database connection failure detailed error:", err); sendAlert("MongoDB connection failure", err, "error", priorBootFailures ? { ping: false } : {}); });

// ==========================================
// THE CLIENT
// ==========================================
// The "Watching ..." line under the bot's name in its profile popout (Discord has no custom-text-only option -- ActivityType picks the verb, e.g. Watching/Listening/Playing).
//
// Passed in ClientOptions rather than via a post-ready client.user.setPresence(), because `presence` is a documented IDENTIFY field ("Presence structure for initial presence information") and discord.js otherwise identifies with its default empty `presence: {}` (Options.js), publishing no status at all. Path verified 2026-08-09 11:12 EDT: Client.js login() -> options.ws.presence -> WebSocketManager initialPresence -> @discordjs/ws sets d.presence on the IDENTIFY payload.
//
// ⚠️ PRESENCE IS DELIVERED ONLY TO USERS WHO SHARE A GUILD with the account, and prod sits at guild_count 0, so on prod this renders to an audience of nobody. That is a DISTRIBUTION fact, not a code bug -- do not "fix" it by adding fields, moving it, or setting it again post-ready. Confirmed on the dev bot 2026-08-09 11:27 EDT by a controlled add/kick/re-add cycle. It lights up by itself for any guild the app joins under the v3 guild-install work (docs/ROADMAP.md). The card itself (top line and verb rotating: Watching the season countdown, Competing in ranked, Playing DMZ, Listening to /help; "Add Dioreo · dioreo.app/install" under it) is built by utils/botPresence.js; this is its /help turn, so the first IDENTIFY already carries a presence. bot/lifecycle.js starts the swap on ready (2026-10-21 19:31 EDT).
const BOT_PRESENCE = require("./utils/botPresence").buildPresence();

const client = new Client({ intents: [GatewayIntentBits.Guilds], presence: BOT_PRESENCE });

// ==========================================
// WIRING
// ==========================================
// Order matters here and is the same order these ran in pre-split:
//   1. load the command modules, so `commands` exists before any ClientReady listener can use it;
//   2. register the lifecycle listeners (client `error` net, gateway diagnostics, ready, alerts);
//   3. register the interaction router.
// ⚠️ registerLifecycle installs `client.on("error", ...)`, which is NOT optional and is NOT covered by the router's own try/catch -- discord.js's captureRejections reroutes a rejected async listener into a client `error` event that bypasses it entirely. See .claude/rules/interaction-router.md.
const commands = loadCommandModules(client);

// DIOREO ADMIN (2026-10-19 13:44 EDT): with ADMIN_BOT_TOKEN set, a second Client logs in as the admin app and takes the admin and experimental commands, so they leave every user's command list. It shares the command Collection and the router, so a click runs the same code whichever app it came through. Without the token, nothing here runs and every command stays on the public app. See bot/clients.js.
const ADMIN_TOKEN = adminTokenFrom(process.env);
const { publicCommands, adminCommands } = splitCommands(commands, client.commands, { adminApp: Boolean(ADMIN_TOKEN) });

registerLifecycle(client, publicCommands);
client.on("interactionCreate", handleInteraction);

let adminClient = null;
if (ADMIN_TOKEN) {
    adminClient = new Client({ intents: [GatewayIntentBits.Guilds] });
    adminClient.commands = client.commands;
    registerAdminLifecycle(adminClient, adminCommands, ADMIN_TOKEN);
    adminClient.on("interactionCreate", handleInteraction);
}
setClients({ public: client, admin: adminClient });

// ==========================================
// LOGIN
// ==========================================
// Gated on the single-instance lock so a stray leftover local `node index.js` can't silently race an already-running instance (VM or another local process) the way it did in the 2026-07-14 incident (see .claude/rules/accent-and-colors.md). The acquireInstanceLock() query is issued via Mongoose, which buffers commands until the mongoose.connect() call above actually finishes -- no extra wait-for-connection logic needed here.
//
// 🔴 A FAILED BOOT EXITS NON-ZERO (2026-10-20, v3 sweep). This block used to have no catch and left login() un-awaited, so a lock query that timed out (Atlas unreachable at a restart) or a rejected login (bad token, network) became an unhandled rejection -- which the net at the top of this file deliberately LOGS AND SURVIVES. The process then sat alive but never logged in, and systemd, seeing it running, never restarted it. Exiting lets systemd retry. The wait before exiting grows with each failure in a row and only the first one pings (utils/bootFailures.js), so an Atlas outage backs off instead of pinging every ~13s; it also gives sendAlert()'s fire-and-forget webhook POST time to leave; the lock needs no release, because the next boot reads a dead pid on this host as an abandoned lock (utils/instanceLock.js isHolderAlive). A ready bot ends the failure run. Registered before login, because ready can fire before login()'s promise settles.
client.once('clientReady', () => bootFailures.clear());
(async () => {
    try {
        const acquired = await acquireInstanceLock();
        if (!acquired) {
            process.exit(1);
        }
        // The admin app gets its own lock: two processes with different public tokens must still never both log in as the same admin app.
        if (adminClient && !(await acquireInstanceLock(ADMIN_TOKEN))) {
            process.exit(1);
        }
        await client.login(process.env.BOT_TOKEN);
    } catch (err) {
        const n = bootFailures.record();
        const waitMs = bootFailures.backoffMs(n);
        console.error(`❌ Boot failed before the bot could log in (${n} in a row); exiting in ${waitMs / 1000}s so systemd restarts it:`, err);
        sendAlert('Boot failed', err, 'error', n > 1 ? { ping: false } : {});
        setTimeout(() => process.exit(1), waitMs);
        return;
    }
    // The admin app's login is NOT fatal: a wrong or revoked ADMIN_BOT_TOKEN must not take the public bot down with it. It alerts and the public bot keeps serving, which is how an un-awaited admin login behaved before the boot fix above.
    if (adminClient) {
        try { await adminClient.login(ADMIN_TOKEN); }
        catch (err) { console.error('❌ Dioreo Admin failed to log in; the public bot keeps running:', err); sendAlert('Dioreo Admin login failed', err, 'error'); }
    }
})();
