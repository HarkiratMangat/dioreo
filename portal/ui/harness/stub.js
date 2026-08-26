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
const ALL_REALMS = ['season', 'armory', 'broadcast', 'access', 'analytics'];
const params = new URLSearchParams(location.search);
const realms = params.get('realms') ? params.get('realms').split(',') : ALL_REALMS;
const owner = params.get('owner') !== '0';

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
    [/^\/api\/armory$/, () => ({ builds: FIX.builds || [], grantedPages: ['loadouts'] })],
    [/^\/api\/armory\/preview/, () => ({ card: null })],
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
    [/^\/api\/analytics$/, () => ({
        river: FIX.changeLog || FIX.changeLogRows || [], usage: FIX.cmdStats || [],
        timing: FIX.depStats || [], alerts: FIX.alertSample || [], health: FIX.bootStats || {},
        usageStats: FIX.OBS_TOTALS || {}, timingStats: FIX.memStats || {},
    })],
    [/^\/api\/changeset\?/, () => ({ changesets: [] })],
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
