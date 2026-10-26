---
kind: spec
status: frozen
---

# Portal compose UI — design

**Decided 2026-08-21 21:32 EDT, autonomously per Harkirat's explicit delegation** ("scope it first... you don't need my reconfirmation on it, just make sure you invoke those skills to get a proper grasp of it yourself"). This is not a new architecture — it is the missing slice of the already-frozen `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md`: the compose surfaces (add/edit forms, drag handles, bulk staging) that Session B/C's Task 5/6 build never wired up, identified in `local/handoff/2026-08-21-portal-plan3-session-C.md` §"THE ONE THING TO INTERNALIZE FIRST". Every decision below is scoped to closing that gap; nothing here reopens a decision the 2026-08-20 spec already made.

## 1. The one resolution that shapes everything else: tier prose vs. the approved mockup

§5 of the frozen spec says tier 1 "saves on field commit" — implying an edit auto-saves the instant you make it. But the approved Board mockup (`03-three-surfaces.html`) shows a tier-1 item ("Havoc rerun · add returning draw") sitting in the **Staged** column, needing an explicit Commit click, with "Undo would remove the draw" shown before that click happens. The two disagree on whether tier 1 is instant. The spec itself resolves this class of conflict: **"the mockups are what was actually approved."**

I honor both, mapped to where each was actually shown:
- **Manifest's single-cell inline edit** (an existing row, one field) auto-chains stage→commit in one client action, giving the true "saves on commit, inline `saved · undo`" feel §5 describes — this is the case that prose was written about.
- **Every other compose action** — new-record forms, Track's drag-to-shift-date, and all bulk actions — only **stages** (`POST /api/changeset`) and surfaces on Board for a deliberate Commit, exactly as the mockup shows, even when the resulting op is tier 1 with no gates (a one-click "Commit" on an already-Ready card).

This costs nothing new on the backend: both paths are the same two already-built, already-verified routes (`POST /api/changeset`, `POST /api/changeset/:id/commit`), called once or twice by the frontend. **No backend mutation logic changes.**

## 2. The only backend addition: a preview endpoint

Task 6's mockup (`04-armory-and-commit.html`) shows a "LIVE PREVIEW — AS DISCORD RENDERS IT" panel calling `buildLoadoutCard()` on the selected build. Nothing in `portal/api/*.js` exposes that function today, and nothing renders Components V2 JSON in a browser at all — this gap exists across the *whole* portal, not just Armory, because §4's operation algebra promised every `preview()` a `discordPayload` field and none of the six op modules actually populate one.

Building a general Components V2 → HTML interpreter is out of scope (real scope creep — Discord's V2 vocabulary is large). `buildLoadoutCard()` is one function with a small, fixed output shape (confirmed by reading it): a type-17 Container wrapping type-10 TextDisplay (markdown: `#`/`###`/`-#` headings, `> ` blockquote, `` `code` ``), type-14 Separator, type-12 MediaGallery (one image), and one type-1 ActionRow of type-2 Buttons. A renderer scoped to exactly those five types is tractable and stays correct because it's driven by the same function Discord's own render is.

- **New:** `GET /api/armory/preview?id=<loadoutId>` — gated identically to `GET /api/armory` (same `grantedPagesFor(ARMORY_PAGES)` check), calls `buildLoadoutCard([loadout], 0, { color: getMpCategoryAccent(loadout.category), idPrefix: 'preview_' })`, returns the raw JSON. Read-only, no op, no changeset.
- **New:** `portal/ui/v2Render.js` (ESM, pure `render(components) -> htm tree`) — scoped to the five types above. Buttons render inert (`disabled`) since the preview is a picture, not a live Discord message.
- This is genuinely scoped to Armory only. Season/Broadcast/Access/Analytics have no equivalent "does it call the bot's real render" requirement anywhere in the frozen spec or mockups — inventing one for them would be scope creep, not fidelity.

## 3. Manifest gains two opt-in hooks, stays entity-agnostic

The frozen spec is explicit: *"If a realm needs to modify the Manifest, that is a signal the abstraction is wrong — stop and fix it rather than special-casing."* So the new capabilities are generic hooks, not per-realm branches inside `manifest.js`:

- `onAdd` (optional) — renders a "+ Add" button in the toolbar. Manifest doesn't know what "Add" means; it just calls the prop. The realm owns what appears (a form rendered above the Manifest, in the realm's own `viewSlot`, not inside `<Manifest>`).
- `columns[].editable` + `buildEditOp(row, columnKey, newValue) -> op` (optional, realm-supplied) — a column marked `editable` becomes click-to-edit; on commit, Manifest calls `buildEditOp` to turn the raw new value into a real op, then calls the new `composeClient.stageAndCommit(realm, [op], csrfToken)` (stage then immediately commit, since single-cell edits are always tier 1 by construction — editing one field of one record). Manifest never constructs an op itself; it only orchestrates the edit-and-commit cycle around whatever op the realm hands back.

`portal/ui/composeClient.js` (new, ESM) is the one shared client for every realm's compose actions:
```js
stageOps(realm, ops, csrfToken)          // POST /api/changeset -> {changesetId, state, tier, failures, preview}
stageAndCommit(realm, ops, csrfToken)    // stageOps, then POST /commit with confirmText undefined (tier 1 needs none)
```
Failures from either surface as an inline notice using the same pattern `season.js`'s `handleCommit` already established (a `notices` array feeding `<Tray>`).

## 4. Track drag handles — scoped to the end-date edge

The mockup's own worked example is "shift end date +3d" — I scope the drag interaction to that: a ~6px hit zone on a band's **right edge**. Dragging the **left/start** edge or moving a whole band is a natural extension but not in the mockup's worked example or the handoff's named gap; deferred explicitly rather than built speculatively (YAGNI).

