// scripts/lib/walkJobs.cjs — how many browser workers a portal walk runs at once.
//
// Added 2026-09-14 18:30 EDT, when portalStates.mjs and portalGeometry.mjs stopped walking one page at a time. Both walks wait for what they measure (see waitForTarget in portalStates.mjs), so their states and realms are independent and spread across workers, each in its own browser context.
//
// ⚠️ THE DEFAULT IS HALF THE CORES, CAPPED AT 4, NEVER "ALL OF THEM". A walk shares the machine with the rest of the suite, and a browser page that is starved of CPU is exactly how this walk used to stall. An explicit count (PORTAL_STATES_JOBS / PORTAL_GEOMETRY_JOBS) always wins, so CI and a bisecting session can pin it — `1` reproduces the old serial walk.
const os = require('os');

function walkJobs(raw, cpus = (os.availableParallelism ? os.availableParallelism() : os.cpus().length)) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1) return n;
    return Math.min(4, Math.max(1, Math.floor(cpus / 2)));
}

module.exports = { walkJobs };
