// Board 3 — the picks. Every fork that is still open is listed here once: its key in the board's own state (so the stage
// shows the option you are looking at), its options with the reason each exists, and my read. A pick is written to this
// artifact's db under decisions/<fork>, which is where I read it back from — so a choice made here needs no message.
// A gate with no fork left (a fix with its value in the pin, a port of a board 1 or board 2 design) carries no pick block.
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Icon } from '../ui/icons.js';
import { setB3, useB3, b3, DEFAULTS } from '../b3/state.js';

export const FORKS = [
    // 🔴 THE QUESTION HAD THE WRONG DENOMINATOR — rewritten 2026-09-17 10:10 EDT. It asked for NINE colours; the slot vocabulary
    // is FIFTEEN names, because of the six you gave me on 2026-09-16 that this kit had never carried. Measured against
    // the dev database: 133 builds, and not one records Smoothbore, Bolt, Trigger Action, Bowstring, Limb or Guard —
    // the portal cannot store them yet, which is a Session 5 job, filed in docs/db-deferred-list.md.
    // And fifteen hues would not work anyway: your six sit 14 degrees apart at their closest, nine fit with that gap
    // held, and fifteen would average 24 degrees with the tightest pair under 7 — indistinguishable on a 20px chip.
    // So the answer is nine hues and a tag that NAMES the slot, which is the style you asked for in the same round.
    { id: 'p2pal', key: 'p2pal', gate: 'armory-manifest', title: 'Slot palette', mine: 'final',
      decided: { choice: 'final', at: '2026-09-18', why: 'Your nine hexes of 2026-09-18 21:54 EDT and the six slot mappings of 22:05, with a cool grey for unknown slots in place of #E6EAEE (your popup pick, 22:57).' },
      ask: 'Nine hues for fifteen slot names — which nine?',
      options: [
          ['final', 'Yours, 09-18', 'Optic #3FD0E6 · Muzzle #FF7057 · Barrel #FF9A3C · Stock #F3D13F · Laser #00F69B · Underbarrel #4C8EFF · Rear Grip #AF94FF · Ammunition #FF2A55 · Perk #FF8FD0. Trigger Action wears Underbarrel, Bowstring Muzzle, Limb Barrel, Bolt and Guard Rear Grip; Smoothbore and any unknown slot a cool grey.'],
          ['mineflat', 'Yours, regularised', 'The same nine hues, with lightness and chroma held constant — your colour choices kept, and the one thing you did not choose taken away. Your set runs .648 to .935 in lightness, which is why Ammunition reads lighter and flatter than Optic at the same size.'],
          ['mine', 'Yours + my three', 'Your six exactly as you wrote them, and Barrel, Stock and Underbarrel placed at the midpoints of your three widest empty arcs, at the median lightness and chroma of your own set so none of them shouts louder than a colour you chose.'],
          ['named', 'Named hues', 'Nine hues at even steps, each one a colour you would name out loud: cyan optic, red muzzle, orange barrel, yellow stock.'],
          ['parts', 'Gun parts', 'Cool at the muzzle, warm at the stock, following where the part sits on the weapon; the perk, which is not a part, stays near-neutral.'],
          ['calm', 'One family', 'Lightness and chroma held constant, hue moved in even steps — as far apart as nine colours get while still belonging together, and none louder than its neighbours.'],
      ] },
    // 2026-09-17 13:06 EDT — the label came OUT of this fork. "Apply the {Slot}: {Attachment} method to all the other tag
    // styles": naming is not a fifth shell, it is a second axis, so it is asked separately and every pairing is
    // reachable. Asking them as one list would have made ten options and answered neither question cleanly.
    { id: 'p2lab', key: 'p2lab', gate: 'armory-manifest', title: 'Slot label', mine: 'colon',
      decided: { choice: 'key', at: '2026-09-18', why: 'You picked Key by popup (2026-09-18 10:41 EDT): the slot as a micro uppercase field key, separated from the attachment by air alone.' },
      ask: 'And how does the tag name its slot?',
      options: [
          ['colon', 'Colon', 'Your screenshot, kept as the baseline: a dot in the slot\u2019s hue, the slot\u2019s name in that hue, a colon, then the attachment in plain ink.'],
          ['key', 'Key', 'The slot as a field key rather than a word in a sentence \u2014 micro, uppercase, tracked, in the data face, separated from the attachment by air alone. No dot, no colon and no rule: once the two halves differ in case, size and family, both are saying something already said, and dropping them buys width back in a strip that scrolls.'],
          ['trail', 'Trailing', 'The attachment first, then its slot as a quiet micro key after it. Every other label pushes the name you scan for to a different x; this one lines the attachments up.'],
          ['off', 'None', 'No slot name at all \u2014 the tag is just the attachment, as it ships today. Here so the cost of naming is visible rather than assumed.'],
      ] },
    { id: 'p2sty', key: 'p2sty', gate: 'armory-manifest', title: 'Tag style', mine: 'washc',
      decided: { choice: 'neutralbg', at: '2026-09-19', why: 'You picked Laid on (2026-09-19 11:01 EDT): "let\u2019s do Laid On but keep and document the code for the Outline style in case I change my mind". Outline\u2019s rules stay in board.css, marked, and Laid on keeps the ring you gave it from Outline.' },
      ask: 'And how does the tag wear that colour?',
      options: [
          // 🔴 RE-DRAWN TO HIS RULE (2026-09-17 22:57 EDT): "the slot name coloured, the attachment name white … a soft-cornered
          // rectangle … your design proposals expand upon THAT." Three of these five still coloured the attachment name, and
          // two were NAMED for doing it. Every option is now the same text treatment on a different container.
          ['wash', 'Wash', 'The shipped tag: a ground tinted in the slot colour, a ring of the same hue.'],
          ['washc', 'Light wash', 'Half the tint and a finer ring — the colour lives in the slot name and the edge, not the ground.'],
          ['neutral', 'Cut in', 'One neutral container for every slot, cut INTO the row: a ground that deepens downward under a lit top edge.'],
          ['text', 'Text only', 'No ground and no ring at all — the slot in its hue, the attachment in white, straight on the row. The floor the others are measured against.'],
          ['neutralbg', 'Laid on', 'Board 2 r6’s chip, the one you pointed at: a flat plate a step lighter than the row with one hairline ring, laid ON the row rather than cut into it.'],
          ['outline', 'Outline', 'No ground at all — only the rectangle’s edge, in the slot’s hue. A field drawn rather than filled, and the lightest a container can be and still be one.'],
          ['fade', 'Fade', 'The hue sits where the slot name is and dies out under the attachment, so the colour and the word that carries it coincide.'],
          ['lit', 'Lit edge', 'A neutral plate whose top edge catches the slot’s hue, the way a keycap catches light. The colour is a line, not a fill.'],
      ] },
    { id: 'p3', key: 'p3', gate: 'armory-manifest', title: 'The problem card', mine: 'b',
      decided: { choice: 'a', at: '2026-09-17',
          why: 'Every change you have asked for since has been on A · Tape — the strip across the container top, the border gap, the pointer drawn as part of the border. B was never the one being refined, so it stops being offered.' },
      ask: 'Direction A is settled. Both of these are A, refined — which container and which hazard mark?',
      options: [
          ['a', 'A · Tape and tail', 'Hazard tape across the top of the card, and a drawn tail pointing back at the chip. The tail is part of the border.'],
          ['b', 'B · Spine, joined', 'No tail: the chip becomes the card’s tab, so the two are one shape. The hazard runs down the left spine, and each problem is a row with its own drawn answer.'],
      ] },
    // The one-table mark was my call (a bare triangle), so it is SHOWN as two versions and asked. (round 4u)
    { id: 'p3tbl', key: 'p3tbl', gate: 'armory-manifest', title: 'The table’s problem mark', mine: 'bare',
      decided: { choice: 'bare', at: '2026-09-18', why: 'You picked Bare mark by popup (2026-09-18 10:41 EDT): the triangle alone, as the grouped list draws it; hover or click opens the card.' },
      ask: 'In the one-table view, how does a build row show it has problems? Pick eight, open the list, switch to One table.',
      options: [
          ['bare', 'Bare mark', 'The triangle alone, as the grouped list’s build rows draw it. Hover or click opens the card with every word.'],
          ['count', 'Mark and count', 'The triangle and how many problems, in a quiet warn box — the number without opening anything.'],
      ] },
    // 2026-09-18 23:35 EDT: thread 1f502de1 — "Can you make these tiles/cards layout fit better together? I don't like the empty spacing between them."
    { id: 'p6lay', key: 'p6lay', gate: 'repairs', title: 'How the tickets fit together', mine: 'lanes',
      decided: { choice: 'sections', at: '2026-09-19', why: 'You recorded By severity on the board (2026-09-19 10:43 EDT): Blocks sharing, then Below standard, each under its own heading.' },
      ask: 'The tickets are different heights. How should they sit so there are no holes between them?',
      options: [
          ['lanes', 'Two lanes', 'Each ticket drops into the shorter of two columns, so the columns stay packed and worst-first still reads top to bottom.'],
          ['rows', 'Even rows', 'Tickets side by side stretch to one height, so each row lines up and every footer sits on one line; a short ticket keeps its space inside.'],
          ['sections', 'By severity', 'Blocks sharing, then Below standard, each under its own heading in even rows; the severity badge becomes the heading.'],
      ] },
    // 2026-09-18 23:21 EDT: the selection list's weapon header. His thread 3300d186: the problem chip was "basically touching the top/bottom
    // edges of the row" at 40px, and the manifest row's 52px "would be too tall here" — he asked to see 44px and 48px as a toggle.
    { id: 'sdgh', key: 'sdgh', gate: 'armory-manifest', title: 'The selection list’s weapon header height', mine: '44',
      decided: { choice: '44', at: '2026-09-19', why: 'You moved it back to 44px (2026-09-19 10:03 EDT) once the problem chip left this header: "shrink its height from 48px to 44px".' },
      ask: 'How tall is the weapon header in the selection list, now the problem chip sits on its right? Pick builds with a problem, open the list.',
      options: [
          ['44', '44px', 'The chip keeps 5px above and below; the header is the height of a build row.'],
          ['48', '48px', 'The chip keeps 7px above and below; the header stands a little taller than its rows.'],
      ] },
    // 2026-09-18 20:11 EDT: v4's ellipse was "abrupt", v5's long dim was "not a fan"; he asked to see every ending as a toggle.
    { id: 'hzf', key: 'hzf', gate: 'armory-manifest', title: 'The row’s hazard edge', mine: 'c',
      decided: { choice: 'c', at: '2026-09-18', why: 'He picked C, taper + plume (2026-09-18 20:20 EDT), and moved it to the LEFT border, where it replaces the row\u2019s hover accent rather than sitting beside it.' },
      ask: 'A build row with a problem carries a hazard strip on its right edge. How does it end at the top and bottom?',
      options: [
          ['a', 'A · Taper', 'Narrows in a curve toward the border from the middle of the row, crisp, no dimming.'],
          ['b', 'B · Plume', 'Keeps its full width and fades in brightness toward both ends.'],
          ['c', 'C · Taper + plume', 'Narrows and fades together, the fade starting from the middle so the ends reach nothing.'],
          ['d', 'D · Wedge', 'Full width through the middle 40%, then narrows in a straight line to a point on the border.'],
      ] },
    { id: 'p4', key: 'p4', gate: 'armory-manifest', title: 'The checkbox', mine: 'a',
      decided: { choice: 'b', at: '2026-09-18', why: 'You marked B · Soft well as decided on Board 3-E (2026-09-18 23:22 EDT).' },
      ask: 'Every Armory checkbox uses one of these, select-all included.',
      options: [
          ['a', 'A · Drawn check', 'A sunk square that fills with the accent and strokes the tick itself; the middle state is a bar.'],
          ['b', 'B · Soft well', 'A softer well with a lighter rim, the tick in ink rather than white.'],
      ] },
    // 🔴 NOT A FORK ANY MORE — 2026-09-17 09:54 EDT. "I had already chosen 'use both', so why is the option for this still one or
    // the other?" Because the row was never updated after he answered it. Both shapes are built and the toggle that
    // switches them lives in the list's own header, where he asked for it on 2026-09-16 13:56 EDT — so this stopped
    // being a question the moment that toggle shipped, and asking it again reads as not having listened. It moved to
    // the settled table in gates/main.js. The `p5list` key still drives the toggle; only the ASKING is gone.

    { id: 'p5bg', key: 'p5bg', gate: 'armory-manifest', title: 'The bar’s ground', mine: 'mesh',
      decided: { choice: 'mesh', at: '2026-09-18', why: 'You marked Mesh as decided on Board 3-E (2026-09-18 23:22 EDT). Solid stays in the files as a future portal setting, per thread bd09c832.' },
      ask: 'You asked to see a mesh version of the bar.',
      options: [
          ['solid', 'Solid', 'One tinted ground, the shipped look.'],
          ['mesh', 'Mesh', 'Four soft radials in the accents of the weapons you actually picked, so the bar carries their colour.'],
      ] },
    // \U0001f534 REWRITTEN 2026-09-17 13:14 EDT — "these are all the same thing wearing makeup." The three options this replaces
    // were three PLACEMENTS of one kind of string, so all three kept the sentence he skips and moved it. His own
    // pin, 2026-09-12 11:21 EDT: "these small texts just look and feel like noise to me. Never once have i glaced
    // over it and assumed it was actually informative." A caption reads the same on every visit and is therefore
    // zero information by the second one; only a line that is true ONLY RIGHT NOW earns the glance back. So the
    // question is what the line IS, the default is nothing, and these four are the same four verdicts \u00a75c Step 3's
    // rewrite table needs.
    { id: 'p10', key: 'p10', gate: 'armory-manifest', title: 'Small text', mine: 'state',
      ask: 'What should a line of small text BE? The corpus under the switch shows the rule on your own pinned strings, one of them deleted.',
      options: [
          ['state', 'A readout', 'The line carries live state \u2014 data face, tabular figures, the number in full ink. It changes as you work, so it is never zero information, which is the one property a caption can never have. Your broadcast meta line already proved it: "1 in one message, oldest first \u00b7 cap 10" became "2 of 10 slots used" and that pin closed.'],
          ['does', 'A consequence', 'Only where an action is about to change your data, and only the part you cannot already see on screen \u2014 "Removes 3 builds at commit \u00b7 reversible until then" rather than a description of the button.'],
          ['off', 'Deleted', 'Nothing at all. The honest default, because most of these repeat the label directly above them \u2014 the note under Follow-up spends two lines saying what the control is already called.'],
          ['now', 'Now \u00b7 caption', 'Grey, light, sitting under its control and describing it. Here so the thing you have called noise three times is on the board beside the alternatives rather than assumed away.'],
      ] },
    { id: 'p5hint', key: 'p5hint', gate: 'armory-manifest', title: 'The Stage deletion hint', mine: 'card',
      decided: { choice: 'card', at: '2026-09-18', why: 'You marked Hover card as decided on Board 3-E (2026-09-18 23:22 EDT).' },
      ask: 'The reverse icon is gone. What explains that deletion is reversible?',
      options: [
          ['card', 'Hover card', 'A small card above the button on hover and on focus: what it stages, and how to undo it.'],
          ['inline', 'Inline line', 'The bar itself answers: on hover the chips give way to one line saying nothing is removed until Review.'],
      ] },
    { id: 'p6', key: 'p6', gate: 'repairs', title: 'The worklist', mine: 'a',
      decided: { choice: 'c', at: '2026-09-18', why: 'You marked C · Tickets as decided on Board 3-E (2026-09-18 22:42 EDT).' },
      ask: 'The worklist lives in the Repairs panel and the tab carries the status. Which way does it list the work?',
      options: [
          ['a', 'A · By weapon', 'One row per build, grouped by its weapon and the worst first, each row opening to the reasons and the build’s own attachments.'],
          ['b', 'B · By problem', 'A block per check — missing image, near-duplicate, no code — with the builds that fail it as cards inside.'],
          ['c', 'C · Tickets', 'Each broken build is one ticket: the fault in plain words, the evidence drawn (the slots, the code against the attachments, the twin), and one action named for the fault. No table, nothing to expand.'],
      ] },
    // 🔴 RULED — 2026-09-17 18:24 EDT. You picked "its own step" more than once and the board kept asking. `decided`
    // is the model fix, not a deletion: a ruled fork renders as the RECORD of your call, so the alternative cannot
    // come back and Session 5 can still read what was chosen and why. The old answer was to delete the fork (see
    // `p5list` above), which stops the question and loses the answer.
    { id: 'exp', key: 'exp', gate: 'export', title: 'Pick-your-own export', mine: 'b',
      decided: { choice: 'b', at: '2026-09-17',
          why: 'You picked “its own step” repeatedly, so it is no longer a question. The drawer restyle that shipped alongside it is reverted too — “i outright reject your design improvement. This shit is ugly.”' },
      ask: 'The picker comes back. Where does it sit in the Export drawer?',
      options: [
          ['a', 'A · Under the scopes', 'The whole-scope list stays, and the picker opens beneath it in the same scroll.'],
          ['b', 'B · Its own step', 'A “Pick builds…” row opens a step of its own — search, weapons, builds, a running count — with a way back.'],
      ] },
    // Round 4w: his "aggressive, drastic" ask for the picker, drawn as a new layout beside the checklist so the two compare.
    { id: 'expl', key: 'expl', gate: 'export', title: 'The picker', mine: 'tiles',
      decided: { choice: 'tiles', at: '2026-09-19', why: 'You recorded Tiles + file on the board (2026-09-19 10:47 EDT).' },
      ask: 'Open Pick builds… — which picker?',
      options: [
          ['tiles', 'Tiles + file', 'Every weapon as a tile you pick builds from by number, and the file you are about to download writing itself beside it. The whole catalogue fits two screens instead of twelve, and the selection is the file.'],
          ['list', 'Checklist', 'The long list: a weapon, then each build with its five attachments, and the picked builds as chips above.'],
      ] },
    // (2026-09-19 16:38 EDT) After "all equally shit… the same thing wearing different makeup": a structural answer, not a fourth coat of paint.
    { id: 'xbg', key: 'xbg', gate: 'export', title: 'The drawer’s ground', mine: 'ground',
      decided: { choice: 'ground', at: '2026-09-20', why: 'You recorded Ground on the board (2026-09-20 00:33 EDT). The switch keeps only that option, the way every other ruled fork does.' },
      options: [['flat', 'Flat'], ['mesh', 'Mesh'], ['ground', 'Ground']] },
    { id: 'p8', key: 'p8', gate: 'queue', title: 'The never-ends warning', mine: 'a',
      decided: { choice: 'a', at: '2026-09-20', why: 'You recorded A - On the card on the board many versions ago and the switch kept offering both: "did i already not state what is the point of the board selection options if you are never going to look at them?" (2026-09-20 17:09 EDT). Transcribed here so it holds even where the decisions db is unreachable.' },
      ask: 'The count sits inside the panel head either way. Where does the warning itself live?',
      options: [
          ['a', 'A · On the card', 'The card it is about carries it: the bar runs off its end into a hazard tail, and one quiet row under the timeline sets an end date.'],
          ['b', 'B · In Changes ahead', 'The card carries only the tail, and Changes ahead opens with the announcement that has no date to show.'],
      ] },
    { id: 'p9', key: 'p9', gate: 'history', title: 'The timeline', mine: 'a',
      decided: { choice: 'b', at: '2026-09-20', why: 'You chose B - Time rail (2026-09-20 17:41 EDT) and deferred the redesign: "i chose the time rail style for now, the drastic redesign is deferred for now." A, C, D and E stop being offered.' },
      ask: 'Timeline is settled, the Level filter is back. Which spacing?',
      options: [
          ['a', 'A \u00b7 Day groups', 'A sticky day header, then its events; each row one line of what happened with its marks beside it.'],
          ['b', 'B \u00b7 Time rail', 'A time rail down the left with a dot per event, the day as a marker on the rail, and a taller row so the text can breathe.'],
          ['c', 'C \u00b7 Day blocks', 'Each day its own block \u2014 a larger date, its kind mix and its first\u2013last span \u2014 set apart in the list by a slot of desk.'],
          ['d', 'D \u00b7 Bursts', 'Day groups as in A; inside a day of more than eight events the rows cluster into bursts, a gap of twenty minutes starting a new one, each with its span and count.'],
          ['e', 'E \u00b7 Date gutter', 'No day band: the date and its mix stand in a gutter on the left and stay put while their rows pass, so a day reads as a margin note.'],
      ] },
    { id: 'e2spd', key: 'e2spd', gate: 'armory-manifest', title: 'The reveal', mine: 'smooth',
      ask: 'Pin 12: the fold control opens to its word. You asked for a smooth one and gave no number, so this is the number — hover a weapon row\u2019s collapse button to feel each.',
      options: [
          ['quick', 'Quick \u00b7 160ms', 'Barely a beat \u2014 and still six times more real motion than what was there, which finished in about 25ms.'],
          ['smooth', 'Smooth \u00b7 260ms', 'The word travels its own width over a quarter second: long enough to read as motion, short enough not to wait on.'],
          ['slow', 'Slow \u00b7 380ms', 'Deliberate. Reads as a drawer making room rather than a label appearing.'],
      ] },
];

