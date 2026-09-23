// Board 4 · forced hover (2026-09-23): copies every :hover/:active rule onto .__h/.__a so a state can be read without a pointer. Run with the chrome-devtools CLI: evaluate_script "$(< this)" on the board page, then use window.__H (pick, snap, rect, targets). Blind spot: a hover drawn on ::before or on a child.
() => {
  const copy = (list, sheet) => {
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i];
      if (r.cssRules && r.type !== 1) { copy(r.cssRules, r); continue; }
      if (r.type !== 1) continue;
      const s = r.selectorText;
      if (/:not\([^)]*:(hover|active)/.test(s)) continue;
      for (const [ps, cls] of [[':hover', '.__h'], [':active', '.__a']]) {
        if (!s.includes(ps)) continue;
        try { (sheet.insertRule ? sheet : sheet.parentStyleSheet).insertRule(r.cssText.split(ps).join(cls), i + 1); } catch (e) {}
      }
    }
  };
  if (!window.__forced) { for (const sh of document.styleSheets) { try { copy(sh.cssRules, sh); } catch (e) {} } window.__forced = 1; }
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__H = {
    w,
    async pick(sec, state, forks) {
      const s = document.getElementById(sec);
      const b = (q, t) => [...s.querySelectorAll(q)].find((e) => e.textContent.trim() === t);
      const st = b('.pb-ctl button', state); st && st.click(); await w(1400);
      for (const f of forks || []) { const x = b('.b4-fork button, .b4-fork [role=radio]', f); x && x.click(); await w(700); }
      s.scrollIntoView({ block: 'start' }); await w(400);
      return s;
    },
    scroller(s) {
      return [...s.querySelectorAll('*')].filter((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 4).sort((a, b) => b.clientHeight - a.clientHeight)[0];
    },
    sig(e) { return e.tagName.toLowerCase() + '.' + [...e.classList].filter((c) => !/^__/.test(c)).slice(0, 2).join('.') + (e.getAttribute('aria-pressed') === 'true' || e.getAttribute('aria-checked') === 'true' ? '[on]' : '') + (e.disabled ? '[dis]' : ''); },
    targets(root) {
      const seen = new Set(), out = [];
      root.querySelectorAll('button, input, textarea, label.f-drop, [role=radio], [role=combobox], [role=tab], .bk-card, .bk-gut, .chip').forEach((e) => {
        const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight) return;
        const k = window.__H.sig(e); if (seen.has(k)) return; seen.add(k); out.push(e);
      });
      return out;
    },
    snap(e) { const c = getComputedStyle(e); return [c.color, c.backgroundColor, c.backgroundImage.slice(0, 60), c.boxShadow.slice(0, 80), c.borderTopColor, c.outlineStyle, c.cursor].join(' | '); },
    rect(e) { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; },
  };
  return 'ok';
}
