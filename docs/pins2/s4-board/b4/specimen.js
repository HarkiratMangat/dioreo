// C1's buttons, collected under C1, each drawn ALONE by the board's own component (Harkirat 2026-10-06 20:46–20:49 EDT: "why did you
// basically render a full manifest for each button??? … that's literally what you should have done"). V22 mounted five whole ManifestStages
// to reach buttons that were written inline; those buttons are now components (ui/armory.js SortButton, CollapseAllButton, RowCheck,
// CollapseButton, ImageChip, CodeChip, ShareButton, DeleteButton; ui/manifest.js NewBuildButton, FilterChips) that the board itself draws,
// so the copy here is the same code, not a duplicate. Each sits inside the classes of the place it lives on C1 (read from C1 itself, every
// wrapper display:contents, no ids), so the kit's selectors and his builder variants style it exactly as on the board. Two buttons still live
// inside a component that is not split yet — the problem card (ProblemChip) and the selection bar (SelectionDock) — so those are drawn whole,
// once each. Cards carry the builder's readings, colours by token, and what hover, press and keyboard focus change as measured with a real
// pointer (work/lead/c1-states.cjs → b4/c1-states.js). The container is last in the DOM, shown under C1 by grid order, whole-pixel height.
import { render } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';
import { SortButton, CollapseAllButton, RowCheck, CollapseButton, ImageChip, CodeChip, ShareButton, DeleteButton, ARMORY_FILTERS } from '../ui/armory.js';
import { NewBuildButton, FilterChips } from '../ui/manifest.js';
import { ProblemChip, SelectAllBox, SelectionDock, faultsFor, Hint, CodeCell, ViewToggleButton, DeselectButton, ChipDeselectButton, ListToggleButton, EditBuildsButton, ExportButton, StageDeletionButton, ClearButton } from '../b3/armory-parts.js';
import { idsOf, rowsFor } from '../gates/lib.js';
import { fetchJson } from '../ui/httpClient.js';

