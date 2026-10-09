---
kind: record
status: frozen
---

# continue-session: a field report from a real resume

*Written 2026-10-08 23:07 EDT by Session 4's lead (Dioreo, session `844943ce`), for the peer project that owns the `workstyle` plugin. Companion to [the prep-handoff report](2026-10-08-prep-handoff-field-report.md): that run wrote the handoff this one resumed from. Harkirat asked for it right after the first real run of `/workstyle:continue-session`, mid-resume. Every number below was measured in this session; anything reasoned rather than observed says so.*

## The run, in numbers

| | |
|---|---|
| What he typed | `/workstyle:continue-session docs/claude/s4/2026-10-02-s4-handoff.md` plus "Read ## Current state first, then go to its Next step (group 4, Inputs); Set end date / Never / Weapon required still wait on Harkirat's wash-or-tint call." |
| Session | the same session, right after its 8th compact; 1M window |
| Context | 214,985 tokens in use at the first call; 300,618 nine turns later, before any edit (+85.6k) |
| Handoff | 136,212 bytes, 816 lines, 83 `##`/`###` headings; Read first, Current state and Log are lines 10–79 |
| Read first | 5 files, 101 KB: rulings 36 KB, engine 26 KB, plan 18 KB, ledger 17 KB, conventions 5 KB |
| Steps reached | 1–8; the plan pass was at its 2nd thought when he sent this ask; the claim was checked (`blocking: false`) and not yet written |
| Edits before step 2 finished | none |

## Verdict

It does what he asked of it: in nine turns it aligned, loaded the tools, read, checked the ground and started the work, with no check-in. Its strongest parts are the ones that distrust the summary, and this resume proved them right: the summary said the report's final message "has not been sent yet", and the verbatim tail showed it had been. Its weak spots are where it keys on a label instead of the thing the label stands for, and where it reads too little of the state block and too much of everything else. One of them would have stopped this resume cold if I had followed it to the letter.

## What worked (keep these)

- **`his-words`.** Two lines, cheap, and it carries the `/compact` focus as a `COMMAND` line, so his last words reach the new context twice (the summary and this).
- **Step 7, "is the next step already done?"** The summary's own next step was already done (above).
- **No edit before step 2 finishes.** I made none.
- **"Do not stop to report."** No check-in prose. The harness posted "say in a few words what you're doing" three times; the Silent contract says to ignore it, and the skill's opening line backs that.
- **A short, concrete stop list and a Must-not list.**
- **The claim's liveness test** on the other session's transcript age, not only the claim's own age.
- **`allowed-tools`** pre-approving the read-only git, recall and clock calls.
- **The tool-load string** is the same as the SessionStart hook's, so the two never disagree.

## Findings

| # | Finding | Whose | Effect here |
|:-:|---|---|---|
| A | The stop rule keys on the `WAITING FOR HIM:` marker | skill + my prep | a literal follower stops |
| B | The read list skips Open, Done and Working lessons; "two log entries" were one run | skill | his newest rules sat outside the named sections |
| C | "Read the file whole" and every Read-first file, with no depth | skill | ~237 KB to read before step 3 |
| D | The ground check covers one repo and no ancestry | skill + my prep | a second repo's dirt went unseen |
| E | The claim is checked late and matched anywhere in the file | skill (script) | a ~9-turn window; a latent wrong match |
| F | Nothing for a new ask from him mid-resume | skill | judged by hand |
| G | The final message's required opening fights the Silent contract | skill | audit detail he called "useless to me" |
| H | First-word path parsing | skill | breaks on this repo's absolute paths |
| I | No way to notice a rule's missing input | skill + repo | the post-compact rename/cell gate never arrived |
| J | Fresh-session words: "last 60 lines" | skill | reasoned, not observed |
| K | My own mistakes | me | listed below |
| L | What the resume cost | skill + harness | +85.6k tokens in nine turns, no edits |

### A. The stop rule keys on the marker, not on whether the next step needs him

