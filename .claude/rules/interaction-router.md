---
paths:
  - "index.js"
---

# `index.js` — the interaction router (crash-safety, synthetic interactions, routing)

*Loads when you touch `index.js` (the ~2,700-line `interactionCreate` handler + boot/registration).
The survival rules you need whenever editing the router. Per-subsystem handler DETAIL lives in the
matching subsystem rule (`manage-panel.md`, `settings-and-expiry.md`, `loadouts.md`,
`accent-and-colors.md`, `draw-prices.md`, `loadout-images-and-metadata.md`, `autobuild.md`). The
`/manage` admin-guard and per-user `/settings`/`colors` locks are choke-pointed HERE but documented in
those rules. ⚠️ index.js is a candidate for a future split into `handlers/*.js` — see `docs/ROADMAP.md`.*

## Crash resilience
`index.js`'s entire `interactionCreate` handler (~650 lines) is wrapped in a single
top-level `try/catch` that just logs to console on error. This was added after a real
crash: a button interaction whose token had already expired (Discord error 10062,
`Unknown interaction`) threw an unhandled rejection that took the whole bot offline
until a manual restart. Interaction tokens are only valid for a few seconds/minutes, so
this kind of failure is expected to happen occasionally under normal use — the handler
should degrade to "that one click didn't work," never "the bot crashed." If you add new
branches to this handler, you don't need your own try/catch around them (the outer one
covers it), but don't let anything inside intentionally rethrow past it.

**`client.on('error', ...)` MUST be registered, or a rejection can crash the bot even with the
outer try/catch in place (found locally, 2026-07-07).** discord.js's `BaseClient` constructs
itself with `super({ captureRejections: true })` — a Node `EventEmitter` option that reroutes a
rejected promise from an async event listener (our `client.on('interactionCreate', async
interaction => {...})`) into an `error` event emitted **on the client itself**, instead of
surfacing through Node's normal `process.on('unhandledRejection')`. With no listener for a plain
`error` event on the client, EventEmitter's default behavior for an unhandled `error` event is to
throw synchronously and crash the process — completely bypassing both the outer try/catch *and*
any `process.on('unhandledRejection')` net, since captureRejections intercepts the rejection before
it ever becomes a "global" unhandled rejection. This is a well-known discord.js gotcha (their own
guide calls it out) and is now fixed with a permanent `client.on('error', ...)` listener right after
the client is instantiated. If you ever see a crash log with "Emitted 'error' event on Client
instance" in the stack, this is why — check that this listener is still registered before assuming
some other Component-count/interaction-routing bug.

**The outer try/catch alone wasn't enough — a real Railway crash got past it (2026-07-07).**
A `deferReply()` failed with 10062 (`Unknown interaction`, expired token), which was caught by
the error-fallback in `index.js`'s slash-command router. That fallback then did
`return interaction.reply(...)` — but the interaction was *already* effectively acknowledged from
Discord's side, so this second call rejected too (40060 `already acknowledged`). Because it was
an unawaited `return <promise>` inside a `try` block, the `try` had already exited by the time
that promise rejected — the outer top-level `catch` above was no longer "in scope" to catch it,
and it surfaced as a raw unhandled promise rejection, which crashes the whole Node process by
default (since Node 15). Fixed by `await`-ing the fallback reply/editReply/followUp calls and
wrapping *those* in their own try/catch too. Also added a `process.on('unhandledRejection', ...)`
logger near the top of `index.js` as a last-resort net for any other unawaited
`return interaction.X(...)` call site that gets missed — **this is not a substitute for awaiting
properly**, just a backstop. The general rule: any `return interaction.reply/editReply/followUp(...)`
inside a `catch` block (or any early-return error branch) MUST be awaited (or wrapped in its own
try/catch) — a bare `return <promise>` does not keep the enclosing try/catch "listening" for that
promise's eventual rejection. Fixed at every site this pattern was found during a later review pass
(not just the original slash-command/nav-button routers): the MP loadout "no builds found" reply,
both settings security-gateway rejection replies, the nav-router "target offline" reply, and the
loadout `copy`/`copyatt` button replies — if you add a new early-return error reply anywhere in this
handler, follow the same await-and-wrap shape rather than a bare `return interaction.X(...)`.