const F = 'var(--ui, "Space Grotesk", sans-serif)', MONO = 'var(--mono, "JetBrains Mono", monospace)';
const CSS = `
.b4 > header,.b4 > #c-manifest{order:-2}
#c1-buttons{order:-1;box-sizing:border-box;overflow:hidden;border-top:1px solid var(--rule)}
#c1-buttons .sx-in{padding:28px 0 36px}
#c1-buttons .sx-top{display:flex;align-items:baseline;gap:16px;padding:0 0 18px}
#c1-buttons .sx-top b{font:600 22px/1.1 ${F};color:var(--ink);letter-spacing:-.01em}
#c1-buttons .sx-top span{font:400 13px/1.5 ${F};color:var(--ink3)}
#c1-buttons .sx-sec{margin:0 0 36px}
#c1-buttons .sx-sh{display:flex;align-items:baseline;gap:12px;margin:0 0 12px}
#c1-buttons .sx-sh b{font:600 15px/1.2 ${F};color:var(--ink)}
#c1-buttons .sx-sh span{font:400 12px/1.4 ${F};color:var(--ink3)}
#c1-buttons .sx-vars{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
#c1-buttons .sx-var{background:var(--paper);border-radius:12px;box-shadow:inset 0 0 0 1px var(--rule);padding:12px 16px 16px}
#c1-buttons .sx-var > i{display:block;margin:0 0 10px;font:600 12px/1.3 ${F};font-style:normal;color:var(--ink2)}
#c1-buttons .sx-cell{display:flex;align-items:center;min-height:56px;padding:0 12px;border-radius:8px}
#c1-buttons .sx-cell.end{justify-content:flex-end}
#c1-buttons .sx-kind{margin:22px 0 10px;font:600 11px/1.3 ${F};letter-spacing:.06em;text-transform:uppercase;color:var(--ink3)}
#c1-buttons .sx-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
#c1-buttons .sx-card{background:var(--paper);border-radius:12px;box-shadow:inset 0 0 0 1px var(--rule);padding:14px 16px 12px}
#c1-buttons .sx-card.wide{grid-column:1 / -1}
#c1-buttons .sx-ch{display:flex;align-items:baseline;gap:8px;margin:0 0 10px}
#c1-buttons .sx-ch em{font:600 11px/1 ${MONO};font-style:normal;color:var(--ink4);min-width:22px}
#c1-buttons .sx-ch b{font:600 14px/1.25 ${F};color:var(--ink)}
#c1-buttons .sx-ch span{margin-left:auto;font:400 11px/1.3 ${F};color:var(--ink3);text-align:right}
#c1-buttons .sx-stage{display:flex;align-items:center;justify-content:center;min-height:72px;margin:0 0 12px;padding:14px;border-radius:8px;background:var(--raised)}
#c1-buttons .sx-stage.tall{min-height:120px;justify-content:flex-start;align-items:flex-start}
#c1-buttons .sx-stage{position:relative}
#c1-buttons .sx-stage.pc{display:block;text-align:right;min-height:300px;padding:18px 40px 0 14px}
/* the selection bar is absolutely placed at the bottom of the manifest's stage on the board; here it sits in its card's flow */
#c1-buttons .sx-stage .b3-selbar{position:static!important;inset:auto!important;width:100%!important;margin:0!important}
#c1-buttons .sx-sub{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
#c1-buttons .sx-sub > div{border-top:1px solid var(--rule);padding-top:10px}
#c1-buttons .sx-sub b{display:block;margin:0 0 8px;font:600 13px/1.3 ${F};color:var(--ink)}
#c1-buttons dl{display:grid;grid-template-columns:76px minmax(0,1fr);gap:5px 10px;margin:0}
#c1-buttons dt{font:500 11px/1.45 ${F};color:var(--ink3)}
#c1-buttons dd{margin:0;font:500 11.5px/1.45 ${F};color:var(--ink);overflow-wrap:anywhere}
#c1-buttons dd small{color:var(--ink3);font-size:11px}
#c1-buttons dl hr{grid-column:1/-1;border:0;border-top:1px solid var(--rule);margin:4px 0}
#c1-buttons .sx-sw{display:inline-block;width:10px;height:10px;border-radius:3px;margin:0 5px -1px 0;box-shadow:inset 0 0 0 1px #ffffff26}
#c1-buttons .sx-none{color:var(--ink4)}
#c1-buttons .sx-off{color:var(--warn-ink, #FF9E72);text-decoration:underline dotted;text-underline-offset:3px}
#c1-buttons .sx-mx{border-radius:12px;box-shadow:inset 0 0 0 1px var(--rule);overflow:hidden}
#c1-buttons .sx-mx table{width:100%;border-collapse:collapse;font:500 12px/1.4 ${F};color:var(--ink)}
#c1-buttons .sx-mx th{text-align:left;font:600 11px/1.3 ${F};color:var(--ink3);background:var(--raised);padding:9px 10px;border-bottom:1px solid var(--rule)}
#c1-buttons .sx-mx td{padding:7px 10px;border-bottom:1px solid var(--rule);vertical-align:top}
#c1-buttons .sx-mx tr.k td{background:var(--sunk);font:600 11px/1.3 ${F};color:var(--ink2);letter-spacing:.06em;text-transform:uppercase}
#c1-buttons .sx-mx tr:not(.k):hover td{background:var(--hi)}
#c1-buttons .sx-mx td em{font:600 11px/1 ${MONO};font-style:normal;color:var(--ink4)}
#c1-buttons .sx-key{margin:0 0 12px;font:400 12px/1.4 ${F};color:var(--ink3)}
#c1-buttons .sx-c{display:contents!important}
/* a display:contents wrapper still draws its own ::before/::after (a weapon row's accent bar showed beside the problem card) */
#c1-buttons .sx-c::before,#c1-buttons .sx-c::after{content:none!important}
.sx-measure,.sx-measure *,.sx-measure *::before,.sx-measure *::after{transition:none!important;animation-play-state:paused!important}
/* #1 Collapse (his 19:15, then 21:32: "the icon still jumps all over the place … its so quick, abrupt"; 2026-10-06 22:13 EDT). The icon is pinned
   to the edge that holds (absolute), so nothing the word does can move it: V23 kept it in the grid and it swung 6px mid-open. The word's column
   opens on the board's own motion (260ms, cubic-bezier(.22,.61,.36,1), the same both ways), and the far side's padding grows 15 → 16 as on the
   board. The word fades in behind the opening and out ahead of the closing, so it is never seen cut mid-letter */
#c1-buttons :is(.sx-left2,.sx-right2) .wg-ib.wg-fbtn{position:relative!important;column-gap:0!important;grid-template-columns:0fr!important;transition:grid-template-columns 260ms cubic-bezier(.22,.61,.36,1),padding 260ms cubic-bezier(.22,.61,.36,1)!important}
#c1-buttons :is(.sx-left2,.sx-right2) .wg-ib.wg-fbtn > svg{position:absolute!important;top:50%!important;margin:0!important;translate:0 -50%!important}
#c1-buttons :is(.sx-left2,.sx-right2) .wg-ib.wg-fbtn::after{grid-column:1;grid-row:1;min-width:0!important;overflow:hidden!important;white-space:nowrap!important;margin:0!important;opacity:0!important;transform:none!important;transition:opacity 110ms linear!important}
#c1-buttons :is(.sx-left2,.sx-right2) .wg-ib.wg-fbtn:is(:hover,:focus-visible){grid-template-columns:1fr!important}
#c1-buttons :is(.sx-left2,.sx-right2) .wg-ib.wg-fbtn:is(:hover,:focus-visible)::after{opacity:1!important;transition:opacity 170ms ease-out 70ms!important}
#c1-buttons .sx-left2 .wg-ib.wg-fbtn{padding:0 calc(15px + 14px) 0 15px!important}
#c1-buttons .sx-left2 .wg-ib.wg-fbtn > svg{right:15px!important;left:auto!important}
#c1-buttons .sx-left2 .wg-ib.wg-fbtn::after{justify-self:end}
#c1-buttons .sx-left2 .wg-ib.wg-fbtn:is(:hover,:focus-visible){padding:0 calc(15px + 14px + var(--k-g6)) 0 16px!important}
#c1-buttons .sx-right2 .wg-ib.wg-fbtn{padding:0 15px 0 calc(15px + 14px)!important}
#c1-buttons .sx-right2 .wg-ib.wg-fbtn > svg{left:15px!important;right:auto!important}
#c1-buttons .sx-right2 .wg-ib.wg-fbtn::after{justify-self:start}
#c1-buttons .sx-right2 .wg-ib.wg-fbtn:is(:hover,:focus-visible){padding:0 16px 0 calc(15px + 14px + var(--k-g6))!important}`;

