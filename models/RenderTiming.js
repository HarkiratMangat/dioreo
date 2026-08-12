const mongoose = require('mongoose');

// Instrumentation for the /colors subsystem's two independently-slow paths — added 2026-08-11 22:51
// EDT to lay groundwork for a later perf-investigation session (subpage-switch snappiness + WebP
// cold-start timing, both flagged as "felt slower" but unconfirmed from screenshots alone). Deliberately
// its OWN collection, not a field tacked onto an existing one — the render-time numbers the WebP cache
// modules already compute (`renderMs` in nameplateWebpCache.js/decorationWebpCache.js) were only ever
// posted as Discord cache-channel messages, which a dev cache purge (or a real Discord outage) can wipe
// with no trace left behind. This collection is never touched by a Cloudinary/Discord-channel purge, so
// it's the durable copy — any future purge should leave this alone; if you're about to purge/clear it
// yourself, that's a decision for whoever's using the timing data, not routine cache housekeeping.
//
// Two `area` values share this collection rather than getting two: they're the same investigation
// (perceived /colors slowness) and a shared collection makes "compare panel vs. render time on the
// same day" a single query instead of a join.
const RenderTimingSchema = new mongoose.Schema({
    area: { type: String, required: true },     // 'colors_panel' | 'webp_render'
    action: { type: String, required: true },    // colors_panel: 'view'|'variant'|'page'|'subpage'|'refresh'; webp_render: 'nameplate'|'decoration'
    source: { type: String },                     // avatar/banner/name/nameplate/decoration (colors_panel only)
    subpage: { type: Number },
    variant: { type: String },                    // 'global' | 'server' (colors_panel only)
    cold: { type: Boolean },                       // true = this call actually re-extracted/re-rendered, false = cache hit
    durationMs: { type: Number, required: true },
    discordId: { type: String },
    guildId: { type: String },
    // Bookkeeping for whoever reads this later — which host/instance recorded it, since dev and prod
    // could both write here in principle (they don't share a Mongo URI today, but nothing enforces that).
    host: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('RenderTiming', RenderTimingSchema);
