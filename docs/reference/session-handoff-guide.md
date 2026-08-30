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

🔴 **AND THE SECOND COROLLARY, PAID FOR 2026-08-28: A CLAIM THAT SOUNDS MEASURED IS THE MOST DANGEROUS THING YOU CAN WRITE.** Two arrived in one session, both in permanent files, both self-inflicted, neither caught by any gate:

- **A fabricated provenance.** `scripts/portalDiff.mjs` said its thresholds were *"picked by running the tool against the mockup versus ITSELF and widening until the first stayed empty."* That run had never happened. The numbers were judgement, dressed as an experiment, in the file whose purpose is to stop exactly that. *(It is now real: `--selftest` exists and reports 0.000%.)*
- **A sample generalised to a population.** A probe printed `widths.slice(0, 8)`, all eight came back 3px, and it was written up as *"37 marks, every one at its 3px floor"*, filed `[P1]`, and repeated into a handoff. The full set runs 3→894px. **The component was fine.**

**The rule: a number in a handoff names the population it came from, or it is not a number.** `slice()` in the probe means "of the first N", never "every". And if you did not run it, do not describe having run it — an unverified guess is recoverable, a fabricated verification is read as settled and never re-checked.

---

## 🔴 THE FIVE THINGS 2026-08-28 ADDED, AND WHY THIS FILE'S ORIGINAL SHAPE WAS NOT ENOUGH

*Added 2026-08-28 16:5x EDT, after a Part passed every gate, published its artifact, ticked its ledger, and was falsified by Harkirat in about two seconds of looking at the page. The handoff written for it would have propagated the error faithfully, because this guide's shape assumes the outgoing session's account of its own work is true.*

**1 · A HANDOFF NEEDS A "WHAT I GOT WRONG" SLOT, AT THE TOP.** The shape below is state → threads → next. That is a TRANSFER shape and it presumes the account is correct. When it is not, the handoff launders the error into the next session with a clean tone and a table. **§0 of a handoff is not the state — it is the correction, if there is one**, and it opens with the sentence that survives a bad compact summary: *if anything in your context says X is done, it is stale.* A summariser preserves confident tabular claims and compresses self-critical prose, so the retraction has to be the loudest thing in the file.

**2 · EVERY CLAIM OF A VISUAL OR RUNTIME OUTCOME CARRIES THE TIME OF THE RUN THAT PROVED IT.** Not "the Track is above the fold" — *"measured 16:4x at 1282×806, collapsed state; the expanded state has zero of five lanes visible."* The guide already says a stale green reads identically to a fresh one; the same is true of a stale LOOK, and a look is the thing least likely to be re-run. **Anything you cannot timestamp gets written as unverified.**

**3 · UNILATERAL DESIGN DECISIONS ARE A THIRD CATEGORY, and this guide only had two.** Approved-but-unbuilt goes in the tracked list because `local/` is gitignored — right, and incomplete. **A decision you made yourself, shipped, and nobody has reviewed is neither approved nor unbuilt.** Left only in a gitignored handoff, the next session cannot tell your taste from settled design, and will either re-litigate it or entrench it as though it were specified. **Those go in the tracked record too, named as yours, with the reasoning** — a decision nobody wrote down is a decision that gets re-opened, and after "use your judgement" there is no citation to point at but your own.

**4 · SAY WHAT NOT TO CARRY.** A handoff that carries everything carries nothing. Point at tracked records rather than reproducing them — the same no-duplicated-state rule as everywhere else, and a second copy of a critique will drift from the first. ⚠️ **And do not write the triumphant list.** The list of what landed is what a wrong session writes most convincingly; lead with what is NOT verified.

**5 · THE HANDOFF IS WRITTEN LAST — after the final gate run and the closing commit.** Written before them, it describes intentions, and the intentions are what get read as fact. This is the same rule as the plan's "the next Part's prompt is written AFTER the closing commit, not before."

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

## 🧭 SWEEP THE SURFACES A READER WILL MEET — NOT YOUR OWN MEMORY (added 2026-08-28 21:5x EDT)

**This is the root cause of every gap the 2026-08-28 handoff shipped with, and there were ten across two falsification rounds.** The handoff was written by asking *"what do I know that the next session will not?"* — which is a memory dump. It enumerates facts you are holding, and it is structurally blind to four things:

