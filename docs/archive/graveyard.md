# 🪦 Graveyard — resolved & filed intake from the notes scratchpad

**Archive. Not active content. Do not read this file by default.**

Where resolved and filed intake from **`docs/diors-builds notes.md`** comes to rest. Split out of that
file into `docs/archive/` on **2026-07-25 21:43 EDT** (Harkirat's ask) — it used to be a `# Graveyard`
section living at the bottom of the notes file, where it was pure context bloat: a dead archive riding
along in every read of an active scratchpad. The notes file now ends at its working sections and points
here instead.

## The sweep rule (unchanged, only the destination moved)
- An item is swept out of the notes file's working sections once it is **marked** (`[x] ✓` shipped /
  `[x] ✗` abandoned) **AND** carries **Harkirat's own confirmation mark**. Claude's ✓/✗ alone is not
  proof he has seen the answer — without his mark an item stays in the working sections indefinitely,
  however many sessions pass. (His rule, 2026-07-18.)
- Sweep on the **next** session's read, never the same session an item was marked — marks stay visible
  in-context for one cycle first.
- Don't run the sweep more than once per session.
- Items moved here keep their original wording, marks, dates, and comments verbatim. **Never delete —
  always move.** Append new sweeps as a dated `### 🗂️ YYYY-MM-DD sweep` block, newest at the bottom.
- Feature ideas that got **filed** into their real home (`docs/ROADMAP.md`, a `.claude/rules/*.md`,
  `docs/db-deferred-list.md`) simply leave the notes file — the destination is their home now, not here.
  Only a *filing ledger* recording where they went belongs here.

## Its sibling in this folder
`docs/archive/resolved-list.md` — the same idea for **`docs/db-deferred-list.md`**: resolved, shipped,
and dropped deferred-items entries move there. Two archives, deliberately separate, so it stays obvious
which active file a given dead item came out of.

*Also in this folder: `diors-builds notes 2026-07-18 (pre-tidy).md`, a dated pre-tidy snapshot from
before the notes file was tracked in git. Largely superseded by `git log` now.*

---

## 🗂️ Sweeps & filing ledgers (newest last)

### 🗂️ 2026-07-21 sweep (ℋ-confirmed items moved from the working sections — overdue, they had carried Harkirat’s confirmation since 2026-07-18)
- [x] ℋ ✓ (2026-07-18) ~~Also I’ve noticed there’s no longer the v2, v3, etc sections in this file. Can you explain/help me understand how you sorted/formatted things during your cleanup of the file? And how I should write future notes or thoughts directed specifically at those versions? Im not mad, im genuinely wondering. Like did you have a better method in mind? Do I just dump them into a collective place and you then use your reasoning to sort them into their appropriate sections wherever you have them stored? And you’d also create and modify sections to fit that collective dump of thoughts, or confirm/ask me, or use something I stated/mentioned in the thought, etc? Just want us to both be on the same page. :)~~
  <!-- ANSWERED 2026-07-18 (Claude): the whole v2–v5 list used to be duplicated here AND in CLAUDE.md, and the two drifted apart over time — this file's copy was the bigger driver of the "endless file" problem you flagged, so the 2026-07-18 tidy deleted the duplicate and left CLAUDE.md's "Next planned work" as the ONE place it lives (mirrored into both CHANGELOG roadmap sections, never this file). Going forward: just keep dumping version-specific thoughts here as plain intake in Questions/Notes or General/Meta — you don't need to sort them by version yourself. On a tidy pass I read CLAUDE.md's existing version buckets and place each thought into whichever one it actually fits, creating or modifying a bucket if none fits, or asking you directly if it's genuinely unclear which version something belongs to — same judgment call I already make for feature ideas today, just applied to version-tagging too. -->
- [x] ℋ ✓ (2026-07-18) ~~maybe 𓉸 or ✴︎ or ⚡︎ or ⌯⌲ or 𝓓 or ℋ or ⟢ for the confirmation/acknowledgement symbol? Or do you suggest something else?~~
  <!-- RESOLVED 2026-07-18 (Claude): went through several rounds against a growing artifact (7→9→15 candidate symbols/colors, with size/contrast/hue-sorted views) before landing on the final set now live in the 🔑 Legend above and in the real MarkEdit menu: 4 shortlisted symbols (✴︎ ✦ ◆ ℋ), 8 final colors. All switchable, not narrowed to one fixed pick — matches how the extension was actually built (a live Default Symbol / Default Color menu, not hardcoded values). -->

