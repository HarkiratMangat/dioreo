// portal/ui/armory.js — ESM. The Armory realm: Rack (by category) + Coverage (data-quality flags) + an Add form + inline edit + bulk actions + a LIVE PREVIEW panel, reusing <Shell>/<Manifest> unchanged (spec §8.2). No dates, so no Track.
//
// buildArmoryAddOp/buildArmoryEditOp/parseBadgesToken come from armory.logic.js, loaded as a plain CLASSIC <script> before this module -- see track.js's header comment for why that is the real working cross-runtime resolution here, and why a literal `import {...} from './armory.logic.js'` would fail in every real browser (found live in season.js's own prior version).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Fold, Icon } from './icons.js';
import { Shell, Masthead, MastheadNew } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { useAsync, RealmShell } from './async.js';
import { stageOps } from './composeClient.js';
import { renderV2 } from './v2Render.js';
import { useOverlay, Drawer } from './overlay.js';
import { reportFailure } from './async.js';
import { downloadText } from './download.js';

const MODES = ['MP', 'DMZ'];
const CATEGORIES = ['AR', 'SMG', 'SNIPER', 'LMG', 'SHOTGUN', 'MARKSMAN', 'SECONDARIES', 'MELEE'];

// 🔴 THE MANIFEST NAMED EVERY BUILD AND SHOWED WHAT WAS IN NONE OF THEM. Weapon, build, category, mode and a comma-joined list of defect keys — so the one question you open a build list to answer, *what does this build actually run*, needed a click per row. The attachments peek and the badge chips are what the adopted table was styled for.
//
// ⚠️ THE PEEK SHOWS TWO AND COUNTS THE REST. Five attachment names is a paragraph in a table cell; two plus "+3" is the shape of the thing, and the editor is one click away for the rest.
//
// ⚠️ CATEGORY_CHIP_LABEL / CATEGORY_CHIP_ORDER LIVE IN armory.logic.js NOW, as bare globals the same way DMZ_RANGE_TOKENS always has — they are read by rackCategories(), which is arithmetic over the build list and therefore belongs somewhere a test can reach without a browser. They are still distinct from CATEGORY_LABEL below, which is verbose on purpose for the edit form's dropdown.
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

// ─── The weapon groups — plan pins batch 2 §10.4 G4, design board 2 version 21, 2026-09-15 00:23 EDT ────────────────── 🔴 ONE GROUP PER WEAPON, sorted by weapon name only (pin pmtylf7gz: "I'll never sort the armory's manifest by anything other than the Weapon Name"). Rendered through the shared Manifest's renderBody prop, so search, chips, selection, the bulk bar and the empty states stay the Manifest's own. Faults are colour and shape on the faulty cell, never prose in a row (C11); the details live in the header's Fix chip popover. Collapse state and List · By slot are Armory's, in memory, and reset on reload — the board never persisted them and Harkirat was not asked, so nothing is persisted.
const SLOT_ORDER = ['Optic', 'Muzzle', 'Barrel', 'Stock', 'Laser', 'Underbarrel', 'Rear Grip', 'Ammunition', 'Perk'];
const slotVar = (slot) => `var(--sl-${String(slot).toLowerCase().replace(/\s+/g, '-')})`;
// Attachments in Harkirat's display order (utils/adminParser.js CANONICAL_SLOT_ORDER, 2026-07-21), never the code's digit order; a name with no recorded slot keeps its stored position after the known ones.
function orderedAttachments(b) {
    const slots = b.attachmentSlots || [];
    return (b.attachments || []).map((name, i) => ({ name, i, slot: slots[i] || '', rank: SLOT_ORDER.indexOf(slots[i]) }))
        .sort((x, y) => (x.rank < 0 ? 99 : x.rank) - (y.rank < 0 ? 99 : y.rank) || x.i - y.i);
}
// The popover's plain words, one per fault (11:41 EDT asked for helpful, short copy). stale-90d is age, not a fault, so it has no line.
const FAULT_TEXT = {
    'code-length-mismatch': (b) => `Code lists ${Math.floor(String(b.shareCode || '').length / 2)} attachments, build has ${(b.attachments || []).length}`,
    'no-code': () => 'No gunsmith code to copy',
    'few-attachments': (b) => `Only ${(b.attachments || []).length} of 5 attachments`,
    'near-duplicate': () => 'Almost the same as another build',
    'missing-image': () => 'No image uploaded',
};
const faultsOf = (b) => (b.coverage || []).filter((f) => FAULT_TEXT[f]);
function weaponTags(b) {
    const tags = [];
    if (b.mode !== 'DMZ' && b.categoryRank) tags.push({ t: String(b.categoryRank), label: String(b.categoryRank).replace(/^top(\d)$/, 'TOP $1').toUpperCase() });
    if (b.mode === 'DMZ' && b.dmzRangeRank) tags.push({ t: 'dmz', label: String(b.dmzRangeRank).replace(/-/g, ' ').toUpperCase() });
    if (b.isMeta) tags.push({ t: 'meta', label: 'META' });
    if (b.isToxic) tags.push({ t: 'toxic', label: 'TOXIC' });
    return tags;
}
function copyToClipboard(text) {
    try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch { /* a blocked clipboard leaves the flash unshown, never an error */ }
}

function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, onCollapseAll }) {
    const { visible, selected, sort, setSort, onRowClick, selectedRowId, onRemove, stateOf, toggle, setMany } = api;
    const [flash, setFlash] = useState(null);
    const [openFix, setOpenFix] = useState(null);
    const dir = sort.column === 'weaponName' && sort.direction === 'desc' ? 'desc' : 'asc';
    const byName = new Map();
    for (const b of visible) {
        if (!byName.has(b.weaponName)) byName.set(b.weaponName, []);
        byName.get(b.weaponName).push(b);
    }
    const groups = [...byName.entries()].map(([name, list]) => ({ name, builds: list.map((b) => ({ b, n: buildNumberOf(builds, b).n })).sort((x, y) => x.n - y.n) }))
        .sort((x, y) => x.name.localeCompare(y.name, undefined, { sensitivity: 'base', numeric: true }) * (dir === 'desc' ? -1 : 1));
    const allShut = groups.length > 0 && groups.every((g) => collapsed.has(g.name));
    const copy = (key, text) => { copyToClipboard(text); setFlash(key); setTimeout(() => setFlash((k) => (k === key ? null : k)), 1200); };
    const keyAct = (fn) => (e) => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
    const cbKey = (fn) => (e) => { if (e.key !== ' ' && e.key !== 'Enter') return; e.preventDefault(); e.stopPropagation(); fn(); };
    const dmz = mode === 'DMZ';

    return html`
        <div class="wg-wrap">
            <div class="wg-heads">
                <span></span>
                <span><button type="button" class="wg-sort" aria-sort=${dir === 'asc' ? 'ascending' : 'descending'}
                              onClick=${() => setSort({ column: 'weaponName', direction: dir === 'asc' ? 'desc' : 'asc' })}>Weapon<${Icon} name=${dir === 'asc' ? 'chevron-up' : 'chevron-down'} /></button></span>
                <button type="button" class="wg-fold" onClick=${() => onCollapseAll(allShut ? [] : groups.map((g) => g.name))}><${Fold} open=${!allShut} />${allShut ? 'Expand all' : 'Collapse all'}</button>
            </div>
            ${groups.map((g) => {
                const first = g.builds[0].b;
                const ids = g.builds.map((x) => x.b.id);
                const allSel = ids.every((id) => selected.has(id));
                const someSel = !allSel && ids.some((id) => selected.has(id));
                const shut = collapsed.has(g.name);
                const faulty = g.builds.map((x) => ({ ...x, f: faultsOf(x.b) })).filter((x) => x.f.length);
                const tags = weaponTags(first);
                const slotsHere = SLOT_ORDER.filter((s) => g.builds.some((x) => (x.b.attachmentSlots || []).includes(s)));
                return html`
                <div class="wg" key=${g.name} style=${`--c:${first.accentHex || 'var(--ink3)'}`}>
                    <div class="wg-h" tabIndex="0" aria-expanded=${shut ? 'false' : 'true'} onClick=${() => onToggleGroup(g.name)} onKeyDown=${keyAct(() => onToggleGroup(g.name))}>
                        <span class="wg-cb" role="checkbox" tabIndex="0" aria-checked=${allSel ? 'true' : someSel ? 'mixed' : 'false'} aria-label=${`Select every ${g.name} build`}
                              onClick=${(e) => { e.stopPropagation(); setMany(ids, !allSel); }} onKeyDown=${cbKey(() => setMany(ids, !allSel))}><span class=${'cb' + (allSel ? ' on' : '')}></span></span>
                        <div class="wg-line"><b>${g.name}</b><small>${CATEGORY_CHIP_LABEL[first.category] || first.category}<em class="wg-nb">${g.builds.length} build${g.builds.length === 1 ? '' : 's'}</em></small>${tags.length ? html`<span class="wg-tags">${tags.map((t) => html`<span class="wg-tag" data-t=${t.t} key=${t.t}>${t.label}</span>`)}</span>` : null}</div>
                        ${faulty.length ? html`<span class="wg-fwrap" onClick=${(e) => e.stopPropagation()}>
                            <button type="button" class="wg-fsum" aria-expanded=${openFix === g.name ? 'true' : 'false'} onClick=${() => setOpenFix(openFix === g.name ? null : g.name)}><${Icon} name="triangle-alert" />${faulty.length === 1 ? 'Fix build' : 'Fix builds'}<span class="wg-fnos">${faulty.map((x) => html`<i key=${x.n}>${x.n}</i>`)}</span></button>
                            <span class="wg-fpop" role="tooltip">${faulty.map((x) => html`<span class="wg-fpr" key=${x.n}><i>${x.n}</i><span>${x.f.map((f) => html`<span key=${f}>${FAULT_TEXT[f](x.b)}</span>`)}</span></span>`)}</span>
                        </span>` : html`<span></span>`}
                        <button type="button" class="wg-ib wg-fbtn" aria-expanded=${shut ? 'false' : 'true'} aria-label=${`${shut ? 'Expand' : 'Collapse'} ${g.name}`}
                                onClick=${(e) => { e.stopPropagation(); onToggleGroup(g.name); }}><${Fold} open=${!shut} /></button>
                    </div>
                    ${!shut && attView === 'slot' && slotsHere.length ? html`<div class=${'wg-strip' + (dmz ? ' dmz' : '')}><span></span><span></span><div class="wg-slots" style=${`--n:${slotsHere.length}`}>${slotsHere.map((s) => html`<span key=${s}>${s}</span>`)}</div><span></span>${dmz ? null : html`<span></span>`}<span></span></div>` : null}
                    ${shut ? null : g.builds.map(({ b, n }) => {
                        const f = faultsOf(b);
                        const label = displayBuildLabel(b);
                        const sel = selected.has(b.id);
                        const open = selectedRowId != null && String(selectedRowId) === String(b.id);
                        const atts = orderedAttachments(b);
                        const empties = (b.attachments || []).length <= 2 ? Math.max(0, 5 - atts.length) : 0;
                        const codeBad = (b.coverage || []).includes('code-length-mismatch');
                        return html`
                        <div key=${b.id} class=${'wg-r' + (f.length ? ' bad' : '') + (stateOf(b) === 'staged' ? ' staged' : '') + (sel ? ' sel' : '') + (open ? ' open' : '') + (dmz ? ' dmz' : '')}
                             tabIndex="0" onClick=${() => onRowClick(b)} onKeyDown=${keyAct(() => onRowClick(b))}>
                            <span class="wg-cb" role="checkbox" tabIndex="0" aria-checked=${sel ? 'true' : 'false'} aria-label=${`Select ${b.weaponName} build ${n}`}
                                  onClick=${(e) => { e.stopPropagation(); toggle(b.id); }} onKeyDown=${cbKey(() => toggle(b.id))}><span class=${'cb' + (sel ? ' on' : '')}></span></span>
                            <span class="wg-ix" title=${f.includes('near-duplicate') ? FAULT_TEXT['near-duplicate']() : null}>${n}</span>
                            <div class=${'wg-main' + (label ? ' named' : '')}>
                                ${label ? html`<span class="wg-plate"><small>Build name</small><span>${label}</span></span>` : null}
                                ${attView === 'slot' && slotsHere.length
                                    ? html`<div class="wg-slots" style=${`--n:${slotsHere.length}`}>${slotsHere.map((s) => { const at = (b.attachmentSlots || []).indexOf(s); return at >= 0
                                        ? html`<span class="wg-sc" key=${s} style=${`--sl:${slotVar(s)}`}>${b.attachments[at]}</span>`
                                        : html`<span class="wg-sc empty" key=${s}>—</span>`; })}</div>`
                                    : html`<div class="wg-rail">${atts.map((x) => html`<span class="wg-at" key=${x.i} title=${x.slot || null} style=${SLOT_ORDER.includes(x.slot) ? `--sl:${slotVar(x.slot)}` : null}>${x.name}</span>`)}${Array.from({ length: empties }, (_, i) => html`<span class="wg-at gap" key=${'e' + i}>Empty</span>`)}</div>`}
                            </div>
                            <span class=${'wg-im' + (b.imageKey ? '' : ' no')} role="img" aria-label=${b.imageKey ? 'Image uploaded' : 'No image uploaded'} title=${b.imageKey ? 'Image uploaded' : 'No image uploaded'}><${Icon} name=${b.imageKey ? 'image' : 'image-off'} /></span>
                            ${dmz ? null : b.shareCode
                                ? html`<button type="button" class="wg-code" aria-label=${`Copy gunsmith code ${b.shareCode}`} onClick=${(e) => { e.stopPropagation(); copy(b.id + ':code', copyCodeText(b)); }}><span class="wg-ig"><span class="wg-igf"><span class=${'wg-ct' + (codeBad ? ' bad' : '')} title=${codeBad ? FAULT_TEXT['code-length-mismatch'](b) : null}>${b.shareCode}</span></span><span class="wg-igb"><${Icon} name=${flash === b.id + ':code' ? 'check' : 'copy'} /></span></span></button>`
                                : html`<span class="wg-ig none"><span class="wg-cnone"><${Icon} name="triangle-alert" />No code</span></span>`}
                            <div class="wg-acts" onClick=${(e) => e.stopPropagation()}>
                                <button type="button" class="wg-ib" aria-label="Copy share command" data-tip="Copy share command" onClick=${() => copy(b.id + ':share', shareCommandText(b, n))}><${Icon} name=${flash === b.id + ':share' ? 'check' : 'share-2'} /></button>
                                <i class="wg-vr" aria-hidden="true"></i>
                                <button type="button" class="wg-ib wg-del" aria-label=${`Stage deletion of ${b.weaponName} build ${n}`} onClick=${() => onRemove(b)}><${Icon} name="trash-2" /></button>
                            </div>
                        </div>`;
                    })}
                </div>`;
            })}
        </div>`;
}

