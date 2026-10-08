---
kind: record
status: frozen
---

# Compact and resume on this Mac: what was measured

## About this report

Written for the session building the compact and continue slash commands, by Session 4's lead in Diors-Builds. Measured 2026-10-08 13:14–13:48 EDT on Claude Code 2.1.293 and context-mode 1.0.169, against session `844943ce` (started 2026-10-06 21:41 EDT, four compacts). Every claim is measured unless it says **not tested** or **my suggestion**. Four Haiku sidekicks swept the stripped transcript for the parts before the last compact; every quote below was checked against the transcript.

Each part of this file is under 1,500 characters, so `ctx_search` returns any part whole and word for word. Index it once with `ctx_index(path: "<this file>", source: "compact-research")`, then pull a part with `ctx_search(queries: ["<heading words>"], source: "compact-research")`.

## The short version

1. The platform's compaction summary covers the stretch since the last compact, plus whatever the previous summary carried. Each compact summarises a summary, so detail decays.
2. The transcript JSONL is the only complete record of the session.
3. `~/.claude/haiku/strip-transcript.sh` drops about half of what the person said: every mid-turn message and every popup answer. A tested patch is below.
4. context-mode's own resume recipe fails on a long session: user prompts are evicted at its 1,000-event cap, `sort: "timeline"` returns the oldest matches, and auto-memory ignores `source:`.
5. context-mode searches are throttled: 3 full calls per 60 seconds, then 1 result per query, refused after 8.
6. A SessionStart hook's output over the cap reaches the model as a ~2KB preview.
7. What worked: a handoff file with a short "resume here" checklist, in parts under 1,500 characters, read by one relevance `ctx_search` per source, plus the person's words from the transcript.
8. An automatic compact can land mid-step, so the summary's "next step" may already be done.

## What a new context receives after a compact

| Carrier | How it arrives | Measured here |
|---|---|---|
| Platform summary | first user message, "This session is being continued…" | 11–25KB, nine numbered sections, ends with the transcript path |
| Recent tail | messages after the summary, kept verbatim | the summary is written without seeing them |
| CLAUDE.md and its imports | system reminder | re-injected in full |
| SessionStart:compact hooks | `additionalContext` | `.remember` LAST HANDOFF, linksee anchors, memory-index and notes checks |
| context-mode session guide | SessionStart, `<session_knowledge source="compact">` | 21KB, saved to a file; a ~2KB preview reached the model |
| Deferred tool schemas | the deferred list is re-sent | I re-loaded them with one ToolSearch; direct calls without it **not tested** |

## The platform summary: four compacts measured

From the `compact_boundary` entries in the transcript:

| # | Trigger | When (EDT) | Tokens before | Tokens after | Summary chars | Names a 10-06 date |
|---|---|---|---|---|---|---|
| 1 | auto | 10-06 21:48 | 967,776 | 32,454 | 18,026 | yes |
| 2 | auto | 10-07 16:23 | 970,450 | 43,251 | 25,144 | yes |
| 3 | manual | 10-07 20:47 | 903,098 | not recorded | 11,067 | no |
| 4 | auto | 10-08 13:15 | 969,013 | 31,065 | 22,642 | no |

- Automatic compacts fired at about 967–970k tokens of the 1M window.
- A fresh context starts at about 31–43k tokens.
- `cumulativeDroppedTokens` after four compacts: 3,675,126.

## Why each summary forgets more

At compact N, the raw messages from before compact N-1 are already gone, so the summariser sees only summary N-1 plus the messages since. That is by construction, and the measurements agree:

- Summary 3 names no 10-06 date at all.
- Summary 4 states its own range as "2026-10-07 evening to 2026-10-08 13:13 EDT".
- Names carry forward (a component first built on 10-06, `CollapseButton`, still appears in summary 4); dates, reasons and detail do not.
- The manual compact, run with a KEEP focus text, produced the shortest summary (11KB). Whether the focus text caused that is **not tested**.

So anything that must survive more than one compact belongs in a file, never only in the summary.

## The summary's shape and its traps

Its sections: 1 Primary Request and Intent · 2 Key Technical Concepts · 3 Files and Code Sections · 4 Errors and fixes · 5 Problem Solving · 6 All user messages · 7 Pending Tasks · 8 Current Work · 9 Optional Next Step. It ends with the transcript path and "Continue the conversation from where it left off without asking the user any further questions".

Traps seen:

- Section 6 holds only the messages since the last compact, despite its name.
- After an automatic compact mid-step, section 9 can be stale. This time it said to re-send the paste blocks for a compact that had already happened.
- The platform adds that the tail messages were kept verbatim and that something the summary says has not happened "may already have happened in them".

## Messages sent during a compact

