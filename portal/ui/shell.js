// portal/ui/shell.js — ESM. The rail (five realms) + view-layer switcher + Manifest slot.
//
// 🔴 THE MANIFEST LAYER NEVER SWITCHES (spec §8.1/§8.2) — only `view` (the top half) does. This is enforced structurally here, not just by convention: Shell always renders `manifestSlot` in the SAME place regardless of `view`, and the tab switcher below only ever changes `view`.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';

const REALMS = ['season', 'armory', 'broadcast', 'access', 'analytics'];

export function Shell({ realm, session, view, viewOptions, onSetView, viewSlot, manifestSlot, traySlot }) {
    return html`
        <div class="top">
            <span class="mk">DIOREO<b>/</b>PORTAL</span>
            <nav class="rail">
                ${(session?.visibleRealms || REALMS).map(r => html`<a href=${'#/' + r} class=${r === realm ? 'active' : ''}>${r}</a>`)}
            </nav>
            ${viewOptions ? html`
                <div class="tabs" role="tablist">
                    ${viewOptions.map(v => html`
                        <button class="tab" aria-selected=${v === view} onClick=${() => onSetView(v)}>${v}</button>
                    `)}
                </div>
            ` : null}
            <span class="r">${session ? session.discordId + (session.isOwner ? ' (owner)' : '') : ''}</span>
        </div>
        <main>
            ${viewSlot}
            ${manifestSlot}
        </main>
        ${traySlot || null}
    `;
}

// Every realm's initial-load error state renders through this one component instead of duplicating the same inline <p> (simplify Simplification #6).
export function NoAccess() {
    return html`<p style="padding:24px">You do not have access to this realm.</p>`;
}

export function Door({ forbidden }) {
    // Three door states read identically (spec §10) — a stranger, a never-granted account and a revoked admin all see this exact page. `forbidden` changes nothing visible on purpose.
    return html`
        <div class="door">
            <h1>Dioreo Admin Portal</h1>
            <p>Sign in with Discord to continue.</p>
            <a class="accent-fill" href="/auth/login">Sign in with Discord</a>
        </div>
    `;
}
