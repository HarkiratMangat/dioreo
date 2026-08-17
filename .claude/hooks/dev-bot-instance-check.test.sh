#!/bin/bash
# Proofs for dev-bot-instance-check.sh. Must stay SILENT on a normal `node --watch` supervisor+child pair (the expected shape every dev-bot session runs), and must FIRE on two independently-launched processes sharing the dev token — the actual collision this hook exists to catch.

HOOK="$(cd "$(dirname "$0")" && pwd)/dev-bot-instance-check.sh"
pass=0; fail=0
chk() { local n="$1" cond="$2"
  if [ "$cond" = ok ]; then echo "  PASS  $n"; pass=$((pass+1)); else echo "  FAIL  $n"; fail=$((fail+1)); fi; }

echo "dev-bot-instance-check.sh — proofs"

# Stub `ps` on PATH so the hook sees a fabricated process table instead of the real machine's -- the real machine's state is not a fixture and must never gate whether this test passes.
STUB_DIR=$(mktemp -d)
trap 'rm -rf "$STUB_DIR"' EXIT

mk_ps_stub() {
  cat > "$STUB_DIR/ps" <<EOF
#!/bin/bash
cat <<'PS_OUTPUT'
$1
PS_OUTPUT
EOF
  chmod +x "$STUB_DIR/ps"
}

# --- Case 1: no matching processes at all -> silent ---
mk_ps_stub "  501     1 launchd
  502   501 /usr/sbin/something --unrelated"
out=$(PATH="$STUB_DIR:$PATH" bash "$HOOK")
rc=$?
chk "no matches: exits 0"   "$([ "$rc" -eq 0 ] && echo ok)"
chk "no matches: no output" "$([ -z "$out" ] && echo ok)"

# --- Case 2: exactly one match -> silent (nothing to compare against) ---
mk_ps_stub " 1000     1 node --env-file=.env.dev index.js"
out=$(PATH="$STUB_DIR:$PATH" bash "$HOOK")
chk "single instance: no output" "$([ -z "$out" ] && echo ok)"

# --- Case 3: normal --watch supervisor + child (child's PPID IS the supervisor's PID) -> silent ---
mk_ps_stub " 1000     1 node --watch --env-file=.env.dev index.js
 1001  1000 node --env-file=.env.dev index.js"
out=$(PATH="$STUB_DIR:$PATH" bash "$HOOK")
chk "watch supervisor+child: no output (this is the NORMAL shape)" "$([ -z "$out" ] && echo ok)"

# --- Case 4: TWO independent roots on the same token (the real collision) -> fires ---
mk_ps_stub " 1000     1 node --watch --env-file=.env.dev index.js
 1001  1000 node --env-file=.env.dev index.js
 2000     1 node --env-file=.env.dev index.js"
out=$(PATH="$STUB_DIR:$PATH" bash "$HOOK")
rc=$?
chk "two independent roots: exits 0 (never blocks)" "$([ "$rc" -eq 0 ] && echo ok)"
chk "two independent roots: emits valid JSON" "$(printf '%s' "$out" | jq -e . >/dev/null 2>&1 && echo ok)"
chk "two independent roots: is SessionStart additionalContext" \
  "$(printf '%s' "$out" | jq -e '.hookSpecificOutput.hookEventName=="SessionStart" and (.hookSpecificOutput.additionalContext|type=="string")' >/dev/null 2>&1 && echo ok)"
case "$(printf '%s' "$out" | jq -r '.hookSpecificOutput.additionalContext')" in
  *"2 independently-launched"*) msg=ok ;;
  *) msg=no ;;
esac
chk "two independent roots: message names the count" "$msg"

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
