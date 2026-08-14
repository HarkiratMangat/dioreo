const mongoose = require('mongoose');

const SeasonalDataSchema = new mongoose.Schema({
    docType: { type: String, default: 'global', unique: true },

    // NOTE (added during review): these four titles are set by the "Initialize New Season" and
    // "Edit Season Titles" admin modals (handlers/manage.js's modal_wipe_season and modal_season_titles_deadlines handlers), and read as fallback display
    // text in seasonend.js and draws.js — but were missing from the schema, so .save() was
    // silently discarding them every time (Mongoose only persists declared paths).
    currentSeasonTitle: { type: String, default: '' },
    bpTitle: { type: String, default: 'Battle Pass' },
    rankTitle: { type: String, default: 'Ranked Series' },
    dmzTitle: { type: String, default: 'DMZ Season' },

    // /seasonend dates
    bpEnd: { type: Date },
    rankEnd: { type: Date },
    dmzEnd: { type: Date },
    // TBD state (added 2026-07-31 14:00 EDT) -- typing the literal word "TBD" into a deadline field
    // now sets this flag + nulls the Date, instead of silently corrupting the date (the L194 bug --
    // see adminParser.js's parseAdminDate). Distinct from "not set yet" (both fields default
    // false/undefined): TBD means "known to be undecided," so seasonend.js shows "TBD" rather than
    // "Date has not been set yet," and anything checking whether the season/an "All Season" calendar
    // event has ended (calendar.js's isEventEnded) treats a TBD end as indefinitely running rather
    // than comparing against a null date.
    bpEndTBD: { type: Boolean, default: false },
    rankEndTBD: { type: Boolean, default: false },
    dmzEndTBD: { type: Boolean, default: false },

    // /patchnotes
    patchNotes: [{
        title: { type: String }, // Now holds just the season # & name (e.g. "Season 6: Take Your Heart"),
        // not the full "Balance Changes for..." string — see patchnotes.js. Kept auto-synced to
        // currentSeasonTitle for the current entry (see handlers/manage.js's modal_season_titles_deadlines) --
        // titleOverride below is what actually decides what's DISPLAYED.
        titleOverride: { type: String, default: '' }, // Manual per-entry title override (2026-07-24,
        // /manage "Add New Season"/"Past Seasons" edit) -- lets Harkirat set a placeholder season
        // title on a patch entry when the real season title isn't finalized yet (e.g. patch notes
        // released before the new season's name is announced). Blank = no override, falls back to
        // `title` above. Every display site must read `titleOverride || title`, never `title` alone
        // -- see patchnotes.js's exported `displayTitle()`.
        description: { type: String, default: '' }, // Optional extra info; left blank shows nothing
        releaseDate: { type: Date },
        // Cloudinary URLs (2026-07-13) -- re-hosted from whatever external URL the admin typed, via
        // utils/patchNotesCache.js, keyed by this subdocument's own `_id` (see that file for why:
        // season-based retention, not the draws' 45-day age window -- an image stays cached as long
        // as this entry is still one of the 5 most recent in patchNotes[], pruned once it rolls off
        // /patch notes' own history dropdown regardless of age).
        images: [{ type: String }]
    }],

    // /draws
    newDraws: [{
        title: { type: String },
        date: { type: Date },
        thumbnailUrl: { type: String },
        items: [{
            tier: { type: String }, // Maps to L, M, LL, E shorthands
            name: { type: String }
        }]
    }],
    returningDraws: [{
        title: { type: String },
        date: { type: Date },
        thumbnailUrl: { type: String },
        items: [{
            tier: { type: String },
            name: { type: String }
        }]
    }],

    // /calendar
    calendar: [{
        title: { type: String },
        date: { type: Date }, // start date
        endDate: { type: Date }, // optional — null/absent when isOngoing is true
        isOngoing: { type: Boolean, default: false }, // true for "All Season" bulk entries
        // 3-section calendar redesign (2026-07-31 12:10 EDT) -- draw/event/playlist, set via the bulk parser's
        // d•/p•/e• prefix (adminParser.js's parseBulkEvents) or the single add/edit modal. Defaults
        // to 'event' so every pre-existing un-prefixed entry keeps rendering in the same section it
        // always has. calendar.js also synthesizes 'draw' entries at RENDER time from newDraws/
        // returningDraws for anything with no explicit calendar row -- those are never saved here.
        category: { type: String, enum: ['draw', 'event', 'playlist'], default: 'event' }
    }],

    // Per-page /calendar banners (added 2026-07-31 17:20 EDT, the notes file follow-up) -- ONE banner per page
    // (Draws/Events/Playlists), independently settable via /manage's Calendar "Banners" action.
    // Re-hosted through utils/calendarBannerCache.js (same Cloudinary caching philosophy as draw
    // thumbnails/patch images). Blank/'' = show nothing for that page, not a placeholder.
    drawsBannerUrl: { type: String, default: '' },
    eventsBannerUrl: { type: String, default: '' },
    playlistsBannerUrl: { type: String, default: '' },

    // Next-season staging area (added 2026-07-30 22:24 EDT) -- lets the admin prep an entire upcoming season
    // (title/deadlines/draws/calendar) WITHOUT it going live, then flip it live in one shot via
    // /manage's "Promote to Live" action. Exists because this whole document is a single global
    // doc (`docType: 'global'`) -- editing newDraws/calendar/bpEnd directly during the overlap
    // window between "current season not over yet" and "new season announced" immediately
    // overwrote what was still publicly live, and an "All Season" calendar event's displayed end
    // always reads the LIVE bpEnd (see calendar.js), so a draft entry prepared before bpEnd was
    // updated would show the OLD season's end date until promoted. Mirrors the shape of the live
    // fields it stages, minus patchNotes (patch notes already has its own overlap-safe system --
    // "Add New Season" pushes a new entry without touching the current one).
    draft: {
        active: { type: Boolean, default: false }, // true once any draft field has been set
        currentSeasonTitle: { type: String, default: '' },
        bpTitle: { type: String, default: 'Battle Pass' },
        rankTitle: { type: String, default: 'Ranked Series' },
        dmzTitle: { type: String, default: 'DMZ Season' },
        bpEnd: { type: Date },
        rankEnd: { type: Date },
        dmzEnd: { type: Date },
        bpEndTBD: { type: Boolean, default: false },
        rankEndTBD: { type: Boolean, default: false },
        dmzEndTBD: { type: Boolean, default: false },
        newDraws: [{
            title: { type: String },
            date: { type: Date },
            thumbnailUrl: { type: String },
            items: [{ tier: { type: String }, name: { type: String } }]
        }],
        returningDraws: [{
            title: { type: String },
            date: { type: Date },
            thumbnailUrl: { type: String },
            items: [{ tier: { type: String }, name: { type: String } }]
        }],
        calendar: [{
            title: { type: String },
            date: { type: Date },
            endDate: { type: Date },
            isOngoing: { type: Boolean, default: false },
            category: { type: String, enum: ['draw', 'event', 'playlist'], default: 'event' }
        }],
        drawsBannerUrl: { type: String, default: '' },
        eventsBannerUrl: { type: String, default: '' },
        playlistsBannerUrl: { type: String, default: '' }
    }
});

module.exports = mongoose.model('SeasonalData', SeasonalDataSchema);