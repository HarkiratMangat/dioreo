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

- **⏰ 2026-08-09 17:00 EDT — CLOSE OUT the 7-day MCP observation window** `[P2 · M]` 🧩 needs-design
  (opened 2026-08-02 17:00 EDT). `sequential-thinking` is **UNRESTRICTED for the window** to answer a
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

- **🧠 Distil the linksee auto-capture queue, and declare a North Star** `[P2 · S]`
  (filed 2026-08-02 19:05 EDT). **19 auto-captured memories are still RAW USER UTTERANCES.**
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

- `[P1 · L · 🧩needs-design · Opus5-H]` **Rebuild Contributing and Contributors as two DISTINCT pages.**
  *Filed 2026-08-02 01:10 EDT. Direction chosen and mockup approved by Harkirat — this is a build, not
  an exploration.* They currently share `warmShell()`; the decision is that they stop sharing it and
  become their own things, sharing only header, footer and tokens.
  - **Approved mockup: `local/site-redesign/mockup-v1.html`** (gitignored, open it directly).
    **Contributing = "The Interchange"** — four ways in (bug report · security · idea · code) on
    tinted lanes, converging on one shared track that ends at *merged & credited*. The route DIAGRAM is
    the page's spine. **Contributors = "The Plate"** — an engraved steel plate, screwed down, maker's
    mark at the top, rows engraved beneath.
  - ⚠️ **NODES, NEVER NUMERALS on Contributing.** `warmShell()`'s rule is "no numbers anywhere — the
    number series is what tells a reader *these bind you*". A step sequence would *earn* numerals
    semantically, but they are the legal set's signature and an invitation must not borrow it. Harkirat
    was shown this conflict and the node form was kept.
  - **Three open questions, deliberately carried here rather than answered:**
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
  first a **shortlist of candidate surfaces with a recommendation**, not an implementation. Bundles
  naturally with the scrollspy item above, which is the most obvious candidate surface.
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
  `[P3 · S]` 🧩 needs-design (filed 2026-08-02 15:50 EDT). The *data* was repaired (see the resolved
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
