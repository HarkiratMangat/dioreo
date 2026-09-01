#!/bin/bash
# ⚠️ Comments here are SOFT-WRAPPED: `npm run docs:reflow-comments` gates .sh files, so after editing this header run `node scripts/reflow-comments.mjs --write <this file>` or `npm test` goes red. codebase-memory-nudge.sh — PreToolUse on Bash. Fires when rg/grep is aimed at the CODE corpus that codebase-memory-mcp indexes.
#
# WHY A SIBLING AND NOT AN EXTENSION OF ctx-search-nudge.sh (2026-08-31 22:24 EDT)
# --------------------------------------------------------------------------------
# That hook covers the PROSE half of the same rule and it is the right shape, but its gate is prose-question detection: it fires only on a MULTI-WORD pattern and stays silent on anything carrying regex metacharacters, because a literal is exactly the case where rg wins over ctx_search. In code the opposite holds — a symbol IS a literal, and searching for one is the case where `search_graph` wins, because it returns CALLERS and rg structurally cannot. Folding two mutually exclusive gates into one script would make each one harder to falsify, and the routing answer differs too. So: two hooks, one corpus each, cross-referenced.
#
# WHAT IT COSTS TO BE WRONG, AND WHY THIS ONE IS EXACT BY CONSTRUCTION. Harkirat's own bar for shipping a guard now rather than parking it with the silent-mode set: there must be no precision question to gate. "an rg aimed at a path ending .js" is decidable from the command string alone, the same way batch-edit-guard.sh's "a second edit to a file already edited this turn" is. Nothing here classifies INTENT. If a future change to this file needs a judgement call to decide whether a command matches, that change belongs with the parked guards instead — see docs/db-deferred-list.md's silent-mode entry and Task 6 of the 83-step workflow-compliance plan.
#
# WHAT IT DELIBERATELY DOES NOT DO. No auto-fix and no rewritten command: a guard that repairs its own finding is a diary, not a test. Advisory, never a block — rg stays correct for a filename, a config, a non-repo path, or a literal whose file you already know.
#
# ⚠️ Emits hookSpecificOutput WITH hookEventName. A hook that omits hookEventName is SILENTLY DISCARDED — it runs, exits 0, prints valid JSON and reaches nobody. And a pipe-test proves the SCRIPT works, never that the HOOK fires; trigger a real Bash call and look for the message.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Strip heredoc bodies — prose that merely DISCUSSES a search is not a search. Same defence ctx-search-nudge.sh and rg-flag-guard both needed.
cmd=$(printf '%s' "$cmd" | awk '
  /<<-?'"'"'?[A-Za-z_]+'"'"'?/ && !inhd { match($0, /<<-?'"'"'?[A-Za-z_]+'"'"'?/);
    d=substr($0, RSTART, RLENGTH); gsub(/^<<-?'"'"'?|'"'"'$/, "", d); inhd=1; print; next }
  inhd && $0 == d { inhd=0; next }
  !inhd { print }')

# 🔴 ONLY A SIMPLE SEARCH, for the same reason the prose nudge restricts itself: every false positive that hook produced on its first day came from a compound or multi-line command where extraction picked the wrong span. Missing some real cases is the correct trade for an advisory.
case "$cmd" in *"
"*) exit 0 ;; esac
printf '%s' "$cmd" | grep -qE '(&&|\|\||;)' && exit 0

# Must be an actual rg/grep invocation. `find` is deliberately NOT here: find searches FILENAMES, and filenames are Bash's job — the routing this hook teaches is about symbols and callers, which find never answers.
printf '%s' "$cmd" | grep -qE '(^|[|;&(]|[[:space:]])(rg|grep|ug)[[:space:]]' || exit 0

# The prose corpus belongs to ctx-search-nudge.sh. Naming it here means the two hooks would both fire on one command, and two advisories at once is how both get filtered.
printf '%s' "$cmd" | grep -qE '(^|[[:space:]"'"'"'])(\./)?(docs|\.claude/rules)(/|[[:space:]]|$)' && exit 0

# ...aimed at the indexed CODE corpus. Either a path that ENDS in a JS extension, or one of the repo's own source directories named as a path. A bare search with no path searches cwd, which is not necessarily code, so the path has to be named — the same requirement the prose nudge makes, and for the same reason.
printf '%s' "$cmd" | grep -qE "(^|[[:space:]\"'])(\./)?[A-Za-z0-9_./-]+\.(js|mjs|cjs)([[:space:]\"']|$)|(^|[[:space:]\"'])(\./)?(portal/ui|portal|core|handlers|bot|commands|models|utils|scripts)(/[A-Za-z0-9_./*-]*)?([[:space:]\"']|$)" || exit 0

printf 'CODEBASE-MEMORY NUDGE — this is a text search over the CODE corpus that codebase-memory-mcp already has indexed as a graph.\n\nFor "where is X defined", "what calls X", "what does X call", or "what breaks if I change X", the graph answers what rg structurally cannot: rg finds the STRING, the graph returns the CALLERS.\n\n  search_graph({ project: "Applications-Claude-Code-Diors-Builds", name_pattern: ".*X.*" })\n  trace_path({ function_name: "X", direction: "both", depth: 3 })\n  get_code_snippet({ qualified_name: "..." })            # exact source, precise ranges\n\n⚠️ UNMEASURED, and said so on purpose. The ctx_search-vs-rg rule next door carries a real number (rg 1 of 6, ctx_search 5 of 5 on the ledger, 2026-08-31); this routing has no equivalent measurement behind it, only the structural argument above and the fact that codebase-memory has never once been invoked on this project. Treat it as a reminder of a capability, not as a verdict on this command.\n\nrg stays correct for a filename, a config value, a non-repo path, or a literal in a file you already have open. This is advisory and blocks nothing.' \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
