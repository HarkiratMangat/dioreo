// BOARD 4 · v11 — the build drawer's ADD panel, rebuilt as components (2026-09-22 13:37 EDT, his v10 intake items 1–21).
// Every complaint in that intake was one defect in a different place: the weapon field glowed amber, the category was the operating
// system's own menu, the label's glow was clipped by the BUILD tile, the link field was a bar inside a bar, borders doubled, the × floated
// outside its field. The class under all of them: there was NO FIELD COMPONENT, so each field drew its own box. Here ONE shell (.f-fld)
// owns the box — fill, edge, hover, focus ring — and what sits inside it (a prefix, the bare input, a suffix) has no box of its own, so
// none of those defects can come back on a field nobody has thought of yet. ONE picker (.f-pick) serves the weapon, the category, an
// attachment slot and a stored image key. Board 4 only: Board 3-E (closed) keeps b3/drawer.js's own body.
import { Layer, layerHost } from '../b3/layer.js';   // an open list renders outside a faded column (b3/layer.js)
import { html } from '../vendor/htm-preact.mjs';
import { useState, useRef, useEffect, useLayoutEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { B3Badges } from '../b3/armory-parts.js';
import { RANK_MODES } from './bulkformat.js';

/* global codeFill, slotCatalogue, deriveNextImageKey, DISPLAY_SLOT_ORDER, SLOT_LABEL_TEXT, buildNumberOf */

const CATS = [['AR', 'Assault Rifle'], ['SMG', 'Submachine Gun'], ['LMG', 'Light Machine Gun'], ['MARKSMAN', 'Marksman'], ['SNIPER', 'Sniper'], ['SHOTGUN', 'Shotgun'], ['SECONDARIES', 'Secondary']];  // v17 (his item 9): no Melee; no build has ever carried it
export const CAT_ORDER = CATS.map(([c]) => c);   // (V44 AT) one order for every weapon list: the build drawer's and Compare's
const catRank = (c) => { const i = CAT_ORDER.indexOf(c); return i < 0 ? 99 : i; };
const CAT_SHORT = { AR: 'AR', SMG: 'SMG', LMG: 'LMG', MARKSMAN: 'Marksman', SNIPER: 'Sniper', SHOTGUN: 'Shotgun', SECONDARIES: 'Secondaries' };
// v17: the manifest's own category words (ASSAULT, SMG…), set in its tag style, and the slot vocabulary in the Armory's display order
const CAPS = (c) => (typeof CATEGORY_CHIP_LABEL !== 'undefined' && CATEGORY_CHIP_LABEL[c]) || CAT_SHORT[c] || c;
const ORDER = ['Optic', 'Muzzle', 'Barrel', 'Stock', 'Laser', 'Underbarrel', 'Rear Grip', 'Ammunition', 'Perk'];
const slotRank = (s) => { const i = ORDER.indexOf(s); return i < 0 ? 99 : i; };
const slotVar = (s) => (s ? `var(--sl-${String(s).toLowerCase().replace(/\s+/g, '-')}, var(--sl-unknown))` : 'var(--sl-unknown)');
const MP_TIERS = [['best', 'Best'], ['top3', 'Top 3'], ['top5', 'Top 5'], ['capable', 'Capable']];  // v19 (his item 7): Top 4 is retired; Capable is the fourth tier
// DMZ ranks the way the bot reads them (utils/loadoutRender.js buildBadgesLine): a tier, and optionally a combat range — bare 'top5' is 'Top 5 DMZ'.
const DMZ_TIERS = [['best', 'Best'], ['top3', 'Top 3'], ['top5', 'Top 5'], ['capable', 'Capable']];
const RANGES = [['', 'Any range'], ['close', 'Close'], ['midlong', 'Mid–long']];
const keyOf = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const norm = (k) => String(k || '').replace(/\.png$/i, '');
// A BOARD SAMPLE, and the gate's notes say so: images uploaded but used by no build. The kit carries no Cloudinary listing, so these
// three exist only to show the "Unused upload" state he asked for (his answer of 13:06 EDT); the portal lists the real ones (Session 5).
export const UNUSED = ['BAL-27-7', 'FENNEC-4', 'LOCUS-3'];

let seq = 0;
const blank = (m) => ({ mode: m, weaponName: '', category: 'AR', buildName: '', shareCode: '', isMeta: false, isToxic: false, isAss: false, rank: 'none', rankModes: [], imageMethod: 'up', imageKey: '', imageLink: '', fileName: '', fileSize: '', filePreview: '' });
// A card is one build: its fields and its attachment rows. His ruling of 13:06 EDT: a new card starts BLANK, in the drawer's current mode.
export function newCard(m, patch = {}, id = null) { return { id: id || `c${++seq}`, f: { ...blank(m), ...patch, mode: m }, atts: Array(m === 'DMZ' ? 9 : 5).fill('') }; }
// One Stage covers every card, and a mixed set says its mix (his ruling: one Stage may carry MP and DMZ together).
export function stageLabel(cards) {
    const mp = cards.filter((c) => c.f.mode === 'MP').length, dmz = cards.length - mp;
    if (cards.length === 1) return `Stage this ${cards[0].f.mode} build`;
    if (!mp || !dmz) return `Stage ${cards.length} ${mp ? 'MP' : 'DMZ'} builds`;
    return `Stage ${mp} MP + ${dmz} DMZ`;
}
export const cardBlocked = (c) => !c.f.weaponName.trim() || !c.atts.some((a) => a.trim());
// v13 (2026-09-22 16:31 EDT) — a disabled Stage never sits there without saying why (clarify): the first blocked card, what it needs, how many more.
export function blockedReason(cards) {
    const i = cards.findIndex(cardBlocked); if (i < 0) return null;
    const what = cards[i].f.weaponName.trim() ? 'attachment' : 'weapon';
    const rest = cards.filter(cardBlocked).length - 1;
    const text = cards.length === 1 ? (what === 'weapon' ? 'Pick a weapon to stage' : 'Add an attachment to stage')
        : (() => { const need = (c) => (c.f.weaponName.trim() ? 'an attachment' : 'a weapon'); const all = cards.map((c, k) => [c, k]).filter(([c]) => cardBlocked(c));
            // v16 (his shot 3): name each card that blocks, not "· 1 more"; past two, the first two and a count
            const said = all.slice(0, 2).map(([c, k]) => `Card ${k + 1} needs ${need(c)}`).join(' · ');
            return all.length > 2 ? `${said} · ${all.length - 2} more` : said; })();
    return { i, what, text };
}

// The disclosure mark MORPHS through the flat line rather than rotating (the board's standing icon rule; icons.js's Fold does the same).
export function Caret({ open }) {
    return html`<svg class="ic f-cr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path style=${`d:path("${open ? 'M6 15 L12 9 L18 15' : 'M6 9 L12 15 L18 9'}")`} /></svg>`;
}

// ── THE PICKER — weapon, category, an attachment slot, a stored image key ──────────────────────────────────────────────────────
// A combobox on the field shell: type to filter (or not, for a closed list), ↑ ↓ Enter Escape, the typed part marked, the chosen row
// ticked at its END so no row reserves an empty leading column (his item 8: "the left side is wasting so much empty space"), and a name
// that never wraps (".50 GS" and "3-LINE RIFLE" did). Escape closes the list without closing the drawer: the drawer listens on the
// document, and the list's own handler stops the event first.
// 2026-09-29 17:56 EDT (his V41 class AF, Compare's search): four opt-in props, every one off by default so the build drawer's lists are unchanged — `keep` leaves the
// list open after a pick (several weapons in one visit), `grouped` heads each run of `o.group` with its name, `extra(o)` renders beside a row's name
// (Compare's build-number chips), `open0` opens the list on mount (arriving from the landing keeps the list open in the bar).
// V42 AI (his: "i didn't mean with the category as a label"): `grouped` orders the rows and marks where a group starts (f-g0, a hairline above it);
// it no longer draws a label row. The row carries its own category word (o.meta), as every Picker row does.
// 2026-09-30 19:30 EDT (his: "also add this divider line in the attachment's dropdown menu as well"): the attachment list is grouped by slot too, so a hairline
// marks where OPTIC gives way to MUZZLE, as the weapon list marks a new category.
// V44 (2026-09-29 22:33 EDT, his classes AT, BA, BB): `grouped`'s hairline is the Picker's own (classes.css), not one consumer's, so the build drawer's weapon list
// has it too; `sel(o)` ticks every row a list that picks several has picked (the same end tick as `value`, aria-multiselectable), and `drop` says a
// ticked row's click takes it out, so its hovered tick morphs into the delete ×. The tick is drawn inline so it can morph (a sprite mark cannot).
export function Picker({ id, value, placeholder = '', options, onPick, onType = null, typed = true, lead = null, label, empty = 'Nothing matches', clearable = false, mono = false, cls = '', hue = null, keep = false, grouped = false, extra = null, open0 = false, sel = null, drop = false }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState(null);
    const [hi, setHi] = useState(0);
    const [up, setUp] = useState(false);
    const [host, setHost] = useState(null);   // where the open list renders: in place, or a layer outside the faded column it sits in
    // the click that focuses the field would otherwise drop a caret into the value it just selected (mouseup deselects)
    const fresh = useRef(false);
    const wrap = useRef(null);
    const shown = (options.find((o) => o.value === value) || {}).label || value || '';
    const text = q != null ? q : shown;
    const query = (q || '').trim().toLowerCase();
    const list = !typed || !query ? options : options.filter((o) => `${o.label} ${o.find || ''} ${o.meta || ''}`.toLowerCase().includes(query));
    const at = Math.min(hi, Math.max(0, list.length - 1));
    // 2026-09-28 20:35 EDT (his: "the build drawer's dropdown menu still clips at the top for Weapon name/category fields"): the list sat absolute inside the
    // scrolling form column, and the up/down test compared the room on each side without asking whether the list FIT — in a short window an upward list
    // taller than the room ran past the column's top and the column clipped it. The list is now a member of the pop-up family (usePop, b3/broadcast.js):
    // fixed, 10px off its field, inside the drawer and the window, its height capped to the room on the side it opens (down when it fits, else the roomier side), and
    // closed by any scroll outside it. It still runs to its column's right edge and never past it (v16), its rows ellipsizing.
    // Measured with docs/pins2/instruments/board4-menu-fit.cjs at 700, 820 and 960px tall.
    const menu = useRef(null), selfScroll = useRef(false);
    useLayoutEffect(() => {
        const el = menu.current, t = wrap.current; if (!open || !el || !t) return;
        el.style.animation = 'none';   // measured settled, as usePop does: the entrance's first frame is translated
        let f = t.getBoundingClientRect();
        const col = (t.closest('.b3-fady, .dw-b') || document.documentElement).getBoundingClientRect();
        // bounded by the drawer's body and the window (the header and footer sit above it, so a list that ran into them was covered — the second cut
        // bounded by the whole drawer and the header still hid its top). The columns it crosses are scroll fades, and a fade is a MASK, which hides everything outside its box, fixed
        // children included (bounding by the drawer alone left the list's top under the column's edge exactly as before): while a list or pop-up is open the
        // columns drop their mask once their fade has eased to nothing (b4/classes.css), so the list shows whole wherever it opens.
        let dr = (t.closest('.dw-b') || t.closest('.drawer') || document.documentElement).getBoundingClientRect();
        // the board shows a drawer IN the page, so it can sit half below the window: when the list has room on neither side, the page moves just enough
        // for it to open downward inside the drawer's body (a portal drawer fills the window and never needs this)
        const need = Math.min(el.scrollHeight, 296) + 10 + 8;
        if (innerHeight - f.bottom < need && f.top - Math.max(8, dr.top + 8) < need && dr.bottom > innerHeight) {
            const by = Math.round(Math.min(need - (innerHeight - f.bottom), dr.bottom - innerHeight));
            if (by > 0) { selfScroll.current = true; scrollBy(0, by); f = t.getBoundingClientRect(); dr = (t.closest('.dw-b') || t.closest('.drawer')).getBoundingClientRect(); }
        }   // the drawer's BODY: its header and footer paint over a list that runs into them
        const lo = Math.max(8, dr.top + 8), floor = Math.min(innerHeight - 8, dr.bottom - 8), gap = 10;
        const want = Math.min(el.scrollHeight, 296), roomDown = floor - f.bottom - gap, roomUp = f.top - gap - lo;
        const goUp = roomDown < want && roomUp > roomDown;
        el.style.maxHeight = `${Math.max(0, Math.min(want, goUp ? roomUp : roomDown))}px`;
        el.style.minWidth = `${Math.round(f.width)}px`;
        el.style.setProperty('--mw', `${Math.max(200, Math.floor(Math.min(col.right, innerWidth - 16) - f.left))}px`);
        const left = Math.round(f.left), top = Math.round(goUp ? f.top - gap - el.offsetHeight : f.bottom + gap);
        el.style.left = `${left}px`; el.style.top = `${top}px`; el.style.bottom = 'auto';
        const got = el.getBoundingClientRect();   // a transformed drawer makes it the containing block: correct by what landed, as usePop does
        if (Math.abs(got.left - left) > 0.5 || Math.abs(got.top - top) > 0.5) { el.style.left = `${2 * left - got.left}px`; el.style.top = `${2 * top - got.top}px`; }
        el.style.animation = '';
        if (goUp !== up) setUp(goUp);
    }, [open, list.length, up, host]);
    useLayoutEffect(() => { setHost(open && wrap.current ? layerHost(wrap.current) : null); }, [open]);
    useEffect(() => {
        if (!open) return undefined;
        const off = (e) => { if (wrap.current && !wrap.current.contains(e.target) && !(menu.current && menu.current.contains(e.target))) { setOpen(false); setQ(null); } };   // the list may render outside the field (b3/layer.js)
        document.addEventListener('pointerdown', off);
        const sc = (e) => { if (selfScroll.current) { selfScroll.current = false; return; } const t = e.target; if (menu.current && t && t.nodeType === 1 && menu.current.contains(t)) return; setOpen(false); setQ(null); };
        addEventListener('scroll', sc, true);
        return () => { document.removeEventListener('pointerdown', off); removeEventListener('scroll', sc, true); };
    }, [open]);
    useEffect(() => { if (!open || !wrap.current) return; const on = (menu.current || wrap.current).querySelector('li.on'); const ul = on && on.parentElement; if (!ul) return;
        // (2026-09-23 08:45 EDT) the list scrolls ITSELF only: scrollIntoView also scrolled the form column, up and sideways, the moment a list opened
        // 2026-09-28 13:53 EDT (class K): the row was scrolled flush to the list's edge, so its lit ring sat ON the menu's rounded edge and read as escaping it; it
        // now keeps the menu's own 6px padding on the side it scrolls to
        const pad = 6;
        if (on.offsetTop - pad < ul.scrollTop) ul.scrollTop = on.offsetTop - pad; else if (on.offsetTop + on.offsetHeight + pad > ul.scrollTop + ul.clientHeight) ul.scrollTop = on.offsetTop + on.offsetHeight + pad - ul.clientHeight; }, [at, open]);
    useEffect(() => { if (open0 && wrap.current) { const i = wrap.current.querySelector('input'); if (i) i.focus(); setOpen(true); } }, []);
    const take = (o) => { onPick(o.value, o); setQ(null); if (!keep) setOpen(false); };
    const onKey = (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) { setOpen(true); return; } setHi((at + 1) % Math.max(1, list.length)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((at - 1 + list.length) % Math.max(1, list.length)); }
        else if (e.key === 'Enter') { if (open && list[at]) { e.preventDefault(); take(list[at]); } }
        else if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); setQ(null); }
        else if (e.key === 'Tab') { setOpen(false); setQ(null); }
    };
    const tick = (o) => { const on = o.value === value || Boolean(sel && sel(o));
        return html`<span class="f-tick" data-drop=${on && drop ? 'true' : null}>${on ? html`<svg class="ic f-tk" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5L9.5 17M9.5 17L19 7.5" /></svg>` : null}</span>`; };
    const mark = (s) => { const i = query ? s.toLowerCase().indexOf(query) : -1; return i < 0 ? s : html`${s.slice(0, i)}<mark>${s.slice(i, i + query.length)}</mark>${s.slice(i + query.length)}`; };
    const menuEl = open ? html`
                <ul class="f-menu" id=${`${id}-list`} role="listbox" aria-label=${label} aria-multiselectable=${sel ? 'true' : null} ref=${menu}>
                    ${list.length ? list.map((o, i) => html`
                                                <li key=${o.value} id=${`${id}-o${i}`} role="option" aria-selected=${o.value === value || (sel && sel(o)) ? 'true' : 'false'} class=${(i === at ? 'on' : '') + (grouped && o.group && i > 0 && list[i - 1].group !== o.group ? ' f-g0' : '')} style=${o.hue ? `--c:${o.hue}` : null}
                            onMouseEnter=${() => setHi(i)} onMouseDown=${(e) => { e.preventDefault(); take(o); }}>
                            ${o.thumb !== undefined ? html`<span class="f-thumb" aria-hidden="true"><${Icon} name="image" /></span>` : null}
                            <span class=${'f-ol' + (o.tag ? ' f-tag' : '')}>${mark(o.label)}</span>
                            ${o.meta ? html`<span class="f-om" style=${o.metaHue ? `--c:${o.metaHue}` : null}>${o.meta}</span>` : null}
                            ${extra ? extra(o) : o.count ? html`<span class="f-oc b3-sd-gn" style=${o.countHue ? `--c:${o.countHue}` : null}>${o.count}</span>` : null}
                            ${tick(o)}
                        </li>`) : html`<li class="f-none" role="presentation">${empty}</li>`}
                </ul>` : null;
    return html`
        <div class=${'f-pick' + (cls ? ` ${cls}` : '') + (open ? ' open' : '') + (up ? ' up' : '')} ref=${wrap} style=${hue ? `--c:${hue}` : null}>
            <div class=${'f-fld' + (value ? ' filled' : '') + (typed ? '' : ' closed')}>
                ${lead ? html`<span class="f-pre f-ic">${lead}</span>` : null}
                <input data-bare id=${id} class=${'f-in' + (mono ? ' mono' : '')} value=${text} placeholder=${placeholder} role="combobox" aria-expanded=${open ? 'true' : 'false'} aria-controls=${`${id}-list`} aria-autocomplete=${typed ? 'list' : 'none'}
                       aria-activedescendant=${open && list[at] ? `${id}-o${at}` : ''} autocomplete="off" spellcheck="false" readOnly=${!typed}
                       onFocus=${(e) => { setOpen(true); if (typed && value) { e.target.select(); fresh.current = true; } }} onMouseUp=${(e) => { if (fresh.current) { e.preventDefault(); fresh.current = false; } }} onClick=${() => setOpen(true)} onKeyDown=${onKey}
                       onInput=${(e) => { setQ(e.target.value); setHi(0); setOpen(true); if (onType) onType(e.target.value); }} />
                ${clearable && value ? html`<button type="button" class="f-suf f-clr" aria-label=${`Clear ${value}`} onMouseDown=${(e) => e.preventDefault()} onClick=${() => { onPick('', null); setQ(null); }}><${Icon} name="x" /></button>` : null}
                <button type="button" class="f-suf f-caret" tabIndex="-1" aria-label=${open ? 'Close the list' : 'Open the list'} onMouseDown=${(e) => { e.preventDefault(); setOpen(!open); }}><${Caret} open=${open} /></button>
            </div>
            ${open ? (host ? html`<${Layer} host=${host} cls=${'f-form f-pick open' + (up ? ' up' : '') + (cls ? ` ${cls}` : '')} style=${hue ? `--c:${hue}` : ''}>${menuEl}<//>` : menuEl) : null}
        </div>`;
}

// 2026-10-07 16:40 EDT (his: "your search dropdowns are completely wrong. you hand drew them again!"): the build card's weapon, category and attachment
// fields, lifted out of the card body unchanged so the spec board renders THESE fields with THESE options instead of a copy of them. The card calls
// them exactly as it drew them inline (its markup was diffed before and after: identical).
export function weaponsOf(builds, mode) { return [...new Map(builds.filter((b) => b.mode === mode).map((b) => [b.weaponName, b])).values()].sort((a, b) => catRank(a.category) - catRank(b.category) || a.weaponName.localeCompare(b.weaponName, undefined, { numeric: true })); }   // V44 AT: by category, A–Z inside
export function WeaponField({ id, value, builds, mode, onType, onPick }) {
    const weapons = weaponsOf(builds, mode);
    const wOpts = weapons.map((b) => ({ value: b.weaponName, label: b.weaponName, meta: CAPS(b.category), group: b.category, metaHue: b.accent || 'var(--ink3)', count: plural(builds.filter((x) => x.mode === mode && x.weaponKey === b.weaponKey).length, 'build'), hue: b.accent || 'var(--ink3)' }));
    return html`<${Picker} id=${id} value=${value} placeholder="Search weapons" options=${wOpts} label="Weapons" typed grouped
        lead=${html`<${Icon} name="search" />`}
        onType=${onType} onPick=${(v) => onPick(v, weapons.find((x) => x.weaponName === v))}
        empty="A new weapon — keep typing its name" />`;
}
export function CategoryField({ id, value, builds, hue, onPick }) {
    const cOpts = CATS.map(([c]) => ({ value: c, label: CAPS(c), tag: true, hue: (builds.find((b) => b.category === c) || {}).accent || 'var(--ink3)' }));
    return html`<${Picker} id=${id} value=${value} options=${cOpts} label="Categories" typed=${false} cls="f-catpick" hue=${hue}
        lead=${html`<i class="f-dot" style=${`--c:${hue}`}></i>`} onPick=${onPick} />`;
}
// one attachment row: the slot's name (or "Attachment n" before a code names it) and the picker for that slot
export function AttachmentRow({ id, n, value, slot, auto, catalogue, onType, onPick }) {
        const pool = Object.keys(catalogue).filter((nm) => !slot || String(catalogue[nm]).toLowerCase() === slot.toLowerCase()).map((nm) => ({ value: nm, label: nm, group: catalogue[nm], meta: slot ? null : catalogue[nm], metaHue: slot ? null : slotVar(catalogue[nm]), hue: slotVar(slot || catalogue[nm]) }))  /* the row's hover and selection wear its slot's colour (his 10:17 EDT catch) */
            .sort((x, y) => slotRank(slot || catalogue[x.value]) - slotRank(slot || catalogue[y.value]) || x.label.localeCompare(y.label, undefined, { numeric: true }));  // v17 (his item 10): Optic first, Perk last
        // his items 18, 20, 21: the slot's name in its own colour; a slot the code filled carries the yellow wand alone; its field stays a plain field
    return html`
        <div class=${'f-att' + (auto ? ' auto' : '')}>
            <span class=${'f-slot' + (slot ? '' : ' q')} style=${slot ? `--sl:${slotVar(slot)}` : null}>${slot || `Attachment ${n}`}${auto ? html`<span class="f-wand" title="Recognized from the gunsmith code"><${Icon} name="wand-sparkles" /></span>` : null}</span>
            <${Picker} id=${id} value=${value} placeholder=${slot ? `Search ${slot.toLowerCase()}` : 'Search attachments'} options=${pool} label=${slot ? `${slot} attachments` : 'Attachments'} typed clearable grouped
                onType=${onType} onPick=${onPick} empty="Not in the armory yet — it will be added as typed" />
        </div>`;
}

// v19 (his items 11, 12, 22): EVERY ROW IS ONE GRAMMAR — its label in the form's label column, the control beside it. A required field that is
// filled says so with a tinted check beside its label; a section's heading carries its state (warn "Weapon required" → ok "Ready"). The status
// chip is the board's one rectangle (.b4-hint) in four tones with fixed meanings: warn (something blocks), ok (satisfied), magic (the system did
// this for you — the gunsmith code's recognition), and neutral (a plain count).
// 2026-09-28 13:53 EDT (his C3 round, class O — "a class change, not instance"): the Before staging card minimises to an info chip left of Cancel, in the
// tone of what it holds (warn while something blocks, ok when ready). ONE state for every form drawer: the post drawer and the build drawer read
// the same stored choice, so minimising it once is minimising it everywhere, and it stays so across closing and reloading.
const SMK = 'b4-stage-min';
export function useStageMin() {
    const [min, setMin] = useState(() => { try { return localStorage.getItem(SMK) === '1'; } catch (e) { return false; } });
    useEffect(() => { const on = () => { try { setMin(localStorage.getItem(SMK) === '1'); } catch (e) { /* private window */ } }; addEventListener(SMK, on); return () => removeEventListener(SMK, on); }, []);
    const set = (v) => { try { localStorage.setItem(SMK, v ? '1' : '0'); } catch (e) { /* private window: this drawer only */ } setMin(v); dispatchEvent(new Event(SMK)); };
    return [min, set];
}
export const StageMinBtn = ({ onMin }) => html`<button type="button" class="b3-x f-stmin" aria-label="Minimise Before staging" data-tip="Minimise" onClick=${onMin}><${Icon} name="minus" /></button>`;
export function StageMini({ tone = 'ok', say = '' }) {
    const [min, set] = useStageMin();
    return min ? html`<button type="button" class="f-stm f-stmini" data-tone=${tone} aria-label=${`Show Before staging: ${say}`} data-tip=${say} onClick=${() => set(false)}><${Icon} name="info" /></button>` : null;
}
export const Chip = ({ tone = null, icon = null, children }) => html`<span class="b4-hint" data-tone=${tone}>${icon ? html`<${Icon} name=${icon} />` : null}${children}</span>`;
function Lab({ id, text, ok = false, opt = false }) {
    return html`<div class="f-lab">${id ? html`<label for=${id}>${text}</label>` : html`<span class="f-rl">${text}</span>`}${ok ? html`<span class="f-okm" title="Filled"><${Icon} name="check" /></span>` : null}${opt ? html`<${Chip} tone="neutral">Optional<//>` : null}</div>`;
}
// The closest of the preview's set shapes to an image's own (his item 15): landscape screenshots, a square crop, a phone held upright.
const RATIOS = [[16, 9], [4, 3], [1, 1], [3, 4], [9, 16]];
const ratioOf = (w, h) => { if (!w || !h) return null; const r = Math.log(w / h); return RATIOS.reduce((best, x) => (Math.abs(Math.log(x[0] / x[1]) - r) < Math.abs(Math.log(best[0] / best[1]) - r) ? x : best)); };

function pickFile(e, set) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const kb = file.size / 1024;
    set({ fileName: file.name, fileSize: kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`, filePreview: URL.createObjectURL(file) });
}

