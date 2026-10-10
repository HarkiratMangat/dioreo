// 2026-09-28 14:08 EDT — HIS C3 ROUND, BUILT (classes Q–AC and the nitpick pass; the record is docs/pins2/handoffs/2026-09-21-board4-intake.md § "C3 Compare
// intake round"). His two open picks are settled: the landing is A's search over the weapon tiles, each the picked-weapon tile with its build chips; the three
// tables stay, as Cards · Grid · Lanes on a VIEW toggle in the panel's top-right corner, with Embed (the builds as Discord draws them) as the fourth view —
// the Bulk ledger's own toggle, which he renamed Discord → Embed. Any number of weapons; at most six builds in the table, whatever the weapons. A build chip
// is ON (in the table) or OFF, never a third silent "not shown" state; at six, an OFF chip says why it cannot turn on.
// BOARD 4 · v11 — Compare, rebuilt (2026-09-22 14:01 EDT, his v10 intake items 31–34 and the notes I added under them). Board 4 only; ui/armory.js's
// Compare stays as Board 3 drew it. Two forks he picks between on the published board (his 13:01 / 13:06 EDT rulings):
//   f3  · the builds and their cells — A column cards · B diff grid · C slot lanes
//   f3e · nothing picked, or one build — A search on the ghost · B weapon shelf · C command field (the faded ghost stays in all three, his item 34)
// 2026-09-25 01:49 EDT: his popup answer — tables B and C carry the badges too, under the label, as A does.
// Shared by all: a build key reads ON or OFF at a glance (every key used to look pressed); a column head names the build's own label, not only
// its number; "differs" is measured against the first build of the SAME weapon, so a second weapon's cells are not all amber against the
// first's; a hovered cell lights its row and its column; a long name wraps inside its cell instead of running past it; "not shown" names which.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef, useMemo, useLayoutEffect } from '../vendor/preact-hooks.mjs';
import { Icon, Fold } from '../ui/icons.js';
import { B3Badges, buildsWord, ProblemChip, faultsFor, Hint, BuildImage, toggleMark } from '../b3/armory-parts.js';
import { useB3, setB3 } from '../b3/state.js';
import { Picker, CAT_ORDER } from './form.js';
import { labelOf, keyOf } from './bulkformat.js';

/* global buildNumberOf, shareCommandText, copyCodeText, displayBuildLabel */

const MAX = 6;
const ORDER = ['Optic', 'Muzzle', 'Barrel', 'Stock', 'Laser', 'Underbarrel', 'Rear Grip', 'Ammunition', 'Perk'];  // the Armory's display order (ui/armory.js SLOT_ORDER); Rear Grip before Ammunition
const CAT = { AR: 'Assault rifle', SMG: 'SMG', LMG: 'LMG', MARKSMAN: 'Marksman', SNIPER: 'Sniper', SHOTGUN: 'Shotgun', SECONDARIES: 'Secondary' };
// the shelf's tiles use the Armory's own short category names, the words on the manifest's category chips
const SHORT = { AR: 'Assault', SMG: 'SMG', LMG: 'LMG', MARKSMAN: 'Marksman', SNIPER: 'Sniper', SHOTGUN: 'Shotgun', SECONDARIES: 'Secondary' };
const NOUN = { AR: 'assault rifle', SMG: 'SMG', LMG: 'LMG', MARKSMAN: 'marksman rifle', SNIPER: 'sniper', SHOTGUN: 'shotgun', SECONDARIES: 'secondary' };  // no Melee: no build carries it (v17 item 9)
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
// V42 AR: the corner mark's − and + are drawn here, not from the sprite. A sprite symbol carries stroke-width="2" on itself, which the <use> copy
// keeps and which beats anything inherited from the page, so a CSS stroke-width on an Icon never reaches its paths (the V41 "heavier glyph" rule
// was dead for that reason). Drawn inline, the weight is the stylesheet's.
const mark = toggleMark;
// V44 AX: a build's name is decided as the manifest decides it (ui/armory.logic.js displayBuildLabel: an ordinal, the schema default or a code in the
// name field is no name), so a build that shows a plate here shows one there
const nameOf = (b) => (typeof displayBuildLabel === 'function' ? displayBuildLabel(b) : labelOf(b));
const slotOf = (b, s) => { const i = (b.attachmentSlots || []).indexOf(s); return i >= 0 ? b.attachments[i] : null; };

export function useOptions(builds) {
    const m = new Map();
    builds.forEach((b) => { const k = b.weaponName; if (!m.has(k)) m.set(k, { weapon: k, category: b.category, accent: b.accent || 'var(--ink3)', builds: [] }); m.get(k).builds.push(b); });
    return [...m.values()].sort((a, b) => b.builds.length - a.builds.length || a.weapon.localeCompare(b.weapon, undefined, { numeric: true }));
}

