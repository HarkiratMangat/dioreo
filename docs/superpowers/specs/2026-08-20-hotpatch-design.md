---
kind: spec
status: frozen
---

# Hotpatch — making a pulled file go live without restarting the bot

## The ask, in Harkirat's words

> *"imagine i edit a minor bug in a file, or i implement a new feature/file, i want that information/code to sync and go live into the running bot without having to do a full bot restart to pick up those files… i want it where only the /draw prices command would basically restart if i updated the /draw prices file. and i don't need this vastly implemented either, i just want it available for minor hot fix cases."*

Pulling on the VM is already free and already in his control — `git pull` updates the files on disk without touching the running process. **The missing half is making the running process re-read one of them.** That is the entire scope.

**This does not replace `scripts/deploy.sh`.** Deploy stays exactly as it is and remains the path for everything hotpatch refuses — which is most of the tree. Hotpatch is an *addition* for the narrow case, never a substitute. And the two compose cleanly: a normal restart after a hotpatch is idempotent, because the VM's disk was already at that commit — the process simply reboots onto the same code, and `client.hotpatches` resets, which is correct, since after a restart it is no longer true that the process differs from its boot commit.

## What the measurements say (taken 2026-08-20 11:39 EDT, do not re-derive)

- **A restart costs 10–23 seconds of total unresponsiveness**, measured from 21 days of `journalctl -u diors-bot`: `Stopping` → `routing links integrated` was 23s / 10s / 10s / 15s / 16s across five deploys, and **124s** on 2026-08-16 15:00 UTC (a 110s gap between `Stopping` and `Started` — the DB-rename deploy). **6 restarts in 21 days.** So this is a capability gap, not a frequency problem — which matches "available for minor hot fix cases".
- **`/draw prices` is the cheapest possible case.** Its panel text lives in `commands/drawprices.js` (397 lines, `buildContainer()`), and `handlers/drawprices.js` re-renders on button clicks by calling `interaction.client.commands.get('draw')` — a Collection lookup the bot **already performs fresh on every single click**. Swapping the Collection entry is sufficient for both the slash command and its buttons.
- **45% of relative `require()` calls in this repo (249 of 546) are already lazy** — written inside a function body, so they re-resolve through `Module._cache` on every call and self-heal for free once a cache entry is deleted. Nobody designed for this; it is a large free surface.
- 🔴 **`DIORS_COMMIT` is never set — and `utils/logger.js:30` says otherwise.** That comment claims *"`deploy.sh` exports DIORS_COMMIT"*; verified 2026-08-20 11:47 EDT that nothing sets it — not `scripts/deploy.sh`, not the systemd unit (`Environment=NODE_ENV=production` is its only Environment line), nowhere in the tree. Only the `git rev-parse` fallback has ever run. This matters directly: the "which commit is this process running?" question **must** be answered by `utils/logger.js`'s own require-time `COMMIT`, read through a getter, not by shelling out to git at hotpatch time — see §7. The false comment is corrected in the same change.
- **Changes arrive in batches, not single files.** Median **8** runtime `.js` files per first-parent commit (p25 = 3, p75 = 12, max 125); only 3 of 47 were single-file. **This is why hotpatch operates on a diff, not on a filename** — see §4.

## 1. The invariant

Everything below follows from one rule, so there is one thing to remember and one thing to test:

> **A reload is sound iff its dependent closure terminates at a late-bound boundary, and every member of that closure is either stateless or declares a hot-swap contract.**

That converts *"is this file safe to hot-swap?"* — a human judgement that rots and that nobody gets right at 2am — into a computation performed at the moment of use.

**Late-bound boundary** = a module that resolves its dependency at *call* time rather than at *require* time. Three exist or can exist here:

| Boundary | Status |
|---|---|
| `client.commands` Collection — looked up per interaction in `handlers/router.js` | **Already exists.** Free. |
| `handlers/router.js` → the 15 handler modules | **Must be created.** One small change, §3. |
| Lazy `require()` inside a function body (45% of edges) | Already true. **Deliberately not modelled in v1** — see §7. |

A boundary is **where the closure ends**, not a member of it. It is never reloaded, so its own state is irrelevant.

## 2. Three verdicts, not two

