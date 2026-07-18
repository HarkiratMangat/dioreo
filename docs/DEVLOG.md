# DEVLOG — Dior's Builds

The **story** behind the bot: discoveries, bugs and their real root causes, the things we tried and
walked back, the reasoning behind decisions, platform gotchas, concerns, and tips for our future selves.

**How this differs from the other records:**
- **CHANGELOG.md / -SUMMARY.md** = *what shipped*, versioned.
- **CLAUDE.md** = *how the bot is built* — architecture and design decisions, reference-style.
- **memory files** = *terse standing rules* for how to work.
- **DEVLOG.md (this)** = *the journey and the lessons* — narrative, with the reasoning and the
  dead-ends left in, because the dead-ends are half the value.

**Status:** v1 is written richly for the **2026-07-13 session** and backfilled more briefly for the
major prior milestones from CLAUDE.md + memory. A **full backfill from prior chat transcripts is
planned** (deferred for token budget) — those chats hold reasoning/interactions/discoveries that never
made it into CLAUDE.md or memory. Entries marked `[backfill — expand later]` are the shallow ones to
deepen in that pass. Local-only (gitignored), like the changelogs — this is candid and stays off the
public repo.

---

# Part A — The Journey (chronological)

## 2026-07-13 — The color-panel saga: one report, five root causes

Started as a single bug report: after deploying the View Colors work (`219b2e1`), `/colors` was still
showing the **old** swatches — 5 colors for the avatar with the old "Accent Color N" labels — and
neither re-running `/colors`, nor `/settings` → View Colors, nor the Refresh Colors button fixed it.
Refresh even insisted "still generates the same colors."

What made this session worth writing down is that the one symptom turned out to sit on top of **five
distinct problems**, and finding them meant refusing to accept the first plausible answer each time.

**1. It wasn't a stale deploy.** First instinct on "old code showing" is always "did it actually
deploy?" Checked Render's API: the live deploy was `219b2e1`, status `live`. So the *code* was current
— which pointed the finger at *data*, not deployment.

**2. Stale cache, never invalidated.** The View Colors palette is cached per-user in Mongo, keyed on
the Discord image hash. Harkirat's live `avatarPalette` had exactly 5 entries — but already in the new
k-means array shape, so not leftover V1 data. It was a k-means result computed *before* the same-day
"over-cluster to fix 8→5" bugfix landed, most likely from local dev iteration hitting the same
production `MONGODB_URI`. Proof: running the *current* extraction against the same avatar URL returned
8. The earlier "vivid" accent rewrite had done a one-time cache clear; this commit forgot the
equivalent for the *palette* cache. Fixed with a scoped `updateOne` clear — **scoped to Harkirat's own
account only**, because an earlier session in this same feature got burned doing an unscoped
`updateMany({})` and had it (correctly) blocked as a mass-wipe. Lesson already in memory; re-applied it.

**3. The event-loop was being starved (the CPU bug).** The Render logs during the test window showed
`DiscordAPIError[10062] Unknown interaction` — the 3-second ACK window blown before `deferReply()` even
ran — and not just on `/colors`, but on `/manage`, `/settings`, and a select-menu too, across ~15
minutes with no process restarts. That ruled out free-tier sleep/wake. Root cause: `kMeansCluster()`
ran fully synchronously with no `await` in its loop; on Render's 0.1-CPU free tier that blocked Node's
single event loop long enough that *any* other in-flight interaction missed its ACK. Confirmed the
mechanism directly — a `setInterval(5ms)` timer fired **0 times** during a pre-fix extraction and ~14
after. That direct confirmation (not just "this seems slow") is the part I'm proud of.

The first-pass fix made extraction *yield* (`setImmediate` between iterations) and shrank the banner
fetch. But a second pass found where the CPU was actually being *wasted*:
- **Lazy per-source extraction** — the panel only ever renders one source's swatches, yet
  `refreshAllPalettes` extracted all four every render (one spawning an `ffmpeg` subprocess for the
  decoration still-frame). Renamed to `getPalettePanelData` and made it extract only the active source;
  the others' nav buttons still render (availability is cheap, from network calls, not pixel work).
- **Killed `/settings`' background soft-refresh** — it fired an un-awaited 4-source warm-up on *every*
  `/settings` open whether or not View Colors was ever clicked. A prime suspect for why `/settings`
  itself showed up in the 10062 logs. Removing it also deleted a concurrent-`save()` hazard it had been
  carefully working around.
- **k-means early-convergence** and **swatch memoization** — smaller wins. Honest note: convergence
  measured **0% benefit on Harkirat's own avatar** (12 clusters over 2521 pixels don't stabilize within
  the 12 cap there); kept only because it's byte-identical output and free-when-it-helps. Recorded the
  honest zero rather than dressing it up.

**4. The real gremlin: multiple bot instances.** Deployed the CPU work to a `fix/colors-cpu-efficiency`
branch (temporarily pointing Render's tracked branch at it — same service, so no collision *from
Render*) for real free-tier testing. Harkirat then reported the panel rendering **different code
versions on different clicks** — one click had an abandoned blank-emoji heading trick and old "Accent
Color N" labels, the next had the current 8-color layout. That is *impossible inside one instance*, and
it reframed everything. `ps aux` found **three leftover local `node index.js` processes**, each frozen
at a different code snapshot from earlier that day, racing the Render branch bot. This is a single-token
bot: Discord hands each interaction to a random connected instance, and they race each other's
`deferReply`. This almost certainly contributed to the *original* 10062 wave too — not just the CPU
angle I'd first chased. (I also briefly misread historical Railway logs as a live instance; corrected
after checking the deployment list showed everything `REMOVED`.) Killed the three; down to one instance.
Harkirat's phrasing — "different interactions loading different versions of code" — was the tell, and
it's now a memory: when behavior is *inconsistent* (not just failing), suspect multiple instances first.

