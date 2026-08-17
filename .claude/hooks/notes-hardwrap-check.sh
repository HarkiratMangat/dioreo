#!/bin/bash
# notes-hardwrap-check.sh — PostToolUse (Edit|Write) gate.
#
# WHY THIS EXISTS. `docs/ideas/diors-notes.md` carries a rule in its own legend: do NOT hard-break prose inside an HTML comment, because MarkEdit soft-wraps and manual breaks make the rendered text jump mid-sentence. Harkirat has now corrected me on this THREE separate times (2026-07-18 when the rule was created, again in a later pass, and again 2026-07-29 18:24 EDT with specific line numbers). Prose rules that get violated three times are not rules, they are wishes — the standing strategy in memory `reference_enforcement_hooks` is that a checkable rule becomes a machine gate. This is that gate. It exists because I could not be trusted to remember.
#
# WHAT IT CHECKS. Only edits to the notes file, and only the text being written. An HTML comment whose `<!--` and `-->` sit on different physical lines is reported. That is the exact shape of the violation: one logical paragraph split across several source lines.
#
# ITS FAILURE MODE, STATED (per the rule that every guard must declare one). It is advisory and never blocks — a false positive must not be able to stop work. It inspects only the incoming string, not the file on disk, so it cannot see a violation that was already committed; the audit script covers the tree, this covers the keystroke. A genuinely multi-line comment containing a real bulleted list IS legitimate (Harkirat's own carve-out), so bullet-only line breaks are not reported, and anything it does report still needs a human judgement rather than a reflex reformat.

set -uo pipefail

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

case "$file" in
    # Matches the basename, so it holds wherever the file sits in the tree. Renamed from "diors-builds notes.md" when the file moved to docs/ideas/ (2026-08-06 07:58 EDT).
    *"diors-notes.md") ;;
    *) exit 0 ;;
esac

content=$(printf '%s' "$input" | jq -r '.tool_input.new_string // .tool_input.content // empty')
[ -z "$content" ] && exit 0

# Find comments that open on one line and close on another. Continuation lines that are pure list items (leading "-" or "*" or "(N)" bullets) are Harkirat's explicit exception and don't count.
offenders=$(printf '%s' "$content" | awk '
    /<!--/ && !/-->/ { inc = 1; start = NR; prose = 0; next }
    inc {
        line = $0
        isClose = (line ~ /-->/)
        # The closing delimiter is not prose. Keeping only what precedes it also means a comment that
        # ends mid-sentence ("...text -->") is still correctly counted, while a bare "  -->" on its own
        # line is not. Missing this made the bulleted-list exception fire on its own closing line.
        if (isClose) sub(/-->.*/, "", line)
        sub(/^[ \t]+/, "", line)
        sub(/[ \t]+$/, "", line)
        # a real bulleted continuation is allowed; prose continuation is not
        if (line !~ /^([-*+]|[0-9]+\.)[ \t]/ && line != "") prose++
        if (isClose) {
            if (prose > 0) print "  line " start ": comment spans " (NR - start + 1) " physical lines (" prose " prose continuation line(s))"
            inc = 0
        }
    }
')

if [ -n "$offenders" ]; then
    jq -n --arg o "$offenders" '{
        hookSpecificOutput: {
            hookEventName: "PostToolUse",
            additionalContext: (
                "NOTES HARD-WRAP CHECK: this edit hard-broke prose inside an HTML comment in `docs/ideas/diors-notes.md`:\n"
                + $o
                + "\n\nThat file'"'"'s own legend forbids it — MarkEdit soft-wraps, so manual breaks make the rendered sentence jump mid-line. Harkirat has corrected this THREE times; it is why this hook exists. Rewrite each flagged comment as ONE continuous physical line. A real bulleted list inside a comment is the one allowed exception (one bullet per line) and is not flagged here."
            )
        }
    }'
fi

exit 0
