// C1's button looks, retaken on V20 (2026-10-06 18:05 EDT, his "lets do the buttons that appear on C1" + "batch aggressively"):
// every button in every walk view (pop-up views excluded, board chrome excluded by measure.js inStage), grouped by its LOOK = fill · edge ·
// shape · type · content, with size and tint left out as flags. Only looks that appear on C1 are kept, with every copy on every gate counted.
// Each variant (look × height × tint) is shot once in five states: rest (its row hovered when it only shows then), hovered, pressed,
// keyboard focus. Output: looks-c1/data.json + one crop per variant and state; looks-c1-sheet.py draws the sheets.
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const D = path.join(__dirname, 'looks-c1'); fs.rmSync(D, { recursive: true, force: true }); fs.mkdirSync(D, { recursive: true });
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = process.env.BD_STATE || path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const CT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp' };
  const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(ROOT, u); try { let b = fs.readFileSync(f); const ext = path.extname(f); if (ext === '.html') b = Buffer.concat([Buffer.from('<!doctype html>'), b]); r.writeHead(200, { 'content-type': CT[ext] || 'application/octet-stream' }); r.end(b); } catch (e) { r.writeHead(404); r.end(); } });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const port = srv.address().port;
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'looks-c1-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const st = fs.readFileSync(STATE, 'utf8'); await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, st);
  await p.goto(`http://127.0.0.1:${port}/docs/pins2/s4-board/builder.html`, { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__bd && window.__bd.mounted, { timeout: 60000 }); await p.evaluate(() => document.fonts.ready); await sleep(800);
  await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
  await p.evaluate(() => { const M = BD.measure;
    const rgba = (c) => { const m = (c || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
    const hueName = (c) => { const q = rgba(c); if (!q || q.a < 0.05) return null; const r = q.r / 255, g = q.g / 255, bl = q.b / 255; const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl); const l = (mx + mn) / 2, d = mx - mn; const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)); if (s < 0.18 || d < 0.08) return 'neutral'; let h = mx === r ? ((g - bl) / d) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return h < 18 || h >= 340 ? 'red' : h < 45 ? 'orange' : h < 70 ? 'yellow' : h < 160 ? 'green' : h < 200 ? 'teal' : h < 255 ? 'blue' : h < 290 ? 'purple' : 'pink'; };
    window.__look = (e) => { const T = M.paintTarget(e); const el = T && T.el ? T.el : e; const part = T && T.part && T.part !== 'self' ? T.part : null; const c = part ? getComputedStyle(el, part) : getComputedStyle(el); const r = e.getBoundingClientRect(); const ce = getComputedStyle(e);
      const bg = rgba(c.backgroundColor); const fill = /gradient/.test(c.backgroundImage) ? 'gradient' : !bg || bg.a < 0.05 ? 'no fill' : bg.a < 0.95 ? 'wash' : 'solid';
      const bw = parseFloat(c.borderTopWidth) || 0; const ring = bw > 0 && c.borderTopStyle !== 'none' ? (c.borderTopStyle === 'dashed' ? 'dashed ring' : 'ring') : /(inset\s+)?0px 0px 0px [12]px|\b[12]px\b/.test(c.boxShadow) && c.boxShadow !== 'none' ? 'ring' : 'no ring';
      const rad = parseFloat(c.borderTopLeftRadius) || 0; const h = (part ? parseFloat(c.height) : r.height) || r.height; const shape = rad < 0.5 ? 'square' : rad >= h / 2 - 0.5 ? 'pill' : 'round';
      const tx = [...e.querySelectorAll('*')].concat([e]).find((x) => [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || e; const ct = getComputedStyle(tx);
      const fam = /mono/i.test(ct.fontFamily) ? 'mono' : /shoulders/i.test(ct.fontFamily) ? 'display' : 'sans'; const type = `${fam} ${ct.fontWeight}${ct.textTransform === 'uppercase' ? ' caps' : ''}`;
      const icon = [...e.querySelectorAll('svg')].some((s) => M.visible(s)); const words = (e.innerText || '').trim(); const num = /\d/.test(words) && [...e.querySelectorAll('em, b, small, span')].some((x) => /^\d+$/.test((x.innerText || '').trim()));
      const content = (icon ? 'icon' : '') + (words && !/^\d+$/.test(words) ? (icon ? '+' : '') + 'words' : '') + (num ? '+count' : '') || 'empty';
      const tint = hueName(bg && bg.a >= 0.05 ? c.backgroundColor : bw > 0 ? c.borderTopColor : ce.color) || 'neutral';
      return { key: `${fill} · ${ring} · ${shape} · ${words ? type + ' · ' : ''}${content}`, h: Math.round(r.height), tint, sel: M.selOf(e), t: words.replace(/\s+/g, ' ').slice(0, 28) || e.getAttribute('aria-label') || e.title || '' }; };
    window.__L = new Map(); window.__N = 0; window.__V = 0; });
  const views = await p.evaluate(() => (window.BD_WALK.views || []).map((v, i) => ({ i, g: v.g, label: v.label, kind: v.kind })));
  const shots = []; const t0 = Date.now();
  async function shoot(vid, V) {
    const r = await p.evaluate(([vid, sel, t]) => { const M = BD.measure; let e = document.querySelector(`[data-lkv="${vid}"]`);
      if (!e) { /* the view re-rendered since the census: find the same copy again by its selector and name */ try { e = [...document.querySelectorAll(sel)].find((x) => M.visible(x) && ((x.innerText || '').replace(/\s+/g, ' ').trim().startsWith(t) || x.getAttribute('aria-label') === t)); } catch (z) {} if (!e) { try { e = [...document.querySelectorAll(sel)].find((x) => M.visible(x)); } catch (z) {} } if (!e) return null; e.setAttribute('data-lkv', String(vid)); } e.scrollIntoView({ block: 'center', behavior: 'instant' });
      let q = e.getBoundingClientRect(); for (let k = 0; k < 4; k++) { const top = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); if (top && (e.contains(top) || top.contains(e))) break; window.scrollBy({ top: -140, behavior: 'instant' }); const sc = [...document.querySelectorAll('*')].find((a) => a.scrollHeight > a.clientHeight + 4 && a.contains(e) && /auto|scroll/.test(getComputedStyle(a).overflowY)); if (sc) sc.scrollBy({ top: -140, behavior: 'instant' }); q = e.getBoundingClientRect(); } /* instant: a smooth scrollBy was still moving when the rect was read, and every crop landed on the toolbar */
      let rx = 1, ry = 1; for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const ar = a.getBoundingClientRect(); if (ar.width > q.width + 40) { rx = Math.max(ar.left + 3, 1); ry = q.top + q.height / 2; if (rx > q.left - 2) rx = ar.right - 3; break; } }
      return { x: Math.max(0, q.left - 18), y: Math.max(0, q.top - 14), w: Math.min(560, q.width + 36), h: Math.min(300, q.height + 28), cx: q.left + q.width / 2, cy: q.top + q.height / 2, rx, ry }; }, [vid, V.sel, V.t || '']);
    if (!r) return null; await sleep(120); const out = {};
    // captured FIRST, before a hover, press or focus can re-render the row or leave a state class on an ancestor (a red Upload came from that): the copy for the C1 container (b4/specimen.js): the button's markup and its ancestor chain up to its gate, plus the first opaque ground
    const cap = await p.evaluate((vid) => { const e = document.querySelector(`[data-lkv="${vid}"]`); if (!e) return null; const chain = []; let ground = null;
      for (let a = e.parentElement; a && a.id !== 'board' && !a.classList.contains('b4') && a !== document.body; a = a.parentElement) {
        chain.unshift({ tag: a.tagName.toLowerCase(), attrs: [...a.attributes].filter((x) => x.name !== 'data-lkv').map((x) => [x.name, x.value]) });
        if (!ground) { const m = (getComputedStyle(a).backgroundColor || '').match(/rgba?\(([^)]+)\)/); if (m) { const v = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat); if ((v.length > 3 ? v[3] : 1) >= 0.95) ground = getComputedStyle(a).backgroundColor; } }
        if (a.classList.contains('pb-gate')) break; }
      const c = e.cloneNode(true); c.removeAttribute('data-lkv'); for (const x of c.querySelectorAll('[data-lkv]')) x.removeAttribute('data-lkv'); return { chain, html: c.outerHTML, ground }; }, vid);

    // the crop is re-read before every state: a hover can scroll or re-lay the row
    const clipNow = async () => { const q = await p.evaluate((vid) => { const e = document.querySelector(`[data-lkv="${vid}"]`); if (!e) return null; const q = e.getBoundingClientRect(); return { x: Math.max(0, q.left - 18), y: Math.max(0, q.top - 14), width: Math.min(560, q.width + 36), height: Math.min(300, q.height + 28) }; }, vid); return q || { x: r.x, y: r.y, width: r.w, height: r.h }; };
    let clip = await clipNow();
    await p.mouse.move(1, 1); await sleep(220); const vis = await p.evaluate((vid) => BD.measure.visible(document.querySelector(`[data-lkv="${vid}"]`)), vid);
    if (!vis) { await p.mouse.move(r.rx, r.ry); await sleep(220); out.rowHover = true; }
    clip = await clipNow(); await p.screenshot({ path: path.join(D, `v${vid}-rest.png`), clip });
    await p.mouse.move(clip.x + clip.width / 2, clip.y + clip.height / 2); await sleep(320); clip = await clipNow(); await p.screenshot({ path: path.join(D, `v${vid}-hover.png`), clip });
    await p.mouse.down(); await sleep(140); await p.screenshot({ path: path.join(D, `v${vid}-press.png`), clip }); await p.mouse.move(1, 1); await sleep(60); await p.mouse.up();
    await p.keyboard.press('Shift'); await p.evaluate((vid) => { const e = document.querySelector(`[data-lkv="${vid}"]`); if (e) e.focus({ preventScroll: true }); }, vid); await sleep(200); clip = await clipNow();
    await p.screenshot({ path: path.join(D, `v${vid}-focus.png`), clip }); await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); }); await p.keyboard.press('Escape');
    return { clip, ...out, ...(cap || {}) };
  }
  for (const v of views) {
    if (v.kind === 'pop') continue;
    await p.evaluate((v) => { const M = BD.measure; const g = M.gateEl(v.g); if (!g) return; const btn = [...g.querySelectorAll(v.kind === 'try' ? '.b4-try button' : '.pb-ctl button')].find((x) => x.textContent.trim() === v.label); if (btn) btn.click(); }, v);
    await sleep(650); await p.evaluate(() => BD.measure.atRest());
    const fresh = await p.evaluate((v) => { const M = BD.measure; const g = M.gateEl(v.g); const out = []; if (!g) return out; const roots = [g, ...document.querySelectorAll('.b4-pop, .b3-datepop, .f-menu')];
      for (const sc of roots) for (const e of sc.querySelectorAll('button, [role=button]')) { if (!M.inStage(e)) continue; const vis = M.visible(e); const hid = !vis && e.getClientRects().length && getComputedStyle(e).display !== 'none'; if (!vis && !hid) continue;
        const L = window.__look(e); let G = window.__L.get(L.key); if (!G) { if (v.g !== 'C1') continue; G = { id: window.__N++, key: L.key, n: 0, gates: {}, vars: new Map() }; window.__L.set(L.key, G); }
        G.n++; G.gates[v.g] = (G.gates[v.g] || 0) + 1; const vk = `${L.h}|${L.tint}`; let V = G.vars.get(vk); const score = (vis ? 2 : 0) + (L.t ? 1 : 0);
        if (!V) { V = { vid: window.__V++, h: L.h, tint: L.tint, n: 0, gates: {}, ex: [], view: `${v.g} ${v.label}`, sel: L.sel, t: L.t, score }; G.vars.set(vk, V); e.setAttribute('data-lkv', String(V.vid)); out.push(V.vid); }
        else if (out.includes(V.vid) && score > V.score) { /* the shot goes to a visible, labelled copy: the first copy in the DOM was often a hidden, unnamed one (the search field's clear button), and every crop landed on the toolbar */ const old = document.querySelector(`[data-lkv="${V.vid}"]`); if (old) old.removeAttribute('data-lkv'); e.setAttribute('data-lkv', String(V.vid)); V.score = score; V.sel = L.sel; V.t = L.t; }
        V.n++; V.gates[v.g] = (V.gates[v.g] || 0) + 1; if (L.t && V.ex.length < 4 && !V.ex.includes(L.t)) V.ex.push(L.t); }
      return out; }, v);
    const vmeta = await p.evaluate((ids) => { const m = {}; for (const G of window.__L.values()) for (const V of G.vars.values()) if (ids.includes(V.vid)) m[V.vid] = { sel: V.sel, t: V.t }; return m; }, fresh);
    for (const vid of fresh) { const s = await shoot(vid, vmeta[vid]); shots.push({ vid, ...(s || { missing: true }) }); await p.evaluate((vid) => { const e = document.querySelector(`[data-lkv="${vid}"]`); if (e) e.removeAttribute('data-lkv'); }, vid); }
  }
  const looks = await p.evaluate(() => [...window.__L.values()].map((G) => ({ id: G.id, key: G.key, n: G.n, gates: G.gates, vars: [...G.vars.values()] })));
  for (const L of looks) for (const V of L.vars) V.shot = shots.find((s) => s.vid === V.vid) || null;
  { // the C1 container's data, numbered as the sheets number them (most copies first)
    const S = [...looks].sort((x, z) => z.n - x.n).map((L, i) => ({ num: i + 1, key: L.key, n: L.n, gates: L.gates, vars: [...L.vars].sort((x, z) => z.n - x.n || x.h - z.h).map((V) => ({ h: V.h, tint: V.tint, n: V.n, gates: V.gates, ex: V.ex, view: V.view, rowHover: !!(V.shot && V.shot.rowHover), chain: V.shot && V.shot.chain, html: V.shot && V.shot.html, ground: V.shot && V.shot.ground })) }));
    const at = new Date().toLocaleString('en-CA', { timeZone: 'America/New_York', hour12: false }).replace(',', '').slice(0, 16) + ' EDT';
    fs.writeFileSync(path.join(ROOT, 'docs/pins2/s4-board/b4/c1-looks.js'), `// generated by work/lead/looks-c1.cjs: C1's button looks for b4/specimen.js. Do not edit by hand; rerun the census.\nwindow.C1_LOOKS = ${JSON.stringify({ at, looks: S })};\n`); }
  fs.writeFileSync(path.join(D, 'data.json'), JSON.stringify({ at: new Date().toISOString(), state: STATE, looks, errs }, null, 1));
  console.log(JSON.stringify({ secs: Math.round((Date.now() - t0) / 1000), looks: looks.length, variants: looks.reduce((a, L) => a + L.vars.length, 0), missing: shots.filter((s) => s.missing).length, errs: errs.slice(0, 3) }));
  for (const L of looks.sort((a, z) => z.n - a.n)) console.log(`${L.n} · ${L.key} · ${Object.entries(L.gates).map(([g, n]) => g + ':' + n).join(' ')} · ${L.vars.map((V) => `${V.h}/${V.tint}(${V.n}) ${V.ex[0] || ''}`).join(' | ')}`);
  await b.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
