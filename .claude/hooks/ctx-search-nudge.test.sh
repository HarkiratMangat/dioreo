#!/bin/bash
# Proofs for ctx-search-nudge.sh. The guard must fire on a CONCEPTUAL search of the indexed prose corpus and stay silent everywhere else — a nudge that fires on ordinary searches gets filtered, and then it protects nothing.
HOOK="$(cd "$(dirname "$0")" && pwd)/ctx-search-nudge.sh"; pass=0; fail=0
r(){ local raw; raw="$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a(){ local n="$1" want="$2" out got; out="$(r "$3")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n (want $want got $got)"; fail=$((fail+1)); fi; }
# 🔴 THE BATCH SHAPE, added 2026-09-09 15:49 EDT. This hook is registered on Bash, and the repo MANDATES ctx_batch_execute for gathering — which routes its shell commands through an MCP tool, not through Bash. Every prose search of 2026-09-09 went through it, four wrong claims were made from rg matching on wording, and this nudge was silent for all of them. `rb`/`ab` drive the batch payload shape so that path can never go dark again.
rb(){ local raw; raw="$(printf '{"tool_input":{"commands":[{"command":%s}]}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
ab(){ local n="$1" want="$2" out got; out="$(rb "$3")"
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
# ── REGEX patterns. Found by LIVE FIRE, not reasoning: this hook fired on its own completeness sweep searching for a known alternation. A metacharacter means the author already knows the shape. 🔴 CONTEXT PADDING IS NOT A PATTERN. Live miss 2026-09-01 09:3x EDT: this exact shape searched docs/ for a CONCEPT and the hook stayed quiet, because `.{n}` reads as a metacharacter. Asking rg for surrounding prose IS the admission that you are looking for an idea rather than a string — the case ctx_search wins. Both halves pinned: padding around a multi-word phrase must FIRE, and padding around a single literal must stay SILENT.
a "context-padded concept search"   fires  "rg -o '.{140}the design bar.{200}' docs/"
a "context-padded single literal"   silent "rg -o '.{40}parseAdminDate.{60}' docs/"
a "alternation over known literals" silent "rg -n '20,000B budget|Checks a 20' docs/x.md"
# 🔴 …BUT THREE OR MORE PHRASINGS OF ONE IDEA IS SOMEBODY GUESSING AT WORDING, which is the admission that they do not know the literal — the query ctx_search wins and rg loses. Found 2026-09-09 by replaying this session's own 139 searches: 7 were silenced as "regex" and 4 of those were phrase alternations over docs/. Both directions are pinned, because the threshold is the whole content of the rule.
a "phrase alternation is a concept"  fires  "rg -n 'severity dot|commit button restyle|four mockup COMPOSITION|composition changes' docs/db-deferred-list.md"
# 🔴 AND THE PATTERN COMES FROM THE FIRST SEARCH IN A PIPELINE, NEVER THE LAST. A single `|` is not in the compound carve-out, so a filtered search reaches the judge; `sed`'s greedy `.*` threw away everything before the LAST rg and judged `CLOSED`, silencing every piped concept search since this file was written.
a "piped: judged on the FIRST rg"    fires  "rg -n 'why was this deferred' docs/ | rg -v CLOSED"
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

# ── THE BLIND SPOT THAT COST A DAY ─────────────────────────────────────────────────────────────
ab "batch: a prose question inside ctx_batch_execute"  fires   "cd /x && rg -n 'what does the launch still need' docs/ROADMAP.md"
ab "batch: an UNQUOTED single literal"                 silent  "cd /x && rg -n SHIPS_WITH_V3 docs/"
ab "batch: a quoted single literal"                    silent  "cd /x && rg -n 'preview-sel' docs/"
ab "batch: a non-prose path"                           silent  "cd /x && rg -n 'two or more words' portal/ui"
# ⚠️ AND THE ORIGINAL PATH, because the first driver read stdin with two jq calls and the FIRST one consumed it — the batch path worked and the Bash path this hook has always covered went silent. A fix that breaks the path it was not about is the half-fix this repo keeps recording.
a  "bash: the original path still fires"               fires   "rg -n 'two or more words' docs/"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
