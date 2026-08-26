// portal/ui/access.js — ESM. The Access realm: By admin + By scope, owner-only (spec §8.2 — no grantable scope, exactly like /bot access). Reuses <Manifest> for the live-session list, which carries an End session control the bot itself cannot offer (revoking in Discord does not kill a browser session).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';

const SESSION_COLUMNS = [
    { key: 'discordId', label: 'Discord ID' },
    { key: 'lastSeenAt', label: 'Last seen', dataKind: 'date', render: (r) => relTime(r.lastSeenAt) },
    { key: 'userAgent', label: 'Device' },
];

// "8m ago" rather than a full locale timestamp: the question this column answers is "is this person in here right now", and a wall-clock time makes the reader do the subtraction (06's own column reads "now" / "8m ago" / "3d ago" for the same reason).
function relTime(value) {
    if (!value) return '—';
    const secs = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
    if (secs < 90) return 'now';
    if (secs < 5400) return `${Math.round(secs / 60)}m ago`;
    if (secs < 172800) return `${Math.round(secs / 3600)}h ago`;
    return `${Math.round(secs / 86400)}d ago`;
}

// "By admin is the grid you grant from" (spec §8.2) — a review pass found the API's grant/revoke routes had no caller anywhere: this form is what was missing. Grant/revoke both require the admin to type the exact target Discord ID as the tier-3 confirmation (portal/api/access.js's confirmMatchesTarget) — there is no separate export step for a permission change.
function GrantForm({ onGrant }) {
    const [discordId, setDiscordId] = useState('');
    const [permissions, setPermissions] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const ready = discordId && confirmText === discordId;
    return html`
        <div class="grantrow">
            <label class="sr-only" for="grant-discordid">Discord ID to grant</label>
            <input id="grant-discordid" placeholder="Discord ID to grant" value=${discordId} onInput=${(e) => setDiscordId(e.target.value)} />
            <label class="sr-only" for="grant-permissions">Permissions</label>
            <input id="grant-permissions" placeholder="permissions (e.g. manage.draws,bot)" value=${permissions} onInput=${(e) => setPermissions(e.target.value)} />
            <label class="sr-only" for="grant-confirm">Type the Discord ID to confirm</label>
            <input id="grant-confirm" placeholder="Type the Discord ID to confirm" value=${confirmText} onInput=${(e) => setConfirmText(e.target.value)} />
            <button class="accent-fill" disabled=${!ready} onClick=${() => onGrant(discordId, permissions.split(',').map(p => p.trim()).filter(Boolean), confirmText)}>Grant</button>
            <span class="hint">A new admin starts with nothing granted — there is no default. Type the Discord ID twice: once to name them, once to confirm.</span>
        </div>
    `;
}

// Revoke used to fire a blocking native prompt() while Grant used an inline styled input -- inconsistent confirmation UX within the same realm (code review Important #6). Same reveal-then-type-to-confirm pattern as GrantForm now, no native dialog anywhere.
function RevokeControl({ discordId, onRevoke }) {
    const [confirming, setConfirming] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    if (!confirming) return html`<button class="danger" onClick=${() => setConfirming(true)}>Revoke</button>`;
    return html`
        <span style="display:flex;gap:6px;align-items:center">
            <label class="sr-only" for=${`revoke-confirm-${discordId}`}>Type ${discordId} to confirm</label>
            <input id=${`revoke-confirm-${discordId}`} placeholder=${`Type ${discordId} to confirm`} value=${confirmText}
                   onInput=${(e) => setConfirmText(e.target.value)} />
            <button class="danger" disabled=${confirmText !== discordId} onClick=${() => onRevoke(discordId, confirmText)}>Confirm revoke</button>
            <button onClick=${() => { setConfirming(false); setConfirmText(''); }}>Cancel</button>
        </span>
    `;
}

