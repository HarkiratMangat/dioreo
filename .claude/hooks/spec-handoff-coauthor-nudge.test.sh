#!/bin/bash
# Proofs for spec-handoff-coauthor-nudge.sh. The nudge is only worth having if it fires at authoring
# time and stays silent everywhere else — a nudge that becomes noise gets ignored, then deleted.
HOOK="$(dirname "$0")/spec-handoff-coauthor-nudge.sh"; pass=0; fail=0
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
# A silent hook prints NOTHING, and `jq` on empty input also prints nothing — decide from emptiness,
# never from a jq default. (Trap already pinned in rg-flag-guard.test.sh; repeated, not assumed.)
r(){ local raw; raw="$(printf '{"tool_input":{"file_path":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a(){ local n="$1" want="$2" out; out="$(r "$3")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n (want $want got $got)"; fail=$((fail+1)); fi; }
echo "spec-handoff-coauthor-nudge.sh — proofs"

R="/Applications/Claude Code/Diors-Builds"

# FIRES — the four authoring moments.
a "new dated spec"            fires  "$R/docs/superpowers/specs/2026-08-10-some-design.md"
a "new handoff"               fires  "$R/local/handoff/2026-08-10-something-handoff.md"
a "*-design.md anywhere"      fires  "$R/docs/ideas/accent-design.md"
a "*-handoff.md anywhere"     fires  "$R/notes/v3-handoff.md"

# SILENT — everything that is not an authoring moment.
a "ordinary doc"              silent "$R/docs/DEVLOG.md"
a "source file"               silent "$R/utils/accentColor.js"
a "a hook script"             silent "$R/.claude/hooks/typos-check.sh"
a "changelog"                 silent "$R/docs/CHANGELOG.md"
a "non-md in specs dir"       silent "$R/docs/superpowers/specs/diagram.svg"
a "empty path"                silent ""

# EXISTING FILES ARE NOT AUTHORING MOMENTS — a rewrite of a spec must stay silent, or every edit to
# an existing spec nags. This is the case most likely to turn the nudge into noise.
mkdir -p "$TMP/docs/superpowers/specs"; : > "$TMP/docs/superpowers/specs/2026-08-10-existing-design.md"
a "existing spec is a rewrite" silent "$TMP/docs/superpowers/specs/2026-08-10-existing-design.md"
# …but a NEW file in that same real directory must still fire, or the check above is over-broad.
a "new file beside it fires"   fires  "$TMP/docs/superpowers/specs/2026-08-10-brand-new-design.md"
echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