| Verdict | Meaning | Fixable? |
|---|---|---|
| **ALLOW** | Closure terminates at a boundary; every member is stateless or declares a contract. | — |
| **REFUSE — state** | A member mutates module-scope state, holds live timer handles, or registers process listeners, and has not declared a contract. | **Yes** — declare `__hotSwap` on that one file (§5). This is the growth path. |
| **REFUSE — structural** | The closure reaches `index.js` or `bot/`. These are process-lifecycle modules; no declaration can make them swappable. | **No.** Needs a restart, permanently, and that is correct. |

### Measured coverage under this rule

Computed 2026-08-20 11:39 EDT over all 108 candidate modules (`commands/` + `handlers/` + `utils/`, conservatively treating **every** require edge as early-bound):

| | ALLOW | REFUSE — state | REFUSE — structural |
|---|---|---|---|
| `commands/` (17) | **15** | 2 | 0 |
| `handlers/` (23) | **20** | 2 | 0 |
| `utils/` (69) | 11 | 41 | 17 |
| **Total (108)** | **46** | 45 | 17 |

**With zero annotations, on day one, 15 of 17 commands and 20 of 23 handlers are hot-swappable** — i.e. the entire surface Harkirat described works immediately.

The 17 structural refusals are exactly the modules you would hope for: `eventStore`, `alertWebhook`, `emojiMap`, `instanceLock`, `logger`, and their neighbours. The invariant is doing real work, not rubber-stamping.

## 3. The one wiring change — router late-binding

Today `handlers/router.js` captures each handler once:

```js
const { handleColorsButton } = require("./colors");
```

After — same names, same call sites, same dispatch order, byte-for-byte:

```js
// Late-bound so utils/hotpatch.js can swap a handler module without re-wiring the router.
// require() on an already-cached module is a Map lookup; this is per-interaction, not per-loop.
const late = (mod, fn) => (...args) => require(`./${mod}`)[fn](...args);
const handleColorsButton = late('colors', 'handleColorsButton');
```

One line per handler, at the exact spot the `const` sits today. **Nothing below the import block changes**, which matters because `.claude/rules/interaction-router.md` documents that branch ORDER is load-bearing and that byte-identity is not behaviour-identity. `scripts/handlerRouting.test.js` (13 handlers) and `scripts/handlerState.test.js` both keep passing unchanged, and are the regression proof.

⚠️ `handlers/router.js` itself becomes a **boundary**, so its `interactionCooldowns` Map survives every hotpatch untouched. Before this change it sat inside 15 of 23 handler closures and single-handedly forced a REFUSE on all of them.

## 4. 🔴 Hotpatch operates on the DIFF, not on a filename

This is the single most important safety decision in the design.

The median merge touches **8** runtime `.js` files. If Harkirat pulls and then patches only `commands/drawprices.js`, the other seven files sit updated on disk while the process runs the old versions of them — a half-updated bot that *looks* fine. That is strictly worse than a restart, and it is the exact failure mode this design must not have.

So:

1. `git pull` (if requested).
2. Compute the changed set: `git diff --name-only HEAD@{1} HEAD` — or, if no pull, `git diff --name-only` against the boot commit recorded by `logBootBanner()`.
3. Plan over **the union of those files**, filtered by whatever the user named. A filename is a *filter and a sanity check*, never the input.
4. If **any** changed runtime file is REFUSE-structural → the whole operation refuses and offers a restart. Nothing is applied.

### 🔴 A changed command SHAPE is refused, not applied

Discord's own command list comes from a single REST `PUT` at boot. Swapping a `commands/*.js` module updates what `execute()` *does*, but not what Discord *shows*. So a brand-new `commands/foo.js` would land in `client.commands` with no way for anyone to invoke it, and a changed option or description would leave every user on the old shape — while the panel reported ✅ Applied. Half-shipped, wearing a success message.

So `applyHotpatch` compares `data.toJSON()` before and after for every command member and **refuses** when it differs or the command is new: *"the Discord-facing command shape changed — that needs a re-register; use Full restart."* Re-`PUT`ting from a hotpatch is possible, but it drags in rate limits, `applyGunsmithsScopeChoices`'s builder mutation and `client.gateableCommandNames` — far more machinery than *"minor hot fix cases"* justifies. Refusing is cheap and honest. A body change (the overwhelmingly common case, including Harkirat's `/draw prices` typo) is unaffected.

## 5. `utils/hotpatch.js` — the engine

