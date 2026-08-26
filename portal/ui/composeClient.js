// portal/ui/composeClient.js — ESM. The one client every realm uses to turn a composed op (or a bulk set of ops) into a real changeset. See docs/superpowers/specs/2026-08-21-portal-compose-ui-design.md §1 for why there are two entry points: stageOps alone (Add forms, Track drag, bulk actions — the result surfaces on Board for a deliberate Commit, matching the approved mockup) and stageAndCommit (Manifest's single-cell inline edit — always tier 1, so committing needs no gates, giving the "saves on field commit" feel the parent spec's §5 describes).
import { fetchJson } from './httpClient.js';
import { downloadText } from './download.js';

// 🔴 THE EXPORT NOW PRODUCES A FILE, AND THAT IS THE WHOLE POINT OF IT. The route used to set a timestamp and return nothing, so the tier-3 gate was satisfied by a button that exported no data — while the confirmation told the reader that export was "the only way back" from a purge. It returns the changeset's baseline now, and this is the half that puts it on disk: without the save, the server has still marked the gate satisfied and the reader still has nothing.
//
// ⚠️ The Blob-and-anchor mechanism moved to portal/ui/download.js unchanged, including the next-frame revoke. It was the ONE export in this app known to work, and two realms were meanwhile calling `window.open('data:…')`, which browsers block — so it is now the only mechanism rather than the working half of two.
export async function exportChangeset(changesetId, csrfToken) {
    const res = await fetchJson(`/api/changeset/${changesetId}/export`, {
        method: 'POST', headers: { 'x-csrf-token': csrfToken },
    });
    if (!res || !res.payload) return res;
    downloadText(res.filename || `dioreo-changeset-${changesetId}.json`,
        JSON.stringify(res.payload, null, 2), 'application/json');
    return res;
}

export async function stageOps(realm, ops, csrfToken) {
    return fetchJson('/api/changeset', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ realm, ops }),
    });
}

export async function stageAndCommit(realm, ops, csrfToken) {
    const staged = await stageOps(realm, ops, csrfToken);
    if (staged.signedOut || staged.forbidden) return { ok: false, reason: 'You do not have access.' };
    if (!staged.changesetId) return { ok: false, reason: staged.error || 'Could not stage the change.' };
    const res = await fetchJson(`/api/changeset/${staged.changesetId}/commit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({}),
    });
    return res;
}
