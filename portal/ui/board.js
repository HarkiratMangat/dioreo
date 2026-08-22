// portal/ui/board.js — ESM. The changeset pipeline: Draft -> Staged -> Blocked -> Ready.
//
// columnFor/blockedReason/groupByColumn/gateCommit come from board.logic.js, loaded as a classic script before this module — see track.js's header for why that is the real cross-runtime split.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';

const COLUMN_LABEL = { draft: 'Draft', staged: 'Staged', blocked: 'Blocked', ready: 'Ready' };

function Card({ changeset, onExport }) {
    const reason = blockedReason(changeset);
    return html`
        <div class=${'card' + (changeset.tier >= 3 ? ' t3' : '') + (reason ? ' blocked' : '')}>
            <div class="ch"><span class="tr">T${changeset.tier}</span> <span class="cn">${changeset.realm}</span></div>
            <span class="cd">${(changeset.ops || []).length} op(s)</span>
            ${changeset.tier >= 3 ? html`<span class="cd" style="display:block;word-break:break-all">confirm id: ${String(changeset._id)}</span>` : null}
            ${reason ? html`
                <div class="why">
                    ${reason}
                    <button onClick=${() => onExport(changeset)}>Download</button>
                </div>
            ` : null}
        </div>
    `;
}

// onCommit(readyChangesets, confirmText) fires on the Ready column's Commit button; onExport(changeset) satisfies a Blocked tier-3 card's export requirement. confirmText is typed HERE, at commit time — it is never known in advance (board.logic.js's columnFor cannot depend on it, see that file's own header), and the server is the actual arbiter of whether it matches; a mismatch surfaces as a 409 the caller reports.
export function Board({ changesets, onCommit, onExport }) {
    const cols = groupByColumn(changesets);
    const readyCount = cols.ready.length;
    const needsConfirm = cols.ready.some(c => c.tier >= 3);
    const [confirmText, setConfirmText] = useState('');
    return html`
        <div class="panel" id="board">
            <div class="ph"><span class="t">Changeset pipeline</span></div>
            <div class="cols">
                ${['draft', 'staged', 'blocked', 'ready'].map(key => html`
                    <div class=${'col' + (key === 'ready' ? ' gate' : '')}>
                        <h4>${COLUMN_LABEL[key]}<span class=${'ct' + (key === 'blocked' && cols[key].length ? ' bad' : '')}>${cols[key].length}</span></h4>
                        ${cols[key].map(c => html`<${Card} changeset=${c} onExport=${onExport} />`)}
                        ${key === 'ready' ? html`
                            ${needsConfirm ? html`
                                <label class="sr-only" for="board-confirm">Type the full changeset ID shown on the card to confirm</label>
                                <input id="board-confirm" placeholder="Type the full changeset ID shown on the card to confirm" value=${confirmText}
                                       onInput=${(e) => setConfirmText(e.target.value)}
                                       style="width:100%;margin-bottom:8px;background:var(--sunk);border:1px solid var(--rule);border-radius:4px;color:var(--ink);padding:6px 8px" />
                            ` : null}
                            <button class="commit" disabled=${readyCount === 0} onClick=${() => onCommit(cols.ready, confirmText)}>
                                Commit ${readyCount} of ${changesets.length}
                            </button>
                        ` : null}
                    </div>
                `)}
            </div>
        </div>
    `;
}
