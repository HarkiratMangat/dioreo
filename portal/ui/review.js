// portal/ui/review.js — ESM. The Review realm: exactly what is about to change, and what it will overwrite, before any of it is written.
//
// 🔴 THE HIGHEST-CONSEQUENCE SCREEN IN THE PORTAL, and the only one that is cross-realm. Every other realm shows one part of the bot; this shows every open changeset the signed-in admin owns, in any realm, flattened to individual operations with a field-level diff each. The Board is its per-realm sibling and answers a different question: the Board is where work waits, Review is where it becomes real.
//
// It derives nothing itself. Tier, diff, gate and wording all arrive from /api/review, which reads them from validateSet, previewSet, gateCommit and describeOp — the same functions the Board uses. The mockup's own header records the reason: an earlier draft kept a second ledger of "has this been exported?", and the review screen refused a commit the store considered ready.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead } from './shell.js';
import { fetchJson } from './httpClient.js';
import { Icon } from './icons.js';

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
                    aria-pressed=${selected} onClick=${() => onSelect(op.id)}>
                <span class="rvt">T${op.tier}</span>
                <span class="rvn">
                    <b>${op.name}</b>
                    <span>${op.op} · ${op.realm}</span>
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
            <span class="rvop-name">${op.op} · tier ${op.tier} · ${op.realm}</span>

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
                           overwrite is not the value you saw. The inverse captured for this op would restore the
                           <em>old</em> old value, which is not what you want.</p>
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
                <p class="chint">Tier ${op.tier} — an exact inverse was captured when this was staged, so it can be
                   undone after it commits.</p>`}
        </div>`;
}

export function ReviewRealm({ session }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const [sel, setSel] = useState(null);
    const [resolved, setResolved] = useState({});
    const [confirmText, setConfirmText] = useState({});
    const [busy, setBusy] = useState(false);

    function refresh() {
        fetchJson('/api/review').then((d) => {
            if (d.signedOut || d.forbidden) return setError(true);
            setData(d);
        });
    }
    useEffect(refresh, []);

    if (error) return html`<${NoAccess} />`;
    if (!data) return html`<p style="padding:24px">Loading…</p>`;

    const ops = data.ops || [];
    const changesets = data.changesets || [];
    const blockers = blockersFor(ops, changesets, resolved, confirmText);
    const selected = ops.find((o) => o.id === sel) || ops[0] || null;

    const stats = [
        { value: ops.length, label: ops.length === 1 ? 'change' : 'changes' },
        { value: new Set(ops.map((o) => o.realm)).size, label: 'realms' },
        { value: blockers.length, label: blockers.length === 1 ? 'blocker' : 'blockers', tone: blockers.length ? 'bad' : undefined },
    ];

    async function discardChangeset(op) {
        setBusy(true);
        await fetchJson(`/api/changeset/${op.changesetId}/discard`, {
            method: 'POST', headers: { 'x-csrf-token': session.csrfToken },
        });
        setBusy(false); setSel(null); refresh();
    }

    // One transaction per changeset, and every changeset in order. The bot re-reads on every interaction, so a half-applied set reaches real players within seconds — atomicity here is load-bearing rather than tidy. Committing sequentially rather than in parallel is deliberate: a later changeset may depend on an earlier one having landed.
    async function commitAll() {
        setBusy(true);
        for (const c of changesets) {
            const body = c.tier === 3 ? { confirmText: confirmText[c.id] || '' } : {};
            await fetchJson(`/api/changeset/${c.id}/commit`, {
                method: 'POST', headers: { 'x-csrf-token': session.csrfToken, 'content-type': 'application/json' },
                body: JSON.stringify(body),
            });
        }
        setBusy(false); setConfirmText({}); setResolved({}); setSel(null); refresh();
    }

    async function discardAll() {
        setBusy(true);
        for (const c of changesets) {
            await fetchJson(`/api/changeset/${c.id}/discard`, {
                method: 'POST', headers: { 'x-csrf-token': session.csrfToken },
            });
        }
        setBusy(false); setConfirmText({}); setResolved({}); setSel(null); refresh();
    }

    const viewSlot = ops.length === 0
        ? html`
            <div class="panel"><div class="ph"><span class="t">Changeset</span></div>
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
            </div>`
        : html`
            <div class="panel">
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
                    ${blockers.length
                        ? html`<span class="rvgate"><${Icon} name="triangle-alert" cls="sm" />${blockers[0].msg}</span>`
                        : html`<span class="rvgate ok"><${Icon} name="check" cls="sm" />Ready — ${ops.length} change${ops.length > 1 ? 's' : ''} to write</span>`}
                    <button class="danger" onClick=${discardAll} disabled=${busy}>Discard all</button>
                    <button class="accent-fill" onClick=${commitAll} disabled=${busy || blockers.length > 0}>
                        Commit ${ops.length} change${ops.length > 1 ? 's' : ''}</button>
                </div>
            </div>`;

    return html`
        <${Shell} realm="review" session=${session}
                  masthead=${html`<${Masthead} title="Review & commit"
                      sub="Exactly what is about to change, and what it will overwrite, before any of it is written."
                      stats=${stats} />`}
                  viewSlot=${viewSlot} />`;
}
