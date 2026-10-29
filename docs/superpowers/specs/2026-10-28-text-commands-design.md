---
kind: spec
status: frozen
---

# Text commands — design

*Settled with Harkirat on 2026-10-28, written 2026-10-28 21:05 EDT by the text-commands lead from the decisions taken in its thread and his edits to the doc "Dioreo Text Commands" (https://claude.ai/artifact/5M5hBq3qKf7QFM31N4kpeZ). This file and `docs/superpowers/plans/2026-10-28-text-commands.md` are everything a builder needs; every decision below is his and is not re-opened.*

## Why

A server can deny Use Application Commands, and a server with about 50 or more bots stops listing newer bots' slash commands (「𝐆𝐇𝐎𝐒𝐓」, 2026-10-28). Text commands let a member reach Dioreo by typing in the channel.

## Ways in

| Way in | Example | Glued form |
| --- | --- | --- |
| Mention | `@Dioreo today` | — |
| Slash as a prefix | `/today` | — |
| `d` | `d today` | `dtoday` |
| `dior` | `dior today` | `diortoday` |

Any case. Prefixes come from env `TEXT_PREFIXES` (prod `/,d,dior`; `.env.dev` sets `dd,diordev` because prod and dev share Dioreoland). Harkirat 2026-10-28 16:21 EDT: `d`/`dior` instead of `d!` because `!` needs a keyboard switch on mobile.

## When Dioreo answers, and when it stays silent

| Situation | What happens |
| --- | --- |
| A typo: `dior calender` | runs calendar. Damerau distance: ≤4 letters a swap only, 5–7 one slip, 8+ two; the first letter must match; needs a space after `d`/`dior`; glued forms must be exact |
| Stray letters: `dior draws o` | runs draws (1–2 characters after a command are ignored) |
| `@Dioreo draws pls`, `/draws pls` | runs draws (clearly addressed, trailing text ignored) |
| Extra chat after `d`/`dior`: `d today is cold` | nothing: after `d`/`dior` every word must be understood |
| Unknown word: `d lol`, `/whatever` | nothing |
| `@Dioreo` alone, or 1–2 unknown words | a help card, or Did you mean buttons |
| `@Dioreo` + 3 or more words, no command | a reply holding one app emoji (`MentionReply`, placeholder until he uploads one) |
| A reply to a Dioreo message, bots, webhooks, DMs, Dioreo Admin | nothing (a mention counts only as the first token) |
| The bot's managed ROLE mentioned without Message Content | a one-line hint to mention the bot instead |
| A message edited within 60 s into a command, no reply sent yet | runs it |
| Same command, same person, within 5 s | one "⏳ You can run `x` again <t:…:R>" note that deletes itself when the wait ends; further repeats nothing (his rule, 18:10 EDT) |
| A different command within 1 s | nothing, no warning |
| One channel | at most 5 replies per 10 s |

Principle: when unsure a message is for Dioreo, stay silent.

## Replies

- **Public by default.** Text replies ignore the member's /settings Hidden (his call 17:15 EDT). No `private` argument (17:16 EDT).
- **Server /admin forced-hidden** → a small public card with **Open privately** (`txtpriv_`), which opens the command hidden for whoever clicks.
- **Server command permissions are obeyed** (his yes 17:52 EDT): Integrations → Dioreo per-command overrides (member > role > @everyone; channel > all channels; command > app; Administrator bypasses); fails closed; a 1-minute cache dropped on `applicationCommandPermissionsUpdate`. Channel-wide Use Application Commands is ignored, because that is what text commands work around.
- **Where Dioreo can't post**, the member gets one DM, at most once per channel per day: "I can't post in #channel. Ask a server admin to let me send messages there, or try another channel." In memory only (17:18 EDT).
- **Read Message History denied** → the reply is posted as a plain message instead of a reply.
- **Buttons work** like on a slash reply (clicks are interactions), and the reply greys out after 10 idle minutes (edited with the bot token). Show Everyone is dropped.
- **`d timestamp` alone** (no date, not a reply) → a one-button card that opens the timestamp pop-up. `d gunsmith` alone opens the first weapon instead (his trim).

## How it works (built on `feat/text-commands`)

| Part | File |
| --- | --- |
| Listener (`messageCreate`, edits within 60 s), its own try/catch, limits, can't-post DM, help/Did you mean cards, dev timing log | `bot/textCommands.js` |
| Parser | `utils/textCommands/parse.js` |
| Command list and aliases | `utils/textCommands/commands.js` |
| Fake interaction so each command's `execute()` runs unchanged; first send POSTs a reply, later sends PATCH | `utils/textCommands/adapter.js` |
| Server permission check | `utils/textCommands/permissions.js` |
| `txtpriv_` / `txtrun_` buttons | `handlers/textCommands.js` |
| Text branch of sends / idle expiry | `utils/sendV2Payload.js`, `utils/passiveExpiry.js` |
| Analytics `entry: 'text'` + `via` (`mention`, `slash`, `d`, `dior`, `fuzzy`) | `utils/eventStore.js`, `models/AnalyticsEvent.js` |

Intents: `Guilds` + `GuildMessages`, plus `MessageContent` only when the app's flags (bit 18 or 19) grant it, read before login. Message cache 0; users/members swept after an hour. Message Content is a portal toggle under 100 servers even for a verified bot; he turned it on for both apps 2026-10-28 17:09 EDT.

## Options and aliases

From his doc after his trim (2026-10-28 21:51 EDT: he struck values in the doc and left six comments). Singular and plural always both match; a value matches by its name, any alias or a one-letter typo; `option:value` always works. `new` / `returning` never work on their own (answer 2): `d calendar modes new` = Playlists & Modes, Live Right Now; `returning` works only in `d draws returning`. Calendar shortcut command words `d events`, `d modes`, `d playlists`, `d gamemode`, `d gm` open that calendar page (answer 2).

### Rules for every command

| Rule | Example |
| --- | --- |
| Words after the command fill its options, in any order | `d calendar events upcoming` = `d calendar upcoming events` |
| A word matches by its name, any alias, singular or plural, or a one-letter typo | `d calendar upcomming` |
| `option:value` always works | `d calendar filter:past` |
| After `d`/`dior`, every word must be understood, or Dioreo stays silent | `d calendar is wild today` → nothing |
| After `@Dioreo` or `/`, words it doesn't understand are ignored and the command runs with what it did understand (his 16:25 EDT call; confirmed 2026-10-28 23:29 EDT, "your pick", over B2's hint) | `@Dioreo draws pls` → draws · `@Dioreo calendar purple` → calendar |
| A required option left out gets a one-button card that opens the slash command’s pop-up | `d timestamp` alone (the only required option left) |
| `visibility` is never a text option | — |
| Replies are public, whatever your /settings say | — |
| A server’s /admin forced-hidden rule shows an Open privately card instead | — |
| A server’s Integrations override for a command blocks its text form too | — |
| Where Dioreo can’t post, the member gets one DM, at most once per channel per day | — |

