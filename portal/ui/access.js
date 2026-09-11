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
// Debounced 400ms so every keystroke does not fire a Discord API call, and only once the id LOOKS like a snowflake (17–20 digits) — an in-progress id is not a failed lookup, it is simply not a ready one yet, and treating it as an error would flash a warning on every keystroke. A column is ~110px wide and a title is free text, so the grid clips rather than wraps: a second line would push every avatar in the header row down by the height of the longest label anybody ever typed. 22 is Harkirat's number, 2026-09-11 16:40 EDT, and the ellipsis counts toward it.
const clip = (v, n = 22) => (typeof v === 'string' && v.length > n ? v.slice(0, n - 1) + '…' : (v || ''));
const shortDate = (v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

// 🔴 ONE SOURCE FOR A SCOPE'S COLOUR, AND THE DRAWER HAD BEEN READING A SECOND ONE THAT DOES NOT EXIST. The grid has always coloured a cell with this; the permission chips read sc.hex instead, which buildPermissionMatrix has never emitted -- it builds {key, label, kind, ownerOnly, realm}. So --c was unset on every chip, .chip.topic i painted background:var(--c) with nothing in it, and a picked chip's color-mix(in srgb,var(--c) 16%,transparent) was invalid and dropped entirely: twelve identical black pills where the design shows the realm's colour. ⚠️ THE HARNESS FIXTURE DOES SET hex (assets/fixtures.js:1100), which is the whole reason no instrument caught it -- the same shape as the ownerOnly mark recorded in portal/api/access.js, where the legend named a mark only the fixture could draw. Hoisted above its first reader because the TDZ ratchet is right that source order should not be what holds a render up. 🔴 A SCOPE'S COLOUR IS ITS OWN NOW, NOT ITS REALM'S — Harkirat, 2026-09-11 13:09 EDT. It used to be `var(--r-${sc.realm})`, so the five season pages were one amber and the two armory pages one violet, and COMPANION §4.2 defended that: "every colour here is borrowed from the realm the scope governs, because inventing an eighth accent would put a colour on screen that means nothing anywhere else in the product." His ruling is that the rule has to bend HERE specifically: this panel grants access inside the DISCORD BOT, the portal's own access scoping is not built, and he is the only person with portal access — so a realm hue is naming a thing this grid is not about. Shades of one hue were tried first and rejected: "they all more or less still look/feel the same." Twelve distinct hues, spaced around the wheel and deliberately clear of the 165–265° band the edit identities own, so a topic colour and an edit colour can never be mistaken for one another.
const SCOPE_COLOR = {
    // 🔴 SPACED ON THE WHEEL, NOT SHADED. The first attempt put Autobuild, DMZ and Season Draft on three greens and Manage and MP on two purples -- Harkirat, 2026-09-11 14:06 EDT: "NEARLY IDENTICAL SHADES". Twelve hues roughly 30 degrees apart, and the EDIT identities were moved to pale tints in tokens.css so a topic colour and an edit colour can never be confused without the topics losing the wheel.
    manage: '#8B5CF6',                 autobuild: '#06B6D4',
    bot: '#EAB308',                    destructive: '#EF4444',
    'manage.draws': '#F97316',         'manage.calendar': '#14B8A6',
    'manage.loadouts_mp': '#EC4899',   'manage.loadouts_dmz': '#22C55E',
    'manage.patchnotes': '#A3E635',    'manage.seasondraft': '#3B82F6',
    'manage.season': '#F59E0B',        'manage.announcement': '#D946EF',
};
const accentOf = (sc) => SCOPE_COLOR[sc.key] || 'var(--ink3)';

// 🔴 PEOPLE, NOT SNOWFLAKES. Every admin surface rendered an ellipsis and six digits -- Harkirat: "Gee i didn't know my name was ...632283". The route and the shape were already here: the grant drawer's preview reads `user.globalName`, `user.username` and `user.avatarUrl` from this same endpoint. Nothing needed building; it needed using. The id survives only as the fallback when Discord refuses, which is the one case where a number is better than a wrong name. 🔴 ONE RESOLVED IDENTITY PER ID, AND ONE RULE FOR PRINTING IT. Harkirat, 2026-09-11 17:11 EDT: "talk about fixing the instance instead of the class... why isn't that just a shared token? a change in 1 place should have changed it equally anywhere else it was utilized." It was eleven separate `…${id.slice(-6)}` expressions -- the column heads, the edit bars, the drawer heading, the granted-by line, the sessions list, the By-permission holders, three confirmation bodies and two toasts -- so teaching one of them a username taught none of the others. `personName` is now the only place that decides, and `AccessRealm` resolves every id the page can show in a single pass and hands the answer down. The Map outlives every component that reads it, which is what stops the drawer flashing an id for 400ms before the name arrives.
const IDENTITY = new Map();
const personName = (user, id) => (user && (user.globalName || user.username)) || `…${String(id || '').slice(-6)}`;

function useIdentities(ids) {
    const [map, setMap] = useState(() => Object.fromEntries(ids.filter((id) => IDENTITY.has(id)).map((id) => [id, IDENTITY.get(id)])));
    const key = ids.join(',');
    useEffect(() => {
        let dead = false;
        (async () => {
            const out = {};
            for (const id of ids) {
                if (!/^\d{17,20}$/.test(id)) continue;
                if (IDENTITY.has(id)) { out[id] = IDENTITY.get(id); continue; }
                const r = await fetchJson(`/api/discord/user?id=${id}`);
                if (r && r.id) { IDENTITY.set(id, r); out[id] = r; }
            }
            if (!dead && Object.keys(out).length) setMap((p) => ({ ...p, ...out }));
        })();
        return () => { dead = true; };
    }, [key]);
    return map;
}

function useDiscordLookup(discordId) {
    const [state, setState] = useState(() => (IDENTITY.has(discordId) ? { status: 'ok', user: IDENTITY.get(discordId) } : { status: 'idle' }));
    useEffect(() => {
        if (!/^\d{17,20}$/.test(discordId)) { setState({ status: 'idle' }); return undefined; }
        // A cache hit skips the debounce: the round trip exists to catch a typo in an id being TYPED, and an id the page has already resolved cannot be one.
        if (IDENTITY.has(discordId)) { setState({ status: 'ok', user: IDENTITY.get(discordId) }); return undefined; }
        setState({ status: 'loading' });
        let cancelled = false;
        const t = setTimeout(async () => {
            const res = await fetchJson(`/api/discord/user?id=${discordId}`);
            if (cancelled) return;
            if (res && res.id) { IDENTITY.set(discordId, res); setState({ status: 'ok', user: res }); }
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
function GrantForm({ admin, onGrant, scopes, onCancel, onRevoke, nameOf }) {
    const editing = Boolean(admin);
    const scopeKeys = new Set((scopes || []).map((sc) => sc.key));
    const [discordId, setDiscordId] = useState(editing ? admin.discordId : '');
    const [picked, setPicked] = useState(editing ? (admin.permissions || []).filter((k) => scopeKeys.has(k)) : []);
    // 🔴 THE RENAME MIGRATES HERE, ONE ROW AT A TIME, RATHER THAN IN A SCRIPT. Until 2026-09-11 there was one free-text field called "Label"; it is now two -- Title, the official name the grid prints, and Note, a private reminder. A row granted before the split carries only the old note, and that note WAS the grid label, so on such a row the Title field opens holding it and the Note field opens empty. A row that already has a title keeps both as they are. Nothing touches the database until the owner saves.
    const [title, setTitle] = useState(editing ? (admin.title || admin.note || '') : '');
    const [note, setNote] = useState(editing ? (admin.title ? (admin.note || '') : '') : '');
    // 🔴 THE SECOND STEP IS ITS OWN SCREEN, NOT A RELABELLED BUTTON IN THE SAME PLACE. The first version swapped the footer's text and left everything else standing, and Harkirat read it as a button that had not registered his click -- 2026-09-11 17:10 EDT: "I DIDN'T MEAN IN THE EXACT SAME SPOT... the 1st time i didn't even notice it and thought the button was just bugged." A confirmation that looks like the thing it is confirming is not one. The drawer replaces its whole body with a summary of exactly what is about to be written. ⚠️ THE WIRE CONTRACT IS UNCHANGED: portal/api/access.js's confirmMatchesTarget still requires the target's own id, and `submit` sends it, so the server's gate is where it always was.
    const [armed, setArmed] = useState(false);
    const lookup = useDiscordLookup(discordId);
    const toggle = (key) => setPicked(picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key]);
    // 🔴 THE LOOKUP RUNS IN BOTH MODES BUT ONLY GATES ONE, and the first version of this got it backwards twice over. It faked `{status:'ok'}` in edit mode to skip the round-trip — which crashed the drawer outright, because the preview below reads `lookup.user.avatarUrl` and a faked status carries no user. It was also wrong on the merits: the avatar and username are exactly what tell you WHICH HUMAN this row of digits is, which is the whole argument that put the lookup on the grant form. So it runs. What it must NOT do is gate readiness: an id already in the grid was resolved when it was granted, and making a label edit wait on Discord being reachable would mean an outage there locks the owner out of renaming a row here.
    const base = grantReady({ discordId, lookupStatus: editing ? 'ok' : lookup.status, pickedCount: picked.length, confirmText: discordId });
    // A title is required because it is the only thing naming this person on the grid. `grantReady` is kept pure and unit-tested and is deliberately not taught about it -- the field is this form's own rule.
    const ready = base.ready && title.trim().length > 0;
    const why = base.why || (!title.trim() ? 'Give them a title — it is what names them on the grid.' : '');
    // One rule decides who this is, here and everywhere else on the realm. See `personName`.
    const label = editing ? nameOf(admin.discordId)
        : (lookup.status === 'ok' && lookup.user ? (lookup.user.globalName || lookup.user.username) : 'this account');
    const tiers = [
        { key: 'command', heading: 'Commands', rows: (scopes || []).filter((sc) => sc.kind === 'command') },
        { key: 'page', heading: '/manage pages', rows: (scopes || []).filter((sc) => sc.kind === 'page') },
    ];
    const chosen = (scopes || []).filter((sc) => picked.includes(sc.key));
    const submit = () => onGrant(discordId, picked, discordId, note, title.trim());

    // 🔴 AND THE COMMITTING BUTTON MUST NOT SIT WHERE THE PREVIOUS ONE DID. The confirm screen was its own screen and still failed, because "Save changes" landed on the exact pixels "Save changes" had just occupied -- so a double click commits and the second step is decoration. Harkirat, 2026-09-11 17:18 EDT: "THE SAVE BUTTON IS STILL IN THE SAME SPOT. Which defeats the entire purpose." The commit takes the footer's FAR LEFT and Back takes the right, so the pixels under the cursor are the harmless action.
    if (armed) {
        return html`
            <${Drawer} eyebrow="admin.grant · tier 3 · confirm"
                       title=${editing ? `Save changes to ${label}?` : `Grant access to ${label}?`}
                       onClose=${() => setArmed(false)}
                       actions=${html`
                           <button class="btn go cfmgo" onClick=${submit}>${editing ? 'Yes, save changes' : 'Yes, grant access'}</button>
                           <button class="btn" onClick=${() => setArmed(false)}>Back</button>`}>
                <div class="dwbody">
                    <p class="dw-lead">Written immediately. No review screen, no undo.</p>
                    <div class="cfm">
                        <div class="cfmrow"><b>Account</b><span><code>${discordId}</code></span></div>
                        <div class="cfmrow"><b>Title</b><span>${title.trim()}</span></div>
                        <div class="cfmrow"><b>Note</b><span>${note.trim() || html`<em>none</em>`}</span></div>
                        <div class="cfmrow"><b>Permissions</b><span class="cfmchips">
                            ${chosen.length ? chosen.map((sc) => html`<span key=${sc.key} class="bchip" style=${`--c:${accentOf(sc)};--ed:var(--staged)`}><i></i>${sc.label || sc.key}</span>`)
                                : html`<em>none</em>`}</span></div>
                    </div>
                    ${editing ? html`<p class="dw-p">This is the whole list. Anything not above is revoked on their next action.</p>` : null}
                </div>
            <//>
        `;
    }

    return html`
        <${Drawer} eyebrow=${editing ? 'admin.grant · tier 3 · replaces the whole list' : 'admin.grant · tier 3'}
                   title=${editing ? `Edit ${label}` : 'Grant portal access'} onClose=${onCancel}
                   actions=${html`
                       ${editing && onRevoke ? html`<button class="btn danger" style="margin-right:auto"
                               onClick=${() => onRevoke(admin.discordId)}>Revoke access</button>` : null}
                       <button class="btn" onClick=${onCancel}>Cancel</button>
                       <button class="btn go" disabled=${!ready} onClick=${() => setArmed(true)}>${editing ? 'Save changes' : 'Grant now'}</button>`}>
            <div class="dwbody">
                ${tiers.map((t) => html`
                    <div key=${t.key} class="tokgroup" data-tier=${t.key}>
                        <h5>${t.heading}<em>${t.rows.length}</em></h5>
                        <div class="tokgrid">
                            ${t.rows.map((sc) => html`
                                <button key=${sc.key} class=${'chip topic' + (picked.includes(sc.key) ? ' on' : '')}
                                        style=${`--c:${accentOf(sc)}`} aria-pressed=${picked.includes(sc.key) ? 'true' : 'false'}
                                        title=${sc.key} onClick=${() => toggle(sc.key)}>
                                    <i></i>${sc.label || sc.key}${sc.ownerOnly ? html`<b class="ownly-k"><${Icon} name="lock" cls="sm" label="owner-grantable only" /></b>` : null}
                                </button>`)}
                        </div>
                    </div>`)}
                <!-- 🔴 THE ID SITS UNDER THE PERMISSIONS, NOT ABOVE THEM. Harkirat, 2026-09-11 17:21 EDT. The drawer reads as a sentence in this order: here is what this account may do, here is which account, here is what to call them. The lookup preview and the granted-by line travel WITH the id rather than staying behind -- the preview exists to answer "is that the right human" about the field directly above it, and separating them would leave an avatar explaining nothing. -->
                <div class="dwfield"><label for="grant-discordid">Discord ID</label>
                    <input id="grant-discordid" placeholder="17–20 digits" inputmode="numeric" autocomplete="off"
                           readOnly=${editing} aria-readonly=${editing ? 'true' : 'false'}
                           value=${discordId} onInput=${(e) => setDiscordId(e.target.value.trim())} /></div>
                ${editing ? html`<p class="dw-p">Granted by <b class="granter">${nameOf(admin.grantedBy)}</b>${admin.grantedAt ? html`, ${shortDate(admin.grantedAt)}` : null}.</p>` : null}
                ${lookup.status === 'loading' ? html`<p class="dw-p">Looking that id up…</p>` : null}
                ${lookup.status === 'error' ? html`<p class="dw-p" style="color:var(--warn)">${lookup.reason}</p>` : null}
                ${lookup.status === 'ok' && lookup.user ? html`
                    <div class="grantpreview">
                        <span class="gp-av" aria-hidden="true" style=${`--av-src:url(${lookup.user.avatarUrl})`}></span>
                        <span class="gp-n"><b>${lookup.user.globalName || lookup.user.username}</b>
                            <span>@${lookup.user.username} · …${discordId.slice(-6)}</span></span>
                    </div>` : null}
                <div class="dwfield"><label for="grant-title">Title</label>
                    <input id="grant-title" placeholder="What they are here to do" value=${title}
                           aria-required="true" onInput=${(e) => setTitle(e.target.value)} />
                    <span class="hint">Shown on the grid. Clipped past 22 characters.</span></div>
                <div class="dwfield"><label for="grant-note">Note <i>optional</i></label>
                    <input id="grant-note" placeholder="A private reminder about them" value=${note}
                           onInput=${(e) => setNote(e.target.value)} />
                    <span class="hint">Only ever visible here.</span></div>
                <p class="dw-p"><b>Commits immediately</b> — nothing is staged, and it is live in the bot on their next click.</p>
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


function Sessions({ sessions, onEnd, ttlHours, nameOf }) {
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
                                <b>${nameOf(s.discordId)}</b>
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
function ByAdmin({ matrix, spof, onSave, onRevoke, onEdit, onExplain, isOwnerId, highlightId, who, nameOf }) {
    const [pending, setPending] = useState({});     // { "discordId|scope": true|false }
    const [pendingNote, setPendingNote] = useState({});
    const [editingNote, setEditingNote] = useState(null);
    const scopes = matrix.scopes || [];
    const commands = scopes.filter((s) => s.kind === 'command');
    const pages = scopes.filter((s) => s.kind === 'page');
    const spofScopes = new Set((spof || []).map((x) => x.scope));
    // 🔴 THE OWNER IS SYNTHETIC AND ALWAYS HAS BEEN. `buildPermissionMatrix` reads the AdminUser collection and the owner is not in it -- the owner is built in, not granted -- so the old grid drew a static owner ROW for exactly this reason. Transposed, that becomes a static first COLUMN; taking `matrix.admins` alone silently dropped it, which reads as "the owner holds nothing".
    const granted = (matrix.admins || []).filter((a) => a.discordId !== isOwnerId);
    const ownerCol = {
        discordId: isOwnerId || 'owner', note: 'Owner', __owner: true,
        grants: Object.fromEntries(scopes.map((sc) => [sc.key, { direct: true, held: true }])),
    };
    const people = [ownerCol, ...granted];
    // "besides you" -- the owner holds everything by definition, so counting them would make every count 1 higher and mean nothing.
    const holdersOf = (sc) => granted.filter((a) => (a.grants[sc.key] || {}).held).length;

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
    // ⚠️ DISCARD HAS TO DROP BOTH, or a discarded admin keeps a staged label that its own Save no longer counts.
    const clearRow = (id) => {
        setPending((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(id + '|'))));
        dropNote(id);
        setEditingNote((cur) => (cur === id ? null : cur));
    };
    const noteNow = (a) => (pendingNote[a.discordId] !== undefined ? pendingNote[a.discordId] : (a.note || ''));
    // The grid prints the TITLE. `note` is the private field now, and the fallback is the whole migration: a row granted before the 2026-09-11 split has no title and its old note is what the grid used to show, so it keeps showing it until the Edit drawer promotes it. See models/AdminUser.js.
    const titleOf = (a) => a.title || a.note || '';
    const noteDirty = (a) => pendingNote[a.discordId] !== undefined && pendingNote[a.discordId] !== (a.note || '');

    // Every admin carrying an edit takes one of four EDIT IDENTITY colours, and the same value paints their column head, their pending cells and their bar -- so a bar, a column and a set of cells are one object. Assigned by position in the admin list so a person keeps their colour for as long as the list does.
    const editColor = (a) => (a.__owner ? 'var(--ink3)' : `var(--ed${(granted.findIndex((g) => g.discordId === a.discordId) % 4) + 1})`);
    const dirtyOf = (a) => Object.keys(rowPending(a.discordId)).length + (noteDirty(a) ? 1 : 0);
    const editing = people.map((a, i) => ({ a, i })).filter(({ a }) => !a.__owner && dirtyOf(a) > 0);

    // The command a page was inherited FROM. `portal/api/access.js` computes `inherited` as `kind === 'page' && !direct && perms.includes('manage')` -- so today exactly one command confers, and the ring wears its colour. Resolved from the scope list rather than hardcoded, so a second conferring command becomes a data change here rather than a design change.
    const CONFERRER = 'manage';
    const conferrer = commands.find((c) => c.key === CONFERRER) || null;

    const groups = [
        { key: 'command', title: 'Commands', rows: commands,
            tip: 'A command hands over everything inside it. Manage is the one that carries pages -- all eight below, at once. Destructive names no surface: it gates the right to run an irreversible operation on any of them.' },
        { key: 'page', title: '/manage pages', rows: pages,
            tip: 'One surface each. Granted on their own, or inherited whole from Manage -- an inherited page cannot be switched off by itself.' },
    ];

    const cellFor = (a, sc) => {
        const g = a.grants[sc.key] || {};
        const pend = rowPending(a.discordId)[sc.key];
        const on = pend === undefined ? Boolean(g.direct || g.inherited) : pend;
        // 🔴 INHERITANCE IS COMPUTED FROM THE EFFECTIVE STATE, NOT THE SERVER'S. Staging `manage` used to light nothing below it -- the eight pages kept reading the server's `inherited`, which is false until the change is saved -- so the one relationship this grid exists to show was invisible at exactly the moment you were creating it. Harkirat, 2026-09-11 13:54 EDT.
        const rpAll = rowPending(a.discordId);
        const holdsManage = rpAll[CONFERRER] !== undefined
            ? rpAll[CONFERRER] : Boolean((a.grants[CONFERRER] || {}).direct);
        const inheritedOnly = pend === undefined && !g.direct && (g.inherited || (sc.kind === 'page' && holdsManage));
        const isOwner = Boolean(a.__owner);
        const cls = 'mxcell'
            + (on && !inheritedOnly ? ' on' : '')
            + (pend === undefined && inheritedOnly ? ' inh inherited' : '')
            ;
        const style = `--c:${accentOf(sc)};--ed:${editColor(a)}`
            + (inheritedOnly && conferrer ? `;--from:${accentOf(conferrer)}` : '');
        const what = g.direct ? 'granted directly'
            : g.inherited ? `inherited from ${conferrer ? conferrer.label.toLowerCase() : CONFERRER}`
            : 'not granted';
        const willBe = pend === true ? ' — pending: will be granted'
            : pend === false ? ' — pending: will be revoked' : '';
        if (isOwner) {
            return html`<td key=${a.discordId} class="mxc owncol"><span class=${cls} role="img" aria-checked="true" style=${style}
                aria-label=${`${sc.label}: held by the owner, not editable`}
                data-tip="The owner short-circuits every check"><i></i></span></td>`;
        }
        // 🔴 THE BUTTON FILLS THE CELL AND THE SWATCH IS INSIDE IT. A 16px control centred in a 38px row means
    // most of a cell is a miss, and the row was showing a pointer over all of it anyway -- `tbody tr` carries an unscoped `cursor:pointer` for the manifest tables, so every dead pixel here advertised a click it could not take. The <i> is the square; the button is the target. Harkirat, 2026-09-11 17:01 EDT.
    return html`<td key=${a.discordId} class=${'mxc' + (pend !== undefined ? ' staged' : '')} style=${`--ed:${editColor(a)}`}>
            <button class=${cls} style=${style}
                data-pend=${pend === undefined ? null : (pend ? 'on' : 'off')}
                role="checkbox" aria-checked=${on ? 'true' : 'false'}
                aria-label=${`${sc.label} for ${nameOf(a.discordId)}: ${what}${willBe}`}
                data-tip=${`${sc.label} — ${what}${willBe}`}
                onClick=${() => toggle(a, sc)}><i></i></button></td>`;
    };

    return html`
        <!-- ⚠️ NO PANEL AND NO HEADER OF ITS OWN. access.html draws ONE .ph — the Shell's view bar — carrying
             the title, the tabs, the key and a right-aligned meta line.
             ⚠️ NO BACKTICKS IN THIS COMMENT ON PURPOSE — it sits inside a template literal, where even a MATCHED
             pair closes and reopens the literal and the text between them is parsed as JavaScript. -->
        <div id="by-admin">
            ${people.length === 0 ? html`<p class="empty">Nobody has been granted access yet.</p>` : html`
                <div class="mxwrap">
                    <!-- 🔴 PERMISSIONS ARE ROWS AND PEOPLE ARE COLUMNS. Twelve scope names could not be carried
                         horizontally across a 53px column, and every fix for that — turning them, staggering them,
                         abbreviating them — was rejected in turn. The long axis was simply pointed the wrong way:
                         there are twelve permissions and a handful of people, so the permissions go down the page
                         where a name may be any length, and the two groups become labelled blocks of rows rather
                         than bands over columns. -->
                    <table class="mx">
                        <colgroup>
                            <col class="mxc-name" />
                            ${people.map((a) => html`<col key=${a.discordId} class="mxc-who" />`)}
                            <col class="mxc-held" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th class="mxc-name"><span class="mxs">Permission</span></th>
                                ${people.map((a) => {
                                    const isOwner = Boolean(a.__owner);
                                    const n = dirtyOf(a);
                                    const nv = titleOf(a);
                                    const u = who[a.discordId];
                                    // 🔴 THREE THINGS, IN THIS ORDER: the avatar, the Discord username, and the TITLE. Until 2026-09-11 the title (then called the label) was used as a FALLBACK for the name, so an account Discord had not resolved rendered its whole free-text label in the name slot -- untruncated, in a 110px column, touching both edges. The two are different facts and each now has its own line.
                                    const name = nameOf(a.discordId);
                                    const sub = isOwner ? 'owner' : (nv || (u ? `@${u.username}` : ''));
                                    return html`
                                        <th key=${a.discordId} data-who="y" class=${(isOwner ? 'owncol ' : '') + (n ? 'dirty ' : '') + (a.discordId === highlightId ? 'just-granted' : '')}
                                            style=${`--ed:${editColor(a)}`}>
                                            <button type="button" class="colh"
                                                    aria-label=${isOwner ? 'You — the owner' : `Open ${name}${nv ? `, ${nv},` : ''} in the admin drawer`}
                                                    onClick=${() => (isOwner ? null : onEdit(a))}>
                                                <span class=${'mxav' + (u && u.avatarUrl ? ' has' : '')} aria-hidden="true"
                                                      style=${u && u.avatarUrl ? `--av-src:url(${u.avatarUrl})` : ''}>${u && u.avatarUrl ? '' : name.slice(0, 1).toUpperCase()}</span>
                                                <b>${clip(name)}</b>
                                                <span class="clbl">${clip(sub)}</span>
                                            </button>
                                        </th>`;
                                })}
                                <th class="mxc-held"><span class="mxs">Held</span></th>
                            </tr>
                        </thead>
                        ${groups.map((g) => html`
                            <tbody key=${g.key} class="grp" data-grp=${g.key}>
                                <!-- The heading is a rule, a name and a figure. What the tier MEANS is on hover:
                                     a permanent sentence under every heading was two paragraphs of chrome on a
                                     grid, and the fact is needed once, not on every read. -->
                                <tr class="gh">
                                    <td colspan=${people.length + 2}>
                                        <div class="ghead">
                                            <h4 data-tip=${g.tip}>${g.title}</h4>
                                            <span class="fig">${g.rows.length}</span>
                                        </div>
                                    </td>
                                </tr>
                                ${g.rows.map((sc, ri) => html`
                                    <tr key=${sc.key} class="prow" data-last=${ri === g.rows.length - 1 ? "y" : null}>
                                        <td class="mxc-name">
                                            <span class="pname" style=${`--c:${accentOf(sc)}`}
                                                  data-tip=${g.key === 'command'
                                                      ? `${sc.label} — a command: it carries every function inside it${sc.key === CONFERRER ? ', including all ' + pages.length + ' /manage pages below' : ''}`
                                                      : `${sc.label} — one /manage page. Held on its own, or inherited whole from ${conferrer ? conferrer.label : CONFERRER}`}>
                                                <i></i><b>${sc.label}</b>
                                                ${sc.ownerOnly ? html`<em class="ownly-k" data-tip="Only the owner can grant this one"><${Icon} name="lock" cls="sm" label="owner-grantable only" /></em>` : null}
                                            </span>
                                        </td>
                                        ${people.map((a) => cellFor(a, sc))}
                                        <td class=${'mxc-held held' + (spofScopes.has(sc.key) ? ' spof' : '') + (holdersOf(sc) === 0 && !sc.ownerOnly ? ' zero' : '')}
                                            data-tip=${spofScopes.has(sc.key)
                                                ? 'Single point of failure — exactly one person besides you holds it'
                                                : `${holdersOf(sc)} hold it`}>${holdersOf(sc)}</td>
                                    </tr>`)}
                            </tbody>`)}
                    </table>
                </div>

                <!-- 🔴 ONE BAR PER ADMIN BEING EDITED, IN THAT ADMIN'S OWN COLOUR. The controls used to sit in an
                     Action column at the far end of the row, as far from the cells they commit as the table is wide.
                     A bar carries the person, every pending change as a chip, and Save and Discard built into its own
                     right end -- and two people edited at once are two bars in two colours, each committing only its
                     own. Harkirat's model, 2026-09-11 12:55 EDT. -->
                <div class="mxbars">
                    ${editing.map(({ a, i }) => {
                        const rp = rowPending(a.discordId);
                        const nv = titleOf(a);
                        const ndirty = noteDirty(a);
                        const n = dirtyOf(a);
                        return html`
                            <div key=${a.discordId} class="mxbar" style=${`--ed:${editColor(a)}`}>
                                <span class="who">
                                    <span class="mxav" aria-hidden="true">${(nv ? nv[0] : a.discordId.slice(-1)).toUpperCase()}</span>
                                    <span><b>${nameOf(a.discordId)}</b><em>${clip(nv) || 'no title'}</em></span>
                                </span>
                                <span class="chips">
                                    ${Object.entries(rp).map(([k, want]) => {
                                        const sc = scopes.find((s) => s.key === k) || { key: k, label: k };
                                        return html`<span key=${k} class=${'bchip' + (want ? '' : ' off')} style=${`--c:${accentOf(sc)}`}>
                                            <i></i><s>${want ? 'grant' : 'revoke'}</s>${sc.label}</span>`;
                                    })}
                                    ${ndirty ? html`<span class="bchip lbl"><s>label</s>${nv || 'cleared'}</span>` : null}
                                </span>
                                <span class="acts">
                                    <button class="go" onClick=${() => onSave(a, rp, ndirty ? nv : undefined, () => clearRow(a.discordId))}>
                                        Save ${n}</button>
                                    <button class="no" onClick=${() => clearRow(a.discordId)}>Discard</button>
                                </span>
                            </div>`;
                    })}
                </div>

                <div class="mxlegend-box">
                    <div class="lrow">
                        <span class="k"><span class="mxlegend on"></span>Filled</span>
                        <span>Granted <b>directly</b>.</span>
                    </div>
                    <div class="lrow">
                        <span class="k"><span class="mxlegend inh"></span>Ringed</span>
                        <span>Inherited — <b>the ring names the command it came from</b>, and only that command can take it back.</span>
                    </div>
                    <div class="lrow">
                        <span class="k">${(commands.slice(0, 3)).map((sc) => html`<span key=${sc.key} class="mxlegend sw" style=${`--c:${accentOf(sc)}`}></span>`)}Colour</span>
                        <span>Every permission has <b>its own</b>.</span>
                    </div>
                    <div class="lrow">
                        <span class="k"><${Icon} name="lock" cls="sm" />Owner only</span>
                        <span><b>Destructive</b> is the one the <code>all</code> shorthand never hands out.</span>
                    </div>
                </div>
            `}
        </div>
    `;
}

// By scope -- the inverse of the grid, and it answers a question the grid structurally cannot: "who can touch the calendar?" without reading across a row. Holders are derived from the SAME matrix rather than a second query, so the two views can never disagree about who holds what.
function ByScope({ matrix, spof, ownerId, nameOf }) {
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
                                ${holders.length ? holders.map((h) => html`<span class="holder" key=${h}>${nameOf(h)}</span>`)
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
    // 🔴 EVERY ID THE PAGE CAN PRINT, RESOLVED IN ONE PASS, ABOVE EVERY EARLY RETURN. The admins, whoever granted them, the owner and every live session -- one list, so the grid, the bars, the drawer, the sessions panel and every confirmation body are naming people from the same answer instead of each deciding for itself. It sits here because a hook cannot run after the `!load.data` return below.
    const ready = load.data && !failureOf(load.data) ? load.data : null;
    const idsOnPage = [...new Set([
        ...((ready && ready.matrix && ready.matrix.admins) || []).flatMap((a) => [a.discordId, a.grantedBy]),
        ...((ready && ready.sessions) || []).map((x) => x.discordId),
        session.discordId,
    ].filter(Boolean).map(String))];
    const who = useIdentities(idsOnPage);
    const nameOf = (id) => personName(who[id], id);
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
                    <li key=${s.sessionHash}>${nameOf(s.discordId)} · last seen ${relTime(s.lastSeenAt)}</li>`)}
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
            title: labelOnly ? `Rename ${nameOf(admin.discordId)}?` : `Change what ${nameOf(admin.discordId)} can do?`,
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
                    <b>${nameOf(discordId)}</b> is removed. They keep any portal session already open until you end it below,
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

    // ⚠️ `title` AND `note` ARE BOTH OPTIONAL ON THE WIRE AND THAT IS LOAD-BEARING. JSON.stringify drops an undefined value, and portal/api/access.js reads an absent key as "leave it alone" -- which is what lets the grid's own row Save post permissions without erasing a label it was never editing. Only the drawer, which owns both fields, sends them.
    async function grant(discordId, permissions, confirmText, note, title) {
        const body = await fetchJson('/api/access/grant', {
            method: 'POST', headers: { 'content-type': 'application/json', 'x-csrf-token': session.csrfToken },
            body: JSON.stringify({ discordId, permissions, confirmText, note, title }),
        });
        setNotice(body.ok ? '' : (body.reason || body.error || 'Grant failed'));
        refresh();
        return body;
    }

    // D1/pin32 delight — the drawer's own success path: close it, highlight the new row once, and say what happened. Kept separate from grant() itself because grant() is also the grid's own save path (confirmSave below), which already has its own "Permissions saved." toast and must not also close a drawer that was never open.
    async function handleGrant(discordId, permissions, confirmText, note, title) {
        const body = await grant(discordId, permissions, confirmText, note, title);
        if (!body || !body.ok) return;
        setShowGrant(false);
        setHighlightId(discordId);
        overlay.say(`Granted ${permissions.length} permission${permissions.length === 1 ? '' : 's'} to ${nameOf(discordId)}.`);
    }

    // The Edit drawer's success path. It posts through the same grant() as everything else — /api/access/grant REPLACES the row, which is exactly what an edit is — and says what changed rather than "saved", because the drawer can move permissions and the label in one act.
    async function handleEdit(discordId, permissions, confirmText, note, title) {
        const before = editAdmin;
        const body = await grant(discordId, permissions, confirmText, note, title);
        if (!body || !body.ok) return;
        setEditAdmin(null);
        setHighlightId(discordId);
        const moved = permissions.length - (before.permissions || []).length;
        const relabelled = (title || '') !== (before.title || before.note || '') || (note || '') !== (before.note || '');
        overlay.say(relabelled && !moved ? `Title is now “${title || 'untitled'}”.`
            : `${nameOf(discordId)} now holds ${permissions.length} permission${permissions.length === 1 ? '' : 's'}.`);
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
            ${spofSet.size ? html`<span class="l spofk" data-note><em class="mxn2" style="color:var(--warn);display:inline;margin:0 3px 0 0">1</em>in the Held column, amber — held by <b>one person</b> besides you</span>` : null}
            ${anyLock ? html`<span class="l" data-note><i style="background:none"><${Icon} name="lock" cls="sm" /></i>owner-grantable only</span>` : null}
        </span>`;

    // A session is "signed in now" if it was seen in the last 15 minutes -- the same rough threshold 06-access-and-analytics.html's own "2 signed in now" stat line implies. Not a stored flag: a browser session has no logout event unless someone clicks it, so recency is the only honest signal there is.
    const activeSessions = data.sessions.filter((s) => Date.now() - new Date(s.lastSeenAt).getTime() < 15 * 60000).length;

    // 🔴 THE RAIL'S STAGED COUNT REACHED TWO REALMS OF SEVEN. `badges` was passed by Home (home.js) and Season (season.js) only, so the one number the rail exists to carry — how much work is waiting — was absent on the five realms in between, including the two that stage on every edit. It is a property of the CHANGESET, so it is the TOTAL and not this realm's share; `Rail` omits it at zero, which is the "absent rather than zero" rule `shell.js:43` states. Unknown (a 403 on /api/review) reads as absent too, because a badge is not the surface that can say "you cannot see that". ⚠️ AS A `//` COMMENT ABOVE THE RETURN, NEVER AS `<!-- -->` INSIDE THE PROP LIST — the first version was the latter on all five realms and htm dropped every prop after it.
    return html`
        <${Shell} realm="access" session=${session} busy=${load.hostClass} view=${view} viewOptions=${['By admin', 'By permission']} onSetView=${setView}
                  ${''/* ⛔ NO realmKey. The view bar carried direct / inherited / the amber count / owner-grantable -- the same four marks the foot legend states better, a few hundred pixels above it. Two authorities for one fact is the defect this realm's own comments keep recording being fixed, and this pass added the second one without removing the first. */}
                  meta=${viewMeta}
                  badges=${{ review: data.stagedUnknown ? 0 : (data.stagedOps || []).length }}
                  stagedOps=${data.stagedUnknown ? null : data.stagedOps}
                  exports=${exportScopes} exportLabel="Export" overlayFor=${overlay}
                  overlaySlot=${html`${overlay.render()}${showGrant ? html`<${GrantForm} onGrant=${handleGrant} scopes=${matrix.scopes} nameOf=${nameOf} onCancel=${() => setShowGrant(false)} />` : null}${editAdmin ? html`<${GrantForm} admin=${editAdmin} onRevoke=${confirmRevoke} onGrant=${handleEdit} scopes=${matrix.scopes} nameOf=${nameOf} onCancel=${() => setEditAdmin(null)} />` : null}`}
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
                          The owner is <b>${nameOf(session.discordId)}</b> and holds everything
                          regardless of this list.
                      </div></div></div>`}
                  footSlot=${html`<${Sessions} sessions=${data.sessions || []} onEnd=${confirmEndSessions} nameOf=${nameOf} ttlHours=${data.sessionTtlHours ?? 12} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      ${view === 'By admin'
                          ? html`<${ByAdmin} matrix=${matrix} spof=${data.singlePointsOfFailure}
                                             onRevoke=${confirmRevoke} onSave=${confirmSave} onEdit=${setEditAdmin}
                                             highlightId=${highlightId}
                                             onExplain=${explainInherited} who=${who} nameOf=${nameOf} isOwnerId=${session.discordId} />`
                          : html`<${ByScope} matrix=${matrix} spof=${data.singlePointsOfFailure} nameOf=${nameOf} ownerId=${session.discordId} />`}
                  `} />
    `;
}
