#!/bin/bash
HOOK="$(dirname "$0")/release-ready-check.sh"; pass=0; fail=0
# ⚠️ CLAUDE_PROJECT_DIR must be set explicitly. The hook defaults it to an absolute Mac path that does
# not exist on a CI runner, so `cd` fails and it exits 0 — every assertion then read SILENT and six
# cases "passed" by not running. Caught by CI on 2026-08-02 22:00 UTC, the first run after the
# required status check was switched on.
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
# $2 = base branch (default main). RELEASE_CHECK_BASE pins it so the v3 branch can be proven
# without a network call to `gh pr view`.
r(){ local raw; raw="$(printf '{"tool_input":{"command":"gh pr merge 1 --squash"}}' \
       | RELEASE_CHECK_FILES="$1" RELEASE_CHECK_BASE="${2:-main}" CLAUDE_PROJECT_DIR="$REPO" bash "$HOOK")"
     # Reads BOTH fields: the deny path carries its text in `permissionDecisionReason`, the
     # explicit-skip path in `additionalContext`. Before 2026-08-06 11:04 EDT this gate only ever
     # emitted the latter — a pure notice with no decision, which is why it could not stop the
     # v2.56.1 merge it correctly flagged. Reading one field only would make this suite blind to
     # which of the two branches ran.
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.permissionDecisionReason // .hookSpecificOutput.additionalContext // "SILENT"'; }
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
a "the miss is named in the message"  "RELEASE NOT READY" yes "$NODEVLOG"

# 🔴 THE DECISION LEVEL, which nothing tested until 2026-08-06 11:05 EDT.
# The case above was called "advisory, never a hard block" and only ever asserted that the message
# CONTAINED some text — true whether the hook denied, asked, or merely narrated. So the property that
# actually mattered was untested, and the gate sat emitting `additionalContext` with no
# permissionDecision at all: a pure notice. It fired correctly on v2.56.1 and the merge went through
# anyway, costing the extra release its own message warns about. A test whose name claims a
# behaviour it never checks is worse than no test.
# ⚠️ CLAUDE_PROJECT_DIR="$REPO" IS MANDATORY — exactly as this file's own header warns, and I omitted
# it here anyway. Without it the hook cd's to an absolute Mac path that does not exist on a runner,
# exits 0, and every assertion reads SILENT: green locally, failing only in CI. That warning was
# written on 2026-08-02 after six cases "passed" by not running, and it is at the top of the very
# file this helper was added to. A hazard documented in the file you are editing still has to be
# read.
dec() { local raw; raw=$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$2" | jq -Rs .)" \
          | RELEASE_CHECK_BASE=main RELEASE_CHECK_FILES="$1" CLAUDE_PROJECT_DIR="$REPO" bash "$HOOK" 2>/dev/null)
        # Silence is a valid outcome (a complete release), and `jq` on EMPTY input prints nothing —
        # which is not "none", it is the absence of an answer. Distinguishing them matters here:
        # "the hook stayed silent" and "the hook ran and asked for no decision" are both correct, but
        # "the hook died producing nothing" is not, and only an explicit empty check separates them.
        [ -z "$raw" ] && { echo none; return; }
        printf '%s' "$raw" | jq -r '.hookSpecificOutput.permissionDecision // "none"'; }
d() { local n="$1" want="$2" got="$3"
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (wanted $want, got $got)"; fail=$((fail+1)); fi; }

# Reuses the SAME fixtures as the assertions above rather than rebuilding one — my first attempt
# hand-rolled a "complete" file list that was subtly different and failed for that reason, not for
# the behaviour under test.
d "an unmet release DENIES the merge"    deny "$(dec "$NODEVLOG" 'gh pr merge 88 --squash')"
# ...and the escape must exist, or a judgement-call gate with no way through gets edited out of the
# way — the "how a guard becomes decorative" failure named in the filed --delete item.
d "a NAMED skip is allowed through"      none "$(dec "$NODEVLOG" 'RELEASE_SKIP="purely mechanical" gh pr merge 88 --squash')"
d "a complete release needs no decision" none "$(dec "$FULL" 'gh pr merge 88 --squash')"
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
