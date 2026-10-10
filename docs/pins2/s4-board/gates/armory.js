// Board 3 — the Armory gates. Each stage is the portal's Manifest, drawer, Repairs panel or command bar, running on the
// captured dev database, with the proposal switched by the gate's own head.
import { POPT } from '../b3/poptime.js';   // pop-up timing, one table (the peek is set 2)
import { html } from '../vendor/htm-preact.mjs';
import { writeCompact, toDisplay } from '../b4/bulkformat.js';  // v20: Export writes the Bulk create format, byte for byte
import { useState, useEffect, useLayoutEffect, useRef } from '../vendor/preact-hooks.mjs';
import { Icon, Fold } from '../ui/icons.js';
import { fetchJson } from '../ui/httpClient.js';
import { useOverlay, Drawer } from '../ui/overlay.js';
import { Manifest } from '../ui/manifest.js';
import { downloadText } from '../ui/download.js';
import { CommandBar } from '../ui/palette.js';
import { ExportDrawer } from '../ui/exportPanel.js';
import {
    ArmoryGroups, ARMORY_COLUMNS, ARMORY_FILTERS, VIEWS, VIEW_ORDER, Coverage, RackNote,
    NewBuildDrawer, BuildEditor, LoadoutCard, splitCoverage,
} from '../ui/armory.js';
import { SelectionDock, B3Badges, TIER_OF_DMZ } from '../b3/armory-parts.js';
import { B3BuildDrawer } from '../b3/drawer.js';
import { RepairsPanel, repairsStatus } from '../b3/repairs.js';
import { B3CommandBar } from '../b3/palette.js';
import { useB3, isoLocal } from '../b3/state.js';
import { segOpts } from './picks.js';
import { Seg, Stage, Tries, PanelHead, useData, rowsFor, idsOf, weaponsWith, inMode, SEC, withSec, oneWeaponPerCategory, Hex, CharCount } from './lib.js';

const FAULTY = (b) => (b.coverage || []).some((f) => f !== 'stale-90d');
// The topics under the manifest reach its one stage through this, rather than each carrying a manifest of its own.
const surface = { select: null };
const load = () => Promise.all([fetchJson('/api/armory'), fetchJson('/api/review')])
    .then(([a, r]) => ({ ...a, stagedOps: (r && r.ops) || [] }));

// ── The Manifest, as a stage. `weapons` keeps a gate about one thing; everything else is the realm's own wiring.
export function ManifestStage({ session, weapons = null, collapsedAll = false, mode = 'MP', selectSignal = null,
                        attView: attStart = 'list', showAtt = true, drawers = true, cap = null }) {
    const data = useData(load);
    const [collapsed, setCollapsed] = useState(() => new Set());
    const [attView, setAttView] = useState(attStart);
    const [editingId, setEditingId] = useState(null);
    const [bulkEditIds, setBulkEditIds] = useState(null);
    const overlay = useOverlay();
    const g9 = useB3('g9');
    const secFixed = useB3('a1') === 'fixed';
    useEffect(() => { if (collapsedAll && data) setCollapsed(new Set(weapons || [])); }, [collapsedAll, data, (weapons || []).join(',')]);
    if (!data) return html`<p class="g-wait">Loading the dev database…</p>`;

    // Every consumer reads the builds with pin 6 applied (2026-09-17 22:15 EDT). Only the manifest rows went through withSec, so the
    // selection bar, Repairs, the drawers and the export picker drew Secondaries in the API's old #023047 — two hues
    // for one category on one board, and the old one too dark to read as a label.
    const builds = (data.builds || []).map((b) => withSec(b, secFixed));
    let rows = rowsFor(builds, weapons, mode).map((r) => { const b = withSec(r, secFixed); return { ...b, accentHex: b.accent }; });
    if (cap) rows = rows.slice(0, cap);
    const editing = editingId ? builds.find((b) => String(b._id) === editingId) : null;
    const counts = new Map();
    for (const b of inMode(builds, mode)) {
        const c = counts.get(b.category);
        if (c) c.count += 1; else counts.set(b.category, { count: 1, hex: b.accent });
    }
    const categoryOptions = (typeof CATEGORY_CHIP_ORDER !== 'undefined' ? CATEGORY_CHIP_ORDER : [...counts.keys()])
        .filter((c) => counts.has(c) && rows.some((r) => r.category === c))
        .map((c) => ({ value: c, label: (typeof CATEGORY_CHIP_LABEL !== 'undefined' && CATEGORY_CHIP_LABEL[c]) || c, count: rows.filter((r) => r.category === c).length,
                      hex: c === 'SECONDARIES' && secFixed ? SEC : counts.get(c).hex }));

    // The List / By slot toggle is retired (his call, 2026-10-01 12:24 EDT): docs/ideas/2026-10-01-armory-by-slot-view.md.
    const attChips = null;

    return html`
        ${overlay.render()}
        <${Manifest} rows=${rows} columns=${ARMORY_COLUMNS} searchableFields=${['weaponName', 'buildName']}
                     label="Manifest" filterGroups=${[...ARMORY_FILTERS, { key: 'category', label: 'Category', topic: true, options: categoryOptions }]}
                     bulkNote="Reversible — a staged deletion is discarded, never undone" bulkTier=${2}
                     rowNoun=${['build', 'builds']} removeLabel="Stage deletion"
                     onRemove=${(row) => overlay.say(`Board only · ${row.weaponName} would be staged for deletion.`)}
                     emptyText="No builds match this filter." addLabel=${useB3('a1') === 'fixed' ? '+ New build' : '+ Add build'} realm="armory"
                     csrfToken=${session && session.csrfToken} buildEditOp=${typeof buildArmoryEditOp === 'function' ? buildArmoryEditOp : undefined}
                     defaultSort="weaponName" selectSignal=${selectSignal}
                     onAdd=${() => overlay.say('Board only · New build lives in gate A6.')}
                     extraChips=${showAtt ? attChips : null}
                     renderBody=${(api) => html`<${ArmoryGroups} api=${api} builds=${builds} mode=${mode} attView=${attView} collapsed=${collapsed}
                         onToggleGroup=${(name) => setCollapsed((s) => { const n = new Set(s); if (n.has(name)) n.delete(name); else n.add(name); return n; })}
                         onCollapseAll=${(names) => setCollapsed(new Set(names))} />`}
                     renderSelection=${(sel) => html`<${SelectionDock} ids=${sel.ids} rows=${rows} builds=${builds}
                         onClear=${sel.clear} onDeselect=${(ids) => sel.setMany(ids, false)}
                         onEdit=${(ids) => { if (ids.length === 1) setEditingId(String(ids[0])); else setBulkEditIds(ids); }}
                         onExport=${(ids) => overlay.say(`Board only · ${ids.length} build${ids.length === 1 ? '' : 's'} would export in paste format.`)}
                         onDelete=${(ids) => overlay.say(`Board only · ${ids.length} deletion${ids.length === 1 ? '' : 's'} would be staged.`)} />`}
                     totalRows=${rows.length} onRowClick=${(row) => setEditingId(String(row.id))} selectedRowId=${editingId}
                     bulkActions=${[{ label: 'Export selection', onClick: () => {} }]} />
        ${drawers && bulkEditIds ? html`<${B3BuildDrawer} builds=${builds} mode=${mode} panel="bulk" editIds=${bulkEditIds}
            csrfToken=${session && session.csrfToken} overlay=${overlay} Card=${LoadoutCard}
            onClose=${() => setBulkEditIds(null)} onStaged=${(msg) => { setBulkEditIds(null); overlay.say(msg); }} />` : null}
        ${drawers && editing ? (g9 === 'now'
            ? html`<${BuildEditor} build=${editing} csrfToken=${session && session.csrfToken}
                                   onStage=${() => { setEditingId(null); overlay.say('Board only · that edit would stage.'); }}
                                   onClose=${() => setEditingId(null)} />`
            : html`<${B3BuildDrawer} builds=${builds} mode=${mode} panel="bulk" editIds=${[String(editing._id)]}
                                     csrfToken=${session && session.csrfToken} overlay=${overlay} Card=${LoadoutCard}
                                     onClose=${() => setEditingId(null)} onStaged=${(msg) => { setEditingId(null); overlay.say(msg); }} />`) : null}`;
}

// ── The Armory manifest, as one surface: every category, the faults, and a selection the topics below can drive.
function ManifestSurface({ session }) {
    const data = useData(load);
    const [sig, setSig] = useState(null);
    useEffect(() => { surface.select = (ids) => setSig({ ids, seq: Date.now() }); return () => { surface.select = null; }; }, []);
    if (!data) return html`<${Stage}><p class="g-wait">Loading the dev database…</p><//>`;
    const names = [...new Set([
        ...oneWeaponPerCategory(data.builds),
        ...weaponsWith(data.builds, (b) => (b.coverage || []).includes('code-length-mismatch'), 1),
        ...weaponsWith(data.builds, FAULTY, 2),
        // V44 AY (2026-09-29 22:33 EDT, his: "it's a good showcase of edge cases and i want it carried forward for session 4/5"): PHARO's only build is a placeholder —
        // "Coming Soon", one pseudo-attachment, no code (few-attachments + no-code) — and .50 GS is a secondary whose Build 1 fails code-length-mismatch
        // beside a clean Build 2
        'PHARO', '.50 GS',
    ])];
    return html`
        <${Stage} tall=${820} sticky=${true}>
            <${ManifestStage} session=${session} weapons=${names} selectSignal=${sig} />
        <//>`;
}

const SLOTS = ['Optic', 'Muzzle', 'Barrel', 'Stock', 'Laser', 'Underbarrel', 'Rear Grip', 'Ammunition', 'Perk'];
const slotKey = (s) => s.toLowerCase().replace(/\s+/g, '-');
// A real attachment name per slot, so the specimen reads like a build rather than like a colour chart.
const SPECIMEN = { Optic: 'Red Dot Sight 1', Muzzle: 'Monolithic Suppressor', Barrel: 'MIP Light Barrel (Long)', Stock: 'YKM Combat Stock',
    Laser: 'OWC Laser - Tactical', Underbarrel: 'Operator Foregrip', 'Rear Grip': 'Granulated Grip Tape', Ammunition: '48 Round Extended Mag', Perk: 'FMJ' };

// The legend is the TEST, so it is also the control: every swatch is a colour input, and picking one writes the slot's
// variable straight onto <html>, where every tag, chip and bar already reads it. His note, 2026-09-16 13:17 EDT: "can you
// make that clickable so i can manually change them as well?" A reset per slot returns it to whichever palette is on.
const Legend = () => {
    const pal = useB3('p2pal');
    const [mine, setMine] = useState({});
    const put = (k, v) => { document.documentElement.style.setProperty(`--sl-${k}`, v); setMine((m) => ({ ...m, [k]: v })); };
    const clear = (k) => { document.documentElement.style.removeProperty(`--sl-${k}`); setMine((m) => { const n = { ...m }; delete n[k]; return n; }); };
    useEffect(() => { Object.keys(mine).forEach((k) => document.documentElement.style.removeProperty(`--sl-${k}`)); setMine({}); }, [pal]);
    const read = (k) => { const v = getComputedStyle(document.documentElement).getPropertyValue(`--sl-${k}`).trim();
        if (/^#[0-9a-f]{6}$/i.test(v)) return v;
        const el = document.createElement('span'); el.style.color = v || '#888'; document.body.appendChild(el);
        const rgb = getComputedStyle(el).color; el.remove();
        const m = rgb.match(/\d+(\.\d+)?/g) || [136, 136, 136];
        return '#' + m.slice(0, 3).map((x) => Math.round(Number(x)).toString(16).padStart(2, '0')).join(''); };
    return html`
        <div class="g-legend" role="group" aria-label="Slot colours">
            ${SLOTS.map((s) => { const k = slotKey(s); return html`
                <span class=${'g-lg' + (mine[k] ? ' mine' : '')} key=${s} style=${`--sl:var(--sl-${k})`}>
                    <label><input data-bare type="color" value=${read(k)} aria-label=${`${s} colour`} onInput=${(e) => put(k, e.target.value)} /><i></i></label>${s}
                    ${mine[k] ? html`<button type="button" class="g-lg-x" aria-label=${`Reset ${s}`} onClick=${() => clear(k)}><${Icon} name="undo-2" /></button>` : null}
                </span>`; })}
        </div>`;
};

// Nine slots on one build, which no real weapon in the data carries — so a tag style can be judged on EVERY colour at
// once instead of on whichever five a weapon happens to have. It is a real .wg-r, so every p2sty rule applies to it.
const SlotSpecimen = () => html`
    <div class="g-spec">
        ${''/* The legend and the specimen are ONE block. Side by side they were a narrow column centred against a tall
             one, which the full-screen sweep of 2026-09-16 16:20 EDT showed as a band of dead space no clipped shot could
             see. The key belongs against the thing it keys anyway. */}
        <${Legend} />
        <div class="g-spec-l"><b>All nine slots</b><span>a build no weapon has — every colour, on the tag style you picked</span></div>
        <div class="wg-r g-spec-r" style="--c:var(--r-armory)">
            <div class="wg-rail">
                ${''/* \u26a0\ufe0f THE SPECIMEN CARRIED NO `data-slot`, so every slot-label mode would have drawn NOTHING on
                     the one element that exists to SHOW the fork before it is asked — the fifth invisible proposal of
                     this session, caught by reading the markup before rendering rather than after. (2026-09-17 13:06 EDT) */}
                ${SLOTS.map((s) => html`<span class="wg-at" key=${s} data-slot=${s} style=${`--sl:var(--sl-${slotKey(s)})`}><span class="wg-an">${SPECIMEN[s]}</span></span>`)}
            </div>
        </div>
    </div>`;

// 2026-09-21 15:21 EDT — Board 4 mounts this gate as #c-… rather than #g-…, and every Try here found no gate and did nothing. It looks for either.
const inSurface = (sel) => { const g = document.getElementById('g-armory-manifest') || document.getElementById('c-manifest'); return g ? g.querySelectorAll(sel) : []; };
const OpenProblems = () => html`
    <${Tries} items=${[0, 1, 2].map((i) => [`Open the ${['first', 'second', 'third'][i]}`, () => {
        const chips = inSurface('.b3-fchip, .wg-fsum');
        if (chips[i]) { chips[i].scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => chips[i].click(), 320); }
    }])} />`;

function PickBuilds() {
    const data = useData(load);
    const pick = (n) => {
        if (!surface.select || !data) return;
        const names = oneWeaponPerCategory(data.builds);
        surface.select(names.flatMap((w) => idsOf(data.builds, w)).slice(0, n));
    };
    return html`<${Tries} items=${[['Pick one build', () => pick(1)], ['Pick three', () => pick(3)],
        ['Pick eight across several weapons', () => pick(8)], ['Clear', () => pick(0)]]} />`;
}

// ── Repairs, command search and export are their own surfaces.
function A7({ session }) {
    const data = useData(load);
    const p6 = useB3('p6');
    const p6day = useB3('p6day');
    const secFixed = useB3('a1') === 'fixed';
    const [view, setView] = useState(VIEWS.coverage);
    const overlay = useOverlay();
    if (!data) return html`<p class="g-wait">Loading…</p>`;
    const builds = (data.builds || []).map((b) => withSec(b, secFixed));
    const mp = inMode(builds);
    const split = mp.map(splitCoverage);
    const failing = split.filter((c) => c.faults.length).length;
    const counts = {
        // ROUND 10A (2026-09-20 11:17 EDT): "that 64/125 number is useless hint text, remove it." A count on a SWITCH is
        // also wrong twice over - it moves with the filters while the switch does not, and the board it opens states it.

        [VIEWS.coverage]: p6 === 'now' ? failing : repairsStatus(mp, p6day === 'clean'),
    };
    return html`
        <${Stage} scroll=${true}>
            ${overlay.render()}
            <section class="panel">
                <${PanelHead} realm="Armory" views=${VIEW_ORDER.filter((v) => v !== VIEWS.coverage)} value=${view} onSet=${setView}
                             counts=${counts} rightView=${VIEWS.coverage} />
                ${view !== VIEWS.coverage
                    ? html`<p class="g-else">The board draws Repairs. ${view} is unchanged by this proposal.</p>`
                    : p6 === 'now'
                        ? html`<${Coverage} builds=${mp} active=${null} onFilter=${() => {}} />`
                        : html`<${RepairsPanel} inMode=${mp} builds=${builds} mode="MP"
                                                onFix=${(b) => overlay.say(`Board only · ${b.weaponName} would open in the drawer.`)}
                                                onShowAged=${() => overlay.say('Board only · the manifest would filter to what is stale.')}
                                                onShowBuild=${(b) => overlay.say(`Board only · the manifest would scroll to ${b.weaponName}.`)} />`}
            </section>
        <//>`;
}

// 🔴 "export drawer's search logic still needs improvement. I searched \"asv\", hoping to see \"as val\" listed but
// instead got no returns." The search was one `.includes()` over a space-joined string, so a query that crosses a
// word boundary — which is what typing fast produces — matched nothing. Two cheap rules fix it and both are what a
// person means when they type: STRIP THE SEPARATORS on both sides, so "asv" is a prefix of "asval"; and match the
// INITIALS of a multi-word weapon, so "av" finds AS VAL too. Nothing fuzzy, nothing scored — a substring search over
// a normalised string, which is the smallest change that makes his exact query work. (2026-09-17 09:52 EDT)
const pickerNorm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
function pickerMatch(q, b) {
    const needle = pickerNorm(q);
    if (!needle) return true;
    const hay = pickerNorm(`${b.weaponName} ${b.buildName || ''} ${(b.attachments || []).join(' ')}`);
    if (hay.includes(needle)) return true;
    const initials = String(b.weaponName || '').split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0]).join('').toLowerCase();
    return initials.length > 1 && initials.startsWith(needle);
}

