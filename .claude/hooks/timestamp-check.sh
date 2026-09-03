#!/bin/bash
# timestamp-check.sh — argv[1] selects the mode:
#   pre   → PreToolUse  on Edit|Write. DENIES an impossible (future) timestamp before it is written.
#   post  → PostToolUse on Edit|Write. Advisory only: bare dates missing their HH:MM.
# Default is `post`, so an un-argumented call behaves as it did before the split.
#
# WHY IT WAS REPLACED THE FIRST TIME (2026-08-02 15:02 EDT) The original inline version was LINE-based, so a date-prefixed filename (`2026-08-02-protocol.md`) and a CLI date argument (`--from 2026-08-02`) both fired. A gate that is usually wrong trains you to dismiss it. Worse, it asserted a time was PRESENT, never PLAUSIBLE: on 2026-08-02 a single `date` call at 12:57 was followed by 30 invented stamps drifting to 19:30 (TS-EXAMPLE), all well-formed, all passed. The format was right and the data was fiction.
#
# WHY IT CHANGED AGAIN (2026-08-02 16:47 EDT) — three defects found by using it, in one session:
#
#  1. IT FIRED TOO LATE TO PREVENT ANYTHING. It was PostToolUse only, so the invented stamp was already on disk and correcting it cost a second `date` plus a second Edit. The content is sitting in `tool_input.new_string` at PreToolUse — it can simply be refused. This is the same wrong-moment defect PR #67 fixed for the release checks and never swept for anywhere else.
#
#  2. IT ONLY EVER CHECKED **TODAY**. Both branches were anchored to `$(date +%Y-%m-%d)`, so a stamp dated TOMORROW — `2026-08-03 09:00` (TS-EXAMPLE) — matched neither and sailed through. The whole point is catching times that cannot have been observed, and a future date is the purest case. Now every `YYYY-MM-DD HH:MM` in the content is compared against now. ISO-8601 sorts lexicographically, so this is a plain string comparison with no date arithmetic to get wrong.
#
#  3. BACKTICKS EXEMPTED THE CHECK THAT MATTERS. Backticked spans were stripped before BOTH branches, so `` `2026-08-02 19:30 EDT` `` (TS-EXAMPLE) was invisible — and changelog and devlog entries are full of backticks, which is exactly where the 30 fabricated stamps landed. Stripping is now scoped to the BARE-DATE branch, where it exists to kill false positives. A future timestamp is never legitimate, in any markup.
#
#  4. A TIMESTAMP WRAPPED ACROSS A LINE BREAK read as a bare date. Writing `... shipped 2026-08-02` / `# 01:30 EDT ...` in a wrapped comment fired the bare-date branch even though the time is right there. Found by this hook false-positiving on the very commit that was fixing it. Dates and times are now rejoined across a newline and any comment leader before either branch runs.
#
# A future DATE with no clock time is deliberately ALLOWED: that is how a real deadline is written, and the deny message says so. Only date+time in the future is treated as impossible.
#
# ⚠️ THE ESCAPE, AND WHY IT HAD TO EXIST. The first `pre` build denied its own documentation: this very file quotes fabricated stamps as EXAMPLES, and a deny cannot distinguish an example from an assertion. Anything that writes about timestamps — this hook, its test, the memory files, the DEVLOG entry explaining the incident — hits it. So a line carrying the literal token `TS-EXAMPLE` is exempt from the impossible check.
#
# It is a per-LINE, explicitly-typed token on purpose. A file-level switch would be flipped once and then silently cover every later edit to that file; `e.g.`-sniffing would be guessable by accident. This has to be typed next to the stamp, shows up in the diff, and greps in one command (`rg TS-EXAMPLE`) if it is ever suspected of hiding a real fabrication.

