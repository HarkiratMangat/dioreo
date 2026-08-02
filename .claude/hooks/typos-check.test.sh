#!/bin/bash
# Proofs for typos-check.sh.
#
# The important one is the LAST case. This hook opens with `command -v typos || exit 0`, so if the
# binary is missing it goes permanently silent and looks exactly like "no typos found" — a vacuous
# pass, which is the failure mode feedback_not_checkable_is_usually_unexamined is about. The suite
# therefore FAILS LOUDLY when `typos` is absent rather than skipping, because a green suite that
# proves nothing is worse than a red one.

HOOK="$(cd "$(dirname "$0")" && pwd)/typos-check.sh"
pass=0; fail=0

# ⚠️ CI IS EXEMPT, THE DEV MACHINE IS NOT — split 2026-08-02 18:04 EDT, after CI failed here.
# The distinction is real, not a convenience: this hook only ever runs inside a Claude Code session
# on Harkirat's Mac, so `typos` missing THERE means the gate is silently dead and must fail loudly.
# On the CI runner the hook never executes at all, so demanding the binary would be enforcing a
# dependency nothing uses — the fastest way to get a suite disabled is to make it fail for a reason
# that does not matter. CI still runs every other case; only the binary requirement is relaxed.
if ! command -v typos >/dev/null 2>&1; then
  echo "typos-check.sh — proofs"
  if [ -n "${CI:-}" ]; then
    echo "  SKIP  \`typos\` is not installed on CI, where this hook never runs. Not a failure here."
    echo "        (On the dev machine its absence IS a failure — the hook would be silently dead.)"
    exit 0
  fi
  echo "  FAIL  the \`typos\` binary is not installed, so this hook is silently DISABLED."
  echo "        It exits 0 when the binary is missing, which is indistinguishable from a clean edit."
  echo "        Install it (brew install typos-cli) or remove the hook — do not leave it looking active."
  exit 1
fi

r() { local o; o=$(printf '{"tool_input":{"content":%s}}' "$(printf '%s' "$1" | jq -Rs .)" | bash "$HOOK")
      [ -z "$o" ] && { echo SILENT; return; }
      printf '%s' "$o" | jq -r '.hookSpecificOutput.additionalContext // "SILENT"'; }
a() { local n="$1" want="$2" out; out="$(r "$3")"
  case "$out" in SILENT) got=silent;; *) got=fires;; esac
  if [ "$got" = "$want" ]; then echo "  PASS  $n"; pass=$((pass+1))
  else echo "  FAIL  $n (want $want, got $got)"; echo "        [$out]"; fail=$((fail+1)); fi; }

echo "typos-check.sh — proofs"
a "a real misspelling fires"      fires  "We recieve the payload and teh handler runs."
a "clean prose is silent"         silent "We receive the payload and the handler runs."
a "empty content is silent"       silent ""
# Project vocabulary must not fire — that is what _typos.toml is for, and if this starts failing it
# means the config stopped being picked up (the hook writes its probe INSIDE the repo precisely
# because typos resolves config relative to the file it checks).
a "project vocabulary is silent"  silent "The loadout accent color for the DMZ changelog devlog."

# The probe file must never be left behind: it is written into the repo root, so a leak would show
# up as an untracked file and could end up committed.
before=$(find "${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}" -maxdepth 1 -name '.typos-probe-*' | wc -l | tr -d ' ')
r "We recieve it." >/dev/null
after=$(find "${CLAUDE_PROJECT_DIR:-/Applications/Claude Code/Diors-Builds}" -maxdepth 1 -name '.typos-probe-*' | wc -l | tr -d ' ')
if [ "$before" = "$after" ]; then echo "  PASS  probe file is cleaned up"; pass=$((pass+1))
else echo "  FAIL  probe file leaked into the repo root ($before -> $after)"; fail=$((fail+1)); fi

echo; echo "  $pass passed, $fail failed"; [ "$fail" -eq 0 ] || exit 1