// the buttons, in reading order of C1; `on` finds the real one on C1 (for its count, its size there and the classes around it)
const TYPES = [
  { k: 'Buttons with words', name: 'New build', on: '.mtools button.pill.lead.madd', draw: 'newbuild' },
  { k: 'Chips', name: 'Category chip · All', on: '.mtools button.chip:not(.topic)', draw: 'chips', pick: 'button.chip:not(.topic)' },
  { k: 'Chips', name: 'Category chip', on: '.mtools button.chip.topic', draw: 'chips', pick: 'button.chip.topic' },
  { k: 'Checkboxes', name: 'Select all', on: '.wg-heads .b3-allcb', draw: 'selectall' },
  { k: 'Chips', name: 'Sort', on: '.wg-heads .wg-sort', draw: 'sort' },
  { k: 'Buttons with words', name: 'Collapse all', on: '.wg-heads .wg-fold', draw: 'collapseall' },
  { k: 'Checkboxes', name: 'Select a weapon’s builds', on: '.wg-h .wg-cb', draw: 'checkw' },
  { k: 'Buttons with words', name: 'Problem chip · weapon row', on: '.wg-h button.b3-fchip', draw: 'problem', pick: '.wg-h button.b3-fchip, button.b3-fchip' },
  { k: 'Icon buttons', name: 'Collapse · weapon row', on: '.wg-h .wg-fbtn', draw: 'collapse' },
  { k: 'Checkboxes', name: 'Select a build', on: '.wg-r .wg-cb', draw: 'checkb' },
  { k: 'Chips', name: 'Copy code', on: '.wg-r .wg-code', draw: 'code' },
  { k: 'Chips', name: 'Copy code · code doesn’t match', on: '.wg-r .wg-code', onTest: (e) => !!e.querySelector('.wg-ct.bad'), draw: 'codebad' },
  { k: 'Icon buttons', name: 'Build image · has one', on: '.wg-r button.b3-fchip', onTest: (e) => !/has no/i.test(e.getAttribute('aria-label') || ''), draw: 'image' },
  { k: 'Icon buttons', name: 'Build image · none', on: '.wg-r button.b3-fchip', onTest: (e) => /has no/i.test(e.getAttribute('aria-label') || ''), draw: 'noimage' },
  { k: 'Icon buttons', name: 'Share', on: '.wg-r .wg-share', draw: 'share' },
  { k: 'Icon buttons', name: 'Delete', on: '.wg-r .wg-del', draw: 'delete' },
  { k: 'Problem card', name: 'Open build', in: 'pc', pick: '.b3-pc-open' },
  { k: 'Problem card', name: 'Close', in: 'pc', pick: '.b3-pc-x' },
  { k: 'Selection bar', name: 'View toggle', bar: '.b3-sd-vt > button', draw: 'view', pick: 'button:not(.on)' },
  { k: 'Selection bar', name: 'Deselect a weapon or build', bar: '.b3-sd .b3-x', draw: 'deselect' },
  { k: 'Selection bar', name: 'Problem mark · list', bar: '.b3-sd button.b3-fchip', draw: 'mark', pick: 'button.b3-fchip' },
  { k: 'Selection bar', name: 'Copy code · list', bar: '.b3-sd .b3-sd-code', draw: 'codecell', pick: '.b3-sd-code' },
  { k: 'Selection bar', name: 'List toggle', bar: '.b3-sd .b3-sd-tog', draw: 'listtog', pick: '.b3-sd-tog' },
  { k: 'Selection bar', name: 'Edit builds', bar: '.b3-sd .b3-sd-edit', draw: 'edit' },
  { k: 'Selection bar', name: 'Export', bar: '.b3-sd .b3-sd-exp', draw: 'export' },
  { k: 'Selection bar', name: 'Stage deletion', bar: '.b3-sd .b3-btn2.dang', draw: 'stagedel' },
  { k: 'Selection bar', name: 'Clear', bar: '.b3-sd .b3-btn2.quiet', draw: 'clear' },
  { k: 'Selection bar', name: 'Deselect · bar chip', bar: '.b3-sc > button', barShut: true, draw: 'chipx' },
].map((t, i) => ({ ...t, n: i + 1 }));
const KINDS = ['Buttons with words', 'Icon buttons', 'Chips', 'Checkboxes', 'Problem card', 'Selection bar'];
const SET = { text: [9, 11, 13, 15], gap: [6, 10, 14, 20, 26, 32], h: [44, 32] };
const near = (v, list) => list.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a, list[0]);
const mark = (v, list) => { if (v == null || v === '') return ''; const n = near(+v, list); return Math.abs(n - v) < 0.26 ? `${v}` : `<span class="sx-off" title="not in your set; nearest ${n}">${v}</span>`; };

const M = () => window.BD && BD.measure, S = () => window.BD && BD.std;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const realOf = (T) => { const g = document.getElementById('c-manifest'); return g && T.on ? [...g.querySelectorAll(T.on)].filter((e) => (!T.onTest || T.onTest(e)) && e.getClientRects().length) : []; };

// colours by token, rings and states in plain words (unchanged from V22)
const rgba = (c) => { let m = (c || '').match(/rgba?\(([^)]+)\)/); if (m) { const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; }
  m = (c || '').match(/color\(srgb\s+([^)]+)\)/); if (m) { const v = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [v[0] * 255, v[1] * 255, v[2] * 255, v.length > 3 ? v[3] : 1]; } return null; };
const rgbKey = (v) => v.slice(0, 3).map((x) => Math.round(x)).join(',');
let TOK = null;
function tokens() { if (TOK) return TOK; TOK = new Map(); const probe = document.createElement('i'); probe.style.display = 'none'; document.body.appendChild(probe);
  const names = new Set(); for (const s of document.styleSheets) { let rs; try { rs = s.cssRules; } catch (e) { continue; } for (const r of rs) if (r.selectorText === ':root') for (const p of r.style) if (p.startsWith('--')) names.add(p); }
  for (const n of names) { if (/rad|ease|dur|^--t-|^--tr-|gap|shadow|-w$|-h$|tap|inset|lift|press/.test(n)) continue; probe.style.color = ''; probe.style.color = `var(${n})`; if (!probe.style.color) continue; const v = rgba(getComputedStyle(probe).color); if (v && v[3] === 1 && !TOK.has(rgbKey(v))) TOK.set(rgbKey(v), n); }
  probe.remove(); return TOK; }
const hex = (c) => { const v = rgba(c); if (!v) return c; return '#' + v.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase(); };
const clear = (c) => { if (!c || c === 'transparent' || c === 'none') return true; const v = rgba(c); return !!v && v[3] === 0; };
const colour = (c) => { if (clear(c)) return '<span class="sx-none">none</span>'; const v = rgba(c); const k = v ? rgbKey(v) : ''; const name = k === '0,0,0' ? 'black' : k === '255,255,255' ? 'white' : v ? tokens().get(k) : null; const a = v && v[3] < 1 ? ` at ${Math.round(v[3] * 100)}%` : '';
  return `<span class="sx-sw" style="background:${c}"></span>${esc((name || hex(c)) + a)}`; };
