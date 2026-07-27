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
- `deploy.sh`, `vmstatus.sh`, `vmpeaks.sh`, `devCommands.js` → `docs/reference/deployment-and-ops.md` + memory `reference_vm_bot_commands`

*General rules: a migration/backfill script should be safe to re-run (clear/upsert, not blind insert).
Never log a raw Cloudinary error object from a script — plaintext secrets; see
`.claude/rules/loadout-images-and-metadata.md`.*
