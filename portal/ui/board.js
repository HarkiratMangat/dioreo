// portal/ui/board.js — ESM. The changeset pipeline (Draft -> Staged -> Blocked -> Ready) and the REVIEW CHANGESET screen it opens into.
//
// columnFor/blockedReason/groupByColumn/describeOp/describeInverse come from board.logic.js, loaded as a classic script before this module — see track.js's header for why that is the real cross-runtime split. ⚠️ `gateCommit` and `diffRows` still live there and are still tested; they are read by portal/api/review.js and the Review realm, which is where the commit gate and the field diff belong now.
//
// 🔴 THE REVIEW SCREEN IS 04-armory-and-commit.html's third section, and it did not exist. The whole tier-3 gate was a bare "type the confirm code" input in the Ready column plus a Download link on a blocked card, which is exactly the "dialog that ambushes you at commit" the design spec §8.2 says this realm exists to replace. Built at Harkirat's call, 2026-08-23 15:00 EDT: the operations get listed, each one shows a real before/after field diff against LIVE state, the destructive summary names what is being removed rather than counting it, and the gate is three visible steps.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';

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
        <!-- 🔴 A DIV, NOT A BUTTON, AND THE REASON IS THAT IT CONTAINS BUTTONS. This card carries a Discard
             control and a Download control, and a button inside a button is invalid HTML — the browser closes
             the outer one early and silently reparents the rest, which is why the adopted sheet has a
             .bcard .actions button rule and no button.bcard reset (compare button.tile, which HAS one because
             a tile really is a button). It shipped as a nested button here and in the .card version before it.
             role/tabindex/keydown give a div the same keyboard contract without the parse hazard. -->
        <div class=${'bcard' + (changeset.tier >= 3 ? ' t3' : '') + (reason ? ' blocked' : '') + (selected ? ' on' : '')}
             style=${`--c:var(--r-${changeset.realm || 'season'})`}
             role="button" tabindex="0"
             onClick=${() => onOpen(changeset)}
             onKeyDown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(changeset); } }}>
            <span class="bn">${describeOp(ops[0])}</span>
            <span class="bd">T${changeset.tier} · ${changeset.realm || 'season'}${ops.length > 1 ? ` · +${ops.length - 1} more` : ''}</span>
            ${describeInverse(ops[0]) ? html`<span class="bmeta"><b>${describeInverse(ops[0])}</b></span>` : null}
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
                <!-- 🔴 THIS WAS THE LAST NATIVE confirm() IN THE PORTAL, and it was invisible because it worked.
                     A browser dialog is the one surface the portal cannot style, cannot make modal on its own
                     terms, and cannot say a tier in — and it sat on a card in a pipeline whose entire subject is
                     which changes are safe to take back. The caller supplies a confirming onDiscard now (season.js
                     opens the shared drawer); this button's job is to ask, not to decide. -->
                <button class="chip danger" style="margin-top:6px"
                        onClick=${(e) => { e.stopPropagation(); onDiscard(changeset); }}>Discard</button>
            ` : null}
        </div>
    `;
}

// onExport(changeset) satisfies a Blocked tier-3 card's export requirement; onDiscard(changeset) opens the caller's own confirmation.
//
// 🔴 THERE WERE TWO COMMIT SURFACES, AND THIS FILE'S OWN HEADER SAID THERE WAS ONE. The header below has read "there is one commit surface, and it is the review screen" since 2026-08-23 — and this module then rendered a full second one: its own operation list, its own field diff, its own destructive summary, its own three-step tier-3 gate, its own typed confirmation and its own commit button. The Review REALM, built later on this branch, does every one of those things, plus staleness resolution and a real export route, and it is where the rail sends you. Two implementations of the tier-3 gate is the shape that produced "two disagreeing answers to has this been exported?" once already.
//
// 🔴 AND THE DUPLICATE WAS INVISIBLE TO EVERY GATE. Its eleven classes — `.review`, `.oplist`, `.revhead`, `.revbody`, `.revfoot`, `.tally`, `.step`, `.tierbadge`, `.ttl`, `.diffs`, `.rows` — had no rule anywhere in the adopted stylesheet, so the whole panel rendered as unstyled text, and the suite was green throughout. `npm run portal:orphans` is what found it; opening the card is what confirmed it.
//
// The pipeline stays: it is the only view that shows WHERE a changeset is, which the Review screen deliberately does not. Opening a card now goes to the one place that commits. The Ready column's button used to commit the whole ready set directly — a control that applied changes you had not looked at, sitting beside a review screen built precisely so that you would. It now OPENS the review. Committing stays per-changeset, which is the scope 04-armory-and-commit.html's own header states ("3 operations · Season 7 · dior" — the "all 3" in its footer is three OPERATIONS of one changeset, not three changesets), and the footer reports how many remain so a set is still visibly a set.
export function Board({ changesets, onExport, onDiscard }) {
    const cols = groupByColumn(changesets);
    const readyCount = cols.ready.length;
    const toReview = () => { location.hash = '#/review'; };

    return html`
        <div class="panel" id="board">
            <div class="ph">
                <span class="t">Changeset pipeline</span>
                <span class="rt">edits move left → right · commit is the last boundary</span>
            </div>
            ${changesets.length === 0 ? html`<p class="empty">Nothing is staged. Changes you compose in the Track or the manifest land here before they go live.</p>` : html`
                <div class="bbar">
                    <span class="bbar-t">${changesets.length} in flight</span>
                    <span class="sp"></span>
                    ${readyCount ? html`<button class="pill lead" onClick=${toReview}>Review ${readyCount} ready</button>` : null}
                </div>
                <!-- 🔴 THE COLUMN NOTE MOVED INTO THE HEADER, WHICH IS THE WHOLE DIFFERENCE. It used to sit under
                     the cards as a paragraph — so a column with six cards put its own explanation a screenful
                     below the thing it explains, which is the affordance-distance shape this branch keeps
                     removing. .bcol-sum is the adopted sheet's slot for it: one line, beside the count, on
                     the header you are already reading. -->
                <div class="bcols">
                    ${['draft', 'staged', 'blocked', 'ready'].map(key => html`
                        <div class=${'bcol' + (key === 'ready' ? ' gate' : '')} key=${key}>
                            <div class="bcol-h">
                                <span class="chev" aria-hidden="true"></span>
                                <span class="bcol-t">${COLUMN_LABEL[key]}</span>
                                <span class=${'bcol-n' + (key === 'blocked' && cols[key].length ? ' bad' : '')}>${cols[key].length}</span>
                                <span class="bcol-sum">${COLUMN_NOTE[key]}</span>
                            </div>
                            <div class="bcol-body">
                                ${cols[key].length
                                    ? cols[key].map(c => html`<${Card} key=${String(c._id)} changeset=${c} onExport=${onExport} onOpen=${toReview} onDiscard=${key !== 'ready' ? onDiscard : null} selected=${false} />`)
                                    : html`<p class="bempty">nothing here</p>`}
                            </div>
                        </div>
                    `)}
                </div>
            `}
        </div>
    `;
}
