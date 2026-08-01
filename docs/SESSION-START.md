# Session-start prompt — Dior's Builds

> ## ⚡ FIRST ACTION THIS SESSION — HARD GATE, before ANY other content in your opening message
> **Do not write task content, exploration, tool calls, or a greeting before this.** Your literal first
> lines of output this session MUST be: **(1)** a ready-to-paste `/rename` string in the format
> `Model<Ver>-<Effort> · <Title> · <Mon DD>` (e.g. `Opus5-H · Webhook alerts · Jul 20`), and **(2)** a
> one-line best **model + single effort level** recommendation for this session's work — and on a large
> opening batch, a short "defer these to their own session" list (each with its own model+effort). This is
> a standing non-negotiable (`feedback_suggest_model_switch` memory) that **degraded repeatedly across
> sessions** (including on Opus 4.8-High — see `feedback_docs_at_push_time`'s compliance-drift note)
> because nothing structurally enforced it. The `UserPromptSubmit` hook re-injects this as a per-turn
> nudge until it's done — **a nudge you keep receiving after your first response means you skipped it; go
> back and do it now, don't wait for a natural pause.** A hook can only *remind*, it cannot *compute* the
> recommendation or verify you complied — that verification is entirely on you, every single session, no
> exceptions for "this session felt too urgent to pause for it." Full spec below + in memory.

**This file is auto-loaded into every session by the `SessionStart` hook** in
`.claude/settings.json` — it does not need pasting. `user_working_agreement.md` points here as
the single source; it is NOT mirrored there, so edit this file directly.

**Moved to `docs/SESSION-START.md` (2026-07-18)** — this file, `CHANGELOG.md`, `CHANGELOG-SUMMARY.md`,
`DEVLOG.md`, and the central notes scratchpad now live tracked in git under `docs/`, no longer
gitignored/local-only (Harkirat's request, for real `git diff` history instead of manual snapshots).
The hook path in `.claude/settings.json` was updated to match — if you ever see the "NOT FOUND"
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

1. Read ~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/user_working_agreement.md
   in full (it links every other memory). CLAUDE.md (root) holds the invariants + a 🗺️
   navigation map; deep subsystem detail lives in path-scoped `.claude/rules/*.md` (loads
   ONLY when you touch matching code) and `docs/` (ROADMAP, reference/ ops+history) —
   modularized 2026-07-22, follow the root nav map to find a topic. Skim the changelog-system
   memory before touching any changelog or version number.
   Also read `docs/diors-builds notes.md` — my central scratchpad for thoughts/plans.
   It's raw intake, NOT source of truth (CLAUDE.md + the rules are); keep it tidy, and mark
   items [x] implemented / [-] abandoned per its own header. See the central-notes memory.
   ⚠️ Canonical Diors memory = the -Applications-Claude-Code-Diors-Builds path (the repo's
   CURRENT slug — read/write ONLY there). MIGRATED there 2026-07-28 01:41 EDT from the old
   -Applications-Diors-Builds slug, which is now a frozen backup with a _MIGRATED.md tombstone
   in it — never write to the old path. The old "fixed store is move-proof, don't migrate" rule
   is RETIRED: its bridge was a pointer note, i.e. instruction-following, which fails silently.
   The parked memory-architecture redesign's claim on this path was RELEASED by Harkirat for
   Diors specifically — the general defer-to-owning-project rule still stands.
   See project_memory_slug_migration + feedback_defer_to_owning_project.

2. NON-NEGOTIABLES — I've had to re-flag these before, so self-check them without
   waiting to be reminded:
   • Never push, merge, or deploy without asking me first — every time; approval never carries over.
     Branch commits are the one FREE exception (checkpoints, no version, never reach `main` alone
     under squash-merge) — don't ask for those.
   • **GLOSSARY (rewritten 2026-07-24 12:24 EDT for the Branch → Commit → Test → Push → PR → Merge → Deploy
     workflow; **Test** step added 2026-07-26 13:45 EDT — supersedes the 2026-07-18 "4 separable steps on `main`" wording; full design:
     `docs/superpowers/specs/2026-07-24-git-branch-pr-workflow-design.md`, canonical memory
     `project_git_workflow.md`):**
     - **Branch** = `git checkout -b feat/x` off `main` for a feature. Free, no approval.
     - **Commit** = `git commit` on the branch — a free checkpoint ("save progress"). No approval, no
       version. We never commit directly to `main` anymore (a rare direct-to-`main` hotfix commit is
       the one exception, still gated like a push).
     - **Test** = running the branch on the **local dev bot** (`node --watch --env-file=.env.dev index.js`)
       and exercising it live in Discord. Free, no approval — added 2026-07-26 13:45 EDT when `Dioreo (Dev)`
       was built. **This is now the default before asking to push/merge anything user-visible**, instead
       of shipping untested or asking Harkirat to eyeball prod. `--watch` auto-restarts on every save and
       branch switch. Setup + caveats: `docs/reference/deployment-and-ops.md`.
     - **Push** = `git push -u origin feat/x` (the BRANCH, not `main`). Uploads the branch to GitHub;
       the live bot is untouched. Asked.
     - **PR** = `gh pr create` — "done, or done pending review/testing." `--draft` ONLY when a real
       test/review gap exists, ready otherwise. Not an approval gate (solo repo, can't self-approve) —
       it's the review/staging surface + the version anchor. Free (an already-approved push just gets
       organized into a PR).
     - **Merge** = `gh pr merge --squash` + `package.json` version bump + `git tag -a vX.Y.Z <squash-sha>`.
       **This is where the version is minted** — asked, and the merge-yes IS the version-number-yes
       (state the proposed number in the same breath). MAJOR bumps (→ v3) always need a separate
       explicit ask. Each merged PR collapses to ONE commit on `main` = one version = one tag.
     - **Deploy** = making a merged commit go live on the VM: `./scripts/deploy.sh` (or the raw
       `gcloud compute ssh diors-builds-bot --zone=us-east1-b --command="cd ~/diors-builds && ./scripts/deploy.sh"`)
       → verify `scripts/vmstatus.sh` (gateway line green, restarts sane, DEPLOY block showing
       up-to-date, errors ~0 — but read the ERRORS block's `NOT LIVE` banner if present, since a zero
       there can mean "no source" rather than "no errors"; `🔌 Shard 0
       ready`/handleBotReady are the real "connected" proof, not just "process up") → confirm exactly
       ONE instance is running **on the PROD token** (the VM is it — stop any local run that uses prod's
       `.env`). ⚠️ Corrected 2026-07-26 13:45 EDT: this rule is **per-token**, not per-machine. The local
       dev bot (`Dioreo (Dev)`, its own application + token, run via `node --watch --env-file=.env.dev index.js`)
       does NOT conflict and does NOT need stopping — running it alongside prod is the intended setup.
       **Separate
       and optional per merge** — a merged version can sit undeployed indefinitely (docs-only being the
       obvious case); `main`'s version and the VM's running version (its boot alert reads `package.json`)
       can legitimately diverge. Asked.
     - **Document** = updating the written record: CLAUDE.md (invariants/nav) **or the matching
       `.claude/rules/*.md`** (subsystem detail) + `docs/ROADMAP.md` (if the roadmap changed) + relevant
       memory files + `docs/CHANGELOG.md` + `docs/CHANGELOG-SUMMARY.md` (+ a `docs/DEVLOG.md` narrative
       entry for a notable arc) + this central notes file (mark resolved items). Docs now ride IN the
       PR's diff (drafted on the branch as the change happens, finalized — real number + squash hash +
       tag — at merge), reviewed alongside the code rather than a separate "at push time" ritual.
       Whichever of these are actually relevant to what changed — not a fixed checklist to run through
       blindly.
     - **Say plainly which steps actually happened** ("merged v2.x, deploy held") — never let "merged"
       imply "live," the same discipline the old wording asked for around "pushed."
     - "Document" specifically is NOT only triggered by a merge — a planning/roadmap session with NO
       code and NO branch still needs it if the roadmap or a standing rule changed: sync `docs/ROADMAP.md`
       AND both changelog roadmap sections (sourced from it, must not drift) AND a DEVLOG entry. The
       changelog is the one step that keeps getting skipped — don't skip it.
     See [[reference_vm_bot_commands]], [[project_deployment_migration_render_to_gcp]],
     [[project_git_workflow]], [[feedback_push_means_full_cycle]], [[feedback_docs_at_push_time]]. Bot
     alerts a Discord channel on each (re)start + on errors.
   • Versioning is 3-part vMAJOR.MODERATE.MINOR, **minted at MERGE, not push** (changed 2026-07-24 12:24 EDT): a
     significant merged PR bumps MODERATE (resets MINOR to 0), a small one bumps MINOR; NEVER bump
     MAJOR (→ v3) without asking me. ONE version number per merged PR, not per commit or per push — a
     PR of N checkpoint commits still gets one number via the squash. An open branch/PR IS the new
     "Unreleased" (proposed number sits in the changelog's Unreleased section, graduates to a real
     numbered entry + tag at squash-merge); unreleased branch commits carry no version, referenced
     informally as "based on `<last merged version>`, at commit `<sha>`."
     **Git-tag the squash commit on every merge** — `git tag -a v2.18.1 <squash-sha> -m "..."`, then
     push the tag. **This works only because the changelog entry + `package.json` bump are finalized on
     the branch as the final pre-merge checkpoint** (adopted 2026-07-27 21:27 EDT), so the squash commit
     already reads the tagged version. The entry cites `(#PR)` with **no hash**; the hash is backfilled
     one release later, on the next release's branch — additively, never by `--amend` or force-push. The
     newest entry lacking a hash is correct, not drift. *(v2.33.0–v2.35.15 predate this: 16 of the 25
     were tagged on a separate `chore(release)` commit, now retired — don't re-tag those. Six others
     (v2.33.3, v2.33.4, v2.35.0–v2.35.3) have a genuinely stale `package.json` at the tag; tracked, not
     fixed. Details: `docs/reference/deployment-and-ops.md` § Version tagging.)* `git describe --tags` on any later commit shows exactly how many commits deep past
     the last merged version you are, for free. **When backfilling a historical tag, cross-check
     CHANGELOG.md directly — don't trust commit messages alone**: a first pass once missed `v2.18.1`
     entirely because none of its 3 bundled commits (`f7b4575`/`c4b1c19`/`1600b8e`) mention "v2.18.1" in
     their own message; only CHANGELOG.md's actual entry names which commits it covers. **The FULL tag
     backfill (pre-workflow-overhaul history) is DONE (2026-07-21): every version `v1.0.0`→`v2.30.2` is
     tagged, 58 tags, zero gaps** (the earlier "no clean 1:1 mapping" concern was a false premise —
     almost every CHANGELOG entry cites its own commit hash). See the "Version tagging" reference in
     `docs/reference/deployment-and-ops.md`.
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
     `/rename [HOLD/MonDD] Opus5-M · Title · Mon DD` (updated 2026-07-17): optional
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
     **ON THE SAME TOKEN** first (`ps aux | grep index.js`) before any code/cache theory. The
     separate-token dev bot is not a collision (Render/Railway are both retired).

3. Work style: be token-conscious (batch calls, don't re-read what's already in context);
   check sibling code before guessing from prose/screenshots; verify a fix actually works
   (real repro or a trace point, not just "looks right"); test the naive alternative before
   a big rebuild.

4. Infra facts: user-installed-only bot — only ONE instance may run **per bot token** (corrected
   2026-07-26 13:45 EDT; there is now a **local dev bot** on its own token — see
   `project_local_dev_bot` + `docs/reference/deployment-and-ops.md` — which runs alongside prod by
   design). HOST = GCP VM `diors-builds-bot` (us-east1-b, project gen-lang-client-0549308254) under
   systemd (unit `diors-bot`, auto-restart on crash + reboot). Deploy = git push + `git pull &&
   systemctl restart` on the VM. Render RETIRED/suspended (delete ~2026-07-24). Secrets
   (BOT_TOKEN / MONGODB_URI / CLOUDINARY_URL / LOG_WEBHOOK_URL) live in `.env` (local + on the VM).
   `scripts/vmstatus.sh` = health, `scripts/vmpeaks.sh` = CPU peaks. See [[reference_vm_bot_commands]].

If anything here conflicts with what you find in the docs, flag it — don't silently pick one.
```
