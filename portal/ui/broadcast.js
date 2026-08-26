// portal/ui/broadcast.js — ESM. The Broadcast realm: Now showing + Airtime + a Post form + inline edit + bulk actions, reusing <Shell>/<Manifest> unchanged.
//
// buildBroadcastAddOp/buildBroadcastEditOp come from broadcast.logic.js, loaded as a plain CLASSIC <script> before this module -- see track.js's header comment for why a literal ESM import of a .logic.js sibling would fail in a real browser (found live in season.js's own prior version).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { stageOps } from './composeClient.js';

const fmtDay = (v) => new Date(v).toDateString().slice(4);

const BROADCAST_COLUMNS = [
    { key: 'text', label: 'Announcement', editable: true },
    { key: 'createdAt', label: 'Posted', dataKind: 'date', render: (r) => fmtDay(r.createdAt) },
    // startsAt has been schema-declared and settable since 2026-08-21 and no surface has ever shown it. Without this column a scheduled announcement is indistinguishable from a live one in the table, which is exactly the confusion the field was added to remove.
    { key: 'startsAt', label: 'Starts', dataKind: 'date', render: (r) => (r.startsAt ? fmtDay(r.startsAt) : 'immediately') },
    // "never" is the finding, not a neutral value: 05-door-broadcast-ops.html's own callout is about an announcement that has been up 19 days because nobody set an end date. It is coloured as the warning it is, and the callout below states it in words for anyone who cannot see the colour.
    { key: 'expiresAt', label: 'Ends', dataKind: 'date', render: (r) => (r.expiresAt ? fmtDay(r.expiresAt) : html`<span style="color:var(--warn)">never</span>`) },
    { key: 'state', label: 'State' },
];

const BROADCAST_FILTERS = [
    { key: 'state', label: 'State', options: [
        { value: 'live', label: 'live' }, { value: 'scheduled', label: 'scheduled' }, { value: 'expired', label: 'expired' },
    ] },
];

// The topic accent for an announcement is its OWN stored colour (models/Announcement.js's `color`, generated once at creation and never regenerated on edit), so the portal's dot matches the embed Discord actually renders rather than inventing a second palette. ⚠️ NEVER RETURNS NULL. models/Announcement.js makes `color` required, but a document written before that field existed -- or any future partial -- would leave --topic-accent unset, and the rules that consume it pair a fill with #000 ink. --patch is the safe floor (12.53:1 under #000).
const accentOf = (a) => (typeof a.color === 'number' ? '#' + a.color.toString(16).padStart(6, '0') : 'var(--patch)');

// Now showing -- the live set in the order Discord delivers it. ⚠️ SLOT n DESCRIBES DELIVERY POSITION, NOT A STORED FIELD. models/Announcement.js has no ordering column and the design spec §8.2 explicitly flags that adding one would be a schema change to file rather than assume, so the order here is createdAt and the label says nothing that implies otherwise.
function NowShowing({ live, counts }) {
    return html`
        <div class="panel" id="now-showing">
            <div class="ph">
                <span class="t">Now showing</span>
                <span class="rt">${counts.live} live · ${counts.scheduled} scheduled · ${counts.forever} never expires</span>
            </div>
            ${live.length === 0
                ? html`<p class="empty">Nothing is showing right now. Anything scheduled for later is in Airtime.</p>`
                : html`<div class="slots">
                    ${live.map((a, i) => {
                        const days = Math.round((Date.now() - new Date(a.createdAt).getTime()) / 86400000);
                        return html`
                            <div class="slot" style=${accentOf(a) ? `--topic-accent:${accentOf(a)}` : null}>
                                <span class="sl">SLOT ${i + 1}${i === 0 ? ' — TOP' : ''}</span>
                                <span class="tx">${a.text}</span>
                                <span class="mt">
                                    up ${days}d ·
                                    ${a.expiresAt ? ` ends ${fmtDay(a.expiresAt)}` : html` <span class="warn">no expiry</span>`}
                                </span>
                            </div>
                        `;
                    })}
                </div>`}
        </div>
    `;
}

