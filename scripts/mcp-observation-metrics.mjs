#!/usr/bin/env node
// mcp-observation-metrics.mjs — the INSTRUMENT for the 7-day MCP observation window.
//
// v2, 2026-08-02 17:30 EDT. v1 measured TURNS and TOOL COUNTS only — half the cost model.
// Harkirat caught it: "cost ≈ turns × context" and v1 never measured context. It also ignored the
// model/effort mix, which is a genuine CONFOUNDER (the corpus spans sonnet-5, opus-5, opus-4-8 and
// haiku-4-5 at three effort levels — a treatment week skewed toward Opus would move every number
// regardless of sequential-thinking). Re-baselined the same day, before any treatment data existed.
//
// WHY IT IS A SCRIPT: the baseline and the treatment period must be measured the SAME way, or the
// comparison is meaningless. If you edit this file mid-window the comparison is void — note the
// change and re-baseline (which is exactly what happened between v1 and v2).
//
// Counts REAL tool_use invocations, never mentions: "sequentialthinking" appears in every
// system-prompt tool listing, so mention-counting returns 38 vs 2 actual calls — 19x, flattering.
//
//   node scripts/mcp-observation-metrics.mjs --from 2026-07-24 --to 2026-08-02 --label baseline
//   node scripts/mcp-observation-metrics.mjs --from 2026-08-02 --to 2026-08-10 --label treatment
//   ... add --project -Applications-Claude-Code-Diors-Builds to scope to one project

import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []),
);
const FROM = args.from ?? '1970-01-01';
const TO = args.to ?? '2999-12-31';
const LABEL = args.label ?? 'run';
const PROJECT = args.project ?? null;
const ROOT = path.join(process.env.HOME, '.claude', 'projects');

