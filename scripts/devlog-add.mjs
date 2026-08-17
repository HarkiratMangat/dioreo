#!/usr/bin/env node
// devlog-add.mjs — append a DEVLOG Part A entry in the ONE correct way.
//
// WHY THIS EXISTS (2026-08-10 00:00 EDT, Harkirat: "ive noticed that happening a lot") Writing a DEVLOG entry by hand fails the same two ways on almost every release, and both are caught only by `docs:audit` AFTER the bytes have landed — so each one costs an extra edit-and-recheck cycle:
//   1. The entry is appended at END OF FILE, which puts it AFTER the "# Part B" marker. Part B is thematic; a dated entry belongs in Part A, chronologically. (Hit again on v2.63.1.)
//   2. The Part A table of contents is not updated, so `devlog-toc` fails.
// Neither failure requires judgement — the insertion points are structural. A gate that fires after the fact is documentation; this is the mechanism. `devlog-toc` and `record-structure` stay as the backstop, and now they should never actually trip.
//
// Usage:
//   node scripts/devlog-add.mjs --title "<TITLE>" --body-file <path>
//   node scripts/devlog-add.mjs --title "<TITLE>" --body-file -      # body on stdin
//   ...--devlog <path>   # override target (tests only)
//
// TITLE is written WITHOUT the leading "## ", exactly as it should read in both places, e.g.
//   2026-08-10 00:00 EDT — What happened and what it cost (v2.63.1)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const PART_B = "# Part B";
// The TOC's final line is a literal backfill placeholder; every dated entry sorts above it.
const TOC_TAIL = "- *Earlier milestones*";
// Enforced so the entry is greppable by release and by date — the two things docs-audit checks for. A bare date is rejected on purpose: working-agreement rule 10 wants HH:MM TZ on dated content.
const TITLE_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2} [A-Z]{2,5} — .+ \(v\d+\.\d+\.\d+(?:-\S+)?\)$/;

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? null : argv[i + 1] ?? null;
};

const die = (msg) => { console.error(`devlog-add: ${msg}`); process.exit(1); };

const title = arg("--title");
const bodyFile = arg("--body-file");
const devlogPath = arg("--devlog") ?? "docs/DEVLOG.md";

if (!title) die('missing --title "<TITLE>"');
if (!bodyFile) die("missing --body-file <path> (use - for stdin)");
if (!TITLE_RE.test(title)) {
  die(`title must read "YYYY-MM-DD HH:MM TZ — description (vX.Y.Z)" and carry a TIME, not a bare date.\n  got: ${title}`);
}

const body = (bodyFile === "-" ? readFileSync(0, "utf8") : readFileSync(bodyFile, "utf8")).trim();
if (!body) die("body is empty");

// ── GATE PARITY ──────────────────────────────────────────────────────────── ⚠️ THIS SCRIPT WRITES WITH writeFileSync FROM A SUBPROCESS, SO IT DOES NOT GO THROUGH THE Edit/Write TOOLS — and therefore does not trigger their PreToolUse hooks. Left alone, a script that removes ONE manual failure while silently disabling THREE gates is a net loss, and the bypass would be invisible: the content simply lands unchecked. Harkirat asked directly (2026-08-10 00:03 EDT) whether this bypasses any gate. It did. So it now runs them itself, against the same payload shape they receive from the harness, reusing the hook scripts rather than reimplementing their logic (a second copy of a rule is a second thing to drift). Not covered here because they are covered elsewhere and would be duplicated effort:
//   · docs:reflow (soft-wrap)      -> npm test
//   · devlog-toc / record-structure -> npm run docs:audit (and this script is what keeps them green)
//   · clock-inject                  -> injects context for a human author; nothing to enforce here
const GATES = [
  // timestamp-check has TWO modes with DIFFERENT severities and both matter — running only one silently halves the check. `pre` DENIES an impossible (future) timestamp; `post` is advisory and catches a bare date missing its HH:MM TZ. Verified by reading the hook, after a test asserting `pre` caught bare dates failed: it does not, and never claimed to.
  { name: "timestamp-check (future stamps)", script: ".claude/hooks/timestamp-check.sh", args: ["pre"], blocking: true },
  { name: "timestamp-check (bare dates)", script: ".claude/hooks/timestamp-check.sh", args: ["post"], blocking: false },
  { name: "typos-check", script: ".claude/hooks/typos-check.sh", args: [], blocking: true },
  { name: "defer-in-place-guard", script: ".claude/hooks/defer-in-place-guard.sh", args: [], blocking: false },
];

const gatePayload = JSON.stringify({
  hook_event_name: "PreToolUse",
  tool_name: "Write",
  tool_input: { file_path: devlogPath, new_string: `## ${title}\n\n${body}\n` },
});

let blocked = false;
for (const g of GATES) {
  if (!existsSync(g.script)) {
    // A missing gate is reported, never silently skipped — that is the whole failure mode here.
    console.error(`devlog-add: WARNING — ${g.name} not found at ${g.script}; it did NOT run.`);
    continue;
  }
  let out = "";
  try {
    out = execFileSync("bash", [g.script, ...g.args], { input: gatePayload, encoding: "utf8", stdio: "pipe" });
  } catch (e) {
    out = (e.stdout || "") + (e.stderr || "");
  }
  if (!out.trim()) continue;
  let msg = out.trim();
  try {
    const j = JSON.parse(msg);
    msg = j.hookSpecificOutput?.additionalContext ?? j.systemMessage ?? msg;
    if (j.hookSpecificOutput?.permissionDecision === "deny") blocked = true;
  } catch { /* plain-text hook output; use as-is */ }
  console.error(`\ndevlog-add: [${g.name}]\n${msg}\n`);
  if (g.blocking) blocked = true;
}
if (blocked) {
  die("a gate above objected to this entry. Fix the body and re-run — do NOT hand-edit DEVLOG.md to\n" +
      "  route around it, which reintroduces exactly the two structural bugs this script exists to prevent.");
}

const src = readFileSync(devlogPath, "utf8");

// Idempotence: re-running must not double-insert. Cheap, and the failure it prevents is ugly (record-structure flags a repeated heading, but only after the bytes land).
if (src.includes(`## ${title}`)) die(`an entry titled "${title}" is already in ${devlogPath}`);

const partB = src.indexOf(`\n${PART_B}`);
if (partB === -1) die(`could not find the "${PART_B}" marker in ${devlogPath} — refusing to guess where Part A ends`);

const tocAt = src.indexOf(TOC_TAIL);
if (tocAt === -1) die(`could not find the TOC tail line "${TOC_TAIL}" — refusing to guess where the TOC ends`);
if (tocAt > partB) die("the TOC tail line appears AFTER the Part B marker; the file's structure is not what this script expects");

// 1. TOC line, immediately above the backfill placeholder so dated entries stay together.
let out = src.slice(0, tocAt) + `- ${title}\n` + src.slice(tocAt);

// 2. Entry at the END of Part A, immediately before the Part B marker. Recompute the offset: the TOC insert above shifted everything after it.
const partB2 = out.indexOf(`\n${PART_B}`);
const head = out.slice(0, partB2).replace(/\s+$/, "");
const tail = out.slice(partB2);
out = `${head}\n\n## ${title}\n\n${body}\n${tail}`;

writeFileSync(devlogPath, out);
console.log(`devlog-add: inserted into ${devlogPath}`);
console.log(`  TOC line  -> above "${TOC_TAIL}"`);
console.log(`  entry     -> end of Part A, before "${PART_B}"`);
console.log(`  title     -> ${title}`);
