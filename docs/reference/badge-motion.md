---
kind: reference
status: live
---

# Badge motion — the law every badge animation follows

*Written 2026-09-26 13:56 EDT at Harkirat's direction ("document the badge-motion logic/law/direction/etc concretely in the repo so it's never missed again"). Until today this law lived only in comments inside the Board 4 kit's `local/pins2-board-3/redo/b3/board.css` (the BADGE MOTION block), and the kit is gitignored: no fresh clone, no `ctx_search`, and no session designing a new badge could find it. The Rank Mode family then went through six rejected motions in one day, each breaking a rule written here. Read this file before designing, changing or porting any badge motion — on the board, in the portal (`portal/ui/`), or anywhere a badge is drawn.*

## The five laws

1. **A badge is a stamped mark. Its parts do not move. What moves is a MATERIAL crossing it.** Never animate a transform on the badge, its icon, its word or its letters. Light crossing metal is a gleam, fluid crossing a surface is a stain, current in the metal is lightning — each is a layer travelling under a mask while the emblem stays perfectly still. An icon that hops is "a sticker being poked"; a word that flips or re-types is the same failure.
2. **The motion is read off the KIND OF CLAIM the badge makes.** Ask what the badge asserts about a build before choosing anything. The claim decides the material; the material decides the motion.
3. **Every family is told apart by material AND by the character of its motion.** Two families that share a material or a direction blur into each other. Check the table below before proposing; a proposal that lands in an occupied cell is rejected on sight ("sheen literally feels like Best badge's animation").
4. **Contained.** The material lives inside the badge's plate, or at its trim. The base badge clips (`overflow:hidden`) on purpose — BEST's gleam, TOXIC's stain and META's lightning are all clipped into the frame. Never open the clip to let a motion out into the open: "keep the animation contained inside or near the badge's container/trim/plate, don't go out into the open too much."
5. **Quiet, mostly absent, and cheap.** Twelve or more rows of badges are on screen at once, so every loop is held deliberately quiet, and a loop in a data table earns its place by being mostly absent (TOXIC is the one exception, because a leak never stops). Badges in one row never march in lockstep — phases are scattered. **Only `transform` and `opacity` may loop** (the compositor): anything else repaints every frame. Measured on Board 3-E: META's glow animating custom properties cost 11.8 points of a core; moved onto transform and opacity, 0%.

## The families

| Family | The claim it makes | Material | Character of the motion |
|---|---|---|---|
| **META** | the game's current state — volatile, external, will stop being true | current: his own lightning, clipped into the frame, bursting from the bolt glyph | erratic, dynamic, unrestricted, multi-directional — never a smooth sweep |
| **BEST** | a ranking the system awarded — an object, a plaque | light | a wide soft gleam raking across its FACE, horizontal, slow |
| **TOP 3 / TOP 5**, **CAPABLE** | the same kind of claim, lower in degree — a medal | light | a hairline crest travelling AROUND the rim, one slow revolution, seamless |
| **TOXIC** | how it feels to play against — a property that leaks | fluid | a stain creeping continuously, seamless, never pausing |
| **ASS** | a verdict that the build is bad | fumes | stink lines and haze RISING from the mark, vertical |
| **Rank Mode** (HP, S&D, DOM, TDM, FTL, Control) — *two proposals on the board since 2026-09-26 14:08 EDT, pending his pick* | where the build belongs — informative, a suggestion ("an 'informative/suggestion wearing makeup' badge, rather than something declaring something important about that specific build"), so the QUIETEST family | a signal | A · Signal: a faint ring grows from the plate's centre behind the mark and word and arrives at the trim on an ease curve (7.5s cycle); a backwards-C glow inside the trim (right edge, curling onto top and bottom) rests static and swells WITH the echo on the same clock. B · Glint: every letter glints evenly in place while the glow blooms under the word on the same clock — one event per chip, each chip on its own drifting rhythm (never together, never in a line). A glow is never independent of the event it belongs to. Both contained, the mark untouched |

⚠️ **META is not "horizontal".** An early board note (2026-09-16) described META as "a hard narrow edge, horizontal and fast"; that animation was replaced by his lightning on 2026-09-17, and on 2026-09-26 a session cited the old line as current. His correction: "it's honestly erratic and dynamic. it's volatile; unrestricted; multi-directional due to it's lightning bolt animation." A superseded description is not a rule.

## Procedure for a new badge family (or a new motion on an old one)

1. Read this file and the family table. Recall linksee by query (`badge motion law`) for anything newer.
2. Write down the claim the badge makes, in one sentence.
3. Pick the material that claim implies, and check its cell is empty — by material AND by character, not by axis alone.
4. Check the five laws one by one: nothing on the badge moves · contained in the plate or at its trim (the clip stays) · mostly absent and scattered · transform and opacity only · the family's resting light (lit top edge, ring, glow) stays underneath, unchanged.
5. Render it on the real board at 2x device pixels, as stepped frames (pause every animation and set `currentTime`), and look at the frames where it moves before sending anything. Send the GIF, then ask.

## Rejected, with his words — never propose these again

| Badge | What was proposed | Why it failed |
|---|---|---|
| META | the icon bouncing; a light sweep; a dash on the bolt's outline; a band through the word | "an icon bouncing was such a shit and lazy animation"; all four were layers crossing the badge, wrong for a volatile claim |
| META | hand-drawn zigzag bolts | "the lightning bolts look like a child drew them" |
| Rank Mode | a glint through the white word, with a glow | the word had to be dimmed to show a white glint on white, which washed the badges out; "the glow doesn't feel properly timed with the glint" |
| Rank Mode | Sheen: a light band across the plate behind the word | BEST's face gleam — "sheen literally feels like Best badge's animation" |
| Rank Mode | Scan: an underline drawn under each word in turn | "SO LAZY and basically the sheen wearing makeup" |
| Rank Mode | Flip (the word hinging like a split-flap card) and Type (the letters re-typing) | "BOTH SHIT. and both incorrect!" — they move the badge's parts |
| Rank Mode | a ping ring leaving the plate 6px into the open | the radial signal "was a good idea but your execution of it is bad… too prominent and expansive, giving these badges more importance and attention than they require" |

## Where the code lives

- Board 4 kit (the design): `local/pins2-board-3/redo/b3/board.css` (the BADGE MOTION block: META, BEST, TOP, TOXIC) and `local/pins2-board-3/redo/b4/classes.css` (CAPABLE, ASS, Rank Mode).
- The portal (the port, Session 5): `portal/ui/armory.js` and the portal's stylesheets carry the same classes; this law applies there unchanged.