**5. A self-inflicted regression: banner shrank.** The CPU pass had dropped banner *extraction* to
256px, but the Media Gallery *display* reused that same URL, so the preview visibly shrank. Fixed by
decoupling: 512px for display, a separate 256px copy for extraction (k-means samples ~2500 px
regardless, so 256 is quality-equivalent — it just wasn't big enough to *show*). While there, capped the
Display Name gradient banner and the nameplate at 512px wide. The nameplate needed doing ourselves:
Discord's **collectibles CDN ignores `?size=`** entirely (verified live — a 672×126 nameplate stays
672×126 with `?size=512`), unlike the avatar/banner CDN. So we fetch+resize it, and **memoize the
result in RAM** — which led to a good side conversation: Harkirat asked whether the memo should go to
the database and how much RAM it uses as users grow. Answer: it's a bounded in-RAM `Map` (~3.3 MB worst
case, *user-count-independent* because it's capped), DB storage is 0.38 MB of a 512 MB Atlas tier, and
storing regenerable image blobs in Mongo would be an anti-pattern. RAM was right; the reasoning is worth
keeping.

**Then: the meta-work.** Harkirat (rightly) called out that "document" means *everywhere*, including the
CHANGELOG — which had silently drifted ~5 days / 9 versions behind while CLAUDE.md and memory stayed
current. Caught it up, then he caught *me*: I'd used the wrong versioning scheme (flat `v2.8`, `v2.9`,
`v2.91`…) when the project uses three-part `vMAJOR.MODERATE.MINOR` — a scheme *already documented in
memory that I'd failed to apply*. Verifying against the full commit history also surfaced **two commits
I'd skipped entirely** (`01d0096`/`2793be4`). Renumbered to `v2.8.0`→`v2.17.3`, reconciled a UTC/local
date split (07-14 → 07-13 to match git), and hardened the memory so the changelog stops getting skipped.
Also: chapters weren't being marked (a standing preference I'd dropped) — the honest answer is that's a
behavior I have to *do*, not something a config hook can enforce, so it went into a "self-check these"
callout.

**Meta-lesson of the session:** almost every fix here came from *not* accepting the first plausible
story — stale-deploy → stale-cache → CPU → multiple-instances were four different "the bug is X"
answers, and only the fourth explained the actual symptom Harkirat described. Systematic debugging
(confirm the mechanism directly; check what actually changed; suspect the environment) beat guess-and-check
every time.

## Earlier milestones `[backfill — expand later from transcripts]`

- **2026-07-06 — Components V2 rewrite (`v2.0.0`).** The bot moved from classic Discord Embeds to
  Components V2 (Containers/Sections/Media Galleries) and MP loadouts moved from a spreadsheet to
  MongoDB. This is where Harkirat + Claude started building together, so everything after has real
  recorded reasoning. Most of the hard-won Components V2 lessons (see Part B) date from here onward.
- **~2026-07 — Excel → Mongo loadout migration.** `builds.xlsx` was the source of truth; autocomplete
  had been rewired to Mongo but the data never migrated and the render still read Excel — so the
  dropdown was empty and manual lookups hit an incompatible key scheme. Migrated 106 rows/58 weapons,
  discovered `buildName` was doubling as the copy-code payload (so admin-added loadouts had fake codes),
  and split out a real `shareCode` field.
- **2026-07-10 — Security incident.** Bot token exposure → rotated the token, updated Render/Railway env
  vars. Also the period of deploy-platform churn (Render ↔ Railway) that seeded a lot of the infra
  gotchas in Part B.
- **2026-07-11/12 — Admin panel v2 + the batch redesign.** `/update` folded into `/manage`; then a full
  mockup-driven rebuild of `/draw prices`, `/manage`, and `/settings`, plus draw-thumbnail Cloudinary
  caching, a wording overpass, and a full color repalette. The `/manage` Edit-search crash (discord.js
  won't open a modal from a modal submission) was found live here.
- **2026-07-13 — Accent-color system + View Colors panel.** The accent-extraction algorithm went through
  three real revisions (flat avg → saturation-weighted → vivid hue-cluster), and the palette panel went
  from a synthetic 6-swatch model to real k-means. This is the feature the 2026-07-13 session above was
  fixing the fallout from.

## 2026-07-14 — Access locks, a scope-correction, and a perf finding that turned out to be architecture, not a bug

A grab-bag session: two access-control gaps in `/manage` and `/settings`, a button rename, a new
`/timestamp` mode, and a "does this feel slow?" question. The interesting parts weren't any single
feature — they were a mid-brainstorm scope correction, and a design choice for how to encode a
15-minute expiry without adding new state.

**The scope correction.** Harkirat asked for a text-output option on "the `/timeline` command." There
is no `commands/timeline.js` in this repo — CLAUDE.md only ever uses "timeline" as loose descriptive
prose for `/calendar` ("View the timeline for this season's events"). Reasonable first assumption:
he means `/calendar`. Asked a clarifying question about how the text mode should behave (paginated
shell vs. one flat dump) rather than guessing — and the ANSWER didn't fit `/calendar` at all: it
mentioned "the All Formats design" and "other timeline display designs," which are `/timestamp`'s own
vocabulary (`/timestamp` has an "All Formats" default view plus a dropdown of individual format
styles — `/calendar` has neither concept). Asked a second, more direct confirmation question before
writing a single line of code. It was `/timestamp`. The lesson isn't "ask clarifying questions" (that's
already standard practice) — it's that an ANSWER to a clarifying question can itself reveal the
question was aimed at the wrong target, and that's worth stopping on just as hard as an ambiguous
initial request would have been. Building the text-mode feature against `/calendar` first would have
been a full wasted implementation pass, not just a wrong assumption caught early.

**The `/settings` expiry: Map vs. stateless custom_id.** The obvious implementation for "expire after
15 minutes" is a `Map<messageId, {userId, expiresAt}>`, set when the panel first renders and checked on
every click — mirrors `manageUndoStore`'s existing pattern in this exact codebase. Went a different
way instead: encode the deadline directly as a pipe segment in every custom_id `settings.js` builds
(`toggle_loadout_public|{userId}|{expiresAt}`), the same "stateless" convention `tsmenu`/
`price_subpage_` already use elsewhere in the bot. Two concrete reasons beat "matches an existing
pattern" here: (1) populating a Map on the very FIRST render needs to know the message's real id, and
a `deferReply()`-based interaction doesn't have that yet — the only way to get it is an extra
`interaction.fetchReply()` network call, paid on every single `/settings` launch just to set up
bookkeeping the click path doesn't even need. (2) A Map resets on every Render redeploy; a deadline
baked into the button itself survives a restart for free. Same day, a separate investigation (see
below) was about to recommend AGAINST adding extra network round-trips to hot paths — introducing a
new one here to build the expiry feature would have directly contradicted that finding in the same
session.

