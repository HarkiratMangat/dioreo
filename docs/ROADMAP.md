# 🔮 Dior's Builds — Roadmap (Next Planned Work)

*The authoritative roadmap for the project — moved here from CLAUDE.md's "Next planned work" section on
2026-07-22 13:27 EDT as part of the CLAUDE.md modularization (see
`docs/superpowers/specs/2026-07-22-claude-md-modularization-design.md`). The `🔮 Planned & Upcoming`
section in `docs/CHANGELOG.md` and the `🔜 Coming soon` section in `docs/CHANGELOG-SUMMARY.md` are
synced VIEWS of THIS file — update all three together, or they drift.*

*Implemented subsystems that used to live under this section now live in path-scoped rules: the built
`/autobuild` PoC + Vertex migration → `.claude/rules/autobuild.md`; the Cloudinary structured-metadata
system → `.claude/rules/loadout-images-and-metadata.md`. The `/autobuild` FOLLOW-UP items (for the next
autobuild session) are documented at the end of `.claude/rules/autobuild.md`.*

*Items carry the `[Priority · Effort]` tag system (full spec: `reference_priority_tier_system` memory; quick
legend atop `/Applications/Claude Code/meta-deferred-list.md`, mirrored in `docs/db-deferred-list.md`).
**Priority** P0 now → P3 someday; **Effort** XS→L
(with model+effort for real builds); flags 🔗bundle-with 🧩needs-design ⛓️blocked-by. The near-term **v2**
items below are tagged individually. **Version horizon already implies priority — v3 ≈ P2, v4/v5 ≈ P3**
unless explicitly promoted — so those aren't per-item tagged. The deferred maintenance/tech-debt long-tail
(after v5) is priority-tagged in **this project's own** `docs/db-deferred-list.md` (split out of the
cross-project tracker 2026-07-25 15:56 EDT, renamed 2026-07-25 21:43 EDT), not duplicated here — as are
this project's confirmed bugs and reminders.*

### Process / tooling (not a version-numbered feature, tracked here for visibility)
- ~~**Git branch/PR/merge workflow overhaul**~~ — **SHIPPED as v2.33.0** (the inaugural dogfood
  squash-merge on `feat/git-workflow`). Replaced the old "everything on `main`, push = version bump"
  model with Branch → Commit → Push → PR → Merge → Deploy; version now mints at merge (squash), not
  push. Design: `docs/superpowers/specs/2026-07-24-git-branch-pr-workflow-design.md`; canonical
  description: memory `project_git_workflow.md`. (Notes file L138, PRIORITY #2 — filed by Harkirat
  2026-07-24 11:29 EDT, marked shipped in-file once this merge actually lands.)
- `[P3 · M · ⛓️blocked-by nothing, just deferred]` **Auto-deploy on merge** (GitHub Action/webhook →
  VM `git pull` + restart) — considered during the workflow-overhaul design and explicitly REJECTED
  for the initial rollout: it's real new infra, and it complicates `deploy.sh`'s deliberate-vs-crash
  restart-reason labeling (the `.restart-reason` marker assumes a human or script running `deploy.sh`
  directly, not a webhook firing unattended). Deploy stays a manual, separate, per-merge-optional step
  for now (a merged version can sit undeployed indefinitely, docs-only being the obvious case). Revisit
  only if the manual step becomes an actual friction point, not preemptively.

### Remaining v2 items (near-term, not yet started — filed 2026-07-14 from Harkirat's plan-notes file)
- `[P2 · M]` **Pagination double round-trip perf fix** — already in "Known open issues" above; deferred,
  cross-cutting (touches every paginated command), do when Harkirat greenlights it.
- ~~**Actually disable expired buttons, not just reply with a message**~~ — **SHIPPED for `/settings`
  2026-07-18, deployed live to the VM 2026-07-19** (confirmed via `scripts/vmstatus.sh`). ⚠️ Harkirat
  has NOT yet live-tested the actual 10-minute idle behavior itself (open `/settings`, leave it alone
  for the full window, confirm the buttons go dead with zero clicks) — deployed ≠ behaviorally
  verified, don't conflate the two. See "Passive idle-timeout auto-disable" in the "Panel interaction
  locks" section above for the shipped design (`utils/passiveExpiry.js`) — a passive, sliding
  10-minute idle `setTimeout` per message, not a click-triggered check.
