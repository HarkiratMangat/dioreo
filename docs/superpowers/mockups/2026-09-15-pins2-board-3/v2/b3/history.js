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
const LEVEL = [['error', 4, 'var(--danger-ink)'], ['warn', 3, 'var(--warn-ink)'], ['caution', 2, 'var(--warn)'], ['info', 1, 'var(--ink3)']];
const REALM = [['season', 'Season', 'var(--r-season)', /draw|calendar|season|patch|event/i, 'calendar-days'], ['armory', 'Armory', 'var(--r-armory)', /loadout|build|armory|gun/i, 'layers'],
    ['broadcast', 'Broadcast', 'var(--r-broadcast)', /announce|broadcast/i, 'radio'], ['access', 'Access', 'var(--r-access)', /admin|access|grant/i, 'shield']];
const realmOf = (r) => { const s = `${r.page || ''} ${r.model || ''}`; const hit = REALM.find((x) => x[3].test(s)); return hit ? hit[0] : null; };
const DAY = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const TIME = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayKey = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? 'unknown' : d.toDateString(); };
const WHEN = [['all', 'All time'], ['1', 'Today'], ['7', '7 days'], ['30', '30 days']];

function Meter({ lv }) {
    const L = LEVEL.find((x) => x[0] === lv) || LEVEL[3];
    return html`<span class="b3-meter" style=${`--sv:${L[2]}`} aria-hidden="true">${[1, 2, 3, 4].map((i) => html`<i key=${i} class=${i <= L[1] ? 'on' : ''}></i>`)}</span>`;
}

