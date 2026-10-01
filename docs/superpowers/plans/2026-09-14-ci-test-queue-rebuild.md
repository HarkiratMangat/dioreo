---
kind: plan
status: live
---

# PLAN — CI and test-queue rebuild

*Written 2026-09-14 18:19 EDT on `ci/test-queue-rebuild`, branched from `v3-pre-release` at `8c5e8a90`. Scope: every CI workflow, `npm test`, and the tests that make either slow or flaky. Built in the same session that wrote it, autonomously, while Harkirat is away.*

> 🔴 **THIS PLAN IS FOR THE SESSION EXECUTING IT.** Harkirat, 2026-09-14 17:58 EDT, in the popup: *"you can do the plan then build but it's all happening this 1 session. and remember to write the plan as per this repo's mega-batching work style, don't use /writing-plans' one by one loop style. The plan is basically for yourself so you don't drift with working style, tool usage, sequential-thinking, think-pass, etc compliance."* **Re-read §1 at every phase boundary.**

> ⚠️ **IF YOU WERE HANDED A SHORT OPENER, it is not a summary of this file.** Only this file carries §0's merge-order decision (this branch merges AFTER portal Session 2, and what it must do first), §1's working contract, and §6's table of what the build changed against the plan.

## §0 — Decisions already made (do not re-open)

| Question | His answer (popup, 2026-09-14 17:58 EDT) | What it means here |
|---|---|---|
| How to build | Plan, then build, all in this one session, autonomously | No check-ins. A push, a PR and a merge are still his: nothing leaves this branch |
| Skip unaffected tests? | **Local only, CI runs everything** | The local runner caches by traced inputs. CI never caches and never skips, which also retires `portalStates.mjs`'s own `--ci` diff skip |
| Merge order (asked 2026-09-14 20:15 EDT) | **After portal pins batch 2 Session 2**: "sure we can merge it after session 2" | Session 2 runs on the test setup its plan was written for. Before this branch merges it takes `git merge origin/v3-pre-release`, adds any test file Session 2 created to `scripts/testManifest.mjs`, resolves the three `portal/fixtures/states/*.json` entries it rewrote, and takes the NEXT version number at its own merge — so the version bump, CHANGELOG and DEVLOG are written then, not at PR time |
| macOS hooks job | **Yes, only when hooks change** | A `macos-latest` job runs `npm run test:hooks` when `.claude/hooks/**` or `scripts/hookOutputCap*` changed |

## §1 — The working contract (re-read at every phase boundary)

| Rule | How it applies to this plan |
|---|---|
| Silent mode | Zero prose between the first call and the final message. The final message follows the contract: outlet file, about 25 lines, verdict first |
| Minimise turns, never calls | Each `⟦ONE MESSAGE⟧` group below is ONE assistant message. Evidence reads share a message; edits are ONE `python3` heredoc per group |
| Heredoc edits | `assert` every anchor and its count · a `print()` per edit · compute `STAMP` in the script · end the heredoc with `&&` and chain the gate · a deletion asserts what SURVIVES |
| Tool routing | `mcp__linksee__read_smart` for a whole file, heredoc edits included · `ctx_search` for prose · `rg` for a literal · codebase-memory for callers · `ctx_execute` only for output that gets processed; under about 20 lines, plain Bash |
| Thinking pass | `sequentialthinking` BEFORE every verification group and before the final report: harsh, the unasked angle, falsify, and "which unconditional rule am I breaking right now?" |
| Verify, never assert | Every task carries a Verify AND a falsifier — a check that could come out the other way. Read exit codes; never pipe a gate into `tail` |
| Approval | No `git push`, no `gh pr create`, no merge. Branch commits are free |
| Records | The version bump, CHANGELOG entry and DEVLOG entry cite the PR number, and `changelog-pr-citation` errors on a placeholder — so they are the PR step's job and are drafted into `local/`. Reference docs, the deferred list and the resolved list are updated on this branch |
| Chapters | `mark_chapter` at each phase |
| Memory | a linksee `caveat` the moment something fails; a `learning` when a decision lands |