# WHY IT CHANGED AGAIN (2026-08-06 21:59 EDT) — a correct stamp was denied twice in one day. Filed 2026-08-03 10:35 EDT from the morph-PoC session, then hit for real again 2026-08-06: the clock is read once at the START of a turn (the `[clock]` hook message), and the bytes land a minute or two later after intervening tool calls and model latency. `[ "$d $hm" \> "$now" ]` was a zero-tolerance lexicographic compare, so a write carrying `10:33` while `$now` still read `10:32` was denied as "invented" — it wasn't; it was normal turn latency. A gate that fires on its own latency is exactly the kind that gets routed around, per this file's own reasoning about the bare-date branch below.
#
# FIX: compare epoch seconds with a small grace window (TOLERANCE_SECS, 3 min) instead of raw strings. This still catches the incident the gate exists for — 30 stamps drifting 4.5 HOURS into the future — while no longer denying single-digit-minute drift from ordinary turn latency. `date -j -f` is BSD/macOS date syntax (this project's own dev environment is Darwin); a stamp that fails to parse is skipped rather than guessed at, same "out of scope, not guessed at" stance already taken for foreign timezones below.

# WHY IT CHANGED AGAIN (2026-08-03 18:12 EDT) — a placeholder time slipped past every existing check. Wrote `2026-08-03 18:xx EDT` mid-comment (genuinely meaning to fill in the real minute later and then forgetting to), in the SAME session that had already been corrected once for a bare date with no time at all. The bare-date branch (B) only strips a stamp when its HH:MM is real digits (`s/${today} [0-9]{2}:[0-9]{2}//g`); `18:xx` doesn't match that, so the date survived the strip and the advisory DID fire correctly — but advisory-after-the-fact is what this file's own comments already call "a backstop for the rare miss, NOT the mechanism": it caught the mistake one edit too late instead of stopping it. Unlike an ordinary bare date (sometimes legitimate prose), a placeholder character sitting inside an HH:MM-shaped slot is never legitimate content — nobody means to publish literal "xx" or "??" as a time. That asymmetry is exactly what a bare-date advisory can't have (its whole design constraint is "must never be able to block a write," given its false-positive history) but a narrow, high-confidence pattern like this one can: DENY it in `pre`, same tier as an impossible future stamp, so the placeholder never reaches disk in the first place.

# 🔴 THE `pre` BRANCH NOW RUNS ON Bash TOO — registered Edit|Write|Bash as of 2026-09-02 11:42 EDT. It read `.tool_input.command` from the day it was written and the autofix rewrites every string in `.tool_input`, so the ONLY thing standing between the substitution and a heredoc was the matcher. Meanwhile PostToolUse already carried Bash, so the repo was DETECTING placeholder stamps in heredocs and choosing not to fix them — the four that reached a tracked plan on 2026-09-01 all came through that gap.
#
# ⚠️ THE STATED REASON FOR NOT DOING THIS WAS FALSE, and it was disproven by execution rather than argument. Root CLAUDE.md says the hook is "deliberately not registered PreToolUse on Bash (rewriting a shell command mangles it)". Piping a synthetic payload into the globally-registered `rtk hook claude` returns `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecisionReason":"RTK auto-rewrite","updatedInput":{"command":"rtk git status",...}}}` — every Bash call on this machine has had its command rewritten via updatedInput for months. A constraint with a working counter-example one hook above it in the same config was a belief, not a limit.
#
# ⚠️ TWO PreToolUse HOOKS NOW RETURN updatedInput FOR THE SAME Bash CALL (rtk's rewrite and this substitution) and the documented precedence covers DECISIONS (deny > defer > ask > allow), not competing inputs. If rtk wins, a placeholder survives — which is exactly today's behaviour, so the failure direction is a no-op rather than a regression. If this wins, the command loses its `rtk` prefix and costs tokens, never correctness. Neither outcome can corrupt a command: the substitution only ever replaces a `YYYY-MM-DD HH:MM`-shaped slot whose minute is x/X/?, and the `still` guard below re-scans the result and falls back to a deny if any placeholder survives.
#
# ⚠️ `permissionDecision:"allow"` here does NOT hand a Bash command a free pass: the docs are explicit that deny and ask permission rules are still evaluated regardless of what a hook returns. It skips the prompt for a command the permission layer would already have allowed.
mode="${1:-post}"

