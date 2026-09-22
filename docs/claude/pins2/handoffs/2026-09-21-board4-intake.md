---
kind: record
status: live
---

# Board 4 intake round — 2026-09-21 17:40 EDT

*His comments gate by gate, verbatim. Nothing is fixed until every gate is in; then one pass, by class, checking neighbouring elements.*

## C1 · The Armory manifest

1. add a subtle drop shadow to the selection bar so it feels like it's slightly floating above the manifest. Right now it just sits flat over it.
2. refine the reveal/hide animation of the selection bar's list view, its so choppy. I want it as smooth and refined as Export drawer's Pick builds export list.
3. give the selection bar's "edit builds" and "export" buttons hover event tints that match the --staged and --ok accent colors respectively. unsure if i want them to also receive the resting color as well... what do you think?
   - *My recommendation: tint on hover only, and keep the resting buttons neutral. Stage deletion is already red while resting, so colouring Edit and Export at rest too would turn the bar into three competing colours and weaken the warning. I'll render both before the fix pass.*
   - **His ruling: hover only.**

## C2 · New build

*Screenshots copied to `local/pins2-board-3/board4-review/intake/` (105 header, 106 build form, 107 footer, 108 badges/tier/image).*

1. this header area looks so stupid with the solid black bar. It needs to be redesigns to fit and integrate better into the drawer. Propose a few arrangement designs and show me on the board. *(105)*
2. MP/DMZ toggles also need their full hover events implemented, as well as removing their grey washed hover tint.
3. add build/bulk create also don't have their full set of hover-events
4. literally ALL of these hints, text, fields, toggles, dropdowns, chips, placeholder, etc EVERY SURFACE of the Add build panel needs significant refining and design improvements — this is probably one of the largest tasks still pending on the board! it feels like a cheap imitation of the drawer that board 1 has designed. It feels like it was hastily created and carried of none of the refined aspects of the board 1 design into this version. *(106, 108)*
5. the mesh ground also needs to be dynamic based on the weapon category deleted. *(read as "selected")*
6. the bottom bar is also so stupid and such a waste of space. *(107)*
7. so basically, the entire panel needs a drastic design improvement to 1. feel more like the refined version board 1 created, and 2. to tweak and change things on top of board 1's design such as the header and the bottom buttons bar.

### Bulk create *(his lead-in: "i forgot about the bulk create panel..."; 109 the Pick builds export list, 110 the bulk list today)*

8. obviously some of those changes, such as the header and bottom bar will also persist into bulk create panel.
9. but bulk create's mesh ground is based on the builds and their category, typed in the list, same as how Pick builds... dynamically changes its mesh based on the builds selected.
10. I also need the actual list to be SOOO MUCH more user friendly. Like i literally started typing and forgot what i even had to type in the field. *(110)*
11. i also want the actual styling of the list to match the list used in Export's Pick builds... panel. This is a prime example of hand crafting something which already exists elsewhere in the design/board/portal. *(109 vs 110)*
12. and add a toggle in the board's chrome to prefil the bulk create list with a few different scenarios so i can actually see how each one will actually look.

### Edit builds *(111 "Editing BAL-27", 112 the selection bar's weapon chips)*

13. as for "edit draws", it'll basically receive all of the changes that will happen to the drawer. But something i wanted to specifically state was the "Editing X" hint. Make this the same pill chip used in the Selection bar, including the X toggle on it to quickly remove/delete the lines out of the bulk editer. Does that make sense? *(111 → 112)*
    - *My reading: one chip per weapon being edited, as the selection bar draws it (dot, weapon name, "Builds 1, 2, 3", ×). Its × removes that weapon's blocks from the editor.*

## C3 · Compare

*(113 the build toggles, 114 Show cards, 115 two weapons, 116 the empty landing)*

1. fix these toggle (notice how their shapes are not consistent?). and overall improve their design. *(113, 115)*
2. also the toggles lack the full set of hover-events and tints.
3. same with nearly every surface on the compare panel, lack of hover events.
4. this card layout also doesn't make sense. Why are you wasting so much space? The layout needs to dynamically change for the max number of builds allowed per comparison (which is 6). So all you need to do it design the layout for 1-6 cards, it's not that complicated, yet still you messed it up and designed it lazy even tho i already asked you earlier to fix and improve the layout. *(114)*
5. the overall surface/chips/boxes/labels/etc all need better design improvements to look and feel nicer.
6. regulate the fonts and font weights as well. These prior board 1 and 2 use different fonts and weights than board 3's gates.
7. and HEAVILY REDESIGN the compare landing panel because wtf is this? it's so barebone and lazy. like it was literally forgotten about. *(116)*

