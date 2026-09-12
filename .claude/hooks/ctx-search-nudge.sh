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
# ⚠️ KNOWN BLIND SPOT, NAMED RATHER THAN REDISCOVERED (2026-09-08 13:26 EDT, context-carriers plan WP7): it goes silent on ANY compound command (&&, ||, ;), and the repo's OWN mandated efficiency practice is to batch independent calls with exactly those operators. So a session that correctly batches several greps together makes itself invisible to this nudge — verified live: two prose-corpus rg calls inside a batched `&&` command produced no nudge. That is the SAME deliberate trade-off already stated above (missing real cases is the correct trade), just confirmed against a specific, common cause rather than left abstract.
#
# ⚠️ Emits hookSpecificOutput WITH hookEventName. A hook that omits hookEventName is SILENTLY DISCARDED — it runs, exits 0, prints valid JSON, and reaches nobody (two hooks in the global settings were dead this way). And a pipe-test proves the SCRIPT works, never that the HOOK fires. ⚠️ If a future session finds this annoying: it is here because of the measured 788:4 ratio, so removing it is a DECISION, not a tidy-up.

# 🔴 A SECOND BLIND SPOT, AND IT IS THE ONE THAT COST A WHOLE DAY — found 2026-09-09 15:47 EDT. The compound-command carve-out below was documented 2026-09-08 as an accepted trade. It is not the whole story: this hook is registered on the **Bash** tool, and this repo MANDATES `ctx_batch_execute` for gathering — which routes its shell commands through an MCP tool, not through Bash. So the hook never saw them at all. On 2026-09-09 a session ran every prose search of an eight-hour day inside `ctx_batch_execute` and compound `&&` chains, made four wrong claims from `rg` matching on wording, and this nudge was silent for all of it. Harkirat: *"why rely on rg when linksee memory, codebase-memory, and context-mode exist with thorough indexes"* — the rule was in context, stated in three places, and the one mechanism that could have interrupted was structurally unable to see the call. **A gate blind to the path the working contract mandates is a gate that protects nothing.**
#
# So: candidates come from BOTH shapes, and a leading `cd <dir> &&` no longer counts as "compound". That prefix is on essentially every batched command in this repo and carries no search of its own, so treating it as a chain is what made the carve-out swallow real cases rather than false ones.
judge() {
  cmd="$1"
  [ -z "$cmd" ] && return 1
  # A leading `cd …&&` is boilerplate, not a chain. Strip it before judging.
  cmd=$(printf '%s' "$cmd" | sed -E "s/^[[:space:]]*cd[[:space:]]+('[^']*'|\"[^\"]*\"|[^[:space:]]+)[[:space:]]*&&[[:space:]]*//")

# Strip heredoc bodies — prose that merely DISCUSSES a search is not a search. Same defence rg-flag-guard needed.
cmd=$(printf '%s' "$cmd" | awk '
  /<<-?'"'"'?[A-Za-z_]+'"'"'?/ && !inhd { match($0, /<<-?'"'"'?[A-Za-z_]+'"'"'?/);
    d=substr($0, RSTART, RLENGTH); gsub(/^<<-?'"'"'?|'"'"'$/, "", d); inhd=1; print; next }
  inhd && $0 == d { inhd=0; next }
  !inhd { print }')

# 🔴 ONLY a SIMPLE search. Every false positive this hook produced on its first day was a compound or multi-line shell command where the pattern extraction picked the wrong quoted span. An advisory nudge that misfires gets filtered, and then it protects nothing — so a command with more than one line, or with chained statements, is left alone. Missing some real cases is the correct trade here.
case "$cmd" in *"
"*) return 1 ;; esac
printf '%s' "$cmd" | grep -qE '(&&|\|\||;)' && return 1

# Must be an actual rg/grep invocation.
printf '%s' "$cmd" | grep -qE '(^|[|;&(]|[[:space:]])(rg|grep|ug)[[:space:]]' || return 1
# …aimed at the indexed prose corpus. A bare search with no path searches cwd, which is not necessarily docs — require the path to be named.
printf '%s' "$cmd" | grep -qE '(^|[[:space:]"'"'"'])(\./)?(docs|\.claude/rules)(/|[[:space:]]|$)' || return 1
# Skip when the search is clearly for a literal token rg is better at: a quoted pattern with no spaces is a symbol/flag/path, not a question. 🔴 Take the pattern from the search invocation onward, never the first quoted span in the whole command. Two live misfires taught the two halves: (a) 2026-08-30 12:45 EDT it fired on `... || echo "  no test-cache dir here"` because that string preceded the real rg pattern; (b) the first fix split the segment on a pipe, which CUT AN ALTERNATION IN HALF — a pattern like 'a-or-b' lost its closing quote, came back empty, and bypassed the metacharacter carve-out below. So: drop everything BEFORE the first search token, and never split on pipes. 🔴 AND `sed` CANNOT DO THIS, WHICH IS WHY IT WAS WRONG FOR TEN DAYS. `.*` IS GREEDY, so the expression above matched the LAST search token on the line and threw away everything before it — the exact opposite of what the comment two lines up says it does. A single `|` is not in the compound carve-out, so `rg '<a concept phrase>' docs/x.md | rg -v CLOSED` reached here and was judged on `CLOSED`: a single token, silent, every time. Measured 2026-09-09 15:57 EDT by replaying this session's own 139 searches through the hook. `awk`'s `match()` returns the FIRST match and has no greedy failure mode.
seg=$(printf '%s' "$cmd" | awk '{ if (match($0, /(^|[|;&(]|[ \t])(rg|grep|ug)[ \t]/)) print "rg " substr($0, RSTART + RLENGTH); else print $0 }')
pat=$(printf '%s' "$seg" | grep -oE "'[^']+'|\"[^\"]+\"" | head -1 | sed -E "s/^['\"]//; s/['\"]$//")
# ⚠️ AN UNQUOTED PATTERN IS STILL A PATTERN, and this hook was blind to it until 2026-09-09 15:48 EDT: extraction looked only at QUOTED spans, so `rg -n SHIPS_WITH_V3 docs/` left `pat` empty, every emptiness guard fell through, and the nudge FIRED on a single-literal search — the exact false positive its own header says kills a nudge. Found by live-firing the NEGATIVE case, not only the positive one.
if [ -z "$pat" ]; then
  pat=$(printf '%s' "$seg" | awk '{ for (i = 2; i <= NF; i++) if ($i !~ /^-/) { print $i; exit } }')
fi
case "$pat" in *' '*) ;; *) [ -n "$pat" ] && return 1 ;; esac
# A multi-word REGEX is not a question. Found by LIVE FIRE 2026-08-30 12:40 EDT: this hook fired on `rg -n '20,000B budget|Checks a \*\*20' <file>` during its own completeness sweep -- an alternation over two known literals, exactly the case where rg is right and ctx_search would be worse. Anything carrying regex metacharacters is a pattern the author already knows the shape of, not a concept they are searching for, so stay silent. 🔴 BUT CONTEXT PADDING IS NOT A PATTERN. Measured live 2026-09-01 09:3x EDT: `rg -o '.{140}[Aa]wwward.{200}'` over docs/ slipped through this carve-out, because `.{n}` counts as a metacharacter — and it is not one in the sense that matters. A `.{n}` span is asking rg to hand back SURROUNDING PROSE, which is the admission that the thing being looked for is a concept and not a literal. It is exactly the query ctx_search wins, and this hook was silent for it. Strip the padding before judging, so the decision is made on what is actually being searched FOR.
stripped=$(printf '%s' "$pat" | sed -E 's/\.\{[0-9]+(,[0-9]*)?\}//g')
# 🔴 AN ALTERNATION OF MULTI-WORD PHRASES IS A CONCEPT SEARCH WEARING A REGEX, and it is the single commonest shape this hook was silent for. The carve-out below assumes `a|b` means "two literals I already know" — true for `20,000B budget|Checks a \*\*20`, false for `severity dot|commit button restyle|Discord-shaped|MP/DMZ chips`. That second one is somebody GUESSING AT WORDING across six phrasings, which is the admission that they do not know the string — the exact query ctx_search wins and rg loses. Same reasoning that already exempts `.{n}` padding: judge what is being searched FOR. Measured 2026-09-09 15:57 EDT across this session's own traffic: 7 searches were silenced as "regex" and 4 of them were phrase alternations. 🔴 THE THRESHOLD IS **THREE**, AND TWO WAS WRONG — the suite caught it in one run. `20,000B budget|Checks a \*\*20` is two multi-word branches and is a KNOWN literal in two spellings; it is the live misfire from 2026-08-30 that the carve-out exists for, and a threshold of two revived it. Three or more phrasings of the same idea is the shape that means the author does not know the string. Against this session's real traffic that splits cleanly: the pinned literal case has 2, and the four genuine concept searches have 4, 4, 4 and 5.
phrasey=$(printf '%s' "$stripped" | awk -F'|' '{ n = 0; for (i = 1; i <= NF; i++) { b = $i; gsub(/^[[:space:]]+|[[:space:]]+$/, "", b); if (b ~ /[[:alnum:]][[:space:]]+[[:alnum:]]/) n++ } print (n >= 3) ? "yes" : "no" }')
[ "$phrasey" = yes ] || case "$stripped" in
  *'|'*|*'^'*|*'$'*|*'\\'*|*'['*|*'('*|*'.*'*|*'+'*|*'?'*) return 1 ;;