// ONE LIST PER FORK (2026-09-17 22:00 EDT). The stage switch and the DECIDE row were two hand-written copies of the same options and
// they drifted: the switch kept offering "A · Under the scopes" after he ruled "its own step" (4733ffc0 asked why it was
// still an option), "B · Spine" after P3 was ruled, the dropped "Tab" and "Bar", and named the rest differently. The switch
// now reads the fork: its options in the fork's words, and only the ruled one once he has ruled. `lead` is the "now" option.
export function segOpts(key, lead = []) {
    const f = FORKS.find((x) => x.key === key);
    if (!f) return lead;
    // 🔴 A RECORDED PICK RULES THE SWITCH, NOT ONLY A HAND-WRITTEN `decided` — corrected 2026-09-20 18:47 EDT.
    // `decided` is MY transcription of his answer, so a fork he ticked in the Decide panel and that I
    // had not yet transcribed kept offering every option — which is his complaint in its general form,
    // and writing `decided` onto one fork by hand was fixing the instance again. The panel is the
    // source of truth for `applyDecision`; it is the source of truth here too.
    const ruled = (f.decided && f.decided.choice) || (store.picks[f.id] && store.picks[f.id].choice) || null;
    const opts = f.options.filter(([v]) => !ruled || v === ruled).map(([v, l]) => [v, l]);
    const all = [...lead.filter(([v]) => !opts.some(([o]) => o === v)), ...opts];
    // The baseline leads every switch (2026-09-17 23:35 EDT): Small text's fork lists 'now' LAST, so its switch alone started on a
    // proposal while every other switch starts on Now / Portal today.
    const i = all.findIndex(([v]) => v === 'now');
    return i > 0 ? [all[i], ...all.slice(0, i), ...all.slice(i + 1)] : all;
}
export const FORKS_BY_GATE = FORKS.reduce((m, f) => { (m[f.gate] = m[f.gate] || []).push(f); return m; }, {});

