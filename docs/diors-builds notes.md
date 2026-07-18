# A dynamic scratchpad for Harkirat's thoughts and notes for the diors-builds discord bot project.
***Note Purpose:** This note is a personal scratchpad used to jot down thoughts and ideas freely.
**Note Organization:** The note may contain duplicate or overlapping thoughts, and points might not strictly adhere to the provided sub-sections.
**Note Reliability:** This note is not the definitive source of truth for the project and should be used with discretion.
**Claude:** Read this file at the start of each session, when prompted, or while navigating our "Document" flow. As needed, reorganize, restructure, reword, or merge the thoughts and notes to keep it tidy. Mark a resolved point `- [x] ✓ ~~text~~` if it was implemented/shipped, or `- [x] ✗ ~~text~~` if it was abandoned/dropped — both use a CHECKED box (checked always means "closed," never "still open"; `[-]` used to mean abandoned but isn't real checkbox syntax and never rendered as ticked off, so it's retired) with the ✓/✗ typographic mark placed right after `[x]`, before the strikethrough text, so the outcome is visible at a glance without reading to the end of a long note. Implement, edit, or remove line or block comments for any points as you see fit.*

<!-- HOW THIS FILE WORKS (reworked 2026-07-18, Claude — replaces the old "filed stays unmarked" note):
     This is a SCRATCHPAD, not a store. Thoughts don't live here forever.
       1. New thoughts land in the working sections below as raw INTAKE.
       2. On a tidy pass, each actionable thought is FILED into its real home — a feature/bug → CLAUDE.md
          "Next planned work" + both CHANGELOG roadmaps; a workflow lesson → memory; a reminder/cross-project
          item → /Applications/Claude Code/deferred-items.md — and then LEAVES the working sections. The
          roadmap is NOT duplicated here anymore (see the pointer below); CLAUDE.md is the source of truth.
       3. A thought that's been RESOLVED is marked in place — `[x] ✓` (shipped/answered) or `[x] ✗`
          (abandoned/dropped) — reworked 2026-07-18 (v2) to retire `[-]`, which isn't real GFM checkbox
          syntax and never actually rendered as ticked-off, unlike `[x]`. Both now use a CHECKED box (a
          checked box means "closed," period — the ✓/✗ distinguishes HOW it closed) with the mark
          up front, right after `[x]`, so it's visible without reading a long note to the end. Then, on
          the NEXT session's read, swept down into the Graveyard (kept one cycle first so it stays
          visible in-context). Marks made in the SAME session stay put until next time.
     Never silently delete — always file or move. Every tidy is snapshotted to docs/notes-archive/ first, so
     nothing is ever truly lost. Last tidied 2026-07-18 (dated snapshots + Graveyard-above-Space + this model).
     MOVED to docs/ (2026-07-18) — this file and its notes-archive/ snapshots are now tracked in git
     (no longer gitignored under local/); see the Graveyard entry below for the full history of that decision. -->

---
---

## Questions/Notes for Claude
*Answers recorded inline; kept here as a reference record until swept to the Graveyard.*

