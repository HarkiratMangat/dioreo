// Board 3 version 2 — BOARD ONLY. The Armory proposals, built as working components that the copied armory.js mounts. Session 5 ports these into portal/ui; every class here is b3- prefixed so a port is a rename, never a guess. Globals from armory.logic.js (loaded as a classic script): CATEGORY_CHIP_LABEL, buildNumberOf, displayBuildLabel.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef, useLayoutEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { useB3 } from './state.js';

/* global CATEGORY_CHIP_LABEL, buildNumberOf, displayBuildLabel */

const SLOT_ORDER = ['Optic', 'Muzzle', 'Barrel', 'Stock', 'Laser', 'Underbarrel', 'Rear Grip', 'Ammunition', 'Perk'];
const slotVar = (slot) => `var(--sl-${String(slot).toLowerCase().replace(/\s+/g, '-')})`;
export const catLabel = (c) => (typeof CATEGORY_CHIP_LABEL !== 'undefined' && CATEGORY_CHIP_LABEL[c]) || c;

// ── A hint: the portal's tooltips are off until they are redesigned, so this is that redesign ────────────── Shown on hover after a short wait and at once on keyboard focus; the card names the action, the line under it says the consequence.
export function Hint({ title, sub, children, side = 'top', id }) {
    return html`
        <span class="b3-hint" data-side=${side}>
            ${children}
            <span class="b3-hint-card" role="tooltip" id=${id || null}><b>${title}</b>${sub ? html`<span>${sub}</span>` : null}</span>
        </span>`;
}

// ── Build numbers as a range: "Build 2", "Builds 1–3", "Builds 1, 3" ───────────────────────────────────────
export function buildsWord(ns) {
    const s = [...ns].sort((a, b) => a - b);
    if (s.length === 1) return `Build ${s[0]}`;
    const contiguous = s.every((n, i) => i === 0 || n === s[i - 1] + 1);
    if (contiguous && s.length > 2) return `Builds ${s[0]}–${s[s.length - 1]}`;
    return `Builds ${s.join(', ')}`;
}

// ── What is wrong with a build, drawn rather than written ────────────────────────────────────────────────────
const FAULT_ORDER = ['few-attachments', 'no-code', 'code-length-mismatch', 'near-duplicate', 'missing-image'];
export const faultsFor = (b) => FAULT_ORDER.filter((f) => (b.coverage || []).includes(f));

// The build a near-duplicate is nearly the same as: a sibling of the same weapon and mode whose attachments differ by at most one.
export function twinOf(b, builds) {
    const mine = new Set(b.attachments || []);
    let best = null;
    for (const o of builds) {
        if (String(o._id) === String(b._id) || o.weaponKey !== b.weaponKey || o.mode !== b.mode) continue;
        const theirs = o.attachments || [];
        const diff = theirs.filter((a) => !mine.has(a)).length + [...mine].filter((a) => !theirs.includes(a)).length;
        if (diff <= 2 && (!best || diff < best.diff)) best = { o, diff };
    }
    return best ? best.o : null;
}

export function faultLine(f, b, builds) {
    const n = (b.attachments || []).length;
    if (f === 'few-attachments') return { icon: 'layers', text: `${5 - n} of 5 attachments missing`, short: `${5 - n} missing`, visual: html`<span class="b3-pips" aria-label=${`${n} of 5 attachments`}>${[0, 1, 2, 3, 4].map((i) => html`<i class=${i < n ? 'on' : ''} key=${i}></i>`)}</span>` };
    if (f === 'no-code') return { icon: 'code', text: 'No gunsmith code', short: 'No code', visual: html`<span class="b3-nocode" aria-hidden="true">— — — — —</span>` };
    if (f === 'code-length-mismatch') {
        const c = Math.floor(String(b.shareCode || '').length / 2);
        return { icon: 'code', text: 'Code and attachments disagree', short: 'Code ≠ build', visual: html`<span class="b3-vs"><em>code</em><b>${c}</b><i>≠</i><em>build</em><b>${n}</b></span>` };
    }
    if (f === 'near-duplicate') {
        const t = twinOf(b, builds);
        const tn = t ? buildNumberOf(builds, t).n : null;
        return { icon: 'copy', text: tn ? `Nearly the same as Build ${tn}` : 'Nearly the same as another build', short: tn ? `Same as Build ${tn}` : 'Near-duplicate', visual: null };
    }
    if (f === 'missing-image') return { icon: 'image-off', text: 'No image uploaded', short: 'No image', visual: null };
    return { icon: 'triangle-alert', text: f, short: f, visual: null };
}

