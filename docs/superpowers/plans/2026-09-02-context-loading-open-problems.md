---
kind: plan
status: live
---

# Two unsolved context-loading problems — handoff for a fresh session

*Written 2026-09-02 21:00 EDT at Harkirat's instruction, after he rejected both of my answers as patches. This document exists so the next session does not have to re-derive anything I measured. **It contains no approved solution.** Both problems are open, and the two "fixes" described below are recorded as REJECTED so they are not accidentally rebuilt.*

> 🔴 **READ THIS FIRST.** Harkirat's verdict, verbatim, 2026-09-02 20:57 EDT:
> - On the `MEMORY.md` trim: *"that's a terrible solution... that's partially loading a memory which a session might assume is the entire memory line and won't bother looking for the remainder of it. The entire point some of those index lines were expanded was because session would read the smaller index line and then not comply with that memory because they concluded their reasoning based on the smaller memory index line. Your entire memory.md trim seems to have been an easy-out, lazy, unthoughtful patch job which causes more issues similar to what we've faced in the past."*
> - On the rules-loading pointer hook: *"your 'rules dont load' solution is a copout that solves nothing."*
>
> He is right about both. Do not defend either. The job is to find real solutions.

---

## PROBLEM 1 — `MEMORY.md` cannot hold what it needs to hold

### The platform constraint, quoted exactly

From `docs.claude.com/en/docs/claude-code/memory`:

> *"The first 200 lines of `MEMORY.md`, or the first 25KB, whichever comes first, are loaded at the start of every conversation. Content beyond that threshold is not loaded at session start."*

And:

> *"Claude Code doesn't load topic files such as `user_role.md` or `feedback_testing.md` at startup. Claude reads them on demand using its standard file tools when it needs the information."*

**So: exactly one file in the memory store is auto-loaded, it is capped at whichever of 200 lines / 25,000 bytes comes first, and everything else is invisible until something decides to read it.**

### The state before this session

| | |
|---|---:|
| `MEMORY.md` | 35,147 B / 185 lines |
| Byte cut landed at | **line 127** |
| Lines that never loaded | **58** (45 of them index entries) |
| Sections entirely dropped | *Cost, tools & routing* · **Working with Harkirat** · *Trackers & conventions* · *Docs & memory structure* |

The dropped set included the section root `CLAUDE.md` tells every session to read first.

### What I did, exactly

A Python pass over `MEMORY.md`, in commit `28c3c0bb` — ⚠️ **that is where the trim happened, not where the branch is now.** It was reverted several commits later; `28c3c0bb` is history, and HEAD is many commits past it. What follows describes the rejected change, so you can recognise it, not the current file:

1. **Lifted `SILENT MODE`** (~5,335 B) out of the index into `.claude/rules/silent-mode.md`, a `paths`-less rule that loads unconditionally at launch. *(This part is fine and is verified working — see the Verified Facts section.)*
2. **Truncated 79 over-long index entries.** For each line matching `- [Title](file.md) — hook` longer than 165 characters:
   - kept `- [Title](file.md) — <first ~165 chars of hook>`, cutting back to the last `. ` / ` · ` / ` — ` / space boundary above offset 40
   - appended the remainder to the topic file the line already points at, under a heading `## Index-line detail, moved 2026-09-02 15:55 EDT`, as `- **Title** — <tail>`
   - skipped any line whose tail would be under 25 characters

Result: **22,230 B / 151 lines**, inside both limits. `memory-index-check.sh` reports `ok`, and its budget was lowered from a self-chosen 40,000 to the platform's own 25,000.

### Why it is wrong

**A truncated index line reads as a complete one.** There is no marker saying "this continues elsewhere." A session reads `— the costliest shape: using the instrument/rule/fix that RESEMBLES the` and has no signal that a sentence was cut mid-clause, let alone that the operative half is in another file it will never open.

**And this is a known, already-paid-for failure.** Harkirat's account: those lines were *expanded* precisely because sessions read a short index line, reasoned from it, and failed to comply with the memory it summarised. The trim reverses a deliberate correction. `project_memory_index_scaling.md:34` carries a matching lesson in the other direction — *"line-trimming is spent" turned out to be FALSE* — showing the trimming lever has been argued about before and got the opposite verdict each time.

**The cut points are mechanically dumb.** The example above splits `RESEMBLES the / requirement.` — grammatically mid-phrase. 12 entries still exceed 165 characters; median is now 155.

### ✅ REVERTED 2026-09-02 21:03 EDT — what the reconstruction actually did

Harkirat's instruction: *"reconstruct them and temporarily add back the *corrected* force import of the memory.md."* Both done.

