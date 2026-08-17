#!/bin/bash
# Proofs for notes-open-items.sh — the shared "what counts as open" logic that used to be duplicated (and drifted) between the SessionStart hook and records-close-check.sh.

HOOK="$(cd "$(dirname "$0")" && pwd)/notes-open-items.sh"
pass=0; fail=0
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

a() {
  local name="$1" want="$2" got
  got=$(bash "$HOOK" "$TMP/notes.md" | wc -l | tr -d ' ')
  if [ "$got" = "$want" ]; then echo "  PASS  $name"; pass=$((pass+1))
  else echo "  FAIL  $name (wanted $want lines, got $got)"; fail=$((fail+1)); fi
}

echo "notes-open-items.sh — proofs"

printf '## Questions\n- a bare open item\n## 📍 pointer\n' > "$TMP/notes.md"
a "bare bullet counts as open" 1

printf '## Questions\n- [ ] a checkbox open item\n## 📍 pointer\n' > "$TMP/notes.md"
a "checkbox [ ] counts as open" 1

printf '## Questions\n- [x] a closed item\n## 📍 pointer\n' > "$TMP/notes.md"
a "checked [x] does NOT count as open" 0

printf '## Questions\n<!-- a comment line -->\n## 📍 pointer\n' > "$TMP/notes.md"
a "an HTML comment line does NOT count as open" 0

printf '## Questions\n## 📍 pointer\n' > "$TMP/notes.md"
a "no items at all -> zero" 0

printf '## Questions\n- one\n- [ ] two\n- [x] three\n## 📍 pointer\n- four (outside range, past the heading)\n' > "$TMP/notes.md"
a "only counts within the Questions..📍 window" 2

rm -f "$TMP/notes.md"
a "missing file is silent, not an error" 0

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