| Blind to | Because | What it cost that day |
|---|---|---|
| **Documents that are now WRONG** | You did not edit them, so they never entered your working set. **A method change invalidates descriptions elsewhere without touching a single one of their bytes.** | `CLAUDE.md`'s portal row still described the superseded method in confident detail — in the ONE file re-injected after every compact |
| **Obligations** | They are states of the world, not facts in your head | A published artifact left stale and misleading; a notes file flagged at session start and never opened |
| **Couplings** | You remember the VALUE, not the invariant that makes it mandatory | `--at` was "the default I picked" rather than "must equal the mockup's own `F.today` or the two sides silently desynchronise" |
| **Delivery ORDER** | It is a property of the system, not of your knowledge | The stale auto-injected handoff arrives first and the current one has to be opened |

**The replacement question is a SURFACE enumeration, and it is checkable where a memory dump is not.** Ask: *what will the next session read, in what order, and is each of those still true?*

1. **Auto-loaded, in arrival order** — `CLAUDE.md` (the only file re-injected after `/compact`) · `MEMORY.md` · the `SessionStart` hooks and the `.remember` handoff block · any `.claude/rules/*.md` whose `paths:` glob matches what will be touched.
2. **Opened on demand** — the live plan, the dated spec, `COMPANION.md`, `docs/db-deferred-list.md`, this guide, the handoff itself.
3. For each: **does it know, and is it now WRONG?** Wrong beats missing — it is authoritative and it arrives anyway.

🔴 **The document you did NOT touch is the likeliest to be wrong.** That is the same shape as the completeness sweep's downstream-heuristics pass, applied to prose instead of counts: a uniform change leaves every description of the old behaviour intact and reading as though it were current.

## 🔴 A STALE HANDOFF ARRIVES AUTOMATICALLY; THE CURRENT ONE HAS TO BE OPENED (added 2026-08-28 21:5x EDT)

**This is the failure the rest of this file cannot prevent, and it was found by falsifying a handoff that had just been called complete.**

The `SessionStart` hook injects a **LAST HANDOFF** block from `.remember`. It is whatever was written the last time `/remember` ran — which may be twelve hours and one method-pivot ago. Measured 2026-08-28: a block written at 09:15 was re-delivered **fourteen times** through an evening in which the entire working method changed, and it still told the reader that the method was *"inventory-diff then a relational probe"* and that *"Phase 4 is the EXAM"*. Meanwhile the current document sat in `local/handoff/` waiting to be opened.

**A stale carrier beats an absent one, because the reader does not know to distrust it.** Two rules follow:

1. **Write the current handoff so it can be told apart from the stale one, from inside the stale one's own framing.** Put a block at the very top that names the OLD handoff by its landmarks — the file it points at, a distinctive phrase it uses, the commit it calls newest — and says plainly that this file supersedes it. Do not write "read the latest handoff": a reader who has been handed a confident stale document does not know which is latest.
2. **If the pivot is bigger than the session, it does not belong only in a handoff.** A handoff is gitignored and session-scoped. A method change needs a **tracked** home — a dated spec, the plan's own procedure section, and a line in `CLAUDE.md`'s navigation map, which is the only file re-injected after a compact.

⚠️ **And check the always-loaded surfaces for a description that is now WRONG rather than merely missing.** The same pass found `CLAUDE.md`'s portal row still describing the superseded method in full confident detail — worse than a gap, because it is authoritative and arrives in every session.

## ✅ VERIFY THE CARRIERS; DO NOT ASSERT THEM (added 2026-08-28)

A handoff that says "everything is written down" is a claim like any other. The 2026-08-28 pass made exactly that claim and a falsification run found **six** gaps in it, two of them hazards. What actually settled them was four greps and a `git log`, not recollection:

- `git log --oneline --all -- <new-file>` — **a clean tree proves nothing is UNSTAGED, not that a new file entered a commit.**
- `rg -c '<the new idea>' <every tracked doc that ought to know>` — and read WHICH line matched; a single incidental hit reads identical to real coverage in a count.
- Check that a constant the method depends on is where you think it is. One such check turned a vague worry into a hard requirement: the mockup's `today` is a fixture constant, so the frozen clock must match it or the two sides silently desynchronise.
- Ask what is an **obligation** rather than a fact — a published artifact now stale, a notes file never opened — because those vanish without trace and no diff shows them.

