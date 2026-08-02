#!/bin/bash
# outstanding-not-filed.sh — Stop hook. Blocks when I NAME an outstanding item and never FILE it.
#
# WHY THIS EXISTS
# 2026-08-02 14:59 EDT: I closed FIVE consecutive messages with "still outstanding: the linksee distill
# queue" and never wrote it into any list. Harkirat had to ask. One `rg` returned zero hits across
# db-deferred-list.md, meta-deferred-list.md and the notes file.
#
# The rule already existed — "a limitation that lives only in a chat message is indistinguishable from
# one nobody noticed" — and I had CITED it earlier in that same session while filing a different item.
# Prose did not hold it. On this repo prose never has, which is the whole doctrine behind
# reference_enforcement_hooks: a checkable rule becomes a hook.
#
# THE MECHANISM: repetition felt like recording. Each mention discharged the urge to file without
# producing an artifact — so saying it MORE made filing LESS likely. A gate is the right shape here
# precisely because the failure is invisible from the inside.
#
# WHAT IT CANNOT DO: it proves a list was TOUCHED, never that the right thing was written in it.
# Judgement stays mine. Said plainly here so a pass is not read as more than it is.

input=$(cat)
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0
tp=$(printf '%s' "$input" | jq -r '.transcript_path // empty')
[ -f "$tp" ] || exit 0

# Turn start = the last real user prompt. Plain-string content distinguishes a typed prompt from a
# tool_result, which is also "type":"user" — the same anchor the completion-claim hook uses.
ln=$(grep -n '"role":"user","content":"' "$tp" | tail -1 | cut -d: -f1); ln=${ln:-1}

# Did I touch a tracking list THIS turn? Edit/Write tool_use carries file_path.
filed=$(tail -n +"$ln" "$tp" | grep -cE '"file_path":"[^"]*(db-deferred-list\.md|meta-deferred-list\.md|diors-builds notes\.md|resolved-list\.md|graveyard\.md)"')

# My final message. Strip quoted spans and backticked code first: quoting the offending phrase back
# while EXPLAINING it is not a new instance — the deferral-tell hook learned that the hard way.
last=$(tail -n +"$ln" "$tp" | grep '"type":"assistant"' | tail -6 \
  | jq -r '.message.content[]? | select(.type=="text") | .text' 2>/dev/null \
  | sed -E 's/"[^"]*"//g; s/`[^`]*`//g')

# Already-filed language means the item HAS a home and I am merely reporting it. Not a violation.
# The escape must cover how already-filed status is ACTUALLY phrased, not how I imagined it. It fired
# on a summary saying "filed with direction" and "deferred with a full note" — both unambiguously
# already-filed, neither matched. Widened 2026-08-02 15:55 EDT, but deliberately NOT to bare "file
# it" / "I'll file": those are intentions, and letting an intention pass is the whole failure.
if printf '%s' "$last" | grep -qiE 'filed (as|in|under|it|with|to)|already filed|added (it )?to the (db-|meta-)?deferred|in the deferred list|see .{0,20}deferred|deferred with a|db-deferred-list|meta-deferred-list'; then exit 0; fi

TELL='still (outstanding|open|pending|unresolved|untouched|not done|left)|remains? (outstanding|open|unresolved|undone)|^[[:space:]]*outstanding:|not (yet )?(filed|recorded|tracked|logged)|deliberately (left|leaving|skipped)|(left|leaving) (it )?(untouched|undone|unaddressed|for (a )?(later|future))|for a (future|later|dedicated) session|next session can'

if printf '%s' "$last" | grep -qiE "$TELL" && [ "${filed:-0}" -eq 0 ]; then
  jq -n '{decision:"block",reason:"OUTSTANDING ITEM NAMED BUT NOT FILED — your last message flags something as still outstanding / left for later / for a future session, and this turn did NOT touch docs/db-deferred-list.md, the meta-deferred-list, the notes file, or an archive list.\n\nThis is the exact failure of 2026-08-02: five consecutive messages ended with \"still outstanding: the linksee distill queue\" and it was never filed — Harkirat had to ask. Repetition FEELS like recording; it is not. A limitation that lives only in a chat message is indistinguishable from one nobody noticed.\n\nFile it NOW, in this turn, with a direction someone could act on — priority/effort tag, what to do, and how to verify. Then say so. If it genuinely needs no file (already tracked elsewhere, or resolved this turn), say WHERE it lives and this gate will pass.\n\nA gate proves a list was opened, never that the right thing was written in it — that judgement is still yours."}'
  exit 0
fi
exit 0