```js
planHotpatch({ files })  →  { verdict, members[], reasons{}, boundaries[], blocked[] }
applyHotpatch(plan, { client })  →  { ok, applied[], error }
```

**`planHotpatch` is pure analysis with no side effects.** It builds the reverse dependency graph **statically, by reading the files off disk**, walks dependents, stops at boundaries, and classifies each member by scanning its source at that moment — no stored manifest, nothing that can go stale.

⚠️ **Static, not `require.cache` — this reversed during the audit.** The runtime cache is precise, but it only records requires that have actually *executed*, so the answer would vary with whatever the bot happened to run, could not be tested offline, and could not answer `--dry-run` from a shell with no bot attached. The static graph counts every edge as early-bound, which makes closures **larger**, which errs toward **refusing** — the safe direction. ⚠️ It must resolve a **directory** require: `require("./manage")` from the router means `handlers/manage/index.js`, and a naive `+ ".js"` looks for a `handlers/manage.js` that does not exist, silently dropping the edge. This matches the repo's existing convention of deriving rosters rather than hand-maintaining them (`client.gateableCommandNames`, the `readdir` command loader, the "derive this list with `ls handlers/`" rule).

**`applyHotpatch` is verify-then-swap, all-or-nothing:**

1. `node --check` every member file (the same gate `npm run check` uses).
2. Snapshot the old `require.cache` entries **and** the old `client.commands` entries in memory.
3. For each member declaring `__hotSwap`, call `retain()` and hold the value.
4. Delete the cache entries; `require()` each fresh inside `try`/`catch`.
5. Validate shape — a `commands/*.js` must export `data` + `execute`; a `handlers/*.js` must export the function name the router looks up.
6. Call `adopt(retained)` on each fresh module that declares it.
7. Re-wire: `client.commands.set(fresh.data.name, fresh)` for command members. **Handlers need no re-wire** — the router looks them up at call time (§3).
8. **On any failure in 1–6: restore the snapshot and the Collection, change nothing, return the error.**

Three further guards the audit added:
- **One at a time.** A module-level `inFlight` flag refuses a second concurrent run, since Discord and the CLI can both fire. ✅ Pleasing consequence: that flag makes `utils/hotpatch.js` classify as stateful, and `bot/lifecycle.js` requires it, so **hotpatch is `REFUSE_STRUCTURAL` on its own engine** — it can never patch itself. That is correct; do not work around it.
- **The `__hotSwap` source scan is a hint, not proof.** A comment mentioning `__hotSwap` would satisfy a regex. `applyHotpatch` re-checks `typeof exports.__hotSwap?.retain === 'function'` and fails the swap if the plan claimed a contract the module does not have.
- **A failed swap cannot undo a module-load side effect.** `restore()` puts the old exports back, but a timer or listener the fresh module registered at top level stays registered. This is safe *only* because those are exactly what the classifier refuses — the mitigation is load-bearing, so it is written down rather than left implicit.

### The `__hotSwap` contract — the elegant answer to the `utils/` problem

A module that holds live state can opt in with ~4 lines:

```js
// utils/passiveExpiry.js
module.exports.__hotSwap = {
    retain: () => pendingTimers,                                  // hand over the live setTimeout handles
    adopt: (prev) => { for (const [k, v] of prev) pendingTimers.set(k, v); },
};
```

Without it, `passiveExpiry`'s old timeout handles would keep firing against the dead module while the new instance's empty Map made `clearTimeout` impossible — a panel disabled mid-use, or double-PATCHed. With it, the handles transfer and the module is genuinely swappable. This is the same pattern as Webpack HMR's `module.hot.dispose(data)` / `module.hot.data` and Erlang/OTP's `code_change/3`; naming it after a known idiom is deliberate.

**The engine supports the contract in v1 even though no file declares one yet** — otherwise adding the first declaration later means changing the engine.

**Measured payoff — nine files hold nearly all the state.** Declaring a contract on them, greedily, one at a time:

| Declare on | Hot-swappable targets |
|---|---|
| *(baseline, no declarations)* | **46 / 108** |
| `handlers/colors.js` (`colorsRefreshCooldowns`) | 52 |
| `handlers/manage/shared.js` (5 token Maps) | 53 |
| `utils/adminAccess.js` | 62 |
| `utils/autobuildPipeline.js` | 72 |
| `utils/nameplateWebpCache.js` · `utils/decorationWebpCache.js` | 75 |
| `utils/accentColor.js` (`dynamicColorCache`) | **79 / 108 (73%)** |

