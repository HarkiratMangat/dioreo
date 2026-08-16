---
kind: spec
status: frozen
---

# `/gunsmiths` — consolidating the nine MP loadout commands — design

**Date:** 2026-08-15 19:23–20:25 EDT (surface revised at 20:05 EDT — `search` + `list`, superseding the three-subcommand draft made earlier in this same session) · **Branch target:** `v3-pre-release` · **Ships as:** Pre-Release v3.29.0

## Context — why this exists

The bot currently registers **nine separate commands for one job**: `/all` plus eight per-weapon-category commands (`/ar`, `/lmg`, `/marksman`, `/secondaries`, `/shotgun`, `/smg`, `/sniper`, and a `SECONDARIES` entry forced in ahead of its data). They differ only in a `category` filter on the same Mongo query, they share one card renderer, and none of them has a module in `commands/` — `/all` is hand-built in `bot/registry.js`, the other eight are generated from `Loadout.distinct('category', { mode: 'MP' })` after `ClientReady`, and all nine execute through a ~110-line fallback in `handlers/router.js` reached only because `client.commands.get()` misses them.

That shape costs real work every time anything changes bot-wide: the v3 guild-install pass missed all nine on its first attempt precisely because a `readdir` of `commands/` cannot see them, and `bot/registry.js` carries a standing ⚠️ comment warning the next session about it. Consolidating to one command removes the special case, moves the execute path into an ordinary command module, and deletes the router fallback outright.

Filed in `docs/ROADMAP.md` as *"Consolidate MP loadout commands into one `/loadout weapon:{fuzzy autocomplete}`"*. Harkirat renamed the target to `/gunsmiths` when picking it up, and settled the open forks in this session.

## What ships

```
/gunsmiths search weapon:<autocomplete — MP weapons + category rows>  [build] [visibility]
/gunsmiths list   scope:<11 choices>                                  [visibility]
```

**Two subcommands, two doors onto one engine.** `search` is *"I know the weapon"*; `list` is *"show me a set"*. Harkirat's call, revising a three-subcommand draft (`search`/`meta`/`dmz`) made earlier in this same session: *"the 2 subcommands /gunsmiths search, and /gunsmiths list might be cleaner and more intuitive. WITH a hybrid of my idea 1 trickled into it."*

**`search` is MP-only.** DMZ is not a second mode bolted onto the weapon lookup — it is one of `list`'s scopes, browsed as paginated cards with a weapon-jump dropdown like any other scope. Harkirat, 20:20 EDT: *"search is still MP loadouts only. the dmz loadouts remain under /gunsmiths list category:{dmz}."*

**Removed:** `/all` and the eight per-category commands — nine registered commands gone.
**Kept unchanged:** the standalone `/dmz` command, deliberately, for now — it stays the direct DMZ weapon lookup.
**Net:** 10 loadout commands → 2.

There is no `category:` option on `search`, and no `mode:` option anywhere. Category scoping happens **inside the `weapon:` autocomplete** (below), and every browsable set is **one named `scope:` choice** on `list`. That removes two hazards at once: a sibling `category:` option could contradict an already-picked weapon (Discord lets options be filled in any order), and a `mode:` + `category:` pair invites meaningless combinations like DMZ-plus-a-category. A scope the user *picks whole* cannot be assembled wrongly.

### Removal is a code change, not a prod action

Command registration is a single REST `PUT` of the full command list, so deleting the nine builders removes them from whichever application the running token belongs to. The **dev bot** loses them on its next boot. **Prod is untouched until `v3-pre-release` merges to `main` and that code deploys** — the same propagation path as every other v3 change. Nothing is being removed from the live bot in this work.

## The unifying idea: one scoped card browser

Meta, a category view, and DMZ are not three features. They are one: **an ordered list of builds, paged one card at a time, with a dropdown to jump to a weapon.** A single internal concept serves all of them:

```js
// scope descriptor
{ mode: 'MP' | 'DMZ', category: 'SMG' | null, metaOnly: false }
```