**The perf investigation — the value was in ruling things out, not finding a bug.** Harkirat's "does
`/draws` feel slow?" could have been the View Colors incident all over again (CPU-blocking event loop,
stale cache, live Discord fetches). None of those were it. Checked his actual saved `accentColorStyle`
directly in Mongo first (`'preset'`) — that alone ruled out the "live Discord fetch on every accent
color resolve" theory before writing a single line of trace-reading. Then read the actual `await`
sequence on the hot path for both `/draws`' view-switch and `/calendar`'s sub-page nav side by side:
`deferUpdate()`, two concurrent Mongo reads, then a SEPARATE `PATCH` to actually update the message.
No blocking sync work, no redundant fetches — just two real network round-trips where a single direct
`UPDATE_MESSAGE` interaction response could do it in one. The finding is real and actionable, but it's
a bigger refactor (touches every paginated command) than anything else asked for this session, so it
got logged as deferred work rather than attempted — the same "ship the smaller asks, don't bundle a
bigger unrelated risk into the same push" call the View Colors CPU investigation made once already.

---

## 2026-07-14/15 — Planning sessions: a roadmap out to v5, and two landmines found while filing notes

Two back-to-back sessions with almost no bot code touched — Harkirat handed over a plain-text file of
accumulated thoughts (`local/project plan notes.txt`) and asked for it to be filed "wherever it needs
to go." Worth logging anyway, because the *filing* surfaced more than the notes did.

