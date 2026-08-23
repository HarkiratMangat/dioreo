// portal/ui/manifest.js — ESM. The Manifest: search, filter chips, sortable table, multi-select, bulk bar, and an opt-in Add button + click-to-edit cell + click-to-preview row. Reused UNCHANGED by every realm (spec §8.2) — a realm supplies only `columns`/`rows`/`bulkActions`/`onAdd`/`buildEditOp`/`onRowClick`/`filterGroups`, never its own copy of this component.
//
// filterRows/sortRows/toggleSelection come from manifest.logic.js, loaded as a classic script — see track.js's header comment for why that is the real cross-runtime resolution here.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useMemo } from '../vendor/preact-hooks.mjs';
import { stageAndCommit } from './composeClient.js';

// `filterGroups` is [{key, label, options:[{value,label}]}]. One CHIP PER GROUP that cycles through its own options, not one chip per option: 03-three-surfaces.html renders exactly two chips ("Type: all ×", "State: staged ×") for a table with five types and four states, so the chip shows the current value rather than enumerating every possible one. `all` is always the first option and is what the × returns to.
function FilterChips({ groups, filters, onChange }) {
    return groups.map((g) => {
        const options = [{ value: 'all', label: 'all' }, ...g.options];
        const current = filters[g.key] || 'all';
        const index = Math.max(0, options.findIndex((o) => o.value === current));
        const next = options[(index + 1) % options.length].value;
        const label = options[index].label;
        return html`
            <button class="chip" aria-pressed=${current !== 'all'}
                    title=${`Filter by ${g.label} — click to cycle`}
                    onClick=${() => onChange({ ...filters, [g.key]: next })}>
                ${g.label}: ${label}${current !== 'all' ? html`<span class="x" aria-hidden="true">×</span>` : null}
            </button>
        `;
    });
}

export function Manifest({ rows, columns, searchableFields, bulkActions = [], filterGroups = [], bulkNote, stateOf = (r) => r.state, onAdd, addLabel = '+ Add', realm, buildEditOp, csrfToken, onEditError, onRowClick, selectedRowId, title, headerRight, emptyText = 'Nothing here yet.' }) {
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

    // The state pill's own class comes from the row's state VALUE, so a realm that reports 'scheduled' or 'expired' gets the right shape without this component learning its vocabulary. Anything unrecognised falls to the conflict shape, which is the safe default: an unknown state should look like something to look at, never like a confirmed live row.
    const PILL = { live: 'live', staged: 'stag', scheduled: 'sched', expired: 'exp', conflict: 'conf' };

    // Two ways a row can carry a colour, and both are legitimate. Season names a CSS TOKEN (row.topicVar -> '--draw'), because its four topic accents are design tokens the mockup fixes. Armory carries a raw HEX (row.accentHex), because its per-category hues are the BOT's own values arriving in the payload from getMpCategoryAccent -- reading them from data is what stops the portal's palette drifting from what Discord actually renders.
    const dotAccent = (row) => (row.accentHex ? `--topic-accent:${row.accentHex}` : `--topic-accent:var(${row.topicVar || '--ink3'})`);

    return html`
        <div class="panel" id="manifest">
            ${title ? html`<div class="ph"><span class="t">${title}</span>${headerRight ? html`<span class="rt">${headerRight}</span>` : null}</div>` : null}
            <div class="mtools">
                <span class="srch"><label class="sr-only" for="manifest-search">Search</label><input id="manifest-search" value=${query} placeholder="Search…" onInput=${(e) => setQuery(e.target.value)} /></span>
                ${filterGroups.length ? html`<${FilterChips} groups=${filterGroups} filters=${filters} onChange=${setFilters} />` : null}
                <span class="rt">${visible.length} of ${rows.length} shown${selected.size ? ` · ${selected.size} selected` : ''}</span>
                ${onAdd ? html`<button class="accent-fill" onClick=${onAdd}>${addLabel}</button>` : null}
            </div>
            <div class="twrap">
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
                                        ${c.key === columns[0].key ? html`<span class="dot" style=${dotAccent(row)}></span>` : null}
                                        ${c.render ? c.render(row) : (c.key === 'state'
                                            ? html`<span class=${'stt ' + (PILL[stateOf(row)] || 'conf')}>${String(stateOf(row)).toUpperCase()}</span>`
                                            : row[c.key])}
                                    </td>
                                `;
                            })}
                        </tr>
                    `)}
                </tbody>
            </table>
            </div>
            ${visible.length === 0 ? html`<p class="empty">${rows.length ? 'No rows match this search or filter.' : emptyText}</p>` : null}
            ${selected.size ? html`
                <div class="bulk">
                    <span>${selected.size} selected</span>
                    ${bulkActions.map(a => html`<button class=${a.danger ? 'danger' : ''} onClick=${() => a.onClick([...selected])}>${a.label}</button>`)}
                    ${bulkNote ? html`<span class="note">${bulkNote}</span>` : null}
                </div>
            ` : null}
        </div>
    `;
}
