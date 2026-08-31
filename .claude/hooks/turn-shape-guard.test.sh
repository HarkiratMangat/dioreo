#!/usr/bin/env bash
# turn-shape-guard.test.sh — self-test for turn-shape-guard.sh.
#
# ⚠️ THE FALSIFIER THAT MATTERS: it must fire on a one-at-a-time turn AND stay QUIET on a correctly batched one. A guard that fires on everything becomes furniture — the `nested-worktree` warning's own failure mode, named in the plan this hook was built from.
GATE="$(cd "$(dirname "$0")" && pwd)/turn-shape-guard.sh"
pass=0; fail=0
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Builds one JSONL line for an assistant message carrying the given content blocks (as raw JSON array text).
asst() { printf '{"type":"assistant","message":{"content":%s}}\n' "$1"; }
usermsg() { printf '{"type":"user","role":"user","content":"go"}\n'; }
tooluse() { printf '{"type":"tool_use","name":"%s","input":{}}' "$1"; }
textblk() { printf '{"type":"text","text":"%s"}' "$2"; }

fires() {  # description, transcript-file
  out=$(printf '{"transcript_path":"%s"}' "$2" | bash "$GATE")
  ev=$(printf '%s' "$out" | jq -r '.hookSpecificOutput.hookEventName // empty' 2>/dev/null)
  if [ "$ev" = "Stop" ]; then echo "  ✓ $1"; pass=$((pass+1))
  else echo "  ✗ $1 — expected a Stop block, got: ${out:-<nothing>}"; fail=$((fail+1)); fi
}
silent() {
  out=$(printf '{"transcript_path":"%s"}' "$2" | bash "$GATE")
  if [ -z "$out" ]; then echo "  ✓ $1"; pass=$((pass+1))
  else echo "  ✗ $1 — expected silence, got: $out"; fail=$((fail+1)); fi
}

echo "turn-shape-guard:"

# CASE 1: two consecutive singleton-Bash turns since the last user message -> fires (one-at-a-time).
f1="$work/one-at-a-time.jsonl"
{ usermsg
  asst "[$(tooluse Bash)]"
  asst "[$(tooluse Bash)]"
} > "$f1"
fires "two consecutive single-Bash turns" "$f1"

# CASE 2: one message batching three independent tool calls -> silent (correctly batched).
f2="$work/batched.jsonl"
{ usermsg
  asst "[$(tooluse Bash),$(tooluse Read),$(tooluse Grep)]"
} > "$f2"
silent "one message batching three independent calls" "$f2"

# CASE 3: a single singleton turn (not yet a REPEAT) -> silent. It cannot tell a legitimate first probe from the start of a bad pattern; the signal is the REPEAT, not the first occurrence.
f3="$work/single-once.jsonl"
{ usermsg
  asst "[$(tooluse Bash)]"
} > "$f3"
silent "one singleton call, no repeat yet" "$f3"

# CASE 4: narration text before the first tool call -> fires.
f4="$work/narrated.jsonl"
{ usermsg
  asst "[$(textblk t "Let me check the file first, this should tell us what is going on here today."),$(tooluse Read)]"
} > "$f4"
fires "prose before the first tool call" "$f4"

# CASE 5: a short label before a tool call (<=40 chars) -> silent. Not every leading text block is narration.
f5="$work/short-label.jsonl"
{ usermsg
  asst "[$(textblk t "ok"),$(tooluse Read)]"
} > "$f5"
silent "a short leading text block is not narration" "$f5"

# CASE 6: stop_hook_active true -> silent (avoid an infinite loop re-firing on its own continuation).
f6="$work/reentrant.jsonl"
{ usermsg
  asst "[$(tooluse Bash)]"
  asst "[$(tooluse Bash)]"
} > "$f6"
out=$(printf '{"transcript_path":"%s","stop_hook_active":true}' "$f6" | bash "$GATE")
if [ -z "$out" ]; then echo "  ✓ stop_hook_active=true stays silent even on a firing shape"; pass=$((pass+1))
else echo "  ✗ stop_hook_active=true should suppress re-fire, got: $out"; fail=$((fail+1)); fi

# CASE 7: a serial dependency (two singleton turns) BEFORE this turn's user message must not count — only the CURRENT turn (since the last real user message) is in scope.
f7="$work/prior-turn-not-counted.jsonl"
{ usermsg
  asst "[$(tooluse Bash)]"
  asst "[$(tooluse Bash)]"
  usermsg
  asst "[$(tooluse Bash),$(tooluse Read)]"
} > "$f7"
silent "a prior turn's one-at-a-time pattern does not leak into this turn" "$f7"

# The anti-vacuous case: the fired block must actually name the pattern, not just exist.
out=$(printf '{"transcript_path":"%s"}' "$f1" | bash "$GATE" | jq -r '.hookSpecificOutput.additionalContext' 2>/dev/null)
if printf '%s' "$out" | grep -q "ONE-AT-A-TIME" && printf '%s' "$out" | grep -q "never denies"; then
  echo "  ✓ the block names the pattern and states it never denies"; pass=$((pass+1))
else
  echo "  ✗ the block fired but carries no real instruction: $out"; fail=$((fail+1))
fi

echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ]
