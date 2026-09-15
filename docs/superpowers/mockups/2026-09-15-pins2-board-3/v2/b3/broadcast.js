// Board 3 version 2 — BOARD ONLY. P8: an announcement with no end date, shown where the problem is. The card's lifespan bar runs past its end and says it never stops; a quiet Set end control opens a date picker and stages the end; the queue panel's own head counts it beside the slots, and Changes ahead lists it with the quoted announcement, because "never stops" is a change ahead that never comes.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect, useRef } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { stageOps } from '../ui/composeClient.js';

const DAY = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const addDays = (n) => { const d = new Date(); d.setHours(23, 59, 0, 0); d.setDate(d.getDate() + n); return d; };
export const stagedEndOf = (a, stagedOps) => {
    const op = (stagedOps || []).find((o) => o.realm === 'broadcast' && (o.targetIds || []).includes(String(a._id)));
    const row = op && (op.rows || []).find((r) => r.key === 'expiresAt');
    return row && row.to ? new Date(row.to) : null;
};

export function EndPicker({ a, csrfToken, overlay, onStaged, cls = '' }) {
    const [open, setOpen] = useState(false);
    const [when, setWhen] = useState(() => addDays(14).toISOString().slice(0, 10));
    const [busy, setBusy] = useState(false);
    const wrap = useRef(null);
    useEffect(() => {
        if (!open) return undefined;
        const onDoc = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', onDoc); document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('pointerdown', onDoc); document.removeEventListener('keydown', onKey); };
    }, [open]);
    const picks = [[7, 'In a week'], [14, 'In two weeks'], [30, 'In a month']];
    async function stage() {
        setBusy(true);
        const end = new Date(`${when}T23:59:00`);
        const res = await stageOps('broadcast', [{ type: 'announcement.edit', target: { id: String(a._id) },
            payload: { text: a.text, startsAt: a.startsAt || null, bannerImageUrl: a.bannerImageUrl || null, repeatCount: a.repeatCount ?? null, expiresAt: end.toISOString() } }], csrfToken);
        setBusy(false);
        if (!res || !res.changesetId) { overlay.say('The end date could not be staged.'); return; }
        setOpen(false);
        onStaged(`Staged · it stops showing ${DAY(end)}. Nothing changes for players until you commit it.`);
    }
    return html`
        <span class=${'b3-endwrap ' + cls} ref=${wrap}>
            <button type="button" class="b3-endbtn" aria-expanded=${open ? 'true' : 'false'} aria-haspopup="dialog" onClick=${() => setOpen(!open)}>
                <${Icon} name="calendar-plus" />Set end date</button>
            ${open ? html`
                <div class="b3-datepop" role="dialog" aria-label="When it stops showing">
                    <p class="b3-dp-h"><b>Stop showing it</b><span>live since ${DAY(new Date(a.startsAt || a.createdAt))}</span></p>
                    <div class="b3-dp-picks">
                        ${picks.map(([n, label]) => { const d = addDays(n); const iso = d.toISOString().slice(0, 10); return html`
                            <button type="button" key=${n} aria-pressed=${when === iso ? 'true' : 'false'} onClick=${() => setWhen(iso)}><b>${label}</b><span>${DAY(d)}</span></button>`; })}
                    </div>
                    <label class="b3-dp-date"><span>Or a date</span><input type="date" value=${when} min=${new Date().toISOString().slice(0, 10)} onInput=${(e) => setWhen(e.target.value)} /></label>
                    <div class="b3-dp-f"><button type="button" class="b3-btn2 ghost sm" onClick=${() => setOpen(false)}>Cancel</button>
                        <button type="button" class="b3-btn2 go sm" disabled=${busy || !when} onClick=${stage}><${Icon} name="check" />${busy ? 'Staging…' : `Stage end · ${when ? DAY(new Date(`${when}T12:00:00`)) : ''}`}</button></div>
                </div>` : null}
        </span>`;
}

export function NeverChip({ n }) {
    if (!n) return null;
    return html`<button type="button" class="b3-never" onClick=${() => { const c = document.querySelector('.qcard.b3-forever'); if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'center' }); c.classList.remove('b3-pulse'); void c.offsetWidth; c.classList.add('b3-pulse'); } }}>
        <${Icon} name="infinity" /><b>${n}</b> never ${n === 1 ? 'ends' : 'end'}</button>`;
}

export function ForeverAhead({ list, accentOf, daysBetween, csrfToken, overlay, onStaged }) {
    if (!list.length) return null;
    return html`${list.map((a) => html`
        <div class="b3-chg-forever" key=${a._id} style=${`--c:${accentOf(a)}`}>
            <span class="b3-chg-k"><${Icon} name="infinity" /></span>
            <span class="b3-chg-b">
                <span class="b3-quote"><i></i><span>${String(a.text || '').replace(/^#{1,3}\s+/gm, '')}</span></span>
                <em>Never stops showing · live ${daysBetween(a.createdAt, Date.now())} days</em>
            </span>
            <${EndPicker} a=${a} csrfToken=${csrfToken} overlay=${overlay} onStaged=${onStaged} cls="right" />
        </div>`)}`;
}
