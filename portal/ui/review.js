// portal/ui/review.js — ESM. The Review realm: exactly what is about to change, and what it will overwrite, before any of it is written.
//
// 🔴 THE HIGHEST-CONSEQUENCE SCREEN IN THE PORTAL, and the only one that is cross-realm. Every other realm shows one part of the bot; this shows every open changeset the signed-in admin owns, in any realm, flattened to individual operations with a field-level diff each. The Board is its per-realm sibling and answers a different question: the Board is where work waits, Review is where it becomes real.
//
// It derives nothing itself. Tier, diff, gate and wording all arrive from /api/review, which reads them from validateSet, previewSet, gateCommit and describeOp — the same functions the Board uses. The mockup's own header records the reason: an earlier draft kept a second ledger of "has this been exported?", and the review screen refused a commit the store considered ready.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead, realmLabelOf } from './shell.js';
import { fetchJson } from './httpClient.js';
import { exportChangeset } from './composeClient.js';
import { useAsync, RealmShell, Progress, Failure } from './async.js';
import { Icon } from './icons.js';
import { useOverlay } from './overlay.js';

const dash = (v) => (v === null || v === undefined || v === '' ? '—' : String(v));

// blockersFor lives in review.logic.js — a classic script whose top-level declarations become globals this module reads, and CommonJS when Node requires it for scripts/portalReview.test.js. Same split as track.logic.js and board.logic.js, for the same reason: the browser never loads CommonJS and Node never loads this file's ESM.

function OpRow({ op, selected, onSelect, onDrop, resolved }) {
    const warn = op.blocked ? 'no longer valid'
        : (op.stale && !resolved) ? 'needs attention'
        : (op.destroys && !op.exported) ? 'export required'
        : op.destroys ? 'export saved' : null;
    return html`
        <div class=${'rvopwrap' + (selected ? ' on' : '')}>
            <button class=${'rvop' + (op.tier === 3 ? ' t3' : '')} role="tab" data-id=${op.id}
                    aria-selected=${selected ? 'true' : 'false'} onClick=${() => onSelect(op.id)}>
                <span class="rvt">T${op.tier}</span>${' '}
                <span class="rvn">
                    <b>${op.name || html`<span class="none">unnamed record</span>`}</b>${' '}
                    <!-- 🔴 THE VERB, NOT THE OP TYPE. The design splits these deliberately: the ROW says what
                         happened in words a person reads ("release date changed"), and the DETAIL panel below names
                         the operation that did it (draw.edit · tier 1 · season). This row printed the op type in
                         both places, so the list of things about to change was written in the registry's vocabulary
                         rather than the reader's. The review API already returns verb — describeInverse's own
                         wording — and nothing was reading it. Measured against the design 2026-09-02 23:24 EDT. -->
                    <span>${op.verb} · ${realmLabelOf(op.realm)}</span>${' '}
                    ${warn ? html`<span class=${'rvw' + (warn === 'export saved' ? ' done' : '')}>${warn}</span>` : null}
                </span>
            </button>
            <button class="rvdrop" onClick=${(e) => { e.stopPropagation(); onDrop(op); }}
                    data-tip=${`Discard the changeset holding “${op.name}”`}
                    aria-label=${`Discard ${op.name}`}><${Icon} name="x" cls="sm" /></button>
        </div>`;
}