So the honest framing of the `utils/` problem is **not** "utils are unsafe". It is: *nine files hold the state, each can opt in with four lines, and you never have to do it speculatively* — you do it the first time a specific file blocks something you actually want to patch. **None of these are in v1's scope.**

## 6. The three fire surfaces

Harkirat asked for all of them.

### `/bot hotpatch` (Discord)

A new subcommand on the existing owner-only `/bot`. Options: `file` (string, **autocompleted from the currently-ALLOW set** — which makes the safe surface discoverable rather than something to memorise) and `pull` (boolean, default `true`).

Renders a Components V2 result panel: the verdict, the closure members, what changed, the new commit. **On a refusal it shows two buttons — `Full restart` and `Cancel`** — which is Harkirat's exact ask ("refuse and say so AND *offer* to full restart or exit").

🔴 **Gate on `isOwner()` only — never `hasCommandAccess()`.** Hotpatch executes new code inside the bot process. `/bot analytics` is token-gated so admins can see stats; `/bot access` already uses `isOwner()` directly (`commands/bot.js:8`) and is the correct model to copy. A scoped admin must never reach this.

⚠️ **The `Full restart` button must NOT shell out to `sudo systemctl restart`** — that would need a passwordless-sudo grant on the VM for a Discord button. Instead: write the `.restart-reason` marker (`manual`) and **send this process `SIGTERM`**. systemd's `Restart=always` brings it straight back, and `bot/lifecycle.js`'s `readRestartReason()` labels the "Bot online" alert correctly with no new privilege anywhere.

⚠️ **`SIGTERM`, not `process.exit(0)` — the audit corrected this.** `utils/instanceLock.js` registers `releaseLock` on SIGINT/SIGTERM and `bot/lifecycle.js` registers `installShutdownFlush` on the same signals; both exist because of v3-review findings #12 and #56, precisely so a restart does not discard the buffered analytics or strand the lock. A bare `process.exit(0)` runs neither.

⚠️ **Autocomplete must not run the engine.** Offering the changed-file list is a `git diff` (cheap); building the graph reads 128 files (not cheap), and this would run per keystroke inside Discord's 3-second budget on a shared-core e2-micro. `commands/settings.js:54` records the scar from the last time something did this — a pre-warm that *"blocked the event loop enough to make unrelated interactions miss Discord's 3s ACK window (10062)"*. Autocomplete calls a separate `changedRuntimeFiles()` and nothing more.

### `scripts/hotpatch.mjs` (VM and local)

⚠️ **A separate `node scripts/hotpatch.mjs` process cannot mutate the running bot's module cache.** It needs a channel into the live process. Chosen mechanism: **`SIGUSR2` + a marker file**, mirroring the `.restart-reason` pattern this repo already uses and understands.

- Verified free: no `SIGUSR1`/`SIGUSR2` handler exists anywhere in the tree. (Node reserves `SIGUSR1` for the debugger; `SIGUSR2` is the conventional reload signal — nginx, PM2.)
- The script writes `.hotpatch-request` (JSON: files, `pull`, `dryRun`), sends `SIGUSR2` to the pid from `BotInstance` / `systemctl show --property=MainPID`, then polls `.hotpatch-result` and prints it.
- `bot/lifecycle.js` gains the `process.on('SIGUSR2', …)` listener, consuming the marker once, exactly like `readRestartReason()`.
- No socket, no port, no new attack surface — same-user signal delivery only.
- `--dry-run` prints the plan and applies nothing. This is the flag to reach for first, every time.

The identical script drives the **local dev bot**, so the whole mechanism is testable without touching prod.

**`dior bot hotpatch` is a follow-up, not v1.** ⚠️ The `dior` CLI is a *separate git repo* on a protected `main` (`~/.config/dior/`), invisible to every in-repo search including `rg -uu --hidden` — so it is its own branch and its own PR. Filed, not bundled.

### Pull: both modes supported

`pull:true` runs `git pull` (via the read-only deploy key already configured) and then plans over the resulting diff. `pull:false` plans over what is already on disk. ⚠️ In pull mode, code execution follows from a Discord message — mitigated by owner-only gating and by the fact that it pulls exactly what `deploy.sh` would have pulled from a branch-protected remote.

## 7. Observability — non-negotiable in this repo

