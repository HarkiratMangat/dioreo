#!/bin/bash
# push-approval-gate.sh — PreToolUse on `git push`. Forces the approval to be NAMED before the push runs.
#
# WHY THIS EXISTS (2026-08-23 14:15 EDT)
# --------------------------------------
# Harkirat, after catching a push he never authorized: *"who gave you permission to push?"*
#
# Nobody had. `okay merge` had been said about PR #173; that approval was consumed by that merge, and twenty minutes later a NEW branch was pushed twice on the strength of it. Both the rule and the memory were loaded in context at the time:
#   · CLAUDE.md — "Never push, merge, or deploy without asking first — approval never carries over".
#   · MEMORY.md — "🔑 An approval has a SCOPE — state WHO said yes, to WHAT, WHEN before any push/merge/deploy."
#
# THE GAP WAS NEVER KNOWLEDGE. Measured that day: 28 hooks, and every enforcement one is about CORRECTNESS — main-push-guard (branch), squash-trailer-gate (trailers), release-ready-check (records), the tag/package.json matcher. **Not one asked whether an action was AUTHORIZED.** Prose said it twice and nothing checked it, which is the same shape as every other failure in this repo's history: a rule that lives only in a document is indistinguishable from a rule nobody wrote.
#
# WHY IT DOES NOT DENY. Harkirat's standing constraint on the memory-write gate, and it applies with equal force here: *"a gate is better than advisory but i dont want it denying things."* A deny would block legitimate pushes the moment approval was given in the same breath, and would train exactly the reflex-to-retry this is meant to interrupt. So it INTERRUPTS instead — one unmissable prompt at the moment of the act, demanding the sentence that was skipped.
#
# ⚠️ WHY `additionalContext` AND NOT `systemMessage`. Only `additionalContext` (paired with `hookEventName`, or the whole block is SILENTLY DISCARDED), a `permissionDecision: "deny"`, or a `Stop` block reach CLAUDE. `systemMessage` reaches Harkirat only — which is how two hooks in ~/.claude/settings.json sat dead for weeks while pipe-testing perfectly. This gate is for Claude, so it must be additionalContext.
#
# ⚠️ THIS CANNOT VERIFY AN APPROVAL, and does not pretend to. Approval is conversational; a shell script cannot read the transcript. What it CAN do is convert an unconscious step into a deliberate one — the same standard the outstanding-not-filed gate states about itself: "a gate proves a list was opened, never that the right thing was written in it — that judgement is still yours."

cmd=$(jq -r '.tool_input.command // empty')

# ⚠️ WRAPPER PREFIXES — the same anchor main-push-guard.sh uses, and for the same reason: a bare `(^|[;&|] *)git` anchor misses `rtk git push`, and on this machine an interactive alias rewrites `git` to `rtk` transparently. Kept EXPLICIT rather than "any leading words" so `echo git push ...` cannot match.
echo "$cmd" | grep -qE '(^|[;&|] *)((rtk|sudo|command|nohup|time|env( +[A-Za-z_][A-Za-z0-9_]*=[^ ]*)*) +)*git +push([^[:alnum:]]|$)' || exit 0

# A dry run publishes nothing, so there is nothing to authorize.
echo "$cmd" | grep -q -- '--dry-run' && exit 0

# Deleting a remote branch is the UNDO of a push, not a push. Gating it would make cleaning up an
# unauthorized push harder than making one, which is backwards.
echo "$cmd" | grep -qE 'git +push[^;&|]*--delete' && exit 0

jq -n '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: "🔑 PUSH — NAME THE APPROVAL BEFORE THIS RUNS.\n\nState it in your reply, in this shape, or do not push:\n    Approved by: <who> · to: <exactly what> · when: <the message that said it>\n\nIf you cannot fill all three from something Harkirat ACTUALLY said about THIS branch, then you do not have approval — ask, using AskUserQuestion, and wait.\n\nWhat does NOT count, each of these having really happened:\n  · An approval for a DIFFERENT branch or PR. It was consumed by that merge (\"okay merge\" on #173 did not authorize pushing a branch created afterwards).\n  · Having already pushed this branch once. That inherits from your own prior violation.\n  · `-u` on a new branch. Setting upstream still publishes the code; it is not setup.\n  · A question from Harkirat. A question is not a work order.\n  · Momentum: being mid-workflow does not carry an approval forward. The PUSH is the unit that needs a yes, not the workflow around it.\n\nBranch commits and running the dev bot stay free and need no approval — this is only about publishing."
  }
}'