- `[P2 · M · 🧩needs-design]` **Extend the same passive auto-disable pattern to more commands** —
  draws/calendar/drawprices/loadouts have NO expiry/auto-disable at all today, unlike `/settings` now.
  Extending `utils/passiveExpiry.js`'s `schedulePanelExpiry` to their own render/re-render sites is the
  mechanical part; the open design question is whether 10 minutes is the right window everywhere or
  whether some commands should use a different duration (no Discord-imposed ceiling forces any specific
  number — see `docs/reference/known-issues.md`).

**Second batch of v2 items (filed 2026-07-15 from the plan-notes file).** These ship to `main`/live
NORMALLY even while v3 pre-release work runs in parallel — see the parallel-track note in
[[project_dior_builds_changelog_system]]; each one also gets cloned into the v3 branch once it exists.
**7 of the original items in this batch shipped in v2.21.0** (2026-07-18): `/timestamp` `format`→`view`,
`/settings`' `hidden` option, the mobile description trim, short/partial loadout search, the reworded
action-blocked message, admin override on panel action-blocks, and the View Colors download buttons —
see CHANGELOG.md's v2.21.0 entry and the relevant CLAUDE.md sections (Panel interaction locks, View
Colors panel, `/timestamp`'s view option) for what actually shipped. Still open from this batch:
- `[P2 · L · Opus4.8-H · 🧩needs-design]` **View Colors: extract a wider variety of colors** — juul's avatar
  (`local/juuls profile picture.png`) returned only 6 instead of the requested 8 AND missed a genuinely
  useful yellow; assume one root cause for both. **Keep existing behavior for genuinely minimal images**:
  juul's banner (`local/juuls banner.png`) correctly returned 4 on a single page — 2-4 colors on one page
  must stay the outcome for low-variety sources, NOT be padded out to a quota. See the k-means section in `.claude/rules/accent-and-colors.md`
  (over-clustering at K=1.5× and the 30-RGB merge step are the likely levers; the determinism
  requirement is non-negotiable — Refresh's change-detection depends on it). **Own session, Opus 4.8
  high** — real algorithmic work, not a filing item.
- `[P2 · S · 🔗bundle-with personality pass]` **View Colors: always show the Display Name / Nameplate / Deco
  pages even when unset/no Nitro** — instead of hiding them, render a humor/"bully" page (no colors shown).
  Ties into the personality direction in the v3 list below.
- ~~**Pagination loop-back**~~ — **SHIPPED v2.28.0 (2026-07-21); the 2-page case CRASH-FIXED in v2.30.2
  (2026-07-21).** `buildPaginationRow` wraps last→first / first→last for 3+ pages and never disables
  those arrows. **⚠️ The original "loop at EVERY page count including exactly 2" was a bug, not a
  feature** — at exactly 2 pages the page-based (`makeCustomId`) arrows both targeted the one other
  page, producing an IDENTICAL custom_id that Discord rejects, taking down the whole render on
  `/draws`/`/calendar`/`/settings`/View Colors/`/alerts` (found live 2026-07-21). v2.30.2 clamps +
  disables the boundary arrow at exactly 2 pages on that path; the legacy direction-encoded path
  (loadout cards) still loops. So the "2-page redundant-arrows should revert to disabled?" question is
  now ANSWERED (reverted, forced by the crash) — the only remaining option is the cosmetic single-toggle
  alternative. See the `buildPaginationRow` note under "Shared UI builders" for the full mechanism.

**Third batch of v2 items (filed 2026-07-18 from the notes file — Harkirat's 2026-07-17 intake).** Same
parallel-track rule as the second batch (ship to `main`/live normally, clone into the v3 branch once it exists).
**The `/manage` `section`→`data_for` rename also shipped in v2.21.0** (2026-07-18) — see the Command
architecture section's `/manage` note. Still open from this batch:
- ~~**`/manage` loadout data-entry UX overhaul**~~ — **SHIPPED 2026-07-18, deployed live to the VM
  2026-07-19** (confirmed via `scripts/vmstatus.sh`). ⚠️ Harkirat has NOT yet live-click-tested the actual
  `/manage` loadout flow in Discord — admin-only impact, so he's deliberately continuing other work
  first; deployed ≠ behaviorally verified. Added a "How Images
  Work" info block to both Loadouts pages, clarified the Add/Edit Loadout modals' field labels + placeholders
  (attachments now has an example; the Cloudinary Image Key field explains the real convention), and — the
  real meat — a genuine live Cloudinary existence check (`utils/loadoutRender.js`'s `checkImageExists()`) that
  now warns in the confirmation message if a saved image key doesn't resolve to anything, on Add/Edit/Bulk
  Add alike. The Cloudinary mystery itself is now fully documented with the ACTUAL confirmed workflow (verified
  live against the account, not guessed) — see the new "The Cloudinary image workflow, finally documented"
  subsection under "MP loadout system" above for the full writeup, including the root cause (Cloudinary
  assigns the Public ID from the uploaded file's own name unless renamed — confirmed via still-unrenamed
  `IMG_XXXX` assets sitting in the live `gun-builds` folder).
- `[P2 · M · 🧩needs-design]` **Much richer in-bot logging/tracking** — right now when something breaks it's
  hard to tell WHICH component failed and why. Add granular internal logging so failures are attributable.
  Related-but-distinct from the webhook-alerting heavy half (per-alert IDs / downloadable text-log — see
  "Deployment & Ops (GCP)") and the v3 `/admin` DB-change audit log: this one is about internal diagnostic
  logging, not user-facing alerts. Scope at build.
- `[P2 · S]` **Admin `/status` command** — surface VM health/metrics in-bot (a mini ping test: is the bot
  holding up, gateway state, RAM/CPU, restart count), admin-only, building directly on `scripts/vmstatus.sh` /
  `scripts/vmpeaks.sh`, which already compute all of this — so checking the bot doesn't require asking Claude
  to run a script. (Notes item L60.) **UN-BUNDLED 2026-07-20 and still deferred** — it was originally
  queued alongside the webhook-alert improvements, but when that session started Harkirat chose to defer
  `/status` on its own ("unsure of its usability at the moment, don't want to spend time on it right now").
  The webhook half **shipped without it** (v2.26.0, see `docs/reference/deployment-and-ops.md` — the alert store
  now exists, so a future `/status` CAN read severity counts / last-error from `utils/alertStore.js`'s
  `getAlertSummary()` if it's ever built). Note the earlier plan for `/status` to read historical CPU/RAM
  peaks needs the keyless-ADC + Cloud Monitoring path (see `utils/visionExtract.js`'s token fetch); live VM
  state (systemctl/gateway/RAM) needs no such thing and no journal permission (gateway state comes straight
  off `client.ws`). Revisit as its own session if/when Harkirat wants it.
- ~~**`/manage` accent colors**~~ — **SHIPPED 2026-07-20.** See "`/manage` per-page accent colors" under
  `.claude/rules/manage-panel.md` for what actually landed — it ended up as real sampled colors
  off the Legendary-rank and DMZ emoji assets (via the bot's own `getDominantColor()` pipeline), not
  invented hex values.

### v3 (next MAJOR version) — roadmap (filed 2026-07-14 from Harkirat's plan-notes file)
Harkirat's own planned feature set for the next whole-number version. **Not started; nothing here is a
committed design yet** — these are captured intents to brainstorm/spec properly when each is picked up.
Some overlap (noted inline). The v3 branch / pre-release-versioning / test-bot strategy lives in
[[project_dior_builds_changelog_system]], not repeated here.

**Filed 2026-07-21 from the notes scratchpad (new intake, not yet designed):**
- **Multi-user admin access (provide/revoke).** Let Harkirat grant/revoke selected users access to some or
  all admin-level commands. **Store the allowlist in MongoDB, not hardcoded** (decided 2026-07-21) — it must
  be editable at runtime (grant/revoke with no code change + redeploy); hardcoding the IDs would make every
  access change a deploy. The current single-admin `ALLOWED_ADMIN_ID` const stays as the ultimate owner; the
  Mongo allowlist layers on top. Ties into the `/manage` → `/admin` restructure below.
- **"Recommended" loadout badge** — for weapons with multiple build variants; the recommended build always
  renders FIRST in pagination order. (New badge alongside the existing Meta/Toxic/rank badges — see the MP
  loadout badges in `.claude/rules/loadouts.md`; a weapon-level or per-build flag, decide at design.)
- **"Troll Build" badge** — for joke/silly builds. Emoji provided: `<a:TrollBuild:1529192136208154725>`.
  Independent flag like `isToxic` (see `buildBadgesLine()`).
- **Optional paginated multi-weapon loadout view** — browse many weapons in one paginated view with
  thumbnails + category-switch controls; for multi-build weapons show the "Recommended" build. **Overlaps the
  `/meta` and `/loadout` consolidation items below** — reconcile into one shape at design time, don't build
  three separate paginated browsers.
- **Partial "hot-reload" of a pushed file** — a way to make a pushed code change go live WITHOUT a full VM
  redeploy each time (its own design session — Node doesn't hot-swap `require`d modules trivially; realistic
  options are a watch-and-restart, a targeted module reload, or accepting the current `deploy.sh` restart as
  already fast). Scope when picked up.
- **`/meta` command** — view all weapons marked Meta. Options `mode:MP/DMZ`, `category:AR/SMG/...`,
  same hidden/ephemeral option as others; visibility tied to the `loadoutVisibility` toggle. Paginated
  through each meta build (a weapon's multiple builds shown in order, then the next weapon); in-panel
  dropdown to jump to a specific meta weapon; category-switch buttons below the embed; per-category
  accent color (reuses `getMpCategoryAccent()`); badges (incl. the Meta badge itself) hidden from this
  view. **NOTE: overlaps with the `/loadout` meta subcommand idea below — likely the same feature
  reached two ways; reconcile at design time rather than building both.**
- **Draw cost calculator** — given the user's CP region, draw type, attempts already done/remaining,
  and current CP balance: compute cost to finish the draw, and suggest the top-up package needed if the
  balance is short. Builds on `/draw prices`' existing per-pull `DRAW_DATA`.
- **Rename `/manage` → `/admin`, with slash-command-driven actions ALONGSIDE the existing panel.** Keep
  the interactive dashboard embed, but also support: `/admin` (opens dashboard), `/admin command:{x}`
  (opens dashboard on that command's page), `/admin command:{x} action:{y}` (opens that action's modal
  directly — add / bulk add / export new-or-returning draws / purge / etc.). The `action` choices must
  be scoped to only the actions valid for the chosen `command`, not a flat list of every action across
  all commands. Examples: `/admin command:loadouts action:add`, `/admin command:loadouts action:export
  SMGs hidden:false`, `/admin command:draws action:bulk delete`, `/admin command:season
  titles-&-deadlines` (no action — always just opens the modal). Also bundle in an internal DB-change
  logging/tracking system (log edits made via the admin command — e.g. a draw's info being edited).
- **`/settings` jump-to options** — `/settings customize:visibility|preferences|colors hidden:…` to
  land directly on page 1 (visibility), page 2 (preferences), or open the colors menu directly.
- **Detach `/colors`'s visibility from `/settings`** — give `/colors` its own visibility preference
  (while keeping the "View Colors" button ON the settings panel tied to settings visibility), and add
  `/colors` visibility toggles into the settings page.
- **Consolidate MP loadout commands into one `/loadout weapon:{fuzzy autocomplete}`** (leave `/dmz`
  as-is, already consolidated). Ideally one command that can search ALL weapons OR be scoped to a single
  category. Plus a **meta subcommand**: an embed listing just Meta-marked weapons, a dropdown to pick one
  (option description = category / main use-case, TBD at build), and pagination for multi-build weapons.
  (Overlaps with the standalone `/meta` above — pick one shape.)
- **Update/add new builds + audit current loadout data** so it's current with the live season.
- **Different view options for the slash commands** (unspecified in the notes — expand when picked up).
- **Ship the redesigned changelog artifact** (personal-use release-log visual — see
  [[project_changelog_redesign]], currently paused).
- **A `/help` command** (filed 2026-07-15) — detail the bot's commands/features, and reference the
  command in the bot's own Discord description so people can find it. **Must include a way to contact
  Harkirat** (filed 2026-07-18, notes) — his Discord, in case a user found a bug or wants to request
  something. Fold this in as a requirement of the same command, not a separate feature.
- **Privacy Policy / Terms of Service** (filed 2026-07-18, notes) — `[P1 · S]`. The bot stores real
  personal data (Discord IDs, extracted avatar/banner/decoration/nameplate colors, saved preferences)
  in MongoDB — a privacy policy is good practice now and becomes an actual Discord REQUIREMENT once
  verified / past the v4 guild-install 100-server threshold (same threshold that already gates the
  privileged MESSAGE CONTENT intent, see v4 below). Needs: a hosted page (could be a simple static
  page, doesn't need to live in this repo), links added in the Discord Developer Portal's
  Terms of Service / Privacy Policy URL fields, and a decision on what it actually needs to disclose
  (ties directly into the usage-analytics item below — if that ships, the policy needs to cover it).
- **Urban Dictionary integration, a `/define` command** (filed 2026-07-18, notes, "lmao") — `[P3 · S]`,
  pure fun/personality, not CODM-related. Someday-bucket, no urgency.
- **Richer usage analytics/telemetry** (filed 2026-07-18, notes) — `[P2 · M · 🧩needs-design]`. Distinct
  from the already-filed "richer in-bot diagnostic logging" below (that one is about FAILURE
  attribution; this is about USAGE — who ran what command, when, how often, and ideally a sense of
  how people actually navigate a command/feature (e.g. do they use the dropdown or retype the slash
  command). Needs design: what's tracked, where it's stored, retention, and — important — this is
  exactly the kind of data a Privacy Policy (above) needs to disclose, so these two should ship
  together or in the right order, not independently.
- **Personality pass: "bully people who are broke"** (filed 2026-07-15, Harkirat's words) — a silly
  running gag to give the bot some character. No fixed home yet; sprinkle it in as we go. Already has
  two concrete landing spots picked: the unset Display Name/Nameplate/Deco humor pages (v2 list above)
  and the reworded action-blocked message (v2 list above). Keep it light/jokey, never actually mean.
- **Announcement feature** (filed 2026-07-18, notes L64) — a `/manage` (`/admin`) dropdown → modal where
  Harkirat writes an announcement. If a NEW announcement exists, the next time each user runs ANY command the
  bot replies to their command AND follows up once with an embed of the announcement; it's never shown to
  that user again until the next announcement is posted. Needs a per-user "last-seen announcement" marker (a
  `UserPreference` field) plus the announcement text/timestamp on `SeasonalData` or its own doc. Use case:
  "sorry the bot was down today — we've moved to much better hosting." Follow-up embeds must go through the
  interaction-response mechanism (this bot has zero standing guild permissions — see the user-installed-only
  invariant in root CLAUDE.md), same constraint "Show Everyone" already works within.
- **Easy bot sharing / `/invite`** (filed 2026-07-18, notes L58) — a first-class way to share / user-install
  the bot. Sharing the raw install URL is awkward, and in servers where user-apps are blocked every bot reply
  is ephemeral, so you can't even tell someone to click the bot's name → "Add App". Need a share path that
  works in those blocked-context cases AND is shareable OUTSIDE Discord entirely (a link/page). A `/invite`
  command is the obvious start but hits the blocked-user-apps wall — solve for that case too. Relates to the
  v4 guild-install direction, which would change the sharing story again (reconcile at design time).

### v4 — roadmap (filed 2026-07-15, further out than v3; nothing designed yet)
- **Ship as a GUILD-INSTALL bot with text/prefix commands** — e.g. `d b ak117` ("dior build ak117"),
  plus a manually-settable per-server prefix. Commands like the prefix-setter should be
  server-EXCLUSIVE (the slash version only appears in a guild, never in a DM).
  **⚠️ This breaks the single biggest architectural assumption in this file** — see "This bot is
  user-installed only — it is NEVER a guild member with roles/permissions" above. That whole section
  becomes false under v4, and things it explains (the `50001 Missing Access` wall, why "Show Everyone"
  had to route through the interaction-response mechanism instead of a channel POST) would change.
  Re-read and rewrite that section as part of v4, don't leave it contradicting reality.
  **Discord Dev Portal changes required** (confirmed 2026-07-15): enable Guild Install in the portal's
  Installation settings, add `setIntegrationTypes([0, 1])` to commands, and — the big one — enable the
  **privileged MESSAGE CONTENT intent**, which needs Discord's approval once the bot passes 100 guilds.
  Real guild membership with View Channel / Send Messages also becomes a genuine requirement.
- **User-submitted loadouts, gated behind Harkirat's manual review** — a submission never goes live
  until he approves it. Needs a review surface where he can Deny / Accept / Accept-with-edit each
  submission (likely an extension of the `/admin` panel from v3).
- **Semi-automate seasonal data retrieval from Harkirat's leaker announcement channel** (filed
  2026-07-18, notes, moved from a "v5 maybe" to v4 since it likely NEEDS the same privileged MESSAGE
  CONTENT intent v4 already requires above) — `[P3 · L · 🧩needs-design]`. Today Harkirat manually reads
  a Discord channel where a group of "leakers" relay CODM news/leaks/updates and hand-enters it all into
  `/manage`. Wants the bot to help retrieve/parse that instead. Real open questions: filtering/refining
  informal leak text into structured data, and — critically — a moderation/approval step so nothing
  auto-publishes unverified. Likely shares infrastructure with the "User-submitted loadouts" review
  surface above (both are "something comes in, Harkirat approves before it's live").

### v5 — roadmap (filed 2026-07-15, most speculative; explore properly when picked up)
- **Generate the gunsmith image + share code ourselves, removing the manual-screenshot requirement.**
  Given a weapon + its attachments, the bot builds the image and the Gunsmith code, then stores it in
  Cloudinary. Groundwork this needs: teach the gunsmith CODE structure, teach the gunsmith LAYOUT
  design, and supply the base no-attachment gunsmith page for each weapon (they differ per weapon).
  Harkirat's own note: explore the idea further at v5 time — this is a research spike, not a spec.
- **User-built custom gunsmiths in-bot** (depends on the above working). Pick weapon → pick that
  weapon's available attachments → generate image → share/download. Plus a "my builds" command to save
  and view custom loadouts, merged INTO `/loadout` results for that specific user when they search
  that weapon — but visually distinguished so a custom build is never mistaken for one of the bot's
  own official builds.

- **Write a detailed, user-friendly bot/ops guide** (added 2026-07-18, notes L34 — Harkirat's request, "not
  anytime soon"). A rich but noob-friendly, clean, well-organized, nicely-worded doc covering how to operate
  the bot end-to-end: accessing/managing the GCP VM, where + how it's hosted, the deploy flow, checking
  status/logs/metrics, the whole backend — so Harkirat can maintain it himself instead of relying on Claude
  for every operation. Distinct from CLAUDE.md (architecture/design truth aimed at Claude) and from
  [[reference_vm_bot_commands]] (a terse command card) — this is a human operator's friendly how-to guide.
- **Verify Cloudinary folder organization** (added 2026-07-18, notes L59) — confirm the designed folder
  separation is actually happening in the live account: draw thumbnails in `temp_draws/`, patch-notes images
  in `patch_notes/{patchId}/`, loadouts by bare key. Harkirat noticed assets that "look like they're in the
  main asset folder," and that secondary-weapon files don't follow the old strict Excel-era naming.
  Investigate whether that's a real discrepancy (→ then file as a bug) or just how the Cloudinary UI groups
  them. Read-only check via the Cloudinary MCP/dashboard; low priority, no code unless a real problem surfaces.

- **General bot/code housekeeping session** (added 2026-07-15, Harkirat's request — "at some point
  soon", not urgent). A dedicated pass for accumulated cruft rather than doing it piecemeal mid-feature.
  **Most of this batch DONE 2026-07-20:**
  - ~~Delete leftover config backups~~ — DONE: both `.claude/settings.local.json.bak-20260715-110452`
    and `~/.claude/settings.json.bak-20260715-102110` deleted, after confirming the current settings
    files they back up still parse as valid JSON.
  - ~~Audit for other stale absolute paths~~ — DONE, came back clean: no live config/code references
    the pre-relocation path anymore. The only remaining `/Applications/Diors-Builds` mentions are
    historical incident narrative in `docs/SESSION-START.md`/`CHANGELOG.md`/`DEVLOG.md`, correctly
    describing the past hook bug, not stale active paths. **Note: the memory store staying at the
    `-Applications-Diors-Builds` slug is NOT part of this — it's deliberate and move-proof, see the
    canonical-memory-path note at the top of this file.**
  - ~~General dead-code / stale-comment / unused-dependency review~~ — DONE. Found and fixed 2 real
    items: (1) the unused top-level `mongodb` npm dependency (declared in `package.json` but never
    directly `require()`'d anywhere — only `mongoose`, which bundles its own driver, is actually used)
    — removed via `npm uninstall mongodb`, confirmed `mongoose` and every touched command module still
    load fine, `npm audit` unchanged (same pre-existing tracked discord.js/undici/xlsx findings, nothing
    new). (2) `index.js`'s Express "keep-alive" HTTP server (the old "PHASE 1" banner) — existed purely
    to stop Render/Railway's free tier from idling the bot; confirmed dead now that the bot's been on
    the GCP VM under systemd since 2026-07-17 (doesn't idle/spin-down), and nothing else in the repo
    referenced that endpoint or port 3000. Removed (code + the now-unused `express` dependency) with
    Harkirat's explicit confirmation first, since it's a live-runtime change, not pure repo hygiene. A
    breadcrumb note was left where "PHASE 1" used to sit, same convention as the existing removed-
    "PHASE 5" note further down in `index.js`, so the phase numbering (now starting at 2) doesn't read
    like something's missing. Checked every `utils/*.js` file for orphaned/unreferenced files — none
    found.
  - **Still open:** revisit whether `patchnotes.js`'s media carousel needs the component-count
    chunking `draws`/`calendar` have (see "Known open issues") — not touched this pass.
- **Single-instance guard for the bot itself** (added 2026-07-13 to the to-do list, Harkirat's
  request — do later, not urgent). This is a single-token bot; multiple concurrent instances collide
  badly (see the Branch-testing-discovery note in `.claude/rules/accent-and-colors.md` and `[[feedback_multiple_bot_instances]]`).
  Add a startup lock / refuse-to-start-if-already-connected mechanism so a stray leftover local
  `node index.js` can't silently race the deployed Render instance again. Until this exists, killing
  stray local instances is a manual step in the push flow.
- **Split `index.js` into per-subsystem handler modules** (filed 2026-07-22 13:55 EDT, during the CLAUDE.md
  modularization — Harkirat explicitly invited evaluating this; deliberately NOT done in that docs-only
  session because it's a live-bot code refactor, a different risk class). `[P2 · L · Opus4.8-H · 🧩needs-design]`.
  **The problem:** `index.js` is ~3,313 lines, ~2,680 of which are a single `client.on('interactionCreate')`
  handler — a giant custom_id-prefix switch that has only grown. **Proposed shape:** extract per-subsystem
  routing into `handlers/*.js` (e.g. `handlers/{manage,settings,colors,loadouts,drawprices,autobuild,nav}.js`),
  leaving `interactionCreate` a thin dispatcher: anti-spam guard → centralized `/manage` panel guard → route
  by prefix to the right handler. **The real risks to design around (why it's L / its own session, not a
  bundle-in):** (1) the outer top-level try/catch AND the `client.on('error')` net must still wrap every
  extracted handler — the crash-resilience invariant can't regress (see `.claude/rules/interaction-router.md`);
  (2) many handlers close over shared state (`buildSyntheticInteraction`, `resolvePanelActor`, the short-lived
  token Maps `manageUndoStore`/`pendingManageEdits`/`pendingBulkDeletes`/`dynamicColorCache`/etc.) that must
  move to a shared module or be passed in, not duplicated; (3) custom_id routing ORDER matters (the panel
  guard stays first); (4) it needs a real boot test (gateway actually connects) + a live interaction test +
  a VM deploy + verify — per [[feedback_verify_fix_actually_works]]. **Approach: incremental** — extract ONE
  self-contained subsystem first (e.g. `drawprices` or `colors`), boot-test + deploy + verify, then the next;
  never a big-bang rewrite. Bundles naturally with the "richer in-bot logging" and "hot-reload" items (a
  modular router makes both easier). Do it in its own session.
- **Full DEVLOG backfill from prior chat transcripts** (added 2026-07-13). `DEVLOG.md` (new, local-only
  narrative "journey & lessons" record — see the changelog-system memory) shipped a v1 covering the
  2026-07-13 session richly plus brief `[backfill — expand later]` stubs for earlier milestones. The
  deferred task (waiting on token budget, Harkirat's call) is to retrieve the actual prior chat
  transcripts — which hold reasoning/interactions/discoveries that never reached CLAUDE.md or memory —
  and merge/expand them into DEVLOG's Part A journey + Part B lessons ledger.
- **Changelog is now caught up** (done 2026-07-13): `CHANGELOG.md`/`CHANGELOG-SUMMARY.md` are current
  through v2.17.3 under the 3-part scheme, with a roadmap section added to each. Was ~9 versions behind
  before this; no longer pending.
- **The real "search + multi-select" flow for Delete Multiple (all entities) and Loadouts' Replace
  Multiple** — deliberately deferred out of the 2026-07-12 `/manage` panel redesign at Harkirat's
  explicit request, to avoid risking a usage-limit interruption mid-build on top of everything else
  in that pass. See the `/manage` design-decision-log entry above for exactly what's a placeholder
  right now vs. what the real version needs to do. Still pending.
- **`/secondaries` → `/secondary` rename + a `/pistols` alias — RECONSIDERED and DROPPED (2026-07-18,
  v2.21.0).** `/secondaries` stays exactly as-is (command name, DB category enum, and its own
  description); no rename, no second command. Replaced by the category-level search-synonym feature
  (see `.claude/rules/loadouts.md`) — typing "pistol" now surfaces every Secondaries weapon
  directly within `/secondaries`/`/all`, without a dedicated `/pistols` command Discord would have
  shown as a separate top-level entry in the command list either way (Discord has no true command-
  alias mechanism — every distinct typed command needs its own registration, full stop).
- The 2026-07-12 batch (draw prices, `/manage`, `/settings`, slash-command overpass, color
  repalette) and patch notes Cloudinary caching are now both fully complete and shipped — see their
  own CLAUDE.md sections above for detail, not listed here as pending anymore.
- **The View Colors panel / accent-color-personalization feature (this session, 2026-07-13/14) is
  functionally complete** — k-means extraction, dynamic relative labeling, `/colors` command, the
  `/settings` button, `'displayName'`/`'dynamicProfile'` accent styles, Refresh Colors with
  cooldown+change-detection, all live-tested and confirmed working by Harkirat across many rounds.
  See `.claude/rules/accent-and-colors.md` for the full history and the 2 known open cosmetic gaps
  listed just above (vertical centering, deco/nameplate animation). **2026-07-13 CPU + sizing pass**
  (lazy per-source extraction, dropped `/settings` soft-refresh, k-means convergence + yields, swatch
  memo, banner/gradient/nameplate 512px sizing) branch-tested on Render free tier and merged — see
  the "Post-ship production incident" and "View Colors preview sizing" sections above.
- **Not yet re-confirmed live**: the `sendV2Payload` attachments-replacement fix (Refresh Colors
  should now visually update the panel immediately instead of requiring a page-switch to see new
  swatches) was boot-tested but not re-exercised against a real Discord click since the fix landed —
  worth a quick re-test the next time this area is touched, rather than assuming it's confirmed.
- Not yet verified: Harkirat manually exercising every `/manage` panel action (including the
  combined-line Add Draw field, upsert-by-title Replace, granular Purge scopes, every Confirm/Cancel
  step, and every Undo button), the `/settings` 2-page layout, and the Cloudinary-cache add/edit/bulk
  flows (both draws' and patch notes'), live in Discord. **UPDATE 2026-07-17:** the panel's single-match
  **Edit** was live-clicked (by Harkirat) for the first time and found completely broken — the
  `mng_editbtn_` handler was in the wrong interaction-type block; fixed (see the "SEQUEL BUG" note in the
  2026-07-12-night section). Still needs a live re-click after this push to confirm the fix end-to-end in
  Discord (verified offline against live Mongo, but not yet clicked on the deployed VM).
