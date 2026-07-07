const mongoose = require('mongoose');

const UserPreferenceSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    timezone: { type: String, default: 'America/Toronto' },
    timestampStyle: { type: String, default: 'all_formats' },
    // Shared by /dmz AND the MP loadout lookup commands (/all, /<category>) — one "Weapon Builds"
    // toggle in /settings covers every loadout command, same Option A pattern as
    // `seasonalVisibility` below. `dmzVisibility` used to exist as a separate field here, but it
    // was never actually wired to anything in the /settings UI (the visible toggle always wrote to
    // `loadoutVisibility`), so it silently did nothing forever — removed rather than left as dead,
    // unreachable state.
    loadoutVisibility: { type: String, default: 'public' },
    // NOTE: seasonendVisibility / drawsVisibility / patchnotesVisibility / calendarVisibility /
    // pricesVisibility were removed here — per the user's decision (Option A), /season, /draws,
    // /patch, /calendar, and /draw prices all now check the single shared `seasonalVisibility`
    // field below instead of five separate ones. Old documents that still have the retired
    // fields aren't hurt by this — Mongoose just stops reading/writing them going forward.
    seasonalVisibility: { type: String, default: 'public' },
    timestampVisibility: { type: String, default: 'public' },
    settingsVisibility: { type: String, default: 'public' },
    defaultRegion: { type: String, default: 'region_10' },
    // /calendar's "Show Active Events Only" vs "Show All Events" toggle. Deliberately NOT exposed
    // in /settings (Harkirat's request) -- /calendar's own toggle button reads/writes this directly
    // instead of routing through the settings dashboard, unlike every other visibility preference.
    // Defaults to 'all' until the user has explicitly toggled it at least once.
    calendarEventFilter: { type: String, default: 'all' },

    // ACCENT COLOR SYSTEM (utils/accentColor.js): 'avatar' is the default (avatar-matching is meant
    // to be what a brand-new user sees everywhere, per Harkirat's request) -- 'preset' keeps each
    // command's own preset brand color instead (Police Blue, Chinese Violet, etc.) except /settings
    // itself, which has none of its own and falls back to avatar even under 'preset'; 'banner'
    // overrides every command's accent to match the banner instead. ('default' is the old value name
    // for 'preset', from before avatar-matching became the schema default — resolveAccentColor()
    // still treats it identically so pre-existing saved docs don't change behavior.) Avatar and
    // banner colors are cached independently (a user might switch back and forth between the two
    // styles) -- each *Source field is the Discord image hash the cached hex was computed from, so a
    // cache only gets invalidated when that specific image actually changes, not whenever the other
    // one does.
    accentColorStyle: { type: String, default: 'avatar' },
    avatarColorHex: { type: Number },
    avatarColorSource: { type: String },
    bannerColorHex: { type: Number },
    bannerColorSource: { type: String }
});

module.exports = mongoose.model('UserPreference', UserPreferenceSchema);