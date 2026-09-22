---
kind: reference
status: live
---

# The final design — portal pins batch 2, all three boards in one place

*Compiled 2026-09-21 10:59 EDT, at the end of Session 3, after Harkirat asked: "what did board 1 redesign or tweak or fix? what did board 2 …? and what did board 3 …? because they're compounding changing, right?" **Sessions 4 and 5 open this file first.** Every other spec is an appendix it points into.*

## ★ Board 4: Collective supersedes the three-board reading below — 2026-09-21 12:27 EDT

Harkirat's direction: compile every finished surface of boards 1, 2 and 3 onto **one board he checks and clicks through**, and port from that. It lives in the kit as `local/pins2-board-3/redo/board4.html` (`gates4/main.js`, `gates4/surfaces.js`): nine surfaces in board 2's gate presentation — each surface alone, a state switch in its head, its boards and anything still open in its notes. **Once he signs it off, it is the design; the tables below become the record of how it was assembled.** Then Session 4 standardizes in its own artifact and **Board 4: Final** (a new artifact) supersedes the Collective, with the standard tokens applied — Session 5 ports that one board. Every element the portal renders is accounted for by `npm run portal:census` and `portal:census:check` (plan §5c Step 4f), so a hand-written copy cannot be skipped.

**State at 2026-09-21 13:39 EDT.** Every surface is on the board and measured against the board that drew it (`docs/claude/pins2/instruments/b4parity.cjs`, element by element; captures by `pairs.cjs`). Compare matches board 1 in all four states; the post drawer and New build differ from board 1 only in sample data, in board 3's own rules (lineage: the later board's rule wins) and in board 3's button family (his yes). The Broadcast manifest carries board 2's heads and row hover. **One cause sat under several defects:** both boards named their classes `pb-*`, and 35 of board 2's selector parts reached board 1's markup — a 26px toolbar, a Compare that could not scroll sideways — so `b2.css` now fences them off with a zero-specificity guard. **The spec is [`board4-spec/`](board4-spec/README.md)** — regenerated 2026-09-21 15:30 EDT after the nitpick pass: 868 looks across 443 signatures, 14 classed signatures in stages no pass reached, 10 winning declarations the computed value contradicts (⚠️ in the tables), 0 page errors. *(This line said 879 / 489 / 0 unreached at 13:39 EDT; that was the pre-round-1 board, and the README had already reported 14 unreached since.)* What is still his to rule is listed under each surface on the board.

**Published 2026-09-21 13:47 EDT** at his popup yes of 13:39 EDT: Board 4: Collective v1, https://claude.ai/artifact/FCAFvDXrKQN28SotQLJhTh — a NEW artifact; 3-E untouched. It is republished only from `local/pins2-board-3/redo/board4.html` in the session that published it, or with this URL.

**Nitpick pass (2026-09-21 15:30 EDT, local, not yet republished)**: Compare's cut builds, the post drawer's field spacing, the build toggles' hover, Export's three states, five dead Try buttons and the test-data prefix — itemised in `docs/claude/pins2/handoffs/2026-09-21-pins2-s3-board4-round1.md`.

**His intake round (2026-09-21 20:00 EDT):** Board 4 **v5** is live (the Export stage, corners and Compare cards fixed at 17:30 EDT). His gate-by-gate intake of C1–C9 is logged verbatim in `docs/claude/pins2/handoffs/2026-09-21-board4-intake.md`; the fix is organised by class in `docs/claude/pins2/handoffs/2026-09-21-board4-fixplan.md` (pass 1 is built locally and unpublished; passes 2 and 3 are next). This board is not signed off until that pass is published and he reviews it.

**Round 1 of his review (2026-09-21 14:50 EDT)**: whole-realm renders replaced by the surface alone; command search removed (its ranking is its own session); the build and post drawers in the Export picker's shell and mesh ground, with board 3's buttons and no eyebrow; the bulk editor on the export file's line style, caret aligned; Repairs' clean day restored as a state.

## 0 · What "done" means

> *"What i see in these boards is what i expect to see exactly in the portal."*
>
> *"The final product in the portal should be the CORRECT, non-buggy versions of the finalized designs."* — Harkirat, 2026-09-21 10:53 EDT

The three boards were one piece of work split into sittings. Each built on what the one before it shipped, so a surface can carry decisions from two boards at once. **The portal code that Session 2 wrote is never an authority.** It was a port, and by his estimate from looking at it, board 1's drawers came across about 20–30% right, board 2's gates about 80–95%, and board 2's Armory manifest about 95%. Session 5 builds the boards, not the port.

## 1 · Which value wins — decided by where the value came from, not by which board is newest

