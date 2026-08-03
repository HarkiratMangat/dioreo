# Deferred list — Dior's Builds (`db-deferred-list.md`)

**Dior's Builds' own deferred work**: confirmed bugs, time/condition reminders, the maintenance /
tech-debt long-tail, and the handful of features big enough to warrant their own dedicated session.
If a session working *only* in this repo would need to know it, it belongs here.

**History:** split out of the cross-project tracker on **2026-07-25 15:56 EDT** (tracked in-repo, so it
gets real `git diff`/`git log` history like the rest of `docs/`), then **renamed and completed
2026-07-25 21:43 EDT** — that first pass moved only the tech-debt list and left this project's bugs,
reminders, and resolved items sitting in the cross-project file, which defeated the point. This pass
pulled all of them in, added the priority legend, and moved resolved entries out to
`docs/archive/resolved-list.md`. `deferred-items.md` → `db-deferred-list.md`; the cross-project file is
now `/Applications/Claude Code/meta-deferred-list.md`.

## What is NOT in this file
- **The feature roadmap** — `docs/ROADMAP.md` is authoritative (v2 remaining · v3 · v4 · v5 ·
  housekeeping). This file is deliberately NOT a copy of it: pointer, not duplicate.
  **⇄ Reality check 2026-07-27 19:45 EDT:** 7 items were found in BOTH files, so "not a copy" was not
  holding on its own. Each now carries a `⇄` cross-reference to its twin. Division of labour:
  **ROADMAP = which version it belongs to; this file = size, decided design, and when it gets a
  session.** Appearing in both is allowed — appearing in both *without* the `⇄` marker is the bug.
- **Resolved / dropped items** — `docs/archive/resolved-list.md` (except standing 🚫 decided-no calls,
  which stay below on purpose so nobody re-raises them).
- **Cross-project work, MarkEdit-extension bugs, Claude/Anthropic product feedback** —
  `/Applications/Claude Code/meta-deferred-list.md`.
- **Design gaps we're knowingly living with** — `docs/reference/known-issues.md`.

## 🏷️ Priority & effort tags
Every OPEN item carries `[Priority · Effort]` (+ optional flags). Two axes: one for *what to focus on*,
one for *what can be bundled cheaply*. Resolved items don't need one.
- **Priority** (urgency + impact + risk + blocking): **P0** now (broken+user-facing / blocking / due) ·
  **P1** soon (clear value, no reason to wait) · **P2** eventually (real, not pressing) · **P3** someday/parked.
- **Effort** (scope; carries model+effort for real builds): **XS** minutes · **S** part of a session ·
  **M** a session · **L** its own big/multi-session job.
- **Flags:** 🔗 bundle-with:\<what\> · 🧩 needs-design · ⛓️ blocked-by/blocks:\<what\>.
- **Combos:** P0/P1+XS/S = quick win (do now / bundle) · P1+L = schedule its own session · P2+XS/S =
  bundle-only · P3 = ignore till relevant.

Full spec: `reference_priority_tier_system` memory. Canonical copy of this legend:
`/Applications/Claude Code/meta-deferred-list.md`.

**Model tags refreshed 2026-07-25 21:43 EDT:** every `Opus4.8-*` tag was rewritten to the equivalent
`Opus5-*` — the tier mapping is direct and Opus 4.8 is superseded, so the old tags were pointing at a
model Harkirat no longer runs. Effort letters (H/M/L) unchanged.

---

## 🐞 Active Bugs — broken behaviour, not yet fixed
*Moved in from the cross-project tracker's 🐞 section 2026-07-25 21:43 EDT. **Rule:** the moment a bot bug
is reported or found, it lands here with a repro + a `[Priority · Effort]` tag (most start P0); it only
leaves when fixed (→ `docs/archive/resolved-list.md`) or proven not-a-bug. A session that touches a
buggy area checks here FIRST — this section exists because the `/manage` Edit bug once sat buried in a
scratchpad for 2 days.*

- `[P2 · S]` **`timestamp-check.sh` blocks on a ONE-MINUTE future stamp — a false positive, and it
  denies the write.** *Filed 2026-08-03 10:35 EDT, from the morph-PoC session, where it fired for real.*

  The future-stamp branch compares **lexicographically with zero tolerance**:
  `.claude/hooks/timestamp-check.sh:94` does `[ "$d $hm" \> "$now" ] && echo "$d $hm"`, and in `pre`
  mode that becomes `permissionDecision:"deny"` (line 101). So a write carrying `10:33` while the
  clock reads `10:32` is rejected as "invented". It is not invented — the clock is read from a hook
  message at the *start* of a turn and the bytes land a minute or two later, after intervening tool
  calls, model latency and edit round-trips. Sub-few-minute drift is the normal cost of doing the
  work, not evidence of fabrication.

  **Fix:** convert both sides to epoch seconds and allow a grace window (~3 min) instead of comparing
  strings — e.g. `date -j -f '%Y-%m-%d %H:%M'` on macOS — and treat only stamps beyond the window as
  fabricated. **Keep the check.** It caught a real incident (30 fabricated stamps reached docs, memory,
  a released CHANGELOG and a git tag on 2026-08-02), and the failure it guards is expensive; the ask is
  a tolerance, not a removal. ⚠️ A gate that denies on noise is the kind that gets switched off — the
  file already says exactly this about its own bare-date branch at lines 106–108, which is *why* that
  branch may never block. The same reasoning applies here and was not carried across.
  ⚠️ `.claude/hooks/timestamp-check.test.sh` exists and `run-all-tests.sh` enforces coverage, so the
  fix updates the test in the same change — including a case at the window edge, or the tolerance is
  untested.

- `[P2 · XS]` **Mobile header: the GitHub mark sits 3.2px past the left edge of its own button and is
  clipped.** *Found 2026-08-03 11:41 EDT while testing the morph PoC on a phone; measured, not eyeballed.*

  At `≤620px` the site collapses `.ghb` to 38px — a **36px content box** — but its flex line still
  carries the 30px `.ghb-ic` **plus the collapsed label's 14.4px of padding**, totalling **44.4px**.
  With `justify-content:center` the 8.4px of overflow splits evenly, so the mark lands at
  `left: −3.2px` with **11.2px of slack on the right**, and `overflow:hidden` clips it.
  ⚠️ **The trap is that `.ghb-t b` is `opacity:0`** — that hides the label's ink and keeps its box, so
  the element looks gone while still taking part in the flex line. The existing comment in that rule
  warns about a 2px plate/border mismatch causing exactly this symptom, which is a *different* cause
  fixed earlier; this is a second one with the same signature.
  **Fix:** `@media (max-width:620px){ .ghb .ghb-t{display:none} }` — the label carries no information
  at that size (the accessible name is on the link). Verified in the PoC clone: gaps went from
  `−3.2 / 11.2` to `4 / 4 / 4 / 4`. ⚠️ The clone lifts the site's own rules verbatim, so this is a
  real site bug, not a PoC artefact — but it has only been fixed in the PoC's own stylesheet so far.

- `[P1 · S]` 🔗 **Two Cloudflare deployments published ZERO files, and the cause is still unexplained.**
  *Filed 2026-07-30 00:35 EDT; narrowed 2026-08-02 00:40 EDT once the rest of its parent item closed —
  see `docs/archive/resolved-list.md`.*

  `2752b4fd` and `2a85d094` (2026-07-30 ~00:08 EDT) returned 404 for *every* path on their own alias
  URLs, including `/LICENSE`. Production pointed at the newest, so the entire site was down; `/legal/*`
  only looked healthy because Cloudflare was serving cache (`cf-cache-status: HIT`, `age: 6525`). The
  bare domain, being an uncacheable redirect, was the only URL that exposed it — which is how Harkirat
  found it. Redeploying the identical command worked first time and uploaded 9 files + `_redirects`, so
  **the command is not the bug.** Possible: a transient Cloudflare fault, or a deploy racing a rebuild
  of `public/`. ⚠️ **If it recurs, capture wrangler's full stdout/stderr** — the only evidence kept was
  the deployment list, not the failing run's output.
  Related and already handled: edge propagation presents as 404 for up to ~60s after a deploy (measured
  2026-07-30 00:15 EDT), and `dior legal check` now retries on non-200 rather than only on a hash
  mismatch. **Any "the site is down" report within a minute of a deploy should be re-checked before it
  is believed.** See `[[feedback_verify_before_claiming]]`.

- `[P2 · S]` **Light mode has never been checked at desktop width.** *Filed 2026-07-30, still true
  2026-08-02 00:40 EDT.* Every desktop measurement in both sessions was in dark mode. Geometry is
  theme-independent so the layout work holds, but colour, contrast and the glow/wash treatments were
  never looked at above 980px. `contrastAudit()` measures declared token pairs in both themes on every
  build, which is real coverage — but it proves ratios, not whether the page looks right.


*(No open **bot** bugs. The last confirmed one — the `/manage` Edit-loadout timeout — was fixed in
v2.20.0, see `docs/archive/resolved-list.md`. The item above is the published legal **site**, not the bot.)*

*(Two enforcement-layer bugs filed here 2026-08-02 16:19/16:28 EDT — the SQUASH-TRAILER gate stuck on
`"ask"`, and three hooks firing too late to prevent anything — were **fixed the same session** in
v2.50.0 and moved to `docs/archive/resolved-list.md`. Their bundled sibling, `dior pr compose`,
remains OPEN in `/Applications/Claude Code/meta-deferred-list.md`: it belongs to the `dior` CLI repo,
not this one.)*

*(A security-hygiene item — two dead host credentials sitting in `.env` — was found and **fully resolved**
2026-07-28 11:20 EDT. See `docs/archive/resolved-list.md`.)*

*Not bot bugs, so they live in `meta-deferred-list.md` instead: the MarkEdit-extension cluster
(Return-key blank line, confirm-mark space glitch). They're editor tooling outside every repo, even
though the Return-key one only reproduces in this repo's notes file.*

---

## 🔔 Reminders / watch-for
*Time- or condition-based — not "do this now," but things not to forget when the trigger hits. Tagged
with the priority they'll BE at when the trigger fires. Moved in from the cross-project tracker
2026-07-25 21:43 EDT.*

- **⏰ 2026-08-09 17:00 EDT — CLOSE OUT the 7-day MCP observation window** `[P2 · M]` 🧩 needs-design (TS-DEADLINE)
  (opened 2026-08-02 14:43 EDT). `sequential-thinking` is **UNRESTRICTED for the window** to answer a
  question the existing data cannot: is the low usage caused by the rule or by the tool? It has never
  existed unrestricted (**310 pre-rule transcripts, present in 0**), so "used twice" measures the rule.
  **Harkirat asked for a dedicated session for the analysis** — do not analyse it inline.
  **Close-out (all four, in order):**
  1. Re-run the instrument **UNCHANGED** — editing it voids the comparison. **`--to` is EXCLUSIVE, so
     it must be `2026-08-10` to include the final day:**
     `node scripts/mcp-observation-metrics.mjs --from 2026-08-02 --to 2026-08-10 --label treatment --project -Applications-Claude-Code-Diors-Builds`
     (**08-02 COUNTS** — measurement starts the day the window opened. The two sessions that ran
     before 17:00 EDT are excluded by session id, hardcoded in the instrument so no flag is needed.)
  2. Compare only against the **pre-registered** baseline + criteria in
     `docs/superpowers/specs/2026-08-02-mcp-observation-window-protocol.md`. Baseline (Diors-only,
     instrument v2, bucketed by session START): **35 sessions · 18,939 turns · median 276**
     (mean 541.1 is outlier-driven — compare on the MEDIAN) · **290,915 cache reads per turn** ·
     0.014 seq-calls/100 turns · 0.49 memory writes/session · `search_graph` 1 · 18 compactions ·
     models sonnet-5 / opus-5 / opus-4-8.
     ⚠️ **Check the model + effort mix AND the tool profile FIRST.** An Opus-skewed week moves every
     number on its own. And the treatment period is KNOWN in advance to be website/design-heavy while
     the baseline was audit/debug-heavy — design work is precisely sequential-thinking's declared fit
     case, so a high trigger rate shows it fires on DESIGN, not that it is generally useful. A low
     rate even in its best-fit week is the strongest possible evidence the other way.
  3. Read `local/mcp-observation-log.md` for the *why/outcome* of each use — the transcript shows THAT
     it fired, never whether it helped. **Watch for novelty**: a spike of 2–3 thought runs with no
     decision attached is the tool being new, not useful.
  4. Record the verdict **with data** in `~/.claude/CLAUDE.md` + `project_context_token_budget`.
  ⚠️ **The suspension AUTO-EXPIRES** — `.claude/hooks/mcp-layer-check.sh` flips to chasing the
  close-out on 2026-08-10 (boundary tested). So the rule reinstates itself even if this item is
  missed; what would be lost is the *analysis*, not the guardrail.
  **Also under observation:** whether the 2026-08-02 MCP fixes hold — memory writes/session, recall
  usage, `search_graph` adoption, `ctx-execute*` share. If those do not move, the SessionStart routing
  hook failed the same way prose did, which is the more valuable finding.

