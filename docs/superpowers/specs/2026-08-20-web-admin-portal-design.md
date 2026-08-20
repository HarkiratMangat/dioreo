---
kind: spec
status: frozen
---

# Web admin portal — design

**Decided 2026-08-20, in one session with Harkirat.** A browser-based management surface at `portal.dioreo.app`, covering everything `/manage` does and a class of work Discord cannot host at all. `/manage` stays live and unchanged in behaviour. Ships **after v3.0.0**.

> **This supersedes the roadmap item "The real search + multi-select flow — `/manage`'s Delete Multiple and Loadouts' Replace Multiple"** (`docs/ROADMAP.md`, `docs/db-deferred-list.md` 🧹 Someday, `[P2 · L]`). That item was filed as a Discord-side interaction and was flagged as un-schedulable for having no named first slice. Harkirat changed his mind on the implementation, not the goal: search-then-tick-then-act is a table's default behaviour on the web, so it stops being a feature to design and becomes a consequence of the surface. **Strike the item and point it here rather than building both.**

> ⚠️ **The visual design is not in this file.** Six annotated mockups were built and approved during the design session and live at **`local/portal-mockups/`** — `01-season-spine.html` · `02-skins-and-structures.html` · `03-three-surfaces.html` · `04-armory-and-commit.html` · `05-door-broadcast-ops.html` · `06-access-and-analytics.html`. **That folder is gitignored, so no repo search will ever surface it** — this pointer is the only route back. Open them before designing any portal surface; §9 below records the rules they encode, but the mockups are what was actually approved.

---

## 1. Why this is worth building, stated as what Discord physically prevents

The case for the portal is not "a nicer form". It is that nine specific things are impossible inside a Discord interaction, and seven of them are things Harkirat does routinely.

A modal caps at five text inputs, text only — no dropdown, no date picker, no file upload, no checkbox. There is no live channel during a modal, so nothing can filter as you type. A message caps at **40 components counted recursively**, which this project has already crashed production against. An interaction token expires in about fifteen minutes, so there is no long editing session, no autosave and no draft. Nothing can preview what an edit will look like once rendered. There is no diff before a destructive bulk replace — today it is paste-and-pray. There is no spreadsheet-shaped bulk edit, which is precisely *why* the paste-a-list bulk formats exist. And there is no scheduling.

The paste-a-list formats are the tell. They are not a design; they are the best available answer to "how do I get forty records into a five-field text box". On the web they stop being the primary interface and become an import/export convenience — which is a strictly better job for them, because `utils/adminParser.js`'s formatters and parsers already round-trip.

## 2. What is already true, and is the reason this is smaller than it looks

Four findings from reading the codebase, each of which removes work that would otherwise have to be designed.

**The bot barely caches domain data, so edits are already live.** `commands/draws.js`, `commands/calendar.js` and `commands/patchnotes.js` each call `SeasonalData.findOne({docType:'global'}).lean()` **fresh on every interaction**; loadouts read fresh too; no module-level memo holds a domain document anywhere. The only TTL caches over portal-writable data are `utils/adminAccess.js` (60s) and `utils/guildPolicy.js` (5 min), and both already expose invalidators. **A portal that writes Mongo is visible to the bot immediately**, worst case 60 seconds for a permission change. There is no sync mechanism to build, no change stream, no push channel. v1 needs zero bot-side runtime changes for this to hold.

**Most of the business logic is already in requireable modules — but not all of it, and the exception matters.** ⚠️ **`utils/adminAccess.js` is NOT reusable as it stands.** Measured 2026-08-20 by computing the transitive require closure: it pulls **39 local files plus `discord.js`, `jimp` and `child_process`**, because `isOwner()` does `require('../commands/manage')` to read `ALLOWED_ADMIN_ID`, and that command module drags in the entire command surface. Requiring it in the portal would load discord.js and an image library into a process that has no client and no business holding either. **The fix is small and is a prerequisite, not a nicety: extract `ALLOWED_ADMIN_ID` into a leaf module** (`utils/owner.js`) that imports nothing, and repoint `utils/adminAccess.js`, `handlers/router.js` and `scripts/botAccessPermissions.test.js` at it. ⚠️ `docs/legal/PRIVACY.md`'s verification table names `commands/manage.js` as where the admin guard lives, so it must be updated in the same change or the published policy becomes false. Once that lands, `utils/adminAccess.js` is the entire permission vocabulary and is genuinely reusable. `utils/adminParser.js` exports 22 parse and format functions covering every bulk format, date parsing, title casing, gunsmith-code correction and attachment ordering. `utils/changeStore.js` is a working audit trail with human-referenceable ids, pagination and export. `utils/search.js` is the fuzzy matcher. None of them import discord.js. A Node server `require()`s them verbatim.

**The render functions are pure.** `utils/loadoutRender.js`'s `buildLoadoutCard()` returns plain Components V2 JSON and imports no discord.js. **The browser can render exactly what Discord will send**, by calling the bot's own function. A preview that can drift from the real render is worse than no preview; this one structurally cannot.

**`utils/logger.js` is reusable, and the portal must use it.** Measured the same way: **2 local files, zero npm dependencies beyond Node builtins**. So the portal gets the bot's exact structured Cloud Logging — severity, `version`, `commit`, and the `serviceContext` that feeds Error Reporting — for one `require`. **A second production process with no logging story is how an outage becomes unexplainable**, and this one costs nothing. Log under a distinct `service` value (`dioreo-portal`) so Error Reporting groups the two separately.

