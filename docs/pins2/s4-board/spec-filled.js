// corrected 2026-10-08 21:39 EDT: his "by both of them i mean the 'never' chip and the 'set end date' chip" (21:39 EDT) — the two Queue buttons, not the three I drew.
// spec-board (2026-10-08 19:59 EDT): his 19:57 EDT ask, "show me both of them on our wash and tint style?" — the three board buttons filled at rest (Set end date,
// Pick, the export file name), each as the board draws it today, then in OUR wash and OUR tint with its own accent. The recipes are the Styles section's,
// measured off its live buttons (style-recipe.cjs): wash = accent 14% fill, a 1px accent border, ink words, accent 24% on hover; tint = sunk 85%, a 1px
// ring of accent 30% on #0B0F12, accent words, on hover accent 12% on sunk with a ring of accent 60% and words accent 80% on white. Clones as everywhere.
// 2026-10-08 21:43 EDT, his "mention their numbers and stuff too, like you did for the buttons styles before": under each cell the Styles section's own cards —
// Rest lists fill, outline, halo and words, Hover only what changes — read from spec-img/filled-facts.json, measured by filled-shot.cjs under a real
// mouse (never typed), and the size and corner.
import { recipe, vars as lookVars } from './spec-defs.js';
export function makeFilled(L) {
  const { html, useState, useEffect, getJson, Sec, Name, Clone, scopeRule, Recipe } = L;
  const FF = { f: {} }; const factsReady = getJson('spec-img/filled-facts.json').then((j) => { FF.f = (j && j.facts) || {}; });
  const ROWS = [['button.b3-endbtn', 'Set end date', 'warn', 'Queue', 'buttons'], ['button.g-chipbtn', 'Never', 'warn', 'Queue', 'buttons'], ['span.b4-hint', 'Weapon required', 'warn', 'New build', 'chips']];   /* Weapon required: his 22:00 EDT "add the 'weapon required' variant to this … comparison table" */
  // 2026-10-10 21:13 EDT: decided, his 21:02 "i like the new outline on tint. let's use that for that style?" and "move 'never' and 'set end date' -> tint": two columns, today and tint
  const COLS = [['today', 'today'], ['tint', 'tint · decided']];
  // 2026-10-10 19:07 EDT: his three tries (calls/filled note, 2026-10-09 22:27 EDT): tint with its words at rest 80% on white · tint with more of the accent in its outline (rest
  // 55% on #0B0F12, hover 75%: my values for "a bit more of the accent color") · his own style, rest fill 9% on sunk, outline 40%, words 80% on white; hover 15%, 62%, words the same
  const TRY = [['t80', 'tint · words 80% at rest'], ['t50', 'tint · outline 55%'], ['his', 'your style · 9 / 40 / 80']];
  const S = { g: null };
  const ready = getJson('spec-img/board-dom.json').then((j) => { S.g = j || null; if (!S.g) return; const rules = new Set(); const vars = {}; for (const [sel, , , , grp] of ROWS) { const v = (S.g[grp] || {})[sel]; if (!v) continue; (v.bd || []).forEach((r) => rules.add(r)); Object.assign(vars, v.bdvars || {}); }
    const st = document.createElement('style'); st.id = 'bd-filled'; st.textContent = `#filled { ${Object.entries(vars).map(([k, x]) => `${k}: ${x};`).join(' ')} }\n` + [...rules].map((r) => scopeRule(r, '#filled')).join('\n'); document.head.appendChild(st); });
  function Filled() {
    const [, set] = useState(0); useEffect(() => { Promise.all([ready, factsReady]).then(() => set(1)); }, []);
    if (!S.g) return html`<${Sec} id="filled" title="Set end date and Never" tag="Yours to call" kind="diff"><span class="rc-wait">measuring…</span><//>`;
    const grid = (cols, rows = ROWS) => html`<div class="fgrid"><i></i>${cols.map(([k, t]) => html`<b class="fg-h">${t}</b>`)}
        ${rows.map(([sel, what, acc, where, grp]) => { const v = (S.g[grp] || {})[sel]; return html`<div class="fg-k"><span>${what}</span><em>${where} · ${acc}</em></div>${cols.map(([k]) => { const f = FF.f[sel + '|' + k]; return html`<div class="fg-cell"><div class=${'fg-c fv-' + k} style=${`--A: var(--${acc})`} data-fv=${sel}><${Clone} path=${v.path} markup=${v.html} /></div>${f ? html`<div class="fg-r"><figure><figcaption>Rest</figcaption><${Recipe} f=${f} k="rest" /></figure><figure><figcaption>Hover</figcaption><${Recipe} f=${f} k="hover" /></figure><span class="fg-sz">${Math.round(f.rest.w)} × ${Math.round(f.rest.h)} · corner ${f.rest.r}</span></div>` : html`<span class="rc-wait">not measured yet</span>`}</div>`; })}`; })}
      </div>`;
    const W = (S.g.chips || {})['span.b4-hint']; const chip = (tone, ic, t) => W ? W.html.replace(/data-tone="[^"]*"/, `data-tone="${tone}"`).replace(/#i-[a-z-]+/, '#i-' + ic).replace(/Weapon required/, t) : '';
    const TAGS = [['chip.warn', 'Weapon required', 'tone warn', W && W.html, 'var(--warn)', 'tag-S-box.static-warn'], ['chip.ok', 'Ready', 'tone ok', chip('ok', 'check', 'Ready'), 'var(--ok)', 'tag-S-box.static-ok'], ['chip.magic', 'Filled 4 slots', 'tone magic: staged (#D8F24A; review is the same colour)', chip('magic', 'wand-sparkles', 'Filled 4 slots'), 'var(--staged)', 'tag-S-box.static-staged'], ['chip.none', '4 of 5', 'no tone', W && W.html.replace(/\sdata-tone="[^"]*"/, '').replace(/<svg[\s\S]*?<\/svg>/, '').replace(/Weapon required/, '4 of 5'), null, 'tag-S-box.static--ghost']];
    return html`<${Sec} id="filled" title="Set end date and Never" tag="Decided: tint" kind="ok">${grid(COLS, ROWS.slice(0, 2))}
      <h3 class="subh bsub fg-try"><b>Weapon required · and the chips beside it</b><span>an informative chip: no hover (your 21:02 EDT). The four are one component, b4/form.js's Chip, told apart only by its tone; their inks, measured</span></h3>
      <div class="fgrid tags"><i></i><b class="fg-h">as the board draws it</b><b class="fg-h">static · decided (the word is yours)</b>${TAGS.map(([k, what, how, mk, tok, nm]) => html`<div class="fg-k"><span>${what}</span><em>${how}</em></div>${['today', 'static'].map((fv) => { const f = FF.f[k + '|' + fv]; const r = recipe('static', tok, nm.includes('--ghost') ? ['ghost'] : []); return html`<div class="fg-cell"><div class=${'fg-c fv-' + fv} data-fv=${k} style=${fv === 'static' ? Object.entries(lookVars(r)).map(([a, b]) => `${a}: ${b}`).join('; ') : null}>${W && mk ? html`<${Clone} path=${W.path} markup=${mk} />` : null}</div>${fv === 'static' ? html`<code class="fg-nm">${nm}</code>` : null}${f ? html`<div class="fg-r"><figure><figcaption>Rest</figcaption><${Recipe} f=${f} k="rest" /></figure><span class="fg-sz">${Math.round(f.rest.w)} × ${Math.round(f.rest.h)} · corner ${f.rest.r}</span></div>` : html`<span class="rc-wait">not measured yet</span>`}</div>`; })}`)}</div><//>`;
  }
  return { Filled };
}
