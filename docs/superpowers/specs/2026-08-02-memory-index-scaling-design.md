---
kind: spec
status: frozen
---

# MEMORY.md index scaling — design

**Status:** DESIGN — awaiting Harkirat's approval. Nothing migrated yet.
**Authored:** 2026-08-02 12:57 EDT (Opus 5 – High)
**Subject:** `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/MEMORY.md` and the 73-file store it indexes.

---

## 0. Scope — read this first

This document is about **one narrow problem: `MEMORY.md` grows without bound, and it is loaded into every session in full.** It designs a better way to *store and reference* the index and the entries it points at.

**This is NOT the cross-project memory-architecture redesign.** That is [[project_deferred_cross_project_memory_architecture]] — a separate, ⏸️ INDEFINITELY PARKED design about sharing memory *between* projects via a central store. It is tracked in `/Applications/Claude Code/meta-deferred-list.md`. This work neither resumes it, depends on it, nor unblocks it. The two are related only by both containing the word "memory".

> **Naming note — deliberate deviation from the session brief.** The brief asked for `2026-08-02-memory-architecture-design.md`. That filename is the exact collision the paragraph above exists to prevent: a future session grepping for "memory architecture" would find this file and believe the parked redesign had been resumed. Named `memory-index-scaling` instead. Flagging rather than silently renaming.

**In scope:** index structure and tiering · what earns a file vs. a section · retirement/archival · critique of the current 8-section grouping · a growth governor.

**Out of scope, deliberately:** the division of labour between this file store and the `perseus-vault` / `linksee` MCP layer. That was question 3 of the brief. It is a genuine question, but it is a *deep architecture* question about what memory is for — answering it here would re-open precisely the scope Harkirat closed. The file store's routing role is unchanged by this design: it stays canonical. Filed as a follow-up in §9.

---

## 1. Verified state (measured 2026-08-02 12:45–12:57 EDT, not assumed)

| Fact | Value | How verified |
|---|---|---|
| Memory files (excl. `MEMORY.md`) | **73** | `fd -H -I -e md . -d 1` |
| `MEMORY.md` size | **13,192 bytes** | `wc -c` |
| Whole store size | **465,335 bytes** | `cat` all, `wc -c` |
| Conservation check | **73 files ↔ 73 unique links, 0 orphans, 0 dangling** | `comm` of file list vs. extracted links |
| Store shape | **flat** — no subdirectories, no non-`.md` files | `fd -H -I -t d` / `-t f --exclude '*.md'` |
| Files ≥ 20KB | 5: `reference_markedit_extension_api` (33,530) · `reference_enforcement_hooks` (24,240) · `reference_tool_capability_tests` (24,033) · `user_working_agreement` (23,752) · `project_dior_builds_changelog_system` (21,112) | `wc -c` sorted |

### The conservation check, re-derived

This is the real invariant and it must be re-run after **any** memory edit:

```bash
cd ~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/ && \
files=$(fd -H -I -e md . -d 1 -x basename {} \; | grep -v '^MEMORY.md$' | sort); \
links=$(rg -o '\]\(([a-z0-9_.-]+\.md)\)' -r '$1' MEMORY.md | sort -u); \
echo "files: $(echo "$files" | wc -l)  linked: $(echo "$links" | wc -l)"; \
echo "--- orphans (on disk, unindexed) ---"; comm -23 <(echo "$files") <(echo "$links"); \
echo "--- dangling (indexed, missing) ---"; comm -13 <(echo "$files") <(echo "$links")
```

Currently passes clean. **§7 changes what "correct" means for this check** — it must learn about the archive tier, or archiving a file will read as data loss.

---

## 2. Premise correction — the 24.4KB figure does not reproduce

The session brief states `MEMORY.md` was "23.1KB against a 24.4KB HARD READ LIMIT". **I could not reproduce that limit, and no memory file records where the number came from.**

**Test:** `Read` on `reference_markedit_extension_api.md` — **33,530 bytes, 37% over the claimed cap.** It returned in full: all 377 lines, no truncation notice, no error.

