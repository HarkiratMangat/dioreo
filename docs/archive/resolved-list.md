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

- **🌿 `fix/legal-site-nav-and-mobile-sheet` — VERIFIED SUPERSEDED AND DELETED 2026-08-02 18:29 EDT.**
  *Filed and closed the same session; the filing is what forced the verification.*
  The branch (`704994b`, PR [#61](https://github.com/HarkiratMangat/Diors-Builds/pull/61),
  **closed-unmerged**) was still on `origin`. A session handoff had asserted it deleted — only the
  **local** ref was gone, and `git branch -a` renders remote-only branches indistinguishably.
  **`git ls-remote --heads origin` is the check that does not lie.**
  **Why it needed proving rather than sweeping:** the standing rule is *a merged branch must never
  outlive its PR*, and this was the **opposite** case — closed, not merged, so the branch was the only
  copy of 19 commits. Deleting on the strength of a rule that does not cover the case would have been
  destruction, not tidying.
  **How it was verified** (Harkirat's belief that PR #62 had absorbed it turned out correct): for
  every source document, each line the branch ADDED relative to the merge base `a4b17d6` was searched
  for in `main`. All present, with exactly two exceptions — `**Effective date:** 31 July 2026` in
  TERMS and PRIVACY, where `main` reads **1 August 2026**, i.e. superseded rather than lost. Its
  DEVLOG entry is on `main`, and `SECURITY.md`, the `/install` and `/security` redirects all match
  byte-for-byte. `public/` was excluded deliberately: it is build output, so a diff there proves
  nothing about content.
  **Remote heads now:** `main` and `v3-pre-release` only.

- **🎭 "Contributors' emptiness" (open question 1 of the warm-pages redesign) — ANSWERED
  2026-08-02 18:22 EDT by the reference research, not by a decision.** *Was carried in
  `db-deferred-list.md` as: "There is genuinely one name, so the plate is mostly bare and the dashed
  'unengraved' row currently reads as a rendering bug rather than as reserved space. Two honest
  routes: shrink the plate…, or make the reserved slot unmistakably deliberate."*
  *The block it sat in was headed "**Three open questions, deliberately carried here rather than
  answered:**" — that header is now reworded in place to "the three ORIGINAL open questions, kept for
  the record", because only this one closed; 2 and 3 remain open there.*
  **Both routes are retired.** The nine-site crawl (`local/site-redesign/reference-research.md`)
  found the problem solved structurally at ensambles.eu/creditos: **cut the roster into many small
  NAMED sections**, so no section is ever expected to be full and a single name never reads as a gap.
  That is a better answer than either sizing tweak because it removes the premise — emptiness stops
  being a property of the page. Questions 2 (lane colours) and 3 (the Contributors accent) stay open
  in `db-deferred-list.md`, but apply **only if** the abandoned Interchange/Plate mockup is revived;
  the live open decision is now the constellation-vs-gradient-bands fork, filed there.

- **🔒 Three enforcement hooks that fired too late to prevent anything — FIXED 2026-08-02 17:24 EDT
  (v2.50.0).** *Filed and closed in the same session; the filing is what made the class visible.*
  Measured: PreToolUse had 7 hooks, all `Bash`/`Artifact`, **none on `Edit|Write`**, so nothing could
  prevent a bad write. (1) `timestamp-check.sh` was PostToolUse when the content sits in
  `tool_input.new_string` at PreToolUse → now runs at both, `pre` denying an impossible stamp.
  (2) `main-push-guard.sh` guarded `git push` while the real violation is the commit → new
  `branch-discipline-guard.sh` denies editing a *tracked* file, or committing, on `main`/`master`.
  (3) The SQUASH-TRAILER GATE was `"ask"` → now `"deny"`; as an ask it was clicked past on three
  consecutive merges, including the three that shipped the hook work itself. **The class to sweep
  for:** the check exists, its diagnosis is correct, and it fires where nothing can still be
  prevented. `c6cd875` (#67) had fixed exactly one instance and the sweep was never done. Full
  record: CHANGELOG v2.50.0, DEVLOG 2026-08-02 17:14 EDT, memory `reference_enforcement_hooks`.

- **🧪 Six hook self-tests that nothing ever ran — WIRED 2026-08-02 17:24 EDT (v2.50.0).** Each
  `*.test.sh` was referenced by `package.json`, `.github/workflows/` and `.claude/settings.json` a
  combined **zero** times; `scripts/calendarDedup.test.js` was likewise reachable only via an
  `npm test` CI never called. Harkirat: *"they dont even seem to hold despite their 'tests'."* The
  tests were correct — nothing executed them. `npm run test:hooks` → `npm test` → CI, with coverage
  computed from the scripts on disk so deleting a test fails the suite. Writing the eight missing
  tests exposed **two gates that had never worked**: `main-push-guard` passed `rtk git push` (the
  documented normal spelling, and it is the only hook that can block), and `records-close-check`
  used `find -newermt "@epoch"`, which BSD find cannot parse — it errored into `/dev/null` and the
  check fired on every PR regardless. 17 suites, 0 untested hooks.

- **🧠 Linksee memory fragmentation — REPAIRED 2026-08-02 14:43 EDT (data migration, outside the repo).**
  *Was filed the same session as `[P2 · M]` ⛓️ "blocked on tooling", which was **wrong** — the block was
  never tested. Disproving it took four tool calls.* Linksee had misfiled ~29% of this project's
  memories under fake path-derived entities: `Application` (66, the **entire licensing session** that
  produced `LICENSE`/`NOTICE`/`TERMS.md`/`PRIVACY.md`), `Containers` (31, incl. an edit to
  `.claude/settings.local.json`), `CleanShot` (41), `Application Support` (25), plus three
  name-variant fragments. Entity-scoped recall missed all of them, silently.
  **Fix:** `memories.entity_id` is a plain FK and the `caveat` "protection" is application-layer only
  (`trg_protect_caveat` is `AFTER INSERT`, sets `protected=1`, blocks no SQL). After a `.backup`, one
  transaction re-homed everything provably tied to the repo path and dropped the emptied entities
  behind a `NOT EXISTS` guard. **`Diors-Builds` 450 → 573 (+123); total rows 696 before and after —
  nothing lost; `integrity_check` ok.** Entity `dior` (a real separate project) untouched.
  **Also corrected in the same pass:** linksee v0.11.x **removed** `list_entities`, `recall_file`,
  `update_memory` and `consolidate` (the server answers them with a migration hint; consolidate now
  auto-runs at startup) while the bundled SKILL.md still taught all four — verified against package
  source 0.11.5, so it is an upstream doc bug, not an install problem. The local skill was fixed and
  its Japanese stripped (the frontmatter loads every session). And the **global
  `usage-guard.mjs` hook was injecting a stale "codebase-index is PYTHON-ONLY" claim into every large
  Read**, routing sessions away from a graph tool that does index this JS repo.
  **The lesson is filed as its own case** in `feedback_not_checkable_is_usually_unexamined`: "blocked"
  is the same failure as "not checkable" — a deferral with a priority tag and a blocker reason *looks
  like diligence*, which is exactly why it escapes scrutiny.
  Root cause (path-derived entity naming) remains open as a `[P3 · S]` item; the recall-by-query
  defence is in force.

- **🧠 MEMORY.md index scaling — SHIPPED 2026-08-02 14:30 EDT, branch `docs/memory-index-scaling-design`
  (not yet merged/tagged).**
  *Was `[P2 · M]`, filed 2026-08-02 13:40 EDT as "consolidation pass 2" and completed the same session,
  so it never sat queued.* `MEMORY.md` is the only auto-loaded memory file, so the index is charged per
  FILE; an emergency compaction had already spent the line-length lever (23.1KB → 12.9KB). Delivered:
  the `memory/archive/` tier with retirement criteria · a canonical `feedback_verify_before_claiming`
  merging five verification memories · `project_git_workflow` and `feedback_token_conscious_tool_routing`
  absorbing three more as cases · a `SessionStart` guard (`memory-index-check.sh`) enforcing a 16,000B
  budget and a three-partition conservation rule, with all 11 failure modes proven by its own test suite.
  **Two corrections landed with it:** native memory auto-load is CONFIRMED (no hook loads `MEMORY.md`,
  yet it is in context), and the assumed "24.4KB hard read limit" **does not reproduce** — a 33,530-byte
  memory file reads in full.
  **The finding worth keeping:** applying the earning rule honestly, the store turned out **far less
  redundant than the design assumed** — `project_context_token_budget`,
  `feedback_not_checkable_is_usually_unexamined`, and `feedback_docs_at_push_time` all earned their
  files and were correctly NOT merged. Consolidation is therefore close to exhausted as a lever, and the
  **growth governor (a new lesson defaults to a CASE, not a file) is what actually holds the line.** Do
  not re-raise "merge more memories" as a size fix without testing candidates against that rule first.
  See `docs/superpowers/specs/2026-08-02-memory-index-scaling-design.md` and the memory
  `project_memory_index_scaling`.

- **⚔️ Patch notes "Additional Info" auto-formatting — SHIPPED 2026-07-31 17:20 EDT, on branch
  `feat/calendar-sections-and-v2-fixes` (not yet merged/tagged).**
  *Was `[P2 · S]`, filed 2026-07-31 16:41 EDT from notes L182's ∴ follow-up reply (2026-07-31 11:39
  EDT).* Harkirat's decided structure, from his own reference screenshot (`local/Screenshots/
  CleanShot 2026-07-31 at 11.38.34@2x.png`): `### Additional Changes` heading, `__**Weapon**__` per
  weapon, its attachments as plain lines, each change as `> b:/n: details`. `commands/patchnotes.js`'s
  new `formatAdditionalInfo()` — OPT-IN via a `# Weapon Name` line marker so every pre-existing
  free-typed entry (most are a one-line blurb) keeps rendering exactly as before; the structured
  heading only appears once the admin actually starts a line with `#`. Handles a weapon with
  multiple attachment lines and an attachment with multiple change lines, per the filed requirement.
  Verified against 5 cases via a dry-run script: the exact screenshot structure, plain prose with no
  `#` marker (unchanged, alias-only), multiple attachments/multiple changes per attachment, a preamble
  line before the first `#` marker (kept, not discarded), and empty input.
- **🗂️ Bulk-import format helper/template — SHIPPED (scoped-down) 2026-07-31 17:20 EDT, on branch
  `feat/calendar-sections-and-v2-fixes` (not yet merged/tagged).**
  *Was `[P2 · M]`, filed 2026-07-31 12:10 EDT from notes L189.* Harkirat's own uncertainty ("idk")
  flagged 2 options — a static help-text improvement, or a full raw-text → bulk-format AI converter.
  Scoped to the former: a "Guide" button on Draws/Calendar/Loadouts' bulk sections in `/manage`
  (`commands/manage.js`'s `BULK_FORMAT_GUIDES`, real syntax pulled straight from each parser in
  `utils/adminParser.js`, not hand-guessed) replies ephemeral with the exact syntax + a worked
  example + a pointer to that page's own Export button for a live example against real data. Chosen
  over the AI-converter option as the well-scoped MVP — verified char counts stay well under
  Discord's 2000-char message cap (727-907 chars per guide). **If this doesn't fully solve the
  "forget the format" problem, the raw-text→bulk-format AI converter is still the bigger option on
  the table** — ask Harkirat whether the static guide is enough before considering this fully closed.
- **🖼️ `/calendar` banner image — ONE PER PAGE — SHIPPED 2026-07-31 17:20 EDT, on branch
  `feat/calendar-sections-and-v2-fixes` (not yet merged/tagged).**
  *Was `[P2 · M]`, filed 2026-07-31 12:10 EDT from notes L184, spec refined 2026-07-31 16:41 EDT.*
  Separate banners for the Draws/Events/Playlists pages, each independently settable via
  `/manage`'s Calendar → "Banners" action (one modal, 3 clearable fields). Blank = shows nothing
  for that page. Re-hosted through the new `utils/calendarBannerCache.js`, its own Cloudinary
  folder (`calendar_banners/draws|events|playlists`), overwrite-in-place per page — no age-based
  pruning needed since only 3 possible assets exist, and clearing a field does a real Cloudinary
  delete rather than orphaning the asset. Rendered as a Media Gallery (type 12) at the VERY TOP of
  the container, above even the title (Harkirat's explicit placement call — reads as a true
  cover/hero image rather than a mid-card illustration). `SeasonalData` gained `drawsBannerUrl`/
  `eventsBannerUrl`/`playlistsBannerUrl` + the matching `draft.*` trio (schema-only forward compat
  for now — no staging UI exists yet to actually set a draft banner, but Promote-to-Live already
  copies them across if one's ever set directly). Verified via a dry-run script against the dev DB:
  banner renders as the first component when set, is absent (not a placeholder) when blank,
  disappears immediately on clear, and stays well under Discord's 40-component cap (20/16/16 across
  the 3 pages with a banner set).
- **📟 `scripts/vmstatus.sh logs` overhaul — SHIPPED 2026-07-28 15:52 EDT as v2.41.0.**
  *Was `[P2 · M · Sonnet5-H]`, filed 2026-07-28 01:41 EDT from notes L120.* Original ask: per-line
  date/time + running commit hash, retention 1,000 → ~3,000, default 25 → 40 lines, m/h/d time-window
  args including `<newer>-<older>` ranges, a "more lines available" notice, a richer/stylized standalone
  panel, and an expanded error tracker. **All delivered except one item that turned out not to exist**,
  and the investigation found a defect larger than the whole filed scope:
  - **The error counter was broken at the source, not in the display.** It grepped log-line *text* for
    `error|…|reconnecting`, counting routine gateway reconnects as errors (measured: reported 2, both
    were reconnects). `journalctl -p err` was no better — the bot logged everything to stdout so journald
    tagged **every** line priority 6 (24h: p0–p5 = 0, p6 = 30), meaning `-p err` would have read 0 during
    a crash. Fixed at the source by the new `utils/logger.js`.
  - **The retention bump was a misunderstanding — nothing to raise.** The "1,000 cap" is the AlertLog
    *Mongo* store (`alertStore.js` `HARD_CAP`). journald had **no** retention config and held every line
    since install (620 lines / 35.7MB / since 2026-07-17, ~56 lines/day). Pinned to `MaxRetentionSec=30d`
    + `SystemMaxUse=200M` instead, so the assumed 30-day window is enforced rather than incidental.
    Disk headroom question answered: 4.0G/30G (13%), never the constraint.
  - **The Google Cloud Ops Agent was already installed and running** (~127MB RSS) shipping unparsed
    syslog nobody queried — so the Cloud Logging option carved out of the 2026-07-24 Firestore review
    was already paid for. Now wired to a structured JSON sink carrying severity + version + commit per
    entry (`scripts/ops-agent-config.yaml`, `scripts/logrotate-diors-bot`).
  - **Also answered the long-standing "RAM 536/969MB looks high" worry:** the bot is ~121MB; the agents
    are most of the remainder. The panel now breaks RAM out so it can't misread again.
  Full story: `docs/superpowers/specs/2026-07-28-vmstatus-overhaul-design.md`, CHANGELOG v2.41.0, and
  the DEVLOG entry for 2026-07-28. **Sentry was deliberately NOT built** — re-filed in
  `db-deferred-list.md` as `[P3 · S]` with the reason its case is now weaker.

- **🔑 Two dead host credentials removed from `.env` — RESOLVED 2026-07-28 11:20 EDT.**
  *Found during the memory-migration audit, entirely unrelated to what was being swept — a reminder that
  a focused sweep is a good way to surface unrelated rot.* `.env` still held **`RENDER_API_KEY`** and
  **`RAILWAY_TOKEN`** for hosts long gone (Render's service deleted 2026-07-27 20:20 EDT, Railway
  abandoned 2026-07-17; the GCP VM is the only host). **No code read either** — zero `.js`/`.sh`/`.yml`
  references.
  **The point worth keeping:** Harkirat first commented the lines out rather than deleting them, which is
  a reasonable instinct for "might need this later" — but **commenting out a credential does not revoke
  it.** The string stays valid at the provider, and an API key generally authenticates against the whole
  *account*, not the single deleted service, so it can still create and bill resources. He then revoked
  both at Render and Railway directly, and only after that were the lines deleted. **Revoke first, then
  delete — deleting alone would have left live keys floating with no record they existed.**
  `PORT` was also commented out and deliberately kept: not a secret, read by nothing (`process.env.PORT`
  appears nowhere, and there is no HTTP server or web framework in the dependency tree) — it was a
  Render/Railway artifact, since those platforms require a bound port for web services.
  `.env` was gitignored throughout and the keys were never committed, so there was no git-history
  exposure to clean up.

- ~~`[P2 · S · Sonnet5-M]` **Decide what to do about 6 tags whose `package.json` is one release stale.**~~
  Resolved 2026-07-27 23:23 EDT (Claude, Harkirat's call: "go with option 1, I'd rather have that consistency
  taken care of right now"). `v2.33.3`, `v2.33.4`, `v2.35.0`, `v2.35.1`, `v2.35.2`, `v2.35.3` force-moved
  from their squash commit to their corresponding `chore(release)/docs: finalize …` commit via
  `git tag -f` + `git push --force origin <tag>`. Verified before and after: each of the 6 finalize
  commits' `package.json` exactly matched its tag version pre-move, and `git show vX.Y.Z:package.json`
  now reports the correct version for all 6, same as every other tag. No redeploy needed (nothing at
  runtime reads a tag's `package.json`) and no one else references these tags (solo repo). See
  `docs/reference/deployment-and-ops.md` § Version tagging for the corrected tag list.

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

- ~~"Contributing/Contributors redesign: direction chosen and mockup approved — this is a build, not
  an exploration"~~ → **RETIRED 2026-08-02 23:14 EDT.** That framing was true when filed
  (2026-08-02 01:10 EDT) and is now false twice over. The approved artefact was
  `local/site-redesign/mockup-v1.html` — the Interchange/Plate concept — and a nine-site reference
  crawl superseded it outright, after which Harkirat released both pages from the legal set's design
  language entirely; mockup-v1 became a fallback nobody chose. Then the redesign itself was **parked**
  (*"needs heavy designing and discussion work"*), so it is neither approved-as-built nor in flight.
  **The live site never changed** — everything stayed in gitignored `local/`.
  What survives, on the active item in `docs/db-deferred-list.md`: the structural fork IS answered
  (constellation on desktop, full-width stack on mobile), and it is marked **read-when-asked** so it
  stops being raised unprompted. *This also corrects the line in the section above, which still said
  the redesign was "its own scheduled session with an approved mockup" — it is neither now.*

## Not a real issue

- ~~[Diors Builds] "Tundra" weapon name~~ → **NON-ISSUE, confirmed 2026-07-18.** Connected to the live
  MongoDB cluster and checked directly — already correctly stored as `LW3-TUNDRA` (weaponKey
  `lw3-tundra`). The bare "Tundra" spelling only ever existed in `scripts/applyBadgesBulk.js`'s fuzzy
  match list, not the real data. No fix needed.

## The legal site's unenumerated bug list — CLOSED 2026-08-02 00:40 EDT (v2.47.0)

Filed 2026-07-30 00:35 EDT as `[P1 · M · Opus5-H]` with the warning that **the specific bug list did
not exist yet** — Harkirat had reviewed the live site, found "many bugs", and gone to sleep before
enumerating them. The item's own first instruction was "ask him what he actually saw".

**He did enumerate them**, across two page-by-page passes on 2026-08-01, and they were worked through
in the same session. Closing the parts that are genuinely done:

- **The list arrived.** The premise of the item — an unknown list — no longer holds.
- **The unreviewed design changes** (four-tab switcher, moon/sun toggle, invite cards, larger wordmark)
  were all reviewed by him directly, and each was either accepted or replaced. The toggle in particular
  he called "perfect now".
- **Desktop measurement is no longer terms-only.** This session measured `license`, `privacy`,
  `contributors`, `devlog` and the landing page — nav staging at six widths across two tab counts,
  sticky headings through a real scroll, footer geometry at the scrolled-to-bottom position.
- **The warm pages' aesthetic review happened** and produced a decision rather than a fix: Harkirat
  asked for a full redesign of Contributing and Contributors. That is now its own scheduled session
  with an approved mockup, not an open bug.

**What did NOT close, and stays on the active list:** the two Cloudflare deployments that published
zero files (cause still unexplained), and light mode at desktop width, which was never checked in
either session. Both carried forward.
