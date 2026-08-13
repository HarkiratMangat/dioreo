// NOTE (removed 2026-07-20): a "PHASE 1: WEB SERVER ARCHITECTURE (KEEP-ALIVE)" banner used to sit
// here, wrapping a small Express server whose only job was stopping Render/Railway's free tier from
// idling the bot container during inactivity — a hosting-specific workaround, not part of the bot's
// own logic. Removed once the bot moved to a GCP VM under systemd (2026-07-17), which runs the
// process continuously and doesn't idle/spin down, so the keep-alive ping had nothing left to do.
// Left as a breadcrumb, same convention as the PHASE 5 removal note further down, so Phase numbering
// starting at 2 doesn't read like something's missing.
// FIRST, before anything else can log. patchConsole() tags error/warn output with a systemd severity
// prefix (so `journalctl -p err` and Cloud Logging severity stop being permanently zero) and tees a
// structured copy to the Ops Agent's JSON sink. It must run ahead of the crash handlers below, or the
// two most important lines the bot can ever emit -- an unhandled rejection and an uncaught exception --
// would be the only ones still logged as plain `info`. See utils/logger.js for the full why.
// ⚠️ logger.js reads DIORS_COMMIT / DIORS_LOG_FILE at require time, which is BEFORE dotenv.config()
// runs further down. Both are set by systemd/deploy.sh as real environment variables on purpose --
// putting either in `.env` would silently do nothing (same ordering trap as the .env.dev backfill).
const { patchConsole, logBootBanner } = require('./utils/logger');
patchConsole();
// Emitted before any other output so vmstatus.sh can attribute every subsequent journal line to this
// version/commit -- including lines from a startup that never reaches ClientReady.
logBootBanner();

const { sendAlert } = require('./utils/alertWebhook'); // Discord webhook alerting; reads LOG_WEBHOOK_URL lazily, no-op if unset
const { createGatewayRecovery } = require('./utils/gatewayRecovery'); // pairs "Back online" to the problem alert that announced an outage

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
    sendAlert('Unhandled promise rejection', reason, 'error');
});

// Companion net for a SYNCHRONOUS throw with no handler (which would otherwise crash the process).
// Log + alert (with an active ping — a crash is exactly the "something you should notice" case) and
// STAY ALIVE, matching this bot's established "degrade to 'that one path failed', never take the whole
// bot down" philosophy (see CLAUDE.md crash-resilience). systemd would auto-restart anyway, but staying
// up avoids dropping every other in-flight interaction over one bad code path.
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception (bot stays alive):', err);
    sendAlert('Uncaught exception', err, 'error');
});

// ==========================================
// PHASE 2: CORE MODULES & DEPENDENCY IMPORTS
// ==========================================
const fs = require('fs');
const path = require('path');
require('dotenv').config({ quiet: true }); // quiet: true suppresses dotenv's runtime log line (incl. its rotating promotional "tip" text)

// package.json's `version` is bumped at every git-workflow MERGE (not on every commit/push -- see
// project_git_workflow memory) and is otherwise dead at runtime, so reading it here is free/safe. This
// is the "what's actually running" signal: main's version = latest tag = package.json on main; the VM's
// running version = package.json on whatever commit the VM last deployed -- the two can legitimately
// diverge since deploy is a separate, optional step from merge.
const { version: BOT_VERSION } = require('./package.json');

const mongoose = require('mongoose'); // Add to dependency imports
// Only the scheduled-cleanup half of the Cloudinary cache is used here now; resolveThumbnail moved
// to handlers/router.js with the bulk draw-save helpers that were its only caller.
const { pruneExpiredThumbnails } = require('./utils/cloudinaryCache');
const { pruneOrphanedPatchFolders } = require('./utils/patchNotesCache');
const { acquireInstanceLock } = require('./utils/instanceLock');

