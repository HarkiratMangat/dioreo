#!/usr/bin/env node
// Proofs for devlog-add.mjs. The two cases that matter are the two real recurring failures it
// exists to make impossible: the entry landing AFTER the Part B marker, and the TOC not being
// updated. Everything else here guards the guard.

import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
// ⚠️ fileURLToPath, NOT new URL(...).pathname — the repo lives at "/Applications/Claude Code/…"
// and .pathname percent-encodes the space into "Claude%20Code", so node cannot find the script.
// Same family as the unquoted-path bug of 2026-08-02 that silently updated zero files.
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

// spawnSync, not execFileSync: execFileSync discards stderr on SUCCESS, and an advisory gate
// (timestamp-check post) writes its warning to stderr while still exiting 0. Asserting that a
// non-blocking warning is actually SURFACED needs both streams regardless of exit status —
// otherwise "the advisory ran" and "the advisory was silently swallowed" look identical.
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

// ── TITLE SHAPE ────────────────────────────────────────────────────────────
// A bare date is rejected: dated content carries HH:MM TZ (working-agreement rule 10).
ok("bare date rejected", !run(fresh("d1"), "2026-08-10 — No time here (v2.63.1)").okRun);
// No version means the entry is not greppable by release — the thing devlog-toc exists to protect.
ok("missing version rejected", !run(fresh("d2"), "2026-08-10 00:00 EDT — No version").okRun);
ok("wrong dash rejected", !run(fresh("d3"), "2026-08-10 00:00 EDT - hyphen not em-dash (v2.63.1)").okRun);
ok("pre-release version accepted", run(fresh("d4"), "2026-08-10 00:00 EDT — Pre-release (v3.2.0-pre)").okRun);

// ── REFUSES TO GUESS ───────────────────────────────────────────────────────
// If the file's shape is not what this script expects it must stop, never invent a location.
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

// ── GATE PARITY ────────────────────────────────────────────────────────────
// This script writes with writeFileSync from a subprocess, so it does NOT trigger the Edit/Write
// PreToolUse hooks. It runs them itself instead. These prove that is real and not decorative — a
// gate that cannot be shown to FAIL is indistinguishable from one that never runs.
// (Only meaningful from the repo root, where the relative hook paths resolve.)
const typoBody = join(dir, "typo.md");
// ⚠️ Assembled at runtime so the misspelling never appears as a literal in this file — otherwise
// typos-check flags THIS test, which is the "a check whose test contains the offending pattern
// flags itself" trap the completeness sweep warns about. It fired here on the first attempt.
const MISSPELLING = "delib" + "rate";
writeFileSync(typoBody, `This entry has a ${MISSPELLING} misspelling in it.\n`);
const rTypo = run(fresh("g1"), "2026-08-10 00:00 EDT — Misspelled body (v2.63.1)", typoBody);
ok("typos-check blocks a misspelling in the body",
   !rTypo.okRun && new RegExp(`typo|${MISSPELLING}`, "i").test(rTypo.err || ""),
   (rTypo.err || "").slice(0, 120));

// timestamp-check has TWO modes and they are NOT interchangeable: `pre` DENIES an impossible
// (future) stamp; `post` is advisory for a bare date. An earlier version of this test asserted
// `pre` caught bare dates — it does not, and never claimed to. Both are pinned separately, so
// dropping either mode from the script fails here.
const futureBody = join(dir, "future.md");
// The future stamp is assembled at runtime: writing it as a literal makes timestamp-check deny THIS
// file. It did, on the first attempt. (TS-EXAMPLE would also work; building it avoids the token.)
const FUTURE_STAMP = "20" + "99-01-01 12:00 EDT";
writeFileSync(futureBody, `We shipped this at ${FUTURE_STAMP}, which has not happened.\n`);
const rFuture = run(fresh("g2"), "2026-08-10 00:00 EDT — Future stamp in body (v2.63.1)", futureBody);
ok("timestamp-check (pre) BLOCKS an impossible future stamp", !rFuture.okRun,
   (rFuture.err || "").slice(0, 140));

const bareDateBody = join(dir, "baredate.md");
writeFileSync(bareDateBody, "Something happened on 2026-08-10 and we fixed it.\n");
const rDate = run(fresh("g3"), "2026-08-10 00:00 EDT — Bare date in body (v2.63.1)", bareDateBody);
// Advisory: the write MUST proceed, and the warning MUST still be surfaced rather than swallowed.
// Asserting both halves — an advisory that is silently dropped is the same as no check at all.
ok("timestamp-check (post) WARNS on a bare date WITHOUT blocking",
   rDate.okRun && /BARE DATE|timestamp/i.test(rDate.err || ""),
   `okRun=${rDate.okRun} err=${(rDate.err || "").slice(0, 100)}`);

// A clean body must still pass, or the gates would just block everything and get removed.
ok("a clean body still passes the gates", run(fresh("g3"), "2026-08-10 00:00 EDT — Clean body (v2.63.1)").okRun);

rmSync(dir, { recursive: true, force: true });
console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
