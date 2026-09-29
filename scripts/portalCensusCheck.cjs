// scripts/portalCensusCheck.cjs — does Session 4's element map account for EVERY family and every hand-typed value the census found?
// Written 2026-09-21 12:23 EDT for portal pins batch 2. The census (scripts/portalCensus.cjs) lists what the portal renders; the map says what
// each thing becomes. This fails on anything the map does not mention, so a missed element is a red line, not a silent skip.
//
// The map, docs/pins2/final/element-map.json, written by Session 4:
//   { "standards": { "<name>": { "class": "...", "tokens": {...}, "note": "..." } },
//     "families":  { "F1a2b3c4": "<standard name>" | { "exempt": "<why, in his words where he gave them>" } | { "rebuilt": "Board 4: Final · <surface>" } },
//     "loose":     { "<kind> <value>": "<token name>" | { "exempt": "<why>" } } }
//
//   node scripts/portalCensusCheck.cjs            report · exit 1 when anything is unassigned or an assignment names no standard
//   node scripts/portalCensusCheck.cjs --after    Session 5's close: also fail if any family assigned to a standard still renders
//                                                 a look other than that standard's own family (the copy was never converted)
const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const CENSUS = path.join(ROOT, 'local', 'census', 'census.json');
const MAP = path.join(ROOT, 'docs', 'pins2', 'final', 'element-map.json');
if (!fs.existsSync(CENSUS)) { console.error('no census — run node scripts/portalCensus.cjs first'); process.exit(2); }
const census = JSON.parse(fs.readFileSync(CENSUS, 'utf8'));
const map = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, 'utf8')) : { standards: {}, families: {}, loose: {} };
const std = map.standards || {}; const fam = map.families || {}; const loose = map.loose || {};
const unF = census.families.filter((f) => !(f.id in fam));
const badF = census.families.filter((f) => typeof fam[f.id] === 'string' && !(fam[f.id] in std));
const unL = census.loose.filter((l) => !(`${l.kind} ${l.val}` in loose));
const badL = census.loose.filter((l) => typeof loose[`${l.kind} ${l.val}`] === 'string' && !/^--/.test(loose[`${l.kind} ${l.val}`]));
let unconverted = [];
if (process.argv.includes('--after')) {
  // After the build, a family still assigned to a standard is a copy that was not converted: the standard's own look is ONE family.
  const byStd = {}; census.families.forEach((f) => { const a = fam[f.id]; if (typeof a === 'string') (byStd[a] = byStd[a] || []).push(f); });
  unconverted = Object.entries(byStd).filter(([, fs2]) => fs2.length > 1).map(([k, fs2]) => `${k}: ${fs2.length} looks (${fs2.map((f) => f.id).join(' ')})`);
}
const line = (t, n, list) => console.log(`${n ? '✗' : '✓'} ${t}: ${n}${n ? ' — ' + list.slice(0, 12).join(' · ') + (n > 12 ? ' …' : '') : ''}`);
line('families with no assignment', unF.length, unF.map((f) => `${f.id} (${f.n}, ${f.where[0] && f.where[0].w})`));
line('families assigned to a standard the map does not define', badF.length, badF.map((f) => `${f.id}→${fam[f.id]}`));
line('hand-typed values with no assignment', unL.length, unL.map((l) => `${l.kind} ${l.val} ×${l.where.length}`));
line('hand-typed values assigned to something that is not a token', badL.length, badL.map((l) => `${l.kind} ${l.val}`));
if (process.argv.includes('--after')) line('standards still drawn more than one way', unconverted.length, unconverted);
console.log(`census ${census.at} · ${census.families.length} families · ${census.loose.length} hand-typed values · map ${fs.existsSync(MAP) ? path.relative(ROOT, MAP) : 'NOT WRITTEN YET'}`);
process.exit(unF.length + badF.length + unL.length + badL.length + unconverted.length ? 1 : 0);
