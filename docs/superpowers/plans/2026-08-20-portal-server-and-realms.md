---
kind: plan
status: frozen
---

# Portal server and realms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ⚠️ **`status: frozen` and the checkbox syntax below are not in conflict, though they read that way.** `doc-frontmatter` allows a `kind: plan` only `frozen` or `superseded`, and `frozen` here governs the plan's **design content** — its tasks, code and reasoning are a dated snapshot and must not be quietly rewritten. The `- [ ]` boxes are the *executing* session's progress marks. **Tick boxes; do not revise tasks.** If a task turns out to be wrong, that is a finding to raise and a new dated plan, not an edit.

**Goal:** Stand up `portal.dioreo.app` — a Node server on the existing VM behind a Cloudflare Tunnel, authenticated by Discord OAuth, serving a Preact frontend that drives the operation core through a thin API.

**Architecture:** One origin, one process, one deploy. The VM serves both the page and the API, so there is no CORS and no split routing. Every mutation goes through `core/changeset.js` — the server contains no business logic and no direct Mongo write. Runtime-agnostic by discipline: plain Node, all config via env, so containerising for Cloud Run later is a config change.

**Tech Stack:** Node 24 (CommonJS), `node:http` (no framework), Mongoose 9, Preact + htm vendored with no bundler, `cloudflared` as a systemd unit.

**Spec:** `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md`

**Depends on:** plans 1 and 2 — every entity must be on the core before the portal has anything to drive. **Also depends on plan 1 Task 0b**, without which requiring the permission layer pulls discord.js and jimp into this process.

**Approved visual design:** `docs/superpowers/mockups/2026-08-20-portal/` (**tracked**; six screens — a convenience copy also exists at `local/portal-mockups/`). Open them before building any surface. Spec §9 records the rules; the mockups are what was approved.

## Global Constraints

- **The server contains no business logic.** A route parses a request into an op and calls the core. If a route touches Mongo directly, it is wrong.
- **Permissions resolve server-side on every request.** The client is never trusted for anything, including which realm it may see.
- **Colour = topic. Shape = state.** Solid fill = live · hollow dashed = staged · diagonal hatch = conflict. Do not invert.
- **The Manifest layer never switches.** Only the view layer above it does. This holds in every realm.
- **Log through `utils/logger.js`** with `service: 'dioreo-portal'`, so the portal appears in Cloud Logging and Error Reporting beside the bot but groups separately.
- No inbound firewall rule is ever opened. `cloudflared` is outbound-only.
- Tokens: `DISCORD_OAUTH_CLIENT_SECRET`, `PORTAL_SESSION_SECRET`, `PORTAL_PORT`. **Harkirat creates the OAuth secret and registers the redirect URI himself.**
- Branch off `v3-pre-release`, PR into `v3-pre-release`.

## File Structure

| Path | Responsibility |
|---|---|
| `portal/server.js` | Boot, routing table, static serving, error net. No business logic. |
| `portal/auth.js` | OAuth start/callback, session issue/verify/revoke, CSRF. |
| `portal/api/*.js` | One thin module per realm. Parse → op → core → JSON. |
| `portal/render.js` | Server-rendered shell (the door and the app frame). |
| `portal/public/**` | Built assets. Emitted by `scripts/buildPortal.js`. |
| `portal/ui/**` | Preact components, one file per realm. |
| `models/PortalSession.js` | Live sessions, for the Access realm's session list and remote sign-out. |
| `models/Changeset.js` | Staged work, so it survives a session expiry. |
| `scripts/buildPortal.js` | Emits `portal/public/` and runs `contrastAudit()` over its CSS. |

---

### Task 1: Server skeleton, logging, and the environment guard

**Files:**
- Create: `portal/server.js` · `scripts/portalBoot.test.js`
- Modify: `package.json` (a `portal` script) · **`utils/logger.js`** · **`CLAUDE.md`**

**Interfaces:**
- Consumes: `utils/logger.js`
- Produces: `createServer({ port, mongoUri, env })` → an `http.Server` · `assertEnvironment({ env, mongoUri })` → throws or returns

- [ ] **Step 1: Write the failing test**

```js
// scripts/portalBoot.test.js
// The environment guard is the first thing written because it is the one mistake that cannot be
// undone: a dev session pointed at the production database. Same failure class as the
// multiple-bot-instances rule.
const assert = require('assert');
const { assertEnvironment } = require('../portal/server');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('development refuses a production-looking database', () => {
    assert.throws(
        () => assertEnvironment({ env: 'development', mongoUri: 'mongodb+srv://x/diors-builds' }),
        /refus/i,
        'a dev portal pointed at prod must not boot'
    );
});

check('production refuses a dev-looking database', () => {
    assert.throws(
        () => assertEnvironment({ env: 'production', mongoUri: 'mongodb://localhost:27017/diors-builds-dev' }),
        /refus/i
    );
});

check('a matching pair boots', () => {
    assert.doesNotThrow(() => assertEnvironment({ env: 'development', mongoUri: 'mongodb://localhost:27017/diors-builds-dev' }));
    assert.doesNotThrow(() => assertEnvironment({ env: 'production', mongoUri: 'mongodb+srv://x/diors-builds' }));
});

check('a missing MONGODB_URI is refused, never defaulted', () => {
    assert.throws(() => assertEnvironment({ env: 'production', mongoUri: '' }), /MONGODB_URI/);
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/portalBoot.test.js` Expected: FAIL with `Cannot find module '../portal/server'`

