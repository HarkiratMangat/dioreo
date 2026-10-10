// Session 4 · before/after captures on Board 4 for the standardization board (plan §5c Step 5: each "after" rendered by injecting the
// standard into the live kit page, never committed). Usage:  node capture.cjs <shots.json> <after.css> <outdir> [onlyId,onlyId]
// shots.json: [{ id, gate:'c-manifest', state:'Pick three'|null, sel, idx?, pad?, hover?, hoverIdx?, mode?:'both'|'before'|'after' }]
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const [, , SHOTS, CSS, OUT, ONLY] = process.argv;
const shots = JSON.parse(fs.readFileSync(SHOTS, 'utf8')).filter((s) => !ONLY || ONLY.split(',').includes(s.id));
const after = CSS && CSS !== '-' ? fs.readFileSync(CSS, 'utf8') : ''; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const { b, p, errs } = await W.open(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 2 });
  await p.setRequestInterception(true); p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  const report = [];
  for (const s of shots) {
    // A shot that carries its own `css` is ONE option of a gallery: captured once, as `<id>.png`, with only that CSS injected.
    for (const mode of ('css' in s ? ['opt'] : (s.mode && s.mode !== 'both' ? [s.mode] : ['before', 'after']))) {
      await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await p.evaluate(() => document.fonts.ready); await W.sleep(800);
      if (s.state) { const ok = await W.setState(p, s.gate, s.state); if (!ok) { const acts = await W.actions(p, s.gate); const t = acts.find((a) => a[2] === s.state); if (t) await W.act(p, s.gate, t[0], t[1]); else report.push(`${s.id}: no state "${s.state}"`); } }
      if (s.click) { await W.clickReal(p, `#${s.gate} ${s.click}`); }
      if (mode === 'after') { await p.addStyleTag({ content: after }); await W.sleep(350); }
      if (mode === 'opt' && s.css) { await p.addStyleTag({ content: s.css }); await W.sleep(350); }
      const box = await p.evaluate((sel, idx) => { const e = [...document.querySelectorAll(sel)].filter((x) => x.getBoundingClientRect().width > 0)[idx || 0]; if (!e) return null;
        e.scrollIntoView({ block: 'center', inline: 'nearest' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, `#${s.gate} ${s.sel}`, s.idx);
      if (!box) { report.push(`${s.id} ${mode}: no element for ${s.sel}`); continue; }
      await W.sleep(250);
      await p.mouse.move(2, 2); await W.sleep(150);
      if (s.hover) { const hb = await p.evaluate((sel, idx) => { const e = [...document.querySelectorAll(sel)].filter((x) => x.getBoundingClientRect().width > 0)[idx || 0]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, `#${s.gate} ${s.hover}`, s.hoverIdx);
        if (hb) { await p.mouse.move(hb.x, hb.y, { steps: 4 }); await W.sleep(s.wait || 600); } else report.push(`${s.id} ${mode}: no hover target ${s.hover}`); }
      const box2 = await p.evaluate((sel, idx) => { const e = [...document.querySelectorAll(sel)].filter((x) => x.getBoundingClientRect().width > 0)[idx || 0]; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, sx: window.scrollX, sy: window.scrollY }; }, `#${s.gate} ${s.sel}`, s.idx);
      const pad = s.pad == null ? 12 : s.pad; const vw = 1282, vh = 888;
      // The viewport as painted, then cropped to the element's VIEWPORT box: fixed and scrolled elements both land where they are seen.
      const x0 = Math.max(0, box2.x - pad), y0 = Math.max(0, box2.y - pad); const clip = { width: Math.min(vw, box2.x + box2.w + pad) - x0, height: Math.min(vh, box2.y + box2.h + pad) - y0 };
      const file = path.join(OUT, mode === 'opt' ? `${s.id}.png` : `${s.id}-${mode}.png`); const tmp = file + '.full.png'; await p.screenshot({ path: tmp });
      require('child_process').execFileSync('magick', [tmp, '-crop', `${Math.round(clip.width * 2)}x${Math.round(clip.height * 2)}+${Math.round(x0 * 2)}+${Math.round(y0 * 2)}`, '+repage', file]); fs.unlinkSync(tmp);
      report.push(`${s.id} ${mode}: ${Math.round(clip.width)}×${Math.round(clip.height)}`);
    }
  }
  await b.close(); console.log(report.join('\n')); if (errs.length) console.log('page errors:', errs.slice(0, 3));
})().catch((e) => { console.error(e); process.exit(2); });
