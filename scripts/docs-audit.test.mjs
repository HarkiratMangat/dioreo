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
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  // ⚠️ The SPACE in this prefix is deliberate and load-bearing. The real repo lives at
  // "/Applications/Claude Code/Diors-Builds", and TWO checks shipped broken by paths with spaces:
  // `nested-worktree` was completely dead (`split(" ")[0]` gave "/Applications/Claude"), and
  // `hook-integrity`'s regex stopped at the space and only worked by accident. Neither could ever
  // surface in a space-free tmpdir. A fixture that doesn't reproduce production's hazards is a
  // fixture that certifies the wrong thing. Do not "tidy" this into a hyphen.
  const root = mkdtempSync(join(tmpdir(), "docs audit fixture "));
  // ⚠️ -b main IS LOAD-BEARING. `git init` takes its branch name from init.defaultBranch,
  // which is set to `main` in THIS repo's local config and unset globally — so the fixture
  // was `main` on the developer's Mac and `master` on CI's ubuntu runner. Checks that name
  // `main` then could not resolve it, skipped, and a prove case correctly reported the check
  // as dead — a failure that could only ever appear in CI. Same class as the deliberate SPACE
  // in the tmpdir prefix above: a fixture must not inherit anything from the machine.
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.email", "t@t"], { cwd: root });
  execFileSync("git", ["config", "user.name", "t"], { cwd: root });

  // A runtime dependency, its lock entry, its installed copy and its NOTICE attribution — all four,
  // consistent. dep-licences and notice-attribution both examine this; without it they examine 0
  // items and the ledger correctly calls that a vacuous pass.
  write(
    root,
    "package.json",
    JSON.stringify({ name: "fixture", version: "2.33.0", dependencies: { widget: "^1.2.3" } }, null, 2)
  );
  write(
    root,
    "package-lock.json",
    JSON.stringify({ name: "fixture", version: "2.33.0", lockfileVersion: 3,
      packages: { "": { version: "2.33.0" }, "node_modules/widget": { version: "1.2.3", license: "MIT" } } }, null, 2)
  );
  write(root, "node_modules/widget/package.json", JSON.stringify({ name: "widget", version: "1.2.3", license: "MIT" }));
  write(
    root,
    "NOTICE",
    "NOTICE — fixture\n\n1. DIRECT DEPENDENCIES\n================================\n\n" +
      "  widget 1.2.3                   MIT\n                                 Copyright (c) someone\n\n" +
      "2. TRADEMARKS\n================================\n\nnone\n"
  );
  // Names every unit the new structural checks look for: the root docs, every top-level directory,
  // each path-scoped rule, and each script. A fixture that doesn't satisfy them reports VACUOUS PASS.
  write(
    root,
    "CLAUDE.md",
    "# Fixture\n\nSee `docs/README.md`. Licence in `LICENSE`, attributions in `NOTICE`.\n\n" +
      "Nav map: `.claude/rules/example.md` · dirs `docs/` `.claude/` `.github/` `scripts/` `models/`.\n" +
      "Scripts: `scripts/dofix.js`.\n"
  );
  write(root, "LICENSE", "Fixture licence.\n");
  write(root, "scripts/dofix.js", "// fixture script\n");
  // privacy-inventory loads the schema rather than regexing it, so the fixture must supply one —
  // otherwise the check skips, examines nothing, and the ledger correctly calls that a vacuous pass.
  // ⚠️ It exports a PLAIN object, not a mongoose schema. A `require('mongoose')` here resolves from
  // the fixture's own directory in /tmp, which has no node_modules, so it threw and the check skipped
  // — silently turning the "broken fixture must fail" assertion into a false pass. The check only
  // ever reads `schema.paths`, so this is the same shape without the resolution hazard.
  write(
    root,
    "models/UserPreference.js",
    "module.exports = { schema: { paths: { discordId: {}, timezone: {} } } };\n"
  );
  write(
    root,
    "docs/legal/PRIVACY.md",
    "# Privacy\n\n## Appendix A — Complete data inventory\n\n" +
      "- `discordId` — the user id\n- `timezone`\n\n**That's the whole list.**\n"
  );
  write(
    root,
    "docs/README.md",
    "# Map\n\n| File | What |\n|---|---|\n| `CHANGELOG.md` | log |\n| `CHANGELOG-SUMMARY.md` | summary |\n" +
      "| `DEVLOG.md` | story |\n| `db-deferred-list.md` | deferred |\n| `diors-builds notes.md` | intake |\n" +
      "| `archive/` | dead |\n| `ROADMAP.md` | roadmap |\n| `SESSION-START.md` | session |\n" +
      "| `legal/PRIVACY.md` | policy |\n" +
      "\nPath-scoped rules: example (1 file).\n"
  );
  // Placeholder hashes are filled in below with a REAL sha. Invented hashes fail `hash-chain`'s
  // resolution half — which is the check working correctly, and was caught by this very self-test.
  write(root, "docs/CHANGELOG.md", "# Changelog\n\n## v2.33.0 — 2026-07-01 (#2 · `SHA`) — two\n\n## v2.32.0 — 2026-06-01 (#1 · `SHA`) — one\n");
  write(root, "docs/CHANGELOG-SUMMARY.md", "# Summary\n\n## v2.33.0 — July 1, 2026\n\n## v2.32.0 — June 1, 2026\n");
  write(
    root,
    "docs/DEVLOG.md",
    "# DEVLOG\n\n**Part A — The Journey**\n- 2026-07-01 — a thing\n\n**Part B — Lessons Ledger**\n\n## 2026-07-01 — a thing\n\nbody\n\n" +
      "# Part B\n\nthematic takeaways, no dated entries\n"
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
  // records-present requires the full set of core records.
  write(root, "docs/ROADMAP.md", "# Roadmap\n");
  write(root, "docs/SESSION-START.md", "# Session start\n");
  // secrets-hygiene: .env must be ignored and untracked; both settings files must be tracked.
  // The "!" negation is REQUIRED, and reproduces a real trap: the GLOBAL ~/.config/git/ignore carries
  // **/.claude/settings.local.json, so it is ignored in EVERY repo on this machine including this
  // fixture. Without the negation the file is silently untracked -- which is precisely the bug the real
  // .gitignore documents, and the baseline meta-test caught it here first.
  write(root, ".gitignore", ".env\n.env.*\nnode_modules/\n!.claude/settings.local.json\n");
  write(root, ".env", "BOT_TOKEN=fake-value-for-fixture\n");
  write(root, ".claude/settings.local.json", JSON.stringify({ permissions: { allow: [] } }, null, 2));
  // ci-wiring: the audit must guard its own CI wiring.
  write(
    root,
    ".github/workflows/ci.yml",
    "name: CI\non:\n  push:\n    branches: [main, v3-pre-release]\n  pull_request:\n    branches: [main, v3-pre-release]\njobs:\n  x:\n    steps:\n      - uses: actions/checkout@v4\n        with:\n          fetch-depth: 0\n      - run: npm run docs:audit:test\n      - run: npm run docs:audit\n"
  );
  // rule-globs: a path-scoped rule whose glob matches a real tracked file.
  write(root, ".claude/rules/example.md", "---\npaths:\n  - docs/*.md\n---\n\nA rule.\n");
  // hook-integrity reads this; the referenced script must exist AND be executable.
  write(root, ".claude/hooks/example-gate.sh", "#!/usr/bin/env bash\nexit 0\n");
  chmodSync(join(root, ".claude/hooks/example-gate.sh"), 0o755);
  write(
    root,
    ".claude/settings.json",
    JSON.stringify({ hooks: { PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: `bash '${root}/.claude/hooks/example-gate.sh'` }] }] } }, null, 2)
  );

  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });

  // Second commit, so the changelog can cite a hash that genuinely resolves — and so `--diff HEAD~1`
  // has a baseline that does not touch the notes file.
  const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  write(root, "docs/CHANGELOG.md", `# Changelog\n\n## v2.33.0 — 2026-07-01 (#2 · \`${sha}\`) — two\n\n## v2.32.0 — 2026-06-01 (#1 · \`${sha}\`) — one\n`);
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "real hashes"], { cwd: root });

  // Tags for BOTH changelog versions. tag-integrity needs one that matches; tag-coverage needs every
  // version except the newest to be tagged — tagging only v2.33.0 made the baseline fail, which the
  // "baseline must be clean" assertion caught immediately.
  execFileSync("git", ["tag", "-a", "v2.32.0", "-m", "v2.32.0"], { cwd: root });
  execFileSync("git", ["tag", "-a", "v2.33.0", "-m", "v2.33.0"], { cwd: root });
  return root;
};