| | |
|---|---:|
| Tails collected from topic files | **79**, across 74 files |
| Index lines restored | **79** (0 orphaned) |
| Appended `## Index-line detail` sections removed | **74** |
| `MEMORY.md` now | **~30.5 KB / 151 lines**, median entry 198, max 683 |
| Line count vs pre-trim | 152 = 185 − 33, exactly the `SILENT MODE` block that stays lifted |

⚠️ **ONE COSMETIC LOSS AT 49 OF THE 79 JUNCTIONS.** The trim stripped the separator from BOTH halves, so which glyph sat there is unrecoverable. 30 tails begin lowercase and were rejoined with a space (mid-sentence, exact). The other 49 sat after a `. `, ` · ` or ` — ` and were rejoined with ` · `, this index's dominant separator. **Content is exact everywhere; the glyph at those 49 points is a best guess.**

🔴 **AND THE `@`-IMPORT IS BACK, CORRECTED — AND MEASURED INERT ANYWAY (2026-09-02 22:27 EDT).** `CLAUDE.md` line 6, absolute path, no tilde, below the frontmatter — the two things that broke it before, both genuinely fixed. **It still does not load.** `local/instructions-loaded.jsonl` holds **zero** `include` rows for `MEMORY.md` across the four session starts since 21:03 EDT, while `RTK.md` (parent: the *user-level* `CLAUDE.md`) produced one in each. The session of 2026-09-02 22:27 EDT received the first 25,000 B from the loader — cut inside line 124 of 151 — plus the last 27 lines from `memory-index-check.sh`'s fallback, and nothing from the import. **So the mitigation is the delivery mechanism and the import is decoration.** Two candidates survive: **(a)** the harness will not `include` a path it already loads as auto-memory, or **(b)** a project-level `CLAUDE.md` does not expand imports at all — every `include` ever recorded, in all six logged sessions, has the user-level file as its parent. ✅ **ANSWERED 2026-09-02 23:44 EDT, AND THE ANSWER NARROWS THE PROBLEM TO ONE SENTENCE.** The probe ran: a second `@`-import of a small tracked file was added to the project `CLAUDE.md`, and the next two session starts each logged an `include` row for it whose `parent_file_path` is that file. **Project-level imports expand.** ✅ **SETTLED AND FIXED 2026-09-03 00:08 EDT.** The cause was an ungranted permission: an external `@`-import from a non-User-scope `CLAUDE.md` is gated behind `hasClaudeMdExternalIncludesApproved`, which was `false` here — with `hasClaudeMdExternalIncludesWarningShown` also `false`, so nothing ever surfaced it. **RESOLVED 2026-09-03 00:08 EDT: external includes are APPROVED for this project** (`hasClaudeMdExternalIncludesApproved: true` in `~/.claude.json`, set for the repo and its eleven worktree entries), so the `@`-import in the PROJECT `CLAUDE.md` is the mechanism now. ⚠️ It must never live in the global `~/.claude/CLAUDE.md` — that file loads in every repo, so it would import this project's index into every unrelated project. Verify with the `MEMORY-INDEX-END` sentinel, never by assuming. 🔴 **Two earlier answers in this document were mine and both were wrong in the same shape — a plausible mechanism narrated over a value I never checked.** The first inferred a dedupe from `zero include rows` in a log whose `memory_type` enum has no auto-memory value, so it was blind to the case. The second read the resolver's guard and assumed the value of the very flag it tests; the published docs settled it in one link. 📏 The 200-line / 25,000-byte index cap is a separate mechanism (`YD`, `GF`) and is what the import routes around.

### Recoverability — measured, not assumed

🔴 **The memory store is NOT under version control.** `~/.claude` is not a git repo, `MEMORY.md` is outside the Diors-Builds repo, and the newest snapshot is `memory-snapshot-2026-08-02-1410-pre-pass2.tar.gz` — a month stale. **There is no backup of the pre-trim file.**

✅ **But nothing was deleted, and reconstruction is fully mechanical.** Verified 2026-09-02 20:59 EDT by script:

| Check | Result |
|---|---|
| Index entries parsed | 124 |
| Tails found in topic files | **79** |
| Tails whose title matches an index entry | **79** |
| Orphaned tails (no matching entry) | **0** |
| Rejoin `head + " " + tail` reads correctly | ✅ verified on a sample |

So a script can restore every original line: parse `- **Title** — tail` out of each `## Index-line detail, moved …` section, match `Title` to the index entry, and rejoin. 74 topic files carry such a section.

⚠️ **One lossy detail.** Where the cut fell on a ` · ` or ` — ` separator, that separator was stripped from both halves, so a rejoin yields a space where a `·` used to be. Content is intact; punctuation at those junctions is not byte-exact.

### Constraints any real solution must satisfy

