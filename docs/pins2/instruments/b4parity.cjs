// Board 4: Collective against the boards that drew each surface — element by element, every surface in one run.
// Written 2026-09-21 12:53 EDT to replace one-off comparers (elcmp.cjs, g10cmp.cjs, cmp2.cjs): a fix for one board-1 surface
// lands in the shared b1.css, so every run re-measures ALL of them and a regression elsewhere shows up in the same call.
//
// What it reports per surface, pairing elements by their sorted class set (first instance of each):
//   property differences (the P list, plus ::before/::after content and colours) · MISSING / EXTRA elements ·
//   NEST — the element sits under a different chain of classed ancestors · COUNT — how many instances render ·
//   REL — the vertical gap sequence between the root's direct children (spacing a per-element property cannot see).
// What it does NOT see, so a screenshot pair must follow: widths and column edges, icons inside <svg>, hover/focus states,
// text wrapping. Known cases it must reproduce before its output is believed: g8 closes at ~17 differences, every one
// data or state (measured by elcmp.cjs at the 12:34 EDT RECONCILED pass); g10v0 must report NEST for div.pb-same (board 4 drew it outside .pb-cmp).
//
// Run with the kit server on :8900:
//   node docs/pins2/instruments/b4parity.cjs [surface,surface] [--why=<surface>:<css selector>]
const path = require('path'), fs = require('fs'), os = require('os');
const puppeteer = require(path.resolve(__dirname, '../../../node_modules/puppeteer-core'));
const BASE = 'http://127.0.0.1:8900/';
const B1 = BASE + 'docs/superpowers/mockups/2026-09-14-pins2-board/index.html';
const B2 = BASE + 'docs/superpowers/mockups/2026-09-14-pins2-board-2/index.html';
const B4 = BASE + 'docs/pins2/kit/board4.html';
const args = process.argv.slice(2);
const pick = (args.find((a) => !a.startsWith('--')) || '').split(',').filter(Boolean);
const WHY = (args.find((a) => a.startsWith('--why=')) || '').slice(6);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── the surfaces ─────────────────────────────────────────────────────────────────────────────────
// ref: [board url, wait selector, setup(page) run in the page, root selector]; b4: [setup, root].
const gate = (i, v) => `(() => { const g = document.querySelectorAll('section.pb-gate')[${i}]; g.id = 'gate${i}'; g.querySelectorAll('.pb-view').forEach((x) => { x.hidden = x.dataset.view !== '${v}'; }); })()`;
const cmpOpen = (then) => `(async () => {
  const s = document.getElementById('c-compare');
  const f = (w) => [...s.querySelectorAll('button,[role=tab]')].filter((x) => !x.closest('.g-tries')).find((x) => x.textContent.trim().toLowerCase().includes(w));
  // Board 4 round 1: Compare is the panel alone; its head's Empty state offers board 1's weapon pills.
  const e = [...document.querySelectorAll('#c-compare .pb-ctl button')].find((b) => b.textContent === 'Empty'); e && e.click(); await new Promise((r) => setTimeout(r, 1200)); ${then}
})()`;
const SURFACES = {
  g8: {
    ref: [B1, 'aside.drawer', '', 'aside.drawer[aria-label="Post an announcement"] .pb-view[data-view="0"]'],
    b4: [`(async () => {
      const s = document.getElementById('c-broadcast');
      const h = [...s.querySelectorAll('button')].filter((b) => !b.closest('.g-tries')).find((b) => /post announcement/i.test(b.textContent)); h && h.click();
      await new Promise((r) => setTimeout(r, 1500));
      const set = (sel, t) => { const e = document.querySelector(sel); if (!e) return; const d = Object.getOwnPropertyDescriptor(e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set; d.call(e, t); e.dispatchEvent(new Event('input', { bubbles: true })); };
      set('#c-broadcast .drawer.open textarea', '# New Legendary draw is live\\nThe Kilo Bolt-Action draw opens today. Check /draw prices before you spin.'); set('#post-starts', 'in 3 days');
    })()`, '#c-broadcast .drawer.open .dw-b'],
    refRoot: 'aside.drawer[aria-label="Post an announcement"] .pb-view[data-view="0"] .dw-b',
  },
  g9: {
    ref: [B1, 'aside.drawer', '', 'aside.drawer[aria-label="New build"]'],
    // Board 4 round 1 (2026-09-21 15:10 EDT): the drawer is open on the section's own 'Add build' state; no Try opens it any more.
    b4: [`(async () => { const t = [...document.querySelectorAll('#c-new-build .pb-ctl button')].find((b) => b.textContent === 'Add build'); t && t.click(); await new Promise((r) => setTimeout(r, 900)); })()`, '#c-new-build .drawer.open'],
  },
  // Board 4's empty Compare offers board 1's weapon pills; the one-weapon state is the first pill, two weapons adds FFAR 1 through the search.
  g10v0: { ref: [B1, 'aside.drawer', gate(1, 0), '#gate1 .pb-view[data-view="0"]'], b4: [cmpOpen(`const w = (ms) => new Promise((r) => setTimeout(r, ms));
  const pill = (t) => { const b = [...s.querySelectorAll('#compare .pb-sugg button')].find((x) => x.textContent.startsWith(t)); b && b.click(); };
  const add = async (t) => { const i = s.querySelector('#cmp-weapon'); const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; d.call(i, t); i.dispatchEvent(new Event('input', { bubbles: true })); await w(500); const o = [...s.querySelectorAll('#cmp-weapon-list li')].find((x) => x.querySelector('b').textContent === t) || s.querySelector('#cmp-weapon-list li'); o && o.click(); await w(600); }; pill('BAL-27'); await w(700);`), '#c-compare #compare'] },
  g10v1: { ref: [B1, 'aside.drawer', gate(1, 1), '#gate1 .pb-view[data-view="1"]'], b4: [cmpOpen(`const w = (ms) => new Promise((r) => setTimeout(r, ms));
  const pill = (t) => { const b = [...s.querySelectorAll('#compare .pb-sugg button')].find((x) => x.textContent.startsWith(t)); b && b.click(); };
  const add = async (t) => { const i = s.querySelector('#cmp-weapon'); const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; d.call(i, t); i.dispatchEvent(new Event('input', { bubbles: true })); await w(500); const o = [...s.querySelectorAll('#cmp-weapon-list li')].find((x) => x.querySelector('b').textContent === t) || s.querySelector('#cmp-weapon-list li'); o && o.click(); await w(600); }; pill('BAL-27'); await w(700); await add('FFAR 1');`), '#c-compare #compare'] },
  g10v2: { ref: [B1, 'aside.drawer', gate(1, 2), '#gate1 .pb-view[data-view="2"]'], b4: [cmpOpen(`const w = (ms) => new Promise((r) => setTimeout(r, ms));
  const pill = (t) => { const b = [...s.querySelectorAll('#compare .pb-sugg button')].find((x) => x.textContent.startsWith(t)); b && b.click(); };
  const add = async (t) => { const i = s.querySelector('#cmp-weapon'); const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; d.call(i, t); i.dispatchEvent(new Event('input', { bubbles: true })); await w(500); const o = [...s.querySelectorAll('#cmp-weapon-list li')].find((x) => x.querySelector('b').textContent === t) || s.querySelector('#cmp-weapon-list li'); o && o.click(); await w(600); }; await add('DL Q33');`), '#c-compare #compare'] },
  g10v3: { ref: [B1, 'aside.drawer', gate(1, 3), '#gate1 .pb-view[data-view="3"]'], b4: [cmpOpen(''), '#c-compare #compare'] },
};

