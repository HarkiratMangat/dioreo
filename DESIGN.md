---
kind: reference
status: live
name: Dioreo Admin Portal
description: Blued-steel operator console for administering Dioreo's live content
colors:
  desk: "#0F1418"
  paper: "#171E24"
  raised: "#1F272E"
  sunk: "#0B0F12"
  hi: "#232C34"
  rule: "#2A343D"
  rule2: "#3A4752"
  ink: "#E8EDF1"
  ink2: "#9DAAB4"
  ink3: "#85939F"
  ink4: "#5C6A75"
  staged: "#D8F24A"
  meshGold: "#F2C230"
  tierBest: "#F2C230"
  ok: "#7BDB63"
  onOk: "#07130A"
  onAccent: "#07090A"
  warn: "#FF7A45"
  warnInk: "#FF9E72"
  del: "#FF6B6B"
  dangerInk: "#FF8A85"
  info: "#409AD0"
  sched: "#A680FB"
  focus: "#5FD4E8"
  realmSeason: "#F59E0C"
  realmArmory: "#EF4444"
  realmBroadcast: "#EC4899"
  realmAccess: "#6C8AF7"
  realmAnalytics: "#9CC85A"
  realmHistory: "#00E1D9"
  realmReview: "#D8F24A"
  laneNewDraws: "#AE72E0"
  laneReturning: "#E8639B"
  laneDrawWindow: "#6B4E7D"
  laneEvent: "#4A90D9"
  lanePlaylist: "#2CC4C4"
  lanePatchNotes: "#F2C230"
  lineBattlePass: "#F2994A"
  lineRanked: "#FF3430"
  lineDmz: "#337BA6"
  discord: "#5865F2"
typography:
  ui:
    fontFamily: "Space Grotesk, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
  display:
    fontFamily: "Big Shoulders Display, Space Grotesk, sans-serif"
rounded:
  xs: "5px"
  s: "6px"
  m: "8px"
  l: "11px"
  popup: "14px"
  drawer: "18px"
  panel: "22px"
  badge: "3px"
  round: "50%"
  pill: "999px"
components:
  buttonL:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink2}"
    rounded: "{rounded.l}"
    padding: "0 14px"
    height: "44px"
  buttonM:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink2}"
    rounded: "{rounded.m}"
    padding: "0 10px"
    height: "32px"
  buttonS:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink2}"
    rounded: "{rounded.s}"
    padding: "0 10px"
    height: "24px"
  buttonXS:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink2}"
    rounded: "{rounded.xs}"
    padding: "0 6px"
    height: "20px"
  field:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.l}"
    padding: "0 14px"
    height: "44px"
  tagS:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink2}"
    rounded: "{rounded.s}"
    padding: "0 10px"
    height: "24px"
  badge:
    textColor: "{colors.ink}"
    rounded: "{rounded.badge}"
    height: "24px"
  popup:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.popup}"
  drawer:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.drawer}"
    padding: "20px"
---

# Design — Dioreo admin portal

<!-- impeccable:design-source mockups -->

> 🔴 **THIS FILE DESCRIBES BOARD 4: FINAL, THE STANDARD SESSION 5 PORTS, NOT `portal/ui/` AS IT STANDS.** Rewritten 2026-11-15 02:11 EST at Session 4's close of portal pins batch 2 (plan §5c Step 6). Board 4: Final is Builder-2 baked into `local/pins2/s4/board4-final/` (this Mac only, gitignored, with its own git); its generated spec is `docs/pins2/final/board4-spec/`; every decision in it is a row of plan §10.6 (`docs/pins2/plan/2026-09-13-portal-pins-batch-2.md`) or of `docs/reference/portal-decision-ledger.md`. The control rules are C0–C32 in `docs/claude/s4/2026-10-08-s4-conventions.md`, and the style values are the spec board's own `recipe()`.
>
> **Until Session 5 closes, the portal is behind this file.** What moves, site by site, is §10.6 with `docs/pins2/final/apply-map.md`. Board 4: Collective (`docs/pins2/kit/`, signed off 2026-09-30 19:31 EDT) stays the record of what Harkirat signed off, and its spec is frozen in `docs/pins2/final/board4-spec-collective/`.
>
> **The 2026-08-23 mockup package (`docs/superpowers/mockups/2026-08-23-portal-interactive/`) is no longer the design authority.** It was from 2026-08-27 (*"the design is the mockup"*) until Board 4. The sections below that cite it (Overflow, The manifest row) record what it and design board 3 settled, and they still hold where Final draws the same thing.