**Mutations are the only thing not reusable.** `handlers/manage/*.js` is 2,163 lines in which parsing, mutation, audit, undo registration and Discord reply formatting are interleaved. That is what §4 extracts.

## 3. Decisions, and what each one closed

| # | Decision | Rejected, and why |
|---|---|---|
| 1 | **Hybrid interaction model**, tiers derived from reversibility (§5) | Pure direct-write is `/manage` with bigger textboxes. Pure changeset makes fixing one typo a ceremony. |
| 2 | **Shared mutation core**, extracted from `handlers/manage/*.js`; the web surface may expose *more* capability over the same ops | Two independent implementations. `utils/manageActions.js` exists because two hand-synced copies of the action list was judged unacceptable, and `models/SeasonalData.js`'s `draft.calendar` is the recorded cost of ignoring that. |
| 3 | **VM sibling process behind Cloudflare Tunnel**, written runtime-agnostic so Cloud Run stays a config change away | Cloudflare Workers — cannot `require()` the bot's CommonJS utils, which forfeits every reuse in §2, and the Atlas Data API that would have replaced a driver was sunset 2025-09-30 with all of App Services. In-process — rejected on blast radius. Cloud Run now — better infrastructure, but a second ops world for one service. |
| 4 | **Ships after v3.0.0** | The v3 launch checklist is already deep, and this adds a runtime, an auth surface and a privacy revision. |
| 5 | **Admins only.** Users and a public read-only view are possible later and deliberately **not** designed for now | Designing for hypothetical users now costs a two-zone security model that nothing needs yet. |
| 6 | **Preact + htm, no build step** — one vendored ~12KB file, installed as a `devDependency` so `dep-licences` can see it | Vanilla — stale-UI bugs prevented only by remembering, and they fail silently. Vite — three working gates (`npm run check`, `deploy-site.yml`, `reflow-comments.mjs`) need rework before a line of portal code exists. |
| 7 | **Desktop-first, mobile-capable.** Phone gets search, single-record edit, the audit river, and commit/discard of an already-staged set | Desktop-only forecloses fixing a typo from bed. Fully responsive doubles the frontend work on the two hardest things to shrink — a timeline and a data grid. |
| 8 | **`portal.dioreo.app`**, with `dioreo.app/portal` as a 302 into it | A path on the main domain would send the session cookie to every request against the public static site. |
| 9 | **Shape carries state; colour carries topic** (§9) | The inverse — Harkirat's correction, and he is right: shape survives greyscale and colourblindness, and colour-as-state would have contradicted the public site's own accent-is-identity rule. |
| 10 | **Five realms, two layers** (§8) | A flat seven-page list is a Discord artifact — one message gets one dropdown. |

## 4. The core is an operation algebra

Every mutation in the system becomes a **value**, not a function call:

```js
op = { type: 'draw.add' | 'calendar.replaceAll' | 'loadout.delete' | …, target, payload }
```

with four verbs over it:

| verb | signature | purity |
|---|---|---|
| `validate` | `(op) → { ok, errors[], normalized }` | pure, no DB — wraps `utils/adminParser.js` |
| `preview` | `(op, liveState) → { before, after, discordPayload }` | pure — `discordPayload` comes from the bot's own render functions |
| `apply` | `(op, { session, actorId }) → { change, inverse }` | DB, inside a transaction, **always** writes `ChangeLog` |
| `invert` | `(change) → op` | pure — undo, replayable from either surface |

Four properties this buys that a per-action function cannot.

**The hybrid tiers fall out of it** instead of being assigned per button. Tier 1 is one op applied. Tier 2 is N ops previewed together and applied in one transaction. Tier 3 is tier 2 plus an export gate. No special cases anywhere.

**Undo becomes durable and cross-surface.** Today `handlers/manage/shared.js`'s `registerUndo(description, restore)` holds a closure in a router-private Map: it dies on every restart and the web cannot see it. An `inverse` op persisted on the `ChangeLog` row survives restarts and replays from either surface. **This is an upgrade to `/manage` too**, not only to the portal.

**The `/manage` refactor becomes mechanical.** Each handler collapses to *build op from modal fields → apply → format Discord reply*. Modal shapes, V2 containers, ephemeral replies and every custom_id stay exactly where they are and behave identically — which is what "leave `/manage` as-is" asks for.

**The portal gets more capability without a second implementation.** Live search-as-you-type is `validate` plus a query endpoint. Discord cannot offer it because a modal has no live channel; the underlying op is byte-identical.

### 4.1 The hard invariant

**The portal derives its capability list from `utils/manageActions.js`. It never declares its own.** The op `type` vocabulary and the registry's `page:id` keys are one table, with a conservation test asserting it in both directions — the same shape `scripts/manageActions.test.js` already enforces. A portal with its own action table recreates exactly the bug that registry was built to kill, across two runtimes, where drift is harder to see.

### 4.2 Where the code lives

| Path | Holds |
|---|---|
| `core/ops/*.js` | The algebra. One module per entity (`draws`, `calendar`, `loadouts`, `patchnotes`, `season`, `announcements`), each exporting `validate`/`preview`/`apply`/`invert` for its op types. No discord.js, no HTTP. |
| `core/changeset.js` | Compose, validate, preview and commit a set of ops in one transaction. |
| `portal/server.js` | The HTTP entry point. Routing, sessions, static assets. Never contains a mutation. |
| `portal/api/*.js` | Thin — parse a JSON body into an op, call the core, return the result. |
| `portal/public/**` | The built frontend. Emitted by repo tooling, served by the VM. |
| `handlers/manage/*.js` | **Stays.** Loses its mutation bodies to `core/ops/`, keeps every modal, container and reply. |