const ring = (sh) => { if (!sh || sh === 'none') return null; const parts = sh.split(/,(?![^(]*\))/).map((x) => x.trim()); const out = [];
  for (const p of parts) { const col = (p.match(/rgba?\([^)]*\)|color\([^)]*\)/) || [''])[0]; const nums = p.replace(col, '').match(/-?[\d.]+px/g) || []; const inset = /inset/.test(p); const spread = nums[3] ? parseFloat(nums[3]) : 0; const blur = nums[2] ? parseFloat(nums[2]) : 0;
    if (clear(col)) continue; out.push(spread && !blur ? `${spread}px ${inset ? 'ring' : 'outer ring'} ${colour(col)}` : 'soft shadow'); }
  return out.length ? out.join(' · ') : null; };
function paintOf(el) { const T = M().paintTarget(el) || { el, part: 'self' }; const part = T.part && T.part !== 'self' ? T.part : null; return { el: T.el || el, part, cs: getComputedStyle(T.el || el, part) }; }
function partName(e, pe, el) { const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
  const nm = e === el ? 'the button' : e instanceof SVGElement ? 'icon' : own ? `“${own.slice(0, 18)}”` : (e.getAttribute('aria-label') || e.title) ? `“${(e.getAttribute('aria-label') || e.title).slice(0, 18)}”` : `inner ${e.classList[0] ? '.' + e.classList[0] : e.tagName.toLowerCase()}`;
  return pe ? `${nm} ${pe === '::before' ? '(under)' : '(over)'}` : nm; }
function partsOf(el, P) { const out = {}; const list = [el, ...[...el.querySelectorAll('*')].filter((e) => !(e.parentElement instanceof SVGElement) && e.tagName.toLowerCase() !== 'use').slice(0, 24)];
  for (const e of list) for (const pe of [null, '::before', '::after']) { if (P && e === P.el && (pe || 'self') === (P.part || 'self')) continue; if (e === el && !pe) continue; const c = getComputedStyle(e, pe); if (pe && (c.content === 'none' || c.content === 'normal')) continue;
    out[partName(e, pe, el)] = [c.backgroundColor, c.color, c.boxShadow, c.borderTopColor + ' ' + c.borderTopWidth, c.opacity, c.transform, c.borderTopLeftRadius].join('|'); }
  return out; }
function look(el) { const P = paintOf(el); const c = P.cs; const tx = [...el.querySelectorAll('*'), el].find((x) => [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) || el; const svg = el.querySelector('svg');
  return { fill: c.backgroundImage && c.backgroundImage !== 'none' && /gradient/.test(c.backgroundImage) ? 'gradient' : c.backgroundColor, edgeW: parseFloat(c.borderTopWidth) || 0, edgeC: c.borderTopColor, edgeS: c.borderTopStyle, shadow: c.boxShadow,
    text: getComputedStyle(tx).color, icon: svg ? getComputedStyle(svg).color : null, transform: getComputedStyle(el).transform, opacity: getComputedStyle(el).opacity, ptransform: c.transform, filter: c.filter, parts: partsOf(el, P) }; }
function changes(a, b) {
  const o = [];
  if (a.fill !== b.fill) o.push(`fill ${clear(a.fill) ? 'none' : colour(a.fill)} → ${colour(b.fill)}`);
  if ((a.edgeW || b.edgeW) && (a.edgeW !== b.edgeW || a.edgeC !== b.edgeC)) o.push(`outline ${a.edgeW ? a.edgeW + 'px ' + colour(a.edgeC) : 'none'} → ${b.edgeW ? b.edgeW + 'px ' + colour(b.edgeC) : 'none'}`);
  if ((ring(a.shadow) || 'none') !== (ring(b.shadow) || 'none')) o.push(`ring ${ring(a.shadow) || 'none'} → ${ring(b.shadow) || 'none'}`);
  if (a.text !== b.text) o.push(`words ${colour(a.text)} → ${colour(b.text)}`);
  if (a.icon !== b.icon && b.icon) o.push(`icon ${colour(a.icon)} → ${colour(b.icon)}`);
  const mv = new Set(); for (const k of ['transform', 'ptransform']) if (a[k] !== b[k]) { const m = (b[k] || '').match(/matrix\(([^)]+)\)/); const v = m ? m[1].split(',').map(Number) : null; mv.add(v ? `moves${v[5] ? (v[5] > 0 ? ' down ' : ' up ') + Math.abs(+v[5].toFixed(2)) + 'px' : ''}${v[4] ? ' across ' + +v[4].toFixed(2) + 'px' : ''}${v[0] !== 1 ? ' · scale ' + +v[0].toFixed(3) : ''}` : (b[k] === 'none' ? 'moves back' : `transform → ${b[k]}`)); } o.push(...mv);
  if (a.opacity !== b.opacity) o.push(`opacity ${a.opacity} → ${b.opacity}`);
  if (a.filter !== b.filter) o.push(`filter → ${b.filter}`);
  for (const [k, va] of Object.entries(a.parts || {})) { const vb = (b.parts || {})[k]; if (!vb || va === vb || (k === 'icon' && a.icon !== b.icon)) continue; const A = va.split('|'), B = vb.split('|'); const d = [];
    if (A[0] !== B[0]) d.push(`fill ${colour(A[0])} → ${colour(B[0])}`); if (A[1] !== B[1]) d.push(`colour ${colour(A[1])} → ${colour(B[1])}`); if ((ring(A[2]) || 'none') !== (ring(B[2]) || 'none')) d.push(`ring ${ring(A[2]) || 'none'} → ${ring(B[2]) || 'none'}`);
    if (A[3] !== B[3] && (parseFloat(A[3].split(' ').pop()) || parseFloat(B[3].split(' ').pop()))) d.push('outline changes'); if (A[4] !== B[4]) d.push(`opacity ${A[4]} → ${B[4]}`); if (A[5] !== B[5]) d.push('moves');
    if (d.length) o.push(`<small>${esc(k)}:</small> ${d.join(' · ')}`); }
  return o.length ? o.join('<br>') : '<span class="sx-none">no change</span>';
}
function motion(el) { const P = paintOf(el); const rows = []; for (const [who, c] of [['', getComputedStyle(el)], P.part ? ['its box ', P.cs] : null].filter(Boolean)) { const ps = c.transitionProperty.split(','), ds = c.transitionDuration.split(',');
  ps.forEach((p, i) => { const d = parseFloat(ds[i % ds.length]); if (!d || p.trim() === 'none') return; rows.push(`${who}${p.trim()} ${Math.round(d * 1000)}ms`); }); } return rows.length ? rows.slice(0, 6).join(' · ') : '<span class="sx-none">none</span>'; }