- [x] ✓ ~~Cloudinary confusion: do I still need to rename loadout screenshots to a strict naming structure before uploading? The secondary-weapon files aren't named strictly, yet I had to rename the FSS screenshot before it showed on the embed. And — are the seasonal lucky-draw images and patch-notes images actually saved in their own Cloudinary folders like we designed, or just in my main asset folder?~~
  <!-- ANSWERED 2026-07-18 (Claude), from the documented design:
     • LOADOUT images: there's no global "strict naming" rule anymore — the ONE rule is that the Cloudinary
       public_id must equal whatever `imageKey` you saved on that loadout. `buildImageUrl()` builds the embed
       URL straight from `imageKey` (bare key OR full external URL). FSS didn't render until you renamed the
       file to match its `imageKey`; that's the whole cause. The old Excel-era strict naming was just the
       convention that kept the two in sync. Secondaries have no loadouts yet → no `imageKey` to match → their
       filenames don't matter until a loadout references them.
     • DRAW thumbnails: designed to be auto-rehosted by the bot into the `temp_draws/` folder
       (utils/cloudinaryCache.js — you give a URL, Cloudinary fetches the bytes; public_id = slug of the draw
       title). You shouldn't need to hand-manage these.
     • PATCH-NOTES images: designed to auto-cache into `patch_notes/{patchId}/` (utils/patchNotesCache.js),
       season-based retention.
     • OPEN part (now FILED, not resolved): whether they're ACTUALLY landing in those folders in your live
       account (you think they look like they're in the main folder) is a read-only verify item →
       CLAUDE.md "Verify Cloudinary folder organization" + CHANGELOG Known-issues. And the "make the image/
       naming flow self-explanatory" ask is folded into the filed "/manage loadout data-entry UX overhaul". -->

-

---

## General / Meta
*Collaboration & workflow preferences for how we work together. Despite the name, items here can also be cross-project or aimed at a different project entirely — not strictly Diors-Builds bot features.*

- [x] ✓ ~~honestly, we need a MUCH BETTER system of handling this file. We need to actively organize, edit, place/move things around so the file stays "fresh" instead of building up endlessly — points moved to a defer/to-do file or section, some removed, some sitting crossed out, some prioritized/de-prioritized, and some handled in the same session the file was read.~~ <!-- RESOLVED 2026-07-18 (this session): built the intake-only model documented at the top — thoughts get filed to their real home (CLAUDE.md/changelogs/memory/deferred-items) and leave this file; resolved items are marked then swept to the Graveyard on the next read. The whole v2–v5 roadmap that used to live here was moved into CLAUDE.md and replaced with the pointer below. project_central_notes_file memory updated to match. -->
- [x] ✓ ~~maybe we should also sync it to GitHub? That way you can Diff the old committed file vs the local one to see what changed. Or can you already do that yourself even if it lives locally only?~~ <!-- RESOLVED 2026-07-18, then SUPERSEDED same day: originally answered "gitignored, can't diff — use dated snapshots instead" (below), but Harkirat then asked to actually un-gitignore this file (+ CHANGELOG/CHANGELOG-SUMMARY/DEVLOG/SESSION-START) so a real `git diff`/`git log` is available going forward, moving them all into a new tracked `docs/` folder. Snapshots up to this point (`docs/notes-archive/`) are kept for history; going forward, real git history covers the same need, so the manual pre-tidy-snapshot step is no longer strictly necessary (Claude's call at the next tidy whether to keep doing it). Original answer, preserved for context: the main repo CAN'T diff this file — it's gitignored (and can't be pushed anyway, because of your private Space). So instead: DATED SNAPSHOTS. Before every tidy I copy the whole file to `local/notes-archive/diors-builds notes YYYY-MM-DD.md` (a raw byte-copy — private, stays in gitignored local/, preserves your Space untouched). Diff any two dates with a normal file diff. First snapshot: 2026-07-18 (pre-tidy). -->
- [x] ✓ ~~we DEFINITELY need a place to track current bugs so they never go missed or stale.~~ <!-- RESOLVED (built 2026-07-17): the 🐞 Active Bugs section at the top of /Applications/Claude Code/deferred-items.md — a confirmed bug lands there with a repro the moment it's found, and only leaves when fixed or proven not-a-bug. A session touching a bug's area checks there first. -->

-

---
---

## 📍 Roadmap lives in CLAUDE.md now — not here

The bot's actual feature roadmap (**v2 near-term → v3 → v4 → v5**) is maintained in **CLAUDE.md → "Next
planned work"**, mirrored in both changelog roadmap sections (`CHANGELOG.md` "🔮 Planned & Upcoming" +
`CHANGELOG-SUMMARY.md` "🔜 Coming soon"). CLAUDE.md is the source of truth; those are its synced views.

