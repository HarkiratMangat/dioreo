// portal/ui/home.js — ESM. Home: what needs you.
//
// 🔴 EVERY NUMBER HERE IS DERIVED FROM THE SAME ENDPOINTS THE REALM PAGES USE, and that is the whole design rule rather than an implementation convenience. A home screen that counts rows with its own query is a home screen that can disagree with the page it links to — you read "3 flagged" here, open Armory, and find four. So Home fetches the realms' own endpoints and applies the realms' own predicates; it adds no server route and no second source of truth.
//
// ⚠️ THE MASTHEAD FIGURES DO NOT REPEAT THE RAIL. The masthead answers WHAT IS THE STATE; the rail answers WHERE DO I GO and carries no counts at all. Putting a figure on both rebuilds the cards-versus-list defect one level up.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead } from './shell.js';
import { fetchJson } from './httpClient.js';
import { useAsync, RealmShell } from './async.js';

const dayOf = (v) => String(v || '').slice(0, 10);
const fmtDay = (iso) => new Date(dayOf(iso) + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const dday = (from, to) => Math.round((new Date(dayOf(to) + 'T00:00:00Z') - new Date(dayOf(from) + 'T00:00:00Z')) / 86400000);
const todayIso = () => (typeof document !== 'undefined' && document.documentElement.dataset.today)
    || new Date().toISOString().slice(0, 10);

// Every dated thing in the season as ONE list, which is what both clock columns read. The realms keep their arrays separate because each has its own schema; Home only ever asks "when".
function seasonItems(live) {
    if (!live) return [];
    const out = [];
    for (const [key, lane] of [['newDraws', 'draw'], ['returningDraws', 'returning']]) {
        for (const d of live[key] || []) out.push({ lane, title: d.title, start: dayOf(d.date), end: dayOf(d.date) });
    }
    for (const c of live.calendar || []) {
        out.push({ lane: (c.category === 'playlist' ? 'playlist' : 'event'), title: c.title, start: dayOf(c.date), end: dayOf(c.endDate || c.date) });
    }
    return out;
}

const LANE_ACCENT = { draw: 'var(--draw)', returning: 'var(--ret)', event: 'var(--ev)', playlist: 'var(--play)' };

// ── THE ATTENTION LIST ────────────────────────────────────────────────────────────────────────
//
// Each row states the ONE thing in a realm that currently wants a person, and links to it. A dashboard that only counts rows makes you open all five realms to find out whether anything is wrong.
function attentionRows({ season, armory, broadcast, review, today }) {
    const out = [];
    const bpEnd = season?.live?.bpEnd;
    if (bpEnd) {
        const past = seasonItems(season.live).filter((i) => i.end && i.end > dayOf(bpEnd));
        if (past.length) {
            out.push({ kind: 'warn', realm: 'season', href: '#/season', n: past.length, of: seasonItems(season.live).length,
                text: `${past.length} item${past.length === 1 ? '' : 's'} outlive${past.length === 1 ? 's' : ''} the battle pass`,
                act: 'clamp or re-date them' });
        }
    }
    const flagged = (armory?.builds || []).filter((b) => (b.coverage || []).some((f) => f !== 'stale-90d'));
    if (flagged.length) {
        out.push({ kind: 'warn', realm: 'armory', href: '#/armory', n: flagged.length, of: (armory?.builds || []).length,
            text: `${flagged.length} build${flagged.length === 1 ? '' : 's'} have something wrong with them`, act: 'open Coverage' });
    }
    const forever = (broadcast?.all || []).filter((a) => a.state === 'live' && !a.expiresAt);
    if (forever.length) {
        out.push({ kind: 'warn', realm: 'broadcast', href: '#/broadcast', n: forever.length, of: (broadcast?.all || []).length,
            text: `${forever.length} announcement${forever.length === 1 ? '' : 's'} will never stop showing`, act: 'give them an expiry' });
    }
    const staged = (review?.ops || []).length;
    if (staged) {
        out.push({ kind: 'stg', realm: 'review', href: '#/review', n: staged,
            text: `${staged} change${staged === 1 ? '' : 's'} staged and not committed`, act: 'review and commit' });
    }
    return out;
}

function AttentionList({ rows }) {
    if (!rows.length) {
        // An empty state that names what it MEANS, not "nothing here".
        return html`
            <ol class="att-list">
                <li class="att-row clear">
                    <span class="att-i">✓</span><span class="att-b"></span>
                    <span class="att-x"><b>Nothing needs you right now.</b><em>Every page matches what the bot is serving.</em></span>
                </li>
            </ol>`;
    }
    return html`
        <ol class="att-list">
            ${rows.map((a, i) => html`
                <a class=${`att-row s-${a.kind}`} href=${a.href} key=${a.text} style=${`--c:var(--r-${a.realm})`}>
                    <span class="att-i" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
                    <span class="att-b" aria-hidden="true"></span>
                    <span class="att-x"><b>${a.text}</b><em>${a.realm} · ${a.act}</em></span>
                    <span class="att-go">
                        ${a.of ? html`<span class="att-sev">${a.n} of ${a.of}</span>` : null}
                        <span class="arw" aria-hidden="true">→</span>
                    </span>
                </a>`)}
        </ol>`;
}

// 🔴 THE CLOCK EARNS ITS TWO LISTS HERE AND ONLY HERE. Harkirat: the ending/starting items are "a feature unique to the home page". Season's clock carries the time and the title and nothing else, because that page IS the season and the detail is one click away there. Home is the overview.
function HomeClock({ season, today }) {
    const [, setTick] = useState(0);
    const moments = seasonMoments(season, today);
    useEffect(() => {
        if (!moments.length) return undefined;
        const id = setInterval(() => setTick((n) => n + 1), 1000);
        return () => clearInterval(id);
    }, [moments.length]);

    if (!moments.length) return html`<section class="hclock"><span class="sc-none">No season deadline set.</span></section>`;
    const next = moments[0], rest = moments.slice(1);
    const p = countdownParts(next.iso, Date.now());
    if (!p || p.past) return html`<section class="hclock"><span class="sc-none">This season has ended.</span></section>`;

    const items = seasonItems(season);
    const upcoming = items.filter((i) => i.start > today && i.start <= next.iso).sort((a, b) => (a.start < b.start ? -1 : 1));
    const ending = items.filter((i) => i.end && i.start <= today && i.end >= today && i.end <= next.iso).sort((a, b) => (a.end < b.end ? -1 : 1));

    const units = [];
    if (p.d > 0) units.push(['d', p.d, p.d === 1 ? 'day' : 'days']);
    if (p.d > 0 || p.h > 0) units.push(['h', p.h, 'hrs']);
    units.push(['m', p.m, 'min']);
    units.push(['s', p.s, 'sec']);

    const rows = (list, dateOf) => list.slice(0, 4).map((i) => html`
        <div class="hc-r" key=${i.title} style=${`--c:${LANE_ACCENT[i.lane] || 'var(--ink4)'}`}><i></i>
            <span class="n">${i.title}</span>
            <span class="w">${dday(today, dateOf(i)) === 0 ? 'today' : `in ${dday(today, dateOf(i))}d`}</span>
        </div>`);

    return html`
        <section class="hclock" aria-label="Season countdown">
            <div class="sclock hc-face" data-tier=${seasonTier(p.d)}>
                <div class="sc-face">
                    ${units.map((u, i) => html`
                        ${i ? html`<span class="sc-sep">:</span>` : null}
                        <span class=${'sc-u' + (u[0] === 's' ? ' sec' : '')}>
                            <b>${u[0] === 'd' ? u[1] : String(u[1]).padStart(2, '0')}</b><i>${u[2]}</i>
                        </span>`)}
                </div>
                <div class="sc-when">${season?.currentSeasonTitle || 'This season'} · until <b>${fmtDay(next.iso)}</b></div>
                ${rest.length ? html`<div class="sc-then">then <b>${rest[0].lines.map((L) => L.label).join(' ')}</b> ${fmtDay(rest[0].iso)}</div>` : null}
            </div>
            <div class="hc-cols">
                <div class="hc-col">
                    <h3>Still to drop <b>${upcoming.length}</b></h3>
                    ${upcoming.length ? rows(upcoming, (i) => i.start) : html`<p class="hc-none">Nothing else releases before then.</p>`}
                    ${upcoming.length > 4 ? html`<p class="hc-more">${upcoming.length - 4} more</p>` : null}
                </div>
                <div class="hc-col">
                    <h3>Stops by then <b>${ending.length}</b></h3>
                    ${ending.length ? rows(ending, (i) => i.end) : html`<p class="hc-none">Nothing running ends before then.</p>`}
                    ${ending.length > 4 ? html`<p class="hc-more">${ending.length - 4} more</p>` : null}
                </div>
            </div>
        </section>`;
}

// 🔴 THE PORTAL'S ACTUAL SUBJECT, AND HOME DID NOT ANSWER IT. The attention list says what is WRONG and the clock says how long the season has; neither says what a player opening the bot this second would be shown. Those are three different questions and the third is the one the whole console exists to control.
//
// ⚠️ IT IS NOT A SECOND AUTHORITY OVER THE ATTENTION LIST. That list is EXCEPTIONS — things that want a person. This is CURRENT STATE, which is true and boring most days. Merging them would mean either the exceptions drown in routine rows or the routine rows get dressed as problems.
//
// ⚠️ AND IT RE-USES `seasonItems`, never its own filter. Home already learned this the expensive way in the mockup: two copies of one predicate on one page reported different numbers for the same collection, and the fix is that there is only ever one derivation to read.
const endsIn = (iso, today) => {
    const d = dday(today, iso);
    if (d < 0) return 'ended';
    if (d === 0) return 'ends today';
    return `ends in ${d}d`;
};

function LiveNow({ season, broadcast, today }) {
    const SHOW = 5;
    const items = seasonItems(season)
        .filter((i) => i.start <= today && (i.end || i.start) >= today)
        .sort((a, b) => ((a.end || a.start) < (b.end || b.start) ? -1 : 1));
    const anns = (broadcast?.live || []).length ? broadcast.live : (broadcast?.all || []).filter((a) => a.state === 'live');

    return html`
        <div class="hlive">
            <div class="lp">
                <h2>Running right now</h2>
                <p class="lsub">What a player opening the bot this second would be shown.</p>
                ${items.slice(0, SHOW).map((i) => html`
                    <div class="lrow" key=${i.title + i.start} style=${`--c:${LANE_ACCENT[i.lane] || 'var(--ink4)'}`}>
                        <i class="ld"></i>
                        <span class="lt">${i.title}</span>
                        <!-- "hot" is two days out, the same threshold the attention list uses for a deadline. A colour that fires on a different number than the list beside it teaches the reader that neither can be trusted. -->
                        <span class=${'lw' + (i.end && dday(today, i.end) <= 2 ? ' hot' : '')}>
                            ${i.end && i.end !== i.start ? endsIn(i.end, today) : 'today'}
                        </span>
                    </div>`)}
                ${items.length > SHOW ? html`
                    <p class="lmore">${items.length - SHOW} more running · <a href="#/season">open the Track</a></p>` : null}
                ${!items.length ? html`
                    <p class="lmore">Nothing is scheduled for today. The season runs, but no draw, event or playlist
                        opens or closes.</p>` : null}
            </div>
            <div class="lp">
                <h2>Showing to players</h2>
                <p class="lsub">Announcements the bot is attaching to its replies.</p>
                ${anns.length ? anns.map((a) => html`
                    <div class="lrow" key=${a._id || a.text} style="--c:var(--patch)">
                        <i class="ld"></i>
                        <span class="lt">${a.text || a.title || html`<span class="none">untitled announcement</span>`}</span>
                        <!-- 🔴 NO EXPIRY IS THE HOT STATE, not the calm one. An announcement with no expiresAt value never stops on its own, which is the single defect Broadcast's own attention row exists to report — so it reads hot here for the same reason. -->
                        <span class=${'lw' + (a.expiresAt ? '' : ' hot')}>
                            ${a.expiresAt ? endsIn(String(a.expiresAt).slice(0, 10), today) : 'never ends'}
                        </span>
                    </div>`)
                : html`<p class="lmore">No announcement is showing. Replies go out with nothing attached.</p>`}
                <p class="lmore"><a href="#/broadcast">Open Broadcast</a></p>
            </div>
        </div>`;
}

// ⚠️ IT OFFERS THE WAY BACK, NOT THE VERBS. The mockup puts "Discard all" here beside "Review & commit"; the portal does not, because Review is the only screen that commits and discarding everything from a summary strip — with no list of what is about to go — is the one shape of that button nobody should press. The count and the route are what this can honestly carry.
function Resume({ ops }) {
    if (!ops.length) return null;
    const realms = new Set(ops.map((o) => o.realm || 'season'));
    return html`
        <div class="hres">
            <b>${ops.length} staged change${ops.length === 1 ? '' : 's'}</b>
            <span>across ${realms.size} realm${realms.size === 1 ? '' : 's'} — nothing is live until you commit them.</span>
            <span class="sp"></span>
            <a class="chip go" href="#/review">Review & commit</a>
        </div>`;
}

export function HomeRealm({ session }) {
    // In parallel: four realms' own endpoints. A realm the signed-in admin cannot see answers with `forbidden`, which reads here as "no rows from there" rather than an error — Home must render for a delegated admin who holds one page. Only the SESSION being gone is fatal, which is why season's signedOut is the one answer allowed to fail the whole page.
    const load = useAsync(() => Promise.all(['/api/season', '/api/armory', '/api/broadcast', '/api/review'].map((path) => fetchJson(path)))
        .then(([season, armory, broadcast, review]) => (season.signedOut ? season : { season, armory, broadcast, review })), []);
    const data = load.data;

    if (!data) return html`<${RealmShell} realm="home" session=${session} error=${load.error} slow=${load.slow}
                                          onRetry=${load.reload} skeleton=${{ rows: 5, lines: [12, 46, 20] }} />`;

    const today = todayIso();
    const rows = attentionRows({ ...data, today });
    const live = (data.broadcast?.live || []).length;
    const staged = (data.review?.ops || []).length;

    // The LEAD is "needs you", because that is what this page IS. Its colour is the state it reports — warn when there is something, plain ink at zero — which is the same rule every other masthead follows. A zero lead keeps its SIZE and drops its COLOUR.
    const stats = [
        { value: rows.length, label: 'needs you', lead: true, accent: rows.length ? 'var(--warn)' : 'var(--ink)' },
        // The two non-lead figures carry their own state rather than plain ink: a live count reads in the live colour and a staged count in the staged one, which is the same shape-and-colour rule every mark in this portal follows. A zero keeps its size and drops its colour. ⚠️ NO `tone: 'live'` HERE, AND THE ABSENCE IS THE POINT. It was added to clear a coverage entry and there is no `.stat.live` rule anywhere — `.stat.stg .v` and `.stat.warn .v` exist, `.stat.live` does not — so the class styled nothing and existed only to make a number move. The live figure reads in plain ink because that is what the design gives it.
        { value: live, label: 'live now' },
        { value: staged, label: 'staged', tone: staged ? 'stg' : undefined },
    ];

    return html`
        <${Shell} realm="home" session=${session} badges=${{ review: staged }}
                  commands=${rows.map((a) => ({
                      label: a.text, group: a.realm, local: true, accent: `var(--r-${a.realm})`,
                      keywords: ['needs', 'attention', 'fix', a.act], run: () => { location.hash = a.href.slice(1); },
                  }))}
                  masthead=${html`<${Masthead} eyebrow=${html`<span class="job">Dioreo admin</span>`}
                                               title="What needs you" stats=${stats} />`}
                  viewSlot=${html`
                      <div class="home">
                          <${AttentionList} rows=${rows} />
                          <${Resume} ops=${data.review?.ops || []} />
                          <${HomeClock} season=${data.season?.live} today=${today} />
                          <${LiveNow} season=${data.season?.live} broadcast=${data.broadcast} today=${today} />
                      </div>`} />`;
}