// By admin -- THE GRID. Spec §8.2: "By admin is the grid you grant from." It shipped as one line per admin holding a comma-separated permission string, which is precisely the Discord modal field this realm exists to replace: you cannot see at a glance who can touch the calendar without reading every row, and a mistyped token is invisible until it silently fails.
//
// Two things the grid does that the string cannot, and both are why it is worth building: INHERITANCE (a bare `manage` lights every page in a paler green, so you see what you actually handed over rather than remembering the rule) and, in the By-scope view below, SINGLE POINTS OF FAILURE. Data comes from GET /api/access/matrix, which Phase 2 built over the exact same scope enumeration singlePointsOfFailure() already used -- never a second list that could drift.
function ByAdmin({ matrix, onGrant, onRevoke, isOwnerId }) {
    const scopes = matrix.scopes || [];
    const commands = scopes.filter((s) => s.kind === 'command');
    const pages = scopes.filter((s) => s.kind === 'page');
    const ordered = [...commands, ...pages];
    return html`
        <div class="panel" id="by-admin">
            <div class="ph">
                <span class="t">By admin</span>
                <span class="rt">${matrix.admins.length} granted · owner is not editable</span>
            </div>
            ${matrix.admins.length === 0 ? html`<p class="empty">Nobody else has been granted access. You are the only admin.</p>` : html`
                <div class="gwrap">
                    <table class="grid">
                        <thead>
                            <tr>
                                <th class="who"></th>
                                <th class="grp" colspan=${commands.length}>Commands</th>
                                <th class="grp" colspan=${pages.length}>/manage pages</th>
                                <th class="act"></th>
                            </tr>
                            <tr>
                                <th class="who">Admin</th>
                                ${ordered.map((sc) => html`<th>${sc.label}</th>`)}
                                <th class="act">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${matrix.admins.map((a) => html`
                                <tr>
                                    <td class="who">
                                        <b>${a.discordId}</b>
                                        <span>${a.note ? a.note + ' · ' : ''}${a.grantedAt ? 'granted ' + new Date(a.grantedAt).toISOString().slice(0, 10) : ''}</span>
                                    </td>
                                    ${ordered.map((sc) => {
                                        const g = a.grants[sc.key] || {};
                                        const cls = g.direct ? 'cel on' : g.inherited ? 'cel inh' : 'cel';
                                        const what = g.direct ? 'granted directly' : g.inherited ? 'inherited from manage' : 'not granted';
                                        return html`<td><span class=${cls} role="img" aria-label=${`${sc.label}: ${what}`} title=${`${sc.label} — ${what}`}>✓</span></td>`;
                                    })}
                                    <td class="act">${a.discordId === isOwnerId
                                        ? html`<span class="holder">locked</span>`
                                        : html`<${RevokeControl} discordId=${a.discordId} onRevoke=${onRevoke} />`}</td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                </div>
                <div class="glegend">
                    <span><span class="cel on">✓</span>granted directly</span>
                    <span><span class="cel inh">✓</span>inherited — a bare <code>manage</code> covers every page</span>
                    <span>The owner has everything and cannot be edited.</span>
                </div>
            `}
            <${GrantForm} onGrant=${onGrant} />
        </div>
    `;
}

// By scope -- the inverse of the grid, and it answers a question the grid structurally cannot: "who can touch the calendar?" without reading across a row. Holders are derived from the SAME matrix rather than a second query, so the two views can never disagree about who holds what.
function ByScope({ matrix, spof, ownerId }) {
    const spofScopes = new Set((spof || []).map((s) => s.scope));
    return html`
        <div class="panel" id="by-scope">
            <div class="ph">
                <span class="t">By scope</span>
                <span class="rt">${spofScopes.size ? `${spofScopes.size} single point${spofScopes.size === 1 ? '' : 's'} of failure` : 'no single points of failure'}</span>
            </div>
            <div class="scopes">
                ${(matrix.scopes || []).map((sc) => {
                    const holders = matrix.admins.filter((a) => (a.grants[sc.key] || {}).held).map((a) => a.discordId);
                    const alone = spofScopes.has(sc.key);
                    return html`
                        <div class=${'scope' + (alone ? ' spof' : '')}>
                            <span class="nm">${sc.key}</span>
                            ${ownerId ? html`<span class="holder owner">owner</span>` : null}
                            ${holders.map((h) => html`<span class="holder">${h.slice(-6)}</span>`)}
                            ${alone ? html`<span class="flag">⚠ single point</span>` : null}
                        </div>
                    `;
                })}
            </div>
        </div>
    `;
}

export function AccessRealm({ session }) {
    const [data, setData] = useState({ admins: [], sessions: [], singlePointsOfFailure: [] });
    const [matrix, setMatrix] = useState({ admins: [], scopes: [] });
    const [notice, setNotice] = useState('');
    const [view, setView] = useState('By admin');

    function refresh() {
        fetchJson('/api/access').then(setData);
        fetchJson('/api/access/matrix').then(setMatrix);
    }
    useEffect(refresh, []);

    async function endSession(sessionHash) {
        await fetchJson('/api/access/session/end', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
            body: JSON.stringify({ sessionHash }),
        });
        refresh();
    }

    async function grant(discordId, permissions, confirmText) {
        const body = await fetchJson('/api/access/grant', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
            body: JSON.stringify({ discordId, permissions, confirmText }),
        });
        setNotice(body.ok ? '' : (body.reason || body.error || 'Grant failed'));
        refresh();
    }

    async function revoke(discordId, confirmText) {
        const body = await fetchJson('/api/access/revoke', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
            body: JSON.stringify({ discordId, confirmText }),
        });
        setNotice(body.ok ? '' : (body.reason || body.error || 'Revoke failed'));
        refresh();
    }

    if (data.signedOut || data.forbidden) return html`<${NoAccess} />`;

    // A session is "signed in now" if it was seen in the last 15 minutes -- the same rough threshold 06-access-and-analytics.html's own "2 signed in now" stat line implies. Not a stored flag: a browser session has no logout event unless someone clicks it, so recency is the only honest signal there is.
    const activeSessions = data.sessions.filter((s) => Date.now() - new Date(s.lastSeenAt).getTime() < 15 * 60000).length;

    return html`
        <${Shell} realm="access" session=${session} view=${view} viewOptions=${['By admin', 'By scope']} onSetView=${setView}
                  masthead=${html`<${Masthead} title="Access" sub="who can do what — and who is in here right now"
                                               stats=${[
                                                   { value: data.admins.length, label: 'granted' },
                                                   { value: activeSessions, label: 'signed in now', tone: activeSessions ? 'hot' : undefined },
                                                   { value: (data.singlePointsOfFailure || []).length, label: 'single points', tone: (data.singlePointsOfFailure || []).length ? 'bad' : undefined },
                                               ]} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      ${view === 'By admin'
                          ? html`<${ByAdmin} matrix=${matrix} onGrant=${grant} onRevoke=${revoke} isOwnerId=${session.discordId} />`
                          : html`<${ByScope} matrix=${matrix} spof=${data.singlePointsOfFailure} ownerId=${session.discordId} />`}
                  `}
                  manifestSlot=${html`<${Manifest} rows=${data.sessions.map(s => ({ ...s, id: s.sessionHash, state: 'live' }))} columns=${SESSION_COLUMNS}
                                                    title="Live portal sessions"
                                                    headerRight="Revoking an admin in Discord does not end their browser session — this does."
                                                    emptyText="Nobody is signed in to the portal."
                                                    searchableFields=${['discordId']}
                                                    bulkActions=${[{ label: 'End session', danger: true, onClick: (ids) => ids.forEach(endSession) }]} />`} />
    `;
}
