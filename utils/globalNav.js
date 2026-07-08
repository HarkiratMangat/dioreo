// utils/globalNav.js
// Shared 5-button navigation row used by calendar/draws/patchnotes/drawprices/seasonend -- used to
// be hand-copied nearly identically into each of those 5 files, differing only in which button is
// the active/disabled one. That exact duplication shape is what caused a real bug once already
// (the accent-color palette rotated out of sync with nav button order after the buttons themselves
// got reordered in an earlier session, since there was no single source of truth to update — see
// CLAUDE.md's color palette note). Collapsing to one function here means the button order/labels/
// custom_ids can only ever drift out of sync with themselves, not silently across 5 separate files.
const NAV_ITEMS = [
    { label: 'Calendar', custom_id: 'nav_calendar' },
    { label: 'Draws', custom_id: 'nav_draws' },
    { label: 'Draw Prices', custom_id: 'nav_prices' },
    { label: 'Patch Notes', custom_id: 'nav_patchnotes' },
    { label: 'Season End', custom_id: 'nav_seasonend' }
];

// `activeCustomId` gets style 4 (Danger/red) + disabled, matching the existing "locked to active
// state" convention; every other button stays style 2 (Secondary/gray).
function buildGlobalNavRow(activeCustomId) {
    return {
        type: 1,
        components: NAV_ITEMS.map(item => {
            const isActive = item.custom_id === activeCustomId;
            return {
                type: 2,
                style: isActive ? 4 : 2,
                label: item.label,
                custom_id: item.custom_id,
                ...(isActive ? { disabled: true } : {})
            };
        })
    };
}

module.exports = { buildGlobalNavRow };
