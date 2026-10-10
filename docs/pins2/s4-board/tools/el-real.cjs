// Session 4 · the real buttons of Board 4: Collective, for the element board (Harkirat, 2026-10-02 21:15–21:16 EDT: "a whole page dedicated to just
// the button that are present in the board 4: collective. then group those together by the ones that look similar, and then run the
// standardization pipeline … why are you taking screenshots WHEN WE HAVE THE CODE FOR THE REAL BUTTONS????").
// Board 4 has no single Button component: each button is markup its component writes, styled by the kit's own stylesheets. So the real
// button IS that markup plus those stylesheets. For every look of every variation in el/vary-b4.json this takes the button's own markup from
// the running board (nothing else from the page, only an empty skeleton of its ancestors so the kit's scoped rules still match) and the kit's
// stylesheets with every :hover, :focus-visible and :active left as written, so on the board the button reacts to the real pointer.
// The button is not pinned to a size: it takes the size the kit's CSS gives it, and the board checks that against what Board 4 draws.
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/el-real.cjs  → el/real.json
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs')); const { PAGE, STD } = require('./el-page.cjs'); const CSSX = require('./el-css.cjs'); const ROOT = path.resolve(__dirname, '../../../..');
const EL = path.join(__dirname, 'el'); const vary = JSON.parse(fs.readFileSync(path.join(EL, 'vary-b4.json'), 'utf8'));
const views = JSON.parse(fs.readFileSync(path.join(__dirname, 'diff', 'dump.json'), 'utf8')).views;
const MAXTONES = 6;
(async () => {
  const reps = []; for (const [ty, o] of Object.entries(vary)) o.rows.forEach((r, ri) => r.tones.slice(0, MAXTONES).forEach((tn, ti) => reps.push({ ty, ri, ti, tn })));
  const byView = new Map(); for (const r of reps) { const k = r.tn.rep.v; if (!byView.has(k)) byView.set(k, []); byView.get(k).push(r); }
  const { b, p, errs } = await W.open(); const MODE = process.env.B4_QUIRKS ? 'quirks' : 'std'; if (MODE === 'std') await STD(p);
  const reload = async () => { await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await p.evaluate(() => document.fonts.ready); await W.sleep(800); };
  const out = { samples: {}, misses: [] };
  // the kit's CSS from its source: what to copy, which size queries and :has() arguments the copies must answer, and how Board 4 answers its @media
  await reload(); const P = CSSX.plan(await CSSX.sheetsOf(p, ROOT)); const OK = await CSSX.answers(p, P);
  for (const [vi, list] of byView) {
    const v = views[vi]; await reload(); let scope;
    if (v.kind === 'state' || v.kind === 'try') { const acts = await W.actions(p, v.id); const a = acts.find((x) => x[0] === v.kind && x[2] === v.label); if (a) await W.act(p, v.id, a[0], a[1]); }
    if (v.kind === 'pop' || v.kind === 'drawer') { const pop = W.POPS.find((x) => x.label === v.label); const o = await W.openPop(p, pop); if (!o.ok) { out.misses.push(`${v.label} did not open`); continue; } scope = { kind: 'pop', sel: pop.sel || W.POP_SEL }; } else scope = { kind: 'stage', sel: W.STAGE(v.id) };
    await p.evaluate(PAGE);
    const got = await p.evaluate((scope, list, cq, has) => { const els = window.__fzWalk(scope); const cls = (e) => (typeof e.className === 'string' ? e.className : e.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).sort().join('.'); const res = {};
      for (const r of list) { const rep = r.tn.rep; let e = els[rep.i];
        if (!e || e.tagName.toLowerCase() !== rep.tag || cls(e) !== rep.cls) e = els.find((x) => x.tagName.toLowerCase() === rep.tag && cls(x) === rep.cls && (x.textContent || '').replace(/\s+/g, ' ').trim().startsWith(rep.txt.slice(0, 12))) || els.find((x) => x.tagName.toLowerCase() === rep.tag && cls(x) === rep.cls);
        if (!e) continue; const hits = window.__fzCQHits(e, cq); const cp = window.__fzCopy(e, { sprite: true, tables: true, has, vars: hits.map((i) => '--fzq-' + i + ': on').join(';') }); const R = e.getBoundingClientRect(); e.setAttribute('data-fzr', `${r.ty}|${r.ri}|${r.ti}`);
        // the copy keeps the kit's own size: the pins __fzCopy adds for the old board are taken off again
        const html = cp.html.replace(/;width:[\d.]+px !important;height:[\d.]+px !important;min-width:0 !important;max-width:none !important;margin:0 !important;position:relative !important;inset:auto !important;transform:none !important;flex:none !important;opacity:1 !important;visibility:visible !important/, ';margin:0 !important;position:relative !important;inset:auto !important;flex:none !important');
        const shown = (e.innerText || '').replace(/\s+/g, ' ').trim(); const name = (shown || e.getAttribute('aria-label') || e.getAttribute('title') || '').slice(0, 48); const label = (shown && e.getAttribute('aria-label') && e.getAttribute('aria-label') !== shown) ? e.getAttribute('aria-label').slice(0, 60) : '';
        res[`${r.ty}|${r.ri}|${r.ti}`] = { html, ground: cp.ground, ground0: cp.ground, w: R.width, h: R.height, name, label, cls: cp.cls, cq: hits }; }
      return res; }, scope, list, P.cq, P.has);
    // the ground is what Board 4 actually paints behind the button: the button is made invisible, its box photographed, and the most common
    // colour in it kept (an ancestor composite missed overlays and pop-up surfaces, so ghost buttons sat on the wrong grey)
    for (const k of Object.keys(got)) { const hd = await p.$(`[data-fzr="${k}"]`); if (!hd) continue; await hd.evaluate((e) => { e.scrollIntoView({ block: 'center', inline: 'center' }); e.style.setProperty('transition', 'none', 'important'); e.style.setProperty('opacity', '0', 'important'); }); await p.mouse.move(1, 1); await W.sleep(250);
      try { const b64 = await hd.screenshot({ encoding: 'base64' }); got[k].ground = await p.evaluate(async (b64) => { const i = new Image(); await new Promise((r) => { i.onload = r; i.src = 'data:image/png;base64,' + b64; }); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data; const n = {}; for (let j = 0; j < d.length; j += 4) { const key = d[j] + ',' + d[j + 1] + ',' + d[j + 2]; n[key] = (n[key] || 0) + 1; } return 'rgb(' + Object.entries(n).sort((a, b) => b[1] - a[1])[0][0] + ')'; }, b64); } catch (e) {}
      await hd.evaluate((e) => { e.style.removeProperty('opacity'); e.style.removeProperty('transition'); }); }
    for (const r of list) { const k = `${r.ty}|${r.ri}|${r.ti}`; if (got[k]) out.samples[k] = { ...got[k], page: r.tn.rep.page }; else out.misses.push(`${k} ${r.tn.rep.tag}.${r.tn.rep.cls} «${r.tn.rep.txt}» in ${v.g} ${v.label}`); }
    if (scope.kind === 'pop') await W.closePop(p).catch(() => {});
    process.stdout.write('.');
  }
  // the kit's stylesheets, copied from source (el-css.cjs) with every :hover, :focus-visible and :active left as written
  const css = CSSX.emit(P, OK); css.nested = P.nested; if (P.imports) console.log(`\n⚠ ${P.imports} @import rules were not followed`);
  await reload();
  out.css = css.text; out.props = css.props; out.mode = MODE; out.cq = P.cq; out.has = P.has; if (css.nested) console.log(`\n⚠ ${css.nested} style rules carry nested rules: copied as written, their inner selectors not rewritten`); out.errs = errs; out.hostAttrs = await p.evaluate(() => Object.fromEntries([...document.documentElement.attributes].map((x) => [x.name, x.value])));
  fs.writeFileSync(path.join(EL, 'real.json'), JSON.stringify(out));
  console.log(`\nsamples ${Object.keys(out.samples).length} · misses ${out.misses.length} · css ${(css.text.length / 1024).toFixed(0)}KB · ${(fs.statSync(path.join(EL, 'real.json')).size / 1048576).toFixed(1)}MB`);
  if (out.misses.length) console.log(out.misses.slice(0, 12).join('\n'));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
