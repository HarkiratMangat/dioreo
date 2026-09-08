#!/usr/bin/env node
// scripts/silentContract.test.mjs — the final-message contract is ONE block carried by TWO files, and this test is the only thing binding them.
//
// Why (2026-09-08 12:05 EDT): the Silent output style (~/.claude/output-styles/silent.md, outside the repo) is the primary carrier; .claude/rules/silent-mode.md is the complete fallback for a session running with the style off (a Remote Control session can load the style but cannot toggle it). Two complete copies of one rule set drift by construction — the auto-fix-gate lesson: a target written twice — and before this the two said opposite things about the same message. Both files carry the block between <!-- silent-contract:start --> and <!-- silent-contract:end -->; it must be byte-identical.
//
// CI has no ~/.claude, so a missing style file there is a printed WARN, never a silent pass. Locally a missing style file FAILS: the style is supposed to be installed on this machine. SILENT_RULE_PATH / SILENT_STYLE_PATH override the paths so the test can be proven to fail on a fixture.

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const RULE = process.env.SILENT_RULE_PATH || join(here, "..", ".claude", "rules", "silent-mode.md");
const STYLE = process.env.SILENT_STYLE_PATH || join(homedir(), ".claude", "output-styles", "silent.md");
const START = "<!-- silent-contract:start -->";
const END = "<!-- silent-contract:end -->";
const MIN_BLOCK_BYTES = 1500; // a block this small is markers with nothing between them

let fails = 0;
const fail = (m) => { console.error(`FAIL silentContract: ${m}`); fails += 1; };

const block = (path) => {
  const s = readFileSync(path, "utf8");
  const a = s.indexOf(START);
  const b = s.indexOf(END);
  if (a < 0 || b < 0 || b < a) return null;
  return s.slice(a + START.length, b);
};

if (!existsSync(RULE)) fail(`${RULE} is missing`);
if (!existsSync(STYLE)) {
  if (process.env.CI) {
    console.log(`WARN silentContract: ${STYLE} absent (CI has no ~/.claude) — skipped, not passed`);
    process.exit(0);
  }
  fail(`${STYLE} is missing — the Silent output style is not installed on this machine`);
}

if (!fails) {
  const r = block(RULE);
  const s = block(STYLE);
  if (r == null) fail(`${RULE} has no silent-contract markers`);
  if (s == null) fail(`${STYLE} has no silent-contract markers`);
  if (r != null && s != null) {
    if (r !== s) {
      const ra = r.split("\n");
      const sa = s.split("\n");
      let i = 0;
      while (i < ra.length && i < sa.length && ra[i] === sa[i]) i += 1;
      fail(`the contract blocks differ, first at block line ${i + 1}:\n  rule : ${ra[i] ?? "<end>"}\n  style: ${sa[i] ?? "<end>"}\nEdit ONE and copy the block to the other — they are the same text on purpose.`);
    }
    if (Buffer.byteLength(r) < MIN_BLOCK_BYTES) fail(`contract block is ${Buffer.byteLength(r)}B — markers with nothing between them`);
  }
}

if (fails) process.exit(1);
console.log("ok silentContract: the final-message block is byte-identical in silent-mode.md and the Silent output style");
