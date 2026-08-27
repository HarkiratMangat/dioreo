// portal/ui/access.js — ESM. The Access realm: By admin + By scope, owner-only (spec §8.2 — no grantable scope, exactly like /bot access). Reuses <Manifest> for the live-session list, which carries an End session control the bot itself cannot offer (revoking in Discord does not kill a browser session).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead, MastheadNew } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { useAsync, RealmShell } from './async.js';
import { useOverlay } from './overlay.js';
import { Icon } from './icons.js';

// ⚠️ SESSION_COLUMNS IS GONE WITH THE MANIFEST IT FED. Sessions are a view now — see the Sessions component for why the shared table was the wrong home and how it produced a hardcoded `state: 'live'` on every row.

// "8m ago" rather than a full locale timestamp: the question this column answers is "is this person in here right now", and a wall-clock time makes the reader do the subtraction (06's own column reads "now" / "8m ago" / "3d ago" for the same reason).
function relTime(value) {
    if (!value) return '—';
    const secs = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
    if (secs < 90) return 'now';
    if (secs < 5400) return `${Math.round(secs / 60)}m ago`;
    if (secs < 172800) return `${Math.round(secs / 3600)}h ago`;
    return `${Math.round(secs / 86400)}d ago`;
}

// "By admin is the grid you grant from" (spec §8.2) — a review pass found the API's grant/revoke routes had no caller anywhere: this form is what was missing. Grant/revoke both require the admin to type the exact target Discord ID as the tier-3 confirmation (portal/api/access.js's confirmMatchesTarget) — there is no separate export step for a permission change. 🔴 IT ASKED SOMEBODY TO TYPE A VOCABULARY FROM MEMORY, into a comma-separated box, to hand out permissions. Eleven scope tokens exist, `manage` silently covers eight of them, and a typo produced a grant that looked accepted and covered nothing — the grid beside it renders every one of those tokens as a labelled cell, so the vocabulary was on screen and unusable in the one control that needed it. The chips come from the SAME `matrix.scopes` the grid is built from, which is the enumeration `singlePointsOfFailure` walks, so there is no second list to drift.
//
// ⚠️ THE OWNER-ONLY LOCK IS SHOWN, NOT ENFORCED HERE. `destructive` is excluded from `all` and grantable only by the owner — the server decides that, and a chip that hid it would leave an owner unable to grant the one permission only they can grant. The mark says why it is different.
function GrantForm({ onGrant, scopes }) {
    const [discordId, setDiscordId] = useState('');
    const [picked, setPicked] = useState([]);
    const [confirmText, setConfirmText] = useState('');
    const ready = discordId && confirmText === discordId;
    const toggle = (key) => setPicked(picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key]);
    return html`
        <!-- 🔴 A PLACEHOLDER IS NOT A LABEL, and these two inputs look identical the moment either has
             text in it — one takes the account to grant, the other takes the SAME id typed back as the
             tier-3 confirmation. A screen-reader label existed; a visible one did not, so the only thing
             distinguishing them on screen was a hint that disappears when you start typing. The dwfield class
             is the sheet's own labelled field, used by every other form in the portal. -->
        <div class="addrow">
            <label class="dwfield" for="grant-discordid"><span>Discord ID to grant</span>
                <input id="grant-discordid" placeholder="19 digits" value=${discordId} onInput=${(e) => setDiscordId(e.target.value)} /></label>
            <label class="dwfield" for="grant-confirm"><span>Type it again to confirm <i>the same id, not the word "grant"</i></span>
                <input id="grant-confirm" placeholder="the same 19 digits" value=${confirmText} onInput=${(e) => setConfirmText(e.target.value)} /></label>
            <button class="accent-fill" disabled=${!ready} onClick=${() => onGrant(discordId, picked, confirmText)}>
                ${picked.length ? `Grant ${picked.length}` : 'Grant nothing yet'}</button>
            <div class="tokgrid">
                ${(scopes || []).map((sc) => html`
                    <button key=${sc.key} class=${'chip topic' + (picked.includes(sc.key) ? ' on' : '')}
                            style=${sc.hex ? `--c:${sc.hex}` : null} aria-pressed=${picked.includes(sc.key) ? 'true' : 'false'}
                            title=${sc.key} onClick=${() => toggle(sc.key)}>
                        <i></i>${sc.label || sc.key}${sc.ownerOnly ? html`<b class="ownly-k" aria-label="owner-grantable only">🔒</b>` : null}
                    </button>`)}
            </div>
            <span class="hint">A new admin starts with nothing granted — there is no default. Type the Discord ID twice: once to
                name them, once to confirm. <b>manage</b> covers every page at once, which is why the grid marks those cells inherited.</span>
        </div>
    `;
}