export function B3History({ rows, actors, total, onOpen, onRevert, onMore, hasMore, selectedId }) {
    const [q, setQ] = useState('');
    const e6 = useB3('e6');
    const [f, setF] = useState({ kind: null, level: null, who: null, realm: null, when: 'all', undo: false });
    useEffect(() => { hooks.historyFilter = (next) => setF({ kind: null, level: null, who: null, realm: null, when: 'all', undo: false, ...next }); return () => { delete hooks.historyFilter; }; }, []);
    const set = (k, v) => setF((p) => ({ ...p, [k]: p[k] === v ? (k === 'when' ? 'all' : null) : v }));

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
    const active = f.kind || f.level || f.who || f.realm || f.when !== 'all' || f.undo || q.trim();

    const chip = (k, v, label, extra = {}) => html`
        <button type="button" class=${'b3-fc' + (extra.cls ? ' ' + extra.cls : '')} key=${k + v} aria-pressed=${(k === 'undo' ? f.undo : f[k] === v) ? 'true' : 'false'}
                style=${extra.c ? `--c:${extra.c}` : null} onClick=${() => (k === 'undo' ? setF((p) => ({ ...p, undo: !p.undo })) : set(k, v))}>
            ${extra.pre || null}${label}${extra.n != null ? html`<em>${extra.n}</em>` : null}
        </button>`;

    return html`
        <section class="panel b3-hi" id="manifest">
            <div class="b3-hi-top">
                <div class="b3-hi-t"><b>Events${e6 !== 'now' ? html`<${Info} />` : null}</b><span>${shown.length.toLocaleString()} shown · ${Number(total).toLocaleString()} recorded</span></div>
                <label class="b3-hi-q"><${Icon} name="search" /><span class="sr">Search events</span>
                    <input data-bare value=${q} placeholder="Search what happened, or who" onInput=${(e) => setQ(e.target.value)} /></label>
                ${active ? html`<button type="button" class="b3-btn2 ghost sm" onClick=${() => { setQ(''); setF({ kind: null, level: null, who: null, realm: null, when: 'all', undo: false }); }}><${Icon} name="x" />Clear filters</button>` : null}
            </div>
            <div class="b3-hi-f">
                <div class="b3-fg"><span class="b3-fgl">Kind</span>
                    ${Object.entries(KIND).map(([k, [label, , c]]) => chip('kind', k, `${label}s`, { c, pre: html`<i class="dot"></i>`, n: count('kind', (r) => r.kind === k) }))}</div>
                <div class="b3-fg"><span class="b3-fgl">Level</span>
                    ${LEVEL.map(([lv]) => chip('level', lv, lv, { pre: html`<${Meter} lv=${lv} />`, n: count('level', (r) => r.kind === 'alert' && (r.level || 'info') === lv) }))}</div>
                <div class="b3-fg"><span class="b3-fgl">Who</span>
                    ${people.map((id) => chip('who', id, nameOf(id), { pre: id === 'system' ? html`<span class="b3-av sys"><${Icon} name="bot" /></span>` : html`<span class="b3-av">${nameOf(id).slice(0, 1).toUpperCase()}</span>`, n: count('who', (r) => whoOf(r) === id) }))}</div>
                <div class="b3-fg"><span class="b3-fgl">Realm</span>
                    ${REALM.map(([k, label, c]) => chip('realm', k, label, { c, pre: html`<i class="dot"></i>`, n: count('realm', (r) => realmOf(r) === k) }))}</div>
                <div class="b3-fg"><span class="b3-fgl">When</span>
                    ${WHEN.slice(1).map(([k, label]) => chip('when', k, label, { n: count('when', (r) => now - new Date(r.at).getTime() <= Number(k) * 86400000) }))}
                    <span class="b3-fgsep" aria-hidden="true"></span>
                    ${chip('undo', true, 'Can be undone', { pre: html`<${Icon} name="undo-2" />`, n: count('undo', (r) => r.kind === 'change' && !r.undone) })}</div>
            </div>
            <div class="b3-hi-h" aria-hidden="true"><span>Time</span><span>Kind</span><span>What</span><span>Who</span><span></span></div>
            ${days.map((d) => html`
                <div class="b3-hi-day" key=${d.k}><b>${d.k === 'unknown' ? 'No date' : DAY.format(new Date(d.at))}</b><em>${d.rows.length} event${d.rows.length === 1 ? '' : 's'}</em></div>
                ${d.rows.map((r) => {
                    const [label, icon, c] = KIND[r.kind] || ['Event', 'history', 'var(--ink3)'];
                    const realm = REALM.find((x) => x[0] === realmOf(r));
                    const who = whoOf(r);
                    const verb = r.kind === 'change' ? String(r.summary || '').replace(/\s*"[^"]*"\s*/, ' ').trim() : r.summary;
                    const thing = r.kind === 'change' ? (String(r.summary || '').match(/"([^"]+)"/) || [])[1] || r.target : null;
                    return html`
                    <div class=${'b3-hi-r' + (selectedId && String(selectedId) === String(r.id) ? ' open' : '')} key=${r.id} style=${`--c:${c}`} tabIndex="0" role="button"
                         onClick=${() => onOpen(r)} onKeyDown=${(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(r); } }}>
                        <span class="when">${Number.isNaN(new Date(r.at).getTime()) ? '—' : TIME.format(new Date(r.at))}</span>
                        <span><span class="b3-htab"><${Icon} name=${icon} />${label}</span></span>
                        <span class="what">
                            <span class="s">${verb}</span>
                            ${thing ? html`<span class="b3-ent" style=${realm ? `--c:${realm[2]}` : null}><${Icon} name=${realm ? realm[4] : 'tag'} />${thing}</span>` : null}
                            ${r.kind === 'alert' ? html`<span class="b3-lvl"><${Meter} lv=${r.level || 'info'} />${r.level || 'info'}</span>` : null}
                            ${r.source && r.source !== '—' ? html`<span class="b3-src">${String(r.source).toLowerCase()}</span>` : null}
                            ${r.undone ? html`<span class="b3-undone">undone</span>` : null}
                        </span>
                        <span class=${'b3-who' + (who === 'system' ? ' sys' : '')}>${who === 'system' ? html`<span class="b3-av sys"><${Icon} name="bot" /></span>` : html`<span class="b3-av">${nameOf(who).slice(0, 1).toUpperCase()}</span>`}<span>${nameOf(who)}</span></span>
                        <span class="act" onClick=${(e) => e.stopPropagation()}>${r.kind === 'change' && !r.undone ? html`<button type="button" class="b3-undo" aria-label="Reverse this change" title="Reverse this change" onClick=${() => onRevert([r.id])}><${Icon} name="undo-2" /></button>` : null}</span>
                    </div>`; })}`)}
            ${!shown.length ? html`<p class="b3-hi-empty"><b>No event matches these filters.</b> ${active ? 'Clear one to widen the list.' : ''}</p>` : null}
            ${hasMore ? html`<div class="b3-hi-more"><button type="button" class="b3-btn2" onClick=${onMore}><${Icon} name="history" />Load older events<em>${(total - rows.length).toLocaleString()} more</em></button></div>` : null}
        </section>`;
}