**The roadmap got real depth.** What existed before was "next planned work" — a flat list. Now there's
a genuine ladder: **remaining v2** (mobile description truncation, `/settings`' missing `hidden`
option, short-phrase loadout search, color-variety, download buttons, pagination loop-back), **v3**
(`/admin` restructure, `/meta`, draw cost calculator, `/help`, a "bully broke people" personality gag),
**v4** (guild install + text/prefix commands, user-submitted loadouts with a manual review queue), and
**v5** (generate the gunsmith image + code ourselves, then let users build custom loadouts in-bot).
The most important thing recorded isn't a feature — it's that **v4's guild install invalidates the
single biggest architectural claim in CLAUDE.md**: the whole "this bot is user-installed only, it has
zero standing guild permissions" section, and everything that follows from it (the `50001 Missing
Access` wall, why "Show Everyone" had to route through the interaction-response mechanism instead of a
channel POST). That section becomes false the day v4 lands. Flagged it *on the roadmap item* rather
than trusting a future session to notice the contradiction on its own.

**Landmine 1: the memory store nearly forked in half.** The repo moved to `/Applications/Claude Code/
Diors-Builds`, and the harness accordingly told the session its memory directory was
`~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/`. That path **does not exist**. The
real store — 26 files, the entire working agreement and every feedback rule — lives at the old
`-Applications-Diors-Builds` path, which is what CLAUDE.md points at. Following the session prompt
instead of CLAUDE.md would have silently created a second, empty store and started writing memories
into it; nothing would have errored, and the split would only surface later as "why does Claude keep
forgetting things it definitely knew." Caught it only because an edit to a stale symlinked repo path
failed and prompted checking *both* trees. Now documented at the top of CLAUDE.md **and** the working
agreement, since either one might be the file a future session reads first.

**Landmine 2: `Unreleased` was a promise the file never kept.** CHANGELOG.md's header has said, for
some time, "see **Unreleased** at the bottom of this file for work that's committed but not yet
pushed." There was no such section. It had simply never been created — so the two doc-only commits from
these sessions had nowhere to be recorded, and the convention was quietly fiction. Created it.

**A status line, and a bug that only appeared when a field was missing.** Harkirat's opening question
was whether flipping models between sessions had wasted tokens (it hadn't — `/model` sends no request,
and caches are per-session *and* per-model, so switching *before* sending costs nothing). The durable
fix for "which model am I even on?" turned out to be Claude Code's status line, which receives
`model.display_name` and — critically — `effort.level` reflecting *live* mid-session `/effort` changes.
Built a two-line one: model · effort · branch · context%, then 5h/7d rate-limit burn with a reset time.
The bug is the interesting part: parsing seven `jq` fields with `IFS=$'\t' read`. **Tab is an IFS
*whitespace* character**, so bash collapses runs of consecutive tabs into a single delimiter — meaning
any *absent* field (no effort on an unsupported model, no `rate_limits` early in a session, null
context after `/compact`) shifted every later field one slot left, and the working directory rendered
where the effort level should be. Tests 1 and 2 passed cleanly because every field was populated; only
the deliberate absent-field test caught it. Fixed by switching the delimiter to `\x1f` (a
non-whitespace char delimits exactly one field each and preserves empties). A textbook case for
"test the degenerate input, not just the happy path" — and it would have shipped a status line that
confidently displayed the *wrong model info*, which is precisely the thing it exists to prevent.

**Landmine 3 (the worst one): the SessionStart hook had been dead, silently.** Right at the end of the
session Harkirat asked a throwaway-sounding question — *"you've got it documented properly so it fires
as part of our session start initiation?"* Checking instead of answering "yes" found that the hook ran
`cat /Applications/Diors-Builds/SESSION-START.md`, a path that stopped existing when the repo moved to
`/Applications/Claude Code/Diors-Builds` — apparently *during* this very session, since early edits to
the old path succeeded and later ones didn't. `2>/dev/null` swallowed the error, `jq -Rs` happily
wrapped the empty output, and the hook injected **1 character** into every session. Every
non-negotiable it exists to enforce — commit/push confirmation, the full push cycle, the document rule,
versioning, chapter marks, model recommendations — had been loading as *nothing*, for an unknown
number of sessions, with no error anywhere. The rules didn't fail; they were never delivered. Fixed by
resolving through `$CLAUDE_PROJECT_DIR` (survives future moves) and, more importantly, making the
failure **loud**: a missing file now injects a ⚠️ warning telling the session to report it, instead of
going quiet. Verified by simulating all three cases — normal (4,882 chars, up from 1), fallback, and
missing-file. **The lesson isn't "fix the path."** It's that a `2>/dev/null` on the *loading* of your
safety rails converts "your guardrails are gone" into "everything looks fine," and the only reason it
surfaced was a user asking a skeptical question about something that had been reported as done.

**Also settled, without building anything:** the pagination perf fix should be a **hybrid**, not a
blanket conversion — light string-building commands (draws/calendar/drawprices/settings) go single-hop
`UPDATE_MESSAGE`, while anything doing CPU or image work before replying (View Colors, attachment
paths) keeps defer-then-patch, because blowing the 3s ACK is a real risk there. And v3 testing has an
answer: the single-instance rule is **per-token, not per-code**, so a separate Dev Portal bot with its
own token (and its own `MONGODB_URI`) can run the v3 branch alongside live production with no
collision at all — no suspending Render, no racing.

---

## 2026-07-17 — The Render outage that became a migration to GCP

Started as "the bot won't respond." Ended as a full hosting migration. What's worth writing down is the
DEBUGGING PATH — how many plausible causes got ruled out with real evidence before the true one, and how
one confident-but-wrong theory nearly cost money.

**The symptom.** "Application did not respond" on every command. Render said the deploy was "live" — a
phrase we already knew (from 2026-07-16) is a trap: "live" only means the process booted and the port
bound; it says nothing about the Discord gateway.

**The ruling-out, each with evidence, not hunches.** Not a stale deploy (Render API confirmed the live
commit). Not multiple instances, the #1 rule (one live deploy, no stray local `node index.js`, Railway
unlinked — and decisively: a healthy second instance would have *answered*; total silence meant the
single instance was dead, not that a duplicate stole the click). Not spin-down (HTTP 200 in 0.09 s, no
cold-start in the logs — process was up). The logs showed the real shape: ~71 autocomplete `10062`s all
in one second, then silence — a backlog of expired interactions flushing at once, i.e. the gateway
delivering events late then going quiet. Not Discord rate-limiting (`session_start_limit` 998/1000). Not
a code regression (last code change v2.18.0 on 07-14, working; only docs deploys since).

**The wrong theory, and the save.** I confidently diagnosed "Render free-tier CPU starvation" and was
about to recommend a $7/mo upgrade. Harkirat asked: can't you check the actual CPU usage? The metrics:
**~1% CPU, 21% memory — idle.** Flatly not starved. His question killed a wrong, costly conclusion. The
lesson burned in: pull the data before asserting a *resource* diagnosis, even when the pattern "matches"
prior incidents. Pattern-matching to history is exactly how you skip the measurement.

**The proof.** If CPU is idle and the event loop isn't blocked, the bot isn't struggling — it's receiving
nothing. The gateway socket was silently dead and discord.js wasn't recovering. To isolate host-vs-code,
we ran the identical commit locally on the MacBook: **gateway connected in seconds.** Same code. On
Render it took 10-14 minutes then zombied. That one test ended the investigation — it was the host.

**The deeper tell**, visible once the shard-logging (v2.18.3) was actually deployed: MongoDB connected in
10 s but the Discord gateway took ~11 minutes — same process, same instant. A general network/CPU problem
would slow Mongo too; it didn't. Only the long-lived outbound WebSocket stalled. Render's free tier simply
could not hold it.

**The migration.** Harkirat had GCP credits ($300 + $10/mo). We provisioned an e2-micro VM (us-east1,
always-free), installed Node 24 / git / ffmpeg, cloned the repo, scp'd the `.env`, and ran the bot under
systemd. It connected to the gateway in **~6 seconds and held** — 0 restarts, no disconnects. The thing
Render never did once.

**"Never blind again"** (Harkirat's directive, born of the days lost to this). We built real
observability: `scripts/vmstatus.sh` (one-shot health), `scripts/vmpeaks.sh` (historical CPU peaks from
Cloud Monitoring), and `utils/alertWebhook.js` (Discord alerts on crashes/gateway events + a "Bot online"
ping per restart, so problems surface in Discord in real time). The Ops Agent (guest RAM history) was
deferred — its installer kept returning broken downloads and it wasn't worth blocking the recovery.

**Lessons (this entry's own):**
- **Pull the metric before asserting a *resource* diagnosis.** "CPU starvation" felt obviously right
  given the history; the data said 1% idle. The user's "did you actually check?" is a gift, not a
  challenge — it caught a wrong call headed toward a needless spend.
- **"live" / "port bound" / "process up" ≠ "gateway connected."** Three deploys' worth of pain from
  conflating them. The only proof is the `handleBotReady` / `shardReady` marker actually printing.
- **To isolate host vs code, run the identical build somewhere else.** One local run (seconds vs 14 min)
  ended days of theorizing in a single data point.
- **"Idle + unresponsive" is a distinct signature from "busy + unresponsive."** A silently-dead socket
  produces no logs AND no CPU — that combination points at the transport/host, not the code.
- **The right host shape matters:** a persistent-WebSocket bot needs an always-on process (a VM), not a
  request-driven web service that gets throttled/reaped. Render free "web service" was the wrong shape all
  along; it only ever half-worked.

---

## 2026-07-17 (later) — Three cleanups on the healthy VM: a fix's own fix, a heartbeat, and a disabled API

With the bot finally stable on GCP, a session to clear three queued items. Two were routine; one was a
small, satisfying study in how a bug can hide behind its own fix.

**The Edit button that never worked.** Harkirat clicked `/manage` → Edit → searched "FSS" → clicked the
**Edit** button on the result → "Dior's Builds didn't respond in time." That error is specific: it's a
3-second no-ACK timeout — the interaction reached the bot and *nothing* answered it. Not "something threw"
(that surfaces as "Something went wrong"); literally nothing ran.

The tempting first suspect was the modal builder throwing before `showModal()` — `buildEditLoadoutModal`
has unguarded `.setValue()` calls, and that exact shape (`setValue(undefined)`) caused a real Edit-Draws
crash back in July. But that would have thrown *and been caught and logged*, not vanished. "Nothing ran"
is a different signature. So instead of patching the builder, I asked: does the handler even execute?

It doesn't. There is exactly one `mng_editbtn_` handler in the whole file, and it sits inside the
`if (interaction.isModalSubmit())` block — but `mng_editbtn_` is a **button** custom_id. A button has
`isButton() === true`, `isModalSubmit() === false`. The handler is unreachable dead code; the click falls
through the entire routing chain and times out. This is the *exact* bug we'd already hit once (the loadout
Browse dropdown, wired into `isButton()` when it was a select) — a handler that reads correctly line-by-line
but lives in the block its interaction type never enters. And the irony: this handler was itself the *fix*
for an earlier Edit bug (the intermediate button exists because you can't `showModal()` from a modal
submit). The fix was written next to its `mng_search_` sibling — same block, conceptually adjacent — and
never live-clicked between July 12 and today, so nobody noticed the fix didn't work. It was even on the
"not yet verified" list.

The fix is a move, not a patch: relocate the handler into `isButton()`, leave a loud breadcrumb in both
places so it doesn't get "helpfully" moved back. Then, because the routing fix means `showModal` *will* now
run the builder I'd been suspicious of, I verified that too — ran the real `buildEditLoadoutModal` against
the actual FSS Hurricane doc and all 125 MP loadouts pulled from live Mongo. Zero throws. So the routing
fix doesn't just trade one bug for another. Lesson reinforced: **match the failure signature before
picking a suspect** — "timed out with no response" and "responded with an error" point at different layers,
and chasing the wrong one (the modal builder) would have "fixed" something that wasn't broken while leaving
the real dead-code handler in place.

**A heartbeat for the quiet.** v2.19.0's alerting only speaks up on trouble or on (re)start. That leaves a
gap: during a long healthy stretch, silence is ambiguous — "fine" and "the VM/alerter itself died" look
identical. Added a daily info-level, non-pinging "still healthy" alert (uptime/servers/latency/memory). No
green for a day = something's wrong. Deliberately not fired on boot (the "Bot online" ping covers that) and
skipped if the gateway isn't currently ready (a real problem alerts on its own; a false "healthy" during an
outage is worse than none).

**The Ops Agent that couldn't.** Installing the Ops Agent for RAM history was supposed to be the easy one —
and the install *was* clean (the migration-day 404 was just transient). But RAM peaks stayed blank. The
agent's collector logs told the real story: `PermissionDenied — Cloud Monitoring API has not been used in
project … or it is disabled`. Both the Monitoring AND Logging APIs were off on the project. The confusing
part: CPU peaks worked fine the whole time — because hypervisor CPU metrics read through a path that
tolerated the disabled API, while the agent's *write* path did not. So "CPU works, RAM doesn't" wasn't a
query bug in my new `rampeak()` at all; it was the agent unable to publish. One `gcloud services enable`
(both free-tier) + a restart, export errors to zero, and the first RAM peak read 43.7% of the 1 GB box.
Lesson: **when a new metric is empty but a sibling metric works, check whether the data is being *produced*
before debugging how you *read* it.**

**A course-correction worth recording.** I finished all three tasks, verified them, and presented a push
plan — and Harkirat (rightly) pushed back: I'd read his scratchpad notes at session start but only acted on
the single Edit-bug line, skipping several items sitting *directly* on top of this work. The sharpest one:
he'd flagged that the new webhook alerts are unreadable to him and wants them overhauled — and I'd just
bolted a heartbeat onto that *exact* system without connecting the two. Lesson (beyond "read the notes"):
**when a task touches a subsystem, check whether the notes already carry queued work on that same subsystem
before shipping in isolation** — otherwise you touch the same file twice across two sessions for no reason.
We folded the light half of the alerting overhaul in here (4 severity levels — yellow for the
self-recovering "reconnecting" vs orange for a real "disconnected"; ping only on orange/red; a proper
Discord `<t:>` timestamp per alert; fixed the "-1ms" boot ping) plus the quick "Edit + Search Again on one
row" tweak he'd noted. The heavier half (per-alert IDs, a downloadable text-log) is real design and got a
proper handoff to its own session instead of being crammed in.

---

## 2026-07-18 — A tidy session: turning the scratchpad into a conveyor, not a landfill

No bot code today — a pure documentation/organization/alignment pass on the tracking files. Harkirat had
been feeling the `local/diors-builds notes.md` scratchpad "build up endlessly," and he was right: it had
grown a full duplicate of CLAUDE.md's v2–v5 roadmap, so every session-start read paid for a second copy of
the roadmap that could silently drift from the real one.

The interesting part was a design question hiding inside "just tidy it": *what is the notes file FOR?* Two
models. **Model A (mirror):** the notes file holds the pending roadmap too, items stay unmarked until they
ship — which is what a prior pass had settled on, and exactly why it ballooned. **Model B (conveyor):** the
notes file is pure intake; once a thought is filed into its real home it LEAVES the file. I proposed the
fork rather than guessing, and Harkirat's answer was decisive: *"the info is not supposed to live in it
forever… I wanted the file cleaned up so YOU could file things easily."* Model B. That's also, in hindsight,
why he'd earlier insisted `deferred-items.md` stay a SEPARATE file rather than merge into the notes — he
wanted distinct surfaces with distinct jobs, not one god-file.

So the notes file became a conveyor: raw intake at the top, a one-paragraph pointer where the roadmap used
to be, and a **Graveyard** at the bottom for resolved items — which I relocated ABOVE the private
"Harkirat's Space" section per his request (it had been sitting below his off-limits divider, a future
confusion waiting to happen). Ten items got filed out to their real homes in one pass — five new v2 features
(`/manage` loadout-UX overhaul, `section`→`data for`, richer in-bot logging, an admin `/status` command,
`/manage` accent colors), two v3 features (an announcement system, easy bot sharing/`/invite`), a
someday bot-ops guide, a Cloudinary-folder verify item, and the webhook heavy-half onto the changelog
roadmap for parity — all into CLAUDE.md + both changelogs, so the four surfaces (notes / CLAUDE.md /
CHANGELOG / CHANGELOG-SUMMARY) finally agree.

Two smaller things worth noting. First, the **boundary discipline**: the notes file has a private section I'm
not to read, so before I had any content I located the divider by line number and read only above it — and
when I found a `# Graveyard` heading sitting *below* that divider, I didn't guess whether it was in scope; I
asked. (It was mine to use; he told me to move it up.) Second, the **versioning answer** for a file that
can't go to git (gitignored, and un-pushable because of the private section): dated byte-copy snapshots in
`local/notes-archive/` before each tidy. A raw `cp` preserves his private Space perfectly *without me ever
reading it* — the bytes copy, nothing enters my context. Simple, private, no infra, and it makes "diff what
changed" a normal two-file diff.