## 5. The hybrid model

"Some things save instantly, some need confirming" is a dialog with extra steps, and the boundary would read as arbitrary. The tier is **derived from the data**, by one principle:

> **The portal writes directly when it can guarantee an exact inverse. It stages when it cannot.**

**Tier 1 — Direct.** An exact inverse exists and is cheap to record: a single-field edit, adding one record, toggling a flag. Saves on field commit, shows an inline `saved · undo`, writes a `ChangeLog` row carrying the prior value. Undo stays available as long as the row does — not a ten-second toast.

> ⚠️ **Reversibility is not the same as invisibility, and the governing principle above only covers the first.** A tier-1 edit writes to live data, and the bot re-reads on every interaction, so a mistyped season title is **publicly wrong within seconds** and stays wrong until someone notices — even though undoing it is one click. The tier system governs how much ceremony a change costs, never how loudly a mistake is broadcast. Two consequences the design accepts deliberately: the inline `saved · undo` must state *what* was saved rather than just confirming that something was, so a wrong value is visible at the moment it lands; and a **field whose value appears in a public render should show its live effect in the preview pane before it is committed**, which is free — the preview already calls the bot's own render functions. Neither makes tier 1 slower.

**Tier 2 — Staged changeset.** Multi-document, destructive of prior state, or a bulk import. Composed in a working area, previewed as the real Discord render, diffed against live, committed atomically. The inverse is captured as a snapshot at commit time, so these are undoable too — but the snapshot must be taken deliberately, which is why they stage.

**Tier 3 — Guarded.** Genuinely irreversible or system-altering: `purgeall`, `promote` (rotates live season data), admin grant and revoke. Everything tier 2 does, plus a typed confirmation naming the actual target — not the word DELETE, so muscle memory cannot carry you through — **and a mandatory export of what is about to be destroyed, downloaded before the control unlocks.**

That export is nearly free and is the strongest safeguard available: `utils/adminParser.js` already exports `formatDrawsAsBulkText`, `formatCalendarAsBulkText` and `formatLoadoutsAsBulkText`, and those outputs round-trip back through the matching bulk **parsers**. The system can already serialize its own state into a format it can re-ingest; nobody has ever wired that to the purge path. Doing so converts "irreversible" into "reversible, with a file you are holding".

**Mapping the existing surface**, counted from the registry rather than estimated (`57` actions total, `7` of kind `confirm`): the seven confirm actions — `draws:purgenew`, `draws:purgereturning`, `draws:purgeall`, `calendar:purge`, `patchnotes:purge`, `seasondraft:promote`, `seasondraft:discard` — plus every `bulkreplace`/`bulkdelete`/`replacemultiple`/`deletemultiple` land in tiers 2–3. Single add/edit/delete are tier 1. Exports are reads and have no tier.

## 6. Safeguards

### 6.1 The one that is not obvious: element-identity concurrency

`SeasonalData` is a **single global document** (`docType: 'global'`, unique) whose arrays hold `newDraws`, `returningDraws`, `calendar` and `patchNotes`. So a draws edit and a calendar edit touch the *same* document.

Ordinary optimistic concurrency is therefore **wrong here**. Document-level `__v` locking would raise a conflict on nearly every pair of unrelated concurrent actions — false conflicts that train you to click through the warning, which is worse than no check at all. But skipping versioning is worse still: `doc.save()` on a stale in-memory copy writes the whole array back and silently reverts the other edit.

The design is **element identity**. An op names the array element it targets by its stable subdocument `_id` (nothing in the schema disables `_id`, and `models/SeasonalData.js` already relies on it for patch-note image caching), and commits via a targeted positional update that also asserts the prior value — never a whole-document `.save()`. A conflict is raised only when *that element* moved underneath, which is the only real conflict.

> 🔴 **Rule: the portal never calls `.save()` on a whole `SeasonalData` document.**

### 6.2 The rest of the hazard list

| # | Hazard | Answer |
|---|---|---|
| H1 | Concurrent edit between Discord and web loses an update | §6.1, plus live state re-read at review time so a conflict surfaces on the commit screen rather than silently overwriting |
| H2 | Partial commit — op 23 of 40 fails | Whole changeset in one Mongo transaction. **Premise unverified — see §12** |
| H3 | The bot observes a half-applied multi-document write | Same transaction. The bot reads fresh per interaction, so a broken middle state reaches real users within seconds — this is why H2 is load-bearing, not nice-to-have |
| H4 | Validation drifts between web forms and bulk parsers | Dissolved by §4 — both surfaces call `validate(op)`; there is nowhere else for validation to live |
| H5 | Capability drift between the portal and `/manage` | §4.1, with a conservation test |
| H6 | Audit gaps — a portal edit that never reaches `ChangeLog` | `apply()` is the only writer and always records. The caller cannot opt out |
| H7 | Privilege escalation | Permissions resolve **server-side on every request** through `resolveAction()`'s existing choke point. The client is never trusted for anything, including which realm it may see |
| H8 | A revoked admin keeps working | `invalidateAdminCache()` on revoke, **and** re-check per request rather than leaning on the 60s TTL. A web session persists in a way a Discord interaction does not, so the TTL that is acceptable in Discord is not acceptable here. Access can also end a live session outright |
| H9 | Wrong-environment writes | Loud boot assertion tying `NODE_ENV` to the database name; refuse to start on mismatch. Same failure class as the multiple-bot-instances rule |
| H10 | Session theft / CSRF | Host-only `Secure`, `HttpOnly`, `SameSite=Lax` cookie scoped to `portal.dioreo.app`; CSRF token required on every mutating request; 12-hour TTL |
| H11 | Cloudinary credentials leaking through an error | The existing ban applies unchanged — every Cloudinary call sanitizes via `safeErrorMessage()`/`errorHttpCode()`. The portal adds a new call site, not a new rule |
| H12 | Tunnel death makes the portal unreachable | Accepted. `cloudflared` is a third systemd unit; the bot is unaffected, and the portal being down costs nothing that `/manage` cannot still do |

