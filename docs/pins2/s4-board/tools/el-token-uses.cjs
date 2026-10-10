// Session 4 · what every token is USED FOR, for the element board's token sheets. Harkirat, 2026-10-02 20:33 EDT: "How tf am I supposed to know
// exactly what each token current is used for??" A token's name and value say nothing about where it lands.
// For each stylesheet rule whose declarations read var(--token) — directly, or through another token whose own value reads it — this records
// the property it sets and the selector, then walks every view of Board 4 (each gate at rest, after each state and Try step, each pop-up and
// drawer) and of the portal (portal-walk.cjs's views), and counts the visible elements each selector matches, by element role and stage.
// el/plan.json's role index turns a role into what it is on the board (an element type, a surface, a part of an element).
// Run with repo-static on :8900 and the harness on :8901:  node local/pins2/s4/work/lead/el-token-uses.cjs  → el/token-uses.json
const path = require('path'); const fs = require('fs');
const W = require(path.resolve(__dirname, '../../../../../docs/pins2/final/board4-spec/board4-walk.cjs')); const PW = require('./portal-walk.cjs');
// in the page: every rule that reads a token, with the tokens each token reads, so an indirect use is counted for the token underneath
const RULES = String.raw`(() => {
  const uses = []; const deps = {}; const STATE = /:(hover|focus-visible|focus-within|focus|active)(?![\w-])/;
  const walk = (rs) => { for (const r of rs) {
    if (r.selectorText && r.style) { const text = r.style.cssText; for (const m of text.matchAll(/(--[\w-]+|[a-z-]+)\s*:\s*([^;]+)/g)) { const prop = m[1], val = m[2]; const refs = [...val.matchAll(/var\(\s*(--[\w-]+)/g)].map((x) => x[1]); if (!refs.length) continue;
        if (prop.startsWith('--') && /(^|,)\s*(:root|html)(?![\w-])/.test(r.selectorText)) { deps[prop] = [...new Set([...(deps[prop] || []), ...refs])]; continue; }
        for (const sel of r.selectorText.split(/,(?![^(]*\))/)) { const s = sel.trim(); const state = (s.match(STATE) || [])[1] || ''; let t = s.replace(/::?(before|after|placeholder|selection|marker|backdrop|-webkit-[\w-]+)(\([^)]*\))?/g, '').replace(new RegExp(STATE.source, 'g'), '').replace(/:not\(\s*\)/g, '').trim(); if (!t || /[>+~]$/.test(t)) continue;
          const mixed = !/^\s*var\(\s*--[\w-]+\s*(,[^()]*(\([^()]*\))?[^()]*)?\)\s*(!important)?\s*$/.test(val) && /(color-mix|calc|rgb|hsl|oklch|min|max|clamp)\([^)]*var\(/.test(val);
          uses.push({ refs, prop, sel: t, state, pseudo: /::?(before|after|placeholder)/.test(s), mixed }); } } }
    if (r.cssRules) walk(r.cssRules); } };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} }
  return { uses, deps }; })()`;
