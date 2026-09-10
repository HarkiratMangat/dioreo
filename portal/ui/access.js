// portal/ui/access.js — ESM. The Access realm: By admin + By scope, owner-only (spec §8.2 — no grantable scope, exactly like /bot access). Reuses <Manifest> for the live-session list, which carries an End session control the bot itself cannot offer (revoking in Discord does not kill a browser session).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, Masthead, MastheadNew } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { useAsync, RealmShell } from './async.js';
import { Drawer, useOverlay } from './overlay.js';
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

// D1/pin32 — the always-visible `.addrow` (the block this replaces) rendered at the FOOT of the whole grid and did nothing when clicked from the masthead's "+ Grant access" button beyond scrolling to it ("the portal literally does nothing"). It is now a drawer, opened from the masthead, matching Broadcast's PostForm (portal/ui/broadcast.js:248) — a real modal with its own typed-confirmation gate, rather than a form permanently sitting under the table.
//
// 🔴 pin32: A DISCORD ID TYPED INTO A BOX WAS NEVER CHECKED AGAINST DISCORD ITSELF. Nothing stopped an admin from granting a typo'd id, or an id for an account that does not exist — the grant would silently succeed and sit in the grid as an unreachable row. GET /api/discord/user (portal/api/access.js) resolves the id against the bot's own Discord API access before Grant is allowed to enable, and the preview card (avatar/username/globalName/id) is the thing that lets a human actually confirm "yes, that's them" rather than trusting a string of digits.
//
// Debounced 400ms so every keystroke does not fire a Discord API call, and only once the id LOOKS like a snowflake (17–20 digits) — an in-progress id is not a failed lookup, it is simply not a ready one yet, and treating it as an error would flash a warning on every keystroke.
const shortDate = (v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

// 🔴 ONE SOURCE FOR A SCOPE'S COLOUR, AND THE DRAWER HAD BEEN READING A SECOND ONE THAT DOES NOT EXIST. The grid has always coloured a cell with this; the permission chips read sc.hex instead, which buildPermissionMatrix has never emitted -- it builds {key, label, kind, ownerOnly, realm}. So --c was unset on every chip, .chip.topic i painted background:var(--c) with nothing in it, and a picked chip's color-mix(in srgb,var(--c) 16%,transparent) was invalid and dropped entirely: twelve identical black pills where the design shows the realm's colour. ⚠️ THE HARNESS FIXTURE DOES SET hex (assets/fixtures.js:1100), which is the whole reason no instrument caught it -- the same shape as the ownerOnly mark recorded in portal/api/access.js, where the legend named a mark only the fixture could draw. Hoisted above its first reader because the TDZ ratchet is right that source order should not be what holds a render up.
const accentOf = (sc) => (sc.realm ? `var(--r-${sc.realm})` : 'var(--ink3)');

function useDiscordLookup(discordId) {
    const [state, setState] = useState({ status: 'idle' });
    useEffect(() => {
        if (!/^\d{17,20}$/.test(discordId)) { setState({ status: 'idle' }); return undefined; }
        setState({ status: 'loading' });
        let cancelled = false;
        const t = setTimeout(async () => {
            const res = await fetchJson(`/api/discord/user?id=${discordId}`);
            if (cancelled) return;
            if (res && res.id) setState({ status: 'ok', user: res });
            else setState({ status: 'error', reason: (res && res.reason) || 'That id did not resolve to a Discord account.' });
        }, 400);
        return () => { cancelled = true; clearTimeout(t); };
    }, [discordId]);
    return state;
}

// "By admin is the grid you grant from" (spec §8.2) — a review pass found the API's grant/revoke routes had no caller anywhere: this form is what was missing. Grant/revoke both require the admin to type the exact target Discord ID as the tier-3 confirmation (portal/api/access.js's confirmMatchesTarget) — there is no separate export step for a permission change. 🔴 IT ASKED SOMEBODY TO TYPE A VOCABULARY FROM MEMORY, into a comma-separated box, to hand out permissions. Eleven scope tokens exist, `manage` silently covers eight of them, and a typo produced a grant that looked accepted and covered nothing — the grid beside it renders every one of those tokens as a labelled cell, so the vocabulary was on screen and unusable in the one control that needed it. The chips come from the SAME `matrix.scopes` the grid is built from, which is the enumeration `singlePointsOfFailure` walks, so there is no second list to drift.
//
// ⚠️ THE OWNER-ONLY LOCK IS SHOWN, NOT ENFORCED HERE. `destructive` is excluded from `all` and grantable only by the owner — the server decides that, and a chip that hid it would leave an owner unable to grant the one permission only they can grant. The mark says why it is different.
//
// ⚠️ grantReady (access.logic.js) is the single source for when the Grant button may fire and what the `.why` line says when it may not — kept pure and unit-tested (scripts/portalSession.test.js) precisely so this readiness rule can be checked without a DOM. 🔴 ONE FORM, TWO MODES, BECAUSE THE SECOND ONE IS THE FIRST ONE WITH ITS ID ALREADY DECIDED. Passing an `admin` turns this into the design's Edit drawer: the id is fixed and read-only, the chips arrive pre-filled from what that account already holds, and the label is the value being edited rather than a blank. ⚠️ THE LOOKUP IS SKIPPED IN EDIT MODE, DELIBERATELY. `useDiscordLookup` exists to catch a typo'd or nonexistent id before a grant creates an unreachable row; an id already in the grid was resolved when it was granted and cannot be retyped here, so a second round-trip would buy nothing and would leave the Save button disabled for 400ms every time the drawer opens. `grantReady` is handed `'ok'` for exactly that reason and for no other. ⚠️ AND THE TYPED CONFIRMATION STAYS. An edit replaces the whole permission list — it can revoke as easily as grant — so it is the same act at the same tier as the grant it reuses, and dropping the gate because the row already exists would be reading "edit" as "smaller".
function GrantForm({ admin, onGrant, scopes, onCancel }) {
    const editing = Boolean(admin);
    const scopeKeys = new Set((scopes || []).map((sc) => sc.key));
    const [discordId, setDiscordId] = useState(editing ? admin.discordId : '');
    const [picked, setPicked] = useState(editing ? (admin.permissions || []).filter((k) => scopeKeys.has(k)) : []);
    const [note, setNote] = useState(editing ? (admin.note || '') : '');
    const [confirmText, setConfirmText] = useState('');
    const lookup = useDiscordLookup(discordId);
    const toggle = (key) => setPicked(picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key]);
    // 🔴 THE LOOKUP RUNS IN BOTH MODES BUT ONLY GATES ONE, and the first version of this got it backwards twice over. It faked `{status:'ok'}` in edit mode to skip the round-trip — which crashed the drawer outright, because the preview below reads `lookup.user.avatarUrl` and a faked status carries no user. It was also wrong on the merits: the avatar and username are exactly what tell you WHICH HUMAN this row of digits is, which is the whole argument that put the lookup on the grant form. So it runs. What it must NOT do is gate readiness: an id already in the grid was resolved when it was granted, and making a label edit wait on Discord being reachable would mean an outage there locks the owner out of renaming a row here.
    const { ready, why } = grantReady({ discordId, lookupStatus: editing ? 'ok' : lookup.status, pickedCount: picked.length, confirmText });

    return html`
        <${Drawer} eyebrow=${editing ? 'admin.grant · tier 3 · replaces the whole list' : 'admin.grant · tier 3'}
                   title=${editing ? `Edit …${admin.discordId.slice(-6)}` : 'Grant portal access'} onClose=${onCancel}
                   actions=${html`
                       <button class="btn" onClick=${onCancel}>Cancel</button>
                       <button class="btn go" disabled=${!ready} onClick=${() => onGrant(discordId, picked, confirmText, note)}>${editing ? 'Save changes' : 'Grant now'}</button>`}>
            <div class="dwbody">
                <!-- 🔴 A PLACEHOLDER IS NOT A LABEL, and these two inputs look identical the moment either has
                     text in it — one takes the account to grant, the other takes the SAME id typed back as the
                     tier-3 confirmation. A screen-reader label existed; a visible one did not, so the only thing
                     distinguishing them on screen was a hint that disappears when you start typing. The dwfield class
                     is the sheet's own labelled field, used by every other form in the portal. -->
                <div class="dwfield"><label for="grant-discordid">Discord ID</label>
                    <input id="grant-discordid" placeholder="17–20 digits" inputmode="numeric" autocomplete="off"
                           readOnly=${editing} aria-readonly=${editing ? 'true' : 'false'}
                           value=${discordId} onInput=${(e) => setDiscordId(e.target.value.trim())} /></div>
                ${editing ? html`<p class="dw-p">Granted by <code>…${(admin.grantedBy || '').slice(-6)}</code>${' '}
                    ${admin.grantedAt ? html`on <b>${shortDate(admin.grantedAt)}</b>` : null}. Only the owner may grant,
                    revoke or edit permissions, so this is always you.</p>` : null}
                ${lookup.status === 'loading' ? html`<p class="dw-p">Looking that id up…</p>` : null}
                ${lookup.status === 'error' ? html`<p class="dw-p" style="color:var(--warn)">${lookup.reason}</p>` : null}
                ${lookup.status === 'ok' && lookup.user ? html`
                    <div class="grantpreview">
                        <span class="gp-av" aria-hidden="true" style=${`--av-src:url(${lookup.user.avatarUrl})`}></span>
                        <span class="gp-n"><b>${lookup.user.globalName || lookup.user.username}</b>
                            <span>@${lookup.user.username} · …${discordId.slice(-6)}</span></span>
                    </div>` : null}
                <div class="tokgrid">
                    ${(scopes || []).map((sc) => html`
                        <button key=${sc.key} class=${'chip topic' + (picked.includes(sc.key) ? ' on' : '')}
                                style=${`--c:${accentOf(sc)}`} aria-pressed=${picked.includes(sc.key) ? 'true' : 'false'}
                                title=${sc.key} onClick=${() => toggle(sc.key)}>
                            <i></i>${sc.label || sc.key}${sc.ownerOnly ? html`<b class="ownly-k"><${Icon} name="lock" cls="sm" label="owner-grantable only" /></b>` : null}
                        </button>`)}
                </div>
                <div class="dwfield" style="margin-top:14px"><label for="grant-note">Label (optional)</label>
                    <input id="grant-note" placeholder="How you will recognise them" value=${note} onInput=${(e) => setNote(e.target.value)} /></div>
                <div class="dwfield"><label for="grant-confirm">Type the Discord ID again to confirm</label>
                    <input id="grant-confirm" placeholder=${discordId || 'the same digits'} autocomplete="off"
                           value=${confirmText} onInput=${(e) => setConfirmText(e.target.value)} /></div>
                <p class="dw-p"><b>This commits immediately.</b> A permission change is not staged and has no review
                    screen — typing the id is the entire gate, because there is no data to export and nothing
                    meaningful to preview. The allowlist cache is invalidated on write, so it is live in the bot on
                    their very next click.</p>
                ${editing ? html`<p class="dw-p">Whatever is picked above becomes the whole list. Anything you
                    untick is revoked on their very next action.</p>` : null}
                ${why ? html`<p class="why" role="status">${why}</p>` : null}
            </div>
        <//>
    `;
}

