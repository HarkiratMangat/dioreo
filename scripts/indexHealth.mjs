#!/usr/bin/env node
/**
 * indexHealth.mjs — is the search index a session is about to trust the one that is actually on disk, and is anything positioned to delete it?
 *
 * WHY IT EXISTS (2026-09-13 13:12 EDT). context-mode's store for this repo was deleted underneath its own server twice in three days, on 2026-09-11 at 10:27 EDT and on 2026-09-13 at 10:09 EDT. Nothing errored. The server kept its descriptor on the deleted file, so `ctx_search` answered from a snapshot that could never change, every index through that server wrote into the dead file, and the next CLI refresh recreated an empty store on disk holding a third of the sources. It surfaced only because a plan written that morning never came back from a search — and a search tool that silently misses sends every session back to `rg`.
 *
 * THE CAUSE, reproduced against context-mode 1.0.169's real server: `getStore()` opens the store and then runs `cleanupStaleContentDBs`, which deletes every `.db` in the shared content directory whose `-wal` is non-empty and more than an hour old. A killed server leaves exactly that WAL, so the next session's first `ctx_*` call deletes the store it just opened; an hour-idle session elsewhere loses its store the same way. The prevention is `~/.claude/hooks/context-mode-wal-guard.mjs`, a global PreToolUse hook that empties such WALs before any context-mode tool runs. This script is the instrument that says whether that prevention is in place and whether it held.
 *
 * COMMANDS
 *   (none)   report both indexes: the file on disk, which server holds which inode, stale non-empty WALs, whether the guard is registered, the store's corpora. Exit 4 if a server reads a deleted file, 5 if the guard is not registered, 0 otherwise.
 *   orphans  one line per server holding a deleted store (exit 4) — the refresh hook prints these into the session
 *   labels   the given source labels the store is missing (exit 3) — a stamp that says "fresh" over a store that lost its rows is a receipt for a store that no longer exists. `--max-age-days N` also counts a corpus as missing when its newest row is older than N days: the server's first store call in a session runs `cleanupStaleSources(14)`, which deletes every source indexed more than 14 days ago, so a corpus nobody edits (the vendor docs, TOOLING.md) is refreshed before that prune rather than refilled after it
 *   path     the store path
 *
 * `--root <dir>` names the project (default: the main worktree of this repo). `--db <path>` overrides the context-mode store path, for tests.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, statSync, readFileSync, readdirSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";

export const SWEEP_AGE_MS = 60 * 60 * 1000;
export const GUARD_FILE = "context-mode-wal-guard.mjs";

// The hash context-mode uses (`hashProjectDirCanonical`, src/session/db.ts): trailing slashes stripped, case folded on the two case-insensitive platforms, sha256, first 16 hex characters. Get this wrong and every check below inspects a file nobody uses and calls it healthy, so the test pins it against this repo's real store name.
export function contentStorePath(root, { home = homedir(), platform = process.platform } = {}) {
  const normalized = root.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
  const folded = platform === "darwin" || platform === "win32" ? normalized.toLowerCase() : normalized;
  return join(home, ".claude", "context-mode", "content", `${createHash("sha256").update(folded).digest("hex").slice(0, 16)}.db`);
}

export function codebaseMemoryPath(root, { home = homedir() } = {}) {
  return join(home, ".cache", "codebase-memory-mcp", `${root.replace(/^\/+/, "").replace(/[/ ]/g, "-")}.db`);
}

async function openReadOnly(path) {
  const { DatabaseSync } = await import("node:sqlite");
  return new DatabaseSync(path, { readOnly: true });
}

// Prefix match on purpose: a directory source is labelled `<source>:<file path>`, a single file `<source>` alone. `%` and `_` are escaped so `project:a_` cannot match `project:ab:…`.
export async function missingLabels(db, labels, { maxAgeDays = null } = {}) {
  if (!existsSync(db)) return [...labels];
  const conn = await openReadOnly(db);
  try {
    const stmt = conn.prepare("SELECT count(*) AS c FROM sources WHERE (label = ? OR label LIKE ? ESCAPE '\\') AND (? IS NULL OR datetime(indexed_at) >= datetime('now', '-' || ? || ' days'))");
    const age = maxAgeDays === null ? null : String(Number(maxAgeDays));
    return labels.filter((l) => stmt.get(l, `${l.replace(/[\\%_]/g, (m) => `\\${m}`)}:%`, age, age).c === 0);
  } catch (err) {
    if (/no such table/.test(String(err?.message))) return [...labels];
    throw err;
  } finally {
    conn.close();
  }
}

// The exact condition context-mode's sweep deletes on. Anything listed here is one new session away from being deleted, unless the guard runs first.
export function sweepTargets(dir, { now = Date.now(), ageMs = SWEEP_AGE_MS } = {}) {
  let files;
  try { files = readdirSync(dir).filter((f) => f.endsWith(".db")); } catch { return []; }
  return files.flatMap((f) => {
    try {
      const wal = statSync(join(dir, `${f}-wal`));
      return wal.size > 0 && now - wal.mtimeMs > ageMs ? [{ db: join(dir, f), walBytes: wal.size, ageMin: Math.round((now - wal.mtimeMs) / 60000) }] : [];
    } catch {
      return [];
    }
  });
}

export function guardRegistered(settingsPath = join(homedir(), ".claude", "settings.json")) {
  try {
    const pre = JSON.parse(readFileSync(settingsPath, "utf8")).hooks?.PreToolUse ?? [];
    return pre.some((e) => new RegExp(`^(?:${e.matcher ?? ""})$`).test("mcp__plugin_context-mode_context-mode__ctx_search") && (e.hooks ?? []).some((h) => String(h.command).includes(GUARD_FILE)));
  } catch {
    return false;
  }
}

function pidsMatching(pattern) {
  try {
    return execFileSync("pgrep", ["-f", pattern], { encoding: "utf8" }).split("\n").filter(Boolean).map(Number).filter((p) => p !== process.pid);
  } catch {
    return [];
  }
}

// `lsof -F in` prints `i<inode>` then `n<name>` per open file. A deleted file keeps its original name in that listing, which is what lets a held inode be compared with the one now at the path. lsof prints the RESOLVED directory — a macOS temp path arrives as `/private/var/…` — so the name is matched both as given and resolved; matching only the given form made the test's own orphan invisible.
export function inodesHeld(pid, path) {
  try {
    const out = execFileSync("lsof", ["-nP", "-p", String(pid), "-Fin"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const found = new Set();
    const names = new Set([path]);
    try { names.add(join(realpathSync(dirname(path)), basename(path))); } catch { /* directory gone */ }
    let inode = null;
    for (const line of out.split("\n")) {
      if (line[0] === "i") inode = Number(line.slice(1));
      else if (line[0] === "n" && names.has(line.slice(1)) && inode !== null) found.add(inode);
    }
    return [...found];
  } catch {
    return [];
  }
}

