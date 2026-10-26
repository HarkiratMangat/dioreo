#!/bin/bash
# notes-open-items.sh — single source of truth for "which lines in docs/ideas/diors-notes.md's working sections count as open".
#
# WHY THIS EXISTS (2026-08-03 21:03 EDT). The exact same regex — `^- [^<[]`, which silently excludes any `- [ ]` checkbox line because `[^<[]` rejects a line starting with `[` right after `- ` — was duplicated in TWO places: the SessionStart hook's inline command in settings.json, and records-close-check.sh. The notes file adopted the `- [ ]` convention for open filed-but-unbuilt items 2026-08-03 19:37 EDT; one copy got fixed the same session it was noticed, the other did not, because there was no single place to fix it. One implementation, called from both, closes that gap.
#
# Usage: notes-open-items.sh <path-to-notes.md> Prints one open working-section line per line of output, untruncated. The caller does its own counting (wc -l) and preview (head/cut) — different callers want different amounts. Silent, exit 0, if the file doesn't exist.

set -uo pipefail
f="${1:?usage: notes-open-items.sh <path-to-notes.md>}"
[ -f "$f" ] || exit 0
# ⚠️ THE END BOUNDARY IS AN EXPLICIT MARKER, not a heading — changed 2026-08-06 10:21 EDT. It used to stop at `## 📍`, which FORCED that section to live at the very bottom of the file: move it and its table rows fall inside the scan and get counted as open items. Harkirat asked on 2026-08-03 19:14 EDT why the pointer section was buried at the bottom instead of near the Legend where a session would actually see it. The honest answer was "because this hook's scan range says so" — a tool dictating the layout of a human's notes, which is backwards. `<!-- /open-items -->` closes the scan explicitly, so the file can be arranged however he likes. The `## 📍` fallback stays for the case where the marker is missing: dropping it would make an absent marker scan to EOF and silently count the whole pointer table as open work. ⚠️ BOTH exit rules are guarded by `f`. Unguarded, they fire on a marker that appears BEFORE `## Questions` — which is exactly what happened the moment the 📍 section moved to the top: awk hit it at line 61, exited before `f` was ever set, and the count went 3 -> 0. A scan that silently returns zero open items is indistinguishable from a tidy notes file, so this would have disabled the SessionStart notes check AND the records-close gate that delegates to it, quietly. Caught 2026-08-06 10:21 EDT by asserting the count was unchanged across the move, not by reading.
awk '/^## Questions/{f=1; next} f && /^<!-- \/open-items -->/{exit} f && /^## 📍/{exit} f{print}' "$f" \
  | grep -E '^- (\[ \]|[^<[])' || true
exit 0
