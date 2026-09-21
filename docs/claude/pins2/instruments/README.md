---
kind: record
status: live
---

# Session 3's measuring instruments — copied out of the scratchpad 2026-09-21 12:41 EDT

Throwaway-shaped but load-bearing for Board 4: each was used to measure a claim in `../handoffs/2026-09-21-pins2-s3-board4-checkpoint.md`. Run from the repo root with the kit on :8900 (`repo-static`). They are not portal tools and nothing runs them automatically.

| Script | What it measures |
|---|---|
| `elcmp.cjs g8` | board 1's post drawer against Board 4's, every element paired by class path, every differing property listed |
| `g10cmp.cjs [out.png]` | the same for Compare (board 1 G10 one-weapon view vs Board 4 C3) |
| `filled.cjs <dir>` | captures board 1's drawers and Compare beside Board 4's in filled states, same scale |
| `pairs.cjs <dir>` | captures board 1 G9/G10/G8 and board 2 G11/G2 beside Board 4's sections |
| `b4shots.cjs <dir>` | renders every Board 4 section and each of its Try states; prints page errors |
| `cssdrift.cjs <board index.html> <app.css>` | how far a board renders from a given stylesheet — proved boards 1/2 had 0 drift before freezing |
| `crop.cjs <dir>` | the M1 weapon group on board 2 and board 3, with the build number's weight and the weapon-line gap read off |
