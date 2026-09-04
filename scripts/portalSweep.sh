#!/bin/bash
# scripts/portalSweep.sh — the whole-portal REGRESSION sweep, one line per realm.
#
# 🔴 IT LIVED IN `local/` FOR ONE SESSION AND `local/` IS GITIGNORED, so the tool written to make the NEXT session fast was invisible to any worktree or fresh clone. Same class as the rule this repo already learned about handoffs. `npm run portal:sweep`.
#
# Not a fresh conformance pass. Season, Armory, Broadcast, Access, Analytics and Review are already adjudicated in docs/reference/portal-decision-ledger.md; this asks only whether Part 6b's three SHARED edits moved them:
#   · portal/ui/app.css              — the whole .sclock family (reaches season.js, home.js, shell.js)
#   · the mockup's assets/shell.js   — seedDemoOps (reaches every mockup page, but only under ?demo=1)
#   · portal/ui/harness/index.html   — the fixture day is stamped by default (reaches season, broadcast, home)
#
# So SEASON and BROADCAST are the real targets and the other three are confirmation runs. Anything already carried as a cited row stays cited; only a NEW region is work.
cd "$(dirname "$0")/.." || exit 1
for r in season armory broadcast access analytics review; do
    q=""
    case "$r" in review) q="--mk-query demo=1" ;; esac
    printf '%-11s ' "$r"
    # shellcheck disable=SC2086
    node scripts/portalDiff.mjs --realm "$r" --portal harness $q 2>&1 \
        | rg -o "captured mk- [0-9]+px · pt- [0-9]+px|[0-9.]+% of pixels differ, in [0-9]+ region" \
        | tr '\n' ' '
    echo
done
