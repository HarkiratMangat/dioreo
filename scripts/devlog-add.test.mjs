#!/usr/bin/env node
// Proofs for devlog-add.mjs. The two cases that matter are the two real recurring failures it exists to make impossible: the entry landing AFTER the Part B marker, and the TOC not being updated. Everything else here guards the guard.

import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
// ⚠️ fileURLToPath, NOT new URL(...).pathname — the repo lives at "/Applications/Claude Code/…" and .pathname percent-encodes the space into "Claude%20Code", so node cannot find the script. Same family as the unquoted-path bug of 2026-08-02 that silently updated zero files.
import { fileURLToPath } from "node:url";

let pass = 0, fail = 0;
const ok = (n, cond, extra = "") => {
  if (cond) { console.log(`  PASS  ${n}`); pass++; }
  else { console.log(`  FAIL  ${n}${extra ? ` — ${extra}` : ""}`); fail++; }
};

const dir = mkdtempSync(join(tmpdir(), "devlog-add-"));
const SCRIPT = fileURLToPath(new URL("./devlog-add.mjs", import.meta.url));

const FIXTURE = `# DEVLOG

## Contents
- 2026-08-08 12:05 EDT — An older entry (v2.63.0)
- *Earlier milestones* \`[backfill]\`

# Part A — The Journey (chronological)

## 2026-08-08 12:05 EDT — An older entry (v2.63.0)

Older body text.

# Part B — Lessons Ledger (thematic)

- A thematic lesson that must stay below everything.
`;

const fresh = (name) => {
  const p = join(dir, `${name}.md`);
  writeFileSync(p, FIXTURE);
  return p;
};
const bodyFile = join(dir, "body.md");
writeFileSync(bodyFile, "New entry body.\n");

// spawnSync, not execFileSync: execFileSync discards stderr on SUCCESS, and an advisory gate (timestamp-check post) writes its warning to stderr while still exiting 0. Asserting that a non-blocking warning is actually SURFACED needs both streams regardless of exit status — otherwise "the advisory ran" and "the advisory was silently swallowed" look identical.
const run = (devlog, title, body = bodyFile) => {
  const r = spawnSync("node", [SCRIPT, "--title", title, "--body-file", body, "--devlog", devlog],
    { encoding: "utf8" });
  return { okRun: r.status === 0, err: (r.stderr || "") + (r.stdout || "") };
};

console.log("devlog-add.mjs — proofs");

// ── THE TWO REAL FAILURES ──────────────────────────────────────────────────
const T = "2026-08-10 00:00 EDT — A new entry (v2.63.1)";
let p = fresh("happy");
let r = run(p, T);
let out = readFileSync(p, "utf8");
ok("runs successfully", r.okRun, r.err);
// 1. Entry must sit in Part A, BEFORE the Part B marker. This is the failure hit on v2.63.1.
ok("entry lands BEFORE the Part B marker",
   out.indexOf(`## ${T}`) > -1 && out.indexOf(`## ${T}`) < out.indexOf("# Part B"));
// 2. TOC must gain the line, above the backfill placeholder.
ok("TOC line added", out.includes(`- ${T}\n`));
ok("TOC line sits ABOVE the backfill placeholder",
   out.indexOf(`- ${T}`) < out.indexOf("- *Earlier milestones*"));
ok("body text written", out.includes("New entry body."));
// The older entry and Part B content must survive untouched.
ok("existing entry preserved", out.includes("Older body text."));
ok("Part B content preserved", out.includes("A thematic lesson that must stay below everything."));
ok("exactly one Part B marker", out.split("# Part B").length - 1 === 1);
// The TOC gets exactly one new line — not one per matching string.
ok("TOC line added exactly once", out.split(`- ${T}`).length - 1 === 1);

// ── IDEMPOTENCE ────────────────────────────────────────────────────────────
r = run(p, T);
ok("re-running the same title is refused", !r.okRun && /already in/.test(r.err));

// ── TITLE SHAPE ──────────────────────────────────────────────────────────── A bare date is rejected: dated content carries HH:MM TZ (working-agreement rule 10).
ok("bare date rejected", !run(fresh("d1"), "2026-08-10 — No time here (v2.63.1)").okRun);
// No version means the entry is not greppable by release — the thing devlog-toc exists to protect.
ok("missing version rejected", !run(fresh("d2"), "2026-08-10 00:00 EDT — No version").okRun);
ok("wrong dash rejected", !run(fresh("d3"), "2026-08-10 00:00 EDT - hyphen not em-dash (v2.63.1)").okRun);
ok("pre-release version accepted", run(fresh("d4"), "2026-08-10 00:00 EDT — Pre-release (v3.2.0-pre)").okRun);