- [ ] **Step 3: Write the skeleton**

```js
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
const { patchConsole } = require('../utils/logger');

// 🔴 `patchConsole()` TAKES NO ARGUMENTS TODAY and SERVICE_CONTEXT is a module-level const hardcoded
// to 'dioreo-bot' (utils/logger.js:69, :122, verified 2026-08-20). Passing an object here without
// changing that file is a SILENT NO-OP: portal errors would group under the bot in Error Reporting
// and nothing would indicate why. Step 2b makes the parameter real before this line means anything.
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

function createServer({ port, mongoUri, env }) {
    assertEnvironment({ env, mongoUri });
    const server = http.createServer(async (req, res) => {
        // ONE top-level catch, mirroring handlers/router.js's crash net. A thrown route must never
        // take the process down — the portal is a convenience; being down must be quiet, not fatal.
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const match = ROUTES.find(r => r.method === req.method && r.pattern.test(url.pathname));
            if (!match) { res.writeHead(404); return res.end('Not found'); }
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

module.exports = { createServer, assertEnvironment, route };
```

- [ ] **Step 2b: Make `patchConsole`'s service override real, and give the portal its own log file**

Two one-line changes in `utils/logger.js`, both backward-compatible:

```js
// utils/logger.js
function patchConsole(opts = {}) {                       // was: patchConsole()
    const ctx = { ...SERVICE_CONTEXT, ...opts };         // opts.service overrides 'dioreo-bot'
    // …use `ctx` where SERVICE_CONTEXT was read (line ~116) instead of the module const
}
```

⚠️ **And set `DIORS_LOG_FILE` for the portal unit.** `LOG_FILE` defaults to `<repo>/logs/app.log`; both systemd units run from the same `WorkingDirectory`, so bot and portal would open **independent buffered write streams on the same file** and interleave partial lines into the NDJSON the Ops Agent parses as structured records. Point the portal at `logs/portal.log` in `dioreo-portal.service` (Task 7 Step 3) and add it to the Ops Agent config.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/portalBoot.test.js` Expected: four ✓, exit 0

- [ ] **Step 5: Verify it binds loopback only**

```bash
node --env-file=.env.dev -e "require('./portal/server').createServer({port:8787,mongoUri:process.env.MONGODB_URI,env:'development'})" &
sleep 1; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8787/nope
```
Expected: `404`. **It must bind `127.0.0.1`, never `0.0.0.0`** — the tunnel is the only route in, and binding all interfaces would expose it on the VM's public IP directly.

- [ ] **Step 5b: Document the new top-level directory BEFORE committing it**

🔴 Same gate `core/` hit in plan 1 Task 1: **`docs-audit`'s `top-level-dirs` is an ERROR check** and `portal/` appears in neither `CLAUDE.md` nor `docs/README.md` (verified 2026-08-20: 0 occurrences). Add a row to `CLAUDE.md`'s 🧭 Runtime code layout table before the commit, or CI goes red on the next run.

| Path | Holds | Notes |
|---|---|---|
| **`portal/`** | The web admin portal — HTTP server, Discord OAuth, the realm API, and the built frontend | Drives `core/` and contains no business logic of its own. Served at `portal.dioreo.app` through a Cloudflare Tunnel. Design: `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md` |

- [ ] **Step 6: Commit**

```bash
git add portal/server.js utils/logger.js scripts/portalBoot.test.js package.json CLAUDE.md
git commit -m "feat(portal): add the server skeleton with an environment guard"
```

---

### Task 2: Discord OAuth and sessions

**Files:**
- Create: `portal/auth.js` · `models/PortalSession.js` · `scripts/portalAuth.test.js`
- Modify: `docs/legal/PRIVACY.md` · `portal/server.js`

**Interfaces:**
- Consumes: `utils/adminAccess.js`, `utils/owner.js`
- Produces: `startOAuth(res)` · `handleCallback(req, res, url)` · `sessionFor(req)` → `{ discordId, sessionId } | null` · `requireAdmin(handler)` · `csrfToken(session)` · `verifyCsrf(req, session)`

**⚠️ Harkirat must do two things before this task can be finished**, and neither is Claude's to do: create the OAuth client secret in the Discord Developer Portal, and register `https://portal.dioreo.app/auth/callback` as a redirect URI. The code can be written and unit-tested without either.

- [ ] **Step 1: Add the session model, and update the privacy policy in the same change**

