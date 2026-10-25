---
kind: record
status: live
---

# v3 launch announcement — DRAFT (2026-10-23 09:51 EDT)

*Updated 2026-10-25 01:51 EDT: `/today` and `/remind` added to A, B and C (Harkirat: "can you also update the today command and the remind command into the launch announcement draft"), and the ta-da emoji now exists.*

**Nothing here has been posted or scheduled anywhere.** Roadmap item: `docs/ROADMAP.md` → "Prepare the v3 launch announcement" and launch checklist F. It stays open until Harkirat has read and approved a final version, and sending is his call on the day, like the merge, tag and deploy.

Three versions of one message, so he can pick the route (or both): **A** for the bot's own announcement system, **B** for a Discord post, **C** for a one-line listing blurb. The voice follows the website ("Meet Dioreo, your CODM companion") and `/invite`'s pitch ("COD:M companion bot · Gunsmiths, draw prices/calculator, patch notes, calendar & more").

## Needs his call

| # | Question | My pick |
|---|---|---|
| 1 | Route: in-bot (A), Discord post (B), or both | **Both.** A reaches people who already use the bot, once, on their next command; B reaches people who have not run a command yet |
| 2 | Launch date and time, if the post names one | Leave it out. A's "Posted …" line is added by the system |
| 3 | The "ta-da" emoji | **It exists now:** `DioreoTada`, on the prod and dev apps. In A's title (the bot posts A, so its own emoji renders). B only shows it if the bot posts B; posted from his own account, an app emoji does not render, so B has none |
| 4 | First person ("I") or neutral voice | Neutral, as drafted |
| 5 | Keep the Terms and Privacy line | **Yes.** v3 stores new things (first-command date, calculator saves, server rules), and the policy's new version takes effect on the day |
| 6 | Banner image | None drafted. A banner is portal-only today (the `/manage` box has no field for it) |
| 7 | Name `/admin` at all | **Yes.** Guild install is the headline and `/admin` is what a server owner needs. It is the one admin command he kept off the website's commands page (2026-10-19), so B's commands link will not list it |

## Version A — in-bot announcement

For `/manage` → Announcement. **1,491 characters** of the 4,000 allowed. It is shown as an embed, privately, once per person, under the reply to their next command. The box has three fields: text, **Expires In** (blank = 60 days) and **Starts On** (blank = show now; set it to the launch moment to have it wait).

```text
# <a:DioreoTada:1563677558589882510> Dioreo v3 is here

Your COD:M companion just got a big upgrade. What's new:

**Add Dioreo to a server**
`/invite` adds it to your server or to just your own apps.

**Gunsmith builds** · `/gunsmith mp` · `/gunsmith dmz`
Search a weapon (typos and half-typed names work) or browse the META. MP builds show their badges and the rank modes they suit.

**Draw calculator** · `/draw calculator`
Plan your CP: save calculations, price Mythic upgrades, the Series Armory and the Advanced draws, and get a suggested purchase.

**Your daily brief** · `/today`
What released since the daily update, what goes live next, and what's leaving soon. `/calendar` opens on it too.

**Reminders by DM** · `/remind`
Pick what you want to hear about (new draws, events, the season, patch notes, or the whole daily brief) and get one DM a day, right after the daily update. The bell on each seasonal command opens it.

**What's live** · `/calendar` · `/draws` · `/season end`
Filter the calendar to live, upcoming or past, see each entry's status at a glance, and watch the season-end progress bars.

**Right-click tools**
Right-click a person or a message → **View Colors**. Right-click a message → **Convert Times**.

**Server admins** · `/admin`
Server Settings lets you choose where, and for whom, Dioreo's replies stay private.

Found a bug or have an idea? `/help` shows who to tell.
-# Terms of Service and Privacy Policy updated · dioreo.app/terms · dioreo.app/privacy
```

## Version B — Discord post

For a server channel. **1,867 characters**, under the 2,000 a plain message allows. Discord renders the headings and bullets.

