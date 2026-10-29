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
- **A required option missing** (`d gunsmith`) → a one-button card that opens the slash command's own pop-up.

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

From his doc, as he left it. `new` / `returning` never work on their own (his answer 2). In the calendar, `new` means live now on any page: `d calendar modes new` = Playlists & Modes, Live Right Now (his answer 2026-10-28 21:12 EDT: "was meant for `d calendar modes new` as in calendar + game modes/playlists + live now"). `returning` works only on the calendar's Draws page (its New/Returning split) and in `d draws returning`. Gunsmith also answers to a bare weapon name, `d ak117` (answer 1), and takes a build number, `d gs ak117 2` (answer 3). Remind needs its when word, `d remind live black hole`, `d r end black hole` (answer 4).

### Rules for every command

| Rule | Example |
| --- | --- |
| Words after the command fill its options, in any order | `d calendar events upcoming` = `d calendar upcoming events` |
| A word matches by its name, any alias, singular or plural, or a one-letter typo | `d calendar upcomming` |
| `option:value` always works | `d calendar filter:past` |
| After `d`/`dior`, every word must be understood, or Dioreo stays silent | `d calendar is wild today` → nothing |
| After `@Dioreo` or `/`, an unknown word gets a one-line hint | `@Dioreo calendar purple` → “Try `calendar events`…” |
| A required option left out gets a one-button card that opens the slash command’s pop-up | `d gunsmith` alone |
| `visibility` is never a text option | — |
| Replies are public, whatever your /settings say | — |
| A server’s /admin forced-hidden rule shows an Open privately card instead | — |
| A server’s Integrations override for a command blocks its text form too | — |
| Where Dioreo can’t post, the member gets one DM, at most once per channel per day | — |

### Per command


| Command | Command aliases | Argument | Values + their aliases |
| --- | --- | --- | --- |
| today | today, td, tdy, daily | — | none |
| draws | draws, d, lucky draws, ld | page | new, n, all, latest · returning, return, r, back, rerun |
| calendar | calendar, cal, c, schedule, sched | page | today, td, tdy · draws, d, lucky draws · events, ev, e · playlists, modes, pl, m, gamemode, gm |
| calendar |  | filter | all, a, full, f, timeline, tl · past, ended, end, over, old · live, l, active, now, current, new · upcoming, u, soon, next, future, up, pending |
| patch notes | patch notes, patchnotes, patch, notes, pn, update | season | new, latest, current (the latest notes posted, even for a season not live yet) · a number: 8, s8, season 8 · a word from its title: terminated |
| season end | season end, seasonend, season, se, rank end, rankend, ranked end, rank, re, end | — | none |
| draw prices | draw prices, drawprices, prices, price, dp, cost, cp | region | 10cp, 10 · 20cp, 20 · 30cp, 30 · 30 CP by place: global, na, north america, us, usa, united states, canada, uk, united kingdom, britain, germany, france, eu, western europe, australia, new zealand, nz, oceania · 20 CP by place: la, latam, latin america, brazil, mexico, uae, saudi arabia, saudi, ksa, eastern europe, middle east, me · 10 CP by place: india, pakistan, south africa, egypt, morocco, chile, colombia (no Garena regions or China) |
| draw prices |  | group | normal, regular, standard · armory, series, sa · advanced, adv |
| draw prices |  | type | mythic weapon, mythic gun, mw · mythic character, mythic char, mc · legendary reactive, reactive, lr · legendary non-reactive, non-reactive, lnr · legendary character weapon, lcw · double legendary, double, dlw · 7 spins, 7 spin, 7spin · pick your reward, pick, pyr · double epic, epic, dec · mythic armory, ma · legendary weapon armory, lwa · legendary character armory, lca · advanced weapon, aw · advanced character, ac |
| draw calculator | draw calculator, drawcalculator, calculator, calc, dc, calculate | page | start, new, begin · saved, save, history, s · help, guide, h |
| gunsmith MP | gunsmith, gs, mp, build, loadout, meta, gun, smith | weapon (required) | a weapon name, also bare as d ak117 (your call 1), spaces and dashes optional: ak117, ak 117, ak-117, plus /gunsmith’s own nicknames |
| gunsmith MP |  | build | 1, 2, 3 · b2, build 2, #2 (yes, your call 3) |
| gunsmith DMZ | dmz, dmz gs, dmz build, dmz loadout | weapon (required) | same as MP |
| gunsmith DMZ |  | build | same as MP |
| timestamp | timestamp, time, ts, t, stamp | datetime (required) | every word that isn’t another argument: tomorrow 8pm, friday 6pm, in 2 hours |
| timestamp |  | style | short · all · relative, rel, countdown · full · date · clock |
| timestamp |  | view | text, plain, raw, copy |
| timestamp |  | timezone | timezone:toronto, tz:toronto, tz:est |
| convert times | convert times, convert, conv, times, ct | — | none; send it as a reply to the message |
| remind | remind, r, reminder, remindme, rm, notify, alert, bell | item | an item’s name (black hole) or a category, exactly as /remind’s own autocomplete lists them for that side |
| remind |  | when | required: releasing, release, live, out, start · leaving, leave, end, ending, l |
| colors | colors, colours, col, palette, accent | page | avatar, av, pfp, a · banner, b · deco, decoration · nameplate, np, plate · username, name, display name, n |
| colors |  | source | main, global, profile, m · server, guild, s |
| colors |  | someone | @name, or send it as a reply to them |
| settings | settings, set, config, options, opt | page | visibility, vis, v · preferences, prefs, p · colors, colours, c |
| help | help, h, commands, cmds, info, ? | command | any command name or alias above |
| invite | invite, inv, add, link | — | none |