// ── P3 · the problem chip and its card ──────────────────────────────────────────────────────────────────────
export function ProblemChip({ weapon, faulty, builds, onOpen }) {
    const [open, setOpen] = useState(false);
    const [up, setUp] = useState(false);
    const [tx, setTx] = useState(60);
    const wrap = useRef(null);
    const total = faulty.reduce((a, x) => a + faultsFor(x.b).length, 0);

    useLayoutEffect(() => {
        if (!open || !wrap.current) return undefined;
        const place = () => {
            const chip = wrap.current && wrap.current.querySelector('.b3-fchip');
            const card = wrap.current && wrap.current.querySelector('.b3-pc');
            if (!chip || !card) return;
            const r = chip.getBoundingClientRect();
            const h = card.offsetHeight;
            setUp(r.bottom + h + 28 > window.innerHeight && r.top - h - 28 > 64);
            setTx(Math.round(r.width / 2));
        };
        place();
        const main = document.querySelector('main');
        const onDoc = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); const c = wrap.current && wrap.current.querySelector('.b3-fchip'); if (c) c.focus(); } };
        if (main) main.addEventListener('scroll', place, { passive: true });
        window.addEventListener('resize', place);
        document.addEventListener('pointerdown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            if (main) main.removeEventListener('scroll', place);
            window.removeEventListener('resize', place);
            document.removeEventListener('pointerdown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return html`
        <span class="wg-fwrap b3-fx" ref=${wrap} onClick=${(e) => e.stopPropagation()}>
            <button type="button" class="b3-fchip" aria-expanded=${open ? 'true' : 'false'} aria-haspopup="dialog"
                    onClick=${() => setOpen(!open)}>
                <${Icon} name="triangle-alert" /><b>${faulty.length > 2 ? `${faulty.length} builds` : buildsWord(faulty.map((x) => x.n))}</b><i aria-hidden="true"></i>${total} problem${total === 1 ? '' : 's'}
            </button>
            ${open ? html`
                <div class="b3-pc" data-up=${up ? 'true' : 'false'} role="dialog" aria-label=${`Problems with ${weapon}`} style=${`--tx:${tx}px`}>
                    <span class="b3-pc-tape" aria-hidden="true"></span>
                    ${faulty.map(({ b, n }) => html`
                        <section class="b3-pc-b" key=${b.id || b._id}>
                            <header class="b3-pc-h">
                                <span class="b3-pc-w"><small>${weapon}</small><b>Build ${n}</b></span>
                                <button type="button" class="b3-pc-open" onClick=${() => { setOpen(false); onOpen(b); }}>Open build<${Icon} name="arrow-up-right" /></button>
                            </header>
                            <ul class="b3-pc-l">
                                ${faultsFor(b).map((f) => { const l = faultLine(f, b, builds); return html`
                                    <li key=${f}><i class="b3-pc-ic"><${Icon} name=${l.icon} /></i><span class="b3-pc-t">${l.text}</span>${l.visual || html`<span></span>`}</li>`; })}
                            </ul>
                        </section>`)}
                </div>` : null}
        </span>`;
}

// ── P1 · badges with a hierarchy: Meta · Tier · Tag ──────────────────────────────────────────────────────────
const TIER_OF_DMZ = (r) => (!r ? null : r.startsWith('best') ? 'best' : r.startsWith('top3') ? 'top3' : 'top5');
export function B3Badges({ b }) {
    const tier = b.mode === 'DMZ' ? TIER_OF_DMZ(b.dmzRangeRank) : b.categoryRank;
    const rank = tier === 'best' ? 4 : tier === 'top3' ? 3 : tier === 'top4' ? 2 : tier === 'top5' ? 1 : 0;
    const groups = [];
    if (b.isMeta) groups.push(html`<span class="b3-bdg" data-k="meta" key="m"><${Icon} name="zap" />META</span>`);
    if (tier) {
        groups.push(html`
            <span class="b3-bdg" data-k="tier" data-t=${tier} key="t" aria-label=${tier === 'best' ? `Best in ${catLabel(b.category)}` : `Top ${tier.slice(3)} in ${catLabel(b.category)}`}>
                <span class="lad" aria-hidden="true">${[4, 3, 2, 1].map((i) => html`<i class=${rank >= 5 - i ? 'on' : ''} key=${i}></i>`)}</span>
                ${tier === 'best' ? html`<${Icon} name="crown" />BEST<em>${b.mode === 'DMZ' ? String(b.dmzRangeRank).replace(/^best-?/, '').replace('midlong', 'MID–LONG').toUpperCase() : catLabel(b.category).toUpperCase()}</em>`
                    : html`<span class="rk" aria-hidden="true">${tier.slice(3)}</span>TOP ${tier.slice(3)}`}
            </span>`);
    }
    if (b.isToxic) groups.push(html`<span class="b3-bdg" data-k="toxic" key="x"><${Icon} name="skull" />TOXIC</span>`);
    if (!groups.length) return null;
    return html`<span class="b3-bdgs">${groups.map((g, i) => html`${i ? html`<i class="sep" aria-hidden="true"></i>` : null}${g}`)}</span>`;
}

// ── P4 · select all, in the column head ─────────────────────────────────────────────────────────────────────
export function SelectAllBox({ ids, selected, setMany }) {
    const n = ids.filter((id) => selected.has(id)).length;
    const all = ids.length > 0 && n === ids.length;
    const some = n > 0 && !all;
    const act = () => setMany(ids, !all);
    return html`
        <${Hint} side="top-start" title=${all ? `All ${ids.length} selected` : some ? `${n} of ${ids.length} selected` : `Select all ${ids.length}`}
                 sub=${all || some ? 'Click to clear the selection' : 'Every build this filter shows'}>
            <span class="wg-cb b3-allcb" role="checkbox" tabIndex="0" aria-checked=${all ? 'true' : some ? 'mixed' : 'false'}
                  aria-label=${all ? 'Clear the selection' : `Select all ${ids.length} builds`}
                  onClick=${act} onKeyDown=${(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); act(); } }}>
                <span class=${'cb' + (all ? ' on' : '')}></span></span>
        <//>`;
}

