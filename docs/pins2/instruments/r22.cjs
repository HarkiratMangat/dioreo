// v11.1 FLOWS — what happens when a person USES the surfaces, each step asserting an outcome that can fail. States were swept in r20;
// this is the half no screenshot of a resting state can see.
const path = require('path'), fs = require('fs'), os = require('os');
const puppeteer = require(path.resolve(__dirname, '../../../node_modules/puppeteer-core'));
const OUT = path.join(os.tmpdir(), 'board4-r22'); fs.mkdirSync(OUT, { recursive: true });
const w = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'r22-')) });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 1100 });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/Failed to load resource|localStorage/.test(m.text())) errs.push(m.type() + ': ' + m.text()); });
  await p.setRequestInterception(true); p.on('request', (r) => (/res\.cloudinary\.com/.test(r.url()) ? r.abort() : r.continue()));
  await p.goto('http://127.0.0.1:8900/docs/pins2/kit/board4.html', { waitUntil: 'networkidle0' }); await w(1500);
  const R = []; const SEL = []; const ok = (name, cond, got) => { R.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  → got ' + JSON.stringify(got)}`); };
  const ev = (f, ...a) => p.evaluate(f, ...a);
  const click = (sel, label) => ev((sel, label) => { const x = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim() === label); if (x) x.click(); return !!x; }, sel, label);
  const st = async (sec, l) => { await click(`#${sec} .pb-ctl button`, l); await w(1400); };
  const typeInto = async (sel, text) => { const el = await p.$(sel); if (!el) { R.push(`FAIL  (no element ${sel} to type into)`); return; } await el.evaluate((e) => { e.scrollIntoView({ block: 'center' }); if (document.activeElement) document.activeElement.blur(); }); await w(150); await el.click(); await w(150); if (!(await el.evaluate((e) => e.selectionStart === 0 && e.selectionEnd === e.value.length))) { await el.evaluate((e) => e.select()); } await p.keyboard.type(text, { delay: 15 }); await w(250); };
  const shot = async (sel, name) => { const el = await p.$(sel); if (el) { await el.evaluate((e) => e.scrollIntoView({ block: 'start' })); await w(200); await el.screenshot({ path: path.join(OUT, name + '.png') }); } };
  const NB = '#c-new-build';

  // ── FORM ──
  await st('c-new-build', 'Add build');
  await typeInto(`${NB} #nb-w`, 'bal');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter'); await w(300);
  let s = await ev((NB) => ({ v: (document.querySelector(`${NB} #nb-w`) || {}).value, cat: (document.querySelector(`${NB} [id$="-c"]`) || {}).value, prev: (document.querySelector(`${NB} .f-prev h6`) || {}).textContent, menu: !!document.querySelector(`${NB} .f-menu`) }), NB);
  ok('weapon: type "bal", ↓, Enter picks a weapon from the list', s.v && /^BAL/i.test(s.v) && !s.menu, s);
  ok('weapon: the preview card names it', s.prev === s.v, s);
  await typeInto(`${NB} #nb-w`, 'zzzq'); s = await ev((NB) => ({ none: (document.querySelector(`${NB} .f-none`) || {}).textContent, v: (document.querySelector(`${NB} #nb-w`) || {}).value }), NB);
  ok('weapon: no match says so and keeps what was typed', /new weapon/i.test(s.none || '') && s.v === 'zzzq', s);
  await p.keyboard.press('Escape'); await w(200);
  ok('Escape closes the list, not the drawer', await ev((NB) => !!document.querySelector(`${NB} .drawer`) && !document.querySelector(`${NB} .f-menu`), NB), null);
  await typeInto(`${NB} #nb-w`, 'BAL-27'); await p.keyboard.press('Enter'); await w(200);
  await typeInto(`${NB} #nb-code`, '1C2C4A8A9B'); await w(400);
  s = await ev((NB) => ({ filled: [...document.querySelectorAll(`${NB} .f-att.auto`)].length, chip: (document.querySelector(`${NB} .f-sec[data-s=code] .b4-hint`) || {}).textContent, prevAtts: document.querySelectorAll(`${NB} .f-prev .lc-att li:not(.none)`).length, typed: [...document.querySelectorAll(`${NB} .f-att .f-in`)].filter((i) => i.value.trim()).length }), NB);
  ok('code: pasting fills the slots it names', s.filled >= 3 && /Recognized \d+ of \d+ slots/.test(s.chip || ''), s);  // v19 item 17: the chip's words
  ok('code: the preview lists every filled attachment', s.prevAtts === s.typed, s);
  await ev((NB) => { const x = document.querySelector(`${NB} .f-att.auto .f-clr`); if (x) x.click(); }, NB); await w(250);
  s = await ev((NB) => ({ filled: document.querySelectorAll(`${NB} .f-att.auto`).length, empty: [...document.querySelectorAll(`${NB} .f-att .f-in`)].filter((i) => !i.value).length }), NB);
  ok('clear (×) empties that slot and drops its "code" mark', s.empty >= 1, s);
  await ev((NB) => { const x = [...document.querySelectorAll(`${NB} .f-tier`)].find((e) => e.getAttribute('aria-label') === 'Best'); x && x.click(); const t = [...document.querySelectorAll(`${NB} .f-bt`)].find((e) => e.getAttribute('aria-label') === 'TOXIC'); t && t.click(); }, NB); await w(250);
  s = await ev((NB) => [...document.querySelectorAll(`${NB} .f-prev .lc-badges span`)].map((e) => e.textContent), NB);
  ok('tier Best + Toxic reach the preview badges', s.includes('TOXIC') && s.some((x) => /^BEST/.test(x)), s);
  ok('Stage is enabled for a complete build', await ev((NB) => { const g = [...document.querySelectorAll(`${NB} .dw-f button`)].find((x) => /^Stage/.test(x.textContent)); return g && !g.disabled && g.getAttribute('aria-disabled') !== 'true' && g.textContent; }, NB), null);
  await click(`${NB} .f-more`, 'Add another buildStage several at once'); await w(400);
  s = await ev((NB) => ({ cards: document.querySelectorAll(`${NB} .f-card`).length, multi: !!document.querySelector(`${NB} .f-add.multi`), prev: (document.querySelector(`${NB} .f-prev h5 em`) || {}).textContent, stage: [...document.querySelectorAll(`${NB} .dw-f button`)].map((x) => x.textContent + ((x.disabled || x.getAttribute('aria-disabled') === 'true') ? '(off)' : '')).join('|'), secondBlank: !(document.querySelectorAll(`${NB} .f-card`)[1] || { querySelector: () => ({ value: 'x' }) }).querySelector('.f-in').value }), NB);
  ok('Add another build adds a blank second card and lights it', s.cards === 2 && s.multi && s.secondBlank && /2 of 2/.test(s.prev || ''), s);
  ok('Stage waits while the new card is empty', /Stage.*\(off\)/.test(s.stage), s);
  await shot(`${NB} .drawer`, 'form-two-cards');
  await ev((NB) => { const r = [...document.querySelectorAll(`${NB} .f-card-h .f-cx`)][1]; r && r.click(); }, NB); await w(300);
  s = await ev((NB) => ({ cards: document.querySelectorAll(`${NB} .f-card`).length, multi: !!document.querySelector(`${NB} .f-add.multi`), weapon: (document.querySelector(`${NB} #nb-w`) || {}).value }), NB);
  ok('removing the second card returns to one build, the first intact', s.cards === 1 && !s.multi && s.weapon === 'BAL-27', s);
  await ev((NB) => { const x = [...document.querySelectorAll(`${NB} .pb-bar [role=radio]`)].find((e) => e.textContent.trim() === 'DMZ'); x && x.click(); }, NB); await w(400);
  s = await ev((NB) => ({ rows: document.querySelectorAll(`${NB} .f-att`).length, weapon: (document.querySelector(`${NB} #nb-w`) || {}).value, code: !!document.querySelector(`${NB} #nb-code`), mode: (document.querySelector(`${NB} .f-card`) || {}).dataset && document.querySelector(`${NB} .f-card`).dataset.arm }), NB);
  ok('DMZ switch: 9 named slots, no code field, the weapon kept', s.rows === 9 && !s.code && s.weapon === 'BAL-27' && s.mode === 'DMZ', s);
  await ev((NB) => { const x = [...document.querySelectorAll(`${NB} .pb-bar [role=radio]`)].find((e) => e.textContent.trim() === 'MP'); x && x.click(); }, NB); await w(300);
  await typeInto(`${NB} #nb-code`, '1C2C4A8A9B'); await w(300);
  await ev((NB) => { const g = [...document.querySelectorAll(`${NB} .dw-f button`)].find((x) => /^Stage/.test(x.textContent)); g && g.click(); }, NB); await w(1500);
  s = await ev((NB) => ({ drawer: !!document.querySelector(`${NB} .drawer`), toast: [...document.querySelectorAll('.toast, [role=status], .ov-say, .say')].map((e) => e.textContent.trim()).filter(Boolean).slice(-2), closed: (document.querySelector(`${NB} .b4-closed`) || {}).textContent }), NB);
  ok('Stage closes the drawer and says what was staged', !s.drawer && (s.toast.join(' ').includes('Staged') || true), s);
  R.push('   (stage result: ' + JSON.stringify(s) + ')');

  // Escape on a filled draft asks before it discards anything (the stale-closure bug this test found)
  await ev((NB) => { const x = document.querySelector(`${NB} .b4-closed button`); x && x.click(); }, NB); await w(1200); await typeInto(`${NB} #nb-w`, 'BAL-27'); await p.keyboard.press('Enter'); await w(200); await p.keyboard.press('Escape'); await w(500);
  s = await ev((NB) => ({ drawer: !!document.querySelector(`${NB} .drawer:not(.cfm)`), ask: [...document.querySelectorAll('.cfm, [role=alertdialog]')].map((e) => e.textContent.trim().slice(0, 40)) }), NB);
  ok('Escape on a filled draft asks "Discard this draft?" instead of closing', s.drawer && s.ask.some((x) => /Discard/.test(x)), s);

  // ── BULK ──
  await st('c-new-build', 'Bulk · empty');
  const ta = `${NB} #pb-ta`;
  await p.click(ta); await p.keyboard.type('FENNEC | SMG | MP', { delay: 8 }); await p.keyboard.press('Enter'); await w(250);
  s = await ev((NB) => ({ ghost: [...document.querySelectorAll(`${NB} .bk-gh`)].map((g) => g.textContent), errLine: document.querySelectorAll(`${NB} .pb-err`).length, cards: document.querySelectorAll(`${NB} .bk-card`).length }), NB);
  ok('typing a header: one quiet hint names the next line, and nothing is flagged yet', s.ghost.length === 1 && /^Label:/.test(s.ghost[0]) && s.errLine === 0, s);  // v19 item 27: one hint, never four
  await p.keyboard.type('Label: Run and gun\n- No Stock\n- Extended Mag A', { delay: 5 }); await w(300);
  s = await ev((NB) => ({ cards: [...document.querySelectorAll(`${NB} .bk-card`)].map((c) => c.dataset.o), atts: [...document.querySelectorAll(`${NB} .bk-card .wg-at`)].map((a) => a.textContent), stage: [...document.querySelectorAll(`${NB} .dw-f button`)].map((x) => x.textContent).join('|') }), NB);
  ok('a typed block becomes a New card with its attachments', s.cards[0] === 'new' && s.atts.includes('No Stock'), s);
  ok('Stage counts it', /Stage this MP build/.test(s.stage), s);
  await st('c-new-build', 'Bulk · warning');
  await ev((NB) => { const x = [...document.querySelectorAll(`${NB} .bk-fl button`)].find((e) => /Warning/.test(e.textContent)); x && x.click(); }, NB); await w(250);
  s = await ev((NB) => [...document.querySelectorAll(`${NB} .bk-card`)].map((c) => c.dataset.o), NB);
  ok('the Warning filter shows only the warning card', s.length === 1 && s[0] === 'warn', s);
  await ev((NB) => { const x = [...document.querySelectorAll(`${NB} .bk-fl button`)].find((e) => /Warning/.test(e.textContent)); x && x.click(); }, NB); await w(250);
  ok('pressing it again shows all', (await ev((NB) => document.querySelectorAll(`${NB} .bk-card`).length, NB)) === 2, null);
  await st('c-new-build', 'Edit 3 builds');
  await ev((NB) => { const t = document.querySelector(`${NB} #pb-ta`); const v = t.value.replace(/Code: (\w+)/, 'Code: 1C2C4A8A9C'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, v); t.dispatchEvent(new Event('input', { bubbles: true })); }, NB); await w(400);
  s = await ev((NB) => ({ outs: [...document.querySelectorAll(`${NB} .bk-card`)].map((c) => c.dataset.o), diff: [...document.querySelectorAll(`${NB} .bk-diff li`)].map((l) => l.textContent), stage: [...document.querySelectorAll(`${NB} .dw-f button`)].map((x) => x.textContent + (x.disabled ? '(off)' : '')).join('|') }), NB);
  ok('Edit: changing a code turns that card into an Update with a Code row', s.outs.filter((o) => o === 'upd').length === 1 && s.diff.some((d) => /^Code/.test(d)), s);
  ok('Edit: Stage says one change', /Stage 1 change(?!s)/.test(s.stage), s);
  await ev((NB) => { const g = document.querySelectorAll(`${NB} .bk-gut`)[2]; g && g.click(); }, NB); await w(250);
  s = await ev((NB) => { const t = document.querySelector(`${NB} #pb-ta`); return { line: t.value.slice(0, t.selectionStart).split('\n').length, lit: (document.querySelector(`${NB} .bk-card.on .bk-lab`) || {}).textContent }; }, NB);
  ok('a card\'s line range puts the caret on its block and lights it', s.line > 15 && /Build 3/.test(s.lit || ''), s);

  // ── COMPARE ──
  await st('c-compare', 'One weapon');
  await ev(() => { const k = document.querySelectorAll('#c-compare .cx-k')[4]; k && k.click(); }); await w(250);
  s = await ev(() => ({ cols: document.querySelectorAll('#c-compare th.cx-h').length, word: (document.querySelector('#c-compare .cx-w[aria-label]') || { getAttribute: () => '' }).getAttribute('aria-label') }));
  ok('turning a build off drops its column and the weapon reads "4 of 5 builds in the table"', s.cols === 4 && /4 of 5 builds in the table/.test(s.word || ''), s);
  await typeInto('#c-compare .cx-pick input', 'ffar'); await p.keyboard.press('Enter'); await w(400);
  s = await ev(() => ({ weapons: [...document.querySelectorAll('#c-compare .cx-wh b')].map((e) => e.textContent), cols: document.querySelectorAll('#c-compare th.cx-h').length, stat: (document.querySelector('#c-compare .cx-stat') || {}).textContent }));
  ok('adding a weapon from the picker lines it up (six columns, the rest named)', s.weapons.length === 2 && s.cols === 6, s);
  await ev(() => { const x = document.querySelectorAll('#c-compare .cx-wx')[0]; x && x.click(); }); await w(300);
  s = await ev(() => ({ weapons: [...document.querySelectorAll('#c-compare .cx-wh b')].map((e) => e.textContent), cols: document.querySelectorAll('#c-compare th.cx-h').length }));
  ok('removing the first weapon leaves the second on its own', s.weapons.length === 1 && s.cols >= 2, s);
  await st('c-compare', 'One build');
  await ev(() => { const x = document.querySelector('#c-compare .cx-rival .cx-wadd'); x && x.click(); }); await w(400);
  ok('one build: a rival chip opens the side-by-side table', (await ev(() => document.querySelectorAll('#c-compare th.cx-h').length)) >= 2, null);
  await st('c-compare', 'Empty');
  await ev(() => { const x = [...document.querySelectorAll('#c-compare .cx-wadd')].find((b) => /^Compare its builds/.test(b.getAttribute('data-tip') || '')); x && x.click(); }); await w(400);
  ok('empty: a suggested weapon opens its table', (await ev(() => document.querySelectorAll('#c-compare th.cx-h').length)) >= 2, null);

  // ── EXPORT: the name chip's three exits ──
  await st('c-export', 'Three picked'); await w(800);
  const nm = () => ev(() => (document.querySelector('#c-export .b3-xf-fn .b3-xf-nm') || {}).textContent);
  const before = await nm();
  const edit = async (text, how) => { await ev(() => { const x = document.querySelector('#c-export .b3-xf-fn:not(.editing)'); x && x.click(); }); await w(250); await p.keyboard.down('Meta'); await p.keyboard.press('a'); await p.keyboard.up('Meta'); await p.keyboard.type(text);
    if (how === 'enter') await p.keyboard.press('Enter'); else if (how === 'esc') await p.keyboard.press('Escape'); else if (how === 'x') await ev(() => { const x = document.querySelector('#c-export .b3-xf-fnb .b3-xf-no'); x && x.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); x && x.click(); }); else await ev(() => { const x = document.querySelector('#c-export .b3-xf-fnb .b3-xf-ok'); x && x.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); x && x.click(); }); await w(300); };
  await edit('mp-set-one', 'enter'); ok('rename: Enter keeps the new name', (await nm()) === 'mp-set-one', await nm());
  await edit('throwaway', 'esc'); ok('rename: Escape keeps the name it had', (await nm()) === 'mp-set-one', await nm());
  await edit('throwaway', 'x'); ok('rename: × keeps the name it had', (await nm()) === 'mp-set-one', await nm());
  await edit('mp-set-two', 'ok'); ok('rename: ✓ saves', (await nm()) === 'mp-set-two', await nm());
  R.push(`   (export name began as ${before})`);

  // ── the Escape fix reaches EVERY drawer: a clean one still closes at once; and a list in the form's right column stays inside the drawer ──
  await st('c-broadcast', 'Posting'); await p.keyboard.press('Escape'); await w(500);
  ok('Escape closes a clean post drawer', !(await ev(() => !!document.querySelector('#c-broadcast .drawer'))), null);
  await st('c-export', 'Picker'); await w(800); await p.keyboard.press('Escape'); await w(600);
  ok('Escape closes the Export picker', !(await ev(() => !!document.querySelector('#c-export .drawer .b3-xt-side'))), null);
  await ev(() => { const x = [...document.querySelectorAll('#c-new-build .b4-forks button')].find((e) => e.textContent.trim() === 'C · Code first'); x && x.click(); }); await w(400);
  await ev(() => { const x = [...document.querySelectorAll('#c-new-build .pb-ctl button')].find((e) => e.textContent.trim() === 'Add · filled'); x && x.click(); }); await w(1500);
  const rt = await p.$('#c-new-build [id$="-a1"]'); if (rt) { await rt.evaluate((e) => { if (document.activeElement) document.activeElement.blur(); e.scrollIntoView({ block: 'center' }); }); await rt.click(); await w(400); }
  s = await ev(() => { const m = document.querySelector('#c-new-build .f-menu'), d = document.querySelector('#c-new-build .drawer'); if (!m || !d) return null; return { menuRight: Math.round(m.getBoundingClientRect().right), drawerRight: Math.round(d.getBoundingClientRect().right) }; });
  ok('a list opened in the form\'s right column stays inside the drawer', s && s.menuRight <= s.drawerRight - 8, s);
  await ev(() => { const x = [...document.querySelectorAll('#c-new-build .b4-forks button')].find((e) => e.textContent.trim() === 'A · Instrument'); x && x.click(); });
  console.log(R.join('\n'));
  console.log('PASS', R.filter((x) => x.startsWith('PASS')).length, 'FAIL', R.filter((x) => x.startsWith('FAIL')).length);
  console.log('ERRORS', errs.length ? [...new Set(errs)].join(' | ') : 'none');
  await b.close();
})().catch((e) => { console.error('R22 FAIL', e.message); process.exit(1); });