`resolveScopeBuilds(scope)` runs the Mongo query and returns a **deterministically sorted** array (category → weaponName → buildName), so the same scope always produces the same ordering across separate interactions. Nothing is stored server-side; the list is re-derived on every click.

**`list` and the sticky autocomplete rows are the same engine reached two ways, and that is the point** — the hybrid Harkirat asked for. `list` is the explicit, discoverable door: every scope visible as a named choice, no typing. The category rows inside `search`'s autocomplete are the fast door for someone already mid-type. Both resolve to one scope descriptor and one renderer, so they can never disagree about what "all SMG builds" means.

### `/gunsmiths list scope:` — eleven named scopes

A single required `scope:` option with **static choices**, not autocomplete: the set is small, fixed, and worth showing without typing — which is exactly what makes it the discoverable door, and the replacement for losing `/smg` from the command list.

| Choice label | Scope descriptor |
|---|---|
| `AR` … `SNIPER` (7 live MP categories) | `{ mode:'MP', category:'AR', metaOnly:false }` |
| `All MP builds` | `{ mode:'MP', category:null, metaOnly:false }` |
| `Meta — MP` | `{ mode:'MP', category:null, metaOnly:true }` |
| `Meta — DMZ` | `{ mode:'DMZ', category:null, metaOnly:true }` |
| `DMZ` | `{ mode:'DMZ', category:null, metaOnly:false }` |

Eleven choices against Discord's 25-choice cap. The seven category entries are injected at registration from the live `Loadout.distinct()` query (so a new category appears on its own); the four fixed entries are literals.

**This is what retired the `mode:` option on meta.** Meta-MP and Meta-DMZ are two named scopes rather than a mode option multiplied by a meta subcommand — same reachability for the 4 DMZ meta builds, with no invalid combination to define behaviour for.

### Paging without lying about "Build N of M"

The card footer reads `{category} • Build N of M • Last updated…`, derived from the builds array and index handed to `buildLoadoutCard`. Passing a 30-item flattened list would make it read "Build 7 of 30" across seven different weapons — wrong.

So the flat position lives **in the custom_id**, and the handler maps `flatIndex → { weaponKey, indexWithinWeapon }` against the freshly re-derived list, then renders **that weapon's builds** at the within-weapon index. The footer keeps saying `Build 1 of 2` about the weapon, while the pagination indicator says `7 / 30` about the scope — two different, complementary truths.

> ⚠️ **CORRECTED 2026-08-15 20:35 EDT, during the spec audit — an earlier draft of this section claimed `buildLoadoutCard` needed no change beyond `hideBadges`. That was wrong, and it was wrong because it reasoned from the function's SIGNATURE without reading its body.** The builder **authors its own custom_ids** — `${idPrefix}prev_${weaponKey}_${index}`, the copy ids, and (via `buildCategoryBrowseRow`) `${idPrefix}browse`. A browse card rendered through it unchanged would emit Prev/Next that page **within the weapon**, not across the scope. The design did not work as written.

**The fix: an optional `browse` option on `buildLoadoutCard`** — `{ scopeToken, flatIndex, flatTotal, scopeLabel }`. When present the builder emits `gsb~prev|next~<scopeToken>~<flatIndex>`, passes `totalChunks: flatTotal` / `currentPage: flatIndex` to the pagination row, and gives the dropdown `gsb~jump~<scopeToken>`. **When absent, output is byte-identical to today** — which is a testable claim, not a hope, and the plan tests it.

**Copy buttons stay `mp`/`dmz`-prefixed and need no new code at all.** They encode `weaponKey` + index-within-weapon, and the existing copy handler re-queries that weapon's builds and indexes in — so they keep working verbatim inside a browse card. Mixed prefixes in one card are fine because `handlers/loadouts.js` owns both families.

**No duplicate-custom_id crash is possible here.** Loadout cards use `buildPaginationRow`'s **legacy direction-encoded** path (`prevCustomId`/`nextCustomId`), whose two ids differ by direction and are therefore distinct even at exactly 2 pages. The clamp-at-2 bug documented in `utils/paginationRow.js` affects only the `makeCustomId` page-number path. A 2-item scope is safe.

