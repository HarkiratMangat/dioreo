// utils/timestampPanel.js -- /timestamp's panel read back off its message, and Edit timestamp's form (2026-11-01 15:19 EDT, Harkirat's panel update). Pure: no database and no Discord calls; handlers/timestamp.js uses both and scripts/timestampButtons.test.js tests them.

// What a panel message says about itself: whose it is, whether they had saved a zone (the timezone button's colour), and the parse its dropdown carries. Read off the message so a re-render, Edit timestamp and the timezone box all agree with what is on screen. A panel posted before the button row (2026-11-01) has none: its owner is the interaction that made it, else the presser.
function panelState(message, presserId) {
    const flat = [];
    const walk = c => { if (!c) return; const j = typeof c.toJSON === 'function' ? c.toJSON() : c; flat.push(j); (j.components || []).forEach(walk); };
    (message?.components || []).forEach(walk);
    const edit = flat.find(c => typeof c.custom_id === 'string' && c.custom_id.startsWith('tsedit|'));
    const zone = flat.find(c => typeof c.custom_id === 'string' && c.custom_id.startsWith('tszone|'));
    const menu = flat.find(c => typeof c.custom_id === 'string' && c.custom_id.startsWith('tsmenu|'));
    const ownerId = edit ? edit.custom_id.split('|')[1] : (message?.interactionMetadata?.user?.id || message?.interaction?.user?.id || presserId);
    let unix = null, endUnix = null, tz = 'America/Toronto', queryInput = '';
    if (menu) {
        const parts = menu.custom_id.split('|');
        [unix, endUnix] = parts[1].split('~');
        tz = parts[2];
        queryInput = parts.slice(3).join('|');
    }
    const picked = (menu?.options || []).find(o => o.default)?.value || 'all_formats';
    return {
        ownerId, ownerHasZone: zone ? zone.style === 2 : null,
        unix, endUnix: endUnix || null, tz, queryInput, style: picked === 'all_formats' ? null : picked,
        ephemeral: Boolean(message?.flags?.bitfield & 64),
        isTextMode: !(message?.flags?.bitfield & 32768),
    };
}

// Edit timestamp's form (his list, 15:19 EDT): (1) the date and time, prefilled; (2) a quick pick of timezones; (3) a field to type one; (4) the view, text or embed; (5) the format. Five is a form's limit.
function editModal(state) {
    const { quickZoneOptions } = require('../utils/timezoneData');
    const { STYLE_SELECT_OPTIONS } = require('../commands/timestamp');
    const zones = quickZoneOptions().slice(0, 25);
    const style = state.style || 'all_formats';
    return {
        title: 'Edit timestamp', custom_id: `tseditm|${state.ownerId}`,
        components: [
            { type: 18, label: 'Date and time', description: 'e.g. tomorrow 8pm, sun 4:30pm, nov 5 19:30', component: { type: 4, custom_id: 'when', style: 1, required: true, max_length: 100, ...(state.queryInput ? { value: String(state.queryInput).slice(0, 100) } : {}) } },
            { type: 18, label: 'Timezone', description: 'Common timezones', component: { type: 3, custom_id: 'zone', required: false, placeholder: 'Pick a timezone…', options: zones.map(o => ({ ...o, default: o.value === state.tz })) } },
            { type: 18, label: 'Or type a timezone', description: 'A city, country or abbreviation; wins over the pick', component: { type: 4, custom_id: 'zonequery', style: 1, required: false, max_length: 60, placeholder: 'Toronto, London, Tokyo, PST…' } },
            { type: 18, label: 'View', component: { type: 3, custom_id: 'view', required: true, options: [
                { label: 'Embed', value: 'embed', description: 'The styled panel', default: !state.isTextMode },
                { label: 'Text', value: 'text', description: 'Plain and copyable', default: state.isTextMode },
            ] } },
            { type: 18, label: 'Format', component: { type: 3, custom_id: 'style', required: true, options: STYLE_SELECT_OPTIONS.map(o => ({ ...o, default: o.value === style })) } },
        ],
    };
}

module.exports = { panelState, editModal };
