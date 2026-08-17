#!/usr/bin/env bash
# claim-detect.sh — the SINGLE definition of "this message claims the work is done".
#
# WHY THIS EXISTS (2026-08-06 09:46 EDT). Two hooks needed the same judgement and each carried its own copy of the regex: the completion-claim gate (added 2026-07-27, inline in settings.json) and completeness-sweep.sh (added today). That is byte-for-byte the defect `notes-open-items.sh` was written to fix — one regex, two copies, one of which silently went unfixed for weeks because there was no single place to fix it. Re-creating the pattern within the same repo, days later, is worse than the original: the lesson was already written down.
#
# One implementation, called from both. Adding a phrase here changes every gate at once.
#
# ⚠️ THE TWO CALLERS WANT DIFFERENT THINGS FROM IT, and that is fine:
#   · the completion-claim gate asks "was a claim made with no verification behind it?"
#   · completeness-sweep asks "is now the moment to run passes 2 and 3?"
# Both reduce to the SAME predicate — is this a completion claim — so the predicate is shared and the policies stay separate. If they ever genuinely need different sensitivities, add a second named mode here rather than a second copy of the pattern somewhere else.
#
# Usage:
#   claim-detect.sh --regex          -> print the pattern, for a caller doing its own grep
#   claim-detect.sh <transcript>     -> exit 0 if the last assistant message carries a claim
#
# Failure mode, stated: it reads INTENT from wording, so it cannot separate "this is done" from "this is done except X" — deliberately, since a hedged claim is still a claim and is exactly the case worth interrupting.

set -uo pipefail

# Sourced from the completion-claim gate's own pattern (in settings.json since 2026-07-27 08:52 EDT), unioned with the phrasings completeness-sweep needed. Keep additions SPECIFIC: a pattern matching ordinary progress narration would fire on every message and get the gates disabled, which is the noise argument written into four other hooks in this directory.
CLAIM_RE='\ball done\b|everything.?s (done|clean|correct|working|in sync)|fully (done|documented|verified|working|synced)|properly (documented|verified|configured)|(is|are|it.?s) (verified|confirmed|clean|complete|in sync|up to date|all set)|no (gaps|issues|residue|mistakes|problems|stale|misses) ?(found|left|remain|remains)?|nothing (missed|left|forgotten|broken|else|remaining)|\ball (set|good|clear|clean)\b|session.?s (actually )?done|task is complete|matches (exactly|cleanly)|zero (residue|issues|matches)|all (three|four|five|six|[0-9]+) (jobs|tasks|items)|audit (done|complete)|sweep (done|complete)|swept clean|ready to (push|merge|open)'

if [ "${1:-}" = "--regex" ]; then printf '%s' "$CLAIM_RE"; exit 0; fi

tp="${1:-}"
[ -n "$tp" ] && [ -f "$tp" ] || exit 1

# `tail -c` bounds the read to the last message, never the whole transcript. A Stop hook runs on every assistant message, so reading a growing multi-megabyte file each time is a latency tax on the entire session — the cost control that keeps these gates worth having.
tail -c 60000 "$tp" 2>/dev/null | grep '"type":"assistant"' | tail -3 | grep -qiE "$CLAIM_RE"
