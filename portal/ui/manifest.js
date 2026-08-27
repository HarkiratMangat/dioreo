// portal/ui/manifest.js — ESM. The Manifest: search, filter chips, sortable table, multi-select, bulk bar, and an opt-in Add button + click-to-edit cell + click-to-preview row. Reused UNCHANGED by every realm (spec §8.2) — a realm supplies only `columns`/`rows`/`bulkActions`/`onAdd`/`buildEditOp`/`onRowClick`/`filterGroups`, never its own copy of this component.
//
// filterRows/sortRows/toggleSelection come from manifest.logic.js, loaded as a classic script — see track.js's header comment for why that is the real cross-runtime resolution here.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useMemo, useEffect } from '../vendor/preact-hooks.mjs';
import { stageAndCommit } from './composeClient.js';
import { Icon } from './icons.js';

// `filterGroups` is [{key, label, options:[{value,label}]}]. One CHIP PER GROUP that cycles through its own options, not one chip per option: 03-three-surfaces.html renders exactly two chips ("Type: all ×", "State: staged ×") for a table with five types and four states, so the chip shows the current value rather than enumerating every possible one. `all` is always the first option and is what the × returns to.
function FilterChips({ groups, filters, onChange }) {
    return groups.map((g) => {
        const options = [{ value: 'all', label: 'all' }, ...g.options];
        const current = filters[g.key] || 'all';
        const index = Math.max(0, options.findIndex((o) => o.value === current));
        const next = options[(index + 1) % options.length].value;
        const label = options[index].label;
        return html`
            <!-- ⚠️ A TOPIC FILTER IS NOT A STATE FILTER, and both rendered as the same neutral chip. Lane
                 and category ARE the topic vocabulary the whole console colours by — the Track's bars, the
                 row dots, the composer's chips — so a filter over them takes the topic chip and a filter
                 over state does not. The realm declares which it is; a shared component cannot guess. -->
            <button class=${'chip' + (g.topic ? ' topic' : '')} aria-pressed=${current !== 'all'}
                    title=${`Filter by ${g.label} — click to cycle`}
                    onClick=${() => onChange({ ...filters, [g.key]: next })}>
                ${g.label}: ${label}${current !== 'all' ? html`<span class="x" aria-hidden="true">×</span>` : null}
            </button>
        `;
    });
}

// 🔴 THE SELECTION ACTIONS WERE 1,682px BELOW THE FOLD. They rendered at the FOOT of the table, so selecting row 1 of 39 at 1280×860 showed a checkmark and no consequence anywhere on screen — the affordance existed and was, for the reader, missing. Distance, not absence. Fixed to the viewport is the whole fix; `z-index:42` puts it above the sticky header and below the scrim, so opening a drawer covers it rather than letting a bar float over a modal.
//
// 🔴 THE REVERSIBILITY BADGE IS PER-REALM AND HAS NO DEFAULT, which is a correction the mockup made to itself: a shared bar defaulting to "reversible — undo stays in the tray" said that on ACCESS, whose permission edits do not go through the tray at all (portal/api/access.js writes them directly, by decision). A shared component may carry a default sentence; it may not carry one that is false on a realm that uses it. No badge is offered when a realm has not said which is true.
export function SelectionBar({ count, noun, summary, badge, tier, actions, onClear }) {
    const [on, setOn] = useState(false);
    // The bar starts translated off the bottom edge and slides up, which needs one frame between mount and the class — set in the same paint and the transition has nothing to animate from.
    useEffect(() => {
        const id = requestAnimationFrame(() => setOn(true));
        return () => cancelAnimationFrame(id);
    }, []);
    // `has-selbar` steps the tray up rather than letting the two objects share the bottom edge: the tray is a persistent status object, the bar a momentary action one.
    useEffect(() => {
        document.body.classList.add('has-selbar');
        return () => document.body.classList.remove('has-selbar');
    }, []);
    return html`
        <div class=${'selbar' + (on ? ' on' : '')} role="region" aria-label="Actions for the current selection">
            <div class="selbar-in">
                <span class="selbar-n">${count}</span>
                <div class="selbar-t">
                    <b>${count} ${count === 1 ? noun[0] : noun[1]}</b>
                    ${summary ? html`<span>${summary}</span>` : null}
                </div>
                ${badge ? html`<span class=${'selbar-rev ' + ((tier || 1) >= 3 ? 'gate' : 'ok')}>${badge}</span>` : null}
                <div class="selbar-a">
                    ${actions.map((a) => html`
                        <button class=${'pill sm' + (a.danger ? ' dang' : '')} key=${a.label}
                                onClick=${() => a.onClick()}>${a.label}</button>`)}
                </div>
                <button class="selbar-x" onClick=${onClear}>Clear</button>
            </div>
        </div>
    `;
}