**This scratchpad no longer duplicates that list** (it was the main thing making the file endless). New
feature ideas start here as intake in the sections above, then get filed into CLAUDE.md + the changelogs on
the next tidy. To see or change the roadmap, go there. The deferred maintenance/tech-debt long-tail +
cross-project reminders live in `/Applications/Claude Code/deferred-items.md`.

---
---

# Graveyard
*Where filed/resolved intake comes to rest. On a tidy, items marked `[x] ✓` (shipped) or `[x] ✗`
(abandoned) in the working sections above are swept down here on the NEXT session's read — not the
same session they were marked, so they stay visible in-context for one cycle first. Feature ideas that got filed into their real
home (CLAUDE.md roadmap / deferred-items) simply leave the working sections; the roadmap is their home now,
not here. Don't run the sweep more than once per session.*

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
  `local/notes-archive/diors-builds notes 2026-07-18 (pre-tidy).md`.

---

## Questions/Notes for Claude

- [x] ✓ ~~The Perf finding — explain it simply, why we have the current method, the tradeoff of reworking it, and why it wasn't flagged during yesterday's efficiency/CPU pass.~~ <!-- ANSWERED 2026-07-15: pagination does 2 network hops (deferUpdate, then a separate patch to update the message); the alternative is a single UPDATE_MESSAGE (1 hop, snappier). Agreed HYBRID: light string-building commands → single-hop; heavy/attachment paths (View Colors, ffmpeg, k-means) → keep defer-then-patch, where blowing the 3s ACK is a real risk. Not flagged yesterday because that pass hunted the View Colors CPU/freeze bug, not baseline click latency — a different question. Full writeup in CLAUDE.md "Known open issues". -->
- [x] ✓ ~~Can a user-installed bot fetch *another* user's colors if I add a user-select option? Can it see all members of a server/GC without being a guild bot?~~ <!-- ANSWERED 2026-07-15: (1) Fetch another user by ID — YES, GET /users/{id} is global, no shared guild needed; avatar/banner/display_name_styles/nameplate/deco all return. (2) Get the ID via an .addUserOption() picker — very likely YES (client-side picker, no member-list access) but confirm at build. (3) Enumerate ALL members — NO, needs the privileged GUILD_MEMBERS intent + real guild membership (the 50001 wall). You don't need enumeration; the picker sidesteps it. Note: tweak the header wording when a user pulls someone else's colors instead of their own. -->
- [x] ✓ ~~Do we need to change any bot settings on the Discord Dev Portal? Any permission changes?~~ <!-- ANSWERED 2026-07-15: v2 — none. v3 — none. v4 (guild install + text commands) — YES: enable Guild Install, add setIntegrationTypes([0,1]), enable the privileged MESSAGE CONTENT intent (Discord approval past 100 servers), and real guild membership w/ View Channel + Send Messages. v5 — none (Cloudinary-side). -->

---

## General / Meta