- `track.logic.js` gains two pure functions (tested as data, per the spec's own frontend-testing story):
  - `dateFromOffset(offsetPercent, window)` — the inverse of the existing `barGeometry`, turning a pointer's percent-position back into a snapped (day-granularity) date.
  - `editOpFor(item, newEndDate)` — builds `{type, target, payload}` preserving every other field of the item, since `draw.edit`/`calendar.edit`'s `validate()` needs the full record, not a partial patch (confirmed by reading `core/ops/draws.js`/`calendar.js`).
- `track.js` wires `pointerdown`/`pointermove`/`pointerup` on the edge handle, shows a live date tooltip while dragging, and on drop calls `composeClient.stageOps` (stage only — lands on Board like the mockup shows) then triggers the same `fetchChangesets` Season's Board already re-runs after export/commit.

## 5. Per-realm forms and bulk actions — the op vocabulary, read from the actual code

Every op type and its exact `payload` shape was read from `core/ops/{draws,calendar,season,loadouts,announcements}.js`, not assumed. Full list is in the implementation plan; the shape decisions worth stating here:

- **Armory bulk bar drops "Re-fetch images."** It appears in the mockup but has no backing op in `core/ops/loadouts.js` — it's a Cloudinary re-cache action outside the operation algebra entirely. Adding a new op type would be backend scope creep beyond "wire up the already-built algebra," which is the actual gap this design closes. Named here so it reads as a decision, not an oversight.
- **Badges input reuses `utils/adminParser.js`'s `parseLoadoutBadges()` token format** (`meta,best,toxic`/`meta,top5`) via the same validation the `/manage` modal already uses, so the portal's error text matches Discord's rather than inventing a second badge grammar.
- **Broadcast has no bulk-edit op** (`core/ops/announcements.js` only has `post`/`edit`/`delete`, no `bulkX`) — its bulk bar is Export selection / Stage deletion only, matching what actually exists.
- **Season's Manifest bulk bar** ("Shift dates…", "Change type…") maps a selection to `draw.edit`/`calendar.edit`/`draw.bulkDelete`/`calendar.bulkDelete` by each row's own `lane` (kind), matching `pageForOp`'s existing per-mode resolution pattern rather than assuming one op type covers every row kind.

## 6. Board needs no changes

`portal/ui/board.js` already renders Staged/Blocked/Ready generically from whatever `changesets` it's handed (confirmed by reading it during Task 5/6 review — not re-verified line-by-line here since it was already covered by this session's earlier `/simplify` verification pass against real staged/committed data). The mockup's fourth column, **Draft** ("started, not yet staged, nothing visible to the bot"), has no backing `Changeset` state in the schema (`staged`/`blocked`/`committed`/`discarded` only) — adding one would be a schema change for a UI nicety (an in-progress form is inherently "not submitted" without needing a persisted row to say so). **Scoped out deliberately.** Board stays three columns: Staged, Blocked, Ready.

## 7. What this does NOT touch

No `core/ops/*.js` changes, no new `Changeset` fields, no new Mongo writes beyond what `POST /api/changeset` and `POST /api/changeset/:id/commit` already do. `portal/api/{season,broadcast,access,analytics}.js` are untouched — only `armory.js` gains the one preview route. This keeps the blast radius to the frontend plus one read-only endpoint, which is why this can be verified with the same real-Mongo integration testing already proven out during the `/simplify` pass earlier this session.

## Audit log

A falsification pass was run per `.claude/rules/plan-drafting.md` (silent-failure risk: real, this touches the live compose path for production data; expensive to redo: many files across 3 realms) — asking where THIS document is wrong, not reviewing it.

**F1 — the tier-1-instant-save vs. mockup-shows-Board tension was a real contradiction, not a wording nitpick.** Missing this would have produced two incompatible implementations depending which section of the frozen spec was read last. Resolved in §1, with a rule for which case each behavior applies to, not a blanket pick of one over the other.

**F2 — "call `buildLoadoutCard()` from the browser" would have meant embedding a Node-only function's output with no way to display it.** The frozen spec's premise 5 verified the function *imports* clean into a browser-adjacent process; it never checked whether anything could *render* its output. Checked `buildLoadoutCard()`'s actual body (via the loadouts rules file) rather than assuming a generic V2 renderer was needed — found it emits exactly 5 component types, which is what made §2's scoped renderer tractable instead of a rejected-as-too-large idea.

**F3 — "shift end date +3d" implied full drag-both-edges support that the mockup never actually shows being used.** Checked the mockup text again: every drag example in it is an end-date shift. Scoped §4 to the right edge only and named the deferral explicitly, rather than silently under-building against an assumed larger scope or over-building a symmetric two-edge interaction nobody asked for.

**F4 — "Re-fetch images" in the Armory bulk bar has no backing op**, found only by cross-checking the mockup's bulk-bar labels against the actual `registerEntity('loadouts', ...)` table rather than transcribing the mockup's button list as the requirement. Silently adding a button with no working handler would have shipped a dead control; silently adding a new op type would have been backend scope creep in a document that promised none. Named as a deliberate cut in §5.

**F5 — cleared, not a defect: whether Manifest's inline-edit-and-commit needs a NEW backend confirm step.** Checked `gateCommit`'s tier-1 branch (already read this session while fixing the tier-3 confirm-code bug) — tier 1 requires neither export nor typed confirmation, so `stageAndCommit`'s second call can omit `confirmText` entirely and still pass. No new gate logic needed.

**Not found, and worth stating:** no defect in the decision to make Board's Draft column out of scope (§6) — re-checked the `Changeset` schema state enum directly rather than trusting memory of it, and `draft` genuinely isn't there.
