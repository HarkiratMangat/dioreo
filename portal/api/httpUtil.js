// portal/api/httpUtil.js
//
// Tiny shared helpers every portal/api/*.js route uses. No framework — this project's node:http server has no body parser or path-param extraction, so these exist once here instead of five times.
function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let raw = '';
        req.on('data', (c) => { raw += c; });
        req.on('end', () => {
            if (!raw) return resolve({});
            try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
        });
        req.on('error', reject);
    });
}

// Nth non-empty path segment, e.g. segment(url, 2) on /api/changeset/abc123/commit -> 'abc123'.
function segment(url, index) {
    const raw = url.pathname.split('/').filter(Boolean)[index];
    if (raw === undefined) return raw;
    // 🔴 DECODED, BECAUSE A CHANGE ID CONTAINS A CHARACTER A URL RESERVES. `2026-09-02 22:41 EDT`: ChangeLog ids have been `#1`-shaped since 2026-08-23 (utils/changeStore.js), and `getChange()` matches the stored string exactly. Without this, a correctly-encoded `/api/revert/%231` looked up the literal `%231` and answered "no such change" — a 404 that reads as a missing row rather than as a seam, on the most dangerous button in the portal. Every other id routed through here is an ObjectId, which is why nothing caught it: the one id that needed decoding was the one nobody had ever reverted from the web. ⚠️ A malformed sequence throws URIError; return it verbatim rather than 500ing on a bad request — the lookup will miss and the caller's own 404 is the right answer.
    try { return decodeURIComponent(raw); } catch { return raw; }
}

// The res.writeHead(status, {...}); res.end(JSON.stringify(body)) pair, written out 20+ times across portal/api/*.js before this existed (simplify review).
function sendJson(res, status, body) {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
}

// 403 with a consistent {error: reason} body — every realm's initial-load fetch checks this exact field to decide whether to render its "no access" state.
function forbidden(res, reason) {
    sendJson(res, 403, { error: reason });
}

// 🔴 A MALFORMED ID IS A CLIENT MISTAKE AND WAS BEING REPORTED AS A SERVER ERROR. Every route that looks a document up by a client-supplied id handed the raw string to Mongoose, which throws a CastError on anything that is not 24 hex characters — so `?id=x` produced a **500** with a full stack trace in the log and "Something went wrong. It has been logged." in the response. Found by curling the real server for the first time; six call sites across two files had it.
//
// ⚠️ It matters beyond tidiness in two ways: a 500 tells the caller to retry and tells the operator to investigate, both wrong here; and a log filling with stack traces from bad input is a log where a real 500 stops standing out.
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
function isObjectId(value) {
    return typeof value === 'string' && OBJECT_ID.test(value);
}

module.exports = { readJsonBody, segment, sendJson, forbidden, isObjectId };