## Direction

**Blued steel.** A dark, cool, instrument-panel surface — deliberately distinct from the public site's violet-graphite (legal pages) and green-black (chronicle) while obviously the same house. The operator arrives knowing what they came to change; the interface is a workbench, not a brochure. Mode is **Operate**: scanability, consistency and the real usage scene outrank expression, and brand lives in precise details rather than in decoration.

## Palette

Colour carries **topic**; shape carries **state**. That separation is the portal's signature and it is load-bearing rather than stylistic — it means a bar's meaning survives being read in greyscale, and it is why the accent is a fill and never a text colour (a proven 4.58:1 floor with `#000` ink).

Six surfaces step from `--sunk` through `--desk`, `--paper`, `--raised`, `--hi` to `--rule`/`--rule2`, each jump only a few points of lightness.

**`--patch` is retired (his 2026-09-30 17:27 EDT).** Staged work is `--staged` `#D8F24A`, which is also Review's realm colour on purpose; the gold `--patch` painted on drawers and background surfaces is `--meshGold` `#F2C230`; the Best tier's gold is `--tier-best`. **Every realm has its own accent:** season `#F59E0C` · armory `#EF4444` · broadcast `#EC4899` · access `#6C8AF7` · analytics `#9CC85A` · history `#00E1D9` · review `#D8F24A` · home `--ink2`. Confirm buttons fill with `--ok` and write in `--on-ok` `#07130A`; focus rings are `--focus` `#5FD4E8`; the delete action paints `--del` `#FF6B6B`, and danger's words are `--danger-ink` `#FF8A85`.

🔴 **FOUR INK TIERS EXIST AND ONLY THREE MAY CARRY TEXT.** Measured 2026-08-24 against every surface: `--ink4` at `#5C6A75` scores **3.02:1 on `--paper`**, failing AA in all 89 places it coloured text. Solving for four AA-passing steps collapses two into each other — at this floor, on these surfaces, the scale has room for three text tones. `--ink3` was lifted from `#80909D` to **`#85939F`** to sit on the 4.5:1 floor exactly. **`--ink4` is kept dark deliberately, for the 11 places it draws a border, stroke or fill. Never write `color:var(--ink4)`.**

⚠️ **Two signal colours have the same problem and the same solution — one value for the fill, one lifted for ink, hue and saturation untouched because those ARE the identity:** `--ev` (3.28:1) pairs with **`--ev-ink:#25A570`**, and `--warn` pairs with **`--warn-ink:#FF9E72`** (composited true value 4.53:1 — passing by 0.03, which is not a margin).

⚠️ **TOPIC ACCENT IS TWO DIFFERENT SETS AND CONFLATING THEM IS A REAL TRAP.** The package's `:root` declares `--draw:#FF3430 · --ret:#337BA6 · --ev:#1F8A5E · --play:#8A6BD1`, but what the Track and Board actually paint comes from the LANES fixture: **new draws `#AE72E0` · returning `#E8639B` · draw windows `#6B4E7D` · events `#4A90D9` · playlists `#2CC4C4` · patch notes `#F2C230`**. `portal/ui/tokens.css` matches the LANE hexes. Two of the `:root` values (`#FF3430`, `#337BA6`) are the **deadline line** colours for Ranked and DMZ, so reading `:root` as the topic palette produces a set that is both wrong and confusingly plausible.

## Typography

**Three families, split by kind rather than by hierarchy.** `--ui` (**Space Grotesk**) for controls and interface chrome; `--data` (**JetBrains Mono**) only for strings read a character at a time, such as codes, ids and key labels (C23; until the standard it took every date and count too); `--display` (**Big Shoulders Display**) for figures and realm titles.

**The scale is C5's (§10.6 row S3):** xs 9 · s 11 · m 13 · l 15 · xl 21 · xxl 30 · giant 44 · jumbo 58, with three line-height jobs (`--lh-tight 1.15 · --lh-ui 1.35 · --lh-body 1.5`). A control writes in its size row's words (L 13 · 700; M, S and XS 11 · 600); key labels are `label-xs-600` (JetBrains Mono caps 9). Builder-2's token file still names the 2026-09-06 steps (`--t-micro 9 · --t-xs 11 · --t-sm 12 · --t-base 13 · --t-md 14 · --t-lg 17 · --t-xl 19 · --t-hero 26`); the token map's Portal column (§5c Step 4d) gives each its port.

