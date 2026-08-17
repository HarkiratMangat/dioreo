const mongoose = require('mongoose');

const UserPreferenceSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    timezone: { type: String, default: 'America/Toronto' },
    timestampStyle: { type: String, default: 'all_formats' },
    // Shared by /dmz AND /gunsmiths search — one "Weapon Builds" toggle in /settings covers every loadout command, same Option A pattern as `seasonalVisibility` below. `dmzVisibility` used to exist as a separate field here, but it was never actually wired to anything in the /settings UI (the visible toggle always wrote to `loadoutVisibility`), so it silently did nothing forever — removed rather than left as dead, unreachable state.
    loadoutVisibility: { type: String, default: 'public' },
    // NOTE: seasonendVisibility / drawsVisibility / patchnotesVisibility / calendarVisibility / pricesVisibility were removed here — per the user's decision (Option A), /season, /draws, /patch, /calendar, and /draw prices all now check the single shared `seasonalVisibility` field below instead of five separate ones. Old documents that still have the retired fields aren't hurt by this — Mongoose just stops reading/writing them going forward.
    seasonalVisibility: { type: String, default: 'public' },
    timestampVisibility: { type: String, default: 'public' },
    settingsVisibility: { type: String, default: 'public' },
    defaultRegion: { type: String, default: 'region_10' },
    // Added 2026-07-12 alongside /settings' region toggle becoming a 3-option dropdown. `defaultRegion` above keeps auto-tracking whatever region was last actually viewed/toggled (unchanged behavior); this new field controls what /draw prices' opening view actually uses: 'last_viewed' (default) behaves exactly as before (whatever `defaultRegion` currently holds), while 'region_10'/ 'region_30' PIN the display to that region regardless of what gets toggled elsewhere -- drawprices.js's execute() checks this before falling back to defaultRegion.
    defaultRegionMode: { type: String, default: 'last_viewed' },
    // /calendar's "Show Active Events Only" vs "Show All Events" default. ⚠️ SILENCED 2026-08-15 13:01 EDT (Harkirat's direct request) -- no code writes this field anymore (the /settings toggle that used to write it is commented out, see commands/settings.js) and no code reads it (/calendar's `view` slash option is a one-off per-invocation choice now, defaulting to 'all'). Field kept in the schema, not deleted, in case the preference comes back; existing values were cleared via a one-time `$unset` (scripts/clearCalendarEventFilter.js).
    calendarEventFilter: { type: String, default: 'all' },

    // ACCENT COLOR SYSTEM (utils/accentColor.js): 'preset' is the default (changed 2026-08-08 00:24 EDT, per Harkirat's direct request -- was 'avatar', when avatar-matching was meant to be what a brand-new user sees everywhere; that call is reversed) -- 'preset' keeps each command's own preset brand color (Police Blue, Chinese Violet, etc.) except /settings itself, which has none of its own and falls back to avatar even under 'preset'; 'banner' overrides every command's accent to match the banner instead. ('default' is the old value name for 'preset', from before avatar-matching became the schema default — resolveAccentColor() still treats it identically so pre-existing saved docs don't change behavior.) Avatar and banner colors are cached independently (a user might switch back and forth between the two styles) -- each *Source field is the Discord image hash the cached hex was computed from, so a cache only gets invalidated when that specific image actually changes, not whenever the other one does. 'displayName' (added 2026-07-13) matches Discord's newer Nitro "Display Name Styles" name- color gradient — a genuinely different source than avatar/banner (a real user-picked color pair straight from Discord, not something extracted/approximated from an image). Falls back to avatar if the user hasn't set one up (same "fall back to the next most personalized style" pattern banner-with-no-banner already uses) -- see utils/accentColor.js. displayNameColorSource stores the raw two-color pair joined by a comma (there's no single "image hash" to key off of here, unlike avatar/banner), so a cache invalidates only when the user's actual chosen colors change, not on every render. 'dynamicProfile' (added 2026-07-13) is the odd one out — every OTHER style resolves to one fixed, deterministic color; this one randomly picks between every color source the user has available (avatar/banner/displayName/decoration/nameplate) on each genuine NEW slash-command launch, then holds that one pick steady across any button/select re-render of that specific message (pagination, toggles, etc — see utils/accentColor.js's dynamicColorCache). Decoration/ nameplate colors are extracted the exact same way avatar/banner are (utils/colorExtract.js's getDominantColor against their own CDN image) -- decorationColorSource/nameplateColorSource store the asset hash they were computed from, same invalidation pattern as avatar/banner.
    accentColorStyle: { type: String, default: 'preset' },
    // ⚠️ NO `profileSource` field, deliberately (built and removed 2026-08-09 17:12 EDT, Harkirat's call). Whether the colours come from a user's server profile or their global one is decided by WHERE the command was run, not by a stored setting -- see utils/guildProfile.js. Don't re-add one; the only override is /colors' per-invocation `from:` option, which stores nothing.
    avatarColorHex: { type: Number },
    avatarColorSource: { type: String },
    bannerColorHex: { type: Number },
    bannerColorSource: { type: String },
    displayNameColorHex: { type: Number },
    displayNameColorSource: { type: String },
    decorationColorHex: { type: Number },
    decorationColorSource: { type: String },
    nameplateColorHex: { type: Number },
    nameplateColorSource: { type: String },

    // PER-SERVER PROFILE COLORS (2026-08-09 13:20 EDT) -- Discord's Server Profiles feature lets a user override their avatar/banner/decoration/nameplate/name-style per guild, and the invoker's overrides ride along in every interaction's `member` payload. These five pairs cache the colors extracted from those GUILD-scoped sources, kept separate from the global pairs above so a user who moves between a server and a DM doesn't repeatedly evict one context's color with the other's -- see utils/guildProfile.js and utils/accentColor.js.
    //
    // ⚠️ Deliberately NOT keyed by guild id, which looks like the obvious thing to do and is wrong. The *Source field holds the image hash / asset id, and that hash IS the identity: measured 2026-08-09 13:10 EDT, the same server avatar reused across two different guilds returns the IDENTICAL hash, so hash-keying makes the second guild a free cache HIT while guild-keying would recompute the same pixels under a different key. A different server profile necessarily means a different hash, so correctness never depends on the guild id.
    guildAvatarColorHex: { type: Number },
    guildAvatarColorSource: { type: String },
    guildBannerColorHex: { type: Number },
    guildBannerColorSource: { type: String },
    guildDisplayNameColorHex: { type: Number },
    guildDisplayNameColorSource: { type: String },
    guildDecorationColorHex: { type: Number },
    guildDecorationColorSource: { type: String },
    guildNameplateColorHex: { type: Number },
    guildNameplateColorSource: { type: String },

    // "View Colors" panel (utils/colorPalette.js, added 2026-07-13) -- a separate cache from the single accent-color hex above. Each *Palette field holds the full 6-swatch breakdown (Vibrant/ Light Vibrant/Dark Vibrant/Muted/Light Muted/Dark Muted -- see colorExtract.js's getColorPalette) for that source, stored as a plain object rather than 6x4 flat fields since Mongoose's Mixed type handles "an object with a few known-but-not-rigidly-typed keys" fine here and it's always reassigned wholesale (never mutated in place), so there's no markModified() gotcha to worry about. *PaletteSource reuses the exact same asset-hash values as the single-hex *ColorSource fields above -- deliberately not re-deriving a separate identity check. No "displayNamePalette" field exists: Display Name Colors are 2 EXACT user-picked colors straight from Discord, not something extracted from an image, so a 6-swatch derived palette wouldn't represent anything real -- the View Colors panel's Name page just shows those 2 real colors directly instead (nothing new to cache; displayNameColorHex above already isn't it either, since that's the BLENDED single value, not the original 2 stops -- the panel reads fetchProfileExtras() fresh/cached the same way the accent-color system already does).
    avatarPalette: { type: mongoose.Schema.Types.Mixed },
    avatarPaletteSource: { type: String },
    bannerPalette: { type: mongoose.Schema.Types.Mixed },
    bannerPaletteSource: { type: String },
    decorationPalette: { type: mongoose.Schema.Types.Mixed },
    decorationPaletteSource: { type: String },
    nameplatePalette: { type: mongoose.Schema.Types.Mixed },
    nameplatePaletteSource: { type: String },

    // Per-server counterparts of the four palettes above (2026-08-09 13:50 EDT), for the "View Colors" panel's global/server switch. Same reasoning as the guild*Color* pairs further up: separate fields so a user browsing their server palette in a guild and their ordinary palette in a DM keeps both, rather than each context evicting the other's much more expensive k-means result. Keyed on the asset hash, NOT the guild id -- a server profile reused across guilds has one hash, so it extracts once and hits cache everywhere else. No "guildDisplayNamePalette" for the same reason there is no global one: Display Name colors are exact user-picked values, not something extracted from an image.
    guildAvatarPalette: { type: mongoose.Schema.Types.Mixed },
    guildAvatarPaletteSource: { type: String },
    guildBannerPalette: { type: mongoose.Schema.Types.Mixed },
    guildBannerPaletteSource: { type: String },
    guildDecorationPalette: { type: mongoose.Schema.Types.Mixed },
    guildDecorationPaletteSource: { type: String },
    guildNameplatePalette: { type: mongoose.Schema.Types.Mixed },
    guildNameplatePaletteSource: { type: String },

    // Announcement one-time delivery tracking. ⚠️ REDESIGNED 2026-08-13 from a single version number to a per-announcement id list -- Announcement moved from a singleton to a real collection (see models/Announcement.js's header), so "have you seen the CURRENT one" no longer makes sense when multiple can be queued/outstanding at once. An id lands here only after a successful delivery (utils/announcement.js) -- never pruned, but the collection this compares against stays tiny (a handful of announcements at most), so this never grows large.
    seenAnnouncementIds: [{ type: mongoose.Schema.Types.ObjectId }],

    // Which storefront's prices /draw calculator quotes. Apple/Google prices are tier-locked PER STOREFRONT and are not proportional to each other, so the cheapest package combination genuinely differs by currency -- this is not a display setting. Overridable per-invocation on the slash command. See docs/reference/cp-package-prices.md for why this can't be derived from locale/timezone.
    cpCurrency: { type: String, default: 'USD' }
});

module.exports = mongoose.model('UserPreference', UserPreferenceSchema);