# Session-start prompt — Dior's Builds

**This file is auto-loaded into every session by the `SessionStart` hook** in
`.claude/settings.local.json` — it does not need pasting. `user_working_agreement.md` points here as
the single source; it is NOT mirrored there, so edit this file directly.

**Moved to `docs/SESSION-START.md` (2026-07-18)** — this file, `CHANGELOG.md`, `CHANGELOG-SUMMARY.md`,
`DEVLOG.md`, and the central notes scratchpad now live tracked in git under `docs/`, no longer
gitignored/local-only (Harkirat's request, for real `git diff` history instead of manual snapshots).
The hook path in `.claude/settings.local.json` was updated to match — if you ever see the "NOT FOUND"
warning below, check that path first.

> **Hook health (2026-07-15):** the hook pointed at `/Applications/Diors-Builds/SESSION-START.md` for
> an unknown period after the repo moved to `/Applications/Claude Code/Diors-Builds`. `2>/dev/null`
> swallowed the error, so it silently injected an EMPTY string and none of the below loaded for any
> session. Now resolved via `$CLAUDE_PROJECT_DIR` and it prints a loud ⚠️ warning if the file is ever
> missing again instead of going quiet. If you ever see that warning in context, say so immediately.

The block below is pointers + only the recurring-miss items — the rest lives in the docs it tells
Claude to read.

Shortcut: even *"New session on Dior's Builds — follow my standing start prompt (working agreement
first; push/document/versioning/chapters/single-instance/model-rec non-negotiables apply)"* works;
paste the full block after any session where something slipped.

---