The meta-lesson: a "tidy" request can contain a real design decision. The instinct is to just start moving
lines; the better move was to surface the mirror-vs-conveyor fork and let the file's owner decide what the
file is *for* — because that choice determines every future tidy, not just this one.

**Then, a priority-tier system.** With the backlog gathered in one place, Harkirat noticed the obvious next
gap: a flat list doesn't tell you *what to work on*. He asked for a tiered classification factoring scope,
difficulty (+model/effort), urgency, "and anything I'm forgetting." The design insight worth keeping: **one
number can't do it** — "what to focus on" and "what can I bundle cheaply" are different questions, so it's
two axes (`[Priority P0–P3 · Effort XS–L]`) plus flags (🔗bundle 🧩needs-design ⛓️blocked). The *combination*
is the payoff — a P1·XS is a quick win to knock out now; a P1·L earns its own session; a P2·XS is bundle-only
(grab it when you're already in that file). The factors he "might be forgetting" (cost-of-delay, risk,
readiness, dependencies) all folded cleanly into either the priority rollup or a flag. Rolled it out across
deferred-items.md (every open item incl. bugs/reminders), CLAUDE.md's near-term v2 items, and the deferred
spots in memory; gave it a canonical spec (`reference_priority_tier_system`) and a visual reference-card
Artifact so the scheme is easy to re-remember. Version horizons (v3/v4/v5) were left to imply priority rather
than tag 40 lines — consistency without busywork.

