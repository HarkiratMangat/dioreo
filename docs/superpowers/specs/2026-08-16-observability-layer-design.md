---
kind: spec
status: frozen
---

# Dioreo observability layer — design

**Date:** 2026-08-16 10:18 EDT · **Branch:** design only, no implementation · **Roadmap items closed by this:** ROADMAP line 48 (richer in-bot logging/tracking), line 132 (usage analytics/telemetry), line 49 (admin `/status`)

## Context

Three logging systems already exist and none of them answers the question "which part of the bot broke, and what was the user doing?"

- **`utils/logger.js`** (v2.41.0) patches `console.*` into structured Cloud Logging records carrying real severity plus `service`/`version`/`commit`, with a journald-aware file sink. Google Cloud Error Reporting groups the ERROR-severity entries (v2.57.0). What it does not carry is any notion of *which subsystem* produced a line — the record is undifferentiated.
- **`utils/alertWebhook.js` + `alertStore.js` + `AlertLog`/`AlertCounter`** post operational alerts to Discord with human-referenceable ids, a 1/min throttle, 30-day/1000-row retention, and a plain-language explanation layer. Read via `/alerts`.
- **`ChangeLog` + `/audit`** record every DB-mutating `/manage` operation with actor, page, action, model, target and an `undone` flag. 180-day/5000-row retention.

A fourth, `RenderTiming`, was added 2026-08-11 for a single `/colors` performance investigation and stores a **raw** `discordId`.

Nothing anywhere records what users actually do. There is no usage data, no navigation data, no latency data, and no way to tell whether a shipped feature is being used — the `/gunsmiths` consolidation was decided without any of it.

### The premise that turned out to be false

`docs/ROADMAP.md` line 49 has gated the admin `/status` command since 2026-07-20 on the claim that *"the VM's service account can WRITE logs and not read them back"*, and that historical CPU/RAM peaks would need a new keyless-ADC + Cloud Monitoring path.

Measured 2026-08-16: VM `diors-builds-bot` runs as `435048837454-compute@developer.gserviceaccount.com` with OAuth scope `cloud-platform` (unrestricted) and IAM role **`roles/editor`**, whose 11,974 permissions include `logging.logEntries.list`, `logging.logEntries.download`, `logging.logs.list` and `monitoring.timeSeries.list`. The bot process can already read its own logs and metrics via ADC with no role broadening. Both stated blockers are false.

⚠️ The same measurement raised a security item in the opposite direction — `roles/editor` is far wider than the bot needs and includes `logging.logs.delete`. Filed separately in `docs/db-deferred-list.md` 🗂️ Queued, and **coupled to this design**: whichever ships second must not remove the read permissions the other relies on.

## Decisions — settled, do not re-litigate

These were decided in the 2026-08-15/16 design session and each was argued through. Reopening them needs new evidence, not a fresh opinion.

| Decision | Value | Why |
|---|---|---|
| Scope | One observability layer, not four systems | Alerts, changes, usage, timing and health are the same subsystem seen from different angles |
| Usage granularity | Full fidelity, per-event, kept indefinitely | The point is answering questions not yet thought of |
| User identity | `HMAC-SHA256(secret_key, discordId)` — never the raw ID | Defeats a database-only compromise; costs nothing operationally since the bot holds the key |
| Raw ID recovery | **Not stored**, indefinitely | The one thing it uniquely enables — turning a row into a named person — is the use this data is explicitly not for. Addable later; historical rows can be backfilled for any user who returns |
| `guildId` | Stored **raw** | A server is not a person; guilds are enumerable so hashing protects little; raw IDs keep "which servers are adopting this" answerable at a glance |
| Attribution | `AsyncLocalStorage` interaction context + stack-derived file | One edit instead of 146; coverage cannot decay; survives refactors |
| Read surface | `/bot analytics` (paged) + `/bot access`; `/alerts` and `/audit` retire | One tree for high-level bot commands, room to grow |
| Timing | In scope, including external-dependency outcomes | |
| Third-party analytics SDK | No | Evaluated 2026-08-06 and declined on technical merits; Error Reporting already covers grouping |

