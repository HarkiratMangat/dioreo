---
kind: reference
status: live
---

# Tool capability tests

**Started 2026-07-25 00:30 EDT** at Harkirat's direction: *"do some tool tests to learn them or see if they're working or figure out which ones might be useful."* Results are **tested, not assumed**. Update this file when a tool is newly tested or its status changes.

## ⚠️ The flawed criterion that caused this
I had disabled plugins using "never invoked" as evidence of uselessness. **That is circular** — they were never invoked because I never considered them. Harkirat: *"sounds like something for us, no? Yet it was sidelined just because it wasn't auto triggered or manually considered by you."* He is right, and the cost data agrees: **all skills + agents combined are 14.4k of a 321k window — 4.5%.** Plugin pruning was optimising the wrong thing. **Standing rule: default plugins ON. Disable only on demonstrated uselessness (tested), never on absence-of-use.** Only `cloudinary`, `firecrawl`, `mongodb` stay off — genuinely redundant (direct API / `mongosh` + URI already available). All 23 others re-enabled 2026-07-25 00:25 EDT.

## `codebase-index` — ⚠️ PARTIALLY UNUSABLE on this codebase (tested 2026-07-25 00:35 EDT)
**It is a Python-oriented tool.** The package ships only `python_annotator.py`; symbol extraction is `ast.parse()`. There is **no JS/TS annotator**. Evidence: it rendered a JavaScript function as `def buildSyntheticInteraction(interaction, overrides)` — Python formatting applied to JS.

| Tool | On this JS repo |
|---|---|
| `find_symbol` | ✅ works — found `buildSyntheticInteraction` at `index.js:81` with source preview, ~350 tokens vs reading all of `index.js` ⚠️ **that PATH is now stale** — the symbol moved to `utils/interactionContext.js` in the 2026-08-13 17:20 EDT split, and `index.js` is 129 lines. The finding (the tool works, and cheaply) stands; the coordinates in this file are a record of what it returned on the day, not a live index |
| `search_codebase` | ✅ works (regex over indexed files) |
| `get_dependents` | ❌ `"not found in reverse dependency graph"` — on a symbol `find_symbol` had just located |
| `get_change_impact` | ❌ same failure |
| `get_call_chain` / `get_dependencies` | ❌ same root cause (graph built from Python AST only) |
| `get_project_summary` | ⚠️ **returns 103,094 chars ≈ 26k tokens** — never call it; it is a token bomb |

**Verdict:** its headline value (AST symbol maps, call graphs, change impact) **does not exist for JavaScript**. What does work — symbol lookup and regex — `rg` already does. Do not route structure/caller/impact questions here expecting them to resolve. Re-evaluate only if JS support lands.

**REPLACED 2026-07-25 01:05 EDT** by `codebase-memory-mcp` (below), at Harkirat's direction. Removed from the project's `mcpServers` in `~/.claude.json`. The `PROJECT_ROOT` fix noted below is therefore moot, kept only as the record of what was wrong.

**Superseded bug (was FIXED 2026-07-25 00:33 EDT):** it was indexing the **wrong root** — `Project: /Applications/Claude Code` (the parent), 4,131 files / 868,277 lines / 20,978 functions, sweeping in `.remember`, `local/`, and unrelated projects. The actual repo is **55** JS/JSON files — a ~75× over-index. Cause: `server.py:221`, `os.environ.get("PROJECT_ROOT", os.getcwd())`, and the server's cwd was the parent. Fixed by adding `"env": {"PROJECT_ROOT": "/Applications/Claude Code/Diors-Builds"}` to its entry in `~/.claude.json`. **Takes effect on next session restart.**

## `codebase-memory-mcp` — ✅ MOSTLY WORKS, replaced codebase-index (tested 2026-07-25 01:05 EDT)
v0.9.0, MIT, `DeusData/codebase-memory-mcp`. tree-sitter AST over 158 languages with Hybrid LSP for **JS/TS/JSX/TSX** — the gap codebase-index could not fill. Installed via **`npm install -g`, deliberately NOT the `curl | bash` one-liner**: piping a remote script into a shell is off-limits, and their installer auto-rewrites agent config files. Audited `install.js` first — downloads only from the project's own GitHub releases, **verifies checksums**, touches no agent config. Registered manually as a project MCP.

| Capability | Result on this JS repo |
|---|---|
| `index_repository` | ✅ **1,041 nodes / 1,951 edges**; auto-excluded `node_modules`, `.git`, `.claude`, `.remember`, `local`, `.superpowers` |
| `search_graph` | ✅ found `buildSyntheticInteraction` (index.js:81-86) **and `sendV2Payload` (utils/sendV2Payload.js:12-44) — which codebase-index could not find at all** |
| `get_graph_schema` | ✅ 9 node labels, 12 edge types incl. **CALLS(479)**, IMPORTS, SEMANTICALLY_RELATED, FILE_CHANGES_WITH(103) |
| Function metrics | ✅ real JS-aware properties: `complexity`, `cognitive`, `loop_depth`, `recursive`, `is_entry_point`, `is_exported`, `param_names` |
| **`trace_path`** | ✅ **WORKS — verified accurate twice** (see below) |
| `search_graph` degree filters / dead-code | ❌ **unreliable — do not trust** (see below) |
| `query_graph` (Cypher) | ⚠️ my raw Cypher returned 0 rows and `ORDER BY` didn't sort; prefer `trace_path`/`search_graph`, use Cypher only per the skill's examples |

### ✅ `trace_path` VERIFIED ACCURATE 2026-07-25 01:40 EDT — earlier "broken" claim was MY error
**I had passed `direction="upstream"/"downstream"`. The valid values are `inbound`/`outbound`/`both`.** The empty results were a bad argument, not a broken tool. **I only found this by reading the bundled `codebase-memory` skill — which documents the exact parameters and Cypher examples — instead of guessing at the API again.** Same lesson as `read_smart` and `hookify`: read what's installed first.

Cross-checked against `rg` ground truth, twice:
- `sendV2Payload` → returned **18 callers across 13 files**; `rg` found the same **13/13 code files**, zero false negatives, and trace_path added *function-level* granularity + hop distance + risk labels that `rg` cannot give. ~600 tokens vs a grep plus a dozen file reads.
- `buildGlobalNavRow` → returned 9 nodes across draws/seasonend/calendar/drawprices/patchnotes; `rg` confirms exactly those files.