1. **200 lines OR 25,000 bytes, whichever first.** Not raisable from this repo. Both are gated now by `.claude/hooks/memory-index-check.sh`; the line limit had never been checked before this session and is the one a shortening strategy walks into.
2. **A partially-loaded memory must be impossible, or must announce itself.** This is the whole point of the rejection.
3. **Nothing may be deleted.** The store has no version control and the conservation rule (`memory-index-check.sh`) is the only thing standing between a dropped file and permanent loss.
4. **The ceiling is a forcing function, not an obstacle.** Its documented remedy is to shrink the index; routing around it removes the pressure that keeps it short. This is why the `@`-import was removed.
5. **Topic files are never auto-loaded.** Anything moved out of the index is invisible until something reads it — which is the same failure as Problem 2.

### Dead ends — already tried, do not rebuild

| Approach | Why it is dead |
|---|---|
| `@import` from `CLAUDE.md` | **Dead for a third reason, and the first two were red herrings.** It sat inside the YAML frontmatter for its whole life (consumed as YAML); moved below it, it read `@~/…`, a shell tilde the docs do not sanction. Both fixed 2026-09-02 21:03 EDT — and measured 2026-09-02 22:27 EDT it **still produces zero `include` rows** in `local/instructions-loaded.jsonl` across four session starts. ⚠️ The **double load** this row used to warn about therefore never happens: there is no second load. See the reconstruction section above for the two surviving candidates and the one-line probe. |
| Raising the budget | Six values across four raises (16000 → 20000 → 25000 → 30000 → 35000 → 40000), none of which changed what the platform loads. The budget is now the platform's own 25,000 and must not move. |
| Moving overflow into `.claude/rules/` | That tier is Problem 2. |
| Line-trimming as a general lever | Argued twice before, verdict went both ways; this session's attempt is the rejection that prompted this document. |

### Directions worth investigating (none approved, none tried)

- **Make continuation explicit.** A truncated entry that ends with a required marker (`… →`) plus a gate asserting every marked entry has a matching tail. Turns a silent partial into a visible one. Does not reduce the reading a session must do.
- **Restructure the index rather than the lines.** The entries are long because each one is a compressed argument. Is the index the right shape at all — should it be pointers plus a separately-loaded "standing instructions" file that has no size pressure because it is not auto-memory?
- **Move instructions out of auto-memory entirely.** `SILENT MODE` was in the wrong tier by the vendor's own division (auto-memory = what Claude writes about you; `CLAUDE.md`/rules = instructions you write). How much of the remaining index is the same category error? That is the one move this session made that Harkirat has *not* rejected.
- **Project skills** (`.claude/skills/`) — zero exist. The docs say explicitly: *"If an entry is a multi-step procedure or only matters for one part of the codebase, move it to a skill."*
- **Accept a larger index and solve the delivery separately.** If the constraint is the delivery mechanism rather than the content, the question becomes which mechanism can carry 35 KB reliably — and the honest answer today is "none that has been observed."

---

## PROBLEM 2 — path-scoped rules do not load under the workflow this repo mandates

### The measurement

Built this session: `.claude/hooks/instructions-loaded-audit.sh`, on Claude Code's `InstructionsLoaded` event. It logs `file_path`, `memory_type`, `load_reason` (`session_start` | `nested_traversal` | `path_glob_match` | `include` | `compact`), `globs`, `trigger_file_path` and the loaded file's real byte size to `local/instructions-loaded.jsonl` (gitignored). `--report` reads it back; `--session` emits a SessionStart summary.

| Probe | Result | Evidence |
|---|---|---|
| `Read` of a matching file | **fires** — `path_glob_match`, trigger named | MEASURED |
| `rg` over the same file | no load | MEASURED |
| `python3` heredoc **reading** a matching file | no load | MEASURED |
| `python3` heredoc **writing** a matching file | no load | MEASURED |
| native `Write` of a new matching file | **no load** | MEASURED |
| `Edit` | assumed to fire | **ASSUMED — never measured** |
| `Read` with `limit: 12` | injects the **entire** rule | MEASURED |
| second file matching an already-loaded rule | no reload — **once per session** | MEASURED (one session; a `compact` reload untested) |
| unconditional rule (`silent-mode.md`, no `paths:`) | **loads at `session_start`** | MEASURED |

⚠️ **`Edit` cannot be measured, and it also does not matter as much as it looks.** `Edit` requires a prior `Read` in the same session, and `Read` is the proven trigger — so **every file an `Edit` can reach has already loaded its rule**, whatever `Edit` itself does. The row stays `ASSUMED` because it was never observed, but nothing downstream turns on it. 🔴 **The genuinely valuable unrun experiment is the row below it: does a rule RELOAD after a `compact`?** Loading is once-per-session, and if a compact drops the rule without reloading it, then every long session silently loses the subsystem knowledge it paid for — which is Problem 2 again, arriving through a second door. That one is measurable today: load a rule, force a compact, touch a matching file, read the audit log.

### Why this is severe

