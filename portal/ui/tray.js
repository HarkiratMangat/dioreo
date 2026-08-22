// portal/ui/tray.js — ESM. The inline "saved · undo" tray for tier-1 direct edits (spec §5's governing principle: reversible is not the same as invisible, so a tier-1 save must show WHAT was saved, not just that something was, and stay undoable as long as the row does — not a ten-second toast).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';

export function Tray({ notices, onUndo, onDismiss }) {
    if (!notices || notices.length === 0) return null;
    return html`
        <div class="tray">
            ${notices.map(n => html`
                <div class="tray-item" key=${n.changeId}>
                    <span>Saved: <b>${n.summary}</b></span>
                    <button onClick=${() => onUndo(n.changeId)}>Undo</button>
                    <button class="dismiss" onClick=${() => onDismiss(n.changeId)}>&times;</button>
                </div>
            `)}
        </div>
    `;
}
