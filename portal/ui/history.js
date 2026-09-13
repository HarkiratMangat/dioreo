// portal/ui/history.js — ESM. The History realm: every change, alert and restart on one timeline, with revert as its one action.
//
// 🔴 SPLIT OUT OF analytics.js ON 2026-09-13 17:41 EDT, WHOLE (batch-2 spec §4). Harkirat's reason: the manifest carries undo and revert, a capability, while Analytics is a surface for looking. Everything below the imports moved verbatim — the comments describe decisions taken while this lived in analytics.js, and their line references to that file are historical. Nothing about the river's behaviour changed in the move.
//
// ⚠️ IT STILL READS /api/analytics, which assembles the health, usage and timing figures this page never draws. That is the cost of a move that changes no API; a /api/history route is the fix if the payload ever shows up as slow.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';
import { Shell, Masthead } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { useAsync, RealmShell, reportFailure } from './async.js';
import { useOverlay, Drawer } from './overlay.js';

// Analytics' Health tiles and level rows still open this river pre-filtered. Routing is an exact hash match, so the filter is handed over in sessionStorage under this key and consumed once, on mount.
export const HISTORY_FILTER_KEY = 'history.filter';
function takeHandoff() {
    try {
        const raw = sessionStorage.getItem(HISTORY_FILTER_KEY);
        if (!raw) return null;
        sessionStorage.removeItem(HISTORY_FILTER_KEY);
        const filters = JSON.parse(raw);
        return filters ? { seq: 1, filters } : null;
    } catch { return null; }
}

// ⚠️ NEITHER SIDE'S WORD FOR THE THIRD KIND WAS RIGHT, so this is a deliberate third choice rather than a port. The design says "Deploy" (analytics.html:521) and the fixtures it ships contain rows reading "automatic/unattended restart" — an unattended crash-recovery is not a deploy, so the design's word is factually wrong about its own data. The portal said "BOOT", which is accurate and is exactly the dialect Harkirat ruled against eight lines below this ("literally no clue what p50, p95 even mean… they look like jargon"). RESTART is the one word that is both true of every row and plain. summaryOf() already writes "restarted — …" in the What column, so the chip and the sentence now agree.
const KIND_LABEL = { change: 'CHANGE', alert: 'ALERT', boot: 'RESTART' };

// Where the event came from, which is the column that makes "one history, two front doors" true rather than asserted: a ChangeLog row written by the portal and one written by /manage are the same kind of thing from different surfaces, and you can only see that if the surface is a column.
function sourceOf(row) {
    if (row.kind !== 'change') return '—';
    const s = (row.source || row.via || '').toLowerCase();
    // 🔴 THREE READINGS, NOT TWO. Until 2026-09-10 15:06 EDT this was a ternary over a field nothing wrote, so it answered DISCORD for every row including changes made in this very window. Rows from before models/ChangeLog.js gained `source` genuinely have no origin recorded, and an em dash says so -- the portal's own rule that a figure it does not have is never a figure it guesses.
    return s === 'portal' ? 'PORTAL' : s === 'discord' ? 'DISCORD' : '—';
}

function summaryOf(row) {
    if (row.kind === 'alert') return row.title || 'Alert';
    if (row.kind === 'boot') return `restarted — ${row.kind_ || row.bootKind || row.version || 'boot'}`;
    return row.summary || row.target || row.action || 'Change';
}

// The river's inline tag, same literal rule, read by `RIVER_COLUMNS` BELOW. ⚠️ This said "above" until 2026-09-02 11:18 EDT and carried the argument that came with it — "a module-scope const, so the closure that reads it always runs after this line" — which was the exact reasoning `npm run tdz` refuted when it flagged the read as a temporal dead zone. The block moved to fix that and its comment described the old position for two commits: moved text keeps asserting what was true where it used to be. ⚠️ `warn` shares the ERROR tag on purpose: neither stylesheet defines `.lvtag.lv-warn`, and the property that separates the loud tag from the quiet one is whether a human gets pinged, which alertWebhook:61 gives `warn` and `error` alike. The tag's text is the level's own name, so nothing is hidden by the shared colour. `info` carries `lv-info` even though neither sheet styles it: the design emits the modifier (`span.lv-info.lvtag`, five of them) and an element signature is what the overlay pairs on, so a bare class reads as a different element for no gain.
const LEVEL_TAG = { error: 'lvtag lv-error', warn: 'lvtag lv-error', caution: 'lvtag lv-caution', info: 'lvtag lv-info' };

