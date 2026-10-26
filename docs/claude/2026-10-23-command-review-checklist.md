---
kind: record
status: live
---

# Per-command review checklist (2026-10-23)

✅ **DONE. Harkirat ran the review rounds on 2026-10-25, on the dev bot, one command at a time, and the changes shipped in #222 (Pre-Release v3.111.0).** His word, 2026-10-26 11:12 EDT: *"ran yesterday, mark this as done."* The verdict lines below were never filled in: the review ran live in the bot-polish thread, not on this sheet. The sheet is kept as the record of what was reviewed.

Written for Harkirat's roadmap item "A per-command review checklist: click test, slash options and descriptions" in `docs/ROADMAP.md`. It is the sheet to work through, one command at a time: click every control, read each slash option and its description, then mark the command approved or changes-wanted. **No command has been reviewed yet.** Every option table below was generated from the registered command builders on `v3-pre-release` at v3.109.0-pre, so the wording is what Discord's picker shows, not a copy from a doc.

## How to use it

- Work top to bottom. **`/gunsmith` first, with `mp` and `dmz`**, as the roadmap asks; the rest follow the roadmap's groups.
- For each command: run the **Every command** checks once, then its own **Click** steps, then read its option table against the picker.
- Mark the verdict line. For changes-wanted, write the change under it in his own words, so a later session can build exactly that.
- Tick the matching box in the roadmap block when a whole group is approved.
- Use the dev bot (`Dioreo (Dev)`), never prod. Hidden panels first, then once with `visibility: Public`.

## Order and scope

| # | Command | Group | Runs in | Verdict |
|---|---|---|---|---|
| 1 | /gunsmith mp · /gunsmith dmz | Public, start here | Servers, DMs, user install | [ ] |
| 2 | /help | Public | Servers, DMs, user install | [ ] |
| 3 | /invite | Public | Servers, DMs, user install | [ ] |
| 4 | /draw prices · /draw calculator | Public | Servers, DMs, user install | [ ] |
| 5 | /draws | Public | Servers, DMs, user install | [ ] |
| 6 | /calendar | Public | Servers, DMs, user install | [ ] |
| 7 | /season end | Public | Servers, DMs, user install | [ ] |
| 8 | /patch notes | Public | Servers, DMs, user install | [ ] |
| 9 | /colors | Public | Servers, DMs, user install | [ ] |
| 10 | /timestamp | Public | Servers, DMs, user install | [ ] |
| 11 | /settings | Public | Servers, DMs, user install | [ ] |
| 12 | /admin | Server admins | Servers only, needs Manage Server | [ ] |
| 13 | /manage · /bot · /autobuild | Owner and allowlisted admins | User install, on the Dioreo Admin app | [ ] |
| 14 | /dmz · /embedtest | Dev bot only | Dev bot | [ ] |
| 15 | Right-click commands (six names, seven entries) | Mixed | Servers, DMs, user install | [ ] |

## Every command

Run these once per command, so the per-command sections only list what is specific to it.

- **The picker.** Type the command in a server and again in a DM with the bot. Every option appears with its description; read each one aloud. A description that cuts off or needs a second read is a changes-wanted.
- **Hidden and Public.** Run with `visibility: Hidden`, then `Public`. Hidden is only visible to you; Public is posted to the channel. Leave it blank once to confirm your saved default from `/settings` is used. Show Everyone is switched off, so no panel should show that button.
- **Every button and dropdown.** Press each one. No "This interaction failed", no pop-up that refuses to open, and an edited panel keeps its layout (same accent colour, same rows).
- **Phone width.** Open the panel on a phone: no heading wraps mid-word, no button row drops a button onto its own line.
- **Footer row.** `/calendar`, `/draws`, `/draw prices`, `/patch notes` and `/season end` share one row: Calendar · Draws · Draw Prices · Patch Notes · Season End, the open one blurple and disabled. Press each from each panel.
- **Idle.** Leave a panel 10 minutes, then press a button: the design (`.claude/rules/settings-and-expiry.md`) is that the buttons go grey, not that they fail.
- **Wording.** Names, capitals and punctuation match the other commands. `visibility` reads "Show this response only to you, or publicly to everyone in the chat." on most commands; `/help` and `/autobuild` add "(Defaults to only you.)", and `/manage` and `/bot` say "panel" and add it too. Decide once whether that split is right.

## Public commands

### 1. `/gunsmith`, with `mp` and `dmz` (start here)

