#!/usr/bin/env node
// scripts/summaryShape.mjs — a REPORT, never a gate: are the final messages of each run meeting the
// Silent contract (.claude/rules/silent-mode.md / the Silent output style)?
//
// Why (2026-09-08 12:05 EDT): every carrier of the summary rules is prose, and prose rules here have
// a measured record of not moving behaviour. This is the falsifier for the contract rewrite — read the
// week-over-week DELTA, not a single row. A Stop gate on the same shape is parked by Harkirat's
// standing choice (no friction on his loop) until this report says the contract did not move anything.
//
//   node scripts/summaryShape.mjs [--days 42] [--project <slug>] [--json]
//
// Reads ~/.claude/projects/<slug>/*.jsonl (local session transcripts). A RUN is one user prompt through
// the assistant messages that follow it; the FINAL message is the last assistant message of the run.
// Sessions with fewer than 3 prompts are skipped (dispatch / background sessions). Weeks start Monday
// (UTC) from the session's first timestamp, not the file's mtime — mtimes were bulk-touched once.
//
// What it cannot see, stated so nobody assumes it can: whether a long message was WARRANTED, whether
// a short one was USEFUL, and any run whose final turn is a popup (no text). It counts shape only.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const DAYS = Number(opt("--days", "42"));
const SLUG = opt("--project", "-Applications-Claude-Code-Diors-Builds");
const JSON_OUT = args.includes("--json");
const DIR = join(homedir(), ".claude", "projects", SLUG);
const CUTOFF = Date.now() - DAYS * 86_400_000;
const BUDGET_CHARS = 1800; // the contract's "one screen"
const LONG_PARA = 400;
// His own words for the failure, from the transcripts. Matched against USER messages only.
const COMPLAINT = /too much prose|walls? of text|too mechanical|walls? of uselessness|silent\.md summary|summary convention|stop (narrat|with the narration)|i hate (long )?prose/i;

const weeks = new Map();
const weekOf = (iso) => {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const bucket = (k) => {
  if (!weeks.has(k)) weeks.set(k, { sessions: 0, styled: 0, runs: 0, lens: [], over: 0, multiTable: 0, longPara: 0, complaints: 0 });
  return weeks.get(k);
};
const textOf = (c) => (typeof c === "string" ? c : Array.isArray(c) ? c.filter((x) => x && x.type === "text").map((x) => x.text || "").join("\n") : "");

let files;
try { files = readdirSync(DIR).filter((f) => f.endsWith(".jsonl")); } catch { console.error(`summaryShape: no transcripts at ${DIR}`); process.exit(2); }

for (const f of files) {
  const p = join(DIR, f);
  if (statSync(p).mtimeMs < CUTOFF) continue;
  let first = null;
  let styled = false;
  const runs = [];
  let cur = null;
  const seen = new Map();
  for (const line of readFileSync(p, "utf8").split("\n")) {
    if (!line) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (!first && o.timestamp) first = o.timestamp;
    if (!styled && (line.includes("Silent output style is active") || line.includes("Output Style: Silent"))) styled = true;
    const m = o.message || {};
    const c = m.content;
    if (o.type === "user") {
      const txt = textOf(c);
      if (txt.trim() && !txt.startsWith("<")) {
        cur = { msgs: [], complaint: COMPLAINT.test(txt) && txt.length < 1500 };
        runs.push(cur);
      }
      continue;
    }
    if (o.type !== "assistant" || !Array.isArray(c) || !cur) continue;
    const id = m.id || o.uuid;
    let rec = seen.get(id);
    if (!rec) { rec = { tools: 0, text: "" }; seen.set(id, rec); cur.msgs.push(rec); }
    for (const x of c) {
      if (!x) continue;
      if (x.type === "tool_use") rec.tools += 1;
      if (x.type === "text") rec.text += x.text || "";
    }
  }
  if (!first || runs.length < 3) continue;
  const w = bucket(weekOf(first));
  w.sessions += 1;
  if (styled) w.styled += 1;
  for (const r of runs) {
    if (!r.msgs.length) continue;
    w.runs += 1;
    if (r.complaint) w.complaints += 1;
    const final = r.msgs[r.msgs.length - 1].text;
    w.lens.push(final.length);
    if (final.length > BUDGET_CHARS) w.over += 1;
    const lines = final.split("\n");
    const tables = lines.reduce((n, l, i) => n + (l.startsWith("|") && !(lines[i - 1] || "").startsWith("|") ? 1 : 0), 0);
    if (tables > 1) w.multiTable += 1;
    const paras = final.split("\n\n").filter((q) => q.trim() && !/^\s*[|#\-*`>]/.test(q));
    if (paras.some((q) => q.length > LONG_PARA)) w.longPara += 1;
  }
}

const quantile = (a, q) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))];
};
const rows = [...weeks.keys()].sort().map((k) => {
  const w = weeks.get(k);
  return { week: k, sessions: w.sessions, styleLoaded: w.styled, runs: w.runs, finalMedian: quantile(w.lens, 0.5), finalP90: quantile(w.lens, 0.9), overBudget: w.over, multiTable: w.multiTable, longParagraph: w.longPara, complaints: w.complaints };
});

if (JSON_OUT) { console.log(JSON.stringify(rows, null, 2)); process.exit(0); }
console.log(`summaryShape — ${SLUG}, last ${DAYS} days, sessions with ≥3 prompts. Budget ${BUDGET_CHARS} chars, long paragraph >${LONG_PARA}. A REPORT, never a gate.`);
console.log("| week (Mon) | sessions | style loaded | runs | final median | final p90 | > budget | > 1 table | long paragraph | his complaints |");
console.log("|---|---|---|---|---|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.week} | ${r.sessions} | ${r.styleLoaded} | ${r.runs} | ${r.finalMedian} | ${r.finalP90} | ${r.overBudget} | ${r.multiTable} | ${r.longParagraph} | ${r.complaints} |`);
console.log("\nRead the DELTA week over week. 'style loaded' says which weeks the contract could have reached; 'complaints' are his own messages matching too-much-prose / walls of text / narration.");