- *My note: on the published board every card reads "Cloudinary did not return this image" (114). The artifact has no image host, so the card image needs a board fallback.*

## C4 · Repairs

Fine.

## C5 · Export

*(117–123: the hover card, and where it lands with several lists and with lists collapsed)*

1. don't neglect the mp/dmz toggle here when you apply it's hover events and stuff, as stated in my c2 comments. since it's the same toggle design, which means it should be sharing the same code and styling.
2. these cards that appear when hovering over a build tile...
   - they don't state or visually show or anything if they belong to an MP build or dmz build. *(117, 118)*
   - their position also needs to be finetuned/tweaked when a list is collapsed or multiple lists being used or if multiple lists are collapses. these last 5 screenshots show how bugged they are when multiple lists exist and how they just float in the middle of no where. Their float position makes sense when a list is open, but the position doesn't change when lists are closed. *(119–123)*

## C6 · The delivery queue

Fine.

## C7 · The Broadcast manifest, and posting

*(124 the rows, 125 board 2's active sort label, 126 ours, 127 the staged chip, 128 the state filter chips, 129 the post drawer with a long word and seven repeats; `c7-state-chip-board2.png` / `c7-state-chip-board4.png` his side-by-side of the state chip)*

### The manifest rows

1. the elements, text, chips, etc aren't middle aligned. *(124)*
2. why does this use a different delete button/icon/size? Use the same one used in the armory manifest.
3. the State chips also need finetuning. This is board 2's chip, this is your version of it. While they're 98% the same, ther's minor finetuning that's needed to make them *feel* better, such as board 2's more rounded corners. *(c7-state-chip-board2 vs -board4)*
4. and notice how board 2 actually changes the color of the sort label to a brighter white when it's invoked? where as your version keeps it the same grey color, giving no indication that the sorting is active right now. *(125 vs 126)*
5. clicking the manifest row should open the announcement editor (basically the 'new announcement' drawer but with the info prefilled to edit and stage the change). Meanwhile clicking an `Ended` announcement row should open the editor but with the intent to "post it again". The rows or it's cells should not edit any item inline (such as clicking the announcement cell currently turns it into an editable field).
6. the staged chip also needs correcting. it currently makes the dashed border around the entire chip. i only want it to make the dashed border on top, right, and below. the left side should be the normal side bar thing that's used in the chip (idk if that makes sense?). But also, "live now" + `staged` state doesn't really make sense. So staged actually needs to say something else inside of the chip, and it needs to use the --staged accent, as well as the staged icon inside the chip. *(127)*
7. speaking of icons, why do the state toggle chips have color dots when they all have icons assigned to them? *(128)*

### The post announcement drawer

8. mostly fine but 2 bugs need fixing: a single long word can escape the Discord preview and adding a lot of 'repeats' pushes the fields under the discord preview. *(129)*
9. also this would get the same bottom bar/buttons changes that i asked for in the new build drawer.
10. that 'Ends' field also needs improvement, it's so confusing right now. Overall, i need better designed hints implemented into the drawer and their fields. (i believe i discussed this needing hints in drawers issue with a previous session as well, please search it up in this repo).

## C8 · History

Fine for now.

## C9 · Admin traffic

1. Fix the full set of hover-events and it's grey washed tint.

## K2 ruling — 2026-09-21 20:28 EDT (popup on `board4-review/k2-header.png` and `k2-footer.png`)

- **Header: C**, "but middle align the controls, they're currently top aligned. And add a subtle divider line to give more breathing room between the header and the form".
- **Footer: none of A, B, C.** "the "still needs a weapon" chip should be near the weapon field, it makes no sense being at the bottom. None of these options solve the core issue i stated which was that the bottom bar wasted space. All this did was make the bar invisible. the same is still wasted just the same as it was before. and confirm buttons in the header (your option c) is just stupid."

## His verdict on v6 — relayed from the side chat, 2026-09-21 23:05 EDT (filed 2026-09-22 08:54 EDT)

*Given on v6 (Opus 4.8's publish) and the pre-rewind work; it PREDATES v7–v9. He still has to look at v9 and update it.*

- **Confirmed fixed:** C1-1/2/3 · C7-1/2/4/5 · C7-3 · C7-6/7 · C9-1.
- **Not fixed / wrong:** C7-8/9 (the repeats bug still pushes the fields) · C2-1/6/8 (header C + footer D2 "lazy, half-ass", below the awwwards bar) · C2-2/3 (the New build drawer's MP/DMZ and Add/Bulk buttons dead; the grey-wash fix instance-scoped) · C5-1 (false: the build drawer's MP/DMZ broken while Export's works) · C2-4/7 ("complete shit", nothing polished) · C2-5/9 (mesh not dynamic; "already dynamic" was a wrong assumption) · C3-1 to 7 (unfinished; the finished parts worse than before).
- **Partial:** C2-10/11/12 (half done) · C2-13 (Editing X chips need correcting) · C5-2 (hover card still wrong).
- **Untouched:** C7-10 (the Ends field is confusing; the drawers need designed hints; hint COPY is Session 4's, the field and hint DESIGN is this pass; the Ends default date is his to rule).
- **Lead (it was right):** the dead buttons were exactly the ones header C moved.

## v10 intake round — opened 2026-09-22 10:40 EDT

*His review of the live v10 (https://claude.ai/artifact/FCAFvDXrKQN28SotQLJhTh), recorded verbatim in the order he sends them — his scratchpad of thoughts, not gate by gate — each tagged with the gate it concerns (or marked unclear). Questions for him are batched at the END of the round, never asked mid-intake. Nothing is fixed until he says the round is done; then one pass, by class, checking neighbouring elements. The design-debt pass (C2-1/6/8, C2-4/7) waits behind this round.*

### Message 1 — 2026-09-22 10:49 EDT · C2 build drawer (Add build: the image section and the fields)

*Screenshots copied to `local/pins2-board-3/board4-review/intake/`: `v10-01-image-placeholder.png` (the empty image preview: a dashed frame with a second frame nested inside it, the broken-image icon centred) · `v10-02-file-uploaded.png` (the row after an upload: image icon, the filename wrapping to two lines, "81 KB" stacked on two lines, a Replace pill) · `v10-03-paste-link-field.png` (a bar holding the icon, an inner "Paste a link" input box and a Choose pill) · `v10-04-existing-key-empty.png` (the Upload or link / Existing key segment, and an empty Key field with placeholder "BAL-27-1") · `v10-05-existing-key-filled.png` (the Key field filled with "BAL-27-6").*

1. correct this placeholder image in the build drawer. *(v10-01)*
2. the attach file/link field in the build drawer shows a bar inside of a bar. and look at how bad the field looks when an image is uploaded. Please correct that and significantly improve it's design. *(v10-02, v10-03)*
3. the 'existing key' field needs a search/autocomplete/fuzzy system based on the keys already stored in the system because i don't remember the key to type. And going and looking for it in cloudinary kind of defeats the purpose of the helpfulness of the portal. *(v10-04)*
4. the key field also needs improvement so when the key is auto created or when an existing one is used. in-fact, ALL of the fields in the drawer/form need drastic design improvements. They're so basic, barebone, and nothing about them is useful or "awwwards worthy". *(v10-04, v10-05)*

*His note: "just fyi, these next several intake items are all going to be on the Build drawer. i'll let you know when the intake topic shifts to another item."*

### Message 2 — 2026-09-22 10:56 EDT · C2 build drawer (Badges, and the tier selector)

*Screenshots: `v10-06-badges-hover.png` (META hovered and TOXIC at rest: each a dark tile holding a hand-drawn empty square and the badge name as bare monospace text) · `v10-07-badges-and-tier.png` (the Badges heading with its rule, the two tiles, and below them "Tier in AR" as a label on the left with a pill segment None · Best · Top 3 · Top 4 · Top 5 offset far to its right, None pressed).*

5. the badges selector doesn't use the checkbox system we already standardized and utilize elsewhere in the board. *(v10-06, v10-07)*
6. the badges also just show as bare text even tho we literally have designed badges... why?? Like do you see the pattern here in my notes? How nearly every field/surface of the form is just basic barebone lazy design, despite the "Awwwards worthy" bar and despite us also having better versions of a design used elsewhere? *(v10-06, v10-07)*
7. similarly with the tier selector badge... 1. wtf is that shit positioning? 2. improve it's design significantly. redesign it, if anything. *(v10-07)*
