#!/usr/bin/env bash
# PreToolUse(Bash) gate on `gh pr create` — the BACKWARD-verification sweep.
#
# WHY THIS EXISTS (2026-07-28 16:45 EDT, Harkirat's ask): The recurring complaint, in his words: "EVERY session I have to ask to double check and verify things, and it ALWAYS catches errors."
#
# Root cause, named honestly: I verify FORWARD (does the thing I built work?) and not BACKWARD (what did building it make untrue?). Both are real verification; only the first one happens on its own. In the v2.41.0 session I tested the rewritten script on the Mac, on the VM, in both log sources, with malformed args, and boot-tested the bot — all forward, all passing — then declared it ready to push. The sweep Harkirat then asked for found: a memory file documenting the RETIRED deploy workflow, two `.claude/rules/` files describing the old behaviour, a stale ROADMAP note, a stale SESSION-START note, and a genuine pre-existing bug in `deploy.sh`'s use of the very script being rewritten. Every one of those files contained the string "vmstatus" and none of them were opened.
#
# That is mechanically checkable, which per `reference_enforcement_hooks` means it must be a hook and not a fifth prose copy of "remember to check references" — prose rules have a measured failure rate here (`grep` 788x vs `rg` 4x). The rule this enforces: if you changed a file, every OTHER file that names it is a candidate for having just become wrong.
#
# Silent when the branch is clean. It only speaks when there is something unswept — so the interruption is exactly proportional to the miss, and doing the job properly costs nothing.

set -uo pipefail
# ⚠️ CLAUDE_PROJECT_DIR, not a hardcoded path. Fixed 2026-07-29 00:45 EDT after discovering it while using a worktree to avoid disturbing a parallel session: superpowers' using-git-worktrees skill actively encourages worktrees, and with the path pinned to the main tree this gate silently inspected the WRONG branch -- reporting clean about work that isn't there, or dirty about work you can't see. A gate that answers confidently about the wrong tree is worse than no gate.
REPO="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
MEM="$HOME/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory"

# ⚠️ EXTERNAL ROOTS — trees OUTSIDE this repo that hardcode paths INSIDE it. Added 2026-08-06 09:10 EDT after a measured miss: moving the notes scratchpad to docs/ideas/diors-notes.md broke `dior notes` outright, and FOUR repo-wide sweeps read clean before an explicit search of ~/.config/dior found it. `rg -uu --hidden` cannot help — the completeness flags address hidden and gitignored files, and this is a DIFFERENT GIT REPOSITORY. No search rooted in this tree can ever reach it, which makes it the one blind spot that is invisible by construction. Anything added here must be a real path; a missing root is skipped rather than reported as clean.
EXTERNAL_ROOTS=("$HOME/.config/dior")

cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

BASE="${1:-main}"
changed=$(git diff --name-only "$BASE...HEAD" 2>/dev/null)
[ -n "$changed" ] || exit 0

# ⚠️ FAIL LOUD IF `rg` IS ABSENT — added 2026-08-02 18:04 EDT. The entire sweep is one `rg` call, so without the binary it found nothing and exited silently, which is byte-identical to "your branch is clean". CI proved this is not hypothetical: the ubuntu runner has no ripgrep and all five real assertions in this hook's test passed as SILENT. Same failure shape the two delegating gates already guard against — "the tool is missing" and "the tool found nothing" must never look the same.
if ! command -v rg >/dev/null 2>&1; then
  printf 'STALE-REFERENCE SWEEP CANNOT RUN: ripgrep (`rg`) is not installed, so NOTHING was swept for stale references on this branch. Do not read this as a clean result — install rg, or check by hand which docs/rules/memory files describe the code you changed.' \
    | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
  exit 0
fi

