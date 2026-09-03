#!/bin/bash
# rg-flag-guard.sh — PreToolUse on Bash. Catches grep-habit short flags passed to ripgrep.
#
# WHY THIS EXISTS Three separate times on 2026-08-02 I passed a grep flag to `rg` and got silent garbage:
#   · `rg -oh 'pat' dir`  -> `-h` is --help in rg (grep: no-filename). Printed the HELP TEXT, which
#     reads exactly like "no matches found" when skimmed. I nearly concluded a field was unused.
#   · `rg -E '^(a|b)'`    -> `-E` is --encoding in rg (grep: extended-regexp; rg is extended by
#     DEFAULT so the flag is never needed). Died with "unknown encoding".
#   · `rg -rn 'pat'`      -> `-r` is --replace, and clusters with an inline value, so this silently
#     REPLACES every match with "n" instead of showing line numbers.
#
# The `-r` trap was ALREADY written up in the global CLAUDE.md and I still hit the other two the same day. That is the whole argument for a gate over prose: the documentation was correct, present, and recently read, and it did not stop the hand.
#
# WARNS rather than blocks: there are legitimate uses (`rg --help` spelled out), and a PreToolUse note lands BEFORE I read the output, which is the moment that matters — the danger is misreading help text as an empty result, not the command itself.

cmd=$(jq -r '.tool_input.command // empty')
[ -z "$cmd" ] && exit 0
# $cmd is mutated below (heredoc bodies stripped, then narrowed to the rg segment), so the substitution needs the ORIGINAL bytes -- rewriting the stripped copy would hand back a command missing its heredoc.
payload_cmd="$cmd"

