// Board 4 — the kit's stylesheets as rules: { file, line, selector, media, decls:[{prop, value}] }. Shared by motion.cjs and colours.cjs
// (written 2026-09-30 19:40 EDT for the Session 4/5 prep). Comments are blanked with their newlines kept, so every line number is the file's own.
// No CSS library: the kit's sheets are plain (no nesting), and a brace-depth walk is enough; @keyframes bodies are returned as their own rules
// with media '@keyframes <name>'.
const KITC = require('./kit.cjs'); // which board: Collective's kit, or Final after a bake (kit.cjs)
const fs = require('fs'); const path = require('path');
const KIT = KITC.DIR;
const SHEETS = ['app.css', 'b1.css', 'b2.css', 'gates.css', 'b3/board.css', 'b4.css', 'b4/classes.css', 'b4/compare.css', 'b4/form.css', 'b4/bulk.css'];
function blank(s) { return s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')); }
function parse(file) {
  const src = blank(fs.readFileSync(path.join(KIT, file), 'utf8')); const out = []; const stack = [];
  let i = 0, start = 0, line = 1; const lineAt = (k) => { let n = 1; for (let j = 0; j < k; j++) if (src.charCodeAt(j) === 10) n++; return n; };
  // one pass: find '{' and '}' at string-free positions (the kit has no braces inside strings except content:"{", which it does not use)
  const idx = []; for (let k = 0; k < src.length; k++) { const c = src[k]; if (c === '{' || c === '}') idx.push(k); }
  const lines = []; { let n = 1; let last = 0; for (const k of idx) { for (let j = last; j < k; j++) if (src.charCodeAt(j) === 10) n++; last = k; lines.push(n); } }
  let prev = 0;
  for (let t = 0; t < idx.length; t++) {
    const k = idx[t];
    if (src[k] === '{') { const prelude = src.slice(prev, k).trim(); const ln = lines[t] - (src.slice(prev, k).match(/\n\s*$/) ? 0 : 0);
      stack.push({ prelude, at: k, line: lineAt(prev + (src.slice(prev, k).length - src.slice(prev, k).trimStart().length)) }); prev = k + 1; }
    else { const top = stack.pop(); if (!top) { prev = k + 1; continue; }
      const body = src.slice(top.at + 1, k);
      if (!body.includes('{')) {   // a leaf rule
        const media = stack.map((s) => s.prelude).filter((p) => p.startsWith('@')).join(' · ');
        const decls = []; for (const d of body.split(/;(?![^(]*\))/)) { const m = d.match(/^\s*([-\w]+)\s*:\s*([\s\S]+?)\s*$/); if (m) decls.push({ prop: m[1].startsWith('--') ? m[1] : m[1].toLowerCase(), value: m[2].replace(/\s+/g, ' ') })   /* a custom property is case-sensitive (--meshGold) */; }
        out.push({ file, line: top.line, selector: top.prelude.replace(/\s+/g, ' '), media, decls });
      }
      prev = k + 1; }
  }
  return out;
}
function all() { return SHEETS.filter((f) => fs.existsSync(path.join(KIT, f))).flatMap(parse); }
module.exports = { KIT, SHEETS, parse, all };
