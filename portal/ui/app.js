// portal/ui/app.js — ESM, imports Preact + htm. The browser's actual entry point.
//
// No bundler (spec decision 6): this file and its siblings are served verbatim from portal/public/ui/ and loaded via a native <script type="module"> tag. Pure logic each component needs lives in a sibling .logic.js file (CommonJS, importable from Node's test scripts too) — see portal/ui/*.logic.js and the plan's R10 finding for why the split exists.
import { h, render } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { Door } from './shell.js';
import { fetchJson } from './httpClient.js';
import { SeasonRealm } from './season.js';
import { ArmoryRealm } from './armory.js';
import { BroadcastRealm } from './broadcast.js';
import { AccessRealm } from './access.js';
import { AnalyticsRealm } from './analytics.js';
import { ReviewRealm } from './review.js';

// Door/Forbidden used to be re-declared here as local copies of shell.js's own exports — a review pass caught the duplication; both states now go through the ONE Door component (spec §10: a stranger, a never-granted account, and a revoked admin must all read identically).
const REALM_COMPONENTS = {
    season: SeasonRealm, armory: ArmoryRealm, broadcast: BroadcastRealm,
    access: AccessRealm, analytics: AnalyticsRealm, review: ReviewRealm,
};

function currentRealm() {
    const hash = (location.hash || '#/season').replace(/^#\//, '');
    return REALM_COMPONENTS[hash] ? hash : 'season';
}

async function main() {
    const root = document.getElementById('app');
    const state = await fetchJson('/auth/csrf');
    if (state.signedOut) return render(html`<${Door} />`, root);
    if (state.forbidden) return render(html`<${Door} forbidden=${true} />`, root);
    const RealmComponent = REALM_COMPONENTS[currentRealm()];
    render(html`<${RealmComponent} session=${state} />`, root);
    window.addEventListener('hashchange', () => {
        const Next = REALM_COMPONENTS[currentRealm()];
        render(html`<${Next} session=${state} />`, root);
    });
}

main();