# Strip HEREDOC BODIES first. A commit message or a `cat > f <<'EOF'` block that merely DISCUSSES rg is prose, not an invocation — this guard's own commit message tripped it 2026-08-02 15:15 EDT by quoting `rg -n` in the body. Third false-positive class fixed on this pattern in one session; each one matters because a guard that cries wolf is how the true warning gets dismissed.
cmd=$(printf '%s' "$cmd" | awk '
  /<<-?'"'"'?[A-Za-z_]+'"'"'?/ && !inhd { match($0, /<<-?'"'"'?[A-Za-z_]+'"'"'?/);
    d=substr($0, RSTART, RLENGTH); gsub(/^<<-?'"'"'?|'"'"'$/, "", d); inhd=1; print; next }
  inhd && $0 == d { inhd=0; next }
  !inhd { print }')

# Only look at actual rg invocations: start of line, or after a pipe/;/&&/(.
printf '%s' "$cmd" | grep -qE '(^|[|;&(]|[[:space:]])rg[[:space:]]' || exit 0

findings=""
# Scope to the rg SEGMENT only. The first version scanned the whole command string, so a pipeline containing both `jq -r` and `rg -n` reported a bogus -r finding — caught live 2026-08-02 15:15 EDT by the guard firing on the very command inspecting it. A guard that cries wolf is how the real warning gets waved through, which is the lesson the timestamp hook already paid for. SELECT the rg-bearing lines FIRST. sed rewrites per line but PASSES NON-MATCHING LINES THROUGH, so a multi-line command whose other line carried `jq -r` leaked that -r into the flag scan. Fourth false-positive class on this guard, and the one that finally earned it a test file.
seg=$(printf '%s' "$cmd" | grep -E '(^|[|;&(]|[[:space:]])rg[[:space:]]' | sed -E 's/.*(^|[|;&(]|[[:space:]])rg[[:space:]]/rg /' | sed -E 's/[|;&].*//')
# Then drop QUOTED SPANS — the search PATTERN is not a flag list. `rg -n 'jq -r .foo'` was reported as a `-r` finding because the pattern contains the characters `-r`; the command was correct and the guard was wrong. Fifth false-positive class on this one guard, all the same shape: text that merely LOOKS like a flag. Caught live 2026-08-02 16:41 EDT by this guard firing on a command being run to audit it.
seg=$(printf '%s' "$seg" | sed -E "s/'[^']*'//g" | sed -E 's/"[^"]*"//g')
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

# --- SUBSTITUTION ------------------------------------------------------------------------------- ONLY MULTI-LETTER CLUSTERS, and that narrowness is the whole design. The test for promoting a gate from advisory to correcting is whether it knows the ONE right value with no judgement left. For a cluster it does: -rn can only ever be grep's "recursive + line numbers", because rg's -r takes a value and would swallow the n, so dropping the r is the single correct reading. A LONE -r, -h or -E fails that test outright -- rg -r foo is a legitimate --replace, rg -h is a legitimate request for help, rg -E utf8 is a legitimate encoding -- so those stay advisory. A substitution that guesses is strictly worse than a refusal: a refusal is visible, a wrong rewrite produces a plausible command with no author.
#
# A COMMAND CARRYING A HEREDOC IS NEVER REWRITTEN. This guard already learned five separate false-positive classes, every one of them text that merely LOOKED like a flag, and a heredoc body is the largest such surface there is. Quote state is tracked in the parser below so a pattern like rg -n 'jq -rn .x' is untouched, but a heredoc is left alone wholesale rather than parsed.
#
# THE VALIDATION LIVES IN THE PYTHON, NOT IN THE SHELL. A first version re-scanned the fixed command with a second pair of seds in bash; three attempts at escaping a sed that strips double-quoted spans inside a double-quoted string failed three different ways, and a looser second check is also how a half-fixed command gets shipped as a clean one. The parser that made the edit is the thing that should certify it.
case "$cmd" in *'<<'*) has_heredoc=1;; *) has_heredoc=0;; esac
if [ -z "${RG_NO_AUTOFIX:-}" ] && [ "$has_heredoc" = "0" ]; then
  fixed=$(RGCMD="$payload_cmd" python3 - <<'PY'
import os, sys
cmd = os.environ.get("RGCMD", "")
spans, i, n, q, start = [], 0, len(cmd), None, None
def flush(end):
    global start
    if start is not None:
        spans.append((start, end, cmd[start:end]))
        start = None
while i < n:
    c = cmd[i]
    if q:
        if c == q: q = None
        i += 1; continue
    if c == "'" or c == '"':
        q = c; flush(i); i += 1; continue
    if c in " \t\n":
        flush(i); i += 1; continue
    if c in "|;&(":
        flush(i); spans.append((i, i, "|")); i += 1; continue
    if start is None: start = i
    i += 1
flush(n)
out, edits, in_rg = cmd, [], False
for (a, b, tok) in spans:
    if tok == "|": in_rg = False; continue
    if tok == "rg": in_rg = True; continue
    if not in_rg: continue
    if not (tok.startswith("-") and not tok.startswith("--") and len(tok) >= 3 and tok[1:].isalpha()):
        continue
    letters = list(tok[1:])
    new = [("I" if ch == "h" else ch) for ch in letters if ch not in ("r", "R", "E")]
    if new != letters:
        # When the whole token goes, take one preceding space with it. A post-hoc
        # out.replace("  ", " ") looked equivalent and was not: it ran over the WHOLE command,
        # including the quoted spans this tokenizer exists to protect, so `rg -rn "foo  bar" docs/`
        # was auto-allowed as `rg -n "foo bar" docs/` -- a silently altered regex, from the guard
        # whose entire purpose is preventing silently-wrong searches. Corrected 2026-09-02 18:21 EDT by a
        # code review. Splice precisely; never tidy the result afterwards.
        start = a - 1 if (not new and a > 0 and cmd[a - 1] == " ") else a
        edits.append((start, b, "-" + "".join(new) if new else ""))
if edits:
    for (a, b, rep) in reversed(edits):
        out = out[:a] + rep + out[b:]
    out = out.strip()
    seen, still = False, False
    for tok in out.replace("|", " ").replace(";", " ").replace("&", " ").split():
        if tok == "rg": seen = True; continue
        if seen and tok.startswith("-") and not tok.startswith("--") and len(tok) >= 3 \
           and tok[1:].isalpha() and any(ch in "rREh" for ch in tok[1:]):
            still = True
    if not still:
        sys.stdout.write(out)
PY
)
  if [ -n "$fixed" ]; then
    read -r -d '' FIXMSG <<'MSG'
RG FLAG GUARD - CORRECTED a grep-habit flag cluster instead of refusing the command.
rg recurses by default (-r is --replace, and it swallows the next cluster letter as its value, so -rn replaces every match with n), it is extended-regexp by default (-E is --encoding), and -h is --help (use -I).
A LONE -r, -h or -E is deliberately left alone: each has a legitimate rg meaning, so only a multi-letter cluster is unambiguous enough to rewrite.
MSG
    jq -n --arg c "$fixed" --arg m "$FIXMSG" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"allow",updatedInput:{command:$c},permissionDecisionReason:($m + "\nIt now reads: " + $c)}}'
    exit 0
  fi
fi

printf 'RG FLAG GUARD — grep-habit short flag(s) detected in an rg command:%s\n\nAll three of these produced silent garbage on 2026-08-02 (the -r one was already documented in prose and still got typed). Re-check the flags before trusting this output — especially before concluding "not found".' "$findings" \
  | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
