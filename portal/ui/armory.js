// portal/ui/armory.js — ESM. The Armory realm: Rack (by category) + Coverage (data-quality flags) + an Add form + inline edit + bulk actions + a LIVE PREVIEW panel, reusing <Shell>/<Manifest> unchanged (spec §8.2). No dates, so no Track.
//
// buildArmoryAddOp/buildArmoryEditOp/parseBadgesToken come from armory.logic.js, loaded as a plain CLASSIC <script> before this module -- see track.js's header comment for why that is the real working cross-runtime resolution here, and why a literal `import {...} from './armory.logic.js'` would fail in every real browser (found live in season.js's own prior version).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Fold, Icon } from './icons.js';
import { Shell, NoAccess, Masthead, useCreateKey } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { useAsync, RealmShell } from './async.js';
import { stageOps } from './composeClient.js';
import { renderV2 } from './v2Render.js';
import { useOverlay } from './overlay.js';
import { reportFailure } from './async.js';
import { downloadText } from './download.js';

const MODES = ['MP', 'DMZ'];
const CATEGORIES = ['AR', 'SMG', 'SNIPER', 'LMG', 'SHOTGUN', 'MARKSMAN', 'SECONDARIES', 'MELEE'];

// 🔴 THE MANIFEST NAMED EVERY BUILD AND SHOWED WHAT WAS IN NONE OF THEM. Weapon, build, category, mode and a comma-joined list of defect keys — so the one question you open a build list to answer, *what does this build actually run*, needed a click per row. The attachments peek and the badge chips are what the adopted table was styled for.
//
// ⚠️ THE PEEK SHOWS TWO AND COUNTS THE REST. Five attachment names is a paragraph in a table cell; two plus "+3" is the shape of the thing, and the editor is one click away for the rest. The mockup's filter chips use short labels and its own display order (armory.html's `renderCatChips`) — distinct from CATEGORY_LABEL above, which is precise on purpose for the edit form's dropdown. Only categories with at least one build in the current mode get a chip, matching the mockup's own comment: offering an empty category would advertise a result nothing can fill.
const CATEGORY_CHIP_LABEL = { AR: 'Assault', SMG: 'SMG', LMG: 'LMG', MARKSMAN: 'Marksman', SNIPER: 'Sniper', SHOTGUN: 'Shotgun', SECONDARIES: 'Secondaries' };
const CATEGORY_CHIP_ORDER = ['AR', 'SMG', 'LMG', 'MARKSMAN', 'SNIPER', 'SHOTGUN', 'SECONDARIES'];

const ARMORY_COLUMNS = [
    { key: 'weaponName', label: 'Weapon', editable: true,
      meta: (r) => `${r.mode} · ${(r.attachments || []).length} attachment${(r.attachments || []).length === 1 ? '' : 's'}` },
    // 🔴 CATEGORY BEFORE BUILD, which is armory.html's own order (Weapon · Category · Build · …). The portal had them the other way round, and the audit reported it as a SYMMETRIC pair — Category→Build and Build→Category — which §0.7c's own rule classifies as a pairing artifact. It was not one: a genuine column swap is exactly what a real reorder looks like to an LCS alignment. Caught only by opening the two captures and reading the header row. The rule needs the boundary: symmetry is evidence of an artifact ONLY when the two elements are interchangeable; two NAMED columns are not. 🔴 THIS COLUMN PRINTED THE STORED ENUM — "AR", "SNIPER", "SECONDARIES" — while a filter chip 200px above it read "Assault 35". One field, two vocabularies, one screen. armory.html prints the label. `editable` comes OFF with the fix and that is deliberate rather than a loss: a free-text cell over an enum could write "Assault" into a field whose only legal values are the keys, and display-vs-edit would have disagreed the moment the label rendered. Category is edited where it has always had a real control — the row editor's own <select>, one click away.
    { key: 'category', label: 'Category', col: 'c-type', render: (r) => CATEGORY_CHIP_LABEL[r.category] || r.category },
    { key: 'buildName', label: 'Build', editable: true },
    { key: 'shareCode', label: 'Gunsmith code', dataKind: 'code',
      render: (r) => (r.mode === 'DMZ'
          ? html`<span class="none">DMZ — no code</span>`
          : (r.shareCode ? html`<span class="code">${r.shareCode}</span>` : html`<span class="none">not set</span>`)) },
    { key: 'attachments', label: 'Attachments', col: 'c-spark', dataKind: 'detail', render: (r) => {
        const atts = r.attachments || [];
        if (!atts.length) return html`<div class="detcell"><span class="none">none</span></div>`;
        return html`
            <div class="detcell">
                <span class="attpeek">
                    ${atts.slice(0, 2).map((a, i) => html`<em key=${i}>${a}</em>`)}
                    ${atts.length > 2 ? html`<em class="more">+${atts.length - 2}</em>` : null}
                </span>
                <span class=${'thumb ' + (r.imageKey ? 'ok' : 'no')}>${r.imageKey ? 'image' : 'no image'}</span>
            </div>`;
    } },
    // ⚠️ THE DEFECT COUNT IS A CHIP WITH THE NAMES ON IT, not a comma-joined list of internal flag keys. `wrong-attachment-count, near-duplicate` is the shape of the data; "2 problems" with the names on hover is the shape of the question. Age is excluded here for the same reason the Rack excludes it — it is not a fault. `col: 'c-state'` is armory.html's own column width for this slot — the Manifest's fallback derives `c-detail` from `dataKind: 'right'`, which is why the portal emitted c-detail twice and the design's `col.c-state` matched nothing. A column class is the design's call, so the realm states it rather than letting a default guess.
    { key: 'coverage', label: 'Badges', dataKind: 'right', col: 'c-state', render: (r) => {
        const faults = (r.coverage || []).filter((f) => f !== 'stale-90d');
        const chips = [];
        if (r.isMeta) chips.push(html`<b class="bdg" key="m">META</b>`);
        if (r.categoryRank) chips.push(html`<b class="bdg rank" key="r">${String(r.categoryRank).toUpperCase()}</b>`);
        if (r.dmzRangeRank) chips.push(html`<b class="bdg dmz" key="d">${r.dmzRangeRank}</b>`);
        if (r.isToxic) chips.push(html`<b class="bdg toxic" key="t">TOXIC</b>`);
        if (faults.length) chips.push(html`<b class="bdg bad" key="f" data-tip=${`${faults.length} problem${faults.length === 1 ? '' : 's'}\n${faults.map((f) => COVERAGE_LABEL[f] || f).join(' · ')}`}>${faults.length}<${Icon} name="triangle-alert" cls="sm" /></b>`);
        return chips.length ? html`<span class="tiers">${chips}</span>` : html`<span class="none">—</span>`;
    } },
];

// 🔴 THE MODE CHIP WAS A DEAD END, and --triggers is what surfaced it: the portal offered `MP ×2`, `DMZ ×2` and `All ×2` where the design offers one of each, because the Manifest carried a Mode filter ON TOP OF the masthead's mode switch. The rows handed to the Manifest are already `inMode`, so picking the OTHER mode in that chip could only ever produce an empty table — a control whose every non-default value is guaranteed to show nothing. The mode switch above owns this question; the chipset now carries only Category, which is what armory.html's chip row is.
const ARMORY_FILTERS = [];

const COVERAGE_LABEL = {
    'missing-image': 'Missing image', 'no-badges': 'No badges', 'wrong-attachment-count': 'Wrong attachment count',
    'stale-90d': 'Not updated in 90 days', 'near-duplicate': 'Near-duplicate code',
};

// Rack -- what exists, by category, in the bot's REAL per-category accent (spec §8.2). It shipped as one row of uniform grey chips: a count per category and nothing else. 04-armory-and-commit.html specs a card per WEAPON under a per-category section divider, each card carrying its build count, a dupe warning where one applies, and a dashed placeholder where the image is missing -- so the panel answers "what is in the armory" at a glance instead of "how many categories are there".
//
// `accent` is real DATA (portal/api/armory.js stamps it from getMpCategoryAccent), not a CSS token. That is the correct mechanism and deliberately unlike Season's --topic-accent tokens: the bot owns these hues, so reading them from the payload means the two can never drift apart. 🔴 THE RACK IS ORGANISED BY RANK TIER, NOT BY CATEGORY — rebuilt 2026-08-26 onto the adopted design. The previous version grouped by category, which answers "what is in the armory"; the rack in the approved mockup answers "what is ranked where", which is the question the badges exist for and the only one a rack can answer that the Manifest below cannot. Category has not been lost — it is the accent every card carries, so the two facts occupy colour and position rather than competing for the same structure.
const RANK_ORDER = ['best', 'top3', 'top4', 'top5', null];
const RANK_LABEL = { best: 'Best in category', top3: 'Top 3', top4: 'Top 4', top5: 'Top 5', null: 'Unranked' };
// 🔴 THESE STRINGS ARE CSS CLASS NAMES, AND FOUR OF THE FIVE USED TO NAME NOTHING. app.css's Armory block (`.trow.t-best/.t-top3/.t-top4/.t-top5/.t-unranked`) is the one thing that makes the board read as tiered — graded 20/17/15/14/13px marks and a `--bc-dim` that fades the lower tiers' cards. This map emitted `t-t3`, `t-t4`, `t-t5` and `t-none`, so only the Best row ever matched: every other tier rendered at the fallback 19px with `--bc-dim` unset, and `t-none` additionally collided with an unrelated `.t-none` rule 1,800 lines away. Same defect class as the missing `id="mhAdd"`: live CSS, dead selector, nothing reports it.
const RANK_KEY = { best: 'best', top3: 'top3', top4: 'top4', top5: 'top5', null: 'unranked' };
const TCLOSED_KEY = 'dioreo-armory-tclosed';

// A DMZ build ranks on dmzRangeRank, which also encodes a combat range (`best-close`, `best-midlong`) — the tier is the part before the hyphen. An MP build ranks on categoryRank. Reading the wrong field is how DMZ builds all pile into Unranked while looking correct.
function rankOf(b) {
    const raw = b.mode === 'DMZ' ? b.dmzRangeRank : b.categoryRank;
    if (!raw) return null;
    return String(raw).split('-')[0];
}

// The Unranked tier carries almost half the catalogue, so it starts collapsed — matching the mockup's default.
function loadTClosed() { try { return new Set(JSON.parse(sessionStorage.getItem(TCLOSED_KEY)) || ['null']); } catch { return new Set(['null']); } }
function saveTClosed(set) { try { sessionStorage.setItem(TCLOSED_KEY, JSON.stringify([...set])); } catch (e) {} }

// 🔴 AGE IS NOT A DEFECT. Counting staleness among the faults put a red mark on nearly every card — the mockup measured 33 of 36 siblings — so the badge stopped meaning anything. Faults get the red count; age gets a quiet dot, because it is a different fact and reads as one.
export function splitCoverage(b) {
    const all = b.coverage || [];
    return { faults: all.filter((f) => f !== 'stale-90d'), aged: all.includes('stale-90d') };
}

// ⚠️ BOTH NOTES READ FROM THE SAME DERIVATION THE MASTHEAD DOES, so a panel and the figures above it cannot disagree -- the failure this realm has already had twice. Each says what its own view is for and nothing the masthead has already said.
function RackNote({ builds }) {
    const ranked = builds.filter((b) => b.categoryRank || b.dmzRangeRank).length;
    return html`<span class="rt">${ranked} of ${builds.length} ranked</span>`;
}

function RepairNote({ builds }) {
    const split = builds.map(splitCoverage);
    const faults = split.filter((c) => c.faults.length).length;
    const aged = split.filter((c) => c.aged).length;
    if (!faults && !aged) return html`<span class="rt">nothing to repair</span>`;
    return html`<span class="rt">${faults} need repair${aged ? ` · ${aged} merely old` : ''}</span>`;
}