// ── REFUSES TO GUESS ─────────────────────────────────────────────────────── If the file's shape is not what this script expects it must stop, never invent a location.
const noB = join(dir, "nob.md");
writeFileSync(noB, FIXTURE.replace("# Part B — Lessons Ledger (thematic)", "# Something Else"));
ok("missing Part B marker refused", !run(noB, T).okRun);
const noToc = join(dir, "notoc.md");
writeFileSync(noToc, FIXTURE.replace("- *Earlier milestones* `[backfill]`", "- nothing"));
ok("missing TOC tail refused", !run(noToc, T).okRun);
// Empty body is almost certainly a piping mistake, not an intentional empty entry.
const empty = join(dir, "empty.md");
writeFileSync(empty, "");
ok("empty body refused", !run(fresh("d5"), T, empty).okRun);

// ── GATE PARITY ──────────────────────────────────────────────────────────── This script writes with writeFileSync from a subprocess, so it does NOT trigger the Edit/Write PreToolUse hooks. It runs them itself instead. These prove that is real and not decorative — a gate that cannot be shown to FAIL is indistinguishable from one that never runs. (Only meaningful from the repo root, where the relative hook paths resolve.)
const typoBody = join(dir, "typo.md");
// ⚠️ Assembled at runtime so the misspelling never appears as a literal in this file — otherwise typos-check flags THIS test, which is the "a check whose test contains the offending pattern flags itself" trap the completeness sweep warns about. It fired here on the first attempt.
const MISSPELLING = "delib" + "rate";
writeFileSync(typoBody, `This entry has a ${MISSPELLING} misspelling in it.\n`);
// ⚠️ A gate can be PRESENT BUT INERT, and that is not the same as absent. `typos-check.sh` opens with `command -v typos || exit 0`, so on a machine without the `typos` binary — CI is one — it runs, exits 0, emits nothing, and enforces nothing. Asserting "it blocks" then fails in CI while passing locally, which is exactly what happened on the first push (2026-08-10 04:15 UTC). The fix is NOT to drop the assertion: a silently-skipped proof is the vacuous pass this repo keeps paying for. Probe the gate directly, then either assert it or SKIP it OUT LOUD — a skip is reported as its own state and is never counted as a pass.
const gateLive = (script, args, payload) => {
  const r = spawnSync("bash", [script, ...args], { input: payload, encoding: "utf8" });
  return Boolean(((r.stdout || "") + (r.stderr || "")).trim());
};
const probe = (text) => JSON.stringify({
  hook_event_name: "PreToolUse", tool_name: "Write",
  tool_input: { file_path: "docs/DEVLOG.md", new_string: text },
});
let skipped = 0;
const skip = (n, why) => { console.log(`  SKIP  ${n} — ${why}`); skipped++; };

if (gateLive(".claude/hooks/typos-check.sh", [], probe(`a ${MISSPELLING} word`))) {
  const rTypo = run(fresh("g1"), "2026-08-10 00:00 EDT — Misspelled body (v2.63.1)", typoBody);
  ok("typos-check blocks a misspelling in the body",
     !rTypo.okRun && new RegExp(`typo|${MISSPELLING}`, "i").test(rTypo.err || ""),
     (rTypo.err || "").slice(0, 120));
} else {
  skip("typos-check blocks a misspelling in the body",
       "typos-check is INERT here (the `typos` binary is not installed), so it enforces nothing to assert");
}

// timestamp-check has TWO modes and they are NOT interchangeable: `pre` DENIES an impossible (future) stamp; `post` is advisory for a bare date. An earlier version of this test asserted `pre` caught bare dates — it does not, and never claimed to. Both are pinned separately, so dropping either mode from the script fails here.
const futureBody = join(dir, "future.md");
// The future stamp is assembled at runtime: writing it as a literal makes timestamp-check deny THIS file. It did, on the first attempt. (TS-EXAMPLE would also work; building it avoids the token.)
const FUTURE_STAMP = "20" + "99-01-01 12:00 EDT";
writeFileSync(futureBody, `We shipped this at ${FUTURE_STAMP}, which has not happened.\n`);
if (gateLive(".claude/hooks/timestamp-check.sh", ["pre"], probe(`shipped at ${FUTURE_STAMP} somehow`))) {
  const rFuture = run(fresh("g2"), "2026-08-10 00:00 EDT — Future stamp in body (v2.63.1)", futureBody);
  ok("timestamp-check (pre) BLOCKS an impossible future stamp", !rFuture.okRun,
     (rFuture.err || "").slice(0, 140));
} else {
  skip("timestamp-check (pre) BLOCKS an impossible future stamp",
       "timestamp-check pre is INERT in this environment, so there is nothing to assert");
}

