// Board 3 version 2 — BOARD ONLY. The dock: which proposal you are looking at, its options, what changed from your notes, and a few buttons that set the page up to try it.
import { render } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { b3, setB3, useB3, resetB3, hooks } from './state.js';
import { __board } from '../ui/httpClient.js';

const goRealm = (realm) => { if ((location.hash || '').replace('#/', '') !== realm) location.hash = `#/${realm}`; };
const later = (fn, ms = 450) => setTimeout(fn, ms);
const scrollTo = (sel, block = 'center') => { const el = document.querySelector(sel); if (el) el.scrollIntoView({ behavior: 'smooth', block }); return el; };
const pulse = (sel) => { const el = document.querySelector(sel); if (!el) return; el.classList.remove('b3-pulse'); void el.offsetWidth; el.classList.add('b3-pulse'); };
const idsOf = (weapon, ns) => __board.builds().filter((b) => b.mode === 'MP' && b.weaponName === weapon).sort((a, b) => String(a._id).localeCompare(String(b._id))).filter((_, i) => !ns || ns.includes(i + 1)).map((b) => String(b._id));
const select = (ids) => { if (hooks.armorySelect) hooks.armorySelect(ids); };

const NOW_NEW = [['now', 'Now'], ['new', 'Built']];
const NOW_AB = [['now', 'Now'], ['a', 'A'], ['b', 'B']];