- **Registered description:** "Best MP and DMZ loadouts and gunsmith builds"
- **`/gunsmith mp`:** "Find an MP build or browse the META and more"
- **`/gunsmith dmz`:** "Find a DMZ build or browse the META and more"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `mp weapon` | text, required | A MP weapon, or All META / All MP builds to browse them | autocomplete |
| `mp build` | whole number | Jump to a specific build number |  |
| `mp visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |
| `dmz weapon` | text, required | A DMZ weapon, or All META / All DMZ builds to browse them | autocomplete |
| `dmz build` | whole number | Jump to a specific build number |  |
| `dmz visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

**Click**

- `/gunsmith mp weapon:` and look before typing: the suggestions open with **All META builds**, **All MP builds**, then each weapon class, then weapons tagged with their class.
- Pick a weapon with several builds. The card has the weapon name, a badges line, **Recommended Rank Mode** when one is set, **Attachments** with **Copy Attachments** beside the heading, **Gunsmith Code** with **Copy Code** beside the heading, the image, and a footer reading category · Build N of M · Last updated.
- Press Copy Attachments and Copy Code: each answers privately with plain text. Press the pager through every build; a weapon with one build has no pager.
- `build:` jumps to a number. Try 1, the last, and one past the last: an out-of-range number is clamped, not refused.
- Search forgiveness: a half word (`loc`), a typo, a class shorthand (`sg`, `mr`), and `all`. One match opens; several ask you to pick; none gives the "type more" hint.
- Pick **All META builds**: a card with an **MP Meta / DMZ Meta** switch under it. Press the switch. Then **All MP builds** and one class row: the accent colour should follow the class.
- Badges: find a build with Meta, a tier (Best, Top 5, Capable), Toxic or Ass, and check two builds of one weapon can differ.
- `/gunsmith dmz`: the same flow with DMZ builds. Its browse rows are only **All META builds** and **All DMZ builds**, badges use the DMZ range wording (for example Best Close Range), and there is no Recommended Rank Mode (MP only). A DMZ build can list up to nine attachments.

**Look at**

- `mp`'s `weapon` option reads "A MP weapon, or All META / All MP builds to browse them": "A MP" should be "An MP". `dmz` reads correctly. (Fixing it changes the registered text, which the website's commands page is built from, so rebuild `public/` with it.)

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 2. `/help`

- **Registered description:** "See what Dioreo can do and how to report bugs"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `cmd` | text | Jump straight to a specific command | autocomplete |
| `visibility` | text | Show this response only to you, or publicly to everyone in the chat. (Defaults to only you.) | Hidden · Public |

**Click**

- `/help`: the landing has the mascot header and a category dropdown ("Choose a category to explore…") with Gunsmith, Draws, Seasonal Info, Utilities and Preferences. **Bot Admin appears only for allowlisted admins** and `/admin` only for people with Manage Server: check with a plain account.
- Open each category. Each command shows Usage, Options and Examples, and every `/command` in the text is a clickable link.
- The dropdown's **Commands List** option returns to the overview; the Draws page has a **Calculator Guide** button; the link rows are Website · Invite Dioreo, then Credits · Terms · Privacy Policy (those three open dioreo.app/notice, /terms and /privacy).
- `cmd:` autocomplete: type a command, an alias (`calc`, `bp`, `prefs`) and a category; each lands on the right page. `/dmz` must not appear (hidden).
- The footer line names who to send bugs and suggestions to.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 3. `/invite`

- **Registered description:** "Add Dioreo to a server or your account"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

**Click**

- The panel: **Invite Dioreo**, the "COD:M companion bot" tagline, the pitch, the mascot, then one row: **Add to Server** · **Add to My Apps** · **Website** · **Share Link**.
- Add to Server opens Discord's server picker; Add to My Apps opens the account install; Website opens dioreo.app. Cancel out of both installs.
- Share Link posts "Add Dioreo — COD:M companion bot!" publicly with the install link, and the panel's buttons stay live after it (the panel is deliberately exempt from the idle timer).
- It defaults to public. No Show Everyone button, by decision.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 4. `/draw prices` and `/draw calculator`

- **Registered description:** "Lucky Draw Commands"
- **`/draw prices`:** "View the CP cost breakdown for Lucky Draws"
- **`/draw calculator`:** "Calculate costs & CP of draws and upgrades"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `prices type` | text | Open one draw type on its own | 14 choices (read them in the picker) |
| `prices region` | text | Jump directly to a specific CP region | 10 CP Region · 20 CP Region · 30 CP Region |
| `prices visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |
| `calculator page` | text | Open on a specific screen | Start a Calculation · View Saved · Help |
| `calculator visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

