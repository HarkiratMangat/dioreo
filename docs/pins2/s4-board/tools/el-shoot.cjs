// Session 4 · the element board from REAL pictures (Harkirat, 2026-10-02 21:05 EDT: "why tf is everything dead-state? and why tf is nearly every
// surface on it broken?"). Every earlier board drew copies of Board 4 lifted into shadow roots, and the copies broke; the board he signed off
// (Board 4: Collective) was the kit itself. This takes nothing out of the page: for each variation's representative element (el/vary.json) it
// goes to the real view on Board 4 or the portal harness and photographs, on the real page —
//   place  — the element with a small slice of its real surroundings, everything but the element dimmed by an overlay drawn on the page;
//   rest · hover · press · focus — the element alone (8px around it) at rest, under the real pointer, held down (:active forced while the
//   pointer is over it), and focused from the keyboard (focus() with :focus-visible forced);
// and it names the element by where it lives and what it says (its aria-label, title or words), the way he would name it.
// Run with repo-static on :8900 and the harness on :8901:  node local/pins2/s4/work/lead/el-shoot.cjs [type ...]  → el/shots.json
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs')); const PW = require('./portal-walk.cjs');
const EL = path.join(__dirname, 'el'); const vary = JSON.parse(fs.readFileSync(path.join(EL, 'vary.json'), 'utf8'));
const D = path.join(__dirname, 'diff'); const views = JSON.parse(fs.readFileSync(path.join(D, 'dump.json'), 'utf8')).views.map((v) => ({ ...v, els: undefined, src: 'b4' }));
if (fs.existsSync(path.join(D, 'dump-portal.json'))) views.push(...JSON.parse(fs.readFileSync(path.join(D, 'dump-portal.json'), 'utf8')).views.filter((v) => v.els.length).map((v) => ({ ...v, els: undefined, src: 'portal' })));
const TYPES = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(vary);
const MAXTONES = 4;
const WALK = String.raw`window.__fzWalk = (scope) => { const roots = scope.kind === 'stage' ? [...document.querySelectorAll(scope.sel)].filter((e) => e.getBoundingClientRect().width > 0)
    : [...document.querySelectorAll(scope.sel)].filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0);
  const out = []; const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = e.getBoundingClientRect(); return !(r.width < 0.5 || r.height < 0.5); };
  const walk = (e) => { if (!vis(e)) return; out.push(e); for (const c of e.children) walk(c); }; for (const r of roots) walk(r); return out; };
  // where an element lives, in the words a person uses for the surface around it
  window.__fzPlace = (e) => { const W_ = [['.dw-f', 'drawer footer'], ['.dw-h', 'drawer header'], ['aside.drawer', 'drawer'], ['.f-menu', 'list'], ['.b4-pop, .b3-datepop', 'pop-up'], ['.mtools, .b3-xt-top', 'toolbar'], ['.ph', 'panel head'],
      ['.wg-heads, .b3-hi-h, thead', 'column heads'], ['.wg-h, .b3-hi-day', 'group head'], ['.wg-r, .b3-hi-r, tbody tr, .lrow, .rvr, .att-row', 'row'], ['.b3-tk-ft, .lc-foot, .b3-xf-f, .pb-encf', 'card footer'], ['.b3-tk-h, .lc-h, .b3-xf-h', 'card header'],
      ['.g-card, .b3-tk, .exs-i, .cx-w, .dcard, .lc, .bcard, .sess, .tile, .srec-tile', 'card'], ['.masthead', 'masthead'], ['.app > header', 'top bar'], ['nav.rail', 'rail'], ['.b3-sb, .selbar, .selbar-in', 'selection bar'], ['.b4-vb', 'panel'], ['section.panel, .pb-panel, .panel', 'panel']];
    for (const [sel, w] of W_) { if (e.closest(sel)) return w; } return 'page'; };
  window.__fzName = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || (e.textContent || '').replace(/\s+/g, ' ').trim()).slice(0, 48);`;
