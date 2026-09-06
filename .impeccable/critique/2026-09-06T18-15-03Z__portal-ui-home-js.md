---
target: portal/ui/home.js — Home realm, component level
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-09-06T18-15-03Z
slug: portal-ui-home-js
---
Method: dual-agent (A: design review · B: detector + browser evidence)

# Critique — Dioreo portal, Home realm (`portal/ui/home.js`)

Measured live at 1282x888 on the fixture harness. Mode: Operate.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 4 | Three masthead figures, live countdown, staged strip, two live panels |
| 2 | Match System / Real World | 4 | Domain-native throughout; the sub-lines are the best copy in the portal |
| 3 | User Control and Freedom | 2 | Three dead ends: `5 more`/`6 more` inert, truncated announcements unrecoverable |
| 4 | Consistency and Standards | 2 | Four panels, four padding pairs; three shapes for one meaning; `.lw.hot` means two opposite things |
| 5 | Error Prevention | 3 | "nothing is live until you commit them" is real reassurance; no preview of the four ops |
| 6 | Recognition Rather Than Recall | 2 | The severity ladder drives the sort and is never named on screen |
| 7 | Flexibility and Efficiency | 3 | Command palette carries every attention row; no keyboard path to the 11 hidden clock items |
| 8 | Aesthetic and Minimalist Design | 3 | Strong restraint; 110.5px dead space in a panel truncating its own text |
| 9 | Error Recovery | 3 | Uncomputable rows drop silently; em dash for unknown is right |
| 10 | Help and Documentation | 3 | Sub-lines teach well; `data-tip` available from the shell, used nowhere on Home |
| **Total** | | **29/40** | Above the 20-32 band midpoint |

## Design Specificity Verdict

Unusually high. Not transplantable. "Still to drop", "Stops by then", "What a player opening the bot this second would be shown" are sentences only this product can say. Attention rows name a realm AND a section, so a row is a route. Home imports `splitCoverage` from armory.js and `seasonRepairCount` from season.js rather than restating the predicates, so it can never disagree with the page it links to.

Drift to generic appears in one place: the attention row's right column (`N of M ->`), the standard dashboard idiom, and it is also where the largest information failure sits.

### Deterministic scan

CLI detector on home.js and shell.js: exit 0, zero findings — AND THAT RESULT IS VACUOUS. Proven with a falsifier: a scratch file with deliberate anti-patterns correctly returned `bounce-easing`. A whole-directory scan found 111 anti-patterns in portal/ui, all in CSS (app.css 104, tokens.css 4, v2card.css 3) and none in any .js file. Home's styling lives in app.css, which the instruction to skip CSS-only files excluded. The static pass covered markup structure only.

Live overlay: 81 findings on 80 elements; 32 are on hidden elements (closed dropdowns) and are false positives for a resting-page critique. Visible: 39 undersized functional text (<11px), 5 AI-palette (cyan on dark), 1 low contrast, 1 side-tab accent border (.hres), 1 all-caps body text, 1 overused font (Space Grotesk 45%), 1 skipped heading level (h1 -> h3, no h2).

Config ignore `design-system-color #000` is actively suppressing: #000 appears 12x in CSS and zero findings cite it.

## What's Working

1. One derivation, one number. Importing the predicates from the realms that own them is the best structural decision on the page.
2. Attention-row hover is realm-aware: the row tints in the destination realm's hue and the arrow translates 3px. The hue you are about to travel to previews itself.
3. The two panel sub-lines do more to teach the surface than any tooltip could, in 12px of dim ink.

## Priority Issues

### [P1] Home states counts and text it will not let you reach
The clock says "Still to drop 9" and renders 4 rows, then "5 more" as a `<p>` with `isLink: false` and no hover rule. Same for "Stops by then 10" -> "6 more". Eleven items named, none reachable. Separately, both announcements in "Showing to players" are cut at 52% and 55% (scrollWidth 707 vs clientWidth 339; 715 vs 319) with no `title`, no `data-tip`, no expansion. Meanwhile that panel has 110.5px of dead space at its foot.
Why: an announcement's whole content is its text; the panel cannot answer the question it asks. The clock's fix already exists 400px below in the same page ("6 more running · open the Track").
Fix: make `.hc-more` the same shape as `.lmore`, linking to the realm. Rebalance `.hlive` from `1.15fr 1fr` (544.5/473.5) toward the truncating column, let `.lt` wrap to two lines, and add `title`/`data-tip` as the floor.
Suggested command: /impeccable layout

### [P1] The urgency colour is inverted, and one colour means two opposite things
All 5 left-panel rows are `lw hot` at rgb(255,122,69) reading "2 DAYS LEFT". On the right, "NEVER ENDS" is hot; "ENDS TOMORROW" is plain grey. The announcement branch is `a.expiresAt ? '' : ' hot'`, so a real expiry can never go hot no matter how close.
Why: the most urgent real deadline is the calmest thing on the panel, and the same orange means "expiring imminently" and "has no expiry at all". The season threshold is absolute at 2 days and CODM modes rotate weekly, so all-five-orange is the normal case, not a fixture accident.
Fix: threshold the announcement branch on days the way the season branch does. Then stop overloading the warn colour: "never ends" is a defect, not an urgency, so give it its own shape per the design's own law and leave the fill for real deadlines.
Suggested command: /impeccable colorize