function BuildChip({ b, onPick }) {
    const { faults, aged } = splitCoverage(b);
    return html`
        <article class="bchip" data-id=${b._id || b.id} tabindex="0" role="button"
                 style=${`--c:${b.accent || 'var(--ink3)'}`}
                 onClick=${() => onPick(b.weaponName)}
                 aria-label=${`${b.weaponName} ${b.buildName}, ${RANK_LABEL[String(rankOf(b))]}`}>
            <span class="bc-top"><span class="bc-w">${b.weaponName}</span>
                ${b.isMeta ? html`<span class="bc-meta" title="Meta">META</span>` : null}</span>
            <span class="bc-b">${b.buildName}</span>
            <span class="bc-foot">
                <span class="modetag">${b.mode}</span>
                ${b.dmzRangeRank ? html`<span class="bc-dmz">${b.dmzRangeRank}</span>` : null}
                ${b.isToxic ? html`<span class="bc-tox" title="Toxic"><${Icon} name="skull" cls="sm" label="toxic" /></span>` : null}
                <span class="bc-att" data-tip=${`${(b.attachments || []).length} attachments`}>${(b.attachments || []).length}×</span>
                ${faults.length ? html`<span class="bc-bad" data-tip=${faults.map((f) => COVERAGE_LABEL[f] || f).join(' · ')}>${faults.length}</span>` : null}
                ${aged ? html`<span class="bc-age" data-tip="Not updated in 90 days" aria-label="stale">·</span>` : null}
            </span>
        </article>`;
}

// 🔴 ONE CARD SHAPE, ALWAYS — a weapon with one build is a group of one. Returning a bare chip for singles and a group for multiples put two visual languages side by side for the same kind of object, which Harkirat read as a rendering bug rather than a distinction. And siblings genuinely ARE a group: six pairs of adjacent cards differed only by a stored buildName that is an index ("Build 1", "Build 2"), so the rack was asking a reader to spot a one-character difference between two identical rectangles.
function WeaponGroup({ weapon, group, onPick }) {
    return html`
        <div class="bgrp" style=${`--c:${group[0].accent || 'var(--ink3)'}`}>
            <div class="bgrp-h">
                <span class="bgrp-w"><i aria-hidden="true"></i><b>${weapon}</b></span>
                <span class="bgrp-m">
                    ${group.some((b) => b.isMeta) ? html`<span class="bc-meta">META</span>` : null}
                    <span class="bgrp-n">${group.length} build${group.length > 1 ? 's' : ''}</span>
                </span>
            </div>
            ${group.map((b) => html`<${BuildChip} key=${b._id || b.id} b=${b} onPick=${onPick} />`)}
        </div>`;
}

// 🔴 THE VIEW PANELS USED TO CARRY THEIR OWN `.ph`, so the page drew TWO view headers where every design draws one: the Shell's bar (mode · views · legend) and then a second strip repeating the view's name and its count. The design puts that count in the Shell bar's own right-aligned `.sp` meta line (armory.html's `#viewMeta`), and the Shell has had a `meta` prop for it since Broadcast needed one — Armory simply never passed it. RackNote/RepairNote survive as the derivations behind that line, which is the point of them: the panel and the masthead cannot disagree.
function Rack({ builds, onPick }) {
    const [tclosed, setTClosed] = useState(loadTClosed);
    const toggle = (k) => setTClosed((prev) => {
        const next = new Set(prev);
        next.has(k) ? next.delete(k) : next.add(k);
        saveTClosed(next);
        return next;
    });

    return html`
        <!-- 🔴 NO .panel HERE. Shell already draws section.panel around the view slot, so a view that opened its own
             was a panel inside a panel: measured .rack at 1114px starting at x=122, against the design's 1160 at x=99,
             because the outer panel's 23px of padding applied twice. The design has ONE panel per view, holding the
             header bar and the board together. -->
        <div id="rack">
            ${builds.length === 0 ? html`<p class="empty">No builds in this catalogue yet.</p>` : null}
            <div class="rack">
                ${RANK_ORDER.map((r) => {
                    const key = String(r);
                    const list = builds.filter((b) => rankOf(b) === r);
                    const closed = tclosed.has(key);
                    const byWeapon = new Map();
                    for (const b of list) { if (!byWeapon.has(b.weaponName)) byWeapon.set(b.weaponName, []); byWeapon.get(b.weaponName).push(b); }
                    return html`
                        <div key=${key} class=${`trow t-${RANK_KEY[key]}${closed ? ' tclosed' : ''}`} data-tier=${key}>
                            <div class="trow-h" role="button" tabindex="0" aria-expanded=${!closed}
                                 onClick=${() => toggle(key)}
                                 onKeyDown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(key); } }}
                                 aria-label=${`${RANK_LABEL[key]}, ${byWeapon.size} weapon group${byWeapon.size === 1 ? '' : 's'} — click to collapse`}>
                                <!-- 🔴 "T3" AND "Top 3" ARE THE SAME FACT. The header used to render a token, a
                                     count and a label as three lines, so every tier restated itself, and the
                                     shapes differed row to row — five headers reading as three designs. One
                                     shape: mark, label, count, and a note ONLY where there is something to add.
                                     The mark is a star for best and an em dash for unranked, the two rows whose
                                     meaning is not already in their label. -->
                                <span class="trow-k" aria-hidden="true">${r === null ? '—' : r === 'best' ? html`<${Icon} name="star" cls="sm" />` : ''}</span>
                                <!-- The separating spaces are LOAD-BEARING, not formatting: without them the row's accessible
                                     name fuses to "Best in category18one weapon per category", which is what a screen reader
                                     reads out and what --triggers reports. The design's markup has whitespace between these
                                     spans because it is HTML; a JSX-ish template drops it unless it is asked for. -->
                                <span class="trow-t">${RANK_LABEL[key]}</span> <span class="trow-n">${list.length}</span> ${r === 'best' ? html`<span class="trow-note">one <b>weapon</b> per category</span>`
                                    : r === null ? html`<span class="trow-note">no rank set; these render with no tier badge</span>` : null}
                                <${Fold} open=${!closed} cls="sm trow-i" />
                            </div>
                            <div class="trow-body">
                                ${list.length
                                    ? [...byWeapon.entries()].map(([w, g]) => html`<${WeaponGroup} key=${w} weapon=${w} group=${g} onPick=${onPick} />`)
                                    : html`<div class="trow-empty">Nothing at ${RANK_LABEL[key]}.</div>`}
                            </div>
                        </div>`;
                })}
            </div>
            <p class="racknote">A badge describes the <b>weapon</b>, not one build of it — the bot propagates it across every build sharing a <code>weaponKey</code> value and mode, so a weapon with five builds contributes five cards to its tier. Rank is <b>per category</b>: “Best” means best AR, best SMG, and so on, rendered as <code>BEST ASSAULT</code> on the card. The vocabulary is the schema's own — <code>best</code> then <code>top3</code> then <code>top4</code> then <code>top5</code> — and <code>parseLoadoutBadges()</code> in <code>adminParser.js</code> validates it. <b>DMZ builds never use it</b> — they carry <code>dmzRangeRank</code> instead, which also encodes a combat range such as <code>best-close</code> or <code>best-midlong</code> as well.</p>
        </div>
    `;
}

// Coverage — one card per defect, which is the adopted design's own answer and not the one that shipped here.
//
// 🔴 THE MATRIX HAD NO STYLING AT ALL. `.covwrap`, `.cov` as a table, `.covcell` and `.covnote` were defined in a portal-authored stylesheet that adopting app.css deleted, so a category-by-defect grid rendered as a bare HTML table. The adopted sheet defines `.cov` as a CARD GRID with a meter per defect — a different component wearing a name the old markup also used, which is why nothing reported it.
//
// ⚠️ WHAT THE CARDS GIVE UP, AND WHY IT IS THE RIGHT TRADE. The matrix answered "SMG has 4 missing images"; the cards answer "how many builds have each defect, and how much of the catalogue is that". The second is the question you open Coverage WITH, and the first is one click away — every card is still a filter, and the Rack above already narrows by weapon. A meter is also the one thing the matrix could not draw: 106 stale builds out of 133 is a proportion, and a cell containing "106" does not say that.
//
// 🔴 AGE IS NOT A DEFECT, and the meter says so in a third colour rather than a second. `.cmeter.age` is the adopted sheet's own class for exactly this — the mockup's note records a bar meaning "85% of the collection is affected" painting in the success colour because a sibling selector never matched. The class is written by the card, opting IN, so it cannot silently stop applying.
const COVERAGE_WHY = {
    'missing-image': 'The card renders with a dashed placeholder where the loadout image goes.',
    'no-badges': 'Nothing marks where this build ranks, so it sorts below every ranked sibling.',
    'wrong-attachment-count': 'Discord shows five attachment slots; this build fills a different number.',
    'stale-90d': 'Still served, still correct as far as anything here knows — just not looked at in a while.',
    'near-duplicate': 'Two builds share a gunsmith code, so one of them is showing the other one’s guns.',
};

function Coverage({ builds, active, onFilter }) {
    const flags = Object.keys(COVERAGE_LABEL);
    const total = Math.max(1, builds.length);
    const hitsFor = (f) => builds.filter((b) => (b.coverage || []).includes(f));
    return html`
        <div id="coverage">
            <!-- 🔴 THE CARDS GO INSIDE .cols, NOT DIRECTLY INSIDE .cov, and the adopted sheet says so in its
                 own comment: .cov is declared TWICE in that file — a grid first, then display:block eight
                 hundred lines later — so the later one wins and .cov is the BLOCK, .cov .cols is the grid.
                 Emitting the cards straight into .cov gave five buttons at five different content widths
                 under a rule that reads like a grid and no longer is. Second duplicate declaration found in
                 this stylesheet today; assume there are more. -->
            <!-- 🔴 FIVE COUNTS AND NO TOTAL. The cards answer "how many builds have THIS problem"; nobody could read off the only number that decides whether to act — how many builds have any fault at all, with age excluded because age is not a fault and the card beside it says so. -->
            ${(() => {
                const faulted = builds.filter((b) => (b.coverage || []).some((f) => f !== 'stale-90d')).length;
                const stale = hitsFor('stale-90d').length;
                return html`
                    <div class="repbar">
                        <b>${faulted}</b>
                        <!-- The space before the pronoun is INSIDE the string on purpose: htm collapses a whitespace run containing a newline to nothing at an expression boundary, so breaking this line after "with" rendered "withthem". -->
                        <span>${faulted === 1 ? 'build has' : 'builds have'} something actually wrong with ${faulted === 1 ? 'it' : 'them'}${stale ? html`, and ${stale} more ${stale === 1 ? 'is' : 'are'} merely old` : ''}.</span>
                    </div>`;
            })()}
            <!-- ⚠️ THE COUNTS ARE PER BUILD AND THE FIX IS PER WEAPON, which is the single most confusing
                 thing about this panel: clearing "No badges" on one build clears it on every build of that
                 weapon, so a count of 57 can drop by nine from one edit. -->
            <div class="callout">
                <b>Badges are per weapon, not per build.</b> A weapon with five builds contributes five rows to
                these counts, and fixing one fixes all five — so a number here can fall by more than one.
            </div>
            <div class="cov"><div class="cols">
                ${flags.map((f) => {
                    const hits = hitsFor(f);
                    const age = f === 'stale-90d';
                    const on = active && active.flag === f;
                    return html`
                        <button key=${f} class=${'ccard' + (hits.length ? '' : ' clean')} aria-pressed=${on ? 'true' : 'false'}
                                onClick=${() => onFilter(on ? null : { flag: f })}>
                            <span class=${'cn' + (hits.length ? (age ? '' : ' bad') : ' ok')}>${hits.length}</span>
                            <span class="cname">${COVERAGE_LABEL[f]}${age ? html` <i class="mechtag">age, not a fault</i>` : null}</span>
                            <span class=${'cmeter' + (hits.length ? (age ? ' age' : ' bad') : ' clean')}>
                                <i style=${`width:${hits.length ? Math.max(1.5, (hits.length / total) * 100) : 0}%`}></i>
                            </span>
                            <span class="why">${COVERAGE_WHY[f] || ''}</span>
                        </button>`;
                })}
            </div></div>
            <div class="covfacts">
                <h5>True of the collection, not of any one build</h5>
                ${[...new Set(builds.map((b) => b.category))].sort().map((cat) => {
                    const inCat = builds.filter((b) => b.category === cat);
                    const bad = inCat.filter((b) => (b.coverage || []).some((f) => f !== 'stale-90d'));
                    return html`
                        <div class="covfact" key=${cat}>
                            <b>${bad.length} of ${inCat.length}</b>
                            <span>${cat} — ${bad.length ? 'have something wrong that is not age' : 'are clean'}</span>
                        </div>`;
                })}
            </div>
        </div>
    `;
}