## §2 — Measured baseline (Step 0 — gathered before this plan)

The full report is `local/ci-test-audit-2026-09-14.md`, which is gitignored, so the numbers that drive the plan are restated here.

| Measurement | Value |
|---|---|
| `npm test`, local, uncached | 258.6 s — 132 commands in one `&&` chain |
| CI job, run 34894567359 | 267 s; `npm test` 215 s |
| CI average duration | about 118 s mid-August → about 320 s on 2026-09-14 |
| CI failures | 56 of the last 200 runs; 11 re-attempted, 6 green on re-run with no change |
| `portalStates --ci` | 59.6 s at CPU/wall 0.70, 69 states |
| `portalGeometry.test.mjs` | 46.9 s — its fifth case spawns the full `--all --check` walk |
| `portalGeometry --all --check` | 30.7 s |
| `mcp-layer-check.test.sh` | 23.2 s at CPU/wall 0.10 — `prun()` never sets `MCPCHECK_PROBE=0` |
| docs-audit full spawn vs `--only xref` | 4.79 s vs 0.19 s — `--only` verified: exit 0, one result id |
| docs-audit self-test | 39.7 s; `proves()` spawns a full audit three times per check |
| `buildPortal.build()` | 1.21 s, called by 15 test scripts, bust = `Date.now()` |
| Slowest hook tests | mcp-layer 23.2 · stale-reference 11.9 · commit-completeness 11.1 · records-close 10.4 · ctx-index-refresh 8.8 s |
| Test files not wired into `npm test` | 0 of 118 |

## §3 — Design

- **A · Waste out of the tests.** A duplicate walk, a real network probe, full-audit spawns, sleeps for clock granularity, a clock race, a non-deterministic build.
- **B · Browser walks made deterministic, then parallel.** Every step waits for its target; each worker gets its own browser context; states and realms spread across the workers.
- **C · A runner in place of the `&&` chain.** `scripts/testManifest.mjs` holds the list, lanes, weights and declared inputs; `scripts/testRunner.mjs` runs a weighted pool, reports every failure, and writes a durations report.
- **D · Local selection, CI runs everything.** A preload tracer records each test's real inputs and the local cache skips a test whose inputs are unchanged. CI splits into `tests`, `browser`, `records` and a conditional `hooks-macos` job, aggregated by a job named `syntax-check`, with `concurrency` on PRs and a CI run for the sync commit through `workflow_call`.

## §4 — Tasks

### Phase A — waste

⟦ONE MESSAGE A1⟧ — baseline timings, one heredoc for every A1 edit, the gates chained behind it
- **A1 · geometry test.** `portalGeometry.mjs` honours `PORTAL_GEOMETRY_FIXTURES`; case 5 spawns against an empty temp directory. **Verify:** under 3 s, 5 cases. **Falsifier:** the empty-directory branch returns before Chrome starts, so a regression that launches a browser shows up as time.
- **A2 · mcp-layer probe.** `MCPCHECK_PROBE=0` in `prun()`. **Verify:** under 5 s, same PASS count. **Falsifier:** the probe's own cases still use `MCPCHECK_PROBE_CMD` stubs and still pass.
- **A3 · docs-audit self-test.** `proves()` and `provesSilent()` pass `--only <checkId>`; one spawn yields both the reported ids and the crash scan; the archive cases pass `--only archive-conservation`; the baseline stays a full audit. **Verify:** the same pass count as the pre-edit run, lower wall time. **Falsifier:** the suite's own break-it half — every check must still go red on its broken fixture.
- **A4 · timestamp-check clock.** The hook honours `TS_NOW_EPOCH`; the test pins it once and derives every stamp from it. **Verify:** three runs in a row pass. **Falsifier:** pinned to 23:59:30 local and to both DST boundaries, it still passes.
- **A5 · sleeps.** The records-close-check and stale-reference-sweep tests backdate instead of `sleep 1`. **Verify:** both pass. **Falsifier:** a copy with the backdating removed fails, which proves the ordering is what the tests depend on.

