// spec-board (2026-10-09 15:13 EDT): the Colours section, his 2026-10-09 12:28 EDT ask: "showing the main colors such as ok, warn, danger, staged, info, armory, etc etc drawn at
// their current color, and then on 74% on white, 80% on white, in both a tint and paint button style ... Then we can see what actually works as a single ratio
// across all colors for a lighter variant. Provide your recommendation with it. and im also open to moving the ratio away from 74/80%".
// Each row is one colour on the board's own tint button (Stage deletion) and paint button (Edit builds). The Rest cell is the live button (hover it). The
// other cells are the button in its hover state, drawn from the Styles section's measured hover recipe, which is the same for tint and paint (spec-facts.json,
// states-tint and states-paint): fill accent 12% on sunk, a 1px inset ring of accent 60%, words accent N% on white, where today N is 80. Only the words'
// ratio changes across a row. Under each cell: the words' contrast against that hover fill laid on sunk (WCAG), and the words' colour.
export function makeColours(L) {
  const { html, useRef, useState, useLayout, Sec, el, rec } = L;
  const HUES = [['ok', '--ok'], ['warn', '--warn'], ['danger', '--del'], ['staged', '--staged'], ['info', '--info'], ['ev', '--ev'], ['armory', '--r-armory'], ['broadcast', '--r-broadcast'],
    ['season', '--r-season'], ['access', '--r-access'], ['analytics', '--r-analytics'], ['review', '--r-review'], ['history', '--r-history'], ['home', '--r-home']];
  const RATIOS = [100, 86, 80, 74, 68];
  const tok = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const imp = (e, k, v) => e.style.setProperty(k, v, 'important');
  const P = (c) => { const m = /color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.]+))?\)/.exec(c); if (m) return [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]]; const n = (c.match(/[\d.]+/g) || []).map(Number); return n.length >= 3 ? [n[0] / 255, n[1] / 255, n[2] / 255, n[3] == null ? 1 : n[3]] : null; };
  const lum = ([r, g, b]) => { const f = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const SUNK = [11 / 255, 15 / 255, 18 / 255];
  const over = (c, bg) => c.slice(0, 3).map((x, i) => x * c[3] + bg[i] * (1 - c[3]));
  const hex = (c) => '#' + c.slice(0, 3).map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const wrap = (A) => `--warn: ${A}; --staged: ${A}; --ok: ${A}; --danger-ink: ${A}; --danger-edge: color-mix(in srgb, ${A} 55%, #0B0F12);`;
  /* a cell in the hover state: the recipe laid inline on the button (a stylesheet cannot be hovered on demand); its numbers read back off what it draws */
  function Cell({ kind, A, r, hue }) {
    const ref = useRef(); const [n, setN] = useState(null);
    useLayout(ref, (box) => { const b = box.querySelector('button'); if (!b) return; const w = r === 100 ? A : `color-mix(in srgb, ${A} ${r}%, white)`;
      imp(b, 'transition', 'none'); imp(b, 'background', `color-mix(in srgb, ${A} 12%, var(--sunk))`); imp(b, 'box-shadow', `inset 0 0 0 1px color-mix(in srgb, ${A} 75%, transparent)`); imp(b, 'border-color', 'transparent'); imp(b, 'color', w);
      b.querySelectorAll('svg').forEach((s) => imp(s, 'color', w));
      const c = getComputedStyle(b); const bg = over(P(c.backgroundColor), SUNK); const fg = P(c.color); if (!fg) return; const v = { cr: ratio(fg, bg), hx: hex(fg) }; setN((o) => (o && o.hx === v.hx && Math.abs(o.cr - v.cr) < 0.01 ? o : v)); rec(hue, kind, r, v); });
    return html`<div class="cl-c" ref=${ref} data-cl=${`${hue}|${kind}|${r}`}><div class="cl-b" style=${wrap(A)} inert>${el[kind]()}</div>${n ? html`<span class=${'cl-n' + (n.cr < 4.5 ? ' lo' : '')}><b>${n.cr.toFixed(1)}</b> ${n.hx}</span>` : null}</div>`;
  }
  function Live({ kind, A }) { return html`<div class="cl-c cl-live" data-cl="live"><div class="cl-b" style=${wrap(A)}>${el[kind]()}</div><span class="cl-n">hover it</span></div>`; }
  function Colours({ verdict }) {
    return html`<${Sec} id="colours" title="Colours" tag="Decided" kind="ok" hint="each colour on tint (Stage deletion) and paint (Edit builds); the words on hover at each ratio, with their contrast on that hover fill">
      ${verdict}
      <div class="cl-grid"><i></i><b class="cl-h rrest">rest</b>${RATIOS.map((r) => html`<b class=${'cl-h r' + r + (r === 80 ? ' today' : '')}>${r === 100 ? 'hover · the colour' : `hover · ${r}% on white`}${r === 80 ? html`<em>today</em>` : null}</b>`)}
        ${HUES.map(([name, v]) => { const A = tok(v); return html`<div class="cl-k"><i style=${`background:${A}`}></i><span>${name}</span><em>${A}</em></div>
          ${['tint', 'paint'].map((kind) => html`<span class="cl-s">${kind}</span><${Live} kind=${kind} A=${A} />${RATIOS.map((r) => html`<${Cell} kind=${kind} A=${A} r=${r} hue=${name} />`)}`)}`; })}
      </div><//>`;
  }
  return { Colours, HUES, RATIOS };
}
