#!/bin/bash
# rg-flag-guard.sh — PreToolUse on Bash. Catches grep-habit short flags passed to ripgrep.
#
# WHY THIS EXISTS
# Three separate times on 2026-08-02 I passed a grep flag to `rg` and got silent garbage:
#   · `rg -oh 'pat' dir`  -> `-h` is --help in rg (grep: no-filename). Printed the HELP TEXT, which
#     reads exactly like "no matches found" when skimmed. I nearly concluded a field was unused.
#   · `rg -E '^(a|b)'`    -> `-E` is --encoding in rg (grep: extended-regexp; rg is extended by
#     DEFAULT so the flag is never needed). Died with "unknown encoding".
#   · `rg -rn 'pat'`      -> `-r` is --replace, and clusters with an inline value, so this silently
#     REPLACES every match with "n" instead of showing line numbers.
#
# The `-r` trap was ALREADY written up in the global CLAUDE.md and I still hit the other two the same
# day. That is the whole argument for a gate over prose: the documentation was correct, present, and
# recently read, and it did not stop the hand.
#
# WARNS rather than blocks: there are legitimate uses (`rg --help` spelled out), and a PreToolUse note
# lands BEFORE I read the output, which is the moment that matters — the danger is misreading help
# text as an empty result, not the command itself.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0

# Strip HEREDOC BODIES first. A commit message or a `cat > f <<'EOF'` block that merely DISCUSSES rg
# is prose, not an invocation — this guard's own commit message tripped it 2026-08-02 15:15 EDT by
# quoting `rg -n` in the body. Third false-positive class fixed on this pattern in one session; each
# one matters because a guard that cries wolf is how the true warning gets dismissed.
cmd=$(printf '%s' "$cmd" | awk '
  /<<-?'"'"'?[A-Za-z_]+'"'"'?/ && !inhd { match($0, /<<-?'"'"'?[A-Za-z_]+'"'"'?/);
    d=substr($0, RSTART, RLENGTH); gsub(/^<<-?'"'"'?|'"'"'$/, "", d); inhd=1; print; next }
  inhd && $0 == d { inhd=0; next }
  !inhd { print }')

# Only look at actual rg invocations: start of line, or after a pipe/;/&&/(.
printf '%s' "$cmd" | grep -qE '(^|[|;&(]|[[:space:]])rg[[:space:]]' || exit 0

findings=""
# Scope to the rg SEGMENT only. The first version scanned the whole command string, so a pipeline
# containing both `jq -r` and `rg -n` reported a bogus -r finding — caught live 2026-08-02 15:15 EDT
# by the guard firing on the very command inspecting it. A guard that cries wolf is how the real
# warning gets waved through, which is the lesson the timestamp hook already paid for.
# SELECT the rg-bearing lines FIRST. sed rewrites per line but PASSES NON-MATCHING LINES THROUGH, so a
# multi-line command whose other line carried `jq -r` leaked that -r into the flag scan. Fourth
# false-positive class on this guard, and the one that finally earned it a test file.
seg=$(printf '%s' "$cmd" | grep -E '(^|[|;&(]|[[:space:]])rg[[:space:]]' | sed -E 's/.*(^|[|;&(]|[[:space:]])rg[[:space:]]/rg /' | sed -E 's/[|;&].*//')
# Then drop QUOTED SPANS — the search PATTERN is not a flag list. `rg -n 'jq -r .foo'` was reported
# as a `-r` finding because the pattern contains the characters `-r`; the command was correct and
# the guard was wrong. Fifth false-positive class on this one guard, all the same shape: text that
# merely LOOKS like a flag. Caught live 2026-08-02 16:41 EDT by this guard firing on a command
# being run to audit it.
seg=$(printf '%s' "$seg" | sed -E "s/'[^']*'//g; s/\"[^\"]*\"//g")
# Short-flag clusters only (single dash). Long forms are explicit and intentional, so they pass.
shorts=$(printf '%s' "$seg" | grep -oE '(^|[[:space:]])-[A-Za-z]+' | tr -d ' ' | grep -v '^--' || true)

printf '%s' "$shorts" | grep -q 'h' && findings="${findings}
  · -h is --help in rg (NOT grep's no-filename). It prints the help text, which skims like an empty
    result. Use --no-filename or -I."
printf '%s' "$shorts" | grep -q 'E' && findings="${findings}
  · -E is --encoding in rg (NOT grep's extended-regexp). rg is extended by default — drop the flag."
printf '%s' "$shorts" | grep -qE 'r|R' && findings="${findings}
  · -r/-R is --replace in rg (NOT grep's recursive), and it swallows the next cluster char as its
    value, so -rn replaces matches with 'n'. rg recurses by default — drop it. If you truly want a
    replacement, spell out --replace so the intent is unambiguous."

[ -z "$findings" ] && exit 0
printf 'RG FLAG GUARD — grep-habit short flag(s) detected in an rg command:%s\n\nAll three of these produced silent garbage on 2026-08-02 (the -r one was already documented in prose and still got typed). Re-check the flags before trusting this output — especially before concluding "not found".' "$findings" \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
