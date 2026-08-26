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
        usage: (F_.cmdStats || []).map((c) => `${c.command}${c.subcommand ? ' ' + c.subcommand : ''}  ${c.n}  ok ${c.ok}  ${c.dur}ms`).join('\n'),
        timing: (F_.depStats || []).map((d) => `${d.name}  ${d.calls} calls  ${d.ms}ms`).join('\n'),
        alerts: alertRows.map((a) => `[${a.level}] ${a.title} — ${a.detail} (${a.at})`).join('\n'),
        health: {
            uptimeSince: new Date(Date.now() - (boot.uptimeSec || 5400) * 1000).toISOString(),
            lastBootKind: boot.kind, lastBootVersion: boot.lastVersion,
            errors24h: (bySeverity.error || 0) + (bySeverity.critical || 0),
            noise24h: bySeverity.info || 0,
            rssPeakMb: (F_.memStats || {}).maxMb, rssSampleCount: alertRows.length,
            commands24h: totals.events || 0,
            distinctUsers24h: new Set((F_.cmdStats || []).map((c) => c.command)).size,
            spark: { alerts: spark(1, (bySeverity.error || 0) + 4), commands: spark(3, Math.round((totals.events || 0) / 7)) },
            restarts24h: 0, restarts7d: boot.boots || 0,
        },
        usageStats: F_.cmdStats || [], timingStats: F_.depStats || [],
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
    })],
    [/^\/api\/season$/, () => ({
        live: seasonLive(),
        draft: FIX.draft ? { ...FIX.draft } : null,
        grantedPages: ['season', 'draws', 'calendar', 'patchnotes'],
    })],
    [/^\/api\/armory$/, () => ({ builds: (FIX.builds || []).map(armoryBuild), grantedPages: ['loadouts'] })],
    [/^\/api\/armory\/preview/, () => ({ card: FIXTURE_CARD })],
    [/^\/api\/armory\/export/, () => ({ text: '(harness: bulk export text)' })],
    [/^\/api\/broadcast$/, () => ({
        live: (FIX.announcements || []).filter((a) => a.active !== false),
        all: FIX.announcements || [],
    })],
    [/^\/api\/access$/, () => ({
        admins: FIX.accessAdmins || [], sessions: FIX.sessions || [],
        singlePointsOfFailure: FIX.spof || FIX.SPOF || [],
    })],
    [/^\/api\/access\/matrix$/, () => ({ scopes: FIX.accessScopes || FIX.SCOPES || [], admins: FIX.accessAdmins || [] })],
    [/^\/api\/analytics$/, () => analyticsPayload()],
    [/^\/api\/review$/, () => reviewPayload()],
    // 🔴 BOTH FORMS, AND THE BARE ONE WAS MISSING. season.js fetches `/api/changeset?realm=season` and board.js fetches `/api/changeset/:id/preview`, but the route the API actually registers is `/^\/api\/changeset$/` — and with no stub for it the Board's own fetch fell through to the unrouted {ok:true} fallback, so `body.changesets` was undefined and the Board rendered empty all session while looking perfectly fine. Caught by scripts/portalHarness.test.js, which is the only thing that compares what the stub returns against what the route promises.
    [/^\/api\/changeset(\?|$)/, () => ({ changesets: harnessChangesets() })],
    [/^\/api\/changeset\/[^/]+\/preview$/, () => ({ preview: null })],
];

export async function fetchJson(path, opts) {
    for (const [re, make] of ROUTES) {
        if (re.test(path)) {
            const body = make();
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
