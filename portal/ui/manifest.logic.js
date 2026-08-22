// portal/ui/manifest.logic.js — CommonJS, imports nothing. Pure functions <Manifest> renders from.
//
// The Manifest is the SAME component every realm reuses unchanged (spec §8.2) -- search, filter, sort, multi-select, bulk bar -- so its logic must not assume any one realm's row shape beyond {id, state}. Everything realm-specific (which columns, which fields are searchable) arrives as config from the caller.

function matchesSearch(row, query, searchableFields) {
    if (!query) return true;
    const q = query.toLowerCase();
    return searchableFields.some(f => String(row[f] ?? '').toLowerCase().includes(q));
}

function matchesFilters(row, filters) {
    // filters: { [fieldName]: 'all' | value }. 'all' (or absent) never excludes a row.
    return Object.entries(filters || {}).every(([field, value]) => value === 'all' || value == null || row[field] === value);
}

function filterRows(rows, { query, searchableFields = [], filters = {} } = {}) {
    return rows.filter(row => matchesSearch(row, query, searchableFields) && matchesFilters(row, filters));
}

function sortRows(rows, { column, direction = 'asc' } = {}) {
    if (!column) return rows;
    const sign = direction === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => {
        const av = a[column], bv = b[column];
        if (av === bv) return 0;
        return av > bv ? sign : -sign;
    });
}

// Toggling a row's selection never mutates the caller's array/set -- every render function here is pure, state in tree out (spec §12a).
function toggleSelection(selectedIds, id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
}

// Guarded: a classic <script> in a real browser has no `module` global, and an unguarded assignment throws ReferenceError mid-parse -- silently true here only because every function above already executed before this line ran. Found by actually loading this file in a browser rather than assuming the classic-script plan would just work.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { filterRows, sortRows, toggleSelection, matchesSearch, matchesFilters };
}
