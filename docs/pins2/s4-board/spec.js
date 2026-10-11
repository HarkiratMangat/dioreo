// C1 Button Spec (v6, 2026-10-07 16:47 EDT): the spec board that becomes the design system, piece by piece. Drawn with the board's own Preact
// components, standing in the board's own surroundings (the ancestor chains board-probe.cjs reads off the live board), with the board's data.
// spec.css sets geometry only. Every number is MEASURED from the rendered element and coloured by what it measures (height yellow · padding light
// blue · gap green · icon purple · corner orange · click area dim); a miss shows "≠ spec" on red. A line describing what a button does (outline at
// rest, what changes on hover) is never written by hand: it is printed from computed styles measured at rest and under a real mouse — the board's
// (spec-img/board-facts.json) for the board's special cases, this page's own (spec-img/spec-facts.json) for the rest.
import { render } from './vendor/preact.mjs';
import { html } from './vendor/htm-preact.mjs';
import { useState, useRef, useLayoutEffect, useEffect } from './vendor/preact-hooks.mjs';
import './b3/state.js';
import { Icon } from './ui/icons.js';
import { NewBuildButton, SearchField, FilterChips } from './ui/manifest.js';
import { StageMinBtn, WeaponField, CategoryField, AttachmentRow } from './b4/form.js';
import { WeaponPick, useOptions } from './b4/compare.js';
import { SortButton, CollapseButton } from './ui/armory.js';
import { fetchJson } from './ui/httpClient.js';
import { withSec } from './gates/lib.js';
import { ViewToggleButton, ChipDeselectButton, EditBuildsButton, ExportButton, StageDeletionButton, ClearButton } from './b3/armory-parts.js';
import { makeButtons } from './spec-buttons.js';
import { makeChips } from './spec-chips.js';
import { makeSegs } from './spec-segs.js';
import { makeSelbar } from './spec-selbar.js';
import { makeFilled } from './spec-filled.js';
import { makeInputs } from './spec-inputs.js';
import { makeOverlays } from './spec-overlays.js';
import { makeData } from './spec-data.js';
import { makeColours } from './spec-colours.js';
import { makePopups } from './spec-popups.js';
import { makeCalls } from './spec-calls.js';
import { makeBadge } from './spec-badge.js';

/* global buildNumberOf, slotCatalogue */
const noop = () => {};
// read as the board's gates read it (gates4/surfaces.js): every build through withSec, so secondaries wear their own colour
let BUILDS = []; const ready = fetchJson('/api/armory').then((d) => { BUILDS = ((d && (d.builds || (d.data && d.data.builds))) || []).map((x) => withSec(x, true)); }).catch(() => {});
function useBuilds() { const [b, setB] = useState(BUILDS); useEffect(() => { ready.then(() => setB(BUILDS)); }, []); return b; }
// what the board measured of itself (chains, rest and hover) and what this page measured of itself (board-probe.cjs writes both)
const BOARD = { facts: {}, chains: {} }; const SELF = { facts: {} };
const getJson = (u) => fetch(u).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
const factsReady = Promise.all([getJson('spec-img/board-facts.json'), getJson('spec-img/spec-facts.json')]).then(([b, s]) => { Object.assign(BOARD, b); Object.assign(SELF, s); });
function useFacts() { const [, set] = useState(0); useEffect(() => { factsReady.then(() => set(1)); }, []); return BOARD; }

// his table: S 24 (12:13 EDT), XS click 24 (12:36 EDT), neighbour gaps on his scale (12:38 EDT)
const SIZES = { L: { h: 44, hit: 44, r: 11, icon: 16, text: '13 · 700', pad: 14, gap: 10 }, M: { h: 32, hit: 44, r: 8, icon: 14, text: '11 · 600', pad: 10, gap: 6 }, S: { h: 24, hit: 32, r: 6, icon: 12, text: '11 · 600', pad: 10, gap: 6 }, XS: { h: 20, hit: 24, r: 5, icon: 12, text: '11 · 600', pad: 6, gap: 6 } };
const DOWN = { L: 'M', M: 'S', S: 'XS' };
const MINGAP = { L: 'any', M: 14, S: 10, XS: 6 };

const Ctx = ({ cls, children }) => cls.split(' ').reduceRight((kid, c) => html`<div class=${'ctx ' + c}>${kid}</div>`, children);
// The board's own ancestors, as real elements (tag, id, classes, data-/style attributes), each display:contents. Two kinds of ancestor are left out:
// the drawer and its body (the dropdowns measure THEIR box to size the open list, and a display:contents stand-in has none, which squeezed the list
// to nothing) and the scroll-fade class (a mask with no box to fade). No stylesheet rule needs either above a field (checked: the one rule that names
// .drawer above .f-fld repeats the plain .f-fld rule).
const SEG = /^([a-z0-9]+)?(#[\w-]+)?((?:\.[\w-]+)*)((?:\[[^\]]*\])*)$/i;
const SKIP = /(^|\.)(drawer|dw-b)(\.|\[|$)/;
function Chain({ path, drop = 0, style, children }) {
  if (!path) return null;
  const segs = path.split(' > ').filter((s) => !SKIP.test(s)); const use = drop ? segs.slice(0, -drop) : segs;
  return use.reduceRight((kid, seg, i) => { const m = SEG.exec(seg) || []; const at = {}; (m[4] || '').replace(/\[([\w-]+)=([^\]]*)\]/g, (_, k, v) => { at[k] = v; return ''; }); if (style && i === use.length - 1) at.style = (at.style ? at.style + ';' : '') + style;   /* the innermost box: a value set here beats any the board's ancestors set */
    const cls = ['ctx', ...(m[3] || '').split('.').filter((c) => c && c !== 'b3-fady')].join(' ');
    return html`<${m[1] || 'div'} id=${m[2] ? m[2].slice(1) : undefined} class=${cls} ...${at}>${kid}<//>`; }, children);
}
const Hit = ({ size, children }) => html`<span class=${'hz hz-' + size}>${children}</span>`;
const Bar = ({ children }) => html`<${Ctx} cls="b4 b3-sd b3-sd-acts">${children}<//>`;

function useLayout(ref, fn) {
  useLayoutEffect(() => { const el = ref.current; if (!el) return; let raf = 0; const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => fn(el)); };
    run(); const ro = new ResizeObserver(run); ro.observe(el); document.fonts && document.fonts.ready.then(run); addEventListener('resize', run); return () => { ro.disconnect(); removeEventListener('resize', run); }; }, []);
}
const textRect = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.textContent.trim() ? 1 : 2 }); const n = w.nextNode(); if (!n) return null; const r = document.createRange(); r.selectNodeContents(n); const q = r.getBoundingClientRect(); return q.width > 0.5 ? q : null; };
const near = (a, b) => b == null || Math.abs(a - b) < 0.6;
const fmt = (v) => (Math.round(v * 10) / 10).toString();
function Num({ x, y, v, e, kind, anchor = 'middle', bare = false }) {   /* bare: a miss shows its measured value alone (the target is listed beside the drawing) */
  const miss = !near(v, e); const t = miss && !bare ? `${fmt(v)} ≠ ${fmt(e)}` : fmt(v); const w = t.length * 6.3 + 8; const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w + 4 : x - 4;
  return html`<g class=${'k-' + kind + (miss ? ' miss' : '')}>${miss && html`<rect class="pill" x=${x0} y=${y - 10} width=${w} height="14" rx="7" />`}<text x=${x} y=${y} text-anchor=${anchor}>${t}</text></g>`;
}
// the corner number beside its arc (2026-10-08 22:06 EDT, his 22:00 EDT: "move the radius number beside it's measurement curve; it feels abandoned"): on the arc's
// outward diagonal, just past the curve
const rLab = (x, y, w, r) => { const rr = Math.max(r, 1), d = (rr + 12) * 0.7071; return { x: x + w - rr + d, y: y + rr - d + 3.5 }; };
const Tick = ({ a, z, y, kind }) => html`<g class=${'k-' + kind}><line x1=${a} x2=${z} y1=${y} y2=${y} /><line x1=${a} x2=${a} y1=${y - 3} y2=${y + 3} /><line x1=${z} x2=${z} y1=${y - 3} y2=${y + 3} /></g>`;
const VTick = ({ x, a, z, kind }) => html`<g class=${'k-' + kind}><line x1=${x} x2=${x} y1=${a} y2=${z} /><line x1=${x - 3} x2=${x + 3} y1=${a} y2=${a} /><line x1=${x - 3} x2=${x + 3} y1=${z} y2=${z} /></g>`;

// lite: height and width only (the icon grid, where the parts are the size table's)
function Gauge({ expect = {}, children, hit, width, lite = false }) {
  const ref = useRef(); const [g, setG] = useState(null);
  useLayout(ref, (box) => {
    const b = box.querySelector('button'); if (!b) return; const o = box.getBoundingClientRect(); const r = b.getBoundingClientRect(); const ic = b.querySelector('svg'); const ir = ic && ic.getBoundingClientRect(); const tr = textRect(b);
    const L = (v) => v - o.left, T = (v) => v - o.top; const segs = [];
    if (!lite && ir && tr) segs.push(['pad', r.left, ir.left, expect.pad], ['icon', ir.left, ir.right, expect.icon], ['gap', ir.right, tr.left, expect.gap], ['text', tr.left, tr.right, null], ['pad', tr.right, r.right, expect.pad]);
    else if (!lite && ir) segs.push(['pad', r.left, ir.left, null], ['icon', ir.left, ir.right, expect.icon], ['pad', ir.right, r.right, null]);
    setG({ iw: ir ? ir.width : null, x: L(r.left), y: T(r.top), w: r.width, h: r.height, segs: segs.map(([k, a, z, e]) => ({ k, a: L(a), z: L(z), v: z - a, e })), rad: parseFloat(getComputedStyle(b).borderTopLeftRadius), W: o.width, H: o.height });
  });
  const rr = g && Math.min(g.rad, g.h / 2);
  return html`<div class=${'gauge' + (lite ? ' lite' : '')} ref=${ref}>${children}${g && html`<svg class="ov" width=${g.W} height=${g.H} aria-hidden="true">
    ${hit && hit > g.h && html`<g class="k-hit"><rect class="hit" x=${g.x - (hit - g.h) / 2} y=${g.y - (hit - g.h) / 2} width=${g.w + hit - g.h} height=${hit} rx="4" /></g>`}
    <${VTick} x=${g.x - 9} a=${g.y} z=${g.y + g.h} kind="h" /><${Num} x=${g.x - 15} y=${g.y + g.h / 2 + 3.5} v=${g.h} e=${expect.h} kind="h" anchor="end" />
    ${lite && g.iw && html`<${Num} x=${g.x + g.w + 8} y=${g.y + g.h / 2 + 3.5} v=${g.iw} e=${expect.icon} kind="icon" anchor="start" />`}
    ${width && html`<${Tick} a=${g.x} z=${g.x + g.w} y=${g.y + g.h + 9} kind="h" /><${Num} x=${g.x + g.w / 2} y=${g.y + g.h + 23} v=${g.w} e=${width} kind="h" />`}
    ${g.segs.map((s) => html`<${Tick} a=${s.a} z=${s.z} y=${g.y - 8} kind=${s.k === 'text' ? 'dim' : s.k} />${s.k !== 'text' && html`<${Num} x=${(s.a + s.z) / 2} y=${g.y - 15 - (s.k === 'icon' ? 13 : 0)} v=${s.v} e=${s.e} kind=${s.k} />`}`)}
    ${!lite && expect.r != null && html`<g class="k-r"><path class="arc" d=${`M ${g.x + g.w - rr} ${g.y - 1.5} A ${rr} ${rr} 0 0 1 ${g.x + g.w + 1.5} ${g.y + rr}`} /></g><${Num} x=${rLab(g.x, g.y, g.w, rr).x} y=${rLab(g.x, g.y, g.w, rr).y} v=${g.rad} e=${expect.r} kind="r" anchor="start" />`}
  </svg>`}</div>`;
}