```js
// models/PortalSession.js
//
// ⚠️ PRIVACY: this model carries a per-user Discord ID **and** a device string, which is a category
// of data this project has never stored before. docs/legal/PRIVACY.md §2 and Appendix A must name it
// with its own row and a retention answer — docs-audit's privacy-model-coverage exists precisely to
// catch a new model gaining a discordId without one.
//
// The session id is stored HASHED. The cookie holds the raw value; a database leak must not hand
// anyone a working session.
const mongoose = require('mongoose');

const PortalSessionSchema = new mongoose.Schema({
    sessionHash: { type: String, required: true, unique: true, index: true },
    discordId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    userAgent: { type: String, default: '' },
    revokedAt: { type: Date, default: null }
});

// 12-hour sessions, swept by Mongo itself rather than by anything remembering to run.
PortalSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 12 * 60 * 60 });

module.exports = mongoose.model('PortalSession', PortalSessionSchema);
```

- [ ] **Step 2: Write the failing test**

```js
// scripts/portalAuth.test.js
// Pure crypto and policy checks — no network, no Discord. What is asserted is the shape of the
// cookie and the state parameter, because those are the two things that fail silently and unsafely.
const assert = require('assert');
const { buildCookie, buildAuthorizeUrl, verifyState, hashSession } = require('../portal/auth');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('the cookie is host-only, HttpOnly, Secure and SameSite=Lax', () => {
    const c = buildCookie('abc123');
    assert.ok(c.includes('HttpOnly'), 'a readable session cookie is a stolen session cookie');
    assert.ok(c.includes('Secure'));
    assert.ok(/SameSite=Lax/i.test(c));
    assert.ok(!/Domain=/i.test(c),
        'no Domain attribute — a host-only cookie is never sent to dioreo.app, which is the whole reason for the subdomain');
});

check('the authorize URL requests identify and NOTHING else', () => {
    const u = new URL(buildAuthorizeUrl({ clientId: '123', redirectUri: 'https://portal.dioreo.app/auth/callback', state: 's' }));
    assert.strictEqual(u.searchParams.get('scope'), 'identify',
        'any additional scope is a promise broken on the door page');
    assert.strictEqual(u.searchParams.get('response_type'), 'code');
    assert.ok(u.searchParams.get('state'), 'a missing state parameter is an open CSRF hole on the login flow');
});

check('a forged or missing state is rejected', () => {
    assert.strictEqual(verifyState('nope', 'expected'), false);
    assert.strictEqual(verifyState(undefined, 'expected'), false);
    assert.strictEqual(verifyState('expected', 'expected'), true);
});

check('the stored session id is a hash, never the raw value', () => {
    const raw = 'abc123';
    const h = hashSession(raw);
    assert.notStrictEqual(h, raw, 'storing the raw session id makes a database read equal to a login');
    assert.strictEqual(h, hashSession(raw), 'the hash must be stable or every request logs the user out');
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 3: Run it to verify it fails, then implement**

Run: `node scripts/portalAuth.test.js` → FAIL, `Cannot find module '../portal/auth'`.

Implement `portal/auth.js`: `buildAuthorizeUrl` (scope `identify`, `response_type=code`, a random `state` stored in a short-lived signed cookie), `handleCallback` (verify state, exchange the code server-side, **discard the Discord token immediately** — only the user id is kept), `hashSession` (SHA-256), `buildCookie` (no `Domain`, `HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=43200`), `sessionFor` (look up by hash, reject if `revokedAt`, touch `lastSeenAt`), and `requireAdmin` (wrap a handler; **re-check `hasCommandAccess` on every request** rather than trusting the session — a revoked admin's live session must stop working inside 60 seconds, not 12 hours).

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/portalAuth.test.js` Expected: four ✓, exit 0

- [ ] **Step 5: Write the privacy policy revision**

Add `PortalSession` to §2 and Appendix A: what is stored (hashed session id, Discord user id, timestamps, device string), why (to keep you signed in and to let the owner end a session), how long (12 hours, enforced by a Mongo TTL index), and that **no Discord token is retained**. Add a §2.6 note that the portal sets one cookie — the site's existing "no cookies" claim is about `dioreo.app` and becomes misleading without it. Re-run `dior legal build` and commit `public/`.

- [ ] **Step 6: Have Harkirat provision the credential**

Ask him to create the client secret and register `https://portal.dioreo.app/auth/callback`, then place `DISCORD_OAUTH_CLIENT_SECRET` in `.env` on the VM and `.env.dev` locally. **Do not handle the value.** Verify by completing a real sign-in against the dev application.

- [ ] **Step 7: Commit**

```bash
git add portal/auth.js models/PortalSession.js scripts/portalAuth.test.js docs/legal/PRIVACY.md public/ package.json
git commit -m "feat(portal): authenticate with Discord OAuth and issue host-only sessions"
```

---

### Task 3: The API layer

**Files:**
- Create: `portal/api/policy.js` · `portal/api/season.js` · `portal/api/armory.js` · `portal/api/broadcast.js` · `portal/api/access.js` · `portal/api/analytics.js` · `models/Changeset.js` · `scripts/portalApi.test.js`

