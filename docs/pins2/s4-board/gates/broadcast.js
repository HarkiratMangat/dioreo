// Board 3 — the Broadcast gates. "Portal today" is the realm's own code; the fixed side is board 2's G3 and G11 as they
// were approved, with this round's pins applied, and board 1's G8 for the drawer.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useRef } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { fetchJson } from '../ui/httpClient.js';
import { useOverlay } from '../ui/overlay.js';
import { Manifest } from '../ui/manifest.js';
import {
    NowShowing, HeadsUp, PostForm, BROADCAST_COLUMNS, broadcastFilters,
    accentOf, fmtDay, daysBetween, commonPrefix, lifecycleOf, POSTED_LINE, EMBED_BUDGET,
} from '../ui/broadcast.js';
import { EndPicker, ForeverAhead, stagedEndOf, ChipPop, DateStage, RepeatStage, FoldBtn, foldEase, useClamps, BudgetMeter, BudgetReadout, showingsWord } from '../b3/broadcast.js';
import { useB3 } from '../b3/state.js';
import { segOpts } from './picks.js';
import { Seg, Stage, PanelHead, useData, Hex, CharCount } from './lib.js';

const load = () => Promise.all([fetchJson('/api/broadcast'), fetchJson('/api/review')])
    .then(([b, r]) => ({ ...b, stagedOps: (r && r.ops) || [] }));