/**
 * @param name    what is being proven
 * @param checkId the check that must report
 * @param breakIt (root) => void — introduce exactly one violation
 * @param args    extra audit args (e.g. --diff)
 */
// Every check id any prove case claims to exercise. The coverage assertion at the bottom compares
// this against the audit's own --list, so a check registered with no test cannot ship unnoticed.
const proven = new Set();

const proves = (name, checkId, breakIt, args = []) => {
  proven.add(checkId);
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
  proven.add(checkId);
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

/**
 * The meta-test, and the one that would have caught the most. Every `proves` case only asserts that
 * ITS OWN check is quiet on the baseline, so a check that fires on valid input for an unrelated
 * reason hides in plain sight — and an entire check silently reporting nothing hides even better.
 * This asserts the untouched fixture is completely clean AND that every registered check actually ran.
 */
const provesBaselineClean = () => {
  const root = makeFixture();
  try {
    const { out } = runAudit(root, []);
    let parsed;
    try {
      parsed = JSON.parse(out);
    } catch {
      failures.push(`baseline: audit produced unparseable output — ${out.slice(0, 200)}`);
      return;
    }
    if (parsed.results.length) {
      for (const r of parsed.results) {
        failures.push(`baseline: [${r.id}] fired on the VALID fixture — ${r.msg.slice(0, 140)}`);
      }
      return;
    }
    passed++;
    console.log(`  ✓ ${"(baseline)".padEnd(22)} a valid fixture tree reports nothing at all`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

console.log("\ndocs-audit self-test — each check must fail on a broken tree and pass on a valid one\n");

provesBaselineClean();

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

provesSilent("a LEGACY range heading (pre-v2.19.0), still allowed", "summary-coverage", (root) => {
  // Ranges are retired but not retroactive: 7 survive in the real SUMMARY, all v2.18.3-and-older, and
  // rewriting history to satisfy a new rule would be worse than the rule. Only modern versions must
  // have their own heading -- the sibling `proves` case above covers that direction.
  write(root, "docs/CHANGELOG.md", "# Changelog\n\n## v2.18.3 — 2026-07-16 (#2) — b\n\n## v2.18.0 — 2026-07-14 (#1) — a\n");
  write(root, "docs/CHANGELOG-SUMMARY.md", "# Summary\n\n## v2.18.0–v2.18.3 — July 14–16, 2026\n");
});

proves("a released version whose CHANGELOG heading was deleted", "summary-orphan", (root) => {
  // The real shape of the v2.44.0 damage: the heading goes, the BODY stays and welds itself onto
  // the entry above. A substring test on the version number would still fail here, which is why
  // the body below deliberately does not name its own version -- exactly like the real one did not.
  write(root, "docs/CHANGELOG.md", "# Changelog\n\n## v2.33.0 — 2026-07-01 (#2) — two\n\nbody of two\n\nthe absorbed body of the lost entry\n");
  write(root, "docs/CHANGELOG-SUMMARY.md", "# Summary\n\n## v2.33.0 — July 1, 2026\n\n## v2.32.0 — June 1, 2026\n");
});

provesSilent("a LEGACY range heading in the SUMMARY, which names versions it need not head", "summary-orphan", (root) => {
  // Ranges cover versions they never give an individual heading to. Expanding one into per-version
  // expectations would manufacture findings out of a convention that is retired but still valid.
  //
  // ⚠️ The modern v2.33.0 pair is here so the corpus is NOT empty. A legacy-only fixture made this
  // check examine 0 items and the audit's own vacuous-pass detector reported it as firing — which is
  // that detector working, not a false positive. Keeping a real heading in the fixture proves the
  // stronger thing anyway: ranges are skipped WHILE individual headings are still being checked.
  write(
    root,
    "docs/CHANGELOG.md",
    "# Changelog\n\n## v2.33.0 — 2026-08-01 (#3) — c\n\n## v2.18.3 — 2026-07-16 (#2) — b\n\n## v2.18.0 — 2026-07-14 (#1) — a\n"
  );
  write(root, "docs/CHANGELOG-SUMMARY.md", "# Summary\n\n## v2.33.0 — August 1, 2026\n\n## v2.18.0–v2.18.3 — July 14–16, 2026\n");
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

proves("a dated entry sitting after the Part B marker", "devlog-parts", (root) => {
  write(
    root,
    "docs/DEVLOG.md",
    "# DEVLOG\n\n**Part A — The Journey**\n- 2026-07-01 — a thing\n\n**Part B — Lessons Ledger**\n\n" +
      "## 2026-07-01 — a thing\n\nbody\n\n# Part B\n\nthematic takeaways\n\n" +
      "## 2026-07-02 — an append-to-EOF straggler\n\nbody\n"
  );
});

provesSilent("a dated entry that sits before the Part B marker", "devlog-parts", (root) => {
  write(
    root,
    "docs/DEVLOG.md",
    "# DEVLOG\n\n**Part A — The Journey**\n- 2026-07-01 — a thing\n\n**Part B — Lessons Ledger**\n\n" +
      "## 2026-07-01 — a thing\n\nbody\n\n# Part B\n\nthematic takeaways, no dated entries\n"
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

// ---- the checks added in the 2026-07-28 22:20 EDT re-audit -------------------------------------

proves("a modern version hiding inside a retired RANGE heading", "summary-coverage", (root) => {
  // Ranges are legacy-only (retired after v2.18.3). v2.33.0 is modern, so a range must not cover it.
  write(root, "docs/CHANGELOG-SUMMARY.md", "# Summary\n\n## v2.32.0–v2.33.0 — July 2026\n");
});

proves("a confirmed notes item using ✴︎ rather than ℋ", "notes-sweep", (root) => {
  // The confirmation mark is switchable in MarkEdit (✴︎ ✦ ◆ ℋ). Matching only ℋ -- the first pass --
  // meant an item confirmed with any other symbol was invisible and sat unswept forever.
  write(
    root,
    "docs/diors-builds notes.md",
    "# Notes\n\n## Questions/Notes for Claude\n\n- [x] ✴︎ ✓ (2026-07-01) ~~a confirmed, closed item~~\n\n## 📍 Where everything else lives\n"
  );
});

proves("a DONE item still in the deferred list", "deferred-sweep", (root) => {
  // DONE is the single most common marker in the real archive and the first pass matched neither it
  // nor DROPPED.
  write(root, "docs/db-deferred-list.md", "# Deferred\n\n## 🗂️ Queued\n\n- ~~A thing~~ → **DONE 2026-07-01 20:20 EDT.** Details.\n");
});

provesSilent("\"NOT DONE\" describing remaining scope", "deferred-sweep", (root) => {
  // Real text from db-deferred-list.md L214. A negation must never read as completion.
  write(root, "docs/db-deferred-list.md", "# Deferred\n\n## 🗂️ Queued\n\n- **❌ NOT DONE 2026-07-01 — the real remaining scope**, in priority order.\n");
});

proves("package.json out of step with the newest changelog entry", "version-sync", (root) => {
  write(root, "package.json", JSON.stringify({ name: "fixture", version: "2.33.1" }, null, 2));
});

provesSilent("v3 pre-release: \"Pre-Release v3.1.0\" with a -pre package.json", "version-sync", (root) => {
  // CI runs this audit on v3-pre-release PRs. Failing there would be a gap created by gap-closing work.
  write(root, "package.json", JSON.stringify({ name: "fixture", version: "3.1.0-pre" }, null, 2));
  write(root, "docs/CHANGELOG.md", "# Changelog\n\n## Pre-Release v3.1.0 — 2026-08-01 — v3 work\n\n## v2.33.0 — 2026-07-01 (#2) — two\n");
});

proves("a released version with no git tag", "tag-coverage", (root) => {
  write(root, "docs/CHANGELOG.md", "# Changelog\n\n## v2.33.0 — 2026-07-01 (#2) — two\n\n## v2.32.5 — 2026-06-15 (#1) — untagged\n");
  write(root, "docs/CHANGELOG-SUMMARY.md", "# Summary\n\n## v2.33.0 — July 1, 2026\n\n## v2.32.5 — June 15, 2026\n");
});

proves("a hook registered against a script that does not exist", "hook-integrity", (root) => {
  const s = JSON.parse(readFileSync(join(root, ".claude/settings.json"), "utf8"));
  s.hooks.PreToolUse[0].hooks[0].command = `bash '${root}/.claude/hooks/deleted-gate.sh'`;
  write(root, ".claude/settings.json", JSON.stringify(s, null, 2));
});

proves("a hook script that exists but is not executable", "hook-integrity", (root) => {
  chmodSync(join(root, ".claude/hooks/example-gate.sh"), 0o644);
});

proves("a hook delegating to docs-audit with an unknown check id", "hook-integrity", (root) => {
  const s = JSON.parse(readFileSync(join(root, ".claude/settings.json"), "utf8"));
  s.hooks.PreToolUse[0].hooks[0].command = "node scripts/docs-audit.mjs --only devlog-tocs --json";
  write(root, ".claude/settings.json", JSON.stringify(s, null, 2));
});

// ---- anchor integrity: a renamed heading must NEVER silently disable a check ---------------------
// Demonstrated on the real tree 2026-07-28 22:40 EDT: renaming these two anchors made both checks
// print "passed" while doing nothing. Two guards written to stop silently-dead guards were themselves
// silently dead. These are the most important assertions in this file.

proves("the DEVLOG Part A/B markers being renamed", "devlog-toc", (root) => {
  write(root, "docs/DEVLOG.md", "# DEVLOG\n\n**Part A - The Journey**\n- 2026-07-01 — a thing\n\n**Part B - Lessons**\n\n## 2026-07-01 — a thing\n\nbody\n");
});

proves("the DEVLOG's real \"# Part B\" heading going missing", "devlog-parts", (root) => {
  write(
    root,
    "docs/DEVLOG.md",
    "# DEVLOG\n\n**Part A — The Journey**\n- 2026-07-01 — a thing\n\n**Part B — Lessons Ledger**\n\n## 2026-07-01 — a thing\n\nbody\n"
  );
});

proves("the notes-file \"## Questions\" heading being renamed", "notes-sweep", (root) => {
  write(root, "docs/diors-builds notes.md", "# Notes\n\n## Intake for Claude\n\n- [x] ℋ ✓ ~~a confirmed item nobody will ever notice~~\n\n## 📍 Where everything else lives\n");
});

// ---- the records/config/CI/rule checks -----------------------------------------------------------

proves("a core record file going missing", "records-present", (root) => {
  rmSync(join(root, "docs/ROADMAP.md"));
});

proves(".env no longer gitignored", "secrets-hygiene", (root) => {
  write(root, ".gitignore", "!.claude/settings.local.json\n");
});

proves(".env committed to git", "secrets-hygiene", (root) => {
  execFileSync("git", ["add", "-f", ".env"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "oops"], { cwd: root });
});

proves("CI no longer running the audit", "ci-wiring", (root) => {
  const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8").replace("      - run: npm run docs:audit\n", "");
  write(root, ".github/workflows/ci.yml", ci);
});

proves("a CI trigger list that omits v3-pre-release", "ci-wiring", (root) => {
  const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8").replace(/branches: \[main, v3-pre-release\]/, "branches: [main]");
  write(root, ".github/workflows/ci.yml", ci);
});

proves("CI losing fetch-depth: 0", "ci-wiring", (root) => {
  const ci = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8").replace(/\n *with:\n *fetch-depth: 0/, "");
  write(root, ".github/workflows/ci.yml", ci);
});

proves("a path-scoped rule whose glob matches nothing", "rule-globs", (root) => {
  write(root, ".claude/rules/example.md", "---\npaths:\n  - utils/deleted-subsystem/*.js\n---\n\nA rule nobody will ever load.\n");
  execFileSync("git", ["add", "-A"], { cwd: root });
});

proves("a git worktree nested inside the repo", "nested-worktree", (root) => {
  execFileSync("git", ["worktree", "add", "-q", "-b", "scratch", join(root, ".claude/worktrees/nested")], { cwd: root });
});

// ---- structural growth: new files, folders, scripts and rules ---------------------------------
// All five were invisible before 2026-07-29 00:40 EDT. A LIVE parallel session added LICENSE, NOTICE,
// CONTRIBUTING.md, CONTRIBUTORS.md and an entire public/ tree while this audit was being written, and
// the audit — which only looked under docs/ — saw none of it.

proves("a NUL byte making a text file invisible to ripgrep", "binary-in-text", (root) => {
  write(root, "docs/ROADMAP.md", "# Roadmap\u0000\n");
});

proves("a root-level document nothing maps", "root-docs", (root) => {
  // ⚠️ NOT `NOTICE` any more. This used NOTICE, and then the fixture gained a real NOTICE (for
  // notice-attribution) that CLAUDE.md maps — so the "break" stopped breaking anything and this test
  // silently went dead while still reporting a pass. Caught by the suite's own baseline assertion.
  // Any unmapped root document does the job; this one is not referenced anywhere in the fixture.
  write(root, "GOVERNANCE.md", "How decisions get made.\n");
  execFileSync("git", ["add", "-A"], { cwd: root });
});

proves("a brand-new top-level directory", "top-level-dirs", (root) => {
  write(root, "public/index.html", "<p>hi</p>\n");
  execFileSync("git", ["add", "-A"], { cwd: root });
});

proves("a script mentioned in no rule or doc", "scripts-documented", (root) => {
  write(root, "scripts/undocumented.js", "// nobody describes me\n");
  execFileSync("git", ["add", "-A"], { cwd: root });
});

proves("a rule file missing from the nav map", "nav-map-sync", (root) => {
  write(root, ".claude/rules/orphan.md", "---\npaths:\n  - docs/*.md\n---\n\nUnmapped.\n");
  execFileSync("git", ["add", "-A"], { cwd: root });
});

proves("a hardcoded rule-file count going stale", "nav-map-sync", (root) => {
  const r = readFileSync(join(root, "docs/README.md"), "utf8") + "\n99 files (commands-overview, ...).\n";
  write(root, "docs/README.md", r);
});

proves("a CLAUDE.md section growing into subsystem detail", "claude-md-shape", (root) => {
  // The real failure this was built from: the `public/` section reached 286 lines — 43% of the file
  // that is loaded in full every session — because nothing measured it. nav-map-sync could not see
  // it: that check only fires once a rule file EXISTS and is unlisted, never when the detail was
  // simply never moved into one.
  const c = readFileSync(join(root, "CLAUDE.md"), "utf8")
    + "\n### A subsystem that outgrew the map\n"
    + "detail line\n".repeat(140);
  write(root, "CLAUDE.md", c);
});

proves("a record file with its top-level heading spliced in twice", "record-structure", (root) => {
  // The real incident this guards: a commit spliced CHANGELOG's own 183-line header into the middle
  // of an entry, and every other check passed because none of them look at a file's SHAPE.
  const c = readFileSync(join(root, "docs/CHANGELOG.md"), "utf8");
  write(root, "docs/CHANGELOG.md", c + "\n# Changelog\n\nspliced in again\n");
});

proves("a commit reaching main outside the PR flow", "unreleased-on-main", (root) => {
  // A direct push leaves a commit after the newest tag. Version is minted at merge here, so
  // that range is empty on a correctly released tree — which is what makes the range a usable
  // signal at all. WARN, not ERROR: the merge->tag window makes this briefly true on purpose.
  write(root, "docs/ROADMAP.md", "# Roadmap\n\npushed straight to main\n");
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "docs: straight to main"], { cwd: root });
});

proves("the lockfile's version drifting from package.json", "lock-version", (root) => {
  // The real drift: package.json reached 2.47.0 while the lock still said 2.35.3, twelve releases
  // back, because npm only rewrites that field when a dependency-touching command runs.
  const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
  lock.version = "0.0.1";
  write(root, "package-lock.json", JSON.stringify(lock, null, 2));
});

proves("a copyleft package entering the dependency tree", "dep-licences", (root) => {
  const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
  lock.packages["node_modules/evil"] = { version: "1.0.0", license: "GPL-3.0" };
  write(root, "package-lock.json", JSON.stringify(lock, null, 2));
});

proves("a package whose licence cannot be determined at all", "dep-licences", (root) => {
  // Not the same failure as copyleft, and it must not be treated as clean: a scanner that reads
  // "unknown" as permissive fails open, which is the whole thing it exists to prevent.
  const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
  lock.packages["node_modules/mystery"] = { version: "1.0.0" };
  write(root, "package-lock.json", JSON.stringify(lock, null, 2));
  write(root, "node_modules/mystery/package.json", JSON.stringify({ name: "mystery", version: "1.0.0" }));
});

proves("NOTICE going stale when a dependency is bumped", "notice-attribution", (root) => {
  const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
  lock.packages["node_modules/widget"].version = "9.9.9";
  write(root, "package-lock.json", JSON.stringify(lock, null, 2));
});

proves("a runtime dependency with no NOTICE attribution", "notice-attribution", (root) => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  pkg.dependencies.unattributed = "^1.0.0";
  write(root, "package.json", JSON.stringify(pkg, null, 2));
});

proves("a stored field missing from the privacy policy's inventory", "privacy-inventory", (root) => {
  // Appendix A says it is "a transcription" of the UserPreference schema and ends "That's the whole
  // list." It had really drifted: two ColorHex fields were stored and unlisted. Dropping a field from
  // the fixture's appendix reproduces exactly that.
  const p = join(root, "docs/legal/PRIVACY.md");
  write(root, "docs/legal/PRIVACY.md",
    readFileSync(p, "utf8").replace(/^- `discordId`.*$/m, "- (removed)"));
});

// ---- the evidence ledger: a pass you cannot audit is not a pass -------------------------------

proves("a check that examines nothing reporting a VACUOUS PASS", "scripts-documented", (root) => {
  // Remove every script. scripts-documented then examines 0 items and would historically have
  // "passed" — verifying nothing. The ledger now turns that into a warning instead.
  rmSync(join(root, "scripts/dofix.js"));
  execFileSync("git", ["add", "-A"], { cwd: root });
});

// The CONTENT-TRACING branch: the archive grew, but not with the item that was removed. This branch
// hid a real bug for its whole life because the zero-growth branch always fired first, so it is
// exercised explicitly here.
{
  const root = makeFixture();
  try {
    write(root, "docs/diors-builds notes.md",
      "# Notes\n\n## Questions/Notes for Claude\n\n## 📍 Where everything else lives\n");
    write(root, "docs/archive/graveyard.md", "# Graveyard\n\n- something completely unrelated was swept here instead today\n");
    execFileSync("git", ["add", "-A"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "sweep the wrong thing"], { cwd: root });
    const ids = idsReported(root, ["--diff", "HEAD~1"]);
    if (!ids.has("archive-conservation")) {
      failures.push("a deletion whose text never reached the archive: [archive-conservation] stayed SILENT — the content-tracing branch is dead.");
    } else {
      passed++;
      console.log(`  ✓ ${"archive-conservation".padEnd(22)} the archive grew, but not with the removed item`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

// An in-place EDIT must not read as a deletion. A unified diff renders a changed line as "-" plus
// "+", so counting bare "-" lines demanded a graveyard entry for a one-line path correction. That
// would have trained everyone to bypass the gate — worse than not having it.
{
  const root = makeFixture();
  try {
    const p = join(root, "docs/diors-builds notes.md");
    write(root, "docs/diors-builds notes.md",
      readFileSync(p, "utf8").replace("an open intake item long enough to count as substance, not reflow churn",
        "an open intake item long enough to count as substance, not reflow churn (edited in place)"));
    execFileSync("git", ["add", "-A"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "edit in place"], { cwd: root });
    const ids = idsReported(root, ["--diff", "HEAD~1"]);
    if (ids.has("archive-conservation")) {
      failures.push('an in-place edit of the notes file: [archive-conservation] fired on an EDIT, not a deletion.');
    } else {
      passed++;
      console.log(`  ✓ ${"archive-conservation".padEnd(22)} an in-place edit is not a deletion`);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

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

// ---- coverage: a check with no test is an unproven check --------------------------------------
// ⚠️ ADDED 2026-08-02 01:30 EDT because this suite did not notice. `unreleased-on-main` was
// registered in docs-audit.mjs and shipped with no prove case, and the summary still reported
// "all 53 checks proven" — counting PROVE CASES, never checks. A suite whose whole purpose is
// "no guard ships unproven" was itself blind to an unproven guard.
{
  const listed = execFileSync("node", [AUDIT, "--list"], { encoding: "utf8" })
    .split("\n")
    .map((l) => (l.match(/^(?:ERROR|WARN)\s+(\S+)/) || [])[1])
    .filter(Boolean);
  // ⚠️ EXEMPTIONS CARRY A REASON, per this repo's own convention — an unexplained allowlist
  // silences a real defect forever. These four read the developer's REAL ~/.claude (the memory
  // store, the external anchors, the slug derived from the repo's location). A fixture in /tmp
  // cannot make them fire without writing into the actual home directory, which a test must not
  // do. They are exercised every time the audit runs for real; in CI they SKIP and say so.
  const CANNOT_FIXTURE = {
    "memory-xref": "reads the real ~/.claude memory store",
    "memory-index": "reads the real ~/.claude memory store",
    "memory-slug": "derives the slug from this checkout's real path",
    "external-anchors": "resolves absolute paths outside the repo",
  };
  const missing = listed.filter((id) => !proven.has(id) && !CANNOT_FIXTURE[id]);
  if (missing.length) {
    failures.push(
      `coverage: ${missing.length} check(s) registered in docs-audit.mjs have NO self-test — ` +
      `${missing.join(", ")}. Add a proves(...) case; an untested guard is an unproven guard.`
    );
  } else {
    console.log(`\n  ✓ coverage               all ${listed.length} registered checks covered (${Object.keys(CANNOT_FIXTURE).length} exempt, with reasons)`);
  }
}

console.log();
if (failures.length) {
  console.log(`❌ ${failures.length} self-test failure(s):\n`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log();
  process.exit(1);
}
console.log(`✅ all ${passed} checks proven capable of failing.\n`);