⟦ONE MESSAGE A2⟧ — the build
- **A6 · a deterministic, idempotent portal build.** The bust becomes a content hash; `build()` writes an input-hash stamp and skips when unchanged; `PORTAL_BUILD_FORCE=1` forces. **Verify:** a second `build()` is under 100 ms with byte-identical outputs; an edited UI file rebuilds; the portal build, boot and harness tests pass.
- **A7 · REJECTED — a single-process `npm run check`.** Node's module-syntax detection (why `node --check` accepts `portal/ui`'s ESM `.js`) cannot be reproduced with `vm.Script`. A syntax gate that parses a different grammar is not worth 3.6 s.

### Phase B — browser walks

⟦ONE MESSAGE B1⟧ — both walks and their tests in one heredoc
- **B1 · wait for the target.** `click`, `clickText`, `hover` and `type` wait for their element and then act, or throw a stall that names the selector.
- **B2 · workers.** N browser contexts (`PORTAL_STATES_JOBS` / `PORTAL_GEOMETRY_JOBS`, default `min(4, max(1, floor(cpus / 2)))`); output buffered per state and printed in registry order; `--record` writes each registry once, after its states.
- **B3 · retire the `--ci` skip.** `PORTAL_TOUCHED`, `portalTouched`, `manifestChangedBeyondVersion`, `changedAgainstBase` and their cases go (§0). The retry, `isStall`, `stepPause` and their cases stay, asserted as survivors.

⟦ONE MESSAGE B2⟧ — verification, thinking pass first
- **Verify:** `portalStates --ci` three runs in a row with 0 FLAKED; a timing table at jobs 1, 2 and 4; one run under load with 0 FLAKED; `portalGeometry --all --check` at jobs 1 and 4 with identical per-realm lines.
- **Falsifier:** a temporary registry state clicking `.no-such-target` fails and names the selector.

### Phase C — the runner

⟦ONE MESSAGE C1⟧ — manifest, runner, tracer and self-test in one heredoc, `package.json` rewired
- `scripts/testManifest.mjs` lists today's commands in today's order, each with a `lane` (unit · docs · hooks · browser), a `weight`, and `declared` inputs for bash entries.
- `scripts/testRunner.mjs`: weighted pool · per-entry timeout with a process-group kill · buffered output · a failure block for EVERY failure · a summary of ran / passed / failed / cached plus the slowest 10 · `local/.test-cache/durations.json` · a `$GITHUB_STEP_SUMMARY` table on CI · `--lane`, `--exclude`, `--serial`, `--list`, `--jobs`.
- `package.json` `test` becomes `node scripts/testRunner.mjs`.
- `scripts/testRunner.test.mjs`, itself in the manifest, asserts: the manifest equals the pre-rebuild chain read from `git show 8c5e8a90:package.json` plus its own entry · every `*.test.*` file is referenced · two deliberately failing entries are BOTH reported with exit 1 · weights never exceed capacity.

⟦ONE MESSAGE C2⟧ — concurrency safety, measured rather than assumed
- Run the full manifest once under the tracer. No two entries may write the same repo path, and no entry may read a repo path another entry writes, apart from the build outputs made idempotent in A6. A conflict becomes an `exclusive` group in the manifest.
- **Verify:** `TEST_CACHE=0 npm test` exits 0; record its wall time.

### Phase D — local cache and CI shape

⟦ONE MESSAGE D1⟧ — the cache
- **Key:** env signature (node version, platform, arch) · `package-lock.json` · every traced input inside and outside the repo, minus temp directories and `node_modules` · directory listings · git refs when the entry ran `git` inside the repo · declared inputs. A path an entry WROTE is not its input. A top-level bash entry without `declared` is never cached. `CI=true` or `TEST_CACHE=0` means no cache.
- **Verify:** a cold run, then a warm run with every cacheable entry cached; an edited unit module reruns only its dependents; an edited doc reruns the docs entries and not the walks.
- **Falsifier:** alter a recorded input and that entry must rerun.