// v17 item 8: the list names each category in the manifest's own word, as the build form's list does
// (V44 AT) the order itself is the Picker's (form.js CAT_ORDER), which the build drawer's weapon list uses too
// 2026-09-29 17:56 EDT (his V41 class AF): the list is grouped by category, A–Z inside each, stays open while several weapons go in, and every weapon carries its
// build numbers — the tile's own chips — so a row adds the whole weapon and a number adds just that build (or, for a weapon already in, toggles it).
// V44 BA/BB (2026-09-29 22:33 EDT, his: "add a checkmark to each weapon that's been selected … hovering over it should change the checkmark to a red x"): a weapon in
// the panel is ticked with the Picker's own end tick, even with none of its builds on, and hovering its row turns the tick into the delete × (the row's
// click takes it out); the V42 strike is gone
export function WeaponPick({ options, picked, onPick, onBuild, on, numberOf, big = false, placeholder = 'Add a weapon to compare', open0 = false }) {
    const ord = (c) => { const i = CAT_ORDER.indexOf(c); return i < 0 ? 99 : i; };
    const opts = [...options].sort((x, y) => ord(x.category) - ord(y.category) || x.weapon.localeCompare(y.weapon, undefined, { numeric: true }))
        .map((o) => ({ value: o.weapon, label: o.weapon, group: catWord(o.category), find: catWord(o.category), meta: catWord(o.category), metaHue: o.accent, hue: o.accent, o }));
    const extra = (x) => { const isP = picked.includes(x.o.weapon); return html`<span class="cx-mk" data-picked=${isP ? 'true' : null}>${[...x.o.builds].sort((p, q) => numberOf(p) - numberOf(q)).map((b) => { const id = String(b._id); const isOn = isP && Boolean(on && on.has(id));
        return html`<button type="button" key=${id} tabindex="-1" class="cx-k" aria-pressed=${isOn ? 'true' : 'false'} aria-label=${`Build ${numberOf(b)} of ${x.o.weapon}`} data-tip=${isOn ? `Take Build ${numberOf(b)} out` : `Put Build ${numberOf(b)} in`}
            onMouseDown=${(e) => { e.preventDefault(); e.stopPropagation(); onBuild(x.o.weapon, id); }}><b>${numberOf(b)}</b><i class="cx-kb" aria-hidden="true">${mark(isOn)}</i></button>`; })}</span>`; };
    return html`<div class=${'cx-pick' + (big ? ' big' : '')}><${Picker} id=${big ? 'cx-q-big' : 'cx-q'} value="" placeholder=${placeholder} options=${opts} label="Weapons" typed keep grouped extra=${extra} open0=${open0} sel=${(x) => picked.includes(x.value)} drop
        lead=${html`<${Icon} name="search" />`} onPick=${(v) => v && onPick(v)} empty="No weapon in this armory matches" /></div>`;
}

// ══ 2026-09-29 13:17 EDT — HIS VERSION 40 INTAKE, BUILT (classes G–S of docs/pins2/handoffs/2026-09-21-board4-intake.md § "Version 40 intake round").
//   G · the table fits its panel at six builds across three weapons: fixed columns, no sideways scroll, a long name wraps inside its cell.
//   H · a weapon is a GROUP — its head a band over its builds, and between two weapons a gutter with one hairline, head to last row.
//   I · every body row is pre-set to two lines' height; rows are divided by a hairline, cells by their boxes, weapons by the gutter.
//   J · a row's name is the slot's own label: capitals, in the slot's colour. The "BAL-27 only" / "2 of 3 weapons" marks are gone.
//   K · one empty: the dash. A part the weapon's other builds carry and this one lacks is the dash in the odd-one-out tint. Agreement is
//       the Lanes answer in both views — equal neighbours of one weapon merge into one cell that says how many builds share it.
//   L · the gunsmith code is always a row.   P · every build head names its label, or says it has none.
//   N · the tiles: width follows the content between 120 and 260px, the name at the tile's 10px padding with its category under it, the
//       head tint of the table's columns, at most two rows and then the board's sideways fade (.b3-fadx, b3/fady.js).
//   O · the top is search and VIEW only; the seats readout and the "Same on all" chips sit in a band between the tiles and the table.
//   Q · Cards and Lanes. The Discord cards open from a bar under the table (his "show cards" redesign, 2026-09-28 13:19 EDT). One build is
//       the table, with a suggested build of a same-category weapon beside it as a dashed column.
//   S · the landing: the faded table behind it (his v10 keep, item 34), the line as two readouts, the real tiles flowing from the centre in
//       at most three rows across ~900px (10–16 of them), a whole-tile hover that lights every build, and a + that is always there.
const catWord = (c) => (typeof CATEGORY_CHIP_LABEL !== 'undefined' && CATEGORY_CHIP_LABEL[c]) || SHORT[c] || c;
const slug = (s) => String(s).toLowerCase().replace(/\s+/g, '-');
const hasBadge = (b) => Boolean(b.isMeta || b.categoryRank || b.dmzRangeRank || b.isToxic || b.isAss || (b.mode !== 'DMZ' && (b.rankModes || []).length));