// Airtime -- a REAL time axis, which is the entire point of the view. Spec §8.2: "Airtime puts every announcement on a time axis, which is how 'this has been up for nineteen days with no expiry' becomes visible instead of forgotten." It shipped as a truncated text list with a parenthetical, which forgets it just as thoroughly as the table did.
//
// barGeometry comes from track.logic.js (a bare global, same classic-script mechanism as everywhere else here) rather than a second copy of the same clamping arithmetic.
function airtimeWindow(all, now) {
    const stamps = [now, now + 7 * 86400000];
    for (const a of all) {
        for (const v of [a.createdAt, a.startsAt, a.expiresAt]) {
            const t = v ? new Date(v).getTime() : NaN;
            if (Number.isFinite(t)) stamps.push(t);
        }
    }
    const lo = Math.min(...stamps);
    let hi = Math.max(...stamps);
    if (hi - lo < 14 * 86400000) hi = lo + 14 * 86400000;
    return { start: new Date(lo).toISOString().slice(0, 10), end: new Date(hi).toISOString().slice(0, 10) };
}

function Airtime({ all }) {
    const now = Date.now();
    const window = airtimeWindow(all, now);
    const lo = new Date(window.start).getTime(), hi = new Date(window.end).getTime();
    const pct = (d) => Math.max(0, Math.min(100, ((new Date(d).getTime() - lo) / Math.max(1, hi - lo)) * 100));

    // 🔴 THE RAIL IS A SHARED COMPONENT, AND THIS MARKUP IS THE CONTRACT FOR IT. `.tk-wrap` is what portal/ui/rail.css scopes on — not `#airtime`, and not the Season Track's id. Airtime draws the same object the Track does (lanes, bars, a ruler, a now-line), and it used to get that for free by sharing global class names with whatever the Track's stylesheet happened to define. That is exactly what broke when track.css was first scoped to `#track`: bars fell to position:static, lanes collapsed to 30px and the two ruler dates printed on top of each other. Rendering the wrapper is what earns the styles now.
    return html`
        <div class="panel" id="airtime">
            <div class="ph">
                <span class="t">Airtime</span>
                <span class="rt">${TL.fmt(window.start)} → ${TL.fmt(window.end)}</span>
            </div>
            ${all.length === 0 ? html`<p class="empty">No announcements have ever been posted.</p>` : html`
                <div class="tk-wrap"><div class="tk-inner">
                    <div class="ruler">
                        <span style="left:0%"><b>${TL.fmt(window.start)}</b></span>
                        <span style="left:100%;transform:translateX(-100%)"><b>${TL.fmt(window.end)}</b></span>
                    </div>
                    <div class="lanes">
                        ${all.slice().sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))).map((a) => {
                            const startAt = a.startsAt || a.createdAt;
                            const forever = !a.expiresAt;
                            const l = pct(startAt);
                            const r = forever ? 100 : pct(a.expiresAt);
                            // Shape carries state, exactly as it does on the Track: a solid fill is live, hollow-dashed is scheduled, muted is over. "No expiry" additionally has NO RIGHT EDGE — it fades past the window rather than stopping, because a bar that stops reads as an end date and that is the precise misreading this whole view exists to prevent.
                            const cls = 'bar ' + (a.state === 'scheduled' ? 'staged' : a.state === 'expired' ? 'ended' : 'saved')
                                + (forever && a.state === 'live' ? ' forever' : '');
                            const accent = accentOf(a);
                            const label = a.state === 'scheduled' ? 'starts ' + TL.fmt(String(startAt).slice(0, 10))
                                : forever && a.state === 'live' ? 'no expiry →' : '';
                            return html`
                                <div class="lane" key=${a._id} style=${accent ? `--c:${accent}` : ''}>
                                    <span class="nm" title=${a.text}>${a.text.slice(0, 22)}${a.text.length > 22 ? '…' : ''}</span>
                                    <div class="tk">
                                        <div class=${cls} style=${`left:${l}%;width:${Math.max(1.2, r - l)}%`
                                            + (accent ? `;--c:${accent}` : '')} title=${a.text}
                                             aria-label=${`${a.text.slice(0, 40)}, ${a.state}${forever ? ', no end date' : ''}`}>
                                            <span class="bl">${label}</span>
                                        </div>
                                    </div>
                                </div>`;
                        })}
                        <div class="ov"><div class="now" style=${`left:${pct(now)}%`}></div></div>
                    </div>
                </div></div>
                <p class="racknote">A bar begins at <code>startsAt</code> when one is set, otherwise at the <code>createdAt</code> timestamp. A bar with <b>no right edge</b> has <b>no end date at all</b> and runs until somebody deletes it — nothing expires it and nothing reminds you.</p>
            `}
        </div>
    `;
}

