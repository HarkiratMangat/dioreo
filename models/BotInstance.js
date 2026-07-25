const mongoose = require('mongoose');

// Singleton lock doc backing the startup single-instance guard (utils/instanceLock.js). Exactly
// one document ever exists (_id: 'singleton'). Whichever process currently holds the lock refreshes
// `lastHeartbeat` on an interval; a new process checks this doc on boot and refuses to start if the
// heartbeat is still fresh -- see utils/instanceLock.js for the full mechanism and why this needs to
// live in Mongo (shared across machines) rather than a local PID/lockfile.
const BotInstanceSchema = new mongoose.Schema({
    _id: { type: String },
    hostname: { type: String },
    pid: { type: Number },
    startedAt: { type: Date },
    lastHeartbeat: { type: Date },
});

module.exports = mongoose.model('BotInstance', BotInstanceSchema);