🔴 **`gateCommit` lives in `portal/api/policy.js`, NOT in `season.js`.** An earlier draft put it there, and tier 3 spans Season (`purgeall`, `promote`), Armory (loadouts bulk replace) and Access (grant/revoke) — so every realm would either import policy from `season.js`, which is the wrong boundary, or grow its own copy. **A second copy of the one control standing between an admin and irreversible data loss is exactly the failure `utils/manageActions.js` exists to prevent**, reproduced inside the plan that cites it as precedent.

**Interfaces:**
- Consumes: `core/changeset.js`, `core/revert.js`, `utils/adminAccess.js`
- Produces: `GET /api/<realm>` · `POST /api/changeset` · `POST /api/changeset/:id/commit` · `POST /api/revert/:changeId`

- [ ] **Step 1: Add the `Changeset` model**

⚠️ **Also add the index and the `/manage` notice the spec's §12a promises**, or that commitment has nowhere to land: a compound index on `{ realm: 1, state: 1 }`, and a one-line notice in `commands/manage.js`'s panel header when an uncommitted changeset targets the page being viewed. The spec names this as the answer to concurrent staging; without these two it is a paragraph.

```js
// models/Changeset.js
//
// Staged work lives in the DATABASE, not the browser — which is why a session expiry can never cost
// composed work, and why a set started on one machine can be committed from another.
//
// ⚠️ PRIVACY: authorId is a per-user Discord ID. Name this model in PRIVACY.md §2 and Appendix A in
// the same change that adds it.
//
// ⚠️ CAPACITY: the cluster is M0 free tier — 512 MB total, shared with the observability layer's
// event stream. A tier-2 inverse snapshot can be large (a loadouts bulk replace is ~125 objects), so
// this collection carries a TTL: an abandoned changeset is not precious. Measure before assuming
// there is room; see the spec's premise 6.
const mongoose = require('mongoose');

const ChangesetSchema = new mongoose.Schema({
    authorId: { type: String, required: true, index: true },
    realm: { type: String, required: true },
    ops: { type: [mongoose.Schema.Types.Mixed], default: [] },
    state: { type: String, enum: ['draft', 'staged', 'blocked', 'committed', 'discarded'], default: 'draft' },
    exportedAt: { type: Date, default: null },   // tier 3 will not commit until this is set
    createdAt: { type: Date, default: Date.now },
    committedAt: { type: Date, default: null }
});

ChangesetSchema.index({ realm: 1, state: 1 });   // the /manage "someone has changes staged here" notice

// 🔴 TTL ONLY ON ABANDONED WORK. A bare createdAt TTL would also delete `committed` changesets after
// 30 days, and those are the record of what was actually applied. `partialFilterExpression` scopes
// the expiry to sets that were never committed, which is what the spec's justification actually said.
ChangesetSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60,
      partialFilterExpression: { state: { $in: ['draft', 'staged', 'blocked'] } } }
);

module.exports = mongoose.model('Changeset', ChangesetSchema);
```

- [ ] **Step 2: Write the failing test**

```js
// scripts/portalApi.test.js
const assert = require('assert');
const { gateCommit } = require('../portal/api/policy');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('a tier-3 changeset will not commit until it has been exported', () => {
    const r = gateCommit({ tier: 3, exportedAt: null, confirmText: 'Nightfall', expectText: 'Nightfall' });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /export/i);
});

check('a tier-3 changeset will not commit on a wrong typed confirmation', () => {
    const r = gateCommit({ tier: 3, exportedAt: new Date(), confirmText: 'nightfal', expectText: 'Nightfall' });
    assert.strictEqual(r.ok, false);
    assert.match(r.reason, /confirm/i);
});

check('a tier-3 changeset with both gates satisfied commits', () => {
    assert.strictEqual(gateCommit({ tier: 3, exportedAt: new Date(), confirmText: 'Nightfall', expectText: 'Nightfall' }).ok, true);
});

check('tier 1 and 2 need neither gate', () => {
    assert.strictEqual(gateCommit({ tier: 1 }).ok, true);
    assert.strictEqual(gateCommit({ tier: 2 }).ok, true);
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 3: Run it to verify it fails, then implement the routes**

Every route is thin: parse the body, build ops, call `validateSet`/`previewSet`/`commitSet`, return JSON. `gateCommit`, in `portal/api/policy.js`, is the only policy the API itself owns — the tier-3 export and typed-confirmation requirements from spec §5, enforced **server-side** because a client-side gate is decoration.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/portalApi.test.js` Expected: four ✓, exit 0

- [ ] **Step 5: Verify the whole API is behind `requireAdmin`**

```js
// Add to scripts/portalApi.test.js — a source-scan, matching the shape of
// scripts/botAccessPermissions.test.js, which asserts an invariant rather than a unit.
check('every mutating route is wrapped in requireAdmin', () => {
    const fs = require('fs'), path = require('path');
    const dir = path.join(__dirname, '..', 'portal', 'api');
    const bad = [];
    for (const f of fs.readdirSync(dir)) {
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        for (const m of src.matchAll(/route\(\s*'POST'\s*,\s*([^,]+),\s*([^)]+)\)/g)) {
            if (!/requireAdmin/.test(m[2])) bad.push(`${f}: ${m[1].trim()}`);
        }
    }
    assert.deepStrictEqual(bad, [], `unguarded POST routes: ${bad.join(', ')}`);
});
```