```text
# Dioreo v3 is here

Dioreo is your COD:M companion: gunsmith builds, draw prices and a calculator, patch notes, the season calendar and more, without leaving the chat. Install it once and it answers anywhere, in any server or DM.

**What's new in v3**
- **Add it to servers.** `/invite` has Add to Server and Add to My Apps. Server admins get `/admin` to choose where, and for whom, Dioreo's replies stay private.
- **`/gunsmith mp` and `/gunsmith dmz`.** Search any weapon, even half-typed or misspelled, or browse the META. MP builds show their badges and recommended rank modes.
- **`/draw calculator`.** Save your calculations, price Mythic upgrades, the Series Armory and the Advanced draws, and see a suggested CP purchase. `/draw prices` covers the 10, 20 and 30 CP regions.
- **`/today`.** A daily brief: what released since the daily update, what goes live next, and what's leaving soon. `/calendar` opens on it too.
- **`/remind`.** Pick what to hear about (new draws, events, the season, patch notes, or the whole daily brief) and get one DM a day, right after the daily update. The bell on each seasonal command opens it.
- **`/calendar`, `/draws` and `/season end`.** Filter the calendar to live, upcoming or past, with status dots; open the calculator straight from `/draws`; see season-end progress bars.
- **`/patch notes`** keeps every season.
- **Right-click tools.** View Colors on a person or a message, and Convert Times on a message.
- **`/timestamp`** reads your saved time zone and understands ranges like "8pm to 10pm".

**Add Dioreo:** dioreo.app/install
**Browse the commands:** dioreo.app/commands
**Terms and Privacy Policy:** updated, at dioreo.app/terms and dioreo.app/privacy

Found a bug or have an idea? `/help` shows who to tell.
-# Dioreo is an unofficial fan project, not affiliated with Activision, TiMi Studio Group or Tencent.
```

## Version C — one line

For a bot-directory listing or a bio (the roadmap's top.gg item can reuse it).

```text
Dioreo: the COD:M companion bot. Gunsmith builds, draw prices and calculator, a daily brief, DM reminders, patch notes and more. dioreo.app
```

## Where each claim comes from

Every claim is a shipped Pre-Release entry in `docs/CHANGELOG.md`, or a registered command checked on 2026-10-23. Strike anything he does not want to promise.

| Claim | Source |
|---|---|
| `/invite`: Add to Server, Add to My Apps | v3.106.0; guild install turned on for the prod app 2026-10-13 (launch checklist C) |
| `/admin` Server Settings, private or public per channel, role and command | v3.108.0 and `.claude/rules/admin-controls.md`. Needs Manage Server |
| `/gunsmith mp` / `dmz`, forgiving search, META browse | v3.98.0 |
| Badges and Recommended Rank Mode on MP builds | v3.98.0 (per-build badges, Rank Modes) |
| Calculator: saves, Mythic upgrades, Series Armory, Advanced draws, suggested purchase | v3.88.0, v3.89.0 |
| `/draw prices` 10, 20 and 30 CP regions | registered `region` choices |
| `/calendar` filter and status dots, `/season end` progress bars, `/draws` Calculate button | v3.105.0 |
| `/patch notes` keeps every season | v3.89.0 |
| View Colors on a person and on a message, Convert Times | v3.91.0, v3.92.0 |
| `/timestamp` saved time zone and ranges | v3.104.0 |
| `/today` daily brief; `/calendar` opens on Today | v3.109.0 (#220) |
| `/remind`: groups or single entries, one DM a day after the daily update, the bell on seasonal commands | v3.110.0 (#221, **merge in progress 2026-10-25**; check it is merged and deployed before posting) |
| `dioreo.app/install` | a 302 in `public/_redirects` |
| `dioreo.app/commands` | `public/commands.html` exists, but **check it is live before posting**; the launch checklist said it was not, and the website thread owns it |
| "Terms and Privacy updated" | PRIVACY effective date = merge day (launch decisions, 2026-10-20) |

## Left out on purpose

| Thing | Why |
|---|---|
| `/dmz` | Hidden until its DMZ update (Harkirat, 2026-10-21). `/gunsmith dmz` is the public DMZ route |
| Your Stats, Dioreo User Since | Your Stats is hidden until after v3, and a first-command date is not a feature to announce |
| Show Everyone | Switched off for now, everywhere |
| The Early Supporter badge | Not built |
| `/manage`, `/bot`, `/autobuild`, the admin right-clicks | Owner and allowlisted-admin tools, not for players (admin commands stay off the public commands page, Harkirat 2026-10-19) |
| Rank-mode animated marks, Dioreo Admin app | Internal, nothing a player acts on |

## Before sending

1. The launch has happened in this order: merge, tag, deploy, each on his go. Do not post before the bot is running v3.
2. Run `/invite` on prod and press Add to Server; check `dioreo.app/commands` loads.
3. Re-read B against the live `/help` so a command name has not moved.
4. For A: paste into `/manage` → Announcement, set **Starts On** if it should wait, and read it once on the dev bot first.
5. Replace nothing by hand in `public/`; if wording changes after approval, edit this file, not the site.