payload=$(cat)
# 🔴 `.command` IS READ BECAUSE THE BATCHING CONTRACT MANDATES `python3` HEREDOCS, AND EVERY ONE OF THEM WAS INVISIBLE HERE. This hook was registered on Edit|Write only, so a file written by a heredoc inside a Bash call never reached it -- and on 2026-09-01 four placeholder stamps landed in a tracked plan that way, in the same session that built the substitution branch below. The technique this repo tells you to use for any multi-file edit was the one path the guard did not cover.
content=$(printf '%s' "$payload" | jq -r '.tool_input.new_string // .tool_input.content // .tool_input.command // empty')
[ -z "$content" ] && exit 0

# 🔴 THE CLOCK IS PINNED TO THE REPO'S TIMEZONE — added 2026-09-02 21:56 EDT, after this gate's own safety suite went red on CI and green here for the third environment-dependent reason in one session. Every timestamp this repo writes is defined in Eastern (`CLAUDE.md`, the records convention, the `[clock]` hook that feeds them), so "today" is a fact about New York, not about whatever clock the machine happens to keep. Unpinned, `date` read UTC on the runner: between 20:00 and midnight Eastern the hook's `today` was tomorrow's date, it matched none of the placeholders the suite writes, and it silently corrected nothing — the exact silent-no-op the suite exists to catch, produced by the suite's own environment rather than by a defect in the hook.
#
# This is the same shape as the BSD/GNU `date` failure recorded above (46 of 47 assertions red in CI, all 47 green on this Mac), one layer up: there the date BINARY differed, here the date ZONE does. Pinning also fixes `localtz` below, which decides whether a stamp carrying an explicit zone is comparable at all — on a UTC runner it read `UTC`, so every `EDT` stamp in the repo was skipped as foreign and branch (A) went quiet exactly where it matters most.
#
# `TS_TZ` overrides it, so the pin is testable rather than an assumption baked in.
export TZ="${TS_TZ:-America/New_York}"

today=$(date +%Y-%m-%d)
now="$(date '+%Y-%m-%d %H:%M')"

# Rejoin a timestamp split across a line break, optionally through a comment leader (`#`, `//`, `*`) — see defect 4. Without this, wrapped prose reads as a bare date.
joined=$(printf '%s' "$content" | perl -0pe 's/(\d{4}-\d{2}-\d{2})[ \t]*\n[ \t]*(?:#+|\/\/|\*)?[ \t]*(\d{2}:\d{2})/$1 $2/g' 2>/dev/null) || joined="$content"
[ -z "$joined" ] && joined="$content"