---

# Part B — Lessons Ledger (thematic)

Durable, reusable takeaways. Each is a compressed version of a story in Part A.

### War stories / root causes
- **Multiple instances of a single-token bot collide invisibly.** Discord routes each interaction to a
  random connected instance; they race `deferReply` (→ 10062/40060) and can render different code
  versions per click. Erratic *inconsistency* is the tell. A `git push` doesn't stop local processes.
- **Tab is an IFS *whitespace* char, so bash `read` silently collapses empty fields.** Parsing
  tab-separated `jq` output with `IFS=$'\t' read -r A B C` shifts every field left when any earlier one
  is empty — no error, just wrong data in the wrong variable. Use a non-whitespace delimiter (`\x1f`)
  when empties are possible. Found in the status line (2026-07-15); the happy-path tests all passed.
- **Synchronous CPU work starves the event loop on a 0.1-CPU tier.** k-means with no `await` blocked
  ACKs for *unrelated* commands. Fix by doing *less* work (lazy extraction) and *yielding* (`setImmediate`).
- **Hash-keyed caches don't invalidate on an algorithm change** — only when the source asset changes.
  Any logic/shape change to a cached computation needs a manual, **scoped** cache clear (never unscoped).
- **discord.js: a `ModalSubmitInteraction` can't `showModal()`** (Discord disallows modal-from-modal) —
  route single-match Edit through an intermediate button instead.
- **`Object.assign` drops non-enumerable props** — discord.js sets `client`/`token` non-enumerably, so
  hand-rolled synthetic interactions silently lost them and crashed. Use the shared builder.
- **`client.on('error')` must be registered** — discord.js constructs with `captureRejections: true`, so
  a rejected async listener becomes an `error` event on the client that crashes the process *past* the
  try/catch if unhandled.
- **A bare `return interaction.reply(...)` in a catch escapes the enclosing try** — the try has already
  exited by the time that promise rejects. Always `await` reply/editReply/followUp in error branches.
- **Alpha-transparency in pixel sampling** — transparent padding (0,0,0) was counted as real black on
  nameplate/decoration until the sampling loops skipped `alpha === 0`.
- **A handler placed in the wrong interaction-type branch is dead code, silently** — the loadout
  "Browse other builds" select handler sat inside `isButton()` and never fired; only a trace log
  revealed it. Verify a handler is even *reached* before theorizing about its logic.
- **`sendV2Payload` must send `attachments: []` when uploading new files** — else Discord keeps the old
  attachments and swaps only text/components (stale swatches).
- **Never log a raw Cloudinary error object** — its rejected-promise shape carries the account's live
  API key+secret. Sanitize via dedicated helpers.

### Walk-backs & reversals (things tried, then reverted — and why)
- **Blank-emoji vertical centering** of a Section heading — Components V2 has no vertical-align; looked
  wrong on mobile, reverted. Still unsolved, accepted as cosmetic.
- **Nameplate `.webm` / animated decoration** — Discord requires a manual tap to play inline; reverted to
  static. The real fix (APNG→GIF per render) was rejected as not worth per-render latency.
- **Accent extraction: flat average → saturation-weighted → vivid hue-cluster.** Each revision was found
  wrong by testing against Harkirat's *real* avatar, not a hypothetical.
- **Palette: synthetic 6-swatch model → real k-means** — the categories were "mostly useless" vs real
  palette tools; and the naive "top-N by population" alternative was tested first and found *worse*
  (4 near-identical off-whites), which justified the k-means rebuild with evidence.
- **`?size=512` on the collectibles CDN** — assumed it would resize the nameplate; verified it's ignored.
  Fell back to fetch+resize ourselves.
- **Heading size H2 → H3 → H2** and **`private` → `hidden`** option rename, **`CATEGORY_SORT_ORDER`**
  added then dropped for plain alphabetical — small reversals, all driven by Harkirat's direct feedback.

### Design decisions & the "why"
- **Option A — one shared visibility toggle** for all seasonal commands, not five.
- **Admin dates forced to UTC-0** (`chrono` with `timezone: 0`) — a past DMZ "1 hour off" bug traced to
  ambient-timezone parsing.
- **`chrono` defaults a bare date to NOON** — `/timestamp` manually zeroes it to midnight.
- **Bulk imports REPLACE, not append** — a paste is the complete current list; re-running fixes typos
  without duplicating.
