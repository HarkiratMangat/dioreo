// What hover, press and keyboard focus really change on each of C1's buttons (2026-10-06 19:54 EDT). The container's own reading applies the
// kit's :hover/:active/:focus-visible rules to a button with marker classes; a parity check against a real pointer disagreed on 10 of 28
// (JS-driven hovers, rules it over-applied), so the state rows come from here: builder.html with his saved state, a real mouse over each
// button in the container, a real press (the pointer leaves before release, so nothing is clicked), and keyboard focus after a key press.
// Output: builder-2/b4/c1-states.js (window.C1_STATES[n] = { hover, press, focus }, each the container's own wording of the change).
const path = require('path'), fs = require('fs'), os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const STATE = process.env.STATE || path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json');
const OUTF = path.join(ROOT, 'docs/pins2/s4-board/b4/c1-states.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 600000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'c1st-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888, deviceScaleFactor: 1 });
  const st = fs.readFileSync(STATE, 'utf8'); await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, st);
  await p.goto('http://127.0.0.1:8900/docs/pins2/s4-board/builder.html', { waitUntil: 'networkidle0', timeout: 90000 });
  await p.waitForFunction(() => window.__sxReady && window.__sx, { timeout: 60000 }); await p.evaluate(() => document.fonts.ready); await sleep(1000);
  await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
  const ns = await p.evaluate(() => window.__sx.TYPES.map((t) => t.n));
  const only = (process.env.ONLYN || '').split(',').filter(Boolean).map(Number); if (only.length) ns.splice(0, ns.length, ...ns.filter((n) => only.includes(n))); // ONLYN=11,12 measures just those (and then writes only them: never use it for the real file)
  const out = {}; const log = [];
  for (const n of ns) {
    // each state starts from a fresh find (and, for the problem card, a re-opened card): the card closes as soon as focus or the pointer leaves it
    const prep = () => p.evaluate((n) => { const X = window.__sx; const T = X.TYPES.find((t) => t.n === n); if (T.in === 'pc' && !X.pc.querySelector('.b3-pc-open')) { const c = X.pc.querySelector('.b3-fchip'); if (c) c.click(); }
      return new Promise((res) => { let k = 0; const tick = () => { const root = X.rootOf(T.n); const el = root && X.find(root, T).find((e) => e.getClientRects().length); if (!el && k++ < 12) return setTimeout(tick, 150); if (!el) return res(null); for (const e of document.querySelectorAll('[data-sx-st]')) e.removeAttribute('data-sx-st'); el.setAttribute('data-sx-st', '');
        el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); let home = { x: 1, y: 1 };
        if (T.in === 'pc') { const c = X.pc.querySelector('.b3-pc'); if (c) { const q = c.getBoundingClientRect(); home = { x: q.left + 24, y: q.top + 40 }; } }
        res({ name: T.name, x: r.left + r.width / 2, y: r.top + r.height / 2, under: !!top && (top === el || el.contains(top)), home }); }; setTimeout(tick, 300); }); }, n);
    const look = () => p.evaluate(() => { const el = document.querySelector('[data-sx-st]'); return el && el.isConnected ? window.__sx.look(el) : null; });
    const diff = (a, z) => p.evaluate((a, z) => window.__sx.changes(a, z), a, z);
    process.stderr.write(`· ${n} `); let q = await prep(); if (!q) { log.push(`${n}: not found`); continue; }
    await p.mouse.move(q.home.x, q.home.y); await sleep(450); const rest = await look();
    q = await prep() || q; await p.mouse.move(q.x, q.y); await sleep(480); const hov = await look();
    q = await prep() || q; await p.mouse.move(q.x, q.y); await sleep(200); await p.mouse.down(); await sleep(220); const prs = await look(); await p.mouse.move(q.home.x, q.home.y); await sleep(40); await p.mouse.up(); await sleep(450);
    q = await prep() || q; await p.mouse.move(q.home.x, q.home.y); await p.keyboard.press('Shift'); await p.evaluate(() => { const el = document.querySelector('[data-sx-st]'); if (el) el.focus({ preventScroll: true }); }); await sleep(450); const foc = await look();
    await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); }); await sleep(150);
    if (!rest || !hov || !prs || !foc) { log.push(`${n} ${q.name}: lost the button mid-way (${[!rest && 'rest', !hov && 'hover', !prs && 'press', !foc && 'focus'].filter(Boolean).join(', ')})`); continue; }
    out[n] = { hover: await diff(rest, hov), press: await diff(rest, prs), focus: await diff(rest, foc), covered: !q.under };
    log.push(`${n} ${q.name}${q.under ? '' : ' (COVERED at its centre)'}: hover ${/no change/.test(out[n].hover) ? 'none' : 'yes'} · press ${/no change/.test(out[n].press) ? 'none' : 'yes'} · focus ${/no change/.test(out[n].focus) ? 'none' : 'yes'}`);
  }
  const at = new Date().toLocaleString('en-CA', { timeZone: 'America/New_York', hour12: false }).replace(',', '').slice(0, 16) + ' EDT';
  if (!only.length) fs.writeFileSync(OUTF, `// generated by work/lead/c1-states.cjs at ${at}: what a real pointer and keyboard change on each C1 button in the container. Rerun it, never edit by hand.\nwindow.C1_STATES = ${JSON.stringify(out)};\n`);
  console.log(log.join('\n')); console.log('wrote', Object.keys(out).length, 'of', ns.length); await b.close();
})().catch((e) => { console.error('c1-states FAIL', e.message); process.exit(1); });