### 🗂️ 2026-07-18 filing ledger (moved out of the working sections into their real homes — nothing lost)
- **Filed to CLAUDE.md "Next planned work" + both CHANGELOG roadmaps:** `/manage` loadout data-entry UX
  overhaul (old L55/L73 + image-naming half of L59) · reword `/manage` `section`→`data for` (L56) · richer
  in-bot diagnostic logging (L57) · admin `/status` command (L60) · `/manage` per-page accent colors (L61) ·
  announcement feature (L64, v3) · easy bot sharing / `/invite` (L58, v3) · user-friendly bot/ops guide (L34,
  someday) · verify Cloudinary folder organization (L59, Known-issues) · webhook alerting heavy-half added to
  the changelog roadmap for parity (L72 — already in deferred-items + the Deployment section).
- **Already-synced roadmap items that used to be duplicated here** (v2 batch 1&2, all of v3/v4/v5): removed
  from this file — they were already in CLAUDE.md, so keeping a second copy here was pure drift risk.
- The full pre-tidy file (including every one of the above in its original wording) is preserved at
  `docs/archive/diors-builds notes 2026-07-18 (pre-tidy).md` — written here as `local/notes-archive/…`
  at the time; the notes file and its snapshots moved to tracked `docs/` on 2026-07-18, and
  `docs/notes-archive/` was renamed `docs/archive/` on 2026-07-25 21:43 EDT.

---

## 📦 Earliest swept intake (pre-2026-07-18, grouped by the notes section it came out of)
*Swept before the dated-sweep convention existed, so these carry no sweep block of their own. Their
own inline dates (2026-07-15 → 2026-07-17) are the real record.*

### Questions/Notes for Claude

- [x] ✓ ~~The Perf finding — explain it simply, why we have the current method, the tradeoff of reworking it, and why it wasn't flagged during yesterday's efficiency/CPU pass.~~ <!-- ANSWERED 2026-07-15: pagination does 2 network hops (deferUpdate, then a separate patch to update the message); the alternative is a single UPDATE_MESSAGE (1 hop, snappier). Agreed HYBRID: light string-building commands → single-hop; heavy/attachment paths (View Colors, ffmpeg, k-means) → keep defer-then-patch, where blowing the 3s ACK is a real risk. Not flagged yesterday because that pass hunted the View Colors CPU/freeze bug, not baseline click latency — a different question. Full writeup in CLAUDE.md "Known open issues". -->
- [x] ✓ ~~Can a user-installed bot fetch *another* user's colors if I add a user-select option? Can it see all members of a server/GC without being a guild bot?~~ <!-- ANSWERED 2026-07-15: (1) Fetch another user by ID — YES, GET /users/{id} is global, no shared guild needed; avatar/banner/display_name_styles/nameplate/deco all return. (2) Get the ID via an .addUserOption() picker — very likely YES (client-side picker, no member-list access) but confirm at build. (3) Enumerate ALL members — NO, needs the privileged GUILD_MEMBERS intent + real guild membership (the 50001 wall). You don't need enumeration; the picker sidesteps it. Note: tweak the header wording when a user pulls someone else's colors instead of their own. -->
- [x] ✓ ~~Do we need to change any bot settings on the Discord Dev Portal? Any permission changes?~~ <!-- ANSWERED 2026-07-15: v2 — none. v3 — none. v4 (guild install + text commands) — YES: enable Guild Install, add setIntegrationTypes([0,1]), enable the privileged MESSAGE CONTENT intent (Discord approval past 100 servers), and real guild membership w/ View Channel + Send Messages. v5 — none (Cloudinary-side). -->

### General / Meta