// ── the store. One subscription per document, opened once, never in render (the db capability's own rule).
const store = { db: null, ready: false, picks: {}, notes: {}, saving: {}, failed: {}, subs: new Set() };
const emit = () => store.subs.forEach((f) => f());

// 🔴 A RECORDED DECISION DRIVES THE BOARD (2026-09-20 12:11 EDT). Harkirat: "why is 'flat / mesh / ground' still an
// option when we already decided to use the 'ground' version… it's literally selected in the Decided choices panel.
// What's the point of that panel if you're not even going to look at it?" He is right, and the cause was structural,
// not forgetfulness: his click writes `decisions/<fork>` in the artifact's db, while the board's DEFAULTS live in
// b3/state.js and a fork's `decided` line is a HAND TRANSCRIPTION of the same fact. Three copies of one answer, two
// of them written by me — so the db said `ground` (2026-09-20 00:33 EDT) while the default said Flat, and I then
// "fixed" it to Mesh and wrote a migration forcing Mesh onto him.
// The panel is the source of truth now: the moment a decision arrives it is applied to the key it governs, so a
// default can never contradict a click again. It only moves a key he has not since changed by hand on this device.
const decided = new Set();
function applyDecision(f, rec) {
    if (!rec || !rec.choice || decided.has(f.id)) return;
    decided.add(f.id);
    if (b3(f.key) !== rec.choice) setB3(f.key, rec.choice);
}