// ── THE ADD FORM ──────────────────────────────────────────────────────────────────────────────
//
// 🔴 TWO FORMS IN ONE REALM SPOKE TWO DIFFERENT LANGUAGES. The build editor is built from the adopted sheet's own `bed-sec`/`dwfield` sections; this one was a row of bare inputs with `display:flex;gap:8px` written into the JSX, which is what the whole migration exists to remove. It is the mockup's `bform` now — sectioned, with each field saying what the value MEANS rather than only what it is called.
//
// 🔴 AND IT COLLECTED NEITHER A GUNSMITH CODE NOR A DESCRIPTION, which put the portal BEHIND Discord on a field Discord had to smuggle through a pipe-delimited convention because its modals cap at five inputs. A web form has no such cap; the omission was inherited, not required. (`docs/db-deferred-list.md`, filed 2026-08-22.)
//
// ⚠️ THE SHARE CODE FIELD NEVER BLOCKS. `correctGunsmithCode` CORRECTS a code rather than validating one — it maps look-alike characters onto whichever type each position expects — so a client-side "is this valid" test would refuse input the server would have happily fixed. The hint states the shape and says the correction happens; it does not gate the button.
const CATEGORY_LABEL = {
    AR: 'Assault Rifle', SMG: 'Submachine Gun', SNIPER: 'Sniper', LMG: 'Light Machine Gun',
    SHOTGUN: 'Shotgun', MARKSMAN: 'Marksman', SECONDARIES: 'Secondary', MELEE: 'Melee',
};


// ⚠️ FIVE ROWS BECAUSE FIVE IS WHAT THE DATA HAS, not because five is a rule. 123 of 133 real builds carry exactly five attachments, and coverageFlags treats anything else as a defect for MP — but the field is free text with no slot typing, because `attachmentSlots` is empty on every stored document and only /autobuild's vision pass has ever written one.
const ATT_HINTS = ['Muzzle — e.g. Monolithic Suppressor', 'Barrel — e.g. MIP Light Barrel (Short)',
    'Stock — e.g. No Stock', 'Ammunition — e.g. 48 Round Extended Mag', 'Rear grip — e.g. Granulated Grip Tape'];

