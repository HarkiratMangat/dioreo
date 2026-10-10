// Board 3 — the board itself: the settled log, what is still open, and the gates.
import { render } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Icon, installSprite } from '../ui/icons.js';
import { installTips } from '../ui/tips.js';
import { installFady } from '../b3/fady.js';
import { fetchJson } from '../ui/httpClient.js';
import { Gate } from './lib.js';
import { PickIndex, FORKS } from './picks.js';
import { ARMORY_SECTIONS } from './armory.js';
import { BROADCAST_SECTIONS } from './broadcast.js';
import { HISTORY_SECTIONS } from './history.js';

// The shared vocabulary surface was removed 2026-09-15 22:10 EDT at his call: "your section E is way too narrow scoped.
// The portal has SOOO many more designs and surfaces that you didn't even consider… just use the buttons and stuff that
// the current portal uses, with the caveat of the changes i requested specifically in the pins." So the board shows the
// portal's own elements, the individually pinned changes are applied as fixes, and the element system — what it should
// become, where it applies, what is exempt — is Session 4's whole job rather than six A/B forks here.
const SECTIONS = [...ARMORY_SECTIONS, ...BROADCAST_SECTIONS, ...HISTORY_SECTIONS];
const PARTS = SECTIONS.map((s) => ({ id: s.id, title: s.title }));

// Pins answered by the log rather than by a surface, because there is nothing to draw: a bug to reproduce, and a session.
const IN_LOG = [24, 30, 1, 21, 27, 28, 31, 34, 35, 38, 41, 42, 25];

// Pins whose answer is an EARLIER board, so there is nothing here to decide. They were gates until 2026-09-16 00:39 EDT,
// and Harkirat's objection was exact: "it shows the portal today vs the Board 1 \u00b7 G8 design. Like okay...? What's even the
// point of that? \u2026 That has nothing to do with me and nothing i need to look at or decide." Each is a spec sheet now.
const PORTED = [
    [[2], 'The New Build drawer', 'Board 1 \u00b7 G9', 'handoff-g9-g8.md \u2014 14 element rows, each with its portal counterpart and file:line.'],
    [[48], 'The announcement drawer', 'Board 1 \u00b7 G8', 'handoff-g9-g8.md \u2014 9 element rows, same shape.'],
    [[44, 45, 50], 'The broadcast manifest', 'Board 2 \u00b7 G11', 'port-g4-g3-g11.md \u2014 row, heads, column widths, hover.'],
];

const SETTLED = [
    ['P3', 'Build problems — direction A', 'Your call. The manifest shows two refinements of A; the direction is not reopened.'],
    ['P5', 'Selection bar — A and B are one bar', '“Basically a collapsed / expanded view of the same design.”'],
    ['P5', 'The selection list — BOTH shapes, not one', 'You said “use both”, so it is both: grouped by weapon and one table are both built, and the toggle at the top right of the list switches them. Nothing to pick.'],
    ['P6', 'Repairs — the worklist, inside the Repairs panel', 'Split from the view switch, with the tab carrying the status.'],
    ['P7', 'Command search — as shown', '“Build it properly, and exactly as shown.” No option to pick.'],
    ['P9', 'History — the timeline', '“Timeline is the better direction.”'],
    ['#6', 'Secondaries becomes #3F6E8E', 'In the portal, in the data the chips are drawn from, and in the bot’s own renderer.'],
    ['#24', 'The account-menu tint', 'Not a design question — Session 5 reproduces it on your session before touching it.'],
    ['#25', 'Staging from a sentence', 'Filed as [P3 · L] in the deferred list; the command bar itself is built as drawn.'],
    ['#25', 'Command search', 'Its own session \u2014 “badge cx9” returns what “badge” alone returns, and the ranking needs rebuilding. The design you approved is recorded in `docs/db-deferred-list.md`; this board is where it was drawn.'],
    ['#30', 'Standardization', 'Session 4 — it rewrites the small text, applies these elements across the portal and names the exemptions.'],
    ['#30', 'The toggle family — deferred', 'Session 4 — toggle labels, filter chips, switches and readouts become one set. Five of your threads wait on it (History’s spacing, the View label, the category case, the queue head, the × column); plan §5c.3b has each with its failed closes.'],
    ['#1', 'What colour the create button is', 'Session 4 — pin 4’s shape is applied here; the accent belongs to the vocabulary.'],
    ['#21', 'Rounder corners', 'Session 4 — a radius scale is the element system, not one surface.'],
    ['#27 #28 #31 #34', 'The small text', 'Session 4 — the words and the container they sit in, together.'],
    ['#35 #41 #42', 'Label and heading roles', 'Session 4 — one role per job, across every realm at once.'],
    ['#38', 'Pills and the date label as one family', 'Session 4 — with the rest of the element vocabulary.'],
    ['—', 'The 18 Access pins of 09-11', 'Still open in the sync notes, outside this batch, untouched.'],
];