## Shape carries state

- **solid fill** — live
- **hollow, dashed border** — staged
- **diagonal hatch** — conflict

Applied via a `--topic-accent` custom property set on the element, never via a colour class. A new state gets a new *shape*; a new entity gets a new *accent*.

## Depth and geometry

Structure is carried by edges, and an edge is usually an **inset ring** (`inset 0 0 0 1px`), a border that takes no layout, so a ring can be added to a box that is already committed. Lift is kept for what floats: the pop-up's drop shadow (C15) and the drawer.

**One corner scale, 5 · 6 · 8 · 11 · 14 · 18 · 22 (C16).** A control takes its corner from its height, height × 0.25 (C2): XS 20 → 5 · S 24 → 6 · M 32 → 8 · L 44 → 11. A surface takes the step above what it holds: pop-ups 14 (they hold M parts), tiles 11 (C29), drawers 18 (they hold L parts), panels 22; an inner layer of a surface takes its corner minus its edge. A pill is a shape, not a type (C4): any control can be one, its corner half its height. **The one exception is the badge, corner 3** (§10.6 E1, his 2026-10-20 10:06 EDT). The old named radii (`--rad-1` 3 · `--rad-2` 6 · `--rad-3` 10 · `--rad-box` 8) still sit in the token files; Session 5 maps each site onto the scale (apply-map code J).

**A boxed icon button is a 32 box inside a 44 target** (`--box-size:32px` inside `--tap:44px`, `--box-inset` derived, 6): the box is the M row and the click area the L row (C0, C1).

**Slot hues and the Best tier** (design board 2, 2026-09-14 23:59 EDT). Nine `--sl-<slot>` tokens, `oklch(76% .055 H)` with H muzzle 25 · barrel 65 · stock 105 · underbarrel 150 · optic 190 · laser 225 · rear grip 260 · perk 300 · ammunition 340, used only as a faint wash and outline on an attachment tag, never as ink. `--tier-best` is the legendary gold of the Best tier. Category and slot hues are the bot's own (§10.6 E6).

## Overflow fades, it never cuts — added 2026-09-19 21:23 EDT

*Recorded because the device had been reached for independently in five places before anyone wrote it down, and each one solved it slightly differently.*

**Where a run of content is longer than its box, the box fades it out rather than clipping it or ellipsing it.** A hard edge says "this is the end"; an ellipsis says "there is more, and you cannot have it"; a fade says "there is more, keep going" — which is true, because in every one of these cases the content is reachable by scrolling, hovering or opening.

| Surface | What runs over |
|---|---|
| Selection bar's weapon chips | two rows of chips that swipe sideways |
| Export drawer's category bays | one row of bays that swipes, and follows the scrollspy |
| Export tile's weapon name | a long name slides under its own build count on hover |
| Export file body | the text block under its footer |
| Delivery card's lifespan bar | a run with no end date fades off its right edge |

**The rules.**

