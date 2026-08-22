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
    return url.pathname.split('/').filter(Boolean)[index];
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

module.exports = { readJsonBody, segment, sendJson, forbidden };