- The handoff's Next step ended with "WAITING FOR HIM: wash, tint, or own name for Set end date / Never / Weapon required." That question is not group 4's; it is a side call he hadn't answered.
- prep-handoff's template says to write that line "only if the step needs his decision". I broke that in the prep.
- continue-session stops on "a next step the handoff marks `WAITING FOR HIM:`". Followed to the letter, the resume stops and asks a question that does not block the next step. I went on only because his focus text said that call is a side wait.
- **Fixed in the handoff** after this run: the line is gone from Next step; the same call was already in Open as "His call:".
- **Recommend:** continue-session stops only when the next step itself cannot start without his answer, and treats any other `WAITING FOR HIM:` as a note for the final message. prep-handoff keeps that line for the next step's own wait and puts every other wait in Open as `His call:`.

### B. The read list skips the parts of Current state that carry his newest rules

- Step 2 names `### Next step`, `### Pending approvals`, `### Ground`, `### Claim` and "its newest two log entries".
- This Current state also has `### Done`, `### Done (2)`, `### Open`, `### Working lessons (his words today)`, `### Working lessons (2)` and `### Engine and tools`. His 22:30 rules ("multi headless is fine. just dont run them back to back and waste time"; "drop this [scroll check]") were in Working lessons and in the `/compact` focus, and in no section step 2 names. A follower reading only the four sections would have them only because the focus text repeated them.
- "Newest two log entries": the newest two `###` headings under Log were one run, split by prep-handoff's own 1,500-character rule (`… · compact · normal` and `… · compact · normal (2)`). Two headings, half the reach intended.
- **Recommend:** read `## Current state` whole and the newest log run, every `(n)` part of it, where a run is its stamp, not a heading count.

### C. "Read the file whole" doesn't fit a long-lived handoff; "every Read-first file" has no depth

- A strict reading of step 2 is the 136 KB handoff plus 101 KB of Read-first files: ~237 KB, about 65k tokens by bytes ÷ 3.6 (my estimate), before step 3.
- read_smart could not take the 135 KB handoff in the prep run (the companion report, finding A). "or search it with `ctx_search` if it is large" doesn't say what large is.
- What I read: the handoff from `## Read first` to `## Standing context` (11 KB) through `ctx_execute_file`; the conventions, the plan and the engine whole; the rulings' last 3.5 KB; the ledger as its 43 row ids. That still added 85.6k tokens over nine turns. Part of that is mine: I printed the handoff's log twice, and a 104-line slice of `spec.js` at up to 900 characters a line.
- **Two Read-first lists in context disagree.** `.remember/remember.md`, injected at the compact, names the handoff's Current state, the rulings and the batch-2 plan; the handoff's Read first names the conventions, the rulings, the spec-board plan, the ledger and the engine. The skill rightly follows the handoff's, but the pointer file still puts a second, different list in front of the reader.
- **The repo already has its own resume rule, and the skill doesn't defer to it.** This repo's locked linksee decision #84 (2026-10-08 13:40 EDT) says to resume with one default-relevance `ctx_search` per handoff source plus his words from the transcript; the skill says to read the file whole. I followed neither exactly (a ranged read).
- **Recommend:** read `## Read first` and `## Current state` by range, never the whole file past about 30 KB. For each Read-first file: whole under about 20 KB, else the part the next step names or its newest dated section. prep-handoff: the pointer file holds the pointer line and no read-first list of its own.

### D. The ground check covers one repo and doesn't use ancestry

- The Ground line names two repos: the main repo (HEAD `b1776637`) and Builder-2, a nested repo with its own git (HEAD `f786428`). Step 6 runs `git rev-parse` in the working directory only.
- Main repo: HEAD was `19b877f6`, one commit ahead (my own report, committed after the prep). Step 6's tests (the sha exists, the branch matches) pass and say nothing about the commit since.
- Builder-2: three PNGs modified and not in the Ground, dirty since 17:53 EDT through every Builder-2 commit after it. `magick compare -metric AE` gave 0.52, 0.20 and 0.03: render noise. Restored from HEAD after this run.
- The skill's `allowed-tools` pre-approves `git merge-base`, and no step uses it. An ancestry check looks intended and dropped.
- **Recommend:** for every repo the Ground names (`git -C <path>`): `git merge-base --is-ancestor <sha> HEAD`, then `git log --oneline <sha>..HEAD` and `git status --short`; every commit and change is accounted for by the log or its own message, and "accounted for" means checked, not guessed. prep-handoff: one Ground line per repo, each with its own uncommitted list.

