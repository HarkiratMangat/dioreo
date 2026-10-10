// Session 4 · the kit's stylesheets, copied from their SOURCE TEXT for the element board's shadow roots. Replaces the CSSOM walk el-real.cjs used
// until 2026-10-02 23:00 EDT: rule.style.cssText serialises a shorthand written with var() and then overridden by one of its own longhands
// (font: 500 var(--t-xs)/1 var(--data); font-style: normal) as longhands with EMPTY values, so 159 of the kit's rules copied as nothing
// ("Load older events · 1,347 more" lost its mono type, .lane and .flag their borders). The source text has no such loss.
// What the copy changes, and why:
//  · html/:root become :host and body becomes .fz-body, so the kit's root rules reach the shadow root;
//  · @media and @supports are decided where Board 4 was measured (the page answers them) and only the true ones are kept;
//  · a size @container rule becomes a style query on --fzq-N, which the copy sets when Board 4's container said yes for that button
//    (the copy's skeleton has no real widths to ask); style() queries stay as written;
//  · :has(X) becomes :is(:has(X), :where([data-fzh~="hN"])), and every skeleton ancestor carries hN when :has(X) held on Board 4: the skeleton
//    keeps only the button's own line of ancestors, so a :has() about a sibling branch (.drawer:has(.b3-nb)) could never match. :where() keeps
//    the specificity the kit wrote.
'use strict';
const fs = require('fs'); const path = require('path');
const stripComments = (s) => { let o = '', i = 0, q = null; while (i < s.length) { const c = s[i];
  if (q) { o += c; if (c === '\\') { o += s[i + 1] || ''; i += 2; continue; } if (c === q) q = null; i++; continue; }
  if (c === '"' || c === "'") { q = c; o += c; i++; continue; } if (c === '/' && s[i + 1] === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? s.length : e + 2; continue; } o += c; i++; } return o; };
// the index just past the bracket that closes the one at i, minding strings
// the same, but each comment becomes spaces (its newlines kept), so offsets and line numbers still point into the source file
const stripKeep = (s) => s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const close = (s, i) => { const open = s[i], shut = { '{': '}', '(': ')', '[': ']' }[open]; let d = 0, q = null; for (let j = i; j < s.length; j++) { const c = s[j];
  if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === open) d++; else if (c === shut) { d--; if (!d) return j + 1; } } return s.length; };
const GROUP = /^@(media|supports|container|layer|scope|document|starting-style)\b/i;
function parse(s, base = 0) { const out = []; let i = 0;
  while (i < s.length) { while (i < s.length && /\s/.test(s[i])) i++; if (i >= s.length) break; let j = i, q = null;
    for (; j < s.length; j++) { const c = s[j]; if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; continue; } if (c === '(' || c === '[') { j = close(s, j) - 1; continue; } if (c === '{' || c === ';') break; if (c === '}') break; }
    const pre = s.slice(i, j).trim();
    if (j >= s.length || s[j] === '}') { i = j + 1; continue; }
    if (s[j] === ';') { if (pre) out.push({ kind: 'stmt', pre }); i = j + 1; continue; }
    const end = close(s, j); const body = s.slice(j + 1, end - 1);
    if (pre.startsWith('@')) out.push(GROUP.test(pre) ? { kind: 'group', pre, kids: parse(body, base + j + 1), at: base + i } : { kind: 'raw', pre, body, at: base + i });
    else out.push({ kind: 'rule', sel: pre, body, nested: /\{/.test(body), at: base + i });
    i = end; }
  return out; }
