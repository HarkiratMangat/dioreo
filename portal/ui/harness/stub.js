// portal/ui/harness/stub.js — HARNESS ONLY. Never served by portal/server.js.
//
// This module is aliased OVER portal/ui/httpClient.js by an import map in the harness page, so the real components import it without knowing: `import { fetchJson } from './httpClient.js'` resolves here instead. That is the whole seam. No production file is modified, no flag is threaded through the components, and there is nothing to remember to turn off — a page that does not declare the import map gets the real client.
//
// Why an import map rather than a `if (window.__HARNESS)` branch inside httpClient.js: a branch in production code is a branch that can ship enabled. This cannot: it exists only in a page the server never serves.

const FIX = window.FIX;

// The season document as models/SeasonalData.js actually stores it — the six arrays live ON the document, which is why `state.live` is spread from FIX.season and the arrays together rather than nested under a `data` key.
function seasonLive() {
    return {
        ...FIX.season,
        newDraws: FIX.newDraws,
        returningDraws: FIX.returningDraws,
        calendar: FIX.calendar,
        patchNotes: FIX.patchNotes,
    };
}

// Every realm this admin can see. The harness signs in as the owner because the alternative — a partial grant — hides surfaces, and a harness that silently omits a page is worse than useless when the whole point is looking at every page. Narrower grants are reachable with ?realms= below.
const ALL_REALMS = ['season', 'armory', 'broadcast', 'review', 'access', 'analytics'];
const params = new URLSearchParams(location.search);
const realms = params.get('realms') ? params.get('realms').split(',') : ALL_REALMS;
const owner = params.get('owner') !== '0';

// portal/api/armory.js stamps two fields onto every build that are NOT in the stored document: `coverage` (from coverageFlags) and `accent` (from getMpCategoryAccent). The fixtures hold raw documents, so without this the Rack renders with no accents and the Coverage matrix is all zeros — a page that looks finished and is measuring nothing.
//
// ⚠️ ONE FLAG IS AN APPROXIMATION AND IT IS MARKED. The real near-duplicate check runs utils/search.js's findDuplicateLoadouts, which needs the bot's own module; here an exact shareCode collision among the other MP builds stands in. The other four rules are the server's verbatim. Anything that turns on the precise duplicate SET must be checked against the server, not against this.
const CAT_HEX = Object.fromEntries((FIX.CATS || []).map((c) => [c.key, c.hex]));
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const MP_CODES = new Map();
for (const b of FIX.builds || []) {
    if (b.mode !== 'MP' || !b.shareCode) continue;
    MP_CODES.set(b.shareCode, (MP_CODES.get(b.shareCode) || 0) + 1);
}
function armoryBuild(b) {
    const flags = [];
    if (!b.imageKey) flags.push('missing-image');
    if (!(b.isMeta || b.categoryRank || b.dmzRangeRank || b.isToxic)) flags.push('no-badges');
    if ((b.attachments || []).length !== (b.mode === 'DMZ' ? 9 : 5)) flags.push('wrong-attachment-count');
    if (b.lastUpdated && Date.now() - new Date(b.lastUpdated).getTime() > NINETY_DAYS_MS) flags.push('stale-90d');
    if (b.mode === 'MP' && b.shareCode && (MP_CODES.get(b.shareCode) || 0) > 1) flags.push('near-duplicate');
    return { ...b, _id: b._id || b.id, coverage: flags, accent: CAT_HEX[b.category] || 'var(--ink3)' };
}

