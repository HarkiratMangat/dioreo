// portal/ui/armory.js — ESM. The Armory realm: Rack (by category) + Coverage (data-quality flags) + an Add form + inline edit + bulk actions + a LIVE PREVIEW panel, reusing <Shell>/<Manifest> unchanged (spec §8.2). No dates, so no Track.
//
// buildArmoryAddOp/buildArmoryEditOp/parseBadgesToken come from armory.logic.js, loaded as a plain CLASSIC <script> before this module -- see track.js's header comment for why that is the real working cross-runtime resolution here, and why a literal `import {...} from './armory.logic.js'` would fail in every real browser (found live in season.js's own prior version).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess, Masthead } from './shell.js';
import { Manifest } from './manifest.js';
import { fetchJson } from './httpClient.js';
import { stageOps } from './composeClient.js';
import { renderV2 } from './v2Render.js';

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
// `accent` is real DATA (portal/api/armory.js stamps it from getMpCategoryAccent), not a CSS token. That is the correct mechanism and deliberately unlike Season's --topic-accent tokens: the bot owns these hues, so reading them from the payload means the two can never drift apart.
function Rack({ builds, onPick }) {
    const byCategory = {};
    for (const b of builds) (byCategory[b.category] = byCategory[b.category] || []).push(b);
    return html`
        <div class="panel" id="rack">
            <div class="ph">
                <span class="t">Rack — by category</span>
                <span class="rt">${Object.keys(byCategory).length} categories</span>
            </div>
            ${builds.length === 0 ? html`<p class="empty">No builds in this catalogue yet.</p>` : null}
            ${Object.entries(byCategory).map(([cat, list]) => {
                const byWeapon = {};
                for (const b of list) (byWeapon[b.weaponName] = byWeapon[b.weaponName] || []).push(b);
                const accent = list[0]?.accent || 'var(--rule)';
                return html`
                    <section class="catsec" style=${`--cat:${accent}`}>
                        <div class="cathead">
                            <span class="nm">${cat}</span><span class="ln"></span>
                            <span class="ct">${Object.keys(byWeapon).length} weapons · ${list.length} builds</span>
                        </div>
                        <div class="wcards">
                            ${Object.entries(byWeapon).map(([weapon, wb]) => {
                                const dupe = wb.some((b) => (b.coverage || []).includes('near-duplicate'));
                                const noImage = wb.every((b) => (b.coverage || []).includes('missing-image'));
                                return html`
                                    <button class="wcard" onClick=${() => onPick(weapon)} title=${`Filter the manifest to ${weapon}`}>
                                        <span class="nm">${weapon}</span>
                                        <span class="mt">${wb.length} build${wb.length === 1 ? '' : 's'}${dupe ? html` · <span class="dupe">dupe?</span>` : null}</span>
                                        ${noImage ? html`<span class="noimg">no image</span>` : null}
                                    </button>
                                `;
                            })}
                        </div>
                    </section>
                `;
            })}
        </div>
    `;
}