**A "live" Render deploy is not the same as a connected bot — the Gateway handshake can silently
take 10+ minutes with zero error (found live, 2026-07-16).** MongoDB connecting and Render marking
the service `live` only confirm the process booted and the HTTP port bound — neither confirms
`Events.ClientReady` ever fired. On a real deploy, the two-line confirmation
(`handleBotReady()`'s "fully authenticated"/"routing links integrated" logs) was missing for ~14
minutes with no error on `client.login()`'s promise or the `client.on('error', ...)` handler above,
then it resolved on its own. See `DEVLOG.md`'s 2026-07-16 entry for the full investigation (ruled
out a code regression, a local stray instance, and a Railway conflict with real evidence before
concluding this). **Don't treat "Mongo connected + Render says live" as proof the bot is actually
online** — check for the two `handleBotReady()` log lines specifically, or better, check the shard
-lifecycle logs (`shardReady`/`shardResume`/`shardReconnecting`/`shardDisconnect`/`shardError`,
added the same day right after the `client.on('error', ...)` listener) for the actual Gateway
state, since a hang like this produces no other signal.


## The "synthetic interaction" pattern (button/select → reused slash command logic)
Several buttons and select menus re-invoke a slash command's own `execute()` function
instead of duplicating render logic (e.g. clicking "Draw Prices" in the nav bar calls
`drawprices.js`'s `execute()` the same way the slash command does). To make a
`ButtonInteraction`/`StringSelectMenuInteraction` look enough like the original
interaction for this to work, `index.js` builds a "synthetic interaction" via
`buildSyntheticInteraction(interaction, overrides)`.

**Do not replace this with a hand-rolled `Object.assign(Object.create(...), interaction, {...})`.**
discord.js sets `client` and `token` on every interaction via
`Object.defineProperty(this, 'client'/'token', { value })` with no `enumerable: true`.
`Object.assign` only copies *enumerable* own properties, so it silently drops both —
this caused two separate real crashes (`Cannot read properties of undefined (reading
'rest')` and a dropped-argument bug in the price-region dropdown) before the shared
helper was introduced. Always use `buildSyntheticInteraction`.

Also note: `ButtonInteraction`/`StringSelectMenuInteraction` have no `.options`
resolver at all — commands called this way get a stubbed `options` object with every
getter returning `null`, and check `interaction.isChatInputCommand()` before trusting
`interaction.options.getX()`.


## Light anti-spam cooldown (2026-07-13)
`index.js`'s single `interactionCreate` handler checks a per-user 600ms cooldown
(`interactionCooldowns` Map, `INTERACTION_COOLDOWN_MS`) at the very top, before any of the
`isAutocomplete`/`isChatInputCommand`/`isStringSelectMenu`/`isButton`/`isModalSubmit` branches —
scoped to ONLY `isButton()`/`isStringSelectMenu()` (the rapid-clickable component types; a slash
command or modal submit is a deliberate typed action, not spam-clickable the same way). An
interaction inside the window is silently swallowed (`deferUpdate().catch(() => {})` then
`return`) rather than replied to with an error — no visible change, no "This interaction failed"
toast, just a no-op. One entry per distinct user (not per click), so the Map never meaningfully
grows. Meant as a very light guard against rapid double/triple-clicking causing races (a `/manage`
confirm flow re-firing, pagination edits stacking), not a real rate-limiter. The View Colors
"Refresh Colors" button has its OWN separate, longer 10s cooldown (`colorsRefreshCooldowns`) on top
of this — see `.claude/rules/accent-and-colors.md` for why (it does real re-extraction work this generic
600ms window wouldn't meaningfully throttle).


## Command routing — `client.commands` keys & `NAV_COMMAND_ALIASES`
**Important:** `client.commands` is keyed by the exact `SlashCommandBuilder.setName()`
value. Several nav buttons use shorter custom_id suffixes than their actual command
name (e.g. button `nav_prices` → command `draw`). `index.js` has a
`NAV_COMMAND_ALIASES` map bridging these — check it before assuming
`client.commands.get(strippedCustomId)` will just work.
