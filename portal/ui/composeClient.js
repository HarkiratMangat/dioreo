// portal/ui/composeClient.js — ESM. The one client every realm uses to turn a composed op (or a
// bulk set of ops) into a real changeset. See docs/superpowers/specs/2026-08-21-portal-compose-ui-design.md §1
// for why there are two entry points: stageOps alone (Add forms, Track drag, bulk actions — the
// result surfaces on Board for a deliberate Commit, matching the approved mockup) and
// stageAndCommit (Manifest's single-cell inline edit — always tier 1, so committing needs no
// gates, giving the "saves on field commit" feel the parent spec's §5 describes).
import { fetchJson } from './httpClient.js';

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