function AddBuildForm({ onSubmit, onCancel, mode = 'MP' }) {
    // The form opens in the armory you are standing in. It keeps its own switch because this one sets a PROPERTY OF THE RECORD -- which armory the build is filed under -- rather than which armory you are looking at, and those are different acts that happen to use the same two words.
    const [f, setF] = useState({
        weaponName: '', category: 'AR', mode, buildName: '', imageKey: '',
        shareCode: '', description: '', isMeta: false, isToxic: false, rank: '',
    });
    const [atts, setAtts] = useState(['', '', '', '', '']);
    const set = (patch) => setF((prev) => ({ ...prev, ...patch }));
    const dmz = f.mode === 'DMZ';
    const filled = atts.map((a) => a.trim()).filter(Boolean);
    const ready = f.weaponName.trim() && f.category.trim();
    const code = f.shareCode.trim();
    const img = f.imageKey.trim();

    function submit() {
        onSubmit(buildArmoryAddOp({
            ...f, attachments: filled,
            categoryRank: dmz ? null : (f.rank || null),
            dmzRangeRank: dmz ? (f.rank || null) : null,
        }));
    }

    return html`
        <div class="panel bform" style="margin-bottom:14px">
            <div class="ph"><span class="t">New build</span><span class="rt">staged, never written — Review is the only screen that commits</span></div>
            <div style="padding:14px 16px 16px">
                <p class="bf-legend"><span class="req">*</span> required — everything else can be filled in now or later.</p>

                <section class="bf-sec">
                    <h4 class="bf-h">Identity</h4>
                    <div class="modesw" role="group" aria-label="Which armory this build belongs to">
                        ${MODES.map((m) => html`
                            <button key=${m} data-arm=${m} aria-pressed=${f.mode === m ? 'true' : 'false'}
                                    onClick=${() => set({ mode: m, rank: '' })}>${m}</button>`)}
                    </div>
                    <div class="bed-g2" style="margin-top:11px">
                        <label class="dwfield"><span>Weapon name <span class="req">*</span></span>
                            <input value=${f.weaponName} placeholder="AK117" autocomplete="off"
                                   onInput=${(e) => set({ weaponName: e.target.value })} />
                            <i class="bf-hint">As it should read on the card. <code>weaponKey</code> is derived from it —${' '}
                                lowercased, spaces stripped${f.weaponName.trim() ? html` → <code>${f.weaponName.toLowerCase().replace(/\s+/g, '')}</code>` : ''}.</i></label>
                        <label class="dwfield"><span>Build name</span>
                            <input value=${f.buildName} placeholder="Aggressive Flex" autocomplete="off"
                                   onInput=${(e) => set({ buildName: e.target.value })} />
                            <i class="bf-hint">A human variant label, not a code. Defaults to <b>Standard Build</b>.</i></label>
                    </div>
                    <label class="dwfield"><span>Category <span class="req">*</span></span>
                        <select value=${f.category} onChange=${(e) => set({ category: e.target.value })}>
                            ${CATEGORIES.map((c) => html`<option value=${c} key=${c}>${c} — ${CATEGORY_LABEL[c] || c}</option>`)}
                        </select>
                        <i class="bf-hint">Mode is <b>${f.mode}</b> and is chosen above, exactly as it is decided by which page you opened in the bot.</i></label>
                </section>

                <section class="bf-sec">
                    <h4 class="bf-h">Attachments <span class="bf-n">${filled.length} of 5</span></h4>
                    <p class="bf-p">In Gunsmith order, top to bottom. <b>123 of 133</b> real builds carry exactly five,
                        and ${dmz ? 'a DMZ build is counted against nine' : 'a different count is flagged on the Coverage view'}.</p>
                    <div class="atlist">
                        ${atts.map((a, i) => html`
                            <div class="atr" key=${i}>
                                <span class="atn">${i + 1}</span>
                                <label class="sr" for=${`ab-att-${i}`}>Attachment ${i + 1}</label>
                                <input class="ati" id=${`ab-att-${i}`} value=${a} placeholder=${ATT_HINTS[i] || 'Attachment'}
                                       onInput=${(e) => setAtts(atts.map((v, n) => (n === i ? e.target.value : v)))} />
                                <button class="atx" aria-label=${`Clear attachment ${i + 1}`} tabIndex=${-1}
                                        onClick=${() => setAtts(atts.map((v, n) => (n === i ? '' : v)))}>✕</button>
                            </div>`)}
                    </div>
                </section>

                <section class="bf-sec">
                    <h4 class="bf-h">Gunsmith code</h4>
                    ${dmz ? html`
                        <p class="bf-p bf-na"><b>DMZ builds have no share code.</b> That screen does not generate one, so
                            the field is absent rather than shown and ignored.</p>`
                    : html`
                        <label class="dwfield"><span>Share code</span>
                            <input value=${f.shareCode} placeholder="1C2B4A8B9A" autocomplete="off" spellcheck="false" maxLength="12"
                                   onInput=${(e) => set({ shareCode: e.target.value })} />
                            <i class="bf-hint">Ten characters, a digit and a letter alternating. Look-alike characters are
                                corrected on save rather than refused${code && code.length !== 10 ? html`, but ${code.length} characters is not ten` : ''}.
                                Leave it blank if you do not have one — a blank field sends no value at all.</i></label>`}
                </section>

                <section class="bf-sec">
                    <h4 class="bf-h">Image</h4>
                    <label class="dwfield"><span>Cloudinary key, or a full URL</span>
                        <input value=${f.imageKey} placeholder="AK117-1" autocomplete="off" spellcheck="false"
                               onInput=${(e) => set({ imageKey: e.target.value })} />
                        <i class="bf-hint">${!img
                            ? html`Convention is <code>WEAPON-N</code> — all caps, spaces to hyphens, N being this build's position among its siblings.`
                            : (/^https?:\/\//i.test(img)
                                ? html`Read as a <b>full URL</b>, stored as-is — and it will not survive a bulk-export round trip, because only a real key is emitted there.`
                                : html`Read as a <b>Cloudinary key</b>, delivered with <code>f_auto,q_auto</code> baked in.`)}</i></label>
                </section>

                <section class="bf-sec">
                    <h4 class="bf-h">Badges</h4>
                    <p class="bf-p">🔴 <b>Badges describe the WEAPON, not this one build.</b> On an EDIT the bot propagates
                        them across every build sharing this <code>weaponKey</code> and mode. It deliberately does not do
                        that on an add — a blank badges field is the common case, and propagating it would wipe the
                        siblings you were not touching.</p>
                    <div class="bf-badges">
                        <label class="bf-tog"><input type="checkbox" checked=${f.isMeta} onChange=${(e) => set({ isMeta: e.target.checked })} /><span>Meta</span></label>
                        <label class="bf-tog"><input type="checkbox" checked=${f.isToxic} onChange=${(e) => set({ isToxic: e.target.checked })} /><span>Toxic</span></label>
                        <label class="dwfield bf-rank"><span>${dmz ? 'DMZ range rank' : 'Category rank'}</span>
                            <select value=${f.rank} onChange=${(e) => set({ rank: e.target.value })}>
                                <option value="">${dmz ? 'None' : 'Unranked'}</option>
                                ${(dmz ? DMZ_RANGE_TOKENS : MP_RANK_TOKENS).map((t) => html`
                                    <option value=${t} key=${t}>${dmz ? t.replace('-', ' · ') : (RANK_LABEL[t] || t)}</option>`)}
                            </select></label>
                    </div>
                </section>

                <section class="bf-sec">
                    <h4 class="bf-h">Description</h4>
                    <label class="dwfield"><span>Usage blurb</span>
                        <textarea rows="2" value=${f.description} placeholder="When to reach for this build."
                                  onInput=${(e) => set({ description: e.target.value })}></textarea>
                        <i class="bf-hint">Rendered as a blockquote above the attachments. <b>2 of 133</b> builds carry one.</i></label>
                </section>

                <div class="attfoot">
                    <!-- A disabled control that does not say why is the same defect as a check that cannot fail: the reader learns nothing from it. -->
                    <button class="pill lead" disabled=${!ready} onClick=${submit}>
                        ${ready ? `Stage this ${f.mode} build` : 'A weapon name is required'}</button>
                    <button class="pill" onClick=${onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    `;
}

// Bulk "Set badges…" -- a small inline panel, not a native prompt() (this session already removed prompt() from Access's Revoke for the same UX reason). Applies the same badges grammar to every selected build via one loadout.edit op each, in one changeset.
function BulkBadgesPanel({ ids, onApply, onCancel }) {
    const [badges, setBadges] = useState('');
    return html`
        <div style="display:flex;gap:8px;align-items:center;padding:10px 14px;border-top:1px dashed var(--rule)">
            <label class="sr" for="bulk-badges">Badges to apply to ${ids.length} selected build(s)</label>
            <input id="bulk-badges" placeholder=${`Badges for ${ids.length} build(s) (e.g. meta, top3)`} value=${badges} onInput=${(e) => setBadges(e.target.value)} style="flex:1" />
            <button class="accent-fill" onClick=${() => onApply(badges)}>Apply</button>
            <button onClick=${onCancel}>Cancel</button>
        </div>
    `;
}

// The Armory compose UI's LIVE PREVIEW panel -- calls the already-built GET /api/armory/preview, which itself calls the bot's own buildLoadoutCard(), so this renders exactly what Discord will show rather than a second hand-built approximation that could drift from the real one.
function LivePreview({ buildId }) {
    const [card, setCard] = useState(null);
    useEffect(() => {
        if (!buildId) { setCard(null); return; }
        fetchJson(`/api/armory/preview?id=${buildId}`).then((d) => setCard(d.card || null));
    }, [buildId]);
    return html`
        <div class="panel" id="armory-preview">
            <div class="ph"><span class="t">Live preview</span></div>
            <div style="padding:12px 14px">
                ${!buildId ? html`<p style="color:var(--ink3)">Click a row to preview its Discord card.</p>`
                    : (card ? renderV2(card.components) : html`<p style="color:var(--ink3)">Loading…</p>`)}
            </div>
        </div>
    `;
}

// ── THE BUILD EDITOR ──────────────────────────────────────────────────────────────────────────
//
// 🔴 EDITING A BUILD MEANT CLICKING ONE TABLE CELL AT A TIME, and every cell was its own staged change. Five attachments, a badge and an image key is seven separate edits through the Manifest — seven changesets, seven rows on the Review screen, for one act. This is the surface /manage's modal has always had and the portal did not: the whole record at once, staged as ONE operation.
//
// ⚠️ THE PREVIEW LIVES INSIDE IT, which retires the separate LIVE PREVIEW panel. That panel showed the card for whichever row you last clicked, beside a table you were not editing — the preview and the thing it previews are now the same screen, which is what the adopted design does with `.bed-side`.
//
// ⚠️ NOTHING HERE WRITES. Every field edits a local draft and Save stages one `loadout.edit`; the Review screen is still the only surface that commits.

// 🔴 THE FAULTS WERE A NUMBER IN A TABLE CELL AND A TOOLTIP. Coverage counts them across the catalogue and the Manifest shows a badge with the names on hover — so the one screen where you could actually FIX a fault was the one screen that did not say what it was. The clean case is stated rather than left blank: an editor that says nothing about faults is indistinguishable from one that has not checked.
function BuildIssues({ build }) {
    const faults = (build.coverage || []).filter((f) => f !== 'stale-90d');
    if (!faults.length) {
        return html`
            <div class="dwissues">
                <h6>No issues</h6>
                <div class="dwissue ok"><b>No issues on this build.</b>
                    <span>Every check in Repairs passes for this row.</span></div>
            </div>`;
    }
    return html`
        <div class="dwissues">
            <h6>${faults.length} issue${faults.length === 1 ? '' : 's'} on this build</h6>
            ${faults.map((f) => html`
                <div class="dwissue" key=${f}>
                    <b>${COVERAGE_LABEL[f] || f}</b>
                    <span>${COVERAGE_WHY[f] || 'Flagged by the Repairs checks.'}</span>
                </div>`)}
        </div>`;
}

function BuildEditor({ build, csrfToken, onStage, onClose }) {
    const [draft, setDraft] = useState({ ...build, attachments: [...(build.attachments || [])] });
    const [card, setCard] = useState(null);
    const [imgFailed, setImgFailed] = useState(false);
    const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

    useEffect(() => {
        fetchJson(`/api/armory/preview?id=${build._id}`).then((d) => setCard(d.card || null));
    }, [build._id]);

    const atts = draft.attachments;
    const setAtt = (i, v) => set({ attachments: atts.map((a, n) => (n === i ? v : a)) });
    const dropAtt = (i) => set({ attachments: atts.filter((_, n) => n !== i) });

    // 🔴 THE FULL RECORD, NOT A PATCH. core/ops/loadouts.js's edit validates against the whole build — the same shape handleBulkBadges already sends — so a partial payload would fail validation somewhere far from the field that was actually changed.
    function stage() {
        const payload = { ...draft };
        delete payload.id; delete payload.coverage; delete payload.accent; delete payload.imageUrl; delete payload.topicVar; delete payload.accentHex;
        onStage({ type: 'loadout.edit', target: { id: String(build._id) }, payload });
    }

    const dmz = draft.mode === 'DMZ';
    return html`
        <div class="panel" id="build-editor">
            <div class="ph">
                <span class="t">Editing ${build.weaponName}<span class="bc-mode">${build.mode}</span></span>
                <span class="rt">one operation, staged — nothing here writes</span>
            </div>
            <div class="bed">
                <!-- ⚠️ THE TWO COLUMNS ARE NAMED NOW, and this comment used to say naming them would emit classes that do nothing. That was true of the ADOPTED sheet, which declares neither; it stopped being true when the portal authored rules for both. A zero min-width is what stops a long attachment string from blowing the 1fr column past its track, and the aside sticks so the card stays on screen while a long field list scrolls under it. -->
                <div class="bed-main">
                    <div class="bed-sec">
                        <h5>Identity</h5>
                        <div class="bed-g2">
                            <label class="dwfield"><span>Weapon name</span>
                                <input value=${draft.weaponName || ''} onInput=${(e) => set({ weaponName: e.target.value })} /></label>
                            <label class="dwfield"><span>Build name <i>a variant label, not a code</i></span>
                                <input value=${draft.buildName || ''} onInput=${(e) => set({ buildName: e.target.value })} /></label>
                        </div>
                        <div class="bed-g3">
                            <label class="dwfield"><span>Category</span>
                <select value=${draft.category} onChange=${(e) => set({ category: e.target.value })}>
                                    <!-- The PRECISE label, matching the Add form. These two dropdowns edit the same field
                                         and disagreed: the Add form read "AR — Assault Rifle" and this one read "AR". The
                                         column beside them now reads "Assault". Three spellings for one field, which is
                                         the defect the column fix closed in ONE of its three places. -->
                                    ${CATEGORIES.map((c) => html`<option value=${c} key=${c}>${c} — ${CATEGORY_LABEL[c] || c}</option>`)}
                                </select></label>
                            <label class="dwfield"><span>Mode</span>
                                <select value=${draft.mode} onChange=${(e) => set({ mode: e.target.value })}>
                                    ${MODES.map((m) => html`<option value=${m} key=${m}>${m}</option>`)}
                                </select></label>
                            <label class="dwfield"><span>weaponKey <i>derived</i></span>
                                <input value=${String(draft.weaponName || '').toLowerCase().replace(/\s+/g, '')} readOnly /></label>
                        </div>
                        <label class="dwfield">
                            <span>Gunsmith code ${dmz ? html`<i>DMZ has no code — the card omits it</i>` : html`<i>10 characters, digit and letter alternating</i>`}</span>
                            <span class="bed-code">
                                <input value=${draft.shareCode || ''} disabled=${dmz} placeholder="1C2B4A8B9A" spellcheck="false"
                                       onInput=${(e) => set({ shareCode: e.target.value })} />
                                <button class="chip" disabled=${!draft.shareCode}
                                        onClick=${() => navigator.clipboard?.writeText(draft.shareCode || '')}>Copy</button>
                            </span>
                        </label>
                    </div>

                    <div class="bed-sec">
                        <h5>Attachments <em>${atts.length}</em></h5>
                        <ul class="attlist">
                            ${atts.map((a, i) => html`
                                <li class="attrow" key=${i}>
                                    <span class="attn">${i + 1}</span>
                                    <input class="atti" value=${a} onInput=${(e) => setAtt(i, e.target.value)} />
                                    <input class="atts" value="" placeholder="slot (optional)" disabled />
                                    <button class="attx" aria-label=${`Remove ${a}`} onClick=${() => dropAtt(i)}>✕</button>
                                </li>`)}
                        </ul>
                        <div class="attfoot">
                            <button class="chip" onClick=${() => set({ attachments: [...atts, ''] })}>+ Add attachment</button>
                            <!-- ⚠️ THE NOTE IS A MEASUREMENT, NOT A RULE. Five is what almost every build carries, and a different count is legal — saying "unusual" rather than "wrong" is the difference between a hint and a false constraint. The slot column is disabled because nothing writes it: only /autobuild's vision pass ever has, and zero stored builds carry one. -->
                            <span class="attnote">${atts.length === 5
                                ? 'Five, the usual count.'
                                : `${atts.length} attachments. Legal, and sometimes right, but unusual — most builds carry 5.`}${' '}
                                Slot labels are only ever filled by the <code>/autobuild</code> vision pass, so the column is read-only here.</span>
                        </div>
                    </div>

                    <div class="bed-sec">
                        <h5>Badges</h5>
                        <!-- 🔴 THE WARNING BELONGS ON THE EDIT, NOT ON THE ADD. The add form carries the same sentence for context; here it describes what the button under it is about to DO — core/ops/loadouts.js propagates a badge across every build sharing this weapon key and mode, so toggling Meta on one build of a five-build weapon stages a change to all five. -->
                        <p class="bgnote">A badge describes the <b>weapon</b>. Changing one here propagates to every
                            build sharing this weapon and mode — <code>${draft.weaponName || 'this weapon'}</code> in${' '}
                            <code>${draft.mode}</code> — not this build alone.</p>
                        <div class="badgerow">
                            <button class=${'bgt' + (draft.isMeta ? ' on' : '')} onClick=${() => set({ isMeta: !draft.isMeta })}>Meta</button>
                            <button class=${'bgt tox' + (draft.isToxic ? ' on' : '')} onClick=${() => set({ isToxic: !draft.isToxic })}>Toxic</button>
                        </div>
                        <label class="dwfield" style="margin-top:11px">
                            <span>${dmz ? 'DMZ range rank' : 'Category rank'} <i>the vocabulary adminParser validates</i></span>
                            <input value=${(dmz ? draft.dmzRangeRank : draft.categoryRank) || ''}
                                   placeholder=${dmz ? 'best-close, top3-midlong' : 'best, top3, top5'} spellcheck="false"
                                   onInput=${(e) => set(dmz ? { dmzRangeRank: e.target.value } : { categoryRank: e.target.value })} /></label>
                    </div>
                </div>

                <aside class="bed-side">
                    <${BuildIssues} build=${build} />
                    <div class="bed-sec">
                        <h5>Image</h5>
                        <div class=${'imgbox' + (draft.imageKey ? (imgFailed ? ' failed' : '') : ' none')}>
                            ${draft.imageKey && build.imageUrl
                                ? html`<img src=${build.imageUrl} alt=${draft.weaponName} onError=${() => setImgFailed(true)} />` : null}
                            <span class="imgfail">Cloudinary returned nothing for this key.</span>
                            <span class="imgnone">No image — the card omits the gallery entirely</span>
                        </div>
                        <label class="dwfield"><span>imageKey <i>a Cloudinary key, or a full URL</i></span>
                            <input value=${draft.imageKey || ''} placeholder="AK117-1" spellcheck="false"
                                   onInput=${(e) => { setImgFailed(false); set({ imageKey: e.target.value }); }} /></label>
                        <div class="imgact">
                            <button class="chip" onClick=${() => set({ imageKey: `${String(draft.weaponName || '').toUpperCase().replace(/\s+/g, '-')}-1` })}>Use convention</button>
                            <button class="chip danger" disabled=${!draft.imageKey} onClick=${() => set({ imageKey: '' })}>Remove</button>
                        </div>
                        <p class="imgnote">The convention is <code>WEAPON-N</code> — all caps, spaces to hyphens, N being this
                            build's position among its siblings. Delivery bakes in the <code>f_auto,q_auto</code> transform, so the bot
                            never serves an unoptimised original.</p>
                    </div>
                    <div class="bed-sec">
                        <h5>What Discord sends</h5>
                        ${card ? renderV2(card.components) : html`<p class="empty">Loading…</p>`}
                    </div>
                </aside>
            </div>
            <div class="attfoot" style="padding:0 16px 16px">
                <button class="pill lead" onClick=${stage}>Stage this edit</button>
                <button class="pill" onClick=${onClose}>Close</button>
            </div>
        </div>
    `;
}

// ── COMPARE ───────────────────────────────────────────────────────────────────────────────────
//
// 🔴 THE QUESTION THIS ANSWERS IS THE ONE THE COVERAGE FLAG CANNOT. "near-duplicate" tells you two builds share a gunsmith code; it cannot tell you WHICH of them to keep, and the only way to decide was to open two rows one after the other and hold the first in your head. Two or three side by side, field by field, with the rows that DIFFER marked — that is the whole feature.
//
// ⚠️ THE SAME ROWS ARE DRAWN WHETHER THEY MATCH OR NOT. Showing only the differences would be shorter and would answer a different question: "these two are identical apart from the image" is a conclusion you can only reach by seeing the fields that agree. `.cmptab tr.same` is the adopted sheet's own class for exactly that.
const COMPARE_FIELDS = [
    ['Weapon', (b) => b.weaponName],
    ['Build', (b) => b.buildName],
    ['Category', (b) => b.category],
    ['Mode', (b) => b.mode],
    ['Rank', (b) => b.dmzRangeRank || b.categoryRank || '—'],
    ['Meta', (b) => (b.isMeta ? 'yes' : 'no')],
    ['Toxic', (b) => (b.isToxic ? 'yes' : 'no')],
    ['Attachments', (b) => (b.attachments || []).join(', ') || '—'],
    ['Share code', (b) => b.shareCode || '—'],
    ['Image', (b) => b.imageKey || '—'],
];

const MAX_COMPARE = 3;

// 🔴 `.cmpcards` EXPECTED `.dcard` CHILDREN AND GOT BARE DIVS, so the column layout, the dividers and every rule under `.dcard.lc` styled nothing — twelve classes with rules and no markup. The card is the RECORD, laid out so two of them line up field for field: the attachment list is the thing you actually compare, and reading it out of two Discord renders means reading two pictures.
//
// ⚠️ THE DISCORD RENDER MOVED OUT OF COMPARE, not away. It lives in the build editor's own side column under "What Discord sends", where it sits beside the fields that produce it. Here it cost one request per picked build to show two images you cannot align, while the table below already reports every field that differs.
function LoadoutCard({ build, siblings }) {
    const b = build;
    const idx = siblings.findIndex((s) => String(s._id) === String(b._id)) + 1;
    const badges = [
        b.isMeta ? 'META' : null,
        b.categoryRank ? String(b.categoryRank).toUpperCase() : null,
        b.dmzRangeRank ? String(b.dmzRangeRank) : null,
        b.isToxic ? 'TOXIC' : null,
    ].filter(Boolean);
    const code = b.mode !== 'DMZ' && (b.shareCode || b.buildName);
    const [failed, setFailed] = useState(false);
    const atts = b.attachments || [];
    const slots = b.attachmentSlots || [];

    return html`
        <div class="dcard lc" style=${`--c:${b.accent || 'var(--r-armory)'}`}>
            <h6>${b.weaponName}</h6>
            ${badges.length ? html`<div class="lc-badges">${badges.map((x) => html`<span key=${x}>${x}</span>`)}</div>` : null}
            <div class="lc-rule"></div>
            ${b.description ? html`<blockquote class="lc-desc">${b.description}</blockquote>` : null}
            <div class="lc-h">Attachments</div>
            <ul class="lc-att">
                ${atts.length
                    ? atts.map((a, i) => html`<li key=${i}><code>${a}</code>${slots[i] ? html`<em>${slots[i]}</em>` : null}</li>`)
                    : html`<li class="none">none recorded</li>`}
            </ul>
            ${code ? html`<div class="lc-h">Gunsmith Code</div><div class="lc-code">${code}</div>` : null}
            ${b.imageKey && b.imageUrl
                ? html`
                    <div class=${'lc-img' + (failed ? ' failed' : '')}>
                        <img src=${b.imageUrl} alt=${`${b.weaponName} ${b.buildName || ''}`} loading="lazy" onError=${() => setFailed(true)} />
                        <span class="lc-imgfail">Cloudinary did not return this image — <code>${b.imageKey}</code></span>
                    </div>`
                : html`<div class="lc-noimg">No image on this build, so the card omits the gallery entirely.</div>`}
            <div class="lc-foot">${b.category} • Build ${idx || 1} of ${siblings.length || 1}${b.lastUpdated ? ` • Updated ${String(b.lastUpdated).slice(0, 10)}` : ''}</div>
        </div>
    `;
}

function Compare({ builds, picked, onPick }) {
    const chosen = builds.filter((b) => picked.includes(String(b._id)));
    const siblingsOf = (b) => builds.filter((x) => x.weaponKey === b.weaponKey && x.mode === b.mode);

    return html`
        <div id="compare">
            <div class="cmpbar">
                ${builds.slice(0, 40).map((b) => {
                    const id = String(b._id);
                    const on = picked.includes(id);
                    return html`
                        <button class=${'chip' + (on ? ' on' : '')} key=${id} aria-pressed=${on ? 'true' : 'false'}
                                disabled=${!on && picked.length >= MAX_COMPARE}
                                onClick=${() => onPick(id)}>
                            ${b.weaponName}<b>${b.buildName || '—'}</b>
                        </button>`;
                })}
            </div>
            ${chosen.length < 2 ? html`
                <p class="empty">Pick two or three builds above. Rows that differ are marked; rows that agree are shown
                    too, because "identical apart from the image" is a conclusion you can only reach by seeing them.</p>`
            : html`
                <div class="cmp">
                    <div class="cmpcards">
                        ${chosen.map((b) => html`<${LoadoutCard} key=${String(b._id)} build=${b} siblings=${siblingsOf(b)} />`)}
                    </div>
                    <!-- ⚠️ THE TABLE ANSWERS "WHAT IS DIFFERENT" ONE FIELD AT A TIME AND NEVER TOTALS IT. Two builds that differ in one field and two that differ in nine look identical until you have read every row. -->
                    ${(() => {
                        const differing = COMPARE_FIELDS.filter(([, read]) => {
                            const vs = chosen.map(read).map((v) => (v == null ? '—' : String(v)));
                            return !vs.every((v) => v === vs[0]);
                        }).length;
                        return html`
                            <div class="diff">
                                <div class="diff-r"><span class="dk">Fields compared</span><span>${COMPARE_FIELDS.length}</span></div>
                                <div class="diff-r"><span class="dk">Differ</span><span>${differing || 'none — these are the same build twice'}</span></div>
                            </div>`;
                    })()}
                    <table class="cmptab">
                        <thead><tr><th>Field</th>${chosen.map((b) => html`<th key=${String(b._id)}>${b.weaponName}</th>`)}</tr></thead>
                        <tbody>
                            ${COMPARE_FIELDS.map(([label, read]) => {
                                const values = chosen.map(read).map((v) => (v == null ? '—' : String(v)));
                                const same = values.every((v) => v === values[0]);
                                // ⚠️ A DIFFERING CELL IS MARKED, AN AGREEING ONE IS NOT. The row already carries `diff`, which colours the whole line — but with three builds picked, two can agree and one differ, and a row-level mark cannot say which. `.dnow` is the cell-level version of the same signal.
                                return html`
                                    <tr class=${same ? 'same' : 'diff'} key=${label}>
                                        <td class="cmpf">${label}</td>
                                        ${values.map((v, i) => html`
                                            <td key=${i} class=${!same && v !== values[0] ? 'dnow' : ''}>${v}</td>`)}
                                    </tr>`;
                            })}
                        </tbody>
                    </table>
                </div>`}
        </div>
    `;
}

// ── THE ACTIVE FILTER BAR ─────────────────────────────────────────────────────────────────────
//
// 🔴 THE FILTER WAS INVISIBLE FROM THE TABLE IT FILTERED. Clicking a Coverage card narrowed the Manifest and said so only in the Manifest's header-right corner, as a bare string with no way back — so a reader who scrolled past it saw a short table and no reason for it, which reads as missing data rather than as a filter. The bar states every active narrowing, in the words the control used, with the count it produced and one control that undoes all of it.
function FilterBar({ weapon, flag, shown, total, onClear }) {
    if (!weapon && !flag) return null;
    return html`
        <div class="afbar">
            <span class="aflab">Showing</span>
            ${weapon ? html`<span class="afchip"><i></i>${weapon}</span>` : null}
            ${flag ? html`<span class="afchip warn"><i></i>${COVERAGE_LABEL[flag] || flag}</span>` : null}
            <span class="afn">${shown} of ${total}</span>
            <button class="afclear" onClick=${onClear}>Clear</button>
        </div>
    `;
}

// ── THE BULK VIEW ─────────────────────────────────────────────────────────────────────────────
//
// 🔴 loadout.bulkAdd AND loadout.bulkReplace WERE DECLARED, TIERED, PERMISSIONED AND UNREACHABLE. Both carry real /manage action ids (loadouts_mp:bulkadd, loadouts_dmz:bulkadd) and neither had a single affordance anywhere in the portal — the same shape as the seven tier-3 operations found the day before, and invisible to every gate for the same reason: a capability with no affordance does nothing, so there is nothing to measure. The Add form does one build at a time, and a build is a weapon, a category, five attachments, a code, an image and its badges; retyping forty of those through a form is precisely what the paste box exists to avoid.
//
// 🔴 THE MODE IS A CONTROL HERE, NOT A PARSED FIELD. In Discord the mode is decided by which page you opened, and core/ops/loadouts.js applies it to every block unconditionally — the format has carried no Mode segment since 2026-08-22. The portal shows MP and DMZ on one screen, so the thing Discord gets from context has to be stated, and stating it is better than inferring it: a paste that means DMZ and lands in MP is a silent wrong result, and this switch is the only place that decision is visible.
//
// ⚠️ ADD AND REPLACE ARE THE SAME UPSERT, deliberately, and the card says so rather than offering two buttons that do one thing. utils/manageActions.js opens the identical modal for both ids, and core/ops/loadouts.js gives loadout.bulkReplace the same apply() body as loadout.bulkAdd — a real wholesale replace would have deleted every build of that mode the paste did not mention, which is a bug already found once for draws.
const BULK_EXAMPLE = ['AK117 | AR', 'Build: Aggressive Flex', 'Image: AK117-1', 'Code: 1C2B4A8B9A', 'Badges: meta, top3',
    '- Monolithic Suppressor', '- MIP Extended Light Barrel', '- No Stock', '- 48 Round Extended Mag', '- Granulated Grip Tape'].join('\n');

// ⚠️ NO PER-ROW CHECKBOX, AND THAT IS A DECISION RATHER THAN AN OMISSION. The mockup's repairs drawer opts out of individual fixes with a `.fxc` tick; here the source of truth is the textarea two inches away, where deleting a block is exact and editable. A checkbox would need to map a rendered row back to a block of raw text, and the parser that owns that mapping is the BOT'S — utils/adminParser.js — which this codebase deliberately never reimplements in a browser. An opt-out that is 99% right about which block it drops is worse than no opt-out at all.
function BulkOverwrites({ rows, builds, mode }) {
    const updates = (rows || []).filter((r) => r.existing);
    if (!updates.length) return null;
    const plan = updates.map((r) => ({ row: r, before: findLocalBuild(builds, r, mode) }))
        .map((p) => ({ ...p, diff: bulkFieldDiff(p.row, p.before) }));
    const changing = plan.filter((p) => !p.diff || p.diff.length);
    if (!changing.length) {
        return html`<p class="bvmsg">Every existing build in this paste already matches — nothing would be overwritten.</p>`;
    }
    return html`
        <div class="fxlist">
            ${changing.map((p, i) => (p.diff === null ? html`
                <div class="fxr" key=${'u' + i}>
                    <span class="fxb">${p.row.weaponName} <em>${p.row.buildName}</em></span>
                    <span class="fxf">unknown</span>
                    <span class="fxd"><span class="fxwas">not loaded here</span>
                        <span class="fxar" aria-label="becomes">→</span>
                        <span class="fxnow">will be overwritten</span></span>
                </div>`
            : p.diff.map((d, j) => html`
                <div class="fxr" key=${i + '-' + j}>
                    <span class="fxb">${p.row.weaponName} <em>${p.row.buildName}</em></span>
                    <span class="fxf">${d.word}</span>
                    <span class="fxd">
                        <span class="fxwas">${d.was === '' || d.was == null || d.was === false ? '—' : String(d.was)}</span>
                        <span class="fxar" aria-label="becomes">→</span>
                        <span class="fxnow">${d.now === '' || d.now == null || d.now === false ? '—' : String(d.now)}</span>
                    </span>
                </div>`)))}
        </div>`;
}

// ⚠️ TWO CHIPS, NOT ONE BUTTON, BECAUSE THE ARMORY HAS TWO ARMORIES — and both keep the shortcut the shared MastheadNew binds, which the first version of this group dropped when it was transplanted from the mockup as bare chips. `b` opens MP, `d` opens DMZ, each announced on its own chip rather than bound invisibly, and both guarded so a bare letter typed into a field is a letter.
const ADD_KEY = { MP: 'b', DMZ: 'd' };

function ArmoryAddChips({ onAdd }) {
    useCreateKey(ADD_KEY.MP, () => onAdd('MP'));
    useCreateKey(ADD_KEY.DMZ, () => onAdd('DMZ'));
    return html`
        <div class="mh-add" id="mhAdd" role="group" aria-label="Add a build">
            <span class="mh-add-k">Add</span>
            ${MODES.map((m) => html`
                <button type="button" key=${m} class="pill mh-t"
                        style=${`--c:var(--${m === 'DMZ' ? 'ret' : 'draw'})`}
                        onClick=${() => onAdd(m)}>
                    <span class="dot"></span>New ${m} build${' '}
                    <kbd class="mh-k" aria-label=${`Keyboard shortcut: ${ADD_KEY[m].toUpperCase()}`}>${ADD_KEY[m].toUpperCase()}</kbd>
                </button>`)}
        </div>`;
}

function BulkView({ builds, mode, csrfToken, overlay, onStaged }) {
    const [text, setText] = useState('');
    const [preview, setPreview] = useState(null);
    const [busy, setBusy] = useState(false);
    const [guide, setGuide] = useState(false);
    const [exported, setExported] = useState(null);
    const [exportCat, setExportCat] = useState('');

    const inMode = builds.filter((b) => b.mode === mode);
    const cats = [...new Set(inMode.map((b) => b.category))].sort();
    const sum = preview ? bulkPasteSummary(preview) : null;

    async function runPreview() {
        setBusy(true);
        const res = await fetchJson('/api/parse-bulk/loadout', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ mode, text }),
        });
        setBusy(false);
        if (await reportFailure(overlay, res, 'The paste could not be read')) return;
        setPreview(res);
    }

    async function stage() {
        setBusy(true);
        const res = await stageOps('armory', [{ type: 'loadout.bulkAdd', target: { mode }, payload: { text } }], csrfToken);
        setBusy(false);
        if (await reportFailure(overlay, res, 'The paste could not be staged')) return;
        if (!res.changesetId) { overlay.say(res.error || 'The server refused the paste.'); return; }
        const staged = sum;
        setText(''); setPreview(null);
        onStaged(staged);
    }

    async function runExport(scope, category) {
        const res = await fetchJson(`/api/armory/export?${armoryExportQuery({ scope, mode, category })}`);
        if (await reportFailure(overlay, res, 'The export could not be read')) return;
        setExported({ scope, category, text: res.text || '', count: res.count || 0 });
    }

    return html`
        <div class="bulkview">
            <!-- ⚠️ THIS PANEL USED TO CARRY ITS OWN MP/DMZ SWITCH AND NO LONGER DOES. The view bar owns the mode for the whole realm, so a second switch here would be two controls over one quantity -- and they could disagree, which is the failure this repo keeps finding rather than a harmless duplicate. The mode is still stated in words on the paste card and the export card, because a destination you cannot see is the thing that made a switch feel necessary. -->
            <div class="bvgrid">
                <section class="bvcard">
                    <h4>Paste in <em class="modetag">${mode}</em></h4>
                    <p>One <b>block</b> per build, blocks separated by a blank line. A build already carrying this
                        weapon and build name is updated in place, so <b>Add</b> and <b>Replace</b> are one upsert —
                        which is exactly how the bot behaves, <code>bulkreplace</code> reusing <code>bulkadd</code>'s
                        own modal. Mode is not part of the format: every block lands in <b>${mode}</b>.</p>
                    <textarea rows="7" spellcheck="false" value=${text} placeholder=${BULK_EXAMPLE}
                              onInput=${(e) => { setText(e.target.value); setPreview(null); }}></textarea>
                    <div class="bvact">
                        <button class="chip" aria-pressed=${guide ? 'true' : 'false'} onClick=${() => setGuide(!guide)}>Format guide</button>
                        <button class="chip" disabled=${!text.trim() || busy} onClick=${runPreview}>Preview changes</button>
                    </div>
                    ${guide ? html`<pre class="guide">${BULK_EXAMPLE}</pre>` : null}
                    ${!preview ? html`<div class="bvmsg">${text.trim() ? 'Not previewed yet.' : 'Nothing pasted yet.'}</div>` : html`
                        <div class="bvres">
                            <div class="bvsum">
                                <span><b>${sum.updates}</b> update</span>
                                <span><b>${sum.creates}</b> new</span>
                                ${sum.rejected ? html`<span><b class="bad">${sum.rejected}</b> rejected</span>` : null}
                                ${sum.warnings ? html`<span><b>${sum.warnings}</b> saved with a warning</span>` : null}
                            </div>
                            ${preview.rows.map((r, i) => html`
                                <div class=${'bvrow ' + (r.existing ? 'upd' : 'new')} key=${i}>
                                    <span class="bvtag">${r.existing ? 'update' : 'new'}</span>
                                    <span><b>${r.weaponName}</b> · ${r.buildName}${' '}
                                        <em>${r.category} · ${r.attachments} attachment${r.attachments === 1 ? '' : 's'}</em></span>
                                </div>`)}
                            <${BulkOverwrites} rows=${preview.rows} builds=${builds} mode=${mode} />
                            <!-- A block the parser rejected is SHOWN, never dropped. A paste where three of eight
                                 blocks fell out silently is the exact failure a preview exists to prevent, and the
                                 parser's own message names the block by its first line. -->
                            ${preview.errors.map((e, i) => html`
                                <div class="bvrow bad" key=${'e' + i}>
                                    <span class="bvtag">problem</span>
                                    <span><i class="bverr">${e}</i></span>
                                </div>`)}
                            ${sum.canStage ? html`
                                <button class="chip go" disabled=${busy} onClick=${stage}>Stage ${sum.understood} build${sum.understood === 1 ? '' : 's'}</button>` : null}
                        </div>`}
                </section>

                <section class="bvcard">
                    <h4>Export <em class="modetag">${mode}</em></h4>
                    <p>Every export emits the same block format the paste box accepts, so a round trip is lossless —
                        <code>npm run portal:roundtrip</code> checks that against the real parser. This is what makes a
                        staged deletion recoverable: the export you take first re-imports through the same grammar.</p>
                    <div class="bvexp">
                        <button class="chip" onClick=${() => runExport('mode')}>All ${inMode.length} ${mode} builds</button>
                        <label class="sr" for="bv-cat">Category to export</label>
                        <select id="bv-cat" value=${exportCat}
                                onChange=${(e) => { setExportCat(e.target.value); if (e.target.value) runExport('category', e.target.value); }}>
                            <option value="">By category…</option>
                            ${cats.map((c) => html`<option value=${c} key=${c}>${c} — ${inMode.filter((b) => b.category === c).length}</option>`)}
                        </select>
                    </div>
                    ${!exported ? html`<div class="bvmsg">Nothing exported yet.</div>` : html`
                        <div class="bvres">
                            <div class="bvsum"><span><b>${exported.count}</b> build${exported.count === 1 ? '' : 's'} —${' '}
                                ${exported.scope === 'category' ? `every ${mode} ${exported.category} build` : `all ${mode} builds`}</span></div>
                            <textarea class="bvexpout" rows="8" readOnly spellcheck="false" value=${exported.text || '(nothing matched)'}></textarea>
                            <button class="chip" onClick=${() => { navigator.clipboard?.writeText(exported.text || ''); overlay.say(`${exported.count} build${exported.count === 1 ? '' : 's'} copied in paste format.`); }}>Copy to clipboard</button>
                        </div>`}
                </section>
            </div>
            <div class="bvnote">
                <b>Not offered here, deliberately:</b> there is no purge on either loadouts page. The bot has none
                either — <code>commands/manage.js</code>'s <code>PURGE_LABELS</code> omits both — and adding one to the
                portal would put a capability within reach that the system has already decided against.
            </div>
        </div>
    `;
}

// 🔴 THE VIEW NAMES LIVE IN ONE TABLE so the tab strip, the command palette and every branch below read the same strings. They were four bare literals in five places, which is how a rename becomes a silent dead branch: `view === 'Rack'` against a strip offering `Tier board` compiles, runs, and renders the fallback view forever.
const VIEWS = { rack: 'Tier board', coverage: 'Repairs', compare: 'Compare', bulk: 'Bulk & export' };
const VIEW_ORDER = [VIEWS.rack, VIEWS.coverage, VIEWS.compare, VIEWS.bulk];

// 🔴 THE KEY NAMES ONLY STATES THAT ARE ON SCREEN, which is the whole discipline of a legend and the one thing a hardcoded list cannot do. Filter to DMZ where nothing is stale and a fixed key still advertises "stale", sending a reader hunting for a mark that is not drawn anywhere -- the mockup hit exactly this and recorded it. `clean` is drawn as an EMPTY slot rather than a colour, because clean has no mark on a build chip: inventing a green square for it would teach a mark the page does not use.
function ArmoryKey({ split }) {
    const bad = split.filter((c) => c.faults.length).length;
    const age = split.filter((c) => c.aged && !c.faults.length).length;
    const clean = split.length - bad - age;
    const items = [];
    if (clean) items.push(['rk-clean', 'clean']);
    if (bad) items.push(['rk-bad', 'needs repair']);
    if (age) items.push(['rk-age', 'stale']);
    if (!items.length) return null;
    return html`
        <span class="key rkey" aria-label="What a build's marks mean">
            ${items.map(([cls, label]) => html`<span key=${cls} class=${cls}><i></i>${label}</span>`)}
        </span>`;
}

export function ArmoryRealm({ session }) {
    const [coverageFilter, setCoverageFilter] = useState(null);   // {flag, category} | null
    const [weaponFilter, setWeaponFilter] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    // 🔴 WHICH ARMORY THE BUILD IS FILED UNDER, NOT WHICH ARMORY YOU ARE LOOKING AT — separated 2026-09-04 20:42 EDT, Harkirat's call after seeing both sides. `AddBuildForm`'s own comment has stated the distinction since it was written (*"this one sets a PROPERTY OF THE RECORD… rather than which armory you are looking at, and those are different acts that happen to use the same two words"*) and the chip handler four hundred lines below it did both: `setArmMode(m); setShowAdd(true)`. So pressing `New DMZ build` opened the form AND swapped the rack out from under it — measured at **−4,531 nodes**, against the design's **+117**, which is the design mounting a form over the rack you were already reading. The two sides were not two renderings of one control. ⚠️ It survived because every instrument shoots the page AS IT LOADS: the only thing that ever saw it was `--open`, and the first version of THAT accepted the collapse as an overlay and exited 0.
    const [addMode, setAddMode] = useState('MP');
    const [selectedBuildId, setSelectedBuildId] = useState(null);
    const [bulkBadgesIds, setBulkBadgesIds] = useState(null);
    const [notice, setNotice] = useState('');
    // ⚠️ THE VIEW NAMES ARE THE MOCKUP'S, chosen at Harkirat's call on 2026-08-27 after seeing both bars rendered side by side. `Repairs` is the one that earns it outright: `Coverage` named a measurement, `Repairs` names what you came to do, and Season already calls the same idea by the same word -- so the two realms finally agree.
    const [view, setView] = useState(VIEWS.rack);
    const [compared, setCompared] = useState([]);
    // What the Manifest's own filter chips are set to. Owned here only because the EXPORT strip scopes by them; the Manifest still owns the filtering itself.
    const [manifestFilters, setManifestFilters] = useState({});
    const [editingId, setEditingId] = useState(null);
    // The side column exists only while something is being edited, so the grid that reserves room for it does too.
    const editing = Boolean(showAdd || editingId);
    // The grid is applied around the body rather than by swapping the tag, because htm has no dynamic-tag-with-spread form and the attempt to write one parses as an unterminated expression — node --check caught it, loudly. ⚠️ AND IT SITS BELOW editingId ON PURPOSE. The first placement was four lines ABOVE that useState, which is a temporal dead zone: the file parses, node --check is silent, and the realm renders NOTHING. Caught because portal:probe reported .rack as MISSING ON THE PORTAL — the same class eslint.config.mjs was installed for.
    const wrapBed = (body) => (editing ? html`<div class="bed" id="armory"><div>${body}</div></div>` : body);
    // 🔴 THE MODE IS A PROPERTY OF THE REALM, NOT OF ONE PANEL. It began as BulkView's private state, so the Rack, Repairs and Compare all showed MP and DMZ mixed together while a fourth view quietly filtered to one of them. MP and DMZ are two armories with different rules -- DMZ has no share code and ranks by combat range -- and every figure on this page is a count of one population or the other, so a masthead that totals both answers a question nobody asked.
    const [armMode, setArmMode] = useState('MP');
    const overlay = useOverlay();

    // ⚠️ `builds` DEFAULTED TO [] AND THE PAGE RENDERED IMMEDIATELY, so the first frame of every visit was a complete, confident, empty Armory — "0 builds · 0 weapons · 0 flagged" over an empty rack, which is a statement about the data rather than about the request. An empty state and an unanswered request must never look the same.
// 🔴 TWO REALMS COULD STAGE WORK AND NEITHER COULD TELL YOU IT HAD ANY. Season and Home both read /api/review to say how much is waiting — that is what feeds the rail's badge and the masthead's staged figure — and Armory and Broadcast, which stage on every edit, said nothing anywhere. You staged four builds, navigated away, and the console had no memory of it outside the Review screen.
//
// ⚠️ ONE REQUEST, IN THE SAME useAsync, so the realm still has ONE loading phase. A second hook would give the page two independent phases and a screen that is half skeleton and half table, which reads as a rendering bug rather than as loading.
    const load = useAsync(() => Promise.all([fetchJson('/api/armory'), fetchJson('/api/review')])
        .then(([armory, review]) => ({ ...armory, stagedOps: (review && review.ops) || [],
                                       stagedUnknown: Boolean(review && (review.forbidden || review.failed)) })), []);
    const refresh = load.reload;

    if (!load.data) return html`<${RealmShell} realm="armory" session=${session} error=${load.error} slow=${load.slow}
                                               onRetry=${load.reload} skeleton=${{ rows: 8, lines: [30, 22, 18, 14, 10] }} />`;
    const builds = load.data.builds || [];

    // Spec §8.2: Armory has no dates, so no Track -- Rack and Coverage are its two view layers. They shipped stacked on top of each other, which meant the Manifest (the thing you actually work in) started roughly a screen and a half down the page. Every derived figure below reads from `inMode`, never from `builds`, so the masthead cannot describe a population the views are not showing. `builds` survives only where BOTH armories are genuinely in scope: the export strip, which offers each mode as its own scope.
    const inMode = builds.filter((b) => b.mode === armMode);
    const weapons = new Set(inMode.map((b) => b.weaponName));
    // Ported from the mockup's renderCatChips: one chip per category PRESENT in this mode, each carrying its own count and accent — reusing Manifest's existing filterGroups mechanism (matchesFilters does a plain row[field]===value check, so 'category' just needs to match the build's own stored field), not a new filter system.
    const categoryCounts = new Map();
    for (const b of inMode) {
        const c = categoryCounts.get(b.category);
        if (c) c.count += 1; else categoryCounts.set(b.category, { count: 1, hex: b.accent });
    }
    const categoryOptions = CATEGORY_CHIP_ORDER
        .filter((c) => categoryCounts.has(c))
        .map((c) => ({ value: c, label: CATEGORY_CHIP_LABEL[c], count: categoryCounts.get(c).count, hex: categoryCounts.get(c).hex }));
    // 🔴 FAULTS AND AGE ARE COUNTED SEPARATELY HERE FOR THE SAME REASON splitCoverage EXISTS, and the masthead was the one surface still conflating them. A single `flagged` read 117 of 133 — a number so close to the total that it says nothing — because it counted "not touched in 90 days" as a defect. Coverage's own headline has always made the distinction in words ("66 builds have something actually wrong with them, and 106 more are merely old"); the figures above it now make it too, and both read from splitCoverage so they cannot disagree.
    const split = inMode.map(splitCoverage);
    const needRepair = split.filter((c) => c.faults.length).length;
    const stale = split.filter((c) => c.aged).length;
    // 🔴 THIS BLOCK CRASHED THE WHOLE REALM UNTIL 2026-08-27 — a bare `data` (Broadcast's binding name, not this file's) instead of `load.data`, thrown on every load since the null-check was added. No gate caught it: coverage/orphans/refs all scan source text and never execute it, so it shipped green through two audits that were specifically hunting this class of bug. Only opening the page in a browser found it. See docs/db-deferred-list.md's harness-in-npm-test item. 🔴 A FIGURE THAT CANNOT BE KNOWN MUST NOT READ AS ZERO. /api/review is forbidden to an admin who does not hold the review realm, and fetchJson answers a 403 with `{forbidden:true}` — so `(ops || [])` yielded `[]` and the masthead told a delegated admin "0 staged" when the honest answer is "you cannot see that". A console whose whole permission model exists to distinguish those two rendered them identically. `null` reaches the Masthead as an em dash, which is the portal's own absent-value voice.
    const stagedHere = load.data.stagedUnknown ? null
        : (load.data.stagedOps || []).filter((o) => (o.realm || 'season') === 'armory').length;
    // ⚠️ THE LEAD FIGURE WAS ALSO A STAT — `builds` appeared twice in the same row, as the hero number and again three columns to its right, reading as two different measurements that happened to agree. The mockup's Armory masthead has no repetition in it: a lead, then four figures that each say something the lead does not.
    const armoryStats = [
        // "MP builds" is the ambiguity the design's own comment names: this figure counts the ACTIVE MODE, while Home's card counts the whole collection, and both used the bare word. The label carries the scope — armory.html's `kBuilds`.
        { value: inMode.length, label: `${armMode} build${inMode.length === 1 ? '' : 's'} shown`, lead: true, accent: 'var(--r-armory)' },
        { value: weapons.size, label: 'weapons' },
        // `warn`, not `bad` — armory.html:21 is `<span class="stat warn">`. Builds needing repair are still being served correctly; the alarm tone belongs to something that is failing now.
        { value: stagedHere === null ? '—' : stagedHere, label: 'staged', tone: stagedHere ? 'stg' : undefined },
        { value: needRepair, label: 'need repair', tone: needRepair ? 'warn' : undefined },
        { value: stale, label: 'stale' },
        // The realm's own staged count, in the staged voice — every other realm's masthead says how much of what you are looking at is not live yet, and the Armory's did not.

    ];

    // Manifest/editing/preview all key off row.id -- the raw /api/armory response only ever carried _id, so nothing selectable/editable/previewable actually worked before this mapping existed. Coverage is now a per-CATEGORY cell rather than a whole-column total, so the filter carries both halves; Rack's cards filter by weapon. Both narrow the same Manifest rather than opening a second surface -- one working table, per the two-layer contract.
    const rows = inMode
        .filter((b) => !coverageFilter || (b.coverage || []).includes(coverageFilter.flag))
        .filter((b) => !weaponFilter || b.weaponName === weaponFilter)
        .map((b) => ({ ...b, id: b._id, topicVar: null, accentHex: b.accent }));

    // 🔴 STAGING WITH NO ACKNOWLEDGEMENT READS AS A DROPPED CLICK. The form closed, the table did not change (a staged build is not a live one), and nothing anywhere said the work had landed — so the only way to find out was to open Review and look. The toast carries the way there, because "it is staged" and "here is where staged things go" are the same sentence.
    async function handleAdd(op) {
        await stageOps('armory', [op], session.csrfToken);
        setShowAdd(false);
        overlay.say('Build staged. Nothing is live until you commit it.', 'Review', () => { location.hash = '#/review'; });
        refresh();
    }

    async function handleBulkDelete(ids) {
        await stageOps('armory', [{ type: 'loadout.bulkDelete', target: null, payload: { ids } }], session.csrfToken);
        overlay.say(`${ids.length} deletion${ids.length === 1 ? '' : 's'} staged.`, 'Review', () => { location.hash = '#/review'; });
        refresh();
    }

    // ⚠️ THE CONFIRMATION NAMES WHAT SURVIVES, NOT JUST WHAT GOES. This action only STAGES — the builds stay live until somebody commits the changeset — and a dialog that omits that is asking for a decision under the wrong stakes. The bulk note under the table already said so; the moment of deciding is where it has to be said.
    function confirmBulkDelete(ids) {
        const named = rows.filter((r) => ids.includes(r.id)).slice(0, 6).map((r) => `${r.weaponName} · ${r.buildName}`);
        overlay.confirm({
            op: 'loadout.bulkDelete', tier: 2, danger: true, confirmLabel: 'Stage deletion',
            title: `Stage deletion of ${ids.length} build${ids.length === 1 ? '' : 's'}?`,
            body: html`
                <p class="dw-p">Nothing goes yet. This stages the deletion; the builds stay live and visible in
                    Discord until the changeset is committed on the Review screen, and discarding it there undoes
                    this completely.</p>
                <ul class="dw-l">${named.map((n) => html`<li key=${n}>${n}</li>`)}
                    ${ids.length > named.length ? html`<li>…and ${ids.length - named.length} more</li>` : null}</ul>`,
            onConfirm: () => handleBulkDelete(ids),
        });
    }

    async function handleBulkBadges(badgesText) {
        const targetRows = rows.filter((r) => bulkBadgesIds.includes(r.id));
        const ops = targetRows.map((r) => {
            const parsed = parseBadgesToken(badgesText, r.mode);
            const payload = { ...r, isMeta: parsed.isMeta, isToxic: parsed.isToxic, categoryRank: parsed.categoryRank, dmzRangeRank: parsed.dmzRangeRank };
            delete payload.id; delete payload.coverage; delete payload.accent;
            return { type: 'loadout.edit', target: { id: r.id }, payload };
        });
        if (ops.length) await stageOps('armory', ops, session.csrfToken);
        setBulkBadgesIds(null);
        overlay.say(`Badges staged for ${ops.length} build${ops.length === 1 ? '' : 's'}.`, 'Review', () => { location.hash = '#/review'; });
        refresh();
    }

    // 🔴 `open('data:…')` IS BLOCKED as a top-level navigation and returns null — measured in this app, so this button ran, reported nothing and produced no file. It writes a real one now, through the mechanism the changeset export has always used.
    async function handleExportSelection(ids) {
        const body = await fetchJson(`/api/armory/export?${armoryExportQuery({ scope: 'selection', ids })}`);
        if (await reportFailure(overlay, body, 'The selection could not be exported')) return;
        downloadText(`dioreo-builds-selection-${new Date().toISOString().slice(0, 10)}.txt`, body.text || '');
        overlay.say(`${body.count || ids.length} build${(body.count || ids.length) === 1 ? '' : 's'} exported in paste format.`);
    }

    const exportToday = new Date().toISOString().slice(0, 10);
    // 🔴 THE STRIP OFFERED TWO SCOPES AND /manage OFFERS FOUR. armory.html's `armoryScopes` names them and says where they come from: "exportupto5, exportcategory, exportall per mode, plus the one only a portal can: what you are currently looking at". The portal had only the per-mode one, so narrowing a 125-build catalogue to the nine rows you were actually working on meant selecting them by hand. `armoryExportQuery` already speaks `category` and `ids`; nothing new was needed server-side.
    //
    // ⚠️ TWO DELIBERATE DIVERGENCES FROM THE DESIGN'S FOUR, both because copying it exactly would ship a worse strip. (1) BOTH modes keep a whole-catalogue scope. The design scopes the entire strip to the active mode, so backing up
    //     DMZ means switching to it first; this file's own comment above already reserves the export strip as the one
    //     surface where both armories are legitimately in scope. That makes the summary line count 133 where the design
    //     counts 125, and say five formats where it says four — a cited consequence, not drift.
    // (2) The category scope appears only once a category chip is ON. The design keeps it visible reading "pick one
    //     first" with a `build()` that returns the empty string, so its Download hands you a 0-byte file. A control that
    //     is present and lies is worse than one that arrives when it can do something.
    // armory.html's `#viewMeta`, which the design writes on every view. The rack line drops the design's trailing "· N MP builds live": that clause exists because the mockup ships a SAMPLE of the collection and has to say so, and here the figure beside it is already the live count — restating it would be the same number twice.
    const rankedNow = inMode.filter((b) => b.categoryRank || b.dmzRangeRank).length;
    const viewMeta = view === VIEWS.rack ? `${rankedNow} of ${inMode.length} ranked`
        : view === VIEWS.coverage ? `${Object.keys(COVERAGE_LABEL).filter((f) => inMode.some((b) => (b.coverage || []).includes(f))).length} of ${Object.keys(COVERAGE_LABEL).length} checks failing`
        : view === VIEWS.compare ? `${compared.length} of ${MAX_COMPARE} picked`
        : `${inMode.length} ${armMode} builds · pipe format, lossless round trip`;

    const tag = armMode.toLowerCase();
    const exportCategory = manifestFilters.category && manifestFilters.category !== 'all' ? manifestFilters.category : null;
    const viewRows = exportCategory ? rows.filter((b) => b.category === exportCategory) : rows;
    const idsUrl = (list) => `/api/armory/export?${armoryExportQuery({ scope: 'selection', ids: list.map((b) => b.id) })}`;
    // A 125-id query string is ~3KB of URL for a request the mode scope already answers in 12 characters. When the view IS the whole mode, ask for the mode.
    const viewUrl = (viewRows.length === inMode.length
        ? `/api/armory/export?${armoryExportQuery({ scope: 'mode', mode: armMode })}` : idsUrl(viewRows));
    const exportScopes = [
        ...MODES.map((m) => ({
            id: `armory.${m}`, label: `${m} builds`, unit: 'builds',
            count: builds.filter((b) => b.mode === m).length,
            url: `/api/armory/export?${armoryExportQuery({ scope: 'mode', mode: m })}`,
            filename: `dioreo-${m.toLowerCase()}-builds-${exportToday}.txt`,
            note: 'Blocks in the same grammar the Bulk view\'s paste box accepts, so a round trip is lossless.',
        })),
        { id: `armory.${tag}.view`, label: 'This view', unit: 'builds', subsetOf: `armory.${armMode}`,
          count: viewRows.length, url: viewUrl,
          filename: `dioreo-${tag}-view-${exportToday}.txt`,
          note: 'Exactly the rows the rack, repair and category filters leave standing — not the Manifest\'s own search box, which narrows the table below rather than this.' },
        ...(exportCategory ? [{ id: `armory.${tag}.cat`, unit: 'builds', subsetOf: `armory.${armMode}`,
          label: `Category — ${CATEGORY_CHIP_LABEL[exportCategory] || exportCategory}`,
          count: inMode.filter((b) => b.category === exportCategory).length,
          url: `/api/armory/export?${armoryExportQuery({ scope: 'category', mode: armMode, category: exportCategory })}`,
          filename: `dioreo-${tag}-${exportCategory.toLowerCase()}-${exportToday}.txt`,
          note: 'Matches /manage loadouts\' export-by-category.' }] : []),
        { id: `armory.${tag}.five`, label: 'First five in this filter', unit: 'builds', subsetOf: `armory.${armMode}`,
          count: Math.min(5, viewRows.length), url: idsUrl(viewRows.slice(0, 5)),
          filename: `dioreo-${tag}-five-${exportToday}.txt`,
          note: 'Matches /manage loadouts\' "Up To 5".' },
    ];

    // 🔴 THE RAIL'S STAGED COUNT REACHED TWO REALMS OF SEVEN. `badges` was passed by Home (home.js) and Season (season.js) only, so the one number the rail exists to carry — how much work is waiting — was absent on the five realms in between, including the two that stage on every edit. It is a property of the CHANGESET, so it is the TOTAL and not this realm's share; `Rail` omits it at zero, which is the "absent rather than zero" rule `shell.js:43` states. Unknown (a 403 on /api/review) reads as absent too, because a badge is not the surface that can say "you cannot see that". ⚠️ AS A `//` COMMENT ABOVE THE RETURN, NEVER AS `<!-- -->` INSIDE THE PROP LIST — the first version was the latter on all five realms and htm dropped every prop after it.
    return html`
        <${Shell} realm="armory" session=${session} busy=${load.hostClass} view=${view} viewOptions=${VIEW_ORDER} onSetView=${setView}
                  meta=${viewMeta}
                  modeOptions=${MODES} mode=${armMode} onSetMode=${setArmMode} modeLabel="Which armory"
                  realmKey=${html`<${ArmoryKey} split=${split} />`}
                  badges=${{ review: load.data.stagedUnknown ? 0 : (load.data.stagedOps || []).length }}
                  overlaySlot=${overlay.render()} exports=${exportScopes} exportLabel="Export" overlayFor=${overlay}
                  commands=${[
                      { label: 'Add a build', group: 'armory', local: true, accent: 'var(--r-armory)',
                        keywords: ['new', 'create', 'loadout', 'weapon'], run: () => { setAddMode(armMode); setShowAdd(true); } },
                      { label: 'Compare the selected builds', group: 'armory', local: true, accent: 'var(--r-armory)',
                        keywords: ['diff', 'side by side', 'duplicate'], run: () => setView(VIEWS.compare) },
                      { label: 'Paste a list of builds', group: 'armory', local: true, accent: 'var(--r-armory)',
                        keywords: ['bulk', 'import', 'many', 'export', 'backup'], run: () => { setEditingId(null); setView(VIEWS.bulk); } },
                      { label: 'Clear the rack and coverage filters', group: 'armory', local: true, accent: 'var(--ink3)',
                        keywords: ['reset', 'all', 'unfilter'], run: () => { setWeaponFilter(null); setCoverageFilter(null); } },
                  ]}
                  masthead=${html`<${Masthead} title="Armory"
                                               sub="Every build the bot can show a player, ranked within its category, with whatever is wrong with it named."
                                               stats=${armoryStats}
                                               actions=${html`
                                                   <!-- ⚠️ TWO CHIPS, NOT ONE BUTTON, BECAUSE THE ARMORY HAS TWO ARMORIES.
                                                        MP and DMZ are different records with different rules — DMZ has no share
                                                        code and ranks by combat range — and a single "New build" made the mode a
                                                        thing you discovered inside the form. Season's masthead already works this
                                                        way for its five item types; this is the same control. -->
                                                   <${ArmoryAddChips} onAdd=${(m) => { setAddMode(m); setShowAdd(true); }} />`} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      <!-- The .bed class is the adopted sheet's own main-plus-side split (1fr 340px), which is
                           exactly this layout. The armcols/armmain/armside names were portal-authored, with no rules
                           left behind them, so the preview column had been stacking under the rack rather than beside
                           it. (No backticks in this comment: an EVEN number of them inside an html template closes and
                           reopens it, which parses fine and turns the prose into expressions — this exact comment did
                           that, and the page rendered blank with "Cannot read properties of null (reading 'bed')".) -->
                      <!-- 🔴 THE BED WRAPPER IS FOR EDITING, AND IT WAS WRAPPED ROUND THE RESTING PAGE TOO. The id
                           armory does not exist on the mockup at all: the design puts the view panel straight into the
                           view slot, and .bed is the main-plus-side split the EDITOR needs. Wrapping the rack in it cost
                           23px of inset on each side — measured .rack at 1114px against the design's 1160, starting at
                           x=122 against x=99 — so the tier board ran narrow and the board's right-hand gutter read as
                           dead space. It renders only when there is a side column to hold.
                           (No backticks in this comment. The first draft had five and broke the parse; portal:template-comments,
                            written earlier in this same session for exactly this, named the file and the line.) -->
                      ${wrapBed(html`
                              ${showAdd ? html`<${AddBuildForm} mode=${addMode} onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)} />` : null}
                              ${editingId ? html`
                                  <${BuildEditor} build=${builds.find((b) => String(b._id) === editingId)}
                                                  csrfToken=${session.csrfToken}
                                                  onStage=${async (op) => {
                                                      await stageOps('armory', [op], session.csrfToken);
                                                      setEditingId(null);
                                                      overlay.say('Edit staged. Nothing is live until you commit it.', 'Review', () => { location.hash = '#/review'; });
                                                      refresh();
                                                  }}
                                                  onClose=${() => setEditingId(null)} />`
                              : view === VIEWS.rack
                                  ? html`<${Rack} builds=${inMode} onPick=${(w) => setWeaponFilter(weaponFilter === w ? null : w)} />`
                                  : view === VIEWS.compare
                                      ? html`<${Compare} builds=${rows} picked=${compared}
                                                         onPick=${(id) => setCompared(compared.includes(id) ? compared.filter((x) => x !== id) : [...compared, id])} />`
                                  : view === VIEWS.bulk
                                      ? html`<${BulkView} builds=${builds} mode=${armMode}
                                                          csrfToken=${session.csrfToken} overlay=${overlay}
                                                          onStaged=${(s) => {
                                                              overlay.say(`${s.understood} build${s.understood === 1 ? '' : 's'} staged — ${s.updates} update, ${s.creates} new. Nothing is live until you commit.`,
                                                                  'Review', () => { location.hash = '#/review'; });
                                                              refresh();
                                                          }} />`
                                      : html`<${Coverage} builds=${inMode} active=${coverageFilter} onFilter=${setCoverageFilter} />`}
                          <!-- 🔴 THE STANDALONE LIVE PREVIEW PANEL IS GONE. It showed the card for whichever row was
                               last clicked, beside a table you were not editing — a preview with nothing to preview
                               against. The build editor carries it in .bed-side, where the card and the fields that
                               produce it are one screen. Clicking a row opens the editor.
                               🔴 AND THE COLUMN IT LEFT BEHIND WAS STILL BEING RESERVED. The bed grid held a 340px second
                               cell whose only content was the hint below, measured 7,725px tall on the rack — so the
                               board ran at 798px of an 1,158px panel to make room for one sentence. The hint is a
                               caption for the MANIFEST, which is where the clickable rows actually are, so it belongs
                               in the flow under the board rather than in a column of its own. A :has-only-child rule
                               on .bed drops the empty cell, and the board gets the width the mockup gives it. -->
                      `)}
                  `}
                  manifestSlot=${html`
                      <!-- 🔴 THE HINT USED TO RENDER HERE, AND IT COST THE WHOLE TABLE ITS DEPTH. Both stylesheets carry
                           .panel + .panel with background:transparent — the design's manifest is the ADJACENT SIBLING of
                           its view panel, so the table sits on the desk colour and reads as a well cut into the page. One
                           paragraph between the two panels breaks that selector, and the portal's rows painted --raised
                           instead: measured #171E24 against the design's #0F1418, on every row of a 125-row table, with
                           both stylesheets carrying the identical rule. The hint is a caption for the Manifest, so it
                           renders INSIDE it now. FilterBar returns null at rest and never broke anything. -->
                      <${FilterBar} weapon=${weaponFilter} flag=${coverageFilter && coverageFilter.flag}
                                    shown=${rows.length} total=${builds.length}
                                    onClear=${() => { setWeaponFilter(null); setCoverageFilter(null); }} />
                      <${Manifest} rows=${rows} columns=${ARMORY_COLUMNS} searchableFields=${['weaponName', 'buildName']}
                                   label="Manifest" filterGroups=${[...ARMORY_FILTERS, { key: 'category', label: 'Category', topic: true, options: categoryOptions }]}
                                   headerRight=${weaponFilter || (coverageFilter ? COVERAGE_LABEL[coverageFilter.flag] : '')}
                                   bulkNote="Reversible — a staged deletion is discarded, never undone"
                                   bulkTier=${2} rowNoun=${['build', 'builds']}
                                   onRemove=${(row) => confirmBulkDelete([row.id])} removeLabel="Stage deletion"
                                   emptyText="No builds match this filter." 
                                   onAdd=${() => { setAddMode(armMode); setShowAdd(true); }} addLabel="+ Add build" realm="armory" csrfToken=${session.csrfToken}
                                   buildEditOp=${buildArmoryEditOp}
                                   onEditError=${(msg) => setNotice(msg)}
                                   onFiltersChange=${setManifestFilters}
                                   caption=${editingId || showAdd ? null : 'Click a row to open it.'}
                                   totalRows=${builds.length}
                                   onRowClick=${(row) => setEditingId(String(row.id))} selectedRowId=${editingId}
                                   bulkActions=${[
                                       { label: 'Set badges…', onClick: (ids) => setBulkBadgesIds(ids) },
                                       { label: 'Export selection', onClick: handleExportSelection },
                                       { label: 'Stage deletion', danger: true, onClick: confirmBulkDelete },
                                   ]} />
                      ${bulkBadgesIds ? html`<${BulkBadgesPanel} ids=${bulkBadgesIds} onApply=${handleBulkBadges} onCancel=${() => setBulkBadgesIds(null)} />` : null}
                  `} />
    `;
}