// ---------- facts: what a button does, measured, never written ----------
const alphaOf = (c) => { const m = /\(([^)]*)\)/.exec(c || ''); if (!m) return 1; const p = m[1].replace(/^srgb\s+/, '').split(/[\s,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; };
const outlineOf = (f) => { const bw = parseFloat(f.border); if (bw > 0 && !/none|hidden/.test(f.border) && alphaOf(f.border.replace(/^[\d.]+px \w+ /, '')) > 0.01) return `${bw}px outline`; const r = /0px 0px 0px ([\d.]+)px inset/.exec(f.ring || ''); return r ? `${r[1]}px outline` : 'no outline'; };
const fillOf = (f) => (alphaOf(f.bg) > 0.01 ? 'a fill' : 'no fill');
const glowOf = (f) => Boolean(f.ring && f.ring !== 'none' && !/inset/.test(f.ring) && /px [1-9][\d.]*px/.test(f.ring));
// the size you SEE (the skin's box); a click area larger than it is said once
const sizeOf = (f) => { const w = f.sw || f.w, h = f.sh || f.h; return `${Math.round(h)}${Math.abs(w - h) > 0.6 ? ' × ' + Math.round(w) : ''}${f.sh && f.h - f.sh > 0.6 ? ` (click area ${Math.round(f.h)})` : ''}`; };
const restLine = (f) => [sizeOf(f), outlineOf(f), fillOf(f)].join(' · ');
function hoverLine(r, h) {
  const out = [];
  if (outlineOf(h) !== outlineOf(r)) out.push(outlineOf(h) === 'no outline' ? 'the outline goes' : 'an outline appears');
  else if (outlineOf(h) !== 'no outline' && (h.border !== r.border || h.ring !== r.ring)) out.push('the outline changes colour');
  if (h.bg !== r.bg) out.push(fillOf(r) === 'no fill' ? 'a fill appears' : fillOf(h) === 'no fill' ? 'the fill goes' : 'the fill changes colour');
  if (h.color !== r.color) out.push(r.words || h.words ? 'icon and words change colour' : 'the icon changes colour');
  if (h.words && !r.words) out.push('its words show');
  const boxOf = (f) => Boolean(f.ring && !/inset/.test(f.ring) && /0px 0px 0px [1-9]/.test(f.ring));   // a spread shadow with no blur draws a box around the button, not a glow (Sort's hover)
  if (boxOf(h) && !boxOf(r)) out.push('a tinted box appears around it');
  else if (glowOf(h) && !glowOf(r)) out.push('a glow appears');
  if (Math.abs((h.sw || h.w) - (r.sw || r.w)) > 0.6) out.push(`opens to ${Math.round(h.sw || h.w)} wide`);
  return out.length ? out.join(' · ') : 'nothing changes';
}
// what a button LOOKS like is drawn by its skin: the largest visible box among the button, its children and their ::before/::after (Collapse draws
// its outlined box on a child: reading the button alone said "no outline" under an outlined box). board-probe.cjs reads the board the same way.
const skinOf = (b) => { const A = (c) => { const m = /\(([^)]*)\)/.exec(c || ''); if (!m) return 1; const p = m[1].replace(/^srgb\s+/, '').split(/[\s,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; }; let best = null;
const add = (el, ps) => { const c = getComputedStyle(el, ps); if (ps && (c.content === 'none' || c.content === 'normal')) return; const bw = parseFloat(c.borderTopWidth);
  const vis = (bw > 0 && c.borderTopStyle !== 'none' && A(c.borderTopColor) > 0.01) || /inset/.test(c.boxShadow) || A(c.backgroundColor) > 0.01; if (!vis) return;
  let w, h; if (ps) { w = parseFloat(c.width) || 0; h = parseFloat(c.height) || 0; } else { const r = el.getBoundingClientRect(); w = r.width; h = r.height; } if (!best || w * h > best.a) best = { a: w * h, c, w, h }; };
[b, ...b.querySelectorAll('*')].forEach((el) => { add(el); add(el, '::before'); add(el, '::after'); }); return best; };
const wordsShow = (b) => { const t = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? 1 : 2) }); let n; while ((n = t.nextNode())) { const g = document.createRange(); g.selectNodeContents(n); const pe = n.parentElement && getComputedStyle(n.parentElement); if (g.getBoundingClientRect().width > 0.5 && pe && pe.visibility !== 'hidden' && +pe.opacity > 0.05) return true; } const e = b; return [e, ...e.querySelectorAll('*')].some((x) => ['::before', '::after'].some((ps) => { const c = getComputedStyle(x, ps); return /^"[^"]+"$/.test(c.content) && c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0.05 && (parseFloat(c.width) || 0) > 0.5; })); };   // Collapse's word is a ::after
function measure(b) { const c = getComputedStyle(b); const r = b.getBoundingClientRect(); const k = skinOf(b); const sc = k ? k.c : c; return { w: r.width, h: r.height, sw: k ? k.w : null, sh: k ? k.h : null, border: `${sc.borderTopWidth} ${sc.borderTopStyle} ${sc.borderTopColor}`, ring: sc.boxShadow, bg: sc.backgroundColor, color: c.color, words: wordsShow(b) }; }
// src "board": the board's own measurements of the same component, and a red line if this page's copy differs from it at rest
function Facts({ k, src = 'self', children }) {
  useFacts(); const ref = useRef(); const [live, setLive] = useState(null);
  useLayout(ref, (el) => { const b = el.querySelector('button'); if (b && !b.matches(':hover')) setLive(measure(b)); });
  const known = (src === 'board' ? BOARD.facts : SELF.facts)[k];
  const same = !known || !live || (Math.abs(live.h - known.rest.h) < 0.6 && Math.abs(live.w - known.rest.w) < 0.6 && outlineOf(live) === outlineOf(known.rest) && fillOf(live) === fillOf(known.rest));
  return html`<div class="fx" ref=${ref} data-facts=${src === 'self' ? k : null}><div class="fx-s">${children}</div><dl class="fx-l">
    <div><dt>rest</dt><dd>${live ? restLine(live) : '…'}${!same ? html`<span class="fx-miss">board: ${restLine(known.rest)}</span>` : null}</dd></div>
    <div><dt>hover</dt><dd>${known ? hoverLine(known.rest, known.hover) : html`<span class="fx-wait">not measured yet</span>`}</dd></div></dl></div>`;
}

const tokSegs = (s) => String(Array.isArray(s) ? s.join('') : s).split(/(?=--)/).map((x, i) => html`${i ? html`<wbr />` : null}<tk-s>${x}</tk-s>`);   // a name breaks only between its parts, never inside one (2026-10-07 21:01 EDT: names were splitting mid-flag); a custom element, so no page rule for span, i or b reaches it (.case-nm span had greyed them)
const Name = ({ children, lit }) => html`<code class="tok">${tokSegs(children)}${lit && html`<wbr /><b>${tokSegs(lit)}</b>`}</code>`;
const Tag = ({ kind, children }) => html`<span class=${'tag ' + kind}>${children}</span>`;
// 2026-10-09 19:37 EDT: a section's own calls sit at its head, before its drawings (his 19:29 EDT "why wouldn't you just put them beside their sections?"); CallCard is set once spec-calls.js is made
let CallCard = null; const SECCALLS = { colours: ['ratio', 'warnink'], filled: ['filled'], onboard: ['twins'], flags: ['reveal'], chips: ['q8'], badge: ['q7'], overlays: ['q11'], data: ['q12'] };
const CallSlot = (p) => (CallCard ? html`<${CallCard} ...${p} />` : null);
const Sec = ({ id, title, tag, kind = 'same', hint, aside, children }) => html`<section id=${id}><div class="hd"><h2>${title}</h2>${tag && html`<${Tag} kind=${kind}>${tag}<//>`}${aside || null}</div>${hint && html`<p class="hint">${hint}</p>`}${(SECCALLS[id] || []).length ? html`<div class="callrow">${SECCALLS[id].map((c) => html`<${CallSlot} id=${c} />`)}</div>` : null}${children}</section>`;

// ---------- foundations ----------
// his scale: xs 9 · s 11 · m 13 · l 15 (13:39 EDT) · xl 21 · xxl 30 · giant 44 · jumbo 58 (16:19 EDT) · the board's 17 becomes 15 (16:19 EDT)
// his 2026-10-08 11:38 EDT: each text style shows its measurements; one family at one size shares one line height and one spacing (the values are mine)
const TEXT = [['xs', 9, ['label'], 'labels'], ['s', 11, ['body', 'label'], 'button words: M, S, XS'], ['m', 13, ['body', 'label'], 'button words: L'], ['l', 15, ['body', 'label'], 'card titles'], ['xl', 21, ['display', 'body'], 'big numbers'], ['xxl', 30, ['display', 'body'], ''], ['giant', 44, ['display', 'body'], ''], ['jumbo', 58, ['display', 'body'], '']];
const FAM = { label: ['MUZZLE', 'mono caps'], body: ['Gauge-9 Mono', 'body'], display: ['125', 'numbers'] };
// 2026-10-09 15:54 EDT: one column per family, so a size reads across and a family reads down (the rows had put each family in a different column)
const TCOLS = [['body', 'Space Grotesk', 'body'], ['label', 'JetBrains Mono', 'mono caps'], ['display', 'Big Shoulders Display', 'numbers']];
function TextSample({ fam, k }) {
  const ref = useRef(); const [m, setM] = useState(null);
  useLayout(ref, (el) => { const c = getComputedStyle(el.querySelector('.tx')); const fs = parseFloat(c.fontSize); setM({ size: fs, line: parseFloat(c.lineHeight), track: c.letterSpacing === 'normal' ? 0 : parseFloat(c.letterSpacing) / fs, weight: c.fontWeight, font: c.fontFamily.split(',')[0].replace(/["']/g, '').trim() }); });   /* the font itself, read off the sample (his 2026-10-09 10:22 EDT: "the font sizes don't even mention the specific font??") */
  const tr = m && (m.track ? `${m.track > 0 ? '+' : ''}${m.track.toFixed(2)}em` : '0');
  /* the family and its font are named once, in the column head (his 11:49 EDT "Better organize the texts please, they're so cluttered"); a sample carries its numbers only */
  return html`<figure class="tsm" ref=${ref}><span class=${'tx tf-' + fam + ' tz-' + k}>${FAM[fam][0]}</span><figcaption>${m ? html`<span class="tfont">${m.font}</span><span>${m.size} / ${m.line}${m.track ? ` · ${tr}` : ''} · ${m.weight}</span>` : '…'}</figcaption></figure>`;
}
// THE BOARD'S OWN TEXT, rung by rung (deferred item 9; his 2026-10-08 17:44 EDT sizes): every text style inside Builder-2's gates and drawers (work/lead/
// inventory.cjs → spec-img/text-census.json), drawn at its decided size in its own family, weight, case, tracking and main ink, in the board's own words; a
// style that moved carries its old size. Line height and tracking are mine to set (C8), so styles that differ only in those are one.
const CEN = { styles: [], groups: null }; const censusReady = getJson('spec-img/text-census.json').then((j) => { CEN.styles = (j && j.styles) || []; CEN.groups = null; });
const MOVE = { 12: 11, 14: 13, 16: 15, 17: 15, 19: 21, 20: 21, 22: 21, 60: 58 };
const GATE = { 'c-manifest': 'Manifest', 'c-new-build': 'New build', 'c-compare': 'Compare', 'c-repairs': 'Repairs', 'c-export': 'Export', 'c-queue': 'Queue', 'c-broadcast': 'Broadcast', 'c-history': 'History', 'c-admin': 'Admin', dialog: 'Drawer' };
// 10 → 9 for a label (mono or caps), else it waits for its family to be measured; 12.5 → 11 for a secondary grey, 13 for content (his "depends where it's used")
const sizeTo = (s) => { const ink = RGB((s.inks[0] || [''])[0]); if (s.size === 10) return s.case === 'caps' || /Mono/.test(s.family) ? [9, false] : [11, true]; if (s.size === 12.5) return [ink && ink.r < 200 ? 11 : 13, false]; return [MOVE[s.size] || s.size, false]; };
function censusGroups() {
  if (CEN.groups) return CEN.groups; const by = new Map();
  for (const s of CEN.styles) { const [to, pending] = sizeTo(s); const key = [s.family, to, s.weight, s.case, pending ? 'p' : ''].join('|'); const g = by.get(key) || { family: s.family, size: to, weight: s.weight, case: s.case, n: 0, inks: new Map(), gates: new Set(), from: new Set(), samples: [], track: s.track, best: 0, pending: false };
    g.n += s.n; for (const [c, k] of s.inks) g.inks.set(c, (g.inks.get(c) || 0) + k); s.gates.forEach((x) => g.gates.add(x)); if (s.size !== to) { g.from.add(s.size); g.moved = (g.moved || 0) + s.n; } if (pending) g.pending = true;
    if (s.n > g.best) { g.best = s.n; g.track = s.track; }
    /* the sample comes from the board's content, never its chrome (his 2026-10-09 10:21 EDT: "You could have literally shown the # on each announcement card which uses the 58px font size"); a number is a whole sample even at one character */
    const pool = s.chrome ? (g.chromeSamples || (g.chromeSamples = [])) : g.samples; for (const x of s.samples) if ((x.trim().length > 1 || /^\d+$/.test(x.trim())) && !pool.includes(x)) pool.push(x);
    if (!s.chrome && s.n > (g.leadN || 0)) { g.leadN = s.n; g.leadInk = (s.inks[0] || [])[0]; } by.set(key, g); }
  return (CEN.groups = [...by.values()].map((g) => ({ ...g, samples: g.samples.length ? g.samples : g.chromeSamples || [], inks: [...g.inks.entries()].sort((a, b) => b[1] - a[1]), gates: [...g.gates], from: [...g.from].sort((a, b) => a - b), moved: g.moved || 0 })).sort((a, b) => b.n - a.n));
}
function Census({ px }) {
  const [open, setOpen] = useState(false); const [, set] = useState(0); useEffect(() => { censusReady.then(() => set(1)); }, []);
  const groups = censusGroups().filter((g) => g.size === px); if (!groups.length) return null; const N = 10; const shown = open ? groups : groups.slice(0, N);
  // the style's most telling string: real words, longest first (a fragment like "of" names nothing)
  const score = (x) => (/[a-z]{3}/i.test(x) ? 100 : 0) + (x.length < 24 ? 50 : 0) + Math.min(x.length, 20); /* the census keeps 24 characters: a shorter string is a whole one */
  const pick = (ss) => [...ss].sort((a, b) => score(b) - score(a))[0] || 'Aa'; const fontOf = (f) => f.replace(/ Display$/, '');
  return html`<div class="tcen"><span class="tc-h">on the board · ${groups.length}</span><div class="tc-l">${shown.map((g) => html`<div class="tc" title=${g.gates.map((x) => GATE[x] || x).join(' · ')}>
      <span class="tc-s" style=${`font-family:'${g.family}';font-size:${g.size}px;font-weight:${g.weight};letter-spacing:${g.track}em;${g.case === 'caps' ? 'text-transform:uppercase;' : ''}color:${g.leadInk || g.inks[0][0]}`}>${pick(g.samples)}</span>
      <span class="tc-m tc-f">${fontOf(g.family)}</span><span class="tc-m">${g.weight}</span><span class="tc-m">×${g.n}</span><span class="tc-i">${g.inks.slice(0, 4).map(([c]) => html`<i style=${`background:${c}`} title=${inkName(c)}></i>`)}</span>
      <span class="tc-w">${g.pending ? '10 · waits' : g.from.length ? (g.moved < g.n ? `×${g.moved} was ` : 'was ') + g.from.join(' · ') : ''}</span></div>`)}
    ${groups.length > N ? html`<button type="button" class="tc-more" onClick=${() => setOpen(!open)}>${open ? 'fewer' : `+${groups.length - N}`}</button>` : null}</div></div>`;
}
function Text() {
  return html`<${Sec} id="text" title="Text sizes" tag="Decided" kind="ok" hint="size / line height · letter spacing · weight, read off each sample">
    <div class="tscale3"><div class="tsr3 tsh"><span>size</span><span>px</span>${TCOLS.map(([f, font, what]) => html`<span><b>${what}</b> ${font}</span>`)}<span>used for</span></div>
      ${TEXT.map(([k, px, fams, use]) => html`<div class="tsr3"><span class="ts-k">${k}</span><span class="ts-px">${px}</span>${TCOLS.map(([f, , what]) => html`<div class="ts-c" data-fam=${what}>${fams.includes(f) ? html`<${TextSample} fam=${f} k=${k} />` : html`<i class="ts-none"></i>`}</div>`)}<span class="ts-u">${use}</span><${Census} px=${px} /></div>`)}</div><//>`;
}
// his 11:38 EDT: "the gaps scale isn't even on the spec-board?"; each gap where a ruling names its use
const GAPS = [[6, 'icon → words: M, S, XS · XS neighbours · chips'], [10, 'icon → words: L · S neighbours'], [14, 'M neighbours · the label column'], [20, ''], [26, 'before a build number'], [32, 'after a build number']];
// the gap tokens, his names (2026-10-09 11:49 EDT: "Let's token them? s1 6px / s2 10px / s3 14px / s4 20px / s5 26px / s6 32px"), written 2026-10-09 11:52 EDT
function Gaps() {
  return html`<${Sec} id="gaps" title="Gaps" tag="Decided" kind="ok" hint="drawn at 2×">
    <div class="gaps">${GAPS.map(([n, use]) => html`<figure class="gp k-gap-t"><div class="gp-s"><i style=${`width:${n * 2}px`}></i></div><figcaption><b>s${GAPS.findIndex((g) => g[0] === n) + 1} · ${n}</b><span>${use}</span></figcaption></figure>`)}</div><//>`;
}

// ---------- buttons ----------
// his 22:18 EDT cleanup: a size and its click area are one entry, so each row is the button measured, then two neighbours at the smallest gap
function Sizes() {
  return html`<${Sec} id="sizes" title="Sizes and click areas" tag="Decided" kind="ok" hint="Each size: the button measured, then two neighbours at the smallest gap, their click areas dashed. Hover just outside a button and it lights.">
    <div class="entry">${Object.entries(SIZES).map(([k, s]) => html`<div class="en-row szrow"><div class="en-k"><b>${k}</b><${Name}>${'button-' + k + '-box'}<//></div>
      <div class=${'stage sz sz-' + k}><${Gauge} expect=${{ h: s.h, pad: s.pad, icon: s.icon, gap: s.gap, r: s.r }} hit=${s.hit}><${Hit} size=${k}><${Bar}><${ExportButton} onExport=${noop} /><//><//><//></div>
      <${Pair} size=${k} />
      <dl class="facts"><div><dt>words</dt><dd>${s.text}</dd></div><div><dt>click area</dt><dd class="k-hit-t">${s.hit}${s.hit > s.h ? html`<span class="dash"></span>` : ''}</dd></div><div><dt>gap to a neighbour</dt><dd class="k-gap-t">${MINGAP[k]}</dd></div></dl></div>`)}</div>
    <p class="note">Words are Space Grotesk 600 at every size. A pill takes the same sizes with round ends; filter chips keep their click area to the chip itself, 6 apart.</p><//>`;
}

const STYLES = [
  ['wash', 'washed fill, matching outline', 'plus', () => html`<${Ctx} cls="mtools mt-r1"><${NewBuildButton} onAdd=${noop} addLabel="New build" /><//>`],
  ['tint', 'dark fill, accent outline and words', 'trash-2', () => html`<${Bar}><${StageDeletionButton} onDelete=${noop} /><//>`],
  ['fill', 'solid colour, glow on hover', 'wrench', () => html`<${Ctx} cls="b4 b3-wr"><button type="button" class="b3-btn2 sm go"><${Icon} name="wrench" />Repair build</button><//>`],
  ['paint', 'neutral fill (dark, grey or clear), tints on hover', 'square-pen', () => html`<${Bar}><${EditBuildsButton} count=${3} onEdit=${noop} /><//>`],
];
// his 19:59 EDT decision: ghost is no longer a style; the flag --ghost (no fill at rest or on hover) goes on tint and paint only
const GHOST_OK = ['tint', 'paint'];
const byKey = (k) => STYLES.find(([s]) => s === k);
const FLAGGED = [['tint--ghost', 'tint with no fill, at rest or on hover', 'trash-2', byKey('tint')[3], ' ghf'], ['paint--ghost', 'paint with no fill, at rest or on hover', 'square-pen', byKey('paint')[3], ' ghf']];


// his 19:13 EDT: "use the same trial color such as 'warn' and show/desc me each of their states". Each style keeps its own rules; the wrapper (.warnwrap,
// spec.css) points the colour each one reads (--staged, --ok, --danger-ink and its edge) at --warn, so only the hue changes. The pictures are the probe's
// shots of these live buttons in each real state (mouse over, mouse down, a disabled copy); each line under a picture is measured
const STATE_COLS = [['rest', 'Rest'], ['hover', 'Hover'], ['press', 'Press'], ['disabled', 'Disabled']];   // keyboard focus dropped (his 19:18 EDT)
// his 19:18 EDT: "i want the values presented in a nice design, and concisely … like 'loud fill: accent at 14%'". Every value is READ from the measured
// colour and named against the page's own tokens: the accent (here warn), white/greys/line, the dark page; a translucent colour is "<name> N%", an opaque
// mix is solved per channel ("accent 74% + white", "accent 12% on dark"). Nothing here is typed by hand.
const RGB = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  const n = /color\(srgb ([^)]+)\)/.exec(c || ''); if (n) { const p = n[1].split(/[\s/]+/).filter(Boolean).map(Number); return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 }; } if (c && /^(oklab|oklch|lab|lch|hsl|hwb|#)/.test(c)) { const cx = RGB.cx || (RGB.cx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })); cx.clearRect(0, 0, 1, 1); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return { r: d[0], g: d[1], b: d[2], a: Math.round(d[3] / 255 * 100) / 100 }; } return null; };   /* any other colour syntax (an oklab mid-transition, a hex), drawn on a 1 px canvas and read back in sRGB */
const TOKC = {}; const tokRGB = (name) => { if (TOKC[name]) return TOKC[name]; const d = document.createElement('i'); d.style.color = `var(${name})`; (document.querySelector('.spec') || document.body).appendChild(d); const v = RGB(getComputedStyle(d).color); d.remove(); return (TOKC[name] = v); };
const dist = (x, y) => Math.max(Math.abs(x.r - y.r), Math.abs(x.g - y.g), Math.abs(x.b - y.b));
const pct = (t) => `${Math.round(t * 100)}%`;
// every section names a colour the one way (inkName, below): the styles' trial colour reads as its token, warn
function nameColour(c) { const n = inkName(c); return !n || n === 'none' ? null : n; }

// his 2026-10-08 15:30 EDT: "what ink are the outline, the magnifying glass, the dark fill, the placeholder text, the typed text using?? Those are things you
// should be mentioning as a collective." A colour is named by the token the kit writes: an exact :root token (within 1 per channel), "token N%" when it
// is that token made translucent, one of the kit's own color-mix() recipes, else a two-colour mix solved per channel (marked ≈), else its hex
// with the nearest token after "≈". The page's own tokens (--pg-*), the builder's (--bd-*), the measurement colours (--k-*) and aliases (--sv-*, --dc-*)
// are left out, so --ink3 is never reported as --sv-info. Proven on known colours by work/lead/field-inks.cjs before any section relies on it.
let TOKS = null; const SKIPTOK = /^--(pg|bd|k|sv|dc|t-|lh|f-|ctl|fld)/;
function tokens() {
  if (TOKS) return TOKS; const names = new Set();
  for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (x) { continue; } const walk = (l) => { for (const r of l) { if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; } if (r.selectorText && /(^|,)\s*(:root|html)\b/.test(r.selectorText)) for (const p of r.style) if (p.startsWith('--') && !SKIPTOK.test(p)) names.add(p); } }; walk(rs); }
  const host = document.createElement('div'); host.style.color = 'rgb(1, 2, 3)'; document.body.appendChild(host); const out = [];
  for (const n of names) { const d = document.createElement('i'); d.style.color = `var(${n})`; host.appendChild(d); const v = RGB(getComputedStyle(d).color); d.remove(); if (v && !(v.r === 1 && v.g === 2 && v.b === 3) && v.a > 0.99) out.push([n.slice(2), v]); }
  host.remove(); out.sort((a, b) => a[0].length - b[0].length || a[0].localeCompare(b[0])); return (TOKS = out);
}
// the kit's own colour recipes: every color-mix() its stylesheets write, resolved at the root ("#04070A 52% on sunk" is b4/form.css's field fill); a
// recipe that reads the realm colour (--realm-c) is resolved once per realm token and once for ink3 (the page's accent-off value), so the × under Armory
// names the recipe that drew it rather than whichever pair of tokens happens to mix to the same pixel (a dark fill fits a dozen pairs)
// a recipe that reads a colour the page remaps (the realm accent, or the styles' warn trial: .warnwrap points --staged, --ok and --danger-* at --warn)
// is resolved once per target, so a remapped mix is named by what drew it
let RECIPES = null; const REALM_VAR = /var\(--(?:realm-c|staged|ok|danger-ink|danger-edge)(?:\s*,\s*var\(--[\w-]+\))?\)/g;
const mixesIn = (t) => { const out = []; let i = 0; while ((i = t.indexOf('color-mix(in srgb', i)) >= 0) { let d = 0, j = i; for (; j < t.length; j++) { if (t[j] === '(') d++; else if (t[j] === ')') { d--; if (!d) break; } } out.push(t.slice(i, j + 1)); i = j + 1; } return out; };
const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()); };
const argName = (a) => { const s = a.replace(/var\(--([\w-]+)(?:\s*,\s*(?:var\(--[\w-]+\)|[^()]*))?\)/g, '$1'); if (!/^#[0-9a-f]{3,8}$/i.test(s)) return s; const x = RGB((() => { const d = document.createElement('i'); d.style.color = s; return d.style.color; })()); const t = x && tokens().find(([, v]) => dist(x, v) < 0.5); return t ? t[0] : s.toUpperCase(); };   // a hex literal that IS a token reads as the token (#0B0F12 = sunk); one that is not keeps its hex (#04070A)
function recipes() {
  if (RECIPES) return RECIPES; const seen = new Map(); const realms = [...tokens().filter(([n]) => /^r-/.test(n)).map(([n]) => n), 'ink3', 'warn'];
  const host = document.createElement('div'); host.style.color = 'rgb(1, 2, 3)'; document.body.appendChild(host);
  const resolve = (ex) => { const d = document.createElement('i'); d.style.color = ex; if (!d.style.color) return null; host.appendChild(d); const v = RGB(getComputedStyle(d).color); d.remove(); return v && !(v.r === 1 && v.g === 2 && v.b === 3 && v.a === 1) ? v : null; };
  const add = (ex, label) => { if (seen.has(label)) return; const v = resolve(ex); if (v) seen.set(label, v); };
  const parse = (a) => { const m = /^(.*?)\s+([\d.]+)%$/.exec(a); return m ? { c: m[1].trim(), p: +m[2] } : { c: a, p: null }; };
  for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (x) { continue; } const walk = (l) => { for (const r of l) { if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; } for (const ex of mixesIn(r.cssText || '')) {
    const args = topSplit(ex.slice(ex.indexOf(',') + 1, -1)); if (args.length !== 2 || args.some((a) => a.includes('color-mix'))) continue;
    const A = parse(args[0]), B = parse(args[1]); const pa = A.p != null ? A.p : B.p != null ? 100 - B.p : 50;
    const lab = (a, b) => (b === 'transparent' ? `${a} ${Math.round(pa)}%` : `${a} ${Math.round(pa)}% on ${b}`);
    if (REALM_VAR.test(ex)) { REALM_VAR.lastIndex = 0; if (!/--realm-c/.test(ex)) add(ex, lab(argName(A.c), argName(B.c))); for (const rn of realms) { const sub = (s) => s.replace(REALM_VAR, `var(--${rn})`); add(sub(ex), lab(argName(sub(A.c)), argName(sub(B.c)))); } }
    else add(ex, lab(argName(A.c), argName(B.c)));
    REALM_VAR.lastIndex = 0; } } }; walk(rs); }
  host.remove(); return (RECIPES = [...seen.entries()]);
}
function inkName(c) {
  const x = RGB(c); if (!x) return c || null; if (x.a < 0.01) return 'none';
  const T = tokens(); const P = (t) => `${Math.round(t * 100)}%`; const al = x.a < 0.99 ? ' ' + P(x.a) : '';
  for (const [n, v] of T) if (x.a > 0.99 && dist(x, v) <= 1) return n;
  { let rb = null; for (const [lab, v] of recipes()) { const e = dist(x, v) + 255 * Math.abs(x.a - v.a); if (e <= 1 && (!rb || e < rb.e)) rb = { e, lab }; } if (rb) return rb.lab; }   // the closest recipe, not the first: #04070A 40% and 52% on sunk sit under 1 apart, as do ink 11% and 12%
  for (const [n, v] of T) if (dist(x, v) <= 1) return n + al;
  const C = [...T, ['#04070A', { r: 4, g: 7, b: 10 }], ['white', { r: 255, g: 255, b: 255 }], ['black', { r: 0, g: 0, b: 0 }]]; let best = null;
  for (const [an, A] of C) for (const [bn, B] of C) { if (an === bn) continue; const ch = ['r', 'g', 'b'].filter((q) => Math.abs(A[q] - B[q]) > 12); if (ch.length < 2) continue;
    const t = ch.reduce((s, q) => s + (x[q] - B[q]) / (A[q] - B[q]), 0) / ch.length; if (!(t > 0.03 && t < 0.97)) continue;
    const e = dist({ r: B.r + (A.r - B.r) * t, g: B.g + (A.g - B.g) * t, b: B.b + (A.b - B.b) * t }, x); if (e <= 1.5 && (!best || e < best.e)) best = { e, s: `${an} ${P(t)} on ${bn}` }; }
  if (best) return '≈ ' + best.s + al;   // no recipe of the kit's draws it: a solved mix, marked as such
  let near = null; for (const [n, v] of T) { const d = dist(x, v); if (!near || d < near.d) near = { n, d }; }
  return `#${[x.r, x.g, x.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}${al} ≈ ${near ? near.n : '?'}`;
}
window.__inkName = inkName;
// a box-shadow, part by part: each colour named, inset or outside, its spread
const shadowParts = (bs) => (!bs || bs === 'none' ? [] : bs.split(/,(?![^(]*\))/).map((p) => { const m = /^(.*?\))\s+(-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px ([\d.]+)px( inset)?/.exec(p.trim()); return m ? { ink: inkName(m[1]), raw: m[1], spread: +m[5], inset: Boolean(m[6]) } : null; }).filter(Boolean));
// the outline (a border or an inset 1px shadow) and a halo (a spread shadow outside)
function edgesOf(f, acc, accName) {
  const out = {}; const bw = parseFloat(f.border); const bc = (f.border || '').replace(/^[\d.]+px \w+ /, '');
  if (bw > 0 && !/none/.test(f.border) && nameColour(bc, acc, accName)) out.outline = `${nameColour(bc, acc, accName)} · ${bw}px`;
  for (const part of (f.ring || '').split(/,(?![^(]*\))/)) { const m = /^(.*?\))\s+0px 0px 0px ([\d.]+)px( inset)?/.exec(part.trim()); if (!m) continue; const nm = nameColour(m[1], acc, accName); if (!nm) continue; if (m[3]) out.outline = out.outline || `${nm} · ${m[2]}px`; else out.halo = `${nm} · ${m[2]}px`; }
  return out;
}
function recipe(f, acc, accName) { const e = edgesOf(f, acc, accName); return { fill: nameColour(f.bg, acc, accName) || 'none', outline: e.outline || 'none', halo: e.halo || null, words: nameColour(f.color, acc, accName) || 'none' }; }
// one state's card: rest lists everything; the others list only what differs from the state before
function Recipe({ f, k }) {
  if (!f || !f[k]) return html`<span class="rc-wait">not measured yet</span>`;
  const prevK = k === 'press' ? 'hover' : 'rest'; const now = recipe(f[k]), was = k === 'rest' ? null : recipe(f[prevK] || f.rest);
  /* a change is a change in the RAW value, not in its name (2026-10-09 12:07 EDT, his "you've stated it [Hover no change] even for ones that do change"): names round, so two
     different colours could share one and read as no change; when they do, the name carries the raw colour too */
  const pv = f[prevK] || f.rest; const raw = { fill: (x) => x.bg, outline: (x) => `${x.border}|${(x.ring || '').split(/,(?![^(]*\))/).filter((q) => /inset/.test(q)).join(',')}`, halo: (x) => (x.ring || '').split(/,(?![^(]*\))/).filter((q) => !/inset/.test(q)).join(','), words: (x) => x.color };
  const rows = [['Fill', 'fill', f[k].bg], ['Outline', 'outline', null], ['Halo', 'halo', null], ['Words', 'words', f[k].color]].filter(([, key]) => (k === 'rest' ? now[key] && !(key === 'halo' && !now.halo) : raw[key](f[k]) !== raw[key](pv) && !(key === 'halo' && !now.halo && !was.halo)));
  if (k !== 'rest') for (const r of rows) if (now[r[1]] === was[r[1]]) now[r[1]] = `${now[r[1]]} (was ${r[1] === 'words' ? pv.color : r[1] === 'fill' ? pv.bg : 'a shade off'})`;
  const extra = [];
  if (k === 'press' && f.press.transform !== (f.hover || f.rest).transform) extra.push('drops 1px · 98.5%');
  if (k === 'hover' && f.hover.transform && f.hover.transform !== f.rest.transform) extra.push(`moves (${f.hover.transform})`); if (k === 'hover' && f.hover.w && f.rest.w && Math.abs(f.hover.w - f.rest.w) > 0.6) extra.push(`widens ${Math.round(f.rest.w)} → ${Math.round(f.hover.w)}`);
  if (k === 'disabled' && Math.abs(parseFloat(f.disabled.opacity) - 1) > 0.05) extra.push(`${Math.round(parseFloat(f.disabled.opacity) * 100)}% opacity`);
  return html`<dl class="rc">${rows.map(([lab, key, col]) => html`<div><dt>${lab}</dt><dd>${col && now[key] !== 'none' ? html`<i class="rc-sw" style=${`background:${col}`}></i>` : null}${now[key] || 'none'}</dd></div>`)}
    ${extra.map((x) => html`<div class="rc-x"><dd>${x}</dd></div>`)}${!rows.length && !extra.length ? html`<div class="rc-x"><dd>no change</dd></div>` : null}</dl>`;
}
// one measured line per style, only from strict comparisons (no claim unless every part matches): a style that shows the accent in no state takes no
// colour; one with no accent at rest is neutral at rest; a hover recipe equal in fill, outline, halo and words to another style's is "the same as" it
function summaryOf(k) {
  const f = SELF.facts['states-' + k]; if (!f || !f.rest || !f.hover) return '';
  const R = (st) => recipe(f[st]); const vals = (r) => [r.fill, r.outline, r.halo, r.words].filter(Boolean).join(' ');
  const any = ['rest', 'hover', 'press', 'disabled'].some((st) => f[st] && /\bwarn\b/.test(vals(R(st))));
  if (!any) return 'takes no colour: greys only, it brightens on hover';
  const out = []; const rest = R('rest'), hov = R('hover');
  if (!/\bwarn\b/.test(vals(rest))) out.push('neutral at rest');
  const twin = STYLES.map(([o]) => o).find((o) => o !== k && SELF.facts['states-' + o] && SELF.facts['states-' + o].hover && ['fill', 'outline', 'halo', 'words'].every((q) => recipe(SELF.facts['states-' + o].hover)[q] === hov[q]));
  const base = k.includes('--') ? k.split('--')[0] : null; const bf = base && SELF.facts['states-' + base]; const bh = bf && bf.hover && recipe(bf.hover);
  if (rest.fill === 'none' && hov.fill === 'none') out.push('no fill at rest or on hover');
  if (bh && ['outline', 'halo', 'words'].every((q) => bh[q] === hov[q])) out.push(`on hover ${base}’s outline and words`);
  else if (twin) out.push(`on hover the same as ${twin}`);
  else if (rest.outline === hov.outline && rest.words === hov.words && rest.halo === hov.halo && rest.fill !== hov.fill) out.push('hover only deepens the fill');
  return out.join(' · ');
}
// the three rules every style follows, shown on tint and read off its measurements (his 11:38 EDT: "they're just prose")
const parseMatrix = (t) => { const m = /matrix\(([^)]+)\)/.exec(t || ''); if (!m) return null; const p = m[1].split(',').map(Number); return { s: p[0], ty: p[5] }; };
function RuleCards() {
  useFacts(); const f = SELF.facts['states-tint']; const pm = f && f.press && parseMatrix(f.press.transform); const e = f && f.rest && edgesOf(f.rest).outline; const px = e && /([\d.]+)px$/.exec(e); const op = f && f.disabled && parseFloat(f.disabled.opacity);
  const pic = (st) => html`<img src=${'spec-img/states-tint-' + st + '.png'} alt=${'tint ' + st} />`;
  return html`<div class="rules">
    <figure class="rule"><div class="rule-s">${pic('rest')}<${Icon} name="arrow-right" />${pic('hover')}<${Icon} name="arrow-right" />${pic('press')}</div><figcaption><b>Still</b><span>${pm ? `press drops ${Math.round(pm.ty * 10) / 10}px · ${Math.round(pm.s * 1000) / 10}%` : '…'}</span></figcaption></figure>
    <figure class="rule"><div class="rule-s">${pic('rest')}</div><figcaption><b>Outline</b><span>${px ? px[1] + 'px' : '…'}</span></figcaption></figure>
    <figure class="rule"><div class="rule-s">${pic('disabled')}</div><figcaption><b>Disabled</b><span>${op ? Math.round(op * 100) + '%' : '…'}</span></figcaption></figure></div>`;
}
// his 22:18 EDT: Styles, Hover and press, One colour and Outlines become one section: the rules once, then a row per style and per allowed flag
function Styles() {
  useFacts();
  return html`<${Sec} id="styles" title="Styles" tag="Decided" kind="ok" hint="each style at M in warn; the Rest button is live">
    <${RuleCards} />
    <div class="sw-states">${[...STYLES, ...FLAGGED].map(([k, what, , el, cls = '']) => { const f = SELF.facts['states-' + k]; return html`<div class="ss-row">
      <div class="ss-k"><b>${k}</b><span>${what}</span><${Name}>${'button-M-box.' + k}<//>${summaryOf(k) ? html`<em class="ss-sum">${summaryOf(k)}</em>` : null}</div>
      ${STATE_COLS.map(([c, t]) => html`<figure class="ss-c"><figcaption>${t}</figcaption>${c === 'rest'
        ? html`<div class="ss-live warnwrap" data-states=${k}><div class=${'stage sz sz-M' + cls}><${Hit} size="M">${el()}<//></div></div>`
        : html`<img src=${'spec-img/states-' + k + '-' + c + '.png'} alt=${k + ' ' + t} loading="lazy" />`}<${Recipe} f=${f} k=${c} /></figure>`)}
    </div>`; })}</div><//>`;
}

