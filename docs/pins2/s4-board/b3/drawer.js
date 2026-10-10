// Board 3 version 2 — BOARD ONLY. Board 1's G9 New build drawer, built: one bar for the armory and for one build or many, the single form with the code filling attachments, and bulk create with numbered blocks, a tally and one result per block. The same drawer edits several builds at once when Edit builds is pressed with more than one selected. Globals from armory.logic.js: codeFill, slotCatalogue, buildArmoryAddOp, deriveNextImageKey, DISPLAY_SLOT_ORDER, SLOT_LABEL_TEXT, buildNumberOf.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef, useLayoutEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { Drawer } from '../ui/overlay.js';
import { stageOps } from '../ui/composeClient.js';
import { B4AddForm, newCard, stageLabel, cardBlocked, blockedReason, UNUSED, StageMini } from '../b4/form.js';
import { B4BulkForm } from '../b4/bulk.js';
import { readDisplay, writeCompact, toDisplay } from '../b4/bulkformat.js';

/* global codeFill, slotCatalogue, buildArmoryAddOp, deriveNextImageKey, DISPLAY_SLOT_ORDER, SLOT_LABEL_TEXT, buildNumberOf */

const CATS = [['AR', 'Assault Rifle'], ['SMG', 'Submachine Gun'], ['LMG', 'Light Machine Gun'], ['MARKSMAN', 'Marksman'], ['SNIPER', 'Sniper'], ['SHOTGUN', 'Shotgun'], ['SECONDARIES', 'Secondary'], ['MELEE', 'Melee']];
const CAT_SHORT = { AR: 'AR', SMG: 'SMG', LMG: 'LMG', MARKSMAN: 'Marksman', SNIPER: 'Sniper', SHOTGUN: 'Shotgun', SECONDARIES: 'Secondaries', MELEE: 'Melee' };
const MP_TIERS = [['none', 'None'], ['best', 'Best'], ['top3', 'Top 3'], ['top5', 'Top 5'], ['capable', 'Capable']];
const DMZ_TIERS = [['none', 'None'], ['best-close', 'Best close'], ['best-midlong', 'Best mid–long'], ['top3-close', 'Top 3'], ['top5-close', 'Top 5']];
const keyOf = (name) => String(name || '').toLowerCase().replace(/\s+/g, '');

function Seg({ value, options, onChange, cls = '', label, attrs = {} }) {
    const ref = useRef(null);
    const [t, setT] = useState({ w: 0, x: 0 });
    const place = () => { const on = ref.current && ref.current.querySelector('button[aria-pressed="true"]'); if (on) setT({ w: on.offsetWidth, x: on.offsetLeft }); };
    useLayoutEffect(place, [value, options.map((o) => o[1]).join('|')]);
    useEffect(() => { if (document.fonts && document.fonts.ready) document.fonts.ready.then(place); }, []);
    return html`
        <div class=${'seg pb-seg ' + cls} role="group" aria-label=${label} ref=${ref} ...${attrs}>
            <span class="pb-thumb" style=${`width:${t.w}px;transform:translateX(${t.x}px)`}></span>
            ${options.map(([v, lab, icon]) => html`<button type="button" key=${v} aria-pressed=${v === value ? 'true' : 'false'} onClick=${() => onChange(v)}>${icon ? html`<${Icon} name=${icon} />` : null}${lab}</button>`)}
        </div>`;
}

function Marked({ text, q }) {
    const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
    if (i < 0) return html`<span>${text}</span>`;
    return html`<span>${text.slice(0, i)}<mark>${text.slice(i, i + q.length)}</mark>${text.slice(i + q.length)}</span>`;
}