### ❌ `search_graph` degree filters are WRONG — dead-code detection unusable here
`search_graph(max_degree=0, exclude_entry_points=true)` claimed **24 dead functions**. Verified the first two — **both false positives**: `getRecentAlerts` is called at `commands/alerts.js:118`, and `buildGlobalNavRow` is called in 5+ command files. Both were reported with `in_degree: 0` **even though `trace_path` finds their callers correctly** — so the degree metric disagrees with the graph it is computed from. Most of the rest are discord.js interaction stubs (`deferReply`, `getString`, …) picked up from the synthetic-interaction object literal at `index.js:945`, not real functions. **Never report dead code from this tool without `rg` verification.** Also note `search_graph` returns very large per-node payloads (every metric + fingerprints) — always pass `limit`.

**Verdict: the swap was correct.** codebase-memory-mcp does on JavaScript what codebase-index structurally could not: real call chains, verified accurate. Use `trace_path` for callers/callees; use `rg` to confirm anything before acting on it; ignore the dead-code feature.

## ⚠️ ZERO invocations across an entire session despite being named PRIMARY — 2026-08-20 14:53 EDT (Hotpatch v1)
Built and reviewed a 15-file, 20-commit change (a new require-graph classifier, a router refactor, a `/help` placement fix) with `rg`/`Read` as the only lookup tools — never called `search_graph`, `trace_path`, `get_dependents`, or even `list_projects` to check the index was healthy, despite the `CODE-DISCOVERY` hook firing on nearly every relevant Bash/Read call and CLAUDE.md's own "Tool Preferences & Fallback Logic" naming this the **primary** tool for symbol/call-graph lookups, not a situational option. Several of the session's actual lookups (finding `HANDLER_BINDINGS`'s real call sites, tracing `help.js`'s `CATEGORY_DEFS` consumers, checking whether `DELIBERATELY_ABSENT` was read anywhere) are exactly the call-graph-shaped questions this tool exists for.
- **Can't retroactively tell whether the tool would have helped or was even usable** — per the `list_projects`-silent-corruption entry above, the honest finding is narrower than "ignored a working tool": it's "never checked whether it was working, at all, all session." That is itself the exact anti-pattern [[feedback_skill_availability_verify_by_invoking]] already names for skills — test by invoking, never assume from a rule that names it.
- **The hook's own wording is part of the problem, not just the discipline**: `CODE-DISCOVERY`'s advisory ends with *"If you already know rg is the right tool here, carry on"* — an escape hatch easy to take reflexively for ANY lookup, not just the genuinely-simple ones it was meant to exempt.
- **Sharper rule going forward:** before defaulting to `rg`/`Read` for a question that is actually about STRUCTURE (who calls X, what does X depend on, what would break if X changes) rather than TEXT (does this string appear anywhere), call `mcp__codebase-memory-mcp__list_projects` once at the start of a session that will do real code navigation — cheap, and it settles the "is the index even healthy" question before the "carry on" escape hatch gets used as a reflex instead of a judgment call. If `list_projects` comes back empty or stale, THAT is a legitimate reason to fall back to `rg` for the rest of the session, and is worth stating out loud rather than silently defaulting.

## 📍 The `anthropic-skills:*` bundle lives OUTSIDE `~/.claude` — 15 skills no in-`~/.claude` search can see (found 2026-08-09 23:25 EDT)
```
~/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/<orgId>/<accountId>/skills/
```
`algorithmic-art · brand-guidelines · canvas-design · consolidate-memory · doc-coauthoring · docx · pdf · pptx · schedule · setup-cowork · skill-creator · slack-gif-creator · theme-factory · web-artifacts-builder · xlsx`

