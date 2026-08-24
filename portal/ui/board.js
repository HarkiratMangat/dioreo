// portal/ui/board.js — ESM. The changeset pipeline (Draft -> Staged -> Blocked -> Ready) and the REVIEW CHANGESET screen it opens into.
//
// columnFor/blockedReason/groupByColumn/gateCommit/describeOp/describeInverse/diffRows come from board.logic.js, loaded as a classic script before this module — see track.js's header for why that is the real cross-runtime split.
//
// 🔴 THE REVIEW SCREEN IS 04-armory-and-commit.html's third section, and it did not exist. The whole tier-3 gate was a bare "type the confirm code" input in the Ready column plus a Download link on a blocked card, which is exactly the "dialog that ambushes you at commit" the design spec §8.2 says this realm exists to replace. Built at Harkirat's call, 2026-08-23 15:00 EDT: the operations get listed, each one shows a real before/after field diff against LIVE state, the destructive summary names what is being removed rather than counting it, and the gate is three visible steps.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { fetchJson } from './httpClient.js';

const COLUMN_LABEL = { draft: 'Draft', staged: 'Staged', blocked: 'Blocked', ready: 'Ready' };
const COLUMN_NOTE = {
    draft: 'Started, not yet staged. Nothing here is visible to the bot.',
    staged: 'Validated and previewed. Waiting on the rest of the set.',
    blocked: 'Will not commit until the stated reason is resolved.',
    ready: 'Committing applies the whole set in one transaction — all of it lands, or none of it does.',
};

function Card({ changeset, onExport, onOpen, onDiscard, selected }) {
    const reason = blockedReason(changeset);
    const ops = changeset.ops || [];
    return html`
        <button class=${'card' + (changeset.tier >= 3 ? ' t3' : '') + (reason ? ' blocked' : '') + (selected ? ' on' : '')}
                onClick=${() => onOpen(changeset)}>
            <div class="ch"><span class="tr">T${changeset.tier}</span> <span class="cn">${describeOp(ops[0])}</span></div>
            ${ops.length > 1 ? html`<span class="cd">+ ${ops.length - 1} more operation${ops.length === 2 ? '' : 's'}</span>` : null}
            ${describeInverse(ops[0]) ? html`<span class="inv"><b>${describeInverse(ops[0])}</b></span>` : null}
            ${reason ? html`
                <div class="why">
                    ${reason}
                    ${changeset.tier >= 3 && !changeset.exportedAt
                        ? html`<span role="button" tabindex="0" class="holder" style="margin-left:6px"
                                     onClick=${(e) => { e.stopPropagation(); onExport(changeset); }}
                                     onKeyDown=${(e) => { if (e.key === 'Enter') { e.stopPropagation(); onExport(changeset); } }}>Download</span>`
                        : null}
                </div>
            ` : null}
            ${onDiscard ? html`
                <button class="discard" style="margin-top:6px"
                        onClick=${(e) => { e.stopPropagation(); if (confirm('Discard this staged change? This does not undo anything already live — it only abandons what has not committed yet.')) onDiscard(String(changeset._id)); }}>Discard</button>
            ` : null}
        </button>
    `;
}

// One operation's before/after. `preview` entries come from core/changeset.js's previewSet, whose per-op shape is {index, before, after} — every entity's own preview() returns exactly that pair.
function OpDiff({ op, entry }) {
    const rows = diffRows(entry && entry.before, entry && entry.after);
    const before = (entry && entry.before) || {};
    const after = (entry && entry.after) || {};
    return html`
        <div class="diffs">
            <div class="diff">
                <h6>Before — live now</h6>
                <div class="rows">
                    ${rows.length === 0 ? html`<div class="r"><span class="v">Nothing exists yet.</span></div>` : null}
                    ${rows.map(r => html`<div class=${'r ' + (r.kind === 'add' ? '' : 'del')}><span class="s">${r.kind === 'add' ? '' : '−'}</span><span class="k">${r.key}</span><span class="v">${r.from}</span></div>`)}
                </div>
            </div>
            <div class="diff">
                <h6>After — if you commit</h6>
                <div class="rows">
                    ${rows.length === 0 ? html`<div class="r"><span class="v">${describeOp(op)}</span></div>` : null}
                    ${rows.map(r => html`<div class=${'r ' + (r.kind === 'del' ? '' : 'add')}><span class="s">${r.kind === 'del' ? '' : '+'}</span><span class="k">${r.key}</span><span class="v">${r.to}</span></div>`)}
                </div>
            </div>
        </div>
    `;
}

