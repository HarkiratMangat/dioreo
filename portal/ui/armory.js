// portal/ui/armory.js — ESM. The Armory realm: Rack (by category) + Coverage (data-quality flags) + an Add form + inline edit + bulk actions + a LIVE PREVIEW panel, reusing <Shell>/<Manifest> unchanged (spec §8.2). No dates, so no Track.
//
// buildArmoryAddOp/buildArmoryEditOp/parseBadgesToken come from armory.logic.js, loaded as a plain CLASSIC <script> before this module -- see track.js's header comment for why that is the real working cross-runtime resolution here, and why a literal `import {...} from './armory.logic.js'` would fail in every real browser (found live in season.js's own prior version).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Fold, Icon } from './icons.js';
import { Shell, NoAccess, Masthead } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { stageOps } from './composeClient.js';
import { renderV2 } from './v2Render.js';
import { useOverlay } from './overlay.js';

const MODES = ['MP', 'DMZ'];

const ARMORY_COLUMNS = [
    { key: 'weaponName', label: 'Weapon', editable: true },
    { key: 'buildName', label: 'Build', editable: true },
    { key: 'category', label: 'Category', editable: true },
    { key: 'mode', label: 'Mode' },
    { key: 'coverage', label: 'Coverage', render: (r) => (r.coverage || []).join(', ') || '—' },
];

const ARMORY_FILTERS = [
    { key: 'mode', label: 'Mode', options: [{ value: 'MP', label: 'MP' }, { value: 'DMZ', label: 'DMZ' }] },
];

const COVERAGE_LABEL = {
    'missing-image': 'Missing image', 'no-badges': 'No badges', 'wrong-attachment-count': 'Wrong attachment count',
    'stale-90d': 'Not updated in 90 days', 'near-duplicate': 'Near-duplicate code',
};

// Rack -- what exists, by category, in the bot's REAL per-category accent (spec §8.2). It shipped as one row of uniform grey chips: a count per category and nothing else. 04-armory-and-commit.html specs a card per WEAPON under a per-category section divider, each card carrying its build count, a dupe warning where one applies, and a dashed placeholder where the image is missing -- so the panel answers "what is in the armory" at a glance instead of "how many categories are there".
//
// `accent` is real DATA (portal/api/armory.js stamps it from getMpCategoryAccent), not a CSS token. That is the correct mechanism and deliberately unlike Season's --topic-accent tokens: the bot owns these hues, so reading them from the payload means the two can never drift apart. 🔴 THE RACK IS ORGANISED BY RANK TIER, NOT BY CATEGORY — rebuilt 2026-08-26 onto the adopted design. The previous version grouped by category, which answers "what is in the armory"; the rack in the approved mockup answers "what is ranked where", which is the question the badges exist for and the only one a rack can answer that the Manifest below cannot. Category has not been lost — it is the accent every card carries, so the two facts occupy colour and position rather than competing for the same structure.
const RANK_ORDER = ['best', 'top3', 'top4', 'top5', null];
const RANK_LABEL = { best: 'Best in category', top3: 'Top 3', top4: 'Top 4', top5: 'Top 5', null: 'Unranked' };
const RANK_KEY = { best: 'best', top3: 't3', top4: 't4', top5: 't5', null: 'none' };
const TCLOSED_KEY = 'dioreo-armory-tclosed';

// A DMZ build ranks on dmzRangeRank, which also encodes a combat range (`best-close`, `best-midlong`) — the tier is the part before the hyphen. An MP build ranks on categoryRank. Reading the wrong field is how DMZ builds all pile into Unranked while looking correct.
function rankOf(b) {
    const raw = b.mode === 'DMZ' ? b.dmzRangeRank : b.categoryRank;
    if (!raw) return null;
    return String(raw).split('-')[0];
}

function loadTClosed() { try { return new Set(JSON.parse(sessionStorage.getItem(TCLOSED_KEY)) || []); } catch { return new Set(); } }
function saveTClosed(set) { try { sessionStorage.setItem(TCLOSED_KEY, JSON.stringify([...set])); } catch (e) {} }