const RIVER_COLUMNS = [
    { key: 'at', label: 'When', dataKind: 'date', render: (r) => new Date(r.at).toISOString().slice(5, 16).replace('T', ' ') },
    { key: 'kind', label: 'Kind', col: 'c-type', render: (r) => html`<span class=${'rivk ' + r.kind}>${KIND_LABEL[r.kind] || r.kind}</span>` },
    // ⚠️ The source is PLAIN TEXT in a monospaced column. It used to carry a `.src` chip class with no rule behind it, and a chip here would compete with the kind chip beside it for the same reading — one of the two has to be quieter, and the kind is the one that classifies.
    { key: 'source', label: 'Source', render: (r) => sourceOf(r) },
    // 🔴 THE LEVEL WAS A FILTER AND NEVER A MARK. An error and a routine change read identically down the column, so the one thing you scan a log for — which rows are bad — needed the filter to be touched first. The dot carries severity, the tag names it, and both are absent on rows that have no level rather than defaulting to a reassuring one.
    { key: 'summary', label: 'What', render: (r) => {
        const sev = r.level === 'error' ? 'err' : r.level === 'caution' ? 'warn' : r.level ? 'info' : '';
        // ⚠️ THE ${' '} BEFORE THE TAG, for the same reason the tiles needed theirs: htm drops the whitespace across the newline, so the cell read "Bot onlineinfo" — and now that the row is focusable, that string is part of its accessible name.
        return html`<span class="sev ${sev}"></span>${summaryOf(r)}${' '}${r.kind === 'alert' && r.level
            ? html`<span class=${LEVEL_TAG[r.level] || 'lvtag'}>${r.level}</span>` : null}`;
    } },
    { key: 'actor', label: 'Who', render: (r) => (r.actorId ? String(r.actorId).slice(-6) : html`<span class="none">system</span>`) },
];

// 🔴 A NAME IF ONE EXISTS, AND A HONEST SHORT ID IF NOT -- never nineteen digits truncated to six, which is what this column showed until 2026-09-10 15:08 EDT. The map comes from portal/api/analytics.js and holds only what the codebase actually stores: `owner`, plus each granted admin's own note. An unknown id keeps its last six digits behind an ellipsis, which at least reads as an identifier rather than as a number that means something.
function actorLabel(actorId, actors) {
    if (!actorId) return 'system';
    const named = actors && actors[actorId];
    return named || ('…' + String(actorId).slice(-6));
}

const RIVER_FILTERS = [
    // 🔴 "no color identity within these buttons" — pin pmtuxqsk4, on the `alerts` chip. Armory's category chips have carried a topic swatch since the Manifest gained `topic: true`; Analytics never passed it, so the one realm whose whole subject IS three colour-coded kinds rendered its filter as three grey words. The hexes are `.rivk`'s, not new ones — the chip and the badge it filters to now agree. ⚠️ Level is deliberately left neutral: `lv-error`/`lv-warn`/`lv-caution`/`lv-info` are a SEVERITY ramp rather than a topic vocabulary, and inventing a fourth mapping for them is how a third vocabulary starts. If that ramp should reach the chips it is one line, and it is a decision.
    { key: 'kind', label: 'Kind', topic: true, options: [
        { value: 'change', label: 'changes', hex: 'var(--info)' },
        { value: 'alert', label: 'alerts', hex: 'var(--warn)' },
        { value: 'boot', label: 'restarts', hex: 'var(--sched)' },
    ] },
    // 🔴 THIS FILTER IS WHERE THE DELETED ALERT EXPORT WENT. The Alerts pre block held the level and the describe() detail of every alert, and the river was already fetching whole AlertLog documents and throwing both away. Deleting a redundant layer is right; deleting the facts it carried is not — so level becomes a filter and detail becomes searchable, which is strictly more useful than the prose block was, because both compose with the kind filter and the search box.
    { key: 'level', label: 'Level', options: [
        // ⚠️ THE LEVEL'S OWN NAME, not a pluralisation, because this group carried TWO vocabularies: "errors" and "warnings" plural beside "caution" and "info" singular, inside one chip that cycles between them. The panel above writes the bare words (info is a record, caution is a look-when-convenient, error pings a human) and the design builds its own chips from the level values, so agreeing with the sentence above is what makes the chip readable.
        { value: 'error', label: 'error' }, { value: 'warn', label: 'warn' },
        { value: 'caution', label: 'caution' }, { value: 'info', label: 'info' },
    ] },
];

