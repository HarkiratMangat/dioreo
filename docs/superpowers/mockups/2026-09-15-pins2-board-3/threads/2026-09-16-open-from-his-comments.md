---
kind: reference
status: live
---

# His older comments, checked against the board rather than against my memory — 2026-09-16 21:47 EDT

⚠️ **The first version of this file was wrong.** It listed twelve items as "open" on the strength of having read the comment thread and not found obvious evidence in a grep. That is not a status, it is an absence of looking. Checked properly against the source and the render, **eleven of the twelve were already built** — several of them with a comment in the file quoting the very words I was calling unanswered.

| His words | Verdict | Where it is |
|---|---|---|
| "the mesh is terribly executed. please redesign the mesh gradient system" | **built** | `board.css:389`, redrawn 12:41 EDT quoting him; it is the `p5bg` fork and my pick |
| a near-duplicate has no indicator on the build's own elements | **built** | `board.css:589` — `.dup` gives the code the same wavy orange underline a bad code gets |
| make the slot legend clickable so I can change a colour | **built** | `gates/armory.js:138` — an `<input type="color">` per slot with a reset |
| a faux build carrying all nine attachment slots | **built** | `SlotSpecimen`, "All nine slots — a build no weapon has" |
| exclude "bar" from tag style; add a neutral-background example | **built** | `bar` is gone; `neutralbg` is his second reference |
| "orange on top of orange for this label and button is just a bad idea" | **built** | B1's note says it in those words: "Set end date is a quiet control, no orange on orange" |
| the never-ends warning is too much prose | **built** | `p8` fork, the warning lives on the card it is about |
| "1 needs attention" sits outside the panel | **built** | the warning moved into the queue panel |
| the timeline's spacing | **built** | `p9` fork on the History surface |
| the sideways-scroll grab area is too narrow | **built** | `.b3-sd-atts` takes `padding:11px 0; margin:-11px 0` — the cell is the grab area, not the labels |
| the Repairs button split out of the toggles, on the right | **built** | `.b3-rv` takes `margin-left:auto` |
| **"the pop-up hint text for this button is prose heavy that no one will read"** | **was genuinely open** | fixed 2026-09-16 21:47 EDT — see below |

## The one that was real, and it was worse than he said

`p5hint` is a fork with two options. The **card** option had already been rebuilt into a three-step path — STAGED → REVIEW → GONE — which answers him. The **inline** option had not: hovering Stage deletion swapped the weapon chips for a 96-character sentence, and **`.b3-sd-note` had no rule in the stylesheet at all**, so it rendered as raw inline text in a bar made of pills. Both halves of a fork have to be good or the fork is not a choice. The inline option is now the same step path — STAGED → REVIEW → REMOVED, with "Nothing is removed yet" under it — so the fork is about WHERE the statement sits rather than whether one of the two is finished.

## What this file is for now

Not a backlog. It is the record of a habit worth not repeating: **reading a comment is not checking a board.** Every row above was answerable in one grep or one render, and calling them open cost him a question he should not have had to ask.
