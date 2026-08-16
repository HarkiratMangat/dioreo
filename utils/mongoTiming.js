// ==========================================
// MONGO TIMING -- Atlas dependency timing at the one chokepoint that exists
// ==========================================
// Added 2026-08-16 (observability layer stage 2). "Atlas" is one of the four external dependencies the
// design's §5 names, but unlike Cloudinary or Vertex there is no module to wrap: Mongoose queries are
// issued from dozens of places. Every one of them funnels through Query.prototype.exec and
// Aggregate.prototype.exec, so those two are the client wrapper.
//
// ⚠️ WHY THIS SHAPE AND NOT A MONGOOSE PLUGIN WITH pre/post HOOKS: a post hook that forgets to call
// next() deadlocks every query in the bot, and a plugin has to be registered before any model compiles
// or it silently covers only some of them. This patch has neither failure mode -- the original exec is
// called with the original `this` and arguments, its return value is returned unchanged, and the
// observation is a `.then()` on a DERIVED promise that is thrown away. Because that .then() supplies
// BOTH handlers, it can never produce an unhandled rejection, and because the original promise is what
// the caller receives, their own .catch() is unaffected.
//
// Timing is aggregated per interaction by name, so a handler making 30 queries contributes one deps
// row reading { name: 'atlas', ms: <total>, calls: 30 } rather than 30 rows.
//
// Must be required BEFORE any model is used. index.js does it at the top of its require block.

const mongoose = require('mongoose');
const { noteDep } = require('./eventStore');

let patched = false;

function installMongoTiming() {
    if (patched) return;
    patched = true;

    for (const proto of [mongoose.Query.prototype, mongoose.Aggregate.prototype]) {
        const original = proto.exec;
        if (typeof original !== 'function') continue;
        proto.exec = function (...args) {
            const started = Date.now();
            const result = original.apply(this, args);
            if (result && typeof result.then === 'function') {
                result.then(
                    () => noteDep('atlas', Date.now() - started, true),
                    () => noteDep('atlas', Date.now() - started, false),
                );
            }
            return result;
        };
    }
}

module.exports = { installMongoTiming };