// CONNECT TO MONGO (Atlas in prod; a LOCAL mongodb://localhost database under `.env.dev`)
// The success line names the actual host rather than hardcoding "Atlas Cluster" -- it used to claim
// Atlas unconditionally, which reads like the DEV bot just connected to the PRODUCTION database when
// it did nothing of the sort (mis-read exactly that way 2026-07-26 21:04 EDT). Host only, never the
// full URI: that string carries the Atlas credentials.
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        const host = mongoose.connection.host || 'unknown host';
        const dbName = mongoose.connection.name || 'unknown db';
        console.log(`🍃 Successfully authenticated and established secure link to MongoDB (${host}/${dbName})!`);
    })
    .catch(err => { console.error('❌ Database connection failure detailed error:', err); sendAlert('MongoDB connection failure', err, 'error'); });

// Destructuring modern discord.js elements with structural lifecycle elements (Events binding)
const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    Collection,
    Events,
    ActivityType
} = require('discord.js');

// ==========================================
// PHASE 3: CORE UTILITIES
// ==========================================

// buildSyntheticInteraction + resolvePanelActor live in utils/interactionContext.js, and the routing
// that used them lives in handlers/router.js -- so this file no longer imports either. Both are
// documented there; the reasoning behind them (two real crashes for the first, the admin-override
// contract for the second) travelled with the code rather than being left behind as orphan comments.

// The "Watching ..." line under the bot's name in its profile popout (Discord has no custom-text-only
// option -- ActivityType picks the verb, e.g. Watching/Listening/Playing). Static rather than derived
// from live state (guild count, etc.) since this app is user-installed only (CLAUDE.md).
//
// Passed in ClientOptions rather than via a post-ready client.user.setPresence(), because `presence`
// is a documented IDENTIFY field ("Presence structure for initial presence information") and
// discord.js otherwise identifies with its default empty `presence: {}` (Options.js), publishing no
// status at all. Path verified 2026-08-09 11:12 EDT: Client.js login() -> options.ws.presence ->
// WebSocketManager initialPresence -> @discordjs/ws sets d.presence on the IDENTIFY payload.
//
// ⚠️ THIS RENDERS NOWHERE ON PROD TODAY, and that is a DISTRIBUTION fact, not a code bug -- do not
// "fix" it by adding fields, moving it back, or setting it again post-ready. Presence is delivered
// only to users who share a GUILD with the account; prod is user-installed only (CLAUDE.md) and sits
// at guild_count 0 (GET /users/@me/guilds), so it is published to an audience of nobody.
// CONFIRMED on the dev bot 2026-08-09 11:27 EDT by a controlled add/kick/re-add cycle: with zero
// guilds the dot is grey and no activity card exists; the instant the app joined one guild BOTH
// appeared (no restart needed -- it propagates on GUILD_CREATE), they vanished on kick, and returned
// on re-invite. Discord's own profile card names the mechanism: it prints "1 Mutual Server".
// So the ceiling is per-viewer: only members of a guild the app is in ever see this. It is kept
// because it is the documented-correct mechanism and lights up by itself for any guild the app
// joins under the v4 guild-install roadmap (docs/ROADMAP.md).
// ⚠️ STILL UNTESTED: whether ClientOptions is REQUIRED, or a post-ready setPresence() would work
// equally well now that a guild exists -- guild membership was the only variable the test isolated.
const BOT_PRESENCE = {
    status: 'online',
    activities: [{ name: '/help · dioreo.app', type: ActivityType.Watching }],
};

// Instantiate internal client data models
const client = new Client({ intents: [GatewayIntentBits.Guilds], presence: BOT_PRESENCE });

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
    sendAlert('Discord client error', error, 'error');
});

