// spec-board (2026-10-08 19:48 EDT): "5 · The selection bar, whole" from Builder-2, the list open only (his 2026-10-08 19:44 EDT: "just this part"), cloned whole
// with the builder's geometry rules. A switch at the top lays S 24 or M 32 on the code and the buttons beside it (the status chip, the ×): his Q3
// exception, to see before he decides (19:43 EDT). Each row's geometry is laid on the clone, so it previews a board change; "today" is the board as is.
export function makeSelbar(L) {
  const { html, useState, useRef, useEffect, getJson, Sec, Clone, scopeRule } = L;
  const ROW = { S: { h: 24, p: 10, r: 6, i: 12, w: 11 }, M: { h: 32, p: 10, r: 8, i: 14, w: 11 } };
  const S = { v: null };
  const ready = getJson('spec-img/board-dom.json').then((j) => { S.v = j && j.selbar; if (!S.v) return; const st = document.createElement('style'); st.id = 'bd-selbar';
    st.textContent = `#selbar { ${Object.entries(S.v.bdvars || {}).map(([k, x]) => `${k}: ${x};`).join(' ')} }\n` + (S.v.bd || []).map((r) => scopeRule(r, '#selbar')).join('\n') + '\n#selbar .b3-sd-code::before, #selbar .b3-fchip::before, #selbar .b3-x::before { border-radius: inherit; }'; document.head.appendChild(st); });
  // the row laid on one button, its own inline style kept underneath (the board writes custom properties there)
  const lay = (e, R) => { if (e.dataset.os === undefined) e.dataset.os = e.getAttribute('style') || ''; e.setAttribute('style', e.dataset.os); e.querySelectorAll('svg').forEach((s) => { if (s.dataset.os === undefined) s.dataset.os = s.getAttribute('style') || ''; s.setAttribute('style', s.dataset.os); });
    if (!R) return; const words = (e.innerText || '').trim().length > 0;
    e.style.cssText += `;height:${R.h}px !important;min-height:${R.h}px !important;max-height:${R.h}px !important;border-radius:${R.r}px !important;font-size:${R.w}px !important;box-sizing:border-box !important;` + (words ? `padding-left:${R.p}px !important;padding-right:${R.p}px !important;` : `width:${R.h}px !important;min-width:${R.h}px !important;padding:0 !important;`);
    e.querySelectorAll('svg').forEach((s) => { s.style.cssText += `;width:${R.i}px !important;height:${R.i}px !important;`; }); };
  function Selbar() {
    const [, set] = useState(0); const [mode, setMode] = useState('M');   /* his "32." decided it; 24 stays on the switch for the record */ const ref = useRef();
    useEffect(() => { ready.then(() => set(1)); }, []);
    useEffect(() => { const host = ref.current; if (!host || !S.v) return; const bar = host.querySelector('.b3-sd'); if (bar) bar.style.width = S.v.w + 'px';   /* its board width: the stage, not the bar, sets it there */
      host.querySelectorAll('.b3-sd-code, .b3-fchip, .b3-x').forEach((e) => lay(e, ROW[mode])); });
    const sw = html`<div class="accsw" role="group" aria-label="Row for the code and the buttons beside it">${[['S', '24'], ['M', '32'], ['today', 'today · 28']].map(([k, t]) => html`<button type="button" class=${'acc' + (mode === k ? ' on' : '')} aria-pressed=${mode === k ? 'true' : 'false'} onClick=${() => setMode(k)}>${t}</button>`)}</div>`;
    return html`<${Sec} id="selbar" title="The selection bar" tag="Decided: 32" kind="ok" aside=${sw}><div class="sb-host" ref=${ref} data-mode=${mode}>${S.v ? html`<${Clone} path=${S.v.path} markup=${S.v.html} />` : null}</div><//>`;
  }
  return { Selbar };
}
