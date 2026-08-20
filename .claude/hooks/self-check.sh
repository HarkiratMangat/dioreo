#!/usr/bin/env bash
# .claude/hooks/self-check.sh -- UserPromptSubmit. The per-turn self-check nudge + the model-selection gate.
#
# Was an inline `echo` in .claude/settings.json until 2026-08-11 21:07 EDT. Promoted to a script for one reason: it now has to CARRY the model-selection grid, and a lookup table does not survive being JSON-escaped onto one line of a settings file.
#
# ⚠️ WHY THE GRID IS IN HERE RATHER THAN POINTED AT. Measured the hard way. Every layer already said "use the grid": docs/SESSION-START.md (auto-loaded, names the file), the MEMORY.md index line (auto-loaded, names the axes), and this hook (fires every turn, names the requirement). All three were in context, and the recommendation was STILL made from a remembered shape of the table -- twice, wrongly, in opposite directions. Harkirat: *"so you just ignored our new model recommendation system?"*
#
# The failure mode is precise and worth stating: a POINTER preserves the concept and drops the DISCRIMINATING VALUES. "premise-risk x deliberation-load grid" is enough to feel informed and not enough to be correct -- it carries neither axis DEFINITION nor the retired-cell rule, and those two facts are exactly what both wrong picks turned on. A fourth layer of prose saying "really do open it" would have failed the same way. So the table is present at the moment of the decision instead.
#
# ==========================================================================
# ⚠️ REBUILT 2026-08-20 12:16 EDT -- Harkirat: "nearly every session has skipped reading the model
# recommendation file or given pre-emptive recommendations since they rely purely on what's inside
# of the hook." Two separate defects, and the second one was this hook's fault:
#
#   (1) THE HOOK'S OWN PROMISE WAS FALSE. It said "the table is here so it needs no file read" while
#       omitting three things from `reference_priority_tier_system` that CHANGE ANSWERS: both
#       OFF-GRID moves (Sonnet5-Max, Opus5-Low) and the do-not-calibrate-on-his-history rule. A
#       session working from this hook alone could not reach either off-grid cell -- the table read
#       as complete and was not. Telling sessions to open the file instead would have re-created the
#       pointer failure above, so the missing values are now IN here and pinned by the self-test.
#
#   (2) NOTHING MADE THE PICK CHECKABLE. "Escalate on EVENTS, never pre-emptively" governs CHANGING
#       a pick; the first one was unconstrained. `Opus5-XHigh -- this is complex work` satisfied
#       every gate that existed. So the gate is now the SHAPE: state both axis values and the cell,
#       and the cell becomes a lookup anyone -- Harkirat, or this hook -- can verify. You cannot
#       write "Premise Low · Delib Med -> Opus5-XHigh" without it being visibly wrong.
#
# THREE MODES, chosen by reading the transcript, because a nudge that never stops is a nudge that
# gets tuned out -- and this one was re-injecting ~1.4KB of table on EVERY prompt for a decision
# made ONCE:
#   · no derivation yet        -> FULL grid + the required shape + the FIRST ACTION gate.
#   · derivation valid         -> SHORT: escalation triggers + off-grid moves. The FIRST ACTION gate
#                                 is replaced by "already given -- do NOT repeat it".
#   · derivation WRONG         -> LOUD correction naming the stated axes and the cell they imply.
#   · compact ran after it     -> FULL again, once: the context that justified the pick is gone.
#   · fork/compact SessionStart -> FULL again, once, via a consume-once marker file. A fork COPIES
#                                 the transcript, so without this the inherited derivation would
#                                 wrongly suppress the one re-pick Harkirat actually wants.
# MEASURED 2026-08-20 12:24 EDT, not estimated -- the first draft of this comment asserted "~14.5KB
# becomes ~5.8KB" and both numbers were invented. Real figures, from running the old and new hooks:
# old 2,284 B on EVERY prompt · new 3,666 B once, then 1,267 B. Across a session: 5 prompts 11,420 ->
# 8,734 (23%), 10 prompts 22,840 -> 15,069 (34%), 20 prompts 45,680 -> 27,739 (39%). It carries MORE
# content than before and still costs less from the second prompt on. ⚠️ Re-measure rather than trust
# these if you edit the blocks; they are a dated measurement, not a maintained invariant.
# Fail-open in every ambiguous case (no transcript, unreadable, no jq) -- showing the grid
# unnecessarily costs tokens; hiding it costs a wrong model for a whole session.
# ==========================================================================
#
# ⚠️ THIS IS A SECOND COPY of content owned by the `reference_priority_tier_system` memory, which is duplicated state and can drift (see `feedback_no_duplicated_state_in_prose`). Accepted knowingly: the alternative is a pointer, and a pointer is the thing that measurably failed. The memory is named below as canonical so a reader knows which side wins, and `self-check.test.sh` pins the values that actually discriminate -- including the lookup table used for validation -- so silent drift fails the suite rather than a session.
#
# ⚠️ `hookEventName` is REQUIRED. A hook emitting hookSpecificOutput without it is SILENTLY DISCARDED -- runs, exits 0, prints valid JSON, reaches nobody. Two hooks were dead this way for weeks.
set -uo pipefail

