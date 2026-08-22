// portal/ui/httpClient.js — ESM. The one fetch wrapper every realm should use, so a 401 (session expired) and a 403 (access revoked) are recognized the same way everywhere instead of each realm re-deriving its own error shape from the response body (simplify Reuse #1 / Altitude #16 — this used to live as an unexported local in app.js, used only for /auth/csrf).
export async function fetchJson(path, opts) {
    const res = await fetch(path, { credentials: 'same-origin', ...opts });
    if (res.status === 401) return { signedOut: true };
    if (res.status === 403) return { forbidden: true };
    return res.json();
}
