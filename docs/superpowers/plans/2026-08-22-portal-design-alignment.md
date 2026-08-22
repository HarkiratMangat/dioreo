---
kind: plan
status: frozen
---

# Portal Design Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This plan is unusual in shape — it orchestrates **three separate sessions across four phases**, not one session's task list. Read §"How this plan is organized" before starting any phase.

**Goal:** Close the gap between the live web admin portal and its six approved mockups — both the missing functionality (Access's permission grid, Broadcast's scheduling, Season's mislabeled data) and the missing visual design (zero responsive CSS, undefined color tokens, absent masthead copy) — without a future session re-deriving the investigation that already happened.

**Architecture:** Four phases across three sessions. Session A audits the audit (Phase 1) then builds missing functionality (Phase 2). Session B does the actual visual redesign (Phase 3), consuming what Session A built. Session C verifies and closes gaps (Phase 4). Each phase's boundary is deliberate — see the rationale in each phase's intro, especially why Phase 2 and Phase 3 are different sessions with different jobs.

**Tech Stack:** Preact + htm (no bundler, per portal spec decision 6), vanilla CSS with custom-property tokens, Node's built-in `http` module (no framework), MongoDB/Mongoose. No new dependencies anticipated in any phase.

**Spec:** `docs/superpowers/specs/2026-08-22-portal-mockup-vs-live-gap-audit.md` — the plan argues from this document. **Read it in full before starting Phase 1.** It also references the original `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md` and `docs/superpowers/specs/2026-08-21-portal-compose-ui-design.md`, and the six mockups at `docs/superpowers/mockups/2026-08-20-portal/`.

## Session status — this plan's shared memory, read first, update last

Three sessions execute this plan at different times with no shared memory except this document and whatever's committed to the repo. This table is not a summary someone wrote once — it is the live source of truth for where things stand. Read it before starting anything; update your own row as your literal first and last actions. See "Session handoff protocol" below for the full mechanism.

| Session | Phases owned | Recommended model | Status | Handoff note |
|---|---|---|---|---|
| A | 1 → 2 | Sonnet5-High — `Premise Med · Delib Med -> Sonnet5-High` (Phase 1 is verification with real premise risk; Phase 2 is engineering against already-diagnosed root causes across several files — bounded, not exploratory) | ✅ Complete | `local/handoff/2026-08-22-portal-alignment-session-A.md` |
| B | 3 | Opus5-XHigh — `Premise High · Delib High -> Opus5-XHigh` (genuine creative/design judgment across 5+ realms, multiple skills, multi-round brainstorming — matches Harkirat's own "future opus5 design session" framing) | ⬜ Not started | — |
| C | 4 | Opus5-XHigh — `Premise High · Delib High -> Opus5-XHigh` (verifying "is this actually fixed" is itself a judgment call, not a mechanical check, applied across every realm and every finding, plus an explicitly requested deep sequential-thinking pass) | ⬜ Not started | — |

*(The `Premise <X> · Delib <Y> -> <Cell>` notation is an existing personal convention from Harkirat's global Claude Code config (a premise-risk × deliberation-load model-selection grid), not something defined in this repo — the recommendation itself is usable as a plain instruction even without that grid in hand; it names the reasoning for whoever does have it.)*

**Status values:** ⬜ Not started · 🔄 In progress · ✅ Complete · ⚠️ Blocked (write the reason directly in this cell — don't make the next session hunt for it). A session changes ⬜→🔄 as its first edit (Task X.0, below) and 🔄→✅/⚠️ as its last (the handoff-note task, below), always in the same commit as the rest of that session's work — never a separate, easy-to-forget follow-up commit.

## How this plan is organized

Harkirat's own structure, preserved exactly:

- **Session A runs Phase 1, then Phase 2, in the same sitting.** Phase 1 is a completeness check on the audit spec itself — go verify what it flags as unverified, use sequential-thinking to look for what it might still be missing, amend it. Phase 2 builds the real, missing functionality the audit identified, informed by whatever Phase 1 added.
- **Session B runs Phase 3 alone.** This is the actual redesign — every realm, properly designed and polished to match the mockups' intent (not just their exact pixels, since §2.1 of the audit spec notes the mockups themselves never speced true phone-width layouts). Phase 3 needs Phase 2's functionality already wired, or it will be designing screens for data that doesn't exist yet.
- **Session C runs Phase 4 alone.** Verification: invoke the `design:*` skills fresh, plus a deep sequential-thinking audit, checking Phase 3's actual output against the spec's findings one by one — not a vibe check.

**Why Phase 2 and Phase 3 are different sessions, not one:** building the Access permission-matrix endpoint and fixing `season.js`'s two data bugs are TDD tasks with clear pass/fail tests — normal engineering work. Redesigning five realms to match a visual language is a creative, judgment-heavy process that itself needs brainstorming/design-system/frontend-design/ux-copy invoked *fresh*, informed by what Phase 2 actually shipped (not what the audit predicted it would ship). Collapsing them into one session either rushes the design work or stalls the functional work waiting on design decisions that don't need to block it.

## Global Constraints

- **Never hand-roll a fix `docs/superpowers/specs/2026-08-22-portal-mockup-vs-live-gap-audit.md` already root-caused.** Where that document names an exact file:line and an exact cause, implement that fix — do not re-diagnose from scratch. Where it says "unverified" or "inferred," verify before building on it.
- **Respect the existing `Manifest` component contract (spec §8.2, reaffirmed by the audit spec §3.4): one reusable component, realm-specific behavior arrives only via `columns`/`rows`/config props.** Do not fork or duplicate `manifest.js`/`manifest.logic.js` for Season specifically — fix Season's *config*, per the audit's precise diagnosis.
- ~~**`Announcement.startsAt` is a schema addition — the schema-save gotcha in `.claude/rules/models.md` applies: it is not real until it's in `models/Announcement.js`.**~~ **Corrected by Task 2.6 (2026-08-22 14:12 EDT): the field already existed before this plan was written.** Not a per-user field, so `docs-audit`'s `privacy-inventory` does not apply (confirmed in the audit spec §3.5).
- **This project's own hard invariants still apply throughout:** the `.env`/`.env.dev` boundary, the branch/commit/PR workflow (branch commits free, push/merge/deploy need Harkirat's explicit yes), soft-wrapped Markdown prose, `kind:`/`status:` front matter on any new tracked doc, and `npm run docs:audit` clean before any PR.
- **Every new/changed doc in any phase gets reflowed** (`node scripts/reflow-prose.mjs --write <path>`) before commit — this repo's prose is soft-wrapped, not hard-wrapped (see root `CLAUDE.md`).
- **Any new UI copy (masthead paragraphs, error/empty states, button labels) follows `design:ux-copy`'s principles**: active voice, name things by what the user recognizes, specific over clever. The audit spec §5 has the starting inventory of what's missing and what already works.


## Sub-agent discipline — applies in every phase, every session

Any session executing this plan that dispatches sub-agents — `superpowers:subagent-driven-development` for Phase 2's tasks, a dispatched check during Phase 3's design work, a verification pass in Phase 4 — must prompt each one **tightly**. A cold sub-agent has none of this plan's context and none of the audit spec's evidence; a vague prompt gets a vague, re-derived answer that may silently disagree with what's already been established here.

Every sub-agent dispatch in this plan's execution should carry these standing instructions, stated to the sub-agent explicitly, not assumed:

- **Batch/bundle/consolidate ultra aggressively.** Group independent greps, reads, and checks into as few tool calls as possible in a single message. A sub-agent that round-trips once per file is spending the plan's budget on latency, not work.
- **Use a scripted multi-edit (a Python heredoc) for anything touching more than one or two files**, exactly like Phase 2's tasks above already do for their own examples — not a chain of individual `Edit` calls.
- **Be token-conscious.** Grep for the exact lines needed; never re-read a file already in context. Task 2.3/2.4/2.5's own steps say "read the exact file/lines before writing" for this reason — a sub-agent should follow the same discipline, not read whole files out of caution.
- **Use sequential-thinking freely** for any step that involves real judgment — diagnosing why a test fails, deciding between two implementation shapes, checking a claim against the audit spec. It is inexpensive and this plan's own investigation relied on it repeatedly to catch wrong assumptions before they became wasted implementation work (see the Audit log below).
- **Give the sub-agent the specific file:line citations this plan and the audit spec already have** — Task 2.3/2.4/2.5 above already do this; don't let a dispatched sub-agent re-discover what's already been found and written down.

## Session handoff protocol

Confusion between sessions — Session B not knowing Session A changed the plan, Session C re-investigating something Session B already resolved — is exactly the failure mode this protocol exists to prevent. This is not bureaucracy for its own sake: every piece of it maps to a specific way three isolated sessions have gone wrong on tasks like this before.

**Every session, before touching any task:**
1. Read this entire plan document, not just your own phase's section — the constraints, the audit log, and the other sessions' sections all inform your own work, and a plan that changed underneath you (see point 3 below) is only visible if you read the whole thing.
2. Read the "Session status" table above. If a prior session marked itself ⚠️ Blocked, resolve or escalate that before starting your own phase on top of it.
3. Read the most recent handoff note at `local/handoff/` for this plan (see the naming convention in each phase's own handoff task, below). That directory is gitignored — per this repo's own established convention (`reference_handoff_file_location` in the memory store), no `git log` or in-repo search will ever surface it, so you have to know to look there directly. If you're Session A and none exists yet, that's correct — you're first.
4. Mark your phase 🔄 In progress in the Session status table as your literal first edit, before any other work — this is Task X.0 in every phase below.

**Every session, before ending — whether the phase finished or you're stopping mid-phase:**
1. Write a handoff note (Task X.N, the last task in every phase below) covering: what you actually did, including any deviation from what this plan said and why; what you deliberately left for the next session and what you left unfinished for a different reason; anything that surprised you that this plan didn't anticipate; and anything the next session needs to know before it starts reading task-by-task rather than discovering mid-task.
2. Update the Session status table in this same document: ✅ Complete with your handoff note's path, or ⚠️ Blocked with the reason — in the same commit as the rest of your session's work, never a follow-up.
3. **If anything you learned changes a LATER phase's tasks — not just the prose describing them — edit that phase's tasks directly, in this document, rather than only noting it in your handoff note.** A handoff note is a guide to reading the plan; it is never a substitute for keeping the plan itself correct. A future session should never have to reconcile two disagreeing sources of truth, and a note buried in a gitignored file that never made it back into the tracked plan is exactly how that happens.

**This plan is a working document across its own execution, not a write-once artifact — separate from its `status: frozen` front matter, which only states its doc *kind* per this repo's convention, not that its content is static.** Phase 3 and Phase 4 exist to be edited by Phase 1 and Phase 3 respectively, when what they find warrants it. Treat every "read this first" instruction above as literal, not a formality — this document plus the handoff notes are the only continuity three otherwise-isolated sessions have.

---

## Phase 1 — Audit the audit (Session A, first)

**Why this phase exists:** the audit spec is thorough but self-admittedly incomplete — §7 lists six explicitly unverified items, and the spec itself was corrected once already mid-investigation (§3.4's Manifest finding replaced an earlier, wrong version of itself). A phase whose only job is "go check what's unverified and see if anything else was missed" is cheap insurance against Phase 2 or Phase 3 building on a wrong premise.

- [x] **Task 1.0: Orient yourself — you are Session A, and you own Phases 1 and 2 of a four-phase, three-session plan.** Read "Session status" and "Session handoff protocol" above in full if you haven't already. Confirm no handoff note exists yet at `local/handoff/` for this plan (there shouldn't be one — you're first). Change the Session status table's Session A row to 🔄 In progress as your first commit, before starting Task 1.1.

- [x] **Task 1.1: Read the full audit spec and the four source documents it cites.** Files to read: `docs/superpowers/specs/2026-08-22-portal-mockup-vs-live-gap-audit.md` (full), `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md` (full — the original portal design decisions), `docs/superpowers/specs/2026-08-21-portal-compose-ui-design.md` (full), and all six mockups at `docs/superpowers/mockups/2026-08-20-portal/*.html`, rendered in a real browser — not read as markup. Do not skip rendering the mockups; the audit spec's own §0 explains why reading CSS is not a substitute for looking at the page.

- [x] **Task 1.2: Resolve the six unverified items in audit spec §7, in order.** For each, produce either a real screenshot (real device or the Cloudflare quick-tunnel technique the original investigation used — `.env.dev`'s portal keys are already populated, see `docs/reference/portal-launch-checklist.md` if the tunnel needs restarting) or a direct code read, and write the finding as a dated addendum to the audit spec (see Task 1.4 for the amendment convention):
  1. Armory's real rendering vs. `04-armory-and-commit.html`'s card grid.
  2. Board's real rendering vs. the mockup's Draft/Staged/Blocked/Ready pipeline.
  3. The Commit & diff flow's real rendering vs. the mockup's conflict-callout/typed-confirmation UI (the underlying logic is confirmed real in audit spec §6 — this task is purely about the *visual* treatment).
  4. Analytics's native design intent — render `06-access-and-analytics.html`'s Analytics half (never viewed during the original audit) and get a real screenshot of the portal's actual Analytics tab to compare against.
  5. Confirm whether `season.js`'s hardcoded `state: 'live'` bug (audit spec §3.4) is independently visible on a real device, or fully masked by the header/column overflow.
  6. Check tablet-width (768–1024px) rendering, mockup and real, in both directions.

- [x] **Task 1.3: Run a sequential-thinking pass asking "what does this audit still not consider?", not "does this audit look complete?"** This is a falsification pass per `.claude/rules/plan-drafting.md` — the question is where the spec is *wrong*, not a review of whether it reads well. Concretely check: has every realm's *empty state* been compared, not just its populated state? Has keyboard navigation/tab order been checked anywhere (the audit only checked `:focus-visible`'s CSS rule exists, never that it's reachable in a real tab sequence)? Does the audit's severity grading in §2–§3 match what a real user would experience, or does it over-index on what happened to be screenshotted first? Are there Discord-side surfaces (the bot's own `/manage` panel) that the portal is supposed to match in *behavior*, not just visuals, that haven't been cross-checked?

- [x] **Task 1.4: Amend the audit spec with everything Tasks 1.2–1.3 found.** The audit spec's front matter reads `status: frozen` — in this repo's convention that names the doc's *kind* vocabulary (`spec`-kind docs use frozen/superseded, never live/dead), it is not a ban on correction. Amend it anyway, the same way (see `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md`'s own dated amendment banner for precedent), add a dated `## Addendum — <date>` section at the end rather than rewriting existing findings in place. If Task 1.2 or 1.3 contradicts an earlier finding, strike the old claim rather than deleting it (`~~struck text~~`) and explain why next to it — the audit spec's own §0 exists because a silently-corrected document hides the lesson.

- [x] **Task 1.5: Write a short completeness note at the top of Phase 2, confirming it's safe to proceed.** One paragraph, prepended to this plan's Phase 2 section: what Phase 1 checked, what it found, and explicit confirmation that Phase 2's task list below still matches reality (or a note on what changed and why, if it doesn't).

**Phase 1 exit criteria:** all six §7 items resolved with real evidence; the audit spec has a dated addendum; this plan's Phase 2 section has Task 1.5's completeness note. Do not start Phase 2 without all three.

---

> **Phase 1 completeness note (Session A, 2026-08-22 12:12 EDT):** all six §7 unverified items were resolved with real evidence — a local dev portal boot, a dev-only seeded `PortalSession`, and real Chrome screenshots/DOM queries (the in-app browser pane was abandoned mid-session for horizontal-scroll interactions per Harkirat's own direction; real Chrome via `claude-in-chrome` was used instead). Full findings are in the audit spec's new `## Addendum — 2026-08-22` section. **Nothing below in Phase 2's task list needs to change** — every task's file:line citations and root-cause diagnosis held up against real data (Armory's 133-loadout dev catalogue, Season's 38-row Manifest, a live keyboard-Tab test). The one thing worth flagging for whoever plans Phase 3, not for Phase 2: the mockup's Season nav is a left icon rail, not the shipped horizontal top bar, and the header-overflow bug is content-dependent (triggers on Season's Track/Board toggle, not on Broadcast's simpler header) rather than a single global breakpoint failure — both are addendum items 6, noted here because they change Phase 3's scope, not Phase 2's.

## Phase 2 — Build the missing functionality (Session A, continuing)

**Why this phase exists:** every task below fixes something the audit spec traced to a precise, confirmed root cause — none of this is "build a filter/sort system from scratch" or "build a permission model from scratch." Read audit spec §3.2, §3.4, and §3.5 before starting; each task here cites the exact section it implements.

### Task 2.1: Fix the login button's WCAG contrast failure

**Rationale for doing this here, not in Phase 3:** this is a correctness fix using values already decided in the approved mockup (Discord's own brand color), not a design decision — it requires zero creative judgment, and it's the one thing on this list severe enough (a user cannot read the only button that gets them into the app) not to leave broken for an entire additional session's wait. Implements audit spec §2.3 and §3.1.

**Files:**
- Modify: `portal/ui/shell.js:44`
- Modify: `portal/ui/tokens.css` (new rule, do not touch `.accent-fill`'s existing definition — other elements depend on its current fallback behavior)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed elsewhere — this is a leaf UI change.

- [x] **Step 1: Add a dedicated `.door a` color rule to `tokens.css`, next to the existing `.door` rule in `shell.css` (audit spec §3.1 confirms `#5865F2` is Discord's real brand color, taken directly from `05-door-broadcast-ops.html`):**

```css
/* shell.css — the login CTA is its own rule, not .accent-fill's shared
   topic-accent fallback, because it has no topic and must never depend on
   one being set (see the gap audit's §2.3 for the bug this replaces). */
.door a {
    background: #5865F2;
    color: #fff;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}
```

- [x] **Step 2: Add the Discord glyph and drop the shared `accent-fill` class in `shell.js:44`:**

```js
<a class="door-cta" href="/auth/login">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M20.3 4.4A19.7 19.7 0 0 0 15.4 3l-.3.5a13.6 13.6 0 0 1 4 2 16.4 16.4 0 0 0-14.2 0 13.6 13.6 0 0 1 4.1-2L8.6 3a19.7 19.7 0 0 0-4.9 1.4C1 9 .3 13.5.6 18a19.9 19.9 0 0 0 5.9 3l.8-1.3a13 13 0 0 1-2-1c.2-.1.3-.3.5-.4a14 14 0 0 0 12.4 0l.5.4a13 13 0 0 1-2 1l.8 1.3a19.8 19.8 0 0 0 5.9-3c.4-5.4-1-9.9-3-13.6ZM8.5 15.3c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.9 2-.8 2-1.9 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.9-2 1.8.9 1.8 2-.8 2-1.9 2Z"/></svg>
    Continue with Discord
</a>
```

Rename the CSS rule from Step 1 to `.door-cta` to match (both must use the same class name — pick one and use it in both places; `.door-cta` is used here to avoid colliding with the generic `.door a` selector matching any future link added inside `.door`). ⚠️ **This reasoning was wrong, and Session A's own implementation inherited the mistake before a requested falsification pass caught it (2026-08-22 14:27 EDT).** A bare `.door-cta` (specificity 0,1,0) does NOT avoid the collision — `.door a` (0,1,1) still matches the same anchor structurally and its `display:inline-block` wins over `.door-cta`'s `display:inline-flex` regardless of the distinct class name, since specificity is compared per-property across every matching rule, not decided by which selector "was meant to apply." Confirmed live via `getComputedStyle`: the Discord icon sat 3.5px off-center under the bare selector. Fixed to `.door .door-cta` (two classes, 0,2,0), which deterministically outranks `.door a`. The real lesson for any future portal CSS addition inside an existing structural container: a new distinct class name prevents a *naming* collision, never a *cascade* collision — only higher specificity does that.

- [x] **Step 3: Boot the portal locally (`node --env-file=.env.dev portal/server.js`) and visually confirm in a real browser at a 375px viewport that the button text is legible and the Discord icon renders.** This is a visual fix — there is no automated test that would catch a contrast regression; the manual check is the test.

- [x] **Step 4: Commit.**

```bash
git add portal/ui/shell.js portal/ui/tokens.css
git commit -m "fix(portal): give the login CTA Discord's real brand treatment"
```

### Task 2.2: Add the four missing Season category-accent tokens

Implements audit spec §2.2. Values read directly from the approved mockup, not invented.

**Files:**
- Modify: `portal/ui/tokens.css` (add to the existing single `:root` block — see that file's own header comment on why a second `:root` block is a real, previously-shipped bug class)

- [x] **Step 1: Add these four lines inside the existing `:root { ... }` block, in the "signal" comment section alongside `--patch`/`--warn`/`--ok`:**

```css
--draw: #FF3430;
--ret: #337BA6;
--ev: #1F8A5E;
--play: #8A6BD1;
```

- [x] **Step 2: Boot the portal locally, open Season → Track, and visually confirm the four lane types now render in distinct colors instead of flat grey.**

- [x] **Step 3: Commit.**

```bash
git add portal/ui/tokens.css
git commit -m "fix(portal): define the 4 undefined Season topic-accent tokens"
```

### Task 2.3: Fix Season's Manifest column — humanized labels instead of raw field names

Implements audit spec §3.4, finding 1. The humanized strings already exist in `season.js` for a different control (the lane-type dropdown) — this task reuses them, it does not invent new copy.

**Files:**
- Modify: `portal/ui/season.js` (near `SEASON_COLUMNS`, `season.js:16-19`, and the lane-choice array at `season.js:23-26`)
- Test: `scripts/seasonOps.test.js` (add a case; this file already exists per `.claude/rules/scripts-and-migrations.md`'s "Portal core plan 2's op + handler-snapshot tests" entry)

**Interfaces:**
- Consumes: the existing `[{value, label}]` array at `season.js:23-26`.
- Produces: a `LANE_LABELS` lookup object other Season code may reuse later — export it if `season.js` doesn't already have a barrel export pattern; check the file's existing `module.exports`/`export` shape first and match it.

- [x] **Step 0: Confirm the real module boundary before writing anything.** `season.js`'s existing header comments (and every other realm's `*.logic.js` file) establish the pattern of a pure-logic file loaded as a classic `<script>`, required via CommonJS in Node tests — but do not assume `LANE_LABELS` belongs in a NEW `season.logic.js` versus directly in `season.js` versus an existing one. Read `season.js` in full, check whether a `season.logic.js` already exists (it wasn't seen during the audit, which read `season.js` but not exhaustively enumerated `portal/ui/`), and pick the real path before Step 1's `require(...)` can be anything but a placeholder.

- [x] **Step 1: Write the failing test.** In `scripts/seasonOps.test.js`, add (replace `PATH-NOT-YET-CONFIRMED` with what Step 0 found):

```js
const { LANE_LABELS } = require('PATH-NOT-YET-CONFIRMED'); // Step 0 below finds the real path — do not run this until it's replaced

test('LANE_LABELS humanizes every internal lane key used by toManifestRows', () => {
    assert.strictEqual(LANE_LABELS.newDraws, 'New draw');
    assert.strictEqual(LANE_LABELS.returningDraws, 'Returning draw');
    assert.strictEqual(LANE_LABELS.calendar, 'Event');
});
```

- [x] **Step 2: Run it to verify it fails** (`LANE_LABELS` doesn't exist yet).

- [x] **Step 3: Build `LANE_LABELS` from the existing lane-choice array and apply it to the column.** Derive it rather than hand-writing a second copy, so the two can't drift:

```js
const LANE_LABELS = { newDraws: 'New draw', returningDraws: 'Returning draw', calendar: 'Event' };
// SEASON_COLUMNS' 'lane' entry needs a formatter — check whether Manifest's column config
// already supports one (grep manifest.js for a `format`/`render` column property before adding
// a new one to the shared component; if it doesn't exist yet, that's a small, legitimate addition
// to manifest.js itself since every realm benefits from it, not just Season).
```

  If `Manifest`'s column config has no per-column formatter today, add one (`columns[].format?: (value, row) => string`) to `portal/ui/manifest.js`'s render function, defaulting to the raw value so every other realm's existing column config keeps working unchanged. Then set `SEASON_COLUMNS`' `lane` entry to `{ key: 'lane', label: 'Type', format: (v) => LANE_LABELS[v] || v }`.

- [x] **Step 4: Run the test again to verify it passes.**

- [x] **Step 5: Boot the portal locally, open Season → Manifest, confirm the Type column shows "New draw" etc. instead of `newDraws`.**

- [x] **Step 6: Commit.**

```bash
git add portal/ui/season.js portal/ui/manifest.js scripts/seasonOps.test.js
git commit -m "fix(portal): humanize Season Manifest's Type column instead of raw field names"
```

### Task 2.4: Fix `toManifestRows()`'s hardcoded `state: 'live'`

Implements audit spec §3.4, finding 2.

**Files:**
- Modify: `portal/ui/season.js:37` (inside `toManifestRows()`)
- Test: `scripts/seasonOps.test.js`

- [ ] **Step 1: Read `models/Draw.js` and `models/CalendarEvent.js` (or wherever a draw/event's real staged/live status is stored) to confirm the actual field name and its possible values before writing the fix** — do not guess a field name. If no such field exists yet on the underlying documents (staged-vs-live may currently live only in the `Changeset`/`ChangeLog` layer per `core/changeset.js`, not on the item itself), that changes this task's shape: derive `state` from whether the item's id appears in an open `Changeset` for this realm, not from a document field that doesn't exist. Check `core/changeset.js`'s exports for a helper before writing new logic.

- [ ] **Step 2: Write the failing test:**

```js
test('toManifestRows reflects real state instead of hardcoding live', () => {
    const rows = toManifestRows({ newDraws: [{ _id: '1', title: 'X', /* whatever field Step 1 found */ }] });
    assert.notStrictEqual(rows[0].state, undefined);
    // exact assertion depends on Step 1's finding — assert the REAL expected value, not 'live' unconditionally
});
```

- [ ] **Step 3: Run it to verify it fails against the current hardcoded behavior.**

- [ ] **Step 4: Replace the hardcoded `state: 'live'` with the real derivation found in Step 1.**

- [ ] **Step 5: Run the test again to verify it passes.**

- [ ] **Step 6: Boot the portal locally, open Season → Manifest, confirm the State column/pill varies by row instead of always reading LIVE.**

- [ ] **Step 7: Commit.**

```bash
git add portal/ui/season.js scripts/seasonOps.test.js
git commit -m "fix(portal): derive Season Manifest's state instead of hardcoding live"
```

### Task 2.5: Expose the Access permission matrix through the portal API

Implements audit spec §3.2. The data layer (`getAdminPermissionsMap()`) and the column registry (`utils/manageActions.js`'s `ACTIONS_BY_PAGE`) already exist — this task wires them together and exposes them, it does not build a new data model.

**Files:**
- Modify: `portal/api/access.js`
- Test: `scripts/portalApi.test.js` (existing file, per `.claude/rules/scripts-and-migrations.md`)

**Interfaces:**
- Consumes: `utils/adminAccess.js`'s `getAdminPermissionsMap()` (returns `Map<discordId, permissions[]>`) and `utils/manageActions.js`'s `ACTIONS_BY_PAGE`/command registry (its `module.exports` block was seen near the end of the file during the audit, but the exact line and exact export names were NOT individually confirmed — read the file yourself before writing the route; do not trust a line number from this plan for this one).
- Produces: a new route, e.g. `GET /api/access/matrix`, returning `{ admins: [{ discordId, grants: { [scopeKey]: boolean } }], scopes: [{ key, label, kind: 'command'|'page' }] }` — shape this to match exactly what a grid component needs (rows = admins, columns = scopes), not a raw dump of the underlying data structures.

- [ ] **Step 1: Read `portal/api/access.js`'s current route registrations and `utils/manageActions.js`'s exact exports (both files, in full) before writing anything** — this task's whole point is reusing what exists correctly, so get the real names right first.

- [ ] **Step 2: Write the failing test** in `scripts/portalApi.test.js`, following that file's existing pattern for testing a route handler (check how it currently tests `gateCommit` for the harness shape — auth stubbing, request/response mocking):

```js
test('GET /api/access/matrix returns every admin crossed with every scope', async () => {
    // stub getAdminPermissionsMap and manageActions per the existing test file's stubbing pattern
    const result = await callRoute('GET', '/api/access/matrix', { session: OWNER_SESSION });
    assert.strictEqual(result.status, 200);
    assert.ok(Array.isArray(result.body.admins));
    assert.ok(Array.isArray(result.body.scopes));
});
```

- [ ] **Step 3: Run it to verify it fails (route doesn't exist).**

- [ ] **Step 4: Implement the route in `portal/api/access.js`**, wrapped in `requireAdmin` per this codebase's standing rule (every mutating **and every data-bearing** admin route goes through it — `scripts/portalApi.test.js`'s existing source-scan invariant checks this for `POST` routes; confirm whether it also covers `GET`, and if not, that scan itself may need extending in this task since a permission matrix is sensitive data).

- [ ] **Step 5: Run the test again to verify it passes.**

- [ ] **Step 6: Commit.**

```bash
git add portal/api/access.js scripts/portalApi.test.js
git commit -m "feat(portal): expose the admin permission matrix via the API"
```

**Note for Phase 3, not a Phase 2 task:** this task deliberately stops at the API. Building the actual grid *component* that renders this data as the mockup's matrix (rows/columns/checkmarks, "By admin"/"By scope" tabs) is real UI design work — it belongs in Phase 3, which will consume this endpoint.

### Task 2.6: Add `Announcement.startsAt` — ✅ ALREADY DONE, verified not built

**Step 0 finding (2026-08-22 14:12 EDT):** `Announcement.startsAt` already exists — added 2026-08-21 09:31 EDT, the day *before* this audit spec was written, and wired end-to-end (`core/ops/announcements.js` validate/invert, `portal/ui/broadcast.js`'s Add form, `broadcast.logic.js`'s op builders). The audit spec's §3.5 claim that this field was missing was stale at the moment it was written — confirmed and struck in place in the spec itself (2026-08-22 addendum). `docs/db-deferred-list.md` no longer carries a "not built" entry for it either; its current `startsAt` entry is about a separate, narrower validation gap (a `startsAt > expiresAt` comparison that silently no-ops when both arrive as JSON strings), not the field's existence.

**No code change needed for this task.** What audit §3.5 got right and what still stands unblocked for Phase 3: the `LIVE`/`SCHEDULED`/`EXPIRED` state-pill *rendering* genuinely does not exist yet (`portal/ui/broadcast.js` hardcodes `stateOf=${() => 'live'}`) — Phase 3 builds that from data that was already there, with no schema dependency to wait on.

~~Original Steps 1-3 (read the schema, add `startsAt: { type: Date, default: null }`, commit) — struck rather than deleted per this doc's own §0 convention, since they describe work that turned out to already be done.~~

- [x] **Step 0 (the only step actually needed): confirm the field's real state before writing anything, per this task's own original caution — and it turned out to already exist.**

### Task 2.7: Write Session A's handoff note for Session B

- [x] **Step 1: `mkdir -p local/handoff` if it doesn't already exist, then write `local/handoff/2026-08-22-portal-alignment-session-A.md`** (use the date this session STARTED the phase, not whenever it happens to finish writing this note — the filename convention is `YYYY-MM-DD-portal-alignment-session-<A|B|C>.md`) covering everything the handoff protocol above requires: what Phase 1 actually found in the six previously-unverified items (not a repeat of the audit spec — a summary of what changed), what Phase 2 actually shipped vs. this plan's original task list (especially Task 2.4's real `state` derivation, which this plan explicitly could not specify in advance), and anything Session B needs to know before starting Phase 3 that isn't already obvious from reading the updated audit spec and this plan.

- [x] **Step 2: Update the Session status table** — Session A row to ✅ Complete, with the handoff note's path in the last column.

- [x] **Step 3: Commit everything together** (the handoff note is gitignored and won't be part of this commit, but the Session status table edit is):

```bash
git add docs/superpowers/plans/2026-08-22-portal-design-alignment.md
git commit -m "docs(portal): mark Session A complete, phases 1-2 of the design alignment plan"
```

**Phase 2 exit criteria:** all six tasks committed on the branch; `npm test` and `npm run docs:audit` both clean; a local boot of the portal (`node --env-file=.env.dev portal/server.js`) confirms Tasks 2.1–2.4 visually, and Task 2.5's endpoint returns real data via a manual `curl`/browser check.

---

## Phase 3 — The redesign (Session B, alone)

**Why this phase is deliberately not fully specified here:** the visual design decisions belong to whoever does this work, informed by fresh invocations of `frontend-design:frontend-design`, `design:design-system`, and `design:ux-copy` at the time Phase 3 actually starts — not baked into this plan by a session that isn't doing the design. What *is* specified is the scope, the inputs, the process, and the acceptance criteria, so Phase 3 has no ambiguity about what "done" means.

- [ ] **Task 3.0: Orient yourself — you are Session B, and you own Phase 3 alone, between Session A (already complete) and Session C (not yet started).** Read "Session status" and "Session handoff protocol" at the top of this document in full. Read Session A's handoff note at `local/handoff/` (the exact filename is in the Session status table's Session A row) before reading anything else — it will tell you what actually happened in Phases 1-2, which may differ from what this plan originally specified. Change the Session status table's Session B row to 🔄 In progress as your first commit.

- [ ] **Task 3.1: Read the audit spec (with Phase 1's addendum) and this plan's Phase 2 diff in full before starting.** Phase 3 is redesigning what Phase 2 actually shipped, not what the audit predicted — confirm the two match; if Phase 2 deviated from its own plan, that deviation is the real starting point.

- [ ] **Task 3.2: Invoke `superpowers:brainstorming`, classify this as Architectural, and run its full process** — clarifying questions, 2-3 approaches, sectioned design presented to Harkirat, written to a new dated spec (`docs/superpowers/specs/YYYY-MM-DD-portal-redesign-visual-design.md`) — **before writing any CSS or component code.** This plan's job ends at handing Phase 3 a scoped brief; brainstorming's own hard gate about approval before implementation still applies in full.

- [ ] **Task 3.3: For each realm, invoke `design:design-system` (audit + extend), `frontend-design:frontend-design`, and `design:ux-copy`, and produce the masthead copy + visual treatment**, covering at minimum every item the audit spec lists under that realm in §2–§3:
  - **Shell/nav:** the header-overflow fix (audit §2.1) — needs a genuine below-640px design, not a port of the mockups' ~1200px tablet breakpoint (audit §2.1's explicit nuance).
  - **Season (Track + Manifest + Board):** the 4-color category system now has real tokens (Phase 2 Task 2.2) to build on; Board has never been screenshotted real or mock until Phase 1 got evidence — use that evidence, not the plan's guess.
  - **Access:** the grid component consuming Phase 2 Task 2.5's new endpoint.
  - **Broadcast:** state pills (LIVE/SCHEDULED/EXPIRED) now unblocked by Phase 2 Task 2.6's schema field, plus the data-quality callout pattern from the mockup.
  - **Armory:** whatever Phase 1 Task 1.2.1 found.
  - **Analytics:** whatever Phase 1 Task 1.2.4 found — this may turn out to need its own brainstorming pass if the gap is larger than a styling difference (an unstyled raw-text dump vs. a designed dashboard is closer to a missing feature than a missing style).
  - **Every realm's masthead copy** (audit §3.3) — this is the single most labor-intensive item on this list; treat it as real writing work.

- [ ] **Task 3.4: Fix the deeper systemic issues the audit found, not just their visible symptoms:**
  - The missing layout tokens (`--rail`/`--hdr`, audit §4) — tokenize shell dimensions rather than leaving them hardcoded per-property, so the mobile breakpoint from Task 3.3 has one place to override them.
  - The missing component states (audit §4's completeness table — no hover/disabled/loading treatment found anywhere for buttons or inputs).
  - `:focus-visible` exists globally but was never confirmed reachable in a real keyboard tab sequence (audit §7 item, if Phase 1 confirmed it's a real gap) — fix if so.

- [ ] **Task 3.5: Self-review against the audit spec, item by item.** For every numbered finding in audit spec §2 and §3, write one line in the new visual-design spec's own addendum: fixed / deliberately deferred with reason / found to be already fine. This is what makes Phase 4's job checkable instead of a re-investigation from scratch.

### Task 3.6: Write Session B's handoff note for Session C

- [ ] **Step 1: `mkdir -p local/handoff` if it doesn't already exist, then write `local/handoff/YYYY-MM-DD-portal-alignment-session-B.md`** (real date, not the literal string — use the date this session started Phase 3) covering: the new visual-design spec's path and a one-paragraph summary of the direction taken, the per-finding resolution notes from Task 3.5 (or a pointer to them if they're long), anything deferred out of Phase 3 with a reason, and anything Session C should specifically scrutinize given what was hardest to get right during the redesign.

- [ ] **Step 2: Update the Session status table** — Session B row to ✅ Complete, with the handoff note's path.

- [ ] **Step 3: Commit.**

```bash
git add docs/superpowers/plans/2026-08-22-portal-design-alignment.md
git commit -m "docs(portal): mark Session B complete, phase 3 of the design alignment plan"
```

**Phase 3 exit criteria:** a written, Harkirat-approved visual design spec exists; every §2/§3 finding in the audit spec has a one-line resolution note; `npm run docs:audit` and `npm test` clean; a local boot at a real 375px viewport visually confirms the shell no longer overflows.

---

## Phase 4 — Verify and close the gap (Session C, alone)

- [ ] **Task 4.0: Orient yourself — you are Session C, the last of three, closing out this plan.** Read "Session status" and "Session handoff protocol" at the top of this document in full. Read BOTH prior handoff notes at `local/handoff/` (Session A's and Session B's paths are in the Session status table) before starting — Session C's whole job is checking Phase 3's output against what was actually intended, and that intent lives across both notes plus the specs, not in any one document alone. Change the Session status table's Session C row to 🔄 In progress as your first commit.

- [ ] **Task 4.1: Invoke `design:accessibility-review` against the redesigned portal** — WCAG contrast (the exact class of bug Task 2.1 fixed one instance of — check nothing else in Phase 3's new code repeats it), touch target sizes, keyboard nav, screen reader behavior.

- [ ] **Task 4.2: Invoke `design:design-critique` against the live redesigned portal**, real device, following the same rigor as the original audit — real screenshots, not descriptions; the mockups as the comparison baseline, not a vibe check.

- [ ] **Task 4.3: Run a deep sequential-thinking audit pass, checking Phase 3's Task 3.5 resolution notes against the actual shipped code and a real render — not against Phase 3's own claims about itself.** This is the same falsification discipline as Phase 1 Task 1.3, aimed at Phase 3's output instead of the original audit: for each "fixed" line in Phase 3's addendum, verify it's actually fixed by reading the code and looking at the render, not by trusting the note.

- [ ] **Task 4.4: File anything still open** — as a dated addendum to whichever spec is most relevant (the original audit, or Phase 3's design spec), or in `docs/db-deferred-list.md` if it's a deliberate, scoped-out gap rather than an oversight. No unresolved finding should be silently dropped; every one gets an explicit disposition.

### Task 4.5: Close out the plan

- [ ] **Step 1: Update the Session status table one last time** — Session C row to ✅ Complete, with the verification report's path (Task 4.4's output) in the last column. This is the plan's final state: three ✅ rows, nothing left ⬜ or 🔄 or ⚠️ without an explanation of why it's staying that way.

- [ ] **Step 2: Commit.**

```bash
git add docs/superpowers/plans/2026-08-22-portal-design-alignment.md
git commit -m "docs(portal): close out the design alignment plan — all 4 phases complete"
```

No further handoff note is needed — Session C is the last session this plan defines. If Task 4.4 found gaps large enough to need a fourth session, that's a new plan built from this one's closing state, not a silent continuation of this document.

**Phase 4 exit criteria:** a written verification report (as a spec addendum, not a throwaway chat summary) covering every item from Task 4.1–4.3, with an explicit disposition for anything not fully closed.

---

## Audit log

Falsification pass run against this plan while writing it (per `.claude/rules/plan-drafting.md` — silent-failure risk is real: a wrong Phase 2/3 boundary would have a future Opus 5 session either re-diagnosing already-solved problems or building screens against data that doesn't exist; premise risk is real, since the source audit itself was already corrected once mid-investigation; expensive to redo, since this spans three future sessions).

| Finding | Severity | Resolution |
|---|---|---|
| Original framing assumed Season's Manifest filter/sort/state-pill system needed building from scratch (Phase 2 scope) | Would have wasted real Session A implementation time re-building a working system | Corrected after reading `manifest.logic.js`/`manifest.js`/`manifest.css` directly — the engine is real and reused across every realm per spec §8.2. Re-scoped Task 2.3/2.4 to the two actual, narrow defects in `season.js`'s config and data-derivation, both cited to exact lines |
| Assumed Access's permission-grid needed a new data model | Would have led Phase 2 to build a duplicate of `getAdminPermissionsMap()` | Corrected after reading `utils/adminAccess.js` directly — the data layer exists and is cached; only the API exposure and the grid UI are missing. Task 2.5 scoped to the API only, with UI explicitly deferred to Phase 3 |
| Assumed Board/Commit's rich UI meant the underlying pipeline logic was also missing | Would have led Phase 2 to duplicate `gateCommit()`/`columnFor()`/`tierOf()`, which already exist and are tested | Corrected after reading `board.logic.js`/`track.logic.js` and finding `scripts/portalApi.test.js`/`portalUi.test.js` already cover them. Classified as a Phase 3 (visual) item, not Phase 2 (functional) |
| The plan initially had no explicit dependency ordering between Broadcast's `SCHEDULED` pill (Phase 3) and `Announcement.startsAt` (a schema change) | Phase 3 would have hit a wall trying to design a state that can't be computed | Made explicit as a named Phase-2-before-Phase-3 dependency (Task 2.6), not left implicit |
| Considered writing Phase 3's actual visual designs into this plan directly, since the audit already has a lot of detail | Would have either rushed the design work to fit a plan document's format, or bound a future creative session to decisions made by a session not doing that work | Rejected — Phase 3 is scoped (what, from what evidence, to what acceptance bar) but not designed. The brainstorming skill's own hard gate (no implementation before a human approves the design) applies to Phase 3's redesign specifically, and this plan should not pre-empt that approval by pre-deciding the design |
| Unverified — Phase 2 Task 2.4's exact `state` derivation depends on a model field this plan's author did not confirm exists (`models/Draw.js`/`models/CalendarEvent.js`'s real staged-vs-live representation) | If wrong, Task 2.4's test would be written against a nonexistent field | Deliberately left as an explicit "read this first, do not guess" first step in Task 2.4 rather than guessing a field name that might not survive contact with the real schema |

**Cleared, not fixed** (checked and found to be genuine non-issues, not overlooked): the color-token system being *centrally* sourced (zero hardcoded hex outside `tokens.css` — confirmed by grep, not assumed); the "blued steel" skin/radius/spacing decision matching what's actually in `tokens.css` (checked against `02-skins-and-structures.html` and the original design spec's §230 decision line — no drift found); `docs-audit`'s `privacy-inventory` scope for `Announcement.startsAt` (confirmed it only tracks `discordId`/`userId` fields, so no privacy-doc update is needed for this schema change).