1. **The mask goes on the BOX, not on the content.** A mask on the text itself is sized to the text, so its fade zone always lands on real ink and every short string loses its last characters. On the container, a short string stops before the fade and is untouched — no conditional, no measurement, no JavaScript. *(This was got wrong first, on the Export tile's names: every weapon in the bay read `AK11`, `DR-`, `LK2`.)*
2. **A fade that can be scrolled past fades on BOTH edges, driven by scroll position.** A right-only mask keeps promising more content after the reader has reached the end. Each edge fades only while there is something beyond it.
3. **The fade is 18–28px** — wide enough to read as a fade rather than a blur on the final glyph, narrow enough not to eat a whole word.
4. **If the run can also move on its own** (a name that scrolls on hover, a row that follows a selection), the travel is exactly the overflow and clamps at zero, so content that already fits never moves. `100cqw - 100%` inside a container query does this with no measurement; `prefers-reduced-motion` keeps the fade and drops the travel.
5. **It never replaces a control.** A faded edge tells you there is more; it does not tell you how to get there. Anything that must be reachable by keyboard still needs its own affordance.

## Components — the control standard

*Rewritten 2026-11-15 02:11 EST from the conventions C0–C32 (`docs/claude/s4/2026-10-08-s4-conventions.md`) and the spec board's `recipe()` (`local/pins2/s4/builder-2/spec-defs.js`), the code Board 4: Final paints with. Plan §10.6 rows S1–S15 carry each rule with its decision; the recipe audit of 2026-11-15 holds every control on the board to one of these looks or to a named exemption (§10.6 E1–E13).*

**Every element is named by one grammar (C11):** `type-size-shape.style-value--flag>child+child`. The **type** says what a click does (C25): a **button** does a thing once · a **toggle** stays on until clicked again · a **rail** holds toggles one size down and keeps exactly one on · a **chip** is the item itself, its × gives it back · a **tile** is a composition, like a pop-up · a **tag** states a fact, with no hover and no click · a **badge** is one of a build's own labels · a **field** takes typing. The **size** is its row, the **shape** its outline (box · pill · icon, a square · round, a circle), the **style** its look; `-` picks a value (a colour or a data source) and `--` adds a part or a flag.

**Sizes (C1).** A control follows its size row, and a field is a control (C0).

| Row | Height | Click | Corner | Icon | Words | Padding | Icon gap |
|---|---|---|---|---|---|---|---|
| L | 44 | 44 | 11 | 16 | 13 · 700 | 14 | 10 |
| M | 32 | 44 | 8 | 14 | 11 · 600 | 10 | 6 |
| S | 24 | 32 | 6 | 12 | 11 · 600 | 10 | 6 |
| XS | 20 | 24 | 5 | 12 | 11 · 600 | 6 | 6 |

A part inside a container is one size down with half the step around it (C3): L → M 6 · M → S 4 · S → XS 2. That covers rails, the in-field × and ⌄, the chip's × and a toggle holding a badge.

**Styles (C9, C9a).** neutral takes no colour; every other style takes one, and `-realm` takes the realm of the surface it sits on.

| Style | Rest: fill · outline · words | Hover |
|---|---|---|
| neutral | `--raised` · `--rule2` · `--ink2` | `--hi` · `--ink4` · `--ink` |
| paint | `--sunk` 85% · `--rule2` · `--ink2` | the colour 12% on `--sunk` · 75% · 80% on white |
| tint | `--sunk` 85% · the colour 55% · the colour | 12% on `--sunk` · 75% · 80% on white |
| wash | the colour 14% · solid · 26% on white | 24% · solid · 26% on white |
| fill | solid · none · on-colour | 74% on white, a 3px glow at 26% |
| static (tags) | 14% · 55% at 1.5px · 80% on white | none |
| solid (tags) | solid · none · dark | none |

**Flags:** `--ghost` no fill (neutral, paint, tint) · `--borderless` no outline, and fill loses its glow · `--quiet` bare until hover · `--reveal-right/-left` opens wider on hover. Every outline is 1px except static's 1.5px (C10). Hover changes colour only, a press moves 1px, and disabled is 40% with no hover (C10, apply-map code G).

**Selected (C22).** neutral: `--hi` fill, ink 60% outline, ink words; with hover, ink 8% on `--hi`. paint and tint: the colour 18% on `--sunk`, the colour as outline, words 26% on white; with hover 30%. wash: 34%, with hover 42%. fill, static and solid have none. A button whose pop-up is showing is **open**: no fill, its selected outline with the side toward the pop-up dropped.

**Fields (C13).** One look: fill `#04070A` 52% on `--sunk`, a 1px ink 12% edge (ink 24% while the pointer is anywhere over the field), focus the staged ring and halo. In-field buttons are `button-M-icon.tint-realm--quiet--borderless`.

**Tags and badges (C17, C18).** Tags are informative, on the rows XS 20 · S 24 · M 32 with corners 5 · 6 · 8, in static; `--pending` draws a 1px dashed outline with no fill and `--problem` adds stripes. A badge is one 24 box, corner 3, words 9 · 700, in its own colour.

**Surfaces (C15, C29, C31, C32).** One pop-up surface: `--raised`, a 1px edge in its tone at 55%, a 5px halo at 16%, a drop shadow 0 10 14 at .55, corner 14 and a 10px pointer. A drawer is a panel that holds L parts: corner 18, with 20 of room inside its edge and between its columns. A row is a control on the L row, 44, holding M parts 6 in; a group head is a row; a column head is 32 with `label-xs-600.ink3` labels, 44 only when it holds a boxed button. A tile (Compare's picked weapon, Export's pick-builds tile) has corner 11 and padding 10. Meters (C28) and the pickers (C30) are in the conventions.

### What a new element must state

1. Its name in the grammar: type, size, shape, style and colour, and any flag.
2. Whether its colour is the realm's, a state's (ok, warn, del, staged) or the data's (a category, a slot, a topic).
3. A fill's words: `--on-ok` on `--ok`, `--on-accent` on another accent; near-black words read at 2.86:1 on a dark fill, so a fill is for a light colour.
4. If no rule covers it, or two rules conflict, it is Harkirat's to decide (the conventions' last section); everything else is derived, applied and cited.

