// tzIndependence.test.mjs — runs the date-sensitive suites under three timezones.
//
// WHY THIS EXISTS (2026-08-31 19:2x EDT)
// -------------------------------------
// `npm test` was green locally and CI failed on `feat/portal-redesign-session-b` with a four-hour delta: expected 16:27:56.919Z, got 20:27:56.919Z. Exactly EDT's offset. The defect was real and production-affecting -- `parseReleaseDateTime` re-anchored an already-absolute ISO instant through `.tz(tz, true)`, which keeps the wall clock AS RENDERED IN THE SYSTEM ZONE. On a machine already set to America/Toronto the two readings cancel and the round-trip passes by luck; the GCP VM runs UTC, where a published patch-note release time would shift by the offset.
//
// 🔴 THE POINT IS NOT THE BUG, IT IS THAT ONLY CI COULD SEE IT. Every local run of that test passed, so a green local suite was never evidence about this class at all. This file closes that gap: the date-sensitive suites run under a zone that is NOT the developer's.
//
// ⚠️ Asia/Tokyo is deliberate. UTC alone would not catch a bug that only appears at a POSITIVE offset, and America/Toronto is the developer's own zone, where cancelling errors hide. ⚠️ Add a file here when it starts touching parseAdminDate/parseReleaseDateTime/dayjs. The list is not derived, so it cannot notice a new one on its own -- that is a known limit, stated rather than hidden.
import { execFileSync } from "node:child_process";

const SUITES = ["scripts/portalPatchNotes.test.js", "scripts/patchnoteOps.test.js", "scripts/drawOps.test.js"];
const ZONES = ["UTC", "Asia/Tokyo", "America/Toronto"];

let failed = 0;
for (const zone of ZONES) {
    for (const suite of SUITES) {
        try {
            execFileSync(process.execPath, [suite], { env: { ...process.env, TZ: zone }, stdio: "pipe" });
            console.log(`  ✓ ${zone.padEnd(16)} ${suite}`);
        } catch (err) {
            failed++;
            console.log(`  ✗ ${zone.padEnd(16)} ${suite}`);
            console.log(String(err.stdout || "").split("\n").filter((l) => l.includes("✗") || l.includes("actual")).slice(0, 4).map((l) => `      ${l.trim()}`).join("\n"));
        }
    }
}
console.log(failed === 0
    ? `\n✅ tz-independence: ${SUITES.length} suite(s) × ${ZONES.length} zone(s), all identical`
    : `\n✗ tz-independence: ${failed} suite/zone combination(s) failed — a date function is reading the SYSTEM zone`);
process.exit(failed === 0 ? 0 : 1);
