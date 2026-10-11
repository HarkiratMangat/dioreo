// Board 3 — the pieces every gate is built from: the gate frame board 1 and 2 use, the stage the element sits on, the
// switch in the gate head, and the small helpers that pick which builds a stage should show.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { setB3, useB3 } from '../b3/state.js';
import { Decide, GateNote } from './picks.js';

// The switch in a gate's head. The portal's own .seg, so it is the control the portal draws, not a board invention.
// A CHARACTER COUNT, ONE CHIP IN EVERY PLACE THAT COUNTS (2026-09-19 11:01 EDT). His note: the Export file's chip said "3,951 / 4,000 characters"
// while the Broadcast card's said "845 characters" — "standardize the better version in both places". The better one is the short
// one: the count and the word. A limit, where there is one, is drawn as the chip's own fill line and named in its tooltip, so the
// words never carry a denominator; near the limit the chip turns warn.
// 2026-09-26 20:01 EDT (his /impeccable harden: "what happens if the announcement is past the 4000 character limit? … how do the chip colors/appearance behave?"):
// the family had near (warn) and never PAST — past the cap it stayed warn. Past the cap it is `over`, in the board's danger ink, and its tooltip
// says by how much; the form that owns the cap says what it blocks.
export function CharCount({ n, cap = 0, warnAt = 0, line = false }) {
    const over = cap && n > cap;
    const warn = !over && warnAt && n >= warnAt;
    const pct = cap ? Math.min(100, Math.round((n / cap) * 100)) : 0;
    // the fill line is opt-in: the Export file draws its fill on its own header seam instead
    return html`<span class=${'g-fact b3-cc' + (over ? ' over' : warn ? ' warn' : '') + (cap && line ? ' capped' : '')} style=${cap && line ? `--f:${pct}%` : null}
        title=${cap ? (over ? `${(n - cap).toLocaleString()} over the ${cap.toLocaleString()}-character limit` : `${n.toLocaleString()} of the ${cap.toLocaleString()} characters one paste can carry`) : null}><${Icon} name="text" /><span class="b3-nw"><b>${n.toLocaleString()}</b>characters</span></span>`;
}

export function Seg({ k, options, label }) {
    const v = useB3(k);
    return html`
        <span class="seg" role="tablist" aria-label=${label}>
            ${options.map(([val, text]) => html`
                <button type="button" role="tab" key=${val} aria-selected=${v === val ? 'true' : 'false'}
                        onClick=${() => setB3(k, val)}>${text}</button>`)}
        </span>`;
}

// A stage. `tall` fixes its height so a drawer, a popover or the selection bar — all of which are position:fixed in the
// portal — land inside the stage instead of the window: the transform in gates.css makes the stage their containing block.
export function Stage({ tall = null, pad = false, scroll = false, sticky = false, children, cls = '' }) {
    return html`
        <div class=${'pb-stage g-stage' + (tall ? ' g-fixed' : '') + (pad ? ' g-pad' : '') + (scroll ? ' g-scroll' : '') + (sticky ? ' g-sticky' : '') + (cls ? ' ' + cls : '')}
             style=${tall ? `--stage-h:${tall}px` : null}>
            ${children}
        </div>`;
}

// A row of buttons that set the stage up to look at something — the equivalent of board 2's "try" buttons.
export function Tries({ items }) {
    if (!items || !items.length) return null;
    return html`
        <div class="g-tries">
            <span>Try</span>
            ${items.map(([label, run]) => html`
                <button type="button" key=${label} onClick=${run}><${Icon} name="mouse-pointer-click" />${label}</button>`)}
        </div>`;
}

export const Controls = ({ items, tries }) => (items && items.length ? html`
    <div class="g-ctls">
        ${items.map(([label, node]) => html`
            <span class="g-ctl" key=${label}><span class="g-ctl-l">${label}</span>${node()}</span>`)}
        ${tries ? html`<div class="g-ctl-tries">${tries}</div>` : null}
    </div>` : null);

const Pins = ({ list }) => (list && list.length ? html`
    <p class="g-pins"><span>Pins</span>${[...list].sort((a, b) => Number(a) - Number(b)).map((p) => html`<b key=${p}>${p}</b>`)}</p>` : null);
export const Hex = ({ v }) => html`<code class="g-hex" style=${`--sw:${v}`}>${v}</code>`;
const Notes = ({ list }) => (list && list.length ? html`
    <ul class="pb-new">${list.map((n, i) => html`<li key=${i}>${n}</li>`)}</ul>` : null);