### Corrections made during design, recorded so they are not re-introduced

- **No `eventId`.** An early draft gave each event a human-referenceable `"Aug16-0042"` id copying `alertId`. That id is allocated by an atomic counter document — one extra Mongo round trip *per event* — which would have silently defeated the buffering the performance budget depends on. Alerts and changes get human ids because they are rare and referenced by hand; events are neither. The ObjectId suffices.
- **Timing was briefly excluded** because it was presented bundled with external-dependency tracking. Both are in scope.
- **`/status` was twice deferred as possibly-unwanted, and that question is now answered rather than overridden.** ROADMAP line 49 carried `⏸️UNDECIDED` twice — 2026-07-20 ("unsure of its usability") and 2026-08-10 ("still undecided if i even want to build it") — with a note that a third appearance should prompt asking whether it belongs in 🚫 Decided-no. It appears a third time here **because Harkirat chose "one observability layer" as this session's scope**, which includes health by construction. That is an affirmative answer to the standing question, not a silent re-raise of a deferred item.
- **The `/manage` decomposition project is complete** (v3.18.0-pre through v3.21.0-pre: action registry, per-page handler split, scoped `action:` option, audit log). Extracting `manageadmins` is a new change on top of a finished project, not a collision with one in flight.

## Architecture

### 1. Three planes

| Plane | Storage | Holds | Retention | Raw user ID? |
|---|---|---|---|---|
| **Diagnostic** | Cloud Logging *(exists)* | every `console.*`, enriched with interaction context, component and version/commit; ERROR-severity entries grouped by Error Reporting | 30 days (default) | **Never** — see below |
| **Event** | Atlas — one new collection | one document per interaction: usage + timing + outcome + dependency calls | indefinite, plus roll-ups | **Never** |
| **Operational** | Atlas *(unchanged)* | `AlertLog`, `ChangeLog` | 30d/1000 and 180d/5000 | Admin IDs only |

**No plane carries a raw Discord ID.** An earlier draft allowed the diagnostic plane to keep one inside its 30-day window, on the reasoning that tracing an error to a specific person is what makes it actionable. That was incoherent: both planes are fed by the same enriched context, so a raw ID permitted in one is a raw ID *sitting in the async context*, one careless log line away from the other. The context carries **only the hash**. Support is unaffected — a known user's ID is hashed on demand — and an entire class of leak becomes structurally impossible rather than merely discouraged.

The operational plane's retentions are written verbatim into `docs/legal/PRIVACY.md`. Changing them means amending a live legal document for no benefit, so they stay exactly as they are.

### 2. The event document

One document per interaction. Usage, timing, dead clicks, policy enforcement and install-type adoption are all facets of the same record rather than separate stores.

```js
{
  _id,                // ObjectId. Deliberately no human-readable id — see Corrections.
  userHash,           // HMAC-SHA256(ANALYTICS_HMAC_KEY, discordId). Never the raw ID.
  guildId,            // raw; null in DMs
  context,            // 'guild' | 'dm'
  installType,        // 'guild' | 'user'   ← adoption tracking
  isAdmin,            // true for /manage, /bot, /autobuild — excluded from product stats by default
  command, subcommand,
  entry,              // 'slash' | 'button' | 'select' | 'autocomplete' | 'modal' | 'synthetic'
  customIdPrefix,     // the segment BEFORE the first '_' delimiter, nothing after it.
                      // Not an adjective — custom_ids here embed Mongo _ids and user
                      // snowflakes (mng_admin_*, mng_announce_*), so a loose capture leaks one.
  outcome,            // 'ok' | 'error' | 'expired' | 'blocked_by_policy'
                      //   | 'swallowed_by_cooldown' | 'rejected_admin'
  ackMs,              // time to defer/reply       ← the 3-second deadline
  durationMs,         // total handler time
  deps: [             // capped array; one entry per external call
    { name: 'cloudinary', ms, ok },
    { name: 'vertex', ms, ok, tokens },
  ],
  detail: { },        // subsystem-specific fields (absorbs RenderTiming's area/source/
                      // subpage/variant/cold). BOUNDED: max 8 keys, scalar values only,
                      // 512 bytes serialised — otherwise it becomes where schema discipline leaks away.
  version, commit,    // deploy correlation
  host, createdAt
}
```

