// portal/ui/board.js — ESM. Season's CONTENT board: Live now / Upcoming / Staged / Ended, whose columns ARE dates, so moving a card moves the item's window.
//
// columnFor/blockedReason/groupByColumn/describeOp/describeInverse come from board.logic.js, loaded as a classic script before this module — see track.js's header for why that is the real cross-runtime split. ⚠️ `gateCommit` and `diffRows` still live there and are still tested; they are read by portal/api/review.js and the Review realm, which is where the commit gate and the field diff belong now.
//
// 🔴 THE REVIEW SCREEN IS 04-armory-and-commit.html's third section, and it did not exist. The whole tier-3 gate was a bare "type the confirm code" input in the Ready column plus a Download link on a blocked card, which is exactly the "dialog that ambushes you at commit" the design spec §8.2 says this realm exists to replace. Built at Harkirat's call, 2026-08-23 15:00 EDT: the operations get listed, each one shows a real before/after field diff against LIVE state, the destructive summary names what is being removed rather than counting it, and the gate is three visible steps.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';

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
            <span class="bd">T${changeset.tier}<span class="dot2">·</span>${changeset.realm || 'season'}${ops.length > 1
                ? html`<span class="dot2">·</span>+${ops.length - 1} more` : null}</span>
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
            <!-- 🔴 THIS WAS THE LAST NATIVE confirm() IN THE PORTAL, and it was invisible because it worked.
                 A browser dialog is the one surface the portal cannot style, cannot make modal on its own
                 terms, and cannot say a tier in — and it sat on a card in a pipeline whose entire subject is
                 which changes are safe to take back. The caller supplies a confirming onDiscard now (season.js
                 opens the shared drawer); this button's job is to ask, not to decide. -->
            <!-- ⚠️ AND THE WAY IN WAS INVISIBLE. Opening the review was the whole CARD's click handler, which
                 announces itself to a screen reader and to nobody else — beside a Discard button that looked
                 like the only thing the card could do. Both verbs are stated now; the card click stays, because
                 a large target is worth keeping once it is no longer the only one. -->
            <div class="actions">
                ${onDiscard ? html`
                    <button onClick=${(e) => { e.stopPropagation(); onDiscard(changeset); }}>Discard</button>` : null}
                <button class="go" onClick=${(e) => { e.stopPropagation(); onOpen(changeset); }}>Open</button>
            </div>
        </div>
    `;
}

// onExport(changeset) satisfies a Blocked tier-3 card's export requirement; onDiscard(changeset) opens the caller's own confirmation.
//
// 🔴 THERE WERE TWO COMMIT SURFACES, AND THIS FILE'S OWN HEADER SAID THERE WAS ONE. The header below has read "there is one commit surface, and it is the review screen" since 2026-08-23 — and this module then rendered a full second one: its own operation list, its own field diff, its own destructive summary, its own three-step tier-3 gate, its own typed confirmation and its own commit button. The Review REALM, built later on this branch, does every one of those things, plus staleness resolution and a real export route, and it is where the rail sends you. Two implementations of the tier-3 gate is the shape that produced "two disagreeing answers to has this been exported?" once already.
//
// 🔴 AND THE DUPLICATE WAS INVISIBLE TO EVERY GATE. Its eleven classes — `.review`, `.oplist`, `.revhead`, `.revbody`, `.revfoot`, `.tally`, `.step`, `.tierbadge`, `.ttl`, `.diffs`, `.rows` — had no rule anywhere in the adopted stylesheet, so the whole panel rendered as unstyled text, and the suite was green throughout. `npm run portal:orphans` is what found it; opening the card is what confirmed it.
//
// The pipeline stays: it is the only view that shows WHERE a changeset is, which the Review screen deliberately does not. Opening a card now goes to the one place that commits. The Ready column's button used to commit the whole ready set directly — a control that applied changes you had not looked at, sitting beside a review screen built precisely so that you would. It now OPENS the review. Committing stays per-changeset, which is the scope 04-armory-and-commit.html's own header states ("3 operations · Season 7 · dior" — the "all 3" in its footer is three OPERATIONS of one changeset, not three changesets), and the footer reports how many remain so a set is still visibly a set. ── the CONTENT board ─────────────────────────────────────────────────────────────────────────────────── Live now / Upcoming / Staged / Ended, per COMPANION §5.2. See board.logic.js's header for why the changeset pipeline that used to be here was the RETIRED design and how a real citation to a superseded document survived three readings.
const BCOLS = [
    { k: 'live', t: 'Live now' }, { k: 'upcoming', t: 'Upcoming' },
    { k: 'staged', t: 'Staged' }, { k: 'ended', t: 'Ended' },
];
// 'ended' is DERIVED, never a target: you cannot decide something has finished, only give it dates that mean it has. Dragging onto it would offer a control that lies about what it does.
const MOVE_TARGETS = ['live', 'upcoming', 'staged'];

const dstr = (d) => String(d || '').slice(0, 10);
const addDays = (iso, n) => {
    const d = new Date(dstr(iso) + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};
const fmtD = (iso) => (iso ? new Date(dstr(iso) + 'T00:00:00Z')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '—');

function BCard({ item, col, ctx, onMove, onOpen }) {
    const soon = boardSoon(item, col, ctx);
    // 🔴 A DIV WITH role=button, NOT A <button>. The staged column's cards contain their own controls, and a button inside a button is invalid HTML the browser silently un-nests — the same reason the pipeline's card was a div. tabindex keeps it in the tab order and the arrow handler keeps it operable, which is what COMPANION §3.6 asks of every drag surface.
    return html`
        <div class=${'bcard' + (col === 'staged' ? ' staged' : '') + (col === 'ended' ? ' ended' : '')}
             data-id=${item.id} draggable="true" tabindex="0" role="button"
             style=${`--c:var(${item.topicVar || '--ink3'})`}
             aria-label=${`${item.title}, ${item.typeLabel || item.lane}, in ${col}. Alt plus left or right arrow moves it.`}
             onDragStart=${(e) => { e.dataTransfer.setData('text/plain', item.id); e.dataTransfer.effectAllowed = 'move'; }}
             onKeyDown=${(e) => {
                 if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
                 e.preventDefault();
                 const order = MOVE_TARGETS;
                 const at = order.indexOf(col);
                 const next = order[Math.max(0, Math.min(order.length - 1, (at < 0 ? 0 : at) + (e.key === 'ArrowRight' ? 1 : -1)))];
                 if (next && next !== col) onMove(item, next);
             }}
             onClick=${() => onOpen && onOpen(item)}>
            <span class="bn">${item.title}</span>
            <span class="bd">${item.typeLabel || item.lane} <span class="dot2">·</span> ${fmtD(item.startDate)} → ${fmtD(item.endDate)}</span>
            <div class=${'bmeta' + (soon ? ' soon' : '')}>${boardMeta(item, col, ctx)}</div>
        </div>`;
}

export function Board({ items, today, newestPatchId, onMove, onOpen }) {
    const ctx = { today, newestPatchNoteId: newestPatchId };
    const cols = groupBoardItems(items, ctx);
    const [collapsed, setCollapsed] = useState(() => {
        try { return new Set(JSON.parse(sessionStorage.getItem('dioreo-board-collapsed') || '[]')); }
        catch { return new Set(); }
    });
    const persist = (next) => {
        setCollapsed(next);
        try { sessionStorage.setItem('dioreo-board-collapsed', JSON.stringify([...next])); } catch { /* private window */ }
    };
    // COMPANION: "All four collapsing is refused, and Expand all guarantees a way back." A board with every column shut is a screen that answers nothing, reached by four ordinary clicks.
    const toggle = (k) => {
        const next = new Set(collapsed);
        if (next.has(k)) next.delete(k);
        else if (next.size < BCOLS.length - 1) next.add(k);
        persist(next);
    };
    const drop = (k) => (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const it = (items || []).find((x) => x.id === id);
        if (it && MOVE_TARGETS.includes(k)) onMove(it, k);
    };

    return html`
        <div class="panel" id="board">
            <div class="ph">
                <span class="t">Board</span>
                <span class="rt">the columns are dates — moving a card moves its window</span>
            </div>
            <div class="bbar">
                <span class="bbar-t">${(items || []).length} items across 4 states — drag a card between columns,
                    or focus one and press <kbd>Alt</kbd>+<kbd>←</kbd>/<kbd>→</kbd>.</span>
                <span class="sp"></span>
                ${collapsed.size ? html`<button class="chip" onClick=${() => persist(new Set())}>Expand all (${collapsed.size} hidden)</button>` : null}
            </div>
            <div class="bcols">
                ${BCOLS.map((c) => {
                    const col = cols[c.k], off = collapsed.has(c.k);
                    return html`
                        <section class=${'bcol' + (off ? ' collapsed' : '')} data-col=${c.k} key=${c.k}
                                 onDragOver=${MOVE_TARGETS.includes(c.k) ? (e) => e.preventDefault() : null}
                                 onDrop=${MOVE_TARGETS.includes(c.k) ? drop(c.k) : null}>
                            <!-- THE WHOLE HEADER IS THE COLLAPSE CONTROL (COMPANION §5.2), which is also why it
                                 is a real button: the pipeline's header was a div, so four columns could not be
                                 collapsed, reached by keyboard, or announced as expandable at all. -->
                            <button class="bcol-h" aria-expanded=${off ? 'false' : 'true'}
                                    aria-label=${`${off ? 'Expand' : 'Collapse'} ${c.t}, ${col.length} items`}
                                    onClick=${() => toggle(c.k)}>
                                <span class="chev" aria-hidden="true"></span>
                                <span class="bcol-t">${c.t}</span>
                                <span class="bcol-n">${col.length}</span>
                                <span class="bcol-sum">${boardColumnSummary(c.k, col, ctx)}</span>
                            </button>
                            <div class="bcol-body">
                                ${col.length
                                    ? col.map((it) => html`<${BCard} key=${it.id} item=${it} col=${c.k} ctx=${ctx} onMove=${onMove} onOpen=${onOpen} />`)
                                    : html`<p class="bempty">${BOARD_EMPTY[c.k]}</p>`}
                            </div>
                        </section>`;
                })}
            </div>
        </div>
    `;
}