**`share_public` needs no change either** — verified by reading `handlers/share.js`: it re-sends the message's own components verbatim and never parses a prefix, so a browse card shares correctly and its `gsb~` buttons keep working in the public copy.

**Drift is tolerated, not prevented.** If an admin adds or deletes a build via `/manage` between two clicks, the index may land on a neighbouring build. The index is clamped into range; there is no attempt at stable cursors. This is the same risk the existing "Browse other builds" dropdown already accepts, and it guards the same way — a missing target replies with a plain "no longer has any builds saved" rather than throwing.

### custom_id grammar

```
gsb~<action>~<mode>.<category|*>.<meta|std>~<flatIndex>
```

`gsb~next~MP.AR.std~4` · `gsb~jump~MP.*.meta~0`

**Two actions only — there is deliberately no in-panel scope switcher.** An earlier draft had a third `gsb~scope~` select, carried over from ROADMAP's "category-switch buttons below the embed", which was written when meta was going to be a standalone command with no `list` sibling. `/gunsmiths list scope:` now exposes all eleven scopes as a first-class slash choice, so an in-panel switcher is a second way to do the same thing at the cost of another select row on every card. **The ROADMAP wording is superseded, not unimplemented** — do not resurrect it from that line.

`gsb~` is claimed by no existing handler (checked against every `OWNED_PREFIXES` in `handlers/`). **It must not begin with `mp` or `dmz`** — `handlers/loadouts.js` owns those as bare `startsWith` prefixes and dispatches before anything else would see them. Well under Discord's 100-character cap.

### The 25-option cap is a render limit, not a search limit — and it must never truncate silently

Harkirat raised this directly: `/admin` searches past 25 roles and channels, so why treat 25 as a wall? The answer is that those are **native role/channel selects (types 6 and 8)**, populated by Discord itself, which carry a built-in search box. A weapon list cannot be one — weapons are not Discord entities — so it must be a **string select (type 3), which has no search at all**. `commands/admin.js:219` states exactly this about its own command list, and rather than dropping anything it names the omitted commands in a visible warning line.

That house rule applies here, because `utils/loadoutRender.js`'s `buildCategoryBrowseRow` currently does the opposite: it `slice(0, 25)`s and says nothing. No scope exceeds the cap today (AR is largest at 17 weapons), so this is latent — but AR is at 17 of 25 and Harkirat is actively adding builds, so the browse view is the one surface here that will reach it.

