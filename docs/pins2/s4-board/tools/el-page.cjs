// Session 4 · the in-page helpers shared by el-capture.cjs and el-shoot.cjs: the census walk (__fzWalk), a colour reader (__fzRGBA), the ground an
// element sits on composited from its ancestors (__fzGround), a copy of one element alone in an empty skeleton of its ancestors (__fzCopy)
// and a copy of its surroundings (__fzCtx). Evaluated in the page with page.evaluate(PAGE).
const PAGE = String.raw`
window.__fzWalk = (scope) => {
  const roots = scope.kind === 'stage' ? [...document.querySelectorAll(scope.sel)].filter((e) => e.getBoundingClientRect().width > 0)
    : [...document.querySelectorAll(scope.sel)].filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0);
  const out = []; const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = e.getBoundingClientRect(); return !(r.width < 0.5 || r.height < 0.5); };
  const walk = (e) => { if (!vis(e)) return; out.push(e); for (const c of e.children) walk(c); };
  for (const r of roots) walk(r); return out;
};
window.__fzCanvas = document.createElement('canvas'); window.__fzCanvas.width = window.__fzCanvas.height = 1;
window.__fzRGBA = (c) => { const cx = window.__fzCanvas.getContext('2d', { willReadFrequently: true }); cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
window.__fzGround = (el) => { const layers = []; for (let a = el.parentElement; a; a = a.parentElement) { const c = window.__fzRGBA(getComputedStyle(a).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
  let g = [11, 15, 18]; for (const c of layers.reverse()) g = g.map((x, k) => x * (1 - c[3]) + c[k] * c[3]); return 'rgb(' + g.map((x) => Math.round(x)).join(',') + ')'; };
window.__fzCtx = (el) => {
  // the smallest ancestor that holds the whole slice the board shows (the element and 48px beside it, 28px above and below), or failing
  // that the largest that fits 1180×320: a bigger copy shows nothing more and cost the board 10MB of near-identical rows
  const R0 = el.getBoundingClientRect(); const want = [R0.left - 48, R0.top - 28, R0.right + 48, R0.bottom + 28];
  let A = el.parentElement, C = A;
  while (A && A !== document.body) { const r = A.getBoundingClientRect(); if (r.width > 1180 || r.height > 320) break; C = A;
    if (r.left <= want[0] + 0.5 && r.top <= want[1] + 0.5 && r.right >= want[2] - 0.5 && r.bottom >= want[3] - 0.5) break; A = A.parentElement; }
  if (!C || C === document.body) C = el.parentElement || el;
  const CR = C.getBoundingClientRect(), R = el.getBoundingClientRect();
  const clone = C.cloneNode(true); const live = [C, ...C.querySelectorAll('*')]; const copy = [clone, ...clone.querySelectorAll('*')];
  let k = -1;
  live.forEach((n, i) => { const c = copy[i]; if (!c) return; c.setAttribute('data-fzk', i); if (n === el) k = i;
    if (n.nodeType === 1) { const cs_ = getComputedStyle(n); const gtc = cs_.gridTemplateColumns;
      if (/^subgrid/.test(gtc)) c.setAttribute('style', (c.getAttribute('style') || '') + ';display:block !important');
      else if (/grid/.test(cs_.display) && gtc && gtc !== 'none') c.setAttribute('style', (c.getAttribute('style') || '') + ';grid-template-columns:' + gtc + ' !important' + (cs_.gridTemplateRows && !/^subgrid|^none/.test(cs_.gridTemplateRows) ? ';grid-template-rows:' + cs_.gridTemplateRows + ' !important' : '')); }
    if (n.tagName === 'INPUT') { c.setAttribute('value', n.value); if (n.checked) c.setAttribute('checked', ''); c.setAttribute('readonly', ''); c.setAttribute('tabindex', '-1'); }
    if (n.tagName === 'TEXTAREA') { c.textContent = n.value; c.setAttribute('readonly', ''); c.setAttribute('tabindex', '-1'); }
    if (n.tagName === 'IMG' || n.tagName === 'CANVAS' || n.tagName === 'VIDEO') { const cs = getComputedStyle(n); const sp = document.createElement('span'); sp.setAttribute('class', n.getAttribute('class') || ''); sp.setAttribute('data-fzk', i); sp.setAttribute('style', 'display:inline-block;width:' + cs.width + ';height:' + cs.height + ';border-radius:' + cs.borderRadius + ';background:#0B0F12;vertical-align:middle'); c.replaceWith(sp); } });
  clone.querySelectorAll('script, noscript, template').forEach((x) => x.remove());
  [clone, ...clone.querySelectorAll('*')].forEach((x) => { for (const a of [...x.attributes]) if (/^on/i.test(a.name)) x.removeAttribute(a.name); });
  clone.querySelectorAll('use').forEach((u) => { const href = u.getAttribute('href') || u.getAttribute('xlink:href'); const sym = href && href.startsWith('#') && document.querySelector(href); const svg = u.closest('svg');
    if (sym) { const gEl = document.createElementNS('http://www.w3.org/2000/svg', 'g'); [...sym.childNodes].forEach((q) => gEl.appendChild(q.cloneNode(true))); if (svg && !svg.getAttribute('viewBox') && sym.getAttribute('viewBox')) svg.setAttribute('viewBox', sym.getAttribute('viewBox')); u.replaceWith(gEl); } });
  const cs0 = getComputedStyle(C); const fixedH = /absolute|fixed/.test(cs0.position) || cs0.overflowY !== 'visible';
  clone.setAttribute('style', (clone.getAttribute('style') || '') + ';width:' + CR.width + 'px !important;height:' + CR.height + 'px !important;min-height:0 !important;max-height:none !important;' + 'margin:0 !important;position:absolute !important;left:0 !important;top:0 !important;right:auto !important;bottom:auto !important;transform:none !important;opacity:1 !important;visibility:visible !important');
  let inner = clone.outerHTML;
  for (let a = C.parentElement; a && a !== document.body; a = a.parentElement) { const attrs = [...a.attributes].filter((x) => x.name !== 'style' && !/^on/i.test(x.name) && !x.name.startsWith('data-fz')).map((x) => x.name + '="' + x.value.replace(/"/g, '&quot;') + '"').join(' ');
    const st = (a.getAttribute('style') || '') + ';display:block !important;position:static !important;margin:0 !important;padding:0 !important;border:0 !important;width:' + Math.max(a.getBoundingClientRect().width, CR.width) + 'px !important;height:auto !important;min-width:0 !important;min-height:0 !important;max-height:none !important;max-width:none !important;overflow:visible !important;transform:none !important;background:none !important;box-shadow:none !important;filter:none !important;opacity:1 !important;clip-path:none !important;mask:none !important;outline:none !important';
    const tag = a.tagName.toLowerCase(); const t2 = ['table', 'thead', 'tbody', 'tr', 'td', 'th', 'colgroup'].includes(tag) && !C.closest('table') ? 'div' : tag;
    inner = '<' + t2 + ' ' + attrs + ' style="' + st.replace(/"/g, '&quot;') + '">' + inner + '</' + t2 + '>'; }
  const battrs = [...document.body.attributes].filter((x) => x.name !== 'style').map((x) => x.name === 'class' ? 'class="fz-body ' + x.value + '"' : x.name + '="' + x.value.replace(/"/g, '&quot;') + '"').join(' ');
  const html = '<div ' + (/class=/.test(battrs) ? battrs : battrs + ' class="fz-body"') + ' style="display:block !important;margin:0 !important;padding:0 !important;width:max-content !important;background:none !important;overflow:visible !important">' + inner + '</div>';
  const ex = R.left - CR.left, ey = R.top - CR.top; const x0 = Math.max(0, ex - 48), y0 = Math.max(0, ey - 28), x1 = Math.min(CR.width, ex + R.width + 48), y1 = Math.min(CR.height, ey + R.height + 28);
  return { html, ground: window.__fzGround(C), w: CR.width, h: CR.height, k, rect: [ex, ey, R.width, R.height], crop: [x0, y0, Math.max(x1 - x0, R.width), Math.max(y1 - y0, R.height)] };
};
// every @container rule the flat copy walks, in the order and under the @media/@supports conditions el-real.cjs walks them
window.__fzCQList = () => { const out = []; const walk = (rules) => { for (const r of rules) {
    if (r instanceof CSSContainerRule) { out.push(r); walk(r.cssRules); } else if (r instanceof CSSStyleRule) {} else if (r instanceof CSSMediaRule) { if (matchMedia(r.conditionText || r.media.mediaText).matches) walk(r.cssRules); }
    else if (r instanceof CSSSupportsRule) { if (CSS.supports(r.conditionText)) walk(r.cssRules); } else if (typeof CSSKeyframesRule !== 'undefined' && r instanceof CSSKeyframesRule) {} else if (r.cssRules) walk(r.cssRules); } };
  for (const sh of document.styleSheets) { const o = sh.ownerNode; if (o && (o.id === 'fz-cq' || (o.textContent && o.textContent.startsWith('*,*::before')))) continue; try { walk(sh.cssRules); } catch (e) {} } return out; };
// which size @container rules hold for this element where it sits on Board 4: a copy cannot re-ask them (its skeleton has no real widths), so
// each is turned into a style query on a custom property the copy sets when Board 4 said yes. Style queries (style(--c)) stay as written.
// list: the size queries as el-css.cjs read them from the kit's source, in its order (their index is the N of --fzq-N)
window.__fzCQHits = (el, list) => { if (!document.getElementById('fz-cq')) { const st = document.createElement('style'); st.id = 'fz-cq';
    st.textContent = list.map((q, i) => '@container ' + q + ' { [data-fzq] { --fzq-' + i + ': on } }').join('\n'); document.head.appendChild(st); }
  el.setAttribute('data-fzq', ''); const cs = getComputedStyle(el); const hits = []; list.forEach((q, i) => { if (cs.getPropertyValue('--fzq-' + i).trim() === 'on') hits.push(i); }); el.removeAttribute('data-fzq'); return hits; };
window.__fzCopy = (el, opt = {}) => {
  const R = el.getBoundingClientRect(); const clone = el.cloneNode(true); const live = [el, ...el.querySelectorAll('*')]; const copy = [clone, ...clone.querySelectorAll('*')];
  live.forEach((n, i) => { const c = copy[i]; if (!c) return;
    if (n.tagName === 'INPUT') { c.setAttribute('value', n.value); if (n.checked) c.setAttribute('checked', ''); c.setAttribute('readonly', ''); c.setAttribute('tabindex', '-1'); }
    if (n.tagName === 'TEXTAREA') { c.textContent = n.value; c.setAttribute('readonly', ''); c.setAttribute('tabindex', '-1'); }
    if (n.tagName === 'IMG' || n.tagName === 'CANVAS' || n.tagName === 'VIDEO') { const cs = getComputedStyle(n); const sp = document.createElement('span'); sp.setAttribute('class', n.getAttribute('class') || ''); sp.setAttribute('style', 'display:inline-block;width:' + cs.width + ';height:' + cs.height + ';border-radius:' + cs.borderRadius + ';background:#0B0F12;vertical-align:middle'); c.replaceWith(sp); } });
  clone.querySelectorAll('script, noscript, template').forEach((x) => x.remove());
  [clone, ...clone.querySelectorAll('*')].forEach((x) => { for (const a of [...x.attributes]) if (/^on/i.test(a.name)) x.removeAttribute(a.name); });
  // opt.sprite keeps every <use> as Board 4 wrote it and carries the symbols it points at, so a symbol's own fill, stroke, stroke-width and
  // linecaps still reach the drawing (inlining the children into a <g>, the old way, dropped them: thinner lines, dots gone from the icons)
  const spriteIds = new Set(); if (opt.sprite) { const take = (root) => root.querySelectorAll('use').forEach((u) => { const href = u.getAttribute('href') || u.getAttribute('xlink:href'); if (href && href.startsWith('#') && !spriteIds.has(href)) { const sym = document.querySelector(href); if (sym) { spriteIds.add(href); take(sym); } } }); take(clone); }
  if (!opt.sprite) clone.querySelectorAll('use').forEach((u) => { const href = u.getAttribute('href') || u.getAttribute('xlink:href'); const sym = href && href.startsWith('#') && document.querySelector(href); const svg = u.closest('svg');
    if (sym) { const gEl = document.createElementNS('http://www.w3.org/2000/svg', 'g'); [...sym.childNodes].forEach((k) => gEl.appendChild(k.cloneNode(true))); if (svg && !svg.getAttribute('viewBox') && sym.getAttribute('viewBox')) svg.setAttribute('viewBox', sym.getAttribute('viewBox')); u.replaceWith(gEl); } });
  if (clone.tagName.toLowerCase() === 'use') { /* never a root */ }
  clone.setAttribute('data-fz', 'root');
  clone.setAttribute('style', (clone.getAttribute('style') || '') + ';width:' + R.width + 'px !important;height:' + R.height + 'px !important;min-width:0 !important;max-width:none !important;margin:0 !important;position:relative !important;inset:auto !important;transform:none !important;flex:none !important;opacity:1 !important;visibility:visible !important');
  let inner = clone.outerHTML;
  // opt.has: the :has() arguments el-css.cjs found in the kit; each skeleton ancestor carries hN for every one that held on Board 4
  const hasMark = (a) => { if (!opt.has) return ''; const m = []; opt.has.forEach((arg, i) => { try { if (a.matches(':has(' + arg + ')')) m.push('h' + i); } catch (e) {} }); return m.length ? ' data-fzh="' + m.join(' ') + '"' : ''; };
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const attrs = [...a.attributes].filter((x) => x.name !== 'style' && !/^on/i.test(x.name) && !x.name.startsWith('data-fz')).map((x) => x.name + '="' + x.value.replace(/"/g, '&quot;') + '"').join(' ') + hasMark(a);
    const st = (a.getAttribute('style') || '') + ';display:block !important;position:static !important;margin:0 !important;padding:0 !important;border:0 !important;width:max-content !important;height:auto !important;min-width:0 !important;min-height:0 !important;max-height:none !important;max-width:none !important;overflow:visible !important;transform:none !important;background:none !important;box-shadow:none !important;filter:none !important;opacity:1 !important;clip-path:none !important;mask:none !important;outline:none !important';
    // opt.tables keeps a table's own tags (the kit styles the table element, and type inherits from it); the whole chain is there, so the parser keeps it
    const tag = a.tagName.toLowerCase(); const t2 = !opt.tables && ['table', 'thead', 'tbody', 'tr', 'td', 'th', 'colgroup'].includes(tag) ? 'div' : tag;
    inner = '<' + t2 + ' ' + attrs + ' style="' + st.replace(/"/g, '&quot;') + '">' + inner + '</' + t2 + '>'; }
  const battrs = [...document.body.attributes].filter((x) => x.name !== 'style').map((x) => x.name === 'class' ? 'class="fz-body ' + x.value + '"' : x.name + '="' + x.value.replace(/"/g, '&quot;') + '"').join(' ') + hasMark(document.body);
  const sprite = spriteIds.size ? '<svg aria-hidden="true" data-fz="sprite" style="position:absolute !important;width:0 !important;height:0 !important;overflow:hidden !important"><defs>' + [...spriteIds].map((id) => document.querySelector(id).outerHTML).join('') + '</defs></svg>' : '';
  const html = '<div ' + (/class=/.test(battrs) ? battrs : battrs + ' class="fz-body"') + ' style="' + (opt.vars ? opt.vars.replace(/"/g, '&quot;') + ';' : '') + 'display:block !important;margin:0 !important;padding:0 !important;width:max-content !important;background:none !important;overflow:visible !important">' + inner + '</div>' + sprite;
  const cs = getComputedStyle(el);
  const spec = { h: R.height, w: R.width, font: cs.fontFamily.split(',')[0].replace(/["']/g, '') + ' ' + cs.fontSize + '/' + cs.fontWeight, color: cs.color, bg: cs.backgroundColor, radius: cs.borderRadius, pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].join(' '), border: cs.borderTopWidth + ' ' + cs.borderTopColor, gap: cs.columnGap, shadow: cs.boxShadow };
  return { html, ground: window.__fzGround(el), spec, cls: (typeof el.className === 'string' ? el.className : el.getAttribute('class') || ''), tag: el.tagName.toLowerCase(), txt: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40) };
};`;
// Board 4's kit has no doctype, so a local load runs in quirks mode; the published artifact is wrapped in a doctype and runs in standards mode,
// which is what Harkirat sees. STD(p) serves the board with a doctype in front, so the next load matches the published page.
async function STD(p) { const fs = require('fs'); const path = require('path'); const ROOT = path.resolve(__dirname, '../../../..');
  await p.setRequestInterception(true);
  p.on('request', (rq) => { const u = new URL(rq.url()); if (u.hostname === '127.0.0.1' && /\/docs\/pins2\/kit\/[^/]+\.html$/.test(u.pathname)) { const f = path.join(ROOT, decodeURIComponent(u.pathname));
    if (fs.existsSync(f)) return rq.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html>' + fs.readFileSync(f, 'utf8') }); } rq.continue(); }); }
module.exports = { PAGE, STD };
