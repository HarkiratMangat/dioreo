// Board 3 version 2 — BOARD ONLY. Board 1's G9 New build drawer, built: one bar for the armory and for one build or many, the single form with the code filling attachments, and bulk create with numbered blocks, a tally and one result per block. The same drawer edits several builds at once when Edit builds is pressed with more than one selected. Globals from armory.logic.js: codeFill, slotCatalogue, buildArmoryAddOp, deriveNextImageKey, DISPLAY_SLOT_ORDER, SLOT_LABEL_TEXT, buildNumberOf.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef, useLayoutEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { Drawer } from '../ui/overlay.js';
import { stageOps } from '../ui/composeClient.js';

/* global codeFill, slotCatalogue, buildArmoryAddOp, deriveNextImageKey, DISPLAY_SLOT_ORDER, SLOT_LABEL_TEXT, buildNumberOf */

const CATS = [['AR', 'Assault Rifle'], ['SMG', 'Submachine Gun'], ['LMG', 'Light Machine Gun'], ['MARKSMAN', 'Marksman'], ['SNIPER', 'Sniper'], ['SHOTGUN', 'Shotgun'], ['SECONDARIES', 'Secondary'], ['MELEE', 'Melee']];
const CAT_SHORT = { AR: 'AR', SMG: 'SMG', LMG: 'LMG', MARKSMAN: 'Marksman', SNIPER: 'Sniper', SHOTGUN: 'Shotgun', SECONDARIES: 'Secondaries', MELEE: 'Melee' };
const MP_TIERS = [['none', 'None'], ['best', 'Best'], ['top3', 'Top 3'], ['top4', 'Top 4'], ['top5', 'Top 5']];
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
                        <div class="dwfield"><label for="nb-w">Weapon</label>
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
                            <input id="nb-label" value=${f.buildName} placeholder=${`Build ${n}`} maxLength="32" onInput=${(e) => set({ buildName: e.target.value })} /></div></div>
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
                    <h4 class="bf-h">Attachments ${dmz ? html`<span class="bf-n">${atts.filter((a) => a.trim()).length} of 9</span>`
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
                                        : html`<div class="pb-file"><${Icon} name="image" /><input class="pb-link" value=${f.imageLink} placeholder="Paste a link, or choose a file" onInput=${(e) => set({ imageLink: e.target.value })} /><label class="chip">Choose<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange=${(e) => pick(e, set)} /></label></div>`}
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
                ${f.weaponName ? html`<${Card} build=${previewBuild} siblings=${[...siblings, previewBuild]} />` : html`<p class="empty">Pick a weapon and the card builds itself here.</p>`}
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
const TOKENS = { MP: ['meta', 'toxic', 'best', 'top3', 'top4', 'top5'], DMZ: ['meta', 'toxic', 'best-close', 'best-midlong', 'top3-close', 'top3-midlong', 'top5-close', 'top5-midlong'] };
const badgesOf = (b) => [b.isMeta ? 'meta' : null, b.categoryRank || null, b.dmzRangeRank || null, b.isToxic ? 'toxic' : null].filter(Boolean);
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

