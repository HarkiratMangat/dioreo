// utils/timezoneBox.js -- the one Set timezone box and the one save, shared by /remind (handlers/remind.js) and /timestamp's Set timezone / My timezone button (handlers/timestamp.js). Moved out of handlers/remind.js 2026-11-01 15:19 EDT (Harkirat's /timestamp panel update), so the zone a player saves is the same everywhere: /timestamp, /remind and /settings all read UserPreference.timezone.

// The reader's chosen zone, for the dropdowns' written-out times (utils/reminders.js optionTime); null (shown as UTC) unless they picked one, since `timezone` alone stores its Toronto default on every new record (models/UserPreference.js timezoneSetAt).
async function userZone(userId) {
    const UserPreference = require('../models/UserPreference');
    const prefs = await UserPreference.findOne({ discordId: userId }, { timezone: 1, timezoneSetAt: 1 }).lean();
    return prefs?.timezoneSetAt && prefs.timezone ? prefs.timezone : null;
}

// Saves a picked zone the way /settings does, with the time it was chosen.
async function saveZone(userId, tz) {
    const UserPreference = require('../models/UserPreference');
    await UserPreference.findOneAndUpdate({ discordId: userId }, { $set: { timezone: tz, timezoneSetAt: new Date() } }, { upsert: true, setDefaultsOnInsert: true });
}

// The Set timezone picker's one-click zones: /settings' own shortlist (utils/timezoneData.js).
function quickZones() {
    return require('../utils/timezoneData').quickZoneOptions(); // west to east by offset
}

// Set timezone opens one box with both ways in (Harkirat, 2026-10-24 21:12 EDT: "Just do a modal when the button is pressed? That holds 2 fields: a search and a quick pick dropdown menu"): /settings' shortlist as a dropdown, the chosen zone pre-selected, and a search field for anything else. Typed text wins over the dropdown, since the dropdown arrives with the current zone already picked. `idPrefix` is remind_tzsearchdm when the box was opened from the timezone tip DM, whose submit confirms in place instead of drawing the panel.
function zoneModal(owner, current, idPrefix = 'remind_tzsearch') {
    return {
        title: 'Set your timezone', custom_id: `${idPrefix}:${owner}`,
        components: [
            { type: 18, label: 'Quick pick', description: 'Common timezones', component: { type: 3, custom_id: 'zone', required: false, placeholder: 'Pick your timezone…', options: quickZones().slice(0, 25).map(o => ({ ...o, default: o.value === current })) } },
            { type: 18, label: 'Or search', description: 'A city, country or abbreviation', component: { type: 4, custom_id: 'query', style: 1, required: false, max_length: 60, placeholder: 'Toronto, London, Tokyo, PST…' } },
        ],
    };
}

module.exports = { userZone, saveZone, quickZones, zoneModal };
