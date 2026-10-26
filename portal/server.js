// portal/server.js
//
// The portal's HTTP entry point. It routes, serves static files and catches errors. It contains NO business logic and performs NO direct Mongo write — a route parses a request into an op and hands it to core/changeset.js.
//
// ⚠️ RUNTIME-AGNOSTIC ON PURPOSE. Every setting arrives through the environment; nothing assumes the repo layout, a sibling bot process or a writable filesystem beyond portal/public. That is what keeps a later move to Cloud Run a config change rather than a rewrite.
require('dotenv').config({ quiet: true }); // same backfill role as index.js's own call — real values come from --env-file/systemd's EnvironmentFile; see the dotenv-backfill-trap note in CLAUDE.md
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require('mongoose');
const { patchConsole } = require('../utils/logger');

// `patchConsole({ service: 'dioreo-portal' })` groups this process's errors separately from the bot's in Cloud Error Reporting — see utils/logger.js's patchConsole/writeStructured for how the override actually reaches the serviceContext (it used to be a silent no-op; fixed in this task).
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

// Static file serving for portal/public — the built frontend (scripts/buildPortal.js's output). Deliberately minimal: no directory listing, no range requests. This is an admin-only, low-traffic surface; a CDN-grade static server is not the problem this file exists to solve.
//
// 🔴 IT DOES SEND ONE CACHE HEADER, AND "the browser default" WAS NOT A NEUTRAL CHOICE. With no Cache-Control at all a browser applies HEURISTIC caching — roughly a tenth of the file's age since Last-Modified — so an asset that has sat on disk for a day is held for hours. The harness escapes this because buildPortal stamps a content hash into every URL it writes; the real portal's index.html carries no such stamp, so `/ui/track.js` is one URL forever. Measured 2026-08-28: after a rebuild AND a server restart, dev-portal.dioreo.app served a five-hour-old module graph through four reloads while `curl` against the same origin returned the new bytes — the page and the terminal disagreed, and the page looked like the code had not changed. `no-cache` means revalidate, not "do not store": correctness over a few kilobytes on a surface with one user.
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function serveStatic(req, res, url, env) {
    // Reject any path segment that could escape PUBLIC_DIR (../, encoded or not) BEFORE resolving — resolving first and comparing after is the classic path-traversal mistake this avoids.
    const decoded = decodeURIComponent(url.pathname);
    if (decoded.includes('..')) { res.writeHead(400); return res.end('Bad request'); }
    const rel = decoded === '/' ? '/index.html' : decoded;
    const full = path.join(PUBLIC_DIR, rel);
    if (!full.startsWith(PUBLIC_DIR)) { res.writeHead(400); return res.end('Bad request'); }
    fs.readFile(full, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        const ext = path.extname(full);
        const headers = { 'content-type': MIME[ext] || 'application/octet-stream' };
        // The document and everything it executes. A stale one of these is a portal that silently disagrees with its own source.
        if (ext === '.html' || ext === '.js' || ext === '.mjs' || ext === '.css') headers['cache-control'] = 'no-cache, must-revalidate';
        const out = (ext === '.html' && pinEnabled(env)) ? Buffer.from(injectPin(data.toString('utf8'))) : data;
        res.writeHead(200, headers);
        res.end(out);
    });
}

// ── THE ANNOTATION OVERLAY — DEV ONLY, and every branch below is gated on this one function (2026-09-09 21:39 EDT).
//
// 🔴 IT IS MOUNTED IN THE PAGE BECAUSE IT CANNOT BE A PROXY. `portal/auth.js` derives the origin from the REQUEST: the session cookie is host-only by design and the OAuth redirect_uri must be an origin registered on the Discord application. Serving the live portal under a second origin breaks sign-in and needs a redirect URI only Harkirat can register. In the page there is no second origin.
//
// ⚠️ THIS IS THE ONE PLACE THIS FILE REACHES OUTSIDE `portal/public`, against its own header rule. It is deliberate and it is fenced: the note file is a developer's scratch file, the branch cannot be reached in production, and a failed write is swallowed rather than answered as an error, because losing a note must not look like a broken portal.
function pinEnabled(env) { return env !== 'production'; }
const PIN_SCRIPT = path.join(__dirname, 'dev', 'pin.js');
const PIN_NOTES = path.join(__dirname, '..', 'local', 'portal-sync-notes.md');
// ⚠️ THE CAP ROSE FROM 20KB TO 8MB BECAUSE A NOTE CAN NOW CARRY A CROP, and it is still a cap: a paste is a base64 PNG, and an unbounded body on a route this permissive is how a dev convenience becomes a way to fill a disk. A ⌘⇧4 crop of a panel runs a few hundred KB.
const PIN_MAX = 8 * 1024 * 1024;
// 🔴 CROPS LAND OUTSIDE `portal/public`, DELIBERATELY. Everything under that directory is handed to anyone who reaches the origin by `serveStatic`; a screenshot of an admin console showing real records is precisely the thing that must not become a URL. `local/` is gitignored and unserved.
const PIN_SHOTS = path.join(__dirname, '..', 'local', 'portal-pins');

function servePinScript(res) {
    fs.readFile(PIN_SCRIPT, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'content-type': 'text/javascript', 'cache-control': 'no-cache, must-revalidate' });
        res.end(data);
    });
}

