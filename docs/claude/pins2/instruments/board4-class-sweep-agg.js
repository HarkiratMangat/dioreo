// Board 4 · class sweep aggregate (2026-09-23): groups window.__SW by class and signature so outliers show as extra variants. Diff two runs to see what a change moved.
() => { const R = JSON.parse(window.__SW); const short = (s) => String(s).replace(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)( \/ ([\d.]+))?\)/g, (m, r, g, b, x, a) => '#' + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('') + (a ? '/' + (+a).toFixed(2) : '')).replace(/rgba?\((\d+), (\d+), (\d+)(, ([\d.]+))?\)/g, (m, r, g, b, x, a) => '#' + [r, g, b].map((v) => (+v).toString(16).padStart(2, '0')).join('') + (a ? '/' + (+a).toFixed(2) : '')).replace(/oklab\([^)]*\)/g, 'oklab').replace(/ 0px 0px 0px 1px inset/g, ' ring1').slice(0, 120);
 const G = {}; const add = (k, v, ex) => { (G[k] = G[k] || { n: 0, v: new Set(), ex: new Set() }); G[k].n++; G[k].v.add(v); if (G[k].ex.size < 4) G[k].ex.add(ex); };
 for (const r of R) { const [kind, lab, where] = r; const sec = lab.split(':')[0];
  if (kind === 'tog') add(`tog ${where} ${r[3]} ${r[4]}`, `R ${short(r[5])} H ${short(r[6])}`, sec + '·' + r[7]);
  else if (kind === 'focus') add(`focus ${where} ${r[3]}`, short(r[5]), sec + '·' + r[4]);
  else if (kind === 'scroll') add(`scroll ${where} ${r[3]} ${r[4]} ${r[6]}`, 'inset ' + r[5], sec);
  else if (kind === 'x' || kind === 'copy') add(`${kind} ${where} ${r[3]} ${r[4]}`, `R ${short(r[5])} H ${short(r[6])}`, sec);
  else if (kind === 'list') add(`list ${where} ${r[3]}`, '', sec);
  else if (kind === 'bare') add(`bare ${where} ${r[3]} ${r[4]}`, `H ${short(r[6])}`, sec); }
 return Object.entries(G).sort().map(([k, g]) => `${k} ×${g.n} [${[...g.ex].join(', ')}]\n   ${[...g.v].slice(0, 3).join('\n   ')}${g.v.size > 3 ? `\n   (+${g.v.size - 3} more variants)` : ''}`).join('\n'); }