const Picks = ({ gate }) => html`<${Decide} gate=${gate} />`;

// One section per SURFACE. Its stage sits once at the top — sticky, so it stays with you — and every topic that
// surface carries reads underneath it with its own switch, its own notes and its own picks.
export function Gate({ id, gid, realm, title, sub, pins, controls = [], tries = null, notes = [], children }) {
    return html`
        <section class="pb-gate pb-realm app g-gate" id=${`g-${id}`} data-realm=${realm}>
            <div class="pb-head">
                <span class="pb-gid">${gid}</span>
                <div><h2>${title}</h2><p>${sub}</p></div>
            </div>
            <${Pins} list=${pins} />
            <${Controls} items=${controls} tries=${tries} />
            ${children}
            <${Notes} list=${notes} />
            <${Picks} gate=${id} />
            <${GateNote} gate=${id} />
        </section>`;
}

// ── data helpers. Every stage shows real dev builds; these choose which ones so a gate stays about one thing.
export const inMode = (builds, mode = 'MP') => builds.filter((b) => b.mode === mode);

// Pin 6 is settled, so the fixed state carries it in the DATA as well as the token: every chip, weapon bar and row
// accent for Secondaries is drawn from b.accent, which the API still answers with the old #023047.
export const SEC = '#3F6E8E';
export const withSec = (b, on) => (on && b.category === 'SECONDARIES' ? { ...b, accent: SEC } : b);

// One weapon per category, so a stage shows the real chip row and the real wrap behaviour rather than a subset.
// The manifest stage is the specimen every design on this board is judged against, so its weapons have to carry the
// EDGE CASES, not just one per category. His note, 2026-09-16 13:59 EDT: "please reselect the weapons shown within this
// manifest mockup because they don't present the full variety of edge cases that may occur. Keep the pp19 bizon,
// locus, machine pistol, jak-12 ... I want at least 1 of each category, and presenting at meta, best, top 3/top 5, and
// toxic badge, and presenting various problems."
// So: his four are pinned, then a category is filled by whichever weapon ADDS something the set does not have yet --
// a badge nobody carries, a problem nobody has -- and only falls back to "most complete build" when nothing is missing.
const KEEP = ['PP19 BIZON', 'LOCUS', 'MACHINE PISTOL', 'JAK-12'];
export function oneWeaponPerCategory(builds, mode = 'MP') {
    const rows = inMode(builds, mode);
    const order = typeof CATEGORY_CHIP_ORDER !== 'undefined' ? CATEGORY_CHIP_ORDER : [];
    const cats = [...new Set(rows.map((b) => b.category))];
    const sorted = order.length ? order.filter((c) => cats.includes(c)) : cats;
    // What a weapon brings: its badges, and the kinds of problem across its builds.
    const marks = (name) => {
        const mine = rows.filter((b) => b.weaponName === name);
        const out = new Set();
        for (const b of mine) {
            if (b.meta) out.add('meta');
            if (b.toxic) out.add('toxic');
            if (b.categoryRank === 1) out.add('best');
            else if (b.categoryRank && b.categoryRank <= 3) out.add('top3');
            else if (b.categoryRank && b.categoryRank <= 5) out.add('top5');
            if (!b.shareCode) out.add('no-code');
            if (!b.imageKey) out.add('no-image');
            if ((b.attachments || []).length <= 2) out.add('thin');
        }
        return out;
    };
    const have = new Set();
    const pick = [];
    for (const name of KEEP) { if (rows.some((b) => b.weaponName === name)) { pick.push(name); marks(name).forEach((m) => have.add(m)); } }
    for (const c of sorted) {
        const list = [...new Set(rows.filter((b) => b.category === c).map((b) => b.weaponName))];
        if (list.some((nm) => pick.includes(nm))) continue;
        let best = null;
        let bestNew = -1;
        for (const nm of list) {
            const adds = [...marks(nm)].filter((m) => !have.has(m)).length;
            const full = rows.filter((b) => b.weaponName === nm && b.shareCode && (b.attachments || []).length >= 5).length;
            const score = adds * 10 + full;
            if (score > bestNew) { bestNew = score; best = nm; }
        }
        if (best) { pick.push(best); marks(best).forEach((m) => have.add(m)); }
    }
    return pick;
}

export function weaponsWith(builds, test, n = 4) {
    const names = [];
    for (const b of inMode(builds)) {
        if (names.includes(b.weaponName) || !test(b)) continue;
        names.push(b.weaponName);
        if (names.length >= n) break;
    }
    return names;
}

