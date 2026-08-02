#!/bin/bash
# timestamp-check.sh — argv[1] selects the mode:
#   pre   → PreToolUse  on Edit|Write. DENIES an impossible (future) timestamp before it is written.
#   post  → PostToolUse on Edit|Write. Advisory only: bare dates missing their HH:MM.
# Default is `post`, so an un-argumented call behaves as it did before the split.
#
# WHY IT WAS REPLACED THE FIRST TIME (2026-08-02 15:02 EDT)
# The original inline version was LINE-based, so a date-prefixed filename (`2026-08-02-protocol.md`)
# and a CLI date argument (`--from 2026-08-02`) both fired. A gate that is usually wrong trains you
# to dismiss it. Worse, it asserted a time was PRESENT, never PLAUSIBLE: on 2026-08-02 a single
# `date` call at 12:57 was followed by 30 invented stamps drifting to 19:30 (TS-EXAMPLE), all well-formed, all
# passed. The format was right and the data was fiction.
#
# WHY IT CHANGED AGAIN (2026-08-02 16:47 EDT) — three defects found by using it, in one session:
#
#  1. IT FIRED TOO LATE TO PREVENT ANYTHING. It was PostToolUse only, so the invented stamp was
#     already on disk and correcting it cost a second `date` plus a second Edit. The content is
#     sitting in `tool_input.new_string` at PreToolUse — it can simply be refused. This is the same
#     wrong-moment defect PR #67 fixed for the release checks and never swept for anywhere else.
#
#  2. IT ONLY EVER CHECKED **TODAY**. Both branches were anchored to `$(date +%Y-%m-%d)`, so a
#     stamp dated TOMORROW — `2026-08-03 09:00` (TS-EXAMPLE) — matched neither and sailed through. The whole
#     point is catching times that cannot have been observed, and a future date is the purest case.
#     Now every `YYYY-MM-DD HH:MM` in the content is compared against now. ISO-8601 sorts
#     lexicographically, so this is a plain string comparison with no date arithmetic to get wrong.
#
#  3. BACKTICKS EXEMPTED THE CHECK THAT MATTERS. Backticked spans were stripped before BOTH
#     branches, so `` `2026-08-02 19:30 EDT` `` (TS-EXAMPLE) was invisible — and changelog and devlog entries
#     are full of backticks, which is exactly where the 30 fabricated stamps landed. Stripping is
#     now scoped to the BARE-DATE branch, where it exists to kill false positives. A future
#     timestamp is never legitimate, in any markup.
#
#  4. A TIMESTAMP WRAPPED ACROSS A LINE BREAK read as a bare date. Writing
#     `... shipped 2026-08-02` / `# 01:30 EDT ...` in a wrapped comment fired the bare-date branch
#     even though the time is right there. Found by this hook false-positiving on the very commit
#     that was fixing it. Dates and times are now rejoined across a newline and any comment
#     leader before either branch runs.
#
# A future DATE with no clock time is deliberately ALLOWED: that is how a real deadline is written,
# and the deny message says so. Only date+time in the future is treated as impossible.
#
# ⚠️ THE ESCAPE, AND WHY IT HAD TO EXIST. The first `pre` build denied its own documentation: this
# very file quotes fabricated stamps as EXAMPLES, and a deny cannot distinguish an example from an
# assertion. Anything that writes about timestamps — this hook, its test, the memory files, the
# DEVLOG entry explaining the incident — hits it. So a line carrying the literal token
# `TS-EXAMPLE` is exempt from the impossible check.
#
# It is a per-LINE, explicitly-typed token on purpose. A file-level switch would be flipped once
# and then silently cover every later edit to that file; `e.g.`-sniffing would be guessable by
# accident. This has to be typed next to the stamp, shows up in the diff, and greps in one command
# (`rg TS-EXAMPLE`) if it is ever suspected of hiding a real fabrication.

mode="${1:-post}"

content=$(jq -r '.tool_input.new_string // .tool_input.content // empty')
[ -z "$content" ] && exit 0

today=$(date +%Y-%m-%d)
now="$(date '+%Y-%m-%d %H:%M')"

# Rejoin a timestamp split across a line break, optionally through a comment leader (`#`, `//`,
# `*`) — see defect 4. Without this, wrapped prose reads as a bare date.
joined=$(printf '%s' "$content" | perl -0pe 's/(\d{4}-\d{2}-\d{2})[ \t]*\n[ \t]*(?:#+|\/\/|\*)?[ \t]*(\d{2}:\d{2})/$1 $2/g' 2>/dev/null) || joined="$content"
[ -z "$joined" ] && joined="$content"

# --- (A) IMPOSSIBLE: a date-time later than now was not observed. NOT backtick-exempt. ----------
# ⚠️ FOREIGN TIMEZONES ARE NOT COMPARABLE — added 2026-08-02 17:21 EDT, when this gate denied a
# perfectly good UTC stamp (TS-EXAMPLE: `2026-08-02 20:05 UTC`, which is 16:05 local, comfortably
# past) while writing the CLAUDE.md paragraph about CI. GitHub API times are UTC, so that is not a
# rare shape in this repo.
#
# Comparing a stamp in another zone against the LOCAL clock is meaningless without conversion, and
# converting inside a hook invites a subtler class of bug. So a stamp carrying an explicit timezone
# that is not the local one is skipped — out of scope, rather than guessed at. Anything with no zone,
# or with the local zone, is still compared, which covers every stamp the records convention actually
# asks for (`YYYY-MM-DD HH:MM TZ`, local).
localtz=$(date '+%Z')
# ⚠️ `TS-DEADLINE` — the second escape, added 2026-08-02 18:20 EDT because this gate denied a real
# one. The deny message says "if you mean a future deadline, write the date with NO clock time", and
# that advice is simply wrong for scheduled events: `docs/db-deferred-list.md` carries a reminder
# reading "⏰ 2026-08-09 17:00 EDT — CLOSE OUT the MCP observation window" (TS-EXAMPLE), where the
# clock time IS the content — the window closes at an hour, not on a day. Merely editing NEAR that
# line was refused, which is a gate blocking correct work.
#
# Kept as a separate token from TS-EXAMPLE rather than folded into it: they mean different things,
# and a reviewer grepping `rg TS-EXAMPLE` to audit for hidden fabrications should not have to wade
# through scheduled deadlines. Both are per-line and must be typed deliberately.
future=$(printf '%s' "$joined" \
  | grep -v 'TS-EXAMPLE' \
  | grep -v 'TS-DEADLINE' \
  | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}( [A-Z]{2,5})?' \
  | while read -r d hm tz; do
      [ -n "$tz" ] && [ "$tz" != "$localtz" ] && continue
      [ "$d $hm" \> "$now" ] && echo "$d $hm"
    done \
  | sort -u | tr '\n' ' ')

