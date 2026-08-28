// portal/ui/async.js — ESM. The six states a request can be in, as components rather than as the word "Loading".
//
// 🔴 FIVE OF THE SIX DID NOT EXIST IN THIS PORTAL. The adopted design specifies skeleton, refreshing, slow, failure, progress and a page-level banner; what shipped was a paragraph reading "Loading…" in an inline style, and NO error state at all — every realm ran `fetchJson(path).then(setData)` with no catch, so a 500, a dropped connection or an expired session left the page on that paragraph indefinitely. Neither instrument could see it: portal:orphans asks whether a class has a rule, and portal:coverage counts the shared shell's classes against every realm at once, so the whole group read as one diffuse gap spread across eight numbers rather than as one missing subsystem.
//
// ⚠️ THE STATES ARE REACHABLE ON PURPOSE — the harness answers `?fail=`, `?slow=` and `?offline=`. The lesson this package keeps re-learning is that a state nothing can put on screen is a state nobody designs and no check can open.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from './icons.js';
import { Shell, NoAccess } from './shell.js';

/* global failureOf, asyncDefaults */

// ── THE HOOK ──────────────────────────────────────────────────────────────────────────────────
//
// One request, six states. `deps` is the dependency list — NOT the loader, whose identity changes on every render and would re-fetch forever.
//
// ⚠️ `phase` DISTINGUISHES loading FROM refreshing, and that distinction is the design's rule 2: a re-read keeps the data on screen and marks the surface, because replacing a full table with a skeleton to fetch the same rows again is a regression the reader experiences as the page losing their place.
export function useAsync(loader, deps = []) {
    const [state, setState] = useState({ phase: 'loading', data: null, error: null });
    const [slow, setSlow] = useState(false);
    const [nonce, setNonce] = useState(0);

    useEffect(() => {
        let alive = true;
        const timer = setTimeout(() => { if (alive) setSlow(true); }, asyncDefaults().slowAfterMs);
        setState((s) => (s.data ? { ...s, phase: 'refreshing' } : { phase: 'loading', data: null, error: null }));
        // A rejected promise is a state, not a crash. fetchJson no longer throws, but a caller may pass any loader, and an uncaught rejection here is exactly the failure this file exists to end.
        Promise.resolve().then(loader).then(
            (data) => {
                if (!alive) return;
                clearTimeout(timer); setSlow(false);
                const failure = failureOf(data);
                setState(failure ? { phase: 'failed', data: null, error: failure }
                                 : { phase: 'ready', data, error: null });
            },
            (e) => {
                if (!alive) return;
                clearTimeout(timer); setSlow(false);
                setState({ phase: 'failed', data: null, error: failureOf({ failed: true, status: 0, detail: String(e && e.message || e) }) });
            },
        );
        return () => { alive = false; clearTimeout(timer); };
    }, [...deps, nonce]);

    return {
        ...state, slow,
        reload: () => setNonce((n) => n + 1),
        // The two host classes the adopted sheet already defines. `data-slow` carries the note the ::before renders, so the string lives with the state rather than in the stylesheet. 🔴 PRODUCED HERE AND CONSUMED BY NOTHING, FOR THE WHOLE LIFE OF THE MIGRATION. `hostClass` appeared exactly ONCE in `portal/ui` — on this line — so the refreshing state was computed correctly and rendered nowhere: a re-read over data already on screen looked identical to data sitting still, which is design rule 2 (keep the rows, mark the surface) not existing. Every realm passes it to Shell's `busy` now, and `scripts/portalAsync.test.js` refuses a realm that renders Shell without it. Found by the states harness failing to REACH a state it had registered — the value of an `expect` selector is that a state nobody can produce is a state nobody has built.
        hostClass: (state.phase === 'refreshing' ? ' is-refreshing' : '') + (slow ? ' is-slow' : ''),
    };
}

// ── SKELETON ──────────────────────────────────────────────────────────────────────────────────
//
// ⚠️ ONE LIVE REGION, NOT ONE PER ROW. A screen reader must hear "loading" once, not eighteen times, so the bars are decorative and hidden from the accessibility tree while a single visually-hidden span carries the announcement.
export function Skeleton({ rows, lines, label = 'Loading' }) {
    const d = asyncDefaults().skeleton;
    const n = rows || d.rows;
    const widths = lines || d.lines;
    return html`
        <div class="skel" role="status" aria-live="polite">
            <span class="vh">${label}…</span>
            ${Array.from({ length: n }, (_, r) => html`
                <div class="skel-r" aria-hidden="true" key=${r} style=${`--d:${r * 60}ms`}>
                    ${widths.map((w, i) => html`<i key=${i} style=${`width:${w}%`}></i>`)}
                </div>`)}
        </div>`;
}

