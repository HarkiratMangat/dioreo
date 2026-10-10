// BOARD 4: COLLECTIVE — every surface boards 1, 2 and 3 drew, in its finished state, on the portal's own code. Written 2026-09-21 12:24 EDT.
// Harkirat: "compile them all into a final board 4 which, for example, shows the refined armory manifest, the refined selection bar,
// the refined new build drawer, the refined broadcast cards, the refined broadcast manifest, etc etc. And then i can go visually check it
// and click through it to make sure it's all correct and you can use as 1 collective spec to port." Nothing here is a design choice:
// every fork is set to his ruling by b3/state.js's DEFAULTS. A surface that still carries an open question lists it in its notes, so
// signing the board off never quietly makes an unruled item final. Then Session 4 standardizes in its own artifact, and Board 4: Final,
// with the standard tokens applied, supersedes this one.
// 🔴 REBUILT ON BOARD 2's PRESENTATION (2026-09-21 14:35 EDT). His review of v1: "the way board 2 presented it's gates was GORGEOUS",
// and four sections were whole realms around one surface. Each section is now board 2's gate: the numeral in the realm's colour, a title
// and one line, the STATE switch on the right of the head (board 2's "Saved · One staged"), the one surface, and the notes under it as
// board 2's two-column list. Command search is gone: its ranking was filed as its own session, so it is not a finished surface.
import { render } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { installSprite } from '../ui/icons.js';
import { installTips } from '../ui/tips.js';
import { installFady } from '../b3/fady.js';
import { fetchJson } from '../ui/httpClient.js';
import BROADCAST from '../data/broadcast.js';
import REVIEW from '../data/review.js';
import CHANGESET from '../data/changeset.js';
import { setB3, useB3 } from '../b3/state.js';
import { ARMORY_SECTIONS } from '../gates/armory.js';
import { BROADCAST_SECTIONS } from '../gates/broadcast.js';
import { HISTORY_SECTIONS } from '../gates/history.js';
import { StateSeg, NewBuildSurface, CompareSurface, BroadcastSurface, AdminBar, ExportSurface } from './surfaces.js';

// 2026-09-21 15:18 EDT — the dev database's announcements carry a SESSIONB-SEED test prefix. Board 2 drew them without it, and on a board he
// 2026-09-21 15:20 EDT — the dev database's announcements carry a SESSIONB-SEED test prefix. Board 2 drew them without it, and on a
// board he signs off it reads as part of the copy. The kit serves its data from data/*.js modules (ui/httpClient.js), not the network,
// so the prefix is scrubbed from those shared objects in place, before the first render reads them.
const SEED = /^SESSIONB-SEED\s+/;
const scrub = (x) => { if (Array.isArray(x)) x.forEach(scrub); else if (x && typeof x === 'object') for (const k of Object.keys(x)) {
    if (typeof x[k] === 'string') x[k] = x[k].replace(SEED, ''); else scrub(x[k]); } };
[BROADCAST, REVIEW, CHANGESET].forEach(scrub);

const from3 = (id) => [...ARMORY_SECTIONS, ...BROADCAST_SECTIONS, ...HISTORY_SECTIONS].find((s) => s.id === id);

