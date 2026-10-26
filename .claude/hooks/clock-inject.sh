#!/bin/bash
# clock-inject.sh — PreToolUse on Edit|Write. Re-states the wall clock immediately before any write.
#
# WHY (Harkirat's suggestion, 2026-08-02 17:01 EDT, adopted the same turn it was made)
# --------------------------------------------------------------------------
# A UserPromptSubmit clock hook already existed and injects the time with every message he sends. It is not enough, and the gap is precise: it refreshes only when HE speaks. Inside one long turn the anchor goes stale, and the model extrapolates forward from it instead of measuring.
#
# Measured in the session that produced this file: the clock was injected at 16:32, the turn then ran 80+ tool calls, and four separate timestamps were invented by adding an imagined elapsed time to that stale anchor — 16:20, 16:44, 16:52 and 16:56, every one of them wrong, two of them ahead of the real clock. `timestamp-check.sh pre` caught them, but catching is the second-best outcome: each catch costs a denied write, a `date` call and a redo.
#
# His framing was the design: *"this way you're always aware of the time. if i send a message or if u trigger a tool."* The write is the exact moment a timestamp gets committed to a file, so that is where the clock belongs.
#
# THIS IS THE PREVENTION AND timestamp-check.sh IS THE NET. Keep both. The guard proves the value is right; this makes the right value available so the guard has nothing to catch. Removing either one because "the other covers it" recreates the failure — the net without the supply means you keep guessing and keep getting denied; the supply without the net means one careless turn ships a fabricated stamp into the CHANGELOG again.
#
# Deliberately never blocks and never inspects the payload: it emits context and exits 0. A hook that runs on every single write must be incapable of stopping one.

# `jq -n --arg` rather than piping into `jq -Rs`: the first build used `rtrimstr(.;"\n")`, which is the two-argument form and does not exist (rtrimstr takes one). jq failed to COMPILE, so the hook printed a parse error and exited non-zero on every single write. Caught by this file's own test on its first run — which is the argument for the whole suite in miniature: the hook had been written, reviewed and wired up, and was completely broken.
jq -n --arg t "$(date '+%Y-%m-%d %H:%M %Z')" \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:("[clock] It is now " + $t + ". Use this for any timestamp in this write — do not add an estimated elapsed time to an earlier reading.")}}'
