#!/bin/bash
# ⚠️ Comments here are SOFT-WRAPPED: `npm run docs:reflow-comments` gates .sh files, so after editing this header run `node scripts/reflow-comments.mjs --write <this file>` or `npm test` goes red. wide-check-guard.sh — PreToolUse on Bash + ctx_batch_execute. Fires when the WHOLE suite is about to run over a change it cannot say anything about.
#
# WHY THIS EXISTS (2026-09-09 19:03 EDT)
# --------------------------------------
# Harkirat: "AND HOLY SHIT, STOP WITH THE FULL TEST SUITES!" — after roughly ten `npm test` runs in one session, several of them on commits that touched only Markdown. Then, when the answer offered was a routing table plus an explicit refusal to add a gate: "you didnt answer it with a new gate yet you kept the gap in the original gate?" He is right, and that refusal was using his own no-new-gates rule as cover for leaving a hole in the enforcement layer that was already being edited in the same session.
#
# 🔴 THE GAP IT CLOSES, STATED AS THE MEASUREMENT NOBODY WAS TAKING. The completion-claim `Stop` gate fires on a claim made with ZERO checks. Nothing anywhere fired on a check that was far too WIDE — so under-verifying was instrumented and over-verifying was invisible, and the invisible one is what cost minutes per turn all day. A guard layer that measures only one direction of a two-directional error quietly teaches the other one.
#
# WHY PreToolUse AND NOT Stop. A `Stop` hook fires after the turn, by which point the suite has already run and the minutes are already spent — documentation wearing a hook's clothes, which this repo's own hook doctrine names as the defect to avoid. This fires at the moment of the choice, while the cost is still preventable.
#
# WHAT MAKES IT EXACT, and it needs no judgement call. Two decidable facts: the command is a whole-suite invocation, and every uncommitted path ends in `.md`. `npm test` runs Node tests, hook tests, portal gates and the reflows — none of which reads Markdown prose for correctness. ⚠️ A CLEAN TREE IS SILENT ON PURPOSE: nothing uncommitted usually means a push or a merge is next, and that is the one situation where the whole suite is exactly right.
#
# WHAT IT DOES NOT CLAIM. It is advisory and blocks nothing. A docs-only change CAN legitimately want the suite — `docs-audit.test.mjs` and the reflow tests are real code with real fixtures, and a doc that a script parses is a doc a script can break on. The nudge names the narrower command; it does not overrule you.
#
# ⚠️ Emits hookSpecificOutput WITH hookEventName. A hook that omits hookEventName is SILENTLY DISCARDED — it runs, exits 0, prints valid JSON, and reaches nobody. And a pipe-test proves the SCRIPT works, never that the HOOK fires.

judge() {
  cmd="$1"
  [ -z "$cmd" ] && return 1
  # A whole-suite run only. `test:hooks`, `docs:audit:test` and the other scoped tasks ARE the narrow instruments this nudge points at, so they must never trigger it.
  printf '%s' "$cmd" | grep -qE '(^|[|;&[:space:]])(npm|pnpm|yarn)[[:space:]]+(run[[:space:]]+)?test([[:space:]]|$)' || return 1

  root="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}"
  changed=$(git -C "$root" status --porcelain 2>/dev/null | awk '{ print $NF }')
  # A clean tree means a push or a merge is the likely next step, and that is the one row that earns the suite.
  [ -z "$changed" ] && return 1
  # Every changed path a .md file? Then the suite reads none of what moved.
  printf '%s\n' "$changed" | grep -qvE '[.]md$' && return 1

  n=$(printf '%s\n' "$changed" | grep -c .)
  printf 'WIDE-CHECK NUDGE — %s uncommitted file(s), every one of them Markdown, and you are about to run the whole suite.\n\nnpm test runs Node tests, hook tests, portal gates and the reflows. NONE of them reads Markdown prose for correctness, so a green here would be green over a change it never inspected — and the suite is one && chain, so an early failure truncates every gate behind it.\n\nThe narrower checks that DO apply to what you changed:\n\n  npm run docs:audit             # records, cross-references, front matter, the conservation rule\n  npm run docs:reflow            # only if prose moved\n  npm run docs:reflow-comments   # only if code comments moved\n\nMeasured 2026-09-09 19:06 EDT: about ten suite runs in one session, several on Markdown-only commits, against a memory that already said MATCH THE CHECK TO THE CHANGE. The full routing table is in the memory feedback_verify_at_checkpoints_not_reflexively — npm test is reserved for a push, a PR or a merge.\n\nIt is right to run the suite anyway when a doc a SCRIPT parses has changed, since docs-audit and the reflow tests are real code. This is a reminder of the narrower command, not a verdict on this one.' "$n" \
    | jq -Rs '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:.}}'
  return 0
}

# Both tool shapes, one stdin read — the same driver the two routing nudges use, and for the reason they learned: this repo MANDATES ctx_batch_execute, so a hook registered on Bash alone is blind to the path the working contract tells sessions to use. NUL-separated so a multi-line command stays ONE candidate.
payload=$(cat)
{ printf '%s' "$payload" | jq -j '(.tool_input.commands // []) | map(.command // empty) | .[] + "\u0000"' 2>/dev/null
  printf '%s' "$payload" | jq -j 'if (.tool_input.command // "") == "" then empty else .tool_input.command + "\u0000" end' 2>/dev/null; } > "${TMPDIR:-/tmp}/.widecheck.$$"
while IFS= read -r -d '' c; do
  [ -z "$c" ] && continue
  if judge "$c"; then break; fi
done < "${TMPDIR:-/tmp}/.widecheck.$$"
rm -f "${TMPDIR:-/tmp}/.widecheck.$$"
exit 0