## The three carriers — and they are not equally reliable

A handoff is not one artifact. It is three, and **the most detailed one is the least reliable**, which is the opposite of the intuition:

| Carrier | Reach | Job |
|---|---|---|
| **`.remember/remember.md`** — write it with **`/remember`** | 🟢 **Auto-injected at every session start**, including after a compact. Arrives without anyone knowing it exists | ≤20 lines. The **pointer and the first action** — never the record |
| **`local/handoff/<date>-<topic>.md`** | 🟡 **Gitignored — so a DEFAULT `rg` and `--hidden` miss it, but `rg -uu` FINDS IT.** ⚠️ This row said "No `rg` reaches it, `-uu --hidden` included" until 2026-08-27 and that was FALSE, measured both ways | The exhaustive record: reasoning, rejected options, traps |
| **`docs/db-deferred-list.md`** | 🟢 **Tracked.** Survives compaction, a new session, a fresh clone, and being forgotten | Anything **approved but unbuilt**, with a verify condition |

🔴 **The rule that falls out:** the exhaustive file must be *pointed at* from at least one carrier that reaches on its own — `/remember`'s note, or a deferred-list item that cites its path. **A handoff nobody is told about is a handoff nobody reads.**

## 🔴 JUDGEMENT DOES NOT COMPRESS — CARRY A POINTER, NEVER A PARAPHRASE (added 2026-08-30 15:1x EDT)

**The mechanism, paid for over three sessions:** every handoff keeps the LOOP — commands, thresholds, traps — because mechanics compress cleanly. Every handoff drops the PRECEDENCE — which artifact is the design, which way a difference gets closed, what a number does and does not mean — because judgement does not survive compression. The next session inherits a procedure with no arbitration, runs it faithfully, and produces the failure the authoritative document already warned about. **Part 1 of the portal conformance pass was declared finished three times by exactly this route.**

- 🔴 **A handoff may carry a POINTER to a precedence rule. It may never carry a paraphrase of one.** The paraphrase is what gets trusted; the pointer is what gets followed. On 2026-08-30 a session rediscovered the plan's §0.1 the hard way — after reproducing three of the design's own defects — because its inherited handoff carried the five-section loop and not the one sentence saying *a diff region is never evidence the mockup is right*.
- 🔴 **A handoff is NOT where a contradiction between two authoritative sections gets resolved.** That resolution belongs in the document that holds them. The same session found §0.1 and §0.6 in genuine tension and nearly reverted the newer of the two — from a handoff, without knowing the other existed.
- 🔴 **If a rule is checkable, it does not belong in the handoff at all — it belongs in a tool or a gate.** This repo's own record is unambiguous: every rule that became mechanical stuck (`--selftest`, the coverage line, the backtick gate, the orphan gates); every rule that stayed prose was re-violated. **Writing "remember to X" into a handoff is putting the reminder inside the artifact that drops reminders.**

---

## 🔴 FOUR RULES A READ-ONLY AUDIT PROVED, 2026-08-30 15:4x EDT

*A Sonnet subagent was given only what a post-compact session auto-loads — CLAUDE.md, SESSION-START.md, MEMORY.md, `.remember` — told to continue the work, and told to report every place it could not. It scored the package **6/10** and found four defects that every human check that day had missed.*

