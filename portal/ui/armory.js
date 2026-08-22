// portal/ui/armory.js — ESM. The Armory realm: Rack (by category) + Coverage (data-quality flags) + an Add form + inline edit + bulk actions + a LIVE PREVIEW panel, reusing <Shell>/<Manifest> unchanged (spec §8.2). No dates, so no Track.
//
// buildArmoryAddOp/buildArmoryEditOp/parseBadgesToken come from armory.logic.js, loaded as a plain CLASSIC <script> before this module -- see track.js's header comment for why that is the real working cross-runtime resolution here, and why a literal `import {...} from './armory.logic.js'` would fail in every real browser (found live in season.js's own prior version).
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell, NoAccess } from './shell.js';
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

const COVERAGE_LABEL = {
    'missing-image': 'Missing image', 'no-badges': 'No badges', 'wrong-attachment-count': 'Wrong attachment count',
    'stale-90d': 'Not updated in 90 days', 'near-duplicate': 'Near-duplicate code',
};

function Rack({ builds }) {
    const byCategory = {};
    for (const b of builds) (byCategory[b.category] = byCategory[b.category] || []).push(b);
    return html`
        <div class="panel" id="rack">
            <div class="ph"><span class="t">Rack — by category</span></div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 14px">
                ${Object.entries(byCategory).map(([cat, list]) => html`
                    <span class="chip" style=${`background:${list[0]?.accent || 'var(--sunk)'}22;border-color:${list[0]?.accent || 'var(--rule)'}`}>${cat} (${list.length})</span>
                `)}
            </div>
        </div>
    `;
}

function Coverage({ builds, onFilter }) {
    const counts = {};
    for (const flag of Object.keys(COVERAGE_LABEL)) counts[flag] = builds.filter(b => (b.coverage || []).includes(flag)).length;
    return html`
        <div class="panel" id="coverage">
            <div class="ph"><span class="t">Coverage</span></div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;padding:12px 14px">
                ${Object.entries(COVERAGE_LABEL).map(([flag, label]) => html`
                    <button class="chip" onClick=${() => onFilter(flag)}>${label}: ${counts[flag]}</button>
                `)}
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
    const [coverageFilter, setCoverageFilter] = useState(null);
    const [error, setError] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [selectedBuildId, setSelectedBuildId] = useState(null);
    const [bulkBadgesIds, setBulkBadgesIds] = useState(null);
    const [notice, setNotice] = useState('');

    function refresh() { fetchJson('/api/armory').then((d) => { if (d.signedOut || d.forbidden) return setError(true); setBuilds(d.builds || []); }); }
    useEffect(refresh, []);

    if (error) return html`<${NoAccess} />`;

    // Manifest/editing/preview all key off row.id -- the raw /api/armory response only ever carried _id, so nothing selectable/editable/previewable actually worked before this mapping existed.
    const rows = (coverageFilter ? builds.filter((b) => (b.coverage || []).includes(coverageFilter)) : builds)
        .map((b) => ({ ...b, id: b._id }));

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
        <${Shell} realm="armory" session=${session}
                  viewSlot=${html`
                      ${notice ? html`<p style="color:var(--warn);padding:0 14px">${notice}</p>` : null}
                      <div style="display:flex;gap:14px;flex-wrap:wrap">
                          <div style="flex:2;min-width:280px">
                              ${showAdd ? html`<${AddBuildForm} onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)} />` : null}
                              <${Rack} builds=${builds} />
                              <${Coverage} builds=${builds} onFilter=${setCoverageFilter} />
                          </div>
                          <div style="flex:1;min-width:260px">
                              <${LivePreview} buildId=${selectedBuildId} />
                          </div>
                      </div>
                  `}
                  manifestSlot=${html`
                      <${Manifest} rows=${rows} columns=${ARMORY_COLUMNS} searchableFields=${['weaponName', 'buildName']}
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
