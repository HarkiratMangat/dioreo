// Session 4 · before a state goes into portal/fixtures/states, find what its steps actually produce: load the realm, list the visible
// classes, run the steps the way scripts/portalStates.mjs runs them, list again, print what appeared. The registry's `expect` must name
// something that appears ONLY after the steps (.claude/rules/portal-editing.md, "Registering a portal state").
// Run with the harness on :8901:  node local/pins2/s4/work/lead/probe-states.cjs [realm]
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const C = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidates.json'), 'utf8'));
const only = process.argv[2];
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'probe-')), args: ['--no-first-run'] });
  const page = await b.newPage(); await page.setViewport({ width: 1282, height: 888 });
  const snap = () => page.evaluate(() => { const m = new Map(); for (const e of document.querySelectorAll('body *')) { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue; for (const c of e.classList) { const k = e.tagName.toLowerCase() + '.' + c; m.set(k, (m.get(k) || 0) + 1); } } return [...m.entries()]; });
  const out = [];
  for (const c of C.filter((x) => !only || x.realm === only)) {
    const q = new URLSearchParams({ fresh: '1', ...(c.flags || {}), b: String(Date.now()) });
    try {
      await page.goto(`http://127.0.0.1:8901/harness.html?${q}#/${c.realm}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await page.evaluate(() => document.fonts.ready); await new Promise((r) => setTimeout(r, 900));
      const before = new Map(await snap()); const preGuess = c.expect ? !!(await page.$(c.expect)) : null;
      for (const st of c.steps || []) {
        if (st.key) await page.evaluate((k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k.key, metaKey: !!k.meta, bubbles: true })), st);
        if (st.click) { await page.waitForSelector(st.click, { timeout: 6000 }).catch(() => {}); await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.click(); }, st.click); }
        if (st.clickText) await page.evaluate((s) => { const el = [...document.querySelectorAll(s.sel)].find((x) => (x.textContent || '').includes(s.text)); if (el) el.click(); }, st.clickText);
        if (st.hover) { await page.waitForSelector(st.hover, { timeout: 6000 }).catch(() => {}); await page.hover(st.hover).catch(() => {}); }
        if (st.type) { const t = st.type; await page.waitForSelector(t.sel, { timeout: 6000 }).catch(() => {}); await page.evaluate((s) => { const el = document.querySelector(s.sel); if (el) { el.value = s.text; el.dispatchEvent(new Event('input', { bubbles: true })); } }, t); }
        await new Promise((r) => setTimeout(r, st.waitMs === undefined ? 450 : st.waitMs));
      }
      const after = await snap(); const fresh = after.filter(([k, n]) => !before.has(k)).sort((a, z) => z[1] - a[1]).slice(0, 14).map(([k, n]) => `${k}×${n}`);
      const postGuess = c.expect ? !!(await page.$(c.expect)) : null;
      out.push({ name: c.name, realm: c.realm, fresh, guess: c.expect || '', pre: preGuess, post: postGuess });
    } catch (e) { out.push({ name: c.name, realm: c.realm, error: e.message.slice(0, 120) }); }
  }
  await b.close();
  fs.writeFileSync(path.join(__dirname, 'probe-states.json'), JSON.stringify(out, null, 1));
  for (const o of out) console.log(`${o.realm} · ${o.name}${o.error ? ' · ERROR ' + o.error : ''}\n   guess ${o.guess || '—'} pre=${o.pre} post=${o.post}\n   new: ${(o.fresh || []).join(' ')}`);
})().catch((e) => { console.error(e); process.exit(2); });
