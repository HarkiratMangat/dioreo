#!/bin/bash
# Proofs for defer-in-place-guard.sh. The two classes that matter are (1) the real failure that
# created it, and (2) the legitimate-deferral traffic it must NOT bury — db-deferred-list.md is
# built of deferrals, so a guard that fires on all of them is noise and would be turned off.
HOOK="$(dirname "$0")/defer-in-place-guard.sh"; pass=0; fail=0
# A silent hook prints NOTHING, and `jq` on empty input also prints nothing — so deciding from a
# jq default reads "silent" as "fired". Capture raw and decide from emptiness. (Same trap already
# pinned in rg-flag-guard.test.sh; repeated here deliberately rather than assumed.)
r(){ local raw; raw="$(printf '{"tool_input":{"file_path":%s,"new_string":%s}}' \
       "$(printf '%s' "$1" | jq -Rs .)" "$(printf '%s' "$2" | jq -Rs .)" | bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a(){ local n="$1" want="$2" out; out="$(r "$3" "$4")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n (want $want got $got)"; fail=$((fail+1)); fi; }
echo "defer-in-place-guard.sh — proofs"

D="docs/db-deferred-list.md"

# TRUE POSITIVE — the verbatim text that created this hook, 2026-08-09 23:32 EDT.
a "the original miss (re-tag it)"      fires  "$D" "the pass is now housekeeping — re-tag it and stop citing the read limit as the reason."
a "a future session should"            fires  "$D" "A future session should revisit the accent map once v3 lands."
a "whoever picks it up"                fires  "$D" "whoever picks this up should confirm the schema first."
a "revert this constant"               fires  ".claude/hooks/memory-index-check.sh" "revert this constant to 16000 once that lands."
a "fix it later"                       fires  "utils/accentColor.js" "// hacky for now, fix this later"
a "someone should"                     fires  "$D" "someone should audit the remaining Cloudinary calls."

# TRUE NEGATIVES — legitimate tracker traffic. These are the majority of real edits to this file and
# MUST stay silent, or the guard gets ignored and then removed.
a "neutral filing language"            silent "$D" "- \`[P3 · M]\` **Compaction pass.** Filed 2026-08-09 23:32 EDT; genuine housekeeping."
a "deferred-to phrasing is fine"       silent "$D" "Deferred to its own session — it rewrites the file every session reads first."
a "blocked-on is a real reason"        silent "$D" "Blocked on Harkirat: needs the Discord app screenshot before it can proceed."
a "past-tense record"                  silent "docs/CHANGELOG.md" "Re-tagged P2 to P3 in the same edit that removed its premise."
a "ordinary prose"                     silent "docs/DEVLOG.md" "The index sat at 17,064 B against a 25,000 B ceiling."

# SELF-EXEMPTION — this hook and its test carry every trigger phrase by construction. The repo has
# already paid for a detector matching its own source once (completeness-sweep). Pin it both ways.
a "hook exempts its own source"        silent ".claude/hooks/defer-in-place-guard.sh" "a future session should re-tag it"
a "hook exempts its own test"          silent ".claude/hooks/defer-in-place-guard.test.sh" "a future session should re-tag it"
# …but the exemption must be by BASENAME only, not a substring, or any path containing the name slips through.
a "similarly-named file NOT exempt"    fires  "docs/defer-in-place-guard-notes.md" "a future session should re-tag it"
# The hook registry documents every hook, so it quotes trigger phrases by necessity. It fired on its
# own registry entry within a minute of going live — documenting a detector is not committing the
# thing it detects.
a "hook registry is exempt"            silent "reference_enforcement_hooks.md" "fires on \`re-tag it\`, \`a future session should\`, \`someone should\`"

# Degenerate input must never error or fire.
a "empty new_string"                   silent "$D" ""
echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
