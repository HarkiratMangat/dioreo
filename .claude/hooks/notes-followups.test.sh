#!/bin/bash
# Proofs for notes-followups.sh — the gate that exists because a follow-up sat unseen for ~5 sessions.
#
# ⚠️ THE CENTRAL CASE IS "ANSWERED BUT STILL OPEN", not "unanswered". The follow-up that caused this
# hook HAD a reply; the reply ended "Say the word and I'll rework the hook..." — a question back to
# Harkirat nobody surfaced. A detector that only reported UNANSWERED marks would have stayed silent
# on the exact case it was built for. That asymmetry is pinned first, because it is the one a future
# simplification would delete.
#
# The other half matters just as much: a reply that genuinely closes the matter must NOT be surfaced,
# or every session reports the same resolved exchanges and the whole thing gets skimmed past — the
# noise argument written into four other hooks here.

HOOK="$(cd "$(dirname "$0")" && pwd)/notes-followups.sh"
pass=0; fail=0
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

mk() { printf '%s\n' "$1" > "$TMP/n.md"; printf '%s' "$TMP/n.md"; }
a() { local n="$1" want="$2" out; out=$(bash "$HOOK" "$3" 2>/dev/null)
  if [ -n "$out" ]; then got=surfaced; else got=silent; fi
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (wanted $want, got $got)"; echo "        out: [${out:0:160}]"; fail=$((fail+1)); fi; }

echo "notes-followups.sh — proofs"

# ---- the case that caused this hook ----
a "answered but still asks -> surfaced" surfaced \
  "$(mk 'note ※ [2026-08-03 19:14 EDT] why is this at the bottom? ※ ∴ [2026-08-03 19:39 EDT] Answered above. Say the word and I will rework the hook. ∵')"
a "never answered -> surfaced" surfaced \
  "$(mk 'note ※ [2026-08-05 12:00 EDT] can we change the banner? ※')"

# ---- and the half that keeps it usable ----
a "answered, nothing outstanding -> silent" silent \
  "$(mk 'note ※ [2026-08-03 19:14 EDT] can you fix the casing? ※ ∴ [2026-08-03 19:37 EDT] Done here, and applied the same fix to every other item. ∵')"
a "struck through -> silent" silent \
  "$(mk '- [x] ✓ ~~note ※ [2026-08-01 10:00 EDT] old question ※~~')"
a "checked box -> silent" silent \
  "$(mk '- [x] note ※ [2026-08-01 10:00 EDT] old question ※ ∴ reply. Want me to do more? ∵')"
a "no follow-up marks at all -> silent" silent "$(mk '- [ ] an ordinary open item with no marks')"

# ---- a LATER reply resolves an earlier open offer ----
# An exchange accumulates replies over time. Reading the FIRST one meant an exchange whose opening
# reply said "say the word" stayed flagged forever, even after a later reply closed it — found by
# resolving this hook OWN motivating follow-up and watching it refuse to go quiet.
a "later reply resolves an earlier offer -> silent" silent \
  "$(mk 'x ※ [2026-08-03] q ※ ∴ [2026-08-03] Say the word and I will do it. ∵ ∴ [2026-08-06] Done, shipped and verified. ∵')"
a "later reply that STILL asks -> surfaced" surfaced \
  "$(mk 'x ※ [2026-08-03] q ※ ∴ [2026-08-03] Done. ∵ ∴ [2026-08-06] Reopened — want me to also move the table? ∵')"

# ---- it must scan the WHOLE file, not a bounded section ----
# Bounded scanning is precisely what hid the original: the follow-up sat BELOW the `## 📍` heading
# where the open-items scan deliberately stops. A section-bounded implementation passes every test
# above and still misses the real one.
BELOW=$(printf '## Questions\n- [ ] something\n## 📍 Where everything else lives\nnote ※ [2026-08-03 19:14 EDT] q ※ ∴ reply. Say the word. ∵\n' > "$TMP/b.md"; printf '%s' "$TMP/b.md")
a "follow-up BELOW the 📍 stop marker is found" surfaced "$BELOW"

# ---- reporting quality: the date must be readable, not sliced mid-multibyte ----
# `※` is multi-byte; an offset-based slice printed "[[2026-08-0" on the first live run.
out=$(bash "$HOOK" "$(mk 'x ※ [2026-08-03 19:14 EDT] q ※')" 2>/dev/null)
case "$out" in *"[2026-08-03]"*) echo "  PASS  date is extracted cleanly"; pass=$((pass+1));;
  *) echo "  FAIL  date is extracted cleanly (out: ${out:0:80})"; fail=$((fail+1));; esac

# ---- fail-safe ----
a "missing file -> silent, no crash" silent "$TMP/nope.md"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
