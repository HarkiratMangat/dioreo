// Why C2's drawer fields sit 1px apart (Harkirat, 2026-10-05 11:09 EDT): for each field, its left edge and every box on the way up to the
// drawer that adds a border, padding or margin on the left. Read-only; Builder-2's board on :8900, 1282 × 888.
const path = require('path');
const ROOT = path.resolve(__dirname, '../../../..');
const W = require(path.join(ROOT, 'docs/pins2/final/board4-spec/board4-walk.cjs')); // opens B4_URL in the repo's headless shell
(async () => {
  const { b, p } = await W.open(); await new Promise((r) => setTimeout(r, 1500));
  const out = await p.evaluate(() => {
    const px = (v) => parseFloat(v) || 0;
    const pick = (ph) => [...document.querySelectorAll('input,textarea,button,[role=combobox]')].find((e) => (e.placeholder || e.textContent || '').includes(ph));
    const res = {};
    for (const ph of ['Search weapons', 'Like Close range', 'Paste the code']) {
      const el = pick(ph); if (!el) { res[ph] = 'not found'; continue; }
      const chain = []; let e = el;
      for (let i = 0; e && i < 7; i++, e = e.parentElement) {
        const c = getComputedStyle(e), r = e.getBoundingClientRect();
        chain.push(`${e.tagName.toLowerCase()}.${[...e.classList].join('.')} left ${r.left.toFixed(1)} w ${r.width.toFixed(1)} · border-l ${px(c.borderLeftWidth)} pad-l ${px(c.paddingLeft)} margin-l ${px(c.marginLeft)} outline ${c.outlineWidth} box-shadow ${c.boxShadow === 'none' ? '-' : 'yes'}`);
      }
      res[ph] = chain;
    }
    return res;
  });
  for (const [k, v] of Object.entries(out)) { console.log('== ' + k); console.log(Array.isArray(v) ? v.join('\n') : v); }
  await b.close();
})();
