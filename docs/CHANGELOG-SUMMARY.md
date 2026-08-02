# What's New — Dior's Builds

The short version. For the full technical write-up, see [CHANGELOG.md](CHANGELOG.md).

## 🔜 Coming soon
A peek at what's planned (not built yet):
- **Faster, safer bulk editing** in the admin panel — search for items and pick them from a list
  instead of pasting names.
- **Reliability polish** so the bot never double-responds or drops a click.
- **Snappier page-switching** in busier commands (like flipping between New/Returning draws).
- **Richer colour extraction** — more variety pulled from your avatar, so a standout colour doesn't
  get missed.

### Further out
- **A `/help` command** explaining everything the bot can do, with a way to reach Dior directly for
  bug reports or requests.
- **`/meta`** — see every weapon currently marked Meta, in one place.
- **A draw cost calculator** — tells you what it'll cost to finish a draw from where you are, and
  which top-up you'd need.
- **In-bot announcements** — a heads-up message (e.g. "sorry the bot was down — we've moved to a better
  host") shown once the next time you use any command.
- **An easier way to add & share the bot**, including where user-installed apps are blocked.
- **A `/define` command** (Urban Dictionary lookup) — just for fun.
- Eventually: **text commands** (like `d b ak117`) with a custom prefix per server, **submitting your
  own loadouts** for review, and further out still, **building your own gunsmith right in the bot**.

---

## v2.48.0 — August 2, 2026
- **Nothing in the bot changed this release.** All of this was behind-the-scenes work on how the
  project's own notes and history are stored, so nothing you use in Discord looks or behaves any
  differently.
- **The project's memory got a size limit and a tidy-up.** The file that lists everything the project
  remembers had grown close to unreadable; it now has a ceiling, a place to retire finished notes, and
  an automatic check that nothing goes missing.
- **A filing problem was found and fixed.** About a third of the project's saved notes had been filed
  under the wrong labels — including the entire session that wrote the licence and privacy policy — so
  searching for them quietly turned up nothing. All of it was recovered, with nothing lost.

## v2.47.1 — August 2, 2026
- **The website now updates itself.** It was still showing an older version of a page even after the
  change had been finished and released — publishing was a manual step somebody had to remember. It
  happens automatically now, and it checks that the live site really is the new version afterwards
  rather than assuming.
- **It skips pointless republishes.** Writing a changelog entry no longer republishes the whole site,
  since those pages aren't linked from anywhere yet.

## v2.47.0 — August 2, 2026
- **The legal site's navigation buttons often did nothing when you clicked them.** Fixed — a leftover
  drag gesture was cancelling the click whenever your hand moved a few pixels, which is most clicks.
- **The menu on phones is a swipeable row of tabs** — every page on one line, the one you are reading
  always visible, and no menu to open first. Tapping one makes the highlight assemble itself out of a
  swarm of droplets. Buttons no longer get stuck looking "pressed" after you tap them.
- **The header on phones stopped overlapping itself.** "Dior's Builds" was being drawn straight across
  the buttons beside it; there is room for everything now, and the Discord button says INSTALL rather
  than being a bare circle that looked like a sign-in.
- **The section list beside long documents no longer has its own scrollbar.** It follows the page as
  you read, so you never have to scroll it separately.
- **The menu label stopped going unreadable while you hover.** The word turned dark up to half a
  second before the highlight arrived underneath it, leaving dark text on a dark bar.
- **The opening line on Terms and Privacy read like a sentence cut in half.** It was — fixed.
- **A "back to top" button** on the long documents, with a ring showing how far through you are.
- **Download buttons** for the plain-text licence and notice.
- **Copy buttons** on every code block in the contributing guide.
- **The home page was off centre.** Fixed, along with a pass over its hover effects and spacing.
- **The highlight behind the menu now breaks apart and rebuilds itself** when you move between pages,
  instead of sliding along as one piece.
- **The moon on the dark/light switch is a proper thin crescent** — it used to be an almost-full moon.
- **The highlight keeps its colour properly now.** Each page has its own accent, and on phones the
  effect that draws it was washing every one of them out.
- **The menu label was hard to read whenever you pointed at it.** The word went pale on top of the
  bright pill it was sitting on, and only turned dark again once you moved away. Fixed, along with the
  page you are on losing its colour, and the first tab of the other group not lighting up at all.
- **The highlight now builds itself when a page loads**, out of droplets that fly inward and join —
  the same effect the phone menu already had. It plays once, on arrival.
- **Headings stay pinned as you scroll a long document**, so you always know which section you are in,
  and slide away as the next one arrives.
- **The Contributing and Contributors pages carry the same closing notice as the legal documents**, so
  the site no longer says the same thing twice in two different ways at the bottom of a page.
- **You can reach the maintainer on Discord from the site** — the handle on the home page and the name
  in every footer now link to a profile, and the Terms and Privacy Policy list it beside the email.
- **The privacy policy's list of what is stored was incomplete.** Two fields were being stored and not
  listed, under a heading that said "That's the whole list." Both are listed now. **Nothing about what
  is collected changed** — the fields were already stored and already described elsewhere in the
  policy; the list itself was short.
- **The install button's arrow, the email reveal, the ticket cards and the footer** all got a pass:
  a properly aligned arrow, a subtler highlight, a real tearing animation, and the sign-off lined up
  with the links instead of hanging below them.

## v2.46.0 — July 31, 2026
- **`/calendar` is now 3 pages — Draws, Events, and Playlists & Modes** — with buttons to switch
  between them, and Draws is further split into New/Returning sections.
- **A season-end date typo could corrupt every other date on the page.** Fixed — a bad date is now
  rejected instead of silently guessing "right now."
- **Calendar pages can show a banner image**, set per page. Admin-side.
- **Draws admin panel is smarter about thumbnails** — if you leave the image blank, it'll now reuse a
  cached one even from a slightly different or typo'd title, not just an exact match.
- **Patch notes' "Additional Info" can auto-format into a real weapons/attachments/changes layout** —
  admin-side, opt-in, doesn't change anything for existing notes.
- **Behind the scenes: the admin panel's bulk-paste help got a real rewrite** — a proper reference
  guide instead of a plain-text reply, reachable from every relevant page.

## v2.45.0 — July 30, 2026
- **A draw title with a "/" in it no longer gets half-lowercased.** "Jupiter Cannon/Void Implosion
  Draw" was showing up as "Jupiter Cannon/void Implosion Draw" — fixed.
- **Draws can now carry a short note.** Admin-side only — lets a "-# comment" line be added to a
  draw's item list without it getting mistaken for an actual weapon or character name.
- **Patch notes' extra info can now show buff/nerf icons.** Admin-side — typing `b:` or `n:` swaps in
  the buff/nerf icon automatically.
- **Behind the scenes: a proper way to prep next season ahead of time**, so it's not stuck sharing the
  same live data as the season that's still running.

## v2.44.0 — July 30, 2026
- **The "Contributing" and "Contributors" pages on the public site got a proper redesign.** They used to
  be plain walls of text in a box. Now the contributing guide reads as a path you follow, the line you
  need to agree to the contributor terms has its own copy button, and the credits page shows a real
  nameplate — with an empty one beside it waiting for the next person's name.
- **The site briefly went down and is back up.** A publish step silently uploaded nothing; the pages kept
  answering for a while from a cached copy, so it looked fine from the outside. It's fixed, and the
  checker now tests the front page too, which is what caught it.
- *No changes to the bot itself.*

## v2.43.2 — July 29, 2026
- *Internal only — notes for Dior's own future reference about how the legal-page builder works and one
  lesson learned from it. Nothing players see, and no change to the bot.*

## v2.43.1 — July 29, 2026
- **The Terms and Privacy pages are now live and public**, at
  [diors-builds-legal.pages.dev](https://diors-builds-legal.pages.dev). You can read them any time — no
  Discord account, no GitHub, nothing to sign in to.
- Fixed a batch of links inside those pages that pointed nowhere. If a document says "see the licence,"
  that link should actually take you to the licence — so the licence is published too now.
- *Everything else here is internal tooling. No changes to the bot itself.*

## v2.43.0 — July 29, 2026
- **The bot now has a Terms of Service and a Privacy Policy**, and you can read both as proper web
  pages. The privacy policy lists *every single thing* the bot stores about you — field by field — where
  it's kept, and how long for. Short version: your timestamp preference, your region, your colour
  settings, and a few counters. **The bot cannot read your messages**; it isn't technically able to.
- **Your data is stored in Canada.** Nothing about you is sent to any AI system.
- **Want your data deleted?** Email harkirat117@gmail.com and it'll be done. Honest note: there's no
  self-serve button for this yet — it's a manual request for now, and building the automatic version is
  already on the to-do list.
- **The bot's source code now has a proper licence.** You're welcome to read it, study it, audit it for
  security problems, and run it locally for yourself. You can't deploy your own copy for other people to
  use, or use it commercially.
- Credit where it's due: some of the custom emoji you see come from **tofooo** on emoji.gg.
- *Nothing about the bot itself changed in this release — no new commands, no fixes, no behaviour
  differences. It's paperwork, and it's the kind you should be able to actually read.*

## v2.42.2 — July 29, 2026
- *Internal only — fixed a filing mistake in Dior's own development journal (some entries had ended up in the wrong section) and added an automatic check so it can't happen again quietly. Nothing players see.*

## v2.42.1 — July 29, 2026
- *Internal only — tidied up Dior's own repository bookkeeping and wrote down a maintenance task for a future update. Nothing players see.*

## v2.42.0 — July 28, 2026
- *Internal only — added an automatic checker that catches Dior's own documentation going out of date, and fixed a place where the notes claimed something couldn't be checked when it could. Nothing players see.*

## v2.41.4 — July 28, 2026
- *Internal only — recovered some configuration work that was accidentally discarded, and wrote down how to avoid repeating it. Nothing players see.*

## v2.41.3 — July 28, 2026
- *Internal only — corrected an inaccurate figure in Dior's own developer notes. Nothing players see.*

## v2.41.2 — July 28, 2026
- *Internal only — tidied up how Dior's own development journal is indexed so entries can actually be found. Nothing players see.*

## v2.41.1 — July 28, 2026
- *Internal only — added an automatic check so Dior's own notes and documentation can't quietly fall out of date when the bot's code changes. Nothing players see.*

## v2.41.0 — July 28, 2026
- *Internal only — Dior can now see exactly when something went wrong and which version of the bot was running at the time, and the health check finally counts real errors instead of routine reconnects. Nothing players see.*

## v2.40.0 — July 28, 2026
- *Internal only — Dior's project notes now get written up automatically-checked, so the behind-the-scenes record stops falling behind. Nothing players see.*

## v2.39.2 — July 28, 2026
- *Internal only — wrote up the behind-the-scenes notes for the previous update. Nothing players see.*

## v2.39.1 — July 28, 2026
- *Internal only — fixed two out-of-date notes in Dior's own documentation. Nothing players see.*

## v2.39.0 — July 28, 2026
- *Internal only — the safety checks that keep Dior's build process honest are now saved with the
  project itself, so they can't get lost. Nothing players see.*

## v2.38.3 — July 28, 2026
- *Internal only — wrote up the behind-the-scenes notes for the two previous updates. Nothing players see.*

## v2.38.2 — July 28, 2026
- *Internal only — removed two unused access keys for old hosting services Dior no longer uses. Nothing players see.*

## v2.38.1 — July 28, 2026
- *Internal only — removed a stray empty file. Nothing players see.*

## v2.38.0 — July 28, 2026
- *Internal only — Dior's project notes were being kept in a folder the tools had stopped looking in,
  and were found only because a reminder pointed the way each time. They've been moved to the folder
  that gets checked automatically. Nothing players see.*

## v2.37.0 — July 27, 2026
- *Internal tooling-only — the groundwork branch for the bot's next big version now keeps itself up to
  date automatically. Nothing players see.*

## v2.36.3 — July 27, 2026
- *Internal docs-only — added an automatic safety check to Dior's own release tooling. Nothing players see.*

## v2.36.2 — July 27, 2026
- *Internal docs-only — a verification pass over Dior's own project records. Nothing players see.*

## v2.36.1 — July 27, 2026
- *Internal docs-only — housekeeping on Dior's own code branches. Nothing players see.*

## v2.36.0 — July 27, 2026
- *Internal docs-only — tidied up how Dior's own release history is recorded, so each update is now a
  single clean entry in the project's history instead of two. Nothing players see.*

## v2.35.15 — July 27, 2026
- *Internal docs-only — automated a check over Dior's own project records and fixed an instruction that
  had never matched what actually happens. Nothing players see.*

## v2.35.14 — July 27, 2026
Behind-the-scenes only — nothing changes for you.

The bot's old backup host (which it moved off of back on July 17) has now been shut down for good,
after checking the current server had been running cleanly. The bot itself wasn't touched or
restarted — it kept running the whole time.

---

## v2.35.13 — July 27, 2026
- *Internal ops-only — checked the server hosting the bot is healthy and worked out exactly what a
  pending bit of housekeeping needs. Nothing players see; the bot was not restarted.*

## v2.35.12 — July 27, 2026
- *Internal docs-only — tidied Dior's own planning notes so the same to-do can't quietly exist in two
  places with two different answers. Nothing players see.*

## v2.35.11 — July 27, 2026
- *Internal docs-only — a developer note that had gone out of date the same day it was written.
  Nothing players see.*

## v2.35.10 — July 27, 2026
- *Internal docs-only — developer notes brought in line with how the next big version will be built.
  Nothing players see.*

## v2.35.9 — July 27, 2026
- *Internal safety fix — Dior's test copy of the bot could accidentally change or delete the real
  bot's saved images. It can't anymore. Nothing changes for you, but your loadout and patch-note
  images are safer.*

## v2.35.8 — July 27, 2026
- *Internal tooling-only — the bot's code now gets automatically checked for errors every time a change
  is proposed. Nothing players see, but it makes broken updates less likely to reach you.*

## v2.35.7 — July 27, 2026
- *Internal docs-only — a note-to-self about finishing setup on Dior's private planning board.
  Nothing players see.*

## v2.35.6 — July 27, 2026
- *Internal planning-only — wrote down how the next big version of the bot will be built without
  disturbing the one you're using. Nothing players see.*

## v2.35.5 — July 27, 2026
- *Internal docs-only — corrected a wrong file count in the developer notes and wrote down a
  cosmetic GitHub issue to look at later. Nothing players see.*

## v2.35.4 — July 27, 2026
- Fixed patch notes' release date/time showing the wrong day/time when a specific time was entered
  — it now correctly reflects the time you typed.

## v2.35.3 — July 26, 2026
- *Internal tooling-only — a maintenance script for Dior's test copy of the bot. Nothing players see.*

## v2.35.2 — July 26, 2026
Behind-the-scenes only — nothing changes for you.

Tidied up the bot's startup messages and trimmed a tool it only needs for maintenance out of what it
installs to run.

---

## v2.35.1 — July 26, 2026
- *Internal docs-only — jotted down a list of developer tools to look at later. Nothing players see.*

## v2.35.0 — July 26, 2026
Behind-the-scenes only — nothing changes for you.

The bot now refuses to start a second copy of itself by accident, so a leftover test run can't sneak in
and cause the bot to act inconsistently.

---

## v2.34.1 — July 26, 2026
- *Internal docs-only — kept Dior's own developer notes pointing at the right bits of code after the
  last update renamed a couple of them. Nothing players see.*

## v2.34.0 — July 26, 2026
Behind-the-scenes only — nothing changes for you.

Dior's Builds now has a **private test copy of itself** that runs on Dior's own computer. Changes can be
tried out there first, instead of going straight to the bot you use. Fewer surprises, faster fixes.

---

## v2.33.6 — July 26, 2026
- *Internal docs-only — wrote down how Dior's own code changes get labelled, so the project's history
  stays consistent and machine-readable. Nothing players see.*

## v2.33.5 — July 26, 2026
- **`/draw prices` — the Advanced Double Legendary page is a little cleaner.** The NOTE about Regular
  purchases being cheaper than a Normal Draw is gone; the important warning (THE TRAP) stays exactly
  where it was.

## v2.33.4 — July 26, 2026
- *Internal docs-only — built a lightweight GitHub project board for tracking Dior's roadmap, and fixed
  a few stale references left over from the last reorg. Nothing players see.*

## v2.33.3 — July 26, 2026
- *Internal docs-only — finished the to-do-list reorganization v2.33.2 started, and moved the old
  archives out of the way. Nothing players see.*

## v2.33.2 — July 25, 2026
- *Internal docs-only — reorganized where Dior's own to-do/tech-debt list lives. Nothing players see.*

## v2.33.1 — July 25, 2026
- *Internal/admin-only — an options tweak to Dior's private build-import tool. Nothing players see.*

---

## v2.33.0 — July 24, 2026
- *Internal only — nothing players see or interact with changed.* Switched how updates get built and
  released (proper git branches + review before anything goes live), and fixed a behind-the-scenes data
  gap in how admin loadout edits sync to Cloudinary.

---

## v2.32.0 — July 24, 2026
- **Patch notes now span multiple seasons.** Dior can start a fresh season's patch notes (with past
  seasons kept editable) and set a placeholder season title when notes go out before the new season's
  name is announced — so the patch notes you see always show a sensible title. *(Mostly an admin-side
  tool; the player-visible effect is simply correctly-titled, up-to-date patch notes.)*

---

## v2.31.0 — July 22, 2026
- *Internal only — nothing players see or interact with changed.* Reorganized the project's own developer
  documentation (the giant `CLAUDE.md` was split into focused, on-demand files) so future work stays fast
  and well-organized. Also added behind-the-scenes cost tracking for the AI image-reading used by
  `/autobuild` (a log line per call, so spend is easy to audit) — invisible to players; no commands, draws,
  loadouts, or on-screen behaviour changed.

---

## v2.30.2 — July 21, 2026
- **Fixed a crash that could break whole commands.** On pages with exactly two sub-pages, the ◀ ▶ arrows
  could make Discord reject the entire message — so `/settings`, `/draws`, `/calendar`, the colour panel and
  `/alerts` could fail to open. They work again (on a 2-page view the arrows simply grey out at the ends).

---

## v2.30.1 — July 21, 2026
- **Small `/draw prices` fix.** Tidied the Advanced Double Legendary page to match the intended layout —
  removed a few extra divider lines and corrected the "Strategy" heading.

---

## v2.30.0 — July 21, 2026
- **`/draw prices` got a visual refresh.** The Advanced Double Legendary Weapon Draw page is redesigned
  to a cleaner layout — three clearly-labelled purchase modes, the "note" and "trap" tips called out, and
  the strategy guide broken into its own easy-to-read lines (both CP regions).
- **Every draw's heading is now in FULL CAPS** (the lines with the legendary/mythic icon), so the whole
  `/draw prices` list reads consistently.

---

## v2.29.0 — July 21, 2026
- **Fixed swapped loadout pictures** — the L-CAR 9 and Crossbow builds were showing each other's
  screenshots; they now show the right ones.
- Behind the scenes: another round of fixes to the admin `/autobuild` tool (reads the weapon name and
  attachments more accurately) and some loadout data tidy-up. Nothing else players interact with directly.

---

## v2.28.0 — July 21, 2026
- **New in `/draw prices`: the Advanced Double Legendary Weapon Draw.** A full breakdown for both CP
  regions of the three ways to spin it — **Regular Purchase**, **Advanced Purchase**, and the "Trap" — with
  per-pull costs, running totals, and a strategy guide for getting all 4 items, just the 2 Legendaries, or
  1 random Legendary at the lowest CP. It's on its own page — page through with the ◀ ▶ arrows.
- **Pagination arrows now loop.** Anywhere the bot has ◀ ▶ page arrows (draws, calendar, draw prices,
  settings, colours, loadout builds), pressing Next on the last page now wraps around to the first instead
  of doing nothing — and Prev on the first page jumps to the last.
- Behind the scenes: a round of fixes to the admin `/autobuild` tool and richer Cloudinary image
  organisation (nothing players interact with directly).

---

## v2.27.0 — July 21, 2026
- Backend/ops only — nothing changes for players. Quieted the routine "reconnecting to Discord" status
  pings in Dior's private alert channel (they still get logged, just no longer posted) so a real problem
  stands out. Listed here only so no version number is skipped.

---

## v2.26.0 — July 20, 2026
- **New admin tool: `/alerts`.** The bot already messages Dior privately when something goes wrong (a
  crash, losing the Discord connection, a database hiccup). Now every one of those alerts is saved with a
  short ID (like `Jul20-03`), and `/alerts` lets Dior browse recent ones, download the full log as a file,
  and read a plain-language guide to what each colour (🟢🟡🟠🔴) means.
- **Clearer alerts.** "Bot online" now says whether it was a deliberate deploy/restart or an automatic
  recovery; the "reconnecting" alert makes clear the bot didn't crash (just the connection blipped); and
  how-long-it's-been-running reads naturally now (e.g. `2D 22H` instead of a raw minute count).
- Admin-only — nothing changes for players.

---

## v2.25.0 — July 20, 2026
- **New admin tool: near-1-click loadout adding.** Submit a build screenshot and the bot reads off the
  weapon name, Gunsmith code, and attachments automatically instead of typing each one by hand — shows
  a review screen first (edit or cancel before anything saves), then uploads the image and creates the
  real loadout entry. Built, deployed, and live — Dior hasn't run the real end-to-end test in Discord
  yet, so treat this as "should work" rather than "confirmed working" until he has.
- Behind the scenes: switched the image-reading AI from a separate paid Google AI Studio balance (which
  ran dry) to billing against the same Google Cloud account that already runs the bot's hosting — no
  visible change, just a billing fix so the feature can actually run.

---

## v2.24.0 — July 20, 2026
- **Fixed `/patch notes`' broken images.** The current season's screenshots had gone dark (the
  original hosting link expired) — replaced with fresh, permanently-hosted copies, so they display
  reliably for everyone instead of only looking fine to whoever happened to still have cached access.
- Behind-the-scenes Cloudinary cleanup — tidied up file organization so everything shows up properly
  grouped in the admin dashboard.

## v2.23.0 — July 18, 2026
- **The admin panel's weapon-build page is finally clear about images.** It now explains right there
  that build screenshots have to be uploaded to Cloudinary separately (not through the bot), and that
  whatever name Cloudinary gives the file has to be typed in exactly. Adding or editing a build now
  also warns right away if that image can't be found yet, instead of silently saving a broken picture
  you'd only discover later.

## v2.22.0 & v2.22.1 — July 18, 2026
- **`/settings` now goes quietly inactive after 10 minutes of no use** — leave the panel open and
  forget about it, and its buttons/dropdowns just stop responding on their own (no error message,
  nothing to click). Actively using it — clicking around, changing a setting — keeps it alive
  indefinitely; it's only a full 10 minutes of silence that puts it to sleep. Just run `/settings`
  again for a fresh one.
- *(v2.22.1 was a docs-only point release — no bot changes.)*

## v2.21.0 & v2.21.1 — July 18, 2026
- **`/settings` finally has a hide option** — just like every other command, so you can keep your
  settings panel private if you want.
- **Better weapon search** — typing a short or partial name (like `loc`) now works instead of just
  failing; if it could mean more than one weapon, the bot tells you which ones instead of guessing.
- **Command descriptions are tidier** so they don't get cut off on mobile anymore.
- **Download your avatar or banner in full resolution** straight from the color menu, right next to
  the Refresh Colors button.
- **Dior can no longer get accidentally locked out** of someone else's settings/color panel while
  helping out — without ever seeing or changing that person's own data.
- Friendlier, clearer messages when an action gets blocked.
- `/timestamp`'s `format` option renamed to `view` — clearer about what it actually controls.
- **Smarter weapon search** — typing a weapon-class word like "pistol", "smg", or "assault rifle" now
  shows every matching weapon in that category, not just ones whose own name happens to contain that
  word. (`/secondaries` stays exactly as its own command — we just made it easier to find.)
- *(v2.21.1 was a docs/ops-only point release — no bot changes.)*

## v2.20.0 — July 17, 2026
- **Fixed the admin Edit tool.** Editing an existing loadout (or draw/calendar entry) from the `/manage`
  panel was silently failing with a "didn't respond in time" error — now it opens the edit form correctly.
- **The bot keeps a closer eye on itself.** On top of the instant crash/outage alerts, it now sends a
  quiet daily "still healthy" check-in (uptime, servers, latency, memory), and its new-home server now
  tracks memory usage over time — so a slow problem gets noticed early, not just a sudden one.
- **Clearer health alerts** (admin-side): colour-coded by real severity and timestamped, so a routine
  self-recovering blip is easy to tell apart from an actual problem.

## v2.19.0 — July 17, 2026
- **The bot is much more reliable now.** It moved to a new, always-on home (Google Cloud) after the old
  free host kept dropping its connection to Discord — which is what caused those "application did not
  respond" errors. On the new host it connects in seconds and stays up.
- Behind the scenes: the bot now watches its own health and alerts Dior instantly if anything goes wrong,
  so outages get caught fast instead of going unnoticed.

## v2.18.0–v2.18.3 — July 14–16, 2026
- **The admin panel (`/manage`) is now locked down to Dior only** — no one else can press its buttons
  anymore, even if the panel ends up visible to others.
- **`/settings` is now locked to whoever ran it**, and the panel now expires after 15 minutes so an
  old, forgotten-about settings screen can't be clicked later.
- The **"Share Publicly" button is now "Show Everyone"**, with a new custom icon.
- **`/timestamp` can now show plain, copyable text** instead of the usual styled panel — add
  `format: Text` when using the command.
- *(v2.18.1–v2.18.2 were docs/tooling point releases; v2.18.3 added admin-side connection diagnostics —
  nothing players interact with directly.)*

## v2.17.0–v2.17.3 — July 13, 2026
- Fixed "This interaction failed" errors that could hit any command — the new color panel was
  overloading the bot's free hosting and making unrelated commands time out. It's now much lighter.
- The color panel's Banner, Display Name, and Nameplate previews are now sized consistently.
- *(v2.17.2 was a small memory optimization; v2.17.3 was docs-only.)*

## v2.16.0 — July 13, 2026
- **New `/colors` command** (and a "View Colors" button in `/settings`): see the real colors pulled
  from your avatar, banner, display name, nameplate, and decoration, each with a tap-to-copy hex code.
- Two new accent-color styles you can pick in `/settings`: your Nitro **display-name gradient**, or
  a **random one** from your profile each time.

## v2.14.0–v2.15.0 — July 13, 2026
- Patch-notes screenshots no longer break when the original image link dies — they're backed up now.
- Accent colors pulled from your avatar/banner look richer and truer to the image.

## v2.13.0 — July 13, 2026
- Loadout cards got a **"Browse other builds"** dropdown so you can jump between weapons without
  re-running the command.
- `/all` now lists weapons in alphabetical order.

## v2.12.0–v2.12.1 — July 12, 2026
- Fresh color scheme across the seasonal commands (Calendar, Draws, Draw Prices, Patch Notes,
  Season End) and clearer, more consistent command wording.
- Fixed a crash when editing an item in the admin panel.

## v2.10.0–v2.11.1 — July 12, 2026
- Big redesign of **`/draw prices`** (cleaner per-draw breakdowns, 2 pages), the **`/manage`** admin
  panel (safer edits with confirm/undo steps), and **`/settings`** (2 pages, more preferences).
- Draw images are now backed up so they don't break when the original link dies.
- *(v2.11.1 was a follow-up polish pass across those same commands.)*

## v2.9.0 — July 9, 2026
- The admin `/update` command was folded into `/manage`, so there's one admin command instead of two.

## v2.8.0 & v2.8.1 — July 9, 2026
- DMZ builds can now show range-based rank badges (Best/Top Close Range, Best/Top Mid-Long Range).
- *(v2.8.1 was a small fix to how those DMZ badges are scoped.)*

## v2.7.0 & v2.7.1 — July 9, 2026
- Fixed DMZ loadouts showing a fake "Gunsmith Code" that couldn't actually be used in-game.
- Added a big batch of real weapon data: full DMZ builds for the first time ever (SO-14, Type 19,
  AS VAL, AK117, Fennec, J358, Outlaw), extra builds for PKM and SKS, and several new Secondaries
  (Machine Pistol, Crossbow, Dobvra, Shorty) plus a new Shotgun (R9-0).
- Fixed two weapons that had the wrong name saved: "GS50" is actually **.50 GS**, and "LCAR" is
  actually **L-CAR 9**.
- *(v2.7.1 was an internal repo change only.)*

## v2.6.0 — July 8, 2026
- 7 weapons that only had a badge (no real build yet) now show up in the bot with a "Coming Soon"
  placeholder instead of not appearing at all.
- Added this very changelog system.

## v2.5.1 — July 8, 2026
- Added a new **"Toxic"** badge for unbalanced/cheese weapon builds.
- Badges added in bulk to 28 weapons across every category.

## v2.5.0 — July 8, 2026
- Behind-the-scenes speed and stability improvements. Nothing visually different.

## v2.4.0 — July 8, 2026
- Badge system got smarter — categories aren't stuck at "Top 3" anymore, some can go up to Top 5+.
- Editing a weapon's badges now updates ALL builds of that weapon, not just one.
- Search got more forgiving — typos and missing spaces (like "dlq" for "DL Q33") now still find
  the right weapon.

## v2.3.1 — July 7, 2026
- Wrote up the previous update's design decisions for the record. No user-facing change.

## v2.3.0 — July 7, 2026
- Big redesign of the weapon loadout card: weapon name front and center, new badges shown under
  it, a new "Copy Attachments" button, and cleaner section headings.

## v2.2.1 — July 7, 2026
- Weapon categories (AR, SMG, Sniper, etc.) each got their own accent color.
- Groundwork laid for a future `/secondaries` command.

## v2.2.0 — July 7, 2026
- Fixed a couple of real crashes that could take the bot offline.
- Fixed "Share Publicly" not working in some servers.
- General visual cleanup across several commands.

## v2.1.0 — July 7, 2026
- Fixed the bot not showing up at all when DMed directly or added as a personal app — it now works
  everywhere it's supposed to.

## v2.0.0 — July 6, 2026
- Complete visual overhaul of the entire bot using Discord's newest UI system.
- Weapon loadouts moved to a proper database instead of a spreadsheet.
- This is the point Harkirat started building the bot together with Claude.

---
### Earlier history (solo-built)

## v1.7.0 — July 4, 2026
- Added the `/timestamp` command for converting dates/times across timezones.

## v1.6.0–v1.6.1 — May 17, 2026
- Fixed the bot going to sleep on its free hosting plan.

## v1.5.0 — April 8, 2026
- Added screenshots for weapon loadouts.

## v1.4.0 — April 8, 2026
- Big bug-fix pass, plus fuzzy search, inline fields, and a green Copy button. The point the bot
  felt like a real, usable release.

## v1.3.0 — April 8, 2026
- Built out the original embed-design system the bot used before Components V2 existed.

## v1.2.0–v1.2.1 — April 8, 2026
- Added autocomplete, fuzzy search, and per-category weapon commands, plus follow-up bug fixes.

## v1.1.0 — April 8, 2026
- Added most of the weapon loadout data, stored in a spreadsheet.

## v1.0.0 — April 8, 2026
- Original bot launch: just one weapon (LOCUS), to prove the bot worked at all.
