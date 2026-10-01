---
kind: idea
status: live
---

# The Armory manifest's By slot view — retired from Board 4, kept here

*Written 2026-10-01 12:27 EDT. Retired from Board 4: Collective at Harkirat's word (2026-10-01 12:24 EDT): "this seems like an important design fork that i don't really want to work on at the moment. Let's do this, retire/remove it from the board (including it's view toggle buttons), document it thoroughly in a .md … and place that doc in `docs/ideas` as something i might work on in the future but its removed from the design now." It is NOT in the design Sessions 4 and 5 port.*

## What it was

A second way to show a weapon group's builds in the Armory manifest. **List** (the design that stays) shows each build's attachments as one wrapping run of chips. **By slot** gave every slot the weapon's builds use its own column — a header strip with the slot names (Muzzle, Barrel, Laser, …) above the group, and one cell per slot in every build row, empty slots drawn as an outlined "—". A segmented toggle, "Attachments: List · By slot" (icons `list` and `columns-3`), sat in the manifest's chip row. The view state was per page, in memory only, starting on List.

## Its history

| When | What | Where |
|---|---|---|
| 2026-09-14 (board 2, G4) | His brief: names only, wrap freely; **"List · By slot stays: the slot grid is opt-in (10:34 EDT)"**, the switch in the category chip row | plan §10.4 G4 row 6 |
| 2026-09-15 (Session 2) | Built into the portal's Armory manifest | `portal/ui/armory.js` (`ArmoryGroups`, `attView`) |
| 2026-09-18 (board 3-E) | His thread 9ac5e9ae: "Add icons to the \"List / by slot\" toggles, as well as any other rail toggles in the portal/board" | 3-E artifact; kit `list` / `columns-3` icons |
| 2026-10-01 11:38 EDT (readiness audit) | First opened on Board 4: **a build with a label pushes its slot cells right of the column heads** — the label plate takes the first track, so a named build's attachments sit under the wrong slot names; at ≤640px the strip was hidden outright | `HANDOFF.md` § Added by the readiness audit |
| 2026-10-01 12:24 EDT | **Retired** from the board, with its toggle | this file |

## The state it was retired in

- **Screenshots (on this Mac only, never pushed — his rule for screenshots):** `local/pins2/audit/states/1b-manifest-by-slot.png` (1,282px: build 2, labelled "Sidearm", has Monolithic Suppressor under BARREL instead of MUZZLE) · `local/pins2/audit/states/7-800-C1.png` (800px: the same shift, and the slot grid running past the panel's right edge).
- **The defect, exactly:** the strip and the rows share no grid. `.wg-strip` is `32px 28px minmax(0,1fr) 28px 144px 113px` with `.wg-slots` in the third track; a row's `.wg-main` puts the optional `.wg-plate` (build name) BEFORE its own `.wg-slots`, so an unnamed row's cells start at the strip's first column and a named row's start one plate-width later. Every cell is `minmax(0,1fr)` of `--n` slots, so the tracks also differ in width between named and unnamed rows.
- **Live in the portal:** Session 2 shipped it; `portal/ui/armory.js` still renders it (the `attView` state and the `wg-strip` / `wg-slots` branches). Session 5 removes it there (`HANDOFF.md`).

## What a revival must solve

1. One column grid shared by the strip and every row — subgrid, or the plate moved out of the slot tracks (a column of its own for every row, empty when unnamed).
2. DMZ: up to nine slots (plan §10.4 row 17), so the cell width at nine columns.
3. Narrow windows: the grid at 1,100, 960 and 800px (it ran past the panel at 800) — part of the responsiveness rework in `docs/db-deferred-list.md`.
4. The empty cell's look ("—" in an outline) against the List view's chips, and whether a slot column the weapon never uses is drawn at all.

## The code, as it was (kit, before removal)

**The column strip** (`docs/pins2/kit/ui/armory.js`, in `ArmoryGroups`):

```js
${!shut && attView === 'slot' && slotsHere.length ? html`<div class=${'wg-strip' + (dmz ? ' dmz' : '')}><span></span><span></span><div class="wg-slots" style=${`--n:${slotsHere.length}`}>${slotsHere.map((s) => html`<span key=${s}>${s}</span>`)}</div><span></span>${dmz ? null : html`<span></span>`}<span></span></div>` : null}
```

**The row's slot cells** (same function; the List view's chip run was the other arm):

