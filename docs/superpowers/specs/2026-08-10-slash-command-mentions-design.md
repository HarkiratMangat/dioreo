---
kind: spec
status: frozen
---

# Native slash-command mentions — design

*Dated snapshot of what was decided on 2026-08-10 and why. Superseded by a new dated spec if the design changes materially — this file is not edited after the fact.*

## Motivation

Harkirat found that Discord's [message-formatting reference](https://docs.discord.com/developers/reference#message-formatting) supports a real clickable slash-command mention token — `</name:id>` — and confirmed it firsthand: putting `</colors:1535730339383611444>` in the dev bot's bio rendered as a clickable pill that types `/colors` into the chat box. `/help` (`commands/help.js`) and a handful of other commands currently reference other commands as plain backtick text (`` `/settings` ``); this design upgrades the highest-value spots to real mentions.

## Format reference (verified against the docs page directly, not from memory)

| Type | Format | Example |
|---|---|---|
| Command | `</NAME:ID>` | `</airhorn:816437322781949972>` |
| Subcommand | `</NAME SUBCOMMAND:ID>` | `</foo bar:123456789012345678>` |
| Subcommand group | `</NAME GROUP SUBCOMMAND:ID>` | `</foo group bar:123456789012345678>` |

The load-bearing fact: a subcommand mention still uses the **top-level command's ID** — there is no separate ID per subcommand. `/draw prices` (base command `draw`, subcommand `prices` — `commands/drawprices.js`), `/patch notes` (base `patch`), and `/season end` (base `season`) all mention using their base command's single ID. Discord fails silently on a bad mention (wrong ID, wrong name, extra space, or backtick-wrapped) — it just renders the literal text with no error, indistinguishable from a typo.

## Decision 1: where command IDs come from

`index.js`'s `handleBotReady()` already does `const response = await rest.put(Routes.applicationCommands(client.user.id), { body: payload })` on every boot to register all commands (including the 9 built inline — `/all` plus the 8 dynamic per-category weapon commands — which live outside `commands/*.js` and are invisible to a folder sweep). That `response` is an array of the full registered command objects, each carrying its real `id` — no extra API call needed.

Right after that call, build a `Map<name, id>` from `response` (top-level command names only) and store it on `client.commandIds`, next to where `client.gateableCommandNames` is already derived from the same `commands` array a few lines above. Refreshed every boot, same as the emoji-id and gateable-name refreshes right next to it.

**Rejected:**
- A separate `client.application.commands.fetch()` call after registration — same data, one extra network round-trip for nothing.
- Hardcoded ID constants (matching how `MASCOT_URL`/`INSTALL_URL` are hardcoded) — breaks immediately, since the dev bot and prod bot are separate Discord applications with different IDs for the same command names. This is the exact failure mode CLAUDE.md already documents for emoji IDs ("module-level literals freeze stale PROD ids").

## Decision 2: a render-time helper, fail-soft

New utility `utils/commandMentions.js`, exporting `mentionCommand(client, '/draw prices')` → `` </draw prices:123...> `` when the base command's ID is known, or the identical `` `/draw prices` `` backtick text used today when it isn't (bot hasn't finished a boot cycle, or that boot's registration call failed). Resolved fresh at render time from `client.commandIds`, never baked into a module-level constant — same convention as `utils/emojiMap.js`'s render-time emoji resolution, for the same reason (a value only known after `ClientReady`/registration must never be frozen at `require()` time).

## Decision 3: scope — what actually changes

**In scope:**
- `commands/help.js`: the landing page's category/command directory, and each detail page's `` ### `/cmd` `` heading — converted to real mentions. `CATEGORY_DEFS` itself is untouched (still just plain name strings); the conversion happens inside `buildContainer` and the body-builder functions, which already run per-render with `interaction` in scope.
- Cross-reference call sites — one command's UI text naming a sibling command, currently backtick text:
  - `commands/drawprices.js:485` and `commands/calendar.js:275` — "Tip: check out `/settings`"
  - `commands/calendar.js:301` — option description referencing `/settings`
  - `commands/server.js:419` (and the `/settings` mention at `server.js:93`)
  - `commands/manage.js:366` — "Fastest path: `/autobuild`"
  - `utils/autobuildPipeline.js` (several lines) — "Run `/autobuild` again"
  - `commands/alerts.js:144` — admin-only rejection message

**Explicitly out of scope (Harkirat's call, 2026-08-10 22:50 EDT):**
- `/help`'s Examples lines (e.g. `**/all** weapon:\`AK117\``) — a mention can't pre-fill option values, and stacking a live mention next to hand-typed example values needs its own visual pass. Parked, not a hard no — may revisit later.
- Anywhere else bot-wide beyond the cross-reference list above — none found in `commands/*.js` or `utils/*.js` outside `/help` and this list.

## Verification

Discord's silent-failure-on-bad-mention behavior is exactly what makes this easy to ship broken without noticing. Before calling this done: boot the local dev bot (`node --watch --env-file=.env.dev index.js`) and visually check, in actual Discord —
- `/help`'s landing directory and every detail page, especially `/draw prices`, `/patch notes`, and `/season end` (the subcommand cases)
- Each of the six cross-reference spots above

— confirming each renders as a real clickable pill, not literal text.