// his 16:19 EDT: "draw an icon button at size xs-L, in each of the current button styles … then based on that, we can decide". Each cell is the
// style's own board button with its words taken out (.ionly sets their size to 0), squared at the size; --borderless takes the outline away
const ORDER = ['XS', 'S', 'M', 'L'];
function IconGrid({ bl = false }) {
  const rows = bl ? STYLES.filter(([k]) => k !== 'fill') : STYLES;
  return html`<div class="igrid"><div class="ig-hd"></div>${ORDER.map((k) => html`<div class="ig-hd">${k}</div>`)}
    ${rows.map(([k, , , el]) => html`<div class="ig-k"><b>${k}${bl ? html`<i>--borderless</i>` : null}</b></div>${ORDER.map((K) => html`<div class="ig-c" data-facts=${'ig-' + k + '-' + K + (bl ? '-bl' : '')}><div class=${'stage sz sq ionly sz-' + K + (bl ? ' bl' : '')}><${Gauge} lite expect=${{ h: SIZES[K].h, icon: SIZES[K].icon }} width=${SIZES[K].h} hit=${SIZES[K].hit}><${Hit} size=${K}>${el()}<//><//></div><code class="ig-tok">${'button-' + K + '-icon.' + k + (bl ? '--borderless' : '')}</code></div>`)}`)}</div>`;
}
// his 18:40 EDT: "draw both those variants for each of the styles". --borderless: no outline, ever (.bl). --quiet: clear at rest, the style shows on
// hover (.q). They are two separate yes/no parts, so they also combine: --quiet--borderless is clear at rest and fills on hover with no outline
// (on tint: no ring on hover, unlike the drawer's tint--quiet). A fill button draws no outline: its hover glow counts as one (2026-10-07 19:03 EDT, his call), so
// fill--borderless never glows. At rest a quiet fill's icon takes the fill's colour.
// his 19:48 EDT idea: ghost as a flag, --ghost = no fill at rest or on hover, the outline kept (.ghf; not .gh, the page's group heading). Drawn on every style so the cases where it leaves
// nothing (the styles whose colour IS the fill) show themselves; a cell's warning is measured (hover equal to rest; words too dark to read on the page)
const VARIANTS = [['', ''], ['--ghost', ' ghf'], ['--borderless', ' bl'], ['--quiet', ' q'], ['--quiet--borderless', ' q bl'], ['--ghost--borderless', ' ghf bl'], ['--ghost--quiet', ' ghf q'], ['--ghost--quiet--borderless', ' ghf q bl']];   // his 11:38 EDT: every combination
const lum = (c) => { const x = RGB(c); if (!x) return 1; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(x.r) + 0.7152 * f(x.g) + 0.0722 * f(x.b); };
function cellWarn(key) { const f = SELF.facts[key]; if (!f || !f.rest || !f.hover) return null; const w = [];
  if (['border', 'ring', 'bg', 'color'].every((q) => String(f.rest[q]) === String(f.hover[q]))) w.push('hover changes nothing');
  if (lum(f.rest.color) < 0.03 && alphaOf(f.rest.bg) < 0.01) w.push('words too dark for the page');
  return w.length ? html`<em class="vc-w">${w.join(' · ')}</em>` : null; }