const SECTIONS = [
    { id: 'manifest', gid: 'C1', realm: 'armory', title: 'The Armory manifest', from: 'Board 2 · G4, then board 3 · M1 — the selection bar and its list, the badges, the problem card, the hazard edge',
      sub: 'Weapon groups, the tools row, the selection bar and its list. Tick builds, then Edit builds.', Body: from3('armory-manifest').Body, Try: from3('armory-manifest').Tries,
      // v19 (his item 9): ASS is the third grade and its motion is his to pick. The fork restyles every ASS badge on the board at once.
      // 2026-09-24 22:33 EDT: his C1 pick is A · Stink lines; B and C are deleted and the fork is gone.
      // 2026-09-26 11:43 EDT: his picks — the rank-mode marks at 20px in the plate, drawn from his expanded outlines; both forks removed.
      // 2026-09-26 12:27 EDT (his "improve the filled variant. and put both on the board for me to check"): which of his drawings the marks use.
      // 2026-09-26 13:43 EDT: the Rank Mode badges' motion is his pick C (2026-09-26 15:00 EDT: the echo, the backwards-C glow and the word on one clock per chip, random-feeling periods); no fork. Earlier: 2026-09-26 14:06 EDT: his "i want to see your current animation in the board, and alongside it … another".
      open: ['Board sample, to show the new badges on the rows: KILO 141 Build 1 is ASS, HOLGER 26 Build 1 is CAPABLE and JAK-12 Build 1 is META as well as TOP 5 and TOXIC. LK24’s two TOP 4 builds read TOP 5 (Top 4 is retired).', 'Rank modes (2026-09-25 23:19 EDT): LOCUS’s first build carries all six beside META and BEST SNIPER, the longest badge run on the manifest; HOLGER 26’s is DOM and TDM; the BAL-27 build stored as “Build 1” (Compare’s Build 5) is HP, S&D and Control; STRIKER’s is S&D.'] },
    { id: 'new-build', gid: 'C2', realm: 'armory', title: 'New build',
      sub: 'One build or many, from one drawer. The same drawer edits several builds at once.', Body: NewBuildSurface,
      from: 'Board 1 · G9, in board 3’s drawer shell and control family · Board 2 · G6 for the build name',
      // v19 (his item 33): Form A · Instrument is chosen; B and C are gone. Bulk's fork stays until its in-panel toggle lands (item 32).
      // v19 (his item 32): Bulk's fork is decided — Ledger and Preview stack both ship, as a toggle inside the panel; Margin notes is gone.
      // v20 (his items 38 and 15:39 EDT): 880 (his 2026-09-21 ruling), 940 and 980; past 880 a third of the width goes to the preview, two thirds to the form.
      // 2026-09-24 22:33 EDT: his C2 pick is 980 (preview 333, form 581); 880 and 940 are deleted and the fork is gone.
      open: ['Stored images marked “Unused upload” are a board sample; the portal lists the real ones from Cloudinary.'],
      states: [['add', 'Add build'], ['filled', 'Add · filled'], ['cards', 'Add · three'], ['bulk', 'Bulk · empty'], ['bulk-one', 'Bulk · one'], ['bulk-many', 'Bulk · several'], ['bulk-typing', 'Bulk · typing'], ['bulk-warn', 'Bulk · warning'], ['bulk-bad', 'Bulk · can’t read'], ['bulk-paste', 'Bulk · pasted'], ['bulk-dup', 'Bulk · duplicate'], ['dmz', 'DMZ'], ['edit', 'Edit 3 builds']], },
    { id: 'compare', gid: 'C3', realm: 'armory', title: 'Compare', from: 'Board 1 · G10', sub: 'Up to six builds, from any weapons, slot by slot.', Body: CompareSurface,
      // 2026-09-28 14:09 EDT: his picks — the three tables stay as Cards · Grid · Lanes (+ Embed) on the panel's own VIEW toggle; the landing is the search over the weapon tiles. Both forks removed.
      // 2026-09-29 17:56 EDT: his Version 40 intake removed Grid and made Embed the Discord cards under the table; his Version 41 intake scrapped Lanes — Compare is Cards alone.
      states: [['one', 'One weapon'], ['two', 'Two weapons'], ['build', 'One build'], ['empty', 'Empty']] },
    { id: 'repairs', gid: 'C4', realm: 'armory', title: 'Repairs', from: 'Board 3 · M2', sub: 'Tickets by severity: what blocks sharing, then what is below standard.',
      Body: from3('repairs').Body, states: [['real', 'Today’s'], ['clean', 'A clean day']], apply: (v) => setB3('p6day', v) },
    { id: 'export', gid: 'C5', realm: 'armory', title: 'Export', from: 'Board 3 · M3', sub: 'Download a whole set, or pick builds one by one into files.',
      Body: (p) => html`<${ExportSurface} ...${p} Body=${from3('export').Body} />`, states: [['landing', 'Landing'], ['picker', 'Picker'], ['picked', 'Three picked']] },
    { id: 'queue', gid: 'C6', realm: 'broadcast', title: 'The delivery queue', from: 'Board 2 · G3, then board 3 · B1 — the never-ends warning on the card',
      sub: 'The cards, the panel head and Changes ahead.', Body: from3('queue').Body, Try: from3('queue').Tries },
    { id: 'broadcast', gid: 'C7', realm: 'broadcast', title: 'The Broadcast manifest, and posting', from: 'Board 2 · G11 · Board 1 · G8 for the post drawer',
      sub: 'Every announcement with its state and dates. Post announcement opens the drawer.', Body: BroadcastSurface,
      states: [['saved', 'Saved'], ['staged', 'One staged'], ['post', 'Posting']] },
    { id: 'history', gid: 'C8', realm: 'history', title: 'History', from: 'Board 2 · G11’s chips, then board 3 · H1 — the time rail and your spacing',
      sub: 'Every change, alert and restart, and the undo.', Body: from3('history').Body, Try: from3('history').Tries },
    { id: 'admin', gid: 'C9', realm: 'analytics', title: 'Admin traffic', from: 'Board 2 · G2', sub: 'The chip that adds your own admin traffic to Analytics, in its view bar.', Body: AdminBar,
      states: [['off', 'Product traffic'], ['on', 'Admin included']] },
];

