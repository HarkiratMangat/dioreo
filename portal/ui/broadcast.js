// portal/ui/broadcast.js — ESM. The Broadcast realm: Now showing + Airtime + a Post form + inline edit + bulk actions, reusing <Shell>/<Manifest> unchanged.
//
// buildBroadcastAddOp/buildBroadcastEditOp come from broadcast.logic.js, loaded as a plain CLASSIC <script> before this module -- see track.js's header comment for why a literal ESM import of a .logic.js sibling would fail in a real browser (found live in season.js's own prior version).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, Masthead, MastheadNew } from './shell.js';
import { DiscordCard } from './v2Render.js';
import { Manifest } from './manifest.js';
import { Icon, Fold } from './icons.js';
import { fetchJson } from './httpClient.js';
import { downloadText } from './download.js';
import { useAsync, RealmShell } from './async.js';
import { stageOps } from './composeClient.js';
import { useOverlay, Drawer } from './overlay.js';
import { SmartDate } from './composer.js';

// 🔴 NO YEAR. toDateString().slice(4) yields "Aug 14 2026"; the design prints "Aug 14" and so does every other date on this page. Four columns wide, on every row, the year is the same digit repeated 16 times and it pushed the whole table's columns out of register against the design. No year and no leading zero: the design prints "Aug 4", toDateString gives "Aug 04 2026".
const fmtDay = (v) => new Date(v).toDateString().slice(4, 10).trim().replace(/ 0(\d)$/, ' $1');