- 🔴 **NEVER CARRY A NUMBER A TOOL CAN PRINT.** The handoff carried reference sizes (192KB, 99.6KB…) that **already disagreed with the tool** (186KB, 96KB) because they were measured by a different method at a different moment. Neither carrier said which was authoritative, so a third measurement would have produced a third set. **A number in a handoff is a claim about a tree that no longer exists.** Carry the COMMAND; let the reader re-derive.
- 🔴 **A GREEN SUITE IS A CLAIM ABOUT A COMMIT, AND YOU MUST RE-RUN IT IN THE COMMIT THAT ADDS A SCRIPT.** `.remember` said *"Floor green at `02c7df5`"*. True — and eight commits stale: a script added in HEAD had unreflowed comments and `npm test` was **RED** while the handoff advertised it green. **The suite must be re-run and re-anchored in the same commit that adds or edits any script**, or the handoff ships a false green — the single most dangerous thing a compact can carry.
- 🔴 **FIXING A THING AND CLOSING ITS FILING ARE TWO SEPARATE ACTS, AND THE SECOND IS THE ONE THAT GETS SKIPPED.** A test fix landed at 13:21; a handoff written at **13:47** still listed it as a live failure, and the tracked entry sat open for three hours. **Before writing a handoff, re-read every OPEN item you touched this session and ask whether it is still open** — not whether you remember closing it.
- 🔴 **ONE NEXT ACTION, DERIVED — NOT TWO CARRIERS POINTING DIFFERENT WAYS.** The plan's rule said *finish the realm you are in*; the handoff's ordering put the next realm first. A fresh session cannot derive which, so it guesses or asks — and the audit's answer to *"could you produce the next commit without asking?"* was **no, for that reason alone.** If the plan states a rule that settles the order, the handoff must follow it or say why it does not.
- ⚠️ **AND SECTION NUMBERS MUST BE UNIQUE IN THE DOCUMENT THEY POINT INTO.** Three numbers were used twice each in the governing plan, so "read §0.5" resolved to two unrelated sections — a session could read the wrong one and believe it had complied.

🔴 **THE GENERAL RULE BEHIND ALL FIVE: A HANDOFF IS A SET OF POINTERS AND STANDING ORDERS, NOT A SNAPSHOT.** Everything that can go stale — numbers, suite status, item status, ordering — either gets re-derived by a command the handoff names, or it is a lie waiting for a reader. **The cheapest test of a handoff is to hand it to a read-only agent with no transcript and ask it to continue the work, then fix everything it cannot do.** That test costs one subagent call and found in twelve minutes what a day of self-review did not.

---

## 🔴 THE COMPACT-PREP AUDIT — COPY THIS, DO NOT RE-INVENT IT (added 2026-08-30 16:5x EDT)

**Run this BEFORE saying a compact is ready. It is the last step of compact prep, not an optional extra.** It found four defects on its first run and five more on its second — on a package that had already passed a full day of self-review, twice. **Every rule above this line was written by an author who then violated it within the hour; this is the only check that does not depend on the author.**

⚠️ **Run it AGAIN after fixing what it finds.** The second run scored the same 6/10 as the first: the fixes were half-fixes — applied to `.remember` and not to the plan the carriers point at, and disambiguating three duplicate section numbers without sweeping for a fourth. **One round is not enough, and "I fixed what it said" is exactly the instance-not-class failure.**

```
Agent(subagent_type: "general-purpose", model: "sonnet", run_in_background: false, prompt: …)
```

**The brief, which is the part worth keeping verbatim:**

> You are a STRICTLY READ-ONLY auditor. No edits, writes, deletes, git writes, or `--write` flags. `rg`, `cat`, `sed -n`, `git log/show/diff/status`, read-only node, `npm test`, `docs-audit` are fine.
>
> Simulate a FRESH session that has just been through a `/compact`. You have NO transcript. You get only what auto-loads: `CLAUDE.md`, `docs/SESSION-START.md`, the memory index, `.remember/remember.md`, plus what those four explicitly point to. **Your task: pick up the work and continue it. Then report every place you could NOT.**
>
> Answer concretely, citing file+line or saying NOTHING told you: what is the single next action, and is it derivable or a guess? · what is DONE vs OPEN? · name the exact command to measure, to diagnose, and to see what is already known · what do the instruments NOT see? · what has been TRIED AND RETIRED that you would wrongly re-propose? · **find every place two carriers disagree, every number that appears twice with different values, every claim stale relative to HEAD** · resolve every backticked path, every command, every `§n` — report each that fails · is anything presented as verified that was not? · **could you produce the next commit without asking a question?** · what would you WRONGLY do with confidence? · what exists in the repo that you needed and were never pointed to? · rate 0–10 and say precisely what is missing for a 10.
>
> Be blunt, most severe first: what is wrong, which file, the smallest concrete fix. Say "unverified" rather than assuming. On a re-run, **verify each previous fix actually holds and report what the fixes BROKE or missed** — do not trust the fix commit's diff, re-derive from scratch.

🔴 **WHY IT WORKS AND SELF-REVIEW CANNOT.** The author knows what the words meant; the auditor only has the words. Every defect both runs found was invisible from the inside — a stale green looks like a green, a fixed-but-open filing looks fixed, two numbers from two methods look like one number, and your own ordering looks like the ordering. **It costs one subagent call and about twelve minutes.**

