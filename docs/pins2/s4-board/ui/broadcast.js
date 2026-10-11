// portal/ui/broadcast.js — ESM. The Broadcast realm: Now showing + Airtime + a Post form + inline edit + bulk actions, reusing <Shell>/<Manifest> unchanged.
//
// buildBroadcastAddOp/buildBroadcastEditOp come from broadcast.logic.js, loaded as a plain CLASSIC <script> before this module -- see track.js's header comment for why a literal ESM import of a .logic.js sibling would fail in a real browser (found live in season.js's own prior version).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef, useLayoutEffect } from '../vendor/preact-hooks.mjs';
import { Shell, Masthead, MastheadNew } from './shell.js';
import { DiscordCard } from './v2Render.js';
import { Manifest } from './manifest.js';
import { Icon, Fold } from './icons.js';
import { fetchJson } from './httpClient.js';
import { downloadText } from './download.js';
import { useAsync, RealmShell, reportFailure } from './async.js';
import { stageOps } from './composeClient.js';
import { useOverlay, Drawer } from './overlay.js';
import { SmartDate } from './composer.js';
import { useB3 } from '../b3/state.js';
import { EndPicker, NeverChip, ForeverAhead, stagedEndOf, DateGrid, usePop, PopBox, FoldBtn, BudgetMeter, BudgetReadout, Stepper, AccentBlock, randomAccent, hexOf, accentTooDark, showingsWord } from '../b3/broadcast.js';
import { isoLocal } from '../b3/state.js';
import { MediaWell, Chip, useStageMin, StageMinBtn, StageMini } from '../b4/form.js';
import { CharCount } from '../gates/lib.js';

// 🔴 NO YEAR. toDateString().slice(4) yields "Aug 14 2026"; the design prints "Aug 14" and so does every other date on this page. Four columns wide, on every row, the year is the same digit repeated 16 times and it pushed the whole table's columns out of register against the design. No year and no leading zero: the design prints "Aug 4", toDateString gives "Aug 04 2026".
export const fmtDay = (v) => new Date(v).toDateString().slice(4, 10).trim().replace(/ 0(\d)$/, ' $1');

