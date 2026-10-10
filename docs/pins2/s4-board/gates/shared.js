// Board 3 — the shared elements. These are not one realm's problem: a button, an icon button, a radius, a label, a pill
// and the small text under everything. Each stage shows the real controls, in the places your pins pointed at.
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';
import { Icon, Fold } from '../ui/icons.js';
import { fetchJson } from '../ui/httpClient.js';
import { useOverlay } from '../ui/overlay.js';
import { MastheadNew } from '../ui/shell.js';
import { ExportStrip } from '../ui/exportPanel.js';
import { RackNote, VIEWS, VIEW_ORDER } from '../ui/armory.js';
import { NowShowing } from '../ui/broadcast.js';
import { useB3, isoLocal } from '../b3/state.js';
import { segOpts } from './picks.js';
import { ManifestStage } from './armory.js';
import { Seg, Stage, PanelHead, useData, inMode, weaponsWith } from './lib.js';

const armory = () => fetchJson('/api/armory');
const broadcast = () => fetchJson('/api/broadcast');
const ab = [['now', 'Portal today'], ['a', 'A'], ['b', 'B']];

function Spec({ label, children, wide = false }) {
    return html`
        <div class=${'g-spec' + (wide ? ' wide' : '')}>
            <span class="g-spec-l">${label}</span>
            <div class="g-spec-b">${children}</div>
        </div>`;
}

// ── E1 · buttons.
function E1() {
    const overlay = useOverlay();
    return html`
        <${Stage} pad=${true}>
            ${overlay.render()}
            <${Spec} label="Masthead · create">
                <div class="masthead g-mh"><${MastheadNew} label="New build" hint="n" tip="New MP build" onClick=${() => overlay.say('Board only.')} /></div>
            <//>
            <${Spec} label="Manifest · create">
                <button type="button" class="pill lead madd" onClick=${() => overlay.say('Board only.')}><${Icon} name="plus" />Add build</button>
            <//>
            <${Spec} label="Fold, in the manifest and on the Tier board">
                <button type="button" class="wg-fold"><${Fold} open=${true} />Collapse all</button>
                <button type="button" class="wg-fold"><${Fold} open=${false} />Expand all</button>
            <//>
            <${Spec} label="Drawer footer" wide=${true}>
                <footer class="dw-f g-dwf">
                    <span class="why">Still needs a weapon</span>
                    <button type="button" class="btn no">Cancel</button>
                    <button type="button" class="btn">Stage and add another</button>
                    <button type="button" class="btn go">Stage this MP build</button>
                </footer>
            <//>
            <${Spec} label="Danger">
                <button type="button" class="btn dang">Stage deletion</button>
                <button type="button" class="b3-btn2 dang"><${Icon} name="trash-2" />Stage deletion</button>
            <//>
        <//>`;
}

// ── E2 · icon buttons: the row actions, the fold button, the code field, and Broadcast's card actions.
function E2({ session }) {
    const data = useData(armory);
    const bc = useData(broadcast);
    const overlay = useOverlay();
    const names = data ? weaponsWith(data.builds, (b) => b.shareCode, 1) : null;
    return html`
        <${Stage} scroll=${true}>
            ${overlay.render()}
            ${data ? html`<${ManifestStage} session=${session} weapons=${names} showAtt=${false} drawers=${false} />` : html`<p class="g-wait">Loading…</p>`}
            ${bc ? html`
                <section class="panel g-e2card">
                    <${NowShowing} live=${(bc.live || []).slice(0, 1)} cap=${bc.maxPerMessage || 10}
                                   onEdit=${() => overlay.say('Board only.')} onEditDates=${() => overlay.say('Board only.')}
                                   onRemove=${() => overlay.say('Board only.')} b3=${null} />
                </section>` : null}
        <//>`;
}

// ── E3 · radius, on a panel, a card, a field and a chip at once.
function E3({ session }) {
    const data = useData(armory);
    const bc = useData(broadcast);
    const overlay = useOverlay();
    const names = data ? weaponsWith(data.builds, (b) => b.shareCode, 1) : null;
    return html`
        <${Stage} scroll=${true}>
            ${overlay.render()}
            ${data ? html`<${ManifestStage} session=${session} weapons=${names} drawers=${false} />` : html`<p class="g-wait">Loading…</p>`}
            ${bc ? html`
                <section class="panel g-e2card">
                    <${NowShowing} live=${(bc.live || []).slice(0, 1)} cap=${bc.maxPerMessage || 10}
                                   onEdit=${() => {}} onEditDates=${() => {}} onRemove=${() => {}} b3=${null} />
                </section>` : null}
        <//>`;
}

