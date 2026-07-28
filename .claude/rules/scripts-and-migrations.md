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
but can't read them back, and paying ~40s of API calls for empty counters would slow every deploy. Both
paths print an explicit `NOT LIVE` banner rather than a bare `0`. If you touch this script, test **both**
hosts; the on-VM path was quietly half-broken from 2026-07-18 until this rewrite.

⚠️ **It targets bash 3.2** (stock macOS `/bin/bash`, and the only bash on Harkirat's Mac). No
`declare -A`, no `${var^^}`, no `mapfile` — and `bash -n` does **not** catch these, they fail at runtime.

*General rules: a migration/backfill script should be safe to re-run (clear/upsert, not blind insert).
Never log a raw Cloudinary error object from a script — plaintext secrets; see
`.claude/rules/loadout-images-and-metadata.md`.*
