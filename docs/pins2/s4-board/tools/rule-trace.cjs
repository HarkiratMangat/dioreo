// 2026-10-10 21:08 EDT: which CSS rules set a button's fill and outline at rest and under :hover (forced through CDP), standards mode. Usage: node rule-trace.cjs '<css selector>'
const path = require('path'), fs = require('fs'), os = require('os'); const ROOT = path.resolve(__dirname, '../../../..'); const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const PAGE = path.join(ROOT, 'docs/pins2/s4-board/spec.html'); const URL = 'http://127.0.0.1:8900/docs/pins2/s4-board/spec.html'; const SEL = process.argv[2];
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'rt-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1282, height: 888 }); await p.setRequestInterception(true);
  p.on('request', (r) => { if (r.url() === URL) r.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><html><head><meta charset=utf8></head><body>' + fs.readFileSync(PAGE, 'utf8') + '</body></html>' }); else r.continue(); });
  await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(4000);
  const c = await p.target().createCDPSession(); await c.send('DOM.enable'); await c.send('CSS.enable');
  const { root } = await c.send('DOM.getDocument', { depth: -1 }); const { nodeId } = await c.send('DOM.querySelector', { nodeId: root.nodeId, selector: SEL }); if (!nodeId) { console.log('no node'); process.exit(1); }
  for (const st of [[], ['hover']]) { await c.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: st });
    const m = await c.send('CSS.getMatchedStylesForNode', { nodeId }); const cs = await c.send('CSS.getComputedStyleForNode', { nodeId });
    const g = (n) => (cs.computedStyle.find((x) => x.name === n) || {}).value; console.log(`== ${st[0] || 'rest'}: bg ${g('background-color')} · shadow ${g('box-shadow')} · border ${g('border-top-color')} · color ${g('color')}`);
    for (const r of m.matchedCSSRules.slice().reverse()) { const props = r.rule.style.cssProperties.filter((x) => /^(background|background-color|box-shadow|border|border-color|color|transition)$/.test(x.name) && x.value); if (!props.length) continue;
      console.log('  ' + r.rule.selectorList.text.slice(0, 150) + '  →  ' + props.map((x) => `${x.name}: ${x.value.slice(0, 60)}${x.important ? ' !' : ''}`).join(' ; ')); } }
  await b.close();
})();