**Conclusion:** there is no ~24.4KB cap on the `Read` path. The prior session hit *something*, but it was not that, and the number should not be treated as a known constant.

### What is actually true, and it is more important than the number

**Nothing in this repo loads `MEMORY.md`.** Verified: no `SessionStart` hook in `.claude/settings.json`, none in `.claude/settings.local.json`, none in `~/.claude/settings.json`, and no reference in `docs/SESSION-START.md`. Yet `MEMORY.md`'s full contents *are* present in this session's context, labelled by the platform as *"user's auto-memory, persists across conversations"*.

> ### ✅ Native auto-load is CONFIRMED WORKING — as of 2026-08-02 12:50 EDT
> Both [[project_memory_slug_migration]] and `CLAUDE.md`'s Canonical-memory-path invariant carry a caveat reading *"native auto-load is still UNVERIFIED"*. **It is now verified, by direct observation:** `MEMORY.md` is in context and no hook in any settings file put it there. The 2026-07-28 slug migration achieved exactly what it was meant to.
>
> **This does not mean the `SessionStart` hook can be removed** — it loads `docs/SESSION-START.md`, a different file, and the notes-file check. Only the *claim* about `MEMORY.md` changes. Both caveats should be updated in the same change that lands this design (see §8, Phase 0).

Three consequences follow, and they are what the design must actually respond to:

1. **Only `MEMORY.md` is auto-loaded. The other 73 files are on-demand.** Individual memories entered this session's context only when explicitly `Read`. So the always-on cost is *exactly* `MEMORY.md`, and nothing else.
2. **That cost is paid by every session, forever.** 13,192 bytes ≈ **~3,300 tokens on every single session**, before a word of work. At its pre-compaction 23.1KB it was ~5,800.
3. **The cap, wherever it is, belongs to the platform's native loader — not to us.** It is undocumented, untestable from inside a session, and can change under us without warning.

**Therefore the design does not target a number.** Betting the store's readability on an unverifiable constant is exactly the failure mode of [[feedback_verify_before_claiming]]. The design targets *keeping the index small enough that the question never has to be asked* — which is correct whether the cliff is at 24.4KB, at 40KB, or does not exist at all.

---

## 3. Root cause — which lever is left

```
MEMORY.md size  ≈  (number of memories) × (bytes per index line)  +  section headers
```

Two levers. **The prior session pulled the second one**, cutting 23.1KB → 12.9KB (−44%) by shortening index lines and grouping into 8 sections. That was the right emergency move and it worked.

**That lever is now close to exhausted.** Current density is 13,192 / 73 ≈ **181 bytes per entry** including headers. A pointer line has a hard floor around 90–110 bytes before it stops doing its job — the description is what lets a session know an entry *exists* and whether it is relevant, without opening it. Compress below that and you are trading the index's entire function for bytes.

**So the only remaining lever is the file count.** And the file count only goes up.

### Growth model

[[project_memory_slug_migration]] records **59 memories at 2026-07-28 01:41 EDT**. Today, 2026-08-02 12:45 EDT, there are **73**. That is **+14 in 5.0 days ≈ 2.8 memories/day.**

At the current 181 bytes/entry, `MEMORY.md` returns to its 23.1KB emergency size at ≈130 files:

```
(23,100 − 13,192) / 181  ≈  55 more files  ÷  2.8/day  ≈  20 days
```

> **The emergency compaction bought roughly three weeks, not a fix.** On the observed rate the index is back at its emergency size around **2026-08-22**. This is the number that justifies doing the work now rather than filing it.

The rate is an estimate from one 5-day window and may well slow. It does not need to be precise — the point is that growth is *monotonic and unmanaged*, and no amount of line-trimming changes that.

---

## 4. The governing principle

> **The index is charged per FILE. On-demand entries are charged per READ. Optimise the index for file count; let individual memories be as long as they need to be.**

One index line costs ~181 bytes × every session ≈ effectively permanent. One memory file's *body* costs its bytes only when something actually reads it, which for most entries is rarely.