**Click: `/draw prices`**

- Region buttons **10 CP Region · 20 CP Region · 30 CP Region**: each page prices every draw for that region. Page through all pages, including the Series Armory page and the two Advanced pages.
- The **Jump to a draw type** dropdown and `type:` open one draw alone, with **Show All Draws** returning to the pager.
- **Filter** opens a pop-up grouping Normal Draws, Series Armory and Advanced Draws; apply one, read the summary line, then **Filter Again** and **Show All Draws**.
- The footer's fourth slot is **Draw Calculator** here instead of a disabled Draw Prices button: press it.
- `/settings` → Draw Prices Region changes which region opens first; `region:` overrides it.

**Click: `/draw calculator`**

- `page:` opens on Start a Calculation, View Saved or Help. Start with a plain run.
- Add draws (**Add Draws**), set progress, pick a goal (Advanced draws have seven), set **Region & Balance** (accepts `3k`, `250 cards`), set a Mythic upgrade level, pick available 2X offers.
- **Calculate**, then toggle **Simple Breakdown** and **Full Breakdown**. Read **Suggested Purchase** and the **Just Enough** label.
- **Export**, **Save Result**, **View Saved**, **Rename**, **Remove this Selection**, **Remove Draws**, **New Calculation** (asks to click again) and **Restore Calculation**, **Delete** (it asks first, and **Keep It** backs out), and **Draws** / **Draw Prices** in the nav row.
- Calculation visibility (Only You or Public) in the pop-up.
- `docs/claude/2026-10-13-draw-calculator-intake.md` logs his earlier screen-by-screen click-tests of the calculator, which is where expected numbers and wording come from.

**Look at**

- The parent `/draw` is described as "Lucky Draw Commands", but the calculator is CP planning; decide whether the parent line should say so.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 5. `/draws`

- **Registered description:** "View new and returning draws this season"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `page` | text | Jump directly to New Draws or Returning Draws | New Draws · Returning Draws |
| `visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

**Click**

- **New Draws** and **Returning Draws** pages; a draw with no image says so; an empty page says there are none.
- Each draw: its title as a heading with the date quoted under it. **Calculate** opens `/draw calculator` with the season's draws filled in.
- The season's emoji sits before the season title. Page through with the pager: with three or more pages it loops past the ends.
- A long draw page stays under the 4,000-character cap and shows "…and N more" instead of failing.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 6. `/calendar`

- **Registered description:** "View this season's in-game event timeline"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `page` | text | Jump directly to a specific page | Draws · Events · Playlists & Modes |
| `filter` | text | Show the full timeline, or only past, live or upcoming entries | Full Timeline · Past/Ended · Live Right Now · Upcoming |
| `visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

**Click**

- Toggle **Draws · Events · Modes** (the open one green and disabled). The `page:` option calls the last one "Playlists & Modes".
- Each entry has a green, white or red dot and a finished one is struck through; finished first, then live, then upcoming. A section of five or more folds older finished entries into "+N more ended".
- The filter dropdown ("Filter the timeline…"): Live, Past/Ended, Upcoming, Lucky Draws, Special Events, Playlists & Modes. In a filtered view the footer's Calendar slot becomes a blurple **Full Calendar**.
- `filter:` from the slash option (Full Timeline, Past/Ended, Live Right Now, Upcoming) reaches the same views. The pager loops.
- Season banner at the top and the season emoji on the title.

**Look at**

- The slash `filter` choices (4) are a subset of the panel dropdown (6); the panel adds Lucky Draws, Special Events and Playlists & Modes. Decide whether the slash option should offer them too.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 7. `/season end`

- **Registered description:** "Seasonal countdowns and details"
- **`/season end`:** "Check countdowns for when this season ends"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `end visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

**Click**

- Each countdown shows its title, the end date and a relative "That's…" line, plus a progress bar (for example ▰▰▰▱▱ 60%) when the season has a start date. A season with no start date should show no bar rather than a wrong one.
- The relative line is a Discord timestamp, so it ticks without a refresh.
- Footer row; no other controls.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 8. `/patch notes`

- **Registered description:** "Balance adjustments and updates"
- **`/patch notes`:** "View the latest weapon balance changes"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `notes season` | text | Search for a specific previous season | autocomplete |
| `notes visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

**Click**