const LBL = { msize: 'dot', nfs: 'count size', nfw: 'count weight', bh: 'badge height', bfs: 'badge text' };
function spec(el, T) {
  const kind = M().kindOf(el); const kn = (S().KNOBS[kind] || []); const v = {}; for (const x of kn) { try { const r = x.read(el); if (r != null && r !== '' && !(typeof r === 'number' && isNaN(r))) v[x.k] = typeof r === 'number' ? +r.toFixed(2) : r; } catch (e) {} }
  const lab = Object.fromEntries(kn.map((x) => [x.k, x.label || x.k]));
  const ext = M().drawnExtent ? M().drawnExtent(el) : null; const W = ext ? +ext.width.toFixed(2) : null, H = ext ? +ext.height.toFixed(2) : null; const hh = v.height != null ? v.height : H;
  const words = (el.innerText || '').trim().length > 0; const rest = look(el); const L = [];
  const real = realOf(T)[0]; const re = real && M().drawnExtent ? M().drawnExtent(real) : null;
  L.push(['Size', `${W} × ${mark(H, SET.h)}${v.height != null && Math.abs(v.height - H) > 0.5 ? ` <small>· hit area ${v.height}</small>` : ''}${re && (Math.abs(re.width - W) > 0.6 || Math.abs(re.height - H) > 0.6) ? ` <small>· on C1 ${+re.width.toFixed(2)} × ${+re.height.toFixed(2)}</small>` : ''}`]);
  if (v.radius != null) L.push(['Corners', hh && v.radius >= hh / 2 - 0.5 ? `round <small>(${v.radius})</small>` : (Math.abs(v.radius - hh * 0.25) < 0.26 ? v.radius : `<span class="sx-off" title="your rule: height × 0.25 = ${hh * 0.25}">${v.radius}</span>`)]);
  const txt = !words ? [] : [v.fs && mark(v.fs, SET.text), v.fw && `${v.fw}`, v.cls ? `spacing ${v.cls}` : null, v.clh ? `line ${v.clh}` : null, v.ctt && v.ctt !== 'none' ? 'capitals' : null].filter(Boolean); if (txt.length) L.push(['Text', txt.join(' · ')]);
  if (v.icon) L.push(['Icon', `${v.icon}`]);
  const pad = [['padL', 'left'], ['padR', 'right'], ['padT', 'top'], ['padB', 'bottom'], ['iin', 'before icon']].filter(([k]) => v[k] != null).map(([k, l]) => `${l} ${v[k]}`); if (pad.length) L.push(['Inside', pad.join(' · ')]);
  const gaps = ['iout', 'gap', 'gap2', 'gap3', 'gap4'].filter((k) => v[k] != null && !(k === 'iout' && v.gap != null)).map((k) => `${(lab[k] || k).toLowerCase()} ${mark(v[k], SET.gap)}`); if (gaps.length) L.push(['Gaps', gaps.join(' · ')]);
  const extra = ['msize', 'nfs', 'nfw', 'bh', 'bfs'].filter((k) => v[k] != null).map((k) => `${LBL[k]} ${v[k]}`); if (extra.length) L.push(['Parts', extra.join(' · ')]);
  L.push(['Outline', rest.edgeW ? `${rest.edgeW}px ${rest.edgeS !== 'solid' ? rest.edgeS + ' ' : ''}${colour(rest.edgeC)}` : (ring(rest.shadow) || '<span class="sx-none">none</span>')]);
  L.push(['Fill', rest.fill === 'gradient' ? 'gradient' : colour(rest.fill)]);
  if (words) L.push(['Words', colour(rest.text)]); if (rest.icon && (!words || rest.icon !== rest.text)) L.push(['Icon colour', colour(rest.icon)]);
  L.push(['hr']);
  const M0 = window.C1_STATES && window.C1_STATES[T.n]; const nm = '<span class="sx-none">not measured yet</span>';
  L.push(['Hover', M0 ? M0.hover : nm]); L.push(['Press', M0 ? M0.press : nm]); L.push(['Keyboard', M0 ? M0.focus : nm]);
  const st = el.getAttribute('aria-pressed') || el.getAttribute('aria-checked') || el.getAttribute('aria-expanded'); if (st) L.push(['Now', `${el.hasAttribute('aria-expanded') ? 'open' : 'selected'}: ${st}`]);
  L.push(['Motion', motion(el)]);
  L.raw = { v, W, H, rest, words, hh };
  return L;
}
const dl = (L) => `<dl>${L.map(([k, v]) => k === 'hr' ? '<hr>' : `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`;

// the classes around the real button on C1, as display:contents wrappers (no ids), so the copy is styled as the board styles it
function chainOf(el) { const out = []; for (let a = el && el.parentElement; a && a.id !== 'board' && !a.classList.contains('b4'); a = a.parentElement) { out.unshift({ tag: a.tagName.toLowerCase(), attrs: [...a.attributes].filter((x) => x.name !== 'id' && x.name !== 'data-sx-hl').map((x) => [x.name, x.value]) }); if (a.classList.contains('pb-gate')) break; } return out; }
function wrap(host, chain) { let h = host; for (const a of chain) { const w = document.createElement(a.tag); for (const [k, v] of a.attrs) { try { w.setAttribute(k, v); } catch (e) {} } w.classList.add('sx-c'); h.appendChild(w); h = w; } return h; }
const STAGE_CHAIN = [{ tag: 'section', attrs: [['class', 'pb-gate pb-realm app b4g'], ['data-realm', 'armory']] }, { tag: 'div', attrs: [['class', 'pb-stage g-stage']] }];

// small live demos: each button with its own state, nothing reaches the board's store
function Toggle({ C, mk }) { const [s, set] = useState(false); return mk(s, () => set(!s)); }
function Flash({ mk, text }) { const [s, set] = useState(false); return mk(s, () => { try { navigator.clipboard.writeText(text || ''); } catch (e) {} set(true); setTimeout(() => set(false), 1200); }); }
function Check({ label, start }) { const [st, set] = useState(start); return html`<${RowCheck} state=${st} on=${st === 'true'} label=${label} onToggle=${() => set(st === 'true' ? 'false' : 'true')} />`; }
function AllBox({ ids }) { const [sel, setSel] = useState(new Set()); return html`<${SelectAllBox} ids=${ids} selected=${sel} setMany=${(xs, on) => { const n = new Set(sel); xs.forEach((x) => (on ? n.add(x) : n.delete(x))); setSel(n); }} />`; }
function Chips({ groups }) { const [f, set] = useState({}); return html`<${FilterChips} groups=${groups} filters=${f} onChange=${set} />`; }
const noop = () => {};

let building = false; let ROWS = [];
// one card that fails to draw shows its error and the rest still draw (a throw inside one render stopped the whole container)
const safe = (vnode, host, label) => { try { render(vnode, host); } catch (e) { (window.__sxErr = window.__sxErr || []).push(label + ': ' + (e && e.message)); host.textContent = 'error: ' + (e && e.message); } };
async function build() {
  const g = document.getElementById('c-manifest'); if (building || !g || document.getElementById('c1-buttons')) return; building = true;
  if (!document.getElementById('sx-css')) { const s = document.createElement('style'); s.id = 'sx-css'; s.textContent = CSS; document.head.appendChild(s); }
  const box = document.createElement('section'); box.id = 'c1-buttons'; box.setAttribute('data-bd-specimen', ''); const inner = document.createElement('div'); inner.className = 'sx-in'; box.appendChild(inner); g.parentElement.appendChild(box);
  const snap = () => { box.style.height = Math.ceil(inner.getBoundingClientRect().height) + 'px'; }; new ResizeObserver(snap).observe(inner);
  const data = await fetchJson('/api/armory').catch(() => null); const builds = (data && (data.builds || (data.data && data.data.builds))) || [];
  const pickB = (w, i = 0) => builds.filter((b) => b.weaponName === w)[i];
  const bOk = pickB('BAL-27') || builds[0], bBad = builds.find((b) => (b.coverage || []).includes('code-length-mismatch')) || bOk, bNo = builds.find((b) => !b.imageKey) || bOk;
  const rows = rowsFor(builds, ['PP19 BIZON', 'BAL-27'], 'MP').map((r) => ({ ...r, accentHex: r.accent })); // the rows the board's own stage hands the selection bar (its chips matched no ids with raw builds)
  const ids = [...idsOf(builds, 'PP19 BIZON').slice(0, 2), ...idsOf(builds, 'BAL-27').slice(0, 1)];
  const counts = new Map(); for (const b of builds.filter((x) => (x.mode || 'MP') !== 'DMZ')) { const c = counts.get(b.category); if (c) c.count++; else counts.set(b.category, { count: 1, hex: b.accent }); }
  const order = (typeof CATEGORY_CHIP_ORDER !== 'undefined' ? CATEGORY_CHIP_ORDER : [...counts.keys()]).filter((c) => counts.has(c));
  const groups = [{ key: 'category', label: 'Category', topic: true, options: order.map((c) => ({ value: c, label: (typeof CATEGORY_CHIP_LABEL !== 'undefined' && CATEGORY_CHIP_LABEL[c]) || c, count: counts.get(c).count, hex: counts.get(c).hex })) }];
  const DRAW = {
    newbuild: () => html`<${NewBuildButton} onAdd=${noop} addLabel="New build" />`,
    chips: () => html`<${Chips} groups=${groups} />`,
    selectall: () => html`<${AllBox} ids=${builds.slice(0, 24).map((b) => b.id)} />`,
    sort: () => html`<${Toggle} mk=${(s, t) => html`<${SortButton} dir=${s ? 'desc' : 'asc'} onSort=${t} />`} />`,
    collapseall: () => html`<${Toggle} mk=${(s, t) => html`<${CollapseAllButton} allShut=${s} onToggle=${t} />`} />`,
    checkw: () => html`<${Check} label="Select every BAL-27 build" start="mixed" />`,
    problem: () => html`<${ProblemChip} weapon=${bBad.weaponName} faulty=${[{ b: bBad, n: 1, f: faultsFor(bBad) }]} builds=${builds} onOpen=${noop} />`,
    collapse: () => html`<${Toggle} mk=${(s, t) => html`<${CollapseButton} name="BAL-27" shut=${s} onToggle=${t} />`} />`,
    checkb: () => html`<${Check} label="Select BAL-27 build 1" start="false" />`,
    code: () => html`<${Flash} text=${bOk.shareCode} mk=${(s, t) => html`<${CodeChip} b=${bOk} copied=${s} onCopy=${t} />`} />`,
    codebad: () => html`<${Flash} text=${bBad.shareCode} mk=${(s, t) => html`<${CodeChip} b=${bBad} copied=${s} onCopy=${t} />`} />`,
    image: () => html`<${ImageChip} b=${bOk} />`,
    noimage: () => html`<${ImageChip} b=${bNo} />`,
    share: () => html`<${Flash} text="/gunsmiths search" mk=${(s, t) => html`<${ShareButton} copied=${s} onCopy=${t} />`} />`,
    delete: () => html`<${DeleteButton} label="Stage deletion of BAL-27 build 1" onRemove=${noop} />`,
    view: () => html`<${Toggle} mk=${(s, t) => html`<${ViewToggleButton} label="By weapon" icon="layers" on=${!s} onPick=${() => s && t()} /><${ViewToggleButton} label="One table" icon="table" on=${s} onPick=${() => !s && t()} />`} />`,
    deselect: () => html`<${DeselectButton} label="Deselect BAL-27 build 5" onDeselect=${noop} />`,
    mark: () => html`<${ProblemChip} weapon=${bOk.weaponName} faulty=${[{ b: bOk, n: 1 }]} builds=${builds} onOpen=${noop} compact=${true} tone="ok" /><${ProblemChip} weapon=${bBad.weaponName} faulty=${[{ b: bBad, n: 1 }]} builds=${builds} onOpen=${noop} compact=${true} />`,
    codecell: () => html`<${CodeCell} b=${bOk} />`,
    listtog: () => html`<${ListToggleButton} open=${false} onToggle=${noop} /><${ListToggleButton} open=${true} onToggle=${noop} />`,
    edit: () => html`<${EditBuildsButton} count=${3} onEdit=${noop} />`,
    export: () => html`<${ExportButton} onExport=${noop} />`,
    stagedel: () => html`<${Hint} set=${1} title="Nothing is deleted yet" sub="Discard on Review and every build comes back." steps=${[['Staged', 'on', 'trash-2', 'now'], ['Review', 'next', 'eye', 'you commit'], ['Removed', 'end', 'x', 'only then']]} id="b3-del-hint-sx" tone="del"><${StageDeletionButton} onDelete=${noop} /><//>`,
    clear: () => html`<${ClearButton} onClear=${noop} />`,
    chipx: () => html`<${ChipDeselectButton} label="Deselect BAL-27" onDeselect=${noop} />`,
  };
  const head = (T) => { const n = realOf(T).length; return `<div class="sx-ch"><em>${T.n}</em><b>${esc(T.name)}</b><span>${n ? 'on C1 now: ' + n : (T.in === 'pc' ? 'only while a problem card is open' : T.bar ? 'only while builds are picked' : 'not on C1 right now')}</span></div>`; };
  const ROOTS = {}; const sec = (title, sub) => { const s = document.createElement('div'); s.className = 'sx-sec'; s.innerHTML = `<div class="sx-sh"><b>${esc(title)}</b><span>${esc(sub)}</span></div>`; inner.appendChild(s); return s; };
  inner.insertAdjacentHTML('afterbegin', `<div class="sx-top"><b>C1 · buttons</b><span>${TYPES.length} buttons, each drawn alone by the same component the board uses. Sizes are what the builder measures.</span></div>`);
  // the sections, in their order on the page
  const A = sec('1 · Collapse, three ways', 'Hover each. Today’s, then two where the icon holds still: opening to the left, and to the right.');
  const MX = sec('2 · All ' + TYPES.length + ', side by side', 'One row per button, grouped by kind.');
  const C = sec('3 · Each button, alone', 'Live: hover, press, Tab, copy, collapse, sort and pick all work. Delete, New build and the bar’s actions do nothing here.');
  const P = sec('4 · Problem card', 'The weapon row’s problem chip, opened. Click the chip to open and close it.');
  const D = sec('5 · The selection bar, whole', 'Where its buttons live: three builds picked, the list open, then the same bar with the list closed.');
  // 1 · Collapse, three ways
  const vg = document.createElement('div'); vg.className = 'sx-vars'; A.appendChild(vg); const fbReal = realOf(TYPES.find((t) => t.draw === 'collapse'))[0];
  for (const [lab, cls, end] of [['Today', '', true], ['Smooth · opens left (the word comes in before the icon)', 'sx-left2', true], ['Smooth · opens right', 'sx-right2', false]]) { const v = document.createElement('div'); v.className = 'sx-var'; v.innerHTML = `<i>${lab}</i>`; const cell = document.createElement('div'); cell.className = `sx-cell ${end ? 'end' : ''} ${cls}`; cell.style.background = 'var(--raised)'; v.appendChild(cell); vg.appendChild(v);
    render(html`<${Toggle} mk=${(s, t) => html`<${CollapseButton} name="BAL-27" shut=${s} onToggle=${t} />`} />`, wrap(cell, chainOf(fbReal))); }
  // 4 and 5 first: the bar's buttons are drawn alone inside the classes of their place in this real bar
  const pc = document.createElement('div'); pc.className = 'sx-card wide'; pc.innerHTML = '<div class="sx-stage pc"></div><div class="sx-sub"></div>'; P.appendChild(pc);
  const pst = pc.querySelector('.sx-stage'); const pReal = realOf(TYPES.find((t) => t.draw === 'problem'))[0]; render(html`<${ProblemChip} weapon=${bBad.weaponName} faulty=${[{ b: bBad, n: 1, f: faultsFor(bBad) }]} builds=${builds} onOpen=${noop} />`, wrap(pst, pReal ? chainOf(pReal) : STAGE_CHAIN));
  const dc = document.createElement('div'); dc.className = 'sx-card wide'; dc.innerHTML = '<div class="sx-stage tall"></div><div class="sx-stage tall"></div>'; D.appendChild(dc);
  const [dOpen, dShut] = dc.querySelectorAll('.sx-stage'); const dockChain = chainOf(g.querySelector('.wg-wrap'));
  const dock = () => html`<${SelectionDock} ids=${ids} rows=${rows} builds=${builds} onClear=${noop} onDeselect=${noop} onEdit=${noop} onExport=${noop} onDelete=${noop} />`;
  render(dock(), wrap(dOpen, dockChain.length ? dockChain : STAGE_CHAIN)); render(dock(), wrap(dShut, dockChain.length ? dockChain : STAGE_CHAIN));
  const until = async (fn, ms = 8000) => { const t0 = Date.now(); for (;;) { const r = fn(); if (r) return r; if (Date.now() - t0 > ms) return null; await new Promise((z) => setTimeout(z, 100)); } };
  await until(() => dOpen.querySelector('.b3-sd-tog') && dShut.querySelector('.b3-sc') && pst.querySelector('.b3-fchip'));
  const tog = dOpen.querySelector('.b3-sd-tog'); if (tog && tog.getAttribute('aria-expanded') !== 'true') tog.click();
  await until(() => dOpen.querySelector('.b3-sd .b3-x') && dOpen.querySelector('.b3-sd .b3-sd-code'));
  const chip = pst.querySelector('.b3-fchip'); if (chip) chip.click(); await until(() => pst.querySelector('.b3-pc-open'), 3000);
  const opaque = (el) => { for (let a = el && el.parentElement; a && a !== document.body; a = a.parentElement) { const bg = getComputedStyle(a).backgroundColor; const v = rgba(bg); if (v && v[3] >= 0.95) return bg; } return null; };
  // 3 · each button alone
  for (const k of KINDS) { const ts = TYPES.filter((t) => t.k === k && t.draw); if (!ts.length) continue; C.insertAdjacentHTML('beforeend', `<div class="sx-kind">${k}</div>`); const grid = document.createElement('div'); grid.className = 'sx-cards'; C.appendChild(grid);
    for (const T of ts) { const c = document.createElement('div'); c.className = 'sx-card'; c.setAttribute('data-sx-n', T.n); c.innerHTML = head(T) + '<div class="sx-stage"></div><div class="sx-spec"></div>'; grid.appendChild(c); const st = c.querySelector('.sx-stage');
      const src = T.bar ? (T.barShut ? dShut : dOpen).querySelector(T.bar) : realOf(T)[0]; const bg = opaque(src); if (bg) st.style.background = bg;
      ROOTS[T.n] = st; safe(DRAW[T.draw](), wrap(st, src ? chainOf(src) : STAGE_CHAIN), T.name); } }
  for (const T of TYPES) if (T.in === 'pc') ROOTS[T.n] = pst;
  const elOf = (T) => { const r = ROOTS[T.n]; if (!r) return null; const sel = T.pick || 'button, [role=checkbox]'; return [...r.querySelectorAll(sel)].filter((e) => (!T.test || T.test(e)) && e.getClientRects().length)[0] || null; };
  const draw = () => { ROWS = [];
    for (const T of TYPES.filter((t) => t.draw)) { const c = inner.querySelector(`.sx-card[data-sx-n="${T.n}"] .sx-spec`); const el = elOf(T); if (!c) continue; if (!el) { c.innerHTML = '<dl><dt>Live</dt><dd class="sx-none">not drawn</dd></dl>'; continue; } const L = spec(el, T); ROWS.push({ T, L }); c.innerHTML = dl(L); }
    const sub = pc.querySelector('.sx-sub'); sub.innerHTML = ''; for (const T of TYPES.filter((t) => t.in === 'pc')) { const el = elOf(T); const d = document.createElement('div'); d.setAttribute('data-sx-n', T.n); if (!el) { d.innerHTML = `<b>${T.n} · ${esc(T.name)}</b><dl><dt>Live</dt><dd class="sx-none">not drawn</dd></dl>`; } else { const L = spec(el, T); ROWS.push({ T, L }); d.innerHTML = `<b>${T.n} · ${esc(T.name)}</b>` + dl(L); } sub.appendChild(d); }
    MX.querySelector('.sx-mxw') && MX.querySelector('.sx-mxw').remove(); const w = document.createElement('div'); w.className = 'sx-mxw'; w.innerHTML = matrix(); MX.appendChild(w);
    snap(); };
  draw(); window.__sx = { TYPES, find: (r, T) => { const sel = T.pick || 'button, [role=checkbox]'; return [...r.querySelectorAll(sel)].filter((e) => !T.test || T.test(e)); }, rootOf: (n) => ROOTS[n], look, changes, motion, pc: pst }; window.__sxReady = true;
  let t = null; const again = () => { clearTimeout(t); t = setTimeout(draw, 400); };
  try { if (S() && S().onChange) S().onChange(again); } catch (e) {}
}
function matrix() {
  const cell = (x) => x == null || x === '' ? '<span class="sx-none">–</span>' : x;
  const rowOf = ({ T, L }) => { const r = L.raw; const v = r.v; const corner = (L.find((x) => x[0] === 'Corners') || [])[1] || ''; const pad = [v.padL, v.padR].filter((x) => x != null).join(' / '); const hov = (L.find((x) => x[0] === 'Hover') || [])[1] || '';
    return `<tr data-sx-n="${T.n}"><td><em>${T.n}</em></td><td>${esc(T.name)}</td><td>${r.W} × ${mark(r.H, SET.h)}</td><td>${cell(corner)}</td><td>${cell(r.words && v.fs ? mark(v.fs, SET.text) + ' · ' + v.fw : '')}</td><td>${cell(v.icon)}</td><td>${cell(pad)}</td><td>${(L.find((x) => x[0] === 'Outline') || [])[1]}</td><td>${(L.find((x) => x[0] === 'Fill') || [])[1]}</td><td>${hov}</td></tr>`; };
  const body = KINDS.map((k) => { const rs = ROWS.filter((x) => x.T.k === k).sort((a, z) => a.T.n - z.T.n); return rs.length ? `<tr class="k"><td colspan="10">${k}</td></tr>` + rs.map(rowOf).join('') : ''; }).join('');
  return `<div class="sx-key"><span class="sx-off">Underlined</span> values are not in your agreed sets (text 9 · 11 · 13 · 15, gaps 6 · 10 · 14 · 20 · 26 · 32, controls 44 and 32, corners = height × 0.25).</div><div class="sx-mx"><table><thead><tr><th>#</th><th>Button</th><th>Size</th><th>Corners</th><th>Text</th><th>Icon</th><th>Inside L / R</th><th>Outline</th><th>Fill</th><th>Hover changes</th></tr></thead><tbody>${body}</tbody></table></div>`;
}
setInterval(() => { if (document.querySelector('#c-manifest .wg-h') && window.BD && BD.measure && BD.std && !document.getElementById('c1-buttons')) build(); }, 600);