This single principle resolves most of the brief's open questions, and it points the opposite way from intuition: **merging six 4KB files into one 20KB file is a clear win**, because it removes five permanent index lines and adds nothing to the always-loaded cost. "The merged file is big" is not an objection — we proved a 33.5KB file reads fine, and it is read perhaps once a fortnight.

---

## 5. Decisions

### D1 — Consolidate first; do NOT add an index tier yet. **(primary fix)**

**Rejected for now: the two-tier index** (a small always-loaded core + topic index files such as `INDEX-verification.md`, loaded on demand).

It bounds the always-loaded size hard and scales indefinitely, and it is the obvious answer to the brief's question 1. It is rejected as the *first* move for one reason that matters more than the byte count:

> **A tiered index degrades recall routing.** The index's job is not only to point at entries — it is to let a session *know what exists*. Today I can see all 73 descriptions and pick correctly. Behind a tier I would see "git things → `INDEX-git.md`" and have to guess whether a given lesson was filed under git, records, or working-with-Harkirat. Guessing wrong means silently not recalling something that exists — the exact failure the store exists to prevent, and one that reports no error.

Consolidation has none of that cost. It **removes mass** rather than **adding machinery**, and it improves recall quality on the way (see D2). Prefer removing mass first.

**D1 is not a rejection of tiering forever** — see D6 for the trigger that adopts it.

### D2 — Merge near-duplicate lessons into one canonical entry with a case list

The brief's question 2, and the clearest instance: **six entries are one lesson with six war stories.**

| File | Bytes |
|---|---|
| `feedback_verify_before_assuming` | 5,095 |
| `feedback_not_checkable_is_usually_unexamined` | 9,235 |
| `feedback_complete_is_not_correct` | 4,176 |
| `feedback_reproduction_must_discriminate` | 4,031 |
| `feedback_green_check_can_mask_outage` | 3,162 |
| `feedback_verify_relayed_agent_work` | 2,919 |
| **Total** | **28,618** |

Each is real and each war story is worth keeping. But they are six index lines, six things to route between, and six chances to recall the wrong one — for a single lesson: *verify before claiming.*

**Proposal:** one canonical `feedback_verify_before_claiming.md` — the lesson stated once, followed by a **case table**, one compact row per war story (situation → what was assumed → what was true → the check that would have caught it). Cases keep their dates and their specificity; the framing prose, which is where the duplication lives, is written once.

- **Saves:** 5 permanent index lines (~900 bytes/session, forever).
- **Costs:** one file of roughly 10–14KB after de-duplicating the repeated framing — read on demand, well within proven limits.
- **Bonus:** resolves a real pre-existing bug. [[project_memory_slug_migration]] records two genuinely unresolved wiki-links in the store, one of which is **`feedback_verify_before_claiming`** — a name several memories already link to as though it existed. This merge creates the file those links have been pointing at all along.

Other clusters worth the same treatment are listed in §8 Phase 2. They are proposals, not decisions — each merge is Harkirat's call, because a merge is lossy and the store is not under version control (§10).

### D3 — The rule for when a lesson earns its own file

The brief's question 2 asked for this explicitly. Without it, any structural fix refills.

> **A new lesson becomes a CASE inside an existing memory by default. It earns its own file only if it passes at least one of these three tests:**
>
> 1. **Different trigger.** A session would go looking for it in a situation where it would *not* think to open the existing entry. (Different moment, not different topic.)
> 2. **Supersedes or contradicts.** It changes what the existing entry says, rather than adding evidence for it. A reversal needs its own file so the old reasoning stays legible.
> 3. **Independently actionable.** It carries its own procedure — commands, a checklist, a convention — that a session would follow without needing the parent lesson at all.
>
> Failing all three, it is a case. **"It's a distinct incident" is not a qualifier** — that is precisely what a case is.

Test against the six above: all six share the same trigger (*about to claim something is done*), none supersedes another, none is independently actionable apart from the shared lesson. All six are cases. The rule agrees with the judgement, which is what a rule should do.

### D4 — Retirement criteria and where archived memories go

The brief's question 4.

**A memory is retirable when it describes work that is finished and no longer informs a decision.** Concretely, any one of:

- **Self-declared obsolete** — e.g. `project_batch_refinements_2026_07_12`, whose own index line reads "(obsolete) — all shipped".
- **Shipped and absorbed** — the outcome now lives in `CLAUDE.md`, a `.claude/rules/` file, or the code itself, and the memory only narrates how it got there.
- **Superseded** — a later memory states the current position, and this one survives only as history.

**Never retirable, regardless of age:** anything recording a *reversed decision* or a *dead end*. Their whole value is stopping a future session re-deriving the wrong answer — [[feedback_verify_before_force_overwrite]] and the five metaball dead ends are worth more the older they get.

**Where they go:** `memory/archive/` — a real subdirectory, files moved intact, **removed from `MEMORY.md`**. Recoverable by listing the directory; costs zero always-loaded bytes. Each archived file gets a one-line header stating when and why it was retired.

This is the pattern the repo already uses (`docs/archive/graveyard.md`, `docs/archive/resolved-list.md`) and it matches [[reference_deferred_items_file]]'s conservation rule: an item leaves an active list only by appearing in its archive.

**⚠️ This is the change with the sharpest edge — see §8 Phase 1.** Adding a subdirectory breaks two hooks and the conservation check.

### D5 — Critique of the current 8-section grouping

The brief flagged this as a first draft made under time pressure. Reviewing it now: **it is sound and should mostly be kept.** Sections: Verification & judgement · Design & visual · Git/releases/ records · Infra & ops · Legal/features · Cost/tools/routing · Working with Harkirat · Structure & reference.

Two real problems:

1. **"Structure & reference" is a junk drawer.** It holds the CLAUDE.md rules structure, the deferred lists, the priority tier system, the MarkEdit API, the parked memory redesign, and "defer to the owning project" — related only by not fitting elsewhere. A session looking for the priority-tag legend has no reason to look under the same heading as a MarkEdit API reference.
   **Fix:** dissolve it. Route the deferred-list/priority/notes entries into a **"Trackers & conventions"** section; move `reference_markedit_extension_api` next to the notes-file entries it actually serves; leave the parked-redesign pointer under Structure.

2. **The sections are organised by TOPIC; recall happens by MOMENT.** "Verification & judgement" is topical, but I reach for it at a specific moment — *about to claim something is done*. The sections that work best today (Git/releases, Working with Harkirat) are the ones that happen to coincide with a moment.
   **Fix — cheap, no restructure:** give each section header a **trigger clause** saying *when* to look there. `## Verification & judgement — before claiming done/synced/fixed`. Costs ~40 bytes per section (~320 total) and directly improves routing, which is the thing tiering would have damaged.

Otherwise the grouping is good and renaming sections for their own sake would only churn.

### D6 — The growth governor, and the trigger that escalates to tiering

Prose rules on this project have a measured record of failing (`grep` 788× vs `rg` 4×), and the established answer is [[reference_enforcement_hooks]]: **a checkable rule becomes a hook, not more prose.**

- **Budget:** `MEMORY.md` stays **under 16,000 bytes**. Chosen as ~20% above the post-consolidation target of ~9KB — comfortably clear of any plausible cliff, and low enough that breaching it means something real changed.
- **Enforcement:** a `SessionStart` check reports `MEMORY.md`'s size and warns past 16,000 bytes. Advisory, never blocking — same shape as the existing notes-file check. It also re-runs the conservation check, which today runs only when someone remembers to.
- **Escalation trigger:** if `MEMORY.md` exceeds **16,000 bytes with the archive tier maintained and no merge candidates left**, consolidation has genuinely run out and **D1's rejection of tiering is revisited** — with the routing-degradation cost accepted knowingly, and mitigated by D5's trigger clauses.

That last clause is the point: tiering is not rejected on principle, it is *sequenced*. This design takes the reversible, non-lossy step first and defines the evidence that would justify the irreversible one.

---

## 6. What this design does NOT change

