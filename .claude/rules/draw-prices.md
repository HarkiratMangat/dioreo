---
paths:
  - "commands/drawprices.js"
---

# `/draw prices` — rules & history

*Loads when you touch `commands/drawprices.js`. The price data model, the final layout, and the
Advanced Double Legendary page. Shared UI builders/pagination: `.claude/rules/rendering-and-ui.md`.
Multi-pass redesign narrative: `docs/reference/design-history.md`.*

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
- **No index.js changes were needed** — the `price_subpage_*`/`price_region_*` handlers already parse the
  page number generically and pass it through; the command clamps. Both regions have full data, so a
  region switch preserves the Advanced page.