# --- (A) IMPOSSIBLE: a date-time later than now was not observed. NOT backtick-exempt. ---------- ⚠️ FOREIGN TIMEZONES ARE NOT COMPARABLE — added 2026-08-02 17:21 EDT, when this gate denied a perfectly good UTC stamp (TS-EXAMPLE: `2026-08-02 20:05 UTC`, which is 16:05 local, comfortably past) while writing the CLAUDE.md paragraph about CI. GitHub API times are UTC, so that is not a rare shape in this repo.
#
# Comparing a stamp in another zone against the LOCAL clock is meaningless without conversion, and converting inside a hook invites a subtler class of bug. So a stamp carrying an explicit timezone that is not the local one is skipped — out of scope, rather than guessed at. Anything with no zone, or with the local zone, is still compared, which covers every stamp the records convention actually asks for (`YYYY-MM-DD HH:MM TZ`, local).
localtz=$(date '+%Z')
# ⚠️ `TS-DEADLINE` — the second escape, added 2026-08-02 18:20 EDT because this gate denied a real one. The deny message says "if you mean a future deadline, write the date with NO clock time", and that advice is simply wrong for scheduled events: `docs/db-deferred-list.md` carries a reminder reading "⏰ 2026-08-09 17:00 EDT — CLOSE OUT the MCP observation window" (TS-EXAMPLE), where the clock time IS the content — the window closes at an hour, not on a day. Merely editing NEAR that line was refused, which is a gate blocking correct work.
#
# Kept as a separate token from TS-EXAMPLE rather than folded into it: they mean different things, and a reviewer grepping `rg TS-EXAMPLE` to audit for hidden fabrications should not have to wade through scheduled deadlines. Both are per-line and must be typed deliberately.
#
# ⚠️ PORTABLE EPOCH PARSE — added 2026-08-07 10:05 EDT, CI (ubuntu-latest, GNU date) vs. this project's own Darwin dev machine (BSD date). `date -j -f '%Y-%m-%d %H:%M' ... ` is BSD-only syntax; on GNU date it's an unrecognized-option error. That error was being swallowed by `2>/dev/null`, so every parse silently failed in CI, `future` was always empty, and the whole gate went permanently silent there — 46 of 47 test-suite assertions failed on PR #93 while all 47 passed locally on this Mac. Try BSD syntax first (this is still the primary dev environment), fall back to GNU `date -d` on failure.
TOLERANCE_SECS=180
now_epoch=$(date +%s)
future=$(printf '%s' "$joined" \
  | grep -v 'TS-EXAMPLE' \
  | grep -v 'TS-DEADLINE' \
  | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}( [A-Z]{2,5})?' \
  | while read -r d hm tz; do
      [ -n "$tz" ] && [ "$tz" != "$localtz" ] && continue
      stamp_epoch=$(date -j -f '%Y-%m-%d %H:%M' "$d $hm" +%s 2>/dev/null) \
        || stamp_epoch=$(date -d "$d $hm" +%s 2>/dev/null) \
        || continue
      diff=$(( stamp_epoch - now_epoch ))
      [ "$diff" -gt "$TOLERANCE_SECS" ] && echo "$d $hm"
    done \
  | sort -u | tr '\n' ' ')

if [ -n "$future" ]; then
  # ⚠️ THE MESSAGE MUST NAME THE ESCAPES, OR THEY DO NOT EXIST (fixed 2026-08-08 12:55 EDT). `TS-EXAMPLE` and `TS-DEADLINE` are both implemented above and both were added because this gate denied legitimate writes. Neither was mentioned in the deny text — so the only person who could use them was someone who already knew, and the person being blocked is by definition someone who does not. Live proof, this session: a comment quoting the observation window's documented closing time was denied twice; TS-DEADLINE was the right answer, sitting unused thirty lines up, and the message instead advised dropping the clock time — advice its own header calls "simply wrong for scheduled events". Harkirat had to remember the token existed.
  #
  # An escape hatch nobody is told about is not an escape hatch; it is a trap with a workaround. The DETECTION is untouched — it caught a real 30-stamp incident, and the first instinct here (grep the tree and excuse anything already written down) would have excused a genuine fabrication the moment it appeared anywhere else. Surfacing the existing tokens is the whole fix.
  msg="IMPOSSIBLE TIMESTAMP — this write contains ${future}but the clock reads ${now}, more than ${TOLERANCE_SECS}s ahead. A time that far past now cannot have been OBSERVED as the current time. On 2026-08-02 exactly this put 30 fabricated stamps into docs, memory, a released CHANGELOG and a git tag, every one of them well-formed. Use the injected clock value for anything you are asserting as NOW.
  ⚠️ IF THIS IS LEGITIMATE, TWO PER-LINE ESCAPE TOKENS ALREADY EXIST — use them rather than reworking the sentence:
    · TS-DEADLINE — a real SCHEDULED event where the clock time is the content (a window that closes at an hour, a cron, a meeting).
    · TS-EXAMPLE  — quoting a stamp as an example or as evidence, including quoting a fabricated one while writing about it.
  Both are typed deliberately, per line, and stay greppable so a reviewer can audit them. A bare date with no clock time also passes, but that is wrong for a scheduled event and should not be your first move."
  if [ "$mode" = "pre" ]; then
    jq -n --arg r "$msg" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
    exit 0
  fi
