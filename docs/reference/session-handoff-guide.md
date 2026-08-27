---
kind: reference
status: live
---

# Preparing a handoff or a compact — the whole procedure

**Written 2026-08-25 18:2x EDT, distilled from the compact prep at the end of the portal liveliness session.** Harkirat's ask: *"something frictionless that can be looked at and used to prep a handoff even at the last moment, with no needless/useless/repeated/unwanted testing and stuff bloating the context window more."*

**Use this when:** a compact is coming, the session is ending with work left, a task deserves its own session, or a model/effort change is warranted. The triggers themselves are in the memory `feedback_session_handoff_prompts`; this file is the *procedure*.

---

## The one idea this whole file exists to protect

🔴 **A handoff records THREADS, not events.** The failure mode is never "the summary was too short" — it is **a thread that is still LIVE gets dropped, and the next session confidently proceeds without it.** A chronological retelling of what happened is the wrong artifact; a list of what is still true and still open is the right one.

Corollary: **the most dangerous thing you can carry across a boundary is a stale green.** A verification you ran an hour and three commits ago reads identically to one you ran just now. Name it stale or re-run it — never quote it.

---

## ⏱️ START HERE IF A COMPACT IS ALREADY IMMINENT

Nothing else:

1. **Commit.** Clean tree.
2. **`sequentialthinking`: what is still OPEN?** Approved-but-unbuilt first, stale verifications second.
3. 🔴 **File the approved-but-unbuilt in `docs/db-deferred-list.md`** with a verify condition.
4. 🔴 **Run `/remember`.** It writes `.remember/remember.md`, which the `SessionStart` hook **injects automatically** — the only carrier that arrives without anyone knowing to look for it. Cheapest high-value step in the list.
5. **Write the post-compact prompt** with the FIRST ACTION at the top.

**Step 3 is the one that survives if everything else is lost** — and `.claude/hooks/outstanding-not-filed.sh` will block the Stop if you skip it, so it is the one step you do not have to remember. The rest of this file is the expansion; read on only if there is time.

⚠️ **Skipping the test suites is NOT skipping the completeness sweep.** Those are different things and only the first is optional — see the last section.

---

## The three carriers — and they are not equally reliable

A handoff is not one artifact. It is three, and **the most detailed one is the least reliable**, which is the opposite of the intuition:

| Carrier | Reach | Job |
|---|---|---|
| **`.remember/remember.md`** — write it with **`/remember`** | 🟢 **Auto-injected at every session start**, including after a compact. Arrives without anyone knowing it exists | ≤20 lines. The **pointer and the first action** — never the record |
| **`local/handoff/<date>-<topic>.md`** | 🟡 **Gitignored — so a DEFAULT `rg` and `--hidden` miss it, but `rg -uu` FINDS IT.** ⚠️ This row said "No `rg` reaches it, `-uu --hidden` included" until 2026-08-27 and that was FALSE, measured both ways | The exhaustive record: reasoning, rejected options, traps |
| **`docs/db-deferred-list.md`** | 🟢 **Tracked.** Survives compaction, a new session, a fresh clone, and being forgotten | Anything **approved but unbuilt**, with a verify condition |

🔴 **The rule that falls out:** the exhaustive file must be *pointed at* from at least one carrier that reaches on its own — `/remember`'s note, or a deferred-list item that cites its path. **A handoff nobody is told about is a handoff nobody reads.**

## ✅ How to know the handoff is DONE

Not "did I do the steps" — that is the checklist restating itself. Two falsifiable tests:

- 🔴 **Could a session that read ONLY this handoff produce the next commit without asking Harkirat a question?** It fails for exactly the right reasons: no stated first action, an unstated approval status, a dangling "we discussed X" with no resolution.
- 🔴 **Is every OPEN item marked approved-or-not AND built-or-not?** Two booleans per item. Miss either and the next session redoes approved work or builds something unapproved — **both have happened on this branch.**

---

## The six steps, in order

### 1 · Checkpoint FIRST, before writing a word

Get to a clean tree. A handoff written over uncommitted work describes a state that will not exist.

```bash
git status --porcelain | wc -l      # 0, or commit before continuing
git log --oneline -1
git rev-list --count origin/<base>..HEAD
```

⚠️ **Never write the HEAD or the commit count into the handoff as a fact to trust.** They rot within the hour — a previous handoff was stale on both before it was finished. Write the *commands*, and say so.

