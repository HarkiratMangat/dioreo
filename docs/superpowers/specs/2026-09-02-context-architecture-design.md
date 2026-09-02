---
kind: spec
status: frozen
---

# Context architecture — what is injected, what is queryable

*Written 2026-09-02 15:58 EDT. Frozen: this is a snapshot of what was decided and why, not a live document.*

## The problem, measured rather than assumed

Two questions started this: how Claude Code's memory system actually works, and whether the timestamp hook's auto-correction generalises. Both sat on one condition — **four capability layers reported healthy while being partly or wholly unusable**, and the only reason any of it was known is that a session looked.

| Layer | Reported | Actually |
|---|---|---|
| `MEMORY.md` | a hook said `ok — 35147B/40000B` | the loader cut it at line 127; **58 lines never loaded**, including the whole "Working with Harkirat" section |
| the `@`-import meant to fix that | present in `CLAUDE.md` | never ran — it sat inside the YAML frontmatter, then used a `~` the docs do not sanction |
| `.claude/rules/` | "you don't pay for it otherwise" | **651,223 B**, injected in full on a matching read, median 72,420 B and worst 187,237 B, with no budget and no gate |
| `linksee` | a confident counts line every session | the counts came from the sqlite file; the SERVER was intermittently refusing connections |

## The distinction that organises everything

Not "shrink the index". The useful division is **whether you can opt out**:

| Tier | What | Cost | Needs |
|---|---|---|---|
| **INJECTED** | root + global `CLAUDE.md` · the loaded slice of `MEMORY.md` · `SESSION-START.md` · a path-scoped rule on a matching read · per-prompt hook output | paid whether or not you use it | **a budget** |
| **QUERYABLE** | memory topic files · `docs/` · the same rules, indexed | paid only when you ask | **routing** |

> **Move content from INJECTED to QUERYABLE, and route to QUERYABLE.**

The queryable tier already existed and was already maintained — `.claude/hooks/ctx-index-refresh.sh` indexes `docs/`, `.claude/rules/`, `CLAUDE.md` and the memory store, refreshed before every `ctx_search`. So nothing had to be deleted; content **relocated across a boundary that already worked**.

## Sorting rule — four kinds, one home each

| Kind | Test | Home |
|---|---|---|
| **Invariant** | true before any action, one or two sentences | root `CLAUDE.md` — injected, budgeted |
| **Procedure** | multi-step, needed only while doing that task | a skill |
| **Local trap** | only matters once you are in the file | a path-scoped rule — small |
| **History / rationale** | the incident, the date, the argument, the superseded values | `DEVLOG` / a dated spec / a topic file — **queryable, never injected** |

Kind 4 had colonised kinds 1–3. `accent-and-colors.md` was 144,650 B and 82% of it was an encyclopedia; `SILENT MODE` — an instruction the user wrote — was living in auto memory, which is for what Claude writes about the user.

## What was measured, and how

`.claude/hooks/instructions-loaded-audit.sh` was built to answer three questions nobody could answer by reading. It listens on `InstructionsLoaded`, which fires when a `CLAUDE.md` or `.claude/rules/*.md` enters context, carrying `load_reason` and `trigger_file_path`.

| Probe | Result |
|---|---|
| `Read` of a matching file (positive control) | **fires** — `path_glob_match`, whole rule, trigger named |
| `rg` over the same file | no load |
| a `python3` heredoc **reading** a matching file | no load |
| a `python3` heredoc **writing** a matching file | no load |
| `Read` with `limit: 12` | injects the **entire** rule — cost is not proportional to the read |
| a second file matching an already-loaded rule | no reload — **once per session** |

**So the workflow this repo mandates bypasses the rules layer entirely.** The batching contract routes every multi-file edit through a `python3` heredoc and the routing rules push reads through `rg` and `ctx_execute_file`; rules fire only on the tools that guidance treats as fallbacks.

⚠️ An empty log is ambiguous — it means "did not fire" or "the hook never ran". Every measurement run needs a positive control in the same session, and the instrument says so in its own `--report`.

## Decisions

1. **Gate both platform limits, at the platform's own numbers.** The loader takes the first 200 lines OR 25,000 B, whichever comes first, and the hook had only ever counted bytes across six locally-invented values. Both are gated now, each with an advisory tier. The budget is 25,000 because that is the number that actually truncates — the first value here that is not a housekeeping choice.
2. **Shrink the index rather than route around it.** The ceiling is a forcing function with an error attached; the import removed the pressure that keeps the file short. `SILENT MODE` moved to an unconditional rule (an instruction belongs in the instruction tier) and 79 over-long index-line tails moved into the topic files they point at. 35,147 B / 185 lines → ~22,000 B / 151. **Nothing was deleted.** The import was then removed on its own stated condition.
3. **A ratchet on `.claude/rules/`, not a ceiling.** A hard ceiling fails four files on arrival and a gate that fails on arrival gets switched off. Every rule is pinned at its current bytes and may only shrink; a NEW rule must meet 30,000 B, which 14 of the 20 already do.
4. **Promote a gate to auto-correcting only when it knows the ONE right value.** `updatedInput` on `PreToolUse` finishes the job where a deny hands it back. The timestamp autofix reaches heredocs now; `rg -rn` is corrected because a cluster has one reading, while a lone `-r` stays advisory because it is a legitimate `--replace`; `--delete-branch` is appended before the merge instead of lamented after it. **`typos-check` was considered and excluded** — a typo has more than one plausible correction, and a silent wrong substitution is worse than a refusal.

## Corrections to this document's own first draft

- The 200-line limit was expected to bind. **Bytes bound**, at line 127.
- `.claude/rules/` was suspected of being a Cursor convention. **It is native**, confirmed documentarily and by probe.
- The always-on files were expected to duplicate each other. **They do not** — 2 shared sentences, 152 B.
- Per-turn hook injection was expected to dominate. `usage-guard.mjs` emits **0 bytes** on a benign call.
- "Rewriting a Bash command is unsafe" was accepted from `CLAUDE.md`. **False** — `rtk` has done it via `updatedInput` on every Bash call for months.
- `FileChanged` was proposed to cover the heredoc blind spot. **It cannot** — its matcher registers literal filenames in the working directory, not globs.
- A confident root cause was written for Context7 from a clean correlation (`enabledMcpServers`). **Refuted within the hour**: the connector was live throughout and its tools simply surface late. Its tools are namespaced by an opaque UUID, so presence must be probed by tool name, never server name.

## Still open

`legal-site.md`, `scripts-and-migrations.md` and three smaller rules remain over the 30,000 B line, pinned by the ratchet and named in its warnings. Five hooks remain registered on `Edit|Write` only. Both are filed in `docs/db-deferred-list.md` with a Do and a Verify.
