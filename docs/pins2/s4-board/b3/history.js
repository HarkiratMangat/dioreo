// Board 3 version 2 — BOARD ONLY. P9: History as a timeline. The rows under their day, every filter working — Kind, Level (back, with its meters), Who, Realm, When and Can be undone — the Who column naming the person, and the undo button on the row it undoes.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { hooks, useB3 } from './state.js';

// E6 · the explanation moves off the page: an info button beside the title opens it, so a reader who knows the page is never slowed.
function Info() {
    const [open, setOpen] = useState(false);
    return html`<span class="b3-info"><button type="button" class="b3-infob" aria-label="About this list" aria-expanded=${open ? 'true' : 'false'} onClick=${() => setOpen(!open)} onBlur=${() => setTimeout(() => setOpen(false), 120)}><${Icon} name="info" /></button>${open ? html`<span class="b3-infocard" role="note"><b>One history, both front doors</b><span>Alerts, changes and restarts are all events here; filter the one stream instead of switching views.</span></span>` : null}</span>`;
}

const KIND = { change: ['Change', 'square-pen', 'var(--info)'], alert: ['Alert', 'triangle-alert', 'var(--warn)'], boot: ['Restart', 'rotate-cw', 'var(--sched)'] };
// 🔴 THE HUES WERE INVERTED AND ONLY THE HUES — 2026-09-17 18:26 EDT. His thread: "error is a faded pink, caution
// a vibrant orange". He is exactly right, and the cause is that the four were picked as a palette rather than as a
// RAMP: `--danger-ink` #FF8A85 is a tint meant for text on a dark plate, while `--warn` #FF7A45 is a full-strength
// signal colour, so the second-quietest level was the loudest thing in the row.
// ⚠️ AND THE FIX IS EXACTLY THIS NARROW. A session today talked itself into "severity carries no order at all, so
// rebuild the meter to encode it" — reasoning off a 62%-scaled crop where a 4px pip cluster is sub-pixel. Opened at
// full size the meter is already right: 4/4 pips for error down to 1/4 for info. That finding was retracted in
// README round 4c and it does NOT need re-deriving. The count was never the defect; the colour was.
// The four now descend in chroma as they descend in level, so the order is visible without reading the words.
const LEVEL = [['error', 4, 'var(--sv-error)'], ['warn', 3, 'var(--sv-warn)'], ['caution', 2, 'var(--sv-caution)'], ['info', 1, 'var(--sv-info)']];
// ROUND 10A (2026-09-20 11:17 EDT): "look at the Realm icons, they don't even match the icons used for those realms."
// Now portal/ui/shell.js's own REALM_ICON paths, carried in the sprite as i-r-*.
const REALM = [['season', 'Season', 'var(--r-season)', /draw|calendar|season|patch|event/i, 'r-season'], ['armory', 'Armory', 'var(--r-armory)', /loadout|build|armory|gun/i, 'r-armory'],
    ['broadcast', 'Broadcast', 'var(--r-broadcast)', /announce|broadcast/i, 'r-broadcast'], ['access', 'Access', 'var(--r-access)', /admin|access|grant/i, 'r-access']];
const realmOf = (r) => { const s = `${r.page || ''} ${r.model || ''}`; const hit = REALM.find((x) => x[3].test(s)); return hit ? hit[0] : null; };
const DAY = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
// A day older than this year says its year; a day in it does not — "Thu, Aug 27" is enough until it is not.
const DAYY = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtDay = (at) => { const d = new Date(at); return (d.getFullYear() === new Date().getFullYear() ? DAY : DAYY).format(d); };
const TIME = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
// How long a burst took, said the way a person would: under a minute is "in under a minute", under an hour is
// minutes, past that it is hours and a remainder. It is the one fact a burst adds to the day header above it.
const burstSpan = (b) => { const m = Math.round((b.newest - b.oldest) / 60000); if (b.rows.length < 2) return ' event'; if (m < 1) return ' in under a minute'; if (m < 60) return ` in ${m} min`; const hh = Math.floor(m / 60), mm = m % 60; return ` in ${hh}h${mm ? ` ${mm}m` : ''}`; };
const dayKey = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? 'unknown' : d.toDateString(); };
const WHEN = [['all', 'All time'], ['1', 'Today'], ['7', '7 days'], ['30', '30 days']];

