const os = require('os');

// Fire-and-forget write to the RenderTiming collection (see models/RenderTiming.js for why this
// collection exists and why it's separate). Never awaited by a caller and never throws outward — a
// Mongo hiccup while logging instrumentation must not be the thing that breaks an actual /colors
// interaction. Mirrors the same "never let the observability path take down the real path" rule
// utils/alertStore.js already follows for AlertLog.
function logRenderTiming(fields) {
    try {
        const RenderTiming = require('../models/RenderTiming');
        RenderTiming.create({ host: os.hostname(), ...fields }).catch(err => {
            console.error('RenderTiming write failed (non-fatal):', err.message);
        });
    } catch (err) {
        console.error('RenderTiming logging failed (non-fatal):', err.message);
    }
}

module.exports = { logRenderTiming };