The repo's own standing guidance pushes work toward exactly the tools that load nothing:

- `~/.claude/CLAUDE.md`'s batching contract: *any multi-file edit is ONE `python3` heredoc*
- the MCP routing rules: `ctx_search`/`ctx_execute` over reads, `rg` over `grep`
- `Read` is explicitly framed as the expensive fallback (`usage-guard.mjs` denies unchanged re-reads)

So the better a session follows the repo's efficiency rules, the less subsystem knowledge it loads. **540,144 bytes across 21 rule files exist to be loaded by a tool the guidance discourages.**

### Dead ends — already tried, do not rebuild

| Tried | Why it failed |
|---|---|
| A `PreToolUse` hook on `Bash` that parses paths out of the command and injects a POINTER to the governing rule | Rejected by Harkirat as a copout: a pointer is not the content, and a session that is told a rule exists still has to spend a `Read` to obey it — so it converts a silent gap into an announced one and calls that a fix. Described in full below |
| `FileChanged` as general write coverage | Its matcher registers **literal filenames in the working directory, not globs**, so it cannot watch whatever file a heredoc happens to write. Right tool for a known named file, wrong tool for this |
| Shrinking the tier by pinning file sizes | That is Problem 3, and it was removed. A ratchet forbids growth and cannot force a shrink |

### The cost when they DO fire

| | |
|---|---:|
| Tier total | **540,144 B** (was 651,223 before one split) |
| Largest rule now | `scripts-and-migrations.md` 98,173 B |
| Then | `legal-site.md` 79,881 · `design-decisions.md` 37,522 · `loadout-images-and-metadata.md` 34,413 · `draw-prices.md` 30,310 |
| Median injected when a read triggers any rule | **72,420 B ≈ 18k tokens** |
| Worst single file (`handlers/colors.js`, 3 rules) | **187,237 B ≈ 47k tokens** |
| Source files that trigger ≥1 rule | 383 of 1,185 |

So the tier is **simultaneously absent under the mandated workflow and very expensive when it isn't.** Any solution has to hold both halves.

### What I proposed, and why Harkirat called it a copout

A `PreToolUse` hook on `Bash` that extracts file paths from `tool_input.command`, matches them against each rule's `paths:` globs, checks the audit log for whether that rule loaded, and injects a **pointer** — *"this command edits `scripts/portalDiff.mjs`; `scripts-and-migrations.md` governs it and has not loaded."*

**Why it solves nothing:** it converts a silent absence into a notification that the session is free to ignore, and this repo has measured what notifications are worth — `grep` 788× against `rg` 4×, with the rule loaded in context the whole time. It also does not address the 98 KB rule being unreadable in practice even when you know it exists. It is a nudge wearing a mechanism's clothes.

### Constraints any real solution must satisfy

1. **It cannot require abandoning the batching contract.** Heredoc editing is the repo's measured cost control; "just use Edit" trades one real problem for another.
2. **It cannot inject 540 KB.** Making every rule unconditional is arithmetically available and immediately worse.
3. **It must survive the once-per-session load.** A rule loaded at 10:00 is in context all session; one never triggered is absent all session. There is no middle state.
4. **It must work for the rules that are encyclopedias.** Even a perfectly-timed load of a 98 KB rule is 24k tokens.
5. **It must not depend on the session choosing to look.** That is the property that failed.

### What already exists that a solution can build on

- **The audit hook** knows which rules have loaded, and when, and what triggered them.
- **`ctx-index-refresh.sh`** already indexes `.claude/rules/` (as `project:dioreo-rules`), `docs/`, `CLAUDE.md` and the memory store into context-mode, refreshed before every `ctx_search`. Measured: on `docs/`, `rg` returned zero files for 3 of 4 natural-language questions while `ctx_search` answered all four, in 0.26–2.1 s, at zero tokens through the CLI.
- ~~`rulesBudget.mjs`~~ — **removed 2026-09-02 21:25 EDT**, see Problem 3. While it existed it pinned every rule at its current bytes, shrink-only, plus `CLAUDE.md` and `docs/SESSION-START.md`, with 30,000 B for a new rule. Nothing gates the tier now.
- **One split is done as a worked example**: `accent-and-colors.md` went 144,650 → 27,319 B, its "View Colors" encyclopedia moved byte-for-byte to `docs/reference/colors-panel.md` (already indexed). Every live cross-reference was re-homed by hand.
- **Subdirectory `CLAUDE.md`** — documented, zero used here. Loads when Claude reads files in that directory, so it has the **same trigger limitation**; its advantage is co-location (a hand-written glob list cannot rot). Not a fix for this problem.

### Directions worth investigating (none approved, none tried)

