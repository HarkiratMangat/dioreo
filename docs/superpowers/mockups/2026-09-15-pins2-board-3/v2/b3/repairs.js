// Board 3 version 2 — BOARD ONLY. P6: Repairs as a worklist inside the Repairs panel. One line per build to fix, worst first, a filter per problem, a row that opens to show the build, and the builds that pass in one block under it.
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';
import { Icon, Fold } from '../ui/icons.js';
import { useB3 } from './state.js';
import { faultsFor, faultLine, catLabel, twinOf, B3Badges } from './armory-parts.js';

/* global buildNumberOf */

const CHECKS = [
    ['missing-image', 'Missing image', 'image-off'],
    ['few-attachments', '2 or fewer attachments', 'layers'],
    ['near-duplicate', 'Near-duplicate', 'copy'],
    ['no-code', 'No gunsmith code', 'code'],
    ['code-length-mismatch', 'Code length', 'code'],
];
const SLOT_ORDER = ['Optic', 'Muzzle', 'Barrel', 'Stock', 'Laser', 'Underbarrel', 'Rear Grip', 'Ammunition', 'Perk'];
const slotVar = (slot) => `var(--sl-${String(slot).toLowerCase().replace(/\s+/g, '-')})`;
const ago = (iso) => {
    if (!iso) return 'never';
    const d = (Date.now() - new Date(iso).getTime()) / 86400000;
    if (d < 1) return 'today';
    if (d < 30) return `${Math.round(d)} days ago`;
    const m = Math.round(d / 30.4);
    return m < 12 ? `${m} month${m === 1 ? '' : 's'} ago` : `${Math.round(m / 12)} year${m >= 18 ? 's' : ''} ago`;
};

export function repairsStatus(inMode, clean) {
    const n = clean ? 0 : inMode.filter((b) => faultsFor(b).length).length;
    return n ? { tone: 'warn', text: `${n} need work` } : { tone: 'ok', text: 'all pass' };
}

