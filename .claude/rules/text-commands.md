---
kind: rule
status: live
paths:
  - "utils/textCommands/**"
  - "bot/textCommands.js"
  - "handlers/textCommands.js"
---

# Text commands — `@Dioreo today`, `d today`, `dior today`, `/today`

*Loads when you touch the parser, the adapter, the listener or the two buttons. Written 2026-10-28 22:13 EDT from the code's own comments; the design is `docs/superpowers/specs/2026-10-28-text-commands-design.md` and the build plan `docs/superpowers/plans/2026-10-28-text-commands.md`. Every decision named here is Harkirat's and settled.*

## Why they exist

A server can switch off Use Application Commands, and a server with more than about 50 bots stops listing newer bots' slash commands (「𝐆𝐇𝐎𝐒𝐓」, 54 bots, 2026-10-28 15:54 EDT). A text command is an ordinary message, so neither applies, and the buttons on its reply still work where app commands are denied (spike, 2026-10-28 16:31 EDT). It is an **exception to root CLAUDE.md's "the bot answers ONLY through interactions"**: the answer is an ordinary channel message, sent only when someone addressed Dioreo.

## Where the code lives

| Part | File |
|---|---|
| Listener (`messageCreate`, edits within 60 s), limits, can't-post DM, help / Did you mean / emoji cards, dev timing log | `bot/textCommands.js` |
| Parser: does this message address Dioreo, and with what command | `utils/textCommands/parse.js` (pure, no discord.js) |
| Which commands, and every spelling of each | `utils/textCommands/commands.js` |
| The fake interaction a command's own `execute()` answers | `utils/textCommands/adapter.js` |
| The server's Integrations switches | `utils/textCommands/permissions.js` |
| The `txtpriv_` / `txtrun_` buttons | `handlers/textCommands.js` |
| The text branch of a send, and of the idle grey-out | `utils/sendV2Payload.js`, `utils/passiveExpiry.js` |
| Analytics `entry: 'text'` and `via` | `utils/eventStore.js`, `models/AnalyticsEvent.js` |

## The chat guard: when Dioreo answers, and when it stays silent

🔴 **The principle (think-pass, 2026-10-28 16:46 EDT): a channel is shared space, unlike a slash command, which is explicit. When it is unclear whether a message is meant for Dioreo, stay silent.** The one loud path is a message that STARTS with a mention of the bot itself.

