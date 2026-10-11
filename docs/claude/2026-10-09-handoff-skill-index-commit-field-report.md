---
kind: record
status: frozen
---

# Field report: /workstyle:handoff, the index steps and the commit rule

Written 2026-10-09 22:16 EDT by the Session 4 lead (Diors-Builds, session 844943ce), for the session that maintains the workstyle plugin. Source: one real run of `/workstyle:handoff --quick` at 21:45 EDT on 2026-10-09, before a compact, and Harkirat's two replies at 22:11 EDT. Skill file as loaded: `/Users/harkirat/Library/Application Support/Claude/local-agent-mode-sessions/7c39a186-e0e5-4be5-9a59-67942c59222e/7e228f03-960d-496c-805b-48ac54f33726/rpm/plugin_012aFLbmpmuKjeaZjqqAn4P4/skills/handoff/SKILL.md`.

## Summary

| # | Flaw | Who caught it | Cost if missed |
|:-:|---|---|---|
| A | The quick tier skips re-indexing the handoff it just rewrote | Harkirat | the resumed session searches a stale copy of the handoff |
| B | Step 9 checks only the main repo's tracked code, so code in a gitignored or nested repo reads as "no code changed" | Harkirat | a false "skipped" line in the report; the next session has no code graph for the work |
| C | "Never commit" overrides the user's standing rule that branch commits are free, while the repo's own checker says a dirty tree does not survive a compact | Harkirat | the prep's own files sit uncommitted through the compact |
| D | The prep broke the repo's doc gate with files it wrote itself (the rotated archive, the new Current state) | me, from the checker | `npm test` red after a prep that is meant to change nothing but records |

## A · the quick tier skips the re-index

**The text.** The tier table: "Quick | 50k to 120k | steps 1 to 7, 9 and 13; it skips 8, 10, 11 and 12." Step 8 is the context-mode re-index.

**What happened.** The run replaced the whole `## Current state` block (about 100 lines) and rotated the log, then skipped step 8 because the tier said so. This repo resumes after a compact by `ctx_search` over the handoff's indexed parts (its standing rule, linksee anchor #84). Skipping the re-index leaves the index on the pre-prep text at exactly the moment the next session will query it.

**Cost of doing it.** Three `ctx_index` calls (handoff, rulings file, conventions file), measured: 188, 33 and 10 sections, under a second each. It is among the cheapest steps in the skill and among the most load-bearing after a compact.

**Proposal.** Re-index the handoff (and every file it lists under Read first that the prep changed) at every tier except urgent. If token cost is the worry, the call returns a one-line result.

## B · the code-graph step looks only at tracked code in one repo

**The text.** Step 9: "If this session changed tracked code (`git -C <path> diff --stat` against the Ground's sha, plus the commits since) and codebase-memory is present, query one changed symbol with `search_graph`."

**What happened.** The session's real work was the spec board, about a dozen JS modules in `local/pins2/s4/builder-2/`: a nested git repo inside a gitignored folder of the main repo. The handoff's Ground listed it on its own line (the skill asks for one Ground line per repo, "a nested repo included"), but step 9 measured only the main repo, whose diff since the last compact was docs. My final message then said: "this session changed no tracked code since the last compact, only docs". Harkirat: "huh wdym? you've literally been working on the spec-board this entire session tho?"

**What was true.** The code graph had never contained the spec board: `search_graph` for `makeOnBoard` (written Oct 8) returned 0 in the main repo's project, because codebase-memory skips gitignored paths. After `codebase-memory-mcp cli index_repository --repo_path <builder-2>`, `search_graph` in the new project `Applications-Claude-Code-Diors-Builds-local-pins2-s4-builder-2` found `makeCalls` (written today) at `spec-calls.js` 7–59.

