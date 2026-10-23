// utils/globalNav.js Shared 5-button navigation row used by calendar/draws/patchnotes/drawprices/seasonend -- used to be hand-copied nearly identically into each of those 5 files, differing only in which button is the active/disabled one. That exact duplication shape is what caused a real bug once already (the accent-color palette rotated out of sync with nav button order after the buttons themselves got reordered in an earlier session, since there was no single source of truth to update — see .claude/rules/rendering-and-ui.md's nav-order color map). Collapsing to one function here means the button order/labels/ custom_ids can only ever drift out of sync with themselves, not silently across 5 separate files.
const NAV_ITEMS = [
    { label: 'Calendar', custom_id: 'nav_calendar' },
    { label: 'Draws', custom_id: 'nav_draws' },
    { label: 'Draw Prices', custom_id: 'nav_prices' },
    { label: 'Patch Notes', custom_id: 'nav_patchnotes' },
    { label: 'Season End', custom_id: 'nav_seasonend' }
];

// `activeCustomId` gets style 1 (Primary/blurple) + disabled; every other button stays style 2 (Secondary/gray). Blurple since 2026-10-19 09:57 EDT (Harkirat: "swap green-disabled in the outside footer action row to blurple-disabled", in the same ask that moved /calendar's Draws/Events/Modes toggles to green-disabled, so the in-panel switcher and this footer no longer share a colour). It was style 3 (green) from 2026-10-15 18:14 EDT and style 4 (red) before that.
//
// `overrides` (added 2026-08-26 23:03 EDT, the /draw prices <-> /draw calculator cross-link) lets a caller replace one slot's label/custom_id/emoji entirely -- keyed by the slot's ORIGINAL custom_id, so /draw prices can swap its own disabled-and-useless "Draw Prices" button for an active "Draw Calculator" link without a duplicate copy of NAV_ITEMS. An overridden item is never treated as the active/disabled slot, regardless of `activeCustomId` -- it points somewhere else now, so it must stay clickable.
function buildGlobalNavRow(activeCustomId, overrides = {}) {
    return {
        type: 1,
        components: NAV_ITEMS.map(item => {
            const override = overrides[item.custom_id];
            const resolved = override ? { ...item, ...override } : item;
            const isActive = !override && item.custom_id === activeCustomId;
            return {
                type: 2,
                // An override may set its own style: /calendar's filtered view turns its own slot into a live blurple "Full Calendar" (2026-10-21 16:02 EDT).
                style: resolved.style ?? (isActive ? 1 : 2),
                label: resolved.label,
                custom_id: resolved.custom_id,
                ...(resolved.emoji ? { emoji: resolved.emoji } : {}),
                ...(isActive ? { disabled: true } : {})
            };
        })
    };
}

module.exports = { buildGlobalNavRow };
