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
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
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

// CHANGELOG-SUMMARY range headings ("## v2.17.0–v2.17.3") are RETIRED. Every release from v2.19.0
// onward has its own heading — verified 2026-07-28 22:10 EDT: the 7 surviving ranges are all
// v2.18.3-and-older. Ranges are therefore accepted as LEGACY ONLY. A range covering a modern version
// is itself a finding, because silently accepting it would re-legitimise a convention Harkirat
// retired. (The first pass got this wrong in the other direction: it accepted ranges everywhere.)
const SUMMARY_RANGE_LEGACY_BEFORE = [2, 19, 0];

// The notes-file confirmation mark is SWITCHABLE from MarkEdit's "Confirmation Mark" menu — the file's
// own Legend and its L121 note both spell out the live shortlist. Matching only "ℋ" (the first pass)
// meant an item confirmed with ✴︎, ✦ or ◆ would never be seen as confirmed and would sit unswept
// forever, silently. Any new symbol added to that menu must be added here in the same change.
const CONFIRM_MARKS = ["✴︎", "✦", "◆", "ℋ"];

// v3 pre-release format (docs/superpowers/specs/2026-07-27-v3-development-structure-design.md §110-118):
// changelog entries are titled "Pre-Release v3.MAJOR.MINOR", package.json carries a matching "-pre"
// suffix, CHANGELOG-SUMMARY is NOT written during pre-release, and NO tags are minted until v3.0.0.
// CI runs this audit on v3-pre-release PRs, so every check must either understand that shape or be
// blind to it -- a false CI failure on the v3 branch would be a gap created by the gap-closing work.

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

/**
 * A check that can't find its structural anchor MUST say so, never return "clean".
 *
 * Demonstrated on the real tree 2026-07-28 22:40 EDT: renaming `**Part A — The Journey` and
 * `## Questions/Notes for Claude` made `devlog-toc` and `notes-sweep` both print **"passed"** while
 * doing nothing at all. Two of the checks written to stop silently-dead guards were themselves
 * silently disabled by a heading rename — the same class as `usage-guard.mjs` dying at line 2.
 *
 * The original comment ("markers moved: stay silent rather than cry wolf") had it exactly backwards.
 * Crying wolf is recoverable; a green tick over a check that isn't running is not.
 */