**I searched `~/.claude` with `fd -H -I`, found nothing, and reported them "not on disk — delivered at runtime." That was a SCOPE error reported as a fact about the world** — same shape as the `~/.config/dior` blind spot in [[project_dior_cli_repo]], and the reason that entry exists. Harkirat supplied the Windows path (`%APPDATA%\Claude\…`) from a Reddit post; the macOS mapping is above. **Two copies exist** under different org/account id pairs (the ids appear swapped between the two path segments — read the roster, don't assume which is live).

### ✅ `consolidate-memory` — use it; its number is now THE project number
34 lines: Phase 1 take stock · Phase 2 consolidate · Phase 3 tidy index. Phase 3 says keep `MEMORY.md` **"under 200 lines and ~25KB"**, and as of 2026-08-09 23:28 EDT the enforced project budget **is 25,000 B** — the skill and the hook agree, so follow it as written.

⚠️ **This entry said the exact opposite for about 40 minutes and the correction matters more than the fact.** I first flagged the skill's 25KB as *contradicting* a "deliberate 20,000 B ceiling" and told Harkirat I would not silently absorb it — defending a number that was never a measurement. He corrected it: 16,000 was self-imposed by a session (the spec derived it as "~20% above a ~9KB target"), and 20,000 was a reactive patch to calm a session that had started treating its own invention as a hard wall. **A self-imposed constraint that nothing measured is the most expensive kind: it looks like rigour, so nobody re-tests it.** Full provenance in [[project_memory_index_scaling]].

⚠️ Its Phase 2 "retire dated files / drop what's easy to re-find" still cuts against the `feedback_*` files here, which are durable BY DESIGN and not re-derivable from the repo. **That** is the real override — not the byte count. Its good parts, which this project already mandates independently: merge overlapping files, convert relative dates to absolute, drop what is cheap to re-derive.

⚠️ Its Phase 2 "retire dated files / drop what's easy to re-find" also cuts against the `feedback_*` files here, which are durable BY DESIGN and are not re-derivable from the repo. Do not let a generic pruner delete them.

### ⭐ `superpowers:verification-before-completion` — an installed skill encoding this project's most-repeated lesson, invoked ZERO times
`~/.claude/plugins/cache/claude-plugins-official/superpowers/6.2.0/skills/verification-before-completion/SKILL.md` (120 lines). Sections: **The Iron Law · The Gate Function · Common Failures · Red Flags — STOP · Rationalization Prevention**. Its description: *"Use when about to claim work is complete, fixed, or passing, before committing or creating PRs — requires running verification commands and confirming output before making any success claims; evidence before assertions always."*

That is [[feedback_verify_before_claiming]], written by someone else and shipped on this machine. **Read its Rationalization Prevention section before any done/fixed/passing claim** — it is the part this project keeps re-deriving the hard way.

⚠️ **Largely already re-implemented here**, which is why it reads as familiar rather than new: `completeness-sweep.sh`, `records-close-check.sh` and `release-ready-check.sh` are this repo's mechanised version of the same idea, and they are stronger because they *fire* rather than needing to be remembered. The skill's advantage is the framing; the hooks' advantage is that they cannot be skipped. **Use both — the skill when composing a completion claim, the hooks as the backstop.**

⚠️ **How this entry nearly did not exist, which is the point:** it was named in a chat message as a "notable find" and then written to no file at all. Harkirat asked whether it had been documented; a single `rg` over the memory store answered **no**. That is exactly the failure `outstanding-not-filed.sh` was built for — *a limitation that lives only in a chat message is indistinguishable from one nobody noticed* — and it happened while cataloguing the skill about not claiming things without checking.

### `doc-coauthoring` — 375 lines, the one with real substance
A staged workflow: context gathering → clarifying questions → brainstorming → curation → **gap check** → drafting → iterative refinement → quality checking. Legitimately different from a single-pass write, and the right tool for the next spec or handoff. Its `gap check` stage is the part a one-pass author reliably skips.

### 🔴 The index CAN CORRUPT SILENTLY — check `list_projects` before trusting "it's indexed" (measured 2026-08-09 22:42 EDT)
`~/.cache/codebase-memory-mcp/Applications-Claude-Code-Diors-Builds.db.corrupt` was found quarantined at **22:34:14**, this session's start; the server auto-rebuilt a fresh DB during the session (healthy again: 2703 nodes, 5508 edges, `head_sha` matching `main`). **While corrupt, `list_projects` returns `{"projects":[]}` with a friendly "No projects indexed. Call index_repository first." hint** — indistinguishable from "never indexed", and no error anywhere. Every session then correctly falls back to `rg` and *nothing reports the failure*.

**This is the real reason the `SessionStart` "ALWAYS use codebase-memory-mcp FIRST" directive went unfollowed** — the tool had no data, not that the instruction was ignored. So: **before citing this index as authoritative, confirm `list_projects` returns a non-empty `projects` array.** Do not infer "it's indexed" from this file, from the session-start banner, or from the fact that it worked last week. Config note: `auto_index=false`, `auto_watch=true`.

## `sequential-thinking` — ✅ WORKS, cost is the turn multiplier (tested 2026-07-25 01:08 EDT)
Responds correctly; returns only `{thoughtNumber, totalThoughts, nextThoughtNeeded, branches, thoughtHistoryLength}` — **~90 tokens, and it does not echo the thought text.** So the payload is trivial; **the entire cost is that each thought is a separate assistant turn that re-sends the whole transcript.** At the measured 375k peak, ten thoughts ≈ **3.75M cache-read tokens** for reasoning that fits in one ordinary thinking block. Confirms — now by test, not assumption — the explicit-request-only classification in [[feedback_token_conscious_tool_routing]].

## `jina-reader` — ✅ WORKS (tested 2026-07-25 00:55 EDT)
`read_url` on a GitHub repo returned clean markdown (56.9KB, auto-persisted to a tool-results file rather than dumped into context). Good for docs/README retrieval. Pair it with `ctx_execute_file` to extract only what's needed from the persisted output — never ingest the whole page.

## `mcp__linksee__read_smart` — ✅ WORKS, high value (tested 2026-07-24 23:02 EDT)
First read of a 300-line file: **5,632 tokens**. Re-read unchanged: **~150 tokens (97% saved).** Built exactly for the re-read pattern that cost 34,909 tokens on one file. Use for every re-read.

## `hookify` — ✅ WORKS (tested 2026-07-25 00:10 EDT)
Stateless regex→action engine; rules at `.claude/hookify.*.local.md`, **project-scoped only**. Verified against its own engine: rule loads, blocks, allows correctly. Live rule: `.claude/hookify.env-protection.local.md` (blocks `git add` of `.env`), 10/10 test cases pass, committed `4bbfeed`. **It caught a real false positive in its own first pattern** — `.*\.env` matched `.env-protection.local.md` and blocked its own commit. Regex rules need adversarial test cases.

## `usage-guard.mjs` (bespoke) — ✅ WORKS (tested 2026-07-24 23:02 EDT)
`~/.claude/hooks/usage-guard.mjs`, PreToolUse matcher `""` = **every tool** (long mis-documented as `Read|Bash`; corrected 2026-07-28 12:05 EDT). Denies a redundant full re-Read of a byte-identical file; warns on `grep`/`find` and large full reads. 6/6 paths verified. Stateful — hookify cannot express it. It also carries the **turn budget** (thresholds `[30, 60, 120, 200, 300]`, reset on every `UserPromptSubmit`).

**Turn-budget tiering — retuned across two passes, 2026-07-28 11:20 EDT and 11:40 EDT (Harkirat's calls), re-tested end-to-end each time. Final state: `30` = ADVISORY (the only soft tier); `60`+ = hard "checkpoint and report."**
- *Pass 1 (11:20 EDT):* softened `25` and `60` to advisory, because the hard message fired during ordinary multi-file documentation work and pushed toward wrapping up mid-task. That is how a changelog entry, a version bump, a tag, or a verification step gets skipped "to save turns" — which costs far more than the turns, because the work gets redone later with less context, or an unverified claim ships.
- *Pass 2 (11:40 EDT):* `25 → 30`, and `60` **reverted** to hard. Harkirat's reasoning: one advisory tier is enough of a cushion; by 60 turns checkpointing genuinely is the right call.
- *The framing that matters:* **the counter measures COST, never CORRECTNESS.** The right response is always "work more efficiently," never "work less completely." Both tiers carry a shared quality floor forbidding scope trimming, skipped docs/versioning/verification, and early "done" claims — **plus an explicit anti-over-correction clause**, because the efficiency practices applied bluntly make the work worse (see below).
- *The structural fix (the real one):* the four efficiency practices **no longer live in the hook's message at all** — they moved to the always-loaded layer (`~/.claude/CLAUDE.md` § "Context & Turn Discipline", the "four practices" block) so they apply **from turn 1**, each with a stated boundary. Harkirat's question — *"why aren't these applied retroactively/from the start?"* — was correct: a cost alarm is the wrong place to first learn good practice. The hook now only **points back** at them and asks which concrete waste actually occurred, rather than teaching them as turn-30 remediation.
- *Harkirat's own steer:* don't swing to ignoring them either — a soft nudge is still a nudge that should visibly change behaviour on the next message.
- *Verified:* `node --check` clean; simulated turns confirm silent for turns 1–29, **30 → advisory**, **60 → hard**, with the quality floor + anti-over-correction clause present in both tiers.

### 🔍 Full adversarial audit of `usage-guard.mjs` — 2026-07-28 12:05 EDT
Harkirat's direction: *"I DO NOT WANT YOU becoming dumb… audit the entire hook aggressively so it doesn't make you worse while still treating usage-consciousness."* **The governing rule now written into the file's header: a cost guard that degrades the WORK is a net loss, always — every rule must be able to answer "how could this make the work worse?" and carry the mitigation.** Three real degradations were found, each *reproduced* before being fixed:

1. **🐞 The partial-read poisoning bug — the worst of the three, and it punished following our own rules.** State stored only the file's hash, never *how much* was read. So a targeted `Read(offset:148, limit:5)` — the exact pattern [[feedback_token_conscious_tool_routing]] tells me to use — marked the whole file "seen", and the next **full** read was DENIED with the false claim *"you already read this exact file content."* Following the efficiency rule locked me out of ever reading that file properly. *Reproduced live, then fixed:* state now records `full` + the set of ranges, and **only a prior FULL read of identical bytes can deny a FULL read**. A denied read no longer records coverage it never produced.
2. **🐞 Compaction was treated as if context were intact.** The deny message asserted "it is still in your context above" — false after a `/compact`, when the bytes may be summarised away. Blocking then forces work from a lossy summary. *Fixed:* the hook is now registered for **`PreCompact`** and wipes read-state (turn state deliberately survives — same request). Plus an **always-available override** (`Read(file_path, offset: 0)`, never blocked) that does **not** depend on the linksee MCP being up, with an explicit instruction never to abandon a needed read or guess instead.
3. **🐞 Subagents inherited the parent's read-state.** A subagent runs on its own transcript with a *cold* context, so denying its first read left it working blind. *Fixed:* state is keyed on session + transcript. **Verified the harness actually sends `transcript_path`** by dumping real payload keys: `session_id, transcript_path, cwd, prompt_id, permission_mode, effort, hook_event_name, tool_name, tool_input, tool_use_id`. That dump is now written every run (`$TMPDIR/claude-usage-guard/last-payload-keys.json`) so the next audit is evidence-based.

**Two wrong-routing fixes (the hook was sending me to tools that don't work here):**
- It advertised `codebase-index` for code structure. **It is Python-only** (already recorded in this file) and Diors-Builds is JS, so that advice cost turns for nothing. Now correctly scoped.
- It said "never used to date" / carried bare counts — present-tense state in prose that rots ([[feedback_no_duplicated_state_in_prose]]). Removed or date-bound.

4. **🐞 Every Bash guard was silently dead from line 2 onward.** The separator classes (`(^|[;&]|&&)`, `[^|;&]*`) omitted **`\n`** — but a newline *is* a shell command separator, and essentially every command here is a multi-line script. So a real `rg -rn` (the silent-rewrite foot-gun), a whole-tree search, or a bare `grep` on any line but the first sailed straight through. This is the failure mode you never notice: **a guard not firing looks exactly like a guard with nothing to report.** Found only by feeding the guard a *real* multi-line command instead of the hand-written one-liner I had been testing with — the same "test the actual shape, not a convenient one" lesson as [[feedback_verify_before_claiming]]. Fixed and re-verified on line 2 and line 3.

**A third guard, added 2026-07-28 13:30 EDT from a failure hit live in the same session:** the completeness check went quiet whenever *any* breadth flag was present, so `fd -H . .remember -e md` drew no warning and returned **0 files** from a directory that had several — `-H` un-hides, but `.remember/` is *gitignored*, which needs `-I`. The guard now models the flags **per tool and per level** (`rg -u` = no-ignore only, `rg -uu` = +hidden; `fd -u` = `-HI`) and emits a distinct **HALF-COVERED** warning naming the half that is still missing. That distinction matters more than it sounds: a generic reminder reads as *already satisfied* once you have passed one flag, so it gets dismissed — which is exactly what I did. Verified 15/15 across every flag level and both tools.

**Two NEW guards that prevent errors rather than cause them:**
- **rg/fd completeness** — warns when a search will silently skip hidden/gitignored paths. A false negative is worse than a wasted token because it becomes a confident wrong claim.
- **`rg -r` foot-gun** — flags `-r`/`-rn` (= `--replace`, not recursive), the documented silent-rewrite trap, unless spelled `--replace`.

**Doc correction:** every prior description (this file, the hook header, [[reference_enforcement_hooks]]) said the hook's `PreToolUse` matcher was `Read|Bash`. **It is `""` — every tool.** Confirmed by arithmetic: tier 30 fired while that prompt's Read+Bash total was still well under 30. This matters — it means the turn counter measures *real* turns, not a Read/Bash proxy, so the thresholds mean what they say.

**Verification — four suites, every assertion green** (`node --check` + `settings.json` re-parsed valid after each change). Two failures surfaced *during* testing and both were fixed before finishing: one malformed assertion of mine, and defect 4 above. Coverage: partial→full now allowed · full→full still denied · the stated override actually works · changed file allowed · `PreCompact` restores readability · completeness guard fires on whole-tree/`.claude/`/`local/` searches and stays **silent** on named files, correct flags, and pipe filters (10/10 signal-vs-noise) · `-r` caught (real invocation, incl. on line 2 and after `&&`) while a quoted `rg -r` example *inside* another command is ignored · `grep`→`rg` intact · a deny and a turn message coexist (the alarm never suppresses the block) · tier 30 advisory / tier 60 hard, with the floor's new anti-deferral and anti-drift clauses present. **A guard that cries wolf gets ignored, so noise was treated as a defect, not a cost of doing business** — a whole-tree false-positive on piped `rg` was found in testing and fixed. **Both directions were tested: what must fire, and what must stay silent.**

## Verified working, in routine use
`context-mode` (`ctx_execute`, `ctx_execute_file`, `ctx_batch_execute`) · `perseus-vault` (`remember`/`recall`) · `linksee` (`remember`/`recall`/`read_smart`) · `rg` / `fd`.

## MCP config cleanup 2026-07-25 01:45 EDT
Found the same server registered **three times** under two names across two config files, plus a dead entry. Claude Code reads **both** `~/.claude.json` and `~/Library/Application Support/Claude/claude_desktop_config.json`, so duplicates load twice and pay for two sets of tool definitions (both `mcp__codebase-memory-mcp__*` (14) and `mcp__codebase-memory__*` (8) were live simultaneously). Fixed:
- Removed dead `codebase-index` from `claude_desktop_config.json` (it was still loading with the wrong `PROJECT_ROOT=/Applications/Claude Code`; `~/.claude.json` removal alone had not been enough).
- Removed the `codebase-memory` duplicate from `claude_desktop_config.json`.
- Removed the project-scope `codebase-memory-mcp` duplicate; kept **user scope** so it works in every repo.
- Backup: `claude_desktop_config.json.bak-20260725`.

**Lesson: when removing an MCP server, check BOTH config files.** `claude mcp remove` only touches `~/.claude.json`.

### How the config layers actually work — from the official docs, not inference
Verified 2026-07-25 13:31 EDT against `https://docs.claude.com/en/docs/claude-code/mcp`. **Precedence (highest first): 1. Local · 2. Project · 3. User · 4. Plugin-provided · 5. claude.ai connectors.** *"When the same server is defined in more than one place, Claude Code connects to it **once**, using the definition from the highest-precedence source. The entire server entry from that source is used; fields are not merged."* **The three scopes match duplicates by NAME; plugins and connectors match by ENDPOINT** (same URL or command).

| Layer | Stored in | Meaning |
|---|---|---|
| Local (default for `claude mcp add`) | `~/.claude.json` under that project's path | this project only, private |
| Project | `.mcp.json` in repo root | committed, shared with the team, prompts for approval |
| User | `~/.claude.json` top-level `mcpServers` | every project on this machine, private |
| Plugin | the plugin's own `.mcp.json` | arrives/leaves with the plugin |
| Connector | claude.ai settings | managed in the web UI, not on disk |

**`claude_desktop_config.json` is NOT one of these layers.** The Claude Code MCP docs mention it only in the *opposite* direction (using Claude Code itself as a server that Claude Desktop connects to). It is the **Claude Desktop app's** own MCP config; servers there load because this app is the desktop app. Gemini's advice to install there was the standard *Claude Desktop* instruction — it works, but the Claude-Code-native equivalent is user scope. **Proven this session:** `codebase-memory-mcp` lives only in `~/.claude.json` user scope and works fine in the desktop app, so user-scope entries are NOT CLI-only.

**Correction to an earlier claim in this file:** I said duplicates "load twice and pay for two sets of tool definitions." That is wrong for *same-name* duplicates — those dedupe (so `linksee` in both files is harmless, and only one set of its tools ever appeared). It was right for `codebase-memory-mcp` vs `codebase-memory`: **different names AND different command paths** (`/opt/homebrew/bin` vs `~/.local/bin`), so endpoint-matching failed and both genuinely loaded. Same mechanism explains `context-mode`: the plugin uses bare `context-mode`, the desktop config uses `/opt/homebrew/bin/context-mode` — different literal endpoints, so both load. **Dedupe only fires on an exact name or endpoint match.**

### 🚩 WATCH: codebase-memory-mcp writes to agent config (flagged by Harkirat 2026-07-25 13:31 EDT)
He is **fine with it for now** but wants it monitored. Audited what it wrote:
- `~/.claude/hooks/cbm-code-discovery-gate` — 9 lines, benign. Runs `~/.local/bin/codebase-memory-mcp hook-augment` on `Grep|Glob`; its own comment states it **NEVER blocks** a tool call and fails silently (`exit 0`, no output). It only *adds* graph context.
- A `Grep|Glob` PreToolUse entry in `~/.claude/settings.json`.
- A SessionStart "Code Discovery Protocol" message telling the agent to prefer its tools.

**Re-check after any upgrade of this package** (`npm update -g codebase-memory-mcp`) — installers can add more on upgrade. **Escalate to Harkirat if:** it ever blocks/denies a call, its `hook-augment` output starts bloating `Grep`/`Glob` results (it injects tokens into every search — the one real cost risk), it writes outside `~/.claude/hooks` + `settings.json`, or new SessionStart directives appear. If any of that happens, diff `~/.claude/settings.json` and the hooks dir, and report what changed and why.

**Note:** the codebase-memory-mcp installer wrote a `Grep|Glob` PreToolUse hook (`~/.claude/hooks/cbm-code-discovery-gate`) into `~/.claude/settings.json`, plus a SessionStart "Code Discovery Protocol" message. So it *does* modify agent config despite the npm path avoiding its `curl | bash` installer.

**🔴 Security note:** `claude_desktop_config.json` contains a **live Jina API key in plaintext** in the `jina-reader` args. Never commit, paste, or share that file; if it is ever exposed, rotate the key.

## Not yet tested — queued
**Priority: `typescript-lsp`** — now a complement rather than a fallback (codebase-memory-mcp covers call chains; the LSP would add rename/refs/type intelligence). Then: `feature-dev` agents · `claude-security` scan · `plugin-dev` skills · `code-simplifier` · `pr-review-toolkit` · `context7`.

See [[feedback_token_conscious_tool_routing]] and [[project_context_token_budget]].

## ⚠️ CORRECTION 2026-08-02 14:50 EDT — `codebase-memory-mcp` DOES work on this JS repo
The "Python-only, useless here" claim above sent sessions away from a tool that works. **Measured live, not assumed** (Harkirat asked directly whether we use it):

- `list_projects` → this repo is indexed as `Applications-Claude-Code-Diors-Builds`: **2,260 nodes, 4,805 edges, 8.9 MB**, tracking the live branch and the current HEAD sha. It is not stale.
- `search_graph(query: "send V2 payload interaction reply")` returned **correct JS symbols with accurate line ranges** — `sendV2Payload` (`utils/sendV2Payload.js:12-44`), `buildSyntheticInteraction` (`index.js:104-109`), `sendAlert` (`utils/alertWebhook.js:55-115`). BM25 mode, `total: 7`.

**Be precise about what this does and does not overturn.** The tool measured here is the **`codebase-memory-mcp`** server (`mcp__codebase-memory-mcp__*`, skill `codebase-memory`). The older finding was recorded against **`codebase-index`**, the name used in the global `~/.claude/CLAUDE.md` routing chain. Whether that is the same server renamed, or a different one, was **not** established — what IS established is that *the graph tool available in sessions today indexes this JavaScript codebase and answers structural queries correctly*. Do not repeat "the call-graph tools fail on JS" as current fact.

**How to apply:** for "where is X defined / what calls it / what does this touch", try `search_graph` before `rg`, and check `list_projects` first — if `head_sha` is behind, run `detect_changes`/`index_repository` rather than concluding the tool is useless. **General lesson: a capability finding is a measurement with a DATE, not a permanent property** — re-measure before letting an old negative result remove a tool from the routing table. Same shape as [[feedback_verify_before_claiming]].

## 🚨 MCP memory-layer audit — measured 2026-08-02 15:02 EDT (Harkirat asked "are we actually using these?")
All four were checked live. **Three of the four problems were OURS, not the tools'.**

### 1. ⚠️ Linksee files Diors-Builds memories under FAKE, PATH-DERIVED entities — ~29% are unreachable
`recall()` overview shows Diors-Builds work scattered across **at least six** entities. Confirmed by reading their contents, not inferred from the names:
- **`Application` (66 memories)** — holds the **licensing session** (`id 7492`: Harkirat's own opening message asking for the licence + ToS + privacy policy, the work that produced `LICENSE`, `NOTICE`, `TERMS.md`, `PRIVACY.md`, v2.42.0).
- **`Containers` (31)** — holds MarkEdit mark work **and `id 864`, an edit to `/Applications/Claude Code/Diors-Builds/.claude/settings.local.json`** — unambiguously a repo file.
- Plus `CleanShot` (41), `Application Support` (25), `New Folder With Items 2` (9), `co-authored-commits-f280b2` (8). **≈180 memories** vs 438 on the real `Diors-Builds` entity.

The names are **path segments** (`/Applications/…`, `~/Library/Containers/…`), so a session that touches any file outside the repo can get its whole thread filed under a junk project.

> ### ✅ THE FIX — recall by `query`, NEVER by `entity_name`
> **Verified by discriminating test:** `recall(entity_name:"Diors-Builds")` MISSES the licensing memory; `recall(query:"license ToS privacy policy diors-builds")` FINDS it at relevance 1.0 (FTS5 mode, crosses every entity). Entity-scoped recall silently under-returns and reports no error — the exact shape of [[feedback_verify_before_claiming]]'s "green check, wrong layer". **When WRITING, pass `entity_name: "Diors-Builds"` explicitly** (canonical id 1, `project:diors-builds`) or you spawn yet another fragment — I did exactly that this session and created a 7th. ⚠️ **`caveat`-layer memories CANNOT be deleted** (`forget:true` returns `preserved: true, "caveat-layer is auto-protected"`). A mis-filed caveat is permanent without manual SQLite surgery. Choose the entity correctly the FIRST time.

### 2. Linksee's deliberate layers are starved
`Diors-Builds`: 438 memories = **implementation 339 (77%), goal 21, learning 8, caveat 5.** The auto-capture is doing nearly all the work; the layers that prevent repeat mistakes are almost empty. Auto-capture is not a substitute for a deliberate `remember()` at a decision or a failure.

### 3. Perseus Vault — healthy, just SPARSE (not a quality problem)
19 entities over 9 days (~2/day, vs the file store's 2.8/day). **`hygiene` flagged 0 of 19** — what is there is good. But `by_layer` = buffer 17 / working 2, `journal_events: 0`, `history_rows: 0`: **nothing has ever been consolidated or promoted.** The consolidation tools exist and have never run.

### 4. context-mode — capturing, but its EXECUTION tools went unused
11,282 captures across "63 projects" (same path-noise problem). `ctx_stats` reported *"With context-mode 1 B / 100.0% kept out / 10,782,226× longer"* for this session — **not credible numbers, and the `1 B` is the real signal: zero `ctx_execute` / `ctx_batch_execute` / `ctx_execute_file` calls were made all session** despite the global CLAUDE.md routing chain naming them the primary path. Treat its savings headline as marketing; treat the capture counts as real.

**The through-line:** every one of these looked fine from the outside — 438 memories, 11k captures, a healthy vault. **Volume is not reachability, and capture is not curation.** Check what a tool actually returns for the query you would really run.

### ✅ RESOLVED 2026-08-02 15:02 EDT — the fragmentation was REPAIRED, not deferred
The "blocked on tooling" call above was wrong and was tested rather than trusted (see [[feedback_not_checkable_is_usually_unexamined]]'s "BLOCKED is the same failure" case).

- **`memories.entity_id` is a plain FK**, so re-homing is an `UPDATE`. Three tables carry it: `memories`, `events`, `consolidations`.
- **`caveat` protection is APPLICATION-layer, not DB-layer.** The `trg_protect_caveat` trigger is `AFTER INSERT` and only sets `protected=1`; it blocks no `UPDATE` or `DELETE`. The MCP's `forget` refuses — SQL does not.
- **Executed** (after `.backup` to `memory-backup-2026-08-02-1520.db`): moved every memory that *provably* referenced the repo path out of the junk entities, plus all rows of the three pure name-variant fragments, then dropped the emptied entities behind a `NOT EXISTS` guard. **`Diors-Builds` 450 → 573 (+123). Total rows 696 before and after — nothing lost. `integrity_check` ok, `foreign_key_check` clean.** Entity `dior` (the CLI repo, a REAL separate project) deliberately untouched.
- ⚠️ **The root cause is NOT fixed** — linksee still derives entities from path segments, and `map_projects` is empty with no configuration anywhere (`env: {}` in `~/.claude.json`, no config files). **New sessions can still fragment.** The standing defence remains: recall by `query`, and set `entity_name` explicitly on every write.

### 📌 Linksee v0.11.x REMOVED four tools the docs still teach (verified in package source)
Not an install, Claude Desktop, or Claude Code issue — checked directly. Installed **0.11.5**, which is also the latest published. `dist/mcp/server.js` carries a `migrations` map answering each removed name with its replacement:

| Removed | Use instead |
|---|---|
| `list_entities` | `recall({})` — no params = overview |
| `recall_file` | `recall({ path: "<file_path>" })` |
| `update_memory` | `remember({ memory_id, content, importance })` |
| `consolidate` | **nothing — it AUTO-RUNS on server startup**, non-blocking |

**The bundled `dist/skill/SKILL.md` in that same package still teaches all four.** The local copy at `~/.claude/skills/linksee-memory/SKILL.md` was corrected 2026-08-02 15:02 EDT (Japanese stripped too — English-only user, and the frontmatter loads into EVERY session). Pristine copy kept at `SKILL.md.orig-backup-2026-08-02`. ⚠️ **`npx -y linksee-memory` may overwrite that file on update.** If the Japanese or the four ghost tool names reappear in the skill listing, the edits were clobbered — re-apply them.

## 🔌 INSTALLED IS NOT AVAILABLE — a tool you never invoke is not a capability (2026-08-02 15:15 EDT)
`shellcheck` was installed on this machine the whole time. It was never run once. Pointed at the hooks written that day it flagged **SC2044 and SC2086 on the exact word-splitting bug that had already struck** — an unquoted `for f in $(find "$REPO/docs" ...)` over a path containing a space (`/Applications/Claude Code/`) that silently updated **zero** files while reporting success.

The same session then installed `bats`, `sd`, `gron` and `ast-grep`. **On current evidence they will go the same way**, because nothing routes me to them — which is the identical shape as `rg` 4× vs `grep` 788× and `codebase-index` never invoked once (both measured in [[feedback_token_conscious_tool_routing]]).

**The rule:** a capability has three states, not two — *absent*, *installed*, and *ROUTED*. Only the third does anything. Installing is the cheap part and it feels like progress; the work is the wiring.

**How to apply:**
- **When adopting a tool, ship the trigger in the same change** — a hook, a rules-file line at the point of use, or an entry in the routing chain. "I'll remember to use it" is the failure mode with a measured 99.5% miss rate here.
- **Before recommending an install, check whether it is already there and simply unused.** That was true of the single highest-value tool in this whole audit.
- `shellcheck` is now wired: a `PostToolUse` hook runs it on every `.sh` edited. See [[reference_enforcement_hooks]].
- ✅ **ROUTED 2026-08-02 15:25 EDT, same session — the lesson was applied rather than just recorded.** `sd`, `ast-grep`, `gron`, `difft`, `deno` and `gtimeout` are now named in the CLI ROUTING block that `mcp-layer-check.sh` injects into **every** session, with what each replaces. `typos` got its own `PostToolUse` hook (`typos-check.sh`) that checks **only the text being written**, not the whole file — file-level would flag ~50 pre-existing findings in any file touched, and a gate that is mostly not-your-fault is one you scroll past.
- **Two were deliberately NOT wired, with reasons:**
  - `markdownlint-cli2` — **redundant.** 725 of its 741 repo findings are MD022/MD032 house style, and the one rule that matters (repeated top-level heading) is already enforced by `docs-audit`'s `record-structure` check. Wiring it would have been 725 units of noise for zero new coverage.
  - `shfmt` — cosmetic only. It wants to reformat `$(( ))` spacing in scripts that are already shellcheck-clean; correctness is covered, and churn is not an improvement.
- **`bats` remains unrouted ON PURPOSE** — migrating four working suites is a refactor, not a wiring step. Filed with direction in `docs/db-deferred-list.md`.
- ⚠️ **`typos` resolves its config relative to the FILE being checked, not the working directory.** A probe run against `/tmp` silently ignored `_typos.toml` and reported false positives that looked like a broken config. Write the probe file inside the repo.

## ⚠️ `ctx_execute` (context-mode, Bun runtime) got a real 403 from Discord's API where plain `node -e` via Bash succeeded (2026-08-07 13:20 EDT)
Same token, same endpoint (`GET /applications/{id}/emojis`), same `.env.dev` — via Bash-executed Node it returned 200 with the real emoji list (worked identically for the SAME check earlier in this session too); via `ctx_execute(language: "javascript")` (which runs on Bun, confirmed by its own stack trace) it returned `403 {"message":"You are not authorized...","code":20012}`. Not a token-loading problem — confirmed the token loaded correctly (72 chars) inside the same `ctx_execute` sandbox right before the failing call. Root cause not confirmed (untested: Bun's `fetch` may send a different default `User-Agent`/header set that Discord's API gateway treats differently for this endpoint specifically) — but the discrepancy is real and reproducible in this session. **How to apply:** for a Discord API call that fails from `ctx_execute` with an auth-shaped error despite a confirmed-good token, retry via plain `node -e` through Bash before concluding it's a real permissions problem — don't assume ctx_execute's network stack is a drop-in equivalent to Node's for every external API.

**⚠️ SECOND, DIFFERENT failure mode found the same session (16:31 EDT) — silent wrong data, not an error this time.** Comparing PROD vs DEV app emoji assets (this repo's dual `.env`/`.env.dev` token pattern), `ctx_execute` calls to `require('dotenv').config({path:'.env.dev'})` (no explicit `node_modules` path, matching how a real script in the repo would call it) silently returned PROD's identity (app id, app name, emoji id, byte count) for BOTH the "prod" and "dev" queries in two separate `ctx_execute` invocations — no error, no warning, just wrong data that looked internally consistent enough to almost ship as a real finding. A plain `node script.js` run (file-based, not `node -e` — inline `-e` gets redirected by context-mode's own hook, see the `curl`/`fetch`-redirect messages elsewhere) against the identical `dotenv.config({path:'.env.dev'})` call correctly returned DEV's distinct app id/name/emoji id. Root cause not confirmed (possibly a warm/reused sandbox process carrying over `process.env.BOT_TOKEN` from a prior call in the same session, combined with dotenv's default no-override-existing-vars behavior). **How to apply:** for this repo's dual-token pattern specifically, don't trust an `ctx_execute` result that distinguishes prod from dev without cross-checking against a real `node script.js` run — a silently-wrong "both sides look identical" result is far more dangerous than the 403 case above, because nothing about it looks like a failure.

## 🔤 `document.fonts.check()` cannot report a MISSING font — measured 2026-08-25

`document.fonts.check('700 44px "__NoSuchFace9x__"')` returns **`true`** for a family that has never existed. The method answers whether the text *can be rendered* — and it always can, via a fallback — not whether the named face loaded. So every "the webfont is loaded" reading taken from it is worthless, and a fallback render is indistinguishable from a real one.

**The honest probe is width.** Set the same string in each candidate face over a **monospace** fallback and compare against the bare monospace baseline; a face that did not load measures identically to it. Measured on the Dioreo portal: baseline **742px**, the invented face **742** (correctly reported absent), and the real faces 442 / 464 / 628 / 639 / 641.

⚠️ **Those widths are also a DESIGN measurement, not only a load check** — Archivo measured 641 against Space Grotesk's 639, which retired it as a display candidate on the spot: a display face whose whole job is to differ from the UI face must not set the same string within 2px of it.

This is the same shape as every other probe-that-cannot-report-presence in [[feedback_verify_before_claiming]]: **always give a probe a case it must answer NO to, before trusting a yes.**

## 🔴 `codebase-memory-mcp`: `index_repository` FAILS THROUGH THE MCP TOOL, AND ITS ERROR MESSAGE IS WRONG (2026-09-01 20:47 EDT)

**The MCP tool takes `project_path`. The worker requires `repo_path`, and the parameter is never forwarded.** The worker exits 1 with the single line `repo_path is required`, which the MCP layer reports as:

> `Indexing worker crashed on a file. The crash was contained (the server survived). Re-run to retry; a future release isolates the culprit file.`

**That message describes a different failure and it is actionable, which is why it is expensive.** Believing it once cost: a subtree bisect (every subtree fails — the parameter is missing regardless), `pragma integrity_check` (ok), disk space (37 GB free), killing five stale server processes (irrelevant), moving the SQLite database aside (the failure predates and outlives it), and reading a genuine SIGBUS crash report whose stack pointed at SQLite and belonged to an **older** failure. Every step was a reasonable reading of the hint.

✅ **THE WORKAROUND, VERIFIED WORKING:**

```bash
~/.local/bin/codebase-memory-mcp cli index_repository --repo_path "/Applications/Claude Code/Diors-Builds"
```

Exit 0, `skipped_count: 0`, 9,763 nodes / 20,764 edges — and confirmed by QUERY rather than by a status field: `search_graph` then answered for a function written an hour earlier, with its two callers.

⚠️ **THREE SPELLINGS FOR ONE IDEA, so a copied call fails on the wrong layer:** the CLI takes `--repo_path`, the MCP tool takes `project_path`, and `search_graph` / `detect_changes` take **`project`** — a project NAME from `list_projects`, not a path.

⚠️ **`detect_changes` reports EVERY file as changed right after a full re-index**, because the rebuild leaves `base_sha` empty. It is not staleness. Check `list_projects`'s `base_sha` before believing a change count — reading that number as staleness is what produced the first, wrong diagnosis of this very bug.

🔴 **AND THE REAL ERROR IS ALWAYS ON DISK:** `~/.cache/codebase-memory-mcp/logs/.worker-<pid>.log`. The supervisor writes that path into its own `warn` line and then discards the contents. **When this server fails, read that file first — not the hint.**

**This is the THIRD failure from this server that looks like success**, after `list_projects` returning `{"projects":[]}` with a friendly "call index_repository first" (indistinguishable from never-indexed) and an index recording a correct `head_sha` against stale content. The standing routing rule — try `search_graph` before `rg` — is only sound while the graph is current, and nothing surfaces when it is not.

## 🔴 LINKSEE, TESTED PROPERLY FOR THE FIRST TIME (2026-09-06 18:35 EDT)

Previous entries here covered one behaviour: recall by `query`, never `entity_name`. Reading all 24 doc pages plus the shipped source settled a great deal more, and found two install defects.

| Claim | Verdict |
|---|---|
| The five `/linksee:*` slash commands do not exist | **FALSE.** They are MCP PROMPTS — a third surface, invisible to both a skill search and `ToolSearch`. `prompts/list` returns all five with argument schemas |
| …but they can be invoked | **FALSE.** `/linksee:entity-handoff` returns `Unknown command`; the `Skill` tool returns `Unknown skill`. The docs only ever promise *"the prompts list or asking the agent"* |
| The install was fine | **FALSE, twice.** The bundled skill was a month newer than the installed one and `install-skill` **skips rather than upgrades** — `--force` is required. And `~/.claude.json` ran the server through `npx -y`, re-resolving every session start |
| `where_am_i` is broken | **FALSE — it had no map.** `map.yaml` at the repo root is required and none existed. Written " + and imported; 10 nodes, 10 edges, no topology warnings |
| `map where <file>` matches files by name | **FALSE.** `dist/lib/map-view.js` matches only against `reality.path` and `reality.checks[].path`. Without those it falls back to LEXICAL matching and looks like it works |

**The workaround for an unroutable prompt, which is the transferable part:**

```bash
printf '%s\n%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"prompts/get","params":{"name":"<prompt>","arguments":{...}}}' \

✅ **THE FIVE BODIES ARE DUMPED AND INDEXED — stop writing a `prompts/get` script (2026-09-09 19:26 EDT).** They ship with the package and are byte-identical on every call, so re-fetching them over stdio each session was pure waste. They live at **`~/.claude/linksee-mcp-prompts.md`** and are indexed into context-mode as **`vendor:linksee-prompts`**, so `ctx_search({source: "vendor:linksee-prompts", queries: ["..."]})` answers without a pipe. **Re-dump only after a `linksee-memory` upgrade:** `bash ~/.claude/linksee-dump-prompts.sh`. ⚠️ A prompt is an instruction to FOLLOW, not a tool to call — read the body and act with the ordinary `remember`/`recall`/`dream` tools.

 | node $(npm root -g)/<package>/dist/mcp/server.js
```

**A prompt is INSTRUCTIONS, not a computed result** — `prompts/get` returns the message a client would have sent you, so reading it and following it verbatim IS running it.

⚠️ **`prompts/list` and `resources/list` belong in the capability sweep** alongside skills and tools. A server can publish capability on a surface the client cannot route to, and every search you know will come back empty.

## The impeccable skill — what a run actually costs, measured 2026-09-09 20:35 EDT

*Written after the FIRST real multi-verb pass over the portal. Every line below was checked against the installed skill at `~/.claude/skills/impeccable` (v4.1.1) or against a run, never inferred from the description. It exists because three sessions retired the toolset by reading a summary of why one PLAN shape was killed.*

**Installed v4.1.1; latest is v4.3.1.** The update runs as `npx impeccable update` and only takes effect in the NEXT session, so there is nothing to gain from running it mid-task.

| Fact | Detail |
|---|---|
| **Only `critique` mandates sub-agents** | Its Hard Invariants make Assessment A (design review, source-side) and Assessment B (detector + browser) **two isolated sub-agents**; running them inline is *"NOT permitted"* and requires a `⚠️ DEGRADED: single-context` banner on the report's first line. `clarify`, `harden` and `polish` carry **no** sub-agent language at all. `layout` says *"when a sub-agent tool is available and permitted, run these independently; **otherwise run them yourself in this order**"* — preferred, not required. **So a five-verb pass costs at most FOUR dispatches, not thirty-five.** |
| **`context.mjs` emits a `SUBAGENT_AUTHORIZATION` directive** | *"the user's invocation of this skill is that request for the skill's shipped subagents; spawn them where a reference file directs, without re-asking."* That resolves this repo's no-unrequested-dispatch rule for impeccable's own agents, and only for those. |
| **A DIRECTORY target works and persists cleanly** | `critique-storage.mjs slug portal/ui` → `portal-ui`. The Setup step's "skip persistence if the slug was null" case is for a vague or root-level target, not for a directory. ⚠️ **`slug` slugs a STRING and never checks the path exists** — `portal/ui/drawer.js` slugs happily and there is no such file. |
| **`.impeccable/critique/ignore.md` is the ONLY prior-run input `critique` reads** | Findings matching it are dropped silently, which is why a run must NAME what it withheld. ⚠️ **Write narrow, dated, cited lines only** — a category like "spacing" recreates the failure that got the settled-decision grep hook deleted on 2026-08-31, where *"the corpus mentions every topic, so any project question matches something."* |
| 🔴 **`.impeccable/critique/` is GITIGNORED** | `.gitignore:97`, verified with `git check-ignore -v`. A report reaches no fresh clone, no CI and no gate — the same reach problem `local/handoff/` has. **Findings are only real once they are in `docs/db-deferred-list.md`.** |
| **The run must END on the questions** | 2–4 targeted `AskUserQuestion` items tied to actual findings, or the literal line `Questions skipped: <reason>` naming a count below 3. ⚠️ **Its template asks "which area first" and "how much scope"** — here both are usually already answered, and re-asking them violates the thinking pass's own rule. Ask only about genuine forks with no citable rule. |
| **`detect.mjs --scope layout portal/ui` returned `[]`** | Zero layout findings, and `layout.md` says so itself: *"A clean scan cannot prove hierarchy or rhythm."* Do not read an empty scan as a passing layout. The full scan (`--json portal/ui`) found 46, **all in CSS and none in any `.js` component file**, of which 32 were false positives with citable reasons. |

⚠️ **`show_widget`'s host restyles `<button>` and drops CSS custom properties declared on a wrapper.** Three rendered comparisons in a row came back visually identical because `background`, `color` and `border` were being overridden — the design fork was unanswerable until the markup became `<span>` elements carrying **literal hex in inline `style=` attributes**. Measured 2026-09-09 20:35 EDT. For any comparison where the COLOUR is the subject, do not use `<button>` and do not put the palette in `:root`-style variables.
