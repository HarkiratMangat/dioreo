const os = require('os');
const crypto = require('crypto');
const BotInstance = require('../models/BotInstance');
const { sendAlert } = require('./alertWebhook');

const HEARTBEAT_MS = 10 * 1000;
const STALE_MS = 30 * 1000; // 3 missed heartbeats before a held lock is considered abandoned

// The lock is keyed by a hash of BOT_TOKEN, NOT a single fixed id -- two DIFFERENT bot tokens (e.g. the production bot vs. a separate test/dev bot application in the Discord dev portal) are two genuinely independent Discord applications and must be allowed to run at the same time, even against the same Mongo cluster. Only the SAME token connecting twice is the failure mode this guards against. Hashed (not stored raw) since this doc could end up visible in a DB browser and there's no reason to put a live secret in it. Not a security boundary -- just avoids gratuitously duplicating the token.
function lockIdForToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex').slice(0, 24);
}

// Cross-machine startup guard. A local dev `node index.js` and the deployed VM instance share the same Mongo Atlas cluster but run on different machines, so a local PID/lockfile can't catch them colliding -- only something every instance actually shares can. This is exactly the failure mode that took the bot down in the 2026-07-14 incident (stray local processes raced the deployed instance's own interaction replies, see [[feedback_multiple_bot_instances]] / .claude/rules/accent-and-colors.md). Call this once at boot, before client.login(); it resolves true if this process may proceed, false if another instance of the SAME bot token already holds a fresh heartbeat. A `node --watch` restart kills the old process and starts the new one before the old one's async releaseLock() (a Mongo delete) has landed, so the new process can read a lock doc that's only ~1s stale and wrongly refuse to start (the watcher never retries, so this can hang the dev session until the next file save). A dead pid on THIS host is provably not running, whatever its heartbeat says -- process.kill(pid, 0) sends no signal, it only probes existence, throwing ESRCH if the process is gone. Cross-host locks (this Mac vs. the prod VM) can't be probed this way and must stay untouched: a different hostname is reported alive unconditionally. Exported so the pid-probe branch is unit-testable without a live process to kill (see scripts/instanceLock.test.js).
function isHolderAlive(existing) {
    if (existing.hostname !== os.hostname()) return true;
    try {
        process.kill(existing.pid, 0);
        return true;
    } catch {
        return false;
    }
}

async function acquireInstanceLock() {
    const lockId = lockIdForToken(process.env.BOT_TOKEN);
    const existing = await BotInstance.findById(lockId);
    const heartbeatFresh = existing && Date.now() - existing.lastHeartbeat.getTime() < STALE_MS;
    if (heartbeatFresh && isHolderAlive(existing)) {
        const ageSec = Math.round((Date.now() - existing.lastHeartbeat.getTime()) / 1000);
        console.error(`❌ Refusing to start: another instance of this bot token is already running on host "${existing.hostname}" (pid ${existing.pid}), last heartbeat ${ageSec}s ago.`);
        sendAlert('Startup refused: instance already running', `Existing lock held by ${existing.hostname} (pid ${existing.pid}), last heartbeat ${ageSec}s ago.`, 'error');
        return false;
    }

    await BotInstance.findByIdAndUpdate(
        lockId,
        { hostname: os.hostname(), pid: process.pid, startedAt: new Date(), lastHeartbeat: new Date() },
        { upsert: true }
    );

    // unref() so this timer alone never keeps the process alive -- it should only run for as long as the bot is already running for other reasons (the Discord gateway connection, etc).
    const heartbeatTimer = setInterval(() => {
        BotInstance.findByIdAndUpdate(lockId, { lastHeartbeat: new Date() }).catch(err => console.error('Instance heartbeat failed:', err));
    }, HEARTBEAT_MS);
    heartbeatTimer.unref();

    // Best-effort release on a clean shutdown so a deliberate restart doesn't have to wait out STALE_MS before the new process can claim the lock. Only releases if we still own it (pid match) -- if another instance somehow already claimed it since, don't clobber that instead.
    //
    // Races (bounded) the SAME analytics flush bot/lifecycle.js's installShutdownFlush does (v3-pre-release review, finding #12) -- process.exit() used to fire the instant the lock-delete above settled (~ms), which is registered EARLIER than installShutdownFlush (only installed once ClientReady fires), so on every `systemctl restart` this handler won a race installShutdownFlush's own 2-second bail couldn't protect against and discarded up to FLUSH_INTERVAL_MS of buffered analytics events. Can't simply stop exiting here and defer entirely to that other handler either -- a SIGTERM during a hung gateway handshake (this file's own header notes that can silently take 10+ minutes) would then have NO exit path until ClientReady, which may never come. flushEvents() is idempotent (splices its buffer synchronously, so a second call after another has already run just finds it empty and no-ops), so racing it here is safe either way.
    const releaseLock = () => {
        const lockCleanup = BotInstance.deleteOne({ _id: lockId, pid: process.pid }).catch(() => {});
        // flushSearchSessions() too, not just flushEvents() -- matches installShutdownFlush's own shutdown sequence exactly (utils/eventStore.js). Missing this half would have left every open SearchTerm session exposed to the SAME race this fix exists to close.
        const { flushEvents, flushSearchSessions } = require('./eventStore');
        flushSearchSessions();
        const bail = new Promise((resolve) => {
            const t = setTimeout(resolve, 2000);
            if (typeof t.unref === 'function') t.unref();
        });
        Promise.allSettled([lockCleanup, Promise.race([flushEvents(), bail])]).finally(() => process.exit());
    };
    process.on('SIGINT', releaseLock);
    process.on('SIGTERM', releaseLock);

    return true;
}

module.exports = { acquireInstanceLock, isHolderAlive };