- **Single-token, user-installed-only** — the bot has zero standing guild permissions; it can only
  answer via the interaction-response webhook. Any raw channel POST fails `50001` (this bit "Share
  Publicly").
- **Draw-price totals computed from raw pull arrays**, never hand-typed — repeated arithmetic typos
  forced this; a total can no longer drift from its own draws.
- **Three-part `vMAJOR.MODERATE.MINOR` versioning** — the old flat-decimal scheme broke once MODERATE hit
  double digits.

### Platform / library gotchas
- **Components V2:** selects/buttons still need an Action Row even inside a Container; **40 components
  max, counted recursively** (a real production crash); buttons can't have hex colors (only Container
  `accent_color` can); a button `label` won't render an emoji mention — use the `emoji` field.
- **Media Gallery has no width control**; the **collectibles CDN ignores `?size=`** (but the avatar/
  banner CDN honors it).
- **Jimp can't decode APNG** — animated decorations need an `ffmpeg` still-frame first.
- **Cloudinary has no native per-asset TTL** — expiry is something the bot does on a schedule.
- **Render free tier = 0.1 shared CPU**, no `suspend` in the CLI (REST API only); **Railway free tier
  blocks CLI deploys 8am–8pm ET** and isn't git-connected.

### Process lessons / tips (for us and anyone after us)
- **When the environment and the project docs disagree about a path, trust the project docs and verify
  both.** The harness pointed at a memory directory that didn't exist while the real 26-file store sat
  at the path CLAUDE.md named. Following the environment blindly would have forked memory into two
  half-empty stores, failing silently and only showing up much later as inexplicable amnesia.
- **A convention documented but never implemented is worse than no convention.** CHANGELOG.md promised
  an `Unreleased` section at the bottom for months; it didn't exist, so committed-but-unpushed work had
  nowhere to go. Check that a rule you're citing is actually *real* in the file before relying on it.
- **Never `2>/dev/null` the loading of your own safety rails.** The SessionStart hook silently injected
  an empty string for an unknown number of sessions after the repo moved — every non-negotiable it
  enforces was simply never delivered, and nothing errored. If a mechanism's job is to *deliver rules*,
  its failure mode must be loud, and it should resolve paths dynamically (`$CLAUDE_PROJECT_DIR`) rather
  than hardcoding a location that can move underneath it.
- **"Is it documented?" and "will it actually fire?" are different questions.** A rule written into a
  linked memory file only works if something reads it. The auto-loaded file is the only guaranteed
  delivery path — verify what a *fresh* session actually receives, don't infer it from where you wrote it.
- **Test the degenerate input, not just the populated one.** Absent/null/zero fields are where parsing
  bugs live. A status line whose happy path is perfect but which misreports the model when one field is
  missing is worse than no status line — it's confidently wrong about the exact thing it exists to show.
- **Verify the fix actually *works*** — boot-test, and for a live interaction get a real repro or add a
  cheap trace point before theorizing.
- **Check sibling/reference code before guessing** from prose or screenshots — the pattern is usually
  already in the codebase.
- **Test the naive alternative first** — a bad result there justifies a bigger rebuild with evidence.
- **When behavior is erratic, suspect multiple instances FIRST** (`ps aux`, Railway, Render) before
  code/cache theories.
- **"Document" includes the CHANGELOG** — and the changelog is the one that keeps getting skipped.
  Update all three record layers at push time.
- **Kill stray local instances as part of every push** — only the deployed instance should be live.
- **A project's own `.env` is in-scope for a credential; a personal `~/.` config file is not.**
- **Be usage-conscious** — batch tool calls, don't re-read what's already in context.
- **Mark chat chapters at phase shifts** — can't be hook-automated, has to be done deliberately.

### Concerns / open risks
- **`ffmpeg` is unverified on Render's container** — decoration extraction works locally; if it breaks in
  prod *only*, check for ffmpeg first.
- **Render free-tier CPU ceiling** — the color feature is right at the edge of it; the lazy-extraction
  work bought headroom, but the last-resort levers (worker threads, plan bump) are documented.
- **Deferred dependabot vulnerabilities** — undici/discord.js chain + xlsx (dead at runtime); tracked,
  decided not worth acting on yet.
- **Changelog-drift habit** — recurred across multiple sessions; now guarded by a self-check callout, but
  worth staying honest about.

### Collaboration insights
- **Systematic debugging beat guess-and-check repeatedly** — the session above is the clearest case:
  four wrong "the bug is X" answers before the real one, each discarded by *evidence*, not vibes.
- **Screenshot/real-device review caught what logs didn't** — the "different version per click" report,
  and most of the walk-backs, came from Harkirat actually *looking* on mobile.
- **Confirm before push, every time** — approval doesn't carry over; and "push" means the whole cycle
  (deploy + verify live + only one instance running), not just `git push`.
- **Honest reporting builds trust** — recording the 0%-benefit convergence result, the misread Railway
  logs, and "I had the memory and didn't apply it" is the point of this file, not a footnote.

## 2026-07-16 — A silent 14-minute Gateway hang, and a documentation gap it exposed

