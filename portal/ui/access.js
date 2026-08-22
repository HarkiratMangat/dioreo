// portal/ui/access.js — ESM. The Access realm: By admin + By scope, owner-only (spec §8.2 — no
// grantable scope, exactly like /bot access). Reuses <Manifest> for the live-session list, which
// carries an End session control the bot itself cannot offer (revoking in Discord does not kill a
// browser session).
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

function ByAdmin({ admins }) {
    return html`
        <div class="panel" id="by-admin">
            <div class="ph"><span class="t">By admin</span></div>
            <div style="padding:12px 14px">
                ${admins.map(a => html`
                    <div style="padding:8px 0;border-bottom:1px solid var(--sunk)">
                        <b>${a.discordId}</b> — ${(a.permissions || []).join(', ') || 'no permissions'}
                        ${a.note ? html` <span style="color:var(--ink3)">(${a.note})</span>` : null}
                    </div>
                `)}
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
    useEffect(() => { fetch('/api/access', { credentials: 'same-origin' }).then(r => r.json()).then(setData); }, []);

    async function endSession(sessionHash) {
        await fetch('/api/access/session/end', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
            body: JSON.stringify({ sessionHash }),
        });
        fetch('/api/access', { credentials: 'same-origin' }).then(r => r.json()).then(setData);
    }

    return html`
        <${Shell} realm="access" session=${session}
                  viewSlot=${html`<${ByAdmin} admins=${data.admins} /><${ByScope} spof=${data.singlePointsOfFailure} />`}
                  manifestSlot=${html`<${Manifest} rows=${data.sessions.map(s => ({ ...s, id: s.sessionHash }))} columns=${SESSION_COLUMNS}
                                                    searchableFields=${['discordId']} stateOf=${() => 'live'}
                                                    bulkActions=${[{ label: 'End session', danger: true, onClick: (ids) => ids.forEach(endSession) }]} />`} />
    `;
}
