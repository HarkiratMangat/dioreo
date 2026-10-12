---
kind: record
status: frozen
---

# Pills, rails and chips: why the section was drawn wrong, and the P0 plan

Written 2026-10-12 19:55 EDT by session 844943ce after his 2026-10-12 19:48 EDT review and 19:49 EDT "this is a class failure!". His words are verbatim in `docs/claude/s4/2026-10-07-s4-button-system.md`. Read this before P0 and before touching any element of Pills, rails and chips or Tags and badges.

## What a finished element has to be right on (eight dimensions)

1. Content: its icon, dot, meter, words and counter shape, as Builder-2 has them.
2. Style: the decided recipe (C9a), or the selected recipe P0 decides.
3. Size row (C1, C3 nesting).
4. Accents (C21): a leading icon, dot or meter and a trailing count take the accent; a count of 0 is disabled at 40%.
5. States: rest, hover, selected, selected-hover, press, disabled (and focus, if he includes it).
6. Interaction (C20): it really toggles; nothing drawn with `onPick=${noop}`.
7. Ink alignment: parts line up on their drawn ink, never their boxes (anchor #30).
8. The token name, in his grammar.

My only instrument (the Meas helper) checked dimension 3.

## What was wrong, measured

- **The view rail:** RailRow passes `onPick=${noop}`, so it can't be clicked; Builder-2's picked segment is raised + an ink4 ring (`b3/board.css` .b3-sd-vt button.on), paint's hover look, so "paint-staged" is grey when picked.
- **Filter chips' count:** the line boxes sit 0.34px apart, yet his guide lines show the digits riding high. It's an ink problem (JetBrains Mono figures beside Space Grotesk words) in Builder-2's own FilterChips, so it needs a ledger row as well as the board fix. Measure by pixel scan.
- **Badge chips (f-bt):** unchecked, Builder-2 dims the badge to 60% on a dark well with an ink-12% ring; checked is ink 6% on sunk + an ink-30% ring, hover 8% (`b4/form.css` 130–139). I drew full-opacity badges on a paint chip.
- **Tier rail (f-tier):** unpicked badges are at 60%; the picked segment is ink 7% + ring 26%; a picked "No tier" has ink words (form.css 143–150). I drew No tier as a raised paint segment.
- **Image source (f-src):** picked is realm 22% on sunk + ring realm 62% + words realm 32% on white (form.css 172). I drew wash: an invented recipe.
- **Build keys (cx-k):** pressed is category 26% on sunk + ring 72% + words 28% on white, hover 36% (`b4/compare.css` 14–15). I drew wash-cat.
- **Pick all:** the count is the element's main text at its own size; I shrank it to 11.
- **His seven comments** (filter chips `button-M-pill.paint-cat--dot--count`; History `paint-level--meter--count` by severity, error > warn > caution > info; Repairs' icon in the accent; the launcher `button-L-pill.wash-warn` with a static M round counter and NEED WORK in `label-xs-700.warn`; Admin traffic `button-L-pill.paint-analytics--icon`; the view rail; interactivity) are all in this class.
- **The ask that died:** his 2026-10-09 11:49 EDT "whats the point of showing me the segments/switches if i can't even see them in their active/selected states? interacting with them does nearly nothing." It was never carried in the handoff's Open list, so no later session saw it.

## Root causes, ranked

1. Coverage over fidelity: many sections fast felt like progress.
2. A size-only instrument mistaken for verification.
3. Near-neighbour substitution: every element mapped onto the closest name in my rule set (wash, paint, static) instead of reading its CSS states first.
4. A control's state rules (`aria-pressed`, `aria-checked`) were never opened.
5. His past asks on the family were never searched before building it.
6. Short, confirmatory thinking passes that planned the work instead of attacking it.

## Prevention (do this, every element)

1. Read its CSS states.
2. Crop it from Builder-2 in every state: rest, hover, picked, picked-hover, disabled.
3. Draw it from the rules, keeping its content and its state logic.
4. Crop mine in the same states and compare side by side at 2x.
5. Measure ink, not boxes.
6. Click it live.
7. Only then report.

Per family: search the rulings for his asks on the family's nouns plus selected, active and interactive, and carry each unclosed one in Open. The tool to build first: `states-sheet.cjs` (originals and library, every state, one sheet). Tools that already exist in `local/pins2/s4/work/lead/`: `tags-compare.cjs` and `ctl-crops.cjs` (crop originals from builder.html), and `ctl-sweep.cjs` (every rail, toggle and checkbox chip, with no height cap).

## Tool routing, also wrong (his 2026-10-12 19:55 EDT: "your tool routing was also SO shit! why aren't you using context-mode correctly??")

What I did:
- Narrowed inside the capture: `ctx_batch_execute` commands carried `rg … | cut -c | head`, `awk 'NR>=…'` and `| head -30`, so most of the output never reached the index and `ctx_search` couldn't find it later. The context-mode rule: capture whole, then filter with `ctx_search`.
- Read files through the shell (`awk` line ranges, `cat` on task output, `python3 -c` slices) instead of `read_smart` or `ctx_execute_file`.
- Searched the tracked docs (rulings, handoff) with `rg` instead of `ctx_search` over the indexed sources, and made many one-call turns.

The fix, every call from here on:
- Gather with `ctx_batch_execute` and its `queries` (whole outputs, no `head`, `cut` or `awk` inside).
- Follow up with `ctx_search`.
- Ask a question about one file with `ctx_execute_file`.
- Read whole files with `read_smart`.
- Use plain Bash only for short fixed output or a state change.

## P0: selected and selected-hover per style

- **Raw material:** about 110 picked-state rules in Builder-2, in at least six ad hoc recipes:
  - accent picked: colour 18–34% on sunk, ring 60–85%, ink or lightened words (filter chips, Export's chips, keys, realm segments)
  - neutral picked: ink 6–7% on sunk, ring 26–30% (badge chips, tier segments)
  - the view rail: raised + ink4
  - a solid fill: the dock
  - a tinted key with a bottom bar: b3-xi-k
  - pb-tog: colour 11%, ring 50%
- **First action:** inventory every picked look live (crops in each state), then cluster.
- **Then:** draw the candidates per style on Styles, live and clickable, beside rest and hover:
  - A, tint-picked: colour about 24% on sunk, ring 75%, words 80% on white
  - B, wash
  - C, fill
- **The recipe:** `recipe()` in `spec-defs.js` gains selected and selected-hover values; the CSS paints `[aria-pressed=true]`; the components hold state.
- **Forks for him** (ask, don't decide):
  - focus-visible for buttons, pills and rails, never standardized (C13 covers fields only)
  - whether a rail's picked segment and a standalone chip share one recipe
  - which styles get a selected state at all (static? fill?)