// ── THE MEDIA WELL — the preview and where the image comes from, as one object (his items 1–4) ────────────────────────────────
// Three sources, one well: upload (a drop row, then the chosen file on ONE line with its size and Replace inside it), a pasted link, or
// a STORED image searched by key — every image the Armory already holds, which build uses it, and uploads no build uses yet (his answer
// of 13:06 EDT). The key always says what it resolved to: the next free key, one taken by another build, found, unused, or missing.
// 2026-09-25 00:29 EDT: exported for the announcement form's banner (his "give it the full image attach feature/design that the build drawer got"):
// `sources` picks the switch's options, `keyed` false drops the Cloudinary key row, `what` names the thing in the drop zone.
export function MediaWell({ f, set, builds = [], id, reserved = [], sources = ['up', 'link', 'key'], keyed = true, what = 'a screenshot' }) {
    const src = f.imageMethod || 'up';
    // v19 (his item 13): the next free key skips every stored key (they carry .png), every unused upload and every other build in this drawer
    const auto = f.weaponName ? deriveNextImageKey(builds, f.weaponName, f.mode, [...UNUSED, ...reserved]) : '';
    const key = src === 'key' ? f.imageKey : (f.imageKey || auto);
    const same = (a, b) => norm(a).toUpperCase() === norm(b).toUpperCase();
    const owner = key ? builds.find((b) => same(b.imageKey, key)) : null;
    const ownerWord = owner ? `${owner.weaponName} · Build ${buildNumberOf(builds, owner).n}` : null;
    const here = Boolean(key) && reserved.some((k) => same(k, key));
    const wk = keyOf(f.weaponName);
    const keyOpts = [...builds.filter((b) => b.imageKey).map((b) => ({ value: norm(b.imageKey), label: norm(b.imageKey), hue: b.accent, meta: b.weaponName, metaHue: b.accent, count: `Build ${buildNumberOf(builds, b).n}`, countHue: b.accent, find: `${b.weaponName} build ${buildNumberOf(builds, b).n}`, thumb: null, mine: b.weaponKey === wk })),
        ...UNUSED.map((k) => ({ value: k, label: k, meta: 'Unused upload', thumb: null, mine: !!wk && keyOf(k).startsWith(wk) }))]
        .sort((a, b) => (b.mine - a.mine) || a.label.localeCompare(b.label, undefined, { numeric: true }));
    const isLink = src === 'link' && /^https?:\/\/\S+$/.test(f.imageLink);
    const [link, setLink] = useState(null);  // null · checking, false · failed, {w,h} · loaded
    const [dims, setDims] = useState(null);
    useEffect(() => { setLink(null); }, [f.imageLink]);
    const stored = src === 'key' && key ? (builds.find((b) => same(b.imageKey, key)) || {}).imageUrl : null;
    const pic = f.filePreview || (isLink && link !== false ? f.imageLink : null) || stored || null;
    // the measured size belongs to the picture it was measured on: a new file never inherits the last one's shape (a fast blob could load before an effect ran)
    const ar = pic && dims && dims.src === pic ? ratioOf(dims.w, dims.h) : null;
    // The key's state lives INSIDE its field, at its right end, the way the code field carries Copy (his item 14: "Your key" and its sparkle said nothing)
    const kst = src !== 'up' || !key ? null
        : owner ? ['warn', 'triangle-alert', `Replaces ${ownerWord}`]
        : here ? ['warn', 'triangle-alert', 'Another build here uses it']
        : UNUSED.includes(norm(key)) ? ['ok', 'check', 'Unused upload']
        : ['ok', 'check', f.imageKey ? 'Free' : 'Next free'];
    const sst = src === 'link' ? (!isLink ? null : link === false ? ['warn', 'triangle-alert', 'Didn’t load'] : link ? ['ok', 'check', `${link.w} × ${link.h}`] : ['neutral', 'link', 'Checking'])
        : src === 'key' ? (key ? (owner ? ['ok', 'check', `Used by ${ownerWord}`] : UNUSED.includes(key) ? ['ok', 'check', 'Unused upload'] : ['warn', 'triangle-alert', 'No image under this key']) : null) : null;
    const clearUp = () => set({ fileName: '', fileSize: '', filePreview: '' });
    return html`
        <div class="f-media">
            <div class="f-shotbox">
                <div class=${'f-shot' + (pic ? ' has' : '')} role="img" aria-label=${pic ? 'The chosen image' : 'No image chosen yet'} style=${`--ar:${ar ? `${ar[0]}/${ar[1]}` : '4/3'}`} data-ar=${ar ? `${ar[0]}:${ar[1]}` : null}>
                    ${pic ? html`<img src=${pic} alt="" onLoad=${(e) => { const d = { w: e.target.naturalWidth, h: e.target.naturalHeight }; setDims({ ...d, src: pic }); if (isLink) setLink(d); }} onError=${() => isLink && setLink(false)} />`
                        : html`<span class="f-empty"><${Icon} name="image-off" /><span>${src === 'key' ? 'Pick a stored image' : isLink && link === false ? 'The link didn’t load' : 'No image yet'}</span></span>`}
                </div>
            </div>
            <div class="f-mcol">
                <div class="f-src" role="radiogroup" aria-label="Where the image comes from">
                    ${[['up', 'Upload', 'upload'], ['link', 'Link', 'link'], ['key', 'Stored image', 'image']].filter(([v]) => sources.includes(v)).map(([v, l, ic]) => html`
                        <button type="button" key=${v} role="radio" aria-checked=${src === v ? 'true' : 'false'} onClick=${() => set({ imageMethod: v })}><${Icon} name=${ic} />${l}</button>`)}
                </div>
                ${src === 'up' ? (f.fileName ? html`
                    <div class="f-fld f-file"><span class="f-pre f-ic"><${Icon} name="image" /></span><span class="f-in f-fname" title=${f.fileName}>${f.fileName}</span><span class="f-fsz">${f.fileSize}</span>
                        <label class="f-suf f-rep">Replace<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange=${(e) => pickFile(e, set)} /></label>
                        <button type="button" class="f-suf f-clr" aria-label="Remove the image" onClick=${clearUp}><${Icon} name="x" /></button></div>`
                    : html`<label class="f-drop"><${Icon} name="upload" /><span class="f-dl">Drop ${what}, or <u>choose a file</u></span><span class="f-ds">Drop, or <u>choose a file</u></span><input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange=${(e) => pickFile(e, set)} /></label>`) : null}
                ${src === 'link' ? html`<div class="f-fld"><span class="f-pre f-ic"><${Icon} name="link" /></span><input data-bare class="f-in" value=${f.imageLink} placeholder="Paste an image link" spellcheck="false" autocomplete="off" aria-label="Image link" onInput=${(e) => set({ imageLink: e.target.value })} onBlur=${(e) => { e.target.scrollLeft = 0; }} />
                    ${sst ? html`<span class="f-kst" data-tone=${sst[0]}><${Icon} name=${sst[1]} />${sst[2]}</span>` : null}
                    ${f.imageLink ? html`<button type="button" class="f-suf f-clr" aria-label="Remove the link" onClick=${() => set({ imageLink: '' })}><${Icon} name="x" /></button>` : null}</div>` : null}
                ${src === 'key'
                    ? html`<${Picker} id=${`${id}-key`} value=${f.imageKey} placeholder="Search stored images" options=${keyOpts} label="Stored images" typed mono clearable lead=${html`<${Icon} name="search" />`} onType=${(v) => set({ imageKey: v })} onPick=${(v) => set({ imageKey: v })} empty="No stored image matches" />
                        ${sst ? html`<${Chip} tone=${sst[0]} icon=${sst[1]}>${sst[2]}<//>` : null}`
                    : src === 'link' || !keyed ? null : html`<div class="f-keyl"><span class="f-kl">Key</span><div class=${'f-fld f-key' + (kst ? ` t-${kst[0]}` : '')}><input data-bare class="f-in mono" value=${key} placeholder="Set from the weapon" spellcheck="false" autocomplete="off" aria-label="Image key" onInput=${(e) => set({ imageKey: e.target.value })} />
                        ${kst ? html`<span class="f-kst" data-tone=${kst[0]}><${Icon} name=${kst[1]} />${kst[2]}</span>` : null}</div></div>`}
            </div>
        </div>`;
}

