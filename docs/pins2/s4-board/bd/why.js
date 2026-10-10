// Board 4: Builder · why.js — where a value comes from. The kit's rules come from its SOURCE files (tools/build-data.cjs → bd/rules.js: file,
// line, selector, declarations, @media/@supports/@container), because a CSSOM copy empties a var() shorthand a later longhand overrides
// (2026-10-02, 159 rules). For an element and a property: the matching rules, ordered as the browser orders them (!important, specificity,
// source order), the winner named with its file and line, and the winner's value checked against the computed one — "not sure" when they
// disagree, never a guessed rule. Plan: local/pins2/s4/builder-plan.md (v3) § What the overlay shows · Where-from.
(function () {
  const BD = (window.BD = window.BD || {});
  const DATA = window.BD_RULES || { files: [], rules: [] };
  const close = (s, i) => { const open = s[i], shut = { '(': ')', '[': ']' }[open]; let d = 0, q = null; for (let j = i; j < s.length; j++) { const c = s[j]; if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === open) d++; else if (c === shut) { d--; if (!d) return j + 1; } } return s.length; };
  const splitSel = (t) => { const out = []; let d = 0, cur = '', q = null; for (const ch of t) { if (q) { cur += ch; if (ch === q) q = null; continue; } if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; } if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const cmpSpec = (x, y) => (x[0] - y[0]) || (x[1] - y[1]) || (x[2] - y[2]);
  function spec(sel) {
    let a = 0, b = 0, c = 0, i = 0; const s = sel;
    const maxOf = (inner) => { let best = [0, 0, 0]; for (const p of splitSel(inner)) { const q = spec(p); if (cmpSpec(q, best) > 0) best = q; } return best; };
    while (i < s.length) {
      const ch = s[i];
      if (' >+~,'.includes(ch)) { i++; continue; }
      if (ch === '#') { a++; i++; while (i < s.length && /[\w-]/.test(s[i])) i++; continue; }
      if (ch === '.') { b++; i++; while (i < s.length && /[\w-]/.test(s[i])) i++; continue; }
      if (ch === '[') { b++; i = close(s, i); continue; }
      if (ch === ':') {
        if (s[i + 1] === ':') { c++; i += 2; while (i < s.length && /[\w-]/.test(s[i])) i++; if (s[i] === '(') i = close(s, i); continue; }
        i++; let nm = ''; while (i < s.length && /[\w-]/.test(s[i])) nm += s[i++]; nm = nm.toLowerCase();
        if (s[i] === '(') {
          const e = close(s, i); const inner = s.slice(i + 1, e - 1); i = e;
          if (nm === 'where') continue;
          if (/^(is|not|has|matches)$/.test(nm)) { const m = maxOf(inner); a += m[0]; b += m[1]; c += m[2]; continue; }
          if (/^nth-(last-)?child$/.test(nm)) { b++; const of = inner.match(/\sof\s(.+)$/); if (of) { const m = maxOf(of[1]); a += m[0]; b += m[1]; c += m[2]; } continue; }
          b++; continue;
        }
        if (/^(before|after|first-line|first-letter)$/.test(nm)) c++; else b++;
        continue;
      }
      if (ch === '*') { i++; continue; }
      if (/[a-zA-Z]/.test(ch)) { c++; while (i < s.length && /[\w-]/.test(s[i])) i++; continue; }
      i++;
    }
    return [a, b, c];
  }
  function lastCompound(s) { let d = 0, q = null, mark = 0; for (let i = 0; i < s.length; i++) { const c = s[i]; if (q) { if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === '(' || c === '[') d++; else if (c === ')' || c === ']') d--; else if (d === 0 && ' >+~'.includes(c)) mark = i + 1; } return s.slice(mark).trim(); }
  const STATE_PS = /:(hover|active|focus-visible|focus-within|focus)(?![\w-])/g;

  // index every selector of every rule by the first class (or id, or tag) of its last compound
  const IDX = new Map();
  DATA.rules.forEach((r) => {
    for (const raw of splitSel(r.s)) {
      const pm = raw.match(/::?(before|after)\s*$/); const pe = pm ? '::' + pm[1] : ''; const s = pm ? raw.slice(0, pm.index) : raw;
      if (/::/.test(s)) continue;
      const lc = lastCompound(s).replace(/\([^()]*\)/g, ''); const cl = lc.match(/\.(-?[_a-zA-Z][\w-]*)/), id = lc.match(/#(-?[_a-zA-Z][\w-]*)/), tg = lc.match(/^[a-zA-Z][\w-]*/);
      const key = cl ? '.' + cl[1] : id ? '#' + id[1] : tg ? tg[0].toLowerCase() : '*';
      const ent = { r, sel: raw, rest: (s.replace(STATE_PS, ':not(*)').trim() || '*'), pe, sp: spec(s + pe) };
      if (!IDX.has(key)) IDX.set(key, []); IDX.get(key).push(ent);
    }
  });
  const MQ = new Map(); const mok = (r) => !r.m || r.m.every((q) => { if (!MQ.has(q)) { let m = null; try { m = matchMedia(q); } catch (e) {} MQ.set(q, m); } const m = MQ.get(q); return !m || m.matches; });
  const SU = new Map(); const sok = (r) => !r.su || r.su.every((q) => { if (!SU.has(q)) { let v = false; try { v = CSS.supports(q); } catch (e) {} SU.set(q, v); } return SU.get(q); });

  const FAM = (() => {
    const f = {}; const lg = { top: 'block-start', bottom: 'block-end', left: 'inline-start', right: 'inline-end' }; const ax = { top: 'block', bottom: 'block', left: 'inline', right: 'inline' };
    for (const s of ['top', 'right', 'bottom', 'left']) {
      for (const b of ['padding', 'margin']) f[`${b}-${s}`] = [`${b}-${s}`, `${b}-${lg[s]}`, `${b}-${ax[s]}`, b];
      f[`border-${s}-width`] = [`border-${s}-width`, `border-${lg[s]}-width`, `border-${s}`, `border-${lg[s]}`, `border-${ax[s]}-width`, `border-${ax[s]}`, 'border-width', 'border'];
      f[s] = [s, `inset-${lg[s]}`, `inset-${ax[s]}`, 'inset'];
    }
    const ss = { 'top-left': 'start-start', 'top-right': 'start-end', 'bottom-right': 'end-end', 'bottom-left': 'end-start' };
    for (const c of Object.keys(ss)) f[`border-${c}-radius`] = [`border-${c}-radius`, `border-${ss[c]}-radius`, 'border-radius'];
    f['column-gap'] = ['column-gap', 'grid-column-gap', 'gap', 'grid-gap']; f['row-gap'] = ['row-gap', 'grid-row-gap', 'gap', 'grid-gap'];
    for (const p of ['font-size', 'font-weight', 'font-family', 'font-style', 'line-height']) f[p] = [p, 'font'];
    f.height = ['height', 'block-size']; f.width = ['width', 'inline-size']; f['min-height'] = ['min-height', 'min-block-size']; f['min-width'] = ['min-width', 'min-inline-size'];
    f['background-color'] = ['background-color', 'background']; f['justify-content'] = ['justify-content', 'place-content']; f['align-items'] = ['align-items', 'place-items'];
    return f;
  })();
  const INH = new Set(['color', 'font-size', 'font-weight', 'font-family', 'font-style', 'line-height', 'letter-spacing', 'text-transform', 'text-align', 'white-space', 'visibility']);

  function containerish(el, prop) {
    if (!/^(height|width|min-height|min-width)$/.test(prop) || !el.parentElement) return false;
    const c = getComputedStyle(el.parentElement); if (/grid/.test(c.display)) return true;
    if (/flex/.test(c.display)) { const row = /^row/.test(c.flexDirection); const e = getComputedStyle(el); if ((prop === 'height' && row) || (prop === 'width' && !row)) return /stretch|normal/.test(e.alignSelf === 'auto' ? c.alignItems : e.alignSelf); return parseFloat(e.flexGrow) > 0; }
    return false;
  }
  function of(el, prop, pe = '', depth = 0) {
    const fam = FAM[prop] || [prop]; const keys = ['*', el.tagName.toLowerCase()]; if (el.id) keys.push('#' + el.id); for (const c of el.classList) keys.push('.' + c);
    const hits = []; const done = new Set();
    for (const k of keys) for (const ent of IDX.get(k) || []) {
      if (done.has(ent)) continue; done.add(ent); if (ent.pe !== pe) continue; const r = ent.r;
      if (!r.d.some((d) => fam.includes(d[0])) || !mok(r) || !sok(r)) continue;
      let ok = false; try { ok = el.matches(ent.rest); } catch (e) { ok = false; } if (!ok) continue;
      r.d.forEach((d, di) => { if (fam.includes(d[0])) hits.push({ ent, d, di }); });
    }
    hits.sort((x, y) => (y.d[2] - x.d[2]) || cmpSpec(y.ent.sp, x.ent.sp) || (y.ent.r.o - x.ent.r.o) || (y.di - x.di));
    const computed = getComputedStyle(el, pe || null).getPropertyValue(prop).trim();
    let inline = null; if (!pe && el.style) for (const p of fam) { const v = el.style.getPropertyValue(p); if (v) { inline = { v, imp: el.style.getPropertyPriority(p) === 'important' }; break; } }
    const w = hits[0];
    if (inline && (!w || inline.imp || !w.d[2])) return { prop, value: computed, source: 'inline', status: 'unchecked', declared: inline.v, rule: null, el };
    if (!w) {
      if (INH.has(prop) && el.parentElement && depth < 40) { const up = of(el.parentElement, prop, '', depth + 1); return { ...up, prop, value: computed, el, source: up.source === 'default' ? 'default' : 'inherited', from: up.from || el.parentElement }; }
      return { prop, value: computed, source: containerish(el, prop) ? 'container' : 'default', status: 'unchecked', rule: null, el };
    }
    const r = w.ent.r; const around = /:has\(|[+~]|:(first|last|nth|only)-/.test(w.ent.sel);
    const declared = w.d[1]; const host = getComputedStyle(el);
    const resolved = declared.replace(/var\((--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (m, n, fb) => host.getPropertyValue(n).trim() || (fb || '').trim()).trim();
    let status = 'unchecked';
    if (w.d[0] === prop) {
      if (/^-?[\d.]+px$/.test(resolved) && /^-?[\d.]+px$/.test(computed)) status = Math.abs(parseFloat(resolved) - parseFloat(computed)) <= 0.5 ? 'checked' : 'mismatch';
      else if (/^(0|[a-z-]+|\d+)$/.test(resolved)) status = resolved === computed || (resolved === '0' && computed === '0px') ? 'checked' : 'mismatch';
    }
    let source = around ? 'around' : 'own'; if (/(%|em|rem|vw|vh|auto|calc|min\(|max\(|clamp)/.test(resolved) && source === 'own') source = 'computed';
    if (status === 'mismatch' && containerish(el, prop)) source = 'container';
    return { prop, value: computed, source, status, declared, via: w.d[0], important: !!w.d[2], conditional: r.c || null, rule: { file: DATA.files[r.f], line: r.l, sel: w.ent.sel }, el };
  }
  const nm = (el) => (BD.measure ? BD.measure.label(el) : el.tagName.toLowerCase());
  // plain words for the panel
  function text(res) {
    if (!res) return ''; const at = res.rule ? `${res.rule.file}:${res.rule.line}` : '';
    const unsure = res.status === 'mismatch' ? ' · not sure: the rule says ' + res.declared : '';
    const cond = res.conditional ? ` · only when its container is ${res.conditional}` : '';
    switch (res.source) {
      case 'own': return `its own rule · ${at}${cond}${unsure}`;
      case 'around': return `a rule that depends on what is around it · ${at}${cond}${unsure}`;
      case 'computed': return `worked out from ${res.declared} · ${at}${unsure}`;
      case 'inherited': return `inherited from ${nm(res.from)}${at ? ' · ' + at : ''}`;
      case 'container': return `set by its container${at ? ' (its rule ' + at + ' does not hold)' : ''}`;
      case 'inline': return 'set on the element itself';
      default: return /^(height|width|min-height|min-width)$/.test(res.prop) ? 'comes from what it holds (its words, icon and space inside)' : 'nothing sets it (the browser default)';
    }
  }
  const short = (res) => (!res ? null : res.rule ? `${res.source === 'inherited' ? 'inherited · ' : ''}${res.rule.file}:${res.rule.line}` : res.source === 'container' ? 'set by its container' : res.source === 'inline' ? 'set on the element' : null);
  BD.why = { of, text, short, spec, splitSel, count: DATA.rules.length };
})();