## 7. Hosting and topology

```
                  Cloudflare (DNS + proxy)
  dioreo.app/*        →  Cloudflare Pages  (public/*.html, unchanged)
  dioreo.app/portal   →  302 → portal.dioreo.app/
  portal.dioreo.app/* →  cloudflared tunnel → 127.0.0.1:PORT on the GCP VM
                                                └─ portal/server.js ──→ Mongo Atlas
```

A second systemd unit on the existing `e2-micro`. **The 90–125 MB resident figure is an ESTIMATE with no measurement behind it** (Node baseline + Mongoose + 17 compiled schemas + an HTTP layer). ⚠️ **The headroom is MEASURED and it is tighter than this section first claimed.** Live on the VM, 2026-08-20 18:20 EDT: **969 MB total, 579 MB used, 390 MB available**, with `diors-bot` itself at **131 MB** (`MemoryCurrent=137490432`) — not the 112 MB `docs/reference/deployment-and-ops.md` records from 2026-07-17, so the bot has grown ~17% since. An earlier draft of this paragraph said "roughly 600 MB of headroom"; **that was arithmetic on stale numbers and it was wrong by about 200 MB.** A 90–125 MB portal still fits inside 390 MB, but the remaining margin is ~265–300 MB rather than ~475, which is close enough to plan 3's own stop-and-move-to-Cloud-Run threshold that it must be re-measured immediately before the unit is installed, not taken from here. Reached through `cloudflared`, which is outbound-only: no inbound firewall rule, and no dependence on the VM's external IP, which the ops doc explicitly warns changes on stop/start.

**The VM serves both the page and the API**, so the whole subdomain is one origin: no CORS, no split routing between Pages and the tunnel, and **one deploy path** — the `git pull` that already happens. The portal does not ride `deploy-site.yml` and Cloudflare Pages is not involved in it at all.

**Runtime-agnostic by discipline:** plain Node, every setting via env, no assumptions about the filesystem, the repo layout or the presence of a sibling bot process. If RAM or isolation ever bites, containerising for Cloud Run is a config change. Measured for comparison: Cloud Run's free tier is 180,000 vCPU-s + 360,000 GiB-s + 2M requests per month, so this workload scales-to-zero at **$0.00/month**, or roughly $5–9/month always-warm — an estimate, since the per-unit rates are served through a JS region picker that could not be extracted.

⚠️ **Found while verifying the Atlas premise, and unrelated to this work:** the cluster's network allowlist contains **`0.0.0.0/0`, commented "Render and Local Testing"** — a leftover from the retired Render era. The database is reachable from the entire internet, protected only by the SCRAM credentials in `.env`. That is pre-existing and not caused by the portal, but the portal is a new place those credentials live. **Filed separately; do not treat it as in scope here.** The cluster is also M0 free tier on **Azure, Canada Central** — not GCP — so the bot already makes a cross-cloud connection and Cloud Run would add no new network topology.

## 8. Information architecture

### 8.1 Two layers, everywhere

Track and Board are both **looking**; Manifest is **doing**. They are not peers, so they do not sit side by side:

- **The view layer** sits on top and switches. Visual, read-and-drag, never typed into.
- **The Manifest** sits beneath it and never switches. Search, filter, multi-select, inline edit.

This is the standing shape of **every realm**, so there is one thing to learn rather than five. The switcher only ever changes the top half.

⚠️ **Analytics is a genuine exception and pretending otherwise would be worse than naming it.** In Season, Armory, Broadcast and Access the view layer and the Manifest show **the same entities** — a picture of the thing, over the list of the thing. In Analytics they do not: the view layer shows *metrics* (Health, Usage, Timing) while the Manifest shows *events* (changes, alerts, boots). That is the right design for the realm — metrics and events are the two questions you actually have — but it means the layering there is a **shared chrome rather than the same promise**, and a reader who generalizes from the other four will be briefly confused. Stated here so nobody "fixes" the inconsistency by forcing Analytics into a shape that would make it worse.

### 8.2 Five realms

| Realm | View layer | Manifest | The question it answers |
|---|---|---|---|
| **Season** | Track · Board | Everything in the season | *When, and does it fit* |
| **Armory** | Rack · Coverage | Every build | *What exists, and what is wrong with it* |
| **Broadcast** | Now showing · Airtime | Every announcement | *What is showing, in what order, until when* |
| **Access** | By admin · By scope | Admins and live sessions | *Who can do what — and who is in here now* |
| **Analytics** | Health · Usage · Timing | One filterable event river | *What happened* |

**Season.** The Track is the masthead: a horizontal time axis with lanes by topic, on which three defects that have **no signal at all today** become impossible to miss — something running past the battle-pass end, two things overlapping that should not, and a stretch of season with nothing scheduled. The existing `draft` staging area renders as a second rail below a divider, which is the first time "Promote to Live" can show you what you are promoting. The Board is the **changeset pipeline**, not a third view of content: Draft → Staged → Blocked → Ready, where Blocked is a real column stating why, and the tier-3 export requirement is a visible obstacle rather than a dialog that ambushes you at commit.

