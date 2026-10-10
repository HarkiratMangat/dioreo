// "5 · The selection bar, whole", the list-open bar only (his 2026-10-08 19:44 EDT: "just this part"): its markup, chain and the builder's geometry rules,
// so the spec page can clone it whole; every button inside with its measured box. Plus the inks behind his question (Set end date vs Never) and the
// Styles section's measured wash and tint fills, named by the page's own namer. Usage: node selbar-probe.cjs → spec-img/board-dom.json "selbar"
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const BASE = 'http://127.0.0.1:8900/docs/pins2/s4-board/'; const OUT = path.join(ROOT, 'docs/pins2/s4-board/spec-img/board-dom.json');
(async () => {
  const b = await puppeteer.launch({ executablePath: (process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'), headless: 'new', protocolTimeout: 240000, userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'sb-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1500, height: 1500 }); await p.evaluateOnNewDocument((s) => { try { localStorage.setItem('bd-state', s); localStorage.setItem('bd-check', '0'); } catch (e) {} }, fs.readFileSync(path.join(__dirname, 'state4/fetch-2026-10-06-1714/builder/state.json'), 'utf8'));
  await p.goto(BASE + 'builder.html', { waitUntil: 'networkidle0', timeout: 120000 }); await p.waitForFunction(() => window.__sxReady, { timeout: 60000 }); await sleep(1500); await p.evaluate(() => { window.__bd.ui.setInspect(false); const h = document.getElementById('bd-host'); if (h) h.style.display = 'none'; });
  /* his screenshot (2026-10-08 19:44 EDT) shows the bar in One table view: switch that bar to it before reading */
  await p.evaluate(() => { const head = [...document.querySelectorAll('h1,h2,h3,h4,h5,b,strong,span,div,p')].find((x) => /^5\s*·\s*The selection bar, whole/.test((x.textContent || '').trim()) && x.children.length < 4 && (x.textContent || '').length < 200); let card = head, bar = null; while (card && card !== document.body) { bar = card.querySelector('.b3-sd'); if (bar) break; card = card.parentElement; }
    const t = bar && [...bar.querySelectorAll('button')].find((x) => x.textContent.trim() === 'One table'); if (t) { t.scrollIntoView({ block: 'center' }); t.click(); } }); await sleep(900);
  const res = await p.evaluate(() => {
    const head = [...document.querySelectorAll('h1,h2,h3,h4,h5,b,strong,span,div,p')].find((x) => /^5\s*·\s*The selection bar, whole/.test((x.textContent || '').trim()) && x.children.length < 4 && (x.textContent || '').length < 200); if (!head) return { err: 'no heading' };
    let card = head; let bar = null; while (card && card !== document.body) { bar = card.querySelector('.b3-sd'); if (bar) break; card = card.parentElement; }
    if (!bar) return { err: 'no bar under the heading', head: head.className };
    const chain = []; let x = bar.parentElement; while (x && x !== document.body) { const at = [...x.attributes].filter((q) => /^data-|^style$/.test(q.name) && !/[\]]/.test(q.value)).map((q) => `[${q.name}=${q.value}]`).join(''); chain.push(x.tagName.toLowerCase() + (x.id ? '#' + x.id : '') + (x.className && typeof x.className === 'string' ? '.' + x.className.trim().split(/\s+/).join('.') : '') + at); x = x.parentElement; }
    const html = bar.outerHTML.replace(/\s(id|for|aria-controls|aria-activedescendant|aria-labelledby|aria-describedby|aria-owns)="[^"]*"/g, '');
    const bd = [], bdvars = {}; const els = [bar, ...bar.querySelectorAll('*')];
    for (const sh of document.styleSheets) { if (sh.href) continue; let rules; try { rules = sh.cssRules; } catch (e) { continue; } for (const r of rules) { if (!r.selectorText || !/#bd-/.test(r.selectorText)) continue; const base = r.selectorText.replace(/::?(before|after)\b/g, ''); let hit = false; try { hit = els.some((y) => y.matches(base)); } catch (e) {} if (!hit) continue; bd.push(r.cssText); for (const m of r.cssText.matchAll(/var\((--bd-[\w-]+)/g)) bdvars[m[1]] = getComputedStyle(bar).getPropertyValue(m[1]).trim() || getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim(); } }
    const r0 = bar.getBoundingClientRect(); const btns = [...bar.querySelectorAll('button')].filter((q) => q.getClientRects().length).map((q) => { const r = q.getBoundingClientRect(); const c = getComputedStyle(q); return { cls: q.className, h: +r.height.toFixed(1), w: +r.width.toFixed(1), r: c.borderTopLeftRadius, text: (q.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24), label: q.getAttribute('aria-label'), row: Boolean(q.closest('.b3-sd-r, tr, li')) }; });
    return { headClass: head.className, path: chain.reverse().join(' > '), html, bd, bdvars, w: +r0.width.toFixed(1), h: +r0.height.toFixed(1), btns, tag: bar.tagName, cls: bar.className };
  });
  if (res.err) { console.log('ERR', JSON.stringify(res)); await b.close(); process.exit(1); }
  const prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); prev.selbar = res; fs.writeFileSync(OUT, JSON.stringify(prev, null, 1));
  console.log('bar', res.tag, res.cls, res.w + '×' + res.h, 'html', res.html.length, 'rules', res.bd.length, 'chain', res.path.slice(-160));
  const seen = {}; for (const q of res.btns) { const k = q.cls + '|' + q.h; seen[k] = seen[k] || { ...q, n: 0 }; seen[k].n++; } for (const q of Object.values(seen)) console.log(`  ${q.cls.padEnd(44)} ×${q.n} ${q.w}×${q.h} r${q.r} ${q.row ? 'in a row' : ''} «${q.text || q.label}»`);
  // his question: the two warn buttons and the Styles section's own wash and tint, named by the spec page's namer
  const q = await b.newPage(); await q.setViewport({ width: 1282, height: 1400 }); await q.goto(BASE + 'spec.html', { waitUntil: 'networkidle0', timeout: 90000 }); await q.waitForFunction(() => window.__specReady, { timeout: 30000 }); await sleep(2500);
  console.log(await q.evaluate(async () => { const F = await fetch('spec-img/spec-facts.json').then((r) => r.json()); const f = F.facts || F; const D = await fetch('spec-img/board-dom.json').then((r) => r.json()); const N = window.__inkName; const out = [];
    for (const k of ['states-wash', 'states-tint', 'states-paint']) { const s = f[k]; if (s) out.push(`${k}: rest fill ${N(s.rest.bg)} · hover fill ${N(s.hover.bg)} · rest ring ${(s.rest.ring || '').slice(0, 70)}`); }
    for (const k of ['button.b3-endbtn', 'button.g-chipbtn']) { const v = D.buttons[k]; out.push(`${k}: rest fill ${N(v.rest.skin.bg)} · hover fill ${N(v.hover.skin.bg)} · rest ring ${v.rest.skin.ring.slice(0, 60)} · words ${v.words} · icon ${v.icon} · pad ${v.padL}/${v.padR} · gap ${v.gap}`); }
    return out.join('\n'); }));
  await b.close();
})().catch((e) => { console.error('selbar-probe FAIL', e.message); process.exit(1); });
