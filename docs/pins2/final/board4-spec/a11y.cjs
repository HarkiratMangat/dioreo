// Board 4's ACCESSIBILITY, walked: for every gate at rest and in each state, the keyboard's tab order (role, accessible name, and whether a
// visible focus mark appears), the controls with no accessible name, and the elements a pointer can use but a keyboard cannot reach.
// Written 2026-09-29 19:13 EDT: HANDOFF.md said "focus order, ARIA roles and screen-reader announcements were never walked on Board 4".
// Usage (the kit served on :8900): node a11y.cjs  → writes a11y.md beside it; exit 0 always (it reports, it does not gate).
const fs = require('fs'); const path = require('path');
const { GATES, STAGE, sleep, open, actions, act } = require('./board4-walk.cjs');
const cell = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');
async function audit(p, id) {
  const scope = STAGE(id);
  // The tab order, computed rather than pressed: the board keeps a drawer open in C2, C5 and C7, and a drawer traps Tab, so a real Tab walk from
  // any other gate lands in that drawer (the first run, 2026-09-29 19:26 EDT, read 0 stops in every gate without a drawer and 160, the cap, in
  // every drawer). The sequential order is the platform's: positive tabindex first, then document order; hidden, disabled and inert are skipped.
  // One real key press first, so a scripted focus() still matches :focus-visible.
  await p.keyboard.press('Shift');
  const order = await p.evaluate((scope) => { document.querySelectorAll('[data-a11y]').forEach((e) => e.removeAttribute('data-a11y')); const st = document.querySelector(scope); if (!st) return [];
    const f = [...st.querySelectorAll('button, a[href], input, textarea, select, summary, [tabindex]')].filter((e) => !e.disabled && e.tabIndex >= 0 && !e.closest('[inert]')
      && getComputedStyle(e).visibility !== 'hidden' && e.getClientRects().length && !e.closest('[aria-hidden="true"]'));
    const pos = f.filter((e) => e.tabIndex > 0).sort((x, y) => x.tabIndex - y.tabIndex); const zero = f.filter((e) => e.tabIndex === 0);
    return [...pos, ...zero].map((e, k) => { e.setAttribute('data-a11y', 't' + k); return k; }); }, scope);
  const stops = [];
  for (const k of order) {
    const d = await p.evaluate((k) => { const a = document.querySelector(`[data-a11y="t${k}"]`); if (!a) return null; a.focus({ focusVisible: true });
      const cs = getComputedStyle(a); const c = (a.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
      return { k, sig: a.tagName.toLowerCase() + (c ? '.' + c : ''), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, shadow: cs.boxShadow, bg: cs.backgroundColor, border: cs.borderColor, focused: document.activeElement === a }; }, k);
    if (!d) continue;
    const h = await p.$(`[data-a11y="t${k}"]`); const ax = h ? await p.accessibility.snapshot({ root: h, interestingOnly: false }).catch(() => null) : null;
    stops.push({ ...d, role: ax ? ax.role : '?', name: ax ? (ax.name || '') : '?' });
  }
  // The focus mark: the same element's look once focus has moved on (a ring that is also there at rest is not a focus mark).
  await p.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
  for (const s of stops) { const r = await p.evaluate((k) => { const e = document.querySelector(`[data-a11y="t${k}"]`); if (!e) return null; const cs = getComputedStyle(e); return { shadow: cs.boxShadow, bg: cs.backgroundColor, border: cs.borderColor }; }, s.k);
    s.mark = s.outline || (r && (r.shadow !== s.shadow || r.bg !== s.bg || r.border !== s.border)); }
  // Unnamed controls and pointer-only elements, over the whole stage.
  const hs = await p.$$(`${scope} button, ${scope} a[href], ${scope} input, ${scope} textarea, ${scope} select, ${scope} [role=button], ${scope} [role=checkbox], ${scope} [role=tab], ${scope} [role=option]`);
  const unnamed = {};
  for (const h of hs) { const vis = await h.evaluate((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0); if (!vis) continue;
    const ax = await p.accessibility.snapshot({ root: h, interestingOnly: false }).catch(() => null);
    if (ax && !(ax.name || '').trim()) { const s = await h.evaluate((e) => e.tagName.toLowerCase() + '.' + (e.getAttribute('class') || '').trim().split(/\s+/).slice(0, 3).join('.')); unnamed[s] = (unnamed[s] || 0) + 1; } }
  const pointerOnly = await p.evaluate((scope) => { const st = document.querySelector(scope); if (!st) return {}; const o = {};
    const focusable = (e) => e.matches('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"]), summary') && !e.disabled;
    st.querySelectorAll('*').forEach((e) => { if (e.closest('svg')) return; const cs = getComputedStyle(e); if (cs.cursor !== 'pointer' || cs.display === 'none' || !e.getBoundingClientRect().width) return;
      let a = e, ok = false; while (a && a !== st.parentElement) { if (focusable(a)) { ok = true; break; } a = a.parentElement; }
      if (!ok && !(e.parentElement && getComputedStyle(e.parentElement).cursor === 'pointer' && !focusable(e.parentElement) && e.parentElement !== st)) { const kid = [...e.querySelectorAll('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')].some((x) => !x.disabled); const s = (kid ? '(a control inside it) ' : '') + e.tagName.toLowerCase() + '.' + (e.getAttribute('class') || '').trim().split(/\s+/).slice(0, 3).join('.'); o[s] = (o[s] || 0) + 1; } });
    return o; }, scope);
  return { stops, unnamed, pointerOnly };
}
(async () => {
  const { b, p, errs } = await open();
  const out = []; const sum = [];
  for (const [g, id, title] of GATES) {
    const runs = [['Resting', null]]; for (const a of await actions(p, id)) if (!(a[0] === 'state' && a[1] === 0)) runs.push([`${a[0] === 'state' ? 'State' : 'Try'} · ${a[2]}`, a]);
    out.push(`## ${g} · ${title}`, '');
    for (const [label, a] of runs) {
      if (a) await act(p, id, a[0], a[1]);
      const r = await audit(p, id);
      const noMark = r.stops.filter((s) => !s.mark); const noName = r.stops.filter((s) => !s.name.trim());
      const un = Object.entries(r.unnamed); const po = Object.entries(r.pointerOnly);
      sum.push(`| ${g} | ${cell(label)} | ${r.stops.length} | ${noName.length} | ${noMark.length} | ${un.reduce((n, [, c]) => n + c, 0)} | ${po.reduce((n, [, c]) => n + c, 0)} |`);
      out.push(`### ${label}`, '', `**${r.stops.length} tab stops** · ${noName.length} with no accessible name · ${noMark.length} with no visible focus mark · ${un.length} unnamed control kinds · ${po.length} pointer-only kinds`, '');
      if (r.stops.length) out.push('| # | element | role | accessible name | focus mark |', '|---|---|---|---|---|', ...r.stops.map((s, i) => `| ${i + 1} | \`${cell(s.sig)}\` | ${cell(s.role)} | ${s.name.trim() ? cell(s.name).slice(0, 60) : '**none**'} | ${s.mark ? 'yes' : '**none**'} |`), '');
      if (un.length) out.push('**Controls with no accessible name:**', '', ...un.map(([s, c]) => `- \`${cell(s)}\` ×${c}`), '');
      if (po.length) out.push('**A pointer can use it and it is not itself focusable** (cursor:pointer, no focusable self or ancestor; *(a control inside it)* means a keyboard reaches a control within it, which may or may not do the same thing):', '', ...po.map(([s, c]) => `- \`${cell(s)}\` ×${c}`), '');
    }
    const first = (await actions(p, id)).find(([k, i]) => k === 'state' && i === 0); if (first) await act(p, id, 'state', 0);
  }
  const head = ['---', 'kind: reference', 'status: live', '---', '', '# Board 4: Collective — accessibility, walked', '',
    `*Generated ${new Date().toISOString()} by \`a11y.cjs\` from the running kit at 1282×888 (Chrome's accessibility tree for roles and names; the platform's sequential focus order, computed, since a drawer on the board traps real Tab presses). A focus mark is an outline, or a shadow, fill or edge that differs from the element's look once focus has moved on. Page errors: ${errs.length}. HANDOFF.md § Accessibility reads these numbers.*`, '',
    '| Gate | Walked | Tab stops | No name | No focus mark | Unnamed controls | Pointer-only |', '|---|---|---|---|---|---|---|', ...sum, ''];
  fs.writeFileSync(path.join(__dirname, 'a11y.md'), head.concat(out).join('\n') + '\n');
  console.log(JSON.stringify({ out: 'a11y.md', runs: sum.length, errs: errs.length }));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