A compact takes time: `durationMs` was 78–116 seconds here. A message the person sends in that window is filed after the summary but timestamped before it, and the summary never saw it.

Measured at compact 2 (boundary 2026-10-07 16:23:35 EDT, 115.7 seconds): two mid-turn messages, 16:22:12 and 16:23:16 EDT, sit after the summary in the file.

So "the person's words since the last compact" must start at the boundary's timestamp minus its `durationMs`, not at the boundary.

## The manual /compact and its focus text

A manual compact is stored as a user message: `<command-name>/compact</command-name>` with the focus text in `<command-args>`. The one used on 2026-10-08 00:46 UTC began:

```
KEEP: Session 4, standardising C1 through the spec board … Truth is local/pins2/s4/handoff.md § CURRENT STATE → RESUME HERE (rewritten 2026-10-07 20:02 EDT) … State: Builder-2 … HEAD 19d40ec … Decided today: …
```

Harkirat typed that paste block by hand. It is the step a slash command would replace. Pattern worth keeping: name the truth file first, then only the state that file does not already carry.

## What Harkirat asked of compact prep, in his words

| When (EDT) | His words |
|---|---|
| 10-06 21:10 | "also remember to update your handoff frequently" |
| 10-07 16:00 | "update and sync your handoff.md right now and remember.md. then 2. WHERE TF IS YOUR SEQUENTIAL-THINKING RUN???" |
| 10-07 19:59 | "everything you future self needs to know that you'd otherwise lose in the compact" |
| 10-07 20:43 | "send me the keep/discard, as well as the post-compact start?" |
| 10-07 22:46 | "make sure your handoff and remember.md are correct, sync'd, staleness fixed" |
| 10-08 12:48 | "thoroughly prep yourself for a compact so you don't drift off afterwards" |
| 10-08 13:01 | "i don't want these shit reasonings/failures repeating" |

The "keep/discard" is the `/compact` focus text; the "post-compact start" is the first message pasted after the compact. Those two paste blocks are what the commands replace.

## The transcript JSONL

Path: `~/.claude/projects/<slug>/<session-id>.jsonl`; the summary prints it. This session: 91.7MB, 9,920 lines. Entries that matter:

| What | How it is stored |
|---|---|
| Compact boundary | `type: "system"`, `subtype: "compact_boundary"`, `compactMetadata` {trigger, preTokens, postTokens, cumulativeDroppedTokens, durationMs, preCompactDiscoveredTools} |
| Compaction summary | user entry with `isCompactSummary: true` (4 here) |
| Typed message | `type: "user"`, string `message.content` |
| Mid-turn message | `type: "attachment"`, `attachment.type: "queued_command"`, text in `attachment.prompt`; `attachment.origin.kind` is "human" (49) or "task-notification" (8) |
| Popup answer | the AskUserQuestion tool result, `toolUseResult.answers` = {question: answer} (3 entries) |
| Time | `timestamp` on every entry, UTC ISO |

`ctx_execute_file` can read it because the settings allow `Read(/Users/harkirat/.claude/projects/**)`; `jq` works too.

## strip-transcript.sh: what it keeps and drops

The Haiku guide's compact-prep recipe starts with `bash ~/.claude/haiku/strip-transcript.sh <transcript.jsonl> <out.txt>`. On this session it made 3,325 lines and 250KB from 91.7MB.

- **Keeps:** typed user messages, Claude's text, thread replies, tool errors, compaction summaries.
- **Confirmed:** its header assumes `isCompactSummary` exists on a compacted transcript; it does.
- **Drops all 49 human mid-turn messages.** Example: his 2026-10-08 13:17 EDT message "i was basically just looking at their claude.md" is absent from its output. In this session he typed 46 messages normally and 49 mid-turn, so about half his words are missing. Six of those carry pasted screenshots as base64 (up to ~75KB each).
- **Drops popup answers,** because they are tool results.
- **No timestamps,** so "since the last compact" can only be found by the last `COMPACT:` line.
- It numbers physical lines (`nl`), so a multi-line message has its prefix on the first line only.

## A tested patch for strip-transcript.sh

Three branches added to its `jq` program, placed before the existing `.type == "user"` branches. A `def ts:` helper prefixes the lines with time:

```jq
def ts: "[" + ((.timestamp // "")[0:16]) + "Z] ";
…
elif .type == "attachment" and .attachment.type == "queued_command"
     and (.attachment.origin.kind? == "human")
  then ts + "USER_MIDTURN: " + (.attachment.prompt | if type == "array"
       then (map(if .type == "text" then .text elif .type == "image"
       then "[image]" else "[" + .type + "]" end) | join(" "))
       else tostring end)
elif .type == "user" and ((.toolUseResult | type) == "object")
     and (.toolUseResult.answers != null)
  then ts + "USER_ANSWER: " + (.toolUseResult.answers | to_entries
       | map(.key + " => " + (.value | tostring)) | join(" || "))
```

