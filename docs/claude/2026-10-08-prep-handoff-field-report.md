---
kind: record
status: frozen
---

# prep-handoff and think-pass: a field report from a real compact

*Written 2026-10-08 22:45 EDT by Session 4's lead (Dioreo, session `844943ce`), for the peer project that owns the `workstyle` plugin. Harkirat asked for it right after the first real run of `/workstyle:prep-handoff`, folding in `/workstyle:think-pass`. Every number below was measured in this session; anything inferred says so.*

## The run, in numbers

| | |
|---|---|
| Purpose | `/workstyle:prep-handoff for a compact, you're at 830k context window.` |
| Session | 7 compacts already; 1M window; 851,670 tokens in use at the start (118k left, level **normal**) |
| Prep cost | 851,670 → 880,455 in use (~29k) in about 6 minutes; the level fell to **tight** (89k left) during the prep |
| Handoff | `docs/claude/s4/2026-10-02-s4-handoff.md`: 134,648 characters, 702 lines before the run |
| Extractor | 1 chunk (45 lines, 15,727 bytes); the agent spent 121,354 tokens and 88 s; spot-check 2 of 2 quotes found |
| measure-parts | 14 sections over 1,500 characters (the longest 14,218); after splitting, 164 sections, 0 over |

## Verdict

A clear step up from my manual preps in rigour and repeatability: the clock and budget come from the transcript, his words are extracted and spot-checked, the 1,500-character rule makes the handoff retrievable, and `Transcript covered … through` lets the next prep read only what is new. Its weak spots showed up immediately on a long-lived handoff: nothing ever retires history, it stacks a second state block on top of the repo's own, it costs a lot on short same-session compacts, and its `/compact` block dropped the DISCARD line my manual preps relied on.

## What worked (keep these)

- **Measured clock and budget** (`context.mjs level`): no typed timestamps, and the 1M window was detected from a past turn.
- **The extractor plus a spot-check.** Two quotes grepped back word for word; the agent's `NOT CHECKED` section honestly named the lines it couldn't see.
- **The log's `Transcript covered … through <ISO>`**, so a second prep reads only the new lines.
- **The 1,500-character rule.** Sections come back whole from `ctx_search`.
- **The pointer list and the claim/release**, for parallel sessions in one folder.
- **`/continue-session` in the resume prompt.** It exists (checked: `skills/continue-session`).

## Findings

### A. The handoff file grows forever

- **Step 1 "read it fully" was impossible.** `read_smart` refused the 134,648-character file ("exceeds maximum allowed tokens"); I read a heading map instead.
- **Nothing retires history.** "Never delete theirs", "earlier entries stay untouched" and "split long sections" all add; the file went from 702 lines to 164 sections.
- **Recommend:** read `## Current state` and the newest log entry fully, everything else on demand. Add a rotation rule: past a size, move superseded blocks to a dated archive file and leave a one-line pointer.

### B. The rule measures but cannot split

- `measure-parts.mjs` names the failing sections but the skill supplies no splitter. I wrote one on the fly (line groups, sentence splits marked `(cont.)`, a word-count assert so nothing is lost) and rewrote 14 historical sections. That is a mechanical rewrite of records nobody asked to restyle.
- **Recommend:** ship `split-parts.mjs` with those assertions built in (no words lost, code fences kept whole), or exempt archive sections from the rule.

### C. Two state blocks in one file

- "Add yours, never delete theirs" put the template's `## Current state` above the repo's own `CURRENT STATE` block. The file now holds two state blocks, plus older "How he wants me to work" lists that overlap my new "Working lessons".
- The pointer file (`.remember/remember.md`) still sends readers to `§ CURRENT STATE → RESUME HERE`, the old block. "Touch only your own line" stopped me fixing a line this same workstream wrote.
- **Recommend:** when a file already has a current-state block, replace it in place (it is state, not record) and move the old one under the log. Let a session edit pointer-file lines its own workstream wrote, or keep only pointer lines in that file so nothing else there can go stale.

### D. The `/compact` block: keep/discard, and what the summarizer does with the focus

I paired this session's earlier `/compact` focus texts with the summaries they produced (the transcript logs the command just after its summary row).

| Focus | Summary | Longest run copied word for word | What happened to DISCARD |
|---|---|---|---|
| KEEP list, 1,961 chars | 11,067 chars | 101 chars | (no DISCARD line) |
| KEEP + DISCARD, 865 chars | 18,258 chars | 64 chars | the topic became `**Side quest (DISCARD; outcomes only), nothing pending:**` and was still mentioned 6 times |

- **The focus never becomes the summary verbatim.** The summarizer writes its own summary to a fixed template (request · concepts · files · errors · problem solving · all user messages · pending · current work · next step) and uses the focus as guidance. Phrases reappear; whole blocks don't.
- **DISCARD works, partly.** It shrinks a topic to a labelled, outcomes-only stub; it does not delete it.
- **KEEP lines mostly duplicate the handoff.** They help only for what the handoff can't hold, which the skill already asks for.
- **What a missing DISCARD costs (inferred):** the latest summary, from an automatic compact with no focus at all, spent space on rejected designs and splice errors that a DISCARD would have shrunk.
- **Recommend:** add an optional `DISCARD:` line to the skill's `/compact` block, built from the session's dead ends (rejected designs, debugging detours, finished side quests). Keep `KEEP:` to what the handoff lacks. Raise the 600-character cap to about 1,000; both longer focuses above worked.

### E. Cost on a short same-session compact