// DIAGNOSTIC LOGGING (added 2026-07-16): found live that the Gateway handshake can silently take
// 10+ minutes with ZERO error on either client.login()'s promise or the 'error' handler above --
// MongoDB connects and the Express keep-alive server binds fine, but handleBotReady() (which logs
// "fully authenticated"/"routing links integrated") never fires until the WS layer's internal
// retry/backoff eventually succeeds. That internal retry activity was completely invisible, so a
// real multi-minute production gap looked identical to "nothing is happening" from the logs alone.
// These shard-lifecycle events are the actual diagnostic trail for next time -- deliberately NOT
// listening to the raw 'debug' event, which fires on nearly every heartbeat and would flood
// production logs; these five only fire on real state transitions.
// Each shard-lifecycle event also fires a Discord alert (utils/alertWebhook.js) so gateway trouble is
// visible in real time, not just in journald. shardReady stays console-only (the initial connect is
// announced by the "Bot online" alert below); the rest map to warn/error/info by severity.
// ⚠️ RECOVERY IS PAIRED TO THE ANNOUNCEMENT (2026-08-06 14:54 EDT). Harkirat: he learns the bot broke
// and never that it healed — "there is no signal at all when the bot recovers".
//
// The naive fix (make 'Gateway resumed' loud) is WRONG and would undo a correct decision: that pair
// fires every 1-3h as routine churn, and posting it would restore exactly the noise the 2026-07-20
// `silent` call removed. Noise is not a lesser problem than silence — it is how someone learns to stop
// reading the channel, and then the loud alerts stop working too.
//
// So the rule is symmetry: **a problem that was ANNOUNCED gets a recovery that is ANNOUNCED; a problem
// that was silent stays silent.** A routine blip is still invisible; the disconnect that pinged his
// phone at 03:00 now gets an explicit "Back online", with how long it was actually down.
//
// ⚠️ BOTH recovery paths must be handled, and the worse one is the easy one to miss. `shardResume`
// fires when the session is replayed — the GOOD case. When a disconnect is bad enough that the session
// can't be resumed, discord.js re-identifies from scratch and only `shardReady` fires. Wiring the
// recovery to `shardResume` alone would therefore leave precisely the WORST outages — the ones most
// worth closing out — with no recovery signal, which is the bug this is fixing, reintroduced one level
// down.
// The state machine itself lives in utils/gatewayRecovery.js so it can be unit-tested — inline here it
// was reachable only by a real Discord outage. See that file for the full reasoning.
const { noteTrouble: noteGatewayTrouble, noteRecovered: noteGatewayRecovered } = createGatewayRecovery({ sendAlert });

