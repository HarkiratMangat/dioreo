// portal/ui/access.js — ESM. The Access realm: By admin + By scope, owner-only (spec §8.2 — no grantable scope, exactly like /bot access). Reuses <Manifest> for the live-session list, which carries an End session control the bot itself cannot offer (revoking in Discord does not kill a browser session).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell } from './shell.js';
import { Manifest } from './manifest.js';

const SESSION_COLUMNS = [
    { key: 'discordId', label: 'Discord ID' },
    { key: 'lastSeenAt', label: 'Last seen', dataKind: 'date', render: (r) => new Date(r.lastSeenAt).toLocaleString() },
    { key: 'userAgent', label: 'Device' },
];

// "By admin is the grid you grant from" (spec §8.2) — a review pass found the API's grant/revoke routes had no caller anywhere: this form is what was missing. Grant/revoke both require the admin to type the exact target Discord ID as the tier-3 confirmation (portal/api/access.js's confirmMatchesTarget) — there is no separate export step for a permission change.
function GrantForm({ onGrant }) {
    const [discordId, setDiscordId] = useState('');
    const [permissions, setPermissions] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const ready = discordId && confirmText === discordId;
    return html`
        <div style="display:flex;gap:8px;flex-wrap:wrap;padding:10px 0;border-top:1px dashed var(--rule);margin-top:8px">
            <input placeholder="Discord ID to grant" value=${discordId} onInput=${(e) => setDiscordId(e.target.value)} />
            <input placeholder="permissions (e.g. manage.draws,bot)" value=${permissions} onInput=${(e) => setPermissions(e.target.value)} />
            <input placeholder="Type the Discord ID to confirm" value=${confirmText} onInput=${(e) => setConfirmText(e.target.value)} />
            <button disabled=${!ready} onClick=${() => onGrant(discordId, permissions.split(',').map(p => p.trim()).filter(Boolean), confirmText)}>Grant</button>
        </div>
    `;
}

function ByAdmin({ admins, onGrant, onRevoke }) {
    return html`
        <div class="panel" id="by-admin">
            <div class="ph"><span class="t">By admin</span></div>
            <div style="padding:12px 14px">
                ${admins.map(a => html`
                    <div style="padding:8px 0;border-bottom:1px solid var(--sunk);display:flex;align-items:center;gap:10px">
                        <div style="flex:1">
                            <b>${a.discordId}</b> — ${(a.permissions || []).join(', ') || 'no permissions'}
                            ${a.note ? html` <span style="color:var(--ink3)">(${a.note})</span>` : null}
                        </div>
                        <button class="danger" onClick=${() => onRevoke(a.discordId)}>Revoke</button>
                    </div>
                `)}
                <${GrantForm} onGrant=${onGrant} />
            </div>
        </div>
    `;
}

function ByScope({ spof }) {
    return html`
        <div class="panel" id="by-scope">
            <div class="ph"><span class="t">By scope — single points of failure</span></div>
            <div style="padding:12px 14px">
                ${spof.length === 0 ? html`<p style="color:var(--ink3)">No scope is held by exactly one non-owner admin.</p>` : spof.map(s => html`
                    <div style="padding:6px 0;color:var(--warn);font-family:'JetBrains Mono',monospace;font-size:12px">
                        ${s.scope} — held only by ${s.discordId}
                    </div>
                `)}
            </div>
        </div>
    `;
}

export function AccessRealm({ session }) {
    const [data, setData] = useState({ admins: [], sessions: [], singlePointsOfFailure: [] });
    const [notice, setNotice] = useState('');

    function refresh() { fetch('/api/access', { credentials: 'same-origin' }).then(r => r.json()).then(setData); }
    useEffect(refresh, []);

    async function endSession(sessionHash) {
        await fetch('/api/access/session/end', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
            body: JSON.stringify({ sessionHash }),
        });
        refresh();
    }

    async function grant(discordId, permissions, confirmText) {
        const res = await fetch('/api/access/grant', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
            body: JSON.stringify({ discordId, permissions, confirmText }),
        });
        const body = await res.json();
        setNotice(res.ok ? '' : (body.reason || 'Grant failed'));
        refresh();
    }

    async function revoke(discordId) {
        const confirmText = prompt(`Type ${discordId} to confirm revoking this admin.`);
        const res = await fetch('/api/access/revoke', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
            body: JSON.stringify({ discordId, confirmText }),
        });
        const body = await res.json();
        setNotice(res.ok ? '' : (body.reason || 'Revoke failed'));
        refresh();
    }

    return html`
        <${Shell} realm="access" session=${session}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 14px">${notice}</p>` : null}
                      <${ByAdmin} admins=${data.admins} onGrant=${grant} onRevoke=${revoke} />
                      <${ByScope} spof=${data.singlePointsOfFailure} />
                  `}
                  manifestSlot=${html`<${Manifest} rows=${data.sessions.map(s => ({ ...s, id: s.sessionHash }))} columns=${SESSION_COLUMNS}
                                                    searchableFields=${['discordId']} stateOf=${() => 'live'}
                                                    bulkActions=${[{ label: 'End session', danger: true, onClick: (ids) => ids.forEach(endSession) }]} />`} />
    `;
}
