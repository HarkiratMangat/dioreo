#!/usr/bin/env node
// mcp-observation-metrics.mjs — the INSTRUMENT for the 7-day MCP observation window.
//
// WHY IT IS A SCRIPT AND NOT AN AD-HOC COMMAND
// The baseline and the treatment period MUST be measured the same way, or the comparison is
// meaningless. An ad-hoc shell pipeline re-typed a week later is a different instrument. This file is
// the instrument: run it now for the baseline, run it unchanged on 2026-08-09 for the result.
// If you change this script mid-window, the comparison is void — note the change and re-baseline.
//
// Counts REAL tool_use invocations, never mentions. Counting mentions of "sequentialthinking" returns
// 38 (it appears in every system-prompt tool listing) vs 2 actual calls — a 19x error in the
// direction that would have flattered the hypothesis.
//
//   node scripts/mcp-observation-metrics.mjs --from 2026-07-24 --to 2026-08-02 --label baseline
//   node scripts/mcp-observation-metrics.mjs --from 2026-08-02 --to 2026-08-09 --label treatment

import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []),
);
const FROM = args.from ?? '1970-01-01';
const TO = args.to ?? '2999-12-31';
const LABEL = args.label ?? 'run';
const ROOT = path.join(process.env.HOME, '.claude', 'projects');

// The tools under observation. sequential-thinking is the experiment; the rest are the MCP fixes
// shipped 2026-08-02 whose adoption we also want to see hold up (or not).
const WATCH = {
  'sequential-thinking': /mcp__sequential-thinking__/,
  'linksee-recall': /mcp__linksee__recall/,
  'linksee-remember': /mcp__linksee__remember/,
  'linksee-read_smart': /mcp__linksee__read_smart/,
  'perseus-recall': /mcp__perseus-vault__perseus_vault_recall/,
  'perseus-remember': /mcp__perseus-vault__perseus_vault_remember/,
  'codebase-search_graph': /mcp__codebase-memory-mcp__search_graph/,
  'ctx-execute*': /ctx_execute|ctx_batch_execute|ctx_execute_file/,
  'Read': /^Read$/,
  'Bash': /^Bash$/,
};

function walk(dir) {
  let out = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (p.endsWith('.jsonl')) out.push(p);
  }
  return out;
}

const files = walk(ROOT).filter((f) => {
  const d = new Date(fs.statSync(f).mtime).toISOString().slice(0, 10);
  return d >= FROM && d < TO;
});

const totals = Object.fromEntries(Object.keys(WATCH).map((k) => [k, 0]));
let assistantTurns = 0, sessions = 0, seqDetail = [];

for (const f of files) {
  sessions++;
  let sawTurn = false;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o?.type === 'assistant') { assistantTurns++; sawTurn = true; }
    const content = o?.message?.content;
    if (!Array.isArray(content)) continue;
    for (const b of content) {
      if (b?.type !== 'tool_use' || !b.name) continue;
      for (const [k, re] of Object.entries(WATCH)) if (re.test(b.name)) totals[k]++;
      if (/mcp__sequential-thinking__/.test(b.name)) {
        seqDetail.push({
          session: path.basename(f, '.jsonl').slice(0, 8),
          date: new Date(fs.statSync(f).mtime).toISOString().slice(0, 10),
          thoughtNumber: b.input?.thoughtNumber, totalThoughts: b.input?.totalThoughts,
          inputChars: JSON.stringify(b.input ?? {}).length,
        });
      }
    }
  }
  if (!sawTurn) sessions--; // empty/aborted transcript
}

const out = {
  label: LABEL, window: { from: FROM, to: TO }, sessions, assistantTurns,
  turnsPerSession: sessions ? +(assistantTurns / sessions).toFixed(1) : 0,
  toolCalls: totals,
  seqPer100Turns: assistantTurns ? +((totals['sequential-thinking'] / assistantTurns) * 100).toFixed(3) : 0,
  memoryWritesPerSession: sessions
    ? +(((totals['linksee-remember'] + totals['perseus-remember']) / sessions).toFixed(2)) : 0,
  sequentialThinkingDetail: seqDetail,
};
console.log(JSON.stringify(out, null, 2));