- The latest notes: the images, the Additional Info text, the subject-to-change disclaimer, the **Source: Leakers on Duty** credit and the release date.
- The previous-seasons dropdown ("View Previous Seasons…") lists the 12 newest; **Search Older Seasons** opens a pop-up ("Season Name or Number", e.g. `7` or `Terminated`) and reaches the rest. `season:` autocomplete does the same.
- A season with no notes yet; a very long Additional Info is cut at a line break with a note.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 9. `/colors`

- **Registered description:** "View colors extracted from your profile"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `page` | text | Jump straight to a specific color source. | Avatar · Banner · Name · Nameplate · Deco |
| `source` | text | Read colors from your main profile, or your profile for this server. | From Main Profile · From Server Profile |
| `visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

**Click**

- Pages Avatar · Banner · Name · Nameplate · Deco: a page you have none of is left off, with a "No custom … detected." line where it matters. The open page is green.
- Each page shows its swatches with names and hex codes, plus **Avatar** and **Banner** link buttons and **Refresh Colors**. Press Refresh: it re-reads the image. The layout reference is `docs/reference/colors-panel.md`.
- `source:` From Main Profile and From Server Profile. Pick From Server Profile with no server profile set, or in a DM: the panel says there are no server colours and offers **Show Global Colors**.
- Compare with the user right-click View Colors and the message one (see the right-click section).

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 10. `/timestamp`

- **Registered description:** "Convert text into copyable Discord timestamps"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `datetime` | text, required | e.g. "tomorrow", "sun 4:30pm", "19:30" |  |
| `timezone` | text | Your timezone (leave blank for your /settings one) | 15 choices (read them in the picker) |
| `style` | text | Pick a view or one format (blank = your saved view) | 11 choices (read them in the picker) |
| `visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |
| `view` | text | Embed panel or plain text (default: Embed) | Embed (Styled Panel) · Text (Plain, Copyable) |

**Click**

- `datetime:` `tomorrow`, `sun 4:30pm`, `19:30`, then a range (`8pm to 10pm`, `oct 24 to oct 27`): each format shows start – end with one copyable code.
- The default view is **Timestamp Codes** with Short List (six formats); the dropdown ("Switch to a singular layout style…") offers All Formats Overview and each format. One format is the same panel with one row.
- `timezone:` blank uses the zone saved in `/settings`; pick another and check the result. `style:` and `view:` (Embed or plain Text); switching style in text mode stays in text mode.
- Tap a code to copy it on a phone.

**Look at**

- **Daylight saving.** The zone labels (for example "(UTC-04:00) Eastern (Toronto/NY) (EDT)") are computed when the bot starts and registered once, and nothing re-registers them. Clocks go back in Europe on 2026-10-25 and in Canada and the US on 2026-11-01, so the London, Paris, Stockholm, Toronto, Winnipeg, Edmonton and Vancouver labels will read an hour wrong until the bot next restarts. The saved values are zone names and stay correct. Low severity, found while reading `commands/timestamp.js` and `bot/lifecycle.js`; not filed anywhere yet.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 11. `/settings`