- The extractor read 45 lines that were all still in my live context (the chunk started after the last compact) and spent 121k tokens doing it.
- The level is computed before the prep and doesn't budget the prep's own ~29k, so "normal" became "tight" partway through.
- **Recommend:** skip the extractor, or run it on a cheaper model, when the purpose is a same-session compact and the chunk is short and starts after the last compact. Its value peaks when the chunk spans an earlier compact, or for a fresh session. State the prep's expected cost next to the level table.

### F. The chunker caps his words

- `context.mjs` caps his lines at 1,800 characters, mine at 1,200, commands at 240 and tool errors at 300. His longest messages (pasted briefs, long rulings) are exactly the ones that lose their tail. Newlines become `⏎`, so a copied quote isn't his formatting.
- **Recommend:** never cap his lines (they are the payload); keep capping mine.

### G. Conflicts with the repo it runs in

- **The repo checker vs the skill.** `npm run handoff` said "❌ 1 blocking: commit them — a compact does not preserve a dirty tree"; the skill says never commit. The dirty file was `.claude/settings.local.json`, which his rules forbid committing. A less careful session could commit it to satisfy the checker.
- **Recommend:** say that a repo checker's blocking items are reported, never acted on unless his rules say otherwise, and name the never-commit files his rules list.
- **Duplicated records.** His decisions went into the handoff log and into the repo's own rulings file (`docs/claude/s4/2026-10-07-s4-button-system.md`), so there are now two places to keep in step.
- **Recommend:** if the repo keeps a decisions or rulings file, link it from the log instead of copying the quotes.
- **A small inconsistency:** the pass's last thought asks for a linksee caveat, while "Must not: edit anything except the handoff files and the pointer list" doesn't cover linksee.

### H. Edge cases the skill doesn't mention

- **A handoff larger than `read_smart` can return** (it happened here).
- **Two sessions preparing the same file at once:** both replace Current state in full and the last writer wins. The claim protects `/continue-session`, not two preps.
- **A cloud thread:** `.remember/`, the `/tmp` chunk files and the hard-coded local plugin paths may not exist.
- **Quotes from capped or collapsed lines** copied into the handoff as if they were exact.

### I. My mistakes in this run (so the skill can catch them next time)

1. **A thin pass.** My in-prep pass ran 4 thoughts with one real check (a heading map). It never looked outside the file, so the stale pointer line and the duplicated state block went unnoticed until this report's pass.
2. **I followed the template over my own measured practice.** I printed a `/compact` block with no DISCARD although my manual preps always carried one.
3. **I didn't verify the resume command existed** before printing it. It does, by luck rather than care.
4. **I split 14 historical sections mechanically.** The skill's rule allows it, but it rewrote records.
5. **I named the conflicts without explaining them.** The final message said the handoff was left uncommitted and named the dirty settings file, but didn't explain that the repo checker blocks on it while the skill forbids committing.

### J. Manual preps vs the skill

| | My manual preps | The skill |
|---|---|---|
| Compact focus | KEEP and DISCARD, 865–1,961 chars | the handoff named as the truth, plus what it lacks, under 600 chars; no DISCARD |
| Resume prompt | named the first actions (read X, check the server, confirm artifact versions) | `/continue-session <path>` plus two lines |
| His words | Haiku sidekicks, unchecked | an extractor plus a spot-check |
| State block | updated in place | a second block stacked above the repo's own |
| Budget and clock | from the hooks | measured from the transcript |

## think-pass, critiqued (it is also inlined in prep-handoff)

- **It works.** "Every thought ends in CHECK / CHANGE / DISCARD / ASK HIM" forced the checks that produced this report: the focus-vs-summary pairing, the 1,800-character cap, the stale pointer. "Leave the frame first" is exactly what my in-prep pass skipped. "Thoughts that don't count" kills recaps.
- **It costs a turn per thought.** "One tool call per thought, a CHECK between thoughts" is turn-heavy by design. At ~880k context every turn re-sends the whole transcript, and it collides with his "minimise turns, never calls" rule. **Recommend:** allow independent checks batched into one call between two thoughts. I did that twice and lost nothing.
- **It has no budget guard.** A 15-thought pass near the context limit can trigger a compact mid-pass, and the CHANGEs live only in context. **Recommend:** when the budget is tight, write each CHANGE to a file as it lands.
- **"No report"** is right as a default; "carry on with the work" correctly covered this case, where the work was a report.
- **The inlined copies** (`<!-- inline:src/think-method.md -->`) can drift if one is edited by hand. Fine if a build step regenerates them; worth confirming.

## Recommendations, ranked

1. **Replace, don't stack, the current-state block,** and add a rotation rule so the handoff stops growing. (A, C)
2. **Add an optional `DISCARD:` line to the `/compact` block** and raise the cap to ~1,000. (D)
3. **Ship a splitter** with no-loss assertions alongside `measure-parts.mjs`. (B)
4. **Skip or cheapen the extractor** on short same-session compacts, and budget the prep's own cost. (E)
5. **Stop capping his lines** in the chunker. (F)
6. **Say how to treat a repo checker's blocking items** and the never-commit files; link a repo's rulings file instead of copying quotes. (G)
7. **Let a session fix pointer-file lines its own workstream wrote.** (C)
8. **think-pass: allow batched independent checks; write CHANGEs to disk when the budget is tight.**
9. **A "verify the resume command exists" line,** and one check outside the edited files in the prep's own pass. (I)

## Sources in this session

- Transcript `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/844943ce-c876-4d3b-8d49-49821d96c923.jsonl`: compact pairs at rows 7252/7254 and 10569/10571.
- The run's output and the handoff log entry dated 2026-10-08 22:32 EDT in `docs/claude/s4/2026-10-02-s4-handoff.md`.
- Plugin scripts: `scripts/context.mjs` (the caps on lines 103–127) and `scripts/measure-parts.mjs`.