- [ ] **Step 6: Commit**

```bash
git add portal/api/ models/Changeset.js scripts/portalApi.test.js docs/legal/PRIVACY.md public/ package.json
git commit -m "feat(portal): add the realm API over the operation core"
```

---

### Task 4: The frontend build and the vendored dependency

**Files:**
- Create: `scripts/buildPortal.js` · `portal/ui/app.js` · `portal/ui/tokens.css`
- Modify: `package.json` (`preact` + `htm` as **devDependencies**) · `NOTICE` · **`scripts/buildLegalPages.js`**

**Interfaces:**
- Consumes: nothing at runtime
- Produces: `portal/public/index.html` · `portal/public/app.js` · `portal/public/app.css`

- [ ] **Step 1: Install as real devDependencies so the licence gate can see them**

```bash
npm install --save-dev preact htm
```

⚠️ **A vendored browser file is invisible to `dep-licences`**, which resolves licences from the lockfile and `node_modules` — the exact "fails open" shape its own header warns about. Installing them properly and having the build *copy* the ESM bundle into `portal/public/vendor/` is what keeps them audited.

- [ ] **Step 2: Add the NOTICE attribution in the same change**

`NOTICE` §1 carries dependency attributions and is incorporated into `LICENSE` by reference. Add Preact and htm (both MIT) with their copyright lines. Then re-verify no copyleft entered the tree:

```bash
npm run docs:audit   # dep-licences is an ERROR check and will fail on a GPL/AGPL/LGPL/MPL/SSPL package
```

- [ ] **Step 3: Write the build script with the contrast gate wired in**

🔴 **`contrastAudit()` cannot be imported today, and this step is impossible until that changes.** `scripts/buildLegalPages.js` has **no `module.exports` at all** (verified 2026-08-20) — `contrastAudit` is a local function at line ~9091 of a 9,000-line script whose top level *runs the entire site build* as a side effect. `require()`ing it would rebuild the site. **First** add a bottom-of-file export guarded so the build only self-runs when invoked directly:

```js
// scripts/buildLegalPages.js — at the very bottom
if (require.main === module) { build(); }              // was: an unconditional top-level call
module.exports = { contrastAudit };
```
⚠️ That is a change to the script that publishes the live site. Run `dior legal build` afterwards and diff `public/` to prove the output is byte-identical before relying on it.

Then `scripts/buildPortal.js` emits the three files, copies the vendor bundle, and runs `contrastAudit()` over the portal's built CSS. ⚠️ That function reads `--name: #hex` declarations only, so **a component that paints its own surface is invisible to it** and its contrast must be worked out by hand. Say so in the script's header; a green gate that is not evidence is worse than no gate.

- [ ] **Step 4: Prove the gate against broken input before trusting it**

Temporarily set `--ink3` to a value you know fails, run the build, and confirm it goes red. **Then revert.** This project has shipped a contrast gate that passed 63 pairs while the signals were at 1.47:1, because it matched only the first `:root{}` block — a gate proven only against good input is not proven.

- [ ] **Step 5: Commit**

```bash
git add scripts/buildPortal.js portal/ui/ NOTICE package.json package-lock.json
git commit -m "build(portal): add the frontend build with a proven contrast gate"
```

---

### Task 5: The two-layer shell and the Season realm

**Files:**
- Create: `portal/ui/shell.js` · `portal/ui/season.js` · `portal/ui/manifest.js` · `portal/ui/track.js` · `portal/ui/board.js` · `portal/ui/tray.js` (**ESM**, import Preact)
- Create: `portal/ui/track.logic.js` · `portal/ui/manifest.logic.js` · `portal/ui/board.logic.js` (**CommonJS**, import nothing)

🔴 **The split is not tidiness, it is the only way both halves of this plan can be true at once.** `package.json` declares no `"type"`, so Node treats `.js` as CommonJS, and a `require()` cannot load a browser module that does `import { html } from './vendor/preact.mjs'`. Every pure function the tests assert on — `bandClass`, `laneFor`, `tierOf`, filter and sort predicates — lives in a `.logic.js` CommonJS file that Node can require and the ESM component imports. **The browser never loads a CJS file; Node never loads an ESM one.**
- Test: `scripts/portalUi.test.js`

**Interfaces:**
- Consumes: the API from Task 3
- Produces: `<Shell>` · `<Manifest>` · `<Track>` · `<Board>` · `<Tray>`

**Build from `docs/superpowers/mockups/2026-08-20-portal/03-three-surfaces.html`.**