# ---------------------------------------------------------------------------
# Read the harness payload. `[ -t 0 ]` so a manual `bash self-check.sh` from a terminal does not
# hang forever on a `cat` with no stdin -- the hook must stay runnable by hand for debugging.
# ---------------------------------------------------------------------------
if [ -t 0 ]; then INPUT=""; else INPUT="$(cat 2>/dev/null || true)"; fi
TRANSCRIPT=""
if [ -n "$INPUT" ] && command -v jq >/dev/null 2>&1; then
    TRANSCRIPT="$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null || true)"
fi

# ---------------------------------------------------------------------------
# THE TABLE, as data -- the ONLY copy. The printed grid is rendered from it below, so the validator
# and the thing it validates against cannot drift apart. A validator carrying its own second copy of
# the cells is how a gate starts confidently passing wrong answers.
# ---------------------------------------------------------------------------
cell_for() { # cell_for <premise> <delib>
    case "$1|$2" in
        "Low|Low")        echo "Sonnet5-Low" ;;
        "Low|Med")        echo "Sonnet5-Medium" ;;
        "Low|High")       echo "Sonnet5-High" ;;
        "Low|Very high")  echo "Sonnet5-XHigh" ;;
        "Med|Low")        echo "Sonnet5-Medium" ;;
        "Med|Med")        echo "Sonnet5-High" ;;
        "Med|High")       echo "Sonnet5-XHigh" ;;
        "Med|Very high")  echo "Opus5-High" ;;
        "High|Low")       echo "Opus5-Medium" ;;
        "High|Med")       echo "Opus5-High" ;;
        "High|High")      echo "Opus5-XHigh" ;;
        "High|Very high") echo "Opus5-Max" ;;
        *) echo "" ;;
    esac
}

# The PRINTED table is rendered from cell_for() rather than written out a second time. Two copies of
# twelve cells is how a validator starts quietly disagreeing with the grid it validates against --
# and this hook exists because a remembered copy of this exact table was wrong twice in one session.
tbl_row() {
    printf '    Premise %-7s| %-15s | %-15s | %-14s | %s\n' \
        "$1" "$(cell_for "$1" Low)" "$(cell_for "$1" Med)" "$(cell_for "$1" High)" "$(cell_for "$1" "Very high")"
}
TABLE="$(printf '%s\n' '                   | Delib Low       | Med             | High           | Very high'; tbl_row Low; tbl_row Med; tbl_row High)"

# The derivation pattern, named once so the hook and self-check.test.sh cannot pin different shapes.
# Deliberately loose on the SEPARATOR (·, x, ×, |, comma, "and") -- pinning one punctuation mark
# would fail a CORRECT answer that used a different bullet, and the axis words plus the cell are what
# carry the meaning. The transcript is JSONL and an assistant message is one physical line, so a
# line-oriented grep reaches inside it without parsing the JSON.
DERIV_RE='Premise[ _-]*(Low|Med|Medium|High)[^A-Za-z]{1,8}Delib(eration)?[ _-]*(Very high|Low|Med|Medium|High)[^A-Za-z]{0,10}(Sonnet5|Opus5)-(Low|Medium|High|XHigh|Max)'

# ---------------------------------------------------------------------------
# Find the most recent derivation in the transcript.
# ---------------------------------------------------------------------------
# A SessionStart hook with matcher `compact|fork` drops this marker; consume it once and force a
# fresh derivation. FORK is why it exists: a fork COPIES the transcript, so the previous session's
# derivation is still greppable and would wrongly suppress the re-recommendation on the one case
# Harkirat named as genuinely wanting a new model pick ("only time i'd switch model mid session is if
# i fork or the actual session drastically pivots", 2026-08-20 12:16 EDT). `compact` is belt-and-
# braces alongside the in-transcript boundary check below -- a session RESUMED from a compact and an
# in-session /compact are different code paths and only the marker covers the first.
# Consume-once, same shape as bot/lifecycle.js's .restart-reason. Fully swallowed: a marker problem
# must never be able to break the prompt.
RESET_MARKER="${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}/.claude/.model-gate-reset"
FORCED=0
if [ -f "$RESET_MARKER" ]; then FORCED=1; rm -f "$RESET_MARKER" 2>/dev/null || true; fi