function eventRows(r) {
    const out = [['Kind', KIND_LABEL[r.kind] || r.kind]];
    if (r.kind === 'alert') {
        out.push(['Level', r.level || '—']);
        out.push(['Pinged a human', r.pinged ? 'yes' : 'no']);
        // ⚠️ `silent` is not the opposite of `pinged`. An alert can be stored and never posted to Discord at all, which is a third state, and the level panel already says so in its own sub-line.
        if (r.silent) out.push(['Posted to Discord', 'no — recorded only']);
        if (typeof r.rssMb === 'number') out.push(['Memory at the time', `${r.rssMb} MB`]);
        if (r.host) out.push(['Host', r.host]);
    }
    if (r.kind === 'change') {
        out.push(['Page', r.page || '—']);
        out.push(['Action', r.action || '—']);
        out.push(['Model', r.model || '—']);
        out.push(['Undone', r.undone ? 'yes' : 'no']);
    }
    if (r.kind === 'boot') {
        if (r.version) out.push(['Version', r.version]);
        if (r.commit) out.push(['Commit', r.commit]);
        if (r.bootKind || r.kind_) out.push(['Restart kind', r.bootKind || r.kind_]);
    }
    out.push(['Who', r.actorId ? String(r.actorId) : 'system']);
    if (r.detail) out.push(['Detail', r.detail]);
    return out;
}

// One sentence per kind, saying what the row IS rather than restating the fields above it — an alert has no inverse and a restart is not something anyone did, and neither fact is visible from the table.
const EVENT_NOTE = {
    change: 'Every portal and /manage write is recorded with the step that reverses it, so this row can be put back from either surface, and it survives a restart.',
    alert: 'Alerts come from the bot itself and mirror to the alert webhook. They carry no inverse — an alert is a record of something that happened, not an operation.',
    boot: 'Restart records are written on boot. A merged version can sit undeployed indefinitely, so this is the only thing that says what is actually running.',
};

// ⚠️ A ROW WITH NO USABLE DATE MUST NOT TAKE THE REALM DOWN. `new Date(x).toISOString()` throws a RangeError on an unparseable value, and this renders inside the page rather than beside it -- one malformed `createdAt` in one of three collections would blank Analytics entirely, mid-render, with no error state.
function EventDrawer({ row, onClose, onRevert }) {
    const at = new Date(row.at);
    const atText = Number.isNaN(at.getTime()) ? 'not recorded' : at.toISOString().slice(0, 16).replace('T', ' ');
    const revertable = row.kind === 'change' && !row.undone;
    return html`
        <${Drawer} eyebrow=${`${KIND_LABEL[row.kind] || row.kind} · ${atText}`}
                   title=${summaryOf(row)} onClose=${onClose}
                   actions=${html`
                       <button class="btn" onClick=${onClose}>Close</button>
                       ${revertable ? html`<button class="btn dang" onClick=${onRevert}>Reverse this change</button>` : null}`}>
            <div class="dwbody">
                <div class="diff">
                    ${eventRows(row).map(([k, v]) => html`
                        <div class="diff-r" key=${k}><span class="dk">${k}</span><span>${v}</span></div>`)}
                </div>
                <p class="dw-p" style="margin-top:var(--s4)">${EVENT_NOTE[row.kind] || EVENT_NOTE.alert}</p>
            </div>
        <//>`;
}

