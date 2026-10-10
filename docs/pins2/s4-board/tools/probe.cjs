// Session 4 · run a measuring function on Board 4 in a given gate and state. Usage: node probe.cjs <gate> <state|-> <click|-> <file-with-function-body.js>
// The file's body runs in the page with `g` = the gate element and returns a JSON-able value.
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
const [, , gate, st, click, file] = process.argv; const body = fs.readFileSync(file, 'utf8');
(async () => {
  const { b, p } = await W.open(); await p.setRequestInterception(true); p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  if (st !== '-') { const ok = await W.setState(p, gate, st); if (!ok) { const acts = await W.actions(p, gate); const t = acts.find((a) => a[2] === st); if (t) await W.act(p, gate, t[0], t[1]); } }
  if (click !== '-') await W.clickReal(p, `#${gate} ${click}`);
  const out = await p.evaluate(new Function('gate', `const g = document.getElementById(gate); ${body}`), gate);
  console.log(JSON.stringify(out, null, 1)); await b.close();
})().catch((e) => { console.error(e); process.exit(2); });
