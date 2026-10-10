// corrected 2026-10-08 21:39 EDT: his "by both of them i mean the 'never' chip and the 'set end date' chip" (21:39 EDT) — the two Queue buttons, not the three I drew.
// spec-board (2026-10-08 19:59 EDT): his 19:57 EDT ask, "show me both of them on our wash and tint style?" — the three board buttons filled at rest (Set end date,
// Pick, the export file name), each as the board draws it today, then in OUR wash and OUR tint with its own accent. The recipes are the Styles section's,
// measured off its live buttons (style-recipe.cjs): wash = accent 14% fill, a 1px accent border, ink words, accent 24% on hover; tint = sunk 85%, a 1px
// ring of accent 30% on #0B0F12, accent words, on hover accent 12% on sunk with a ring of accent 60% and words accent 80% on white. Clones as everywhere.
// 2026-10-08 21:43 EDT, his "mention their numbers and stuff too, like you did for the buttons styles before": under each cell the Styles section's own cards —
// Rest lists fill, outline, halo and words, Hover only what changes — read from spec-img/filled-facts.json, measured by filled-shot.cjs under a real
// mouse (never typed), and the size and corner.
export function makeFilled(L) {
  const { html, useState, useEffect, getJson, Sec, Name, Clone, scopeRule, Recipe } = L;
  const FF = { f: {} }; const factsReady = getJson('spec-img/filled-facts.json').then((j) => { FF.f = (j && j.facts) || {}; });
  const ROWS = [['button.b3-endbtn', 'Set end date', 'warn', 'Queue', 'buttons'], ['button.g-chipbtn', 'Never', 'warn', 'Queue', 'buttons'], ['span.b4-hint', 'Weapon required', 'warn', 'New build', 'chips']];   /* Weapon required: his 22:00 EDT "add the 'weapon required' variant to this … comparison table" */
  const COLS = [['today', 'today'], ['wash', 'wash'], ['tint', 'tint']];
  // 2026-10-10 19:07 EDT: his three tries (calls/filled note, 2026-10-09 22:27 EDT): tint with its words at rest 80% on white · tint with more of the accent in its outline (rest
  // 55% on #0B0F12, hover 75%: my values for "a bit more of the accent color") · his own style, rest fill 9% on sunk, outline 40%, words 80% on white; hover 15%, 62%, words the same
  const TRY = [['t80', 'tint · words 80% at rest'], ['t50', 'tint · outline 55%'], ['his', 'your style · 9 / 40 / 80']];
  const S = { g: null };
  const ready = getJson('spec-img/board-dom.json').then((j) => { S.g = j || null; if (!S.g) return; const rules = new Set(); const vars = {}; for (const [sel, , , , grp] of ROWS) { const v = (S.g[grp] || {})[sel]; if (!v) continue; (v.bd || []).forEach((r) => rules.add(r)); Object.assign(vars, v.bdvars || {}); }
    const st = document.createElement('style'); st.id = 'bd-filled'; st.textContent = `#filled { ${Object.entries(vars).map(([k, x]) => `${k}: ${x};`).join(' ')} }\n` + [...rules].map((r) => scopeRule(r, '#filled')).join('\n'); document.head.appendChild(st); });
  function Filled() {
    const [, set] = useState(0); useEffect(() => { Promise.all([ready, factsReady]).then(() => set(1)); }, []);
    if (!S.g) return html`<${Sec} id="filled" title="Set end date and Never" tag="Yours to call" kind="diff"><span class="rc-wait">measuring…</span><//>`;
    const grid = (cols) => html`<div class="fgrid"><i></i>${cols.map(([k, t]) => html`<b class="fg-h">${t}</b>`)}
        ${ROWS.map(([sel, what, acc, where, grp]) => { const v = (S.g[grp] || {})[sel]; return html`<div class="fg-k"><span>${what}</span><em>${where} · ${acc}</em></div>${cols.map(([k]) => { const f = FF.f[sel + '|' + k]; return html`<div class="fg-cell"><div class=${'fg-c fv-' + k} style=${`--A: var(--${acc})`} data-fv=${sel}><${Clone} path=${v.path} markup=${v.html} /></div>${f ? html`<div class="fg-r"><figure><figcaption>Rest</figcaption><${Recipe} f=${f} k="rest" /></figure><figure><figcaption>Hover</figcaption><${Recipe} f=${f} k="hover" /></figure><span class="fg-sz">${Math.round(f.rest.w)} × ${Math.round(f.rest.h)} · corner ${f.rest.r}</span></div>` : html`<span class="rc-wait">not measured yet</span>`}</div>`; })}`; })}
      </div>`;
    return html`<${Sec} id="filled" title="Set end date and Never" tag="Yours to call" kind="diff">${grid(COLS)}
      <h3 class="subh bsub fg-try"><b>Your three tries</b><span>“what if we changed tint's rest text to color 80% on white … tweaks tint's outline to show a bit more of the accent … REST fill=color 9% on sunk. outline=color 40% 1px … HOVER fill=color 15% on sunk. outline=color 62% 1px”</span></h3>${grid(TRY)}<//>`;
  }
  return { Filled };
}
