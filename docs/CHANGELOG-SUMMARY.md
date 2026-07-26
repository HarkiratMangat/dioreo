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