function readPinNote(req, res) {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > PIN_MAX) req.destroy(); });
    req.on('end', () => {
        let n;
        try { n = JSON.parse(body); } catch { res.writeHead(400); return res.end('bad json'); }
        // ⚠️ `YYYY-MM-DD HH:MM TZ`, WHICH IS THE ONLY TIMESTAMP SHAPE THIS REPO USES. The first version wrote `toLocaleString('en-US')`, which produced `9/9/2026, 21:58:06 EDT` — a US-locale string in a file every other line of which is ISO-first, and unsortable next to them. The zone is READ rather than hardcoded, so this stays correct across the EDT/EST boundary instead of lying for four months of the year.
        const now = new Date(), TZ = 'America/New_York';
        const stamp = now.toLocaleDateString('en-CA', { timeZone: TZ })
            + ' ' + now.toLocaleTimeString('en-GB', { timeZone: TZ, hour12: false }).slice(0, 5)
            + ' ' + now.toLocaleTimeString('en-US', { timeZone: TZ, timeZoneName: 'short' }).split(' ').pop();
        const id = 'p' + Date.now().toString(36);

        let shotLine = '';
        if (typeof n.shot === 'string' && n.shot.startsWith('data:image/')) {
            try {
                fs.mkdirSync(PIN_SHOTS, { recursive: true });
                const ext = (n.shot.slice(11).split(';')[0] || 'png').replace(/[^a-z0-9]/g, '') || 'png';
                fs.writeFileSync(path.join(PIN_SHOTS, `${id}.${ext}`), Buffer.from(n.shot.split(',')[1] || '', 'base64'));
                shotLine = `\n![pin ${id}](portal-pins/${id}.${ext})\n`;
            } catch { /* a missing crop makes a worse note, never a failed one */ }
        }

        // A REGION names whose space it is; an ELEMENT names itself. Both carry the frame.
        const where = n.kind === 'region' && n.region
            ? `**Region** ${n.rect || ''} inside \`${n.region.owner}\`\n`
                + `**Its spacing:** ${n.region.spacing}\n`
                + `**Between:** above ${n.region.above} · below ${n.region.below} · left ${n.region.left} · right ${n.region.right}\n`
            : `**Element:** \`${n.selector || '?'}\` · ${n.rect || ''}\n`
                + `**It shows:** ${(n.shows || '').replace(/\n/g, ' ')}\n`;

        const entry = `\n## ${n.realm || 'unknown'} — ${stamp} · ${id} · from the dev-portal overlay\n`
            + where
            + `**Frame:** route ${n.route || ''} · scroll ${n.scroll || '?'} · viewport ${n.viewport || '?'}\n`
            + shotLine
            + `\n${n.text || ''}\n`;
        try { fs.appendFileSync(PIN_NOTES, entry); } catch { /* a scratch note is never worth a 500 */ }
        res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ id }));
    });
}

// The tag is injected rather than built into index.html, so `scripts/buildPortal.js` stays ignorant of it and a production build cannot carry it even by accident.
function injectPin(html) {
    return html.replace('</body>', '<script src="/__pin.js" defer></script>\n</body>');
}

function createServer({ port, mongoUri, env }) {
    assertEnvironment({ env, mongoUri });
    const server = http.createServer(async (req, res) => {
        // ONE top-level catch, mirroring handlers/router.js's crash net. A thrown route must never take the process down — the portal is a convenience; being down must be quiet, not fatal.
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const match = ROUTES.find(r => r.method === req.method && r.pattern.test(url.pathname));
            if (!match) {
                if (pinEnabled(env) && req.method === 'GET' && url.pathname === '/__pin.js') return servePinScript(res);
                if (pinEnabled(env) && req.method === 'POST' && url.pathname === '/__pin/note') return readPinNote(req, res);
                if (req.method === 'GET' && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/auth/')) {
                    return serveStatic(req, res, url, env);
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

module.exports = { createServer, assertEnvironment, route, ROUTES, pinEnabled, injectPin, PIN_SHOTS, PIN_NOTES, PUBLIC_DIR };

// Registered AFTER the export above, mirroring core/ops/index.js's own fix for the exact same hazard: these modules require('../auth') and this file's `route`, so if they were required before module.exports was assigned, `route` would still be undefined at the moment they read it.
require('./auth').registerAuthRoutes(route);
require('./api/changesets').register(route);
require('./api/season').register(route);
require('./api/armory').register(route);
require('./api/broadcast').register(route);
require('./api/access').register(route);
require('./api/analytics').register(route);
require('./api/review').register(route);
require('./api/dates').register(route);
require('./api/bulk').register(route);

// 🔴 THE ACTUAL BOOTSTRAP — found missing in code review. Every earlier manual check in this repo exercised createServer() via a one-off `node -e` one-liner that called it directly, which never exposed that running this file the way the systemd unit and package.json's "portal" script both do (`node portal/server.js`) executed NOTHING: module.exports was assigned and the routes were wired, but nothing ever called mongoose.connect() or createServer() itself. Every Mongoose query would have buffered forever against a connection that was never opened. Mirrors index.js's own connect-then-log pattern.
if (require.main === module) {
    const mongoUri = process.env.MONGODB_URI;
    const env = process.env.NODE_ENV || 'development';
    const port = Number(process.env.PORTAL_PORT) || 8787;
    mongoose.connect(mongoUri)
        .then(() => {
            const host = mongoose.connection.host || 'unknown host';
            const dbName = mongoose.connection.name || 'unknown db';
            console.log(`🍃 Portal connected to MongoDB (${host}/${dbName})`);
            createServer({ port, mongoUri, env });
        })
        .catch((err) => {
            console.error('❌ Portal could not connect to MongoDB:', err);
            process.exit(1);
        });
}
