#!/bin/bash
# Proofs for untracked-doc-guard.sh.
#
# This hook reads real git state, so the cases run against a throwaway repo via CLAUDE_PROJECT_DIR rather than against Diors-Builds itself -- a test that depends on the working tree being dirty (or clean) at the moment it runs is a test that fails for reasons unrelated to the code.

HOOK="$(cd "$(dirname "$0")" && pwd)/untracked-doc-guard.sh"
pass=0; fail=0
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
git -C "$TMP" init -q 2>/dev/null
git -C "$TMP" config user.email t@t; git -C "$TMP" config user.name t
mkdir -p "$TMP/docs"; echo "# tracked" > "$TMP/docs/tracked.md"
git -C "$TMP" add -A 2>/dev/null; git -C "$TMP" commit -qm init 2>/dev/null

r() { printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" \
      | CLAUDE_PROJECT_DIR="$TMP" bash "$HOOK" \
      | jq -r '.hookSpecificOutput.additionalContext // "SILENT"' 2>/dev/null || echo SILENT; }
a() { local n="$1" want="$2" out got; out="$(r "$3")"
  case "$out" in SILENT|"") got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (want $want, got $got)"; fail=$((fail+1)); fi; }

echo "untracked-doc-guard.sh — proofs"
# Clean tree: nothing invisible, so nothing to say.
a "clean tree is silent"                  silent 'npm run docs:audit'

# The real failure: a new doc exists but is untracked, so the gate cannot see it.
echo "# brand new" > "$TMP/docs/new-plan.md"
a "untracked .md + docs:audit fires"      fires  'npm run docs:audit'
a "untracked .md + docs:reflow fires"     fires  'npm run docs:reflow'
a "untracked .md + reflow script fires"   fires  'node scripts/reflow-prose.mjs --check'
# Scope: only docs gates. Unrelated commands must not inherit the warning.
a "unrelated command is silent"           silent 'git status'
a "npm test alone is silent"              silent 'npm test'

# Staged is enough -- git ls-files sees the index, so the gate CAN see it now.
git -C "$TMP" add docs/new-plan.md 2>/dev/null
a "staged .md is silent again"            silent 'npm run docs:audit'

# A non-markdown untracked file is irrelevant to these gates.
echo "x" > "$TMP/scratch.txt"
a "untracked non-md is silent"            silent 'npm run docs:audit'

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
