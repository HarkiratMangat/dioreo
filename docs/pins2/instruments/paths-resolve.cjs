// docs/pins2/instruments/paths-resolve.cjs — does every path a live pins2 doc names still resolve, and to something a fresh clone has?
// Written 2026-09-29 00:04 EDT. Sessions 4 and 5 read these docs cold, and docs-audit's xref skips docs/pins2/plan, spec and final, so no gate read them: the folder move left dead relative links in FINAL.md and HANDOFF.md and the audit stayed green.
// Run from anywhere: node docs/pins2/instruments/paths-resolve.cjs [doc ...]. Exit 1 when a path is DEAD (not on disk). UNTRACKED (on disk, not in git: a gitignored working file, or not yet added) is listed and never fatal, because a fresh clone cannot follow it.
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
process.chdir(path.resolve(__dirname, '../../..'));
const DOCS = process.argv.slice(2).length ? process.argv.slice(2) : ['docs/pins2/README.md', 'docs/pins2/plan/2026-09-13-portal-pins-batch-2.md', 'docs/pins2/final/FINAL.md', 'docs/pins2/final/board4-spec/HANDOFF.md', 'docs/pins2/final/board4-spec/README.md', 'docs/pins2/instruments/README.md', 'docs/pins2/kit/README.md'];
// A path a live doc names on purpose before it exists, or one that lives on another branch. Each needs its reason here, so a typo cannot hide behind it.
const WILL_EXIST = {
  'docs/pins2/final/apply-map.md': 'Session 4 writes it (plan §5c Step 2)',
  'docs/pins2/final/element-map.json': 'Session 4 writes it (plan §5c Step 4f)',
  'local/pins2/s5-pin-walk/index.html': 'Session 5 writes it (plan §5d Step 9)',
  'scripts/testManifest.mjs': 'the CI branch ci/test-queue-rebuild adds it (plan §7)',
  '../portal/public/app.css': 'a board-2 stylesheet link quoted as history in plan §4b, relative to a folder that no longer exists',
};
const tracked = new Set(cp.execSync('git ls-files -z', { maxBuffer: 1e9 }).toString().split('\0'));
const trackedDirs = new Set([...tracked].flatMap((f) => { const parts = f.split('/'); return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/')); }));
const EXT = '(?:jsonl|json|mjs|cjs|js|md|css|html|png|svg|py|txt|gif|webp|sh)(?![A-Za-z0-9])';
const reAbs = new RegExp('(?<![A-Za-z0-9_.\\/-])((?:docs|portal|scripts|local|\\.claude|public|utils|core|commands|handlers|models|\\.impeccable)\\/[A-Za-z0-9_.@\\/-]+\\.' + EXT + ')', 'g');
const reRel = new RegExp('(?<![A-Za-z0-9_.\\/-])((?:\\.\\.?\\/)+[A-Za-z0-9_.@\\/-]+\\.' + EXT + ')', 'g');
const reLink = /\]\(([^)\s]+)\)/g;
let dead = 0; let untracked = 0;
for (const doc of DOCS) {
  const text = fs.readFileSync(doc, 'utf8'); const seen = new Map();
  const add = (p) => { p = path.normalize(p.replace(/[.,;:)]+$/, '')).replace(/\/$/, ''); if (!seen.has(p)) seen.set(p, { exists: fs.existsSync(p), trk: tracked.has(p) || trackedDirs.has(p) }); };
  for (const m of text.matchAll(reAbs)) add(m[1]);
  for (const m of text.matchAll(reRel)) add(path.join(path.dirname(doc), m[1]));
  for (const m of text.matchAll(reLink)) { const t = m[1].split('#')[0]; if (t && !/^(https?:|mailto:|\/)/.test(t)) add(path.join(path.dirname(doc), t)); }
  const bad = [...seen].filter(([p, v]) => !v.exists && !WILL_EXIST[p]); const loose = [...seen].filter(([p, v]) => v.exists && !v.trk);
  dead += bad.length; untracked += loose.length;
  console.log(`${doc}: ${seen.size} paths, ${bad.length} dead, ${loose.length} untracked`);
  for (const [p] of bad) console.log('  DEAD      ' + p);
  for (const [p] of loose) console.log('  UNTRACKED ' + p);
}
console.log(`\n${dead} dead, ${untracked} untracked, across ${DOCS.length} docs`);
process.exit(dead ? 1 : 0);
