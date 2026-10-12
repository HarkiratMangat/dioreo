// Board 4 — THE FOCUS RING AS PAINTED (his 16:59 EDT: "the fields/glow are clipping on the right side … the 2px outline is only applying to the upper portion,
// bottom portion is still 1 px" — board4-rings.cjs read the computed styles and passed both). Focuses each field, screenshots its field box at 4x and
// walks the box's edge: at each sample the run of staged-lime pixels across the edge must be the ring's 2px (8 device px), and 3px outside the box the
// halo must be there (a clipped side shows the backdrop instead). Run: node docs/pins2/instruments/board4-rings-painted.cjs [tag]
const { W, boot } = require('./board4-checks-lib.cjs'); const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const OUT = path.resolve(__dirname, '../../../local/pins2/intake-shots/checks');
(async () => { const { b, p, errs } = await boot(4); const D = 4; const tag = process.argv[2] || 'now'; let bad = 0, n = 0;
  const SIDES = ['top', 'right', 'bottom', 'left'];
  const test = async (label, h, own = null) => { await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await h.click({ delay: 10 }).catch(() => h.focus()); await W.sleep(380);
    const bx = await (own || h).evaluate((f) => { let w = f; for (let e = f, k = 0; e && k < 4; e = e.parentElement, k++) { const s = getComputedStyle(e); if ((s.outlineStyle !== 'none' && s.outlineWidth !== '0px') || /216, 242, 74|0\.847059 0\.94902/.test(s.boxShadow) || /216, 242, 74/.test(s.borderTopColor)) { w = e; } } const r = w.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height, rad: parseFloat(getComputedStyle(w).borderTopLeftRadius) || 0, cls: w.tagName.toLowerCase() + '.' + [...w.classList].slice(0, 2).join('.') }; });
    const pad = 10, file = path.join(OUT, `ringp-${tag}-${n}.png`); await p.screenshot({ path: file, clip: { x: bx.x - pad, y: bx.y - pad, width: bx.w + pad * 2, height: bx.h + pad * 2 } });
    // the PNG's own size, never a computed one: a fractional clip rounds, and one pixel of row width skews every sample below the first row
    const [Wd, Hd] = execFileSync('magick', ['identify', '-format', '%w %h', file]).toString().split(' ').map(Number); const raw = execFileSync('magick', [file, '-depth', '8', 'rgb:-'], { maxBuffer: 1 << 29 });
    const px = (x, y) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= Wd || y >= Hd) return [0, 0, 0]; const i = (y * Wd + x) * 3; return [raw[i], raw[i + 1], raw[i + 2]]; };
    const lime = (c) => c[1] > 170 && c[0] > 150 && c[2] < 140 && c[1] > c[2] + 60;   // the staged yellow-lime, antialiasing included
    const res = {}; for (const side of SIDES) { const runs = [], halos = [];
      for (const f of [0.25, 0.5, 0.75]) { let x, y, dx, dy; const L = bx.rad + 4;
        if (side === 'top') { x = pad + L + (bx.w - 2 * L) * f; y = pad; dx = 0; dy = 1; } if (side === 'bottom') { x = pad + L + (bx.w - 2 * L) * f; y = pad + bx.h; dx = 0; dy = -1; }
        if (side === 'left') { x = pad; y = pad + L + (bx.h - 2 * L) * f; dx = 1; dy = 0; } if (side === 'right') { x = pad + bx.w; y = pad + L + (bx.h - 2 * L) * f; dx = -1; dy = 0; }
        let run = 0, started = false; for (let k = -2 * D; k < 6 * D; k++) {   // from 2px OUTSIDE the edge: a box at a half-pixel y (the date fields, 749.5) starts its band before the rounded edge
        const c = px((x + dx * k / D) * D, (y + dy * k / D) * D); if (lime(c)) { run++; started = true; } else if (started) break; } runs.push(run);
        const o = px((x - dx * 3) * D, (y - dy * 3) * D), far = px((x - dx * 9) * D, (y - dy * 9) * D); halos.push(Math.hypot(o[0] - far[0], o[1] - far[1], o[2] - far[2]) > 6 ? 1 : 0); }
      res[side] = { ring: runs, halo: halos }; }
    const off = SIDES.filter((s) => res[s].ring.some((r) => r < 2 * D - 1 || r > 2 * D + 2) || res[s].halo.some((h) => !h));
    if (off.length) bad++; n++;
    console.log(`${off.length ? 'BAD' : 'ok '} ${label.padEnd(26)} ${bx.cls.padEnd(22)} ${SIDES.map((s) => `${s[0]}:${res[s].ring.map((r) => (r / D).toFixed(1)).join('/')}${res[s].halo.every(Boolean) ? '' : ' NO-HALO'}`).join('  ')}`);
    await h.evaluate((e) => e.blur()); };
  await W.setState(p, 'c-broadcast', 'Posting');
  for (const id of ['post-text', 'post-starts', 'post-expires', 'post-accent']) { const h = await p.$('#' + id); if (h) await test('Post drawer ' + id, h); }
  // 2026-09-30 17:39 EDT, his: "when a date picker is open, the field goes back to the 1 px glow" — focus moves into the pop-up, so a check that only focuses
  // fields never saw it. The OPEN state: click the date button and walk the field box with its pop-up showing.
  for (const id of ['post-starts', 'post-expires']) { const h = await p.$(`.pb-dfld:has(#${id}) > .pb-dbtn`); if (h) { await test('Post drawer ' + id + ' OPEN', h, await p.$(`.pb-dfld:has(#${id})`)); await p.keyboard.press('Escape'); await W.sleep(250); } }
  await W.setState(p, 'c-new-build', 'Add build'); for (const id of ['nb-w', 'nb-code']) { const h = await p.$('#' + id); if (h) await test('New build ' + id, h); }
  await W.setState(p, 'c-export', 'Picker'); { const h = await p.$('#xt-q'); if (h) await test('Export search', h); }
  await W.setState(p, 'c-new-build', 'Bulk · empty'); { const h = await p.$('#pb-ta'); if (h) await test('Bulk text', h); }
  console.log(`\n${n} fields · ${bad} off (ring in CSS px per side at 25/50/75%; want 2.0 everywhere and the halo on every side)`); console.log('errs', JSON.stringify(errs.filter((e) => !/cloudinary|404/.test(e)))); await b.close(); })();