**Armory.** No dates, so no Track. Rack shows what exists by category in the bot's real `MP_CATEGORY_ACCENT` hues; Coverage is the Armory's equivalent of the Track's defect flags — missing images, unbadged builds, near-duplicate gunsmith codes (`findDuplicateLoadouts` already exists), wrong attachment counts, entries not updated in 90 days. **Every cell is a filter** into the Manifest below. A preview panel renders the true Discord card via `buildLoadoutCard()`.

**Broadcast.** Now showing renders the live set exactly as Discord sends it, in slot order. Airtime puts every announcement on a time axis, which is how "this has been up for nineteen days with no expiry" becomes visible instead of forgotten.

**Access.** By admin is the grid you grant from; By scope is the inverse, and it does something the grid cannot — it flags a **single point of failure**, a scope held by exactly one non-owner. The Manifest carries **live portal sessions** and the ability to end one, which the bot cannot know at all: revoking an admin in Discord does not kill a browser session.

**Analytics.** Read-only, fetched live from `AnalyticsRollup`, `AlertLog`, `ChangeLog`, `BootRecord` and Cloud Monitoring — the same sources `/bot analytics` already reads. **Nothing is re-derived and there is no second computation to keep true.** The web adds two things a Discord embed cannot: history as a shape, and one action — revert. The river is **one filterable stream rather than four lists**, because alerts, changes and boots are all events, and only a merged stream shows that an alert fired ninety seconds after a change was committed.

> **What Analytics deliberately does not do: rebuild `/bot analytics`.** Health, Alerts, Usage and Timing already work in Discord. A second implementation is a second thing to keep true.

## 9. The visual system

Full detail is in the approved mockups at `local/portal-mockups/`. These are the rules they encode.

**Grid, not colour, carries identity.** The legal family is a numbered index; contributing is a warm invitation; chronicle is notice board / ledger / timeline; `/commands` is the Receiver. The portal's grid is a **track** — a time spine with content hanging off it. That is not an imported metaphor: it is the shape of `SeasonalData` and of CODM's own battle-pass UI. No two families read alike in greyscale.

🔴 **Shape carries state. Colour carries topic.**

- **Solid fill = live.** Hollow with a dashed border = **staged**. Diagonal hatch = **conflict**.
- Colour is the topic's own accent — the bot's real values, so the timeline doubles as a truthful preview.
- Shape survives greyscale, colourblindness and small sizes. Hue does not. **Do not invert this.**

**Palette — blued steel.** `--desk:#0F1418` · `--paper:#171E24` · `--raised:#1F272E` · `--sunk:#0B0F12` · `--rule:#2A343D` · `--ink:#E8EDF1` · `--ink2:#9DAAB4` · `--ink3:#6E7C87`. Signal: `--patch:#F2C230`, `--warn:#FF7A45`, `--ok:#3DDC97`. Distinct from legal's violet-graphite `#16131B` and chronicle's green-black `#0C100E`, while obviously the same house.

**Type — Space Grotesk (UI) + JetBrains Mono (data).** Every date, count, id and code is mono so numerals align in columns. Radius 6px, spacing roomy — the merged skin from three compared alternatives, chosen for long sessions rather than maximum density.

**The accent is a fill, never a text colour**, carried over from `/commands` where solving an embed hue into readable text turned Patch Gold into brown. Proven floor 4.58:1 for any fill, with `#000000` ink — not the site's near-black, which drops it to 4.27.

**One argued exception to a standing 🚫.** `.claude/rules/legal-site.md` says never reintroduce a page-wide command bar, because the read-only Composer was deleted after Harkirat tried to type into it every time. That prohibition is about a **false promise on a page you read**. A real command palette in a tool you **use** accepts the keystroke and does the thing. Raised explicitly rather than routed around; **not yet approved, and not in v1 scope.**

## 10. Auth

Discord OAuth2 authorization-code flow, `identify` scope only. The code is exchanged server-side; **no Discord token is retained after sign-in**. The session is a signed, host-only, `HttpOnly`, `Secure`, `SameSite=Lax` cookie on `portal.dioreo.app`, 12-hour TTL, with a CSRF token on every mutating request. Authorization is `utils/adminAccess.js` unchanged — `isOwner`, `hasCommandAccess`, `hasManagePageAccess`, `getManagePages` — resolved server-side per request.

**Three door states, and they must all say the same amount.** A stranger, an account never granted access, and a revoked admin read identical words. Nothing confirms an allowlist exists, and nothing indicates whether a given account *could* be granted access. "Signed in, no access" is the **default branch for almost everyone**, not an edge case — the most likely real occurrence is Harkirat signing in with his second account.

**Staged work survives the session,** because a changeset lives in the database rather than the browser. An expiry can never cost composed work, and a set started on one machine can be committed from another.

The door is **not linked from the public site** and carries `noindex` — not as security, which it is not, but so that state 2 stays rare rather than being invited. `dioreo.app/portal` is a **302** into it (not 301, which browsers cache permanently and which would fight every stale cache if the portal ever moved).

⚠️ **Harkirat must create the OAuth client secret and register the redirect URI himself** in the Discord Developer Portal. New env var: `DISCORD_OAUTH_CLIENT_SECRET`. Redirect URI to register: `https://portal.dioreo.app/auth/callback`. **Claude does not handle the credential.**

## 11. Data model changes

