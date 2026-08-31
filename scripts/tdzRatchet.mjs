#!/usr/bin/env node
// scripts/tdzRatchet.mjs — NO NEW TEMPORAL DEAD ZONES. The existing debt is frozen and may only shrink.
//
// 🔴 WHY A RATCHET AND NOT A BLOCKING RULE. `no-use-before-define` reports 31 pre-existing findings in this
// tree. Making it blocking today fails the suite on code nobody has audited; deferring it entirely leaves
// the defect that has cost six incidents unguarded. The ratchet is this repo's own idiom (`portal:orphans`
// KNOWN_ORPHANS) and it does the one thing that matters: **a NEW one fails immediately.**
//
// ⚠️ AND IT FAILS BOTH WAYS. An entry that has been FIXED but left in the baseline also fails, so the list
// cannot rot into a pile of names nothing reports — the exact failure mode that makes a debt list
// worthless. It only ever shrinks, and it is finished when it is empty.
//
// 🔴 THE HISTORY IS THE POINT: two hand-built detectors were written and deleted before this. A static
// analyser produced 40 findings, nearly all false. An import-based checker could not evaluate `season.js`
// — the very file where the defect keeps happening — so its falsifier passed for the wrong reason TWICE.
// eslint was dismissed as "heavy for one rule" and then reimplemented badly over eight turns. **Reaching
// past a known-good tool because it feels heavy is worth more as a lesson than the rule it avoided.**

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = path.join(ROOT, 'portal', 'fixtures', 'tdz-baseline.json');

// ⚠️ VIA A FILE, NOT STDOUT. eslint exits non-zero when it finds anything, and reading its JSON off a
// captured stdout mixed the report into this script's own output and then failed to parse — the run
// printed a megabyte of JSON and exited 1 for the wrong reason, which is indistinguishable from a real
// finding. A file has no streams to confuse.
const TMP = path.join(ROOT, 'portal', 'fixtures', '.tdz-run.json');
try { execSync(`npx eslint portal/ui scripts core handlers bot -f json -o ${JSON.stringify(TMP)}`, { cwd: ROOT, stdio: 'ignore' }); }
catch { /* non-zero simply means findings exist; the file is still written */ }
if (!fs.existsSync(TMP)) { console.log('❌ eslint wrote no report — cannot verify. This is a REFUSAL, not a pass.'); process.exit(1); }
const raw = fs.readFileSync(TMP, 'utf8');
fs.unlinkSync(TMP);

const now = [];
for (const f of JSON.parse(raw)) for (const m of f.messages) {
    if (m.ruleId === 'no-use-before-define') now.push(f.filePath.replace(ROOT + '/', '') + ' :: ' + m.message);
}
now.sort();
if (!fs.existsSync(BASE)) { console.log(`❌ no baseline at ${BASE}`); process.exit(1); }
const base = JSON.parse(fs.readFileSync(BASE, 'utf8')).data;

const fresh = now.filter((x) => !base.includes(x));
const gone = base.filter((x) => !now.includes(x));

console.log(`\ntdz ratchet — ${now.length} finding(s) against a baseline of ${base.length}\n`);
let bad = false;
if (fresh.length) {
    bad = true;
    console.log(`❌ ${fresh.length} NEW temporal dead zone(s) — these throw at EVALUATION and \`node --check\` cannot see them:`);
    for (const x of fresh) console.log(`     ${x}`);
    console.log('   → move the read below the declaration, or make it lazy.');
}
if (gone.length) {
    bad = true;
    console.log(`\n❌ ${gone.length} baseline entr${gone.length === 1 ? 'y is' : 'ies are'} fixed and still listed — re-record in the same commit:`);
    for (const x of gone) console.log(`     ${x}`);
    console.log('   → npx eslint ... -f json and rewrite portal/fixtures/tdz-baseline.json.');
}
if (!bad) console.log('✅ no new TDZs. The list only ever shrinks; it is finished when it is empty.');
process.exit(bad ? 1 : 0);
