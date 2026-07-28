#!/usr/bin/env node
/**
 * docs-audit.mjs — the documentation invariants, as a program instead of prose.
 *
 * WHY THIS EXISTS (2026-07-28 19:30 EDT, Harkirat's ask)
 * ------------------------------------------------------
 * The records kept going stale in a specific, repeating shape, and every previous fix was another
 * Claude Code hook. Hooks have three limits that guarantee the next gap:
 *   1. They only fire inside a Claude session, on this Mac. A PR opened by anyone (or anything) else
 *      is unchecked. So is a session where the hook silently errored.
 *   2. Each rule was ~1.4KB of backslash-escaped bash inlined into settings.json — unreadable,
 *      untestable, and impossible to run by hand to ask "is the tree clean right now?".
 *   3. They fire at ONE moment. The DEVLOG failure (machine-checked records 22/22, attention-
 *      dependent ones 8/22) and the notes-file gap are the same bug: a check that runs at the moment
 *      of DISCOVERY (session start) and never at the moment of CLOSURE.
 *
 * So the derivable invariants live here, and the hooks + CI both call this. One implementation.
 *
 * THE THREE FAILURE SHAPES THIS AUDIT COVERS
 *   Shape B — conservation: an item leaves an active list ONLY by appearing in an archive. A shrink
 *             with no matching grow is either an unswept item or a DELETED one. (`notes-sweep`,
 *             `deferred-sweep`, `archive-conservation`)
 *   Shape C — filesystem truth: the doc map and every cross-reference are checkable against `ls`.
 *             (`readme-map`, `xref`)
 *   Plus the release chain that hooks already watch at merge, re-checked here so it also holds for
 *   PRs opened outside a Claude session. (`summary-coverage`, `hash-chain`, `devlog-toc`,
 *   `devlog-version-cite`, `tag-integrity`)
 *
 * WHAT THIS DELIBERATELY DOES NOT CHECK — and why naming it matters
 * -----------------------------------------------------------------
 * Memory (`~/.claude/projects/.../memory/`) lives outside the repo, and "did this session record the
 * rule it established?" is a fact about a SESSION, not about the tree — CI cannot see it. Same for
 * "did this session act on the notes file". Those two are covered by session-boundary hooks instead
 * (see `.claude/settings.json`: NOTES-CLOSE and MEMORY-WRITE). They are named here on purpose: a
 * partial check that FEELS total is exactly how DEVLOG coverage sat at 8/22 while the changelog hook
 * kept passing every single time.
 *
 * SEVERITY CONTRACT
 *   ERROR — an invariant that is never legitimately violated. Fails CI. Blocks the merge.
 *   WARN  — a judgment call worth surfacing. Reported, never blocking, so a hotfix is never held up
 *           by prose. If you find yourself wanting to demote an ERROR to shut it up, the honest move
 *           is to fix the record or add an explicit, commented exemption below.
 *
 * USAGE
 *   node scripts/docs-audit.mjs                 # all tree checks
 *   node scripts/docs-audit.mjs --only xref     # one check (hooks use this)
 *   node scripts/docs-audit.mjs --diff main     # + the conservation check against a base ref
 *   node scripts/docs-audit.mjs --json          # machine-readable
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// DOCS_AUDIT_ROOT exists so scripts/docs-audit.test.mjs can point the whole audit at a fixture tree
// and PROVE each check fires. That matters more than usual here: this repo has already shipped a
// guard that was silently dead (every Bash rule in usage-guard.mjs stopped matching at line 2 because
// "\n" wasn't treated as a command separator) and it passed review because it was only ever tested on
// input that couldn't fail. A check nobody has watched fail is not a check.
const REPO = process.env.DOCS_AUDIT_ROOT
  ? resolve(process.env.DOCS_AUDIT_ROOT)
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");

const git = (...args) => {
  try {
    return execFileSync("git", args, { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
};
const read = (rel) => {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
};
const tracked = () => git("ls-files").split("\n").filter(Boolean);

// A shallow clone (the default for actions/checkout@v4) has no tags and almost no history. Measured
// 2026-07-28 20:20 EDT against `git clone --depth 1` of this repo: 42 spurious hash-chain "does not
// resolve" errors, and exactly 1 tag visible instead of 100+. Both directions are dangerous — one
// fails CI on correct docs, the other passes silently on broken ones. So the git-dependent checks
// DOWNGRADE to a warning that names the limitation rather than reporting a conclusion they can't
// support. CI sets fetch-depth: 0 so this path is not taken there.
const isShallow = () => git("rev-parse", "--is-shallow-repository").trim() === "true";

/* ------------------------------------------------------------------ *
 * Exemptions. Every one carries a reason and, where it applies, the
 * record that tracks it — an unexplained allowlist entry is how a real
 * defect gets permanently silenced.
 * ------------------------------------------------------------------ */

