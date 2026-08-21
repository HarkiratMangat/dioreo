// portal/ui/board.js — ESM. The changeset pipeline: Draft -> Staged -> Blocked -> Ready.
//
// columnFor/blockedReason/groupByColumn/gateCommit come from board.logic.js, loaded as a classic
// script before this module — see track.js's header for why that is the real cross-runtime split.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';

const COLUMN_LABEL = { draft: 'Draft', staged: 'Staged', blocked: 'Blocked', ready: 'Ready' };

function Card({ changeset }) {
    const reason = blockedReason(changeset);
    return html`
        <div class=${'card' + (changeset.tier >= 3 ? ' t3' : '') + (reason ? ' blocked' : '')}>
            <div class="ch"><span class="tr">T${changeset.tier}</span> <span class="cn">${changeset.realm}</span></div>
            <span class="cd">${(changeset.ops || []).length} op(s)</span>
            ${reason ? html`<div class="why">${reason}</div>` : null}
        </div>
    `;
}

// onCommit(changeset, confirmText) is called when Ready's Commit button fires; onExport(changeset)
// for the tier-3 export step. Both are thin — they just POST to the changeset API (Task 3).
export function Board({ changesets, onCommit, onExport }) {
    const cols = groupByColumn(changesets);
    const readyCount = cols.ready.length;
    return html`
        <div class="panel" id="board">
            <div class="ph"><span class="t">Changeset pipeline</span></div>
            <div class="cols">
                ${['draft', 'staged', 'blocked', 'ready'].map(key => html`
                    <div class=${'col' + (key === 'ready' ? ' gate' : '')}>
                        <h4>${COLUMN_LABEL[key]}<span class=${'ct' + (key === 'blocked' && cols[key].length ? ' bad' : '')}>${cols[key].length}</span></h4>
                        ${cols[key].map(c => html`<${Card} changeset=${c} />`)}
                        ${key === 'ready' ? html`
                            <button class="commit" disabled=${readyCount === 0} onClick=${() => onCommit(cols.ready)}>
                                Commit ${readyCount} of ${changesets.length}
                            </button>
                        ` : null}
                    </div>
                `)}
            </div>
        </div>
    `;
}
