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

# Only look at actual rg invocations: start of line, or after a pipe/;/&&/(.
printf '%s' "$cmd" | grep -qE '(^|[|;&(]|[[:space:]])rg[[:space:]]' || exit 0

findings=""
# Short-flag clusters only (single dash). Long forms are explicit and intentional, so they pass.
shorts=$(printf '%s' "$cmd" | grep -oE '(^|[[:space:]])-[A-Za-z]+' | tr -d ' ' | grep -v '^--' || true)

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