A doc/tooling-only push (`cf6cad7`, `df8cc58` — a memory-path correction and adding git-tag
versioning, zero bot code touched) triggered Render's normal auto-deploy. Build succeeded, MongoDB
connected, Express bound its port, Render marked the service `live` — the usual sequence, except
the bot's own two Gateway-confirmation lines (`✅ ... fully authenticated!`, `🚀 ... Discord Gateway
system!`) never printed. Harkirat caught it by eye, comparing the log against what a normal deploy
looks like — I'd checked the same logs moments earlier and read "MongoDB connected + Render says
live" as good enough, which it wasn't.

**Investigation (systematic-debugging skill, not a guess):** confirmed via `git diff` that the push
touched only `CLAUDE.md` — ruling out a code regression outright. Checked all three places an
instance-conflict could live: `ps aux` locally (clean), Railway via `railway status --project
worthy-peace --environment production --json` (`activeDeployments: []`, nothing running there),
and Render's own deploy history (exactly one `live` deploy, the previous one cleanly
`deactivated`, no overlap). All ruled out with real evidence, not assumption. What was left: the
process was genuinely alive and healthy by every check available (Mongo, Express, no crash), but
`Events.ClientReady` simply hadn't fired, with zero error on `client.login()`'s promise or the
`client.on('error', ...)` handler — a silent hang, not a crash. **It resolved on its own ~14 minutes
after the deploy**, with no restart or intervention.

**Root cause: genuinely not fully pinned down, and said so rather than inventing a confident
answer.** The pattern (long silent delay, zero error, eventual self-resolution) is consistent with
discord.js's internal WebSocket layer retrying the Gateway handshake with backoff — `login()`
doesn't reject while it's still retrying, it just takes however long that takes — but none of that
internal retry activity was logged, so there was no way to confirm which specific mechanism it was.
Fixed the *visibility* gap regardless of the exact cause: added `shardReady`/`shardResume`/
`shardReconnecting`/`shardDisconnect`/`shardError` logging (not the raw `'debug'` event, which
would flood production logs with heartbeat noise) so a future occurrence has a real diagnostic
trail instead of silence.

**Went looking for precedent, since Harkirat recalled "something similar a few days back" tied to
switching Render↔Railway.** Searched this project's own DEVLOG/CLAUDE.md/memory first — found
nothing with this exact symptom. Then searched past session transcripts directly (a real tool for
this, not just guessing) and found a July 13 session containing "switch back to Render once its
network issue clears up" — real confirmation a prior Render-side networking issue existed, roughly
matching the timeframe DEVLOG already vaguely describes as "the period of deploy-platform churn
(Render ↔ Railway)" around the 2026-07-10 token-rotation incident. Did NOT do a full read of that
~4,000-message session to extract the complete narrative — the token cost wasn't proportionate to
what more detail would actually buy here, and the confirming snippet was enough to write this
honestly without overclaiming a precise causal link between the two incidents.

**A real documentation gap, found in passing, not invented for this entry:** `CHANGELOG.md`'s own
header has said "see Unreleased at the bottom of this file" since it was written — that section
never actually existed. This is the exact "Landmine 2" pattern already recorded in this file
(2026-07-15 entry) recurring: a promised-but-missing section. Created it for real this time, with
this incident's logging change as its first actual entry.

### Lesson
**"The deploy log looks mostly right" is not the same as "confirmed healthy."** I read a clean
build + MongoDB connection + Render's own "live" status as sufficient and moved on; the two lines
that actually confirm the BOT (not just the process) came online were silently missing, and I
didn't notice until it was pointed out. The fix isn't "read logs more carefully next time" (that's
not a repeatable process) — it's the shard-lifecycle logging above, so a real gap in the future
produces an actual error/warning signal instead of requiring a human to notice an absence.

**Follow-up, same day: disabled Render's auto-deploy, temporarily.** Harkirat's call, explicitly
framed as "for now" — he plans to actually investigate the Gateway hang properly rather than keep
absorbing an unexplained restart-time risk on every push. `git push` no longer redeploys the bot;
a manual `render deploys create srv-d850b2og4nts73fhpfog --confirm` is now a required, separate
step, documented in `CLAUDE.md`, `SESSION-START.md`, and `feedback_push_means_full_cycle.md`. This
doesn't fix or explain the hang — it just reduces how often a restart happens (and therefore how
often the risk is live) while the real investigation is still pending. Re-enable once that
happens; don't let "temporary" quietly become permanent without someone actually deciding that.

## 2026-07-18 — The v2 quick-wins polish batch: 8 filed items, shipped in one pass

Every item in this session was already fully specified — filed with a `[Priority · Effort]` tag in
CLAUDE.md's "Next planned work" from earlier planning sessions, several with the design decision
already made (e.g. the admin-override's "must not swap in his data" constraint was called out in the
filing itself). This was a straight execution session, not a design one, but two of the eight items
had a real correctness trap hiding under a simple-looking ask.

**The admin-override trap.** "Never block ALLOWED_ADMIN_ID on someone else's panel" sounds like a
one-line fix — relax `interaction.user.id !== targetUserId` to also allow the admin ID. But every one
of the 7 lock sites (`/settings`' toggle/set/set_page buttons, all 4 View Colors handlers) re-renders
by calling back into `settings.js`'s or `colorPalette.js`'s own logic, which reads `interaction.user`
directly to decide WHOSE avatar/banner/prefs to show. Relaxing only the block check would have let
Harkirat past the door, then silently rendered his own profile on someone else's panel — a worse bug
than the block it was fixing, and exactly the failure mode the filing note had already flagged by
name. Fixed with a `resolvePanelActor()` helper that returns the real target's fetched discord.js User
object (or null to deny), and a synthetic interaction with `.user` swapped only at the specific call
sites that read it — `deferReply`/`sendV2Payload` stay on the real interaction throughout, since they
only need the token, not the user. Verified this reasoning against the actual code (didn't just trust
the filing's warning at face value) before writing the fix.

**The loadout search fallback tested honestly.** The naive "auto-resolve to the closest fuzzy match"
option from the filing note was checked against real data before picking it: `findWeaponMatches('loc',
...)` against a sample set returned BOTH `LOCUS` and `Lockwood 300` — auto-resolving either would have
been a genuine wrong-answer risk, not a hypothetical one. Landed on ambiguity-based branching instead
(exactly one match auto-resolves, 2+ asks the user to pick) rather than either option the filing note
posed as an either/or — same instinct as the "test the naive alternative before a big rebuild" habit
this project already has, just applied to a small fix instead of a big redesign.

**Mechanical but worth noting:** `/manage`'s `section` option got renamed to `data_for`, not `data for`
— Discord option names can't contain spaces at all, a constraint the filing note's exact wording
("data for") didn't account for. Caught before it ever hit `SlashCommandBuilder.setName()`'s own
validation (would have thrown at command-registration time, not silently).

All 8 items verified via `node -c` syntax checks + directly instantiating every touched
`SlashCommandBuilder` and calling `.toJSON()` (catches an invalid option name/description the same way
Discord's own registration would, without needing a live bot connection) — no live Discord click-test
was performed this session (would have needed briefly running a second bot instance alongside the
already-live VM one, the exact multiple-instances hazard this project explicitly avoids); flagged
explicitly as unverified-live rather than claimed as tested.