fi

# --- (A2) PLACEHOLDER TIME: a date paired with an HH:MM slot that isn't real digits. -------------- Added 2026-08-03 18:12 EDT — see the file-header note for the incident. NOT backtick-exempt, same reasoning as (A): a fake stamp inside backticks is still a fake stamp. TS-EXAMPLE stays exempt so this file's own header can keep quoting the bad pattern as an example. x/X/? only — deliberately NOT h/H, since `YYYY-MM-DD HH:MM TZ` is this project's own literal format spec (used constantly in CLAUDE.md and this very file) and must never be flagged as a fake instance. 🔴 TODAY ONLY, AND THIS NARROWING IS LOAD-BEARING — added 2026-09-02 16:58 EDT. This branch exists for ONE mishap: writing a stamp for NOW, meaning to fill the minute in later, and never doing it. A placeholder on a PAST date is the opposite thing — a deliberately imprecise historical reference (`2026-09-01 16:58 EDT`), and there are many of them in this repo's own records and hook comments. Substituting there does not repair anything: it INVENTS a precise time for a past event, which is the exact fabrication this whole file exists to prevent, committed by the fix rather than the author. Found by the completeness sweep asking whether this check fires on its OWN artifacts — feeding `memory-index-check.sh` (which carries four such stamps) through it returned an `updatedInput` rewriting them to the current minute. 🔴 ONE DEFINITION OF THE TARGET — added 2026-09-02 20:26 EDT. This branch has now drifted THREE times in one day, and every instance was the same cause: the target was written out separately in the detector, in the substitution, and in the post-substitution re-check, and a narrowing applied to one did not reach the others. First the substitution matched any date while the detector was scoped to today. Then the substitution ignored TS-EXAMPLE while the detector honoured it. Then the re-check ignored both narrowings and refused a correct fix. A shell variable is a weak abstraction and it is enough: there is one string now, and `grep -v TS-EXAMPLE` is applied at every site that reads it.
PLACEHOLDER_RE="${today}[[:space:]]+[0-9xX?]{1,2}:[0-9xX?]{2}"
find_placeholders() { printf '%s' "$1" | grep -v 'TS-EXAMPLE' | grep -oE "$PLACEHOLDER_RE" | grep -E '[xX?]'; }

placeholder=$(find_placeholders "$joined" | sort -u)
placeholder_nl="$placeholder"          # newline-separated: each match CONTAINS a space, so " " cannot delimit them
placeholder=$(printf '%s' "$placeholder" | tr '\n' ' ')