const bare = (t) => String(t || '').replace(/^#{1,3}\s+/gm, '');
// 2026-09-27 21:47 EDT: where one line names a post (Changes ahead, the manifest's Announcement cell), it is its FIRST line — a '# heading' is the title, and the
// line break used to vanish, gluing the heading to the body ("…for Halloween The night mode…").
const titleOf = (t) => (bare(t).split('\n').find((l) => l.trim()) || '').trim();
const LIFE = { live: ['Live', 'radio'], scheduled: ['Upcoming', 'clock'], expired: ['Ended', 'check'], draft: ['Draft', 'pencil'] };
const LIFE_ORDER = ['live', 'scheduled', 'expired'];

// ── B1 · the delivery-queue card, drawn as board 2 draws it, with this round's fixes and the never-ends warning.
// ── 2026-09-27 21:42 EDT (his v36 intake) — ONE CARD PER ANNOUNCEMENT: the live ones in delivery order, then the upcoming, then a staged post. A chip that IS a
// field opens its editor where it sits (the pop-up family, b3/broadcast.js): the End chip (Never or a date) and, before it begins, the Start chip,
// and a showings chip beside "Active for" that is there for one showing too. The quote box folds only when its text runs past its two lines.
function QCard({ a, i = 0, kind, stagedEnd = null, pct, now, session, overlay, onStaged, p8 }) {
    const [isOpen, setOpen] = useState(false);
    const pref = useRef(null);
    const clamps = useClamps(pref, [a.text]);
    const text = bare(a.text);
    const start = new Date(a.startsAt || a.createdAt).getTime();
    const end = stagedEnd ? stagedEnd.getTime() : a.expiresAt ? new Date(a.expiresAt).getTime() : null;   // a staged end is the one to show, over the end it replaces (found staging Jan 9 over Dec 31)
    const days = daysBetween(a.createdAt, now);
    const never = !end;
    const left = pct(start);
    const csrf = session && session.csrfToken;
    const shows = a.repeatCount && a.repeatCount > 1 ? a.repeatCount : 1;
    const editable = kind !== 'staged';
    const endCls = 'pb-end' + (never ? ' g-noend' : '') + (stagedEnd ? ' g-stagedend' : '');
    const endIn = never ? html`<${Icon} name="infinity" />Never` : html`<${Icon} name="clock" />${fmtDay(end)}`;
    const stageProps = { a, csrfToken: csrf, overlay, onStaged };
    return html`
        <div class=${'pb-card g-card' + (never ? ' g-never' : '') + (stagedEnd ? ' g-staged' : '') + (kind !== 'live' ? ` g-k-${kind}` : '')} style=${`--c:${accentOf(a)}`}>
            ${kind === 'live' ? html`<span class="pb-numr">${i + 1}</span>`
                : html`<span class="pb-numr g-numi" title=${kind === 'upcoming' ? 'Upcoming' : 'Staged'}><${Icon} name=${kind === 'upcoming' ? 'calendar-clock' : 'plus'} /></span>`}
            <div class="pb-body">
                <div class=${'pb-enc' + (isOpen ? ' g-open' : '') + (clamps ? '' : ' g-fits')} data-open=${isOpen ? 'true' : 'false'} onClick=${(e) => { if (clamps) foldEase(e.currentTarget, () => setOpen(!isOpen)); }}>
                    <p ref=${pref}>${text}</p>
                    <div class="pb-encf">
                        <${CharCount} n=${text.length} cap=${4000} warnAt=${3600} />
                        ${clamps ? html`<${FoldBtn} open=${isOpen} onClick=${(e) => { e.stopPropagation(); setOpen(!isOpen); }} />` : null}
                    </div>
                </div>
                <div class="pb-life3">
                    <div class="pb-tl">
                        <span class="b3-dt"><em>Start</em>${kind === 'upcoming'
                            ? html`<${ChipPop} tone="accent" btnCls="pb-end g-chipbtn" aria=${`Change the start date, ${fmtDay(start)}`} btn=${html`<${Icon} name="calendar-days" />${fmtDay(start)}`}
                                    body=${(close) => html`<${DateStage} ...${stageProps} field="startsAt" close=${close} />`} />`
                            : html`<span class="pb-end"><${Icon} name="calendar-days" />${fmtDay(start)}</span>`}</span>
                        <div class="pb-bar">
                            <span class="pb-track"></span>
                            ${never
                                ? html`<span class="pb-span g-run" style=${`left:${left};right:0`}></span><span class="g-tail" aria-hidden="true"></span>`
                                : html`<span class=${'pb-span' + (stagedEnd || kind === 'staged' ? ' g-stagedspan' : '')} style=${`left:${left};width:calc(${pct(end)} - ${left})`}></span>`}
                            <span class="pb-now" style=${`left:${pct(now)}`} title=${`Up ${days} days`}></span>
                        </div>
                        <span class="b3-dt b3-dt-e"><em>End</em>${editable
                            ? html`<${ChipPop} align="end" tone=${never ? 'warn' : 'accent'} btnCls=${`${endCls} g-chipbtn`} aria=${never ? 'Set an end date — it never ends' : `Change the end date, ${fmtDay(end)}`} btn=${endIn}
                                    body=${(close) => html`<${DateStage} ...${stageProps} field="expiresAt" close=${close} />`} />`
                            : html`<span class=${endCls}>${endIn}</span>`}</span>
                    </div>
                    <div class="pb-dates">
                        ${kind === 'live' ? html`<span class="pb-pill"><${Icon} name="clock" />Active for ${days}d</span>`
                            : kind === 'upcoming' ? html`<span class="pb-pill g-soon"><${Icon} name="calendar-clock" />Starts in ${Math.max(1, daysBetween(now, start))}d</span>`
                            : html`<span class="b3-staged">Staged</span>`}
                        ${editable
                            ? html`<${ChipPop} w="auto" tone="accent" btnCls="pb-pill g-chipbtn" aria=${`Change how many times each player sees it — ${showingsWord(shows)}`}
                                    btn=${html`<${Icon} name="repeat" />Shown ${showingsWord(shows)}`}
                                    body=${(close) => html`<${RepeatStage} ...${stageProps} close=${close} />`} />`
                            : html`<span class="pb-pill"><${Icon} name="repeat" />Shown ${showingsWord(shows)}</span>`}
                        <div class="pb-cacts">
                            ${never && editable && p8 === 'a' ? html`<${EndPicker} a=${a} csrfToken=${csrf} overlay=${overlay} onStaged=${onStaged} cls="b3-endwarn" />` : null}
                            <button type="button" class="pb-ib has-word g-edit" onClick=${() => overlay.say('Board only · this opens the edit drawer, gate B3.')}><${Icon} name="square-pen" />Edit</button>
                            <i class="pb-vr" aria-hidden="true"></i>
                            <button type="button" class="pb-ib pb-del" aria-label=${kind === 'staged' ? 'Discard the staged post' : 'Remove the announcement'} onClick=${() => overlay.say(kind === 'staged' ? 'Board only · this would discard the staged post.' : 'Board only · a removal would stage.')}><${Icon} name="trash-2" /></button>
                        </div>
                    </div>
                </div>
            </div>
            ${a.bannerImageUrl ? html`<img class="pb-ban" src=${a.bannerImageUrl} alt="" loading="lazy" />` : html`<span></span>`}
        </div>`;
}

function QueueTarget({ live, all, cap, stagedOps, stagedPosts, session, overlay, onStaged }) {
    const p8 = useB3('p8');
    const now = Date.now();
    let lo = now, hi = now + 7 * 86400000;
    for (const a of all) {
        const s = new Date(a.startsAt || a.createdAt).getTime();
        if (s < lo) lo = s;
        if (a.expiresAt) hi = Math.max(hi, new Date(a.expiresAt).getTime());
    }
    hi = Math.max(hi, lo + 86400000);
    const pct = (t) => `${Math.max(0, Math.min(100, ((t - lo) / (hi - lo)) * 100))}%`;
    const forever = live.filter((a) => !a.expiresAt && !stagedEndOf(a, stagedOps));
    const upcoming = all.filter((a) => lifecycleOf(a) === 'scheduled');
    const cardProps = { pct, now, session, overlay, onStaged, p8 };

    const events = [];
    for (const a of all) {
        const s = a.startsAt ? new Date(a.startsAt).getTime() : null;
        const e = a.expiresAt ? new Date(a.expiresAt).getTime() : null;
        if (s && s > now) events.push({ at: s, a, verb: 'Starts showing', g: 'in' });
        if (e && e > now) events.push({ at: e, a, verb: 'Stops showing', g: 'out' });
    }
    // a staged post's dates are changes ahead too — once it is committed (board data: B1's `staged`)
    for (const a of stagedPosts || []) { const s = a.startsAt ? new Date(a.startsAt).getTime() : null; if (s && s > now) events.push({ at: s, a, verb: 'Starts showing once committed', g: 'st' }); }
    events.sort((x, y) => x.at - y.at);

    return html`
        <div class="pb-qafter g-queue" data-col="on">
            <div class="g-qcards">${live.map((a, i) => html`<${QCard} key=${String(a._id)} a=${a} i=${i} kind="live" stagedEnd=${stagedEndOf(a, stagedOps)} ...${cardProps} />`)}
                ${upcoming.map((a) => html`<${QCard} key=${String(a._id)} a=${a} kind="upcoming" stagedEnd=${stagedEndOf(a, stagedOps)} ...${cardProps} />`)}
                ${(stagedPosts || []).map((a) => html`<${QCard} key=${String(a._id)} a=${a} kind="staged" ...${cardProps} />`)}</div>
            <div class="pb-cg">
                <h5>Changes ahead</h5>
                ${p8 === 'b' && forever.length ? html`<${ForeverAhead} list=${forever} accentOf=${accentOf} daysBetween=${daysBetween}
                    csrfToken=${session && session.csrfToken} overlay=${overlay} onStaged=${onStaged} />` : null}
                ${events.slice(0, 5).map((ev, i) => { const d = new Date(ev.at); return html`
                    <div class="pb-cgi" data-g=${ev.g} key=${i}>
                        <time datetime=${d.toISOString()}><small>${d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</small>${d.getDate()}</time>
                        <div><b>${titleOf(ev.a.text)}</b><em><${Icon} name=${ev.g === 'in' ? 'radio' : ev.g === 'st' ? 'plus' : 'clock'} />${ev.verb}</em></div>
                    </div>`; })}
                ${!events.length && !(p8 === 'b' && forever.length) ? html`<p class="pb-cgnone">Nothing starts or stops on a date ahead.</p>` : null}
            </div>
        </div>`;
}

function B1({ session }) {
    const [tick, setTick] = useState(0);   // 2026-09-27 22:58 EDT: a stage from the card reloads the queue, so the staged change shows on the card (it waited for a page load)
    const data = useData(load, [tick]);
    const b1 = useB3('b1');
    const overlay = useOverlay();
    const [view, setView] = useState('Delivery queue');
    if (!data) return html`<p class="g-wait">Loading the dev database…</p>`;
    const live = data.live || [];
    const cap = data.maxPerMessage || 10;
    const forever = live.filter((a) => !a.expiresAt && !stagedEndOf(a, data.stagedOps)).length;
    const budgetSegs = live.map((a) => ({ n: (a.text || '').length + POSTED_LINE, c: accentOf(a) }));
    const budgetUsed = budgetSegs.reduce((t, x) => t + x.n, 0);
    const meta = html`
        ${''/* 🔴 "Alignment for this element still not fixed and i refuse to look any further into the design board
             until dumb little shit like this is repaired across the board." Measured 2026-09-17 09:59 EDT at 3x, and he is
             right — the readout is `icon · <b>1</b> · "never ends"`, and the bare text node beside the <b> is an
             ANONYMOUS FLEX ITEM. The row is `align-items:center`, so the numeral and the words were each centred as
             their own box: the <b> has line-height 10.5 and a 10.5px box, the text node's natural line box is 14px,
             and centring two boxes of different heights puts their BASELINES 0.25px apart — which at 2x is a visibly
             soft, floating numeral. The contract at the head of board.css names this exact case: a numeral and the
             words that qualify it are WORDS BESIDE WORDS and share a BASELINE; only the icon and the meter, which
             are boxes, share the centre line. `.b3-nw` is the pair. */}
        ${forever ? html`<span class="g-status warn"><${Icon} name="infinity" /><span class="b3-nw"><b>${forever}</b>never ${forever === 1 ? 'ends' : 'end'}</span></span>` : null}
        <span class="g-status"><${Icon} name="list" /><${BudgetMeter} segs=${[{ n: live.length, c: 'var(--r-broadcast)' }]} total=${cap} /><span class="b3-nw"><b>${live.length}</b>of ${cap} slots used</span></span>
        ${''/* 2026-09-27 21:42 EDT (his: "Can we also include the character budget chip beside them … show the specific announcement's accent color to show which announcement is using how much"): the shared 6,000, one segment per live post in its colour */}
        <span class=${'g-status g-budget' + (budgetUsed > EMBED_BUDGET ? ' warn' : '')} title="What the live posts use of the 6,000 characters one delivery carries"><${Icon} name="text" /><${BudgetMeter} segs=${budgetSegs} total=${EMBED_BUDGET} /><${BudgetReadout} used=${budgetUsed} total=${EMBED_BUDGET} /></span>`;
    return html`
        <${Stage} scroll=${true}>
            ${overlay.render()}
            ${b1 === 'now' ? html`<${HeadsUp} all=${data.all} onSetEnd=${() => overlay.say('Board only · this opens the edit drawer.')} />` : null}
            <section class=${'panel g-bpanel' + (b1 === 'fixed' ? ' g-fixedhead' : '')}>
                <${PanelHead} realm="Broadcast" views=${['Delivery queue', 'Airtime']} value=${view} onSet=${setView} meta=${meta} />
                ${view !== 'Delivery queue'
                    ? html`<p class="g-else">The board draws the delivery queue. Airtime is unchanged by this proposal.</p>`
                    : b1 === 'now'
                        ? html`<${NowShowing} live=${live} cap=${cap} onEdit=${() => overlay.say('Board only · edit drawer.')}
                                              onEditDates=${() => overlay.say('Board only · dates drawer.')}
                                              onRemove=${() => overlay.say('Board only · a removal would stage.')} b3=${null} />`
                        : html`<${QueueTarget} live=${live} all=${data.all} cap=${cap} stagedOps=${data.stagedOps} stagedPosts=${data.staged || []}
                                               session=${session} overlay=${overlay} onStaged=${(msg) => { overlay.say(msg); setTick((t) => t + 1); }} />`}
            </section>
        <//>`;
}

// ── B2 · the broadcast manifest, spaced as board 2 draws it.
function RowsTarget({ all }) {
    const [sort, setSort] = useState({ k: 'posted', d: 'desc' });
    const [state, setState] = useState('ALL');
    const prefix = commonPrefix(all.map((a) => titleOf(a.text))).length;
    const rows = all.map((a) => ({ a, life: lifecycleOf(a) })).filter((r) => state === 'ALL' || r.life === state);
    const counts = { live: 0, scheduled: 0, expired: 0 };
    all.forEach((a) => { counts[lifecycleOf(a)] = (counts[lifecycleOf(a)] || 0) + 1; });
    const head = (k, label) => html`
        <button type="button" class="pb-sort" aria-sort=${sort.k === k ? (sort.d === 'asc' ? 'ascending' : 'descending') : 'none'}
                onClick=${() => setSort({ k, d: sort.k === k && sort.d === 'asc' ? 'desc' : 'asc' })}>
            ${label}<${Icon} name=${sort.k === k ? (sort.d === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-up-down'} /></button>`;
    const dir = sort.d === 'asc' ? 1 : -1;
    const val = (r) => (sort.k === 'text' ? bare(r.a.text) : sort.k === 'starts' ? (r.a.startsAt || r.a.createdAt) : sort.k === 'ends' ? (r.a.expiresAt || '') : sort.k === 'state' ? r.life : r.a.createdAt);
    rows.sort((x, y) => String(val(x)).localeCompare(String(val(y))) * dir);
    return html`
        <div class="g-bman">
            <div class="pb-tools">
                <div class="pb-t1">
                    <span class="pb-lab">Manifest</span>
                    <label class="pb-srch"><${Icon} name="search" /><span class="sr">Search the text</span><input data-bare placeholder="Search the text" /></label>
                    <button type="button" class="chip go pb-add"><${Icon} name="plus" />Post announcement</button>
                </div>
                <div class="pb-t2">
                    <span class="pb-grp"><span class="pb-lab">State</span>
                        <button type="button" class="chip" aria-pressed=${state === 'ALL' ? 'true' : 'false'} onClick=${() => setState('ALL')}>All</button>
                        ${LIFE_ORDER.map((k) => html`
                            <button type="button" class="chip topic" key=${k} style=${`--c:${k === 'live' ? 'var(--ok)' : k === 'scheduled' ? 'var(--sched)' : 'var(--ink3)'}`}
                                    aria-pressed=${state === k ? 'true' : 'false'} onClick=${() => setState(state === k ? 'ALL' : k)}><i></i><span class="b3-nw">${LIFE[k][0]}<em>${counts[k] || 0}</em></span></button>`)}
                    </span>
                </div>
            </div>
            <div class="pb-heads pb-bc">
                <span>${head('text', 'Announcement')}</span><span>${head('posted', 'Posted')}</span><span>${head('starts', 'Starts')}</span>
                <span>${head('ends', 'Ends')}</span><span>${head('state', 'State')}</span><span></span>
            </div>
            ${rows.map(({ a, life }) => html`
                <div class="pb-br" key=${a._id} style=${`--c:${accentOf(a)}`}>
                    <div class="pb-bt"><b>${titleOf(a.text).slice(prefix)}</b></div>
                    <span class="pb-dt">${fmtDay(a.createdAt)}<small>${daysBetween(a.createdAt, Date.now())} days ago</small></span>
                    <span class=${'pb-dt' + (a.startsAt ? '' : ' pb-dim')}>${a.startsAt ? fmtDay(a.startsAt) : 'On posting'}</span>
                    ${a.expiresAt ? html`<span class="pb-dt">${fmtDay(a.expiresAt)}</span>` : html`<span class="pb-dt pb-never"><${Icon} name="infinity" />No end</span>`}
                    <span class="pb-life" data-l=${life}><${Icon} name=${(LIFE[life] || LIFE.live)[1]} />${(LIFE[life] || LIFE.live)[0]}</span>
                    <button type="button" class="pb-ib pb-del" aria-label="Remove"><${Icon} name="trash-2" /></button>
                </div>`)}
        </div>`;
}

export const BROADCAST_SECTIONS = [
    { id: 'queue', gid: 'B1', realm: 'broadcast', title: 'The delivery queue', sub: 'The card board 2 drew, the panel head it sits in, and the announcement with no end date.',
      pins: [32, 33, 36, 37, 39, 40, 43, 46, 47, 49], Body: B1,
      controls: [['Card', () => html`<${Seg} k="b1" options=${[['now', 'Portal today'], ['fixed', 'Board 2 · G3']]} label="Card" />`],
                 ['Warning', () => html`<${Seg} k="p8" options=${segOpts('p8')} label="Warning" />`]],
      notes: [
          html`<b>The card is board 2’s G3</b>, not the half-port — number, quote box, timeline, pills and actions all back to the drawing (pin 32).`,
          html`<b>The number takes the card’s accent</b>, minted per announcement, and the open bar fades to nothing rather than to black (pins 36, 37).`,
          html`<b>Inside the quote box</b> 14 / 18 / 12, and its footer is a 44px row, text centred, divider dashed, board 2’s unfold mark on Show all (pins 39, 40).`,
          html`<b>Show all loses its hover box</b>, the card’s actions tint inside their own box — edit in ink, delete in red — and the calendar button is gone, Edit carrying its word (pins 43, 47, 49).`,
          html`<b>The panel head</b> sits on <${Hex} v="#161E24" /> with a 2px divider, and both readouts — slots used, what never ends — sit inside it in the same soft container (pins 46, 33).`,
      ] },
];
