#!/usr/bin/env node
/**
 * docs-audit-test-parallel.mjs — run docs-audit.test.mjs's 71 checks across N shards, concurrently, and aggregate the result.
 *
 * WHY THIS EXISTS (2026-08-21 11:20 EDT, hardened 2026-08-21 11:55 EDT after code review)
 * ------------------------------------------------------------------------------------------
 * Instrumented timing showed docs-audit.test.mjs's checks are near-uniform (median 3.1s, 1.5-5.2s range, no long pole) — a shape that parallelizes almost linearly, unlike the hooks suite's 3-heavy/25-light skew. `node scripts/docs-audit.test.mjs` itself never changed shape or default behavior — DOCS_AUDIT_TEST_SHARD unset still runs every check in one process, exactly as before this file existed. This wrapper is purely additive: it spawns N copies of that same unmodified entry point with different shard assignments and combines their results.
 *
 * Each shard is a SEPARATE OS PROCESS, not a thread or an async task sharing state — deliberately, because docs-audit.test.mjs is the audit-of-record's own self-test, and process isolation means a bug in shard 3 cannot corrupt shard 5's `passed`/`failures` counters the way a shared-state concurrency bug could. The correctness of each individual check's LOGIC is completely untouched by this file; only the DECISION OF WHICH SUBSET a given process executes is new.
 *
 * AGGREGATION: every shard prints one `SHARD_RESULT <i> <N> <passed> <failed> <totalSlots>` line to stderr right before exiting. This wrapper takes the LAST line matching `^SHARD_RESULT ` in each shard's stderr — never the first match anywhere in the stream — to stay correct even if a future check body ever writes an incidental `console.error` earlier. It sums `passed` across shards, exits non-zero if ANY shard exited non-zero, and — the property code review found missing from the first version — asserts every shard reports the SAME `totalSlots` (proves they all agree on how many check-slots exist, catching a desynced `__mine()` call) AND that `passed+failed` summed across shards equals that shared total (proves every slot was actually executed exactly once, catching the case where a malformed shard assignment makes every shard silently skip everything while still reporting a clean pass). Neither assertion existed in the version reviewed; both were added specifically because "the shards structurally cannot disagree" was reasoning, not proof.
 *
 * A shard that hangs (git lock contention, an environment quirk) is killed after SHARD_TIMEOUT_MS and reported as a timeout, not left to wedge the whole run forever with no diagnostic.
 *
 * Usage: node scripts/docs-audit-test-parallel.mjs Env: DOCS_AUDIT_TEST_JOBS (default 8) — shard count, same knob shape as HOOK_TEST_JOBS.
 */

import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TARGET = join(HERE, "docs-audit.test.mjs");
const SHARD_RESULT_RE = /^SHARD_RESULT (\d+) (\d+) (\d+) (\d+) (\d+)$/;
const SHARD_TIMEOUT_MS = 180_000;

let jobs = Number(process.env.DOCS_AUDIT_TEST_JOBS || 8);
if (!Number.isInteger(jobs) || jobs < 1) jobs = 8;

function runShard(i, n) {
  return new Promise((resolveShard) => {
    const child = spawn("node", [TARGET], {
      cwd: resolve(HERE, ".."),
      env: { ...process.env, DOCS_AUDIT_TEST_SHARD: `${i}/${n}` },
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, SHARD_TIMEOUT_MS);
    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      stderr += d;
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      resolveShard({ i, code, signal, timedOut, stdout, stderr });
    });
  });
}

// Take the LAST line matching SHARD_RESULT, not the first match anywhere in the stream — a future check body that writes an incidental console.error must not be able to feed the aggregator a spurious earlier match.
function parseShardResult(stderr) {
  const lines = stderr.split("\n");
  for (let idx = lines.length - 1; idx >= 0; idx--) {
    const m = lines[idx].match(SHARD_RESULT_RE);
    if (m) return { i: Number(m[1]), n: Number(m[2]), passed: Number(m[3]), failed: Number(m[4]), totalSlots: Number(m[5]) };
  }
  return null;
}

async function main() {
  const results = await Promise.all(Array.from({ length: jobs }, (_, i) => runShard(i, jobs)));

  let totalPassed = 0;
  let totalFailed = 0;
  let anyFailed = false;
  const failedShards = [];
  const slotTotals = new Set();

  for (const r of results) {
    if (r.timedOut) {
      anyFailed = true;
      failedShards.push(r);
      console.error(`shard ${r.i}: killed after ${SHARD_TIMEOUT_MS}ms with no result — treating as a hard failure`);
      continue;
    }
    const parsed = parseShardResult(r.stderr);
    if (!parsed) {
      anyFailed = true;
      failedShards.push(r);
      const sig = r.signal ? ` (signal ${r.signal})` : "";
      console.error(`shard ${r.i}: no SHARD_RESULT line found — treating as a hard failure (exit ${r.code}${sig})`);
      continue;
    }
    totalPassed += parsed.passed;
    totalFailed += parsed.failed;
    slotTotals.add(parsed.totalSlots);
    if (r.code !== 0) {
      anyFailed = true;
      failedShards.push(r);
    }
  }

  // Cross-shard invariant: every shard iterates the identical static sequence of check-slots (proves/provesSilent/provesBaselineClean/the 3 bare blocks), so every shard's reported totalSlots must be IDENTICAL. A mismatch means the shards disagree about how many checks exist — a desynced __mine() call somewhere — and that is never safe to treat as a pass.
  if (slotTotals.size > 1) {
    anyFailed = true;
    console.error(`shards disagree on total check-slot count: ${[...slotTotals].join(", ")} — a __mine() call is desynced between processes.`);
  }
  const expectedTotal = slotTotals.size === 1 ? [...slotTotals][0] : null;
  // And: every slot must actually have been EXECUTED by exactly one shard. This is the assertion that catches a malformed DOCS_AUDIT_TEST_SHARD making every shard skip everything — coverage would still report green (registration is unconditional), but totalPassed+totalFailed would silently be far short of the real total without this check.
  if (expectedTotal !== null && totalPassed + totalFailed !== expectedTotal) {
    anyFailed = true;
    console.error(
      `executed checks (${totalPassed} passed + ${totalFailed} failed = ${totalPassed + totalFailed}) ` +
        `!= expected total check-slots (${expectedTotal}) — some checks silently never ran in any shard.`,
    );
  }

  if (anyFailed) {
    for (const r of failedShards) {
      console.log(`\n--- shard ${r.i} (exit ${r.code}${r.signal ? `, signal ${r.signal}` : ""}${r.timedOut ? ", TIMED OUT" : ""}) ---`);
      console.log(r.stdout);
      if (r.stderr) console.error(r.stderr);
    }
    console.log(`\n❌ ${totalFailed} self-test failure(s) across ${jobs} shards (${totalPassed} passed).\n`);
    process.exit(1);
  }

  // On a clean run, print every shard's own itemized "✓ checkid ..." lines (in shard order) — not just a synthetic summary — so a CI log still lets a human scan which checks actually ran, the same way a direct unsharded run always has. Only the coverage line is deduped, since it prints identically (by design) in every shard.
  let printedCoverage = false;
  for (const r of results) {
    for (const line of r.stdout.split("\n")) {
      if (!line.trim()) continue;
      if (line.includes("✓ coverage")) {
        if (printedCoverage) continue;
        printedCoverage = true;
      }
      console.log(line);
    }
  }
  console.log(`\n✅ all ${totalPassed} checks proven capable of failing (${jobs} shards, ${expectedTotal} check-slots).\n`);
}

main();