(async () => {
  const out = {}; const reps = [];
  for (const ty of TYPES) { out[ty] = { rows: vary[ty].rows.map((r) => ({ key: r.key, dims: r.dims, uses: r.uses, pages: r.pages, texts: r.texts, tones: [] })), dims: vary[ty].dims, common: vary[ty].common };
    vary[ty].rows.forEach((r, ri) => r.tones.slice(0, MAXTONES).forEach((tn, ti) => reps.push({ ty, ri, ti, tn }))); }
  const byView = new Map(); for (const r of reps) { const k = r.tn.rep.v; if (!byView.has(k)) byView.set(k, []); byView.get(k).push(r); }
  for (const src of ['b4', 'portal']) {
    const vis = [...byView.keys()].filter((k) => views[k].src === src); if (!vis.length) continue;
    const { b, p } = src === 'b4' ? await W.open() : await PW.open(); if (src === 'portal') await PW.load(p, 'home');
    const cdp = await p.target().createCDPSession(); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const reload = async () => { await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await p.evaluate(() => document.fonts.ready); await W.sleep(800); };
    for (const vi of vis) {
      const v = views[vi]; let scope;
      if (src === 'b4') { await reload(); if (v.kind === 'state' || v.kind === 'try') { const acts = await W.actions(p, v.id); const a = acts.find((x) => x[0] === v.kind && x[2] === v.label); if (a) await W.act(p, v.id, a[0], a[1]); }
        if (v.kind === 'pop' || v.kind === 'drawer') { const pop = W.POPS.find((x) => x.label === v.label); const o = await W.openPop(p, pop); if (!o.ok) continue; scope = { kind: 'pop', sel: pop.sel || W.POP_SEL }; } else scope = { kind: 'stage', sel: W.STAGE(v.id) }; }
      else { await PW.replay(p, v); scope = { kind: 'pop', sel: v.scope }; }
      await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important;caret-color:transparent!important}' }); await p.evaluate(WALK);
      for (const r of byView.get(vi)) {
        const rep = r.tn.rep; const still = scope.kind === 'pop' && src === 'b4';
        const ok = await p.evaluate((scope, rep, still) => { const els = window.__fzWalk(scope); const cls = (e) => (typeof e.className === 'string' ? e.className : e.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).sort().join('.');
          let e = els[rep.i]; if (!e || e.tagName.toLowerCase() !== rep.tag || cls(e) !== rep.cls) e = els.find((x) => x.tagName.toLowerCase() === rep.tag && cls(x) === rep.cls && (x.textContent || '').replace(/\s+/g, ' ').trim().startsWith(rep.txt.slice(0, 12))) || els.find((x) => x.tagName.toLowerCase() === rep.tag && cls(x) === rep.cls);
          if (!e) return null; document.querySelectorAll('[data-fz-shot]').forEach((x) => x.removeAttribute('data-fz-shot')); e.setAttribute('data-fz-shot', ''); if (!still) e.scrollIntoView({ block: 'center', inline: 'center' }); return { name: window.__fzName(e), place: window.__fzPlace(e) }; }, scope, rep, still);
        if (!ok) { console.log(`  ${r.ty} row ${r.ri} tone ${r.ti}: NOT FOUND in ${v.g} ${v.label}`); continue; }
        await W.sleep(still ? 50 : 200);
        const box = await p.evaluate(() => { const e = document.querySelector('[data-fz-shot]'); const q = e.getBoundingClientRect(); return { x: q.left + scrollX, y: q.top + scrollY, w: q.width, h: q.height, vx: q.left, vy: q.top }; });
        const clip = (padX, padY) => ({ x: Math.max(0, box.x - padX), y: Math.max(0, box.y - padY), width: box.w + padX * 2, height: box.h + padY * 2 });
        const shot = async (c) => 'data:image/webp;base64,' + (await p.screenshot({ type: 'webp', quality: 92, clip: c, captureBeyondViewport: true, encoding: 'base64' }));
        // place: the real surroundings, dimmed by a ring drawn on the page around the element, the element itself untouched
        await p.evaluate(() => { const e = document.querySelector('[data-fz-shot]'); const q = e.getBoundingClientRect(); const d = document.createElement('div'); d.id = 'fz-dim';
          d.style.cssText = `position:fixed;left:${q.left - 4}px;top:${q.top - 4}px;width:${q.width + 8}px;height:${q.height + 8}px;border-radius:6px;box-shadow:0 0 0 4000px rgba(8,11,13,.5);pointer-events:none;z-index:2147483647`; document.body.appendChild(d); });
        const place = await shot(clip(72, 30)); await p.evaluate(() => document.getElementById('fz-dim').remove());
        const rest = await shot(clip(8, 8));
        const { root } = await cdp.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-fz-shot]' });
        await p.mouse.move(box.vx + box.w / 2, box.vy + box.h / 2); await W.sleep(250); const hover = await shot(clip(8, 8));
        if (nodeId) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover', 'active'] }); await W.sleep(120); const press = await shot(clip(8, 8));
        await p.mouse.move(2, 2); if (nodeId) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['focus', 'focus-visible'] });
        await p.evaluate(() => { const e = document.querySelector('[data-fz-shot]'); try { e.focus({ preventScroll: true }); } catch (x) {} }); await W.sleep(120); const focus = await shot(clip(8, 8));
        if (nodeId) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }); await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
        out[r.ty].rows[r.ri].tones[r.ti] = { bg: r.tn.bg, ink: r.tn.ink, edge: r.tn.edge, n: r.tn.n, name: ok.name, place: ok.place, page: rep.page, size: [box.w, box.h], shots: { place, rest, hover, press, focus } };
      }
      if (scope.kind === 'pop' && src === 'b4') await W.closePop(p).catch(() => {});
      process.stdout.write('.');
    }
    await b.close();
  }
  for (const ty of TYPES) out[ty].rows.forEach((r) => { r.tones = r.tones.filter(Boolean); });
  fs.writeFileSync(path.join(EL, 'shots.json'), JSON.stringify(out));
  for (const ty of TYPES) console.log(`\n${ty}: ${out[ty].rows.length} variations · ${out[ty].rows.reduce((n, r) => n + r.tones.length, 0)} pictured tones · ${out[ty].rows.filter((r) => !r.tones.length).length} variations with no picture`);
  console.log(`shots.json ${(fs.statSync(path.join(EL, 'shots.json')).size / 1048576).toFixed(1)}MB`);
})().catch((e) => { console.error(e); process.exit(1); });