✅ **RESOLVED 2026-08-21 — this task now CAN be executed in a worktree or a fresh clone.** The hazard below was real when written: this plan's header says to execute it with `superpowers:subagent-driven-development`, which runs tasks in fresh worktrees, and `local/` is gitignored so it did not exist there. The mockups are now tracked at `docs/superpowers/mockups/2026-08-20-portal/` (operation-core branch, folded into plan 1's Task 0), so a worktree or fresh clone has them automatically like any other tracked file — no copy step, no per-worktree repetition. The original hazard text is kept below for the historical record.

**This was decided 2026-08-21: option 2 below.** They are tracked at `docs/superpowers/mockups/2026-08-20-portal/`, so no per-worktree setup step is needed — a worktree or fresh clone has them like any other tracked file. The original three options are kept for the historical record:
1. ~~Copy the six mockups into the worktree (`cp -r ../Diors-Builds/local/portal-mockups local/`) as an explicit setup step. Simplest; must be repeated per worktree.~~
2. ~~Move them into the repo at `docs/superpowers/mockups/2026-08-20-portal/` and track them.~~ They are 16–27 KB of self-contained HTML with no secrets, they are the approved design of record, and tracking them ends the whole class of problem — including the spec's own repeated warning that no search can find them. **This was the better answer**, and the `local/` reference copy Harkirat asked for still exists alongside the tracked one.
3. ~~Execute Tasks 5 and 6 inline rather than in a worktree, which contradicts the plan header.~~

- [ ] **Step 1: Write the failing test — components are tested as data**

```js
// scripts/portalUi.test.js
// Render functions are PURE: state in, tree out. No DOM, no browser, no framework harness. That is
// the whole frontend testing story, and it only works because the components take state as an
// argument rather than reaching for it.
const assert = require('assert');
const { bandClass, laneFor, tierOf } = require('../portal/ui/track.logic');   // CJS sibling — see the Files note

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('SHAPE carries state — three states, three distinct classes', () => {
    assert.strictEqual(bandClass({ state: 'live' }), 'bar live');
    assert.strictEqual(bandClass({ state: 'staged' }), 'bar stag');
    assert.strictEqual(bandClass({ state: 'conflict' }), 'bar conf');
});

check('COLOUR carries topic and is never used to signal state', () => {
    const live = bandClass({ state: 'live', topic: 'draw' });
    const staged = bandClass({ state: 'staged', topic: 'draw' });
    assert.notStrictEqual(live, staged, 'two states of the same topic must differ by SHAPE');
    assert.strictEqual(bandClass({ state: 'live', topic: 'draw' }), bandClass({ state: 'live', topic: 'event' }),
        'two topics in the same state must share a class — the topic arrives as a CSS custom property, not a class');
});

check('an item ending after the season end is a conflict, computed not flagged by hand', () => {
    assert.strictEqual(tierOf({ endDate: '2026-09-10' }, { bpEnd: '2026-09-04' }), 'conflict');
    assert.strictEqual(tierOf({ endDate: '2026-09-01' }, { bpEnd: '2026-09-04' }), 'ok');
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails, then build the shell**

`<Shell>` renders the rail (five realms), the view-layer switcher and the Manifest slot. **The switcher only ever changes the top half** — that is the design's central rule and the component structure must make violating it awkward, not merely discouraged.

- [ ] **Step 3: Build Track, Board and Manifest**

Track from the mockup: lanes, ruler, NOW and BP-END markers, the 2XCP window, the draft rail below the divider, drag handles, and defect flags that name the fix. Board as the **changeset pipeline** — Draft → Staged → Blocked → Ready, with the tier-3 export as a real Blocked column. Manifest with live search, filter chips, sortable columns, multi-select and a bulk bar that appears only when something is selected.

- [ ] **Step 4: Run the test, then verify in a real browser**

Run `node scripts/portalUi.test.js`, then start the portal locally and drive it with the preview tooling: check console errors, network failures, and that a staged change renders as a hollow dashed band. **Screenshot both themes.**

- [ ] **Step 5: Commit**

```bash
git add portal/ui/ scripts/portalUi.test.js package.json
git commit -m "feat(portal): build the two-layer shell and the Season realm"
```

---

### Task 6: Armory, Broadcast, Access and Analytics

**Files:**
- Create: `portal/ui/armory.js` · `portal/ui/broadcast.js` · `portal/ui/access.js` · `portal/ui/analytics.js`
- Test: `scripts/portalRealms.test.js`

**Each realm reuses `<Shell>` and `<Manifest>` unchanged** and supplies only its view layer. If a realm needs to modify the Manifest, that is a signal the abstraction is wrong — stop and fix it rather than special-casing.

- [ ] **Step 1: Armory — Rack and Coverage**

From the approved mockups (see Task 5's note on where they must be before this runs) — `04-armory-and-commit.html`. Rack groups by category using the bot's real `MP_CATEGORY_ACCENT`. Coverage is a matrix of quality checks (missing image, no badges, near-duplicate code, attachments ≠ 5, not updated in 90 days) where **every cell is a filter** into the Manifest. The preview panel calls the bot's own `buildLoadoutCard()`.

⚠️ **Spec premise 5 applies here and must be settled before this ships.** `utils/emojiMap.js` values are rewritten at bot boot by `refreshEmojiIds(client)`; the portal has no client, so it renders **pre-sync production ids**. Either accept that (correct on prod, wrong on dev) or have the portal read the ids from Mongo. **Decide with evidence, and write a test pinning whichever answer you choose** — this fails silently and looks like nothing at all.

- [ ] **Step 2: Broadcast — Now showing and Airtime**

From mockup `05-door-broadcast-ops.html`, subject to Task 5's availability note. Now showing renders the live set as Discord sends it, in slot order. Airtime puts each announcement on a time axis, which is what makes "up for 19 days with no expiry" visible. Uses `startsAt` from plan 2 Task 6.

- [ ] **Step 3: Access — By admin and By scope**

From mockup `06-access-and-analytics.html`, subject to Task 5's availability note. The matrix writes through `utils/adminAccess.js`'s existing vocabulary; inherited scopes (bare `manage` covering every page) render in a paler fill so what you actually granted is visible. **By scope flags a single point of failure** — a scope held by exactly one non-owner. The Manifest lists live `PortalSession` rows with an End session control.

⚠️ `/bot access` is **owner-only and not a grantable scope**, so it gets no column and the whole realm is behind `isOwner()`, not a permission token.

- [ ] **Step 4: Analytics — read-only, nothing re-derived**

Health, Usage and Timing read the same sources `/bot analytics` does. The Manifest is **one filterable event river** across `ChangeLog`, `AlertLog` and `BootRecord`, with revert on change rows via `core/revert.js`. **Do not reimplement any metric** — if a number needs computing, it belongs in the shared util both surfaces call.

- [ ] **Step 5: Test each realm's pure functions and verify in the browser**

Run `node scripts/portalRealms.test.js`, then drive every realm with the preview tooling and screenshot each.

- [ ] **Step 6: Commit**

```bash
git add portal/ui/ scripts/portalRealms.test.js package.json
git commit -m "feat(portal): build the Armory, Broadcast, Access and Analytics realms"
```

---

### Task 7: Tunnel, systemd, deploy

**Files:**
- Create: `scripts/dioreo-portal.service` · `scripts/cloudflared-config.yml`
- Modify: `scripts/deploy.sh` · `public/_redirects` · `docs/reference/deployment-and-ops.md`

- [ ] **Step 1: Measure before adding a resident process**

```bash
gcloud compute ssh diors-builds-bot --zone=us-east1-b --command='free -m; systemctl show diors-bot -p MemoryCurrent'
```

The spec's 112 MB / 127 MB figures are dated 2026-07-17 and the portal's own 90–125 MB is an **estimate with no measurement behind it**. If headroom is under ~250 MB, stop and move to Cloud Run — that door was deliberately left open.

- [ ] **Step 2: Install `cloudflared` and create the tunnel**

```bash
# On the VM. Outbound-only: no inbound firewall rule is created, and the VM's ephemeral
# external IP is never referenced.
cloudflared tunnel login
cloudflared tunnel create dioreo-portal
cloudflared tunnel route dns dioreo-portal portal.dioreo.app
```

`scripts/cloudflared-config.yml` maps the hostname to `http://127.0.0.1:${PORTAL_PORT}` with a catch-all `http_status:404`.

