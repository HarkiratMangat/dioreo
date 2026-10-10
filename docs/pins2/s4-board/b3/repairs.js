// Board 3 version 2 — BOARD ONLY. P6: Repairs as a worklist inside the Repairs panel. One line per build to fix, worst first, a filter per problem, a row that opens to show the build, and the builds that pass in one block under it.
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';
import { Icon, Fold } from '../ui/icons.js';
import { useB3 } from './state.js';
import { faultsFor, faultLine, catLabel, twinOf, B3Badges, FAULT_SEVERITY, blocksOf, PASS_LINES, FaultHint } from './armory-parts.js';

/* global buildNumberOf */

// 16767834 (2026-09-17 23:19 EDT): the footer says how many checks the rest pass, in words.
const CHECK_WORDS = ['none', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
const CHECKS = [
    ['missing-image', 'Missing image', 'image-off'],
    ['few-attachments', '2 or fewer attachments', 'layers'],
    ['near-duplicate', 'Near-duplicate', 'copy'],
    ['no-code', 'No gunsmith code', 'code'],
    ['code-length-mismatch', 'Code disagrees', 'list-checks'],
];
const SLOT_ORDER = ['Optic', 'Muzzle', 'Barrel', 'Stock', 'Laser', 'Underbarrel', 'Rear Grip', 'Ammunition', 'Perk'];
const slotVar = (slot) => (slot ? `var(--sl-${String(slot).toLowerCase().replace(/\s+/g, '-')}, var(--sl-unknown))` : 'var(--sl-unknown)');
const ago = (iso) => {
    if (!iso) return 'never';
    const d = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (d < 1) return 'today';
    if (d < 30) return `${Math.round(d)} days ago`;
    const m = Math.round(d / 30.4);
    return m < 12 ? `${m} month${m === 1 ? '' : 's'} ago` : `${Math.round(m / 12)} year${m >= 18 ? 's' : ''} ago`;
};

// The age as Broadcast's "up 45d" chip says it (thread 846eb917): a number and a unit.
const agoShort = (iso) => {
    if (!iso) return 'never';
    const d = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (d < 1) return 'today';
    if (d < 30) return `${Math.round(d)}d`;
    const m = Math.round(d / 30.4);
    return m < 12 ? `${m}mo` : `${Math.round(m / 12)}y`;
};
// What passing each check MEANS, for the pass card (thread 96b7a5b1) — a fault's name under a tick read as the fault.
// A pass shows the thing present, so the missing-image check wears the image, not image-off.
// Derived from PASS_LINES in armory-parts.js, which the --ok card over a clean build's mark reads too.
const PASS_ICON = Object.fromEntries(PASS_LINES.map(([k, icon]) => [k, icon]));
const PASS_WORD = Object.fromEntries(PASS_LINES.map(([k, , word]) => [k, word]));

// The action a ticket offers is named for the fault it fixes; "Fix" alone made the reader open the drawer to find out.
const FIX_WORD = { 'no-code': 'Add the code', 'code-length-mismatch': 'Correct the code', 'few-attachments': 'Add attachments', 'near-duplicate': 'Compare the two', 'missing-image': 'Add an image' };
// V47 BF: the drawn evidence (slots, the code's pairs, the twin's code) became `FaultHint` (armory-parts.js), which the problem pop-up renders too.

export function repairsStatus(inMode, clean) {
    const n = clean ? 0 : inMode.filter((b) => faultsFor(b).length).length;
    return n ? { tone: 'warn', text: `${n} need work` } : { tone: 'ok', text: 'all pass' };
}

export function RepairsPanel({ inMode, builds, mode, onFix, onShowAged, onShowBuild }) {
    const day = useB3('p6day');
    const shape = useB3('p6');
    const lay = useB3('p6lay');
    const clean = day === 'clean';
    const [kind, setKind] = useState('all');
    const [open, setOpen] = useState(null);
    const faulty = clean ? [] : inMode.filter((b) => faultsFor(b).length)
        .map((b) => ({ b, n: buildNumberOf(builds, b).n, f: faultsFor(b) }))
        .sort((x, y) => blocksOf(y.b) - blocksOf(x.b) || y.f.length - x.f.length || x.b.weaponName.localeCompare(y.b.weaponName));
    const kinds = CHECKS.map(([k, label, icon]) => ({ k, label, icon, n: faulty.filter((x) => x.f.includes(k)).length })).filter((x) => x.n);
    const shown = kind === 'all' ? faulty : faulty.filter((x) => x.f.includes(kind));
    // BY WEAPON, his correction of 2026-09-16 12:39 EDT: "'worst first'/'by problem' are incorrect direction labels, it should be
    // 'by weapon', which is basically how the 'worst first' design heads toward." So the worst-first order survives
    // INSIDE a weapon and BETWEEN weapons, and the weapon is the thing you scan — the same grammar the manifest uses.
    const byWeapon = [];
    for (const x of shown) {
        const g = byWeapon.find((y) => y.name === x.b.weaponName);
        if (g) { g.list.push(x); g.problems += x.f.length; } else byWeapon.push({ name: x.b.weaponName, accent: x.b.accent, category: x.b.category, list: [x], problems: x.f.length });
    }
    byWeapon.forEach((g) => { g.blocks = g.list.reduce((a, x) => a + blocksOf(x.b), 0); });
    byWeapon.sort((x, y) => y.blocks - x.blocks || y.problems - x.problems || x.name.localeCompare(y.name));
    const aged = inMode.filter((b) => (b.coverage || []).includes('stale-90d')).length;
    const pass = inMode.length - faulty.length;
    // THE TICKETS' LAYOUT (thread 1f502de1). A row-major grid of unequal cards leaves a hole under every short one. Lanes put each
    // ticket in the shorter of two columns, weighed by its rows, so the columns pack and worst-first still reads downward.
    const tkWrap = (nodes) => {
        if (lay === 'lanes') {
            const L = [[], []], w = [0, 0];
            nodes.forEach((nd, i) => { const k = w[0] <= w[1] ? 0 : 1; L[k].push(nd); w[k] += 3 + shown[i].f.length; });
            return html`<div class="b3-tk-lanes"><div class="b3-tk-lane">${L[0]}</div><div class="b3-tk-lane">${L[1]}</div></div>`;
        }
        if (lay === 'sections') {
            const bl = [], th = [];
            nodes.forEach((nd, i) => (shown[i].f.some((k) => FAULT_SEVERITY[k] === 'blocks') ? bl : th).push(nd));
            // 2026-09-19 11:01 EDT: the section heads were micro grey caps — "skippable hint text". Each is a real heading now: the severity's icon in
            // its well, the words at reading size, and the count as a pill.
            const head = (sev, icon, word, n) => html`<h4 class="b3-tk-sh" data-sev=${sev}><i aria-hidden="true"><${Icon} name=${icon} /></i><b>${word}</b><em>${n} build${n === 1 ? '' : 's'}</em></h4>`;
            return html`${bl.length ? html`<section class="b3-tk-sec">${head('blocks', 'lock', 'Blocks sharing', bl.length)}<div class="b3-tk-list rows">${bl}</div></section>` : null}${th.length ? html`<section class="b3-tk-sec">${head('thin', 'triangle-alert', 'Below standard', th.length)}<div class="b3-tk-list rows">${th}</div></section>` : null}`;
        }
        return html`<div class="b3-tk-list rows">${nodes}</div>`;
    };
    // THE PASS CARD (thread 96b7a5b1): "its own card/tile in a green --ok accent matching the style of the above card/tiles, but make
    // it the full width". The ticket's own anatomy in the ok hue; the body says what passing MEANS, check by check.
    const passCard = html`
        <article class="b3-tk b3-tk-pass" data-sev="ok">
            <header class="b3-tk-h">
                <span class="b3-tk-id"><span class="b3-tk-shield" aria-hidden="true"><${Icon} name="shield-check" /></span><b>${faulty.length ? ((typeof window !== 'undefined' && window.B4_COLLECTIVE) ? 'The checks every one of them passes' : `${pass} build${pass === 1 ? '' : 's'} pass every check`) : `All ${inMode.length} builds pass every check`}</b></span>
            </header>
            <div class="b3-tk-cks">${CHECKS.map(([k, , icon]) => html`<span class="b3-tk-ck" key=${k}><span class="b3-tk-ic" data-sev="ok"><${Icon} name=${PASS_ICON[k] || icon} /></span><b>${PASS_WORD[k] || k}</b></span>`)}</div>
            ${aged ? html`<footer class="b3-tk-ft"><span class="pb-pill b3-tk-agec"><${Icon} name="clock" />${aged} with no edit in 90 days</span>
                <button type="button" class="b3-btn2 ghost sm" onClick=${onShowAged}><${Icon} name="arrow-up-right" /><span class="lbl">Show them</span></button></footer>` : null}
        </article>`;
    // 2026-10-04 02:24 EDT (Session 4, R1): the "Pass every check" heading and its card are one box, as each worklist section is. The heading sat in the
    // panel's 16px grid on its own and cancelled part of that gap with margin-bottom:-4px !important, and the card's own top margin was undone with !important too.
    const okHead = (typeof window !== 'undefined' && window.B4_COLLECTIVE) && faulty.length ? html`<h4 class="b3-tk-sh b3-tk-okh" data-sev="ok"><i aria-hidden="true"><${Icon} name="shield-check" /></i><b>Pass every check</b><em>${pass} build${pass === 1 ? '' : 's'}</em></h4>` : null;

    return html`
        <div class="b3-rp" id="b3-repairs">
            ${faulty.length ? html`
                <div class="b3-rp-h">
                    ${''/* The critique: this panel answered "is this bad?" six hundred pixels later, in the pass block
                         below the fold. Scale is the first question and it is one clause. And "worst first" now means
                         what it says — a build nobody can import outranks three cosmetic nits, which it did not
                         before, when the sort counted faults and an empty slot weighed the same as an unusable code. */}
                    <div class="b3-rp-t"><b>${faulty.length} of ${inMode.length} build${inMode.length === 1 ? '' : 's'} need${faulty.length === 1 ? 's' : ''} work</b></div>
                    <div class="b3-rp-f" role="group" aria-label="Show builds with">
                        <button type="button" class="b3-fc" aria-pressed=${kind === 'all' ? 'true' : 'false'} onClick=${() => setKind('all')}><span class="b3-nw">All<em>${faulty.length}</em></span></button>
                        ${kinds.map((x) => html`<button type="button" key=${x.k} class="b3-fc warn" aria-pressed=${kind === x.k ? 'true' : 'false'} onClick=${() => setKind(kind === x.k ? 'all' : x.k)}><${Icon} name=${x.icon} /><span class="b3-nw">${x.label}<em>${x.n}</em></span></button>`)}
                    </div>
                </div>
                ${shape === 'b' ? html`
                    <div class="b3-byp">
                        ${kinds.filter((k) => kind === 'all' || k.k === kind).map((k) => html`
                            <section class="b3-byp-g" key=${k.k}>
                                <header><i><${Icon} name=${k.icon} /></i><b>${k.label}</b><em>${k.n} build${k.n === 1 ? '' : 's'}</em></header>
                                <div class="b3-byp-l">
                                    ${faulty.filter((x) => x.f.includes(k.k)).map(({ b, n, f }) => {
                                        const l = faultLine(k.k, b, builds);
                                        return html`
                                        <article class="b3-byp-c" key=${b._id} style=${`--c:${b.accent || 'var(--ink3)'}`}>
                                            <b>${b.weaponName}<i>·</i>Build ${n}</b>
                                            <small>${catLabel(b.category)}${b.buildName && !/^build \d+$/i.test(b.buildName) ? html`<span>${b.buildName}</span>` : null}</small>
                                            <span class="b3-byp-v"><${Icon} name=${l.icon} />${l.text}${l.visual || null}</span>
                                            <span class="b3-byp-a">
                                                ${f.length > 1 ? html`<em>+${f.length - 1} more on this build</em>` : html`<span></span>`}
                                                <button type="button" class="b3-btn2 sm go" onClick=${() => onFix(b)}><${Icon} name="wrench" />Repair build</button>
                                            </span>
                                        </article>`;
                                    })}
                                </div>
                            </section>`)}
                    </div>` : null}
                ${shape === 'c' ? html`
                    ${''/* ── TICKETS (round 4w, 2026-09-18 11:14 EDT). His ask: "aggressive, drastic design improvements" to this panel. The table
                         made five pieces of work look like a spreadsheet — six columns, a fold to open before the reason was
                         readable, and one "Fix" that did not say what it fixes. A worklist this short is read one item at a time,
                         so each broken build is a ticket: the fault in plain words, what it costs, the evidence DRAWN (the slots,
                         the code's pairs against the attachments, the twin), and one action named for the fault. Blocking faults
                         are heavier and come first; the bar at the top is the whole armory, so five tickets read against 125. */}
                    <div class="b3-tk-bar" role="img" aria-label=${`${faulty.filter((x) => blocksOf(x.b)).length} builds block sharing, ${faulty.filter((x) => !blocksOf(x.b)).length} are below standard, ${pass} pass`}>
                        <i class="bl" style=${`flex:${faulty.filter((x) => blocksOf(x.b)).length}`}></i><i class="th" style=${`flex:${faulty.filter((x) => !blocksOf(x.b)).length}`}></i><i class="ok" style=${`flex:${pass}`}></i>
                    </div>
                    ${tkWrap(shown.map(({ b, n, f }) => {
                            const worst = f[0];
                            const blocks = f.some((k) => FAULT_SEVERITY[k] === 'blocks');
                            const twin = f.includes('near-duplicate') ? twinOf(b, builds) : null;
                            return html`
                            <article class="b3-tk" key=${b._id} data-sev=${blocks ? 'blocks' : 'thin'} style=${`--c:${b.accent || 'var(--ink3)'}`}>
                                <header class="b3-tk-h">
                                    <span class="b3-tk-id"><i aria-hidden="true"></i><b>${b.weaponName}</b><em>Build ${n}</em><small>${catLabel(b.category)}</small></span>
                                    <span class="b3-tk-sev">${blocks ? 'Blocks sharing' : 'Below standard'}</span>
                                </header>
                                <div class="b3-tk-fs">
                                    ${f.map((k) => { const l = faultLine(k, b, builds); return html`
                                        <div class="b3-tk-f" key=${k} data-k=${k}>
                                            <span class="b3-tk-ic" data-sev=${FAULT_SEVERITY[k] || 'thin'}><${Icon} name=${l.icon} /></span>
                                            <span class="b3-tk-t"><b>${l.text}</b><${FaultHint} k=${k} b=${b} builds=${builds} /></span>
                                        </div>`; })}
                                </div>
                                <footer class="b3-tk-ft">
                                    ${''/* 2026-09-19 11:01 EDT: "the 'show build' button which scrolls to it in the manifest is pretty useless. Just keep the green Fix button and make it a
                                         generic 'Repair build'" · "rephrase the 'touched 2mo' chip to 'Last edit: 2 months ago'". */}
                                    <span class="pb-pill b3-tk-agec"><${Icon} name="clock" />Last edit: ${ago(b.lastUpdated)}</span>
                                    <button type="button" class="b3-btn2 sm go" onClick=${() => onFix(b)}><${Icon} name="wrench" />Repair build</button>
                                </footer>
                            </article>`; }))}` : null}
                <div class="b3-work" role="table" aria-label="Builds that need work" hidden=${shape === 'b' || shape === 'c'}>
                    <div class="b3-wh" role="row"><span>Build</span><span>Problems</span><span>Last edit</span><span>On the card</span><span></span></div>
                    ${byWeapon.map((g) => html`
                        <div class="b3-wg" key=${g.name} style=${`--c:${g.accent || 'var(--ink3)'}`} role="rowgroup">
                            <div class="b3-wg-h" role="row">
                                <span class="b3-nw"><b>${g.name}</b><small>${catLabel(g.category)}</small></span>
                                <em>${g.list.length} build${g.list.length === 1 ? '' : 's'}</em>
                                <span class="b3-wg-p">${g.blocks ? html`<b>${g.blocks} unshareable</b>` : null}${g.problems} problem${g.problems === 1 ? '' : 's'}</span>
                            </div>
                    ${g.list.map(({ b, n, f }) => {
                        const isOpen = open === b._id;
                        const twin = f.includes('near-duplicate') ? twinOf(b, builds) : null;
                        return html`
                        <div class=${'b3-wr' + (isOpen ? ' open' : '')} key=${b._id} style=${`--c:${b.accent || 'var(--ink3)'}`} role="row">
                            <button type="button" class="b3-wr-main" aria-expanded=${isOpen ? 'true' : 'false'} onClick=${() => setOpen(isOpen ? null : b._id)}>
                                ${''/* ⛔ THE LEADING NUMERAL IS GONE — 2026-09-17 10:07 EDT. It rendered `2` in the first cell of a row
                                     that reads "Build 1" a hundred and fifty pixels later, under an EMPTY column head, so
                                     it was read as a build number before it was read as anything. It meant "2 problems",
                                     and the two problem chips sit right beside it already saying so. A count of a thing
                                     visible next to it is the same defect as the hint text he has rejected three times.
                                     Its 60px went to the Problems column, which is the reason the row exists. */}
                                <span class="b3-wr-b"><b>Build ${n}</b>${b.buildName && !/^build \d+$/i.test(b.buildName) ? html`<small><span>${b.buildName}</span></small>` : null}</span>
                                <span class="b3-wr-f">${f.map((k) => { const l = faultLine(k, b, builds); return html`<span class=${'b3-pchip ' + (FAULT_SEVERITY[k] || 'thin')} key=${k}><${Icon} name=${l.icon} />${l.short}</span>`; })}</span>
                                <span class="b3-wr-u">${ago(b.lastUpdated)}</span>
                                <span class="b3-wr-c">
                                    <span class=${'b3-img' + (b.imageKey ? '' : ' no')} title=${b.imageKey ? 'Image uploaded' : 'No image'}><${Icon} name=${b.imageKey ? 'image' : 'image-off'} /></span>
                                    ${b.shareCode ? html`<code>${b.shareCode}</code>` : html`<span class="none">no code</span>`}
                                </span>
                                ${''/* "wtf is wrong with this collapse/expand button?? also use the version from the
                                     manifest weapon rows, where it reveals the 'collapse/expand' text. Make it reveal
                                     that hover event when hovering over any part of the row." A glyph that has to be
                                     decoded is a glyph that failed, and the answer is not a better glyph — it is the
                                     word. The column reserves the expanded width, so the word arrives into air that
                                     was already there and nothing moves. Same control, same reveal, in the manifest. */}
                                <span class="b3-fold2" aria-hidden="true"><${Fold} open=${isOpen} /><b>${isOpen ? 'Collapse' : 'Expand'}</b></span>
                            </button>
                            <span class="b3-wr-a"><button type="button" class="b3-btn2 sm go" onClick=${() => onFix(b)}><${Icon} name="wrench" />Repair build</button></span>
                            ${isOpen ? html`
                                <div class="b3-wr-d">
                                    <div class="b3-wr-dl">
                                        <span class="lab">Why it needs work</span>
                                        ${f.map((k) => { const l = faultLine(k, b, builds); return html`<div class="b3-wr-why" key=${k}><i><${Icon} name=${l.icon} /></i><span><b>${l.text}</b>${k === 'near-duplicate' && twin ? html` — ${twin.weaponName} Build ${buildNumberOf(builds, twin).n}${twin.shareCode ? html`, <code>${twin.shareCode}</code>` : ''}` : null}${l.cost ? html`<em>${l.cost}</em>` : null}</span></div>`; })}
                                    </div>
                                    <div class="b3-wr-rail">
                                        <span class="lab">On the card</span>
                                        <div class="wg-rail">${(b.attachments || []).map((a, i) => { const s = (b.attachmentSlots || [])[i]; return html`<span class="wg-at" key=${i} data-slot=${s || null} style=${`--sl:${slotVar(s)}`}><span class="wg-an">${a}</span></span>`; })}${Array.from({ length: Math.max(0, 5 - (b.attachments || []).length) }, (_, i) => html`<span class="wg-at gap" key=${'g' + i}><span class="wg-an">Empty</span></span>`)}</div>
                                        <${B3Badges} b=${b} />
                                    </div>
                                </div>` : null}
                        </div>`; })}
                        </div>`)}
                </div>` : null}
            ${shape === 'c' ? null : okHead}
            ${shape === 'c' ? html`<section class=${'b3-tk-oks' + (okHead ? '' : ' bare')}>${okHead}${passCard}</section>` : html`<div class=${'b3-rp-pass' + (faulty.length ? '' : ' all')}>
                <span class="b3-rp-ok"><${Icon} name="shield-check" /></span>
                <div class="b3-rp-pt">
                    <b>${faulty.length ? `The other ${pass} build${pass === 1 ? '' : 's'} pass all ${CHECK_WORDS[CHECKS.length] || CHECKS.length} checks` : `All ${inMode.length} ${mode} builds pass every check`}</b>
                    ${''/* 🔴 IT WAS SAYING WHAT THE FILTER ROW ALREADY SAYS — 2026-09-17 19:11 EDT. Looking at the render
                         rather than the code: the panel's filter row at the top prints `2 or fewer attachments 1 ·
                         Near-duplicate 2 · No gunsmith code 1 · Code disagrees 2`, and this block reprinted the same
                         four counts nine hundred pixels lower, so four of its five chips were orange and the one
                         thing it exists to say — that these builds PASS — was a single grey tick nobody reads.
                         It carries the checks with ZERO hits now: the information no other part of this page has,
                         and the literal meaning of "pass every check". His standing rule about small text is the
                         same rule — a line that repeats what is already on screen is worth nothing on the second
                         visit, which is what he has called noise three times. */}
                    ${''/* ⚠️ THE CHIPS AND THE SENTENCE ABOVE THEM ARE ONE STATEMENT, and I changed the chips
                         without re-reading the sentence (2026-09-17 20:28 EDT). Under "the other 120 builds pass every
                         check" sat a bare row naming ONE check, which reads as "they pass one check" — the opposite.
                         The row says what it is now. */}
                    ${''/* A clean day only: every check, each passed. On a day with work the footer's sentence says it, and
                         the worklist's own filter row already names the checks. (An htm tag cannot open in one template and
                         close in another — the first cut of this did, and drew the chip inside a stray box. 2026-09-17 23:21 EDT) */}
                    ${faulty.length ? null : html`<span class="b3-rp-cl">Every check passed</span>
                    <div class="b3-rp-checks">${CHECKS.map(([k, label]) => html`<span class="b3-check" key=${k}><${Icon} name="check" /><span class="b3-nw">${label}</span></span>`)}</div>`}
                </div>
                ${aged ? html`<button type="button" class="b3-rp-age" onClick=${onShowAged}><${Icon} name="clock" /><b>${aged}</b> with no edit in 90 days<span>Show them</span></button>` : null}
            </div>`}
        </div>`;
}