| Model | Change | Note |
|---|---|---|
| `Announcement` | **add** `startsAt: { type: Date, default: null }` | Scheduling does not exist today; `expiresAt` gives only an end. Filed in `docs/db-deferred-list.md` 🗂️ Queued |
| `ChangeLog` | **add** `inverse: { type: Object, default: null }` | The persisted inverse op that makes revert work from either surface and survive a restart |
| `PortalSession` | **new** | `sessionId` (hashed), `discordId`, `createdAt`, `lastSeenAt`, `userAgent`, `revokedAt`. Backs the live-session list and remote sign-out |
| `Changeset` | **new** | `ops[]`, `authorId`, `state`, `createdAt`, `committedAt`, `snapshot`. Why staged work survives a session |

🔴 **`PortalSession` and `Changeset` both carry a per-user Discord identifier, so `docs/legal/PRIVACY.md` §2 and Appendix A must be updated in the SAME change that adds them.** This is not optional and it is machine-checked: `docs-audit`'s `privacy-model-coverage` exists specifically to catch a new model gaining a `discordId`/`userId` field without a policy entry. `PortalSession.userAgent` is a new *category* of data this project has never stored — a device string — so it needs its own Appendix A row and a retention answer, not a line appended to an existing one. Budget a policy revision, not a footnote.

🔴 **Every one of these must be declared in the same change as the code that sets it.** Mongoose accepts an undeclared field in memory and drops it silently on the next fetch — the recorded cost is `models/SeasonalData.js`'s `draft.calendar`, where a missing field made Promote to Live flatten every staged 2X CP event and the `/draw` calculator quote normal pricing during a live double-CP window.

## 12. Premises to verify before building on them

**Nothing below is assumed. Each is a check to run first, and two of them can invalidate a design decision.**

0. ⚠️ **RESOLVED, and it changes premise 1: the local dev database CANNOT test transactions.** Measured 2026-08-20 18:15 EDT — local MongoDB 8.3.7 reports `setName: null`, i.e. a **standalone**, not a replica set. Transactions require a replica set. So a probe run against `.env.dev` fails for a reason that has nothing to do with Atlas, and reading that failure as "M0 does not support transactions" would reopen this design for no reason. **Fix the local database first** — `mongod --replSet rs0` then `rs.initiate()` makes a single-node replica set, which supports transactions and is the standard local-dev arrangement — or run the probe against a throwaway database on the Atlas cluster. Either way the probe must state which it used.
1. **Mongo transactions on the M0 free tier.** The changeset model depends entirely on §6's atomic commit. The cluster is a three-node replica set on 8.0.29, so transactions should be available — but *should* is not *verified*. Run a real two-document transaction and confirm it commits and rolls back. **If it fails, §5's tier 2 needs a different commit strategy and the design changes materially.**
2. **VM memory headroom.** The 112 MB / 127 MB figures are dated 2026-07-17. Re-measure live before adding a second resident process to a 1 GB box.
3. **`cloudflared` on the VM.** Confirm it installs, runs as a systemd unit and survives reboot alongside `diors-bot`.
4. **Subdocument `_id` stability across a positional update.** §6.1's whole concurrency model rests on it. Verify that an `arrayFilters` update preserves `_id` and that a prior-value assertion actually rejects a stale write.
5. ✅ **MEASURED 2026-08-20 18:15 EDT, and both halves confirmed.** `buildLoadoutCard()` imports cleanly — requiring `utils/loadoutRender.js` pulls **zero** discord.js. And the risk is exactly as predicted: with no client, `utils/emojiMap.js` yields real production ids (`<:7Mythic_CODM:1523190107614744757>`), because `refreshEmojiIds(client)` never runs. **So the portal's preview is correct against production and wrong against the dev application** — silently, since a broken emoji mention renders as plain text rather than erroring. Decide and pin it in plan 3 Task 6. Original wording kept below.
5. **`buildLoadoutCard()` in a browser.** It imports `utils/emojiMap.js`, whose ids are rewritten at bot boot by `refreshEmojiIds(client)`. **The portal has no client**, so it will render pre-sync production ids. Confirm those are correct in the portal's context, or the preview shows wrong emoji — silently.

6. ✅ **RESOLVED 2026-08-20 18:30 EDT — M0 storage is not a constraint.** Measured: 7 collections, 1,028 documents, ~750 KB including indexes, against a 512 MB limit. The inverse-storage format is therefore a **readability** decision, not a capacity one — store the object array, which is what `invert()` already needs, rather than round-trippable bulk text. ⚠️ The limit is cluster-wide; re-measure if a second database appears.

> Premise 5 was found by reading `commands/manage.js`'s own warning about a module-level `PAGES` table freezing stale ids. It is exactly that bug in a new place.

## 12a. Categories examined only after the first draft

A second, hostile pass asked what whole *categories* the design had never looked at, rather than re-reading its own text. Seven, with the answer each got.

✅ **Capacity — MEASURED 2026-08-20 18:30 EDT, and it is a non-issue.** The `diors-builds` database holds **7 collections, 1,028 documents, 312 KB of data and 428 KB of indexes — about 750 KB against M0's 512 MB**, i.e. roughly **0.15% used**. The concern below was real to raise and is now answered: there is room for `PortalSession`, `Changeset` and `ChangeLog.inverse` by three orders of magnitude. ⚠️ Two caveats kept: the 512 MB limit is **cluster-wide, not per-database**, so re-measure if another database is ever added; and the mitigations below stay worth doing as **hygiene** (an abandoned changeset is not precious) rather than as capacity measures. The original concern is preserved verbatim, because a question that was worth asking should not vanish just because the answer was reassuring. ~~**Capacity — the cluster is M0 free tier, 512 MB total, and the design adds three writers to it.**~~ `PortalSession`, `Changeset` (whose snapshots hold full prior arrays — a loadouts bulk-replace inverse is 125 build objects), and `ChangeLog.inverse` on 1,140 existing rows, all sharing 512 MB with the observability layer's `AnalyticsEvent` stream, which is already writing. **This was never asked and is a hard external limit.** Added as premise 6. Mitigations if it is tight, in order of preference: a TTL on `Changeset` (a staged set older than 30 days is abandoned, not precious), storing a bulk-replace inverse as the round-trippable **bulk-text export** rather than an object array, and capping `ChangeLog.inverse` size with a documented refusal rather than silent truncation.

