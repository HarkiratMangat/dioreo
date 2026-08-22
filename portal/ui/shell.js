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
            <a class="door-cta" href="/auth/login">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M20.3 4.4A19.7 19.7 0 0 0 15.4 3l-.3.5a13.6 13.6 0 0 1 4 2 16.4 16.4 0 0 0-14.2 0 13.6 13.6 0 0 1 4.1-2L8.6 3a19.7 19.7 0 0 0-4.9 1.4C1 9 .3 13.5.6 18a19.9 19.9 0 0 0 5.9 3l.8-1.3a13 13 0 0 1-2-1c.2-.1.3-.3.5-.4a14 14 0 0 0 12.4 0l.5.4a13 13 0 0 1-2 1l.8 1.3a19.8 19.8 0 0 0 5.9-3c.4-5.4-1-9.9-3-13.6ZM8.5 15.3c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.9 2-.8 2-1.9 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.9-2 1.8.9 1.8 2-.8 2-1.9 2Z"/></svg>
                Continue with Discord
            </a>
        </div>
    `;
}
