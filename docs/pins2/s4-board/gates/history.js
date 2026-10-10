// Board 3 — History. One gate: the manifest that carries every change, alert and restart.
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { fetchJson } from '../ui/httpClient.js';
import { useOverlay } from '../ui/overlay.js';
import { Manifest } from '../ui/manifest.js';
import { RIVER_COLUMNS, RIVER_FILTERS, withLevelCounts, EventDrawer, summaryOf, sourceOf, actorLabel } from '../ui/history.js';
import { B3History } from '../b3/history.js';
import { useB3 } from '../b3/state.js';
import { segOpts, H1Spacing } from './picks.js';
import { Seg, Stage, Tries, useData } from './lib.js';

const load = () => fetchJson('/api/analytics');

// The try row goes through the section's `Tries`, like every other surface's, so it sits inside the switch box — it was
// rendered inside the body and landed outside the box, full width, the only one on the board that did (2026-09-17 22:02 EDT).
function HistoryTries() {
    const filter = (next) => {
        // 2026-09-21 15:21 EDT — Board 4 mounts this gate as #c-… rather than #g-…, and every Try here found no gate and did nothing. It looks for either.
        const gate = document.getElementById('g-history') || document.getElementById('c-history');
        if (!gate) return;
        const want = next.toLowerCase();
        const btn = [...gate.querySelectorAll('.b3-fc, .chip')].find((b) => b.textContent.trim().toLowerCase().startsWith(want));
        if (btn) { btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); btn.click(); }
    };
    // ROUND 9A: "Today" is a zero-count chip on this data and zero-count chips are inert now, so the third try searches
    // instead — a name every probe row carries, which shows the filtered view: four days, one kind, one person.
    const search = (text) => {
        // The toolbar redesign moved the search into .srch; .b3-hi-q is the old field, kept so an older build of the gate still works.
        const i = document.querySelector(':is(#g-history, #c-history) :is(.srch, .b3-hi-q) input');
        if (!i) return;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, text);
        i.dispatchEvent(new Event('input', { bubbles: true }));
        i.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    return html`<${Tries} items=${[['Only alerts', () => filter('alerts')], ['Only what can be undone', () => filter('can be undone')], ['Only the probes', () => search('Realwalk')]]} />`;
}

function H1() {
    const data = useData(load);
    const p9 = useB3('p9');
    const [openEvent, setOpenEvent] = useState(null);
    const overlay = useOverlay();
    if (!data) return html`<p class="g-wait">Loading the dev database…</p>`;
    const KIND_VAR = { change: '--info', alert: '--warn', boot: '--sched' };
    const rows = (data.river || []).map((r) => ({
        ...r, id: r.changeId || r.alertId || r._id, state: 'live', topicVar: KIND_VAR[r.kind],
        summary: summaryOf(r), source: sourceOf(r), actor: actorLabel(r.actorId, data.actors), level: r.level || null,
    }));
    const total = data.riverTotal ?? rows.length;
    return html`
        <${Stage} tall=${820}>
            ${overlay.render()}
            ${p9 === 'now'
                ? html`<${Manifest} rows=${rows} columns=${RIVER_COLUMNS} searchableFields=${['summary', 'actor', 'target']}
                                    title="One history, both front doors" label="Events" filterGroups=${withLevelCounts(RIVER_FILTERS, rows)}
                                    headerRight="Alerts, changes and boots are all events — filtering one stream beats switching between four lists."
                                    emptyText="No changes, alerts or restarts have been recorded yet." rowNoun=${['event', 'events']}
                                    bulkTier=${2} onRowClick=${(row) => setOpenEvent(row)} selectedRowId=${openEvent && openEvent.id}
                                    totalRows=${total} pageCap=${100} countSuffix=" events" realm="history" />`
                : html`<${B3History} rows=${rows} actors=${data.actors} total=${total} selectedId=${openEvent && openEvent.id}
                                     onOpen=${(row) => setOpenEvent(row)} onRevert=${() => overlay.say('Board only · a reversal would apply immediately in the portal.')}
                                     hasMore=${rows.length < total} onMore=${() => overlay.say('Board only · the next hundred events would load.')} />`}
            ${openEvent ? html`<${EventDrawer} row=${openEvent} onClose=${() => setOpenEvent(null)}
                                               onRevert=${() => { setOpenEvent(null); overlay.say('Board only · a reversal would apply immediately.'); }} />` : null}
        <//>`;
}

export const HISTORY_SECTIONS = [
    { id: 'history', gid: 'H1', realm: 'history', title: 'The history manifest', sub: 'Kind, who, level, the dot, the chip and the filters.',
      pins: [51, 52, 53, 54, 55, 56, 57], Body: H1, Tries: HistoryTries,
      controls: [['Timeline', () => html`<${Seg} k="p9" options=${segOpts('p9', [['now', 'Portal today']])} label="History" />`],
                 ['Spacing', () => html`<${H1Spacing} />`]],
      notes: [
          html`<b>Kind is Broadcast’s state tab</b> — one shape, one colour per kind, carried on its left edge (pin 53), and <b>Who names the person</b> the row already had (pin 54).`,
          html`<b>The level badge is a meter</b>, four rungs filled to the severity, shown only on an alert (pin 55); <b>the square chip is gone</b>, the row’s left edge carrying the colour (pin 56).`,
          html`<b>Six filters, not two</b>: kind, level, who, realm, when and can-be-undone, each counting what it would leave standing (pin 57).`,
          html`<b>Counts sit upright</b> (pin 51), and the panel’s sentence moves behind an info button (pin 52 — Session 4 writes the words).`,
      ] },
];
