// utils/bootFailures.js — how many boots in a row have failed, so a long outage backs off instead of restart-looping.
//
// Why a file (2026-10-20, v3 sweep): index.js now exits on a failed boot so systemd restarts it. During an Atlas outage each try takes ~13s (Mongoose's 10s buffer timeout, then the exit delay), and sendAlert's 1-per-minute throttle lives in memory, so every new process would ping again: about 550 pinging alerts an hour. A count under os.tmpdir() outlives the process (not a reboot, which is fine), lets only the FIRST failure ping, and stretches the wait before each retry. ClientReady clears it.
const fs = require('fs');
const os = require('os');
const path = require('path');

const FILE = path.join(os.tmpdir(), `dioreo-boot-failures-${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}`);
const STEP_MS = 30 * 1000;
const CAP_MS = 10 * 60 * 1000;

// The wait before the process exits after its nth failure in a row: 30s, 60s, 90s ... capped at 10 minutes.
function backoffMs(n) { return Math.min(STEP_MS * Math.max(1, n), CAP_MS); }

function read(file = FILE) {
    try { return Number.parseInt(fs.readFileSync(file, 'utf8'), 10) || 0; } catch { return 0; }
}

// Records one more failure and returns the new count. Never throws: a read-only /tmp just means every failure counts as the first.
function record(file = FILE) {
    const n = read(file) + 1;
    try { fs.writeFileSync(file, String(n)); } catch { /* best effort */ }
    return n;
}

function clear(file = FILE) {
    try { fs.unlinkSync(file); } catch { /* nothing to clear */ }
}

module.exports = { backoffMs, read, record, clear, FILE };
