// Session 4 · writes the Standard board's frozen.js from the freeze copies (sweep/frozen.json) and the container probe (sweep/ctr.json).
// Each copy carries `ctr`, the Board 4 surface it sits on (the first ancestor with an opaque background): its width and height, the
// copy's offset inside it, its fill, corner radius and 1px edge. The board draws the copy inside that surface at its real width, so a
// width setting is read against the container Board 4 gives it, never against the page. Colours written as color(srgb …) become rgb().
// Why: Harkirat, 2026-10-02 12:28 EDT — "why is the container the full page width instead of the surface's actual container".
// Run: node local/pins2/s4/work/lead/gen-frozen.cjs
const fs = require('fs'); const path = require('path');
const SW = path.join(__dirname, 'sweep'); const OUT = path.resolve(__dirname, '../../board/live/frozen.js');
const FZ = JSON.parse(fs.readFileSync(path.join(SW, 'frozen.json'), 'utf8')); const C = JSON.parse(fs.readFileSync(path.join(SW, 'ctr.json'), 'utf8'));
const rgb = (c) => String(c).replace(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/g, (m, r, g, b, a) => { const v = [r, g, b].map((x) => Math.round(+x * 255)); return a === undefined ? `rgb(${v.join(', ')})` : `rgba(${v.join(', ')}, ${a})`; });
const opaque = (c) => c && c !== 'rgba(0, 0, 0, 0)' && !/, 0\)$/.test(c) && !/\/ 0\)$/.test(c);
const NAME = [[/\bdrawer\b/, 'drawer'], [/\bpb-card\b/, 'queue card'], [/\bb3-sd\b/, 'selection bar'], [/\bwg-h\b/, 'group header'], [/\bpb-qafter\b/, 'queue column'], [/\bb4-vb\b/, 'panel head'], [/^ph\b/, 'panel head'], [/\bpanel\b/, 'panel']];
const miss = []; const out = {};
for (const [id, v] of Object.entries(FZ)) {
  const c = C[id]; const e = { html: v.html, bg: rgb(v.bg), w: v.w, h: v.h };
  if (!c) { miss.push(id); out[id] = e; continue; }
  const a = c.chain.find((x) => opaque(x.bg));
  if (!a) { miss.push(id + ' (no opaque ancestor)'); out[id] = e; continue; }
  const edge = (a.edge.match(/rgba?\([^)]*\)|color\([^)]*\)/) || [''])[0];
  const kind = (NAME.find(([re]) => re.test(a.cls)) || [0, a.tag])[1];
  e.bg = rgb(a.bg);
  e.ctr = { w: a.w, h: a.h, x: -a.x, y: -a.y, bg: rgb(a.bg), rad: a.rad, edge: edge ? rgb(edge) : '', kind };
  out[id] = e;
}
if (miss.length) { console.error('NO CONTAINER for: ' + miss.join(', ')); process.exit(3); }
fs.writeFileSync(OUT, '// Board 4: Collective, copied element by element by local/pins2/s4/work/lead/freeze.cjs, each with the surface it sits on\n// (gen-frozen.cjs from ctr-probe.cjs). Generated; do not edit by hand.\nwindow.FZ = ' + JSON.stringify(out) + ';\n');
for (const [id, e] of Object.entries(out)) console.log(id.padEnd(13), `${e.w}x${e.h}`.padEnd(9), 'in', `${e.ctr.kind} ${e.ctr.w}x${e.ctr.h} at ${e.ctr.x},${e.ctr.y}`.padEnd(34), e.ctr.bg, 'r', e.ctr.rad, e.ctr.edge || 'no edge');
console.log('wrote', OUT, (fs.statSync(OUT).size / 1024).toFixed(0) + 'KB');