// The proactive data-quality callout from 05-door-broadcast-ops.html. It names the specific announcement and the specific number rather than warning in the abstract -- an "announcements can stay up forever" notice teaches nothing, "this one has been up 19 days" is actionable.
function HeadsUp({ all }) {
    const forever = all.filter((a) => a.state === 'live' && !a.expiresAt)
        .map((a) => ({ ...a, days: Math.round((Date.now() - new Date(a.createdAt).getTime()) / 86400000) }))
        .sort((a, b) => b.days - a.days);
    if (!forever.length) return null;
    const worst = forever[0];
    return html`
        <div class="panel"><div class="callout">
            <b>Heads up:</b>
            “${worst.text.slice(0, 60)}${worst.text.length > 60 ? '…' : ''}” has no expiry and has been showing for ${worst.days} days.
            ${forever.length > 1 ? ` ${forever.length - 1} other announcement${forever.length === 2 ? '' : 's'} also never ends.` : ''}
            ${' '}Announcements without an end date stay up forever.
        </div></div>
    `;
}

// Mirrors /manage's real post-announcement modal (text/expiry) plus startsAt (new field, this task -- core/ops/announcements.js's own header explains why it's a real admin date, unlike expiry which is a day-count). A blank expiry means the server's own 60-day default; a blank start means "shows immediately" -- both sent as null rather than guessed at client-side.
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
    const [view, setView] = useState('Now showing');

    function refresh() { fetchJson('/api/broadcast').then(setData); }
    useEffect(refresh, []);

    if (data.signedOut || data.forbidden) return html`<${NoAccess} />`;

    // Same missing-id gap as Armory: /api/broadcast never mapped _id -> id, so nothing selectable or editable on this Manifest actually worked before this mapping existed. `state` is computed SERVER-SIDE (portal/api/broadcast.js's announcementState) and passed straight through -- see that function's header for why it is not re-derived here.
    const rows = data.all.map((a) => ({ ...a, id: a._id, accentHex: accentOf(a) }));
    const counts = {
        live: data.all.filter((a) => a.state === 'live').length,
        scheduled: data.all.filter((a) => a.state === 'scheduled').length,
        forever: data.all.filter((a) => a.state === 'live' && !a.expiresAt).length,
    };

    async function handleAdd(op) {
        await stageOps('broadcast', [op], session.csrfToken);
        setShowAdd(false);
        refresh();
    }

    // No bulk-delete op exists for announcements (unlike loadouts' loadout.bulkDelete) -- one announcement.delete per selected id, in a single changeset, which is exactly what a multi-op changeset is for.
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
        <${Shell} realm="broadcast" session=${session} view=${view} viewOptions=${['Now showing', 'Airtime']} onSetView=${setView}
                  masthead=${html`<${Masthead} title="Broadcast" sub="what is showing, in what order, until when"
                                               stats=${[
                                                   { value: counts.live, label: 'live' },
                                                   { value: counts.scheduled, label: 'scheduled' },
                                                   { value: counts.forever, label: 'never expires', tone: counts.forever ? 'bad' : undefined },
                                               ]} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      ${showAdd ? html`<${PostForm} onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)} />` : null}
                      ${view === 'Now showing' ? html`<${NowShowing} live=${data.live} counts=${counts} />` : html`<${Airtime} all=${data.all} />`}
                      <${HeadsUp} all=${data.all} />
                  `}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${BROADCAST_COLUMNS} searchableFields=${['text']}
                                                    title="Every announcement" filterGroups=${BROADCAST_FILTERS}
                                                    bulkNote="Destructive actions stage — they never fire from here."
                                                    emptyText="Nothing has been announced yet." 
                                                    onAdd=${() => setShowAdd(true)} realm="broadcast" csrfToken=${session.csrfToken}
                                                    buildEditOp=${buildBroadcastEditOp}
                                                    onEditError=${(msg) => setNotice(msg)}
                                                    bulkActions=${[
                                                        { label: 'Export selection', onClick: handleExportSelection },
                                                        { label: 'Stage deletion', danger: true, onClick: handleBulkDelete },
                                                    ]} />`} />
    `;
}
