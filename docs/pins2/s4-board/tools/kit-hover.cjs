// Session 4 · the kit's hover recipes, by role — a REAL mouse on every distinct control of every gate and every state of Board 4.
// Written 2026-10-01 21:00 EDT for plan §5c (his 2026-09-30 14:32 EDT order: standardize hover states, tints and styles across the board).
// Reads, per control, what changes on hover on the element, its ::before, its ::after, its icon and its first three children, and names
// each colour by the kit :root token it equals where one does. Output: local/pins2/s4/work/lead/kit-hover.json + .md
// Run with the kit on :8900:  node local/pins2/s4/work/lead/kit-hover.cjs [C1,C2]
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const OUT = __dirname;
const pick = (process.argv[2] || '').split(',').filter(Boolean);
const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-left-color', 'border-top-width', 'box-shadow', 'outline-style', 'outline-color', 'opacity', 'transform', 'cursor', 'text-decoration-line', 'filter'];
const SEL = 'button, [role=button], [role=tab], [role=radio], [role=option], [role=checkbox], a[href], label.chip, .chip, summary, input:not([type=hidden]), textarea, select, .b3-fc, .wg-at[tabindex], [tabindex="0"]';

(async () => {
  const { b, p, errs } = await W.open();
  await p.setRequestInterception(true);
  p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  const tokens = () => p.evaluate(() => {
    const probe = document.createElement('i'); document.body.appendChild(probe); const rcs = getComputedStyle(document.documentElement);
    const norm = (v) => { probe.style.color = ''; probe.style.color = v; return probe.style.color ? getComputedStyle(probe).color : null; };
    const names = new Set(); for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; }
      for (const r of rs) if (r.selectorText && /(^|,)\s*:root\b/.test(r.selectorText)) for (let i = 0; i < r.style.length; i++) if (r.style[i].startsWith('--')) names.add(r.style[i]); }
    const tok = {}; for (const n of names) { const v = rcs.getPropertyValue(n).trim(); const c = v && /^(#|rgb|hsl|oklch|color)/.test(v) && norm(v); if (c && !tok[c]) tok[c] = n; }
    probe.remove(); window.__tok = tok;
  });
  const reload = async () => { await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await W.sleep(900); await tokens(); };
  const rows = []; const seenSig = new Set();
  const gates = W.GATES.filter(([g]) => !pick.length || pick.includes(g));
  for (const [g, id, title] of gates) {
    await reload();
    const acts = await W.actions(p, id);
    const passes = [['rest', null], ...acts.map((a) => [`${a[0]}:${a[2]}`, a])];
    for (const [label, a] of passes) {
      if (a) { await reload(); await W.act(p, id, a[0], a[1]); }
      const els = await p.evaluate((id, SEL) => {
        const g = document.getElementById(id); const out = [];
        [...g.querySelectorAll(SEL)].forEach((e, i) => {
          if (e.closest('.pb-head, .pb-new, .b4-try, .b4-forks, .pb-ctl')) return;
          const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
          if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none') return;
          const use = e.querySelector('use'); const icon = use ? (use.getAttribute('href') || use.getAttribute('xlink:href') || '') : '';
          const lab = (e.getAttribute('aria-label') || e.getAttribute('title') || e.textContent || e.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
          const cls = [...e.classList].sort().join('.');
          const sig = e.tagName + '.' + cls + '|' + (e.getAttribute('aria-pressed') || e.getAttribute('aria-selected') || '') + '|' + icon + '|' + lab.replace(/\d+/g, '#').slice(0, 14);
          e.setAttribute('data-kh', id + '-' + i);
          out.push({ q: id + '-' + i, sig, tag: e.tagName.toLowerCase(), cls, role: e.getAttribute('role') || '', pressed: e.getAttribute('aria-pressed') || e.getAttribute('aria-selected') || '', icon, lab, w: Math.round(r.width), h: Math.round(r.height) });
        });
        return out;
      }, id, SEL);
      for (const e of els) {
        if (seenSig.has(e.sig)) continue; seenSig.add(e.sig);
        const read = () => p.evaluate((q, PROPS) => {
          const el = document.querySelector(`[data-kh="${q}"]`); if (!el) return null; const tok = window.__tok || {};
          const TOKS = window.__toks || (window.__toks = Object.entries(tok).map(([k, n]) => { const m = k.match(/[\d.]+/g).map(Number); return [n, m[0], m[1], m[2]]; }));
          const rgbOf = (s) => { let m = s.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/); if (m) return [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]];
            m = s.match(/^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.]+))?\)$/); if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] == null ? 1 : +m[4]]; return null; };
          const groundOf = (node) => { for (let n = node.parentElement; n; n = n.parentElement) { const c = rgbOf(getComputedStyle(n).backgroundColor); if (c && c[3] === 1) return c; } return [15, 20, 24, 1]; };
          const G = groundOf(el);
          const cs0 = getComputedStyle(el); const own = [];
          for (const k of ['--c', '--realm-c', '--tc', '--sl', '--cur', '--f-hue', '--f-ch', '--dp-c', '--fc', '--rc', '--mc', '--lc', '--k']) { const v = cs0.getPropertyValue(k).trim(); if (!v) continue;
            const pr = document.createElement('i'); pr.style.color = v; document.body.appendChild(pr); const cc = rgbOf(getComputedStyle(pr).color); pr.remove(); if (cc) own.push([`var(${k})`, cc[0], cc[1], cc[2]]); }
          const ALL = [...own, ...TOKS];
          const nameC = (s) => { const c = rgbOf(s); if (!c) return s; if (c[3] === 0) return 'transparent';
            const key = `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;
            const ownHit = own.find((o) => [1, 2, 3].every((k) => Math.abs(o[k] - c[k - 1]) < 1.5)); if (ownHit) return c[3] === 1 ? ownHit[0] : `${ownHit[0]}@${Math.round(c[3] * 100)}%`;
            if (tok[key]) return c[3] === 1 ? tok[key] : `${tok[key]}@${Math.round(c[3] * 100)}%`;
            // An opaque colour no token names: is it one token mixed over the ground? (a color-mix(in srgb, T p%, ground))
            if (c[3] === 1) { let best = null; for (const [n, r, g, b] of ALL) { const T = [r, g, b]; const ps = [0, 1, 2].map((k) => Math.abs(T[k] - G[k]) < 8 ? null : (c[k] - G[k]) / (T[k] - G[k])).filter((x) => x != null);
                if (!ps.length) continue; const p0 = ps.reduce((sum, x) => sum + x, 0) / ps.length; if (p0 <= 0.02 || p0 >= 0.98) continue;
                const err = Math.max(...[0, 1, 2].map((k) => Math.abs(G[k] + p0 * (T[k] - G[k]) - c[k]))); if (err < 3 && (!best || err < best[2])) best = [n, p0, err]; }
              if (best) return `${best[0]} ${Math.round(best[1] * 100)}% over ground`; }
            return `#${[0, 1, 2].map((k) => Math.round(c[k]).toString(16).padStart(2, '0')).join('')}${c[3] < 1 ? '@' + Math.round(c[3] * 100) + '%' : ''}`; };
          const name = (v) => String(v).replace(/rgba?\([^)]*\)|color\(srgb[^)]*\)/g, (m) => nameC(m));
          const o = {};
          const take = (cs, pre) => {
            if (pre && (cs.content === 'none' || cs.content === 'normal')) return;
            PROPS.forEach((k) => {
              if (/^border-(top|left)-color$/.test(k) && parseFloat(cs.getPropertyValue(k.replace('color', 'width'))) === 0) return;
              if (k === 'outline-color' && cs.outlineStyle === 'none') return;
              o[pre + k] = name(cs.getPropertyValue(k)).slice(0, 140); });
          };
          take(getComputedStyle(el), ''); take(getComputedStyle(el, '::before'), 'b:'); take(getComputedStyle(el, '::after'), 'a:');
          const ic = el.querySelector('svg'); if (ic) { const c = getComputedStyle(ic); o['ic:color'] = name(c.color); o['ic:stroke'] = name(c.stroke); o['ic:opacity'] = c.opacity; }
          [...el.children].slice(0, 3).forEach((ch, i) => { const c = getComputedStyle(ch); o[`c${i}:bg`] = name(c.backgroundColor); o[`c${i}:color`] = name(c.color); o[`c${i}:shadow`] = name(c.boxShadow).slice(0, 100); });
          return o; }, e.q, PROPS);
        await p.mouse.move(3, 3); await W.sleep(120);
        const box = await p.evaluate((q) => { const el = document.querySelector(`[data-kh="${q}"]`); if (!el) return null; el.scrollIntoView({ block: 'center', inline: 'center' }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, e.q);
        if (!box) continue; await W.sleep(150);
        const before = await read(); await p.mouse.move(box.x, box.y, { steps: 3 }); await W.sleep(420); const after = await read();
        await p.mouse.move(3, 3); await W.sleep(80);
        if (!before || !after) continue;
        const delta = {}; for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) if (before[k] !== after[k]) delta[k] = [before[k], after[k]];
        // F1: a layer that was empty at rest paints on hover.
        const empty = (v) => !v || v === 'transparent' || v === 'none' || /^rgba\(0, 0, 0, 0\)/.test(v);
        const f1 = Object.entries(delta).filter(([k, [a0, z]]) => /(^|:)(background-color|background-image|box-shadow)$/.test(k) && empty(a0) && !empty(z)).map(([k]) => k);
        rows.push({ gate: g, gateTitle: title, pass: label, ...e, cursor: before.cursor, delta, f1 });
      }
    }
  }
  await b.close();
  const role = (r) => {
    const s = `${r.cls} ${r.lab} ${r.icon}`.toLowerCase();
    if (/(^|\.)(x|b3-pc-x)(\.|$)/.test(r.cls) || /\bclose\b|dismiss|^cancel|keep editing/.test(r.lab.toLowerCase())) return 'close/dismiss';
    if (/wg-del|rmv|pb-del|dang|i-trash|\bremove\b|\bdelete\b|deselect|discard|cx-wx|f-cx|b3-x\b|\bclr\b|f-clr|cx-clr|clear|reset/.test(s)) return 'delete/remove/clear';
    if (/edit/.test(s)) return 'edit';
    if (r.tag === 'input' || r.tag === 'textarea' || r.tag === 'select') return 'field';
    if (/\bgo\b|\.go(\.|$)|stage|commit|download|save|grant|repair|copy|share|export/.test(s)) return 'confirm/go/copy';
    if (/^(\+|new |add |create)|i-plus/.test(r.lab.toLowerCase()) || /i-plus/.test(r.icon)) return 'create/add';
    if (r.role === 'tab' || r.role === 'radio' || r.pressed || /seg|tog|mh-mode|\btab\b/.test(r.cls)) return 'toggle/tab/pressed';
    if (/chip|b3-fc|wg-at|pill/.test(r.cls)) return 'chip';
    if (r.tag === 'tr' || /-r(\.|$)|row|b3-hi-r/.test(r.cls)) return 'row';
    if (r.role === 'option' || /f-menu|opt|b3-dp-d/.test(r.cls)) return 'list item/option';
    if (r.icon && r.lab.length < 3) return 'icon button';
    return 'other';
  };
  rows.forEach((r) => { r.roleGuess = role(r);
    r.recipe = Object.keys(r.delta).filter((k) => k !== 'cursor').sort().map((k) => `${k}→${String(r.delta[k][1] == null ? 'gone' : r.delta[k][1]).slice(0, 70)}`).join(' · ') || 'NO CHANGE'; });
  fs.writeFileSync(path.join(OUT, 'kit-hover.json'), JSON.stringify({ at: new Date().toISOString(), errs, rows }, null, 1));
  const byRole = {}; rows.forEach((r) => { (byRole[r.roleGuess] = byRole[r.roleGuess] || {}); (byRole[r.roleGuess][r.recipe] = byRole[r.roleGuess][r.recipe] || []).push(r); });
  const md = [`# Board 4 kit — hover recipes by role (real mouse)`, '', `*${new Date().toISOString()} · ${rows.length} distinct controls · page errors ${errs.length} · F1 (a layer empty at rest painted on hover): ${rows.filter((r) => r.f1.length).length} · no change: ${rows.filter((r) => r.recipe === 'NO CHANGE').length} · cursor not pointer: ${rows.filter((r) => r.cursor !== 'pointer' && r.tag !== 'input' && r.tag !== 'textarea').length}*`, ''];
  for (const [ro, recs] of Object.entries(byRole).sort((a, z) => Object.values(z[1]).flat().length - Object.values(a[1]).flat().length)) {
    md.push(`## ${ro} — ${Object.values(recs).flat().length} controls, ${Object.keys(recs).length} recipes`, '', '| # | Recipe | Controls |', '|---|---|---|');
    Object.entries(recs).sort((a, z) => z[1].length - a[1].length).forEach(([rec, rs], i) => md.push(`| ${i + 1} | ${rec.replace(/\|/g, '\\|')} | ${rs.length}: ${rs.slice(0, 5).map((r) => `${r.gate} \`${r.tag}.${r.cls.slice(0, 40)}\` «${r.lab.slice(0, 18)}»${r.f1.length ? ' **F1**' : ''}`).join(' · ')}${rs.length > 5 ? ' …' : ''} |`));
    md.push('');
  }
  fs.writeFileSync(path.join(OUT, 'kit-hover.md'), md.join('\n'));
  console.log(JSON.stringify({ controls: rows.length, roles: Object.fromEntries(Object.entries(byRole).map(([k, v]) => [k, `${Object.values(v).flat().length}/${Object.keys(v).length} recipes`])), f1: rows.filter((r) => r.f1.length).length, nochange: rows.filter((r) => r.recipe === 'NO CHANGE').length, errs: errs.length }));
})().catch((e) => { console.error(e); process.exit(2); });