export function usePicks() {
    const [, tick] = useState(0);
    useEffect(() => { const f = () => tick((n) => n + 1); store.subs.add(f); return () => { store.subs.delete(f); }; }, []);
    return store;
}

(async () => {
    let db = null;
    try { db = (window.claude && typeof window.claude.use === 'function') ? await window.claude.use('db') : null; }
    catch (e) { db = null; }
    store.db = db;
    store.ready = true;
    if (db) {
        for (const f of FORKS) {
            try {
                db.doc(`decisions/${f.id}`).onSnapshot((d) => {
                    store.picks[f.id] = d && d.exists ? d.data() : null;
                    applyDecision(f, store.picks[f.id]);
                    emit();
                });
            } catch (e) { store.failed[f.id] = true; }
        }
    }
    emit();
})();

const watched = new Set();
function watchNote(gate) {
    if (!store.db || watched.has(gate)) return;
    watched.add(gate);
    try {
        store.db.doc(`notes/${gate}`).onSnapshot((d) => { store.notes[gate] = d && d.exists ? d.data() : null; emit(); });
    } catch (e) { /* the note box stays local, and the gate says so */ }
}

async function write(path, data, key) {
    if (!store.db) return false;
    store.saving[key] = true; emit();
    try {
        await store.db.doc(path).set({ ...data, at: new Date().toISOString() });
        delete store.failed[key];
        return true;
    } catch (e) {
        store.failed[key] = true;
        return false;
    } finally { store.saving[key] = false; emit(); }
}

