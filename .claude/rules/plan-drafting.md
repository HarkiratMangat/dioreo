---
kind: rule
status: live
paths:
  - "docs/superpowers/plans/**"
  - "docs/superpowers/specs/**"
---

# Drafting a plan — the falsification pass

*Loads when you touch a spec or a plan. Adopted 2026-08-20 12:00 EDT by Harkirat, after the pass that produced `docs/superpowers/plans/2026-08-20-hotpatch.md` found ten defects in a design that had already read as finished.*

## The one rule

> **Before a plan is approved, run a pass whose stated job is to find where it is WRONG — never to "review" it. Record what that pass found, in the plan, under `## Audit log`.**

Enforced by `docs-audit`'s **`plan-audit-log`** (ERROR) for every plan dated on or after **2026-08-20**. Earlier plans are exempt by design — failing files for lacking a section that did not exist when they were written only teaches the next reader that the audit lies.

## Why the wording matters more than the ceremony

The measured difference is in the *question*, not the process. Asked to **review** its own hotpatch plan, a session found polish. Asked to **falsify** it — *where is this wrong?* — the same session, on the same document, found ten defects, and **two of them would have shipped a silently wrong result**:

- the baseline commit was taken from `git rev-parse HEAD`, which made the entire feature a **no-op** in the workflow it was built for, while reporting success;
- a new or reshaped slash command would never have reached Discord, under a ✅ **Applied** message.

Neither was visible from the plan text. Both came from **going and checking a claim the plan had accepted** — *is `DIORS_COMMIT` actually set?* (it is not, and `utils/logger.js:30` says otherwise) and *what if the pulled file is new?*. That is the whole mechanism: a falsification pass sends you to check things; a review pass does not.

## What the pass actually is

1. **`superpowers:writing-plans`** — mandatory whenever there is a plan at all. Its per-task "which exact files does this touch" discipline is itself a defect-finder: it is what forced `utils/logger.js` open in the first place.
2. **The reader-test lens** from `anthropic-skills:doc-coauthoring` — predict what a reader with no context would ask, then check whether the document answers it. Cheap, and it found two real gaps (*does this replace `deploy.sh`?*, *what if I hotpatch then restart?*). ⚠️ Apply it as a lens; do **not** spawn a subagent for it unless Harkirat asks — the standing rule here is no unrequested agent dispatch. 🔴 **THIS DOES NOT GOVERN §L's CONDITION ⑥, AND A READER TEST FOUND A FRESH SESSION STALLING ON EXACTLY THAT COLLISION (2026-09-01).** They are different passes: this one is a LENS applied to a plan you are drafting, run in-head. **⑥ is the §0.5c READER TEST — read-only agents with no transcript, handed the finished carriers, asked where they cannot continue** — and it is a named close condition of the portal conformance plan, which Harkirat approved and has twice asked for by name. 🔴 **REVERSED 2026-09-01 19:27 EDT — ⑥ NEEDS HIS APPROVAL TOO, AND IT RUNS LAST.** This line used to read *"dispatch it for ⑥ without asking again"*, and that licence produced **seven agents in one session, dispatched on my own judgement, three killed unread**. Harkirat: they are saved *"for basically the end of the session once everything is done and basically push ready."* ⚠️ **The timing is not a courtesy, it is what makes the audit mean anything**: ⑥ audits a FINISHED handoff, and an audit of work still in flight measures a document that is about to change. **Ask, wait for a yes, then run exactly two agents** — the split is in the conformance plan's §0.5c. The standing rule here is unchanged and now has no exception: no unrequested agent dispatch.
3. **`mcp__sequential-thinking`, framed as falsification.** Multiple passes: correctness defects · alternative designs you rejected and why · **questions you never asked** · what the plan rests on that you have not verified.

## Boundaries — this is NOT for every task

The hotpatch pass cost roughly 70 turns. On a bounded one-file change with a fast feedback loop that is pure overhead: the bug shows up in seconds anyway. **Run the full pass when at least one of these holds:**

- **The failure mode is silent** — nothing tells you it is wrong. (Both serious hotpatch defects were of this kind.)
- **Premise risk is real** — the plan rests on claims nobody has checked.
- **The work is expensive to redo** — many files, or a live production surface.

For a bounded change, `writing-plans` alone is enough and no plan document is needed at all — see `superpowers:brainstorming`'s three paths.

## Writing the audit log

A table is the readable shape: **finding · severity · where fixed**. Then, briefly:

- **cleared, not fixed** — hazards you checked and found to be non-issues. These are as valuable as the defects, and without them a later session re-investigates the same ground.
- **alternatives re-examined** — designs you reconsidered and still rejected, with the reason.
- **assumptions converted to measurements** — anything you were about to assert, and how you tested it instead.

⚠️ **"No defects found" is a legitimate entry and must stay writable.** A gate that cannot be satisfied honestly only teaches people to invent findings. The section proves the pass *happened*; it does not promise it was fruitful.

⚠️ **The audit is expected to change the SPEC too, not only the plan.** Six of the hotpatch findings were patched back into the design document. A pass that only ever edits the plan has not been allowed to reach far enough.

Related: [[feedback_verify_before_claiming]] · [[feedback_not_checkable_is_usually_unexamined]] · `docs/superpowers/plans/2026-08-20-hotpatch.md` (the worked example this convention came from).
