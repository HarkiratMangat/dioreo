#!/bin/bash
# scripts/portalSweep.sh — the whole-portal REGRESSION sweep, one line per realm, BOTH instruments.
#
# 🔴 IT LIVED IN `local/` FOR ONE SESSION AND `local/` IS GITIGNORED, so the tool written to make the NEXT session fast was invisible to any worktree or fresh clone. Same class as the rule this repo already learned about handoffs. `npm run portal:sweep`.
#
# 🔴 AND ITS FIRST VERSION RAN ONLY THE DIFF, AND OMITTED HOME — while the `[P1 · M]` filing it answers names `portal:audit --realm <r> --all` AND `portalDiff`, over every realm. Marking that item ✅ on the diff alone closed a two-noun scope having shipped one; the audit half was then run by hand, which is not reproducible from the tool. Both halves run here now, over all SEVEN realms. Found by §L ⑥'s agent.
#
# Not a fresh conformance pass. Every realm is already adjudicated in docs/reference/portal-decision-ledger.md; this asks only whether a SHARED edit moved them — `portal/ui/app.css`, the mockup package's shared `assets/shell.js`, `portal/ui/harness/index.html`, or anything under `portal/ui/` that more than one realm renders. Anything already carried as a cited row stays cited; only a NEW region is work.
#
# ⚠️ HOME AND REVIEW REFUSE WITHOUT `--mk-query demo=1` (scripts/lib/portalSeedRealms.mjs is the one list). Exit 2 from either without it is the tool working, not a broken tool.
cd "$(dirname "$0")/.." || exit 1

for r in season armory broadcast access analytics review home; do
    # An ARRAY, not a string, and that is the whole point: `$q` unquoted needs a shellcheck suppression, and a suppression is a COMMENT — see the trap note at the foot of this file.
    q=()
    case "$r" in review|home) q=(--mk-query demo=1) ;; esac
    printf '%-11s ' "$r"
    node scripts/portalDiff.mjs --realm "$r" --portal harness "${q[@]}" 2>&1 \
        | rg -o "captured mk- [0-9]+px · pt- [0-9]+px|[0-9.]+% of pixels differ, in [0-9]+ region" \
        | tr '\n' ' '
    # ⚠️ The audit is the OTHER half of the filing's scope. Its sections are what §L ② closes on; the percentage above is a pointer. Both on one line so a regression in either is visible at a glance.
    #
    node scripts/portalAudit.mjs --realm "$r" --all "${q[@]}" 2>&1 \
        | rg -o "② SHAPE \([0-9]+|③ WORDS \([0-9]+|④ STYLE \([0-9]+" \
        | tr -d '(' | tr '\n' ' '
    # 🔴 THE LEDGER ROW COUNT RIDES BESIDE THE NUMBER, BECAUSE THE NUMBER IS NOT THE CLOSE CONDITION. §0.7d retired the percentage as a target and a realm closes on the ENUMERATION — are its regions exactly the cited set. This sweep is the first artifact of a session, so a percentage standing alone at the top of the log is read as a grade whatever the plan says. ⚠️ One row can cover many regions and many rows can cover one, so this is a PROMPT, never a score; scripts/portalLedgerRows.mjs says so in its own header and in its stdout.
    printf 'ledger %s' "$(node scripts/portalLedgerRows.mjs "$r")"
    echo
done

# 🔴 THE REASON THERE IS NO `shellcheck disable` LINE IN THIS FILE — measured 2026-09-03 23:13 EDT. `reflow-comments --write` merges a run of consecutive full-line comments into one paragraph, and it did that to a suppression directive here: the line became prose, shellcheck stopped seeing a directive, and the check it suppressed went red. Restoring the directive to its own line did not survive either — the very next reflow merged it again. **A reflow is a shape transform and a directive IS a shape**, so the durable fix is to need no directive: an array expands correctly quoted and raises no SC2086 at all. The same applies to any shape-dependent comment in this tree — `eslint-disable`, `prettier-ignore`, `@ts-expect-error`, a `#!` that is not on line 1. If a tool reads a comment by POSITION, this reflow can destroy it, and neither `bash -n` nor `node --check` will say a word.
