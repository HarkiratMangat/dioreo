#!/bin/bash
# Pins every false-positive class this guard has produced. It was patched THREE times by observation before getting a test file — which is why it kept regressing. Each case below is a real misfire.
HOOK="$(dirname "$0")/rg-flag-guard.sh"; pass=0; fail=0
# A silent hook prints NOTHING, and `jq` on empty input also prints nothing — so a naive read of the output treats "silent" as "fired". That exact bug has now appeared in THREE test harnesses this session. Capture raw output and decide from emptiness, never from a jq default.
r(){ local raw; raw="$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.additionalContext // .hookSpecificOutput.permissionDecisionReason // "SILENT"'; }
a(){ local n="$1" want="$2" out; out="$(r "$3")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n (want $want got $got)"; fail=$((fail+1)); fi; }
echo "rg-flag-guard.sh — proofs"
# TRUE positives: the three real mistakes.
a "rg -oh (help text)"            fires  "rg -oh 'pat' dir"
a "rg -E (encoding)"              fires  "rg -E '^(a|b)' f"
a "rg -rn (replace)"              fires  "rg -rn 'pat' ."
# FALSE positive #1: another tool's flags in the same pipeline.
a "jq -r piped into rg"           silent "jq -r '.a' f.json | rg -n 'x'"
# FALSE positive #2: heredoc body merely DISCUSSING rg.
a "heredoc prose mentioning rg"   silent "$(printf 'git commit -F - <<%sEOF%s\nfixed: jq -r and rg -n tripped it\nEOF' "'" "'")"
# FALSE positive #3: a DIFFERENT LINE carrying another tool's -r.
a "multi-line, -r on another line" silent "$(printf "jq -r '.hooks' ~/.claude/settings.json\nrg -c 'pat' file.md")"
# FALSE positive #4: -c/-n/-l are fine.
a "ordinary rg flags"             silent "rg -n --hidden --no-ignore 'pat' docs"
a "rg -c"                         silent "rg -c 'pat' file.md"
# FALSE positive #5: flag-shaped text inside the SEARCH PATTERN. Found 2026-08-02 16:41 EDT when this guard fired on a command being run to audit it — the pattern, not the command, held the -r.
a "-r inside the pattern"         silent "rg -n 'jq -r .hookSpecificOutput' file.sh"
a "-h inside a double-quoted pat" silent "rg -n \"use -h for help\" docs"
a "-E inside the pattern"         silent "rg -n 'pass -E to iconv' notes.md"
# …but a real bad flag next to a harmless pattern must STILL fire. The strip must not blind it.
a "real -r with quoted pattern"   fires  "rg -rn 'ordinary text' ."
a "real -oh with quoted pattern"  fires  "rg -oh 'ordinary text' dir"
# Not rg at all.
a "grep -rn is not rg"            silent "grep -rn 'pat' ."
a "curl -H is not rg"             silent "curl -H 'X: y' https://x.dev"
echo; # ── the SUBSTITUTION tier ────────────────────────────────────────────────────
# Added 2026-09-02 15:50 EDT. The promotion test is that the hook knows the ONE right value; a cluster satisfies it and a lone flag does not. Both halves are asserted, because a substitution tier that quietly widened to lone flags would rewrite legitimate commands (rg -r IS --replace) and nothing else in this suite would notice.
fixof() { printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK" \
          | jq -r '.hookSpecificOutput.updatedInput.command // ""' 2>/dev/null; }
kind()  { local raw; raw="$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK")"
          [ -z "$raw" ] && { echo silent; return; }
          printf '%s' "$raw" | jq -r 'if .hookSpecificOutput.updatedInput then "fixed" elif .hookSpecificOutput.additionalContext then "advisory" else "silent" end'; }
c() { local n="$1" got="$2" want="$3"
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1));
  else echo "  FAIL  $n -- wanted [$want] got [$got]"; fail=$((fail+1)); fi; }

c "-rn is corrected to -n"            "$(fixof 'rg -rn foo utils/')" 'rg -n foo utils/'
c "-oh is corrected to -oI"           "$(fixof 'rg -oh pat dir')"    'rg -oI pat dir'
c "a lone -r stays ADVISORY"          "$(kind 'rg -r foo utils/')"   advisory
c "a lone -E stays ADVISORY"          "$(kind 'rg -E foo utils/')"   advisory
c "a quoted pattern is untouched"     "$(kind "rg -n 'jq -rn .x' .")" silent
c "grep is not touched"               "$(kind 'grep -rn foo .')"     silent
c "a clean rg is silent"              "$(kind 'rg -n foo .')"        silent
# A cluster is detected but must NOT be rewritten when the command also carries a heredoc.
c "a real cluster beside a heredoc is reported, not rewritten" "$(kind "rg -rn foo . && python3 - <<'EOF'
print(1)
EOF")" advisory
# The seam, so the advisory path stays reachable if the capability ever regresses.
c "RG_NO_AUTOFIX falls back to advisory" "$(RG_NO_AUTOFIX=1 kind 'rg -rn foo utils/')" advisory

echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