// portal/api/analytics.js assembles seven fields from six collections, and the fixtures hold the raw material under different names. Mapping them explicitly is the difference between a page that renders and a page that MEASURES — the first attempt passed the fixture arrays through under the API's key names and every KPI read "no boot recorded / 0 alerts / 0 users" on a fixture set that carries 303 boots, 998 alerts and 496 events. It looked finished and said nothing.
function analyticsPayload() {
    const F_ = window.FIX;
    const boot = F_.bootStats || {};
    const totals = F_.OBS_TOTALS || {};
    const alertRows = F_.alertSample || [];
    const changeRows = F_.changeLog || [];
    const bySeverity = Object.fromEntries((F_.alertStats || []).map((a) => [a.level, a.n]));
    // The river is one stream, oldest last, exactly as eventRiver() returns it: changes and alerts interleaved and sorted by time. `kind` is the row's OWN kind and must not be clobbered by a spread — the real endpoint carries a comment about that exact bug.
    const river = [
        ...changeRows.map((c) => ({ ...c, kind: 'change', at: c.at, changeId: c.target + c.at })),
        ...alertRows.map((a) => ({ ...a, kind: 'alert', at: a.at, alertId: a.title + a.at })),
    ].sort((a, b) => String(b.at).localeCompare(String(a.at)));
    const spark = (n, peak) => Array.from({ length: 7 }, (_, i) => Math.round(peak * (0.4 + 0.6 * Math.abs(Math.sin(i + n)))));
    return {
        river,
        health: {
            uptimeSince: new Date(Date.now() - (boot.uptimeSec || 5400) * 1000).toISOString(),
            lastBootKind: boot.kind, lastBootVersion: boot.lastVersion,
            errors24h: (bySeverity.error || 0) + (bySeverity.critical || 0),
            noise24h: bySeverity.info || 0,
            rssPeakMb: (F_.memStats || {}).maxMb, rssSampleCount: alertRows.length,
            commands24h: totals.events || 0,
            distinctUsers24h: new Set((F_.cmdStats || []).map((c) => c.command)).size,
            // 🔴 THE +4 FLOOR MEANT THIS SPARKLINE COULD NEVER READ ZERO. Under ?empty=1 the Health panel showed "Alerts per day: 3 2 4 3 2 4 4" beside "0 errors", "0 commands" and a river saying nothing had been recorded — a chart inventing a week of activity in a portal with no records at all, which is the precise failure that flag exists to expose. Both series now derive from a real row count, so an empty fixture set produces empty bars.
            spark: { alerts: spark(1, Math.ceil(alertRows.length / 7)), commands: spark(3, Math.round((totals.events || 0) / 7)) },
            restarts24h: 0, restarts7d: boot.boots || 0,
        },
        // 🔴 THESE TWO WERE ARRAYS AND THE REAL ROUTE RETURNS OBJECTS. `usageStats: F_.cmdStats` put the fixture array straight under the API's key name — the exact defect this file's own header describes, committed a second time in the same function, on the two fields nothing was reading yet. The old component only touched `usageStats.current`, which is undefined on an array, so a header silently did not render and every gate stayed green. It surfaced only when a component finally destructured `byCommand` and got nothing on a fixture set carrying 496 events.
        //
        // The real shapes: computeUsageStats groups by $command ALONE, so the fixtures' per-subcommand rows have to be folded the way Mongo would fold them — a stub that keeps them separate would show more rows than production ever can.
        usageStats: usageStatsShape(F_), timingStats: timingStatsShape(F_),
        reach: F_.reachStats || [],
        searches: F_.searchTerms || [],
        outcomeKeys: F_.OUTCOMES || [], entryKeys: F_.ENTRIES || [],
    };
}

// 🔴 THE ADMIN FILTER IS PART OF THE SHAPE, NOT A DETAIL. computeUsageStats matches isAdmin:false, so byCommand and `current` describe the SAME population. Folding every fixture row in while taking `current` from adminSplit.product mixed two populations, and the page showed per-command shares of a smaller total: 38 + 30 + 23 + 19 + 17 … summing far past 100%. Production cannot produce that, so a stub that does is teaching the reviewer a defect the code does not have. The command list is the fixtures' own, which the mockup uses for exactly this filter.
const ADMIN_COMMANDS = ['mng', 'bot', 'manage', 'add', 'edit', 'autobuild'];