// A scope's file name without its extension — the chip draws the extension itself, as the picker's does.
const fileBaseOf = (fn) => String(fn || '').replace(/\.txt$/i, '');

// v17 (his item 18): ONE rename field for the file cards and the landing's scopes, which are the same element. Its × and ✓ sit inside the
// chip's right padding (concentric radii, no divider), with classes of their own: the × had class "x", which the drawer's own × rules
// reached, and that was the stray box and the odd hover.
function RenameField({ value, label, onCommit }) {
    const input = (e) => e.currentTarget.closest('label').querySelector('input');
    return html`<label class="b3-xf-fn editing"><input type="text" value=${value} spellcheck="false" aria-label=${label} ref=${(el) => { if (el && document.activeElement !== el) { el.focus(); el.select(); } }}
            onBlur=${(e) => onCommit(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); e.currentTarget.value = value; e.currentTarget.blur(); } }} /><span class="b3-xf-ext" aria-hidden="true">.txt</span>
        <span class="b3-xf-fnb"><button type="button" class="b3-xf-no" aria-label="Keep the name it had" onMouseDown=${(e) => e.preventDefault()} onClick=${(e) => { const i = input(e); i.value = value; i.blur(); }}><${Icon} name="x" /></button><button type="button" class="b3-xf-ok" aria-label="Save the name" onMouseDown=${(e) => e.preventDefault()} onClick=${(e) => input(e).blur()}><${Icon} name="check" /></button></span></label>`;
}
function ExportPicker({ builds, scopes, onClose, overlay }) {
    const exp = useB3('exp');
    const expl = useB3('expl');
    const [step, setStep] = useState(exp === 'b' ? 'scopes' : 'both');
    const [q, setQ] = useState('');
    const [sel, setSel] = useState(() => new Set());
    const [selOpen, setSelOpen] = useState(false);
    // Tiles + file, round 4x: the category shown, the build under the pointer (the file answers it before the click),
    // the selection a Clear can take back, the Copy receipt, and the blocks on their way out.
    const [cat, setCat] = useState('ALL');
    const [hover, setHover] = useState(null);
    const [undo, setUndo] = useState(null);
    const [copied, setCopied] = useState(false);
    // The landing's filenames wear the picker's own file chip AND rename with it, because he asked for both:
    // "why are the file names bare text when the Pick Builds panel already introduced a default styling for the
    // file name chip and allows it to be editable?" A chip that LOOKS editable and is not would be worse than the
    // bare text it replaces, so the pencil is only drawn where it does something.
    const [fnames, setFnames] = useState({});
    const [renaming, setRenaming] = useState(null);
    const fileBase = (sc) => (fnames[sc.id] != null ? fnames[sc.id] : fileBaseOf(sc.filename));
    // The same cleaning `rename` gives a file card, so a scope's name and a file's name cannot
    // diverge in what they accept; an empty field falls back to the generated name rather than
    // leaving a chip with nothing in it.
    const renameScope = (sc, v) => {
        const clean = String(v).trim().replace(/\.txt$/i, '').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80);
        setFnames((m) => ({ ...m, [sc.id]: clean || fileBaseOf(sc.filename) }));
    };
    const [leaving, setLeaving] = useState(() => new Set());
    const fileRef = useRef(null);
    const peekRef = useRef(null);
    const lastAdded = useRef(null);
    const dwell = useRef(null);
    const listRef = useRef(null);
    const spyLock = useRef(null);   // a chip click owns the highlight until its scroll settles
    const [fresh, setFresh] = useState(null);
    // The file is ONE mode's: core/ops/loadouts.js's bulk add and replace take the mode from the op target and the file carries
    // none, so a file mixing MP and DMZ would import its DMZ half into MP. Picks in both modes are kept; each mode has its own file.
    const [xm, setXm] = useState('MP');
    // Round 5d: the export is a stack of FILES — one per mode at least, and a new one whenever the next pick would carry a
    // file past a /manage paste. Older files fold away when a new one opens; the fold control exists only once there are two.
    const [shut, setShut] = useState(() => new Set());
    // A file's name, as he renamed it; the .txt stays fixed. Keyed by the file's mode and number, so a rename survives picks.
    const [names, setNames] = useState({});
    const [naming, setNaming] = useState(null);   // the file whose name is being edited; at rest a name is text, not a field
    const [copiedKey, setCopiedKey] = useState(null);
    const prevKeys = useRef('');
    useEffect(() => {
        const id = lastAdded.current;
        if (!id || !fileRef.current) return;
        lastAdded.current = null;
        const el = fileRef.current.querySelector(`[data-id="${id}"]`);
        if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        setFresh(id); setTimeout(() => setFresh((f) => (f === id ? null : f)), 1100);
    }, [sel]);
    useEffect(() => { setStep(exp === 'b' ? 'scopes' : 'both'); }, [exp]);
    // Polish (2026-09-18 10:54 EDT): entering the picker puts the caret in its search, which is the step's first act. On the board the
    // drawer mounts with the page, so its first-focus rings the close button before anyone has pressed a key; gates/main.js
    // and gates.css hold that ring back until a key is pressed.
    const qref = useRef(null);
    useEffect(() => {
        if (step === 'picker' && qref.current) qref.current.focus({ preventScroll: true });
    }, [step]);
    const mp = inMode(builds, xm);
    const groups = [];
    for (const b of mp) {
        const hit = pickerMatch(q, b);
        if (!hit) continue;
        const g = groups.find((x) => x.name === b.weaponName);
        if (g) g.list.push(b); else groups.push({ name: b.weaponName, accent: b.accent, category: b.category, list: [b] });
    }
    const toggle = (ids, on) => setSel((s) => { const n = new Set(s); ids.forEach((id) => (on ? n.add(id) : n.delete(id))); return n; });
    // v20 (2026-09-24 15:49 EDT, his "the text/lines should be using the actual export format that the file would deliver"): one writer, the board's Bulk
    // create format (b4/bulkformat.js) — "WEAPON | CATEGORY | MODE", then Label / Code / Image / Badges and "- " attachments — so the list, the
    // hover card and the download are the same characters, and a file comes back in through Bulk create untouched. An auto label ("Build 1")
    // is never written and a key carries no .png. Session 5 ports this format to utils/adminParser.js, whose keyed "Build:" form it replaces.
    const blockOf = (b) => toDisplay(writeCompact([b])).split('\n');
    const fname = `dioreo-${xm.toLowerCase()}-${isoLocal()}.txt`;
    const take = () => {
        const list = mp.filter((b) => sel.has(String(b._id)));
        const text = list.map((b) => blockOf(b).join('\n')).join('\n\n');
        downloadText(fname, text);
        overlay.say(`${list.length} ${xm} build${list.length === 1 ? '' : 's'} exported in the bulk-import format.`);
    };
    const picker = html`
        <div class="g-pick">
            <div class="g-pick-h">
                <label class="g-pick-q"><${Icon} name="search" /><span class="sr">Search builds</span>
                    <input data-bare ref=${qref} value=${q} placeholder="Search a weapon, a build name, an attachment" onInput=${(e) => setQ(e.target.value)}
                           onKeyDown=${(e) => { if (e.key === 'Escape' && q) { e.stopPropagation(); setQ(''); } }} />
                    ${q ? html`<button type="button" class="g-pick-qx" aria-label="Clear the search" onClick=${() => setQ('')}><${Icon} name="x" /></button>` : null}</label>
                <span class="g-pick-n"><b>${sel.size}</b> picked</span>
                ${sel.size ? html`<button type="button" class="pill sm" onClick=${() => setSel(new Set())}>Clear</button>` : null}
            </div>
            ${''/* "are you seriously telling me that after i select a build, I have to scroll thru the entire list to
                 see what i have selected???" No — a control that acts on a selection has to SHOW the selection rather
                 than count it. The bar above the manifest already does this with weapon chips; the picker counted and
                 showed nothing. Same object, second home. */}
            ${''/* 🔴 THIS STRIP EXISTS BECAUSE OF "are you seriously telling me that after i select a build, I have to
                 scroll thru the entire list to see what i have selected???" — and measured 2026-09-17 10:51 EDT at 22 picks it
                 was reproducing that complaint at a smaller scale: capped at 76px with `overflow-y:auto`, it hid
                 202px of chips, roughly two thirds of the selection, inside a scroll region nested in the drawer's
                 own scroll. A fix that fails on its own terms the moment the case gets big is not a fix.
                 It shows what fits and then SAYS how many it is not showing, with one press to see them all —
                 `.b3-sc.more` already existed in the stylesheet for exactly this, which is the second time today a
                 thing I was about to build turned out to be already there. */}
            ${sel.size ? html`
            <div class=${'g-pick-sel' + (selOpen ? ' open' : '')} role="group" aria-label="Picked builds">
                ${mp.filter((b) => sel.has(String(b._id))).slice(0, selOpen ? 999 : 8).map((b) => html`
                    <span class="b3-sc" key=${b._id} style=${`--c:${b.accent || 'var(--ink3)'}`}>
                        <i aria-hidden="true"></i><span class="b3-nw">${b.weaponName}<em>${b.buildName || 'Build'}</em></span>
                        <button type="button" aria-label=${`Unpick ${b.weaponName}`} onClick=${() => toggle([String(b._id)], false)}><${Icon} name="x" /></button>
                    </span>`)}
                ${sel.size > 8 ? html`<button type="button" class="b3-sc more" onClick=${() => setSelOpen(!selOpen)}>
                    ${selOpen ? 'Show fewer' : `+${sel.size - 8} more`}</button>` : null}
            </div>` : null}
            <div class="g-pick-l" role="group" aria-label="Builds to export">
                ${groups.map((g) => {
                    const ids = g.list.map((b) => String(b._id));
                    const all = ids.every((id) => sel.has(id));
                    const some = !all && ids.some((id) => sel.has(id));
                    return html`
                    <div class="g-pick-g" key=${g.name} style=${`--c:${g.accent || 'var(--ink3)'}`}>
                        <button type="button" class="g-pick-gh" aria-pressed=${all ? 'true' : some ? 'mixed' : 'false'} onClick=${() => toggle(ids, !all)}>
                            <span class=${'cb' + (all ? ' on' : some ? ' some' : '')}></span><i></i><b>${g.name}</b>
                            <small>${(typeof CATEGORY_CHIP_LABEL !== 'undefined' && CATEGORY_CHIP_LABEL[g.category]) || g.category}</small>
                            <em>${g.list.length} build${g.list.length === 1 ? '' : 's'}</em>
                        </button>
                        ${g.list.map((b) => {
                            const id = String(b._id);
                            return html`
                            <button type="button" class="g-pick-r" key=${id} aria-pressed=${sel.has(id) ? 'true' : 'false'} onClick=${() => toggle([id], !sel.has(id))}>
                                <span class=${'cb' + (sel.has(id) ? ' on' : '')}></span>
                                ${''/* "i also notice the attachment names being trunated, which is a real gap in the design
                                     here." It was: one nowrap cell 248px wide inside a 560px drawer, clipping mid-word —
                                     "OWC Skeleton Sto…". A build has five attachments and their names are the thing you are
                                     choosing between, so they get their own line and wrap as chips. Nothing truncates. */}
                                <span class="n" title=${b.buildName || null}>${b.buildName || 'Build'}</span>
                                <span class="c">${b.shareCode || html`<i class="c-none">no code</i>`}</span>
                                <span class="a">${(b.attachments || []).length
                                    ? (b.attachments || []).map((a, i) => { const s = (b.attachmentSlots || [])[i]; return html`<span class="wg-at" key=${i} data-slot=${s || null} style=${SLOTS.includes(s) ? `--sl:var(--sl-${slotKey(s)})` : null}><span class="wg-an">${a}</span></span>`; })
                                    : html`<i class="c-none">no attachments</i>`}</span>
                            </button>`;
                        })}
                    </div>`;
                })}
                ${!groups.length ? html`<div class="g-pick-none" role="status">
                    <b>Nothing matches “${q}”</b>
                    <span>The search reads weapon names, build names and attachments — ${mp.length.toLocaleString()} builds are in this mode.</span>
                    <button type="button" class="pill sm" onClick=${() => setQ('')}>Clear the search</button>
                </div>` : null}
            </div>
        </div>`;
    // ── TILES + FILE (round 4w, 2026-09-18 11:14 EDT). His ask: "aggressive, drastic design improvements, especially the export
    // drawer." The checklist drew every build as a card with five attachment tags, so 125 builds stood 4,000px tall and
    // the thing you were making — a text file — was nowhere on screen. Two moves. The picking side collapses each weapon
    // to a tile whose builds are NUMBERS you tap (the manifest's own build numerals; hover one for its name and code),
    // so the catalogue is a grid you scan, not a column you scroll. And the other side is the FILE: every tick writes its
    // block, exactly as it will download and exactly what the bot reads back, so what you picked and what you get are
    // the same object. The chip strip and "N picked" go — the file says both.
    // ── ROUND 4Z (2026-09-18 15:31 EDT): v1's compact tiles and single block border, v2's category grouping, v3's separate file card,
    // count headline, Enter-to-add and preview — his list, after 4y's rail, list rows, slot ticks and sandwiched actions.
    // (The notes below are 4y's; the rail and the list rows they describe are gone.)
    // ── THE REQUISITION (round 4y, 2026-09-18 15:12 EDT). "Not enough effort … enough to check off a task, not enough to be awwwards
    // worthy." He was right: v22 was a list of fixes on a composition of boxes inside boxes. This is the composition
    // rebuilt around the one object that matters — the file — and the armory's own vocabulary:
    //  · ONE LIFTED OBJECT. The catalogue and its index sit flat on the drawer; the file is the only raised surface, with
    //    the count as its hero and its own actions (Download, Copy) on it rather than split into the drawer footer.
    //  · THE CATALOGUE IS A LIST, NOT A PARKING LOT. Weapons read top to bottom as in the manifest; each weapon's builds
    //    are one segmented strip of the armory's build numbers, right-aligned so every strip ends on one line.
    //  · THE INDEX IS A MAP OF YOUR PICKS. The category rail jumps and follows the scroll, and shows how many you have
    //    picked in each category — where your selection lives, at a glance.
    //  · THE FILE IS TYPESET, NOT DECORATED. The characters are exactly the download; weight and colour carry structure,
    //    and each attachment line's gutter takes its SLOT colour, so the file speaks the tag palette.
    //  · ENTER ADDS. When the search narrows to one build (or one weapon), Enter adds it and clears the search.
    const fileList = mp.filter((b) => sel.has(String(b._id)));
    const catOrder = typeof CATEGORY_CHIP_ORDER !== 'undefined' ? CATEGORY_CHIP_ORDER : [];
    const catLabelOf = (c) => (typeof CATEGORY_CHIP_LABEL !== 'undefined' && CATEGORY_CHIP_LABEL[c]) || c;
    const allGroups = [];
    for (const b of mp) {
        const g = allGroups.find((x) => x.name === b.weaponName);
        if (g) g.list.push(b); else allGroups.push({ name: b.weaponName, accent: b.accent, category: b.category, list: [b] });
    }
    const matchIds = new Set(groups.flatMap((g) => g.list.map((b) => String(b._id))));
    const rowsG = allGroups.filter((g) => g.list.some((b) => matchIds.has(String(b._id))));
    const byCat = (x, y) => catOrder.indexOf(x) - catOrder.indexOf(y);
    const railCats = [...new Set(allGroups.map((g) => g.category))].sort(byCat);
    const listCats = [...new Set(rowsG.map((g) => g.category))].sort(byCat);
    const live = (id) => sel.has(id) && !leaving.has(id);
    const pickedIn = (c) => mp.filter((b) => b.category === c && live(String(b._id))).length;
    const pickT = (ids, on) => {
        if (on) { lastAdded.current = ids[ids.length - 1]; toggle(ids, true); return; }
        const out = ids.filter((id) => sel.has(id));
        setLeaving((s) => new Set([...s, ...out]));
        setTimeout(() => { toggle(out, false); setLeaving((s) => { const n = new Set(s); out.forEach((id) => n.delete(id)); return n; }); }, 170);
    };
    // A file is what ONE /manage Bulk Add paste can carry: Discord caps a modal text input at 4,000 characters (components
    // reference, max_length "min 1, max 4000"; buildLoadoutsBulkAddModal sets no lower cap — verified 2026-09-18 16:17 EDT).
    // Files fill in PICK order and a block is never split: when the next whole block would pass 4,000 (with the blank line
    // between blocks counted), a new file opens. MP and DMZ never share a file (board 3's rule; since his 'Per build' ruling of
    // 2026-09-22 the file carries each build's Mode, so the split is a design choice, not a need). Built from every pick in both modes, so the MP/DMZ switch on the left
    // changes what you are picking from and never what is on the right. (2026-09-18 19:33 EDT)
    const PASTE_MAX = 4000;
    const PASTE_WARN = 3600;
    const MODE_HEX = { MP: '#FF3B5C', DMZ: '#3DA5F5' }; // the masthead's own pair (app.css .mh-mode)
    const byId = new Map(builds.map((b) => [String(b._id), b]));
    const files = [];
    for (const m of ['MP', 'DMZ']) {
        let cur = null;
        for (const id of sel) {
            const b = byId.get(id);
            if (!b || b.mode !== m) continue;
            const len = blockOf(b).join('\n').length;
            if (!cur || cur.chars + 2 + len > PASTE_MAX) { cur = { mode: m, n: files.filter((f) => f.mode === m).length + 1, list: [b], chars: len }; files.push(cur); }
            else { cur.list.push(b); cur.chars += 2 + len; }
        }
    }
    const today = isoLocal();
    for (const f of files) {
        const tot = files.filter((x) => x.mode === f.mode).length;
        f.key = `${f.mode}-${f.n}`;
        f.base0 = `dioreo-${f.mode.toLowerCase()}-${today}${tot > 1 ? `-${f.n}` : ''}`;
        f.base = names[f.key] || f.base0;
        f.fname = `${f.base}.txt`;
        f.text = f.list.map((b) => blockOf(b).join('\n')).join('\n\n');
    }
    const fileKeys = files.map((f) => f.key).join(',');
    useEffect(() => {
        const before = prevKeys.current ? prevKeys.current.split(',') : [];
        const now = fileKeys ? fileKeys.split(',') : [];
        const added = now.filter((k) => !before.includes(k));
        if (added.length && now.length > 1) { const newest = added[added.length - 1]; setShut(new Set(now.filter((k) => k !== newest))); }
        prevKeys.current = fileKeys;
    }, [fileKeys]);
    // 2026-09-19 11:02 EDT: "only 1 list should expand at a time… both are allowed to be collapsed at the same time." Opening one shuts every other.
    // An opened file slides to where it can be read once its fold has settled — with more files than the column holds it would open below the fold.
    const toggleShut = (k) => {
        const opening = shut.has(k);
        setShut((s) => (s.has(k) ? new Set(files.map((f) => f.key).filter((x) => x !== k)) : new Set([...s, k])));
        if (opening) setTimeout(() => { const el = fileRef.current && fileRef.current.querySelector(`[data-fk="${k}"]`); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 440);
    };
    // A rename keeps the .txt: whatever is typed loses a trailing .txt and any character a file name cannot hold; empty goes back to the default.
    const rename = (f, v) => { const clean = String(v).trim().replace(/\.txt$/i, '').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80); setNames((m) => ({ ...m, [f.key]: clean && clean !== f.base0 ? clean : undefined })); };
    const copyFile = (f) => { try { navigator.clipboard.writeText(f.text); } catch (e) { /* board only */ } setCopiedKey(f.key); setTimeout(() => setCopiedKey((k) => (k === f.key ? null : k)), 1300); };
    const takeFile = (f) => { downloadText(f.fname, f.text); overlay.say(`${f.list.length} ${f.mode} build${f.list.length === 1 ? '' : 's'} downloaded as ${f.fname}.`); };
    const clearFile = (f) => {
        const ids = new Set(f.list.map((b) => String(b._id)));
        const prev = new Set(sel);
        setSel((s) => new Set([...s].filter((id) => !ids.has(id))));
        overlay.say(`Cleared ${ids.size} ${f.mode} build${ids.size === 1 ? '' : 's'} from ${f.fname}.`, 'Undo', () => setSel(prev));
    };
    const switchMode = (m) => { if (m === xm) return; setXm(m); setQ(''); setCat('ALL'); if (listRef.current) listRef.current.scrollTop = 0; };
    // 2026-09-30 18:18 EDT (his timing sets): the peek is set 2 — a wait before it shows and before it goes; moving between rows hands over at once
    const aim = (id) => { clearTimeout(dwell.current); if (hover != null) dwell.current = setTimeout(() => setHover(id), 70);   /* row to row: the 70ms dwell stays, or a sweep flashes every row it crosses (filmed) */ else dwell.current = setTimeout(() => setHover(id), POPT[2].openWait); };
    const unaim = () => { clearTimeout(dwell.current); dwell.current = setTimeout(() => setHover(null), POPT[2].closeWait); };
    const only = matchIds.size === 1 ? mp.find((b) => matchIds.has(String(b._id))) : null;
    const oneWeapon = !only && rowsG.length === 1 ? rowsG[0] : null;
    const enterHint = !q ? null : only ? `adds ${only.weaponName} · Build ${buildNumberOf(builds, only).n}`
        : oneWeapon ? `adds ${oneWeapon.list.filter((b) => matchIds.has(String(b._id))).length} ${oneWeapon.name} builds` : null;
    const onFindKey = (e) => {
        if (e.key === 'Escape' && q) { e.stopPropagation(); setQ(''); return; }
        if (e.key !== 'Enter' || !q) return;
        if (only) { pickT([String(only._id)], true); setQ(''); }
        else if (oneWeapon) { pickT(oneWeapon.list.filter((b) => matchIds.has(String(b._id))).map((b) => String(b._id)), true); setQ(''); }
    };
    // (2026-09-19 14:19 EDT) "i have LMGs on my screen yet the scrollspy is highlighting 'smg'". The old rule lit the LAST bay whose top had reached
    // 16px under the list's top, so a bay stayed lit while all that showed of it was a faded sliver: measured with LMG's top 46px into a
    // 619px list, SMG was lit. A bay is now current once its top crosses a reading line a third of the way down the visible list (160px at
    // most), measured on screen rather than from offsetTop; at the end of the list the last bay is current, however short it is; and a
    // chip click keeps its own highlight until its smooth scroll ends, so the chips do not flicker through every bay on the way.
    const jump = (c) => {
        const L = listRef.current; const s = L && L.querySelector(`[data-cat="${c}"]`);
        if (s) { spyLock.current = c; clearTimeout(spyLock.t); spyLock.t = setTimeout(() => { spyLock.current = null; }, 900); L.scrollTo({ top: s.offsetTop - 4, behavior: 'smooth' }); }
        setCat(c);
    };
    const spy = () => {
        const L = listRef.current; if (!L || spyLock.current) return;
        const secs = [...L.querySelectorAll('[data-cat]')]; if (!secs.length) return;
        const top = L.getBoundingClientRect().top;
        const line = top + Math.min(L.clientHeight / 3, 160);
        let on = secs[0].dataset.cat;
        if (L.scrollTop + L.clientHeight >= L.scrollHeight - 2) on = secs[secs.length - 1].dataset.cat;
        else secs.forEach((s) => { if (s.getBoundingClientRect().top <= line) on = s.dataset.cat; });
        if (on !== cat) setCat(on);
    };
    const current = listCats.includes(cat) ? cat : listCats[0];
    let ln = 0;
    const where = {};
    const rows = fileList.map((b, i) => {
        const id = String(b._id);
        const sep = i > 0 ? ++ln : null;
        const start = ln + 1;
        let att = 0;
        const lines = blockOf(b).map((t) => {
            const slot = t.startsWith('- ') ? (b.attachmentSlots || [])[att++] : null;
            return { n: ++ln, t, slot: SLOTS.includes(slot) ? slot : null };
        });
        where[id] = [start, ln];
        return { b, id, sep, lines };
    });
    const hb = hover ? mp.find((b) => String(b._id) === hover) : null;
    const hIn = hb && live(hover);
    // 2026-09-29 13:23 EDT (his V40 class D, the GIF of the peek flashing at the top): on leave the card emptied and lost its placement in the same frame, so its
    // fade ran from the stage's default corner. It now keeps the build it last showed until the fade is over, and the placement below keeps running for it.
    const lastPeek = useRef(null); if (hb) lastPeek.current = hb;
    const pb = hb || lastPeek.current;
    const pIn = pb && live(String(pb._id));
    // K8 (2026-09-21 22:40 EDT, rewritten) — his C5-2: the card "floats in the middle of nowhere" once a list is collapsed or several exist. It now
    // ANCHORS to the file the build belongs to (or would join, by mode): an open file → inside it, just above its own name/Copy/Download row; a
    // collapsed file → just under its header card. Clamped to the files viewport. Board 4 only; 3-E keeps its fixed bottom:66px.
    // v19 (his items 1–4): the card SIZES TO WHAT IT HOLDS. A board rule pinned its bottom (bottom:98px !important) while this effect set its top, so
    // its height was the gap between them: the build's text ran out past it with no builds picked, and "already in this export" sat in a card
    // sized for eight lines. It now keeps ONE edge — its bottom above the file's name row, or its top under a folded file's header — and the other
    // follows the content. A change of content animates the height (FLIP: the old height to the new), and a move animates the kept edge.
    const peekH = useRef(0);
    useLayoutEffect(() => {
        const pk = peekRef.current, fl = fileRef.current;
        if (!(typeof window !== 'undefined' && window.B4_COLLECTIVE) || !pk || !fl || !pb) return undefined;
        const where = whereF[String(pb._id)];
        const key = where ? where.f.key : (files.find((f) => f.mode === pb.mode) || {}).key;
        const card = key ? fl.querySelector(`[data-fk="${key}"]`) : null;
        const S = (pk.offsetParent || fl.parentElement).getBoundingClientRect(), V = fl.getBoundingClientRect();
        // v20 (his "the peek card's position needs finetuning"): one inset, 14px — the card's own left and right — to the file's footer (its dashed rule) under
        // it, to the floor when no file is open, and under a folded file. It was 8px with the name row guessed at 66px: 11px over the name, 8 off the floor.
        const h = pk.offsetHeight, gap = 14;
        const floor = S.bottom - V.bottom + gap;                                    // the kept bottom edge can never sit under the files' viewport
        if (card && card.classList.contains('shut')) {
            const R = card.getBoundingClientRect();
            pk.style.bottom = 'auto'; pk.style.top = Math.round(Math.min(R.bottom - S.top + gap, V.bottom - S.top - h - gap)) + 'px';
        } else {
            const nm = card ? card.querySelector('.b3-xf-f') : null;
            const want = S.bottom - (nm ? nm.getBoundingClientRect().top : V.bottom) + gap;
            pk.style.top = 'auto'; pk.style.bottom = Math.round(Math.max(floor, Math.min(want, S.height - (V.top - S.top) - h - gap))) + 'px';
        }
        const was = peekH.current; peekH.current = h;
        if (was && Math.abs(was - h) > 1 && pk.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
            pk.animate([{ height: `${was}px` }, { height: `${h}px` }], { duration: 240, easing: 'cubic-bezier(.32,.72,0,1)' });
        }
        return undefined;
    }, [pb, hIn, fileKeys, shut]);  // hIn: the same build, added or removed, changes what the card holds
    const lineOf = (t, i, b) => (i === 0 ? html`<b>${b.weaponName}</b>${t.slice(b.weaponName.length).split(' | ').slice(1).map((x) => html`<i> | </i>${x}`)}`
        : t.startsWith('- ') ? html`<i>- </i>${t.slice(2)}`
        : html`<em>${t.slice(0, t.indexOf(':') + 1)}</em>${t.slice(t.indexOf(':') + 1)}`);
    const sample = mp.find((b) => b.shareCode && (b.attachments || []).length >= 4) || mp[0];
    const fileRowsOf = (f) => {
        let ln = 0;
        return f.list.map((b, i) => {
            const id = String(b._id);
            const sep = i > 0 ? ++ln : null;
            const start = ln + 1;
            const lines = blockOf(b).map((t) => ({ n: ++ln, t }));
            return { b, id, sep, lines, start, end: ln };
        });
    };
    const whereF = {};
    for (const f of files) { const rs = fileRowsOf(f); const tot = rs.length ? rs[rs.length - 1].end : 0; for (const r of rs) whereF[r.id] = { f, a: r.start, z: r.end, tot }; }
        // (2026-09-19 19:51 EDT) "is this the same mesh used in the selection bar? because idk... it feels different here."
    // It was not, and the reason is the part of the recipe that is not in the CSS at all: the bar's two hues are its own
    // CONTENT — `m1 = groups[0].accent`, `m2 = groups[1].accent`, the first two selected weapons, written inline on the
    // element (b3/armory-parts.js). The drawer had them hardcoded to the pair the bar happened to be showing, so its mesh
    // was a photograph of one selection and never moved. The picker lights its own mesh now, from the first two weapons
    // picked, with the bar's own fallbacks. The CSS keeps those fallbacks too, because a var() that resolves to nothing
    // makes the whole background invalid and the drawer would render with no ground at all.
    // (2026-09-19 20:16 EDT) "i only really see my first weapon selection changing it. any additional selection dont seem to move
    // the colors at all visually." He is right, and the cause is that AN ACCENT IS A CATEGORY, not a weapon — every
    // Assault tile is #ff3b5c, every SMG #ffd23f, every LMG #845ec2 (measured). The bar takes the first two DISTINCT
    // accents, so on this surface the mesh fills both slots on your first two categories and then freezes, however many
    // of the 125 builds you go on to pick. That rule fits a bar holding a handful of builds; it does not fit a picker
    // holding seven bays. The recipe already has FOUR coloured layers, so all four are fed here, ranked by how many
    // builds are picked in each category — the mesh keeps moving as the selection's balance changes, and the ranking
    // means adding one SMG to twenty Assaults nudges it rather than flipping it. This is DELIBERATELY more responsive
    // than the selection bar; the bar's own two-hue rule is unchanged.
    const meshHues = (() => {
        const n = new Map();
        const first = new Map();
        let i = 0;
        for (const id of sel) {
            const b = byId.get(id);
            const c = b && b.accent;
            if (!c) continue;
            n.set(c, (n.get(c) || 0) + 1);
            if (!first.has(c)) first.set(c, i);
            i += 1;
        }
        // ⚠️ the tie-break matters more than the sort. Ranking equal counts by their hex made one LMG demote twenty
        // Assaults out of the first light, because "#845ec2" sorts before "#ff3b5c" — the mesh FLIPPED on a pick that
        // should have nudged it. Ties go to whichever category was picked first, so the light drifts with the selection
        // instead of reshuffling under it.
        const ranked = [...n.entries()].sort((x, y) => y[1] - x[1] || first.get(x[0]) - first.get(y[0])).map(([c]) => c);
        return [ranked[0] || 'var(--staged)', ranked[1] || 'var(--r-armory)', ranked[2] || 'var(--staged)', ranked[3] || 'var(--r-armory)'];
    })();
    // (2026-09-19 21:14 EDT) "my original geometry was using the double digit as an example… the fix is to take my underlying class
    // (clean, aligned, etc) but apply that fix more generally to work regardless of the edgecase."
    // THE RULE HIS NUMBERS ENCODE, read off the render at two digits: the numeral's ink starts on the card's 16px inset —
    // the line the Clear button draws — and everything to its right begins 11px after that ink ENDS. x82 is not a law, it
    // is what that rule produces when the numeral happens to be two digits wide. At one digit the literal 82 outlives the
    // rule and leaves a 27px hole, which is what he is looking at.
    // So the well is measured, not fixed: as wide as the WIDEST numeral currently on screen. One file showing "2" gets a
    // tight header; one showing "23" gets exactly the header he approved; and a stack of 23/23/24/22/22/11 shares one well
    // so every card's title and name chip still align down the column — the case a per-card well would break, and the one
    // that only appears when every build is picked.
    // ⚠️ The old fixed 52.96px was narrower than the two-digit ink it was tuned on (55.2px); the numeral overflowed its own
    // column and only missed the title because the glyph's right bearing absorbed it. Measuring fixes that too.
    const chipsRef = useRef(null);
    const chipHover = useRef(false);
    useEffect(() => {
        const row = chipsRef.current;
        if (!row || chipHover.current) return;
        const el = row.querySelector(`[data-bay="${current}"]`);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const rr = row.getBoundingClientRect();
        if (r.left < rr.left + 10) row.scrollBy({ left: r.left - rr.left - 10, behavior: 'smooth' });
        else if (r.right > rr.right - 10) row.scrollBy({ left: r.right - rr.right + 10, behavior: 'smooth' });
    }, [current]);
    const xtRef = useRef(null);
    useEffect(() => {
        const d = xtRef.current && xtRef.current.closest('.drawer');
        if (!d) return undefined;
        meshHues.forEach((c, i) => d.style.setProperty(`--m${i + 1}`, c));
        return () => { [1, 2, 3, 4].forEach((i) => d.style.removeProperty(`--m${i}`)); };
    }, [meshHues[0], meshHues[1], meshHues[2], meshHues[3]]);
    const fileCard = (f, multi) => {
        // 2026-09-22 14:06 EDT — his item 38a: a file shut while it held builds stayed shut once they were all taken off, so the empty state never showed.
        const isShut = shut.has(f.key) && f.list.length > 0;
        const chars = f.text.length;
        const warn = chars >= PASTE_WARN;
        const count = f.list.length;
        // the empty placeholder file carries only a fname; its name reads from that
        if (!f.base) { f.base = f.fname.replace(/\.txt$/, ''); f.base0 = f.base; }
        return html`
            <section class=${'b3-xf' + (isShut ? ' shut' : '') + (count ? '' : ' b3-xf-none')} key=${f.key} data-fk=${f.key} style=${`--m:${MODE_HEX[f.mode]}`} aria-label=${f.fname}>
                ${''/* 2026-09-19 11:46 EDT: THE HEADER, SET AS TYPE (his "not satisfied… look at it thoroughly"). Two lines on a grid: the title and the
                     character chip share one baseline; the file's name and the fold share the second. The count is a drop numeral
                     spanning both — its cap top on the title's cap top, its foot on the name's baseline — where it used to be centred
                     on the block and aligned with nothing. The whole header opens and shuts the file (the name field and the chip
                     excepted) — ⚠️ his word: the fold is a bordered button, in the header.
                     ⚠️ 2026-09-19 11:49 EDT: a fill line along the seam was tried and REJECTED — his design stands: "show close to 4000 limit
                     by making the character chip the warn color". The chip goes warn from 3,600; nothing else draws the limit. */}
                ${''/* (2026-09-20 00:15 EDT) THE HEADER IS ONE LINE, his design: "## MP builds [clear] | [expand]". The count is the
                     selection bar's own square (.b3-sd-count: 40px, 10px corners, JetBrains Mono 16.5/700, near-black ink)
                     wearing the mode accent, and the words following it 16px after its border. The two marks carry no word
                     until hover, with 16px of air either side of the divider. The drop numeral, its measured well and the
                     per-card bearing compensation are gone — the count sits inside the title's own flow, so its left edge is
                     the card's 16px inset on every card and cannot go ragged again (it had been 29.85px ragged across six).
                     The file name and the character count moved to the footer, where the actions that consume them are. */}
                ${count ? html`
                <header class="b3-xf-h">
                    <strong class="b3-xf-t" aria-label=${`${count} ${f.mode} build${count === 1 ? '' : 's'}`}><i class="b3-xf-sq" aria-hidden="true">${count}</i>${f.mode} build${count === 1 ? '' : 's'}</strong>
                    <span class="b3-xf-acts">
                        <button type="button" class="b3-xf-ib dang" aria-label=${`Clear ${f.fname}`} onClick=${() => clearFile(f)}><${Icon} name="trash-2" /><span class="b3-xf-ibl"><span>Clear</span></span></button>
                        <span class="b3-xf-div" aria-hidden="true"></span>
                        <button type="button" class="b3-xf-ib" aria-expanded=${isShut ? 'false' : 'true'} aria-label=${isShut ? `Expand ${f.fname}` : `Collapse ${f.fname}`} onClick=${() => toggleShut(f.key)}><${Fold} open=${!isShut} /><span class="b3-xf-ibl"><span>${isShut ? 'Expand' : 'Collapse'}</span></span></button>
                    </span>
                </header>` : html`
                ${''/* (2026-09-19 17:40 EDT) THE EMPTY FILE IS NOT A FILE YET, so it stops pretending to be one: no name to rename, no character
                     count to warn about, no fold. What it has is a state and an instruction, set as one block on the card's own
                     16px line — the mode it will carry, what is waiting, and the one move that starts it. */}
                <header class="b3-xf-h0"><strong class="b3-xf-t" aria-label=${`No ${f.mode} builds picked yet`}><i class="b3-xf-sq" aria-hidden="true">0</i>${f.mode} builds</strong></header>`}
                <div class="b3-xf-bw" aria-hidden=${isShut ? 'true' : null}>
                    <div class="b3-xf-b b3-fady" role="list">
                        ${count ? fileRowsOf(f).map(({ b, id, sep, lines }) => html`
                            ${sep ? html`<div class="b3-xt-ln b3-xt-sep" key=${'s' + id} aria-hidden="true"><span class="b3-xt-no">${sep}</span><span class="b3-xt-tx"></span></div>` : null}
                            <div class=${'b3-xt-blk' + (leaving.has(id) ? ' out' : '') + (hIn && hover === id ? ' aimed' : '') + (fresh === id ? ' fresh' : '')} role="listitem" key=${id} data-id=${id} style=${`--c:${b.accent || 'var(--ink3)'}`}>
                                <div class="b3-xt-bin">
                                    ${lines.map(({ n, t }, k) => html`<div class=${'b3-xt-ln' + (k === 0 ? ' x-hd' : t.startsWith('- ') ? ' x-at' : ' x-kv')} key=${n}><span class="b3-xt-no">${n}</span><span class="b3-xt-tx">${lineOf(t, k, b)}</span></div>`)}
                                    <button type="button" class="b3-xt-rm" aria-label=${`Take ${b.weaponName} build ${buildNumberOf(builds, b).n} off the file`} onClick=${() => pickT([id], false)}><${Icon} name="x" /></button>
                                </div>
                            </div>`) : html`
                            <div class="b3-xt-empty">
                                ${sample ? html`<div class="b3-xt-ghost" aria-hidden="true" style=${`--c:${sample.accent || 'var(--ink3)'}`}><div class="b3-xt-bin">${blockOf(sample).slice(0, 7).map((t, k) => html`<div class=${'b3-xt-ln' + (k === 0 ? ' x-hd' : t.startsWith('- ') ? ' x-at' : ' x-kv')} key=${k}><span class="b3-xt-no">${k + 1}</span><span class="b3-xt-tx">${lineOf(t, k, sample)}</span></div>`)}</div></div>` : null}
                                <b>Nothing picked yet</b>
                                <span>Pick a build number on the left. It lands here in the exact format bulk import reads back, and a new file starts whenever one paste would run past 4,000 characters.</span>
                            </div>`}
                    </div>
                </div>
                <footer class="b3-xf-f">
                    ${''/* (2026-09-20 00:15 EDT) The name and the size sit with Copy and Download, because that is the moment they are read.
                         At rest the name is still type inside a chip, and it wears a faint --ok tint so the pair reads name-first:
                         the character count had been the louder of the two, while the name is the thing you actually rename. */}
                    <div class="b3-xf-fid">
                        ${count ? (naming === f.key
                            ? html`<${RenameField} value=${f.base} label=${`File name for ${f.fname}`} onCommit=${(v) => { rename(f, v); setNaming(null); }} />`
                            : html`<button type="button" class="b3-xf-fn" title="Rename the file" aria-label=${`Rename ${f.fname}`} onClick=${(e) => { e.stopPropagation(); setNaming(f.key); }}><span class="b3-xf-nm">${f.base}</span><span class="b3-xf-ext">.txt</span><${Icon} name="pencil" /></button>`) : null}
                        ${count ? html`<${CharCount} n=${chars} cap=${PASTE_MAX} warnAt=${PASTE_WARN} />` : null}
                    </div>
                    <span class="b3-xf-fact">
                    <button type="button" class=${'b3-btn2 sm' + (copiedKey === f.key ? ' b3-xt-done' : '')} disabled=${!count} onClick=${() => copyFile(f)}><${Icon} name=${copiedKey === f.key ? 'check' : 'copy'} />${copiedKey === f.key ? 'Copied' : 'Copy'}</button>
                    <button type="button" class="b3-btn2 sm go" disabled=${!count} onClick=${() => takeFile(f)}><${Icon} name="download" />Download</button>
                    </span>
                </footer>
            </section>`;
    };
    const catTotal = (c) => mp.filter((b) => b.category === c).length;
    const hasClaim = (b) => b.isMeta || b.categoryRank || b.dmzRangeRank || b.isToxic;
    // A build's claims as marks — the same four the badges carry, read off the same tier rule B3Badges uses.
    const tierOfB = (b) => (b.mode === 'DMZ' ? TIER_OF_DMZ(b.dmzRangeRank) : b.categoryRank) || null;
    // 2026-09-25 01:20 EDT: CAPABLE and ASS had no mark here — a Capable build wore Top's award and an ASS build showed nothing, found opening Export for the v23 sweep
    const marksOf = (b) => { const t = tierOfB(b); return [b.isMeta ? 'meta' : null, t ? (t === 'best' ? 'best' : t === 'capable' ? 'capable' : 'top') : null, b.isToxic ? 'toxic' : null, b.isAss ? 'ass' : null].filter(Boolean); };
    const tierWord = (b) => { const t = tierOfB(b); return !t ? null : t === 'best' ? 'BEST' : t === 'capable' ? 'CAPABLE' : `TOP ${String(t).slice(3)}`; };
    const markWord = (k) => ({ meta: 'META', best: 'best in class', top: 'top ranked', capable: 'capable', toxic: 'toxic', ass: 'ass' }[k]);
    const markIcon = (k) => (k === 'meta' ? html`<svg class="ic" aria-hidden="true"><use href="#i-zap" /></svg>` : html`<${Icon} name=${k === 'best' ? 'crown' : k === 'top' ? 'award' : k === 'capable' ? 'thumbs-up' : k === 'ass' ? 'poop' : 'skull'} />`);
    const hov = (id) => ({ onMouseEnter: () => aim(id), onMouseLeave: unaim, onFocus: () => aim(id), onBlur: unaim });
    const wIn = pb ? whereF[String(pb._id)] : null;
    // ── THE ROSTER (2026-09-19 16:38 EDT) — his verdict on three restyled tiles: "the same thing wearing different makeup". The flaw was the
    // SYSTEM: a build was a bare numeral, so you chose between opaque numbers and learned what each was only from a hover card.
    // A bay is now a roster: one line per weapon, one COLUMN per build number, a head that names the column (and picks every
    // Build N in the bay), and each build a key with a FACE — its number, its claim in words, and a nine-slot signature lit in
    // the slot palette, so two builds of one weapon differ at a glance. Built on lines: the name column and each build column
    // are one grid shared by the head and every row, so every key edge, head label and row sits on a line the others draw.
    const SIG_OF = { 'Trigger Action': 'Underbarrel', Bowstring: 'Muzzle', Limb: 'Barrel', Bolt: 'Rear Grip', Guard: 'Rear Grip' };
    const sigOf = (b) => new Set((b.attachmentSlots || []).map((sl) => SIG_OF[sl] || sl));
    const claimOf = (b) => { const t = tierOfB(b); if (t) return [t === 'best' ? 'best' : t === 'capable' ? 'capable' : 'top', tierWord(b)]; if (b.isMeta) return ['meta', 'META']; return null; };
    const roster = (gs) => {
        const numOf = (b) => buildNumberOf(builds, b).n;
        const cols = Math.max(1, Math.min(5, Math.max(...gs.map((g) => Math.max(...g.list.map(numOf))))));
        const colIds = (k) => gs.flatMap((g) => g.list.filter((b) => numOf(b) === k && matchIds.has(String(b._id))).map((b) => String(b._id)));
        return html`
        <div class="b3-xr" style=${`--n:${cols}`}>
            <div class="b3-xr-h">
                <span class="b3-xr-hn" aria-hidden="true">Weapon</span>
                ${Array.from({ length: cols }, (_, i) => i + 1).map((k) => { const ids = colIds(k); const on = ids.filter(live).length; const all = ids.length && on === ids.length;
                    return html`<button type="button" class="b3-xr-ch" key=${k} disabled=${!ids.length} aria-pressed=${all ? 'true' : on ? 'mixed' : 'false'}
                        aria-label=${`${all ? 'Unpick' : 'Pick'} every build ${k} in this category`} onClick=${() => pickT(ids, !all)}>Build ${k}</button>`; })}
            </div>
            ${gs.map((g) => {
                const gi = g.list.map((b) => String(b._id));
                const n = gi.filter(live).length;
                const byN = {}; g.list.forEach((b) => { byN[numOf(b)] = b; });
                return html`
                <div class=${'b3-xr-r' + (n ? (n === gi.length ? ' all' : ' some') : '')} key=${g.name} style=${`--c:${g.accent || 'var(--ink3)'}`}
                     onClick=${() => pickT(gi.filter((id) => matchIds.has(id)), n !== gi.length)}>
                    <button type="button" class="b3-xr-wn" aria-pressed=${n === gi.length ? 'true' : n ? 'mixed' : 'false'} aria-label=${`${n === gi.length ? 'Unpick' : 'Pick'} every ${g.name} build`}><b>${g.name}</b></button>
                    ${Array.from({ length: cols }, (_, i) => i + 1).map((k) => {
                        const b = byN[k];
                        if (!b) return html`<span class="b3-xr-e" key=${k} aria-hidden="true"></span>`;
                        const id = String(b._id); const on = live(id); const cl = claimOf(b); const used = sigOf(b);
                        return html`
                        <button type="button" class="b3-xr-k" key=${id} aria-pressed=${on ? 'true' : 'false'} data-dim=${matchIds.has(id) ? null : 'true'}
                                aria-label=${`${g.name} build ${k}${cl ? `, ${cl[1]}` : ''}${b.isToxic ? ', toxic' : ''}${b.mode !== 'DMZ' && (b.rankModes || []).length ? `, rank mode ${b.rankModes.join(' | ')}` : ''}`}
                                onClick=${(e) => { e.stopPropagation(); pickT([id], !on); }} ...${hov(id)}>
                            <span class="b3-xr-top"><b>${k}</b>
                                ${cl ? html`<em data-k=${cl[0]}>${cl[1]}</em>` : null}
                                ${cl && cl[0] !== 'meta' && b.isMeta ? html`<i data-k="meta" aria-hidden="true">${markIcon('meta')}</i>` : null}
                                ${b.isToxic ? html`<i data-k="toxic" aria-hidden="true">${markIcon('toxic')}</i>` : null}${b.isAss ? html`<i data-k="ass" aria-hidden="true">${markIcon('ass')}</i>` : null}</span>
                            <span class="b3-xr-sig" aria-hidden="true">${SLOTS.map((sl) => html`<i key=${sl} class=${used.has(sl) ? 'on' : null} style=${`--sl:var(--sl-${slotKey(sl)})`}></i>`)}</span>
                        </button>`; })}
                </div>`; })}
        </div>`;
    };
    // ── THREE COMPACT ANSWERS (2026-09-19 17:28 EDT) — "i don't like the roster. propose 2-3 genuinely new designs that remain compact."
    // Each changes the STRUCTURE, not the paint, and each is shorter than the tiles were:
    //  · INDEX  — no boxes. A weapon is a line of type: its name, a leader, then its builds as numerals. A bay reads like the
    //             index of a manual; picking lights the numeral and puts a 2px hue edge on the line.
    //  · CLOUD  — no rows. Each weapon is one small unit (name + its numbered keys) and the units WRAP, so a whole category is a
    //             paragraph three or four lines deep — the densest the catalogue can be while every build stays tappable.
    //  · BANDS  — no weapon grouping at all. Inside a bay the builds sort by what they ARE (Best, Top ranked, Meta, Everything
    //             else) and each build is one chip, so picking "every meta SMG" is one band, not a hunt down a list.
    const bandOf = (b) => { const t = tierOfB(b); if (t === 'best') return 'best'; if (t) return 'top'; if (b.isMeta) return 'meta'; return 'plain'; };
    const BANDS = [['best', 'Best in class'], ['top', 'Top ranked'], ['meta', 'Meta'], ['plain', 'Everything else']];
    const numOfB = (b) => buildNumberOf(builds, b).n;
    const keyLabel = (g, b) => `${g.name} build ${numOfB(b)}`;
    const index = (gs) => html`
        <div class="b3-xi">
            ${gs.map((g) => { const gi = g.list.map((b) => String(b._id)); const n = gi.filter(live).length;
                return html`
                <div class=${'b3-xi-r' + (n ? (n === gi.length ? ' all' : ' some') : '')} key=${g.name} style=${`--c:${g.accent || 'var(--ink3)'}`}
                     onClick=${() => pickT(gi.filter((id) => matchIds.has(id)), n !== gi.length)}>
                    <button type="button" class="b3-xi-n" aria-pressed=${n === gi.length ? 'true' : n ? 'mixed' : 'false'} aria-label=${`${n === gi.length ? 'Unpick' : 'Pick'} every ${g.name} build`}>${g.name}</button>
                    <span class="b3-xi-d" aria-hidden="true"></span>
                    <span class="b3-xi-ks">${[...g.list].sort((x, y) => numOfB(x) - numOfB(y)).map((b) => { const id = String(b._id); const on = live(id); const cl = claimOf(b);
                        return html`<button type="button" class="b3-xi-k" key=${id} aria-pressed=${on ? 'true' : 'false'} data-dim=${matchIds.has(id) ? null : 'true'} data-k=${cl ? cl[0] : null}
                                            aria-label=${keyLabel(g, b) + (cl ? `, ${cl[1]}` : '')} onClick=${(e) => { e.stopPropagation(); pickT([id], !on); }} ...${hov(id)}>${numOfB(b)}${cl ? html`<em>${cl[1]}</em>` : null}</button>`; })}</span>
                </div>`; })}
        </div>`;
    const cloud = (gs) => html`
        <div class="b3-xc">
            ${gs.map((g) => { const gi = g.list.map((b) => String(b._id)); const n = gi.filter(live).length;
                return html`
                <span class=${'b3-xc-w' + (n ? (n === gi.length ? ' all' : ' some') : '')} key=${g.name} style=${`--c:${g.accent || 'var(--ink3)'}`}>
                    <button type="button" class="b3-xc-n" aria-pressed=${n === gi.length ? 'true' : n ? 'mixed' : 'false'} aria-label=${`${n === gi.length ? 'Unpick' : 'Pick'} every ${g.name} build`}
                            onClick=${() => pickT(gi.filter((id) => matchIds.has(id)), n !== gi.length)}>${g.name}</button>
                    ${[...g.list].sort((x, y) => numOfB(x) - numOfB(y)).map((b) => { const id = String(b._id); const on = live(id); const cl = claimOf(b);
                        return html`<button type="button" class="b3-xc-k" key=${id} aria-pressed=${on ? 'true' : 'false'} data-dim=${matchIds.has(id) ? null : 'true'} data-k=${cl ? cl[0] : null}
                                            aria-label=${keyLabel(g, b) + (cl ? `, ${cl[1]}` : '')} onClick=${() => pickT([id], !on)} ...${hov(id)}>${numOfB(b)}</button>`; })}
                </span>`; })}
        </div>`;
    const bands = (gs) => {
        const all = gs.flatMap((g) => g.list.map((b) => ({ b, g })));
        return html`
        <div class="b3-xb">
            ${BANDS.map(([k, label]) => { const set = all.filter((x) => bandOf(x.b) === k); if (!set.length) return null;
                const ids = set.map((x) => String(x.b._id)).filter((id) => matchIds.has(id));
                const on = ids.filter(live).length; const every = ids.length && on === ids.length;
                return html`
                <div class=${'b3-xb-g band-' + k} key=${k}>
                    <button type="button" class="b3-xb-l" aria-pressed=${every ? 'true' : on ? 'mixed' : 'false'} disabled=${!ids.length}
                            aria-label=${`${every ? 'Unpick' : 'Pick'} every ${label} build here`} onClick=${() => pickT(ids, !every)}>${label}<em>${on}/${set.length}</em></button>
                    <div class="b3-xb-ks">${set.map(({ b, g }) => { const id = String(b._id); const live_ = live(id);
                        return html`<button type="button" class="b3-xb-k" key=${id} style=${`--c:${g.accent || 'var(--ink3)'}`} aria-pressed=${live_ ? 'true' : 'false'} data-dim=${matchIds.has(id) ? null : 'true'}
                                            aria-label=${keyLabel(g, b)} onClick=${() => pickT([id], !live_)} ...${hov(id)}><b>${g.name}</b><em>${numOfB(b)}</em></button>`; })}</div>
                </div>`; })}
        </div>`;
    };
    // (2026-09-19 21:20 EDT) "remove the other tiles variant." The key-led layout and its rank table are gone; the v29
    // tile is the tile now, so its branch, its fork, the control and the stored default go with it rather than leaving a
    // switch with one side.
    const tiles = html`
        <div class="b3-xt" ref=${xtRef}>
            <section class="b3-xt-cat" aria-label="Builds to pick">
                <div class="b3-xt-top">
                    <div class="b3-xt-row">
                        ${''/* The Armory masthead's own MP/DMZ switch, words only; the portal's own search. */}
                        <div class="mh-mode b3-xt-mode" role="radiogroup" aria-label="Game mode">
                            ${['MP', 'DMZ'].map((m) => html`
                                <button type="button" key=${m} role="radio" data-arm=${m} aria-checked=${xm === m ? 'true' : 'false'} onClick=${() => switchMode(m)}>${m}</button>`)}
                        </div>
                        <span class="srch b3-xt-find"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>
                            <label class="sr" for="xt-q">Search ${xm} builds</label>
                            <input id="xt-q" ref=${qref} value=${q} placeholder="Find a weapon, code or attachment" style=${q ? `padding-right:${enterHint ? 250 : 150}px` : null}
                                   onInput=${(e) => setQ(e.target.value)} onKeyDown=${onFindKey} />
                            ${q ? html`<span class="b3-xt-qr">
                                ${enterHint ? html`<span class="b3-xt-enter">${enterHint}</span>`
                                    : html`<span class="b3-xt-found">${matchIds.size} match${matchIds.size === 1 ? '' : 'es'}</span>`}
                                <button type="button" class="b3-xt-qx" aria-label="Clear the search" onClick=${() => setQ('')}><${Icon} name="x" /></button></span>` : null}
                        </span>
                        ${''/* 2026-09-19 11:02 EDT: "How do I select all build tiles?" — one control for every build this mode and search show, the
                             category bays' own pick-all at the top of the list. */}
                        ${(() => { const every = rowsG.flatMap((g) => g.list.filter((b) => matchIds.has(String(b._id))).map((b) => String(b._id))); const on = every.filter(live).length; const all = every.length && on === every.length;
                            return html`<button type="button" class="chip b3-xt-all b3-xt-every" style=${`--c:${MODE_HEX[xm]}`} aria-pressed=${all ? 'true' : on ? 'mixed' : 'false'} disabled=${!every.length}
                                    aria-label=${`${all ? 'Unpick' : 'Pick'} every ${xm} build shown, ${on} of ${every.length} picked`} onClick=${() => pickT(every, !all)}>
                                ${''/* (2026-09-19 21:10 EDT) "the main 125 builds pick all still doesn't show the faded checkmark when hovering.
                                     However, it does correctly show it when all 125 are already picked." TWO chips, one of them hand-built: the bay's
                                     Pick all passes aria-checked to its .wg-cb and this one never did. Without it the box cannot draw the MIXED state,
                                     so at 8 of 125 it sat empty where the bay's shows a dash — and the hover preview then painted its mark in
                                     --on-accent (near-black, right for a filled gold box) onto an UNFILLED dark one, where it is invisible. One missing
                                     attribute, two symptoms. Measured at rest in all three states on both chips before changing anything. */}
                                <span class="wg-cb" aria-hidden="true" aria-checked=${all ? 'true' : on ? 'mixed' : 'false'}><span class=${'cb' + (all ? ' on' : '')}></span></span>
                                <span class="b3-xt-n" aria-hidden="true"><b>${on}</b> / ${every.length}</span>
                                <span class="b3-xt-w8" aria-hidden="true">${all ? 'Unpick all' : 'Pick all'}</span></button>`; })()}
                    </div>
                    ${''/* The manifest's own category chips, markup for markup: dot, name, count. */}
                    ${''/* (2026-09-19 21:21 EDT) "can you make the weapon category chips a single line, with them fading under the export list and
                         auto scrolling to the side as the scrollspy changes?" The row stops wrapping and scrolls; the fade is two-sided and
                         follows the scroll, because a right-only mask lies once you have reached the end — it keeps promising more. The row
                         follows the spy, but never while the pointer is on it: yanking a row a reader is already scrolling is hostile, and the
                         list's own chip-click lock is the mirror of the same idea. */}
                    <div class="mt-grp b3-xt-chips" role="group" aria-label="Jump to a category" ref=${chipsRef}
                         onMouseEnter=${() => { chipHover.current = true; }} onMouseLeave=${() => { chipHover.current = false; }}
                         onScroll=${(ev) => { const el = ev.currentTarget; el.dataset.sx = el.scrollLeft < 4 ? 'start' : el.scrollLeft + el.clientWidth > el.scrollWidth - 4 ? 'end' : 'mid'; }}>
                        ${''/* (2026-09-19 19:12 EDT) "the 'all' chip in the export drawer is pointless since the toggles are a scrollspy and
                             clicking 'all' basically just scrolls the list back up to the 'Assault' tiles anyway. remove it." It also
                             carried aria-pressed=false forever, so it was the one chip in a scrollspy that could never be current. The
                             total it showed is the counter's job and still reads there. */}
                        ${railCats.map((c) => { const g0 = allGroups.find((g) => g.category === c); const has = listCats.includes(c); return html`
                            <button type="button" class="chip topic" key=${c} style=${`--c:${(g0 && g0.accent) || 'var(--ink3)'}`}
                                    aria-pressed=${has && current === c ? 'true' : 'false'} disabled=${!has} data-bay=${c} onClick=${() => jump(c)}><i></i>${catLabelOf(c)} <em>${catTotal(c)}</em></button>`; })}
                    </div>
                </div>
                <div class="b3-xt-list b3-fady" ref=${listRef} onScroll=${spy} onScrollEnd=${() => { if (spyLock.current) { spyLock.current = null; clearTimeout(spyLock.t); } spy(); }}>
                    ${listCats.map((c) => {
                        const gs = rowsG.filter((g) => g.category === c);
                        const ids = gs.flatMap((g) => g.list.filter((b) => matchIds.has(String(b._id))).map((b) => String(b._id)));
                        const allOn = ids.every(live);
                        const p = ids.filter(live).length;
                        return html`
                        <section class="b3-xt-sec" key=${c} data-cat=${c} style=${`--c:${gs[0].accent || 'var(--ink3)'}`}>
                            ${''/* A category is a BAY — tinted ground, hue edge, hue name — so membership reads before anything is picked (round 5d). */}
                            <div class="b3-xt-sech"><i aria-hidden="true"></i><b>${catLabelOf(c)}</b>
                                <button type="button" class="chip b3-xt-all" aria-pressed=${allOn ? 'true' : p ? 'mixed' : 'false'}
                                        aria-label=${`${allOn ? 'Unpick' : 'Pick'} all ${catLabelOf(c)} builds, ${p} of ${ids.length} picked`} onClick=${() => pickT(ids, !allOn)}>
                                    <span class="wg-cb" aria-hidden="true" aria-checked=${allOn ? 'true' : p ? 'mixed' : 'false'}><span class=${'cb' + (allOn ? ' on' : '')}></span></span>
                                    <span class="b3-xt-n" aria-hidden="true"><b>${p}</b> / ${ids.length}</span>
                                    <span class="b3-xt-w8" aria-hidden="true">${allOn ? 'Unpick all' : 'Pick all'}</span></button></div>
                            ${html`<div class="b3-xt-tiles">
                                ${gs.map((g) => {
                                    const list = [...g.list].sort((x, y) => buildNumberOf(builds, x).n - buildNumberOf(builds, y).n);
                                    const gi = list.map((b) => String(b._id));
                                    const n = gi.filter(live).length;
                                    const claims = list.filter(hasClaim);
                                    return html`
                                    ${''/* 2026-09-19 11:02 EDT: "why isn't the entire blank space in the tile selectable?" The tile is the control now: a click anywhere
                                         that is not a build chip picks or unpicks the weapon. The name stays a button, so the keyboard reaches it, and
                                         its click simply rises to the tile. The count on the right says how many of the weapon's builds are in. */}
                                    <div class=${'cx-w cx-wl b3-xt-w' + (n ? (n === gi.length ? ' all' : ' some') : '')} key=${g.name} style=${`--c:${g.accent || 'var(--ink3)'}`}
                                         onClick=${() => pickT(gi.filter((id) => matchIds.has(id)), n !== gi.length)}>
                                        ${''/* his 14:32 EDT: "change their tile design to match the compare empty state tiles … include the badge icons like they currently
                                             include". Compare's landing tile (b4/compare.js Tile): the name over its category, the + in the corner, one key per build.
                                             The tile is still the control: a click anywhere but a key picks every build of the weapon; the + turns into a tick once they are
                                             all in. The count he kept (2026-09-19) rides the category line. */}
                                        <div class="cx-wh">
                                            <button type="button" class="cx-wadd" aria-pressed=${n === gi.length ? 'true' : n ? 'mixed' : 'false'}
                                                    aria-label=${`${n === gi.length ? 'Unpick' : 'Pick'} every ${g.name} build`}><span class="cx-wn"><b>${g.name}</b><small>${catLabelOf(g.category)}${n ? html`<em class="b3-xt-wc"> · <b>${n}</b>/${gi.length}</em>` : null}</small></span><span class="cx-wplus" aria-hidden="true"><${Icon} name=${n === gi.length ? 'check' : 'plus'} /></span></button>
                                        </div>
                                        <div class="cx-keys b3-xt-cs" role="group" aria-label=${`${g.name} builds`}>
                                            ${list.map((b) => { const id = String(b._id); const on = live(id); const num = buildNumberOf(builds, b).n; const mk = marksOf(b); return html`
                                                <button type="button" class="cx-k b3-xt-c" key=${id} aria-pressed=${on ? 'true' : 'false'} data-dim=${matchIds.has(id) ? null : 'true'}
                                                        aria-label=${`${g.name} build ${num}${mk.length ? `, ${mk.map((k) => (k === 'best' || k === 'top' || k === 'capable' ? tierWord(b) : markWord(k))).join(', ')}` : ''}${b.mode !== 'DMZ' && (b.rankModes || []).length ? `, rank mode ${b.rankModes.join(' | ')}` : ''}`}
                                                        onClick=${(e) => { e.stopPropagation(); pickT([id], !on); }} ...${hov(id)}>
                                                    <b>${num}</b>${mk.map((k) => html`<i data-k=${k} key=${k} aria-hidden="true">${markIcon(k)}</i>`)}</button>`; })}
                                        </div>
                                    </div>`; })}
                            </div>`}
                        </section>`; })}
                    ${!rowsG.length ? html`<div class="b3-xt-none" role="status"><b>Nothing matches “${q}”</b>
                        <span>The search reads weapon names, build names, codes and attachments.</span>
                        <button type="button" class="b3-btn2 sm" onClick=${() => setQ('')}>Clear the search</button></div>` : null}
                </div>
            </section>
            <section class="b3-xt-side" aria-label="The files">
                <div class="b3-xt-files b3-fady" ref=${fileRef}>
                    ${files.length ? files.map((f) => fileCard(f, files.length > 1)) : fileCard({ mode: xm, n: 1, key: `${xm}-1`, list: [], text: '', fname: `dioreo-${xm.toLowerCase()}-${today}.txt` }, false)}
                </div>
                <div class=${'b3-xt-peek' + (hb ? ' on' : '')} ref=${peekRef} aria-hidden="true" style=${pb ? `--c:${pb.accent || 'var(--ink3)'}` : null}>
                    ${pb ? (pIn && wIn
                        ? html`${''/* (2026-09-19 19:12 EDT) "improve this hint text ux-copy and the container's internal design for the hint text."
                               It was one sentence doing three jobs — naming a build the cursor is already on, then a filename, then a range — with the
                               only useful part last and a bare en dash carrying it. The card now answers the question the hover actually asks, in the
                               order it is asked: is this one already in (yes, and it says so in three words), which file, and where in it. The range is
                               DRAWN as well as written, the way this board draws every other count: the bar is the whole file and the lit span is this
                               build, so "lines 1–9" of a 240-line file reads as a position rather than a number to hold. */}
                               <span class="b3-xt-pk"><b>${pb.weaponName} · Build ${buildNumberOf(builds, pb).n}</b><span class="b3-xt-pm" data-arm=${pb.mode}>${pb.mode}</span><em class="b3-xt-pin">already in this export</em></span>
                               <span class="b3-xt-pwh"><span class="b3-xt-pwf">${wIn.f.fname}</span><span class="b3-xt-pwl">lines <b>${wIn.a}</b>–<b>${wIn.z}</b></span></span>
                               <span class="b3-xt-pwb" aria-hidden="true" style=${`--a:${((wIn.a - 1) / Math.max(1, wIn.tot)) * 100}%;--z:${(wIn.z / Math.max(1, wIn.tot)) * 100}%`}><i></i></span>`
                        : html`<span class="b3-xt-pk"><b>${pb.weaponName} · Build ${buildNumberOf(builds, pb).n}</b><span class="b3-xt-pm" data-arm=${pb.mode}>${pb.mode}</span>${pb.buildName && !/^build \d+$/i.test(pb.buildName) ? html`<span>“${pb.buildName}”</span>` : null}${hasClaim(pb) || (pb.mode !== 'DMZ' && (pb.rankModes || []).length) ? html`<${B3Badges} b=${pb} />` : null}</span>
                               <span class="b3-xt-pv">${blockOf(pb).slice(1).map((t, k) => html`<span key=${k}>${t}</span>`)}</span>`) : null}
                </div>
            </section>
        </div>`;
    return html`
        <${Drawer} title=${step === 'picker' && expl === 'tiles' ? 'Pick builds to export' : 'Export'} wide=${step === 'picker' && expl === 'tiles'} onClose=${onClose} onBack=${step === 'picker' ? () => setStep('scopes') : null}
                   actions=${step === 'scopes' || (step === 'picker' && expl === 'tiles') ? null : html`
                       ${step === 'picker' ? html`<button class="btn" onClick=${() => setStep('scopes')}><${Icon} name="chevron-left" />Back</button>` : null}
                       <button class="btn" onClick=${onClose}>Close</button>
                       ${step !== 'scopes' && !(step === 'picker' && expl === 'tiles') ? html`<button class="btn go" disabled=${!sel.size} onClick=${take}>Download ${sel.size || ''} build${sel.size === 1 ? '' : 's'}</button>` : null}`}>
            ${step === 'picker' ? null : html`
                ${''/* ROUND 10B (2026-09-20 11:20 EDT): "overall, improve the design of the export drawer landing
                     drastically. Look how ugly and prose heavy it is. And this landing is used across all export drawers in
                     the portal btw." The prose was the structure's fault: every row repeated the SAME fourteen-word sentence
                     about the file format, because the format is the one thing that does not differ between rows. It is said
                     once, here, and each row now carries the three things that DO differ — how many, which set, and the name
                     of the file that lands. The count leads because it is what you are choosing between; the filename is the
                     line that used to be a duplicated paragraph. */}
                
                ${''/* ROUND 10I (2026-09-20 13:05 EDT) — A PANEL, NOT A MENU. His: "landing is still basically the
                     same. You made a minor patch when i asked for *design*… that RESTORE POINT line is so confusing… it's
                     literally hint text that looks skippable." Both true, and the second is the first: a row of three equal
                     boxes with two identical green buttons has no focal point, so every word on it is optional and a sentence
                     underneath is the most optional thing of all.
                     THE COMPOSITION NOW SAYS WHAT THE DATA SAYS. 125 against 8 is not a tie, so the two sets are not peers:
                     MP leads at full weight with the only filled action on the panel, DMZ sits under it at two thirds the
                     height with a quiet one, and Pick — which downloads nothing and opens a step — stops pretending to be a
                     third file and becomes the strip you cross into. The count is the display type because the count is what
                     you are choosing between; the filename is the receipt, in the face this board writes files in.
                     ⚠️ THE LINE BELOW SAID "AND THE SENTENCE IS GONE" AND WAS STALE FROM THE MOMENT v2 WAS
                     RESTORED, WHICH BROUGHT IT BACK. Deleting it was the wrong answer anyway — his instruction was
                     to IMPROVE it, and he had to say so twice. It is two marks now; see the note on the list. */}
                ${''/* STEP 5 (2026-09-20 23:36 EDT) — THE HINT WAS THREE FACTS WELDED INTO ONE SENTENCE, WHICH IS WHY IT READ AS
                     SKIPPABLE: a paragraph is an all-or-nothing read, and on a panel whose job is "pick a row, press a
                     button" nobody pays that toll. Broken into marks, each fact is separately readable and none of them
                     can be skipped, because there is no paragraph left to skip.
                     ⚠️ ONE OF THE THREE WAS FALSE OUTSIDE ARMORY. "paste it back into Bulk" names an Armory concept, and
                     this landing is the SHARED export panel — four drawers render it (builds, broadcasts, grants,
                     events). `ui/exportPanel.js` already said the generic thing, "the bot reads this back"; the board's
                     copy had regressed it. The two now agree.
                     ⚠️ AND ONE WAS REDUNDANT. "One file per set" is visible in the rows themselves — MP builds, DMZ
                     builds, each with its own filename. A fact the reader can see is not a fact the hint should spend a
                     line on. Dropped for that reason, not for brevity.
                     HEIGHT IS A CONSTRAINT, NOT A FREE VARIABLE: exportPanel.js:77 records "one sentence, because a
                     three-line paragraph makes the drawer 25px taller and moves everything in it." This is one line. */}
                ${''/* 2026-09-20 23:41 EDT - AND NOTHING SAID WHAT THE DRAWER IS. His: "nothing here actually explains wtf the
                     export drawer even is and what it does." True, and the whole self-description was the word
                     "Export" in the title - a label naming the component, which is the same defect as the eyebrow
                     that got removed. I spent this round sharpening two supporting facts and never wrote the line
                     they support.
                     `.dw-lead` is the board's existing "this paragraph leads" treatment (app.css:6836, in use on
                     Access's grant form), so the lead is a component, not a new one. The three parts do not overlap:
                     the lead says WHAT it is, the first mark says WHAT IT BUYS YOU, the second says WHEN.
                     "one file per set" comes back here, in the definition where it describes the shape of the thing,
                     rather than as a mark repeating what the rows already show. */}
                <p class="dw-lead exs-lead">Download a copy of what’s live — one file per set.</p>
                <ul class="exs-facts">
                    ${''/* 2026-09-20 23:39 EDT - REWRITTEN, because both lines described the system instead of telling him what
                         to do. "The bot reads this exact file back" names a thing the BOT does and never says he
                         can act on it - "reads back" is our word, not a user's, and "exact" was carrying weight
                         nothing explained. "Take one" had no object at all: take WHAT. Both are active verbs
                         aimed at him now, each saying what he does and what happens. And the warning drops
                         "one-way change" - a term this portal defines elsewhere but which a chip read cold cannot
                         lean on; "anything you can't undo" needs no glossary and is the thing that makes him
                         pause, which is the only reason the line exists.
                         ⚠️ THEN CUT AGAIN (2026-09-20 23:41 EDT): "it needs to be more concise. right now it's just prose wearing
                         makeup." He is right - a chip holding a seven-word sentence is still a sentence, and putting a
                         border round it changes nothing. A chip holds a VALUE. So the division moved: the LEAD carries
                         the one sentence there is, and the marks are three words each, which is what a mark can be read
                         as at a glance rather than read through. */}
                    ${''/* 2026-09-20 23:45 EDT - /impeccable clarify. "Before one-way changes" broke two of that reference's
                         rules at once: it is a prepositional FRAGMENT with no verb and no subject, so the warning is
                         carried entirely by the triangle beside it - "do not rely on punctuation, color, or
                         iconography to carry the message alone" - and "one-way" is internal vocabulary, a tier this
                         portal names in `ui/oneway.js` and nowhere a reader of this chip has been yet. Replaced with
                         what the tier MEANS to him. "Imports straight back" had the same fragment problem from the
                         other side: no subject, and the verb belongs to the bot rather than to him.
                         Both marks are now verb + object + outcome, and each survives being read with its icon
                         removed - which is the test. "Download" is the word on the buttons, so the lead, the mark and
                         the control all name the action the same way. */}
                    <li><${Icon} name="rotate-ccw" />Import it back to undo</li>
                    <li class="exs-fact-w"><${Icon} name="triangle-alert" />Download one before anything permanent</li>
                </ul>
                <ul class="exs g-exs">
                    ${scopes.map((sc) => html`
                        <li class="exs-i" key=${sc.id} style=${MODE_HEX[sc.mode] ? `--m:${MODE_HEX[sc.mode]}` : null}>
                            ${''/* STEP 2: the count square is `.b3-xf-sq`, the same object the file card's header wears —
                                 which is itself the selection bar's `.b3-sd-count` carried over rather than redrawn. It reads
                                 its fill from `--m`, so the mode's own accent is set on the row and nothing about the
                                 component changes. ⚠️ NOT the `.b3-xf-h0 .b3-xf-sq` variant: that one is the EMPTY state,
                                 sunk and unlit, and porting it for a live count is a mistake this board has already made.
                                 The word BUILDS goes — the title beside it already says which builds these are.
                                 ⚠️ IT CARRIES NO CLASS OF ITS OWN (2026-09-20 22:56 EDT). It had `exs-sq` while the landing wanted a
                                 different size; he took that size to the component instead, so the two panels draw the
                                 identical chip and there is nothing left for a second class to say. */}
                            <div class="exs-n" aria-label=${`${sc.count} ${sc.unit}`}><i class="b3-xf-sq" aria-hidden="true">${typeof sc.count === 'number' ? sc.count.toLocaleString() : sc.count}</i></div>
                            <div class="exs-t"><b>${sc.label}</b>
                                ${''/* STEP 1: the picker's chip, markup for markup — the same classes, the same pencil,
                                     the same .txt suffix held out of the editable field, the same click-to-rename. It sits
                                     in its own `.b3-xf-fid` because that wrapper is what carries the --ok tint, and it is a
                                     block under the label so its left edge is the label's left edge. */}
                                <div class="b3-xf-fid">
                                    ${renaming === sc.id
                                        ? html`<${RenameField} value=${fileBase(sc)} label=${`File name for ${sc.label}`} onCommit=${(v) => { renameScope(sc, v); setRenaming(null); }} />`
                                        : html`<button type="button" class="b3-xf-fn" title="Rename the file" aria-label=${`Rename ${fileBase(sc)}.txt`} onClick=${(e) => { e.stopPropagation(); setRenaming(sc.id); }}><span class="b3-xf-nm">${fileBase(sc)}</span><span class="b3-xf-ext">.txt</span><${Icon} name="pencil" /></button>`}
                                </div>
                            </div>
                            <button class="b3-btn2 sm go" onClick=${() => overlay.say(`Board only · ${sc.label} would download.`)}><${Icon} name="download" />Download</button>
                        </li>`)}
                    ${step === 'scopes' ? html`
                        <li class="exs-i g-pick-open" key="pick">
                            <div class="exs-n"><${Icon} name="list-checks" /></div>
                            <div class="exs-t"><b>Pick builds…</b><span>${sel.size ? `${sel.size.toLocaleString()} picked so far` : 'Search and tick exactly what you want'}</span></div>
                            <button class="b3-btn2 sm stage" onClick=${() => setStep('picker')}>Pick<${Icon} name="chevron-right" /></button>
                        </li>` : null}
                </ul>`}
            ${step === 'scopes' ? null : step === 'picker' && expl === 'tiles' ? tiles : picker}
        <//>`;
}

