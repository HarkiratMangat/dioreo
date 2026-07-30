---
paths:
  - "scripts/**"
---

# Scripts & migrations — where each is documented

*Loads when you touch `scripts/**`. There is no single "scripts" chapter — each script is documented in
the subsystem rule it belongs to:*

- `migrateBuildsToMongo.js`, `applyBadgesBulk.js`, `createPlaceholderLoadouts.js` → `.claude/rules/loadouts.md`
- `backfillLoadoutMetadata.js`, `backfillPatchMetadata.js`, `createCloudinaryMetadataFields.js` → `.claude/rules/loadout-images-and-metadata.md`
- `backfillLoadoutSlots.js`, `test-vertex-extract.js` → `.claude/rules/autobuild.md`
- `deploy.sh`, `vmstatus.sh`, `vmpeaks.sh`, `devCommands.js`, `ops-agent-config.yaml`, `logrotate-diors-bot`
  → `docs/reference/deployment-and-ops.md` + memory `reference_vm_bot_commands`
- `buildLegalPages.js` → CLAUDE.md's **`public/` — the built legal site** section (renders
  `docs/legal/*.md` → `public/legal/*.html` for Cloudflare Pages). Not a migration: a **generator**,
  and the only script here whose output is committed. It deliberately hand-rolls its Markdown parsing
  rather than adding a dependency — `NOTICE` §3 commits to a copyleft-free tree that gets re-audited on
  every dependency change, and a formatter for two files is not worth a new supply-chain entry. If you
  touch it, re-run `node scripts/buildLegalPages.js` and require **100%** from its self-verifier.

  ⚠️ **The CSS lives inside JS template literals**, so a **backtick in a stylesheet comment** terminates
  the string and fails the build with a SyntaxError pointing at CSS. It happened twice, 2026-07-29 22:00 EDT.
  Run `node --check scripts/buildLegalPages.js` before a full run. Related trap: a `//` comment
  containing `/*` (a glob like the model-file path) reads as an unclosed block comment to naive tooling.

  ⚠️ **`parseBlocks()` strips HTML comments, and that is load-bearing** (added 2026-07-29 22:17 EDT).
  `CONTRIBUTORS.md` keeps its "format for new entries" template inside a comment, complete with a worked
  example row. Without the strip the comment rendered as visible content and the live credits page
  listed a **fabricated contributor** (`@example`) as though it were real.

  ⚠️ **It has THREE independent gates and passing one proves nothing about the others** (learned the hard
  way 2026-07-29 18:55 EDT, v2.43.1; third added 2026-07-29 22:17 EDT). `verify()` checks that every
  multi-word run of source survived into the HTML; `linkAudit()` resolves every internal href against the
  deploy tree; `structureAudit()` asserts every column-aligned source line landed inside a `<pre>` or a
  heading. **The third exists because NOTICE holds its dependency and trademark tables together with runs
  of spaces — the *alignment* is the structure, and joining those rows into a paragraph destroys the table
  without changing one word**, so the other two stay green on a wrecked document. It was proven to fail
  before being trusted: neutering the column detector produced 24 findings naming the real dependency
  rows. Both documents reported
  **"100% of source content present" while shipping seven dead links** — content presence and link
  resolution are different properties, and only the first had a check. Never read a clean `verify()` as
  "the output is correct."
  - **`PUBLISHED_TARGETS` is the allowlist of what actually gets deployed.** The source Markdown
    cross-references plenty of repo-only files (`CLAUDE.md`, `ROADMAP.md`, `models/UserPreference.js`,
    the rules files); those render as inert `<span class="ref">` text instead of links, because a 404
    inside a legal document is worse than an unlinked mention. **If you start publishing a new file, add
    it here or its references stay inert.** Do NOT "fix" these by pointing at GitHub — the repo can be
    private at any time, which is why the documents carry no repo links at all.
  - `CONTRIBUTING.md` **and `CONTRIBUTORS.md` ARE published now** (2026-07-29 22:17 EDT), as the two
    `EXTRA_PAGES` rendered by `warmShell()`. This reverses the earlier pull, and both original objections
    are answered: `CONTRIBUTORS.md` being published makes that link resolve, the rest degrade to inert
    text, and every page's header now carries a repo link. `linkAudit()` enforces this per build rather
    than trusting the note.
  - `public/_redirects` maps `/` → `/legal/` because the landing page lives in `legal/` and the site root
    would otherwise 404. Cloudflare Pages also serves **extensionless** canonical URLs and 308-redirects
    the `.html` form — so any script checking the live site needs `curl -L`, or it reads zero bytes and
    reports total drift. `dior legal check` in the CLI repo does this correctly; copy from it.