// 🔴 AGE IS NOT A DEFECT. Counting staleness among the faults put a red mark on nearly every card — the mockup measured 33 of 36 siblings — so the badge stopped meaning anything. Faults get the red count; age gets a quiet dot, because it is a different fact and reads as one.
function splitCoverage(b) {
    const all = b.coverage || [];
    return { faults: all.filter((f) => f !== 'stale-90d'), aged: all.includes('stale-90d') };
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

function Rack({ builds, onPick }) {
    const [tclosed, setTClosed] = useState(loadTClosed);
    const toggle = (k) => setTClosed((prev) => {
        const next = new Set(prev);
        next.has(k) ? next.delete(k) : next.add(k);
        saveTClosed(next);
        return next;
    });

    return html`
        <div class="panel" id="rack">
            <div class="ph">
                <span class="t">Rack — by rank</span>
                <span class="rt">${new Set(builds.map((b) => b.weaponName)).size} weapons</span>
            </div>
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
                                <span class="trow-t">${RANK_LABEL[key]}</span>
                                <span class="trow-n">${list.length}</span>
                                ${r === 'best' ? html`<span class="trow-note">one <b>weapon</b> per category</span>`
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
        <div class="panel" id="coverage">
            <div class="ph">
                <span class="t">Coverage</span>
                <span class="rt">${builds.filter((b) => (b.coverage || []).length).length} of ${builds.length} builds flagged</span>
            </div>
            <!-- 🔴 THE CARDS GO INSIDE .cols, NOT DIRECTLY INSIDE .cov, and the adopted sheet says so in its
                 own comment: .cov is declared TWICE in that file — a grid first, then display:block eight
                 hundred lines later — so the later one wins and .cov is the BLOCK, .cov .cols is the grid.
                 Emitting the cards straight into .cov gave five buttons at five different content widths
                 under a rule that reads like a grid and no longer is. Second duplicate declaration found in
                 this stylesheet today; assume there are more. -->
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

// Mirrors /manage's real add-loadout modal fields (handlers/manage/loadouts.js's addLoadout): weapon name, category, build name, image key, a comma-separated badges token field (parsed client-side by parseBadgesToken -- the exact grammar utils/adminParser.js's parseLoadoutBadges validates server-side), and attachments one-per-line. Mode is a real field here (unlike the modal, whose Add button is already page-scoped) since Armory shows both MP and DMZ builds on one page.
function AddBuildForm({ onSubmit, onCancel }) {
    const [weaponName, setWeaponName] = useState('');
    const [category, setCategory] = useState('AR');
    const [mode, setMode] = useState('MP');
    const [buildName, setBuildName] = useState('');
    const [imageKey, setImageKey] = useState('');
    const [badges, setBadges] = useState('');
    const [attachments, setAttachments] = useState('');
    const [badgeWarning, setBadgeWarning] = useState('');
    const ready = weaponName.trim() && category.trim();

    function submit() {
        const parsed = parseBadgesToken(badges, mode);
        setBadgeWarning(parsed.unrecognized.length
            ? `Not recognized and ignored: "${parsed.unrecognized.join(', ')}". Valid: meta, best, toxic, topN (e.g. top3), or a DMZ range badge (bestclose, bestmidlong, top3close, top5midlong).`
            : '');
        onSubmit(buildArmoryAddOp({
            weaponName, category, mode, buildName, imageKey, badges,
            attachments: attachments.split('\n').map((s) => s.trim()).filter(Boolean),
        }));
    }

    return html`
        <div class="panel" style="margin-bottom:14px">
            <div class="ph"><span class="t">Add a build</span></div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;padding:12px 14px;align-items:center">
                <label class="sr-only" for="ab-weapon">Weapon name</label>
                <input id="ab-weapon" placeholder="Weapon name" value=${weaponName} onInput=${(e) => setWeaponName(e.target.value)} />
                <label class="sr-only" for="ab-category">Category</label>
                <input id="ab-category" placeholder="Category (e.g. AR)" value=${category} onInput=${(e) => setCategory(e.target.value)} style="width:100px" />
                <label class="sr-only" for="ab-mode">Mode</label>
                <select id="ab-mode" value=${mode} onChange=${(e) => setMode(e.target.value)}>
                    ${MODES.map((m) => html`<option value=${m}>${m}</option>`)}
                </select>
                <label class="sr-only" for="ab-build">Build name</label>
                <input id="ab-build" placeholder="Build name" value=${buildName} onInput=${(e) => setBuildName(e.target.value)} />
                <label class="sr-only" for="ab-image">Cloudinary image key</label>
                <input id="ab-image" placeholder="Image key" value=${imageKey} onInput=${(e) => setImageKey(e.target.value)} />
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;padding:0 14px 12px;align-items:center">
                <label class="sr-only" for="ab-badges">Badges</label>
                <input id="ab-badges" placeholder="Badges (e.g. meta, top3)" value=${badges} onInput=${(e) => setBadges(e.target.value)} style="width:220px" />
                <label class="sr-only" for="ab-attachments">Attachments, one per line</label>
                <textarea id="ab-attachments" placeholder="Attachments, one per line" value=${attachments} onInput=${(e) => setAttachments(e.target.value)} rows="3"
                          style="flex:1;min-width:220px;background:var(--sunk);border:1px solid var(--rule);border-radius:5px;color:var(--ink);font-size:13px;padding:7px 10px"></textarea>
                <button class="accent-fill" disabled=${!ready} onClick=${submit}>Stage</button>
                <button onClick=${onCancel}>Cancel</button>
            </div>
            ${badgeWarning ? html`<p style="color:var(--warn);padding:0 var(--gut) 10px;font-size:12px">${badgeWarning}</p>` : null}
        </div>
    `;
}

// Bulk "Set badges…" -- a small inline panel, not a native prompt() (this session already removed prompt() from Access's Revoke for the same UX reason). Applies the same badges grammar to every selected build via one loadout.edit op each, in one changeset.
function BulkBadgesPanel({ ids, onApply, onCancel }) {
    const [badges, setBadges] = useState('');
    return html`
        <div style="display:flex;gap:8px;align-items:center;padding:10px 14px;border-top:1px dashed var(--rule)">
            <label class="sr-only" for="bulk-badges">Badges to apply to ${ids.length} selected build(s)</label>
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
const CATEGORIES = ['AR', 'SMG', 'SNIPER', 'LMG', 'SHOTGUN', 'MARKSMAN', 'SECONDARIES', 'MELEE'];

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
                <span class="t">Editing ${build.weaponName}</span>
                <span class="rt">one operation, staged — nothing here writes</span>
            </div>
            <div class="bed">
                <!-- The adopted sheet defines .bed as the 1fr/340px grid and styles .bed-sec inside it; the two columns are grid CHILDREN with no rules of their own, so naming them would be emitting classes that do nothing. -->
                <div>
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
                                    ${CATEGORIES.map((c) => html`<option value=${c} key=${c}>${c}</option>`)}
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

                <aside>
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

function Compare({ builds, picked, onPick }) {
    const chosen = builds.filter((b) => picked.includes(String(b._id)));
    const [cards, setCards] = useState({});
    useEffect(() => {
        for (const b of chosen) {
            const id = String(b._id);
            if (cards[id]) continue;
            fetchJson(`/api/armory/preview?id=${id}`).then((d) => setCards((prev) => ({ ...prev, [id]: d.card || null })));
        }
    }, [picked.join(',')]);

    return html`
        <div class="panel" id="compare">
            <div class="ph">
                <span class="t">Compare</span>
                <span class="rt">${chosen.length} of ${MAX_COMPARE} picked</span>
            </div>
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
                        ${chosen.map((b) => html`
                            <div key=${String(b._id)}>${cards[String(b._id)] ? renderV2(cards[String(b._id)].components) : html`<p class="empty">Loading…</p>`}</div>`)}
                    </div>
                    <table class="cmptab">
                        <thead><tr><th>Field</th>${chosen.map((b) => html`<th key=${String(b._id)}>${b.weaponName}</th>`)}</tr></thead>
                        <tbody>
                            ${COMPARE_FIELDS.map(([label, read]) => {
                                const values = chosen.map(read).map((v) => (v == null ? '—' : String(v)));
                                const same = values.every((v) => v === values[0]);
                                return html`
                                    <tr class=${same ? 'same' : 'diff'} key=${label}>
                                        <td class="cmpf">${label}</td>
                                        ${values.map((v, i) => html`<td key=${i}>${v}</td>`)}
                                    </tr>`;
                            })}
                        </tbody>
                    </table>
                </div>`}
        </div>
    `;
}

export function ArmoryRealm({ session }) {
    const [builds, setBuilds] = useState([]);
    const [coverageFilter, setCoverageFilter] = useState(null);   // {flag, category} | null
    const [weaponFilter, setWeaponFilter] = useState(null);
    const [error, setError] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [selectedBuildId, setSelectedBuildId] = useState(null);
    const [bulkBadgesIds, setBulkBadgesIds] = useState(null);
    const [notice, setNotice] = useState('');
    const [view, setView] = useState('Rack');
    const [compared, setCompared] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const overlay = useOverlay();

    function refresh() { fetchJson('/api/armory').then((d) => { if (d.signedOut || d.forbidden) return setError(true); setBuilds(d.builds || []); }); }
    useEffect(refresh, []);

    if (error) return html`<${NoAccess} />`;

    // Spec §8.2: Armory has no dates, so no Track -- Rack and Coverage are its two view layers. They shipped stacked on top of each other, which meant the Manifest (the thing you actually work in) started roughly a screen and a half down the page.
    const weapons = new Set(builds.map((b) => b.weaponName));
    const flagged = builds.filter((b) => (b.coverage || []).length).length;
    const modes = [...new Set(builds.map((b) => b.mode))].sort();
    const modeLine = modes.length ? modes.join(' · ') : '';
    const armoryStats = [
        { value: builds.length, label: builds.length === 1 ? 'build' : 'builds', lead: true, accent: 'var(--r-armory)' },
        { value: weapons.size, label: 'weapons' },
        { value: builds.length, label: 'builds' },
        { value: flagged, label: 'flagged', tone: flagged ? 'bad' : undefined },
    ];

    // Manifest/editing/preview all key off row.id -- the raw /api/armory response only ever carried _id, so nothing selectable/editable/previewable actually worked before this mapping existed. Coverage is now a per-CATEGORY cell rather than a whole-column total, so the filter carries both halves; Rack's cards filter by weapon. Both narrow the same Manifest rather than opening a second surface -- one working table, per the two-layer contract.
    const rows = builds
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

    async function handleExportSelection(ids) {
        const body = await fetchJson(`/api/armory/export?ids=${ids.join(',')}`);
        globalThis.open(`data:text/plain;charset=utf-8,${encodeURIComponent(body.text || '')}`, '_blank');
    }

    return html`
        <${Shell} realm="armory" session=${session} view=${view} viewOptions=${['Rack', 'Coverage', 'Compare']} onSetView=${setView}
                  overlaySlot=${overlay.render()}
                  commands=${[
                      { label: 'Add a build', group: 'armory', local: true, accent: 'var(--r-armory)',
                        keywords: ['new', 'create', 'loadout', 'weapon'], run: () => setShowAdd(true) },
                      { label: 'Compare the selected builds', group: 'armory', local: true, accent: 'var(--r-armory)',
                        keywords: ['diff', 'side by side', 'duplicate'], run: () => setView('Compare') },
                      { label: 'Clear the rack and coverage filters', group: 'armory', local: true, accent: 'var(--ink3)',
                        keywords: ['reset', 'all', 'unfilter'], run: () => { setWeaponFilter(null); setCoverageFilter(null); } },
                  ]}
                  masthead=${html`<${Masthead} title="Armory"
                                               sub="Every build the bot can show a player, ranked within its category, with whatever is wrong with it named."
                                               stats=${armoryStats} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      <!-- The .bed class is the adopted sheet's own main-plus-side split (1fr 340px), which is
                           exactly this layout. The armcols/armmain/armside names were portal-authored, with no rules
                           left behind them, so the preview column had been stacking under the rack rather than beside
                           it. (No backticks in this comment: an EVEN number of them inside an html template closes and
                           reopens it, which parses fine and turns the prose into expressions — this exact comment did
                           that, and the page rendered blank with "Cannot read properties of null (reading 'bed')".) -->
                      <div class="bed" id="armory">
                          <div>
                              ${showAdd ? html`<${AddBuildForm} onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)} />` : null}
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
                              : view === 'Rack'
                                  ? html`<${Rack} builds=${builds} onPick=${(w) => setWeaponFilter(weaponFilter === w ? null : w)} />`
                                  : view === 'Compare'
                                      ? html`<${Compare} builds=${rows} picked=${compared}
                                                         onPick=${(id) => setCompared(compared.includes(id) ? compared.filter((x) => x !== id) : [...compared, id])} />`
                                      : html`<${Coverage} builds=${builds} active=${coverageFilter} onFilter=${setCoverageFilter} />`}
                          </div>
                          <!-- 🔴 THE STANDALONE LIVE PREVIEW PANEL IS GONE. It showed the card for whichever row was
                               last clicked, beside a table you were not editing — a preview with nothing to preview
                               against. The build editor carries it in .bed-side, where the card and the fields that
                               produce it are one screen. Clicking a row opens the editor. -->
                          ${editingId ? null : html`<p class="empty" style="padding:18px">Click a row below to open it.</p>`}
                      </div>
                  `}
                  manifestSlot=${html`
                      <${Manifest} rows=${rows} columns=${ARMORY_COLUMNS} searchableFields=${['weaponName', 'buildName']}
                                   title="Every build" filterGroups=${ARMORY_FILTERS}
                                   headerRight=${weaponFilter || (coverageFilter ? COVERAGE_LABEL[coverageFilter.flag] : '')}
                                   bulkNote="Reversible — a staged deletion is discarded, never undone"
                                   bulkTier=${2} rowNoun=${['build', 'builds']}
                                   onRemove=${(row) => confirmBulkDelete([row.id])} removeLabel="Stage deletion"
                                   emptyText="No builds match this filter." 
                                   onAdd=${() => setShowAdd(true)} realm="armory" csrfToken=${session.csrfToken}
                                   buildEditOp=${buildArmoryEditOp}
                                   onEditError=${(msg) => setNotice(msg)}
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
