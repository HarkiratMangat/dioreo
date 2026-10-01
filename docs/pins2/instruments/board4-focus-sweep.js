// Board 4 instrument, saved 2026-09-24 11:39 EDT: focuses every typing field of the open surface and reads each shell's glow and placeholder by computed style. Run with the chrome-devtools CLI: evaluate_script "$(cat board4-focus-sweep.js)" --pageId 1
() => { window.__FS = null; (async () => { const H = window.__H; const out = []; const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 20 && r.height > 12; };
  const shellOf = (inp) => { const ir = inp.getBoundingClientRect(); let best = inp, e = inp; for (let k = 0; k < 4 && e.parentElement; k++) { e = e.parentElement; const r = e.getBoundingClientRect(); if (r.height > ir.height + 30) break; const c = getComputedStyle(e); if ((c.boxShadow !== 'none') || (c.borderTopWidth !== '0px' && c.borderTopStyle !== 'none') || (c.backgroundColor !== 'rgba(0, 0, 0, 0)')) best = e; } return best; };
  for (const s of document.querySelectorAll('section[id^=c-]')) { const st = [...s.querySelectorAll('.pb-ctl button')]; const n = Math.max(1, st.length);
    for (let i = 0; i < n; i++) { if (st[i]) { st[i].click(); await H.w(1200); } const lab = s.id.slice(2) + ':' + (st[i] ? st[i].textContent.trim() : '-');
      const roots = [s, ...document.querySelectorAll('.drawer.open')]; const seen = new Set();
      const inputs = roots.flatMap((r) => [...r.querySelectorAll('input:not([type=checkbox]):not([type=file]):not([type=radio]), textarea')]).filter((e) => !seen.has(e) && seen.add(e) && vis(e) && !e.readOnly);
      for (const inp of inputs.slice(0, 10)) { const sh = shellOf(inp); inp.focus({ preventScroll: true }); await H.w(200); const c = getComputedStyle(sh), ci = getComputedStyle(inp);
        out.push([lab, (sh === inp ? 'INPUT ' : '') + sh.tagName.toLowerCase() + '.' + [...sh.classList].filter((x) => !/^__/.test(x)).join('.'), (inp.placeholder || inp.getAttribute('aria-label') || '').slice(0, 26), c.boxShadow.slice(0, 120), c.outlineStyle + ' ' + c.outlineColor, ci.boxShadow.slice(0, 60)]); inp.blur(); }
      document.querySelectorAll('.drawer.open .dw-h .x').forEach(() => {}); } }
  window.__FS = JSON.stringify(out); })(); return 'started'; }