const when = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); };

// ── the decisions for one surface, in one panel: a row per fork, its options to look at, and the tick that records one.
function Row({ fork }) {
    const s = usePicks();
    const shown = useB3(fork.key);
    const rec = s.picks[fork.id];
    const ruled = fork.decided || null;
    // A ruled fork SHOWS what you chose rather than asking again, and the surface is switched to it on mount so the
    // board never renders an option you rejected. This is why the same question cannot reappear after you answer it.
    useEffect(() => { if (ruled && shown !== ruled.choice) setB3(fork.key, ruled.choice); }, [fork.id, shown]);
    const picked = ruled ? ruled.choice : (rec && rec.choice);
    const busy = s.saving[fork.id];
    const opt = (v) => fork.options.find((o) => o[0] === v) || [];
    const take = (v) => write(`decisions/${fork.id}`, { fork: fork.id, gate: fork.gate, choice: v, label: opt(v)[1] || v, note: (rec && rec.note) || '' }, fork.id);
    if (ruled) {
        return html`
            <div class="dk-row done ruled" data-fork=${fork.id}>
                <div class="dk-q"><b>${fork.title}</b><span>${ruled.why}</span></div>
                <div class="dk-os"><span class="dk-ruled"><${Icon} name="check" />${opt(ruled.choice)[1]}</span></div>
                <span class="dk-st">Ruled</span>
            </div>`;
    }
    return html`
        <div class=${'dk-row' + (picked ? ' done' : '')} data-fork=${fork.id}>
            <div class="dk-q"><b>${fork.title}</b><span>${fork.ask}</span></div>
            <div class="dk-os">
                ${fork.options.map(([v, label, why]) => html`
                    <span class=${'dk-o' + (shown === v ? ' shown' : '') + (picked === v ? ' picked' : '')} key=${v}>
                        <button type="button" class="dk-see" aria-pressed=${shown === v ? 'true' : 'false'} title=${why}
                                onClick=${() => setB3(fork.key, v)}>${label}${fork.mine === v ? html`<i class="dk-mine" title="my read">★</i>` : null}</button>
                        <button type="button" class="dk-take" disabled=${!s.db || busy} title=${`Record ${label}`}
                                aria-label=${`Record ${label}`} onClick=${() => take(v)}><${Icon} name="check" /></button>
                    </span>`)}
            </div>
            <span class="dk-st">${picked ? html`<${Icon} name="check" />${opt(picked)[1] || picked}` : s.ready && !s.db ? 'tell me in chat' : 'open'}</span>
        </div>`;
}