---

## ✅ How to know the handoff is DONE

Not "did I do the steps" — that is the checklist restating itself. Two falsifiable tests:

- 🔴 **Could a session that read ONLY this handoff produce the next commit without asking Harkirat a question?** It fails for exactly the right reasons: no stated first action, an unstated approval status, a dangling "we discussed X" with no resolution.
- 🔴 **Is every OPEN item marked approved-or-not AND built-or-not AND filed-or-not?** Three booleans per item. Miss the first two and the next session redoes approved work or builds something unapproved — **both have happened on this branch.** Miss the third and it cannot tell which items survive the handoff being lost.
- 🔴 **The reader test is CHEAP TO AUTOMATE and should be.** A ~30-line script that (1) resolves every backticked path, (2) `git cat-file -t`s every commit hash, (3) checks every `§n` against the document's own headings, and (4) re-derives any claimed commit count from its stated range, found two real defects in checkpoint-X in one run. ⚠️ Its false positive was instructive too: a `§16.31` belonging to another document read as a missing local heading, which is the provenance rule below.
- 🔴 **Did a reader test actually RUN, against the filesystem?** Not a re-read — a pass that opens every path, resolves every section reference, executes every command, and re-runs the document's own headline measurement. On 2026-08-27 that pass found **two blockers in a handoff written by the session that had just spent the day fixing this exact defect class**, including a measurement that had been silently invalidated by the act of writing it down. See §3b.

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

### 3b · The seven ways a handoff misleads a reader who TRUSTS it

*Every one of these was found by a reader test on `2026-08-27-portal-checkpoint-IX.md` — a handoff written carefully, by someone who had just spent a session fixing this exact class of defect. **The reader test is not optional polish; it is the step that catches what care does not.***

| # | The failure | Why it survives review | The convention |
|---|---|---|---|
| 1 | 🔴 **A quoted probe CONTAMINATES ITSELF** | The measurement was true when run and false an hour later — **because writing it down put the probe string into tracked files.** A reader who verifies it (as the doc trained them to) sees it refuted and concludes the opposite of the truth | **Never quote a probe string as a permanent fact.** Give the reader a *command* and an *invariant shape*, and say the probe is disposable: *"if this stops returning 0, pick a fresh phrase — and here is why it would"* |
| 2 | 🔴 **Two counts of the same thing, in one document** | Each was written at a different moment and both looked right in isolation. Reconciliation is the reader's problem, and a wrong count mis-calibrates how much they distrust | **State the structural rule, not the number** — `feedback_no_duplicated_state_in_prose`. *"Many older handoffs say this; any of them saying it is wrong"* needs no maintenance |
| 3 | 🔴 **`A..B` EXCLUDES `A`** | A range copied from the first row of your own table is off by one, and a later commit silently makes the other suggested command off by one the other way | **Run the range and count the rows before writing it.** `git rev-list --count <range>` must equal the number of rows in the table |
| 4 | 🔴 **`npm run <script> --flag` silently swallows the flag** | npm reads it as a config option, the underlying script runs with its default, the gate fails again, and the reader loops | **`npm run <script> -- --flag`**, or call the script directly. Any npm invocation with a flag in a handoff needs the `--` |
| 5 | 🔴 **An open-work table that is not the whole open list** | Other carriers hold open items — the tracked deferred list, and the *previous* handoff's own still-open rows. A reader treating one table as complete drops them silently | Add a **`Filed?` column** so a reader can tell tracked from handoff-only, and **name the previous handoff's still-open sections explicitly** rather than calling it "mostly history" |
| 6 | 🔴 **A section reference with no path** | `COMPANION §5.9z.6` is unambiguous to the writer and a search problem for the reader — in a document that is often *about* findability | **Every cross-document reference carries its full repo path.** If it is served over HTTP, give the URL that actually works, including which server roots where |
| 7 | 🔴 **The handoff is right and an AUTO-LOADED file is wrong** | The reader hits two authorities and the always-loaded one looks more official, so the correction loses | **Fix the auto-loaded file in the same change** (`CLAUDE.md`, `MEMORY.md`, a rules file), then note in the handoff that you did |