export function RepairsPanel({ inMode, builds, mode, onFix, onShowAged, onShowBuild }) {
    const day = useB3('p6day');
    const clean = day === 'clean';
    const [kind, setKind] = useState('all');
    const [open, setOpen] = useState(null);
    const faulty = clean ? [] : inMode.filter((b) => faultsFor(b).length)
        .map((b) => ({ b, n: buildNumberOf(builds, b).n, f: faultsFor(b) }))
        .sort((x, y) => y.f.length - x.f.length || x.b.weaponName.localeCompare(y.b.weaponName));
    const kinds = CHECKS.map(([k, label, icon]) => ({ k, label, icon, n: faulty.filter((x) => x.f.includes(k)).length })).filter((x) => x.n);
    const shown = kind === 'all' ? faulty : faulty.filter((x) => x.f.includes(kind));
    const aged = inMode.filter((b) => (b.coverage || []).includes('stale-90d')).length;
    const pass = inMode.length - faulty.length;

    return html`
        <div class="b3-rp" id="b3-repairs">
            ${faulty.length ? html`
                <div class="b3-rp-h">
                    <div class="b3-rp-t"><b>${faulty.length} build${faulty.length === 1 ? '' : 's'} need${faulty.length === 1 ? 's' : ''} work</b><span>worst first · ${mode}</span></div>
                    <div class="b3-rp-f" role="group" aria-label="Show builds with">
                        <button type="button" class="b3-fc" aria-pressed=${kind === 'all' ? 'true' : 'false'} onClick=${() => setKind('all')}>All<em>${faulty.length}</em></button>
                        ${kinds.map((x) => html`<button type="button" key=${x.k} class="b3-fc warn" aria-pressed=${kind === x.k ? 'true' : 'false'} onClick=${() => setKind(kind === x.k ? 'all' : x.k)}><${Icon} name=${x.icon} />${x.k === 'code-length-mismatch' ? 'Code ≠ build' : x.label}<em>${x.n}</em></button>`)}
                    </div>
                </div>
                <div class="b3-work" role="table" aria-label="Builds that need work">
                    <div class="b3-wh" role="row"><span></span><span>Build</span><span>Problems</span><span>Last touched</span><span>On the card</span><span></span></div>
                    ${shown.map(({ b, n, f }) => {
                        const isOpen = open === b._id;
                        const twin = f.includes('near-duplicate') ? twinOf(b, builds) : null;
                        return html`
                        <div class=${'b3-wr' + (isOpen ? ' open' : '')} key=${b._id} style=${`--c:${b.accent || 'var(--ink3)'}`} role="row">
                            <button type="button" class="b3-wr-main" aria-expanded=${isOpen ? 'true' : 'false'} onClick=${() => setOpen(isOpen ? null : b._id)}>
                                <span class="b3-wr-n" aria-label=${`${f.length} problem${f.length === 1 ? '' : 's'}`}>${f.length}</span>
                                <span class="b3-wr-b"><b>${b.weaponName}<i>·</i>Build ${n}</b><small><em>${catLabel(b.category)}</em>${b.buildName && !/^build \d+$/i.test(b.buildName) ? html`<span>${b.buildName}</span>` : null}</small></span>
                                <span class="b3-wr-f">${f.map((k) => { const l = faultLine(k, b, builds); return html`<span class="b3-pchip" key=${k}><${Icon} name=${l.icon} />${l.short}${l.visual && k !== 'no-code' ? html`<span class="v">${l.visual}</span>` : null}</span>`; })}</span>
                                <span class="b3-wr-u">${ago(b.lastUpdated)}</span>
                                <span class="b3-wr-c">
                                    <span class=${'b3-img' + (b.imageKey ? '' : ' no')} title=${b.imageKey ? 'Image uploaded' : 'No image'}><${Icon} name=${b.imageKey ? 'image' : 'image-off'} /></span>
                                    ${b.shareCode ? html`<code>${b.shareCode}</code>` : html`<span class="none">no code</span>`}
                                </span>
                                <${Fold} open=${isOpen} cls="b3-wr-chev" />
                            </button>
                            <span class="b3-wr-a"><button type="button" class="b3-btn2 sm" onClick=${() => onFix(b)}><${Icon} name="wrench" />Fix</button></span>
                            ${isOpen ? html`
                                <div class="b3-wr-d">
                                    <div class="b3-wr-dl">
                                        ${f.map((k) => { const l = faultLine(k, b, builds); return html`<div class="b3-wr-why" key=${k}><i><${Icon} name=${l.icon} /></i><span><b>${l.text}</b>${k === 'near-duplicate' && twin ? html` — ${twin.weaponName} Build ${buildNumberOf(builds, twin).n}${twin.shareCode ? html`, <code>${twin.shareCode}</code>` : ''}` : null}</span>${l.visual || null}</div>`; })}
                                    </div>
                                    <div class="b3-wr-rail">
                                        <span class="lab">Attachments</span>
                                        <div class="wg-rail">${(b.attachments || []).map((a, i) => { const s = (b.attachmentSlots || [])[i]; return html`<span class="wg-at" key=${i} style=${SLOT_ORDER.includes(s) ? `--sl:${slotVar(s)}` : null}>${a}</span>`; })}${Array.from({ length: Math.max(0, 5 - (b.attachments || []).length) }, (_, i) => html`<span class="wg-at gap" key=${'g' + i}>Empty</span>`)}</div>
                                        <${B3Badges} b=${b} />
                                        <button type="button" class="b3-btn2 ghost sm" onClick=${() => onShowBuild(b)}><${Icon} name="arrow-down-up" />Show in the manifest</button>
                                    </div>
                                </div>` : null}
                        </div>`; })}
                </div>` : null}
            <div class=${'b3-rp-pass' + (faulty.length ? '' : ' all')}>
                <span class="b3-rp-ok"><${Icon} name="circle-check" /></span>
                <div class="b3-rp-pt">
                    <b>${faulty.length ? `The other ${pass} build${pass === 1 ? '' : 's'} pass every check` : `All ${inMode.length} ${mode} builds pass every check`}</b>
                    <div class="b3-rp-checks">
                        ${CHECKS.map(([k, label]) => { const hits = faulty.filter((x) => x.f.includes(k)).length; return html`
                            <span class=${'b3-check' + (hits ? ' hit' : '')} key=${k}><${Icon} name=${hits ? 'triangle-alert' : 'check'} />${label}${hits ? html`<em>${hits}</em>` : null}</span>`; })}
                    </div>
                </div>
                ${aged ? html`<button type="button" class="b3-rp-age" onClick=${onShowAged}><${Icon} name="clock" /><b>${aged}</b> not touched in 90 days<span>Age, not a fault · Show them</span></button>` : null}
            </div>
        </div>`;
}