// ── ONE BUILD ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function BuildCard({ card, n, builds, patch, first, reserved }) {
    const { f, atts } = card;
    const dmz = f.mode === 'DMZ';
    const [copied, setCopied] = useState(false);
    const set = (p) => patch((c) => ({ ...c, f: { ...c.f, ...p } }));
    const setAtt = (i, v) => patch((c) => ({ ...c, atts: c.atts.map((x, k) => (k === i ? v : x)) }));
    const wk = keyOf(f.weaponName);
    const fromCode = !dmz && f.shareCode.length >= 2 && wk ? codeFill(builds, wk, 'MP', f.shareCode) : [];
    // The code fills every slot it can name, and never overwrites one typed by hand (board 1 · G9's behaviour, kept).
    useEffect(() => {
        if (!fromCode.length) return;
        patch((c) => { const next = fromCode.map((e, i) => ((c.atts[i] && c.atts[i].trim()) ? c.atts[i] : e.name || '')); while (next.length < 5) next.push(''); return { ...c, atts: next }; });
    }, [f.shareCode, wk]);
    const catalogue = slotCatalogue(builds, f.mode);
    const hue = (builds.find((b) => b.category === f.category) || {}).accent || 'var(--ink3)';
    const recognized = fromCode.filter((e) => e.name).length;
    const slotOf = (i) => (dmz ? SLOT_LABEL_TEXT[DISPLAY_SLOT_ORDER[i]] : (fromCode[i] && fromCode[i].label) || (atts[i] && catalogue[atts[i].trim()]) || '');
    const hasW = Boolean(f.weaponName.trim());
    const used = atts.filter((a) => a.trim()).length;
    const autoAt = (i) => Boolean(!dmz && fromCode[i] && fromCode[i].name && fromCode[i].name === atts[i]);
    const filledByCode = atts.filter((a, i) => autoAt(i)).length;
    // v13 — before a code names the slots, rows appear one at a time (one more than the last filled), never five identical "Any slot" rows
    const lastAt = atts.reduce((m, a, i) => (a.trim() ? i : m), -1);
    const shown = !dmz && !fromCode.length ? Math.min(atts.length, lastAt + 2) : atts.length;
    const tiers = dmz ? DMZ_TIERS : MP_TIERS;
    const [tPart, rPart] = dmz && f.rank !== 'none' ? [f.rank.split('-')[0], f.rank.split('-')[1] || ''] : [f.rank, ''];
    const tierOf = (v) => (dmz ? { dmzRangeRank: rPart ? `${v}-${rPart}` : v, mode: 'DMZ', category: f.category, _id: `${card.id}-${v}` } : { categoryRank: v, mode: 'MP', category: f.category, _id: `${card.id}-${v}` });
    const idW = first ? 'nb-w' : `${card.id}-w`;
    return html`
        <div class="f-card-b" style=${`--f-hue:${hue}`}>
            <section class="f-sec" data-s="build">
                <h4 class="f-h"><span>Build</span>${hasW ? html`<${Chip} tone="ok" icon="check">Ready<//>` : html`<${Chip} tone="warn" icon="triangle-alert">Weapon required<//>`}</h4>
                ${''/* v20 (his 15:39 EDT): "i never asked for weapon and category to get the inline treatment" — only Label, Grade and Tier. They are
                     v18's stacked pair again (label over field, side by side); the ✓ beside a filled label stays */}
                <div class="f-g2">
                    <div class="f-row"><${Lab} id=${idW} text="Weapon" ok=${hasW} />
                        <${WeaponField} id=${idW} value=${f.weaponName} builds=${builds} mode=${f.mode} onType=${(v) => set({ weaponName: v })} onPick=${(v, b) => set({ weaponName: v, category: b ? b.category : f.category })} /></div>
                    <div class="f-row"><${Lab} id=${`${card.id}-c`} text="Category" ok=${hasW} />
                        <${CategoryField} id=${`${card.id}-c`} value=${f.category} builds=${builds} hue=${hue} onPick=${(v) => set({ category: v })} /></div>
                </div>
                <div class="f-row"><${Lab} id=${`${card.id}-l`} text="Label" opt=${!f.buildName.trim()} />
                    <div class="f-fld">
                        <span class="f-pre f-bno" title=${`This is ${f.weaponName || 'the weapon'}’s build ${n}`}><small>Build</small><b>${n}</b></span>
                        <input data-bare id=${`${card.id}-l`} class="f-in" value=${f.buildName} placeholder="Like Close range" maxLength="32" spellcheck="false" autocomplete="off" onInput=${(e) => set({ buildName: e.target.value })} />
                        ${''/* His call, 2026-10-01 11:32 EDT: "yes, show a character counter. We have enough space width/empty space inside the field
                             to put it inside there". The live n / 32 of plan §10.4 G6 row 2, which Board 4 had dropped; amber from 28, where the
                             cap is four characters away, because the field stops typing at 32 and says nothing else. 12:24 EDT, his: "include the character
                             counter icon beside it and wrap the entire thing in a tinted chip" — the count chip's family (CharCount's .b3-cc), sized for the field. */}
                        <span class=${'g-fact b3-cc f-cnt' + (f.buildName.length >= 28 ? ' warn' : '')} title="A label holds 32 characters at most"><${Icon} name="text" /><span><b>${f.buildName.length}</b>/32</span></span>
                    </div></div>
            </section>
            ${dmz ? null : html`
            <section class="f-sec" data-s="code">
                ${''/* his item 17: recognition is "look at this magic", not a confirmation — the wand, in the board's yellow, and the count of what it read */}
                <h4 class="f-h"><span>Gunsmith code</span>${!f.shareCode.trim() ? html`<${Chip} tone="neutral">Optional<//>` : null}${f.shareCode && recognized ? html`<${Chip} tone="magic" icon="wand-sparkles">Recognized ${recognized} of ${fromCode.length} slots<//>` : null}</h4>
                <div class="f-fld f-code">
                    <input data-bare id=${first ? 'nb-code' : `${card.id}-code`} class="f-in mono" value=${f.shareCode} spellcheck="false" autocomplete="off" placeholder="Paste the code from the game" aria-label="Gunsmith code"
                           onInput=${(e) => set({ shareCode: e.target.value.toUpperCase().replace(/\s+/g, '') })} />
                    <button type="button" class=${'f-suf f-cp' + (copied ? ' done' : '')} aria-label=${copied ? 'Copied' : 'Copy the code'} disabled=${!f.shareCode} onClick=${() => { try { navigator.clipboard.writeText(f.shareCode); } catch (e) { /* board only */ } setCopied(true); clearTimeout(window.__b4cp); window.__b4cp = setTimeout(() => setCopied(false), 1400); }}><${Icon} name=${copied ? 'check' : 'copy'} />${copied ? html`<span class="f-cpd">Copied</span>` : null}</button>
                </div>
            </section>`}
            <section class="f-sec" data-s="atts">
                <h4 class="f-h"><span>Attachments</span>${used
                    ? html`<${Chip} tone="ok" icon="check">Ready<//>${filledByCode ? html`<${Chip} tone="magic" icon="wand-sparkles">Filled ${plural(filledByCode, 'slot')}<//>` : null}<${Chip}>${used} of ${atts.length}<//>`
                    : html`<${Chip} tone="warn" icon="triangle-alert">Attachment required<//>`}</h4>
                <div class="f-atts">
                    ${atts.slice(0, shown).map((a, i) => {
                        const slot = slotOf(i);
                        const auto = autoAt(i);
                        return html`<${AttachmentRow} key=${i} id=${`${card.id}-a${i}`} n=${i + 1} value=${a} slot=${slot} auto=${auto} catalogue=${catalogue} onType=${(v) => setAtt(i, v)} onPick=${(v) => setAtt(i, v)} />`; })}
                </div>
            </section>
            <section class="f-sec" data-s="rank">
                <h4 class="f-h"><span>Badges</span>${!(f.isMeta || f.isToxic || f.isAss || f.rank !== 'none' || (!dmz && (f.rankModes || []).length)) ? html`<${Chip} tone="neutral">Optional<//>` : null}</h4>
                <div class="f-row f-rank"><${Lab} text="Grade" />
                    <div class="f-bdgs" role="group" aria-label="Grade">
                        ${''/* v20 (his item 37): ASS says the build is bad, so it cannot sit with META or a tier; picking either disables it and it disables them */}
                        ${[['isMeta', { isMeta: true }, 'META'], ['isToxic', { isToxic: true }, 'TOXIC'], ['isAss', { isAss: true }, 'ASS']].map(([k, b, word]) => { const off = k === 'isAss' ? (f.isMeta || f.rank !== 'none') : k === 'isMeta' && f.isAss; return html`
                            <button type="button" class="f-bt wg-cb" key=${k} role="checkbox" aria-checked=${f[k] ? 'true' : 'false'} aria-label=${word} disabled=${off} title=${off ? (k === 'isAss' ? 'ASS can’t sit with META or a tier' : 'META can’t sit with ASS') : null} onClick=${() => set({ [k]: !f[k] })}>
                                <span class=${'cb' + (f[k] ? ' on' : '')} aria-hidden="true"></span>
                                <${B3Badges} b=${{ ...b, _id: `${card.id}-${k}`, mode: f.mode, category: f.category }} />
                            </button>`; })}
                    </div></div>
                ${''/* v17 (his item 6): the range is the tier's qualifier ("Best at close range"), so it is the tier control's second row, opened once a
                     tier is picked, in that tier's colour */}
                <div class="f-row f-rank"><${Lab} text="Tier" />
                    <div class=${'f-tgrp' + (dmz && f.rank !== 'none' ? ' rng' : '')}>
                        <div class="f-tiers" role="radiogroup" aria-label="Tier">
                            <button type="button" class="f-tier none" role="radio" aria-checked=${f.rank === 'none' ? 'true' : 'false'} onClick=${() => set({ rank: 'none' })}>No tier</button>
                            ${tiers.map(([v, l]) => html`<button type="button" class="f-tier" key=${v} role="radio" aria-checked=${tPart === v ? 'true' : 'false'} aria-label=${l} disabled=${f.isAss} title=${f.isAss ? 'A tier can’t sit with ASS' : null} onClick=${() => set({ rank: dmz && rPart ? `${v}-${rPart}` : v })}><${B3Badges} b=${tierOf(v)} /></button>`)}
                        </div>
                        ${dmz && f.rank !== 'none' ? html`<div class="f-trng"><span class="f-tat">at</span>
                            <div class="f-rng" role="radiogroup" aria-label="Combat range">${RANGES.map(([r, l]) => html`<button type="button" key=${r || 'any'} role="radio" aria-checked=${rPart === r ? 'true' : 'false'} onClick=${() => set({ rank: r ? `${tPart}-${r}` : tPart })}>${l}</button>`)}</div></div>` : null}
                    </div></div>
                ${''/* 2026-09-25 23:19 EDT (his 23:12 EDT, the Modes family): the ranked modes this build is recommended for — any number, beside every grade and tier, MP only (a DMZ build has none) */}
                ${dmz ? null : html`<div class="f-row f-rank f-mrow"><${Lab} text="Rank Mode" />
                    ${''/* 2026-09-26 11:26 EDT (his: "make the build drawer toggle for it into the checkbox version. the rail doesn't make sense here, since the rail
                         kind of implies 'pick 1 only'"): the Grade row's own checkbox tiles (wg-cb, a box and the badge), since any number may be picked */}
                    <div class="f-bdgs f-mds" role="group" aria-label="Rank Mode">
                        ${RANK_MODES.map((m) => { const on = (f.rankModes || []).includes(m); return html`
                            <button type="button" class="f-bt wg-cb" key=${m} role="checkbox" aria-checked=${on ? 'true' : 'false'} aria-label=${m}
                                onClick=${() => set({ rankModes: RANK_MODES.filter((x) => (x === m ? !on : (f.rankModes || []).includes(x))) })}>
                                <span class=${'cb' + (on ? ' on' : '')} aria-hidden="true"></span>
                                <${B3Badges} b=${{ rankModes: [m], _id: `${card.id}-m-${m}`, mode: 'MP', category: f.category }} />
                            </button>`; })}
                    </div></div>`}
            </section>
            <section class="f-sec" data-s="image">
                <h4 class="f-h"><span>Image</span>${!(f.imageKey || f.imageLink || f.filePreview) ? html`<${Chip} tone="neutral">Optional<//>` : null}</h4>
                <${MediaWell} f=${f} set=${set} builds=${builds} id=${card.id} reserved=${reserved} />
            </section>
        </div>`;
}

function previewOf(card, builds, n) {
    const { f, atts } = card; const dmz = f.mode === 'DMZ'; const wk = keyOf(f.weaponName);
    const catalogue = slotCatalogue(builds, f.mode);
    const fromCode = !dmz && f.shareCode.length >= 2 && wk ? codeFill(builds, wk, 'MP', f.shareCode) : [];
    const slotOf = (i) => (dmz ? SLOT_LABEL_TEXT[DISPLAY_SLOT_ORDER[i]] : (fromCode[i] && fromCode[i].label) || '');
    const siblings = builds.filter((b) => b.mode === f.mode && b.weaponKey === wk);
    return { siblings, build: { ...f, _id: `draft-${card.id}`, weaponName: f.weaponName || '', attachments: atts.map((a) => a.trim()).filter(Boolean),
        attachmentSlots: atts.map((a, i) => (a.trim() ? slotOf(i) || catalogue[a.trim()] || '' : null)).filter((x) => x !== null),
        // v13 — the preview shows the image the form holds (an upload or a link), so it never says "no image" beside a chosen one
        ...(f.filePreview ? { imageKey: f.imageKey || 'upload', imageUrl: f.filePreview } : f.imageMethod === 'link' && /^https?:\/\/\S+$/.test(f.imageLink) ? { imageKey: 'link', imageUrl: f.imageLink } : {}),
        buildName: f.buildName || `Build ${n}`, categoryRank: dmz || f.rank === 'none' ? null : f.rank, dmzRangeRank: dmz && f.rank !== 'none' ? f.rank : null, rankModes: dmz ? [] : (f.rankModes || []), accent: (siblings[0] && siblings[0].accent) || null } };
}

// ── THE ADD PANEL — one card, or several (his item 17) ───────────────────────────────────────────────────────────────────────
// One build is just the form. Add another and every build becomes a card in the Export picker's own container language, so the set
// reads as a set; the card being edited is lit and the preview follows it. Nothing here stages: the drawer's one Stage covers every card.
export function B4AddForm({ builds, cards, setCards, active, setActive, Card, defaultMode }) {
    const multi = cards.length > 1;
    const ci = Math.min(active, cards.length - 1);
    const cur = cards[ci];
    const patchAt = (i) => (fn) => setCards((cs) => cs.map((c, k) => (k === i ? fn(c) : c)));
    const numberOf = (i) => {
        const c = cards[i]; const wk = keyOf(c.f.weaponName);
        const have = builds.filter((b) => b.mode === c.f.mode && b.weaponKey === wk).length;
        return have + (wk ? cards.slice(0, i).filter((x) => x.f.mode === c.f.mode && keyOf(x.f.weaponName) === wk).length : 0) + 1;
    };
    const preview = previewOf(cur, builds, numberOf(ci));
    const ghost = builds.find((b) => b.mode === cur.f.mode && b.category === cur.f.category && (b.attachments || []).length >= 4) || null;
    // v13 — a half-typed weapon ("ki") is not a build: the card waits for a weapon the Armory knows, or a first attachment on a new one.
    const known = builds.some((b) => b.mode === cur.f.mode && keyOf(b.weaponName) === keyOf(cur.f.weaponName));
    const typedW = cur.f.weaponName.trim();
    const showCard = Boolean(typedW) && (known || cur.atts.some((a) => a.trim()));
    const emptyLine = typedW && !showCard ? `“${typedW}” isn’t in the Armory yet. Pick it from the list, or add an attachment to start a new weapon.` : 'Pick a weapon and its card builds itself here.';
    // v13 — a screenshot on the clipboard pastes into the build being edited from anywhere in the drawer: the job is "a screenshot just taken"
    const onPasteImg = (e) => {
        const it = [...((e.clipboardData && e.clipboardData.items) || [])].find((x) => x.kind === 'file' && /^image\//.test(x.type));
        const file = it && it.getAsFile(); if (!file) return;
        e.preventDefault();
        const kb = file.size / 1024;
        patchAt(ci)((c) => ({ ...c, f: { ...c.f, imageMethod: 'up', fileName: file.name && file.name !== 'image.png' ? file.name : 'Screenshot.png', fileSize: kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`, filePreview: URL.createObjectURL(file) } }));
    };
    const remove = (i) => { setCards((cs) => cs.filter((_, k) => k !== i)); setActive((a) => Math.max(0, a >= i ? a - 1 : a)); };
    const add = () => { setCards((cs) => [...cs, newCard(defaultMode || cur.f.mode)]); setActive(cards.length); };
    // Each card's image key, in order, so a later card never proposes a key an earlier one already holds (his item 13, across the drawer)
    const keysBefore = []; const reservedFor = cards.map((c) => { const mine = [...keysBefore]; const k = c.f.imageKey || (c.f.weaponName && c.f.imageMethod !== 'link' ? deriveNextImageKey(builds, c.f.weaponName, c.f.mode, [...UNUSED, ...keysBefore]) : ''); if (k) keysBefore.push(k); return mine; });
    // v19 (his items 24, 25): what blocks Stage is stated in the always-empty space under the preview, one line per build, each a jump to the field
    // that blocks it — never a pop-up the drawer's edge can cut. The Stage button points here (aria-describedby) and a click on it jumps too.
    const needsOf = (c) => [!c.f.weaponName.trim() && 'a weapon', !c.atts.some((a) => a.trim()) && 'an attachment'].filter(Boolean);
    const jumpTo = (i) => {
        setActive(i);
        setTimeout(() => {
            const root = document.querySelectorAll('.f-add .f-card')[i]; if (!root) return;
            const need = needsOf(cards[i]);
            const inp = root.querySelector(need[0] === 'an attachment' ? '[data-s=atts] input' : '[data-s=build] input');
            if (!inp) return;
            const sc = inp.closest('.b3-fady, .dw-b');
            if (sc) sc.scrollTop = sc.scrollTop + inp.getBoundingClientRect().top - sc.getBoundingClientRect().top - sc.clientHeight / 3;
            inp.focus({ preventScroll: true });
            const fld = inp.closest('.f-fld'); if (fld && need.length) { fld.classList.remove('b4-pulse'); void fld.offsetWidth; fld.classList.add('b4-pulse'); }
        }, 0);
    };
    const blockedN = cards.filter((c) => needsOf(c).length).length;
    const [smin, setSmin] = useStageMin();
    // v17 (his item 12): a card wears its weapon category's hue once it is started; a blank card is neutral, since its AR is a default, not a choice
    const hueOfCard = (c) => (c.f.weaponName || c.f.shareCode || c.f.buildName || c.atts.some((a) => a.trim()) ? (builds.find((b) => b.category === c.f.category) || {}).accent || 'var(--ink3)' : 'var(--ink3)');
    return html`
        <div class=${'f-add' + (multi ? ' multi' : '')} onPaste=${onPasteImg}>
            <div class="f-form b3-fady">
                ${cards.map((c, i) => html`
                    <section class=${'f-card' + (multi && i === ci ? ' on' : '')} key=${c.id} data-arm=${c.f.mode} style=${`--f-ch:${hueOfCard(c)}`} onFocusIn=${() => setActive(i)} onPointerDown=${() => setActive(i)} aria-label=${`Build ${i + 1} of ${cards.length}`}>
                        ${multi ? html`<div class="f-card-h">
                            <b>${c.f.weaponName || 'New build'}</b><em>Build ${numberOf(i)}${c.f.buildName ? ` · ${c.f.buildName}` : ''}</em>
                            <span class="b3-xt-pm" data-arm=${c.f.mode}>${c.f.mode}</span>
                            <span class="sp"></span>
                            <button type="button" class="f-suf f-cx" aria-label=${`Remove build ${i + 1}`} onClick=${(e) => { e.stopPropagation(); remove(i); }}><${Icon} name="x" /></button>
                        </div>` : null}
                        <${BuildCard} card=${c} n=${numberOf(i)} builds=${builds} patch=${patchAt(i)} first=${i === 0} reserved=${reservedFor[i]} />
                    </section>`)}
                <button type="button" class="f-more" onClick=${add}><${Icon} name="plus" /><span>Add another build</span><em>${multi ? `${cards.length} in this stage` : 'Stage several at once'}</em></button>
            </div>
            <aside class="f-side"><div class="f-prev">
                <h5>In Discord${multi ? html`<em>Previewing ${ci + 1} of ${cards.length}</em>` : null}</h5>
                <div class="f-prevsc b3-fady">
                ${showCard ? html`<${Card} build=${preview.build} siblings=${[...preview.siblings, preview.build]} />`
                    : ghost ? html`<div class="b4-ghostwrap"><div class="b4-ghostcard" aria-hidden="true"><${Card} build=${ghost} siblings=${[ghost]} /></div><p class="f-pe b4-overline">${emptyLine}</p></div>`
                    : html`<p class="f-pe">${emptyLine}</p>`}
                </div>
            </div>
            <div class=${'f-stage' + (smin ? ' min' : '')} id="b4-stage-st" role="status" aria-live="polite" inert=${smin ? true : null}>
                <h5><span>${blockedN ? 'Before staging' : cards.length > 1 ? `All ${cards.length} ready to stage` : 'Ready to stage'}</span><${StageMinBtn} onMin=${() => setSmin(true)} /></h5>
                <ul>${cards.map((c, i) => { const need = needsOf(c); return html`
                    <li key=${c.id}><button type="button" class=${'f-st' + (multi && i === ci ? ' on' : '')} style=${`--f-ch:${hueOfCard(c)}`} onClick=${() => jumpTo(i)}
                            aria-label=${`${c.f.weaponName || 'New build'}, build ${numberOf(i)}: ${need.length ? `needs ${need.join(' and ')}` : 'ready'}`}>
                        ${need.length ? html`<span class="f-stm" data-tone="warn"><${Icon} name="triangle-alert" /></span>` : html`<span class="f-stm" data-tone="ok"><${Icon} name="check" /></span>`}
                        <span class="f-stn"><b>${c.f.weaponName || 'New build'}</b><em>Build ${numberOf(i)}</em><span class="b3-xt-pm" data-arm=${c.f.mode}>${c.f.mode}</span></span>
                        ${need.length ? html`<span class="f-stw">Needs ${need.join(' and ')}</span>` : null}
                    </button></li>`; })}</ul>
            </div></aside>
        </div>`;
}
