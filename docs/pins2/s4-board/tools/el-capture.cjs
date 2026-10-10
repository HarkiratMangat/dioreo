// Session 4 · LIVE element samples for the element board: every tone and state of every tile in el/plan.json (el-plan.py), and three
// things the plan cannot see because a resting walk never draws them — every ICON (glyph × size × line weight, by its symbol), every
// TOOLTIP (data-tip, shown by a real hover), and every element that appears only while its row or card is HOVERED.
// Harkirat, 2026-10-02 18:47 EDT: "Show me every button design/choice/variation … every icon. every hover-event … every individual thing,
// but nothing as a fully constructed product."
// Each sample is the ELEMENT ALONE: Board 4's real markup and classes, inside an empty copy of every ancestor up to <body> (so descendant
// selectors still match; their layout neutralised), pinned to the width and height Board 4 draws it at, with the ground it sits on in
// Board 4 composited from every ancestor (a tint is see-through, so a lone element on the board's own ground would lie about its colour).
// One stylesheet is pruned from Board 4's own, as live-capture.cjs does, with every state pseudo-class rewritten to a class the board can
// set: :hover → .fz-h, :focus-visible → .fz-fv, :focus → .fz-f, :active → .fz-a, :focus-within → .fz-fw.
// Elements are found again by the census's own walk (diff-census.cjs: the same roots, the same visibility rule, the same order), and each
// one is checked against the plan's tag and classes before it is captured; a mismatch is reported, never captured.
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/el-capture.cjs   → el/samples.json
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const EL = path.join(__dirname, 'el'); const plan = JSON.parse(fs.readFileSync(path.join(EL, 'plan.json'), 'utf8'));
const SRC = process.env.SRC || 'b4'; const PW = SRC === 'portal' ? require('./portal-walk.cjs') : null;
const COVERS = String.raw`(sh, l) => l === sh || l.startsWith(sh + '-')`;
const want = new Map(); // view index -> [{id, i, tag, cls}]
for (const [ty, tiles] of Object.entries(plan.types)) for (const t of tiles) for (const tn of t.tones) {
  const add = (sid, r) => { if (!want.has(r.v)) want.set(r.v, []); want.get(r.v).push({ id: sid, i: r.i, tag: r.tag, cls: r.cls, txt: r.txt }); };
  add(`${t.id}.${tn.id}`, tn.rep); for (const [k, x] of Object.entries(tn.states || {})) add(`${t.id}.${tn.id}.${k}`, x.rep);
}
const NOANIM = '*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}';
// in the page: the census's walk, and the copy of one element
const { PAGE } = require('./el-page.cjs');
(async () => {
  const { b, p, errs } = PW ? await PW.open() : await W.open(); if (PW) await PW.load(p, 'home'); await p.setRequestInterception(true);
  p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  const reload = PW ? async () => { await PW.load(p, 'home'); } : async () => { await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await p.evaluate(() => document.fonts.ready); await W.sleep(900); };
  const out = { samples: {}, ctx: {}, icons: {}, tips: {}, revealed: {}, misses: [], tokens: [] };
  // every token Board 4 sets on :root, resolved, so each value on the board can say which token gives it (Harkirat, 2026-10-02 18:59 EDT:
  // "plus stating any existing tokens already in the system")
  { let names; if (PW) names = (await p.evaluate(() => { const out = new Set(); const walk = (rs) => { for (const r of rs) { if (r.selectorText && /(^|,)\s*(:root|html)\b/.test(r.selectorText)) for (let i = 0; i < r.style.length; i++) if (r.style[i].startsWith('--')) out.add(r.style[i]); if (r.cssRules) walk(r.cssRules); } };
      for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} } return [...out]; })).map((n) => [n, ':root']);
    else { const md = fs.readFileSync(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/tokens.md'), 'utf8'); names = [...md.matchAll(/^\| `(--[\w-]+)` \| ([^|]*) \| ([^|]*) \|/gm)].map((m) => [m[1], m[3].trim()]); }
    await p.evaluate(PAGE);
    out.tokens = await p.evaluate((names) => names.map(([n, scope]) => { const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); let rgba = null;
      if (v && /^(#|rgb|hsl|oklch|oklab|color|lab|lch|hwb)/i.test(v)) { const c = window.__fzRGBA(v); rgba = c[3] === 0 && !/0\)$/.test(v) ? null : c; }
      return { name: n, scope, value: v.slice(0, 120), rgba }; }), names); }
  const seenIcon = new Map(); const seenRev = new Set(); let tipsDone = 0; const hovered = new Set();
  const views = plan.views;
  for (let vi = 0; vi < views.length; vi++) {
    const v = views[vi]; if ((v.src || 'b4') !== SRC) continue;
    if (PW) { await PW.replay(p, v); } else await reload();
    if (!PW && (v.kind === 'state' || v.kind === 'try')) { const acts = await W.actions(p, v.id); const a = acts.find((x) => x[0] === v.kind && x[2] === v.label); if (a) await W.act(p, v.id, a[0], a[1]); else { out.misses.push(`view ${vi}: no action ${v.label}`); continue; } }
    let scope = PW ? { kind: 'pop', sel: v.scope } : { kind: 'stage', sel: W.STAGE(v.id) };
    if (!PW && (v.kind === 'pop' || v.kind === 'drawer')) { const pop = W.POPS.find((x) => x.label === v.label); const o = await W.openPop(p, pop); if (!o.ok) { out.misses.push(`view ${vi}: ${v.label} did not open`); continue; } scope = { kind: 'pop', sel: pop.sel || W.POP_SEL }; }
    await p.addStyleTag({ content: NOANIM }); await W.sleep(150); await p.evaluate(PAGE);
    // the planned tones and states
    const wanted = want.get(vi) || [];
    const got = await p.evaluate((scope, wanted) => { const els = window.__fzWalk(scope); const res = {}; const miss = [];
      const clsOf = (e) => (typeof e.className === 'string' ? e.className : e.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).sort().join('.');
      const own = (e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim().slice(0, 40);
      for (const w of wanted) { let e = els[w.i];
        if (!e || e.tagName.toLowerCase() !== w.tag || clsOf(e) !== w.cls) { const alt = els.find((x) => x.tagName.toLowerCase() === w.tag && clsOf(x) === w.cls && own(x) === (w.txt || '')) || els.find((x) => x.tagName.toLowerCase() === w.tag && clsOf(x) === w.cls);
          if (!alt) { miss.push(w.id + ' wanted ' + w.tag + '.' + w.cls + ' found ' + (e ? e.tagName.toLowerCase() + '.' + clsOf(e) : 'nothing')); continue; } e = alt; }
        e.setAttribute('data-fz-want', w.id); res[w.id] = true; }
      return { res, miss, n: els.length }; }, scope, wanted);
    for (const sid of Object.keys(got.res)) {
      await p.evaluate((sid, still) => { const e = document.querySelector(`[data-fz-want="${sid}"]`); if (e && !still) e.scrollIntoView({ block: 'center' }); document.querySelectorAll('.b3-bdgs:not(.in)').forEach((x) => x.classList.add('in')); }, sid, scope.kind === 'pop'); await W.sleep(scope.kind === 'pop' ? 0 : 120);
      got.res[sid] = await p.evaluate((sid) => { const e = document.querySelector(`[data-fz-want="${sid}"]`); if (!e) return null; e.removeAttribute('data-fz-want'); const cp = window.__fzCopy(e);
        return { ctx: window.__fzCtx(e), spec: cp.spec, txt: cp.txt, ground: cp.ground, tag: cp.tag, cls: cp.cls }; }, sid);
      if (!got.res[sid]) { delete got.res[sid]; out.misses.push(`view ${vi}: ${sid} lost before its copy`); } }
    for (const [sid, x] of Object.entries(got.res)) { const key = require('crypto').createHash('sha1').update(x.ctx.html).digest('hex').slice(0, 12);
      if (!out.ctx[key]) out.ctx[key] = { html: x.ctx.html, ground: x.ctx.ground, w: x.ctx.w, h: x.ctx.h };
      out.samples[sid] = { ctx: key, k: x.ctx.k, rect: x.ctx.rect, crop: x.ctx.crop, spec: x.spec, txt: x.txt, ground: x.ground }; }
    out.misses.push(...got.miss.map((m) => `view ${vi} (${v.g} ${v.label}): ${m}`));
    // every icon in the view: one sample per glyph × size × line weight, a tone per colour
    const icons = await p.evaluate((scope) => { const els = window.__fzWalk(scope).filter((e) => e.tagName.toLowerCase() === 'svg'); const out = [];
      for (const e of els) { const u = e.querySelector('use'); const href = u ? (u.getAttribute('href') || u.getAttribute('xlink:href') || '') : ''; const shape = e.querySelector('path, line, polyline, circle, rect, polygon, ellipse');
        const glyph = href || ('inline:' + [...e.querySelectorAll('path, line, polyline, circle, rect, polygon, ellipse')].map((x) => x.tagName + (x.getAttribute('d') || x.getAttribute('points') || [x.getAttribute('cx'), x.getAttribute('r'), x.getAttribute('x1'), x.getAttribute('y1')].join(','))).join('|').slice(0, 300));
        const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); const sw = shape ? getComputedStyle(shape).strokeWidth : cs.strokeWidth;
        out.push({ glyph, w: Math.round(r.width * 2) / 2, h: Math.round(r.height * 2) / 2, sw, color: cs.color, idx: els.indexOf(e) }); }
      return out; }, scope);
    for (const ic of icons) { const key = `${ic.glyph}|${ic.w}x${ic.h}|${ic.sw}`; const tone = ic.color; const k2 = key + '|' + tone;
      if (!seenIcon.has(k2)) { seenIcon.set(k2, 1); const cp = await p.evaluate((scope, idx) => { const els = window.__fzWalk(scope).filter((e) => e.tagName.toLowerCase() === 'svg'); return els[idx] ? window.__fzCopy(els[idx]) : null; }, scope, ic.idx);
        if (cp) { (out.icons[key] = out.icons[key] || { glyph: ic.glyph, w: ic.w, h: ic.h, sw: ic.sw, tones: {} }).tones[tone] = { sample: cp, where: [] }; } }
      if (out.icons[key] && out.icons[key].tones[tone]) out.icons[key].tones[tone].where.push(`${v.g} ${v.label}`); }
    // elements shown only while their row, card or item is hovered: hover the first of each kind with the real pointer, take what appears
    if (scope.kind === 'stage' || PW) {
      const hosts = await p.evaluate((scope) => { const els = window.__fzWalk(scope); const seen = new Set(); const out = [];
        els.forEach((e, i) => { const c = (typeof e.className === 'string' ? e.className : '').trim().split(/\s+/).sort().join('.'); const key = e.tagName + '.' + c;
          const rowish = e.matches('.wg-r, .wg-h, .b3-hi-r, .b3-hi-day, tbody tr, .g-card, .b3-tk, .b3-tk-f, .exs-i, .cx-w, td.cx-c, .dcard, .lc, .f-row, .b3-xt-w, li, .pb-cgi, .row, .lrow, .rvr, .att-row, .bcard, .srec-tile, .sess, .card, .tile');
          if (rowish && !seen.has(key)) { seen.add(key); e.setAttribute('data-fz-host', out.length); out.push({ key, i }); } });
        return out; }, scope);
      for (const h of hosts) {
        if (hovered.has(v.g + ' ' + h.key)) continue; hovered.add(v.g + ' ' + h.key);
        const before = await p.evaluate((n) => { const host = document.querySelector('[data-fz-host="' + n + '"]'); if (!host) return null; host.scrollIntoView({ block: 'center' });
          const all = [...host.querySelectorAll('*')]; all.forEach((x, k) => x.setAttribute('data-fz-k', k)); return all.map((x) => { const cs = getComputedStyle(x); const r = x.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && r.width > 0.5 && r.height > 0.5; }); }, hosts.indexOf(h));
        if (!before) continue;
        const hb = await p.$(`[data-fz-host="${hosts.indexOf(h)}"]`); if (!hb) continue; const bb = await hb.boundingBox(); if (!bb) continue;
        await p.mouse.move(bb.x + Math.min(40, bb.width / 2), bb.y + bb.height / 2); await W.sleep(350);
        const rev = await p.evaluate((n, before) => { const host = document.querySelector('[data-fz-host="' + n + '"]'); const all = [...host.querySelectorAll('[data-fz-k]')]; const out = [];
          all.forEach((x, k) => { const cs = getComputedStyle(x); const r = x.getBoundingClientRect(); const now = cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05 && r.width > 0.5 && r.height > 0.5;
            if (now && !before[k] && !(x.parentElement && x.parentElement.hasAttribute('data-fz-rv'))) { x.setAttribute('data-fz-rv', ''); const c = (typeof x.className === 'string' ? x.className : x.getAttribute('class') || '').trim().split(/\s+/).sort().join('.'); out.push({ key: x.tagName.toLowerCase() + '.' + c, copy: window.__fzCopy(x) }); } });
          return out; }, hosts.indexOf(h), before);
        for (const r of rev) { const k = `${r.key} in ${h.key}`; if (seenRev.has(k)) continue; seenRev.add(k); out.revealed[k] = { host: h.key, view: `${v.g} ${v.label}`, sample: r.copy }; }
        await p.mouse.move(2, 2); await W.sleep(150);
      }
      // tooltips: hover a data-tip element with the real pointer and take the tip that appears
      if (tipsDone < 6) {
        const tips = await p.evaluate((scope) => window.__fzWalk(scope).filter((e) => e.hasAttribute('data-tip')).slice(0, 2).map((e) => { e.setAttribute('data-fz-tip', ''); return (e.getAttribute('data-tip') || '').slice(0, 40); }), scope);
        const hs = await p.$$('[data-fz-tip]');
        for (let k = 0; k < hs.length; k++) { const bb = await hs[k].boundingBox(); if (!bb) continue; const vis0 = await p.evaluate(() => [...document.body.querySelectorAll('*')].filter((x) => /fixed|absolute/.test(getComputedStyle(x).position) && x.getBoundingClientRect().height > 0).length);
          await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await W.sleep(900);
          const tip = await p.evaluate((txt) => { const c = [...document.body.querySelectorAll('*')].filter((x) => /fixed|absolute/.test(getComputedStyle(x).position) && x.getBoundingClientRect().height > 4 && (x.textContent || '').trim().startsWith(txt.slice(0, 12)) && !x.hasAttribute('data-tip'));
            const e = c.sort((a, b) => a.getBoundingClientRect().width - b.getBoundingClientRect().width)[0]; return e ? window.__fzCopy(e) : null; }, tips[k]);
          if (tip) { out.tips[`${v.g} ${v.label} · ${tips[k]}`] = tip; tipsDone++; }
          await p.mouse.move(2, 2); await W.sleep(300); }
      }
    }
    if (scope.kind === 'pop' && !PW) await W.closePop(p).catch(() => {});
    console.log(`view ${vi} ${v.g} ${v.label}: ${Object.keys(got.res).length}/${wanted.length} planned · icons ${Object.keys(out.icons).length} · revealed ${Object.keys(out.revealed).length} · tips ${Object.keys(out.tips).length}`);
  }
  // one pruned stylesheet: every sample back in one page, then every rule whose selector matches a node of a sample
  const allHtml = [...Object.values(out.ctx).map((x) => x.html), ...Object.values(out.icons).flatMap((ic) => Object.values(ic.tones).map((t) => t.sample.html)), ...Object.values(out.tips).map((x) => x.html), ...Object.values(out.revealed).map((x) => x.sample.html)];
  await reload();
  await p.evaluate((htmls) => { const box = document.createElement('div'); box.id = 'fz-relive'; box.style.cssText = 'position:absolute;left:-99999px;top:0;width:2400px'; box.innerHTML = htmls.join(''); document.body.appendChild(box); window.__fzNodes = [...box.querySelectorAll('*'), document.body, document.documentElement]; }, allHtml);
  const css = await p.evaluate(() => {
    const nodes = window.__fzNodes; const STATE = /:(hover|focus-visible|focus-within|focus|active|visited|target)(?![\w-])/g;
    const splitSel = (t) => { const out = []; let d = 0, cur = ''; for (const ch of t) { if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
    const test = (sel) => { let t = sel.replace(/::?(before|after|first-line|first-letter|placeholder|selection|marker|backdrop|-webkit-[\w-]+|-moz-[\w-]+)(\([^)]*\))?/g, '').replace(STATE, ''); t = t.replace(/:not\(\s*\)/g, '').trim(); if (!t || /[>+~]$/.test(t)) t = (t.replace(/[>+~]\s*$/, '') + ' *').trim(); if (t === '*' || t === '') return true; try { return nodes.some((n) => n.matches(t)); } catch (e) { return true; } };
    const hostify = (sel) => { let out = '', i = 0; const re = /(^|[\s>+~(,])(html|:root)(?![\w-])/g; let m;
      while ((m = re.exec(sel))) { const start = m.index + m[1].length; let j = start + m[2].length;
        while (j < sel.length && '[.#:'.includes(sel[j])) { if (sel[j] === '[') { let d = 0; do { if (sel[j] === '[') d++; if (sel[j] === ']') d--; j++; } while (j < sel.length && d > 0); }
          else { j++; if (sel[j] === ':') j++; while (j < sel.length && /[\w-]/.test(sel[j])) j++; if (sel[j] === '(') { let d = 0; do { if (sel[j] === '(') d++; if (sel[j] === ')') d--; j++; } while (j < sel.length && d > 0); } } }
        const comp = sel.slice(start + m[2].length, j); out += sel.slice(i, start) + (comp ? ':host(' + comp + ')' : ':host'); i = j; re.lastIndex = j; }
      return out + sel.slice(i); };
    const rw = (sel) => hostify(sel).replace(/(^|[\s>+~(,])body(?![\w-])/g, '$1.fz-body').replace(/:hover(?![\w-])/g, '.fz-h').replace(/:focus-visible(?![\w-])/g, '.fz-fv').replace(/:focus-within(?![\w-])/g, '.fz-fw').replace(/:focus(?![\w-])/g, '.fz-f').replace(/:active(?![\w-])/g, '.fz-a');
    const SH = ['margin', 'padding', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-color', 'border-style', 'border-width', 'border-radius', 'border-block', 'border-inline', 'border-block-start', 'border-block-end', 'border-inline-start', 'border-inline-end', 'border-image', 'outline', 'background', 'background-position', 'font', 'font-variant', 'grid', 'grid-template', 'grid-area', 'grid-row', 'grid-column', 'gap', 'place-items', 'place-content', 'place-self', 'inset', 'inset-block', 'inset-inline', 'flex', 'flex-flow', 'transition', 'animation', 'mask', 'text-decoration', 'list-style', 'overflow', 'columns', 'column-rule', 'text-emphasis', 'scroll-margin', 'scroll-padding', 'container', 'white-space', 'text-wrap', 'offset', 'margin-block', 'margin-inline', 'padding-block', 'padding-inline', 'contain-intrinsic-size', 'mask-border', 'overscroll-behavior'];
    const LONG = {}; const longs = (sh) => { if (!LONG[sh]) { const d = document.createElement('div').style; d.setProperty(sh, 'initial'); LONG[sh] = new Set([...Array(d.length).keys()].map((i) => d[i])); } return LONG[sh]; };
    const coverers = (l) => SH.filter((sh) => longs(sh).has(l));
    const decl = (st) => { const out = []; const done = new Set();
      for (let i = 0; i < st.length; i++) { const name = st[i]; const val = st.getPropertyValue(name); const pr = st.getPropertyPriority(name) ? ' !important' : '';
        if (val !== '') { out.push(name + ': ' + val + pr); continue; }
        const sh = coverers(name).find((c) => st.getPropertyValue(c) !== ''); if (!sh) return null; if (done.has(sh)) continue; done.add(sh);
        out.push(sh + ': ' + st.getPropertyValue(sh) + (st.getPropertyPriority(sh) ? ' !important' : '')); }
      return out.join('; '); };
    const norm = (t) => t.replace(/\s+/g, '').replace(/'/g, '"').replace(/\[([^\]=]+)="?([^\]"]*)"?\]/g, '[$1=$2]').replace(/(^|[^:]):(before|after|first-line|first-letter)/g, '$1::$2');
    const occ = new Map();
    for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; } const cnt = {}; const w = (rs) => { for (const r of rs) { if (r instanceof CSSStyleRule) { const k = norm(r.selectorText); cnt[k] = (cnt[k] || 0) + 1; occ.set(r, cnt[k] - 1); } else if (r.cssRules) w(r.cssRules); } }; w(rules); }
    const problems = []; let text = '', props = '';
    const walk = (rules) => { for (const r of rules) {
      if (r instanceof CSSStyleRule) { const sels = splitSel(r.selectorText).filter(test); if (!sels.length) continue; let d = decl(r.style); if (d === null) { const st = r.style; const empty = [], present = []; for (let q = 0; q < st.length; q++) (st.getPropertyValue(st[q]) === '' ? empty : present).push(st[q]); problems.push({ href: r.parentStyleSheet.href, sel: norm(r.selectorText), idx: occ.get(r), need: [...empty, ...present].map((l) => [l, ...coverers(l)]) }); d = '/*FZQ:' + (problems.length - 1) + '*/'; } text += sels.map(rw).join(', ') + ' { ' + d + ' }\n'; }
      else if (r instanceof CSSMediaRule) { if (matchMedia(r.conditionText || r.media.mediaText).matches) walk(r.cssRules); }
      else if (r instanceof CSSSupportsRule) { if (CSS.supports(r.conditionText)) walk(r.cssRules); }
      else if (typeof CSSContainerRule !== 'undefined' && r instanceof CSSContainerRule) { const before = text; text = ''; walk(r.cssRules); const inner = text; text = before; if (inner) text += '@container ' + r.conditionText + ' {\n' + inner + '}\n'; }
      else if (typeof CSSPropertyRule !== 'undefined' && r instanceof CSSPropertyRule) props += r.cssText + '\n';
    } };
    for (const sh of document.styleSheets) { if (sh.ownerNode && sh.ownerNode.textContent && sh.ownerNode.textContent.startsWith('*,*::before')) continue; let rules; try { rules = sh.cssRules; } catch (e) { continue; } walk(rules); }
    return { text, props, problems, nodes: nodes.length };
  });
  const srcCache = {}; const blocks = (file) => { if (srcCache[file]) return srcCache[file]; const t = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); const res = []; const norm = (x) => x.replace(/\s+/g, '').replace(/'/g, '"').replace(/\[([^\]=]+)="?([^\]"]*)"?\]/g, '[$1=$2]').replace(/(^|[^:]):(before|after|first-line|first-letter)/g, '$1::$2');
    const scan = (from, to) => { let p0 = from; while (p0 < to) { const ob = t.indexOf('{', p0); if (ob < 0 || ob >= to) break; const pre = t.slice(p0, ob).trim(); let d = 1, j = ob + 1; while (j < to && d) { if (t[j] === '{') d++; else if (t[j] === '}') d--; j++; }
      if (pre.startsWith('@')) { if (/^@(media|supports|container|layer)/.test(pre)) scan(ob + 1, j - 1); } else res.push({ sel: norm(pre.replace(/^[;}\s]+/, '')), body: t.slice(ob + 1, j - 1).trim() }); p0 = j; } };
    scan(0, t.length); return (srcCache[file] = res); };
  let fixed = 0; const miss = [];
  for (let k = 0; k < css.problems.length; k++) { const pr = css.problems[k]; let body = null;
    try { const file = path.resolve(__dirname, '../../../../..', decodeURIComponent(new URL(pr.href).pathname).replace(/^\//, '')); const hits = blocks(file).filter((x) => x.sel === pr.sel); const names = (bd) => bd.split(';').map((d) => d.split(':')[0].trim().toLowerCase()).filter(Boolean);
      const ok = (h) => { const ns = new Set(names(h.body)); return pr.need.every((alts) => alts.some((n) => ns.has(n))); }; const pick = hits[pr.idx] && ok(hits[pr.idx]) ? hits[pr.idx] : hits.find(ok); body = pick ? pick.body : null; } catch (e) { body = null; }
    if (body !== null) { css.text = css.text.replace('/*FZQ:' + k + '*/', body.replace(/;\s*$/, '')); fixed++; } else miss.push(pr.sel.slice(0, 60)); }
  out.css = css.text; out.props = css.props; out.errs = errs;
  out.src = SRC; const OUTF = path.join(EL, SRC === 'portal' ? 'samples-portal.json' : 'samples.json'); fs.writeFileSync(OUTF, JSON.stringify(out));
  console.log(`contexts ${Object.keys(out.ctx).length} · tokens ${out.tokens.length} · samples ${Object.keys(out.samples).length} · icons ${Object.keys(out.icons).length} glyph×size×weight (${Object.values(out.icons).reduce((n, x) => n + Object.keys(x.tones).length, 0)} tones) · tips ${Object.keys(out.tips).length} · revealed on hover ${Object.keys(out.revealed).length} · css ${(css.text.length / 1024).toFixed(0)}KB, ${fixed}/${css.problems.length} blocks restored${miss.length ? ' (missing ' + miss.join(' | ') + ')' : ''} · misses ${out.misses.length} · page errors ${errs.length} · ${(fs.statSync(OUTF).size / 1048576).toFixed(1)}MB`);
  if (out.misses.length) console.log(out.misses.slice(0, 30).join('\n'));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