**Autocomplete is debounced, not recorded per keystroke.** Discord fires an autocomplete interaction on every keystroke, and both loadout search and `/manage`'s `action` option use it — so at equal fidelity autocomplete would be the large majority of a collection designed to grow forever, while answering nothing. Instead the buffer holds one row per search session keyed on (user, command, field), updating it as keystrokes arrive, and flushes a single completed event carrying keystroke count, final query length and whether a result was picked. **The typed query text IS stored**, on the session event and in an aggregate table — reversed during design after Harkirat pointed out the product value: a search that returned nothing is the single best input to an alias table ("people type `kilo`, the weapon is `KILO 141`, nothing matched"), and that fix is only findable if the term survives.

⚠️ **This is not message content and must not be described as such.** Text typed into a slash command's own field is deliberately sent to the bot — that is how commands work. The policy's "we cannot read your messages" claim concerns the MESSAGE CONTENT intent, which the Bot does not hold, and is entirely unaffected by this. An earlier draft of this spec conflated the two.

Handling: the term is **normalised** (lowercased, trimmed, whitespace-collapsed) and **length-capped at 100 characters** before storage, so a mis-paste into the wrong field cannot dump a wall of text into a permanent record.

#### The search-term aggregate

Alongside the per-event text, a small aggregate collection carries **no user linkage at all**:

```js
{ term, command, field, searches, zeroResults, picked, firstSeen, lastSeen }
```

This is the working surface for alias design, and it is better than the raw events for that purpose — the question is "which terms fail, and how often", which is already a grouped question. It is also the half that can be kept indefinitely without holding anything attributable, and it is what `scripts/analytics.mjs` reads for the "failed searches" report.

#### Roll-ups

Referenced throughout as the reason raw rows stay optional, so their shape is part of the design rather than an implementation detail. One document per `(day, command, subcommand)`:

```js
{ day,               // UTC date key, consistent with alertId/changeId
  command, subcommand,
  invocations, distinctUsers,
  outcomes: { ok, error, expired, blocked_by_policy, swallowed_by_cooldown, rejected_admin },
  entry:    { slash, button, select, autocomplete, modal, synthetic },
  ackMs:    { p50, p95 }, durationMs: { p50, p95 } }
```

⚠️ **`distinctUsers` does not sum across days** — adding seven daily figures over-counts anyone who returned. Either store the day's distinct hash set (bounded and small at this scale) so multi-day distinct counts are a union, or accept that any "distinct users this month" figure must touch raw rows. Decide this before the first roll-up is written; changing it later re-buckets history.

### 3. Identity and key management

`ANALYTICS_HMAC_KEY`, 32 random bytes, base64. Lives in `.env` on the VM and **never** in Mongo, never in git (`.env` is gitignored — hard invariant).

- **Canonical backup in a password manager.** The scenario it covers is a rebuilt VM or a lost key, which would otherwise orphan every historical pseudonym permanently. This is deliberately preferred over storing a recoverable copy of user IDs — protecting one short secret is easier than protecting a private key plus a re-sealing procedure.
- ⚠️ **`.env.dev` must set its own value explicitly.** `dotenv.config()` runs after `--env-file` and backfills anything omitted, so leaving the key out of `.env.dev` does not unset it — the dev bot silently inherits **prod's** key. This exact behaviour already bit the alert webhook once.
- **Deletion requests** (`PRIVACY.md` §9): hash the requester's ID, delete matching rows. Roll-ups hold no personal data and need no deletion.
- **What the scheme does and does not protect against**, stated honestly because the policy text must not overclaim: it defeats an attacker holding the database alone. It does **not** defeat one holding the database *and* the key — Discord IDs come from a small enumerable candidate set, so they would hash candidates and match. With `guildId` stored raw, the candidate set for a guild-attributed row is that server's member list.

### 4. Attribution

An `AsyncLocalStorage` context is established once, in `handlers/router.js`, when an interaction arrives:

```js
{ interactionId, command, handler, userHash }
```

Every log line emitted anywhere below that point — at any call depth, across any number of async hops — inherits it automatically. `patchConsole` merges the context plus a stack-derived file name into the structured record.

This is one edit rather than 146, and the coverage cannot decay as new modules are written. It also answers a question neither of the alternatives could: file-level attribution alone reports *where a line was logged*, so an error thrown inside `utils/accentColor.js` reads as `accentColor` whether the caller was `/colors` or something else. The interaction context reports **what the user was doing**, which is the question that actually matters at 2am.

**Non-interaction paths have no context, and must still be attributable.** The daily heartbeat, the Cloudinary cleanup sweep, boot, and the gateway/shard diagnostics in `bot/lifecycle.js` all log with no interaction in scope, so `getStore()` returns undefined. Those records fall back to the stack-derived component alone plus a `lifecycle` context tag — they are precisely the lines that matter when the bot is unhealthy, so silently unlabelled is the wrong default.

⚠️ **The Cloudinary secret-logging ban applies here more than anywhere.** A logging layer is the most likely place for it to be broken by accident. Every path that can carry a Cloudinary error must go through the module's own `safeErrorMessage()`/`errorHttpCode()` — the raw rejected-promise object carries the account's live API key and secret in `request_options.auth`.

### 5. Where instrumentation attaches

- **The router wrap** covers every interaction by default. The event is written in a **`finally`**, so an interaction that throws still records — those are the events most worth having.
- **Outcomes come from guards that already exist**: the 600ms anti-spam cooldown (`interactionCooldowns` in `handlers/router.js`), the `/admin` visibility policy, the `/manage` admin lock, and the seven `"interaction likely expired"` catches in `handlers/share.js`, `handlers/settings.js` and `handlers/manage/season.js`. No new guards are needed — they need to report rather than only act.
- **Dependency timing wraps the external clients**, not every call site: Cloudinary, Vertex, Atlas, Discord REST.
- **One boot/readiness record per start**: commands registered, emoji ids resolved (the known stale-prod-id trap), Atlas and Cloudinary reachable.

### 6. Read surface

```
/bot  (admin-only, integration types [1])
├── analytics   → one panel, page dropdown: Health · Alerts · Changes · Usage · Timing
└── access      → admin allowlist, extracted from /manage's owner-only manageadmins page
```

`/alerts` and `/audit` retire as command names; their panels become pages.

⚠️ **Discord forbids top-level options on a command that has subcommands.** The `visibility` option currently sitting at the top level of `/alerts` and `/audit` must move onto each subcommand.

**Health reuses `scripts/vmstatus.sh` and `scripts/vmpeaks.sh`'s computations rather than reinventing them** — ROADMAP line 49's original scope named those scripts explicitly ("which already compute all of this"), and it is right: they already derive the three-tier error model (errors / alerts / noise), the severity counts, and the historical peaks. The page should port their logic, not write a second, divergent version of the same arithmetic. ⚠️ Where they differ is the *source*: those scripts query from the Mac via `gcloud`, whereas the page queries from inside the bot via ADC. The queries port; the transport does not.

**Health** reads Cloud Logging and Cloud Monitoring via ADC — available today, per the permission finding. Those queries take seconds, so the page defers and caches its result (60s is ample). Live process state — gateway, RSS, uptime — comes straight off `client.ws` and `process` and needs no API call.

⚠️ **Restart count does NOT come from `process`, and an earlier draft of this spec claimed it did.** `process.uptime()` reports the *current* process's age; it cannot know how many times systemd restarted the unit. `scripts/vmstatus.sh` gets it from `systemctl show $U -p NRestarts --value` over SSH, which the bot has no equivalent of. **The right source is already in this design: count the boot/readiness records.** One is written per start, so restarts over any window is a count over that collection — which also makes restart *reasons* available, since `bot/lifecycle.js` already distinguishes deliberate restarts (a `.restart-reason` marker written by `deploy.sh`) from unattended ones.

