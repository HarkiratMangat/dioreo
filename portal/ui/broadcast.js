// portal/ui/broadcast.js — ESM. The Broadcast realm: Now showing + Airtime, reusing
// <Shell>/<Manifest> unchanged.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell } from './shell.js';
import { Manifest } from './manifest.js';

const BROADCAST_COLUMNS = [
    { key: 'text', label: 'Text' },
    { key: 'createdAt', label: 'Posted', dataKind: 'date', render: (r) => new Date(r.createdAt).toDateString() },
    { key: 'expiresAt', label: 'Expires', dataKind: 'date', render: (r) => r.expiresAt ? new Date(r.expiresAt).toDateString() : 'never' },
];

function NowShowing({ live }) {
    return html`
        <div class="panel" id="now-showing">
            <div class="ph"><span class="t">Now showing</span></div>
            <div style="padding:12px 14px">
                ${live.length === 0 ? html`<p style="color:var(--ink3)">Nothing is currently showing.</p>` : live.map((a, i) => html`
                    <div style="padding:8px 0;border-bottom:1px solid var(--sunk)"><b>${i + 1}.</b> ${a.text}</div>
                `)}
            </div>
        </div>
    `;
}

function Airtime({ all }) {
    // How long each announcement has been up — the defect this view exists to surface (spec §8.2's
    // "up for 19 days with no expiry" case), computed from createdAt rather than flagged by hand.
    const now = Date.now();
    return html`
        <div class="panel" id="airtime">
            <div class="ph"><span class="t">Airtime</span></div>
            <div style="padding:12px 14px">
                ${all.map(a => {
                    const days = Math.round((now - new Date(a.createdAt).getTime()) / 86400000);
                    return html`<div style="padding:6px 0;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--ink2)">
                        ${a.text.slice(0, 40)} — up ${days}d ${!a.expiresAt ? html`<span style="color:var(--warn)">(no expiry)</span>` : ''}
                    </div>`;
                })}
            </div>
        </div>
    `;
}

export function BroadcastRealm({ session }) {
    const [data, setData] = useState({ live: [], all: [] });
    useEffect(() => { fetch('/api/broadcast', { credentials: 'same-origin' }).then(r => r.json()).then(setData); }, []);
    return html`
        <${Shell} realm="broadcast" session=${session}
                  viewSlot=${html`<${NowShowing} live=${data.live} /><${Airtime} all=${data.all} />`}
                  manifestSlot=${html`<${Manifest} rows=${data.all} columns=${BROADCAST_COLUMNS} searchableFields=${['text']} stateOf=${() => 'live'} />`} />
    `;
}