- **Only a LEADING mention counts.** A reply to a Dioreo message pings the bot too, and "thanks" under a panel must not summon a help card.
- **Ignored outright:** bots, webhooks, system messages, DMs (no `guildId`), and anything on Dioreo Admin, whose client never registers the listener (`index.js` wires it on the public client only).
- **Prefixes are longest first,** so `dior` is never read as `d` + `ior`. A word prefix glued to the command (`dtoday`) must be followed by a letter; `d.` or `d123` is chat.
- **Typos are forgiven only when the message clearly addresses Dioreo** (a mention, the bot's role, or `/`) **or the prefix is followed by a space** (`d todya`). Glued forms must be exact, or `d` + `raws` would fire on the plain word "draws".
- **A stray key or two after a command is forgiven** (`dior draws o`); longer trailing text after `d`/`dior` is chat (`d today is cold lol`) and gets nothing. After a mention or `/`, an exact command still runs with trailing text, and a typo'd one with trailing text gets Did you mean.
- **A bare mention (or a bare `/`), or one or two unknown words after a mention,** gets the help card or Did you mean. **Three or more words after a mention with no command** is someone talking TO Dioreo (`@Dioreo is the best bot`) and gets a reply holding one app emoji, `MentionReply`, read by name at reply time, with 👋 until he uploads it (his call, 2026-10-28 17:04 EDT). Any other unrecognised message, after any trigger but a mention, is silent.
- **The bot's managed ROLE mentioned without Message Content** arrives with no text at all (spike, 2026-10-28 16:37 EDT), so it gets a one-line hint to mention the bot instead.
- **An edit within 60 s** that turns a message into a command runs it, but only if the first version got no answer (think-pass, 2026-10-28 16:46 EDT).

### The typo limits, and the measurement behind them

Damerau-Levenshtein (optimal string alignment), because a swapped pair of letters is the commonest phone typo and costs 1. The **first letter must always match.**

| Command word | Allowed |
|---|---|
| 4 letters or fewer | one swap only: same length, same letters |
| 5 to 7 letters | distance 1 |
| 8 letters or more | distance 2 |

Measured 2026-10-28 16:44 EDT against `/usr/share/dict/words`: distance 2 on six-letter words matched real chat words (remind/mind, season/lesson, settings/getting, invite/ignite), so 2 is kept for 8+ letters, and the first-letter rule removed every one of those.

### Limits

| Limit | What happens |
|---|---|
| Same command, same person, within 5 s | one "⏳ You can run `x` again <t:…:R>" note, a reply that deletes itself when the wait ends; further repeats get nothing |
| A different command within 1 s | nothing, no warning |
| One channel | at most 5 replies per 10 s |

His rule, 2026-10-28 18:10 EDT: *"a 5 second per person limit if it's the same command (with a warning message and countdown within the message, the message then deletes itself) and 1 second for any command that's not the same (no warning needed)"*. The countdown is Discord's own relative timestamp, which every client counts down live. All of this lives in memory and a restart forgets it.

## The adapter's three rules (`utils/textCommands/adapter.js`)

An adapter rather than a second renderer per command, because every command already builds its panel, reads /settings, applies the server's /admin rules and arms the idle grey-out; a second renderer would duplicate all of that and drift. The first send REPLIES to the member's message, and every later send edits that reply, the way a slash command edits `@original`. Each rule is his:

1. **Public by default.** A text command ignores the member's /settings Hidden (2026-10-28 17:14 EDT: *"why dont we just default to public for @mention or prefix commands"*), because typing in a channel is already public, so the ephemeral flag a command passes is dropped. `utils/sendV2Payload.js` drops the Show Everyone row too: the reply is public already.
2. **Except where the SERVER's `/admin` rule forces hidden** (`attachGuildPolicy` sets `dioreoPolicy.visibility`). A message can never be private, so the answer becomes the **Open privately** card instead, and every later send is swallowed: nothing private is ever posted publicly.
3. **Never pings:** `replied_user` is always false and `allowed_mentions` defaults to none.

A command that opens a pop-up first cannot do that from a message (Discord opens a modal only in answer to an interaction), so `showModal` throws `TextCommandRefused` and the listener answers with the slash command to use. The reply greys out after 10 idle minutes like a slash reply, edited with the bot token, which never expires (`utils/passiveExpiry.js`).

## The two buttons (`handlers/textCommands.js`)

- **`txtpriv_<command>`, Open privately**, on the card where the server's rule makes answers private. Anyone may click: it opens THEIR OWN view, hidden, so it needs no lock (think-pass, 2026-10-28 16:46 EDT).
- **`txtrun_<command>`, a Did you mean pick**, runs the command publicly, the way the member meant to. A two-word command travels as `patch.notes` (`toIdPart`). Since B2 both ids can carry `~<payload>` (the options, a reply form's target, or the timestamp pop-up's `open` / `submit`): see Options below.
- Both re-check the server's Integrations switches for the command they run, and re-resolve the `/admin` policy with that command's own name (security review, 2026-10-28 17:29 EDT: the router resolved it for a button, which has no `commandName`, so the command tier was skipped). The click is acknowledged BEFORE the synthetic copy is made, because `buildSyntheticInteraction` copies `deferred` as a value.

## Prefixes, and the dev bot

The prefixes come from env `TEXT_PREFIXES`: unset means `/,d,dior` (Harkirat, 2026-10-28 16:21 EDT: `d`/`dior` rather than `d!`, because `!` needs a keyboard switch on mobile). `.env.dev` sets `TEXT_PREFIXES=dd,diordev`, because prod and dev are both in Dioreoland and would otherwise both answer `d today` (think-pass, 2026-10-28 16:44 EDT). Prefixes work only where Message Content is granted; a mention always works.

## Intents and the Message Content flag check

The public client runs `Guilds` + `GuildMessages` (`index.js`). `enableMessageContentIfGranted` in `bot/textCommands.js` reads the app's flags before login and adds `MessageContent` only when bit 18 (granted) or bit 19 (allowed below 100 servers) is set, because asking for a privileged intent the app doesn't have makes login fail with "disallowed intents". It sets `client.textMessageContent`, which the help card and the role hint read. Without it, only `@Dioreo …` works: Discord sends a message's text to a bot only when the message mentions it. Message Content is a portal toggle under 100 servers even for a verified bot; he turned it on for both apps 2026-10-28 17:09 EDT.

## Message cache 0, and the sweepers

`GuildMessages` makes Discord send an event for every message in every server Dioreo is in, so messages are never cached (`MessageManager: 0`) and the users and members those events drag in are swept hourly, keeping only Dioreo's own member: the VM is an e2-micro. `Partials.Message` lets an edited message arrive without the original in cache, for the one-minute edit window.

## Where Dioreo can't post

- **No View Channel or Send Messages (Send Messages in Threads in a thread):** the member gets ONE DM, at most once per channel per day: "I can't post in #channel. Ask a server admin to let me send messages there, or try another channel." Held in memory only, so a restart forgets it and nothing is stored (Harkirat, 2026-10-28 17:18 EDT). If their DMs are closed, nothing else can reach them.
- **Read Message History denied:** a reply is refused with 50013 (think-pass, 2026-10-28 17:58 EDT), so the same body is sent once more as a plain message, both in the listener's own `reply()` and in the adapter's `send()`.
- **`/colors`' swatch images need Attach Files in the channel**, because they go out as files on the reply.

## The server's command permissions (`utils/textCommands/permissions.js`)

His yes, 2026-10-28 17:52 EDT: *"yes, the admin commands should be able to restrict @mention and prefix commands as well"*. A text command obeys Server Settings → Integrations → Dioreo, per command or for the whole app, by role, member and channel, resolved in Discord's documented order: member over role over @everyone, a channel over all channels, the command over the app, Administrator bypasses all of it, anything unset is allowed.

- **Deliberately NOT checked: the channel-wide Use Application Commands permission.** That is the block text commands exist to get around. An admin who wants Dioreo out of a channel denies its Send Messages there.
- **Fails closed** (security review, 2026-10-28 17:55 EDT): if Discord can't be asked, or the server has overrides but this command's id or the member is unknown, the text command stays silent. A failure to read is cached for a minute too.
- **A one-minute cache, dropped on `applicationCommandPermissionsUpdate`**, so a switch an admin just flipped bites on the next message. A read that started before an update must not be cached over it (security review, 17:56 EDT), which is what the per-guild generation counter is for.
- A denied text command is silent, the same as the slash command simply not being there for that member; a denied button click says so privately.

## Attribution and analytics

`runTextCommand` builds its context with `handlers/router.js`'s `buildInteractionContext`, sets `handler: 'textCommands'`, and runs inside `runWithContext`, so log lines carry the same attribution as a slash command's. It writes one `AnalyticsEvent` from its `finally` with `entry: 'text'` and `via` (`mention`, `role`, `/`, `d`, `dior` or the env's own prefixes, with `+typo` when a near-miss word ran). Nothing from the message is stored. After the command has run (never when it threw) it calls `utils/userStats.js`'s `noteOwnCommandSafely`, exactly as the router's slash route does, so a text command sets "Dioreo User Since" and counts in Your Stats (Harkirat, 2026-10-28 22:19 EDT). On the dev bot only, one `⌨️` line per text command says where its time went (his question, 2026-10-28 18:01 EDT); production prints nothing.

## Options (B2, 2026-10-29)

The words after a command fill its slash command's own options: the design spec's "Options and aliases" section, Harkirat's trim of 2026-10-28 21:51 EDT. The alias and value tables live once, in `utils/textCommands/commands.js`; `utils/textCommands/args.js` reads the words; `parse.js` decides what a leftover means.

- **Any order, singular or plural, a one-letter typo** (the same `isTypoOf`), and `option:value` always (`filter:past`, `type:mw`, `tz:est`). `visibility` is never a text option. A group word fills several values at once: `d prices legendary` is both legendary weapon draws, `armory` all three armories, and `commands/drawprices.js` opens them as one filtered view.
- **After `d`/`dior` every word must be understood, or Dioreo stays silent**, and a date must parse with `/timestamp`'s own code (`commands/timestamp.js` `expandShorthand` + `utils/timestampHelper.js`, never a copy). The listener reads `expandShorthand` through `client.commands`, never a `require()`: `bot/` is structural to the hotpatch planner, so a require edge from `bot/textCommands.js` (or `utils/textCommands/*`, which it requires) into `commands/` makes that command un-hot-patchable. After `@Dioreo` or `/`, an unknown word gets one usage line, a date that does not parse a "Couldn't read" line, and `d timestamp` alone a card whose button opens the timestamp pop-up. A command with no text options keeps PR 1's rule (clearly addressed, trailing text ignored); one WITH options gives the usage line instead, so `@Dioreo draws pls` reads as `usage` (the plan's reading of the spec's `draws pls` row beside its `calendar purple` row).
- **A weapon or a patch-notes season is looked up through the slash command's own suggestions**, `utils/autocomplete.js` (moved out of `handlers/router.js` verbatim apart from indentation, so both ask one list), never through `instrumentAutocomplete`: a text command is not a search session. One confident hit runs; several get Did you mean (up to 5) after `@Dioreo` and silence after `d`; none gets "No match". A bare weapon (`d ak117`) runs gunsmith MP only for an exact name, held a minute per text. `d gunsmith` alone, or with a class word, opens the first weapon alphabetically that has a build (`~first~` in `commands/gunsmith.js`).
- **Reply forms:** `d timestamp` sent as a reply with no date runs Convert Times on the replied message; `d colors` as a reply, or `d colors @name`, runs View Colors on that person. Each runs the right-click module's own code, and its permissions and `/admin` rules are looked up by that module's name.
- **Buttons carry the values** (`adapter.js` `runCustomId`): `txtrun_<command>~name=value&…`, `@m=`/`@u=` for a reply form's target, `~open`/`~submit` for the timestamp pop-up; past 100 characters the payload is held in memory for 15 minutes as `txtrun_~<id>`, after which the click says to run it again. Open privately carries the same payload, so the private copy is the same answer.
- **`via` gains `+args`** when options were given.

## Tests

- `scripts/textCommandParse.test.js` — the trigger rules as a table: each row is a message someone could type, and the verdict it must get.
- `scripts/textCommandAdapter.test.js` — the adapter's contract against a recording REST stub: reply first, then edit; nothing ephemeral posted publicly; the Open privately card; no pings.
- `scripts/textCommandPermissions.test.js` — each override set Discord can return and the answer it must give.
- `scripts/textCommandStats.test.js` — a text command that ran counts as the person's own command (under its full name, `patch notes`), and one that threw or was not for Dioreo counts nothing.

- `scripts/textCommandArgs.test.js` — the options grammar against the real command list: each spec row, every command and value alias (singular and plural) resolving to what the spec says, no alias in two places (with a planted clash of each kind caught), and every value a real choice of its slash command.
- `scripts/textCommandListener.test.js` — `onMessage` and the buttons end to end with stub command modules: options arrive, a weapon resolves through the stubbed suggestions, Did you mean after `@Dioreo` and silence after `d`, Convert Times and View Colors from the reply forms, the timestamp card, pop-up and answer.

*(Later units add their tests to this list.)*
