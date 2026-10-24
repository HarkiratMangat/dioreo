---
kind: spec
status: frozen
---

# Notifications and reminders: the agreed design

*Written 2026-10-23 21:13 EDT. Frozen: a snapshot of what Harkirat decided over four rounds of questions on 2026-10-23 (19:47–21:11 EDT), recorded here at his word ("record it in a tracked spot just in case tho"). It answers the "NEEDS A DISCUSSION BEFORE ANY BUILD" entry in `docs/ROADMAP.md` and folds in the post-launch "Opt-in reminders by DM" entry. Nothing is built yet; the next step is two mock-ups on the dev bot.*

## What it is

A person asks Dioreo to tell them when something in the game changes, and Dioreo sends them a DM at the daily update. Draw reminders were the first ask.

## Decisions

| Area | Decision |
|---|---|
| Delivery | A DM to the person who opted in. Never a post in a server channel (that would need a channel picked per server, a v4 server-admin feature). |
| The interactions rule | CLAUDE.md's "answers only through interactions" gets a third deliberate exception: a DM to a user who opted in, carrying only what they asked for. Worded as narrowly as the owner end-date reminder (`utils/drawEndReminder.js`). |
| Scope | v3 launch ("we can crunch it out before v3"). |
| When | Once a day at **00:01 UTC**, one minute after the game's daily update. |
| Bundling | One DM per person per day: everything they follow that fires that day goes in a single message. |
| Categories | New draws · returning draws · events · playlists & modes · leaving soon · a new season going live · season ending (all, or BP, Ranked, DMZ each) · new patch notes posted · the daily /today digest. |
| One thing | A specific draw, event or playlist: when it releases, or when it is leaving. A one-thing follow is removed once it has fired; a category follow stays until removed. |
| Leaving soon | Fires twice: "Heads up, leaving soon" with 47h59m left, and "Heads up, last chance" with 23h59m left. Entries end at 00:00 UTC, so both land on the 00:01 UTC run. |
| Season ending | 3 days before, and on the last day. |
| Digest | The /today brief itself, with the person's followed items marked 🔔; it absorbs their other follows rather than repeating them in a second list. |
| The bell | A grey, emoji-only button (the notification emoji until a "reminders" emoji exists) as the accessory of the header section on the four /calendar pages, /today, both /draws pages, /season end and /patch notes. It shows no state: the message is shared. Pressing it opens the whole reminders panel as a new private message. |
| The panel | Laid out like /settings: one section with an accessory toggle per category, then two dropdowns, **remind me when this releases** (entries not out yet) and **remind me when this is leaving** (entries live now). Each lists 25 at most, with a 🔍 Search button for the rest, like the /settings pickers. The panel is where the state shows. |
| `/remind` | `set:` autocompletes with the categories pinned first, and typing searches this season's entries; `toggle:` on/off (on by default). Used with options it replies privately with a confirmation and a button to open the panel privately. Bare `/remind` opens the panel publicly (unless the server's rules force private), with a `visibility:` option. A public panel is locked to its owner: anyone else pressing a toggle gets a private **Open your own reminders** button. Managing (each follow with a remove button, plus **Stop all**) lives in the panel; there is no separate /settings page. |
| Failed DMs | After a failed set, a one-line note on the person's next command. It names both fixes, because Discord's error cannot say which applies (see the tests below): turn on DMs from a shared server, or add Dioreo to your account. If the note was delivered and DMs keep failing for 3 more days, their reminders pause; their next command then says so, with a **Turn back on** button. |
| Privacy | The bot stores the person's user ID and what they follow; **Stop all** deletes the record. PRIVACY.md (Appendix A and §2) is updated in the same change, and Harkirat sees the text before it is written. |
| Later, not v3 | A reminder when a weapon's META build changes in /gunsmith: filed in `docs/db-deferred-list.md`. |

## Who a DM can reach: tested 2026-10-23 20:35–20:55 EDT

The dev bot sent each DM to Harkirat's alt account. The alt's server membership was checked through the API before each send.

| # | Alt's setup | Result |
|:-:|---|---|
| 1 | app added to the account, in Dioreoland | delivered |
| 2 | app added, no shared server | delivered |
| 3 | app added, no shared server: a Components V2 card with a button | delivered; renders correctly |
| 4 | app removed (Deauthorize), no shared server | refused: `403`, code `50278` "no mutual guilds" |
| 5a | app removed, in Dioreoland, DMs from server members off | refused: the same `403 50278` |
| 5b | app removed, in Dioreoland, DMs from server members on | delivered |

So a reminder reaches anyone who added the app to their account, and anyone sharing a server with the bot who allows DMs from that server's members. Opening the DM channel succeeds even when the send is refused, so only the send's result tells.

## Measured: the 25-option cap

On Season 9's dev data, for every day of the season: at most **19** entries are live at once (2026-11-02), so the leaving dropdown always fits. **29** entries are not yet released on the day before the season starts, when the whole season is loaded, and **21** on its first day; the releases dropdown overflows on that one day, which the Search button covers.

## Next

1. Mock-ups on the dev bot before any build: the panel in #testing-spam, and a sample reminder DM to his alt (order: Last chance · Leaving soon · Released · Season · Patch notes, with a **Manage reminders** button).
2. Then the build, on its own branch: the opt-in record (and its schema), the daily 00:01 UTC job in `bot/lifecycle.js`, `/remind`, the panel, the bell on each command, the failure note and pause, CLAUDE.md's rule change and PRIVACY.md.

## Audit log

A falsification pass ran on the design as it was agreed, asking where it is wrong rather than whether it is right.

- **"DMs off is a different error code (50007)" was wrong.** Stated in the thread after test 4, before test 5 ran. Test 5a gave the same `50278`. Corrected in the thread with a strike-through, and the failure note was reworded to name both fixes.
- **"No shared server" could have been a stale view.** Discord's DM header still read "1 Mutual Server" after the alt left Dioreoland. The bot checked membership through the API immediately before each send (`10007` unknown member in both servers), and the header later read "No servers in common", so tests 2–4 are what they claim.
- **The 25 cap was assumed, then measured.** It was first stated as "realistically not hit"; the day-by-day count found it is hit on the day before a season starts. The Search button is required, not optional.
- **The bell cannot show per-user state.** A button on a shared message looks the same to everyone, so state lives only in the panel (his call, round 3).
- **Not checked:** Discord's rate limit for DMs at scale. Bundling to one DM per person per day keeps the count to the number of followers, so it is measured when the build has a real follower count.
