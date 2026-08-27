// portal/ui/broadcast.js — ESM. The Broadcast realm: Now showing + Airtime + a Post form + inline edit + bulk actions, reusing <Shell>/<Manifest> unchanged.
//
// buildBroadcastAddOp/buildBroadcastEditOp come from broadcast.logic.js, loaded as a plain CLASSIC <script> before this module -- see track.js's header comment for why a literal ESM import of a .logic.js sibling would fail in a real browser (found live in season.js's own prior version).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead, MastheadNew } from './shell.js';
import { DiscordCard } from './v2Render.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { downloadText } from './download.js';
import { useAsync, RealmShell } from './async.js';
import { stageOps } from './composeClient.js';
import { useOverlay } from './overlay.js';

const fmtDay = (v) => new Date(v).toDateString().slice(4);

const BROADCAST_COLUMNS = [
    // ⚠️ THE MARK RIDES INSIDE THE NAME CELL. Built first as a column of its own, which gave the table a headerless 38px strip of mostly-empty dots — and the mockup puts it in the name cell, beside the thing it qualifies, for the same reason Season's outlives-the-season mark rides beside the state.
    { key: 'text', label: 'Announcement', editable: true,
      render: (r) => html`<span class=${'sev ' + (r.state === 'live' && !r.expiresAt ? 'warn' : '')}></span>${r.text}` },
    { key: 'createdAt', label: 'Posted', dataKind: 'date', render: (r) => fmtDay(r.createdAt) },
    // startsAt has been schema-declared and settable since 2026-08-21 and no surface has ever shown it. Without this column a scheduled announcement is indistinguishable from a live one in the table, which is exactly the confusion the field was added to remove.
    { key: 'startsAt', label: 'Starts', col: 'c-type', dataKind: 'date', render: (r) => (r.startsAt ? fmtDay(r.startsAt) : html`<span class="none">immediately</span>`) },
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

// Now showing -- the live set in the order Discord delivers it.
//
// 🔴 REBUILT ON THE ADOPTED DESIGN, AND THE OLD MARKUP HAD NO STYLING AT ALL. `.slot`, `.sl`, `.tx` and `.mt` were defined in a portal-authored stylesheet that adopting the mockup's app.css deleted, so this panel had been rendering four spans with no rules — three lines of run-on text where the design specifies a card per announcement. It looked like a copy defect and was a missing stylesheet.
//
// ⚠️ SLOT n DESCRIBES DELIVERY POSITION, NOT A STORED FIELD. models/Announcement.js has no ordering column and the design spec §8.2 flags that adding one would be a schema change to file rather than assume, so the order here is createdAt and nothing in the label implies otherwise.
//
// 🔴 AND THE CAP IS THE FACT THIS PANEL EXISTS TO SHOW. Discord sends at most MAX_EMBEDS_PER_MESSAGE embeds in one message and utils/announcement.js slices the unseen list by exactly that, so a live announcement past the cap is not showing — it is WAITING, and nothing anywhere told anyone. The number is sent by the route rather than written here, because a second copy of a limit is a copy only one of the two would notice changing. 🔴 THE PANEL SAID WHAT IS LIVE AND NEVER WHAT IT LOOKS LIKE. Broadcast is the one realm whose output a player reads verbatim, and the only way to see the delivered result was to run the bot — so the accent colour, the order and the cap were three separate facts on screen and the thing they add up to was nowhere.
//
// ⚠️ IT PREVIEWS THE MESSAGE, NOT THE RECORDS. Anything past the cap is absent here rather than greyed out, because a player does not see a faded row — they see nothing, and that is the whole point the racknote beside it is making.
function DeliveryPreview({ live, cap }) {
    const shown = cap ? live.slice(0, cap) : live;
    return html`
        <aside class="nprev" aria-label="What a player receives">
            <h5>What a player receives</h5>
            ${shown.length ? shown.map((a, i) => html`
                <${DiscordCard} key=${a._id} accent=${accentOf(a)} title=${a.text}
                                sub=${`embed ${i + 1} of ${shown.length}`}
                                rows=${[['Ends', a.expiresAt ? fmtDay(a.expiresAt) : 'never']]} />`)
            : html`<div class="idop"><b>nothing attached</b></div>`}
            <p class="pnote">
                ${shown.length
                    ? html`${shown.length} embed${shown.length === 1 ? '' : 's'}, in this order, on the player's next
                        reply. The stripe is each announcement's own accent colour.`
                    : html`Replies go out with no announcement attached at all.`}
            </p>
        </aside>`;
}

function NowShowing({ live, counts, cap }) {
    return html`
        <div class="panel" id="now-showing">
            <div class="ph">
                <span class="t">Now showing</span>
                <span class="rt">${counts.live} live · ${counts.scheduled} scheduled · ${counts.forever} never expires</span>
            </div>
            <div class="nowwrap">
            <div>
            ${live.length === 0
                ? html`<div class="nstack"><div class="nsempty">Nothing is showing right now. Players get no announcement
                    message at all. Anything scheduled for later is in Airtime.</div></div>`
                : html`<div class="nstack" role="list" aria-label="Announcements in delivery order">
                    ${live.map((a, i) => {
                        const days = Math.round((Date.now() - new Date(a.createdAt).getTime()) / 86400000);
                        const waiting = cap ? i >= cap : false;
                        return html`
                            <div class=${'nscard' + (i === 0 ? ' p0' : '') + (waiting ? ' over' : '')}
                                 key=${a._id} role="listitem" style=${`--c:${accentOf(a)}`}
                                 aria-label=${`Delivery position ${i + 1}${waiting ? `, beyond the ${cap}-message cap` : ''}`}>
                                <span class="np">${i + 1}</span>
                                <span class="nsb">
                                    <span class="nt">${a.text}</span>
                                    <span class="nd">up ${days} ${days === 1 ? 'day' : 'days'}</span>
                                </span>
                                <span class="nsmeta">
                                    ${a.expiresAt
                                        ? html`<span class="nschan">ends ${fmtDay(a.expiresAt)}</span>`
                                        : html`<span class="nspin warn">never ends</span>`}
                                    ${waiting ? html`<span class="nspin warn">waits</span>` : null}
                                </span>
                            </div>`;
                    })}
                </div>
                ${cap && live.length > cap ? (() => {
                    const n = live.length - cap;
                    return html`
                        <p class="racknote">Discord sends at most <b>${cap}</b> announcements in one message.
                            The ${n === 1 ? 'one' : n} below that line ${n === 1 ? 'is' : 'are'} live and <b>not being shown</b> —
                            ${n === 1 ? 'it waits' : 'they wait'} until something above ${n === 1 ? 'it' : 'them'} ends.</p>`;
                })() : null}`}
            </div>
            <${DeliveryPreview} live=${live} cap=${cap} />
            </div>
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

// Mirrors /manage's real post-announcement modal (text/expiry) plus startsAt (new field, this task -- core/ops/announcements.js's own header explains why it's a real admin date, unlike expiry which is a day-count). A blank expiry means the server's own 60-day default; a blank start means "shows immediately" -- both sent as null rather than guessed at client-side. ⚠️ A BLANK FIELD HERE IS A REAL VALUE, TWICE OVER, and neither said so on screen: a blank expiry takes the server's 60-day default rather than never expiring, and a blank start means the announcement is live the moment it commits. Both facts were in this file's own header comment, which nobody using the form can read.
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
            <p class="chint" style="margin:12px 14px 0">Every live announcement is attached to the bot's next reply to a
                player, in the order it was written — so this is not a broadcast to a channel, it is a note added to
                whatever they were already doing.</p>
            <!-- 🔴 THREE CONTROLS WITH THEIR LAYOUT WRITTEN INTO THE JSX AND THEIR LABELS HIDDEN. This is
                 the last form in the portal still doing both — the build editor and the grant form are both
                 on the sheet own dwfield class now — and the hidden labels carried the two facts that decide
                 what this form DOES: a blank start means live on commit, a blank expiry means sixty days,
                 not never. Neither was visible to anyone filling it in. -->
            <div style="padding:12px 14px">
                <label class="dwfield" for="post-text"><span>Announcement text <i>players read this verbatim</i></span>
                    <textarea id="post-text" value=${text} onInput=${(e) => setText(e.target.value)} rows="3"></textarea></label>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap;padding:0 14px 12px;align-items:flex-end">
                <label class="dwfield" for="post-starts"><span>Starts <i>blank shows it the moment you commit</i></span>
                    <input id="post-starts" type="date" value=${startsAt} onInput=${(e) => setStartsAt(e.target.value)} /></label>
                <label class="dwfield" for="post-expires"><span>Ends <i>blank takes the server's 60-day default, not never</i></span>
                    <input id="post-expires" type="date" value=${expiresAt} onInput=${(e) => setExpiresAt(e.target.value)} /></label>
                <button class="accent-fill" disabled=${!ready} onClick=${submit}>Stage</button>
                <button onClick=${onCancel}>Cancel</button>
            </div>
        </div>
    `;
}

export function BroadcastRealm({ session }) {
    const [showAdd, setShowAdd] = useState(false);
    const [notice, setNotice] = useState('');
    const [view, setView] = useState('Now showing');
    const overlay = useOverlay();

// 🔴 TWO REALMS COULD STAGE WORK AND NEITHER COULD TELL YOU IT HAD ANY. Season and Home both read /api/review to say how much is waiting — that is what feeds the rail's badge and the masthead's staged figure — and Armory and Broadcast, which stage on every edit, said nothing anywhere. You staged four builds, navigated away, and the console had no memory of it outside the Review screen.
//
// ⚠️ ONE REQUEST, IN THE SAME useAsync, so the realm still has ONE loading phase. A second hook would give the page two independent phases and a screen that is half skeleton and half table, which reads as a rendering bug rather than as loading.
    const load = useAsync(() => Promise.all([fetchJson('/api/broadcast'), fetchJson('/api/review')])
        .then(([broadcast, review]) => ({ ...broadcast, stagedOps: (review && review.ops) || [],
                                          stagedUnknown: Boolean(review && (review.forbidden || review.failed)) })), []);
    const refresh = load.reload;
    const data = load.data;

    if (!data) return html`<${RealmShell} realm="broadcast" session=${session} error=${load.error} slow=${load.slow}
                                          onRetry=${load.reload} skeleton=${{ rows: 6, lines: [34, 20, 26, 12] }} />`;

    // Same missing-id gap as Armory: /api/broadcast never mapped _id -> id, so nothing selectable or editable on this Manifest actually worked before this mapping existed. `state` is computed SERVER-SIDE (portal/api/broadcast.js's announcementState) and passed straight through -- see that function's header for why it is not re-derived here.
    const rows = data.all.map((a) => ({ ...a, id: a._id, accentHex: accentOf(a) }));
    // 🔴 A FIGURE THAT CANNOT BE KNOWN MUST NOT READ AS ZERO. /api/review is forbidden to an admin who does not hold the review realm, and fetchJson answers a 403 with `{forbidden:true}` — so `(ops || [])` yielded `[]` and the masthead told a delegated admin "0 staged" when the honest answer is "you cannot see that". A console whose whole permission model exists to distinguish those two rendered them identically. `null` reaches the Masthead as an em dash, which is the portal's own absent-value voice.
    const stagedHere = data.stagedUnknown ? null
        : (data.stagedOps || []).filter((o) => (o.realm || 'season') === 'broadcast').length;
    const counts = {
        live: data.all.filter((a) => a.state === 'live').length,
        scheduled: data.all.filter((a) => a.state === 'scheduled').length,
        forever: data.all.filter((a) => a.state === 'live' && !a.expiresAt).length,
    };

    async function handleAdd(op) {
        await stageOps('broadcast', [op], session.csrfToken);
        setShowAdd(false);
        overlay.say('Announcement staged. Nothing reaches a player until you commit it.', 'Review', () => { location.hash = '#/review'; });
        refresh();
    }

    // No bulk-delete op exists for announcements (unlike loadouts' loadout.bulkDelete) -- one announcement.delete per selected id, in a single changeset, which is exactly what a multi-op changeset is for.
    async function handleBulkDelete(ids) {
        const ops = ids.map((id) => ({ type: 'announcement.delete', target: { id }, payload: {} }));
        if (ops.length) await stageOps('broadcast', ops, session.csrfToken);
        overlay.say(`${ids.length} deletion${ids.length === 1 ? '' : 's'} staged.`, 'Review', () => { location.hash = '#/review'; });
        refresh();
    }

    // A live announcement is the one thing in this portal a player is looking at RIGHT NOW, so the confirmation says which of the selected ones are live rather than treating the set as uniform.
    function confirmBulkDelete(ids) {
        const chosen = rows.filter((r) => ids.includes(r.id));
        const live = chosen.filter((r) => r.state === 'live').length;
        overlay.confirm({
            op: 'announcement.delete', tier: 2, danger: true, confirmLabel: 'Stage deletion',
            title: `Stage deletion of ${ids.length} announcement${ids.length === 1 ? '' : 's'}?`,
            body: html`
                <p class="dw-p">${live
                    ? html`<b>${live} of these ${live === 1 ? 'is' : 'are'} showing to players right now.</b> `
                    : null}Nothing changes yet — this stages the deletion, and the announcements keep showing until
                    the changeset is committed on the Review screen.</p>
                <ul class="dw-l">${chosen.slice(0, 6).map((r) => html`
                    <li key=${r.id}>${r.text.slice(0, 64)}${r.text.length > 64 ? '…' : ''}</li>`)}
                    ${ids.length > 6 ? html`<li>…and ${ids.length - 6} more</li>` : null}</ul>`,
            onConfirm: () => handleBulkDelete(ids),
        });
    }

    // 🔴 THE THIRD DEAD EXPORT BUTTON ON THIS BRANCH, and the first one nobody went looking for — `scripts/portalExport.test.js`'s source scan found it after the same defect was fixed by hand in Season and Armory. `open('data:…')` is blocked as a top-level navigation: it returns null, throws nothing, and the page does not change, so the button ran and produced no file. It writes a real one now, as TSV, because an announcement has no bulk-add format to round-trip through and a caption pretending otherwise is the other half of the same defect.
    function handleExportSelection(ids) {
        const selected = rows.filter((r) => ids.includes(r.id));
        const header = ['Text', 'State', 'Starts', 'Expires'].join('\t');
        const body = selected.map((r) => [String(r.text || '').replace(/\s+/g, ' '), r.state || '',
            r.startsAt ? new Date(r.startsAt).toISOString().slice(0, 10) : '',
            r.expiresAt ? new Date(r.expiresAt).toISOString().slice(0, 10) : 'never'].join('\t')).join('\n');
        downloadText(`dioreo-announcements-${new Date().toISOString().slice(0, 10)}.tsv`,
            `${header}\n${body}`, 'text/tab-separated-values;charset=utf-8');
    }

    return html`
        <${Shell} realm="broadcast" session=${session} view=${view} viewOptions=${['Now showing', 'Airtime']} onSetView=${setView}
                  overlaySlot=${overlay.render()}
                  commands=${[
                      { label: 'Post an announcement', group: 'broadcast', local: true, accent: 'var(--r-broadcast)',
                        keywords: ['new', 'write', 'say', 'announce'], run: () => setShowAdd(true) },
                  ]}
                  masthead=${html`<${Masthead} title="Broadcast" sub="One text field, delivered once per player, in the order it was written — and the two things Discord never shows you: what has not started yet, and what will never stop."
                                               stats=${[
                                                   { value: counts.live, label: 'live', lead: true, accent: 'var(--r-broadcast)' },
                                                   { value: counts.scheduled, label: 'scheduled' },
                                                   { value: counts.forever, label: 'never expires', tone: counts.forever ? 'bad' : undefined },
                                                   { value: stagedHere === null ? '—' : stagedHere, label: 'staged', tone: stagedHere ? 'stg' : undefined },
                                               ]}
                                               actions=${html`<${MastheadNew} label="New announcement" hint="a"
                                                                              tip="Write an announcement"
                                                                              onClick=${() => setShowAdd(true)} />`} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      ${showAdd ? html`<${PostForm} onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)} />` : null}
                      ${view === 'Now showing' ? html`<${NowShowing} live=${data.live} counts=${counts} cap=${data.maxPerMessage} />` : html`<${Airtime} all=${data.all} />`}
                      <${HeadsUp} all=${data.all} />
                  `}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${BROADCAST_COLUMNS} searchableFields=${['text']}
                                                    title="Every announcement" filterGroups=${BROADCAST_FILTERS}
                                                    bulkNote="Reversible — a staged deletion is discarded, never undone"
                                                    bulkTier=${2} rowNoun=${['announcement', 'announcements']}
                                                    onRemove=${(row) => confirmBulkDelete([row.id])} removeLabel="Stage deletion"
                                                    emptyText="Nothing has been announced yet." 
                                                    onAdd=${() => setShowAdd(true)} realm="broadcast" csrfToken=${session.csrfToken}
                                                    buildEditOp=${buildBroadcastEditOp}
                                                    onEditError=${(msg) => setNotice(msg)}
                                                    bulkActions=${[
                                                        { label: 'Export selection', onClick: handleExportSelection },
                                                        { label: 'Stage deletion', danger: true, onClick: confirmBulkDelete },
                                                    ]} />`} />
    `;
}
