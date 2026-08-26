#!/usr/bin/env node
/**
 * testCache.test.mjs — proves testCache.mjs actually skips on a real cache hit, always re-runs on any input or command change, and never caches a failing run.
 *
 * Run: node scripts/testCache.test.mjs (wired into `npm test`)
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), "testCache.mjs");

let passed = 0;
const failures = [];

function check(name, cond) {
  if (cond) {
    passed++;
  } else {
    failures.push(name);
    console.log(`  ✗ ${name}`);
  }
}

// A fixture repo root, deliberately separate from the real repo. TEST_CACHE_DIR must be passed explicitly — testCache.mjs derives its own REPO_ROOT (and therefore CACHE_DIR) from where the script FILE lives on disk via import.meta.url, never from `cwd`, so passing `cwd: root` alone does NOT isolate it — that was a real bug here, caught in code review 2026-08-21 10:47 EDT: this file's cwd override silently wrote real k1/k2/k3 cache entries into the actual repo's local/.test-cache/ every run. TEST_CACHE_DIR is the override the product code actually respects.
const root = mkdtempSync(join(tmpdir(), "testcache-fixture-"));
const cacheDir = join(root, "cache");
mkdirSync(cacheDir, { recursive: true });
const inputFile = join(root, "input.txt");
writeFileSync(inputFile, "v1");

const runCounterFile = join(root, "run-count.txt");
writeFileSync(runCounterFile, "0");
// A "command under test" that increments a counter each real invocation and always exits 0 — lets the test tell "cached, skipped" apart from "actually ran again" without parsing stdout.
const counterScript = join(root, "counter.mjs");
writeFileSync(
  counterScript,
  `import { readFileSync, writeFileSync } from "node:fs";
   const f = ${JSON.stringify(runCounterFile)};
   writeFileSync(f, String(Number(readFileSync(f, "utf8")) + 1));
   process.exit(0);`,
);
// A second script, byte-identical in EFFECT to counterScript but a different file/argv — proves the cache invalidates on a changed COMMAND even when no hashed input file changed.
const counterScript2 = join(root, "counter2.mjs");
writeFileSync(
  counterScript2,
  `import { readFileSync, writeFileSync } from "node:fs";
   const f = ${JSON.stringify(runCounterFile)};
   writeFileSync(f, String(Number(readFileSync(f, "utf8")) + 1));
   process.exit(0);`,
);

const runCount = () => Number(readFileSync(runCounterFile, "utf8"));

function runCache(key, commandArgs, extraEnv = {}) {
  try {
    execFileSync("node", [SCRIPT, key, inputFile, "--", ...commandArgs], {
      cwd: root,
      env: { ...process.env, CI: "", TEST_CACHE: "", TEST_CACHE_DIR: cacheDir, ...extraEnv },
      // 🔴 TEST_CACHE MUST BE NEUTRALISED HERE, EXACTLY AS CI IS. testCache.mjs:84 reads `TEST_CACHE === "0" || CI === "true"` — the two variables do the identical thing, and this file cleared one and not the other. So `TEST_CACHE=0 npm test`, which is the command testCache.mjs:95 PRINTS as the way to force a real re-run, failed 7 of this file's 15 assertions. The escape hatch the tool advertises broke the tool's own test, and only running the advertised command would ever have shown it. `extraEnv` spreads last, so case 5 can still set TEST_CACHE:"0" deliberately.
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return 0;
  } catch (err) {
    return err.status ?? 1;
  }
}

try {
  // 1. Cold run: no cache entry yet, must actually execute.
  check("cold run executes the real command", runCache("k1", ["node", counterScript]) === 0 && runCount() === 1);

  // 2. Warm run, unchanged input and command: must skip (counter stays at 1).
  check(
    "warm run with unchanged input+command skips re-execution",
    runCache("k1", ["node", counterScript]) === 0 && runCount() === 1,
  );

  // 3. Change the input file's bytes: must invalidate and re-run.
  writeFileSync(inputFile, "v2");
  check("changed input invalidates the cache and re-runs", runCache("k1", ["node", counterScript]) === 0 && runCount() === 2);

  // 4. Same input, DIFFERENT wrapped command (same key): must invalidate and re-run, since a cache keyed on files alone would serve a stale pass for a command that was never actually run — the exact defect caught in code review 2026-08-21 10:47 EDT.
  check(
    "changed command (same key, same input) invalidates the cache and re-runs",
    runCache("k1", ["node", counterScript2]) === 0 && runCount() === 3,
  );

  // 5. TEST_CACHE=0 forces a real run even with an unchanged, cached-pass input+command.
  check(
    "TEST_CACHE=0 forces a real run despite a valid cache",
    runCache("k1", ["node", counterScript2], { TEST_CACHE: "0" }) === 0 && runCount() === 4,
  );

  // 6. CI=true forces a real run the same way, so CI's own deliberate "insurance" re-invocation of a command stays a real re-execution rather than a silent cache replay.
  check(
    "CI=true forces a real run despite a valid cache",
    runCache("k1", ["node", counterScript2], { CI: "true" }) === 0 && runCount() === 5,
  );

  // 7. A failing command must never be cached: two consecutive runs with unchanged input each execute for real. This is the safety property this whole tool exists to guarantee — a cache that could replay a stale PASS after a real regression would be worse than none, so failures are the one result class this cache is never allowed to short-circuit.
  const failScript = join(root, "fail.mjs");
  writeFileSync(
    failScript,
    `import { readFileSync, writeFileSync } from "node:fs";
     const f = ${JSON.stringify(runCounterFile)};
     writeFileSync(f, String(Number(readFileSync(f, "utf8")) + 1));
     process.exit(1);`,
  );
  const before = runCount();
  check("a failing run reports the real (non-zero) exit code", runCache("k2", ["node", failScript]) === 1);
  check(
    "a failing run always re-executes (never cached)",
    runCache("k2", ["node", failScript]) === 1 && runCount() === before + 2,
  );

  // 8. A spawn failure (command that cannot even be launched) is reported clearly, not silently downgraded to a bare non-diagnostic exit 1 — caught in code review 2026-08-21 10:47 EDT.
  const rc = runCacheCapture("k4", inputFile, ["this-binary-does-not-exist-anywhere-xyz"]);
  check("a spawn failure exits non-zero", rc.status !== 0);
  check("a spawn failure prints a diagnostic message naming the command", /this-binary-does-not-exist-anywhere-xyz/.test(rc.output));

  function runCacheCapture(key, inputPath, commandArgs) {
    try {
      const out = execFileSync("node", [SCRIPT, key, inputPath, "--", ...commandArgs], {
        cwd: root,
        env: { ...process.env, CI: "", TEST_CACHE: "", TEST_CACHE_DIR: cacheDir },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { status: 0, output: out };
    } catch (err) {
      return { status: err.status ?? 1, output: `${err.stdout || ""}${err.stderr || ""}` };
    }
  }

  // 9. A directory input is expanded to its files — adding a new file inside it invalidates.
  const dir = join(root, "adir");
  mkdirSync(dir);
  writeFileSync(join(dir, "a.txt"), "a");
  writeFileSync(runCounterFile, "0");
  function runDirCacheRaw() {
    try {
      execFileSync("node", [SCRIPT, "k3", dir, "--", "node", counterScript], {
        cwd: root,
        env: { ...process.env, CI: "", TEST_CACHE: "", TEST_CACHE_DIR: cacheDir },
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return 0;
    } catch (err) {
      return err.status ?? 1;
    }
  }
  check("directory input: cold run executes", runDirCacheRaw() === 0 && runCount() === 1);
  check("directory input: warm run skips", runDirCacheRaw() === 0 && runCount() === 1);
  writeFileSync(join(dir, "b.txt"), "b");
  check("directory input: a new file inside it invalidates the cache", runDirCacheRaw() === 0 && runCount() === 2);

  // 10. A subdirectory inside an expanded directory input must throw loudly, not silently under-hash — caught in code review 2026-08-21 10:47 EDT.
  mkdirSync(join(dir, "nested"));
  const nestedResult = runCacheCapture("k5", dir, ["node", counterScript]);
  check("a nested subdirectory in a directory input fails loudly, not silently", nestedResult.status !== 0);
  check("the nested-subdirectory error names the offending path", /subdirectory/.test(nestedResult.output) && /nested/.test(nestedResult.output));
} finally {
  rmSync(root, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failures.length} failed${failures.length ? ` (${failures.join(", ")})` : ""}`);
process.exit(failures.length ? 1 : 0);