```
New session on Dior's Builds. Before anything else:

1. Read ~/.claude/projects/-Applications-Diors-Builds/memory/user_working_agreement.md
   in full (it links every other memory), treat CLAUDE.md as the deepest source of
   truth for this repo, and skim the changelog-system memory before touching any
   changelog or version number.
   Also read `docs/diors-builds notes.md` — my central scratchpad for thoughts/plans.
   It's raw intake, NOT source of truth (CLAUDE.md is); keep it tidy, and mark items
   [x] implemented / [-] abandoned per its own header. See the central-notes memory.
   ⚠️ Canonical Diors memory = the -Applications-Diors-Builds path (read/write ONLY there).
   The harness may point you at -Applications-Claude-Code-Diors-Builds (repo-slug): its folder
   exists (transcripts) but Diors memory is NOT there — don't migrate it (fixed store =
   move-proof). And do NOT create/delete/symlink that slug's memory/ path — it's claimed by the
   PAUSED cross-project memory-architecture redesign (symlink → canonical planned); leave it,
   defer to that project (a Diors session wrongly deleted it 2026-07-17 on a superseded note).
   See feedback_defer_to_owning_project.

2. NON-NEGOTIABLES — I've had to re-flag these before, so self-check them without
   waiting to be reminded:
   • Never commit or push without asking me first — every time; approval never carries over.
   • "Push" = the FULL cycle to the GCP VM (cutover done 2026-07-17; Render RETIRED/suspended, don't
     deploy to it). Commit → `git push origin main` → deploy to the VM: `gcloud compute ssh
     diors-builds-bot --zone=us-east1-b --command="cd ~/diors-builds && git pull && sudo systemctl
     restart diors-bot"` → verify `scripts/vmstatus.sh` (gateway line green, restarts sane, errors ~0;
     `🔌 Shard 0 ready`/handleBotReady are the real "connected" proof, not just "process up") → exactly
     ONE instance (single-token; the VM is it — stop any local test run). A `git push` alone does NOT
     update the VM. See [[reference_vm_bot_commands]], [[project_deployment_migration_render_to_gcp]],
     [[feedback_push_means_full_cycle]]. Bot alerts a Discord channel on each (re)start + on errors.
   • "Document" = ALL layers, at push time: CLAUDE.md + the relevant memory files +
     docs/CHANGELOG.md + docs/CHANGELOG-SUMMARY.md (+ a docs/DEVLOG.md narrative entry for a notable arc).
     The changelog is the one that keeps getting skipped — don't skip it.
     This ALSO applies to planning/roadmap sessions with NO code and NO push: if you changed
     the roadmap or a standing rule, sync CLAUDE.md's planned-work AND both changelog roadmap
     sections (they're sourced from it and must not drift) AND a DEVLOG entry.
   • Versioning is 3-part vMAJOR.MODERATE.MINOR: a significant push bumps MODERATE (resets
     MINOR to 0), a small follow-up bumps MINOR; NEVER bump MAJOR (→ v3) without asking me.
     Cross-check the full `git log` so no push gets missed. ONE version number per PUSH, not
     per commit — a push of N commits gets one number listing every hash. Anything committed
     but not pushed goes in docs/CHANGELOG.md's "Unreleased" section with a proposed number.
     **Git-tag every real push's version (added 2026-07-16)** — e.g. `git tag -a v2.18.1
     <hash> -m "..."` on the exact push commit (for a multi-commit push, tag the LAST commit
     in that push, not the first). Complements the Unreleased-section proposed number, doesn't
     replace it: the CHANGELOG's proposed number is the human-readable plan, the tag is the
     permanent, unambiguous marker once it's real. Once tagged, `git describe --tags` on any
     later commit shows exactly how many commits deep past the last real push you are, for
     free. **When backfilling a tag, cross-check CHANGELOG.md directly — don't trust commit
     messages alone**: a first pass here missed `v2.18.1` entirely because none of its 3 bundled
     commits (`f7b4575`/`c4b1c19`/`1600b8e`) mention "v2.18.1" in their own message; only
     CHANGELOG.md's actual entry names which commits it covers. Backfilled tags currently:
     `v2.17.3` (`426a444`), `v2.18.0` (`5c403a7`), `v2.18.1` (`1600b8e`). Did NOT backfill the
     full history back to v1.0 — most earlier bumps span date-grouped CHANGELOG ranges without
     an unambiguous 1:1 commit mapping, and a wrong permanent tag is worse than no tag. See
     CLAUDE.md's "Version tagging" section.
   • Mark chat chapters FINELY — one per distinct TOPIC (a question answered, a problem
     debugged, a small task done), NOT per broad phase; even one-edit tasks get one, and
     so do answers with no tool calls. Often ~1 per turn that raises something new.
     THE COUNT IS NEVER A TARGET OR A LIMIT — it just follows however many distinct topics
     the session actually has: 12, 30, 50+, no ceiling. Only ever ask "is this a distinct
     subject?", never "have I marked too many?" — when unsure, MARK IT: over-marking costs
     me one click to unpin, under-marking costs me re-reading a whole session to find and
     add what's missing. Err high; the errors aren't symmetric. This overrides the built-in "use sparingly
     / 3-8 per session" default — that kind of range is exactly what hardened into a cap
     before (I re-pinned 12 by hand in a session Claude marked 2). Mark as you START a
     subject. The hook only nudges; marking is on you, and you can't read them back.
   • Proactively recommend ONE model + ONE effort level (never a range). On a big session-
     opening batch: recommend the single best setup for the session as a whole, then list any
     tasks to DEFER to their own session, each with its own model+effort (that's my
     work-weight estimate). Hand me a ready-to-paste rename string, formatted
     `/rename [HOLD/MonDD] Opus4.8-M · Title · Mon DD` (updated 2026-07-17): optional
     `[HOLD/MonDD]` leading flag ONLY when the project's on hold (compact hold-date, e.g.
     `[HOLD/Jul17]`), then Model<Version>-<Effort> (no space before the version, effort
     abbreviated L/M/H/X/Max), then " · " title, then " · Mon DD" = the SESSION START date
     (spaced, e.g. `· Jul 16`). Why: the desktop model picker is GLOBAL/live, not per-session,
     so after I use another model elsewhere it shows the wrong one when I come back — the
     session title is the only per-session record of what this session should run. Full spec
     in the working agreement's model-switch memory.
   • When work should move to a NEW session (deferred tasks, a contingency effort/model bump —
     new session, NEVER mid-session — end-of-session continuation, or long/near-compaction
     context), proactively hand me a TIGHT, pasteable handoff prompt (+ the /rename string) so it
     starts aligned with no re-derivation or wasted tokens. See feedback_session_handoff_prompts.
   • If the bot behaves erratically or inconsistently, suspect MULTIPLE RUNNING INSTANCES
     first (`ps aux | grep index.js`, Railway, Render) before any code/cache theory.

3. Work style: be token-conscious (batch calls, don't re-read what's already in context);
   check sibling code before guessing from prose/screenshots; verify a fix actually works
   (real repro or a trace point, not just "looks right"); test the naive alternative before
   a big rebuild.

4. Infra facts: single-token, user-installed-only bot — only ONE instance may run anywhere at
   once. HOST = GCP VM `diors-builds-bot` (us-east1-b, project gen-lang-client-0549308254) under
   systemd (unit `diors-bot`, auto-restart on crash + reboot). Deploy = git push + `git pull &&
   systemctl restart` on the VM. Render RETIRED/suspended (delete ~2026-07-24). Secrets
   (BOT_TOKEN / MONGODB_URI / CLOUDINARY_URL / LOG_WEBHOOK_URL) live in `.env` (local + on the VM).
   `scripts/vmstatus.sh` = health, `scripts/vmpeaks.sh` = CPU peaks. See [[reference_vm_bot_commands]].

If anything here conflicts with what you find in the docs, flag it — don't silently pick one.
```