// Six tags were minted before the TAG-INVARIANT gate existed, on commits whose package.json still
// read the PREVIOUS version. Rewriting a pushed tag is worse than the inconsistency, so they are
// tracked in docs/db-deferred-list.md rather than fixed. New mismatches must still fail.
const KNOWN_BAD_TAGS = new Set(["v2.33.3", "v2.33.4", "v2.35.0", "v2.35.1", "v2.35.2", "v2.35.3"]);

// The DEVLOG-entry-by-default rule was adopted at v2.40.0 (2026-07-28 14:15 EDT). Releases before it
// are legitimately uncovered — 62 of 103 versions predate it, and flagging them would be noise that
// trains you to ignore the whole audit.
const DEVLOG_RULE_FROM = [2, 40, 0];

// package.json was NOT bumped per release before v2.33.0 — the version lived only in the changelog,
// and every earlier commit reads "1.0.0". Verified 2026-07-28 19:45 EDT: v2.32.0 -> 1.0.0,
// v2.33.0 -> 2.33.0. Checking the 59 pre-convention tags reports a real historical fact as 59
// failures, which is exactly the noise that teaches you to stop reading the audit.
const TAG_RULE_FROM = [2, 33, 0];

// Historical-by-design sources: these describe the past, including files since renamed, archived, or
// belonging to other machines entirely. Scanning them for LIVE cross-references produces guaranteed
// false positives — a doc saying "renamed from `deferred-items.md`" is correct prose, not staleness.
//   - CHANGELOG / SUMMARY / DEVLOG: append-only records of what was true at the time.
//   - diors-builds notes.md: Harkirat's INTAKE scratchpad, not a maintained record. Its resolved
//     comments reference MarkEdit extension files and other paths that never lived in this repo.
//   - archive/: dead by definition. superpowers/: dated design snapshots of one moment.
const XREF_SKIP_SOURCES = [
  "docs/CHANGELOG.md",
  "docs/CHANGELOG-SUMMARY.md",
  "docs/DEVLOG.md",
  "docs/diors-builds notes.md",
];
const XREF_SKIP_PREFIXES = ["docs/archive/", "docs/superpowers/"];

// The memory store, for the memory-xref check. Outside the repo by design, so this check is SKIPPED
// (not failed) wherever the directory is absent — notably in CI. That asymmetry is deliberate: it is
// a real check locally, where the store exists, and silent rather than wrong where it doesn't.
const MEMORY_DIR = join(
  process.env.HOME || "",
  ".claude/projects/-Applications-Claude-Code-Diors-Builds/memory"
);

/* ------------------------------------------------------------------ */

const cmpVer = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const parseVer = (v) => v.replace(/^v/, "").split(".").map(Number);

const checks = [];
const check = (id, severity, title, run) => checks.push({ id, severity, title, run });

/* ---------------------------- readme-map ---------------------------- */
check(
  "readme-map",
  "ERROR",
  "docs/README.md maps every tracked file under docs/",
  () => {
    const readme = read("docs/README.md");
    if (readme === null) return [{ msg: "docs/README.md is missing — the doc map is the front door." }];
    // Coverage unit = the top-level entry under docs/. A directory is covered by naming the directory
    // (README documents reference/ and archive/ as roles, not file-by-file), a loose file by its name.
    const units = new Map(); // unit -> example path
    for (const f of tracked()) {
      if (!f.startsWith("docs/") || f === "docs/README.md") continue;
      const rest = f.slice("docs/".length);
      const slash = rest.indexOf("/");
      const unit = slash === -1 ? rest : rest.slice(0, slash) + "/";
      if (!units.has(unit)) units.set(unit, f);
    }
    const out = [];
    for (const [unit, example] of units) {
      const needle = unit.endsWith("/") ? unit.slice(0, -1) : unit;
      if (!readme.includes(needle)) {
        out.push({
          msg: `docs/${unit} is tracked but never named in docs/README.md (e.g. ${example}). ` +
            `A doc the map doesn't mention is a doc nobody is told to maintain.`,
        });
      }
    }
    // NOTE: the reverse direction (a name the README mentions must exist) is deliberately NOT checked
    // here. The README names most docs by bare filename, and legitimately mentions old names in prose
    // ("renamed from `deferred-items.md`") — a basename matcher cannot tell that apart from staleness,
    // and a check that cries wolf every run is worse than no check. Path-shaped references ARE covered,
    // precisely, by `xref` below.
    return out;
  }
);