// ── P5 · the selection bar: chips when collapsed, the list when opened, one object ──────────────────────────
export function SelectionDock({ ids, rows, builds, onClear, onDeselect, onEdit, onExport, onDelete }) {
    const [open, setOpen] = useState(false);
    const bg = useB3('p5bg');
    const chosen = rows.filter((r) => ids.includes(r.id));
    const byWeapon = new Map();
    for (const r of chosen) {
        if (!byWeapon.has(r.weaponName)) byWeapon.set(r.weaponName, []);
        byWeapon.get(r.weaponName).push({ b: r, n: buildNumberOf(builds, r).n });
    }
    const groups = [...byWeapon.entries()].map(([name, list]) => ({ name, list: list.sort((x, y) => x.n - y.n), accent: list[0].b.accent || 'var(--ink3)', category: list[0].b.category }))
        .sort((x, y) => x.name.localeCompare(y.name, undefined, { numeric: true, sensitivity: 'base' }));
    const MAX = groups.length > 3 ? 2 : 3;
    const shown = groups.slice(0, MAX);
    const rest = groups.length - shown.length;
    const count = chosen.length;
    const m1 = groups[0] ? groups[0].accent : 'var(--patch)';
    const m2 = groups[1] ? groups[1].accent : 'var(--r-armory)';
    useEffect(() => {
        document.body.classList.add('has-selbar');
        return () => document.body.classList.remove('has-selbar');
    }, []);

    return html`
        <div class="selbar on b3-selbar" role="region" aria-label="Actions for the selected builds">
            <div class=${'b3-sd' + (open ? ' open' : '') + (bg === 'mesh' ? ' mesh' : '')} style=${`--m1:${m1};--m2:${m2}`}>
                ${open ? html`
                    <div class="b3-sd-list">
                        <div class="b3-sd-lh"><${Icon} name="list-checks" /><b>${count} build${count === 1 ? '' : 's'}</b><span>across ${groups.length} weapon${groups.length === 1 ? '' : 's'}</span></div>
                        <div class="b3-sd-rows" role="list">
                            ${groups.map((g) => html`
                                <div class="b3-sd-g" key=${g.name} style=${`--c:${g.accent}`}>
                                    <div class="b3-sd-gh">
                                        <i aria-hidden="true"></i><b>${g.name}</b><small>${catLabel(g.category)}</small>
                                        <${B3Badges} b=${g.list[0].b} />
                                        <span class="sp"></span>
                                        <span class="b3-sd-gn">${buildsWord(g.list.map((x) => x.n))}</span>
                                        <button type="button" class="b3-x" aria-label=${`Deselect every ${g.name} build`} onClick=${() => onDeselect(g.list.map((x) => x.b.id))}><${Icon} name="x" /></button>
                                    </div>
                                    ${g.list.map(({ b, n }) => {
                                        const label = displayBuildLabel(b);
                                        const faults = faultsFor(b);
                                        return html`
                                        <div class="b3-sd-r" role="listitem" key=${b.id}>
                                            <span class="b3-sd-n">${n}</span>
                                            <span class="b3-sd-name">${label ? html`<b>${label}</b><small>Build ${n}</small>` : html`<b>Build ${n}</b><small>${b.mode}</small>`}</span>
                                            <span class="b3-sd-atts">${(b.attachments || []).map((a, i) => { const s = (b.attachmentSlots || [])[i]; return html`<span class="wg-at" key=${i} title=${s || null} style=${SLOT_ORDER.includes(s) ? `--sl:${slotVar(s)}` : null}>${a}</span>`; })}</span>
                                            <span class="b3-sd-code">${b.mode === 'DMZ' ? html`<span class="dim">DMZ</span>` : b.shareCode ? b.shareCode : html`<span class="none"><${Icon} name="triangle-alert" />No code</span>`}</span>
                                            <span class="b3-sd-flags">
                                                ${b.state === 'staged' ? html`<span class="b3-staged">staged</span>` : null}
                                                ${faults.length ? html`<span class="b3-fmini" title=${faults.map((f) => faultLine(f, b, builds).text).join(' · ')}><${Icon} name="triangle-alert" />${faults.length}</span>` : null}
                                                <span class=${'b3-img' + (b.imageKey ? '' : ' no')} title=${b.imageKey ? 'Image uploaded' : 'No image'}><${Icon} name=${b.imageKey ? 'image' : 'image-off'} /></span>
                                            </span>
                                            <button type="button" class="b3-x" aria-label=${`Deselect ${b.weaponName} build ${n}`} onClick=${() => onDeselect([b.id])}><${Icon} name="x" /></button>
                                        </div>`; })}
                                </div>`)}
                        </div>
                    </div>` : null}
                <div class="b3-sd-bar">
                    <span class="b3-sd-count" aria-label=${`${count} selected`}>${count}</span>
                    <div class="b3-sd-chips">
                        ${(open ? [] : shown).map((g) => html`
                            <span class="b3-sc" key=${g.name} style=${`--c:${g.accent}`}>
                                <i aria-hidden="true"></i>${g.name}<em>${buildsWord(g.list.map((x) => x.n))}</em>
                                <button type="button" aria-label=${`Deselect ${g.name}`} onClick=${() => onDeselect(g.list.map((x) => x.b.id))}><${Icon} name="x" /></button>
                            </span>`)}
                        ${!open && rest > 0 ? html`<button type="button" class="b3-sc more" onClick=${() => setOpen(true)}>+${rest} weapon${rest === 1 ? '' : 's'}</button>` : null}
                        ${open ? html`<span class="b3-sd-sum">${groups.map((g) => g.name).join(' · ')}</span>` : null}
                    </div>
                    <button type="button" class="b3-btn2 ghost b3-sd-tog" aria-expanded=${open ? 'true' : 'false'} onClick=${() => setOpen(!open)}>
                        <${Icon} name=${open ? 'chevron-down' : 'chevron-up'} />${open ? 'Hide list' : 'List'}</button>
                    <i class="b3-vr" aria-hidden="true"></i>
                    <div class="b3-sd-acts">
                        <button type="button" class="b3-btn2" onClick=${() => onEdit(ids)}><${Icon} name="square-pen" />${count === 1 ? 'Edit build' : 'Edit builds'}</button>
                        <button type="button" class="b3-btn2" onClick=${() => onExport(ids)}><${Icon} name="download" />Export</button>
                        <${Hint} title="Stages the deletion" sub="Nothing is removed until you commit on Review. Discard it there and every build comes back." id="b3-del-hint">
                            <button type="button" class="b3-btn2 dang" aria-describedby="b3-del-hint" onClick=${() => onDelete(ids)}><${Icon} name="trash-2" />Stage deletion</button>
                        <//>
                        <button type="button" class="b3-btn2 quiet" onClick=${onClear}><${Icon} name="x" />Clear</button>
                    </div>
                </div>
            </div>
        </div>`;
}