// 🔴 'no-badges' and 'wrong-attachment-count' RETIRED 2026-09-13 17:36 EDT (pins batch 2, pin pmtylf7gz) -- see portal/api/armory.js's coverageFlags for why neither was a real defect. 'few-attachments' and 'code-length-mismatch' are their replacements, not renames: the flag KEYS changed, not just the label text.
const COVERAGE_LABEL = {
    'missing-image': 'Missing image', 'few-attachments': '2 or fewer attachments',
    'stale-90d': 'Not updated in 90 days', 'near-duplicate': 'Near-duplicate code',
    'no-code': 'No gunsmith code', 'code-length-mismatch': 'Code length doesn’t match attachments',
};

// Rack — what exists, in the bot's REAL per-category accent (spec §8.2).
//
// `accent` is real DATA (portal/api/armory.js stamps it from getMpCategoryAccent), not a CSS token. That is the correct mechanism and deliberately unlike Season's --topic-accent tokens: the bot owns these hues, so reading them from the payload means the two can never drift apart.
//
// 🔴 IT IS GROUPED BY CATEGORY AND IT OPENS CLOSED — Harkirat, Pin 21: "WHY do I have to scroll all the way". This reverses the 2026-08-26 rebuild onto rank tiers, and the reasoning that rebuild gave is still true and is no longer the whole story: a tier board answers "what is ranked where", which is the question the badges exist for, but it answers it by putting the entire catalogue on screen at once in five rows nothing could close. Category is the axis a reader arrives with, and rank has moved one level down rather than away — the weapon groups inside an open category are ordered best-first and each carries its tier as a `.bdg.rank` chip, the same mark the Manifest uses for the same fact. ⚠️ RANK_ORDER / RANK_LABEL / RANK_KEY / rankOf() MOVED TO armory.logic.js in the same change that made the rack category-first: they are what orders the weapon groups inside a category and what labels the teaser on a closed header, so they are read by rackCategories() and are tested there. RANK_KEY's values are still CSS class names — they ride on the weapon group now (.bgrp.t-best) rather than on a tier row, because there is no tier row left.

// 🔴 THE OPEN SET IS STORED, NOT THE CLOSED ONE, AND THAT IS WHAT MAKES "CLOSED BY DEFAULT" SURVIVE A NEW CATEGORY. The tier board stored the CLOSED keys, which works only while the set of rows is fixed: to open closed you have to seed the store with every category that exists, and the first SHOTGUN build to land is then absent from that seed and arrives OPEN — the one state the default exists to forbid. An empty store is all-closed with nothing to enumerate, so a category that appears later inherits the default for free.
const COPEN_KEY = 'dioreo-armory-catopen';
function loadCOpen() { try { return new Set(JSON.parse(sessionStorage.getItem(COPEN_KEY)) || []); } catch { return new Set(); } }
function saveCOpen(set) { try { sessionStorage.setItem(COPEN_KEY, JSON.stringify([...set])); } catch (e) {} }

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

function BuildChip({ b, onPick, onEdit }) {
    const { faults, aged } = splitCoverage(b);
    const [copied, setCopied] = useState(false);
    const code = b.shareCode || '';
    const dmz = b.mode === 'DMZ';
    const noCode = !dmz && !code;
    // 🔴 THE CODE IS THE ROW. Harkirat, 2026-09-10 16:32 EDT: "why not provide the gunsmith code directly in each row, with a method to copy that code, as well as a button to actual signal that THIS IS A CLICKABLE, ACTIONABLE item... nothing about it currently implies i could click it and directly edit." Measured against the dev catalogue: 123 of 133 builds carry a shareCode, all exactly ten characters, while buildName is an INDEX on almost all of them ("Build 1") that the COMPANION already calls meaningless. So the code is the identity and the name is not. ⚠️ THE NAME NEVER STANDS IN FOR THE CODE — his correction at 16:34 EDT. An MP build with no code shows that it has no code, because that is a real gap the new no-code flag now reports; DMZ shows no code SLOT at all, because DMZ has none by design and an em dash there would invent a defect.
    const copy = (e) => {
        e.stopPropagation();
        if (!code || !navigator.clipboard) return;
        navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {});
    };
    const open = () => onEdit && onEdit(b);
    return html`
        <div class=${'brow' + (faults.length ? ' bad' : '') + (aged ? ' aged' : '') + (noCode ? ' nocode' : '')}
             data-id=${b._id || b.id} tabindex="0" role="button"
             onClick=${open}
             onKeyDown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
             aria-label=${`Edit ${b.weaponName} ${code || b.buildName}`}>
            ${dmz ? html`<span class="brow-n">${b.buildName}</span>`
                : noCode ? html`<span class="brow-none">no code</span><span class="brow-n sec">${b.buildName}</span>`
                : html`<code class=${'brow-c' + (copied ? ' ok' : '')}>${copied ? 'copied' : code}</code>
                       <button class="brow-cp" onClick=${copy} title="Copy the gunsmith code"
                               aria-label=${`Copy the gunsmith code ${code}`}>
                           <${Icon} name=${copied ? 'check' : 'copy'} cls="sm" /></button>`}
            <span class="brow-a">${(b.attachments || []).length}</span>
            ${b.isToxic ? html`<${Icon} name="skull" cls="sm" label="toxic" />` : null}
            <span class="brow-e" aria-hidden="true"><${Icon} name="square-pen" cls="sm" /><b>Edit</b></span>
        </div>`;
}