if [ -n "$future" ]; then
  msg="IMPOSSIBLE TIMESTAMP — this write contains ${future}but the clock reads ${now}. A time later than now cannot have been observed, so it was invented. On 2026-08-02 exactly this put 30 fabricated stamps into docs, memory, a released CHANGELOG and a git tag, every one of them well-formed. Run \`date\` and use what it returns. If you mean a genuine FUTURE deadline, write the date with NO clock time (that form is deliberately allowed), or say plainly that it is a target."
  if [ "$mode" = "pre" ]; then
    jq -n --arg r "$msg" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
    exit 0
  fi
fi

# `pre` mode judges only the objective check. The bare-date branch has a false-positive history and
# must never be able to block a write — noise that blocks is how a gate gets switched off.
[ "$mode" = "pre" ] && exit 0

findings=""
[ -n "$future" ] && findings="
  🚨 $msg"

# --- (B) BARE DATE: advisory, and the only branch that strips known-legitimate shapes ------------
#
# ⚠️ NARROWED 2026-08-02 18:39 EDT — it was firing far more often than it was right, and Harkirat
# called it: "it's triggered way too many false positives."
#
# MEASURED, not guessed. Corpus: every line added to `main` today carrying today's date, with
# `public/` excluded (generated HTML, which never reaches this hook) — 164 lines.
#   · old rule: 22 fires, 4 genuine → **18% precision**
#   · new rule:  4 fires, 4 genuine → **100% precision**, 18 suppressed, 0 real misses
# Both numbers come from running the two hook versions over that corpus, not from a model of them.
# A gate that is wrong four times in five trains you to scroll past it — which is exactly how the
# fabricated-timestamp miss got waved through 30 times, the failure this file was written for.
#
# WHAT THE RULE NOW IS. Rule 10 wants a time on a *record stamp* — the `(added …)` / `PATH UPDATED
# …:` / changelog-heading shapes. It never wanted one on ordinary English that names a day. Two
# discriminators separate them, both derived from the corpus rather than imagined:
# (⚠️ note those examples carry no literal date: a quoted span is stripped per LINE, so an example
#  quote that WRAPPED across a newline survived the strip and fired this very check on itself.)
#   1. PROSE — a preposition, article or conjunction directly before the date: "on 2026-08-02",
#      "from 2026-08-02", "a 2026-08-02 session", "three times on 2026-08-02". This alone accounts
#      for most of the 18 suppressions. A record stamp never reads that way.
#   2. RANGE ENDPOINT — an arrow or dash on either side ("2026-07-24 → 2026-08-02"). A bound is a
#      date, not a moment; a clock time there would be wrong, not merely verbose.
# Double-quoted spans are stripped alongside backticks — the same trick the deferral-tell hook uses.
# A date inside a string literal is data, not a record.
#
# Order matters: filenames first (date followed by '-'), then flag arguments, then quoted spans.
clean=$(printf '%s' "$joined" \
  | sed -E "s/${today}-[A-Za-z0-9._-]+//g" \
  | sed -E "s/--[a-z-]+[= ]${today}//g" \
  | sed -E "s/\`[^\`]*\`//g" \
  | sed -E 's/"[^"]*"//g')
# OCCURRENCE-based, not line-based: strip every well-formed stamp FIRST, so a line carrying one good
# timestamp can still be reported for a bare date beside it. Only then judge what survives, line by
# line — because "which word precedes the date" is a question about a line.
PROSE_LEAD='(on|in|at|by|since|from|until|to|after|before|a|an|the|of|during|around|through|between|and|this|that|its|dated)'
bare=$(printf '%s' "$clean" | sed -E "s/${today} [0-9]{2}:[0-9]{2}//g" | grep -F "$today" \
  | grep -viE "(^|[^A-Za-z])${PROSE_LEAD}[[:space:]]+${today}" \
  | grep -vE "(→|–|—|\.\.|->)[[:space:]]*${today}|${today}[[:space:]]*(→|–|—|\.\.|->)")
if [ -n "$bare" ]; then
  findings="${findings}
  ⏱️ BARE DATE — today's date appears with no HH:MM TZ beside it. Working-agreement rule 10: dated
     content in docs, memory, DEVLOG, changelogs, notes marks and code comments carries
     YYYY-MM-DD HH:MM TZ. Filenames, \`--flag DATE\` arguments, backticked spans and timestamps
     wrapped across a line break are all stripped before this check, so this is prose. Add the
     time, or confirm it is a deliberate bare date (a historical reference, or the player-facing
     summary)."
fi

[ -z "$findings" ] && exit 0
printf 'TIMESTAMP CHECK%s' "$findings" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
