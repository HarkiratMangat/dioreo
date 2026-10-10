// What the BOARD itself draws, read headless, for the spec page to match (never hand-drawn): one run, his saved state.
//  · ancestors: the class chain (and html data-b3-* attributes) above each element the spec page renders, so it can stand in the same context
//  · lists: each dropdown opened on the board, its rows' text and its HTML (ids stripped), for a board-vs-spec diff
//  · facts: rest and REAL-mouse hover computed style of each special-case button (size, outline, fill, colour)
//  · search: the Manifest search with a query typed, at rest and with its × hovered, as pictures plus measurements
// Usage: node board-probe.cjs [--page builder.html|spec.html]   → work/lead/board-probe/<page>.json + PNGs
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const OUT = path.join(__dirname, 'board-probe'); fs.mkdirSync(OUT, { recursive: true });
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json'); const BASE = 'http://127.0.0.1:8900/docs/pins2/s4-board/';
const PAGE = (process.argv[process.argv.indexOf('--page') + 1] || '').endsWith('.html') ? process.argv[process.argv.indexOf('--page') + 1] : 'builder.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// tall enough that the drawer's lists open downward without moving the page (in 888 the board scrolls itself and the list closes on that scroll)
const VH = 1500;
// a clip is clamped to the viewport and skipped (logged) when it has no area, so one bad picture never ends the run
// clips are taken in VIEWPORT coordinates here and shifted by the scroll: puppeteer reads a clip in document coordinates
const shot = async (p, file, c) => { const x = Math.max(0, c.x), y = Math.max(0, c.y), w = Math.min(1282 - x, c.width), h = Math.min(VH - y, c.height); const [sx, sy] = await p.evaluate(() => [scrollX, scrollY]); if (!(w >= 4 && h >= 4)) { console.log('skip shot', path.basename(file), JSON.stringify(c)); return; } fs.writeFileSync(file, Buffer.from(await p.screenshot({ captureBeyondViewport: false, clip: { x: x + sx, y: y + sy, width: w, height: h } }))); };
// [key, selector on the board, selector on the spec page]
const TARGETS = [
  ['search', '#c-manifest .srch', '#fields .srch'],
  ['weapon', '.f-card-b [data-s=build] .f-g2 .f-row:nth-child(1) .f-pick', '#fields .fl-wep .f-pick'],
  ['category', '.f-card-b [data-s=build] .f-g2 .f-row:nth-child(2) .f-pick', '#fields .fl-cat .f-pick'],
  ['attachment', '.f-card-b [data-s=atts] .f-att .f-pick', '#fields .fl-att .f-pick'],
  ['compare', '.cx-top .cx-pick', '#fields .fl-cmp .cx-pick'],
  ['stmin', '.f-stage h5 .f-stmin', '#icons .case-stmin .f-stmin'],
  ['sort', '#c-manifest .wg-sort', '#icons .case-sort .wg-sort'],
  ['collapse', '#c-manifest .wg-fbtn', '#icons .case-collapse .wg-fbtn'],
  ['caret', '.f-card-b [data-s=build] .f-g2 .f-row:nth-child(1) .f-caret', '#fields .fl-wep .f-caret'],
  ['chips', '#c-manifest .mt-grp:has(.chip.topic)', '#pills .mt-grp'],
];
(async () => {
  const spec = PAGE === 'spec.html'; const col = spec ? 2 : 1;
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 180000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'bp-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: VH, deviceScaleFactor: 2 }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(STATE, 'utf8'));
  await p.goto(BASE + PAGE, { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction((s) => (s ? window.__specReady : window.__sxReady), { timeout: 60000 }, spec); await p.evaluate(() => document.fonts.ready); await sleep(1200);
  if (!spec) {
    await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
    // the New build drawer: its real button opens it with one blank card
    await p.evaluate(() => { const t = document.querySelector('#c-manifest .madd'); t.scrollIntoView({ block: 'center', behavior: 'instant' }); t.click(); }); await sleep(1500);
  }
  const res = { page: PAGE, found: {}, ancestors: {}, facts: {}, lists: {} };
  // the build card's markup at rest (ids stripped): the proof that extracting its fields into components changed nothing
  if (!spec) { const card = await p.evaluate(() => { const c = document.querySelector('.f-card-b'); return c ? c.outerHTML.replace(/\s(id|for|aria-controls|aria-activedescendant|aria-labelledby|aria-describedby)="[^"]*"/g, '') : null; }); if (card) fs.writeFileSync(path.join(OUT, PAGE + '-card.html'), card); }
  // what a button LOOKS like is drawn by its skin: the largest visible box among the button, its children and their ::before/::after (Collapse draws
  // its outlined box on a child, so reading the button element alone said "no outline" under an outlined box)
  const css = (sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const skinOf = (b) => { const A = (c) => { const m = /\(([^)]*)\)/.exec(c || ''); if (!m) return 1; const p = m[1].replace(/^srgb\s+/, '').split(/[\s,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; }; let best = null;
      const add = (el, ps) => { const c = getComputedStyle(el, ps); if (ps && (c.content === 'none' || c.content === 'normal')) return; const bw = parseFloat(c.borderTopWidth);
        const vis = (bw > 0 && c.borderTopStyle !== 'none' && A(c.borderTopColor) > 0.01) || /inset/.test(c.boxShadow) || A(c.backgroundColor) > 0.01; if (!vis) return;
        let w, h; if (ps) { w = parseFloat(c.width) || 0; h = parseFloat(c.height) || 0; } else { const r = el.getBoundingClientRect(); w = r.width; h = r.height; } if (!best || w * h > best.a) best = { a: w * h, c, w, h }; };
      [b, ...b.querySelectorAll('*')].forEach((el) => { add(el); add(el, '::before'); add(el, '::after'); }); return best; };
    const c = getComputedStyle(e); const r = e.getBoundingClientRect(); const k = skinOf(e); const sc = k ? k.c : c;
    const wr = (() => { const t = document.createTreeWalker(e, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? 1 : 2) }); let n, wv = 0; while ((n = t.nextNode())) { const g = document.createRange(); g.selectNodeContents(n); const q = g.getBoundingClientRect(); const pe = n.parentElement && getComputedStyle(n.parentElement); if (q.width > 0.5 && pe && pe.visibility !== 'hidden' && +pe.opacity > 0.05) wv += q.width; } return wv > 0.5 || [e, ...e.querySelectorAll('*')].some((x) => ['::before', '::after'].some((ps) => { const c = getComputedStyle(x, ps); return /^"[^"]+"$/.test(c.content) && c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05 && (parseFloat(c.width) || 0) > 0.5; })); })();
    const icn = e.querySelector('svg'); return { opacity: c.opacity, outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`, icon: icn ? +icn.getBoundingClientRect().width.toFixed(1) : null, w: +r.width.toFixed(1), h: +r.height.toFixed(1), sw: k ? +k.w.toFixed(1) : null, sh: k ? +k.h.toFixed(1) : null, border: `${sc.borderTopWidth} ${sc.borderTopStyle} ${sc.borderTopColor}`, ring: sc.boxShadow, bg: sc.backgroundColor, color: c.color, radius: sc.borderTopLeftRadius, transform: c.transform, words: wr }; }, sel);
  for (const t of TARGETS) {
    const [k] = t; const sel = t[col]; console.log('target', k);
    const info = await p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; e.scrollIntoView({ block: 'center', behavior: 'instant' }); const chain = []; let x = e.parentElement;
      while (x && x !== document.body) { const at = [...x.attributes].filter((q) => /^data-|^style$/.test(q.name) && !/[\]]/.test(q.value)).map((q) => `[${q.name}=${q.value}]`).join(''); chain.push(x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') + (x.className && typeof x.className === 'string' && x.className.trim() ? '.' + x.className.trim().split(/\s+/).join('.') : '') + at); x = x.parentElement; }
      const data = [...document.documentElement.attributes].filter((a) => a.name.startsWith('data-')).map((a) => `${a.name}=${a.value}`); return { chain, path: chain.slice().reverse().join(' > '), data, cls: e.className }; }, sel);
    res.found[k] = Boolean(info); if (!info) continue; res.ancestors[k] = info;
    // RULES=<key>: every stylesheet rule that matches the element and sets its size or type, in cascade order (why a copy differs from the board)
    if (process.env.RULES === k) console.log('RULES ' + k + '\n' + (await p.evaluate((sel) => { const e = document.querySelector(sel); const out = [];
      const walk = (list, sheet) => { for (const r of list) { if (r.cssRules && !r.selectorText) { try { walk(r.cssRules, sheet); } catch (x) {} continue; } if (!r.selectorText) continue; let hit = false; try { hit = e.matches(r.selectorText); } catch (x) {} if (!hit) continue;
        const props = ['min-height', 'height', 'font-size', 'font', 'letter-spacing', 'line-height', 'padding', 'display'].filter((q) => r.style.getPropertyValue(q)).map((q) => `${q}:${r.style.getPropertyValue(q)}`); if (props.length) out.push(`${(sheet.href || 'inline').replace(/^.*\//, '')} | ${r.selectorText.slice(0, 120)} | ${props.join('; ')}`); } };
      for (const sh of document.styleSheets) { try { walk(sh.cssRules, sh); } catch (x) {} } const c = getComputedStyle(e); out.push(`COMPUTED min-height ${c.minHeight} height ${c.height} font ${c.font} ls ${c.letterSpacing}`); return out.join('\n'); }, sel)));
    if (['stmin', 'sort', 'collapse', 'caret'].includes(k)) {
      await sleep(250); const rest = await css(sel); const q = await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
      await p.mouse.move(q.x, q.y); await sleep(450); const hover = await css(sel); await p.mouse.move(2, 2); await sleep(250); res.facts[k] = { rest, hover };
      const r = await p.evaluate((sel) => { const e = document.querySelector(sel).getBoundingClientRect(); return { x: e.left - 24, y: e.top - 16, w: e.width + 48, h: e.height + 32 }; }, sel);
      await p.mouse.move(q.x, q.y); await sleep(450); await shot(p, path.join(OUT, `${PAGE}-${k}-hover.png`), { x: r.x, y: r.y, width: r.w, height: r.h }); await p.mouse.move(2, 2); await sleep(200);
      await shot(p, path.join(OUT, `${PAGE}-${k}-rest.png`), { x: r.x, y: r.y, width: r.w, height: r.h });
    }
    if (['weapon', 'category', 'attachment', 'compare'].includes(k)) {
      // opened the way a keyboard user opens it (focus), so no coordinate can land on something covering the field
      await p.mouse.move(2, 2); await sleep(150);   // the pointer parked, so the lit row is the list's own first row on both pages
      const how = await p.evaluate((sel) => { const i = document.querySelector(sel).querySelector('input'); if (!i) return 'no input'; i.focus({ preventScroll: true }); return 'focused ' + i.id; }, sel); await sleep(800);
      // a field that already held focus (the drawer focuses its first field) gets no focus event: the Picker's own ArrowDown opens it
      if (await p.evaluate((sel) => document.querySelector(sel).querySelector('input').getAttribute('aria-expanded') !== 'true', sel)) { await p.keyboard.press('ArrowDown'); await sleep(600); }
      console.log(' ', k, how, await p.evaluate((sel) => { const i = document.querySelector(sel).querySelector('input'); return i && i.getAttribute('aria-expanded'); }, sel));
      const list = await p.evaluate(() => { const lb = [...document.querySelectorAll('[role=listbox]')].find((x) => x.getClientRects().length); if (!lb) return null; const rows = [...lb.querySelectorAll('[role=option], .f-grp, [role=presentation]')].slice(0, 60).map((o) => o.textContent.replace(/\s+/g, ' ').trim());
        const g = lb.querySelector('li.f-g0'); const gb = g && getComputedStyle(g, '::before'); const g0 = g ? { row: g.textContent.replace(/\s+/g, ' ').trim().slice(0, 30), content: gb.content, bg: gb.backgroundColor, h: gb.height, marginTop: getComputedStyle(g).marginTop } : null; const htm = lb.outerHTML.replace(/\s(id|aria-activedescendant|aria-controls|aria-labelledby|for)="[^"]*"/g, ''); const r = lb.getBoundingClientRect(); return { n: lb.querySelectorAll('[role=option]').length, rows, g0, htm, box: { x: r.left, y: r.top, w: r.width, h: Math.min(r.height, 520) } }; });
      if (list) { res.lists[k] = { n: list.n, rows: list.rows, g0: list.g0 }; fs.writeFileSync(path.join(OUT, `${PAGE}-${k}-list.html`), list.htm);
        const fr = await p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.left, y: r.top }; }, sel);
        const x0 = Math.max(0, Math.min(fr.x, list.box.x) - 8), y0 = Math.max(0, fr.y - 8); await shot(p, path.join(OUT, `${PAGE}-${k}-open.png`), { x: x0, y: y0, width: Math.min(700, Math.max(list.box.w, 300) + 16), height: Math.min(VH - 8 - y0, list.box.y + list.box.h - y0 + 8) }); }
      else res.lists[k] = null;
      // closed by the Picker's own Escape (it stops the key there); a key with no list open would close the drawer instead
      if (list) await p.keyboard.press('Escape'); await p.evaluate(() => document.activeElement && document.activeElement.blur()); await sleep(400);
    }
    if (k === 'search') {
      const inp = sel + ' input'; await p.click(inp, { clickCount: 3 }); await p.keyboard.type('bal'); await sleep(500);
      const m = await p.evaluate((sel) => { const s = document.querySelector(sel); const i = s.querySelector('input'); const pad = getComputedStyle(i).paddingRight; const sufW = s.querySelector('.srch-suf') ? s.querySelector('.srch-suf').getBoundingClientRect().width : null; const x = s.querySelector('.srch-x'); const h = s.querySelector('.mhits'); const R = (e) => e && e.getBoundingClientRect(); const rs = R(s), ri = R(i), rx = R(x), rh = R(h); const c = (e, p) => e && getComputedStyle(e)[p];
        return { srch: [rs.width, rs.height], input: [ri.top - rs.top, ri.height], x: rx && { top: rx.top - ri.top, right: ri.right - rx.right, w: rx.width, h: rx.height, r: c(x, 'borderTopLeftRadius'), bg: c(x, 'backgroundColor') }, hits: rh && { top: rh.top - ri.top, h: rh.height, w: rh.width, gapToX: rx ? rx.left - rh.right : null, bg: c(h, 'backgroundColor'), color: c(h, 'color'), font: c(h, 'font') }, realm: getComputedStyle(s).getPropertyValue('--realm-c'), pad: { inputPadRight: pad, suffixWidth: sufW } }; }, sel);
      const r = await p.evaluate((sel) => { const e = document.querySelector(sel).getBoundingClientRect(); return { x: e.left - 12, y: e.top - 12, w: e.width + 24, h: e.height + 24 }; }, sel);
      await shot(p, path.join(OUT, `${PAGE}-search-rest.png`), { x: r.x, y: r.y, width: r.w, height: r.h });
      const xq = await p.evaluate((sel) => { const x = document.querySelector(sel + ' .srch-x'); if (!x) return null; const q = x.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; }, sel);
      if (xq) { await p.mouse.move(xq.x, xq.y); await sleep(400); m.xHover = await css(sel + ' .srch-x'); await shot(p, path.join(OUT, `${PAGE}-search-hover.png`), { x: r.x, y: r.y, width: r.w, height: r.h }); await p.mouse.move(2, 2); }
      res.search = m; await p.click(inp, { clickCount: 3 }); await p.keyboard.press('Backspace'); await sleep(300);
    }
  }
  // every element the spec page marks data-facts: its first button at rest and under a real mouse (the page prints these, never a caption I wrote)
  if (spec) for (const key of await p.evaluate(() => [...document.querySelectorAll('[data-facts]')].map((e) => e.dataset.facts))) {
    const sel = `[data-facts="${key}"] button`; const q = await p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
    if (!q) continue; await p.mouse.move(2, 2); await sleep(250); const rest = await css(sel); await p.mouse.move(q.x, q.y); await sleep(450); const hover = await css(sel);
    // RULESFACT=<key>: while hovered, every rule that draws an edge on the button or its ::before/::after (box-shadow, border, outline), with its priority
    if (process.env.RULESFACT === key) console.log('HOVER RULES ' + key + '\n' + (await p.evaluate((sel) => { const e = document.querySelector(sel); const out = [];
      const walk = (list, href) => { for (const r of list) { if (r.cssRules && !r.selectorText) { try { walk(r.cssRules, href); } catch (x) {} continue; } if (!r.selectorText) continue;
        for (const part of r.selectorText.split(/,(?![^(]*\))/)) { const pm = /::(before|after)\s*$/.exec(part.trim()); const base = part.trim().replace(/::(before|after)\s*$/, ''); let hit = false; try { hit = e.matches(base || '*'); } catch (x) {} if (!hit) continue;
          const props = ['box-shadow', 'border-color', 'border-top-color', 'border-width', 'border', 'outline', 'outline-color'].filter((q) => r.style.getPropertyValue(q)).map((q) => `${q}:${r.style.getPropertyValue(q).slice(0, 60)}${r.style.getPropertyPriority(q) ? ' !important' : ''}`);
          if (props.length) out.push(`${pm ? '::' + pm[1] : 'el'} | ${(href || 'inline').replace(/^.*\//, '')} | ${part.trim().slice(0, 110)} | ${props.join('; ')}`); break; } } };
      for (const sh of document.styleSheets) { try { walk(sh.cssRules, sh.href); } catch (x) {} }
      const c = getComputedStyle(e), b = getComputedStyle(e, '::before'), a2 = getComputedStyle(e, '::after');
      out.push(`COMPUTED el box-shadow ${c.boxShadow} · outline ${c.outlineStyle} ${c.outlineWidth} · ::before ${b.content} ${b.boxShadow} ${b.borderTopWidth} · ::after ${a2.content} ${a2.boxShadow} ${a2.borderTopWidth}`); return out.join('\n'); }, sel)));
    await p.mouse.move(2, 2); res.facts[key] = { rest, hover };
  }
  // STATES: each [data-states] button at rest, under the mouse, held down, and as a disabled copy — a picture and the facts of each
  if (spec) { const IMG = path.join(ROOT, 'docs/pins2/s4-board/spec-img'); const keys = await p.evaluate(() => [...document.querySelectorAll('[data-states]')].map((e) => e.dataset.states)); const done = [];
    for (const k of keys) { const sel = `[data-states="${k}"] button`;
      const box = await p.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); return { x: r.left - 10, y: r.top - 10, width: r.width + 20, height: r.height + 20, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }, sel);
      const f = {}; const snap = async (st) => { await sleep(380); f[st] = await css(sel); await shot(p, path.join(IMG, `states-${k}-${st}.png`), box); };
      await p.mouse.move(2, 2); await snap('rest');
      await p.mouse.move(box.cx, box.cy); await snap('hover');
      await p.mouse.down(); await snap('press'); await p.mouse.up(); await p.mouse.move(2, 2); await sleep(200);
      await p.evaluate((sel) => document.querySelector(sel).setAttribute('disabled', ''), sel); await snap('disabled'); await p.evaluate((sel) => document.querySelector(sel).removeAttribute('disabled'), sel);
      res.facts['states-' + k] = f; done.push(k); }
    console.log('STATES', done.join(' ')); }
  // FLAGS: every --borderless cell draws no edge at rest or on hover, every --quiet cell is bare at rest (his 19:05 EDT catch: ghost--borderless showed its ring)
  if (spec) { const edge = (f) => { const bw = parseFloat(f.border); if (bw > 0 && !/none/.test(f.border) && !/(\/ 0| 0)\)$/.test(f.border)) return 'border'; /* a transparent border (rgba(…, 0) or color(… / 0)) draws nothing */ return /inset/.test(f.ring) || /0px 0px 0px [1-9]/.test(f.ring) ? 'ring' : 'none'; };
    const clear = (c) => /rgba\(0, 0, 0, 0\)|\/ 0\)$/.test(c); const bad = [];
    for (const [k, f] of Object.entries(res.facts).filter(([k]) => k.startsWith('vr-'))) { if (/borderless/.test(k)) { if (edge(f.rest) !== 'none') bad.push(`${k} rest ${edge(f.rest)}`); if (edge(f.hover) !== 'none') bad.push(`${k} hover ${edge(f.hover)}`); } if (/--quiet/.test(k) && (edge(f.rest) !== 'none' || !clear(f.rest.bg))) bad.push(`${k} not bare at rest`); if (/--ghost/.test(k) && (!clear(f.rest.bg) || !clear(f.hover.bg))) bad.push(`${k} has a fill`); }
    for (const gk of ['states-tint--ghost', 'states-paint--ghost']) { const sf = res.facts[gk]; if (!sf) bad.push(`${gk} not measured`); else for (const st of ['rest', 'hover', 'press']) if (sf[st] && !clear(sf[st].bg)) bad.push(`${gk} ${st} has a fill`); }
    const dom = await p.evaluate(() => { const t = document.querySelector('.spec').innerText; return { na: [...document.querySelectorAll('.vgrid .vc.na')].map((c) => c.dataset.na).sort().join(' '), styleGhost: (t.match(/[\w-]\.ghost\b[\w-]*/g) || []).join(' '), broken: (t.match(/undefined|NaN/g) || []).length }; });
    const NA = ['wash', 'fill'].flatMap((s) => ['--ghost', '--ghost--borderless', '--ghost--quiet', '--ghost--quiet--borderless'].map((f) => 'vr-' + s + f)).sort().join(' '); if (dom.na !== NA) bad.push(`not-allowed cells: [${dom.na}]`); if (dom.styleGhost) bad.push(`ghost as a style: ${dom.styleGhost}`); if (dom.broken) bad.push(`${dom.broken} undefined/NaN in the page text`);
    console.log('FLAGS', bad.length ? 'FAIL ' + bad.join(' · ') : 'pass'); }
  if (spec) fs.writeFileSync(path.join(ROOT, 'docs/pins2/s4-board/spec-img/spec-facts.json'), JSON.stringify({ measured: new Date().toISOString(), facts: res.facts }, null, 1));
  // every search field on the board: the glass rule reaches only a DIRECT svg child since V26, so a field that nests its glass would lose it
  if (!spec) { res.srchAll = await p.evaluate(() => [...document.querySelectorAll('.srch')].map((x) => { const d = [...x.children].filter((c) => c.tagName.toLowerCase() === 'svg'); return { gate: (x.closest('[id^=c-]') || {}).id, cls: x.className, directSvg: d.length, glassPos: d[0] ? getComputedStyle(d[0]).position : null, allSvg: x.querySelectorAll('svg').length, visible: x.getClientRects().length > 0 }; }));
    const n = await p.evaluate(() => document.querySelectorAll('.srch').length);
    for (let i = 0; i < n; i++) { const r = await p.evaluate((i) => { const x = document.querySelectorAll('.srch')[i]; if (!x.getClientRects().length) return null; x.scrollIntoView({ block: 'center', behavior: 'instant' }); const q = x.getBoundingClientRect(); return { x: q.left - 8, y: q.top - 8, width: q.width + 16, height: q.height + 16 }; }, i); if (r) { await sleep(200); await shot(p, path.join(OUT, `${PAGE}-srch-${i}.png`), r); } } }
  // the Manifest's filter chips: size, the gaps between them, and what a point just outside a chip hits (is its click area larger than it?)
  if (!spec) res.chips = await p.evaluate(() => { const cs = [...document.querySelectorAll('#c-manifest .b3-fgc > .b3-fc, #c-manifest .mt-chips > .chip')].filter((c) => c.getClientRects().length); if (!cs.length) return null; cs[0].scrollIntoView({ block: 'center', behavior: 'instant' });
    const rs = cs.map((c) => c.getBoundingClientRect()); const hit = (x, y) => { const e = document.elementFromPoint(x, y); const c = e && e.closest('.b3-fc, .chip'); return c ? (cs.indexOf(c) >= 0 ? 'chip ' + cs.indexOf(c) : 'other chip') : (e ? (e.className && typeof e.className === 'string' ? e.className.slice(0, 30) : e.tagName) : 'nothing'); };
    const r = rs[0], cx = r.left + r.width / 2, cy = r.top + r.height / 2; const after = getComputedStyle(cs[0], '::after');
    return { n: cs.length, h: rs.map((q) => Math.round(q.height * 10) / 10).filter((v, i, a) => a.indexOf(v) === i), gaps: rs.slice(1).map((q, i) => Math.round((q.left - rs[i].right) * 10) / 10).filter((v, i, a) => a.indexOf(v) === i), rowGap: rs.length > 1 ? null : null,
      afterOnChip: `${after.content} ${after.position} inset ${after.inset}`, margin: getComputedStyle(cs[0]).margin,
      hits: { center: hit(cx, cy), above3: hit(cx, r.top - 3), above6: hit(cx, r.top - 6), below3: hit(cx, r.bottom + 3), left3: hit(r.left - 3, cy), inGap: rs[1] ? hit((r.right + rs[1].left) / 2, cy) : null } }; });
  // the Post announcement drawer's field buttons and its switch, found by their icons, measured at rest and under a real mouse
  if (!spec) { res.composer = {};
    const want = { copy: 'use[href="#i-copy"]', shuffle: 'use[href="#i-shuffle"]', minus: 'use[href="#i-minus"]', plus: 'use[href="#i-plus"]', calendar: 'use[href^="#i-calendar"]' };
    const findAll = () => p.evaluate((want) => { const out = {}; const dw = [...document.querySelectorAll('.drawer.open, aside.drawer')].filter((d) => d.getClientRects().length && /announcement|Never ends|Starts/i.test(d.textContent));
      const root = dw[0]; if (!root) return null; let i = 0;
      for (const [k, q] of Object.entries(want)) { const b = [...root.querySelectorAll(q)].map((u) => u.closest('button')).filter((x) => x && x.getClientRects().length && !/Post|Stage|Cancel/.test(x.textContent))[0]; if (b) { b.setAttribute('data-probe', k); out[k] = true; } }
      const sw = [...root.querySelectorAll('[role=switch], input[type=checkbox], button[aria-checked], label')].find((x) => /never ends/i.test((x.closest('label, div') || x).textContent) && x.getClientRects().length && (x.getAttribute('role') === 'switch' || x.type === 'checkbox' || x.hasAttribute('aria-checked')));
      if (sw) { (sw.type === 'checkbox' ? (sw.closest('label') || sw) : sw).setAttribute('data-probe', 'switch'); out.switch = true; } return out; }, want);
    let got = await findAll();
    if (!got) { await p.evaluate(() => { const t = [...document.querySelectorAll('#c-broadcast button')].find((b) => /Post announcement/.test(b.textContent)); if (t) { t.scrollIntoView({ block: 'center', behavior: 'instant' }); t.click(); } }); await sleep(1500); got = await findAll(); }
    console.log('composer found', JSON.stringify(got));
    for (const k of ['copy', 'shuffle', 'minus', 'plus', 'calendar', 'switch']) { const sel = `[data-probe="${k}"]`;
      try { const q = await p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; e.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = e.getBoundingClientRect(); const chain = []; let x = e.parentElement; for (let n = 0; x && n < 4; n++, x = x.parentElement) chain.push(x.tagName.toLowerCase() + (x.className && typeof x.className === 'string' && x.className.trim() ? '.' + x.className.trim().split(/\s+/).join('.') : '')); return { x: r.left + r.width / 2, y: r.top + r.height / 2, box: { x: r.left - 40, y: r.top - 24, width: r.width + 80, height: r.height + 48 }, cls: e.className, chain: chain.reverse().join(' > ') }; }, sel);
        if (!q) { res.composer[k] = null; continue; }
        await p.mouse.move(2, 2); await sleep(300); const rest = await css(sel); await shot(p, path.join(OUT, `comp-${k}-rest.png`), q.box);
        await p.mouse.move(q.x, q.y); await sleep(450); const hover = await css(sel); await shot(p, path.join(OUT, `comp-${k}-hover.png`), q.box); await p.mouse.move(2, 2);
        res.composer[k] = { cls: q.cls, chain: q.chain, rest, hover };
        if (k === 'switch') { await p.mouse.click(q.x, q.y); await sleep(500); await p.mouse.move(2, 2); await sleep(300); const onRest = await css(sel); await shot(p, path.join(OUT, `comp-switch-on-rest.png`), q.box); await p.mouse.move(q.x, q.y); await sleep(450); const onHover = await css(sel); await shot(p, path.join(OUT, `comp-switch-on-hover.png`), q.box); await p.mouse.move(2, 2); res.composer.switch.on = { rest: onRest, hover: onHover }; }
      } catch (x) { console.log('composer', k, 'failed', x.message); res.composer[k] = null; } } }
  res.errors = errs.slice(0, 8);
  // the builder's own geometry layer: its inline <style> rules (the :not(#bd-…) ones) that reach any element the spec page copies, so the copy carries
  // the board's current sizes too (without them the Weapon column's Sort measured 48 tall on the spec page against the board's 13)
  if (!spec) { const css = await p.evaluate((sels) => { const roots = sels.map((q) => document.querySelector(q)).filter(Boolean); const els = roots.flatMap((r) => [r, ...r.querySelectorAll('*')]); const out = [];
      for (const sh of document.styleSheets) { if (sh.href) continue; let rules; try { rules = sh.cssRules; } catch (x) { continue; }
        for (const r of rules) { if (!r.selectorText || !/#bd-/.test(r.selectorText)) continue; let hit = false; try { hit = els.some((e) => e.matches(r.selectorText)); } catch (x) {} if (hit) out.push(r.cssText); } }
      // the variables those rules read, with the values the board gives them
      const vars = [...new Set(out.join(' ').match(/--bd-[\w-]+/g) || [])]; const root = getComputedStyle(document.documentElement);
      const decl = vars.map((v) => { let val = root.getPropertyValue(v).trim(); if (!val) { const e = els.find((x) => getComputedStyle(x).getPropertyValue(v).trim()); val = e ? getComputedStyle(e).getPropertyValue(v).trim() : ''; } return val ? `${v}: ${val};` : null; }).filter(Boolean);
      if (decl.length) out.unshift(`:root { ${decl.join(' ')} }`);
      return out; }, TARGETS.map((t) => t[1]));
    fs.writeFileSync(path.join(ROOT, 'docs/pins2/s4-board/spec-img/board-bd.css'), `/* the builder's geometry layer for the elements the spec page copies (board-probe.cjs, ${new Date().toISOString()}): ${css.length} rules */\n` + css.join('\n') + '\n'); }
  // the board's own facts (rest and real-mouse hover), which the spec page prints under each special case instead of a caption I wrote
  if (!spec) fs.writeFileSync(path.join(ROOT, 'docs/pins2/s4-board/spec-img/board-facts.json'), JSON.stringify({ measured: new Date().toISOString(), facts: res.facts, search: res.search, chains: Object.fromEntries(Object.entries(res.ancestors).map(([k, v]) => [k, v.path])) }, null, 1));
  fs.writeFileSync(path.join(OUT, PAGE + '.json'), JSON.stringify(res, null, 1));
  console.log(JSON.stringify({ found: res.found, lists: Object.fromEntries(Object.entries(res.lists).map(([k, v]) => [k, v && v.n])), facts: res.facts, search: res.search, errors: res.errors }, null, 1));
  await b.close();
})().catch((e) => { console.error('board-probe FAIL', e.message); process.exit(1); });