function OpDetail({ op, resolved, onResolve }) {
    if (!op) return null;
    const rows = op.rows && op.rows.length
        ? op.rows
        : [{ key: '(no field-level preview captured)', from: '—', to: '—' }];
    return html`
        <div class="rvdet">
            <h4>${op.name}</h4>
            <!-- The realm reads as a PLACE, not as a route key. The design writes "Season" and "Armory";
                 this printed the raw key in lowercase on both the row and this line. realmLabelOf is the one
                 capitalisation map the rail, the crumb and the command palette already share — shell.js:353
                 records what a fourth inline copy of the rule cost. Measured 2026-09-02 23:28 EDT. -->
            <span class="rvop-name">${op.op} · tier ${op.tier} · ${realmLabelOf(op.realm)}</span>

            ${op.blocked ? html`
                <div class="rvcon">
                    <${Icon} name="triangle-alert" cls="lg" />
                    <div>
                        <b>This change no longer validates</b>
                        <p>${op.blocked}</p>
                    </div>
                </div>` : null}

            ${op.stale && !resolved ? html`
                <div class="rvcon">
                    <${Icon} name="triangle-alert" cls="lg" />
                    <div>
                        <b>This record changed after you staged the change</b>
                        <p>Somebody edited <b>${op.name}</b> in Discord while it sat here, so the value you are about to
                           overwrite is not the value you saw. The inverse captured for this op would restore the${' '}
                           <em>old</em> value, which is not the value you want.</p>
                        <div class="rvcx">
                            <button class="chip go" onClick=${() => onResolve(op, 'keep')}>Keep mine, overwrite theirs</button>
                            <button class="chip" onClick=${() => onResolve(op, 'drop')}>Drop my change</button>
                        </div>
                    </div>
                </div>` : null}

            ${!op.staleChecked ? html`
                <p class="chint">This change was staged before the portal started recording what a record looked like at
                   staging time, so whether it has moved since is unknown rather than clear.</p>` : null}

            <div class="rvgrid">
                <div class="rvhead"><span>Field</span><span>Was</span><span>Becomes</span></div>
                ${rows.map((r) => html`
                    <div key=${r.key} class=${'rvr' + (op.destroys ? ' del' : '')}>
                        <span class="rvk">${dash(r.key)}</span>
                        <span class="rvwas">${dash(r.from)}</span>
                        <span class="rvnow">${dash(r.to)}</span>
                    </div>`)}
            </div>

            ${op.destroys ? html`
                <div class=${'rvexp' + (op.exported ? ' done' : '')}>
                    ${op.exported ? html`
                        <b><${Icon} name="check" cls="sm" /> Export saved</b>
                        <p>You are holding a file that re-imports through the bot's own bulk parser, and the round trip is
                           checked byte for byte against <code>adminParser.js</code> on every build. That is what turns
                           this from irreversible into reversible-with-a-file.</p>`
                    : html`
                        <b>Export what this destroys, first</b>
                        <p>This change cannot be undone by an inverse. The bot already serializes its own state into a
                           format its bulk parsers re-ingest, so the export is nearly free — and it is the strongest
                           safeguard available. The commit stays closed until you take it.</p>
                        <!-- 🔴 THE EXPORT DOES NOT HAPPEN HERE. The data and the format both live in the realm, and
                             Review holding its own copy of five export builders is exactly how the package ended up
                             with two disagreeing answers to "has this been exported?". This sends you to the one
                             implementation. -->
                        <a class="chip go" href=${'#/' + op.realm}>Export in ${op.realm} →</a>`}
                </div>`
            : html`
                <p class="chint" style="margin-top:16px">Tier ${op.tier} — an exact inverse was captured when this was staged, so it can be
                   undone after it commits.</p>`}
        </div>`;
}

