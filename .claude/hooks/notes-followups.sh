#!/usr/bin/env bash
# notes-followups.sh — surface UNRESOLVED ※ follow-up exchanges in the notes scratchpad.
#
# WHY THIS EXISTS (2026-08-06 10:16 EDT, Harkirat, verbatim):
#   "I put that follow up there around 4-5 sessions ago. Each session claimed to have read the notes
#    file but not a single one mentioned my follow-up."
#
# He was right, and the cause was structural, not inattention. His follow-up sat at line 107 and was
# invisible to everything, THREE ways at once:
#   1. The SessionStart open-items scan runs strictly between `## Questions` and `## 📍`. The
#      follow-up is BELOW `## 📍` — outside the scan window by design.
#   2. That scan only counts `- [ ]`-shaped list items. This was inline prose inside an italic note.
#   3. NO hook in this directory matched `※` or `∴` at all. Not a weak matcher — a missing one.
# Three independent misses stacked, so "I read the notes file" was true every time and still useless.
#
# ⚠️ ANSWERED IS NOT RESOLVED — the specific trap that produced the five-session miss. That follow-up
# HAD a `∴` reply. The reply ended "Say the word and I'll rework the hook..." — an open question back
# to Harkirat that nobody ever put in front of him. A gate that only reports UNANSWERED marks would
# have stayed silent on the exact case it exists for, which is why the open-offer patterns below
# matter as much as the missing-reply check.
#
# Scans the WHOLE FILE deliberately — no section bounds. Bounded scanning is what hid this.
#
# Cost: one pass over a ~130-line file. Negligible; it runs at SessionStart, once.
#
# Failure mode, stated: "does this reply still need Harkirat?" is read from wording, so a reply
# phrased as an offer without any listed cue reads as resolved. Widen the cue list when one is
# missed — do not narrow it, since a false surface costs one line and a false silence costs sessions.

set -uo pipefail
f="${1:?usage: notes-followups.sh <path-to-notes.md>}"
[ -f "$f" ] || exit 0

# An exchange is closed when it is struck through (~~...~~) or checked ([x]) — the file's own
# conventions for "this is done" — mirrored here rather than invented.
awk -v today="$(date +%s)" '
  /※/ {
    line = $0
    # closed by the conventions the notes file itself uses for done
    # (no apostrophes anywhere inside this awk block: it is single-quoted, and one apostrophe
    #  terminates the shell string. shellcheck SC1011 caught exactly that here, pre-commit.)
    if (line ~ /~~/ || line ~ /\[x\]/) next
    has_reply = (line ~ /∴/)
    # ⚠️ TEST THE CUES AGAINST THE REPLY ONLY, never the whole line. Harkirat writes his follow-ups
    # as questions, so a whole-line test matched the `?` in HIS text and surfaced every answered
    # exchange — a gate firing on everything, which is how a gate gets ignored. Caught by this
    # scripts own self-test on its first run, 2026-08-06 10:19 EDT.
    # split() on the mark avoids index() arithmetic, which is unsafe here: the marks are multi-byte.
    # ⚠️ THE LAST REPLY DECIDES, not the first. An exchange can carry several ∴ replies over time,
    # and taking seg[2] read the OLDEST one — so an exchange whose first reply said "say the word"
    # stayed flagged forever even after a later reply resolved it. Found 2026-08-06 10:22 EDT by
    # resolving this hook OWN motivating follow-up and watching it refuse to go quiet.
    nparts = split(line, seg, /∴/)
    reply = (nparts > 1) ? seg[nparts] : ""
    open_offer = (reply ~ /[Ss]ay the word|[Ll]et me know|[Yy]our call|[Ww]ant me to|[Ss]hall I|[Ww]ould you (like|prefer)|which (one|do you)|\?/)
    if (has_reply && !open_offer) next               # answered and nothing outstanding
    # Extract the follow-up date for an age readout: ※ [YYYY-MM-DD HH:MM TZ]
    d = ""
    # ⚠️ Match the DATE itself, not an offset from the ※. That mark is multi-byte, so RSTART+n
    # slices mid-character and printed "[[2026-08-0" on the first live run. The first date on a
    # follow-up line is always its own timestamp.
    # (And no apostrophes here either — I broke this block a second time, five minutes after
    #  writing the warning above. shellcheck caught both; a prose reminder caught neither.)
    if (match(line, /[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/)) d = substr(line, RSTART, 10)
    state = has_reply ? "ANSWERED but still asks something of you" : "NEVER ANSWERED"
    # Trim to a readable preview; the whole point is to name it, not reproduce it.
    prev = line
    sub(/^[[:space:]]*/, "", prev)
    if (length(prev) > 200) prev = substr(prev, 1, 200) "..."
    printf "  · line %d [%s] %s\n    %s\n", NR, d, state, prev
  }
' "$f"