### How words map, so nothing is guessed (lead's content pass, 2026-10-28 21:09 EDT)

| Word | Becomes |
| --- | --- |
| calendar `past` · `upcoming` · `live` · `all` (and aliases) | filter `over` · `soon` · `live` · `all` |
| colors `username` · `deco` · `main` (and aliases) | page `name` · `decoration` · source `global` |
| timestamp `short` · `all` · `relative` · `full` · `date` · `clock` | style `short_list` · `all_formats` · `relative` · `fullDateTime` · `longDate` · `shortTime` (my mapping) |
| draw prices `10cp` / `20cp` / `30cp` and the places | region `region_10` / `region_20` / `region_30` |
| remind release words · leaving words | the `releases` option · the `leaving` option; the item then resolves through that side's own autocomplete, and the pick flips that reminder as `/remind` does |
| patch notes `new` · `latest` · `current` | the newest season that has notes, upcoming included |
| calendar `new` | filter `live` on any page |
| calendar `returning` | the Draws page's Returning split; on other pages, not understood |
| calendar shortcut words `events`, `ev`, `playlists`, `modes`, `gamemode`, `gm` as the COMMAND word | calendar on that page (his answer 2); one-letter forms are not shortcuts |

- **Timestamp style words have no one-letter forms**, because the date is free text: in `d time in a minute`, an `a` alias would be read as the style.
- **A gunsmith build number is text-only.** He removed `build` from `/gunsmith` on 2026-10-25 15:45 EDT ("remove 'build' as an option in the slash command"); it stays removed. A trailing number is a build only when the words before it resolve to one weapon AND the number is within that weapon's build count; otherwise it is part of the name (`d gs type 19`).
- **No alias may belong to two commands, and no value alias to two values of one command.** A test enforces it.

### Settled after the first draft

- `d modes new` was meant as `d calendar modes new` (his answer 2026-10-28 21:12 EDT); see above.

## Stays slash only

`/admin`; Dioreo Admin's `/manage`, `/bot`, `/autobuild`, `/embed`; the right-click apps (View Colors becomes `d colors @name`).

## Records that change

CLAUDE.md (the interactions invariant gains text commands as an exception; the intents sentence) · `.claude/rules/text-commands.md` (new) · `.claude/rules/interaction-router.md` · PRIVACY v1.12 (no announcement, his call 17:09 EDT; he approves the wording before the merge) · TERMS · `docs/reference/platform-constraints.md` · ROADMAP · CHANGELOG + DEVLOG.
