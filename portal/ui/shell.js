// portal/ui/shell.js — ESM. The chrome every realm renders inside: top bar, nav rail, masthead, view switcher, and the Manifest slot.
//
// 🔴 THE MANIFEST LAYER NEVER SWITCHES (spec §8.1/§8.2) — only `view` (the top half) does. This is enforced structurally here, not just by convention: Shell always renders `manifestSlot` in the SAME place regardless of `view`, and the tab switcher below only ever changes `view`.
//
// 🔴 THE NAV IS A RAIL, NOT A BAR, and that is a correction rather than a preference. `01-season-spine.html` is the FULL-STYLE mockup — one page, designed completely — and its chrome is a 76px left icon rail plus a thin top bar carrying only the wordmark, a breadcrumb and identity. Mockups 02–06 are COMPILED-STYLE sheets: several pages stacked into one file for review, wrapped in a document-navigation bar. The horizontal five-realm bar that shipped here is almost exactly 06's *document* nav — review scaffolding built as product. Measured before removing it: 863px of content in a 359px viewport. See the redesign spec §0.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';

// Five PLACES TO WORK. Review is deliberately not among them — see Rail below.
const REALMS = ['season', 'armory', 'broadcast', 'access', 'analytics'];

// One 24×24 stroke glyph per realm. Inline rather than an icon font or sprite sheet: six paths is less bytes than either, and the portal serves no external assets (the door is the only page a stranger reaches and it must request nothing). `stroke: currentColor` in shell.css means the active/hover colour transition covers the icon for free.
const REALM_ICON = {
    season: 'M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z',
    armory: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 2v4M12 18v4M2 12h4M18 12h4M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
    broadcast: 'M4 10v4a1 1 0 0 0 1 1h3l5 4V5L8 9H5a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11',
    access: 'M15 7a4 4 0 1 1-3.9 5H8v2H6v2H3v-3l8.1-8.1A4 4 0 0 1 15 7zM16 10.5h.01',
    analytics: 'M3 17l4-6 4 3 4-7 3 4M3 21h18',
    // The approved design's own glyph for Review — lines shortening to a check. Kept verbatim rather than re-drawn, so the rail reads the same here as in the mockup it came from.
    review: 'M4 6h16M4 12h10M4 18h7M15 17l2.5 2.5L22 15',
};

function RealmIcon({ realm }) {
    return html`<svg viewBox="0 0 24 24" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round"><path d=${REALM_ICON[realm] || REALM_ICON.season} /></svg>`;
}

// `badges` is realm -> count of the signed-in admin's own staged changesets. Absent rather than zero when there is nothing staged — a permanent "0" is noise.
//
// 🔴 REVIEW SITS BELOW A RULE, NOT AS A SIXTH REALM, and that is the approved design's own decision rather than a layout preference: five realms are PLACES TO WORK, Review is the WAY OUT. The rule says that without a label nobody would read at 9px. It first shipped reachable only through the tray — which requires staged work to exist — so the commit screen was unreachable from a page with nothing staged, which is exactly when you want to check that nothing is staged.
//
// 🔴 AND THE STAGED COUNT BELONGS HERE, not on Season. It is a property of the CHANGESET, so an Armory edit putting a badge on Season is the surface disagreeing with its own data. The rail's realm entries. `--c` per realm is the adopted design's own mechanism — the accent is a property of the realm, applied as a custom property rather than a class, so hover/active/current states all read from one value.
export function Rail({ realm, realms, badges = {} }) {
    const visible = realms || REALMS;
    const places = visible.filter((r) => r !== 'review');
    const canReview = !realms || visible.includes('review');
    const staged = Object.values(badges).reduce((n, v) => n + (Number(v) || 0), 0);
    return html`
        <nav class="rail" aria-label="Realms">
            ${places.map((r) => html`
                <a class="realm" href=${'#/' + r} style=${`--c:var(--r-${r})`}
                   aria-current=${r === realm ? 'page' : null}>
                    <${RealmIcon} realm=${r} />${r}
                </a>`)}
            ${canReview ? html`
                <!-- 🔴 BELOW A RULE, NOT A SIXTH REALM. Five realms are places to work; Review is the
                     way out, and the rule says so without a label nobody would read at 9px. The
                     staged count is a property of the CHANGESET, so it belongs here rather than on
                     whichever realm happened to stage the work. -->
                <span class="rail-rule" aria-hidden="true"></span>
                <a class=${'realm out' + (staged ? ' has' : '')} href="#/review" style="--c:var(--r-review)"
                   aria-current=${realm === 'review' ? 'page' : null}>
                    <${RealmIcon} realm="review" />Review
                    ${staged ? html`<span class="cnt" aria-label=${`${staged} staged`}>${staged}</span>` : null}
                </a>` : null}
        </nav>
    `;
}

// The masthead every realm shares: an identity block and a stat cluster. `lead` marks the one stat that is the page's headline; `--c` tints it with whatever that number is about.
//
// Deliberately NO "ANSWERS: …" tag and no explanatory paragraph — those appear only in the compiled review sheets and are reviewer annotation, not product copy (Harkirat, 2026-08-23 14:47 EDT).
export function Masthead({ title, sub, stats = [], actions = null, eyebrow = null }) {
    return html`
        <div class="masthead">
            <div class="mh-id">
                ${eyebrow}
                <h1>${title}</h1>
                ${sub ? html`<span class="job">${sub}</span>` : null}
                ${actions}
            </div>
            ${stats.length ? html`
                <div class="mh-stats">
                    ${stats.map((s) => html`
                        <span class=${'stat' + (s.tone ? ' ' + s.tone : '') + (s.lead ? ' lead' : '')}
                              style=${s.accent ? `--c:${s.accent}` : null}>
                            <span class="v">${s.value}</span> <span class="k">${s.label}</span>
                        </span>`)}
                </div>` : null}
        </div>
    `;
}