export function Decide({ gate }) {
    const forks = FORKS_BY_GATE[gate] || [];
    const s = usePicks();
    if (!forks.length) return null;
    const done = forks.filter((f) => f.decided || s.picks[f.id]).length;
    return html`
        <div class=${'dk' + (done === forks.length ? ' settled' : '')}>
            <div class="dk-h"><span class="dk-k">${done === forks.length ? html`<${Icon} name="check" />Decided` : 'Decide'}</span>
                <b>${done === forks.length ? `All ${forks.length} picked` : `${done} of ${forks.length} picked`}</b>
                <span class="dk-hint">${done === forks.length
                    ? 'This surface is answered — Session 5 builds what is ticked here.'
                    : 'Look at an option, then tick it to record it — I read these back, so nothing needs saying in the chat.'}</span></div>
            ${forks.map((f) => html`<${Row} fork=${f} key=${f.id} />`)}
        </div>`;
}

// ── anything a pick cannot carry: a tweak, a value, a "not this". Kept under notes/<gate>, which I read with the picks.
export function GateNote({ gate }) {
    const s = usePicks();
    useEffect(() => { watchNote(gate); }, [gate, s.db]);
    const saved = s.notes[gate];
    const [text, setText] = useState('');
    const [dirty, setDirty] = useState(false);
    const value = dirty ? text : (saved && saved.text) || '';
    const key = `note:${gate}`;
    return html`
        <div class="gn">
            <label class="gn-l" for=${`note-${gate}`}>Anything else for this surface</label>
            <textarea id=${`note-${gate}`} class="gn-t" rows="2" placeholder=${s.db ? 'A tweak, a value, a “not this” — I read these with the picks.' : 'Tell me in the chat; this box has nowhere to save here.'}
                      disabled=${!s.db} value=${value}
                      onInput=${(e) => { setDirty(true); setText(e.target.value); }}
                      onBlur=${async () => { if (!dirty) return; const ok = await write(`notes/${gate}`, { gate, text }, key); if (ok) setDirty(false); }} />
            <span class="gn-s">${s.saving[key] ? 'Saving…' : dirty ? 'Unsaved — click outside the box' : saved && saved.text ? `Saved ${when(saved.at)}` : ''}</span>
        </div>`;
}

