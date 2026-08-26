// portal/ui/tray.js — ESM. The inline "saved · undo" tray for tier-1 direct edits (spec §5's governing principle: reversible is not the same as invisible, so a tier-1 save must show WHAT was saved, not just that something was, and stay undoable as long as the row does — not a ten-second toast).
//
// 🔴 REBUILT ON THE ADOPTED MARKUP, AND THE OLD ONE HAD NO RULES AT ALL. `.tray-item` and `.dismiss` were portal-authored names that adopting app.css deleted, so a floating panel rendered as a bare stack of text over the page. ⚠️ The orphan gate did not report them for a while either: one line in tokens.css NAMES `.tray-item button` inside a comment about a form reset, and the scan was counting comments as definitions.
//
// ⚠️ ONE VERB PER ROW, THE OTHER IN THE FOOTER. The adopted tray has no per-row dismiss and that is the right shape rather than a missing feature: Undo is per row because one mistake in a five-edit run should not cost the other four, and dismissing is all-or-nothing because it changes nothing — it only stops the tray reminding you.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';

export function Tray({ notices, onUndo, onDismiss }) {
    if (!notices || notices.length === 0) return null;
    return html`
        <div class="tray" role="status" aria-label="Recently saved">
            <div class="tray-h">
                <span class="t">Saved</span>
                <span class="n">${notices.length} ${notices.length === 1 ? 'change' : 'changes'}</span>
            </div>
            <div class="rounds">
                ${notices.map((n) => html`
                    <div class="round" key=${n.changeId}>
                        <span class="tier">T1</span>
                        <b>${n.summary}</b>
                        <button class="round-u" onClick=${() => onUndo(n.changeId)}
                                aria-label=${`Undo ${n.summary}`}>Undo</button>
                    </div>`)}
            </div>
            <div class="tray-f">
                <button class="btn no" onClick=${() => notices.forEach((n) => onDismiss(n.changeId))}>Dismiss all</button>
            </div>
        </div>
    `;
}