- [x] ✓ ~~Stop repeating reminders I already know and have documented~~ (e.g. "I can't boot the bot locally without racing the live instance"). Only worth restating if I haven't touched the bot in weeks/months. <!-- DONE 2026-07-15: filed into feedback_be_usage_conscious — drop caveats that just restate my own documented rules; keep only the useful "what was/wasn't verified" residue. -->
- [x] ✓ ~~Recommend ONE effort level, not a range~~ (e.g. "Opus 4.8 medium", not "medium-high"). <!-- DONE 2026-07-15: feedback_suggest_model_switch — one model + one effort; tie-break to the lower level. -->
- [x] ✓ ~~On a big session-opening batch, auto-suggest the best model+effort for the session, and flag which tasks to defer to their own session (with each one's own model+effort, so I gauge the workload).~~ <!-- DONE 2026-07-15: "session-start batch triage" in feedback_suggest_model_switch. -->
- [x] ✓ ~~Show the active model+effort in the session so I don't accidentally run on the wrong one.~~ <!-- SOLVED 2026-07-15: not a hook (nothing can set the CURRENT session's title, no model-change hook exists). Instead a /rename convention — I hand you a ready-to-paste string at session start: `[HOLD/MonDD] Model<Ver>-<Effort> · Title · Mon DD` (e.g. `Opus4.8-M · Central notes intake · Jul 17`). The desktop picker is global/live and can't remember per-session; the title can. Spec in feedback_suggest_model_switch. -->
- [x] ✓ ~~reword the description for this section. While yea not explicitly bot features, this section can include features that affect other projects or might be directed towards a different project.~~ <!-- DONE 2026-07-17: reworded the section description above per this request. -->
- [x] ✓ ~~we implemented git tags to the GitHub commits but I think some of them might be "off/incorrect", we need to verify those. I guess that's part of the "backfill git tags" task that was deferred during that particular session.~~ <!-- VERIFIED 2026-07-17: all 6 tags (v2.17.3→v2.19.0) map correctly to their CHANGELOG commits (multi-commit pushes tagged on the LAST commit). Nothing off. Pre-v2.17.3 remains deliberately untagged (no clean 1:1 mapping) = the still-open 'backfill' task. --><!-- UPDATE 2026-07-21: BACKFILL NOW COMPLETE — every version v1.0.0→v2.30.2 is tagged (58 tags, zero gaps). The "no clean 1:1 mapping" reason turned out false: nearly every pre-v2.17.3 CHANGELOG entry already cited its own commit hash; the 2 that didn't (v2.6.0/v2.7.0) were resolved from the git log, and the whole mapping was verified monotonic before pushing. See CLAUDE.md's version-tagging note. This task is fully done. -->
- [x] ✓ ~~also do you want to reference/link that deferral .md into this notes file? … wait scratch that, let's keep it separate.~~ <!-- RESOLVED by Harkirat inline (~Jul 17): keep deferred-items.md SEPARATE, not merged/linked into this file. -->
- [x] ✓ ~~also, regarding the deferral list file, if you keep it separated, tidy it up like how you did here. Adjust the design/structure to best fit its own situation.~~ <!-- DONE 2026-07-17: restructured deferred-items.md — 🐞 Active Bugs at top + Reminders/per-project(with model+effort)/Someday/Resolved grouping. -->
- [x] ✓ ~~can we implement a way where, for items deferred to a new session, at the end you give me a solid start prompt + title for that planned session, so it's easier to continue seamlessly. Use judgement on whether a deferral warrants a full handoff prompt vs just keeping it pending.~~ <!-- PRACTICED / standing behavior (feedback_session_handoff_prompts): end-of-session handoff prompts for deferred work — e.g. the alerting IDs/log handoff. -->

### Resolved intake — bugs & one-offs

- [x] ✓ ~~Tried to edit an MP loadout via /manage → Edit; searched "FSS", clicked Edit on the ephemeral prompt, got "Dior's Builds didn't respond in time". Adding a new FSS Hurricane loadout first didn't help — same error.~~ <!-- FIXED 2026-07-17 (v2.20.0): the mng_editbtn_ button handler was misplaced in the isModalSubmit() block → dead code → no ACK → timeout. Moved to isButton(); broke Edit for ALL entities, all fixed. Needs one live re-click after the deploy to confirm end-to-end. See CLAUDE.md "SEQUEL BUG" note. -->
- [x] ✓ ~~why are the Edit and Search Again buttons in 2 separate rows? Can't you put them inline as 1 row?~~ <!-- DONE 2026-07-17 (v2.20.0): single-match Edit prompt now puts Edit + Search Again in ONE row. Multi-match keeps 2 rows (a select menu must be its own row, can't sit beside a button). -->
- [x] ✗ ~~I think the bulk replace button for MP loadouts just opens the bulk add modal — both open the same modal.~~ <!-- NOT A BUG (2026-07-17): intentional & documented in CLAUDE.md. Loadouts' "Replace Multiple" is a deliberate placeholder that routes into the same upsert modal as "Add Multiple" until the real "search + multi-select" admin flow is built (on the deferred list). The upsert already covers replace semantics. Marked abandoned-as-stated. -->