export const SECTIONS = [
    { id: 'p1', realm: 'armory', title: 'Badge labels', vars: [{ k: 'p1', opts: [['now', 'Now'], ['a', 'A · Medals'], ['b', 'B · Ladder'], ['c', 'C · Weight']] }],
      notes: ['Meta, tier and tag each take their own colour', 'Tier shows its rank: Best, then Top 3, 4, 5', 'Best names its category'],
      tries: [['Scroll to LOCUS', () => { scrollTo('.wg[data-w="LOCUS"]'); pulse('.wg[data-w="LOCUS"] .wg-h'); }], ['Scroll to CX-9', () => { scrollTo('.wg[data-w="CX-9"]'); pulse('.wg[data-w="CX-9"] .wg-h'); }]] },
    { id: 'p2', realm: 'armory', title: 'Attachment tags', vars: [{ k: 'p2pal', opts: [['now', 'Now'], ['named', 'Named hues'], ['parts', 'Gun parts']] }, { k: 'p2sty', opts: [['wash', 'Wash'], ['washc', 'Wash, coloured text'], ['bar', 'Bar'], ['neutral', 'Neutral, coloured text']] }, { k: 'p2lab', opts: [['off', 'None'], ['colon', 'Colon'], ['key', 'Key'], ['cap', 'Tab']] }],
      notes: ['Two palettes picked to be named at a glance: one colour, one slot', 'Four tag styles, including a neutral tag with coloured text', 'No colour-blind scoring, as asked'],
      tries: [['Show the slot columns', () => hooks.armoryAttView && hooks.armoryAttView('slot')], ['Back to the list', () => hooks.armoryAttView && hooks.armoryAttView('list')]] },
    { id: 'p3', realm: 'armory', title: 'Build problems', vars: [{ k: 'p3', opts: NOW_NEW }],
      notes: ['Direction A, as a working popover', 'Open build sits in the card header', 'Numbers are drawn: slot pips, code ≠ build', 'Hazard tape along the top; the tail is part of the border', 'Opens upward near the bottom of the window'],
      tries: [['Open PHARO', () => { const w = scrollTo('.wg[data-w="PHARO"]'); later(() => { const c = w && w.querySelector('.b3-fchip'); if (c) c.click(); }, 500); }],
              ['Open KILO 141', () => { const w = scrollTo('.wg[data-w="KILO 141"]'); later(() => { const c = w && w.querySelector('.b3-fchip'); if (c) c.click(); }, 500); }],
              ['Open .50 GS', () => { const w = scrollTo('.wg[data-w=".50 GS"]'); later(() => { const c = w && w.querySelector('.b3-fchip'); if (c) c.click(); }, 500); }]] },
    { id: 'p4', realm: 'armory', title: 'Checkbox and select all', vars: [{ k: 'p4', opts: [['now', 'Now'], ['a', 'A · Drawn check'], ['b', 'B · Soft well']] }],
      notes: ['Every Armory checkbox uses the chosen box', 'A weapon shows Some while part of it is picked', 'Select all sits in the column head and says its count'],
      tries: [['Pick CX-9 Build 1', () => { select(idsOf('CX-9', [1])); scrollTo('.wg[data-w="CX-9"]'); }], ['Scroll to the column head', () => scrollTo('.wg-heads', 'start')]] },
    { id: 'p5', realm: 'armory', title: 'Selection bar', vars: [{ k: 'p5', opts: NOW_NEW }, { k: 'p5bg', opts: [['solid', 'Solid'], ['mesh', 'Mesh']] }],
      notes: ['A and B as one bar: chips, then the list when opened', '"Builds 1–3", never ×3', 'Set badges is gone; Edit builds opens one build, or bulk edit for several', 'The undo mark is gone; Stage deletion explains itself on hover', 'Clear has an edge'],
      tries: [['Pick 1 build', () => select(idsOf('CX-9', [1]))], ['Pick 6 across 3 weapons', () => select([...idsOf('CX-9', [1, 2, 3]), ...idsOf('LOCUS', [1, 2]), ...idsOf('PHARO', [1])])],
              ['Pick 14 across 6 weapons', () => select([...idsOf('CX-9'), ...idsOf('LOCUS'), ...idsOf('PHARO'), ...idsOf('KILO 141'), ...idsOf('PP19 BIZON'), ...idsOf('BAL-27')].slice(0, 14))]] },
    { id: 'p6', realm: 'armory', title: 'Repairs', vars: [{ k: 'p6', opts: NOW_NEW }, { k: 'p6day', opts: [['real', 'Today’s data'], ['clean', 'A clean day']] }],
      notes: ['The worklist lives in the Repairs panel, under the view switch', 'The Repairs tab carries the status', 'Filter by problem; open a row to see the build; Fix opens its drawer'],
      tries: [['Open Repairs', () => { hooks.armoryView && hooks.armoryView('Repairs'); later(() => scrollTo('#b3-repairs', 'start'), 200); }]] },
    { id: 'p7', realm: 'armory', title: 'Command search', vars: [{ k: 'p7', opts: NOW_NEW }],
      notes: ['Results grouped Do, Find, Go', 'An action, a badge and a weapon compose one step', 'Enter opens the drawer filled in; nothing stages without it'],
      tries: [['Type “meta cx9”', () => hooks.paletteType && hooks.paletteType('meta cx9')], ['Type “badge”', () => hooks.paletteType && hooks.paletteType('badge')], ['Type “repairs”', () => hooks.paletteType && hooks.paletteType('repairs')]] },
    { id: 'p8', realm: 'broadcast', title: 'Heads up', vars: [{ k: 'p8', opts: NOW_NEW }],
      notes: ['No banner above the page; the warning lives in the queue panel', 'The card’s bar runs off its end and says it never stops', 'Set end date is a quiet control with a date picker, no orange on orange', 'Staging an end clears the warning'],
      tries: [['Scroll to the card', () => { scrollTo('.qcard'); pulse('.qcard'); }], ['Open the date picker', () => { const b = document.querySelector('.b3-endbtn'); if (b) { b.scrollIntoView({ block: 'center' }); later(() => b.click(), 300); } }]] },
    { id: 'p9', realm: 'history', title: 'History', vars: [{ k: 'p9', opts: NOW_NEW }],
      notes: ['Timeline: the rows under their day', 'The Level filter is back, with its meters', 'Kind, Level, Who, Realm, When and Can be undone all filter', 'Rows open the event drawer; the undo button reverses'],
      tries: [['Only alerts', () => hooks.historyFilter && hooks.historyFilter({ kind: 'alert' })], ['Only what can be undone', () => hooks.historyFilter && hooks.historyFilter({ undo: true })], ['Clear filters', () => hooks.historyFilter && hooks.historyFilter({})]] },
    { id: 'g9', realm: 'armory', title: 'New build drawer', vars: [{ k: 'g9', opts: NOW_NEW }],
      notes: ['Board 1’s drawer, built: one bar for MP/DMZ and Add build · Bulk create', 'The code fills the attachments it can', 'Bulk: numbered blocks, a tally, one result per block', 'Edit builds reuses it for several builds'],
      tries: [['Open New build', () => hooks.armoryNew && hooks.armoryNew('add')], ['Open Bulk create', () => hooks.armoryNew && hooks.armoryNew('bulk')], ['Edit CX-9’s 3 builds', () => hooks.armoryBulkEdit && hooks.armoryBulkEdit(idsOf('CX-9'))]] },
    { id: 'e1', realm: 'armory', title: 'Buttons', vars: [{ k: 'e1', opts: NOW_AB }], notes: ['A: create is filled in the staged yellow · B: create is quiet, with a lit plus', 'On New build, Add build, Expand all and Collapse all, and the drawer footers', 'Hover, press and Tab through them: every state is real'], tries: [['Scroll to New build', () => { scrollTo('.mh-new'); pulse('.mh-new'); }], ['Open New build', () => hooks.armoryNew && hooks.armoryNew('add')]] },
    { id: 'e2', realm: 'armory', title: 'Icon buttons', vars: [{ k: 'e2', opts: NOW_AB }], notes: ['A: colour by intent, only the fold button widens to its word', 'B: every row icon widens to its word on hover', 'Both: a pointer on the code field; the card loses its calendar button and Edit carries its word'], tries: [['Scroll to CX-9', () => scrollTo('.wg[data-w="CX-9"]')], ['Broadcast card', () => { location.hash = '#/broadcast'; later(() => scrollTo('.qcard'), 700); }]] },
    { id: 'e3', realm: 'armory', title: 'Corner radius', vars: [{ k: 'e3', opts: NOW_AB }], notes: ['A: tag 4 · control 8 · card 12 · panel 16 · overlay 20', 'B: tag 6 · control 10 · card 14 · panel 20 · overlay 24', 'Applied to the whole portal; pills stay round'], tries: [['Open a problem card', () => { const w = scrollTo('.wg[data-w="PHARO"]'); later(() => { const c = w && w.querySelector('.b3-fchip'); if (c) c.click(); }, 500); }]] },
    { id: 'e4', realm: 'broadcast', title: 'Labels and headings', vars: [{ k: 'e4', opts: NOW_AB }], notes: ['A: sentence case; capitals only for the panel eyebrow', 'B: one mono capital role; sub-heads carry a realm tick', 'Group labels, column heads and sub-sections, on Broadcast and Armory'], tries: [['Scroll to the manifest', () => scrollTo('#manifest', 'start')]] },
    { id: 'e5', realm: 'broadcast', title: 'Pills', vars: [{ k: 'e5', opts: NOW_AB }], notes: ['A: outlined, mono, an icon each', 'B: the state tab’s shape'], tries: [['Scroll to the card', () => { scrollTo('.qcard'); pulse('.qcard'); }]] },
    { id: 'e6', realm: 'armory', title: 'Small text', vars: [{ k: 'e6', opts: NOW_AB }], notes: ['A: each fact in a soft chip · B: facts on one faint rail', 'View counts, the rack line, the export line, the slot limit and the character count', 'History’s explanation moves behind an info button', 'Today’s words kept; Session 4 rewrites them'], tries: [['History’s info button', () => { location.hash = '#/history'; }], ['Broadcast', () => { location.hash = '#/broadcast'; }]] },
];