// ── FAILURE ───────────────────────────────────────────────────────────────────────────────────
//
// 🔴 THREE FIELDS, ALL REQUIRED. An error missing any one of them is the error that gets screenshotted and sent to somebody else to interpret: WHAT failed, what that MEANS for the reader's work, and the one ACTION worth taking. "Something went wrong" with no second line is a notification, not a design.
export function Failure({ error, onAction, action, children }) {
    if (!error) return null;
    return html`
        <div class="failbox" role="alert">
            <div class="fail-h"><span class="fail-k">${error.k || 'FAILED'}</span><b>${error.what}</b></div>
            <p>${error.means}</p>
            ${children || null}
            ${error.detail ? html`<pre class="fail-d">${error.detail}</pre>` : null}
            ${onAction ? html`
                <div class="fail-a">
                    <button class="pill sm" onClick=${onAction}>${action || error.action}</button>
                </div>` : null}
        </div>`;
}

// ── PROGRESS ──────────────────────────────────────────────────────────────────────────────────
//
// A commit is N operations in one transaction, and operation 23 of 40 can fail — so progress is per-op and the failed one is NAMED. A percentage alone cannot say which one broke, and at that moment "which one" is the only question worth answering.
export function Progress({ total, done = 0, current = '', failed = null }) {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return html`
        <div class=${'prog' + (failed ? ' bad' : '')} role="status" aria-live="polite">
            <div class="prog-b"><i style=${`width:${pct}%`}></i></div>
            <div class="prog-t">
                ${failed
                    ? html`<b>Stopped at ${done + 1} of ${total}</b> · ${failed}`
                    : html`<b>${done} of ${total}</b>${current ? ` · ${current}` : ''}`}
            </div>
        </div>`;
}

// ── THE PAGE-LEVEL BANNER ─────────────────────────────────────────────────────────────────────
//
// The backend being gone, or this tab outliving its 12-hour session, are page-level facts rather than one surface's problem — so they sit above everything rather than inside whichever panel happened to notice first.
export function NetBanner({ error, onAction }) {
    if (!error) return null;
    return html`
        <div class=${'netbar ' + error.kind} role="alert">
            <span class="net-k">${error.k}</span><b>${error.what}</b>
            <span class="net-m">${error.means}</span>
            ${onAction ? html`<button class="pill sm" onClick=${onAction}>${error.action}</button>` : null}
        </div>`;
}

// ── THE MUTATION SIDE ─────────────────────────────────────────────────────────────────────────
//
// 🔴 A FAILED WRITE SAID NOTHING AT ALL. Reads at least sat on a spinner; a POST that 500ed resolved to a failure object every call site ignored, so the row simply did not change and the reader's next move is to press the button again. That is how one lost edit becomes three. Returns TRUE when the call failed, so a caller reads `if (await reportFailure(...)) return;`.
export async function reportFailure(overlay, result, what) {
    const failure = failureOf(result);
    if (!failure) return false;
    // The toast is the right surface here and a drawer is not: the reader is mid-task, the page is unchanged, and the message has to name what did not happen rather than interrupt what they were doing.
    overlay?.say?.(`${what} — ${failure.what}`, failure.action, () => { location.reload(); });
    return true;
}

// ── THE WHOLE-REALM STATE ─────────────────────────────────────────────────────────────────────
//
// 🔴 A FAILURE KEEPS THE CHROME. The first shape of this replaced the entire page with a red box, which strands the reader: no rail, no command bar, no way to reach a realm that IS working, and the only move left is the browser's back button. The banner belongs above the content and the content is what fails, so the Shell renders either way and only the view slot changes.
//
// ⚠️ `expired` and `forbidden` still route to NoAccess, deliberately. Those are the two cases where there is nothing to keep the chrome FOR — the rail's other realms are equally unreachable, and a failbox offering "try again" against a revoked permission is a control that cannot work. ⚠️ THE BANNER AND THE FAILBOX ARE NOT TWO VIEWS OF ONE FACT, AND RENDERING BOTH SAID EVERYTHING TWICE. Measured with an injected 500: the banner and the box carried the identical two sentences, one above the other, which reads as a page that has lost its composure rather than as an error worth trusting. The banner is for the two facts that are true of the WHOLE app — the backend is gone, or this session is over, so every realm in the rail is equally unreachable. A 500 on one endpoint is this realm's problem and belongs in this realm's panel.
const PAGE_LEVEL = new Set(['offline', 'expired']);

export function RealmShell({ realm, session, error, slow, onRetry, skeleton = {}, label = 'Loading' }) {
    if (error && (error.kind === 'expired' || error.kind === 'forbidden')) return html`<${NoAccess} />`;
    return html`
        <${Shell} realm=${realm} session=${session}
                  busy=${slow && !error ? 'is-slow' : ''}
                  busyNote="Still waiting on the server…"
                  viewSlot=${error
                      ? html`
                          ${PAGE_LEVEL.has(error.kind) ? html`<${NetBanner} error=${error} onAction=${onRetry} />` : null}
                          <section class="panel"><${Failure} error=${error} onAction=${onRetry} /></section>`
                      : html`<section class="panel"><${Skeleton} ...${skeleton} label=${label} /></section>`} />`;
}
