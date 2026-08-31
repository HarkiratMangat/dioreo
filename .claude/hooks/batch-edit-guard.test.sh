#!/usr/bin/env bash
# batch-edit-guard.test.sh — self-test for batch-edit-guard.sh.
#
# ⚠️ WHY THE NARROWING CASES MATTER MORE THAN THE FIRING ONES: on 2026-08-31 a hook suite reported 21/21 green while one of its two rules matched 0 of 13,922 real messages, because every fixture was synthetic and asserted the shape its author already had in mind. The cases below that demand SILENCE are the ones carrying real weight — a guard that fires on every edit is furniture.
GATE="$(cd "$(dirname "$0")" && pwd)/batch-edit-guard.sh"
pass=0; fail=0
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
usermsg() { printf '{"type":"user","role":"user","content":"go"}\n'; }
edit() { printf '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Edit","input":{"file_path":"%s"}}]}}\n' "$1"; }
edit2() { printf '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Edit","input":{"file_path":"%s"}},{"type":"tool_use","name":"Edit","input":{"file_path":"%s"}}]}}\n' "$1" "$2"; }
bash_() { printf '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"npm test"}}]}}\n'; }
call() { printf '{"tool_name":"%s","tool_input":{"file_path":"%s"},"transcript_path":"%s"}' "${3:-Edit}" "$1" "$2" | bash "$GATE"; }
fires() { out=$(call "$2" "$3" "${4:-Edit}"); if [ -n "$out" ]; then echo "  ok  $1"; pass=$((pass+1)); else echo "  FAIL  $1 — expected a warning, got nothing"; fail=$((fail+1)); fi; }
silent() { out=$(call "$2" "$3" "${4:-Edit}"); if [ -z "$out" ]; then echo "  ok  $1"; pass=$((pass+1)); else echo "  FAIL  $1 — expected silence, got: $out"; fail=$((fail+1)); fi; }

echo "batch-edit-guard:"
f="$work/a.jsonl"; { usermsg; edit "/repo/season.js"; } > "$f"
fires "a second edit to a file already edited this turn" "/repo/season.js" "$f"
silent "a first edit to a different file" "/repo/track.js" "$f"

# THE NARROWING: a non-edit call between the two edits is a real dependency (edit -> test -> fix what the test found) and resets by construction, not by judgement.
f2="$work/b.jsonl"; { usermsg; edit "/repo/season.js"; bash_; } > "$f2"
silent "a test run between the two edits resets it" "/repo/season.js" "$f2"

# A batched multi-file edit message is the REMEDY; a file inside it still counts, an untouched one does not.
f3="$work/c.jsonl"; { usermsg; edit2 "/repo/a.js" "/repo/b.js"; } > "$f3"
fires "a file already touched inside a batched edit message still counts" "/repo/a.js" "$f3"
silent "an untouched file after a batched edit message" "/repo/c.js" "$f3"

# Path containment must not produce a false match — pipes delimit for exactly this.
f6="$work/f.jsonl"; { usermsg; edit "/repo/season.js"; } > "$f6"
silent "a path that merely CONTAINS an edited path does not match" "/repo/season.js.bak" "$f6"

f4="$work/d.jsonl"; { usermsg; edit "/repo/season.js"; usermsg; } > "$f4"
silent "a prior turn's edit does not leak into this turn" "/repo/season.js" "$f4"
silent "a Read is not this hook's business" "/repo/season.js" "$f" "Read"

f5="$work/e.jsonl"; { usermsg; edit "/repo/x.md"; } > "$f5"
fires "a Write to a file already Edited this turn" "/repo/x.md" "$f5" "Write"

# Anti-vacuous: the warning must carry the SUBSTITUTE, not just the complaint.
out=$(call "/repo/season.js" "$f")
for want in "PYEOF" "assert" "never denies"; do
  if printf '%s' "$out" | grep -qF "$want"; then echo "  ok  the warning names '$want'"; pass=$((pass+1))
  else echo "  FAIL  the warning omits '$want'"; fail=$((fail+1)); fi
done
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ]
