#!/bin/bash
# Proofs for deferred-list-model-tag-check.sh -- the gate that exists because the standing model-tag rule was missed live, three times in one session, before Harkirat caught it by hand.

HOOK="$(cd "$(dirname "$0")" && pwd)/deferred-list-model-tag-check.sh"
pass=0; fail=0
FILE="/Applications/Claude Code/Diors-Builds/docs/db-deferred-list.md"

r() { local o; o=$(printf '{"tool_input":{"file_path":%s,"new_string":%s}}' \
        "$(printf '%s' "$1" | jq -Rs .)" "$(printf '%s' "$2" | jq -Rs .)" | bash "$HOOK")
      [ -z "$o" ] && { echo SILENT; return; }
      printf '%s' "$o" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a() { local n="$1" want="$2" out; out="$(r "$3" "$4")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (want $want, got $got)"; fail=$((fail+1)); fi; }

echo "deferred-list-model-tag-check.sh -- proofs"

# --- scope: only the deferred list ---
a "other files ignored"              silent "/tmp/README.md" "- \`[P2 · M]\` **thing**"
a "empty content ignored"            silent "$FILE" ""

# --- the violation it was built for: a bracket with no model token ---
a "priority+effort only fires"       fires  "$FILE" '- `[P2 · M]` **new item, no model tag**'
a "priority+effort+flag fires"       fires  "$FILE" '- `[P2 · M · 🧩needs-design]` **new item, flag but no model**'

# --- legitimate shapes that must stay silent ---
a "full form Opus5-High is fine"     silent "$FILE" '- `[P2 · M · Opus5-High · 🧩needs-design]` **tagged item**'
a "abbreviated Opus5-H is fine"      silent "$FILE" '- `[P1 · L · Opus5-H · 🧩needs-design]` **abbreviated tag**'
a "Sonnet5-Medium is fine"           silent "$FILE" '- `[P2 · M · Sonnet5-Medium]` **tagged item**'
# tag-after-title shape (this file uses both conventions -- see line ~219 vs ~467)
a "tag after bold title is fine"     silent "$FILE" '- **Some title** `[P1 · L · Opus5-High · 🧩needs-design]` *(meta)*'
a "no bracket at all is fine"        silent "$FILE" "$(printf 'just some\nordinary prose lines\n')"
a "prose mentioning P2 not a tag"    silent "$FILE" "this is P2 work but not a real bracket"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
