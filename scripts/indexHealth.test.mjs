// Proofs for scripts/indexHealth.mjs. Every case can fail; the orphan case holds a real deleted file open in a child process rather than faking lsof output.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, utimesSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { contentStorePath, codebaseMemoryPath, missingLabels, sweepTargets, guardRegistered, orphans, inodesHeld } from "./indexHealth.mjs";

let n = 0;
const test = async (name, fn) => { await fn(); n++; console.log(`  PASS  ${name}`); };
const dir = mkdtempSync(join(tmpdir(), "index-health-"));
const sqlite = async () => (await import("node:sqlite")).DatabaseSync;

try {
  await test("the store path is the hash context-mode itself uses (this repo's real store is aaac23ea4901ab62.db)", () => {
    assert.equal(contentStorePath("/Applications/Claude Code/Diors-Builds", { home: "/h", platform: "darwin" }), "/h/.claude/context-mode/content/aaac23ea4901ab62.db");
    assert.equal(contentStorePath("/Applications/Claude Code/Diors-Builds/", { home: "/h", platform: "darwin" }), "/h/.claude/context-mode/content/aaac23ea4901ab62.db");
    assert.equal(contentStorePath("/Applications/Claude Code/Diors-Builds", { home: "/h", platform: "linux" }), "/h/.claude/context-mode/content/513884790467f523.db");
  });

  await test("the codebase-memory path is its slug", () => {
    assert.equal(codebaseMemoryPath("/Applications/Claude Code/Diors-Builds", { home: "/h" }), "/h/.cache/codebase-memory-mcp/Applications-Claude-Code-Diors-Builds.db");
  });

  await test("labels: a directory prefix and a single-file label both count; a wildcard in a label is literal; a missing store lacks everything", async () => {
    const DatabaseSync = await sqlite();
    const db = join(dir, "labels.db");
    const conn = new DatabaseSync(db);
    conn.exec("CREATE TABLE sources(id INTEGER PRIMARY KEY, label TEXT, indexed_at TEXT NOT NULL DEFAULT (datetime('now')))");
    for (const l of ["project:a:/x/one.md", "project:b", "project:ab:/y"]) conn.prepare("INSERT INTO sources(label) VALUES (?)").run(l);
    conn.prepare("INSERT INTO sources(label, indexed_at) VALUES (?, datetime('now', '-20 days'))").run("vendor:old:/v/a.md");
    conn.close();
    assert.deepEqual(await missingLabels(db, ["project:a", "project:b", "project:c"]), ["project:c"]);
    assert.deepEqual(await missingLabels(db, ["project:a_"]), ["project:a_"]);
    assert.deepEqual(await missingLabels(join(dir, "absent.db"), ["project:a"]), ["project:a"]);
    assert.deepEqual(await missingLabels(db, ["vendor:old"]), [], "present regardless of age without the option");
    assert.deepEqual(await missingLabels(db, ["vendor:old", "project:a"], { maxAgeDays: 12 }), ["vendor:old"], "a corpus older than the prune horizon counts as missing, a fresh one does not");
  });

  await test("sweep targets are exactly the sweep's condition: non-empty WAL AND idle over an hour", () => {
    const now = Date.now();
    const mk = (name, bytes, ageMin) => {
      writeFileSync(join(dir, name), "");
      writeFileSync(join(dir, `${name}-wal`), "w".repeat(bytes));
      const t = new Date(now - ageMin * 60000);
      utimesSync(join(dir, `${name}-wal`), t, t);
    };
    mk("old-full.db", 10, 90);
    mk("old-empty.db", 0, 90);
    mk("new-full.db", 10, 5);
    assert.deepEqual(sweepTargets(dir, { now }).map((t) => t.db.split("/").pop()), ["old-full.db"]);
  });

  await test("guard registration is read from a settings file, by matcher and command", () => {
    const yes = join(dir, "yes.json");
    const no = join(dir, "no.json");
    writeFileSync(yes, JSON.stringify({ hooks: { PreToolUse: [{ matcher: "mcp__plugin_context-mode_context-mode__.*", hooks: [{ command: "node ~/.claude/hooks/context-mode-wal-guard.mjs" }] }] } }));
    writeFileSync(no, JSON.stringify({ hooks: { PreToolUse: [{ matcher: "Bash", hooks: [{ command: "node ~/.claude/hooks/context-mode-wal-guard.mjs" }] }] } }));
    assert.equal(guardRegistered(yes), true);
    assert.equal(guardRegistered(no), false);
    assert.equal(guardRegistered(join(dir, "missing.json")), false);
  });

  let lsof = true;
  try { execFileSync("lsof", ["-v"], { stdio: "ignore" }); } catch (e) { lsof = e.status !== undefined; }
  if (!lsof) {
    console.log("  NOTE  no lsof here: the orphan case needs it and cannot run");
  } else {
    await test("orphans: a process holding a deleted store is named, with both inodes; the same file on disk is not", async () => {
      const db = join(dir, "held.db");
      writeFileSync(db, "bytes");
      const child = spawn(process.execPath, ["-e", `require('fs').openSync(${JSON.stringify(db)}, 'r'); setInterval(() => {}, 1000)`], { stdio: "ignore" });
      try {
        await new Promise((r) => setTimeout(r, 400));
        assert.equal(inodesHeld(child.pid, db).length, 1, "lsof must see the open file, or the orphan assertion below proves nothing");
        assert.deepEqual(orphans({ store: db, pids: [child.pid] }), [], "the same inode is not an orphan");
        unlinkSync(db);
        writeFileSync(db, "a new file at the old path");
        const found = orphans({ store: db, pids: [child.pid] });
        assert.equal(found.length, 1);
        assert.equal(found[0].pid, child.pid);
        assert.notEqual(found[0].held, found[0].disk);
      } finally {
        child.kill();
      }
    });
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`indexHealth.test.mjs: ${n} passed`);