### E. The claim is checked late and matched anywhere in the file

- Step 9 checks and writes the claim after reading and thinking: about nine turns and six minutes here. Two sessions starting together both pass, and his new message arrived while the handoff still said "released".
- `claim()` in the plugin's `context.mjs` matches the first `Claim: session …` line anywhere in the file. With Current state's line reading "released by …" (no match), any quoted active claim lower down (a log line, an example) would be matched instead. Today there is one Claim line (line 65), so this is latent.
- Every claim and release edits the tracked handoff, so `git status` is dirty after each resume and prep.
- **Recommend:** check the claim in step 2 and write the line in the same message; match only inside `### Claim`; either keep the claim in a gitignored sidecar or say that the claim line is expected dirt for the repo's carrier check.

### F. A new ask from him mid-resume isn't covered

- His "can you also critique and write a similar report for the continue-session skill" arrived at the plan pass's second thought.
- The harness says to hand the task to a new session. His standing rule says every new thread needs his explicit word. The skill says nothing. I did his ask here and resume group 4 after it.
- **Recommend:** "A new ask from him outranks the resume: do it here, then resume the next step; never start a new session without his word. If a pass was cut off, write one line first: paused at thought N, its subject, its next CHECK."

### G. The final message's required opening fights the Silent contract

- The skill: "Open with where things stand and what you did …: the handoff used, the ground, whether the next step was already done, the claim."
- The contract cuts how I worked down to one pointer, and he rated a compact prep's audit detail "useless to me".
- **Recommend:** one status table of at most four rows (handoff · ground · next step already done · claim), then the work.

### H. First-word path parsing

- "If the first word he typed is the path of an existing file": this repo's absolute paths start `/Applications/Claude Code/…` and split at "Claude". He typed a relative path, so it worked.
- **Recommend:** the longest leading part of the first line that is an existing file, or a quoted path.

### I. No way to notice that a rule's input never arrived

- This repo's post-compact rule is a `/rename` string plus one `Premise · Delib → Cell` from `.claude/hooks/self-check.sh`'s grid. The hook is registered on UserPromptSubmit and has a compact branch, yet no `[self-check]` or `[model-gate]` text arrived on either prompt after the compact; only the clock did. The transcript records a `hook_cancelled` for UserPromptSubmit on his first prompt after the compact and on both later ones, which fits its own comment about a 30-second UserPromptSubmit limit on a transcript that now holds 8 compacts (not confirmed beyond that).
- Step 3 says to follow the repo's rules; it cannot tell that a rule's input never came.
- **Recommend:** "If a rule needs a hook's output that isn't in context, follow the rule from its own text and say in one line that its input was missing." Whether `self-check.sh` times out on long transcripts is this repo's to check, not the plugin's.

### J. Fresh-session words (reasoned, not observed)

- "In a fresh session that command prints nothing": it prints the `/continue-session` line itself, since `COMMAND` lines are included (seen here).
- The fallback, `his-words --session <old id> --all` and "read the last 60 lines", is arbitrary for a long session.
- **Recommend:** `his-words --since <the log's Transcript covered ISO>`, so it reads exactly what the prep did not see. `chunks` already takes `--since`; `his-words` doesn't.

### K. My mistakes in this run

- The misplaced `WAITING FOR HIM:` and the Builder-2 dirt missing from Ground: both written by my prep.
- The claim not written before the plan pass began.
- Bash `sed -n` and `cat` reads against the repo's tool routing; linksee's anchor #35 fired twice within ten turns of the compact.
- The PNG diffs called accountable before they were measured.
- The handoff's log printed twice; one over-broad `spec.js` print.
- The first chapter mark only after the 20-turn nudge.
- A `cd` inside a Bash call moved the session's working directory (the harness reported it twice); step 6's relative `git` commands depend on it.

