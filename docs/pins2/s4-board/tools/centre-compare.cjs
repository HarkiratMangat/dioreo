// For Harkirat (2026-10-04 01:36 EDT): three real C1 weapon rows from Board 4: Collective (ref-kit), each drawn two ways, with a pixel grid and
// guides. A = the words centred by their CAPITAL height (the kit's text-box trim), B = centred by their FONT SIZE (an untrimmed line-height-1
// box). Both at whole sizes with no nudges (name 14px, category 10px), each row moved onto a whole pixel as an all-whole board would place it.
// Read-only: every change lives in page memory. Output: local/pins2/s4/work/lead/centre-compare.png
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const ROOT = '/Applications/Claude Code/Diors-Builds';
const OUT = path.join(ROOT, 'local/pins2/s4/work/lead/centre-compare.png');
const puppeteer = require(ROOT + '/node_modules/puppeteer-core');
const S = 10, NAME = 14, CAT = 10;
const CT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.png': 'image/png', '.webp': 'image/webp' };
(async () => {
  const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(ROOT, u); try { let b = fs.readFileSync(f); const ext = path.extname(f); if (ext === '.html' && !/^\s*<!doctype/i.test(b.toString('utf8', 0, 64))) b = Buffer.concat([Buffer.from('<!doctype html>'), b]); r.writeHead(200, { 'content-type': CT[ext] || 'application/octet-stream' }); r.end(b); } catch (e) { r.writeHead(404); r.end(); } });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const port = srv.address().port;
  const br = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 300000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'cc-')) });
  const p = await br.newPage(); await p.setViewport({ width: 1480, height: 834, deviceScaleFactor: S });
  await p.goto(`http://127.0.0.1:${port}/local/pins2/s4/ref-kit/board4.html`, { waitUntil: 'networkidle0', timeout: 90000 });
  await p.evaluate(async () => { await document.fonts.ready; });
  await p.waitForFunction(() => document.querySelectorAll('.wg-h > .wg-line > b').length >= 3, { timeout: 30000 });
  const raf = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const variant = async (v) => {
    await p.evaluate((v, NAME, CAT) => {
      let st = document.getElementById('cc'); if (!st) { st = document.createElement('style'); st.id = 'cc'; document.head.appendChild(st); }
      st.textContent = `.wg-h > .wg-line > :is(b,small){transform:none !important}
        .wg-h > .wg-line > b{font-size:${NAME}px !important;line-height:1 !important}
        .wg-h > .wg-line > small{font-size:${CAT}px !important;line-height:1 !important}` +
        (v !== 'A' ? `.wg-h > .wg-line > :is(b,small){text-box:normal !important;text-box-trim:none !important}` : '') + (v === 'C' ? `.wg-h > .wg-line > small{padding-top:1px !important}` : '');
      const rows = [...document.querySelectorAll('.wg-h')].slice(0, 3);
      for (const h of rows) h.style.marginTop = '';
      for (const h of rows) { const t = h.getBoundingClientRect().top + scrollY; const d = (1 - (t % 1)) % 1; if (d > 0.001) h.style.marginTop = d + 'px'; }
    }, v, NAME, CAT);
    await raf();
  };
  const geom = (i) => p.evaluate((i) => {
    const h = document.querySelectorAll('.wg-h')[i]; h.scrollIntoView({ block: 'center' });
    const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
    const b = h.querySelector('.wg-line > b'), s = h.querySelector('.wg-line > small');
    const cb = h.querySelector('.wg-cb, input[type=checkbox], [role=checkbox]');
    const cs = (e) => { const c = getComputedStyle(e); return `${c.display} trim:${c.textBoxTrim || c.getPropertyValue('text-box-trim')} edge:${c.textBoxEdge || c.getPropertyValue('text-box-edge')} font:${c.fontFamily.split(',')[0]}`; };
    return { row: R(h), name: R(b), cat: R(s), cb: R(cb), nameText: b.textContent, catText: s.textContent, csName: cs(b), csCat: cs(s) };
  }, i);
  // the capitals' band: the same elements with their words swapped to HHHH (a word's vertical layout does not depend on its letters)
  const capBand = async (i, which) => {
    const sel = which === 'name' ? '.wg-line > b' : '.wg-line > small';
    const g = await p.evaluate((i, sel) => { const e = document.querySelectorAll('.wg-h')[i].querySelector(sel); e.dataset.ccText = e.textContent; e.textContent = 'HHHH'; const r = e.getBoundingClientRect(), R = e.closest('.wg-h').getBoundingClientRect(); return { x: r.left + scrollX, w: r.width, top: R.top + scrollY, hgt: R.height }; }, i, sel);
    await raf();
    const b64 = await p.screenshot({ clip: { x: g.x, y: g.top + 2, width: Math.max(4, g.w), height: g.hgt - 4 }, encoding: 'base64' });
    const ext = await p.evaluate(async (b64, S) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
      const cnt = new Map(); for (let k = 0; k < d.length; k += 4) { const key = (d[k] >> 2) + ',' + (d[k + 1] >> 2) + ',' + (d[k + 2] >> 2); cnt.set(key, (cnt.get(key) || 0) + 1); }
      const bg = [...cnt.entries()].sort((a, b) => b[1] - a[1])[0][0].split(',').map((v) => v * 4 + 2);
      let mx = 0; const w = new Float64Array(W * H);
      for (let k = 0, j = 0; k < d.length; k += 4, j++) { const v = Math.max(Math.abs(d[k] - bg[0]), Math.abs(d[k + 1] - bg[1]), Math.abs(d[k + 2] - bg[2])); w[j] = v; if (v > mx) mx = v; }
      let top = H, bot = -1; for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) if (w[y * W + i] / mx > 0.5) { if (y < top) top = y; if (y > bot) bot = y; }
      return { top: top / S + 2, bot: (bot + 1) / S + 2 };
    }, b64, S);
    await p.evaluate((i, sel) => { const e = document.querySelectorAll('.wg-h')[i].querySelector(sel); e.textContent = e.dataset.ccText; delete e.dataset.ccText; }, i, sel);
    await raf();
    return { top: g.top + ext.top, bot: g.top + ext.bot };
  };
  const panels = [], report = [];
  for (let i = 0; i < 3; i++) for (const v of ['A', 'B']) {
    await variant(v);
    const G = await geom(i); await raf();
    const capN = await capBand(i, 'name'), capC = await capBand(i, 'cat');
    const G2 = await geom(i); await raf();
    const right = Math.max(G2.cat.x + G2.cat.w, G2.name.x + G2.name.w) + 16;
    const left = (G2.cb ? G2.cb.x : G2.name.x) - 8; const midY = G2.row.y + G2.row.h / 2;
    const clip = { x: left, y: midY - 12, width: Math.min(420, right + 8 - left), height: 24 };
    const shot = await p.screenshot({ clip, encoding: 'base64' });
    const mid = G2.row.y + G2.row.h / 2;
    const nOff = (capN.top + capN.bot) / 2 - mid, cOff = (capC.top + capC.bot) / 2 - mid;
    if (i === 0 && v === 'A') report.push(`computed · name: ${G2.csName} · category: ${G2.csCat}`);
    report.push(`row ${i + 1} ${v}: "${G2.nameText}" / "${G2.catText}" · row top ${G2.row.y.toFixed(2)} · boxes ${G2.name.h.toFixed(2)} / ${G2.cat.h.toFixed(2)}px · capitals ${(capN.bot - capN.top).toFixed(2)} / ${(capC.bot - capC.top).toFixed(2)}px · capital middle vs row middle: name ${nOff >= 0 ? '+' : ''}${nOff.toFixed(2)}, category ${cOff >= 0 ? '+' : ''}${cOff.toFixed(2)}`);
    panels.push({ i, v, shot, clip, G: G2, capN, capC, mid, nOff, cOff });
  }
  for (const pad of [1, 2]) { await variant('C'); await p.evaluate((pad) => { document.getElementById('cc').textContent = document.getElementById('cc').textContent.replace(/padding-top:\d+px/, 'padding-top:' + pad + 'px'); }, pad); await raf(); const G3 = await geom(0); await raf(); const capC = await capBand(0, 'cat'); const m = G3.row.y + G3.row.h / 2; const o = (capC.top + capC.bot) / 2 - m; report.push(`row 1 C (B plus ${pad}px padding above the category, not drawn): category box ${G3.cat.h.toFixed(2)}px · capital middle ${o >= 0 ? '+' : ''}${o.toFixed(2)}`); }
  report.push('inside the category: ' + await p.evaluate(() => { const e = document.querySelector('.wg-h .wg-line > small'); return `${e.childElementCount} child elements · ${e.innerHTML.slice(0, 120)}`; }));
  for (const shift of [true, false]) for (const cat of [9, 10, 11, 12]) {
    await p.evaluate((cat, shift) => {
      document.getElementById('cc').textContent = `.wg-h > .wg-line > :is(b,small){transform:none !important}
        .wg-h > .wg-line > b{font-size:14px !important;line-height:1 !important}
        .wg-h > .wg-line > small{font-size:${cat}px !important;line-height:1 !important;display:block !important}`;
      const h = document.querySelectorAll('.wg-h')[0]; h.style.marginTop = '';
      if (shift) { const t = h.getBoundingClientRect().top + scrollY; const d = (1 - (t % 1)) % 1; if (d > 0.001) h.style.marginTop = d + 'px'; }
    }, cat, shift);
    await raf(); const G4 = await geom(0); await raf(); const capC = await capBand(0, 'cat'); const capN = await capBand(0, 'name');
    const m = G4.row.y + G4.row.h / 2, oc = (capC.top + capC.bot) / 2 - m, on = (capN.top + capN.bot) / 2 - m;
    report.push(`row 1 D (category trim made to work, display:block) ${shift ? 'row on a whole pixel ' : 'row where it sits today'} · category ${cat}px: box ${G4.cat.h.toFixed(2)}px · capital middle ${oc >= 0 ? '+' : ''}${oc.toFixed(2)} · name ${on >= 0 ? '+' : ''}${on.toFixed(2)}`);
  }
  console.log(report.join('\n'));
  // compose: each panel = a caption strip, then the shot with the grid and guides drawn over it
  const png = await p.evaluate(async (panels, S) => {
    const LEG = 92, TITLE = 64, GAP = 18, PAIR = 70;
    const imgs = await Promise.all(panels.map(async (q) => { const im = new Image(); im.src = 'data:image/png;base64,' + q.shot; await im.decode(); return im; }));
    const W = Math.max(1500, ...imgs.map((im) => im.width + 220));
    const H = LEG + imgs.reduce((a, im, k) => a + TITLE + im.height + (k % 2 ? PAIR : GAP), 0);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#0b0d10'; x.fillRect(0, 0, W, H);
    const f = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + 'px';
    // legend
    const keys = [['#ff3b3b', 'solid', 'row middle'], ['#2fd3ff', 'solid', 'name: top & bottom of capitals, tick = their middle'], ['#ffd23f', 'solid', 'category: same'], ['#ff4fd8', 'dash', 'the box that got centred'], ['#6dff8b', 'dash', 'checkbox middle']];
    x.font = '500 22px Menlo, monospace'; let lx = 16, ly = 30;
    for (const [col, kind, label] of keys) { const w = x.measureText(label).width + 70; if (lx + w > W) { lx = 16; ly += 34; } x.strokeStyle = col; x.lineWidth = 3; x.setLineDash(kind === 'dash' ? [8, 6] : []); x.beginPath(); x.moveTo(lx, ly - 7); x.lineTo(lx + 40, ly - 7); x.stroke(); x.setLineDash([]); x.fillStyle = '#c9ccd1'; x.fillText(label, lx + 50, ly); lx += w + 20; }
    x.fillStyle = '#8a8f98'; x.fillText('grid: 1px lines · faint lines every ½px (one pixel on your 2x screen) · 10x zoom', 16, ly + 34);
    let y0 = LEG;
    panels.forEach((q, k) => {
      const im = imgs[k];
      x.fillStyle = '#e8eaed'; x.font = '700 26px Menlo, monospace';
      x.fillText(`Row ${q.i + 1} · ${q.v === 'A' ? 'A · centred by CAPITAL height' : 'B · centred by FONT SIZE'}`, 16, y0 + 28);
      x.font = '500 22px Menlo, monospace'; const ok = (v) => Math.abs(v) <= 0.25;
      x.fillStyle = ok(q.nOff) ? '#7be38a' : '#ffb26b'; const t1 = `name ${f(q.nOff)}`; x.fillText(t1, 16, y0 + 56);
      x.fillStyle = ok(q.cOff) ? '#7be38a' : '#ffb26b'; x.fillText(`category ${f(q.cOff)}`, 16 + x.measureText(t1).width + 30, y0 + 56);
      x.fillStyle = '#8a8f98'; x.fillText(`boxes ${q.G.name.h.toFixed(1)}px / ${q.G.cat.h.toFixed(1)}px`, W - 380, y0 + 56);
      const top = y0 + TITLE, L = 16; x.drawImage(im, L, top);
      const Y = (cssY) => top + (cssY - q.clip.y) * S, X = (cssX) => L + (cssX - q.clip.x) * S;
      for (let gy = Math.ceil(q.clip.y * 2) / 2; gy <= q.clip.y + q.clip.height + 1e-6; gy += 0.5) { const whole = Math.abs(gy - Math.round(gy)) < 1e-6; x.strokeStyle = whole ? 'rgba(255,255,255,.30)' : 'rgba(255,255,255,.10)'; x.lineWidth = 1; x.beginPath(); x.moveTo(L, Math.round(Y(gy)) + 0.5); x.lineTo(L + im.width, Math.round(Y(gy)) + 0.5); x.stroke(); }
      for (let gx = Math.ceil(q.clip.x); gx <= q.clip.x + q.clip.width; gx += 1) { x.strokeStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.moveTo(Math.round(X(gx)) + 0.5, top); x.lineTo(Math.round(X(gx)) + 0.5, top + im.height); x.stroke(); }
      x.strokeStyle = '#ff3b3b'; x.lineWidth = 3; x.beginPath(); x.moveTo(L, Y(q.mid)); x.lineTo(L + im.width + 30, Y(q.mid)); x.stroke();
      x.fillStyle = '#ff3b3b'; x.font = '600 20px Menlo, monospace'; x.fillText('middle', L + im.width + 36, Y(q.mid) + 7);
      const word = (box, cap, col) => {
        x.setLineDash([10, 7]); x.strokeStyle = '#ff4fd8'; x.lineWidth = 2; x.strokeRect(X(box.x), Y(box.y), box.w * S, box.h * S); x.setLineDash([]);
        x.strokeStyle = col; x.lineWidth = 2;
        for (const yy of [cap.top, cap.bot]) { x.beginPath(); x.moveTo(X(box.x) - 30, Y(yy)); x.lineTo(X(box.x + box.w) + 30, Y(yy)); x.stroke(); }
        const m = (cap.top + cap.bot) / 2; x.lineWidth = 4; x.beginPath(); x.moveTo(X(box.x + box.w) + 8, Y(m)); x.lineTo(X(box.x + box.w) + 60, Y(m)); x.stroke();
      };
      word(q.G.name, q.capN, '#2fd3ff'); word(q.G.cat, q.capC, '#ffd23f');
      if (q.G.cb) { const m = q.G.cb.y + q.G.cb.h / 2; x.strokeStyle = '#6dff8b'; x.lineWidth = 3; x.setLineDash([8, 6]); x.beginPath(); x.moveTo(X(q.G.cb.x) - 20, Y(m)); x.lineTo(X(q.G.cb.x + q.G.cb.w) + 20, Y(m)); x.stroke(); x.setLineDash([]); }
      y0 = top + im.height + (k % 2 ? PAIR : GAP);
    });
    return c.toDataURL('image/png').split(',')[1];
  }, panels, S);
  fs.writeFileSync(OUT, Buffer.from(png, 'base64'));
  console.log('written', OUT);
  await br.close(); srv.close();
})().catch((e) => { console.error('CC FAIL', e.message); process.exit(1); });