⟦ONE MESSAGE D2⟧ — CI
- **`ci.yml`:**
  - `tests`: the runner, excluding the browser lane and `docs:audit:test`
  - `browser`: the browser lane
  - `records`: `npm run docs:audit:test`, `npm run docs:audit`, emoji captures, site staleness, both `npm audit` steps
  - `changes`: computes `hooks`
  - `hooks-macos`: runs only when `hooks` is true
  - `syntax-check`: the aggregator; only `hooks-macos` may be `skipped`
  - Also: `concurrency` with `cancel-in-progress` for PRs, and a `workflow_call` input `ref`
- **`sync-v3-pre-release.yml`:** outputs `pushed`; a `test-synced` job calls `ci.yml` with `ref: v3-pre-release`.
- **Verify:** actionlint clean on every workflow · `ci-wiring` passes · each job's commands run locally with `CI=true`.
- **Unverifiable before a push:** the GitHub run itself and the macOS runner's tools. Both are said in the report and filed.

### Phase E — records and close

⟦ONE MESSAGE E1⟧ — every doc in one heredoc
- `docs/reference/scripts-catalogue.md` · the `.claude/rules/scripts-and-migrations.md` pointer · `docs/reference/enforcement-hooks.md` for `TS_NOW_EPOCH` · CLAUDE.md where the test mechanics changed.
- `docs/db-deferred-list.md`: close the timestamp-check flake entries, the `portal:states` non-determinism entry and the P1 CI entry into `docs/archive/resolved-list.md` with their evidence, and file the unverified CI shape.
- Draft the CHANGELOG, DEVLOG and version text into `local/`.
- **Verify:** `npm run docs:audit` exit 0 and `npm test` exit 0.

⟦ONE MESSAGE E2⟧ — commits on the branch with conventional subjects and both trailers, the report file, the final message.

## §5 — Cost

60–90 turns, estimated once Step 0 had enumerated the unknowns. Each phase boundary re-reads §1.

## §6 — Outcome: what the build changed relative to this plan (written 2026-09-14 19:58 EDT)

Built on `ci/test-queue-rebuild` in the session that wrote the plan. Measured on the final tree: see the commit that carries this section and `local/ci-rebuild-report-2026-09-14.md`. **Deviations and additions, each forced by something a verification step found:**

