#!/bin/bash
# Proofs for notes-hardwrap-check.sh — the gate that exists because a prose rule was violated three
# separate times. Its awk state machine has one genuinely subtle case (the bare `-->` closing line,
# which an earlier version counted as prose and mis-fired on), so it is pinned here.

HOOK="$(cd "$(dirname "$0")" && pwd)/notes-hardwrap-check.sh"
pass=0; fail=0
NOTES="/Applications/Claude Code/Diors-Builds/docs/ideas/diors-notes.md"

r() { local o; o=$(printf '{"tool_input":{"file_path":%s,"new_string":%s}}' \
        "$(printf '%s' "$1" | jq -Rs .)" "$(printf '%s' "$2" | jq -Rs .)" | bash "$HOOK")
      [ -z "$o" ] && { echo SILENT; return; }
      printf '%s' "$o" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a() { local n="$1" want="$2" out; out="$(r "$3" "$4")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (want $want, got $got)"; fail=$((fail+1)); fi; }

echo "notes-hardwrap-check.sh — proofs"

# --- scope: only the notes file ---
a "other files ignored"            silent "/tmp/README.md" "$(printf '<!-- a\nb -->\n')"
a "empty content ignored"          silent "$NOTES" ""

# --- the violation it was built for ---
a "prose split across lines fires" fires "$NOTES" "$(printf '<!-- this is a long comment that\nwas hard broken mid sentence -->\n')"
a "three-line prose comment fires" fires "$NOTES" "$(printf '<!-- one\ntwo\nthree -->\n')"

# --- legitimate shapes that must stay silent ---
a "single-line comment is fine"    silent "$NOTES" "<!-- all on one physical line, however long it happens to run -->"
a "no comment at all is fine"      silent "$NOTES" "$(printf 'just some\nordinary lines\n')"
# Harkirat's explicit carve-out: a real bulleted list inside a comment, one bullet per line.
a "bulleted list carve-out"        silent "$NOTES" "$(printf '<!-- intro\n- first\n- second\n-->\n')"
a "numbered list carve-out"        silent "$NOTES" "$(printf '<!-- intro\n1. first\n2. second\n-->\n')"
# The subtle one: a bare `-->` on its own closing line is a DELIMITER, not prose. An earlier version
# counted it and fired on the bulleted carve-out because of it.
a "bare --> closing line is not prose" silent "$NOTES" "$(printf '<!-- intro\n* only a bullet\n-->\n')"
# …but a comment that ends mid-sentence on the closing line IS prose and must still fire.
a "text before --> still counts"   fires  "$NOTES" "$(printf '<!-- intro\nreal prose here -->\n')"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