// ── E4 · the type roles: panel eyebrow, filter-group label, column head, sub-section head.
function E4({ session }) {
    const data = useData(armory);
    const names = data ? weaponsWith(data.builds, () => true, 1) : null;
    return html`
        <${Stage} scroll=${true}>
            <section class="panel g-e4panel">
                <${PanelHead} realm="Broadcast" views=${['Delivery queue', 'Airtime']} value="Delivery queue" onSet=${() => {}}
                              meta=${html`<span class="g-status"><b>1</b> of 10 slots used</span>`} />
                <div class="g-e4subs">
                    <div class="bqhead">Delivery order</div>
                    <h5 class="g-h5">Changes ahead</h5>
                </div>
            </section>
            ${data ? html`<${ManifestStage} session=${session} weapons=${names} collapsedAll=${true} drawers=${false} />` : null}
        <//>`;
}

// ── E5 · pills, on the card that carries them.
function E5() {
    const bc = useData(broadcast);
    return html`
        <${Stage} scroll=${true}>
            ${bc ? html`
                <section class="panel g-e2card">
                    <${NowShowing} live=${(bc.live || []).slice(0, 1)} cap=${bc.maxPerMessage || 10}
                                   onEdit=${() => {}} onEditDates=${() => {}} onRemove=${() => {}} b3=${null} />
                </section>` : html`<p class="g-wait">Loading…</p>`}
        <//>`;
}

// ── E6 · small text. The words are Session 4's; this is the container they sit in.
function E6() {
    const data = useData(armory);
    const bc = useData(broadcast);
    if (!data) return html`<p class="g-wait">Loading…</p>`;
    const mp = inMode(data.builds);
    const today = isoLocal();
    const scopes = ['MP', 'DMZ'].map((m) => ({
        id: `armory.${m}`, label: `${m} builds`, unit: 'builds', count: data.builds.filter((b) => b.mode === m).length,
        url: `/api/armory/export?scope=mode&mode=${m}`, filename: `dioreo-${m.toLowerCase()}-${today}.txt`, note: 'Paste format.',
    }));
    return html`
        <${Stage} pad=${true}>
            <${Spec} label="A view’s count (“Tier board 5/8”)" wide=${true}>
                <${PanelHead} realm="Armory" views=${VIEW_ORDER} value=${VIEWS.rack} onSet=${() => {}}
                              counts=${{ [VIEWS.rack]: `${mp.filter((b) => b.categoryRank).length}/${mp.length}`, [VIEWS.coverage]: 5 }} />
            <//>
            <${Spec} label="The Tier board’s line" wide=${true}>
                <div class="racktools g-rack"><${RackNote} builds=${mp} /></div>
            <//>
            <${Spec} label="The export line (“133 builds · 4 formats”)" wide=${true}>
                <div class="masthead g-mh"><${ExportStrip} label="Armory" scopes=${scopes} overlay=${null} open=${false} onToggle=${() => {}} /></div>
            <//>
            <${Spec} label="The slot readout">
                <span class="g-status"><span class="cmeter"><i style="width:20%"></i></span><b>1</b> of 10 slots used</span>
            <//>
            <${Spec} label="The character count, on the card" wide=${true}>
                ${bc ? html`<div class="g-e6card"><${NowShowing} live=${(bc.live || []).slice(0, 1)} cap=${10}
                    onEdit=${() => {}} onEditDates=${() => {}} onRemove=${() => {}} b3=${null} /></div>` : null}
            <//>
            <${Spec} label="History’s panel sentence" wide=${true}>
                <div class="ph g-hiph"><span class="t">One history, both front doors</span>
                    <span class="rt">Alerts, changes and boots are all events — filtering one stream beats switching between four lists.</span></div>
            <//>
        <//>`;
}

