// Session 4 · the reference half of the Standard board's fidelity sweep: crop the real element in Board 4: Collective and record what
// it is made of (every descendant's class, its own text and the styles a family can vary), so each sample on the board can be checked
// against the thing it claims to show. Harkirat, 2026-10-02 11:37 EDT: "how do i pick a standardization from a choice that's literally
// showing the incorrect designs and options?? sweep your board".
// Spec file: JSON list of { id, gate, text, up, hover, pad }. `text` finds the deepest element whose own text starts with it inside
// #gate; `up` climbs that many parents; `hover` hovers the found element before the crop.
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/kit-crop.cjs <spec.json> <outdir>
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const [specF, out] = process.argv.slice(2); const spec = JSON.parse(fs.readFileSync(specF, 'utf8'));
const PROPS = ['display', 'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'textTransform', 'color', 'backgroundColor', 'backgroundImage', 'borderTopWidth', 'borderTopStyle', 'borderTopColor', 'borderRadius', 'boxShadow', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'gap', 'height', 'width', 'transform', 'opacity'];
(async () => {
  const { b, p } = await W.open(); await W.sleep(900); fs.mkdirSync(out, { recursive: true });
  const res = [];
  for (const s of spec) {
    const found = await p.evaluate((s) => {
      const root = document.getElementById(s.gate) || document; let best = null;
      if (s.sel) best = root.querySelectorAll(s.sel)[s.nth || 0] || null;
      const want = (s.text || '').toLowerCase();
      if (!s.sel) for (const e of root.querySelectorAll('*')) {
        const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim().toLowerCase();
        if (own && own.startsWith(want) && e.getBoundingClientRect().width > 1) { best = e; if (s.nth == null || (s.nth -= 1) < 0) break; }
      }
      if (!best) return null;
      let el = best; for (let i = 0; i < (s.up || 0) && el.parentElement; i++) el = el.parentElement;
      document.querySelectorAll('[data-kc]').forEach((x) => x.removeAttribute('data-kc'));
      el.setAttribute('data-kc', '1'); best.setAttribute('data-kc', best === el ? '1' : '2');
      el.scrollIntoView({ block: 'center' });
      return true;
    }, s);
    if (!found) { res.push({ id: s.id, error: 'not found' }); continue; }
    if (s.hover) { await p.hover('[data-kc="2"], [data-kc="1"]').catch(() => {}); await W.sleep(450); }
    const info = await p.evaluate((PROPS) => {
      const el = document.querySelector('[data-kc="1"]'); const r = el.getBoundingClientRect();
      const nodes = [el, ...el.querySelectorAll('*')].slice(0, 40);
      const desc = nodes.map((n) => { const cs = getComputedStyle(n); const st = {}; PROPS.forEach((k) => { st[k] = cs[k]; });
        const own = [...n.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent).join('').replace(/\s+/g, ' ').trim();
        const rr = n.getBoundingClientRect(); let depth = 0; for (let x = n; x && x !== el; x = x.parentElement) depth++;
        return { depth, tag: n.tagName.toLowerCase(), cls: typeof n.className === 'string' ? n.className : '', text: own.slice(0, 60), w: Math.round(rr.width * 10) / 10, h: Math.round(rr.height * 10) / 10, st }; });
      return { box: { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }, html: el.outerHTML.slice(0, 2500), desc };
    }, PROPS);
    const pad = s.pad == null ? 12 : s.pad;
    const f = path.join(out, `${s.id}.png`);
    await p.screenshot({ path: f, clip: { x: Math.max(0, info.box.x - pad), y: Math.max(0, info.box.y - pad), width: Math.min(1400, info.box.w + pad * 2), height: Math.min(900, info.box.h + pad * 2) } });
    res.push({ id: s.id, file: f, ...info });
    if (s.hover) await p.mouse.move(2, 2);
  }
  fs.writeFileSync(path.join(out, 'kit-crop.json'), JSON.stringify(res, null, 1));
  for (const r of res) {
    if (r.error) { console.log(`${r.id}: ${r.error}`); continue; }
    console.log(`\n${r.id} · ${Math.round(r.box.w)}×${Math.round(r.box.h)}`);
    for (const d of r.desc.slice(0, 14)) { const s = d.st; console.log(`${'  '.repeat(d.depth + 1)}${d.tag}.${d.cls.split(' ').filter(Boolean).join('.')}${d.text ? ` "${d.text}"` : ''} ${d.w}×${d.h} · ${s.fontSize} ${s.fontWeight} ${s.fontFamily.split(',')[0]} ls ${s.letterSpacing} ${s.textTransform !== 'none' ? s.textTransform : ''} · ${s.color}${s.backgroundColor !== 'rgba(0, 0, 0, 0)' ? ' bg ' + s.backgroundColor : ''}${s.borderTopWidth !== '0px' ? ` bd ${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}` : ''}${s.boxShadow !== 'none' ? ' sh ' + s.boxShadow : ''} r ${s.borderRadius} p ${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft} gap ${s.gap}`); }
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
