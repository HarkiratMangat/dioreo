// portal/ui/manifest.js — ESM. The Manifest: search, filter chips, sortable table, multi-select, bulk bar, and (new) an opt-in Add button + click-to-edit cell + click-to-preview row. Reused UNCHANGED by every realm (spec §8.2) — a realm supplies only `columns`/`rows`/`bulkActions`/`onAdd`/`buildEditOp`/`onRowClick`, never its own copy of this component.
//
// filterRows/sortRows/toggleSelection come from manifest.logic.js, loaded as a classic script — see track.js's header comment for why that is the real cross-runtime resolution here.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useMemo } from '../vendor/preact-hooks.mjs';
import { stageAndCommit } from './composeClient.js';

export function Manifest({ rows, columns, searchableFields, bulkActions = [], stateOf = (r) => r.state, onAdd, realm, buildEditOp, csrfToken, onEditError, onRowClick, selectedRowId }) {
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ column: null, direction: 'asc' });
    const [selected, setSelected] = useState(new Set());
    const [editingCell, setEditingCell] = useState(null); // {rowId, columnKey} | null
    const [editValue, setEditValue] = useState('');

    const visible = useMemo(
        () => sortRows(filterRows(rows, { query, searchableFields, filters }), sort),
        [rows, query, filters, sort]
    );

    async function commitEdit(row, columnKey) {
        const op = buildEditOp(row, columnKey, editValue);
        setEditingCell(null);
        const result = await stageAndCommit(realm, [op], csrfToken);
        if (!result.ok && onEditError) onEditError(result.reason || 'Edit failed.');
    }

    return html`
        <div class="panel" id="manifest">
            <div class="mtools">
                <span class="srch"><label class="sr-only" for="manifest-search">Search</label><input id="manifest-search" value=${query} placeholder="Search…" onInput=${(e) => setQuery(e.target.value)} /></span>
                <span class="rt">${visible.length} of ${rows.length} shown${selected.size ? ` · ${selected.size} selected` : ''}</span>
                ${onAdd ? html`<button class="accent-fill" onClick=${onAdd}>+ Add</button>` : null}
            </div>
            <table>
                <thead><tr>
                    <th style="width:34px"></th>
                    ${columns.map(c => html`<th onClick=${() => setSort({ column: c.key, direction: sort.column === c.key && sort.direction === 'asc' ? 'desc' : 'asc' })}>${c.label}</th>`)}
                </tr></thead>
                <tbody>
                    ${visible.map(row => html`
                        <tr class=${(selected.has(row.id) ? 'sel' : '') + (selectedRowId === row.id ? ' preview-sel' : '')}
                            onClick=${onRowClick ? () => onRowClick(row) : null} style=${onRowClick ? 'cursor:pointer' : ''}>
                            <td onClick=${(e) => e.stopPropagation()}><label class="sr-only" for=${`sel-${row.id}`}>Select ${row[columns[0].key]}</label><input id=${`sel-${row.id}`} type="checkbox" checked=${selected.has(row.id)} onChange=${() => setSelected(toggleSelection(selected, row.id))} /></td>
                            ${columns.map(c => {
                                const isEditing = editingCell && editingCell.rowId === row.id && editingCell.columnKey === c.key;
                                if (isEditing) {
                                    return html`<td key=${c.key} onClick=${(e) => e.stopPropagation()}>
                                        <label class="sr-only" for=${`edit-${row.id}-${c.key}`}>Edit ${c.label}</label>
                                        <input id=${`edit-${row.id}-${c.key}`} value=${editValue} autoFocus
                                               onInput=${(e) => setEditValue(e.target.value)}
                                               onKeyDown=${(e) => { if (e.key === 'Enter') commitEdit(row, c.key); if (e.key === 'Escape') setEditingCell(null); }}
                                               onBlur=${() => setEditingCell(null)} />
                                    </td>`;
                                }
                                return html`
                                    <td class=${c.key === columns[0].key ? 'n' : c.dataKind === 'date' ? 'd' : ''}
                                        onClick=${c.editable ? (e) => { e.stopPropagation(); setEditingCell({ rowId: row.id, columnKey: c.key }); setEditValue(String(row[c.key] ?? '')); } : null}
                                        style=${c.editable ? 'cursor:text' : ''}>
                                        ${c.key === columns[0].key ? html`<span class="dot" style=${`--topic-accent:var(${row.topicVar || '--ink3'})`}></span>` : null}
                                        ${c.render ? c.render(row) : (c.key === 'state'
                                            ? html`<span class=${'stt ' + (stateOf(row) === 'live' ? 'live' : stateOf(row) === 'staged' ? 'stag' : 'conf')}>${stateOf(row).toUpperCase()}</span>`
                                            : row[c.key])}
                                    </td>
                                `;
                            })}
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