### 2 · The docs-gap check — one grep, not a re-read

Records almost always stop *before* the last hour of work. Pick a distinctive phrase from the most recent thing you built and grep the three records for it.

```bash
for p in '<phrase from the newest work>' '<another>'; do
  printf "%-24s %s\n" "$p" "$(rg -c "$p" docs/superpowers/mockups/.../COMPANION.md docs/CHANGELOG.md || echo 0)"
done
```

A `0` is a gap. Fill it before step 3 — a handoff that points at a record which does not describe the work is worse than no pointer.

### 3 · `sequentialthinking` — enumerate threads as OPEN or CLOSED

**This is the step that cannot be skipped or hurried**, and it is where the value is. Walk the session and put every thread in one of two buckets:

- **CLOSED** — shipped, committed, no follow-up owed. One line each, or a count. These exist so the next session does not redo them.
- **OPEN** — and for each: *approved or not? built or not? whose move is it?* Those three attributes are what the next session actually needs.

Then **attack the list**: what is missing? In practice the answer is almost always one of these four, and all four were nearly dropped the last time:

| Usually missed | Why it matters |
|---|---|
| **Approved-but-unbuilt work** | Reads as "discussed" and disappears. It is the highest-value thing in the file |
| **Stale verification** | A green you cannot honestly quote |
| **Corrections and friction** | A handoff that carries the work and drops the *friction* produces a session that repeats the friction |
| **Claims of yours that turned out WRONG** | Stated confidently, corrected quietly. Say them once, plainly |

### 4 · Shape it for the reader, not the writer

- 🔴 **§0 is THE FIRST ACTION.** One thing, at the top, unmissable. Everything else is reference.
- **Say which parts of the PREVIOUS handoff are now history.** A superseded item table gets re-executed otherwise.
- **Carry the techniques**, not just the outcomes — the probe that lies, the flag that renders a hidden state, the trap that fired three times.
- **Tables, not prose.** ~4+ items, or any item with more than one attribute.
- **Operational facts the environment forgets:** which server command, which browser, which port.

### 5 · Write the file — and file the OPEN work somewhere TRACKED

The handoff goes to `local/handoff/<YYYY-MM-DD>-<topic>.md` (see `reference_handoff_file_location`), and **`/remember` writes the short auto-loaded note that points at it** — see the three carriers above. Write the long file first, then `/remember`, so the note can name it.

🔴 **`local/` IS GITIGNORED, so a DEFAULT `rg` misses it — but `rg -uu` DOES find it.** Therefore:

> ⚠️ **CORRECTED 2026-08-27 13:5x EDT, and the old wording did real damage.** This file said *"No `rg` reaches it, `-uu --hidden` included"*, and one handoff spelled it out as *"not `rg`, not `--hidden`, not `-uu`"*. **Measured, both directions:** `rg -l 'THIRTEEN REJECTED DESIGNS'` returns **0** files; `rg -uu -l` on the same phrase returns **1** — `local/handoff/2026-08-25-portal-compact-I.md`. `--hidden` alone genuinely does not work, because `local/` is *gitignored*, not *hidden*; the claim conflated the two flags and generalised from the one that fails.
>
> 🔴 **AND THE CORRECT RULE WAS NEVER MISSING, WHICH IS THE REAL LESSON.** `~/.claude/CLAUDE.md` is auto-loaded into every session, states the flag rule with a measurement, and **names `local/` explicitly** as a directory a default search misses; `usage-guard.mjs` fires the same advice as a live hook. **The repo-local claim won anyway, for months.** A false SPECIFIC claim beats a true GENERAL rule because it is camouflaged as an EXCEPTION to it — *"these particular files are unreachable"* reads as domain knowledge from someone who checked, not as a contradiction. 🔴 **When a document says a rule you already hold does not apply here, TEST THE EXCEPTION, NOT THE RULE** — it is the higher-variance claim and usually the cheaper one to check.
>
> 🔴 **THE COST WAS THE PORTAL'S "WHAT REMAINS" QUESTION, REPEATEDLY UNANSWERABLE.** Sessions were told the exhaustive records were unsearchable, so they did not search them, so every residual list was assembled from the tracked subset — and came back confidently incomplete. On 2026-08-27 five separate design items were found existing ONLY in these files, after three forced `sequentialthinking` passes. **A false claim about a tool's reach is self-fulfilling: nobody tries, so nobody finds out.** The rule below still stands on its own merits — but it is a rule about REDUNDANCY, not about impossibility.
>
> ```bash
> rg -uu -n '<phrase>' local/handoff/          # this works; use it before concluding anything is untracked
> ```



