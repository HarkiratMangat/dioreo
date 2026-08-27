// portal/ui/v2Render.js — ESM. Renders the raw Components V2 JSON buildLoadoutCard() returns. Scoped to exactly the 5 component types that function emits — NOT a general Components V2 interpreter (see docs/superpowers/specs/2026-08-21-portal-compose-ui-design.md §2). Buttons render disabled: this is a picture of what Discord will show, not a live Discord message.
//
// parseV2Markdown comes from v2Render.logic.js, loaded as a classic <script> (not imported) — see track.js's header comment for why every .logic.js sibling in this directory is loaded that way rather than ESM-imported: package.json declares no "type", so this file's CJS `module.exports` guard produces no ES module export the browser could import.
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

// 🔴 THE TWO REALMS WHOSE OUTPUT A PLAYER READS VERBATIM COULD NOT SHOW IT. Armory has a real card — /api/armory/preview returns the bot's own Components V2 JSON and `renderV2` draws it — and no such route exists for a draw or an announcement, so Season and Broadcast were the only surfaces editing something a player sees with no picture of what they would see.
//
// ⚠️ IT IS A SHAPED PREVIEW, NOT A CLAIM TO BE THE MESSAGE, and the distinction is why this is a separate component from `renderV2` rather than a fallback inside it. `renderV2` draws what the bot actually built; this draws the fields you are editing in the shape Discord puts them in. Merging them would let a component that is GUESSING inherit the authority of one that is not.
export function DiscordCard({ accent, title, sub, rows = [], badges = [], code }) {
    return html`
        <div class="dcard" style=${accent ? `--c:${accent}` : null}>
            <h6>${title}</h6>
            ${sub ? html`<div class="sub">${sub}</div>` : null}
            ${rows.filter((r) => r && r[1]).map((r) => html`
                <div class="row" key=${r[0]}><b>${r[0]}</b><span>${r[1]}</span></div>`)}
            ${badges.length ? html`
                <div class="badges">${badges.map((b) => html`<span key=${b}>${b}</span>`)}</div>` : null}
            ${code ? html`<div class="dcode">${code}</div>` : null}
        </div>`;
}
