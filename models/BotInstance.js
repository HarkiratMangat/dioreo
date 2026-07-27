const mongoose = require('mongoose');

// Lock doc(s) backing the startup single-instance guard (utils/instanceLock.js). One document PER
// BOT TOKEN (_id = a hash of BOT_TOKEN, not a fixed singleton) -- a production bot and a separate
// test/dev bot application are different Discord applications and must be allowed to run at the
// same time even against the same Mongo cluster; only two processes sharing the SAME token should
// collide. Whichever process currently holds a given token's lock refreshes `lastHeartbeat` on an
// interval; a new process checks its own token's doc on boot and refuses to start if that heartbeat
// is still fresh -- see utils/instanceLock.js for the full mechanism and why this needs to live in
// Mongo (shared across machines) rather than a local PID/lockfile.
const BotInstanceSchema = new mongoose.Schema({
    _id: { type: String },
    hostname: { type: String },
    pid: { type: Number },
    startedAt: { type: Date },
    lastHeartbeat: { type: Date },
});

module.exports = mongoose.model('BotInstance', BotInstanceSchema);
