// spec-board (2026-10-09 15:30 EDT): Pop-ups, his 11:49 EDT "problem pop-up is broken. also you didn't draw the all-pass, no-image, image didn't load, build image, staged
// deletion pop-ups?". The Overlays section drew the problem card from a copy of its markup; the card is placed, measured and outlined by its own code
// (ProblemChip and Hint in b3/armory-parts.js), so a copy of its markup has no outline, no placement and its hazard strip loose. Here each pop-up is the
// board's own component, opened the way the board opens it (a click pins the problem card; the pointer opens a hint), then kept as it drew. The board
// shows one pop-up at a time (takePop), so they open in turn, each one kept where it opened before the next.
// 2026-10-09 19:36 EDT: CAPTURED, NEVER OPENED IN HIS BROWSER (his 19:29 EDT screenshot: the All pass card floating over Text sizes). Opening the pop-ups at load put a fixed card
// wherever the viewport was while the sequence ran, and flashed pop-ups while he read. Now the sequence runs only under ?capture=popups, driven headless by
// work/lead/popups-capture.cjs, which writes spec-img/popups.json; the page draws only what was captured. Re-run the capture when the board's pop-ups change.
import { ProblemChip, Hint, StageDeletionButton, faultsFor } from './b3/armory-parts.js';
import { ImageChip } from './ui/armory.js';
export function makePopups(L) {
  const { html, useRef, useEffect, useState, Sec, useBuilds, Ctx, noop } = L;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const STEPS = [['Staged', 'on', 'trash-2', 'now'], ['Review', 'next', 'eye', 'you commit'], ['Removed', 'end', 'x', 'only then']];   /* b3/armory-parts.js's own, beside Stage deletion */
  const CAP = /[?&]capture=popups\b/.test(location.search);
  const SAVED = { k: null }; const savedReady = CAP ? Promise.resolve() : fetch('spec-img/popups.json').then((r) => (r.ok ? r.json() : null)).then((j) => { SAVED.k = (j && j.kept) || {}; }).catch(() => { SAVED.k = {}; });
  function Popups() {
    const builds = useBuilds(); const ref = useRef(); const [kept, setKept] = useState(CAP ? {} : SAVED.k || {});
    useEffect(() => { if (!CAP) savedReady.then(() => setKept(SAVED.k || {})); }, []);
    const f = builds.find((b) => faultsFor(b).length > 1) || builds.find((b) => faultsFor(b).length); const p = builds.find((b) => !faultsFor(b).length && b.imageKey);
    const V = f && p ? [
      ['problem', 'Problem', 'a build with problems: the problem chip, clicked (Manifest, Compare)', 'click', html`<${ProblemChip} weapon=${f.weaponName} faulty=${[{ b: f, n: 1 }]} builds=${builds} onOpen=${noop} />`],
      ['pass', 'All pass', 'a build that passes every check: its shield chip, clicked', 'click', html`<${ProblemChip} weapon=${p.weaponName} faulty=${[{ b: p, n: 1 }]} builds=${builds} onOpen=${noop} compact=${true} tone="ok" />`],
      ['image', 'Build image', "the image mark's card, its image loaded", 'hover', html`<${ImageChip} b=${p} />`],
      ['noimg', 'No image', 'a build with no image key', 'hover', html`<${ImageChip} b=${{ ...p, _id: 'spec-noimg', imageKey: '', imageUrl: '' }} />`],
      ['fail', 'Image didn’t load', 'a key is set, the image failed', 'hover', html`<${ImageChip} b=${{ ...p, _id: 'spec-fail', imageUrl: '' }} />`],
      ['staged', 'Staged deletion', 'the hint on Stage deletion in the selection bar', 'hover', html`<${Hint} set=${1} title="Nothing is deleted yet" sub="Discard on Review and every build comes back." steps=${STEPS} id="spec-del-hint" tone="del"><${StageDeletionButton} onDelete=${noop} /><//>`]] : [];
    useEffect(() => { if (!CAP || !V.length) return undefined; let dead = false;
      (async () => { await sleep(600); const out = {};
        for (const [k, , , how] of V) { if (dead) return; const cell = ref.current && ref.current.querySelector(`[data-pv="${k}"]`); if (!cell) continue; const live = cell.querySelector('.pv-live');
          const trig = how === 'click' ? live.querySelector('.b3-fchip') : live.querySelector('.b3-hint'); if (!trig) continue;
          if (how === 'click') trig.click(); else trig.dispatchEvent(new MouseEvent('mouseenter'));
          let card = null; for (let t = 0; t < 60 && !(card = live.querySelector('.b3-pc.in, .b3-hc.in')); t++) await sleep(50);
          await sleep(900);   /* the outline's path settles after the card opens */
          if (!card) { out[k] = { miss: true }; continue; }
          const cr = cell.getBoundingClientRect(), kr = card.getBoundingClientRect(); let cb = card.parentElement; while (cb && cb !== cell && getComputedStyle(cb).position === 'static') cb = cb.parentElement; const br = (cb || cell).getBoundingClientRect();   /* the box an absolute card is placed in: a pinned (fixed) card is kept where it drew, relative to it */ const copy = live.cloneNode(true); copy.classList.remove('pv-live'); copy.classList.add('pv-kept');
          const kc = copy.querySelector('.b3-pc.in, .b3-hc.in'); if (!kc) { out[k] = { miss: true }; if (how === 'click') trig.click(); else trig.dispatchEvent(new MouseEvent('mouseleave')); await sleep(500); continue; }   /* closed before it could be kept (the page scrolled it away) */ const at = `position:absolute !important; left:${Math.round(kr.left - br.left)}px !important; top:${Math.round(kr.top - br.top)}px !important; position:absolute !important; right:auto !important; bottom:auto !important; transform:none !important; margin:0 !important;`;
          kc.setAttribute('style', (kc.getAttribute('style') || '') + ';' + at); copy.querySelectorAll('[id]').forEach((x) => x.removeAttribute('id')); kc.classList.remove('b3-pc-fixed');   /* no rule may ever fix the kept card to the viewport */
          out[k] = { html: copy.outerHTML, h: Math.max(kr.bottom, cell.getBoundingClientRect().bottom) - cr.top + 12, w: kr.right - cr.left, cls: cell.className };
          if (how === 'click') trig.click(); else trig.dispatchEvent(new MouseEvent('mouseleave')); await sleep(500); }
        if (!dead) { setKept(out); window.__popkept = out; } })();
      return () => { dead = true; }; }, [V.length]);
    return html`<${Sec} id="popups" title="Pop-ups" tag="Decided" kind="ok" hint="the board's own pop-ups, opened the way the board opens them, each kept as it drew">
      <div class="pv-grid" ref=${ref}>${V.length ? V.map(([k, t, what, how, el]) => { const K = kept[k]; return html`<figure class="pv-c"><figcaption><b>${t}</b><span>${what}</span></figcaption>
        <div class=${'pv-cell pv-' + how} data-pv=${k} style=${K && K.h ? `min-height:${Math.ceil(K.h)}px` : null}>${K && K.html ? html`<div class="pv-k" dangerouslySetInnerHTML=${{ __html: K.html }} />` : K && K.miss ? html`<span class="rc-wait">did not open at capture</span>` : CAP ? html`<div class="pv-live"><${Ctx} cls="pb b4">${el}<//></div>` : html`<span class="rc-wait">not captured yet</span>`}</div></figure>`; }) : html`<span class="rc-wait">loading the builds…</span>`}</div><//>`;
  }
  return { Popups };
}
