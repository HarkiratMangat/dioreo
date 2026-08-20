// ==========================================
// CLIENT LIFECYCLE — CRASH NET, GATEWAY, READY, ALERTING
// ==========================================
// Every listener bound to the client that is NOT interaction routing. Split out of index.js on 2026-08-13 17:20 EDT; the logic and the registration ORDER are unchanged.
//
// Registered as one call, registerLifecycle(client, commands), so the entrypoint stays a list of wiring steps rather than 350 lines of listener bodies. Same listeners, same registration order as index.js carried: the client `error` net, gateway/shard diagnostics, ready (emoji sync -> command registration -> cleanup), restart labeling + the boot alert, and the daily heartbeat.

const fs = require('fs');
const path = require('path');
const { Events } = require('discord.js');
const { version: BOT_VERSION } = require('../package.json');
const { sendAlert } = require('../utils/alertWebhook');
const { createGatewayRecovery } = require('../utils/gatewayRecovery');
const { pruneExpiredThumbnails } = require('../utils/cloudinaryCache');
const { pruneOrphanedPatchFolders } = require('../utils/patchNotesCache');
const { applyGunsmithsScopeChoices, registerApplicationCommands } = require('./registry');

// --- DRAW THUMBNAIL CLOUDINARY CACHE: SCHEDULED CLEANUP (2026-07-12) --- Cloudinary has no native per-asset TTL (confirmed against the current cloudinary_npm docs before building this feature) -- so "auto-delete after 45 days" only happens because THIS runs on a schedule, not because Cloudinary does it on its own. Deletes only assets that are BOTH 45+ days old AND no longer referenced by any current draw (Harkirat's confirmed rule), so a long-lived draw's cached image is never at risk just because it's been up a while. Wrapped in its own try/catch since this runs unawaited from handleBotReady -- a failure here must never be able to crash the bot (matches the crash-resilience convention documented in CLAUDE.md).
async function runCloudinaryCleanup() {
    try {
        const SeasonalData = require('../models/SeasonalData');
        const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
        const currentUrls = new Set([
            ...(seasonalDoc?.newDraws || []).map(d => d.thumbnailUrl),
            ...(seasonalDoc?.returningDraws || []).map(d => d.thumbnailUrl)
        ]);

        const result = await pruneExpiredThumbnails(currentUrls);
        if (result.deletedCount > 0) {
            console.log(`🧹 Cloudinary cleanup: pruned ${result.deletedCount} expired, unused draw thumbnail(s).`);
        }

        // PATCH NOTES: season-based retention, not age-based -- keep exactly the same set of patch note `_id`s that /patch notes' own history dropdown shows (the last 5 entries, matching patchnotes.js's `recentPatches = seasonalDoc.patchNotes.slice(-5)`). A season that rolls off the back of that list gets its whole Cloudinary folder pruned on the very next sweep, regardless of how many days it's been cached -- see utils/patchNotesCache.js.
        const keepPatchIds = new Set((seasonalDoc?.patchNotes || []).slice(-5).map(p => p._id.toString()));
        const patchResult = await pruneOrphanedPatchFolders(keepPatchIds);
        if (patchResult.deletedCount > 0) {
            console.log(`🧹 Cloudinary cleanup: pruned ${patchResult.deletedCount} patch-notes image(s) from seasons no longer in the history dropdown.`);
        }
    } catch (error) {
        // SECURITY: never fall back to logging the raw `error` object here -- a Cloudinary error's shape can carry the account's API key/secret in a nested `request_options.auth` field (see utils/cloudinaryCache.js's safeErrorMessage note). This should be unreachable in practice now (pruneExpiredThumbnails sanitizes everything it catches internally), but this is the last line of defense for a SeasonalData/Mongoose error from the same block, so it stays just as strict rather than assuming the callee always behaves.
        console.error(`Cloudinary cleanup pass failed (bot stays alive): ${error?.message || 'Unknown error'}`);
    }
}

// `client.ws.ping` is -1 until the FIRST gateway heartbeat round-trip completes — and ClientReady fires before that, so the "Bot online" alert used to say a nonsensical "gateway -1ms". Show "measuring…" until a real ping exists. Shared by the daily heartbeat below (defensive there too).
function formatPing(ms) { return ms >= 0 ? `${Math.round(ms)}ms` : 'measuring…'; }

function formatUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return [d ? `${d}d` : '', h ? `${h}h` : '', `${m}m`].filter(Boolean).join(' ');
}