// A tier-3 op destroys state with no exact inverse, so the review names WHAT it destroys rather than how many. "This permanently removes 4 draws" plus the four titles is the difference between a warning you can act on and a number you have to go and look up.
function Destructive({ entry, tier }) {
    // 🔴 GATED ON TIER 3, AND SHAPE-AGNOSTIC ON PURPOSE. A tier-2 op like bulkReplace returns before:{draws:[...]} — the FULL current list, because that list IS its own inverse — which this component used to read as "N items removed" on a routine, non-destructive edit. The tier gate alone kills that false alarm. A single delete's preview returns before:{draw:{...}} (an object, not an array), which the old array-only filter never matched either — so a real delete showed no warning at all. Both directions were wrong; this reads either shape.
    if (tier < 3) return null;
    const before = (entry && entry.before) || {};
    const removed = Object.entries(before)
        .filter(([, v]) => v && typeof v === 'object')
        .flatMap(([, v]) => Array.isArray(v) ? v : [v]);
    if (!removed.length) return null;
    return html`
        <div class="callout bad" style="border-top:0;margin-top:12px">
            <b>This permanently removes ${removed.length} item${removed.length === 1 ? '' : 's'}:</b>
            ${removed.slice(0, 8).map(r => html`<span style="flex:1 1 100%">• ${r.title || r.text || r.weaponName || String(r).slice(0, 50)}</span>`)}
            ${removed.length > 8 ? html`<span style="flex:1 1 100%">…and ${removed.length - 8} more.</span>` : null}
        </div>
    `;
}

function Review({ detail, onExport, onCommit, onClose, busy }) {
    const [opIndex, setOpIndex] = useState(0);
    const [confirmText, setConfirmText] = useState('');
    const ops = detail.ops || [];
    const op = ops[opIndex];
    const entry = (detail.preview || []).find(p => p.index === opIndex);
    const tier3 = detail.tier >= 3;
    const exported = !!detail.exportedAt;
    const typed = confirmText === detail.confirmText;
    const gate = gateCommit({ tier: detail.tier, exportedAt: detail.exportedAt, confirmText, expectText: detail.confirmText });

    return html`
        <div class="panel" id="review">
            <div class="ph">
                <span class="t">Review changeset</span>
                <span class="rt">${ops.length} operation${ops.length === 1 ? '' : 's'} · ${detail.realm}</span>
            </div>
            <div class="review">
                <div class="oplist">
                    <h5>Operations</h5>
                    ${ops.map((o, i) => html`
                        <button class=${'card' + (i === opIndex ? ' on' : '')} onClick=${() => setOpIndex(i)}>
                            <div class="ch"><span class="tr">T${detail.tier}</span> <span class="cn">${describeOp(o)}</span></div>
                            ${describeInverse(o) ? html`<span class="cd">${describeInverse(o)}</span>` : null}
                        </button>
                    `)}
                </div>
                <div class="revbody">
                    <div class="revhead">
                        <span class="ttl">${describeOp(op)}</span>
                        <span class=${'tierbadge' + (tier3 ? ' t3' : '')}>${tier3 ? 'Tier 3 — irreversible' : `Tier ${detail.tier}`}</span>
                    </div>
                    ${(detail.failures || []).length ? html`
                        <div class="callout bad"><b>This set failed validation.</b>
                            ${detail.failures.map(f => html`<span style="flex:1 1 100%">• ${f.reason || f.message || JSON.stringify(f)}</span>`)}
                        </div>
                    ` : html`<${OpDiff} op=${op} entry=${entry} />`}
                    <${Destructive} entry=${entry} tier=${detail.tier} />
                    ${tier3 ? html`
                        <div class="gate">
                            <h6>Before this can commit</h6>
                            <p class="why">Tier 3 destroys state with no exact inverse. The export below is the genuine restore path — the bulk formats round-trip back through the bot's own parsers, so it is a real backup rather than a receipt.</p>
                            <div class="step done"><span class="n">1</span><span class="lbl">Previewed the rendered result</span></div>
                            <div class=${'step' + (exported ? ' done' : '')}>
                                <span class="n">2</span><span class="lbl">Download what this replaces</span>
                                ${exported ? null : html`<button onClick=${() => onExport({ ...detail, _id: detail.changesetId })}>Export .txt</button>`}
                            </div>
                            <div class=${'step' + (typed ? ' done' : '')}>
                                <span class="n">3</span>
                                <label class="sr-only" for="review-confirm">Type ${detail.confirmText} to confirm</label>
                                <span class="lbl">Type <code>${detail.confirmText}</code> to confirm</span>
                                <input id="review-confirm" value=${confirmText} placeholder="confirm code"
                                       onInput=${(e) => setConfirmText(e.target.value)} />
                            </div>
                        </div>
                    ` : null}
                </div>
            </div>
            <div class="revfoot">
                <span class="tally">${gate.ok ? 'Ready to commit' : gate.reason}${detail.remaining ? ` · ${detail.remaining} more ready after this` : ''}</span>
                <span class="sp"></span>
                <button onClick=${onClose}>Keep staged</button>
                <button class="commit" style="width:auto" disabled=${!gate.ok} aria-busy=${busy ? 'true' : null}
                        onClick=${() => onCommit(detail, confirmText)}>Commit ${ops.length} operation${ops.length === 1 ? '' : 's'}</button>
            </div>
        </div>
    `;
}