// shardReady is no longer console-only: it is the re-identify recovery path described above. On the
// FIRST connect gatewayTroubleAt is null, so noteGatewayRecovered() no-ops and the initial connect is
// still announced solely by "Bot online" below — no duplicate.
client.on('shardReady', (id) => { console.log(`🔌 Shard ${id} ready`); noteGatewayRecovered(`shard ${id} reconnected with a fresh session`); });
// The reconnect→resume PAIR is `silent` (2026-07-20, Harkirat's call): still logged to the alert store
// (so /alerts + a future /status can print the reconnect history on demand), but NOT posted to the Discord
// channel. These fire every 1-3h as routine, self-recovering gateway churn (Discord cycling sessions /
// tiny network blips, sub-second, resumed with full event replay = zero data loss) — genuinely nothing to
// act on, so they're pure channel noise. The GENUINELY-bad case is still loud: a reconnect that FAILS to
// resume surfaces via 'Gateway disconnected' (shardDisconnect, orange, pings) below — a separate handler,
// so suppressing the routine pair from Discord doesn't hide a real outage.
// The silent 'Gateway resumed' is kept for the routine case (it is what /alerts reads back), and is
// SKIPPED when a loud "Back online" already covered the same recovery — two log rows for one event
// would make the reconnect history read as twice as much churn as actually happened.
client.on('shardResume', (id, replayed) => {
    console.log(`🔌 Shard ${id} resumed (${replayed} events replayed)`);
    if (noteGatewayRecovered(`shard ${id} resumed and replayed ${replayed} events`)) return;
    sendAlert('Gateway resumed', `Shard ${id} reconnected and replayed ${replayed} events.`, 'info', { silent: true });
});
// 'caution' (yellow), not 'warn' (orange): reconnecting is transient and self-recovering, so it's a
// lower severity than a full 'Gateway disconnected'. Now silent (logged, not posted) — see the pair note
// above. "Reconnecting to Discord", NOT "restarting" (2026-07-20): the gateway WEBSOCKET dropped and is
// re-establishing on its own — the bot PROCESS never died, systemd never fired. Calling it "restarting"
// would falsely imply a crash.
client.on('shardReconnecting', (id) => { console.log(`🔌 Shard ${id} reconnecting...`); sendAlert('Reconnecting to Discord', `Shard ${id}'s gateway websocket dropped and is reconnecting. The bot process itself is fine (nothing crashed, systemd didn't fire).`, 'caution', { silent: true }); });
client.on('shardDisconnect', (event, id) => { console.log(`🔌 Shard ${id} disconnected (code ${event?.code})`); noteGatewayTrouble(); sendAlert('Gateway disconnected', `Shard ${id} disconnected (close code ${event?.code}).`, 'warn', { ping: true }); });
client.on('shardError', (error, id) => { console.error(`🔌 Shard ${id} error (bot stays alive):`, error); noteGatewayTrouble(); sendAlert('Gateway shard error', error, 'error'); });

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
    console.log(`✅ Dioreo instance fully authenticated!`);

    // Re-point emojiMap's mention strings at the ids owned by whichever app this token belongs to.
    // Application emojis only render for their owning app, so the dev bot (a separate application
    // with its own same-named copies) needs its own ids. No-op on prod. Awaited before anything
    // renders; fail-soft internally, so a failure here can never block command registration.
    const { refreshEmojiIds } = require('./utils/emojiMap');
    const emojiSync = await refreshEmojiIds(client);
    if (emojiSync.synced || emojiSync.overridden || emojiSync.missing.length) {
        console.log(`😀 Emoji ids: ${emojiSync.synced} re-pointed to this app, ${emojiSync.overridden} dev-overridden, ${emojiSync.missing.length} unmatched${emojiSync.missing.length ? ` (${emojiSync.missing.join(', ')})` : ''}`);
    }

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

    // The names /server's "always hidden commands" menu offers (2026-08-10 15:48 EDT, v3 server-admin
    // visibility policy). Derived from `commands` -- the SAME array that is about to be registered --
    // rather than from client.commands or a readdir of commands/*.js, both of which miss the eight
    // per-category weapon commands and `all` built directly above. A hand-maintained list here would
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

    // Kick off the Cloudinary temp-draws cleanup on boot, then every 24h -- not awaited, since a
    // slow/failing Cloudinary call has no business delaying command registration above.
    runCloudinaryCleanup();
    setInterval(runCloudinaryCleanup, 24 * 60 * 60 * 1000);
}

// --- DRAW THUMBNAIL CLOUDINARY CACHE: SCHEDULED CLEANUP (2026-07-12) ---
// Cloudinary has no native per-asset TTL (confirmed against the current cloudinary_npm docs before
// building this feature) -- so "auto-delete after 45 days" only happens because THIS runs on a
// schedule, not because Cloudinary does it on its own. Deletes only assets that are BOTH 45+ days
// old AND no longer referenced by any current draw (Harkirat's confirmed rule), so a long-lived
// draw's cached image is never at risk just because it's been up a while. Wrapped in its own
// try/catch since this runs unawaited from handleBotReady -- a failure here must never be able to
// crash the bot (matches the crash-resilience convention documented in CLAUDE.md).
async function runCloudinaryCleanup() {
    try {
        const SeasonalData = require('./models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        const currentUrls = new Set([
            ...(seasonalDoc?.newDraws || []).map(d => d.thumbnailUrl),
            ...(seasonalDoc?.returningDraws || []).map(d => d.thumbnailUrl)
        ]);

        const result = await pruneExpiredThumbnails(currentUrls);
        if (result.deletedCount > 0) {
            console.log(`🧹 Cloudinary cleanup: pruned ${result.deletedCount} expired, unused draw thumbnail(s).`);
        }

        // PATCH NOTES: season-based retention, not age-based -- keep exactly the same set of
        // patch note `_id`s that /patch notes' own history dropdown shows (the last 5 entries,
        // matching patchnotes.js's `recentPatches = seasonalDoc.patchNotes.slice(-5)`). A season
        // that rolls off the back of that list gets its whole Cloudinary folder pruned on the very
        // next sweep, regardless of how many days it's been cached -- see utils/patchNotesCache.js.
        const keepPatchIds = new Set((seasonalDoc?.patchNotes || []).slice(-5).map(p => p._id.toString()));
        const patchResult = await pruneOrphanedPatchFolders(keepPatchIds);
        if (patchResult.deletedCount > 0) {
            console.log(`🧹 Cloudinary cleanup: pruned ${patchResult.deletedCount} patch-notes image(s) from seasons no longer in the history dropdown.`);
        }
    } catch (error) {
        // SECURITY: never fall back to logging the raw `error` object here -- a Cloudinary error's
        // shape can carry the account's API key/secret in a nested `request_options.auth` field (see
        // utils/cloudinaryCache.js's safeErrorMessage note). This should be unreachable in practice
        // now (pruneExpiredThumbnails sanitizes everything it catches internally), but this is the
        // last line of defense for a SeasonalData/Mongoose error from the same block, so it stays
        // just as strict rather than assuming the callee always behaves.
        console.error(`Cloudinary cleanup pass failed (bot stays alive): ${error?.message || 'Unknown error'}`);
    }
}