function A9({ session }) {
    const data = useData(load);
    const exp = useB3('exp');
    const secFixed = useB3('a1') === 'fixed';
    const overlay = useOverlay();
    const [seq, setSeq] = useState(1);
    if (!data) return html`<p class="g-wait">Loading…</p>`;
    const builds = (data.builds || []).map((b) => withSec(b, secFixed));
    const today = isoLocal();
    const scopes = ['MP', 'DMZ'].map((m) => ({
        id: `armory.${m}`, mode: m, label: `${m} builds`, unit: 'builds', count: builds.filter((b) => b.mode === m).length,
        url: `/api/armory/export?scope=mode&mode=${m}`, filename: `dioreo-${m.toLowerCase()}-builds-${today}.txt`,
        note: 'Blocks in the same grammar the Bulk view’s paste box accepts, so a round trip is lossless.',
    }));
    return html`
        ${''/* Measured 2026-09-16 12:38 EDT: the drawer is 815px and the stage was 720, and the drawer centres on the stage — so it
             hung 47px past the top and 48px past the bottom, clipping its own title and its footer buttons. That is the
             "bugged state" in his screenshot; the picker underneath was fine all along (68 groups, 125 rows, measured). */}
        <${Stage} tall=${900}>
            ${overlay.render()}
            ${exp === 'now'
                ? html`<${ExportDrawer} key=${'now' + seq} scopes=${scopes} overlay=${overlay} onClose=${() => setSeq(seq + 1)} />`
                : html`<${ExportPicker} key=${'new' + seq + exp} builds=${builds} scopes=${scopes} overlay=${overlay} onClose=${() => setSeq(seq + 1)} />`}
        <//>`;
}

