// portal/ui/exportPanel.js — ESM. The masthead's Export affordance, and the panel behind it.
//
// 🔴 EXPORTING WAS REACHABLE ONLY BY SELECTING ROWS FIRST. Every realm's export lived on the Manifest's selection bar, so taking a backup of a whole season meant ticking every row of it — and on two realms the button that did it was dead anyway (see portal/ui/download.js). The strip states what this page can hand you, in the formats the bot reads back, without selecting anything.
//
// 🔴 EACH SCOPE STATES ITS OWN SHAPE, because a single line claiming "the format the paste box accepts" is false for three of Season's four: the calendar is prefixed bullet lines, patch notes have no bulk-add flow at all and re-import through nothing, and only draws and loadouts round-trip. A note that is true of the loadouts export and wrong about patch notes teaches a reader that they hold a backup they do not.
//
// exportRecords/recordExport/exportSummary come from exportPanel.logic.js, loaded as a classic script.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';
import { fetchJson } from './httpClient.js';
import { downloadText } from './download.js';
import { reportFailure } from './async.js';

const clock = (at) => new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function ExportStrip({ label, scopes, overlay }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState('');
    const [tick, setTick] = useState(0);
    if (!scopes || !scopes.length) return null;
    const records = exportRecords();

    async function take(scope) {
        setBusy(scope.id);
        const res = await fetchJson(scope.url);
        setBusy('');
        if (await reportFailure(overlay, res, `${scope.label} could not be exported`)) return;
        const text = res.text || '';
        downloadText(scope.filename, text);
        // The kept copy is the bytes that were handed over, never a re-derivation: an export that regenerates itself on "take it again" is a different document wearing the same name.
        recordExport(scope.id, { label: scope.label, rows: res.count || 0, bytes: text.length, body: text, filename: scope.filename });
        setTick(tick + 1);
        overlay?.say?.(`${scope.label} saved — ${res.count || 0} ${res.count === 1 ? 'record' : 'records'}.`);
    }

    return html`
        <div class="mh-take" role="group" aria-label=${`Export data from ${label}`}>
            <span class="mh-add-k">${label}</span>
            <button class="pill sm" aria-expanded=${open ? 'true' : 'false'} onClick=${() => setOpen(!open)}>
                <svg viewBox="0 0 24 24" aria-hidden="true" class="mh-i" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 11l4 4 4-4M4 19h16"/></svg>
                Export…
            </button>
            <span class="mh-take-n">${exportSummary(scopes)}</span>
            ${open ? html`
                <div style="flex-basis:100%">
                    <ul class="exs">
                        ${scopes.map((s) => {
                            const done = Boolean(exportRecord(s.id));
                            return html`
                                <li class=${'exs-i' + (done ? ' done' : '')} key=${s.id}>
                                    <div class="exs-t"><b>${s.label}</b><span>${s.note}</span></div>
                                    <div class="exs-c">${s.count} <em>${s.count === 1 ? s.unit.replace(/s$/, '') : s.unit}</em></div>
                                    <button class=${'pill sm' + (done ? '' : ' lead')} disabled=${busy === s.id}
                                            onClick=${() => take(s)}>${busy === s.id ? 'Working…' : (done ? 'Download again' : 'Download')}</button>
                                </li>`;
                        })}
                    </ul>
                    <div class="expkept">
                        <h5>Kept this session</h5>
                        <!-- ⚠️ "This session" means THIS PAGE — a reload empties it. Said plainly rather than left to be
                             discovered, because a retention list that quietly forgets is worse than no list: the real
                             safeguard for an irreversible change is the changeset export on Review, which is a file on
                             disk and a server-side record, not this. -->
                        ${records.length ? html`
                            <ul class="explist">
                                ${records.map((r) => html`
                                    <li key=${r.id}>
                                        <span class="exp-s">${r.label || r.id}</span>
                                        <span class="exp-m">${clock(r.at)}${r.rows ? ` · ${r.rows} rows` : ''} · ${r.bytes} bytes kept</span>
                                        <button class="pill sm" onClick=${() => downloadText(r.filename, r.body)}>Take it again</button>
                                    </li>`)}
                            </ul>`
                        : html`<p class="expnone">Nothing exported yet on this page. The copies listed here live until you
                            reload — the one that makes an irreversible change survivable is the changeset export on Review,
                            which is a file on your disk and a record on the server.</p>`}
                    </div>
                </div>` : null}
        </div>
    `;
}
