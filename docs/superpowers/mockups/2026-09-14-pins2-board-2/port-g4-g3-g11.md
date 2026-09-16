---
kind: reference
status: live
---

# The port sheet — board 2's G4, G3 and G11 against the portal

*Written 2026-09-16 00:47 EDT, plan `docs/superpowers/plans/2026-09-13-portal-pins-batch-2.md` §5b Step 6. Session 5 builds from this; it decides nothing and asks Harkirat nothing.*

Ten of Harkirat's 57 review pins of 2026-09-15 say the same thing in different words: a design board settled this and the portal does not show it. Two of the twelve — the New Build drawer (pin 2) and the announcement drawer (pin 48) — already have their sheet at `../2026-09-14-pins2-board/handoff-g9-g8.md`. This file is the other ten.

**How to read a row.** The board column cites `resolved-spec.md` beside this file by section name and line, so no value is retyped here — a transcription is a new unverified claim, and the spec is the rendered reading. The portal column cites the file and line that ships today.

## Board 3 overrides board 2 in three places — check here before porting

A pins-2 decision is newer than board 2's spec, so porting board 2 faithfully would undo a decision Harkirat has already made. These are the three:

| Element | Board 2 says | What actually ships | Why |
|---|---|---|---|
| Copy segment, hovered | unchanged from rest — no tint (`resolved-spec.md:1681`) | tints in the weapon's own `--c` at 16% with a 50% ring | Pin 11, and his correction of 2026-09-15 23:23 EDT: the tint belongs on the gunsmith copy button, and Share keeps what it had |
| Enclosure footer divider | the spec carries no border property at all | a **dashed** upper border, and the footer text centred | Pin 40, which is a new request rather than a port |
| Secondaries accent | `#023047` throughout | `#3F6E8E`, in the token **and** in the data the chips and bars read | Pin 6 — the token alone changes nothing visible, because every chip reads `b.accent` from the API |

## G4 · the Armory manifest — pins 5, 8, 9

The manifest ported closely, so these are value rows and nothing structural is in question.

| Pin | Element | Board 2 | Portal today | The change |
|---|---|---|---|---|
| 8 | Code field group | `Code field group`, `resolved-spec.md:1258` — one ring, `inset 0 0 0 1px var(--rule2)` on the group | `app.css:1174` puts that ring on `.wg-ig` **and** `app.css:1178` puts a second one on `.wg-igb` | Two rings meet at the seam, which is the uneven border he photographed. The group draws one ring in an `::after` above its children; `.wg-igb` trades its ring for a left border |
| 9 | Copy button, hovered | `resolved-spec.md:1650` — `background: none !important` on the wrapper | `app.css:1181` `.wg-code:hover .wg-igb` keys the tint on the **wrapper**, so hovering anywhere in the field lights the button | Scope the tint to the segment itself, and give `:focus-visible` the same treatment so the keyboard reaches it |
| 5 | Collapse all | `Collapse all`, `resolved-spec.md:337` — `inline-flex`, 8px gap, `0 12px`, 44px, `background: none !important` | `app.css` draws the per-weapon control as a 44px square whose word is an absolutely-positioned `::after` slid a fixed -70px | One control for both: icon then word, 12px padding, 8px gap, 600 12/12, 44px, the box hugging its contents. Board 2's fold and unfold marks on every fold control |

🔴 **One portal rule causes the second row and it is not in any board spec.** `portal/public/app.css:442` is a bare `button:hover:not(:disabled) { background: var(--rule) }`. At (0,2,1) it outranks every `.class { background: none }` in the portal, so any control that draws its own box with a `::before` gains a second, larger, borderless slab behind it on hover. Six controls were affected; the previous round killed it for `.wg-r .wg-ib` alone, which is why the rest survived. **Fix the rule, not the six call sites.**

## G3 · the delivery-queue card — pins 32, 39, 40, 46

**The structures correspond one to one, which was worth checking before writing this section.** Every part board 2 draws exists in the portal under a `b*` name:

```
pb-numr → bnum     pb-tl    → btl      pb-track → btrack   pb-span → bspan
pb-now  → bnow     pb-dates → bmeta    pb-pill  → bpill    pb-cacts → bacts
pb-enc  → benc     pb-encf  → bencf    pb-exp   → bexp     pb-ban  → bban
```

**And the geometry already matches**, checked rather than assumed: `.qcard` is `56px minmax(0,1fr) auto` with `gap: var(--s4)` = 16px against board 2's `56px minmax(0px, 1fr) auto` / `16px` (`resolved-spec.md:2458`); `.benc`'s gradient and double inset shadow are byte-identical to `.pb-enc` (`:2514`); `.bencf` is `gap:10px; padding:0 4px 0 18px; font:500 var(--t-xs)/1 var(--data); color:var(--ink3)`, which is `.pb-encf` exactly (`:2562`); `.bexp` resolves to the same 8px gap and `0 12px` padding as `.pb-exp` (`:2584`, `--s2:8px`, `--s3:12px` at `app.css:212`).

