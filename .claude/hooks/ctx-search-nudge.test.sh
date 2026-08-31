#!/bin/bash
# Proofs for ctx-search-nudge.sh. The guard must fire on a CONCEPTUAL search of the indexed prose corpus and stay silent everywhere else — a nudge that fires on ordinary searches gets filtered, and then it protects nothing.
HOOK="$(cd "$(dirname "$0")" && pwd)/ctx-search-nudge.sh"; pass=0; fail=0
r(){ local raw; raw="$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a(){ local n="$1" want="$2" out got; out="$(r "$3")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n (want $want got $got)"; fail=$((fail+1)); fi; }
echo "ctx-search-nudge.sh — proofs"
# ── FIRES: multi-word (conceptual) searches of the indexed corpus. These are the ones rg measurably loses.
a "multi-word rg on docs/"          fires  "rg -n 'conformance closure number' docs/"
a "multi-word grep on docs"         fires  "grep -r 'why was the page withdrawn' docs"
a "multi-word on .claude/rules"     fires  "rg -n 'validate replayed inverse' .claude/rules"
a "leading ./ path form"            fires  "rg -n 'zero standing permissions' ./docs"
# ── SILENT: a literal token is exactly what rg is BETTER at. Nudging there would be wrong, not just noisy.
a "single-token pattern (rg wins)"  silent "rg -n 'parseAdminDate' docs/"
a "flag-shaped literal"             silent "rg -n 'permissions=0' docs/"
# ── SILENT: outside the indexed corpus entirely.
a "search of portal/ (code)"        silent "rg -n 'some phrase here' portal/"
a "search of scripts/"              silent "rg -n 'another phrase here' scripts/"
a "no path named"                   silent "rg -n 'some phrase here'"
# ── SILENT: not a search at all, and prose that merely mentions one.
a "not a search command"            silent "node scripts/docs-audit.mjs"
a "heredoc discussing a docs grep"  silent "$(printf 'git commit -F - <<%sEOF%s\nfixed: rg -n "a phrase" docs/ was wrong\nEOF' "'" "'")"
# ── REGEX patterns. Found by LIVE FIRE, not reasoning: this hook fired on its own completeness sweep searching for a known alternation. A metacharacter means the author already knows the shape.
a "alternation over known literals" silent "rg -n '20,000B budget|Checks a 20' docs/x.md"
a "anchored regex with a space"     silent "rg -c '^\\s*- \\[P[0-3]' docs/db-deferred-list.md"
a "wildcard regex"                  silent "rg -n 'foo.*bar baz' docs/"
# …but a plain multi-word QUESTION must still fire. The carve-out must not blind it.
a "plain question still fires"      fires  "rg -n 'why was this deferred' docs/"
# ── COMPOUND / MULTI-LINE commands. Every first-day misfire was one of these; the pattern extraction cannot be trusted when the search is one statement among several.
a "chained with &&"                 silent "cd docs && rg -n 'why was this deferred' ."
a "chained with ||"                 silent "rg -n 'why was this deferred' docs/ || echo 'nothing found here'"
a "multi-line compound"             silent "$(printf "echo 'some heading here'\nrg -n 'why was this deferred' docs/")"
a "semicolon-separated"             silent "ls; rg -n 'why was this deferred' docs/"
# ── the message must name the measurement, or it is an unfounded assertion
out="$(r "rg -n 'conformance closure number' docs/")"
case "$out" in *"ZERO files for 3 of 4"*) echo "  PASS  cites the measurement"; pass=$((pass+1));;
  *) echo "  FAIL  message lacks the measured basis"; fail=$((fail+1));; esac
case "$out" in *"project:dioreo-docs"*) echo "  PASS  gives the runnable call"; pass=$((pass+1));;
  *) echo "  FAIL  message does not show how to run it"; fail=$((fail+1));; esac
echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
