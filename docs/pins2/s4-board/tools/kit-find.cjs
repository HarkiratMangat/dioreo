// Session 4 · where does Board 4: Collective draw a given word? For each text, every element in the kit whose own text is that word,
// with its gate, its class chain and its box, so the Standard board's samples can be checked against the real element.
// Run with repo-static on :8900:  node local/pins2/s4/work/lead/kit-find.cjs "Changes ahead" "Gunsmith code" …
const path = require('path');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs'));
(async () => {
  const { b, p } = await W.open(); await W.sleep(900);
  const texts = process.argv.slice(2);
  const out = await p.evaluate((texts) => texts.map((t) => {
    const want = t.toLowerCase(); const hits = [];
    for (const e of document.querySelectorAll('body *')) {
      const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!own || !own.startsWith(want)) continue;
      const r = e.getBoundingClientRect(); if (r.width < 1) continue;
      const gate = e.closest('[id^="c-"]'); const chain = []; let x = e; for (let i = 0; i < 4 && x; i++, x = x.parentElement) chain.push(x.tagName.toLowerCase() + (x.className && typeof x.className === 'string' ? '.' + x.className.trim().split(/\s+/).join('.') : ''));
      hits.push({ gate: gate ? gate.id : '-', chain: chain.join(' < '), box: [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)] });
    }
    return { t, hits: hits.slice(0, 6) };
  }), texts);
  for (const o of out) { console.log(`"${o.t}" · ${o.hits.length} hit(s)`); for (const h of o.hits) console.log(`   ${h.gate} · ${h.chain} · ${h.box.join(',')}`); }
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