// ── the top of the board: what is still open, and where it lives.
// -- H1's spacing, on the board's OWN lab rows. 2026-09-20 19:45 EDT.
// I built a second spacing playground while L1 - the selection-list lab, four gates up this same board - already
// existed. His words: "look at your toggles vs what was created by you a few compacts ago... those literally exist
// on the same board." Three things that one has and mine did not, and the third is the one that mattered: every row
// names a RELATION in plain words rather than a variable's abbreviation; a typed box and a per-row default button
// sit beside the slider; and SAVE FOR CLAUDE writes the set to the board's store, which is the whole point - he
// tunes, I read the numbers back. Mine wrote localStorage, so the values died in his browser cache.
const H1_GROUPS = [
    ['The toolbar', [
        ['h1L', 'Left edge \u2192 label', 22], ['h1Labw', 'Label width', 56],
        ['h1Lab', 'Label \u2192 chips', 16],
        ['h1Chip', 'Between chips', 6], ['h1Row', 'Row \u2192 row', 10],
        ['h1Col', 'First column \u2192 second', 36], ['h1R', 'Chips \u2192 right edge', 18]]],
    ['The search', [
        ['h1Top', 'Top edge \u2192 search', 16], ['h1Srchh', 'Search height', 44],
        ['h1Srchw', 'Search width', 956], ['h1Head', 'Search \u2192 filter rows', 12]]],
    ['The list', [
        ['h1Rowh', 'Event row height', 56], ['h1Rowp', 'Row text \u2192 row edge', 11],
        ['h1Day', 'Day row height', 40]]],
    ['The columns', [
        ['h1Cell', 'Between columns', 16], ['h1Kind', 'Kind column width', 110],
        ['h1Who', 'Who column width', 150], ['h1Undo', 'Undo column width', 92]]],
];
const H1_ALL = H1_GROUPS.flatMap(([, rows]) => rows);
const H1_PRESETS = [
    ['Today', () => Object.fromEntries(H1_ALL.map(([k, , d]) => [k, d]))],
    ['Tighter', () => Object.fromEntries(H1_ALL.map(([k, , d]) => [k, /Rowh|Day|Kind|Who|Undo|Lab/.test(k) ? d : Math.max(0, Math.round(d * 0.7))]))],
    ['Airier', () => Object.fromEntries(H1_ALL.map(([k, , d]) => [k, /Kind|Who|Undo|Lab/.test(k) ? d : Math.round(d * 1.35)]))],
];
function h1Prompt(v) {
    const parts = H1_GROUPS.map(([g, rows]) => {
        const ch = rows.filter(([k, , d]) => v[k] !== d).map(([k, label, d]) => `${label} ${v[k]}px (was ${d}, --${k.replace(/^h1/, 'h1-').toLowerCase()})`);
        return ch.length ? `${g}: ${ch.join('; ')}.` : '';
    }).filter(Boolean);
    return parts.length ? `Set the History gate's spacing to these values. ${parts.join(' ')}` : 'Nothing changed yet: every value is H1\u2019s spacing today.';
}
function H1Row({ k, label, d }) {
    const v = useB3(k);
    return html`
        <label class=${'lab-r' + (v !== d ? ' on' : '')} key=${k}>
            <span class="lab-l">${label}</span>
            <input type="range" min="0" max=${Math.max(48, d * 2)} step="1" value=${v} onInput=${(e) => setB3(k, +e.target.value)} />
            <input type="number" min="0" max="400" value=${v} aria-label=${label} onInput=${(e) => setB3(k, Math.max(0, +e.target.value || 0))} />
            <button type="button" class="lab-x" title=${`Back to ${d}px`} aria-label=${`Reset ${label}`} disabled=${v === d} onClick=${() => setB3(k, d)}>${d}</button>
        </label>`;
}
export function H1Spacing() {
    const s = usePicks();
    const [note, setNote] = useState('');
    const read = () => Object.fromEntries(H1_ALL.map(([k]) => [k, b3(k)]));
    const save = async () => {
        const v = read();
        const ok = await write('spacing/h1', { values: v, prompt: h1Prompt(v) }, 'spacing:h1');
        setNote(ok ? 'Saved for Claude' : (s.db ? 'Save failed \u2014 use Copy' : 'Saving needs the board open on claude.ai'));
        setTimeout(() => setNote(''), 1800);
    };
    const copy = () => { try { navigator.clipboard.writeText(h1Prompt(read())); setNote('Copied'); } catch (e) { setNote('Copy failed'); } setTimeout(() => setNote(''), 1400); };
    return html`
        <div class="lab-c h1lab">
            <div class="lab-pre">
                ${H1_PRESETS.map(([n, f]) => html`<button type="button" class="b3-btn2 sm quiet" key=${n}
                    onClick=${() => Object.entries(f()).forEach(([k, val]) => setB3(k, val))}>${n}</button>`)}
                <button type="button" class="b3-btn2 sm" onClick=${copy}><${Icon} name="copy" />Copy</button>
                <button type="button" class="b3-btn2 sm go" onClick=${save}><${Icon} name="check" />Save for Claude</button>
                <span class="lab-n" role="status">${note}</span>
            </div>
            ${H1_GROUPS.map(([g, rows]) => html`
                <section class="lab-g" key=${g}>
                    <h4>${g}</h4>
                    ${rows.map(([k, label, d]) => html`<${H1Row} k=${k} label=${label} d=${d} key=${k} />`)}
                </section>`)}
        </div>`;
}

export function PickIndex({ gates }) {
    const s = usePicks();
    const title = (g) => (gates.find((x) => x.id === g) || {}).title || g;
    const done = FORKS.filter((f) => f.decided || s.picks[f.id]).length;
    return html`
        <section class="pidx">
            <div class="pidx-h">
                <h2>What I need from you</h2>
                <p>${done} of ${FORKS.length} picked${s.ready && !s.db ? ' · this copy can’t save picks, so tell me in the chat' : ''}</p>
            </div>
            <ul class="pidx-l">
                ${FORKS.map((f) => {
                    const rec = f.decided || s.picks[f.id];
                    return html`
                    <li key=${f.id} class=${rec ? 'on' : ''}>
                        <a href=${`#g-${f.gate}`}><span class="g">${(f.gate.split('-')[0] || '').slice(0, 3).toUpperCase()}</span>${title(f.gate)}<em>${f.title}</em></a>
                        <span class="v">${rec ? html`<${Icon} name="check" />${String(rec.label || (f.options.find((o) => o[0] === rec.choice) || [])[1] || rec.choice).split(' · ')[0]}` : 'open'}</span>
                    </li>`;
                })}
            </ul>
        </section>`;
}