function Variants() {
  return html`<div class="igrid vgrid"><div class="ig-hd"></div>${VARIANTS.map(([f]) => html`<div class="ig-hd sm">${f ? tokSegs(f) : 'as drawn'}</div>`)}
    ${STYLES.map(([k, , , el]) => html`<div class="ig-k vk"><b>${k}</b></div>${VARIANTS.map(([f, c]) => (f.includes('--ghost') && !GHOST_OK.includes(k))
      ? html`<div class="ig-c vc na" data-na=${'vr-' + k + f}><div class="vc-s"><span class="na-mark" role="img" aria-label="not allowed"></span></div><code class="vc-n"><span>${'button-M-icon.' + k}</span><b>${tokSegs(f)}</b></code><em class="vc-na">tint and paint only</em></div>`
      : html`<div class="ig-c vc" data-facts=${'vr-' + k + (f || '--base')}><div class="vc-s"><div class=${'stage sz sq ionly sz-M st-' + k + c}><${Hit} size="M">${el()}<//></div></div><code class="vc-n"><span>${'button-M-icon.' + k}</span><b>${tokSegs(f)}</b></code>${cellWarn('vr-' + k + (f || '--base'))}</div>`)}`)}</div>`;
}
// the flags, each defined once (his decisions: --borderless and --reveal 16:19 EDT, --quiet 18:40, --ghost 19:59), then every style with each
const FLAGDEFS = [['--ghost', 'no fill', 'tint and paint only', ' ghf'], ['--borderless', 'no outline, ever', 'fill: no glow', ' bl'], ['--quiet', 'bare until hover', null, ' q']];
function FlagCard({ f, what, note, cls }) {
  const tint = byKey('tint')[3];
  return html`<figure class="fcard"><${Name}>${f}<//><div class="fc-pair"><div class="stage sz sq ionly sz-M st-tint"><${Hit} size="M">${tint()}<//></div><${Icon} name="arrow-right" /><div class=${'stage sz sq ionly sz-M st-tint' + cls}><${Hit} size="M">${tint()}<//></div></div><figcaption>${what}${note ? html`<i>${note}</i>` : null}</figcaption></figure>`;
}
function Flags() {
  const C = useFacts().chains || {};
  return html`<${Sec} id="flags" title="Flags" tag="Decided" kind="ok" hint="a -- adds a part that is there or not; flags combine; hover them">
    <div class="flagdefs">${FLAGDEFS.map(([f, what, note, cls]) => html`<${FlagCard} f=${f} what=${what} note=${note} cls=${cls} />`)}</div>
    <${Variants} />
    <h3 class="subh">--reveal-right · --reveal-left · words open on hover</h3>
    <div class="cases rvs">${[['right', '--reveal-right'], ['left', '--reveal-left']].map(([side, f]) => html`<figure><${Facts} k=${'rv-' + side}><div class=${'stage case rv-' + side}>${C.collapse ? html`<${Chain} path=${C.collapse}><${CollapseButton} name="BAL-27" shut=${false} onToggle=${noop} /><//>` : null}</div><//><div class="case-nm"><${Name} lit=${f}>button-M-icon.paint<//></div></figure>`)}</div><//>`;
}
function IconOnly() {
  return html`<${Sec} id="icons" title="Icon-only buttons" tag="Decided" kind="ok" hint="every style at every size: height, width and icon size measured">
    <${IconGrid} /><//>`;
}


