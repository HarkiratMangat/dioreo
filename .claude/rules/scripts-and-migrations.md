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

*General rules: a migration/backfill script should be safe to re-run (clear/upsert, not blind insert).
Never log a raw Cloudinary error object from a script — plaintext secrets; see
`.claude/rules/loadout-images-and-metadata.md`.*
