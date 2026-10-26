#!/usr/bin/env bash
# dev-bot-instance-check.sh — SessionStart, informational only (never blocks).
#
# WHY THIS EXISTS: docs/SESSION-START.md's own "multiple instances on the same token" guidance was CONDITIONAL — "if the bot behaves erratically, suspect this" — which meant it only fired after something already looked wrong, from memory, in a session that happened to think of it. Added 2026-08-07 12:42 EDT after a live collision: this session's own `git switch`/`checkout` calls restarted a `node --watch` dev-bot child mid-session (confirmed by an exact-second match between `git reflog` and the child PID's start time), and Harkirat asked why an unconditional check like this hadn't caught it. `node --watch` legitimately runs TWO processes per dev-bot session (a supervisor + one worker child it respawns on file changes) — that pair is NORMAL, not a collision. The real problem is two INDEPENDENT trees on the same token (two terminals, or a stray process from an earlier session nobody killed). Distinguish by PPID: a worker whose parent is itself one of the matched processes is a normal --watch child; anything else sharing the same token is a real collision.
#
# See feedback_multiple_bot_instances / project_local_dev_bot memory. Self-test: dev-bot-instance-check.test.sh (wired into `npm run test:hooks`).

set -uo pipefail

msg=""

# pid|ppid|command, matched processes only. macOS `ps -eo` needs `command=` for the untruncated form.
procs=$(ps -eo pid,ppid,command= 2>/dev/null | awk '/env-file=\.env\.dev/ && /index\.js/ && !/awk/')

if [ -n "$procs" ]; then
    count=$(printf '%s\n' "$procs" | grep -c .)
    if [ "$count" -gt 1 ]; then
        # Build the set of PIDs seen, then flag any process whose PPID is NOT also in that set -- that's a process with no matched parent, i.e. an independently-launched instance.
        pids=$(printf '%s\n' "$procs" | awk '{print $1}')
        independent=0
        while IFS= read -r line; do
            ppid=$(printf '%s' "$line" | awk '{print $2}')
            if ! printf '%s\n' "$pids" | grep -qx "$ppid"; then
                independent=$((independent + 1))
            fi
        done <<< "$procs"

        if [ "$independent" -gt 1 ]; then
            msg=$(printf 'DEV BOT INSTANCE CHECK: %s independently-launched process(es) are running against the dev token (.env.dev) at once -- this is NOT a normal `node --watch` supervisor+child pair (those share a parent/child PID relationship and are expected). Discord routes each interaction to whichever instance currently holds the gateway connection, so responses will feel erratic/inconsistent at random. Full list (pid ppid command):\n%s\nKill the stray one(s) before continuing -- confirm with the user which to keep if unsure which is the one actively being tested.' "$independent" "$procs")
        fi
    fi
fi

printf '%s' "$msg" | jq -Rs 'if . == "" then empty else {hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:.}} end'