- **Attack the trigger, not the delivery.** Is there any event that fires on a *shell-written file*? `FileChanged` exists and fires on a filesystem watcher regardless of writer — but its matcher registers **literal filenames in the working directory, not globs** (verified in the docs), so it cannot watch "any file under `portal/`". Whether a watch list generated from the rule globs is feasible at this scale is unmeasured.
- **Attack the size, not the timing.** If every rule were the ~5 KB trap it is supposed to be, unconditional loading of all of them costs ~100 KB and the trigger problem evaporates. The `accent-and-colors` split shows the shape; four more rules would need the same treatment.
- **Attack the tool choice.** Should the batching contract carve out an exception — heredocs for bulk mechanical edits, `Edit` for files whose rules matter? That needs the `Edit` measurement first.
- **Make retrieval the primary path.** The indexed tier already works and costs nothing until asked. What would make a session reliably ask? That is the same question as Problem 1's, which suggests the two problems have one answer.

---

---

## PROBLEM 3 — the injected tier has no size discipline, and a byte pin is not one

*Added 2026-09-02 21:07 EDT on Harkirat's instruction: "i also don't really like your pinned byte size implementation either. I want a better solution for that stuff. Fold in that research and point into the handoff report as a 3rd thing to work on. And remove it's current system until a real better solution is figured out." **The system described here has been REMOVED.** Nothing gates the size of the injected tier right now.*

### The underlying problem

Everything in the injected tier is paid whether or not it is used, and until this session none of it was measured:

| Layer | Size | Gated? |
|---|---:|---|
| `.claude/rules/**` (21 files) | **~540,000 B** | ❌ |
| root `CLAUDE.md` | **~89,000 B** | ❌ |
| global `~/.claude/CLAUDE.md` + `RTK.md` | 37,718 B | ❌ (outside the repo) |
| `docs/SESSION-START.md` | ~30,200 B | ❌ |
| `MEMORY.md` | **25,000 B via the loader** (cut inside line 124 of 151) **+ ~5,500 B re-emitted by `memory-index-check.sh`**; the import contributes nothing | budgeted, currently over on purpose |
| `self-check.sh` | 3,798 B **per prompt** | ❌ |

Largest rules: `scripts-and-migrations.md` 98,173 · `legal-site.md` 79,881 · `design-decisions.md` 37,522 · `loadout-images-and-metadata.md` 34,413 · `draw-prices.md` 30,310. One split has been done as a worked example — `accent-and-colors.md` went 144,650 → 27,319 B by moving its encyclopedia to `docs/reference/colors-panel.md`.

Six documented budget arguments and four raises have been spent on `MEMORY.md`, the **smallest** always-on layer, while a tier six times the size of the root `CLAUDE.md` sat beside it with nothing watching.

### What was built, and removed

A `rulesBudget` script plus its test and a size-baseline JSON (paths written without their extensions here on purpose — `xref` reads a repo-shaped path as a live reference and cannot tell a historical mention from a broken link), wired into `npm test` as `rules:budget`. It pinned every rule — and later `CLAUDE.md` and `SESSION-START.md` — at its **current** byte count, allowed the number only to fall, required a new rule to come in under 30,000 B, and errored on a pin for a deleted file. `--write` re-pinned. All three files and both npm scripts are now deleted and every doc that advertised them has been corrected.

### Why a byte pin is the wrong instrument

**1. It blesses today's sizes permanently.** `scripts-and-migrations.md` was pinned at 98,173 B — the ratchet's own definition of acceptable. It forbids growth and never once forces a shrink, so the tier's actual problem (five encyclopedias in an injected layer) is frozen rather than addressed. I named this trade in a code comment and shipped it anyway.

**2. Its escape hatch is the normal path.** I hit my own gate **three times in one session** and every time the resolution was `--write` and carry on. A gate whose escape you always take is theatre — and the escape is *correct* each time, because the growth was legitimate. That is the tell that the thing being measured is not the thing that matters.

**3. Bytes are a proxy that cannot see value.** A 98 KB rule that is all trap is worth its cost; a 5 KB rule that is all incident history is waste. The pin scores them identically. The real distinction this session found — **trap vs encyclopedia** — is invisible to it.

**4. It gates the wrong event.** The cost is not the file existing; it is the file being **injected**. A 98 KB rule nobody triggers costs nothing all session. A 27 KB rule triggered on turn one costs 7k tokens. The pin measures the file at rest.

**5. It never fired on arrival, which is why it looked safe.** A hard ceiling at any honest number fails four files immediately and gets switched off — that was the reasoning for choosing a ratchet. But "cannot fail on arrival" and "cannot force progress" are the same property.

### Constraints any real solution must satisfy