const VAR_KEYS = [...new Set(SECTIONS.flatMap((s) => s.vars.map((v) => v.k)))];

function Dock() {
    const section = useB3('section');
    VAR_KEYS.forEach((k) => useB3(k));
    const [open, setOpen] = useState(() => { try { return !localStorage.getItem('pins2-board-3-v2-seen'); } catch (e) { return true; } });
    const i = Math.max(0, SECTIONS.findIndex((s) => s.id === section));
    const s = SECTIONS[i];
    const go = (id) => {
        const next = SECTIONS.find((x) => x.id === id);
        setB3('section', id);
        goRealm(next.realm);
    };
    useEffect(() => { try { localStorage.setItem('pins2-board-3-v2-seen', '1'); } catch (e) { /* ignore */ } }, []);
    useEffect(() => {
        const onKey = (e) => {
            const t = e.target;
            if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
            if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); go(SECTIONS[(i + 1) % SECTIONS.length].id); }
            if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); go(SECTIONS[(i - 1 + SECTIONS.length) % SECTIONS.length].id); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [i]);

    const group = (label, pick) => html`
        <h6>${label}</h6>
        ${SECTIONS.filter(pick).map((x) => html`
            <button type="button" key=${x.id} class=${'b3dock-item' + (x.id === s.id ? ' on' : '')} onClick=${() => go(x.id)}>
                <span class="id" data-k=${x.id[0]}>${x.id.toUpperCase()}</span><span class="t">${x.title}</span><span class="r">${x.realm}</span>
            </button>`)}`;

    return html`
        <div class=${'b3dock' + (open ? ' open' : '')}>
            ${open ? html`
                <div class="b3dock-panel" role="dialog" aria-label="Board 3">
                    <header>
                        <span class="b3dock-mark">B3</span>
                        <span class="b3dock-ttl"><b>Board 3</b><small>version 2 · the portal’s own code, on dev data</small></span>
                        <button type="button" class="b3-x" aria-label="Close the board list" onClick=${() => setOpen(false)}><${Icon} name="x" /></button>
                    </header>
                    <div class="b3dock-body">
                        <nav class="b3dock-list">
                            ${group('Your pins', (x) => x.id[0] === 'p' || x.id === 'g9')}
                            ${group('Shared elements', (x) => x.id[0] === 'e')}
                        </nav>
                        <section class="b3dock-cur">
                            <p class="b3dock-eyebrow"><span class="id" data-k=${s.id[0]}>${s.id.toUpperCase()}</span>${s.realm}</p>
                            <h5>${s.title}</h5>
                            <ul class="b3dock-notes">${s.notes.map((n) => html`<li key=${n}>${n}</li>`)}</ul>
                            ${s.tries.length ? html`
                                <div class="b3dock-tries"><span>Try</span>
                                    ${s.tries.map(([label, run]) => html`<button type="button" key=${label} onClick=${() => { goRealm(s.realm); later(run, (location.hash || '').includes(s.realm) ? 30 : 700); }}><${Icon} name="mouse-pointer-click" />${label}</button>`)}
                                </div>` : null}
                        </section>
                    </div>
                    <footer>
                        <span><${Icon} name="info" />Staging stays inside this page. Nothing reaches the portal.</span>
                        <button type="button" onClick=${() => { resetB3(); location.reload(); }}><${Icon} name="rotate-ccw" />Reset</button>
                    </footer>
                </div>` : null}
            <div class="b3dock-bar">
                <button type="button" class="b3dock-menu" aria-expanded=${open ? 'true' : 'false'} aria-label="All sections" onClick=${() => setOpen(!open)}><${Icon} name="layout-grid" /></button>
                <button type="button" class="b3dock-step" aria-label="Previous section" onClick=${() => go(SECTIONS[(i - 1 + SECTIONS.length) % SECTIONS.length].id)}><${Icon} name="chevron-left" /></button>
                <button type="button" class="b3dock-now" onClick=${() => setOpen(!open)}><span class="id" data-k=${s.id[0]}>${s.id.toUpperCase()}</span><b>${s.title}</b></button>
                <button type="button" class="b3dock-step" aria-label="Next section" onClick=${() => go(SECTIONS[(i + 1) % SECTIONS.length].id)}><${Icon} name="chevron-right" /></button>
                ${s.vars.map((v) => html`
                    <span class="b3dock-vr" aria-hidden="true" key=${'vr' + v.k}></span>
                    <span class="b3dock-seg" role="radiogroup" aria-label=${`${s.title} option`} key=${v.k}>
                        ${v.opts.map(([val, label]) => html`<button type="button" role="radio" key=${val} aria-checked=${b3(v.k) === val ? 'true' : 'false'} onClick=${() => setB3(v.k, val)}>${label}</button>`)}
                    </span>`)}
            </div>
        </div>`;
}

export function mountDock() {
    const host = document.createElement('div');
    host.id = 'b3dock-host';
    document.body.appendChild(host);
    render(html`<${Dock} />`, host);
}