// ── One build ───────────────────────────────────────────────────────────────────────────────────────────────
function AddForm({ builds, f, setF, atts, setAtts, fromCode, Card }) {
    const dmz = f.mode === 'DMZ';
    const set = (p) => setF((prev) => ({ ...prev, ...p }));
    const wk = keyOf(f.weaponName);
    const siblings = builds.filter((b) => b.mode === f.mode && b.weaponKey === wk);
    const ghostB = builds.find((b) => b.mode === f.mode && b.category === f.category && (b.attachments || []).length >= 4) || null;  // Board 4: the empty preview's faded sample
    const n = siblings.length + 1;
    const weapons = [...new Map(builds.filter((b) => b.mode === f.mode).map((b) => [b.weaponName, b])).values()].sort((a, b) => a.weaponName.localeCompare(b.weaponName));
    const [wOpen, setWOpen] = useState(false);
    const [focusRow, setFocusRow] = useState(-1);
    const catalogue = slotCatalogue(builds, f.mode);
    const filledFromCode = fromCode.filter((e) => e.name).length;
    const tierOptions = dmz ? DMZ_TIERS : MP_TIERS;
    const slotOf = (i) => (dmz ? SLOT_LABEL_TEXT[DISPLAY_SLOT_ORDER[i]] : (fromCode[i] && fromCode[i].label) || '');
    const wMatches = weapons.filter((b) => !f.weaponName || b.weaponName.toLowerCase().includes(f.weaponName.toLowerCase())).slice(0, 7);
    const imgKeyFound = f.imageKey && builds.some((b) => b.imageKey === f.imageKey);
    const previewBuild = { ...f, _id: 'draft', weaponName: f.weaponName || '', attachments: atts.map((a) => a.trim()).filter(Boolean), attachmentSlots: atts.map((a, i) => (a.trim() ? slotOf(i) || catalogue[a.trim()] || '' : null)).filter((x) => x !== null),
        buildName: f.buildName || `Build ${n}`, categoryRank: dmz || f.rank === 'none' ? null : f.rank, dmzRangeRank: dmz && f.rank !== 'none' ? f.rank : null, accent: (siblings[0] && siblings[0].accent) || null };

    return html`
        <div class="bed bform">
            <div class="bed-main">
                <section class="bf-sec">
                    <h4 class="bf-h">Build</h4>
                    <div class="bed-g2">
                        <div class="dwfield"><label for="nb-w">Weapon${typeof window !== 'undefined' && window.B4_COLLECTIVE && !f.weaponName.trim() ? html`<em class="pb-need">Needed to stage</em>` : null}</label>
                            <div class="pb-combo">
                                <input id="nb-w" value=${f.weaponName} role="combobox" aria-expanded=${wOpen ? 'true' : 'false'} aria-controls="nb-wmenu" autocomplete="off" placeholder="Search weapons"
                                       onFocus=${() => setWOpen(true)} onBlur=${() => setTimeout(() => setWOpen(false), 120)}
                                       onInput=${(e) => { set({ weaponName: e.target.value }); setWOpen(true); }} />
                                <${Icon} name="chevron-down" />
                                ${wOpen && wMatches.length ? html`
                                    <ul class="pb-menu" id="nb-wmenu" role="listbox">
                                        ${wMatches.map((b) => html`<li role="option" key=${b.weaponName} aria-selected=${b.weaponName === f.weaponName ? 'true' : 'false'}
                                            onMouseDown=${(e) => { e.preventDefault(); set({ weaponName: b.weaponName, category: b.category }); setWOpen(false); }}>
                                            ${b.weaponName === f.weaponName ? html`<${Icon} name="check" />` : html`<span></span>`}<${Marked} text=${b.weaponName} q=${f.weaponName} /><span class="pb-ms">${CAT_SHORT[b.category] || b.category}</span><span class="pb-mn">${builds.filter((x) => x.mode === f.mode && x.weaponKey === b.weaponKey).length} builds</span></li>`)}
                                    </ul>` : null}
                            </div></div>
                        <div class="dwfield"><label for="nb-cat">Category</label>
                            <select id="nb-cat" value=${f.category} onChange=${(e) => set({ category: e.target.value })}>
                                ${CATS.map(([c, l]) => html`<option value=${c} key=${c}>${c} — ${l}</option>`)}
                            </select></div>
                    </div>
                    <div class="dwfield" style="margin-top:16px"><label for="nb-label">Label</label>
                        <div class="pb-labelf"><span class="pb-bno"><small>BUILD</small><b class="pb-num">${n}</b></span>
                            <input id="nb-label" value=${f.buildName} placeholder="Optional — a name like Close range" maxLength="32" onInput=${(e) => set({ buildName: e.target.value })} /></div></div>
                </section>
                ${dmz ? null : html`
                    <section class="bf-sec">
                        <div class="dwfield"><label for="nb-code">Gunsmith code</label>
                            <div class="pb-codefield">
                                <input id="nb-code" value=${f.shareCode} spellcheck="false" autocomplete="off" placeholder="1C2C4A8A9B" onInput=${(e) => set({ shareCode: e.target.value.toUpperCase() })} />
                                ${f.shareCode && filledFromCode ? html`<span class="pb-ok-ic"><${Icon} name="check" /></span>` : null}
                                <button type="button" class="pb-copy" aria-label="Copy code" disabled=${!f.shareCode} onClick=${() => navigator.clipboard && navigator.clipboard.writeText(f.shareCode)}><${Icon} name="copy" /></button>
                            </div></div>
                    </section>`}
                <section class="bf-sec">
                    <h4 class="bf-h">Attachments ${typeof window !== 'undefined' && window.B4_COLLECTIVE && !atts.some((a) => a.trim()) ? html`<em class="pb-need">Needed to stage</em>` : null}${dmz ? html`<span class="bf-n">${atts.filter((a) => a.trim()).length} of 9</span>`
                        : filledFromCode ? html`<span class="pb-hfill"><${Icon} name="sparkles" />${filledFromCode} of ${atts.length} filled from the code</span>` : html`<span class="pb-hfill">Paste a code and the slots fill themselves</span>`}</h4>
                    <div class="pb-atts">
                        ${atts.map((a, i) => {
                            const slot = slotOf(i);
                            const auto = !dmz && fromCode[i] && fromCode[i].name && fromCode[i].name === a;
                            const open = focusRow === i && a.trim().length > 0;
                            const pool = Object.keys(catalogue).filter((name) => (!slot || String(catalogue[name]).toLowerCase() === slot.toLowerCase()) && name.toLowerCase().includes(a.trim().toLowerCase())).slice(0, 6);
                            return html`
                            <div class=${'pb-att' + (auto ? ' pb-auto' : '')} key=${i}>
                                <span class=${'pb-slot' + (slot ? '' : ' pb-slot-q')}>${slot || `Slot ${i + 1}`}</span>
                                <div class=${open && pool.length ? 'pb-ac' : ''} style="position:relative">
                                    <input class="ati" value=${a} aria-label=${slot ? `${slot} attachment` : `Attachment ${i + 1}`} autocomplete="off" placeholder=${slot ? `Search ${slot.toLowerCase()}` : 'Type to search'}
                                           onFocus=${() => setFocusRow(i)} onBlur=${() => setTimeout(() => setFocusRow((r) => (r === i ? -1 : r)), 120)}
                                           onInput=${(e) => setAtts(atts.map((v, k) => (k === i ? e.target.value : v)))} />
                                    ${open && pool.length ? html`
                                        <ul class="pb-menu" role="listbox">${pool.map((name) => html`
                                            <li role="option" key=${name} aria-selected=${name === a ? 'true' : 'false'} onMouseDown=${(e) => { e.preventDefault(); setAtts(atts.map((v, k) => (k === i ? name : v))); setFocusRow(-1); }}>
                                                ${name === a ? html`<${Icon} name="check" />` : html`<span></span>`}<${Marked} text=${name} q=${a.trim()} /></li>`)}</ul>` : null}
                                </div>
                                ${a ? html`<button type="button" class="pb-rmv" aria-label=${`Remove ${a}`} onClick=${() => setAtts(atts.map((v, k) => (k === i ? '' : v)))}><${Icon} name="x" /></button>` : html`<span></span>`}
                            </div>`; })}
                    </div>
                </section>
                <section class="bf-sec">
                    <h4 class="bf-h">Badges ${f.weaponName ? html`<span class="bf-n">all ${n} ${f.weaponName} ${dmz ? 'DMZ ' : ''}builds</span>` : null}</h4>
                    <div class="pb-badges">
                        <button type="button" class="pb-tog" aria-pressed=${f.isMeta ? 'true' : 'false'} onClick=${() => set({ isMeta: !f.isMeta })}><i><${Icon} name="check" /></i>META</button>
                        <button type="button" class="pb-tog pb-tox" aria-pressed=${f.isToxic ? 'true' : 'false'} onClick=${() => set({ isToxic: !f.isToxic })}><i><${Icon} name="check" /></i>TOXIC</button>
                    </div>
                    <div class="pb-rank"><span>${dmz ? 'Range tier' : `Tier in ${CAT_SHORT[f.category] || f.category}`}</span>
                        <${Seg} value=${f.rank} options=${tierOptions} onChange=${(v) => set({ rank: v })} label="Tier" attrs=${{ 'data-tier': String(f.rank).replace(/-.*/, '') }} /></div>
                </section>
                <section class="bf-sec">
                    <div class="pb-imghead"><h4 class="bf-h">Image</h4>
                        <${Seg} cls="pb-small" value=${f.imageMethod} options=${[['up', 'Upload or link'], ['key', 'Existing key']]} onChange=${(v) => set({ imageMethod: v })} label="Image source" /></div>
                    ${f.imageMethod === 'up' ? html`
                        <div class="pb-drop">
                            <div class="pb-shot" role="img" aria-label=${f.fileName ? 'Chosen screenshot' : 'No screenshot yet'}>${f.filePreview ? html`<img src=${f.filePreview} alt="" />` : html`<span class="pb-shot-ui"></span>`}</div>
                            <div class="pb-dropcol">
                                <div class="dwfield"><label>Screenshot or link</label>
                                    ${f.fileName ? html`<div class="pb-file"><${Icon} name="image" /><span>${f.fileName}</span><em>${f.fileSize}</em><label class="chip">Replace<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange=${(e) => pick(e, set)} /></label></div>`
                                        : html`<div class="pb-file"><${Icon} name="image" /><input class="pb-link" value=${f.imageLink} placeholder=${typeof window !== 'undefined' && window.B4_COLLECTIVE ? 'Paste a link' : 'Paste a link, or choose a file'} onInput=${(e) => set({ imageLink: e.target.value })} /><label class="chip">Choose<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange=${(e) => pick(e, set)} /></label></div>`}
                                </div>
                                <div class="dwfield"><label for="nb-key">Key</label><input id="nb-key" value=${f.imageKey || (f.weaponName ? deriveNextImageKey(builds, f.weaponName, f.mode) : '')} onInput=${(e) => set({ imageKey: e.target.value })} /></div>
                            </div>
                        </div>` : html`
                        <div class="pb-drop">
                            <div class="pb-shot" role="img" aria-label="Image found for this key"><span class="pb-shot-ui"></span></div>
                            <div class="pb-dropcol">
                                <div class="dwfield"><label for="nb-key2">Key</label><input id="nb-key2" value=${f.imageKey} placeholder=${f.weaponName ? `${f.weaponName.toUpperCase().replace(/\s+/g, '-')}-1` : 'BAL-27-1'} onInput=${(e) => set({ imageKey: e.target.value })} /></div>
                                ${f.imageKey ? (imgKeyFound ? html`<span class="pb-echo"><${Icon} name="check" cls="sm" />Found in gun-builds</span>` : html`<span class="pb-echo pb-warn"><${Icon} name="triangle-alert" cls="sm" />No image under this key</span>`) : null}
                            </div>
                        </div>`}
                </section>
            </div>
            <aside class="bed-side"><div class="bed-sec"><h5>In Discord</h5>
                ${f.weaponName ? html`<${Card} build=${previewBuild} siblings=${[...siblings, previewBuild]} />` : (typeof window !== 'undefined' && window.B4_COLLECTIVE && ghostB) ? html`<div class="b4-ghostcard" aria-hidden="true"><${Card} build=${ghostB} siblings=${[ghostB]} /></div><p class="empty">Pick a weapon and the card builds itself here.</p>` : html`<p class="empty">Pick a weapon and the card builds itself here.</p>`}
            </div></aside>
        </div>`;
}