client.once(Events.ClientReady, handleBotReady);
// Alerting: a one-time "online" ping on each (re)start, so deploys/crashes/restarts are visible in
// Discord. systemd auto-restarts the bot on crash, so an "online" alert you DIDN'T trigger is itself a
// useful signal that the process restarted unexpectedly.
// `client.ws.ping` is -1 until the FIRST gateway heartbeat round-trip completes — and ClientReady fires
// before that, so the "Bot online" alert used to say a nonsensical "gateway -1ms". Show "measuring…"
// until a real ping exists. Shared by the daily heartbeat below (defensive there too).
function formatPing(ms) { return ms >= 0 ? `${Math.round(ms)}ms` : 'measuring…'; }

// Manual-vs-automatic restart labeling (2026-07-20). The bot can't natively know WHY systemd started it,
// so scripts/deploy.sh writes a `.restart-reason` marker (gitignored) right before restarting; on boot we
// read + CONSUME it here. A marker => a deliberate restart (deploy/manual); no marker => an unattended
// restart (systemd auto-restart after a crash, OR a bare `systemctl restart` that skipped deploy.sh).
// Fully swallowed — a marker problem must never affect boot.
const RESTART_MARKER = path.join(__dirname, '.restart-reason');
function readRestartReason() {
    try {
        if (!fs.existsSync(RESTART_MARKER)) return null;
        const raw = fs.readFileSync(RESTART_MARKER, 'utf8').trim();
        fs.unlinkSync(RESTART_MARKER); // consume-once, whatever we found
        const [reason, tsStr] = raw.split(/\s+/); // "<reason> <unix-seconds>" (deploy.sh format)
        const ts = parseInt(tsStr, 10);
        // Only honor a FRESH marker (<10 min) so a stale one left by a failed/earlier deploy can't
        // mislabel a much-later crash-restart as a deploy. Too old => treat as no marker.
        if (Number.isFinite(ts) && (Date.now() / 1000 - ts) > 600) return null;
        return reason || null;
    } catch { return null; }
}
// systemd auto-restart count — informational context on the automatic path only. VM-only; off the VM (no
// systemd unit) execSync throws and we return ''. Its reset semantics are fuzzy, so it's raw context, not
// something we interpret as crash-vs-fresh.
function restartContext() {
    try {
        // execFileSync (no shell) — the args are static anyway, but this is the shell-free form.
        const { execFileSync } = require('child_process');
        const n = execFileSync('systemctl', ['show', 'diors-bot', '-p', 'NRestarts', '--value'],
            { encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        return /^\d+$/.test(n) ? `systemd NRestarts=${n}` : '';
    } catch { return ''; }
}
client.once(Events.ClientReady, (c) => {
    const reason = readRestartReason();
    const kind = reason === 'deploy' ? '🚀 Manual deploy (git pull + restart)'
        : reason === 'manual' ? '🔧 Manual restart'
        : (() => { const ctx = restartContext(); return `♻️ Automatic/unattended restart${ctx ? ` (${ctx})` : ''}`; })();
    sendAlert('Bot online', `${kind}\nv${BOT_VERSION} · Logged in as ${c.user?.tag} · ${c.guilds.cache.size} servers · gateway ${formatPing(c.ws.ping)}`, 'info');
});

// DAILY "STILL HEALTHY" HEARTBEAT (2026-07-17) — an info-level, NON-pinging alert once every 24h so a
// long, quiet uptime is proven-alive rather than merely assumed. The other alerts only fire on
// trouble (crashes, gateway loss) or on (re)start ("Bot online"); with none of those, silence is
// ambiguous — "healthy" and "the alerter/VM is dead" look identical. This heartbeat resolves that: no
// daily green means something is wrong. Deliberately info+no-ping (routine, must not notify his phone);
// sendAlert's 1/min throttle never trips at a 24h cadence. NOT fired immediately on boot — "Bot online"
// already covers startup; the interval's whole value is the stretches with NO restart in between (a
// restart resets this timer but also emits its own "Bot online", so no health gap is left uncovered).
const HEARTBEAT_MS = 24 * 60 * 60 * 1000;
function formatUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return [d ? `${d}d` : '', h ? `${h}h` : '', `${m}m`].filter(Boolean).join(' ');
}
function sendHeartbeat() {
    // If the gateway is NOT currently ready, stay silent — that's a real problem the gateway/shard
    // handlers alert on themselves; a heartbeat firing anyway would be misleading, and a green "healthy"
    // during an outage is worse than no heartbeat at all.
    if (!client.isReady()) return;
    const mem = process.memoryUsage();
    const rss = Math.round(mem.rss / 1024 / 1024);
    const heap = Math.round(mem.heapUsed / 1024 / 1024);
    sendAlert(
        'Daily health check',
        `Still online and healthy.\n`
        + `• Uptime: ${formatUptime(process.uptime())}\n`
        + `• Servers: ${client.guilds.cache.size}\n`
        + `• Gateway latency: ${formatPing(client.ws.ping)}\n`
        + `• Memory: ${rss}MB RSS · ${heap}MB heap`,
        'info'
    );
}
client.once(Events.ClientReady, () => {
    // .unref() so the heartbeat timer alone never keeps the process alive — the gateway connection is
    // what keeps it running; same convention as this file's other timers (pendingManageEdits, etc.).
    setInterval(sendHeartbeat, HEARTBEAT_MS).unref();
});

// NOTE (removed during review): a "PHASE 5: INTERACTIVE ELEMENT GENERATORS" banner used to sit
// here with no code under it -- the generators it originally described (loadBuildsFromExcel()'s
// in-memory builders) moved to utils/loadoutRender.js during the MP-migration work and were never
// cleaned up from this file's phase numbering. Removed rather than left as a gap between Phase 4
// and Phase 6 that reads like something's missing.


// ==========================================
// PHASE 6: INTERACTION ROUTING
// ==========================================
// The dispatcher itself lives in handlers/router.js (moved 2026-08-13 17:10 EDT). Registering it as
// a plain listener rather than inlining ~3,400 lines here is the whole point of the split. The
// `client.on('error', ...)` listener registered above is still REQUIRED alongside it -- see that
// file's header and .claude/rules/interaction-router.md for why one does not cover the other.
const { handleInteraction } = require("./handlers/router");
client.on("interactionCreate", handleInteraction);


// Initialize system authorization -- gated on the single-instance lock so a stray leftover local
// `node index.js` can't silently race an already-running instance (VM or another local process)
// the way it did in the 2026-07-14 incident (see .claude/rules/accent-and-colors.md). The
// acquireInstanceLock() query is issued via Mongoose, which buffers commands until the
// mongoose.connect() call above actually finishes -- no extra wait-for-connection logic needed here.
(async () => {
    const acquired = await acquireInstanceLock();
    if (!acquired) {
        process.exit(1);
    }
    client.login(process.env.BOT_TOKEN);
})();