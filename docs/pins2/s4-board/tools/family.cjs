// Session 4 · Step 4b — the control family, measured on Board 4: every LABEL that keys a group of controls, and every control in
// that group (chip, segmented button, readout), read with getComputedStyle and getBoundingClientRect, per gate and state.
// Written 2026-10-01 21:02 EDT. Output: local/pins2/s4/work/lead/family.json + family.md
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const PLAN = [ // gate id, state or try label (null = rest)
  ['c-manifest', null], ['c-manifest', 'Pick three'], ['c-new-build', null], ['c-compare', 'Two weapons'], ['c-repairs', null], ['c-export', 'Picker'],
  ['c-queue', null], ['c-broadcast', 'Saved'], ['c-broadcast', 'Posting'], ['c-history', null], ['c-admin', null],
];
(async () => {
  const { b, p, errs } = await W.open(); await p.setRequestInterception(true);
  p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  const out = [];
  for (const [id, st] of PLAN) {
    await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await W.sleep(900);
    if (st) { const ok = await W.setState(p, id, st); if (!ok) { const acts = await W.actions(p, id); const t = acts.find((a) => a[2] === st); if (t) await W.act(p, id, t[0], t[1]); } }
    const groups = await p.evaluate((id) => {
      const g = document.getElementById(id); const res = [];
      const CTL = 'button, [role=radio], [role=tab], [role=button], .chip, .b3-fc, label.chip';
      const px = (v) => Math.round(parseFloat(v) * 100) / 100;
      const ctlInfo = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        const kids = [...e.children].map((k) => { const kr = k.getBoundingClientRect(); const kc = getComputedStyle(k); return { tag: k.tagName.toLowerCase(), cls: k.getAttribute('class') || '', w: px(kr.width), h: px(kr.height), x: px(kr.left - r.left), fs: px(kc.fontSize), fw: kc.fontWeight, ff: kc.fontFamily.split(',')[0].replace(/"/g, ''), ls: kc.letterSpacing, col: kc.color, text: (k.textContent || '').trim().slice(0, 16) }; });
        return { tag: e.tagName.toLowerCase(), cls: e.getAttribute('class') || '', text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30), pressed: e.getAttribute('aria-pressed') || e.getAttribute('aria-checked') || e.getAttribute('aria-selected') || '',
          x: px(r.left), y: px(r.top), w: px(r.width), h: px(r.height), pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px).join(' '), gap: cs.gap, rad: cs.borderTopLeftRadius,
          fs: px(cs.fontSize), fw: cs.fontWeight, ff: cs.fontFamily.split(',')[0].replace(/"/g, ''), ls: cs.letterSpacing, tt: cs.textTransform, bg: cs.backgroundColor, shadow: cs.boxShadow.slice(0, 80), bw: cs.borderTopWidth, col: cs.color, kids }; };
      for (const el of g.querySelectorAll('*')) {
        if (el.closest('.pb-head, .pb-new, .b4-try, .b4-forks, .pb-ctl')) continue;
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
        if (!own || own.length > 24 || el.matches(CTL) || el.closest(CTL)) continue;
        const fs0 = parseFloat(cs.fontSize); const lsPx = parseFloat(cs.letterSpacing) || 0;
        if (!(cs.textTransform === 'uppercase' || /^[A-Z0-9 &·/]+$/.test(own)) || fs0 > 12) continue;
        // its controls: the next element sibling (or the parent's next) that holds controls
        let sib = el.nextElementSibling; let ctls = sib ? (sib.matches(CTL) ? [sib, ...[...el.parentElement.children].filter((x) => x !== sib && x.matches(CTL))] : [...sib.querySelectorAll(CTL)]) : [];
        if (!ctls.length) { const pe = el.parentElement; ctls = pe ? [...pe.querySelectorAll(CTL)].filter((x) => !x.contains(el)) : []; }
        ctls = ctls.filter((x) => x.getBoundingClientRect().width > 1).slice(0, 12);
        if (!ctls.length) continue;
        const r = el.getBoundingClientRect(); const c0 = ctls[0].getBoundingClientRect();
        res.push({ label: own, sel: el.tagName.toLowerCase() + '.' + (el.getAttribute('class') || '').trim().split(/\s+/).join('.'), parent: (el.parentElement.getAttribute('class') || '').split(' ')[0],
          fs: px(cs.fontSize), lsPx: px(lsPx), lsEm: Math.round(lsPx / fs0 * 1000) / 1000, fw: cs.fontWeight, ff: cs.fontFamily.split(',')[0].replace(/"/g, ''), col: cs.color, tt: cs.textTransform,
          gapToCtl: px(c0.left - r.right), dyCentre: px((c0.top + c0.height / 2) - (r.top + r.height / 2)), ctls: ctls.map(ctlInfo) });
      }
      return res;
    }, id);
    out.push({ id, st, groups });
  }
  await b.close();
  fs.writeFileSync(path.join(__dirname, 'family.json'), JSON.stringify({ at: new Date().toISOString(), errs, out }, null, 1));
  const md = ['# Control family — labels and their control groups on Board 4', ''];
  for (const o of out) { md.push(`## ${o.id} · ${o.st || 'rest'} — ${o.groups.length} label groups`, '', '| Label | Label type | Gap → | Δ centre | Controls (h · pad · gap · radius · type) |', '|---|---|---|---|---|');
    for (const gq of o.groups) { const c = gq.ctls; const gaps = c.slice(1).map((x, i) => Math.round((x.x - (c[i].x + c[i].w)) * 10) / 10);
      md.push(`| ${gq.label} \`${gq.sel.slice(0, 30)}\` | ${gq.fs}px ${gq.fw} ${gq.ff} · ls ${gq.lsPx}px (${gq.lsEm}em) | ${gq.gapToCtl} | ${gq.dyCentre} | ${c.length}× \`${c[0].cls.slice(0, 28)}\` h ${[...new Set(c.map((x) => x.h))].join('/')} · pad ${[...new Set(c.map((x) => x.pad))].join(' / ')} · gaps ${[...new Set(gaps)].join('/')} · r ${c[0].rad} · ${c[0].fs}px ${c[0].fw} ${c[0].tt} |`); }
    md.push(''); }
  fs.writeFileSync(path.join(__dirname, 'family.md'), md.join('\n'));
  console.log(JSON.stringify({ passes: out.length, groups: out.reduce((s, o) => s + o.groups.length, 0), errs: errs.length }));
})().catch((e) => { console.error(e); process.exit(2); });