```js
${attView === 'slot' && slotsHere.length
                                    ? html`<div class="wg-slots" style=${`--n:${slotsHere.length}`}>${slotsHere.map((s) => { const at = (b.attachmentSlots || []).indexOf(s); return at >= 0
                                        ? html`<span class=${'wg-sc' + (at >= pairs ? ' nocode' : '')} key=${s} title=${at >= pairs ? 'Not in the gunsmith code' : null} style=${`--sl:${slotVar(s)}`}>${b.attachments[at]}</span>`
                                        : html`<span class="wg-sc empty" key=${s}>—</span>`; })}</div>`
```

**The toggle, the realm's** (`docs/pins2/kit/ui/armory.js`, the Manifest's `extraChips`):

```js
                                   extraChips=${html`<span class="mlabel"><span>Attachments</span></span><span class="seg" role="tablist" aria-label="Attachments">
                                       <button role="tab" aria-selected=${attView === 'list' ? 'true' : 'false'} onClick=${() => setAttView('list')}><${Icon} name="list" />List</button>
                                       <button role="tab" aria-selected=${attView === 'slot' ? 'true' : 'false'} onClick=${() => setAttView('slot')}><${Icon} name="columns-3" />By slot</button></span>`}
```

**The toggle, the board gate's** (`docs/pins2/kit/gates/armory.js`):

```js
    const attChips = html`<span class="mlabel"><span>Attachments</span></span><span class="seg" role="tablist" aria-label="Attachments">
        <button type="button" role="tab" aria-selected=${attView === 'list' ? 'true' : 'false'} onClick=${() => setAttView('list')}><${Icon} name="list" />List</button>
        <button type="button" role="tab" aria-selected=${attView === 'slot' ? 'true' : 'false'} onClick=${() => setAttView('slot')}><${Icon} name="columns-3" />By slot</button></span>`;
```

**Styles** (`docs/pins2/kit/app.css`, line: rule):

```css
1205: .wg-strip{display:grid;grid-template-columns:32px 28px minmax(0,1fr) 28px 144px 113px;column-gap:var(--s3);align-items:center;min-height:26px;padding:0 var(--s4) 0 20px;background:var(--sunk);font:600 var(--t-micro)/1 var(--data);letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
1206: .wg-strip.dmz{grid-template-columns:32px 28px minmax(0,1fr) 28px 113px}
1207: .wg-slots{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:10px;min-width:0}
1208: .wg-sc{display:flex;align-items:center;min-width:0;min-height:32px;padding:4px 10px;border-radius:var(--rad-2);background:color-mix(in srgb,var(--sl,var(--ink4)) 8%,var(--sunk));box-shadow:inset 0 0 0 1px var(--rule),inset 0 -2px 0 color-mix(in srgb,var(--sl,var(--ink4)) 45%,transparent);font:500 var(--t-sm)/1.25 var(--ui);color:var(--ink)}
1209: .wg-sc.empty{background:none;box-shadow:inset 0 0 0 1px var(--rule3);color:var(--ink3)}
1230: .wg-strip{display:none}
```

**Styles** (`docs/pins2/kit/b3/board.css` — the slot-hue tag styles reached the cells too):

```css
451: html[data-b3-p2sty=neutralbg] .wg-sc{color:var(--sl,var(--ink2))}
532: html[data-b3-p2sty=text] .wg-sc{color:var(--sl,var(--ink2))}
535: html[data-b3-p2lab]:not([data-b3-p2lab=off]) .wg-sc{color:var(--sl,var(--ink2))}
543: html[data-b3-p2sty=washc] .wg-sc,html[data-b3-p2sty=neutral] .wg-sc{color:var(--sl,var(--ink2))}
3622: .wg-at.nocode:not(#_),.wg-sc.nocode:not(#_){box-shadow:none;outline:1px dashed color-mix(in srgb,var(--warn) 72%,transparent);outline-offset:-1px;
```
