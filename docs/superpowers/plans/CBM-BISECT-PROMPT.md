---
kind: plan
status: live
---

# Handoff — codebase-memory's unlinked callers: bisect the repo

> 🔴 **IF YOU WERE HANDED A SHORT OPENER, IT IS NOT A SUMMARY OF THIS FILE.** Only this file carries the four causes already ruled out (so you do not re-run them), the Cypher trap that silently emptied an experiment, and the rule to index scratch copies under their own project name and delete them after.

*Produced 2026-09-14 23:43 EDT with linksee's `entity-handoff` MCP prompt, whose body is cached at `~/.claude/linksee-mcp-prompts.md` and indexed as `vendor:linksee-prompts` (`/linksee:*` does not route in Claude Code). One deliberate deviation: its Step 1 recalls by `entity_name`, which under-returns silently in this repo, so the recall ran by `query` on the bisect topic with `max_tokens: 6000`. Deferred-list entry: `docs/db-deferred-list.md` → **WHY CODEBASE-MEMORY LEAVES 9 OF 10 FILES CALLING `mentionCommand` UNLINKED**.*

## Identity
- **Name:** codebase-memory-mcp's call graph for Diors-Builds · **kind:** tool behaviour, project-scoped · **canonical key:** project `Applications-Claude-Code-Diors-Builds`, binary `~/.local/bin/codebase-memory-mcp` 0.10.8, full index mode, scope set by the tracked `.cbmignore`.

## Goal
Name the trigger that makes codebase-memory record no `CALLS` edge from 9 of the 10 files that call `utils/commandMentions.js`'s `mentionCommand` (and from any file for `fetchWithTimeout`), with a repro that links the callers when the trigger is removed and unlinks them when it is restored. Then either open an upstream issue with a minimal repro or add it as a comment on #1248.

## State
- **Measured:** `trace_path` links `mentionCommand` only from `commands/help.js`; `search_code` finds all 10 calling files. Full record: `docs/reference/tool-capability-tests.md` § codebase-memory-mcp 0.10.8 → *Why the graph and grep disagree*.
- **Ruled out, each by a test that could have failed:**
  - **The slash-string argument.** The tool's `detect_url_in_args` in `src/pipeline/pass_parallel.c` adds its fake `Route` edge after the normal `CALLS` edge is emitted.
  - **Repo size and the parallel indexer.** The same four real files (`commandMentions.js`, `invite.js`, `calendar.js`, `help.js`) link all 7 callers in a 4-file and a 64-file scratch repo.
  - **Stale index state.** A delete-and-rebuild changed nothing.
  - **Single-threaded indexing** (`CBM_INDEX_SINGLE_THREAD=1`). No change, but the variable may not reach the daemon-supervised worker.
- **Not done:** bisecting the full repository.

## Caveats
- **Never trust `trace_path` or the dead-code filter alone here:** add `search_code` for the name [memory:49620].
- **Pass `include_tests: true`,** or test-file callers vanish by design [memory:49619].
- **Never conclude the graph is empty from `list_projects` alone:** a corrupt index returns `[]` with a friendly hint [memory:16521]. Confirm with `index_status` and one real query first.
- **Never query with `type(r)` inside `WHERE`:** it is unsupported, and a filtered pipe hides the error, which silently emptied one experiment this session. Use `[:CALLS]` patterns, and `type(r)` only in `RETURN`.
- **Never pass a JSON array to a CLI array flag** (`--semantic-query '["a","b"]'`): upstream #2150 stores it as one string. Use the MCP tool, or repeat the flag.
- **Never index scratch copies under the repo's project name:** pass `--name`, and `delete_project` each copy afterwards.

## Open questions
- Does removing one top-level directory (`portal/`, `scripts/`, `.claude/`, `docs/`) restore the callers, or does the trigger need two directories together?
- Is it a name collision in the resolver's registry? `scripts/fixtures/captureHelpSnapshot.mjs` also mentions `mentionCommand`.
- Does `fetchWithTimeout`'s zero-caller result share the trigger, or is it separate?

## Suggested next steps
1. Copy the repo to the scratchpad (`git worktree add` or `git archive | tar -x`), index it with `cli index_repository --repo_path <copy> --name bisect-full`, and confirm the baseline: `MATCH (f)-[:CALLS]->(t) WHERE t.name = 'mentionCommand' RETURN DISTINCT f.file_path` returns only `commands/help.js`.
2. Remove one top-level directory per round, re-index under a new `--name`, re-run the query, and delete the project. Halve whatever still reproduces until one file or one construct remains.
3. With the trigger named, write the two-state repro, record the result in the capability record and the deferred entry, and put the upstream issue or #1248 comment to Harkirat in a popup; filing is outward and his call.

## Paste to start the session

```text
/rename Opus5-High · CBM caller bisect · <Mon DD>
Premise High · Delib Medium -> Opus5-High

Read docs/superpowers/plans/CBM-BISECT-PROMPT.md in full, then the deferred-list entry it names and the "Why the graph and grep disagree" section of docs/reference/tool-capability-tests.md. Run the three suggested next steps. Work on scratch copies only, and delete every scratch project you index. Do not change the repo's own index, .cbmignore or code. Record the result in the capability record and the deferred entry, commit on a branch, and ask me before any push or upstream issue.
```
