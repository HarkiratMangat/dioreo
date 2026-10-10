// Session 4 · use the board the way Harkirat will, on fork A at 1280×834, and check each step did what it says (FINAL-DIRECTION.md):
// hover a row → every surface previews it; leave → back; Pick → it sticks; Before/After on one surface; Blink alternates; B blinks all;
// scroll the table away → the pick bar appears and its buttons preview too; a setting changed → the mix row appears and every surface
// takes it. Screenshots of each step go to <outdir>.  Run with repo-static on :8900: node local/pins2/s4/work/lead/board-use.cjs <outdir>
const path = require('path'); const fs = require('fs'); const os = require('os');
const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'use-')) });
  const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message)); await p.setRequestInterception(true);
  p.on('request', (r) => { if (/\/board\/live\/index\.html/.test(r.url())) r.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8">' + fs.readFileSync(path.join(ROOT, 'local/pins2/s4/board/live/index.html'), 'utf8') }); else r.continue(); });
  await p.setViewport({ width: 1280, height: 834, deviceScaleFactor: 2 }); await p.goto('http://127.0.0.1:8900/local/pins2/s4/board/live/index.html#A', { waitUntil: 'networkidle0' });
  await p.evaluate(async () => { try { localStorage.clear(); } catch (e) {} S.f = {}; go('A'); await document.fonts.ready; });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const frames = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  // what each surface shows: which layer is on, and the label-column width that layer draws (fork A's first setting)
  const look = () => p.evaluate(() => V.S.map((sf) => { const bd = sf.bands[0]; const on = bd.L.findIndex((l) => l.classList.contains('on')); const h = bd.L[on].querySelector('.fz-host'); const lab = h.shadowRoot.querySelector('[data-fz~="root"] .mlabel'); return `${sf.name}: ${on ? 'after' : 'before'} ${Math.round(lab.getBoundingClientRect().width)}px · ${sf.el.querySelector('.sf-c').textContent.trim() || '—'}`; }).join(' | '));
  const log = []; const step = async (name, shot) => { await frames(); log.push(`${name}\n   ${await look()}`); if (shot) await p.screenshot({ path: path.join(out, shot + '.png') }); };
  await step('1 nothing picked', 'u1');
  const row = async (id) => { const r = await p.$(`#dt .nmc[data-row="${id}"]`); await r.hover(); };
  await row('A2'); await step('2 hover History’s row (preview)', 'u2');
  await p.mouse.move(5, 400); await step('3 pointer leaves the table');
  await p.click('#dt [data-pre="A1"]'); await p.mouse.move(5, 400); await step('4 Pick the Armory’s', 'u4');
  await p.click('[data-sv="1:before"]'); await step('5 History · Before');
  await p.click('[data-sv="1:after"]'); await step('6 History · After');
  await p.click('[data-sblink="1"]'); await wait(820); await step('7 History · Blink, 0.8 s later'); await wait(760); await step('8 … 1.6 s later'); await p.click('[data-sblink="1"]');
  await p.keyboard.press('b'); await wait(820); await step('9 B: every changed surface blinks'); await p.keyboard.press('b');
  await p.evaluate(() => window.scrollTo(0, 700)); await wait(150); log.push(`10 A scrolled (page ${await p.evaluate(() => document.documentElement.scrollHeight)}px, table still in view): pick bar ${await p.evaluate(() => ($('#pb').hidden ? 'hidden' : 'shown'))}`);
  try { const pbb = await p.$('#pb [data-row="A2"]'); await pbb.hover(); await step('11 hover History’s in the pick bar', 'u11'); await p.mouse.move(5, 830); } catch (e) { log.push('11 pick bar button not hoverable: ' + e.message.slice(0, 80) + ' · ' + await p.evaluate(() => { const pb = $('#pb'); const r = pb.getBoundingClientRect(); return `pb hidden=${pb.hidden} display=${getComputedStyle(pb).display} rect ${Math.round(r.top)},${Math.round(r.height)} buttons ${pb.children.length}`; })); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.evaluate(() => setV('colw', 80)); await step('12 a setting moved: column width 80', 'u12');
  log.push(`13 table rows: ${await p.evaluate(() => $$('#dt .nmc').map((c) => c.textContent.trim()).join(' / '))}`);
  // a long family: the table scrolls away, the pick bar takes over and previews like the table
  await p.evaluate(async () => { go('R'); await new Promise((r) => setTimeout(r, 300)); window.scrollTo(0, document.documentElement.scrollHeight); }); await wait(200);
  log.push(`14 R scrolled to the end: pick bar ${await p.evaluate(() => ($('#pb').hidden ? 'hidden' : 'shown: ' + [...$('#pb').children].map((b) => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? ' (on)' : '')).join(' | ')))}`);
  try { await (await p.$('#pb [data-row="R2"]')).hover(); await frames(); log.push(`15 hover Broadcast’s in the bar: ${await p.evaluate(() => V.S.map((sf) => sf.name + ' ' + (sf.bands[0].L[1].classList.contains('on') ? 'after' : 'before')).join(' | '))}`); await p.screenshot({ path: path.join(out, 'u15.png') }); } catch (e) { log.push('15 pick bar: ' + e.message.slice(0, 80)); }
  console.log(log.join('\n')); console.log('errors', errs.join(' | ') || 'none'); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
