#!/bin/bash
# Proofs for overwrite-guard.sh. The three TRUE positives are the three real incidents; the false positives are the shapes that would kill the guard by noise if it fired on them.
HOOK="$(cd "$(dirname "$0")" && pwd)/overwrite-guard.sh"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
mkdir -p "$T/local/handoff" "$T/portal/ui" "$T/docs"
printf 'existing content\n' > "$T/local/handoff/session-B.md"
printf 'module.exports={};\n' > "$T/portal/ui/access.logic.js"
printf 'draft\n' > "$T/draft.md"
printf 'tracked\n' > "$T/docs/tracked.md"
git -C "$T" init -q 2>/dev/null; git -C "$T" add docs/tracked.md 2>/dev/null
git -C "$T" -c user.email=t@t -c user.name=t commit -qm init 2>/dev/null
pass=0; fail=0
r(){ local raw; raw="$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | CLAUDE_PROJECT_DIR="$T" bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.permissionDecisionReason // .hookSpecificOutput.additionalContext // "SILENT"'; }
# Which MODE did it choose? Harkirat 2026-08-30 13:15 EDT: interrupt only when the loss is permanent.
mode(){ local raw; raw="$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | CLAUDE_PROJECT_DIR="$T" bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.permissionDecision // "advisory"'; }
m(){ local n="$1" want="$2" got; got="$(mode "$3")"
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n (want $want got $got)"; fail=$((fail+1)); fi; }
a(){ local n="$1" want="$2" out got; out="$(r "$3")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n (want $want got $got)"; fail=$((fail+1)); fi; }
echo "overwrite-guard.sh — proofs"
# ── TRUE POSITIVES: the three real incidents, reproduced.
a "incident 2: mv onto existing"      fires  "mv draft.md local/handoff/session-B.md"
a "incident 3: cat > existing"        fires  "cat > portal/ui/access.logic.js"
a "git mv onto existing"              fires  "git mv draft.md local/handoff/session-B.md"
a "cp onto existing"                  fires  "cp draft.md local/handoff/session-B.md"
a "tee onto existing"                 fires  "echo x | tee local/handoff/session-B.md"
a "rm of an UNTRACKED existing file"  fires  "rm local/handoff/session-B.md"
# ── FALSE POSITIVES that would kill it. Each of these is a command run many times per session.
a "new file is not an overwrite"      silent "cat > brand-new-file.md"
a "mv to a NEW path"                  silent "mv draft.md local/handoff/brand-new.md"
a ">> append is not overwrite"        silent "echo x >> local/handoff/session-B.md"
a "redirect to /dev/null"             silent "npm test > /dev/null"
a "2>&1 fd redirect"                  silent "npm run docs:audit 2>&1 | head"
a "rm of a TRACKED file (recoverable)" silent "rm docs/tracked.md"
a "heredoc BODY containing mv and >"  silent "$(printf 'python3 - <<%sPYEOF%s\ns=open("x").read()\n# mv a b and cat > c\nPYEOF' "'" "'")"
a "no file operation at all"          silent "rg -n pattern docs/"
a "unexpanded variable target"        silent 'mv draft.md "$DEST"'
# ── EPHEMERAL SCRATCH. Found by LIVE FIRE, not by reasoning: the guard tripped on its own verification run writing a suite log to /tmp. These are ours to discard, and interrupting them is how the guard gets filtered into uselessness before it ever sees a real handoff file.
a "redirect to a /tmp scratch log"    silent "npm test > /tmp/t3.log 2>&1"
a "redirect to a .log anywhere"       silent "npm run docs:audit > docs/audit.log"
a "session scratchpad path"           silent "echo x > /private/tmp/claude-501/sess/scratchpad/notes.txt"
# …but the carve-out must NOT swallow a real project file that merely lives near one.
a "real file still fires"             fires  "cat > portal/ui/access.logic.js"
# ── 🔴 THE ASK/ADVISORY SPLIT. Interrupting is reserved for the unrecoverable case; a tracked file is one `git show HEAD:<path>` away, and stalling an autonomous run for it costs more than it saves.
m "UNTRACKED destination -> ask"      ask       "mv draft.md local/handoff/session-B.md"
m "TRACKED destination -> advisory"   advisory  "cat > docs/tracked.md"
m "no target at all -> silent"        SILENT    "rg -n pattern docs/"
# ── the rm branch has its OWN loop, so the scratch carve-out has to be proven separately. It was missing there and fired on `rm /tmp/probe.sh` during this session's own parallelism experiment.
a "rm of a /tmp scratch file"         silent "rm /tmp/probe.sh"
a "rm of a .log file"                 silent "rm build.log"
a "rm of a real untracked file fires" fires  "rm draft.md"
# ── ⏱️ BOUNDED. ~40ms per rm candidate; an unbounded scan of hundreds would exceed the 15s PreToolUse timeout, and a timed-out hook does not run at all. Prove the cap holds the cost down.
mkdir -p "$T/many"; i=0; while [ $i -lt 80 ]; do printf 'x\n' > "$T/many/f$i.txt"; i=$((i+1)); done
st=$(date +%s); r "rm $(cd "$T/many" && ls | sed 's|^|many/|' | tr '\n' ' ')" >/dev/null; en=$(date +%s)
if [ $((en-st)) -le 3 ]; then echo "  PASS  80-file rm stays well inside the 15s timeout"; pass=$((pass+1));
else echo "  FAIL  80-file rm took $((en-st))s — approaching the hook timeout"; fail=$((fail+1)); fi
# ── the message must carry the fact that changes the decision
out="$(r 'mv draft.md local/handoff/session-B.md')"
case "$out" in *UNTRACKED*) echo "  PASS  names UNTRACKED (unrecoverable)"; pass=$((pass+1));;
  *) echo "  FAIL  message omits the tracked/untracked fact"; fail=$((fail+1));; esac
case "$out" in *"feedback_verify_before_force_overwrite"*) echo "  PASS  cites the memory"; pass=$((pass+1));;
  *) echo "  FAIL  message does not point at the record"; fail=$((fail+1));; esac
echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
