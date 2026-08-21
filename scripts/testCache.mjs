#!/usr/bin/env node
/**
 * testCache.mjs — skip a slow, deterministic check when nothing it reads has changed.
 *
 * WHY THIS EXISTS (2026-08-21 09:45 EDT)
 * ---------------------------------------
 * docs-audit.test.mjs and the hook self-test suite are each a PURE function of a small, known set of source files (the script under test + its own test file, or a directory of hook scripts). Re-running them after an unrelated edit, or a second time with no edit at all, pays their full cost — ~110s and ~53s respectively, measured 2026-08-21 09:45 EDT — for a result that cannot have changed. Ported from the gif-background-remover repo's scripts/harness/analysis_cache.py, which cut a 744s corpus re-score to 3s the same way.
 *
 * THE KEY IS WHAT MAKES IT SAFE, same as that cache: the hash covers the ACTUAL BYTES of every input path AND the exact command being wrapped, not a timestamp or a version string someone has to remember to bump. Any edit to any input file — including one that only touches a comment — invalidates the entry, and so does changing the wrapped command itself (e.g. repointing package.json's `docs:audit:test` at a different entry point without touching docs-audit.mjs's bytes) — a cache keyed on files alone would serve a stale pass for a command that was never actually run. A cache a real change could survive would serve the pre-change answer to the change's own gate, which is worse than no cache. (Caught in code review, 2026-08-21 10:45 EDT — the first version hashed files only.)
 *
 * A FAILING run is NEVER cached. Only a confirmed-clean result is ever replayed, so this can only ever save time on the "still clean" path — it can never mask a regression by serving a stale pass, and it never risks serving a stale FAIL after a real fix either, because failures always fall through to a real re-run.
 *
 * Cache lives under local/.test-cache/ (gitignored, session/machine-scoped on purpose — this is a local speed-up, not a shared or CI concern). CI never has this directory on a fresh checkout, so the FIRST invocation in a job always runs for real — but a SECOND invocation of the same wrapped command later in the same job (this repo's CI deliberately keeps one, to prove the audit self-test is invoked by name) would now hit that first invocation's cache entry. Since these commands are proven-deterministic pure functions of their own bytes, a cached replay is exactly as trustworthy as a real re-run — but to preserve CI's literal "runs a second time" intent rather than silently redefining it, `CI=true` (set by GitHub Actions and most other CI systems) is treated as an automatic no-cache, same as TEST_CACHE=0.
 *
 * Usage: node scripts/testCache.mjs <key> <input-path> [<input-path> ...] -- <command> [args...]
 *   A directory input is expanded to every regular file directly inside it (non-recursive by design — every consumer here is a flat directory of scripts). This is an enforced precondition, not just a comment: a nested subdirectory inside an expanded directory input throws loudly rather than silently hashing fewer files than the cache key claims to cover.
 * Flags: env TEST_CACHE=0 forces a real run and still updates the cache. env TEST_CACHE_DIR overrides where cache entries are written/read (used by testCache.test.mjs to stay hermetic from the real local/.test-cache/ — REPO_ROOT is derived from this script's own file location, not from cwd, so a caller cannot isolate the cache just by passing a different `cwd`).
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_DIR = process.env.TEST_CACHE_DIR
  ? resolve(process.env.TEST_CACHE_DIR)
  : join(REPO_ROOT, "local", ".test-cache");

function expandInputs(paths) {
  const files = [];
  for (const p of paths) {
    const abs = resolve(REPO_ROOT, p);
    if (!existsSync(abs)) throw new Error(`testCache input does not exist: ${p}`);
    const st = statSync(abs);
    if (st.isDirectory()) {
      for (const name of readdirSync(abs)) {
        const child = join(abs, name);
        const childSt = statSync(child);
        if (childSt.isDirectory()) {
          throw new Error(
            `testCache: ${p} contains a subdirectory (${name}/) — directory inputs are expanded ` +
              `non-recursively, so this file's contents would silently never invalidate the cache. ` +
              `Pass the subdirectory explicitly as its own input path, or make expandInputs recursive.`,
          );
        }
        if (childSt.isFile()) files.push(child);
      }
    } else {
      files.push(abs);
    }
  }
  return files;
}

function hashInputs(files, command) {
  const hash = createHash("sha256");
  for (const abs of files.slice().sort()) {
    hash.update(relative(REPO_ROOT, abs));
    hash.update("\0");
    hash.update(readFileSync(abs));
    hash.update("\0");
  }
  hash.update("\0COMMAND\0");
  hash.update(command.join("\0"));
  return hash.digest("hex");
}

function main() {
  const args = process.argv.slice(2);
  const sepIdx = args.indexOf("--");
  if (sepIdx === -1 || sepIdx === 0) {
    console.error("usage: testCache.mjs <key> <input-path>... -- <command> [args...]");
    process.exit(2);
  }
  const [key, ...inputPaths] = args.slice(0, sepIdx);
  const command = args.slice(sepIdx + 1);
  if (command.length === 0) {
    console.error("testCache.mjs: no command given after --");
    process.exit(2);
  }

  const noCache = process.env.TEST_CACHE === "0" || process.env.CI === "true";
  const files = expandInputs(inputPaths);
  const currentHash = hashInputs(files, command);
  const cacheFile = join(CACHE_DIR, `${key}.json`);

  if (!noCache && existsSync(cacheFile)) {
    try {
      const entry = JSON.parse(readFileSync(cacheFile, "utf8"));
      if (entry.hash === currentHash && entry.exitCode === 0) {
        const age = Math.round((Date.now() - entry.timestamp) / 1000);
        console.log(`✓ ${key} — cached pass, unchanged since ${age}s ago (${files.length} input files). Skipping.`);
        console.log(`  Run with TEST_CACHE=0 to force a real re-run.`);
        process.exit(0);
      }
    } catch {
      // Corrupt or unreadable cache entry — fall through to a real run.
    }
  }

  const result = spawnSync(command[0], command.slice(1), { cwd: REPO_ROOT, stdio: "inherit" });
  if (result.error) {
    console.error(`testCache.mjs: failed to run '${command.join(" ")}': ${result.error.message}`);
    process.exit(1);
  }
  const exitCode = result.status ?? 1;

  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify({ hash: currentHash, exitCode, timestamp: Date.now() }, null, 2));

  process.exit(exitCode);
}

main();
