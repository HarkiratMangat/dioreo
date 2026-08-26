// portal/ui/analytics.js — ESM. The Analytics realm: Health/Usage/Timing over one filterable event river as the Manifest, with revert as its one action.
//
// 🔴 THIS WAS THE LARGEST MOCKUP-VS-LIVE GAP IN THE PORTAL, and it was never a styling gap. The tab shipped as three <pre> blocks holding the raw /bot analytics TEXT exports — the Discord command's own output pasted into a web page. 06-access-and-analytics.html specs a dashboard: a Health/Usage/ Timing switcher, KPI tiles with sparklines, and a filterable event river with kind and source chips. Session A's Phase 1 addendum named the difference correctly: "a missing-dashboard-FEATURE gap, not a missing-style gap — the two are different programs, not one under-styled version of the other." Built at Harkirat's call, 2026-08-23 15:00 EDT.
//
// The river needed NO API change at all: /api/analytics has always returned it as structured JSON and this component was throwing the structure away into a <pre>. Only the tiles needed new data.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from './icons.js';
import { Shell, NoAccess, Masthead } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { useOverlay } from './overlay.js';

const KIND_LABEL = { change: 'CHANGE', alert: 'ALERT', boot: 'BOOT' };

// 🔴 NO "p50", "p95" OR "HEADROOM" REACHES A READER ON THIS PAGE, AND THAT IS A RULING, NOT A STYLE PREFERENCE. Harkirat, on the version of the Discord panel that shipped an hour before he read it: "literally no clue what p50, p95, 99% headroom even mean. they look like jargon to me. not intuitive." He is the only person who will ever open this screen, so a page fluent in a dialect its sole reader does not speak is a broken page. commands/bot.js already carries the translations and the portal inherits them rather than inventing a second set: the median becomes "usually", and the 95th percentile becomes "slowest 1 in 20" — which is NOT the worst case, a simplification that is tempting and false.
const USUALLY = 'usually';
const SLOWEST = 'slowest 1 in 20';

// The prose sits here and the ENUM does not: outcomeKeys/entryKeys arrive in the payload from models/AnalyticsRollup, because the Outcomes panel's whole reading is which outcomes have never once occurred, and a list retyped in a browser file is how the schema's own copy went stale. Labels are a UI concern; the set of things that can happen is not.
const OUTCOME_LABEL = { ok: 'OK', error: 'Error', expired: 'Expired', blocked_by_policy: 'Blocked by policy',
    swallowed_by_cooldown: 'Swallowed by cooldown', rejected_admin: 'Rejected — not admin' };
const ENTRY_LABEL = { slash: 'Slash command', button: 'Button', select: 'Select menu', autocomplete: 'Autocomplete',
    modal: 'Modal submit', synthetic: 'Synthetic', background: 'Background job' };

// Discord's own deadline, not a target invented here. The last bucket edge and the overflow key are the same number on purpose, so the overflow bucket means exactly one thing.
const ACK_LIMIT_MS = 3000;
const ACK_BUCKETS = [0, 100, 250, 500, 1000, 2000, 3000];
const ACK_BUCKET_LABEL = { 0: 'under 100ms', 100: '100–250ms', 250: '250–500ms', 500: '500ms–1s',
    1000: '1–2s', 2000: '2–3s', 3000: 'over 3s — MISSED' };

// 🔴 TEN SECONDS, NOT THREE, AND THE GAP IS DELIBERATE. commands/bot.js records what happened when total duration was measured against the 3,000ms ack deadline: it shipped "/colors -204% headroom" for an image command working exactly as designed, i.e. the page asserted a production fault that did not exist. The deadline is the clock for ACKNOWLEDGING an interaction; once deferred, the window is fifteen minutes. So the marker on a duration bar stays (it is real context for how long the work runs next to how long the answer is owed) and the fault COLOUR is driven from somewhere else entirely — Nielsen's published ~10s "limit of held attention", the same band commands/bot.js already calls a long wait. If the two coincided, a reader would read "past the marker" as "broken", which is the false claim all over again.
const LONG_WAIT_MS = 10000;