| Plan said | What was built instead, and why |
|---|---|
| B1: wait for the target | Built. The first run then failed one state 3 of 3: Analytics' health tile clicked a label pin 37 had renamed, so the state had tested nothing for eleven days. Its registry entry was rewritten |
| B2: workers in separate contexts | Built, plus **every state starts from empty storage**. Spread across workers, Season's "identity · closed again" failed 3 of 3: it had passed serially only because the state before it left the panel closed in sessionStorage |
| (not planned) | **The walk reports a state whose `expect` matched before its steps ran** (report-only). Five found; two fixed (the account menu's hidden items; the Track crosshair), three filed |
| (not planned) | **Hover is a real pointer** (`page.hover`). The crosshair state had never once shown its crosshair: synthetic mouseover produces no pointermove |
| C2: measure write conflicts | Measured from the runner's own store: three entries write `.js` into the tree while `npm run check` reads every `.js` file. Answered with a **tree lock** (`lock: tree:write / tree:read`) instead of an exclusive group |
| D1: the cache key | Built, then widened in the end-of-session pass to **git, rg, jq and bash versions plus TZ and TS_TZ**: Xcode's command line tools vanished mid-session and 12 hook tests failed with no file changed, which a files-only key would have hidden behind cached passes |
| D2: `syntax-check` fails unless hooks-macos succeeded or was skipped | **hooks-macos is advisory** (a warning and a summary line) until it has been green on real macOS runs; it had never run on a macOS image, and a first-run mismatch must not block every hooks PR. Promotion is filed. `.claude/settings.json` also counts as a hook change |
| (not planned) | `self-check.test.sh` stopped piping into `grep -q` under pipefail (a SIGPIPE false FAIL under load); two missing-rg cases stopped hiding git; the runner self-test compares parallel against serial instead of against wall-clock constants, which would have flaked on a loaded CI runner; `handoffCheck.mjs` stopped describing `npm test` as an `&&` chain |

### After the merge into `origin/v3-pre-release` (written 2026-10-01 18:39 EDT)

Merged as `32e47d27`; four commits followed (`d302e7ca`, `64587acd`, `de969dc0`, `d59f2831`). **Each row is something the merge or the re-measurement found that this plan did not predict.**

| Plan or PR said | What the merged tree showed |
|---|---|
| §0: add Session 2's new test files to the manifest | Two tests (`armorySlotFill`, `manifestSelection`), both from #194's chain. Registered in the chain's position. Neither writes into the repo (three traced runs), so neither needs a lock |
| C1: the self-test proves the manifest equals the chain at `8c5e8a90` | That check alone would have stayed green with the two tests missing, so it now reads the chain at `ec4f581f` too, and a second check fails on a test-shaped package.json script that no entry runs. Both were shown to fail against a manifest with the two entries removed and an invented script |
| PR body: `npm test` 258.6 s → 85.1 s | **Held, once one test was fixed.** Like with like on one Mac the same afternoon: `v3-pre-release`'s own chain on its own tree **436.7 s**, the runner on this branch **93.6 s** (137 of 137 passed). Before the fix the runner took 138 s on a quiet Mac, because `ctx-index-refresh.test.sh` re-indexed `docs/` into the real context-mode store and went from 9 s to 47 s as pins batch 2 added about 180k lines of docs; it now runs in a scratch repo under a scratch HOME (1.3 s). An earlier version of this row said the figure did not reproduce and blamed the manifest order, the slot weights and system load. It compared the chain with the runner on the already-improved tree (220.6 s), which hid the gain, and it rested on a hooks-alone time of 14 s that was not reproduced (27.8 s after the fix). The manifest still lists the eight longest first, and the slot-weight finding is filed with what is measured |
| PR body: nothing changed → 0.6 s | Reproduced: 0.5 s with 137 of 137 cached. The first warm run after a full uncached run re-runs two entries once (`hotpatch.test.js`, `testRunner.test.mjs`), then settles |

## §7 — After pins batch 2 merges: re-size the jobs (added 2026-10-01 17:57 EDT, Session 3's close, at Harkirat's ask)

Harkirat, 2026-10-01 17:56 EDT: *"update into the plan for phase 3 if 6 is still the right call or if more are needed, due to the new repo size and new tests"*.

**Measured before the merge.** On PR #194 (pins batch 2, 584 commits into `v3-pre-release`) the single CI job ran **364 s**, `npm test` **289 s**. On #191 (2026-09-14) it was 288 s and 230 s, and this plan's baseline (§2) is 267 s and 215 s. Batch 2 adds two test files (`armorySlotFill`, `manifestSelection`), 32 changed test and fixture files for the portal walks, `app.css` +404 lines and about 180k lines of docs that `docs-audit` and the reflow checks read.

**The six jobs are split by kind of work, not by count,** and the `tests` and `browser` lanes already run in parallel inside their job. So the question is not how many jobs but whether the slowest one is still too long.

- [ ] **F1 — measure.** After merging `origin/v3-pre-release` (the brief's own first step) and registering batch 2's tests in `scripts/testManifest.mjs` with weights, run CI and record each job's wall time plus the runner's durations report for `tests` and `browser`. A timing taken before the new tests are registered measures an incomplete suite.
- [ ] **F2 — decide, with the numbers written into §6.** Six stays if the slowest job finishes within **180 s** of its own start (half the 364 s single job; *a default, Harkirat may set another*). If `tests` or `browser` is over, split **that lane** across two or more jobs by the manifest's weights (a matrix shard index on the runner's lane) rather than adding unrelated jobs; `records`, `changes` and `hooks-macos` are candidates only if they are the slowest.
- [ ] **F3 — verify the split.** Every manifest entry runs in exactly one shard (count both ways against the manifest), and the aggregate `syntax-check` waits for every shard.

**Before any GitHub run (2026-10-01 18:39 EDT), what the merged tree predicts.** F1, F2 and F3 stay open: a local proxy on a loaded Mac is not a runner. Each job's commands at CI's 4 slots, one job after another: tests **75 s**, browser walks **48 s**, records and site **28 s**, hooks **28 s**, timed after the hook-test fix (before it: 114, 64, 28 and 68). The last GitHub run, on the pre-merge tree, took tests 73 s, browser 70 s, records 38 s, hooks on macOS 37 s. #194's single job ran 26% longer than #191's (364 s against 288 s), and applying that to the pre-merge jobs gives about 92, 88 and 48 s. **Prediction: the slowest job finishes near 90 s, well inside 180 s, so six stays.** It is a prediction until the merged tree's run reports each job's wall time.

**Further cuts: measured, deliberately not taken (2026-10-01 19:55 EDT).** The next 15 s per CI run (the hooks suite and `portalStates`, together) is not worth the extra hassle for now, Harkirat's call. The ceilings, the realistic cuts, the repeatable commands and the conditions to revisit are filed in `docs/db-deferred-list.md` under Someday / tech-debt: `CI speed: the next 15 s per run, measured and deliberately not taken`.

## Audit log

Falsification pass, 2026-09-14 before this plan was written: `sequentialthinking`, five thoughts, on the question *"where is this plan WRONG?"* Every finding below changed the plan.

1. **Removing CI's duplicate self-test by loosening `ci-wiring` was the wrong direction.** That check is literal on purpose, so `docs:audit:test` runs once, in the `records` job, and the `tests` job excludes it.
2. **A concurrent pool would manufacture a new flake.** 15 tests call `build()`, which writes `portal/public`, so one could serve a half-written file while another rebuilds. A6 makes the build idempotent, and C2 measures write conflicts before trusting the pool.
3. **`bust = Date.now()` changes bytes on every build,** so no cache keyed on reading `harness.html` could ever hit. It becomes a content hash.
4. **Backdating only the commit in stale-reference-sweep changes what counts as touched.** The seeds would become newer than the branch point. The invariant is seed ≤ commit < change, so both are backdated, in that order.
5. **ESM imports never pass through `Module._resolveFilename`,** so the tracer uses `module.registerHooks`.
6. **`portalStates.mjs` already skips itself on CI,** which contradicts §0's "CI runs everything". It is retired, and the deletion asserts its survivors.
7. **Parallel tabs in one browser context share storage,** and each document load clears it, so each worker gets its own context.
8. **Under parallel walking, `--record` must still write each registry once.**
9. **Called through `workflow_call`, the concurrency group could collide with a push run,** so `inputs.ref` is part of the group.
10. **An aggregator that accepts any `skipped` would pass a skipped test job.** Only `hooks-macos` may be skipped.
11. **Branch protection keys on the check name,** so the aggregator's job id stays `syntax-check` with no `name:` override.
12. **The tracer cannot see what bash reads.** A top-level bash entry needs declared inputs or is never cached.
13. **`node_modules` is excluded from tracing,** so `package-lock.json` is an implicit input to every key.
14. **Git-reading tests depend on refs, not files.** The entry is marked and its key includes HEAD, both base refs and the tag list.
15. **A local cache can hide a time-of-day bomb.** Accepted and recorded: CI runs everything on every PR, so a cached pass never reaches a merge.
16. **The version, CHANGELOG and DEVLOG steps cannot finish without a PR number,** and the PR needs his approval. They are drafted, and the report names them as pending.
17. **A premise checked rather than assumed:** `docs-audit --only` was verified (exit 0, one result id) before A3 was allowed to depend on it.
