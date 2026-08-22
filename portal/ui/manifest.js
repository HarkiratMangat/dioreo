// portal/ui/manifest.js — ESM. The Manifest: search, filter chips, sortable table, multi-select, bulk bar. Reused UNCHANGED by every realm (spec §8.2) — a realm supplies only `columns`/`rows`/ `bulkActions`, never its own copy of this component.
//
// filterRows/sortRows/toggleSelection come from manifest.logic.js, loaded as a classic script — see track.js's header comment for why that is the real cross-runtime resolution here.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useMemo } from '../vendor/preact-hooks.mjs';

export function Manifest({ rows, columns, searchableFields, bulkActions = [], stateOf = (r) => r.state }) {
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ column: null, direction: 'asc' });
    const [selected, setSelected] = useState(new Set());

    const visible = useMemo(
        () => sortRows(filterRows(rows, { query, searchableFields, filters }), sort),
        [rows, query, filters, sort]
    );

    return html`
        <div class="panel" id="manifest">
            <div class="mtools">
                <span class="srch"><input value=${query} placeholder="Search…" onInput=${(e) => setQuery(e.target.value)} /></span>
                <span class="rt">${visible.length} of ${rows.length} shown${selected.size ? ` · ${selected.size} selected` : ''}</span>
            </div>
            <table>
                <thead><tr>
                    <th style="width:34px"></th>
                    ${columns.map(c => html`<th onClick=${() => setSort({ column: c.key, direction: sort.column === c.key && sort.direction === 'asc' ? 'desc' : 'asc' })}>${c.label}</th>`)}
                </tr></thead>
                <tbody>
                    ${visible.map(row => html`
                        <tr class=${selected.has(row.id) ? 'sel' : ''}>
                            <td><input type="checkbox" checked=${selected.has(row.id)} onChange=${() => setSelected(toggleSelection(selected, row.id))} /></td>
                            ${columns.map(c => html`
                                <td class=${c.key === columns[0].key ? 'n' : c.dataKind === 'date' ? 'd' : ''}>
                                    ${c.key === columns[0].key ? html`<span class="dot" style=${`--topic-accent:var(${row.topicVar || '--ink3'})`}></span>` : null}
                                    ${c.render ? c.render(row) : (c.key === 'state'
                                        ? html`<span class=${'stt ' + (stateOf(row) === 'live' ? 'live' : stateOf(row) === 'staged' ? 'stag' : 'conf')}>${stateOf(row).toUpperCase()}</span>`
                                        : row[c.key])}
                                </td>
                            `)}
                        </tr>
                    `)}
                </tbody>
            </table>
            ${selected.size ? html`
                <div class="bulk">
                    <span>${selected.size} selected</span>
                    ${bulkActions.map(a => html`<button class=${a.danger ? 'danger' : ''} onClick=${() => a.onClick([...selected])}>${a.label}</button>`)}
                </div>
            ` : null}
        </div>
    `;
}
