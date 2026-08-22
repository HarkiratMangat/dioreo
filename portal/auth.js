// portal/auth.js
//
// Discord OAuth (identify scope only) + host-only session cookies. The Discord token itself is discarded immediately after the callback exchanges it for a user id — this process never holds a live Discord API credential beyond the few milliseconds it takes to make that one call.
//
// 🔴 The DOOR gate is `isAdmin(userId)` — owner, or any admin holding at least one permission token. There is no separate 'portal' permission and none is added (spec §8.2): holding any `manage.*` scope, or `bot`, is what admits you. Each realm and each control re-checks its OWN scope server-side afterwards — requireAdmin below only answers "may this person open the door at all".
const crypto = require('node:crypto');
const https = require('node:https');
const PortalSession = require('../models/PortalSession');
const { isAdmin, isOwner } = require('../utils/adminAccess');

const SESSION_COOKIE = 'portal_session';
const STATE_COOKIE = 'portal_oauth_state';
const SESSION_MAX_AGE = 12 * 60 * 60; // seconds — matches PortalSession's Mongo TTL

function randomToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

function hashSession(raw) {
    return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function buildAuthorizeUrl({ clientId, redirectUri, state }) {
    const u = new URL('https://discord.com/api/oauth2/authorize');
    u.searchParams.set('client_id', clientId);
    u.searchParams.set('redirect_uri', redirectUri);
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('scope', 'identify');
    u.searchParams.set('state', state);
    return u.toString();
}

// Not a true constant-time compare across unequal lengths (timingSafeEqual throws on that), but a length mismatch leaks nothing an attacker doesn't already know (state tokens are a fixed length), and the fallback keeps this from ever throwing on a forged/missing value.
function verifyState(received, expected) {
    if (!received || !expected) return false;
    const a = Buffer.from(String(received));
    const b = Buffer.from(String(expected));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function cookieAttrs({ maxAge } = {}) {
    // No `Domain` attribute — a host-only cookie is never sent to dioreo.app, which is the whole reason portal.dioreo.app is a separate subdomain (spec decision 8).
    const parts = ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax'];
    if (maxAge != null) parts.push(`Max-Age=${maxAge}`);
    return parts;
}

function buildCookie(rawSessionId) {
    return [`${SESSION_COOKIE}=${rawSessionId}`, ...cookieAttrs({ maxAge: SESSION_MAX_AGE })].join('; ');
}

function buildStateCookie(state) {
    return [`${STATE_COOKIE}=${state}`, ...cookieAttrs({ maxAge: 600 })].join('; '); // 10 min to finish login
}

function clearCookie(name) {
    return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function parseCookies(req) {
    const header = req.headers.cookie || '';
    const out = {};
    for (const part of header.split(';')) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
    return out;
}

// A tiny promise-wrapped HTTPS request — no axios/node-fetch dependency for two calls.
function discordRequest({ method, path: reqPath, body, headers }) {
    return new Promise((resolve, reject) => {
        const data = body ? Buffer.from(body) : null;
        const req = https.request({
            hostname: 'discord.com', path: reqPath, method,
            headers: { ...headers, ...(data ? { 'content-length': data.length } : {}) },
        }, (res) => {
            let chunks = '';
            res.on('data', (c) => { chunks += c; });
            res.on('end', () => {
                if (res.statusCode >= 400) return reject(new Error(`Discord API ${reqPath} -> ${res.statusCode}: ${chunks}`));
                try { resolve(JSON.parse(chunks)); } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function exchangeCode({ code, clientId, clientSecret, redirectUri }) {
    const body = new URLSearchParams({
        client_id: clientId, client_secret: clientSecret,
        grant_type: 'authorization_code', code, redirect_uri: redirectUri,
    }).toString();
    return discordRequest({
        method: 'POST', path: '/api/oauth2/token', body,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
}

async function fetchDiscordUser(accessToken) {
    return discordRequest({ method: 'GET', path: '/api/users/@me', headers: { authorization: `Bearer ${accessToken}` } });
}

function startOAuth(req, res) {
    const state = randomToken(16);
    const clientId = process.env.DISCORD_OAUTH_CLIENT_ID;
    const redirectUri = `${process.env.PORTAL_PUBLIC_URL}/auth/callback`;
    res.writeHead(302, { Location: buildAuthorizeUrl({ clientId, redirectUri, state }), 'Set-Cookie': buildStateCookie(state) });
    res.end();
}

async function handleCallback(req, res, url) {
    const cookies = parseCookies(req);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    if (!verifyState(state, cookies[STATE_COOKIE])) {
        res.writeHead(400, { 'content-type': 'text/plain' });
        return res.end('Login failed: invalid or expired state.');
    }
    const clientId = process.env.DISCORD_OAUTH_CLIENT_ID;
    const clientSecret = process.env.DISCORD_OAUTH_CLIENT_SECRET;
    const redirectUri = `${process.env.PORTAL_PUBLIC_URL}/auth/callback`;

    let discordId;
    try {
        const token = await exchangeCode({ code, clientId, clientSecret, redirectUri });
        const user = await fetchDiscordUser(token.access_token);
        discordId = user.id;
        // `token` and `user` fall out of scope here — no Discord credential is ever persisted.
    } catch (error) {
        console.error('Portal OAuth exchange failed:', error);
        res.writeHead(502, { 'content-type': 'text/plain' });
        return res.end('Could not complete Discord sign-in.');
    }

    const rawSessionId = randomToken(32);
    await PortalSession.create({
        sessionHash: hashSession(rawSessionId),
        discordId,
        userAgent: (req.headers['user-agent'] || '').slice(0, 300),
    });

    res.writeHead(302, { Location: '/', 'Set-Cookie': [buildCookie(rawSessionId), clearCookie(STATE_COOKIE)] });
    res.end();
}

async function sessionFor(req) {
    const cookies = parseCookies(req);
    const raw = cookies[SESSION_COOKIE];
    if (!raw) return null;
    const sessionHash = hashSession(raw);
    const row = await PortalSession.findOne({ sessionHash });
    if (!row || row.revokedAt) return null;
    row.lastSeenAt = new Date();
    await row.save();
    return { discordId: row.discordId, sessionId: sessionHash };
}

function csrfToken(session) {
    // Derived deterministically from the session hash rather than stored separately — nothing new to persist, and it changes automatically if the session ever does.
    return crypto.createHash('sha256').update(`csrf:${session.sessionId}`).digest('hex');
}

function verifyCsrf(req, session) {
    const header = req.headers['x-csrf-token'];
    if (!header || !session) return false;
    return verifyState(header, csrfToken(session));
}

// The DOOR gate, not a realm gate. Every mutating request additionally needs a valid CSRF token (H10) — checked here so no route can forget it. Each realm's own routes layer their own page/owner/command scope check on top of this.
function requireAdmin(handler) {
    return async (req, res, url) => {
        const session = await sessionFor(req);
        if (!session) {
            res.writeHead(401, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: 'not signed in' }));
        }
        if (!(await isAdmin(session.discordId))) {
            res.writeHead(403, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: 'forbidden' }));
        }
        if (req.method !== 'GET' && !verifyCsrf(req, session)) {
            res.writeHead(403, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: 'missing or invalid CSRF token' }));
        }
        return handler(req, res, url, session);
    };
}

function registerAuthRoutes(route) {
    route('GET', /^\/auth\/login$/, async (req, res) => startOAuth(req, res));
    route('GET', /^\/auth\/callback$/, handleCallback);
    route('GET', /^\/auth\/csrf$/, requireAdmin(async (req, res, url, session) => {
        // Code review Important #4: the nav rail showed all 5 realms regardless of what the signed-in admin actually holds, unlike this codebase's own established convention (/manage's getManagePages() filters its dropdown the same way). Computed here, once, so every realm page and the Shell agree on the same list rather than each re-deriving it.
        const { getManagePages, hasCommandAccess } = require('../utils/adminAccess');
        const { SEASON_PAGES } = require('./api/season');
        const { ARMORY_PAGES } = require('./api/armory');
        const { BROADCAST_PAGES } = require('./api/broadcast');
        const owner = isOwner(session.discordId);
        const pages = await getManagePages(session.discordId);
        const visibleRealms = [];
        if (owner || pages.some(p => SEASON_PAGES.includes(p))) visibleRealms.push('season');
        if (owner || pages.some(p => ARMORY_PAGES.includes(p))) visibleRealms.push('armory');
        if (owner || pages.some(p => BROADCAST_PAGES.includes(p))) visibleRealms.push('broadcast');
        if (owner) visibleRealms.push('access');
        if (owner || (await hasCommandAccess(session.discordId, 'bot'))) visibleRealms.push('analytics');
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ csrfToken: csrfToken(session), discordId: session.discordId, isOwner: owner, visibleRealms }));
    }));
    route('POST', /^\/auth\/logout$/, requireAdmin(async (req, res, url, session) => {
        await PortalSession.updateOne({ sessionHash: session.sessionId }, { revokedAt: new Date() });
        res.writeHead(302, { Location: '/', 'Set-Cookie': clearCookie(SESSION_COOKIE) });
        res.end();
    }));
}

module.exports = {
    buildAuthorizeUrl, verifyState, hashSession, buildCookie,
    startOAuth, handleCallback, sessionFor, requireAdmin, csrfToken, verifyCsrf, registerAuthRoutes,
};