// ── LIVE SESSIONS ─────────────────────────────────────────────────────────────────────────────
//
// 🔴 EVERY SESSION READ "LIVE", INCLUDING ONE LAST SEEN YESTERDAY. The row's state was the literal string `'live'` for every session in the table — and a browser session has no logout event unless somebody clicks one, so "signed in now" is DERIVED or it is a guess. Fifteen minutes is the mockup's own window and it is the honest one: a tab left open pings; a closed one stops.
//
// ⚠️ THIS REPLACES THE MANIFEST ON THIS REALM RATHER THAN JOINING IT. The Access mockup has no manifest at all — sessions are a view — and the portal had put them in the shared table, which is how the hardcoded state got there in the first place. Two lists of one thing is the defect this branch has spent its life removing. sessionIsLive/sessionSummary come from access.logic.js, loaded as a classic script — see that file for why fifteen minutes, and for the hardcoded `state: 'live'` this replaces.
function Sessions({ sessions, onEnd }) {
    const now = Date.now();
    return html`
        <div class="panel" id="sessions">
            <div class="ph">
                <span class="t">Live portal sessions</span>
                <span class="rt">${sessionSummary(sessions, now)}</span>
            </div>
            ${sessions.length ? html`
                <div class="sesslist">
                    ${sessions.map((s) => html`
                        <div key=${s.sessionHash} class=${'sess' + (sessionIsLive(s, now) ? '' : ' stale')}>
                            <span class="sdot" aria-hidden="true"></span>
                            <span class="sessb">
                                <b>…${String(s.discordId).slice(-6)}</b>
                                <span>${s.userAgent || 'device not recorded'} · ${relTime(s.lastSeenAt)}</span>
                            </span>
                            <button class="chip danger" onClick=${() => onEnd([s.sessionHash])}>End session</button>
                        </div>`)}
                </div>`
            : html`
                <div class="estate">
                    <span class="eicon" aria-hidden="true">◎</span>
                    <h4>Nobody is signed in to the portal.</h4>
                    <p>Revoking an admin in Discord does not end a browser session that is already open — this is where that happens.</p>
                </div>`}
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
            <${GrantForm} onGrant=${onGrant} scopes=${matrix.scopes} />
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
            <!-- ⚠️ THE MARK WAS DRAWN AND NEVER EXPLAINED. The spof class underlines a column in the grid above and
                 flags a row here, and nothing said what the underline meant — a mark whose legend is missing
                 is a mark the reader learns to ignore. It appears only when there IS one, because a legend
                 for an absent mark is noise. -->
            ${spofScopes.size ? html`
                <span class="klg spofk"><i></i>underlined — held by <b>one person</b> besides you</span>` : null}
            <!-- ⚠️ THE VOCABULARY IS ELEVEN TOKENS AND FOUR OF THEM ARE COMMANDS. Nothing on this screen
                 said that the manage token silently covers eight of the others — which is the single fact that makes
                 a hand-typed grant dangerous, and the reason the chips above exist. -->
            <p class="racknote">${(matrix.scopes || []).length} permissions in all. A command token grants the
                whole command; <code>manage</code> covers every page under it, so granting it is not one
                permission but eight. A scope with no realm is Discord-only and does nothing in this portal.</p>
            <div class="scopes">
                ${(matrix.scopes || []).map((sc) => {
                    const holders = matrix.admins.filter((a) => (a.grants[sc.key] || {}).held).map((a) => a.discordId);
                    const alone = spofScopes.has(sc.key);
                    return html`
                        <div class=${'scope' + (alone ? ' spof' : '')}>
                            <span class="nm">${sc.key}</span>
                            <!-- 🔴 ELEVEN SCOPE TOKENS AND NO WAY TO TELL WHICH ONES REACH THE PORTAL. The realm was already known — the grid above puts it in a title attribute, which is a hover on a row you are reading with your eyes — and the difference matters: a Discord-only scope granted to somebody who only ever uses the portal does nothing at all. -->
                            <span class="rl">${sc.realm ? `portal realm: ${sc.realm}` : 'Discord only'}</span>
                            <span class="hs">
                                ${ownerId ? html`<span class="holder owner">owner</span>` : null}
                                ${holders.map((h) => html`<span class="holder" key=${h}>${h.slice(-6)}</span>`)}
                            </span>
                            <!-- ⚠️ "nobody but you" IS QUIET, and "single point" IS NOT. Sole ownership by the owner is the resting state of a solo-maintained bot; one OTHER person holding it alone is the thing that goes wrong when they leave. Painting both in warning colour would make the common case shout and teach the reader to skip the mark. -->
                            ${alone ? html`<span class="flag">⚠ single point</span>`
                                : !holders.length ? html`<span class="flag quiet">nobody but you</span>` : null}
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
                <!-- 🔴 GRANTING AND REVOKING READ IDENTICALLY AS TWO BOLD PARAGRAPHS, and they are opposite acts. The drawer's eyebrow already carries the op id in prose; this states it as the identifier the server will see, and splits the two directions into groups whose colour is their direction. -->
                <div class="idop"><b>admin.grant</b> — replaces the whole permission list for this account</div>
                ${granted.length ? html`
                    <div class="acg"><b class="acg-k on">Granting ${granted.length}</b>
                        <ul class="dw-l">${granted.map((g) => html`<li key=${g}>${g}</li>`)}</ul></div>` : null}
                ${revoked.length ? html`
                    <div class="acg"><b class="acg-k off">Revoking ${revoked.length}</b>
                        <ul class="dw-l">${revoked.map((g) => html`<li key=${g}>${g}</li>`)}</ul></div>` : null}
                ${revoked.length ? html`
                    <div class="callout dangerous"><b>A revoke takes effect on their very next action.</b> It is not
                        staged and there is no undo button — restoring it means granting it again.</div>` : null}
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

    // ⚠️ THE FORM IS AT THE FOOT OF A GRID, so the masthead button has to travel rather than toggle: there is no second copy to reveal, and building one would be two grant forms that can disagree. The focus lands on the field, not merely the scroll position — a page that moves and leaves the caret behind has not actually taken you there.
    const scrollToGrant = () => requestAnimationFrame(() => {
        const el = document.querySelector('.grantform input, #grant-id');
        if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.focus({ preventScroll: true }); }
    });

    // A session is "signed in now" if it was seen in the last 15 minutes -- the same rough threshold 06-access-and-analytics.html's own "2 signed in now" stat line implies. Not a stored flag: a browser session has no logout event unless someone clicks it, so recency is the only honest signal there is.
    const activeSessions = data.sessions.filter((s) => Date.now() - new Date(s.lastSeenAt).getTime() < 15 * 60000).length;

    return html`
        <${Shell} realm="access" session=${session} view=${view} viewOptions=${['By admin', 'By scope', 'Sessions']} onSetView=${setView}
                  overlaySlot=${overlay.render()}
                  masthead=${html`<${Masthead} title="Access" sub="Who can do what — and where you are the only one who can do it."
                                               stats=${[
                                                   { value: data.admins.length, label: 'granted', lead: true, accent: 'var(--r-access)' },
                                                   { value: activeSessions, label: 'signed in now', tone: activeSessions ? 'hot' : undefined },
                                                   { value: (data.singlePointsOfFailure || []).length, label: 'single points', tone: (data.singlePointsOfFailure || []).length ? 'bad' : undefined },
                                               ]}
                                               actions=${html`<${MastheadNew} label="Grant access" hint="g"
                                                                              tip="Jump to the grant form"
                                                                              onClick=${() => { setView('By admin'); scrollToGrant(); }} />`} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      ${view === 'By admin'
                          ? html`<${ByAdmin} matrix=${matrix} spof=${data.singlePointsOfFailure}
                                             onGrant=${grant} onRevoke=${confirmRevoke} onSave=${confirmSave}
                                             onExplain=${explainInherited} isOwnerId=${session.discordId} />`
                          : view === 'Sessions'
                              ? html`<${Sessions} sessions=${data.sessions || []} onEnd=${confirmEndSessions} />`
                              : html`<${ByScope} matrix=${matrix} spof=${data.singlePointsOfFailure} ownerId=${session.discordId} />`}
                  `} />
    `;
}