const pct = (n, d) => (d ? (n / d) * 100 : 0);
const fmtMs = (ms) => (ms == null ? '—' : ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s` : `${Math.round(ms)}ms`);

// Where the event came from, which is the column that makes "one history, two front doors" true rather than asserted: a ChangeLog row written by the portal and one written by /manage are the same kind of thing from different surfaces, and you can only see that if the surface is a column.
function sourceOf(row) {
    if (row.kind !== 'change') return '—';
    return (row.source || row.via || '').toLowerCase() === 'portal' ? 'PORTAL' : 'DISCORD';
}

function summaryOf(row) {
    if (row.kind === 'alert') return row.title || 'Alert';
    if (row.kind === 'boot') return `restarted — ${row.kind_ || row.bootKind || row.version || 'boot'}`;
    return row.summary || row.target || row.action || 'Change';
}

const RIVER_COLUMNS = [
    { key: 'at', label: 'When', dataKind: 'date', render: (r) => new Date(r.at).toISOString().slice(5, 16).replace('T', ' ') },
    { key: 'kind', label: 'Kind', render: (r) => html`<span class=${'rivk ' + r.kind}>${KIND_LABEL[r.kind] || r.kind}</span>` },
    // ⚠️ The source is PLAIN TEXT in a monospaced column. It used to carry a `.src` chip class with no rule behind it, and a chip here would compete with the kind chip beside it for the same reading — one of the two has to be quieter, and the kind is the one that classifies.
    { key: 'source', label: 'Source', render: (r) => sourceOf(r) },
    { key: 'summary', label: 'What', render: (r) => summaryOf(r) },
    { key: 'actor', label: 'Who', render: (r) => (r.actorId ? String(r.actorId).slice(-6) : 'system') },
];

const RIVER_FILTERS = [
    { key: 'kind', label: 'Kind', options: [
        { value: 'change', label: 'changes' }, { value: 'alert', label: 'alerts' }, { value: 'boot', label: 'boots' },
    ] },
    // 🔴 THIS FILTER IS WHERE THE DELETED ALERT EXPORT WENT. The Alerts pre block held the level and the describe() detail of every alert, and the river was already fetching whole AlertLog documents and throwing both away. Deleting a redundant layer is right; deleting the facts it carried is not — so level becomes a filter and detail becomes searchable, which is strictly more useful than the prose block was, because both compose with the kind filter and the search box.
    { key: 'level', label: 'Level', options: [
        { value: 'error', label: 'errors' }, { value: 'warn', label: 'warnings' },
        { value: 'caution', label: 'caution' }, { value: 'info', label: 'info' },
    ] },
];

// 🔴 `.spark` EXISTS IN THE ADOPTED STYLESHEET AND MEANS SOMETHING ELSE ENTIRELY. The old component emitted `<i style="height:N%">` for a vertical bar chart; app.css's `.spark` is a 6px horizontal progress track whose children are absolutely positioned by `left`/`width`, so every bar collapsed and the chart rendered as a flat line. Nothing errored, the class WAS defined, and `portal:orphans` cannot see this — its question is whether a class exists, not whether it means what the emitter thought.
//
// The honest fix is not a third bar chart: `.lvlbars` is the adopted design's own labelled series, and it is better than the sparkline it replaces because seven anonymous bars become seven NAMED days. A reader could not previously tell which end was today.
function DailyBars({ series = [], label }) {
    if (!series.length) return null;
    const max = Math.max(1, ...series);
    // Newest first, because the question is almost always "what is happening now" and a series read left-to-right made today the LAST thing you reached.
    const rows = series.map((n, i) => ({ n, ago: series.length - 1 - i })).reverse();
    return html`
        <h5>${label}</h5>
        <div class="lvlbars">
            ${rows.map((r) => html`
                <div class="lvlb" key=${r.ago}>
                    <span class="ln">${r.ago === 0 ? 'today' : `−${r.ago}d`}</span>
                    <span class="lt"><i style=${`width:${Math.round((r.n / max) * 100)}%`}></i></span>
                    <span class="lv2">${r.n}</span>
                </div>`)}
        </div>
    `;
}

// A tile is the adopted design's KPI: a label, a figure with its unit set smaller inside it, and one line of context.
//
// 🔴 THE TONE IS A THRESHOLD, NOT "IS THIS NON-ZERO". The mockup's own note records why: `errors ? 'warn' : 'ok'` painted a 99.0% success rate in alarm orange because five events out of 496 failed — and in production there is always at least one, so the tile would have been orange forever. A colour that is on regardless stops carrying information. Green is reserved for a figure with NOTHING against it; everything else is neutral until it is actually a problem.
function Tile({ label, value, unit, sub, tone }) {
    return html`
        <div class=${'tile' + (tone ? ' ' + tone : '')}>
            <span class="tl-k">${label}</span>
            <span class="tl-v">${value}${unit ? html`<i>${unit}</i>` : null}</span>
            ${sub ? html`<span class="tl-s">${sub}</span>` : null}
        </div>
    `;
}

function fmtUptime(since) {
    if (!since) return '—';
    const secs = Math.max(0, Math.round((Date.now() - new Date(since).getTime()) / 1000));
    const d = Math.floor(secs / 86400), hrs = Math.floor((secs % 86400) / 3600);
    return d ? `${d}d ${hrs}h` : `${hrs}h ${Math.floor((secs % 3600) / 60)}m`;
}

// 🔴 REBUILT ON THE ADOPTED DESIGN, AND THE OLD MARKUP HAD NO STYLING AT ALL. `.kpi`, `.kpis`, `.srcline` and `.metrics` were defined in a portal-authored stylesheet that adopting the mockup's app.css deleted, so the whole Health view had been rendering with no rules — four bare stacks of text where the design specifies a tile grid, a split panel and a banner. Nothing errored and every gate passed; `npm run portal:orphans` is the check that can see it.
function Health({ health }) {
    const h = health || {};
    const errors = h.errors24h ?? 0;
    return html`
        <div class="panel" id="health">
            <div class="ph">
                <span class="t">Health</span>
                <span class="rt">read from the bot's own records</span>
            </div>
            <div class="tiles">
                <${Tile} label="Uptime" value=${fmtUptime(h.uptimeSince)} tone=${h.uptimeSince ? 'ok' : ''}
                         sub=${h.uptimeSince ? `since the last ${h.lastBootKind || 'restart'}${h.lastBootVersion ? ' · ' + h.lastBootVersion : ''}` : 'no boot recorded'} />
                <${Tile} label="Errors 24h" value=${errors} tone=${errors === 0 ? 'ok' : errors > 5 ? 'err' : 'warn'}
                         sub=${`${h.noise24h ?? 0} lower-level ${h.noise24h === 1 ? 'alert' : 'alerts'} not counted`} />
                <${Tile} label="RAM at last alert" value=${h.rssPeakMb || '—'} unit=${h.rssPeakMb ? 'MB' : ''}
                         tone=${h.rssPeakMb > 400 ? 'warn' : ''}
                         sub=${h.rssSampleCount ? `highest of ${h.rssSampleCount} ${h.rssSampleCount === 1 ? 'sample' : 'samples'} in 7d` : 'no alerts fired in 7 days'} />
                <${Tile} label="Commands 24h" value=${(h.commands24h ?? 0).toLocaleString()}
                         sub=${`${h.distinctUsers24h ?? 0} distinct users`} />
            </div>
            <div class="hsplit">
                <section class="hpanel">
                    <h4>Restarts</h4>
                    <p class="hp">${h.restarts24h ?? 0} in the last 24 hours, ${h.restarts7d ?? 0} in the last 7 days.
                        A restart is normal after a deploy and is worth a look when it was not one.</p>
                    <${DailyBars} series=${h.spark?.alerts || []} label="Alerts per day" />
                </section>
                <section class="hpanel">
                    <h4>Where these come from</h4>
                    <p class="hp">Uptime and restarts are read from the <code>BootRecord</code> collection; errors and
                        the memory figure come from the <code>AlertLog</code> collection; command counts come from${' '}
                        <code>AnalyticsEvent</code> records, and the river below adds <code>ChangeLog</code> to those three.</p>
                    <${DailyBars} series=${h.spark?.commands || []} label="Commands per day" />
                </section>
            </div>
            <div class="hbanner">
                <span class="hbi"><${Icon} name="clock" cls="sm" /></span>
                <div>
                    <h4>These are the bot's records, not a live reading.</h4>
                    <p>The portal runs as its own process with no gateway connection, so gateway status and live memory
                        are not readable from here. For a live reading, run the <code>/bot analytics</code> command in Discord.</p>
                </div>
            </div>
        </div>
    `;
}

// ══ USAGE ═══════════════════════════════════════════════════════════════════════════════════════
//
// 🔴 THIS REPLACED A <pre> HOLDING THE DISCORD COMMAND'S TEXT EXPORT, and the replacement is the whole change rather than a restyling of it. The text is still generated — by /bot analytics, in Discord, where a downloadable .txt is the right answer — and it is no longer sent here, because a dashboard beside a transcript of itself is two layers saying one thing.
//
// ⚠️ EVERY FIGURE ON THIS VIEW IS PRODUCT TRAFFIC ONLY. computeUsageStats filters isAdmin, so /manage, /bot and /autobuild are absent by design: a self-observing system that counts its own admin traffic reports a product busier than it is. The Timing view does NOT filter them, and that difference is stated there rather than assumed.
//
// ⚠️ THE FOURTH COLUMN IS SHARE, NOT DURATION, AND THE MOCKUP'S IS DURATION. Joining timingStats' per-command figure onto these bars would put an admin-INCLUSIVE number in a product-only row — for /manage the two populations are not close — and the reader has nothing on screen telling them the column changed meaning. Share of the window is derived from the same filtered set as the bar beside it, so the row stays one population throughout. Duration lives on the Timing view, next to the sentence that says who is counted.
function Usage({ stats, outcomeKeys = [], entryKeys = [] }) {
    const byCommand = stats?.byCommand || [];
    const byEntry = stats?.byEntry || [];
    const byOutcome = stats?.byOutcome || [];
    const current = stats?.current ?? 0;
    const previous = stats?.previous ?? 0;
    const top = Math.max(1, ...byCommand.map((c) => c.c));
    const topEntry = Math.max(1, ...byEntry.map((e) => e.c));
    // 🔴 A SHARE INSIDE A BREAKDOWN IS COMPUTED FROM THAT BREAKDOWN, never from a headline figure next to it. Dividing the outcome bars by `current` assumed the two aggregations match on the same $match — they do in production, and the moment anything drifts a bar renders past 100% and is silently clamped by overflow, which looks exactly like a full bar. Its own sum cannot do that.
    const outcomeTotal = Math.max(1, byOutcome.reduce((a, o) => a + o.c, 0));
    const neverSeen = outcomeKeys.filter((k) => !byOutcome.find((o) => o._id === k));
    // The ENTRY set comes from the payload's enum, not from the rows, for the same reason the outcome set does: an entry point nobody has used is a fact, and rows-only would hide it. Ordered by volume with the never-used ones last.
    const entryRows = entryKeys.map((k) => ({ key: k, n: byEntry.find((e) => e._id === k)?.c || 0 }))
        .sort((a, b) => b.n - a.n);

    if (!byCommand.length) {
        return html`
            <div class="panel">
                <div class="ph"><span class="t">Usage — last 7 days</span></div>
                <div class="estate">
                    <span class="eicon"><${Icon} name="clock" cls="xl" /></span>
                    <h4>No command usage in the last 7 days</h4>
                    <p>Only public commands count here — your own ${'/'}manage and ${'/'}bot activity is deliberately
                        excluded, so a quiet week of admin work shows as nothing at all.</p>
                </div>
            </div>`;
    }
    return html`
        <div class="panel">
            <div class="ph">
                <span class="t">Usage — last 7 days</span>
                <span class="rt">${current.toLocaleString()} this week · ${previous.toLocaleString()} the week before</span>
            </div>
            <div class="ubars">
                ${byCommand.map((c) => {
                    const failed = Math.max(0, c.c - (c.ok ?? c.c));
                    // 🔴 A ROW THAT NOBODY TYPED DOES NOT GET A SLASH. The busiest names in this collection are background jobs — cache warms and image renders — and prefixing them made the page assert that /webp_nameplate is a command a person can run. It is not, and there is no way to find that out from anywhere else on the screen.
                    const isJob = (c.bg ?? 0) >= c.c;
                    return html`
                        <div class="ub2" key=${c._id || '?'}>
                            <span class="ubk">${isJob ? c._id || '?' : `/${c._id || '?'}`}</span>
                            <span class="ubt2">
                                <i class="ok" style=${`width:${pct(c.ok ?? c.c, top)}%`}></i>
                                ${failed ? html`<i class="bad" style=${`width:${pct(failed, top)}%`}></i>` : null}
                            </span>
                            <span class="ubv">${c.c.toLocaleString()}${failed
                                ? html`<em class="dn">${failed} failed</em>` : null}</span>
                            <span class="ubt3">${pct(c.c, current).toFixed(pct(c.c, current) < 10 ? 1 : 0)}%</span>
                        </div>`;
                })}
            </div>
            <div class="usplit">
                <div class="uside">
                    <h5>How interactions start</h5>
                    <p class="hp">Seven entry points exist and a command is only one of them. The shape of this list is
                        the shape of the bot: how much of what it does begins with somebody typing, and how much
                        happens on its own. A row above with <b>no slash</b> is one of the latter — a background job,
                        which nobody can run.</p>
                    ${entryRows.map((e) => html`
                        <div class=${'erow' + (e.n ? '' : ' never')} key=${e.key}>
                            <span class="ek">${ENTRY_LABEL[e.key] || e.key}</span>
                            <span class="et"><i style=${`width:${pct(e.n, topEntry)}%`}></i></span>
                            <span class="ev">${e.n || '—'}</span>
                        </div>`)}
                </div>
                <div class="uside">
                    <h5>Outcomes</h5>
                    <!-- The reading is COMPUTED, not typed. Naming the four that had never fired on the day this was written is a comment about a snapshot: the sentence goes stale the first time one of them does fire, and nothing would say so. -->
                    <p class="hp">${outcomeKeys.length} outcomes are possible${neverSeen.length ? html`, and${' '}
                        <b>${neverSeen.length}</b> of them have never once happened —${' '}
                        ${neverSeen.map((k) => (OUTCOME_LABEL[k] || k).toLowerCase()).join(', ')}. That means those
                        paths have not been exercised, not that they cannot fire.` : html`, and every one of them has
                        occurred at least once in this window.`}</p>
                    ${outcomeKeys.map((k) => {
                        const hit = byOutcome.find((o) => o._id === k);
                        return html`
                            <div class=${'erow' + (hit ? '' : ' never')} key=${k}>
                                <span class="ek">${OUTCOME_LABEL[k] || k}</span>
                                <span class="et"><i style=${`width:${hit ? pct(hit.c, outcomeTotal) : 0}%;background:${k === 'ok' ? 'var(--ok)' : 'var(--warn)'}`}></i></span>
                                <span class="ev">${hit ? hit.c.toLocaleString() : '—'}</span>
                            </div>`;
                    })}
                </div>
            </div>
        </div>`;
}

// ══ TIMING ══════════════════════════════════════════════════════════════════════════════════════
//
// Two clocks and one hard deadline. Ack is what Discord judges the bot on; duration is what a person feels. A page that averages them into one "latency" figure hides which of the two is actually at risk, which is why the schema records them separately in the first place.
function Timing({ stats }) {
    const overall = stats?.overall || null;
    const buckets = stats?.ackBuckets || [];
    const byCommand = stats?.byCommand || [];
    const byDep = stats?.byDep || [];
    const ackP = overall?.ackP || [null, null];
    const durP = overall?.durP || [null, null];
    const measured = buckets.reduce((a, b) => a + (b.n || 0), 0);
    // Ranked by how slow, not by how often: the slowest thing is the only one anybody ever describes as "the bot is slow".
    const worst = [...byCommand].sort((a, b) => (b.p?.[0] ?? 0) - (a.p?.[0] ?? 0));
    const worstMs = worst[0]?.p?.[0] || 1;
    const depTop = Math.max(1, ...byDep.map((d) => d.totalMs || 0));
    const emptyBuckets = ACK_BUCKETS.filter((b) => !(buckets.find((x) => x._id === b)?.n));

    if (!measured && !worst.length) {
        return html`
            <div class="panel">
                <div class="ph"><span class="t">Timing — last 7 days</span></div>
                <div class="estate">
                    <span class="eicon"><${Icon} name="clock" cls="xl" /></span>
                    <h4>No timings recorded yet</h4>
                    <p>Every interaction records how long it took to answer and how long it took to finish.
                        This fills in on its own as the bot gets used.</p>
                </div>
            </div>`;
    }
    return html`
        <div class="panel">
            <div class="ph">
                <span class="t">Timing — last 7 days</span>
                <span class="rt">your own admin commands are counted here, unlike Usage</span>
            </div>
            <div class="tim2">
                <section class="hpanel">
                    <h4>Answering — the clock Discord is holding</h4>
                    <p class="hp">Every interaction has to be answered within <b>3 seconds</b> or Discord throws it
                        away and the person sees a failure the bot never gets to explain. This scale is that
                        deadline, not a target invented here.${ackP[0] != null ? html`${' '}
                        ${USUALLY} <b>${fmtMs(ackP[0])}</b>, ${SLOWEST} <b>${fmtMs(ackP[1])}</b>.` : null}</p>
                    <!-- An empty slot is DRAWN rather than left out. Five of seven buckets empty, including the one past the deadline, is the reading of this panel, and a list that silently omits the empty ones cannot say it. -->
                    <p class="gread">${measured
                        ? html`<b>${buckets.find((x) => x._id === 0)?.n || 0} of ${measured}</b> answers land in the
                               first band${emptyBuckets.length
                                   ? html`, and <em>${emptyBuckets.length} of ${ACK_BUCKETS.length} bands are empty</em>${' '}
                                          ${emptyBuckets.includes(ACK_LIMIT_MS) ? '— including the one past the deadline.' : '.'}`
                                   : ' — spread across every band.'}`
                        : 'Nothing has been answered inside this window yet.'}</p>
                    <div class="ackscale">
                        ${ACK_BUCKETS.map((b) => {
                            const n = buckets.find((x) => x._id === b)?.n || 0;
                            return html`
                                <div class=${'ackrow' + (b >= 2000 ? ' danger' : '') + (n ? '' : ' zero')} key=${b}>
                                    <span class="al">${ACK_BUCKET_LABEL[b]}</span>
                                    <span class="at"><i style=${`width:${pct(n, measured || 1)}%`}></i></span>
                                    <span class="av">${n || '—'}</span>
                                </div>`;
                        })}
                    </div>
                </section>
                <section class="hpanel">
                    <h4>Finishing — the clock a person feels</h4>
                    <p class="hp">How long the work itself takes, after the answer. Once an interaction has been
                        answered the bot has <b>fifteen minutes</b> to finish, so nothing here is late — this is
                        simply how long you wait. Each figure is that command's <b>${SLOWEST}</b> run.</p>
                    ${worst.length ? html`
                        <div class="durlist">
                            ${worst.map((c) => html`
                                <div class=${'durrow' + ((c.p?.[0] ?? 0) >= LONG_WAIT_MS ? ' slow' : '')} key=${c._id || '?'}>
                                    <span class="dl">/${c._id || '?'}</span>
                                    <span class="dt2">
                                        <i style=${`width:${pct(c.p?.[0] ?? 0, worstMs)}%`}></i>
                                        <b class="deadline" style=${`left:${Math.min(pct(ACK_LIMIT_MS, worstMs), 100)}%`}></b>
                                    </span>
                                    <span class="dv2">${fmtMs(c.p?.[0])}</span>
                                </div>`)}
                        </div>
                        <p class="hp"><span class="dlkey"></span> marks the 3-second answering deadline. Every command
                            here answers first and works afterwards, so a bar reaching past it is the work taking
                            longer than the answer was owed — not a missed deadline.</p>`
                        : html`<p class="hp">No command has recorded a finish time in this window.</p>`}
                </section>
            </div>
            ${byDep.length ? html`
                <div class="hsplit">
                    <section class="hpanel" style="grid-column:1/-1">
                        <h4>Where the milliseconds go</h4>
                        <p class="hp">Timings are aggregated <b>per dependency name</b>, never per call — that is what
                            keeps the array on each event bounded. Read a row as: what this subsystem costs across the
                            week, when it is used.</p>
                        <!-- 🔴 THE BAR AND THE COLOUR ANSWER DIFFERENT QUESTIONS, AND MERGING THEM PAINTED THE LEADER ORANGE FOREVER. The bar is share of the week's total, so the top row is always full width; a fault colour keyed off that same total (over half the leader) therefore fires on the leader by construction, whatever the numbers are — the same shape as the success-rate tile that was orange at 99% because there is always at least one error. Total is not a speed at all: 52ms across 447 calls and 3.6s across one call are opposite facts. So the colour comes from the per-call average, which IS a speed, and the row states that average so the colour has a visible cause. -->
                        <div class="depbars">
                            ${byDep.map((d) => {
                                const per = d.calls ? d.totalMs / d.calls : d.totalMs;
                                return html`
                                    <div class=${'depb' + (per >= 1000 ? ' slow' : '')} key=${d._id}>
                                        <span class="dn">${d._id}</span>
                                        <span class="dt"><i style=${`width:${pct(d.totalMs, depTop)}%`}></i></span>
                                        <span class="dv">${fmtMs(d.totalMs)}</span>
                                        <span class="dc">${(d.calls || 0).toLocaleString()} call${d.calls === 1 ? '' : 's'}${' '}
                                            · ${fmtMs(per)} each</span>
                                    </div>`;
                            })}
                        </div>
                    </section>
                </div>` : null}
        </div>`;
}

// ══ REACH ═══════════════════════════════════════════════════════════════════════════════════════
//
// 🔴 THE DIMENSION NEITHER SURFACE HAD. context and installType are written on every single event by utils/eventStore.js and had never once been read back — not by /bot analytics, which has no Reach page, and not by the portal. This is the measurement the whole v3 guild-install line exists to answer, and the one Discord itself will never tell you.
function Reach({ rows = [] }) {
    const total = rows.reduce((a, r) => a + r.n, 0);
    const byCtx = ['guild', 'dm'].map((c) => ({ c, n: rows.filter((r) => r.context === c).reduce((a, r) => a + r.n, 0) }));
    const byInstall = [
        { key: 'guild', label: 'Guild install', note: 'the app is added to a server; everyone there can use it' },
        { key: 'user', label: 'User install', note: 'the app travels with one person, into any server and any DM' },
        // Kept as its own row rather than folded into either bar: Discord omits authorizingIntegrationOwners on some interaction types, so this is a real third answer and absorbing it would overstate whichever install kind swallowed it.
        { key: null, label: 'Not reported', note: 'Discord did not say how the app was installed for these' },
    ].map((x) => ({ ...x, n: rows.filter((r) => (r.installType || null) === x.key).reduce((a, r) => a + r.n, 0) }));

    if (!total) {
        return html`
            <div class="panel">
                <div class="ph"><span class="t">Reach — last 7 days</span></div>
                <div class="estate">
                    <span class="eicon"><${Icon} name="user" cls="xl" /></span>
                    <h4>Nobody has used the bot in this window</h4>
                    <p>Reach counts public interactions only. Your own admin work is excluded here for the same
                        reason it is on Usage.</p>
                </div>
            </div>`;
    }
    return html`
        <div class="panel">
            <div class="ph">
                <span class="t">Reach — last 7 days</span>
                <span class="rt">${total.toLocaleString()} public interactions</span>
            </div>
            <div class="reach">
                <section class="hpanel">
                    <h4>Where the interaction happened</h4>
                    <div class="donutrow">
                        ${byCtx.map((x) => html`
                            <div class="dcell" key=${x.c}>
                                <div class="donut" style=${`--p:${pct(x.n, total).toFixed(1)};--c:${x.c === 'dm' ? 'var(--sched)' : 'var(--ok)'}`}>
                                    <b>${pct(x.n, total).toFixed(0)}<i>%</i></b>
                                </div>
                                <span class="dlab">${x.c === 'dm' ? 'Direct message' : 'In a server'}</span>
                                <span class="dsub">${x.n.toLocaleString()} interaction${x.n === 1 ? '' : 's'}</span>
                            </div>`)}
                    </div>
                    <p class="hp">A bot answering privately, one screenful at a time, is a different product from one
                        answering in a channel — and it is not the place to audit a season or bulk-edit an armory.
                        That split is the argument for this portal existing at all.</p>
                </section>
                <section class="hpanel">
                    <h4>How the app was installed</h4>
                    <p class="hp">Whether each interaction came from a server that added the app, or from a person who
                        did. The v3 line made every public command guild-installable while the admin commands stayed
                        user-only — this is the measurement that says whether that landed.</p>
                    ${byInstall.map((x) => html`
                        <div class=${'inrow' + (x.key ? '' : ' muted')} key=${x.label}>
                            <span class="ik">${x.label}</span>
                            <span class="it"><i style=${`width:${pct(x.n, total)}%`}></i></span>
                            <span class="iv">${x.n.toLocaleString()}</span>
                            <span class="inote">${x.note}</span>
                        </div>`)}
                </section>
            </div>
        </div>`;
}

// ══ SEARCH ══════════════════════════════════════════════════════════════════════════════════════
//
// 🔴 THE ONLY FIGURE IN THE SYSTEM THAT DESCRIBES WHAT SOMEBODY WANTED. Everything else on this realm describes what the bot did. A term typed into an autocomplete that matched nothing names something this bot does not have — a missing alias, or a missing feature — and it appears on no other surface, in Discord or here.
function Search({ rows = [] }) {
    const zero = rows.filter((r) => r.zeroResults > 0);
    const picked = rows.reduce((a, r) => a + r.picked, 0);
    return html`
        <div class="panel">
            <div class="ph">
                <span class="t">Search — last 30 days</span>
                <span class="rt">autocomplete sessions only</span>
            </div>
            <div class="srchview">
                <div class="tiles" style="padding:0">
                    <div class="tile">
                        <span class="tl-k">Terms recorded</span><span class="tl-v">${rows.length}</span>
                        <span class="tl-s">distinct autocomplete queries</span>
                    </div>
                    <div class=${'tile ' + (zero.length ? 'warn' : 'ok')}>
                        <span class="tl-k">Returned nothing</span><span class="tl-v">${zero.length}</span>
                        <span class="tl-s">somebody wanted this and did not get it</span>
                    </div>
                    <div class="tile">
                        <span class="tl-k">Picked a result</span><span class="tl-v">${picked}</span>
                        <span class="tl-s">searches that ended in a choice</span>
                    </div>
                </div>
                ${rows.length ? html`
                    <table class="mtable srchtab">
                        <thead><tr>
                            <th>Term</th><th>Command</th><th>Field</th>
                            <th class="ta-r">Searches</th><th class="ta-r">Zero results</th><th class="ta-r">Picked</th>
                        </tr></thead>
                        <tbody>
                            ${rows.map((r) => html`
                                <tr class=${r.zeroResults ? 'zero' : ''} key=${r.term + r.command + r.field}>
                                    <td class="n"><b>${r.term}</b></td>
                                    <td>/${r.command}</td>
                                    <td>${r.field}</td>
                                    <td class="nums ta-r">${r.searches}</td>
                                    <td class=${'nums ta-r' + (r.zeroResults ? ' bad' : '')}>${r.zeroResults || '—'}</td>
                                    <td class="nums ta-r">${r.picked || '—'}</td>
                                </tr>`)}
                        </tbody>
                    </table>`
                    : html`
                        <div class="estate">
                            <span class="eicon"><${Icon} name="search-x" cls="xl" /></span>
                            <h4>No searches recorded yet</h4>
                            <p>This fills only from autocomplete sessions. An empty table means nobody has typed into
                                an autocomplete field in the last 30 days — <b>not</b> that nobody searched.</p>
                        </div>`}
                <div class="bvnote">
                    <b>What this view is for.</b> Every other number in Analytics describes what the bot${' '}
                    <em>did</em>. A search that returned nothing is the only one that describes what somebody${' '}
                    <em>wanted</em> and did not get. That is either a missing alias or a missing feature, and it is
                    invisible everywhere else — including in Discord, where the person simply saw an empty list and
                    moved on.
                </div>
            </div>
        </div>`;
}

export function AnalyticsRealm({ session }) {
    const [data, setData] = useState({ river: [], health: null, usageStats: null, timingStats: null, reach: [], searches: [], outcomeKeys: [], entryKeys: [] });
    const [view, setView] = useState('Health');
    const overlay = useOverlay();
    useEffect(() => { fetchJson('/api/analytics').then(setData); }, []);

    if (data.signedOut || data.forbidden) return html`<${NoAccess} />`;

    async function revert(changeId) {
        await fetchJson(`/api/revert/${changeId}`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } });
        fetchJson('/api/analytics').then(setData);
    }

    // 🔴 THE MOST DANGEROUS BUTTON IN THE PORTAL HAD NO CONFIRMATION AT ALL. Everything else here stages; this one fires immediately against live data, once per selected row, and it is the only control that can undo something a person already committed on purpose. It sat in a bulk-action list beside "Export selection".
    //
    // ⚠️ NOT a typed gate, and that is a judgement rather than an omission: a revert applies the change's own recorded INVERSE, so the safe direction is the one this button goes in — the risk is reverting the WRONG row, which naming the rows answers and typing a word does not.
    function confirmRevert(ids) {
        const chosen = rows.filter((r) => ids.includes(r.id));
        const revertable = chosen.filter((r) => r.kind === 'change');
        overlay.confirm({
            op: 'change.revert', tier: 2, danger: true,
            confirmLabel: revertable.length === 1 ? 'Revert it' : `Revert ${revertable.length} changes`,
            title: revertable.length === 1 ? 'Revert this change?' : `Revert ${revertable.length} changes?`,
            body: html`
                <p class="dw-p">This applies each change's recorded inverse <b>immediately</b> — it does not stage, and
                    the Review screen never sees it. The revert is itself recorded here, so it can be reverted in turn.</p>
                ${chosen.length !== revertable.length ? html`
                    <p class="dw-p"><b>${chosen.length - revertable.length}</b> of the selected rows${' '}
                        ${chosen.length - revertable.length === 1 ? 'is an alert or a restart' : 'are alerts or restarts'},
                        not changes — nothing will happen to ${chosen.length - revertable.length === 1 ? 'it' : 'them'}.</p>` : null}
                <ul class="dw-l">${revertable.slice(0, 6).map((r) => html`
                    <li key=${r.id}>${r.summary}</li>`)}
                    ${revertable.length > 6 ? html`<li>…and ${revertable.length - 6} more</li>` : null}</ul>`,
            onConfirm: () => {
                revertable.forEach((r) => revert(r.id));
                overlay.say(`${revertable.length} change${revertable.length === 1 ? '' : 's'} reverted.`);
            },
        });
    }

    // The row dot carries the event's KIND, matching its chip. Left ungated it rendered 100 identical grey squares, which is a column of noise -- colour has to mean something or it should not be drawn. --patch/--warn/--ret are the same three signals the chips use, so the dot and the chip never disagree.
    const KIND_VAR = { change: '--patch', alert: '--warn', boot: '--ret' };
    // The level default is not cosmetic: a change or a boot carries no level, and an undefined value would make the Level filter silently hide every non-alert row the moment it is touched.
    const rows = data.river.map(r => ({ ...r, id: r.changeId || r.alertId || r._id, state: 'live', topicVar: KIND_VAR[r.kind], summary: summaryOf(r), source: sourceOf(r), actor: r.actorId || 'system', level: r.level || (r.kind === 'alert' ? 'info' : '—') }));
    const h = data.health || {};

    // A lookup, not a ternary chain: three views nested two deep was already at the edge of readable, and this is five.
    const VIEWS = {
        Health: () => html`<${Health} health=${data.health} />`,
        Usage: () => html`<${Usage} stats=${data.usageStats} outcomeKeys=${data.outcomeKeys} entryKeys=${data.entryKeys} />`,
        Timing: () => html`<${Timing} stats=${data.timingStats} />`,
        Reach: () => html`<${Reach} rows=${data.reach} />`,
        Search: () => html`<${Search} rows=${data.searches} />`,
    };
    const viewSlot = (VIEWS[view] || VIEWS.Health)();

    return html`
        <${Shell} realm="analytics" session=${session} view=${view} viewOptions=${['Health', 'Usage', 'Timing', 'Reach', 'Search']} onSetView=${setView}
                  overlaySlot=${overlay.render()}
                  masthead=${html`<${Masthead} title="Analytics" sub="What the bot did, what it cost, and what somebody looked for and did not find."
                                               stats=${[
                                                   { value: fmtUptime(h.uptimeSince), label: 'uptime' },
                                                   { value: h.errors24h ?? 0, label: 'errors 24h', tone: h.errors24h ? 'bad' : undefined },
                                                   { value: (h.commands24h ?? 0).toLocaleString(), label: 'commands 24h', lead: true, accent: 'var(--r-analytics)' },
                                               ]} />`}
                  viewSlot=${viewSlot}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${RIVER_COLUMNS} searchableFields=${['summary', 'title', 'actor', 'detail']}
                                                    title="One history, both front doors" filterGroups=${RIVER_FILTERS}
                                                    headerRight="Alerts, changes and boots are all events — filtering one stream beats switching between four lists."
                                                    emptyText="No changes, alerts or restarts have been recorded yet."
                                                    bulkNote="Immediate — a revert applies the inverse now, and is itself recorded"
                                                    bulkTier=${3} rowNoun=${['event', 'events']}
                                                    bulkActions=${[{ label: 'Revert', danger: true, onClick: confirmRevert }]} />`} />
    `;
}