export const SERVERS = [
  { name: "context-mode", pattern: "context-mode/context-mode/.*/start\\.mjs", store: (root, db) => db ?? contentStorePath(root) },
  { name: "codebase-memory", pattern: "codebase-memory-mcp$", store: (root) => codebaseMemoryPath(root) },
];

export function orphans({ store, pattern, pids = pidsMatching(pattern) }) {
  const disk = existsSync(store) ? statSync(store).ino : null;
  return pids.flatMap((pid) => inodesHeld(pid, store).filter((held) => held !== disk).map((held) => ({ pid, held, disk })));
}

function mainWorktreeRoot() {
  const abs = resolve(process.cwd(), execFileSync("git", ["rev-parse", "--git-common-dir"], { encoding: "utf8" }).trim());
  return basename(abs) === ".git" ? dirname(abs) : abs;
}

async function main(argv) {
  const flag = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv.splice(i, 2)[1] : undefined; };
  const root = flag("--root") ?? mainWorktreeRoot();
  const dbOverride = flag("--db");
  const maxAgeDays = flag("--max-age-days") ?? null;
  const [cmd, ...rest] = argv;
  const store = dbOverride ?? contentStorePath(root);

  if (cmd === "path") { console.log(store); return 0; }
  if (cmd === "labels") {
    const missing = await missingLabels(store, rest, { maxAgeDays });
    if (missing.length) console.log(missing.join("\n"));
    return missing.length ? 3 : 0;
  }
  if (cmd === "orphans") {
    const lines = SERVERS.flatMap((s) => orphans({ store: s.store(root, dbOverride), pattern: s.pattern }).map(({ pid, held, disk }) =>
      `🔴 ${s.name} server pid ${pid} is reading a DELETED store (inode ${held}); ${s.store(root, dbOverride)} is inode ${disk ?? "absent"}. Its searches miss everything written since, and anything indexed through it is lost. Reconnect ${s.name} from /mcp (or start a new session); meanwhile read with read_smart and search with rg.`));
    if (lines.length) console.log(lines.join("\n"));
    return lines.length ? 4 : 0;
  }
  if (cmd !== undefined) { console.error(`indexHealth: unknown command ${cmd}`); return 64; }

  let orphaned = 0;
  for (const s of SERVERS) {
    const path = s.store(root, dbOverride);
    const disk = existsSync(path) ? statSync(path).ino : null;
    const pids = pidsMatching(s.pattern);
    const held = pids.flatMap((pid) => inodesHeld(pid, path).map((ino) => ({ pid, ino })));
    const lost = held.filter((h) => h.ino !== disk);
    orphaned += lost.length;
    const state = !pids.length ? "no server running" : !held.length ? "server not holding it right now" : lost.length ? `🔴 server pid ${lost[0].pid} reads DELETED inode ${lost[0].ino}` : "server reads this file";
    console.log(`${s.name.padEnd(16)} ${disk === null ? "absent" : `inode ${disk}`} · ${state} · ${path}`);
  }
  const targets = sweepTargets(dirname(store));
  console.log(targets.length ? `🔴 sweep targets (non-empty WAL, idle over an hour): ${targets.map((t) => `${basename(t.db)} ${t.walBytes}B ${t.ageMin}min`).join(" · ")}` : "sweep targets    none");
  const registered = guardRegistered();
  console.log(`wal guard        ${registered ? "registered" : `🔴 NOT registered in ~/.claude/settings.json — context-mode's startup sweep can delete a live store`}`);
  if (existsSync(store)) {
    const conn = await openReadOnly(store);
    try {
      const rows = conn.prepare("SELECT substr(label, 1, instr(label || ':', ':') - 1) || ':' || substr(substr(label, instr(label, ':') + 1), 1, instr(substr(label, instr(label, ':') + 1) || ':', ':') - 1) AS p, count(*) AS n FROM sources GROUP BY p ORDER BY n DESC").all();
      console.log(`corpora          ${rows.map((r) => `${r.p} ${r.n}`).join(" · ") || "none"}`);
    } finally {
      conn.close();
    }
  }
  return orphaned ? 4 : registered ? 0 : 5;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).then((code) => process.exit(code), (err) => { console.error(`indexHealth: ${err?.message ?? err}`); process.exit(1); });
}
