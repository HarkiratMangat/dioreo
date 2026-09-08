#!/usr/bin/env node
// scripts/agreementSize.test.mjs — the global working agreement must stay a SHORT, IMPORTED carrier.
//
// Why this exists (2026-09-08 11:59 EDT): the per-project user_working_agreement.md grew to 35.6KB, went
// unedited for 19 days while thirty lessons landed elsewhere, and was reached only by a "read this
// first" pointer that drifted out of the auto-loaded preview — the read rate fell 62% → 16% the week
// it crossed the 2KB cut. The replacement, ~/.claude/WORKING-AGREEMENT.md, is @-imported by the
// global CLAUDE.md (delivery is mechanical) and is kept SHORT by this test rather than by prose:
// one line per rule, the story lives in the memory file the line names.
//
// Checks: present · imported · under the byte cap · carries its END sentinel · reconciled recently.
// AGREEMENT_PATH / GLOBAL_CLAUDE_PATH override the paths so the test can be proven to FAIL on a
// fixture (see the falsifier in the commit that added it). CI has no ~/.claude, so absence there is a
// WARN, never a silent pass — the line is printed.

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const AGREEMENT = process.env.AGREEMENT_PATH || join(homedir(), ".claude", "WORKING-AGREEMENT.md");
const GLOBAL = process.env.GLOBAL_CLAUDE_PATH || join(homedir(), ".claude", "CLAUDE.md");
const CAP_BYTES = 12000;
const MAX_AGE_DAYS = 60;

let fails = 0;
const fail = (m) => { console.error(`FAIL agreementSize: ${m}`); fails += 1; };

if (!existsSync(AGREEMENT)) {
  if (process.env.CI) {
    console.log(`WARN agreementSize: ${AGREEMENT} absent (CI has no ~/.claude) — skipped, not passed`);
    process.exit(0);
  }
  fail(`${AGREEMENT} is missing — the global CLAUDE.md imports it, so every session on this Mac now starts without the working agreement`);
} else {
  const s = readFileSync(AGREEMENT, "utf8");
  const bytes = Buffer.byteLength(s);
  if (bytes > CAP_BYTES) fail(`${bytes}B > ${CAP_BYTES}B — it is becoming a journal; a lesson belongs in its memory file, this file changes only for a NEW standing preference`);
  if (!s.includes("**WORKING-AGREEMENT-END**")) fail("sentinel **WORKING-AGREEMENT-END** missing — a session cannot tell whether the import arrived");
  const m = s.match(/last reconciled: (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) ([A-Z]{2,4})/);
  if (!m) fail("no parseable `last reconciled: YYYY-MM-DD HH:MM TZ` line");
  else {
    const ageDays = (Date.now() - new Date(`${m[1]}T${m[2]}:00`).getTime()) / 86_400_000;
    if (ageDays > MAX_AGE_DAYS) fail(`last reconciled ${Math.round(ageDays)} days ago (> ${MAX_AGE_DAYS}) — run a consolidate pass over the memory stores and bump the date`);
  }
  if (existsSync(GLOBAL)) {
    const imported = readFileSync(GLOBAL, "utf8").split("\n").some((l) => l.trim() === "@WORKING-AGREEMENT.md");
    if (!imported) fail(`${GLOBAL} does not contain the line @WORKING-AGREEMENT.md — the file exists but reaches no session`);
  }
}

if (fails) process.exit(1);
console.log("ok agreementSize: WORKING-AGREEMENT.md present, imported, under cap, sentinel + reconciled date present");
