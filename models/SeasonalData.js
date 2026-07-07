const mongoose = require('mongoose');

const SeasonalDataSchema = new mongoose.Schema({
    docType: { type: String, default: 'global', unique: true },

    // NOTE (added during review): these four titles are set by the "Initialize New Season" and
    // "Edit Season Titles" admin modals (index.js ADMIN ROUTE A / J), and read as fallback display
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

    // /patchnotes
    patchNotes: [{
        title: { type: String }, // Now holds just the season # & name (e.g. "Season 6: Take Your Heart"),
        // not the full "Balance Changes for..." string — see patchnotes.js
        description: { type: String, default: '' }, // Optional extra info; left blank shows nothing
        releaseDate: { type: Date },
        images: [{ type: String }] // Cloudinary URLs
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
        isOngoing: { type: Boolean, default: false } // true for "All Season" bulk entries
    }]
});

module.exports = mongoose.model('SeasonalData', SeasonalDataSchema);