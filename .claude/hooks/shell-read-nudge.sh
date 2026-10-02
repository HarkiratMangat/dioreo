#!/bin/bash
# shell-read-nudge.sh — PreToolUse on Bash and ctx_batch_execute. Fires when a shell command READS a repo file (`cat`, `head`, `tail`, `sed -n 'N,Mp'`, `awk 'NR…'`) instead of routing it through read_smart, ctx_execute_file, or ctx_search for a question about the indexed docs and rules.
#
# WHY THIS EXISTS (2026-09-14 22:32 EDT, context-carriers plan WP4)
# ------------------------------------------------------
# The 2026-09-08 carriers plan measured that routing rules restated at session start do not change behaviour: `read_smart` had 0 calls until 2026-08-31 while Bash ran 11,462 calls in one week, most of them file reads. It decided the rule belongs AT THE CALL, and this call had no hook: `read-routing-nudge.sh` watches the native Read tool, and a `cat` inside Bash never touches Read. Replaying the last eight sessions on 2026-09-14 found 159 such reads — 58 `sed -n` ranges, 49 `head`/`tail`, 29 `awk` line ranges, 23 `cat`.
#
# WHY THIS TRIGGER AND NOT A BROADER ONE, the siblings' bar: no precision question to gate. A SIMPLE command whose first word is a reader, aimed at exactly one file with a text or code extension, outside the temp and log directories, is decidable from the command string. A log tail, a write (`cat > f`, a heredoc), a substitution (`sed -i`, `sed 's/…/'`), a second file, a pipe into anything but a display trimmer, or a compound command all stay silent, because each is a case where the shell is doing work the routing does not replace.
#
# WHAT IT DOES NOT CLAIM. `Read` with offset/limit is still right for the bytes an Edit call must match, and a heredoc edit reads its target itself. Advisory only; it blocks nothing.
#
# ⚠️ `ctx_execute` is NOT watched: its payload is `code`, a script body, not a command string, and parsing a script for reads would be the intent classification these hooks refuse to do.
#
# ⚠️ Emits hookSpecificOutput WITH hookEventName — a hook that omits it is silently discarded.
judge() {
  cmd="$1"
  [ -z "$cmd" ] && return 1
  # A leading `cd … &&` is boilerplate on almost every batched command, not a chain.
  cmd=$(printf '%s' "$cmd" | sed -E "s/^[[:space:]]*cd[[:space:]]+('[^']*'|\"[^\"]*\"|[^[:space:]]+)[[:space:]]*&&[[:space:]]*//")
  # One statement only: a newline, `&&`, `||` or `;` means the read is one step among several.
  case "$cmd" in *"
"*) return 1 ;; esac
  printf '%s' "$cmd" | grep -qE '(&&|\|\||;)' && return 1
  # Writes and heredocs are not reads.
  printf '%s' "$cmd" | grep -qE '(>|<<)' && return 1
  # A pipe is allowed only into a display trimmer; into anything else the output is being processed, not read.
  first=$(printf '%s' "$cmd" | awk -F'|' '{print $1}')
  rest=$(printf '%s' "$cmd" | awk -F'|' '{ for (i = 2; i <= NF; i++) print $i }')
  if [ -n "$rest" ]; then
    printf '%s\n' "$rest" | grep -qvE '^[[:space:]]*(cut|head|tail|nl)([[:space:]]|$)' && return 1
  fi
  # shellcheck disable=SC2086 # word-splitting the first segment into argv is the point
  set -- $first
  tool="$1"; shift
  case "$tool" in
    cat|head|tail) ;;
    sed) [ "${1:-}" = "-n" ] || return 1; shift
         printf '%s' "${1:-}" | grep -qE "^['\"]?[0-9]+(,[0-9]+)?p['\"]?$" || return 1; shift ;;
    awk) printf '%s' "${1:-}" | grep -qE "^'NR[[:space:]]*[<>=!]" || return 1; shift ;;
    *) return 1 ;;
  esac
  # What is left: options, then exactly one file.
  files=()
  while [ $# -gt 0 ]; do
    case "$1" in
      -n|-c) shift ;;
      -*) ;;
      *) printf '%s' "$1" | grep -qE '^[0-9]+$' || files+=("$1") ;;
    esac
    shift
  done
  [ "${#files[@]}" -eq 1 ] || return 1
  f="${files[0]}"; f="${f#\"}"; f="${f%\"}"; f="${f#\'}"; f="${f%\'}"
  case "$f" in
    /tmp/*|/private/*|/var/*|*.log|/dev/*|-) return 1 ;;
  esac
  printf '%s' "$f" | grep -qE '\.(js|mjs|cjs|ts|tsx|json|md|sh|css|html|yml|yaml|txt|toml)$' || return 1

  printf 'SHELL-READ NUDGE — this reads a file through the shell, where no Read-tool routing can see it.\n\nA file you will not change with a direct Edit call:\n  mcp__linksee__read_smart({ path })          # whole file; its first read builds the chunk map\n  mcp__plugin_context-mode_context-mode__ctx_execute_file({ path, code })   # a question ABOUT the file\n  mcp__plugin_context-mode_context-mode__ctx_search({ source: "project:dioreo-docs", queries: [...] })   # a question answered somewhere in docs/ or .claude/rules/ (project:dioreo-rules)\n\n⚠️ read_smart'"'"'s cache is shared by every session, so "unchanged" carries no content: slice the chunk ranges it returns, with force:true only for a small file needed whole. Read with offset/limit stays right for the bytes an Edit call must match.\n\nMeasured 2026-09-14 across eight sessions: 159 shell reads like this one. Advisory only; it blocks nothing.' \
    | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
  return 0
}

# Both tool shapes, one stdin read, NUL-separated — the two traps ctx-search-nudge.sh already paid for.
payload=$(cat)
{ printf '%s' "$payload" | jq -j '(.tool_input.commands // []) | map(.command // empty) | .[] + "\u0000"' 2>/dev/null
  printf '%s' "$payload" | jq -j 'if (.tool_input.command // "") == "" then empty else .tool_input.command + "\u0000" end' 2>/dev/null; } > "${TMPDIR:-/tmp}/.shellread.$$"
while IFS= read -r -d '' c; do
  [ -z "$c" ] && continue
  if judge "$c"; then break; fi
done < "${TMPDIR:-/tmp}/.shellread.$$"
rm -f "${TMPDIR:-/tmp}/.shellread.$$"
exit 0
