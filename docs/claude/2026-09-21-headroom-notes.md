---
kind: record
status: frozen
---

# Headroom — full notes, 2026-09-21 13:36 EDT

Read in full via `llms-full.txt` (all ~50 doc pages, 590KB) plus `headroom-ai` 0.37.0's own source. Machine state as of this session: MCP tools registered (both CLI + desktop), no forced env routing, persistent proxy running on port 8790 for `headroom wrap claude` to reuse.

## What it actually is
A context-compression layer for LLM apps: compress tool outputs, DB results, file reads, RAG results before they reach the model. Two integration surfaces, three deployment shapes.

## The compressors (ContentRouter auto-detects, routes to the right one — zero config)
| Compressor | Handles | How |
|---|---|---|
| **SmartCrusher** | JSON arrays (tool outputs) | **Lossless-first**: if the array is cleanly tabular, tries columnar/dedup compaction before ever dropping data. Falls back to importance-scored dropping only if that doesn't fit budget. |
| **CodeAwareCompressor** | Source code | AST-aware (tree-sitter) — preserves signatures/imports/types, collapses bodies. Off by default in the library `compress()` path, on by default via the proxy. |
| **LogCompressor** | Build/test logs | Keeps failures/errors, drops passing noise. |
| **SearchCompressor** | `file:line:content` search results | Ranks by relevance, keeps top matches. |
| **DiffCompressor** | Unified diffs | Keeps change hunks, drops unchanged context. |
| **HTMLExtractor** | HTML | Strips nav/ads/scripts, keeps main content. |
| **ConfigCompressor** | YAML/TOML/INI | Structure-aware. |
| **Kompress** | Plain unstructured text (fallback) | ModernBERT model (`chopratejas/kompress-v2-base`), scores tokens, drops low-signal ones. Hard-coded MUST-KEEP regex protects numbers, hex, ALLCAPS, dotted.paths, unix paths, extensions, CLI flags, CamelCase. **Needs `headroom-ai[ml]` (torch+transformers) — not installed here, so this one compressor is currently a passthrough.** |

## What it guarantees to NEVER touch
Your prompt text · system prompts (unless a savings profile opts in) · code (unless AST compression explicitly enabled) · model responses · content below the minimum-token threshold.

## CCR — Compress-Cache-Retrieve (the "nothing is lost" mechanism)
Every compression's original is cached locally (1hr TTL via MCP, 30min via proxy, configurable). The model gets a `headroom_retrieve` tool/hash to pull the full original back on demand. `--lossless` and `--no-ccr` are different contracts (format-native lossless mode vs. disabling CCR entirely) — don't conflate them.

## TOIN — Tool Output Intelligence Network
Learns which fields matter for a given tool *over repeated calls* (which items get retrieved, which fields carry signal) and feeds that back into SmartCrusher's scoring — compression gets sharper for tools you actually use over time. **Local and observation-only** — aggregates stats on your own machine/proxy instance, nothing shared across users.

## Failure Learning (`headroom learn`)
A completely separate feature from compression: reads past agent sessions, finds failed tool calls, correlates with what succeeded afterward, and writes the corrections into your `CLAUDE.md`/`AGENTS.md`. Not installed/configured in this session — worth a look separately if you want it.

## Automatic vs. manual — the actual split
| Mechanism | Automatic or manual? | Scope |
|---|---|---|
| **Proxy** (`ANTHROPIC_BASE_URL` → local proxy) | **Automatic** — compresses everything before the model sees it, zero LLM choice involved | **Terminal `claude` CLI only.** Confirmed via `headroom doctor`'s own `check_claude_desktop`: "Claude Desktop unconditionally overwrites ANTHROPIC_BASE_URL when it spawns agent sessions" (issue #869, unfixed in 0.37.0). **This is nowhere in the public docs** — grepped all 590KB of `llms-full.txt` for "desktop overwrites" / "bypass" and got zero hits. Only the CLI's own `doctor` command discloses it. |
| **MCP tools** `headroom_compress`/`retrieve`/`stats` | **Manual** — "the LLM calls this when it wants to" (their words) | Both CLI and Desktop — registered in `~/.claude.json`, unrelated to the base-URL routing. |
| **`headroom wrap claude`** | Automatic once launched, opt-in per session | CLI only — starts/reuses the proxy, sets env for that one process, launches `claude`. This is the correct scoped mechanism for CLI compression, not a durable global write. |

## Savings profiles & tuning knobs
`HEADROOM_SAVINGS_PROFILE` (default `coding`) seeds the whole compression posture at proxy startup — mode, keep-ratio, which message roles get compressed, `force_kompress`. An unrecognized profile name just warns and falls back to `coding`, never fails startup. Per-request overrides: `headroom_mode`, `headroom_keep_turns` (default 2 — last N turns always left uncompressed), `target_ratio` (Kompress's keep-ratio knob). Known gap in 0.37.0: `headroom_tool_profiles` is accepted but not wired through yet (docs say so explicitly).

## Framework integrations (beyond MCP/proxy)
LangChain (`HeadroomChatModel`), Agno (`HeadroomAgnoModel`), Strands, CrewAI, AutoGen, Vercel AI SDK (`withHeadroom()`), TypeScript SDK, and direct OpenAI/Anthropic client wrappers. All route through the same proxy or the same `compress()` pipeline — nothing conceptually different from what's above.

## What's currently live on this machine
- MCP tools registered for Claude Code (`~/.claude.json` → `mcpServers.headroom`), work in both CLI and Desktop.
- Persistent proxy running: profile `hr8790`, port 8790, launchd-supervised (`RunAtLoad` + 5-min watchdog), healthy.
- No forced `ANTHROPIC_BASE_URL` anywhere — desktop and default CLI launches are untouched.
- To get proxy-level automatic compression for a CLI session: `headroom wrap claude`.
- `kompress` backend not installed (`[ml]` extra) — plain-text fallback compression is a passthrough until/unless that's added.
