#!/usr/bin/env node
/**
 * docs-audit.test.mjs — proves every check in docs-audit.mjs is capable of FAILING.
 *
 * WHY THIS FILE EXISTS (2026-07-28 19:55 EDT)
 * -------------------------------------------
 * A guard that has never been watched to fail is not a guard. This repo has already shipped one that
 * was silently dead: every Bash rule in `usage-guard.mjs` stopped matching after the first line,
 * because "\n" was not treated as a shell command separator — and it looked fine, because it had only
 * ever been tried on hand-written one-liners that could not expose the bug.
 *
 * So each test below builds a fixture tree that VIOLATES exactly one invariant, runs the real audit
 * against it via DOCS_AUDIT_ROOT, and asserts that check reports. Two assertions per check, not one:
 *   - the broken fixture FAILS  (the check is alive)
 *   - the fixed fixture PASSES  (the check is specific, not just always-on)
 * The second half is the one people skip, and it is what catches a matcher that fires on everything.
 *
 * Run: node scripts/docs-audit.test.mjs   (also wired into `npm run docs:audit:test` and CI)
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AUDIT = resolve(dirname(fileURLToPath(import.meta.url)), "docs-audit.mjs");

let passed = 0;
const failures = [];

/** Run the real audit against a fixture root; return { code, out }. */
const runAudit = (root, extraArgs = []) => {
  try {
    const out = execFileSync("node", [AUDIT, "--json", ...extraArgs], {
      env: { ...process.env, DOCS_AUDIT_ROOT: root },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status ?? 1, out: err.stdout || "" };
  }
};

const idsReported = (root, extraArgs) => {
  const { out } = runAudit(root, extraArgs);
  try {
    return new Set(JSON.parse(out).results.map((r) => r.id));
  } catch {
    return new Set(["<audit produced unparseable output>"]);
  }
};

const write = (root, rel, body) => {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
};

/**
 * A fixture is a minimal but VALID doc tree — every check passes on it. Each test then breaks one
 * thing. Building it valid-first is deliberate: if the baseline didn't pass, a "broken fixture fails"
 * assertion would prove nothing.
 */
const makeFixture = () => {
  const root = mkdtempSync(join(tmpdir(), "docs-audit-fixture-"));
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "t@t"], { cwd: root });
  execFileSync("git", ["config", "user.name", "t"], { cwd: root });

  write(root, "package.json", JSON.stringify({ name: "fixture", version: "2.33.0" }, null, 2));
  write(root, "CLAUDE.md", "# Fixture\n\nSee `docs/README.md`.\n");
  write(
    root,
    "docs/README.md",
    "# Map\n\n| File | What |\n|---|---|\n| `CHANGELOG.md` | log |\n| `CHANGELOG-SUMMARY.md` | summary |\n" +
      "| `DEVLOG.md` | story |\n| `db-deferred-list.md` | deferred |\n| `diors-builds notes.md` | intake |\n" +
      "| `archive/` | dead |\n"
  );
  // Placeholder hashes are filled in below with a REAL sha. Invented hashes fail `hash-chain`'s
  // resolution half — which is the check working correctly, and was caught by this very self-test.
  write(root, "docs/CHANGELOG.md", "# Changelog\n\n## v2.33.0 — 2026-07-01 (#2 · `SHA`) — two\n\n## v2.32.0 — 2026-06-01 (#1 · `SHA`) — one\n");
  write(root, "docs/CHANGELOG-SUMMARY.md", "# Summary\n\n## v2.33.0 — July 1, 2026\n\n## v2.32.0 — June 1, 2026\n");
  write(
    root,
    "docs/DEVLOG.md",
    "# DEVLOG\n\n**Part A — The Journey**\n- 2026-07-01 — a thing\n\n**Part B — Lessons Ledger**\n\n## 2026-07-01 — a thing\n\nbody\n"
  );
  write(root, "docs/db-deferred-list.md", "# Deferred\n\n## 🗂️ Queued\n\n- `[P2 · S]` **A queued item** that is still open.\n");
  // Long enough to clear archive-conservation's 40-char churn threshold, which exists so a rewrap or
  // a whitespace fix isn't reported as a deleted item. A 14-char stub silently passed the first run.
  write(
    root,
    "docs/diors-builds notes.md",
    "# Notes\n\n## Questions/Notes for Claude\n\n- an open intake item long enough to count as substance, not reflow churn\n\n## 📍 Where everything else lives\n"
  );
  write(root, "docs/archive/graveyard.md", "# Graveyard\n");
  write(root, "docs/archive/resolved-list.md", "# Resolved\n");

  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });

  // Second commit, so the changelog can cite a hash that genuinely resolves — and so `--diff HEAD~1`
  // has a baseline that does not touch the notes file.
  const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  write(root, "docs/CHANGELOG.md", `# Changelog\n\n## v2.33.0 — 2026-07-01 (#2 · \`${sha}\`) — two\n\n## v2.32.0 — 2026-06-01 (#1 · \`${sha}\`) — one\n`);
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "real hashes"], { cwd: root });

  // A tag whose package.json matches, so tag-integrity has something valid to pass on.
  execFileSync("git", ["tag", "-a", "v2.33.0", "-m", "v2.33.0"], { cwd: root });
  return root;
};

/**
 * @param name    what is being proven
 * @param checkId the check that must report
 * @param breakIt (root) => void — introduce exactly one violation
 * @param args    extra audit args (e.g. --diff)
 */
