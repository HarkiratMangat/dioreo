// portal/ui/armory.js — ESM. The Armory realm: Rack (by category) + Coverage (data-quality flags), reusing <Shell>/<Manifest> unchanged (spec §8.2). No dates, so no Track — see the spec's own reasoning for why Armory has no view-layer switcher at all, just one static view above the Manifest.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useEffect } from '../vendor/preact-hooks.mjs';
import { Shell } from './shell.js';
import { Manifest } from './manifest.js';

const ARMORY_COLUMNS = [
    { key: 'weaponName', label: 'Weapon' },
    { key: 'buildName', label: 'Build' },
    { key: 'category', label: 'Category' },
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

export function ArmoryRealm({ session }) {
    const [builds, setBuilds] = useState([]);
    const [coverageFilter, setCoverageFilter] = useState(null);

    const [error, setError] = useState(null);
    useEffect(() => { fetch('/api/armory', { credentials: 'same-origin' }).then(r => r.json()).then(d => { if (d.error) return setError(d.error); setBuilds(d.builds || []); }); }, []);

    if (error) return html`<p style="padding:24px">You do not have access to this realm.</p>`;

    const rows = coverageFilter ? builds.filter(b => (b.coverage || []).includes(coverageFilter)) : builds;

    return html`
        <${Shell} realm="armory" session=${session}
                  viewSlot=${html`<${Rack} builds=${builds} /><${Coverage} builds=${builds} onFilter=${setCoverageFilter} />`}
                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${ARMORY_COLUMNS} searchableFields=${['weaponName', 'buildName']} />`} />
    `;
}