// ── the weapon tile, in the bar and on the landing: the name, its category under it in the category's colour, a chip per build. In the bar a chip
// toggles its build in or out of the table and × removes the weapon; on the landing the whole tile opens every build that fits, a chip opens just its
// own, and the + sits where the bar's × sits. A chip says what a click will do before it is pressed (− on an ON chip, + on an OFF one), and in the bar a
// hover on a chip lights that build's column in the table (his V41 class V).
function Tile({ o, numberOf, on = null, full = false, landing = false, onToggle, onRemove, onAdd, onAddOne, onHover = null }) {
    const bs = [...o.builds].sort((x, y) => numberOf(x) - numberOf(y));
    const inN = on ? bs.filter((b) => on.has(String(b._id))).length : 0;
    const name = html`<span class="cx-wn"><b>${o.weapon}</b><small>${catWord(o.category)}</small></span>`;
    const all = bs.length === 1 ? 'Compare its build' : `Compare its builds, up to ${MAX}`;
    return html`
        <div class=${'cx-w' + (landing ? ' cx-wl' : '')} style=${`--c:${o.accent}`} role="group"
             aria-label=${landing ? `${o.weapon}, ${plural(bs.length, 'build')}` : `${o.weapon}, ${inN} of ${bs.length} builds in the table`}
             onClick=${landing ? (e) => { if (!e.target.closest('.cx-k')) onAdd(o.weapon); } : null}>
            <div class="cx-wh">${landing
                ? html`<button type="button" class="cx-wadd" aria-label=${`${o.weapon}: ${all}`} data-tip=${all}>${name}<span class="cx-wplus" aria-hidden="true"><${Icon} name="plus" /></span></button>`
                : html`${name}<button type="button" class="b3-x cx-wx" aria-label=${`Remove ${o.weapon} from the comparison`} data-tip="Remove the weapon" onClick=${() => onRemove(o.weapon)}><${Icon} name="x" /></button>`}</div>
            <div class="cx-keys">${bs.map((b) => { const id = String(b._id); const isOn = Boolean(on && on.has(id)); const lab = nameOf(b); const n = numberOf(b);
                const tip = landing ? `Compare Build ${n}${lab ? ` · ${lab}` : ''}` : isOn ? `Take Build ${n} out of the table` : full ? `The table holds ${MAX} builds. Take one out first.` : `Put Build ${n} in the table`;
                return html`<button type="button" key=${id} class=${'cx-k' + (full && !isOn && !landing ? ' cx-kfull' : '')} aria-pressed=${landing ? null : isOn ? 'true' : 'false'} data-tip=${tip}
                        aria-label=${`Build ${n}${lab ? `, ${lab}` : ''}: ${tip}`} onClick=${(e) => { e.stopPropagation(); if (landing) onAddOne(o.weapon, id); else onToggle(id); }}
                        onMouseEnter=${onHover ? () => onHover(id) : null} onMouseLeave=${onHover ? () => onHover(null) : null}>
                    <b>${n}</b><i class="cx-kb" aria-hidden="true">${mark(isOn)}</i></button>`; })}</div>
        </div>`;
}

// V48 BN (his, 2026-09-30 11:14 EDT, reversing his 23:41 EDT name row): the build's own head carries everything that names it. Left, stacked 10px apart: the
// manifest's build-name plate in its original design (the BUILD NAME caption inside; "Not set", dimmed, when there is none, so every head keeps one shape),
// ~140px and 10px in; the Build chip; the badges. Right, its top on the plate's top: the verdict (ProblemChip) and, 10px under it, the image mark — the same
// object as the verdict (its box, ring, hover and pointer), hovered, the build's image in the board's pop-up container. Both open upward unless there is no room.
function BuildHead({ b, numberOf, anyBadge, sug = false, all = [], onOpen = () => {} }) {
    const name = nameOf(b); const n = numberOf(b);
    return html`
        <span class="cx-hn">
            <span class="cx-hs">
                <span class=${'wg-plate cx-pl' + (name ? '' : ' unset')}><small>Build name</small><span>${name || 'Not set'}</span></span>
                <span class="b3-sd-gn">Build ${n}</span>
            </span>
            ${sug ? null : html`<span class="cx-vd">
                <${ProblemChip} weapon=${b.weaponName} faulty=${[{ b, n }]} builds=${all} onOpen=${onOpen} compact prefer="up" tone=${faultsFor(b).length ? 'warn' : 'ok'} />
                <${Hint} pin tone=${b.imageKey ? 'ok' : 'warn'} media=${html`<${BuildImage} b=${b} n=${n} />`}>
                    <span class=${'wg-fwrap b3-fx b3-fx-sm cx-imx' + (b.imageKey ? ' b3-okx' : '')}><button type="button" class="b3-fchip" aria-label=${b.imageKey ? `Build ${n}’s image` : `Build ${n} has no image`}><${Icon} name=${b.imageKey ? 'image' : 'image-off'} /></button></span>
                <//>
            </span>`}
            ${''/* his 11:52 EDT: the badge run spans the head's whole content box (under the marks too), so it meets the 10px padding and fades there */}
            ${anyBadge ? html`<span class="cx-hb">${hasBadge(b) ? html`<div class="cx-run b3-fadx" data-rows="1"><${B3Badges} b=${b} bare /></div>` : null}</span>` : null}
        </span>`;
}

const shuffled = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const copyText = (t) => { try { if (navigator.clipboard) navigator.clipboard.writeText(t); } catch (e) { /* the board has no clipboard permission in a frame; the flash still shows */ } };

