---
paths:
  - "models/**"
---

# Data models (`models/`) & the schema-save gotcha

*Loads when you touch `models/**`. The universal "declare the field in the schema or it silently won't
persist" rule also lives in root CLAUDE.md's invariants.*

## Database schema gotcha
Mongoose only persists fields **declared in the schema**. Several past bugs were
exactly this: code setting `doc.someNewField = x; await doc.save()` where
`someNewField` was never added to the Mongoose schema — it looked like it worked
(in-memory) but silently reverted on the next fresh fetch. **Whenever you add a new
field anywhere in the codebase, add it to the corresponding schema in `models/` in
the same change**, or it will not actually save.

## Data models (`models/`)
- `SeasonalData.js` — one global document (`docType: 'global'`). Holds
  `currentSeasonTitle`/`bpTitle`/`rankTitle`/`dmzTitle`, `bpEnd`/`rankEnd`/`dmzEnd`,
  `patchNotes[]` (title = season # & name, NOT "Balance Changes for..." — see
  patchnotes.js), `newDraws[]`/`returningDraws[]`, `calendar[]` (with `endDate`/
  `isOngoing` for "All Season" events).
  - **`draft` (added 2026-07-30 22:24 EDT)** — a next-season staging sub-document mirroring
    `currentSeasonTitle`/`bpTitle`/`rankTitle`/`dmzTitle`/`bpEnd`/`rankEnd`/`dmzEnd`/`newDraws[]`/
    `returningDraws[]`/`calendar[]` (no `patchNotes` — that already has its own overlap-safe "Add New
    Season" flow). Exists because this whole document is a SINGLE global doc — editing next-season
    data directly during the overlap window between "current season not over" and "new season
    announced" immediately overwrites what's live. `/manage` → "Next Season Draft" stages into these
    fields; "Promote to Live" (`index.js`'s `mng_draftpromoteconfirm` handler) copies them onto the
    top-level fields in one save and clears the draft — see `.claude/rules/manage-panel.md`.
- `UserPreference.js` — per-user. `seasonalVisibility` is a **shared** toggle
  covering `/season end`, `/draws`, `/patch notes`, `/calendar`, `/draw prices`
  together (Option A design decision — see `.claude/rules/design-decisions.md`). `timestampVisibility`,
  `settingsVisibility`, `defaultRegion`, `loadoutVisibility` are each independent.
  `calendarEventFilter` (`'active'|'all'`, default `'all'`) backs `/calendar`'s
  "Show Active Events Only"/"Show All Events" toggle — deliberately NOT exposed in
  `/settings` (Harkirat's request); `/calendar`'s own button reads/writes it directly,
  it's the only place this field is ever touched. `accentColorStyle`
  (`'avatar'|'banner'|'preset'`, default `'avatar'`; `'default'` is the old value name
  for `'preset'`, still treated identically) plus the independently-cached
  `avatarColorHex`/`avatarColorSource` and `bannerColorHex`/`bannerColorSource` pairs
  back the accent color system — see `.claude/rules/accent-and-colors.md`.
- `Loadout.js` — weapon loadouts, `mode: 'MP' | 'DMZ'` (MP max 5 attachments, DMZ max 9).
  `description` (optional flavor text) and `shareCode` (the actual copyable in-game Gunsmith
  code) were added during the builds.xlsx migration — see `.claude/rules/loadouts.md` for why
  `shareCode` is separate from `buildName` despite `/manage`'s modal labeling the latter
  "Build Name / Share Code". Has a compound index on `{ category: 1, mode: 1 }` — every
  autocomplete keystroke and every `/<category>` command filters on this pair together;
  harmless at the current collection size (~100-200 docs) but cheap to add ahead of it
  actually mattering.
- `BotInstance.js` (added 2026-07-25) — lock doc backing the startup single-instance guard, one
  PER BOT TOKEN (`_id` = a hash of `BOT_TOKEN`, not a fixed singleton -- a production bot and a
  separate test/dev bot application must be allowed to run simultaneously even against the same
  Mongo cluster). `hostname`/`pid`/`startedAt`/`lastHeartbeat`, refreshed on a 10s interval by
  whichever process holds a given token's lock. See `utils/instanceLock.js` and `docs/ROADMAP.md`'s
  "Single-instance guard" entry for the full mechanism.