export function HistoryRealm({ session }) {
    const load = useAsync(() => Promise.all([fetchJson('/api/analytics'), fetchJson('/api/review')])
        .then(([analytics, review]) => ({ ...analytics, stagedOps: (review && review.ops) || [],
                                          stagedUnknown: Boolean(review && (review.forbidden || review.failed)) })), []);
    const [riverFilter] = useState(takeHandoff);
    const [openEvent, setOpenEvent] = useState(null);
    const overlay = useOverlay();

    if (!load.data) return html`<${RealmShell} realm="history" session=${session} error=${load.error} slow=${load.slow}
                                               onRetry=${load.reload} skeleton=${{ rows: 8, lines: [18, 30, 14, 22, 10] }} />`;
    const data = load.data;

    const exportToday = new Date().toISOString().slice(0, 10);
    // The river's export moved with the river. Its id and filename keep the `analytics` prefix: the route is /api/analytics/export and an id is not a reader-facing word.
    const exportScopes = [
        { id: 'analytics.events', label: 'Event river', unit: 'events',
          count: (data.river || []).length, url: '/api/analytics/export?scope=events',
          filename: `dioreo-analytics-events-${exportToday}.csv`,
          note: 'Changes, alerts and boots on one timeline — most columns are empty for most rows, because three collections share it.' },
    ];

    // ⚠️ `rows` IS DECLARED ABOVE `confirmRevert`, WHICH READS IT. In analytics.js it sat below and was a baselined temporal dead zone; the move to this file was the moment to retire it rather than carry it.
    // The row dot carries the event's KIND, matching its chip. Left ungated it rendered 100 identical grey squares, which is a column of noise -- colour has to mean something or it should not be drawn. --patch/--warn/--ret are the same three signals the chips use, so the dot and the chip never disagree. 🔴 ONE KIND, TWO COLOURS, ON ONE ROW (2026-09-10 11:01 EDT). This map paints the row's topic dot and `.rivk` paints the row's KIND BADGE two columns away — and they disagreed: a change was --patch (gold) at the dot and --info (blue) at the badge, a restart --ret (pink) against --sched (violet). `.rivk` is the one a reader actually reads the word off, so it is the authority and this follows it.
    const KIND_VAR = { change: '--info', alert: '--warn', boot: '--sched' };
    // The level default is not cosmetic: a change or a boot carries no level, and an undefined value would make the Level filter silently hide every non-alert row the moment it is touched.
    const rows = data.river.map(r => ({ ...r, id: r.changeId || r.alertId || r._id, state: 'live', topicVar: KIND_VAR[r.kind], summary: summaryOf(r), source: sourceOf(r), actor: actorLabel(r.actorId, data.actors), level: r.level || (r.kind === 'alert' ? 'info' : '—') }));

    // 🔴 THE MOST DANGEROUS BUTTON IN THE PORTAL ALSO HAD THE QUIETEST FAILURE. A revert that 500ed resolved to a payload nothing read, so the row stayed exactly as it was — indistinguishable from a portal that ignored the click, and the reader's next move is to press it again. ⚠️ ONE WORD FOR THE COMMITTED SENSE, AND IT IS "REVERSE". The UX-copy audit's vocabulary table (`local/handoff/2026-08-25-portal-ux-copy-audit.md`, gitignored -- state the path when citing it) reserves Undo for taking a STAGED change back and Reverse for undoing a COMMITTED one, because one word for two operations at different tiers is how a reader learns the wrong consequence. This realm carried both: the bulk bar and its confirm said Revert while the event drawer said Reverse, four inches apart. The op id stays `change.revert` -- an internal identifier is not a reader-facing word, and renaming it would break the route, the ChangeLog rows already written, and every custom_id in a panel someone still has open.
    async function revert(changeId) {
        // 🔴 ENCODED, AND THE BUG THIS FIXES WAS INVISIBLE FROM BOTH ENDS. A change id is `#1`-shaped, and `#`
    // in a template-literal URL starts a FRAGMENT: the browser sent `/api/revert/` with no id at all, the route regex did not match, and the answer was a 404 with a null body — which the comment above describes as the quiet failure this button already had once. Fixed with `segment()`'s decode on 2026-09-02 22:41 EDT; either half alone leaves the button dead, so they must never be separated.
    const res = await fetchJson(`/api/revert/${encodeURIComponent(changeId)}`, { method: 'POST', headers: { 'x-csrf-token': session.csrfToken } });
        if (await reportFailure(overlay, res, 'That change was not reversed')) return false;
        load.reload();
        return true;
    }

    // 🔴 THE MOST DANGEROUS BUTTON IN THE PORTAL HAD NO CONFIRMATION AT ALL. Everything else here stages; this one fires immediately against live data, once per selected row, and it is the only control that can undo something a person already committed on purpose. It sat in a bulk-action list beside "Export selection".
    //
    // ⚠️ NOT a typed gate, and that is a judgement rather than an omission: a revert applies the change's own recorded INVERSE, so the safe direction is the one this button goes in — the risk is reverting the WRONG row, which naming the rows answers and typing a word does not.
    function confirmRevert(ids) {
        const chosen = rows.filter((r) => ids.includes(r.id));
        const revertable = chosen.filter((r) => r.kind === 'change');
        overlay.confirm({
            op: 'change.revert', tier: 2, danger: true,
            confirmLabel: revertable.length === 1 ? 'Reverse it' : `Reverse ${revertable.length} changes`,
            title: revertable.length === 1 ? 'Reverse this change?' : `Reverse ${revertable.length} changes?`,
            body: html`
                <p class="dw-p">This applies each change's recorded inverse <b>immediately</b> — it does not stage, and
                    the Review screen never sees it. The reversal is itself recorded here, so it can be reversed in turn.</p>
                ${chosen.length !== revertable.length ? html`
                    <p class="dw-p"><b>${chosen.length - revertable.length}</b> of the selected rows${' '}
                        ${chosen.length - revertable.length === 1 ? 'is an alert or a restart' : 'are alerts or restarts'},
                        not changes — nothing will happen to ${chosen.length - revertable.length === 1 ? 'it' : 'them'}.</p>` : null}
                <ul class="dw-l">${revertable.slice(0, 6).map((r) => html`
                    <li key=${r.id}>${r.summary}</li>`)}
                    ${revertable.length > 6 ? html`<li>…and ${revertable.length - 6} more</li>` : null}</ul>`,
            // 🔴 IT CLAIMED SUCCESS BEFORE A SINGLE REQUEST HAD ANSWERED — corrected 2026-09-04 21:57 EDT. `revert` is async and `forEach` discards every promise, so the toast fired synchronously: a server that was down produced BOTH *"3 changes reverted"* and, a moment later, the failure — and since one toast replaces another, the reader's last word was the failure with a success already in their memory. The single-row path was fixed under the comment above calling this the most dangerous button in the portal; the BULK path was the same defect, still live, on the only control that mutates committed production data with no staging step. ⚠️ AND THE WORD WAS WRONG. `analytics.js`'s own rule is one word for the committed sense and it is REVERSE; the button says Reverse and the toast said *reverted*, two lines apart.
            onConfirm: async () => {
                const results = await Promise.all(revertable.map((r) => revert(r.id)));
                const done = results.filter(Boolean).length;
                if (!done) return;   // every failure has already named itself through reportFailure
                overlay.say(done === revertable.length
                    ? `${done} change${done === 1 ? '' : 's'} reversed. Players see the previous value now.`
                    : `${done} of ${revertable.length} reversed. The rest are unchanged — try them again.`);
            },
        });
    }

    const changes = rows.filter((r) => r.kind === 'change');
    const reversible = changes.filter((r) => !r.undone).length;

    return html`
        <${Shell} realm="history" session=${session} busy=${load.hostClass}
                  exports=${exportScopes} exportLabel="Export" overlayFor=${overlay}
                  badges=${{ review: data.stagedUnknown ? 0 : (data.stagedOps || []).length }}
                  stagedOps=${data.stagedUnknown ? null : data.stagedOps}
                  overlaySlot=${html`${overlay.render()}${openEvent ? html`<${EventDrawer} row=${openEvent}
                                     onClose=${() => setOpenEvent(null)}
                                     onRevert=${() => { const r = openEvent; setOpenEvent(null); confirmRevert([r.id]); }} />` : null}`}
                  masthead=${html`<${Masthead} title="History" sub="Every change, alert and restart on one timeline — and the way to put a change back."
                                               stats=${[
                                                   { value: (data.riverTotal ?? rows.length).toLocaleString(), label: 'events recorded', lead: true, accent: 'var(--r-history)' },
                                                   { value: changes.length, label: 'changes shown' },
                                                   { value: reversible, label: 'reversible' },
                                               ]} />`}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${RIVER_COLUMNS} searchableFields=${['summary', 'title', 'actor', 'detail']}
                                                    title="One history, both front doors" label="Events" filterGroups=${RIVER_FILTERS}
                                                    headerRight="Alerts, changes and boots are all events — filtering one stream beats switching between four lists."
                                                    emptyText="No changes, alerts or restarts have been recorded yet."
                                                    bulkNote="Immediate — a revert applies the inverse now, and is itself recorded"
                                                    ${''/* 🔴 WAS 3, AGAINST THE CONFIRM'S OWN `tier: 2` EIGHTY LINES UP, for the same operation. Tier 3 means a TYPED gate in this system (oneway.js:24, access.js:459), and confirmRevert deliberately does not type — its comment says so: the risk is reverting the WRONG row, which naming the rows answers and typing a word does not. So 2 is the true tier and the SelectionBar was the wrong half. Every other realm's pair already agrees: armory 2/2, broadcast 2/2, access 3/3. */}
                                                    bulkTier=${2} rowNoun=${['event', 'events']}
                                                    bulkActions=${[{ label: 'Reverse', danger: true, onClick: confirmRevert }]}
                                                    onRowClick=${(row) => setOpenEvent(row)} selectedRowId=${openEvent && openEvent.id}
                                                    ${''/* The river is capped at 100 server-side, so without a total the count divides by the page and reads 11 of 11 over a collection holding thousands -- a number that can never say something is being withheld. */}
                                                    totalRows=${data.riverTotal ?? rows.length} pageCap=${100} countSuffix=" events"
                                                    filterSignal=${riverFilter} />`} />
    `;
}