For an array prompt, map each block: text to its text, an image to `[image]`. Also prefix `ts` on the `COMPACT:` and string `USER:` lines.

Tested on this session: 49 USER_MIDTURN (6 with `[image]`), 3 USER_ANSWER, 4 COMPACT, the 13:17 message found; 3,446 lines and 264KB, only 14KB more than the original. I did not edit the real script, because the slash-command session may own it.

## context-mode: the two sort modes

- **relevance** (default): BM25 over the project's content store, `~/.claude/context-mode/content/<hash>.db`. Every session in the project writes to that store, and its results are labelled "current-session" even when another session indexed them; a 2026-10-01 chunk came back labelled that way.
- **timeline:** merges the content store, the session-event database (every session's events, labelled "prior-session") and auto-memory (CLAUDE.md, MEMORY.md). It sorts ascending by timestamp and keeps the first `limit` (`src/search/unified.ts`: `results.sort((a, b) => a.timestamp.localeCompare(b.timestamp))`, then `slice(0, limit)`). **So timeline returns the oldest matches.**

`ctx_search` takes queries, source, sort, limit, contentType and project. There is no date parameter. A date written in the query text works when the indexed parts carry dated headings.

## context-mode: what `source:` filters

- **Content store:** `sources.label LIKE %source%`, a partial match on the label.
- **Session events (timeline only):** the value is matched against the event's data or category.
- **Auto-memory:** not filtered. A timeline search with source "s4-handoff" and query "RESUME HERE" returned CLAUDE.md chunks.

Consequences seen:

- Source "decision" in relevance mode returned our file `docs/reference/portal-decision-ledger.md`, not decision events.
- A label that is a substring of another matches both. Our handoff was indexed as "s4-handoff" and, by a repo hook, as "project:dioreo-s4-handoff", so every part came back twice and a limit of 2 gave one distinct part. Pick labels that are not substrings of other labels.

## context-mode: the session-event cap

- `MAX_EVENTS_PER_SESSION = 1000` in `src/session/db.ts`. It is a constant, not an environment setting.
- At the cap, the oldest event of the lowest priority is evicted.
- User prompts are saved at priority 1, the lowest (the plugin's `userpromptsubmit.mjs` hook).
- This session sat at exactly 1,000 events: priority 2 ×440, 3 ×482, 4 ×78, and none at 1.
- So in a long session the person's messages are evicted within a few tool calls. A short session (42 events) still held its prompts.

Harkirat's call (2026-10-08 13:40 EDT): leave the plugin as it is.

## context-mode: the other categories here

| Category | Events | Content |
|---|---|---|
| decision | 16 | his popup answers and some of his messages, cut near 100–150 characters; a few are my reply text |
| rejected-approach | 11 | all "Redirected to context-mode sandbox" |
| constraint | 5 | stack traces and one of my reasoning lines |
| user-prompt | 0 | evicted (see the cap) |
| compaction | 0 | not an event; stored separately (next part) |

## context-mode: compaction snapshot and session guide

- PreCompact writes one `session_resume` row per session, replaced at each compact: XML `<session_resume events="1000" compact_count="4">` with search instructions, errors and more. Here it was 381KB.
- SessionStart injects it as `<session_knowledge source="compact"><session_guide>`, with sections Key Decisions, Unresolved Errors, Git, Subagent Tasks, Skills Used, Environment, Data References and Session Intent, plus `<session_state source="compaction"><rules>`.
- Here that was 21KB, over the hook-output cap, so it was written to `tool-results/hook-…-additionalContext.txt` and only a ~2KB preview reached the model.
- Its Key Decisions were cut-off fragments of messages, and Session Intent read "investigate".

## context-mode: the author's own resume recipe

The plugin's repo CLAUDE.md (github.com/mksglu/context-mode) has a "Memory" table: `source` compaction, user-prompt, decision, rejected-approach and constraint, mostly with `sort: "timeline"`, and "DO NOT ask what were we working on? SEARCH FIRST".

It should work on a short session. On ours, every row misses:

- user-prompt is empty because of the cap;
- compaction is not searchable;
- timeline returns the oldest matches;
- auto-memory comes back whatever source is named.

Its "Session Continuity" section is one sentence.

## context-mode: throttle and file limits

- **Throttle,** per agent context: a 60-second rolling window (`CONTEXT_MODE_SEARCH_WINDOW_MS`); full results for 3 calls (`CONTEXT_MODE_SEARCH_MAX_RESULTS_AFTER`); then 1 result per query; refused after 8 (`CONTEXT_MODE_SEARCH_BLOCK_AFTER`). An array of queries counts as one call.
- **Outside the project:** `ctx_execute_file` refuses paths outside the project root unless a Read allow rule covers them (plugin issue #852); `ctx_execute` with `fs` can read anywhere.
- **Removing a label:** `ctx_index` refuses `content: ""`; a single space empties the label.
- **Chunk size:** a part under 1,500 characters comes back whole and word for word (measured 2026-10-04); a larger one comes back as a window.
- **Freshness:** a path-indexed source refreshes itself before a search when its file changed.

## What worked as the resume route

- `local/pins2/s4/handoff.md` § CURRENT STATE, rewritten at every state change, in headed parts under 1,500 characters. Its "RESUME HERE · before every reply" checklist is 1,304 characters. Eleven older parts in the same file are over 1,500 and come back cut.
- `.remember/remember.md` as a pointer only, carrying no state (3.7KB); it is injected at compact.
- `local/pins2/s4/work/lead/conventions.md`: rules with numbers, so a question can be answered by citing a rule instead of asking.
- One relevance `ctx_search` per source with every query in the array: it returned the checklist and the traps word for word after the compact.
- The person's exact words from the transcript, never from a summary.

Recorded as linksee anchor #84, which supersedes #81.

## Failures right after a compact

- **Compact 1** (2026-10-06 21:48 EDT): the summary's next step was a render bug; his first message after it was "fix this divider gap too". A new message outranks the summary's plan.
- **Compact 3** (manual, 2026-10-07 20:47 EDT): the first run failed on paths and modules ("Cannot find module 'puppeteer'"); at 21:04 he asked "so whats going on? what are we doing now?"; at 22:07 I re-asked something settled ("i thought --quiet was decided already"). He said "or you could check the transcript." and "launch a sonnet 5.5 ready only subagent to check within last 2 compacts." That check showed four of the five open questions were already decided.
- **Compact 3's start message** told the next context to read the handoff with linksee `read_smart`, after context-mode had been settled for that job.
- **Compact 4** (automatic, 2026-10-08 13:15 EDT) landed mid-step; the summary's next step (re-send the paste blocks) was already moot.

## Failures in the prep, and in what the summary carried

- Standing rules evolve, and a carrier that copies old wording forward keeps the old rule alive. "Never show or ask" about line height and letter spacing (from his "don't even tell me or mention it") became "show them as measurements when I ask" on 2026-10-08 11:38 EDT. Date every rule and keep only its latest form.
- The thinking pass was skipped before a prep, and he had to ask for the handoff sync himself.
- Records edits failed on stale anchors after earlier edits had moved the text.
- I concluded the plugin's recipe "doesn't work" from three sampled outputs before reading its source.
- Duplicate index labels halved search results.
- Every manual compact needed two hand-typed paste blocks.

## My suggestions for a compact-prep command

1. Run the repo's carrier check (`npm run handoff` here).
2. Rewrite the handoff's current-state block and measure every part; fail loudly on any part of 1,500 characters or more.
3. Strip the transcript since the last compact boundary with the patched stripper, split it into chunks under 150KB, and send each to a Haiku sidekick per `~/.claude/haiku/haiku-5-5-sidekick-guide.md`'s compact-prep recipe; judge the extracts against the handoff.
4. Refresh the `.remember` pointer, never with state.
5. Re-index the handoff under a label that is not a substring of another.
6. Print a `/compact` focus text that names the truth file and lists only what that file does not carry.

## My suggestions for a resume command

1. Read the handoff's resume part with one relevance `ctx_search`, every query in the array, under a unique label.
2. Print the person's words since the last compact started (the `compact_boundary` timestamp minus its `durationMs`) from the JSONL: typed, mid-turn and popup answers, with timestamps.
3. Treat the summary's "next step" as a claim: check git and file state before acting on it.
4. Skip `sort: "timeline"` and context-mode's resume recipe.
5. Re-load deferred tools in one ToolSearch.
6. Check the sentinels that prove the imports arrived (`WORKING-AGREEMENT-END`, `MEMORY-INDEX-END`).
7. Open the first reply with where things stand and what is next, so the person never has to ask "what are we doing now?".
8. Before asking anything, check the handoff and his words for an answer; a question the records settle is the most common post-compact miss here.

## Not tested

- Whether timeline's event search includes the current session; every event comes back labelled "prior-session".
- Whether deferred tools can be called after a compact without a ToolSearch.
- Whether a `/compact` focus text changes the summary's length or content.
- The hook-output cap's exact size: the 21KB guide arrived as ~2KB, and the repo's notes say about 10KB.
