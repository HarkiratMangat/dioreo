// portal/ui/app.js — ESM, imports Preact + htm. The browser's actual entry point.
//
// No bundler (spec decision 6): this file and its siblings are served verbatim from portal/public/ui/ and loaded via a native <script type="module"> tag. Pure logic each component needs lives in a sibling .logic.js file (CommonJS, importable from Node's test scripts too) — see portal/ui/*.logic.js and the plan's R10 finding for why the split exists.
import { h, render } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';

async function fetchJson(path, opts) {
    const res = await fetch(path, { credentials: 'same-origin', ...opts });
    if (res.status === 401) return { signedOut: true };
    if (res.status === 403) return { forbidden: true };
    return res.json();
}

function Door() {
    // Three door states must read identically (spec §10): a stranger, a never-granted account, and a revoked admin all see this same page. Nothing here confirms an allowlist exists.
    return html`
        <div class="door">
            <h1>Dioreo Admin Portal</h1>
            <p>Sign in with Discord to continue.</p>
            <a class="accent-fill" href="/auth/login">Sign in with Discord</a>
        </div>
    `;
}

function Forbidden() {
    // The SAME words as Door, deliberately (spec §10) — a signed-in-but-unauthorized account must not be able to tell it is "closer" to access than a stranger is.
    return html`
        <div class="door">
            <h1>Dioreo Admin Portal</h1>
            <p>Sign in with Discord to continue.</p>
            <a class="accent-fill" href="/auth/login">Sign in with Discord</a>
        </div>
    `;
}

import { SeasonRealm } from './season.js';

const REALM_COMPONENTS = { season: SeasonRealm };

function currentRealm() {
    const hash = (location.hash || '#/season').replace(/^#\//, '');
    return REALM_COMPONENTS[hash] ? hash : 'season';
}

async function main() {
    const root = document.getElementById('app');
    const state = await fetchJson('/auth/csrf');
    if (state.signedOut) return render(html`<${Door} />`, root);
    if (state.forbidden) return render(html`<${Forbidden} />`, root);
    const RealmComponent = REALM_COMPONENTS[currentRealm()];
    render(html`<${RealmComponent} session=${state} />`, root);
    window.addEventListener('hashchange', () => {
        const Next = REALM_COMPONENTS[currentRealm()];
        render(html`<${Next} session=${state} />`, root);
    });
}

main();
