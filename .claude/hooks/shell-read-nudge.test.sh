#!/bin/bash
# Proofs for shell-read-nudge.sh. It must fire on a shell read of a repo file and stay silent on everything the shell legitimately does — an advisory that fires on a log tail gets filtered, and then it protects nothing.
HOOK="$(cd "$(dirname "$0")" && pwd)/shell-read-nudge.sh"; pass=0; fail=0
r(){ local raw; raw="$(printf '{"tool_input":{"command":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
rb(){ local raw; raw="$(printf '{"tool_input":{"commands":[{"label":"x","command":%s}]}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK")"
     [ -z "$raw" ] && { echo SILENT; return; }
     printf '%s' "$raw" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a(){ local n="$1" want="$2" out got; out="$(r "$3")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n (want $want got $got)"; fail=$((fail+1)); fi; }
ab(){ local n="$1" want="$2" out got; out="$(rb "$3")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n (want $want got $got)"; fail=$((fail+1)); fi; }
echo "shell-read-nudge.sh — proofs"
# ── FIRES: the shapes measured in the eight-session replay, each written the way it actually was.
a  "cat of a repo file"                 fires  "cat models/AnalyticsEvent.js"
a  "sed -n range, trimmed with cut"     fires  "sed -n 193p portal/ui/access.js | cut -c1-400"
a  "sed -n quoted range"                fires  "sed -n '40,90p' docs/db-deferred-list.md"
a  "awk NR range, trimmed"              fires  "awk 'NR<=40' scripts/seedAnalyticsShapes.js | cut -c1-260"
a  "head -n on a doc"                   fires  "head -n 30 docs/README.md"
a  "tail of a script"                   fires  "tail -20 scripts/testRunner.mjs"
a  "after a leading cd"                 fires  "cd '/Applications/Claude Code/Diors-Builds' && cat CLAUDE.md"
ab "batch shape: sed -n inside ctx_batch_execute" fires "sed -n '1,40p' portal/ui/shell.js"
# ── SILENT: the shell doing real work, not reading around the routing.
a  "tail of a log in /tmp"              silent "tail -n 15 /tmp/ih.log"
a  "a .log file anywhere"               silent "tail -50 local/run.log"
a  "cat writing a file"                 silent "cat > local/x.md"
a  "cat heredoc"                        silent "$(printf 'cat <<%sEOF%s\nhello\nEOF' "'" "'")"
a  "sed substitution"                   silent "sed 's/a/b/' docs/README.md"
a  "sed -i edit"                        silent "sed -i '' 's/a/b/' docs/README.md"
a  "piped into jq (processing)"         silent "cat package.json | jq .version"
a  "two files concatenated"             silent "cat a.md b.md"
a  "head on command output"             silent "git log --oneline | head -5"
a  "compound command"                   silent "cat CLAUDE.md && echo done"
a  "an extensionless file"              silent "head -c 600 local/probe"
a  "awk that is not a line range"       silent "awk '{print \$1}' docs/README.md"
a  "not a reader at all"                silent "rg -n 'foo' docs/"
# ── the message must carry the replacement call and the unchanged warning, or it restates without routing
out="$(r "cat models/AnalyticsEvent.js")"
case "$out" in *"mcp__linksee__read_smart"*) echo "  PASS  names the read_smart call"; pass=$((pass+1));; *) echo "  FAIL  message lacks the replacement call"; fail=$((fail+1));; esac
case "$out" in *"ctx_search"*) echo "  PASS  names ctx_search for questions about docs and rules"; pass=$((pass+1));; *) echo "  FAIL  message lacks the ctx_search route"; fail=$((fail+1));; esac
case "$out" in *"carries no content"*) echo "  PASS  warns that unchanged carries no content"; pass=$((pass+1));; *) echo "  FAIL  message lacks the unchanged warning"; fail=$((fail+1));; esac
# ── the WIRING, not only the script: a correct hook nobody registered protects nothing
if SETTINGS="$(cd "$(dirname "$0")/.." && pwd)/settings.json" python3 -c "
import json, io, sys, os
cfg = json.load(io.open(os.environ['SETTINGS'], encoding='utf-8'))
for h in cfg['hooks']['PreToolUse']:
    for e in h.get('hooks', []):
        if 'shell-read-nudge.sh' in e.get('command', ''):
            m = h.get('matcher') or ''
            sys.exit(0 if 'Bash' in m and 'ctx_batch_execute' in m else 1)
sys.exit(1)
"; then echo "  PASS  WIRED on Bash and ctx_batch_execute"; pass=$((pass+1)); else echo "  FAIL  not registered on Bash and ctx_batch_execute"; fail=$((fail+1)); fi
echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
