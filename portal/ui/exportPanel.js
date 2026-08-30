// portal/ui/exportPanel.js — ESM. The masthead's Export affordance, and the panel behind it.
//
// 🔴 EXPORTING WAS REACHABLE ONLY BY SELECTING ROWS FIRST. Every realm's export lived on the Manifest's selection bar, so taking a backup of a whole season meant ticking every row of it — and on two realms the button that did it was dead anyway (see portal/ui/download.js). The strip states what this page can hand you, in the formats the bot reads back, without selecting anything.
//
// 🔴 EACH SCOPE STATES ITS OWN SHAPE, because a single line claiming "the format the paste box accepts" is false for three of Season's four: the calendar is prefixed bullet lines, patch notes have no bulk-add flow at all and re-import through nothing, and only draws and loadouts round-trip. A note that is true of the loadouts export and wrong about patch notes teaches a reader that they hold a backup they do not.
//
// exportRecords/recordExport/exportSummary come from exportPanel.logic.js, loaded as a classic script.
import { h } from '../vendor/preact.mjs';
import { conforming } from './conform.js';
import { Drawer } from './overlay.js';
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';
import { fetchJson } from './httpClient.js';
import { downloadText } from './download.js';
import { reportFailure } from './async.js';

const clock = (at) => new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// 🔴 THE ROW NOTES ARE THE DESIGN'S, AND EACH SCOPE STATES ITS OWN SHAPE. The portal described every scope the same way ("Title, items, date, thumbnail — the exact fields…"), which is false for three of Season's five: the calendar is prefixed bullet lines, patch notes have no bulk-add flow at all, and the manifest is TSV. Nine pixels a row of wrap difference is how it surfaced; the wrong sentence is the actual defect. Keyed by scope id so no realm has to carry a second copy of its own vocabulary.
const CONFORM_SCOPE_COPY = {
    'season.draws': { label: 'New draws', note: 'Bulk Add format — pastes straight back.' },
    'season.returning': { label: 'Returning draws', note: 'Bulk Add format — pastes straight back.' },
    'season.calendar': { label: 'Calendar', note: 'Prefixed bullet lines, the format Bulk Add takes.' },
    'season.patchnotes': { label: 'Patch notes', note: 'A readable dump — patch notes have no bulk-add flow to paste into.' },
    'season.all': { label: 'Everything on this Track', note: 'The manifest as tab-separated columns, every type in one file.' },
};

// The list and the retention block, with the actions that drive them. ONE implementation: the inline panel and the drawer both mount this, so the two homes can never drift into two different export lists — which they had already started to, with the drawer carrying the design's per-scope notes and the inline copy still carrying the portal's.
function ExportBody({ scopes, overlay }) {
    const [busy, setBusy] = useState('');
    const [tick, setTick] = useState(0);
    const records = exportRecords();
    const copyOf = (sc) => (conforming() && CONFORM_SCOPE_COPY[sc.id] ? { ...sc, ...CONFORM_SCOPE_COPY[sc.id] } : sc);

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
        <ul class="exs">
            ${scopes.map((sc) => {
                const done = Boolean(exportRecord(sc.id));
                const c = copyOf(sc);
                return html`
                    <li class=${'exs-i' + (done ? ' done' : '')} key=${sc.id}>
                        <div class="exs-t"><b>${c.label}</b><span>${c.note}</span></div>
                        <div class="exs-c">${sc.count} <em>${sc.count === 1 ? sc.unit.replace(/s$/, '') : sc.unit}</em></div>
                        <button class=${'pill sm' + (done ? '' : ' lead')} disabled=${busy === sc.id}
                                onClick=${() => take(sc)}>${busy === sc.id ? 'Working…' : (done ? 'Download again' : 'Download')}</button>
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
            // 🔴 REGISTERED DIVERGENCE, AND THE DECISION WAS ALREADY MADE. The mockup's empty state reads that one-way operations are held until a session export exists — which is FALSE here: the strip does not gate on a session export, the interlock is the changeset export at Review. portalExport.test.js asserts this string can never appear in this file, with a comment saying exactly why. The conformance pass stands portal-ahead surfaces down; it does not carry a claim the portal cannot honour, even behind a flag anybody can open. The overlay shows a small copy difference here on purpose.
            : (conforming()
                // The design's line is one sentence and this needs to be too — a three-line paragraph makes the drawer 25px taller and moves everything in it, which reads as an 11% difference over one sentence. So: as short as the design's, and TRUE, rather than choosing between the two.
                ? html`<p class="expnone">No export taken this session. The copies kept here live until you reload.</p>`
                : html`<p class="expnone">Nothing exported yet on this page. The copies listed here live until you
                    reload — the one that makes an irreversible change survivable is the changeset export on Review,
                    which is a file on your disk and a record on the server.</p>`)}
        </div>`;
}

// 🔴 RENDERED BY THE SHELL, OUTSIDE `main`, BECAUSE WHERE IT LIVES CHANGES WHAT IT IS. Mounted inside the masthead — where the strip that opens it lives — this inherited two things the design's never sees, and both were measured rather than guessed. `main{position:relative;z-index:1}` made the scrim's z-index 44 meaningless, so a modal that had just declared the page inert still had the sticky header lit above it. And `.masthead p{font-size:13.5px}` reached the retention paragraph, rendering it at 13.5 against the design's 11.5 and adding 25px to the drawer. season.html's drawer is a child of BODY; so is this one now.
export function ExportDrawer({ scopes, overlay, onClose }) {
    if (!scopes || !scopes.length) return null;
    return html`
        <${Drawer} eyebrow="export · reversible" title="Export" onClose=${onClose}
                   actions=${html`<button class="btn" onClick=${onClose}>Close</button>`}>
            <p class="dw-p">Each of these is the exact format the bot reads back. Take one before a one-way
                change — the copy you take is the copy you restore from.</p>
            <${ExportBody} scopes=${scopes} overlay=${overlay} />
        <//>`;
}

// ⚠️ THE OPEN STATE IS THE SHELL'S WHEN THE SHELL OFFERS ONE. The strip is inside the masthead and the drawer must not be, so the one piece of state they share is lifted rather than duplicated; without the props it keeps its own, which is what any other caller gets.
export function ExportStrip({ label, scopes, overlay, open: openProp = null, onToggle = null }) {
    const [openLocal, setOpenLocal] = useState(false);
    if (!scopes || !scopes.length) return null;
    const open = onToggle ? Boolean(openProp) : openLocal;
    const toggle = onToggle || (() => setOpenLocal(!openLocal));

    return html`
        <div class="mh-take" role="group" aria-label=${`Export data from ${label}`}>
            <span class="mh-add-k">${label}</span>
            <button class="pill sm" aria-expanded=${open ? 'true' : 'false'} onClick=${toggle}>
                <svg viewBox="0 0 24 24" aria-hidden="true" class="mh-i" fill="none" stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 11l4 4 4-4M4 19h16"/></svg>
                Export…
            </button>
            <span class="mh-take-n">${exportSummary(scopes)}</span>
            ${open && !conforming() ? html`
                <div style="flex-basis:100%"><${ExportBody} scopes=${scopes} overlay=${overlay} /></div>` : null}
        </div>`;
}
