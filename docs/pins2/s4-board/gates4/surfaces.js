// BOARD 4: COLLECTIVE — the surfaces that are not a board-3 gate, each mounted ALONE (2026-09-21 14:33 EDT).
// Harkirat, on the first version: "Why does this basically have a full render of the armory realm?? … A WHOLE REALM RENDER TO
// SHOWCASE 1 BUTTON?" Board 2 presented a gate as the one surface in its own container — the manifest panel, the view bar strip —
// and that is the shape here: the build drawer on a stage, Compare in its panel, the Broadcast manifest in its panel, the Analytics
// view bar. Each takes the state the section head's switch picks, so every state the boards drew is one click away.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef, useLayoutEffect } from '../vendor/preact-hooks.mjs';
import { fetchJson } from '../ui/httpClient.js';
import { useOverlay } from '../ui/overlay.js';
import { Icon } from '../ui/icons.js';
import { Manifest } from '../ui/manifest.js';
import { Compare, LoadoutCard } from '../ui/armory.js';
import { BROADCAST_COLUMNS, broadcastFilters, accentOf, PostForm, broadcastRowLabel } from '../ui/broadcast.js';

/* global lifecycleOf */
// The lifecycle the State column draws (broadcast.logic.js publishes it as a global, as the realm reads it).
const lifecycleOfRow = (r) => (typeof lifecycleOf === 'function' ? lifecycleOf(r) : (r.expiresAt && new Date(r.expiresAt) < new Date() ? 'expired' : 'live'));
import { B3BuildDrawer } from '../b3/drawer.js';
import { Stage, PanelHead, withSec } from '../gates/lib.js';

/* global buildBroadcastEditOp */

import { B4Compare } from '../b4/compare.js';

const cache = {};
function useApi(url) {
    const [d, setD] = useState(cache[url] || null);
    useEffect(() => { if (!cache[url]) fetchJson(url).then((x) => { cache[url] = x; setD(x); }); }, [url]);
    return d;
}
const wait = html`<p class="g-wait">Loading the dev database…</p>`;

// The switch in a section's head: board 2's own segmented control, thumb and all.
export function StateSeg({ value, options, onChange, label = 'State' }) {
    const ref = useRef(null);
    const [t, setT] = useState({ w: 0, x: 0 });
    const place = () => { const on = ref.current && ref.current.querySelector('button[aria-pressed="true"]'); if (on) setT({ w: on.offsetWidth, x: on.offsetLeft }); };
    useLayoutEffect(place, [value]);
    useEffect(() => { if (document.fonts && document.fonts.ready) document.fonts.ready.then(place); }, []);
    return html`
        <div class="seg pb-seg" role="group" aria-label=${label} ref=${ref}>
            <span class="pb-thumb" style=${`width:${t.w}px;transform:translateX(${t.x}px)`}></span>
            ${options.map(([v, lab]) => html`<button type="button" key=${v} aria-pressed=${v === value ? 'true' : 'false'} onClick=${() => onChange(v)}>${lab}</button>`)}
        </div>`;
}

// ── C2 · New build — board 1 · G9 as board 3 carries it, on a stage of its own ─────────────────────────────────────
// C2-12 — the board chrome prefills the bulk list with a few scenarios so its shape can be seen, not just imagined.
// v11 (2026-09-22 13:55 EDT) — the prefills are the new format's display form (his items 26–28); 'Bulk · pasted' is Export's compact form, opened on arrival.
const B4_BULK1 = 'BAL-27 | AR | MP\nLabel: Close range\nCode: 1C2C4A8A9C\nImage: BAL-27-6\nBadges: meta, best\n- Gauge-9 Mono\n- Crown-H3 Barrel';
const B4_FEN = 'FENNEC | SMG | MP\nLabel: Run and gun\nCode: 2A4B5A8C9C\nImage: FENNEC-4\nBadges: meta, bestt\n- YKM Lightweight Short\n- No Stok';
const B4_DMZ1 = 'TYPE 19 | AR | DMZ\nLabel: Long lane\nImage: https://res.cloudinary.com/dr6dn61eh/image/upload/v1/DMZ-TYPE-19-3\nBadges: meta, best-midlong\n- Thermal Sight\n- Agile Stock\n- FMJ';
const B4_PREFILLS = { 'bulk-typing': 'FENNEC | SMG | MP\nLabel: Run and gun', 'bulk-warn': [B4_BULK1, B4_FEN].join('\n\n'), 'bulk-bad': [B4_BULK1, 'LOCUS\nLabel: Long lane\n- 40 Round Mag'].join('\n\n'), 'bulk-one': B4_BULK1,
    'bulk-many': [B4_BULK1, B4_FEN.replace('bestt', 'best').replace('No Stok', 'No Stock'), B4_DMZ1].join('\n\n'),
    'bulk-paste': 'BAL-27 | AR | MP\nClose range | 1C2C4A8A9C | BAL-27-6\nmeta, best\nGauge-9 Mono\nCrown-H3 Barrel\n\nTYPE 19 | AR | DMZ\nLong lane | | DMZ-TYPE-19-3\nmeta, best-midlong\nThermal Sight\nAgile Stock\nFMJ',
    'bulk-dup': [B4_BULK1, B4_BULK1].join('\n\n') };