export function Manifest({ rows, columns, searchableFields, bulkActions = [], filterGroups = [], bulkNote, bulkTier, stateOf = (r) => r.state, onAdd, addLabel = '+ Add', realm, buildEditOp, csrfToken, onEditError, onRowClick, selectedRowId, title, headerRight, emptyText = 'Nothing here yet.', rowNoun = ['selected', 'selected'], onRemove, removeLabel = 'Remove' }) {
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

    // ⚠️ THE SUMMARY NAMES THE ROWS; IT DOES NOT RESTATE THE COUNT. The bar's lead figure is already the count, so a second "3 selected" underneath it is the same fact twice — what a reader cannot get from the figure is WHICH three, which is exactly what they need before pressing something destructive.
    const selectionSummary = () => {
        const chosen = rows.filter((r) => selected.has(r.id));
        const named = chosen.slice(0, 3).map((r) => String(r[columns[0].key] ?? '')).filter(Boolean);
        if (!named.length) return '';
        return named.join(' · ') + (chosen.length > named.length ? ` · and ${chosen.length - named.length} more` : '');
    };

    // The state pill's own class comes from the row's state VALUE, so a realm that reports 'scheduled' or 'expired' gets the right shape without this component learning its vocabulary. Anything unrecognised falls to the conflict shape, which is the safe default: an unknown state should look like something to look at, never like a confirmed live row.
    const PILL = { live: 'live', staged: 'stag', scheduled: 'sched', expired: 'exp', conflict: 'conf' };

    // Two ways a row can carry a colour, and both are legitimate. Season names a CSS TOKEN (row.topicVar -> '--draw'), because its four topic accents are design tokens the mockup fixes. Armory carries a raw HEX (row.accentHex), because its per-category hues are the BOT's own values arriving in the payload from getMpCategoryAccent -- reading them from data is what stops the portal's palette drifting from what Discord actually renders.
    const dotAccent = (row) => (row.accentHex ? `--topic-accent:${row.accentHex}` : `--topic-accent:var(${row.topicVar || '--ink3'})`);

    return html`
        <div class="panel" id="manifest">
            ${title ? html`<div class="ph"><span class="t">${title}</span>${headerRight ? html`<span class="rt">${headerRight}</span>` : null}</div>` : null}
            <div class="mtools">
                <!-- ⚠️ The chipset wrapper is display:contents, so it groups the chips for a screen reader and for the
                     markup without adding a box that would break the toolbar's own flex row. -->
                <span class="mlabel">${title || 'Rows'}</span>
                <span class="srch"><label class="sr" for="manifest-search">Search</label><input id="manifest-search" value=${query} placeholder="Search…" onInput=${(e) => setQuery(e.target.value)} /></span>
                ${filterGroups.length ? html`<span class="chipset" role="group" aria-label="Filters"><${FilterChips} groups=${filterGroups} filters=${filters} onChange=${setFilters} /></span>` : null}
                <span class="rt">${visible.length} of ${rows.length} shown${selected.size ? ` · ${selected.size} selected` : ''}</span>
                ${onAdd ? html`<button class="accent-fill" onClick=${onAdd}>${addLabel}</button>` : null}
            </div>
            <div class="mscroll">
            <table class="mtable">
                <!-- 🔴 table-layout:fixed NEEDS A COLGROUP OR EVERY COLUMN IS EQUAL. A realm supplies its
                     own columns, so the widths are derived from each column's ROLE rather than listed:
                     the first column is the identity one by this component's own contract (it is where
                     the topic dot goes), a date is a window, a state is a pill, everything else is
                     detail. The alternative — one width list per realm — is five copies of a decision
                     that would drift the first time a realm added a column. -->
                <colgroup>
                    <col class="c-cb" />
                    ${columns.map((c, i) => html`<col key=${c.key}
                        class=${c.col || (i === 0 ? 'c-item' : c.key === 'state' ? 'c-state' : c.dataKind === 'date' ? 'c-win' : 'c-detail')} />`)}
                    <!-- The remove column takes its width from the .mtable th.ra rule, which the adopted sheet already sets; a col class of its own would be a second authority over one number. (No backticks in this comment: it lives inside a template literal, and the build's parse gate caught the sixth occurrence of that within seconds of writing it.) -->
                    ${onRemove ? html`<col class="c-ra" />` : null}
                </colgroup>
                <thead><tr>
                    <th class="c-cb"></th>
                    <!-- 🔴 A <th> WITH AN onClick IS NOT A CONTROL. Sorting was bound to the header cell
                         itself, which no keyboard can reach and no screen reader announces as actionable
                         — the whole table could be sorted with a mouse and not at all without one. The
                         button carries the handler and aria-sort states the current direction, which
                         is the part a caret alone cannot say. -->
                    ${columns.map((c, i) => html`
                        <th key=${c.key} class=${'sortable' + (sort.column === c.key ? (sort.direction === 'asc' ? ' sorted-asc' : ' sorted-desc') : '')
                                + (i > 0 && c.dataKind === 'date' ? ' drop-sm' : '')}
                            aria-sort=${sort.column === c.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                            <button type="button" class="sortbtn"
                                    onClick=${() => setSort({ column: c.key, direction: sort.column === c.key && sort.direction === 'asc' ? 'desc' : 'asc' })}>
                                ${c.label}
                            </button>
                        </th>`)}
                    ${onRemove ? html`<th class="ra"><span class="sr">${removeLabel}</span></th>` : null}
                </tr></thead>
                <tbody>
                    ${visible.map(row => html`
                        <tr class=${(selected.has(row.id) ? 'sel' : '') + (selectedRowId === row.id ? ' preview-sel' : '')}
                            onClick=${onRowClick ? () => onRowClick(row) : null} style=${onRowClick ? 'cursor:pointer' : ''}>
                            <!-- 🔴 THE ONLY BROWSER-DEFAULT CONTROL LEFT IN THE PORTAL, on the row of every table.
                                 The adopted sheet has drawn a checkbox since it was adopted — a 16px sunk square that
                                 fills with the accent and strokes a tick — and the Manifest rendered a UA checkbox
                                 beside it, so a design that reset every other control to its own vocabulary had a
                                 native blue tick on 39 rows. The input is still the input: it is visually hidden
                                 rather than replaced, so it keeps its focus, its keyboard behaviour and its label. -->
                            <td onClick=${(e) => e.stopPropagation()}>
                                <label class="cbl" for=${`sel-${row.id}`}>
                                    <span class="sr">Select ${row[columns[0].key]}</span>
                                    <input class="sr" id=${`sel-${row.id}`} type="checkbox" checked=${selected.has(row.id)}
                                           onChange=${() => setSelected(toggleSelection(selected, row.id))} />
                                    <span class=${'cb' + (selected.has(row.id) ? ' on' : '')} aria-hidden="true"></span>
                                </label>
                            </td>
                            ${columns.map((c, ci) => {
                                const isEditing = editingCell && editingCell.rowId === row.id && editingCell.columnKey === c.key;
                                if (isEditing) {
                                    return html`<td key=${c.key} onClick=${(e) => e.stopPropagation()}>
                                        <label class="sr" for=${`edit-${row.id}-${c.key}`}>Edit ${c.label}</label>
                                        <input class="edit" id=${`edit-${row.id}-${c.key}`} value=${editValue} autoFocus
                                               onInput=${(e) => setEditValue(e.target.value)}
                                               onKeyDown=${(e) => { if (e.key === 'Enter') commitEdit(row, c.key); if (e.key === 'Escape') setEditingCell(null); }}
                                               onBlur=${() => setEditingCell(null)} />
                                    </td>`;
                                }
                                const body = c.render ? c.render(row) : (c.key === 'state'
                                    ? html`<span class=${'stt ' + (PILL[stateOf(row)] || 'conf')}>${String(stateOf(row)).toUpperCase()}</span>`
                                    : row[c.key]);
                                // 🔴 THE TABLE HAD ONE CELL KIND AND THE STYLESHEET STYLES FIVE. Every column rendered as plain text or a date, so a row could say WHAT a thing is and never what is IN it — the detail column, the tier chips, the right-aligned status column and the secondary line under a name were all styled, all unused, and invisible to an orphan check because a rule existed for each. `dataKind` names the cell; the realm supplies what goes in it.
                                //
                                // ⚠️ `detail` MUST stay a table-cell. The mockup's own comment records the fix: `display:block` on the td broke row layout thirty-nine times, once per row, and only the inner box needs the ellipsis. That is why `.det` carries `min-width:0` and the truncation lives on `.detcell`/`.dsub`.
                                const kind = ci === 0 ? 'n'
                                    : c.dataKind === 'date' ? 'd drop-sm'
                                    : c.dataKind === 'detail' ? 'det'
                                    : c.dataKind === 'right' ? 'ta-r'
                                    : c.dataKind === 'nums' ? 'nums'
                                    : '';
                                return html`
                                    <td key=${c.key} class=${kind}
                                        onClick=${c.editable ? (e) => { e.stopPropagation(); setEditingCell({ rowId: row.id, columnKey: c.key }); setEditValue(String(row[c.key] ?? '')); } : null}
                                        style=${c.editable ? 'cursor:text' : ''}>
                                        ${ci === 0
                                            ? html`<span class="ncell"><span class="dot" style=${dotAccent(row)}></span>
                                                <span>${body}${c.meta ? html`<span class=${'rowmeta' + (c.metaClass ? ' ' + c.metaClass : '')}>${c.meta(row)}</span>` : null}</span></span>`
                                            : html`${body}${c.meta ? html`<div class=${'rowmeta' + (c.metaClass ? ' ' + c.metaClass : '')}>${c.meta(row)}</div>` : null}`}
                                    </td>
                                `;
                            })}
                            <!-- 🔴 ITS OWN COLUMN WITH A HEADER, NEVER A HOVER REVEAL. A reveal does not
                                 exist on touch and cannot be scanned, and a "…" menu buries the verb
                                 behind a click for nothing. It is --ink3 at rest so it is findable, and
                                 takes the destructive colour only on hover and focus. -->
                            ${onRemove ? html`
                                <td class="ra" onClick=${(e) => e.stopPropagation()}>
                                    <button class="rmv" title=${removeLabel} aria-label=${`${removeLabel} ${row[columns[0].key]}`}
                                            onClick=${() => onRemove(row)}><${Icon} name="trash-2" cls="sm" /></button>
                                </td>` : null}
                        </tr>
                    `)}
                </tbody>
            </table>
            </div>
            ${visible.length === 0 ? html`<p class="empty">${rows.length ? 'No rows match this search or filter.' : emptyText}</p>` : null}
            ${selected.size && bulkActions.length ? html`
                <${SelectionBar} count=${selected.size} noun=${rowNoun} tier=${bulkTier}
                                 badge=${bulkNote} summary=${selectionSummary()}
                                 onClear=${() => setSelected(new Set())}
                                 actions=${bulkActions.map((a) => ({ label: a.label, danger: a.danger, onClick: () => a.onClick([...selected]) }))} />` : null}
        </div>
    `;
}