// 🔴 ONE CARD SHAPE, ALWAYS — a weapon with one build is a group of one. Returning a bare chip for singles and a group for multiples put two visual languages side by side for the same kind of object, which Harkirat read as a rendering bug rather than as a distinction. And siblings genuinely ARE a group: six pairs of adjacent cards differed only by a stored buildName that is an index ("Build 1", "Build 2"), so the rack was asking a reader to spot a one-character difference between two identical rectangles.
//
// ⚠️ THE TIER RIDES HERE NOW. With categories as the top axis, a weapon's rank has to be visible on the weapon or it is nowhere — so the group carries `t-<tierKey>` (the class names app.css grades) and prints the tier in the Manifest's own short spelling, TOP3 rather than "Top 3", because one field wearing two spellings on one screen is the defect the Category column already had to have fixed once.
function WeaponGroup({ group, onPick, onEdit }) {
    const hurt = group.builds.filter((b) => splitCoverage(b).faults.length).length;
    const short = group.tier === 'best' ? 'BEST' : String(group.tier).toUpperCase();
    return html`
        <div class=${`bgrp t-${group.tierKey}`} style=${`--c:${group.builds[0].accent || 'var(--ink3)'}`}>
            <!-- 🔴 THE WEAPON HEADER HAD NO HANDLER AT ALL — the other half of pin 60. A reader who clicks
                 the weapon's NAME is asking for that weapon, and the group carries the same answer its chips
                 do. It is a real button rather than a div with a role, so Enter and Space come free. -->
            <div class="bgrp-h">
                <button type="button" class="bgrp-w" onClick=${() => onPick(group.weapon)}
                        aria-label=${`Filter the Manifest to ${group.weapon}`}><i aria-hidden="true"></i><b>${group.weapon}</b></button>
                <span class="bgrp-m">
                    ${group.builds.some((b) => b.isMeta) ? html`<span class="bc-meta">META</span>` : null}
                    ${group.tier ? html`<b class="bdg rank">${short}</b>` : null}
                    <span class="bgrp-n">${group.builds.length} build${group.builds.length > 1 ? 's' : ''}</span>
                </span>
            </div>
            ${group.builds.map((b) => html`<${BuildChip} key=${b._id || b.id} b=${b} onPick=${onPick} onEdit=${onEdit} />`)}
        </div>`;
}