### Per command

| Command | Command aliases | Argument | Values + their aliases |
| --- | --- | --- | --- |
| today | today, td, tdy, daily | — | none |
| draws | draws, d, lucky draws, ld | page | new, n, all · returning, return, r |
| calendar | calendar, cal, c, schedule, sched | page | draws, d · events, ev, e · playlists, modes, pl, m, gamemode, gm |
| calendar |  | filter | past, ended, end, over, old · live, l, active, now, current, new · upcoming, u, soon, next, future, up, pending |
| patch notes | patch notes, patchnotes, patch, notes, pn, update | season | new, latest, current (the latest notes posted, even for a season not live yet) · a number: 8, s8, season 8 · a word from its title: terminated |
| season end | season end, seasonend, season, se, rank end, rankend, ranked end, rank, re, end | — | none |
| draw prices | draw prices, drawprices, prices, price, dp, cost, cp | region | 10cp, 10 · 20cp, 20 · 30cp, 30 |
| draw prices |  | type | mythic, myth (both mythic draws) · mythic weapon, mythic gun, mythic wep, mw · mythic character, mythic char, mythic operator, mythic op, mc · legendary, legend, leg, legendary weapon, legendary gun, lw, lg, reactive, non-reactive, nonreactive, lr, lnr (both legendary weapon draws) · legendary character, legendary char, legendary operator, lc, lcw · double legendary, double, dl, dlw · 7 spins, seven spins, 7 spin, 7spin, 7s · pick your reward, pick, pyr · double epic, epic, de, dec · armory, armoury, series armory, series, sa, arm (all three armories) · advanced, adv (both advanced draws) · advanced weapon, adv weapon, aw · advanced character, adv char, adv operator, ac |
| draw calculator | draw calculator, drawcalculator, calculator, calc, dc, calculate | page | start, new, begin · saved, save, history, s · help, guide, h |
| gunsmith MP | gunsmith, gs, mp, build, loadout, meta, gun, wep, weapon | weapon (optional) | a weapon name, also bare as `d ak117`, spaces and dashes optional (ak117, ak 117, ak-117) · a class: ar, assault, assault rifle · smg, sub · lmg · marksman, mr, dmr · sniper, sr · shotgun, sg · secondary, sec, pistol · nothing: `d gunsmith` alone |
| gunsmith DMZ | dmz, dmz gs, dmz build, dmz loadout, gsd | weapon (optional) | same as MP |
| timestamp | timestamp, time, ts, t, convert | datetime (required) | every word that isn’t another argument: tomorrow 8pm, friday 6pm, in 2 hours |
| timestamp |  | timezone | timezone:toronto, tz:toronto, tz:est |
| convert times | (none: `d timestamp` sent as a reply) | — | none; send it as a reply to the message |
| remind | remind, r, reminder, remindme, rm, notify, alert | — | none: `d remind` posts the reminders panel in the channel, public like every text reply (his call 2026-10-28 21:56 EDT: "thats fine, show it. its just reminders ... id rather not do the 'open' then show the panel method") |
| colors | colors, colours, col, palette, accent | — | none: your own colors |
| colors |  | someone | @name, or send it as a reply to them |
| settings | settings, set, config, options, opt, pref, preferences, s | — | none |
| help | help, h, commands, cmds, info, ?, guide | command | any command name or alias above |
| invite | invite, inv, add, link | — | none |

