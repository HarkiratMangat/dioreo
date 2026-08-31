#!/bin/bash
# ⚠️ Comments here are SOFT-WRAPPED: `npm run docs:reflow-comments` gates .sh files, so after editing this header run `node scripts/reflow-comments.mjs --write <this file>` or `npm test` goes red. ctx-search-nudge.sh — PreToolUse on Bash. Fires when rg/grep is aimed at the PROSE corpus that ctx_search indexes.
#
# WHY THIS EXISTS (2026-08-30 11:46 EDT)
# --------------------------------------
# Harkirat: *"make sure sessions actually reach for ctx_search instead of it never being triggered."* The refresh hook keeps the index FRESH but fires only when ctx_search is already being called — it cannot make anyone call it. That circularity is the whole problem, and prose does not solve it: measured across all history, `grep` 788x vs `rg` 4x on a rule that had been written down for months.
#
# WHY THIS TRIGGER AND NOT A BROADER ONE. A nudge on every Grep/Glob would fire constantly — text search is usually correct — and a gate that cries wolf is how the real warning gets waved through (the rg-flag-guard next door paid for that lesson five times). So this is scoped to the ONE case where ctx_search measurably wins: a text search aimed at docs/ or .claude/rules/. Measured 2026-08-30 on that corpus, `rg` returned ZERO files for 3 of 4 natural-language questions, because rg matches literal strings and not concepts.
#
# WHAT IT DOES NOT CLAIM. rg is still right when you know the literal string — that is why this is advisory, never a block. It exists to make the alternative VISIBLE at the moment of choice, not to win the argument.
#
# ⚠️ Emits hookSpecificOutput WITH hookEventName. A hook that omits hookEventName is SILENTLY DISCARDED — it runs, exits 0, prints valid JSON, and reaches nobody (two hooks in the global settings were dead this way). And a pipe-test proves the SCRIPT works, never that the HOOK fires. ⚠️ If a future session finds this annoying: it is here because of the measured 788:4 ratio, so removing it is a DECISION, not a tidy-up.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Strip heredoc bodies — prose that merely DISCUSSES a search is not a search. Same defence rg-flag-guard needed.
cmd=$(printf '%s' "$cmd" | awk '
  /<<-?'"'"'?[A-Za-z_]+'"'"'?/ && !inhd { match($0, /<<-?'"'"'?[A-Za-z_]+'"'"'?/);
    d=substr($0, RSTART, RLENGTH); gsub(/^<<-?'"'"'?|'"'"'$/, "", d); inhd=1; print; next }
  inhd && $0 == d { inhd=0; next }
  !inhd { print }')

# 🔴 ONLY a SIMPLE search. Every false positive this hook produced on its first day was a compound or multi-line shell command where the pattern extraction picked the wrong quoted span. An advisory nudge that misfires gets filtered, and then it protects nothing — so a command with more than one line, or with chained statements, is left alone. Missing some real cases is the correct trade here.
case "$cmd" in *"
"*) exit 0 ;; esac
printf '%s' "$cmd" | grep -qE '(&&|\|\||;)' && exit 0

# Must be an actual rg/grep invocation.
printf '%s' "$cmd" | grep -qE '(^|[|;&(]|[[:space:]])(rg|grep|ug)[[:space:]]' || exit 0
# …aimed at the indexed prose corpus. A bare search with no path searches cwd, which is not necessarily docs — require the path to be named.
printf '%s' "$cmd" | grep -qE '(^|[[:space:]"'"'"'])(\./)?(docs|\.claude/rules)(/|[[:space:]]|$)' || exit 0
# Skip when the search is clearly for a literal token rg is better at: a quoted pattern with no spaces is a symbol/flag/path, not a question. 🔴 Take the pattern from the search invocation onward, never the first quoted span in the whole command. Two live misfires taught the two halves: (a) 2026-08-30 12:45 EDT it fired on `... || echo "  no test-cache dir here"` because that string preceded the real rg pattern; (b) the first fix split the segment on a pipe, which CUT AN ALTERNATION IN HALF — a pattern like 'a-or-b' lost its closing quote, came back empty, and bypassed the metacharacter carve-out below. So: drop everything BEFORE the first search token, and never split on pipes.
seg=$(printf '%s' "$cmd" | sed -E '1,/(^|[|;&(]|[[:space:]])(rg|grep|ug)[[:space:]]/ s/.*(^|[|;&(]|[[:space:]])(rg|grep|ug)[[:space:]]/rg /')
pat=$(printf '%s' "$seg" | grep -oE "'[^']+'|\"[^\"]+\"" | head -1 | sed -E "s/^['\"]//; s/['\"]$//")
case "$pat" in *' '*) ;; *) [ -n "$pat" ] && exit 0 ;; esac
# A multi-word REGEX is not a question. Found by LIVE FIRE 2026-08-30 12:40 EDT: this hook fired on `rg -n '20,000B budget|Checks a \*\*20' <file>` during its own completeness sweep -- an alternation over two known literals, exactly the case where rg is right and ctx_search would be worse. Anything carrying regex metacharacters is a pattern the author already knows the shape of, not a concept they are searching for, so stay silent.
case "$pat" in
  *'|'*|*'^'*|*'$'*|*'\\'*|*'['*|*'('*|*'.*'*|*'+'*|*'?'*) exit 0 ;;
esac

printf 'CTX-SEARCH NUDGE — this searches the prose corpus that context-mode indexes (docs/ + .claude/rules/), with a multi-word pattern.\n\nMeasured on this exact corpus 2026-08-30: `rg` returned ZERO files for 3 of 4 natural-language questions, because it matches literal strings and not concepts. ctx_search answered all four, ranked by section with headings, and the raw bytes never enter context.\n\n  ctx_search({ source: "project:dioreo-docs", queries: ["...", "..."] })   # or project:dioreo-rules\n\nA PreToolUse hook re-indexes both corpora immediately before any ctx_search, so results are never stale.\n\nrg stays correct when you already know the literal string — this is a reminder of the alternative, not a verdict on this command.' \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