- [x] ✓ ~~Stop repeating reminders I already know and have documented~~ (e.g. "I can't boot the bot locally without racing the live instance"). Only worth restating if I haven't touched the bot in weeks/months. <!-- DONE 2026-07-15: filed into feedback_be_usage_conscious — drop caveats that just restate my own documented rules; keep only the useful "what was/wasn't verified" residue. -->
- [x] ✓ ~~Recommend ONE effort level, not a range~~ (e.g. "Opus 4.8 medium", not "medium-high"). <!-- DONE 2026-07-15: feedback_suggest_model_switch — one model + one effort; tie-break to the lower level. -->
- [x] ✓ ~~On a big session-opening batch, auto-suggest the best model+effort for the session, and flag which tasks to defer to their own session (with each one's own model+effort, so I gauge the workload).~~ <!-- DONE 2026-07-15: "session-start batch triage" in feedback_suggest_model_switch. -->
- [x] ✓ ~~Show the active model+effort in the session so I don't accidentally run on the wrong one.~~ <!-- SOLVED 2026-07-15: not a hook (nothing can set the CURRENT session's title, no model-change hook exists). Instead a /rename convention — I hand you a ready-to-paste string at session start: `[HOLD/MonDD] Model<Ver>-<Effort> · Title · Mon DD` (e.g. `Opus4.8-M · Central notes intake · Jul 17`). The desktop picker is global/live and can't remember per-session; the title can. Spec in feedback_suggest_model_switch. -->
- [x] ✓ ~~reword the description for this section. While yea not explicitly bot features, this section can include features that affect other projects or might be directed towards a different project.~~ <!-- DONE 2026-07-17: reworded the section description above per this request. -->
- [x] ✓ ~~we implemented git tags to the GitHub commits but I think some of them might be "off/incorrect", we need to verify those. I guess that's part of the "backfill git tags" task that was deferred during that particular session.~~ <!-- VERIFIED 2026-07-17: all 6 tags (v2.17.3→v2.19.0) map correctly to their CHANGELOG commits (multi-commit pushes tagged on the LAST commit). Nothing off. Pre-v2.17.3 remains deliberately untagged (no clean 1:1 mapping) = the still-open 'backfill' task. -->
- [x] ✓ ~~also do you want to reference/link that deferral .md into this notes file? … wait scratch that, let's keep it separate.~~ <!-- RESOLVED by Harkirat inline (~Jul 17): keep deferred-items.md SEPARATE, not merged/linked into this file. -->
- [x] ✓ ~~also, regarding the deferral list file, if you keep it separated, tidy it up like how you did here. Adjust the design/structure to best fit its own situation.~~ <!-- DONE 2026-07-17: restructured deferred-items.md — 🐞 Active Bugs at top + Reminders/per-project(with model+effort)/Someday/Resolved grouping. -->
- [x] ✓ ~~can we implement a way where, for items deferred to a new session, at the end you give me a solid start prompt + title for that planned session, so it's easier to continue seamlessly. Use judgement on whether a deferral warrants a full handoff prompt vs just keeping it pending.~~ <!-- PRACTICED / standing behavior (feedback_session_handoff_prompts): end-of-session handoff prompts for deferred work — e.g. the alerting IDs/log handoff. -->

---

## Resolved intake — bugs & one-offs

- [x] ✓ ~~Tried to edit an MP loadout via /manage → Edit; searched "FSS", clicked Edit on the ephemeral prompt, got "Dior's Builds didn't respond in time". Adding a new FSS Hurricane loadout first didn't help — same error.~~ <!-- FIXED 2026-07-17 (v2.20.0): the mng_editbtn_ button handler was misplaced in the isModalSubmit() block → dead code → no ACK → timeout. Moved to isButton(); broke Edit for ALL entities, all fixed. Needs one live re-click after the deploy to confirm end-to-end. See CLAUDE.md "SEQUEL BUG" note. -->
- [x] ✓ ~~why are the Edit and Search Again buttons in 2 separate rows? Can't you put them inline as 1 row?~~ <!-- DONE 2026-07-17 (v2.20.0): single-match Edit prompt now puts Edit + Search Again in ONE row. Multi-match keeps 2 rows (a select menu must be its own row, can't sit beside a button). -->
- [x] ✗ ~~I think the bulk replace button for MP loadouts just opens the bulk add modal — both open the same modal.~~ <!-- NOT A BUG (2026-07-17): intentional & documented in CLAUDE.md. Loadouts' "Replace Multiple" is a deliberate placeholder that routes into the same upsert modal as "Add Multiple" until the real "search + multi-select" admin flow is built (on the deferred list). The upsert already covers replace semantics. Marked abandoned-as-stated. -->

---
---

# Harkirat's Space
*⚠️**CLAUDE READ THIS** // Anything below is my unfiltered thoughts and notes. They're not for you to read, save, implement, edit, delete, reword, or reorganize, unless explicitly told to do so—never assume; ask for confirmation. Even if explicitly told, that permission expires with the real or implied end of a session or after 12 hours, whichever is shortest. Usually, I'll manually place them in the sections above when I'm ready, and then you can act on those points accordingly. But as long as anything is below here, it's in MY SPACE AND NOT MEANT TO BE TOUCHED OR READ! // **END***

- owo
