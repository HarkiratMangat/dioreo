#!/bin/bash
# Proves outstanding-not-filed.sh fires on the REAL offending message and stays silent on the
# legitimate ones. Two assertions per case — the broken input BLOCKS and the valid input does NOT.
# The second half is the one that catches a matcher firing on everything.
#
# ⚠️ Synthetic transcripts MUST be written with no space after the JSON colon. The hook greps for the
# literal '"type":"assistant"'; Python's json.dumps default inserts '"type": "assistant"', which
# silently yields an empty $last and a false "didn't fire" that looks exactly like a pass. That
# gotcha is recorded in reference_enforcement_hooks and it has bitten before.
#
#   bash .claude/hooks/outstanding-not-filed.test.sh

HOOK="$(dirname "$0")/outstanding-not-filed.sh"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
pass=0; fail=0

mk() { # $1=assistant text  $2=optional file_path edited this turn
  python3 - "$TMP/t.jsonl" "$1" "${2:-}" <<'PY'
import json,sys
path,text,edited=sys.argv[1],sys.argv[2],sys.argv[3]
rows=[{"type":"user","message":{"role":"user","content":"do the thing"}}]
if edited:
    rows.append({"type":"assistant","message":{"content":[{"type":"tool_use","name":"Edit","input":{"file_path":edited}}]}})
rows.append({"type":"assistant","message":{"content":[{"type":"text","text":text}]}})
with open(path,"w") as f:
    for r in rows: f.write(json.dumps(r,separators=(",",":"))+"\n")
PY
}

run() { printf '{"transcript_path":"%s","stop_hook_active":false}' "$TMP/t.jsonl" | bash "$HOOK"; }

assert() { # name | expect block|pass
  local name="$1" want="$2" out; out="$(run)"
  # PARSE the JSON, never grep it. The first version grepped '"decision":"block"' while `jq -n`
  # pretty-prints '"decision": "block"' WITH a space -- so every block case silently read as a pass.
  # That is the exact JSON-spacing trap this file warns about at the top, committed in its own
  # assertion. A test that cannot detect the failure it exists to detect is worse than no test.
  local got; got="$(printf '%s' "$out" | jq -r '.decision // "pass"' 2>/dev/null || echo pass)"
  [ "$got" = "block" ] || got=pass
  if [ "$got" = "$want" ]; then echo "  PASS  $name"; pass=$((pass+1));
  else echo "  FAIL  $name — expected $want, got $got"; fail=$((fail+1)); fi
}

echo "outstanding-not-filed.sh — proofs"

# 1. THE REAL OFFENDING MESSAGE, verbatim in shape, with no list touched. Must BLOCK.
mk "Still outstanding: the linksee dream() distill queue (19 raw utterances), and the release docs."
assert "the actual 2026-08-02 failure blocks" block

# 2. Same claim, but a deferred list WAS edited this turn. Must PASS — this is the discriminator.
mk "Still outstanding: the linksee distill queue." "/Applications/Claude Code/Diors-Builds/docs/db-deferred-list.md"
assert "same claim + list edited passes" pass

# 3. Reporting that it is already filed, no edit this turn. Must PASS.
mk "The distill queue is filed as [P2 - S] under Queued, so nothing is lost."
assert "already-filed language passes" pass

# 4. Other tells.
mk "I am deliberately leaving the dream queue for a future session."
assert "'for a future session' blocks" block
mk "That one remains unresolved."
assert "'remains unresolved' blocks" block

# 5. Quoting the offending phrase while EXPLAINING it is not a new instance. Must PASS.
mk 'The hook fires on "still outstanding" phrasing, which is why I filed it in the deferred list.'
assert "quoted phrase + filed language passes" pass

# 6. An ordinary completion message must never trip it.
mk "Merged and tagged v2.48.0. Memory index clean, docs:audit exit 0."
assert "benign completion message passes" pass

# 7. Loop guard.
mk "Still outstanding: something."
out=$(printf '{"transcript_path":"%s","stop_hook_active":true}' "$TMP/t.jsonl" | bash "$HOOK")
if [ "$(printf '%s' "$out" | jq -r '.decision // "pass"' 2>/dev/null || echo pass)" = "block" ]; then
  echo "  FAIL  loop guard"; fail=$((fail+1)); else echo "  PASS  stop_hook_active loop guard"; pass=$((pass+1)); fi

# 8. Sanity: the harness actually populates the message. A test that silently reads an empty $last
#    would "pass" case 6 for the wrong reason, which is the trap this file warns about at the top.
mk "Still outstanding: something."
grep -q '"type":"assistant"' "$TMP/t.jsonl" && { echo "  PASS  harness emits the literal the hook greps for"; pass=$((pass+1)); } \
  || { echo "  FAIL  harness JSON shape does not match the hook's grep"; fail=$((fail+1)); }

echo
echo "  $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