- [ ] **Step 3: Add both systemd units**

`dioreo-portal.service` (`Restart=always`, `WorkingDirectory=~/diors-builds`, `ExecStart=/usr/bin/node portal/server.js`) and `cloudflared.service`. **Separate units on purpose** — a portal crash must never restart the bot, and `cloudflared` dying must take down only the portal's reachability.

- [ ] **Step 4: Extend `scripts/deploy.sh`**

Restart `dioreo-portal` alongside `diors-bot` after a pull, and add both to the post-restart verification. ⚠️ **Do not let a portal failure abort the bot's deploy** — check them independently and report both, rather than `&&`-chaining, which would make a portal problem look like a bot problem.

- [ ] **Step 5: Add the redirect**

```
/portal https://portal.dioreo.app/ 302
```

302 rather than 301: a 301 is cached permanently by browsers, so moving the portal later would mean fighting every stale cache. Matches the existing `/install` precedent.

- [ ] **Step 6: End-to-end verification, in this order**

Sign in with the owner account and reach a realm · sign in with a non-admin account and confirm the door's state-2 message leaks nothing · stage a tier-1 edit and confirm it appears in Discord immediately · stage a tier-3 op and confirm it **refuses** to commit until exported and confirmed by name · revert from Analytics · **restart the portal mid-session and confirm staged work survives** · confirm portal errors appear in Cloud Logging under `dioreo-portal` and group separately from the bot's.

- [ ] **Step 7: Document and commit**

Add the portal to `docs/reference/deployment-and-ops.md` — units, config paths, how to check it, and how to take it down without touching the bot.