- `[P0 · XS · read before resuming]` **⚠️ CROSS-SESSION NOTICE — a parallel session was mid-flight on
  hooks + the DEVLOG backfill when v2.41.0 landed. Read this before continuing that work.** Written
  2026-07-28 16:45 EDT. A second Claude Code session (paused on a usage limit) was working on: improving
  the turn-budget hook, edits to other hooks, and **backfilling `docs/DEVLOG.md`**. Meanwhile this session
  merged **v2.41.0 (#47)** and **v2.41.1 (#48)**, which touched overlapping ground. What changed under it:
  - **`.claude/settings.json` gained a PreToolUse/Bash hook** (`stale-reference-sweep`), and there is now
    a **new `.claude/hooks/` directory** — the first tracked hook *script* in this repo; every prior hook
    is an inline command string. If that session also edited `settings.json`, **merge, don't overwrite** —
    check `git log -- .claude/settings.json` before assuming your copy is current.
  - **⚠️ `docs/DEVLOG.md` is the likely conflict.** A new entry was appended ("The error counter that could
    never have been right"), and the **table of contents was rebuilt — it had drifted 15 entries behind
    the body**, so TOC lines for every 2026-07-27 and 2026-07-28 entry were added at once. A backfill
    branch cut before that will conflict in the TOC block. Take *both* sides; the TOC is additive.
  - **New runtime file `utils/logger.js`, and `index.js` now patches `console` at the top** (before the
    crash handlers, deliberately — see `.claude/rules/interaction-router.md`). Any hook or doc that
    assumes `console.error` is Node's is out of date.
  - **Memory files edited:** `reference_vm_bot_commands` (rewritten; it had been documenting the retired
    direct-push deploy flow), `project_deployment_migration_render_to_gcp`, `MEMORY.md`,
    `reference_enforcement_hooks`.
  - ⚠️ **YOUR UNCOMMITTED WORK WAS BRIEFLY LOST AND RESTORED — verify it before continuing.** At
    2026-07-28 16:35 EDT a `git reset --hard HEAD~2` (cleaning up two throwaway commits made to test a
    new hook) also discarded the **unstaged** modification sitting in `.claude/settings.local.json`.
    Recovered 2026-07-28 18:40 EDT from the reflog — the scaffold commit had incidentally captured the
    file — and restored to unstaged-modified, byte-identical to how it was found. The three permission
    entries are back: `Bash(rtk git *)`, a `node -p` package.json version read, and `Bash(gh api *)`.
    **Nothing else of that session's was in the working tree at the time**, but confirm against your own
    notes rather than trusting this line. Consider committing them so they can't be lost again.
  Remove this entry once that session has resumed and reconciled.
- `[P1 · XS · Harkirat action, not a build]` **Finish the GitHub Projects roadmap board's view setup.**
  Added 2026-07-26 12:12 EDT. The board (https://github.com/users/HarkiratMangat/projects/2) has all 15
  items and every custom field (`Status`/`Priority`/`Effort`/`Model suggestion`/`Flags`) populated via the
  API, but GitHub's GraphQL API has NO view-creation/management mutations at all (confirmed via
  introspection) — so it still only has the one default view GitHub creates automatically (`View 1`,
  Table layout). Two manual steps in the GitHub UI finish the design agreed on earlier:
  1. Open the board → click **View 1**'s dropdown (or the view tab itself) → **Edit layout** → change
     layout from **Table** to **Board** → set **Group by: Status** → rename the view (double-click its
     tab, or the "..." menu → Rename) to something like **"Status board."**
  2. Click the **+** next to the view tabs → **New view** → keep layout **Table** → name it **"By
     Priority"** → set **Group by: Priority**.

  Both are a couple minutes total, no data changes, purely view/display config. Nothing else is pending
  on the board itself.
- `[P2 · XS · passive watch]` **Watch that GCP holds long-term.** Cutover was 2026-07-17; the Discord
  alerting + `scripts/vmstatus.sh` are the watch mechanism. The original "staying green through
  ~2026-07-24" checkpoint has passed with no incident recorded in the alert log or DEVLOG — but that's
  absence-of-record, not a positive health check, so confirm live with `scripts/vmstatus.sh` before
  treating it as the green light for the Render deletion above.
- `[P2 · S · admin-only impact, not urgent]` **Live-test the `/manage` loadout UX overhaul (v2.23.0) +
  `/settings` passive idle-timeout (v2.22.0) in real Discord.** Both deployed live to the GCP VM
  2026-07-19 (confirmed via `scripts/vmstatus.sh`), neither behaviorally click-tested by Harkirat yet.
  For loadouts: run through Add/Edit/Bulk Add on `/manage`, confirm the new "How Images Work" info block
  + field placeholders read right, and confirm `checkImageExists()` actually warns on a
  deliberately-wrong Cloudinary key. For settings: open `/settings`, leave it untouched the full 10
  minutes, confirm the buttons go dead with zero clicks. Explicitly deprioritized by Harkirat himself
  (2026-07-19) — admin-only surface, doesn't affect normal user-facing commands. Remove once he's
  actually run through both. **Bundle candidate:** the `/manage` per-slot-metadata fix shipped
  2026-07-24 18:07 EDT is also awaiting one real click-through, so test them in the same sitting.
- `[P2 · passive watch · Claude's own call, not Harkirat's ask]` **Revisit splitting `docs/CHANGELOG.md`
  / `docs/DEVLOG.md` into an active + archive file.** ⚠️ **Both files grow every release, so any figure
  written here is stale on arrival — measure at decision time: `wc -l docs/CHANGELOG.md docs/DEVLOG.md`.**
  For the trend only: ~730 lines each on 2026-07-18, roughly doubled by 2026-07-25, and still climbing
  (both were materially larger again by 2026-07-28 — the numbers previously pinned here had drifted
  ~40-55% low without anyone noticing, which is itself the argument for the split). Bumped P3 → P2
  on that basis; still Claude's own call, not something Harkirat asked for. Harkirat explicitly said
  **not** to add a maintained ToC to these (their `## vX.Y.Z` / `## YYYY-MM-DD` headers are already
  uniform and grep-able, so a ToC would duplicate that for no gain — unlike CLAUDE.md's ToC, which
  earned its keep on non-uniform prose headings); the archive-split is the actual lever. He explicitly
  asked to be reminded of this since it's easy to forget. 🔗 Natural bundle with the `.claude/rules/`
  two-tier rework below — same "split always-on bulk into on-demand detail" shape.

---

## 🗂️ Queued — worth its own dedicated session

- **🌐 Version-control `~/.claude`, then promote the point-of-use guards globally** `[P2 · M]` 🔗bundle
  (filed 2026-08-02 15:36 EDT). Two coupled pieces — **do them in this order**, because editing an
  unversioned global config with no backup is what makes the second half risky.

  **① Make `~/.claude` a LOCAL-ONLY git repo** (Harkirat's call: no GitHub remote).
  ⚠️ **An allowlist `.gitignore` is mandatory, not stylistic.** Measured: the directory is **1,119 MB**
  while the config worth versioning is **236 KB** — a 4,700× difference. A naive `git add .` tries to
  commit 557 MB of session transcripts, 296 MB of `security/` and 181 MB of `plugins/`. Ignore
  everything, then un-ignore: `.gitignore`, `CLAUDE.md`, `RTK.md`, `settings.json`,
  `keybindings.json`, `hooks/**`, `agents/**`, `plans/**`. Deliberately excluded: `projects/`
  (transcripts — huge and private), `security/`, `plugins/`, `context-mode/`, `uploads/`, `cache/`,
  `telemetry/`, `debug/`, `tasks/`, `backups/`, `skills/` (third-party, 5 MB), and
  **`mcp-needs-auth-cache.json`** (auth state).
  ✅ **Verified safe to track: `~/.claude/settings.json` holds NO secrets** — only `theme`, `hooks`,
  `permissions`, `enabledPlugins`, `statusLine` and similar. Checked 2026-08-02 15:36 EDT.
  ✅ **Dry-run already done and reverted.** `git init` + allowlist staged exactly **18 files / 2,802
  lines**, with no transcripts, plugins, cache or auth included. It was reverted rather than left
  half-done, so the next session starts from a clean directory. **Verify the staged set again before
  the first commit — check, then commit, never the reverse.**
  **Why it matters:** every global hook lives there unversioned with no backup. This project already
  learned that lesson once, which is why `.claude/settings.json` was promoted out of gitignored
  `settings.local.json` into tracked git. Promoting more hooks into an unversioned directory walks
  straight back into it.

  **② THEN promote the point-of-use guards from this repo to global.**
  Portability was measured, not assumed: **`rg-flag-guard.sh` has 0 project-specific references**
  (fully generic), while **`mcp-layer-check.sh` has 7** — so that one must be SPLIT, never promoted
  whole. Promote: `rg-flag-guard`, the shellcheck-on-edit hook, `typos-check`, `timestamp-check` and
  the clock injector. Keep local: the memory-index and linksee/fragmentation checks.
  ⚠️ **Take each hook's `.test.sh` with it.** `rg-flag-guard` was the only hook written without tests
  and the only one that regressed — four false-positive classes, three of them patched by observation
  before any test existed.

  **③ The open question to decide there, NOT settled here:** should the global `CLAUDE.md`'s
  **`Available CLI Superpowers`** section move out to an on-demand reference with a one-line pointer?
  Measured: it is **3,441 B of 27,189** (12.7%) — the SMALLEST of the four sections (MCP Servers 9,218,
  Turn Discipline 8,886, Tool Preferences 5,636), so the saving is ~850 tokens/session. **Moving it
  into a HOOK saves nothing** — a SessionStart hook is injected every session too, same pipe, and it
  becomes bash-escaped JSON that is far harder to hand-edit. The only real gain is making it
  **on-demand**, mirroring this repo's own 2026-07-22 CLAUDE.md modularization. Modest win, global
  blast radius, so decide it deliberately rather than in passing.

  **The principle worth carrying in:** what makes a guard work is being **point-of-use**, not being a
  hook. `rg-flag-guard` fires at the moment the wrong flag is typed. A session-start catalogue — which
  is what the CLI ROUTING block in `mcp-layer-check.sh` is — is structurally the same shape as the
  CLAUDE.md prose that failed 788× vs 4×. Do not promote catalogues; promote interventions.

- **🧪 Migrate the hand-rolled hook test suites to `bats`** `[P3 · M]` (filed 2026-08-02 15:25 EDT;
  scope corrected 2026-08-02 18:45 EDT). `bats-core` is installed. ⚠️ **It said "the four suites …
  43 assertions"; there are now SEVENTEEN suites** — v2.50.0 wired the suite into `npm test`/CI and
  wrote the eight that were missing. The count in the original wording was a copy of state that
  nothing updated, exactly what `feedback_no_duplicated_state_in_prose` warns about. They are
  hand-written bash with
  hand-rolled `assert` helpers, and **two of them shipped with real bugs the same day they were
  written**: one grepped a needle that also matches the HEALTHY output line, and one grepped
  `"decision":"block"` while `jq -n` pretty-prints it *with a space*. Both reported PASS while
  verifying nothing. A real framework gives proper assertions, TAP output and per-case isolation, and
  removes the class.
  ⚠️ **Not urgent and NOT a correctness gap today** — all four suites currently pass and were fixed to
  discriminate. This is about the assertion *machinery* being homemade, not the coverage.
  **Direction:** convert ONE suite first and confirm the same failures still get caught before
  touching the rest. ⚠️ Pick the smallest **at the time you start** (`typos-check` is 5 cases today;
  `timestamp-check` was the smallest at 9 and is now the LARGEST at 35) — do not trust a count
  written here, run `rg -c '^\s*a ' .claude/hooks/*.test.sh`. Keep each suite's WHY-comments —
  they carry the incidents the tests exist for, and those are worth more than the assertions.
  ⚠️ **Do not migrate mid-observation-window if it touches `mcp-layer-check`** — that hook is part of
  the running experiment.

- **🧠 Distil the linksee auto-capture queue, and declare a North Star** `[P2 · S]`
  (filed 2026-08-02 14:49 EDT). **19 auto-captured memories are still RAW USER UTTERANCES.**
  ⚠️ `dream()` reports `distill_total: 8` because it **serves a BATCH of up to 8 per call** — the true
  backlog is `SELECT COUNT(*) FROM memories WHERE content LIKE '%needs_distill%'` = **19**. I first
  "corrected" the 19 down to 8 on the strength of one `dream()` call; the batch size is not the total,
  and the session-start banner was right. **Draining it takes ~3 `dream()` calls, not one.**
  **Why it matters — this is the "junk memories" problem, concretely.** The Stop hook captures by
  heuristic with no LLM in the path, so it files raw chat as insight. Live examples: memory **7357**
  is *"lets finalize and merge the open PRs…"* stored as a **`learning`**; **3496** is a task
  instruction stored as a **`caveat`**. A future session recalling "learnings" gets served Harkirat's
  to-do list. **Each raw row also drags ~10 `affects` paths of unrelated files with it**, so it
  pollutes file-history recall too.
  **How:** `dream()` returns the queue; rewrite each via `remember({memory_id, content})` with a
  one-line `what`, a real `why`, and **`"distilled": true`** — that marker is REQUIRED, it is what
  stops the next Stop-hook sync wiping the rewrite and resurrecting the raw utterance
  (`DELETE … WHERE source LIKE '%session_id%' AND distilled != 1`). Drain up to 8 per `dream()` call.
  A row with no real decision in it gets `type: "note", state: "superseded"` — retired in place,
  never deleted.
  **Also:** `north_star` is **null**, which `dream()` flags itself — without one there is no frame for
  triaging proposals. Declare via `declare_anchor(node_type: "north_star")`, but that is **Harkirat's
  call to state**, not mine to invent.
  ⚠️ **Not mechanical — it is a judgement rewrite of his memories**, which is why it is queued for its
  own session rather than tacked onto the end of a long one.

*Real, self-contained builds; spin each up as its own session at the tagged setup. **Read the `[P…]`
tags below for what's urgent** — the 2026-07-18 "all P2, none urgent right now" call has been overtaken
by items added since. (A count used to live here; it went stale the moment an item was added, so the
tags are the source of truth instead — see `feedback_no_duplicated_state_in_prose`.)*

- `[P2 · S · 🔗bundle]` **Bulk-resync `public/changelog/` before those pages go back in the nav.**
  *Filed 2026-08-02 02:45 EDT, at Harkirat's instruction.* The three chronicle pages are withdrawn
  from the nav and reachable by nobody, so **both** the CI freshness gate and the deploy workflow now
  exclude `public/changelog/` — a changelog or devlog edit no longer forces a rebuild+commit of HTML
  no reader is served. The deliberate cost is that those built pages drift behind their sources.
  **Before those pages are linked again: run `npm run site`, commit `public/changelog/`, and remove the
  two exclusions** (one in `.github/workflows/ci.yml`, one in `.github/workflows/deploy-site.yml`) plus
  the `!public/changelog/**` negation in the deploy trigger. `chronicle-drift` (WARN) reports how far
  behind they are in the meantime — it is a meter, not an error. 🔗 Bundles with the chronicle-page
  design work, since that is when they become reachable.

- `[P2 · L · 🧩needs-design · ⛓️blocked-on-design]` **Rebuild Contributing and Contributors as two
  DISTINCT pages.** *Filed 2026-08-02 01:10 EDT.* They currently share `warmShell()`; the decision is
  that they stop sharing it and become their own things, sharing only header, footer and tokens.

  - ⏸️ **PARKED 2026-08-02 23:00 EDT at Harkirat's call. Dropped from P1 to P2.** His words: *"its
    buggy to say the least. needs heavy designing and discussion work. honestly i'm tired of this…
    let's defer this redesign to some other time. just leave the current design as-is on the website
    for now."* **The LIVE SITE IS UNCHANGED and stays that way** — nothing from this exploration
    reached `scripts/buildLegalPages.js`, `public/`, or either source Markdown file. Zero risk of a
    half-applied redesign: every artefact is in gitignored `local/`.
    ⚠️ **Do not restart this from the top.** Two full exploration passes are already paid for. Read
    the settled decisions below before proposing anything, and expect the next session to be about
    *design quality and discussion*, not about choosing a direction — the direction is chosen.
  - ⛔ **DO NOT RESURFACE THIS UNPROMPTED — Harkirat's explicit request, 2026-08-02 23:03 EDT.**
    Do not raise it in a session-opening summary, do not offer to pick it up, do not list it among
    "what's next", and do not treat its P2 tag or its 🧩 flag as a prompt to suggest it. He is tired
    of it and knows exactly where it is. **This item is READ-WHEN-ASKED.** It stays here so that the
    moment he *does* raise it nothing has to be re-derived — that is its only job. The same applies
    to its offshoot in `docs/reference/design-ideas.md` and to the parked landing-page ticket-tear
    item below, which was already blocked behind this one.
  - ✅ **SETTLED — the structural fork is ANSWERED** (it was the blocking question for two sessions):
    **constellation on desktop, a full-width STACK on mobile.** Harkirat, 2026-08-02 22:42 EDT: *"on
    desktop id say constellation looks coolest… as for mobile, i think the naive reflow… might
    actually work best (again with a heavy design heal to actually make it nice)."* Gradient bands,
    gradient cards, a swipe deck and scroll-driven ground inversion were all built and all rejected.
  - ⚠️ **The desktop fork CANNOT be judged on a phone, and that wasted a round.** Constellation and
    bands collapse into the same object at 375px — the constellation's identity is free coordinates
    plus convergence curves, which need width, and bands' identity is a full-bleed field with a
    CURSOR-following orb, and a phone has no cursor. Mobile and desktop are **independent choices**;
    the mobile form does not have to be the desktop one's degradation.
  - ⚠️ **"Naive reflow" was a mislabel that nearly buried the winning answer.** It was presented as
    the failure case; it was in fact the *unstyled* version of the right answer, judged by how
    finished it looked rather than whether the structure held. On a phone a quiet full-width read
    beats a mechanic. **Never let an unstyled option carry a pejorative name in a comparison.**
  - **Current work-in-progress: `local/site-redesign/mockup-v2.html`** (gitignored; run it with
    `python3 -m http.server --directory local/site-redesign` — a `file://` URL renders as a static
    snapshot in the preview pane and will not respond). It implements both chosen forms and **is
    known to still need heavy design work**. What is worth keeping from it:
    - The **convergence hub** — all four curves terminate at one node, `CREDITED — by name, and it
      cannot be withdrawn`, because that convergence *is* the page's claim under §5.6.
    - The **CLA gate**: a ring sitting ON the Code curve, since the CLA is literally a gate on that
      one path and no other. It is positioned by measuring the path at its arc-length midpoint, not
      from a constant.
    - **Four route hues re-spread** to rose 348° · amber 40° · mint 158° · periwinkle 232° (gaps
      52/118/74/116). mockup-v1's set had three warm values 19–26° apart that read as one colour.
      Code takes the page's own accent, because the one route that binds you should be the page's
      colour. These are page-local and only have to clear `contrastAudit` at 4.5:1 in both themes.
    - The **named-section roster** for Contributors, which is the settled answer to emptiness.
  - ⚠️ **Verification traps paid for in that file, all real:** a mask on a parent applies to its whole
    SUBTREE (it was fading the outermost route names to ~60%); an animation on `transform` REPLACES a
    `translate(-50%,-50%)` used for centring; `nth-child` counts non-`.mk` siblings; `[hidden]` is
    (0,1,0) and loses to any class that sets `display`; and **`document.timeline.currentTime` is
    frozen at 0 in the preview pane**, so animations never advance and elements measure at their
    from-state — strip the intro class to measure settled geometry.
  - The **cross-referenced contributor index** was split out and parked separately in
    `docs/reference/design-ideas.md` (parked on timing, not merit — one contributor, one release).
  - **Approved mockup: `local/site-redesign/mockup-v1.html`** (gitignored, open it directly).
    **Contributing = "The Interchange"** — four ways in (bug report · security · idea · code) on
    tinted lanes, converging on one shared track that ends at *merged & credited*. The route DIAGRAM is
    the page's spine. **Contributors = "The Plate"** — an engraved steel plate, screwed down, maker's
    mark at the top, rows engraved beneath.
  - ⚠️ **NODES, NEVER NUMERALS on Contributing.** `warmShell()`'s rule is "no numbers anywhere — the
    number series is what tells a reader *these bind you*". A step sequence would *earn* numerals
    semantically, but they are the legal set's signature and an invitation must not borrow it. Harkirat
    was shown this conflict and the node form was kept.
  - ⚠️ **SUPERSEDED BY THE REFERENCE RESEARCH — read `local/site-redesign/reference-research.md`
    before touching any of this.** *Updated 2026-08-02 18:19 EDT.* The nine-site crawl settled
    question 1 outright and reframed the rest: **Contributors' emptiness is solved STRUCTURALLY, not
    by resizing** — cut the roster into many small NAMED sections (ensambles.eu/creditos), so no
    section is expected to be full and one name never reads as a gap. That retires *both* routes
    below (shrink-the-plate and reserved-slot). Harkirat has also released these two pages from the
    legal set's design language entirely — the Interchange/Plate mockup is a **fallback only**, and
    two distinct identities is fine. Dark AND light both required; he prefers dark.
  - ✅ **ANSWERED 2026-08-02 22:42 EDT — kept only for the reasoning.** The question below was "which
    structure carries the four routes"; the answer is **(a) constellation on desktop**, with a
    full-width stack on mobile rather than any of the fallbacks sketched here. Do not re-ask it.
    **(a) Constellation** (ensambles) — four markers as free coordinates, each owning a hue, label
    unfolding on hover and the page aura shifting with it. Delivers the four independent hues as a
    live mechanic and is spatially unlike anything else on the site, which is the changelog lesson
    (*the GRID separates page families; colour is the weakest carrier*). Risk: scattered coordinates
    do not survive 375px, and the site has never been checked on a real phone — needs a deliberate
    mobile fallback, not a reflow.
    **(b) Gradient bands** (siberia) — each route a full-bleed gradient field with mono caps labels
    and a cursor-following orb. Bolder at a glance, degrades to a plain stack on mobile for free, but
    separates the pages by *colour*, which the changelog work found to be the weakest carrier.
    **(c) Constellation with a band fallback below the breakpoint** — best of both, but genuinely two
    layouts to build and keep in sync.
    *Asked 2026-08-02 17:20 EDT; Harkirat dismissed the question to prioritise the hook audit, so it
    is still open. My lean is (a).* Verify by building the chosen one and checking BOTH themes at
    desktop and at 375px — the two checks this subsystem has repeatedly skipped.
  - **The three ORIGINAL open questions, kept for the record — 1 is answered above, 2 and 3 apply
    only if the fallback mockup is revived:**
    1. **Contributors' emptiness.** There is genuinely one name, so the plate is mostly bare and the
       dashed "unengraved" row currently reads as a rendering bug rather than as reserved space. Two
       honest routes: shrink the plate so emptiness is not the dominant impression and let the
       surrounding cards carry the page (my lean), or make the reserved slot unmistakably deliberate.
    2. **Lane colours on Contributing.** The mockup gives each lane its own hue, which is four colours
       the site's palette never accounted for. Alternative: four tints of periwinkle.
    3. **The Contributors accent.** If the plate survives, it becomes **steel `#C9CEDA`** — achromatic,
       so it collides with none of the six hues and answers this outright. `#F8FF4A` citron is still a
       placeholder and would retire. Gold was already ruled out at 18° from Terms amber.
  - **Then, and only then:** the ticket-tear animation on the landing-page cards. Harkirat's words —
    "it looks 'eh okay' at best, it needs a heavy redesign, but hold off until AFTER the
    contributing/contributor page redesigns", because the cards are those pages' front doors.
  - Constraints that must survive: `warmStructAudit()` keys off source heading text, so renaming a
    heading in `CONTRIBUTING.md` silently drops that section to plain prose and **no other gate sees
    it** — update `WARM_STRUCT` in the same change. Both pages close with the trademark notice as part
    of their own text now, and their footers pass `disc:false`.

- `[P1 · M]` **The site has NEVER been checked on a real phone since the desktop pass.** *Filed
  2026-08-02 00:40 EDT, at Harkirat's instruction, before merging v2.47.0.* Everything in that release
  was designed, measured and verified at desktop widths — the nav restaging, the sticky section
  headings, the ticket tear, the footer rebuild, the back-to-top parking, the page-load pill
  animation. **None of it has been looked at on a device.** Chrome's emulator is not a substitute and
  is explicitly distrusted here: the mobile metaball uses a different engine *because* an SVG filter
  renders as hard circles on real iOS and as liquid in the CSS chain, which no emulator would have
  shown.
  Specific things to check, because each has a known reason to be suspicious:
  - **Sticky section headings** are scoped to `min-width:981px` and are OFF below it, by design — the
    mobile nav is itself sticky at `top:54px`. Confirm nothing collides at the boundary.
  - **The desktop pill's page-load animation** is skipped on coarse pointers via the `still` flag.
    Confirm it is genuinely skipped and the mobile strip's own convergence still plays.
  - **The ticket tear** uses a rotate about `left top` plus a shadow; hover does not exist on touch, so
    confirm the cards read correctly at rest and that `:active` does something sensible.
  - **The footer's `.nodisc` single-row layout** collapses to one column at 760px — check the sign-off
    and link row do not overlap.
  - **Every hover rule** is machine-wrapped in `(hover:hover)`, but `hoverGuardAudit` proves the WRAP,
    not the behaviour. Latching is the failure mode to look for.
  Serve it to the phone with `python3 -m http.server 8899 --bind 0.0.0.0 --directory public` and browse
  the machine's LAN address. ⚠️ `.claude/launch.json` binds localhost only, so it will NOT reach a phone.

- `[P2 · M · 🧩needs-design]` **Legal site: redesign the section scrollspy.** *Filed 2026-08-01 22:05 EDT,
  from Harkirat's desktop pass.* His words: "While I love that you implemented a scrollspy, I feel like
  you could improve its design, functionality and animation. Please get creative and think outside the
  box for something more unique." What exists today is `.rail` in `scripts/buildLegalPages.js` — a
  sticky left column of numbered slots, tracked by the `paint()` loop in the legal shell's scroll
  script, which highlights the slot whose heading last crossed a 130px line and nudges the rail's own
  scrollbox to keep it visible. It works and it is plain. **Not a bug — an open design brief**, so it
  wants options put in front of him before anything is built (`feedback_ask_before_visual_rework`).
  Constraints that are already load-bearing and must survive any redesign: the index is rendered
  TWICE (desktop rail + mobile `.msecd`) and tracking keys on section ID, never on an index into a flat
  slot list, because whichever copy sits later in the DOM would otherwise win; the rail must not become
  a second scrollbar; and its containing block is `.cols`, not `.page`, which is what stops it
  travelling into the footer. Sections are now wrapped in `<section class="dsec">` by `sectionise()`
  and each heading is sticky, so a redesign has structure to work with that it did not have before.

- `[P2 · M · 🧩needs-design · 🔗bundle]` **Legal site: use the fluid morph on something other than the
  nav.** *Filed 2026-08-01 22:05 EDT, from the same pass.* His words: "I also want to sprinkle our
  fluid morphing animation/system to some other elements in the website so it doesn't feel like a
  standalone design choice. Idk where but if we get an opportunity, let me know." So the deliverable is
  first a **shortlist of candidate surfaces with a recommendation**, not an implementation.
  ⛔ **THE SCROLLSPY IS RULED OUT AS A MORPH TARGET — Harkirat, 2026-08-02 23:40 EDT:** *"no dont use
  the morph for the scrollspy, i plan to make you properly dehaul/redesign that scrollspy in the
  future anyway."* This item used to say it "bundles naturally with the scrollspy item above, which is
  the most obvious candidate surface"; that is now **false** and the bundle is broken. The scrollspy
  redesign above stands entirely on its own.
  ---
  🔴 **STATUS 2026-08-03 08:29 EDT — THREE DESIGNS BUILT, ALL THREE REJECTED. Read this before
  proposing a fourth.** Work happened in a PoC artifact that clones the real landing page (built by
  `local/`-side scratch files, never committed; the repo carries none of it, and `stash@{0}` is a
  first-draft generator version that is now three designs stale — **drop it, do not pop it**).
  - **Rejected — 7px travelling bar.** *"the bar and the morph feel like 2 different elements stacked
    on top of each other instead of 1 build morph."* A sliver has almost no area, so the crush paints
    it as a hard stick and the droplets beside it read as a separate particle layer.
  - **Rejected — 40px capsule carrying the row number.** *"arguably worse and a very lazy attempt at
    utilizing the animation. its not creative at all."* Bar→capsule is the same idea twice: **a blob
    that translates between slots**, which is what the nav already does. Translation is spoken for.
  - **Rejected — the row hairline as nine overlapping segments that bead apart and ripple.**
    *"SOOO unrefined and choppy. the complete opposite of fluid morph."* The IDEA was sound (fission/
    fusion rather than translation) but the MEDIUM cannot carry it, and that is the reusable finding:
    it was N rigid rectangles translating on staggered delays with a blur asked to hide that they are
    rigid. It cannot. Overlapping them fixes the seam at rest and is worse in motion.
  - ✅ **What DID work and should survive into any next attempt:** the **reveal-toggle fission** (one
    blob splits into two as the disclosure opens, bridge thinning 9px→0 as the halves reach ±13px,
    re-merging on close) and the **back-to-top coalescence + click burst**. Both verified in-browser.
  - 📐 **The rule this settled, now recorded as a case in `reference_goo_metaball_recipe`:** DOM boxes
    + `#dbgoo` can do **2–4 compact masses merging and parting at short range**; they **cannot** do a
    body of liquid deforming, a line breaking into a wave, or anything spanning hundreds of px. That
    needs the isosurface computed per frame — a canvas scalar field or a per-frame SVG path.
    **Ask which of the two kinds a candidate surface is before designing for it.** All three rejects
    were the second kind attempted with the first kind's tools.
  - **Next decision (Harkirat's, not a build task):** accept the medium's ceiling and use the effect
    only where a few masses merge at close range, **or** move to a canvas metaball field for anything
    meant to read as actual liquid. Verify any future attempt the way these were: drive the animation
    from the console and assert the *shape* changes frame to frame (neck width crossing the 4.5px
    paint floor, per-move re-rolled randomisation), never by eye alone.
  - 🔬 **A WORKING PoC EXISTS — resume from it, do not restart.** *2026-08-03 09:54 EDT.* Artifact
    (same URL on every republish): `https://claude.ai/code/artifact/f198f8ce-b35f-4532-8f53-c5023b179284`.
    It clones the real landing page and layers the effects on. Sources now live in
    **`local/morph-poc/`** (`compose.mjs` + `morph.css` + `morph.js` → `morph-poc.html`), with a full
    map, build command and per-item diagnosis in **`local/morph-poc-handoff.md`**.
    ⚠️ **They were moved there 2026-08-03 10:37 EDT because "the session scratchpad" is not a location
    a later session can find.** The next session had to hunt through
    `/private/tmp/claude-501/.../<dead-session-id>/scratchpad/` to recover them. `local/` is
    gitignored, so nothing about the repo changes, but the files survive the session that made them.
    ⚠️ That handoff is in gitignored `local/` and can vanish, so the load-bearing parts are duplicated
    here rather than referenced.
    - ✅ **ACCEPTED by Harkirat: the liquid cursor.** It REPLACES the native pointer (`cursor:none`,
      restored on toggle-off / pointerleave / tab hidden — never on `blur`, which any screen recorder
      trips). Seven orbiting masses, tight tracking, deforms to an I-beam over prose and a halo over
      controls, `position:fixed` + client coords so no scroll term can be wrong.
    - ✅ **RESOLVED 2026-08-03 10:10 EDT — reveal pill invisible when closed.** The goo layer was
      appended to `<details>`, and a *closed* `<details>` renders no child but `<summary>`. Moved to
      `.rev`'s parent (`.foot`, `position:relative`), inserted BEFORE `.rev` so tree order keeps the
      panel painted over it, and all coordinates measured against that host. **Verified by looking at
      the closed control** — the inline styles had read perfect twice against a blank screen.
    - ✅ **RESOLVED 2026-08-03 10:30 EDT — but NOT by the fix written here, and the redirect is the
      lesson.** This said to drop the rect and trace the perimeter with ~32 blobs. That was built, and
      Harkirat rejected it on sight: *"you're applying the fluid morph to the borders of the
      rectangular card, when in fact you should scrap the rectangle and make the literal spill its
      background element, unrestricting its shape."* Correct — **morphing a rectangle's BORDER still
      leaves a rectangle.** The panel now gives up its background, border and radius entirely and the
      spill IS its ground: a ring of discs seated on a path inset by the blob radius (the silhouette)
      plus a spine down the middle (the fill), every mass ordered by straight-line distance from where
      the spout lands, so the liquid spreads outward from the landing point.
      Retuned once more after *"too large, too bright, too many bubbly surfaces… smoother, less curves
      but larger curves, a natural background element rather than a show piece"*: `OUT` 10→4, `RB`
      22→34, `SPACE` 13→26 (78 masses → 34, larger radii = longer flatter arcs), jitter roughly halved,
      and the body **soaks** from full accent toward the panel's own `--raised` as it lands. That last
      part also removed a problem instead of solving it — at full accent the body text had to be
      knocked out to a luminance-computed near-black; over a quarter-accent wash the site's own ink
      reads fine.
    - ✅ **RESOLVED 2026-08-03 10:26 EDT — back-to-top reappearing after a tap, and it was never what
      two previous fixes assumed.** Both earlier attempts chased a second *birth* (a `settling` flag,
      then re-arm at `scrollY < 4`). Instrumenting the live control settled it: `on` is **never**
      re-added after a launch, but computed opacity ran 0.91 → 0.33 → 0.02 between 604ms and 846ms.
      Removing `on` and `birth` in one statement hands the fade to the `.totop` transition — and
      `birth` is also what hides `.tt-ring`/`.tt-ar`, so for ~300ms after the liquid flew away the real
      button chrome popped back and faded out behind it. Fix: drop `on` while `birth` still applies
      (`.totop.birth` carries `transition:none`, so it goes to 0 instantly), flush with
      `void tt.offsetWidth`, then drop `birth`. Re-measured: opacity 0 from 604ms onward.
    - ✅ **ADDED 2026-08-03 10:33 EDT — the liquid cursor tints to the surface under it**, easing back
      to the page accent on the way out. ⚠️ Only possible because `#dbgoo-p` is an **SVG alpha matrix**
      that leaves RGB alone; the CSS blur/contrast crush drives every channel to 0 or 1 and would map
      amber and lime to the same yellow. Surfaces announce themselves three different ways and
      assuming one left two of them flat — the rows scope `--accent`, the `.inv` cards scope **`--ia`**
      (`#8B9BFF`, `#F8FF4A`) and leave `--accent` at the page value, and the GitHub button scopes no
      variable at all (its colour is its own `color`). Resolver runs most-local-first and compares
      `--accent` against the PAGE value rather than merely reading it. ⚠️ A control's own `color` is
      **not** always wearable: the back-to-top computes to `rgb(0,0,0)` and turned the swarm black on
      hover, so a candidate is rejected unless it clears 1.6:1 against the page ground — a contrast
      test, not a darkness test, so it holds in both themes.
    - ✅ **ROUND 3, 2026-08-03 11:00 EDT — four more, all verified against a live renderer.**
      · **Mark**: rests as a soft-cornered RECTANGLE (`26%`) and *breaks away* on hover — its own
      eight-value `border-radius` is driven per frame, so the silhouette deforms instead of the box
      being scaled. The old read was exact: *"it literally just feels like it's being stretched out
      towards the left/right and then pulled back in."* Buds now ORBIT (measured 15.6 × 15.7px of
      travel, was 4.1 × 0.8 — a slide with a curve on it). ⚠️ The orbit rate has to be its own
      constant; deriving it from the radius clock gave ~0.86 rad/s and looked static.
      · **Spill**: 19 masses (from 34, from 78). The wavefront is now ANISOTROPIC (`WX 0.52 / WY
      1.35`) — a plain radial spread grows a circle from the landing point, which is precisely what a
      falling drop looks like and was read as *"looks like a droplet than a spill."*
      · **Close bug**: the soak was computed straight from `t`, so closing drove `t` back under 0.5
      and the body UN-soaked to full accent while leaving — the *"changes colors to a vibrant orange
      and gets stuck on screen."* It latches now; the text was also held to `fill 0.12` so body and
      copy empty out together (measured: masses 0 and textOp 0 both by t=306ms), and the close is
      300ms not 420ms.
      · **PoC 05 — the header buttons as liquid**, with the shipped pair beside them to compare. The
      core keeps the control's box (a button has a label and a hit area, unlike a puddle) and the
      liquid happens at the EDGE. ⚠️ `computer hover` cannot drive a real CSS `:hover` in this
      harness, so the capsule's 32→108px expansion is UNCONFIRMED by automation — verified only that
      the masses animate and the core's radius varies under a dispatched `pointerenter`.
    - ⚠️ **THE TINT RESOLVER TOOK THREE PASSES AND THE MIDDLE ONE MADE IT WORSE — the reusable bit is
      why.** Pass 2 dropped a "must differ from body ink" guard to fix the GitHub button flashing
      white then reverting to orange (`.ghb:hover` resolves to `var(--ink)`, which IS `document.body`'s
      colour, so the guard accepted the mid-transition values and refused the destination). Dropping it
      fixed that and immediately turned the swarm near-white over the Terms row and over the reveal's
      `<summary>`, because **row 01's scoped `--accent` equals the page accent**, so it falls past the
      accent check into the borrow-the-control's-`color` step. **Judging by COLOUR cannot separate
      these cases** — the GitHub button's wanted colour and the row's unwanted one are both
      `--ink`-family. Judging by whether the element paints its own CHIP can: borrow a control's ink
      only if it has a real border or background. Verified across all eight surfaces at once by
      calling the resolver directly rather than hit-testing, after two earlier probes failed for
      positional reasons and not logical ones.
    - ✅ **ROUND 4, 2026-08-03 11:27 EDT — eight more. Three findings are reusable:**
      · **A shape smaller than ~4× the blur's σ cannot keep its own geometry — the crush owns the
      silhouette.** The resting mark would not read as a rectangle at ANY radius, because a 14×6.5 box
      meets `#dbgoo-r`'s σ=3.2 blur (half its own height) and the alpha crush then thresholds what
      survives. Nothing about the radius was wrong; it was being destroyed downstream. Fixed by
      drawing the resting shape as **`.rv-plate`, a plain UNFILTERED element**, which hands over to
      the filtered mark on wake — which is what "breaks away from the rectangle" actually means.
      · **A ring of similar masses around a perimeter is a CLOUD, by construction.** Many convex bumps
      of similar size is what a cloud *is*, and that is exactly how it was read. A body of liquid has
      long smooth runs and a couple of gentle waists, so the silhouette must come from a FEW large
      overlapping masses of UNEQUAL size, where most of the boundary is one mass's arc. **Count
      creates cloudiness; asymmetry creates character.** Ring, end caps and spine are all gone —
      three masses, no interior fill needed.
      · **Use ELLIPSES on a wide surface.** Covering a 3.6:1 panel's CORNERS with circles forces a
      radius so large the body overshot by 40–73px a side (measured). Ellipses matched to the panel's
      aspect cover the same copy at ~33/31/17/23px. And **derive rx/ry from where the COPY ends, not
      from the panel box**: two conditions must hold at the copy's top edge, where the ellipses are
      narrowest — neighbours must still overlap there, and the outermost must still reach the first
      character. Both are solved for. Verified 0 uncovered points of 546 sampled, repeatedly.
      · Also: arc-length seating **cannot be trusted to reach a path's extremes** (a flattened path's
      side segments have zero length, so the extremes survive only as ~4px arcs — 25px of a 553px
      perimeter — and evenly-spaced masses skipped them, leaving the body 5.6px *inside* the panel's
      left edge). Superseded by the three-ellipse layout, but the lesson stands for any future path
      seating. The `slide` is outward-only; the copy is tied to `fill` with **no floor** so the last
      mass and the last of the text go together; the mark **drains into the body** leaving a 6.5×5.5
      remnant; open takes 1100ms; mark rates ×0.7; label reads **"Hide"** and "Prefer email?" takes a
      **strike-through** while open. PoC 05 went 14 small fast masses → 6 large slow ones, because
      many small masses on independent clocks is *boiling*, not morphing.
    - 🔴 **ROUND 5, 2026-08-03 11:43 EDT — THE MOBILE PASS, AND IT INVALIDATED THE WHOLE APPROACH FOR
      THE BODY. Read this before building any further surface.** Every effect had been built on SVG
      `filter:url()`, and on a phone the reveal showed as *"3 balls orbiting the rectangle"* with the
      card as *"3 large circles — an even worse cloud"*. Contact sheets off two screen recordings
      (`ffmpeg select+tile`) show discrete hard-edged circles that never merge.
      · **This was already written down and I built past it.** Dead end 3 in
      [[reference_goo_metaball_recipe]]: *"SVG filters read as hard circles on iOS where the CSS chain
      reads as liquid — never reproduced on desktop Chrome."* CLAUDE.md says the same: desktop uses
      the SVG alpha crush and mobile uses the CSS crush, **deliberately and separately**.
      · **AND THERE IS A SECOND, SCALE-DEPENDENT REASON THE UNION APPROACH COULD NEVER WORK HERE.**
      The alpha crush composites overlapping OPAQUE shapes to alpha 1 *before* the blur, so σ only
      softens the OUTER boundary. Masses must be small relative to σ to merge at all; at ~100px, σ=3.2
      is invisible and what you see is the plain geometric union — which is why three ellipses read as
      three tangent circles with cusps no matter how they were tuned. **The rule to carry forward:
      metaball merging is a function of mass size ÷ σ, not of spacing.**
      · **Fix: the body is now ONE `<path>` recomputed every frame** — a superellipse
      (`|x/A|^n + |y/B|^n = 1`, n≈4, which hugs a 3.6:1 panel where an ellipse overshoots) with three
      low harmonics riding on it, sampled at 30 points and emitted as closed Catmull-Rom → cubic
      Béziers. `A`/`B` are **solved** so the copy sits inside the contour at its thinnest, worst-case
      harmonic dip divided out. No filter, nothing to merge — so the iOS failure and the cusp failure
      both disappear at once, and it is finally *one large smooth fluid blob*.
      · **The filtered layers now stand down on touch** (`!fine`): the reveal keeps its crisp plate as
      the mark, the back-to-top uses the plain control, and the button PoC drops its goo. The
      progress ring is **clamped** — iOS rubber-banding reports scrollY below 0 and past `docMax`, and
      the URL bar showing/hiding changes `innerHeight` mid-scroll, which is the "resets the circle
      outline" report.
      · ⚠️ **A sibling does not inherit a custom property.** `--rv-body` was being set on the goo
      layer while the new path lives in a sibling `<svg>`, so the body rendered at full accent instead
      of its soaked colour. Set it on the shared host.
      · **Still filtered, so still wrong on iOS:** the mark's buds and the button PoC. They are hidden
      on touch rather than ported to the CSS crush — porting them needs the bed + blend recipe
      (opaque backdrop, `lighten`/`multiply`), which is a separate job.
    - ✅ **ROUND 6, 2026-08-03 11:58 EDT — four fixes, and one of them is a process lesson.**
      · **"Too smooth / no dynamic element" was the RATES, not the amplitudes.** The harmonics ran at
      0.33–0.73 rad/s — 9 to 19 SECONDS for one circuit — so in any glance the outline was effectively
      static (measured: 4.3px of vertex travel over 10 frames). At ~2.4× it is 14.3px/s and 19.5px
      over 2s, with the four waves beating against each other because no two rates share a factor.
      · **"Overly large" was the EXPONENT.** Covering a wide panel's corners is what drives overshoot,
      and the superellipse exponent controls exactly that: at n=4 the contour needed A=198 against a
      182 half-width; at n≈5 it needs 184. Margins went 41/18/22/29 → 15/12/6/7. **Raising n is free
      — a squircle still reads smooth.** A second lever: making the harmonics **outward-only** removes
      the ~13% inflation that existed purely so the smallest moment still cleared the text.
      · **"The mark doesn't change on mobile" was MY OWN GUARD, and it is the lesson.** I had gated the
      mark behind `fine` because its filtered buds render as hard circles on iOS. That hid the broken
      layer *and* every awake state with it — the mark simply stayed a rectangle forever. ⚠️ **Hiding
      a surface from the platform that cannot render it is not a fix.** The mark is now a computed
      path like the body, so nothing under `.rev` is filtered and touch gets exactly what desktop
      gets. `#dbgoo-r` is deleted; do not re-add it.
      · **Same mistake, same fix, on the back-to-top:** the earlier pass skipped the whole coalescence
      on a coarse pointer, which quietly removed the particle animation from mobile. Now only the
      FILTER is dropped there (`.totop.nogoo`), so the droplets still converge — crisp rather than
      liquid, an honest downgrade, but a real animation that cannot produce the artefact.
      · **The stuck "gradient circle" was the filter REGION.** `#dbgoo-c` is 260% of a 44px layer —
      a ~114px disc, which is the size of the thing that was showing. `opacity:0` does not prevent
      that: the element is still in the paint tree and a filtered one still allocates its region.
      `.tt-ink` now carries `visibility:hidden` between births. Verified nothing paints for 2.5s after
      a tap, with the filter off.
    - ⛔ **THE CSS CRUSH DOES NOT TRANSFER TO THE BACK-TO-TOP — built, measured, reverted
      2026-08-03 12:03 EDT. Do not re-attempt without reading this.** Two rounds of notes here said
      "the full fix is the CSS blur/contrast crush with the bed + blend recipe, a separate job". It
      was built. **The masses merged correctly — the crush is fine — and the black bed rendered as a
      solid square.** The recipe's precondition is an opaque backdrop with *no isolating ancestor*
      between the blend group and it; `.totop` is `position:fixed; z-index:55`, so it is its own
      stacking context and `mix-blend-mode:lighten` composites inside it, against a background that
      `.birth` sets transparent. Black against nothing stays black. Nor can it be patched by giving
      the button an opaque background: the bed is inset −90px, far outside a 46px control.
      **The nav works because it sits ON a bar; a floating control has no surface to sit on.** The
      recipe memory's "no scroll container between it and that backdrop" was too narrow and has been
      corrected. Coarse pointers therefore keep the unfiltered droplets — crisp circles converging,
      an honest downgrade chosen over the iOS artefact and over removing the animation entirely.
    - 🛑 **THE CARD SURFACE IS ABANDONED — Harkirat, 2026-08-03 12:05 EDT: "just revert it back to the
      old card style."** Four rounds of rework (perimeter ring → three ellipses → one computed
      superellipse path) never got it past "bad on mobile", and the spill apparatus is gone with it:
      body path, resting plate, spout, beads, drain-to-a-remnant, soak colour, wavefront. `.rv-b` is
      the shipped panel again, untouched. **The findings above are kept because they are platform
      facts worth having, not because the surface is coming back.**
      **What survives, and is the thing to port:** the mark's own morph (the filtered core with an
      eight-value per-frame border-radius plus three orbiting buds — the version he called *"very well
      done and truly morphing"*), the **Reveal → Hide** label, and the **strike-through** on the
      question once it is answered. The mark no longer pours: it is a control's indicator, not the
      source of a liquid.
      ⚠️ `#dbgoo-r` is BACK — the buds merging is the one thing here that genuinely needs the filter.
      That re-accepts the iOS hard-circle trade on this surface, knowingly.
      ⚠️ Back-to-top on touch: **birth dropped, destruction kept.** Narrower than the earlier guard,
      which skipped both and quietly took the whole effect off mobile.
    - `[P3 · S]` **Click burst wants to be more destructive.** Only trailing masses fly out today; the
      tip must survive (the native cursor is hidden, so the pointer can never disappear). Unbuilt idea:
      extra temporary shards that fly further and evaporate, plus a core implosion that springs back
      past its resting size.
    - `[P2 · M]` **Reduce-motion toggle**, explicitly queued by Harkirat for after the above: turns the
      morph off site-wide, reverts the homepage rows to their original bar/hue with no animation, and
      switches the nav to plain pills.
  - ⚠️ **HOW TO VERIFY ANIMATION AT ALL — this cost most of a session.** Chrome pauses its render loop
    when the window is backgrounded: `requestAnimationFrame` never fires, CSS transitions never
    advance, `document.timeline.currentTime` stays 0. Reading computed/inline styles then "passes"
    while the screen shows nothing. **Run `open -a "Google Chrome"` first, then assert rAF is alive
    before trusting any visual check.**
    ⚠️ **A SLEEPING DISPLAY PRESENTS IDENTICALLY — 2026-08-03 10:05 EDT, several turns lost.**
    `document.hidden` was `true` and rAF dead while AppleScript correctly reported Chrome frontmost
    with the right tab active, so "front the window" looked done and wasn't. **The tell is that
    `screencapture -x` fails with *"could not create image from display"*.** Wake the display, then
    re-assert. Assert with TWO consecutive rAF timestamps, not one callback — a single frame can fire
    once without the loop advancing.
    ⚠️ **And instrumenting the page beat recording it.** Reading numbers across frames from inside the
    page — blob count, radii, neighbour gaps, computed opacity per frame — found every defect this
    session: a radius under the paint floor, the back-to-top fade misdiagnosed twice as a re-birth,
    and a hit test silently returning `null` because the target was off-screen. Screenshots then
    confirmed the look. One caution learned the same day: a failing *probe* is not a failing
    *feature* — the GitHub button was reported as "not tinting" when in fact the pointer could never
    be over it. For motion, take a screen recording and read consecutive
    frames (`ffmpeg -vf "select=...,tile=NxM"` into a contact sheet) — that method found every real
    defect here; eyeballing and style-reading found none.
  ⚠️ The metaball system is not portable by copy-paste and the reasons are recorded: desktop uses the
  SVG `#dbgoo` alpha crush and mobile uses the CSS `blur/contrast` crush, deliberately and separately
  (an SVG filter renders the swarm as hard circles on iOS); the accent must come from a BLEND, never a
  fitted filter chain; and the geometry constants are MEASURED against the renderer, not derived — see
  `reference_goo_metaball_recipe` and `feedback_measure_the_renderer_not_the_model`. Any new surface
  with a different element height needs its dilation re-measured with the canvas method.

- `[P2 · M]` **`/draws`/`/calendar`: auto-expire old data from view once the season ends.** *Filed
  2026-07-31 12:10 EDT from notes L187.* Harkirat's own wording is important: "automatically disappears
  from **view** instead of having to manually be removed" — this is display filtering, NOT deletion.
  `/calendar` already has most of this (the Active/All toggle + `isEventEnded()` in `calendar.js`, tied
  to each event's own end date or `bpEnd` for "All Season" entries) — the real gap is **`/draws` has NO
  equivalent mechanism at all**, confirmed by grep (verified 2026-07-31 12:10 EDT — zero hits for
  expiry/filter logic in `draws.js`). Needs a design call before building: what "the season has ended"
  means for a draw specifically (its own release date passing? `bpEnd`? `rankEnd`?), and whether it
  gets its own Active/All toggle like `/calendar`'s or something simpler.
- `[P2 · M]` **Alert system: make Discord alert messages actually understandable, add a
  "reconnected successfully" signal.** *Filed 2026-07-31 16:41 EDT — Harkirat hit a real "🔴 Gateway
  shard error" alert live and had "absolutely no clue what it meant," and separately has no
  indicator at all when the bot recovers/reconnects successfully after a disruption.* Two related
  gaps: (1) the shard-error alert's raw stack trace (`Unexpected server response: 503`,
  `node_modules/ws/lib/websocket.js:930`) means nothing to a non-technical reader — needs a
  plain-language explanation layer (what a Gateway shard error actually is, whether it self-resolves,
  what action if any is needed); (2) there's currently no positive "back online"/"reconnected" alert
  to close the loop after a disruption alert fires, so a one-off blip reads as an open question
  forever. See `utils/alertStore.js` + the alert-tier design referenced in
  `reference_vm_bot_commands` memory for the existing mechanism this extends. Harkirat also
  mentioned "some discuss[ion] around it as well" — worth asking him directly what that refers to
  before scoping the actual build.
- `[P1 · M · Sonnet5-M]` **User-data deletion path — the privacy policy now publicly promises it.**
  *Filed 2026-07-28 21:36 EDT during the licence/ToS/privacy drafting session.* **There is currently no
  automated deletion of `UserPreference` records anywhere in the codebase**, and `/settings` has no
  reset — it only overwrites individual values. Only `AlertLog` prunes (30 days, `utils/alertStore.js`).
  Removing the bot from a Discord account stops interaction but leaves the record sitting indefinitely.
  `docs/legal/PRIVACY.md` §7.1 **honestly discloses this** and commits to manual deletion within 30 days
  of an email request — so the promise is currently kept by hand, and every day it stays manual is a
  standing obligation on Harkirat personally. Needed: (a) a self-service delete in `/settings`
  (with a confirm step), (b) a reset-to-defaults, and (c) optionally an automatic sweep of records
  untouched for N months. **When this ships, update `PRIVACY.md` §7.1 and §9.1 in the SAME change** —
  they currently describe the manual process as the only route.
- `[P2 · M]` **`/calendar`: replace Prev/Next pagination with section-toggle buttons.** *Filed
  2026-07-31 12:10 EDT during the 3-section calendar redesign (notes L195).* Harkirat explicitly asked
  for left/right pagination to stay for now (page 1 = Draws+Events, page 2 = Playlists/Modes) but wants
  buttons that jump straight to a named section eventually, since that's more discoverable than
  Prev/Next once there are 3 real sections. Needs a mockup/UI pass before building — not just a wiring
  change.
- `[P1 · M · Opus5-M]` **`/autobuild`: recognise DMZ builds, not just MP.** *Filed 2026-07-28 01:41 EDT
  from notes L104 — Harkirat raised this earlier and it had **never been filed anywhere**, so it was
  sitting only in the scratchpad.* The PoC only ever taught the vision prompt about **MP** builds, so a
  DMZ build is silently treated as MP and loses its DMZ-mode metadata. Needed: teach the prompt to
  **detect** a DMZ build, **record its full attachment set**, and **differentiate** it from MP so it gets
  the DMZ metadata. **Known constraint:** "DMZ partials are the 5-attachment prompt cap" — DMZ builds
  exceed the attachment limit the prompt currently sends, so partial capture is a symptom of that cap,
  and the fix has to address the cap (batching or a second pass), not just the prompt wording.
  Subsystem detail + the other open follow-ups: `.claude/rules/autobuild.md`.
- `[P2 · XS · any model]` **Bump the GitHub Actions to `@v5` — they run on a deprecated Node 20
  runtime.** Filed 2026-07-29 11:44 EDT, from a warning Harkirat spotted on the v2.42.0 CI run:
  `Warning: Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to
  run on Node.js 24: actions/checkout@v4, actions/setup-node@v4.`
  **What it actually is:** a JavaScript action declares its own runtime in its `action.yml`, and both of
  these declare `using: node20`. GitHub is retiring Node 20 from the runners and force-running those
  actions on Node 24 in the meantime ([changelog,
  2025-09-19](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)).
  Nothing is broken today; it becomes a hard failure when the shim is dropped. **This is about the
  actions, not about our Node version** — the VM runs Node 24 already and `ci.yml` pins its own
  `node-version` separately, so neither is the thing being warned about.
  **Three call sites, all `@v4` → `@v5`:** `.github/workflows/ci.yml` (`actions/checkout`,
  `actions/setup-node`) · `.github/workflows/sync-v3-pre-release.yml` (`actions/checkout`). The v5
  releases are the same actions recompiled for Node 24 — no API change to absorb.
  ⚠️ **`checkout@v5` keeps the depth-1 default, so `ci.yml`'s `fetch-depth: 0` must survive the bump.**
  Measured on a real shallow clone: 42 false hash-chain errors and 1 tag visible instead of 100+.
  `scripts/docs-audit.mjs`'s `ci-wiring` check already asserts `fetch-depth: 0` is present, so dropping
  it fails CI rather than silently degrading the audit — but read that assertion before trusting it.
  **It self-verifies:** merging to `main` triggers `sync-v3-pre-release.yml`, so both workflows get
  exercised by the PR that changes them. Watch that run rather than assuming it passed.
- `[P3 · S · Sonnet5-M]` **Re-evaluate Sentry (free tier) — do NOT adopt on the old reasoning.** Carried
  over from the `vmstatus.sh` overhaul (shipped v2.41.0, 2026-07-28 15:52 EDT), which deliberately did
  not build it. The 2026-07-26 addendum pitched Sentry for stack traces / breadcrumbs / repeat-error
  grouping on top of the Discord webhook. **That gap is materially smaller now:** structured Cloud
  Logging carries real severity plus the running version and commit on every entry, and `vmstatus.sh`
  surfaces error/alert/noise tiers. So the question is no longer "webhook vs Sentry" but "what does
  Sentry add over structured Cloud Logging" — answer that before adopting. 🔗 Bundle-with: the deferred
  admin `/status` command (`getAlertSummary()` can feed it either way).
- `[P3 · XS · any model]` **GitHub achievement badges — Pull Shark + Pair Extraordinaire.** Added
  2026-07-28 15:52 EDT (Harkirat's ask). **Pull Shark is not showing despite 42 merged PRs because all
  three of his repos are PRIVATE** (`diors-builds`, `dior-cli`, `gif-background-remover`) — verified via
  `gh repo list`. Two things to try, cheapest first: (1) enable **Settings → Profile → "Include private
  contributions on my profile"**, which some report backfills it; (2) failing that, it needs merged PRs
  on a **public** repo — a small public repo of his own reaches bronze (2 PRs) quickly. **Pair
  Extraordinaire needs a co-author who is a DIFFERENT GitHub account than the commit author** — his own
  noreply address self-co-authoring does not count, and `noreply@anthropic.com` maps to no account. The
  workaround he wants to try: co-author with a bot account (Copilot-style, e.g.
  `Co-authored-by: Copilot <ID+Copilot@users.noreply.github.com>`) on a real merged PR. ⚠️ Confirm the
  exact bot account id before relying on it — unverified as of filing.
- `[P1 · L · Opus5-H · 🧩needs-design]` **Line-by-line audit + restructure of the entire documentation,
  memory, and enforcement surface.** Added 2026-07-27 22:35 EDT (Harkirat's ask). **Goal: everything
  *correct and current*.** These files have grown substantially and a great deal changed in the last
  week — the v2.36.x release-convention overhaul alone touched 8 repo docs, 4 memories, and 3 hooks — so
  they are due a proper inspection rather than another incremental patch.
  **Scope — read every file, line by line, not just grep:** `CLAUDE.md` · all `.claude/rules/*.md` ·
  every `docs/` file incl. `reference/`, `superpowers/specs/`, and the archives · every memory file +
  `MEMORY.md` · `docs/SESSION-START.md` · the hooks and nudges in `.claude/settings.json` ·
  `.github/workflows/` · the working agreement and every feedback/reference/preference memory.
  **Check for:** stale content (claims that were true once) · gaps and missing pieces · outright
  mistakes/errors · things not caught up with recent changes · broken or missing cross-links and
  `[[wikilinks]]` · duplicated content that has drifted apart between copies · contradictions *between*
  files and *within* a single file · counts/numbers that rot (the `CLAUDE.md` memory-file count has been
  wrong at least 3 times) · rules stated as prose that should be hooks · and anything else worth flagging
  that isn't listed here.
  **Then restructure/reorganize/reword** where the file has outgrown its shape.

  ---
  **📌 FOLDED IN 2026-07-28 01:41 EDT — from the memory-migration session's five audit passes.**
  That session swept for one thing (memory-path references) and kept finding unrelated defects, so what
  it could NOT finish is recorded here instead of being lost. **Read this before starting: it tells you
  what is already done, so you don't redo it, and what is genuinely untouched.**

  **✅ ALREADY DONE — do not repeat (verified, with evidence, that session):**
  - **Memory/slug pointers are CLEAN everywhere.** Every surface below was swept for the old slug, for
    memory-store pointers, and for the retired "fixed store is move-proof" rule: repo docs, `CLAUDE.md`,
    `.claude/rules/`, `docs/` incl. `archive/` + `superpowers/`, **all `*.js`/`*.sh` code (zero hits)**,
    `.claude/settings.json` + `settings.local.json` (both tracked since v2.39.0), `~/.claude`
    (skills/hooks/agents/commands/plans — still unversioned), `.remember`, the
    Gif + shared-root memory stores, `dior-cli`, both cross-project docs, and the MCP stores
    (perseus-vault, linksee, codebase-memory). Remaining old-slug mentions are **historical
    changelog/DEVLOG entries, deliberately preserved**. **This dimension does not need re-auditing.**
  - Store integrity (index ↔ disk, frontmatter, `[[wikilinks]]`) for all three memory stores.
  - Every `.claude/rules/` `paths:` glob verified to match real files (a dead glob = a rule that silently
    never loads).
  - Tag ↔ `package.json` correctness for the newest 25 tags; all cited CHANGELOG SHAs resolve.
  - Both `SessionStart` hooks dry-run after their parsed files were edited.

  **❌ NOT DONE — the real remaining scope, in priority order:**
  1. **Code context comments — ZERO coverage.** `index.js` (~3.3k lines) and every `commands/`,
     `utils/`, `models/`, `scripts/` file were **never read** for comment accuracy. This repo
     deliberately carries "why" comments next to fixed bugs and platform workarounds, so a comment that
     outlived its code is exactly the silent rot this audit exists for. **Highest-value target.**
  2. **`.claude/rules/*.md` bodies** — structure verified, **content never read** (~51k tokens across
     13 files).
  3. **`docs/archive/`, and the CHANGELOG/DEVLOG bodies** — only headers, versions, and SHAs were
     checked; the prose was never read.
  4. **Folder cleanup (Harkirat's ask).** `local/` holds ageing artifacts: `crash report.txt`,
     `session-report-*.html` (364K), `claude-code-receipts-*` (both formats), `sessionhandoff*.md`,
     the now-complete `memory-migration-handoff.md`, and `Screenshots/` (~13M, the bulk). **`local/` is
     Harkirat's personal scratch folder — never delete from it unprompted; propose a list and let him
     choose.** Also sweep `/Applications/Claude Code/local/`, `docs/archive/`, and
     `local/claude md backup/` (a full stale `.claude` snapshot, now carrying a `_README` marker).
  5. **A general defect class worth a dedicated pass:** *present-tense claims that duplicate
     machine-checkable state.* Four were found already wrong by 37–59% (see
     `feedback_no_duplicated_state_in_prose` memory). Also **retired-infrastructure guidance written in
     the present tense** — Render/Railway instructions read as live until corrected, and dead
     credentials for both sat in `.env`. Hunt both patterns deliberately; grep for the *idea*, not a
     string.
  **Why P1/L:** the same week produced three separate instances of exactly this failure — a self-
  contradictory clause inside one spec that had propagated into five files (v2.36.0), a source-of-truth
  memory still teaching a retired convention while the repo docs were correct (v2.36.3), and a rule
  documented in four places whose *trigger* existed in none (the v3 sync). Each was found by accident.
  **Method note, learned the hard way this week:** grep alone will not find these — the v2.36.3 miss
  survived two grep sweeps because it phrased the same idea differently. Read the files. And **verify
  every check itself before trusting it**: a "every version has a summary line" check reported 23 false
  gaps because it demanded an exact heading the convention doesn't use.
  **Bundle with:** the `[P2 · S]` sweep-script item below — anything mechanically checkable that this
  audit finds should leave as a script/CI check, not as more prose.

- `[P2 · M · Opus5-H · ⚠️touches-prod]` **Rename the production database off Mongoose's `test` default.**
  Added 2026-07-26 13:24 EDT; Harkirat explicitly deferred this to its own session mid-bring-up. The prod
  Atlas `MONGODB_URI` carries no database path, so Mongoose silently defaulted to a db literally named
  **`test`** — that's where all 5 live collections (`loadouts` 133, `alertlogs` 180, `userpreferences` 15,
  `alertcounters` 6, `seasonaldatas` 1) actually sit. Nothing is broken; it's a naming/clarity problem that
  gets riskier to fix the longer it waits. Target `diors-builds` (the local dev clone already uses
  `diors-builds-dev`, so dev is already correct and needs no change). **This is a live-prod migration, not a
  config tweak** — it needs: copy `test` → `diors-builds` on Atlas, update `MONGODB_URI` in the VM's `.env`,
  restart `diors-bot` via systemd, verify with `scripts/vmstatus.sh`, and only then drop the old db after a
  soak period. Do it in a low-traffic window; the bot is briefly down across the restart. Note the same URI
  is read by `scripts/` one-off tools, so check those too before dropping `test`.

- `[P1 · M · Opus5-H · 🧩needs-design]` **`.claude/rules/` two-tier rework (card + detail).** Added
  2026-07-24 23:02 EDT. The 13 rule files total **51.3k tokens — MORE than the 3,272-line CLAUDE.md
  monolith they replaced** (`accent-and-colors.md` alone is 11.9k). Path-scoping only pays off on narrow
  sessions; measured, session `2c62ab02` auto-loaded **11 of 13 rules ≈ 42.8k tokens**, so a broad session
  now costs roughly what the monolith did. **The plan:** split each rule into a ~300-500 token **card**
  (gotchas + invariants only — the bug-preventing content, stays auto-loading via `paths:`) plus a
  `docs/reference/<x>-detail.md` (narrative, history, worked examples — never auto-loads, read on demand).
  Target: **51.3k auto → ~5k auto**, the other ~46k one Read away. Start with `accent-and-colors.md` as the
  proof-of-concept and judge the shape before converting the other 12. **P1 because it's the largest
  remaining always-on context lever** and it partially defeats the point of the 2026-07-22 modularization
  until fixed. Content surgery across 13 files + doc cross-ref updates → wants its own session, Opus 5 High.
  Full cost model + measurements: memory `project_context_token_budget`.
- `[P2 · L · Opus5-H · 🧩needs-design]` **View Colors — wider colour variety.** juul's avatar returned 6
  of 8 requested colours and missed a useful yellow (assume one root cause). Keep the existing
  2-4-on-one-page behaviour for genuinely minimal images (juul's banner correctly returned 4). Real
  algorithm work; **determinism is a hard constraint** (Refresh's change-detection depends on it). Levers:
  over-clustering K=1.5× + the 30-RGB merge. Full subsystem detail: `.claude/rules/accent-and-colors.md`.
  ⇄ Also on `docs/ROADMAP.md`'s **remaining-v2** list (horizon only — the detail above is canonical).
- `[P2 · L · Opus5-H]` **Real "search + multi-select" admin flow.** For `/manage`'s "Delete Multiple" (all
  entities) and Loadouts' "Replace Multiple": search first, then tick which matches to act on. Today they're
  placeholder paste-a-list flows; this is the genuinely-new interaction they're meant to become. Full
  subsystem detail: `.claude/rules/manage-panel.md`.
- `[P2 · S · Sonnet5-M · 🔗bundle-with the CI expansion above]` **Make the records-consistency sweep a
  script (and then a CI job).** Filed 2026-07-27 20:40 EDT. A one-off script run this session caught two
  real defects that reading had missed: 7 items duplicated across `ROADMAP.md` and `db-deferred-list.md`
  while both headers claimed they didn't duplicate each other, and `docs/README.md`'s chore checklist
  telling you to tag the squash commit when every real tag points at the finalize commit. Checks worth
  keeping: newest `package.json` == newest `CHANGELOG.md` == newest `CHANGELOG-SUMMARY.md`; every
  changelog version has a tag and a summary line; every cited SHA resolves; no cross-file duplicate item
  titles without a `⇄` marker; `MEMORY.md` indexes every memory file (and every indexed file exists);
  the canonical memory dir exists and contains `MEMORY.md`.
  **⚠️ Note (2026-07-28 01:41 EDT): the old "`CLAUDE.md`'s memory-file count matches the store" check is
  retired — that count was deleted rather than maintained.** A number in prose is a copy of state nothing
  updates; it rots and becomes the misinformation it was meant to catch. **Generalize the check instead:
  the real class of bug is any present-tense count/size claim in a doc.** A sweep on 2026-07-28 found
  four already wrong by 37–59% (`CLAUDE.md` "~180 lines" at 287, CHANGELOG "1,366" at 2,126, DEVLOG
  "1,792" at 2,460). Prefer a structural test ("does it exist / contain X") or a dated measurement
  ("was N on DATE") over a bare present-tense number, and have the script flag new ones.
  **Extended 2026-07-27 21:27 EDT** by the lagged-backfill convention (see the resolved "1 commit + 1 tag"
  item in `archive/resolved-list.md`) — three more machine-checkable invariants, and note the script should
  **perform** the backfill, not merely flag it, since it is a mechanical additive edit:
  1. every entry **except the newest** cites a SHA that resolves (the newest legitimately has no hash yet
     — exempt it, don't fail on it). From **v2.36.0 on** the cited SHA must equal the commit its tag points
     at; for **v2.33.0–v2.35.15** it may equal either the tag or the tag's *parent*, since 16 of those 25
     were tagged on a follow-up finalize commit — a check that demands tag-equality flags all 16 as false
     positives;
  2. every entry from **v2.33.0** on cites a PR number (v2.26.0–v2.32.0 predate the PR workflow — hash-only
     is correct there);
  3. the tag's `package.json` version equals the entry's version (`git show vX.Y.Z:package.json`) — this is
     what catches a tag landing on the wrong commit.
  ⚠️ **The "every version has a summary line" check must not demand a `## vX.Y.Z` heading.** Learned
  2026-07-27 22:05 EDT: a naive exact-heading check reported **23 false gaps**, because `CHANGELOG-SUMMARY.md`
  deliberately folds trivial/docs-only releases into a **range heading** (`## v2.18.0–v2.18.3`) or an inline
  one-line mention. Every one of the 23 was in fact represented. The check must accept heading, range, or
  mention — otherwise it cries wolf on two dozen entries and gets ignored, which is worse than no check.
  ⚠️ When mapping PRs, map by **merge-commit hash**, never by parsing squash subjects: a subject can carry
  two `#N` refs (v2.35.11's real PR is the trailing `#28`) and PRs #1/#9/#10 carry none.
  `gh pr list --state merged --limit 60 --json number,mergeCommit -q '.[] | "\(.mergeCommit.oid[0:7]) \(.number)"'` **These are exactly the "checkable rule → make it a hook/CI job, not more prose"
  case** from the `reference_enforcement_hooks` memory — prose already failed at two of them. Natural fit
  alongside the Vitest/Biome work below, since it needs the same `ci.yml` surface.
- `[P2 · M · Sonnet5-M]` **Expand CI beyond syntax-check.** Added 2026-07-25 18:40 EDT (Harkirat's ask).
  **✅ Sequencing precondition MET 2026-07-27 18:25 EDT — PR
  [#11](https://github.com/HarkiratMangat/diors-builds/pull/11) is MERGED, shipped as v2.35.8.**
  `.github/workflows/ci.yml` now exists on `main` and runs `npm ci` → `npm run check` (`node --check`
  across every non-`node_modules` `.js`) → advisory `npm audit`, triggering on **both `main` and
  `v3-pre-release`**. So this entry is now purely the *expansion* work; the "merge #11 first" step below
  is done. (This bullet previously carried a ⚠️ correction stating there was "genuinely no CI at all on
  `main`" — true when written 2026-07-26 19:06 EDT, false as of the merge. Still true: no test framework
  and no lint config.) **Tool choices decided 2026-07-26 19:06 EDT
  (dotenvx-adjacent tooling discussion): Vitest** for the test framework (fast, near-zero-config, ESM-friendly — a good fit
  given there's no build step) **and Biome** for lint+format (single Rust binary covering both, no
  ESLint+Prettier config sprawl to build from scratch since neither exists here yet). Real unit/integration
  coverage for the higher-risk subsystems (loadout search/fuzzy-match, draw-prices math, pagination) would
  catch real bugs before merge instead of only syntax errors — and `scripts/checkEmojiCaptures.js` (the
  require-time emoji-capture check, see `docs/DEVLOG.md`'s 2026-07-26 16:04 EDT entry) is a natural first
  Vitest test since it already exists as a standalone script. **Sequencing: merge PR #11 first** (or
  rebase this work onto it) — no point building the Vitest/Biome expansion on top of a `ci.yml` that isn't
  on `main` yet. Needs its own session: merge #11, add Vitest + Biome, decide what's worth covering first,
  wire both into `ci.yml`.
  **Also consider `commitlint` in the same pass** (noted 2026-07-26 15:41 EDT while adopting the commit
  convention): the repo has **no** `commitlint`, `husky`, `semantic-release`, `standard-version`, or
  `conventional-changelog` installed — verified, not assumed — so `docs/reference/commit-and-branch-naming.md`
  is enforced entirely by hand. A `commitlint` job in `ci.yml` (or a `husky` `commit-msg` hook) would make
  the subject format machine-checked, matching the "a checkable rule becomes a hook, not more prose"
  strategy in the `reference_enforcement_hooks` memory. Worth weighing the two placements: CI catches it at
  PR time (can't be bypassed, but late), a local hook catches it at commit time (instant, but skippable with
  `--no-verify`). Knock-on: once subjects are machine-parseable, `conventional-changelog` could draft
  `docs/CHANGELOG.md` entries instead of them being hand-written every release — though the hand-written
  entries are currently far richer than a generator would produce, so that part is a genuine tradeoff, not
  a free win.

---

## 🧹 Someday / tech-debt
*Full context lives in `.claude/rules/*.md` (subsystem detail), `docs/reference/known-issues.md`
(accepted gaps), and memory. Model tags re-audited 2026-07-18 against the "tier vs. effort" calibration
(`feedback_suggest_model_switch`) — the three Sonnet5-H items below were downgraded from Opus then:
well-specified execution/polish, not novel design.*

- **🧩 Linksee still derives entity names from PATH SEGMENTS — new sessions can re-fragment**
  `[P3 · S]` 🧩 needs-design (filed 2026-08-02 14:43 EDT). The *data* was repaired (see the resolved
  list — 123 memories re-homed), but the **root cause is untouched**: `map_projects` is empty, the
  server gets `env: {}` in `~/.claude.json`, and there is no config file anywhere, so linksee falls
  back to guessing a project from a folder name. A session touching `~/Library/...` can still spawn a
  junk entity.
  **Standing defence, already in force and sufficient:** recall by `query` (FTS5, crosses entities),
  never by `entity_name`; pass `entity_name` explicitly on every write. Encoded in the skill's
  frontmatter, `reference_tool_capability_tests`, and both MCP stores.
  **Direction if ever picked up:** investigate whether `map_projects` / `recall({scope_to_roots})`
  can be populated to pin a project root, or raise it upstream. Low priority — the defence works and
  the repair is repeatable.

- `[P2 · M · Sonnet5-H]` **The memory index `MEMORY.md` is close to its read limit and needs a
  compaction pass.** Filed 2026-08-01 16:10 EDT at Harkirat's request, after the harness warned during
  the changelog-site work. Measured then: **21.1KB against a 24.4KB read limit** — so it is not a
  tidiness item, it is an approaching failure. Past the limit the index stops loading in full and a
  session silently starts with an incomplete map of memory, which is exactly the class of failure
  `project_memory_slug_migration` exists to prevent.
  The fix is mechanical but must not lose anything: **one line per entry in the index**, detail pushed
  down into the topic files themselves, and genuinely stale or superseded entries merged or deleted
  (several already carry "SUPERSEDED"/"PARKED" markers). Target under 17.1KB.
  ⚠️ **Do not do this as a side-quest inside another task.** It rewrites the file every future session
  reads first; it wants its own session with Harkirat able to see the before/after, and the working
  agreement's no-half-measures rule applies — every pointer that moves has to still resolve.
- `[P2 · S · any model]` **`docs/DEVLOG.md`: a run of dated Part A entries physically sits AFTER the
  Part B ledger.** Found 2026-07-29 11:44 EDT while appending the v2.42.1 entry — I anchored on
  `# Part B — Lessons Ledger` believing it marked the end of Part A, and the TOC check failed on
  ordering. It doesn't: **everything from the first dated heading below the ledger's thematic sections
  through to EOF** is Part-A-style journey prose, even though Part B's own header says *"no dated
  entries"* and the TOC lists them all under Part A. Re-derive the split with
  `awk 'NR>P && /^## 20[0-9][0-9]-/' docs/DEVLOG.md` where `P` is the `# Part B` line — as of filing
  that was 36 entries correctly above it and 19 below, the misplaced run starting at
  `2026-07-27 08:02 EDT`. Almost certainly an append-to-EOF habit that outran the structure. ⚠️ My first
  write-up of this item put the run's start nine entries too late; the `### Lessons` subsections *inside*
  each entry look like ledger sections at a glance. Map it before moving anything.
  **Why it matters beyond tidiness:** the next session appending an entry hits the same trap, and
  `devlog-toc` only catches it as an ordering error *after* the fact — it compares the TOC against every
  `^## 20…` heading in the file regardless of which Part it is in, so the misplacement itself is
  invisible to the audit.
  **The fix is mechanical:** move the contiguous block from the first dated heading after the ledger to
  EOF up to just before `# Part B`, leaving the ledger as the file's last section. Verify with
  `npm run docs:audit -- --only devlog-toc` plus a heading-count comparison before and after — same set,
  same order, ledger last. **Consider adding a check** that no `^## 20` heading appears after the Part B
  marker; that is the invariant this violates and nothing currently states it. 🔗 Bundle-with the
  `[P1 · L]` documentation audit in the Queued section, which already covers "restructure where the file
  has outgrown its shape" — this is a concrete instance of exactly that, recorded here so it doesn't get
  lost inside a large item.
- `[P2 · M · 🧩needs-design · ⛓️blocked-by nothing, just deferred]` **Give the dev bot a real Cloudinary
  write namespace instead of the fail-closed block.** Filed 2026-07-27 18:40 EDT alongside the guard in
  `utils/cloudinaryDevGuard.js` (v2.35.9). The guard currently refuses **every** Cloudinary write when
  `NODE_ENV=development`, which is correct and safe but means the dev bot cannot exercise the image
  workflow at all — a real gap for the v3 items that touch images (`/autobuild`, `/admin` loadout images,
  patch notes). The clean version is a parallel dev namespace, and it is **not uniform across the three
  caches**, which is why it wasn't done inline:
  - `temp_draws` and `patch_notes` bake the folder into the `public_id` (`temp_draws/{slug}`,
    `patch_notes/{id}/{index}`), and their prune sweeps scan by `prefix: ${FOLDER}/` — so dev-scoping the
    `FOLDER` const alone namespaces upload, read, and prune end-to-end. Genuinely easy.
  - **`gun-builds` does not.** Loadout `public_id` is the bare `imageKey`, with the folder carried only in
    `asset_folder` (a decoupled dashboard label). Dev-scoping needs the `public_id` itself prefixed, and
    then `buildImageUrl()` in `utils/loadoutRender.js` has to agree — otherwise dev-uploaded images 404 on
    render while prod-existing ones still resolve, which is a confusing half-working state.
  Do this when a v3 feature actually needs dev-side image writes, not preemptively. Alternative worth
  pricing at the same time: a separate free Cloudinary account for `.env.dev`, which is cleaner but makes
  every existing loadout render broken in dev (their URLs live in Mongo pointing at prod).
- `[P3 · XS · Harkirat action, not a build]` **Revoke the now-dead `RENDER_API_KEY`** (and `RAILWAY_TOKEN`,
  confirmed same dead-credential status). Filed 2026-07-27 20:20 EDT, downgraded P1→P3 2026-07-27 23:23 EDT
  (Harkirat: "not concerned about the render/railway keys"). Confirmed 2026-07-27 23:23 EDT: **zero code
  references** to either var anywhere in `commands/`, `utils/`, `models/`, or `index.js` — only `.env`
  itself and historical docs mention them, so revoking carries no code risk whenever it happens. Revoke
  in each dashboard (Render: Account Settings → API Keys; Railway: Account Settings → Tokens), then drop
  both lines from `.env` locally and on the VM. No longer time-sensitive.
- `[P3 · XS · Harkirat action, not a build · ⛓️blocked-by:/help command]` **Update the bot's Discord
  Developer Portal listing** (filed 2026-07-18, notes) — description, name, and banner image. Folded
  into v3 2026-07-27 23:23 EDT (Harkirat's call) — downgraded from a standalone P1 since the description
  rewrite depends on `/help` shipping first. Pure Discord Dev Portal task, not something Claude has UI
  access to do.
  ⇄ Also on `docs/ROADMAP.md`'s v3 list (canonical scope/dependency detail).
- `[P3 · S · Harkirat decision first, then Sonnet5-M]` **Commit attribution: back-catalogue is unclickable**
  *(filed 2026-07-27 11:10 EDT)* — every Diors-Builds commit made before 2026-07-27 11:10 EDT carries
  `Dior <diorswrld@discord.com>`, which is not a verified address on the GitHub account, so GitHub renders
  the author as flat text with no profile link. Verified via
  `gh api repos/HarkiratMangat/Diors-Builds/commits --jq '.[].author.login'` → `null`. **Already fixed
  going forward**: the global git identity is now `dior <21996007+HarkiratMangat@users.noreply.github.com>`
  (see memory `feedback_git_commit_identity`), so all NEW commits link correctly — this item is only about
  the existing history. Fixing it means a `filter-repo`/`filter-branch` rewrite of every pushed commit:
  all SHAs change, the GCP VM pulls from this repo, and the 37 backfilled version tags would need
  re-pointing. Cosmetic benefit vs. real blast radius — decide whether it's worth it at all before
  scoping a session.
- `[P2 · M · Sonnet5-H]` **General housekeeping session** — delete leftover `*.bak-*` config backups, sweep
  stale absolute paths, dead-code / stale-comment / unused-dependency review, decide `/patch notes` carousel
  component-count chunking.
  ⇄ Also on `docs/ROADMAP.md`'s **v5** list (version horizon).
- `[P3 · S]` **Tool-discovery session (filed 2026-07-26 19:32 EDT)** — deferred by Harkirat's own request
  during a dotenvx-adjacent tooling discussion, not yet scoped for a session. Candidates raised: `procs`
  (modern `ps`, ties to the recurring stray-`node`-process hunt in `feedback_multiple_bot_instances`),
  `git-delta` (nicer `git diff`/`show`), `zoxide`, `hyperfine` (ties to the "Pagination perf" item below),
  Knip (automates the unused-file/dependency audits already done by hand at least twice), `act` (run
  `ci.yml` locally once PR #11 merges), and a free-tier uptime/status-page service tying into the deferred
  `/status` command + vmstatus overhaul. Nothing decided — just don't lose the list.
- `[P2 · M · Sonnet5-H]` **Pagination perf hybrid** — single `UPDATE_MESSAGE` for the light string-building
  commands; keep defer-then-patch for heavy/attachment paths. Cross-cutting (touches every paginated
  command) but the design itself is ALREADY decided (see `docs/reference/known-issues.md`) — what's left is
  careful, well-specified execution across call sites, not open design work.
  ⇄ Also on `docs/ROADMAP.md`'s **remaining-v2** list as "Pagination double round-trip perf fix" (horizon only — the design detail above is canonical).
- `[P2 · XS · Sonnet5-L]` **Verify Cloudinary folder organization** — *(new 2026-07-18, notes L59)* read-only
  check that draw thumbnails land in `temp_draws/` and patch-notes images in `patch_notes/{patchId}/` as
  designed; Harkirat noticed assets that look like they're in the main folder. Escalate to a 🐞 bug above
  only if confirmed. Also tracked in `docs/reference/known-issues.md`.
  ⇄ Also on `docs/ROADMAP.md`'s **v5** list (version horizon).
- `[P3 · M · Opus5-M · ⛓️blocked-by:token budget]` **Full DEVLOG backfill from prior chat transcripts** —
  retrieve the old transcripts and merge their reasoning into DEVLOG's Part A/B.
  ⇄ Also on `docs/ROADMAP.md`'s **v5** list (version horizon).
- `[P3 · M · Opus5-M]` **Write a user-friendly bot/ops guide** — *(new 2026-07-18, notes L34)* a rich but
  noob-friendly how-to for operating the bot end-to-end (GCP VM, hosting, deploy flow, status/logs), so
  Harkirat can self-serve. Distinct from `docs/reference/deployment-and-ops.md` and the terse
  `reference_vm_bot_commands` card. ("Not anytime soon.")
  ⇄ Also on `docs/ROADMAP.md`'s **v5** list (version horizon).
- `[P3 · M · Opus5-M]` **Ship the redesigned changelog artifact** — the "Armory Terminal" visual, paused.
  ⇄ Also on `docs/ROADMAP.md`'s **v3** list (version horizon).
- `[P3 · XS · Sonnet5-L · 🔗bundle-with next VM/ops touch]` **Guest disk-usage peaks in `scripts/vmpeaks.sh`**
  — small add mirroring the new `rampeak()` now that the Ops Agent (2026-07-17) provides the metric.
  🔗 Natural bundle with the Render-deletion reminder above, which is also a VM/ops touch.

### 🧮 `scripts/docs-audit.mjs` — the limits it does NOT cover (filed 2026-07-29 02:10 EDT, v2.42.0)
*These are the honest edges of the documentation audit, filed so a future session improves the program
rather than rediscovering them. **None is a bug** — each is a known boundary that the audit states in
its own output on every run. Read `.claude/rules/scripts-and-migrations.md` first; run
`node scripts/docs-audit.mjs --list` for the live check roster.*

- `[P3 · L · 🧩needs-design]` **Nothing verifies a changelog entry DESCRIBES what shipped.**
  `version-sync` proves the number matches `package.json` and `hash-chain` proves the commit resolves,
  but an entry saying "fixed the parser" for a change that broke it passes every check. Content
  accuracy is the largest uncovered surface. Plausible direction: compare an entry's claimed scope
  against the diff's touched paths and flag entries that mention subsystems the diff never touched —
  cheap, coarse, and would have caught real cases. Anything stronger needs a model in the loop.
- `[P3 · L · 🧩needs-design]` **The audit is a WHITELIST of failures that already happened.** Every
  check encodes a past mistake, so a genuinely new *category* of drift has no check by construction.
  Nothing currently notices "this doc has not been touched in N releases while its subsystem changed
  every one of them". A staleness-by-correlation check (doc mtime vs. the code it documents) is the
  most promising generic detector and does not exist.
- `[P2 · M]` **A PR opened in the GitHub web UI fires NO local hook.** CI still runs the tree checks,
  so those hold — but `records-close-check.sh` (notes file + memory closure) is session-scoped by
  nature and never runs. That path is genuinely unguarded today. Fix direction: a GitHub Action that
  posts a PR comment listing the open notes items and whether memory was written since the branch
  point. It cannot *block* on judgement, but it can put the question in front of a human.
- `[P3 · S]` **`xref`'s bare-filename half is WARN-only, and must stay that way until gitignored files
  are resolvable.** Gitignored files are working-tree-LOCAL: `docs/Harkirats-Space.md` resolves in the
  main tree and not in a worktree or fresh clone, so "missing" and "not here right now" are genuinely
  indistinguishable. A tracked manifest of expected-but-ignored paths would let this become an ERROR.
- `[P3 · S]` **`archive-conservation` traces items by a 6-word fingerprint**, so an item reworded
  heavily during a sweep reports as untraceable (WARN, by design). Fine in practice; worth revisiting
  if the false-positive rate ever becomes annoying enough to be ignored.
- `[P3 · XS]` **`root-docs` reports a VACUOUS PASS on `main` until `LICENSE`/`NOTICE` land** from the
  `docs/license-terms-privacy` branch. Expected and self-correcting — noted so nobody "fixes" it by
  deleting the check.

---

## 🚫 Decided-no — don't re-raise
*Standing calls that stay VISIBLE here (rather than moving to the archive) precisely so a future session
doesn't re-open them as if they were new.*

- **Dependabot vulnerabilities** — tracked, decided not worth acting on. Rationale:
  `project_dependabot_vulnerabilities_deferred` memory.
- **A maintained ToC for `CHANGELOG.md` / `DEVLOG.md`** — Harkirat's explicit call: their headers are
  already uniform and grep-able. The archive-split reminder above is the accepted lever instead.
