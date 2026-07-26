# ✅ Resolved list — closed items from the Dior's Builds deferred list

**Archive. Not active content. Do not read this file by default.**

Where entries from **`docs/db-deferred-list.md`** come to rest once they ship, get dropped, or turn out
not to be real. Created **2026-07-25 21:43 EDT** (Harkirat's ask) so the active deferred list holds only
live work — a resolved item's value is "don't re-litigate this," which is worth keeping but not worth
loading on every read.

## The rules
- An item moves here the moment it's **shipped / dropped / proven-not-an-issue**, in the same pass that
  closes it. Never delete — always move.
- Keep the original wording and add the outcome: **what happened, when (`YYYY-MM-DD HH:MM TZ`), and
  where the full story lives** (version, commit, DEVLOG entry, memory file).
- Newest at the top of each section.
- **Not for standing "decided-no" calls that could get re-raised** — those stay visible in
  `db-deferred-list.md`'s own 🚫 Decided-no section, precisely so nobody re-opens them.

## Its sibling in this folder
`docs/archive/graveyard.md` — the same idea for **`docs/diors-builds notes.md`**: resolved and
ℋ-confirmed intake is swept there. Two archives, deliberately separate, so it stays obvious which
active file a given dead item came out of.

---

## Shipped / fixed

- ~~[Diors Builds] Webhook alerting — heavier half~~ → **SHIPPED + DEPLOYED 2026-07-20/21 (v2.26.0,
  `477d37c`); store verified live in production** (boot alert wrote `Jul21-01`). Persistent Mongo alert
  store (`models/AlertLog` + atomic `models/AlertCounter`, `utils/alertStore.js`) with short `MMMDD-NN`
  UTC ids, an independent-fire-and-forget write that can't block the Discord POST, 30d/1000 retention;
  the admin-only **`/alerts`** command (recent list + Export Log `.txt` + "What alerts mean?" explainer).
  All 3 folded-in specifics done: escalating uptime (`formatUptime`), "Reconnecting to Discord" reword,
  and manual-vs-auto restart labeling via `scripts/deploy.sh` + a `.restart-reason` marker. `/status` was
  un-bundled and stays deferred. Verified offline against live Mongo; live Discord test pending. Full
  detail: `docs/reference/deployment-and-ops.md`.
- ~~[Diors Builds] `/manage` Edit-loadout bug (didn't-respond-in-time)~~ → **FIXED 2026-07-17 (v2.20.0)**.
  The `mng_editbtn_` button handler was misplaced in the `isModalSubmit()` block → dead code → no ACK →
  timeout; broke Edit for ALL entities (draws/calendar/MP/DMZ). Moved to `isButton()`; verified offline
  against live Mongo (125 loadouts, 0 throws). Full story: DEVLOG 2026-07-17 + `feedback_verify_fix_actually_works`.
- ~~[Diors Builds] Ops Agent install + RAM peaks~~ → **DONE 2026-07-17 (v2.20.0)**. Agent v2.70.0 installed;
  had to `gcloud services enable` the Monitoring + Logging APIs (both were off, silently blocking all agent
  metrics). `scripts/vmpeaks.sh` now reports RAM peaks. See `project_deployment_migration_render_to_gcp`.
- ~~[Diors Builds] Daily "still healthy" heartbeat alert~~ → **DONE 2026-07-17 (v2.20.0)**. Info-level,
  non-pinging, 24h, uptime/servers/latency/memory in `utils/alertWebhook.js` via `index.js`.
- ~~Diors Builds hosting kept dropping the Discord gateway on Render's free tier~~ → **migrated to a GCP
  Compute Engine VM 2026-07-17 (v2.19.0)**; connects in seconds and holds. Render suspended — deleting the
  suspended service is still an open 🔔 Reminder in `db-deferred-list.md`. Full story:
  `project_deployment_migration_render_to_gcp` memory + DEVLOG.

## Dropped / replaced

- ~~[Diors Builds] `/secondary` rename + `/pistols` alias~~ → **DROPPED, replaced 2026-07-18 (v2.21.0).**
  `/secondaries` stays exactly as-is; built a category-level search-synonym feature instead
  (`utils/search.js`'s `resolveCategorySynonym`) so typing "pistol" surfaces every Secondaries weapon
  directly — no second command needed (Discord has no real alias mechanism anyway). See
  `.claude/rules/loadouts.md`.

## Not a real issue

- ~~[Diors Builds] "Tundra" weapon name~~ → **NON-ISSUE, confirmed 2026-07-18.** Connected to the live
  MongoDB cluster and checked directly — already correctly stored as `LW3-TUNDRA` (weaponKey
  `lw3-tundra`). The bare "Tundra" spelling only ever existed in `scripts/applyBadgesBulk.js`'s fuzzy
  match list, not the real data. No fix needed.
