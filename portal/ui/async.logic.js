// portal/ui/async.logic.js — classic <script> in the browser, CommonJS in Node.
//
// 🔴 THE PORTAL HAD NO WAY TO SAY THAT ANYTHING WENT WRONG. Every realm was `fetchJson(path).then(setData)` with no catch, and fetchJson called `res.json()` on whatever came back — so a 500 (an HTML error page), a dropped connection or an expired session all produced a rejected promise nobody handled, and the page sat on the word "Loading" for as long as anyone was willing to look at it. Measured against the design's own §10.6 contract, five of its six async states did not exist here: skeleton, refreshing, slow, failure and the page-level banner. The one that did was the word Loading in an inline style.
//
// This file is the pure half: what a response MEANS. It is deliberately separate from the rendering so it can be tested in Node against real status codes rather than inferred from a screenshot.

// The reader's fear on every one of these is that their staged work is gone. It is not — staging is held server-side against their account, not in this tab — and saying so is the whole job of the `means` line, which is why none of them is allowed to be empty.
const FAILURE_COPY = {
    offline: {
        k: 'OFFLINE',
        what: 'The portal cannot reach the server.',
        means: 'Nothing you have staged is lost — it is held against your account until the connection is back, and nothing has been written.',
        action: 'Retry now',
    },
    expired: {
        k: 'SIGNED OUT',
        what: 'This session expired.',
        means: 'Portal sessions last 12 hours and live in this browser only. Your staged work does not — signing in again returns you to it.',
        action: 'Sign in again',
    },
    forbidden: {
        k: 'NO ACCESS',
        what: 'Your account is not allowed to see this.',
        means: 'Signing in worked; the permission did not. Every request is re-checked on the server, so this is the real answer rather than a cached one — and nothing you have staged elsewhere is affected.',
        action: 'Back to home',
    },
    server: {
        k: 'FAILED',
        what: 'The server could not answer.',
        means: 'Nothing has been written, and anything you have staged is still here. If it keeps happening the bot process is the place to look.',
        action: 'Try again',
    },
    // ⚠️ A DISTINCT KIND, NOT A VARIANT OF `server`, BECAUSE THE CAUSE IS DIFFERENT AND SO IS THE FIX. A 200 whose body is not JSON almost always means something in front of the portal answered instead of the portal — a proxy, a tunnel, a login wall. Telling the reader "the server could not answer" when it answered fine sends them to the wrong logs.
    'bad-response': {
        k: 'UNREADABLE',
        what: 'The reply was not the portal answering.',
        means: 'Something in front of the portal replied instead — a proxy or the tunnel. Nothing has been written.',
        action: 'Reload',
    },
};

// The one place a response becomes a verdict. Returns null when the payload is a real answer.
function failureOf(payload) {
    if (!payload || typeof payload !== 'object') return { kind: 'bad-response', ...FAILURE_COPY['bad-response'] };
    if (payload.signedOut) return { kind: 'expired', ...FAILURE_COPY.expired };
    if (payload.forbidden) return { kind: 'forbidden', ...FAILURE_COPY.forbidden };
    // A 4xx whose body carries `error` is the server refusing in its own words, and its sentence is more specific than anything this file could write. `{ok:false, reason}` (the commit gate's 409) has no `error` key and is deliberately NOT caught here — that one is an answer its caller already handles, not a failure.
    if (payload.httpStatus >= 400 && payload.httpStatus < 500 && typeof payload.error === 'string') {
        return { kind: 'refused', k: 'REFUSED', what: payload.error,
            means: FAILURE_COPY.server.means, action: 'Back to home', status: payload.httpStatus };
    }
    if (payload.failed) {
        const kind = payload.offline ? 'offline' : payload.status === 0 ? 'offline'
            : payload.unreadable ? 'bad-response' : 'server';
        return { kind, ...FAILURE_COPY[kind], detail: payload.detail || null, status: payload.status ?? null };
    }
    return null;
}

// ⚠️ A THRESHOLD, NOT A TIMEOUT — nothing is cancelled. 2.5s is the point at which a person starts wondering whether their click registered, and the honest move is to stop pretending the wait is normal.
const SLOW_AFTER_MS = 2500;

// Skeleton geometry is declared by the CALLER, because only the realm knows its own shape: a four-cell row reads as [38, 14, 20, 12] so the placeholder carries the layout's rhythm instead of a generic grey slab.
const DEFAULT_SKELETON = { rows: 6, lines: [40, 16, 22, 12] };

// 🔴 A WRITE HAS A THIRD ANSWER THAT A READ DOES NOT: REFUSED ON PURPOSE. A commit that fails its tier-3 gate answers 409 with {ok:false, reason} — a deliberate, correct, well-formed no, carrying the one sentence explaining it. Every commit and discard call site threw that away and refreshed as though it had worked, so typing the wrong confirmation word did nothing visible at all and the reader's next move is to press the button again. This collapses the three cases into the one string a caller has to show, or null when the write really did land.
function refusalOf(result) {
    const failure = failureOf(result);
    if (failure) return failure.what;
    if (result && result.ok === false) return result.reason || result.error || 'The server refused the change.';
    return null;
}

// ⚠️ REACHED THROUGH A FUNCTION, NOT READ AS A GLOBAL CONST. A top-level `const` in a classic script lands in the global LEXICAL environment rather than on window, and nothing in this codebase had ever read one from an ESM sibling before — so the pattern was unproven, and an unproven pattern that fails returns undefined rather than throwing. A function declaration is the mechanism every other .logic.js here already relies on and is visible from both sides beyond doubt.
function asyncDefaults() {
    return { slowAfterMs: SLOW_AFTER_MS, skeleton: DEFAULT_SKELETON };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FAILURE_COPY, failureOf, refusalOf, asyncDefaults, SLOW_AFTER_MS, DEFAULT_SKELETON };
}