// $group by command, exactly as computeUsageStats does — summing the fixtures' subcommand rows rather than listing them.
function foldByCommand(cmdStats, { product = false } = {}) {
    const m = new Map();
    for (const c of cmdStats || []) {
        if (product && ADMIN_COMMANDS.includes(c.command)) continue;
        const k = c.command || '?';
        const prev = m.get(k) || { _id: k, c: 0, ok: 0, bg: 0, dur: 0, ack: 0, rows: 0 };
        prev.c += c.n || 0; prev.ok += c.ok || 0; prev.rows += 1;
        // The fixtures have no entry column per command row, so a zero-ack row stands in for a background job — those never answered an interaction, which is exactly what ack 0 means and why the mockup's own command drawer says so.
        prev.bg += (c.ack === 0 ? (c.n || 0) : 0);
        prev.dur = Math.max(prev.dur, c.dur || 0); prev.ack = Math.max(prev.ack, c.ack || 0);
        m.set(k, prev);
    }
    return [...m.values()].sort((a, b) => b.c - a.c);
}

function usageStatsShape(F_) {
    const folded = foldByCommand(F_.cmdStats, { product: true });
    const current = (F_.adminSplit || {}).product || folded.reduce((a, c) => a + c.c, 0);
    return {
        current,
        // No previous-window figure exists in the fixtures, so one is derived deterministically. It is a FIXTURE, invented like every other number in this file — it exists so the delta line has something to render, not because anybody measured it.
        previous: Math.round(current * 0.82),
        byCommand: folded.map((c) => ({ _id: c._id, c: c.c, ok: c.ok, bg: c.bg })),
        byEntry: (F_.entryStats || []).map((e) => ({ _id: e.entry, c: e.n })),
        byOutcome: (F_.outcomeStats || []).map((o) => ({ _id: o.outcome, c: o.n })),
    };
}

function timingStatsShape(F_) {
    const folded = foldByCommand(F_.cmdStats);
    // $percentile returns an array per requested p, which is why the real overall carries [p50, p95] rather than two fields — a stub with two scalars would render and be the wrong shape.
    const at = (list, q) => (list.length ? list[Math.min(list.length - 1, Math.floor(list.length * q))] : null);
    const acks = folded.map((c) => c.ack).filter((n) => n > 0).sort((a, b) => a - b);
    const durs = folded.map((c) => c.dur).filter((n) => n > 0).sort((a, b) => a - b);
    return {
        overall: { ackP: [at(acks, 0.5), at(acks, 0.95)], durP: [at(durs, 0.5), at(durs, 0.95)] },
        byCommand: folded.filter((c) => c.dur > 0).map((c) => ({ _id: c._id, p: [c.dur], n: c.c })),
        byDep: (F_.depStats || []).map((d) => ({ _id: d.name, totalMs: d.ms, calls: d.calls })),
        // $bucket names its groups by the LOWER BOUNDARY, under `_id` — the fixtures call the same number `from`.
        ackBuckets: (F_.ackBuckets || []).map((b) => ({ _id: b.from, n: b.n })),
    };
}

// A static stand-in for buildLoadoutCard()'s real Components V2 JSON, so the Armory's LIVE PREVIEW panel exercises portal/ui/v2Render.js against a known shape with no server and no auth.
//
// ⚠️ PRESERVED FROM AN EARLIER HARNESS THAT ONLY EXISTED IN BUILD OUTPUT. portal/public/review/ held a hand-written "Design Review Harness" doing much of what portal/ui/harness/ now does — untracked, generated by nothing, one `rm -rf portal/public` from gone, and invisible to every search that respects .gitignore. It was found only by looking at what the directory actually contained. This card was the one thing it had that this harness did not; the rest is superseded, so the duplicate was removed rather than left as a second answer to the same question.
const FIXTURE_CARD = { components: [
    { type: 17, accent_color: 0xF2C230, components: [
        { type: 10, content: '# AK-47\n🥇 Best AR' },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: '### Attachments\n• `Muzzle`\n• `Barrel`' },
        { type: 10, content: '### Gunsmith Code\n`6ZQ4-KP2M-VX90`' },
        { type: 12, items: [{ media: { url: 'https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/ak47.webp' } }] },
        { type: 10, content: '-# AR • Build 1 of 3 • Updated <t:1755000000:D>' },
        { type: 14, spacing: 1, divider: true },
        { type: 1, components: [{ type: 2, label: 'Copy Attachments' }, { type: 2, label: 'Copy Code' }] },
    ] },
] };