// The header bar. The command bar is THE bar rather than a launcher for one: it used to be a 44px ⌘K chip in a header with ~700px of unused space, which is a keyboard shortcut wearing a button's clothes — it advertised a feature instead of being one.
//
// ⚠️ The commit chip is ABSENT at zero rather than reading "0 staged". A chip that is always there is a permanent third copy of the tray and the rail badge; one that appears only when there is something to act on is the same fact at the moment it becomes actionable.
function Header({ realm, view, session, staged, onCommand }) {
    const id = session ? String(session.discordId) : '';
    return html`
        <header id="hdr">
            <button class="mk" title="Home" onClick=${() => { location.hash = '#/season'; }}><span class="glyph"></span>DIOREO<b>/</b>PORTAL</button>
            <span class="crumb">${realm}${view ? html` <b>›</b> ${view}` : null}</span>
            <span class="sp"></span>
            <div class="cmdbar">
                <span class="cb-mag" aria-hidden="true"></span>
                <input class="cb-in" autocomplete="off" spellcheck="false"
                       placeholder="Search, or run a command" aria-label="Search, or run a command"
                       onInput=${onCommand} />
                <kbd>⌘K</kbd>
            </div>
            <span class="sp"></span>
            ${staged ? html`
                <a class="hdr-commit" href="#/review"><b>${staged}</b><span>staged · review</span></a>` : null}
            ${session ? html`
                <span class="who">
                    <span class="av" aria-hidden="true"></span>
                    <span class="id" title=${id}>${id}</span>
                    ${session.isOwner ? html`<span class="role">owner</span>` : null}
                </span>` : null}
        </header>
    `;
}

export function Shell({ realm, session, view, viewOptions, onSetView, viewSlot, manifestSlot, traySlot, masthead, badges = {}, tools = null, panelTitle }) {
    const staged = Object.values(badges).reduce((n, v) => n + (Number(v) || 0), 0);
    return html`
        <div class="app">
            <${Header} realm=${realm} view=${view} session=${session} staged=${staged} />
            <${Rail} realm=${realm} realms=${session?.visibleRealms} badges=${badges} />
            <main>
                ${masthead || null}
                <div id="view-layer">
                ${viewOptions ? html`
                    <section class="panel" aria-label=${`${realm} view`}>
                        <div class="ph">
                            <span class="t">${panelTitle || realm}</span>
                            <div class="seg" role="tablist" aria-label="View">
                                ${viewOptions.map((v) => html`
                                    <button role="tab" aria-pressed=${v === view} onClick=${() => onSetView(v)}>${v}</button>`)}
                            </div>
                            ${tools}
                        </div>
                        ${viewSlot}
                    </section>`
                : viewSlot}
                </div>
                <div id="manifest-layer">${manifestSlot}</div>
            </main>
            ${traySlot || null}
        </div>
    `;
}

// Every realm's initial-load error state renders through this one component instead of duplicating the same inline <p> (simplify Simplification #6).
export function NoAccess() {
    return html`<p class="empty" style="padding:24px">You do not have access to this realm.</p>`;
}

export function Door({ forbidden }) {
    // Three door states read identically (spec §10) — a stranger, a never-granted account and a revoked admin all see this exact page. `forbidden` changes nothing visible on purpose.
    //
    // The two disclosure blocks are from 05-door-broadcast-ops.html and they are the page's actual content, not decoration: this is the only page a stranger can reach, so what it says about the OAuth request has to be literally what the request asks for (spec §10 — `identify` and nothing else). If the scope list here ever stops matching portal/auth.js's, this page is lying to a stranger, which is the one thing it exists not to do.
    return html`
        <div class="door">
            <h1>DIOREO<b>/</b>PORTAL</h1>
            <p class="tag">bot management</p>
            <a class="door-cta" href="/auth/login">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M20.3 4.4A19.7 19.7 0 0 0 15.4 3l-.3.5a13.6 13.6 0 0 1 4 2 16.4 16.4 0 0 0-14.2 0 13.6 13.6 0 0 1 4.1-2L8.6 3a19.7 19.7 0 0 0-4.9 1.4C1 9 .3 13.5.6 18a19.9 19.9 0 0 0 5.9 3l.8-1.3a13 13 0 0 1-2-1c.2-.1.3-.3.5-.4a14 14 0 0 0 12.4 0l.5.4a13 13 0 0 1-2 1l.8 1.3a19.8 19.8 0 0 0 5.9-3c.4-5.4-1-9.9-3-13.6ZM8.5 15.3c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.9.9 1.9 2-.8 2-1.9 2Zm7 0c-1 0-1.8-.9-1.8-2s.8-2 1.9-2 1.8.9 1.8 2-.8 2-1.9 2Z"/></svg>
                Continue with Discord
            </a>
            <div class="facts">
                <h2>What this asks Discord for</h2>
                <ul>
                    <li><span class="y">✓</span> your user ID and username — that is the whole request</li>
                    <li><span class="n">×</span> no email, no servers, no messages, no friends</li>
                    <li><span class="n">×</span> nothing is posted or changed on your account</li>
                </ul>
            </div>
            <div class="facts">
                <h2>What gets stored</h2>
                <ul><li>One signed cookie, 12 hours. No Discord token is kept after sign-in.</li></ul>
            </div>
        </div>
    `;
}