// onCommit(changesets, confirmText) applies a set; onExport(changeset) satisfies a Blocked tier-3 card's export requirement. confirmText is typed at commit time — it is never known in advance (board.logic.js's columnFor cannot depend on it, see that file's own header), and the server is the actual arbiter of whether it matches; a mismatch surfaces as a 409 the caller reports.
//
// 🔴 THERE IS ONE COMMIT SURFACE, AND IT IS THE REVIEW SCREEN. The Ready column's button used to commit the whole ready set directly — a control that applied changes you had not looked at, sitting beside a review screen built precisely so that you would. It now OPENS the review. Committing stays per-changeset, which is the scope 04-armory-and-commit.html's own header states ("3 operations · Season 7 · dior" — the "all 3" in its footer is three OPERATIONS of one changeset, not three changesets), and the footer reports how many remain so a set is still visibly a set.
export function Board({ changesets, onCommit, onExport, onDiscard }) {
    const cols = groupByColumn(changesets);
    const readyCount = cols.ready.length;
    const [openId, setOpenId] = useState(null);
    const [detail, setDetail] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!openId) { setDetail(null); return; }
        // Re-fetched rather than read from the list, because the preview has to be computed against state as it is NOW — see the GET /api/changeset/:id/preview route's own header.
        fetchJson(`/api/changeset/${openId}/preview`)
            .then((d) => setDetail({ ...d, remaining: Math.max(0, cols.ready.length - 1) }));
    // openId ONLY — depending on `changesets` re-ran this preview (a real server round-trip re-checking permissions against live state) on every unrelated changeset elsewhere updating, for whichever changeset happened to be open.
    }, [openId]);

    async function commitOne(d, confirmText) {
        setBusy(true);
        await onCommit([{ _id: d.changesetId, tier: d.tier }], confirmText);
        setBusy(false);
        setOpenId(null);
    }

    return html`
        <div class="panel" id="board">
            <div class="ph">
                <span class="t">Changeset pipeline</span>
                <span class="rt">edits move left → right · commit is the last boundary</span>
            </div>
            ${changesets.length === 0 ? html`<p class="empty">Nothing is staged. Changes you compose in the Track or the manifest land here before they go live.</p>` : html`
                <div class="cols">
                    ${['draft', 'staged', 'blocked', 'ready'].map(key => html`
                        <div class=${'col' + (key === 'ready' ? ' gate' : '')}>
                            <h4>${COLUMN_LABEL[key]}<span class=${'ct' + (key === 'blocked' && cols[key].length ? ' bad' : '')}>${cols[key].length}</span></h4>
                            ${cols[key].map(c => html`<${Card} changeset=${c} onExport=${onExport} onOpen=${(cs) => setOpenId(String(cs._id))} onDiscard=${key !== 'ready' ? onDiscard : null} selected=${openId === String(c._id)} />`)}
                            ${key === 'ready' && readyCount ? html`
                                <button class="commit" onClick=${() => setOpenId(String(cols.ready[0]._id))}>
                                    Review ${readyCount} ready
                                </button>
                            ` : null}
                            <p class="colnote">${COLUMN_NOTE[key]}</p>
                        </div>
                    `)}
                </div>
            `}
        </div>
        ${detail ? html`<${Review} key=${detail.changesetId} detail=${detail} onExport=${onExport} onCommit=${commitOne} onClose=${() => setOpenId(null)} busy=${busy} />` : null}
    `;
}