const anchorMissing = (file, anchor, consequence) => [{
  msg: `${file} no longer contains ${anchor}, so this check DID NOT RUN. ${consequence} ` +
    `Either restore the anchor or update scripts/docs-audit.mjs in the same change — a renamed ` +
    `heading must never silently disable a gate.`,
}];

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
    return hits.map((h) =>
      ignored.has(h.bare)
        ? {
            // Gitignored-and-absent is genuinely ambiguous: it may be a dev-only file that simply
            // isn't present (utils/emojiMap.dev.json), or a plain wrong path. Skipping it entirely --
            // the first pass -- MASKED a real bug: CLAUDE.md and the notes file both pointed at
            // `local/Harkirats-Space.md` while the file had moved to `docs/`, and the `local/` ignore
            // rule hid it. Warn instead of skipping, so ambiguity is visible rather than invisible.
            severity: "WARN",
            msg: `${h.src} references \`${h.rel}\`, which is gitignored AND not present. That is either ` +
              `a dev-only file that just isn't here, or a stale path — the ignore rule makes the two ` +
              `indistinguishable, so confirm which.`,
          }
        : {
            msg: `${h.src} references \`${h.rel}\`, which does not exist. A rename that left a cross-reference ` +
              `behind is the "no half-measures on reorgs" failure — fix the pointer, don't delete the mention.`,
          }
    );
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

    // A version is covered by its OWN heading, or -- for legacy releases only -- by a range heading.
    // Ranges are retired (see SUMMARY_RANGE_LEGACY_BEFORE); expand them against the changelog's own
    // ordering so no version ordering has to be re-invented here. En-dash, em-dash and hyphen all
    // appear in use. Note `su.includes(v)` is deliberately a substring test, so a version named in a
    // range endpoint or in prose also counts as present.
    // An INDIVIDUAL heading is "## vX.Y.Z" NOT followed by a range dash. Distinguishing this from a
    // plain substring test matters more than it looks: in "## v2.32.0–v2.33.0" BOTH versions occur as
    // substrings, so a substring test scored both as having their own heading and the range became
    // completely invisible. The self-test caught exactly that, on a two-version range.
    const own = new Set([...su.matchAll(/^## (v\d+\.\d+\.\d+)(?!\s*[–—-]\s*v)/gm)].map((m) => m[1]));
    const viaRange = new Map(); // version -> the range heading covering it
    for (const m of su.matchAll(/^## (v\d+\.\d+\.\d+)\s*[–—-]\s*(v\d+\.\d+\.\d+)/gm)) {
      const a = versions.indexOf(m[1]);
      const b = versions.indexOf(m[2]);
      if (a === -1 || b === -1) continue;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) viaRange.set(versions[i], m[0]);
    }
    // Anywhere else in the file — a prose line, a folded note. Weaker than a heading but still a mention.
    const mentioned = new Set(versions.filter((v) => su.includes(v)));

    const out = [];
    for (const v of versions) {
      if (!own.has(v) && !viaRange.has(v) && !mentioned.has(v)) {
        out.push({
          msg: `${v} has a CHANGELOG entry but no mention at all in CHANGELOG-SUMMARY.md. Every version ` +
            `number is represented — ops/docs-only ones as a one-line note, never skipped.`,
        });
      }
    }
    // A MODERN version leaning on a range heading is its own finding: the convention was retired.
    for (const [v, heading] of viaRange) {
      if (cmpVer(parseVer(v), SUMMARY_RANGE_LEGACY_BEFORE) < 0) continue; // genuinely legacy
      if (own.has(v)) continue;
      out.push({
        msg: `${v} is covered only by the RANGE heading "${heading.trim()}". Range headings are ` +
          `retired — every release from v2.19.0 onward gets its OWN "## ${v} — <date>" heading. ` +
          `Give it one rather than widening the range.`,
      });
    }
    return out;
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
    if (s < 0 || e < 0) {
      return anchorMissing(
        "docs/DEVLOG.md",
        'the "**Part A — The Journey" / "**Part B — Lessons Ledger" markers that bound the table of contents',
        "The TOC is no longer compared against the body at all."
      );
    }
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
  "no closed + confirmed intake is still sitting in the notes scratchpad",
  () => {
    const text = read("docs/diors-builds notes.md");
    if (text === null) return [];
    const lines = text.split("\n");
    // Working sections only: from the first "## Questions" heading to the "## 📍" pointer section.
    // The 🔑 Legend above it documents the markers using the same syntax and must not be scanned.
    const s = lines.findIndex((l) => /^## Questions/.test(l));
    const e = lines.findIndex((l) => /^## 📍/.test(l));
    if (s < 0) {
      return anchorMissing(
        "docs/diors-builds notes.md",
        'a "## Questions..." heading marking the start of the working sections',
        "No intake is being checked for unswept confirmed items. ⚠️ The SessionStart NOTES-FILE hook " +
          "in .claude/settings.json scans between the SAME two anchors and is now silently broken too."
      );
    }
    const body = lines.slice(s, e < 0 ? lines.length : e);
    return body
      .map((l, i) => ({ l, n: s + i + 1 }))
      .filter(({ l }) => /^- \[x\]/.test(l) && CONFIRM_MARKS.some((c) => l.includes(c)))
      .map(({ l, n }) => {
        const mark = CONFIRM_MARKS.find((c) => l.includes(c));
        return {
          msg: `notes L${n} is closed AND confirmed (${mark}) but has not been swept to ` +
            `docs/archive/graveyard.md: "${l.slice(0, 90).replace(/\s+/g, " ")}…". ` +
            `A confirmation mark is Harkirat's explicit go-ahead to file it out.`,
        };
      });
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
      // The real archive vocabulary, counted 2026-07-28 22:10 EDT in docs/archive/resolved-list.md:
      // DONE ×5, SHIPPED ×3, RESOLVED ×2, FIXED ×1, DROPPED ×1. The first pass matched neither DONE
      // nor DROPPED — i.e. it missed the single most common marker in the corpus.
      //
      // Two guards against the obvious false positives, both taken from real text in these files:
      //   - "NOT DONE" / "not yet done" describe REMAINING scope (db-deferred-list.md L214 says
      //     exactly "❌ NOT DONE — the real remaining scope"). Negations must not read as completion.
      //   - the bare word alone is too loose, so a date or a version must follow it closely. Every
      //     genuine marker in the archive does that: "→ **DONE 2026-07-27 20:20 EDT.**",
      //     "— SHIPPED 2026-07-28 15:52 EDT as v2.41.0.", "**FIXED 2026-07-17 (v2.20.0)**".
      if (/\b(NOT|NEVER)\s+(DONE|SHIPPED|RESOLVED|FIXED|COMPLETED)\b/i.test(l)) return;
      if (/\b(SHIPPED|RESOLVED|FIXED|COMPLETED|DONE|DROPPED)\b[^.\n]{0,40}?(20\d{2}-\d{2}-\d{2}|\bv\d+\.\d+)/.test(l)) {
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

/* --------------------------- records-present ------------------------ */
check(
  "records-present",
  "ERROR",
  "every core record file still exists at its documented path",
  () => {
    // Individual checks return quietly when their file is absent, which is right — otherwise deleting
    // one record produces six confusing findings. This check is the ONE loud report, so a missing
    // record can never be mistaken for a clean tree. Paths are hardcoded on purpose: they are exactly
    // what the SessionStart hooks and docs/README.md depend on.
    const required = [
      "docs/README.md",
      "docs/CHANGELOG.md",
      "docs/CHANGELOG-SUMMARY.md",
      "docs/DEVLOG.md",
      "docs/ROADMAP.md",
      "docs/SESSION-START.md",
      "docs/db-deferred-list.md",
      "docs/diors-builds notes.md",
      "docs/archive/graveyard.md",
      "docs/archive/resolved-list.md",
      "CLAUDE.md",
    ];
    return required
      .filter((f) => !existsSync(join(REPO, f)))
      .map((f) => ({
        msg: `${f} is missing. Two SessionStart hooks read docs/SESSION-START.md and the notes file BY ` +
          `PATH, so a move here is a code change — update .claude/settings.json in the same commit.`,
      }));
  }
);

/* --------------------------- secrets-hygiene ------------------------ */
check(
  "secrets-hygiene",
  "ERROR",
  "the .env invariant and the tracked-config invariant both hold",
  () => {
    const out = [];
    // CLAUDE.md's hardest invariant: .env holds live secrets (BOT_TOKEN, MONGODB_URI, CLOUDINARY_URL,
    // GITHUB_TOKEN, ATLAS_CLIENT_SECRET) and must NEVER be un-gitignored, regardless of repo
    // visibility. It was prose-only until now, which meant nothing would notice it being undone.
    const ignored = ignoredSet([".env", ".env.dev"]);
    if (!ignored.has(".env")) {
      out.push({ msg: `.env is NOT gitignored. It carries live secrets and must never be committed — a private repo still gets cloned, and "private now" doesn't undo past exposure. Restore the rule; do not commit the file.` });
    }
    for (const f of [".env", ".env.dev"]) {
      if (git("ls-files", "--", f).trim()) {
        out.push({ msg: `${f} is TRACKED IN GIT. Secrets must not enter history under any circumstance. Rotate every credential in it, then remove it from the index.` });
      }
    }
    // The mirror invariant: the enforcement layer must stay recoverable from a fresh clone.
    for (const f of [".claude/settings.json", ".claude/settings.local.json"]) {
      if (!git("ls-files", "--", f).trim()) {
        out.push({ msg: `${f} is NOT tracked. It was deliberately un-ignored 2026-07-28 13:10 EDT so the hooks survive a fresh clone; untracked, the enforcement layer becomes unrecoverable again. NOTE the global ~/.config/git/ignore matches settings.local.json in every repo, so this needs the explicit "!" negation in .gitignore.` });
      }
    }
    return out;
  }
);

/* ------------------------------ ci-wiring --------------------------- */
check(
  "ci-wiring",
  "ERROR",
  "CI still runs this audit, on every branch that needs it",
  () => {
    const ci = read(".github/workflows/ci.yml");
    if (ci === null) return [{ msg: ".github/workflows/ci.yml is missing — the audit has no CI gate, so it only ever runs inside a Claude session." }];
    const out = [];
    // Self-defence: without this, deleting the CI step silently reduces the audit to a local nicety
    // and nothing reports it. The check that guards a gate must guard its own wiring.
    // (?!:) is load-bearing: `\b` matches between "audit" and ":", so /npm run docs:audit\b/ is also
    // satisfied by `npm run docs:audit:test`. Deleting the real audit step left the check silent, and
    // the self-test caught it. Two commands sharing a prefix need an explicit negative lookahead.
    if (!/npm run docs:audit(?!:)/.test(ci)) out.push({ msg: "ci.yml no longer runs `npm run docs:audit` — the documentation gate is not enforced on PRs." });
    if (!/npm run docs:audit:test/.test(ci)) out.push({ msg: "ci.yml no longer runs `npm run docs:audit:test` — an audit whose checks have quietly died would pass everything, indistinguishable from a clean tree." });
    if (!/fetch-depth:\s*0/.test(ci)) out.push({ msg: "ci.yml checkout lost `fetch-depth: 0`. Measured: a depth-1 clone yields 42 false hash-chain errors and sees 1 tag instead of 100+." });
    // The v3 spec calls this failure out explicitly: with `main` alone, no v3 work runs CI at all, and
    // a repo with no runs looks exactly like a repo whose runs all pass.
    const triggers = [...ci.matchAll(/branches:\s*\[([^\]]*)\]/g)].map((m) => m[1]);
    if (triggers.length && !triggers.every((t) => t.includes("v3-pre-release"))) {
      out.push({ msg: "a CI trigger branch list omits `v3-pre-release`. Every v3 feature PR targets that branch, so it would run no CI at all — and the failure is silent." });
    }
    return out;
  }
);

/* ----------------------------- rule-globs --------------------------- */
check(
  "rule-globs",
  "ERROR",
  "every .claude/rules glob still matches a real file",
  () => {
    // A path-scoped rule loads ONLY when you open a matching file. If a glob matches nothing — because
    // the code it described was renamed or deleted — the rule silently never loads again, and the
    // subsystem's "why" notes quietly stop reaching anyone. Same dead-guard shape, applied to docs.
    const files = tracked();
    const toRe = (g) =>
      new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, " ").replace(/\*/g, "[^/]*").replace(/ /g, ".*") + "$");
    const out = [];
    for (const rule of files.filter((f) => f.startsWith(".claude/rules/") && f.endsWith(".md"))) {
      const text = read(rule);
      if (text === null) continue;
      const fm = text.split("---")[1] || "";
      const inline = (fm.match(/paths:\s*\[([^\]]+)\]/) || [])[1];
      const listed = [...fm.matchAll(/^\s*-\s*(\S+)\s*$/gm)].map((m) => m[1]);
      const globs = (inline ? inline.split(",") : listed).map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
      if (!globs.length) {
        out.push({ msg: `${rule} declares no \`paths:\` globs, so it never auto-loads for any file.` });
        continue;
      }
      for (const g of globs) {
        let re;
        try {
          re = toRe(g);
        } catch {
          continue;
        }
        if (!files.some((f) => re.test(f))) {
          out.push({ msg: `${rule} scopes to \`${g}\`, which matches no tracked file — that rule will never load again.` });
        }
      }
    }
    return out;
  }
);

/* --------------------------- memory-index --------------------------- */
check(
  "memory-index",
  "WARN",
  "MEMORY.md indexes every memory file, and every index link resolves",
  () => {
    // Skipped where the store is absent (CI, fresh clone) — see MEMORY_DIR. Locally it is a real
    // check: MEMORY.md is what gets loaded into context each session, so a memory file missing from
    // it is a memory that effectively does not exist, and a dangling link is a pointer into nothing.
    if (!existsSync(MEMORY_DIR)) return [];
    const idxPath = join(MEMORY_DIR, "MEMORY.md");
    if (!existsSync(idxPath)) {
      return [{ msg: `the memory store has no MEMORY.md index — CLAUDE.md's canonical-memory-path sanity test treats that as being at the WRONG PATH.` }];
    }
    const idx = readFileSync(idxPath, "utf8");
    const linked = new Set([...idx.matchAll(/\]\(([^)]+\.md)\)/g)].map((m) => m[1]));
    const out = [];
    for (const f of readdirSync(MEMORY_DIR)) {
      if (!f.endsWith(".md") || f === "MEMORY.md" || f.startsWith("_")) continue;
      if (!linked.has(f)) out.push({ msg: `memory/${f} exists but has no pointer line in MEMORY.md — it will not be surfaced at session start.` });
    }
    for (const l of linked) {
      if (!existsSync(join(MEMORY_DIR, l))) out.push({ msg: `MEMORY.md links to ${l}, which no longer exists in the store.` });
    }
    return out;
  }
);

/* -------------------------- nested-worktree ------------------------- */
check(
  "nested-worktree",
  "WARN",
  "no git worktree lives inside the repo working tree",
  () => {
    // Found 2026-07-28 22:45 EDT: a live worktree at .claude/worktrees/co-authored-commits-f280b2
    // holding an OLD copy of CLAUDE.md. It is excluded via .git/info/exclude, so it is invisible to a
    // normal search — but CLAUDE.md itself instructs searching with `--hidden --no-ignore`, which
    // surfaces the stale duplicate and can send a session editing the wrong file. Advisory, because
    // removing someone else's worktree is destructive and is Harkirat's call, not the audit's.
    // --porcelain, NOT the human format. This repo lives at "/Applications/Claude Code/Diors-Builds"
    // — the path contains a SPACE — so `line.split(" ")[0]` yields "/Applications/Claude" and every
    // comparison below silently fails. That is exactly how this check shipped dead in its first
    // version, and the self-test could not catch it because fixtures were built in a space-free
    // tmpdir. Fixtures now deliberately contain a space.
    // realpath BOTH sides. git reports fully-resolved paths, but REPO may still contain a symlink --
    // on macOS every temp dir does (/var -> /private/var), so an unresolved comparison silently matched
    // nothing and this check reported clean against a fixture that literally had a nested worktree.
    let base;
    try { base = realpathSync(REPO); } catch { base = REPO; }
    return git("worktree", "list", "--porcelain")
      .split("\n")
      .filter((l) => l.startsWith("worktree "))
      .map((l) => l.slice("worktree ".length).trim())
      .filter((p) => p !== base && p.startsWith(base + "/"))
      .map((p) => ({
        msg: `a git worktree is nested inside this repo at ${p.slice(REPO.length + 1)}. It holds a ` +
          `second copy of tracked files (CLAUDE.md, .gitignore, docs/) that an \`rg --hidden ` +
          `--no-ignore\` sweep will surface as if it were live. Remove it with \`git worktree remove\` ` +
          `once its branch is merged, or move it outside the repo.`,
      }));
  }
);

/* ---------------------------- version-sync -------------------------- */
check(
  "version-sync",
  "ERROR",
  "package.json matches the newest changelog entry",
  () => {
    const ch = read("docs/CHANGELOG.md");
    const pkgRaw = read("package.json");
    if (ch === null || pkgRaw === null) return [];
    let pkg;
    try {
      pkg = JSON.parse(pkgRaw).version;
    } catch {
      return [{ msg: "package.json is not valid JSON." }];
    }

    // Whichever heading style appears FIRST is the newest entry. During v3 pre-release the changelog
    // uses "## Pre-Release v3.1.0" and package.json carries "3.1.0-pre"; on main it is "## v2.42.0"
    // and a bare "2.42.0". Both are valid, and conflating them would fail CI on every v3 PR.
    const normal = ch.match(/^## (v\d+\.\d+\.\d+)/m);
    const pre = ch.match(/^## Pre-Release (v\d+\.\d+\.\d+)/m);
    const firstIdx = (m) => (m ? ch.indexOf(m[0]) : Infinity);
    const isPre = firstIdx(pre) < firstIdx(normal);
    const newest = isPre ? pre && pre[1] : normal && normal[1];
    if (!newest) return [];

    const expected = isPre ? `${newest.slice(1)}-pre` : newest.slice(1);
    if (pkg !== expected) {
      return [{
        msg: `package.json reads "${pkg}" but the newest changelog entry is ${isPre ? "Pre-Release " : ""}` +
          `${newest}, so it should read "${expected}". One version per merged PR — a bump without an ` +
          `entry (or an entry without a bump) is how the 16 two-commit releases v2.33.0–v2.35.15 happened.`,
      }];
    }
    return [];
  }
);

/* ---------------------------- tag-coverage -------------------------- */
check(
  "tag-coverage",
  "ERROR",
  "every released version has a git tag",
  () => {
    const ch = read("docs/CHANGELOG.md");
    if (ch === null) return [];
    if (isShallow()) {
      return [{ severity: "WARN", msg: "shallow clone — tag coverage was NOT verified (no tags fetched)." }];
    }
    // Pre-Release entries are deliberately excluded: no tags are minted until v3.0.0 ships.
    const versions = [...ch.matchAll(/^## (v\d+\.\d+\.\d+)/gm)].map((m) => m[1]);
    const tags = new Set(git("tag", "--list", "v*").split("\n").filter(Boolean));
    // The newest entry is legitimately untagged between writing the entry and merging: the tag goes
    // on the squash commit, which does not exist yet. Everything older must be tagged.
    return versions
      .slice(1)
      .filter((v) => !tags.has(v))
      .map((v) => ({
        msg: `${v} has a changelog entry but NO git tag. Only the newest entry may be untagged ` +
          `(its squash commit does not exist until the merge). Tag it, or the release is unreachable ` +
          `by \`git show ${v}\`.`,
      }));
  }
);

/* --------------------------- hook-integrity ------------------------- */
check(
  "hook-integrity",
  "ERROR",
  "every hook script referenced in .claude/settings.json exists and is executable",
  () => {
    const raw = read(".claude/settings.json");
    if (raw === null) return [];
    let settings;
    try {
      settings = JSON.parse(raw);
    } catch (e) {
      // A malformed settings.json disables EVERY hook at once, silently. That is the single
      // highest-blast-radius failure in the enforcement layer, so it is an error in its own right.
      return [{ msg: `.claude/settings.json is not valid JSON (${e.message}) — this disables every hook at once.` }];
    }
    const out = [];
    const blob = JSON.stringify(settings.hooks || {});
    const seen = new Set();
    // Anchored on ".claude/hooks/" itself rather than a greedy prefix. The greedy version was
    // `[^"' ]*\.claude\/hooks\/...`, which stops at a SPACE — and this repo's path has one, so it was
    // matching "Code/Diors-Builds/.claude/hooks/x.sh" and only worked because of the slice below.
    // Correct by accident is one refactor away from correct by nothing.
    for (const m of blob.matchAll(/\.claude\/hooks\/[A-Za-z0-9_.-]+\.(?:sh|mjs|js)/g)) {
      const rel = m[0];
      if (seen.has(rel)) continue;
      seen.add(rel);
      const abs = join(REPO, rel);
      if (!existsSync(abs)) {
        out.push({ msg: `.claude/settings.json registers ${rel}, which DOES NOT EXIST — that hook silently never runs.` });
        continue;
      }
      if (!(statSync(abs).mode & 0o111)) {
        out.push({ msg: `${rel} is registered as a hook but is NOT executable — it will fail silently at the moment it should fire.` });
      }
    }
    // Also: a hook delegating to this audit with a check id that doesn't exist is a dead gate.
    const ids = new Set(checks.map((c) => c.id));
    for (const m of blob.matchAll(/--only\s+([a-z-]+)/g)) {
      if (!ids.has(m[1])) {
        out.push({ msg: `a hook calls docs-audit with --only ${m[1]}, which is not a known check id — that gate is dead.` });
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
    const addedLines = archiveDiff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));

    if (!addedLines.length) {
      out.push({
        msg: `this branch removes ${removed.length} substantive line(s) from ${active} but adds NOTHING to ` +
          `${archive}. An item leaves an active list only by being ${verb} into its archive — otherwise ` +
          `the tidy-up silently DELETED it. First removed line: "${removed[0].slice(0, 90)}…"`,
      });
      continue;
    }

    // "The archive grew at all" is far too weak — removing ten items and adding one line would pass.
    // So trace each removed item into the archive by CONTENT. Compared on a normalised word stream,
    // because a swept item is routinely rewrapped, re-bulleted, struck through, or given a mark, and
    // an exact string match would report every genuine sweep as a deletion.
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const haystack = norm(addedLines.join(" "));
    const traceable = (line) => {
      const words = norm(line).split(" ").filter((w) => w.length > 2);
      if (words.length < 6) return true; // too short to fingerprint; don't guess
      for (let i = 0; i + 6 <= words.length; i++) {
        if (haystack.includes(words.slice(i, i + 6).join(" "))) return true;
      }
      return false;
    };
    const orphans = removed.filter((l) => !traceable(l));
    if (orphans.length === removed.length) {
      out.push({
        msg: `this branch removes ${removed.length} item(s) from ${active} and DOES add to ${archive}, ` +
          `but none of the removed text can be traced into it. That is a deletion wearing a sweep's ` +
          `clothes. First untraceable: "${orphans[0].slice(0, 90)}…"`,
      });
    } else if (orphans.length) {
      out.push({
        severity: "WARN",
        msg: `${orphans.length} of ${removed.length} line(s) removed from ${active} could not be traced ` +
          `into ${archive}. Rewording during a sweep is normal, so this is advisory — but confirm each ` +
          `one landed. First: "${orphans[0].slice(0, 90)}…"`,
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

if (argv.includes("--list")) {
  for (const c of checks) console.log(`${c.severity.padEnd(5)} ${c.id.padEnd(22)} ${c.title}`);
  console.log(`\n${checks.length} checks (+ archive-conservation, which needs --diff <base>).`);
  process.exit(0);
}

// A typo'd --only used to print `check "devlog-tocs" passed` and exit 0 — so a single wrong character
// in a hook registration silently disabled that gate while still reporting success. That is precisely
// the dead-guard failure this audit exists to prevent, reproduced inside the audit itself. Exit 2 to
// distinguish "the tool was misused" from "the tree has findings" (exit 1).
const KNOWN_IDS = new Set([...checks.map((c) => c.id), "archive-conservation"]);
if (only && !KNOWN_IDS.has(only)) {
  console.error(`docs-audit: unknown check "${only}".\nKnown checks:\n  ${[...KNOWN_IDS].sort().join("\n  ")}`);
  process.exit(2);
}
if (only === "archive-conservation" && !base) {
  console.error(`docs-audit: --only archive-conservation requires --diff <base-ref>.`);
  process.exit(2);
}

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
