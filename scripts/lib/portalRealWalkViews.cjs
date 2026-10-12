// scripts/lib/portalRealWalkViews.cjs — which views a real-server walk should visit, as a pure function.
//
// 🔴 IT LIVES HERE SO IT CAN BE TESTED. `portalRealWalk.mjs` launches a browser at import time, so a test cannot
// import it; every other portal instrument that carries logic worth asserting keeps that logic in this directory
// for the same reason (`portalStyleRank.cjs`, `portalReceipt.cjs`). This was the ONE instrument of the twenty-eight
// with no self-test, and the defect it shipped is exactly the kind a test catches: `--views` defaulted to the
// literal `Track,Board,Repairs` — SEASON's tabs — on every realm, so Broadcast's first walk reported
// `❌ no control reading "Board"` twice and passed on one view, naming controls the realm has never had.
//
// ⚠️ THE FALLBACK IS THE DEFAULT VIEW, NEVER ANOTHER REALM'S TABS. A walk that checks one real view beats one that
// fails on three imaginary ones, and a wrong view name reads as a defect in the page rather than in the caller.
const fs = require('fs');
const path = require('path');

// 🔴 A CORRUPT FIXTURE MUST NOT READ AS AN UNRECORDED REALM. The first version caught every error and
// returned `[]`, so a malformed JSON file and a realm nobody has measured produced the identical answer
// and the walk quietly fell back to the default view — §0.10's vacuous-absence trap, written into the
// file whose whole subject is that trap, by the session that had just documented it. A MISSING file is a
// fact ("not recorded yet"); an UNREADABLE one is a defect and says so.
function viewsFromFixture(realm, fixtureDir) {
    const f = path.join(fixtureDir, `${realm}.json`);
    if (!fs.existsSync(f)) return [];
    try {
        return Object.keys(JSON.parse(fs.readFileSync(f, 'utf8')).views || {});
    } catch (e) {
        throw new Error(`geometry fixture for "${realm}" exists but could not be read: ${e.message}`);
    }
}

// `flagValue` is whatever `--views` carried, or '' when it was absent.
function resolveViews(flagValue, realm, fixtureDir) {
    const explicit = String(flagValue || '').split(',').filter(Boolean);
    if (explicit.length) return explicit;
    const fromFixture = viewsFromFixture(realm, fixtureDir);
    return fromFixture.length ? fromFixture : ['default'];
}

module.exports = { viewsFromFixture, resolveViews };