esac
# After stripping, a single word is a literal again and rg stays right.
case "$stripped" in *' '*) ;; *) [ -n "$stripped" ] && return 1 ;; esac

printf 'CTX-SEARCH NUDGE — this searches the prose corpus that context-mode indexes (docs/ + .claude/rules/), with a multi-word pattern.\n\nMeasured on this exact corpus 2026-08-30: `rg` returned ZERO files for 3 of 4 natural-language questions, because it matches literal strings and not concepts. ctx_search answered all four, ranked by section with headings, and the raw bytes never enter context.\n\n  ctx_search({ source: "project:dioreo-docs", queries: ["...", "..."] })   # or project:dioreo-rules\n\nA PreToolUse hook re-indexes both corpora immediately before any ctx_search, so results are never stale.\n\nrg stays correct when you already know the literal string — this is a reminder of the alternative, not a verdict on this command.' \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
  return 0
}

# Every candidate command, from either tool shape. `.commands[].command` is ctx_batch_execute's array; `.command` is Bash's single string. Fire on the FIRST match and stop -- one nudge per call, not one per grep in a batch of six. 🔴 STDIN IS READ ONCE. The first draft ran two `jq` calls straight off stdin, and the first one CONSUMED it — so the batch path worked and the plain-Bash path, the case this hook has always covered, silently stopped firing. Caught by live-firing all five cases instead of only the new one; a fix that breaks the path it was not about is the half-fix this repo keeps recording.
payload=$(cat)
# 🔴 NUL-SEPARATED, NEVER NEWLINE-SEPARATED, and the hook's own suite caught why. A newline-split loop turns ONE multi-line command into several single-line candidates, which silently destroys the multi-line carve-out three lines up — two proofs that had passed since this file was written went red the moment the driver was added. A command is one candidate however many lines it spans.
{ printf '%s' "$payload" | jq -j '(.tool_input.commands // []) | map(.command // empty) | .[] + "\u0000"' 2>/dev/null
  printf '%s' "$payload" | jq -j 'if (.tool_input.command // "") == "" then empty else .tool_input.command + "\u0000" end' 2>/dev/null; } > "${TMPDIR:-/tmp}/.ctxnudge.$$"
hit=1
while IFS= read -r -d '' c; do
  [ -z "$c" ] && continue
  if judge "$c"; then hit=0; break; fi
done < "${TMPDIR:-/tmp}/.ctxnudge.$$"
rm -f "${TMPDIR:-/tmp}/.ctxnudge.$$"
exit 0