const proves = (name, checkId, breakIt, args = []) => {
  const root = makeFixture();
  try {
    // 1. The baseline must be clean, or nothing below means anything.
    const before = idsReported(root, args);
    if (before.has(checkId)) {
      failures.push(`${name}: baseline fixture ALREADY reports [${checkId}] — the check fires on valid input.`);
      return;
    }
    // 2. Break it; the check must now report.
    breakIt(root);
    const after = idsReported(root, args);
    if (!after.has(checkId)) {
      failures.push(`${name}: broke the invariant but [${checkId}] stayed SILENT — the check is dead.`);
      return;
    }
    passed++;
    console.log(`  ✓ ${checkId.padEnd(22)} ${name}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

/**
 * The inverse assertion: a legitimate pattern must NOT be reported. Only proving a check can fire
 * leaves the other half — a matcher that fires on everything — completely untested, and that half is
 * what nearly caused two correct CHANGELOG-SUMMARY range headings to be "fixed" into a fake gap.
 */
const provesSilent = (name, checkId, setup) => {
  const root = makeFixture();
  try {
    setup(root);
    const after = idsReported(root, []);
    if (after.has(checkId)) {
      failures.push(`${name}: [${checkId}] fired on VALID input — false positive.`);
      return;
    }
    passed++;
    console.log(`  ✓ ${checkId.padEnd(22)} ${name}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

console.log("\ndocs-audit self-test — each check must fail on a broken tree and pass on a valid one\n");

proves("a tracked docs/ file nothing in the README names", "readme-map", (root) => {
  write(root, "docs/orphan-record.md", "# Nobody maps me\n");
  execFileSync("git", ["add", "-A"], { cwd: root });
});

proves("a doc pointing at a path that does not exist", "xref", (root) => {
  write(root, "CLAUDE.md", "# Fixture\n\nSee `docs/moved-away/gone.md` for detail.\n");
  execFileSync("git", ["add", "-A"], { cwd: root });
});

proves("a version in the CHANGELOG but not the SUMMARY", "summary-coverage", (root) => {
  write(root, "docs/CHANGELOG-SUMMARY.md", "# Summary\n\n## v2.32.0 — June 1, 2026\n");
});

provesSilent("a SUMMARY range heading covering several versions", "summary-coverage", (root) => {
  // The documented convention for ops/docs-only releases. v2.32.0 is covered only by the range.
  write(root, "docs/CHANGELOG-SUMMARY.md", "# Summary\n\n## v2.32.0–v2.33.0 — July 2026\n");
});

proves("a non-newest changelog entry with no commit hash", "hash-chain", (root) => {
  write(root, "docs/CHANGELOG.md", "# Changelog\n\n## v2.33.0 — 2026-07-01 (#2) — two\n\n## v2.32.0 — 2026-06-01 (#1) — one\n");
});

proves("a DEVLOG body heading missing from its TOC", "devlog-toc", (root) => {
  write(
    root,
    "docs/DEVLOG.md",
    "# DEVLOG\n\n**Part A — The Journey**\n- 2026-07-01 — a thing\n\n**Part B — Lessons Ledger**\n\n" +
      "## 2026-07-01 — a thing\n\nbody\n\n## 2026-07-02 — an untocked thing\n\nbody\n"
  );
});

proves("closed + ℋ-confirmed intake left in the notes scratchpad", "notes-sweep", (root) => {
  write(
    root,
    "docs/diors-builds notes.md",
    "# Notes\n\n## Questions/Notes for Claude\n\n- [x] ℋ ✓ (2026-07-01) ~~a confirmed, closed item~~\n\n## 📍 Where everything else lives\n"
  );
});

proves("a SHIPPED item still sitting in the deferred list", "deferred-sweep", (root) => {
  write(root, "docs/db-deferred-list.md", "# Deferred\n\n## 🗂️ Queued\n\n- **A thing — SHIPPED 2026-07-01 as v2.33.0.**\n");
});

proves("a tag whose commit's package.json disagrees", "tag-integrity", (root) => {
  write(root, "package.json", JSON.stringify({ name: "fixture", version: "2.34.0" }, null, 2));
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "bump"], { cwd: root });
  // NOT v2.35.0 — that one is in KNOWN_BAD_TAGS, so the check correctly ignores it and the test would
  // "pass" against a silent check. The first draft picked exactly that tag; this is why the self-test
  // asserts the broken tree FAILS rather than just eyeballing the output.
  execFileSync("git", ["tag", "-a", "v2.36.0", "-m", "v2.36.0"], { cwd: root });
});

proves("a release since the cutoff never named in the DEVLOG", "devlog-version-cite", (root) => {
  write(root, "docs/CHANGELOG.md", "# Changelog\n\n## v2.40.0 — 2026-07-28 (#3) — new\n\n## v2.33.0 — 2026-07-01 (#2 · `abc1234`) — two\n");
  write(root, "docs/CHANGELOG-SUMMARY.md", "# Summary\n\n## v2.40.0 — July 28, 2026\n\n## v2.33.0 — July 1, 2026\n");
});

// The conservation check is a fact about a CHANGE, so it needs a second commit to diff against.
proves(
  "items deleted from the notes file with nothing swept to the graveyard",
  "archive-conservation",
  (root) => {
    write(
      root,
      "docs/diors-builds notes.md",
      "# Notes\n\n## Questions/Notes for Claude\n\n## 📍 Where everything else lives\n"
    );
    execFileSync("git", ["add", "-A"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "tidy"], { cwd: root });
  },
  // HEAD~1 is the fixture's second commit (which touches only the changelog); the breakIt step adds
  // the "tidy" commit on top. In the baseline run HEAD~1 is the first commit, and the diff between
  // them never touches the notes file — so the check is correctly silent there.
  ["--diff", "HEAD~1"]
);

console.log();
if (failures.length) {
  console.log(`❌ ${failures.length} self-test failure(s):\n`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log();
  process.exit(1);
}
console.log(`✅ all ${passed} checks proven capable of failing.\n`);
