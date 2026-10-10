// spec-board (2026-10-09 16:31 EDT): Q7 drawn (his 11:49 EDT "nearly all of the open questions are drawn as just their current state... draw the corrected proposed state").
// The badge's box is 24 on the Manifest and a 24 square, icon only, in Compare's heads (b3/board.css .b3-bdg; b4/compare.css .b3-bdgs.bare); no rule sizes it.
// The proposal: one box, the XS row (C1: 20 tall, corner 5, padding 6), its words the xs label (9, R11), and Compare's icon-only badge an XS square of 20.
// Each drawn with the board's own B3Badges on a build that carries the most badges, then measured.
// 2026-10-10 19:07 EDT: decided, his Q7 pick "24" (calls/q7, 2026-10-09 22:37 EDT): one box, 24, as the board draws it on both; the XS proposal withdrawn.
import { B3Badges } from './b3/armory-parts.js';
export function makeBadge(L) {
  const { html, useRef, useState, Sec, useBuilds, Ctx, useLayout } = L;
  const score = (b) => (b.isMeta ? 1 : 0) + (b.categoryRank || b.dmzRangeRank ? 1 : 0) + (b.isToxic ? 1 : 0) + (b.isAss ? 1 : 0);
  function Cell({ cap, children }) {
    const ref = useRef(); const [m, setM] = useState(null);
    useLayout(ref, (el) => { const e = el.querySelector('.b3-bdg'); if (!e) return; const r = e.getBoundingClientRect(); const c = getComputedStyle(e); const v = `${Math.round(r.width * 10) / 10} × ${Math.round(r.height * 10) / 10} · corner ${parseFloat(c.borderTopLeftRadius)} · words ${parseFloat(c.fontSize)} · ${c.fontWeight}`; setM((o) => (o === v ? o : v)); });
    return html`<figure class="q7-c" ref=${ref}><figcaption>${cap}</figcaption><div class="q7-s">${children}</div><span class="q7-m">${m || '…'}</span></figure>`;
  }
  function Badge() {
    const builds = useBuilds(); const b = [...builds].sort((x, y) => score(y) - score(x))[0];
    if (!b) return html`<${Sec} id="badge" title="The badge box" tag="Decided" kind="ok"><span class="rc-wait">loading the builds…</span><//>`;
    const man = html`<${Ctx} cls="pb b4"><${B3Badges} b=${b} /><//>`; const cmp = html`<${Ctx} cls="pb b4"><span class="cx-hb"><div class="cx-run b3-fadx" data-rows="1"><${B3Badges} b=${b} bare /></div></span><//>`;
    return html`<${Sec} id="badge" title="The badge box" tag="Decided" kind="ok" hint="your Q7: keep 24 · the board's own badges on one build, measured">
      <div class="q7"><div class="q7-r q7d"><b>decided · 24</b><${Cell} cap="Manifest">${man}<//><${Cell} cap="Compare (icon only)">${cmp}<//></div></div><//>`;
  }
  return { Badge };
}
