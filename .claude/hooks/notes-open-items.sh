#!/bin/bash
# notes-open-items.sh — single source of truth for "which lines in docs/diors-builds notes.md's
# working sections count as open".
#
# WHY THIS EXISTS (2026-08-03 21:03 EDT). The exact same regex — `^- [^<[]`, which silently
# excludes any `- [ ]` checkbox line because `[^<[]` rejects a line starting with `[` right after
# `- ` — was duplicated in TWO places: the SessionStart hook's inline command in settings.json, and
# records-close-check.sh. The notes file adopted the `- [ ]` convention for open filed-but-unbuilt
# items 2026-08-03 19:37 EDT; one copy got fixed the same session it was noticed, the other did not,
# because there was no single place to fix it. One implementation, called from both, closes that gap.
#
# Usage: notes-open-items.sh <path-to-notes.md>
# Prints one open working-section line per line of output, untruncated. The caller does its own
# counting (wc -l) and preview (head/cut) — different callers want different amounts. Silent,
# exit 0, if the file doesn't exist.

set -uo pipefail
f="${1:?usage: notes-open-items.sh <path-to-notes.md>}"
[ -f "$f" ] || exit 0
awk '/^## Questions/{f=1} /^## 📍/{exit} f{print}' "$f" | grep -E '^- (\[ \]|[^<[])' || true
exit 0
