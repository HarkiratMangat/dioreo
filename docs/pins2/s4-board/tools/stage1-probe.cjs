// Stage 1 probe (2026-10-05 11:37 EDT): opens Builder-2 at 1282x888 and reports (a) the gunsmith code box Harkirat flagged at 11:36
// ("saying the gunsmith code's container is 44px tall even tho it's the same 32px as the buttons beside it"), (b) the Stage 1 hooks.
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const MODE = process.argv[2] || 'all';
(async () => {
  const CT = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp' };
  const srv = http.createServer((q, r) => { const u = decodeURIComponent(new URL(q.url, 'http://x').pathname); const f = path.join(ROOT, u); try { let b = fs.readFileSync(f); const ext = path.extname(f); if (ext === '.html') b = Buffer.concat([Buffer.from('<!doctype html>'), b]); r.writeHead(200, { 'content-type': CT[ext] || 'application/octet-stream' }); r.end(b); } catch (e) { r.writeHead(404); r.end(); } });
  await new Promise((res) => srv.listen(0, '127.0.0.1', res)); const port = srv.address().port;
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bd-s1-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: +(process.env.BD_DPR || 1) });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  if (process.env.BD_STATE) { const st = fs.readFileSync(process.env.BD_STATE, 'utf8'); await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); } catch (e) {} }, st); }
  await p.goto(`http://127.0.0.1:${port}/docs/pins2/s4-board/builder.html`, { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__bd && window.__bd.mounted, { timeout: 60000 }); await new Promise((r) => setTimeout(r, 1000));
  const out = await p.evaluate(() => {
    const B = window.__bd, M = B.measure, G = window.BD && window.BD.guides; const o = { keys: Object.keys(B), uiKeys: B.ui ? Object.keys(B.ui) : null, guides: !!G };
    const board = document.getElementById('board'); const px = (v) => parseFloat(v) || 0;
    const R = (e) => { const r = e.getBoundingClientRect(); return `${r.left.toFixed(1)},${r.top.toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`; };
    const desc = (e) => { const c = getComputedStyle(e); return `${e.tagName.toLowerCase()}.${[...e.classList].join('.')} [${R(e)}] disp ${c.display} pad ${c.paddingTop}/${c.paddingBottom} bord ${c.borderTopWidth} bg ${c.backgroundColor} sh ${c.boxShadow === 'none' ? '-' : c.boxShadow.slice(0, 60)} outl ${c.outlineStyle}${c.outlineStyle !== 'none' ? ' ' + c.outlineWidth : ''} h ${c.height} align ${c.alignSelf}`; };
    // (a) the code box
    const codeEl = [...board.querySelectorAll('*')].find((e) => e.children.length === 0 && /^1C6C7A8A9A$/.test((e.textContent || '').trim()));
    if (codeEl) {
      const thing = [...M.things(board)].filter((t) => t.contains(codeEl)).sort((a, z) => a.getBoundingClientRect().width - z.getBoundingClientRect().width);
      o.code = { leaf: desc(codeEl), chain: [], things: thing.slice(0, 4).map((t) => `${M.kindOf(t)} ${desc(t)}` + (G ? ` · ink ${JSON.stringify(G.ink(t))}` : '')) };
      let e = codeEl; for (let i = 0; e && i < 5; i++, e = e.parentElement) o.code.chain.push(desc(e) + ' ::before ' + getComputedStyle(e, '::before').content + ' ::after ' + getComputedStyle(e, '::after').content);
      const host = thing[thing.length - 1]; if (host) o.code.kids = [...(thing[0].children)].map(desc);
    } else o.code = 'not found';
    if (codeEl) { const btn = codeEl.closest('button'); o.codeNow = { seen: JSON.stringify(M.seen(btn)), vh: M.visibleHeight(btn), pc: !!M.paintedChild(btn), ink: G.ink(btn).kind }; }
    // (b) the C1 search bar (Harkirat 11:39: "why can't i change the icon's size, spacing, etc?")
    const inp = [...board.querySelectorAll('input')].find((e) => /^Search/.test(e.placeholder || ''));
    if (inp) {
      const ctl = [...M.things(board)].filter((t) => t.contains(inp) || t === inp).sort((a, z) => a.getBoundingClientRect().width - z.getBoundingClientRect().width)[0];
      o.search = { thing: `${M.kindOf(ctl)} ${desc(ctl)} bgimg ${getComputedStyle(ctl).backgroundImage.slice(0, 50)} bgpos ${getComputedStyle(ctl).backgroundPosition}`, before: getComputedStyle(ctl, '::before').content + ' ' + getComputedStyle(ctl, '::before').width + ' left ' + getComputedStyle(ctl, '::before').left + ' mask ' + getComputedStyle(ctl, '::before').maskImage.slice(0, 40), parent: desc(ctl.parentElement), sibs: [...ctl.parentElement.children].map((x) => `${desc(x)} pos ${getComputedStyle(x).position} l ${getComputedStyle(x).left}`), kids: [...ctl.children].map(desc), inpBg: getComputedStyle(inp).backgroundImage.slice(0, 60) + ' pad ' + getComputedStyle(inp).paddingLeft + '/' + getComputedStyle(inp).paddingRight };
      const svgs = [...ctl.parentElement.querySelectorAll('svg')].map((sv) => `svg [${R(sv)}] ink ${JSON.stringify(M.iconBox(sv))} pos ${getComputedStyle(sv).position} cls ${sv.getAttribute('class')}`); o.search.svgs = svgs;
    } else o.search = 'not found';
    return o;
  });
  out.tests = await p.evaluate(async () => {
    const B = window.__bd, M = BD.measure, G = BD.guides, Sd = BD.std, U = B.ui; const board = document.getElementById('board'); const T = {}; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const byText = (re, sel = 'button') => [...board.querySelectorAll(sel)].find((e) => re.test((e.innerText || '').trim()));
    const panelText = () => (U.panel() ? U.panel().innerText : '');
    try { // CATEGORY: width and alignment knobs
      const cat = [...board.querySelectorAll('*')].find((e) => e.children.length === 0 && /^category$/i.test((e.textContent || '').trim()));
      U.setInspect(true); U.select([cat]); await wait(150); U.makeFromSelection(); await wait(300);
      const chips = () => [...U.panel().querySelectorAll('[data-k]')].map((e) => e.dataset.k); const lay = { chips: chips() }; for (const k of ['w', 'ta']) { const c = U.panel().querySelector(`.kchip[data-k="${k}"]`); if (!c) { lay[k] = 'no chip'; continue; } c.click(); await wait(150); const kn = U.panel().querySelector(`.knob[data-k="${k}"]`); lay[k] = kn ? kn.querySelector('.kname').textContent + ' · options ' + kn.querySelectorAll('[data-act=opt]').length : 'no knob after click'; } const t = panelText(); const vc = Sd.memberOf(cat); T.layers = lay; T.category = { ks: [...(U.panel() ? U.panel().querySelectorAll('.knob[data-k]') : [])].map((e) => e.dataset.k), kind: vc && vc.kind, vals: vc && Object.keys(vc.values), found: !!cat, width: /Width/.test(t), align: /Words line up/.test(t), controls: /What controls this/.test(t), variants: Sd.get ? Object.keys(Sd.get() || {}).length : '?' };
      Sd.undo(); await wait(200);
    } catch (e) { T.category = 'ERR ' + e.message; }
    try { // search bar: the icon section and its two knobs
      const inp = [...board.querySelectorAll('input')].find((e) => /^Search/.test(e.placeholder || ''));
      const g0 = Sd.iconGeom(inp); U.select([inp]); await wait(150); U.makeFromSelection(); await wait(300); const t = panelText();
      T.search = { chips: [...U.panel().querySelectorAll('[data-k]')].map((e) => e.dataset.k), geom: g0 && { before: g0.before, ink: g0.inkW, box: g0.boxW, after: g0.after, right: g0.right }, section: /The icon in it/.test(t), knobIn: /Space before the icon/.test(t), knobOut: /Icon to words/.test(t), iconSize: /Icon size/.test(t) };
      const v = Sd.memberOf(inp); T.search.variant = v && v.id;
      if (v) { Sd.setValue(v.id, 'iin', 10); await wait(300); const g1 = Sd.iconGeom(inp); const svg = inp.parentElement.querySelector('svg'); T.search.dbg = { css: String(Sd.css()).split('\n').filter((l) => /iin|iout|B-01/.test(l)).slice(0, 8), left: getComputedStyle(svg).left, tok: getComputedStyle(inp).getPropertyValue('--bd-B-01-iin') + ' | ' + getComputedStyle(svg).getPropertyValue('--bd-B-01-iin') + ' | ' + getComputedStyle(document.documentElement).getPropertyValue('--bd-B-01-iin'), stored: JSON.stringify(v.values) }; Sd.setValue(v.id, 'iout', 12); await wait(300); const g2 = Sd.iconGeom(inp); Sd.setValue(v.id, 'icon', 20); await wait(300); const g3 = Sd.iconGeom(inp);
        T.search.after = { iin10: g1 && g1.before, iout12: g2 && [g2.before, g2.after], icon20: g3 && [g3.before, g3.inkW, g3.boxW, g3.after], check: Sd.selfCheck ? Sd.selfCheck().length : '?' }; }
      for (let i = 0; i < 5; i++) Sd.undo(); await wait(200);
    } catch (e) { T.search = 'ERR ' + e.message; }
    try { // guides: Collapse all's right edge vs New build
      const ca = byText(/^Collapse all$/), nb = byText(/^New build$/); const gate = M.gateOf(ca);
      G.add(gate, ca, 'right'); await wait(100); const g = G.store(gate).slice(-1)[0]; const tags = G.tags(gate, g);
      T.guide = { gate, pos: G.pos(g), tags: tags.map((t) => `${M.label(t.el)} ${G.tagText(t.d)}`).slice(0, 8), newBuild: (tags.find((t) => t.el === nb) || {}).d, svg: G.svg({ Lz: () => '', pill: () => '', H: 888 }).length > 0 };
      U.select([nb]); U.draw(); await wait(400); const sv = U.root().querySelector('svg'); T.guideDrawn = sv ? { html: sv.innerHTML.length, label: /in from/.test(sv.innerHTML), on: />on</.test(sv.innerHTML) } : 'no svg';
      G.clear(gate);
    } catch (e) { T.guide = 'ERR ' + e.message; }
    try { // edge pairs gone from the builder, kept for tools
      const gEl = M.gateEl('C1'); const a = M.nearMisses(gEl), z = M.nearMisses(gEl, { pairs: false });
      const n = (L) => (Array.isArray(L) ? L.length : L && L.misses ? L.misses.length : JSON.stringify(L).length); T.pairs = { withPairs: n(a), without: n(z) };
    } catch (e) { T.pairs = 'ERR ' + e.message; }
    try { const btn = [...board.querySelectorAll('button.wg-code')][0]; U.select([btn]); await wait(150); const t = panelText(); T.codePanel = { note: /It draws a 144 × 32 box/.test(t), seenH: M.seen(btn).height, ctlRow: /the click area/.test(t), edge: /its drawn box/.test(t) }; } catch (e) { T.codePanel = 'ERR ' + e.message; }
    return T;
  });
  if (MODE === 'fold3') {
    // his state of 15:06 EDT, his clicks: Collapse all clicked in Inspect four times; each time, the numbers it draws and whether the builder's sheet changed
    const pt = await p.evaluate(() => { window.__bd.ui.setInspect(true); const b = [...document.querySelectorAll('#board button')].find((e) => /^Collapse all$/.test(e.innerText.trim())); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2 + 25, y: r.top + r.height / 2 }; });
    await new Promise((r) => setTimeout(r, 400)); const out = [];
    const look = () => p.evaluate(() => { const M = BD.measure; const b = [...document.querySelectorAll('#board button')].find((e) => /(Collapse|Expand) all/.test(e.textContent)); const D = M.inside(b); const t = document.getElementById('bd-std').textContent; let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) | 0; const corr = (t.match(/fold[^{]*\{[^}]*\}/g) || []).slice(0, 3).map((x) => x.replace(/:not\(#bd-\d\)/g, '').slice(0, 160)); return { D: D && [D.left, D.right, D.top, D.bottom].map((x) => +x.toFixed(2)), sheet: h, len: t.length, corr, padNow: getComputedStyle(b).paddingLeft + '/' + getComputedStyle(b).paddingRight }; });
    out.push(await look()); for (let i = 0; i < 5; i++) { await p.mouse.click(pt.x, pt.y); await new Promise((r) => setTimeout(r, 900)); out.push(await look()); }
    console.log(JSON.stringify(out, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'fold2') {
    // his theory, 14:58 EDT: in Inspect a click on Collapse all still flips the page's own state (the label stays, the inside switches), so the
    // builder measures the other text, and the hover; test: real clicks in Inspect, then the button's own markup, the rows, and the numbers
    const pt = await p.evaluate(() => { window.__bd.ui.setInspect(true); const b = [...document.querySelectorAll('#board button')].find((e) => /^Collapse all$/.test(e.innerText.trim())); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2 + 20, y: r.top + r.height / 2 }; });
    await new Promise((r) => setTimeout(r, 300));
    const look = () => p.evaluate(() => { const M = BD.measure; const b = [...document.querySelectorAll('#board button')].find((e) => /(Collapse|Expand) all/.test(e.textContent)); const D = M.inside(b); const wrap = document.querySelector('#board .wg-wrap'); return { html: b.innerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '<svg/>').slice(0, 300), text: b.textContent.trim(), inner: b.innerText.trim(), aria: b.getAttribute('aria-expanded') + '/' + b.getAttribute('aria-pressed') + '/' + b.dataset.state, parts: D && D.parts.map((q) => q.kind + ':' + (q.node.nodeValue || q.node.className || '').toString().trim().slice(0, 16) + '@' + q.rect.left.toFixed(1) + '-' + q.rect.right.toFixed(1)).join(' | '), D: D && [D.left, D.right, D.top, D.bottom].map((x) => +x.toFixed(2)), manW: wrap && +wrap.getBoundingClientRect().width.toFixed(1) }; });
    const out = [await look()]; for (let i = 0; i < 4; i++) { await p.mouse.click(pt.x, pt.y); out.push(await look()); await new Promise((r) => setTimeout(r, 700)); out.push(await look()); }
    console.log(JSON.stringify(out, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'wgc') {
    const r = await p.evaluate(async () => {
      const U = window.__bd.ui, M = BD.measure, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); U.setInspect(true);
      const e = document.querySelector('#board button.wg-code'); e.scrollIntoView({ block: 'center' }); U.select([e]); await wait(60); U.makeFromSelection(); await wait(150); const v = Sd.memberOf(e);
      const D = M.inside(e); const out = { T: (() => { const T = M.paintTarget(e); return `${T.el.className} ${T.part}`; })(), parts: D && D.parts.map((q) => `${q.kind}:${(q.node.nodeType === 1 ? q.node : q.node.parentElement).className}`), D: D && [D.left, D.right], vals: JSON.stringify(v.values) };
      for (const k of ['padR', 'msize', 'bh']) { const cur = v.values[k]; if (typeof cur !== 'number') { out[k] = 'no value'; continue; } Sd.setValue(v.id, k, Math.round(cur) + 2); await wait(150); const css = String(Sd.css()).split('\n').filter((l) => l.includes(`-${k})`) || l.includes(`-${k} `) || l.includes(`-${k}-`)).filter((l) => !l.startsWith(':root')).map((l) => l.replace(/:not\(#bd-\d\)/g, '').slice(0, 220)); const kn = Sd.KNOBS.control.find((x) => x.k === k); out[k] = { cur, now: kn.read(e), css }; Sd.undo(); await wait(80); }
      return out;
    });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'clicks') {
    // click Collapse all four times in Inspect mode, as he did, and read the numbers the page draws each time; and apply() five times over to see
    // whether settle() keeps changing the sheet
    const pt = await p.evaluate(() => { window.__bd.ui.setInspect(true); const b = [...document.querySelectorAll('#board button')].find((e) => /^Collapse all$/.test(e.innerText.trim())); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2 + 20, y: r.top + r.height / 2 }; });
    await new Promise((r) => setTimeout(r, 300)); const out = { clicks: [] };
    for (let i = 0; i < 4; i++) { await p.mouse.click(pt.x, pt.y); await new Promise((r) => setTimeout(r, 500)); out.clicks.push(await p.evaluate(() => { const M = BD.measure; const b = [...document.querySelectorAll('#board button')].find((e) => /^(Collapse|Expand) all$/.test(e.innerText.trim())); const D = M.inside(b); const svg = window.__bd.ui.root().querySelector('svg'); const nums = [...svg.querySelectorAll('text')].map((t) => t.textContent).filter((t) => /^[\d.]+$/.test(t)).slice(0, 14).join(' '); return { label: b.innerText.trim(), D: D && [D.left, D.right, D.top, D.bottom].map((x) => +x.toFixed(2)), nums }; })); }
    out.sheets = await p.evaluate(async () => { const Sd = BD.std; const res = []; for (let i = 0; i < 5; i++) { Sd.apply(); await new Promise((r) => setTimeout(r, 100)); const t = document.getElementById('bd-std').textContent; res.push(t.length + ':' + (t.match(/calc\([^)]*\)/g) || []).slice(0, 3).join(' ')); } return res; });
    console.log(JSON.stringify(out, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'misses') {
    // the members behind landed's misses: which element, what it reads, and the parts the reading stands on
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: +(process.env.BD_DPR || 1) }); await new Promise((r) => setTimeout(r, 800));
    const rows = await p.evaluate(() => { const Sd = BD.std, M = BD.measure; M.atRest(); const out = []; const want = [['B-01', 'padL'], ['B-01', 'padR'], ['B-03', 'gap'], ['B-03', 'padL'], ['B-10', 'icon']];
      for (const [id, k] of want) { const v = Sd.state.variants.find((x) => x.id === id); const K = Sd.KNOBS[v.kind].find((x) => x.k === k); const val = v.values[k];
        for (const e of Sd.elsOf(v)) { let g = null; try { g = K.read(e); } catch (x) { g = 'ERR ' + x.message; } if (g != null && typeof g === 'number' && Math.abs(g - val) < 0.05) continue; if (g != null && typeof g !== 'number') {}
          const D = M.inside(e); const r = e.getBoundingClientRect(); const pt = M.paintTarget ? M.paintTarget(e) : null;
          out.push({ id, k, asked: val, got: g, el: M.selOf(e) + ' "' + (e.innerText || e.placeholder || '').trim().slice(0, 24) + '"', box: [r.width, r.height].map((x) => +x.toFixed(1)).join('x'), vis: r.width > 0 && r.height > 0, paint: pt ? (pt.el ? (pt.el === e ? 'self' : M.selOf(pt.el)) : '?') + (pt.part ? ' ' + pt.part : '') : null, inside: D && [D.left, D.right, D.top, D.bottom].map((x) => +x.toFixed(2)).join(' '), parts: D && D.parts.map((q) => q.kind + ' ' + [q.rect.left - r.left, q.rect.width].map((x) => +x.toFixed(2)).join('/')).join(' · '), pad: getComputedStyle(e).paddingLeft + ' ' + getComputedStyle(e).paddingRight }); } }
      return out; });
    console.log(JSON.stringify(rows, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'b10') {
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: +(process.env.BD_DPR || 1) }); await new Promise((r) => setTimeout(r, 800));
    const rows = await p.evaluate(() => { const Sd = BD.std, M = BD.measure; M.atRest(); const v = Sd.state.variants.find((x) => x.id === 'B-10'); const K = Sd.KNOBS.control.find((x) => x.k === 'icon');
      const sheet = document.getElementById('bd-std').textContent; const iconRules = sheet.split('\n').filter((l) => /B-10|wg-h/.test(l) && /width/.test(l)).map((l) => l.slice(0, 260));
      return { rules: iconRules.slice(0, 8), members: Sd.elsOf(v).map((e) => { const sv = [...e.querySelectorAll('svg')].find((x) => M.visible(x)); const u = sv && sv.querySelector('use'); const r = sv && sv.getBoundingClientRect(); return { t: (e.innerText || '').split('\n').slice(0, 2).join(' '), read: K.read(e), svg: sv && ((sv.getAttribute('class') || '') + ' ' + (u ? u.getAttribute('href') : 'inline')), box: r && [r.width, r.height].map((x) => +x.toFixed(2)).join('x'), css: sv && getComputedStyle(sv).width, path: sv && M.selOf(sv) }; }) }; });
    console.log(JSON.stringify(rows, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'q1') {
    // size-sets question 1 (Harkirat 2026-10-05 19:15 EDT, taken over from the intake thread): every Space Grotesk 12px text on the board, shown
    // at 11, 12 (today) and 14. Builder chrome hidden; the same crops in each option, re-measured after the change
    await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
    const pick = await p.evaluate(() => { const board = document.getElementById('board'); const out = [];
      for (const e of board.querySelectorAll('*')) { if (![...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) continue; const c = getComputedStyle(e); if (c.fontSize !== '12px' || !/Space Grotesk/.test(c.fontFamily)) continue; const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || c.visibility === 'hidden' || +c.opacity === 0) continue; if (!BD.measure.visible(e)) continue; e.setAttribute('data-q12', ''); out.push(e); }
      // one example per gate and kind: the element's control or row, so the crop shows it in place
      const gateOf = (e) => (e.closest('[data-gate]') || e.closest('section.pb-gate') || board).getAttribute('data-gate') || (e.closest('section') || {}).id || '?';
      const seen = new Map(); for (const e of out) { const host = e.closest('button, label, li, tr, .chip, [class*=row], [class*=plate], [class*=hint]') || e.parentElement; const k = gateOf(e) + '|' + (host.className || host.tagName); if (!seen.has(k)) seen.set(k, { e, host }); }
      const L = [...seen.values()].slice(0, 40); L.forEach((x, i) => { x.host.setAttribute('data-q1h', String(i)); });
      return { total: out.length, kinds: seen.size, ex: L.map((x, i) => ({ i, text: x.e.textContent.trim().slice(0, 30), gate: gateOf(x.e), host: BD.measure.selOf(x.host) })) }; });
    console.log(JSON.stringify(pick));
    const D = path.join(__dirname, 'q1'); fs.mkdirSync(D, { recursive: true });
    const want = (process.env.Q1_PICK || '').split(',').filter(Boolean).map(Number);
    const centring = [];
    for (const size of (process.env.Q1_SIZES || '11,12,14').split(',').map(Number)) {
      await p.evaluate((sz) => { for (const e of document.querySelectorAll('[data-q12]')) e.style.setProperty('font-size', sz + 'px', 'important'); BD.measure.atRest(); }, size); await new Promise((r) => setTimeout(r, 400));
      for (const i of want) { const rect = await p.evaluate((i) => { const h = document.querySelector(`[data-q1h="${i}"]`); h.scrollIntoView({ block: 'center' }); const r = h.getBoundingClientRect(); return { x: Math.max(0, r.left - 10), y: Math.max(0, r.top - 8), width: Math.min(320, r.width + 20), height: r.height + 16 }; }, i); await new Promise((r) => setTimeout(r, 150)); const r2 = await p.evaluate((i) => { const h = document.querySelector(`[data-q1h="${i}"]`); const r = h.getBoundingClientRect(); return { x: Math.max(0, r.left - 10), y: Math.max(0, r.top - 8), width: Math.min(320, r.width + 20), height: r.height + 16 }; }, i); await p.screenshot({ path: path.join(D, `q1-${i}-${size}-full.png`) }); fs.writeFileSync(path.join(D, `q1-${i}-${size}.json`), JSON.stringify(r2));  centring.push(await p.evaluate((i, size) => { const M = BD.measure; const h = document.querySelector(`[data-q1h="${i}"]`); const t = h.querySelector('[data-q12]') || h; const ch = t.closest('button, [class*=chip], [class*=plate], .wg-rl, [class*=ft]') || h; const D = M.inside(ch); const lab = [...h.querySelectorAll('*')].filter((e) => !e.hasAttribute('data-q12') && [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())).map((e) => `${e.textContent.trim().slice(0, 12)} ${getComputedStyle(e).fontSize} ${/Mono/.test(getComputedStyle(e).fontFamily) ? 'mono' : 'sg'}`).slice(0, 3); return { i, size, host: M.selOf(ch).slice(0, 40), top: D && +D.top.toFixed(2), bottom: D && +D.bottom.toFixed(2), labels: lab }; }, i, size)); } // the viewport, cropped later: a clip is document-relative and the board scrolls inside its own stage
    }
    fs.writeFileSync(path.join(D, 'centring.json'), JSON.stringify(centring, null, 1));
    await b.close(); srv.close(); return;
  }
  if (MODE === 'q1c') {
    // his 19:27 question "how does 13 work?": in the attachment chips (MUZZLE · Monolithic Suppressor) the name's capitals measured against
    // the chip's drawn edges at 11 to 14, every chip on C1 — top gap, bottom gap, and how far off centre
    const r = await p.evaluate(async () => { const M = BD.measure; const names = [...document.querySelectorAll('#board span.wg-rl *')].filter((e) => M.visible(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()) && getComputedStyle(e).fontSize === '12px' && /Space Grotesk/.test(getComputedStyle(e).fontFamily)); /* the name is a child of the chip */ const out = {};
      for (const size of [11, 12, 13, 14]) { for (const e of names) e.style.setProperty('font-size', size + 'px', 'important'); M.atRest(); await new Promise((x) => setTimeout(x, 60));
        const offs = []; for (const e of names) { const chip = e.closest('span.wg-rl'); const T = M.paintTarget(chip); const box = (T && T.el ? T.el : chip).getBoundingClientRect(); const tn = [...e.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim()); const L0 = tn && M.nodeLetters(tn); const lr = L0 && (L0.rect || L0); if (!lr || lr.top == null) { offs.push({ err: JSON.stringify(L0).slice(0, 80) }); continue; } const w = { rect: lr }; const top = w.rect.top - box.top, bot = box.bottom - w.rect.bottom; offs.push({ top: +top.toFixed(2), bot: +bot.toFixed(2), off: +Math.abs(top - bot).toFixed(2), h: +box.height.toFixed(1) }); }
        const u = [...new Set(offs.map((o) => `${o.h}: ${o.top}/${o.bot}`))]; out[size] = { n: offs.length, maxOff: Math.max(...offs.map((o) => o.off)), sets: u.slice(0, 4) }; }
      return out; });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'achip') {
    // the attachment chip's structure (his 19:41: a name that only grows upward is not centred): markup, and each box's alignment
    const r = await p.evaluate(() => { const M = BD.measure; const nm = [...document.querySelectorAll('#board span.wg-rl *')].find((e) => /Monolithic Suppressor/.test(e.textContent) && !e.children.length); const chip = nm.parentElement;
      const desc = (e) => { const c = getComputedStyle(e); const b = e.getBoundingClientRect(); return `${M.selOf(e)} [${b.width.toFixed(1)}x${b.height.toFixed(2)} @y${b.top.toFixed(2)}] disp ${c.display} ai ${c.alignItems} as ${c.alignSelf} va ${c.verticalAlign} fs ${c.fontSize} lh ${c.lineHeight} pad ${c.padding} trim ${c.textBoxTrim}/${c.textBoxEdge} ff ${c.fontFamily.slice(0, 16)}`; };
      return { html: chip.outerHTML.slice(0, 400), chip: desc(chip), kids: [...chip.children].map(desc), parent: desc(chip.parentElement) }; });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'achipfix') {
    // candidate CSS (env FIX_CSS) for the attachment chips, then the name's capitals against the chip's edges at 11 to 14
    const r = await p.evaluate(async (css) => { const M = BD.measure; if (css) { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }
      const names = [...document.querySelectorAll('#board span.wg-at')].map((e) => e.querySelector(':scope > .wg-an') || e).filter((e) => M.visible(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())); const out = {};
      for (const size of [11, 12, 13, 14]) { for (const e of names) e.style.setProperty('font-size', size + 'px', 'important'); await new Promise((x) => setTimeout(x, 80));
        const offs = []; for (const e of names) { const tn = [...e.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim()); const L0 = M.nodeLetters(tn); const lr = L0 && (L0.rect || L0); if (!lr || lr.top == null) continue; const box = e.closest('.wg-at').getBoundingClientRect(); offs.push(`${box.height.toFixed(0)}: ${(lr.top - box.top).toFixed(2)}/${(box.bottom - lr.bottom).toFixed(2)}`); }
        out[size] = { n: offs.length, sets: [...new Set(offs)].slice(0, 5) }; }
      const met = (font) => { const cv = document.createElement('canvas').getContext('2d'); cv.font = font; const m = cv.measureText('H'); return { A: +(m.fontBoundingBoxAscent / 100).toFixed(4), D: +(m.fontBoundingBoxDescent / 100).toFixed(4), cap: +(m.actualBoundingBoxAscent / 100).toFixed(4) }; };
      const e0 = names[0]; const lab = getComputedStyle(e0, '::before'); out.fonts = { name: getComputedStyle(e0).font, sg: met(`500 100px ${getComputedStyle(e0).fontFamily}`), label: lab.font, mono: met(`${lab.fontWeight} 100px ${lab.fontFamily}`), labPad: lab.padding, labLh: lab.lineHeight };
      const D0 = M.inside(e0); out.parts = D0 && D0.parts.map((q) => `${q.kind} ${(q.node.nodeValue || q.node.textContent || '').trim().slice(0, 12)} y${(q.rect.top - e0.getBoundingClientRect().top).toFixed(2)} h${q.rect.height.toFixed(2)}`);
      return out; }, process.env.FIX_CSS || '');
    console.log(JSON.stringify(r)); await b.close(); srv.close(); return;
  }
  if (MODE === 'offc') {
    // the class behind the chip names (his 19:41): a bare text centred by a flex box's line box, not by its capitals. Every visible single-line
    // flex/inline-flex box with align-items:center and its own bare text: capitals' top and bottom gap to the box (padding difference taken out)
    const r = await p.evaluate(() => { const M = BD.measure; M.atRest(); const rows = [];
      for (const e of document.querySelectorAll('#board *')) { const c = getComputedStyle(e); if (!/flex/.test(c.display) || c.alignItems !== 'center' || /column/.test(c.flexDirection)) continue; const tn = [...e.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim()); if (!tn || !M.visible(e)) continue;
        const L0 = M.nodeLetters(tn); const lr = L0 && (L0.rect || L0); if (!lr || lr.top == null) continue; const b = e.getBoundingClientRect(); if (b.height > 80 || lr.height > parseFloat(c.fontSize) * 1.2) continue;
        const pt = parseFloat(c.paddingTop) + parseFloat(c.borderTopWidth), pb = parseFloat(c.paddingBottom) + parseFloat(c.borderBottomWidth); const top = lr.top - b.top - pt, bot = b.bottom - lr.bottom - pb; rows.push({ sel: M.selOf(e), fs: c.fontSize, ff: /Mono/.test(c.fontFamily) ? 'mono' : /Shoulders/.test(c.fontFamily) ? 'bsd' : 'sg', off: +((top - bot) / 2).toFixed(2), t: tn.nodeValue.trim().slice(0, 18) }); }
      const by = new Map(); for (const x of rows) { const k = x.sel + ' ' + x.ff + ' ' + x.fs; if (!by.has(k)) by.set(k, []); by.get(k).push(x); }
      const L = [...by].map(([k, xs]) => ({ k, n: xs.length, worst: Math.max(...xs.map((x) => Math.abs(x.off))), ex: xs[0].t })).sort((a, b) => b.worst - a.worst);
      return { boxes: rows.length, kinds: L.length, over025: L.filter((x) => x.worst >= 0.25).length, over05: L.filter((x) => x.worst >= 0.5).length, top: L.slice(0, 25) }; });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'lsize') {
    // his 20:03 ask: "can you test size 15 and 16?" for the L size: the manifest row's weapon name, the manifest column sort label, the form's
    // section labels. Every element of each kind is set to the size; one of each is shot in place, and its capitals measured against its box
    const T = [['name', 'div.wg-line > b', '.wg-h'], ['sort', 'button.wg-sort', 'button.wg-sort'], ['section', 'h4.f-h > span:not(.b4-hint)', 'h4.f-h']];
    await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
    const today = await p.evaluate((T) => T.map(([k, sel]) => { const e = [...document.querySelectorAll('#board ' + sel)].find((x) => BD.measure.visible(x)); return e ? `${k} ${getComputedStyle(e).fontSize} "${e.textContent.trim().slice(0, 16)}"` : `${k} NOT FOUND`; }), T); console.log(JSON.stringify(today));
    const D = path.join(__dirname, 'lsize'); fs.mkdirSync(D, { recursive: true }); const meas = [];
    for (const size of (process.env.L_SIZES || '13,14,15,16').split(',')) {
      for (const [k, sel, hostSel] of T) {
        const r2 = await p.evaluate((sel, hostSel, size) => { const M = BD.measure; const all = [...document.querySelectorAll('#board ' + sel)]; for (const e of all) { if (!e.dataset.lsOrig) e.dataset.lsOrig = getComputedStyle(e).fontSize; e.style.setProperty('font-size', size === 'today' ? e.dataset.lsOrig : size + 'px', 'important'); } M.atRest();
          const e = all.find((x) => M.visible(x)); if (!e) return null; const h = e.closest(hostSel) || e; h.scrollIntoView({ block: 'center' }); const b = h.getBoundingClientRect(); const te = e.querySelector('.tx-cap') || e; const tn = [...te.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim()); const L0 = tn && M.nodeLetters(tn); const lr = L0 && (L0.rect || L0);
          return { k: sel, size, fs: getComputedStyle(e).fontSize, caps: lr && lr.top != null ? `${(lr.top - b.top).toFixed(2)}/${(b.bottom - lr.bottom).toFixed(2)} in ${b.height.toFixed(0)}` : null, x: Math.max(0, b.left - 10), y: Math.max(0, b.top - 8), width: Math.min(340, b.width + 20), height: b.height + 16 }; }, sel, hostSel, size);
        if (!r2) continue; await new Promise((r) => setTimeout(r, 120)); await p.screenshot({ path: path.join(D, `${k}-${size}-full.png`) }); fs.writeFileSync(path.join(D, `${k}-${size}.json`), JSON.stringify(r2)); meas.push(r2);
      }
    }
    console.log(JSON.stringify(meas.map((m) => `${m.k} ${m.size}: ${m.fs} caps ${m.caps}`), null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'q3') {
    // his 20:35 asks: "show me the buttons you mean" (ring-only: Close ×, Format, Clear) beside fill, tint and ghost, at rest and hovered;
    // and the gaps the board uses today (CSS column/row gap of every visible flex or grid box with 2+ visible children, kinds per value)
    await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
    const gaps = await p.evaluate(() => { const M = BD.measure; const by = {}; for (const e of document.querySelectorAll('#board *')) { const c = getComputedStyle(e); if (!/flex|grid/.test(c.display) || !M.visible(e)) continue; const kids = [...e.children].filter((k) => M.visible(k)); if (kids.length < 2) continue; const row = /column/.test(c.flexDirection) || /grid/.test(c.display) ? c.rowGap : null; for (const g of [c.columnGap, row]) { if (!g || g === 'normal' || g === '0px') continue; const v = Math.round(parseFloat(g) * 10) / 10; (by[v] = by[v] || new Set()).add(M.selOf(e)); } } return Object.fromEntries(Object.entries(by).map(([k, v]) => [k, { kinds: v.size, ex: [...v].slice(0, 3) }])); });
    console.log('GAPS ' + JSON.stringify(gaps));
    const want = [['Fill', /^Stage this MP build$/], ['Tint', /^All\s*24$/], ['Ghost', /^Show them$/], ['Ground and ring', /^Clear$/], ['Ring only', /^Clear table$/], ['Ring only', /^Reset$/], ['Ring only', /^(Close|×)$/]];
    const D = path.join(__dirname, 'q3'); fs.mkdirSync(D, { recursive: true }); const shots = [];
    for (const [kind, re] of want) {
      const r = await p.evaluate((src) => { const re = new RegExp(src); const M = BD.measure; const b = [...document.querySelectorAll('#board button')].find((x) => M.visible(x) && (re.test((x.innerText || '').trim()) || re.test(x.getAttribute('aria-label') || '') || re.test(x.title || ''))); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); const c = getComputedStyle(b); return { cls: M.selOf(b), t: (b.innerText || b.getAttribute('aria-label') || '').trim().slice(0, 20), x: q.left + q.width / 2, y: q.top + q.height / 2, clip: { x: Math.max(0, q.left - 12), y: Math.max(0, q.top - 12), w: q.width + 24, h: q.height + 24 }, bg: c.backgroundColor, ring: c.boxShadow.slice(0, 60), border: c.borderTopWidth + ' ' + c.borderTopStyle, h: +q.height.toFixed(1) }; }, re.source);
      if (!r) { shots.push({ kind, re: re.source, found: false }); continue; }
      await p.mouse.move(1, 1); await new Promise((x) => setTimeout(x, 250)); await p.screenshot({ path: path.join(D, `${shots.length}-rest.png`) });
      await p.mouse.move(r.x, r.y); await new Promise((x) => setTimeout(x, 350)); await p.screenshot({ path: path.join(D, `${shots.length}-hover.png`) });
      shots.push({ kind, ...r, i: shots.length });
    }
    fs.writeFileSync(path.join(D, 'shots.json'), JSON.stringify(shots, null, 1)); console.log('SHOTS ' + JSON.stringify(shots.map((x) => `${x.kind} ${x.found === false ? 'NOT FOUND ' + x.re : x.cls + ' "' + x.t + '" h' + x.h + ' bg ' + x.bg + ' ring ' + x.ring + ' border ' + x.border}`), null, 1));
    await b.close(); srv.close(); return;
  }
  if (MODE === 'btns') {
    // his 22:30 "you're also missing MANY other button styles": every button in every walk view, board chrome excluded (measure.js inStage),
    // grouped by its look with colour and size left out as flags. The first of each look is shot at rest and hovered in the view it lives in.
    // Also his "wtf is using 2px as its gap?": every stage box with a 2px gap, shot in place
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: +(process.env.BD_DPR || 1) }); await new Promise((r) => setTimeout(r, 600));
    await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
    const D = path.join(__dirname, 'btns'); fs.mkdirSync(D, { recursive: true });
    await p.evaluate(() => { const M = BD.measure;
      const alpha = (c) => { if (!c || c === 'transparent') return 0; const m = c.match(/\/\s*([\d.]+)\s*\)$/) || c.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/); return m ? +m[1] : 1; };
      window.__look = (e) => { const T = M.paintTarget(e); const el = T && T.el ? T.el : e; const part = T && T.part && T.part !== 'self' ? T.part : null; const c = part ? getComputedStyle(el, part) : getComputedStyle(el); const r = e.getBoundingClientRect();
        const fill = /gradient/.test(c.backgroundImage) ? 'gradient' : alpha(c.backgroundColor) === 0 ? 'none' : alpha(c.backgroundColor) < 0.95 ? 'wash' : 'solid';
        const edge = parseFloat(c.borderTopWidth) > 0 || /\b1px\b|\b2px\b/.test(c.boxShadow) ? 'ring' : 'none';
        const rad = parseFloat(c.borderTopLeftRadius) || 0; const h = (part ? parseFloat(c.height) : r.height) || r.height; const shape = rad === 0 ? 'square' : rad >= h / 2 - 0.5 ? 'pill' : 'round';
        const icon = [...e.querySelectorAll('svg')].some((s) => M.visible(s)); const words = (e.innerText || '').trim(); const num = /\d/.test(words) && [...e.querySelectorAll('em, b, small, span')].some((x) => /^\d+$/.test((x.innerText || '').trim()));
        const content = (icon ? 'icon' : '') + (words && !/^\d+$/.test(words) ? (icon ? '+' : '') + 'words' : '') + (num ? '+count' : '') || 'empty';
        return { key: `${fill} · ${edge} · ${shape} · ${content}`, h: Math.round(r.height), colour: c.backgroundColor, sel: M.selOf(e), t: words.replace(/\s+/g, ' ').slice(0, 24) }; };
      window.__cen = new Map(); window.__cenN = 0; });
    const views = await p.evaluate(() => (window.BD_WALK && window.BD_WALK.views || []).map((v, i) => ({ i, g: v.g, label: v.label, kind: v.kind })));
    const gaps2 = await p.evaluate(() => { const M = BD.measure; const out = []; for (const e of document.querySelectorAll('#board *')) { const c = getComputedStyle(e); if (!/flex|grid/.test(c.display) || !M.visible(e) || !M.inStage(e)) continue; if (c.columnGap !== '2px' && c.rowGap !== '2px') continue; const kids = [...e.children].filter((k) => M.visible(k)); if (kids.length < 2) continue; e.setAttribute('data-g2', String(out.length)); out.push({ i: out.length, sel: M.selOf(e), gate: M.gateOf ? M.gateOf(e) : '', kids: kids.length, t: (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40) }); } return out; });
    for (const g of gaps2) { const r = await p.evaluate((i) => { const e = document.querySelector(`[data-g2="${i}"]`); e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(); return { x: Math.max(0, q.left - 12), y: Math.max(0, q.top - 12), w: Math.min(700, q.width + 24), h: q.height + 24 }; }, g.i); await new Promise((x) => setTimeout(x, 150)); await p.screenshot({ path: path.join(D, `gap2-${g.i}.png`) }); g.clip = r; }
    const looks = []; const skipped = [];
    for (const v of views) {
      if (v.kind === 'pop') { skipped.push(`${v.g} ${v.label}`); continue; }
      const ok = await p.evaluate((v) => { const M = BD.measure; const g = M.gateEl(v.g); if (!g) return false; const btn = [...g.querySelectorAll(v.kind === 'try' ? '.b4-try button' : '.pb-ctl button')].find((x) => x.textContent.trim() === v.label); if (btn) btn.click(); return !!btn || v.i === 0; }, v);
      await new Promise((x) => setTimeout(x, 700)); await p.evaluate(() => BD.measure.atRest());
      const fresh = await p.evaluate((v) => { const M = BD.measure; const g = M.gateEl(v.g); const out = []; if (!g) return out; const root = [g, ...document.querySelectorAll('.b4-pop, .b3-datepop, .f-menu')];
        for (const sc of root) for (const e of sc.querySelectorAll('button, [role=button]')) { if (!M.visible(e) || !M.inStage(e)) continue; const L = window.__look(e); if (!window.__cen.has(L.key)) { const id = window.__cenN++; window.__cen.set(L.key, { id, n: 0, gates: new Set(), hs: new Set(), colours: new Set(), ex: [] }); e.setAttribute('data-look', String(id)); out.push({ id, key: L.key }); } const G = window.__cen.get(L.key); G.n++; G.gates.add(v.g); G.hs.add(L.h); G.colours.add(L.colour); const nm = L.t || e.getAttribute('aria-label') || e.title || L.sel; if (G.ex.length < 6 && !G.ex.includes(nm)) G.ex.push(nm); }
        return out; }, v);
      for (const f of fresh) { const r = await p.evaluate((id) => { const e = document.querySelector(`[data-look="${id}"]`); e.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = e.getBoundingClientRect(); /* instant: a smooth scroll was still moving when the rect was read */ let rx = 1, ry = 1; for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const r = a.getBoundingClientRect(); if (r.width > q.width + 40) { rx = Math.max(r.left + 3, 1); ry = q.top + q.height / 2; if (rx > q.left - 2) { rx = r.right - 3; } break; } } /* rest = its row hovered, the button not: row actions only show while their row is hovered */ return { x: Math.max(0, q.left - 70), y: Math.max(0, q.top - 12), w: Math.min(560, q.width + 82), h: q.height + 24, cx: q.left + q.width / 2, cy: q.top + q.height / 2, rx, ry }; }, f.id); await p.mouse.move(r.rx, r.ry); await new Promise((x) => setTimeout(x, 250)); await p.screenshot({ path: path.join(D, `look-${f.id}-rest.png`) }); await p.mouse.move(r.cx, r.cy); await new Promise((x) => setTimeout(x, 350)); await p.screenshot({ path: path.join(D, `look-${f.id}-hover.png`) }); await p.mouse.move(1, 1); looks.push({ ...f, view: `${v.g} ${v.label}`, clip: r }); }
    }
    const groups = await p.evaluate(() => [...window.__cen].map(([key, G]) => ({ key, id: G.id, n: G.n, gates: [...G.gates], hs: [...G.hs].sort((a, b) => a - b), colours: G.colours.size, ex: G.ex })));
    const res = { views: views.length, skipped, gaps2, looks, groups }; fs.writeFileSync(path.join(D, 'census.json'), JSON.stringify(res, null, 1));
    console.log(JSON.stringify({ views: views.length, skipped: skipped.length, gaps2: gaps2.map((g) => `${g.sel} (${g.kids} items) "${g.t}"`), groups: groups.sort((a, b) => b.n - a.n).map((g) => `${g.n} · ${g.key} · h ${g.hs.join('/')} · colours ${g.colours} · ${g.ex.slice(0, 4).join(' | ')}`) }, null, 1));
    await b.close(); srv.close(); return;
  }
  if (MODE === 'gap2draw') {
    // his 22:47 "i need to see it physically drawn on the button where you mean": each kind of box with a 2px CSS gap, one of each, with the
    // space between its items painted magenta and labelled with what it measures (the drawn space between the items' boxes, not the CSS)
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: +(process.env.BD_DPR || 1) }); await new Promise((r) => setTimeout(r, 600));
    await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; BD.measure.atRest(); });
    const boxes = await p.evaluate(() => { const M = BD.measure; const seen = new Set(); const out = []; for (const e of document.querySelectorAll('#board *')) { const c = getComputedStyle(e); if (!/flex|grid/.test(c.display) || !M.visible(e) || !M.inStage(e)) continue; if (c.columnGap !== '2px' && c.rowGap !== '2px') continue; const k = M.selOf(e); if (seen.has(k)) continue; const kids = [...e.children].filter((x) => M.visible(x)); if (kids.length < 2) continue; seen.add(k); e.setAttribute('data-gd', String(out.length)); out.push({ i: out.length, sel: k, col: /column/.test(c.flexDirection) }); } return out; });
    const D = path.join(__dirname, 'gap2draw'); fs.mkdirSync(D, { recursive: true }); const res = [];
    for (const bx of boxes) {
      const r = await p.evaluate((i) => { const e = document.querySelector(`[data-gd="${i}"]`); e.scrollIntoView({ block: 'center', behavior: 'instant' }); document.querySelectorAll('.gd-ov').forEach((x) => x.remove());
        const M = BD.measure; M.setDescend && M.setDescend(true); const drawn0 = (x) => { const T = M.paintTarget(x); if (!T || !T.el) return x.getBoundingClientRect(); if (T.part && T.part !== 'self') { const r = T.el.getBoundingClientRect(); const c = getComputedStyle(T.el, T.part); const L = parseFloat(c.left) || 0, Tp = parseFloat(c.top) || 0, W = parseFloat(c.width) || r.width, H = parseFloat(c.height) || r.height; return { left: r.left + L, top: r.top + Tp, right: r.left + L + W, bottom: r.top + Tp + H, width: W, height: H }; } return T.el.getBoundingClientRect(); }; const drawn = (x) => { const sn = M.seen(x); return sn && sn.left != null ? sn : drawn0(x); }; /* the builder's own drawn edge (his 23:01: the tier strip draws 10, not the 2 its boxes say) */ const kids = [...e.children].filter((x) => M.visible(x)).map(drawn); const col = /column/.test(getComputedStyle(e).flexDirection) || (kids.length > 1 && Math.abs(kids[1].top - kids[0].top) > Math.abs(kids[1].left - kids[0].left));
        kids.sort((a, b) => (col ? a.top - b.top : a.left - b.left)); const gaps = [];
        for (let k = 0; k + 1 < kids.length; k++) { const a = kids[k], b = kids[k + 1]; const g = col ? b.top - a.bottom : b.left - a.right; if (g <= 0 || g > 40) continue; const rect = col ? { l: Math.min(a.left, b.left), t: a.bottom, w: Math.max(a.right, b.right) - Math.min(a.left, b.left), h: g } : { l: a.right, t: Math.min(a.top, b.top), w: g, h: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top) }; gaps.push(+g.toFixed(2));
          const ov = document.createElement('div'); ov.className = 'gd-ov'; Object.assign(ov.style, { position: 'fixed', left: rect.l + 'px', top: rect.t + 'px', width: rect.w + 'px', height: rect.h + 'px', background: 'rgba(255,0,200,0.85)', zIndex: 2147483647, pointerEvents: 'none' }); document.body.appendChild(ov); }
        const q = e.getBoundingClientRect(); return { gaps, x: Math.max(0, q.left - 16), y: Math.max(0, q.top - 16), w: Math.min(760, q.width + 32), h: Math.min(420, q.height + 32) }; }, bx.i);
      await new Promise((x) => setTimeout(x, 150)); await p.screenshot({ path: path.join(D, `g-${bx.i}.png`) }); res.push({ ...bx, ...r });
    }
    fs.writeFileSync(path.join(D, 'gaps.json'), JSON.stringify(res, null, 1)); console.log(JSON.stringify(res.map((x) => `${x.sel}: ${x.gaps.join(' ')}`), null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'gapapi') {
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: +(process.env.BD_DPR || 1) }); await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate(() => { const M = BD.measure; M.atRest(); M.setDescend && M.setDescend(true); const out = {};
      for (const sel of ['div.f-tiers', 'div.wg-acts.cx-acts', 'div.f-src', 'div.seg', 'div.b3-tk-fs', 'span.b3-meter']) { const e = [...document.querySelectorAll('#board ' + sel)].find((x) => M.visible(x) && M.inStage(x)); if (!e) { out[sel] = 'none'; continue; }
        let g = null; try { g = M.gaps(e); } catch (x) { g = 'ERR ' + x.message; }
        const kids = [...e.children].filter((x) => M.visible(x)).map((x) => { let sn = null; try { sn = M.seen(x); } catch (z) { sn = 'ERR'; } return sn && sn.left != null ? [sn.left, sn.right].map((v) => +v.toFixed(1)).join('–') : JSON.stringify(sn).slice(0, 80); });
        out[sel] = { gaps: JSON.stringify(g).slice(0, 300), seen: kids }; }
      return out; });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'meterwhy') {
    // which builder rule turns the History meter's bars into 8px squares with his saved values (his 23:01 "that's actually broken")
    const r = await p.evaluate(() => { const i0 = [...document.querySelectorAll('#board span.b3-meter > i')].find((x) => x.getBoundingClientRect().width > 0); const sh = document.getElementById('bd-std').sheet; const hits = [];
      for (const rule of sh.cssRules) { try { if (rule.selectorText && i0.matches(rule.selectorText)) hits.push(rule.cssText.slice(0, 400)); } catch (e) {} }
      const anc = []; for (let a = i0; a && anc.length < 8; a = a.parentElement) anc.push(BD.measure.selOf(a)); return { hits, anc }; });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'tokens') {
    // the kit's own :root tokens for the design-system board (Harkirat 2026-10-05 23:16 EDT): every custom property declared on :root/html by
    // the kit's stylesheets (not the builder's), its source text, its resolved value, and how many kit rules use it, with one example selector
    const r = await p.evaluate(() => { const decl = new Map(); const uses = new Map();
      for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; } const href = sh.href || (sh.ownerNode && sh.ownerNode.id) || 'inline'; if (/\/bd\/|^bd-/.test(href)) continue; /* the builder's own sheets; every kit sheet lives under builder-2/ too */
        const walk = (list) => { for (const ru of list) { if (ru.cssRules && !ru.selectorText) { walk(ru.cssRules); continue; } if (!ru.style) continue; const sel = ru.selectorText || '';
          if (/(^|,)\s*(:root|html)\s*(,|$)/.test(sel)) for (let i = 0; i < ru.style.length; i++) { const n = ru.style[i]; if (n.startsWith('--') && !decl.has(n)) decl.set(n, { raw: ru.style.getPropertyValue(n).trim(), file: href.split('/').slice(-2).join('/') }); }
          const t = ru.style.cssText; const m = t.match(/var\(--[A-Za-z0-9_-]+/g); if (m) for (const v of new Set(m.map((x) => x.slice(4)))) { const u = uses.get(v) || { n: 0, ex: [] }; u.n++; if (u.ex.length < 2) u.ex.push(sel.slice(0, 60)); uses.set(v, u); } } };
        walk(rules); }
      const probe = document.createElement('div'); document.body.appendChild(probe); const out = [];
      for (const [n, d] of decl) { probe.style.cssText = `color: rgb(1,2,3); color: var(${n}); width: 0; width: var(${n}); font-family: x; font-family: var(${n})`; const c = getComputedStyle(probe); const col = c.color !== 'rgb(1, 2, 3)' ? c.color : null; const w = c.width !== '0px' ? c.width : null; const ff = c.fontFamily !== 'x' ? c.fontFamily : null; const u = uses.get(n) || { n: 0, ex: [] }; out.push({ n, raw: d.raw.slice(0, 90), file: d.file, col, w, ff: ff && ff.slice(0, 80), uses: u.n, ex: u.ex }); }
      probe.remove(); return out; });
    fs.writeFileSync(path.join(__dirname, 'kit-tokens.json'), JSON.stringify(r, null, 1)); console.log('tokens', r.length, 'colours', r.filter((x) => x.col).length, 'lengths', r.filter((x) => x.w).length, 'fonts', r.filter((x) => x.ff && /,/.test(x.ff)).length); await b.close(); srv.close(); return;
  }
  if (MODE === 'icons') {
    // the kit's icon sprite for the design-system board (Harkirat 2026-10-05 23:21 EDT, "finish the design system artifact"): every <symbol>
    // the page defines, as a standalone SVG drawn in ink (an <img> cannot inherit currentColor), plus which symbols the board actually uses
    const r = await p.evaluate(() => { const used = new Set([...document.querySelectorAll('use')].map((u) => (u.getAttribute('href') || u.getAttribute('xlink:href') || '').replace(/^#/, '')));
      return [...document.querySelectorAll('symbol[id]')].map((sy) => { const vb = sy.getAttribute('viewBox') || '0 0 24 24'; const attrs = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'].map((a) => sy.getAttribute(a) ? `${a}="${sy.getAttribute(a)}"` : '').join(' ');
        return { id: sy.id, used: used.has(sy.id), svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="${vb}" fill="none" stroke="#E8EDF1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${attrs.replace(/currentColor/g, '#E8EDF1')}>${sy.innerHTML.replace(/currentColor/g, '#E8EDF1')}</svg>` }; }); });
    const D = path.join(ROOT, 'local/pins2/s4/design-system/icons-src'); fs.mkdirSync(D, { recursive: true }); for (const x of r) fs.writeFileSync(path.join(D, `${x.id}.svg`), x.svg);
    console.log(JSON.stringify({ n: r.length, used: r.filter((x) => x.used).length, ids: r.map((x) => x.id + (x.used ? '' : '*')).join(' ') })); await b.close(); srv.close(); return;
  }
  if (MODE === 'qs') {
    // quick select stage A, the proof (plan local/pins2/s4/quick-select-plan.md): a different icon button joins the group of C1's row-action
    // icon buttons (B-04) after the group takes the share button's look; at rest, hovered, pressed and focused, the joined button's drawing
    // must read like the reference's. States are forced through DevTools, the way the browser itself would apply them
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: +(process.env.BD_DPR || 1) }); await new Promise((r) => setTimeout(r, 600));
    const MEM = process.env.QS_MEM || 'button.b3-x';
    if (process.env.QS_BEFORE) await p.evaluate(() => { window.__qsBefore = true; }); /* the falsifier: the same comparison with no join must differ */
    const setup = await p.evaluate((MEM) => { const M = BD.measure, Sd = BD.std; const vis = (q) => [...document.querySelectorAll('#board ' + q)].find((x) => M.visible(x));
      const ref = vis('button.wg-ib.wg-share'); const mem = vis(MEM); if (!ref || !mem) return { err: `ref ${!!ref} mem ${!!mem}` };
      ref.setAttribute('data-qs', 'ref'); mem.setAttribute('data-qs', 'mem'); if (window.__qsBefore) return { before: true }; const okL = Sd.setLook('B-04', ref); Sd.addMembers('B-04', [mem]);
      const v = Sd.get('B-04'); return { okL, entries: v.look.entries.length, parts: [...new Set(v.look.entries.map((e) => e.part))], states: [...new Set(v.look.entries.map((e) => e.state))], skipped: v.look.skipped.length, memSel: M.selOf(mem), memberCount: v.members.length }; }, MEM);
    console.log('SETUP ' + JSON.stringify(setup)); if (setup.err) { await b.close(); srv.close(); return; }
    const cdp = await p.target().createCDPSession(); await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: false });
    const nid = async (q) => (await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: q })).nodeId; const refN = await nid('[data-qs=ref]'), memN = await nid('[data-qs=mem]');
    const read = () => p.evaluate(() => { const P = ['background-color', 'background-image', 'box-shadow', 'border-top-width', 'border-top-color', 'border-top-left-radius', 'color', 'opacity', 'transform', 'outline-style', 'outline-color'];
      const one = (el) => { const o = {}; const T = BD.measure.paintTarget(el); const sn = BD.measure.seen ? BD.measure.seen(el) : null; const eb = el.getBoundingClientRect(); if (sn && sn.width != null) o['drawn box'] = `${sn.width.toFixed(1)}x${sn.height.toFixed(1)} centred ${(sn.left + sn.width / 2 - (eb.left + eb.width / 2)).toFixed(1)},${(sn.top + sn.height / 2 - (eb.top + eb.height / 2)).toFixed(1)}`; for (const part of ['', '::before']) { const c = getComputedStyle(el, part || null); if (part && (c.content === 'none' || c.content === 'normal')) { o[part + 'content'] = 'none'; continue; } for (const k of P) o[part + k] = c.getPropertyValue(k); } const sv = el.querySelector('svg'); if (sv) { const c = getComputedStyle(sv); o['svg stroke'] = c.stroke; o['svg color'] = c.color; } return o; };
      BD.measure.atRest(); return { ref: one(document.querySelector('[data-qs=ref]')), mem: one(document.querySelector('[data-qs=mem]')) }; });
    const res = {};
    for (const [name, st] of [['rest', []], ['hover', ['hover']], ['pressed', ['hover', 'active']], ['focus', ['focus', 'focus-visible']]]) {
      await cdp.send('CSS.forcePseudoState', { nodeId: refN, forcedPseudoClasses: st }); await cdp.send('CSS.forcePseudoState', { nodeId: memN, forcedPseudoClasses: st }); await new Promise((r) => setTimeout(r, 250));
      const r = await read(); res[name] = Object.keys(r.ref).filter((k) => r.ref[k] !== r.mem[k]).map((k) => `${k}: ref ${r.ref[k]} | mem ${r.mem[k]}`);
    }
    await cdp.send('CSS.forcePseudoState', { nodeId: refN, forcedPseudoClasses: [] }); await cdp.send('CSS.forcePseudoState', { nodeId: memN, forcedPseudoClasses: [] });
    for (const [k, v] of Object.entries(res)) console.log(`${k}: ${v.length} differences` + (v.length ? '\n   ' + v.slice(0, 14).join('\n   ') : ''));
    await b.close(); srv.close(); return;
  }
  if (MODE === 'qsshot') {
    // pictures for the quick-select proof: the reference (C1 share button), and the joined button before and after, at rest and hovered
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 2 }); await new Promise((r) => setTimeout(r, 600));
    await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; const vis = (q) => [...document.querySelectorAll('#board ' + q)].find((x) => BD.measure.visible(x)); vis('button.wg-ib.wg-share').setAttribute('data-qs', 'ref'); vis('button.b3-x').setAttribute('data-qs', 'mem'); });
    const D = path.join(__dirname, 'qs'); fs.mkdirSync(D, { recursive: true }); const cdp = await p.target().createCDPSession(); await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const shot = async (who, name, st) => { const q = `[data-qs=${who}]`; const n = (await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: q })).nodeId; await cdp.send('CSS.forcePseudoState', { nodeId: n, forcedPseudoClasses: st }); const r = await p.evaluate((q) => { const e = document.querySelector(q); e.scrollIntoView({ block: 'center', behavior: 'instant' }); BD.measure.atRest(); const b = e.getBoundingClientRect(); return { x: b.left - 14, y: b.top - 14, w: b.width + 28, h: b.height + 28 }; }, q); await new Promise((x) => setTimeout(x, 200)); await p.screenshot({ path: path.join(D, `${name}.png`), clip: { x: r.x, y: r.y + await p.evaluate(() => scrollY), width: r.w, height: r.h }, captureBeyondViewport: false }); await cdp.send('CSS.forcePseudoState', { nodeId: n, forcedPseudoClasses: [] }); };
    await shot('ref', 'ref-rest', []); await shot('ref', 'ref-hover', ['hover']); await shot('mem', 'mem-before-rest', []); await shot('mem', 'mem-before-hover', ['hover']);
    await p.evaluate(() => { const Sd = BD.std; Sd.setLook('B-04', document.querySelector('[data-qs=ref]')); Sd.addMembers('B-04', [document.querySelector('[data-qs=mem]')]); });
    await new Promise((r) => setTimeout(r, 300)); await shot('mem', 'mem-after-rest', []); await shot('mem', 'mem-after-hover', ['hover']);
    console.log('shots done'); await b.close(); srv.close(); return;
  }
  if (MODE === 'gate') {
    // gate by gate (Harkirat 2026-10-06 10:40 EDT): one gate's parts and every value off the agreed sets, measured on drawn edges (M.seen),
    // board chrome excluded (M.inStage). Text sizes vs 9/11/13/15, drawn control heights vs 44/32/28/24, corners vs height × 0.25, gaps vs
    // 6/10/14/20/26/32 between consecutive drawn items
    const G = process.env.GATE || 'C1';
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 2 }); await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate((G) => { const M = BD.measure; M.atRest(); M.setDescend && M.setDescend(true); const g = M.gateEl(G); if (!g) return { err: 'no gate' };
      const TEXT = [9, 11, 13, 15], H = [44, 32, 28, 24], GAP = [6, 10, 14, 20, 26, 32];
      const AREAS = [['.mtools', 'Toolbar'], ['.wg-heads', 'List head'], ['.wg-acts', 'Row actions'], ['.wg-rail', 'Attachments'], ['.wg-h', 'Weapon row'], ['.wg-r', 'Build row'], ['.wg-wrap', 'Manifest']];
      const area = (e) => { for (const [q, n] of AREAS) if (e.closest(q)) return n; return 'Other: ' + (M.selOf(e.parentElement || e) || '').slice(0, 30); };
      const near = (v, set) => set.some((x) => Math.abs(x - v) < 0.3);
      const out = { text: {}, height: {}, radius: {}, gap: {} }; const add = (k, a, v, ex) => { const key = a + ' | ' + v; const o = out[k][key] = out[k][key] || { n: 0, ex: [] }; o.n++; if (o.ex.length < 3 && !o.ex.includes(ex)) o.ex.push(ex); };
      for (const e of g.querySelectorAll('*')) { if (!M.visible(e) || !M.inStage(e)) continue; const c = getComputedStyle(e); const a = area(e); const nm = (e.innerText || e.getAttribute('aria-label') || e.title || M.selOf(e)).trim().replace(/\s+/g, ' ').slice(0, 26);
        if ([...e.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim())) { const fs = parseFloat(c.fontSize); if (!near(fs, TEXT)) add('text', a, fs + 'px ' + (/Mono/.test(c.fontFamily) ? 'mono' : 'sg'), nm); }
        if (M.kindOf(e) === 'control' && (e.tagName === 'BUTTON' || e.getAttribute('role') === 'button')) { const sn = M.seen(e); if (sn && sn.height) { const h = Math.round(sn.height * 10) / 10; if (!near(h, H)) add('height', a, h + 'px', nm); const T = M.paintTarget(e); const pc = T && T.part && T.part !== 'self' ? getComputedStyle(T.el, T.part) : c; const rad = parseFloat(pc.borderTopLeftRadius) || 0; if (rad > 0 && rad < 100 && Math.abs(rad - h * 0.25) >= 0.5) add('radius', a, `${rad}px on ${h}px (wants ${+(h * 0.25).toFixed(1)})`, nm); } }
        if (/flex|grid/.test(c.display)) { const kids = [...e.children].filter((k) => M.visible(k)).map((k) => ({ k, s: M.seen(k) })).filter((x) => x.s && x.s.width); if (kids.length < 2) continue; const col = /column/.test(c.flexDirection) || (/grid/.test(c.display) && Math.abs(kids[1].s.top - kids[0].s.top) > 4 && Math.abs(kids[1].s.left - kids[0].s.left) < 4);
          for (let i = 0; i + 1 < kids.length; i++) { const A = kids[i].s, B = kids[i + 1].s; const gp = col ? B.top - A.bottom : B.left - A.right; if (gp <= 0.4 || gp > 60 || (!col && Math.abs(A.top - B.top) > 20)) continue; const v = Math.round(gp * 10) / 10; if (!near(v, GAP)) add('gap', a, v + 'px', `${M.selOf(e).slice(0, 30)}: ${(kids[i].k.innerText || M.selOf(kids[i].k)).trim().slice(0, 12)} → ${(kids[i + 1].k.innerText || M.selOf(kids[i + 1].k)).trim().slice(0, 12)}`); } } }
      return out; }, G);
    fs.writeFileSync(path.join(__dirname, `gate-${G}.json`), JSON.stringify(r, null, 1));
    for (const k of ['text', 'height', 'radius', 'gap']) { const rows = Object.entries(r[k] || {}).sort((a, b) => a[0].localeCompare(b[0])); console.log(`== ${k}: ${rows.length} off-set values`); for (const [key, o] of rows) console.log(`  ${key} ×${o.n} · ${o.ex.join(' | ')}`); }
    await b.close(); srv.close(); return;
  }
  if (MODE === 'fx5') {
    // his 10:58 #5: making the image chip a variant breaks the problem chip in the row above. Which selector the variant's member gets, which
    // elements it reaches, and what the problem chip looks like before and after
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 2 }); await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate(() => { const M = BD.measure, Sd = BD.std; const all = [...document.querySelectorAll('#board button.b3-fchip')].filter((x) => M.visible(x));
      const img = all.find((x) => /image/i.test((x.getAttribute('aria-label') || '') + (x.title || ''))); const prob = all.find((x) => /problem/i.test(x.innerText || ''));
      const box = (e) => { const b = e.getBoundingClientRect(); return `${b.width.toFixed(1)}x${b.height.toFixed(1)}`; };
      const sel = M.selOf(img); const reach = [...document.querySelectorAll('#board ' + sel)]; const before = box(prob);
      const id = Sd.create('control', [img]); const v = Sd.get(id); const mem = v.members.map((m) => m.sel + '|' + m.part);
      const reach2 = v.members.flatMap((m) => [...document.querySelectorAll('#board ' + m.sel)]); const kinds = {}; for (const e of reach2) { const k = /image/i.test(e.getAttribute('aria-label') || '') ? 'image chip' : /problem/i.test(e.innerText || '') ? 'problem chip' : 'other ' + (e.innerText || '').trim().slice(0, 16); kinds[k] = (kinds[k] || 0) + 1; }
      Sd.setValue && Sd.beginChange && (Sd.beginChange(id), Sd.setValue(id, 'height', 36), Sd.endChange && Sd.endChange());
      const ib = img.getBoundingClientRect(); const row = img.parentElement.getBoundingClientRect(); return { imgCentreOff: +((ib.top + ib.height / 2) - (row.top + row.height / 2)).toFixed(2), imgSel: v.members.map((m) => m.sel).join(' , '),  sel, reachCount: reach.length, members: mem, reaches: kinds, probBefore: before, probAfter: box(prob), imgAfter: box(img), imgTop: ib.top.toFixed(1), html: img.outerHTML.slice(0, 220), probHtml: prob.outerHTML.slice(0, 200) }; });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'fx4') {
    // his 10:58 #4: the Collapse/Expand icon-revealing button is broken: hovered, "Collapse" spills out of its ring. The button and its label,
    // at rest and hovered, with his state and with nothing set, plus every builder rule that reaches them
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 2 }); await new Promise((r) => setTimeout(r, 600));
    await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
    const pt = await p.evaluate(() => { const b = [...document.querySelectorAll('#board button.b4-fold')].find((x) => BD.measure.visible(x)); b.setAttribute('data-fx4', ''); b.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    const read = () => p.evaluate(() => { const b = document.querySelector('[data-fx4]'); const l = b.querySelector('.b3-xf-ibl'); const c = getComputedStyle(b), lc = l && getComputedStyle(l); const r = b.getBoundingClientRect(), lr = l && l.getBoundingClientRect();
      return { btn: `${r.width.toFixed(1)}x${r.height.toFixed(1)} pad ${c.padding} gap ${c.columnGap} w ${c.width} minw ${c.minWidth} maxw ${c.maxWidth} flex ${c.flex} ovf ${c.overflow}`, label: l ? `${lr.width.toFixed(1)} left ${(lr.left - r.left).toFixed(1)} right-out ${(lr.right - r.right).toFixed(1)} w ${lc.width} maxw ${lc.maxWidth} ml ${lc.marginLeft} op ${lc.opacity} ovf ${lc.overflow}` : 'none' }; });
    const rest = await read(); await p.mouse.move(pt.x, pt.y); await new Promise((r) => setTimeout(r, 700)); const hov = await read(); await p.mouse.move(1, 1);
    const rules = await p.evaluate(() => { const b = document.querySelector('[data-fx4]'); const l = b.querySelector('.b3-xf-ibl'); const out = []; for (const r of document.getElementById('bd-std').sheet.cssRules) { try { if (r.selectorText && (b.matches(r.selectorText.replace(/:hover|::before|::after/g, '')) || (l && l.matches(r.selectorText.replace(/:hover|::before|::after/g, ''))))) out.push(r.cssText.slice(0, 230)); } catch (e) {} } return out; });
    const kit = await p.evaluate(() => { const out = []; for (const r of (window.BD_RULES.rules || [])) { if (/b3-xf-ib|b4-fold|b3-xf-ibl/.test(r.s)) out.push(`${r.s.slice(0, 90)} {${r.d.map((d) => d[0] + ':' + d[1]).join(';').slice(0, 160)}}`); } return out.slice(0, 14); });
    console.log(JSON.stringify({ rest, hov, builderRules: rules, kitRules: kit }, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'raster') {
    // the drawn space inside a control, read off the pixels (Harkirat 2026-10-06 12:10 EDT: "confused why it's stating the padding inside as
    // '9' when it's clearly '8'"): the ring's edges and the glyph's painted pixels, against what the builder's model reads
    const G = process.env.GATE || 'C1', SEL = process.env.SEL || 'button.wg-ib.wg-share', D = 4;
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: D }); await new Promise((r) => setTimeout(r, 600));
    const info = await p.evaluate((G, SEL) => { const M = BD.measure; M.setDescend && M.setDescend(true); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; const g = M.gateEl(G); const el = [...g.querySelectorAll(SEL)].find((e) => M.visible(e)); el.scrollIntoView({ block: 'center' }); M.atRest(); const T = M.paintTarget(el); const I = M.inside(el); const sv = el.querySelector('svg'); const ib = sv ? M.iconBox(sv) : null; const sr = sv ? sv.getBoundingClientRect() : null;
      return { ring: T.rect, part: T.part, model: I && { left: +I.left.toFixed(2), right: +I.right.toFixed(2), top: +I.top.toFixed(2), bottom: +I.bottom.toFixed(2) }, ink: ib && { l: ib.left, t: ib.top, w: ib.width, h: ib.height }, svgBox: sr && { l: sr.left, t: sr.top, w: sr.width, h: sr.height }, stroke: sv ? getComputedStyle(sv).strokeWidth : null }; }, G, SEL);
    const r = info.ring; const shot = await p.screenshot({ encoding: 'base64', clip: undefined });
    const px = await p.evaluate(async (b64, r, D) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); const x0 = Math.floor((r.left - 4) * D), y0 = Math.floor((r.top - 4) * D), w = Math.ceil((r.width + 8) * D), hh = Math.ceil((r.height + 8) * D); c.width = w; c.height = hh; const ctx = c.getContext('2d'); ctx.drawImage(img, -x0, -y0); const d = ctx.getImageData(0, 0, w, hh).data; const at = (x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2]]; }; const lum = (q) => 0.2126 * q[0] + 0.7152 * q[1] + 0.0722 * q[2];
      // the fill: the median of a band just inside the ring, away from the glyph; glyph pixels are much lighter than it
      const cx = Math.round(w / 2), band = []; for (let x = Math.round(6 * D); x < w - 6 * D; x++) band.push(lum(at(x, Math.round(6.5 * D)))); band.sort((a, b) => a - b); const fill = band[Math.floor(band.length / 2)];
      let gx0 = w, gx1 = -1, gy0 = hh, gy1 = -1; const inL = Math.round(5.5 * D), inR = w - Math.round(5.5 * D), inT = Math.round(5.5 * D), inB = hh - Math.round(5.5 * D);
      for (let y = inT; y < inB; y++) for (let x = inL; x < inR; x++) { if (lum(at(x, y)) - fill > 40) { gx0 = Math.min(gx0, x); gx1 = Math.max(gx1, x); gy0 = Math.min(gy0, y); gy1 = Math.max(gy1, y); } }
      // the ring's outer edge along the middle row and column: the first pixel that differs from the page outside it
      const row = Math.round(hh / 2), col = cx; const out = lum(at(1, row)); let rl = 0; while (rl < w / 2 && Math.abs(lum(at(rl, row)) - out) < 12) rl++; let rr = w - 1; while (rr > w / 2 && Math.abs(lum(at(rr, row)) - out) < 12) rr--; const outT = lum(at(col, 1)); let rt = 0; while (rt < hh / 2 && Math.abs(lum(at(col, rt)) - outT) < 12) rt++; let rb = hh - 1; while (rb > hh / 2 && Math.abs(lum(at(col, rb)) - outT) < 12) rb--;
      return { fill: +fill.toFixed(1), glyph: { left: (gx0 - rl) / D, right: (rr + 1 - (gx1 + 1)) / D, top: (gy0 - rt) / D, bottom: (rb + 1 - (gy1 + 1)) / D, w: (gx1 + 1 - gx0) / D, h: (gy1 + 1 - gy0) / D }, ringPx: { w: (rr + 1 - rl) / D, h: (rb + 1 - rt) / D } }; }, shot, r, D);
    console.log('ring (model)', JSON.stringify({ w: +r.width.toFixed(2), h: +r.height.toFixed(2), part: info.part }), 'ring (pixels)', JSON.stringify(px.ringPx));
    console.log('space inside, model ', JSON.stringify(info.model)); console.log('space inside, pixels', JSON.stringify(px.glyph), 'fill', px.fill);
    console.log('icon box', JSON.stringify(info.svgBox), 'ink (model)', JSON.stringify(info.ink), 'stroke', info.stroke);
    await b.close(); srv.close(); return;
  }
  if (MODE === 'selshot') {
    // the builder with one element selected (env SEL, first visible on GATE), shot as he sees it: its marks on the page and its panel
    const G = process.env.GATE || 'C1', SEL = process.env.SEL;
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 2 }); await new Promise((r) => setTimeout(r, 600));
    await p.evaluate(async (G, SEL) => { const B = window.__bd, M = BD.measure; M.setDescend && M.setDescend(true); const g = M.gateEl(G); const el = [...g.querySelectorAll(SEL)].find((e) => M.visible(e)); el.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 300)); B.ui.select([el]); await new Promise((r) => setTimeout(r, 700)); B.ui.draw && B.ui.draw(); }, G, SEL);
    await new Promise((r) => setTimeout(r, 500)); await p.screenshot({ path: path.join(__dirname, 'selshot.png') }); console.log('selshot.png'); await b.close(); srv.close(); return;
  }
  if (MODE === 'rules') {
    // every kit rule (source file:line) that sets a property on the first visible match of a selector: the layers a component's value is
    // fought over, so a rewrite can keep one rule per property and delete the rest (Harkirat, 2026-10-06 15:11 EDT: fix the convention)
    const LIST = [
      ['C1', 'div.mtools', 'padding gap row-gap column-gap display grid-template-columns'], ['C1', 'div.mt-r1', 'display gap column-gap grid-template-columns'], ['C1', 'div.mt-r2', 'display gap column-gap row-gap grid-template-columns flex-wrap'], ['C1', 'span.mt-grp', 'display gap'], ['C1', 'span.mt-chips', 'gap column-gap row-gap'], ['C1', 'span.mlabel', 'font font-weight font-size letter-spacing line-height width min-width text-align color margin-right'],
      ['C8', 'div.mtools', 'padding row-gap gap'], ['C8', 'div.mt-r1', 'display grid-template-columns gap column-gap'], ['C8', 'span.mlabel', 'width min-width text-align font font-weight'], ['C8', 'div.b3-hi-f', 'display grid-template-columns gap column-gap row-gap padding'], ['C8', 'div.b3-fg', 'gap display'], ['C8', 'div.b3-fgc', 'gap row-gap column-gap'], ['C8', 'span.b3-fgl', 'width font font-weight letter-spacing color'],
      ['C1', 'button.chip.topic', 'padding gap font font-size font-weight height min-height border border-radius'], ['C1', 'button.chip.topic > i', 'width height'], ['C1', 'button.chip.topic > em', 'font font-weight font-size margin-left'], ['C1', 'button.chip.topic > span.cl', 'font font-size color'],
      ['C8', 'button.b3-fc', 'padding gap font font-size font-weight height border-radius'], ['C8', 'button.b3-fc > svg', 'width height'], ['C8', 'button.b3-fc > em', 'font font-size font-weight margin-left'],
      ['C1', 'span.srch > input', 'padding height border-radius font font-weight font-size'], ['C1', 'span.srch > svg', 'left width height margin-top'],
      ['C1', 'button.pill.lead.madd', 'padding gap font font-size height min-height border-radius'], ['C1', 'button.pill.lead.madd > svg', 'width height'],
      ['C1', 'button.wg-fold', 'padding gap font font-size height'], ['C1', 'button.wg-fold > svg', 'width height'],
      ['C1', 'div.wg-h', 'padding grid-template-columns column-gap gap'], ['C1', 'div.wg-line > b', 'font font-size'], ['C1', 'button.wg-ib.wg-fbtn', 'padding column-gap grid-template-columns margin-right'], ['C1', 'div.wg-h > .wg-fwrap', 'margin-right margin-left'],
      ['C1', 'div.wg-r', 'padding grid-template-columns column-gap'], ['C1', 'div.wg-main.named', 'padding column-gap gap grid-template-columns'], ['C1', 'span.wg-plate', 'padding gap row-gap font font-size'], ['C1', 'span.wg-an', 'font font-size'], ['C1', 'span.wg-at', 'font font-size padding'],
      ['C1', 'div.wg-acts', 'gap column-gap'], ['C1', '.wg-imh button.b3-fchip', 'width height min-width'], ['C1', 'button.wg-code', 'width border-radius'], ['C1', 'span.wg-ig', 'width border-radius'], ['C1', 'span.wg-igf', 'padding width flex'], ['C1', 'span.wg-igb', 'width'], ['C1', 'button.wg-ib.wg-share > svg', 'width height'],
    ];
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 1 }); await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate((LIST) => { const M = BD.measure, W = BD.why; const R = window.BD_RULES; const out = [];
      const fam = (p) => [p, p.split('-')[0], p.replace(/-(top|right|bottom|left)$/, ''), p === 'row-gap' || p === 'column-gap' ? 'gap' : p, /^font-/.test(p) ? 'font' : p, /^border-.*radius$/.test(p) ? 'border-radius' : p];
      for (const [G, q, props] of LIST) { const g = M.gateEl(G); const el = g && [...g.querySelectorAll(q)].find((e) => M.visible(e)); if (!el) { out.push(`## ${G} ${q}: none`); continue; } out.push(`## ${G} ${q}`); const want = props.split(' ');
        for (const ru of R.rules) { const decl = ru.d.filter(([pp]) => want.some((w) => fam(w).includes(pp) || fam(pp).includes(w))); if (!decl.length) continue; let hit = false; for (const alt of W.splitSel(ru.s)) { const a = alt.replace(/::?(before|after|placeholder)\s*$/, ''); if (a !== alt) continue; try { if (el.matches(a)) { hit = true; break; } } catch (e) {} } if (!hit) continue; const med = ru.m && ru.m.length ? ` @${ru.m.join(' ')}` : ''; out.push(`  ${R.files[ru.f]}:${ru.l}${med} ${ru.s.slice(0, 90)} { ${decl.map(([pp, v, imp]) => `${pp}:${v}${imp ? '!' : ''}`).join('; ').slice(0, 160)} }`); } }
      return out; }, LIST);
    console.log(r.join('\n')); await b.close(); srv.close(); return;
  }
  if (MODE === 'spec') {
    // Harkirat's values (c1-spec.json) read on the bare kit with the builder's own readers: want, got, and the kit rule that sets each one now
    const SPEC = JSON.parse(fs.readFileSync(path.join(__dirname, process.env.SPEC || 'c1-spec.json'), 'utf8')).rows;
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 1 }); await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate((SPEC) => { const M = BD.measure, S = BD.std, W = BD.why; M.setDescend && M.setDescend(true); M.atRest(); const out = [];
      const PROP = { height: 'height', padL: 'padding-left', padR: 'padding-right', padT: 'padding-top', padB: 'padding-bottom', fs: 'font-size', fw: 'font-weight', radius: 'border-top-left-radius', icon: 'width', gap: 'column-gap', gap2: 'margin-left', msize: 'width', nfs: 'font-size', nfw: 'font-weight', edge: 'border-top-width', s1: 'margin-left', s2: 'margin-left', s3: 'margin-left', iin: 'padding-left', iout: 'padding-left', w: 'width', cw: 'width' };
      const colOf = (el, tok, pe) => { const want = M.probe(el, `color:var(${tok}) !important`, () => getComputedStyle(el).color); const got = getComputedStyle(el, pe || null).color; return { want, got }; };
      for (const row of SPEC) { const g = M.gateEl(row.g); if (!g) { out.push(`? ${row.g} no gate`); continue; } let els = []; try { els = [...g.querySelectorAll(row.q)].filter((e) => M.visible(e)); } catch (e) { out.push(`? ${row.g} ${row.q} bad selector`); continue; } if (!els.length) { out.push(`? ${row.g} ${row.q} none visible`); continue; } if (!row.all) els = els.slice(0, 1); else els = els.slice(0, 40);
        const label = `${row.g} ${row.q} ${row.k || row.c || (row.w ? 'width' : 'col ' + row.col)}${row.pe ? row.pe : ''}`;
        if (row.col) { const { want, got } = colOf(els[0], row.col, row.pe); out.push(`${want === got ? '✓' : '✗'} ${label} · want ${row.col} ${want} · got ${got}`); continue; }
        if (row.between) { const b2 = [...g.querySelectorAll(row.q2)].find((e) => M.visible(e)); const x = b2 ? +(b2.getBoundingClientRect().left - els[0].getBoundingClientRect().right).toFixed(2) : 'none'; out.push(`${typeof x === 'number' && Math.abs(x - row.want) <= 0.3 ? '✓' : '✗'} ${row.g} ${row.q} → ${row.q2} · want ${row.want} · got ${x}`); continue; }
        const gots = els.map((e) => { if (row.w) return +e.getBoundingClientRect().width.toFixed(2); if (row.c) return +parseFloat(getComputedStyle(e, row.pe || null).getPropertyValue(row.c)).toFixed(2); const kind = M.kindOf(e); const kn = (S.KNOBS[kind] || []).find((x) => x.k === row.k); if (!kn) return `no ${row.k} on ${kind}`; let x = null; try { x = kn.read(e); } catch (er) { x = 'ERR'; } return x == null ? 'null' : typeof x === 'number' ? +x.toFixed(2) : x; });
        const ok = gots.every((x) => typeof x === 'number' ? Math.abs(x - row.want) <= 0.3 : String(x) === String(row.want)); const uniq = [...new Set(gots.map(String))].slice(0, 6);
        let where = ''; if (!ok) { const prop = row.c || (row.w ? 'width' : PROP[row.k]); if (prop) { try { where = W.short(W.of(els[0], prop, row.pe || '')) || ''; } catch (er) { where = ''; } } }
        out.push(`${ok ? '✓' : '✗'} ${label} · want ${row.want} · got ${uniq.join('/')}${row.all ? ` (${els.length})` : ''}${where ? ' · ' + where : ''}`); }
      return out; }, SPEC);
    console.log(r.join('\n')); await b.close(); srv.close(); return;
  }
  if (MODE === 'eval') {
    // one expression evaluated in the page (env EXPR), its result printed
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 1 }); await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate(async (x) => { BD.measure.setDescend && BD.measure.setDescend(true); try { return String(await (0, eval)(x)); } catch (e) { return 'ERR ' + e.message; } }, process.env.EXPR || '1');
    console.log(r); await b.close(); srv.close(); return;
  }
  if (MODE === 'reveal') {
    // the row's Collapse (an icon-revealing button) hovered: does its ring open with its word? (Harkirat 2026-10-06 10:58 EDT, #4)
    const G = process.env.GATE || 'C1';
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 2 }); await new Promise((r) => setTimeout(r, 600));
    await p.evaluate(() => { const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
    const box = await p.evaluate((G) => { const M = BD.measure; const g = M.gateEl(G); const el = [...g.querySelectorAll('button.wg-fbtn')].find((e) => M.visible(e)); el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, G);
    const read = () => p.evaluate((G) => { const M = BD.measure; const g = M.gateEl(G); const el = [...g.querySelectorAll('button.wg-fbtn')].find((e) => M.visible(e)); const r = el.getBoundingClientRect(); const c = getComputedStyle(el), b = getComputedStyle(el, '::before'), a = getComputedStyle(el, '::after'); const inset = (q) => parseFloat(b[q]) || 0; const ring = { l: r.left + inset('left'), r: r.right - inset('right') };
      const sheet = (document.getElementById('bd-std') || {}).textContent || ''; const rules = sheet.split('\n').filter((l) => /wg-fbtn|wg-ib/.test(l) && /width/.test(l)).map((l) => l.slice(0, 160));
      return { btn: `${r.width.toFixed(1)}x${r.height.toFixed(1)}`, ring: (ring.r - ring.l).toFixed(1), cols: c.gridTemplateColumns, word: a.width, wordOp: a.opacity, gap: c.columnGap, pad: c.padding, rules }; }, G);
    const rest = await read(); await p.mouse.move(box.x, box.y); await new Promise((r) => setTimeout(r, 700)); const hov = await read();
    const clip = await p.evaluate((G) => { const M = BD.measure; const g = M.gateEl(G); const el = [...g.querySelectorAll('button.wg-fbtn')].find((e) => M.visible(e)); const r = el.getBoundingClientRect(); return { x: r.left - 60, y: r.top - 14, width: r.width + 74, height: r.height + 28 }; }, G);
    await p.screenshot({ path: path.join(__dirname, 'reveal-full.png') }); fs.writeFileSync(path.join(__dirname, 'reveal-crop.txt'), `${Math.round(clip.width * 2)}x${Math.round(clip.height * 2)}+${Math.round(clip.x * 2)}+${Math.round(clip.y * 2)}`); /* the viewport shot, cropped: a clip is page-relative */
    console.log('rest ', JSON.stringify(rest)); console.log('hover', JSON.stringify(hov)); await b.close(); srv.close(); return;
  }
  if (MODE === 'setcheck') {
    // a set value lands: make a variant of the element, set one knob, read it back on every element the variant reaches, then undo
    const G = process.env.GATE || 'C1', SETS = (process.env.SETS || '').split('|').filter(Boolean);
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 1 }); await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate(async (G, SETS) => { const M = BD.measure, Sd = BD.std; M.setDescend && M.setDescend(true); const g = M.gateEl(G); const wait = (ms) => new Promise((x) => setTimeout(x, ms)); const out = [];
      for (const spec of SETS) { const [q, kv] = spec.split(':'); const [k, val] = kv.split('='); const el = [...g.querySelectorAll(q)].find((e) => M.visible(e)); if (!el) { out.push(spec + ': no element'); continue; } const kind = M.kindOf(el); const id = Sd.create(kind, [el]); await wait(20); const kn = (Sd.KNOBS[kind] || []).find((x) => x.k === k); if (!kn) { out.push(`${spec}: no knob ${k} on ${kind}`); Sd.undo(); continue; } const before = kn.read(el);
        Sd.setValue(id, k, +val); await wait(60); M.atRest(); const els = Sd.elsOf(Sd.get(id)); const got = els.map((e) => { const x = kn.read(e); return x == null ? 'null' : +(+x).toFixed(2); }); const hit = got.filter((x) => x !== 'null' && Math.abs(x - +val) < 0.3).length;
        out.push(`${spec} · was ${before == null ? 'null' : +(+before).toFixed(2)} · lands on ${hit} of ${got.length}${hit < got.length ? ' · reads ' + [...new Set(got)].slice(0, 6).join(', ') : ''}`); Sd.undo(); Sd.undo(); await wait(20); }
      return out; }, G, SETS);
    console.log(r.join('\n')); await b.close(); srv.close(); return;
  }
  if (MODE === 'knobs') {
    // what each knob reads on named elements of a gate (the first visible match of each selector)
    const G = process.env.GATE || 'C1', SELS = (process.env.SELS || '').split('|').filter(Boolean);
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 1 }); await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate((G, SELS) => { const M = BD.measure, Sd = BD.std; M.setDescend && M.setDescend(true); M.atRest(); const g = M.gateEl(G); const out = [];
      for (const q of SELS) { const el = [...g.querySelectorAll(q)].find((e) => M.visible(e)); if (!el) { out.push(q + ': none'); continue; } const kind = M.kindOf(el); const vals = []; for (const kn of Sd.KNOBS[kind] || []) { let x = null; try { x = kn.read(el); } catch (e) { x = 'ERR ' + e.message; } if (x != null && x !== '') vals.push(`${kn.k}=${typeof x === 'number' ? +x.toFixed(2) : x}`); } const c = getComputedStyle(el); out.push(`${q} [${kind}] css pad ${c.padding} gap ${c.columnGap} · ${vals.join(' ')}`); }
      return out; }, G, SELS);
    console.log(r.join('\n')); await b.close(); srv.close(); return;
  }
  if (MODE === 'fidel') {
    // a knob set at the value it already shows must change nothing (2026-10-06 11:21 EDT): for one element of every kind on a gate, make the
    // variant, then set each knob to its own value, one at a time, and list every knob that moves something
    const G = process.env.GATE || 'C1';
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 1 }); await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate(async (G) => { const M = BD.measure, Sd = BD.std; M.setDescend && M.setDescend(true); const g = M.gateEl(G); const wait = (ms) => new Promise((x) => setTimeout(x, ms));
      const loop = document.getAnimations().filter((a) => { try { return a.effect && a.effect.getComputedTiming().endTime === Infinity; } catch (e) { return false; } }).map((a) => a.effect.target).filter(Boolean);
      const snap = () => { M.atRest(); const m = new Map(); for (const e of g.querySelectorAll('*')) { if (loop.some((t) => t === e || t.contains(e))) continue; const b = e.getBoundingClientRect(); if (!b.width && !b.height) continue; m.set(e, [b.left, b.top, b.width, b.height].map((x) => Math.round(x * 4) / 4).join(',')); } return m; };
      const diff = (a, b) => { const out = []; for (const [e, v] of a) if (b.get(e) !== v) out.push(e); return out; };
      const seen = new Set(); const picks = []; for (const t of M.things(g)) { const k = M.kindOf(t); if (!k) continue; const key = k + '|' + M.selOf(t); if (seen.has(key)) continue; seen.add(key); picks.push(t); }
      const bad = []; let tried = 0, knobs = 0, made = 0, moved = 0, leaks = 0;
      for (const el of picks) { const base = snap(); const kind = M.kindOf(el); let id = null; try { id = Sd.create(kind, [el]); } catch (e) { bad.push({ el: M.selOf(el), k: 'create', err: e.message }); continue; } await wait(20); tried++;
        const b0 = snap(); const c0 = diff(base, b0); if (c0.length) { made++; bad.push({ kind, el: M.selOf(el).slice(0, 50), k: 'MADE', n: c0.length, ex: c0.slice(0, 2).map((e) => M.selOf(e).slice(0, 36) + ' ' + base.get(e) + ' → ' + b0.get(e)) }); }
        const v = Sd.get(id); for (const kn of Sd.KNOBS[kind] || []) { const val = v.values[kn.k]; if (val == null || val === '') continue; knobs++; Sd.setValue(id, kn.k, val); await wait(15); const b1 = snap(); const ch = diff(b0, b1); if (ch.length) { moved++; bad.push({ kind, el: M.selOf(el).slice(0, 50), k: kn.k, val, n: ch.length, ex: ch.slice(0, 2).map((e) => M.selOf(e).slice(0, 36) + ' ' + b0.get(e) + ' → ' + b1.get(e)) }); } Sd.undo(); await wait(5); }
        Sd.undo(); await wait(10); const post = snap(); const lk = diff(base, post); if (lk.length) { leaks++; bad.push({ kind, el: M.selOf(el).slice(0, 50), k: 'UNDO-LEAK', n: lk.length, ex: lk.slice(0, 2).map((e) => M.selOf(e).slice(0, 36) + ' ' + base.get(e) + ' → ' + post.get(e)) }); } }
      return { gate: G, tried, knobs, made, moved, leaks, bad }; }, G);
    fs.writeFileSync(path.join(__dirname, `fidel-${G}.json`), JSON.stringify(r, null, 1));
    console.log(`${r.gate}: ${r.tried} kinds, ${r.made} change the page when made a variant; ${r.knobs} knobs set at their own value, ${r.moved} move something; ${r.leaks} not restored by undo`);
    for (const x of r.bad) console.log(`  ${x.kind} ${x.el} · ${x.k}${x.val != null ? '=' + x.val : ''} · ${x.n} moved${x.err ? ' ERR ' + x.err : ''} · ${(x.ex || []).join(' ;; ')}`);
    await b.close(); srv.close(); return;
  }
  if (MODE === 'ident') {
    // the identity rule (Harkirat 2026-10-06 11:06 EDT: "i make the problem chip into a variant, changed nothing about it, and it instantly broke
    // it"): making a variant out of anything must change NOTHING on the page. For one element of every kind on a gate: snapshot every element's
    // box, make the variant, snapshot again, and for any change find the knobs that cause it by taking them out one at a time; then undo
    const G = process.env.GATE || 'C1';
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: 1 }); await new Promise((r) => setTimeout(r, 600));
    const r = await p.evaluate(async (G) => { const M = BD.measure, Sd = BD.std; M.setDescend && M.setDescend(true); const g = M.gateEl(G); const wait = (ms) => new Promise((x) => setTimeout(x, ms));
      const loop = document.getAnimations().filter((a) => { try { return a.effect && a.effect.getComputedTiming().endTime === Infinity; } catch (e) { return false; } }).map((a) => a.effect.target).filter(Boolean); /* what spins forever (a rim, a pulse) moves on its own */ const snap = () => { M.atRest(); const m = new Map(); for (const e of g.querySelectorAll('*')) { if (loop.some((t) => t === e || t.contains(e))) continue; const b = e.getBoundingClientRect(); if (!b.width && !b.height) continue; m.set(e, [b.left, b.top, b.width, b.height].map((x) => Math.round(x * 4) / 4).join(',')); } return m; };
      const diff = (a, b) => { const out = []; for (const [e, v] of a) if (b.get(e) !== v) out.push(e); return out; };
      const seen = new Set(); const picks = []; for (const t of M.things(g)) { const k = M.kindOf(t); if (!k) continue; const key = k + '|' + M.selOf(t); if (seen.has(key)) continue; seen.add(key); picks.push(t); }
      const res = []; const base = snap();
      for (const el of picks.slice(0, Number(window.__identMax || 400))) { const kind = M.kindOf(el); let id = null; try { id = Sd.create(kind, [el]); } catch (e) { res.push({ el: M.selOf(el), err: e.message }); continue; } await wait(30);
        const after = snap(); const ch = diff(base, after);
        if (ch.length) { const v = Sd.get(id); const ks = Object.keys(v.values); const guilty = []; for (const k of ks) { const keep = v.values[k]; delete v.values[k]; Sd.apply(); await wait(10); const d2 = diff(base, snap()); v.values[k] = keep; if (d2.length < ch.length) guilty.push(`${k}(${ch.length - d2.length})`); } Sd.apply();
          const self = ch.includes(el); res.push({ el: M.selOf(el).slice(0, 60), kind, t: (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 20), changed: ch.length, self, members: v.members.map((m) => m.sel).join(' , ').slice(0, 90), guilty, ex: ch.slice(0, 3).map((e) => M.selOf(e).slice(0, 40) + ' ' + base.get(e) + ' → ' + snap().get(e)) }); }
        Sd.undo(); await wait(10); }
      const ok = picks.length - res.length; return { gate: G, tried: Math.min(picks.length, Number(window.__identMax || 400)), ok, broken: res }; }, G);
    fs.writeFileSync(path.join(__dirname, `ident-${G}.json`), JSON.stringify(r, null, 1));
    console.log(`${r.gate}: ${r.tried} kinds tried, ${r.broken.length} change the page when made a variant`); for (const x of r.broken.slice(0, 40)) console.log(`  ${x.kind} ${x.el} "${x.t || ''}" · ${x.changed} boxes moved${x.err ? ' ERR ' + x.err : ''} · knobs: ${(x.guilty || []).join(' ')}`);
    await b.close(); srv.close(); return;
  }
  if (MODE === 'capc') {
    // the two cap-centring rules (padding-top: round((H - 1cap) / 2) + text-box trim): where their caps actually land in the box
    const r = await p.evaluate(() => { const M = BD.measure; M.atRest(); const out = { supports: CSS.supports('text-box', 'trim-both cap alphabetic'), ua: navigator.userAgent.match(/Chrome\/[\d.]+/)[0] };
      const els = [...document.querySelectorAll('#board *')].filter((e) => /trim-both/.test(getComputedStyle(e).textBoxTrim || '') || getComputedStyle(e).textBoxTrim === 'trim-both').filter((e) => /^round|px$/.test(getComputedStyle(e).paddingTop));
      const pick = []; const seen = new Set(); for (const e of els) { const k = M.selOf(e); if (seen.has(k)) continue; seen.add(k); pick.push(e); }
      out.rows = pick.slice(0, 30).map((e) => { const c = getComputedStyle(e); const b = e.getBoundingClientRect(); const D = M.inside(e); const w = D && D.parts.find((q) => q.kind === 'words'); return { sel: M.selOf(e).slice(0, 60), t: (e.innerText || '').trim().slice(0, 14), disp: c.display, h: +b.height.toFixed(2), pt: c.paddingTop, trim: c.textBoxTrim, edge: c.textBoxEdge, fs: c.fontSize, capTop: w ? +(w.rect.top - b.top).toFixed(2) : null, capBot: w ? +(b.bottom - w.rect.bottom).toFixed(2) : null }; });
      return out; });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'landed') {
    // "Both, by batch" (Harkirat 2026-10-05 15:35 EDT): every value in his saved variants, read back from every member on the page with the
    // knob's own drawn reading — asked vs measured, and how many members miss it by 0.05 or more
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: +(process.env.BD_DPR || 1) }); await new Promise((r) => setTimeout(r, 800));
    const rows = await p.evaluate(() => { const Sd = BD.std, M = BD.measure; M.atRest(); const out = [];
      for (const v of Sd.state.variants) { const kn = Sd.KNOBS[v.kind] || []; let els = []; try { els = Sd.elsOf(v).filter((e) => e.isConnected); } catch (e) {}
        for (const [k, val] of Object.entries(v.values)) { const K = kn.find((x) => x.k === k); if (!K || !K.read) { out.push({ v: v.id, name: v.name, k, asked: val, note: 'no reading for this knob' }); continue; }
          const got = []; let none = 0; for (const e of els) { let g = null; try { g = K.read(e); } catch (x) {} if (g == null || (typeof g === 'number' && !isFinite(g))) none++; else got.push(g); }
          if (typeof val === 'number') { const nums = got.filter((x) => typeof x === 'number'); const off = nums.filter((x) => Math.abs(x - val) >= 0.05); out.push({ v: v.id, name: v.name, k, asked: val, members: els.length, read: nums.length, off: off.length, got: nums.length ? [+Math.min(...nums).toFixed(2), +Math.max(...nums).toFixed(2)] : null, offVals: [...new Set(off.map((x) => +x.toFixed(2)))].slice(0, 6), none }); }
          else { const off = got.filter((x) => String(x) !== String(val)); out.push({ v: v.id, name: v.name, k, asked: val, members: els.length, read: got.length, off: off.length, offVals: [...new Set(off.map(String))].slice(0, 4), none }); } } }
      return out; });
    console.log(JSON.stringify(rows, null, 0)); await b.close(); srv.close(); return;
  }
  if (MODE === 'press') {
    await p.setViewport({ width: 1640, height: 888, deviceScaleFactor: +(process.env.BD_DPR || 1) }); await new Promise((r) => setTimeout(r, 800)); // his window is wider than 1282: his log puts the button's right edge at 1297
    // his V7 log (2026-10-05 15:35 EDT): Collapse all read at different sizes per click. Real clicks in Inspect with a human 90ms press;
    // each click is read at 0/16/40/80/150/300/700ms (box, the four spaces, and the numbers the panel drew right after the click)
    const pt = await p.evaluate(() => { window.__bd.ui.setInspect(true); const b = [...document.querySelectorAll('#board button')].find((e) => /^Collapse all$/.test(e.innerText.trim())); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect();
      window.__press = []; window.__arm = () => { const M = BD.measure; const t0 = performance.now(); const take = (tag) => { const D = M.inside(b); const r = b.getBoundingClientRect(); const svg = window.__bd.ui.root().querySelector('svg'); const nums = svg ? [...svg.querySelectorAll('text')].map((t) => t.textContent).filter((t) => /^[\d.]+$/.test(t)).slice(0, 8).join(' ') : ''; window.__press.push({ tag, ms: Math.round(performance.now() - t0), label: b.innerText.trim(), box: [r.width, r.height].map((x) => +x.toFixed(2)).join('x'), D: D && [D.left, D.right, D.top, D.bottom].map((x) => +x.toFixed(2)).join(' '), nums }); };
        for (const ms of [0, 16, 40, 80, 150, 300, 700]) setTimeout(() => take('+' + ms), ms + 92); };
      const pts = []; for (let fx = 0.05; fx < 1; fx += 0.1) for (let fy = 0.2; fy < 0.9; fy += 0.2) { const x = r.left + r.width * fx, y = r.top + r.height * fy; const h = document.elementFromPoint(x, y); if (h === b || b.contains(h)) pts.push({ x, y }); else pts.miss = (pts.miss || []).concat(h ? h.tagName + '.' + [...h.classList].join('.') + '@' + fx.toFixed(2) : 'none'); }
      window.__miss = pts.miss; return pts[Math.floor(pts.length / 2)] || { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    console.log('shadow hit', JSON.stringify(await p.evaluate((x, y) => { const sr = document.getElementById('bd-host').shadowRoot; const h = sr && sr.elementFromPoint(x, y); return h ? h.tagName + '.' + [...h.classList].join('.') + ' ' + (h.id || '') : null; }, pt.x, pt.y)));
    console.log('coverer', JSON.stringify(await p.evaluate((x, y) => { const h = document.elementFromPoint(x, y); const c = getComputedStyle(h); const chain = []; for (let e = h; e && chain.length < 5; e = e.parentElement) chain.push(e.tagName + (e.id ? '#' + e.id : '') + '.' + [...e.classList].join('.')); const pre = window.__bd.ui.get(); return { chain, pos: c.position, z: c.zIndex, pe: c.pointerEvents, bg: c.backgroundColor, rect: JSON.stringify(h.getBoundingClientRect()), inspect: pre.inspect, html: h.outerHTML.slice(0, 200) }; }, pt.x, pt.y)));
    console.log('hit point', JSON.stringify(pt), 'misses', JSON.stringify(await p.evaluate(() => (window.__miss || []).slice(0, 6))));
    await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await new Promise((r) => setTimeout(r, 300));
    const diag = await p.evaluate((x, y) => { const b = [...document.querySelectorAll('#board button')].find((e) => /^Collapse all$/.test(e.innerText.trim())); const h = document.elementFromPoint(x, y); return { rm: matchMedia('(prefers-reduced-motion: reduce)').matches, td: getComputedStyle(b).transitionDuration, tp: getComputedStyle(b).transitionProperty.slice(0, 80), hit: h === b || b.contains(h), hitEl: h && (h.tagName + '.' + [...h.classList].join('.')) }; }, pt.x, pt.y);
    await p.mouse.move(pt.x, pt.y); await p.mouse.down(); await new Promise((r) => setTimeout(r, 200)); diag.held = await p.evaluate(() => { const b = [...document.querySelectorAll('#board button')].find((e) => /^Collapse all$/.test(e.innerText.trim())); return { active: b.matches(':active'), tf: getComputedStyle(b).transform }; }); await p.mouse.up(); await new Promise((r) => setTimeout(r, 900)); await p.evaluate(() => { window.__press = []; }); console.log(JSON.stringify(diag));
    for (let i = 0; i < 3; i++) { await p.evaluate(() => window.__arm()); await p.mouse.click(pt.x, pt.y, { delay: 90 }); await new Promise((r) => setTimeout(r, 1000)); }
    const res = await p.evaluate(() => window.__press); const sets = {}; for (const x of res) { const k = x.box + ' | ' + x.D; (sets[k] = sets[k] || []).push(x.tag); }
    console.log(JSON.stringify({ distinct: Object.keys(sets).length, sets, panelAtClick: res.filter((x) => x.tag === '+0').map((x) => x.nums), labels: [...new Set(res.map((x) => x.label))] }, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'fold') {
    // his 14:15 EDT questions: (1) Collapse all's numbers change on every click; (2) collapsing shrinks the whole manifest
    const pt = await p.evaluate(() => { const b = [...document.querySelectorAll('#board button')].find((e) => /^Collapse all$/.test(e.innerText.trim())); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await new Promise((r) => setTimeout(r, 300));
    const sample = () => p.evaluate(() => { const M = BD.measure; const b = [...document.querySelectorAll('#board button')].find((e) => /^(Collapse|Expand) all$/.test(e.innerText.trim())); const sv = b.querySelector('svg'); const ib = M.iconBox(sv); const D = M.inside(b); return { label: b.innerText.trim(), ink: [ib.left, ib.top, ib.width, ib.height].map((x) => +x.toFixed(2)), D: D && [D.left, D.right, D.top, D.bottom].map((x) => +x.toFixed(2)), anims: b.getAnimations({ subtree: true }).map((a) => `${a.animationName || a.transitionProperty || a.constructor.name} ${a.playState} ${(a.effect && a.effect.target && a.effect.target.tagName) || ''}`), tf: [...sv.querySelectorAll('*')].map((q) => getComputedStyle(q).transform).filter((x) => x !== 'none').slice(0, 3) }; });
    const out = { rest: await sample() }; await p.mouse.move(pt.x, pt.y); out.hover = []; for (let i = 0; i < 5; i++) { await new Promise((r) => setTimeout(r, 120)); out.hover.push(await sample()); }
    await p.mouse.down(); await new Promise((r) => setTimeout(r, 60)); out.pressed = await sample(); await p.mouse.up(); await new Promise((r) => setTimeout(r, 60)); out.after = await sample();
    // (2) the manifest's width when everything folds, with his variants and without
    out.width = await p.evaluate(async () => { const U = window.__bd.ui, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); U.setInspect(false); const res = {};
      const man = () => { const g = document.querySelector('#board .wg-wrap') || document.querySelector('#board .wg'); return g ? +g.getBoundingClientRect().width.toFixed(1) : null; };
      for (const mode of ['mine', 'original']) { Sd.setCompare(mode === 'original'); await wait(250); const b = () => [...document.querySelectorAll('#board button')].find((e) => /^(Collapse|Expand) all$/.test(e.innerText.trim())); const before = man(); const l0 = b().innerText.trim(); b().click(); await wait(500); const after = man(); const l1 = b().innerText.trim(); b().click(); await wait(500); res[mode] = { before, after, l0, l1 }; }
      Sd.setCompare(false); return res; });
    console.log(JSON.stringify(out, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'his') {
    // his saved variants (artifact db, 2026-10-05 13:51 EDT): with nothing changed since he set them, does "Mine" differ from "Original" anywhere
    // he did not change? Every member, its box and its four drawn inside spaces, compared with the builder's sheet on and off
    const r = await p.evaluate(async () => {
      const M = BD.measure, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); const out = [];
      const snap = () => { const o = new Map(); for (const v of Sd.state.variants) for (const e of Sd.elsOf(v)) { const r = e.getBoundingClientRect(); const D = M.inside(e); o.set(e, { v: v.id, name: M.label(e).slice(0, 18), r: [r.left, r.top, r.width, r.height].map((x) => +x.toFixed(1)), D: D ? [D.left, D.right, D.top, D.bottom].map((x) => +x.toFixed(1)) : null }); } return o; };
      Sd.setCompare(true); await wait(300); const A = snap(); Sd.setCompare(false); await wait(300); const B = snap();
      for (const [e, a] of A) { const b = B.get(e); if (!b) continue; const dr = a.r.map((x, i) => +(b.r[i] - x).toFixed(1)); const dd = a.D && b.D ? a.D.map((x, i) => +(b.D[i] - x).toFixed(1)) : null; if (dr.some((x) => Math.abs(x) >= 0.5) || (dd && dd.some((x) => Math.abs(x) >= 0.5))) out.push(`${a.v} ${a.name} box Δ${JSON.stringify(dr)} inside Δ${JSON.stringify(dd)}`); }
      const nb = [...document.querySelectorAll('#board button')].find((x) => /^New build$/.test(x.innerText.trim())); const isv = nb && nb.querySelector('svg'); const ib = isv && M.iconBox(isv);
      return { variants: Sd.state.variants.map((v) => `${v.id} ${v.name} ${JSON.stringify(v.values)}`), newBuildIcon: ib && [ib.width, ib.height].map((x) => +x.toFixed(1)), newBuildBox: isv && isv.getBoundingClientRect().width, changed: out.length, sample: out.slice(0, 6) };
    });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'why2') {
    const r = await p.evaluate(async () => {
      const U = window.__bd.ui, M = BD.measure, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); U.setInspect(true); const board = document.getElementById('board');
      const find = (re) => [...board.querySelectorAll('button')].find((e) => re.test((e.innerText || '').replace(/\s+/g, ' ').trim()) && M.visible(e)); const out = {};
      { const e = find(/^All 24$/); e.scrollIntoView({ block: 'center' }); U.select([e]); await wait(60); U.makeFromSelection(); await wait(150); const v = Sd.memberOf(e); const cur = v.values.padL; Sd.setValue(v.id, 'padL', 10); await wait(200);
        const rules = String(Sd.css()).split('\n').filter((l) => /padding-left/.test(l) && !l.startsWith(':root')).map((l) => l.replace(/:not\(#bd-\d\)/g, '').replace(/ !important/g, ''));
        const mi = find(/^Missing image 1$/); const D = M.inside(mi); out.chip = { cur, rules, mi: { D: D && [D.left, D.right], pad: getComputedStyle(mi).paddingLeft, kids: [...mi.children].map((q) => q.tagName.toLowerCase() + '.' + [...q.classList].join('.') + ' ml ' + getComputedStyle(q).marginLeft).join(' | '), parts: D && D.parts.map((q) => q.kind + '@' + (q.rect.left - D.inner.left).toFixed(1)).join(' '), matching: rules.filter((l) => { try { return mi.matches(l.slice(0, l.indexOf('{'))); } catch (x) { return false; } }) } };
        for (let i = 0; i < 4; i++) Sd.undo(); await wait(60); }
      { const e = find(/^Edit$/); e.scrollIntoView({ block: 'center' }); U.select([e]); await wait(60); U.makeFromSelection(); await wait(150); const v = Sd.memberOf(e); Sd.setValue(v.id, 'height', 32); await wait(200);
        const c = getComputedStyle(e), pc = getComputedStyle(e.parentElement); out.edit = { rules: String(Sd.css()).split('\n').filter((l) => /height/.test(l) && !l.startsWith(':root')).map((l) => l.slice(0, 160)), h: c.height, minH: c.minHeight, maxH: c.maxHeight, box: c.boxSizing, rect: e.getBoundingClientRect().height, before: getComputedStyle(e, '::before').height, parent: `${e.parentElement.className} ${pc.display} ${pc.alignItems} h ${pc.height} maxH ${pc.maxHeight} overflow ${pc.overflow}`, read: M.visibleHeight(e), T: (() => { const T = M.paintTarget(e); return T.part + ' ' + T.rect.height; })() };
        for (let i = 0; i < 4; i++) Sd.undo(); await wait(60); }
      return out;
    });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'why') {
    const r = await p.evaluate(async () => {
      const U = window.__bd.ui, M = BD.measure, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); U.setInspect(true); const board = document.getElementById('board');
      const find = (re) => [...board.querySelectorAll('button')].find((e) => re.test((e.innerText || '').replace(/\s+/g, ' ').trim()) && M.visible(e)); const out = [];
      for (const [re, k] of [[/^All 24$/, 'padL'], [/^Cancel$/, 'padL'], [/^Delivery queue$/, 'padR'], [/^Edit$/, 'height']]) {
        const e = find(re); e.scrollIntoView({ block: 'center' }); U.select([e]); await wait(60); U.makeFromSelection(); await wait(150); const v = Sd.memberOf(e); const cur = v.values[k];
        // before the change: each bad-to-be member's own numbers
        Sd.setValue(v.id, k, Math.round(cur) + 2); await wait(150); const bad = Sd.selfCheck(v.id).filter((x) => x.k === k);
        const css = String(Sd.css()).split('\n').filter((l) => l.includes(`-${k}`) && !l.startsWith(':root')).map((l) => l.slice(0, l.indexOf('{')).replace(/:not\(#bd-\d\)/g, ''));
        const det = bad.slice(0, 5).map((x) => { const el = x.el; const T = M.paintTarget(el); const host = T && T.part === 'self' ? T.el : el; const D = M.inside(el); const c = getComputedStyle(host);
          return { name: M.label(el).slice(0, 18), sel: M.selOf(el), cls: el.className, kids: [...el.children].map((q) => q.tagName.toLowerCase() + '.' + [...q.classList].join('.')).join(' '), parts: D && D.parts.map((q) => q.kind).join('+'), D: D && [D.left, D.right].map((z) => +z.toFixed(1)), pad: c.paddingLeft + '/' + c.paddingRight, h: c.height + ' minH ' + c.minHeight + ' maxH ' + c.maxHeight, w: c.width + ' ' + c.justifyContent, matches: css.map((s) => { try { return el.matches(s) || host.matches(s) ? 'Y' : 'n'; } catch (q) { return 'E'; } }).join('') }; });
        out.push({ re: String(re), k, cur, nbad: bad.length, css, det }); for (let i = 0; i < 4; i++) Sd.undo(); await wait(60);
      }
      return out;
    });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'trace') {
    // the 14 of 12:35 EDT, traced: made the way the class test makes them (the selection plus its Same lookalikes), one setting changed, then
    // for the element itself and every member that fails: what was written, what reaches it, and how it is built
    const r = await p.evaluate(async () => {
      const U = window.__bd.ui, M = BD.measure, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); U.setInspect(true); const board = document.getElementById('board');
      const find = (re) => [...board.querySelectorAll('button')].find((e) => re.test((e.innerText || '').replace(/\s+/g, ' ').trim()) && M.visible(e));
      const shape = (e) => { const D = M.inside(e); return D ? D.parts.map((q) => q.kind).join('+') : 'no-ink'; };
      const out = [];
      for (const [re, k, d] of [[/^BEST ASSAULT/, 'padL', 2], [/^Cancel$/, 'padL', 2], [/^1$/, 'icon', 2], [/^All 5$/, 'padL', 2], [/^Repair build$/, 'padR', 2], [/^Delivery queue$/, 'padR', 2], [/^Edit$/, 'height', 4]]) {
        const e = find(re); if (!e) { out.push({ re: String(re), err: 'not found' }); continue; } e.scrollIntoView({ block: 'center' }); U.select([e]); await wait(60); U.makeFromSelection(); await wait(150); const v = Sd.memberOf(e); if (!v) { out.push({ re: String(re), err: 'no variant' }); continue; }
        const cur = v.values[k]; const els = Sd.elsOf(v); const shapes = {}; for (const x of els) { const s = shape(x) + ' ' + M.selOf(x); shapes[s] = (shapes[s] || 0) + 1; }
        Sd.setValue(v.id, k, Math.round(cur) + d); await wait(150); const bad = Sd.selfCheck(v.id).filter((x) => x.k === k);
        const css = String(Sd.css()).split('\n').filter((l) => l.includes(`--bd-${v.id.toLowerCase()}-${k}`) || l.includes(`--bd-${v.id.toLowerCase()}-${k.toLowerCase()}`)).map((l) => l.slice(0, 200));
        const T = M.paintTarget(e); const sv = e.querySelector('svg'); const svc = sv ? getComputedStyle(sv) : null; const hits = css.slice(1).map((l) => { const sel = l.slice(0, l.indexOf('{')); const targ = k === 'icon' ? sv : k === 'height' ? e : T.part === 'self' ? T.el : e; try { return targ && targ.matches(sel.replace(/::(before|after)$/, '')) ? 'Y' : 'n'; } catch (x) { return 'ERR'; } }).join(''); const extra = { hot: e.matches(':hover,:focus,:focus-visible,:active'), paintsSelf: getComputedStyle(e).backgroundColor + ' ' + getComputedStyle(e).borderTopWidth + ' ' + getComputedStyle(e).boxShadow.slice(0, 40), before: getComputedStyle(e, '::before').content + ' ' + getComputedStyle(e, '::before').backgroundColor, part: v.members[0].part, padNow: getComputedStyle(T.part === 'self' ? T.el : e).paddingLeft + '/' + getComputedStyle(T.part === 'self' ? T.el : e).paddingRight, D: (() => { const D = M.inside(e); return D && [D.left, D.right].map((x) => +x.toFixed(1)); })() };
        out.push({ re: String(re).slice(1, 24), k, cur, want: Math.round(cur) + d, members: v.members.length, els: els.length, shapes, bad: bad.slice(0, 4).map((x) => `${M.label(x.el).slice(0, 16)} [${shape(x.el)}] got ${x.got}`), nbad: bad.length, css: css.slice(0, 6), T: `${T.el.tagName.toLowerCase()}.${[...T.el.classList].join('.')} ${T.part}`, svg: svc ? `box ${sv.getBoundingClientRect().width.toFixed(1)} pad ${svc.paddingLeft}/${svc.paddingRight} bord ${svc.borderLeftWidth} sizing ${svc.boxSizing}` : null, hits, extra, pseudo: k === 'height' ? (() => { const c = getComputedStyle(T.el, T.part === 'self' ? null : T.part); return `pos ${c.position} top ${c.top} bottom ${c.bottom} h ${c.height} inset ${c.inset}`; })() : null });
        for (let i = 0; i < 4; i++) Sd.undo(); await wait(60);
      }
      return out;
    });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'share') {
    const pt = await p.evaluate(() => { const U = window.__bd.ui; U.setInspect(true); const e = document.querySelectorAll('#board button.wg-share')[1]; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await new Promise((r) => setTimeout(r, 300)); await p.mouse.move(pt.x, pt.y); await new Promise((r) => setTimeout(r, 200)); await p.mouse.click(pt.x, pt.y); await new Promise((r) => setTimeout(r, 800));
    const r = await p.evaluate(() => { const U = window.__bd.ui, M = BD.measure; const e = document.querySelectorAll('#board button.wg-share')[1]; const L = U.lookalikes(e); const by = {}; for (const l of L) { const k = l.tier + ' ' + M.label(l.el).slice(0, 18) + (l.why ? ' (' + l.why + ')' : ''); by[k] = (by[k] || 0) + 1; } const D = M.inside(e); return { tiers: by, inside: D && [D.left, D.right, D.top, D.bottom].map((x) => +x.toFixed(1)) }; });
    console.log(JSON.stringify(r, null, 1));
    await p.evaluate(() => { const e = document.querySelectorAll('#board button.wg-fbtn')[0]; e.scrollIntoView({ block: 'center' }); }); await new Promise((r) => setTimeout(r, 300));
    const pt2 = await p.evaluate(() => { const e = document.querySelectorAll('#board button.wg-share')[0]; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }); await p.mouse.click(pt2.x, pt2.y); await new Promise((r) => setTimeout(r, 700));
    await p.screenshot({ path: path.join(__dirname, 's2-share.png') }); await b.close(); srv.close(); return;
  }
  if (MODE === 'dbg2') {
    const r = await p.evaluate(async () => {
      const U = window.__bd.ui, M = BD.measure, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); U.setInspect(true);
      const e = document.querySelector('#board button.wg-share'); e.scrollIntoView({ block: 'center' }); U.select([e]); await wait(80); U.makeFromSelection(); await wait(200); const v = Sd.memberOf(e); const sv = e.querySelector('svg');
      const before = { w: sv.getBoundingClientRect().width, ink: M.iconBox(sv).width, val: v.values.icon, ispace: v.values.ispace };
      Sd.setValue(v.id, 'icon', 5); await wait(200); const css = String(Sd.css()).split('\n').filter((l) => /svg/.test(l)).slice(0, 5);
      return { members: v.members.map((m) => m.sel), before, css, after: { w: sv.getBoundingClientRect().width, ink: M.iconBox(sv).width, cw: getComputedStyle(sv).width, matches: css.map((l) => { const sel = l.slice(0, l.indexOf('{')); try { return sv.matches(sel); } catch (x) { return 'bad ' + x.message; } }) } };
    });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'dbg') {
    const r = await p.evaluate(async () => {
      const U = window.__bd.ui, M = BD.measure, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); U.setInspect(true); const board = document.getElementById('board'); const out = [];
      const find = (re, sel = 'button') => [...board.querySelectorAll(sel)].find((e) => re.test((e.innerText || '').replace(/\s+/g, ' ').trim()));
      for (const [re, k, val] of [[/^BEST ASSAULT/, 'padL', 12], [/^BEST ASSAULT/, 'height', 28], [/^Reset$/, 'padL', 19], [/^Edit$/, 'height', 32]]) {
        const e = find(re); if (!e) { out.push(re + ' not found'); continue; } e.scrollIntoView({ block: 'center' }); U.select([e]); await wait(60); U.makeFromSelection(); await wait(150); const v = Sd.memberOf(e);
        const D = M.inside(e); const T = M.paintTarget(e); const sl = k.startsWith('gap') ? Sd.gapSlot(e, k) : null;
        const info = { re: String(re), sel: M.selOf(e), members: v.members.map((m) => m.sel + ':' + (m.part || '')), T: `${T.el.tagName}.${T.el.className} ${T.part} bare=${!!T.bare}`, D: D && { l: +D.left.toFixed(1), r: +D.right.toFixed(1), parts: D.parts.map((q) => q.kind + '@' + q.rect.left.toFixed(0) + '-' + q.rect.right.toFixed(0)) }, slack: M.slackOf(T.part === 'self' ? T.el : e), slot: sl && { el: sl.el.tagName + '.' + sl.el.className, prop: sl.prop, g: sl.g, cur: sl.cur }, before: v.values[k] };
        Sd.setValue(v.id, k, val); await wait(150); info.css = String(Sd.css()).split('\n').filter((l) => /margin|padding/.test(l) && l.includes(v.members[0].sel.split(' ')[0])).slice(0, 4);
        const D2 = M.inside(e); const sl2 = k.startsWith('gap') ? Sd.gapSlot(e, k) : null; info.after = sl2 ? { g: sl2.g, cur: sl2.cur, computed: getComputedStyle(sl2.el)[sl2.prop.replace(/-(\w)/, (_, c) => c.toUpperCase())] } : D2 && { l: D2.left, r: D2.right, padL: getComputedStyle(T.part === 'self' ? T.el : e).paddingLeft, padR: getComputedStyle(T.part === 'self' ? T.el : e).paddingRight };
        out.push(info); Sd.undo(); Sd.undo(); await wait(60);
      }
      return out;
    });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'class') {
    // the class falsifier (2026-10-05 12:23 EDT): every control on the board, not his instances. (1) the drawn model answers for each one and agrees
    // with what the page draws; (2) for one control per distinct build, every space/corner/height setting, set to a new value, reads back as that
    // value on the drawn lines (selfCheck), or names why not; (3) the Corners view and the one-by-one lookalike picking work
    const r = await p.evaluate(async () => {
      const U = window.__bd.ui, M = BD.measure, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); U.setInspect(true); const board = document.getElementById('board');
      const ctl = [...M.things(board)].filter((e) => M.kindOf(e) === 'control'); const out = { controls: ctl.length, targets: { self: 0, pseudo: 0, inside: 0, bare: 0 }, noInk: 0, seenMismatch: 0, negInside: [] };
      for (const e of ctl) { const T = M.paintTarget(e); if (!T) continue; if (T.bare) out.targets.bare++; else if (T.el !== e) out.targets.inside++; else if (T.part !== 'self') out.targets.pseudo++; else out.targets.self++;
        const s = M.seen(e); if (Math.abs(s.height - T.rect.height) > 0.01 || Math.abs(s.left - T.rect.left) > 0.01) out.seenMismatch++;
        const D = M.inside(e); if (!D) { out.noInk++; continue; } for (const k of ['left', 'right', 'top', 'bottom']) if (D[k] < -0.5 && out.negInside.length < 8) out.negInside.push(`${M.gateOf(e)} ${M.label(e)} ${k} ${D[k].toFixed(1)}`); }
      // (2) knob truth, one per distinct build
      const seenSel = new Set(); const pick = []; for (const e of ctl) { const k = M.selOf(e); if (seenSel.has(k) || M.paintTarget(e).bare) continue; seenSel.add(k); pick.push(e); }
      const res = { tried: 0, pass: 0, fail: [], byK: {}, memberFail: [] };
      for (const e of pick.slice(0, 70)) {
        if (!e.isConnected) continue; e.scrollIntoView({ block: 'center' }); U.select([e]); await wait(60); U.makeFromSelection(); await wait(120); const v = Sd.memberOf(e); if (!v) continue;
        for (const k of ['padL', 'padR', 'cw', 'gap', 'gap2', 'gap3', 'icon', 'msize', 'nfs', 'nfw', 'bh', 'bfs', 'gap4', 'fs', 'fw', 'cls', 'clh', 'radius', 'height']) { const cur = v.values[k]; if (cur == null || cur === '' || typeof cur !== 'number') continue; const h = M.paintTarget(e).rect.height;
          const want = k === 'radius' ? (cur >= h / 2 - 0.5 ? cur : Math.max(2, Math.round(h * 0.25) === Math.round(cur) ? Math.round(cur) + 2 : Math.round(h * 0.25))) : k === 'height' ? Math.round(cur) + 4 : Math.round(cur) + 2;
          Sd.setValue(v.id, k, want); await wait(90); const allB = Sd.selfCheck(v.id).filter((x) => x.k === k); res.allBad = (res.allBad || 0) + allB.length; res.allChecked = (res.allChecked || 0) + Sd.elsOf(v).length; if (allB.length && res.memberFail.length < 30) res.memberFail.push(`${M.gateOf(e)} ${M.label(e)} ${k}: ${allB.length} of ${Sd.elsOf(v).length} members off, e.g. ${M.label(allB[0].el).slice(0, 18)} got ${allB[0].got}`); const bad = allB.filter((x) => x.el === e); res.tried++; res.byK[k] = res.byK[k] || [0, 0]; res.byK[k][1]++;
          if (!bad.length) { res.pass++; res.byK[k][0]++; } else if (res.fail.length < 40) res.fail.push(`${M.gateOf(e)} ${M.label(e)} [${M.selOf(e)}] ${k}: want ${want} got ${bad[0].got}${bad[0].why ? ' · ' + bad[0].why : ''}`);
          Sd.undo(); await wait(40); }
        Sd.undo(); await wait(40);
      }
      out.knobs = res;
      // (3) corners view
      const tbBtn = U.root().querySelector('.b-corners'); tbBtn.click(); await wait(400); const pop = U.root().querySelector('.crs'); out.corners = pop ? { rows: pop.querySelectorAll('.cr').length - pop.querySelectorAll('.cr.ch').length, head: (pop.querySelector('h4:last-of-type') || {}).textContent, sample: [...pop.querySelectorAll('.cr:not(.ch)')].slice(0, 6).map((r) => r.innerText.replace(/\s+/g, ' ')) } : 'no pop'; tbBtn.click();
      return out;
    });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'chip2') {
    const r = await p.evaluate(async () => { const U = window.__bd.ui, M = BD.measure, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); U.setInspect(true);
      const chip = [...document.querySelectorAll('#board button')].find((e) => /^Marksman/.test(e.innerText.trim())); U.select([chip]); await wait(200); const before = U.lookalikes ? U.lookalikes(chip).length : '?';
      U.makeFromSelection(); await wait(300); const v = Sd.memberOf(chip); const L = U.lookalikes(chip); const famPanel = (U.panel().innerText.match(/Family[\s\S]{0,60}/) || [''])[0].replace(/\s+/g, ' ');
      const chips = [...U.panel().querySelectorAll('.kchip[data-k],[data-k]')].map((e) => e.dataset.k);
      const kids = () => [...chip.children].map((k) => k.getBoundingClientRect().left.toFixed(1)).join(' / ');
      const k0 = kids(); Sd.setValue(v.id, 'gap', 12); await wait(300); const k1 = kids(); const bad = Sd.selfCheck().length; const cg = getComputedStyle(chip).columnGap; const rules = String(Sd.css()).split('\n').filter((l) => /column-gap/.test(l)).slice(0, 3); const sel = v.members.slice(0, 3).map((m) => m.sel); Sd.undo(); await wait(200);
      return { variant: v && v.id, members: v && v.members.length, looksBefore: before, looksAfterMember: L.length, looksTiers: [...new Set(L.map((l) => l.tier))], famPanel, chips, partsAt4: k0, partsAt8: k1, selfCheckBad: bad, cg, rules, sel };
    });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'chip') {
    const r = await p.evaluate(() => { const M = BD.measure; const chip = [...document.querySelectorAll('#board button')].find((e) => /^Marksman/.test(e.innerText.trim())); const c = getComputedStyle(chip);
      const d = (e) => { const s = getComputedStyle(e), q = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()}.${[...e.classList].join('.')} [${q.left.toFixed(1)}–${q.right.toFixed(1)} w${q.width.toFixed(1)}] ml ${s.marginLeft} mr ${s.marginRight} pad ${s.paddingLeft}/${s.paddingRight} disp ${s.display} '${(e.textContent || '').trim().slice(0, 12)}'`; };
      return { chip: d(chip) + ` gap ${c.columnGap} disp ${c.display} before '${getComputedStyle(chip, '::before').content}' w ${getComputedStyle(chip, '::before').width} mr ${getComputedStyle(chip, '::before').marginRight}`, kids: [...chip.children].map(d), text: [...chip.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim()).map((n) => n.nodeValue.trim()), seen: [...chip.children].map((k) => JSON.stringify(M.seen(k))) }; });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'gkey') {
    const pt = await p.evaluate(() => { const U = window.__bd.ui; U.setInspect(true); const nb = [...document.querySelectorAll('#board button')].find((e) => /^Assault/.test(e.innerText.trim())); nb.scrollIntoView({ block: 'center' }); const r = nb.getBoundingClientRect(); return { x: r.left + 2, y: r.top + r.height / 2, hit: document.elementFromPoint(r.left + 2, r.top + r.height / 2).className }; });
    await new Promise((r) => setTimeout(r, 300)); await p.keyboard.press('g'); await new Promise((r) => setTimeout(r, 200)); await p.mouse.click(pt.x, pt.y); await new Promise((r) => setTimeout(r, 400));
    const g = await p.evaluate(() => { const st = BD.std.get ? null : null; const all = {}; try { const s = JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => /builder|bd/i.test(k)) || '{}')); for (const [k, v] of Object.entries((s.gates) || {})) all[k] = (v.guides || []).length; } catch (e) { all.err = e.message; } return { C1: BD.guides.store('C1').map((x) => `${x.name} ${x.side}`), ls: all, toast: [...window.__bd.ui.root().querySelectorAll('*')].map((e) => e.textContent).find((t) => /Guide on|guide dropped|drop a guide/i.test(t || '')) }; });
    console.log('guides after G + click:', JSON.stringify(g), 'clicked', JSON.stringify(pt)); await b.close(); srv.close(); return;
  }
  if (MODE === 'snap') {
    const r = await p.evaluate(async () => {
      const U = window.__bd.ui, M = BD.measure, G = BD.guides, Sd = BD.std; const wait = (ms) => new Promise((x) => setTimeout(x, ms)); U.setInspect(true); const res = [];
      for (const gate of ['C1', 'C2', 'C3', 'C4', 'C6', 'C8']) {
        const gEl = M.gateEl(gate); if (!gEl) continue; const T = [...M.things(gEl)].filter((e) => /control|box/.test(M.kindOf(e))).slice(0, 60);
        for (const el of T) for (const side of ['left', 'right']) {
          const g = G.add(gate, el, side) || G.store(gate).slice(-1)[0]; const tags = G.tags(gate, g); const ti = tags.findIndex((t) => Math.abs(t.d) >= 0.5 && Math.abs(t.d) <= 3);
          if (ti < 0) { G.remove(gate, g.id); continue; }
          const t = tags[ti]; const before = t.d; await U.guideAct('gsnap', { gid: g.id, ti: String(ti) }); await wait(250);
          const after = G.tags(gate, g).find((x) => x.el === t.el); const ok = after && Math.abs(after.d) < 0.5;
          res.push({ gate, guide: `${M.label(el)} ${side}`, target: M.label(t.el), before: +before.toFixed(2), after: after ? +after.d.toFixed(2) : 'gone', ok, msg: (document.querySelector('#bd-toast') || {}).textContent });
          Sd.undo(); await wait(150); const back = G.tags(gate, g).find((x) => x.el === t.el); res[res.length - 1].undone = back ? +back.d.toFixed(2) : 'gone';
          G.remove(gate, g.id); if (res.length >= 6) return res;
        }
      }
      return res;
    });
    console.log(JSON.stringify(r, null, 1)); await b.close(); srv.close(); return;
  }
  if (MODE === 'shots') {
    const D = path.join(__dirname); const shot = async (name, fn) => { await p.evaluate(fn); await new Promise((r) => setTimeout(r, 700)); await p.screenshot({ path: path.join(D, `s1-${name}.png`) }); };
    await shot('search', async () => { const B = window.__bd, U = B.ui; const inp = [...document.querySelectorAll('#board input')].find((e) => /^Search/.test(e.placeholder || '')); inp.scrollIntoView({ block: 'center' }); U.setInspect(true); U.select([inp]); U.makeFromSelection(); });
    await shot('code', async () => { const U = window.__bd.ui; const btn = document.querySelector('#board button.wg-code'); btn.scrollIntoView({ block: 'center' }); U.select([btn]); });
    await shot('guide', async () => { const U = window.__bd.ui, M = BD.measure; const ca = [...document.querySelectorAll('#board button')].find((e) => /^New build$/.test(e.innerText.trim())); ca.scrollIntoView({ block: 'center' }); U.select([ca]); BD.guides.add(M.gateOf(ca), ca, 'right'); U.select([ca]); U.draw(); });
    console.log('shots written'); await b.close(); srv.close(); return;
  }
  console.log(JSON.stringify(out, null, 1));
  if (errs.length) console.log('ERRORS', errs.slice(0, 5));
  await b.close(); srv.close();
})().catch((e) => { console.error('probe FAIL', e.message); process.exit(1); });