// One stage for the whole shared vocabulary: the buttons, a real manifest row, a real card, the labels and the small text.
function SharedStage({ session }) {
    const data = useData(armory);
    const bc = useData(broadcast);
    const overlay = useOverlay();
    const names = data ? weaponsWith(data.builds, (b) => b.shareCode, 1) : null;
    const mp = data ? inMode(data.builds) : [];
    const today = isoLocal();
    const scopes = data ? ['MP', 'DMZ'].map((m) => ({ id: `armory.${m}`, label: `${m} builds`, unit: 'builds',
        count: data.builds.filter((b) => b.mode === m).length, url: `/api/armory/export?scope=mode&mode=${m}`,
        filename: `dioreo-${m.toLowerCase()}-${today}.txt`, note: 'Paste format.' })) : [];
    return html`
        <${Stage} pad=${true}>
            ${overlay.render()}
            <${Spec} label="Buttons — create, go, ghost, danger" wide=${true}>
                <div class="g-spec-row">
                    <div class="masthead g-mh"><${MastheadNew} label="New build" hint="n" tip="New MP build" onClick=${() => overlay.say('Board only.')} /></div>
                    <button type="button" class="pill lead madd"><${Icon} name="plus" />Add build</button>
                    <button type="button" class="wg-fold"><${Fold} open=${true} />Collapse all</button>
                    <button type="button" class="btn dang">Stage deletion</button>
                </div>
                <footer class="dw-f g-dwf"><span class="why">Still needs a weapon</span>
                    <button type="button" class="btn no">Cancel</button>
                    <button type="button" class="btn">Stage and add another</button>
                    <button type="button" class="btn go">Stage this MP build</button></footer>
            <//>
            <${Spec} label="Icon buttons and radius, on a real row" wide=${true}>
                ${data ? html`<${ManifestStage} session=${session} weapons=${names} showAtt=${false} drawers=${false} />` : html`<p class="g-wait">Loading…</p>`}
            <//>
            <${Spec} label="Pills and the card they sit on" wide=${true}>
                ${bc ? html`<section class="panel g-e2card"><${NowShowing} live=${(bc.live || []).slice(0, 1)} cap=${bc.maxPerMessage || 10}
                    onEdit=${() => {}} onEditDates=${() => {}} onRemove=${() => {}} b3=${null} /></section>` : null}
            <//>
            <${Spec} label="Labels and headings" wide=${true}>
                <section class="panel g-e4panel">
                    <${PanelHead} realm="Broadcast" views=${['Delivery queue', 'Airtime']} value="Delivery queue" onSet=${() => {}}
                                  meta=${html`<span class="g-status"><b>1</b> of 10 slots used</span>`} />
                    <div class="g-e4subs"><div class="bqhead">Delivery order</div><h5 class="g-h5">Changes ahead</h5></div>
                </section>
            <//>
            <${Spec} label="Small text — the container, not the words" wide=${true}>
                <div class="g-spec-row">
                    ${data ? html`<${PanelHead} realm="Armory" views=${VIEW_ORDER} value=${VIEWS.rack} onSet=${() => {}}
                        counts=${{ [VIEWS.rack]: `${mp.filter((b) => b.categoryRank).length}/${mp.length}`, [VIEWS.coverage]: 5 }} />` : null}
                </div>
                ${data ? html`<div class="racktools g-rack"><${RackNote} builds=${mp} /></div>` : null}
                <div class="g-spec-row">
                    <div class="masthead g-mh"><${ExportStrip} label="Armory" scopes=${scopes} overlay=${null} open=${false} onToggle=${() => {}} /></div>
                    <span class="g-status"><span class="cmeter"><i style="width:20%"></i></span><b>1</b> of 10 slots used</span>
                </div>
                <div class="ph g-hiph"><span class="t">One history, both front doors</span>
                    <span class="rt">Alerts, changes and boots are all events — filtering one stream beats switching between four lists.</span></div>
            <//>
        <//>`;
}

export const SHARED_SECTIONS = [
    { id: 'shared', gid: 'E', realm: 'armory', title: 'The shared vocabulary',
      sub: 'The pieces that belong to no single surface, on one stage: a button, an icon button, a radius, a label, a pill and the small text under everything.',
      pins: [1, 4, 10, 11, 12, 14, 21, 27, 28, 29, 31, 34, 35, 38, 40, 41, 42, 43, 47, 52], Body: SharedStage,
      controls: [
          ['Buttons', () => html`<${Seg} k="e1" options=${ab} label="Buttons" />`],
          ['Icon buttons', () => html`<${Seg} k="e2" options=${ab} label="Icon buttons" />`],
          ['Reveal', () => html`<${Seg} k="e2spd" options=${segOpts('e2spd')} label="Reveal" />`],
          ['Radius', () => html`<${Seg} k="e3" options=${ab} label="Radius" />`],
          ['Labels', () => html`<${Seg} k="e4" options=${ab} label="Labels" />`],
          ['Pills', () => html`<${Seg} k="e5" options=${ab} label="Pills" />`],
          ['Small text', () => html`<${Seg} k="e6" options=${ab} label="Small text" />`],
      ],
      notes: [
          html`<b>Buttons</b> — New build takes the Review accent, the Manifest’s Add build is the same button smaller, and the Tier board’s Expand all is the manifest’s fold control (pins 1, 4, 29).`,
          html`<b>Icon buttons</b> — colour by intent, the box is the button with no square behind it, the fold control widens to its word, and anything that clicks has a pointer (pins 10, 11, 12, 43, 47).`,
          html`<b>The reveal</b> \u2014 the fold control opens to its word on hover and on keyboard focus, travelling the word\u2019s own width
                 rather than a fixed guess; the old one finished in about 25ms of a nominal 180ms, which is why it read as a snap (pin 12).`,
          html`<b>Radius</b> — five steps applied through the tokens so every surface moves together; pills stay round (pin 21).`,
          html`<b>Labels and headings</b> — four jobs, four roles, drawn the same way in every realm; the column head steps up so it stops reading as a hint (pins 14, 35, 41, 42).`,
          html`<b>Pills</b> — the date label and the pills are one family, each carrying the mark for what it counts (pin 38).`,
          html`<b>Small text</b> — a fact gets a container or a rail so a number is never loose prose; a sentence is not a fact and moves behind an info button. The words are Session 4’s (pins 27, 28, 31, 34, 40, 52).`,
      ] },
];