- **The canonical path.** `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/memory/` is untouched. `CLAUDE.md`'s invariant and its structural sanity test both hold: the directory exists, contains `MEMORY.md`, and holds many `*.md` files.
- **`MEMORY.md` stays at the top of that directory, in the same format.** The native loader's contract is unchanged.
- **The `SessionStart` hook keeps working** — it never touched `MEMORY.md` (§2).
- **Frontmatter shape** (`name` / `description` / `metadata.type`) is unchanged, so the store stays in the format the platform expects.
- **The MCP layer's role** — `perseus-vault` and `linksee` routing is untouched (§0).

---

## 7. The conservation check must be updated in the same change

Today's check says *every `.md` in the dir must have an index line*. After D4 that is **false by design** — archived files deliberately have none.

Left unchanged, the check reports every archived file as an orphan, and the first session to run it concludes the index is corrupt. Updated carelessly (e.g. by making it recursive-blind), it stops detecting real orphans, and a genuinely lost memory goes unnoticed. **Both failure modes are worse than the problem being solved.**

**Required shape:** the check partitions the store in three, and each partition has its own rule.

| Partition | Rule |
|---|---|
| `memory/*.md` (flat, excl. `MEMORY.md`) | must have exactly one index line — as today |
| `memory/archive/*.md` | must have **no** index line, and must carry a retirement header |
| Index links | must resolve to a flat file — a link into `archive/` is an error |

Plus the conservation rule from [[reference_deferred_items_file]]: **the active count may only shrink by the amount the archive grows.** A file that vanishes from both is deletion, not archival, and must fail loudly.

---

## 8. Migration plan — phased, each phase independently verifiable

**Nothing below runs until Harkirat approves this design.** Phases are ordered so that the risky, mechanical work happens *before* any lossy content work.

### Phase 0 — Corrections only (no restructure, no data movement)
Lands the verified facts from §2 so they stop being wrong in the meantime.
1. Update `CLAUDE.md`'s Canonical-memory-path invariant: native auto-load **confirmed**, with the standing note that the hook is still required for `docs/SESSION-START.md`.
2. Same correction in [[project_memory_slug_migration]].
3. Record that the 24.4KB figure did not reproduce, so it is not re-inherited as fact.

*Verify:* `rg` for the old "UNVERIFIED" phrasings across `CLAUDE.md`, `docs/`, `.claude/rules/`, and the memory store — **widened until it returns known-good hits**, per [[feedback_no_half_measures_on_reorgs]]'s "sweep for the claim, not the sentence you remember writing".

### Phase 1 — Archive tier (mechanical, reversible)
1. Create `memory/archive/`.
2. ~~**Update `.claude/hooks/records-close-check.sh:65`** — `find "$MEM" -name '*.md'` is recursive and would count archived files as "memory written on this branch". Needs `-maxdepth 1`.~~ ✅ **DONE, then superseded 2026-08-02 17:55 EDT (v2.50.0).** `-maxdepth 1` was added and worked — but the surrounding `find … -newermt "@$since"` never did: **BSD find cannot parse the `@epoch` form**, so it errored into `2>/dev/null` and the count came back 0 on every run, firing the check on every PR regardless. The whole call is now a `for f in "$MEM"/*.md` glob plus an explicit `stat` comparison, which is non-recursive **by construction** — there is no longer a `-maxdepth` to forget. Found by writing the hook's first test; see memory `reference_enforcement_hooks`.
3. **Update `.claude/hooks/stale-reference-sweep.sh:62`** — passes `"$MEM"` to a recursive `rg`, so archived files get swept for stale references. Decide explicitly: exclude, or accept the noise.
4. Update the conservation check per §7.
5. **Dry-run both hooks** before moving a single file — the `# Graveyard` incident in [[feedback_no_half_measures_on_reorgs]] is this exact failure, and an unanchored hook fails *silently*.
6. Move the D4-qualifying files; strike their index lines.

*Verify:* both hooks dry-run clean with the archive populated; conservation check passes under the new three-partition rule; `MEMORY.md` size recorded before/after.

