---
kind: record
status: live
---

# Compact prep 19 — Version 40 built and published (Version 41), Version 41's intake built locally

*Written 2026-09-29 18:24 EDT, at his "prep compact". This session, after compact 18 on Opus 5.5, built his Version 40 round, published it, then logged and built his Version 41 round.*

## Where it stands

| | |
|---|---|
| Board 4: Collective | artifact `FCAFvDXrKQN28SotQLJhTh`, **Version 41** live (the Version 40 round, published 2026-09-29 16:48 EDT on his "publish") |
| Kit | `docs/pins2/kit/` also holds his **Version 41 round, built, not published** (classes V–AH) |
| Branch | `feat/portal-pins2-manifests`, **nothing pushed**; this session's commits `15644cf6` → `f6584988` |
| Kit graph | codebase-memory project `Applications-Claude-Code-Diors-Builds-docs-pins2-kit` (his 17:51 EDT "index it"); re-index it after kit edits with `~/.local/bin/codebase-memory-mcp cli index_repository --repo_path "<repo>/docs/pins2/kit"` |
| Instruments | r22 35/35 (its one-build flow repaired, a no-scroll check added); counts-check 13/13 (its intake-index window bounded); paths-resolve 0 dead; cites-check 0 fatal |

## His words this session

- 13:04 EDT, the start prompt: build the Version 40 round, class by class, nothing published without his yes.
- During the build: "Keep them" (Starts/Ends Optional chips) · "#2 bare glyph" then "when hovered, show #1's resting box" · "i only asked for the tile's get get the more prominant color, i didn't ask for them to get the upper border treatment" · "improve the design of these chips."
- 16:48 EDT: "publish" → Version 41.
- 16:58 EDT: "ready for intake of v41?" → 17:47 EDT his batch of fifteen asks and ten shots, "that's it for the intake items … finish all of them before we compact."
- 17:49 EDT: "correct your tool routing and silent-mode working style. you're drifting!" · 17:51 EDT: "then index it into codebase-memory" · 17:54 EDT: the ctx_batch_execute search "could have just made that entire search directly with codebase-memory".

## Next

1. His review of the Version 41 round on the local kit (`localhost:8900/docs/pins2/kit/board4.html`, the `repo-static` preview). Publish it as Version 42 only on his word; publish the page plus the changed kit files (`docs/pins2/kit/README.md` § Publish), then check the artifact's file listing against the local byte sizes.
2. His open question: an "Export these" button at Compare's top-right (offered, not built).
3. Then his order of 2026-09-27: (6) finish the spec and docs for Sessions 4 and 5 (board4-spec/, FINAL.md, the batch-2 plan).
4. A push carries `docs/pins2/kit/` to the online GitHub, which he said on 2026-09-20 he did not want: ask at the push.

## Lessons paid for (linksee caveats written)

- A flow that clicks must assert a state that is false before the click (r22's one-build flow clicked a removed element and still passed).
- A counting window ends at its own table (counts-check read the intake index to end of file).
- A fade container's mask hides everything outside its box: a pop-up inside a `.b3-fadx` run was cut by the mask, not by overflow.
- Kit code questions go to the kit's codebase-memory graph (`search_code` with `context` / `mode: full`, `get_code_snippet`), never rg/sed/awk, never wrapped in ctx_batch_execute.