- **Registered description:** "Customize your bot settings and preferences"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `open` | text | Open straight on one part of your settings. | Visibility · Preferences · Colors |
| `visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

**Click**

- The header: title, your mention, name and id, and below it one date line, **Dioreo User Since** (the first command you ran yourself; on your very first `/settings` it shows now). **Member Since** is gone as of v3.109.0-pre.
- Buttons: **Avatar** and **Banner** (links), **View Colors**. Your Stats is hidden until after v3, so no button.
- Page 1, **Default Visibility**: Weapon Builds, Seasonal Content, Draw Calculator, Timestamps, Settings Dashboard, Colors, each a Show/Hide toggle that flips "Visible to everyone" and "Visible only to me". Check each against the matching command's default.
- Page 2, **Default Preferences**: Draw Prices Region, CP Currency and Timezone (each has a search entry that opens a pop-up), Timestamp Style, Accent Color Style (Pre-Designed Palette, Avatar Color, Dynamic Profile Colors).
- `open:` Visibility, Preferences, Colors. Colors lands on the View Colors panel with no dashboard behind it.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

## Server admins

### 12. `/admin`

- **Registered description:** "SERVER ADMINS: control Dioreo's server settings"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

He click-tested this panel on the dev bot on 2026-10-22; this pass is the options and description read, plus a re-check after any later change.

**Click**

- Needs Manage Server, servers only. The panel is titled **Server Settings** and names the server, with tabs **Overview · Channels · Roles · Commands**, the open one blurple and disabled, and **Help** as its own private message.
- Rules read as coloured dots and the word **Private** or **Public**. Each Clear button sits beside what it clears.
- Commands tab: one dropdown marked by state; give a command its own settings and check it then uses only those. Order of precedence: role in this channel, role everywhere, channel, default.
- **Check a Member:** pick a member, an ID or a role and read the rule behind each answer.
- **Change log:** 60 days, who changed what, exports as a text file, cannot be cleared from Discord. **Reset Everything** takes two presses.
- Make a rule private, run a command as a plain member: the reply is private and a notice says why (at most twice per change).

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

## Owner and allowlisted admins

These live on the Dioreo Admin app when it is configured, so they stay out of every player's command list. Review them after the player commands.

### 13a. `/manage`

- **Registered description:** "Manage gunsmith builds and seasonal bot data"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `content` | text | Jump directly to a content type | Draws · Calendar · Patch Notes · MP Loadouts · DMZ Loadouts · Season: Titles & Deadlines · Season: Next Season Draft · Announcement · Bulk Format Guide |
| `action` | text | Jump straight to one of that section's own actions (pick content first) | autocomplete |
| `visibility` | text | Show this panel only to you, or publicly to everyone in the chat. (Defaults to only you.) | Hidden · Public |

**Click**

- Open every page through `content:` and through the in-panel dropdown: Draws, Calendar, Patch Notes, MP Loadouts, DMZ Loadouts, Season: Titles & Deadlines, Next Season Draft, Announcement, Bulk Format Guide.
- On each page: Add, Edit, Delete, the bulk buttons, Export (inside each page), Purge (Draws, Calendar and Patch Notes only), and the format **Guide**. `action:` jumps straight to one of them. Every write posts a confirmation and shows in `/bot analytics` → Changes; try Undo.
- An allowlisted admin without a tier sees a warning naming the tier and page (Create or Destructive), not a silent refusal. Detail: `.claude/rules/manage-panel.md`, `.claude/rules/admin-access-and-announcements.md`.
- Announcement: post one to yourself with a start date and an expiry; the launch announcement draft in `docs/claude/2026-10-23-v3-launch-announcement-draft.md` is the text to try.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 13b. `/bot`

- **Registered description:** "Dioreo analytics and admin access"
- **`/bot analytics`:** "View the bot's usage, timing and health data"
- **`/bot access`:** "Manage the admin allowlist (owner-only)"
- **`/bot servers`:** "View or reset a server's /admin rules (owner-only)"
- **`/bot hotpatch`:** "Reload changed files without a restart"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `analytics page` | text | Jump directly to a page (defaults to Health) | Health · Alerts · Changes · Usage · Timing |
| `analytics visibility` | text | Show this panel only to you, or publicly to everyone in the chat. (Defaults to only you.) | Hidden · Public |
| `access visibility` | text | Show this panel only to you, or publicly to everyone in the chat. (Defaults to only you.) | Hidden · Public |
| `servers server` | text | Server ID (blank: pick this server or type an ID) |  |
| `hotpatch pull` | yes/no | git pull first (default: yes) |  |
| `hotpatch dry_run` | yes/no | Show the plan and change nothing |  |
| `hotpatch file` | text | Limit to one changed file (default: everything the pull brought in) | autocomplete |

**Click**

- `analytics`: Health · Alerts · Changes · Usage · Timing, and each page's export buttons. `page:` opens on one.
- `access` (owner only): the admin list, Edit Permissions, Revoke (two-step). `servers` (owner only): view, reset or delete one server's settings by ID. `hotpatch` (owner only): `dry_run:` first.
- A non-owner admin must not reach `access`, `servers` or `hotpatch` by any route.

**Look at**

- `servers` is described as "View or reset a server's /admin rules", but v3.108.0 also lets the owner delete one server's settings. Decide whether the description should say so.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 13c. `/autobuild`

- **Registered description:** "Make an MP/DMZ gunsmith build from an image"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `screenshot` | file | The Gunsmith screenshot (or use the url option instead) |  |
| `url` | text | A URL to the screenshot, instead of an attachment |  |
| `category` | text | Weapon category (optional -- will look up or ask if omitted) | AR · SMG · LMG · MARKSMAN · SNIPER · SHOTGUN · SECONDARIES |
| `mode` | text | MP or DMZ (optional -- read from the screenshot if omitted) | MP · DMZ |
| `badges` | text | meta, best, top5, capable, toxic, ass, hp, s&d... (optional, this build only) |  |
| `retry_token` | text | Only used when re-submitting an image after a Cloudinary upload failure |  |
| `visibility` | text | Show this response only to you, or publicly to everyone in the chat. (Defaults to only you.) | Hidden · Public |
| `screenshot2` | file | Another Gunsmith screenshot, read in the same batch |  |
| `screenshot3` | file | Another Gunsmith screenshot, read in the same batch |  |
| `screenshot4` | file | Another Gunsmith screenshot, read in the same batch |  |
| `screenshot5` | file | Another Gunsmith screenshot, read in the same batch |  |
| `screenshot6` | file | Another Gunsmith screenshot, read in the same batch |  |
| `screenshot7` | file | Another Gunsmith screenshot, read in the same batch |  |
| `screenshot8` | file | Another Gunsmith screenshot, read in the same batch |  |
| `screenshot9` | file | Another Gunsmith screenshot, read in the same batch |  |
| `screenshot10` | file | Another Gunsmith screenshot, read in the same batch |  |

**Click**

- One screenshot, then up to ten in one batch panel (MP and DMZ builds); `url:` instead of an attachment; `category:`, `mode:` and `badges:` overrides.
- The review card: its warning for a weapon or attachment the catalogue does not know, **Save anyway** and **Back to edit**.
- A Cloudinary failure offers a retry that fills `retry_token`.

**Look at**

- `retry_token` shows in the picker with an internal description ("Only used when re-submitting an image after a Cloudinary upload failure"). It is not something a person should type; decide whether it belongs in the list.
- The nine extra screenshot slots (`screenshot2` to `screenshot10`) all carry the same description, so the picker is 16 options long.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

## Dev bot only

Neither registers on prod (`devOnly`). `/dmz` is hidden until its DMZ update, the first feature after the v3 launch; this pass can wait until then.

### 14a. `/dmz`

- **Registered description:** "Search through all DMZ specific gunsmith builds"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `weapon` | text, required | The DMZ weapon you want a build for | autocomplete |
| `build` | whole number | Jump to a specific build number |  |
| `visibility` | text | Show this response only to you, or publicly to everyone in the chat. | Hidden · Public |

**Click**

- `weapon:` (required, autocomplete), `build:` and `visibility:`. The card matches `/gunsmith dmz`. Before it returns to prod, restore its `/help` entries (`docs/db-deferred-list.md`, Queued).

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

### 14b. `/embedtest`

- **Registered description:** "Dev bot: render pasted message JSON"

| Option | Kind | Description as registered | Choices |
|---|---|---|---|
| `json` | text | The message JSON (leave empty to paste it in a box instead) |  |
| `file` | file | A .json or .txt file, for a payload too long to paste |  |
| `visibility` | text | Show the render only to you, or to everyone in the chat (default: what the JSON says) | Hidden · Public |

**Click**

- Paste message JSON (option, file, or the 4,000-character pop-up): it renders as a real message, buttons become inert, and unmatched emoji are listed privately.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

## Right-click commands

These have no description or options in Discord (a right-click command cannot). Review the name in the Apps menu and the panel it opens. Where each lives: right-click a message or a person, then Apps.

| Name | On | Who | What it opens |
|---|---|---|---|
| Convert Times | message | everyone | Every date and time in the message as Discord timestamps, privately, read in your `/settings` zone when the text gives none |
| View Colors | person | everyone | Their palette, paged like `/colors`, public by default, no timeout; pages they lack are left off |
| View Colors | message | everyone | The same panel for the message's author |
| Add to Patch Notes | message | admin | A private panel with the post's images and a season dropdown: **Add images**, **Replace images**, **Create season** |
| Add to Draws | message | admin | `/manage`'s Add Draw box pre-filled from the post |
| Add to Calendar | message | admin | `/manage`'s Add Calendar Event box pre-filled from the post |
| Autobuild Gunsmith | message | admin | `/autobuild` on the post's image; a picker when there are several |

- Check the names read well in the menu and that the admin ones are absent for a plain account. Discord allows five message right-clicks per app, so the admin four sit on the Dioreo Admin app.
- For each: use it on a plain post, on a forward of a post, and on a message with no image or no date.

- **Verdict:** [ ] approved · [ ] changes wanted. Notes:

## When a group is done

Tick the group in the roadmap block (`docs/ROADMAP.md`, "A per-command review checklist"), keep any changes-wanted notes here, and file each change wanted as its own deferred-list entry so none is lost when this sheet is archived.