export function NewBuildSurface({ session, state = 'add' }) {
    // Board 4 (2026-09-21 23:22 EDT) — board 1 is judged FILLED, so C2 has a Filled state: a real build typed in as a person would (weapon, then its code).
    useEffect(() => {
        if (state !== 'filled') return undefined;
        const w = (ms) => new Promise((r) => setTimeout(r, ms));
        const setV = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
        (async () => {
            await w(700);  // the head switch remounts the drawer; typing before that lands in the drawer being replaced
            let wi = null; for (let i = 0; i < 25 && !(wi = document.querySelector('#c-new-build #nb-w')); i++) await w(120);
            if (!wi) return; wi.focus(); setV(wi, 'BAL-27'); await w(250);
            const li = document.querySelector('#c-new-build .pb-menu li, #c-new-build .f-menu li'); if (li) li.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); await w(250);
            const code = document.querySelector('#c-new-build #nb-code'); if (code) setV(code, '1C2C4A8A9B'); await w(150); wi.blur();
        })();
        return undefined;
    }, [state]);
    const data = useApi('/api/armory');
    const overlay = useOverlay();
    const [open, setOpen] = useState(true);
    const [n, setN] = useState(0);
    useEffect(() => { setOpen(true); setN((k) => k + 1); }, [state]);
    if (!data) return wait;
    const builds = (data.builds || []).map((b) => withSec(b, true));
    const bal = builds.filter((b) => b.mode === 'MP' && b.weaponName === 'BAL-27').slice(0, 3).map((b) => String(b._id));
    const editIds = state === 'edit' ? bal : null;
    return html`
        <${Stage} tall=${900} cls="b4-stage">
            ${overlay.render()}
            ${open ? html`<${B3BuildDrawer} key=${state + n} builds=${builds} mode=${state === 'dmz' ? 'DMZ' : 'MP'} panel=${state.startsWith('bulk') ? 'bulk' : 'add'} prefill=${B4_PREFILLS[state] || ''} seed=${state === 'cards' ? 'three' : null}
                editIds=${editIds} csrfToken=${session && session.csrfToken} overlay=${overlay} Card=${LoadoutCard}
                onClose=${() => setOpen(false)} onStaged=${(m) => { setOpen(false); overlay.say(m); }} />`
            : html`<div class="b4-closed"><p>Closed. Nothing was staged.</p><button type="button" class="b3-btn2" onClick=${() => setOpen(true)}>Open it again</button></div>`}
        <//>`;
}

// ── C3 · Compare — board 1 · G10, the panel alone, in board 1's four states ─────────────────────────────────────────
export function CompareSurface({ state = 'one' }) {
    const data = useApi('/api/armory');
    // 2026-09-29 17:56 EDT (his V41 class AB): a column's edit opens that build in the build drawer, over the panel, as the New build surface mounts it; its delete
    // is the board's staged-deletion stand-in, the manifest gate's own (gates/armory.js onRemove)
    const overlay = useOverlay();
    const [editId, setEditId] = useState(null);
    const [weapons, setWeapons] = useState([]);
    const [ver, setVer] = useState(0);   // each board state opens Compare fresh, as someone arriving would: two weapons arriving together share the six
    const builds = data ? (data.builds || []).filter((b) => b.mode === 'MP').map((b) => withSec(b, true)) : [];
    const oneBuild = () => { const counts = {}; builds.forEach((b) => { counts[b.weaponName] = (counts[b.weaponName] || 0) + 1; });
        return (counts['DL Q33'] === 1 && 'DL Q33') || Object.keys(counts).find((w) => counts[w] === 1 && builds.find((b) => b.weaponName === w).category === 'SNIPER') || Object.keys(counts).find((w) => counts[w] === 1); };
    useEffect(() => {
        if (!data) return;
        setWeapons(state === 'one' ? ['BAL-27'] : state === 'two' ? ['BAL-27', 'FFAR 1'] : state === 'build' ? [oneBuild()].filter(Boolean) : []);
        setVer((v) => v + 1);
    }, [state, data]);
    if (!data) return wait;
    return html`
        <div class="b1 b4-cmp cx-host">${overlay.render()}<section class="pb-panel">
            <${B4Compare} key=${ver} builds=${builds} weapons=${weapons} onSetWeapons=${setWeapons} Card=${LoadoutCard}
                onEdit=${(b) => setEditId(String(b._id))} onDelete=${(b, n) => overlay.say(`Board only · ${b.weaponName} build ${n} would be staged for deletion.`)} />
        </section>
        ${editId ? html`<div class="cx-editlay"><${Stage} tall=${900} cls="b4-stage"><${B3BuildDrawer} key=${editId} builds=${builds} mode="MP" panel="add" editIds=${[editId]} overlay=${overlay} Card=${LoadoutCard}
            onClose=${() => setEditId(null)} onStaged=${(m) => { setEditId(null); overlay.say(m); }} /><//></div>` : null}</div>`;
}