# ⚠️ `docs/` WAS EXCLUDED HERE AND `.md` WAS NOT IN THE EXTENSION LIST, so a documentation branch produced ZERO subjects and this gate swept NOTHING. Measured 2026-08-06 09:11 EDT: a session that moved the notes scratchpad, split-and-renamed known-issues.md and deleted design-history.md would have generated an empty subject list and exited silently — indistinguishable from clean. The old comment claimed doc-to-doc references were "what the changelog/DEVLOG hooks already cover". They are not: those hooks check that entries EXIST, never that a path in one still resolves. A doc is referenced by other docs exactly as much as a script is, and renaming one is the most reference-breaking thing anyone does in this repo. `stem` replaces `xargs -n1 basename`, which SPLITS ON SPACES — and the very file that motivated this was named "diors-builds notes.md".
stem() { while IFS= read -r p; do [ -n "$p" ] || continue; b="${p##*/}"; printf '%s\n' "${b%.*}"; done; }

subjects=$(printf '%s\n' "$changed" \
  | grep -E '\.(js|mjs|sh|ya?ml|md|json)$' \
  | grep -vE '^node_modules/' \
  | stem | sort -u)

# ⚠️ GONE NAMES — the ones that die SILENTLY, and they were never swept at all. Every subject above comes from a file that still EXISTS. The dangerous case is the opposite: a DELETED file, or the OLD side of a RENAME. Nothing in the tree carries that name any more, so every remaining hit is BY CONSTRUCTION a reference nobody updated — no mtime heuristic needed, no judgement call. This is the exact class that broke `dior notes` and left 12 stale design-history pointers, and the old sweep could not see it because it only ever looked at surviving files. `-M` makes git report a rename as R<score>\told\tnew, so $2 is the old path for both D and R.
gone=$(git diff --name-status -M "$BASE...HEAD" 2>/dev/null \
  | awk -F'\t' '$1=="D"||$1 ~ /^R/{print $2}' \
  | stem | sort -u)

[ -n "$subjects$gone" ] || exit 0

report=""
external=""

# ---- GONE names: search everywhere, including outside this repo ------------------------------ No mtime filter and no "was it touched on this branch" filter: the name no longer exists, so any hit at all is stale. Archive/records/specs are excluded because they are deliberately NOT backdated — an old entry keeps the old name, and flagging those would train the gate into noise. ⚠️ ITERATE WITH `while IFS= read -r`, NEVER `for s in $list`. A bare `for` word-splits on whitespace — and the first real subject this gate ever had was "diors-builds notes", whose SPACE split it into 'diors-builds' and 'notes'. 'notes' then matched half of every tree searched. Caught 2026-08-06 09:12 EDT on this hook's own first live run, which is exactly the SC2086 class that silently updated zero files on 2026-08-02. The space in that filename is why the file was renamed in the first place; it got one last shot on the way out.
too_generic() { case "$1" in index|config|utils|main|test|setup|package|README|CLAUDE|notes|docs|hooks|scripts) return 0;; esac; [ "${#1}" -lt 5 ]; }

# Shared exclusions. Records, archives and dated specs deliberately keep old names — they are NOT backdated — so flagging them would generate permanent unactionable noise, and noise is how a real hit gets skipped. `.git/` is excluded because commit messages and reflogs legitimately contain the old name forever. ⚠️ `!**/.git/**`, not `!.git/**` — rg anchors a leading-slash-free glob differently per search root, and the bare form let /Users/.../.config/dior/.git/COMMIT_EDITMSG through on the first live run. A commit message legitimately names a retired file forever; reporting reflogs is pure noise. `.claude/hooks/**` is skipped for the same reason the subject loop skips it: this gate's own comments name every file it was built to catch, so it would report itself on every run.
RG_SKIP=(--glob '!archive/**' --glob '!CHANGELOG*.md' --glob '!DEVLOG.md'
         --glob '!superpowers/specs/**' --glob '!**/.git/**' --glob '!**/local/**'
         --glob '!**/.claude/hooks/**')

fmt_hits() { sed 's|^|      - |'; }

while IFS= read -r s; do
  [ -n "$s" ] && ! too_generic "$s" || continue
  hits=$(rg --hidden --no-ignore -l --fixed-strings "${RG_SKIP[@]}" \
           "$s" "$REPO/docs" "$REPO/.claude" "$REPO/CLAUDE.md" "$REPO/scripts" "$MEM" 2>/dev/null \
         | sed "s|^$REPO/||" | sort -u | fmt_hits)
  [ -n "$hits" ] && report="$report
  🔴 '$s' NO LONGER EXISTS (deleted or renamed away) yet is still named by:
$hits"
done <<< "$gone"

# ---- EXTERNAL ROOTS: the blind spot no in-repo search can reach -------------------------------
for root in "${EXTERNAL_ROOTS[@]}"; do
  [ -d "$root" ] || continue
  while IFS= read -r s; do
    [ -n "$s" ] && ! too_generic "$s" || continue
    hits=$(rg --hidden --no-ignore -l --fixed-strings "${RG_SKIP[@]}" "$s" "$root" 2>/dev/null | sort -u | fmt_hits)
    [ -n "$hits" ] && external="$external
  🔴 '$s' is GONE from this repo but still hardcoded in:
$hits"
  done <<< "$gone"
  while IFS= read -r s; do
    [ -n "$s" ] && ! too_generic "$s" || continue
    hits=$(rg --hidden --no-ignore -l --fixed-strings "${RG_SKIP[@]}" "$s" "$root" 2>/dev/null | sort -u | fmt_hits)
    [ -n "$hits" ] && external="$external
  ⚠️  '$s' changed here and is also named in:
$hits"
  done <<< "$subjects"
done
for s in $subjects; do
  # Skip names too generic to be a meaningful reference (index, config, utils...) — matching those returns the whole repo and buries the real signal.
  case "$s" in index|config|utils|main|test|setup|package) continue;; esac
  [ "${#s}" -ge 5 ] || continue

  # --hidden --no-ignore is mandatory here: .claude/ is a dot-dir and would otherwise be invisible — which is precisely where two of the stale files that prompted this hook were sitting. memory/archive/ is excluded deliberately: retired memories are FROZEN historical records, so an outdated reference inside one is correct, not drift. Sweeping them would generate permanent noise that can never be actioned — and noise is how a real hit gets ignored.
  hits=$(rg --hidden --no-ignore -l --fixed-strings --glob '!archive/**' "$s" \
           "$REPO/docs" "$REPO/.claude" "$REPO/CLAUDE.md" "$REPO/scripts" "$MEM" 2>/dev/null \
         | sed "s|^$REPO/||" | sort -u)
  [ -n "$hits" ] || continue

  # When did this branch start? Anything edited since then was part of this work and counts as swept.
  branch_start=$(git log -1 --format=%ct "$BASE" 2>/dev/null || echo 0)

  unswept=""
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    # Don't flag this hook, or the sweep would forever report itself for every subject it names.
    case "$f" in .claude/hooks/*) continue;; esac
    # Already updated on this branch? Then it was considered.
    printf '%s\n' "$changed" | grep -qxF "$f" && continue
    # Memory files live OUTSIDE the repo and can never appear in a git diff, so fall back to mtime: touched since the branch started = swept. Without this the same handful of memory files would be listed on every single PR including ones that just updated them — and a gate that cries wolf on work you actually did is a gate that gets dismissed unread.
    case "$f" in
      /*) m=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo 0)
          [ "${m:-0}" -gt "${branch_start:-0}" ] && continue ;;
    esac
    unswept="$unswept
      - $f"
  done <<< "$hits"

  [ -n "$unswept" ] && report="$report
  '$s' is referenced by files NOT touched on this branch:$unswept"
done

[ -n "$report$external" ] || exit 0

# EXTERNAL findings go FIRST and in their own section. They are the ones no other tool, search or session can find, so burying them under a long in-repo list is how they get skipped again.
[ -n "$external" ] && report="
── OUTSIDE THIS REPO — no in-repo search can reach these ──$external
$report"

jq -n --arg r "$report" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: ("STALE-REFERENCE SWEEP (backward verification).\n\nYou changed code that other files DESCRIBE. Those descriptions may have just become wrong -- this is the miss Harkirat has had to catch by hand every session, and it is the reason this gate exists.\n" + $r + "\n\nOpen each one and confirm it is still TRUE of the new behaviour. Fix the stale ones ON THIS BRANCH so they ride in the PR (docs land in the PR -- project_git_workflow). Memory files never appear in a git diff, so they are always listed here; that is deliberate, they go stale the most.\n\nProceed only once you have actually checked them -- not because the list looks short.")
  }
}'
