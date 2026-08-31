// portal/ui/httpClient.js — ESM. The one fetch wrapper every realm should use, so a 401 (session expired) and a 403 (access revoked) are recognized the same way everywhere instead of each realm re-deriving its own error shape from the response body (simplify Reuse #1 / Altitude #16 — this used to live as an unexported local in app.js, used only for /auth/csrf).
//
// 🔴 IT USED TO THROW, AND NOTHING CAUGHT IT. `return res.json()` rejects on a dropped connection and on any non-JSON body — which is exactly what a 500 produces, and what a proxy or a tunnel in front of the portal produces. Every realm called this as `fetchJson(path).then(setData)` with no second argument, so all three cases became an unhandled rejection and the page sat on the word "Loading" forever. A request now always RESOLVES; the payload says what happened, and portal/ui/async.logic.js turns that into a verdict.
//
// 🔴 A 4xx BODY IS AN ANSWER AND MUST SURVIVE UNTOUCHED. The commit path reads a 409 carrying the gate result ({ok:false, reason}), and Access reads a 400 carrying {error}. Collapsing every non-2xx into a generic failure would have silently destroyed both — the caller would see no reason, show its fallback string, and the specific sentence the server wrote would be gone. So only 5xx, an unreadable body, and a connection that never landed are converted; everything else passes through with `httpStatus` added, which is additive and cannot change an existing read.
export async function fetchJson(path, opts) {
    let res;
    try {
        res = await fetch(path, { credentials: 'same-origin', ...opts });
    } catch (e) {
        // A fetch that rejects never reached the server: the tunnel is down, the machine is offline, or the request was aborted. Nothing was written, and saying so is the point.
        return { failed: true, offline: true, status: 0, detail: String((e && e.message) || e) };
    }
    if (res.status === 401) return { signedOut: true };
    if (res.status === 403) return { forbidden: true };

    let body;
    try {
        body = await res.json();
    } catch (e) {
        return { failed: true, unreadable: true, status: res.status, detail: String((e && e.message) || e) };
    }
    if (res.status >= 500) {
        return { ...(body && typeof body === 'object' ? body : {}), failed: true, status: res.status,
            detail: (body && body.error) || null };
    }
    return (body && typeof body === 'object') ? { ...body, httpStatus: res.status } : body;
}