**Concurrent staging is detected but invisible.** Admin A stages a season rewrite in the portal; admin B edits the same draws in `/manage`, seeing nothing. A's commit then conflicts on every element. The conflict is caught (§6.1), but nothing *warns B first*. **Answer: `/manage`'s page header shows a one-line notice when an uncommitted changeset targets that page** — a single indexed query on `Changeset` at panel-render time. Cheap, and it turns a surprise into a heads-up.

**Degraded modes were unstated.** Mongo unreachable → the portal renders the shell and every realm shows a stated error; it never renders an empty list, because an empty list and a dead database look identical and one of them is a lie. Cloudinary down during an upload → the op fails validation with the reason and nothing is staged. Discord OAuth down mid-sign-in → the door says so and offers retry; an existing session is unaffected, since no Discord token is retained.

**Backup.** The tier-3 export is a *per-operation* restore path, not a backup. `scripts/backupDb.sh` exists but is **unscheduled**, and the portal adds new ways to destroy data — behind better guardrails than Discord's, but "better guardrails plus no scheduled backup" is still one bad commit from loss. **Scheduling that backup is a prerequisite for the portal's first tier-3 operation**, and is filed separately rather than absorbed here.

**Abuse.** The door is on a public domain and anyone can drive the OAuth flow, which spends the client secret against Discord's API. Cloudflare's proxy gives baseline protection; the portal adds a per-IP limit on `/auth/*` and a fixed backoff after repeated failures. Not a security boundary — a cost control.

**`/autobuild` is deliberately not in the Armory.** It is the third admin command and it creates loadouts from an image via Vertex AI. A drag-and-drop version in the portal is an obvious fit and would be genuinely better than Discord's attachment flow — but it is a *different* subsystem with its own cost model, its own failure modes and a live pending migration, and folding it in here would make this design about two things. Named so the next reader knows it was considered, not overlooked.

**Frontend testing had no story at all.** The core's tests are plain node scripts; Preact components had nothing. **Answer: the render functions stay pure and are tested as data** — a component takes state and returns a tree, so a test asserts the tree, with no DOM and no browser. Anything needing a real browser is verified through the existing preview tooling instead, and that boundary is stated rather than discovered.

## 13. Out of scope

Non-admin user accounts and any public read-only view — possible later, deliberately not designed now. Mobile layout beyond the degraded subset in decision 7 — designed during live building, at Harkirat's call. The command palette (§9). Rebuilding `/bot analytics` (§8.2). Narrowing the VM's `roles/editor`, and the Atlas `0.0.0.0/0` allowlist — both filed separately and neither caused by this work.

## 14. Audit log

A falsification pass was run against this document — the question asked was *where is this wrong*, not *review this*. Findings, and what changed.

**F1 — `buildLoadoutCard()` would have rendered wrong emoji, silently.** The design leaned on "the render functions are pure" without checking what they import. `utils/emojiMap.js` is rewritten at bot boot by `refreshEmojiIds(client)`; the portal has no client, so it gets frozen production ids. **This is the same defect `commands/manage.js` documents about its own former module-level `PAGES` table.** Added as premise 5 rather than left as an assumption. It does not invalidate the preview, but it would have shipped a preview that was wrong in a way nobody would notice.

**F2 — the concurrency design was wrong on the first pass, and the schema is why.** The plan said "optimistic concurrency" until `models/SeasonalData.js` was actually read. Because it is one global document, document-level `__v` locking produces a false conflict on nearly every pair of unrelated concurrent edits. The correction to element-identity concurrency (§6.1) came from reading the schema, not from reasoning about the design.

**F3 — Board was redundant as originally designed, and the fix was to change its job.** It was a third view of content organized by state, while state was already carried by shape everywhere else. Re-jobbed into the changeset pipeline (§8.2), which is a job nothing else does.

**F4 — "colour means state" was wrong and Harkirat caught it.** It would have failed in greyscale and for colourblind readers, and it contradicted the public site's own accent-is-identity rule. Inverted to shape-for-state (§9).

**F5 — the transaction premise is still unproven and the design depends on it totally.** Called out as premise 1 rather than buried. If M0 refuses transactions, §5 tier 2 needs redesign, not patching.

**F6 — `local/portal-mockups/` is gitignored, so the approved visual design is invisible to every future search.** `rg -uu --hidden` included. The pointer at the top of this file is the only route back, which is why it is stated twice.

**F7 — a claimed reuse was checked rather than assumed.** `utils/adminParser.js`'s exporters were verified to round-trip through the matching parsers before §5 tier 3 was designed around that property. If they had not, the forced-export gate would have produced a file that could not restore anything — a safeguard that manufactures false confidence, which is worse than none.

