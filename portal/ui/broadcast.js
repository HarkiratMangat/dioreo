// portal/ui/broadcast.js — ESM. The Broadcast realm: Now showing + Airtime + a Post form + inline
// edit + bulk actions, reusing <Shell>/<Manifest> unchanged.
//
// buildBroadcastAddOp/buildBroadcastEditOp come from broadcast.logic.js, loaded as a plain CLASSIC
// <script> before this module -- see track.js's header comment for why a literal ESM import of a
// .logic.js sibling would fail in a real browser (found live in season.js's own prior version).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { stageOps } from './composeClient.js';

const BROADCAST_COLUMNS = [
    { key: 'text', label: 'Text', editable: true },
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

// Mirrors /manage's real post-announcement modal (text/expiry) plus startsAt (new field, this task --
// core/ops/announcements.js's own header explains why it's a real admin date, unlike expiry which is
// a day-count). A blank expiry means the server's own 60-day default; a blank start means "shows
// immediately" -- both sent as null rather than guessed at client-side.
function PostForm({ onSubmit, onCancel }) {
    const [text, setText] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const ready = text.trim();

    function submit() {
        onSubmit(buildBroadcastAddOp({
            text,
            startsAt: startsAt.trim() ? new Date(startsAt).toISOString() : null,
            expiresAt: expiresAt.trim() ? new Date(expiresAt).toISOString() : null,
        }));
    }

    return html`
        <div class="panel" style="margin-bottom:14px">
            <div class="ph"><span class="t">Post an announcement</span></div>
            <div style="padding:12px 14px">
                <label class="sr-only" for="post-text">Announcement text</label>
                <textarea id="post-text" placeholder="Announcement text" value=${text} onInput=${(e) => setText(e.target.value)} rows="3"
                          style="width:100%;background:var(--sunk);border:1px solid var(--rule);border-radius:5px;color:var(--ink);font-size:13px;padding:7px 10px"></textarea>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;padding:0 14px 12px;align-items:center">
                <label class="sr-only" for="post-starts">Starts at (blank = immediately)</label>
                <input id="post-starts" type="date" value=${startsAt} onInput=${(e) => setStartsAt(e.target.value)} />
                <label class="sr-only" for="post-expires">Expires at (blank = 60-day default)</label>
                <input id="post-expires" type="date" value=${expiresAt} onInput=${(e) => setExpiresAt(e.target.value)} />
                <button class="accent-fill" disabled=${!ready} onClick=${submit}>Stage</button>
                <button onClick=${onCancel}>Cancel</button>
            </div>
        </div>
    `;
}

export function BroadcastRealm({ session }) {
    const [data, setData] = useState({ live: [], all: [] });
    const [showAdd, setShowAdd] = useState(false);
    const [notice, setNotice] = useState('');

    function refresh() { fetchJson('/api/broadcast').then(setData); }
    useEffect(refresh, []);

    if (data.signedOut || data.forbidden) return html`<${NoAccess} />`;

    // Same missing-id gap as Armory: /api/broadcast never mapped _id -> id, so nothing selectable or
    // editable on this Manifest actually worked before this mapping existed.
    const rows = data.all.map((a) => ({ ...a, id: a._id }));

    async function handleAdd(op) {
        await stageOps('broadcast', [op], session.csrfToken);
        setShowAdd(false);
        refresh();
    }

    // No bulk-delete op exists for announcements (unlike loadouts' loadout.bulkDelete) -- one
    // announcement.delete per selected id, in a single changeset, which is exactly what a multi-op
    // changeset is for.
    async function handleBulkDelete(ids) {
        const ops = ids.map((id) => ({ type: 'announcement.delete', target: { id }, payload: {} }));
        if (ops.length) await stageOps('broadcast', ops, session.csrfToken);
        refresh();
    }

    function handleExportSelection(ids) {
        const selected = rows.filter((r) => ids.includes(r.id));
        const text = selected.map((r) => `${r.text} — expires ${r.expiresAt ? new Date(r.expiresAt).toDateString() : 'never'}`).join('\n');
        globalThis.open(`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`, '_blank');
    }

    return html`
        <${Shell} realm="broadcast" session=${session}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 14px">${notice}</p>` : null}
                      ${showAdd ? html`<${PostForm} onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)} />` : null}
                      <${NowShowing} live=${data.live} /><${Airtime} all=${data.all} />
                  `}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${BROADCAST_COLUMNS} searchableFields=${['text']} stateOf=${() => 'live'}
                                                    onAdd=${() => setShowAdd(true)} realm="broadcast" csrfToken=${session.csrfToken}
                                                    buildEditOp=${buildBroadcastEditOp}
                                                    onEditError=${(msg) => setNotice(msg)}
                                                    bulkActions=${[
                                                        { label: 'Export selection', onClick: handleExportSelection },
                                                        { label: 'Stage deletion', danger: true, onClick: handleBulkDelete },
                                                    ]} />`} />
    `;
}
