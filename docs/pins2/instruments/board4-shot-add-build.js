// Board 4 shot, saved 2026-09-24 11:39 EDT, for board4-shot.sh: the Add build drawer with the Stage blocker's hint open. The Hint reveals on a JS
// mouseenter after 400ms, which forced .__h hover classes never fire, so it dispatches the event and waits 900ms.
async () => { await window.__H.pick('c-new-build', 'Add build'); const d = [...document.querySelectorAll('.drawer')].find((x) => x.querySelector('.f-form')); d.scrollIntoView({ block: 'center' }); await window.__H.w(500);
  const go = d.querySelector('.go'); const hint = go.closest('.b3-hint'); hint.dispatchEvent(new MouseEvent('mouseenter')); await window.__H.w(900);
  const card = hint.querySelector('.b3-hc'); const cr = card && card.getBoundingClientRect(), gr = go.getBoundingClientRect(); const r = d.getBoundingClientRect();
  return { rect: [r.x, r.y, r.width, r.height], m: { card: !!card, cls: card && card.className, text: card && card.textContent.trim(), gapToGo: card && +(gr.top - cr.bottom).toFixed(1), arrowVsGoCentre: card && +((cr.left + parseFloat(card.style.getPropertyValue('--tx'))) - (gr.left + gr.width / 2)).toFixed(1), why: !!d.querySelector('.b4-why'), goAria: go.getAttribute('aria-disabled') } }; }