// /api/review flattens open changesets to individual operations. FIX.sampleOps is the mockup's own staged set; its rows are [field, was, becomes] triples, while diffRows (portal/ui/board.logic.js) returns {key, from, to} — so they are converted here rather than teaching the component a second row shape. One op is marked stale and one changeset is tier 3 and unexported, because a review screen whose fixtures are all clean never renders the two surfaces it exists for.
function reviewPayload() {
    const src = window.FIX.sampleOps || [];
    const ops = src.map((o, i) => ({
        id: 'cs-' + i + ':0',
        changesetId: 'cs-' + i,
        index: 0,
        realm: o.realm || 'season',
        op: o.op || 'unknown',
        tier: i === src.length - 1 ? 3 : (o.tier || 1),
        name: o.name,
        verb: o.verb || 'changed',
        rows: (o.rows || []).map((r) => ({ key: r[0], from: r[1], to: r[2] })),
        destroys: i === src.length - 1,
        exported: false,
        exportedAt: null,
        stale: i === 1,
        staleChecked: true,
        blocked: null,
        confirmText: ('CS' + i).toUpperCase(),
    }));
    const changesets = ops.map((o) => ({
        id: o.changesetId, realm: o.realm, tier: o.tier, state: 'staged',
        exportedAt: null, confirmText: o.confirmText, opCount: 1,
        gate: { ok: o.tier !== 3, reason: o.tier === 3 ? 'export required' : null },
    }));
    return { ops, changesets };
}

// Staged changesets in the shape /api/changeset returns them — one per sample op, so the Board has columns with something in them and Season's staged panel has rows.
function harnessChangesets() {
    return (window.FIX.sampleOps || []).map((o, i) => ({
        _id: 'cs-' + i, realm: o.realm || 'season', tier: i === (window.FIX.sampleOps.length - 1) ? 3 : (o.tier || 1),
        state: 'staged', ops: [{ type: o.op || 'draw.edit', target: null, payload: {} }],
        exportedAt: null, createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    }));
}

