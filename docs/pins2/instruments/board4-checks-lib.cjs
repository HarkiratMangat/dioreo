// Board 4's four checks that his V62 and V63 reviews showed were missing (2026-09-30 14:53 EDT), promoted from the session's scratch scripts:
//   edge()   — the DRAWN border of a pop-up card: a pixel profile across the outline every 3px; one band of the stroke's width everywhere = one clean border
//              (doubled corners and thin spots show as a second band or a narrow one). No comparison side — the V63 check compared sides and lied.
//   clipOf() — how far an element runs past the nearest ancestor that clips it, and what paints over its edges (the manifest image mark, badge pops).
//   board4-checks.cjs — runs them with the pinned-scroll, hover-steal, hover-state and tile measurements. HELD with the other checks until he approves a
//   version (his standing flow, 2026-09-30 10:31 EDT); run: node docs/pins2/instruments/board4-checks.cjs
// Board 4 V64 instruments: one capture helper, the visible-card finder, the drawn-edge band check, the clip check.
const fs = require('fs'); const { execFileSync } = require('child_process');
const path = require('path');
const W = require(path.resolve(__dirname, '../final/board4-spec/board4-walk.cjs'));
const OUT = path.resolve(__dirname, '../../../local/pins2/intake-shots/checks');   // screenshots stay on this Mac (his call, 2026-09-29)
fs.mkdirSync(OUT, { recursive: true });
async function boot(dpr = 2) { const { b, p, errs } = await W.open(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: dpr });
  await p.setRequestInterception(true); p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.respond({ status: 404, body: '' }) : r.continue()));
  await p.reload({ waitUntil: 'networkidle0' }); await W.sleep(900); return { b, p, errs }; }
