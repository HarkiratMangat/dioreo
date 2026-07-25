const os = require('os');
const BotInstance = require('../models/BotInstance');
const { sendAlert } = require('./alertWebhook');

const LOCK_ID = 'singleton';
const HEARTBEAT_MS = 10 * 1000;
const STALE_MS = 30 * 1000; // 3 missed heartbeats before a held lock is considered abandoned

// Cross-machine startup guard. A local dev `node index.js` and the deployed VM instance share the
// same Mongo Atlas cluster but run on different machines, so a local PID/lockfile can't catch them
// colliding -- only something every instance actually shares can. This is exactly the failure mode
// that took the bot down in the 2026-07-14 incident (stray local processes raced the deployed
// instance's own interaction replies, see [[feedback_multiple_bot_instances]] /
// .claude/rules/accent-and-colors.md). Call this once at boot, before client.login(); it resolves
// true if this process may proceed, false if another instance already holds a fresh heartbeat.
async function acquireInstanceLock() {
    const existing = await BotInstance.findById(LOCK_ID);
    if (existing && Date.now() - existing.lastHeartbeat.getTime() < STALE_MS) {
        const ageSec = Math.round((Date.now() - existing.lastHeartbeat.getTime()) / 1000);
        console.error(`❌ Refusing to start: another instance is already running on host "${existing.hostname}" (pid ${existing.pid}), last heartbeat ${ageSec}s ago.`);
        sendAlert('Startup refused: instance already running', `Existing lock held by ${existing.hostname} (pid ${existing.pid}), last heartbeat ${ageSec}s ago.`, 'error');
        return false;
    }

    await BotInstance.findByIdAndUpdate(
        LOCK_ID,
        { hostname: os.hostname(), pid: process.pid, startedAt: new Date(), lastHeartbeat: new Date() },
        { upsert: true }
    );

    // unref() so this timer alone never keeps the process alive -- it should only run for as long
    // as the bot is already running for other reasons (the Discord gateway connection, etc).
    const heartbeatTimer = setInterval(() => {
        BotInstance.findByIdAndUpdate(LOCK_ID, { lastHeartbeat: new Date() }).catch(err => console.error('Instance heartbeat failed:', err));
    }, HEARTBEAT_MS);
    heartbeatTimer.unref();

    // Best-effort release on a clean shutdown so a deliberate restart doesn't have to wait out
    // STALE_MS before the new process can claim the lock. Only releases if we still own it (pid
    // match) -- if another instance somehow already claimed it since, don't clobber that instead.
    const releaseLock = () => {
        BotInstance.deleteOne({ _id: LOCK_ID, pid: process.pid }).finally(() => process.exit());
    };
    process.on('SIGINT', releaseLock);
    process.on('SIGTERM', releaseLock);

    return true;
}

module.exports = { acquireInstanceLock };