function Meter({ lv }) {
    const L = LEVEL.find((x) => x[0] === lv) || LEVEL[3];
    return html`<span class="b3-meter" style=${`--sv:${L[2]}`} aria-hidden="true">${[1, 2, 3, 4].map((i) => html`<i key=${i} class=${i <= L[1] ? 'on' : ''}></i>`)}</span>`;
}

export function B3History({ rows, actors, total, onOpen, onRevert, onMore, hasMore, selectedId }) {
    const [q, setQ] = useState('');
    const e6 = useB3('e6');
    const p9 = useB3('p9');
    const [f, setF] = useState({ kind: null, level: null, who: null, realm: null, when: 'all', undo: false });
    useEffect(() => { hooks.historyFilter = (next) => setF({ kind: null, level: null, who: null, realm: null, when: 'all', undo: false, ...next }); return () => { delete hooks.historyFilter; }; }, []);
    const set = (k, v) => setF((p) => ({ ...p, [k]: p[k] === v ? (k === 'when' ? 'all' : null) : v }));

    // 2026-09-21 16:10 EDT — BOARD 4, HIS RULING: an Alert that says "Bot online" in the same minute as a restart is not its own
    // event, it is how that restart ended. On Board 4 (window.B4_COLLECTIVE) the pair folds into the restart row, which
    // carries a "Back online" chip in the kind-chip family; 47 alerts and 26 restarts become 26 restarts and the alerts
    // that were really alerts. Board 3-E keeps the unfolded rows it was approved on.
    if (typeof window !== 'undefined' && window.B4_COLLECTIVE) {
        const isRestart = (r) => r && (KIND[r.kind] ? KIND[r.kind][0] === 'Restart' : /restart|boot/.test(r.kind));
        const isOnline = (r) => r && r.kind === 'alert' && /^bot online$/i.test(String(r.summary || r.title || '').trim());
        const out = [];
        for (let i = 0; i < rows.length; i += 1) {
            const r = rows[i], nx = rows[i + 1];
            if (isRestart(r) && isOnline(nx) && Math.abs(new Date(r.at) - new Date(nx.at)) <= 120000) { out.push({ ...r, online: nx.at }); i += 1; }
            else out.push(r);
        }
        rows = out;
    }
    const whoOf = (r) => (r.actorId ? String(r.actorId) : 'system');
    const nameOf = (id) => (id === 'system' ? 'system' : (actors && actors[id]) || `…${id.slice(-6)}`);
    const now = Date.now();
    const base = rows.filter((r) => !q.trim() || `${r.summary} ${r.title || ''} ${r.target || ''} ${nameOf(whoOf(r))}`.toLowerCase().includes(q.trim().toLowerCase()));
    const pass = (r, skip) => (skip === 'kind' || !f.kind || r.kind === f.kind)
        && (skip === 'level' || !f.level || (r.kind === 'alert' && (r.level || 'info') === f.level))
        && (skip === 'who' || !f.who || whoOf(r) === f.who)
        && (skip === 'realm' || !f.realm || realmOf(r) === f.realm)
        && (skip === 'when' || f.when === 'all' || now - new Date(r.at).getTime() <= Number(f.when) * 86400000)
        && (skip === 'undo' || !f.undo || (r.kind === 'change' && !r.undone));
    const shown = base.filter((r) => pass(r));
    const count = (key, test) => base.filter((r) => pass(r, key) && test(r)).length;
    const people = [...new Set(rows.map(whoOf))].sort((a, b) => (a === 'system') - (b === 'system'));
    const days = [];
    for (const r of shown) { const k = dayKey(r.at); const last = days[days.length - 1]; if (last && last.k === k) last.rows.push(r); else days.push({ k, at: r.at, rows: [r] }); }
    const chips = f.kind || f.level || f.who || f.realm || f.when !== 'all' || f.undo;
    const active = chips || q.trim();

    // ROUND 9A: a chip whose count is 0 would leave nothing standing, so it is not a control — dimmed and inert.
    // Unless it is the pressed one: its own count is taken with its filter skipped, so it can read 0 while pressed
    // (Today, on a day with nothing), and it must stay clickable to release.
    const chip = (k, v, label, extra = {}) => {
        const pressed = k === 'undo' ? f.undo : f[k] === v;
        const none = extra.n === 0 && !pressed;
        return html`
        <button type="button" class=${'b3-fc' + (extra.cls ? ' ' + extra.cls : '') + (none ? ' none' : '')} key=${k + v} aria-pressed=${pressed ? 'true' : 'false'}
                aria-disabled=${none ? 'true' : null} tabIndex=${none ? -1 : null}
                style=${extra.c ? `--c:${extra.c}` : null} onClick=${() => { if (none) return; k === 'undo' ? setF((p) => ({ ...p, undo: !p.undo })) : set(k, v); }}>
            ${extra.pre || null}${label}${extra.n != null ? html`<em>${extra.n}</em>` : null}
        </button>`; };

    const uniformKind = shown.length > 1 && new Set(shown.map((r) => r.kind)).size === 1;
    const uniformWho = shown.length > 1 && new Set(shown.map((r) => whoOf(r))).size === 1;

    return html`
        <section class=${'panel b3-hi' + (uniformKind ? ' uk' : '') + (uniformWho ? ' uw' : '')} id="history-manifest">
            ${''/* ROUND 10B (2026-09-20 11:20 EDT): "history manifest's header needs a rework. it's layout is so oddly
                  spaced and for some reason it uses a completely different search bar." Both were the same fault. The portal
                  already has a manifest toolbar — ui/manifest.js's `.mtools` > `.mt-r1` (the name, the `.srch` field with its
                  live match count, the create verb) over `.mt-r2` (the filter groups) — and History had grown a parallel one
                  with its own pill-shaped search, its own two-column filter grid and its own spacing. It uses the portal's
                  now, markup for markup, so the field, its icon, its focus ring and its rhythm are the SAME object; the
                  History-only rules that remain are the six-group layout and nothing else. */}
            <div class="mtools b3-hi-tools">
                <div class="mt-r1">
                <span class="mlabel"><span>Events${e6 !== 'now' ? html`<${Info} />` : null}</span></span>
                <span class="srch">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>
                    <label class="sr" for="history-search">Search events</label>
                    <input id="history-search" class=${q.trim() ? 'has-hits' : ''} value=${q} placeholder="Search what happened, or who" onInput=${(e) => setQ(e.target.value)} />
                    ${q.trim() ? html`<span class="mhits" aria-live="polite">${shown.length.toLocaleString()} ${shown.length === 1 ? 'match' : 'matches'}</span>` : null}
                </span>
                ${active ? html`<button type="button" class="b3-btn2 ghost sm" onClick=${() => { setQ(''); setF({ kind: null, level: null, who: null, realm: null, when: 'all', undo: false }); }}><${Icon} name="x" />${chips ? 'Clear filters' : 'Clear search'}</button>` : null}
                </div>
                <div class="mt-r2 b3-hi-f">
                <div class="b3-fg"><span class="b3-fgl">Kind</span>
                    <div class="b3-fgc">${Object.entries(KIND).map(([k, [label, , c]]) => chip('kind', k, `${label}s`, { c, pre: html`<${Icon} name=${KIND[k][1]} />`, n: count('kind', (r) => r.kind === k) }))}</div></div>
                <div class="b3-fg"><span class="b3-fgl">Level</span>
                    <div class="b3-fgc">${LEVEL.map(([lv, , c]) => chip('level', lv, lv[0].toUpperCase() + lv.slice(1), { c, pre: html`<${Meter} lv=${lv} />`, n: count('level', (r) => r.kind === 'alert' && (r.level || 'info') === lv) }))}</div></div>
                <div class="b3-fg"><span class="b3-fgl">Who</span>
                    <div class="b3-fgc">${people.map((id) => chip('who', id, nameOf(id), { pre: id === 'system' ? html`<span class="b3-av sys"><${Icon} name="bot" /></span>` : html`<span class="b3-av">${nameOf(id).slice(0, 1).toUpperCase()}</span>`, n: count('who', (r) => whoOf(r) === id) }))}</div></div>
                <div class="b3-fg"><span class="b3-fgl">Realm</span>
                    <div class="b3-fgc">${REALM.map(([k, label, c, , icon]) => chip('realm', k, label, { c, pre: html`<${Icon} name=${icon} />`, n: count('realm', (r) => realmOf(r) === k) }))}</div></div>
                <div class="b3-fg"><span class="b3-fgl">When</span>
                    <div class="b3-fgc">${WHEN.slice(1).map(([k, label]) => chip('when', k, label, { n: count('when', (r) => now - new Date(r.at).getTime() <= Number(k) * 86400000) }))}</div></div>
                ${''/* ROUND 9A: six groups in three rows of two. Can-be-undone was the WHEN row's tail behind a divider, which
                      made that row the widest thing in column one and pushed column two 43px past the panel — the panel had
                      been growing to fit it. It is its own group, named for the column it filters. */}
                <div class="b3-fg"><span class="b3-fgl">Undo</span>
                    <div class="b3-fgc">${chip('undo', true, 'Can be undone', { pre: html`<${Icon} name="undo-2" />`, n: count('undo', (r) => r.kind === 'change' && !r.undone) })}</div></div>
                </div>
            </div>
            ${''/* ROUND 9B (2026-09-20 09:53 EDT): ONE grid for the whole list — head, day sections and rows are subgrids of it, so
                  every column is exactly as wide as its widest entry and still lines up (the rule the selection list got in
                  version 14, 7e265e57). A day is a <section>: its header, then its rows; under D a day of more than eight
                  events clusters into bursts (a gap over twenty minutes starts one); under E the header is a gutter cell that
                  spans its rows (--n) and stays put while they pass. */}
            <div class="b3-hi-list b3-fady">
            ${shown.length ? html`<div class="b3-hi-h" aria-hidden="true"><span>Time</span><span>Kind</span><span>What</span><span>Who</span><span>Undo</span></div>` : null}
            ${days.map((d) => {
                const bursts = []; let cur = null;
                for (const r of d.rows) { const t = new Date(r.at).getTime(); if (!cur || cur.oldest - t > 20 * 60000) { cur = { newest: t, oldest: t, rows: [] }; bursts.push(cur); } cur.oldest = t; cur.rows.push(r); }
                const burst = p9 === 'd' && d.rows.length > 8;
                const mix = Object.keys(KIND).concat([...new Set(d.rows.map((r) => r.kind))].filter((k) => !KIND[k]))
                    .map((k) => [k, d.rows.filter((r) => r.kind === k).length]).filter(([, n]) => n > 0);
                const oldest = new Date(d.rows[d.rows.length - 1].at), newest = new Date(d.rows[0].at);
                // ROUND 11 — THE STORY, and it is the one structural observation this gate's own record already made
                // and never built. Round 3f, 2026-09-16: "the rows come in pairs that are one story — 3:25 'Deleted X'
                // and 3:22 'Added X, UNDONE', same minute, same name, all the way down. Merging them would be wrong (an
                // audit log's value is that it is complete)." Every screenshot he has sent of this gate shows it: twelve
                // rows that are really six stories, drawn as twelve unrelated events. So nothing merges and nothing
                // hides — the rows are BOUND. Consecutive rows in a day touching the same entity by the same person are
                // one story: their left rails join into a single unbroken bar and the hairline between them goes.
                // ⚠️ The first cut of this block was written as `${''/* … */}`, which is template-literal syntax, and it
                // landed in PLAIN JS inside the day's map — an Uncaught SyntaxError that blanked the whole board. A
                // comment's form follows where it sits, not the file it is in.
                // ROUND 12F (2026-09-20 14:12 EDT) — THE STORY NEVER REACHED THE ROWS THAT NEEDED IT MOST. The key was
                // built from a QUOTED ENTITY, which only a change row has, so 73 of 100 rows could never bind and
                // the guard below skipped them by design. Looked at the alert view and that is the whole finding:
                // nine consecutive rows reading "Bot online" at 9:42, 9:39, 9:38, 9:37, 9:37, 9:35, 9:35, 9:35 and
                // 9:34, each with its own hairline, each its own event to the eye. The design review said the same
                // thing in words — "a crash loop in which three genuinely different alerts are buried". ROUND 11's
                // rule already answers it and was simply pointed at the wrong field: an event with no entity is
                // identified by WHAT IT SAYS. Nothing merges and nothing hides — the run is drawn as one story on
                // one unbroken rail, all nine rows still there and still countable, which is the whole reason the
                // rule binds instead of collapsing. A real alert among the repeats now breaks the rail visibly.
                const key = (r) => `${(String(r.summary || '').match(/"([^"]+)"/) || [])[1] || r.target || String(r.summary || '').trim()}\u0000${whoOf(r)}`;
                const pos = new Map();
                for (let i = 0; i < d.rows.length; i += 1) {
                    const k = key(d.rows[i]);
                    if (!k.startsWith('\u0000')) {
                        const prev = i > 0 && key(d.rows[i - 1]) === k;
                        const next = i < d.rows.length - 1 && key(d.rows[i + 1]) === k;
                        if (prev && next) pos.set(d.rows[i].id, 'st-m');
                        else if (next) pos.set(d.rows[i].id, 'st-a');
                        else if (prev) pos.set(d.rows[i].id, 'st-z');
                    }
                }
                const row = (r) => {
                    const [label, icon, c] = KIND[r.kind] || ['Event', 'history', 'var(--ink3)'];
                    // A column whose value is the same on every visible row is not a column — the same rule the
                    // selection list's mode column got. KIND and WHO both go constant the moment either filter is
                    // set, and they were the LOUDEST things in the row while the event itself sat in plain grey. They
                    // demote to a coloured dot rather than disappearing, so the column still scans and still tells the
                    // truth about being uniform.
                    const realm = REALM.find((x) => x[0] === realmOf(r));
                    const who = whoOf(r);
                    // "Deleted draw" next to an entity carrying a CALENDAR icon says draw twice. The icon is the type,
                    // so the verb drops a trailing type noun and keeps the action — but only when the entity is
                    // actually rendered beside it, or the row would lose the word entirely. (2026-09-16 18:03 EDT)
                    const rawVerb = r.kind === 'change' ? String(r.summary || '').replace(/\s*"[^"]*"\s*/, ' ').trim() : r.summary;
                    const thing = r.kind === 'change' ? (String(r.summary || '').match(/"([^"]+)"/) || [])[1] || r.target : null;
                    const verb = thing ? String(rawVerb).replace(/\s+(draw|build|event|announcement|season|admin|note|patch note)s?$/i, '') : rawVerb;
                    return html`
                    ${''}
                    <div class=${'b3-hi-r' + (pos.get(r.id) ? ' ' + pos.get(r.id) : '') + (selectedId && String(selectedId) === String(r.id) ? ' open' : '')} key=${r.id} style=${`--c:${c}`}
                         onClick=${(e) => { if (!e.target.closest('button')) onOpen(r); }}>
                        <span class="when">${Number.isNaN(new Date(r.at).getTime()) ? '—' : TIME.format(new Date(r.at))}</span>
                        ${''/* ROUND 10C (2026-09-20 11:22 EDT): the KIND column is gone and its mark moved into the phrase.
                             It was the loudest ink in the row and the least informative: twenty-seven of a hundred rows said
                             "Change", the row's own left rail already carries that hue, and the verb beside it ("Deleted",
                             "Added new") says it again in words. A 16px hued mark keeps the scan and returns ~90px to the one
                             column whose content actually differs. The word survives as the mark's title and label, so nothing
                             is lost to a reader who cannot see colour. */}
                        ${''/* ⚠️ ROUND 10K (2026-09-20 13:10 EDT) — ROUND 10C IS REVERTED. I replaced the kind's
                             state tab with a bare mark on the argument that the word was redundant with the verb. It is not
                             mine to argue: this gate's own notes carry it as HIS design — pin 53, "Kind is Broadcast's state
                             tab — one shape, one colour per kind, carried on its left edge", and pin 56, "the square chip is
                             gone, the row's left edge carrying the colour". Round 3f also settled that the tab DEMOTES to a
                             mark only when every shown row shares a kind, which is measured per render. A documented design
                             is a constraint; the redundancy I saw was an argument for a fork, not a licence to delete. */}
                        <span>${uniformKind
                            ? html`<span class="b3-htab quiet" title=${label} aria-label=${label}><${Icon} name=${icon} /></span>`
                            : html`<span class="b3-htab"><${Icon} name=${icon} /><span class="w">${label}</span></span>`}</span>
                        ${''/* ROUND 11C (2026-09-20 13:31 EDT): the row carried `role="button" tabIndex="0"` and CONTAINED
                             a real <button> (Undo) — an interactive control nested inside an interactive control, which
                             is invalid and breaks keyboard and screen-reader behaviour on the one control that matters
                             on this surface. The ledger's closed row says a History row opens the event drawer and is
                             keyboard-reachable; both still hold. The row is a plain div that opens on a click outside
                             any button, and the KEYBOARD path is a real <button> around the phrase — the thing you
                             would read and press anyway — so the nesting is gone and nothing is lost. */}
                        <button type="button" class="what b3-hi-open" onClick=${() => onOpen(r)}>
                            <span class=${'hlead' + (thing ? ' has-ent' : '')}><span class="s">${verb}</span>${thing ? html`<span class="b3-ent" style=${realm ? `--c:${realm[2]}` : null}><${Icon} name=${realm ? realm[4] : 'tag'} />${thing}</span>` : null}</span>
                            ${r.kind === 'alert' ? html`<span class="b3-lvl"><${Meter} lv=${r.level || 'info'} />${r.level || 'info'}</span>` : null}
                            ${r.online ? html`<span class="b3-htab b3-online" style="--c:var(--ok)" title=${`Back online at ${TIME.format(new Date(r.online))}`}><${Icon} name="check" />Back online</span>` : null}
                            ${r.source && r.source !== '—' ? html`<span class="b3-src">${String(r.source).toLowerCase()}</span>` : null}
                            ${''/* `undone` used to sit here, inline after the name, while the undo BUTTON sat in the far-right
                                 column — two halves of one relationship in two places, so the eye had to cross the row to
                                 put them together. Both live in the action column now. */}
                        </button>
                        <span class=${'b3-who' + (who === 'system' ? ' sys' : '') + (uniformWho ? ' quiet' : '')} title=${uniformWho ? nameOf(who) : null}>${who === 'system' ? html`<span class="b3-av sys"><${Icon} name="bot" /></span>` : html`<span class="b3-av">${nameOf(who).slice(0, 1).toUpperCase()}</span>`}${uniformWho ? null : html`<span>${nameOf(who)}</span>`}</span>
                        <span class="act" onClick=${(e) => e.stopPropagation()}>${r.undone
                            ? html`<span class="b3-undone"><${Icon} name="check" /><span>Undone</span></span>`
                            : r.kind === 'change' ? html`<button type="button" class="b3-undo" aria-label="Reverse this change" title="Reverse this change" onClick=${() => onRevert([r.id])}><${Icon} name="undo-2" /><span>Undo</span></button>` : null}</span>
                    </div>`; };
                return html`
                <section class="b3-hi-dg" key=${d.k} style=${`--n:${d.rows.length + (burst ? bursts.length : 0)}`}>
                    <div class="b3-hi-day">
                        <b class="b3-hi-dd">${d.k === 'unknown' ? 'No date' : fmtDay(d.at)}</b>
                        <span class="b3-hi-dm">${mix.map(([k, n]) => html`<span class="b3-hi-dk" key=${k} style=${`--c:${KIND[k] ? KIND[k][2] : 'var(--ink3)'}`}><${Icon} name=${KIND[k] ? KIND[k][1] : 'history'} /><em>${n}</em>${(KIND[k] ? KIND[k][0] : 'Event').toLowerCase()}${n === 1 ? '' : 's'}</span>`)}</span>
                        <span class="b3-hi-ds">${d.rows.length > 1 && !Number.isNaN(oldest.getTime()) ? `${TIME.format(oldest)} – ${TIME.format(newest)}` : ''}</span>
                    </div>
                    ${burst
                        ? bursts.map((b) => html`<div class="b3-hi-burst" key=${b.newest}><span>${b.rows.length > 1 ? `${TIME.format(new Date(b.oldest))} – ` : ''}${TIME.format(new Date(b.newest))}</span><em><b>${b.rows.length}</b>${''/* ROUND 10D (2026-09-20 12:05 EDT), RESTORED 2026-09-20 16:23 EDT: a bare "6" sitting
                              alone in the WHAT column read as a stray number, and the band was the same near-black as a
                              row so it did not separate anything. A burst is a DENSITY - that is the whole of what this
                              view says over A - so it states the span it took as well as the count, in the same grammar
                              the day header above it uses. ⚠️ The comment's FORM is legal only here: this is inside a
                              template literal. The identical text in plain JS blanked the whole board once. */}${burstSpan(b)}</em></div>${b.rows.map(row)}`)
                        : d.rows.map(row)}
                </section>`; })}
            </div>
            ${''/* The words name what is actually set: a search alone is not "these filters". */}
            ${!shown.length ? html`<p class="b3-hi-empty"><b>${q.trim() && !chips ? `Nothing matches “${q.trim()}”.` : 'No event matches these filters.'}</b> ${active ? (q.trim() && !chips ? 'Clear the search to widen the list.' : 'Clear one to widen the list.') : ''}</p>` : null}
            ${''/* Older events cannot answer a WHEN chip — "Today, 0" beside "Load older" is a contradiction. */}
            ${hasMore && f.when === 'all' ? html`<div class="b3-hi-more"><button type="button" class="b3-btn2" onClick=${onMore}><${Icon} name="history" /><span class="b3-nw">Load older events<em>${(total - rows.length).toLocaleString()} more</em></span></button></div>` : null}
        </section>`;
}
