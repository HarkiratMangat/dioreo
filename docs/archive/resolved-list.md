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

- ~~`[P1 · S · Opus5-H · 🧩needs-design]` **Resolve the "1 commit + 1 tag per merge" promise vs. the
  2-commit reality.** Added 2026-07-25 16:20 EDT. `docs/superpowers/specs/2026-07-24-git-branch-pr-workflow-design.md`
  §10 states "Squash merge; one commit + one tag per version on `main`," but every merge since the workflow
  launched (`904dec8`→`acc1d8d` for v2.33.0, `8c44f97`→`e5c93d8` for v2.33.1, `6a64e37`→`4b91218` for
  v2.33.2 — verified via `git log`) has actually produced 2 commits: the squash-merge, then a follow-up
  "finalize changelog/DEVLOG with the real hash" commit. Root cause: the changelog convention cites the
  squash commit's own hash inline, but a commit can't contain its own hash, and `gh pr merge --squash`
  merges straight to GitHub's remote — there's no local staging step to fold the two together. Harkirat's
  ask (2026-07-25 16:20 EDT): keep doing the 2-commit pattern for now (don't change process ad hoc), but
  give this to a dedicated Opus session with room to actually reason about a better design (e.g. dropping
  the inline hash citation, a different finalize mechanism, or accepting/documenting the 2-commit reality)
  rather than deciding it inline.~~
  → **RESOLVED 2026-07-27 21:27 EDT, shipped as v2.36.0.** The dedicated session happened. Two findings
  reframed it: it was never "spec vs. reality" but **one self-contradictory clause inside the spec** (§3
  already described a working 1-commit design; only §5's *"finalized at merge — real number +
  squash-commit hash + tag"* blocked it), and the existing tags were verified to be on the **correct**
  commit (`v2.35.15`→`a5563df` has `package.json` `2.35.15`; its parent squash has `2.35.14`), so "tag
  the squash commit" could only be restored *together with* moving the bump onto the branch.
  **Chosen design — lagged-backfill citation:** the entry cites `(#PR)` at branch time and the hash is
  inserted **one release later**, on the next release's branch, where it rides into that release's own
  squash commit. The hash therefore never costs a commit of its own, and the `chore(release): finalize …`
  commit is retired. The backfill is additive-only, never an `--amend`, never a force-push.
  Rejected (recorded in spec §10 so they aren't re-proposed): local `merge --squash` + `--amend` (circular
  — amending changes the hash again), a `(pending)` placeholder amended on `main` (needs a force-push —
  what caused the 2026-07-27 VM divergence), `git notes` (invisible, not pushed by default), dropping the
  citation (loses the only pointer `v3-pre-release` has, since it has no tags until `v3.0.0`), and
  accepting the 2-commit reality (retires a promise for a solvable problem).
  Full story: spec §3/§5/§10, `docs/README.md` step 8, memory `project_git_workflow`, DEVLOG v2.36.0.

- ~~[Diors Builds] Delete the suspended Render service~~ → **DONE 2026-07-27 20:20 EDT.** REST `DELETE`
  on `srv-d850b2og4nts73fhpfog` returned `204`; a follow-up `GET` returned `404 not found`, so it is
  confirmed gone rather than assumed. The P0 trigger ("~2026-07-24, once the GCP VM has proven reliable
  for ~a week") was satisfied 10 days after the 2026-07-17 cutover, and the health precondition was
  actually checked first rather than taken on the calendar's word: VM `RUNNING`, `diors-bot` active with
  **0 restarts**, ~11h uptime, RAM 564/969MB, load 0.10, disk 15%, and `journalctl -p err` over the
  previous hour returning no entries. **The GCP VM is now the only host — there is no fallback.**
  Follow-up filed: `RENDER_API_KEY` is now a dead credential and wants revoking.
  *Noted in passing:* `scripts/vmstatus.sh` reported `errors(1h): 1` while the journal showed no
  error-priority entries — its counter reads a different source and shouldn't be trusted alone as a
  health signal.

- ~~[Diors Builds] GCP VM git history diverged from `origin/main`~~ → **DONE 2026-07-27 20:15 EDT.**
  Caused by the 2026-07-27 08:29 EDT force-push landing after the VM had already pulled the pre-rewrite
  commits, leaving the VM 2 ahead / 16 behind. The 2 VM-only commits (`f1dff2c`, `42f024e`) were exactly
  the v2.36.0→v2.35.4 pair the rewrite erased, so nothing was lost. Fixed with
  `git fetch origin && git reset --hard origin/main` in `~/diors-builds`; the VM's working tree was clean
  beforehand, so there was nothing local to preserve. **The service was deliberately NOT restarted** —
  that would be a deploy — so the VM's files are now at v2.35.13 while the running process stays on
  v2.35.4's code until the next restart, the normal post-pull/pre-restart state. Verified after: HEAD
  `771ea76`, no ahead/behind, and `ActiveEnterTimestamp` unchanged at `12:22:05 UTC`. The only runtime
  delta the reset introduced is v2.35.9's Cloudinary dev guard, which is inert in prod.

- ~~[Diors Builds] Single-instance guard (startup lock)~~ → **SHIPPED 2026-07-26 18:43 EDT (v2.35.0,
  `3b978a5`, PR #9)**. Token-scoped Mongo heartbeat lock (`models/BotInstance.js` +
  `utils/instanceLock.js`, 10s heartbeat / 30s staleness); `index.js` calls `acquireInstanceLock()`
  before `client.login()` and `process.exit(1)`s if another instance of the same `BOT_TOKEN` is already
  alive. Lock `_id` is a hash of the token, not a global singleton, so the dev bot and the VM's prod
  instance coexist on separate tokens. Boot-tested against the dev bot: clean single boot, second
  instance on the same token refused and exits 1, `SIGINT` releases the lock and a fresh boot succeeds,
  prod VM unaffected throughout (`scripts/vmstatus.sh`). Killing stray local instances by hand before a
  push is no longer strictly required, though still harmless. Merged, **not yet deployed** — the VM is
  still on v2.33.0's code.
- ~~[Diors Builds] Re-sync the GitHub Projects board~~ → **DONE 2026-07-26 11:29 EDT (same session that caught it)**.
  The board's 15 draft items were re-synced against the 2026-07-25 21:43 EDT deferred-list restructure:
  `Opus4.8-H` → `Opus5-H` on the "View Colors" and "Real search + multi-select" cards' Model suggestion
  field, and every item body's `deferred-items.md` source citation updated to `db-deferred-list.md`.
  Also caught 2 stale `Opus4.8-H` tags the restructure's own model-tag refresh had missed in
  `docs/ROADMAP.md` (View Colors line 64, `index.js` split line 309) and fixed those too. Board:
  https://github.com/users/HarkiratMangat/projects/2.
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
