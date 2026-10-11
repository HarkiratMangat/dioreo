// spec-board (2026-10-10 22:10 EDT): the style definitions, his 2026-10-10 21:02 EDT ask: "we need to clear up the definition of each style, the exact rest/hover behavior/colors/etc of
// each style, and the default view of each style." Read off the board: the Styles section's own measured buttons (spec-img/spec-facts.json, states-*, in warn) and a census
// of every board button's inks (tools/style-census.cjs). paint with no token = the board's .b3-btn2 (sunk 85% fill, rule2 outline, ink2 words; on hover the hi fill, ink4
// outline, ink words). paint with a colour = neutral at rest and tint's hover on hover (states-paint in warn; the row icon buttons paint-danger/ok/staged agree). tint =
// a sunk fill, the colour's outline and words (outline 55% on #0B0F12, 75% on hover: his 21:02 EDT). wash = the colour 14% with its solid outline, ink words, 24% on hover.
// fill = the solid colour, on-colour words; on hover the colour 74% on white with a 3px glow of the colour 26%. Words on hover are the colour 80% on white (C14). A tint,
// wash or fill with no token has no board example: ink until he picks (call "defaults"). The same recipe paints every corrected copy on the board (spec-buttons.js applyLook).
export function recipe(st, A, flags = []) {
  const F = new Set(flags); const T = 'transparent'; const sunk = 'color-mix(in srgb, var(--sunk) 85%, transparent)'; const C0 = A || 'var(--ink)'; let r;
  if (st === 'paint') r = { bg: sunk, ring: 'var(--rule2)', fg: 'var(--ink2)', hbg: A ? `color-mix(in srgb, ${A} 12%, var(--sunk))` : 'var(--hi)', hring: A ? `color-mix(in srgb, ${A} 75%, transparent)` : 'var(--ink4)', hfg: A ? `color-mix(in srgb, ${A} 80%, white)` : 'var(--ink)' };
  else if (st === 'tint') r = { bg: sunk, ring: `color-mix(in srgb, ${C0} 55%, #0B0F12)`, fg: C0, hbg: `color-mix(in srgb, ${C0} 12%, var(--sunk))`, hring: `color-mix(in srgb, ${C0} 75%, transparent)`, hfg: `color-mix(in srgb, ${C0} 80%, white)` };
  else if (st === 'wash') r = { bg: `color-mix(in srgb, ${C0} 14%, transparent)`, ring: C0, fg: 'var(--ink)', hbg: `color-mix(in srgb, ${C0} 24%, transparent)`, hring: C0, hfg: 'var(--ink)' };
  else r = { bg: C0, ring: T, fg: A ? 'var(--on-ok)' : 'var(--sunk)', hbg: `color-mix(in srgb, ${C0} 74%, white)`, hring: T, hfg: A ? 'var(--on-ok)' : 'var(--sunk)', glow: `0 0 0 3px color-mix(in srgb, ${C0} 26%, transparent)` };
  if (F.has('ghost')) { r.bg = T; r.hbg = T; }
  if (F.has('borderless')) { r.ring = T; r.hring = T; if (st === 'fill') r.glow = null; }
  if (F.has('quiet')) { r.bg = T; r.ring = T; if (st === 'fill') r.fg = C0; }
  return r;
}
// a recipe's value, named as the board's inks are named
export const say = (x) => !x || x === 'transparent' ? 'none' : String(x).replace(/color-mix\(in srgb, var\(--([\w-]+)\) (\d+)%, (transparent|white|var\(--([\w-]+)\)|#0B0F12)\)/g, (m, a, p, b, bv) => `${a.replace(/^r-/, '')} ${p}%${b === 'transparent' ? '' : b === 'white' ? ' on white' : b === '#0B0F12' ? ' on #0B0F12' : ' on ' + bv}`).replace(/var\(--([\w-]+)\)/g, (m, a) => a.replace(/^r-/, '')).replace(/^0 0 0 3px /, '3px glow ');
export const vars = (r) => ({ '--lk-bg': r.bg, '--lk-ring': r.ring, '--lk-fg': r.fg, '--lk-hbg': r.hbg, '--lk-hring': r.hring, '--lk-hfg': r.hfg, '--lk-glow': r.glow || '0 0 0 0 transparent' });
export function makeDefs(L) {
  const { html, Icon } = L;
  const COLS = [['no token', null, 'ink until you pick (call below)'], ['-realm', 'var(--r-armory)', 'here Armory'], ['-warn', 'var(--warn)', ''], ['-realm', 'var(--r-history)', 'here History']];
  const ROWS = [['paint', 'square-pen'], ['tint', 'trash-2'], ['wash', 'plus'], ['fill', 'wrench']];
  const style = (r) => Object.entries(vars(r)).map(([k, v]) => `${k}: ${v}`).join('; ');
  const Btn = ({ r, ic, hov }) => html`<button type="button" class=${'dfb' + (hov ? ' dfh' : '')} data-lkon="self" style=${style(r)} tabindex=${hov ? '-1' : null}><${Icon} name=${ic} />Button</button>`;
  const Vals = ({ r, h }) => html`<dl class="dfv"><div><dt>fill</dt><dd>${say(h ? r.hbg : r.bg)}</dd></div><div><dt>outline</dt><dd>${say(h ? r.hring : r.ring)}</dd></div><div><dt>words</dt><dd>${say(h ? r.hfg : r.fg)}</dd></div>${h && r.glow ? html`<div><dt>glow</dt><dd>${say(r.glow)}</dd></div>` : null}</dl>`;
  function Defs() {
    return html`<div class="defs"><h3 class="subh bsub"><b>The four styles, defined</b><span>each with no colour token and with one; rest beside hover, the rest copy live. These recipes also paint every corrected copy under On the board</span></h3>
      <div class="dfg"><i></i>${COLS.map(([t, , n]) => html`<b class="dfg-h">${t}${n ? html`<em>${n}</em>` : null}</b>`)}
        ${ROWS.map(([st, ic]) => html`<div class="dfg-k"><b>${st}</b></div>${COLS.map(([, A]) => { const r = recipe(st, A); return html`<div class="dfg-c"><div class="dfg-b"><figure><figcaption>rest</figcaption><${Btn} r=${r} ic=${ic} /></figure><figure><figcaption>hover</figcaption><${Btn} r=${r} ic=${ic} hov /></figure></div><div class="dfg-v"><${Vals} r=${r} /><${Vals} r=${r} h /></div></div>`; })}`)}
      </div>
      <dl class="dff"><div><dt>--ghost</dt><dd>no fill, at rest or on hover (tint and paint only)</dd></div><div><dt>--borderless</dt><dd>no outline, at rest or on hover; a fill loses its glow</dd></div><div><dt>--quiet</dt><dd>bare at rest (no fill, no outline; a fill's icon in its colour), the style on hover</dd></div><div><dt>--reveal-right / -left</dt><dd>its words open on that side on hover, the icon held</dd></div></dl></div>`;
  }
  return { Defs };
}