## Motion

The standard's motion is short and colour-only: hover changes colour, a press moves 1px (C10), and the reveal flag opens in 340ms. `docs/reference/badge-motion.md` carries the five laws every badge animation follows.

⚠️ **The conformance instrument still cannot see motion, and that is a real limit rather than a design position.** `portalDiff` zeroes transitions and animations so its pixel comparison is deterministic at a frozen clock — so it would score an *added* transition as a regression, and can never reward one. `portalAudit` does not zero them and now samples `transitionProperty` / `transitionDuration`, so a **declared** transition is comparable even though its motion is not. **Answered 2026-09-06 01:24 EDT** (build-out, `animate`): ONE page-load orchestration keyed on `--dur-3` (320ms) — the masthead figures rise in order 60ms apart, the rail items stagger once on mount, drawers scale in (they already did). It lives at the foot of `portal/ui/app.css` under the build-out banner, inside `prefers-reduced-motion:no-preference`, and the global reduced-motion kill zeroes it.

## Spacing — C7's scale, in whole pixels

**Gaps between near neighbours step 6 · 10 · 14 · 20 · 26 · 32** (C7, §10.6 row S5, the tokens `--s1`–`--s6` once Session 5 ports them; Builder-2's token file still carries the 2026-09-06 values 4 · 8 · 12 · 16 · 24 · 32). Inside a control its size row sets the padding and the icon gap (C1); between a control and its neighbour the row's neighbour gap applies (M 14 · S 10 · XS 6); a drawer's room is 20 (C32).

🔴 **EVERY AUTHORED LENGTH IS A WHOLE PIXEL, OR A HALF AT THE FINEST — Harkirat, 2026-09-19 21:23 EDT.** *"can we not do .xx numbers for pixels? at mostttt 0.5 is okay but otherwise try to keep them whole numbers like 1, 2, 3."*

This is about what gets WRITTEN, not about what gets measured. Measuring on the ink produces values like `67.84px` or `-3.57px`, and shipping those makes a stylesheet that nobody can read, reason about or re-derive — a number with two decimal places looks like a constant when it is really one render's residue. **Measure precisely, then round before it lands in a file**, and round in the code that computes it rather than afterwards, so a value that is recomputed at runtime cannot reintroduce the noise.

⚠️ **The one thing this rule must not do is falsify the record.** A sweep that rounds `px` literals will also hit the numbers inside comments — the measurements that explain why a value is what it is — and rounding *those* turns an observation into a fiction. Values the browser reads get rounded; values the reader reads stay exactly as they were measured.

## The manifest row — five rules design board 3 settled, added 2026-09-20 14:16 EDT

*This section is a MERGE, not a regeneration: `impeccable document`'s own reference says never to overwrite an existing DESIGN.md, and this file's header says it describes the mockups rather than `portal/ui/`. Everything below is read out of the board's own files — `docs/pins2/kit/b3/board.css` (rounds 6B · 9A · 9B · 10A · 10J · 10K · 11 · 11B · 11C · 12–12G), `b3/history.js`, `gates/history.js`'s `notes` (Harkirat's pins 51–57), and the package README's v62–v67 sections. It is recorded as SYSTEM rather than as one gate's styling because the same vocabulary draws the Armory manifest, the Season Repairs list and the History river; every rule below was reached on one of them and then found to be true of the others.*

**The Mesh Rule.** A manifest row's hover and open ground is a FIELD, not a band. Three radial gradients plus a white 8% linear wash, composited `screen, screen, screen, normal`, so the layers mix like light and the ground stays dark: `70% 220% at -6% 120%` of `--c` at 14%, `62% 200% at 34% -24%` of `--warn` at 10%, `66% 210% at 104% 128%` of `--c` at 9%, then `linear-gradient(180deg,#ffffff08 0,transparent 30%)`. **Only `--c` changes** — it is the row's own topic hue. A band stops where its element stops, which is why a flat wash kept reading as a partial highlight; a field belongs to the whole row including its action cell. Swapping any other layer produces a glow that is *nearly* the manifest's, which is the same as not being it.

**The Demotion Rule.** A column whose value is identical on every SHOWN row demotes — kind to a mark, who to the avatar alone — and never disappears. It is measured on the rows on screen rather than on the whole dataset, so it answers a filter. The column keeps its track and keeps telling the truth about being uniform; a column that vanishes tells the reader nothing about why.

**The Story Rule.** Consecutive rows in one day naming the same thing by the same actor are drawn as ONE story: their left rails join into a single unbroken bar and the hairline between them goes. **Nothing merges and nothing hides** — every row stays present and countable, because a log's whole value is that it is complete. An event with no entity is identified by what it SAYS, so a run of repeated alerts binds exactly as a change pair does, and a genuinely different event inside a storm breaks the rail visibly.

**The Neutral Chip Rule.** A chip's fallback hue is a neutral declared per surface (`--fc`), never a STATE colour. Reaching for `--patch` as "the default accent" tinted every unstated chip staging-yellow and said *staged* about things that were not.

**The One Inset Rule.** A panel declares its content inset ONCE and every member uses it — rows, column head, day header, toolbar, foot. Three right insets and two left insets inside one panel is the defect class Harkirat finds by eye every time, and it is invisible in the CSS because each rule looks correct on its own.

### The scrolling manifest — added with round 12

**A long manifest scrolls its LIST, not its panel.** The toolbar and the column head are the frame; the rows are the thing that moves. The head sticks at the top of its own scrollport carrying an `inset 0 -1px 0` ring rather than a border, and day headers stack beneath it. Measured on H1 before the change: the day header had been written `position:sticky` since round 9A and had never once stuck, because its nearest scrollport was a panel that does not scroll — and the toolbar, 26% of the panel's height, left on the first scroll of a 4802px list.

### Four don'ts the board paid for, added 2026-09-20 14:16 EDT

- **Don't put `border-radius` on an `<svg>`.** An svg's overflow is hidden and the clip follows the radius, so `border-radius:50%` on an icon turns it into an ellipse and eats the corner strokes of its own glyph. Round the BOX around it.
- **Don't let a child redraw its container's edge.** A panel draws a 1px border at `--rad-2`; a child sitting exactly 1px inside it with a full `inset 0 0 0 1px` ring of its own puts two 1px lines on the same three edges at two different radii. Measured at 175 against 174 and 1265 against 1266 — read as "why are there 2 different borders overlapped on the panels".
- **Don't write `all:unset` on a `<button>` and stop there.** It strips the UA sheet's `user-select:none` as well, so the label becomes selectable and a stray drag leaves a highlight behind the text that reads as a rendering bug. Restore it explicitly.
- **Don't trust source order over specificity.** `button:hover:not(:disabled)` is (0,2,1) and outranks every `.control:hover` at (0,2,0); an attribute-scoped `html[data-x] .mt-r2` beats a plain class. When a rule you wrote has no visible effect, ask the PAGE which rules match the element instead of re-reading the file — five separate rules were found setting `grid-template-columns` on one element that way.

## Known divergences — the portal against Board 4: Final

**From 2026-11-15 02:11 EST this file is ahead of the portal everywhere Board 4 draws**: the Armory manifest, New build, Compare, Repairs, Export, the delivery queue, the Broadcast manifest, History and Admin traffic. Session 5 closes the gap. The list is not kept here: it is plan §10.6 (the decisions) and `docs/pins2/final/apply-map.md` (every site, with the Board 4 design it becomes or its exemption). A difference Session 5 keeps on purpose becomes a ledger row with a falsifier.

**The build-out's divergences of 2026-09-06**, the portal ahead of the 2026-08-23 package (the type and spacing scales, the realm accents, the semantic tokens, the header, the History realm, the masthead wash, the side-tab, the drawer field label, the manifest delete column, the record panel's CTA row and spine), are history: what the standard kept is in it, the rest it superseded. Their table is in this file's git history and in the ledger's § Superseded 2026-09-06.
