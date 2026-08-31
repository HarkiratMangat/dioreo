// portal/ui/oneway.js — ESM. The one-way strip: where tier 3 lives.
//
// 🔴 AT THE FOOT OF THE REALM ON PURPOSE. The end of the page is where a reader has already seen everything the operation would destroy — a purge button beside an Add chip at the top asks somebody to decide before they have looked.
//
// ⚠️ THE EXPORT INTERLOCK IS DOWNSTREAM HERE, AND THE MOCKUP'S IS NOT. The mockup gates the BUTTON: it reads "Export first →" until a session-scoped export of that data exists. The portal's export is a property of a CHANGESET, which does not exist until the op is staged, so wiring the mockup's shape literally would mean inventing a second export concept that gates nothing real — a lying affordance, which is the defect this branch has spent its life finding rather than adding. What is real here: pressing a row STAGES the op, Review refuses to commit an unexported tier-3 changeset (gateCommit), and the Export button there now returns the actual records. So the interlock holds; it simply sits one screen later, and each row says so rather than implying the purge happens on click.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';

/* global oneWayItems, whyNoDestroy, owRowState, plural */

export function OneWay({ live, draft, session, overlay, onStage }) {
    const [fields, setFields] = useState({});
    const items = oneWayItems(live, draft);
    const canDestroy = Boolean(session?.canDestroy);
    const why = whyNoDestroy(session);

    function run(item) {
        const value = String(fields[item.id] || '').trim();
        const op = item.field
            ? { ...item.op, payload: { ...item.op.payload, [item.field.key]: value } }
            : item.op;
        overlay.confirm({
            op: item.op.type, tier: 3, danger: true, typed: item.word,
            confirmLabel: item.title,
            title: `${item.title}?`,
            body: html`
                <p class="dw-p">This removes <b>${item.count} ${plural(item.count, item.unit)}</b> and${' '}
                    <b>cannot be undone</b> from inside the portal.</p>
                <p class="dw-p">Nothing happens yet. This stages the change, and Review will not commit it until you
                    have taken an export — that export is the only way back, and it is a real file containing the
                    records this would remove.${session?.isOwner ? '' : html` You are running this under the${' '}
                    <b>Destructive</b> permission the owner granted you.`}</p>`,
            onConfirm: () => onStage(op, item),
        });
    }

    return html`
        <div id="oneway">
        <section class="ow">
            <div class="ow-h">
                <span class="ow-k">ONE-WAY</span>
                <h3>One-way operations</h3>
                <!-- 🔴 THE HEADING IS THE DESIGN'S AND THE PROSE IS NOT, AND THAT SPLIT IS DELIBERATE. The design's
                     body says the portal "will not run one until an export of the same data exists" — which is FALSE
                     here. This screen has no session-scoped export to gate on; the interlock is the changeset export
                     at Review, one screen later, in gateCommit. scripts/portalExport.test.js asserts the mockup's
                     version of that promise can never appear in this tree. A console does not tell an admin it holds
                     a safeguard it does not hold, so the sentence stays the portal's.
                     Same reason for the word below: the codebase's noun is PERMISSION (session.canDestroy, the
                     the destructive permission), not the design's "capability", and there is no export copy to promise. -->
                <p>${html`Everything above this line can be undone from the record it writes. These cannot. Each one stages
                    like any other change, and Review refuses to commit it until an export of the same data exists.`}${' '}
                    ${canDestroy
                        ? (session?.isOwner ? '' : html`<b>You hold the Destructive permission</b>, which only the owner can grant.`)
                        : html`<b>${why}</b>`}</p>
            </div>
            <ul class="ow-l">
                ${items.map((item) => {
                    const st = owRowState(item, { canDestroy, fieldValue: fields[item.id] });
                    return html`
                        <li class=${'ow-i' + (canDestroy ? '' : ' ow-locked')} key=${item.id}>
                            <div class="ow-t"><b>${item.title}</b><span>${item.note}</span></div>
                            <!-- .nw-i is width:100% because every other place it appears is a stacked form field. Here it is a cell in a flex row, so it needs a basis of its own or it claims the whole line and pushes the count and the button onto a second one — the row then reads as two rows and stops lining up with its six siblings. It is 0 1 rather than 1 1 for the same reason one step further: GROWING pushed this row's count to x=1114 while the other six sat at 954, and took the row to 88px against their 65. -->
                            <!-- 🔴 THIS FIELD IS THE TYPING GATE IN FRONT OF SEVEN IRREVERSIBLE OPERATIONS, and the
                                 design does not draw it. It is kept on purpose: a conformance pass moves composition,
                                 never a safeguard. -->
                            ${item.field && canDestroy ? html`
                                <input class="nw-i" type="text" aria-label=${item.field.label} style="flex:0 1 240px;width:auto;min-width:150px"
                                       placeholder=${item.field.placeholder} value=${fields[item.id] || ''}
                                       onInput=${(e) => setFields({ ...fields, [item.id]: e.target.value })} />` : null}
                            <div class="ow-c">${item.count} <em>${plural(item.count, item.unit)}</em></div>
                            <!-- 🔴 REFUSED, NOT STOOD DOWN. The design's button reads "Export first →", gating on a
                                 session-scoped export that does not exist here — the portal's export is a property of a
                                 CHANGESET, which does not exist until the op is staged, so the interlock lives one screen
                                 later in Review's gateCommit. Drawing the design's affordance would offer an admin a
                                 safeguard this screen cannot honour. owRowState is the real state and it stays. -->
                            ${st.state === 'ready'
                                ? html`<button class="pill sm dang" onClick=${() => run(item)}>${st.label}</button>`
                                : html`<button class="pill sm" disabled title=${st.state === 'locked' ? why : ''}>${st.label}</button>`}
                        </li>`;
                })}
            </ul>
        </section>
        </div>`;
}