**The Health page reuses `utils/alertStore.js`'s existing `getAlertSummary()`** rather than re-deriving anything: it already returns 24h and 7d tallies by level, the most recent error, and the total. ROADMAP line 49 named this explicitly as the route a `/status` command should take, and the Cloud Logging read is **additive** to it, not a replacement — `getAlertSummary()` answers "what was announced", Cloud Logging answers "what happened", and the three-tier error model (errors / alerts / noise) turns on exactly that distinction never being collapsed into one number.

Historical CPU/RAM peaks come from Cloud Monitoring (`monitoring.timeSeries.list`, confirmed available). `scripts/vmpeaks.sh` already computes these from the Mac and is the reference for which series and windows to query — build on it rather than deriving fresh.

**Outside Discord:** direct Mongo queries (zero build), plus `scripts/analytics.mjs` for recurring questions, plus a panel export button matching the existing `/alerts` and `/audit` export shape. A `dior` CLI wrapper and any visualisation tool are deferred — note that MongoDB Atlas Charts would need **no new sub-processor disclosure** since Atlas is already a named recipient, unlike an external BI tool.

## Performance budget

The design adds five things per interaction. Four are free; one needs care.

| Cost | Magnitude | Handling |
|---|---|---|
| `Date.now()` pairs | nanoseconds | ignore |
| `AsyncLocalStorage` context | small, once per interaction, not per async hop | ignore at this bot's volume |
| Stack capture per `console.*` | ~1–10µs, only on lines that fire | clamp `Error.stackTraceLimit` during capture so the bulk-cache runner's 925-item loop does not pay for it |
| Dependency timestamp pairs | nanoseconds | ignore |
| **Mongo insert** | **30–80ms** | see below |

**The absolute rule: the interaction response path never awaits the event write.** Awaiting it even once adds 30–80ms to every interaction against a 3-second budget, for zero user benefit.

**Buffer and batch.** Events accumulate in an in-memory buffer flushed by `insertMany` on an interval or at N events. 200 events at ~400 bytes is ~80KB on a 969MB box. This turns hundreds of round trips into one.

**Except on error.** When `outcome === 'error'`, flush immediately — the moment an event is most worth having is right before a crash that would discard the buffer. Errors are rare, so this costs effectively nothing.

**Every write is fire-and-forget and swallowed**, the idiom `utils/alertStore.js` and `utils/renderTiming.js` already follow. Instrumentation must never be the thing that breaks a real interaction.

### Storage growth

An event document is ~300–400 bytes; with indexes, ~500–700 bytes of effective footprint.

- 1,000 interactions/day → ~365k rows/year → **~180–250 MB/year**
- 10,000 interactions/day → ~3.6M rows/year → **~2 GB/year**

🔴 **The cluster is on Atlas's FREE tier (M0), confirmed by Harkirat 2026-08-16 10:34 EDT — 512 MB, hard cap.** This is the constraint that turns "keep everything indefinitely" from a preference into a decision with a date on it.

