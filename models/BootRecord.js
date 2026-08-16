// ==========================================
// BOOT RECORD -- one document per process start
// ==========================================
// Written once from bot/lifecycle.js's ready sequence, after emoji ids resolve and commands register,
// because those are the two boot facts most worth having when something is wrong.
//
// ⚠️ THIS IS ALSO WHERE RESTART COUNT COMES FROM, and an earlier draft of the design spec got that
// wrong. `process.uptime()` reports the CURRENT process's age -- it cannot know how many times systemd
// restarted the unit. scripts/vmstatus.sh gets it from `systemctl show diors-bot -p NRestarts` over
// SSH, which the bot has no equivalent of from inside itself. Counting these records over a window IS
// the restart count, and because bot/lifecycle.js already distinguishes a deliberate restart (the
// .restart-reason marker deploy.sh writes) from an unattended one, it makes restart REASONS available
// too, which NRestarts never could.
//
// No user data of any kind is in here, hashed or otherwise.

const mongoose = require('mongoose');

const BootRecordSchema = new mongoose.Schema({
    version: { type: String },
    commit: { type: String },
    host: { type: String },
    kind: { type: String },              // 'deploy' | 'manual' | 'automatic' -- from readRestartReason()
    restartContext: { type: String },    // systemd NRestarts line when available, '' otherwise
    guilds: { type: Number },
    emojiSynced: { type: Number },
    emojiMissing: { type: Number },      // the known stale-prod-id trap -- non-zero here is a real signal
    commandsRegistered: { type: Number },
    mongoOk: { type: Boolean },          // trivially true (this row was written through Mongoose)
    cloudinaryConfigured: { type: Boolean },
    createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('BootRecord', BootRecordSchema);