const ROUTES = [
    [/^\/auth\/csrf$/, () => ({
        csrfToken: 'harness-csrf', discordId: FIX.OWNER_ID || '1139845545754632283',
        isOwner: owner, visibleRealms: realms,
        // The account panel counts down to this. Fixed at seven and a bit hours out rather than derived from the clock, so the harness reads the same on every load and a screenshot of it is comparable to the last one — the whole point of a fixture.
        sessionExpiresAt: new Date(Date.now() + 7 * 3600e3 + 21 * 60e3).toISOString(),
    })],
    [/^\/api\/season$/, () => ({
        live: seasonLive(),
        draft: FIX.draft ? { ...FIX.draft } : null,
        grantedPages: ['season', 'draws', 'calendar', 'patchnotes'],
    })],
    [/^\/api\/armory$/, () => ({ builds: (FIX.builds || []).map(armoryBuild), grantedPages: ['loadouts'] })],
    // 🔴 THE PREVIEW HAS TO BE OF THE BUILD THAT WAS ASKED FOR. This returned ONE fixed card for every id, which is invisible on the single-row preview panel — one card, one selection, nothing to compare it against — and became obvious the moment Compare put two of them side by side: two chips reading ".50 GS" above two cards both reading "AK-47". A stub that answers the same thing to every question is a stub that cannot demonstrate the feature it is standing in for.
    [/^\/api\/armory\/preview/, (params) => {
        const build = (FIX.builds || []).find((b) => String(b._id) === params.get('id'));
        if (!build) return { card: FIXTURE_CARD };
        // The real route runs the bot's own buildLoadoutCard; this reshapes the fixture card's own components so the shape stays honest and only the fields that identify the build change.
        const card = JSON.parse(JSON.stringify(FIXTURE_CARD));
        const container = (card.components || []).find((c) => c.type === 17);
        const text = container && (container.components || []).find((c) => c.type === 10);
        if (text) {
            text.content = `# ${build.weaponName}\n### ${build.buildName || 'Build'}\n`
                + (build.attachments || []).map((a) => `- ${a}`).join('\n')
                + (build.shareCode ? `\n-# ${build.shareCode}` : '');
        }
        if (container && build.accent) container.accent_color = parseInt(String(build.accent).replace('#', ''), 16);
        return { card };
    }],
    [/^\/api\/armory\/export/, () => ({ text: '(harness: bulk export text)' })],
    [/^\/api\/broadcast$/, () => ({
        // 🔴 `state`, NOT `active`. The route's own announcementState() is the one place an announcement's state is decided, and the counts in the masthead already read it — filtering on a different field here put FOUR cards under a "Now showing" heading beside a masthead reading LIVE 2. One quantity, two authorities, on the same screen: the exact defect this project keeps paying for, reproduced in the instrument rather than the product.
        live: (FIX.announcements || []).filter((a) => a.state === 'live'),
        all: FIX.announcements || [],
        // ⚠️ THREE, NOT TEN, and that is the point of a fixture. Discord's real cap is 10 and the route sends utils/announcement.js's own constant; with four fixture announcements a cap of 10 renders the over-cap state ZERO times, so the harness would show a panel that cannot demonstrate the one fact it was rebuilt to show. A fixture exists to reach the states real data does not happen to be in today.
        maxPerMessage: 1,
    })],
    [/^\/api\/access$/, () => ({
        admins: FIX.accessAdmins || [], sessions: FIX.sessions || [],
        singlePointsOfFailure: FIX.spof || FIX.SPOF || [],
    })],
    // 🔴 THE FIXTURE PREDATES THE `realm` FIELD, AND THE GRID READS ITS COLOUR FROM IT. Without this the harness rendered twelve identical grey columns while production renders them tinted by the realm each scope governs — the instrument showing a duller page than the product, which is the harder direction to notice. The mapping is the route's own (portal/api/realmAccess.js's realmForScope), reproduced here rather than imported because the stub runs in the browser.
    [/^\/api\/access\/matrix$/, () => {
        const REALM = {
            bot: 'analytics', autobuild: 'armory',
            'manage.draws': 'season', 'manage.calendar': 'season', 'manage.patchnotes': 'season',
            'manage.seasondraft': 'season', 'manage.season': 'season',
            'manage.loadouts_mp': 'armory', 'manage.loadouts_dmz': 'armory',
            'manage.announcement': 'broadcast',
        };
        const scopes = (FIX.accessScopes || FIX.SCOPES || []).map((s) => ({ ...s, realm: s.realm || REALM[s.key] || null }));
        return { scopes, admins: FIX.accessAdmins || [] };
    }],
    [/^\/api\/analytics$/, () => analyticsPayload()],
    // 🔴 THE HARNESS MUST PARSE DATES TOO, or the composer's echo reads "not a date yet" for every value and the one thing that surface exists to demonstrate cannot be seen. The real route calls the bot's chrono parser; this understands only what a fixture needs to show — an ISO day, and the two relative forms the placeholder itself suggests. ⚠️ It is deliberately NARROWER than chrono rather than a second attempt at it: a stub that half-implements a parser teaches the reviewer a grammar the product does not have. ⚠️ NARROWER THAN THE REAL PARSER ON PURPOSE, same as parse-date above: this understands the two shapes the placeholder itself suggests, so a reviewer can see the preview work without the stub teaching a grammar the product does not have. The real route runs utils/adminParser.js.
    [/^\/api\/parse-bulk$/, (params, body) => {
        const kind = (body && body.kind) || 'draw';
        const day = (d) => new Date(d).toISOString().slice(0, 10);
        const rows = String((body && body.text) || '').split('\n').map((raw) => {
            const line = raw.trim();
            if (!line) return null;
            const dash = line.split(/\s+[—-]\s+/);
            const parts = dash.length > 1 ? dash : line.split(',').map((p) => p.trim());
            const name = (parts.shift() || '').trim();
            const span = (parts.join(' ') || '').match(/(.+?)\s+to\s+(.+)/);
            // 🔴 `Date.parse` SAYS YES TO ALMOST ANYTHING. "with no date 2026 UTC" parses to January 1st, so a line the real parser would skip came back understood, with a date nobody typed — the stub teaching a behaviour the product does not have, which is the whole failure mode a fixture harness has. The candidate has to LOOK like a date before it is offered to the parser.
            const one = (v) => {
                const raw = String(v).trim();
                if (!/^(\d{1,2}[\/-]\d{1,2}|[a-z]{3,9}\.?\s+\d{1,2}|\d{1,2}\s+[a-z]{3,9})/i.test(raw)) return null;
                const t = Date.parse(raw + ' 2026 UTC');
                return Number.isFinite(t) ? day(t) : null;
            };
            const start = span ? one(span[1]) : one(parts[parts.length - 1] || '');
            const end = span ? one(span[2]) : start;
            return { name, start, end, ok: Boolean(name && start) };
        }).filter(Boolean);
        return { kind, rows };
    }],
    [/^\/api\/parse-date$/, (params) => {
        const q = (params.get('q') || '').trim().toLowerCase();
        const day = (d) => new Date(d).toISOString().slice(0, 10);
        const today = new Date((document.documentElement.dataset.today || new Date().toISOString().slice(0, 10)) + 'T12:00:00Z');
        let iso = null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(q)) iso = q;
        else if (q === 'today') iso = day(today);
        else if (q === 'tomorrow') iso = day(today.getTime() + 86400000);
        else {
            const rel = q.match(/^in (\d+) (day|week|month)s?$/);
            if (rel) iso = day(today.getTime() + Number(rel[1]) * { day: 1, week: 7, month: 30 }[rel[2]] * 86400000);
            else { const abs = Date.parse(q + ' 2026 UTC'); if (Number.isFinite(abs)) iso = day(abs); }
        }
        return { q, iso };
    }],
    [/^\/api\/review$/, () => reviewPayload()],
    // 🔴 BOTH FORMS, AND THE BARE ONE WAS MISSING. season.js fetches `/api/changeset?realm=season` and board.js fetches `/api/changeset/:id/preview`, but the route the API actually registers is `/^\/api\/changeset$/` — and with no stub for it the Board's own fetch fell through to the unrouted {ok:true} fallback, so `body.changesets` was undefined and the Board rendered empty all session while looking perfectly fine. Caught by scripts/portalHarness.test.js, which is the only thing that compares what the stub returns against what the route promises.
    [/^\/api\/changeset(\?|$)/, () => ({ changesets: harnessChangesets() })],
    [/^\/api\/changeset\/[^/]+\/preview$/, () => ({ preview: null })],
];