if [ -n "$placeholder" ]; then
  pmsg="PLACEHOLDER TIMESTAMP — \"${placeholder}\"has a date but no real clock time (x/X/? standing in for digits). This is exactly the 2026-08-03 mishap: a timestamp gets typed with the intent to fill in the real minute later, and later never comes before the write lands. Run \`date\` and paste the real HH:MM now, in the same edit — do not save a placeholder to fix in a follow-up."
  if [ "$mode" = "pre" ]; then
    # 🔬 AUTOFIX PROBE, added 2026-09-01 19:24 EDT. Harkirat: "how exactly are you going to make it durable when the hooks already exist?" — and he is right that a fourth prose restatement is not a mechanism. Denying is correct but costs a whole round trip every time, and this branch has been firing for weeks. The only remedy that removes the cost is SUBSTITUTION: hand the harness a corrected tool_input instead of a refusal. Whether PreToolUse honours `updatedInput` in this build is NOT documented anywhere reachable (the CLI ships as a binary) and no hook in this repo has ever tried it, so this emits BOTH the substitution and the deny fallback and lets the observed behaviour settle it. If the write lands corrected, updatedInput is honoured and the deny can go. If it is still denied, it is not, and the honest conclusion is that no mechanism exists at this layer. 🔴 THIS BRANCH USED TO DENY, AND DENYING IS WHY IT KEPT COSTING A WHOLE ROUND TRIP. Harkirat, 2026-09-01 19:10 EDT: "the timestamp injection has been a hook into EVERY tool call you make for WEEKS now... and yet nearly every time you edit a file and input a timestamp, it triggers the denial... LIKE ARE WE DEADASS???" He was right that a fourth prose restatement of the rule is not a mechanism — three surfaces already carried it and the placeholder still got typed. A refusal detects the defect and then hands the work back; a SUBSTITUTION detects it and finishes the job, because the hook already knows the one value the write was missing. ⚠️ `updatedInput` IS HONOURED BY THIS BUILD — measured 2026-09-01 19:16 EDT, not assumed. The CLI ships as a binary so the capability is not greppable; a scratch write carrying `19:xx` landed on disk reading `19:16`. If a future build stops honouring it the fallback below still denies, so the failure mode is the old behaviour rather than a placeholder reaching disk. ⚠️ THE FALLBACK EXISTS FOR A CAPABILITY REGRESSION, AND NO CONTENT CAN SIMULATE ONE. Every placeholder the detector finds is by construction one the substitution can repair — the two use the same pattern — so there is no input that reaches the deny path, and a branch no test can enter is a branch that rots. `TS_NO_AUTOFIX=1` is a test-only seam that stands in for the day `updatedInput` stops being honoured; it is what makes the deny path a checked claim rather than a hope. Naming it here because a seam whose purpose is undocumented gets deleted as dead code.
    [ -n "${TS_NO_AUTOFIX:-}" ] && { jq -n --arg r "$pmsg" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'; exit 0; }
    now_hm=$(date '+%H:%M')
    # 🔴 SUBSTITUTE ONLY WHAT THE DETECTOR ACTUALLY FOUND — corrected 2026-09-02 18:21 EDT by a code review. The detector above was narrowed to `${today}`, and this gsub was left matching ANY date with a `[0-9xX?]{1,2}:[0-9xX?]{2}` slot. That character class also matches real digits, so an edit containing today's `18:xx` alongside a correct historical `2026-08-03 18:12 EDT` came back auto-allowed with the HISTORICAL stamp rewritten to the current minute -- the exact "inventing a precise time for a past event" this branch had just claimed to fix, now reaching heredocs too because the matcher gained Bash in the same change.
    #
    # The fix is to stop describing the target twice. `$placeholder` already holds the exact strings the detector matched; each is replaced literally, so the substitution cannot reach anything the detector did not flag, and the two can never drift apart again. `?` is the only regex-special character a placeholder can contain, so it is the only one escaped. Replacing each matched string LITERALLY needed the match escaped as a regex, and `?` -- which a placeholder is made of -- is the one character that makes that fiddly enough to get wrong; it was, twice. The pattern instead carries `$today` (so it cannot reach a past date) and REQUIRES a placeholder character in the hour or the minute (so it cannot reach a correct stamp). Those are the two properties that matter, stated directly, with nothing to escape.
    fixed=$(printf '%s' "$payload" | jq --arg t "$now_hm" --arg d "$today" '
      ("(?<p>" + $d + "[ \t]+)(?:[0-9xX?]{1,2}:[0-9xX?]?[xX?]|[0-9xX?]?[xX?]:[0-9xX?]{2})") as $re
      | .tool_input |= with_entries(
        if (.value | type) == "string"
        # 🔴 PER LINE, AND SKIPPING TS-EXAMPLE — corrected 2026-09-02 20:26 EDT after an adversarial pass. The
        # detector filters TS-EXAMPLE lines out; this gsub ran over the whole string value and did not,
        # so a write containing an exempt line AND a real placeholder had the EXEMPT one rewritten.
        # Reproduced: `the bad shape is <today> 09:xx EDT   TS-EXAMPLE` came back as the current time.
        # That is the same detector-vs-substitution drift as the original defect, relocated into the
        # escape hatch — which is worse, because the escape exists precisely for text that must not be
        # touched. Third instance of one shape in one file; the two descriptions have to be ONE.
        then .value |= (split("\n") | map(if test("TS-EXAMPLE") then . else gsub($re; .p + $t) end) | join("\n"))
        else . end)
      | .tool_input' 2>/dev/null)
    # The fallback is not decoration: if jq fails, or the substitution changes nothing, an `allow` would pass the placeholder straight through — a fix that silently does not fix is worse than the refusal it replaced. ⚠️ THE FIRST VERSION OF THIS GUARD REJECTED ITS OWN CORRECT OUTPUT. It re-matched the placeholder pattern against the fixed text to prove the slot was gone — but `[0-9xX?]{2}` is an alternation, so a repaired `19:20` matches it just as happily as `18:xx` does, and every substitution was discarded as unfixed. The check has to ask whether a placeholder CHARACTER survives, which is the same two-step the detector above already uses: find the date+slot shapes, then keep only the ones carrying x/X/?. Same definition, same TS-EXAMPLE filter. A re-check looser than the detector refuses a fix that actually worked; a re-check tighter than it ships a half-fixed write. It has to be the same one.
    still=$(find_placeholders "$fixed" | grep -c . || true)
    if [ -n "$fixed" ] && [ "$fixed" != "null" ] && [ "${still:-1}" = "0" ]; then
      jq -n --argjson i "$fixed" --arg r "PLACEHOLDER TIMESTAMP CORRECTED to ${now_hm} — you typed ${placeholder}with a digit slot standing in for the real minute. The hook substituted the current clock rather than refusing the write, so nothing is owed. ⚠️ If you meant a genuinely unknown time, say so in words; a placeholder digit is never publishable content." \
        '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"allow",updatedInput:$i,permissionDecisionReason:$r}}'
      exit 0
    fi
    jq -n --arg r "$pmsg" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
    exit 0
  fi
fi

# `pre` mode judges only the objective check. The bare-date branch has a false-positive history and must never be able to block a write — noise that blocks is how a gate gets switched off.
[ "$mode" = "pre" ] && exit 0

findings=""
[ -n "$future" ] && findings="
  🚨 $msg"
[ -n "$placeholder" ] && findings="${findings}
  🚨 $pmsg"

# --- (B) BARE DATE: advisory, and the only branch that strips known-legitimate shapes ------------
#
# ⚠️ NARROWED 2026-08-02 18:39 EDT — it was firing far more often than it was right, and Harkirat called it: "it's triggered way too many false positives."
#
# MEASURED, not guessed. Corpus: every line added to `main` today carrying today's date, with `public/` excluded (generated HTML, which never reaches this hook) — 164 lines.
#   · old rule: 22 fires, 4 genuine → **18% precision**
#   · new rule:  4 fires, 4 genuine → **100% precision**, 18 suppressed, 0 real misses
# Both numbers come from running the two hook versions over that corpus, not from a model of them. A gate that is wrong four times in five trains you to scroll past it — which is exactly how the fabricated-timestamp miss got waved through 30 times, the failure this file was written for.
#
# WHAT THE RULE NOW IS. Rule 10 wants a time on a *record stamp* — the `(added …)` / `PATH UPDATED …:` / changelog-heading shapes. It never wanted one on ordinary English that names a day. Two discriminators separate them, both derived from the corpus rather than imagined: (⚠️ note those examples carry no literal date: a quoted span is stripped per LINE, so an example
#  quote that WRAPPED across a newline survived the strip and fired this very check on itself.)
#   1. PROSE — a preposition, article or conjunction directly before the date: "on 2026-08-02", "from 2026-08-02", "a 2026-08-02 session", "three times on 2026-08-02". This alone accounts for most of the 18 suppressions. A record stamp never reads that way.
#   2. RANGE ENDPOINT — an arrow or dash on either side ("2026-07-24 → 2026-08-02"). A bound is a date, not a moment; a clock time there would be wrong, not merely verbose.
#   3. LIST ITEM — the date is directly followed by a comma or semicolon, as in an enumeration of occurrence dates ("caught in three sessions (2026-07-24, 2026-07-26, 2026-08-02)"). Added 2026-08-02 23:08 EDT after this branch fired on exactly that sentence, in a memory file being edited to explain this very rule. A record stamp is followed by a TIME, or by ` — `/`)`/`:` — never by a comma, because a stamp is one moment and a comma means there is another one coming. ⚠️ Note what this says about the "100% precision" figure above: that was measured on 164 real lines from ONE day, and this shape simply was not among them. The number was honest for its corpus and is not a guarantee for shapes outside it — which is the argument for keeping this branch ADVISORY rather than promoting it to a deny.
# Double-quoted spans are stripped alongside backticks — the same trick the deferral-tell hook uses. A date inside a string literal is data, not a record.
#
# Order matters: filenames first (date followed by '-'), then flag arguments, then quoted spans.
clean=$(printf '%s' "$joined" \
  | sed -E "s/${today}-[A-Za-z0-9._-]+//g" \
  | sed -E "s/--[a-z-]+[= ]${today}//g" \
  | sed -E "s/\`[^\`]*\`//g" \
  | sed -E 's/"[^"]*"//g')
# OCCURRENCE-based, not line-based: strip every well-formed stamp FIRST, so a line carrying one good timestamp can still be reported for a bare date beside it. Only then judge what survives, line by line — because "which word precedes the date" is a question about a line.
PROSE_LEAD='(on|in|at|by|since|from|until|to|after|before|a|an|the|of|during|around|through|between|and|this|that|its|dated)'
# Any ISO date, used to spot an ENUMERATION. The list test deliberately requires a comma adjacent to ANOTHER date rather than just any trailing comma: "(added 2026-08-02)" is a genuine record stamp and must keep firing, while "(2026-07-24, 2026-07-26, 2026-08-02)" is data. A first attempt used a bare trailing [,;] and did BOTH things wrong — it would have silenced the real stamp, and it did not even match the list, because the date there is followed by ')' before the comma. Tested both directions, since today's date can be first or last in the list.
ISO='[0-9]{4}-[0-9]{2}-[0-9]{2}'
bare=$(printf '%s' "$clean" | sed -E "s/${today} [0-9]{2}:[0-9]{2}//g" | grep -F "$today" \
  | grep -viE "(^|[^A-Za-z])${PROSE_LEAD}[[:space:]]+${today}" \
  | grep -vE "(→|–|—|\.\.|->)[[:space:]]*${today}|${today}[[:space:]]*(→|–|—|\.\.|->)" \
  | grep -vE "${ISO}[])]*[[:space:]]*,[[:space:]]*[([]*${today}|${today}[])]*[[:space:]]*,[[:space:]]*[([]*${ISO}")
if [ -n "$bare" ]; then
  findings="${findings}
  ⏱️ BARE DATE — today's date appears with no HH:MM TZ beside it. Working-agreement rule 10: dated
     content in docs, memory, DEVLOG, changelogs, notes marks and code comments carries
     YYYY-MM-DD HH:MM TZ. Filenames, \`--flag DATE\` arguments, backticked spans and timestamps
     wrapped across a line break are all stripped before this check, so this is prose. Add the
     time, or confirm it is a deliberate bare date (a historical reference, a list of dates, a range
     endpoint, or the player-facing summary).
     ⏰ RIGHT NOW IT IS: $(date '+%Y-%m-%d %H:%M %Z') — paste that, do not derive it.
     ⚠️ This branch runs AFTER the bytes land, so it cannot prevent anything: reaching it already
     cost an extra edit. It is a backstop for the rare miss, NOT the mechanism. The mechanism is
     that the moment you type the year inside content, the time follows it in the same keystroke."
fi

[ -z "$findings" ] && exit 0
printf 'TIMESTAMP CHECK%s' "$findings" | jq -Rs '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:.}}'