> **Anything Harkirat APPROVED but that is not yet built must ALSO be filed in `docs/db-deferred-list.md`** — with a priority/effort tag, what to do, and **how to verify it is done**. A handoff is a letter to one reader; the deferred list is the project's memory.

✅ **This one is ENFORCED, so you do not have to remember it:** `.claude/hooks/outstanding-not-filed.sh` blocks the Stop when a message names something as outstanding and the turn touched no tracking list. ⚠️ **A gate proves a list was opened, never that the right thing was written in it** — the judgement is still yours. This is not optional bookkeeping. Work recorded only in a gitignored file is indistinguishable from work nobody noticed — the 2026-08-02 failure, repeated at the last compact and caught only by a hook.

### 6 · The post-compact prompt

Paste-ready, in **one fenced block**, containing:

1. Branch · HEAD · unpushed count · *don't ask about pushing*
2. **Read first, in this order** — the handoff (state that it is gitignored), the exhaustive record, the previous handoff with a note on what in it is history
3. **FIRST ACTION**, stated as an instruction
4. The approved-and-unbuilt list
5. **Conventions established this session** — these are the ones a fresh session violates first
6. Server / browser / working-style line

---

## Two checks that are worth the thirty seconds

**Before you hand ANYTHING over — critique it once, as if someone else made it.** Not after the reply comes back. The failure this catches is stopping the moment the literal complaint is addressed rather than when the design is right; three rounds in one session were spent on defects that were visible in what had just been sent.

**Anything you call "awaiting his review" must be something he can OPEN.** A localhost URL is not a deliverable. An Artifact, a committed file, or a path he can reach — otherwise it does not exist and saying it is waiting on him is false.

## Read the trackers; do not reconstruct the list

`docs/db-deferred-list.md` is the pending work. Reading it takes one command and it holds items from weeks back; a list assembled from what you remember covers the last few hours and quietly drops the rest.

```bash
rg -n '^- `\[P' docs/db-deferred-list.md
```

⚠️ **"Approved" means he said yes to a specific thing.** "Try it" is permission to explore. Writing the stronger word into a tracker manufactures a decision that was never made, and the next session builds on it.

## What NOT to do — the friction Harkirat named

| ⛔ Don't | Do instead |
|---|---|
| Re-run the full test suite "to be safe" | **Skip what you would not otherwise have run.** Same branch, same chat: the suites are unchanged. Note their state instead |
| Run every gate after a docs edit | **Run only the gate that CONSUMES what you changed.** Markdown cannot break `portal:gate`, `portal:refs` or `portal:roundtrip` — after a handoff/memory/tracker edit the only consumer is `docs:audit`. Ran the full set five times at this boundary; four were markdown-only |
| Re-run slow browser harnesses **whose last result was GREEN** | **Declare them stale in the handoff.** Nobody acts on a green, so not knowing costs nothing |
| ⚠️ …but **NOT if the change since that green could plausibly have broken them** | 🔴 **A stale green is safe; a stale RED is a landmine.** Run it. Two tool calls now, with full context, beats the next session hitting a failure cold and re-deriving why the change was made. The asymmetry is the whole rule — visual, layout, contrast or token changes since the last green mean RUN IT |
| Re-read files you have already read | The content is already in context. `git diff` shows what moved |
| `cmd \| tail` on a gate | Redirect, read the **exit code**, then slice: `npm test >/tmp/t.log 2>&1; echo $?` |
| One tool call per check | One batched command per pass. Independent checks share a call |
| Write a chronological narrative | Threads, OPEN/CLOSED, with attributes |
| Quote a count or a HEAD as fact | Write the command that derives it |

---

## The completeness sweep, when a handoff closes a session

If the turn also touched tracking lists or records, `.claude/hooks/completeness-sweep.sh` will demand passes 2 and 3. Run them in **one batched command**: external trees (`~/.config/dior`, the meta-deferred list, `~/.claude/settings.json`) · the memory store (`-u --hidden`, or gitignored paths stay invisible) · what moved text still *asserts* · the affected `*.test.sh` individually · `public/` only if a real site source changed. Changelog/DEVLOG-only changes are the **documented exemption** — those pages are withdrawn from the site nav, so a stale local build there is not a live gap.