// 🔴 THE VIEW PANELS USED TO CARRY THEIR OWN `.ph`, so the page drew TWO view headers where every design draws one: the Shell's bar (mode · views · legend) and then a second strip repeating the view's name and its count. The design puts that count in the Shell bar's own right-aligned `.sp` meta line (armory.html's `#viewMeta`), and the Shell has had a `meta` prop for it since Broadcast needed one — Armory simply never passed it. RackNote/RepairNote survive as the derivations behind that line, which is the point of them: the panel and the masthead cannot disagree.
//
// ⚠️ THE BODY IS NOT RENDERED WHILE A CATEGORY IS CLOSED, which is a second mechanism on top of `.trow.tclosed .trow-body{display:none}` and is deliberate rather than redundant: closed is the resting state of every category now, so always-rendering would leave the whole catalogue in the DOM — a hundred and thirty cards, every one of them a tab stop's worth of markup — to draw a page that shows seven headers.
function Rack({ builds, onPick, onAdd, onEdit }) {
    const [copen, setCOpen] = useState(loadCOpen);
    const cats = rackCategories(builds);
    const toggle = (k) => setCOpen((prev) => {
        const next = new Set(prev);
        next.has(k) ? next.delete(k) : next.add(k);
        saveCOpen(next);
        return next;
    });
    const setAll = (open) => {
        const next = new Set(open ? cats.map((c) => c.category) : []);
        saveCOpen(next);
        setCOpen(next);
    };
    const openCount = cats.filter((c) => copen.has(c.category)).length;

    // An empty armory is not an error and it is not a table with no rows: it is a page whose only useful content is the way out of it, so it carries the button rather than describing one.
    if (!builds.length) {
        return html`
            <div id="rack">
                <p class="empty"><b>Nothing in this armory yet.</b>${' '}
                    A build is a weapon, a category and the attachments on it — a gunsmith code, an image and the
                    badges can all arrive later.</p>
                <div class="racktools"><button class="pill lead" onClick=${onAdd}>Add the first build</button></div>
            </div>`;
    }

    return html`
        <!-- NO .panel HERE. Shell already draws section.panel around the view slot, so a view that opened its own
             was a panel inside a panel: measured .rack at 1114px starting at x=122, against the design's 1160 at
             x=99, because the outer panel's 23px of padding applied twice. -->
        <div id="rack">
            <div class="racktools">
                <button class="chip" disabled=${openCount === cats.length} onClick=${() => setAll(true)}>Expand all</button>
                <button class="chip" disabled=${openCount === 0} onClick=${() => setAll(false)}>Collapse all</button>
                <span class="rkt-n">${cats.length} categories · ${builds.length} builds · ${openCount === 0 ? 'all closed — open the one you came for' : openCount + ' open'}</span>
            </div>
            <div class="rack">
                ${cats.map((c) => {
                    const open = copen.has(c.category);
                    return html`
                        <div key=${c.category} class=${'trow tcat' + (open ? '' : ' tclosed')} data-cat=${c.category}
                             style=${`--c:${c.accent || 'var(--ink3)'}`}>
                            <!-- A REAL BUTTON, not a div wearing role="button". The div version carried its own
                                 Enter/Space handler, which is the whole of what a button gives you for free and none
                                 of what it gives a screen reader's forms mode or a browser's own focus ring. -->
                            <button type="button" class="trow-h" aria-expanded=${open ? 'true' : 'false'}
                                    onClick=${() => toggle(c.category)}
                                    aria-label=${`${c.label}: ${c.count} build${c.count === 1 ? '' : 's'} across ${c.weapons} weapon${c.weapons === 1 ? '' : 's'}. Best ranked: ${c.teaser || 'nothing ranked'}.`}>
                                <span class="trow-k" aria-hidden="true"><i class="catdot"></i></span>
                                <!-- The separating spaces are LOAD-BEARING, not formatting: without them the row's
                                     accessible name fuses to "Assault35", which is what --triggers reports and what a
                                     screen reader reads out. -->
                                <span class="trow-t">${c.label}</span> <span class="tcat-top" aria-hidden="true">${c.teaserRank}${c.teaser ? html` · <b>${c.teaser}</b>` : ''}</span> <span class="trow-n">${c.count}</span>
                                <${Fold} open=${open} cls="sm trow-i" />
                            </button>
                            <div class="trow-body">
                                ${open ? c.groups.map((g) => html`<${WeaponGroup} key=${g.weapon} group=${g} onPick=${onPick} onEdit=${onEdit} />`) : null}
                            </div>
                        </div>`;
                })}
            </div>
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
    'few-attachments': 'Two slots filled or fewer usually means the build was started and never finished.',
    'stale-90d': 'Still served, still correct as far as anything here knows — just not looked at in a while.',
    'near-duplicate': 'Two builds share a gunsmith code, so one of them is showing the other one’s guns.',
    'no-code': 'No gunsmith code, so a player reading this build has nothing to paste into the game.',
    'code-length-mismatch': 'A real code pairs two characters per attachment; this one’s length disagrees with its own build.',
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
            <!-- pmtvqazpj: .callout is margin:0 everywhere and every OTHER caller supplies the gap externally
                 (a wrapping .panel with its own margin in access.js/broadcast.js) — this is the one bare
                 usage, so its bottom border sat flush on the card grid below with 0px between them. Matched
                 to .repbar's own margin-bottom (14px) directly above it for one rhythm down the column. -->
            <div class="callout" style="margin-bottom:14px">
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

// Build name field cap (pins batch 2, plan §10.4 G6 row 2) — measured on the design board's plate: an all-caps name never needs a third line at this length, and it is the shared limit the Discord modal's own `Build Name (optional) | Share Code (optional)` field is sized around too.
const BUILD_NAME_MAX = 32;

// ── FUZZY FIELDS — a native <datalist>, not a custom dropdown ───────────────────────────────────
//
// Row 16 (Harkirat, 2026-09-13 23:53 EDT): "does the attachment's field support fuzzy search/auto- complete? because it should. Same with the weapon name field." The MATCHING is real fuzzy (substring, via matchWeapons/this module's own filter below) — only the WIDGET is the platform's own <datalist> rather than a hand-built popover, which is the cheaper way to ship "type and see matches" without a second focus-trap and keyboard contract to get right inside a drawer that already has one (the drawer itself). candidates are recomputed per keystroke from an already-short catalogue, never the raw list.
function useCandidates(all, query, limit = 8) {
    const needle = String(query || '').trim().toLowerCase();
    if (!needle) return [];
    return (all || []).filter((n) => n.toLowerCase().includes(needle)).slice(0, limit);
}

function AttachmentRow({ n, slotLabel, value, onInput, onClear, catalogueNames, fromCode }) {
    const dlId = `ab-att-dl-${n}`;
    const candidates = useCandidates(catalogueNames, value, 8);
    return html`
        <div class=${'atr' + (fromCode ? ' atr-fill' : '')} key=${n}>
            <span class="atn">${slotLabel || n}</span>
            <label class="sr" for=${`ab-att-${n}`}>${slotLabel ? `${slotLabel} attachment` : `Attachment ${n}`}</label>
            <input class="ati" id=${`ab-att-${n}`} list=${dlId} value=${value}
                   placeholder=${slotLabel ? `Search ${slotLabel.toLowerCase()} attachments` : (ATT_HINTS[n - 1] || 'Attachment — type to search')}
                   autocomplete="off" onInput=${onInput} />
            <datalist id=${dlId}>${candidates.map((c) => html`<option value=${c} key=${c} />`)}</datalist>
            ${fromCode ? html`<i class="atfill" aria-label="Filled from the gunsmith code"></i>` : null}
            <button class="atx" aria-label=${`Clear ${slotLabel || `attachment ${n}`}`}
                    onClick=${onClear}><${Icon} name="x" cls="sm" /></button>
        </div>`;
}

// ── ADD BUILD ────────────────────────────────────────────────────────────────────────────────
//
// Row 4 (amended 2026-09-14 01:37 EDT, G9): Weapon — fuzzy search over existing weapons; picking one fills Category. Build number is computed from real siblings and locked into the Label field's left edge; the field itself is an OPTIONAL human label (spec §6/G6: display-only, nothing stored changes). Row 15: a pasted MP gunsmith code fills attachment rows from another build of the SAME weapon+mode that carries the identical digit-letter pair (codeFill, armory.logic.js) — never guessed, never cross-weapon (that IS the falsifier: two weapons sharing a pair must never cross-fill).
function AddBuildPanel({ f, setF, atts, setAtts, filledFromCode, builds, weaponNames, imgBusy, onImagePick }) {
    const set = (patch) => setF((prev) => ({ ...prev, ...patch }));
    const dmz = f.mode === 'DMZ';
    const weaponKey = f.weaponName.trim().toLowerCase().replace(/\s+/g, '');
    const siblings = weaponKey ? builds.filter((b) => b.weaponKey === weaponKey && b.mode === f.mode) : [];
    const buildNo = siblings.length + 1;
    const code = f.shareCode.trim();
    const catalogue = slotCatalogue(builds, f.mode);
    const catalogueNames = Object.keys(catalogue);
    const img = f.imageKey.trim();
    const nameLen = f.buildName.length;

    return html`
        <div class="bed-main">
            <section class="bf-sec">
                <h4 class="bf-h">Build<span class="bf-rule"></span></h4>
                <div class="modesw" role="group" aria-label="Which armory this build belongs to">
                    ${MODES.map((m) => html`
                        <button key=${m} data-arm=${m} aria-pressed=${f.mode === m ? 'true' : 'false'}
                                onClick=${() => { set({ mode: m, rank: '' }); setAtts(Array(m === 'DMZ' ? 9 : 5).fill('')); }}>${m}</button>`)}
                </div>
                <div class="bed-g2" style="margin-top:var(--s3)">
                    <div class="dwfield"><label for="ab-weapon"><span>Weapon name <span class="req">*</span></span></label>
                        <input id="ab-weapon" list="ab-weapon-dl" value=${f.weaponName} placeholder="AK117" autocomplete="off"
                               onInput=${(e) => set({ weaponName: e.target.value })} />
                        <datalist id="ab-weapon-dl">${useCandidates(weaponNames, f.weaponName, 8).map((w) => html`<option value=${w} key=${w} />`)}</datalist>
                    </div>
                    <div class="dwfield"><label for="ab-build"><span>Label <span class="bf-n">${nameLen} / ${BUILD_NAME_MAX}</span></span></label>
                        <div class="bf-buildno-wrap">
                            <span class="bf-buildno">BUILD ${buildNo}</span>
                            <input id="ab-build" value=${f.buildName} placeholder=${`Build ${buildNo}`} autocomplete="off"
                                   maxLength=${BUILD_NAME_MAX}
                                   onInput=${(e) => set({ buildName: e.target.value.slice(0, BUILD_NAME_MAX) })} />
                        </div>
                    </div>
                </div>
                <div class="dwfield"><label for="ab-category"><span>Category <span class="req">*</span></span></label>
                    <select id="ab-category" value=${f.category} onChange=${(e) => set({ category: e.target.value })}>
                        ${CATEGORIES.map((c) => html`<option value=${c} key=${c}>${c} — ${CATEGORY_LABEL[c] || c}</option>`)}
                    </select></div>
            </section>

            ${!dmz ? html`
                <section class="bf-sec">
                    <h4 class="bf-h">Gunsmith code<span class="bf-rule"></span></h4>
                    <div class="dwfield code-field"><label for="ab-share"><span>Share code</span></label>
                        <input id="ab-share" value=${f.shareCode} placeholder="2A4B5A8C9C" autocomplete="off" spellcheck="false" maxLength="18"
                               class=${code && code.length !== atts.filter((a) => a.trim()).length * 2 && code.length ? 'bad' : ''}
                               onInput=${(e) => set({ shareCode: e.target.value })} />
                        <button class="chip" type="button" disabled=${!code}
                                onClick=${() => { navigator.clipboard?.writeText(code); }}><${Icon} name="copy" cls="sm" />Copy</button>
                    </div>
                </section>` : null}

            <section class="bf-sec">
                <h4 class="bf-h">Attachments <span class="bf-n">${atts.filter((a) => a.trim()).length} of ${atts.length}${atts.filter((a) => a.trim()).length <= 2 ? ' — flagged' : ''}</span><span class="bf-rule"></span></h4>
                <div class="atlist">
                    ${atts.map((a, i) => html`
                        <${AttachmentRow} key=${i} n=${i + 1} slotLabel=${dmz ? '' : (filledFromCode[i] && filledFromCode[i].label) || ''}
                                          value=${a} fromCode=${Boolean(filledFromCode[i] && filledFromCode[i].name === a && a)}
                                          catalogueNames=${catalogueNames}
                                          onInput=${(e) => setAtts(atts.map((v, n) => (n === i ? e.target.value : v)))}
                                          onClear=${() => setAtts(atts.map((v, n) => (n === i ? '' : v)))} />`)}
                </div>
            </section>

            <section class="bf-sec">
                <h4 class="bf-h">Image<span class="bf-rule"></span></h4>
                <div class="segsw" role="group" aria-label="How to set this build's image">
                    <button type="button" aria-pressed=${f.imageMethod !== 'existing' ? 'true' : 'false'}
                            onClick=${() => set({ imageMethod: 'upload' })}>Upload or link</button>
                    <button type="button" aria-pressed=${f.imageMethod === 'existing' ? 'true' : 'false'}
                            onClick=${() => set({ imageMethod: 'existing' })}>Existing key</button>
                </div>
                ${f.imageMethod === 'existing' ? html`
                    <div class="dwfield"><label for="ab-image"><span>Cloudinary key, or a full URL</span></label>
                        <input id="ab-image" value=${f.imageKey} placeholder="AK117-1" autocomplete="off" spellcheck="false"
                               onInput=${(e) => set({ imageKey: e.target.value, imageSourceUrl: '' })} /></div>
                ` : html`
                    <div class="imgdrop">
                        <label class="dwfield"><span>Paste a link</span>
                            <input value=${f.imageLinkText || ''} placeholder="https://…" autocomplete="off" spellcheck="false"
                                   onInput=${(e) => {
                                       const v = e.target.value;
                                       set({ imageLinkText: v, imageSourceUrl: /^https?:\/\//i.test(v.trim()) ? v.trim() : '', imageKey: img || deriveNextImageKey(builds, f.weaponName, f.mode) });
                                   }} /></label>
                        <label class="chip filedrop">
                            <!-- 🔴 NEVER set accept to a bare image-wildcard string. scripts/buildPortal.js's
                                 comment-stripper treats the slash-star inside that string as a block-comment OPEN
                                 with no matching close, and silently deletes every line between here and the next
                                 unrelated close-comment in the file (found live: it ate the whole tail of this
                                 module, including ArmoryRealm's own export). List the real MIME types instead. -->
                            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none"
                                   onChange=${(e) => onImagePick(e.target.files && e.target.files[0])} />
                            ${imgBusy ? 'Uploading…' : 'Or drop a screenshot'}
                        </label>
                        ${f.imageSourceUrl ? html`
                            <div class="imgpreview">
                                <img src=${f.imageSourceUrl} onError=${(e) => e.target.classList.add('bad')} />
                                <span class="imgkey">${img || deriveNextImageKey(builds, f.weaponName, f.mode)}</span>
                            </div>` : null}
                    </div>`}
            </section>

            <section class="bf-sec">
                <h4 class="bf-h">Badges<span class="bf-rule"></span></h4>
                <div class="bf-badges">
                    <label class="bf-tog"><input type="checkbox" checked=${f.isMeta} onChange=${(e) => set({ isMeta: e.target.checked })} /><span>Meta</span></label>
                    <label class="bf-tog"><input type="checkbox" checked=${f.isToxic} onChange=${(e) => set({ isToxic: e.target.checked })} /><span>Toxic</span></label>
                    <div class="dwfield bf-rank"><label for="ab-rank"><span>${dmz ? 'Range tier' : 'Tier in AR'}</span></label>
                        <select id="ab-rank" value=${f.rank} onChange=${(e) => set({ rank: e.target.value })}>
                            <option value="">None</option>
                            ${(dmz ? DMZ_RANGE_TOKENS : MP_RANK_TOKENS).map((t) => html`
                                <option value=${t} key=${t}>${dmz ? t.replace('-', ' · ') : (RANK_LABEL[t] || t)}</option>`)}
                        </select></div>
                </div>
            </section>

            <section class="bf-sec">
                <h4 class="bf-h">Description<span class="bf-rule"></span></h4>
                <div class="dwfield"><label for="ab-usage"><span>Usage blurb</span></label>
                    <textarea id="ab-usage" rows="2" value=${f.description} placeholder="When to reach for this build."
                              onInput=${(e) => set({ description: e.target.value })}></textarea></div>
            </section>
        </div>`;
}

function BulkBadgesPanel({ ids, onApply, onCancel }) {
    const [badges, setBadges] = useState('');
    return html`
        <div style="display:flex;gap:8px;align-items:center;padding:10px 14px;border-top:1px dashed var(--rule)">
            <!-- ⚠️ (s) IS USED NOWHERE ELSE IN THIS PRODUCT and reads as a form field rather than a sentence —
                 copy audit §D2, applied 2026-09-04 20:53 EDT. The count is known at render time, so the word can simply agree. -->
            <label class="sr" for="bulk-badges">Badges to apply to ${ids.length} selected ${ids.length === 1 ? 'build' : 'builds'}</label>
            <input id="bulk-badges" placeholder=${`Badges for ${ids.length} ${ids.length === 1 ? 'build' : 'builds'} (e.g. meta, top3)`} value=${badges} onInput=${(e) => setBadges(e.target.value)} style="flex:1" />
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
    // harden — two things make a Stage pointless, and both are stated on the footer line rather than left for the Review screen to discover. A no-op edit is the interesting one: it is not harmless, it puts a row on the only screen that commits for somebody to read, understand and decide about, and it changes nothing when they do.
    const changed = editedFields(build, draft);
    const blockers = editorBlockers(build, draft);
    return html`
        <${Drawer} eyebrow=${`loadout.edit · ${build.mode} · tier 1`}
                   title=${`${build.weaponName} — ${build.buildName || 'Standard Build'}`} wide onClose=${onClose}
                   actions=${html`
                       <span role="status" class=${'why' + (blockers.length ? ' blocked' : '')}>${blockers.length
                           ? `Still needs ${blockers[0]}.`
                           : `${changed.length} field${changed.length === 1 ? '' : 's'} changed, staged as one operation.`}</span>
                       <button class="btn" onClick=${onClose}>Cancel</button>
                       <button class="btn go" disabled=${blockers.length > 0} onClick=${stage}>Stage this edit</button>`}>
            <!-- The bform class here for the same reason as the add drawer above: it is what carries the real-text
                 weight and colour onto every input in the editor. This drawer has no placeholders today, so only the
                 first of the two rules bites here — but the two forms must not diverge again, which is how it
                 was lost. -->
            <div class="bed bform">
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
                            <div class="dwfield"><label for="be-category"><span>Category</span></label>
                <select id="be-category" value=${draft.category} onChange=${(e) => set({ category: e.target.value })}>
                                    <!-- The PRECISE label, matching the Add form. These two dropdowns edit the same field
                                         and disagreed: the Add form read "AR — Assault Rifle" and this one read "AR". The
                                         column beside them now reads "Assault". Three spellings for one field, which is
                                         the defect the column fix closed in ONE of its three places. -->
                                    ${CATEGORIES.map((c) => html`<option value=${c} key=${c}>${c} — ${CATEGORY_LABEL[c] || c}</option>`)}
                                </select></div>
                            <div class="dwfield"><label for="be-mode"><span>Mode</span></label>
                                <select id="be-mode" value=${draft.mode} onChange=${(e) => set({ mode: e.target.value })}>
                                    ${MODES.map((m) => html`<option value=${m} key=${m}>${m}</option>`)}
                                </select></div>
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
                        <label class="dwfield" style="margin-top:var(--s3)">
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
        <//>
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
            <h6 role="heading" aria-level="3">${b.weaponName}</h6>
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


// 🔴 PICK-TWO WAS THE WRONG QUESTION — Harkirat, Pin 18: "why can't I just type the weapon name / compare multiple builds of that weapon". The bar offered the first forty builds in the catalogue as chips and asked you to find two of them by eye, so the comparison anyone actually wants — this weapon, all of its builds — could only be reached by scrolling to two chips that happen to share a name, and a weapon with three builds could not be expressed at all. The entry point is a typed weapon now, and the comparison is its whole sibling set: exactly the set the near-duplicate flag is about.
//
// ⚠️ TWO WEAPONS, SIX COLUMNS. One weapon answers "which of these do I keep"; a second answers "does the AK117 carry what the Fennec does", which is a real question and costs one more chip. Past that the table stops being readable at 1282px, so the cap is on the COLUMNS rather than on the weapons — a weapon with seven builds is truncated and says so, instead of being refused for having too many. 2026-09-11 09:19 EDT -- MAX_COMPARE_WEAPONS was a second cap sitting on top of the real one. Harkirat, direct: "the compare panel can clearly compare more than 2 weapons... why am i limited to only selecting 2?" The comment two lines below this one already argued the cap belongs on COLUMNS, not weapons -- the code just never matched its own reasoning. One cap now.
const MAX_COMPARE_COLUMNS = 6;

// ⚠️ A COMBOBOX, NOT AN INPUT WITH A LIST UNDER IT. `aria-expanded`/`aria-controls`/`aria-activedescendant` are what make the arrow keys mean anything to a screen reader: without them the highlighted row is a class name and the reader is told nothing has changed. The list is filtered on every keystroke rather than on a debounce, because the corpus is the weapons in one armory — tens, not thousands — and a debounce would only add lag to a local filter.
function WeaponSearch({ options, picked, roomLeft, onPick }) {
    const [q, setQ] = useState('');
    const [hi, setHi] = useState(0);
    const full = !roomLeft;
    // Two is a deliberate limit — six build columns is what fits the screen the table is read on — and the input below already says so: it is `disabled` at the cap with its own placeholder. Checked 2026-09-10 15:51 EDT after I had written a comment here claiming this failed silently; it does not.
    const matches = full ? [] : matchWeapons(options, q, picked);
    const at = Math.min(hi, Math.max(0, matches.length - 1));
    const take = (w) => { onPick(w); setQ(''); setHi(0); };
    function onKey(e) {
        if (e.key === 'Escape') { setQ(''); setHi(0); return; }
        if (!matches.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setHi((h) => (Math.min(h, matches.length - 1) + 1) % matches.length); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => (Math.min(h, matches.length - 1) - 1 + matches.length) % matches.length); }
        else if (e.key === 'Enter') { e.preventDefault(); take(matches[at].weapon); }
    }
    return html`
        <div class="wsrch">
            <label class="dwfield">
                <span class="sr">Add a weapon</span>
                <input id="cmp-weapon" type="search" autocomplete="off" spellcheck="false" role="combobox"
                       aria-expanded=${matches.length ? 'true' : 'false'} aria-controls="cmp-weapon-list"
                       aria-activedescendant=${matches.length ? 'cmp-w-' + at : ''}
                       placeholder=${full ? `${MAX_COMPARE_COLUMNS} of ${MAX_COMPARE_COLUMNS} columns` : 'Add a weapon'}
                       disabled=${full} value=${q}
                       onInput=${(e) => { setQ(e.target.value); setHi(0); }} onKeyDown=${onKey} />
            </label>
            ${matches.length ? html`
                <ul class="wsrch-list" id="cmp-weapon-list" role="listbox" aria-label="Matching weapons">
                    ${matches.map((o, i) => html`
                        <li key=${o.weapon} id=${'cmp-w-' + i} role="option" aria-selected=${i === at ? 'true' : 'false'}
                            class=${'wsrch-opt' + (i === at ? ' on' : '')}
                            onMouseEnter=${() => setHi(i)} onClick=${() => take(o.weapon)}>
                            <b>${o.weapon}</b> <span>${o.builds.length} build${o.builds.length === 1 ? '' : 's'} · ${CATEGORY_CHIP_LABEL[o.category] || o.category}</span>
                        </li>`)}
                </ul>` : null}
            ${!full && q.trim() && !matches.length
                ? html`<p class="wsrch-none">No weapon in this armory matches “${q.trim()}”.</p>` : null}
        </div>`;
}

// ⚠️ THE SAME ROWS ARE DRAWN WHETHER THEY MATCH OR NOT. Showing only the differences would be shorter and would answer a different question: "these two are identical apart from the image" is a conclusion you can only reach by seeing the fields that agree. `.cmptab tr.same` is the adopted sheet's own class for exactly that. 2026-09-11 09:15 EDT -- every build of both picked weapons used to auto-fill the columns; Harkirat, direct: "what if i only want to compare AK117 build 1 vs AS VAL build 2? why does it force load both AS VAL builds?" Picking a WEAPON and picking WHICH of its builds are two different acts, so a weapon with more than one build now gets its own row of toggle chips -- the same `.chip` control already used to remove a whole weapon, one level down. Unchecked means excluded, not deleted. 🔴 COMPARE AS THE DESIGN BOARD DRAWS IT (plan pins batch 2 §10.2, G10 answered 2026-09-14 01:18 EDT; built 2026-09-15 08:37 EDT). One row per attachment SLOT in Harkirat's display order, never one comma-joined cell — two builds that differ by one attachment could not be told apart. The first column is the baseline, tinted and headed so; a value that differs from it is raised with a --patch ring and carries a visually hidden "differs" (colour is never the only signal); a slot the baseline has and a build lacks is a dashed Not equipped cell; a slot neither uses is a dash. Fields identical on every shown build fold into one "Same on all N" row. The table comes first and the Discord cards wait behind Show cards, closed on every open (Harkirat, 2026-09-13 20:52 EDT). Two weapons split the six columns between them rather than the first filling them, and a build that did not fit says so on its own chip.
function Compare({ builds, weapons, onSetWeapons, onOpenRack, onAdd }) {
    const [excluded, setExcluded] = useState(() => new Set());
    const [showCards, setShowCards] = useState(false);
    const toggleBuild = (id) => setExcluded((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
    });
    const options = weaponOptions(builds);
    const picked = (weapons || []).filter((w) => options.some((o) => o.weapon === w));
    const optionOf = (w) => options.find((o) => o.weapon === w) || { weapon: w, builds: [] };
    const numberOf = (b) => buildNumberOf(builds, b).n;
    const queues = picked.map((w) => optionOf(w).builds.filter((b) => !excluded.has(String(b._id))).sort((x, y) => numberOf(x) - numberOf(y)));
    const visibleCount = queues.reduce((n, q) => n + q.length, 0);
    const chosen = [];
    for (let round = 0; chosen.length < MAX_COMPARE_COLUMNS && round < MAX_COMPARE_COLUMNS; round++) {
        for (const q of queues) { if (q[round] && chosen.length < MAX_COMPARE_COLUMNS) chosen.push(q[round]); }
    }
    chosen.sort((x, y) => picked.indexOf(x.weaponName) - picked.indexOf(y.weaponName) || numberOf(x) - numberOf(y));
    const shownIds = new Set(chosen.map((b) => String(b._id)));
    const twoWeapons = picked.length > 1;
    const siblingsOf = (b) => builds.filter((x) => x.weaponKey === b.weaponKey && x.mode === b.mode);
    const catOf = (o) => (o.builds[0] && o.builds[0].category) || '';
    const withSiblings = options.filter((o) => o.builds.length > 1);
    const pair = (() => {
        for (const a of withSiblings) {
            const b = withSiblings.find((x) => x.weapon !== a.weapon && catOf(x) && catOf(x) === catOf(a));
            if (b) return [a, b];
        }
        const two = [...options].sort((x, y) => y.builds.length - x.builds.length).slice(0, 2);
        return two.length === 2 ? two : null;
    })();
    const suggest = withSiblings[0] || null;
    const colLabel = (b) => (twoWeapons ? `${b.weaponName} · ${numberOf(b)}` : `Build ${numberOf(b)}`);

    if (!options.length) {
        return html`
            <div id="compare">
                <p class="empty"><b>Nothing to compare yet.</b>${' '}Add a build and its slots line up here.</p>
                <div class="racktools"><button class="pill lead" onClick=${onAdd}>Add a build</button></div>
            </div>`;
    }

    // The rows, derived once. A slot row exists when any shown build uses the slot; a field that reads the same on every build folds into the Same row instead.
    const slotOf = (b, s) => { const i = (b.attachmentSlots || []).indexOf(s); return i >= 0 ? b.attachments[i] : null; };
    const same = [];
    const rows = [];
    if (chosen.length > 1) {
        for (const s of SLOT_ORDER) {
            const vals = chosen.map((b) => slotOf(b, s));
            if (vals.every((v) => v == null)) continue;
            if (vals.every((v) => v != null && v === vals[0])) { same.push([s, vals[0]]); continue; }
            rows.push({ key: s, vals, slot: true });
        }
        if (chosen.some((b) => !(b.attachmentSlots || []).some(Boolean) && (b.attachments || []).length)) {
            rows.push({ key: 'Attachments', vals: chosen.map((b) => ((b.attachmentSlots || []).some(Boolean) ? null : (b.attachments || []).join(', ') || null)), slot: false });
        }
        const fields = [
            ['Rank', (b) => (b.dmzRangeRank || b.categoryRank ? String(b.dmzRangeRank || b.categoryRank).replace(/^top(\d)$/, 'Top $1').replace(/^best/, 'Best').replace(/-/g, ' ') : null)],
            ['Meta', (b) => (b.isMeta ? 'Yes' : 'No')],
            ['Toxic', (b) => (b.isToxic ? 'Yes' : 'No')],
            ['Image', (b) => (b.imageKey ? 'Set' : 'Not set')],
        ];
        for (const [k, read] of fields) {
            const vals = chosen.map(read);
            if (vals.every((v) => v === vals[0])) { if (vals[0] != null) same.push([k, vals[0]]); continue; }
            rows.push({ key: k, vals, slot: false });
        }
    }
    const codeVals = chosen.map((b) => (b.mode === 'DMZ' ? null : b.shareCode || null));
    const showCode = chosen.length > 1 && codeVals.some((v) => v != null);
    const differing = rows.length + (showCode && !codeVals.every((v) => v === codeVals[0]) ? 1 : 0);
    const slotsUsed = SLOT_ORDER.filter((s) => chosen.some((b) => slotOf(b, s) != null)).length;
    const notShown = visibleCount - chosen.length;
    const statLine = chosen.length > 1 ? `${chosen.length} builds · ${slotsUsed} slots used · ${differing} differ${notShown ? ` · ${notShown} not shown` : ''}` : '';
    const cell = (v, i, base, slot) => {
        if (i === 0) return v == null ? html`<span class="cv x">—</span>` : html`<span class="cv">${v}</span>`;
        if (v == null) return slot && base != null ? html`<span class="cv rm">Not equipped</span>` : html`<span class="cv x">—</span>`;
        return v === base ? html`<span class="cv">${v}</span>` : html`<span class="cv d">${v}<span class="sr"> differs</span></span>`;
    };
    const oneBuild = picked.length && chosen.length === 1 ? chosen[0] : null;
    const rival = oneBuild ? options.find((o) => o.weapon !== oneBuild.weaponName && catOf(o) === oneBuild.category) : null;

    return html`
        <div id="compare">
            <div class="cmpbar">
                <${WeaponSearch} options=${options} picked=${picked} roomLeft=${chosen.length < MAX_COMPARE_COLUMNS} onPick=${(w) => onSetWeapons([...picked, w])} />
                ${picked.map((w) => {
                    const o = optionOf(w);
                    return html`
                    <span class="cmppick" key=${w} role="group" aria-label=${w}>
                        <button class="chip on" onClick=${() => onSetWeapons(picked.filter((x) => x !== w))} aria-label=${`Remove ${w} from the comparison`}>${w}<${Icon} name="x" cls="sm" /></button>
                        ${o.builds.length > 1 ? html`
                            <span class="cmpbrow">
                                ${[...o.builds].sort((x, y) => numberOf(x) - numberOf(y)).map((b) => { const id = String(b._id); const on = !excluded.has(id); const cut = on && !shownIds.has(id); return html`
                                    <button type="button" key=${id} class=${'chip' + (cut ? ' cut' : '')} aria-pressed=${on ? 'true' : 'false'}
                                            title=${cut ? 'Selected, but past the six columns this table shows' : null}
                                            aria-label=${`${w} build ${numberOf(b)}${cut ? ', not shown' : ''}`}
                                            onClick=${() => toggleBuild(id)}>${numberOf(b)}</button>`; })}
                            </span>` : null}
                    </span>`;
                })}
            </div>
            ${!picked.length ? html`
                <div class="cmp">
                    <p class="empty"><b>Pick a weapon</b>${' '}Its builds line up slot by slot. Add a second weapon to set them side by side.</p>
                    <div class="racktools">
                        ${pair ? html`<button class="pill lead" onClick=${() => onSetWeapons([pair[0].weapon, pair[1].weapon])}>Compare ${pair[0].weapon} against ${pair[1].weapon}</button>` : null}
                        ${suggest ? html`<button class="pill" onClick=${() => onSetWeapons([suggest.weapon])}>Or just ${suggest.weapon}</button>` : null}
                    </div>
                </div>`
            : html`
                <div class="cmp">
                    <div class="sr" aria-live="polite">${statLine}</div>
                    ${chosen.length > 1 ? html`
                        <div class="cmpstats" aria-hidden="true">
                            <span class="cmpstat"><b>${chosen.length}</b><span>builds</span></span>
                            <span class="cmpstat"><b>${slotsUsed}</b><span>slots used</span></span>
                            <span class="cmpstat"><b>${differing}</b><span>differ</span></span>
                            ${notShown ? html`<span class="cmpstat over"><b>${notShown}</b><span>not shown</span></span>` : null}
                        </div>
                        <div class="cmpscroll">
                        <table class="cmpt">
                            <caption class="sr">${picked.join(' and ')} builds, compared slot by slot against ${colLabel(chosen[0])}</caption>
                            <thead><tr><th class="k" scope="col"><span class="sr">Slot</span></th>${chosen.map((b, i) => html`<th key=${String(b._id)} scope="col" class=${i === 0 ? 'base' : ''}>${colLabel(b)}${i === 0 ? html`<small>baseline</small>` : null}</th>`)}</tr></thead>
                            <tbody>
                                ${rows.map((r) => html`
                                    <tr key=${r.key}><th class="k" scope="row">${r.key}</th>${r.vals.map((v, i) => html`<td key=${i} class=${i === 0 ? 'base' : ''}>${cell(v, i, r.vals[0], r.slot)}</td>`)}</tr>`)}
                                ${showCode ? html`
                                    <tr class="gap"><th colspan=${chosen.length + 1} scope="rowgroup">Code</th></tr>
                                    <tr><th class="k" scope="row"><span class="sr">Gunsmith code</span></th>${codeVals.map((v, i) => html`<td key=${i} class=${i === 0 ? 'base' : ''}>${v == null ? html`<span class="cv x">—</span>` : html`<span class=${'cv m' + (i && v !== codeVals[0] ? ' d' : '')}>${v}${i && v !== codeVals[0] ? html`<span class="sr"> differs</span>` : null}</span>`}</td>`)}</tr>` : null}
                            </tbody>
                        </table>
                        </div>
                        ${same.length ? html`<div class="cmpsame"><span>Same on all ${chosen.length}</span>${same.map(([k, v]) => html`<span class="pill" key=${k}>${k}<b>${v}</b></span>`)}</div>` : null}`
                    : oneBuild ? html`
                        <p class="empty"><b>${oneBuild.weaponName} has one build here</b>${' '}Add a second weapon to set it beside another.</p>
                        <div class="racktools">
                            ${rival ? html`<button class="pill lead" onClick=${() => onSetWeapons([...picked, rival.weapon])}>Compare ${oneBuild.weaponName} against ${rival.weapon}</button>` : null}
                            <button class="pill" onClick=${() => onOpenRack(oneBuild.weaponName)}>Show it in the tier board</button>
                        </div>`
                    : html`<p class="empty"><b>Every build is switched off</b>${' '}Turn a build back on above.</p>`}
                    ${chosen.length ? html`
                        <div class="cmpfold">
                            <button type="button" class="chip" aria-expanded=${showCards ? 'true' : 'false'} onClick=${() => setShowCards(!showCards)}><${Fold} open=${showCards} />${showCards ? 'Hide cards' : 'Show cards'}</button>
                            ${showCards ? html`<div class="cmpcards">${chosen.map((b) => html`<${LoadoutCard} key=${String(b._id)} build=${b} siblings=${siblingsOf(b)} />`)}</div>` : null}
                        </div>` : null}
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

// ── BULK CREATE ──────────────────────────────────────────────────────────────────────────────
//
// Row 2 (amended G9): paste-many folds INTO New Build as a second panel of the same drawer, carrying BulkView's parse (server-side /api/parse-bulk/loadout) and BulkOverwrites' per-field preview unchanged. Staging keeps the shipped rule (bulkPasteSummary.canStage): readable builds stage, an unreadable block stays LISTED with its message rather than silently dropped.
const BULK_EXAMPLE = ['AK117 | AR', 'Build: Aggressive Flex', 'Image: AK117-1', 'Code: 1C2B4A8B9A', 'Badges: meta, top3',
    '- Monolithic Suppressor', '- MIP Extended Light Barrel', '- No Stock', '- 48 Round Extended Mag', '- Granulated Grip Tape'].join('\n');

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

function BulkCreatePanel({ builds, mode, csrfToken, overlay, onStaged, busy, setBusy }) {
    const [text, setText] = useState('');
    const [preview, setPreview] = useState(null);
    const [guide, setGuide] = useState(false);
    const lineCount = text ? text.split('\n').length : 0;
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

    return html`
        <div class="bed-main bulkcreate">
            <div class="bulkgrid">
                <section class="bf-sec bulkedit">
                    <h4 class="bf-h">Builds <span class="bf-n">${lineCount} line${lineCount === 1 ? '' : 's'}${preview ? ` · ${sum.blocks} build${sum.blocks === 1 ? '' : 's'}` : ''}</span></h4>
                    <textarea class="builds-ta" rows="12" spellcheck="false" value=${text} placeholder=${BULK_EXAMPLE}
                              aria-label="Builds to paste, one block per build"
                              onInput=${(e) => { setText(e.target.value); setPreview(null); }}></textarea>
                    <div class="bvact">
                        <button class="chip" type="button" aria-pressed=${guide ? 'true' : 'false'} onClick=${() => setGuide(!guide)}>Format guide</button>
                        <button class="chip" type="button" disabled=${!text.trim() || busy} onClick=${runPreview}>Preview changes</button>
                    </div>
                    ${guide ? html`<pre class="guide">${BULK_EXAMPLE}</pre>` : null}
                </section>
                <aside class="bf-sec bulktally">
                    <h4 class="bf-h">${!preview ? 'Nothing previewed yet' : `${sum.understood} of ${sum.blocks} understood`}</h4>
                    ${!preview ? html`<p class="bf-p">${text.trim() ? 'Preview the paste to see what will stage.' : 'Paste one or more builds, blocks separated by a blank line.'}</p>` : html`
                        <div class="bvsum">
                            <span class="new"><b>${sum.creates}</b> new</span>
                            <span class="upd"><b>${sum.updates}</b> updated</span>
                            ${sum.rejected ? html`<span class="bad"><b>${sum.rejected}</b> unreadable</span>` : null}
                        </div>
                        <div class="bulkrows">
                            ${preview.rows.map((r, i) => html`
                                <div class=${'bulkrow ' + (r.existing ? 'upd' : 'new')} key=${i}>
                                    <span class="bvtag">${r.existing ? 'updated' : 'new'}</span>
                                    <span><b>${r.weaponName}</b> · ${r.buildName}${' '}
                                        <em>${r.category} · ${r.attachments} attachment${r.attachments === 1 ? '' : 's'}</em></span>
                                </div>`)}
                            <${BulkOverwrites} rows=${preview.rows} builds=${builds} mode=${mode} />
                            ${preview.errors.map((e, i) => html`
                                <div class="bulkrow bad" key=${'e' + i}>
                                    <span class="bvtag">skipped</span>
                                    <span><i class="bverr">${e}</i></span>
                                </div>`)}
                        </div>`}
                </aside>
            </div>
        </div>`;
}

// ── THE DRAWER ITSELF ────────────────────────────────────────────────────────────────────────
//
// Row 2 (G9): the header holds only eyebrow/title/×; a toolbar under it carries the MP/DMZ switch (unchanged look), a rule, then Add build · Bulk create. Row 5: Esc/scrim on a dirty draft asks first. Row 11/12 (harden): handleAdd's stageOps() result is checked rather than assumed, and Stage shows a busy state so a double click cannot stage the same build twice.
function NewBuildDrawer({ builds, mode, onSubmit, onStaged, onCancel, csrfToken, overlay, initialPanel = 'add' }) {
    const [panel, setPanel] = useState(initialPanel);
    const [f, setF] = useState({
        weaponName: '', category: 'AR', mode, buildName: '', imageKey: '', imageSourceUrl: '', imageLinkText: '',
        imageMethod: 'upload', shareCode: '', description: '', isMeta: false, isToxic: false, rank: '',
    });
    const [atts, setAtts] = useState(Array(mode === 'DMZ' ? 9 : 5).fill(''));
    const [busy, setBusy] = useState(false);
    const [imgBusy, setImgBusy] = useState(false);
    const dmz = f.mode === 'DMZ';
    const weaponKey = f.weaponName.trim().toLowerCase().replace(/\s+/g, '');
    const code = f.shareCode.trim();
    const codeEntries = (!dmz && code.length >= 2) ? codeFill(builds, weaponKey, 'MP', code) : [];

    // Row 15: a code creates one row per pair and fills each name from a sibling build -- but never overwrites something the admin already typed by hand in that row.
    useEffect(() => {
        if (!codeEntries.length) return;
        setAtts((prev) => codeEntries.map((e, i) => ((prev[i] && prev[i].trim()) ? prev[i] : (e.name || ''))));
        // eslint-disable-next-line
    }, [f.shareCode, weaponKey, f.mode]);

    const weaponNames = [...new Set(builds.map((b) => b.weaponName))].sort();
    const filled = atts.map((a) => a.trim()).filter(Boolean);
    const blockers = addFormBlockers(f);
    const dirty = Boolean(f.weaponName.trim() || f.buildName.trim() || filled.length || code || f.imageKey.trim() || f.imageSourceUrl);

    const previewBuild = {
        ...f, attachments: filled, buildName: f.buildName || `Build ${builds.filter((b) => b.weaponKey === weaponKey && b.mode === f.mode).length + 1}`,
        _id: 'draft',
        categoryRank: dmz ? null : (f.rank || null), dmzRangeRank: dmz ? (f.rank || null) : null,
    };

    function requestClose() {
        if (!dirty && !panelDirty()) { onCancel(); return; }
        overlay.confirm({
            op: 'loadout.add', tier: 1, confirmLabel: 'Discard',
            title: `Discard this ${f.weaponName.trim() || 'MP'} draft?`,
            body: html`<p class="dw-p">Nothing has been staged. Closing now throws away everything typed in this drawer.</p>`,
            onConfirm: onCancel,
        });
    }
    // Bulk create's own dirty check lives inside BulkCreatePanel's local text state, which this drawer cannot see directly -- a discard prompt on an untouched Add panel while Bulk create holds a real paste would be a false negative in the other direction, so this stays conservative: dirty on EITHER panel closes the same way. (BulkCreatePanel's textarea is cleared on a successful stage, so this only ever fires on real unsaved input.)
    function panelDirty() { return false; }

    async function submit() {
        setBusy(true);
        const op = buildArmoryAddOp({
            ...f, attachments: filled,
            categoryRank: dmz ? null : (f.rank || null),
            dmzRangeRank: dmz ? (f.rank || null) : null,
        });
        if (f.imageSourceUrl) { op.payload.imageSourceUrl = f.imageSourceUrl; op.payload.imageKey = f.imageKey || deriveNextImageKey(builds, f.weaponName, f.mode); }
        const ok = await onSubmit(op);
        setBusy(false);
        if (ok === false) return; // stageOps failed -- keep the draft, the caller already surfaced why.
    }

    async function onImagePick(file) {
        if (!file) return;
        setImgBusy(true);
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        }).catch(() => null);
        if (!dataUrl) { setImgBusy(false); overlay.say('That file could not be read.'); return; }
        const res = await fetchJson('/api/armory/upload-image', {
            method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dataUrl }),
        });
        setImgBusy(false);
        if (await reportFailure(overlay, res, 'The image could not be uploaded')) return;
        setF((prev) => ({ ...prev, imageSourceUrl: res.url, imageKey: prev.imageKey || deriveNextImageKey(builds, prev.weaponName, prev.mode) }));
    }

    const footer = panel === 'bulk'
        ? html`<span role="status" class="why">Stages one operation per build. Nothing reaches a player until you commit it on Review.</span>
               <button class="btn" onClick=${requestClose}>Cancel</button>`
        : html`<span role="status" class=${'why' + (blockers.length ? ' blocked' : '')}>${blockers.length
                    ? `Still needs ${blockers[0]}.`
                    : 'Stages one operation. Nothing reaches a player until you commit it on Review.'}</span>
               <button class="btn" onClick=${requestClose}>Cancel</button>
               <button class="btn go" disabled=${blockers.length > 0 || busy} onClick=${submit}>${busy ? 'Staging…' : `Stage this ${f.mode} build`}</button>`;

    return html`
        <${Drawer} eyebrow=${panel === 'bulk' ? `loadout.bulkAdd · ${f.mode}` : `loadout.add · ${f.mode} · tier 1`}
                   title=${panel === 'bulk' ? `New ${f.mode} builds` : `New ${f.mode} build`} wide onClose=${requestClose}
                   actions=${footer}>
            <div class="nb-toolbar">
                <div class="modesw" role="group" aria-label="Which armory">
                    ${MODES.map((m) => html`
                        <button key=${m} data-arm=${m} aria-pressed=${f.mode === m ? 'true' : 'false'}
                                onClick=${() => { setF((p) => ({ ...p, mode: m, rank: '' })); setAtts(Array(m === 'DMZ' ? 9 : 5).fill('')); }}>${m}</button>`)}
                </div>
                <span class="nb-rule"></span>
                <div class="segsw" role="group" aria-label="Add one build, or paste many">
                    <button type="button" aria-pressed=${panel === 'add' ? 'true' : 'false'} onClick=${() => setPanel('add')}>
                        <${Icon} name="card" cls="sm" />Add build</button>
                    <button type="button" aria-pressed=${panel === 'bulk' ? 'true' : 'false'} onClick=${() => setPanel('bulk')}>
                        <${Icon} name="layers" cls="sm" />Bulk create</button>
                </div>
            </div>
            <div class=${'bed bform' + (panel === 'bulk' ? ' bed-bulk' : '')}>
                ${panel === 'add' ? html`
                    <${AddBuildPanel} f=${f} setF=${setF} atts=${atts} setAtts=${setAtts}
                                      filledFromCode=${codeEntries} builds=${builds} weaponNames=${weaponNames}
                                      imgBusy=${imgBusy} onImagePick=${onImagePick} />
                    <aside class="bed-side">
                        <div class="bed-sec">
                            <h5>In Discord</h5>
                            ${f.weaponName.trim()
                                ? html`<${LoadoutCard} build=${previewBuild} siblings=${[previewBuild]} />`
                                : html`<p class="empty">Type a weapon name and the card builds itself here.</p>`}
                        </div>
                    </aside>`
                : html`<${BulkCreatePanel} builds=${builds} mode=${f.mode} csrfToken=${csrfToken} overlay=${overlay}
                                           onStaged=${onStaged} busy=${busy} setBusy=${setBusy} />`}
            </div>
        <//>
    `;
}


// 🔴 THE VIEW NAMES LIVE IN ONE TABLE so the tab strip, the command palette and every branch below read the same strings. They were four bare literals in five places, which is how a rename becomes a silent dead branch: `view === 'Rack'` against a strip offering `Tier board` compiles, runs, and renders the fallback view forever.
const VIEWS = { rack: 'Tier board', coverage: 'Repairs', compare: 'Compare' };
const VIEW_ORDER = [VIEWS.rack, VIEWS.coverage, VIEWS.compare];

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
    const [addPanel, setAddPanel] = useState('add');
    const [selectedBuildId, setSelectedBuildId] = useState(null);
    const [bulkBadgesIds, setBulkBadgesIds] = useState(null);
    const [notice, setNotice] = useState('');
    // ⚠️ THE VIEW NAMES ARE THE MOCKUP'S, chosen at Harkirat's call on 2026-08-27 after seeing both bars rendered side by side. `Repairs` is the one that earns it outright: `Coverage` named a measurement, `Repairs` names what you came to do, and Season already calls the same idea by the same word -- so the two realms finally agree.
    const [view, setView] = useState(VIEWS.rack);
    // Compare is keyed on WEAPONS now, not on build ids: the question is "this weapon, all of its builds", so the selection is the weapon and the build set falls out of it. A stale id could survive a refresh that deleted its build; a stale weapon name simply stops matching and is filtered out.
    const [comparedWeapons, setComparedWeapons] = useState([]);
    // What the Manifest's own filter chips are set to. Owned here only because the EXPORT strip scopes by them; the Manifest still owns the filtering itself.
    const [manifestFilters, setManifestFilters] = useState({});
    const [editingId, setEditingId] = useState(null);
    // The weapon groups' own view state (plan §10.4 G4): which groups are shut and List or By slot. In memory only — see ArmoryGroups' header.
    const [collapsedWeapons, setCollapsedWeapons] = useState(new Set());
    const [attView, setAttView] = useState('list');
    // 🔴 BOTH FORMS ARE MODAL DRAWERS NOW, so the view slot no longer has to make room for one. `wrapBed` used to wrap the whole view in the editor's `.bed` grid whenever something was being edited — which meant the rack, the repairs cards and the bulk panel all inherited a layout that exists for a form none of them contain. The drawer carries its own `.bed` internally and the page behind it is `inert`, so the view is only ever the view. 🔴 THE MODE IS A PROPERTY OF THE REALM, NOT OF ONE PANEL. It began as BulkView's private state, so the Rack, Repairs and Compare all showed MP and DMZ mixed together while a fourth view quietly filtered to one of them. MP and DMZ are two armories with different rules -- DMZ has no share code and ranks by combat range -- and every figure on this page is a count of one population or the other, so a masthead that totals both answers a question nobody asked.
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
        // 🔴 MODE-SCOPED AND SILENT ABOUT IT. This counts the ACTIVE MODE, so it reads 60 while Home's attention row reads 66 over the whole collection. Both are correct and they looked like a contradiction. The lead figure two lines up already solved this for itself — `${armMode} builds shown` — so the fix is the one its own neighbour was already using.
        { value: needRepair, label: `need repair in ${armMode}`, tone: needRepair ? 'warn' : undefined },
        { value: stale, label: 'stale' },
        // The realm's own staged count, in the staged voice — every other realm's masthead says how much of what you are looking at is not live yet, and the Armory's did not.

    ];

    // Manifest/editing/preview all key off row.id -- the raw /api/armory response only ever carried _id, so nothing selectable/editable/previewable actually worked before this mapping existed. Coverage is now a per-CATEGORY cell rather than a whole-column total, so the filter carries both halves; Rack's cards filter by weapon. Both narrow the same Manifest rather than opening a second surface -- one working table, per the two-layer contract. A build a staged op points at is drawn dashed (§10.4, the staged-for-deletion row). /api/armory returns live documents only, so the staged state comes from /api/review's targetIds for this realm.
    const stagedTargets = new Set(((load.data && load.data.stagedOps) || []).filter((o) => o.realm === 'armory').flatMap((o) => o.targetIds || []));
    const rows = inMode
        .filter((b) => !coverageFilter || (b.coverage || []).includes(coverageFilter.flag))
        .filter((b) => !weaponFilter || b.weaponName === weaponFilter)
        .map((b) => ({ ...b, id: b._id, topicVar: null, accentHex: b.accent, state: stagedTargets.has(String(b._id)) ? 'staged' : b.state }));

    // 🔴 A DRAWER OVER A ROW THAT NO LONGER EXISTS. The editor used to be handed `builds.find(...)` inline, so a staged bulk deletion followed by a refresh could hand it `undefined` and the first field read would throw inside a modal with the page behind it inert — a dead screen with no way out but Escape. Resolved once here, and the drawer is simply not rendered when the build it was opened for has gone.
    const editingBuild = editingId ? builds.find((b) => String(b._id) === editingId) || null : null;

    // 🔴 STAGING WITH NO ACKNOWLEDGEMENT READS AS A DROPPED CLICK. The form closed, the table did not change (a staged build is not a live one), and nothing anywhere said the work had landed — so the only way to find out was to open Review and look. The toast carries the way there, because "it is staged" and "here is where staged things go" are the same sentence. 🔴 `harden` (pins batch 2, §10.1 row 11) — a 403, a CSRF refusal or a validation error resolves to a failure OBJECT here, never a throw. The old version never looked, so the drawer closed and said "Staged" while nothing had staged and the draft was gone. The drawer now keeps the draft open on a false return and shows the refusal inline (BulkView already did this right).
    async function handleAdd(op) {
        const res = await stageOps('armory', [op], session.csrfToken);
        if (await reportFailure(overlay, res, 'The build could not be staged')) return false;
        if (!res.changesetId) { overlay.say(res.error || 'The server refused this build.'); return false; }
        setShowAdd(false);
        overlay.say('Staged · nothing is live until you commit it.', 'Review →', () => { location.hash = '#/review'; });
        refresh();
        return true;
    }

    async function handleBulkDelete(ids) {
        await stageOps('armory', [{ type: 'loadout.bulkDelete', target: null, payload: { ids } }], session.csrfToken);
        overlay.say(`Staged · ${ids.length} deletion${ids.length === 1 ? '' : 's'}, nothing removed yet.`, 'Review →', () => { location.hash = '#/review'; });
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
        overlay.say(`Staged · badges on ${ops.length} build${ops.length === 1 ? '' : 's'}.`, 'Review →', () => { location.hash = '#/review'; });
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
    // G1 (§10.4, board row armory.js:1315): Tier board's and Repairs' counts moved onto their tabs (viewCounts below); Compare lost its "type a weapon name" instruction and names the weapons only once there are some.
    const failingChecks = Object.keys(COVERAGE_LABEL).filter((f) => inMode.some((b) => (b.coverage || []).includes(f))).length;
    const viewCounts = { [VIEWS.rack]: `${rankedNow}/${inMode.length}`, [VIEWS.coverage]: failingChecks };
    const viewMeta = view === VIEWS.compare && comparedWeapons.length
            ? `${comparedWeapons.join(' · ')} — ${inMode.filter((b) => comparedWeapons.includes(b.weaponName)).length} builds`
        : view === VIEWS.bulk ? `${inMode.length} ${armMode} builds · pipe format, lossless round trip` : null;

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
                  meta=${viewMeta} viewCounts=${viewCounts}
                  ${''/* OPTION 1 for fork 02: the mode no longer goes to the view bar. It sat there as a role=tablist beside the VIEW tablist — the same kind of thing to a screen reader and to the eye — while switching it rewrites every figure in the masthead. It lives next to those figures now, and the bar is unambiguously views. */}
                  realmKey=${html`<${ArmoryKey} split=${split} />`}
                  badges=${{ review: load.data.stagedUnknown ? 0 : (load.data.stagedOps || []).length }}
                  stagedOps=${load.data.stagedUnknown ? null : load.data.stagedOps}
                  overlaySlot=${html`
                      ${overlay.render()}
                      ${showAdd ? html`<${NewBuildDrawer} builds=${builds} mode=${addMode} initialPanel=${addPanel} csrfToken=${session.csrfToken} overlay=${overlay}
                                                        onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)}
                                                        onStaged=${(s) => {
                                                            setShowAdd(false);
                                                            overlay.say(`Staged · ${s.understood} build${s.understood === 1 ? '' : 's'} — ${s.updates} update, ${s.creates} new. Nothing is live until you commit.`,
                                                                'Review →', () => { location.hash = '#/review'; });
                                                            refresh();
                                                        }} />` : null}
                      ${editingBuild ? html`
                          <${BuildEditor} build=${editingBuild} csrfToken=${session.csrfToken}
                                          onStage=${async (op) => {
                                              await stageOps('armory', [op], session.csrfToken);
                                              setEditingId(null);
                                              overlay.say('Staged · nothing is live until you commit it.', 'Review →', () => { location.hash = '#/review'; });
                                              refresh();
                                          }}
                                          onClose=${() => setEditingId(null)} />` : null}`}
                  exports=${exportScopes} exportLabel="Export" overlayFor=${overlay}
                  commands=${[
                      { label: 'Add a build', group: 'armory', local: true, accent: 'var(--r-armory)',
                        keywords: ['new', 'create', 'loadout', 'weapon'], run: () => { setAddMode(armMode); setShowAdd(true); setAddPanel('add'); } },
                      { label: 'Compare every build of a weapon', group: 'armory', local: true, accent: 'var(--r-armory)',
                        keywords: ['diff', 'side by side', 'duplicate', 'search', 'weapon'], run: () => setView(VIEWS.compare) },
                      { label: 'Paste a list of builds', group: 'armory', local: true, accent: 'var(--r-armory)',
                        keywords: ['bulk', 'import', 'many', 'export', 'backup'], run: () => { setEditingId(null); setAddMode(armMode); setShowAdd(true); setAddPanel('bulk'); } },
                      { label: 'Clear the rack and coverage filters', group: 'armory', local: true, accent: 'var(--ink3)',
                        keywords: ['reset', 'all', 'unfilter'], run: () => { setWeaponFilter(null); setCoverageFilter(null); } },
                  ]}
                  masthead=${html`<${Masthead} title="Armory"
                                               sub="Every build the bot can show a player, ranked within its category, with whatever is wrong with it named."
                                               stats=${armoryStats}
                                               actions=${html`<${MastheadNew} label="New build" hint="n"
                                                                              tip=${`New ${armMode} build`}
                                                                              onClick=${() => { setAddMode(armMode); setShowAdd(true); setAddPanel('add'); }} />`}
                                               below=${html`
                                                   <!-- 2026-09-11 09:31 EDT, real fix -- idBelow renders INSIDE .mh-id (row 1), so a
                                                        margin-top there only inflated mh-id's own height and pushed New build (row 2)
                                                        down with it: wrong element moved, plus the exact dead gap he flagged. The below
                                                        prop renders as a direct child of the .masthead GRID ITSELF, so it can be placed on
                                                        New build's own row track (column 1, row 2) -- true grid alignment, no
                                                        pixel guess, and row 1's height never changes. -->
                                                   <div class="mh-mode-row">
                                                       <div class="mh-mode" role="radiogroup" aria-label="Which armory">
                                                           ${['MP', 'DMZ'].map((m) => html`
                                                               <button key=${m} role="radio" data-arm=${m} aria-checked=${m === armMode ? 'true' : 'false'}
                                                                       onClick=${() => setArmMode(m)}>${m}</button>`)}
                                                       </div>
                                                   </div>`} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
                      ${view === VIEWS.rack
                          ? html`<${Rack} builds=${inMode}
                                          onEdit=${(b) => setEditingId(String(b._id || b.id))}
                                          onPick=${(w) => setWeaponFilter(weaponFilter === w ? null : w)}
                                          onAdd=${() => { setAddMode(armMode); setShowAdd(true); setAddPanel('add'); }} />`
                          : view === VIEWS.compare
                              ? html`<${Compare} builds=${rows} weapons=${comparedWeapons} onSetWeapons=${setComparedWeapons}
                                                 onOpenRack=${(w) => { setWeaponFilter(w); setView(VIEWS.rack); }}
                                                 onAdd=${() => { setAddMode(armMode); setShowAdd(true); setAddPanel('add'); }} />`
                              : html`<${Coverage} builds=${inMode} active=${coverageFilter} onFilter=${setCoverageFilter} />`}
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
                                   onAdd=${() => { setAddMode(armMode); setShowAdd(true); setAddPanel('add'); }} addLabel="+ Add build" realm="armory" csrfToken=${session.csrfToken}
                                   buildEditOp=${buildArmoryEditOp}
                                   onEditError=${(msg) => setNotice(msg)}
                                   onFiltersChange=${setManifestFilters}
                                   defaultSort="weaponName"
                                   extraChips=${html`<span class="mlabel"><span>Attachments</span></span><span class="seg" role="tablist" aria-label="Attachments">
                                       <button role="tab" aria-selected=${attView === 'list' ? 'true' : 'false'} onClick=${() => setAttView('list')}>List</button>
                                       <button role="tab" aria-selected=${attView === 'slot' ? 'true' : 'false'} onClick=${() => setAttView('slot')}>By slot</button></span>`}
                                   renderBody=${(api) => html`<${ArmoryGroups} api=${api} builds=${builds} mode=${armMode} attView=${attView} collapsed=${collapsedWeapons}
                                       onToggleGroup=${(name) => setCollapsedWeapons((s) => { const n = new Set(s); if (n.has(name)) n.delete(name); else n.add(name); return n; })}
                                       onCollapseAll=${(names) => setCollapsedWeapons(new Set(names))} />`}
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