export const rowsFor = (builds, names, mode = 'MP') => builds
    .filter((b) => b.mode === mode && (!names || names.includes(b.weaponName)))
    .map((b) => ({ ...b, id: b._id, topicVar: null, accentHex: b.accent }));

export const idsOf = (builds, weapon, ns = null, mode = 'MP') => builds
    .filter((b) => b.mode === mode && b.weaponName === weapon)
    .sort((a, b) => String(a.buildName).localeCompare(String(b.buildName), undefined, { numeric: true }))
    .filter((_, i) => !ns || ns.includes(i + 1))
    .map((b) => String(b._id));

// A signal object for the Manifest's selectSignal / filterSignal props: a new seq makes it apply again.
export function useSignal() {
    const [sig, setSig] = useState(null);
    return [sig, (ids) => setSig({ ids, seq: Date.now() })];
}

// The portal's view panel head — the bar a realm's views and its meta line sit in (shell.js draws this around every realm).
// `rightView` lifts one view OUT of the segmented control and puts it at the right with its status inside the
// button — his note, 2026-09-16 12:39 EDT: "i had asked for the repair button to be split out of the toggles and be on the
// right side", and "redesign the entire pill to tastefully integrate the status system within its design".
// ROUND 10A (2026-09-20 11:17 EDT): "i asked for icons on all toggle switcher rails, yet these don't have any. This is a
// portal wide thing. you need to add icons that match each toggle." The manifest header's own View toggle has
// carried one since 2026-09-16; every OTHER rail on the board - Armory's Tier board / Compare, Broadcast's
// Delivery queue / Airtime - went without. The icon names what the view SHOWS, never the realm it sits in.
const VIEW_ICON = {
    'Tier board': 'layout-grid', Compare: 'columns-3', Repairs: 'wrench', Coverage: 'shield-check',
    'Delivery queue': 'list', Airtime: 'clock', 'By weapon': 'layers', 'One table': 'table',
    Rack: 'layout-grid', Manifest: 'list-checks', Board: 'layout-grid',
};

export function PanelHead({ realm, views = null, value = null, onSet = null, counts = null, meta = null, cls = '', rightView = null }) {
    return html`
        <div class=${'ph' + (cls ? ' ' + cls : '')}>
            <span class="t">${realm}</span>
            ${views && views.length > 1 ? html`
                <div class="seg" role="tablist" aria-label="View">
                    ${views.map((v) => html`
                        <button type="button" role="tab" key=${v} aria-selected=${v === value ? 'true' : 'false'} onClick=${() => onSet && onSet(v)}>
                            ${VIEW_ICON[v] ? html`<${Icon} name=${VIEW_ICON[v]} />` : null}${v}${counts && counts[v] != null ? (typeof counts[v] === 'object'
                                ? html`${' '}<em class=${'b3-segst ' + counts[v].tone}><${Icon} name=${counts[v].tone === 'ok' ? 'check' : 'triangle-alert'} />${counts[v].text}</em>`
                                : html`${' '}<em class="segn">${counts[v]}</em>`) : null}
                        </button>`)}
                </div>` : null}
            ${meta ? html`<span class="sp">${meta}</span>` : null}
            ${rightView ? (() => { const st = counts && counts[rightView];
                const tone = st && typeof st === 'object' ? st.tone : null;
                return html`
                <button type="button" class=${'b3-rv' + (rightView === value ? ' on' : '') + (tone ? ' ' + tone : '')}
                        aria-pressed=${rightView === value ? 'true' : 'false'} onClick=${() => onSet && onSet(rightView)}>
                    ${st && typeof st === 'object' && tone === 'warn'
                        ? html`<span class="b3-rv-n">${String(st.text).replace(/[^0-9]/g, '') || '!'}</span>`
                        : html`<span class="b3-rv-ok"><${Icon} name="shield-check" /></span>`}
                    <span class="b3-nw"><span class="b3-rv-w">${rightView}</span>
                    ${st && typeof st === 'object' ? html`<span class="b3-rv-s">${tone === 'warn' ? 'need work' : 'all pass'}</span>` : null}</span>
                </button>`; })() : null}
        </div>`;
}

// Data loading. Every slice asks the captured dev answers for what it needs; the mock answers on the next tick.
export function useData(load, deps = []) {
    const [data, setData] = useState(null);
    useEffect(() => { let live = true; load().then((d) => { if (live) setData(d); }); return () => { live = false; }; }, deps);
    return data;
}