/* ------------------------------- xref ------------------------------- */
const liveDocSources = () =>
  tracked().filter(
    (f) =>
      (f === "CLAUDE.md" || f.startsWith(".claude/rules/") || f.startsWith("docs/")) &&
      f.endsWith(".md") &&
      !XREF_SKIP_SOURCES.includes(f) &&
      !XREF_SKIP_PREFIXES.some((p) => f.startsWith(p))
  );

// One batched `git check-ignore` instead of one per candidate. Gitignored paths (utils/emojiMap.dev.json,
// anything under local/) are REAL files that simply aren't tracked — referencing them is correct, and
// treating "not in git" as "does not exist" would flag working documentation.
const ignoredSet = (paths) => {
  if (!paths.length) return new Set();
  try {
    const out = execFileSync("git", ["check-ignore", "--stdin"], {
      cwd: REPO,
      input: paths.join("\n"),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });
    return new Set(out.split("\n").filter(Boolean));
  } catch {
    return new Set(); // exit 1 simply means "nothing matched"
  }
};

check(
  "xref",
  "ERROR",
  "every repo path named in a LIVE doc actually exists",
  () => {
    // Only PATH-shaped tokens (containing a "/"). A bare basename in prose is usually descriptive
    // ("see MEMORY.md", "discord.js's BaseInteraction.js") or historical, and flagging those produced
    // 30+ false positives on the first run. A rename — the thing this check exists to catch — leaves
    // path-shaped references behind, which is exactly what is still covered.
    const hits = [];
    for (const src of liveDocSources()) {
      const text = read(src);
      if (text === null) continue;
      const seen = new Set();
      for (const m of text.matchAll(/`([A-Za-z0-9_][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9_.*-]+)+\.(?:md|js|mjs|json|sh|ya?ml))`/g)) {
        const rel = m[1].trim();
        if (seen.has(rel)) continue;
        seen.add(rel);
        if (rel.includes("node_modules") || rel.includes("*")) continue;
        const bare = rel.replace(/^\.\//, "").replace(/^\.\.\//, "");
        if (existsSync(join(REPO, bare)) || existsSync(join(REPO, dirname(src), rel))) continue;
        hits.push({ src, rel, bare });
      }
    }
    const ignored = ignoredSet(hits.map((h) => h.bare));
    return hits
      .filter((h) => !ignored.has(h.bare))
      .map((h) => ({
        msg: `${h.src} references \`${h.rel}\`, which does not exist. A rename that left a cross-reference ` +
          `behind is the "no half-measures on reorgs" failure — fix the pointer, don't delete the mention.`,
      }));
  }
);

/* ---------------------------- memory-xref --------------------------- */
check(
  "memory-xref",
  "WARN",
  "memory files named in the docs still exist in the memory store",
  () => {
    // This is the check I previously called impossible. Memory does live outside the repo — but the
    // REFERENCES to it live inside, and those are checkable whenever the store is present. It cannot
    // verify that a session RECORDED what it learned (that is a fact about a session, not a tree —
    // see the MEMORY-WRITE hook); it does catch a memory file that was renamed or deleted while the
    // docs kept pointing at it.
    if (!existsSync(MEMORY_DIR)) return []; // CI, or a fresh clone: skip, never fail
    const out = [];
    for (const src of liveDocSources()) {
      const text = read(src);
      if (text === null) continue;
      const seen = new Set();
      // Memory files are snake_case (or MEMORY.md), always referenced by bare filename.
      for (const m of text.matchAll(/`((?:[a-z0-9]+_[a-z0-9_]*|MEMORY)\.md)`/g)) {
        const name = m[1];
        if (seen.has(name)) continue;
        seen.add(name);
        if (existsSync(join(MEMORY_DIR, name))) continue;
        if (existsSync(join(REPO, name))) continue; // an in-repo file that happens to look snake_case
        out.push({ msg: `${src} references memory \`${name}\`, which is not in the memory store.` });
      }
    }
    return out;
  }
);

/* -------------------------- summary-coverage ------------------------ */
check(
  "summary-coverage",
  "ERROR",
  "every CHANGELOG version appears in CHANGELOG-SUMMARY",
  () => {
    const ch = read("docs/CHANGELOG.md");
    const su = read("docs/CHANGELOG-SUMMARY.md");
    if (ch === null || su === null) return [{ msg: "CHANGELOG.md or CHANGELOG-SUMMARY.md is missing." }];
    const versions = [...ch.matchAll(/^## (v\d+\.\d+\.\d+)/gm)].map((m) => m[1]);

    // The SUMMARY deliberately folds ops/docs-only releases into RANGE headings
    // ("## v2.17.0–v2.17.3 — July 13, 2026"), which is the documented convention, not a gap. A literal
    // substring match reported v2.17.1 and v2.11.0 as missing when both were covered by a range — the
    // check was wrong, the records were right. Expand ranges against the changelog's own ordering so
    // no version ordering has to be re-invented here. (En-dash, em-dash and hyphen all appear in use.)
    const covered = new Set(versions.filter((v) => su.includes(v)));
    for (const m of su.matchAll(/^## (v\d+\.\d+\.\d+)\s*[–—-]\s*(v\d+\.\d+\.\d+)/gm)) {
      const a = versions.indexOf(m[1]);
      const b = versions.indexOf(m[2]);
      if (a === -1 || b === -1) continue;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) covered.add(versions[i]);
    }

    return versions
      .filter((v) => !covered.has(v))
      .map((v) => ({
        msg: `${v} has a CHANGELOG entry but no mention in CHANGELOG-SUMMARY.md. The rule is that ` +
          `EVERY version number is represented — ops/docs-only ones as a range or a one-liner, never skipped.`,
      }));
  }
);

/* ----------------------------- hash-chain --------------------------- */
check(
  "hash-chain",
  "ERROR",
  "every changelog entry citing a PR also cites a resolvable commit hash",
  () => {
    const ch = read("docs/CHANGELOG.md");
    if (ch === null) return [];
    const entries = [...ch.matchAll(/^## (v\d+\.\d+\.\d+)[^\n]*?\(#(\d+)([^)]*)\)/gm)].map((m) => ({
      version: m[1],
      pr: m[2],
      tail: m[3],
    }));
    const shallow = isShallow();
    const out = [];
    entries.forEach((e, i) => {
      const hash = (e.tail.match(/`([0-9a-f]{7,40})`/) || [])[1];
      if (!hash) {
        // The NEWEST entry legitimately has no hash: the squash commit doesn't exist until the merge,
        // so it is backfilled additively by the next release. That is the documented design.
        if (i === 0) return;
        out.push({
          msg: `${e.version} cites (#${e.pr}) but carries no commit hash. Only the newest entry may lack one — ` +
            `backfill it additively on the next release branch: (#${e.pr}) -> (#${e.pr} · \`hash\`). Never by --amend.`,
        });
        return;
      }
      if (shallow) return; // the hash is present; whether it resolves is unknowable here
      // `git cat-file -e` prints NOTHING on success, so testing its output is meaningless here —
      // rev-parse is the one that actually reports. (The original two-clause expression worked only
      // by accident; the self-test is what made it worth reading twice.)
      if (git("rev-parse", "--verify", "--quiet", `${hash}^{commit}`).trim() === "") {
        out.push({ msg: `${e.version} cites commit \`${hash}\`, which does not resolve in this repository.` });
      }
    });
    return out;
  }
);

/* ----------------------------- devlog-toc --------------------------- */
check(
  "devlog-toc",
  "ERROR",
  "DEVLOG Part A table of contents mirrors its body headings",
  () => {
    const text = read("docs/DEVLOG.md");
    if (text === null) return [];
    const lines = text.split("\n");
    const heads = lines.filter((l) => /^## 20\d{2}-/.test(l)).map((l) => l.replace(/^## /, "").trim());
    const s = lines.findIndex((l) => l.startsWith("**Part A — The Journey"));
    const e = lines.findIndex((l) => l.startsWith("**Part B — Lessons Ledger"));
    if (s < 0 || e < 0) return []; // markers moved: stay silent rather than cry wolf
    // Dated lines only. The TOC also carries intentional non-dated pointers with no body heading
    // (e.g. "Earlier milestones") which must NOT be reported as extra, and must survive any rebuild.
    const toc = lines.slice(s + 1, e).filter((l) => /^- 20\d{2}-/.test(l)).map((l) => l.slice(2).trim());
    const out = [];
    for (const h of heads) if (!toc.includes(h)) out.push({ msg: `in the DEVLOG body but not the TOC: "${h}"` });
    for (const t of toc) if (!heads.includes(t)) out.push({ msg: `in the DEVLOG TOC but not the body (stale wording or a renamed heading): "${t}"` });
    if (!out.length && heads.join("|") !== toc.join("|")) {
      out.push({ msg: "DEVLOG TOC holds the same entries as the body, but not in the same order." });
    }
    return out;
  }
);

/* ------------------------ devlog-version-cite ----------------------- */
check(
  "devlog-version-cite",
  "WARN",
  "releases since v2.40.0 are findable in the DEVLOG by version number",
  () => {
    const ch = read("docs/CHANGELOG.md");
    const dv = read("docs/DEVLOG.md");
    if (ch === null || dv === null) return [];
    return [...ch.matchAll(/^## (v\d+\.\d+\.\d+)/gm)]
      .map((m) => m[1])
      .filter((v) => cmpVer(parseVer(v), DEVLOG_RULE_FROM) >= 0 && !dv.includes(v))
      .map((v) => ({
        msg: `${v} is not mentioned by number anywhere in DEVLOG.md. Its entry may well exist under a ` +
          `date heading — but the DEVLOG is then un-greppable by release, which is the same searchability ` +
          `problem that retired the TOC's vague "(later)" qualifiers. Cite the version in the entry.`,
      }));
  }
);

/* ---------------------------- notes-sweep --------------------------- */
check(
  "notes-sweep",
  "ERROR",
  "no closed + ℋ-confirmed intake is still sitting in the notes scratchpad",
  () => {
    const text = read("docs/diors-builds notes.md");
    if (text === null) return [];
    const lines = text.split("\n");
    // Working sections only: from the first "## Questions" heading to the "## 📍" pointer section.
    // The 🔑 Legend above it documents the markers using the same syntax and must not be scanned.
    const s = lines.findIndex((l) => /^## Questions/.test(l));
    const e = lines.findIndex((l) => /^## 📍/.test(l));
    if (s < 0) return [];
    const body = lines.slice(s, e < 0 ? lines.length : e);
    return body
      .map((l, i) => ({ l, n: s + i + 1 }))
      .filter(({ l }) => /^- \[x\]/.test(l) && l.includes("ℋ"))
      .map(({ l, n }) => ({
        msg: `notes L${n} is closed AND ℋ-confirmed but has not been swept to docs/archive/graveyard.md: ` +
          `"${l.slice(0, 90).replace(/\s+/g, " ")}…". ℋ is Harkirat's explicit go-ahead to file it out.`,
      }));
  }
);

/* --------------------------- deferred-sweep ------------------------- */
check(
  "deferred-sweep",
  "ERROR",
  "no shipped/resolved item is still listed as deferred work",
  () => {
    const text = read("docs/db-deferred-list.md");
    if (text === null) return [];
    const out = [];
    let section = "";
    text.split("\n").forEach((l, i) => {
      if (/^## /.test(l)) section = l;
      if (!/^- /.test(l)) return;
      // 🚫 Decided-no legitimately records things that were resolved by deciding NOT to do them.
      if (/Decided-no/.test(section)) return;
      if (/\b(SHIPPED|RESOLVED|FIXED|COMPLETED)\b/.test(l)) {
        out.push({
          msg: `db-deferred-list L${i + 1} (${section.trim()}) is marked done but is still in the active list: ` +
            `"${l.slice(0, 90).replace(/\s+/g, " ")}…". Closed items move to docs/archive/resolved-list.md.`,
        });
      }
    });
    return out;
  }
);

/* --------------------------- tag-integrity -------------------------- */
check(
  "tag-integrity",
  "ERROR",
  "each release tag points at a commit whose package.json matches it",
  () => {
    const tags = git("tag", "--list", "v*").split("\n").filter(Boolean);
    if (isShallow()) {
      return [{
        severity: "WARN",
        msg: `shallow clone — only ${tags.length} tag(s) visible, so tag integrity was NOT verified. ` +
          `Re-run in a full clone (CI uses fetch-depth: 0). Reporting this instead of a silent pass.`,
      }];
    }
    const out = [];
    for (const tag of tags) {
      if (KNOWN_BAD_TAGS.has(tag)) continue;
      if (!/^v\d+\.\d+\.\d+$/.test(tag) || cmpVer(parseVer(tag), TAG_RULE_FROM) < 0) continue;
      const pkg = git("show", `${tag}:package.json`);
      if (!pkg) continue;
      let version;
      try {
        version = JSON.parse(pkg).version;
      } catch {
        continue;
      }
      if (`v${version}` !== tag) {
        out.push({
          msg: `tag ${tag} points at a commit whose package.json reads ${version}. ` +
            `\`git show ${tag}:package.json\` is then a liar. Most likely the merge never landed and the ` +
            `tag went on the PREVIOUS release commit.`,
        });
      }
    }
    return out;
  }
);

/* ------------------------ archive-conservation ---------------------- */
/* --diff only: this is a fact about a CHANGE, not about the tree. */
const conservation = (base) => {
  const pairs = [
    { active: "docs/diors-builds notes.md", archive: "docs/archive/graveyard.md", verb: "swept" },
    { active: "docs/db-deferred-list.md", archive: "docs/archive/resolved-list.md", verb: "resolved" },
  ];
  const out = [];
  for (const { active, archive, verb } of pairs) {
    const diff = git("diff", "--unified=0", `${base}...HEAD`, "--", active);
    if (!diff) continue;
    const removed = diff
      .split("\n")
      .filter((l) => l.startsWith("-") && !l.startsWith("---"))
      .map((l) => l.slice(1).trim())
      .filter((l) => l.length > 40); // ignore whitespace/rewrap churn; real items are long
    if (!removed.length) continue;
    const archiveDiff = git("diff", "--unified=0", `${base}...HEAD`, "--", archive);
    const added = archiveDiff
      .split("\n")
      .filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
    if (added === 0) {
      out.push({
        msg: `this branch removes ${removed.length} substantive line(s) from ${active} but adds NOTHING to ` +
          `${archive}. An item leaves an active list only by being ${verb} into its archive — otherwise ` +
          `the tidy-up silently DELETED it. First removed line: "${removed[0].slice(0, 90)}…"`,
      });
    }
  }
  return out;
};

/* ------------------------------ runner ------------------------------ */

const argv = process.argv.slice(2);
const arg = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1];
};
const only = arg("--only");
const base = arg("--diff");
const asJson = argv.includes("--json");

const results = [];
for (const c of checks) {
  if (only && c.id !== only) continue;
  let findings;
  try {
    findings = c.run() || [];
  } catch (err) {
    // A crashing check must be loud. A silent pass is the failure mode this whole file exists to stop.
    findings = [{ msg: `check crashed: ${err && err.message}` }];
  }
  for (const f of findings) results.push({ id: c.id, severity: c.severity, title: c.title, ...f });
}
if (base && (!only || only === "archive-conservation")) {
  for (const f of conservation(base)) {
    results.push({ id: "archive-conservation", severity: "ERROR", title: "items leave an active list only via its archive", ...f });
  }
}

const errors = results.filter((r) => r.severity === "ERROR");
const warns = results.filter((r) => r.severity === "WARN");

if (asJson) {
  console.log(JSON.stringify({ errors: errors.length, warnings: warns.length, results }, null, 2));
} else if (!results.length) {
  const scope = only ? `check "${only}"` : `${checks.length} checks`;
  console.log(`docs-audit: ${scope} passed.`);
} else {
  const render = (list, label) => {
    if (!list.length) return;
    console.log(`\n${label} (${list.length})`);
    let last = "";
    for (const r of list) {
      if (r.id !== last) {
        console.log(`\n  [${r.id}] ${r.title}`);
        last = r.id;
      }
      console.log(`    - ${r.msg}`);
    }
  };
  render(errors, "❌ ERRORS — these fail CI");
  render(warns, "⚠️  WARNINGS — advisory, never blocking");
  console.log();
}

process.exit(errors.length ? 1 : 0);
