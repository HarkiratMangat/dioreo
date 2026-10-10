// Board 4: Builder · check.js — the impact check. A snapshot of every element on all nine gates (box, cut-off content, cut-short text, line
// count), taken before a knob moves and after it is let go; the difference is what that change broke anywhere on the board, named by gate.
// "Check at 1282" runs the same in a hidden frame at Session 5's comparator width, when this view allows a frame (it reports when it can't).
// Plan: local/pins2/s4/builder-plan.md (v3) § How it works · Impact check.
(function () {
  const BD = (window.BD = window.BD || {});
  function snap(root) {
    root = root || document.getElementById('board'); const out = new Map(); if (!root) return out;
    for (const el of root.querySelectorAll('*')) {
      if (el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg') continue;
      const r = el.getBoundingClientRect(); if (r.width < 0.5 && r.height < 0.5) continue;
      const c = getComputedStyle(el); if (c.display === 'none' || c.visibility === 'hidden') continue;
      const clips = /(hidden|clip|auto|scroll)/.test(c.overflowX); const sw = el.scrollWidth, cw = el.clientWidth;
      const txt = [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()); const lh = parseFloat(c.lineHeight) || parseFloat(c.fontSize) * 1.25;
      const lines = txt && lh ? Math.max(1, Math.round((r.height - parseFloat(c.paddingTop) - parseFloat(c.paddingBottom) - parseFloat(c.borderTopWidth) - parseFloat(c.borderBottomWidth)) / lh)) : 0;
      out.set(el, { x: r.left, y: r.top, w: r.width, h: r.height, ov: clips && sw > cw + 1 && c.textOverflow !== 'ellipsis', ell: c.textOverflow === 'ellipsis' && sw > cw + 1, lines, abs: /absolute|fixed/.test(c.position) });
    }
    return out;
  }
  function diff(a, b) {
    const M = BD.measure; const probs = [];
    for (const [el, B] of b) {
      const A = a.get(el); if (!A) continue; const base = { el, gate: M.gateOf(el), name: M.nameOf(el) };
      if (B.ov && !A.ov) probs.push({ ...base, what: 'is now cut off (what it holds is wider than it)' });
      if (B.ell && !A.ell) probs.push({ ...base, what: 'now cuts its words short (…)' });
      if (B.lines > A.lines && A.lines >= 1) probs.push({ ...base, what: `now wraps onto ${B.lines} lines` });
    }
    const parents = new Map(); for (const [el, B] of b) { if (B.abs || !el.parentElement) continue; const p = el.parentElement; if (!parents.has(p)) parents.set(p, []); parents.get(p).push(el); }
    const ov = (S, x, y) => { const P = S.get(x), Q = S.get(y); if (!P || !Q) return 0; const w = Math.min(P.x + P.w, Q.x + Q.w) - Math.max(P.x, Q.x), h = Math.min(P.y + P.h, Q.y + Q.h) - Math.max(P.y, Q.y); return w > 0.5 && h > 0.5 ? w * h : 0; };
    for (const [, kids] of parents) {
      if (kids.length < 2 || kids.length > 60) continue;
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) { const x = kids[i], y = kids[j]; if (ov(b, x, y) > 2 && ov(a, x, y) <= 2) probs.push({ el: x, other: y, gate: M.gateOf(x), name: M.nameOf(x), what: `now overlaps ${M.label(y)}` }); }
    }
    return probs;
  }
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  // the standard against Board 4 on this page: every problem the standard causes, wherever it is
  async function standardVsBoard() { const was = BD.std.compare; BD.std.setCompare(true); await raf2(); const a = snap(); BD.std.setCompare(false); await raf2(); const b = snap(); BD.std.setCompare(was); return diff(a, b); }
  function frame1282() {
    return new Promise((res) => {
      const f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;left:-30000px;top:0;width:1282px;height:888px;border:0;visibility:hidden';
      const u = new URL(location.href); u.searchParams.set('bdframe', '1'); f.src = u.toString(); let done = false; const t0 = performance.now();
      const finish = (v) => { if (done) return; done = true; clearTimeout(timer); removeEventListener('message', on); f.remove(); res({ ...v, ms: Math.round(performance.now() - t0) }); };
      const timer = setTimeout(() => finish({ ok: false, why: 'this view would not open a frame' }), 15000);
      function on(e) { if (e.source !== f.contentWindow || !e.data || e.data.bd !== 'frame') return; if (e.data.ready) f.contentWindow.postMessage({ bd: 'run', state: BD.std.exportJSON() }, '*'); else if (e.data.result) finish({ ok: true, problems: e.data.result }); }
      addEventListener('message', on); document.body.appendChild(f);
    });
  }
  // Where this view refuses a frame: does anything make Board 4 lay out differently at 1282 x 888 (Session 5's comparator) than here? Every kit
  // @media condition is answered at both sizes, every vw/vh size that reaches the board is worked out at both, and the board column's room is
  // checked. When nothing differs, the check at this width IS the 1282 result, and the message says why; when something does, it is named.
  function mqAt(q, W, H) {
    return q.split(',').some((part) => {
      let p = part.trim(); let neg = false; if (/^not\s/i.test(p)) { neg = true; p = p.replace(/^not\s+/i, ''); }
      if (/^(only\s+)?print\b/i.test(p)) return neg;
      let ok = true;
      for (const c of p.split(/\s+and\s+/i).map((x) => x.trim()).filter((x) => x && !/^(only\s+)?(screen|all)$/i.test(x))) {
        const m = c.match(/^\(\s*(min-|max-)?(width|height)\s*:\s*([\d.]+)px\s*\)$/i), r = c.match(/^\(\s*(width|height)\s*(<=|>=|<|>)\s*([\d.]+)px\s*\)$/i);
        if (m) { const v = /width/i.test(m[2]) ? W : H, n = +m[3]; ok = ok && (m[1] === 'min-' ? v >= n : m[1] === 'max-' ? v <= n : v === n); }
        else if (r) { const v = /width/i.test(r[1]) ? W : H, n = +r[3]; ok = ok && ({ '<=': v <= n, '>=': v >= n, '<': v < n, '>': v > n })[r[2]]; }
        else { let mm = false; try { mm = matchMedia(c).matches; } catch (e) {} ok = ok && mm; }
      }
      return neg ? !ok : ok;
    });
  }
  function evalAt(val, W, H) {
    let s = val.replace(/(-?[\d.]+)(vw|vh|vmin|vmax|dvh|svh|lvh)\b/g, (m, n, u) => String((+n * (u === 'vw' ? W : u === 'vmin' ? Math.min(W, H) : u === 'vmax' ? Math.max(W, H) : H)) / 100)).replace(/px/g, '');
    s = s.replace(/calc\(/g, '(').replace(/clamp\(/g, 'C(').replace(/min\(/g, 'N(').replace(/max\(/g, 'X(');
    if (!/^[\d\s.+\-*/(),CNX]*$/.test(s)) return null;
    try { return Function('C', 'N', 'X', `return (${s})`)((a, b, c) => Math.min(Math.max(a, b), c), Math.min, Math.max); } catch (e) { return null; }
  }
  function proof1282() {
    const R = window.BD_RULES || { rules: [], files: [] }; const W = innerWidth, H = innerHeight, TW = 1282, TH = 888; const board = document.getElementById('board');
    const flips = new Set(); for (const r of R.rules) for (const q of r.m || []) if (mqAt(q, W, H) !== mqAt(q, TW, TH)) flips.add(q);
    const vdiff = [];
    for (const r of R.rules) for (const d of r.d) {
      if (!/\d(vw|vh|vmin|vmax|dvh|svh|lvh)\b/.test(d[1])) continue; let reach = 0;
      for (const part of r.s.split(',')) { try { reach += [...document.querySelectorAll(part.replace(/::?(before|after)\s*$/, '').trim())].filter((e) => board.contains(e)).length; } catch (e) {} }
      if (!reach) continue; const a = evalAt(d[1], W, H), b = evalAt(d[1], TW, TH);
      if (a == null || b == null || Math.abs(a - b) > 0.5) vdiff.push({ where: `${R.files[r.f]}:${r.l}`, sel: r.s, prop: d[0], val: d[1], here: a == null ? null : Math.round(a), there: b == null ? null : Math.round(b) });
    }
    const bc = getComputedStyle(board); const room = TW - parseFloat(bc.paddingLeft) - parseFloat(bc.paddingRight) - parseFloat(bc.borderLeftWidth) - parseFloat(bc.borderRightWidth);
    const widest = Math.max(0, ...[...board.children].map((g) => g.getBoundingClientRect().width)); const column = room >= widest - 0.5;
    return { flips: [...flips], vdiff, column, room: Math.round(room), widest: Math.round(widest), same: !flips.size && !vdiff.length && column, W, H };
  }
  async function at1282(opt = {}) {
    if (!opt.noFrame) { const fr = await frame1282(); if (fr.ok) return { ...fr, via: 'frame' }; }
    const proof = proof1282(); const probs = await standardVsBoard();
    return { ok: true, via: 'proof', same: proof.same, proof, problems: probs };
  }
  BD.check = { snap, diff, standardVsBoard, at1282, frame1282, proof1282, raf2 };
})();