// Manual-vs-automatic restart labeling (2026-07-20). The bot can't natively know WHY systemd started it, so scripts/deploy.sh writes a `.restart-reason` marker (gitignored) right before restarting; on boot we read + CONSUME it here. A marker => a deliberate restart (deploy/manual); no marker => an unattended restart (systemd auto-restart after a crash, OR a bare `systemctl restart` that skipped deploy.sh). Fully swallowed — a marker problem must never affect boot. ⚠️ Resolved against this file's PARENT: deploy.sh writes the marker at the REPO ROOT, and this module lives in bot/. __dirname alone would look in the wrong directory and silently mislabel every deploy as an unattended restart.
const RESTART_MARKER = path.join(__dirname, '..', '.restart-reason');
function readRestartReason() {
    try {
        if (!fs.existsSync(RESTART_MARKER)) return null;
        const raw = fs.readFileSync(RESTART_MARKER, 'utf8').trim();
        fs.unlinkSync(RESTART_MARKER); // consume-once, whatever we found
        const [reason, tsStr] = raw.split(/\s+/); // "<reason> <unix-seconds>" (deploy.sh format)
        const ts = parseInt(tsStr, 10);
        // Only honor a FRESH marker (<10 min) so a stale one left by a failed/earlier deploy can't mislabel a much-later crash-restart as a deploy. Too old => treat as no marker.
        if (Number.isFinite(ts) && (Date.now() / 1000 - ts) > 600) return null;
        return reason || null;
    } catch { return null; }
}