🔴 **AND THE META-RULE THE LIST ITSELF DEMONSTRATES: run the reader test, and run it against a real filesystem.** Ask *"could a session that read ONLY this produce the next commit without asking a question?"* — never *"is this good?"*. Verify every path, every section reference, every command, and **re-run the document's own headline measurement**. That last one is what caught defect #1, and nothing else would have.

### 3c · Six more, from a reader test on a PLAN — and every one applies to a handoff

*Found 2026-08-27 21:1x EDT by an `anthropic-skills:doc-coauthoring` reader test on `docs/superpowers/plans/2026-08-27-portal-conformance.md`. It verified all 31 paths and every section citation clean, then checked 32 factual claims and found **12 wrong**. These six are the transferable ones. **They are a different family from §3b's seven: those are about what a reader MISREADS; these are about what the WRITER cannot see about their own document.***

| # | The failure | Why it survives the writer's own review | The convention |
|---|---|---|---|
| 1 | 🔴 **THE OPENING SECTION IS THE STALEST PART OF ANY DOCUMENT WRITTEN WHILE THE WORK CONTINUES** | The thesis is written first, then hours of work happen underneath it, and nobody re-reads the top. **Measured: a plan's §0 — the section titled "the one thing that explains the rest" — was 60% false, and the same document contradicted it correctly 300 lines below.** Two of its five rows described defects the same session had fixed hours earlier | **Re-read your opening claims against source LAST, immediately before shipping.** The later sections are fresh; the first one is the one that has been rotting the whole time |
| 2 | 🔴 **YOUR OWN WORK FROM HOURS AGO IS NOT EXEMPT FROM VERIFICATION** | "I fixed that myself this evening" feels like the strongest possible evidence, so it is the claim least likely to get checked — and it is a memory of an intention, not a reading of the file. Both stale rows above were the writer's own fixes | A status you assert about **your own** recent work is still a claim. `rg` it like anyone else's |
| 3 | 🔴 **A CITATION THAT RESOLVES IS NOT A CITATION THAT IS CURRENT** | Reader tests check that `§16.31` *exists*. **`§16.31a` existed too, was added the same day, and retired the exact clause being quoted** — so the document instructed a session to re-introduce a deliberately removed behaviour, citing a heading that was really there | **Before citing a section, grep for its own number plus a letter or a higher sibling** (`§16.31a`, `§16.32`). A section that reads as settled may have been disowned an hour later, in the same file |
| 4 | 🔴 **A "PROVE IT ON A KNOWN CASE" CRITERION IS ITSELF A CLAIM** | It is written to make an instrument trustworthy, which makes it feel like the safe part. **Measured: a plan demanded its scanner report `t-best` as unemitted — while the same paragraph demanded a concatenation-aware scanner, which correctly will not, because `t-best` IS emitted.** The two requirements could not both be satisfied, so the instrument would have been declared broken on its first correct run | **Verify the known case is TRUE before making it the falsifier.** A falsifier built on a wrong premise is worse than none: it fails the tool for being right |
| 5 | 🔴 **A SHELL PATTERN THE SHELL EATS MATCHES NOTHING, AND EMPTY READS AS ABSENCE** | The command runs, exits 0, prints nothing, and "no matches" is indistinguishable from "no such thing". **The claim "confirmed by hand" above came from an `rg` whose backtick pattern the shell interpreted before `rg` ever saw it** | This is *"prove the probe can report PRESENCE"* one level down. **Run the pattern against a string you KNOW matches** before trusting an empty result — especially any pattern containing a backtick, `$`, or `!` inside double quotes |
| 6 | 🔴 **AN INSTRUCTION WITH NO NAMED OUTPUT IS ONE NOBODY WILL DO** | It reads as a real step and cannot be audited. **The plan called one phase "the most valuable step" and gave it the only phase with no deliverable**; elsewhere it said an item was "filed" and never named where. The same document had already written *"'I walked every sub-panel' is unfalsifiable prose; fourteen frames is a claim he can check by counting"* — and applied that standard to exactly one step | **Every mandatory step names an artifact**: a file it writes, a table it fills, a URL it produces. If you cannot name one, the step is a wish |

⚠️ **And one scoping rule from the same test, worth a line because it fails silently in both directions:** a scan over "the source" must **state its scope** when the tree holds duplicates. This repo carries four copies of `app.css` and six of `track.logic.js` across build output, an SSR directory and two worktrees — so an unscoped scan finds phantom emitters and a wrongly-scoped one misses the real files, and neither says so.

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