export function ReviewRealm({ session }) {
    const load = useAsync(() => fetchJson('/api/review'), []);
    const data = load.data;
    const [sel, setSel] = useState(null);
    const [resolved, setResolved] = useState({});
    const [confirmText, setConfirmText] = useState({});
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(null);   // {total, done, current, failed} while a run is in flight
    const overlay = useOverlay();

    const refresh = load.reload;

    if (!data) return html`<${RealmShell} realm="review" session=${session} error=${load.error} slow=${load.slow}
                                          onRetry=${load.reload} skeleton=${{ rows: 7, lines: [22, 40, 18, 10] }} />`;

    const ops = data.ops || [];
    const changesets = data.changesets || [];
    const blockers = blockersFor(ops, changesets, resolved, confirmText);
    const needExport = changesets.filter((c) => c.tier === 3 && !c.exportedAt);

    async function exportOne(changeset) {
        setBusy(true);
        const res = await exportChangeset(changeset.id, session.csrfToken);
        setBusy(false);
        const refused = refusalOf(res);
        if (refused) return overlay.say(`Not exported — ${refused}`);
        overlay.say('Export saved. This change can commit now.');
        refresh();
    }
    const selected = ops.find((o) => o.id === sel) || ops[0] || null;

    const stats = [
        { value: ops.length, label: ops.length === 1 ? 'change' : 'changes', lead: true, tone: ops.length ? 'stg' : undefined, accent: 'var(--r-review)' },
        { value: new Set(ops.map((o) => o.realm)).size, label: 'realms' },
        // 🔴 THIS WAS `tone: 'bad'` AND `.stat.bad` HAS NO RULE IN EITHER STYLESHEET, so the one number that says WHY you cannot commit rendered in ordinary ink. Fourth realm to ship this exact defect -- home, access and analytics preceded it -- and the FIRST found by a gate rather than by eye. The design paints this figure in the warn colour (`review.html:20` renders the same count from `blockers()` in warn), which is what `.stat.warn .v` gives it.
        { value: blockers.length, label: blockers.length === 1 ? 'blocker' : 'blockers', tone: blockers.length ? 'warn' : undefined },
    ];

    async function discardChangeset(op) {
        setBusy(true);
        const res = await fetchJson(`/api/changeset/${op.changesetId}/discard`, {
            method: 'POST', headers: { 'x-csrf-token': session.csrfToken },
        });
        setBusy(false);
        const refused = refusalOf(res);
        if (refused) return overlay.say(`Not discarded — ${refused}`);
        setSel(null); refresh();
    }

    // One transaction per changeset, and every changeset in order. The bot re-reads on every interaction, so a half-applied set reaches real players within seconds — atomicity here is load-bearing rather than tidy. Committing sequentially rather than in parallel is deliberate: a later changeset may depend on an earlier one having landed. 🔴 THIS LOOP THREW AWAY EVERY ANSWER IT GOT. Each commit was awaited and its payload dropped, so a tier-3 changeset refused for a mistyped confirmation word — a 409 carrying the exact sentence explaining it — produced no message, no mark, and a list that refreshed looking identical. The reader presses the button again. Worse, a failure at changeset four of nine kept going through all nine, which is the opposite of what the sequential order is FOR: a later changeset may depend on an earlier one having landed, so the first refusal has to stop the run.
    //
    // The progress readout is per-op and NAMES the one that stopped it, because a percentage cannot say which, and at that moment "which" is the only question worth answering.
    async function runAll(kind) {
        const commit = kind === 'commit';
        setBusy(true);
        setProgress({ total: changesets.length, done: 0, current: '' });
        for (let i = 0; i < changesets.length; i++) {
            const c = changesets[i];
            setProgress({ total: changesets.length, done: i, current: `${c.ops?.length || 0} change${(c.ops?.length || 0) === 1 ? '' : 's'}` });
            const res = await fetchJson(`/api/changeset/${c.id}/${commit ? 'commit' : 'discard'}`, {
                method: 'POST',
                headers: { 'x-csrf-token': session.csrfToken, 'content-type': 'application/json' },
                body: JSON.stringify(commit && c.tier === 3 ? { confirmText: confirmText[c.id] || '' } : {}),
            });
            const refused = refusalOf(res);
            if (refused) {
                setProgress({ total: changesets.length, done: i, failed: refused });
                setBusy(false);
                refresh();
                return;
            }
        }
        setProgress(null); setBusy(false); setConfirmText({}); setResolved({}); setSel(null); refresh();
    }
    const commitAll = () => runAll('commit');
    const discardAll = () => runAll('discard');

    const viewSlot = ops.length === 0
        ? html`
            <section class="panel"><div class="ph"><span class="t">Changeset</span></div>
                <div class="rvnone">
                    <h4>Nothing is staged</h4>
                    <p>Everything in the portal matches what the bot is serving right now. Changes arrive here when you
                       stage them from any realm — this screen is the only place they become real.</p>
                    <div class="rvcx">
                        <a class="chip" href="#/season">Go to Season</a>
                        <a class="chip" href="#/armory">Go to Armory</a>
                        <a class="chip" href="#/broadcast">Go to Broadcast</a>
                    </div>
                </div>
            </section>`
        : html`
            <section class="panel">
                <div class="ph">
                    <span class="t">Changeset</span>
                    <span class="sp">${ops.length} change${ops.length > 1 ? 's' : ''} · ${changesets.length === 1
                        ? 'commits as one transaction' : `${changesets.length} transactions, committed in order`}</span>
                </div>
                <div class="rvwrap">
                    <div class="rvlist" role="tablist" aria-label="Staged changes">
                        ${ops.map((o) => html`
                            <${OpRow} key=${o.id} op=${o} selected=${selected && o.id === selected.id}
                                      resolved=${Boolean(resolved[o.id])} onSelect=${setSel} onDrop=${discardChangeset} />`)}
                    </div>
                    <${OpDetail} op=${selected} resolved=${Boolean(selected && resolved[selected.id])}
                                 onResolve=${(op, how) => {
                                     if (how === 'drop') return discardChangeset(op);
                                     setResolved({ ...resolved, [op.id]: true });
                                 }} />
                </div>
                <div class="rvfoot">
                    ${changesets.filter((c) => c.tier === 3).map((c) => html`
                        <span key=${c.id} class="rvconf">
                            <label for=${'cw-' + c.id}>Type <b>${c.confirmText}</b> to confirm</label>
                            <input id=${'cw-' + c.id} type="text" autocomplete="off" spellcheck="false"
                                   placeholder=${c.confirmText} value=${confirmText[c.id] || ''}
                                   onInput=${(e) => setConfirmText({ ...confirmText, [c.id]: e.target.value })} />
                        </span>`)}
                    <span class="sp"></span>
                    <!-- 🔴 THE GATE NAMED THE PROBLEM AND OFFERED NO WAY THROUGH IT. Review said "1 tier-3 change needs an export before it will commit" and stopped there: the only Export control in the portal was on Season's Board, one realm away, and nothing on this screen said so. A blocker that states a precondition without the control that satisfies it is a dead end with good manners. -->
                    <!-- 🔴 THE MASTHEAD COUNTED THEM ALL AND THE FOOTER NAMED ONE. blockersFor returns a
                         LIST — an export gate, a stale record, a failed validation, and one entry per
                         unconfirmed tier-3 changeset — and this rendered blockers[0] only. Measured on the
                         fixture: the masthead read BLOCKERS 3 above a single sentence, so a reader who
                         cleared that one had no way to learn what the other two were except by pressing
                         Commit and being refused again. Every blocker is listed now, each with its own way
                         through where one exists — which is what the note above already committed to. -->
                    ${blockers.length
                        ? html`<span class="rvgates">
                                   ${blockers.map((b) => html`
                                       <span class="rvgate" key=${b.kind + b.msg}>
                                           <${Icon} name="triangle-alert" />${b.msg}
                                           ${b.kind === 'export' && needExport.length ? html`
                                               <button class="pill sm" disabled=${busy}
                                                       onClick=${() => exportOne(needExport[0])}>Export it now</button>` : null}
                                       </span>`)}
                               </span>`
                        : html`<span class="rvgate ok"><${Icon} name="check" />Ready — ${ops.length} change${ops.length > 1 ? 's' : ''} to write</span>`}
                    <button class="btn no" disabled=${busy} onClick=${() => overlay.confirm({
                        op: 'changeset.discard', tier: 1, danger: true, confirmLabel: 'Discard all',
                        title: `Discard all ${ops.length} staged change${ops.length > 1 ? 's' : ''}?`,
                        // The old copy said each change is 'reverted — the portal puts the previous value back' AND that none of it ever reached Discord, which are two different mechanics: if it never reached Discord there is no previous value out there to restore. Both halves are true of different things, so this says which is which.
                        body: html`<p class="dw-p">None of this ever reached Discord, so nothing changes for players.
                            Every row on the page goes back to the value it had before you touched it.</p>`,
                        onConfirm: discardAll,
                    })}>Discard all</button>
                    <button class="btn go" disabled=${busy || blockers.length > 0} onClick=${() => overlay.confirm({
                        op: 'changeset.commit', tier: ops.some((o) => o.tier === 3) ? 3 : 2,
                        confirmLabel: `Commit ${ops.length} change${ops.length > 1 ? 's' : ''}`,
                        title: 'Commit these staged changes?',
                        // 🔴 ONE TRANSACTION PER CHANGESET, AND THIS COPY SAID OTHERWISE UNTIL 2026-09-03 09:03 EDT. The meta line above was adjudicated on 2026-09-02 — the portal's "N transactions, committed in order" is TRUE where the design's "commits as one transaction" is not — and that decision stopped one surface short: this overlay, the higher-consequence one, still promised all-or-nothing across every changeset. The loop comment at :173 refutes it — a failure at changeset four of nine leaves three committed. The reader test found it.
                        body: html`
                            <p class="dw-p">${changesets.length === 1
                                ? html`All <b>${ops.length}</b> changes are written in <b>one transaction</b> — they all land or none of them do.`
                                : html`These <b>${ops.length}</b> changes are <b>${changesets.length} separate transactions</b>, committed in order. Each lands whole or not at all; if one is refused, the ones before it stay committed.`}${' '}
                                The bot reads fresh on every interaction, so this is live to players within seconds.</p>
                            <p class="dw-p">Every change is recorded with its inverse, so tier-1 and tier-2 changes stay
                                undoable afterwards${ops.some((o) => o.tier === 3) ? ', and the tier-3 change is recoverable from the export you saved' : ''}.</p>`,
                        onConfirm: commitAll,
                    })}>Commit ${ops.length} change${ops.length > 1 ? 's' : ''}</button>
                </div>
                <!-- Below the bar rather than inside it: the bar is a row of controls that must not reflow while a run is in flight, and a reader watching a nine-changeset commit is looking at the count, not at the buttons. -->
                ${progress ? html`<${Progress} ...${progress} />` : null}
            </section>`;

    return html`
        <${Shell} realm="review" session=${session} busy=${load.hostClass}
                  masthead=${html`<${Masthead} title="Review & commit"
                      sub="Exactly what is about to change, and what it will overwrite, before any of it is written."
                      stats=${stats} />`}
                  viewSlot=${viewSlot} overlaySlot=${overlay.render()} />`;
}
