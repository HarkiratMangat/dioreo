// portal/server.js
//
// The portal's HTTP entry point. It routes, serves static files and catches errors. It contains NO
// business logic and performs NO direct Mongo write — a route parses a request into an op and hands
// it to core/changeset.js.
//
// ⚠️ RUNTIME-AGNOSTIC ON PURPOSE. Every setting arrives through the environment; nothing assumes the
// repo layout, a sibling bot process or a writable filesystem beyond portal/public. That is what
// keeps a later move to Cloud Run a config change rather than a rewrite.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { patchConsole } = require('../utils/logger');

// `patchConsole({ service: 'dioreo-portal' })` groups this process's errors separately from the
// bot's in Cloud Error Reporting — see utils/logger.js's patchConsole/writeStructured for how the
// override actually reaches the serviceContext (it used to be a silent no-op; fixed in this task).
patchConsole({ service: 'dioreo-portal' });

function assertEnvironment({ env, mongoUri }) {
    if (!mongoUri) throw new Error('Refusing to start: MONGODB_URI is not set. There is no default.');
    const looksDev = /dev/.test(mongoUri) || /localhost|127\.0\.0\.1/.test(mongoUri);
    if (env === 'production' && looksDev) {
        throw new Error(`Refusing to start: NODE_ENV=production but MONGODB_URI looks like a dev database (${mongoUri.replace(/\/\/[^@]*@/, '//***@')}).`);
    }
    if (env !== 'production' && !looksDev) {
        throw new Error('Refusing to start: NODE_ENV is not production but MONGODB_URI looks like the LIVE database. This is how a dev session writes to prod.');
    }
    return true;
}

const ROUTES = [];
const route = (method, pattern, handler) => ROUTES.push({ method, pattern, handler });

// Static file serving for portal/public — the built frontend (scripts/buildPortal.js's output).
// Deliberately minimal: no directory listing, no range requests, no caching headers beyond the
// browser default. This is an admin-only, low-traffic surface; a CDN-grade static server is not
// the problem this file exists to solve.
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function serveStatic(req, res, url) {
    // Reject any path segment that could escape PUBLIC_DIR (../, encoded or not) BEFORE resolving —
    // resolving first and comparing after is the classic path-traversal mistake this avoids.
    const decoded = decodeURIComponent(url.pathname);
    if (decoded.includes('..')) { res.writeHead(400); return res.end('Bad request'); }
    const rel = decoded === '/' ? '/index.html' : decoded;
    const full = path.join(PUBLIC_DIR, rel);
    if (!full.startsWith(PUBLIC_DIR)) { res.writeHead(400); return res.end('Bad request'); }
    fs.readFile(full, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        const ext = path.extname(full);
        res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
}

function createServer({ port, mongoUri, env }) {
    assertEnvironment({ env, mongoUri });
    const server = http.createServer(async (req, res) => {
        // ONE top-level catch, mirroring handlers/router.js's crash net. A thrown route must never
        // take the process down — the portal is a convenience; being down must be quiet, not fatal.
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const match = ROUTES.find(r => r.method === req.method && r.pattern.test(url.pathname));
            if (!match) {
                if (req.method === 'GET' && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/auth/')) {
                    return serveStatic(req, res, url);
                }
                res.writeHead(404); return res.end('Not found');
            }
            await match.handler(req, res, url);
        } catch (error) {
            console.error('Portal route failed:', error);
            if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain' });
            res.end('Something went wrong. It has been logged.');
        }
    });
    server.listen(port, '127.0.0.1', () => console.log(`Portal listening on 127.0.0.1:${port}`));
    return server;
}

module.exports = { createServer, assertEnvironment, route, ROUTES };

// Registered AFTER the export above, mirroring core/ops/index.js's own fix for the exact same
// hazard: these modules require('../auth') and this file's `route`, so if they were required before
// module.exports was assigned, `route` would still be undefined at the moment they read it.
require('./auth').registerAuthRoutes(route);
require('./api/changesets').register(route);
require('./api/season').register(route);
require('./api/armory').register(route);
require('./api/broadcast').register(route);
require('./api/access').register(route);
require('./api/analytics').register(route);

