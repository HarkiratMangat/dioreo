// ==========================================
// SEARCH TERM AGGREGATE
// ==========================================
// The working surface for alias design, and deliberately the half that carries NO USER LINKAGE AT
// ALL -- no userHash, no guildId, nothing attributable. "Which terms fail, and how often" is already
// a grouped question, so the grouped store answers it better than the raw events do, and this one can
// be kept indefinitely without holding anything about anybody.
//
// Why the term text is stored at all (reversed during design, and worth not re-litigating): a search
// that returned nothing is the single best input to an alias table -- people type `kilo`, the weapon
// is `KILO 141`, nothing matched -- and that fix is only findable if the term survives.
//
// ⚠️ This is NOT message content and must never be described as such. Text typed into a slash
// command's own field is deliberately sent to the Bot; that is how commands work. The "we cannot read
// your messages" claim in docs/legal/PRIVACY.md concerns the MESSAGE CONTENT intent, which this app
// does not hold, and is entirely unaffected. See PRIVACY §2.4b.
//
// The term is normalised (lowercased, trimmed, whitespace-collapsed) and capped at 100 characters by
// utils/eventStore.js's normalizeTerm() before it ever reaches here, so a mis-paste into the wrong
// field cannot dump a wall of text into a permanent record.

const mongoose = require('mongoose');

const SearchTermSchema = new mongoose.Schema({
    term: { type: String, required: true },
    command: { type: String, required: true },
    field: { type: String, required: true },
    searches: { type: Number, default: 0 },
    zeroResults: { type: Number, default: 0 },  // the ones that matter -- these are the alias candidates
    picked: { type: Number, default: 0 },       // the user went on to run the command afterwards
    firstSeen: { type: Date },
    lastSeen: { type: Date },
});

// The upsert key. Also the only index -- every read of this collection is either "one term" or a full
// scan for the failed-searches report, and it is small by construction (one row per distinct term).
SearchTermSchema.index({ term: 1, command: 1, field: 1 }, { unique: true });

module.exports = mongoose.model('SearchTerm', SearchTermSchema);