// Indicative USD per 1M tokens — API LIST RATES. The token counts are facts; this is the only
// modelled part of the output.
//
// ⚠️ `estCostUSD` IS NOT A DOLLAR AMOUNT. Calibrated 2026-08-02 17:40 EDT against the one real figure
// on record, computed FROM ITS TRANSCRIPT rather than from a remembered summary — session 38972d5e:
// 404 claude-sonnet-5 turns, 87.4M cache reads, 430k output -> $44.02 at list, billed $17.10.
// **List is 2.57x actual.**
//
// A first attempt at this calibration said 7.7x and was wrong twice over: it applied OPUS cache-read
// rates ($1.50/M) to a SONNET session ($0.30/M), and counted only cache reads while ignoring 430k
// output tokens. Harkirat caught the model error. Two wrong inputs, one confident number — the exact
// shape of feedback_verify_before_claiming, committed inside the instrument built to measure rigour.
//
// ⚠️ AND the 2.57x factor is itself MODEL-SPECIFIC. Per-model rates differ ~5x between Opus and
// Sonnet, so a single scalar only holds while the model mix holds. That is a second reason the
// `models` breakdown is the first thing to check at close-out: if the mix shifts, even the RELATIVE
// comparison distorts. Use estCostUSD to compare windows of similar mix; never quote it as spend.
const RATES = {
  'claude-opus-5':   { in: 15, out: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  'claude-opus-4-8': { in: 15, out: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  'claude-sonnet-5': { in: 3,  out: 15, cacheWrite: 3.75,  cacheRead: 0.3 },
  'claude-haiku-4-5-20251001': { in: 0.8, out: 4, cacheWrite: 1, cacheRead: 0.08 },
};

const WATCH = {
  'sequential-thinking': /mcp__sequential-thinking__/,
  'linksee-recall': /mcp__linksee__recall/,
  'linksee-remember': /mcp__linksee__remember/,
  'linksee-read_smart': /mcp__linksee__read_smart/,
  'perseus-recall': /mcp__perseus-vault__perseus_vault_recall/,
  'perseus-remember': /mcp__perseus-vault__perseus_vault_remember/,
  'codebase-search_graph': /mcp__codebase-memory-mcp__search_graph/,
  'ctx-execute*': /ctx_execute|ctx_batch_execute|ctx_execute_file/,
  'subagent-spawn': /^(Task|Agent)$/,
  'Read': /^Read$/,
  'Write': /^Write$/,
  'Edit': /^Edit$/,
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

let files = walk(PROJECT ? path.join(ROOT, PROJECT) : ROOT).filter((f) => {
  const d = new Date(fs.statSync(f).mtime).toISOString().slice(0, 10);
  return d >= FROM && d < TO;
});

const tok = { input: 0, output: 0, cacheCreate: 0, cacheRead: 0, cache1h: 0, cache5m: 0 };
// speed/service_tier are tracked because `/fast` is user-toggleable and would move cost independently
// of anything under test — another confounder that must be visible, not discovered afterwards.
const models = {}, efforts = {}, byProject = {}, speeds = {}, tiers = {};
const totals = Object.fromEntries(Object.keys(WATCH).map((k) => [k, 0]));
let assistantTurns = 0, sessions = 0, compactions = 0, apiErrors = 0, toolErrors = 0, cost = 0;
const perSessionTurns = [], seqDetail = [];
let firstTs = null, lastTs = null;

for (const f of files) {
  const proj = path.relative(ROOT, f).split(path.sep)[0];
  let turnsHere = 0;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }

    if (o.timestamp) { if (!firstTs || o.timestamp < firstTs) firstTs = o.timestamp; if (!lastTs || o.timestamp > lastTs) lastTs = o.timestamp; }
    if (o.subtype === 'compact_boundary') compactions++;
    if (o.subtype === 'api_error') apiErrors++;
    if (o.effort) efforts[o.effort] = (efforts[o.effort] ?? 0) + 1;

    if (o.type === 'assistant') {
      assistantTurns++; turnsHere++;
      const m = o?.message?.model; if (m) models[m] = (models[m] ?? 0) + 1;
      const u = o?.message?.usage;
      if (u) {
        tok.input += u.input_tokens ?? 0;
        tok.output += u.output_tokens ?? 0;
        tok.cacheCreate += u.cache_creation_input_tokens ?? 0;
        tok.cacheRead += u.cache_read_input_tokens ?? 0;
        tok.cache1h += u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
        tok.cache5m += u.cache_creation?.ephemeral_5m_input_tokens ?? 0;
        if (u.speed) speeds[u.speed] = (speeds[u.speed] ?? 0) + 1;
        if (u.service_tier) tiers[u.service_tier] = (tiers[u.service_tier] ?? 0) + 1;
        const r = RATES[m];
        if (r) cost += ((u.input_tokens ?? 0) * r.in + (u.output_tokens ?? 0) * r.out
          + (u.cache_creation_input_tokens ?? 0) * r.cacheWrite + (u.cache_read_input_tokens ?? 0) * r.cacheRead) / 1e6;
      }
    }

    const content = o?.message?.content;
    if (Array.isArray(content)) {
      for (const b of content) {
        if (b?.type === 'tool_result' && b.is_error) toolErrors++;
        if (b?.type !== 'tool_use' || !b.name) continue;
        for (const [k, re] of Object.entries(WATCH)) if (re.test(b.name)) totals[k]++;
        if (/mcp__sequential-thinking__/.test(b.name)) {
          seqDetail.push({
            session: path.basename(f, '.jsonl').slice(0, 8),
            date: new Date(fs.statSync(f).mtime).toISOString().slice(0, 10),
            thoughtNumber: b.input?.thoughtNumber, totalThoughts: b.input?.totalThoughts,
            isRevision: b.input?.isRevision ?? false, branchId: b.input?.branchId ?? null,
            inputChars: JSON.stringify(b.input ?? {}).length,
          });
        }
      }
    }
  }
  if (turnsHere > 0) { sessions++; perSessionTurns.push(turnsHere); byProject[proj] = (byProject[proj] ?? 0) + turnsHere; }
}

// Median matters as much as mean: one 3,000-turn session can carry an average on its own.
perSessionTurns.sort((a, b) => a - b);
const median = perSessionTurns.length ? perSessionTurns[Math.floor(perSessionTurns.length / 2)] : 0;
const totalTok = tok.input + tok.output + tok.cacheCreate + tok.cacheRead;

console.log(JSON.stringify({
  label: LABEL, window: { from: FROM, to: TO }, project: PROJECT ?? 'ALL',
  wallClock: { first: firstTs, last: lastTs },
  sessions, assistantTurns,
  turnsPerSession: { mean: sessions ? +(assistantTurns / sessions).toFixed(1) : 0, median, max: perSessionTurns.at(-1) ?? 0 },
  tokens: { ...tok, total: totalTok },
  tokensPerTurn: assistantTurns ? Math.round(totalTok / assistantTurns) : 0,
  cacheReadPerTurn: assistantTurns ? Math.round(tok.cacheRead / assistantTurns) : 0,
  estCostUSD: +cost.toFixed(2),
  models, efforts, speeds, tiers, compactions, apiErrors, toolErrors,
  turnsByProject: byProject,
  toolCalls: totals,
  seqPer100Turns: assistantTurns ? +((totals['sequential-thinking'] / assistantTurns) * 100).toFixed(3) : 0,
  memoryWritesPerSession: sessions ? +(((totals['linksee-remember'] + totals['perseus-remember']) / sessions).toFixed(2)) : 0,
  sequentialThinkingDetail: seqDetail,
}, null, 2));