function Ported() {
    return html`
        <section class="g-settled g-ported">
            <h2>Already drawn \u2014 specified, not decided here</h2>
            <p>An earlier board answered these. Putting the portal beside a design you have already approved asks you nothing,
               so each one is a document for the build session instead of a block on this page.</p>
            <table>
                <tbody>
                    ${PORTED.map(([pins, what, board, doc]) => html`
                        <tr key=${what}><th>${pins.map((p) => `#${p}`).join(' ')}</th><td><b>${what}</b></td>
                            <td>${board}</td><td><code>${doc}</code></td></tr>`)}
                </tbody>
            </table>
        </section>`;
}

function Settled() {
    return html`
        <section class="g-settled">
            <h2>Settled — not reopened here</h2>
            <table>
                <tbody>
                    ${SETTLED.map(([k, what, why]) => html`
                        <tr key=${k + what}><th>${k}</th><td><b>${what}</b></td><td>${why}</td></tr>`)}
                </tbody>
            </table>
        </section>`;
}

function Coverage() {
    const seen = new Set(IN_LOG);
    PORTED.forEach(([pins]) => pins.forEach((p) => seen.add(p)));
    SECTIONS.forEach((s) => (s.pins || []).forEach((p) => seen.add(p)));
    const missing = [];
    for (let i = 1; i <= 57; i += 1) if (!seen.has(i)) missing.push(i);
    if (!missing.length) return null;
    return html`<p class="g-missing"><${Icon} name="triangle-alert" />Pins with no surface: ${missing.join(', ')}</p>`;
}

function Nav() {
    return html`
        <nav class="g-nav" aria-label="Surfaces">
            ${SECTIONS.map((s) => html`<a key=${s.id} href=${`#g-${s.id}`}><b>${s.gid}</b>${s.title}</a>`)}
        </nav>`;
}

function Board() {
    const [session, setSession] = useState(null);
    useEffect(() => { fetchJson('/auth/csrf').then(setSession); installTips(); }, []);
    return html`
        <div class="pb-mast">
            <h1>Design board 3</h1>
            <p>${SECTIONS.length} surfaces, and every one of them is asking you something. Command search is not among
               them: you settled it, so it sits in the table below with the rest. Everything your pins raised that an
               earlier board had already answered is listed below as a document instead: putting the portal beside a design you
               approved asks you nothing. Each stage is the portal’s own code on the dev database, so what you click is what
               Session 5 builds; the switches sit above the stage and the decisions at its foot.</p>
        </div>
        <${Coverage} />
        <${Ported} />
        <${Settled} />
        <${PickIndex} gates=${PARTS} />
        <${Nav} />
        ${SECTIONS.map((s) => html`
            <${Gate} key=${s.id} id=${s.id} gid=${s.gid} realm=${s.realm} title=${s.title} sub=${s.sub}
                     pins=${s.pins} notes=${s.notes} controls=${s.controls} tries=${s.Tries ? html`<${s.Tries} />` : null}>
                ${s.Body ? html`<${s.Body} session=${session} />` : null}
            <//>`)}
        <p class="g-foot">${SECTIONS.length} surfaces · ${FORKS.length} picks · the dev database, not production.</p>`;
}

// Every drawer on this board mounts with the page, so its first-focus puts a keyboard ring on a close button nobody reached
// by keyboard. The ring waits for a real key press (2026-09-18 10:58 EDT).
addEventListener('keydown', () => document.documentElement.setAttribute('data-kbd', ''), { once: true });

installSprite();
render(html`<${Board} />`, document.getElementById('board'));
installFady();