PREMISE="" ; DELIB="" ; STATED="" ; STALE=0
if [ -n "$TRANSCRIPT" ] && [ -r "$TRANSCRIPT" ]; then
    # One pass yields both the line number and the matched text (grep -o -n prefixes "<line>:").
    # ⚠️ UserPromptSubmit has a 30-SECOND timeout -- a quarter of the 600s most events get -- and a
    # hook that times out is CANCELLED with its additionalContext silently discarded. On a long
    # session this transcript is tens of MB, so every avoidable pass over it is a real risk.
    # ⚠️ THE CORRECTION MESSAGE CARRIES MG-EXAMPLE TOO, and that is not cosmetic. It quotes the stated
# derivation back verbatim, so its own output MATCHES ITS OWN DETECTOR -- the hook's echo lands in the
# transcript and becomes evidence for the next firing, which is the classic "a hook whose block
# message quotes its own detector suppresses itself forever". Found by the completeness sweep
# 2026-08-20 12:58 EDT, one commit after the escape token was introduced for the neighbouring case.
# ⚠️ MG-EXAMPLE -- the per-line escape, added 2026-08-20 12:54 EDT after this gate fired a FALSE
    # POSITIVE on its own self-test within minutes of shipping: self-check.test.sh's fixture strings
    # travel into the SESSION transcript as tool-call text, and the validator read one as a real
    # recommendation. Anything that QUOTES a derivation rather than making one -- test code, this
    # hook's own docs, a message explaining the gate -- carries the marker on that line and is
    # skipped. Same shape and same reason as the timestamp hook's TS-EXAMPLE token, which exists
    # because writing ABOUT a fabricated stamp kept tripping the fabricated-stamp check.
    # ⚠️ The fixture FILES the test points the hook at are unaffected: they are separate .jsonl files
    # whose lines carry no marker, so detection still works there and the tests still mean something.
    # ⚠️ ONE numbered pass, THEN filter, THEN extract. The first version chained `grep -voiE` into
    # `grep -noiE`: combining -v with -o is UNDEFINED (there is no match to print on a non-matching
    # line) and only worked here by luck of this grep's behaviour -- on a grep that honours it
    # literally the filter would emit nothing and the whole gate would silently never fire.
    CAND="$(grep -niE "$DERIV_RE" "$TRANSCRIPT" 2>/dev/null | grep -viE 'MG-EXAMPLE' | tail -1 || true)"
    DERIV_LINE="${CAND%%:*}"
    # A /compact wipes the CONTEXT but not the transcript FILE, so a derivation from before one is
    # still greppable while the session no longer remembers making it. Harkirat, 2026-08-20 12:16 EDT:
    # "I really only need it at the very start, or if a compact was run." Marker verified against the
    # real corpus that same minute -- `"subtype":"compact_boundary"`, 43 occurrences across 120
    # transcripts. Comparing LINE NUMBERS is what makes "after the last compact" a fact rather than a
    # guess: a derivation is only current if it comes AFTER the newest boundary.
    COMPACT_LINE="$(grep -n '"subtype":"compact_boundary"' "$TRANSCRIPT" 2>/dev/null | tail -1 | cut -d: -f1)"
    if [ -n "$CAND" ]; then
        HIT="$(printf '%s' "$CAND" | grep -oiE "$DERIV_RE" | tail -1)"
        PREMISE="$(printf '%s' "$HIT" | grep -oiE 'Premise[ _-]*(Low|Med|Medium|High)' | grep -oiE '(Low|Med|Medium|High)$')"
        DELIB="$(printf '%s' "$HIT" | grep -oiE 'Delib(eration)?[ _-]*(Very high|Low|Med|Medium|High)' | grep -oiE '(Very high|Low|Med|Medium|High)$')"
        STATED="$(printf '%s' "$HIT" | grep -oE '(Sonnet5|Opus5)-(Low|Medium|High|XHigh|Max)$')"
        # Normalise so "Medium" and "Med" are the same axis value, and case never decides a lookup.
        PREMISE="$(printf '%s' "$PREMISE" | tr '[:upper:]' '[:lower:]')"
        DELIB="$(printf '%s' "$DELIB" | tr '[:upper:]' '[:lower:]')"
        case "$PREMISE" in low) PREMISE="Low" ;; med|medium) PREMISE="Med" ;; high) PREMISE="High" ;; esac
        case "$DELIB" in low) DELIB="Low" ;; med|medium) DELIB="Med" ;; high) DELIB="High" ;; "very high") DELIB="Very high" ;; esac
        if [ -n "$COMPACT_LINE" ] && [ "$COMPACT_LINE" -gt "$DERIV_LINE" ] 2>/dev/null; then STALE=1; fi
    fi
