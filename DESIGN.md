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
  rule: "#2A343D"
  ink: "#E8EDF1"
  ink2: "#9DAAB4"
  ink3: "#80909D"
  ink4: "#4E5A64"
  patch: "#F2C230"
  warn: "#FF7A45"
  ok: "#3DDC97"
  staged: "#5FD4E8"
  conflict: "#FF5C5C"
  draw: "#FF3430"
  ret: "#337BA6"
  ev: "#1F8A5E"
  play: "#8A6BD1"
  discord: "#5865F2"
typography:
  ui:
    fontFamily: "IBM Plex Sans Condensed, system-ui, sans-serif"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
rounded:
  sm: "2px"
  md: "3px"
  lg: "5px"
motion:
  hover:
    transition: "filter .12s, box-shadow .12s"
---

# Design — Dioreo admin portal

<!-- impeccable:design-source mockups -->

> 🔴 **THIS FILE DESCRIBES THE MOCKUPS, NOT `portal/ui/`.** Generated 2026-08-30 12:15 EDT by an `impeccable document` pass pointed deliberately at `docs/superpowers/mockups/2026-08-20-portal/` (six HTML files), **not** at the built portal, at Harkirat's instruction. The skill's default is to record the incumbent implementation; that default was overridden because the mockups are the design authority and the portal is the thing being converged onto them. Recording the incumbent would have canonised its drift — see "Known divergences" below, where the portal disagrees with this file in two measured places. **When this file and `portal/ui/` disagree, this file is right and the portal is behind.**

## Direction

**Blued steel.** A dark, cool, instrument-panel surface — deliberately distinct from the public site's violet-graphite (legal pages) and green-black (chronicle) while obviously the same house. The operator arrives knowing what they came to change; the interface is a workbench, not a brochure. Mode is **Operate**: scanability, consistency and the real usage scene outrank expression, and brand lives in precise details rather than in decoration.

## Palette

Colour carries **topic**; shape carries **state**. That separation is the portal's signature and it is load-bearing rather than stylistic — it means a bar's meaning survives being read in greyscale, and it is why the accent is a fill and never a text colour (a proven 4.58:1 floor with `#000` ink).

Five surfaces step from `--sunk` through `--desk`, `--paper`, `--raised` to `--rule`, each jump only a few points of lightness. Four ink tiers sit on them. Three signal colours (`--patch`, `--warn`, `--ok`) are the deliberate exception to the topic rule: they read as status regardless of topic. Four topic accents (`--draw`, `--ret`, `--ev`, `--play`) carry the season entities.

## Typography

Two families, split by kind rather than by hierarchy. `--ui` (IBM Plex Sans Condensed) for interface chrome; `--data` (IBM Plex Mono) for **every date, count, id and code**, so numerals align in columns. The mono assignment is a data-integrity decision, not a texture one.

## Shape carries state

- **solid fill** — live
- **hollow, dashed border** — staged
- **diagonal hatch** — conflict

Applied via a `--topic-accent` custom property set on the element, never via a colour class. A new state gets a new *shape*; a new entity gets a new *accent*.

## Depth and geometry

Borders-only, via `--rule`. No shadows: shadows do not read on dark, and mixing depth strategies is the failure this direction most wants to avoid. Radius is small throughout — the mockups use 2–5px with a `--rad` token — because a workbench control should read as machined, not soft.

## Motion

The mockups carry exactly **one** real transition — `filter .12s, box-shadow .12s` on an interactive bar — and otherwise set `transition:none!important` / `animation:none!important`.

⚠️ **That suppression is a MEASUREMENT ARTEFACT, not a design position.** Motion is disabled in the mockups so the overlay's pixel diff is deterministic at a frozen clock. The consequence is that the conformance instrument is structurally incapable of specifying, measuring, or rewarding motion — and would score an added transition as a regression. Motion is therefore **an open design question with no current owner**, to be answered in the post-conformance phase, not inferred from this file's near-silence.

## Spacing — deliberately absent, and this is the finding

**There is no spacing scale, in either the mockups or the portal, and none is invented here.** Measured across the six mockups 2026-08-30: **28 CSS custom properties, zero of them spacing**, and 19 distinct off-4px-grid values in padding/margin/gap — `9px` used 41 times, `11px` 31 times, plus 13/15/17/22/26/34/90px.

Recording an invented scale would have been the wrong move twice over: it would make an arbitrary set of numbers look decided, and snapping the portal onto a grid would move pixels and **raise** the conformance diff. Per Harkirat's decision 2026-08-30 11:46 EDT: **no action now; revisit once the portal is conformed to the mockups, since that is when redesign work resumes anyway.**

## Known divergences — the portal does not currently match this file

Both were found 2026-08-30 by comparing declared CSS properties between the mockups and `portal/ui/`, and **neither is visible to the overlay**, which reports 0.1–0.2% agreement across them. Filed in `docs/db-deferred-list.md`.

| Property | Mockups | `portal/ui/` |
|---|---|---|
| Hover transition | `filter .12s, box-shadow .12s` (2 of 6 files) | **zero `transition` declarations anywhere** |
| Ink tiers | `--ink` / `--ink2` / `--ink3` / **`--ink4`** (4 of 6 files) | three tiers; `--ink4` absent |