**F8 — the spec asserted "twelve `kind: 'confirm'` actions"; the registry says seven.** Found by executing `utils/manageActions.js` instead of trusting the sentence. The real set is `draws:purgenew`, `draws:purgereturning`, `draws:purgeall`, `calendar:purge`, `patchnotes:purge`, `seasondraft:promote`, `seasondraft:discard`, out of 57 actions total. A wrong count in a design document is worse than no count, because the next reader budgets against it.

**F9 — the "no discord.js in the render path" claim was checked one level deep and needed two.** `utils/loadoutRender.js` imports `./shareButton` and `./paginationRow`, which the original claim never examined. Verified: all four files in that chain, `utils/emojiMap.js` included, import discord.js zero times. The claim survives — but it was luck, not diligence, and premise 5 exists because the same shape of unchecked transitive dependency *did* bite on emoji ids.

**F10 — four new models were specified with no mention of the privacy obligation they trigger.** `PortalSession` and `Changeset` both carry per-user Discord identifiers, and `PortalSession.userAgent` is a device string, a category this project has never stored. `docs-audit`'s `privacy-model-coverage` would have failed CI on it. §11 now states the requirement; it was absent from the first draft entirely.

**F11 — a resident-memory figure was presented as if measured.** The 90–125 MB in §7 is a construction from component estimates, and §12 flagged only the *VM's* dated numbers, not this one. Now labelled as an estimate at the point of use rather than only in the premise list.

**F12 — the "reused core" claim was false for its most load-bearing member, and the check that found it was one I had already refused to generalize.** F9 checked `loadoutRender`'s imports one level deeper and I wrote that surviving it "was luck, not diligence" — then did not apply the same test to anything else. Computing the transitive require closure for all five claimed-reusable modules took one script and found that `utils/adminAccess.js` pulls 39 files, `discord.js`, `jimp` and `child_process` through `isOwner()`'s `require('../commands/manage')`. **A finding you name and then do not generalize is worse than one you never made**, because the audit log records diligence that did not happen.

**F13 — the same script found good news that was also unstated.** `utils/logger.js` is 2 files with no npm dependencies, so the portal gets the bot's structured Cloud Logging for one require. The first draft had **no observability story for a second production process at all** — not a wrong answer, an absent one.

**F14 — `canRevert()`'s message is wrong for the window between plans 1 and 2.** `registerUndo` has **13 call sites across five entity files**; plan 1 converts only draws' four. So calendar rows written the same day would show "predates revert support", which is false and reads as a bug. The message must distinguish *historically un-inverted* from *entity not yet on the core*, and plan 1 now carries that.

**F15 — the headroom figure was arithmetic on stale inputs and was wrong by ~200 MB.** §7 claimed "roughly 600 MB of headroom" from `deployment-and-ops.md`'s 2026-07-17 numbers. Measured live: 390 MB available, with the bot at 131 MB rather than 112. The conclusion survives — a 125 MB portal still fits — but the *margin* was overstated by nearly a factor of two, and plan 3's own stop-and-move threshold sits at 250 MB. **A number copied from a dated document into a present-tense claim is the exact failure this repo has a rule against**, and I made it while writing a spec that cites that rule.

**F16 — the tier principle only covers half of what it sounds like it covers.** "Writes directly when it can guarantee an exact inverse" governs how reversible a change is; it says nothing about how *visible* the mistake is meanwhile. Because the bot re-reads per interaction, a tier-1 edit is public within seconds. The principle is not wrong, but a reader would reasonably take "tier 1" to mean "low stakes", and it does not.

**F17 — the two-layer IA does not actually hold in Analytics, and the first draft asserted it did for all five realms.** Everywhere else the view layer and the Manifest show the same entities; in Analytics one shows metrics and the other shows events. That is the right design for the realm, which is precisely why the inconsistency had to be named rather than smoothed over — otherwise the next reader "fixes" it.

**F18 — the capacity concern was correct to raise and wrong to leave unmeasured.** §12a listed three mitigations for an M0 storage squeeze that does not exist: the database is at ~750 KB of 512 MB. Two lessons, and the second is the one worth keeping. **Raising an unexamined concern and then designing mitigations for it is how a document acquires machinery nobody needs** — the mitigations are now correctly reframed as hygiene. And the measurement took one call, which is the whole argument for checking rather than hedging.

**Not found, and worth stating:** no defect was found in the two-layer IA, the tier derivation, or the hosting choice. That is an absence of findings, not evidence they are right.

## 15. References

- **Approved mockups (gitignored):** `local/portal-mockups/` — six screens, listed at the top of this file
- **Implementation plans, in order:** `docs/superpowers/plans/2026-08-20-portal-core-operation-algebra.md` (the core, proven on draws) → `docs/superpowers/plans/2026-08-20-portal-core-remaining-entities.md` (the other five entities, then the in-memory undo store retires) → `docs/superpowers/plans/2026-08-20-portal-server-and-realms.md` (the server, OAuth, and the five realms)
- **Superseded roadmap item:** `docs/ROADMAP.md` and `docs/db-deferred-list.md` 🧹 Someday — the `/manage` search+multi-select entry
- **Filed out of this session:** `docs/db-deferred-list.md` 🗂️ Queued — the `Announcement.startsAt` schema gap
- `utils/manageActions.js` — the action registry the portal must read from, and its header on why two copies is unacceptable
- `utils/adminAccess.js` · `utils/adminParser.js` · `utils/changeStore.js` · `utils/loadoutRender.js` — the reused core
- `.claude/rules/manage-panel.md` · `.claude/rules/legal-site.md` · `.claude/rules/models.md`
- `docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md` — the four-stage decomposition this builds on