fi
EXPECTED="$(cell_for "$PREMISE" "$DELIB")"

# ---------------------------------------------------------------------------
# Blocks. The self-check nudge is unconditional; the model-gate block varies by mode.
# ---------------------------------------------------------------------------
# The FIRST ACTION clause is CONDITIONAL as of 2026-08-20 12:16 EDT. Harkirat: "i'll have some
# sessions literally give me the model recommendation and rename string on nearly every prompt/task
# in a session. I really only need it at the very start, or if a compact was run." Firing an
# unconditional "if you have NOT yet..." on every prompt is precisely what produced that -- the
# reader cannot tell a reminder from a request, so the safe read is to comply again. Once a
# derivation is on record AFTER the newest compact boundary, the clause is replaced by an explicit
# instruction NOT to repeat it.
read -r -d '' FIRST_ACTION <<'EOF' || true
[self-check] (1) FIRST ACTION: if you have NOT yet this session output the ready-to-paste /rename string + a one-line model+effort recommendation, do it now before any task content -- this is a hard gate (feedback_suggest_model_switch memory), not optional. (2) CHAPTERS: if this turn shifted into a new distinct TOPIC since the last mark, call mark_chapter now -- mark finely, one per topic, no cap. (3) JUDGMENT RULES: fix a gap you notice THIS turn rather than deferring/flagging it (working-agreement rule 9), and never assert done/synced/caught-up/matches without running the actual check first (verify before claiming).
EOF

read -r -d '' ALREADY_DONE <<'EOF' || true
[self-check] (1) RENAME + MODEL: already given this session -- do NOT repeat either. Re-state them ONLY if the session drastically pivots or you fork; a mid-session model change is otherwise token waste Harkirat does not want. (2) CHAPTERS: if this turn shifted into a new distinct TOPIC since the last mark, call mark_chapter now -- mark finely, one per topic, no cap. (3) JUDGMENT RULES: fix a gap you notice THIS turn rather than deferring/flagging it (working-agreement rule 9), and never assert done/synced/caught-up/matches without running the actual check first (verify before claiming).
EOF

