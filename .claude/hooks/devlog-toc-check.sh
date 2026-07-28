#!/usr/bin/env bash
# PreToolUse(Bash) gate on `gh pr create` — DEVLOG table-of-contents sync.
#
# WHY (2026-07-28 17:35 EDT): `docs/DEVLOG.md`'s Part A table of contents is maintained by hand, with a
# "**Keep in sync** when you add an entry" note. It was found **15 entries behind the body** on
# 2026-07-28 16:20 EDT — every 2026-07-27 and 2026-07-28 entry missing — the same asymmetry already
# measured for the DEVLOG itself (machine-checked 22/22, attention-dependent 8/22). A note asking
# politely is not a mechanism.
#
# Harkirat caught the second half of the problem the same day: the TOC used vague qualifiers ("later",
# "afternoon", "late afternoon") instead of the timestamps the body headings carry. That made it
# ambiguous, made it ROT (insert one entry and every "later" below it silently shifts meaning), and
# defeated the TOC's own stated purpose — its header says to jump by SEARCHING the entry text, which
# cannot work when the TOC text doesn't match the heading text.
#
# The rule is now exact mirroring: **every DATED Part A TOC line is its body heading with `## ` stripped.**
#
# ⚠️ Only DATED lines are compared. The TOC also carries at least one deliberate non-entry pointer
# (`- *Earlier milestones* [backfill — expand later from transcripts]`) which has no body heading and
# must NOT be reported as extra — and must not be deleted by a naive regeneration. That line was very
# nearly lost to exactly such a regeneration while this hook was being written.

set -uo pipefail
REPO="/Applications/Claude Code/Diors-Builds"
DEVLOG="$REPO/docs/DEVLOG.md"
[ -f "$DEVLOG" ] || exit 0

cd "$REPO" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0
BASE="${1:-main}"
# Committed changes only — correct for a `gh pr create` gate, since you commit before opening a PR.
git diff --name-only "$BASE...HEAD" 2>/dev/null | grep -qx 'docs/DEVLOG.md' || exit 0

diff_out=$(node -e '
const fs=require("fs");
const lines=fs.readFileSync(process.argv[1],"utf8").split("\n");
const heads=lines.filter(l=>/^## 20[0-9]{2}-/.test(l)).map(l=>l.replace(/^## /,"").trim());
const s=lines.findIndex(l=>l.startsWith("**Part A — The Journey"));
const e=lines.findIndex(l=>l.startsWith("**Part B — Lessons Ledger"));
if(s<0||e<0){ process.exit(0); }   // markers moved: stay silent rather than cry wolf
// Dated lines only. Non-dated pointers in the TOC are intentional and exempt.
const toc=lines.slice(s+1,e)
  .filter(l=>/^- 20[0-9]{2}-/.test(l))
  .map(l=>l.slice(2).trim());
const missing=heads.filter(h=>!toc.includes(h));
const extra=toc.filter(t=>!heads.includes(t));
let out="";
if(missing.length) out+="\n  IN THE BODY BUT NOT THE TOC ("+missing.length+"):\n"+missing.map(m=>"    - "+m).join("\n");
if(extra.length)   out+="\n  IN THE TOC BUT NOT THE BODY ("+extra.length+") -- stale wording or a renamed heading:\n"+extra.map(m=>"    - "+m).join("\n");
if(!out && heads.join("|")!==toc.join("|")) out="\n  Same entries, but the TOC ORDER does not match the body order.";
if(out) console.log(out);
' "$DEVLOG" 2>/dev/null)

[ -n "${diff_out// /}" ] || exit 0

jq -n --arg d "$diff_out" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "ask",
    permissionDecisionReason: ("DEVLOG TOC OUT OF SYNC.\n\nEvery dated Part A entry in the table of contents must be its body heading verbatim (with `## ` stripped) -- that is what makes the TOC greppable straight to the entry, and it is why vague qualifiers like \"(later)\" were retired 2026-07-28 17:35 EDT.\n" + $d + "\n\nFix the TOC, but do NOT blind-regenerate it: the block also holds intentional non-dated pointer lines with no body heading, and a naive rebuild deletes them.")
  }
}'
