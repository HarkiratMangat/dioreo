#!/bin/bash
HOOK="$(dirname "$0")/release-ready-check.sh"; pass=0; fail=0
# $2 = base branch (default main). RELEASE_CHECK_BASE pins it so the v3 branch can be proven
# without a network call to `gh pr view`.
r(){ local raw; raw="$(printf '{"tool_input":{"command":"gh pr merge 1 --squash"}}' \
       | RELEASE_CHECK_FILES="$1" RELEASE_CHECK_BASE="${2:-main}" bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }; printf '%s' "$raw" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a(){ local n="$1" needle="$2" want="$3" files="$4" out; out="$(r "$files" "$5")"
  case "$out" in *"$needle"*) got=yes;; *) got=no;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n"; echo "        got: $out"; fail=$((fail+1)); fi; }
FULL='docs/CHANGELOG.md
docs/CHANGELOG-SUMMARY.md
docs/DEVLOG.md
package.json
.claude/hooks/x.sh'
NODEVLOG='docs/CHANGELOG.md
docs/CHANGELOG-SUMMARY.md
package.json
.claude/hooks/x.sh'
MECHANICAL='docs/CHANGELOG.md
docs/CHANGELOG-SUMMARY.md
package.json
package-lock.json'
NOCHANGELOG='docs/DEVLOG.md
package.json
src/x.js'
echo "release-ready-check.sh — proofs"
a "complete release is silent"        "RELEASE NOT READY" no  "$FULL"
a "missing DEVLOG fires"              "docs/DEVLOG.md has no entry" yes "$NODEVLOG"
a "purely mechanical skips DEVLOG"    "docs/DEVLOG.md has no entry" no  "$MECHANICAL"
a "missing CHANGELOG fires"           "docs/CHANGELOG.md has no entry" yes "$NOCHANGELOG"
a "missing SUMMARY fires"             "CHANGELOG-SUMMARY.md has no line" yes "$NOCHANGELOG"
a "advisory, never a hard block"     "RELEASE NOT READY" yes "$NODEVLOG"
# --- v3 pre-release: CHANGELOG-only. Demanding a SUMMARY line there would be the gate enforcing a
#     rule that does not apply, which teaches you to merge past it. Added 2026-08-02 16:49 EDT with
#     the base-branch fix; before it, every v3 PR was diffed against origin/main.
V3OK='docs/CHANGELOG.md
package.json
src/x.js'
a "v3 base: no SUMMARY demanded"      "CHANGELOG-SUMMARY.md has no line" no  "$V3OK" v3-pre-release
a "v3 base: CHANGELOG still demanded" "docs/CHANGELOG.md has no entry"   yes "$NOCHANGELOG" v3-pre-release
a "main base: SUMMARY still demanded" "CHANGELOG-SUMMARY.md has no line" yes "$V3OK" main
echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
