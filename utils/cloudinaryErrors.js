// utils/cloudinaryErrors.js
//
// The one sanitizer for Cloudinary errors, shared by every module that calls Cloudinary (2026-11-08 01:15 EST, replacing ten identical copies, one per module; the v3 sweep of 2026-10-20 filed the duplication).
//
// SECURITY: never log a raw Cloudinary error object directly -- caught live during review, the Admin API's rejected-promise shape is `{ request_options: { ..., auth: 'api_key:api_secret' }, error: { message, http_code } }`, meaning `console.error('...', err)` (or any fallback like `err.message || err`, which still logs the whole object when `.message` is missing) prints the account's live API key AND secret in plaintext straight to the console/log aggregator. These two helpers are the ONLY sanctioned way to read a Cloudinary error anywhere in this file -- the upload API's errors carry `.message`/`.http_code` directly, while the Admin API's (used by `getCachedUrl`) nest them one level under `.error` instead, so both shapes need checking.
// So every catch logs safeErrorMessage(err), and branches on errorHttpCode(err) (the Admin API nests http_code under `.error`), never on the raw object.

function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}

function errorHttpCode(err) {
    return err?.http_code ?? err?.error?.http_code ?? null;
}

module.exports = { safeErrorMessage, errorHttpCode };