### [P1] The page's only job is ranking, and it never states the rank
Five rows, identical ground, identical padding, identical border. The entire severity ladder is a 3px x 34.8px bar. The lowest tier reads #5c6a75 at 3.02:1 on paper — it passes the 3:1 non-text floor by 0.02 and reads as no marker rather than lowest. No word anywhere names a severity. The competing magnitude ratio is set 26% larger and 1.7 stops brighter than the realm eyebrow, and its left edges rag across 24.4px (1087.0 to 1111.4) because the last grid track is content-sized per row.
Why: severity is a property of the kind, not the count, yet the count is the only visible cue. A second admin has no way to learn the ladder.
Fix: put severity into the row eyebrow beside the realm, at no layout cost. Raise the lowest tier off ink4. Make the list one grid, or fix the fourth track to `minmax(96px,auto)`, so the mono numerals form the column they exist for.
Suggested command: /impeccable clarify

### [P2] Thirty-nine undersized text findings, a skipped heading level, and one real contrast failure
Detector-only; the design review missed all three. 39 visible findings under 11px, in two sizes: 9.5px (stat labels, clock column headings, row eyebrows, live-panel state words) and 10.5px (rail labels, clock row dates, "N more"). Heading order goes h1 "What needs you" straight to h3 "Still to drop" with no h2 — and the attention list, the page's primary content, carries no heading at all. And `span.av` in the masthead measures 3.70:1: its own background is transparent, the colour comes from a gradient, and the light stop is #3a4c5a behind #9daab4.
Why: an expert reads 9.5px fine; a second admin and anyone at arm's length does not. The heading gap breaks screen-reader navigation on the one list that matters.
Fix: decide a floor for functional text and hold it, or record the exception. Give the attention list an h2. Raise the avatar chip's ink or darken its gradient stop.
Suggested command: /impeccable typeset

### [P2] The least reversible control is the smallest target on the page
The commit chip is 121.2 x 32px against attention rows at 1032 x 71.8 — a 19x area difference in favour of navigation over the one irreversible act. `--tap` is 44px. Three targets sit under 32px entirely: the masthead search input at 17px, and both live-panel links at 15.5px. Four more sit between 32 and 43.
Why: the ledger records that the floating staged tray hides on Home because this banner carries the same button. If the strip stands in for the tray it should carry what the tray carried, and it should not be the smallest thing on screen.
Fix: raise the chip to 44px or give it the raised ground. Name the realms in the strip — `Resume` already computes the Set and uses only `.size`.
Suggested command: /impeccable harden

## Persona Red Flags

**Harkirat (the sole admin, expert).** Nothing blocks him. The costs are the dead ends: 11 clock items he must go to Season to see, and two announcements he must leave the page to read. The severity ladder he knows by heart, so it costs him nothing and teaches nobody else.

**The second admin (PRODUCT.md says this is a real near-term possibility).** Lands on a page whose sort order is expressed only as a 3px bar in four colours, one of which is invisible. Learns nothing about why row 01 outranks row 05. Reads "NEVER ENDS" in alarm orange and "ENDS TOMORROW" in grey and draws the wrong conclusion about which needs attention.

**Anyone not at a desk.** 39 pieces of functional text under 11px, three click targets under 32px, and the two panels that answer the portal's stated subject start 107px below the fold.

## Minor Observations

- Four panels, four padding pairs; inner-left ink edges rag 6px down a dark page (183, 188, 184, 182).
- Every structural gap on Home is a literal. The spacing scale shipped today and Home adopted none of it.
- `.att-list` is declared twice in app.css; the first block's 26px bottom margin is dead. This is the duplicate-selector trap the portal-editing rule names.
- `.lrow` dividers are 1px at 1.07:1 — drawn and invisible. Raise or delete.
- Three shapes for one meaning on one page: 3x34.8 bar, 3x12 bar, and an 8px diamond.
- The 01-05 ordinal gutter costs 48px before the severity bar, is aria-hidden, and carries nothing the row order does not.
- The right-arrow glyph is text in a chrome position, where the prose exemption does not reach. Lucide is already inlined.
- Every dim text token on Home passes 4.5:1 when pixel-sampled. No contrast finding is warranted there.

## Questions to Consider

1. The attention list is exceptions and the live panels are state, so why is "needs you" the only figure with a colour? If "announcements live" were ever 0, that is a state worth naming — replies going out with nothing attached — and the panel below says so in words while the figure above stays silent.
2. What does Home look like on a good day? The empty state exists and is well written, but nobody has drawn the page whose h1 is "What needs you" and whose lead figure is a 44px zero. If the goal is that Home is usually empty, that is the design that matters most.
3. The clock lists are Home-only, get a 212px panel and eight rows the reader mostly cannot act on, and sit above the fold. "Running right now" answers a more useful version of the same question and sits below it. Are the two panels in each other's positions?