`logBootBanner()`, `.restart-reason`, `BootRecord` and `vmstatus.sh` **all key on a process start**. A hotpatch is invisible to every one of them, which would silently break the "attribute every journal line to a version + commit" property the whole ops layer rests on. So:

- A `HOTPATCH` journal line carrying the new commit and the file list, emitted through the patched `console` so it inherits severity and `serviceContext`.
- `sendAlert('Hotpatch applied', …, 'info')` — same channel and shape as "Bot online".
- `client.hotpatches = [{ at, commit, files }]`, surfaced on `/bot analytics`' Health page.
- 🔴 **`utils/logger.js` freezes `COMMIT` at require time and its comment says the value *"cannot change while the process lives"* — which stops being true the moment hotpatch exists.** `logger.js` is `REFUSE_STRUCTURAL` (`index.js` requires it), so it can never reload itself to notice. It gains `noteHotpatch(commit)` and a `currentCommit()` **getter** — a getter because CommonJS froze the old value into `module.exports`, so a plain `COMMIT` read would keep returning the boot value. That getter is also where `runHotpatch` reads the "what am I running?" baseline from, which is what makes *pull separately, then hotpatch* work at all, and it makes a second hotpatch diff from the first rather than from boot.
- Because the swap is all-or-nothing, **disk and process can never disagree partially** — a hotpatched process runs exactly the commit `git rev-parse HEAD` reports. That property is what keeps `vmstatus.sh` honest, and it is another reason step 8 of §5 matters.

## 8. Scope

**In v1:**
- `utils/hotpatch.js` — `planHotpatch` + `applyHotpatch`, including `__hotSwap` support
- Router late-binding accessors (§3)
- `/bot hotpatch` subcommand + result panel with `Full restart` / `Cancel`
- `scripts/hotpatch.mjs` + the `SIGUSR2` listener in `bot/lifecycle.js`
- Journal line, alert, `client.hotpatches`
- `scripts/hotpatch.test.js`, wired into `npm test`
- `.claude/rules/hotpatch.md` (path-scoped), ROADMAP item struck, CHANGELOG + DEVLOG

**Explicitly NOT in v1:**
- `__hotSwap` declarations on the nine blocker files — added on demand, one at a time
- Lazy-edge detection (treating all 546 edges as early-bound is conservative, errs toward refusing, and already yields 46/108 — **measure before optimising**)
- A persistent `HotpatchRecord` model — `AlertLog` already persists the event
- `dior bot hotpatch` — separate repo, separate PR

## 9. Testing (at the end, after Harkirat confirms he is ready to push)

- `scripts/hotpatch.test.js` — the classifier against known cases that **can** fail: a pure util → ALLOW; `utils/eventStore.js` → REFUSE-structural; `handlers/colors.js` → REFUSE-state; a synthetic module declaring `__hotSwap` → ALLOW. Plus a real end-to-end swap in a child process, asserting the *new* function body runs and that a deliberately-broken file leaves the old one live.
- `scripts/handlerRouting.test.js` + `scripts/handlerState.test.js` unchanged and green — the regression proof for §3.
- A live click-test on the **dev bot**: patch a string in `commands/drawprices.js`, confirm `/draw prices` renders the new text and its buttons still work, with no restart in the journal.

## 10. Decisions taken, so they are not re-litigated

- **Human-initiated only.** Harkirat's call, 2026-08-20 11:39 EDT. This deliberately does *not* reopen `docs/ROADMAP.md:20`'s `[P3 · M]` auto-deploy-on-merge item, which is *"considered and explicitly REJECTED… revisit only if the manual step becomes an actual friction point, not preemptively."* Hotpatch is a new capability, not automation of the existing step.
- **Refuse, then offer.** A refusal shows `Full restart` / `Cancel` rather than silently falling back to a restart — so one command never has an unpredictable cost.
- **`utils/` is not banned**, it is gated by the same invariant as everything else, with a declared escape hatch and a measured payoff table.
- **Blue/green process handover was considered and dropped.** It would give true zero-downtime and its failure mode is safer, and the e2-micro has room (bot ≈ 121 MB, ~430 MB free). But it solves a *different* problem — the 10–23s restart window — and Harkirat's answer was explicitly about per-file reload, plus *"i don't need this vastly implemented"*. Recorded here so a future session finds the analysis rather than redoing it.