### How words map, so nothing is guessed

| Word | Becomes |
| --- | --- |
| calendar `past` · `upcoming` · `live` (and aliases, `new` included) | filter `over` · `soon` · `live` |
| draw prices `10cp` / `20cp` / `30cp` | region `region_10` / `region_20` / `region_30` |
| draw prices `legendary` (and aliases) | BOTH `legendaryGunReactive` and `legendaryGunNonReactive` (his comment: "it just filters and shows both reactive and non-reactive") |
| draw prices `legendary character` | `legendaryCharacterWeapon` (his comment) |
| draw prices `mythic` · `advanced` | both mythic draws · both advanced draws (lead's call, same as his `legendary` and `armory`) |
| draw prices `armory`, `series armory` | all three armories (`armoryMythicWeapon`, `armoryLegendaryWeapon`, `armoryLegendaryCharacter`) (his comment) |
| patch notes `new` · `latest` · `current` | the newest season that has notes, upcoming included |
| gunsmith with no weapon, or with a class word | the first weapon alphabetically that has a build, in the catalogue or in that class (his comment: "running a bare `d gunsmith` or something would just open the 1st alphabetic gun on the catalogue") |
| `d timestamp` (any alias) sent as a REPLY, with no date | Convert Times on the replied message (his comment: "just `d timestamp` reply to a message") |
| `d timestamp` alone, not a reply | a one-button card that opens the timestamp pop-up |

- **Alias sets are the lead's judgement** where his comments gave examples (his note 2026-10-28 21:53 EDT: "these were just examples, you still had to implement things by your own judgement such as 'sa' for series armory").
- **Dropped by his trim**, now panel-only: calendar Today page and full-timeline filter, region by place, draw prices groups, the gunsmith build number (answer 3 is reversed by his trim), timestamp style and view, remind items and when (`d remind` just opens reminders), colors page and source, settings page, the `bell`, `smith`, `stamp` aliases and the separate convert-times aliases.
- **No alias may belong to two commands, and no value alias to two values of one command.** A test enforces it.

## Stays slash only

`/admin`; Dioreo Admin's `/manage`, `/bot`, `/autobuild`, `/embed`; the right-click apps (View Colors becomes `d colors @name`).

## Records that change

CLAUDE.md (the interactions invariant gains text commands as an exception; the intents sentence) · `.claude/rules/text-commands.md` (new) · `.claude/rules/interaction-router.md` · PRIVACY v1.12 (no announcement, his call 17:09 EDT; he approves the wording before the merge) · TERMS · `docs/reference/platform-constraints.md` · ROADMAP · CHANGELOG + DEVLOG.
