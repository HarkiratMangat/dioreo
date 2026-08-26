// portal/ui/access.js — ESM. The Access realm: By admin + By scope, owner-only (spec §8.2 — no grantable scope, exactly like /bot access). Reuses <Manifest> for the live-session list, which carries an End session control the bot itself cannot offer (revoking in Discord does not kill a browser session).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { useAsync, RealmShell } from './async.js';
import { useOverlay } from './overlay.js';
import { Icon } from './icons.js';

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
        <div class="addrow">
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

// 🔴 THIS ROW GREW ITS OWN CONFIRMATION DIALOG INSIDE A TABLE CELL. Revoke first fired a blocking native prompt(); replacing it with a reveal-then-type-to-confirm strip fixed the native dialog and left the real problem — a destructive, permission-changing confirmation rendered as three controls squeezed into a 120px `.act` column, in a row that scrolls horizontally with the grid. It also meant this realm had a confirmation pattern of its own while every other realm went through the shared drawer.
//
// The button is now just a button. The typed gate did not go away; it moved to the drawer, where it has room to say what revoking does and the same shape it has everywhere else in the portal.
function RevokeControl({ discordId, onRevoke }) {
    return html`<button class="danger" onClick=${() => onRevoke(discordId)}>Revoke</button>`;
}

