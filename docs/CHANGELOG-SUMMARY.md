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
- **Page arrows that loop** back to the first page on longer builds instead of dead-ending.

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

## v2.23.0 — July 18, 2026
- **The admin panel's weapon-build page is finally clear about images.** It now explains right there
  that build screenshots have to be uploaded to Cloudinary separately (not through the bot), and that
  whatever name Cloudinary gives the file has to be typed in exactly. Adding or editing a build now
  also warns right away if that image can't be found yet, instead of silently saving a broken picture
  you'd only discover later.

## v2.22.0 — July 18, 2026
- **`/settings` now goes quietly inactive after 10 minutes of no use** — leave the panel open and
  forget about it, and its buttons/dropdowns just stop responding on their own (no error message,
  nothing to click). Actively using it — clicking around, changing a setting — keeps it alive
  indefinitely; it's only a full 10 minutes of silence that puts it to sleep. Just run `/settings`
  again for a fresh one.

## v2.21.0 — July 18, 2026
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

## v2.18.0 — July 14, 2026
- **The admin panel (`/manage`) is now locked down to Dior only** — no one else can press its buttons
  anymore, even if the panel ends up visible to others.
- **`/settings` is now locked to whoever ran it**, and the panel now expires after 15 minutes so an
  old, forgotten-about settings screen can't be clicked later.
- The **"Share Publicly" button is now "Show Everyone"**, with a new custom icon.
- **`/timestamp` can now show plain, copyable text** instead of the usual styled panel — add
  `format: Text` when using the command.

## v2.17.0–v2.17.1 — July 13, 2026
- Fixed "This interaction failed" errors that could hit any command — the new color panel was
  overloading the bot's free hosting and making unrelated commands time out. It's now much lighter.
- The color panel's Banner, Display Name, and Nameplate previews are now sized consistently.

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

## v2.10.0–v2.11.0 — July 12, 2026
- Big redesign of **`/draw prices`** (cleaner per-draw breakdowns, 2 pages), the **`/manage`** admin
  panel (safer edits with confirm/undo steps), and **`/settings`** (2 pages, more preferences).
- Draw images are now backed up so they don't break when the original link dies.

## v2.9.0 — July 9, 2026
- The admin `/update` command was folded into `/manage`, so there's one admin command instead of two.

## v2.8.0 — July 9, 2026
- DMZ builds can now show range-based rank badges (Best/Top Close Range, Best/Top Mid-Long Range).

## v2.7 — July 9, 2026
- Fixed DMZ loadouts showing a fake "Gunsmith Code" that couldn't actually be used in-game.
- Added a big batch of real weapon data: full DMZ builds for the first time ever (SO-14, Type 19,
  AS VAL, AK117, Fennec, J358, Outlaw), extra builds for PKM and SKS, and several new Secondaries
  (Machine Pistol, Crossbow, Dobvra, Shorty) plus a new Shotgun (R9-0).
- Fixed two weapons that had the wrong name saved: "GS50" is actually **.50 GS**, and "LCAR" is
  actually **L-CAR 9**.

## v2.6 — July 8, 2026
- 7 weapons that only had a badge (no real build yet) now show up in the bot with a "Coming Soon"
  placeholder instead of not appearing at all.
- Added this very changelog system.

## v2.51 — July 8, 2026
- Added a new **"Toxic"** badge for unbalanced/cheese weapon builds.
- Badges added in bulk to 28 weapons across every category.

## v2.5 — July 8, 2026
- Behind-the-scenes speed and stability improvements. Nothing visually different.

## v2.4 — July 8, 2026
- Badge system got smarter — categories aren't stuck at "Top 3" anymore, some can go up to Top 5+.
- Editing a weapon's badges now updates ALL builds of that weapon, not just one.
- Search got more forgiving — typos and missing spaces (like "dlq" for "DL Q33") now still find
  the right weapon.

## v2.31 — July 7, 2026
- Wrote up the previous update's design decisions for the record. No user-facing change.

## v2.3 — July 7, 2026
- Big redesign of the weapon loadout card: weapon name front and center, new badges shown under
  it, a new "Copy Attachments" button, and cleaner section headings.

## v2.21 — July 7, 2026
- Weapon categories (AR, SMG, Sniper, etc.) each got their own accent color.
- Groundwork laid for a future `/secondaries` command.

## v2.2 — July 7, 2026
- Fixed a couple of real crashes that could take the bot offline.
- Fixed "Share Publicly" not working in some servers.
- General visual cleanup across several commands.

## v2.1 — July 7, 2026
- Fixed the bot not showing up at all when DMed directly or added as a personal app — it now works
  everywhere it's supposed to.

## v2.0 — July 6, 2026
- Complete visual overhaul of the entire bot using Discord's newest UI system.
- Weapon loadouts moved to a proper database instead of a spreadsheet.
- This is the point Harkirat started building the bot together with Claude.

---
### Earlier history (solo-built)

## v1.7 — July 4, 2026
- Added the `/timestamp` command for converting dates/times across timezones.

## v1.6–v1.61 — May 17, 2026
- Fixed the bot going to sleep on its free hosting plan.

## v1.5 — April 8, 2026
- Added screenshots for weapon loadouts.

## v1.4 — April 8, 2026
- Big bug-fix pass, plus fuzzy search, inline fields, and a green Copy button. The point the bot
  felt like a real, usable release.

## v1.3 — April 8, 2026
- Built out the original embed-design system the bot used before Components V2 existed.

## v1.2–v1.21 — April 8, 2026
- Added autocomplete, fuzzy search, and per-category weapon commands, plus follow-up bug fixes.

## v1.1 — April 8, 2026
- Added most of the weapon loadout data, stored in a spreadsheet.

## v1.0 — April 8, 2026
- Original bot launch: just one weapon (LOCUS), to prove the bot worked at all.
