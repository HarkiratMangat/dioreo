// v11.1 sweep — every state of the v11 build that no earlier render showed, plus three probes that find a CLASS rather than an instance:
//   CUT    any visible element whose text is clipped (overflow hidden / ellipsis and scrollWidth > clientWidth), by class
//   CBHOV  every control that holds a checkbox: hovered AWAY from the box, does the box answer? (his catch on the badge chip)
//   FOCUS  every new control (f-*, bk-*, cx-*) forced into :focus-visible through CDP: does anything visible change?
const path = require('path'), fs = require('fs'), os = require('os');
const puppeteer = require(path.resolve(__dirname, '../../../node_modules/puppeteer-core'));
const OUT = path.join(os.tmpdir(), 'board4-r20'); fs.mkdirSync(OUT, { recursive: true });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'r20-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1100 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.setRequestInterception(true); p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  await p.goto('http://127.0.0.1:8900/docs/pins2/kit/board4.html', { waitUntil: 'networkidle0' }); await w(1500);
  await p.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation-duration:0s!important}' });
  const click = (sel, label) => p.evaluate((sel, label) => { const x = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim() === label); if (x) x.click(); return !!x; }, sel, label);
  const st = async (sec, l) => { if (!(await click(`#${sec} .pb-ctl button`, l))) console.log('NO STATE', sec, l); await w(1400); };
  const fk = async (sec, l) => { if (!(await click(`#${sec} .b4-forks button`, l))) console.log('NO FORK', sec, l); await w(500); };
  const shot = async (sel, name) => { const el = await p.$(sel); if (!el) return console.log('MISSING', name, sel); await el.evaluate((e) => e.scrollIntoView({ block: 'center' })); await w(250); await el.screenshot({ path: path.join(OUT, name + '.png') }); };
  const body = (bottom) => p.evaluate((bt) => { const d = document.querySelector('#c-new-build .drawer .dw-b'); if (d) d.scrollTop = bt ? d.scrollHeight : 0; }, bottom);
  const cut = (tag) => p.evaluate((tag) => { const out = new Map();
    document.querySelectorAll('#board *').forEach((e) => { if (!e.offsetParent || e.closest('.sr, .cx-ghost, .b4-ghostcard, .pb-new, .pb-head')) return; const cs = getComputedStyle(e);
      const clips = cs.overflowX === 'hidden' || cs.overflowX === 'clip' || cs.textOverflow === 'ellipsis'; if (!clips) return;
      const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || e.children.length === 0; if (!own) return;
      if (e.scrollWidth > e.clientWidth + 1 && e.textContent.trim()) { const k = (e.closest('section.pb-gate') || {}).id + ' ' + e.tagName.toLowerCase() + '.' + [...e.classList].join('.'); if (!out.has(k)) out.set(k, e.textContent.trim().slice(0, 30)); } });
    return [...out.entries()].map(([k, v]) => `${tag} ${k} «${v}»`); }, tag);
  const CUT = [];

  // ── FORM, each option: the image well's three sources, the stored-key list, a used key, the rank rows, three cards ──
  for (const [fl, f] of [['A · Instrument', 'a'], ['B · Spec sheet', 'b'], ['C · Code first', 'c']]) {
    await st('c-new-build', 'Add build'); await fk('c-new-build', fl); await st('c-new-build', 'Add · filled');
    await body(true); await w(300);
    await shot('#c-new-build .f-sec[data-s=image]', `form-${f}-img-upload`);
    await p.evaluate(() => { const x = [...document.querySelectorAll('#c-new-build .f-src button')].find((e) => e.textContent.trim() === 'Link'); if (x) x.click(); }); await w(300);
    await p.evaluate(() => { const i = document.querySelector('#c-new-build .f-media input'); if (i) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'https://res.cloudinary.com/dr6dn61eh/image/upload/v1/BAL-27-1.png'); i.dispatchEvent(new Event('input', { bubbles: true })); } }); await w(300);
    await w(1500); await shot('#c-new-build .f-sec[data-s=image]', `form-${f}-img-link`);
    await p.evaluate(() => { const x = [...document.querySelectorAll('#c-new-build .f-src button')].find((e) => e.textContent.trim() === 'Stored image'); if (x) x.click(); }); await w(300);
    const key = await p.$('#c-new-build .f-media .f-pick input'); if (key) { await key.click(); await w(400); await shot('#c-new-build .f-sec[data-s=image]', `form-${f}-img-keylist`);
      const m = await p.$('#c-new-build .f-menu'); if (m) await m.screenshot({ path: path.join(OUT, `form-${f}-img-keymenu.png`) });
      await p.keyboard.type('BAL-27-2'); await w(300); await p.keyboard.press('Enter'); await w(300); await shot('#c-new-build .f-sec[data-s=image]', `form-${f}-img-used`); }
    await shot('#c-new-build .f-sec[data-s=rank]', `form-${f}-rank`);
    CUT.push(...await cut(`form-${f}`));
    await st('c-new-build', 'Add · three'); await body(true); await w(300);
    await shot('#c-new-build .drawer', `form-${f}-three-bottom`);
    await p.evaluate(() => { const c = [...document.querySelectorAll('#c-new-build .f-card')][2]; if (c) c.scrollIntoView({ block: 'start' }); }); await w(300);
    await shot('#c-new-build .drawer', `form-${f}-three-dmz`);
    CUT.push(...await cut(`form-${f}-three`));
  }
  // ── BULK, options B and C in the outcomes not yet seen ──
  for (const [fl, f] of [['B · Margin notes', 'b'], ['C · Preview stack', 'c']]) {
    await fk('c-new-build', 'A · Instrument'); await fk('c-new-build', fl);
    for (const [l, n] of [['Bulk · warning', 'warn'], ['Bulk · can’t read', 'bad'], ['Bulk · duplicate', 'dup'], ['Bulk · pasted', 'paste']]) { await st('c-new-build', l); await body(false); await shot('#c-new-build .drawer', `bulk-${f}-${n}`); CUT.push(...await cut(`bulk-${f}-${n}`)); }
  }
  await fk('c-new-build', 'A · Ledger');
  for (const [l, n] of [['Bulk · warning', 'warn'], ['Bulk · can’t read', 'bad'], ['Bulk · duplicate', 'dup'], ['Bulk · pasted', 'paste']]) { await st('c-new-build', l); CUT.push(...await cut(`bulk-a-${n}`)); }
  // ── COMPARE: B and C with two weapons, hovered; the empty and one-build options not yet seen ──
  for (const [fl, f] of [['B · Diff grid', 'b'], ['C · Slot lanes', 'c']]) {
    await fk('c-compare', fl); await st('c-compare', 'Two weapons');
    const cell = await p.$('#c-compare tbody tr:nth-child(3) td:nth-of-type(4)'); if (cell) { await cell.hover(); await w(300); }
    await shot('#c-compare #compare', `cmp-${f}-two-hover`); CUT.push(...await cut(`cmp-${f}-two`));
  }
  await fk('c-compare', 'A · Column cards'); await st('c-compare', 'Two weapons'); CUT.push(...await cut('cmp-a-two'));
  for (const [fl, f] of [['A · Search on the ghost', 'a'], ['B · Weapon shelf', 'b'], ['C · Command field', 'c']]) {
    await fk('c-compare', fl);
    for (const [l, n] of [['Empty', 'empty'], ['One build', 'build']]) { await st('c-compare', l); await shot('#c-compare #compare', `cmp-e${f}-${n}`); CUT.push(...await cut(`cmp-e${f}-${n}`)); }
  }
  // ── REPAIRS after the head fix, the post drawer after the Ends change, the export picker ──
  await shot('#c-repairs', 'repairs');
  CUT.push(...await cut('repairs'));
  await st('c-broadcast', 'Posting'); await shot('#c-broadcast .drawer', 'post'); CUT.push(...await cut('post'));
  await st('c-export', 'Three picked'); CUT.push(...await cut('export'));
  CUT.push(...await cut('manifest'));
  console.log('CUT\n' + [...new Set(CUT.map((x) => x.replace(/^\S+ /, '')))].join('\n'));

  // ── CBHOV: every control holding a checkbox, hovered away from the box ──
  await st('c-new-build', 'Add build');
  const hosts = await p.evaluate(() => [...document.querySelectorAll('#board button, #board label, #board [role=checkbox]')].filter((e) => e.offsetParent && e.querySelector('.cb') && !e.matches('.wg-cb:not(.f-bt)')).map((e, i) => { e.dataset.cbh = String(i); return i; }));
  const cbh = [];
  for (const i of hosts) {
    const r = await p.evaluate((i) => { const e = document.querySelector(`[data-cbh="${i}"]`); e.scrollIntoView({ block: 'center' }); const a = e.getBoundingClientRect(), c = e.querySelector('.cb').getBoundingClientRect();
      const x = c.right + 6 < a.right - 4 ? a.right - 6 : a.left + 4; const cs = getComputedStyle(e.querySelector('.cb')); const af = getComputedStyle(e.querySelector('.cb'), '::after');
      return { x, y: a.top + a.height / 2, rest: cs.boxShadow + cs.backgroundColor + af.backgroundColor, name: e.className + ' «' + e.textContent.trim().slice(0, 18) + '»' }; }, i);
    await p.mouse.move(r.x, r.y); await w(120);
    const hov = await p.evaluate((i) => { const c = document.querySelector(`[data-cbh="${i}"] .cb`); const cs = getComputedStyle(c); return cs.boxShadow + cs.backgroundColor + getComputedStyle(c, '::after').backgroundColor; }, i);
    if (hov === r.rest) cbh.push(r.name);
    await p.mouse.move(2, 2);
  }
  console.log(`CBHOV ${hosts.length} hosts, ${cbh.length} whose box ignores the hover:\n` + cbh.join('\n'));

  // ── FOCUS on the new controls, forced through CDP ──
  const cdp = await p.target().createCDPSession(); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const nofocus = [];
  for (const [sec, stt] of [['c-new-build', 'Add · filled'], ['c-new-build', 'Bulk · several'], ['c-compare', 'Two weapons'], ['c-compare', 'Empty']]) {
    await st(sec, stt);
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: `#${sec} :is(button, input, [role=radio], [role=checkbox])[class*="f-"], #${sec} :is(.f-src, .f-tiers, .bk-fl, .cx-keys, .cx-bar, .bk-rh, .bk-card) :is(button, input), #${sec} .f-fld input, #${sec} .cx-sug, #${sec} .cx-tile, #${sec} .bk-gt` });
    console.log('FOCUS tested', sec, stt, nodeIds.length);
    for (const id of nodeIds) {
      const { object } = await cdp.send('DOM.resolveNode', { nodeId: id });
      const read = async () => (await cdp.send('Runtime.callFunctionOn', { objectId: object.objectId, returnByValue: true, functionDeclaration: 'function(){ if(!this.offsetParent) return null; const f=(e)=>{const c=getComputedStyle(e);return c.outlineStyle+c.outlineWidth+c.boxShadow+c.backgroundColor}; const fld=this.closest(".f-fld"); return f(this)+(fld?f(fld):"")+"|"+(this.className||this.tagName)+" «"+((this.textContent||this.placeholder||"").trim().slice(0,16))+"»"; }' })).result.value;
      const a = await read(); if (!a) continue;
      await cdp.send('CSS.forcePseudoState', { nodeId: id, forcedPseudoClasses: ['focus', 'focus-visible', 'focus-within'] });
      const bb = await read(); await cdp.send('CSS.forcePseudoState', { nodeId: id, forcedPseudoClasses: [] });
      if (a.split('|')[0] === bb.split('|')[0]) nofocus.push(sec + ' ' + a.split('|')[1]);
    }
  }
  console.log(`FOCUS no visible change on ${nofocus.length}:\n` + [...new Set(nofocus)].join('\n'));
  console.log('ERRORS', errs.length ? [...new Set(errs)].join(' | ') : 'none');
  await b.close();
})().catch((e) => { console.error('R20 FAIL', e.message); process.exit(1); });
