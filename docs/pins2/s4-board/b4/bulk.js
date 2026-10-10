// BOARD 4 · v11 — Bulk create and Edit, rebuilt (2026-09-22 13:55 EDT, his v10 intake items 22–30). The reader is b4/bulkformat.js; this file is the
// editor and what it says about each block. v19 (his item 32): B · margin notes is gone; A · Ledger and C · Preview stack both ship, switched by a
// view toggle in the results' own header (the manifest's List / By slot toggle, retired 2026-10-01), and the choice is kept (board state 'bkv').
//   A · Ledger        — beside the editor, one result card per build, as it will stage.
//   C · Preview stack — beside the editor, the Discord card each block will become, under a strip saying what staging does to it.
// Shared by all three: the caret lights its block's card and a card puts the caret on its block (item 23), the image line says what it
// resolved to (27), the mode reads as a chip (27), a hint line is visibly a hint and never looks typed (25), and the format guide is a
// designed key rather than a sentence of code tokens (22).
import { html } from '../vendor/htm-preact.mjs';
import { useState, useRef, useEffect, useLayoutEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { B3Badges, CodeCell } from '../b3/armory-parts.js';
import { useB3, setB3 } from '../b3/state.js';
import { toDisplay, looksCompact, keyOf, modesOf } from './bulkformat.js';

/* global buildNumberOf */

const OUT = { typing: ['Being typed', 'neutral'], new: ['New', 'ok'], upd: ['Update', 'info'], same: ['Unchanged', 'neutral'], warn: ['Warning', 'warn'], dup: ['Duplicate', 'warn'], bad: ['Can’t read', 'bad'] };
const ORDER = ['typing', 'new', 'upd', 'warn', 'dup', 'bad', 'same'];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const ownerWord = (builds, o) => `${o.weaponName} · Build ${buildNumberOf(builds, o).n}`;

function imageChip(b, builds) {
    const st = b.imageState || { s: 'none', t: 'No image' };
    const [ic, tone, word] = {
        none: ['image-off', 'neutral', 'No image'],
        url: ['link', 'ok', 'Link'],
        used: ['triangle-alert', 'warn', st.t && st.t.weaponName ? `Uses ${ownerWord(builds, st.t)}’s image` : 'In use'],
        kept: ['check', 'ok', 'This build’s image'],
        unused: ['check', 'ok', 'Unused upload'],
        // v19 (his item 14's lesson, applied here too): a key this build will take is a plain fact with a check, never a sparkle
        new: ['check', 'ok', /next free/i.test(st.t || '') ? 'Next free key' : 'New key'],
    }[st.s] || ['image', 'neutral', ''];
    return html`<span class="b4-hint bk-img" data-tone=${tone}><${Icon} name=${ic} />${word}</span>`;
}

// ── One block's result ─────────────────────────────────────────────────────────────────────────────────────────────────────
// 2026-09-26 16:43 EDT (his yes to the v14 proposal: "Clicking anywhere on a Bulk result card: yes."): the whole card puts the cursor on its lines, in both
// views. A click on a control inside it (the gutter, the code chip) or one that ends a text selection is left to that control.
const cardJump = (onJump, b) => (e) => {
    if (e.target.closest && e.target.closest('button, a, input, textarea, [contenteditable]')) return;
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    if (sel && String(sel).trim() && e.currentTarget.contains(sel.anchorNode)) return;
    onJump(b);
};
function Result({ b, builds, on, onJump, accent, compact = false }) {
    const [word, tone] = OUT[b.outcome] || ['', 'neutral'];
    const readable = b.outcome !== 'bad' && b.outcome !== 'dup';
    const hasBadges = b.badges && (b.badges.isMeta || b.badges.isToxic || b.badges.isAss || b.badges.categoryRank || b.badges.dmzRangeRank);
    const modes = b.badges ? modesOf(b.badges) : [];
    const unk = readable ? (b.atts || []).filter((a) => !a.slot).map((a) => a.name) : [];
    return html`
        <div role="listitem" class=${'bk-card' + (on ? ' on' : '') + (compact ? ' sm' : '')} data-bi=${b.index} data-o=${b.outcome} style=${`--c:${accent}`} onClick=${cardJump(onJump, b)}>
            <button type="button" class="bk-gut" aria-label=${`Put the cursor on lines ${b.start} to ${b.end}`} onClick=${() => onJump(b)}>
                <span>${b.start}</span><i aria-hidden="true"></i><span>${b.end}</span>
            </button>
            <div class="bk-body">
                <div class="bk-ch">
                    <b class="bk-w">${b.weapon || 'No weapon'}</b>
                    <span class="bk-lab">${b.label || (b.before ? `Build ${b.n}` : readable ? `New · Build ${b.n}` : '')}</span>
                    ${b.mode ? html`<span class="b3-xt-pm" data-arm=${b.mode}>${b.mode}</span>` : null}
                    <span class="sp"></span>
                    <span class="b4-hint" data-tone=${tone}>${word}</span>
                </div>
                ${b.msg ? html`<p class="bk-msg" data-tone=${tone}><${Icon} name="triangle-alert" /><span>${b.msg.t}</span>${b.msg.eg ? html`<code>${b.msg.eg}</code>` : null}</p>`
                    : unk.length ? html`<p class="bk-msg" data-tone="info"><${Icon} name="info" /><span>${unk.length === 1 ? `“${unk[0]}” isn’t in the Armory yet — it will be added as typed` : `${unk.length} attachments aren’t in the Armory yet — they will be added as typed`}</span></p>` : null}
                ${readable ? html`
                    <div class="bk-run b3-fadx" data-rows="2"><div class="bk-atts">${b.atts.map((a, i) => html`<span class=${'wg-at' + (a.slot ? '' : ' bk-unk')} key=${i} data-slot=${a.slot || null} style=${a.slot ? `--sl:var(--sl-${String(a.slot).toLowerCase().replace(/\s+/g, '-')}, var(--sl-unknown))` : null}
                        title=${a.slot ? a.slot : 'Not in the Armory yet — it will be added as typed'}><span class="wg-an">${a.name}</span></span>`)}</div></div>
                    ${compact ? null : html`<dl class="bk-kv">
                        ${''/* 2026-09-26 15:28 EDT (his: "enclose the gunsmith code in the copy-able code block style container that the Armory manifest's Selection Bar's list view uses";
                           then "you used the wrong gunsmith copy-able block… i asked for the armory manifest's SELECTION BAR'S LIST VIEW GUNSMITH COPY-ABLE CHIP"):
                           the selection bar's own CodeCell, imported rather than copied, so the chip, its hover plate and its Copied state are one component */}
                        ${b.mode !== 'DMZ' ? html`<div><dt>Code</dt><dd>${b.code ? html`<${CodeCell} b=${{ shareCode: b.code, mode: b.mode }} />` : html`<span class="bk-none">None</span>`}</dd></div>` : null}
                        <div><dt>Badges</dt><dd>${hasBadges ? html`<div class="bk-run b3-fadx" data-rows="2"><${B3Badges} b=${{ ...b.badges, rankModes: [], _id: `bk-${b.index}` }} /></div>` : html`<span class="bk-none">None</span>`}</dd></div>
                        ${''/* 2026-09-25 23:19 EDT (his 23:12 EDT, the Modes family): the family has its own row, under the portal's own label */}
                        ${b.mode !== 'DMZ' ? html`<div><dt>Rank Mode</dt><dd>${modes.length ? html`<div class="bk-run b3-fadx" data-rows="2"><${B3Badges} b=${{ rankModes: modes, mode: 'MP', _id: `bk-m-${b.index}` }} /></div>` : html`<span class="bk-none">None</span>`}</dd></div>` : null}
                        <div><dt>Image</dt><dd>${b.image && b.imageState.s !== 'url' ? html`<code>${b.imageState.k || b.image}</code>` : null}${imageChip(b, builds)}</dd></div>
                    </dl>`}
                    ${b.outcome === 'upd' ? html`<ul class="bk-diff">${b.diffs.slice(0, compact ? 3 : 6).map((d, j) => html`
                        <li key=${j}><span class="bk-dk">${d.k}</span>${d.was ? html`<s>${d.was}</s>` : null}${d.was && d.now ? html`<${Icon} name="arrow-right" />` : null}${d.now ? html`<b>${d.now}</b>` : null}</li>`)}
                        ${b.diffs.length > (compact ? 3 : 6) ? html`<li class="bk-more">${plural(b.diffs.length - (compact ? 3 : 6), 'more change')}</li>` : null}</ul>` : null}` : null}
            </div>
        </div>`;
}

// v13 (2026-09-22 16:31 EDT) — the empty results column shows what a result looks like (onboard): the guide's own example, as a faded card with the line on it.
const exampleOf = (mode) => ({ index: 0, start: 1, end: 7, n: 6, weapon: 'BAL-27', category: 'AR', mode, label: 'Close range', outcome: 'new', code: mode === 'DMZ' ? '' : '1C2C4A8A9C',
    atts: [{ name: 'Gauge-9 Mono', slot: 'Muzzle' }, { name: 'Crown-H3 Barrel', slot: 'Barrel' }],
    badges: mode === 'DMZ' ? { isMeta: true, dmzRangeRank: 'top5', mode, category: 'AR' } : { isMeta: true, categoryRank: 'best', rankModes: ['HP', 'S&D'], mode, category: 'AR' },
    image: 'BAL-27-6', imageState: { s: 'new', t: 'Next free key', k: 'BAL-27-6' } });

// ── v19 (his item 26: "i HATE the format hint… so unintuitive"): THE FORMAT IS SHOWN AS WHAT YOU TYPE. One example build, drawn in the editor's own
// line model and colours, each line with what it is beside it; a button puts the example in the editor. It opens over the editor from the Format
// button and never pushes the editor down (the old card did, and with it pushed the editor out of the drawer).
const EX = {
    MP: ['BAL-27 | AR | MP', 'Label: Close range', 'Code: 1C2C4A8A9C', 'Image: BAL-27-6', 'Badges: meta, best, hp, s&d', '- Gauge-9 Mono', '- Crown-H3 Barrel'],
    DMZ: ['TYPE 19 | AR | DMZ', 'Label: Long lane', 'Image: DMZ-TYPE-19-3', 'Badges: meta, best-midlong', '- Thermal Sight', '- Agile Stock'],
};
const SAY = { hd: 'Weapon · category · mode (blank: the switch)', label: 'Optional', code: 'Optional · fills the slots it names', image: 'Optional · a key or a link', badges: 'Optional · meta, toxic, ass, one tier, rank modes', at: 'One attachment per line' };
export const exampleText = (mode) => EX[mode === 'DMZ' ? 'DMZ' : 'MP'].join('\n');
function paint(t, mode) {
    if (t.includes('|')) { const p = t.split('|').map((x) => x.trim()); return html`<b>${p[0]}</b><i> | </i>${p[1]}<i> | </i><span class="bk-md" data-arm=${mode}>${p[2]}</span>`; }
    const a = /^(-\s+)(.*)$/.exec(t); if (a) return html`<i>${a[1]}</i>${a[2]}`;
    const m = /^([A-Za-z ]+:)(.*)$/.exec(t); return m ? html`<em>${m[1]}</em>${m[2]}` : t;
}
function FormatCard({ mode, onInsert, onClose }) {
    const md = mode === 'DMZ' ? 'DMZ' : 'MP';
    const rows = EX[md].map((t) => ({ t, k: t.includes('|') ? 'hd' : /^-/.test(t) ? 'at' : t.split(':')[0].toLowerCase() }));
    const ref = useRef(null);
    useEffect(() => {
        const off = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('.bk-gt')) onClose(); };
        const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
        document.addEventListener('pointerdown', off); document.addEventListener('keydown', esc, true);
        return () => { document.removeEventListener('pointerdown', off); document.removeEventListener('keydown', esc, true); };
    }, []);
    return html`
        <div class="bk-fmt" role="dialog" aria-label="The bulk format" ref=${ref}>
            <div class="bk-fmt-h"><b>One block per build</b><span>Only the first line and one attachment are needed.</span></div>
            <ol class="bk-fmt-l">${rows.map((r, i) => html`<li key=${i} data-k=${r.k}><span class="bk-fmt-n">${i + 1}</span><code>${paint(r.t, md)}</code><em>${r.k === 'at' && i > 0 && rows[i - 1].k === 'at' ? '' : SAY[r.k] || ''}</em></li>`)}
                <li data-k="blank"><span class="bk-fmt-n">${rows.length + 1}</span><code></code><em>A blank line starts the next build</em></li></ol>
            <div class="bk-fmt-f"><span><${Icon} name="download" />A file from Export pastes straight in and opens into these lines.</span>
                <button type="button" class="b3-btn2 sm" onClick=${onInsert}><${Icon} name="plus" />Insert this example</button></div>
        </div>`;
}