// His palette of 2026-09-18 — every slot name the armory can carry, each with its swatch and its NAME, so the six mapped
// slots can be checked by eye. (It showed his two earlier sets, "as written" and "regularised", after he had moved on.)
const SPEC_SLOTS = ['Optic', 'Muzzle', 'Barrel', 'Stock', 'Laser', 'Underbarrel', 'Rear Grip', 'Ammunition', 'Perk', 'Trigger Action', 'Bowstring', 'Limb', 'Bolt', 'Guard', 'Smoothbore'];
function PaletteSpecimen() {
    const pal = useB3('p2pal');
    return html`
        <div class="b3-pal" role="group" aria-label="Your palette">
            <div class=${'b3-pal-r b3-pal-f' + (pal === 'final' ? ' on' : '')} data-pal="final">
                <span class="b3-pal-k">Yours, 09-18<em>nine hues · the other six slots wear the slot they stand in for · unknown slots grey</em>${pal === 'final' ? html`<b>live</b>` : null}</span>
                <span class="b3-pal-n">${SPEC_SLOTS.map((s) => html`<span key=${s}><i style=${`--sw:var(--sl-${slotKey(s)}, var(--sl-unknown))`}></i>${s}</span>`)}</span>
            </div>
        </div>`;
}

// 🔴 NOT THREE TREATMENTS OF ONE SENTENCE — 2026-09-17 13:12 EDT. "these are all the same thing wearing makeup."
// He is right, and the search he told me to run says why: his complaint was never about how the line LOOKS. It was
// 2026-09-12 11:21 EDT, "these small texts just look and feel like noise to me. Never once have i glaced over it and
// assumed it was actually informative." A caption reads the same on every visit, so it is zero information by the
// second one; only a line that is true ONLY RIGHT NOW earns the glance back.
// So the specimen is a CORPUS — his own pinned strings, the verdict the rule gives each, and what each becomes.
// One row is DELETED on purpose: a classification that keeps everything is not a classification, and that is the
// test the first version failed.
const CORPUS = [
    ['broadcast · the queue meta line', '1 in one message, oldest first \u00b7 cap 10', 'state', '2 of 10 slots used'],
    ['broadcast · the note under Follow-up', 'Delivered as an ephemeral follow-up after any top-level slash command, every unseen announcement as its own\u2026', 'off', 'nothing \u2014 the control is called Follow-up'],
    ['armory · the selection drawer', 'These builds are removed when you commit', 'does', 'Removes 3 builds at commit \u00b7 reversible until then'],
    ['armory · the manifest count', 'Showing all builds, grouped by weapon', 'state', '133 builds \u00b7 8 selected'],
];
const VERDICT = { state: 'Readout', does: 'Consequence', off: 'Delete' };
// 🔴 THE SWITCH ABOVE THIS DID NOTHING — found 2026-09-17 23:24 EDT by re-reading his threads against the page: the Small text
// switch wrote `p10` and nothing on the board read it, so all four options drew the same panel. Now it answers: "Now ·
// caption" shows each string as the portal prints it today, and each verdict lights the strings that verdict claims
// and quiets the rest, so the option you look at is the one you see applied.
function SmallTextSpecimen() {
    const pick = useB3('p10');
    return html`
        <div class="b3-corp" data-pick=${pick} role="group" aria-label="Small text: the rule applied to real strings">
            ${CORPUS.map(([where, src, v, out]) => html`
                <div class="b3-corp-r" key=${src} data-v=${v}>
                    <span class="b3-corp-w">${where}</span>
                    <span class="b3-corp-src">${src}</span>
                    <span class="b3-corp-v">${VERDICT[v]}</span>
                    <span class="b3-corp-out">${out}</span>
                </div>`)}
        </div>`;
}

