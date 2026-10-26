// utils/algoFingerprint.js -- a stable identity for a piece of ALGORITHM, used as a cache key.
//
// Built 2026-08-11 15:44 EDT after Harkirat rejected the first version-marker design, correctly. That one tagged a stored palette with the RELEASE that last changed it (`v3.8.0-pre`), which has two problems: the string only moves when a human remembers to move it (so a real algorithm change can ship with a stale tag and every cached value silently stays wrong), and naming it after a release invites bumping it every release (so identical output gets re-derived for nothing). His framing was the fix: *"there's a unique versioning for the actual algorithm"* -- the key should identify the code that produced the value, not the version we happened to ship it in.
//
// So the key is DERIVED from the code. Pass the functions and constants that determine the output; the hash changes when and only when they do. Nobody maintains it, and no release bump touches it.
//
// ⚠️ COMMENTS AND WHITESPACE ARE STRIPPED BEFORE HASHING, and that is not cosmetic -- this codebase is deliberately comment-dense and those comments get edited constantly. Hashing raw source would invalidate every cached value every time someone clarified a sentence, which is exactly the "re-derive for identical output" cost this design exists to avoid.
//
// ⚠️ It errs toward OVER-invalidating: renaming a local or reordering equivalent statements changes the hash without changing the output. That direction is deliberate. A false invalidation costs one re-derive of a metadata field; a MISSED invalidation leaves a wrong value cached forever behind a key that swears it is current. The failure modes are not symmetric, so the cheap one is chosen.
const crypto = require('crypto');

// Not a general-purpose JS comment stripper and does not need to be: a `//` inside a string literal would be removed along with the rest of its line, which changes the hash but stays DETERMINISTIC -- and determinism is the only property the key actually requires. Verified against the real inputs (the only slashes in them are inside `'image/png'`), but the guarantee does not rest on that.
function normalize(text) {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\/\/[^\n]*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Functions are hashed by their source; anything else by its JSON. 12 hex chars is ~48 bits, far past what a handful of algorithm revisions could ever collide in, and short enough to read in the Cloudinary console next to the palette it stamps.
function fingerprint(...parts) {
    const material = parts
        .map(p => (typeof p === 'function' ? normalize(p.toString()) : JSON.stringify(p)))
        .join('|');
    return crypto.createHash('sha256').update(material).digest('hex').slice(0, 12);
}

module.exports = { fingerprint };