// By admin — THE GRID, and as of 2026-08-26 the grid you actually grant from.
//
// 🔴 IT SHIPPED READ-ONLY BESIDE A FREE-TEXT PERMISSION FIELD, WHICH FIXES HALF THE DEFECT IT WAS BUILT FOR. The design spec's argument for a matrix is two-part: you cannot see at a glance who can touch the calendar without reading every row, AND a mistyped token is invisible until it silently fails. A read-only grid answers the first and leaves the second exactly where it was — the tokens were still typed into a comma-separated box. Worse, `.mxcell` in the adopted stylesheet carries hover and focus-visible styles, so a `<span>` wearing that class grows under the cursor and does nothing: a second lying affordance, one day after the first was removed.
//
// 🔴 SO THE CELLS EDIT, AND THEY STAGE RATHER THAN FIRE. A click marks the cell pending — the matrix reads as the state you are about to save, not the one you are leaving — and the row's Save opens the same typed drawer every other destructive act in this realm goes through, with the target's own Discord ID as the word. No new server route: /api/access/grant already replaces the whole permission list, which is exactly what a recomputed set is.
//
// ⚠️ AN INHERITED CELL DOES NOT TOGGLE. Holding a bare `manage` covers every page at once, so there is no such thing as revoking one of them — the honest response to that click is to say so, not to quietly rewrite the token into eight explicit ones. Two things the grid does that the string cannot are INHERITANCE (visible rather than remembered) and, in the By-scope view below, SINGLE POINTS OF FAILURE. Data comes from GET /api/access/matrix, built over the same scope enumeration singlePointsOfFailure() uses — never a second list that could drift.
function ByAdmin({ matrix, spof, onGrant, onSave, onRevoke, onExplain, isOwnerId }) {
    const [pending, setPending] = useState({});     // { "discordId|scope": true|false }
    const scopes = matrix.scopes || [];
    const commands = scopes.filter((s) => s.kind === 'command');
    const pages = scopes.filter((s) => s.kind === 'page');
    const ordered = [...commands, ...pages];
    const spofScopes = new Set((spof || []).map((x) => x.scope));
    const accentOf = (sc) => (sc.realm ? `var(--r-${sc.realm})` : 'var(--ink3)');
    const holdersOf = (sc) => matrix.admins.filter((a) => (a.grants[sc.key] || {}).held).length;

    const rowPending = (id) => Object.fromEntries(Object.entries(pending)
        .filter(([k]) => k.startsWith(id + '|'))
        .map(([k, v]) => [k.slice(id.length + 1), v]));

    function toggle(admin, sc) {
        const g = admin.grants[sc.key] || {};
        if (g.inherited && !g.direct) return onExplain(sc);
        const key = admin.discordId + '|' + sc.key;
        setPending((prev) => {
            const next = { ...prev };
            const want = !(key in prev ? prev[key] : g.direct);
            if (want === Boolean(g.direct)) delete next[key];   // back to where it started is not a change
            else next[key] = want;
            return next;
        });
    }

    const clearRow = (id) => setPending((prev) => Object.fromEntries(
        Object.entries(prev).filter(([k]) => !k.startsWith(id + '|'))));

    return html`
        <div class="panel" id="by-admin">
            <div class="ph">
                <span class="t">By admin</span>
                <span class="rt">${matrix.admins.length} granted · owner is not editable</span>
            </div>
            ${matrix.admins.length === 0 ? html`<p class="empty">Nobody else has been granted access. You are the only admin.</p>` : html`
                <div class="mxwrap">
                    <table class="mx">
                        <thead>
                            <tr class="mxgrp">
                                <th class="mxwho"></th>
                                <th colspan=${commands.length}><span>Commands</span></th>
                                <th colspan=${pages.length}><span>/manage pages</span></th>
                                <th></th>
                            </tr>
                            <tr>
                                <th class="mxwho"><span class="mxs" style="text-align:left">Admin</span></th>
                                ${ordered.map((sc) => html`
                                    <th key=${sc.key}>
                                        <span class=${'mxs mxcol' + (spofScopes.has(sc.key) ? ' spof' : '')}
                                              style=${`--c:${accentOf(sc)}`}
                                              title=${`${sc.key} — ${holdersOf(sc)} ${holdersOf(sc) === 1 ? 'holder' : 'holders'}${sc.realm ? ' · portal realm: ' + sc.realm : ' · Discord only, no portal realm'}`}>
                                            <i></i>${sc.label}<em class="mxn2">${holdersOf(sc)}</em>
                                        </span>
                                    </th>`)}
                                <th><span class="mxs">Action</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${matrix.admins.map((a) => {
                                const owner = a.discordId === isOwnerId;
                                const rp = rowPending(a.discordId);
                                const changes = Object.keys(rp).length;
                                return html`
                                    <tr key=${a.discordId} class=${owner ? 'ownerrow' : ''}>
                                        <td class="mxwho"><span class="mxid">
                                            <span class="mxav" aria-hidden="true">${(a.note ? a.note[0] : a.discordId.slice(-1)).toUpperCase()}</span>
                                            <span class="mxn">
                                                <b>…${a.discordId.slice(-6)}</b>
                                                <span>${a.note || 'no label'}${a.grantedAt ? ' · granted ' + new Date(a.grantedAt).toISOString().slice(0, 10) : ''}</span>
                                            </span>
                                        </span></td>
                                        ${ordered.map((sc) => {
                                            const g = a.grants[sc.key] || {};
                                            const pend = rp[sc.key];
                                            const on = pend === undefined ? Boolean(g.direct || g.inherited) : pend;
                                            // 🔴 THE TICK IS DRAWN BY THE ARIA STATE, NOT BY A CLASS. app.css's checkmark is `.mxcell[aria-checked=true]::after`, so a cell wearing `.on` alone fills with the accent and draws nothing inside it — the state was legible only as colour, which §4.1 says is the one thing colour must not carry.
                                            const cls = 'mxcell'
                                                + (on ? ' on' : '')
                                                + (pend !== undefined ? (pend ? ' pend' : ' pend off') : (g.inherited && !g.direct ? ' inh inherited' : ''))
                                                + (owner ? ' locked' : '');
                                            const what = g.direct ? 'granted directly' : g.inherited ? 'inherited from manage' : 'not granted';
                                            const willBe = pend === true ? ' — pending: will be granted'
                                                : pend === false ? ' — pending: will be revoked' : '';
                                            if (owner) {
                                                return html`<td key=${sc.key}><span class=${cls} role="img" aria-checked="true" style=${`--c:${accentOf(sc)}`}
                                                    aria-label=${`${sc.label}: held by the owner, not editable`}
                                                    title="The owner short-circuits every check"></span></td>`;
                                            }
                                            return html`<td key=${sc.key}><button class=${cls} style=${`--c:${accentOf(sc)}`}
                                                role="checkbox" aria-checked=${on ? 'true' : 'false'}
                                                aria-label=${`${sc.label} for …${a.discordId.slice(-6)}: ${what}${willBe}`}
                                                title=${`${sc.label} — ${what}${willBe}`}
                                                onClick=${() => toggle(a, sc)}></button></td>`;
                                        })}
                                        <td class="mxact"><span class="mxacts">
                                            ${owner ? html`<span class="holder">locked</span>`
                                                : changes ? html`
                                                    <button class="chip go" onClick=${() => onSave(a, rp, () => clearRow(a.discordId))}>
                                                        Save ${changes} ${changes === 1 ? 'change' : 'changes'}</button>
                                                    <button class="chip" onClick=${() => clearRow(a.discordId)}>Discard</button>`
                                                : html`
                                                    <button class="rmv" title="Revoke entirely"
                                                            aria-label=${`Revoke …${a.discordId.slice(-6)} entirely`}
                                                            onClick=${() => onRevoke(a.discordId)}><${Icon} name="trash-2" cls="sm" /></button>`}
                                        </span></td>
                                    </tr>`;
                            })}
                        </tbody>
                    </table>
                </div>
                <div class="mxfoot">
                    <span><span class="mxlegend on"></span>granted <b>directly</b> — revoking it removes exactly this.</span>
                    <span><span class="mxlegend inh"></span><b>inherited</b> — holding <code>manage</code> covers every page at once, so these cells cannot be turned off one at a time.</span>
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
    // Both endpoints in ONE useAsync, because they are one page: two hooks would give the realm two independent phases and a screen that is half skeleton and half table, which reads as a rendering bug rather than as loading.
    const load = useAsync(() => Promise.all([fetchJson('/api/access'), fetchJson('/api/access/matrix')])
        .then(([d, m]) => (failureOf(d) ? d : failureOf(m) ? m : { ...d, matrix: m })), []);
    const [notice, setNotice] = useState('');
    const [view, setView] = useState('By admin');
    const overlay = useOverlay();

    const refresh = load.reload;

    // ⚠️ ENDING A SESSION IS NOT REVOKING ACCESS, AND THE CONFIRMATION HAS TO SAY SO. It signs a browser out; the admin still holds everything they held a second earlier and can sign straight back in. Somebody reaching for this because they want the permissions gone needs to be told, at the moment of deciding, that this is not that control.
    function confirmEndSessions(ids) {
        const chosen = data.sessions.filter((s) => ids.includes(s.sessionHash));
        overlay.confirm({
            op: 'session.end', tier: 2, danger: true, confirmLabel: ids.length === 1 ? 'End session' : `End ${ids.length} sessions`,
            title: ids.length === 1 ? 'End this portal session?' : `End ${ids.length} portal sessions?`,
            body: html`
                <p class="dw-p">This signs the browser out. It does <b>not</b> revoke anything — whoever it belongs to
                    keeps every permission they hold and can sign in again immediately. To take the access away, revoke
                    it in the grid above.</p>
                <ul class="dw-l">${chosen.slice(0, 6).map((s) => html`
                    <li key=${s.sessionHash}>${s.discordId} · last seen ${relTime(s.lastSeenAt)}</li>`)}
                    ${ids.length > 6 ? html`<li>…and ${ids.length - 6} more</li>` : null}</ul>`,
            onConfirm: () => ids.forEach(endSession),
        });
    }

    // Clicking an inherited cell is not an error and not a no-op with no explanation — it is the one place the difference between `manage` and a page token becomes visible, so the toast says what would actually have to happen.
    function explainInherited(sc) {
        overlay.say(`${sc.label} comes from a bare “manage” token — revoke that to take it away.`);
    }

    // 🔴 THE GRID STAGES; THIS IS WHERE IT WRITES, and it goes through the same typed gate as a full revoke because it is the same act at a smaller scale. `permsAfter` recomputes the whole list, which is exactly the shape /api/access/grant already takes.
    function confirmSave(admin, rowPending, clear) {
        const labelOf = (key) => (matrix.scopes || []).find((s) => s.key === key)?.label || key;
        const { granted, revoked } = describePending(rowPending, labelOf);
        overlay.confirm({
            op: 'admin.grant', tier: 3, danger: Boolean(revoked.length), confirmLabel: 'Save permissions',
            typed: admin.discordId,
            title: `Change what …${admin.discordId.slice(-6)} can do?`,
            body: html`
                ${granted.length ? html`<p class="dw-p"><b>Granting:</b> ${granted.join(', ')}.</p>` : null}
                ${revoked.length ? html`<p class="dw-p"><b>Revoking:</b> ${revoked.join(', ')}.</p>` : null}
                <p class="dw-p">Access does not stage. This is written the moment you confirm, and every request
                    they make re-checks server-side — so a revoke takes effect on their very next action, even with
                    a portal session already open.</p>`,
            onConfirm: async () => {
                await grant(admin.discordId, permsAfter(admin.permissions, rowPending), admin.discordId);
                clear();
                overlay.say('Permissions saved.');
            },
        });
    }

    // 🔴 THE TYPED WORD IS THE TARGET'S OWN ID, which is also exactly what portal/api/access.js's confirmMatchesTarget requires on the wire — so the gate the person passes and the gate the server enforces are the same gate rather than two that could drift. Never the word "revoke": you would type it without reading which row you were on.
    function confirmRevoke(discordId) {
        const admin = (matrix.admins || []).find((a) => a.discordId === discordId);
        const held = admin ? Object.values(admin.grants || {}).filter((g) => g.held).length : 0;
        overlay.confirm({
            op: 'admin.revoke', tier: 3, danger: true, confirmLabel: 'Revoke all access', typed: discordId,
            title: 'Revoke this admin entirely?',
            body: html`
                <p class="dw-p">Every one of <b>${held}</b> permission${held === 1 ? '' : 's'} held by${' '}
                    <b>${discordId}</b> is removed. They keep any portal session already open until you end it below,
                    but every action re-checks server-side, so nothing they hold now will work.</p>
                <p class="dw-p">This is not staged and there is no undo — granting it back is a new grant.</p>`,
            onConfirm: () => revoke(discordId, discordId),
        });
    }

    async function endSession(sessionHash) {
        const res = await fetchJson('/api/access/session/end', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
            body: JSON.stringify({ sessionHash }),
        });
        const refused = refusalOf(res);
        if (refused) return setNotice(`That session was not ended — ${refused}`);
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

    if (!load.data) return html`<${RealmShell} realm="access" session=${session} error=${load.error} slow=${load.slow}
                                               onRetry=${load.reload} skeleton=${{ rows: 5, lines: [28, 44, 16] }} />`;
    const data = load.data;
    const matrix = data.matrix || { admins: [], scopes: [] };

    // A session is "signed in now" if it was seen in the last 15 minutes -- the same rough threshold 06-access-and-analytics.html's own "2 signed in now" stat line implies. Not a stored flag: a browser session has no logout event unless someone clicks it, so recency is the only honest signal there is.
    const activeSessions = data.sessions.filter((s) => Date.now() - new Date(s.lastSeenAt).getTime() < 15 * 60000).length;

    return html`
        <${Shell} realm="access" session=${session} view=${view} viewOptions=${['By admin', 'By scope']} onSetView=${setView}
                  overlaySlot=${overlay.render()}
                  masthead=${html`<${Masthead} title="Access" sub="Who can do what — and where you are the only one who can do it."
                                               stats=${[
                                                   { value: data.admins.length, label: 'granted', lead: true, accent: 'var(--r-access)' },
                                                   { value: activeSessions, label: 'signed in now', tone: activeSessions ? 'hot' : undefined },
                                                   { value: (data.singlePointsOfFailure || []).length, label: 'single points', tone: (data.singlePointsOfFailure || []).length ? 'bad' : undefined },
                                               ]} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      ${view === 'By admin'
                          ? html`<${ByAdmin} matrix=${matrix} spof=${data.singlePointsOfFailure}
                                             onGrant=${grant} onRevoke=${confirmRevoke} onSave=${confirmSave}
                                             onExplain=${explainInherited} isOwnerId=${session.discordId} />`
                          : html`<${ByScope} matrix=${matrix} spof=${data.singlePointsOfFailure} ownerId=${session.discordId} />`}
                  `}
                  manifestSlot=${html`<${Manifest} rows=${data.sessions.map(s => ({ ...s, id: s.sessionHash, state: 'live' }))} columns=${SESSION_COLUMNS}
                                                    title="Live portal sessions"
                                                    headerRight="Revoking an admin in Discord does not end their browser session — this does."
                                                    emptyText="Nobody is signed in to the portal."
                                                    searchableFields=${['discordId']}
                                                    bulkNote="Immediate — Access does not stage, and there is no undo"
                                                    bulkTier=${3} rowNoun=${['session', 'sessions']}
                                                    onRemove=${(row) => confirmEndSessions([row.id])} removeLabel="End session"
                                                    bulkActions=${[{ label: 'End session', danger: true, onClick: confirmEndSessions }]} />`} />
    `;
}