// ⚠️ THE CONTENT LIFECYCLE, NAMED. An inline object literal inside a render closure is a vocabulary nothing else can see, and this column carries TWO of them — the staging state (StatePill) and this. Kept apart on purpose: `LIVE NOW` is not `SAVED`, and a reader who cannot tell a written-and-over post from a staged-and-not-yet-real one has been told half the answer.
const LIFECYCLE_WORD = { live: 'LIVE NOW', scheduled: 'UPCOMING', expired: 'ENDED' };
// ⚠️ HOISTED ABOVE ITS READER 2026-09-11 18:49 EDT. `BROADCAST_COLUMNS`'s state renderer reads this four lines before it was declared -- a temporal dead zone `node --check` cannot see, which is the whole reason `scripts/tdzRatchet.mjs` exists. It does not throw TODAY only because the read happens inside a render closure that runs long after the module finishes evaluating; make that renderer eager, or hoist the array, and it becomes a crash. The ratchet counted it as one of two NEW findings against a baseline of 27.
// 🔴 THE MANIFEST AS DESIGN BOARD 2 DRAWS IT (plan pins batch 2 §10.4 G11 rows 1–3, 2026-09-15 00:07 EDT). The name column gives the text the room and draws the announcement's own colour as a 4px embed-style bar at the row's edge; the three date columns and the state column take the board's widths through their col classes. Posted carries its age under the date, a blank Starts reads On posting (upright, never italic), and no end reads No end in amber with an infinity mark. The State column is one TAB: the lifecycle word and its icon, a 3px bar in the state colour and a 9% wash — and a staged row's tab is a dashed outline, which is the shape-carries-state rule in one control. This replaces StatePill beside a lifecycle word (2026-09-10, pin pmtvqq1xg), because two chips for two axes were the "poorly implemented" labels, and the board answered it with one.
const LIFECYCLE = { live: { word: 'Live now', icon: 'radio', c: 'var(--ok)' }, scheduled: { word: 'Upcoming', icon: 'calendar', c: 'var(--sched)' }, expired: { word: 'Ended', icon: 'circle-check', c: 'var(--ink3)' } };
function lifecycleOf(r) {
    if (LIFECYCLE[r.state]) return r.state;
    const now = Date.now();
    if (r.expiresAt && new Date(r.expiresAt).getTime() <= now) return 'expired';
    return r.startsAt && new Date(r.startsAt).getTime() > now ? 'scheduled' : 'live';
}
const agoText = (v) => { const d = daysBetween(v, Date.now()); return d <= 0 ? 'today' : `${d} day${d === 1 ? '' : 's'} ago`; };
const BROADCAST_COLUMNS = [
    { key: 'text', label: 'Announcement', editable: true, col: 'c-bc-text',
      dotClass: () => 'bcbar', dotStyle: (r) => `--c:${accentOf(r)}`,
      render: (r) => { const t = String(r.text || '').replace(/^#{1,3}\s+/, ''); return html`<b title=${t}>${t}</b>`; } },
    { key: 'createdAt', label: 'Posted', col: 'c-bc-date', dataKind: 'nums', render: (r) => html`<span class="bcdt">${fmtDay(r.createdAt)}<small>${agoText(r.createdAt)}</small></span>` },
    { key: 'startsAt', label: 'Starts', col: 'c-bc-date', dataKind: 'nums', render: (r) => (r.startsAt ? html`<span class="bcdt">${fmtDay(r.startsAt)}</span>` : html`<span class="bcdt dim">On posting</span>`) },
    { key: 'expiresAt', label: 'Ends', col: 'c-bc-date', dataKind: 'nums', render: (r) => (r.expiresAt ? html`<span class="bcdt">${fmtDay(r.expiresAt)}</span>` : html`<span class="bcdt never"><${Icon} name="infinity" />No end</span>`) },
    { key: 'state', label: 'State', col: 'c-bc-state',
      render: (r) => { const l = LIFECYCLE[lifecycleOf(r)]; return html`<span class=${'btab' + (r.state === 'staged' ? ' staged' : '')} style=${`--lc:${l.c}`}><${Icon} name=${l.icon} />${l.word}</span>`; } },
];


// The State chips keep the portal's chip with its colour dot (board 2 popup, 13:06 EDT) and carry their counts (§10.4 C1). The words match the Tab in the column, so the filter and the thing it filters say the same thing.
function broadcastFilters(all) {
    const n = (s) => all.filter((a) => lifecycleOf(a) === s).length;
    return [{ key: 'state', label: 'State', topic: true, options: [
        { value: 'live', label: 'Live now', hex: 'var(--ok)', count: n('live') },
        { value: 'scheduled', label: 'Upcoming', hex: 'var(--sched)', count: n('scheduled') },
        { value: 'expired', label: 'Ended', hex: 'var(--ink3)', count: n('expired') },
    ] }];
}

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

// 🔴 CHANGES AHEAD REPLACES "WHAT ONE PLAYER GETS" (plan pins batch 2 §10.4 G3 row 5, popup 2026-09-14 10:33 EDT). The composer now shows the Discord card itself, so this column answers the question the queue cannot: what is about to change. Every future start and every future end, soonest first, as a date tile and the announcement clamped to two lines.
function ChangesAhead({ all }) {
    const now = Date.now();
    const events = [];
    for (const a of all) {
        const s = a.startsAt ? new Date(a.startsAt).getTime() : null;
        const e = a.expiresAt ? new Date(a.expiresAt).getTime() : null;
        if (s && s > now) events.push({ at: s, a, verb: 'Starts showing', c: 'var(--ok)' });
        if (e && e > now) events.push({ at: e, a, verb: 'Stops showing', c: 'var(--ink3)' });
    }
    events.sort((x, y) => x.at - y.at);
    return html`
        <div class="bchg" role="group" aria-label="Changes ahead">
            <h5>Changes ahead</h5>
            ${events.length ? events.slice(0, 6).map((ev, i) => { const d = new Date(ev.at); return html`
                <div class="bchg-i" key=${i} style=${`--gc:${ev.c}`}>
                    <time datetime=${d.toISOString()}><small>${d.toLocaleDateString(undefined, { month: 'short' })}</small>${d.getDate()}</time>
                    <span><b>${String(ev.a.text || '').replace(/^#{1,3}\s+/gm, '')}</b><em>${ev.verb}</em></span>
                </div>`; })
            : html`<p class="bchg-none">Nothing starts or stops on a date ahead.</p>`}
        </div>`;
}

// 🔴 NO PANEL OF ITS OWN. This opened its own div.panel with its own header row INSIDE the Shell's view panel — a panel nested in a panel, carrying the realm name a second time and a 42px band the design does not draw, which pushed everything below it down by 42px and rendered in the overlay as one page-sized region. The design puts this content directly in the view panel and its summary line at the RIGHT OF THE SWITCHER ROW, which the Shell already exposes as `tools`. The caller passes it there.
// 🔴 THE ANNOUNCEMENT CARD AS DESIGN BOARD 2 DRAWS IT (plan pins batch 2 §10.4 G3 rows 1–4, 2026-09-15 00:28 EDT). The position number is the delivery order, large, in the card's own colour; the text sits in an enclosure clamped to two lines with Show all; the lifespan is one bar between two equal end boxes, the same length on every card so their windows compare at a glance; the meta and the actions share the last row with the actions bottom right. The explanatory sentence under the stack became the heading "Delivery order" (G1), and a card past the cap still says it waits.
function queueWindow(live) {
    const now = Date.now();
    let lo = now, hi = now + 7 * 86400000;
    for (const a of live) {
        const s = new Date(a.startsAt || a.createdAt).getTime();
        if (s < lo) lo = s;
        if (a.expiresAt) hi = Math.max(hi, new Date(a.expiresAt).getTime());
    }
    return { lo, hi: Math.max(hi, lo + 86400000), now };
}
function NowShowing({ live, cap, onEdit, onEditDates, onRemove }) {
    const [openText, setOpenText] = useState(new Set());
    const win = queueWindow(live);
    const pct = (t) => Math.max(0, Math.min(100, ((t - win.lo) / (win.hi - win.lo)) * 100));
    const toggleText = (id) => setOpenText((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    return html`
        <div class="bqueue">
            <div class="bqcol">
                <div class="bqhead">Delivery order</div>
                ${live.length === 0
                    ? html`<div class="nsempty">Nothing is showing right now. Players get no announcement message at all. Anything scheduled for later is in Airtime.</div>`
                    : html`<div class="bqlist" role="list" aria-label="Announcements in delivery order">
                    ${live.map((a, i) => {
                        const waiting = cap && i >= cap;
                        const id = String(a._id);
                        const open = openText.has(id);
                        const text = String(a.text || '').replace(/^#{1,3}\s+/gm, '');
                        const start = new Date(a.startsAt || a.createdAt).getTime();
                        const end = a.expiresAt ? new Date(a.expiresAt).getTime() : null;
                        const left = pct(start);
                        const days = daysBetween(a.createdAt, Date.now());
                        const showings = a.repeatCount && a.repeatCount > 1 ? a.repeatCount : 1;
                        return html`
                        <div class=${'bcard' + (waiting ? ' over' : '')} key=${id} role="listitem" style=${`--c:${accentOf(a)}`}
                             aria-label=${`Delivery position ${i + 1}${waiting ? `, waiting beyond the ${cap}-message cap` : ''}`}>
                            <span class="bnum">${i + 1}</span>
                            <div class="bbody">
                                <div class=${'benc' + (open ? ' open' : '')} onClick=${() => toggleText(id)}>
                                    <p>${text}</p>
                                    <div class="bencf"><span>${text.length.toLocaleString()} characters</span>${waiting ? html`<span class="bwait">Waits for a free slot</span>` : null}
                                        <button type="button" class="bexp" aria-expanded=${open ? 'true' : 'false'} onClick=${(e) => { e.stopPropagation(); toggleText(id); }}><${Fold} open=${open} />${open ? 'Show less' : 'Show all'}</button></div>
                                </div>
                                <div class="btl">
                                    <span class="bend"><${Icon} name="calendar-days" />${fmtDay(a.startsAt || a.createdAt)}</span>
                                    <span class="bbar" aria-hidden="true">
                                        <span class="btrack"></span>
                                        <span class=${'bspan' + (end ? '' : ' open')} style=${end ? `left:${left}%;width:${Math.max(1, pct(end) - left)}%` : `left:${left}%`}></span>
                                        <span class="bnow" style=${`left:${pct(win.now)}%`}></span>
                                    </span>
                                    ${end ? html`<span class="bend"><${Icon} name="clock" />${fmtDay(a.expiresAt)}</span>` : html`<span class="bend nev"><${Icon} name="infinity" />No end</span>`}
                                </div>
                                <div class="bmeta">
                                    <span class="bpill">up ${days}d</span>
                                    <span class="bpill">${showings} showing${showings === 1 ? '' : 's'}</span>
                                    <span class="bacts">
                                        <button type="button" class="wg-ib" aria-label="Edit announcement" data-tip="Edit" onClick=${() => onEdit(a)}><${Icon} name="square-pen" /></button>
                                        <button type="button" class="wg-ib" aria-label="Dates and repeats" data-tip="Dates and repeats" onClick=${() => onEditDates(a)}><${Icon} name="calendar-days" /></button>
                                        <i class="wg-vr" aria-hidden="true"></i>
                                        <button type="button" class="wg-ib wg-del" aria-label="Remove announcement" data-tip="Remove" onClick=${() => onRemove(a)}><${Icon} name="trash-2" /></button>
                                    </span>
                                </div>
                            </div>
                            ${a.bannerImageUrl ? html`<img class="bban" src=${a.bannerImageUrl} alt="" loading="lazy" />` : html`<span></span>`}
                        </div>`;
                    })}
                </div>`}
            </div>
            <${ChangesAhead} all=${live} />
        </div>
    `;
}

// Airtime -- a REAL time axis, which is the entire point of the view. Spec §8.2: "Airtime puts every announcement on a time axis, which is how 'this has been up for nineteen days with no expiry' becomes visible instead of forgotten." It shipped as a truncated text list with a parenthetical, which forgets it just as thoroughly as the table did.
//
// barGeometry comes from track.logic.js (a bare global, same classic-script mechanism as everywhere else here) rather than a second copy of the same clamping arithmetic. ⚠️ THE AXIS COUNTS WHOLE DAYS, NOT MILLISECONDS, and the two are not interchangeable. The design places a bar at days(lo, date)/span; this placed it at (t - lo)/(hi - lo) off the raw timestamps, so every bar whose record carries a time of day landed a few pixels off its own gridline and the now-line sat mid-afternoon rather than on today's tick. The ruler is drawn in days, so the bars have to be measured in days or the axis quietly disagrees with itself.
function airtimeWindow(all, todayIso) {
    const ds = [todayIso];
    for (const a of all) {
        for (const v of [a.createdAt, a.startsAt, a.expiresAt]) if (v) ds.push(String(v).slice(0, 10));
    }
    const sorted = ds.slice().sort();
    const lo = sorted[0], hi = sorted[sorted.length - 1];
    // A window narrower than three weeks makes every bar a sliver; widen it rather than let the axis collapse.
    return { start: lo, end: TL.days(lo, hi) < 21 ? TL.addDays(lo, 21) : hi };
}

/* THE LANE LABEL, ported from the mockup verbatim, INCLUDING WHY IT IS NOT A PLAIN TRUNCATION.
 * Found by looking at the real data rather than by reading the code: every announcement in the dev
 * database opens with the same "SESSIONB-SEED " prefix, so a fixed-length slice rendered four lanes
 * whose labels were byte-identical -- an unreadable axis that no audit rule can see, because four
 * different strings truncated to the same string is still well-formed text. A shared opener is not
 * a seeding artefact either: a house style ("PSA:", "[Maintenance]") collides in exactly the same
 * way. Strip whatever prefix ALL of them share, back off to a word boundary, then truncate. */
function commonPrefix(list) {
    if (list.length < 2) return '';
    let n = 0;
    while (n < list[0].length && list.every((t) => t[n] === list[0][n])) n++;
    while (n > 0 && !/\s/.test(list[0][n - 1])) n--;
    return list[0].slice(0, n);
}
// A leading "# ..." is a Discord heading, not part of the name -- the queue preview already treats it that way, so the axis has to as well or the same announcement is called two different things on two views of one page.
const bareText = (t) => String(t || '').replace(/^#{1,3}\s+/, '');

// ⚠️ htm DELETES THE SPACE BEFORE AN INLINE TAG WHEN A NEWLINE SITS THERE. A whitespace-only chunk that spans a line break is dropped, so wrapping a paragraph's source at a tag boundary renders "otherwise atcreatedAt" on screen while the source reads correctly -- and every text comparison in this repo normalises whitespace before comparing, so nothing but the overlay could see it. Prose containing inline tags stays on one physical line. ⚠️ AIRTIME RENDERS NO PANEL AND NO HEADING OF ITS OWN. It is one of the realm view panel's two views, exactly as the delivery queue is, so its chrome is the Shell's `.ph` -- the realm title, the view tabs, the key and the meta line. It used to open its own `div.panel` with its own `Airtime` heading and date range inside the Shell's panel, which titled the view twice, indented the content by a second gutter (the racknote wrapped to two lines at 585px narrower) and made the page 78px taller than the design's.
function Airtime({ all }) {
    const today = new Date().toISOString().slice(0, 10);
    const window = airtimeWindow(all, today);
    const span = Math.max(1, TL.days(window.start, window.end));
    const pct = (d) => Math.max(0, Math.min(100, (TL.days(window.start, String(d).slice(0, 10)) / span) * 100));
    if (!all.length) return html`<p class="empty">No announcements have ever been posted.</p>`;

    const rows = all.slice().sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    const shared = commonPrefix(rows.map((a) => bareText(a.text))).length;

    // 🔴 THE RAIL IS A SHARED COMPONENT, AND THIS MARKUP IS THE CONTRACT FOR IT. `.tk-wrap` is what the rail's rules in portal/ui/app.css scope on — not `#airtime`, and not the Season Track's id. Airtime draws the same object the Track does (lanes, bars, a ruler, a now-line), and it used to get that for free by sharing global class names with whatever the Track's stylesheet happened to define. That is exactly what broke when track.css was first scoped to `#track`: bars fell to position:static, lanes collapsed to 30px and the two ruler dates printed on top of each other. Rendering the wrapper is what earns the styles now.
    return html`
        <div class="tk-wrap"><div class="tk-inner">
            <div class="ruler">
                ${''/* NO <b> HERE. broadcast.html's ruler writes the date straight into the span; the Track's writes a <b>, which is why app.css carries `.ruler span b{font-weight:inherit}` to undo the bold it would otherwise add. Borrowing the Track's markup made the audit report this span's text as empty and the <b> as a portal-only element -- a difference that renders identically and reads, to every text comparison, as a missing date. */}
                <span style="left:0%">${TL.fmt(window.start)}</span>
                <span style="left:100%;transform:translateX(-100%)">${TL.fmt(window.end)}</span>
            </div>
            <div class="lanes">
                ${rows.map((a) => {
                    const startAt = a.startsAt || a.createdAt;
                    // "Forever" is a property of the RECORD, not of its current state: an announcement that has not started yet and has no expiry is still one that will never stop, and gating this on state === 'live' drew it with a right edge — the precise misreading the whole view exists to prevent.
                    const forever = !a.expiresAt;
                    const l = pct(startAt);
                    const r = forever ? 100 : pct(a.expiresAt);
                    // Shape carries state, exactly as it does on the Track: a solid fill is live, hollow-dashed is scheduled, muted is over.
                    const cls = 'bar ' + (a.state === 'scheduled' ? 'staged' : a.state === 'expired' ? 'ended' : 'saved')
                        + (forever ? ' forever' : '');
                    const accent = accentOf(a);
                    const label = a.state === 'scheduled' ? 'starts ' + TL.fmt(String(startAt).slice(0, 10))
                        : forever ? 'no expiry →' : '';
                    const name = bareText(a.text);
                    return html`
                        <div class="lane" key=${a._id} style=${accent ? `--c:${accent}` : ''}>
                            <span class="nm" data-tip=${a.text}>${name.slice(shared, shared + 16)}${name.length > shared + 16 ? '…' : ''}</span>
                            <div class="tk">
                                <div class=${cls} style=${`left:${l}%;width:${Math.max(1.2, r - l)}%`
                                    + (accent ? `;--c:${accent}` : '')}
                                     aria-label=${`${a.text.slice(0, 40)}, ${a.state}${forever ? ', no end date' : ''}`}>
                                    <span class="bl">${label}</span>
                                </div>
                            </div>
                        </div>`;
                })}
                <div class="ov"><div class="now" style=${`left:${pct(today)}%`}></div></div>
            </div>
        </div></div>
    `;
}

// The proactive data-quality callout from 05-door-broadcast-ops.html. It names the specific announcement and the specific number rather than warning in the abstract -- an "announcements can stay up forever" notice teaches nothing, "this one has been up 19 days" is actionable.
function HeadsUp({ all, onSetEnd }) {
    const forever = all.filter((a) => a.state === 'live' && !a.expiresAt)
        .map((a) => ({ ...a, days: daysBetween(a.createdAt, Date.now()) }))
        .sort((a, b) => b.days - a.days);
    if (!forever.length) return null;
    const worst = forever[0];
    return html`
        <div id="headsup">
        <!-- ⚠️ THE WRAPPER IS LOAD-BEARING AND IT IS NOT A SPACER. the adjacent-sibling panel rule makes the SECOND
             panel recessive — transparent ground, quieter border — which is how the Manifest reads as
             subordinate to the view above it. Rendered bare, this callout became the adjacent panel and
             took the recessive treatment itself, while the Manifest below it kept it for the wrong
             reason. The design wraps it in a plain div for exactly this, so the callout stays raised and
             the Manifest's adjacency is to the view panel it is subordinate to. Margins collapse through
             a div with no border or padding, so it costs no space. -->
        <div class="panel" style="margin-top:var(--s4)"><div class="callout hucall">
            <${Icon} name="triangle-alert" /><span><b>Heads up:</b>${' '}“${worst.text.slice(0, 62)}${worst.text.length > 62 ? '…' : ''}” has no end date and has been showing for <b>${worst.days} day${worst.days === 1 ? '' : 's'}</b>.${forever.length > 1 ? ` ${forever.length - 1} other${forever.length === 2 ? '' : 's'} also never end.` : ''}</span>${onSetEnd ? html`<button type="button" class="chip" onClick=${() => onSetEnd(worst)}>Set an end date</button>` : null}
        </div></div>
        </div>
    `;
}

// Mirrors /manage's real post-announcement modal (text/expiry) plus startsAt (new field, this task -- core/ops/announcements.js's own header explains why it's a real admin date, unlike expiry which is a day-count). A blank expiry means the server's own 60-day default; a blank start means "shows immediately" -- both sent as null rather than guessed at client-side. ⚠️ A BLANK FIELD HERE IS A REAL VALUE, TWICE OVER, and neither said so on screen: a blank expiry takes the server's 60-day default rather than never expiring, and a blank start means the announcement is live the moment it commits. Both facts were in this file's own header comment, which nobody using the form can read.
function PostForm({ onSubmit, onCancel }) {
    const [text, setText] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    // 🔴 THE RESOLVED INSTANT IS STATE, NOT A CLIENT-SIDE PARSE AT SUBMIT TIME. This used to send
    //    `new Date(startsAt).toISOString()`, which is the browser's parser reading a value the BOT will
    //    later read with chrono-node — two implementations behind one promise, which is the exact
    //    argument composer.js's own header makes for asking the server. The iso here is what
    //    /api/parse-date returned, so what the preview says and what the record holds cannot differ.
    const [startsIso, setStartsIso] = useState(null);
    const [expiresIso, setExpiresIso] = useState(null);
    // ⚠️ TEXT WITHOUT A RESOLUTION MUST BLOCK, NOT SILENTLY SEND NULL. A field reading "next tuseday"
    //    resolves to nothing; submitting it would post an announcement that starts immediately and say
    //    nothing about why. The `why` line below names which field, in the drawer footer's own voice.
    const unresolved = [startsAt.trim() && !startsIso ? 'the start' : '', expiresAt.trim() && !expiresIso ? 'the end' : ''].filter(Boolean);
    const ready = text.trim() && !unresolved.length;

    function submit() {
        onSubmit(buildBroadcastAddOp({
            text,
            startsAt: startsIso || null,
            expiresAt: expiresIso || null,
        }));
    }

    // 🔴 A DRAWER, NOT AN INLINE PANEL. `broadcast.html:415` opens this through `S.drawer` — scrim, `dw-h` header with the `announcement.post · tier 1` eyebrow, `dwbody`, and a `dw-f` footer — and the portal pushed the whole page down with a `div.panel` above the view instead. Measured 2026-09-01 with `portal:audit --open "+ Post announcement"`: every drawer element read ONLY IN MOCKUP and the view panel came out 291px taller. The machinery was already imported for the bulk-delete confirmation. ⚠️ THE COPY IS THE PORTAL'S AND STAYS. The design labels these `Text` / `Starts (blank = immediately)` / `Expires in` and carries its guidance in `p.dw-p`; this form's own note records why the two deciding facts — a blank start means live on commit, a blank expiry means SIXTY DAYS rather than never — have to be on screen. So: the design's container and its `dw-p` placement, this file's sentences inside them. ⚠️ `Expires in` is a TEXT field in the design ("blank, days, or never") and a date input here. That is a payload-shape question for `core/ops/announcements.js`, which §0.6b puts out of this pass — filed, not silently kept: a date input cannot express "never", which is the state this whole realm is about.
    return html`
        <${Drawer} eyebrow="announcement.post · tier 1" title="Post an announcement" onClose=${onCancel}
                   actions=${html`
                       <span role="status" class=${'why' + (ready ? '' : ' blocked')}>${ready ? 'Stages one operation. Nothing reaches a player until you commit it on Review.' : 'Write the announcement first.'}</span>
                       <button class="btn" onClick=${onCancel}>Cancel</button>
                       ${unresolved.length ? html`<span class="why blocked">${unresolved.join(' and ')} ${unresolved.length > 1 ? 'are' : 'is'} not a date yet</span>` : null}
                       <button class="btn go" disabled=${!ready} onClick=${submit}>Stage post</button>`}>
            <div class="dwbody">
                <div class="dwfield"><label for="post-text">Text</label>
                    <textarea id="post-text" rows="4" placeholder="Type a # heading on the first line if you want one."
                              value=${text} onInput=${(e) => setText(e.target.value)}></textarea></div>
                <div class="dw-grid2">
                        ${''/* 🔴 PIN pmtvp9ur7 ASKED FOR A DATE PICKER AND THE ANSWER WAS ALREADY BUILT. A native date input cannot take "in 3 days", cannot take a paste out of a patch note, and renders a different widget in every browser. SmartDate asks the bot's own chrono-node through /api/parse-date and echoes what it resolved, which is what /manage has understood since it was built. */}
                    <${SmartDate} chrome="drawer" id="post-starts" label="Starts"
                                  placeholder="blank = the moment you commit, or “in 3 days”, or Sep 21"
                                  value=${startsAt} iso=${startsIso}
                                  onChange=${(v, i) => { setStartsAt(v); setStartsIso(i); }} />
                    <${SmartDate} chrome="drawer" id="post-expires" label="Ends"
                                  placeholder="blank = the server’s 60-day default, not never"
                                  value=${expiresAt} iso=${expiresIso}
                                  onChange=${(v, i) => { setExpiresAt(v); setExpiresIso(i); }} />
                </div>
                <p class="dw-p">A blank start shows it the moment you commit. A blank end takes the server's
                    60-day default, not never.</p>
                <p class="dw-p">Every live announcement is attached to the bot's next reply to a player, in the
                    order it was written — so this is not a broadcast to a channel, it is a note added to whatever
                    they were already doing.</p>
            </div>
        <//>
    `;
}

// 🔴 AIRTIME PAINTS THREE BAR STATES AND NAMED NONE OF THEM. Solid is showing, hollow-dashed is scheduled, muted is over -- the same shape vocabulary the Track uses, and a reader met it with no key. ⚠️ Deliberately NOT the shared StateKey: that one teaches "dashed = staged", and here a dashed bar means an announcement that is written and simply has not started yet. Same shape, a neighbouring meaning, and the wrong word would be worse than no word.
//
// ⚠️ It names only states PRESENT on screen, the rule every key in this portal follows: a season with nothing scheduled should not send somebody hunting for a dashed bar that is not drawn.

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
        // ⚠️ `What is live now`, the design's label (broadcast.html:543) — NOT the view tab's name. A scope says what is IN the file; naming it after the tab says where you were standing when you asked for it.
        { id: 'broadcast.live', label: 'What is live now', unit: 'announcements', subsetOf: 'broadcast.all',
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

    // Edit and Dates and repeats open the composer on the announcement itself (G3 row 4); the composer reads `initial` and stages an edit rather than a post.
    const [editingAnn, setEditingAnn] = useState(null);
    const openEdit = (a) => { setEditingAnn(a); setShowAdd(true); };

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

    // 🔴 THE THIRD DEAD EXPORT BUTTON ON THIS BRANCH, and the first one nobody went looking for — `scripts/portalExport.test.js`'s source scan found it after the same defect was fixed by hand in Season and Armory. `open('data:…')` is blocked as a top-level navigation: it returns null, throws nothing, and the page does not change, so the button ran and produced no file. It writes a real one now, as TSV, because an announcement has no bulk-add format to round-trip through and a caption pretending otherwise is the other half of the same defect. ⚠️ NO CALLER SINCE 2026-09-01, KEPT DELIBERATELY. Its only caller was a `bulkActions` verb that could never be invoked (see the Manifest call below). Kept rather than deleted because the moment this realm's design gains a checkbox column the verb comes back, and because the function is the record of a real defect: the third dead export button on this branch, found by a source scan after the same `open('data:…')` bug was fixed by hand in Season and Armory.
    function handleExportSelection(ids) {
        const selected = rows.filter((r) => ids.includes(r.id));
        const header = ['Text', 'State', 'Starts', 'Expires'].join('\t');
        const body = selected.map((r) => [String(r.text || '').replace(/\s+/g, ' '), r.state || '',
            r.startsAt ? new Date(r.startsAt).toISOString().slice(0, 10) : '',
            r.expiresAt ? new Date(r.expiresAt).toISOString().slice(0, 10) : 'never'].join('\t')).join('\n');
        downloadText(`dioreo-announcements-${new Date().toISOString().slice(0, 10)}.tsv`,
            `${header}\n${body}`, 'text/tab-separated-values;charset=utf-8');
    }

    // 🔴 THE RAIL'S STAGED COUNT REACHED TWO REALMS OF SEVEN. `badges` was passed by Home (home.js) and Season (season.js) only, so the one number the rail exists to carry — how much work is waiting — was absent on the five realms in between, including the two that stage on every edit. It is a property of the CHANGESET, so it is the TOTAL and not this realm's share; `Rail` omits it at zero, which is the "absent rather than zero" rule `shell.js:43` states. Unknown (a 403 on /api/review) reads as absent too, because a badge is not the surface that can say "you cannot see that". ⚠️ AS A `//` COMMENT ABOVE THE RETURN, NEVER AS `<!-- -->` INSIDE THE PROP LIST — the first version was the latter on all five realms and htm dropped every prop after it.
    return html`
        <${Shell} realm="broadcast" session=${session} busy=${load.hostClass} view=${view} viewOptions=${['Delivery queue', 'Airtime']} onSetView=${setView}
                  exports=${exportScopes} exportLabel="Export" overlayFor=${overlay}
                  badges=${{ review: data.stagedUnknown ? 0 : (data.stagedOps || []).length }}
                  stagedOps=${data.stagedUnknown ? null : data.stagedOps}
                  overlaySlot=${html`${overlay.render()}${showAdd ? html`<${PostForm} initial=${editingAnn} onSubmit=${handleAdd} onCancel=${() => { setShowAdd(false); setEditingAnn(null); }} />` : null}`}
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
                      ${view === 'Delivery queue' ? html`<${NowShowing} live=${data.live} cap=${data.maxPerMessage} onEdit=${openEdit} onEditDates=${openEdit} onRemove=${(a) => confirmBulkDelete([a._id])} />` : html`<${Airtime} all=${data.all} />`}
                  `}
                  
                  stateKey=${false}
                  tools=${html`<span class="key" aria-label="What the marks mean"><span class="l"><i></i>saved</span><span class="s"><i></i>staged</span></span>`}
                  meta=${view === 'Delivery queue' ? html`<span class="bqcount"><span class="bqm" aria-hidden="true"><i style=${`width:${Math.min(100, (Math.min(counts.live, data.maxPerMessage) / data.maxPerMessage) * 100)}%`}></i></span><b>${Math.min(counts.live, data.maxPerMessage)}</b> of ${data.maxPerMessage} slots used</span>` : null}
                  noticeSlot=${html`<${HeadsUp} all=${data.all} onSetEnd=${openEdit} />`}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${BROADCAST_COLUMNS} searchableFields=${['text']}
                                                    label="Manifest" selectable=${false} searchPlaceholder="Search the text…" addLabel="+ Post announcement" filterGroups=${broadcastFilters(data.all)}
                                                    bulkNote="Reversible — a staged deletion is discarded, never undone"
                                                    bulkTier=${2} rowNoun=${['announcement', 'announcements']}
                                                    onRemove=${(row) => confirmBulkDelete([row.id])} removeLabel="Remove"
                                                    emptyText="Nothing has been announced yet." 
                                                    onAdd=${() => setShowAdd(true)} realm="broadcast" csrfToken=${session.csrfToken}
                                                    buildEditOp=${buildBroadcastEditOp}
                                                    onEditError=${(msg) => setNotice(msg)}
                                                    ${''/* 🔴 NO `bulkActions`. Two were declared — `Export selection` and `Stage deletion` — and NEITHER COULD EVER BE INVOKED: they render only in the bulk bar, the bulk bar needs a selection, and `selectable={false}` above is a deliberate conformance decision (this realm's design draws no checkbox column, and forcing one cost 38px of table width and wrapped a row). So the realm declared two verbs behind a control it had itself removed. Found 2026-09-01 by opening the delete Confirm through `--open-sel button.rmv`, the surface `--triggers` cannot see because it lives in a data row. Same class as Armory's Manifest `mode` chip: a control that could only ever fail. Per-row removal is unaffected — `onRemove` above is the reachable path and it opens the same tier-2 Confirm. Scoped export is unaffected — the masthead Export strip offers both scopes. */}
                                                    />`} />
    `;
}
