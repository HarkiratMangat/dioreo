---
kind: rule
status: live
paths:
  - "utils/hotpatch.js"
  - "scripts/hotpatch.*"
  - "handlers/router.js"
  - "bot/lifecycle.js"
---

# Hotpatch — reload a pulled file into the running bot without a restart

*Loads when you touch the engine, the CLI, the router, or `bot/lifecycle.js`. Built 2026-08-20 13:15 EDT from `docs/superpowers/specs/2026-08-20-hotpatch-design.md` + `docs/superpowers/plans/2026-08-20-hotpatch.md` — read those for the full design history and the falsification-pass audit log that found the two silent-wrong-result defects below.*

## The invariant

**A reload is sound iff its dependent closure terminates at a late-bound boundary and every member is either stateless or declares a `__hotSwap` contract.**

`utils/hotpatch.js`'s `planHotpatch({ files })` computes that closure from a **static** require graph (read off disk, not `require.cache`) and returns one of three verdicts: `ALLOW` · `REFUSE_STATE` (a member mutates module-scope state and declares no contract — fixable) · `REFUSE_STRUCTURAL` (a member is `index.js`/`bot/*`/`models/*` — permanent, or the path does not resolve to a scanned module at all).

## Why the graph is static, not `require.cache`

The runtime cache only records requires that have actually **executed**, so the answer would depend on what the bot happened to run, could not be tested offline, and could not answer `--dry-run` with no bot attached. The static graph counts every edge as early-bound, which makes closures **larger**, which errs toward **refusing** — the safe direction. This is a deliberate trade, not an oversight.

## `handlers/router.js` is the boundary — never let it become a member

A **boundary** resolves its dependency at call time, not require time, so it never holds a stale reference and never needs reloading. Two exist:
- `handlers/router.js` → the handler modules, via the `late()` accessors (Task 2, 2026-08-20 11:47 EDT) — a Map lookup on an already-cached `require()`, benchmarked at well under 2µs, not a disk read.
- `handlers/router.js` → commands, via `interaction.client.commands` (a `Collection`, read per-interaction).

`BOUNDARIES` in `utils/hotpatch.js` is a `Set` containing exactly `'handlers/router.js'`. **Do not remove it or let a future refactor make router.js require a handler eagerly again** — that would drag `interactionCooldowns` and the router's own module state into every handler's closure, and the whole per-handler hot-swap story collapses.

## Why `index.js` / `bot/*` / `models/*` are permanently structural

`index.js` and `bot/*` own the process lifecycle — the crash handlers, the `Client`, the gateway listeners, the instance lock. Re-requiring them would register a **second** set of everything. `models/*` is permanent for an unrelated reason that is just as absolute: a model calls `mongoose.model('Name', schema)`, which **throws `OverwriteModelError`** on a second call. No `__hotSwap` contract can make either category safe. No `models/*.js` currently requires a `utils/` file (verified 2026-08-20 11:39 EDT), so a model reaching a closure isn't possible today — the guard exists so a future edge cannot make it possible silently.

## The `__hotSwap` contract

A module that holds live state can opt in with ~4 lines:

```js
module.exports.__hotSwap = {
    retain: () => pendingTimers,                                  // hand over the live state
    adopt: (prev) => { for (const [k, v] of prev) pendingTimers.set(k, v); },
};
```

`utils/passiveExpiry.js` is the reference case: without a contract, its old `setTimeout` handles would keep firing against the dead module while the new instance's empty Map made `clearTimeout` impossible — a panel disabled mid-use, or double-PATCHed. With one, the handles transfer and the module is genuinely swappable. Same idiom as Webpack HMR's `module.hot.dispose`/`module.hot.data` and Erlang/OTP's `code_change/3`.

**v1 ships with zero `__hotSwap` declarations** — the engine supports the contract so adding the first one later never means changing the engine. **Do not add declarations speculatively.** Declare one only when it actually blocks a file you want to patch; the measured payoff table (spec §5) shows nine files hold nearly all the blocking state, from `handlers/colors.js` up through `utils/accentColor.js`, taking coverage from 46/108 to 79/108 if all nine were declared.

## Measured blocker coverage (2026-08-20 11:39 EDT, zero annotations)

**46 of 108 modules** hot-patchable as shipped, including 15 of 17 commands and 20 of 23 handlers. The rest are blocked by either a structural escape (`index.js`/`bot/`/`models/` in the closure) or live mutable state with no contract.