⚠️ **`vmstatus.sh` had a lost `#` for an unknown number of days** (fixed 2026-07-29 18:55 EDT, v2.43.1).
Line 180 was a fragment of its own multi-line comment with the leading `#` missing, so the shell executed
`you wait out the whole probe to be told` as a command and printed `you: command not found` on **every
run**, from the Mac and on the VM. **`bash -n` cannot catch this** — the line is valid syntax, it just
isn't a comment any more, which puts it in the same class as the bash-3.2 constructs noted above. When
editing this script's long comment blocks, re-run it and read the FIRST lines of output, not just the
panel; the error printed above the banner and had been read past as noise more than once.

⚠️ **`vmstatus.sh` runs in TWO places and the difference is load-bearing** (rewritten 2026-07-28 15:34 EDT,
v2.41.0 — design: `docs/superpowers/specs/2026-07-28-vmstatus-overhaul-design.md`). Normally it runs
**from the Mac** and reaches the VM over SSH. But `deploy.sh` runs it **on the VM** as its post-restart
check, so the script detects its own host (`ON_VM`) and reads locally instead of trying to SSH into
itself. On the VM it also **skips the Cloud Logging queries** — the instance service account writes logs
but can't read them back, and paying those API round-trips for empty counters would slow every deploy. Both
paths print an explicit `NOT LIVE` banner rather than a bare `0`. If you touch this script, test **both**
hosts; the on-VM path was quietly half-broken from 2026-07-18 until this rewrite.

⚠️ **It targets bash 3.2** (stock macOS `/bin/bash`, and the only bash on Harkirat's Mac). No
`declare -A`, no `${var^^}`, no `mapfile` — and `bash -n` does **not** catch these, they fail at runtime.

## `docs-audit.mjs` + `docs-audit.test.mjs` — the documentation invariants (added 2026-07-28 21:00 EDT, v2.42.0)
`npm run docs:audit` · `npm run docs:audit:test`. Not a migration — a **checker**, and the only script
here wired into CI (`.github/workflows/ci.yml`) as a merge gate. Run `node scripts/docs-audit.mjs --list`
for the current check roster -- no count is written down here, because a number in prose is a copy of
state that nothing updates (see the `feedback_no_duplicated_state_in_prose` memory; this very file said
"10" within an hour of the roster reaching 19). Two severities:
`ERROR` fails the build, `WARN` reports and never blocks so a hotfix isn't held up by prose.

If you touch it:
- **Add the check AND its self-test in the same change.** `docs-audit.test.mjs` asserts two things per
  check — the broken fixture FAILS *and* valid input stays SILENT. The second half is what catches a
  matcher that fires on everything; skipping it nearly turned two correct `CHANGELOG-SUMMARY.md` range
  headings into a fabricated gap. The self-test found a completely dead check on its first run.
- **Exemptions carry a reason and a date.** `KNOWN_BAD_TAGS`, `TAG_RULE_FROM` (package.json wasn't
  bumped per release before v2.33.0 — verified), `DEVLOG_RULE_FROM`, and the `XREF_SKIP_*` lists all
  exist because an unexplained allowlist silences a real defect forever.
- **It must never report a conclusion it can't support.** It detects a shallow clone and downgrades
  the git-dependent checks to a warning; a depth-1 checkout otherwise yields 42 false `hash-chain`
  errors and sees 1 tag instead of 100+ (measured).
- `DOCS_AUDIT_ROOT` repoints the whole audit at a fixture tree; that's how the self-test works.

**Current state and its honest edges (2026-07-29 02:10 EDT, v2.42.0).** Run
`node scripts/docs-audit.mjs --list` for the live roster — no count is written here, it would rot.
Read the **accounting line** every run prints, not just the verdict: `N/M checks verified (K items
examined)`, plus anything **SKIPPED** and anything that examined **nothing**. A check matching zero
items "passes" while verifying nothing, and that is how a broken matcher survives indefinitely.
A pass means *no known failure mode tripped* — never *the records are correct*.
**What it cannot cover is filed, not forgotten:** see `docs/db-deferred-list.md` → 🧹 Someday /
tech-debt → "the limits it does NOT cover" (content accuracy, novel drift, the web-UI PR path).

**Two gates DELEGATE to this script — and both fail LOUD, never silent.**
`.claude/hooks/devlog-toc-check.sh` and `.claude/hooks/docs-audit-gate.sh` call it rather than keeping
their own copies, so there is one implementation of each rule. The cost of that is a single point of
failure: delete or break `docs-audit.mjs` and a bare `exit 0` would have quietly retired both gates.
So **"the audit could not run" is reported as its own finding** — missing file and invalid-JSON crash
are both handled, and both were tested by actually removing and breaking the script. Deliberately NOT
a duplicated fallback implementation: two copies drift, and the drift is silent too. The independent
prior detection layer still stands beside it — the `gh pr merge` hooks (changelog, DEVLOG, release-doc
check), the `git tag` invariant gate, the Edit/Write TIMESTAMP check and the `Stop` completion-claim
hooks all run without this script and catch different failures.

*General rules: a migration/backfill script should be safe to re-run (clear/upsert, not blind insert).
Never log a raw Cloudinary error object from a script — plaintext secrets; see
`.claude/rules/loadout-images-and-metadata.md`.*
