---
kind: record
status: frozen
---

# Text commands — B4 verification and review

*Written 2026-10-29 10:40 EDT by auditor B4 on `feat/text-commands-b4-audit`, branched from `origin/feat/text-commands` at `a689898` (B5's merge `4b82ad4` present). The unit is "B4 — verification and review" in `docs/superpowers/plans/2026-10-28-text-commands.md`; the design is `docs/superpowers/specs/2026-10-28-text-commands-design.md`. Every decision in the spec is Harkirat's and settled; anything below that needs a design call is a question, not a fix.*

## Results, before and after

| Run | Before (`a689898`) | After (this branch) |
| --- | --- | --- |
| `TEST_CACHE=0 npm test` | exit 1: 5 entries fail | exit 1: the same 5 entries fail |
| `npm run docs:audit` | exit 1: 6 ERRORs, 326 WARNs | exit 1: the same 6 ERRORs, 324 WARNs |

The 5 failing test entries (`test:hooks`, `docs:audit:test`, `agreementSize.test.mjs`, `silentContract.test.mjs`, `portal:refs`) and the 6 audit ERRORs (`external-anchors` ×5, `memory-slug` ×1) fail identically on a clean `origin/main` checkout in this cloud container: they read `~/.claude/` files and Mac paths that do not exist here, need the `typos` binary, or (`portal:refs`) are the stale mockup stamps B2 already reported. None comes from text commands.

## Findings

| # | What | Where | Severity | Outcome |
| --- | --- | --- | --- | --- |
| 1 | `@Dioreo draws pls`, `/draws pls` and `@Dioreo calendar purple` answered with a "Try `…`" usage line. The spec's rules table (confirmed 2026-10-28 23:29 EDT, "your pick", over B2's hint) and its "When Dioreo answers" row say the unknown words are ignored and the command runs with what was understood. | `utils/textCommands/parse.js`, `bot/textCommands.js` | Medium: contradicts the spec | Fixed. The usage line and `kind: 'usage'` are gone; `@Dioreo calendar purple upcoming` opens the calendar on Upcoming. Rows in `textCommandArgs.test.js` and `textCommandListener.test.js`. |
| 2 | The spec's "Replies" row "A click on a text reply keeps the text forms" (the lead's call 2026-10-29 00:05 EDT) had no code: a `d help` dropdown or pager redrew `</draws:id>` mentions. | `handlers/router.js`, `utils/commandMentions.js` | Medium: a spec row with no code | Fixed. The router sets `textReply` in the request context for a click on a bot message in a server with no interaction metadata; `inTextCommand()` reads it. A slash reply and a DM card keep the slash mention. Test in `helpTextCommands.test.js`. |
| 3 | The plan's 4b: `/help` failed for everyone on prod with `COMPONENT_INVALID_EMOJI`, because a select option named an emoji the prod app had deleted, and `refreshEmojiIds()` keeps a missing name's hardcoded id. | `utils/emojiMap.js` `parseEmoji` | High: a command down on prod | Fixed as a class. Once the booted app's emoji list is known, `parseEmoji` answers with that app's own copy by name, and a name the app lacks gets no emoji instead of a foreign id. The sync itself uses a plain `parseMention`. Test: with an app missing one name, no component on any /help page names an id the app does not own. |
| 4 | Where a server's `/admin` rule forces hidden, `sendV2Payload`'s text branch called `__textSend`, which skipped the Open privately gate that `reply()` and `editReply()` have. A command that sent its panel without deferring first would have posted it publicly. Every text-reachable command defers first today, so this was a latent hole, not a live leak. | `utils/textCommands/adapter.js` | Medium: breaks adapter rule 2 ("nothing private is ever posted publicly") | Fixed, with a test that sends without a defer. |
| 5 | PRIVACY §2.3 did not list two things text commands hold in memory: the words after a command that are looked up as a weapon or a season (a one-minute cache keyed by them), and a button's choices when they are too long for its custom_id. The second was only swept when the next long button was made, so it could outlive the policy's "within a quarter of an hour". | `bot/textCommands.js` (`suggestions`), `utils/textCommands/adapter.js` (`runStore`), `docs/legal/PRIVACY.md` §2.3 | Medium: the policy was not true against the code | Fixed. Each stored payload now has its own 15-minute timer, and §2.3 names both (the wording is his to approve, quoted below). Test for the timer. |
| 6 | Spec rows with no test: the 5-second same-command note, the 1-second any-command limit, 5 replies per channel per 10 s, the 60-second edit window, bots/webhooks/DMs ignored, the can't-post DM once per channel per day, and the idle grey-out edited with the bot token. | `scripts/textCommandListener.test.js`, `scripts/textCommandAdapter.test.js` | Low: the code was right, nothing proved it | Tests added. |