// A fork he picks from (his 13:01 ruling): the option's switch, and one line saying what that option IS so the pick is quick.
function ForkRow({ fk }) {
    const v = useB3(fk.k);
    return html`<div class="b4-fork"><span class="b4-fork-k">${fk.label}</span><${StateSeg} value=${v} options=${fk.opts} onChange=${(x) => setB3(fk.k, x)} label=${`${fk.label} option`} /><p>${fk.say[v]}</p></div>`;
}

function Section({ s, session }) {
    const [st, setSt] = useState(s.states ? s.states[0][0] : null);
    const pick = (v) => { setSt(v); if (s.apply) s.apply(v); };
    useEffect(() => { if (s.apply && st) s.apply(st); }, []);
    return html`
        <section class="pb-gate pb-realm app b4g" id=${`c-${s.id}`} data-realm=${s.realm} data-st=${st || null}>
            <div class="pb-head"><span class="pb-gid">${s.gid}</span><div><h2>${s.title}</h2><p>${s.sub}</p></div>
                ${s.states ? html`<div class="pb-ctl"><${StateSeg} value=${st} options=${s.states} onChange=${pick} label=${`${s.title} — state`} /></div>` : null}</div>
            ${(s.forks || []).length ? html`<div class="b4-forks">${s.forks.map((fk) => html`<${ForkRow} key=${fk.k} fk=${fk} />`)}</div>` : null}
            ${s.Try ? html`<div class="b4-try"><${s.Try} /></div>` : null}
            <${s.Body} session=${session} state=${st} />
            <ul class="pb-new">
                <li><b>From</b><span>${s.from}</span></li>
                ${(s.open || []).map((o) => html`<li key=${o} class="b4-open"><b>Open</b><span>${o}</span></li>`)}
            </ul>
        </section>`;
}

function Board() {
    const [session, setSession] = useState(null);
    useEffect(() => { fetchJson('/auth/csrf').then(setSession); installTips(); }, []);
    return html`
        <div class="b4">
            <header class="pb-mast"><h1>Board 4: Collective</h1>
                <p>Every surface boards 1, 2 and 3 drew, finished, on the portal’s own code. Nothing here is a choice: each is what ships.
                   The switch beside a title shows that surface’s states; anything still open is listed under it.</p></header>
            ${SECTIONS.map((s) => html`<${Section} key=${s.id} s=${s} session=${session} />`)}
        </div>`;
}

// Read by b3/history.js: behaviour ruled for Board 4 only (the Bot online fold) keys on this, so Board 3-E stays as approved.
window.B4_COLLECTIVE = true;
addEventListener('keydown', () => document.documentElement.setAttribute('data-kbd', ''), { once: true });
installSprite();
render(html`<${Board} />`, document.getElementById('board'));
installFady();