// systemd auto-restart count — informational context on the automatic path only. VM-only; off the VM (no systemd unit) execSync throws and we return ''. Its reset semantics are fuzzy, so it's raw context, not something we interpret as crash-vs-fresh.
function restartContext() {
    try {
        // execFileSync (no shell) — the args are static anyway, but this is the shell-free form.
        const { execFileSync } = require('child_process');
        const n = execFileSync('systemctl', ['show', 'diors-bot', '-p', 'NRestarts', '--value'],
            { encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        return /^\d+$/.test(n) ? `systemd NRestarts=${n}` : '';
    } catch { return ''; }
}

// ==========================================
// THE ONE ENTRY POINT
// ==========================================
function registerLifecycle(client, commands) {
    // --- THE CLIENT `error` NET --- CRASH FIX (found live on Railway, 2026-07-07): discord.js's BaseClient constructs itself with `super({ captureRejections: true })` (node_modules/discord.js/src/client/BaseClient.js) -- this is a Node EventEmitter option that reroutes a rejected promise from an async event listener (e.g. the interactionCreate handler in handlers/router.js) into an `error` event emitted ON THE CLIENT ITSELF, instead of surfacing through Node's normal global `process.on('unhandledRejection')` mechanism. Since nothing was listening for a plain `error` event on the client, and EventEmitter's default behavior for an unhandled `error` event is to throw synchronously, ANY interaction handler code that ever let a rejection escape (even somewhere the router's top-level try/catch doesn't cover, or in a future edit that misses it) would crash the whole process — completely bypassing the `process.on('unhandledRejection')` net in index.js, since captureRejections intercepts it before it ever becomes a "global" unhandled rejection. This IS the standard discord.js gotcha their own guide warns about; the fix is simply to always have a listener here so EventEmitter's default "throw when no listener" never triggers. ⚠️ THIS IS NOT OPTIONAL AND IS NOT COVERED BY THE ROUTER'S try/catch. Removing it re-opens the crash. See .claude/rules/interaction-router.md.
    client.on('error', (error) => {
        console.error('Discord client error (bot stays alive):', error);
        sendAlert('Discord client error', error, 'error');
    });

    // --- HOTPATCH CHANNEL (2026-08-20 11:47 EDT) --- scripts/hotpatch.mjs writes .hotpatch-request and signals this pid. Consume-once, exactly like readRestartReason()'s marker. Fully swallowed: a malformed request must never be able to disturb a running bot.
    process.on('SIGUSR2', async () => {
        const reqPath = path.join(__dirname, '..', '.hotpatch-request');
        const resPath = path.join(__dirname, '..', '.hotpatch-result');
        let request;
        try { request = JSON.parse(fs.readFileSync(reqPath, 'utf8')); fs.unlinkSync(reqPath); }
        catch { return; }                       // no request, or unreadable -> nothing to do
        try {
            const out = await require('../utils/hotpatch').runHotpatch({ client, ...request });
            fs.writeFileSync(resPath, JSON.stringify(out, null, 2));
        } catch (error) {
            console.error('Hotpatch request failed (bot stays alive):', error);
            try { fs.writeFileSync(resPath, JSON.stringify({ error: error.message })); } catch { /* best effort */ }
        }
    });

    // --- GATEWAY / SHARD DIAGNOSTICS --- DIAGNOSTIC LOGGING (added 2026-07-16): found live that the Gateway handshake can silently take 10+ minutes with ZERO error on either client.login()'s promise or the 'error' handler above -- MongoDB connects fine, but handleBotReady() (which logs "fully authenticated"/"routing links integrated") never fires until the WS layer's internal retry/backoff eventually succeeds. That internal retry activity was completely invisible, so a real multi-minute production gap looked identical to "nothing is happening" from the logs alone. These shard-lifecycle events are the actual diagnostic trail for next time -- deliberately NOT listening to the raw 'debug' event, which fires on nearly every heartbeat and would flood production logs; these five only fire on real state transitions. Each shard-lifecycle event also fires a Discord alert (utils/alertWebhook.js) so gateway trouble is visible in real time, not just in journald. shardReady stays console-only (the initial connect is announced by the "Bot online" alert below); the rest map to warn/error/info by severity. ⚠️ RECOVERY IS PAIRED TO THE ANNOUNCEMENT (2026-08-06 14:54 EDT). Harkirat: he learns the bot broke and never that it healed — "there is no signal at all when the bot recovers".
    //
    // The naive fix (make 'Gateway resumed' loud) is WRONG and would undo a correct decision: that pair fires every 1-3h as routine churn, and posting it would restore exactly the noise the 2026-07-20 `silent` call removed. Noise is not a lesser problem than silence — it is how someone learns to stop reading the channel, and then the loud alerts stop working too.
    //
    // So the rule is symmetry: **a problem that was ANNOUNCED gets a recovery that is ANNOUNCED; a problem that was silent stays silent.** A routine blip is still invisible; the disconnect that pinged his phone at 03:00 now gets an explicit "Back online", with how long it was actually down.
    //
    // ⚠️ BOTH recovery paths must be handled, and the worse one is the easy one to miss. `shardResume` fires when the session is replayed — the GOOD case. When a disconnect is bad enough that the session can't be resumed, discord.js re-identifies from scratch and only `shardReady` fires. Wiring the recovery to `shardResume` alone would therefore leave precisely the WORST outages — the ones most worth closing out — with no recovery signal, which is the bug this is fixing, reintroduced one level down. The state machine itself lives in utils/gatewayRecovery.js so it can be unit-tested — inline here it was reachable only by a real Discord outage. See that file for the full reasoning.
    const { noteTrouble: noteGatewayTrouble, noteRecovered: noteGatewayRecovered } = createGatewayRecovery({ sendAlert });

    // shardReady is no longer console-only: it is the re-identify recovery path described above. On the FIRST connect gatewayTroubleAt is null, so noteGatewayRecovered() no-ops and the initial connect is still announced solely by "Bot online" below — no duplicate.
    client.on('shardReady', (id) => { console.log(`🔌 Shard ${id} ready`); noteGatewayRecovered(`shard ${id} reconnected with a fresh session`); });
    // The reconnect→resume PAIR is `silent` (2026-07-20, Harkirat's call): still logged to the alert store (so /alerts + a future /status can print the reconnect history on demand), but NOT posted to the Discord channel. These fire every 1-3h as routine, self-recovering gateway churn (Discord cycling sessions / tiny network blips, sub-second, resumed with full event replay = zero data loss) — genuinely nothing to act on, so they're pure channel noise. The GENUINELY-bad case is still loud: a reconnect that FAILS to resume surfaces via 'Gateway disconnected' (shardDisconnect, orange, pings) below — a separate handler, so suppressing the routine pair from Discord doesn't hide a real outage. The silent 'Gateway resumed' is kept for the routine case (it is what /alerts reads back), and is SKIPPED when a loud "Back online" already covered the same recovery — two log rows for one event would make the reconnect history read as twice as much churn as actually happened.
    client.on('shardResume', (id, replayed) => {
        console.log(`🔌 Shard ${id} resumed (${replayed} events replayed)`);
        if (noteGatewayRecovered(`shard ${id} resumed and replayed ${replayed} events`)) return;
        sendAlert('Gateway resumed', `Shard ${id} reconnected and replayed ${replayed} events.`, 'info', { silent: true });
    });
    // 'caution' (yellow), not 'warn' (orange): reconnecting is transient and self-recovering, so it's a lower severity than a full 'Gateway disconnected'. Now silent (logged, not posted) — see the pair note above. "Reconnecting to Discord", NOT "restarting" (2026-07-20): the gateway WEBSOCKET dropped and is re-establishing on its own — the bot PROCESS never died, systemd never fired. Calling it "restarting" would falsely imply a crash.
    client.on('shardReconnecting', (id) => { console.log(`🔌 Shard ${id} reconnecting...`); sendAlert('Reconnecting to Discord', `Shard ${id}'s gateway websocket dropped and is reconnecting. The bot process itself is fine (nothing crashed, systemd didn't fire).`, 'caution', { silent: true }); });
    client.on('shardDisconnect', (event, id) => { console.log(`🔌 Shard ${id} disconnected (code ${event?.code})`); noteGatewayTrouble(); sendAlert('Gateway disconnected', `Shard ${id} disconnected (close code ${event?.code}).`, 'warn', { ping: true }); });
    client.on('shardError', (error, id) => { console.error(`🔌 Shard ${id} error (bot stays alive):`, error); noteGatewayTrouble(); sendAlert('Gateway shard error', error, 'error'); });

    // ⚠️ readRestartReason() CONSUMES the .restart-reason marker file, so it can only be called once per boot. The "Bot online" listener below calls it, and it runs BEFORE this listener finishes (that one is synchronous; this one awaits). So the kind is stashed there and read here, rather than read twice -- a second call would always return null and the boot record would say every restart was unattended.
    let restartKind = null;

    // --- READY: EMOJI SYNC → COMMAND REGISTRATION → CLEANUP ---
    client.once(Events.ClientReady, async () => {
        console.log(`✅ Dioreo instance fully authenticated!`);

        // Re-point emojiMap's mention strings at the ids owned by whichever app this token belongs to. Application emojis only render for their owning app, so the dev bot (a separate application with its own same-named copies) needs its own ids. No-op on prod. Awaited before anything renders; fail-soft internally, so a failure here can never block command registration.
        const { refreshEmojiIds } = require('../utils/emojiMap');
        const emojiSync = await refreshEmojiIds(client);
        if (emojiSync.synced || emojiSync.overridden || emojiSync.missing.length) {
            console.log(`😀 Emoji ids: ${emojiSync.synced} re-pointed to this app, ${emojiSync.overridden} dev-overridden, ${emojiSync.missing.length} unmatched${emojiSync.missing.length ? ` (${emojiSync.missing.join(', ')})` : ''}`);
        }

        // Split into two independent try/catches (v3-pre-release review, finding #4) -- these were previously one unguarded `await` pair, so a throw in the FIRST call (unbounded choices, a renamed sub-option) silently skipped the SECOND, meaning no commands reached Discord at all with no loud signal beyond a generic client 'error' alert. Each failure is now independently alerted and neither can cancel the other.
        try {
            await applyGunsmithsScopeChoices(commands);
        } catch (scopeChoicesError) {
            console.error('❌ /gunsmiths scope choices failed to apply (registering commands anyway):', scopeChoicesError);
            sendAlert('/gunsmiths scope choices failed', scopeChoicesError, 'error');
        }
        try {
            await registerApplicationCommands(client, commands);
        } catch (registrationError) {
            console.error('❌ Command registration failed:', registrationError);
            sendAlert('Command registration failed', registrationError, 'error');
        }

        // Kick off the Cloudinary temp-draws cleanup on boot, then every 24h -- not awaited, since a slow/failing Cloudinary call has no business delaying command registration above. NOTE: deliberately NOT .unref()'d, matching the pre-split behaviour exactly. The heartbeat timer below is unref'd; this one never was. Left as-is so this move stays a pure move -- if it should be unref'd for consistency, that is its own change with its own reasoning.
        runCloudinaryCleanup();
        setInterval(runCloudinaryCleanup, 24 * 60 * 60 * 1000);

        // One row per hotpatch since boot. In memory only, and deliberately: a restart clears it because a restart is exactly when it stops being true -- the process is back on its boot commit.
        client.hotpatches = [];

        // --- BOOT RECORD (2026-08-16, observability layer stage 2) --- One row per process start, written HERE rather than in the listener below because this is the point where the two boot facts worth having actually exist: the emoji sync result (the known stale-prod-id trap) and the registered command count. Fire-and-forget like every other write in the event plane. This collection is also where restart COUNT comes from -- see models/BootRecord.js for why process.uptime() cannot answer that.
        const { recordBoot, installShutdownFlush } = require('../utils/eventStore');
        recordBoot({
            kind: restartKind || 'automatic',
            restartContext: restartKind ? '' : restartContext(),
            guilds: client.guilds.cache.size,
            emojiSynced: emojiSync.synced,
            emojiMissing: emojiSync.missing.length,
            commandsRegistered: client.registeredCommandCount ?? null,
            mongoOk: true,   // trivially true: this very row went through Mongoose
            cloudinaryConfigured: Boolean(process.env.CLOUDINARY_URL),
        });
        // systemd SIGTERMs the unit on every deploy, and the events immediately before a restart are among the most interesting ones there are. Without this the last buffer is lost every time.
        installShutdownFlush();
    });

    // --- RESTART LABELING + "BOT ONLINE" ALERT --- Alerting: a one-time "online" ping on each (re)start, so deploys/crashes/restarts are visible in Discord. systemd auto-restarts the bot on crash, so an "online" alert you DIDN'T trigger is itself a useful signal that the process restarted unexpectedly.
    client.once(Events.ClientReady, (c) => {
        const reason = readRestartReason();
        restartKind = reason;   // stashed for the boot record above -- see the comment on its declaration
        const kind = reason === 'deploy' ? '🚀 Manual deploy (git pull + restart)'
            : reason === 'manual' ? '🔧 Manual restart'
            : (() => { const ctx = restartContext(); return `♻️ Automatic/unattended restart${ctx ? ` (${ctx})` : ''}`; })();
        sendAlert('Bot online', `${kind}\nv${BOT_VERSION} · Logged in as ${c.user?.tag} · ${c.guilds.cache.size} servers · gateway ${formatPing(c.ws.ping)}`, 'info');
    });

    // --- DAILY "STILL HEALTHY" HEARTBEAT (2026-07-17) --- An info-level, NON-pinging alert once every 24h so a long, quiet uptime is proven-alive rather than merely assumed. The other alerts only fire on trouble (crashes, gateway loss) or on (re)start ("Bot online"); with none of those, silence is ambiguous — "healthy" and "the alerter/VM is dead" look identical. This heartbeat resolves that: no daily green means something is wrong. Deliberately info+no-ping (routine, must not notify his phone); sendAlert's 1/min throttle never trips at a 24h cadence. NOT fired immediately on boot — "Bot online" already covers startup; the interval's whole value is the stretches with NO restart in between (a restart resets this timer but also emits its own "Bot online", so no health gap is left uncovered).
    const HEARTBEAT_MS = 24 * 60 * 60 * 1000;
    function sendHeartbeat() {
        // If the gateway is NOT currently ready, stay silent — that's a real problem the gateway/shard handlers alert on themselves; a heartbeat firing anyway would be misleading, and a green "healthy" during an outage is worse than no heartbeat at all.
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
        // --- ROLL-UP CATCH-UP (2026-08-16, observability layer stage 4) --- Riding the existing daily heartbeat rather than adding a second scheduler, per the design's §6. Fire-and-forget/swallowed like every other write in this layer — utils/rollupStore.js's catchUpRollups() already catches its own errors internally, this call just avoids an unhandled-rejection warning if it somehow throws before that internal catch runs.
        require('../utils/rollupStore').catchUpRollups().catch(() => { /* never */ });
    }
    client.once(Events.ClientReady, () => {
        // Also fired here directly, not just from the 24h interval below (v3-pre-release review, finding #20) -- the interval is created fresh on every ClientReady, so two deploys within 24h of each other meant the FIRST interval died with its process before ever firing and the second restarted the countdown, and RollupState.lastRolledUpDay never advanced. Past CATCH_UP_WINDOW_DAYS of that pattern, days before the window edge were skipped silently -- no log, no alert. Calling it here too closes that gap for good.
        require('../utils/rollupStore').catchUpRollups().catch(() => { /* never -- swallowed internally too */ });
        // .unref() so the heartbeat timer alone never keeps the process alive — the gateway connection is what keeps it running; same convention as the router's short-lived-store timers.
        setInterval(sendHeartbeat, HEARTBEAT_MS).unref();
    });
}

module.exports = { registerLifecycle, runCloudinaryCleanup, formatPing, formatUptime, readRestartReason, restartContext };