**The design answer, in preference order:** the dropdown windows to the 25 weapons around the current position, so paging forward reveals the rest; and whenever the scope holds more than fits, a `-#` line says so and points at `/gunsmiths search`, which is the unlimited search path — autocomplete re-queries per keystroke and is bounded only by 25 *shown* matches, not by the size of the set. Pagination of the menu itself (`utils/paginationRow.js`, as `admin.js`'s comment suggests) stays available if windowing proves clumsy in practice.

**Fix `buildCategoryBrowseRow`'s silent slice in the same change.** It is a shared helper — `/dmz` and every existing loadout card already use it — so this is a small real improvement to code this work is touching anyway, not scope creep.

### The autocomplete sentinel

`/gunsmiths search weapon:` returns two kinds of row:

| Row | `name` shown | `value` returned |
|---|---|---|
| Category | `▸ All SMG builds (15 weapons)` | `~cat~SMG` |
| Weapon | `[SMG] Switchblade X9` | `switchbladex9` |

A weapon row's value stays a bare `weaponKey`, unchanged from today, because `search` is MP-only — there is exactly one MP card per weapon, so nothing needs disambiguating. **This is a live benefit of the MP-only split, not an accident:** 5 of the 7 DMZ weapons (`ak117`, `asval`, `fennec`, `so-14`, `type19`) also exist in MP, so a mode-spanning `search` would have had to tag every value with its mode and show two rows for the same gun. Keeping DMZ in `list` avoids that entirely.

**`~` is collision-proof — measured, not assumed.** All 70 distinct `weaponKey`s were checked: they contain `.` and `-` (`.50gs`, `bal-27`, `grau5.56`), but **zero contain `~` or `:`**. The handler resolves the `~cat~` prefix first and only falls through to a weaponKey lookup otherwise.

**Slot budgeting (Discord caps at 25 choices).** Category rows are filtered by the same `fuzzyMatch` as weapons, then listed first: an empty box shows all 7 categories plus 18 weapons; typing `ak` matches no category so all 25 slots go to weapons. This is better than unconditionally reserving 7 slots, and it makes the empty box a genuine discovery surface — which matters, because consolidation costs the ability to find `/smg` by typing `/sm`.

**Free-typed category names work too.** `utils/search.js`'s existing `resolveCategorySynonym()` already maps `pistol`/`assault rifle`/`smg` onto real categories. If a user types a synonym and presses enter without picking a suggestion, the same category browse opens. Pure reuse — no new matching logic.

## Component design

### `bot/registry.js`

Delete the `/all` builder and the eight-command generation loop. `buildCategoryCommands()` is **renamed `applyGunsmithsCategoryChoices(commands)`** and keeps the same call site in `bot/lifecycle.js:215` and the same post-`ClientReady` timing, because it still needs the live DB query — but its output now populates the `scope` option's **choices** on `/gunsmiths list` instead of creating commands.

The `data` builder is constructed synchronously at require time in `commands/gunsmiths.js` (it must be, for `client.commands`), and the choices are injected into that same object before the `PUT`. The Collection and the registration array hold the **same reference**, so mutation keeps both consistent. The forced `SECONDARIES` merge is kept — it now has real data (6 weapons), so it is currently redundant, but it costs nothing and preserves the original "ready the moment he adds one" intent.

Proven 2026-08-15 20:56 EDT: mutating a nested subcommand option's choices on an already-constructed `SlashCommandBuilder` via `setChoices()` works, and `toJSON()` still reports top-level option types as `[1]` (subcommand-only).

### `utils/loadoutLookup.js` — new, and the real de-duplication

`commands/dmz.js`'s `execute()` and the router's MP fallback are **the same 110 lines twice**, differing by `mode`. Both are replaced by one shared function:

```js
lookupAndRenderWeapon(interaction, { mode, rawQuery, buildIndexOption, visibilityChoice })
```

It owns, in order: the `UserPreference` + builds concurrent fetch, `resolveEphemeral` against `loadoutVisibility`, `deferReply`, the exact normalized-`weaponKey` query, **the short/partial fuzzy fallback** (`loc` → LOCUS, with the 2+ matches "not specific enough" message), the not-found hint, the `build:` clamp, accent resolution, `categoryBuilds` for the browse row, and `sendV2Payload`.

⚠️ **The fuzzy fallback is the thing most likely to be silently dropped in this move.** It is a documented v2 quick-win (2026-07-18) that exists because Discord submits raw typed text when a user dismisses the autocomplete dropdown — a real mobile complaint. Its candidate pool is scoped by mode and category; that scoping must survive.

After this, `commands/dmz.js` and `/gunsmiths search` are both thin wrappers over the same function — differing only by `mode` — and **the router's fallback block is deleted entirely** — including its duplicate `maybeSendAnnouncement()` call, which exists only because those nine commands bypassed `client.commands.get()`. The modular-command branch already handles announcements.

### `commands/gunsmiths.js` — new

Standard `data` + `execute` module. `execute()` dispatches on `interaction.options.getSubcommand()`:

- **`search`** → a `~cat~*` value opens a scoped browse; anything else is a weaponKey (or free-typed text) for `lookupAndRenderWeapon({ mode: 'MP' })`.
- **`list`** → maps the chosen `scope:` value to its descriptor and opens the scoped browse.

`setIntegrationTypes([0, 1]).setContexts([0, 1, 2])`, matching every other public command on the v3 line.

There is no invalid option combination left to define behaviour for — that class of bug was designed out when scopes became whole named choices. DMZ genuinely has no per-category split (see `models/Loadout.js` on why `categoryRank` is never set for DMZ), and no reachable input now asks for one.

### `handlers/loadouts.js` — extended, not replaced

The browse branches go **here** rather than in a new `handlers/gunsmiths.js`: they render the same cards through the same helpers, and a new module means another entry in the `handlerRouting.test.js` contract for no gain. `OWNED_PREFIXES` gains `"gsb~"`. The file goes from 163 to roughly 300 lines, well inside this repo's norm.

Two new branches — `gsb~next|prev` (button) and `gsb~jump` (select):

> 🔴 **Every branch carries an explicit `isButton()` / `isStringSelectMenu()` test.** This file's own header documents the bug where a select branch was written inside an `isButton()` block and became dead code — no error, no log, just a timed-out interaction. `project_index_js_split` records the same failure recurring during the split. Type-test every branch.

### `utils/loadoutRender.js`

> ⚠️ **`buildLoadoutCard` has FIVE call sites, not two — and one of them is `/autobuild`.** `commands/dmz.js:123` · `handlers/router.js:508` (the fallback being deleted) · `handlers/loadouts.js:78` and `:147` · **`handlers/autobuild.js:66`** (plus the import in `utils/autobuildPipeline.js`). An earlier draft of this spec named only the first two, which understated the blast radius of touching a shared renderer. `/autobuild`'s review card renders through this builder with `idPrefix: 'mp'`, so **its Prev/Next and browse dropdown are already routed by `handlers/loadouts.js`** — pre-existing coupling that no rule file states plainly. Adding `gsb~` cannot disturb it (the prefixes share no leading characters), but the snapshot test in the plan exists precisely because `/autobuild` is downstream of this change.

Two additions: the **`browse`** option above, and **`hideBadges`** on `buildLoadoutCard`. Applied when `scope.metaOnly` is true, per ROADMAP and Harkirat's confirmation that the whole badge line goes, not just the redundant Meta badge. **Category browses keep their badges** — "Best AR" is informative in an AR list and is not implied by the view.

`buildCategoryBrowseRow`'s `scopeLabel` gains the browse-view wording (`Browse meta weapons`, `Browse AR weapons`).

### `commands/help.js`

- `CATEGORY_DEFS.gunsmiths.staticCommands` → `[cmd('/gunsmiths'), cmd('/dmz')]`.
- `COMMAND_ALIASES`: the `/all` alias list (`loadout`, `gunsmith`, `weapon`, `build`, …) moves to `/gunsmiths`; add `meta` and `category`.
- **Delete `getLiveGunsmithCommandNames()`** and its use in `suggestHelpCommandNames` — its entire purpose was suggesting the eight live category commands, and leaving it would autocomplete commands that no longer exist.
- Rewrite the usage block at `help.js:257` (the single `mentionCommand('/all')` site in the codebase). ⚠️ The header comment claiming *"Gunsmiths is the one deliberate exception, since /all, /dmz, and every per-category command share the identical 3 options"* **becomes false** — the three subcommands have different option sets. Update it in the same change, per CLAUDE.md's context-comment rule.
- `mentionCommand` already handles `</gunsmiths search:id>` (a subcommand mention uses the parent's id) — no change needed there.

## Ripple check — what this touches, and what it provably does not

*Added 2026-08-15 20:45 EDT at Harkirat's prompting: "don't make your scope of work so narrow that you don't see its rippling effect on other commands and sub-systems." Each row was checked against the code, not reasoned about.*

| Subsystem | Effect | Evidence |
|---|---|---|
| **`/autobuild`** | **In the blast radius** — its review card renders through `buildLoadoutCard` and emits `mp`-prefixed ids handled by `handlers/loadouts.js` | `handlers/autobuild.js:66` |
| `commands/autobuild.js`'s hardcoded `CATEGORY_CHOICES` | **Deliberately left alone.** A slash `choices()` list must exist at require time and cannot await Mongo — which is exactly why `registry.js` injects post-ClientReady and autobuild hardcodes. Unifying them would drag a second subsystem in for no user-visible gain. **Do not "fix" this.** | `commands/autobuild.js:11` |
| **`/manage` → loadouts** | No command coupling; it writes fields. A NEW category needs a bot restart to appear — before AND after this change, since `Loadout.distinct` runs once post-ClientReady either way. A typo'd category creates a junk scope choice where it used to create a junk `/arr` command: identical exposure, different surface. | `handlers/manage/loadouts.js` |
| **Meta flips from `/manage`** | Appear **immediately** — there is no loadout document cache anywhere in the tree, and `resolveScopeBuilds` queries live on every click | grepped; no cache exists |
| **Passive expiry** | Works on browse cards with **zero new code** — `sendV2Payload` arms `schedulePanelExpiry` for any payload with interactive components, and each click re-sends through the same path and re-arms | `utils/sendV2Payload.js:117` |
| **`share_public`** | Unaffected — re-sends the message's own components verbatim, never parses a prefix | `handlers/share.js` |
| **`/admin` visibility policy** | Self-heals: `gateableCommandNames` is derived from the registration array, so it loses nine entries and gains `gunsmiths` with no code change. `GuildSettings.ephemeralCommands` persists command-name strings but holds **0 documents**. `/manage`'s own permissions are keyed by PAGE, never by command name. | `bot/registry.js`, dev DB |
| **Announcements** | One choke point disappears with the router fallback; the modular-command branch already fires `maybeSendAnnouncement` | `handlers/router.js` |
| **Emoji ids** | No work — `buildPaginationRow` resolves `emojis.left/right` at render time, so the module-level-literal trap does not apply | `utils/paginationRow.js` |
| Untouched | `/settings` (shares the `loadoutVisibility` FIELD, not a command reference), `/colors`, `/calendar`, `/draws`, `/drawprices`, `/draw calculator`, `/patch`, `/seasonend`, `/timestamp`, `/alerts`, `/audit` | |
| ⚠️ **Not read** | `scripts/createPlaceholderLoadouts.js`, `backfillLoadoutMetadata.js`, `migrateBuildsToMongo.js` — argued out of the blast radius because they operate on documents, not commands. **That is an argument, not a check.** | — |

**The ripple is real but shallow, and that is a result rather than luck:** everything routes through one renderer and one scope descriptor, so the surfaces that could have been affected mostly touch neither.

## Measured facts this design rests on

Queried against the dev DB (`diors-builds-dev`) on 2026-08-15:

| Fact | Value | Why it matters |
|---|---|---|
| Distinct weaponKeys | 70 | none contain `~` or `:` → sentinel is safe |
| MP categories | AR, LMG, MARKSMAN, SECONDARIES, SHOTGUN, SMG, SNIPER | 7 choices, far under the 25-choice cap |
| Largest category | AR — 17 weapons / 35 builds | fits one dropdown today, at 17 of 25 — see the cap note below |
| `isMeta` builds | 34 total — 30 MP (11 weapons) / 4 DMZ | meta needs the dropdown; paging 30 alone would be tedious |
| DMZ | 7 weapons / 8 builds | one `list` scope; the whole set browses in 8 pages |
| Weapons in **both** modes | 5 — `ak117`, `asval`, `fennec`, `so-14`, `type19` | would have forced mode-tagged autocomplete values had `search` spanned modes; MP-only avoids it |
| `guildsettings` documents | **0** | **no `ephemeralCommands` migration is needed** |

That last row killed a task. `GuildSettings.ephemeralCommands` persists command-name **strings**, so a guild rule naming `all` or `smg` would have become a dead entry while `/gunsmiths` inherited no gate — a silent policy regression. The collection is empty and prod is at `guild_count: 0`, so there is nothing to migrate. Recorded here so the next session does not re-derive the worry; if a rule ever exists before this ships, it needs a name remap.

## Decisions — settled, do not re-litigate

| Decision | Who | Note |
|---|---|---|
| Name is `/gunsmiths`, subcommands **`search` + `list`** | Harkirat | revised 20:05 EDT from a `search`/`meta`/`dmz` draft made earlier the same session — *"cleaner and more intuitive"* |
| `search` is **MP-only** | Harkirat | 20:20 EDT; DMZ is a `list` scope, which also sidesteps the 5 both-modes weapons |
| Subcommands, not a flat command | forced | Discord forbids top-level options on a command that has any subcommand — a `meta` subcommand makes the whole surface subcommand-shaped |
| `/dmz` stays as its own command | Harkirat | *"we'll also leave the dedicated /dmz command for now"* — one shared code path, so retiring it later is a deletion |
| DMZ is a `list` scope | Harkirat | the third position taken on this in one session; the `search`/`list` split is what made it settle |
| No `category:` option on `search` | Harkirat | replaced by sticky category rows in autocomplete |
| ~~Meta gets a `mode:` option~~ → **`Meta — MP` / `Meta — DMZ` are two `list` scopes** | Harkirat | same reachability for the 4 DMZ meta builds, without an option pair that can be combined meaninglessly |
| Meta hides the whole badge line | Harkirat | chose ROADMAP's literal wording over the narrower "hide only the Meta badge" |
| Old commands deleted in code; prod mirrors at merge | Harkirat | *"why would we remove them from the prod bot right now when v3 hasn't even launched"* |
| Meta is paginated cards in v1 | Harkirat | the list-landing hybrid is deferred, see below |

## Explicitly out of scope

- **No `Loadout` schema change.** Every field needed (`isMeta`, `category`, `mode`) exists. If that turns out false mid-build, CLAUDE.md's schema-save gotcha applies and the schema change lands in the same commit.
- **The hybrid meta landing page** — Harkirat's own idea: a list panel of meta weapons that opens into the paginated cards on selection. His call to defer: *"that seems more like an improvement feature on top of the meta sub command."* → files to `docs/db-deferred-list.md` 🗂️ Queued.
- **Retiring `/dmz`.** Kept deliberately.
- **`/autobuild`, `/manage`'s loadout pages, the Loadout model.** Untouched.

## Risks

| Risk | Mitigation |
|---|---|
| Nested-option choice injection is rejected or silently no-ops | JSON-shape pre-flight asserts `list.scope.choices.length == 11` before any registration |
| The short/partial fuzzy fallback is lost in the move to `utils/loadoutLookup.js` | called out above; verified by a direct dev-bot test of `weapon:loc` and an ambiguous prefix |
| Flat index drifts when a build is added/deleted mid-browse | clamp into range; tolerate, matching the existing browse dropdown |
| Discoverability loss — `/sm` no longer finds `/smg` | `list`'s 11 named scopes are the explicit replacement; plus category rows on an empty autocomplete box and a rewritten `/help` page |
| Touching the shared `buildLoadoutCard` regresses `/dmz` and every existing card | the `browse` option is absent on normal cards; a snapshot test asserts byte-identical component JSON before/after |
| A user expects `search` to find DMZ builds | `search`'s description says MP; DMZ is a visible `list` scope and `/dmz` still exists — three routes, none of them silent |
| A scope grows past 25 weapons and the dropdown silently drops some | windowed dropdown + a visible "showing 25 of N" line; `buildCategoryBrowseRow`'s bare `slice` fixed |
| A new `gsb~` branch written under the wrong interaction type becomes dead code | explicit type test on every branch; `handlerRouting.test.js` covers prefix ownership |
| `/help` suggests commands that no longer exist | `getLiveGunsmithCommandNames()` deleted, not left dormant |

## Files touched

**New:** `commands/gunsmiths.js` · `utils/loadoutLookup.js`
**Rewritten:** `bot/registry.js` (delete 9 builders, rename + repurpose the DB pass) · `handlers/router.js` (delete the ~110-line fallback; rework the autocomplete route for `gunsmiths`) · `commands/dmz.js` (thin wrapper) · `handlers/loadouts.js` (+3 branches, +1 prefix) · `commands/help.js`
**Touched:** `utils/loadoutRender.js` (`hideBadges`, scope labels, **non-silent dropdown overflow**) · `bot/lifecycle.js` (renamed call)
**Docs:** `CLAUDE.md` (the registry nav-map row and its ⚠️) · `.claude/rules/loadouts.md` · `commands-overview.md` · `interaction-router.md` · `accent-and-colors.md` · `models/UserPreference.js`'s comment · `docs/ROADMAP.md` (mark shipped; **reconcile the three overlapping entries** — the `/loadout` consolidation item, the standalone `/meta` item, and "optional paginated multi-weapon loadout view" are all satisfied or superseded by this design, and leaving them open invites a duplicate build) · `docs/db-deferred-list.md` (hybrid landing page) · `docs/CHANGELOG.md` + `CHANGELOG-SUMMARY.md` + `DEVLOG.md` · `package.json` + `package-lock.json` → `3.29.0-pre`

## Staging and verification

> 🔻 **SEQUENCING CONSTRAINT the design did not state: ADD before DELETE.** Harkirat runs the dev bot under `node --watch`, so every save re-registers the command set. If a task deletes the nine builders before `/gunsmiths` works, the dev bot spends that window with **no working loadout lookup at all**. `/gunsmiths` is added and verified first; the nine are deleted only after. Never the reverse.

**One branch, one PR, two ordered stages with a checkpoint between them.** Stage A is a migration with a wide blast radius and no new interaction model; stage B is a new feature with a narrow blast radius and a novel state design. Bundling them makes a click-test failure unattributable.

**Stage A — consolidation.** `/gunsmiths search` (MP), `utils/loadoutLookup.js`, the nine builders deleted, the router fallback deleted, `/help` rewritten. **Stage B — the scoped browser.** `resolveScopeBuilds`, the `gsb~` branches, `hideBadges`, non-silent dropdown overflow, and `/gunsmiths list` with all 11 scopes.

### Automated gates (run at each stage)

```bash
node --check on every touched file
node scripts/gunsmithsCommandShape.test.js     # new pre-flight, see below
npm test                                        # handlerRouting + guildPolicy + guildPolicyEnforcement + hook self-tests
npm run docs:audit >/tmp/a.log 2>&1; echo "exit=$?"
```

The **new pre-flight** serializes the registered command JSON without touching Discord and asserts: exactly 2 subcommands; **no top-level options** (the constraint that forced this whole shape); `list.scope.choices.length == 11`; `integration_types == [0,1]`; and that no `weaponKey` in the DB collides with the `~cat~` sentinel. It must be able to **fail** — assert it does, by deliberately feeding it a builder with a top-level option, before trusting a pass. Per `.claude/rules`, every new `.claude/hooks/*.sh` needs a self-test; this is a `scripts/` test and rides in `npm test`.

### Owed to Harkirat — dev-bot click-test

Not automatable and therefore listed, not assumed. **Keep it separate from the index.js split's still-owed click-test.**

1. `/gunsmiths search weapon:` with an **empty box** → 7 category rows visible at the top.
2. Pick a category row → scoped browse card; Prev/Next pages within that scope; weapon dropdown jumps.
3. `/gunsmiths search weapon:AK117` → normal MP card, unchanged from `/all` today.
4. `/gunsmiths search weapon:fennec` → the **MP** card. Fennec also has a DMZ build; `search` must not offer or open it.
5. `/gunsmiths search weapon:loc` + enter, no suggestion picked → LOCUS resolves (the fuzzy fallback).
6. An ambiguous prefix → "not specific enough" message, not a wrong card.
7. `/gunsmiths search weapon:smg` + enter → category browse via synonym.
8. `/gunsmiths list scope:` → all 11 choices present and correctly labelled.
9. `list scope:AR` → 17 weapons browse; `All MP builds` → every MP build; **`DMZ`** → all 8 DMZ builds with the weapon-jump dropdown.
10. `list scope:Meta — MP` → paginated meta cards, **no badge line**; `Meta — DMZ` → the 4 DMZ meta builds.
11. Standalone `/dmz weapon:fennec` → unchanged, still the direct DMZ lookup.
12. `/help` → Gunsmiths page shows the new surface; `/help cmd:gunsmith` resolves; no `/ar`-style suggestion appears.
13. Confirm `/all` and the eight are **gone** from the dev bot's command list. ⚠️ **Discord caches the command list client-side** — if the retired names still show, reload the client (Cmd/Ctrl+R) before treating it as a failure, or this burns a debugging cycle on a non-bug.
14. `/help cmd:smg` → lands on the `/gunsmiths` page rather than a dead end.
