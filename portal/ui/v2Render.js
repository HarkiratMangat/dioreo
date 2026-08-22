// portal/ui/v2Render.js — ESM. Renders the raw Components V2 JSON buildLoadoutCard() returns.
// Scoped to exactly the 5 component types that function emits — NOT a general Components V2
// interpreter (see docs/superpowers/specs/2026-08-21-portal-compose-ui-design.md §2). Buttons
// render disabled: this is a picture of what Discord will show, not a live Discord message.
//
// parseV2Markdown comes from v2Render.logic.js, loaded as a classic <script> (not imported) —
// see track.js's header comment for why every .logic.js sibling in this directory is loaded that
// way rather than ESM-imported: package.json declares no "type", so this file's CJS
// `module.exports` guard produces no ES module export the browser could import.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';

function renderTextDisplay(component, key) {
    return html`<div class="v2-text" key=${key}>
        ${parseV2Markdown(component.content).map((line, i) => {
            if (line.type === 'h1') return html`<h1 key=${i}>${line.text}</h1>`;
            if (line.type === 'h3') return html`<h3 key=${i}>${line.text}</h3>`;
            if (line.type === 'small') return html`<p class="v2-small" key=${i}>${line.text}</p>`;
            if (line.type === 'blockquote') return html`<blockquote key=${i}>${line.text}</blockquote>`;
            return html`<p key=${i}>${line.text}</p>`;
        })}
    </div>`;
}

function renderComponent(component, key) {
    if (component.type === 10) return renderTextDisplay(component, key);
    if (component.type === 14) return html`<hr class="v2-sep" key=${key} />`;
    if (component.type === 12) {
        const url = component.items?.[0]?.media?.url;
        return url ? html`<img class="v2-media" src=${url} key=${key} /> ` : null;
    }
    if (component.type === 1) {
        return html`<div class="v2-row" key=${key}>
            ${(component.components || []).map((b, i) => html`<button disabled key=${i}>${b.label}</button>`)}
        </div>`;
    }
    return null;
}

export function renderV2(components) {
    const container = (components || []).find((c) => c.type === 17);
    if (!container) return html`<p class="v2-empty">No preview available.</p>`;
    return html`
        <div class="v2-card" style=${`--v2-accent:#${(container.accent_color ?? 0).toString(16).padStart(6, '0')}`}>
            ${container.components.map((c, i) => renderComponent(c, i))}
        </div>
    `;
}