### Phase 2 — Consolidation (lossy — needs per-merge approval)
1. `feedback_verify_before_claiming` ← the six from D2. **Do this one first, alone**, and let it sit for a session or two before proceeding — it is the template, and it is worth finding out whether a case table actually recalls as well as six separate files before repeating it five more times.

   > ### ⚠️ EXECUTED 2026-08-02 13:20 EDT — as FIVE, not six. Deviation from this plan, recorded.
   > **`feedback_not_checkable_is_usually_unexamined` was NOT merged.** Tested against D3's own earning rule, it passes two of the three tests: it fires at a **different trigger** (*designing an enforcement check*, not *claiming something is done*) and it is **independently actionable** (its own 20-lesson procedure for deriving invariants and avoiding vacuous checks). By the rule this design wrote, it earns its file — so merging it would have been the design overriding its own criterion for the sake of one more index line.
   >
   > D2 listed it among the six because the *topic* is shared. The rule tests the **moment**, not the topic, and that distinction is the whole point of D3. Merged five; saved four index lines instead of five.
2. Then, each proposed separately: the token/tool-routing cluster (4 → 2) and the git/release cluster (7 → ~4).

*Verify after each:* conservation check; `rg` for `[[old_name]]` across the repo **and** the store, since merged files leave dangling wiki-links everywhere they were cited.

### Phase 3 — Index polish + governor
1. Dissolve "Structure & reference" per D5.1.
2. Add trigger clauses to section headers per D5.2.
3. Add the `SessionStart` size + conservation check per D6, in **tracked** `.claude/settings.json` — never `settings.local.json`.
4. Register it in [[reference_enforcement_hooks]].

*Verify:* hook fires on a real session start; deliberately breach the budget in a scratch copy to prove the warning can actually fire ([[feedback_verify_before_claiming]] — a check that has never been seen to fail is not known to work).

**Expected outcome:** ~73 → ~50 active files; `MEMORY.md` ~13.2KB → ~9KB; growth governed rather than monotonic.

---

## 9. Follow-ups this design deliberately does not answer

- **Question 3 — file store vs. `perseus-vault` vs. `linksee` division of labour.** Out of scope per §0. Worth its own session. → `docs/db-deferred-list.md`, suggested `[P2 · M]`.
- **The four ≥20KB non-index files.** `reference_markedit_extension_api` (33.5KB) and friends are *on-demand*, so under §4's principle their size is not a problem. But `user_working_agreement` (23.7KB) is the designated "START HERE" file, so it is read early and often — it is the one that might deserve a split on cost grounds. Not urgent, not this session.
- **The second unresolved wiki-link.** [[project_memory_slug_migration]] names two; D2 resolves `feedback_verify_before_claiming`. `feedback_tool_preference_chains` remains — decide whether to create it or strike the links.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| **The memory store is NOT under version control** — it lives in `~/.claude/`, not the repo. There is no `git revert` for a bad merge. | **Snapshot the whole store to a dated tarball before Phase 1 and again before Phase 2.** Non-negotiable; a lossy merge with no undo is the one genuinely unrecoverable step here. |
| Merging loses per-file staleness stamps (the "this memory is 5 days old" notice becomes the merged file's date) | Case rows carry their own dates in the table. Accepted cost. |
| A hook is updated but not dry-run, and fails silently | Phase 1 step 5 gates on the dry-run. This has already happened once on this project. |
| Consolidation leaves dangling `[[wiki-links]]` across repo + store | Phase 2 verify step greps both surfaces after each merge. |
| The growth rate estimate (2.8/day) is from a single 5-day window | The design does not depend on it — it justifies urgency, not any structural choice. |
| Native loader behaviour changes under us | Precisely why §2 refuses to target a number. The budget has ~40% headroom below the lowest figure ever claimed. |

---

## 11. Open questions for Harkirat

1. **D2 — approve the six-into-one merge?** It is the template for everything in Phase 2, and it is lossy. My recommendation: yes, but ship it alone and live with it for a session or two first.
2. **D4 — is `memory/archive/` the right home**, or would you rather retired memories go to the repo's existing `docs/archive/` (tracked in git, but off the memory path)?
3. **D6 — is a 16,000-byte budget the right ceiling**, and is an advisory `SessionStart` warning enough, or should breaching it block?
4. **Phase 2 scope** — merge only the verification cluster for now, or approve the token-routing and git clusters in the same pass?