Every new test was proven able to fail: eleven mutations (the usage line restored, `__textSend` ungated, no payload timer, no `textReply`, `parseEmoji` unguarded, webhooks not ignored, a DM every time, no edit window, no channel cap, a note on every repeat, the grey-out through the webhook route), each turning its test red.

## Checked and clean

- **The autocomplete move:** all 117 non-blank lines of the router's old body appear, in order, in `utils/autocomplete.js`; the only additions are its header, the function line and the export.
- **No slash command changed:** every `commands/*.js` `data.toJSON()` is byte-identical to `origin/main`.
- **Error branches:** no unawaited `return interaction.X(...)` inside a try in the added code; `onMessage`'s `return reply(...)` lines are caught by the listener's own `.catch`.
- **The 40-component cap on /help:** `helpTextCommands.test.js` covers every page, permission level and Message Content state; the largest detail page is Bot Admin, 20 of 40, 3,638 characters with prod-length ids.
- **PRIVACY and TERMS against the code:** intents are `Guilds` + `GuildMessages`, with `MessageContent` added only when the app's flags grant it (`index.js`, `bot/textCommands.js`); Dioreo Admin stays `Guilds`; the message cache is 0; `AnalyticsEvent` stores `entry: 'text'` and `via`, never the text. True apart from finding 5.
- **Break attempts:** every row of "When Dioreo answers" and "How words map", plus `d time in a minute`, `d gs type 19`, `dior gunsmith skins are cool`, `d new`, `d returning`, typo'd aliases (`d drwas`, `d setings`, `d gunsmtih`, `d prices legndary`), glued and capitalised forms, and an edit after 61 s. All matched the spec apart from finding 1.

## Questions for Harkirat

1. **`@Dioreo time to sleep` answers "Couldn't read “to sleep” as a date or time."** The rules table says that after `@Dioreo`, words Dioreo doesn't understand are ignored and the command runs with what it understood. For timestamp that would leave no date, which is the one-button pop-up card. Keep the "Couldn't read" line, or show the card?
2. **After `d`, a weapon runs when the search returns exactly one weapon, even through its look-alike or typo fallback.** Measured against a sample weapon list: `d gs lol` and `d meta lol` both open the Kilo 141 ("lol" folds to "101"). The spec's principle is "when unsure, stay silent". Should a weapon after `d` need an exact or starts-with match, as a bare `d ak117` already does?
3. **PRIVACY §2.3 wording (v1.12, not yet published):** the text-commands bullet now reads "your last text command and when you ran it, when the Bot last answered in each channel, which messages it has already answered, the words after a command that it looked up as a weapon or a season (so the same words don't search again), and a button's choices when they are too long to fit in the button, each cleared within a quarter of an hour; and whether it has already told you it can't post in a channel, kept for a day". OK?

## Follow-up in the same thread (2026-10-29 11:25 EDT, not yet pushed when written)

| His answer or ask | What was done |
| --- | --- |
| Question 1: "an error message for that is fine" | `@Dioreo time to sleep` keeps the "Couldn't read" line. No change. |
| Question 2: `lol` opening the KILO 141 is "a bit too loose"; "142", "kilo ar" should open it; then "sure build" | `utils/search.js` `pickWeapon` matches words, not fragments, over every weapon (`utils/loadoutLookup.js` `weaponCandidates`, no-build ones included, which open the No build yet card as the dropdown does), read by text commands through `commands/gunsmith.js` `textWeapon`. Several weapons fitting every word (`d build kilo`) get Did you mean after `d` too; a loose match is only offered after `@Dioreo`. The typed /gunsmith uses the same check. Measured on the 68 real MP weapons: 142 and kilo ar open the KILO 141; lol, no, op, pls, bruh, true, real, br open nothing. |
| Question 3: "sure idk, your judgement" | The PRIVACY §2.3 wording stays as written. |
| The pop-up: quick-pick time zones, format and view dropdowns, all optional; a description saying what the zone does | Five fields, Discord's most: date, typed zone ("Your time is read in this zone: “tomorrow 8pm” + UK = 8pm tomorrow, UK time."), then the optional quick-pick zone (/settings' list), format (/timestamp's `style` choices) and view. A typed zone wins over a picked one. |
| "why does this panel look so barebone??" | Only the listener's own cards were bare (the help card, Did you mean, the timestamp card, the weapon picker, the no-match line); every command's real answer was always its full panel. Each card now has a `##`/`###` title with its command's icon, that command's accent and a `-#` hint; posted as real renders to #testing-spam. |

Beyond B4's Owns, on his "sure build": `utils/search.js`, `utils/loadoutLookup.js`, `commands/gunsmith.js`, `scripts/weaponSearch.test.js` and `.claude/rules/loadouts.md` (its "one fuzzy match auto-resolves" line, now false, is marked superseded).