// in the page: count, for each use, the visible elements in the view's scope it matches, by role
const COUNT = String.raw`((scopeSel, uses, rootVals) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true }); const cache = {};
  const col = (c) => { if (cache[c]) return cache[c]; cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return (cache[c] = d.join(',')); };
  const isCol = (v) => /^(#|rgb|hsl|oklch|oklab|color\(|color-mix|lab|lch|hwb|transparent)/i.test(v);
  const cols = (v) => (v.match(/(rgba?|hsla?|oklch|oklab|color|lab|lch|hwb|color-mix)\((?:[^()]|\([^()]*\))*\)|#[0-9a-f]{3,8}/gi) || []).map(col);
  const probe = document.createElement('div'); probe.style.cssText = 'position:absolute;visibility:hidden;'; document.body.appendChild(probe);
  const px = (v) => { probe.style.width = ''; probe.style.width = v; return probe.style.width ? getComputedStyle(probe).width : null; };
  const LONG = {}; const longs = (prop) => { if (LONG[prop]) return LONG[prop]; const d = document.createElement('div').style; d.setProperty(prop, 'initial'); return (LONG[prop] = d.length ? [...Array(d.length).keys()].map((i) => d[i]) : [prop]); };
  const wins = (e, u) => { if (u.state || u.pseudo) return 'declared'; if (u.mixed) return 'mixed'; const cs = getComputedStyle(e);
    for (const ref of u.refs) { const tv = cs.getPropertyValue(ref).trim(); if (!tv) continue; const L = longs(u.prop).filter((l) => !/style$/.test(l));
      if (isCol(tv)) { const want = col(tv); if (L.some((l) => cols(cs.getPropertyValue(l)).includes(want))) return 'wins'; }
      else { const w = px(tv); if (w && L.some((l) => cs.getPropertyValue(l).split(/\s+/).includes(w))) return 'wins'; if (!w) return 'declared-unchecked'; } }
    return 'loses'; };
  const roots = [...document.querySelectorAll(scopeSel)].filter((e) => e.getBoundingClientRect().width > 0); const out = []; const indirect = {};
  const norm = (v) => (isCol(v) ? 'c:' + col(v) : 'v:' + v.replace(/\s+/g, ' '));
  const byVal = {}; for (const [t, v] of Object.entries(rootVals)) (byVal[norm(v)] = byVal[norm(v)] || []).push(t);
  const credit = (e, prop, ref, rk) => { const v = getComputedStyle(e).getPropertyValue(ref).trim(); if (!v) return; for (const t of byVal[norm(v)] || []) { if (t === ref) continue; const key = t + '|' + prop + '|' + rk + '|' + ref; indirect[key] = (indirect[key] || 0) + 1; } };
  const vis = (e) => { const r = e.getBoundingClientRect(); if (r.width < 0.5 || r.height < 0.5) return false; const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const role = (e) => e.tagName.toLowerCase() + ((typeof e.className === 'string' ? e.className : e.getAttribute('class') || '').trim() ? '.' + (typeof e.className === 'string' ? e.className : e.getAttribute('class')).trim().split(/\s+/).sort().join('.') : '');
  uses.forEach((u, k) => { let hits; try { hits = roots.flatMap((r) => [...(r.matches(u.sel) ? [r] : []), ...r.querySelectorAll(u.sel)]); } catch (e) { return; }
    const by = {}; for (const e of hits) if (vis(e)) { const w = wins(e, u); if (w === 'loses') continue; const rk = role(e) + (w === 'declared' ? ' [' + (u.state || 'pseudo') + ']' : w === 'mixed' ? ' [mixed]' : ''); by[rk] = (by[rk] || 0) + 1;
      for (const ref of u.refs) if (!(ref in rootVals)) credit(e, u.prop, ref, rk); } if (Object.keys(by).length) out.push([k, by]); });
  // inline styles: each declaration that reads a variable, credited to the root token it resolves to (or the token itself when it is one)
  for (const r of roots) for (const e of [r, ...r.querySelectorAll('[style*="var("]')]) { if (!vis(e)) continue; const st = e.getAttribute('style') || '';
    for (const m of st.matchAll(/(--[\w-]+|[a-z-]+)\s*:\s*([^;]+)/g)) { const refs = [...m[2].matchAll(/var\(\s*(--[\w-]+)/g)].map((x) => x[1]); const rk = role(e) + ' [inline]';
      for (const ref of refs) { if (ref in rootVals) { const key = ref + '|' + m[1] + '|' + rk + '|'; indirect[key] = (indirect[key] || 0) + 1; } else credit(e, m[1], ref, rk); } } }
  probe.remove(); return { out, indirect }; })`;