// 2026-09-29 17:56 EDT (his V41 class X): Lanes is scrapped, so Compare is Cards alone and the VIEW toggle is gone. Its corner takes Clear and Remove all (class AE).
export function B4Compare({ builds, weapons, onSetWeapons, Card, onEdit = null, onDelete = null }) {
    const view = 'a';
    const [on, setOn] = useState(() => new Set());   // the builds in the table, by id — at most MAX
    const [hc, setHc] = useState(null);              // what is lit: { r, c0, c1, g } — a cell, a column (r -1), a row (c0 -1) or a weapon (g)
    const [deny, setDeny] = useState(0);             // a refused chip at the limit flashes the seats
    const [dc, setDc] = useState(false);             // the Discord cards, open or folded
    const [flash, setFlash] = useState(null);        // a copy just made: '<id>:share' or '<id>:code'
    const copy = (key, text) => { copyText(text); setFlash(key); setTimeout(() => setFlash((k) => (k === key ? null : k)), 1200); };
    const options = useOptions(builds);
    const byId = useMemo(() => new Map(builds.map((b) => [String(b._id), b])), [builds]);
    const optionOf = (w) => options.find((o) => o.weapon === w) || { weapon: w, builds: [], accent: 'var(--ink3)' };
    const numberOf = (b) => buildNumberOf(builds, b).n;
    const sortedOf = (w) => [...optionOf(w).builds].sort((x, y) => numberOf(x) - numberOf(y));
    const picked = (weapons || []).filter((w) => options.some((o) => o.weapon === w));
    const key = picked.join('|');
    const prev = useRef([]); const only = useRef({});
    useEffect(() => {
        setOn((cur) => {
            const n = new Set([...cur].filter((id) => byId.get(id) && picked.includes(byId.get(id).weaponName)));
            const fresh = picked.filter((w) => !prev.current.includes(w)).map((w) => (only.current[w] ? [only.current[w]] : sortedOf(w).map((b) => String(b._id))));
            for (let r = 0; fresh.some((q) => q[r]); r++) for (const q of fresh) if (q[r] && n.size < MAX) n.add(q[r]);
            return n;
        });
        picked.forEach((w) => { delete only.current[w]; });
        prev.current = picked;
    }, [key, builds.length]);
    // arriving from the landing, the bar's list opens where the landing's was, so picking several weapons is one visit
    const reopen = useRef(false);
    const add = (w) => { if (!picked.length) reopen.current = true; onSetWeapons([...picked, w]); };
    const addOne = (w, id) => { if (!picked.length) reopen.current = true; only.current[w] = id; onSetWeapons([...picked, w]); };
    const remove = (w) => onSetWeapons(picked.filter((x) => x !== w));
    const toggle = (id) => setOn((cur) => { const n = new Set(cur); if (n.has(id)) n.delete(id); else if (n.size < MAX) n.add(id); else { setDeny((d) => d + 1); return cur; } return n; });
    // V42 AI: a weapon's name in the list puts it in, or takes it and all its builds out; its numbers do the same one build at a time
    const pickW = (w) => (picked.includes(w) ? remove(w) : add(w));
    const pickB = (w, id) => (picked.includes(w) ? toggle(id) : addOne(w, id));
    const del = (b) => { const id = String(b._id); setOn((cur) => { const n = new Set(cur); n.delete(id); return n; }); if (onDelete) onDelete(b, numberOf(b)); };
    const chosen = picked.flatMap((w) => sortedOf(w).filter((b) => on.has(String(b._id))));
    const full = chosen.length >= MAX;
    useEffect(() => { reopen.current = false; });
    // the landing: a fresh draw each time the panel comes back to empty, then as many tiles as three centred rows of ~900px hold (10–16)
    const [draw, setDraw] = useState(0);
    useEffect(() => { if (!picked.length) setDraw((d) => d + 1); }, [picked.length === 0]);
    const deck = useMemo(() => shuffled(options), [draw, options.length]);
    const [cap, setCap] = useState(16);
    useEffect(() => { setCap(16); }, [draw]);
    const shelfRef = useRef(null);
    useLayoutEffect(() => {
        const el = shelfRef.current; if (!el) return;
        const rows = new Set([...el.children].map((c) => c.offsetTop)).size;
        if (rows > 3 && cap > 10) setCap((c) => c - 1);
    });
    const lone = chosen.length === 1 ? chosen[0] : null;
    const sug = useMemo(() => {
        if (!lone) return null;
        const pool = shuffled(options.filter((o) => o.weapon !== lone.weaponName && o.category === lone.category && !picked.includes(o.weapon)));
        const o = pool[0] || shuffled(options.filter((x) => x.weapon !== lone.weaponName && !picked.includes(x.weapon)))[0];
        return o ? [...o.builds].sort((x, y) => numberOf(x) - numberOf(y))[0] : null;
    }, [lone && String(lone._id), options.length]);

    const rowsOf = (cols, compare) => {
        const rows = []; const same = [];
        ORDER.concat([...new Set(cols.flatMap((b) => b.attachmentSlots || []))].filter((s) => s && !ORDER.includes(s))).forEach((s) => {
            const vals = cols.map((b) => slotOf(b, s));
            if (vals.every((v) => v == null)) return;
            // V44 AV (his: "The chip above is not a replacement for the actual row"): a slot every build shares stays a row — one merged cell per weapon —
            // and is ALSO a Same chip; `all` keeps it out of the Shared chips, which would say it twice
            const all = compare && vals.every((v) => v != null && v === vals[0]);
            if (all) same.push([s, vals[0], `var(--sl-${slug(s)}, var(--sl-unknown))`]);
            rows.push({ key: s, vals, slot: true, all });
        });
        // 2026-09-29 23:42 EDT (his): the build's name is the first row — each cell the manifest's build-name plate without its caption, BUILD NAME on the left; none reads "Not set", dimmed
        const codeVals = cols.map((b) => (b.mode === 'DMZ' ? null : b.shareCode || null));
        if (codeVals.some((v) => v)) rows.push({ key: 'Code', vals: codeVals, mono: true });
        const multiW = new Set(cols.map((b) => b.weaponName)).size > 1;
        if (compare && multiW) { const cv = cols.map((b) => CAT[b.category] || b.category); if (cv.every((v) => v === cv[0])) same.unshift(['Category', cv[0], optionOf(cols[0].weaponName).accent]); }
        return { rows, same };
    };
    const cellState = (cols, r, i, sgAt) => {
        if (i === sgAt) return r.vals[i] == null ? 'x sg' : 'sg';
        const g = cols.map((b, k) => (k !== sgAt && b.weaponName === cols[i].weaponName ? k : -1)).filter((k) => k >= 0); const v = r.vals[i];
        if (g.length < 2) return v == null ? 'x' : 'n';
        if (r.key === 'Code') return 'n';
        const vs = g.map((k) => r.vals[k]);
        const nulls = vs.filter((x) => x == null).length;
        if (v == null) return !vs.some((x) => x != null) ? 'x' : nulls * 2 > vs.length ? 'x' : 'rm';
        if (vs.every((x) => x === v)) return 'eq';
        const n = {}; vs.forEach((x) => { const k = x == null ? '∅' : x; n[k] = (n[k] || 0) + 1; });
        const top = Math.max(...Object.values(n)); const tops = Object.keys(n).filter((k) => n[k] === top);
        return tops.length === 1 && tops[0] === v ? 'n' : 'd';
    };
    const runsOf = (cols, r, sgAt) => { const out = []; r.vals.forEach((v, i) => { const p = out[out.length - 1];
        if (p && v != null && r.key !== 'Code' && i !== sgAt && p.i !== sgAt && p.v === v && cols[i].weaponName === cols[p.i].weaponName) p.span += 1; else out.push({ v, i, span: 1 }); }); return out; };

    // ── one table, called as a function (never mounted as a component declared in the render, which would remount on every hover). `ghost` draws it
    // inert for the landing's faded background. 2026-09-29 17:56 EDT (his V41 V): what a hover lights is ranked by STRENGTH, not hue — with several builds of one
    // weapon every column is the same colour, so the hovered cell (hx) is the strongest thing, its row and column a faint lift; the weapon head lights
    // its columns, a slot label its row, and the band's chips and the tiles' chips their own cells.
    const Table = ({ cols, sgAt = -1, ghost = false }) => {
        const { rows } = rowsOf(cols, cols.length > 1 && sgAt < 0);
        const groups = []; cols.forEach((b, i) => { const g = groups[groups.length - 1]; if (g && g.w === b.weaponName && (i === sgAt) === g.sg) g.n += 1; else groups.push({ w: b.weaponName, n: 1, i, sg: i === sgAt }); });
        const ends = new Set(groups.slice(0, -1).map((g) => g.i + g.n - 1));
        const gOf = (i) => groups.find((g) => i >= g.i && i < g.i + g.n);
        // V42 AS: a gap between two builds of one weapon ends in a round cap under the weapon's band (cx-hj draws it; cx-hbl when the band is lit). V44 AU: it was `cx-bl`, a name an old dead rule
        // (compare.css, `.cx-bl{display:flex}`) still claimed, so hovering a weapon's name made every build head of it a flex box and the table fell apart
        const joined = (i) => i < cols.length - 1 && !ends.has(i) && i !== sgAt && i + 1 !== sgAt;
        const bandLit = (i) => !ghost && hc && hc.g && gOf(i) && hc.g === gOf(i).w + gOf(i).i;
        const anyBadge = cols.some(hasBadge);
        const lit = (i, span = 1) => !ghost && hc && hc.c0 >= 0 && i <= hc.c1 && i + span - 1 >= hc.c0;
        const over = (v) => (ghost ? {} : { onMouseEnter: () => setHc(v) });
        const gut = (k, tag = 'td') => (tag === 'th' ? html`<th key=${`g${k}`} class="cx-gut" aria-hidden="true"></th>` : html`<td key=${`g${k}`} class="cx-gut" aria-hidden="true"></td>`);
        return html`
            <table class="cx-t" data-f=${view} data-ghost=${ghost ? 'true' : null} style=${`--n:${cols.length}`}>
                ${ghost ? null : html`<caption class="sr">${[...new Set(cols.map((b) => b.weaponName))].join(', ')}, slot by slot. A tinted cell holds a part the other builds of its weapon do not.</caption>`}
                <colgroup><col class="cx-c0" />${cols.map((b, i) => html`<col key=${i} />${ends.has(i) ? html`<col class="cx-gc" />` : null}`)}</colgroup>
                <thead>
                    <tr class="cx-gr"><th class="cx-k0"><span class="sr">Weapon</span></th>${groups.map((g, gi) => html`
                        <th key=${g.w + g.i} colSpan=${g.n} scope="colgroup" class=${'cx-g' + (g.sg ? ' sg' : '') + (!ghost && hc && hc.g === g.w + g.i ? ' hg' : '')} style=${`--c:${optionOf(g.w).accent}`} ...${over({ r: -1, c0: g.i, c1: g.i + g.n - 1, g: g.w + g.i })}>
                            <div class="cx-gh"><span class="cx-gn"><b>${g.w}</b><small>${catWord(optionOf(g.w).category)}</small></span>
                                ${g.sg ? html`<span class="cx-sgw"><span class="b4-hint" data-tone="magic"><${Icon} name="sparkles" />Suggested</span>
                                    <button type="button" class="b3-btn2 cx-sgadd" onClick=${() => addOne(g.w, String(cols[g.i]._id))}><${Icon} name="plus" />Add</button></span>` : null}</div></th>
                        ${gi < groups.length - 1 ? gut(gi, 'th') : null}`)}</tr>
                    <tr><th class="cx-k0" scope="col"><span class="sr">Slot</span></th>${cols.map((b, i) => html`
                        <th key=${String(b._id)} scope="col" class=${'cx-h' + (lit(i) ? ' hc' : '') + (i === sgAt ? ' sg' : '') + (joined(i) ? ' cx-hj' : '') + (bandLit(i) ? ' cx-hbl' : '')} style=${`--c:${optionOf(b.weaponName).accent}`} ...${over({ r: -1, c0: i, c1: i })}>
                            <${BuildHead} b=${b} numberOf=${numberOf} anyBadge=${anyBadge} sug=${i === sgAt} all=${builds} onOpen=${(x) => onEdit && onEdit(x)} />
                        </th>${ends.has(i) ? gut(i, 'th') : null}`)}</tr></thead>
                <tbody>${rows.map((r, ri) => html`
                    <tr key=${r.key} class=${!ghost && hc && hc.r === ri ? 'hr' : ''}>
                        <th scope="row" class=${'cx-k0' + (r.key === 'Code' ? ' code' : '')} style=${r.slot ? `--sl:var(--sl-${slug(r.key)}, var(--sl-unknown))` : null} ...${over({ r: ri, c0: -1, c1: -1 })}>${r.key === 'Code' ? html`Gunsmith<br />code` : r.key}</th>
                        ${runsOf(cols, r, sgAt).map(({ v, i, span }) => { const st = cellState(cols, r, i, sgAt); const endAt = i + span - 1; const id = String(cols[i]._id);
                            const hx = !ghost && hc && hc.r === ri && hc.c0 >= 0 && i <= hc.c1 && endAt >= hc.c0;
                            const code = r.key === 'Code' && v != null && !ghost && i !== sgAt;
                            return html`
                            <td key=${i} colSpan=${span} class=${`cx-c s-${st}${span > 1 ? ' merged' : ''}${lit(i, span) ? ' hc' : ''}${hx ? ' hx' : ''}`} style=${`--c:${optionOf(cols[i].weaponName).accent}`} ...${over({ r: ri, c0: i, c1: endAt })}>
                                ${v == null ? html`<span class="cx-v x"><span class="cx-vt">—</span>${st === 'rm' ? html`<span class="sr"> not equipped, where the other builds of its weapon carry one</span>` : null}</span>`
                                    : code ? html`<button type="button" class=${'cx-v mono cx-code' + (flash === id + ':code' ? ' done' : '')} aria-label=${`Copy gunsmith code ${v}`} onClick=${() => copy(id + ':code', typeof copyCodeText === 'function' ? copyCodeText(cols[i]) : v)}><span class="cx-vt">${v}</span><span class="cx-cpi" aria-hidden="true"><${Icon} name=${flash === id + ':code' ? 'check' : 'copy'} /></span></button>`
                                    : html`<span class=${'cx-v' + (r.mono ? ' mono' : '')}><span class="cx-vt">${v}${st === 'd' ? html`<span class="sr"> differs from the other builds of its weapon</span>` : null}${span > 1 ? html`<span class="sr">, shared by ${span} builds</span>` : null}</span></span>`}
                            </td>${ends.has(endAt) ? gut(endAt) : null}`; })}
                    </tr>`)}</tbody>
                ${ghost ? null : html`<tfoot><tr class="cx-ft"><th class="cx-k0"><span class="sr">Actions</span></th>${cols.map((b, i) => { const id = String(b._id); const n = numberOf(b); return html`
                    <td key=${'f' + id} class=${'cx-fa' + (i === sgAt ? ' sg' : '') + (lit(i) ? ' hc' : '')} style=${`--c:${optionOf(b.weaponName).accent}`}>${i === sgAt ? null : html`
                        <div class="wg-acts cx-acts">
                            <button type="button" class=${'wg-ib wg-share' + (flash === id + ':share' ? ' is-done' : '')} aria-label="Copy share command" data-tip="Copy share command" onClick=${() => copy(id + ':share', typeof shareCommandText === 'function' ? shareCommandText(b, n) : '')}><${Icon} name=${flash === id + ':share' ? 'check' : 'share-2'} /></button>
                            <button type="button" class="wg-ib wg-edit cx-edit" aria-label=${`Edit ${b.weaponName} build ${n}`} data-tip="Edit in the drawer" onClick=${() => onEdit && onEdit(b)}><${Icon} name="square-pen" /></button>
                            <i class="wg-vr" aria-hidden="true"></i>
                            <button type="button" class="wg-ib wg-del" aria-label=${`Stage deletion of ${b.weaponName} build ${n}`} data-tip="Stage deletion" onClick=${() => del(b)}><${Icon} name="trash-2" /></button>
                        </div>`}</td>${ends.has(i) ? gut(i) : null}`; })}</tr></tfoot>`}
            </table>`;
    };

    // ── nothing picked: the faded table, the search, the line as two readouts, and the tiles ──
    if (!picked.length) {
        const g = options.find((o) => o.builds.length >= 3) || options[0];
        const ghostCols = g ? [...g.builds].sort((x, y) => numberOf(x) - numberOf(y)).slice(0, 3) : [];
        return html`
            <div id="compare" class="cx" data-f=${view} data-st="empty">
                <div class="cx-land">
                    ${ghostCols.length ? html`<div class="cx-ghost" aria-hidden="true" inert>${Table({ cols: ghostCols, ghost: true })}</div>` : null}
                    <div class="cx-over">
                        <${WeaponPick} options=${options} picked=${picked} on=${on} numberOf=${numberOf} onPick=${pickW} onBuild=${pickB} big />
                        <p class="cx-lead">
                            <span class="b4-echo" data-tone="neutral"><${Icon} name="columns-3" /><b>Pick a weapon</b><i aria-hidden="true"></i><span>every one of its builds opens in columns</span></span><${Icon} name="chevron-right" />
                            <span class="b4-echo" data-tone="neutral"><${Icon} name="plus" /><b>Add a second</b><i aria-hidden="true"></i><span>to set them side by side</span></span></p>
                        <div class="cx-shelf" ref=${shelfRef}>${deck.slice(0, cap).map((o) => html`<${Tile} key=${o.weapon} o=${o} numberOf=${numberOf} landing onAdd=${add} onAddOne=${addOne} />`)}</div>
                    </div>
                </div>
            </div>`;
    }

    const cols = lone && sug ? [lone, sug] : chosen;
    const sgAt = lone && sug ? 1 : -1;
    const { rows: tRows, same } = rowsOf(cols, cols.length > 1 && sgAt < 0);
    // AD: a value some builds of one weapon share is a chip in the band — the slot, the value, the builds as their numbers in the weapon's colour — never words in the cell
    const shared = sgAt >= 0 ? [] : tRows.flatMap((r, ri) => (r.all ? [] : runsOf(cols, r, sgAt).filter((x) => x.span > 1 && x.v != null).map((x) => ({ r, ri, ...x }))));
    const hoverBuild = (id) => { const i = cols.findIndex((b) => String(b._id) === id); setHc(id && i >= 0 ? { r: -1, c0: i, c1: i } : null); };
    // V42 AO: the board's own buttons. Clear table empties the six builds and keeps the weapons — the transparent button whose hover tints, as Export's
    // Clear does for a file (.b3-xf-clr); Reset takes every weapon off and starts again — the board's solid fill in the delete hue, as the drawers' Discard
    // (.b3-btn2.go.dang): both throw away what was set up here, and neither touches a build.
    const tools = html`
        <div class="cx-tools">
            <button type="button" class="b3-btn2 quiet cx-tb cx-clr" disabled=${!chosen.length} onClick=${() => setOn(new Set())}><${Icon} name="x" />Clear table</button>
            <button type="button" class="b3-btn2 go dang cx-tb" onClick=${() => { setOn(new Set()); onSetWeapons([]); }}><${Icon} name="rotate-ccw" />Reset</button>
        </div>`;
    // V42 AP: the seats sit beside the search, at its height
    const seats = html`
        <span class=${'cx-seats' + (full ? ' full' : '')} key=${`cap${deny}`} data-deny=${deny ? 'true' : null} aria-live="polite" data-tip=${`At most ${MAX} builds sit side by side`}>
            <span class="cx-sts" aria-hidden="true">${Array.from({ length: MAX }, (_, k) => html`<i key=${k} class=${chosen[k] ? 'on' : ''} style=${chosen[k] ? `--c:${optionOf(chosen[k].weaponName).accent}` : null}></i>`)}</span>
            <span class="cx-stt"><b>${chosen.length}</b>of ${MAX} builds</span></span>`;
    const top = html`<div class="cx-top"><${WeaponPick} options=${options} picked=${picked} on=${on} numberOf=${numberOf} onPick=${pickW} onBuild=${pickB} placeholder="Add weapons" open0=${reopen.current} />${seats}${tools}</div>`;
    const tiles = html`<div class="cx-tiles b3-fadx" data-rows="2"><div class="cx-tl">${picked.map((w) => html`<${Tile} key=${w} o=${optionOf(w)} numberOf=${numberOf} on=${on} full=${full} onToggle=${toggle} onRemove=${remove} onHover=${hoverBuild} />`)}</div></div>`;
    // V42 AN/AQ: the band is a two-row key over the table — its names in the row-name column's own face and width, its chips starting where the builds
    // start — and every chip in it is the manifest's attachment chip (.wg-at: the slot in its colour, the edge in its colour). A Shared chip adds the
    // builds that share it, as plain numbers in their weapon's colour after a hairline. Two rows at most, then the board's sideways fade.
    const band = same.length || shared.length ? html`
        <div class="cx-band" onMouseLeave=${() => setHc(null)}>
            ${same.length ? html`<span class="cx-bn">Same on all ${chosen.length}</span><div class="cx-bv cx-same b3-fadx" data-rows="2"><div class="cx-bvl">${same.map(([k, v, c]) => html`<span class="cx-sv wg-at" key=${k} data-slot=${k} style=${`--sl:${c}`}
                onMouseEnter=${() => { const ri = tRows.findIndex((r) => r.key === k); setHc(ri >= 0 ? { r: ri, c0: 0, c1: cols.length - 1 } : { r: -1, c0: 0, c1: cols.length - 1 }); }}><span class="wg-an">${v}</span></span>`)}</div></div>` : null}
            ${shared.length ? html`<span class="cx-bn">Shared</span><div class="cx-bv cx-same b3-fadx" data-rows="2"><div class="cx-bvl">${shared.map((x) => html`
                <span class="wg-at cx-shc" key=${x.r.key + x.i} data-slot=${x.r.key} style=${`--sl:var(--sl-${slug(x.r.key)}, var(--sl-unknown));--c:${optionOf(cols[x.i].weaponName).accent}`} onMouseEnter=${() => setHc({ r: x.ri, c0: x.i, c1: x.i + x.span - 1 })}
                      aria-label=${`${x.r.key}: ${x.v}, shared by ${cols[x.i].weaponName} builds ${cols.slice(x.i, x.i + x.span).map((b) => numberOf(b)).join(', ')}`}><span class="wg-an">${x.v}</span><span class="cx-shb" aria-hidden="true">${cols.slice(x.i, x.i + x.span).map((b) => html`<i key=${String(b._id)}>${numberOf(b)}</i>`)}</span></span>`)}</div></div>` : null}
        </div>` : null;
    // V42 (his Clear table): with weapons and no build the table does not become a sentence — it is the landing's faded table under the landing's readout
    if (!chosen.length) {
        const offCols = picked.flatMap((w) => sortedOf(w)).slice(0, 3);
        return html`<div id="compare" class="cx" data-f=${view} data-st="off">${top}${tiles}
            <div class="cx-land cx-off">${offCols.length ? html`<div class="cx-ghost" aria-hidden="true" inert>${Table({ cols: offCols, ghost: true })}</div>` : null}
                <div class="cx-over"><p class="cx-lead"><span class="b4-echo" data-tone="neutral"><${Icon} name="columns-3" /><b>No builds in the table</b><i aria-hidden="true"></i><span>turn on a build number in the tiles above</span></span></p></div></div></div>`;
    }

    const multiW = new Set(chosen.map((b) => b.weaponName)).size > 1;
    // AH: the Discord bar shows what it opens — a fan of the cards in miniature, each edged in its build's colour — then a title, and a Show / Hide pill
    const cards = html`
        <div class=${'cx-dc' + (dc ? ' open' : '')}>
            <button type="button" class="cx-dcb" aria-expanded=${dc ? 'true' : 'false'} aria-controls="cx-dcw" onClick=${() => setDc(!dc)}>
                <span class="cx-dcf" aria-hidden="true">${chosen.map((b, k) => html`<i key=${String(b._id)} style=${`--c:${optionOf(b.weaponName).accent};--k:${k};--m:${(chosen.length - 1) / 2}`}><b></b><b></b><b></b></i>`)}</span>
                <span class="cx-dct"><b>Discord preview</b><small>Preview the builds as Discord embeds</small></span>
                <span class="cx-dcp"><${Fold} open=${dc} />${dc ? 'Hide' : 'Show'}</span></button>
            <div class="cx-dcw" id="cx-dcw" inert=${dc ? null : true}><div class="cx-dcin">
                <div class="cx-emb" data-n=${chosen.length}>${chosen.map((b) => html`
                    <figure class="cx-cc" key=${String(b._id)} style=${`--c:${optionOf(b.weaponName).accent}`}>
                        <figcaption class="cx-eh">${multiW ? html`<span class="wg-line"><b>${b.weaponName}</b></span>` : null}<span class="b3-sd-gn">Build ${numberOf(b)}</span>${nameOf(b) ? html`<span class="cx-hl">${nameOf(b)}</span>` : null}</figcaption>
                        ${Card ? html`<${Card} build=${b} siblings=${builds.filter((x) => x.mode === b.mode && keyOf(x.weaponName) === keyOf(b.weaponName))} />` : null}
                    </figure>`)}</div></div></div>
        </div>`;

    return html`
        <div id="compare" class="cx" data-f=${view} data-st=${lone ? 'one' : 'table'}>
            ${top}${tiles}${band}
            <div class="cx-tw" onMouseLeave=${() => setHc(null)}>${Table({ cols, sgAt })}</div>
            ${cards}
        </div>`;
}