const bareDateBody = join(dir, "baredate.md");
writeFileSync(bareDateBody, "Something happened on 2026-08-10 and we fixed it.\n");
const rDate = run(fresh("g3"), "2026-08-10 00:00 EDT — Bare date in body (v2.63.1)", bareDateBody);
// Advisory: the write MUST proceed, and the warning MUST still be surfaced rather than swallowed. Asserting both halves — an advisory that is silently dropped is the same as no check at all.
ok("timestamp-check (post) WARNS on a bare date WITHOUT blocking",
   rDate.okRun && /BARE DATE|timestamp/i.test(rDate.err || ""),
   `okRun=${rDate.okRun} err=${(rDate.err || "").slice(0, 100)}`);

// A clean body must still pass, or the gates would just block everything and get removed.
ok("a clean body still passes the gates", run(fresh("g3"), "2026-08-10 00:00 EDT — Clean body (v2.63.1)").okRun);

// 🔴 THE STAMP IS THE SCRIPT'S JOB NOW. --desc is the preferred form precisely because a hand-typed stamp is the one input TITLE_RE could only refuse rather than fix, and a refusal costs a turn every time. These four assert that it stamps, that the stamp is REAL rather than a placeholder, that --title still overrides it, and that asking for both is refused — two stamps cannot both be the one that is true.
{
  const f = fresh("desc1");
  const r = spawnSync(process.execPath, [SCRIPT, "--desc", "Stamped by the script (v9.9.9)", "--body-file", bodyFile, "--devlog", f],
                      { encoding: "utf8" });
  const txt = r.status === 0 ? readFileSync(f, "utf8") : "";
  const line = txt.split("\n").find((l) => l.startsWith("## ") && l.includes("Stamped by the script")) || "";
  ok("--desc writes a REAL stamp, not a placeholder",
     /^## \d{4}-\d{2}-\d{2} \d{2}:\d{2} [A-Z]{2,5} — Stamped by the script \(v9\.9\.9\)$/.test(line),
     `status=${r.status} line=${line.slice(0, 90)} err=${(r.stderr || "").slice(0, 120)}`);

  // 🔴 COMPARED AS A STRING IN THE SCRIPT'S OWN ZONE, NEVER PARSED INTO AN INSTANT. The first version did `new Date("2026-09-02T13:22")`, which JavaScript reads as LOCAL time — so on a machine already in America/New_York it matched, and on GitHub's UTC runner the same correct stamp looked four hours stale and this proof FAILED. A test that passes because the developer's clock happens to agree with the code's clock is testing the developer's clock. This repo ships `npm run test:tz` for that exact class and this check was violating it. Both sides are now formatted through the same America/New_York formatter, so the comparison holds in any zone; a small window absorbs the minute rolling over between the write and the read.
  const stampNow = (offsetMs) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric",
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .format(new Date(Date.now() - offsetMs)).replace(",", "");
  const seen = (line.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/) || [""])[0];
  const acceptable = [0, 60e3, 120e3].map(stampNow);
  ok("--desc's stamp is the CURRENT time, not a constant that happens to parse",
     acceptable.some((x) => x === seen),
     `stamped="${seen}" · expected one of ${JSON.stringify(acceptable)}`);
}
{
  const f = fresh("desc2");
  const r = spawnSync(process.execPath, [SCRIPT, "--desc", "d (v9.9.9)", "--title", "2026-08-10 00:00 EDT — t (v9.9.9)",
                                         "--body-file", bodyFile, "--devlog", f], { encoding: "utf8" });
  ok("--desc together with --title is REFUSED", r.status !== 0 && /never both/i.test(r.stderr || ""),
     `status=${r.status} err=${(r.stderr || "").slice(0, 120)}`);
}
{
  const f = fresh("desc3");
  const r = spawnSync(process.execPath, [SCRIPT, "--title", "2026-08-10 00:00 EDT — Explicit stamp wins (v9.9.9)",
                                         "--body-file", bodyFile, "--devlog", f], { encoding: "utf8" });
  ok("--title still sets the stamp itself, so a backfill can carry its real date",
     r.status === 0 && readFileSync(f, "utf8").includes("## 2026-08-10 00:00 EDT — Explicit stamp wins"),
     `status=${r.status} err=${(r.stderr || "").slice(0, 120)}`);
}

rmSync(dir, { recursive: true, force: true });
// Skips are printed in the verdict, never folded into the pass count — a proof that did not run is not a proof that succeeded, and hiding that is how a gate stays dead for weeks.
console.log(`\n  ${pass} passed, ${fail} failed${skipped ? `, ${skipped} SKIPPED (gate inert here — see lines above)` : ""}`);
process.exit(fail === 0 ? 0 : 1);
