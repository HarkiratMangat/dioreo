---
paths:
  - "commands/drawprices.js"
---

# `/draw prices` — rules & history

*Loads when you touch `commands/drawprices.js`. The price data model, the final layout, and the
Advanced Double Legendary page. Shared UI builders/pagination: `.claude/rules/rendering-and-ui.md`.
Multi-pass redesign narrative: `docs/DEVLOG.md`'s four `2026-07-12` Part A entries.*

## `/draw prices` layout, final correction (2026-07-13)
Took several wrong attempts to land (see `[[feedback_check_sibling_code_before_guessing]]` in
memory) — the ACTUAL final, Harkirat-confirmed structure:
- **Container**: title > divider > entries (no divider before pagination) > pagination row >
  divider > "Switch between..." hint line > region-switch button row. The region-switch button is
  the container's LAST item.
- **Outside the container, as a separate top-level sibling**: the global nav row
  (`buildGlobalNavRow('nav_prices')`) — matching `/calendar`'s and `/draws`' own convention of
  passing the nav row into `withShareButton([containerPayload, globalNavigationRow], isEphemeral)`
  rather than nesting it. This command is the only one of the three with extra content (hint line +
  region button) that has to sit BETWEEN the container's own entries and the nav row, but the nav
  row still ends up last overall, just with no divider needed between it and the container (two
  separate top-level components already get Discord's own inter-component spacing).
- **No divider between the last entry and the pagination row** — this was explicitly requested
  multiple times and got dropped by mistake mid-session when a blanket "large divider spacing
  across the board" pass over-applied; don't reintroduce it.

## `/draw prices`' "Advanced Double Legendary Weapon Draw" — its own 3rd page (2026-07-21)
A new, distinctly-shaped draw type added to `/draw prices` from Harkirat's own 10/30 CP breakdown. It
does NOT fit the shared `draws: []` model every other entry uses — it has **three purchase modes per
spin** (Regular / Advanced / the "Trap") plus a **strategy breakdown** — so it's given its own builder
and its own dedicated page rather than being shoehorned into `DRAW_DATA`/`buildDrawEntries`.
- **Its own page 3.** `SUBPAGES` still holds only the two key-driven pages; the new page lives at
  `ADVANCED_PAGE_INDEX` (`= SUBPAGES.length`), and `TOTAL_PAGES` (`= SUBPAGES.length + 1`) is what the
  page clamp and the pagination row now use (were `SUBPAGES.length`). `buildContainer` renders
  `currentPage === ADVANCED_PAGE_INDEX` via `buildAdvancedDoubleLegendaryEntry(regionKey)` instead of
  `buildDrawEntries`. **If you add more key-driven pages, push to `SUBPAGES` — `ADVANCED_PAGE_INDEX`/
  `TOTAL_PAGES` re-derive automatically** and the Advanced page stays last.
- **Everything numeric is DERIVED, nothing hand-typed** — same rule the rest of this file enforces (see
  `DRAW_DATA`'s comment). `ADVANCED_DOUBLE_LEGENDARY` stores ONLY the Regular + Advanced per-pull arrays
  per region. From those: **Trap = always exactly 2× Regular** per pull (Regular spin + buying the 2nd
  item afterward = two Regular Purchases); all three totals = array sums; the three **strategy costs** =
  cumulative slices (Reg 1-8 + Adv 9-10 / Reg 1-9 + Adv 10 / Reg 1-10). A wrong number can only ever
  exist in one place.
- **Rendering reuses the command's existing conventions** — `boldDrawSequence`/`cumulativeSequence` via a
  `{ draws }` shim (bold ` / `-joined pulls, `⌇` before the total, `-# CP Spent:` cumulative joined by
  `›`, `cp2` icon on the quote-blocked headline).
- **Layout redesigned 2026-07-21 (v2.30.0) to match Harkirat's own hand-drawn mockup**
  (`local/advanced leggy_format.json`), then **corrected 2026-07-21 (v2.30.1, committed but NOT yet
  pushed/deployed as of this writing)** after a marked-up screenshot from Harkirat
  (`local/Screenshots/CleanShot 2026-07-21 at 20.16.48@2x.png`) flagged two mistakes in the v2.30.0
  version. Current (corrected) shape — the whole entry is a flat run of Text Displays with **NO internal
  dividers**: **headline** (full-caps name + Reg/Adv totals + `(See **The Strategy** below)` pointer) →
  **3 purchase modes** (`'Regular Purchase' Only` / `'Advanced Purchase' Only` / `'Regular Purchase' +
  Remaining Item Separately`) → **1 callout** (`THE TRAP`; the `NOTE` callout was removed entirely
  2026-07-25 per Harkirat's request) → **The Strategy** as THREE separate Text Displays (each strategy
  line carries an inline `cp2` icon on its cost). 8 Text Displays, 0 internal dividers.
  - **The two v2.30.1 corrections:** (1) the v2.30.0 builder added three spacing-2 dividers
    (`dividerBefore = {1,4,6}` — after the headline, after the purchase modes, after the callouts) that
    were **never in the mockup**; removed entirely (`buildAdvancedDoubleLegendaryEntry` now just
    `blocks.map(c => ({type:10, content:c}))`). The ONLY dividers on this page are the title divider above
    the headline and the footer divider below, both added by `buildContainer`, not the entry builder.
    (2) the strategy heading was `### **The Strategy, If You Want...**`; Harkirat's exact correction is a
    plain bold line with a period: **`**The Strategy. If You Want...**`** (no `### `, comma → period).
  - The mockup only drew the 10 CP region — the 30 CP region is the same design fed its own derived
    numbers. Re-verified via a `buildContainer()` JSON dump after the correction: the container has exactly
    2 dividers (title + footer), every total re-sums correctly, and every page/region stays well under the
    40-component cap (Advanced page ≈ 26 incl. nav + share).
- **All draw-price entry headings are FULL-CAPS** (2026-07-21, v2.30.0) — both the two key-driven pages
  (`buildDrawEntries`, via `meta.name.toUpperCase()`) and the Advanced page. `DRAW_META.name` stays the
  canonical mixed-case source of truth; only the rendered heading is uppercased. Applies to the
  tier-emoji heading lines only, NOT the Upgrade sub-heading or the Strategy heading (neither has a tier
  emoji prefix).
- **No index.js changes were needed** for this page's own pagination — the `price_subpage_*` handler
  already parses the page number generically and passes it through; the command clamps. ⚠️ This
  no-longer applies to `price_region_*` as a blanket statement — see the 2026-08-07 section below,
  which DID need an `index.js` change once a 3rd region existed.

## `/draw prices` gains a 3rd region + a 4th page: the Advanced Double Legendary Character Draw (2026-08-07)

Harkirat provided real screenshots of a 20 CP region breakdown that had never existed in the bot (only
`region_10`/`region_30` were coded), plus a draw type — an Advanced/Regular purchase split on the
Legendary Character draw — that didn't exist in the codebase at all. Both were added as real, sourced
data, not derived guesses (a prior arithmetic-mean derivation model was validated against the real data
first, then kept only as a documented fallback method for the one remaining gap — see `DRAW_DATA`'s own
header comment and `docs/DEVLOG.md`'s matching entry for the full validation story).

- **`REGION_ORDER = ['region_10', 'region_20', 'region_30']`** is now the single place that enumerates
  "all regions in order" — both the 3-way region switcher and `execute()`'s `defaultRegionMode`
  resolution read from it, so a hypothetical 4th region only needs to change this one array plus its
  `DRAW_DATA`/`ADVANCED_DOUBLE_LEGENDARY` keys.
- **The region switcher is no longer a binary toggle.** A single "switch to the OTHER region" button
  stops meaning anything once there are 3 regions — `buildContainer` now renders one button per
  `REGION_ORDER` entry, `custom_id` = `price_region_{10|20|30}_{currentPage}` (same encoding scheme as
  before, just 3 of them). Follows the bot's existing multi-option button convention: current region
  disabled + style 4 (Danger/red), the other two enabled + style 2 (Secondary/gray) — same pattern
  `buildGlobalNavRow` already uses, see `.claude/rules/rendering-and-ui.md`. **This DID need an
  `index.js` change** — the old `price_region_10_`/`price_region_30_` hardcoded binary `startsWith`
  check is now a lookup against a `{prefix: region}` map covering all 3 prefixes.
- **`doubleEpicCharacters.region_20` is deliberately `null`** — no real data exists for that draw at
  ANY region beyond 10 CP (not even 30 CP), so there's no second data point to interpolate from even if
  a guess were wanted. Harkirat's explicit call: leave it null (renders the existing "haven't done the
  research yet" placeholder) rather than ship a speculative estimate as real pricing.
- **`mythicWeapon`/`mythicCharacter` have no `upgrade` field at `region_20`** — the source screenshots
  only gave per-pull draw totals, not the separate Upgrade cost, so there's no real number for it yet.
  `buildDrawEntries`' `if (entry.upgrade)` check means the Upgrade line just doesn't render for these
  two entries in the 20 CP region until real data turns up.
- **New 4th page: the Advanced Double Legendary CHARACTER Draw**, via
  `buildAdvancedDoubleLegendaryCharacterEntry` at `CHARACTER_ADVANCED_PAGE_INDEX` (=
  `ADVANCED_PAGE_INDEX + 1`). Mirrors `buildAdvancedDoubleLegendaryEntry` exactly in structure/
  rendering (same 3-purchase-mode + THE TRAP + 3-strategy-line shape, no internal dividers). Two real
  differences from a naive copy:
  - **`reg` is NOT stored a second time.** `ADVANCED_DOUBLE_LEGENDARY_CHARACTER` holds only `adv` per
    region — its Regular-purchase array is byte-identical to
    `DRAW_DATA[region].legendaryCharacterWeapon.draws` (verified across all 3 regions), so the builder
    reads it from there at render time instead of hand-typing a second copy.
  - **The reward framing is genuinely different, not a Weapon→Character find/replace.** Harkirat
    clarified (2026-08-07) this draw's two prize pairs are BOTH Legendary tier — 2 Legendary Characters
    (this banner's own headline reward) and 2 Legendary Weapons (the secondary Advanced-purchase
    reward) — unlike the Weapon page, whose secondary reward is 2 EPIC characters. The 3 strategy
    lines were written to match that, not mechanically swapped from the Weapon page's wording.
  - THE TRAP callout text is purely about purchase mechanics (not reward tiers), so it carries over
    verbatim from the Weapon page.
- **If you add a 5th page later**, push a new key-driven page to `SUBPAGES` (re-derives
  `ADVANCED_PAGE_INDEX`/`CHARACTER_ADVANCED_PAGE_INDEX`/`TOTAL_PAGES` automatically), or add another
  dedicated builder + its own `*_PAGE_INDEX` constant the same way this page and the Weapon page did.

