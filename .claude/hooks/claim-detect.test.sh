#!/bin/bash
# Proofs for claim-detect.sh — the single definition of "this message claims the work is done".
#
# Two hooks now depend on this predicate (the completion-claim gate in settings.json and completeness-sweep.sh), so a regression here silently disables BOTH. That is the whole reason the duplication was removed, and it is why the shared piece needs the strictest test in the directory.
#
# ⚠️ Both directions matter, and the SECOND is the one that gets skipped. A pattern that matches everything makes both gates fire on every message and get disabled within a day — the noise argument written into four other hooks here. So ordinary progress narration is pinned as SILENT.
#
# ⚠️ Synthetic-transcript gotcha, already paid for once in this directory: the hook greps a literal `"type":"assistant"` with NO space. Python's json.dumps default inserts one, producing an empty read that looks exactly like "no claim found". These fixtures are hand-written with no spaces.

HOOK="$(cd "$(dirname "$0")" && pwd)/claim-detect.sh"
pass=0; fail=0
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT

say() { printf '{"type":"assistant","message":{"content":[{"type":"text","text":"%s"}]}}\n' "$1" > "$TMP/t.jsonl"; printf '%s' "$TMP/t.jsonl"; }
a() { local n="$1" want="$2" f="$3"
  if bash "$HOOK" "$f" >/dev/null 2>&1; then got=claim; else got=none; fi
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (wanted $want, got $got)"; fail=$((fail+1)); fi; }

echo "claim-detect.sh — proofs"

# ---- it fires on real completion claims (phrasings taken from actual past messages) ----
a "'all done'"                     claim "$(say 'All done and pushed.')"
a "'everything is in sync'"        claim "$(say 'Everything is in sync now.')"
a "'fully verified'"               claim "$(say 'The records are fully verified.')"
a "'all three jobs'"               claim "$(say 'All three jobs done, committed.')"
a "'no gaps'"                      claim "$(say 'Swept it again — no gaps found.')"
a "'ready to merge'"               claim "$(say 'This is ready to merge whenever you say.')"
a "'nothing missed'"               claim "$(say 'Checked the whole tree, nothing missed.')"

# ---- and STAYS SILENT on ordinary work narration: the half that keeps the gates usable ----
a "progress narration"             none  "$(say 'Working through the reference sweep now, three files left.')"
a "a question back to Harkirat"    none  "$(say 'Do you want the split before or after the rename?')"
a "reporting a FAILURE"            none  "$(say 'Two tests failed; the fixture was below the sampling floor.')"
a "describing a plan"              none  "$(say 'Next I will move the notes file and update its references.')"

# ---- interface: --regex must emit a usable pattern, since settings.json now sources it ---- If this ever returned empty, the completion-claim gate's grep would match EVERYTHING.
re=$(bash "$HOOK" --regex)
if [ -n "$re" ] && printf 'All done here.\n' | grep -qiE "$re"; then
  echo "  PASS  --regex emits a working pattern"; pass=$((pass+1))
else
  echo "  FAIL  --regex emits a working pattern"; fail=$((fail+1))
fi
if printf 'Working on it, three files left.\n' | grep -qiE "$re"; then
  echo "  FAIL  --regex pattern does not match everything"; fail=$((fail+1))
else
  echo "  PASS  --regex pattern does not match everything"; pass=$((pass+1))
fi

# ---- fail-safe: a missing transcript must be a NON-claim, never a crash ----
a "missing transcript -> no claim"  none "$TMP/does-not-exist.jsonl"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
