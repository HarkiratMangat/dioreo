---
kind: spec
status: approved
---

# `/help` command — design

*Dated snapshot of what was decided on 2026-08-08 and why. Superseded by a new dated spec if the
design changes materially — this file is not edited after the fact.*

## Goal

A user-facing `/help` command (ROADMAP.md:226) that documents the bot's commands/features and
gives users a way to contact Harkirat (bug reports / suggestions), folded in as one requirement per
his 2026-07-18 note rather than a separate feature. This is the first of two v3 features scoped this
session (`feat/help-command`, off `v3-pre-release`); the Announcement feature (ROADMAP.md:257) is a
separate branch/spec to follow.

**Explicitly out of scope:** the Discord Developer Portal description rewrite that points users at
`/help` (ROADMAP.md:230–234) — Harkirat's own manual click-through once this ships, trivial, "can be
done whenever."

## Command surface

- New `commands/help.js`. User-installed (`setIntegrationTypes([1])`), works in guilds and DMs, no
  new permissions — matches every other public-facing command per the user-installed-only invariant.
- `/help` takes one optional string option, **`cmd`**, with `.setAutocomplete(true)` (same pattern as
  `patchnotes.js`'s `version` option and `dmz.js`'s build-search option; autocomplete dispatch lives
  in `index.js`'s `interaction.isAutocomplete()` branch). Typing `/help cmd:` and picking a command
  jumps straight to that command's category, pre-selected, skipping the landing page — a direct path
  for someone who already knows what they're looking for.
- Response is ephemeral, consistent with other info/settings-style panels.

## Content model

Static, hand-written data baked into `help.js` — not pulled from each command's
`SlashCommandBuilder.setDescription()` (those are terse, 100-char-limited, and not written as
user-facing copy). A `HELP_CATEGORIES` structure: each category has a label, an emoji, and a list of
`{ command, description }` entries written in the bot's own voice, matching the quality bar of its
other embeds — this is not a plain command/description dump.

**Categories** (9 user-facing commands; `manage`, `autobuild`, `alerts` are admin-only and excluded):
- **Loadouts** — `dmz`
- **Lucky Draws** — `draws`, `drawprices`
- **Calendar & Patch Notes** — `calendar`, `patchnotes`, `seasonend`
- **Personalization** — `colors`, `settings`
- **Utility** — `timestamp`

## Layout (Components V2)

Follows the `/manage`-panel pattern already established in this codebase:

- **Landing state** (no `cmd` option, or on open): title block ("Dioreo Help" or similar), a short
  overview blurb on what the bot does, the contact line, and a category select menu (Action Row).
- **Contact line** — always visible regardless of which category is selected: a raw Discord mention
  of Harkirat, e.g. "Found a bug or have a suggestion? Message <@1139845545754632283>." No fetch
  needed — a raw `<@ID>` string renders as a live mention.
- **Category selected** (via dropdown, or via `cmd:` autocomplete jump) — same panel, body swaps to
  that category's command list, dropdown's selected option reflects the current category. Same
  synthetic-interaction re-render pattern `/manage`'s page switcher uses
  (`buildSyntheticInteraction`, never `Object.assign`).
- No pagination inside a category — each category is short (1–3 commands), fits one screen.
- **Design bar: this must be a genuinely well-designed embed**, not a bare list — Harkirat's explicit
  ask. Reuse the shared UI builders (`titleBlock`, `sendV2Payload`, etc. per
  `.claude/rules/rendering-and-ui.md`) and put real layout effort in: clear visual hierarchy between
  category picker / command list / contact line, not just paragraphs of text stacked in one field.

## Accent color

**Pastel-yet-bright yellow**, distinct from `patchnotes.js`'s existing Patch Gold
(`#F2C230` / `15909424`, a deeper amber-gold). Proposed: **`#FFE66D` / `16770669`** — a brighter,
lighter yellow that reads as pastel without being washed out. Follows the existing
`PRESET_ACCENT` convention (`commands/*.js` top-of-file constant with hex comment).

## Data flow / error handling

- Single render function, e.g. `renderHelpPanel(interaction, selectedCategory?)`, called from both
  `execute()` (handles the optional `cmd:` option by resolving it to its category) and the
  category-select-menu interaction handler.
- No DB reads, no external calls — fully static data. Nothing to fail beyond normal interaction
  plumbing, already covered by the global crash-resilience wrapper (`index.js`'s top-level
  try/catch + the `client.on('error', ...)` listener).
- `cmd:` autocomplete suggestions are generated from the same static `HELP_CATEGORIES` structure
  (command names + fuzzy match against the typed prefix), so there's a single source of truth for
  both the dropdown content and the autocomplete list.

## Testing

Boot-test on the local dev bot (`Dioreo (Dev)`, `--env-file=.env.dev`): verify the landing page
renders, category dropdown swaps content correctly, `cmd:` autocomplete suggests and jumps correctly,
contact mention renders as a live tappable mention, and total component count stays under the 40-per-
message Components V2 cap.