const nowFixed = [['now', 'Portal today'], ['fixed', 'Fixed']];

function ManifestTries() {
    const data = useData(load);
    const openProblem = (i) => { const chips = inSurface('.b3-fchip, .wg-fsum');
        if (chips[i]) { chips[i].scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => chips[i].click(), 320); } };
    const pick = (n) => { if (!surface.select || !data) return;
        surface.select(oneWeaponPerCategory(data.builds).flatMap((w) => idsOf(data.builds, w)).slice(0, n)); };
    return html`<${Tries} items=${[['Open a problem', () => openProblem(0)], ['Open another', () => openProblem(1)],
        ['Pick one build', () => pick(1)], ['Pick three', () => pick(3)], ['Pick eight', () => pick(8)], ['Clear', () => pick(0)]]} />`;
}

// ── L1 · THE SELECTION LIST SPACING LAB (2026-09-19 00:19 EDT) ─────────────────────────────────────────────────────────────────────────────
// His ask: "give me this selection bar list view, both by weapon and by table, as an interactive playground so i can literally
// spoonfeed you the literal correct horizontal spacing of each of these elements in the rows." Every slider drives a CSS variable
// the REAL list rules read (board.css, "ROUND 5J"), so what he sets here is the board's own spacing, not a copy of it. Defaults are
// today's measured values. "Save for Claude" writes the set to this board's store (spacing/list), which I read back.
const LAB_GROUPS = [
    // 2026-09-19 10:21 EDT: "let me also tweak the horizontal positioning of these elements" — the list's top line. Visible gaps, measured on the
    // ink the moment they were added: edge → icon 19.25, icon → count 10.41, count → word 10.85, VIEW → toggle 11.5, toggle → edge 14.
    ['The list’s top line', [
        ['lh-pl', 'Left edge → icon', 26], ['lh-ic-n', 'Icon → count', 10], ['lh-n-w', 'Count → “builds”', 11],
        ['lh-vl-vt', 'VIEW → toggle', 12], ['lh-pr', 'Toggle → right edge', 10]]],
    ['The weapon header', [
        ['gh-pl', 'Left edge → name', 16], ['gh-name-cat', 'Name → category', 9], ['gh-cat-range', 'Category → Builds chip', 18],
        ['gh-range-div', 'Builds chip → divider', 12], ['gh-div-badge', 'Divider → first badge', 12],
        ['gh-pr', '× → right edge', 16]]],
    ['A build row · By weapon', [
        ['r-pl', 'Left edge → number', 7], ['r-n-att', 'Number → attachments', 30], ['r-tag', 'Between attachment tags · both views', 4],
        ['r-att-code', 'Attachments → code', 30], ['r-code-warn', 'Code → mark', 20],
        ['r-img-x', 'Mark → ×', 30], ['r-pr', '× → right edge', 16]]],
    ['A build row · One table', [
        ['t-rail', 'Left edge → accent bar', 9], ['t-pl', 'Left edge → number', 30], ['t-n-w', 'Number → weapon', 20],
        ['t-w-att', 'Weapon → attachments', 30], ['t-att-code', 'Attachments → code', 30], ['t-code-warn', 'Code → mark', 20],
        ['t-img-x', 'Mark → ×', 30], ['t-pr', '× → right edge', 16]]],
    // 2026-09-19 10:19 EDT: his "let me tweak it with the toggles" on v24. Gaps are what the eye measures: tag edge to the header's edge. The two
    // text rows are in TENTHS of a pixel (18 = 1.8px), because the misalignment they correct was under a pixel.
    ['Vertical · rows and groups', [
        ['v-row-h', 'Build row height · both views', 44], ['v-head-h', 'Weapon row height', 44],
        ['v-head-row', 'Weapon row → first row’s tags', 12], ['v-group', 'Last row’s tags → next weapon row', 20],
        ['v-tag', 'Tag text down · tenths of a px', 18], ['v-code', 'Code text down · tenths of a px', 8]]],
];
const LAB_ALL = LAB_GROUPS.flatMap(([, rows]) => rows);
const LAB_DEF = Object.fromEntries(LAB_ALL.map(([k, , d]) => [k, d]));
const LAB_KEY = 'pins2-b3-list-spacing';
const LAB_PRESETS = [
    ['Today', () => ({ ...LAB_DEF })],
    ['Tighter', () => Object.fromEntries(LAB_ALL.map(([k, , d]) => [k, /^v-/.test(k) ? d : Math.round(d * 0.7)]))],
    ['Even 12', () => Object.fromEntries(LAB_ALL.map(([k, , d]) => [k, /^v-|-(pl|pr|rail|tag)$/.test(k) ? d : 12]))],
    ['Even 16', () => Object.fromEntries(LAB_ALL.map(([k, , d]) => [k, /^v-|-(pl|pr|rail|tag)$/.test(k) ? d : 16]))],
];
const LAB_PICK = [['JAK-12', 1], ['KILO 141', 1], ['PP19 BIZON', 3], ['BAL-27', 1], ['BAL-27', 2]];
function labPrompt(v) {
    const parts = LAB_GROUPS.map(([g, rows]) => {
        const ch = rows.filter(([k, , d]) => v[k] !== d).map(([k, label, d]) => `${label} ${v[k]}px (was ${d}, --${k})`);
        return ch.length ? `${g}: ${ch.join('; ')}.` : '';
    }).filter(Boolean);
    const code = (typeof document !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue('--code-js').trim()) === 'start' ? ' Codes sit at the LEFT of their column.' : '';
    return parts.length || code ? `Set the selection list's horizontal spacing to these values (every value is the visible gap, icon edge to icon edge). ${parts.join(' ')}${code}` : 'Nothing changed yet: every value is the board\'s spacing today.';
}
function ListLab() {
    const data = useData(load);
    const secFixed = useB3('a1') === 'fixed';
    const [v, setV] = useState(() => { let s = {}; try { s = JSON.parse(localStorage.getItem(LAB_KEY) || '{}'); } catch (e) { /* the defaults stand */ } return { ...LAB_DEF, ...s }; });
    const [ids, setIds] = useState(null);
    const [note, setNote] = useState('');
    // A code shorter than the column's longest leaves its slack on one side: left-aligned codes put it before the triangle, which
    // is why "18px" read as ~47 on a short code. Right-aligned codes hold every copy → triangle gap at the set value.
    const [codeAt, setCodeAt] = useState(() => { try { return localStorage.getItem(LAB_KEY + '-code') || 'end'; } catch (e) { return 'start'; } });
    useEffect(() => { document.documentElement.style.setProperty('--code-js', codeAt); try { localStorage.setItem(LAB_KEY + '-code', codeAt); } catch (e) { /* applied */ } }, [codeAt]);
    const host = useRef(null);
    useEffect(() => {
        const root = document.documentElement;
        for (const [k, val] of Object.entries(v)) root.style.setProperty(`--${k}`, `${val}px`);
        try { localStorage.setItem(LAB_KEY, JSON.stringify(v)); } catch (e) { /* applied, not remembered */ }
    }, [v]);
    useEffect(() => {
        if (!ids || !ids.length) return undefined;
        const t = setTimeout(() => { const h = host.current; if (h && !h.querySelector('.b3-sd-list')) { const tog = h.querySelector('.b3-sd-tog'); if (tog) tog.click(); } }, 250);
        return () => clearTimeout(t);
    }, [ids]);
    if (!data) return html`<p class="g-wait">Loading…</p>`;
    const builds = (data.builds || []).map((b) => withSec(b, secFixed));
    const rows = rowsFor(builds, null, 'MP').map((r) => { const b = withSec(r, secFixed); return { ...b, accentHex: b.accent }; });
    const start = rows.filter((r) => LAB_PICK.some(([w, n]) => r.weaponName === w && buildNumberOf(builds, r).n === n)).map((r) => r.id);
    const sel = ids || start;
    if (!ids) setTimeout(() => setIds(start), 0);
    const text = labPrompt(v);
    const copy = () => { try { navigator.clipboard.writeText(text); setNote('Copied'); } catch (e) { setNote('Copy failed — select the text'); } setTimeout(() => setNote(''), 1400); };
    const save = async () => {
        try {
            const db = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('db') : null;
            if (!db) { setNote('Saving needs the board open on claude.ai'); return; }
            await db.doc('spacing/list').set({ values: v, prompt: text, at: new Date().toISOString() });
            setNote('Saved for Claude');
        } catch (e) { setNote('Save failed — use Copy'); }
        setTimeout(() => setNote(''), 1800);
    };
    return html`
        <div class="lab">
            <aside class="lab-c" aria-label="Spacing controls">
                <div class="lab-pre">${LAB_PRESETS.map(([n, f]) => html`<button type="button" class="b3-btn2 sm quiet" key=${n} onClick=${() => setV(f())}>${n}</button>`)}</div>
                <div class="lab-view"><span>View</span><${Seg} k="p5list" options=${[['grouped', 'By weapon'], ['table', 'One table']]} label="List view" />
                    <span>Codes</span><span class="seg" role="group" aria-label="Where a code sits in its column">${[['start', 'Left'], ['end', 'Right']].map(([k, l]) => html`<button type="button" key=${k} aria-pressed=${codeAt === k ? 'true' : 'false'} onClick=${() => setCodeAt(k)}>${l}</button>`)}</span></div>
                ${LAB_GROUPS.map(([g, list]) => html`
                    <section class="lab-g" key=${g}>
                        <h4>${g}</h4>
                        ${list.map(([k, label, d]) => html`
                            <label class=${'lab-r' + (v[k] !== d ? ' on' : '')} key=${k}>
                                <span class="lab-l">${label}</span>
                                <input type="range" min="0" max="48" step="1" value=${v[k]} id=${'lab-' + k} onInput=${(e) => setV({ ...v, [k]: +e.target.value })} />
                                <input type="number" min="0" max="96" value=${v[k]} aria-label=${label} onInput=${(e) => setV({ ...v, [k]: Math.max(0, +e.target.value || 0) })} />
                                <button type="button" class="lab-x" title=${`Back to ${d}px`} aria-label=${`Reset ${label}`} disabled=${v[k] === d} onClick=${() => setV({ ...v, [k]: d })}>${d}</button>
                            </label>`)}
                    </section>`)}
            </aside>
            <div class="lab-s">
                <div class="lab-stage" ref=${host}>
                    <${SelectionDock} ids=${sel} rows=${rows} builds=${builds}
                        onClear=${() => setIds([])} onDeselect=${(x) => setIds(sel.filter((id) => !x.includes(id)))}
                        onEdit=${() => {}} onExport=${() => {}} onDelete=${() => {}} />
                    ${sel.length ? null : html`<button type="button" class="b3-btn2 sm" onClick=${() => setIds(start)}>Bring the five builds back</button>`}
                </div>
                <div class="lab-p">
                    <p id="lab-prompt">${text}</p>
                    <div class="lab-pa">
                        <button type="button" class="b3-btn2 sm" onClick=${copy}><${Icon} name="copy" />Copy</button>
                        <button type="button" class="b3-btn2 sm go" onClick=${save}><${Icon} name="check" />Save for Claude</button>
                        <button type="button" class="b3-btn2 sm quiet" onClick=${() => setV({ ...LAB_DEF })}>Reset all</button>
                        <span class="lab-n" role="status">${note}</span>
                    </div>
                </div>
            </div>
        </div>`;
}

