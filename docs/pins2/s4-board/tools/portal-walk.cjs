// Session 4 · the portal's half of the element board: every view of the portal as it is today (the fixture harness), walked the way
// scripts/portalCensus.cjs walks it — each realm at rest, each state registered in portal/fixtures/states/*.json (shell.json's states on the
// realm they open on), and each view on the realm's own switch. Harkirat, 2026-10-02 19:09 EDT: "1 round" — every element of the whole
// portal goes on one board. Board 4 is the design for the Armory, Broadcast and History, so on those three realms only the portal's
// FRAME (top bar, rail, masthead) is taken; every other realm is taken whole.
// Exports the walk (views, load, replay) for el-capture-portal.cjs; run directly it writes diff/dump-portal.json in diff-census.cjs's shape.
// Run with the harness on :8901 (.claude/launch.json → portal-harness, after the portal build):  node local/pins2/s4/work/lead/portal-walk.cjs
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const BASE = 'http://127.0.0.1:8901/harness.html'; const REG = path.join(ROOT, 'portal', 'fixtures', 'states');
const WHOLE = ['home', 'season', 'access', 'review', 'analytics']; const FRAME_ONLY = ['armory', 'broadcast', 'history'];
const SCOPE = (realm) => (FRAME_ONLY.includes(realm) ? '.app > header, .app > nav.rail, main .masthead' : 'body > *:not(script):not(style)');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function views() {
  const out = [];
  const shell = JSON.parse(fs.readFileSync(path.join(REG, 'shell.json'), 'utf8')).states || [];
  for (const realm of [...WHOLE, ...FRAME_ONLY]) {
    out.push({ src: 'portal', g: realm, id: realm, kind: 'rest', label: 'resting', scope: SCOPE(realm) });
    const f = path.join(REG, `${realm}.json`); const reg = [...(fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).states || [] : []), ...shell.filter((s) => (s.realm || 'home') === realm)];
    for (const st of reg) out.push({ src: 'portal', g: realm, id: realm, kind: 'state', label: st.name, flags: st.flags, steps: st.steps, scope: SCOPE(realm) });
  }
  return out;
}
async function open() {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'pw-')), args: ['--no-first-run'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e))); await p.setViewport({ width: 1282, height: 888 }); return { b, p, errs };
}
async function load(p, realm, flags) { const q = new URLSearchParams({ fresh: '1', ...(flags || {}), b: String(Date.now()) }); await p.goto(`${BASE}?${q}#/${realm}`, { waitUntil: 'networkidle0' }); await p.evaluate(() => document.fonts.ready); await sleep(900); }
async function runSteps(p, steps) {
  for (const st of steps || []) {
    if (st.click) await p.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, st.click);
    if (st.clickText) await p.evaluate((s) => { const e = [...document.querySelectorAll(s.sel)].find((x) => (x.textContent || '').includes(s.text)); if (e) e.click(); }, st.clickText);
    if (st.key) await p.evaluate((k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k.key, metaKey: !!k.meta, bubbles: true })), st);
    if (st.hover) await p.hover(st.hover).catch(() => {});
    if (st.type) { const [sel, text] = Array.isArray(st.type) ? st.type : [st.type.sel, st.type.text]; await p.evaluate((s, t) => { const e = document.querySelector(s); if (e) { e.focus(); e.value = t; e.dispatchEvent(new Event('input', { bubbles: true })); } }, sel, text); }
    await sleep(st.wait || 400);
  }
}
async function replay(p, v) { await load(p, v.g, v.flags); await runSteps(p, v.steps); if (v.tab) { await p.evaluate((w) => { const e = [...document.querySelectorAll('main [role=tab]')].find((x) => x.textContent.trim() === w); if (e) e.click(); }, v.tab); await sleep(500); } }
module.exports = { views, open, load, runSteps, replay, SCOPE, WHOLE, FRAME_ONLY };
if (require.main === module) (async () => {
  const PROPS = require(path.join(__dirname, 'diff-census.cjs.props.json'));
  const MEASURE = fs.readFileSync(path.join(__dirname, 'diff-measure.js'), 'utf8');
  const { b, p, errs } = await open(); const list = views(); const done = [];
  // every view on a realm's own switch, read from a fresh load, as portalCensus.cjs does
  for (const realm of WHOLE) { await load(p, realm); const tabs = await p.evaluate(() => [...new Set([...document.querySelectorAll('main [role=tab]')].map((t) => t.textContent.trim()).filter(Boolean))]);
    for (const t of tabs.slice(0, 8)) list.push({ src: 'portal', g: realm, id: realm, kind: 'tab', label: `view ${t}`, tab: t, scope: SCOPE(realm) }); }
  for (const v of list) {
    await replay(p, v); await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}' }); await sleep(150);
    v.els = await p.evaluate(`(${MEASURE})(${JSON.stringify({ kind: 'pop', sel: v.scope })}, ${JSON.stringify(PROPS.props)}, ${JSON.stringify(PROPS.color)})`);
    done.push(v); console.log(`${v.g} · ${v.kind} ${v.label}: ${v.els.length} elements`);
  }
  fs.writeFileSync(path.join(__dirname, 'diff', 'dump-portal.json'), JSON.stringify({ when: new Date().toISOString(), props: PROPS.props, views: done, errs }));
  console.log(`views ${done.length} · elements ${done.reduce((n, v) => n + v.els.length, 0)} · page errors ${errs.length}`);
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