const splitSel = (t) => { const out = []; let d = 0, cur = '', q = null; for (const ch of t) { if (q) { cur += ch; if (ch === q) q = null; continue; } if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
  if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
const hostify = (sel) => { let out = '', i = 0; const re = /(^|[\s>+~(,])(html|:root)(?![\w-])/g; let m;
  while ((m = re.exec(sel))) { const start = m.index + m[1].length; let j = start + m[2].length;
    while (j < sel.length && '[.#:'.includes(sel[j])) { if (sel[j] === '[') j = close(sel, j); else { j++; if (sel[j] === ':') j++; while (j < sel.length && /[\w-]/.test(sel[j])) j++; if (sel[j] === '(') j = close(sel, j); } }
    const comp = sel.slice(start + m[2].length, j); out += sel.slice(i, start) + (comp ? ':host(' + comp + ')' : ':host'); i = j; re.lastIndex = j; }
  return out + sel.slice(i); };
// every :has( … ) argument in a selector, as written
const hasArgs = (sel) => { const a = []; let k = sel.indexOf(':has('); while (k >= 0) { const e = close(sel, k + 4); a.push(sel.slice(k + 5, e - 1).trim()); k = sel.indexOf(':has(', e); } return a; };
const markHas = (sel, idx) => { let out = '', i = 0, k = sel.indexOf(':has(');
  while (k >= 0) { const e = close(sel, k + 4); const arg = sel.slice(k + 5, e - 1).trim(); out += sel.slice(i, k) + `:is(:has(${arg}), :where([data-fzh~="h${idx.get(arg)}"]))`; i = e; k = sel.indexOf(':has(', e); } return out + sel.slice(i); };
const isStyleQ = (pre) => /style\(/.test(pre);
// sheets: [{ href, text, media }] in document order (el-real reads local files from disk and inline <style> text from the page)
function plan(sheets) { const trees = sheets.map((s) => ({ ...s, tree: parse(stripComments(s.text)) })); const media = new Set(), supports = new Set(), cq = [], has = [], seenCq = new Set(), seenHas = new Set(); let nested = 0, imports = 0;
  const visit = (list) => { for (const n of list) {
    if (n.kind === 'rule') { if (n.nested) nested++; for (const a of hasArgs(n.sel)) if (!seenHas.has(a)) { seenHas.add(a); has.push(a); } }
    else if (n.kind === 'group') { const at = n.pre.match(/^@([\w-]+)/)[1].toLowerCase(); const q = n.pre.slice(at.length + 1).trim();
      if (at === 'media') media.add(q); if (at === 'supports') supports.add(q); if (at === 'container' && !isStyleQ(q) && !seenCq.has(q)) { seenCq.add(q); cq.push(q); } visit(n.kids); }
    else if (n.kind === 'stmt' && /^@import/i.test(n.pre)) imports++; } };
  trees.forEach((t) => { if (t.media) media.add(t.media); visit(t.tree); });
  return { trees, media: [...media], supports: [...supports], cq, has, nested, imports }; }
// ok: { media: {q: bool}, supports: {q: bool} } as the page answered them
function emit(P, ok) { const hIdx = new Map(P.has.map((a, i) => [a, i])); const cIdx = new Map(P.cq.map((q, i) => [q, i])); let text = '', props = '';
  const rw = (sel) => markHas(hostify(sel), hIdx).replace(/(^|[\s>+~(,])body(?![\w-])/g, '$1.fz-body');
  const walk = (list) => { for (const n of list) {
    if (n.kind === 'rule') text += splitSel(n.sel).map(rw).join(', ') + ' {' + n.body + '}\n';
    else if (n.kind === 'group') { const at = n.pre.match(/^@([\w-]+)/)[1].toLowerCase(); const q = n.pre.slice(at.length + 1).trim();
      if (at === 'media') { if (ok.media[q]) walk(n.kids); } else if (at === 'supports') { if (ok.supports[q]) walk(n.kids); }
      else if (at === 'container') { text += '@container ' + (isStyleQ(q) ? q : `style(--fzq-${cIdx.get(q)}: on)`) + ' {\n'; walk(n.kids); text += '}\n'; }
      else { text += n.pre + ' {\n'; walk(n.kids); text += '}\n'; } }
    else if (n.kind === 'raw') { if (/^@property/i.test(n.pre)) props += n.pre + ' {' + n.body + '}\n'; else if (/^@(-webkit-)?keyframes/i.test(n.pre)) text += n.pre + ' {' + n.body + '}\n'; } } };
  for (const t of P.trees) if (!t.media || ok.media[t.media]) walk(t.tree);
  return { text, props }; }
// the page's stylesheets in document order: local files are read from disk (the served bytes), inline sheets from the page, remote ones skipped
async function sheetsOf(p, ROOT) { const list = await p.evaluate(() => [...document.styleSheets].map((s) => ({ href: s.href, inline: s.href ? null : (s.ownerNode && s.ownerNode.textContent) || '', media: s.media.mediaText, id: s.ownerNode && s.ownerNode.id })));
  return list.filter((s) => s.id !== 'fz-cq' && !(s.inline && s.inline.startsWith('*,*::before'))).map((s) => { if (s.inline != null) return { href: null, text: s.inline, media: s.media };
    const u = new URL(s.href); if (u.hostname !== '127.0.0.1') return null; return { href: s.href, text: fs.readFileSync(path.join(ROOT, decodeURIComponent(u.pathname)), 'utf8'), media: s.media }; }).filter(Boolean); }
async function answers(p, P) { return p.evaluate((m, s) => ({ media: Object.fromEntries(m.map((q) => [q, matchMedia(q).matches])), supports: Object.fromEntries(s.map((q) => { let r = false; try { r = CSS.supports(q); } catch (e) {} return [q, r]; })) }), P.media, P.supports); }
module.exports = { parse, stripComments, stripKeep, plan, emit, sheetsOf, answers, hasArgs, markHas, hostify };