⚠️ **So pin 32 is NOT about these numbers, and a value table alone would have reported "all matching" and taught Session 5 nothing.** What is left to find is composition and state — what each part renders, not how wide it is. `resolved-spec.md`'s property list stops at the fifty properties `extract-spec.cjs` collects, and border **style** is not among them, so the spec is silent exactly where pin 40 asks a question.

| Pin | What he asked | Status |
|---|---|---|
| 39 | the spacing inside the quote box | Board 3 carries 14 / 18 / 12; `.benc p` is `13px 18px 2px` at `app.css:989`. **Value row, ready to build.** |
| 40 | Show all's unfold mark · footer text centred · dashed upper border · the character count | `.bexp` at `app.css:993` has no unfold mark and `.bencf` at `:991` is `1px solid var(--rule3)`. Three of the four are values; the fourth is Session 4's (small text). |
| 46 | the panel head on `#161E24` with a thicker divider | `.bqhead` at `app.css:976` sets type only; the ground and the divider belong to the panel. **Needs one rendered reading of the panel head on both sides** — it is the one row here I have not measured. |
| 32 | "half-assed port" | Neither structural nor geometric, per the two paragraphs above. **Open: needs a composition diff of the card's contents on both sides.** |

## G11 · the broadcast manifest — pins 44, 45, 50

🔴 **This one IS structural, and it is the reason pin 50 cannot be closed by copying numbers.** Board 2's G11 is a CSS **grid**: `.pb-br` is `grid-template-columns: var(--colsc)` resolving to `550px 104px 104px 104px 124px 44px` with `column-gap: 16px` and `padding: 0 16px 0 22px` (`resolved-spec.md:1938`), and its head row matches it (`:1880`). The portal's manifest is a real HTML `<table>` with a `<colgroup>` (`portal/ui/manifest.js:188`), whose widths are `auto / 120px / 120px / 140px` (`app.css:955-957`). **A table has no `column-gap`** — the spacing between columns is cell padding — so the board's six-track grid has no `<col>` translation and the numbers cannot be transferred.

| Pin | Element | Board 2 | Portal today | The change |
|---|---|---|---|---|
| 50 | Column widths | `Announcement row`, `:1938` — `550 / 104 / 104 / 104 / 124 / 44`, 16px between, 22px in | `<col>` widths `auto / 120 / 120 / 120 / 140` at `app.css:955-957`, no gap | Either the shared `Manifest` gains a grid mode, or the widths are re-derived as table cells **plus** the padding that stands in for the 16px gap. That choice is Session 5's and it is the only real decision in this file |
| 45 | Row hover | `Announcement row, hovered`, `:1974` — three radial gradients in the announcement's own `--c` | `app.css:2148` `.mtable tbody tr:hover { background: var(--sunk) }` — one flat neutral | The tint is not missing, it is the wrong source. `--c` is already on the row (`dotStyle` at `portal/ui/broadcast.js:34`) |
| 45 | Announcement text | `Announcement text`, `:1999` — `600 var(--t-base)/1.35 var(--ui)`, `var(--ink)` | `portal/ui/broadcast.js:35` strips a leading `#` and renders `<b>` | Board 2 also drops the prefix every seeded row shares, so what is left is the announcement |
| 44 | Tools row | inherits G4 | same shared `Manifest`, `portal/ui/broadcast.js:556` | Nothing of its own: the Armory tools-row fixes land here because it is one component. Worth a check after G4 ships, not a change |

## Pin 26 · Export — a capability, not a value

Export is the one pin in this file that no table can hold. The old panel could **search, tick whichever builds you wanted, and export exactly those**; `portal/ui/exportPanel.js` today contains no search and no per-build selection — the words `search` and `filter` do not occur in the file. So this is not a style that drifted, it is a feature that was dropped in the fold into the Export drawer, and it is also the one item here with an open fork on board 3 (`exp`: under the scopes, or its own step). **Session 5 builds whichever he picks; the picker itself — a search, weapons that tick as a group, builds one by one, a running count — is the same either way.**

## What I checked, and the one thing I got wrong

- Board 2's `resolved-spec.md` covers **G4** (resting `:67`, hover `:1544`, by-slot `:1739`), **G11** (`:1824`, staged `:2399`), **G3** (`:2436`) and G2 (`:3185`) — 3,316 lines. Every board value above is a citation into it, never a retyped number.
- **I predicted G3 would be structurally divergent and it is not.** The reasoning was his own words — "WTF IS THIS HALF-ASSED PORT" reads as a structural complaint — and the class map plus the geometry check says otherwise. Recording it because the wrong half of a tidy theory is worth more to the next session than the right half.
- **Pins 32 and 46 are not closed here.** 32 needs a composition diff of the card's contents; 46 needs one rendered reading of the panel head. Both are named rather than quietly rounded off.