// a VIEWPORT box → a document clip (the harness scrolls; captureBeyondViewport stays on)
async function shot(p, box, name, pad = 10) { const [sx, sy] = await p.evaluate(() => [scrollX, scrollY]); await p.screenshot({ path: `${OUT}/${name}.png`, clip: { x: Math.max(0, box.x + sx - pad), y: Math.max(0, box.y + sy - pad), width: box.width + pad * 2, height: box.height + pad * 2 } }); return `${OUT}/${name}.png`; }
const vbox = (h) => h.evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
const union = (a, c) => { const x = Math.min(a.x, c.x), y = Math.min(a.y, c.y); return { x, y, width: Math.max(a.x + a.width, c.x + c.width) - x, height: Math.max(a.y + a.height, c.y + c.height) - y }; };
async function hover(p, el, wait = 1300) { await p.mouse.move(2, 2); await W.sleep(420); const r = await el.boundingBox(); await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await W.sleep(wait); return r; }
const cardBox = (p) => p.evaluate(() => { const e = [...document.querySelectorAll('.b3-hc.in, .b3-pc.in')].find((x) => { const r = x.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, cls: e.className.slice(0, 40) }; });
// THE DRAWN EDGE — no comparison side: along the whole outline, perpendicular profiles through the rendered pixels; a stroke-coloured run
// is the border. One run, of the stroke's own width, everywhere (corners included) = one clean border. A second run inside = a double line.
async function edge(p, tag) {
  const g = await p.evaluate(() => {
    const c = [...document.querySelectorAll('.b3-hc.in, .b3-pc.in')].find((e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }); if (!c) return null;
    const paths = [...c.querySelectorAll('svg.b3-pc-edge path:not(.glow)')]; const pth = paths.find((x) => getComputedStyle(x).stroke !== 'none' && getComputedStyle(x).strokeWidth !== '0px') || paths[0];
    const svg = pth.ownerSVGElement; const sr = svg.getBoundingClientRect(); const L = pth.getTotalLength(); const pts = [];
    const fillP = paths.find((x) => getComputedStyle(x).fill !== 'none') || pth;
    for (let t = 2; t < L - 2; t += 3) { const a = pth.getPointAtLength(t - 1), q = pth.getPointAtLength(t), z = pth.getPointAtLength(t + 1); let nx = -(z.y - a.y), ny = z.x - a.x; const m = Math.hypot(nx, ny) || 1; nx /= m; ny /= m;
      const pr = svg.createSVGPoint(); pr.x = q.x + nx * 2; pr.y = q.y + ny * 2; if (!fillP.isPointInFill(pr)) { nx = -nx; ny = -ny; } pts.push([q.x, q.y, nx, ny]); }   // (nx,ny) points INWARD
    return { x: sr.left, y: sr.top, w: sr.width, h: sr.height, pts, stroke: getComputedStyle(pth).stroke, sw: parseFloat(getComputedStyle(pth).strokeWidth), dpr: devicePixelRatio, R: 14 }; });
  if (!g) return null; const D = g.dpr, pad = 8;
  const png = `${OUT}/e-${tag}.png`; await p.screenshot({ path: png, clip: { x: g.x - pad + (await p.evaluate(() => scrollX)), y: g.y - pad + (await p.evaluate(() => scrollY)), width: g.w + pad * 2, height: g.h + pad * 2 } });
  const Wd = Math.round((g.w + pad * 2) * D), Hd = Math.round((g.h + pad * 2) * D); const raw = execFileSync('magick', [png, '-depth', '8', 'rgb:-'], { maxBuffer: 1 << 29 });
  const px = (x, y) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= Wd || y >= Hd) return [0, 0, 0]; const i = (y * Wd + x) * 3; return [raw[i], raw[i + 1], raw[i + 2]]; };
  const sc0 = (g.stroke.match(/[\d.]+/g) || []).slice(0, 3).map(Number); const sc = /^color\(srgb/.test(g.stroke) ? sc0.map((v) => v * 255) : sc0;   // computed colours come back as color(srgb 0–1) when mixed const dist = (a) => Math.hypot(a[0] - sc[0], a[1] - sc[1], a[2] - sc[2]);
  // (profile, device steps from 2px OUTSIDE to 5px INSIDE the path)
  const dist = (c) => Math.hypot(c[0] - sc[0], c[1] - sc[1], c[2] - sc[2]);
  const res = []; for (const [x, y, nx, ny] of g.pts) { const runs = []; let cur = 0; for (let k = -2 * D; k <= 5 * D; k++) { const d = k / D; const c = px((x + pad + nx * d) * D, (y + pad + ny * d) * D); const on = dist(c) < 38; if (on) cur++; else if (cur) { runs.push(cur); cur = 0; } } if (cur) runs.push(cur);
    const corner = (Math.min(x, g.w - x) < g.R + 2) && (Math.min(y, g.h - y) < g.R + 12); res.push({ x: Math.round(x), y: Math.round(y), runs, corner }); }
  const want = Math.round(g.sw * D); const bad = res.filter((r) => r.runs.length !== 1 || Math.abs(r.runs[0] - want) > 1);
  return { tag, n: res.length, want, bad: bad.length, doubles: bad.filter((r) => r.runs.length > 1).length, thin: bad.filter((r) => r.runs.length === 1 && r.runs[0] < want - 1).length, thick: bad.filter((r) => r.runs.length === 1 && r.runs[0] > want + 1).length, none: bad.filter((r) => !r.runs.length).length, cornerBad: bad.filter((r) => r.corner).length, sample: bad.slice(0, 6).map((r) => `${r.x},${r.y}:${r.runs.join('+') || 0}${r.corner ? 'c' : ''}`).join(' ') };
}
// CLIPPED: how far an element's box runs past the nearest ancestor that clips (overflow not visible, or a mask), and what paints over its edges
const clipOf = (h) => h.evaluate((e) => { const r = e.getBoundingClientRect(); let over = 0, by = null; for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) { const s = getComputedStyle(n); if (s.overflowX !== 'visible' || s.overflowY !== 'visible' || s.maskImage !== 'none' || s.clipPath !== 'none') { const q = n.getBoundingClientRect(); const o = Math.max(q.left - r.left, r.right - q.right, q.top - r.top, r.bottom - q.bottom); if (o > over + 0.5) { over = o; by = n.tagName + '.' + [...n.classList].slice(0, 3).join('.'); } } }
  const hits = []; for (const [fx, fy] of [[0.9, 0.5], [0.1, 0.5], [0.5, 0.1], [0.5, 0.9]]) { const t = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); if (t && !e.contains(t) && !t.contains(e)) hits.push(t.tagName + '.' + [...t.classList].slice(0, 2).join('.')); }
  return { over: Math.round(over * 10) / 10, by, covered: hits }; });
module.exports = { W, OUT, boot, shot, vbox, union, hover, cardBox, edge, clipOf };
