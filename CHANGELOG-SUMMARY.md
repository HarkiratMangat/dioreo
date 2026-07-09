# What's New — Dior's Builds

The short version. For the full technical write-up, see [CHANGELOG.md](CHANGELOG.md).

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