read -r -d '' GRID <<'EOF' || true
[model-gate] The recommendation is a LOOKUP, and it must be SHOWN AS ONE. Everything that changes an answer is below -- canonical copy is the `reference_priority_tier_system` memory; open it only if something here is unclear.
  !! STATE IT IN THIS SHAPE, or the pick is not checkable and this block keeps firing:
        Premise <Low|Med|High> · Delib <Low|Med|High|Very high> -> <Cell>
     Both axis values, then the cell they imply. A bare cell with a justification ("Opus5-XHigh, this
     is complex work") is exactly the pre-emptive pick this gate exists to stop -- naming the axes is
     what makes a wrong pick visible instead of arguable.
  Axis A - PREMISE RISK (buys JUDGEMENT: noticing a premise is false, a check vacuous, an argument circular):
     Low = facts given and checkable | Med = mostly given, one could be stale | High = the task IS working out whether the framing is right.
  Axis B - DELIBERATION LOAD (buys BREADTH: thoroughness across sites):
     Low = ONE place | Med = several | High = many sites | Very high = must hold the whole system at once.
  !! Axis B is HOW MANY PLACES, never how hard the thinking is, and never whose judgement it is. A session full of hard calls that HARKIRAT makes is not a high-deliberation session.
@@TABLE@@
  !! Sonnet5-Low is effectively RETIRED (Harkirat: "truly VERY minor work" only) -- the practical floor is Sonnet5-Medium.
  !! ONE cell, never a range. If torn, take the LOWER cell and say why in one clause.
  !! Tie-break, answered BEFORE starting: "if I'm wrong, will it be because I missed one of many things, or because I believed something false?" Breadth -> stay Sonnet, raise effort. Premise -> switch to Opus.
  !! OFF-GRID, reachable only by NAMING THE TRIGGER -- never by lookup, and the table above is not complete without them:
     · Sonnet5-Max -- escalating from XHigh when a sweep is genuinely EXHAUSTIVE and a MISS is costly while a misjudgement is not. Usually beaten by WRITING A SCRIPT; say so before reaching for it.
     · Opus5-Low  -- a deliberate DOWNSHIFT: many independent snap judgements, one wrong call costly, nothing to work out (intake triage). If you cannot say that sentence truthfully, it is Sonnet5-Medium.
  !! DO NOT calibrate on Harkirat's past model usage. Measured: `max` and `low` have NEVER been used and `xhigh` exactly once. He built this system so that YOU would choose, so his history is downstream of your advice, not independent evidence of what a task needs.
  !! Escalate on EVENTS, never pre-emptively: two hypotheses wrong -> +1 effort; a premise turned out false, or a silent-failure surface appeared -> Sonnet->Opus at the same effort; scope turned out mechanical -> STEP DOWN.
EOF
# Bash 3.2-safe placeholder substitution -- the heredoc stays single-quoted so nothing inside it is
# subject to expansion, and only this one marker is replaced.
GRID="${GRID/@@TABLE@@/$TABLE}"

read -r -d '' SHORT <<'EOF' || true
[model-gate] Derivation on record for this session -- grid withheld to stop re-paying for a decision already made. Still live:
  !! Escalate on EVENTS, never pre-emptively: two hypotheses wrong -> +1 effort; a premise turned out false, or a silent-failure surface appeared -> Sonnet->Opus at the same effort; scope turned out mechanical -> STEP DOWN. Re-derive in the `Premise · Delib -> Cell` shape whenever you move.
  !! Off-grid, only by naming the trigger: Sonnet5-Max (exhaustive sweep, a MISS costly, a misjudgement not -- usually beaten by writing a script) · Opus5-Low (downshift: many independent snap judgements, one wrong call costly, nothing to work out).
EOF

# ---------------------------------------------------------------------------
# Mode selection. Fail-open to the full grid: showing it needlessly costs tokens, hiding it costs a
# wrong model for an entire session.
# ---------------------------------------------------------------------------
CURRENT=0
if [ -n "$STATED" ] && [ -n "$EXPECTED" ] && [ "$STALE" -eq 0 ] && [ "$FORCED" -eq 0 ]; then CURRENT=1; fi
SELFCHECK="$FIRST_ACTION"
[ "$CURRENT" -eq 1 ] && SELFCHECK="$ALREADY_DONE"

if [ "$CURRENT" -eq 1 ] && [ "$STATED" != "$EXPECTED" ]; then
    MODEL_BLOCK="$(printf '%s\n' \
"[model-gate] 🔴 THE STATED DERIVATION DOES NOT MATCH THE TABLE." \
"  You wrote: Premise ${PREMISE} · Delib ${DELIB} -> ${STATED}   MG-EXAMPLE" \
"  The table says that pair is: ${EXPECTED}" \
"  One of the two is wrong and BOTH are cheap to fix. Either the axis values were misjudged -- re-read" \
"  them below and re-derive -- or the cell was picked first and the axes written to fit it, which is" \
"  the pre-emptive pick this gate exists to catch. Correct it in your next message before doing more" \
"  work under a model nobody derived." \
"" \
"$GRID")"
elif [ "$CURRENT" -eq 1 ]; then
    MODEL_BLOCK="$SHORT"
elif [ "$FORCED" -eq 1 ]; then
    MODEL_BLOCK="$(printf '%s\n\n%s' "[model-gate] This session started from a FORK or a COMPACT. Re-state the rename string and re-derive the model ONCE, now -- a fork inherits the old transcript, so the previous derivation is still on disk but was made for different work. Then go quiet on it again." "$GRID")"
elif [ "$STALE" -eq 1 ]; then
    # A compact landed after the derivation. The context that held it is gone, so re-derive rather
    # than carry a number nobody in the current window can justify.
    MODEL_BLOCK="$(printf '%s\n\n%s' "[model-gate] A /compact ran after the last derivation -- the reasoning behind it is no longer in context. Re-state the rename string and re-derive the model ONCE, now, then go quiet on it again." "$GRID")"
else
    MODEL_BLOCK="$GRID"
fi

CONTEXT="$(printf '%s\n\n%s' "$SELFCHECK" "$MODEL_BLOCK")"

jq -n --arg ctx "$CONTEXT" \
  '{hookSpecificOutput:{hookEventName:"UserPromptSubmit", additionalContext:$ctx}}'
