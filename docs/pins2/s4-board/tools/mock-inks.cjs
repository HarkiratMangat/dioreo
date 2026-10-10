// Two ways to carry a field's inks without prose, drawn from the board's real field and the probe's real facts, for him to pick (2026-10-08 17:25 EDT, after
// "cluttered … mainly relies on prose … none of it is easily obtainable at a glance"). A: each ink as a swatch tag on its part (no leaders, no part words).
// B: a matrix — rows are magnified crops of the parts, columns are rest · hover · focus, cells are the part's ink composited on the field's own fill.
// Usage: node mock-inks.cjs → work/lead/mock/mock-{A,B}.png
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const OUT = path.join(__dirname, 'mock'); fs.mkdirSync(OUT, { recursive: true }); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'mk-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 1400, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await p.waitForFunction(() => window.__specReady && window.__fieldParts, { timeout: 30000 }); await sleep(2500);
  await p.addStyleTag({ content: '.spec svg.anat, .spec .ov { display: none !important; } .mk-tag { position: absolute; display: flex; align-items: center; gap: 5px; padding: 3px 7px 3px 4px; border-radius: 6px; background: #0e1317; box-shadow: 0 0 0 1px #2a343d; font: 500 11px/1 "JetBrains Mono", monospace; color: #e8edf1; white-space: nowrap; pointer-events: none; } .mk-tag i { width: 12px; height: 12px; border-radius: 3px; box-shadow: inset 0 0 0 1px rgba(255,255,255,.3); } .mk-tick { position: absolute; width: 1px; background: #85939f; }' });
  // A: tags on the parts, alternating above and below in the parts' order, a 6 px tick to the part's edge
  const boxA = await p.evaluate(() => {
    const box = document.querySelector('#fields .anat-box'); box.scrollIntoView({ block: 'center', behavior: 'instant' }); const o = box.getBoundingClientRect();
    [...box.querySelectorAll('[data-anat]')].forEach((w) => { const parts = window.__fieldParts(w).sort((a, c) => a.px - c.px); let endUp = -1e9, endDn = -1e9;
      parts.forEach((c, i) => { const up = i % 2 === 0; const t = document.createElement('div'); t.className = 'mk-tag'; t.innerHTML = `<i style="background:${c.raw}"></i>${c.ink}`; box.appendChild(t); const tw = t.getBoundingClientRect().width;
        let x = c.px - o.left - 10; if (up) { x = Math.max(x, endUp + 8); endUp = x + tw; } else { x = Math.max(x, endDn + 8); endDn = x + tw; }
        const edge = (up ? c.top : c.bottom) - o.top; t.style.left = x + 'px'; t.style.top = (up ? edge - 30 : edge + 10) + 'px';
        const k = document.createElement('div'); k.className = 'mk-tick'; k.style.left = (c.px - o.left) + 'px'; k.style.top = (up ? edge - 10 : edge) + 'px'; k.style.height = '10px'; box.appendChild(k); }); });
    const r = box.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: Math.min(r.width, 980), height: r.height };
  });
  await sleep(300); await p.screenshot({ path: path.join(OUT, 'mock-A.png'), clip: boxA });
  await p.evaluate(() => document.querySelectorAll('.mk-tag, .mk-tick').forEach((e) => e.remove()));
  // B: the matrix, built from the member fields' live geometry, the probe's state pictures and its facts
  await p.evaluate(() => { const w = document.querySelector('#fields .fl-wep .f-fld'); w.scrollIntoView({ block: 'center', behavior: 'instant' }); });
  const wr = await p.evaluate(() => { const r = document.querySelector('#fields .fl-wep .f-fld').getBoundingClientRect(); return { x: r.left - 12 + scrollX, y: r.top - 12 + scrollY, width: r.width + 24, height: r.height + 24 }; });
  await p.screenshot({ path: path.join(ROOT, 'docs/pins2/s4-board/spec-img/mock-wep-rest.png'), clip: wr });
  const boxB = await p.evaluate(async () => {
    const F = await fetch('spec-img/field-facts.json').then((r) => r.json()).then((j) => j.facts); const N = window.__inkName;
    const ins = (st) => { const m = /^(.*?\))\s+0px 0px 0px ([\d.]+)px inset/.exec(st.ring || ''); return m ? m[1] : 'transparent'; };
    const geo = (sel) => { const w = document.querySelector(sel); const f = w.querySelector('.f-fld') || w.querySelector('.srch'); const r = f.getBoundingClientRect(); return { r, parts: Object.fromEntries(window.__fieldParts(w).map((c) => [c.lab, { x: c.px - r.left, y: (c.top + c.bottom) / 2 - r.top, raw: c.raw, ink: c.ink }])) }; };
    const S = geo('#fields .fl-filter'), W = geo('#fields .fl-wep'); const fill = F.filter.rest.bg;
    const crop = (img, g, x, y) => { const s = 2.6, vw = 76, vh = 56; return `<div class="mb-crop" style="background-image:url(${img});background-size:${(g.r.width + 24) * s}px auto;background-position:${-((x + 12) * s - vw / 2)}px ${-((y + 12) * s - vh / 2)}px"></div>`; };
    const R = 'spec-img/field-filter-rest.png', WR = 'spec-img/mock-wep-rest.png'; const P = S.parts;
    const rows = [
      ['outline', crop(R, S, 8, 6), [ins(F.filter.rest), ins(F.filter.hover.words), ins(F.filter.focus)]],
      ['fill', crop(R, S, P.fill.x, P.fill.y), [F.filter.rest.bg, F.filter.hover.words.bg, F.filter.focus.bg]],
      ['glass', crop(R, S, P.glass.x, P.glass.y), [P.glass.raw, P.glass.raw, P.glass.raw]],
      ['words', crop(R, S, P.words.x + 14, P.words.y), [P.words.raw, P.words.raw, P.words.raw]],
      ['placeholder', crop(WR, W, W.parts.placeholder.x + 18, W.parts.placeholder.y), [W.parts.placeholder.raw, W.parts.placeholder.raw, W.parts.placeholder.raw]],
      ['count', crop(R, S, P.count.x, P.count.y), [P.count.raw, P.count.raw, P.count.raw]],
      ['×', crop(R, S, P['×'].x, P['×'].y), [P['×'].raw, F.filter.xHoverBg || P['×'].raw, P['×'].raw]],
    ];
    const head = ['rest', 'hover', 'focus'].map((s) => `<div class="mb-h"><img src="spec-img/field-filter-${s}.png"><b>${s}</b></div>`).join('');
    const body = rows.map(([lab, cr, inks]) => `<div class="mb-r">${cr}</div>` + inks.map((c, i) => { const changed = i > 0 && N(c) !== N(inks[0]); return `<div class="mb-c${changed ? ' ch' : ''}"><div class="mb-sw" style="background:${fill}"><div style="background:${c}"></div></div><span>${N(c)}</span></div>`; }).join('')).join('');
    const css = '.mb { display:grid; grid-template-columns: 96px repeat(3, 210px); gap: 10px 14px; padding: 22px; background:#141a1f; border-radius:12px; width:max-content; } .mb-h { display:grid; gap:6px; } .mb-h img { width:210px; border-radius:6px; } .mb-h b { font: 600 11px "JetBrains Mono", monospace; color:#e8edf1; } .mb-r { display:grid; place-items:center; } .mb-crop { width:76px; height:56px; border-radius:8px; box-shadow: 0 0 0 1px #2a343d; background-repeat:no-repeat; } .mb-c { display:flex; align-items:center; gap:10px; padding:6px 8px; border-radius:8px; } .mb-c.ch { box-shadow: 0 0 0 1.5px #d8f24a; } .mb-sw { width:44px; height:44px; border-radius:9px; display:grid; place-items:center; box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); } .mb-sw > div { width:28px; height:28px; border-radius:6px; } .mb-c span { font: 500 11px "JetBrains Mono", monospace; color:#9daab4; }';
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const host = document.createElement('div'); host.className = 'mb'; host.innerHTML = '<div></div>' + head + body; document.querySelector('#fields').prepend(host); host.scrollIntoView({ block: 'start', behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 800)); const r = host.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height };
  });
  await p.screenshot({ path: path.join(OUT, 'mock-B.png'), clip: boxB }); console.log('mock A', JSON.stringify(boxA), 'mock B', JSON.stringify(boxB)); await b.close();
})().catch((e) => { console.error('mock FAIL', e.message); process.exit(1); });