✅ **MEASURED 2026-08-16 10:38 EDT** via the Atlas connector, once Harkirat enabled org-level AI client access. Cluster `diors-builds`, `instanceType: FREE`, MongoDB 8.0.29 on Azure `CANADA_CENTRAL` (which independently corroborates `PRIVACY.md`'s "your data is stored in Canada"). Database **`diors-builds`** (renamed from `test` later the same session — see below): **282 KB data + 476 KB indexes = 776 KB of 512 MB, i.e. 0.15%** — 940 objects across 7 collections with 15 indexes, `avgObjSize` **307 bytes**.

Three consequences, all now evidenced rather than estimated:

- **The runway is effectively the full 512 MB.** Existing data is rounding error.
- **`avgObjSize` of 307 bytes independently validates this spec's ~300–400 byte-per-event estimate.** The growth arithmetic below rests on a measured figure, not a guess.
- 🔴 **Indexes are 1.7× the data here (476 KB vs 282 KB).** The warning that every index multiplies the per-row cost on a grow-forever collection is not theoretical — this database already demonstrates it. **Index count is the single biggest lever on when the ceiling arrives**, which is why the index set must be derived from the queries the panel and report script actually run.

At 1,000 interactions/day (365k rows/year) the event collection consumes M0 in roughly **2.3 years** at 600 bytes effective, or **~1.4 years** if indexes run as heavy as the existing collections do. At 10,000/day it is **a matter of months**. ⚠️ Note the change of character this represents: the database holds **940 documents today**, so the event collection would take it to ~400× its current size in the first year and would immediately be, by a wide margin, the largest thing in it.

**What this changes:** roll-ups stop being a speed optimisation and become **load-bearing**. They are what lets raw events be pruned at a horizon while the permanent answers survive at full resolution — so "indefinite" applies to the *aggregates*, and the raw event stream gets a retention horizon chosen once the real fill rate is known. That is a smaller concession than it sounds: the questions that need raw rows are recent-window questions ("what broke this week", "did that deploy help"), and the questions that need years are aggregate ones.

✅ **RESOLVED 2026-08-16 11:02 EDT — the production database was named `test`** and has been renamed to `diors-builds`, verified by matching object/index counts and the bot's own boot log. Retained here because the reasoning still explains the naming: it was — Mongoose's default when the connection string carries no `/dbname` segment. Harmless today but genuinely confusing (the dev bot is explicit: `diors-builds-dev`), and a builder connecting to inspect analytics will look for `diors-builds` and find nothing. Also confirmed in the same session: **M0 provides no automated backups**, so `scripts/backupDb.sh` was added — the analytics collection this spec introduces will have no recoverable copy except what that script takes, which makes scheduling it a genuine prerequisite for calling any of this data durable.

⚠️ **Two M0 properties to confirm before committing to permanence**, neither verified here: whether the tier provides any automated backup (a permanent record on a tier without one is a risk worth naming explicitly), and its connection-limit behaviour under the buffered-write pattern. If permanence genuinely matters more than cost, a paid tier is the honest answer rather than silently discovering the ceiling.

**A read-only Atlas user is worth creating regardless** — it is the missing piece for the "read the analytics outside Discord" requirement in §6, and it avoids handing the analysis path a read-write production credential.

Three levers, in order: roll-ups make raw rows unnecessary for most questions; the index set stays deliberately minimal and is chosen from the queries the panel and report script actually run, never added speculatively; and if a ceiling is genuinely approached the honest answer is a tier upgrade, not silent data loss.

**The size guard must use `estimatedDocumentCount()` or `collStats`, never `countDocuments()`** — the latter is a full collection scan, so a guard protecting against a large collection would become a performance problem exactly when it fired. It trips an existing `sendAlert` before the ceiling, so the failure mode is a warning rather than writes silently starting to fail.

## Panel design rules

The requirement is that the data is genuinely easy to read, not merely present. These are the constraints and the rules, both falsifiable.

**Platform constraints already paid for in this repo:**

- Components V2 counts **40 components recursively**, and exceeding it was a real production crash. A data-dense page is one Container with a few text blocks, not twenty components. Long lists chunk through the existing `paginationRow` helper.
- Buttons cannot carry custom hex; the Container's `accent_color` can. Each page takes its own accent from the existing nav-order → `PRESET_ACCENT` map, consistent with `/manage`.
- **Discord renders normal text proportionally**, so aligned columns only exist inside a code fence — and **Discord on a phone wraps a monospace line past roughly 40 characters**. Every table designs to ~40 columns or it looks broken on the device it will most often be read on.

**Rules, in priority order:**

1. **One headline number per page, with its period** — "4,182 interactions · last 7 days" — before any table.
2. **Ranked lists over raw tables.** "What is used most" is a ranking question; a table makes the reader do the sorting.
3. **Trend gets a picture.** Unicode blocks (`▁▂▃▄▅▆▇█`) sparkline cleanly inside a fence and cost one line.
4. **Every number carries a comparison** — "vs previous 7 days, +12%". A bare number cannot be judged, and un-judgeable numbers get ignored. That is how dashboards die.
5. **Percentiles, not averages.** One 8-second render drags a mean and tells you nothing; p95 corresponds to "users are noticing".
6. **Dead space beats density.** The failure mode is a wall of data, not too little.

**Page shapes:** Health opens with a single plain-language verdict line (reusing `utils/alertExplain.js`'s existing layer) before any facts. Usage is headline → top commands → entry-point split → outcome breakdown. Timing is p50/p95 against the 3-second deadline with the deadline drawn as a reference line, then slowest commands, then dependency split. Alerts and Changes keep their existing paginated lists unchanged.

## `RenderTiming` — migrate, then retire

`RenderTiming` is folded into the event collection and the collection is dropped.

Its rows are migrated **with their `discordId` hashed**, so the migration strictly *reduces* the raw-ID surface rather than relocating it. Its `/colors`-specific fields (`area`, `source`, `subpage`, `variant`, `cold`) go into the event document's generic `detail` sub-object, which the schema needs anyway.

Then: drop the collection, delete `models/RenderTiming.js` and `utils/renderTiming.js`, update the call sites in `handlers/colors.js`, `utils/nameplateWebpCache.js` and `utils/decorationWebpCache.js` — and **remove its paragraph from `docs/legal/PRIVACY.md` §2.4**, because the thing it describes will no longer exist. A live legal document getting shorter and more accurate is the clearest signal this was the right call.

## Privacy

`docs/legal/PRIVACY.md` goes to **v1.12**, after v1.11 takes effect at the v3 release.

- A new section describes the event record: what is collected, that the user identifier is a keyed hash rather than a Discord ID, what it is used for (improving the bot), and explicitly that it is **never used to personalise what any individual sees**. Appendix A gains a row. §5's MongoDB Atlas row is unchanged — no new recipient.
- The existing "no analytics, no tracking, no profiling" lines (§0 summary, the §2 table, the verification appendix) are made **precise rather than deleted**: no advertising, no ad-tech tracking, no third-party analytics SDK, no profiling for marketing or personalisation. None of those becomes false. Precedent already exists — the policy currently discloses `RenderTiming`, a first-party per-user diagnostic log, alongside those same claims.
- **Search terms are disclosed explicitly**: text typed into the Bot's own search fields is recorded, normalised and length-capped, and used to improve search and build aliases. The section must state plainly that this is command input the user sends to the Bot, and is not message content — the "we cannot read your messages" claim elsewhere in the policy stays true and must not be weakened by vague wording here.
- The `RenderTiming` paragraph is removed in the same change.
- **Notice**: §12 requires reasonable efforts to give notice before a material change takes effect. The **Announcement feature** shipped 2026-08-13 is exactly that mechanism — a one-time notice delivered to each user on their next command. The policy's requirement and the bot's own capability line up.
- **Ordering is a deploy gate, not a merge gate**: v1.12 must be *in effect* before the event plane reaches **prod**. Stage 2 may merge and sit undeployed, which is a normal state in this repo.
- `docs-audit`'s `privacy-model-coverage` check fails CI until the new model is documented. That is the enforcement; no discipline is required.

## Testing

- 🔴 **The highest-value test in the project: assert the raw Discord ID never appears in a stored event.** Serialise the finished document and search it for the raw ID string. This guards the one property the entire privacy design rests on, and it catches the *realistic* regression — not someone deliberately adding `discordId`, but a `detail` field that happens to carry one, or a `customIdPrefix` capture that grabs a segment embedding a user snowflake. Neither would survive this test; neither would be caught by a schema review.
- **Pure-logic unit tests** for the hash function, the roll-up aggregation, the autocomplete debounce, and the buffer's flush-on-error rule, in the style of `scripts/catalogGrouping.test.js`. Wired into `npm test`.
- **Routing tests extended** — `scripts/handlerRouting.test.js` gains the `/bot` handler. ⚠️ **A handler serving more than one interaction type must type-test every branch.** `/bot analytics` serves slash, button and select; the `index.js` split broke `/settings` pagination with byte-identical code precisely by dropping such a guard.
- **Permission tests are mandatory for `/bot access`** — see Risks.
- **Live dev-bot click-test** before any merge: every page, both entry points, and a deliberate error to confirm the diagnostic plane attributes it correctly.
- **Verify the instrumentation on a known case before trusting it**: run a command whose behaviour is already known and confirm the event's `command`, `entry`, `outcome` and `ackMs` match what actually happened.

## Risks

**`/bot access` is the highest-severity item in this project, and it is not in the analytics half.** Extracting `manageadmins` moves an **owner-only permission gate**. A regression there does not produce a wrong number — it grants someone admin access. `handlers/manage/admins.js` is already self-contained, which helps, but the gate lives in `utils/adminAccess.js`'s `getManagePages()`/`isOwner()` and the `manageadmins` entry in `utils/manageActions.js`. Precedent for the failure mode is exact: the `index.js` split regressed `/settings` pagination with byte-identical moved code. This stage gets its own PR, its own permission tests, and a click-test on the dev bot before merge.

**A self-observing system distorts its own numbers.** `isAdmin` exists so `/bot` usage can be excluded from product statistics by default rather than silently mixed in.

**Collection is time-sensitive; presentation is not.** The panel can be built any month; last month's data can never be collected retroactively. This is the reason stage 2 precedes stage 3, and the reason a delay in the panel costs nothing while a delay in collection costs data permanently.

## Staging

Four PRs into `v3-pre-release`, each a MODERATE bump (minor bumps are suspended for the pre-release line).

1. **`feat(logging): interaction context and component attribution`** — `AsyncLocalStorage` in the router, `patchConsole` enrichment, stack-derived component. No new model, no privacy surface, no user-visible change. **Recommended to land *before* the v3 launch** — this is cheap, isolated, and a launch is exactly when knowing which component broke is most valuable. The rest stays after launch per the roadmap's scheduling.
2. **`feat(analytics): event collection and instrumentation`** — model, HMAC util, buffered writer, router emission, outcome capture at existing guards, dependency wrappers, boot record, `RenderTiming` migration. ⚠️ **Must not deploy to prod until `PRIVACY.md` v1.12 is in effect.**
3. **`feat(bot): /bot command tree`** — `/bot analytics` panel with its five pages, `/bot access` extracted from `/manage`, `/alerts` and `/audit` retired. Highest-risk stage; see Risks.
4. **`feat(analytics): health page, roll-ups and reporting`** — Cloud Logging/Monitoring reads with caching, roll-up job on the existing daily heartbeat in `bot/lifecycle.js`, `scripts/analytics.mjs`, panel export.

## Must verify before building — not assumed here

- ~~**The Atlas tier and current database size.** Blocked during design.~~ ✅ **MEASURED later the same session** — free M0, 776 KB of 512 MB. See the storage section; do not re-open this.
- 🔴 **Is `scripts/backupDb.sh` scheduled yet?** M0 has no automated backups, so this collection's durability rests entirely on that script running. **An unscheduled backup script is worse than none, because it manufactures the belief that backups exist.** Check before treating any of this data as durable.
- 🔴 **Does the old `test` database still exist?** It holds a full duplicate of every `UserPreference` record. Retained as a rollback with a **named expiry** (see `docs/db-deferred-list.md`), not indefinitely.
- **`installType` availability.** Guild-install vs user-install depends on Discord's `authorizing_integration_owners` / `context` fields being exposed by discord.js v14.26. Believed available; check against the running dev bot before the schema commits to it.
- **`AsyncLocalStorage` context survival across the discord.js event boundary.** The context is established in the router; confirm it propagates through the specific async paths the handlers use.
- **Roll-up day boundaries use UTC**, consistent with `alertId`/`changeId`. Confirm this matches how the panel presents dates before shipping the first roll-up, because changing it later re-buckets history.

## Out of scope

Third-party analytics or error-reporting SDKs (evaluated 2026-08-06, declined on merits). Error grouping and dedup — Cloud Error Reporting already does it. Anything touching message content — the intent is not held and the data is inaccessible. A `dior` CLI wrapper or external visualisation tool — deferred. Retrofitting the raw Discord IDs in `UserPreference`, `AdminUser`, `Announcement`, `ChangeLog` and `GuildSettings` — a separate and much larger migration, and `UserPreference.discordId` is the unique lookup key hit on every interaction. Narrowing the VM's `roles/editor` — filed separately and coupled to this design.