function pick(e, set) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const kb = file.size / 1024;
    set({ fileName: file.name, fileSize: kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`, filePreview: URL.createObjectURL(file) });
}

// ── Many builds: the paste, read the way the parser reads it ────────────────────────────────────────────────
const TOKENS = { MP: ['meta', 'toxic', 'ass', 'best', 'top3', 'top5', 'capable', 'hp', 's&d', 'dom', 'tdm', 'ftl', 'control'], DMZ: ['meta', 'toxic', 'ass', 'best-close', 'best-midlong', 'top3-close', 'top3-midlong', 'top5-close', 'top5-midlong'] };
const badgesOf = (b) => [b.isMeta ? 'meta' : null, b.categoryRank || null, b.dmzRangeRank || null, b.isToxic ? 'toxic' : null, b.isAss ? 'ass' : null, ...(b.mode === 'DMZ' ? [] : (b.rankModes || []).map((m) => m.toLowerCase()))].filter(Boolean);
export function exportText(list) {
    return list.map((l) => {
        const lines = [`${l.weaponName} | ${l.category}`];
        if (l.buildName) lines.push(`Build: ${l.buildName}`);
        if (l.imageKey && !String(l.imageKey).startsWith('http')) lines.push(`Image: ${l.imageKey}`);
        if (l.shareCode) lines.push(`Code: ${l.shareCode}`);
        if (badgesOf(l).length) lines.push(`Badges: ${badgesOf(l).join(', ')}`);
        lines.push(...(l.attachments || []).map((a) => `- ${a}`));
        return lines.join('\n');
    }).join('\n\n');
}

function readPaste(text, builds, mode) {
    const lines = text.split('\n');
    const blocks = [];
    let cur = null;
    lines.forEach((raw, i) => {
        if (!raw.trim()) { if (cur) { blocks.push(cur); cur = null; } return; }
        if (!cur) cur = { start: i + 1, lines: [] };
        cur.lines.push({ n: i + 1, raw });
        cur.end = i + 1;
    });
    if (cur) blocks.push(cur);
    const catalogue = slotCatalogue(builds, mode);
    return blocks.map((blk, bi) => {
        const out = { ...blk, index: bi + 1, hits: new Set(), err: null, diffs: [], slots: [] };
        const parts = blk.lines[0].raw.split('|').map((x) => x.trim());
        out.weapon = parts[0];
        if (parts.length < 2 || !parts[0] || !parts[1]) { out.outcome = 'bad'; out.err = blk.lines[0].n; out.msg = html`First line needs a category: <code>${parts[0] || 'Weapon'} | AR</code>`; return out; }
        out.category = parts[1].toUpperCase();
        const fields = {}; const atts = [];
        let badKey = null;
        for (const l of blk.lines.slice(1)) {
            const t = l.raw.trim();
            if (/^[-*•]\s+/.test(t)) { atts.push({ name: t.replace(/^[-*•]\s+/, ''), n: l.n }); continue; }
            const m = /^([A-Za-z ]+):\s*(.*)$/.exec(t);
            if (!m) { atts.push({ name: t, n: l.n }); continue; }
            const k = m[1].trim().toLowerCase();
            if (!['build', 'image', 'code', 'badges'].includes(k)) { badKey = badKey || { k: m[1].trim(), n: l.n }; continue; }
            fields[k] = { v: m[2].trim(), n: l.n };
        }
        out.buildName = fields.build ? fields.build.v : null;
        if (badKey) { out.outcome = 'bad'; out.err = badKey.n; out.msg = html`<code>${badKey.k}:</code> isn’t a field — Build, Image, Code or Badges`; return out; }
        if (!atts.length) { out.outcome = 'bad'; out.err = blk.end; out.msg = 'No attachment lines under the header'; return out; }
        out.atts = atts;
        out.slots = atts.map((a) => catalogue[a.name] || null);
        const tokens = fields.badges ? fields.badges.v.split(/[,\s]+/).map((x) => x.toLowerCase()).filter(Boolean) : null;
        const unknown = tokens ? tokens.filter((x) => !TOKENS[mode].includes(x)) : [];
        const before = builds.find((b) => b.mode === mode && keyOf(b.weaponName) === keyOf(parts[0]) && (b.buildName || '') === (out.buildName || ''));
        out.before = before;
        if (before) {
            out.n = buildNumberOf(builds, before).n;
            if (before.category !== out.category) { out.diffs.push({ k: 'Category', was: before.category, now: out.category }); out.hits.add(blk.lines[0].n); }
            if (fields.code && (before.shareCode || '') !== fields.code.v) { out.diffs.push({ k: 'Code', was: before.shareCode || '—', now: fields.code.v }); out.hits.add(fields.code.n); }
            if (fields.image && (before.imageKey || '') !== fields.image.v) { out.diffs.push({ k: 'Image', was: before.imageKey || '—', now: fields.image.v }); out.hits.add(fields.image.n); }
            if (tokens) {
                const was = badgesOf(before).sort().join(', '); const now = tokens.filter((x) => TOKENS[mode].includes(x)).sort().join(', ');
                if (was !== now) { out.diffs.push({ k: 'Badges', was: was || '—', now: now || '—' }); out.hits.add(fields.badges.n); }
            }
            const beforeAtts = before.attachments || []; const beforeSlots = before.attachmentSlots || [];
            atts.forEach((a) => {
                if (beforeAtts.includes(a.name)) return;
                const slot = catalogue[a.name];
                const j = slot ? beforeSlots.map((x) => String(x).toLowerCase()).indexOf(slot.toLowerCase()) : -1;
                out.diffs.push({ k: slot || 'Adds', was: j >= 0 ? beforeAtts[j] : null, now: a.name });
                out.hits.add(a.n);
            });
            beforeAtts.forEach((name, j) => {
                if (atts.some((a) => a.name === name)) return;
                const slot = beforeSlots[j];
                if (slot && atts.some((a) => String(catalogue[a.name] || '').toLowerCase() === String(slot).toLowerCase())) return;
                out.diffs.push({ k: 'Drops', was: name, now: null });
            });
        }
        if (unknown.length) {
            out.outcome = 'warn';
            const kept = tokens.filter((x) => TOKENS[mode].includes(x));
            out.msg = html`<code>${unknown[0]}</code> isn’t a badge — saved with ${kept.length ? kept.map((x) => x.toUpperCase()).join(', ') : 'no badges'}`;
            if (fields.badges) out.hits.add(fields.badges.n);
        } else out.outcome = before ? (out.diffs.length ? 'upd' : 'same') : 'new';
        return out;
    });
}

const OUTCOME = { new: ['New', 'new'], upd: ['Update', 'updated'], warn: ['Warning', 'saved with a warning'], bad: ['Can’t read', 'can’t be read'], same: ['Unchanged', 'unchanged'] };

function BulkForm({ text, setText, blocks, editing, builds = [] }) {
    const B4G = typeof window !== 'undefined' && window.B4_COLLECTIVE;  // Board 4 · v9 bulk list pass (2026-09-21 23:50 EDT)
    const accentFor = (w) => ((builds.find((b) => keyOf(b.weaponName) === keyOf(w)) || {}).accent) || 'var(--ink3)';
    const lines = text.split('\n');
    const byLine = new Map();
    blocks.forEach((b) => { for (let n = b.start; n <= b.end; n++) byLine.set(n, b); });
    const ta = useRef(null);
    const tally = ['new', 'upd', 'warn', 'bad'].concat(editing ? ['same'] : []).map((k) => [k, blocks.filter((b) => b.outcome === k).length]).filter(([k, v]) => v || k !== 'same');
    const segs = [];
    let i = 0;
    while (i < lines.length) {
        const b = byLine.get(i + 1);
        if (!b) { segs.push({ blank: true, n: i + 1 }); i++; continue; }
        segs.push({ b, from: b.start, to: b.end });
        i = b.end;
    }
    // 2026-09-21 14:38 EDT — THE LINES ARE THE EXPORT FILE'S LINES (his ask: "the styling used in `Pick builds…` export list"): the picker's
    // .b3-xt-ln rows, a numbered gutter and x-hd / x-kv / x-at, so what you paste and what Export writes read as one object. The outcome
    // rail stays on the block (board 1 · G9, ruled). ⚠️ The overlay must never change a glyph's WIDTH — no weight, no letter-spacing —
    // or the caret in the textarea above it lands on a different character than the one drawn (his screen recording, 13:56 EDT).
    // v9 — an attachment the armory has never seen is marked where it is typed (dotted, warn), not only in the row list beside it.
    const unknownAt = new Set(); blocks.forEach((b) => (b.atts || []).forEach((a, i) => { if (!(b.slots || [])[i]) unknownAt.add(a.n); }));
    // v9 — THE GRAMMAR STAYS VISIBLE WHILE YOU TYPE (his C2-10: "i literally started typing and forgot what i even had to type"). The
    // placeholder vanished on the first keypress; this ghost is the rest of the CURRENT block's shape, drawn after the last line only, so it
    // never moves a line out from under the caret. It is aria-hidden overlay, never text, so nothing it shows is ever staged.
    const nextLines = (() => {
        if (!B4G) return [];
        const T = ['WEAPON | CATEGORY', 'Build: a name, like Close range', 'Code: the gunsmith code', 'Badges: meta, best  (optional)', '- an attachment, one per line'];
        if (!text.trim()) return T;
        if (!lines[lines.length - 1].trim()) return ['WEAPON | CATEGORY  — the next build'];
        const blk = blocks[blocks.length - 1]; if (!blk) return [];
        const keys = new Set(blk.lines.slice(1).map((l) => ((/^([A-Za-z ]+):/.exec(l.raw.trim()) || [])[1] || '').toLowerCase()).filter(Boolean));
        if (blk.lines.slice(1).some((l) => /^[-*•]\s+/.test(l.raw.trim()))) return ['- another attachment, or a blank line'];
        return [!keys.has('build') && T[1], !keys.has('code') && T[2], !keys.has('badges') && T[3], T[4]].filter(Boolean);
    })();
    const gOver = !lines[lines.length - 1].trim();  // the caret line is empty, so the first ghost line sits ON it
    const gStart = gOver ? lines.length : lines.length + 1;
    // The block being typed is not an error yet: "no attachments" on the LAST block while its grammar ghost is showing gets no wavy line.
    const pending = B4G && nextLines.length && !gOver ? blocks[blocks.length - 1] : null;
    const lineClass = (b, n, raw) => {
        const t = raw.trim();
        return 'b3-xt-ln' + (n === b.start ? ' x-hd' : /^[-*•]/.test(t) ? ' x-at' : ' x-kv') + (b.hits.has(n) ? ' pb-hit' : '') + (b.err === n && !(b === pending && b.msg === 'No attachment lines under the header') ? ' pb-err' : '') + (B4G && unknownAt.has(n) ? ' pb-unk' : '');
    };
    const drawLine = (raw, n, b) => {
        if (b && n === b.start) { const [w, ...rest] = raw.split('|'); return rest.length ? html`<b>${w}</b><i>|</i>${rest.join('|')}` : raw; }
        const m = /^(\s*)([A-Za-z ]+:)(.*)$/.exec(raw);
        if (B4G) { const a = /^(\s*[-*•]\s+)(.*)$/.exec(raw); if (a) return html`<i>${a[1]}</i>${a[2]}`; }
        return m && !/^\s*[-*•]/.test(raw) ? html`${m[1]}<em>${m[2]}</em>${m[3]}` : raw;
    };
    return html`
        <div class="pb-bulk">
            <div>
                <div class="pb-edhead"><label for="pb-ta">Builds</label><span>${blocks.length} build${blocks.length === 1 ? '' : 's'} · ${lines.length} lines</span></div>
                ${typeof window !== 'undefined' && window.B4_COLLECTIVE ? html`<p class="pb-grammar"><b>WEAPON | CATEGORY</b>, then <code>Build:</code> <code>Code:</code> <code>Badges:</code> and <code>- attachment</code> lines — a blank line starts the next build.</p>` : null}
                <div class="pb-edwrap">
                    <div class="pb-ed b3-xt-bin" aria-hidden="true">
                        ${segs.map((s, k) => (s.blank
                            ? html`<div class="b3-xt-ln x-blank" key=${'x' + k}><span class="b3-xt-no">${s.n}</span><span class="b3-xt-tx"> </span></div>`
                            : html`<div class="pb-blk" data-o=${s.b.outcome} key=${'b' + k} style=${`--c:${accentFor(s.b.weapon)}`}>${lines.slice(s.from - 1, s.to).map((raw, j) => html`<div class=${lineClass(s.b, s.from + j, raw)} key=${j}><span class="b3-xt-no">${s.from + j}</span><span class="b3-xt-tx">${drawLine(raw, s.from + j, s.b) || ' '}</span></div>`)}</div>`))}
                        ${nextLines.length ? html`<div class=${'pb-ghost' + (gOver ? ' x-over' : '')} aria-hidden="true">${nextLines.map((g, k) => html`<div class="b3-xt-ln x-ghost" key=${k}><span class="b3-xt-no">${gStart + k}</span><span class="b3-xt-tx">${g}</span></div>`)}</div>` : null}
                    </div>
                    <textarea id="pb-ta" class="pb-ta" ref=${ta} spellcheck="false" wrap="off" value=${text} style=${`height:${Math.max(lines.length, 16) * 24 + 24}px`}
                              placeholder=${B4G ? '' : 'BAL-27 | AR\nBuild: Close range\nCode: 1C2C4A8A9C\nBadges: meta, best\n- Gauge-9 Mono\n- Crown-H3 Barrel'}
                              aria-label="Builds, one block per build, a blank line between blocks" onInput=${(e) => setText(e.target.value)}></textarea>
                </div>
            </div>
            <div>
                <div class="pb-tally" style=${`grid-template-columns:repeat(${tally.length},1fr)`}>
                    ${tally.map(([k, v]) => html`<div data-o=${k} key=${k}><b>${v}</b><span>${OUTCOME[k][1]}</span></div>`)}
                </div>
                <ol class="pb-rows">
                    ${blocks.map((b) => html`
                        <li class="pb-row" data-o=${b.outcome} key=${b.index}>
                            <div class="pb-rt"><strong>${b.weapon || '—'}</strong>${b.before ? html`<span>Build ${b.n}</span>` : b.buildName ? html`<span>${b.buildName}</span>` : null}<span class="pb-ln">${b.start === b.end ? `line ${b.start}` : `lines ${b.start}–${b.end}`}</span></div>
                            <span class="pb-oc">${OUTCOME[b.outcome][0]}</span>
                            ${b.outcome === 'upd' || (b.outcome === 'warn' && b.diffs.length) ? html`<div class="pb-rd pb-diffs">${b.diffs.slice(0, 5).map((d, j) => html`
                                <span class="pb-df" key=${j}><span class="pb-k2">${d.k}</span>${d.was ? html`<s>${d.was}</s>` : null}${d.was && d.now ? html`<${Icon} name="arrow-right" />` : null}${d.now ? html`<b>${d.now}</b>` : null}</span>`)}${b.diffs.length > 5 ? html`<span class="pb-more">+${b.diffs.length - 5} more</span>` : null}</div>` : null}
                            ${b.outcome === 'new' ? html`<div class="pb-rd"><span class="pb-sl">${b.slots.map((s, j) => html`<span key=${j} class=${s ? '' : 'q'}>${s || b.atts[j].name}</span>`)}</span></div>` : null}
                            ${b.outcome === 'warn' || b.outcome === 'bad' ? html`<div class="pb-rd pb-msg"><span>${b.msg}</span></div>` : null}
                            ${b.outcome === 'same' ? html`<div class="pb-rd"><span>Matches the live build</span></div>` : null}
                        </li>`)}
                </ol>
            </div>
        </div>`;
}

// ── The drawer ──────────────────────────────────────────────────────────────────────────────────────────────
function withBadge(text, token) {
    if (!token) return text;
    return text.split('\n\n').map((blk) => {
        const ls = blk.split('\n');
        const i = ls.findIndex((l) => /^Badges:/i.test(l));
        if (i >= 0) { const toks = ls[i].replace(/^Badges:\s*/i, '').split(/,\s*/).filter(Boolean); if (!toks.includes(token)) toks.unshift(token); ls[i] = `Badges: ${toks.join(', ')}`; }
        else { const at = ls.findIndex((l) => /^[-*•]\s/.test(l)); ls.splice(at < 0 ? ls.length : at, 0, `Badges: ${token}`); }
        return ls.join('\n');
    }).join('\n\n');
}

export function B3BuildDrawer({ addBadge = null, builds, mode: startMode, panel: startPanel, editIds, csrfToken, overlay, Card, onClose, onStaged, prefill = '', seed = null }) {
    const editing = Array.isArray(editIds) && editIds.length > 1;
    const editList = editing ? builds.filter((b) => editIds.includes(String(b._id))) : [];
    const [mode, setMode] = useState(editing ? (editList[0] || {}).mode || startMode : startMode);
    const [panel, setPanel] = useState(editing ? 'bulk' : startPanel || 'add');
    const blank = (m) => ({ mode: m, weaponName: '', category: 'AR', buildName: '', shareCode: '', isMeta: false, isToxic: false, isAss: false, rank: 'none', rankModes: [], imageMethod: 'up', imageKey: '', imageLink: '', fileName: '', fileSize: '', filePreview: '' });
    const [f, setF] = useState(blank(mode));
    const [atts, setAtts] = useState(Array(mode === 'DMZ' ? 9 : 5).fill(''));
    // Board 4 · v11 (2026-09-22 13:55 EDT) — the editor holds the new format's display form (his item 27): Edit opens the builds as Export writes them,
    // a prefill or a pasted compact file opens into labelled lines.
    const B4W = typeof window !== 'undefined' && window.B4_COLLECTIVE;
    const startText = editing ? (B4W ? toDisplay(writeCompact(editList)) : exportText(editList)) : (B4W ? toDisplay(prefill || '') : (prefill || ''));
    const [text, setText] = useState(editing ? withBadge(startText, addBadge) : startText);
    const [busy, setBusy] = useState(false);
    const [another, setAnother] = useState(false);  // Board 4 · K2 footer D2 (ruled): 'Add another after this' is a pressable chip above the one Stage button
    const original = useRef(startText);
    // Board 4 · v11 (2026-09-22 13:37 EDT) — the add panel is a LIST of build cards (his item 17), one Stage for all of them, each card in
    // its own mode (his ruling, 12:30 and 13:01 EDT). The board's 'three cards' state seeds a mixed set so the shape can be seen.
    const B4F = typeof window !== 'undefined' && window.B4_COLLECTIVE;
    const [cards, setCards] = useState(() => (seed === 'three' ? [newCard('MP', { weaponName: 'BAL-27', category: 'AR', shareCode: '1C2C4A8A9B', buildName: 'Close range', isMeta: true, rank: 'best', rankModes: ['HP', 'S&D'] }), newCard('MP', { weaponName: 'FENNEC', category: 'SMG' }), newCard('DMZ')] : [newCard(startMode || 'MP')]));
    const [active, setActive] = useState(0);
    const armMode = B4F && panel === 'add' ? (cards[Math.min(active, cards.length - 1)] || cards[0]).f.mode : mode;

    const wk = keyOf(f.weaponName);
    const fromCode = mode === 'MP' && f.shareCode.length >= 2 && wk ? codeFill(builds, wk, 'MP', f.shareCode) : [];
    useEffect(() => {
        if (!fromCode.length) return;
        setAtts((prev) => { const next = fromCode.map((e, i) => ((prev[i] && prev[i].trim()) ? prev[i] : e.name || '')); while (next.length < 5) next.push(''); return next; });
    }, [f.shareCode, wk]);

    const blocks = panel === 'bulk' ? (B4W ? readDisplay(text, { builds, mode, editing, catalogueFor: (m) => slotCatalogue(builds, m), numberOf: (b) => buildNumberOf(builds, b).n, nextKey: (w, m) => deriveNextImageKey(builds, w, m), unused: UNUSED }) : readPaste(text, builds, mode)) : [];
    const readable = blocks.filter((b) => b.outcome !== 'bad' && b.outcome !== 'same' && b.outcome !== 'dup');
    const skipped = blocks.filter((b) => b.outcome === 'bad');
    const switchMode = (m) => {
        setMode(m);
        // Board 4: the switch changes the card being edited and is the default for the next new one; a card keeps its weapon and label.
        if (B4F && panel === 'add') { setCards((cs) => cs.map((c, k) => (k === Math.min(active, cs.length - 1) ? newCard(m, { weaponName: c.f.weaponName, category: c.f.category, buildName: c.f.buildName }, c.id) : c))); return; }
        setF((p) => ({ ...p, mode: m, rank: 'none' })); setAtts(Array(m === 'DMZ' ? 9 : 5).fill(''));
    };
    const blockers = [!f.weaponName.trim() && 'a weapon', !atts.some((a) => a.trim()) && 'at least one attachment'].filter(Boolean);

    async function stageOne(again) {
        setBusy(true);
        const op = buildArmoryAddOp({ ...f, attachments: atts.map((a) => a.trim()).filter(Boolean), categoryRank: mode === 'DMZ' || f.rank === 'none' ? null : f.rank, dmzRangeRank: mode === 'DMZ' && f.rank !== 'none' ? f.rank : null });
        const res = await stageOps('armory', [op], csrfToken);
        setBusy(false);
        if (!res || !res.changesetId) { overlay.say('The build could not be staged.'); return; }
        if (again) {
            overlay.say(`Staged ${f.weaponName} · Build ${builds.filter((b) => b.mode === mode && b.weaponKey === wk).length + 1}. Next one is ready.`);
            setF((p) => ({ ...blank(mode), weaponName: p.weaponName, category: p.category }));
            setAtts(Array(mode === 'DMZ' ? 9 : 5).fill(''));
        } else onStaged(`Staged · ${f.weaponName}. Nothing is live until you commit it.`);
    }
    async function stageMany() {
        setBusy(true);
        const body = readable.map((b) => text.split('\n').slice(b.start - 1, b.end).join('\n')).join('\n\n');
        const res = await stageOps('armory', [{ type: 'loadout.bulkAdd', target: { mode }, payload: { text: body } }], csrfToken);
        setBusy(false);
        if (!res || !res.changesetId) { overlay.say('The paste could not be staged.'); return; }
        const n = readable.length;
        onStaged(editing ? `Staged · ${n} build${n === 1 ? '' : 's'} changed. Nothing is live until you commit it.` : `Staged · ${n} build${n === 1 ? '' : 's'}. Nothing is live until you commit it.`);
    }
    async function stageCards() {
        setBusy(true);
        const ops = cards.map((c) => buildArmoryAddOp({ ...c.f, attachments: c.atts.map((a) => a.trim()).filter(Boolean), categoryRank: c.f.mode === 'DMZ' || c.f.rank === 'none' ? null : c.f.rank, dmzRangeRank: c.f.mode === 'DMZ' && c.f.rank !== 'none' ? c.f.rank : null }));
        const res = await stageOps('armory', ops, csrfToken);
        setBusy(false);
        if (!res || !res.changesetId) { overlay.say(cards.length > 1 ? 'The builds could not be staged.' : 'The build could not be staged.'); return; }
        onStaged(`Staged · ${cards.map((c) => c.f.weaponName).join(', ')}. Nothing is live until you commit it.`);
    }
    const [ask, setAsk] = useState(null);
    function requestClose(ev) {
        if (ask) { setAsk(null); return; }  // v16 · C: a second Escape or Close answers "keep editing"
        const dirty = panel === 'bulk' ? (editing ? text !== original.current : Boolean(text.trim())) : B4F ? cards.some((c) => c.f.weaponName || c.f.shareCode || c.atts.some((a) => a.trim())) : Boolean(f.weaponName || f.shareCode || atts.some((a) => a.trim()));
        if (!dirty) return onClose();
        // v16 (2026-09-23): the question names what would be lost — the weapons in the draft, in their colours — never an op token
        const acc = (w) => (builds.find((b) => keyOf(b.weaponName) === keyOf(w)) || {}).accent;
        const lost = panel === 'bulk' ? blocks.filter((b) => b.weapon && (!editing || b.outcome !== 'same')).map((b) => ({ name: b.weapon, accent: acc(b.weapon), build: editing && blocks.length === editList.length ? editList[blocks.indexOf(b)] : null }))  /* an Edit loses only the builds it changed */ : B4F ? cards.filter((c) => c.f.weaponName || c.f.shareCode || c.atts.some((a) => a.trim())).map((c) => ({ name: c.f.weaponName || 'New build', accent: acc(c.f.weaponName) })) : [{ name: f.weaponName || 'New build', accent: acc(f.weaponName) }];
        const n = Math.max(1, lost.length);
        // 2026-09-23 18:33 EDT · his nine points: two rows, the question then the weapons as the edit header's own chips (name, then its builds), no reason line
        const groups = [...lost.reduce((mm, l) => { const g = mm.get(l.name) || { name: l.name, accent: l.accent, list: [] }; if (l.build) g.list.push(l.build); return mm.set(l.name, g); }, new Map()).values()].map((g) => ({ ...g, em: g.list.length ? buildsWordOf(g.list) : '' }));
        const one = lost[0] && lost[0].name !== 'New build' ? lost[0].name : null;
        const q = { title: editing ? `Discard your edits to ${n === 1 && one ? one : `${n} builds`}?` : n === 1 ? `Discard ${one || 'this build'}?` : `Discard these ${n} builds?`,
            go: editing ? 'Discard edits' : n === 1 ? 'Discard build' : `Discard ${n} builds`, groups,
            sub: editing ? 'The builds stay as they are; only these edits go.' : 'Nothing has been staged, so this only clears the drawer.' };  // sub: the old board's dialog only
        if (B4F) { setAsk(q); return; }
        overlay.confirm({ op: 'loadout.add', tier: 1, danger: true, ...q, confirmLabel: q.go, body: html`<p class="dw-p">${q.sub}</p>`, onConfirm: onClose });
    }

    const editWeapons = [...new Set(editList.map((b) => b.weaponName))];
    // Board 4 · K6 (2026-09-21 22:40 EDT) — the chips follow the TEXT (a removed weapon's chip goes with its blocks) and speak the selection bar's words.
    const B4E = typeof window !== 'undefined' && window.B4_COLLECTIVE;
    const chipWeapons = [...new Set(blocks.map((b) => b.weapon).filter(Boolean))];
    const buildsWordOf = (list) => { const n = list.map((b) => buildNumberOf(builds, b).n).sort((x, y) => x - y); if (!n.length) return ''; if (n.length === 1) return `Build ${n[0]}`; const run = n.every((x, k) => !k || x === n[k - 1] + 1); return `Builds ${run ? `${n[0]}–${n[n.length - 1]}` : n.join(', ')}`; };
    // K6 — "Editing X" is the selection bar's chip, one per weapon, and its x removes that weapon's blocks from the editor (his C2-13).
    const removeWeapon = (w) => {
        const kept = text.split(/\n\s*\n/).filter((blk) => keyOf((blk.trim().split('\n')[0] || '').split('|')[0].trim()) !== keyOf(w));
        setText(kept.join('\n\n'));
    };
    // The drawer's ground is the Export picker's mesh (his ruling: drawers use it), lit by what this drawer holds — the edited builds, the
    // pasted blocks' weapons, or the one weapon being added — ranked by how many of each, exactly as the picker ranks its picks.
    const nbRef = useRef(null);
    const hueList = (editing ? editList.map((b) => b.accent) : panel === 'bulk' ? blocks.map((b) => ((builds.find((x) => keyOf(x.weaponName) === keyOf(b.weapon)) || {}).accent)) : B4E ? cards.map((c) => (builds.find((x) => x.category === c.f.category) || {}).accent) : [(builds.find((x) => x.weaponKey === wk) || {}).accent]).filter(Boolean);
    const hueKey = hueList.join(',');
    useEffect(() => {
        const d = nbRef.current && nbRef.current.closest('.drawer'); if (!d) return undefined;
        const n = new Map(); hueList.forEach((c) => n.set(c, (n.get(c) || 0) + 1));
        const r = [...n.entries()].sort((x, y) => y[1] - x[1]).map(([c]) => c);
        const hues = [r[0] || 'var(--staged)', r[1] || (B4E && r[0]) || 'var(--r-armory)', r[2] || (B4E && r[0]) || 'var(--staged)', r[3] || 'var(--r-armory)'];
        hues.forEach((c, i) => d.style.setProperty(`--m${i + 1}`, c));
        return undefined;
    }, [hueKey]);
    // Board 4 · v13 (2026-09-22 16:31 EDT) — a disabled Stage says why, and the reason is a jump to the field that blocks it; ⌘↵ stages from anywhere in
    // the drawer (a blocked Stage jumps to its reason instead). The key handler reads a ref to the current state, never a mount-time closure.
    const why = B4F && panel === 'add' ? blockedReason(cards) : null;
    function jumpToBlocker() {
        if (!why) return;
        setActive(why.i);
        setTimeout(() => {
            const d = nbRef.current; const card = d && d.querySelectorAll('.f-card')[why.i];
            const inp = card && card.querySelector(why.what === 'weapon' ? '[data-s=build] input' : '[data-s=atts] input');
            if (!inp) return;
            // Scroll the drawer's own scroller, never the page (scrollIntoView moved the whole board under the drawer). The form column is
            // the scroller since 2026-09-23. It scrolls BEFORE the focus and instantly: focusing opens the picker, whose highlighted row
            // scrolls itself into view, and that cut a smooth scroll short with the field 50px above the column's top edge.
            const sc = inp.closest('.b3-fady, .dw-b');
            if (sc) sc.scrollTop = sc.scrollTop + inp.getBoundingClientRect().top - sc.getBoundingClientRect().top - sc.clientHeight / 3;
            inp.focus({ preventScroll: true });
            const fld = inp.closest('.f-fld'); if (fld) { fld.classList.remove('b4-pulse'); void fld.offsetWidth; fld.classList.add('b4-pulse'); }
        }, 0);
    }
    const keyRef = useRef(null);
    keyRef.current = (e) => {
        if (!B4F || !(e.metaKey || e.ctrlKey) || e.key !== 'Enter' || busy) return;
        e.preventDefault();
        if (panel === 'add') { if (why) jumpToBlocker(); else stageCards(); } else if (readable.length) stageMany();
    };
    useEffect(() => {
        const d = nbRef.current && nbRef.current.closest('.drawer'); if (!d) return undefined;
        const h = (e) => keyRef.current && keyRef.current(e);
        d.addEventListener('keydown', h); return () => d.removeEventListener('keydown', h);
    }, []);
    const title = editing ? `Edit ${editList.length} ${mode} builds` : panel === 'bulk' ? `New ${mode} builds` : `New ${mode} build`;
    // v16 · the footer asks (his pick C). Polished at his "Improve it's design" (2026-09-23 16:54 EDT): one danger mark, not three — a red edge on a
    // neutral strip, the title's own icon, and the one solid button; the weapons are the board's weapon chips on the title's line, the sentence under it.
    // Keep editing takes focus AFTER the drawer's own Escape handling, which returned it to the × (measured 2026-09-23 18:11 EDT)
    const keepRef = useRef(null);
    useEffect(() => { if (!ask) return undefined; const t = setTimeout(() => keepRef.current && keepRef.current.focus({ focusVisible: false }), 40); return () => clearTimeout(t); }, [ask]);
    // 2026-09-23 18:54 EDT · his "the overflow fade needs some finetuning": the row runs UNDER Keep editing and fades out at its edge, so --kw carries the
    // button's width; it fades only when the last chip reaches the button (a fade on a row that fits promises more than there is)
    const chipsRef = (el) => { if (el) requestAnimationFrame(() => { const q = el.closest('.b4-ask'); const keep = q && q.querySelector('.b4-ask-keep'); if (!keep) return;
        q.style.setProperty('--kw', keep.offsetWidth + 'px'); const last = el.lastElementChild;
        el.dataset.over = last && last.getBoundingClientRect().right > keep.getBoundingClientRect().left - 6 ? '1' : ''; }); };
    const askBar = ask ? html`<div class="b4-ask" role="alertdialog" aria-labelledby="b4-ask-q">
        <div class="b4-ask-t"><b id="b4-ask-q">${ask.title}</b>
            <div class="b4-ask-cs" ref=${chipsRef}>${ask.groups.map((g) => html`<span class="b3-sc" key=${g.name} style=${`--c:${g.accent || 'var(--ink3)'}`}><i aria-hidden="true"></i><span class="b3-nw">${g.name}${g.em ? html`<em>${g.em}</em>` : null}</span></span>`)}</div></div>
        <button class="b3-btn2 b4-ask-keep" ref=${keepRef} onClick=${() => setAsk(null)}><${Icon} name="pencil" />Keep editing</button>
        <button class="b3-btn2 go dang" onClick=${onClose}><${Icon} name="trash-2" />${ask.go}</button></div>` : null;
    const footer = askBar || (panel === 'bulk'
        ? html`${''/* v19: the count of blocks that will not stage lived here, over the results column; the results' own filters already say it (Duplicate 5, Can’t read 2) */}
               <button class="b3-btn2" onClick=${requestClose}>Cancel</button>
               <button class="b3-btn2 go" disabled=${!readable.length || busy} onClick=${stageMany}>${busy ? 'Staging…' : B4F && !readable.length ? (editing ? 'No changes to stage' : 'Nothing to stage yet') : editing ? `Stage ${readable.length} change${readable.length === 1 ? '' : 's'}` : B4F && readable.length ? stageLabel(readable.map((b) => ({ f: { mode: b.mode } }))) : `Stage ${readable.length} ${mode} build${readable.length === 1 ? '' : 's'}`}${B4F ? html`` : null}</button>`
        : B4F ? html`<${StageMini} tone=${why ? 'warn' : 'ok'} say=${why ? `Before staging: ${why}` : 'Ready to stage'} /><button class="b3-btn2" onClick=${requestClose}>Cancel</button>
               ${''/* v19 (his items 24, 25): what blocks Stage is the summary under the preview (b4/form.js .f-stage), never a pop-up the drawer's
                    edge could cut; the button stays focusable (aria-disabled), is described by that summary, and a click jumps to the first blocker. */}
               ${why ? html`<button class="b3-btn2 go" disabled=${busy} aria-disabled="true" aria-describedby="b4-stage-st" onClick=${jumpToBlocker}>${busy ? 'Staging…' : stageLabel(cards)}</button>`
                   : html`<button class="b3-btn2 go" disabled=${busy} onClick=${stageCards}>${busy ? 'Staging…' : stageLabel(cards)}</button>`}`
        : html`<span class=${'why' + (blockers.length ? ' blocked' : '')} role="status">${blockers.length ? `Still needs ${blockers[0]}` : ''}</span>
               ${typeof window !== 'undefined' && window.B4_COLLECTIVE ? html`<button type="button" class="pb-anchip" aria-pressed=${another ? 'true' : 'false'} onClick=${() => setAnother(!another)}><${Icon} name=${another ? 'check' : 'plus'} />Add another after this</button>` : null}
               <button class="b3-btn2" onClick=${requestClose}>Cancel</button>
               <button class="b3-btn2 pb-another" disabled=${blockers.length > 0 || busy} onClick=${() => stageOne(true)}>Stage and add another</button>
               <button class="b3-btn2 go" disabled=${blockers.length > 0 || busy} onClick=${() => stageOne(another)}>${busy ? 'Staging…' : `Stage this ${mode} build`}</button>`);

    return html`
        <${Drawer} title=${title} eyebrow=${typeof window !== 'undefined' && window.B4_COLLECTIVE ? (editing ? 'Edit loadouts' : 'Create a loadout') : null} wide onClose=${requestClose} actions=${footer}>
            <div class="b3-nb" ref=${nbRef} data-arm=${mode} data-panel=${panel}>
                <div class="pb-bar">
                    ${''/* 2026-09-21 14:38 EDT — the Armory's own MP/DMZ switch, as the Export picker carries it (.mh-mode), not board 1's pill
                         segment: "The mp/dmz toggle buttons are broken … or their prior design/style." Editing is one armory, so the other is disabled. */}
                    <div class="mh-mode b3-xt-mode" role="radiogroup" aria-label="Which armory">
                        ${['MP', 'DMZ'].map((m) => html`<button type="button" key=${m} role="radio" data-arm=${m} aria-checked=${armMode === m ? 'true' : 'false'}
                            disabled=${editing && m !== mode} onClick=${() => { if (!editing && m !== armMode) switchMode(m); }}>${m}</button>`)}
                    </div>
                    <span class="pb-div" aria-hidden="true"></span>
                    ${editing ? (B4E ? html`<div class="pb-edchips">${chipWeapons.map((w) => { const acc = (builds.find((b) => keyOf(b.weaponName) === keyOf(w)) || {}).accent; return html`<span class="b3-sc" key=${w} style=${`--c:${acc || 'var(--ink3)'}`}><i aria-hidden="true"></i><span class="b3-nw">${w}<em>${buildsWordOf(editList.filter((b) => keyOf(b.weaponName) === keyOf(w)))}</em></span><button type="button" aria-label=${`Remove ${w} from the editor`} onClick=${() => removeWeapon(w)}><${Icon} name="x" /></button></span>`; })}</div>`
                        : html`<span class="pb-editing"><${Icon} name="square-pen" />Editing ${editWeapons.join(' · ')}</span>`)
                        : html`<${Seg} value=${panel} options=${[['add', 'Add build', 'card'], ['bulk', 'Bulk create', 'layers']]} onChange=${setPanel} label="One build or many" />`}
                </div>
                <div class="pb-view pb-in" key=${panel}>
                    ${panel === 'add'
                        ? (B4F ? html`<${B4AddForm} builds=${builds} cards=${cards} setCards=${setCards} active=${active} setActive=${setActive} Card=${Card} defaultMode=${mode} />`
                            : html`<${AddForm} builds=${builds} f=${f} setF=${setF} atts=${atts} setAtts=${setAtts} fromCode=${fromCode} Card=${Card} />`)
                        : B4F ? html`<${B4BulkForm} text=${text} setText=${setText} blocks=${blocks} editing=${editing} builds=${builds} Card=${Card} mode=${mode} />`
                            : html`<${BulkForm} text=${text} setText=${setText} blocks=${blocks} editing=${editing} builds=${builds} />`}
                </div>
            </div>
        <//>`;
}