## 🔴 The three observability lines in `runHotpatch` are load-bearing

`logBootBanner()` / `.restart-reason` / `BootRecord` all key on a **process start**, so a hotpatch is invisible to every one of them — and "attribute every journal line to a version+commit" is the property the whole ops layer rests on. `runHotpatch`'s success path does three things that keep that true, and none of them may be tidied away:
1. `require('./logger').noteHotpatch(after)` — updates the commit `utils/logger.js` reports on every structured log line and Cloud Error Reporting's `serviceContext`. Without it, the journal reports the pre-patch commit forever (the process can never reload `logger.js` to notice — it's `REFUSE_STRUCTURAL`).
2. The `console.log('🩹 HOTPATCH …')` line — the journald-visible trail.
3. `sendAlert('Hotpatch applied', …)` — the Discord-visible trail, and `client.hotpatches.push(...)` for `/bot analytics`'s Health page.

## Two silent-wrong-result defects the falsification pass caught (recorded so they are never reintroduced)

1. **The baseline commit must come from `logger.currentCommit()`, never `git rev-parse HEAD`.** Harkirat pulls separately and then hotpatches, so by the time `runHotpatch` runs, `HEAD` already equals the new commit — diffing against it yields an empty changed set and a cheerful "nothing to patch" over a process still running old code. `DIORS_COMMIT` is never set by anything (verified 2026-08-20 11:47 EDT — not `deploy.sh`, not the systemd unit), so there is no env-var shortcut either.
2. **A `commands/*.js` swap that changes the Discord-facing shape (`data.toJSON()`) must be refused, not applied.** The command list Discord shows comes from one REST `PUT` at boot; swapping the module changes what `execute()` *does*, never what Discord *shows*. Re-`PUT`ting from a hotpatch is possible but drags in rate limits and `applyGunsmithsScopeChoices`'s builder mutation — far more than a minor hot fix warrants. `applyHotpatch` compares the JSON shape before/after and throws (triggering rollback) on any difference.

## Other traps already paid for

- **`changedRuntimeFiles()` is cheap on purpose — one `git diff`, no graph.** Autocomplete calls it, never `runHotpatch`: building the require graph reads 128 files, and autocomplete fires per keystroke inside Discord's 3s budget on a shared-core e2-micro. `commands/settings.js:54` records what a heavy autocomplete path already did once — unrelated interactions missed the ACK window and died with 10062.
- **`inFlight` in `applyHotpatch` is a deliberate single-instance guard**, not an oversight to remove. It makes `utils/hotpatch.js` itself classify as stateful, which means `bot/lifecycle.js` requiring it makes hotpatch `REFUSE_STRUCTURAL` on its own engine — the process can never patch itself mid-swap. Correct; do not work around it.
- **A failed swap cannot undo a module-load side effect** (a timer or listener a fresh module registered at top level before the shape check failed). Safe only because the classifier refuses exactly those modules (module-scope `setInterval`/`process.on` count as state) — the mitigation is the classifier, not the applier, so don't weaken `stateReasons()` without re-checking this.
- **`/bot hotpatch` and the `bot_hp_restart` button both re-check `isOwner()` independently of the router's coarse `bot_` → `hasCommandAccess(userId, 'bot')` guard**, same defense-in-depth every other owner-gated `/bot` mutation uses. The `'bot'` token is grantable to any admin for analytics; it must never reach code-reload or a manual restart.
- **`bot_hp_restart` writes `.restart-reason` and sends `SIGTERM`, never `process.exit()`.** `utils/instanceLock.js`'s `releaseLock` and `bot/lifecycle.js`'s `installShutdownFlush` are both registered on `SIGINT`/`SIGTERM` (v3-pre-release review findings #12, #56) so a restart doesn't strand the instance lock or discard buffered analytics. A bare `exit()` runs neither.
- **`scripts/hotpatch.mjs` cannot mutate the running bot's module cache itself** — it's a separate process. It writes `.hotpatch-request`, sends `SIGUSR2` to the bot's pid, and polls `.hotpatch-result`. `SIGUSR2` was verified free in this tree (no existing handler; Node reserves `SIGUSR1` for the debugger) and is the conventional reload signal (nginx, PM2).
- **Test the CLI against a plain `node --env-file=.env.dev index.js`, never `node --watch`.** The watcher restarts on every file save, so it — not the hotpatch — would be what makes a change appear, proving nothing.