### L. What the resume cost, and how much of it was the skill

- **Context:** 214,985 tokens in use at the first call, 300,618 nine turns later, before any edit: +85.6k, about 9% of the 1M window.
- **What tools returned in those nine turns:** 128,106 characters, about 35k tokens at ~3.6 characters a token (my estimate). Roughly three fifths was what step 2 told me to read: the handoff slice, the Read-first files (the 26 KB engine alone is a fifth of it), the recall, his words and the claim. The other two fifths was my research for step 8's plan (the sweep scripts, `spec.js` slices, the board sources).
- **My own thinking and tool inputs:** 20,720 characters, about 6k tokens.
- **The remaining ~45k tokens** I can't attribute from the transcript: what the harness adds per turn (the six loaded tool schemas, hook reminders) and how it counts them.
- **The 215k floor is not the skill.** At the first call the context already held the instructions chain (the CLAUDE.md files, the working agreement, the memory index, two rules: 227 KB), every skill invoked earlier re-injected whole (73 KB), the tool, agent and MCP listings (59 KB) and the SessionStart hooks' output (64 KB). The workstyle share of the re-injected skills: prep-handoff's 19 KB and think-pass's 7 KB, beside continue-session's own 12 KB; the inlined method (~5.7 KB) rides in all three.
- **Compared with my manual resumes** (one `ctx_search` per source plus his words, the repo's rule #84): not measured this session; my estimate is 10–15k tokens.
- **Recommend:** make the default read cheap (B, C); give continue-session a short form of the method (the four outcomes, leave the frame, the stopping rule) and point at think-pass for the rest, or keep the full copy knowing that each post-compact context pays for it again.

## The inlined think-pass, as it ran here

- **"Leave the frame first" earned its place.** It found the three things outside the resume's own space: the second repo, the unused `git merge-base`, the missing hook output.
- **Checks batched into the thought's own message worked.** continue-session's inline copy lacks think-pass's "a CHECK is never folded into one" line, so the two skills already differ; the looser copy is the better one (the companion report's recommendation 8).
- **Two passes interleaved.** The method says to resume a cut-off pass but not to record where it stopped, so a compact between the two would lose the paused thoughts. Recommend the one-line pause note in F.
- **This pass:** ten thoughts; four CHECKs, five CHANGEs, one process thought. It stopped when the last thoughts found nothing new.

## What I fixed after the run

- The handoff's Next step no longer carries the side wait (A); the claim line is written (E).
- Builder-2's three noise PNGs restored from HEAD (D).
- A linksee caveat for the placement rule (A).

## Recommendations, ranked

1. **Stop on meaning:** stop only when the next step itself needs his answer; prep-handoff keeps `WAITING FOR HIM:` for that and nothing else. (A)
2. **Read all of `## Current state` and the newest log run;** never the whole file. (B, C)
3. **Check the ground in every repo the Ground names,** with ancestry and the commits since; "accounted for" means checked. (D)
4. **Claim in step 2,** matched under `### Claim` only. (E)
5. **Give Read-first a depth:** whole under about 20 KB, else the part the next step needs; the pointer file carries no read-first list of its own. (C)
6. **A new ask mid-resume:** do it here, resume after, and note where a cut-off pass stopped. (F)
7. **The final message opens with a status table** of at most four rows. (G)
8. **Paths with spaces.** (H)
9. **Say so when a rule's input is missing.** (I)
10. **`his-words --since`** for a fresh session. (J)
11. **Keep the post-compact cost visible:** a short form of the method in continue-session, and the read defaults above. (L)

## Sources in this session

- Transcript `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/844943ce-c876-4d3b-8d49-49821d96c923.jsonl`, from the 8th compact (2026-10-09 02:51 UTC) on.
- The plugin's `SKILL.md` for continue-session (12,145 bytes; its frontmatter's `allowed-tools`) and `context.mjs` (`claim()` and `hisWords()`).
- `docs/claude/s4/2026-10-02-s4-handoff.md` lines 10–79 as they stood at the resume; `.remember/remember.md`.
- `.claude/hooks/self-check.sh` (226 lines; the compact branch).
