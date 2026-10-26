#!/bin/bash
# ⚠️ Comments here are SOFT-WRAPPED: `npm run docs:reflow-comments` gates .sh files, so after editing this header run `node scripts/reflow-comments.mjs --write <this file>` or `npm test` goes red. overwrite-guard.sh — PreToolUse on Bash. ASKS before a shell command clobbers a file that already exists.
#
# WHY THIS EXISTS — THREE VIOLATIONS, THREE DIFFERENT MECHANISMS (see memory feedback_verify_before_force_overwrite)
# ------------------------------------------------------------------------------------------------------------------
#   · 2026-07-25  Artifact force:true      overwrote a correct artifact on a guess.
#   · 2026-08-21  plain shell `mv`         destroyed local/handoff/2026-08-21-portal-session-B.md — a human-written
#                                          starting prompt. UNRECOVERABLE: untracked, no git, no Time Machine, nothing.
#   · 2026-08-26  `cat > access.logic.js`  replaced a file holding permsAfter/describePending, and it was COMMITTED.
#
# After the first, a hook was added — gating the `Artifact` tool. Incidents two and three walked straight past it because they used Bash. THE RULE IS ABOUT A BEHAVIOUR AND THE GUARD WAS ABOUT A TOOL. That is the gap this closes, and the memory says so in its own words: *"If this happens a third time, that gap is the fix to make, not another paragraph here."* It happened a third time.
#
# WHY BASH SPECIFICALLY IS THE HOLE. Artifact is hooked. `Edit` refuses to touch a file unread this session. `Write` refuses to overwrite an unread existing file. Bash has NO such guard and at least five ways to clobber: mv, cp, > redirection, tee, rm. `cat > f` reads as "write a file" and is actually "delete a file, then write one".
#
# THE ONE DESIGN RULE THAT KEEPS IT ALIVE: **fire ONLY when the destination already exists.** Writing a new file is the common case and must stay silent, or this becomes noise, gets filtered, and manufactures a feeling of coverage while protecting nothing.
#
# PARSING IS DELIBERATELY SHALLOW. Extracting a destination from arbitrary shell is genuinely hard (quoting, vars, $(), multiple redirects). A gate that tries to be complete will be confidently wrong. This covers the literal shapes the three real incidents used and lets exotic forms through — a guard for what actually happens beats a parser that mis-parses.
#
# 🔴 ASK ONLY WHEN UNRECOVERABLE (Harkirat, 2026-08-30 13:15 EDT). An UNTRACKED destination interrupts with `permissionDecision:"ask"` — that is the 2026-08-21 case, where the file was gone for good. A TRACKED destination is advisory only: it is one `git show HEAD:<path>` away, so interrupting an autonomous run for it costs more than it saves. This keeps the teeth exactly where the loss is permanent, and is why the message always states which kind it found.
#
# ASK, NEVER DENY — Harkirat's standing constraint: *"a gate is better than advisory but i dont want it denying things."*

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Heredoc BODIES are content, not commands. A python/shell heredoc that writes files routinely contains > and mv inside strings; scanning the body produces false positives on the repo's own standard scripted-multi-edit technique.
scan=$(printf '%s' "$cmd" | awk '
  /<<-?'"'"'?[A-Za-z_]+'"'"'?/ && !inhd { match($0, /<<-?'"'"'?[A-Za-z_]+'"'"'?/);
    d=substr($0, RSTART, RLENGTH); gsub(/^<<-?'"'"'?|'"'"'$/, "", d); inhd=1; print; next }
  inhd && $0 == d { inhd=0; next }
  !inhd { print }')

ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
targets=""

add() {   # $1 = candidate path
  p="$1"
  [ -z "$p" ] && return
  case "$p" in
    /dev/*|/proc/*|-*|'') return ;;          # devices and flags are never real destinations
    # EPHEMERAL SCRATCH is unambiguously ours to discard, and firing on it is how this guard dies of noise. Found by LIVE FIRE 2026-08-30 12:21 EDT: the guard's own verification run redirected a suite log to /tmp and tripped it. A gate that interrupts routine scratch writes gets filtered, and then it is not protecting the handoff file either.
    /tmp/*|/private/tmp/*|/var/folders/*|*/scratchpad/*|*.log|*.tmp) return ;;
    *'$'*|*'`'*|*'*'*|*'?'*) return ;;       # unexpanded var/glob — cannot resolve it honestly, so stay quiet
  esac
  case "$p" in /*) abs="$p" ;; *) abs="$ROOT/$p" ;; esac
  [ -f "$abs" ] || return                    # THE load-bearing condition: only an EXISTING file counts
  case "$targets" in *"|$abs|"*) return ;; esac
  targets="${targets}|$abs|"
}

# ── truncating redirects: `> path` and `tee path`, never `>>` (append is not overwrite) and never `2>&1`
while IFS= read -r t; do add "$t"; done <<EOF
$(printf '%s' "$scan" | grep -oE '[^>]>[[:space:]]*[^>&|;[:space:]]+' | sed -E 's/^.*>[[:space:]]*//')
EOF
while IFS= read -r t; do add "$t"; done <<EOF
$(printf '%s' "$scan" | grep -oE '(^|[|;&[:space:]])tee([[:space:]]+-[A-Za-z]+)*[[:space:]]+[^-][^|;&[:space:]]*' | sed -E 's/.*[[:space:]]//')
EOF
# ── mv / cp / git mv: the DESTINATION is the last argument. `git mv` is included because its refusal on an untracked source was incident 2's ignored signal, and the fallback to plain mv is what did the damage.
while IFS= read -r seg; do
  [ -z "$seg" ] && continue
  dest=$(printf '%s' "$seg" | sed -E 's/[|;&].*//' | awk '{print $NF}')
  add "$dest"
done <<EOF
$(printf '%s' "$scan" | grep -oE '(^|[|;&(][[:space:]]*)(git[[:space:]]+)?(mv|cp)[[:space:]]+[^|;&]+')
EOF
# ── rm: only worth asking about when the file is UNTRACKED, i.e. genuinely unrecoverable. ⏱️ BOUNDED. Measured 2026-08-30 13:05 EDT: the rm branch costs ~40ms per candidate (two `git ls-files` calls each), so a 60-file rm took 2,442ms and ~400 files would blow the 15s PreToolUse timeout — and a hook that times out is a hook that silently does not run, which is worse than one that misses a case. Cap the scan; a bulk delete of hundreds of files is not the shape any of the three real incidents took (each was ONE named path).
RM_CAP=20
rm_seen=0
rmtargets=""
while IFS= read -r seg; do
  [ -z "$seg" ] && continue
  for a in $(printf '%s' "$seg" | sed -E 's/^[[:space:]]*(rm|[|;&(][[:space:]]*rm)[[:space:]]+//'); do
    case "$a" in -*) continue ;; esac
    # Same ephemeral-scratch carve-out the overwrite path applies. FOUND BY LIVE FIRE 2026-08-30 13:05 EDT: the rm branch has its own loop and never called add(), so it kept interrupting on `rm /tmp/probe.sh` — the carve-out existed but only on one of the two paths. A guard that is right on one branch and noisy on the other still gets filtered.
    case "$a" in
      /tmp/*|/private/tmp/*|/var/folders/*|*/scratchpad/*|*.log|*.tmp) continue ;;
    esac
    case "$a" in /*) abs="$a" ;; *) abs="$ROOT/$a" ;; esac
    [ -f "$abs" ] || continue
    rm_seen=$((rm_seen+1)); [ "$rm_seen" -gt "$RM_CAP" ] && break
    git -C "$(dirname "$abs")" ls-files --error-unmatch "$abs" >/dev/null 2>&1 && continue
    rmtargets="${rmtargets}|$abs|"
  done
done <<EOF
$(printf '%s' "$scan" | grep -oE '(^|[|;&(][[:space:]]*)rm[[:space:]]+[^|;&]+')
EOF

[ -z "$targets" ] && [ -z "$rmtargets" ] && exit 0

report=""
unrecoverable=0
emit_one() {
  abs="$1"; verb="$2"
  sz=$(wc -c <"$abs" 2>/dev/null | tr -d ' ')
  mt=$(stat -f '%Sm' -t '%Y-%m-%d %H:%M' "$abs" 2>/dev/null)
  if git -C "$(dirname "$abs")" ls-files --error-unmatch "$abs" >/dev/null 2>&1; then
    rec="TRACKED in git — recoverable with: git show HEAD:$(basename "$abs")"
  else
    rec="🔴 UNTRACKED — there is NO recovery. This is exactly how the 2026-08-21 handoff file was lost."
    unrecoverable=1
  fi
  report="${report}
  · $verb  ${abs#$ROOT/}   (${sz:-?} bytes, modified ${mt:-?})
      $rec"
}
IFS='|'; for t in $targets; do [ -n "$t" ] && emit_one "$t" "OVERWRITES"; done
for t in $rmtargets; do [ -n "$t" ] && emit_one "$t" "DELETES"; done
unset IFS

msg=$(printf 'OVERWRITE GUARD — this command destroys the current contents of a file that already exists:%s\n\nHave you actually READ what is there? Not inferred it, not seen the filename in an earlier ls — read it. This rule has been broken three times (Artifact force:true · shell mv · cat > heredoc), each time by substituting an inference for a two-second read that was fully available.\n\nIf a safer tool just refused this operation, that refusal was the signal — not an obstacle to route around with a less-guarded one.\n\nFull record: memory feedback_verify_before_force_overwrite.' "$report")

if [ "$unrecoverable" -eq 1 ]; then
  # UNTRACKED: no git history, no recovery. Worth interrupting an autonomous run for.
  printf '%s' "$msg" | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:.,additionalContext:.}}'
else
  # TRACKED only: recoverable with one `git show`, so warn and let the work continue.
  printf '%s' "$msg" | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
fi