// two neighbours at a size's smallest gap, their click areas drawn: they meet, never overlap
function Pair({ size }) {
  const s = SIZES[size]; const gap = MINGAP[size] === 'any' ? 10 : MINGAP[size]; const ext = (s.hit - s.h) / 2; const ref = useRef(); const [g, setG] = useState(null);
  useLayout(ref, (box) => { const o = box.getBoundingClientRect(); const bs = [...box.querySelectorAll('button')].map((b) => b.getBoundingClientRect());
    const rs = bs.map((r) => ({ x: r.left - o.left - ext, y: r.top - o.top - ext, w: r.width + ext * 2, h: r.height + ext * 2 })); setG({ W: o.width, H: o.height, rs, ov: rs[0].x + rs[0].w - rs[1].x, gx: bs[0].right - o.left, gz: bs[1].left - o.left, gy: bs[0].bottom - o.top + ext }); });
  return html`<div class="pairbox" ref=${ref}><div class=${'stage sz row sz-' + size} style=${`gap:${gap}px`}><${Hit} size=${size}><${Bar}><${EditBuildsButton} count=${3} onEdit=${noop} /><${ExportButton} onExport=${noop} /><//><//></div>
    ${g && html`<svg class="ov" width=${g.W} height=${g.H} aria-hidden="true"><defs><pattern id=${'hz' + size} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" class="hatch" /></pattern></defs>
      ${ext > 0 && html`<g class="k-hit">${g.rs.map((r) => html`<rect class="hit" x=${r.x} y=${r.y} width=${r.w} height=${r.h} rx="4" />`)}</g>`}
      ${g.ov > 0.5 && html`<rect x=${g.rs[1].x} y=${g.rs[1].y} width=${g.ov} height=${g.rs[1].h} fill=${`url(#hz${size})`} />`}
      <${Tick} a=${g.gx} z=${g.gz} y=${g.gy + 12} kind="gap" /><${Num} x=${(g.gx + g.gz) / 2} y=${g.gy + 27} v=${g.gz - g.gx} e=${MINGAP[size] === 'any' ? null : MINGAP[size]} kind="gap" /></svg>`}</div>`;
}

// ---------- labels and fields ----------
// his 13:39 EDT names, grouped by name (label-size-weight.colour--flag); line height and tracking are mine and not shown
const LABEL_NAMES = [
  ['label-xs-600.ink3', '', [['TIME', 600, '#85939F', 'a group']]],
  ['label-xs-600.ink3', '--right', [['MANIFEST', 600, '#85939F', 'a group'], ['ARMORY', 600, '#85939F', 'the realm']]],
  ['label-xs-700.cat', '', [['SECONDARIES', 700, '#3F6E8E', 'a category'], ['BUILD NAME', 700, '#FF3B5C', 'a field']]],
  ['label-xs-700.slot', '', [['MUZZLE', 700, '#FF7057', 'a slot, on chips and in Compare']]],
  ['label-xs-700.badge', '', [['META', 700, '#50DBF2', 'a badge'], ['HP', 700, '#F6F9FC', 'a mode']]],
  ['label-xs-500.ink3', '', [['CODE', 500, '#85939F', 'a key']]],
];
function Labels() {
  return html`<${Sec} id="labels" title="Labels · xs" tag="Decided" kind="ok" hint="label-size-weight.colour--flag. Mono, 9px, caps; drawn at 2×.">
    <div class="labels">${LABEL_NAMES.map(([nm, flag, uses]) => html`<figure class="lb lbn"><${Name} lit=${flag || null}>${nm}<//><div class="lbn-uses">${uses.map(([word, wt, col, use]) => html`<div class=${'lb-spec' + (flag ? ' right' : '')}><span class="lxs" style=${`font-weight:${wt};color:${col}`}>${word}</span><i>${use}</i></div>`)}</div></figure>`)}</div><//>`;
}

const SCALE = [9, 11, 13, 15, 21, 30, 44, 58];
const REALMS = ['season', 'armory', 'broadcast', 'review', 'access', 'analytics', 'history', 'home'];
// a field measured on what it draws (its skin), against its size row (C0: a field is L): height 44, corner 11, the leading icon 16 at 14 from the edge and
// centred, words 10 after it (14 from the edge when there is no icon), the in-field button M (32) at 6 from the edge (C3) — the 6 sits on the button's row
// under the field, beside its 32 (his 2026-10-08 15:27 EDT: above the corner it read as the radius) — the words' size, a placeholder the field cuts, and
// the field's inks: rest read live, hover and focus from field-inks.cjs under a real mouse (spec-img/field-facts.json)
const FIELDF = { facts: {} }; const fieldFactsReady = getJson('spec-img/field-facts.json').then((j) => { FIELDF.facts = (j && j.facts) || {}; });
const outlineInk = (st) => { if (!st) return { ink: null, raw: null }; const ins = shadowParts(st.ring).find((p) => p.inset); if (ins) return { ink: ins.ink, raw: ins.raw }; return parseFloat(st.borderW) > 0 && RGB(st.border) && RGB(st.border).a > 0.01 ? { ink: inkName(st.border), raw: st.border } : { ink: 'none', raw: 'transparent' }; };
const haloInk = (st) => { const o = st && shadowParts(st.ring).find((p) => !p.inset && p.spread > 0); return o ? `${o.ink} · ${o.spread}px` : null; };
// SIZES: one field measured against its size row (C0: a field is L): height 44, corner 11, the glass 16 at 14 from the edge and centred, words 10 after it,
// the in-field button M (32) at 6 from the edge (C3) with its icon 14 — the 6 sits under the field beside its 32 (his 2026-10-08 15:27 EDT: above the
// corner it read as the radius) — and the words' size, "Aa 13", under the words. Dimensions only: the inks live in the anatomy figure.
function FieldGauge({ children }) {
  const ref = useRef(); const [g, setG] = useState(null);
  useLayout(ref, (box) => {
    const f0 = box.querySelector('.srch, .f-pick, .cx-pick'); if (!f0) return; const f = f0.querySelector('.f-fld') || f0;
    const o = box.getBoundingClientRect(); const r = f.getBoundingClientRect(); const kk = skinOf(f); const L = (v) => v - o.left;
    const vis = (e) => e && e.getClientRects().length; const lead = [...f.querySelectorAll('svg')].find((s) => vis(s) && !s.closest('button') && s.getBoundingClientRect().left < r.left + r.width / 2) || [...f.querySelectorAll('i')].find((e) => vis(e) && e.getBoundingClientRect().width > 4 && e.getBoundingClientRect().left < r.left + r.width / 2);
    const btn = [...f0.querySelectorAll('button')].filter((b) => { if (!vis(b)) return false; const q = b.getBoundingClientRect(); return q.left >= r.left - 0.5 && q.right <= r.right + 0.5; }).pop(); const inp = [...f.querySelectorAll('input')].find(vis); const ip = inp && getComputedStyle(inp);
    const tl = inp ? inp.getBoundingClientRect().left + parseFloat(ip.borderLeftWidth) + parseFloat(ip.paddingLeft) : ((textRect(f) || {}).left); const fs = parseFloat(inp ? ip.fontSize : getComputedStyle(f).fontSize);
    const lr = lead && lead.getBoundingClientRect(); const br = btn && btn.getBoundingClientRect(); const bi = btn && btn.querySelector('svg'); const bir = bi && bi.getBoundingClientRect(); const glass = lead && lead.tagName.toLowerCase() === 'svg'; const segs = [];
    const sl = lr && (glass ? lr.left : lr.left + lr.width / 2 - 8), sr = lr && (glass ? lr.right : lr.left + lr.width / 2 + 8); /* a dot sits centred in the L icon's 16 slot (his 2026-10-08 17:45 EDT), so its gaps measure to the slot */
    if (lr) segs.push(['pad', r.left, sl, 14], ['icon', sl, sr, 16], ['gap', sr, tl, 10]); else if (tl) segs.push(['pad', r.left, tl, 14]);
    if (bir) segs.push(['icon', bir.left, bir.right, 14]);
    setG({ W: o.width, H: o.height, x: L(r.left), y: r.top - o.top, w: r.width, h: r.height, rad: kk ? parseFloat(kk.c.borderTopLeftRadius) : 0, segs: segs.map(([q, a, z, e]) => ({ k: q, a: L(a), z: L(z), v: z - a, e })), bw: br && br.width, bx: br && L(br.left), bxr: br && L(br.right), fr: L(r.right), fs, tx: L(tl), off: lr ? (lr.top + lr.height / 2) - (r.top + r.height / 2) : 0, lx: lr && L(lr.left + lr.width / 2) });
  });
  const rr = g && Math.min(g.rad, g.h / 2); const onScale = g && SCALE.includes(Math.round(g.fs));
  return html`<div class="fg" ref=${ref}>${children}${g && html`<svg class="ov" width=${g.W} height=${g.H} aria-hidden="true">
    <${VTick} x=${g.x + g.w + 9} a=${g.y} z=${g.y + g.h} kind="h" /><${Num} x=${g.x + g.w + 15} y=${g.y + g.h / 2 + 3.5} v=${g.h} e=${44} kind="h" anchor="start" />
    ${g.segs.map((s) => html`<${Tick} a=${s.a} z=${s.z} y=${g.y - 8} kind=${s.k} /><${Num} x=${(s.a + s.z) / 2} y=${g.y - 15 - (s.k === 'icon' && s.a < g.x + g.w / 2 ? 13 : 0)} v=${s.v} e=${s.e} kind=${s.k} />`)}
    ${g.bw && html`<${Tick} a=${g.bx} z=${g.bx + g.bw} y=${g.y + g.h + 9} kind="h" /><${Num} x=${g.bx + g.bw / 2} y=${g.y + g.h + 23} v=${g.bw} e=${32} kind="h" /><${Tick} a=${g.bxr} z=${g.fr} y=${g.y + g.h + 9} kind="pad" /><${Num} x=${(g.bxr + g.fr) / 2 + 1} y=${g.y + g.h + 23} v=${g.fr - g.bxr} e=${6} kind="pad" />`}
    <text class=${'tsz' + (onScale ? '' : ' cwarn')} x=${g.tx} y=${g.y + g.h + 23}>Aa ${fmt(g.fs)}</text>
    ${Math.abs(g.off) > 0.5 && html`<text class="cwarn" x=${g.lx} y=${g.y + g.h + 38} text-anchor="middle">centre ${g.off > 0 ? '+' : ''}${fmt(g.off)}</text>`}
    <g class="k-r"><path class="arc" d=${`M ${g.x + g.w - rr} ${g.y - 1.5} A ${rr} ${rr} 0 0 1 ${g.x + g.w + 1.5} ${g.y + rr}`} /></g><${Num} x=${rLab(g.x, g.y, g.w, rr).x} y=${rLab(g.x, g.y, g.w, rr).y} v=${g.rad} e=${11} kind="r" anchor="start" /></svg>`}</div>`;
}
// A field's parts, each with the ink it is drawn in, measured live: the outline, the fill, the glass or dot, the words or placeholder, the count box, the in-field
// button's icon (his 2026-10-08 15:30 EDT: "what ink are the outline, the magnifying glass, the dark fill, the placeholder text, the typed text using??")
function fieldParts(w) {
  const f0 = w.querySelector('.srch, .f-pick, .cx-pick'); if (!f0) return []; const f = f0.querySelector('.f-fld') || f0; const r = f.getBoundingClientRect(); const kk = skinOf(f); const sc = kk ? kk.c : getComputedStyle(f);
  const vis = (e) => e && e.getClientRects().length; const lead = [...f.querySelectorAll('svg')].find((s) => vis(s) && !s.closest('button')) || [...f.querySelectorAll('i')].find((e) => vis(e) && e.getBoundingClientRect().width > 4 && !e.closest('button'));
  const btn = [...f0.querySelectorAll('button')].filter(vis).pop(); const inp = [...f.querySelectorAll('input')].find(vis); const ip = inp && getComputedStyle(inp); const hits = f0.querySelector('.mhits'); const hc = hits && vis(hits) && getComputedStyle(hits);
  const lr = lead && lead.getBoundingClientRect(); const lc = lead && getComputedStyle(lead); const glass = lead && lead.tagName.toLowerCase() === 'svg'; const bsv = btn && btn.querySelector('svg'); const bir = bsv && bsv.getBoundingClientRect(); const br = btn && btn.getBoundingClientRect(); const hr = hc && hits.getBoundingClientRect();
  const ol = outlineInk({ ring: sc.boxShadow, border: sc.borderTopColor, borderW: sc.borderTopWidth }); const z = r.height / 44; const fs = ip ? parseFloat(ip.fontSize) : 13;
  const tl = inp ? inp.getBoundingClientRect().left + (parseFloat(ip.borderLeftWidth) + parseFloat(ip.paddingLeft)) * z : r.left + 40 * z; const ph = ip && getComputedStyle(inp, '::placeholder').color; const wordsRaw = inp ? (inp.value ? ip.color : ph) : null;
  const cv = (fieldParts.cv || (fieldParts.cv = document.createElement('canvas'))).getContext('2d'); if (ip) cv.font = `${ip.fontWeight} ${ip.fontSize} ${ip.fontFamily}`; const wEnd = inp ? tl + cv.measureText(inp.value || inp.placeholder || '').width * z : tl;
  const cy = r.top + r.height / 2; const cap = fs * 0.36 * z; const stop = Math.min(...[hr && hr.left, br && br.left, r.right - 24 * z].filter((v) => v)); const leadRaw = lead ? (glass ? (lc.stroke && lc.stroke !== 'none' ? lc.stroke : lc.color) : lc.backgroundColor) : null;
  // each part is anchored on the edge that faces its chip (top for chips above, bottom for chips below), never on its content
  return [
    ['outline', ol.ink, ol.raw, r.left + 14 * z, r.top, r.bottom],
    lead && [glass ? 'glass' : 'dot', inkName(leadRaw), leadRaw, lr.left + lr.width / 2, lr.top, lr.bottom],
    inp && [inp.value ? 'words' : 'placeholder', `${inkName(wordsRaw)} · ${Math.round(fs)}`, wordsRaw, tl + 4 * z, cy - cap, cy + cap],
    ['fill', inkName(sc.backgroundColor), sc.backgroundColor, Math.max(wEnd + 16 * z, (wEnd + stop) / 2), r.top + 6 * z, r.bottom - 6 * z],
    hc && ['count', inkName(hc.backgroundColor), hc.backgroundColor, hr.left + hr.width / 2, hr.top, hr.bottom],
    bsv && [btn.classList.contains('srch-x') ? '×' : '⌄', inkName(getComputedStyle(bsv).color), getComputedStyle(bsv).color, bir.left + bir.width / 2, bir.top, bir.bottom],
  ].filter(Boolean).map(([lab, ink, raw, px, top, bottom]) => ({ lab, ink, raw, px, top, bottom }));
}
window.__fieldParts = fieldParts;
// where the parts sit in a member field, measured once it has rendered (its data arrives after the page)
function useFieldGeo(sel) {
  const [g, setG] = useState(null);
  useEffect(() => { let n = 0; const go = () => { const w = document.querySelector(sel); const f = w && (w.querySelector('.f-fld') || w.querySelector('.srch')); const ok = f && f.getBoundingClientRect().width > 100 && fieldParts(w).length > 2;
    if (!ok) { if (n++ < 60) setTimeout(go, 150); return; } setG({ parts: Object.fromEntries(fieldParts(w).map((c) => [c.lab, c])) }); }; go(); }, []);
  return g;
}
// INKS, once for the class (his 2026-10-08 15:30 EDT: "mentioning as a collective"), in the shape of the Styles rows he chose ("loud fill: accent at 14%"):
// a name, a swatch, the token. Read live off the search and weapon fields; hover and focus from the probe's real mouse and keyboard (spec-img/field-facts.json)
function ClassInks() {
  const [, set] = useState(0); useEffect(() => { fieldFactsReady.then(() => set(1)); }, []); const S = useFieldGeo('#fields .fl-filter'), W = useFieldGeo('#fields .fl-wep'); const F = FIELDF.facts.filter;
  if (!S || !W) return html`<span class="rc-wait">measuring…</span>`;
  const P = S.parts, Q = W.parts; const hov = F && F.hover && outlineInk(F.hover.words); const foc = F && F.focus && outlineInk(F.focus);
  const rows = [['Outline', P.outline], ['Fill', P.fill], ['Glass', P.glass], ['Words', P.words], ['Placeholder', Q.placeholder], ['Count', P.count], ['× and ⌄', P['×']], hov && ['Hover', { raw: hov.raw, ink: `outline ${hov.ink}` }], foc && ['Focus', { raw: foc.raw, ink: `${foc.ink}${haloInk(F.focus) ? ' · halo ' + haloInk(F.focus) : ''}` }]].filter((r) => r && r[1]);
  return html`<dl class="rc rc-row">${rows.map(([lab, c]) => html`<div><dt>${lab}</dt><dd><i class="rc-sw" style=${`background:${c.raw}`}></i>${c.ink}</dd></div>`)}</dl>`;
}
// the Manifest's real search, in the Manifest's surroundings, typed into so its count and clear button show
function SearchDemo({ q0 = 'bal-27', st, uid }) {
  const builds = useBuilds(); const C = useFacts().chains || {}; const [q, setQ] = useState(q0);
  const n = q ? builds.filter((b) => `${b.weaponName} ${b.buildName || ''} ${(b.attachments || []).join(' ')}`.toLowerCase().includes(q.trim().toLowerCase())).length : 0;
  /* C6, the Lucide box (2026-10-08 21:47 EDT, his 21:44 EDT "the icons are still different, despite your measurement stating 16px"): the board's search draws its own
     glass (circle r7, a short handle), not the Lucide search the dropdowns use (circle r8); 16 px boxes hid it. The spec board draws the decided icon; the
     board change is the ledger's glass row */
  const ref = useRef(); useEffect(() => { const s = ref.current && ref.current.parentElement && ref.current.parentElement.querySelector('.srch > svg'); if (s && !s.querySelector('use')) { s.innerHTML = '<use href="#i-search"></use>'; s.setAttribute('class', 'ic'); } });
  return html`<${Chain} path=${C.search} style=${st}><i ref=${ref} hidden></i><${SearchField} id=${'sd-' + (uid || q0)} label="Search builds" placeholder="Search builds" query=${q} setQuery=${setQ} hits=${n} /><//>`;
}
// his 16:19 EDT: "your search dropdowns are completely wrong. you hand drew them again!" — every field below is the board's own component
// (b4/form.js WeaponField · CategoryField · AttachmentRow, b4/compare.js WeaponPick), fed the board's builds, in the board's ancestors
function Fields() {
  const builds = useBuilds(); const C = useFacts().chains || {};
  const [w, setW] = useState(''); const [c, setC] = useState('AR'); const [a, setA] = useState(''); const [picked, setPicked] = useState([]); const [on, setOn] = useState(new Set()); const [acc, setAcc] = useState('');
  // Compare opens as the board's does (CompareSurface state 'one'): BAL-27 in, its builds on
  useEffect(() => { if (!builds.length || picked.length) return; setPicked(['BAL-27']); setOn(new Set(builds.filter((b) => b.mode === 'MP' && b.weaponName === 'BAL-27').slice(0, 6).map((b) => String(b._id)))); }, [builds.length]);
  const hue = (builds.find((b) => b.category === c) || {}).accent || 'var(--ink3)';
  const catalogue = typeof slotCatalogue === 'function' ? slotCatalogue(builds, 'MP') : {};
  const mp = builds.filter((b) => b.mode === 'MP'); const options = useOptions(mp);
  const numberOf = (b) => (typeof buildNumberOf === 'function' ? buildNumberOf(mp, b).n : 1);
  const idsOf = (wn) => mp.filter((b) => b.weaponName === wn).map((b) => String(b._id));
  const pickW = (wn) => { if (picked.includes(wn)) { setPicked(picked.filter((x) => x !== wn)); setOn(new Set([...on].filter((i) => !idsOf(wn).includes(i)))); } else { setPicked([...picked, wn]); setOn(new Set([...on, ...idsOf(wn)].slice(0, 6))); } };
  const pickB = (wn, id) => { if (!picked.includes(wn)) setPicked([...picked, wn]); const nx = new Set(on); if (nx.has(id)) nx.delete(id); else if (nx.size < 6) nx.add(id); setOn(nx); };
  // the accent: a realm's colour lands only on the in-field buttons and the count box (measured 2026-10-08 12:38 EDT), so the token goes on those buttons' names
  const st = acc ? `--realm-c: var(--r-${acc})` : '--realm-c: var(--ink3)'; const t = acc ? '-' + acc : '';
  const sw = html`<div class="accsw" role="group" aria-label="Accent">${['', ...REALMS].map((r) => html`<button type="button" class=${'acc' + (acc === r ? ' on' : '')} style=${r ? `--c: var(--r-${r})` : null} aria-pressed=${acc === r ? 'true' : 'false'} onClick=${() => setAcc(r)}>${r ? html`<i></i>${r}` : 'off'}</button>`)}</div>`;
  const bn = (icon) => html`<span class="fl-b"><${Icon} name=${icon} /><${Name} lit=${t + '--quiet'}>button-M-icon.tint<//></span>`;
  // his 2026-10-08 17:05 EDT: "SHOW THROUGH DESIGN": the class once (anatomy, sizes, states), then its members as a gallery; the five share one look (C13)
  const MEMBERS = [
    ['filter', 'field-L-search.filter', null, 'x', 'Manifest · narrows in place', html`<${SearchDemo} st=${st} uid="m-filter" />`],
    ['wep', 'field-L-search.dropdown', '-wep', 'chevron-down', 'New build · one weapon', html`<${Chain} path=${C.weapon} style=${st}><${WeaponField} id="sp-w" value=${w} builds=${builds} mode="MP" onType=${setW} onPick=${(v) => setW(v)} /><//>`],
    ['cat', 'field-L-search.dropdown', '-category', 'chevron-down', 'New build · one category', html`<${Chain} path=${C.category} style=${st}><${CategoryField} id="sp-c" value=${c} builds=${builds} hue=${hue} onPick=${(v) => setC(v)} /><//>`],
    ['att', 'field-L-search.dropdown', '-attachment', 'chevron-down', 'New build · one attachment', html`<${Chain} path=${C.attachment} drop=${1} style=${st}><${AttachmentRow} id="sp-a" n=${1} value=${a} slot="" auto=${false} catalogue=${catalogue} onType=${setA} onPick=${(v) => setA(v)} /><//>`],
    ['cmp', 'field-L-search.dropdown', '-wep--multi', 'chevron-down', 'Compare · weapons or builds', html`<${Chain} path=${C.compare} style=${st}><${WeaponPick} options=${options} picked=${picked} on=${on} numberOf=${numberOf} onPick=${pickW} onBuild=${pickB} placeholder="Add weapons" /><//>`],
  ];
  return html`<${Sec} id="fields" title="Search fields" tag="Decided" kind="ok" aside=${sw}>
    <div class="fsec">
      <${ClassInks} key=${'ci' + acc} />
      <div class="fmembers">${MEMBERS.map(([k, base, lit, icon, use, el]) => html`<div class=${'fm fl-' + k}><div class="fm-h"><${Name} lit=${lit}>${base}<//>${bn(icon)}</div><div class="stage wide"><${FieldGauge} key=${k + acc}>${el}<//></div></div>`)}</div>
    </div><//>`;
}
// ---------- pieces ----------
function RailRow({ size }) {
  const seg = DOWN[size]; const around = (SIZES[size].h - SIZES[seg].h) / 2; const ref = useRef(); const [g, setG] = useState(null);
  useLayout(ref, (box) => { const o = box.getBoundingClientRect(); const b = box.querySelector('.solo button').getBoundingClientRect(); const r = box.querySelector('.b3-sd-vt').getBoundingClientRect(); const s = box.querySelector('.b3-sd-vt button').getBoundingClientRect();
    setG({ W: o.width, H: o.height, bt: b.top - o.top, bb: b.bottom - o.top, rt: r.top - o.top, rb: r.bottom - o.top, rx: r.right - o.left, rh: r.height, pad: s.top - r.top, sx: s.left - o.left, st: s.top - o.top, sh: s.height }); });
  const flush = g && Math.abs(g.rt - g.bt) < 0.6 && Math.abs(g.rb - g.bb) < 0.6;
  return html`<div class="railrow" ref=${ref}><span class="rlab">${size}</span><code class="tok rn">${'button-' + size + '-rail'}</code>
    <div class=${'solo stage sz sz-' + size}><${Hit} size=${size}><${Bar}><${ExportButton} onExport=${noop} /><//><//></div>
    <div class=${'stage sz sz-' + seg + ' railwrap around-' + around}><${Ctx} cls="b4 b3-sd b3-sd-h"><div class="b3-sd-vt" role="group"><${ViewToggleButton} label="By weapon" icon="layers" on=${true} onPick=${noop} /><${ViewToggleButton} label="One table" icon="table" on=${false} onPick=${noop} /></div><//></div>
    ${g && html`<svg class="ov" width=${g.W} height=${g.H} aria-hidden="true"><g class=${flush ? 'k-dim guide' : 'k-dim guide miss'}><line x1="24" x2=${g.W} y1=${g.bt} y2=${g.bt} /><line x1="24" x2=${g.W} y1=${g.bb} y2=${g.bb} /></g>
      <${VTick} x=${g.rx + 9} a=${g.rt} z=${g.rb} kind="h" /><${Num} x=${g.rx + 16} y=${(g.rt + g.rb) / 2 - 3} v=${g.rh} e=${SIZES[size].h} kind="h" anchor="start" />
      <${Num} x=${g.rx + 16} y=${(g.rt + g.rb) / 2 + 12} v=${g.pad} e=${around} kind="pad" anchor="start" />
      <${Num} x=${g.sx + 4} y=${g.st - 6} v=${g.sh} e=${SIZES[seg].h} kind="h" anchor="start" /></svg>`}</div>`;
}

function Chip() {
  const ref = useRef(); const [g, setG] = useState(null);
  useLayout(ref, (box) => { const o = box.getBoundingClientRect(); const c = box.querySelector('.b3-sc').getBoundingClientRect(); const b = box.querySelector('.b3-sc > button').getBoundingClientRect();
    setG({ W: o.width, H: o.height, top: b.top - c.top, bot: c.bottom - b.bottom, right: c.right - b.right, bx: b.left - o.left, by: b.top - o.top, bw: b.width, bh: b.height, cx: c.right - o.left, cl: c.left - o.left, ct: c.top - o.top, cb: c.bottom - o.top, ch: c.height }); });
  return html`<div class="chipbox" ref=${ref}><div class="stage chip-spec"><${Hit} size="S"><${Ctx} cls="b4 b3-sd b3-sd-chips"><span class="b3-sc" style="--c:#ff3b5c"><i aria-hidden="true"></i><span class="b3-nw">BAL-27<em>Build 5</em></span><${ChipDeselectButton} label="Deselect BAL-27" onDeselect=${noop} /></span><//><//></div>
    ${g && html`<svg class="ov" width=${g.W} height=${g.H} aria-hidden="true">
      <${VTick} x=${g.cl - 9} a=${g.ct} z=${g.cb} kind="h" /><${Num} x=${g.cl - 15} y=${(g.ct + g.cb) / 2 + 3.5} v=${g.ch} e=${32} kind="h" anchor="end" />
      <${Num} x=${g.bx + g.bw / 2} y=${g.ct - 7} v=${g.top} e=${4} kind="pad" /><${Num} x=${g.bx + g.bw / 2} y=${g.cb + 15} v=${g.bot} e=${4} kind="pad" /><${Num} x=${g.cx + 8} y=${g.by + g.bh / 2 + 3.5} v=${g.right} e=${4} kind="pad" anchor="start" />
      <${Num} x=${g.bx + g.bw / 2} y=${g.cb + 30} v=${g.bw} e=${24} kind="h" /></svg>`}</div>`;
}
// the toolbar and its row are real boxes, not display:contents stand-ins: the chips lay out on the toolbar's grid, which a stand-in has none of (they stacked one per line)
// the Manifest's filter chips as the board draws them (FilterChips in the board's chain, the board's categories and counts): an M pill, 32, 6 apart, the click area the chip itself (his 22:07 EDT)
function FilterRow() {
  const builds = useBuilds(); const C = useFacts().chains || {}; const [f, setF] = useState({}); const ref = useRef(); const [g, setG] = useState(null);
  const counts = new Map(); for (const b of builds.filter((x) => (x.mode || 'MP') !== 'DMZ')) { const c = counts.get(b.category); if (c) c.count++; else counts.set(b.category, { count: 1, hex: b.accent }); }
  const order = (typeof CATEGORY_CHIP_ORDER !== 'undefined' ? CATEGORY_CHIP_ORDER : [...counts.keys()]).filter((c) => counts.has(c));
  const groups = [{ key: 'category', label: 'Category', topic: true, options: order.map((c) => ({ value: c, label: (typeof CATEGORY_CHIP_LABEL !== 'undefined' && CATEGORY_CHIP_LABEL[c]) || c, count: counts.get(c).count, hex: counts.get(c).hex })) }];
  useLayout(ref, (box) => { const cs = [...box.querySelectorAll('.mt-chips > .chip')]; if (cs.length < 2) return; const o = box.getBoundingClientRect(); const a = cs[0].getBoundingClientRect(), b = cs[1].getBoundingClientRect(); const z = cs[cs.length - 1].getBoundingClientRect(); const L = (v) => v - o.left; const dot = cs[1].querySelector('i, svg'); const dr = dot && dot.getBoundingClientRect(); const lr = textRect(cs[1].querySelector('.cl')); const em = cs[1].querySelector('em'); const er = em && textRect(em);
    const segs = dr && lr && er ? [['pad', b.left, dr.left], ['icon', dr.left, dr.right], ['gap', dr.right, lr.left], ['text', lr.left, lr.right], ['gap', lr.right, er.left], ['text', er.left, er.right], ['pad', er.right, b.right]].map(([k, p, q]) => ({ k, a: L(p), z: L(q), v: q - p })) : [];
    setG({ W: o.width, H: o.height, x: a.left - o.left, y: a.top - o.top, h: a.height, ax: a.right - o.left, bx: b.left - o.left, zx: z.right - o.left, segs, fs: parseFloat(getComputedStyle(cs[1].querySelector('.cl')).fontSize), fc: em ? parseFloat(getComputedStyle(em).fontSize) : null }); });   // the anatomy reads the first category chip (All has no dot)   // the height reads after the last chip: before the first it sat on the group's label
  return html`<div class="pairbox chiprowbox" ref=${ref}>${C.chips ? html`<${Chain} path=${C.chips} drop=${2}><div class="mtools"><div class="mt-r2"><${FilterChips} groups=${groups} filters=${f} onChange=${setF} /></div></div><//>` : html`<span class="rc-wait">not measured yet</span>`}
    ${g && html`<svg class="ov" width=${g.W} height=${g.H} aria-hidden="true"><${VTick} x=${g.zx + 9} a=${g.y} z=${g.y + g.h} kind="h" /><${Num} x=${g.zx + 15} y=${g.y + g.h / 2 + 3.5} v=${g.h} e=${32} kind="h" anchor="start" />
      <${Tick} a=${g.ax} z=${g.bx} y=${g.y + g.h + 10} kind="gap" /><${Num} x=${(g.ax + g.bx) / 2} y=${g.y + g.h + 25} v=${g.bx - g.ax} e=${6} kind="gap" />
      ${g.segs.map((s) => html`<${Tick} a=${s.a} z=${s.z} y=${g.y - 8} kind=${s.k === 'text' ? 'dim' : s.k} />${s.k !== 'text' && html`<${Num} x=${(s.a + s.z) / 2} y=${g.y - 15 - (s.k === 'icon' ? 13 : 0)} v=${s.v} kind=${s.k} />`}`)}</svg>`}
    ${g && g.fs ? html`<dl class="facts chip-facts"><div><dt>words</dt><dd>${g.fs}</dd></div><div><dt>count</dt><dd>${g.fc}</dd></div><div><dt>click area</dt><dd>the chip</dd></div></dl>` : null}</div>`;
}
function Pills() {
  return html`<${Sec} id="pills" title="Pills, rails and chips" tag="Decided" kind="ok" hint="Pills take the button sizes with round ends.">
    <h3 class="subh">Filter chips · an M pill, 32 tall, 6 apart; the click area is the chip</h3>
    <div class="col one"><${FilterRow} /></div>
    <h3 class="subh">Rails · button-L/M/S-rail · segments one size down · 6 · 4 · 2 around</h3>
    <div class="col one"><${RailRow} size="L" /><${RailRow} size="M" /><${RailRow} size="S" /></div>
    <h3 class="subh">The BAL-27 chip · an S × (24) inside an M chip (32), 4 above, below and to the right</h3>
    <div class="col one chiprow"><${Chip} /><${Name} lit="-cat">chip-M-pill.selection<//></div><//>`;
}
// his 22:18 EDT: "update them afterwards, after the spec-board is done … keep a ledger": the board changes decided here, one list (spec-img/board-changes.json), done in one update
const CHANGES = { items: [] }; const changesReady = getJson('spec-img/board-changes.json').then((j) => { CHANGES.items = (j && j.items) || []; });
function BoardChanges() {
  const [, set] = useState(0); useEffect(() => { changesReady.then(() => set(1)); }, []);
  return html`<${Sec} id="changes" title="Board changes still to make" tag="After the spec board" kind="diff" hint="Decided here, not on the board yet. They go in one update once the spec board is done.">
    <div class="bchg-w"><div class="bchg"><i class="bc-h">What</i><i class="bc-h">Board today</i><i class="bc-h">Becomes</i><i class="bc-h">Decided</i>${CHANGES.items.map((x) => html`<i class="bc-k">${x.what}</i><i>${x.now}</i><i class="bc-to">${x.to}</i><i class="bc-w">${x.his}</i>`)}</div></div><//>`;
}
function StillOpen() {
  const C = useFacts().chains || {}; const builds = useBuilds(); const hue = (builds.find((x) => x.category === 'AR') || {}).accent || 'var(--ink3)';
  const wep = (cls) => html`<div class=${'stage wide ' + cls}>${C.weapon ? html`<${Chain} path=${C.weapon}><${WeaponField} id=${'so-' + cls} value="" builds=${[]} mode="MP" onType=${noop} onPick=${noop} /><//>` : null}</div>`;
  const cat = (cls) => html`<div class=${'stage wide ' + cls}>${C.category ? html`<${Chain} path=${C.category}><${CategoryField} id=${'so-' + cls} value="AR" builds=${builds} hue=${hue} onPick=${noop} /><//>` : null}</div>`;
  return html`<${Sec} id="open" title="Still open" tag="Yours to call" kind="diff">
    <div class="oqs">
      <figure class="oq"><figcaption><b>The category field's words · 12 today</b></figcaption><div class="oq-v"><span>11</span>${cat('fc11')}<span>13</span>${cat('fc13')}</div></figure>
      <figure class="oq"><figcaption><b>The fields' magnifier · 12 on the search, 16 on the dropdowns</b></figcaption><div class="oq-v"><span>12</span>${wep('fi12')}<span>16</span>${wep('fi16')}</div></figure>
    </div><//>`;
}

// ---------- buttons on the board (plan Step 4, group 1): its own module ----------
const { OnBoard, Clone: BoardClone, scopeRule } = makeButtons({ html, useState, useRef, useEffect, useLayout, getJson, SIZES, SEG, near, fmt, Num, Tick, VTick, alphaOf, Name, Tag, Sec, inkName, shadowParts, Icon, rLab });
const { Selbar } = makeSelbar({ html, useState, useRef, useEffect, getJson, Sec, Clone: BoardClone, scopeRule });
const { Filled } = makeFilled({ html, useState, useEffect, getJson, Sec, Name, Clone: BoardClone, scopeRule, Recipe });
const { Chips } = makeChips({ CallSlot, html, useState, useRef, useEffect, useLayout, getJson, SIZES, SEG, near, fmt, Num, Tick, VTick, alphaOf, Name, Tag, Sec, inkName, shadowParts, Icon, rLab });
const { Segs } = makeSegs({ html, useState, useRef, useEffect, useLayout, getJson, SIZES, SEG, near, fmt, Num, Tick, VTick, alphaOf, Name, Tag, Sec, inkName, shadowParts, Icon, rLab });
const { Data } = makeData({ html, useState, useRef, useEffect, useLayout, getJson, SIZES, SEG, near, fmt, Num, Tick, VTick, alphaOf, Name, Tag, Sec, inkName, shadowParts, Icon, rLab });
const { Overlays } = makeOverlays({ html, useState, useRef, useEffect, useLayout, getJson, SIZES, SEG, near, fmt, Num, Tick, VTick, alphaOf, Name, Tag, Sec, inkName, shadowParts, Icon, rLab });
// 2026-10-09 15:13 EDT: the Colours section (Next step 9); every cell's measured contrast lands in window.__colours for the check and the verdict
window.__colours = window.__colours || {};
const { Colours } = makeColours({ html, useRef, useState, useLayout, Sec, el: { tint: byKey('tint')[3], paint: byKey('paint')[3] }, rec: (hue, kind, r, v) => { window.__colours[`${hue}|${kind}|${r}`] = v; } });
const { Badge } = makeBadge({ html, useRef, useState, Sec, useBuilds, Ctx, useLayout });
const calls = makeCalls({ html, useState, useEffect, Sec }); const { Calls, useCallsLeft } = calls; CallCard = calls.CallCard;
const { Popups } = makePopups({ html, useRef, useEffect, useState, Sec, useBuilds, Ctx, noop });
const { Inputs } = makeInputs({ CallSlot, html, useState, useRef, useEffect, useLayout, getJson, SIZES, SEG, near, fmt, Num, Tick, VTick, alphaOf, Name, Tag, Sec, inkName, shadowParts, Icon, rLab });

// 2026-10-09 15:15 EDT: the recommendation, from the measured cells (contrast on the hover fill; lightness and chroma in OKLab, read by cl-measure.cjs): every ratio passes
// 4.5, so contrast does not decide; what does is a step that reads lighter on the dark colours while each colour keeps its hue. Home (grey) is left out of the chroma range.
const COLOUR_VERDICT = html`<div class="cl-verdict"><p class="cl-rec"><b>Decided: one ratio, 80% on white</b>, for every colour's lighter variant (your call, 2026-10-09 19:28 EDT; my recommendation too).</p>
  <table class="cl-t"><tbody><tr class="cl-th"><th>words on hover</th><th>lowest contrast</th><th>colour kept</th><th>lift on the dark colours</th></tr>
    <tr><td>86% on white</td><td>5.4 (armory)</td><td>85–98%</td><td>3–5: barely reads as a change</td></tr>
    <tr class="pick"><td>80% on white · today on tint and paint</td><td>5.8 (armory)</td><td>79–96%</td><td>5–7: a clear step, hue intact</td></tr>
    <tr><td>74% on white</td><td>6.3 (armory)</td><td>73–94%</td><td>6–9: warn, danger, ev and access start to go pastel</td></tr>
    <tr><td>68% on white</td><td>6.8 (armory)</td><td>67–90%</td><td>8–11: washed out</td></tr></tbody></table>
  <p class="cl-why">80 is already the hover words on every tint and paint button, and danger-ink (#FF8A85) is within one step of danger 80% (#FF8989). warn-ink becomes derived, warn 80% on white #FF956A (your call, 19:32 EDT), and danger-ink follows the same one ratio, danger 80% #FF8989. Staged, review and history barely lighten at any ratio; they are light already, with contrast 10–12. Look at the warn, ev, access and armory rows, where the ratios differ most. Danger starts from del, the danger fill (C11).</p></div>`;
const LEGEND = [['h', 'height · width'], ['pad', 'padding'], ['gap', 'gap'], ['icon', 'icon'], ['r', 'corner'], ['hit', 'click area']];
const NAV = [['Your calls', [['calls', 'Your calls']]], ['Foundations', [['text', 'Text sizes'], ['labels', 'Labels'], ['gaps', 'Gaps'], ['colours', 'Colours']]], ['Buttons', [['sizes', 'Sizes'], ['styles', 'Styles'], ['flags', 'Flags'], ['icons', 'Icon-only'], ['pills', 'Pills and rails'], ['onboard', 'On the board'], ['selbar', 'The selection bar'], ['filled', 'Set end date and Never']]], ['Chips and tags', [['chips', 'Chips and tags'], ['badge', 'The badge box']]], ['Segmented and switches', [['segs', 'Segmented and switches']]], ['Fields and inputs', [['fields', 'Search fields'], ['inputs', 'Inputs']]], ['Overlays', [['overlays', 'Overlays'], ['popups', 'Pop-ups']]], ['Data display', [['data', 'Data display']]], ['Next', [['changes', 'Board changes']]]];
// the section rail (his 2026-10-09 10:12 EDT: "add a scrollspy nav or something on the side so i can easily jump to a section"): every NAV entry, the one at
// the reading line lit as you scroll; below 1100 px it folds into a menu in the sticky bar. Sections render as their data arrives, so it waits for them.
// his 10:15 EDT: "a toggle to show/hide the 'on the board' stuff ... sometimes it just feels like bloat when im just trying to look at the elements themselves"; his
// popup answer (2026-10-09 10:21 EDT): both, as two toggles. Notes = the list under each element, its board place, its measured parts. Board copies = the sections copied
// from Builder-2. Each choice is remembered in this browser only.
const COPIES = new Set(['onboard', 'chips', 'segs', 'inputs', 'overlays', 'data']);
const keep = (k, d) => { try { const v = localStorage.getItem('spec-' + k); return v === null ? d : v === '1'; } catch (e) { return d; } };
keep.initial = { notes: keep('notes', true), copies: keep('copies', true) };   /* how each toggle stood when the page loaded */
const save = (k, v) => { try { localStorage.setItem('spec-' + k, v ? '1' : '0'); } catch (e) {} };
const NAV_IDS = () => NAV.flatMap(([, items]) => items.map(([id]) => id));
// The lit section is the one whose top last passed the reading line, just under the sticky bar, measured on every scroll (2026-10-09 10:25 EDT, his "fix the scrollspy
// section detection logic... im not even on the 'texts' section": the first version lit whatever an IntersectionObserver band last reported, and a long
// section that had left the band stayed lit). At the foot of the page the last section lights, however short it is.
function useSpy() {
  const [on, setOn] = useState('');
  useEffect(() => { let raf = 0; const LINE = 96;
    const shown = () => NAV_IDS().map((id) => document.getElementById(id)).filter((e) => e && e.offsetHeight > 0);   /* a hidden board copy keeps its layout at no height */
    const pick = () => { raf = 0; const els = shown(); if (!els.length) return; let cur = null, best = -Infinity;
      for (const e of els) { const t = e.getBoundingClientRect().top; if (t <= LINE && t > best) { best = t; cur = e; } }
      if (!cur) cur = els.reduce((a, b) => (a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b));
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = els.reduce((a, b) => (a.getBoundingClientRect().top > b.getBoundingClientRect().top ? a : b));
      setOn(cur.id); };
    const go = () => { if (!raf) raf = requestAnimationFrame(pick); };
    addEventListener('scroll', go, { passive: true }); addEventListener('resize', go); const t = setInterval(go, 800);   /* sections arrive with their data and toggles hide some: re-read now and then too */
    go(); return () => { removeEventListener('scroll', go); removeEventListener('resize', go); clearInterval(t); cancelAnimationFrame(raf); }; }, []);
  return [on, setOn];
}
function jumpTo(id, setOn) { const e = document.getElementById(id); if (!e) return; setOn(id); e.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', '#' + id); }
// A hide toggle flips one class on the page root and keeps its own state, so the board never re-renders on a click (2026-10-09 10:55 EDT, his "clicking 'hide board copies' is
// very glitchy/laggy": the first version kept both in App, and every click re-rendered and re-measured every section, a 0.9 s and a 2.1 s long task)
function Hider({ k, cls, icon, what }) {
  const [v, setV] = useState(() => keep(k, true));
  /* a jump to a call inside a hidden board copy asks for copies first (spec-calls.js jumpToCall) */
  useEffect(() => { const show = () => { const root = document.querySelector('.spec'); if (root && root.classList.contains(cls)) flipRef.current(); }; addEventListener('spec-show-' + k, show); return () => removeEventListener('spec-show-' + k, show); }, []);
  const flipRef = useRef(null);
  /* sections folded since the page loaded were measured folded, which can leave a gauge short: the first time they open, every gauge measures again (once) */
  const flip = () => { const nv = !v; setV(nv); save(k, nv); const root = document.querySelector('.spec'); if (root) root.classList.toggle(cls, !nv); if (nv && !window['__shown_' + k]) { window['__shown_' + k] = true; if (!keep.initial[k]) requestAnimationFrame(() => dispatchEvent(new Event('resize'))); } };
  flipRef.current = flip;
  return html`<button type="button" class="b3-btn2 ghost tog" aria-pressed=${v ? 'true' : 'false'} onClick=${flip}><${Icon} name=${icon} />${v ? 'Hide ' + what : 'Show ' + what}</button>`;
}
function SpyRail({ on, setOn }) {
  const ref = useRef(); useEffect(() => { const a = ref.current && ref.current.querySelector('a.on'); if (a) a.scrollIntoView({ block: 'nearest' }); }, [on]);
  const left = useCallsLeft();
  return html`<nav class="spy" aria-label="Sections" ref=${ref}>${NAV.map(([g, items]) => html`<div class="spy-g" data-allcopy=${items.every(([id]) => COPIES.has(id)) ? '' : null}><b>${g}</b>${items.map(([id, t]) => html`<a href=${'#' + id} data-copy=${COPIES.has(id) ? '' : null} class=${on === id ? 'on' : ''} aria-current=${on === id ? 'location' : null} onClick=${(e) => { e.preventDefault(); jumpTo(id, setOn); }}>${t}${id === 'calls' && left ? html`<i class="spy-n">${left} left</i>` : null}</a>`)}</div>`)}</nav>`;
}
function SpySelect({ on, setOn }) {
  return html`<label class="spy-sel"><span class="sr">Jump to a section</span><select value=${on} onChange=${(e) => jumpTo(e.target.value, setOn)}><option value="" disabled>Jump to…</option>${NAV.map(([g, items]) => html`<optgroup label=${g}>${items.map(([id, t]) => html`<option value=${id}>${t}</option>`)}</optgroup>`)}</select></label>`;
}
function App() {
  const [m, setM] = useState(true); const [on, setOn] = useSpy();
  return html`<div class=${'spec' + (m ? '' : ' nomeasure') + (keep('notes', true) ? '' : ' nonotes') + (keep('copies', true) ? '' : ' nocopies')}>
    <div class="top"><h1>spec-board</h1><p>The board's own components, sized to the spec we're settling. It grows into the design system one piece at a time.</p>
      <nav class="jump">${NAV.map(([g, items]) => html`<span class="jg"><i>${g}</i>${items.map(([id, t]) => html`<a href=${'#' + id}>${t}</a>`)}</span>`)}</nav></div>
    <${SpyRail} on=${on} setOn=${setOn} />
    <div class="sbar"><${SpySelect} on=${on} setOn=${setOn} /><button type="button" class="b3-btn2 ghost tog" aria-pressed=${m ? 'true' : 'false'} onClick=${() => setM(!m)}><${Icon} name="eye" />${m ? 'Hide measurements' : 'Show measurements'}</button>
      <${Hider} k="notes" cls="nonotes" icon="list" what="notes" /><${Hider} k="copies" cls="nocopies" icon="layers" what="board copies" />
      <ul class="legend">${LEGEND.map(([k, t]) => html`<li class=${'k-' + k + '-t'}><i></i>${t}</li>`)}<li class="miss-t"><i></i>misses spec</li></ul></div>
    <${Calls} />
    <h2 class="gh">Foundations</h2><${Text} /><${Labels} /><${Gaps} /><${Colours} verdict=${COLOUR_VERDICT} />
    <h2 class="gh">Buttons</h2><${Sizes} /><${Styles} /><${Flags} /><${IconOnly} /><${Pills} /><${OnBoard} /><${Selbar} /><${Filled} />
    <h2 class="gh copy">Chips and tags</h2><${Chips} /><${Badge} />
    <h2 class="gh copy">Segmented and switches</h2><${Segs} />
    <h2 class="gh">Fields and inputs</h2><${Fields} /><${Inputs} />
    <h2 class="gh copy">Overlays</h2><${Overlays} /><${Popups} />
    <h2 class="gh copy">Data display</h2><${Data} />
        <h2 class="gh">Next</h2><${BoardChanges} />
  </div>`;
}
render(html`<${App} />`, document.getElementById('spec'));
window.__specReady = true;