| A value that comes from… | Is it the design? |
|---|---|
| A board's own stylesheet — board 1's page, board 2's page or `b2.css`, board 3's `b3/board.css` and `gates.css` | **Yes.** On a surface two boards drew, the later board's own rule wins, because he changed it there on purpose |
| A line Session 2 wrote in `portal/ui/app.css` (commits `06acb2f1..219dc509`) | **No.** It is the port. The board that designed that element wins. Board 3 shows these values because its kit runs Session 2's code; that does not make them board-3 decisions |
| A portal rule older than Session 2, on an element no board styled | **Keep it.** Nothing asked for a change |
| Session 4's standardization (`handoff-3e.md` §10, plan §10.6) | **Yes, and it wins over all of the above** for the element it names |

[`lineage.md`](lineage.md) applies this rule value by value to the three board-3 surfaces that board 2 drew first. It sets aside what cannot be a design difference: gate widths, browser defaults, elements board 2 never styled, and per-row colours. After that, **three values remain on the Armory manifest where Session 2's port lost board 2's design, now confirmed** (2026-09-21 11:11 EDT: both boards captured and read side by side, the port lines traced with `git blame` to commit `c7973c25`, nothing in this session's transcript changing them): **the build number's weight** (700 on board 2 — plan §10.4 G4 row 4, *display face*; the port set 500, and it reads visibly thinner), **its tabular figures**, and **the gap on the weapon line** (10px on board 2; the port's `gap:var(--s3)` is 12). **Restored on board 3 itself** (2026-09-21 11:13 EDT, kit commit `1a93155`, `b3/board.css` ROUND 12), so the board, its regenerated spec and the portal now agree — `lineage.md` re-run shows none left. A fourth, the sort button's `display` (`flex` vs `inline-flex`), comes from the parent's layout and draws the same. **What it cannot see:** a port loss in markup or behaviour rather than CSS, and elements it could not pair by class (listed under each surface in `lineage.md`) — those close on the comparator in §3 step 5.

## 2 · Every surface, and where its final design lives

| Surface | Drawn on | Changed later on | Structure (what to build) | Values (how it looks) | Session 5 does |
|---|---|---|---|---|---|
| **New Build drawer**, Add build + Bulk create, MP + DMZ | board 1 · G9 | no board after it; the button family is Session 4's (E1–E2) | [`../2026-09-14-pins2-board/handoff-g9-g8.md`](../2026-09-14-pins2-board/handoff-g9-g8.md) · plan §10.1 | [`../2026-09-14-pins2-board/resolved-spec-full.md`](../2026-09-14-pins2-board/resolved-spec-full.md) (every state: DMZ, Bulk create, existing image key) | **Rebuild it from board 1.** The port is 20–30% right and structurally different (pin 2) |
| **Compare panel** | board 1 · G10 | — | plan §10.2 · board 1's `index.html` lines 517–600 | board 1 `resolved-spec-full.md` § G10 — **the first value spec it has ever had** | Rebuild from board 1. **Nobody has ever compared what Session 2 built against board 1**, and no pin names it |
| **Post / Edit an announcement drawer** | board 1 · G8 | — | `handoff-g9-g8.md` · plan §10.3 | board 1 `resolved-spec-full.md` § G8, including the bad-link state | Rebuild from board 1 (pin 48) |
| **Armory manifest** (rows, tools row, fold, code field, problem mark) | board 2 · G4 | **board 3 · M1**: selection bar, selection list (his 35 saved spacings), problem card, hazard edge, checkbox, badges, the button family | [`../2026-09-15-pins2-board-3/handoff-3e.md`](../2026-09-15-pins2-board-3/handoff-3e.md) §1 M1 · plan §10.4 G4 · [`port-g4-g3-g11.md`](../2026-09-14-pins2-board-2/port-g4-g3-g11.md) | board 3 `3e/resolved-spec/M1-armory-manifest.md` for what board 3 changed; **[`lineage.md`](lineage.md) § M1 for the five candidate port losses, where board 2's value wins once confirmed** | Correct the port: apply board 3's rules and board 2's lost values |
| **Build name** (display label, 32-character cap) | board 2 · G6 | — | plan §10.4 G6 | board 2 `resolved-spec-full.md` § G6 | Close against board 2 |
| **Broadcast manifest** | board 2 · G11 | the button family (Session 4) | plan §10.4 G11 · `port-g4-g3-g11.md` (pins 44, 45, 50; G11 is a grid on the board and a real `<table>` in the portal) | board 2 `resolved-spec-full.md` § G11 | Correct the port against board 2 |
| **History manifest** | board 2 · G11 (level chips) | **board 3 · H1** — redrawn: time rail, his 18 spacing values, toolbar | `handoff-3e.md` §1 H1, §6 | board 3 `3e/resolved-spec/H1-history.md` · `lineage.md` § H1 for the shared tools row | Build board 3's design. Board 2's chips are superseded except where `lineage.md` says otherwise |
| **Announcement card → delivery-queue card** | board 2 · G3 | **board 3 · B1** (never-ends warning on the card) | `handoff-3e.md` §1 B1 · `port-g4-g3-g11.md` | board 3 `3e/resolved-spec/B1-delivery-queue.md` (mostly board 2's own `b2.css`) · `lineage.md` § B1 | Build board 3's |
| **Admin traffic** filter | board 2 · G2 | — | plan §10.4 G2 | board 2 `resolved-spec-full.md` § G2 | Close against board 2 |
| **Small text** (hints, captions) | board 2 · G1 | **Session 4** owns the design (board 3's `p10`) and the rewrites | plan §10.4 G1, §10.6 | — until Session 4 writes it | Session 4's table |
| **Repairs** | board 3 · M2 | — | `handoff-3e.md` §1 M2 | board 3 `3e/resolved-spec/M2-repairs.md` | Build board 3's |
| **Export** | board 3 · M3 | — | `handoff-3e.md` §1 M3 | board 3 `3e/resolved-spec/M3-export.md` | Build board 3's |
| **Command search** | board 3 · P7 | — (its result ranking is a separate, later session) | `handoff-3e.md` §1 P7 | board 3 `3e/resolved-spec/P7-command-search.md` | Build board 3's look |
| **Shared elements** — buttons, icon buttons, corner radius, headings and labels, pills, small-text containers (E1–E6) | spread across all three boards | **Session 4** standardizes them | plan §5c, §10.6 | Session 4's table | Build Session 4's table first; every surface above then uses it |

## 3 · The order Session 5 builds in

1. **Session 4's shared elements and tokens** (plan §10.6, `handoff-3e.md` §10). They sit under every surface, so they go first.
2. **Board 1's three surfaces, rebuilt from board 1**: the structure from `handoff-g9-g8.md`, the values from `resolved-spec-full.md`.
3. **Board 2's surfaces that no later board touched** (build name, Broadcast manifest, admin traffic), corrected against board 2.
4. **Board 3's surfaces**, from `handoff-3e.md` and `3e/`, with **[`lineage.md`](lineage.md)'s board-2 values restored** where the port lost them.
5. **Close each element by comparing it with the board that owns it** (`portalProbe`, plan §5d Step 8). Rebuild `portal/public/app.css` before every probe.

## 4 · When something is ambiguous

- **A board-3 decision:** Session 3's full conversation is `~/.claude/projects/-Applications-Claude-Code-Diors-Builds/f61cc326-e8ef-4206-bcb9-ad3bcbded968.jsonl` — one session, several compacts. His words are there with timestamps. Harkirat, 2026-09-21 10:55 EDT: *"any discussions/ambiguity for board 3's decisions can likely be resolved by pulling out of this session's transcript."* The round-by-round record is `../2026-09-15-pins2-board-3/README.md`; the ruled forks are `handoff-3e.md` §4.
- **A board-1 or board-2 decision:** plan §10.1–§10.4 quote his comments with times.
- **Still unclear:** ask him with a popup. Never pick the port's value because it is the one in the code.

## 5 · Keeping this true

- **Board 3's design CODE lives only on this Mac**, in `local/pins2-board-3/redo/` with its own local git (`../2026-09-15-pins2-board-3/3e/KIT-GIT.md`) — his choice: never GitHub. Sessions 4 and 5 therefore run here. Serve it with `.claude/launch.json` → `repo-static` (port 8900) and open `board3e.html`. `3e/` carries everything derived from it, but the export picker, the problem card, the badges and the History rail are ~2,000 lines of design code in `b3/` and `gates/` that Session 5 ports as code (`3e/file-map.md` labels each file).

- **Boards 1 and 2 are frozen** on the stylesheet he approved them on (`../2026-09-14-pins2-board/app.css`). Never point them back at `portal/public/app.css`: the port would leak into the spec.
- **Regenerate after any change to a board:** board 3's kit → `3e/switches.cjs → 3e/overrides.cjs → 3e/extract-spec.cjs → 3e/split-spec.cjs → 3e/measure.cjs`. Boards 1 and 2 → `BOARD=1|2 node ../2026-09-15-pins2-board-3/3e/extract-spec.cjs '' <board>/resolved-spec-full.md`. Then `node lineage.cjs`.
- **Session 4 adds a row to `handoff-3e.md` §10 for every decision that changes a surface above**, on any board, and updates this table if a surface's owner changes.