export function B4BulkForm({ text, setText, blocks, editing, builds = [], Card, mode }) {
    const f2b = useB3('bkv') === 'c' ? 'c' : 'a';
    const lines = text.split('\n');
    const ta = useRef(null);
    const resRef = useRef(null);
    const [caret, setCaret] = useState(0);
    const [guide, setGuide] = useState(false);
    const [flt, setFlt] = useState('all');
    const accentFor = (w) => ((builds.find((x) => keyOf(x.weaponName) === keyOf(w)) || {}).accent) || 'var(--ink3)';
    const byLine = new Map(); blocks.forEach((b) => { for (let n = b.start; n <= b.end; n++) byLine.set(n, b); });
    const active = caret ? byLine.get(caret) || null : null;
    const readCaret = () => { const t = ta.current; if (!t) return; setCaret(t.value.slice(0, t.selectionStart).split('\n').length); };
    const jump = (b) => {
        const t = ta.current; if (!t) return;
        const off = lines.slice(0, b.start - 1).reduce((s, l) => s + l.length + 1, 0);
        t.focus({ preventScroll: true }); t.setSelectionRange(off, off); setCaret(b.start);
        // 2026-09-26 18:08 EDT (his: the card's lines should "actually come fully into focus"): the whole block, first line to last, is brought inside the
        // editor's clear band — clear of its own top and bottom fades — and centred there when it fits; a block taller than the band shows its head.
        const box = t.closest('.bk-wrap'); const ed = box && box.querySelector('.pb-ed');
        const first = ed && ed.querySelector(`.b3-xt-ln[data-n="${b.start}"]`), last = ed && ed.querySelector(`.b3-xt-ln[data-n="${b.end}"]`);
        if (box && first && last) {
            const cs = getComputedStyle(box), br = box.getBoundingClientRect();
            const ft = (parseFloat(cs.getPropertyValue('--fdy')) || 28) + 8, fb = (parseFloat(cs.getPropertyValue('--fdb')) || parseFloat(cs.getPropertyValue('--fdy')) || 28) + 8;
            const top = first.getBoundingClientRect().top - br.top + box.scrollTop, bot = last.getBoundingClientRect().bottom - br.top + box.scrollTop;
            const band = box.clientHeight - ft - fb, h = bot - top;
            const to = h <= band ? top - ft - (band - h) / 2 : top - ft;
            box.scrollTo({ top: Math.max(0, Math.min(to, box.scrollHeight - box.clientHeight)), behavior: 'smooth' });
        }
    };
    // The lit card is kept in view INSIDE its own column, so following the caret never scrolls the editor away from it.
    // 2026-09-26 15:14 EDT (his: the TYPE 19 card being typed "is still kind of hidden behind the fade instead of scrolling into a focused view"): the band kept
    // clear is the list's own fades (the board fade's top depth, 28, and --fdb, 110, where Cancel and Stage float) plus 8px, not 8px from the edge; a
    // card taller than the band keeps its head in view. It re-runs as the card grows while typed, not only when the caret changes card.
    useEffect(() => {
        const box = resRef.current; if (!box || !active) return;
        const el = box.querySelector(`[data-bi="${active.index}"]`); if (!el) return;
        const cs = getComputedStyle(box);
        const ft = (parseFloat(cs.getPropertyValue('--fdy')) || 28) + 8, fb = (parseFloat(cs.getPropertyValue('--fdb')) || 28) + 8;
        const top = el.offsetTop - box.offsetTop, bot = top + el.offsetHeight, band = box.clientHeight - ft - fb;
        let to = null;
        if (top < box.scrollTop + ft || (el.offsetHeight > band && Math.abs(box.scrollTop - (top - ft)) > 2)) to = top - ft;
        else if (bot > box.scrollTop + box.clientHeight - fb) to = bot - box.clientHeight + fb;
        if (to !== null) box.scrollTo({ top: Math.max(0, to), behavior: 'smooth' });
    }, [active && active.index, text]);
    // A paste in the compact format opens into the display form, labelled; anything else pastes as typed.
    const onPaste = (e) => {
        const clip = (e.clipboardData && e.clipboardData.getData('text')) || '';
        if (!looksCompact(clip)) return;
        e.preventDefault();
        const t = e.target, a = t.selectionStart, z = t.selectionEnd;
        setText(t.value.slice(0, a) + toDisplay(clip) + t.value.slice(z));
    };

    // ── the editor overlay — the same line model the Export file uses (.b3-xt-ln), so the caret sits on the glyph it draws ──
    const unknownAt = new Set(); blocks.forEach((b) => (b.atts || []).forEach((a) => { if (!a.slot) unknownAt.add(a.n); }));
    const segs = []; for (let i = 0; i < lines.length;) { const b = byLine.get(i + 1); if (!b) { segs.push({ blank: true, n: i + 1 }); i++; continue; } segs.push({ b, from: b.start, to: b.end }); i = b.end; }
    const last = blocks[blocks.length - 1];
    const gMode = (last && last.mode) || mode;
    // (2026-09-22 15:33 EDT) ONE Enter continues the block being typed; a blank line after a blank line starts the next build. The first cut put the
    // NEXT build's hint on the caret's fresh line and flagged the header being typed as unreadable (the flow test).
    const endsBlank = lines.length >= 2 && !lines[lines.length - 1].trim() && !lines[lines.length - 2].trim();
    const nextLines = (() => {
        const T = { label: 'Label: a name, like Close range', code: 'Code: the gunsmith code', image: 'Image: a key or a link', badges: 'Badges: meta, best', att: '- an attachment, one per line' };
        if (!text.trim()) return [`WEAPON | CATEGORY | ${mode}`, T.label, ...(mode === 'DMZ' ? [] : [T.code]), T.image, T.badges, T.att];
        if (endsBlank) return [`WEAPON | CATEGORY | ${mode}  — the next build`];
        if (!last) return [];
        if ((last.atts || []).length) return ['- next attachment, or a blank line'];
        const f = last.fields || {};
        return [!f.label && T.label, gMode !== 'DMZ' && !f.code && T.code, !f.image && T.image, !f.badges && T.badges, T.att].filter(Boolean);
    })();
    // v19 (his item 27: "so intrusive"): one hint only — the next line the reader expects, as quiet ghost text where you would type it, and only while
    // you are typing at the end. Nothing at all in an empty editor, which has its own start card.
    const atEnd = caret >= lines.length;
    const hint = !text.trim() || !atEnd ? [] : nextLines.slice(0, 1);
    const gOver = !lines[lines.length - 1].trim();
    const gStart = gOver ? lines.length : lines.length + 1;
    const pending = nextLines.length && !endsBlank ? last : null;
    const lineClass = (b, n, raw) => {
        const t = raw.trim();
        return 'b3-xt-ln' + (n === b.start ? ' x-hd' : /^[-*•]/.test(t) || !/^[A-Za-z ]+:/.test(t) ? ' x-at' : ' x-kv') + (b.hits.has(n) ? ' pb-hit' : '')
            + (b.err === n && !(b === pending && b.outcome === 'bad' && b.msg && /No attachments/.test(b.msg.t)) ? ' pb-err' : '') + (unknownAt.has(n) ? ' pb-unk' : '');
    };
    // ⚠️ Nothing drawn over a typed character may change its WIDTH (no weight, no letter-spacing, no padding) or the caret lands on a
    // different glyph than the one drawn. The mode chip and the image chip are fills and rings on the same glyphs, or sit after the text.
    const drawLine = (raw, n, b) => {
        if (n === b.start) {
            const p = raw.split('|');
            if (p.length < 2) return raw;
            const sp = p[2] !== undefined ? /^(\s*)(.*?)(\s*)$/.exec(p[2]) : null;
            const md = sp ? html`<i>|</i>${sp[1]}<span class="bk-md" data-arm=${b.mode}>${sp[2]}</span>${sp[3]}${p.slice(3).join('|')}` : html`<span class="bk-inf" data-arm=${b.mode}>${b.mode}</span>`;
            return html`<b>${p[0]}</b><i>|</i>${p[1]}${md}`;
        }
        const a = /^(\s*[-*•]\s+)(.*)$/.exec(raw);
        if (a) return html`<i>${a[1]}</i>${a[2]}`;
        const m = /^(\s*)([A-Za-z ]+:)(.*)$/.exec(raw);
        if (!m) return raw;
        // v19 (his item 27): the image line no longer carries a chip; the result card beside it says what the image resolved to
        return html`${m[1]}<em>${m[2]}</em>${m[3]}`;
    };

    // the block still being typed is not a failure: it reads as Being typed until its first attachment, never as Can't read
    const view = blocks.map((b) => (b === pending && b.outcome === 'bad' && b.msg && /No attachments/.test(b.msg.t) ? { ...b, outcome: 'typing', msg: { t: 'Its attachments come next, one per line' } } : b));
    const counts = ORDER.map((k) => [k, view.filter((b) => b.outcome === k).length]).filter(([, v]) => v);
    const shown = flt === 'all' ? view : view.filter((b) => b.outcome === flt);
    const head = html`
        <div class="bk-rh">
            ${blocks.length ? html`<div class="bk-fl" role="radiogroup" aria-label="Show">
                <button type="button" role="radio" aria-checked=${flt === 'all' ? 'true' : 'false'} onClick=${() => setFlt('all')}>All<b>${blocks.length}</b></button>
                ${counts.map(([k, v]) => html`<button type="button" key=${k} role="radio" data-o=${k} aria-checked=${flt === k ? 'true' : 'false'} onClick=${() => setFlt(flt === k ? 'all' : k)}><i aria-hidden="true"></i>${OUT[k][0]}<b>${v}</b></button>`)}
            </div>` : null}
            ${''/* 2026-09-26 16:34 EDT (his: "change Ledger/Discord toggle's styling to match the 'By weapon/One table' toggle styling? Everything except the sizing… And
                 reword 'Discord' to 'Embed'"): the selection bar list's own View label and toggle (.b3-sd-vl, .b3-sd-vt); only its size is Bulk's (b4/classes.css) */}
            <span class="b3-sd-vl" aria-hidden="true">View</span>
            <div class="b3-sd-vt bk-view" role="group" aria-label="Show each build as">
                ${[['a', 'Ledger', 'list'], ['c', 'Embed', 'card']].map(([v, label, icon]) => html`
                    <button type="button" key=${v} class=${f2b === v ? 'on' : ''} aria-pressed=${f2b === v ? 'true' : 'false'} onClick=${() => setB3('bkv', v)}><${Icon} name=${icon} />${label}</button>`)}</div>
        </div>`;


    // A1, V2's last review (2026-10-05 03:08 EDT): the textarea is sized from what it renders, on the 24px pitch, not from its line count: a soft-wrapped
    // line (a pasted URL) is one line and two rows, and the count left "Bulk · several" 36px short of its own text, so the caret ran below the box
    useLayoutEffect(() => { const t = ta.current; if (!t) return; t.style.height = 'auto'; const fit = 24 + Math.ceil((t.scrollHeight - 24) / 24) * 24; t.style.height = Math.max(fit, (lines.length + hint.length) * 24 + 24) + 'px'; }, [text, hint.length, guide, mode]);
    const editor = html`
        <div class="bk-edcol">
            <div class="bk-eh">
                <label for="pb-ta">${editing ? 'The builds you are editing' : 'Builds'}</label>
                <span class="b4-hint">${plural(blocks.length, 'build')}</span>
                <span class="sp"></span>
                <button type="button" class="bk-gt" aria-expanded=${guide ? 'true' : 'false'} onClick=${() => setGuide(!guide)}><${Icon} name="list" />Format</button>
            </div>
            ${guide ? html`<${FormatCard} mode=${mode} onClose=${() => setGuide(false)} onInsert=${() => { setText(exampleText(mode)); setGuide(false); setTimeout(() => ta.current && ta.current.focus(), 0); }} />` : null}
            <div class="bk-frame"><div class="pb-edwrap bk-wrap b3-fady">
                <div class="pb-ed b3-xt-bin" aria-hidden="true">
                    ${segs.map((s, k) => (s.blank
                        ? html`<div class="b3-xt-ln x-blank" key=${'x' + k} data-n=${s.n}><span class="b3-xt-no">${s.n}</span><span class="b3-xt-tx"> </span></div>`
                        : html`<div class=${'pb-blk' + (active === s.b ? ' on' : '')} data-o=${s.b.outcome} key=${'b' + k} style=${`--c:${accentFor(s.b.weapon)}`}>${lines.slice(s.from - 1, s.to).map((raw, j) => html`<div class=${lineClass(s.b, s.from + j, raw)} key=${j} data-n=${s.from + j}><span class="b3-xt-no">${s.from + j}</span><span class="b3-xt-tx">${drawLine(raw, s.from + j, s.b) || ' '}</span></div>`)}</div>`))}
                    ${hint.length ? html`<div class=${'pb-ghost bk-ghost' + (gOver ? ' x-over' : '')} aria-hidden="true">${hint.map((g, k) => html`<div class="b3-xt-ln x-ghost" key=${k}><span class="b3-xt-no">${gStart + k}</span><span class="b3-xt-tx"><span class="bk-gh">${g}</span></span></div>`)}</div>` : null}
                </div>
                <textarea id="pb-ta" class="pb-ta" ref=${ta} spellcheck="false" wrap="soft" value=${text}
                          aria-label="Builds, one block per build, a blank line between blocks" onPaste=${onPaste} onInput=${(e) => { setText(e.target.value); readCaret(); }}
                          onKeyUp=${readCaret} onClick=${readCaret} onFocus=${readCaret} onSelect=${readCaret}></textarea>
                ${!text.trim() && !guide ? html`<div class="bk-start"><div class="bk-say"><b>${editing ? 'Nothing to edit yet' : 'Type a build, or paste an Export file'}</b><span>One block per build, a blank line between them.</span></div>
                    <div class="bk-acts"><button type="button" class="b3-btn2 sm" onClick=${() => { setText(exampleText(mode)); setTimeout(() => ta.current && ta.current.focus(), 0); }}><${Icon} name="plus" />Insert an example</button>
                        <button type="button" class="b3-btn2 sm" onClick=${() => setGuide(true)}><${Icon} name="list" />See the format</button></div></div>` : null}
            </div></div>
        </div>`;

    // 2026-09-25 18:38 EDT (filed 2026-09-25 01:58 EDT, his 10:47 EDT "do the 'filed: empty Bulk in Discord view' thing"): one Discord preview renderer for a typed
    // block and for the empty state's ghost, so in Discord view the ghost is the card the view will show rather than the Ledger's result card.
    const preview = (b, on, onJump) => html`<div role="listitem" class=${'bk-prev' + (on ? ' on' : '')} key=${b.index} data-bi=${b.index} data-o=${b.outcome} style=${`--c:${accentFor(b.weapon)}`} onClick=${cardJump(() => onJump(), b)}>
        <div class="bk-strip"><button type="button" class="bk-gut h" onClick=${onJump} aria-label=${`Put the cursor on lines ${b.start} to ${b.end}`}><span>${b.start}–${b.end}</span></button>
            <span class="b4-hint" data-tone=${OUT[b.outcome][1]}>${OUT[b.outcome][0]}</span>${b.msg ? html`<span class="bk-sm">${b.msg.t}</span>` : b.outcome === 'upd' ? html`<span class="bk-sm">${plural(b.diffs.length, 'change')}</span>` : null}</div>
        <${Card} build=${{ weaponName: b.weapon, category: b.category, mode: b.mode, buildName: b.label, shareCode: b.code, attachments: b.atts.map((a) => a.name), attachmentSlots: b.atts.map((a) => a.slot || ''), ...b.badges, _id: `bk-${b.index}`, accent: accentFor(b.weapon) }}
            siblings=${[...builds.filter((x) => x.mode === b.mode && keyOf(x.weaponName) === keyOf(b.weapon) && x !== b.before), { _id: `bk-${b.index}` }]} />
      </div>`;

    return html`
        <div class="bk" data-f=${f2b}>
            ${editor}
            <div class="bk-rescol">
                ${head}
                <div class="bk-list b3-fady" role="list" ref=${resRef}>
                    ${shown.length ? shown.map((b) => (f2b === 'c' && b.outcome !== 'bad' && b.outcome !== 'dup' && Card
                        ? preview(b, active && active.index === b.index, () => jump(b))
                        : html`<${Result} key=${b.index} b=${b} builds=${builds} on=${active && active.index === b.index} onJump=${jump} accent=${accentFor(b.weapon)} />`))
                        : blocks.length ? html`<div class="bk-empty">Nothing matches this filter.</div>`
                        : html`<div class="bk-ghostwrap b4-ghostwrap"><div class="bk-ghostres" aria-hidden="true" inert>${f2b === 'c' && Card ? preview(exampleOf(mode), false, () => {})
                            : html`<${Result} b=${exampleOf(mode)} builds=${builds} on=${false} onJump=${() => {}} accent=${accentFor('BAL-27')} />`}</div>
                            <p class="b4-overline">${f2b === 'c' && Card ? 'Each build you type appears here as its Discord card.' : 'Each build you type appears here, the way it will stage.'}</p></div>`}
                </div>
            </div>
        </div>`;
}