1. **It must be able to force a shrink, not only forbid growth.** Otherwise the tier stays where it is forever.
2. **It must distinguish content that must be in hand from content that is looked up.** Bytes cannot; that distinction is the one that actually moves the number.
3. **Its escape must be rare.** If legitimate work routinely trips it, the escape becomes reflex and the gate stops meaning anything — measured three times in one session.
4. **It should price the injection, not the file.** The per-session cost depends on which rules a session triggers, and `.claude/hooks/instructions-loaded-audit.sh` already records exactly that.
5. **It must not fail on arrival.** Whatever replaces it has to be adoptable on a tree that is already oversized.

### Dead ends — do not rebuild

| Approach | Why |
|---|---|
| Hard byte ceiling | Fails four files on day one; a gate that fails on arrival gets switched off. This repo has receipts (`timestamp-check`'s bare-date branch, narrowed from 18% precision for the same reason). |
| Byte-pin ratchet | This section. Rejected 2026-09-02 21:07 EDT. |
| No gate at all | How the tier reached 651,223 B unnoticed. |

### Directions worth investigating (none approved, none tried)

- **Measure the injection, not the file.** The audit hook logs every load with its real byte size. A per-session report — *"you loaded 4 rules totalling 118 KB, triggered by 3 files"* — prices the thing that actually costs, arrives unasked, and needs no pin at all. A trend across sessions would show the tier growing without any file-level threshold.
- **Gate the KIND, not the size.** The four-kind sort in `docs/superpowers/specs/2026-09-02-context-architecture-design.md` (invariant · procedure · local trap · history) is what made `accent-and-colors.md` shrink 5×. A check that can spot dated incident narrative in an injected file would target the actual waste. Harder to mechanise, and worth asking whether it is possible at all.
- **Split the tier structurally.** Every rule becomes `<topic>.md` (small trap, injected) plus `docs/reference/<topic>.md` (encyclopedia, indexed). One worked example exists. If every rule were ~5 KB, the whole tier is ~100 KB and **Problem 2 dissolves too** — unconditional loading becomes affordable and the trigger question stops mattering.
- **Budget the session, not the file.** A ceiling on total injected bytes per session, reported rather than enforced, with the audit log as the meter.

⚠️ **Note the overlap with Problem 2.** If rules were small enough to load unconditionally, the trigger problem disappears. If the trigger problem were solved, size would still matter but less. **A solution that addresses both is worth more than two that address one each** — and the third direction above is currently the only candidate that does.

## Verified facts the next session should not re-derive

| Fact | Status |
|---|---|
| `silent-mode.md` loads at `session_start` | **MEASURED** — logged twice beside `CLAUDE.md` and `RTK.md` |
| Unconditional (`paths`-less) rules load eagerly | **MEASURED** via the above |
| `MEMORY.md` is **~30.5 KB / 151 lines** — deliberately OVER the limit, and bridged by the HOOK FALLBACK, not by the import (measured 2026-09-02 22:27 EDT: zero `include` rows in four session starts) | MEASURED (the 22,230/151 figure was the rejected trim) |
| 79 tails, 0 orphaned, rejoin verified | MEASURED 2026-09-02 20:59 EDT |
| Memory store has no version control, newest snapshot is 2026-08-02 | MEASURED |
| The `@`-import never worked, twice, for two different reasons | MEASURED |
| Rules fire on `Read`; not on `rg`, heredoc read, heredoc write, or `Write` | MEASURED |
| Rules fire on `Edit` | **ASSUMED — never measured, and moot: `Edit` needs a prior `Read`, which already loads it** |
| A rule reloads after `compact` | **UNKNOWN — this is the experiment that matters** |
| A rule loads once per session | MEASURED (one session; `compact` untested) |
| `Read` with a `limit` still injects the whole rule | MEASURED |

## Where everything is

| Thing | Path | State |
|---|---|---|
| The load instrument | `.claude/hooks/instructions-loaded-audit.sh` | live · `--report` reads the log, `--session` emits a SessionStart line |
| Its log | `local/instructions-loaded.jsonl` | gitignored, session-local, never accumulates across sessions |
| Memory index gate | `.claude/hooks/memory-index-check.sh` | live · gates 200 lines AND 25,000 B · **currently reports over budget on purpose** |
| The index itself | `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/MEMORY.md` | ~30.5 KB / 151 lines · **outside the repo, no version control** |
| Force-import | `CLAUDE.md` line 6 | live · absolute path, no tilde · temporary bridge |
| Standing style | `.claude/rules/silent-mode.md` | live · no `paths:`, `unconditional: true` · verified loading |
| Worked split | `docs/reference/colors-panel.md` | the one accepted move — encyclopedia out of a rule |
| Design record | `docs/superpowers/specs/2026-09-02-context-architecture-design.md` | frozen · Decision 2 partly and Decision 3 wholly superseded |
| Autofix safety net | `scripts/autofixSafety.test.mjs` | live, in `npm test` — unrelated to these three problems |
| Size ratchet | — | **DELETED.** The `rulesBudget` script, its test and a size-baseline JSON, wired as `rules:budget`. Recoverable from this branch's git history |
| Open items | `docs/db-deferred-list.md` | five oversized rules (P1) · five heredoc-blind hooks · `portal:states` flakiness |

## How to reproduce every measurement in this document

```bash
# what loaded this session, why, and what triggered it
bash .claude/hooks/instructions-loaded-audit.sh --report

# the index against BOTH platform limits
bash .claude/hooks/memory-index-check.sh | jq -r '.hookSpecificOutput.additionalContext'

# rule sizes (the ratchet is gone; this is the raw measurement it used to wrap)
wc -c .claude/rules/*.md | sort -rn

# what a given source file would inject, by hand: match it against each rule's paths: frontmatter
head -8 .claude/rules/*.md
```

**To probe whether a tool triggers a load:** pick a rule NOT yet in the log, act on a file its globs match with the tool under test, then re-read the log. ⚠️ **The rule must be unloaded and the positive control must be in the same session** — `CLAUDE.md` appearing as `session_start` is the free control. An empty log otherwise cannot distinguish "did not fire" from "the hook never ran."

## The revert, in enough detail to redo or undo it

The trim and its reversal were both mechanical. The trim: for each `- [Title](file.md) — hook` over 165 chars, keep the head cut back to the last `. ` / ` · ` / ` — ` / space above offset 40, and append `- **Title** — <tail>` to the topic file under `## Index-line detail, moved <stamp>`. The revert: collect every such bullet, match `Title` against the index entry, rejoin, and delete the appended section.

⚠️ **The verification was a throwaway script and is not in the repo.** It matched each moved bullet's `**Title**` against the index entry's `[Title](file.md)` and asserted every tail found exactly one home — 79 of 79, 0 orphaned. **Rebuilding it is ~15 lines**: collect the bullets under each `## Index-line detail, moved …` heading, key by title, and assert the key set equals the set of truncated index entries. Do not trust the 79/79 figure without re-deriving it if you touch the index again.

⚠️ **The memory store is not in git and has no recent snapshot** (newest is `memory-snapshot-2026-08-02-1410-pre-pass2.tar.gz`). **Any experiment on `MEMORY.md` is irreversible unless you snapshot it first** — `cp MEMORY.md /tmp/…` before touching it. That is how this revert stayed safe.

## What "solved" would look like

| Problem | Done when |
|---|---|
| **1 — the index** | A session gets the whole index without an import, or gets a partial one that ANNOUNCES itself. The import is deleted and the over-budget report is gone because the content is genuinely elsewhere, not because a line was cut. |
| **2 — rule loading** | A session working through heredocs and `rg` has the same subsystem knowledge as one working through `Read` — without paying 540 KB for it. |
| **3 — tier size** | Something can force a shrink, not just forbid growth, and its escape is rare rather than routine. |

⚠️ **Problems 2 and 3 may share one answer.** If every rule were ~5 KB, unconditional loading of the whole tier costs ~100 KB and the trigger question stops mattering. That is the only candidate on the table that closes both.

## Session state this hands over

- Branch `feat/context-layer-instruments`, PR **#181** into `v3-pre-release`, **merge held by Harkirat**.
- ✅ **CI is green.** ⚠️ **The red check was NOT `portal:states`, and this document said it was for an hour.** The standdown shipped earlier on this branch worked: a diff with no portal file no longer runs the walk. The actual failure was `mcp-layer-check.test.sh` — an assertion (*"the counts line is labelled as db-derived"*) whose three probe runs did not pin the fixture database, so `LINKSEE_DB` fell back to `$HOME/.linksee-memory/memory.db`: present on this Mac, absent on the runner. The counts line only exists when that file is readable, so the assertion was green locally and red on CI for a reason having nothing to do with the behaviour under test. **An assertion whose SUBJECT exists in only one environment is not testing what it claims.** Fixed by pinning the three runs to the fixture DB, and proven both ways — 28/28 normally and 28/28 under an emptied `HOME` that reproduces the runner exactly.
- `docs:audit`, `docs:reflow` and `docs:reflow-comments` all exit 0 as of 2026-09-02 21:30 EDT.
- ⚠️ **`npm test` has NOT run since `package.json`'s test chain was rewritten and two scripts were deleted.** The chain parses (114 segments, no doubled `&&`) but the suite is unverified.
- ⚠️ **The work is on the branch but NOT yet committed** — 21 modified/deleted paths in the working tree at handoff, including this file and the two deleted `rulesBudget` scripts. `git status` before anything else; do not assume `git log` shows the current state.
- Version `3.74.0-pre`. The CHANGELOG, DEVLOG and resolved-list entries for it now carry both reversals inline rather than describing a state that no longer exists.

## What this session got wrong, so the next one expects it

Recorded because the same shapes will recur, not as contrition.

| Failure | Detail |
|---|---|
| Two "solutions" that were patches | The index trim and the byte ratchet. Both shipped, both rejected, both reverted. |
| A sweep that found what I remembered | Three greps declared the tree clean of ratchet claims; `docs:audit` then found two ERRORs I had missed, twice. **The gate found what I actually did; my sweep found what I recalled doing.** |
| A stale PRIORITY | A deferred item was P2 *because* the ratchet pinned five files. Removing the ratchet removed the justification, and the sentence never named it — invisible to every search. Found by asking "what did this depend on." |
| A batch that died mid-flight | An `assert` failed on a reflowed phrase and the two edits after it never ran, including the most important one. Caught only because each edit prints. |
| Green over a corpus that excluded the file | The first `docs:audit` ran with this plan untracked, so it was uncounted, not merely unchecked. |
| An artifact and a PR body left asserting a superseded state | Both corrected, twice, in one evening. |

## Audit log

### Reader test, 2026-09-02 21:40 EDT — one scoped `doc-coauthoring` reader agent, no transcript context

Run in two phases: document-only first (can you START?), then repo-open (is the document TRUE?). Every finding was independently re-verified before acting on it.

| Phase | It found | Verdict |
|---|---|---|
| B | This document called the red CI check *"flaky"* while the entry it cites for corroboration says **"IT IS NOT ALTERNATING"** | **CONFIRMED and fixed.** The most dangerous sentence in the document — it would have told the next session to wave through a reproducible failure |
| B | 21 uncommitted paths, unmentioned | CONFIRMED and fixed |
| A | The "single most valuable unrun experiment" is unreachable as written — `Edit` needs a prior `Read`, which is the trigger | CONFIRMED. Fixed by demoting it and promoting the `compact`-reload question in its place |
| B | `152 lines` (actual 151) · `540,023 B` (actual 540,144) | CONFIRMED and fixed. Both are the duplicated-state-in-prose failure this repo has a memory about |
| A | Problem 2 had no Dead ends table, unlike 1 and 3 | CONFIRMED and fixed |
| A | The reconstruction check was cited but not shipped | CONFIRMED; the rebuild recipe is now written down |
| B | The branch has moved 8 commits past `28c3c0bb`, which read as "current state" | Half right — the citation is historical and correct, but it MISLED a real reader, so it now says so explicitly |

⚠️ **The two worst findings were both self-contradictions against sources this document itself cites**, not omissions. An outline check would have found neither.


*Required by `.claude/rules/plan-drafting.md`. This is a problem brief, not an implementation plan, so the pass below was run against the FRAMING rather than against steps.*

- **Falsified: "the trim is recoverable from a backup."** Checked — `~/.claude` is not a git repo and the newest snapshot is a month old. Recovery is by reconstruction from the tails, not restoration. Corrected above.
- **Falsified: "reconstruction is straightforward."** A first test rejoined the wrong tail because a topic file can hold several `- **` bullets. Re-ran matching by title: 79/79, 0 orphaned. The correct method is title-matching, and that is now stated.
- **Falsified: "the rejoin is byte-exact."** It is not — separator characters at ` · ` and ` — ` cut points were stripped from both halves. Content is intact; punctuation is not. Stated rather than glossed.
- **Challenged: "Problem 2 needs a delivery mechanism."** The alternative framing — that the rules are simply too large and the trigger problem is a symptom — is recorded as its own direction, because the one completed split reduced a 144 KB rule to 27 KB without losing anything.
- **Named as unresolved:** whether Problems 1 and 2 have one answer. Both reduce to "content that exists is not reaching the session that needs it," and both currently rely on someone choosing to look.
- **Problem 3 was added after the first audit pass, 2026-09-02 21:27 EDT, and re-audited on its own.** Falsified: *"the ratchet is a reasonable interim."* It is not — it blessed a 98,173 B file as acceptable by fiat, and its escape was taken three times in one session by its own author. A gate whose escape is the normal path is theatre.
- **Found by reasoning, not by search: a stale PRIORITY.** `docs/db-deferred-list.md`'s rules entry had been downgraded P1 → P2 *because the ratchet pinned those five files*. Removing the ratchet removed the justification, and no reference check, word search or conservation rule could see it — the sentence never named the ratchet. Re-raised to P1. **This is the class worth remembering: a claim that was true BECAUSE of a thing you removed, but does not mention it.**
- **Left deliberately unedited:** `memory-index-check.sh`'s over-budget message, which says *"do NOT just trim the lines, that lever is already spent."* Written before the trim; correct after it was rejected. My reflex on seeing a message about a state I just changed is to edit it, and this one improved by accident.
- ⚠️ **Bias declared:** I authored both rejected fixes. This brief may still be shaped to make them look reasonable. The next session should treat the "why it is wrong" sections as the load-bearing parts and the "directions" as unvetted.