export async function fetchJson(path, opts) {
    // 🔴 MATCH ON THE PATH, NOT THE WHOLE URL, WHICH IS WHAT THE SERVER DOES. Every route regex here is anchored with `$`, and this used to test it against the raw argument — so the moment a caller passed a query string the regex stopped matching and the request fell through to the unrouted `{ok:true}` branch. `/api/parse-date?q=in+3+weeks` did exactly that: the composer's date echo read "not a date yet" for every value, which looks like a parser that cannot parse rather than a route that was never reached. ⚠️ `portalHarness.test.js` could not see it either — that gate compares the KEYS a stub returns against the keys the real route promises, and a route whose regex never matches still has the right keys.
    const [pathname, query = ''] = String(path).split('?');
    for (const [re, make] of ROUTES) {
        if (re.test(pathname)) {
            // A POST route needs what was posted; a GET route ignores the second argument. Parsed here rather than in each route so a stub cannot forget it.
            let sent = null;
            try { sent = opts && opts.body ? JSON.parse(opts.body) : null; } catch (e) { sent = null; }
            const body = make(query ? new URLSearchParams(query) : new URLSearchParams(), sent);
            // Same the real client returns, including the async boundary — a component that renders correctly only because the harness resolved synchronously would be a lie.
            await new Promise((r) => setTimeout(r, 0));
            console.log('[harness]', (opts && opts.method) || 'GET', path, body);
            return body;
        }
    }
    // A POST the harness has no route for is an ACCEPTED no-op, not a 404: every mutation in this portal goes through the changeset flow, and refusing them would make the compose surfaces untestable for exactly the wrong reason.
    console.warn('[harness] unrouted', (opts && opts.method) || 'GET', path, '→ {ok:true}');
    await new Promise((r) => setTimeout(r, 0));
    return { ok: true };
}