// ── LIVE SESSIONS ─────────────────────────────────────────────────────────────────────────────
//
// 🔴 EVERY SESSION READ "LIVE", INCLUDING ONE LAST SEEN YESTERDAY. The row's state was the literal string `'live'` for every session in the table — and a browser session has no logout event unless somebody clicks one, so "signed in now" is DERIVED or it is a guess. Fifteen minutes is the mockup's own window and it is the honest one: a tab left open pings; a closed one stops.
//
// ⚠️ THIS REPLACES THE MANIFEST ON THIS REALM RATHER THAN JOINING IT. The Access mockup has no manifest at all — sessions are a view — and the portal had put them in the shared table, which is how the hardcoded state got there in the first place. Two lists of one thing is the defect this branch has spent its life removing. sessionIsLive/sessionSummary come from access.logic.js, loaded as a classic script — see that file for why fifteen minutes, and for the hardcoded `state: 'live'` this replaces. The design's own `fmt` is `toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})`. UTC is not a detail: a grant written at 20:00 EDT is the next day in local time, so a date rendered in the reader's zone can name a day the record does not. A scope reads in the colour of the realm it reaches, on BOTH views — the design sets --c on every scope row and every grid column. It lived inside ByAdmin, so the By-permission list drew its dots grey.


function Sessions({ sessions, onEnd, ttlHours }) {
    const now = Date.now();
    return html`
        <!-- ⚠️ A section WITH A LANDMARK NAME, and an id the stylesheet can reach. access.html declares
             aria-label="Live portal sessions" and an inline margin-top:16px; the portal had a bare div, and the rule
             that would have spaced it is #manifest{margin-top:16px} rather than a .panel+.panel one, so moving this
             into footSlot silently closed the gap. The visible title correctly became "Signed in right now", which
             is why the landmark keeps the longer phrase: it is the only place the surface names itself. -->
        <section class="panel" id="sessions" aria-label="Live portal sessions">
            <div class="ph">
                <span class="t">Signed in right now</span>
                <span class="rt">${sessionSummary(sessions, now)}</span>
                <span class="sp">Revoking an admin in Discord does not end their browser session. This does.</span>
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
                </div>
                <!-- The two sentences access.html closes this list with, and the second is the only place the portal
                     says that ending a session does NOT stage. On a realm where every other write waits for Review,
                     a reader who has learned the tray will assume this one does too. -->
                <div class="mxfoot">
                    <span>Sessions expire after <b>${ttlHours} hours</b> on their own — nothing has to be cleaned up.</span>
                    <span>Ending one is immediate and unstaged — a security action that waits in a tray is not one.</span>
                </div>`
            : html`
                <div class="estate">
                    <span class="eicon" aria-hidden="true">◍</span>
                    <h4>Nobody is signed in to the portal</h4>
                    <p>Your own session should always be in this list, so an empty list means it failed to load rather than that nobody is here. Reload the page.</p>
                    <p>A session is a <b>browser</b>, not a Discord account. Revoking someone in Discord leaves their tab working until it expires ${ttlHours} hours after sign-in — ending it here is the only thing that closes that window.</p>
                </div>`}
        </section>
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
// ⚠️ AN INHERITED CELL DOES NOT TOGGLE. Holding a bare `manage` covers every page at once, so there is no such thing as revoking one of them — the honest response to that click is to say so, not to quietly rewrite the token into eight explicit ones. Two things the grid does that the string cannot are INHERITANCE (visible rather than remembered) and, in the By-scope view below, SINGLE POINTS OF FAILURE. Data comes from GET /api/access/matrix, built over the same scope enumeration singlePointsOfFailure() uses — never a second list that could drift. 🔴 THE LABEL STAGES EXACTLY LIKE A PERMISSION CELL, and that is the whole reason it is here rather than only in the drawer. `note` is the only thing telling `…000001` from `…000003` on a screen of snowflakes, so fixing a typo in it should not cost the same ceremony as handing out a permission — but it commits through the SAME row Save and the SAME typed gate, because it rides on the same request that replaces the permission list. Two entry points, one commit: the row for a quick correction, the Edit drawer for everything at once.
function ByAdmin({ matrix, spof, onSave, onRevoke, onEdit, onExplain, isOwnerId, highlightId }) {
    const [pending, setPending] = useState({});     // { "discordId|scope": true|false }
    const [pendingNote, setPendingNote] = useState({});   // { discordId: "the label being typed" }
    const [editingNote, setEditingNote] = useState(null); // the one row whose label input is open
    const scopes = matrix.scopes || [];
    const commands = scopes.filter((s) => s.kind === 'command');
    const pages = scopes.filter((s) => s.kind === 'page');
    const ordered = [...commands, ...pages];
    const spofScopes = new Set((spof || []).map((x) => x.scope));
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

    const dropNote = (id) => setPendingNote((prev) => Object.fromEntries(
        Object.entries(prev).filter(([k]) => k !== id)));
    // ⚠️ DISCARD HAS TO DROP BOTH, or a discarded row keeps a staged label that its own Save button no longer counts — a pending change with nothing on screen offering to commit it.
    const clearRow = (id) => {
        setPending((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(id + '|'))));
        dropNote(id);
        setEditingNote((cur) => (cur === id ? null : cur));
    };
    // The label as it stands right now: what is being typed if anything is, otherwise what is stored.
    const noteNow = (a) => (pendingNote[a.discordId] !== undefined ? pendingNote[a.discordId] : (a.note || ''));
    const noteDirty = (a) => pendingNote[a.discordId] !== undefined && pendingNote[a.discordId] !== (a.note || '');

    return html`
        <!-- ⚠️ NO PANEL AND NO HEADER OF ITS OWN. access.html draws ONE .ph — the Shell's view bar — carrying
             the title, the tabs, the key and a right-aligned meta line; a second header inside the view repeated
             the view name the tabs already say, and nested a .panel inside the Shell's .panel, which breaks the
             .panel + .panel{background:transparent} chain Armory already paid for. The meta line moved to the
             Shell's meta prop and the key to realmKey; both slots already existed and this realm used neither.
             ⚠️ NO BACKTICKS IN THIS COMMENT ON PURPOSE — it sits inside a template literal, where even a MATCHED
             pair closes and reopens the literal and the text between them is parsed as JavaScript. -->
        <div id="by-admin">
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
                                    ${/* 🔴 THE HEADER'S SUBJECT IS DEPTH, AND IT USED TO BE A 7px COLOUR BAR. Two marks were
                                          tried on that bar and both were rejected — a 3/4/7px underline, then a ring — and the third
                                          mark was never the answer. Two findings settled it. (1) The bar was a THIRD copy: the realm
                                          hue is already painted into every granted cell in the column below it, up to four times, and
                                          the By-permission tab one click away states the realm in words ("reaches armory"). (2) The
                                          count under the name was already carrying the whole risk story — 0 nobody but you, 1 a single
                                          point, 2+ covered — at the smallest size in the header, in the quietest ink, while the
                                          masthead calls SINGLE POINTS out in red. The most important fact on a page whose own
                                          subtitle is "where you are the only one who can do it" was the least visible thing on it.
                                          So the bar goes and the number becomes the header. Realm survives in the cells and in words
                                          next door; nothing is lost, one illegible carrier is. */ null}
                                    <th key=${sc.key} class="sc">
                                        <button type="button" class=${'mxs mxcol' + (spofScopes.has(sc.key) ? ' spof' : '') + (sc.ownerOnly ? ' ownly' : '')}
                                              style=${`--c:${accentOf(sc)}`}
                                              onClick=${() => setView('By permission')}
                                              title=${holdersOf(sc) === 0
                                                  ? `${sc.label} — nobody but you holds this${sc.realm ? ' · reaches ' + sc.realm : ' · Discord only'}. Open By permission for the detail.`
                                                  : holdersOf(sc) === 1
                                                  ? `${sc.label} — a single point of failure: exactly one person besides you holds it${sc.realm ? ' · reaches ' + sc.realm : ' · Discord only'}. Open By permission for the detail.`
                                                  : `${sc.label} — ${holdersOf(sc)} people besides you hold it${sc.realm ? ' · reaches ' + sc.realm : ' · Discord only'}. Open By permission for the detail.`}>
                                            <span class="mxcn" lang="en">${sc.label}${sc.ownerOnly ? html`<b class="ownly-k"><${Icon} name="lock" cls="sm" label="owner-grantable only" /></b>` : null}</span><em class=${'mxdepth' + (holdersOf(sc) === 0 ? ' none' : holdersOf(sc) === 1 ? ' one' : '')}>${holdersOf(sc)}</em>
                                        </button>
                                    </th>`)}
                                <th><span class="mxs">Action</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- 🔴 THE OWNER ROW NEVER RENDERED ONCE, AND THE HEADER PROMISED IT. The row markup below
                                 carried an owner ? locked branch keyed on a discordId match against the matrix, but the
                                 owner is NOT an AdminUser document — buildPermissionMatrix reads that collection, so the
                                 owner is never in it and the branch was unreachable. The grid therefore said "owner is not
                                 editable" about a row it did not draw, and every .locked and .ownerrow rule in both
                                 stylesheets sat with no emitter. access.html draws the owner as a STATIC first row for the
                                 same reason: the owner is built in, not granted. -->
                            <!-- ⚠️ NO BACKTICKS ABOVE ON PURPOSE — this comment is inside a template literal, where
                                 even a MATCHED pair closes and reopens the literal and the text between is parsed
                                 as JavaScript. It is the trap portal-editing.md names first, and it has now cost
                                 two turns in one session. -->
                            <tr class="ownerrow">
                                <td class="mxwho"><span class="mxid">
                                    <span class="mxav" aria-hidden="true"><${Icon} name="user" cls="sm" /></span>
                                    <span class="mxn"><b>Owner</b><span>…${String(isOwnerId || '').slice(-6)} · built in</span></span>
                                </span></td>
                                ${ordered.map((sc) => html`
                                    <td key=${sc.key}><span class="mxcell on locked" style=${`--c:${accentOf(sc)}`}
                                        role="img" aria-label=${`${sc.label}: held by the owner, not editable`}
                                        title="The owner short-circuits every check"></span></td>`)}
                                <td class="mxact"><span class="mxacts"><span class="holder">locked</span></span></td>
                            </tr>
                            ${matrix.admins.filter((a) => a.discordId !== isOwnerId).map((a) => {
                                const owner = false;
                                const rp = rowPending(a.discordId);
                                const nv = noteNow(a);
                                const ndirty = noteDirty(a);
                                const changes = Object.keys(rp).length + (ndirty ? 1 : 0);
                                return html`
                                    <tr key=${a.discordId} class=${(owner ? 'ownerrow' : '') + (a.discordId === highlightId ? ' just-granted' : '')}>
                                        <td class="mxwho"><span class="mxid">
                                            <!-- The initial follows the LABEL BEING TYPED, not the stored one: a preview that ignores the edit in progress is a second authority on the same fact. -->
                                            <span class="mxav" aria-hidden="true">${(nv ? nv[0] : a.discordId.slice(-1)).toUpperCase()}</span>
                                            <span class="mxn">
                                                <b>…${a.discordId.slice(-6)}</b>
                                                <span>
                                                    ${editingNote === a.discordId ? html`
                                                        <!-- 🔴 data-bare IS NOT DECORATION AND IT IS NOT A CLASS I COULD HAVE OUT-SPECIFIED. app.css's element-level input rule is 0,3,1 and sets min-height:var(--tap), which is 44px, so this input rendered at 44px inside a 15px line and drew over the granted date beside it. That rule's own comment names this exact mistake -- made before with .cmdbar input.cb-in, reported by Harkirat twice weeks apart -- and says the fix is to OPT OUT rather than to outrank, because an opt-out cannot lose an argument it is not having. I tried raising the height first, measured it, and found 44px still winning.
                                                        ⚠️ A REF, NOT THE autofocus ATTRIBUTE, WHICH IS HONOURED ONLY WHILE THE PAGE IS BEING PARSED. On a swap like this one it does nothing at all: measured, the input appeared and the caret stayed where it was. The guard matters as much as the focus -- this callback runs on every render, and focusing an already-focused input would drag the caret to the end on every keystroke. -->
                                                        <input class="mxlbl-in" data-bare value=${nv}
                                                               ref=${(el) => { if (el && document.activeElement !== el) el.focus(); }}
                                                               aria-label=${`Label for …${a.discordId.slice(-6)}`}
                                                               placeholder="How you will recognise them"
                                                               onInput=${(e) => setPendingNote({ ...pendingNote, [a.discordId]: e.target.value })}
                                                               onBlur=${() => setEditingNote(null)}
                                                               onKeyDown=${(e) => {
                                                                   if (e.key === 'Escape') { dropNote(a.discordId); setEditingNote(null); }
                                                                   if (e.key === 'Enter') setEditingNote(null);
                                                               }} />`
                                                        : html`
                                                        <button class=${'mxlbl' + (ndirty ? ' pend' : '')}
                                                                aria-label=${`Edit the label for …${a.discordId.slice(-6)}`}
                                                                title="Rename this label — it stages like a permission and saves with the row"
                                                                onClick=${() => setEditingNote(a.discordId)}>${nv || 'no label'}</button>`}
                                                    ${a.grantedAt ? html`<em class="mxgr">· granted ${shortDate(a.grantedAt)}</em>` : null}
                                                </span>
                                            </span>
                                        </span></td>
                                        ${ordered.map((sc) => {
                                            const g = a.grants[sc.key] || {};
                                            const pend = rp[sc.key];
                                            const on = pend === undefined ? Boolean(g.direct || g.inherited) : pend;
                                            // 🔴 THE TICK IS DRAWN BY THE ARIA STATE, NOT BY A CLASS. app.css's checkmark is `.mxcell[aria-checked=true]::after`, so a cell wearing `.on` alone fills with the accent and draws nothing inside it — the state was legible only as colour, which §4.1 says is the one thing colour must not carry. 🔴 AN INHERITED CELL MUST NOT ALSO WEAR `.on`, EVEN THOUGH IT RENDERED CORRECTLY. `.mxcell.on` fills with the accent and `.mxcell.inh` resets the background to transparent — so the ring survived only because `.inh` is declared LATER in the stylesheet. Reorder those two rules and every inherited cell in the grid fills solid, which is the one thing the ring exists to distinguish. The design's inherited cell carries no `.on` at all. `aria-checked` stays true: an inherited permission IS held, and that is the semantics, not the paint.
                                            const inheritedOnly = pend === undefined && g.inherited && !g.direct;
                                            const cls = 'mxcell'
                                                + (on && !inheritedOnly ? ' on' : '')
                                                + (pend !== undefined ? (pend ? ' pend' : ' pend off') : (inheritedOnly ? ' inh inherited' : ''))
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
                                                    <button class="chip go" onClick=${() => onSave(a, rp, ndirty ? nv : undefined, () => clearRow(a.discordId))}>
                                                        Save ${changes} ${changes === 1 ? 'change' : 'changes'}</button>
                                                    <button class="chip" onClick=${() => clearRow(a.discordId)}>Discard</button>`
                                                : html`
                                                    <button class="chip" aria-label=${`Edit …${a.discordId.slice(-6)}`}
                                                            title="Permissions and label, in one drawer"
                                                            onClick=${() => onEdit(a)}>Edit</button>
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
                    <!-- 🔴 THE THIRD SENTENCE, AND IT ANSWERS A QUESTION RATHER THAN RESTATING A FACT. Pin pmtuxn6we
                         asked what the bar over each column name is FOR, given the squares below already show who holds
                         what. It was never the same fact: the squares are per person, the bar is the portal realm the
                         scope belongs to, and the amber ring is a single point of failure. Both were carried only by a
                         title attribute (no backtick on that word: this comment lives inside a template literal and
                         the build gate refuses one), which is invisible until you hover the 7px strip you cannot see. -->
                    <span>a filled square takes its colour from the realm that scope reaches, and <b>By permission</b> names that realm in words for every scope.</span>
                    <!-- ⚠️ "The owner has everything and cannot be edited" USED TO BE A THIRD SENTENCE HERE and was
                         removed once the owner ROW started rendering above. It restated, 300px below, a fact the row
                         states with a locked chip on every cell — two authorities for one fact, which is the defect
                         access.html's own comment records fixing when it moved the ring key out of this foot. The
                         design's foot has two sentences for the same reason. -->
                </div>
                <!-- ⚠️ THE COMMAND LIST IS SEPARATED BY MIDDOTS, NOT COMMAS, AND THE SENTENCES DO NOT WRAP MID-PHRASE.
                     An inline code chip carries horizontal padding, so a comma set straight after one lands a chip's
                     width from the word it belongs to (portalUi.test.js's own gate, and the Analytics callout that
                     earned it). And htm drops a whitespace-only text node across a newline, so a line ending in a word
                     whose next line opens with a tag renders as one run-on word. Both gates fired on this paragraph. -->
                <p class="racknote">${(matrix.scopes || []).length} permissions: ${(matrix.scopes || []).filter((s) => s.kind === 'command').length} commands — <code>manage</code> · <code>autobuild</code> · <code>bot</code> · <code>destructive</code> — and ${(matrix.scopes || []).filter((s) => s.kind === 'page').length} <code>/manage</code> pages. <code>all</code> is an input-only convenience that expands to the three ORIGINAL commands and <b>never to <code>destructive</code></b> — a convenience that quietly hands out irreversibility is the opposite of one. An admin must always hold at least one permission: an admin with nothing granted should be revoked, not parked in limbo. <b>🔒 <code>destructive</code> is a real permission in the bot</b> and the only one the <code>all</code> shorthand never includes — it can arrive only by being typed deliberately.</p>
            `}
        </div>
    `;
}

// By scope -- the inverse of the grid, and it answers a question the grid structurally cannot: "who can touch the calendar?" without reading across a row. Holders are derived from the SAME matrix rather than a second query, so the two views can never disagree about who holds what.
function ByScope({ matrix, spof, ownerId }) {
    const spofScopes = new Set((spof || []).map((s) => s.scope));
    return html`
        <div id="by-scope">
            <!-- ⚠️ THE SPOF LEGEND MOVED UP INTO THE VIEW BAR and is deliberately not repeated here. The mark
                 appears on BOTH views — it underlines a column in the grid and flags a row here — so two copies
                 would be two authorities for one mark, which is the defect access.html's own comment records
                 fixing when it moved the ring key out of the grid foot. It still appears only when there IS
                 one, because a legend for an absent mark is noise. -->
            <!-- ⚠️ THE RACKNOTE THAT USED TO SIT HERE MOVED, it did not vanish. It said the manage token
                 silently covers eight of the others; the design draws that note once, under the grid, and the
                 By-admin view now carries the fuller version of it. Two notes making the same point on two
                 tabs of one screen is the duplicate-authority defect this realm's own comments keep recording.
                 What this view needed instead was for each ROW to say which realm it reaches — which it now
                 does, in words, rather than in a title attribute you have to hover to read. -->
            <!-- 🔴 THE WARNING WAS ON SIX OF TWELVE ROWS, WORD FOR WORD, AND THE owner CHIP WAS ON ALL TWELVE.
                 Harkirat, pin pmtvqt8bp, 2026-09-10 12:29 EDT: "this shit is ugly and not intuitive at all."
                 When half the rows carry an identical amber pill and one chip is a constant, neither
                 discriminates and the reader learns to skip both. Holder COUNT is the question this list
                 actually answers, so it becomes the structure: three bands, each stating its risk once, rows
                 carrying only what differs. The owner holds everything by definition, so it is said in the
                 band note rather than stamped on every row. -->
            <div class="scopes">
                ${(() => {
                    const holdersOf = (sc) => matrix.admins.filter((a) => (a.grants[sc.key] || {}).held).map((a) => a.discordId);
                    const bandOf = (sc) => (spofScopes.has(sc.key) ? 0 : holdersOf(sc).length === 0 ? 1 : 2);
                    const BANDS = [
                        { k: 0, t: 'Only one person besides you', n: 'If they go, you are the only one left who can do it.' },
                        { k: 1, t: 'Nobody but you', n: 'The resting state of a solo-maintained bot.' },
                        { k: 2, t: 'You and two or more', n: 'Covered if someone leaves.' },
                    ];
                    const every = matrix.scopes || [];
                    return BANDS.map((b) => {
                        const rows = every.filter((sc) => bandOf(sc) === b.k);
                        if (!rows.length) return null;
                        return html`<div class=${'scbandh b' + b.k} key=${'h' + b.k}>
                                <b>${b.t}</b><span>${b.n}</span><em>${rows.length} of ${every.length}</em>
                            </div>
                            ${rows.map((sc) => {
                                const holders = holdersOf(sc);
                                const alone = b.k === 0;
                                const lone = b.k === 1;
                                return html`
                        <div class=${'scope' + (alone ? ' spof' : lone ? ' lone' : '')} style=${`--c:${accentOf(sc)}`}>
                            <!-- The name is the LABEL with the raw token beside it, not the token alone: the token
                                 is what you type into a grant and the label is what it means, and a list showing
                                 only the token asks the reader to translate twelve of them. -->
                            <span class="nm"><i></i>${sc.label || sc.key}<em>${sc.key}</em></span>
                            <!-- 🔴 ELEVEN SCOPE TOKENS AND NO WAY TO TELL WHICH ONES REACH THE PORTAL. The realm was already known — the grid above puts it in a title attribute, which is a hover on a row you are reading with your eyes — and the difference matters: a Discord-only scope granted to somebody who only ever uses the portal does nothing at all. -->
                            <span class="rl">${sc.realm ? html`reaches <b>${sc.realm}</b>` : html`<span class="none">Discord only</span>`}</span>
                            <span class="hs">
                                ${holders.length ? holders.map((h) => html`<span class="holder" key=${h}>…${h.slice(-6)}</span>`)
                                    : html`<span class="holder none">nobody else</span>`}
                            </span>
                        </div>
                    `;
                            })}`;
                    });
                })()}
            </div>
            <!-- The two flags this list draws, named where the list ends. Same rule as the grid's foot: a mark
                 that is on screen is named on screen, and only the marks that ARE on screen. -->
            <div class="mxfoot">
                <span><b style="color:var(--warn)">Single point</b> — exactly one non-owner holds it. If they go, you are the only one left who can do it.</span>
                <span><b>Nobody but you</b> — zero non-owner holders. Safe, and also the reason you are still doing it yourself.</span>
            </div>
        </div>
    `;
}

export function AccessRealm({ session }) {
    // Both endpoints in ONE useAsync, because they are one page: two hooks would give the realm two independent phases and a screen that is half skeleton and half table, which reads as a rendering bug rather than as loading. ⚠️ `/api/review` RIDES ALONG for the rail's staged badge, in the SAME `useAsync` so the realm still has one loading phase. It is deliberately NOT run through `failureOf`: a 403 on review must not take down the Access page, which an admin can legitimately hold without holding Review.
    const load = useAsync(() => Promise.all([fetchJson('/api/access'), fetchJson('/api/access/matrix'), fetchJson('/api/review')])
        .then(([d, m, review]) => (failureOf(d) ? d : failureOf(m) ? m : { ...d, matrix: m,
            stagedOps: (review && review.ops) || [],
            stagedUnknown: Boolean(review && (review.forbidden || review.failed)) })), []);
    const [notice, setNotice] = useState('');
    const [view, setView] = useState('By admin');
    const overlay = useOverlay();
    // D1/pin32 — the grant drawer's own open state, and delight/pin5's one-time row highlight after a grant lands. Cleared on a timer rather than on the next render: the grid re-renders on every poll/refresh, and a highlight that survived only until "something else redraws" would flicker on and off unpredictably.
    const [showGrant, setShowGrant] = useState(false);
    const [editAdmin, setEditAdmin] = useState(null);   // the row whose full Edit drawer is open
    const [highlightId, setHighlightId] = useState(null);
    useEffect(() => {
        if (!highlightId) return undefined;
        const t = setTimeout(() => setHighlightId(null), 2400);
        return () => clearTimeout(t);
    }, [highlightId]);

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
    function confirmSave(admin, rowPending, nextNote, clear) {
        const labelOf = (key) => (matrix.scopes || []).find((s) => s.key === key)?.label || key;
        const { granted, revoked } = describePending(rowPending, labelOf);
        const noteChanged = nextNote !== undefined && nextNote !== (admin.note || '');
        const labelOnly = noteChanged && !granted.length && !revoked.length;
        overlay.confirm({
            op: 'admin.grant', tier: 3, danger: Boolean(revoked.length),
            confirmLabel: labelOnly ? 'Save the label' : 'Save permissions',
            typed: admin.discordId,
            // 🔴 A LABEL-ONLY SAVE CHANGES NOTHING ABOUT WHAT THEY CAN DO, and the first version asked "Change what …000002 can do?" over a rename. Same defect the one-way strip already carries a note about: one body serving several acts and describing the wrong one.
            title: labelOnly ? `Rename …${admin.discordId.slice(-6)}?` : `Change what …${admin.discordId.slice(-6)} can do?`,
            body: html`
                <!-- 🔴 GRANTING AND REVOKING READ IDENTICALLY AS TWO BOLD PARAGRAPHS, and they are opposite acts. The drawer's eyebrow already carries the op id in prose; this states it as the identifier the server will see, and splits the two directions into groups whose colour is their direction. -->
                <div class="idop"><b>admin.grant</b>${' '}
                    ${labelOnly ? '— the same write, carrying only a new label; the permission list is unchanged'
                        : '— replaces the whole permission list for this account'}</div>
                ${granted.length ? html`
                    <div class="acg"><b class="acg-k on">Granting ${granted.length}</b>
                        <ul class="dw-l">${granted.map((g) => html`<li key=${g}>${g}</li>`)}</ul></div>` : null}
                ${revoked.length ? html`
                    <div class="acg"><b class="acg-k off">Revoking ${revoked.length}</b>
                        <ul class="dw-l">${revoked.map((g) => html`<li key=${g}>${g}</li>`)}</ul></div>` : null}
                ${noteChanged ? html`
                    <div class="acg"><b class="acg-k">Label</b>
                        <ul class="dw-l"><li>${admin.note || 'no label'} → <b>${nextNote || 'no label'}</b></li></ul></div>` : null}
                ${revoked.length ? html`
                    <div class="callout dangerous"><b>A revoke takes effect on their very next action.</b> It is not
                        staged and there is no undo button — restoring it means granting it again.</div>` : null}
                <p class="dw-p">Access does not stage. This is written the moment you confirm, and every request
                    they make re-checks server-side — so a revoke takes effect on their very next action, even with
                    a portal session already open.</p>`,
            onConfirm: async () => {
                // ⚠️ THE FOURTH ARGUMENT IS THE WHOLE POINT. `grant()` posts to /api/access/grant, which REPLACES the row — so a save that omits the note is a save that erases it. The server now leaves an absent note alone (portal/api/access.js's adminGrantDoc), and this passes the current one anyway so the intent is visible at the call site rather than resting on a default two files away.
                await grant(admin.discordId, permsAfter(admin.permissions, rowPending), admin.discordId,
                    nextNote === undefined ? admin.note : nextNote);
                clear();
                overlay.say(labelOnly ? 'Label saved.' : 'Permissions saved.');
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

    async function grant(discordId, permissions, confirmText, note) {
        const body = await fetchJson('/api/access/grant', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
            body: JSON.stringify({ discordId, permissions, confirmText, note }),
        });
        setNotice(body.ok ? '' : (body.reason || body.error || 'Grant failed'));
        refresh();
        return body;
    }

    // D1/pin32 delight — the drawer's own success path: close it, highlight the new row once, and say what happened. Kept separate from grant() itself because grant() is also the grid's own save path (confirmSave below), which already has its own "Permissions saved." toast and must not also close a drawer that was never open.
    async function handleGrant(discordId, permissions, confirmText, note) {
        const body = await grant(discordId, permissions, confirmText, note);
        if (!body || !body.ok) return;
        setShowGrant(false);
        setHighlightId(discordId);
        overlay.say(`Granted ${permissions.length} permission${permissions.length === 1 ? '' : 's'} to …${discordId.slice(-6)}.`);
    }

    // The Edit drawer's success path. It posts through the same grant() as everything else — /api/access/grant REPLACES the row, which is exactly what an edit is — and says what changed rather than "saved", because the drawer can move permissions and the label in one act.
    async function handleEdit(discordId, permissions, confirmText, note) {
        const before = editAdmin;
        const body = await grant(discordId, permissions, confirmText, note);
        if (!body || !body.ok) return;
        setEditAdmin(null);
        setHighlightId(discordId);
        const moved = permissions.length - (before.permissions || []).length;
        const relabelled = (note || '') !== (before.note || '');
        overlay.say(relabelled && !moved ? `Label is now “${note || 'no label'}”.`
            : `…${discordId.slice(-6)} now holds ${permissions.length} permission${permissions.length === 1 ? '' : 's'}.`);
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

    // 🔴 THE PERMISSION MODEL COULD NOT LEAVE THE PORTAL. `AdminUser` is the only record of who can do what, a grant is derivable from nothing else, and the one page that shows it is owner-only -- so this is the realm where a copy matters most and the only one that had no way to take one. ⚠️ The matrix goes out as CSV because it IS a grid: flattening it to prose would lose the direct-vs-inherited distinction, which is the entire reason a grid beats a comma-separated list.
    const exportToday = new Date().toISOString().slice(0, 10);
    const exportScopes = [
        { id: 'access.admins', label: 'Admins', unit: 'admins',
          count: (data.admins || []).length, url: '/api/access/export?scope=admins',
          filename: `dioreo-admins-${exportToday}.txt`,
          note: 'One block each: who, when, who granted it, and the permissions they hold.' },
        { id: 'access.matrix', label: 'Permission grid', unit: 'admins',
          count: (data.admins || []).length, url: '/api/access/export?scope=matrix',
          filename: `dioreo-permissions-${exportToday}.csv`,
          note: 'A spreadsheet of the grid — every cell says direct or inherited, never just on.' },
        { id: 'access.sessions', label: 'Open sessions', unit: 'sessions',
          count: (data.sessions || []).length, url: '/api/access/export?scope=sessions',
          filename: `dioreo-sessions-${exportToday}.csv`,
          note: 'Who is signed in right now, when they signed in, and when it expires.' },
    ];
    const matrix = data.matrix || { admins: [], scopes: [] };
    const allScopes = matrix.scopes || [];
    const spofSet = new Set((data.singlePointsOfFailure || []).map((x) => x.scope));
    // "held by nobody but you" is the owner's own reach minus everyone else's: a scope no granted admin holds is one where you are the single point, which is the fact the By-permission view exists to surface. Derived from the SAME matrix the grid renders, never a second query that could disagree.
    const unheld = allScopes.filter((sc) => !(matrix.admins || []).some((a) => (a.grants[sc.key] || {}).held));
    // The design's own stat: the number of permission TOKENS handed out, which is not the number of cells lit — a bare `manage` is one token covering eight pages. Counting cells would answer a different question and quietly disagree with what an export of the same data says.
    const permissionsGranted = (matrix.admins || []).reduce((n, a) => n + (a.permissions || []).length, 0);
    const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
    const viewMeta = view === 'By admin'
        ? `${plural(matrix.admins.length, 'admin')} × ${allScopes.length} permissions`
        : `${plural(spofSet.size, 'single point')} · ${unheld.length} held by nobody but you`;
    // ⚠️ A REALM KEY NAMES ONLY MARKS THAT ARE ON SCREEN (the Shell's own rule beside `realmKey`), so the single-point entry appears only when there is one. The lock does not: the owner-only column is always drawn, so it is always named. 🔴 THE WHOLE KEY GOES WHEN THE GRID GOES. With zero AdminUser documents ByAdmin replaces the entire table with one paragraph, so direct, inherited and the lock are all off screen — and this named all three anyway, under its own comment stating the rule it was breaking. The dev database cannot reach that state, which is why the pass never rendered it. The lock is additionally gated on a scope actually carrying ownerOnly, because a legend entry is a promise that the mark is somewhere on the page.
    const anyGrid = (matrix.admins || []).length > 0;
    const anyLock = allScopes.some((sc) => sc.ownerOnly);
    const accessKey = !anyGrid ? null : html`
        <span class="key">
            <span class="l"><i></i>direct</span>
            <span class="s"><i></i>inherited</span>
            ${anyGrid ? html`<span class="l dk" data-note>the number over a column is how many people besides you hold it — <em class="mxdepth none">0</em> nobody, <em class="mxdepth one">1</em> a single point</span>` : null}
            ${anyLock ? html`<span class="l" data-note><i style="background:none"><${Icon} name="lock" cls="sm" /></i>owner-grantable only</span>` : null}
        </span>`;

    // A session is "signed in now" if it was seen in the last 15 minutes -- the same rough threshold 06-access-and-analytics.html's own "2 signed in now" stat line implies. Not a stored flag: a browser session has no logout event unless someone clicks it, so recency is the only honest signal there is.
    const activeSessions = data.sessions.filter((s) => Date.now() - new Date(s.lastSeenAt).getTime() < 15 * 60000).length;

    // 🔴 THE RAIL'S STAGED COUNT REACHED TWO REALMS OF SEVEN. `badges` was passed by Home (home.js) and Season (season.js) only, so the one number the rail exists to carry — how much work is waiting — was absent on the five realms in between, including the two that stage on every edit. It is a property of the CHANGESET, so it is the TOTAL and not this realm's share; `Rail` omits it at zero, which is the "absent rather than zero" rule `shell.js:43` states. Unknown (a 403 on /api/review) reads as absent too, because a badge is not the surface that can say "you cannot see that". ⚠️ AS A `//` COMMENT ABOVE THE RETURN, NEVER AS `<!-- -->` INSIDE THE PROP LIST — the first version was the latter on all five realms and htm dropped every prop after it.
    return html`
        <${Shell} realm="access" session=${session} busy=${load.hostClass} view=${view} viewOptions=${['By admin', 'By permission']} onSetView=${setView}
                  meta=${viewMeta} realmKey=${accessKey}
                  badges=${{ review: data.stagedUnknown ? 0 : (data.stagedOps || []).length }}
                  stagedOps=${data.stagedUnknown ? null : data.stagedOps}
                  exports=${exportScopes} exportLabel="Export" overlayFor=${overlay}
                  overlaySlot=${html`${overlay.render()}${showGrant ? html`<${GrantForm} onGrant=${handleGrant} scopes=${matrix.scopes} onCancel=${() => setShowGrant(false)} />` : null}${editAdmin ? html`<${GrantForm} admin=${editAdmin} onGrant=${handleEdit} scopes=${matrix.scopes} onCancel=${() => setEditAdmin(null)} />` : null}`}
                  masthead=${html`<${Masthead} title="Access" sub="Who can do what — and where you are the only one who can do it."
                                               stats=${[
                                                   { value: data.admins.length, label: 'granted', lead: true, accent: 'var(--r-access)' },
                                                   { value: permissionsGranted, label: 'permissions' },
                                                   // 🔴 `hot` AND `bad` WERE CLASSES WITH NO RULE. `.stat.warn .v` and `.stat.stg .v` are the only two tones either stylesheet defines, so a single-points count that was meant to read as a warning painted in ordinary ink and a warning became a number. Same defect home.js records for a `tone: 'live'` that styled nothing. The signed-in figure takes no tone at all, which is what the design gives it — being signed in is not a warning.
                                                   { value: activeSessions, label: 'signed in' },
                                                   { value: (data.singlePointsOfFailure || []).length, label: 'single points',
                                                     tone: (data.singlePointsOfFailure || []).length ? 'warn' : undefined },
                                               ]}
                                               actions=${html`<${MastheadNew} label="Grant access" hint="n"
                                                                              tip="Grant a new admin access"
                                                                              onClick=${() => { setView('By admin'); setShowGrant(true); }} />`} />`}
                  contextSlot=${html`
                      <!-- The design opens the page with this, and it is the one thing a reader cannot work out
                           from the grid: this realm has no grantable permission at all. portal/api/realmAccess.js
                           pushes 'access' onto the visible list only if owner, and every route in
                           portal/api/access.js is wrapped in ownerOnly() — so the page is not merely restricted,
                           there is no token that would open it. Without the note the empty ACCESS column reads
                           as an oversight. -->
                      <!-- 🔴 THE PLAIN OUTER DIV IS LOAD-BEARING, NOT TIDINESS. Both stylesheets carry
                           .panel + .panel{background:transparent}, so a bare .panel here would make the view
                           panel below it recessive — the exact defect Armory paid for with a stray paragraph,
                           measured then as a 125-row table painting #171E24 against the design's #0F1418.
                           access.html wraps its own note in a plain #ownerNote div for the same reason, and
                           the converge run that introduced this caught it as a section.panel backgroundColor
                           row within one pass. -->
                      <div id="owner-note"><div class="panel" style="margin-bottom:16px"><div class="callout">
                          <b>Owner-only, and not by choice.</b> Access has <b>no grantable permission</b> — there is
                          nothing here you could hand out if you wanted to, and the rail hides this page entirely for
                          anyone else, exactly like <code>/bot access</code> in Discord.
                          The owner is <code>…${String(session.discordId || '').slice(-6)}</code> and holds everything
                          regardless of this list.
                      </div></div></div>`}
                  footSlot=${html`<${Sessions} sessions=${data.sessions || []} onEnd=${confirmEndSessions} ttlHours=${data.sessionTtlHours ?? 12} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      ${view === 'By admin'
                          ? html`<${ByAdmin} matrix=${matrix} spof=${data.singlePointsOfFailure}
                                             onRevoke=${confirmRevoke} onSave=${confirmSave} onEdit=${setEditAdmin}
                                             highlightId=${highlightId}
                                             onExplain=${explainInherited} isOwnerId=${session.discordId} />`
                          : html`<${ByScope} matrix=${matrix} spof=${data.singlePointsOfFailure} ownerId=${session.discordId} />`}
                  `} />
    `;
}