export const ARMORY_SECTIONS = [
    { id: 'list-lab', gid: 'L1', realm: 'armory', title: 'Selection list spacing',
      sub: 'Set every horizontal gap in the list yourself. The sliders drive the list’s real rules, so the board changes with them.',
      pins: [], Body: ListLab,
      notes: [html`<b>Defaults are today's spacing</b>, measured. A changed row lights up; its button puts it back.`,
              html`<b>Save for Claude</b> writes your values to this board's store, and I read them from there; Copy puts the same sentence on your clipboard.`] },
    { id: 'armory-manifest', gid: 'M1', realm: 'armory', title: 'The Armory manifest',
      sub: 'One surface. Every switch sits above the stage, the notes under it, and the decisions at the foot of the same block.',
      pins: [3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 11, 29], Body: ManifestSurface, Tries: ManifestTries,
      controls: [
          ['Fixes', () => html`<${Seg} k="a1" options=${nowFixed} label="Manifest fixes" />`],
          ['Badges', () => html`<${Seg} k="p1" options=${[['now', 'Now'], ['a', 'Medals']]} label="Badges" />`],
          ['Slot palette', () => html`<${Seg} k="p2pal" options=${segOpts('p2pal', [['now', 'Now']])} label="Palette" />
              ${''/* Both of your sets, the same nine slots, one above the other — so the difference is something to
                   look at rather than two numbers to hold in your head. */}
              <${PaletteSpecimen} />`],
          ['Tag style', () => html`<${Seg} k="p2sty" options=${segOpts('p2sty', [])} label="Tag style" />`],
          ['Problems', () => html`<${Seg} k="p3" options=${segOpts('p3', [['now', 'Now']])} label="Problem card" />`],
          ['Table mark', () => html`<${Seg} k="p3tbl" options=${segOpts('p3tbl')} label="Table problem mark" />`],
          ['List header', () => html`<${Seg} k="sdgh" options=${segOpts('sdgh')} label="List weapon header height" />`],
          ['Selecting', () => html`<${Seg} k="p5" options=${[['now', 'Now'], ['new', 'Proposed']]} label="Selection bar" />`],
          ['Small text', () => html`<${Seg} k="p10" options=${segOpts('p10', [['now', 'Now']])} label="Small text" />
              ${''/* 🔴 "Literally wtf is this Option set even changing?? i see nothing happening." He was right and it
                   was not a subtle change — it was an INVISIBLE one. The three treatments only ever applied to one line
                   inside the selection drawer's header, and that drawer is closed until you tick a build and open the
                   list, so switching the option on a resting board changed nothing on screen. A fork has to be SHOWN
                   before it is asked. All three are drawn here, on the same sentence, with the live one lit. */}
              <${SmallTextSpecimen} />`],
          ['Slot label', () => html`<${Seg} k="p2lab" options=${segOpts('p2lab', [])} label="Slot label" />
              ${''/* The label is an AXIS now, not a sixth tag style, so it composes with whichever shell is showing
                   — which is what "apply the {Slot}: {Attachment} method to all the other tag styles" asks for.
                   The specimen underneath is a real `.wg-r`, so it answers the switch live and there is no second
                   block of rules that can drift from the rows. */}`],
          ['Attachments', () => html`<${SlotSpecimen} />`],
      ],
      notes: [
          html`<b>The tools row</b> keeps Attachments inline with Category, one divider between them with 16px of air each side, and the chips fit one line; the label column shrinks 84px → 64px, walking the search and chips 20px left (pin 3).`,
          html`<b>Fold marks and one fold control</b> — board 2’s fold and unfold everywhere, and the per-weapon button is the same inline-flex button as Collapse all, icon then word (pins 5, 12).`,
          html`<b>Secondaries</b> is <${Hex} v="#3F6E8E" /> in the token and in the data the chips and bars are drawn from (pin 6).`,
          html`<b>The code field</b> gets one continuous ring, hover lights the copy segment alone in the weapon’s accent, and the cursor is a pointer (pins 8, 9, 10).`,
          html`<b>The head row</b> is 48px with a bigger label; a build row gains 6px; the accent bars are 4px on the weapon row and 2.5px on the build row; select-all shares the checkbox column’s left edge (pins 14, 15, 19).`,
          html`<b>Badges</b> — Meta, tier and tag each take their own colour, the tier carries its rank, and Best names its category (pin 7).`,
          html`<b>Attachment tags</b> — Mineral is gone, nothing is scored for colour blindness, and the legend above is the test: read it once, then name a slot from its colour in the rows (pin 16).`,
          html`<b>Build problems</b> — the chip says which build and how many, Open build sits in the card header, and the numbers are drawn rather than written (pins 13, 17).`,
          html`<b>Selecting</b> — one bar, chips collapsed and list expanded, “Builds 1–3” never ×3, Set badges replaced by Edit builds, select-all in the column head with its count (pins 18, 20, 22).`,
      ] },
    { id: 'repairs', gid: 'M2', realm: 'armory', title: 'Repairs', sub: 'What it is for, where it lives, and what it lists.',
      pins: [23], Body: A7,
      controls: [['Worklist', () => html`<${Seg} k="p6" options=${segOpts('p6', [['now', 'Portal today']])} label="Repairs" />`],
          ['Ticket layout', () => html`<${Seg} k="p6lay" options=${segOpts('p6lay')} label="Ticket layout" />`],
                 ['Data', () => html`<${Seg} k="p6day" options=${[['real', 'Today’s'], ['clean', 'A clean day']]} label="Data" />`]],
      notes: [
          html`<b>It lives inside the Armory panel</b>, under the view switch and split from it, and the Repairs tab carries the status itself.`,
          html`<b>Both blocks sit in the panel</b>: the worklist, and the block that says the other builds pass. A clean day is worth a look.`,
      ] },
    { id: 'export', gid: 'M3', realm: 'armory', title: 'Export', sub: 'The search-and-tick selection the drawer lost.',
      pins: [26], Body: A9,
      controls: [['Picker', () => html`<${Seg} k="exp" options=${segOpts('exp', [['now', 'Portal today']])} label="Export" />`],
                 ['Layout', () => html`<${Seg} k="expl" options=${segOpts('expl')} label="Picker layout" />`],
                 ['Ground', () => html`<${Seg} k="xbg" options=${segOpts('xbg')} label="Drawer ground" />`]],
      notes: [
          html`<b>What was lost</b>: the old panel could search, tick whichever builds you wanted and export exactly those.`,
          html`<b>Both options carry the same picker</b> — a search, weapons that tick as a group, builds one by one, a running count.`,
      ] },
];
