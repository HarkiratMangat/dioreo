// Session 4 · every setting takes effect (REBUILD.md C9). For each family × place × setting, two renders that differ only in that setting
// (its lowest and highest value, or its first and last option) must differ in the computed style of an element the setting is mapped to.
// A setting whose rule loses to one of Board 4's own `!important` rules paints nothing, and the sample then looks exactly like Board 4:
// fork D's History values did, found 2026-10-02 15:09 EDT while drawing the states strip. The pixel and element checks could not see it,
// because both only ever compare Board 4 with an untouched copy of itself.
// Run:  node local/pins2/s4/work/lead/effect-check.cjs        → one line per fault, a summary, exit 1 on any fault
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const LIVE = path.join(ROOT, 'local/pins2/s4/board/live');
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'ec-')), args: ['--no-first-run'] });
  const p = await b.newPage(); await p.setViewport({ width: 1400, height: 1000 }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.setContent('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Big+Shoulders+Display:wght@500;600;700&display=swap"><div id="out"></div>', { waitUntil: 'networkidle0' });
  for (const f of ['samples.js', 'sample.js', 'core.js']) await p.addScriptTag({ content: fs.readFileSync(path.join(LIVE, f), 'utf8') });
  await p.evaluate(() => document.fonts.ready);
  const res = await p.evaluate(() => {
    const out = { ok: 0, unmapped: [], faults: [] }; const box = document.getElementById('out');
    const kebab = (k) => (k.startsWith('--') ? k : k.replace(/^webkit/, '-webkit').replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()));
    const vars = (s) => { const o = {}; let cur = '', d = 0; const push = () => { const i = cur.indexOf(':'); if (i > 0) o[cur.slice(0, i).trim()] = cur.slice(i + 1).trim(); cur = ''; }; for (const ch of s || '') { if (ch === '(') d++; if (ch === ')') d--; if (ch === ';' && !d) push(); else cur += ch; } if (cur.trim()) push(); return o; };
    const read = (host, m) => { const [base, pse] = m.sel.split('::'); const b0 = base.trim(); const q = b0 === '@surf' ? '[data-fz-surf]' : b0 === ':root' ? '[data-fz~="root"]' : `[data-fz~="root"]:is(${b0}), [data-fz~="root"] :is(${b0})`; return [...host.shadowRoot.querySelectorAll(q)].map((e) => getComputedStyle(e, pse ? '::' + pse : null).getPropertyValue(kebab(m.prop))).join(' | '); };
    const mount = (fz, rules) => { const d = document.createElement('div'); box.appendChild(d); const h = FZS.mount(d, fz, rules); return [d, h]; };
    for (const F of Object.values(BY)) { if (!F.props || !F.props.length || !F.presets || !F.presets.length) continue;
      for (const pr of F.props) { const ends = pr.opts && pr.opts.length ? [pr.opts[0][0], pr.opts[pr.opts.length - 1][0]] : 'min' in pr ? [pr.min, pr.max] : null; if (!ends) { out.unmapped.push(`${F.id} · ${pr.label}: type ${pr.type}, no range or options to test`); continue; } const base = (pr.when && (F.presets.find((q) => pr.when(q.v)) || {}).v) || F.presets[0].v;
        const sa = vars(F.apply({ ...base, [pr.k]: ends[0] }).s), sb = vars(F.apply({ ...base, [pr.k]: ends[1] }).s); const moved = Object.keys({ ...sa, ...sb }).filter((n) => sa[n] !== sb[n]);
        const seenAny = []; let mappedAny = false;
        for (const c of F.ctx || []) { if (!c.fz || !FZS.has(c.fz)) continue; const smp = KIT.samples[c.fz]; const ms = (smp.vars || []).filter((m) => moved.includes(m.name)); if (!ms.length) continue; mappedAny = true;
          const [da, ha] = mount(c.fz, FZS.css(c.fz, F.apply({ ...base, [pr.k]: ends[0] }).s)), [db, hb] = mount(c.fz, FZS.css(c.fz, F.apply({ ...base, [pr.k]: ends[1] }).s));
          const none = ms.filter((m) => !read(ha, m)); if (none.length) out.unmapped.push(`${F.id} · ${pr.label} · ${c.where}: no element for ${none.map((m) => m.sel).join(', ')}`);
          const dead = ms.filter((m) => read(ha, m) && read(ha, m) === read(hb, m)); const live = ms.length - none.length - dead.length; if (!live && !dead.length) { da.remove(); db.remove(); continue; }
          if (!live) out.faults.push(`${F.id} · ${pr.label} · ${c.where}: no mapped property changes (${dead.map((m) => `${m.sel} ${m.prop}=${read(ha, m).slice(0, 40)}`).join('; ').slice(0, 300)})`); else { out.ok++; if (dead.length) seenAny.push(`${c.where}: ${dead.map((m) => m.sel + ' ' + m.prop).join(', ')}`); }
          da.remove(); db.remove(); }
        if (!mappedAny) out.unmapped.push(`${F.id} · ${pr.label}: moves ${moved.join(' ') || 'nothing'}, mapped in no place`);
        if (seenAny.length) out.unmapped.push(`${F.id} · ${pr.label} (partial) — unchanged: ${seenAny.join(' / ').slice(0, 260)}`); } }
    return out; });
  for (const f of res.faults) console.log('FAULT  ' + f);
  for (const u of res.unmapped) console.log('note   ' + u);
  console.log(`${res.ok} setting × place pairs take effect · ${res.faults.length} faults · ${res.unmapped.length} notes${errs.length ? ' · page errors: ' + errs.join(' | ') : ''}`);
  await b.close(); process.exit(res.faults.length || errs.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