## 🔁 §4 · The working CADENCE — the half of a handoff that keeps getting dropped

🔴 **A handoff that transmits STATE and WORK but not CADENCE produces a session that rediscovers how to work, every time.** Measured 2026-08-27: Harkirat issued **seven** corrections in one afternoon and **at least four were cadence, not knowledge** — how many turns a check costs, when to run a gate, which batch tool exists. None of them was about the portal. A handoff carrying this section would have prevented all four.

🔴 **A correction he had to issue TWICE goes into the handoff VERBATIM, with its parenthetical.** He said *"stop wasting turns on intermediate tests"* and had to repeat it as *"did i literally say to stop wasting turns on intermediate tests and to save them for large checkpoints (that means completing an entire unit of work, not completing 1 component on a page.)"* — **the parenthetical is the whole content**, because the first phrasing left "checkpoint" undefined and I read it as "component". A paraphrase loses exactly the part that was added to make it land.

**What this project means by a UNIT, since that word was the ambiguity:**

| | |
|---|---|
| A unit IS | a whole realm brought in line with its design · a whole feature end-to-end (route **+** UI **+** fixture **+** CSS **+** the shared map that registers it) |
| A unit is NOT | one component · one selector · one label · one subtitle |
| Gates run | at the END of a unit, before its commit — **never between edits inside one** |
| The one legitimate mid-unit build | `node -e "require('./scripts/buildPortal').build()"` alone, when you need to LOOK at the page. Not the suite. |

⚠️ **The boundary, or this becomes the opposite failure:** batch without limit *within* a unit; never span two units in one unverified batch, because an unattributable failure costs more turns than the batching saved.

**Name the batch tool you used, and the one you did not know about.** `mcp__Claude_Browser__browser_batch` takes a LIST of browser actions in one call. `/chrome-devtools-mcp:chrome-devtools-cli` exposes the same tools as a **shell** command, so a whole browser sequence becomes one Bash call — ⚠️ it was **not on PATH** on 2026-08-27 and needs the one-time install documented in that skill's own installation reference, under the plugin cache in `~/.claude/plugins/`; a session that runs it, sees `command not found` and gives up has rediscovered nothing.

🔴 **And carry any METHOD that beat the obvious approach.** The one found 2026-08-27, which took a full portal-vs-mockup comparison from ~13 navigations to **2 calls**: the portal is an SPA, so ONE `evaluate_script` walks every realm with `location.hash` + a sleep and returns a structured inventory (headings, tab labels, stat keys, chip labels, column headers, computed topic colours, which slot each block sits in); and the mockup pages are **same-origin**, so ONE more script loads all six into hidden IFRAMES and extracts the identical shape. Diff two JSON blobs and reason over a LIST instead of a screenshot. ⚠️ **The diff is EVIDENCE, never a verdict** — eight tracker rows across two sessions have been portal-*ahead* — so every line still needs adjudicating against the design record before it becomes an edit.

## Name the ARTIFACT every measurement came from — and the DOCUMENT every section number is in

⚠️ **Harkirat had to ask *"is that screenshot of the mockup or the wired in portal?"*** — a reasonable question, about a screenshot whose filename said `mk-` and whose prose said nothing. **A number or an image without its provenance teaches a fact that cannot be checked**, and on this project the two artifacts look almost identical by design. Prefix the files (`mk-` mockup, `pt-` portal), and say which one in the sentence, not only in the path.

⚠️ **The same rule applies to SECTION NUMBERS: a bare `§16.31` does not say which file it lives in.** The 2026-08-27 reader test flagged one as a missing heading in the handoff itself — a false positive that is really this rule, one level up. Write the path with the section the first time it appears, and say plainly which numbers are local and which belong to another document.

🔴 **AND A SECTION NUMBER CARRIES A DATE IT DOES NOT SHOW.** `COMPANION §16.31` resolves, reads as settled, and was **disowned an hour after it was written** by `§16.31a` directly beneath it. A citation check that only asks *"does this heading exist?"* passes both. **Before quoting a section, look at what follows it** — a suffixed sibling (`a`, `b`) or the next number is where the correction lives, and on this project that correction is often the whole point.

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