```bash
git add scripts/dioreo-portal.service scripts/cloudflared-config.yml scripts/deploy.sh \
        public/_redirects docs/reference/deployment-and-ops.md
git commit -m "build(portal): serve portal.dioreo.app through a Cloudflare Tunnel"
```

---

## Self-review

**Spec coverage.** §7 hosting → Task 7. §8 IA → Tasks 5–6. §9 visual system → Tasks 4–5. §10 auth → Task 2. §11 `PortalSession`/`Changeset` → Tasks 2–3. §12a degraded modes → Task 1's error net and Task 3's route shape. §12 premises 2, 3 and 5 → Tasks 7 and 6 explicitly.

**Not covered, and stated in the spec as out of scope:** non-admin users, a public read-only view, the command palette, mobile beyond the degraded subset, and `/autobuild` in the Armory.

**Placeholder scan.** Tasks 5 and 6 describe components in prose and point at named mockup files rather than inlining a thousand lines of JSX-equivalent. That is deliberate and stated: **the approved design is those files**, and transcribing them into the plan would create a second copy that drifts — the exact failure `utils/manageActions.js` exists to prevent. Every *test* is written in full, and every trap is named.

**Type consistency.** `sessionFor` returns `{ discordId, sessionId } | null` throughout. `gateCommit` returns `{ ok }` or `{ ok: false, reason }`, matching the core's convention.

## Audit log

**R1 — the server would have bound `0.0.0.0` by default and quietly exposed itself.** `http.Server.listen(port)` binds all interfaces. The VM has a public IP, so the portal would have been reachable directly, bypassing the tunnel and every Cloudflare protection in front of it — while everything appeared to work. Now `listen(port, '127.0.0.1')`, with a verification step that curls it.

**R2 — a vendored Preact file would have been invisible to `dep-licences`.** That gate resolves licences from the lockfile and `node_modules`; a file copied into `portal/public/` is in neither. This is the precise "fails open" shape its own header warns about for `chroma-js`. Installing as real devDependencies and having the *build* copy the bundle keeps it audited, and the NOTICE entry lands in the same task.

**R3 — `requireAdmin` on the session alone would have kept a revoked admin working for 12 hours.** The session is valid for 12 hours; `utils/adminAccess.js`'s cache is 60 seconds. Trusting the session means a revoke takes effect at next sign-in. Permissions are now re-checked per request, and Access can end a live session outright.

**R4 — the tier-3 gate was going to live in the UI.** A client-side gate is decoration: the API is reachable with `curl`. `gateCommit` is server-side and the client merely reflects it, with a test asserting the refusal.

**R5 — `deploy.sh` would have made a portal failure look like a bot failure.** `&&`-chaining two restarts means a portal problem aborts before the bot is verified, and the operator reads it as the bot being broken. They are checked independently and both reported — the same lesson as this repo's pipe-masks-exit-status finding.

**R6 — the contrast gate would have been trusted without being proven.** This project has already shipped a contrast gate that passed 63 pairs while three signals sat at 1.47:1, because it matched only the first `:root{}` block. Task 4 Step 4 now proves it against deliberately broken input before it is trusted, and the script's header states what it structurally cannot see.

**R7 — premise 5 was inherited from the spec without an owner.** The emoji-id risk lands squarely in Armory's preview panel and would have shipped as "the preview looks slightly wrong and nobody can say why". Task 6 Step 1 now forces a decision *with evidence* and a test pinning whichever answer is chosen.

**R8 — the logging story was a silent no-op.** `patchConsole()` takes zero parameters and `SERVICE_CONTEXT` is a hardcoded const, so `patchConsole({ service: 'dioreo-portal' })` did nothing and portal errors would have grouped under the bot. Separately, both units would have opened the same `logs/app.log` from the same working directory and interleaved partial writes into NDJSON the Ops Agent parses. Task 1 Step 2b fixes both.

**R9 — Task 4 Step 3 was impossible.** `scripts/buildLegalPages.js` has no `module.exports`, so `contrastAudit()` could not be imported, and its top level runs the whole site build — so `require`ing it would have rebuilt the site. R6's entire argument rested on a function that is not reachable.

**R10 — the frontend could not have been both tested and served.** `package.json` declares no `"type"`, so a CJS `require()` cannot load a browser ESM module. The `.logic.js` split resolves it, and every assertion in the example test already pointed at exactly those functions.

**R11 — two tasks depended on a gitignored directory while the plan header mandates worktree execution.** Naming the hazard three times is not mitigating it; Task 5 now carries three concrete options and requires recording which was taken.

**R12 — `gateCommit` was defined in `portal/api/season.js` while governing three realms.** Either every realm imports policy from `season.js` or each grows a copy — a second copy of the one control between an admin and irreversible data loss. Now `portal/api/policy.js`.

**R13 — the `Changeset` TTL had no state predicate**, so it would have deleted committed sets after 30 days along with abandoned ones. Now a `partialFilterExpression`. And `portal/` needed the same `top-level-dirs` treatment `core/` did.

**Not found:** no defect in the one-origin topology, the thin-API rule, or the decision to test components as pure data.
