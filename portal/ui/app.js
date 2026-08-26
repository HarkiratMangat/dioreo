// portal/ui/app.js — ESM, imports Preact + htm. The browser's actual entry point.
//
// No bundler (spec decision 6): this file and its siblings are served verbatim from portal/public/ui/ and loaded via a native <script type="module"> tag. Pure logic each component needs lives in a sibling .logic.js file (CommonJS, importable from Node's test scripts too) — see portal/ui/*.logic.js and the plan's R10 finding for why the split exists.
import { h, render } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { Door } from './shell.js';
import { fetchJson } from './httpClient.js';
import { Skeleton, Failure, NetBanner } from './async.js';

/* global failureOf, asyncDefaults */
import { SeasonRealm } from './season.js';
import { ArmoryRealm } from './armory.js';
import { BroadcastRealm } from './broadcast.js';
import { AccessRealm } from './access.js';
import { AnalyticsRealm } from './analytics.js';
import { ReviewRealm } from './review.js';
import { HomeRealm } from './home.js';

// Door/Forbidden used to be re-declared here as local copies of shell.js's own exports — a review pass caught the duplication; both states now go through the ONE Door component (spec §10: a stranger, a never-granted account, and a revoked admin must all read identically).
const REALM_COMPONENTS = {
    season: SeasonRealm, armory: ArmoryRealm, broadcast: BroadcastRealm,
    access: AccessRealm, analytics: AnalyticsRealm, review: ReviewRealm, home: HomeRealm,
};

function currentRealm() {
    const hash = (location.hash || '#/home').replace(/^#\//, '');
    return REALM_COMPONENTS[hash] ? hash : 'home';
}

// 🔴 THE BOOT ITSELF HAD NO STATES, AND IT IS THE ONE REQUEST EVERY OTHER ONE WAITS BEHIND. This awaited /auth/csrf and rendered NOTHING until it answered — an entirely blank page, indistinguishable from a broken build, for as long as the round trip took. Worse on failure: with fetchJson throwing, the rejection was unhandled and the page stayed blank forever; now that it resolves, an unguarded fall-through would render a realm with `session` set to a failure object, so every csrfToken in the app would be undefined and every write would be rejected — a portal that looks completely normal and cannot save anything.
//
// The boot has no realm and no session, so it cannot use RealmShell. It gets the same states in the plainest possible frame.
//
// ⚠️ NO `.app` WRAPPER. The first version had one, and .app is a GRID whose columns are sized for the header and the rail — neither of which exists yet at boot — so the whole boot state rendered as a 30-pixel sliver in the top-left corner. Correct markup, invisible result, and nothing errored: exactly the class of defect that only opening the page can catch.
function bootFrame(inner, slow) {
    return html`
        <main class=${slow ? 'is-slow' : ''} data-slow="Still waiting on the server…" style="padding:22px">
            ${inner}
        </main>`;
}

async function main() {
    const root = document.getElementById('app');
    // Painted BEFORE the await, not after it. A skeleton that renders once the answer is already in hand is decoration.
    const booting = html`<section class="panel"><${Skeleton} rows=${4} lines=${[26, 40, 14]} label="Signing in" /></section>`;
    render(bootFrame(booting, false), root);
    // The boot gets the SLOW state too, and it is the request that most needs it: everything else in the portal is waiting behind this one, so a reader staring at a skeleton here has no other part of the page to look at for a clue.
    const slowTimer = setTimeout(() => render(bootFrame(booting, true), root), asyncDefaults().slowAfterMs);

    const state = await fetchJson('/auth/csrf');
    clearTimeout(slowTimer);
    if (state.signedOut) return render(html`<${Door} />`, root);
    if (state.forbidden) return render(html`<${Door} forbidden=${true} />`, root);

    const failure = failureOf(state);
    if (failure) {
        return render(bootFrame(html`
            <${NetBanner} error=${failure} onAction=${() => location.reload()} />
            <section class="panel">
                <${Failure} error=${failure} onAction=${() => location.reload()} action="Reload" />
            </section>`, false), root);
    }

    const RealmComponent = REALM_COMPONENTS[currentRealm()];
    render(html`<${RealmComponent} session=${state} />`, root);
    window.addEventListener('hashchange', () => {
        const Next = REALM_COMPONENTS[currentRealm()];
        render(html`<${Next} session=${state} />`, root);
    });
}

main();