const P = ['display', 'height', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-bottom', 'gap', 'grid-template-columns',
  'font-size', 'font-weight', 'font-family', 'font-variant-numeric', 'line-height', 'letter-spacing', 'color', 'background-color',
  'border-top-width', 'border-top-style', 'border-top-color', 'border-bottom-width', 'border-bottom-style', 'border-left-width', 'border-radius', 'box-shadow',
  'text-transform', 'text-align', 'vertical-align', 'white-space', 'opacity', 'outline-style'];
const grab = (p, root) => p.evaluate((root, P) => {
  const r = document.querySelector(root); if (!r) return null;
  const key = (c) => { const cls = (c.getAttribute('class') || '').split(/\s+/).filter((x) => x && !/^(b1|sr|open|wide)$/.test(x)).sort().join('.'); return cls ? c.tagName.toLowerCase() + '.' + cls : ''; };
  const out = {}, cnt = {}, chain = {}, text = {};
  r.querySelectorAll('*').forEach((c) => {
    if (c.closest('svg') && c.tagName.toLowerCase() !== 'svg') return;
    if (c.closest('.sr')) return;
    const k = key(c); if (!k) return;
    const cs = getComputedStyle(c); if (cs.display === 'none') return;
    cnt[k] = (cnt[k] || 0) + 1; if (cnt[k] > 1) return;
    const pse = ['::before', '::after'].map((ps) => { const q = getComputedStyle(c, ps); return q.content === 'none' ? 'none' : `${q.content}|${q.backgroundColor}|${q.color}|${q.width}|${q.height}`; });
    out[k] = [...P.map((x) => cs.getPropertyValue(x)), ...pse];
    const up = []; let e = c.parentElement; while (e && e !== r) { const kk = key(e); if (kk) up.push(kk.split('.').slice(1).join('.')); e = e.parentElement; }
    chain[k] = up.join(' < '); text[k] = (c.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
  });
  let prev = null; const rel = [];
  for (const c of r.children) { if (getComputedStyle(c).display === 'none' || c.classList.contains('sr')) continue; const b = c.getBoundingClientRect(); rel.push(`${key(c) || c.tagName.toLowerCase()} +${prev == null ? 0 : Math.round(b.top - prev)} h${Math.round(b.height)}`); prev = b.bottom; }
  return { out, cnt, chain, text, rel };
}, root, P);
const PN = [...P, '::before', '::after'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'b4p-')) });
  const open = async (url, wait) => { const p = await browser.newPage(); await p.setViewport({ width: 1282, height: 1100 }); await p.goto(url, { waitUntil: 'networkidle0' }); if (wait) await p.waitForSelector(wait, { timeout: 20000 }); await sleep(2000); return p; };
  const names = pick.length ? pick : Object.keys(SURFACES);
  for (const name of names) {
    const S = SURFACES[name]; if (!S) { console.log('UNKNOWN surface ' + name); continue; }
    const dbg = (m) => process.env.DBG && console.log(`  · ${name}: ${m}`);
    const r = await open(S.ref[0], S.ref[1]); dbg('ref open'); if (S.ref[2]) await r.evaluate(S.ref[2]); await sleep(300); dbg('ref set');
    const z = await open(B4, '#c-admin'); dbg('b4 open'); await z.evaluate(S.b4[0]); await sleep(1800); dbg('b4 set');
    const refRoot = S.refRoot || S.ref[3];
    const A = await grab(r, refRoot); dbg('ref grabbed'); const Z = await grab(z, S.b4[1]); dbg('b4 grabbed');
    console.log(`\n══ ${name} ══`);
    if (!A || !Z) { console.log(`ROOT MISSING  ref:${!!A}  b4:${!!Z}`); await r.close(); await z.close(); continue; }
    // Captures are pairs.cjs's job (it shoots each board's stage and works); three in-script capture methods here hung or shot the page top.

    const lines = []; let d = 0;
    for (const k of Object.keys(A.out)) {
      if (!Z.out[k]) { lines.push(`MISSING ${k}  (ref in: ${A.chain[k] || 'root'}) "${A.text[k]}"`); continue; }
      if (A.chain[k] !== Z.chain[k]) lines.push(`NEST ${k}: ref ${A.chain[k] || 'root'} | b4 ${Z.chain[k] || 'root'}`);
      if (A.cnt[k] !== Z.cnt[k]) lines.push(`COUNT ${k}: ref ${A.cnt[k]} | b4 ${Z.cnt[k]}`);
      PN.forEach((p, i) => { if (A.out[k][i] !== Z.out[k][i]) { d++; lines.push(`${k.slice(0, 40)} · ${p}: ref ${A.out[k][i].slice(0, 44)} | b4 ${Z.out[k][i].slice(0, 44)}`); } });
    }
    Object.keys(Z.out).forEach((k) => { if (!A.out[k]) lines.push(`EXTRA ${k}  (b4 in: ${Z.chain[k] || 'root'}) "${Z.text[k]}"`); });
    console.log(JSON.stringify({ ref: Object.keys(A.out).length, b4: Object.keys(Z.out).length, propDiffs: d, lines: lines.length }));
    console.log('REL ref: ' + A.rel.join(' · ')); console.log('REL b4:  ' + Z.rel.join(' · '));
    console.log(lines.join('\n'));
    if (WHY && WHY.startsWith(name + ':')) {
      const sel = WHY.slice(name.length + 1);
      console.log(await z.evaluate((sel) => {
        const el = document.querySelector(sel); if (!el) return 'WHY: no element ' + sel;
        const hits = []; let known = 0;
        for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch { continue; }
          const walk = (list) => { for (let i = 0; i < list.length; i++) { const ru = list[i]; if (ru.type !== 1) { if (ru.cssRules) walk(ru.cssRules); continue; } let m = false; try { m = el.matches(ru.selectorText); } catch {} if (m) { known++; hits.push(`${(sh.href || 'inline').split('/').pop()} :: ${ru.selectorText} { ${ru.style.cssText.slice(0, 160)} }`); } } };
          walk(rules); }
        return `WHY ${sel}: ${known} matching rules\n` + hits.join('\n');
      }, sel));
    }
    await r.close(); await z.close();
  }
  await browser.close();
})();