// ── C7 · The Broadcast manifest — board 2 · G11, the panel alone; Post announcement opens board 1's G8 drawer ─────
export function BroadcastSurface({ session, state = 'saved' }) {
    const data = useApi('/api/broadcast');
    const overlay = useOverlay();
    const [post, setPost] = useState(false);   // false · true (new) · { row, again } (a row's editor)
    useEffect(() => { setPost(state === 'post'); }, [state]);
    // 2026-09-21 19:21 EDT — Harkirat, C7-5: "clicking the manifest row should open the announcement editor … clicking an `Ended` announcement
    // row should open the editor but with the intent to 'post it again'." No cell edits inline any more (broadcast.js).
    if (!data) return wait;
    let rows = data.all.map((a) => ({ ...a, id: a._id, accentHex: accentOf(a) }));
    if (state === 'staged' && rows[1]) rows = rows.map((r, i) => (i === 1 ? { ...r, state: 'staged' } : r));
    return html`
        <${Stage} tall=${post ? 920 : null} cls="b4-bare">
            ${overlay.render()}
            <div class="b4-panel">
                <${Manifest} rows=${rows} columns=${BROADCAST_COLUMNS} rowLabel=${broadcastRowLabel} searchableFields=${['text']} label="Manifest" selectable=${false}
                             searchPlaceholder="Search the text…" addLabel="+ Post announcement" filterGroups=${broadcastFilters(data.all)}
                             rowNoun=${['announcement', 'announcements']} removeLabel="Remove" emptyText="Nothing has been announced yet."
                             onRemove=${(row) => overlay.say(`Board only · removing “${String(row.text).slice(0, 40)}” would stage a deletion.`)}
                             onAdd=${() => setPost(true)} onRowClick=${(row) => setPost({ row, again: row.state !== 'staged' && lifecycleOfRow(row) === 'expired' })}
                             realm="broadcast" csrfToken=${session && session.csrfToken}
                             buildEditOp=${typeof buildBroadcastEditOp === 'function' ? buildBroadcastEditOp : undefined} />
            </div>
            ${post ? html`<${PostForm} key=${post.row ? String(post.row.id) + (post.again ? ':again' : '') : 'new'} initial=${post.row || null} again=${Boolean(post.again)} allAnnouncements=${data.all} onCancel=${() => setPost(false)}
                onSubmit=${() => { setPost(false); overlay.say('Board only · the announcement would stage.'); return true; }} />` : null}
        <//>`;
}

// ── C9 · Admin traffic — board 2 · G2, the Analytics view bar and nothing else ───────────────────────────────────────
export function AdminBar({ state = 'off' }) {
    const [on, setOn] = useState(state === 'on');
    const [view, setView] = useState('Timing');
    useEffect(() => { setOn(state === 'on'); }, [state]);
    return html`
        <div class="b4-vb">
            <${PanelHead} realm="Analytics" views=${['Health', 'Usage', 'Timing', 'Reach', 'Search']} value=${view} onSet=${setView} />
            <span class="incg"><span>Include</span>
                <button type="button" class="chip incchip" aria-pressed=${on ? 'true' : 'false'} onClick=${() => setOn(!on)}><${Icon} name="shield" />Admin traffic</button></span>
        </div>`;
}

// ── C5 · Export — board 3 · M3 in its three states (nitpick pass): the landing, the picker, and the picker with builds in the file stack.
// The board-3 gate opens on the landing and reaches the others only by clicking, so a head switch that shows them clicks for you.
export function ExportSurface({ session, state = 'landing', Body }) {
    const ref = useRef(null);
    useEffect(() => {
        if (state === 'landing') return;
        const w = (ms) => new Promise((r) => setTimeout(r, ms));
        (async () => {
            const root = () => ref.current && ref.current.closest('section');
            for (let i = 0; i < 20 && !(root() && root().querySelector('.drawer')); i++) await w(150);
            const pick = [...root().querySelectorAll('.drawer button')].find((b) => b.textContent.trim().startsWith('Pick'));
            if (pick) pick.click();
            if (state !== 'picked') return;
            await w(700);
            [...root().querySelectorAll('.drawer button')].filter((b) => /^\d$/.test(b.textContent.trim())).slice(0, 3).forEach((b) => b.click());
        })();
    }, [state]);
    return html`<div ref=${ref} class="b4-exp"><${Body} key=${state} session=${session} /></div>`;
}