(async () => {
  const res = {};
  for (const src of ['b4', 'portal']) {
    const { b, p } = src === 'b4' ? await W.open() : await PW.open(); if (src === 'portal') await PW.load(p, 'home');
    const { uses, deps } = await p.evaluate(RULES); const tally = uses.map(() => ({})); const stagesOf = uses.map(() => ({})); const ind = {}; const indStages = {};
    const rootNames = new Set(await p.evaluate(() => { const out = []; const walk = (rs) => { for (const r of rs) { if (r.selectorText && /(^|,)\s*(:root|html)(?![\w-])/.test(r.selectorText)) for (let i = 0; i < r.style.length; i++) if (r.style[i].startsWith('--')) out.push(r.style[i]); if (r.cssRules) walk(r.cssRules); } }; for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (e) {} } return out; }));
    const views = [];
    if (src === 'b4') { for (const [g, id] of W.GATES) { views.push({ g, id, act: null }); const acts = await W.actions(p, id); acts.forEach((a) => views.push({ g, id, act: a })); } W.POPS.forEach((pop) => views.push({ g: pop.g, id: pop.id, pop })); }
    else PW.views().forEach((v) => views.push(v));
    const reload = async () => { await p.reload({ waitUntil: 'networkidle0' }); await p.waitForSelector('#c-admin .b4-vb .incchip', { timeout: 20000 }); await W.sleep(700); };
    for (const v of views) {
      let scope;
      if (src === 'b4') { await reload(); if (v.act) await W.act(p, v.id, v.act[0], v.act[1]); if (v.pop) { const o = await W.openPop(p, v.pop); if (!o.ok) continue; scope = v.pop.sel || W.POP_SEL; } else scope = W.STAGE(v.id); }
      else { await PW.replay(p, v); scope = v.scope; }
      const rv = await p.evaluate((names) => Object.fromEntries(names.map((n) => [n, getComputedStyle(document.documentElement).getPropertyValue(n).trim()]).filter((x) => x[1])), [...rootNames]);
      const res_ = await p.evaluate(`(${COUNT})(${JSON.stringify(scope)}, ${JSON.stringify(uses.map((u) => ({ sel: u.sel, prop: u.prop, refs: u.refs, state: u.state, pseudo: u.pseudo, mixed: u.mixed })))}, ${JSON.stringify(rv)})`);
      const got = res_.out; for (const [key, nn] of Object.entries(res_.indirect)) { ind[key] = Math.max(ind[key] || 0, nn); indStages[key] = indStages[key] || {}; indStages[key][src === 'b4' ? v.g : 'P:' + v.g] = 1; }
      const stage = src === 'b4' ? v.g : 'P:' + v.g;
      for (const [k, by] of got) for (const [rk, n] of Object.entries(by)) { tally[k][rk] = Math.max(tally[k][rk] || 0, n); stagesOf[k][stage] = 1; }
      if (v.pop && src === 'b4') await W.closePop(p).catch(() => {});
    }
    await b.close();
    // per token: each use, and every token that reads it (so --sunk is credited for a rule that reads --chip-bg: var(--sunk))
    const readers = {}; for (const [t, rs] of Object.entries(deps)) for (const r of rs) (readers[r] = readers[r] || []).push(t);
    const via = (t, seen = new Set()) => { if (seen.has(t)) return []; seen.add(t); return [t, ...(readers[t] || []).flatMap((x) => via(x, seen))]; };
    const tokens = new Set([...uses.flatMap((u) => u.refs), ...Object.keys(deps), ...Object.keys(ind).map((k) => k.split('|')[0])]); const out = {};
    for (const t of tokens) { const chain = via(t); const rows = [];
      uses.forEach((u, k) => { const hit = u.refs.find((r) => chain.includes(r)); if (!hit) return; rows.push({ prop: u.prop, sel: u.sel, state: u.state, pseudo: u.pseudo, through: hit === t ? null : hit, roles: tally[k], stages: Object.keys(stagesOf[k]) }); });
      for (const [key, nn] of Object.entries(ind)) { const [tok, prop, rk, local] = key.split('|'); if (tok !== t) continue; rows.push({ prop, sel: local ? `through ${local}` : 'inline style', state: '', pseudo: false, through: local || 'inline', roles: { [rk]: nn }, stages: Object.keys(indStages[key]) }); }
      out[t] = { readBy: (readers[t] || []), rows }; }
    res[src] = out; console.log(`${src}: ${uses.length} rules read a token · ${tokens.size} tokens · ${views.length} views`);
  }
  fs.writeFileSync(path.join(__dirname, 'el', 'token-uses.json'), JSON.stringify(res));
})().catch((e) => { console.error(e); process.exit(1); });