function BulkForm({ text, setText, blocks, editing }) {
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
    const lineClass = (b, n, raw) => {
        const t = raw.trim();
        return 'pb-l' + (n === b.start ? ' pb-hd' : '') + (b.hits.has(n) ? ' pb-hit' : '') + (b.err === n ? ' pb-err' : '') + (/^[-*•]/.test(t) ? ' pb-at' : '');
    };
    const drawLine = (raw, n, b) => {
        if (b && n === b.start) { const [w, ...rest] = raw.split('|'); return rest.length ? html`${w}<i>|</i>${rest.join('|')}` : raw; }
        const m = /^(\s*)([A-Za-z ]+:)(.*)$/.exec(raw);
        return m && !/^\s*[-*•]/.test(raw) ? html`${m[1]}<em>${m[2]}</em>${m[3]}` : raw;
    };
    return html`
        <div class="pb-bulk">
            <div>
                <div class="pb-edhead"><label for="pb-ta">Builds</label><span>${blocks.length} build${blocks.length === 1 ? '' : 's'} · ${lines.length} lines</span></div>
                <div class="pb-edwrap">
                    <div class="pb-ed" aria-hidden="true">
                        ${segs.map((s, k) => (s.blank
                            ? html`<span class="pb-l pb-blank" key=${'x' + k}> </span>`
                            : html`<div class="pb-blk" data-o=${s.b.outcome} key=${'b' + k}><span class="pb-bn">${s.b.index}</span><div>${lines.slice(s.from - 1, s.to).map((raw, j) => html`<span class=${lineClass(s.b, s.from + j, raw)} data-n=${s.from + j} key=${j}>${drawLine(raw, s.from + j, s.b) || ' '}</span>`)}</div></div>`))}
                    </div>
                    <textarea id="pb-ta" class="pb-ta" ref=${ta} spellcheck="false" wrap="off" value=${text} style=${`height:${lines.length * 22 + 20}px`}
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
                            <div class="pb-rt"><span class="pb-rn">${b.index}</span><strong>${b.weapon || '—'}</strong>${b.before ? html`<span>Build ${b.n}</span>` : b.buildName ? html`<span>${b.buildName}</span>` : null}<span class="pb-ln">${b.start === b.end ? `line ${b.start}` : `lines ${b.start}–${b.end}`}</span></div>
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

export function B3BuildDrawer({ addBadge = null, builds, mode: startMode, panel: startPanel, editIds, csrfToken, overlay, Card, onClose, onStaged }) {
    const editing = Array.isArray(editIds) && editIds.length > 1;
    const editList = editing ? builds.filter((b) => editIds.includes(String(b._id))) : [];
    const [mode, setMode] = useState(editing ? (editList[0] || {}).mode || startMode : startMode);
    const [panel, setPanel] = useState(editing ? 'bulk' : startPanel || 'add');
    const blank = (m) => ({ mode: m, weaponName: '', category: 'AR', buildName: '', shareCode: '', isMeta: false, isToxic: false, rank: 'none', imageMethod: 'up', imageKey: '', imageLink: '', fileName: '', fileSize: '', filePreview: '' });
    const [f, setF] = useState(blank(mode));
    const [atts, setAtts] = useState(Array(mode === 'DMZ' ? 9 : 5).fill(''));
    const [text, setText] = useState(editing ? withBadge(exportText(editList), addBadge) : '');
    const [busy, setBusy] = useState(false);
    const original = useRef(editing ? exportText(editList) : '');

    const wk = keyOf(f.weaponName);
    const fromCode = mode === 'MP' && f.shareCode.length >= 2 && wk ? codeFill(builds, wk, 'MP', f.shareCode) : [];
    useEffect(() => {
        if (!fromCode.length) return;
        setAtts((prev) => { const next = fromCode.map((e, i) => ((prev[i] && prev[i].trim()) ? prev[i] : e.name || '')); while (next.length < 5) next.push(''); return next; });
    }, [f.shareCode, wk]);

    const blocks = panel === 'bulk' ? readPaste(text, builds, mode) : [];
    const readable = blocks.filter((b) => b.outcome !== 'bad' && b.outcome !== 'same');
    const skipped = blocks.filter((b) => b.outcome === 'bad');
    const switchMode = (m) => { setMode(m); setF((p) => ({ ...p, mode: m, rank: 'none' })); setAtts(Array(m === 'DMZ' ? 9 : 5).fill('')); };
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
    function requestClose() {
        const dirty = panel === 'bulk' ? text !== original.current : Boolean(f.weaponName || f.shareCode || atts.some((a) => a.trim()));
        if (!dirty) return onClose();
        overlay.confirm({ op: 'loadout.add', tier: 1, confirmLabel: 'Discard', title: 'Discard this draft?', body: html`<p class="dw-p">Nothing has been staged. Closing throws away what is in the drawer.</p>`, onConfirm: onClose });
    }

    const editWeapons = [...new Set(editList.map((b) => b.weaponName))];
    const title = editing ? `Edit ${editList.length} ${mode} builds` : panel === 'bulk' ? `New ${mode} builds` : `New ${mode} build`;
    const eyebrow = editing ? `loadout.bulkAdd · ${mode} · updates` : panel === 'bulk' ? `loadout.bulkAdd · ${mode} · tier 1` : `loadout.add · ${mode} · tier 1`;
    const footer = panel === 'bulk'
        ? html`<span class=${'why' + (skipped.length ? ' blocked' : '')} role="status">${skipped.length ? `Block ${skipped.map((b) => b.index).join(', ')} ${skipped.length === 1 ? 'is' : 'are'} skipped` : editing && !readable.length ? 'Nothing has changed yet' : ''}</span>
               <button class="btn no" onClick=${requestClose}>Cancel</button>
               <button class="btn go" disabled=${!readable.length || busy} onClick=${stageMany}>${busy ? 'Staging…' : editing ? `Stage ${readable.length} change${readable.length === 1 ? '' : 's'}` : `Stage ${readable.length} ${mode} build${readable.length === 1 ? '' : 's'}`}</button>`
        : html`<span class=${'why' + (blockers.length ? ' blocked' : '')} role="status">${blockers.length ? `Still needs ${blockers[0]}` : ''}</span>
               <button class="btn no" onClick=${requestClose}>Cancel</button>
               <button class="btn" disabled=${blockers.length > 0 || busy} onClick=${() => stageOne(true)}>Stage and add another</button>
               <button class="btn go" disabled=${blockers.length > 0 || busy} onClick=${() => stageOne(false)}>${busy ? 'Staging…' : `Stage this ${mode} build`}</button>`;

    return html`
        <${Drawer} eyebrow=${eyebrow} title=${title} wide onClose=${requestClose} actions=${footer}>
            <div class="b3-nb" data-arm=${mode} data-panel=${panel}>
                <div class="pb-bar">
                    <${Seg} cls="pb-mode" value=${mode} options=${[['MP', 'MP'], ['DMZ', 'DMZ']]} onChange=${editing ? () => {} : switchMode} label="Which armory" attrs=${{ 'data-arm': mode }} />
                    <span class="pb-div" aria-hidden="true"></span>
                    ${editing ? html`<span class="pb-editing"><${Icon} name="square-pen" />Editing ${editWeapons.join(' · ')}</span>`
                        : html`<${Seg} value=${panel} options=${[['add', 'Add build', 'card'], ['bulk', 'Bulk create', 'layers']]} onChange=${setPanel} label="One build or many" />`}
                </div>
                <div class="pb-view pb-in" key=${panel}>
                    ${panel === 'add'
                        ? html`<${AddForm} builds=${builds} f=${f} setF=${setF} atts=${atts} setAtts=${setAtts} fromCode=${fromCode} Card=${Card} />`
                        : html`<${BulkForm} text=${text} setText=${setText} blocks=${blocks} editing=${editing} />`}
                </div>
            </div>
        <//>`;
}