// Coverage -- the Armory's equivalent of the Track's defect flags (spec §8.2). It shipped as a flat row of six totals; 04-armory-and-commit.html specs a MATRIX, category down the side and defect across the top, because "SMG has 4 missing images" is the actionable fact and "there are 6 missing images somewhere" is not. Every cell is a filter, exactly as the mockup's own caption promises.
//
// A zero cell must not read like a problem, so it is dimmed and inert rather than tinted and clickable -- the tint is reserved for a count that is actually a defect.
function Coverage({ builds, active, onFilter }) {
    const categories = [...new Set(builds.map((b) => b.category))];
    const flags = Object.keys(COVERAGE_LABEL);
    const accentOf = (cat) => builds.find((b) => b.category === cat)?.accent || 'var(--ink3)';
    return html`
        <div class="panel" id="coverage">
            <div class="ph">
                <span class="t">Coverage</span>
                <span class="rt">${builds.filter((b) => (b.coverage || []).length).length} of ${builds.length} builds flagged</span>
            </div>
            <div class="covwrap">
                <table class="cov">
                    <thead><tr>
                        <th class="who"></th>
                        <th>Builds</th>
                        ${flags.map((f) => html`<th>${COVERAGE_LABEL[f]}</th>`)}
                    </tr></thead>
                    <tbody>
                        ${categories.map((cat) => {
                            const inCat = builds.filter((b) => b.category === cat);
                            return html`
                                <tr style=${`--cat:${accentOf(cat)}`}>
                                    <td class="who">${cat}</td>
                                    <td><span class="covcell zero">${inCat.length}</span></td>
                                    ${flags.map((f) => {
                                        const n = inCat.filter((b) => (b.coverage || []).includes(f)).length;
                                        const on = active && active.flag === f && active.category === cat;
                                        if (!n) return html`<td><span class="covcell zero">0</span></td>`;
                                        return html`<td><button class=${'covcell hit' + (on ? ' on' : '')}
                                            title=${`Show the ${n} ${cat} build${n === 1 ? '' : 's'} flagged "${COVERAGE_LABEL[f]}"`}
                                            onClick=${() => onFilter(on ? null : { flag: f, category: cat })}>${n}</button></td>`;
                                    })}
                                </tr>
                            `;
                        })}
                    </tbody>
                </table>
            </div>
            <p class="covnote">Every cell is a filter — click a count to load exactly those builds into the manifest below.</p>
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
            ${badgeWarning ? html`<p style="color:var(--warn);padding:0 14px 10px;font-size:12px">${badgeWarning}</p>` : null}
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

    function refresh() { fetchJson('/api/armory').then((d) => { if (d.signedOut || d.forbidden) return setError(true); setBuilds(d.builds || []); }); }
    useEffect(refresh, []);

    if (error) return html`<${NoAccess} />`;

    // Spec §8.2: Armory has no dates, so no Track -- Rack and Coverage are its two view layers. They shipped stacked on top of each other, which meant the Manifest (the thing you actually work in) started roughly a screen and a half down the page.
    const weapons = new Set(builds.map((b) => b.weaponName));
    const flagged = builds.filter((b) => (b.coverage || []).length).length;
    const modes = [...new Set(builds.map((b) => b.mode))].sort();
    const modeLine = modes.length ? modes.join(' · ') : '';
    const armoryStats = [
        { value: weapons.size, label: 'weapons' },
        { value: builds.length, label: 'builds' },
        { value: flagged, label: 'flagged', tone: flagged ? 'bad' : undefined },
    ];

    // Manifest/editing/preview all key off row.id -- the raw /api/armory response only ever carried _id, so nothing selectable/editable/previewable actually worked before this mapping existed. Coverage is now a per-CATEGORY cell rather than a whole-column total, so the filter carries both halves; Rack's cards filter by weapon. Both narrow the same Manifest rather than opening a second surface -- one working table, per the two-layer contract.
    const rows = builds
        .filter((b) => !coverageFilter || ((b.coverage || []).includes(coverageFilter.flag) && b.category === coverageFilter.category))
        .filter((b) => !weaponFilter || b.weaponName === weaponFilter)
        .map((b) => ({ ...b, id: b._id, topicVar: null, accentHex: b.accent }));

    async function handleAdd(op) {
        await stageOps('armory', [op], session.csrfToken);
        setShowAdd(false);
        refresh();
    }

    async function handleBulkDelete(ids) {
        await stageOps('armory', [{ type: 'loadout.bulkDelete', target: null, payload: { ids } }], session.csrfToken);
        refresh();
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
        refresh();
    }

    async function handleExportSelection(ids) {
        const body = await fetchJson(`/api/armory/export?ids=${ids.join(',')}`);
        globalThis.open(`data:text/plain;charset=utf-8,${encodeURIComponent(body.text || '')}`, '_blank');
    }

    return html`
        <${Shell} realm="armory" session=${session} view=${view} viewOptions=${['Rack', 'Coverage']} onSetView=${setView}
                  masthead=${html`<${Masthead} title="Armory" sub=${modeLine} stats=${armoryStats} />`}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 14px">${notice}</p>` : null}
                      <div class="armcols">
                          <div class="armmain">
                              ${showAdd ? html`<${AddBuildForm} onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)} />` : null}
                              ${view === 'Rack'
                                  ? html`<${Rack} builds=${builds} onPick=${(w) => setWeaponFilter(weaponFilter === w ? null : w)} />`
                                  : html`<${Coverage} builds=${builds} active=${coverageFilter} onFilter=${setCoverageFilter} />`}
                          </div>
                          <div class="armside">
                              <${LivePreview} buildId=${selectedBuildId} />
                          </div>
                      </div>
                  `}
                  manifestSlot=${html`
                      <${Manifest} rows=${rows} columns=${ARMORY_COLUMNS} searchableFields=${['weaponName', 'buildName']}
                                   title="Every build" filterGroups=${ARMORY_FILTERS}
                                   headerRight=${weaponFilter || (coverageFilter ? `${coverageFilter.category} · ${COVERAGE_LABEL[coverageFilter.flag]}` : '')}
                                   bulkNote="Destructive actions stage — they never fire from here."
                                   emptyText="No builds match this filter." 
                                   onAdd=${() => setShowAdd(true)} realm="armory" csrfToken=${session.csrfToken}
                                   buildEditOp=${buildArmoryEditOp}
                                   onEditError=${(msg) => setNotice(msg)}
                                   onRowClick=${(row) => setSelectedBuildId(row.id)} selectedRowId=${selectedBuildId}
                                   bulkActions=${[
                                       { label: 'Set badges…', onClick: (ids) => setBulkBadgesIds(ids) },
                                       { label: 'Export selection', onClick: handleExportSelection },
                                       { label: 'Stage deletion', danger: true, onClick: handleBulkDelete },
                                   ]} />
                      ${bulkBadgesIds ? html`<${BulkBadgesPanel} ids=${bulkBadgesIds} onApply=${handleBulkBadges} onCancel=${() => setBulkBadgesIds(null)} />` : null}
                  `} />
    `;
}