**Proposal.**
1. Loop step 9 over every repo in Ground, not the cwd repo only: `git -C <each> diff --stat <ground sha>` and `git -C <each> log <ground sha>..HEAD`.
2. For each repo with code changes, find its codebase-memory project (`list_projects`, matching `root_path`). If none exists, index it as its own project; this repo's notes say the MCP `index_repository` tool fails here and the CLI form works (`~/.local/bin/codebase-memory-mcp cli index_repository --repo_path <path>`).
3. Prove it with `search_graph` on one changed symbol, in that project.
4. A skip line in the final message names each repo checked and why it was skipped. "No tracked code changed" was accurate for one repo and wrong for the work.

## C · "never commit" against the user's own rule

**The text.** Step 3: "**What it blocks on is reported, never acted on**, unless this repo's CLAUDE.md or rules say to act: a checker that says \"commit them\" is not an instruction to commit, and a prep never commits." And under Must not: "commit, push or upload anything, whatever the repo's checker says".

**What happened.** The repo's carrier check (`npm run handoff`) blocked on "3 uncommitted change(s) → commit them — a compact does not preserve a dirty tree." Harkirat's global working agreement says branch commits are free ("Branch commits and running the dev bot are free"; this repo's CLAUDE.md: "branch commits are the exceptions: free, no approval needed"). So step 3's own exception ("unless this repo's CLAUDE.md or rules say to act") was met, but the absolute Must not line overrode it and I reported "A prep doesn't commit". Harkirat: "why not? commits are free to you..." I committed after his reply (`5357eb2e`).

**The contradiction.** Step 3 allows acting when the repo's rules say so; Must not forbids it whatever the checker says. A model follows the stricter line.

**Proposal.** Replace both with one rule: commit the files the prep wrote (the handoff, its archive, the pointer list if tracked) on the current branch when the repo's rules or the user's working agreement make branch commits free and the branch is not the default branch; never push, never commit files the repo's rules forbid (here `.claude/settings.local.json`), never commit other work in the tree without saying so. Report the commit hash in the final message.

## D · the prep broke the doc gate with its own files

**What happened.** The carrier check also reported docs:audit errors and a prose-reflow failure. Both were the prep's own output:
- the new Current state named two files by their path from a subfolder (the pop-ups capture file and the ledger, written from inside the Builder-2 folder rather than from the repo root), which this repo's cross-reference check reads as missing; the skill's template invites short paths;
- `context.mjs rotate` wrote the archive without the YAML front matter every tracked doc here must carry (`kind:` / `status:`), so it would fail the audit once tracked;
- one line of the rewritten handoff needed the repo's soft-wrap reflow.

I fixed all three by hand, since they were files the prep may edit.

**Proposal.**
1. `rotate` copies the handoff's front matter block to the archive (with `status: frozen` when the source has `status:`).
2. After writing, the skill runs the repo's own doc gate on the files it wrote, when the repo has one (here `npm run docs:audit` and `node scripts/reflow-prose.mjs`), and fixes what is its own.
3. The template says: name files by their path from the repo root.

## Not the skill's fault

- I chose a 4-thought pass for a quick prep. It found D only because I printed the checker's full output instead of its summary line; the skill could say so: "read the checker's full blocking list; its summary line counts, it does not explain."
- The false line in B was my wording; step 9's framing ("tracked code") made it easy to write.

## Evidence

| Item | Value |
|---|---|
| The prep's commit, after his reply | `5357eb2e` (handoff, archive, `.claude/hooks/self-check.sh` comment reflow; self-test 62 passed) |
| `search_graph makeOnBoard`, main repo project | 0 results |
| `search_graph makeCalls`, Builder-2 project after indexing | 1 result, `spec-calls.js` 7–59 |
| Re-index sizes | handoff 188 sections · rulings 33 · conventions 10 |
| Checker's blocking list before the fixes | docs:audit 2 errors (both xref on relative paths) · prose reflow (the handoff) · comment reflow (`self-check.sh`, mine from an earlier commit) · 3 uncommitted |
