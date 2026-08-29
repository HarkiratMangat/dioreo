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

// 🔴 NO YEAR. toDateString().slice(4) yields "Aug 14 2026"; the design prints "Aug 14" and so does every other date on this page. Four columns wide, on every row, the year is the same digit repeated 16 times and it pushed the whole table's columns out of register against the design. No year and no leading zero: the design prints "Aug 4", toDateString gives "Aug 04 2026".
const fmtDay = (v) => new Date(v).toDateString().slice(4, 10).trim().replace(/ 0(\d)$/, ' $1');

const BROADCAST_COLUMNS = [
    // ⚠️ THE MARK RIDES INSIDE THE NAME CELL. Built first as a column of its own, which gave the table a headerless 38px strip of mostly-empty dots — and the mockup puts it in the name cell, beside the thing it qualifies, for the same reason Season's outlives-the-season mark rides beside the state. ownDot: this column draws `.sev` itself — the design's ONE swatch, which is a severity mark rather than a topic dot. Without the flag the row carried both, and the extra 17px wrapped a 46-character title onto a second line on every long row.
    { key: 'text', label: 'Announcement', editable: true,
      dotClass: (r) => 'sev' + (r.state === 'live' && !r.expiresAt ? ' warn' : ''),
      dotStyle: (r) => `background:${accentOf(r)}`,
      // The design truncates at 46 and puts the age under the title as row meta. Left whole, a long announcement wrapped to three lines and made its row 23px taller than the design's — four rows of that is the last of the height difference between the two pages.
      render: (r) => html`<b>${String(r.text || '').replace(/^#{1,3}\s+/, '').slice(0, 46)}</b>`,
      meta: (r) => `up ${daysBetween(r.createdAt, Date.now())}d` },
    // ⚠️ `col` AND `dataKind` ARE TWO DIFFERENT DECISIONS and the colgroup only reads the first. dataKind names
// the CELL (tabular figures here); col names the COLUMN WIDTH. Switching these to nums for the cell silently dropped them out of the c-win width class, and Posted went from the design's 100px to 284 — every date in the table then sat under a different heading than the design's.
{ key: 'createdAt', label: 'Posted', col: 'c-type', dataKind: 'date', render: (r) => fmtDay(r.createdAt) },
    // startsAt has been schema-declared and settable since 2026-08-21 and no surface has ever shown it. Without this column a scheduled announcement is indistinguishable from a live one in the table, which is exactly the confusion the field was added to remove.
    { key: 'startsAt', label: 'Starts', col: 'c-win', dataKind: 'nums', render: (r) => (r.startsAt ? fmtDay(r.startsAt) : html`<span class="none">immediately</span>`) },
    // "never" is the finding, not a neutral value: 05-door-broadcast-ops.html's own callout is about an announcement that has been up 19 days because nobody set an end date. It is coloured as the warning it is, and the callout below states it in words for anyone who cannot see the colour.
    { key: 'expiresAt', label: 'Ends', dataKind: 'nums', render: (r) => (r.expiresAt ? fmtDay(r.expiresAt) : html`<span style="color:var(--warn)">never</span>`) },
    // TWO AXES, as the design draws them: the STAGING state is the chip (saved / staged) and the CONTENT lifecycle is the meta beside it. One word in one cell answered only half the question — a reader could not tell an announcement that is written-and-over from one that is staged-and-not-yet-real.
    { key: 'state', label: 'State', dataKind: 'right',
      render: (r) => html`<span class=${'stt ' + (r.state === 'staged' ? 'staged' : 'saved')}>${r.state === 'staged' ? 'STAGED' : 'SAVED'}</span>
          <span class="rowmeta" style="margin-left:6px">${({ live: 'LIVE NOW', scheduled: 'UPCOMING', expired: 'ENDED' })[r.state] || String(r.state || '').toUpperCase()}</span>` },
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
// ⚠️ IT PREVIEWS THE MESSAGE, NOT THE RECORDS. Anything past the cap is absent here rather than greyed out, because a player does not see a faded row — they see nothing, and that is the whole point the racknote beside it is making. The preview's second line is WHEN IT WENT OUT, not which embed you are looking at. "embed 1 of 2" is a fact about the list you can already see; "19 days ago" is the one thing the card cannot tell you and the reason a reader is looking at it. The design's own rows are Posted and Ends. 🔴 THE BOT RENDERS THE RAW TEXT, AND A LEADING "# …" LINE IS THE ONLY HEADING THERE IS. The preview passed the whole announcement as the card's title, so a card that Discord draws as a heading plus a body drew as one long heading — and it ran to four lines against the design's three, 16px per card, which is the entire remaining height difference on this page. `buildAnnouncementEmbed` sets description and color and nothing else, so a card with no typed heading has NO title, not a placeholder: rendering "Announcement" there would put a line on screen the player never sees.
const firstHeading = (t) => (String(t || '').match(/^#{1,3}\s+(.+)$/m) || [])[1] || null;
const bodyOf = (t) => String(t || '').replace(/^#{1,3}\s+.+$/m, '').trim().slice(0, 110) || String(t || '').slice(0, 110);

// 🔴 WHOLE DAYS BETWEEN TWO DATES, not hours divided by 24. The design counts from midnight to midnight, so an announcement posted at 18:41 twenty days ago is "19d" there and was "20d" here — every age on the page off by one, in a direction that depends on the time of day the fixture happens to carry. 🔴 FLOOR FROM TODAY'S MIDNIGHT TO THE ACTUAL TIMESTAMP, which is what the design's own days() does and what makes "up 19d" 19 rather than 20. Rounding date-to-date gives 20 for a post made at 18:41 twenty calendar days ago; the design counts ELAPSED days from the moment it was posted to the start of today, so a post nineteen-and-a-quarter days old is nineteen. Every age on this realm was one out until this was measured against the design rather than reasoned about.
const daysBetween = (a, b) => Math.max(0, Math.floor(
    (new Date(new Date(b).toISOString().slice(0, 10) + 'T00:00:00Z') - new Date(a)) / 86400000));

const relDay = (iso) => {
    const d = daysBetween(iso, Date.now());
    return d <= 0 ? 'today' : `${d} day${d === 1 ? '' : 's'} ago`;
};

function DeliveryPreview({ live, cap }) {
    const shown = cap ? live.slice(0, cap) : live;
    return html`
        <div class="nprev" aria-label="What one player gets" role="group">
            <h5>What one player gets</h5>
            <!-- The cards live in ONE slot, as the design has them: two siblings of the note rather than two
                 siblings of each other, so the column is a heading, a stack, and a caption about the stack. -->
            <div>
            ${shown.length ? shown.map((a, i) => html`
                <${DiscordCard} key=${a._id} accent=${accentOf(a)} title=${firstHeading(a.text) || bodyOf(a.text)}
                                sub=${firstHeading(a.text) ? bodyOf(a.text) : ''}
                                rows=${[['Posted', relDay(a.createdAt)], ['Ends', a.expiresAt ? fmtDay(a.expiresAt) : 'never']]} />`)
            : html`<div class="idop"><b>nothing attached</b></div>`}
            </div>
            <p class="pnote">Delivered as an <b>ephemeral follow-up</b> after any top-level slash command,
                every unseen announcement as its own embed in ONE message. Each carries its own stored
                accent — that colour is the only thing telling two of them apart.</p>
        </div>`;
}

// 🔴 NO PANEL OF ITS OWN. This opened its own div.panel with its own header row INSIDE the Shell's view panel — a panel nested in a panel, carrying the realm name a second time and a 42px band the design does not draw, which pushed everything below it down by 42px and rendered in the overlay as one page-sized region. The design puts this content directly in the view panel and its summary line at the RIGHT OF THE SWITCHER ROW, which the Shell already exposes as `tools`. The caller passes it there.
function NowShowing({ live, counts, cap }) {
    return html`
            <div class="nowwrap">
            <div>
            ${live.length === 0
                ? html`<div class="nstack"><div class="nsempty">Nothing is showing right now. Players get no announcement
                    message at all. Anything scheduled for later is in Airtime.</div></div>`
                : html`<div class="nstack" role="list" aria-label="Announcements in delivery order">
                    ${live.map((a, i) => {
                        const days = daysBetween(a.createdAt, Date.now());
                        const waiting = cap ? i >= cap : false;
                        return html`
                            <div class=${'nscard' + (i === 0 ? ' p0' : '') + (waiting ? ' over' : '')}
                                 key=${a._id} role="listitem" style=${`--c:${accentOf(a)}`}
                                 aria-label=${`Delivery position ${i + 1}${waiting ? `, beyond the ${cap}-message cap` : ''}`}>
                                <span class="np">${i + 1}</span>
                                <span class="nsb">
                                    <span class="nt">${a.text}</span>
                                    <span class="nd">up ${days}d</span>
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
                <!-- The design states the ORDERING RULE unconditionally and appends the over-cap warning only
                     when there is one. The portal printed nothing at all under the cap, so the one fact a
                     reader most needs here — that position is delivery order and cannot be changed — appeared
                     only in the failure case. -->
                <p class="chint" style="margin-top:12px">
                    Position is <b>delivery order</b> — oldest first, and nothing else. There is no way
                    to reorder announcements.${cap && live.length > cap ? html`${' '}<b style="color:var(--warn)">${live.length - cap} of these will not
                    be shown</b> until something above ${live.length - cap === 1 ? 'it' : 'them'} ends.` : null}
                </p>`}
            </div>
            <${DeliveryPreview} live=${live} cap=${cap} />
            
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
        .map((a) => ({ ...a, days: daysBetween(a.createdAt, Date.now()) }))
        .sort((a, b) => b.days - a.days);
    if (!forever.length) return null;
    const worst = forever[0];
    return html`
        <div style="margin-bottom:16px">
        <div class="panel" style="margin-top:16px"><div class="callout">
            <b>Heads up:</b>${' '}“${worst.text.slice(0, 62)}${worst.text.length > 62 ? '…' : ''}”
            has no expiry and has been showing for <b>${worst.days} day${worst.days === 1 ? '' : 's'}</b>.${' '}
            ${forever.length > 1 ? `${forever.length - 1} other${forever.length === 2 ? '' : 's'} also never end. ` : ''}${' '}
            A blank expiry field means the 60-day default; <code>never</code> means this.
        </div></div>
        </div>
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

// 🔴 AIRTIME PAINTS THREE BAR STATES AND NAMED NONE OF THEM. Solid is showing, hollow-dashed is scheduled, muted is over -- the same shape vocabulary the Track uses, and a reader met it with no key. ⚠️ Deliberately NOT the shared StateKey: that one teaches "dashed = staged", and here a dashed bar means an announcement that is written and simply has not started yet. Same shape, a neighbouring meaning, and the wrong word would be worse than no word.
//
// ⚠️ It names only states PRESENT on screen, the rule every key in this portal follows: a season with nothing scheduled should not send somebody hunting for a dashed bar that is not drawn.
function AirtimeKey({ rows }) {
    const has = (state) => (rows || []).some((r) => r.state === state);
    const items = [];
    if (has('live')) items.push(['bk-live', 'showing']);
    if (has('scheduled')) items.push(['bk-sched', 'scheduled']);
    if (has('expired')) items.push(['bk-over', 'over']);
    if (!items.length) return null;
    return html`
        <span class="key rkey" aria-label="What a bar's shape means">
            ${items.map(([cls, label]) => html`<span key=${cls} class=${cls}><i></i>${label}</span>`)}
        </span>`;
}

export function BroadcastRealm({ session }) {
    const [showAdd, setShowAdd] = useState(false);
    const [notice, setNotice] = useState('');
    const [view, setView] = useState('Delivery queue');
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

    // 🔴 THIS REALM HAD NO EXPORT AND IS THE ONE THAT NEEDS ONE MOST. An announcement's TEXT is the whole artifact -- written once, stored nowhere else, and not derivable from any other record. ⚠️ Each scope states its own shape, and neither is re-importable: there is no bulk-add flow for announcements, so a note promising a round trip would be a false claim about the file.
    const exportToday = new Date().toISOString().slice(0, 10);
    const exportScopes = [
        { id: 'broadcast.live', label: 'Delivery queue', unit: 'announcements', subsetOf: 'broadcast.all',
          count: data.live.length, url: '/api/broadcast/export?scope=live',
          filename: `dioreo-announcements-live-${exportToday}.txt`,
          note: 'Only what a player would see right now, in the order Discord sends it.' },
        { id: 'broadcast.all', label: 'Every announcement', unit: 'announcements',
          count: data.all.length, url: '/api/broadcast/export?scope=all',
          filename: `dioreo-announcements-${exportToday}.txt`,
          note: 'The whole history with each one\'s state and window — a record, NOT a re-importable format.' },
    ];
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
        <${Shell} realm="broadcast" session=${session} busy=${load.hostClass} view=${view} viewOptions=${['Delivery queue', 'Airtime']} onSetView=${setView}
                  realmKey=${view === 'Airtime' ? html`<${AirtimeKey} rows=${rows} />` : null}
                  exports=${exportScopes} exportLabel="Export" overlayFor=${overlay}
                  overlaySlot=${overlay.render()}
                  commands=${[
                      { label: 'Post an announcement', group: 'broadcast', local: true, accent: 'var(--r-broadcast)',
                        keywords: ['new', 'write', 'say', 'announce'], run: () => setShowAdd(true) },
                  ]}
                  masthead=${html`<${Masthead} title="Broadcast" sub="One text field, delivered once per player, in the order it was written — and the two things Discord never shows you: what has not started yet, and what will never stop."
                                               stats=${[
                                                   { value: counts.live, label: 'live', lead: true, accent: 'var(--r-broadcast)' },
                                                   { value: counts.scheduled, label: 'scheduled' },
                                                   { value: stagedHere === null ? '—' : stagedHere, label: 'staged', tone: 'stg' },
                                                   { value: counts.forever, label: 'never ends', tone: 'warn' },
                                               ]}
                                               actions=${html`<${MastheadNew} label="Post announcement" hint="n"
                                                                              tip="Write an announcement"
                                                                              onClick=${() => setShowAdd(true)} />`} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      ${showAdd ? html`<${PostForm} onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)} />` : null}
                      ${view === 'Delivery queue' ? html`<${NowShowing} live=${data.live} counts=${counts} cap=${data.maxPerMessage} />` : html`<${Airtime} all=${data.all} />`}
                  `}
                  
                  stateKey=${false}
                  tools=${view === 'Delivery queue' ? html`<span class="key"><span class="l"><i></i>saved</span><span class="s"><i></i>staged</span></span><span class="sp">${Math.min(counts.live, data.maxPerMessage)} in one message, oldest first · cap ${data.maxPerMessage}${counts.live > data.maxPerMessage ? ` · ${counts.live - data.maxPerMessage} wait for the next` : ''}</span>` : null}
                  noticeSlot=${html`<${HeadsUp} all=${data.all} />`}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${BROADCAST_COLUMNS} searchableFields=${['text']}
                                                    label="Manifest" addLabel="+ Post announcement" filterGroups=${BROADCAST_FILTERS}
                                                    bulkNote="Reversible — a staged deletion is discarded, never undone"
                                                    bulkTier=${2} rowNoun=${['announcement', 'announcements']}
                                                    onRemove=${(row) => confirmBulkDelete([row.id])} removeLabel="Remove"
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