// ⚠️ THE CONTENT LIFECYCLE, NAMED. An inline object literal inside a render closure is a vocabulary nothing else can see, and this column carries TWO of them — the staging state (StatePill) and this. Kept apart on purpose: `LIVE NOW` is not `SAVED`, and a reader who cannot tell a written-and-over post from a staged-and-not-yet-real one has been told half the answer.
const LIFECYCLE_WORD = { live: 'LIVE NOW', scheduled: 'UPCOMING', expired: 'ENDED' };
// ⚠️ HOISTED ABOVE ITS READER 2026-09-11 18:49 EDT. `BROADCAST_COLUMNS`'s state renderer reads this four lines before it was declared -- a temporal dead zone `node --check` cannot see, which is the whole reason `scripts/tdzRatchet.mjs` exists. It does not throw TODAY only because the read happens inside a render closure that runs long after the module finishes evaluating; make that renderer eager, or hoist the array, and it becomes a crash. The ratchet counted it as one of two NEW findings against a baseline of 27. 🔴 THE MANIFEST AS DESIGN BOARD 2 DRAWS IT (plan pins batch 2 §10.4 G11 rows 1–3, 2026-09-15 00:07 EDT). The name column gives the text the room and draws the announcement's own colour as a 4px embed-style bar at the row's edge; the three date columns and the state column take the board's widths through their col classes. Posted carries its age under the date, a blank Starts reads On posting (upright, never italic), and no end reads No end in amber with an infinity mark. The State column is one TAB: the lifecycle word and its icon, a 3px bar in the state colour and a 9% wash — and a staged row's tab is a dashed outline, which is the shape-carries-state rule in one control. This replaces StatePill beside a lifecycle word (2026-09-10, pin pmtvqq1xg), because two chips for two axes were the "poorly implemented" labels, and the board answered it with one.
const LIFECYCLE = { live: { word: 'Live now', icon: 'radio', c: 'var(--ok)' }, scheduled: { word: 'Upcoming', icon: 'calendar', c: 'var(--sched)' }, expired: { word: 'Ended', icon: 'circle-check', c: 'var(--ink3)' } };
export function lifecycleOf(r) {
    if (LIFECYCLE[r.state]) return r.state;
    const now = Date.now();
    if (r.expiresAt && new Date(r.expiresAt).getTime() <= now) return 'expired';
    return r.startsAt && new Date(r.startsAt).getTime() > now ? 'scheduled' : 'live';
}
const agoText = (v) => { const d = daysBetween(v, Date.now()); return d <= 0 ? 'today' : `${d} day${d === 1 ? '' : 's'} ago`; };
// 2026-09-30 (the accessibility sweep, a11y.md C7): a row opens on Enter, so it is a tab stop, and it is named by the announcement's first line.
export const broadcastRowLabel = (r) => { const t = (String(r.text || '').replace(/^#{1,3}\s+/gm, '').split('\n').find((l) => l.trim()) || 'announcement').trim(); return `Open “${t.slice(0, 80)}”`; };
export const BROADCAST_COLUMNS = [
    // 2026-09-21 19:21 EDT — no longer `editable`: a click on the row opens the editor (Board 4), and a cell never turns into a field.
    { key: 'text', label: 'Announcement', col: 'c-bc-text',
      dotClass: () => 'bcbar', dotStyle: (r) => `--c:${accentOf(r)}`,
      render: (r) => { const full = String(r.text || '').replace(/^#{1,3}\s+/gm, ''); const t = (full.split('\n').find((l) => l.trim()) || '').trim(); const rep = r.repeatCount > 1 ? r.repeatCount : 0;
          // V47 BH, his correction 10:16 EDT ("make it inline with the announcement text"): a repeat is the queue's own chip, after the text, only when it repeats
          return html`<span class="bc-tt"><b title=${full}>${t}</b>${rep ? html`<span class="pb-pill bc-rep" title=${`Each player sees it ${showingsWord(rep)}, once a day at most`}><${Icon} name="repeat" />Shown ${showingsWord(rep)}</span>` : null}</span>`; } },   // 2026-09-27 22:03 EDT: a post is named by its FIRST line (its # heading); the break between heading and body used to vanish
    { key: 'createdAt', label: 'Posted', col: 'c-bc-date', dataKind: 'nums', render: (r) => html`<span class="bcdt">${fmtDay(r.createdAt)}<small>${agoText(r.createdAt)}</small></span>` },
    { key: 'startsAt', label: 'Starts', col: 'c-bc-date', dataKind: 'nums', render: (r) => (r.startsAt ? html`<span class="bcdt">${fmtDay(r.startsAt)}</span>` : html`<span class="bcdt dim">On posting</span>`) },
    { key: 'expiresAt', label: 'Ends', col: 'c-bc-date', dataKind: 'nums', render: (r) => (r.expiresAt ? html`<span class="bcdt">${fmtDay(r.expiresAt)}</span>` : html`<span class="bcdt never"><${Icon} name="infinity" /><span class="w">No end</span></span>`) },
    { key: 'state', label: 'State', col: 'c-bc-state',
      render: (r) => { const l = LIFECYCLE[lifecycleOf(r)];
          // 2026-09-21 19:21 EDT — a staged row is not "Live now" with a dashed edge: it is a pending change, so it says so, in --staged with
          // the Review realm's mark (staged work waits on Review; the sprite has no separate staged glyph). Its left bar stays the tab's own bar; top, right and bottom go dashed (Harkirat, Board 4 intake C7-6).
          if (r.state === 'staged') return html`<span class="btab staged" style="--lc:var(--staged)"><${Icon} name="r-review" /><span class="w">Change staged</span></span>`;
          return html`<span class="btab" style=${`--lc:${l.c}`}><${Icon} name=${l.icon} /><span class="w">${l.word}</span></span>`; } },
];


// The State chips keep the portal's chip with its colour dot (board 2 popup, 13:06 EDT) and carry their counts (§10.4 C1). The words match the Tab in the column, so the filter and the thing it filters say the same thing.
export function broadcastFilters(all) {
    const n = (s) => all.filter((a) => lifecycleOf(a) === s).length;
    return [{ key: 'state', label: 'State', topic: true, options: [
        // The chips carry the same icon as the row's state tab, not a dot (Board 4 intake C7-7).
        { value: 'live', label: 'Live now', hex: 'var(--ok)', icon: LIFECYCLE.live.icon, count: n('live') },
        { value: 'scheduled', label: 'Upcoming', hex: 'var(--sched)', icon: LIFECYCLE.scheduled.icon, count: n('scheduled') },
        { value: 'expired', label: 'Ended', hex: 'var(--ink3)', icon: LIFECYCLE.expired.icon, count: n('expired') },
    ] }];
}

// The topic accent for an announcement is its OWN stored colour (models/Announcement.js's `color`, generated once at creation and never regenerated on edit), so the portal's dot matches the embed Discord actually renders rather than inventing a second palette. ⚠️ NEVER RETURNS NULL. models/Announcement.js makes `color` required, but a document written before that field existed -- or any future partial -- would leave --topic-accent unset, and the rules that consume it pair a fill with #000 ink. --patch is the safe floor (12.53:1 under #000).
export const accentOf = (a) => (typeof a.color === 'number' ? '#' + a.color.toString(16).padStart(6, '0') : 'var(--staged)');

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
export const daysBetween = (a, b) => Math.max(0, Math.floor(
    (new Date(new Date(b).toISOString().slice(0, 10) + 'T00:00:00Z') - new Date(a)) / 86400000));

const relDay = (iso) => {
    const d = daysBetween(iso, Date.now());
    return d <= 0 ? 'today' : `${d} day${d === 1 ? '' : 's'} ago`;
};

// 🔴 CHANGES AHEAD REPLACES "WHAT ONE PLAYER GETS" (plan pins batch 2 §10.4 G3 row 5, popup 2026-09-14 10:33 EDT). The composer now shows the Discord card itself, so this column answers the question the queue cannot: what is about to change. Every future start and every future end, soonest first, as a date tile and the announcement clamped to two lines.
export function ChangesAhead({ all, b3extra = null }) {
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
            ${b3extra}
            ${events.length ? events.slice(0, 6).map((ev, i) => { const d = new Date(ev.at); return html`
                <div class="bchg-i" key=${i} style=${`--gc:${ev.c}`}>
                    <time datetime=${d.toISOString()}><small>${d.toLocaleDateString(undefined, { month: 'short' })}</small>${d.getDate()}</time>
                    <span><b>${(String(ev.a.text || '').replace(/^#{1,3}\s+/gm, '').split('\n').find((l) => l.trim()) || '').trim()}</b><em>${ev.verb}</em></span>
                </div>`; })
            : b3extra ? null : html`<p class="bchg-none">Nothing starts or stops on a date ahead.</p>`}
        </div>`;
}

// 🔴 NO PANEL OF ITS OWN. This opened its own div.panel with its own header row INSIDE the Shell's view panel — a panel nested in a panel, carrying the realm name a second time and a 42px band the design does not draw, which pushed everything below it down by 42px and rendered in the overlay as one page-sized region. The design puts this content directly in the view panel and its summary line at the RIGHT OF THE SWITCHER ROW, which the Shell already exposes as `tools`. The caller passes it there. 🔴 THE ANNOUNCEMENT CARD AS DESIGN BOARD 2 DRAWS IT (plan pins batch 2 §10.4 G3 rows 1–4, 2026-09-15 00:28 EDT). The position number is the delivery order, large, in the card's own colour; the text sits in an enclosure clamped to two lines with Show all; the lifespan is one bar between two equal end boxes, the same length on every card so their windows compare at a glance; the meta and the actions share the last row with the actions bottom right. The explanatory sentence under the stack became the heading "Delivery order" (G1), and a card past the cap still says it waits.
export function queueWindow(live) {
    const now = Date.now();
    let lo = now, hi = now + 7 * 86400000;
    for (const a of live) {
        const s = new Date(a.startsAt || a.createdAt).getTime();
        if (s < lo) lo = s;
        if (a.expiresAt) hi = Math.max(hi, new Date(a.expiresAt).getTime());
    }
    return { lo, hi: Math.max(hi, lo + 86400000), now };
}
export function NowShowing({ live, cap, onEdit, onEditDates, onRemove, b3 = null }) {
    const [openText, setOpenText] = useState(new Set());
    const win = queueWindow(live);
    const pct = (t) => Math.max(0, Math.min(100, ((t - win.lo) / (win.hi - win.lo)) * 100));
    const b3forever = b3 ? live.filter((x) => !x.expiresAt && !stagedEndOf(x, b3.stagedOps)) : [];
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
                        const se = b3 ? stagedEndOf(a, b3.stagedOps) : null;
                        const left = pct(start);
                        const days = daysBetween(a.createdAt, Date.now());
                        const showings = a.repeatCount && a.repeatCount > 1 ? a.repeatCount : 1;
                        return html`
                        <div class=${'qcard' + (waiting ? ' over' : '') + (b3 && !end && !se ? ' b3-forever' : '') + (b3 && se ? ' b3-endstaged' : '')} key=${id} role="listitem" style=${`--c:${accentOf(a)}`}
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
                                    <span class="qbar" aria-hidden="true">
                                        <span class="btrack"></span>
                                        ${b3 && !end && se ? html`<span class="bspan b3-stagedspan" style=${`left:${left}%;width:${Math.max(1, pct(se.getTime()) - left)}%`}></span>` : b3 && !end ? html`<span class="bspan b3-run" style=${`left:${left}%;width:${Math.max(1, pct(win.now) - left)}%`}></span><span class="b3-tail" style=${`left:${pct(win.now)}%`}><${Icon} name="infinity" /></span>` : html`<span class=${'bspan' + (end ? '' : ' open')} style=${end ? `left:${left}%;width:${Math.max(1, pct(end) - left)}%` : `left:${left}%`}></span>`}
                                        <span class="bnow" style=${`left:${pct(win.now)}%`}></span>
                                    </span>
                                    ${end ? html`<span class="bend"><${Icon} name="clock" />${fmtDay(a.expiresAt)}</span>` : b3 && se ? html`<span class="bend b3-staged-end"><${Icon} name="clock" />${fmtDay(se)}</span>` : b3 ? html`<${EndPicker} a=${a} csrfToken=${b3.csrfToken} overlay=${b3.overlay} onStaged=${b3.onStaged} />` : html`<span class="bend nev"><${Icon} name="infinity" />No end</span>`}
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
            <${ChangesAhead} all=${live} b3extra=${b3forever.length ? html`<${ForeverAhead} list=${b3forever} accentOf=${accentOf} daysBetween=${daysBetween} csrfToken=${b3.csrfToken} overlay=${b3.overlay} onStaged=${b3.onStaged} />` : null} />
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
export function commonPrefix(list) {
    if (list.length < 2) return '';
    let n = 0;
    while (n < list[0].length && list.every((t) => t[n] === list[0][n])) n++;
    while (n > 0 && !/\s/.test(list[0][n - 1])) n--;
    return list[0].slice(0, n);
}
// A leading "# ..." is a Discord heading, not part of the name -- the queue preview already treats it that way, so the axis has to as well or the same announcement is called two different things on two views of one page.
const bareText = (t) => (String(t || '').replace(/^#{1,3}\s+/gm, '').split('\n').find((l) => l.trim()) || '').trim();

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
export function HeadsUp({ all, onSetEnd }) {
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

// The shared 6,000-character embed budget every live post competes for (Discord's real limit on total embed content in one message, measured 2026-09-13; §10.3 row 10). Excludes whatever announcement is currently open in the composer, so editing one doesn't count its own old text against its new length.
export const EMBED_BUDGET = 6000;
// 2026-09-26 21:19 EDT: the bot's embed description is the text plus "\n\n-# Posted <t:UNIX:R>" (utils/announcement.js buildAnnouncementEmbed), 28 characters
// with a 10-digit time, and Discord counts the whole description toward the 6,000 (its docs, Embed Limits). So every post costs 28 more than its text.
export const POSTED_LINE = 28;
export function liveSegs(all, excludeId = null) {
    return (all || []).filter((a) => a.state === 'live' && String(a.id || a._id) !== String(excludeId || ''))
        .map((a) => ({ n: (a.text || '').length + POSTED_LINE, c: accentOf(a) }));
}
function otherLiveLength(all, excludeId) {
    return (all || [])
        .filter((a) => a.state === 'live' && String(a.id || a._id) !== String(excludeId || ''))
        .reduce((sum, a) => sum + (a.text || '').length + POSTED_LINE, 0);
}


// The Show-each-player stepper's card glyphs (§10.3 row 3) — one small raised tile per showing.
function RepeatGlyphs({ n }) {
    const count = Math.max(1, Number(n) || 1);
    return html`
        <div class="rp-glyphs" aria-hidden="true">
            ${Array.from({ length: Math.min(count, 8) }, (_, i) => html`<i class="rp-glyph" key=${i}></i>`)}
            ${count > 8 ? html`<span class="rp-more">+${count - 8}</span>` : null}
        </div>`;
}

// Mirrors /manage's real post-announcement modal (text/expiry) plus startsAt, a banner image and a repeat count (pins batch 2, spec §7/§10.3). The Discord-side fields stay authoritative for what the server accepts; this drawer is the richer web equivalent, built per the pins-2 design board (G8).
//
// ⚠️ EDIT AND POST SHARE ONE FORM. `initial` is the announcement object when opened from Broadcast's "Edit"/"Dates and repeats" buttons or HeadsUp's "Set an end date" (null when opened from "+ Post announcement") — pre-fills every field and switches submit() to an announcement.edit op that carries bannerImageUrl and repeatCount (row 8: an edit that omits them would silently wipe them, see core/ops/announcements.js's apply()).
// 2026-09-21 19:21 EDT — `again`: an Ended announcement opens here to be POSTED AGAIN — its fields prefilled, a new post staged, no edit of the old one.
export function PostForm({ initial, again = false, allAnnouncements, onSubmit, onCancel }) {
    const editing = Boolean(initial) && !again;
    const [text, setText] = useState(initial?.text || '');
    // 2026-09-27 22:58 EDT (found opening Edit at 2x): an edit opened with EMPTY date fields, and BoardDate's empty-field branch then cleared the iso it was given —
    // so Edit showed "Optional / In 60 days" for a post ending Dec 31, and staging it would have sent no end. The fields open on the words of the dates it has.
    const dayWords = (v) => new Date(v).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');
    const [startsAt, setStartsAt] = useState(!again && initial?.startsAt ? dayWords(initial.startsAt) : '');
    const [startsIso, setStartsIso] = useState(!again && initial?.startsAt ? String(initial.startsAt).slice(0, 10) : null);
    const [expiresAt, setExpiresAt] = useState(!again && initial?.expiresAt ? dayWords(initial.expiresAt) : '');
    const [expiresIso, setExpiresIso] = useState(!again && initial?.expiresAt ? String(initial.expiresAt).slice(0, 10) : null);
    // "Never ends" is its own switch (row 1, G8) rather than inferred from a blank field, because blank and never are two different real values now (see broadcast.logic.js's buildBroadcastComposerOp).
    const [neverEnds, setNeverEnds] = useState(Boolean(editing && initial && !initial.expiresAt));
    // 2026-09-25 00:29 EDT: the banner is the build drawer's image well — an upload or a link — so its state is that well's shape
    const [bn, setBn] = useState({ imageMethod: initial?.bannerImageUrl ? 'link' : 'up', imageLink: initial?.bannerImageUrl || '', fileName: '', fileSize: '', filePreview: '' });
    const setBanner = (p) => setBn((o) => ({ ...o, ...p }));
    const bannerUrl = (bn.imageMethod === 'link' ? bn.imageLink : bn.filePreview || '').trim();
    // 2026-09-25 01:22 EDT: the card's banner needs its own load state — a link that 404s drew an empty 148px box between the body and the footer (the sweep before v23)
    const [bannerBad, setBannerBad] = useState(false);
    useEffect(() => { setBannerBad(false); }, [bannerUrl]);
    const [repeatCount, setRepeatCount] = useState(initial?.repeatCount || 1);
    // 2026-09-27 21:42 EDT (his v36 intake): the accent is chosen here. A NEW post opens on a fresh colour every time, as the bot would mint one; Edit and Post it again keep
    // the one it has. The card preview, the text box and this post's share of the budget all wear it — never the realm's pink.
    const [color, setColor] = useState(() => (typeof initial?.color === 'number' ? initial.color : randomAccent()));
    const [autoColor, setAutoColor] = useState(!(initial && typeof initial.color === 'number'));
    const accent = hexOf(color);
    // The text box is the queue card's quote box (his: "the list design we already use in the announcement card (preview + footer)"): folded, it wears the
    // accent as the card does; open — by Expand or by typing in it — it is the fields' black with the focus glow round the whole box. Folded each time the drawer opens.
    const [tbOpen, setTbOpen] = useState(false);
    const [tbFocus, setTbFocus] = useState(false);
    const [clamps, setClamps] = useState(false);
    const taRef = useRef(null);
    const twinRef = useRef(null);
    const expanded = tbOpen || tbFocus;
    useLayoutEffect(() => {
        const t = taRef.current;
        if (!t) return;
        const cs = getComputedStyle(t);
        const two = parseFloat(cs.lineHeight) * 2 + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        // measured on a hidden twin, so the box's own height never passes through 'auto' and the fold animates between two real heights
        const ch = twinRef.current ? twinRef.current.scrollHeight : t.scrollHeight;
        setClamps(ch > two + 2);
        t.style.height = `${expanded ? Math.max(150, ch) : two}px`;
    }, [text, expanded]);
    // It opens when a person reaches for it — a press in the box, a key in it, Expand — never on the drawer's own focus on open, so it is folded each time
    // the drawer opens. Collapse folds it without taking the caret away (a blur would hand focus back to the drawer's first field: this one).
    const fold = () => { if (expanded) { setTbOpen(false); setTbFocus(false); } else { setTbOpen(true); if (taRef.current) taRef.current.focus(); } };
    const [busy, setBusy] = useState(false);

    const unresolved = [startsAt.trim() && !startsIso ? 'the start' : '', (!neverEnds && expiresAt.trim() && !expiresIso) ? 'the end' : ''].filter(Boolean);
    // 2026-09-26 20:01 EDT (harden): Discord's modal caps /manage's announcement at 4,000 and the embed description at 4,096 (commands/manage.js), and core's
    // (2026-09-26 21:19 EDT: the description also carries the 28-character Posted line, so the text's real delivery cap is 4,068, and a post past it is rejected with
    // every other post in the same reply — 4,000 keeps a margin under both.)
    // validatePost checks no length — so a longer post staged here could never be edited in /manage and would fail at delivery. Past 4,000 blocks.
    const TEXT_MAX = 4000;
    const overText = text.length > TEXT_MAX;
    const ready = text.trim() && !unresolved.length && !overText && !busy;

    const otherLen = otherLiveLength(allAnnouncements, initial?.id || initial?._id);
    const thisLen = text.length + POSTED_LINE;
    const totalLen = otherLen + thisLen;
    const overBudget = totalLen > EMBED_BUDGET;
    // the rows of the Before staging panel: text (needed, and within 4,000), the dates (readable), the shared budget (a warning only)
    const checks = [
        { k: 'text', to: 'post-text', label: 'Text', tone: !text.trim() || overText ? 'warn' : 'ok',
          say: !text.trim() ? 'Needs its text' : overText ? `${(text.length - TEXT_MAX).toLocaleString()} over the ${TEXT_MAX.toLocaleString()}-character limit` : `${text.length.toLocaleString()} of ${TEXT_MAX.toLocaleString()} characters` },
        { k: 'dates', to: unresolved[0] === 'the end' ? 'post-ends' : 'post-starts', label: 'Dates', tone: unresolved.length ? 'warn' : 'ok',
          say: unresolved.length ? `Needs a readable date for ${unresolved[0]}` : 'Readable' },
        { k: 'budget', to: 'post-text', label: 'Delivery', tone: overBudget ? 'caution' : 'ok',
          say: overBudget ? `With the live posts, ${(totalLen - EMBED_BUDGET).toLocaleString()} over the ${EMBED_BUDGET.toLocaleString()} one message carries` : 'Fits in one message with the live posts' },
    ];

    function submit() {
        setBusy(true);
        const fields = {
            text,
            startsAt: startsIso || null,
            bannerImageUrl: bannerUrl || null,
            repeatCount,
            color,
            // undefined (blank, omit the key) | null (Never ends) | an ISO string (a resolved date).
            expiresAt: neverEnds ? null : (expiresIso || undefined),
        };
        const op = buildBroadcastComposerOp(fields, editing ? initial : null);
        Promise.resolve(onSubmit(op)).then((ok) => { if (ok === false) setBusy(false); });
    }

    // 2026-09-29 13:23 EDT (his V40 class T, "i've already asked 2-3 times"): Text, Accent and Banner are SECTIONS, headed as the build drawer heads Build — the .f-h
    // heading, its size and its rule running to the right, its state chip beside it. Starts, Ends and Show each player stay field labels.
    // 🔴 BOARD 1 · G8, AS DRAWN (Board 4: Collective, 2026-09-21 12:32 EDT). Session 2's port of this drawer kept the fields and lost the design:
    // no thumbnail beside the banner link, no echo under either date, a checkbox where the board has a switch, a thin budget line with
    // its figure on the wrong side, one pink square for the showings, and a preview that printed the raw markdown. This is board 1's
    // markup, class for class, wired to the same state and the same op builder; its look is b1.css (board 1's own rules, scoped .b1).
    const lines = text.split('\n'); const head = /^#{1,3}\s+/.test(lines[0] || '') ? lines[0].replace(/^#{1,3}\s+/, '') : '';
    const body = (head ? lines.slice(1) : lines).join('\n').trim();
    const withCode = (t) => t.split(/(\/[a-z][\w-]*(?:\s[a-z][\w-]*)?)/g).map((part, i) => (i % 2 ? html`<code key=${i}>${part}</code>` : part));
    const shown = Math.max(1, repeatCount);
    const [smin, setSmin] = useStageMin();
    const blockN = checks.filter((c) => c.tone === 'warn').length;
    return html`
        <${Drawer} cls="b1"
                   title=${again ? 'Post it again' : editing ? 'Edit announcement' : 'Post an announcement'} wide onClose=${onCancel}
                   actions=${html`
                       <${StageMini} tone=${blockN ? 'warn' : 'ok'} say=${blockN ? `Before staging: ${checks.filter((c) => c.tone === 'warn').map((c) => c.say.toLowerCase()).join(' · ')}` : 'Ready to stage'} />
                       <button class="b3-btn2" onClick=${onCancel}>Cancel</button>
                       <button class="b3-btn2 go" disabled=${!ready} onClick=${submit}>${busy ? 'Staging…' : (editing ? 'Stage this edit' : 'Stage post')}</button>`}>
            <div class="bed">
                <div class="pb-col b3-fady">
                    <div class="dwfield pb-txf"><h4 class="f-h pb-sech"><span><label for="post-text">Text</label></span>${!text.trim() ? html`<${Chip} tone="warn" icon="triangle-alert">Required<//>` : overText ? html`<${Chip} tone="warn" icon="triangle-alert">Over ${TEXT_MAX.toLocaleString()}<//>` : html`<span class="f-okm" title="Filled"><${Icon} name="check" /></span>`}</h4>
                        <div class=${'pb-enc b4-tb' + (expanded ? ' b4-tbx' : '') + (clamps && !expanded ? ' b4-tbclip' : '')} style=${`--c:${accent}`} onPointerDown=${(e) => { if (e.target.closest('.b4-fold') || expanded) return; setTbFocus(true); requestAnimationFrame(() => { if (taRef.current) taRef.current.focus(); }); }}>
                            <textarea id="post-text" ref=${taRef} rows="2" placeholder="Type a # heading on the first line if you want one."
                                      value=${text} onInput=${(e) => { setText(e.target.value); setTbFocus(true); }} onKeyDown=${(e) => { if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') setTbFocus(true); }} onBlur=${() => setTbFocus(false)}></textarea>
                            <textarea class="b4-tbm" ref=${twinRef} aria-hidden="true" tabindex="-1" readonly value=${text}></textarea>
                            <div class="pb-encf">
                                <div class="b4-tbc"><${CharCount} n=${text.length} cap=${TEXT_MAX} warnAt=${3600} />
                                    <div class=${'pb-meter2 g-fact b3-cc' + (overBudget ? ' over' : '')} aria-label="Delivery budget, each live post in its colour"><${Icon} name="text" />
                                        <${BudgetMeter} segs=${[...liveSegs(allAnnouncements, initial?.id || initial?._id), { n: thisLen, c: accent }]} total=${EMBED_BUDGET} />
                                        <${BudgetReadout} used=${totalLen} total=${EMBED_BUDGET} /></div></div>
                                ${clamps ? html`<${FoldBtn} open=${expanded} onMouseDown=${(e) => e.preventDefault()} onClick=${(e) => { e.stopPropagation(); fold(); }} />` : null}
                            </div></div></div>
                    <div class="dw-grid2" style="gap:0 16px">
                        <${BoardDate} id="post-starts" label="Starts" opt=${!startsAt.trim()} placeholder="Now" hint=${typeof window !== 'undefined' && window.B4_COLLECTIVE ? { icon: 'radio', v: 'Now', q: 'when you commit it' } : null}
                                      rel=${(i) => { const d = Math.round((new Date(`${i}T12:00:00`) - new Date(`${isoLocal()}T12:00:00`)) / 864e5); return d <= 0 ? 'live today' : d === 1 ? 'live tomorrow' : `live in ${d} days`; }}
                                      min=${isoLocal()} value=${startsAt} iso=${startsIso}
                                      onChange=${(v, i) => { setStartsAt(v); setStartsIso(i); }} />
                        <${BoardDate} id="post-expires" label="Ends" opt=${!expiresAt.trim() && !neverEnds} placeholder=${typeof window !== 'undefined' && window.B4_COLLECTIVE ? 'In 60 days' : 'Blank'}
                                      hint=${typeof window !== 'undefined' && window.B4_COLLECTIVE ? { icon: 'clock', v: new Date(new Date(startsIso ? startsIso + 'T12:00:00Z' : Date.now()).getTime() + 60 * 864e5).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', ''), q: '60 days after it starts' } : null}
                                      rel=${(i) => { const d = Math.round((new Date(`${i}T12:00:00`) - new Date(`${startsIso || isoLocal()}T12:00:00`)) / 864e5); return d <= 0 ? 'ends the day it starts' : `shows for ${d} day${d === 1 ? '' : 's'}`; }}
                                      min=${startsIso || isoLocal()} value=${expiresAt} iso=${expiresIso} never=${neverEnds}
                                      onChange=${(v, i) => { setExpiresAt(v); setExpiresIso(i); }}
                                      right=${html`<button type="button" class="pb-sw" role="switch" aria-checked=${neverEnds ? 'true' : 'false'} onClick=${() => setNeverEnds(!neverEnds)}><span class="pb-swt"><i></i></span>Never ends</button>`} />
                    </div>
                    <div class="dwfield"><div class="pb-lrow"><label>Show each player</label></div>
                        <div class="pb-rep">
                            <${Stepper} value=${repeatCount} onChange=${setRepeatCount} />
                            <span class="pb-gapday"><${Icon} name="repeat" />1 a day max</span></div></div>
                    <div class="dwfield pb-accf"><h4 class="f-h pb-sech"><span><label for="post-accent">Accent</label></span>${autoColor ? html`<${Chip} tone="neutral">Auto<//>` : null}${accentTooDark(color) ? html`<${Chip} tone="warn" icon="triangle-alert">Hard to see<//>` : null}</h4>
                        <${AccentBlock} id="post-accent" value=${color} onChange=${(n) => { setColor(n); setAutoColor(false); }} /></div>
                    <div class="dwfield pb-bnf"><h4 class="f-h pb-sech"><span><label>Banner</label></span>${!bannerUrl ? html`<${Chip} tone="neutral">Optional<//>` : null}</h4>
                        <${MediaWell} f=${bn} set=${setBanner} id="post-banner" sources=${['up', 'link']} keyed=${false} what="an image" /></div>
                </div>
                <aside class="bed-side pb-card"><div class="bed-sec f-prev"><h5>In Discord</h5><div class="f-prevsc b3-fady">
                    ${text.trim() ? html`
                        <div class="dcard" style=${`--c:${accent}`}>${head ? html`<div class="pb-h">${head}</div>` : null}
                            ${body ? html`<p>${withCode(body)}</p>` : null}
                            ${bannerUrl ? html`<div class=${'pb-img2' + (bannerBad ? ' pb-bad' : '')} style=${!bannerBad ? `background-image:url(${JSON.stringify(bannerUrl)});background-size:cover;background-position:center` : null}>${bannerBad ? html`<${Icon} name="image" cls="xl" />` : html`<img src=${bannerUrl} alt="" style="display:none" onError=${() => setBannerBad(true)} />`}</div>` : null}
                            <div class="pb-ts">${startsIso ? `Posted ${new Date(startsIso + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Posted now'}</div></div>`
                        : (typeof window !== 'undefined' && window.B4_COLLECTIVE) ? html`<div class="b4-ghostcard" aria-hidden="true"><div class="dcard" style=${`--c:${accent}`}><div class="pb-h">The first line becomes the title</div><p>Everything under it is the body, and <code>/draw prices</code> shows as a command.</p><div class="pb-ts">Posted now</div></div></div><p class="empty">Type the announcement and the card builds itself here.</p>`
                        : html`<p class="empty">Type the announcement and the card builds itself here.</p>`}
                </div></div>
                ${''/* 2026-09-26 20:03 EDT (harden): what stands between this post and Stage, as the build drawer says it — the side column's Before staging panel
                     (.f-stage, b4/form.js), one row per check with the same marks; a row jumps to its field. The footer holds only the buttons. */}
                <div class=${'f-stage pb-ready' + (smin ? ' min' : '')} role="status" aria-live="polite" inert=${smin ? true : null}>
                    <h5><span>${!ready && !busy ? 'Before staging' : 'Ready to stage'}</span><${StageMinBtn} onMin=${() => setSmin(true)} /></h5>
                    <ul>${checks.map((c) => html`<li key=${c.k}><button type="button" class="f-st" onClick=${() => { const el = document.getElementById(c.to); if (el) el.focus(); }}
                            aria-label=${`${c.label}: ${c.say}`}>
                        <span class="f-stm" data-tone=${c.tone}><${Icon} name=${c.tone === 'ok' ? 'check' : 'triangle-alert'} /></span>
                        <span class="f-stn"><b>${c.label}</b></span><span class="f-stw" data-tone=${c.tone}>${c.say}</span></button></li>`)}</ul>
                </div></aside>
            </div>
        <//>
    `;
}

// A date field as board 1 · G8 draws it: the label row (with an optional control on its right), the input, and the echo of what the
// server resolved — ✓ and the day in the ok colour, or the default in dim. Same server parse and debounce as SmartDate.
function BoardDate({ id, label, placeholder, value, iso, onChange, right = null, never = false, dflt = null, opt = false, hint = null, rel = null, min = '' }) {
    const latest = { current: value };
    const pop = usePop({ w: 270, align: right ? 'end' : 'start' });
    const picked = useRef('');
    // 2026-09-27 18:52 EDT: a picked day writes its own words into the field AND its iso, so it is never sent back through the parser
    const pick = (s) => { pop.close(); if (!s) { picked.current = ''; onChange('', null); return; } const t = new Date(`${s}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', ''); picked.current = t; onChange(t, s); };
    useEffect(() => {
        const raw = String(value || '').trim();
        if (!raw) { onChange(value, null); return undefined; }
        if (raw === picked.current) return undefined;
        const t = setTimeout(() => { fetchJson(`/api/parse-date?q=${encodeURIComponent(raw)}`).then((d) => { if (latest.current === value) onChange(value, d.iso || null); }).catch(() => {}); }, 220);
        return () => clearTimeout(t);
    }, [value]);
    const raw = String(value || '').trim();
    const day = (i) => new Date(i + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');
    // 2026-09-27 21:42 EDT (his v36 intake: "i want the *design* of Start/End's hints to be improved"): the line under a date is a READOUT, not a sentence — the date
    // it resolves to first, in ink, then what that means, after a hairline: "Now | goes live when you commit it", "✓ Fri Oct 2 | goes live in 5 days",
    // "Thu Nov 26 | 60 days after it starts". Its mark carries the state: neutral, ok, or warn with the value in warn ink.
    const echo = (tone, icon, v, q) => html`<span class="pb-echo b4-echo" data-tone=${tone}><${Icon} name=${icon} /><b>${v}</b>${q ? html`<i aria-hidden="true"></i><span>${q}</span>` : null}</span>`;
    const mark = !raw ? (opt ? html`<${Chip} tone="neutral">Optional<//>` : null) : iso ? html`<span class="f-okm" title="Readable"><${Icon} name="check" /></span>` : html`<${Chip} tone="warn">Can't read<//>`;
    return html`
        <div class=${'dwfield' + (right ? ' pb-endf' : '')} data-never=${never ? 'true' : 'false'}>
            <div class="pb-lrow"><label for=${id}>${label}</label>${never ? null : mark}${right}</div>
            ${never ? html`<div class="pb-neverval" style="display:flex"><${Icon} name="infinity" />Stays up until you remove it</div>`
                : html`<div class="pb-dfld" ref=${pop.wrap}><input id=${id} type="text" autocomplete="off" spellcheck="false" placeholder=${placeholder} value=${value}
                        onInput=${(e) => onChange(e.target.value, null)} onKeyDown=${(e) => { if (e.key === 'ArrowDown' && !pop.open) { e.preventDefault(); pop.setOpen(true); } }} />
                    <button type="button" class="pb-dbtn" ref=${pop.btn} aria-label=${`Pick the ${label.toLowerCase()} date`} aria-expanded=${pop.open ? 'true' : 'false'} aria-haspopup="dialog" onClick=${() => pop.setOpen(!pop.open)}><${Icon} name="calendar-days" /></button>
                    ${pop.mounted ? html`<${PopBox} p=${pop} w=${270} tone="pink" aria=${`${label} date`}>
                        <${DateGrid} value=${iso || ''} min=${min} onPick=${pick} /><//>` : null}</div>`}
            ${never ? null : !raw ? (hint ? echo('neutral', hint.icon, hint.v, hint.q) : null)
                : iso ? echo('ok', 'check', day(iso), rel ? rel(iso) : null) : echo('warn', 'triangle-alert', 'Try “Friday” or “Oct 2”', null)}
        </div>`;
}

// 🔴 AIRTIME PAINTS THREE BAR STATES AND NAMED NONE OF THEM. Solid is showing, hollow-dashed is scheduled, muted is over -- the same shape vocabulary the Track uses, and a reader met it with no key. ⚠️ Deliberately NOT the shared StateKey: that one teaches "dashed = staged", and here a dashed bar means an announcement that is written and simply has not started yet. Same shape, a neighbouring meaning, and the wrong word would be worse than no word.
//
// ⚠️ It names only states PRESENT on screen, the rule every key in this portal follows: a season with nothing scheduled should not send somebody hunting for a dashed bar that is not drawn.

export function BroadcastRealm({ session }) {
    const [showAdd, setShowAdd] = useState(false);
    const [notice, setNotice] = useState('');
    const [view, setView] = useState('Delivery queue');
    const overlay = useOverlay();
    const p8 = useB3('p8');

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

    // 🔴 `harden` (pins batch 2, §10.3 row 9) — a 403, a CSRF refusal or the op's own validation error (the banner's "needs a full https:// URL" refusal arrives only through this path) resolves to a failure OBJECT, never a throw. The old version never looked, so the drawer closed and said "staged" while nothing had staged and the draft was gone.
    async function handleAdd(op) {
        const res = await stageOps('broadcast', [op], session.csrfToken);
        if (await reportFailure(overlay, res, 'The announcement could not be staged')) return false;
        if (!res.changesetId) { overlay.say(res.error || 'The server refused this announcement.'); return false; }
        setShowAdd(false);
        setEditingAnn(null);
        overlay.say('Announcement staged. Nothing reaches a player until you commit it.', 'Review', () => { location.hash = '#/review'; });
        refresh();
        return true;
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
                  overlaySlot=${html`${overlay.render()}${showAdd ? html`<${PostForm} initial=${editingAnn} allAnnouncements=${data.all} onSubmit=${handleAdd} onCancel=${() => { setShowAdd(false); setEditingAnn(null); }} />` : null}`}
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
                      ${view === 'Delivery queue' ? html`<${NowShowing} live=${data.live} cap=${data.maxPerMessage} onEdit=${openEdit} onEditDates=${openEdit} onRemove=${(a) => confirmBulkDelete([a._id])} b3=${p8 !== 'now' ? { csrfToken: session.csrfToken, overlay, stagedOps: data.stagedOps, onStaged: (msg) => { overlay.say(msg, 'Review', () => { location.hash = '#/review'; }); refresh(); } } : null} />` : html`<${Airtime} all=${data.all} />`}
                  `}
                  
                  stateKey=${false}
                  tools=${html`<span class="key" aria-label="What the marks mean"><span class="l"><i></i>saved</span><span class="s"><i></i>staged</span></span>`}
                  meta=${view === 'Delivery queue' ? html`${p8 !== 'now' ? html`<${NeverChip} n=${data.live.filter((x) => !x.expiresAt && !stagedEndOf(x, data.stagedOps)).length} />` : null}<span class="bqcount"><span class="bqm" aria-hidden="true"><i style=${`width:${Math.min(100, (Math.min(counts.live, data.maxPerMessage) / data.maxPerMessage) * 100)}%`}></i></span><b>${Math.min(counts.live, data.maxPerMessage)}</b> of ${data.maxPerMessage} slots used</span>` : null}
                  noticeSlot=${p8 !== 'now' ? null : html`<${HeadsUp} all=${data.all} onSetEnd=${openEdit} />`}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${BROADCAST_COLUMNS} searchableFields=${['text']}
                                                    label="Manifest" rowLabel=${broadcastRowLabel} selectable=${false} searchPlaceholder="Search the text…" addLabel="+ Post announcement" filterGroups=${broadcastFilters(data.all)}
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
