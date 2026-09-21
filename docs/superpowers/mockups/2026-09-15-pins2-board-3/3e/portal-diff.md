---
kind: reference
status: live
---


# Board 3-E — the exact changes to PORTAL code

*Generated 2026-09-21 09:36 EDT. The kit's `ui/*.js` and `app.css` are copies of the portal's own files, modified on the board. **This file is those modifications, as unified diffs — the most exact specification a design can have, because it IS the change.** Apply these before reading any value table.*

⚠️ **`app.css` IS NOT ITS SOURCE.** The kit copied `portal/public/app.css`, which the build concatenates from `portal/ui/app.css` + `tokens.css` + `v2card.css`. A kit line number therefore does not map to a source line. The table under the CSS diff re-locates every changed line in `portal/ui/app.css` **by content**; edit there, then rebuild.

| File | Changed lines |
|---|---|
| `ui/app.js` | 12 |
| `ui/armory.js` | 97 |
| `ui/broadcast.js` | 48 |
| `ui/conform.js` | kit-only |
| `ui/exportPanel.js` | 6 |
| `ui/history.js` | 21 |
| `ui/httpClient.js` | 152 |
| `ui/icons.js` | 51 |
| `ui/manifest.js` | 28 |
| `ui/overlay.js` | 11 |
| `ui/shell.js` | 9 |
| `app.css` | 26 |


## `portal/ui/app.js`

```diff
diff --git a/portal/ui/app.js b/local/pins2-board-3/redo/ui/app.js
index 91ea7ea4..b5151bfa 100644
--- a/portal/ui/app.js
+++ b/local/pins2-board-3/redo/ui/app.js
@@ -3,19 +3,17 @@
 // No bundler (spec decision 6): this file and its siblings are served verbatim from portal/public/ui/ and loaded via a native <script type="module"> tag. Pure logic each component needs lives in a sibling .logic.js file (CommonJS, importable from Node's test scripts too) — see portal/ui/*.logic.js and the plan's R10 finding for why the split exists.
 import { h, render } from '../vendor/preact.mjs';
 import { html } from '../vendor/htm-preact.mjs';
-import { Door } from './shell.js';
+import { Door, Shell, Masthead } from './shell.js';
 import { fetchJson } from './httpClient.js';
 import { Skeleton, Failure, NetBanner } from './async.js';
 
 /* global failureOf, asyncDefaults */
-import { SeasonRealm } from './season.js';
 import { ArmoryRealm } from './armory.js';
 import { BroadcastRealm } from './broadcast.js';
-import { AccessRealm } from './access.js';
-import { AnalyticsRealm } from './analytics.js';
 import { HistoryRealm } from './history.js';
-import { ReviewRealm } from './review.js';
-import { HomeRealm } from './home.js';
+// Board 3 v2 — only the three realms the board draws are loaded; the rest open a page that says so.
+const Elsewhere = (realm) => ({ session }) => html`<${Shell} realm=${realm} session=${session} masthead=${html`<${Masthead} title="Not on this board" sub="Board 3 draws Armory, Broadcast and History. Pick a section in the dock at the bottom left." />`} />`;
+const SeasonRealm = Elsewhere('season'), AccessRealm = Elsewhere('access'), AnalyticsRealm = Elsewhere('analytics'), ReviewRealm = Elsewhere('review'), HomeRealm = Elsewhere('home');
 
 // Door/Forbidden used to be re-declared here as local copies of shell.js's own exports — a review pass caught the duplication; both states now go through the ONE Door component (spec §10: a stranger, a never-granted account, and a revoked admin must all read identically).
 const REALM_COMPONENTS = {
```


## `portal/ui/armory.js`

```diff
diff --git a/portal/ui/armory.js b/local/pins2-board-3/redo/ui/armory.js
index fe9fc32d..046fdf86 100644
--- a/portal/ui/armory.js
+++ b/local/pins2-board-3/redo/ui/armory.js
@@ -14,8 +14,13 @@ import { renderV2 } from './v2Render.js';
 import { useOverlay, Drawer } from './overlay.js';
 import { reportFailure } from './async.js';
 import { downloadText } from './download.js';
+// Board 3 v2 — the proposals, mounted into the real Armory.
+import { useB3, hooks } from '../b3/state.js';
+import { B3Badges, ProblemChip, SelectAllBox, SelectionDock } from '../b3/armory-parts.js';
+import { B3BuildDrawer } from '../b3/drawer.js';
+import { RepairsPanel, repairsStatus } from '../b3/repairs.js';
 
-const MODES = ['MP', 'DMZ'];
+export const MODES = ['MP', 'DMZ'];
 const CATEGORIES = ['AR', 'SMG', 'SNIPER', 'LMG', 'SHOTGUN', 'MARKSMAN', 'SECONDARIES', 'MELEE'];
 
 // 🔴 THE MANIFEST NAMED EVERY BUILD AND SHOWED WHAT WAS IN NONE OF THEM. Weapon, build, category, mode and a comma-joined list of defect keys — so the one question you open a build list to answer, *what does this build actually run*, needed a click per row. The attachments peek and the badge chips are what the adopted table was styled for.
@@ -23,7 +28,7 @@ const CATEGORIES = ['AR', 'SMG', 'SNIPER', 'LMG', 'SHOTGUN', 'MARKSMAN', 'SECOND
 // ⚠️ THE PEEK SHOWS TWO AND COUNTS THE REST. Five attachment names is a paragraph in a table cell; two plus "+3" is the shape of the thing, and the editor is one click away for the rest.
 //
 // ⚠️ CATEGORY_CHIP_LABEL / CATEGORY_CHIP_ORDER LIVE IN armory.logic.js NOW, as bare globals the same way DMZ_RANGE_TOKENS always has — they are read by rackCategories(), which is arithmetic over the build list and therefore belongs somewhere a test can reach without a browser. They are still distinct from CATEGORY_LABEL below, which is verbose on purpose for the edit form's dropdown.
-const ARMORY_COLUMNS = [
+export const ARMORY_COLUMNS = [
     { key: 'weaponName', label: 'Weapon', editable: true,
       meta: (r) => `${r.mode} · ${(r.attachments || []).length} attachment${(r.attachments || []).length === 1 ? '' : 's'}` },
     // 🔴 CATEGORY BEFORE BUILD, which is armory.html's own order (Weapon · Category · Build · …). The portal had them the other way round, and the audit reported it as a SYMMETRIC pair — Category→Build and Build→Category — which §0.7c's own rule classifies as a pairing artifact. It was not one: a genuine column swap is exactly what a real reorder looks like to an LCS alignment. Caught only by opening the two captures and reading the header row. The rule needs the boundary: symmetry is evidence of an artifact ONLY when the two elements are interchangeable; two NAMED columns are not. 🔴 THIS COLUMN PRINTED THE STORED ENUM — "AR", "SNIPER", "SECONDARIES" — while a filter chip 200px above it read "Assault 35". One field, two vocabularies, one screen. armory.html prints the label. `editable` comes OFF with the fix and that is deliberate rather than a loss: a free-text cell over an enum could write "Assault" into a field whose only legal values are the keys, and display-vs-edit would have disagreed the moment the label rendered. Category is edited where it has always had a real control — the row editor's own <select>, one click away.
@@ -59,11 +64,11 @@ const ARMORY_COLUMNS = [
 ];
 
 // 🔴 THE MODE CHIP WAS A DEAD END, and --triggers is what surfaced it: the portal offered `MP ×2`, `DMZ ×2` and `All ×2` where the design offers one of each, because the Manifest carried a Mode filter ON TOP OF the masthead's mode switch. The rows handed to the Manifest are already `inMode`, so picking the OTHER mode in that chip could only ever produce an empty table — a control whose every non-default value is guaranteed to show nothing. The mode switch above owns this question; the chipset now carries only Category, which is what armory.html's chip row is.
-const ARMORY_FILTERS = [];
+export const ARMORY_FILTERS = [];
 
 // ─── The weapon groups — plan pins batch 2 §10.4 G4, design board 2 version 21, 2026-09-15 00:23 EDT ────────────────── 🔴 ONE GROUP PER WEAPON, sorted by weapon name only (pin pmtylf7gz: "I'll never sort the armory's manifest by anything other than the Weapon Name"). Rendered through the shared Manifest's renderBody prop, so search, chips, selection, the bulk bar and the empty states stay the Manifest's own. Faults are colour and shape on the faulty cell, never prose in a row (C11); the details live in the header's Fix chip popover. Collapse state and List · By slot are Armory's, in memory, and reset on reload — the board never persisted them and Harkirat was not asked, so nothing is persisted.
 const SLOT_ORDER = ['Optic', 'Muzzle', 'Barrel', 'Stock', 'Laser', 'Underbarrel', 'Rear Grip', 'Ammunition', 'Perk'];
-const slotVar = (slot) => `var(--sl-${String(slot).toLowerCase().replace(/\s+/g, '-')})`;
+const slotVar = (slot) => (slot ? `var(--sl-${String(slot).toLowerCase().replace(/\s+/g, '-')}, var(--sl-unknown))` : 'var(--sl-unknown)');
 // Attachments in Harkirat's display order (utils/adminParser.js CANONICAL_SLOT_ORDER, 2026-07-21), never the code's digit order; a name with no recorded slot keeps its stored position after the known ones.
 function orderedAttachments(b) {
     const slots = b.attachmentSlots || [];
@@ -91,7 +96,7 @@ function copyToClipboard(text) {
     try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch { /* a blocked clipboard leaves the flash unshown, never an error */ }
 }
 
-function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, onCollapseAll }) {
+export function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, onCollapseAll }) {
     const { visible, selected, sort, setSort, onRowClick, selectedRowId, onRemove, stateOf, toggle, setMany } = api;
     const [flash, setFlash] = useState(null);
     const [openFix, setOpenFix] = useState(null);
@@ -108,11 +113,12 @@ function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, on
     const keyAct = (fn) => (e) => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } };
     const cbKey = (fn) => (e) => { if (e.key !== ' ' && e.key !== 'Enter') return; e.preventDefault(); e.stopPropagation(); fn(); };
     const dmz = mode === 'DMZ';
+    const p1 = useB3('p1'); const p3 = useB3('p3'); const p4 = useB3('p4');
 
     return html`
         <div class="wg-wrap">
             <div class="wg-heads">
-                <span></span>
+                ${p4 !== 'now' ? html`<${SelectAllBox} ids=${visible.map((b) => b.id)} selected=${selected} setMany=${setMany} />` : html`<span></span>`}
                 <span><button type="button" class="wg-sort" aria-sort=${dir === 'asc' ? 'ascending' : 'descending'}
                               onClick=${() => setSort({ column: 'weaponName', direction: dir === 'asc' ? 'desc' : 'asc' })}>Weapon<${Icon} name=${dir === 'asc' ? 'chevron-up' : 'chevron-down'} /></button></span>
                 <button type="button" class="wg-fold" onClick=${() => onCollapseAll(allShut ? [] : groups.map((g) => g.name))}><${Fold} open=${!allShut} />${allShut ? 'Expand all' : 'Collapse all'}</button>
@@ -127,12 +133,12 @@ function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, on
                 const tags = weaponTags(first);
                 const slotsHere = SLOT_ORDER.filter((s) => g.builds.some((x) => (x.b.attachmentSlots || []).includes(s)));
                 return html`
-                <div class="wg" key=${g.name} style=${`--c:${first.accentHex || 'var(--ink3)'}`}>
+                <div class="wg" key=${g.name} data-w=${g.name} style=${`--c:${first.accentHex || 'var(--ink3)'}`}>
                     <div class="wg-h" tabIndex="0" aria-expanded=${shut ? 'false' : 'true'} onClick=${() => onToggleGroup(g.name)} onKeyDown=${keyAct(() => onToggleGroup(g.name))}>
                         <span class="wg-cb" role="checkbox" tabIndex="0" aria-checked=${allSel ? 'true' : someSel ? 'mixed' : 'false'} aria-label=${`Select every ${g.name} build`}
-                              onClick=${(e) => { e.stopPropagation(); setMany(ids, !allSel); }} onKeyDown=${cbKey(() => setMany(ids, !allSel))}><span class=${'cb' + (allSel ? ' on' : '')}></span></span>
-                        <div class="wg-line"><b>${g.name}</b><small>${CATEGORY_CHIP_LABEL[first.category] || first.category}<em class="wg-nb">${g.builds.length} build${g.builds.length === 1 ? '' : 's'}</em></small>${tags.length ? html`<span class="wg-tags">${tags.map((t) => html`<span class="wg-tag" data-t=${t.t} key=${t.t}>${t.label}</span>`)}</span>` : null}</div>
-                        ${faulty.length ? html`<span class="wg-fwrap" onClick=${(e) => e.stopPropagation()}>
+                              onClick=${(e) => { e.stopPropagation(); setMany(ids, !allSel && !someSel); }} onKeyDown=${cbKey(() => setMany(ids, !allSel && !someSel))}><span class=${'cb' + (allSel ? ' on' : '')}></span></span>
+                        <div class="wg-line"><b>${g.name}</b><small>${CATEGORY_CHIP_LABEL[first.category] || first.category}<em class="wg-nb">${g.builds.length} build${g.builds.length === 1 ? '' : 's'}</em></small>${p1 !== 'now' ? html`<${B3Badges} b=${first} />` : tags.length ? html`<span class="wg-tags">${tags.map((t) => html`<span class="wg-tag" data-t=${t.t} key=${t.t}>${t.label}</span>`)}</span>` : null}</div>
+                        ${faulty.length && p3 !== 'now' ? html`<${ProblemChip} weapon=${g.name} faulty=${faulty} builds=${builds} onOpen=${(b) => onRowClick(b)} />` : faulty.length ? html`<span class="wg-fwrap" onClick=${(e) => e.stopPropagation()}>
                             <button type="button" class="wg-fsum" aria-expanded=${openFix === g.name ? 'true' : 'false'} onClick=${() => setOpenFix(openFix === g.name ? null : g.name)}><${Icon} name="triangle-alert" />${faulty.length === 1 ? 'Fix build' : 'Fix builds'}<span class="wg-fnos">${faulty.map((x) => html`<i key=${x.n}>${x.n}</i>`)}</span></button>
                             <span class="wg-fpop" role="tooltip">${faulty.map((x) => html`<span class="wg-fpr" key=${x.n}><i>${x.n}</i><span>${x.f.map((f) => html`<span key=${f}>${FAULT_TEXT[f](x.b)}</span>`)}</span></span>`)}</span>
                         </span>` : html`<span></span>`}
@@ -148,6 +154,8 @@ function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, on
                         const atts = orderedAttachments(b);
                         const empties = (b.attachments || []).length <= 2 ? Math.max(0, 5 - atts.length) : 0;
                         const codeBad = (b.coverage || []).includes('code-length-mismatch');
+                        // 2026-09-19 10:26 EDT: the attachments past the code's last pair are the ones it does not carry (his thread on JAK-12 build 1).
+                        const pairs = codeBad ? Math.floor(String(b.shareCode || '').length / 2) : Infinity;
                         return html`
                         <div key=${b.id} class=${'wg-r' + (f.length ? ' bad' : '') + (stateOf(b) === 'staged' ? ' staged' : '') + (sel ? ' sel' : '') + (open ? ' open' : '') + (dmz ? ' dmz' : '')}
                              tabIndex="0" onClick=${() => onRowClick(b)} onKeyDown=${keyAct(() => onRowClick(b))}>
@@ -158,9 +166,9 @@ function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, on
                                 ${label ? html`<span class="wg-plate"><small>Build name</small><span>${label}</span></span>` : null}
                                 ${attView === 'slot' && slotsHere.length
                                     ? html`<div class="wg-slots" style=${`--n:${slotsHere.length}`}>${slotsHere.map((s) => { const at = (b.attachmentSlots || []).indexOf(s); return at >= 0
-                                        ? html`<span class="wg-sc" key=${s} style=${`--sl:${slotVar(s)}`}>${b.attachments[at]}</span>`
+                                        ? html`<span class=${'wg-sc' + (at >= pairs ? ' nocode' : '')} key=${s} title=${at >= pairs ? 'Not in the gunsmith code' : null} style=${`--sl:${slotVar(s)}`}>${b.attachments[at]}</span>`
                                         : html`<span class="wg-sc empty" key=${s}>—</span>`; })}</div>`
-                                    : html`<div class="wg-rail">${atts.map((x) => html`<span class="wg-at" key=${x.i} title=${x.slot || null} style=${SLOT_ORDER.includes(x.slot) ? `--sl:${slotVar(x.slot)}` : null}>${x.name}</span>`)}${Array.from({ length: empties }, (_, i) => html`<span class="wg-at gap" key=${'e' + i}>Empty</span>`)}</div>`}
+                                    : html`<div class="wg-rail">${atts.map((x) => html`<span class=${'wg-at' + (x.i >= pairs ? ' nocode' : '')} key=${x.i} data-slot=${x.slot || null} title=${x.i >= pairs ? `${x.slot ? x.slot + ' — ' : ''}not in the gunsmith code` : x.slot || null} style=${`--sl:${slotVar(x.slot)}`}>${x.name}</span>`)}${Array.from({ length: empties }, (_, i) => html`<span class="wg-at gap" key=${'e' + i}>Empty</span>`)}</div>`}
                             </div>
                             <span class=${'wg-im' + (b.imageKey ? '' : ' no')} role="img" aria-label=${b.imageKey ? 'Image uploaded' : 'No image uploaded'} title=${b.imageKey ? 'Image uploaded' : 'No image uploaded'}><${Icon} name=${b.imageKey ? 'image' : 'image-off'} /></span>
                             ${dmz ? null : b.shareCode
@@ -179,7 +187,7 @@ function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, on
 }
 
 // 🔴 'no-badges' and 'wrong-attachment-count' RETIRED 2026-09-13 17:36 EDT (pins batch 2, pin pmtylf7gz) -- see portal/api/armory.js's coverageFlags for why neither was a real defect. 'few-attachments' and 'code-length-mismatch' are their replacements, not renames: the flag KEYS changed, not just the label text.
-const COVERAGE_LABEL = {
+export const COVERAGE_LABEL = {
     'missing-image': 'Missing image', 'few-attachments': '2 or fewer attachments',
     'stale-90d': 'Not updated in 90 days', 'near-duplicate': 'Near-duplicate code',
     'no-code': 'No gunsmith code', 'code-length-mismatch': 'Code length doesn’t match attachments',
@@ -203,7 +211,7 @@ export function splitCoverage(b) {
 }
 
 // ⚠️ BOTH NOTES READ FROM THE SAME DERIVATION THE MASTHEAD DOES, so a panel and the figures above it cannot disagree -- the failure this realm has already had twice. Each says what its own view is for and nothing the masthead has already said.
-function RackNote({ builds }) {
+export function RackNote({ builds }) {
     const ranked = builds.filter((b) => b.categoryRank || b.dmzRangeRank).length;
     return html`<span class="rt">${ranked} of ${builds.length} ranked</span>`;
 }
@@ -289,6 +297,7 @@ function Rack({ builds, onPick, onAdd, onEdit }) {
         setCOpen(next);
     };
     const openCount = cats.filter((c) => copen.has(c.category)).length;
+    const e6 = useB3('e6');
 
     // An empty armory is not an error and it is not a table with no rows: it is a page whose only useful content is the way out of it, so it carries the button rather than describing one.
     if (!builds.length) {
@@ -309,7 +318,7 @@ function Rack({ builds, onPick, onAdd, onEdit }) {
             <div class="racktools">
                 <button class="chip" disabled=${openCount === cats.length} onClick=${() => setAll(true)}>Expand all</button>
                 <button class="chip" disabled=${openCount === 0} onClick=${() => setAll(false)}>Collapse all</button>
-                <span class="rkt-n">${cats.length} categories · ${builds.length} builds · ${openCount === 0 ? 'all closed — open the one you came for' : openCount + ' open'}</span>
+                ${e6 !== 'now' ? html`<span class="rkt-n b3-facts"><span class="b3-fact"><${Icon} name="layers" /><b>${cats.length}</b> categories</span><span class="b3-fact"><b>${builds.length}</b> builds</span><span class="b3-fact"><${Icon} name="chevrons-down-up" />${openCount === 0 ? 'all closed' : html`<b>${openCount}</b> open`}</span></span>` : html`<span class="rkt-n">${cats.length} categories · ${builds.length} builds · ${openCount === 0 ? 'all closed — open the one you came for' : openCount + ' open'}</span>`}
             </div>
             <div class="rack">
                 ${cats.map((c) => {
@@ -356,7 +365,7 @@ const COVERAGE_WHY = {
     'code-length-mismatch': 'A real code pairs two characters per attachment; this one’s length disagrees with its own build.',
 };
 
-function Coverage({ builds, active, onFilter }) {
+export function Coverage({ builds, active, onFilter }) {
     const flags = Object.keys(COVERAGE_LABEL);
     const total = Math.max(1, builds.length);
     const hitsFor = (f) => builds.filter((b) => (b.coverage || []).includes(f));
@@ -599,7 +608,7 @@ function AddBuildPanel({ f, setF, atts, setAtts, filledFromCode, builds, weaponN
         </div>`;
 }
 
-function BulkBadgesPanel({ ids, onApply, onCancel }) {
+export function BulkBadgesPanel({ ids, onApply, onCancel }) {
     const [badges, setBadges] = useState('');
     return html`
         <div style="display:flex;gap:8px;align-items:center;padding:10px 14px;border-top:1px dashed var(--rule)">
@@ -661,7 +670,7 @@ function BuildIssues({ build }) {
         </div>`;
 }
 
-function BuildEditor({ build, csrfToken, onStage, onClose }) {
+export function BuildEditor({ build, csrfToken, onStage, onClose }) {
     const [draft, setDraft] = useState({ ...build, attachments: [...(build.attachments || [])] });
     const [card, setCard] = useState(null);
     const [imgFailed, setImgFailed] = useState(false);
@@ -828,7 +837,7 @@ const COMPARE_FIELDS = [
 // 🔴 `.cmpcards` EXPECTED `.dcard` CHILDREN AND GOT BARE DIVS, so the column layout, the dividers and every rule under `.dcard.lc` styled nothing — twelve classes with rules and no markup. The card is the RECORD, laid out so two of them line up field for field: the attachment list is the thing you actually compare, and reading it out of two Discord renders means reading two pictures.
 //
 // ⚠️ THE DISCORD RENDER MOVED OUT OF COMPARE, not away. It lives in the build editor's own side column under "What Discord sends", where it sits beside the fields that produce it. Here it cost one request per picked build to show two images you cannot align, while the table below already reports every field that differs.
-function LoadoutCard({ build, siblings }) {
+export function LoadoutCard({ build, siblings }) {
     const b = build;
     const idx = siblings.findIndex((s) => String(s._id) === String(b._id)) + 1;
     const badges = [
@@ -1070,7 +1079,7 @@ function Compare({ builds, weapons, onSetWeapons, onOpenRack, onAdd }) {
 // ── THE ACTIVE FILTER BAR ─────────────────────────────────────────────────────────────────────
 //
 // 🔴 THE FILTER WAS INVISIBLE FROM THE TABLE IT FILTERED. Clicking a Coverage card narrowed the Manifest and said so only in the Manifest's header-right corner, as a bare string with no way back — so a reader who scrolled past it saw a short table and no reason for it, which reads as missing data rather than as a filter. The bar states every active narrowing, in the words the control used, with the count it produced and one control that undoes all of it.
-function FilterBar({ weapon, flag, shown, total, onClear }) {
+export function FilterBar({ weapon, flag, shown, total, onClear }) {
     if (!weapon && !flag) return null;
     return html`
         <div class="afbar">
@@ -1194,7 +1203,7 @@ function BulkCreatePanel({ builds, mode, csrfToken, overlay, onStaged, busy, set
 // ── THE DRAWER ITSELF ────────────────────────────────────────────────────────────────────────
 //
 // Row 2 (G9): the header holds only eyebrow/title/×; a toolbar under it carries the MP/DMZ switch (unchanged look), a rule, then Add build · Bulk create. Row 5: Esc/scrim on a dirty draft asks first. Row 11/12 (harden): handleAdd's stageOps() result is checked rather than assumed, and Stage shows a busy state so a double click cannot stage the same build twice.
-function NewBuildDrawer({ builds, mode, onSubmit, onStaged, onCancel, csrfToken, overlay, initialPanel = 'add' }) {
+export function NewBuildDrawer({ builds, mode, onSubmit, onStaged, onCancel, csrfToken, overlay, initialPanel = 'add' }) {
     const [panel, setPanel] = useState(initialPanel);
     const [f, setF] = useState({
         weaponName: '', category: 'AR', mode, buildName: '', imageKey: '', imageSourceUrl: '', imageLinkText: '',
@@ -1318,11 +1327,11 @@ function NewBuildDrawer({ builds, mode, onSubmit, onStaged, onCancel, csrfToken,
 
 
 // 🔴 THE VIEW NAMES LIVE IN ONE TABLE so the tab strip, the command palette and every branch below read the same strings. They were four bare literals in five places, which is how a rename becomes a silent dead branch: `view === 'Rack'` against a strip offering `Tier board` compiles, runs, and renders the fallback view forever.
-const VIEWS = { rack: 'Tier board', coverage: 'Repairs', compare: 'Compare' };
-const VIEW_ORDER = [VIEWS.rack, VIEWS.coverage, VIEWS.compare];
+export const VIEWS = { rack: 'Tier board', coverage: 'Repairs', compare: 'Compare' };
+export const VIEW_ORDER = [VIEWS.rack, VIEWS.coverage, VIEWS.compare];
 
 // 🔴 THE KEY NAMES ONLY STATES THAT ARE ON SCREEN, which is the whole discipline of a legend and the one thing a hardcoded list cannot do. Filter to DMZ where nothing is stale and a fixed key still advertises "stale", sending a reader hunting for a mark that is not drawn anywhere -- the mockup hit exactly this and recorded it. `clean` is drawn as an EMPTY slot rather than a colour, because clean has no mark on a build chip: inventing a green square for it would teach a mark the page does not use.
-function ArmoryKey({ split }) {
+export function ArmoryKey({ split }) {
     const bad = split.filter((c) => c.faults.length).length;
     const age = split.filter((c) => c.aged && !c.faults.length).length;
     const clean = split.length - bad - age;
@@ -1360,6 +1369,18 @@ export function ArmoryRealm({ session }) {
     // 🔴 BOTH FORMS ARE MODAL DRAWERS NOW, so the view slot no longer has to make room for one. `wrapBed` used to wrap the whole view in the editor's `.bed` grid whenever something was being edited — which meant the rack, the repairs cards and the bulk panel all inherited a layout that exists for a form none of them contain. The drawer carries its own `.bed` internally and the page behind it is `inert`, so the view is only ever the view. 🔴 THE MODE IS A PROPERTY OF THE REALM, NOT OF ONE PANEL. It began as BulkView's private state, so the Rack, Repairs and Compare all showed MP and DMZ mixed together while a fourth view quietly filtered to one of them. MP and DMZ are two armories with different rules -- DMZ has no share code and ranks by combat range -- and every figure on this page is a count of one population or the other, so a masthead that totals both answers a question nobody asked.
     const [armMode, setArmMode] = useState('MP');
     const overlay = useOverlay();
+    const [bulkEditIds, setBulkEditIds] = useState(null);
+    const [bulkOpts, setBulkOpts] = useState(null);
+    const [b3Badge, setB3Badge] = useState(null);
+    useB3('p5'); const p6v = useB3('p6'); const p6day = useB3('p6day'); const g9v = useB3('g9');
+    useEffect(() => {
+        hooks.armoryView = setView; hooks.armoryAttView = setAttView;
+        hooks.armoryNew = (panel) => { setAddMode('MP'); setAddPanel(panel); setShowAdd(true); };
+        hooks.armoryBulkEdit = (ids, opts) => { setBulkOpts(opts || null); setBulkEditIds(ids); };
+        hooks.armoryBadgeFilter = (k) => { setB3Badge(k); setTimeout(() => { const m = document.getElementById('manifest'); if (m) m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); };
+        hooks.armoryFindWeapon = (w) => { const el = document.querySelector(`.wg[data-w="${w}"]`); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const h = el.querySelector('.wg-h'); if (h) { h.classList.remove('b3-pulse'); void h.offsetWidth; h.classList.add('b3-pulse'); } } };
+        return () => { delete hooks.armoryView; delete hooks.armoryAttView; delete hooks.armoryNew; delete hooks.armoryBulkEdit; delete hooks.armoryBadgeFilter; delete hooks.armoryFindWeapon; };
+    });
 
     // ⚠️ `builds` DEFAULTED TO [] AND THE PAGE RENDERED IMMEDIATELY, so the first frame of every visit was a complete, confident, empty Armory — "0 builds · 0 weapons · 0 flagged" over an empty rack, which is a statement about the data rather than about the request. An empty state and an unanswered request must never look the same.
 // 🔴 TWO REALMS COULD STAGE WORK AND NEITHER COULD TELL YOU IT HAD ANY. Season and Home both read /api/review to say how much is waiting — that is what feeds the rail's badge and the masthead's staged figure — and Armory and Broadcast, which stage on every edit, said nothing anywhere. You staged four builds, navigated away, and the console had no memory of it outside the Review screen.
@@ -1412,6 +1433,7 @@ export function ArmoryRealm({ session }) {
     const rows = inMode
         .filter((b) => !coverageFilter || (b.coverage || []).includes(coverageFilter.flag))
         .filter((b) => !weaponFilter || b.weaponName === weaponFilter)
+        .filter((b) => !b3Badge || (b3Badge === 'meta' ? b.isMeta : b3Badge === 'toxic' ? b.isToxic : b.categoryRank === b3Badge))
         .map((b) => ({ ...b, id: b._id, topicVar: null, accentHex: b.accent, state: stagedTargets.has(String(b._id)) ? 'staged' : b.state }));
 
     // 🔴 A DRAWER OVER A ROW THAT NO LONGER EXISTS. The editor used to be handed `builds.find(...)` inline, so a staged bulk deletion followed by a refresh could hand it `undefined` and the first field read would throw inside a modal with the page behind it inert — a dead screen with no way out but Escape. Resolved once here, and the drawer is simply not rendered when the build it was opened for has gone.
@@ -1486,7 +1508,7 @@ export function ArmoryRealm({ session }) {
     const rankedNow = inMode.filter((b) => b.categoryRank || b.dmzRangeRank).length;
     // G1 (§10.4, board row armory.js:1315): Tier board's and Repairs' counts moved onto their tabs (viewCounts below); Compare lost its "type a weapon name" instruction and names the weapons only once there are some.
     const failingChecks = Object.keys(COVERAGE_LABEL).filter((f) => inMode.some((b) => (b.coverage || []).includes(f))).length;
-    const viewCounts = { [VIEWS.rack]: `${rankedNow}/${inMode.length}`, [VIEWS.coverage]: failingChecks };
+    const viewCounts = { [VIEWS.rack]: `${rankedNow}/${inMode.length}`, [VIEWS.coverage]: p6v !== 'now' ? repairsStatus(inMode, p6day === 'clean') : failingChecks };
     const viewMeta = view === VIEWS.compare && comparedWeapons.length
             ? `${comparedWeapons.join(' · ')} — ${inMode.filter((b) => comparedWeapons.includes(b.weaponName)).length} builds`
         : view === VIEWS.bulk ? `${inMode.length} ${armMode} builds · pipe format, lossless round trip` : null;
@@ -1532,7 +1554,7 @@ export function ArmoryRealm({ session }) {
                   stagedOps=${load.data.stagedUnknown ? null : load.data.stagedOps}
                   overlaySlot=${html`
                       ${overlay.render()}
-                      ${showAdd ? html`<${NewBuildDrawer} builds=${builds} mode=${addMode} initialPanel=${addPanel} csrfToken=${session.csrfToken} overlay=${overlay}
+                      ${showAdd && g9v === 'now' ? html`<${NewBuildDrawer} builds=${builds} mode=${addMode} initialPanel=${addPanel} csrfToken=${session.csrfToken} overlay=${overlay}
                                                         onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)}
                                                         onStaged=${(s) => {
                                                             setShowAdd(false);
@@ -1540,6 +1562,10 @@ export function ArmoryRealm({ session }) {
                                                                 'Review →', () => { location.hash = '#/review'; });
                                                             refresh();
                                                         }} />` : null}
+                      ${(showAdd && g9v !== 'now') || bulkEditIds ? html`<${B3BuildDrawer} builds=${builds} mode=${bulkEditIds ? armMode : addMode} panel=${bulkEditIds ? 'bulk' : addPanel} editIds=${bulkEditIds} addBadge=${bulkOpts && bulkOpts.addBadge}
+                          csrfToken=${session.csrfToken} overlay=${overlay} Card=${LoadoutCard}
+                          onClose=${() => { setShowAdd(false); setBulkEditIds(null); }}
+                          onStaged=${(msg) => { setShowAdd(false); setBulkEditIds(null); overlay.say(msg, 'Review →', () => { location.hash = '#/review'; }); refresh(); }} />` : null}
                       ${editingBuild ? html`
                           <${BuildEditor} build=${editingBuild} csrfToken=${session.csrfToken}
                                           onStage=${async (op) => {
@@ -1591,7 +1617,10 @@ export function ArmoryRealm({ session }) {
                               ? html`<${Compare} builds=${rows} weapons=${comparedWeapons} onSetWeapons=${setComparedWeapons}
                                                  onOpenRack=${(w) => { setWeaponFilter(w); setView(VIEWS.rack); }}
                                                  onAdd=${() => { setAddMode(armMode); setShowAdd(true); setAddPanel('add'); }} />`
-                              : html`<${Coverage} builds=${inMode} active=${coverageFilter} onFilter=${setCoverageFilter} />`}
+                              : p6v !== 'now' ? html`<${RepairsPanel} inMode=${inMode} builds=${builds} mode=${armMode} onFix=${(b) => setEditingId(String(b._id))}
+                                   onShowAged=${() => { setCoverageFilter({ flag: 'stale-90d' }); setTimeout(() => { const m = document.getElementById('manifest'); if (m) m.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); }}
+                                   onShowBuild=${(b) => { const el = document.querySelector(`.wg[data-w="${b.weaponName}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} />`
+                               : html`<${Coverage} builds=${inMode} active=${coverageFilter} onFilter=${setCoverageFilter} />`}
                   `}
                   manifestSlot=${html`
                       <!-- 🔴 THE HINT USED TO RENDER HERE, AND IT COST THE WHOLE TABLE ITS DEPTH. Both stylesheets carry
@@ -1601,9 +1630,9 @@ export function ArmoryRealm({ session }) {
                            instead: measured #171E24 against the design's #0F1418, on every row of a 125-row table, with
                            both stylesheets carrying the identical rule. The hint is a caption for the Manifest, so it
                            renders INSIDE it now. FilterBar returns null at rest and never broke anything. -->
-                      <${FilterBar} weapon=${weaponFilter} flag=${coverageFilter && coverageFilter.flag}
+                      <${FilterBar} weapon=${weaponFilter || (b3Badge ? `${b3Badge.toUpperCase()} builds` : null)} flag=${coverageFilter && coverageFilter.flag}
                                     shown=${rows.length} total=${builds.length}
-                                    onClear=${() => { setWeaponFilter(null); setCoverageFilter(null); }} />
+                                    onClear=${() => { setWeaponFilter(null); setCoverageFilter(null); setB3Badge(null); }} />
                       <${Manifest} rows=${rows} columns=${ARMORY_COLUMNS} searchableFields=${['weaponName', 'buildName']}
                                    label="Manifest" filterGroups=${[...ARMORY_FILTERS, { key: 'category', label: 'Category', topic: true, options: categoryOptions }]}
                                    headerRight=${weaponFilter || (coverageFilter ? COVERAGE_LABEL[coverageFilter.flag] : '')}
@@ -1617,11 +1646,15 @@ export function ArmoryRealm({ session }) {
                                    onFiltersChange=${setManifestFilters}
                                    defaultSort="weaponName"
                                    extraChips=${html`<span class="mlabel"><span>Attachments</span></span><span class="seg" role="tablist" aria-label="Attachments">
-                                       <button role="tab" aria-selected=${attView === 'list' ? 'true' : 'false'} onClick=${() => setAttView('list')}>List</button>
-                                       <button role="tab" aria-selected=${attView === 'slot' ? 'true' : 'false'} onClick=${() => setAttView('slot')}>By slot</button></span>`}
+                                       <button role="tab" aria-selected=${attView === 'list' ? 'true' : 'false'} onClick=${() => setAttView('list')}><${Icon} name="list" />List</button>
+                                       <button role="tab" aria-selected=${attView === 'slot' ? 'true' : 'false'} onClick=${() => setAttView('slot')}><${Icon} name="columns-3" />By slot</button></span>`}
                                    renderBody=${(api) => html`<${ArmoryGroups} api=${api} builds=${builds} mode=${armMode} attView=${attView} collapsed=${collapsedWeapons}
                                        onToggleGroup=${(name) => setCollapsedWeapons((s) => { const n = new Set(s); if (n.has(name)) n.delete(name); else n.add(name); return n; })}
                                        onCollapseAll=${(names) => setCollapsedWeapons(new Set(names))} />`}
+                                   renderSelection=${(sel) => html`<${SelectionDock} ids=${sel.ids} rows=${rows} builds=${builds}
+                                       onClear=${sel.clear} onDeselect=${(ids) => sel.setMany(ids, false)}
+                                       onEdit=${(ids) => { if (ids.length === 1) setEditingId(String(ids[0])); else setBulkEditIds(ids); }}
+                                       onExport=${handleExportSelection} onDelete=${confirmBulkDelete} />`}
                                    totalRows=${builds.length}
                                    onRowClick=${(row) => setEditingId(String(row.id))} selectedRowId=${editingId}
                                    bulkActions=${[
```


## `portal/ui/broadcast.js`

```diff
diff --git a/portal/ui/broadcast.js b/local/pins2-board-3/redo/ui/broadcast.js
index 68764342..45a44472 100644
--- a/portal/ui/broadcast.js
+++ b/local/pins2-board-3/redo/ui/broadcast.js
@@ -14,22 +14,24 @@ import { useAsync, RealmShell, reportFailure } from './async.js';
 import { stageOps } from './composeClient.js';
 import { useOverlay, Drawer } from './overlay.js';
 import { SmartDate } from './composer.js';
+import { useB3 } from '../b3/state.js';
+import { EndPicker, NeverChip, ForeverAhead, stagedEndOf } from '../b3/broadcast.js';
 
 // 🔴 NO YEAR. toDateString().slice(4) yields "Aug 14 2026"; the design prints "Aug 14" and so does every other date on this page. Four columns wide, on every row, the year is the same digit repeated 16 times and it pushed the whole table's columns out of register against the design. No year and no leading zero: the design prints "Aug 4", toDateString gives "Aug 04 2026".
-const fmtDay = (v) => new Date(v).toDateString().slice(4, 10).trim().replace(/ 0(\d)$/, ' $1');
+export const fmtDay = (v) => new Date(v).toDateString().slice(4, 10).trim().replace(/ 0(\d)$/, ' $1');
 
 // ⚠️ THE CONTENT LIFECYCLE, NAMED. An inline object literal inside a render closure is a vocabulary nothing else can see, and this column carries TWO of them — the staging state (StatePill) and this. Kept apart on purpose: `LIVE NOW` is not `SAVED`, and a reader who cannot tell a written-and-over post from a staged-and-not-yet-real one has been told half the answer.
 const LIFECYCLE_WORD = { live: 'LIVE NOW', scheduled: 'UPCOMING', expired: 'ENDED' };
 // ⚠️ HOISTED ABOVE ITS READER 2026-09-11 18:49 EDT. `BROADCAST_COLUMNS`'s state renderer reads this four lines before it was declared -- a temporal dead zone `node --check` cannot see, which is the whole reason `scripts/tdzRatchet.mjs` exists. It does not throw TODAY only because the read happens inside a render closure that runs long after the module finishes evaluating; make that renderer eager, or hoist the array, and it becomes a crash. The ratchet counted it as one of two NEW findings against a baseline of 27. 🔴 THE MANIFEST AS DESIGN BOARD 2 DRAWS IT (plan pins batch 2 §10.4 G11 rows 1–3, 2026-09-15 00:07 EDT). The name column gives the text the room and draws the announcement's own colour as a 4px embed-style bar at the row's edge; the three date columns and the state column take the board's widths through their col classes. Posted carries its age under the date, a blank Starts reads On posting (upright, never italic), and no end reads No end in amber with an infinity mark. The State column is one TAB: the lifecycle word and its icon, a 3px bar in the state colour and a 9% wash — and a staged row's tab is a dashed outline, which is the shape-carries-state rule in one control. This replaces StatePill beside a lifecycle word (2026-09-10, pin pmtvqq1xg), because two chips for two axes were the "poorly implemented" labels, and the board answered it with one.
 const LIFECYCLE = { live: { word: 'Live now', icon: 'radio', c: 'var(--ok)' }, scheduled: { word: 'Upcoming', icon: 'calendar', c: 'var(--sched)' }, expired: { word: 'Ended', icon: 'circle-check', c: 'var(--ink3)' } };
-function lifecycleOf(r) {
+export function lifecycleOf(r) {
     if (LIFECYCLE[r.state]) return r.state;
     const now = Date.now();
     if (r.expiresAt && new Date(r.expiresAt).getTime() <= now) return 'expired';
     return r.startsAt && new Date(r.startsAt).getTime() > now ? 'scheduled' : 'live';
 }
 const agoText = (v) => { const d = daysBetween(v, Date.now()); return d <= 0 ? 'today' : `${d} day${d === 1 ? '' : 's'} ago`; };
-const BROADCAST_COLUMNS = [
+export const BROADCAST_COLUMNS = [
     { key: 'text', label: 'Announcement', editable: true, col: 'c-bc-text',
       dotClass: () => 'bcbar', dotStyle: (r) => `--c:${accentOf(r)}`,
       render: (r) => { const t = String(r.text || '').replace(/^#{1,3}\s+/, ''); return html`<b title=${t}>${t}</b>`; } },
@@ -42,7 +44,7 @@ const BROADCAST_COLUMNS = [
 
 
 // The State chips keep the portal's chip with its colour dot (board 2 popup, 13:06 EDT) and carry their counts (§10.4 C1). The words match the Tab in the column, so the filter and the thing it filters say the same thing.
-function broadcastFilters(all) {
+export function broadcastFilters(all) {
     const n = (s) => all.filter((a) => lifecycleOf(a) === s).length;
     return [{ key: 'state', label: 'State', topic: true, options: [
         { value: 'live', label: 'Live now', hex: 'var(--ok)', count: n('live') },
@@ -52,7 +54,7 @@ function broadcastFilters(all) {
 }
 
 // The topic accent for an announcement is its OWN stored colour (models/Announcement.js's `color`, generated once at creation and never regenerated on edit), so the portal's dot matches the embed Discord actually renders rather than inventing a second palette. ⚠️ NEVER RETURNS NULL. models/Announcement.js makes `color` required, but a document written before that field existed -- or any future partial -- would leave --topic-accent unset, and the rules that consume it pair a fill with #000 ink. --patch is the safe floor (12.53:1 under #000).
-const accentOf = (a) => (typeof a.color === 'number' ? '#' + a.color.toString(16).padStart(6, '0') : 'var(--patch)');
+export const accentOf = (a) => (typeof a.color === 'number' ? '#' + a.color.toString(16).padStart(6, '0') : 'var(--patch)');
 
 // Now showing -- the live set in the order Discord delivers it.
 //
@@ -67,7 +69,7 @@ const firstHeading = (t) => (String(t || '').match(/^#{1,3}\s+(.+)$/m) || [])[1]
 const bodyOf = (t) => String(t || '').replace(/^#{1,3}\s+.+$/m, '').trim().slice(0, 110) || String(t || '').slice(0, 110);
 
 // 🔴 WHOLE DAYS BETWEEN TWO DATES, not hours divided by 24. The design counts from midnight to midnight, so an announcement posted at 18:41 twenty days ago is "19d" there and was "20d" here — every age on the page off by one, in a direction that depends on the time of day the fixture happens to carry. 🔴 FLOOR FROM TODAY'S MIDNIGHT TO THE ACTUAL TIMESTAMP, which is what the design's own days() does and what makes "up 19d" 19 rather than 20. Rounding date-to-date gives 20 for a post made at 18:41 twenty calendar days ago; the design counts ELAPSED days from the moment it was posted to the start of today, so a post nineteen-and-a-quarter days old is nineteen. Every age on this realm was one out until this was measured against the design rather than reasoned about.
-const daysBetween = (a, b) => Math.max(0, Math.floor(
+export const daysBetween = (a, b) => Math.max(0, Math.floor(
     (new Date(new Date(b).toISOString().slice(0, 10) + 'T00:00:00Z') - new Date(a)) / 86400000));
 
 const relDay = (iso) => {
@@ -76,7 +78,7 @@ const relDay = (iso) => {
 };
 
 // 🔴 CHANGES AHEAD REPLACES "WHAT ONE PLAYER GETS" (plan pins batch 2 §10.4 G3 row 5, popup 2026-09-14 10:33 EDT). The composer now shows the Discord card itself, so this column answers the question the queue cannot: what is about to change. Every future start and every future end, soonest first, as a date tile and the announcement clamped to two lines.
-function ChangesAhead({ all }) {
+export function ChangesAhead({ all, b3extra = null }) {
     const now = Date.now();
     const events = [];
     for (const a of all) {
@@ -89,17 +91,18 @@ function ChangesAhead({ all }) {
     return html`
         <div class="bchg" role="group" aria-label="Changes ahead">
             <h5>Changes ahead</h5>
+            ${b3extra}
             ${events.length ? events.slice(0, 6).map((ev, i) => { const d = new Date(ev.at); return html`
                 <div class="bchg-i" key=${i} style=${`--gc:${ev.c}`}>
                     <time datetime=${d.toISOString()}><small>${d.toLocaleDateString(undefined, { month: 'short' })}</small>${d.getDate()}</time>
                     <span><b>${String(ev.a.text || '').replace(/^#{1,3}\s+/gm, '')}</b><em>${ev.verb}</em></span>
                 </div>`; })
-            : html`<p class="bchg-none">Nothing starts or stops on a date ahead.</p>`}
+            : b3extra ? null : html`<p class="bchg-none">Nothing starts or stops on a date ahead.</p>`}
         </div>`;
 }
 
 // 🔴 NO PANEL OF ITS OWN. This opened its own div.panel with its own header row INSIDE the Shell's view panel — a panel nested in a panel, carrying the realm name a second time and a 42px band the design does not draw, which pushed everything below it down by 42px and rendered in the overlay as one page-sized region. The design puts this content directly in the view panel and its summary line at the RIGHT OF THE SWITCHER ROW, which the Shell already exposes as `tools`. The caller passes it there. 🔴 THE ANNOUNCEMENT CARD AS DESIGN BOARD 2 DRAWS IT (plan pins batch 2 §10.4 G3 rows 1–4, 2026-09-15 00:28 EDT). The position number is the delivery order, large, in the card's own colour; the text sits in an enclosure clamped to two lines with Show all; the lifespan is one bar between two equal end boxes, the same length on every card so their windows compare at a glance; the meta and the actions share the last row with the actions bottom right. The explanatory sentence under the stack became the heading "Delivery order" (G1), and a card past the cap still says it waits.
-function queueWindow(live) {
+export function queueWindow(live) {
     const now = Date.now();
     let lo = now, hi = now + 7 * 86400000;
     for (const a of live) {
@@ -109,10 +112,11 @@ function queueWindow(live) {
     }
     return { lo, hi: Math.max(hi, lo + 86400000), now };
 }
-function NowShowing({ live, cap, onEdit, onEditDates, onRemove }) {
+export function NowShowing({ live, cap, onEdit, onEditDates, onRemove, b3 = null }) {
     const [openText, setOpenText] = useState(new Set());
     const win = queueWindow(live);
     const pct = (t) => Math.max(0, Math.min(100, ((t - win.lo) / (win.hi - win.lo)) * 100));
+    const b3forever = b3 ? live.filter((x) => !x.expiresAt && !stagedEndOf(x, b3.stagedOps)) : [];
     const toggleText = (id) => setOpenText((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
     return html`
         <div class="bqueue">
@@ -128,11 +132,12 @@ function NowShowing({ live, cap, onEdit, onEditDates, onRemove }) {
                         const text = String(a.text || '').replace(/^#{1,3}\s+/gm, '');
                         const start = new Date(a.startsAt || a.createdAt).getTime();
                         const end = a.expiresAt ? new Date(a.expiresAt).getTime() : null;
+                        const se = b3 ? stagedEndOf(a, b3.stagedOps) : null;
                         const left = pct(start);
                         const days = daysBetween(a.createdAt, Date.now());
                         const showings = a.repeatCount && a.repeatCount > 1 ? a.repeatCount : 1;
                         return html`
-                        <div class=${'qcard' + (waiting ? ' over' : '')} key=${id} role="listitem" style=${`--c:${accentOf(a)}`}
+                        <div class=${'qcard' + (waiting ? ' over' : '') + (b3 && !end && !se ? ' b3-forever' : '') + (b3 && se ? ' b3-endstaged' : '')} key=${id} role="listitem" style=${`--c:${accentOf(a)}`}
                              aria-label=${`Delivery position ${i + 1}${waiting ? `, waiting beyond the ${cap}-message cap` : ''}`}>
                             <span class="bnum">${i + 1}</span>
                             <div class="bbody">
@@ -145,10 +150,10 @@ function NowShowing({ live, cap, onEdit, onEditDates, onRemove }) {
                                     <span class="bend"><${Icon} name="calendar-days" />${fmtDay(a.startsAt || a.createdAt)}</span>
                                     <span class="qbar" aria-hidden="true">
                                         <span class="btrack"></span>
-                                        <span class=${'bspan' + (end ? '' : ' open')} style=${end ? `left:${left}%;width:${Math.max(1, pct(end) - left)}%` : `left:${left}%`}></span>
+                                        ${b3 && !end && se ? html`<span class="bspan b3-stagedspan" style=${`left:${left}%;width:${Math.max(1, pct(se.getTime()) - left)}%`}></span>` : b3 && !end ? html`<span class="bspan b3-run" style=${`left:${left}%;width:${Math.max(1, pct(win.now) - left)}%`}></span><span class="b3-tail" style=${`left:${pct(win.now)}%`}><${Icon} name="infinity" /></span>` : html`<span class=${'bspan' + (end ? '' : ' open')} style=${end ? `left:${left}%;width:${Math.max(1, pct(end) - left)}%` : `left:${left}%`}></span>`}
                                         <span class="bnow" style=${`left:${pct(win.now)}%`}></span>
                                     </span>
-                                    ${end ? html`<span class="bend"><${Icon} name="clock" />${fmtDay(a.expiresAt)}</span>` : html`<span class="bend nev"><${Icon} name="infinity" />No end</span>`}
+                                    ${end ? html`<span class="bend"><${Icon} name="clock" />${fmtDay(a.expiresAt)}</span>` : b3 && se ? html`<span class="bend b3-staged-end"><${Icon} name="clock" />${fmtDay(se)}</span>` : b3 ? html`<${EndPicker} a=${a} csrfToken=${b3.csrfToken} overlay=${b3.overlay} onStaged=${b3.onStaged} />` : html`<span class="bend nev"><${Icon} name="infinity" />No end</span>`}
                                 </div>
                                 <div class="bmeta">
                                     <span class="bpill">up ${days}d</span>
@@ -166,7 +171,7 @@ function NowShowing({ live, cap, onEdit, onEditDates, onRemove }) {
                     })}
                 </div>`}
             </div>
-            <${ChangesAhead} all=${live} />
+            <${ChangesAhead} all=${live} b3extra=${b3forever.length ? html`<${ForeverAhead} list=${b3forever} accentOf=${accentOf} daysBetween=${daysBetween} csrfToken=${b3.csrfToken} overlay=${b3.overlay} onStaged=${b3.onStaged} />` : null} />
         </div>
     `;
 }
@@ -192,7 +197,7 @@ function airtimeWindow(all, todayIso) {
  * different strings truncated to the same string is still well-formed text. A shared opener is not
  * a seeding artefact either: a house style ("PSA:", "[Maintenance]") collides in exactly the same
  * way. Strip whatever prefix ALL of them share, back off to a word boundary, then truncate. */
-function commonPrefix(list) {
+export function commonPrefix(list) {
     if (list.length < 2) return '';
     let n = 0;
     while (n < list[0].length && list.every((t) => t[n] === list[0][n])) n++;
@@ -254,7 +259,7 @@ function Airtime({ all }) {
 }
 
 // The proactive data-quality callout from 05-door-broadcast-ops.html. It names the specific announcement and the specific number rather than warning in the abstract -- an "announcements can stay up forever" notice teaches nothing, "this one has been up 19 days" is actionable.
-function HeadsUp({ all, onSetEnd }) {
+export function HeadsUp({ all, onSetEnd }) {
     const forever = all.filter((a) => a.state === 'live' && !a.expiresAt)
         .map((a) => ({ ...a, days: daysBetween(a.createdAt, Date.now()) }))
         .sort((a, b) => b.days - a.days);
@@ -297,7 +302,7 @@ function RepeatGlyphs({ n }) {
 // Mirrors /manage's real post-announcement modal (text/expiry) plus startsAt, a banner image and a repeat count (pins batch 2, spec §7/§10.3). The Discord-side fields stay authoritative for what the server accepts; this drawer is the richer web equivalent, built per the pins-2 design board (G8).
 //
 // ⚠️ EDIT AND POST SHARE ONE FORM. `initial` is the announcement object when opened from Broadcast's "Edit"/"Dates and repeats" buttons or HeadsUp's "Set an end date" (null when opened from "+ Post announcement") — pre-fills every field and switches submit() to an announcement.edit op that carries bannerImageUrl and repeatCount (row 8: an edit that omits them would silently wipe them, see core/ops/announcements.js's apply()).
-function PostForm({ initial, allAnnouncements, onSubmit, onCancel }) {
+export function PostForm({ initial, allAnnouncements, onSubmit, onCancel }) {
     const editing = Boolean(initial);
     const [text, setText] = useState(initial?.text || '');
     const [startsAt, setStartsAt] = useState('');
@@ -431,6 +436,7 @@ export function BroadcastRealm({ session }) {
     const [notice, setNotice] = useState('');
     const [view, setView] = useState('Delivery queue');
     const overlay = useOverlay();
+    const p8 = useB3('p8');
 
 // 🔴 TWO REALMS COULD STAGE WORK AND NEITHER COULD TELL YOU IT HAD ANY. Season and Home both read /api/review to say how much is waiting — that is what feeds the rail's badge and the masthead's staged figure — and Armory and Broadcast, which stage on every edit, said nothing anywhere. You staged four builds, navigated away, and the console had no memory of it outside the Review screen.
 //
@@ -546,13 +552,13 @@ export function BroadcastRealm({ session }) {
                                                                               onClick=${() => setShowAdd(true)} />`} />`}
                   viewSlot=${html`
                       ${notice ? html`<p style="color:var(--warn);padding:0 var(--gut)">${notice}</p>` : null}
-                      ${view === 'Delivery queue' ? html`<${NowShowing} live=${data.live} cap=${data.maxPerMessage} onEdit=${openEdit} onEditDates=${openEdit} onRemove=${(a) => confirmBulkDelete([a._id])} />` : html`<${Airtime} all=${data.all} />`}
+                      ${view === 'Delivery queue' ? html`<${NowShowing} live=${data.live} cap=${data.maxPerMessage} onEdit=${openEdit} onEditDates=${openEdit} onRemove=${(a) => confirmBulkDelete([a._id])} b3=${p8 !== 'now' ? { csrfToken: session.csrfToken, overlay, stagedOps: data.stagedOps, onStaged: (msg) => { overlay.say(msg, 'Review', () => { location.hash = '#/review'; }); refresh(); } } : null} />` : html`<${Airtime} all=${data.all} />`}
                   `}
                   
                   stateKey=${false}
                   tools=${html`<span class="key" aria-label="What the marks mean"><span class="l"><i></i>saved</span><span class="s"><i></i>staged</span></span>`}
-                  meta=${view === 'Delivery queue' ? html`<span class="bqcount"><span class="bqm" aria-hidden="true"><i style=${`width:${Math.min(100, (Math.min(counts.live, data.maxPerMessage) / data.maxPerMessage) * 100)}%`}></i></span><b>${Math.min(counts.live, data.maxPerMessage)}</b> of ${data.maxPerMessage} slots used</span>` : null}
-                  noticeSlot=${html`<${HeadsUp} all=${data.all} onSetEnd=${openEdit} />`}
+                  meta=${view === 'Delivery queue' ? html`${p8 !== 'now' ? html`<${NeverChip} n=${data.live.filter((x) => !x.expiresAt && !stagedEndOf(x, data.stagedOps)).length} />` : null}<span class="bqcount"><span class="bqm" aria-hidden="true"><i style=${`width:${Math.min(100, (Math.min(counts.live, data.maxPerMessage) / data.maxPerMessage) * 100)}%`}></i></span><b>${Math.min(counts.live, data.maxPerMessage)}</b> of ${data.maxPerMessage} slots used</span>` : null}
+                  noticeSlot=${p8 !== 'now' ? null : html`<${HeadsUp} all=${data.all} onSetEnd=${openEdit} />`}
                   manifestSlot=${html`<${Manifest} rows=${rows} columns=${BROADCAST_COLUMNS} searchableFields=${['text']}
                                                     label="Manifest" selectable=${false} searchPlaceholder="Search the text…" addLabel="+ Post announcement" filterGroups=${broadcastFilters(data.all)}
                                                     bulkNote="Reversible — a staged deletion is discarded, never undone"
```


## `portal/ui/conform.js`

KIT-ONLY — no portal counterpart; `local/pins2-board-3/redo/ui/conform.js` is new code

## `portal/ui/exportPanel.js`

```diff
diff --git a/portal/ui/exportPanel.js b/local/pins2-board-3/redo/ui/exportPanel.js
index 5c86b804..0c44c881 100644
--- a/portal/ui/exportPanel.js
+++ b/local/pins2-board-3/redo/ui/exportPanel.js
@@ -12,6 +12,7 @@ import { useState } from '../vendor/preact-hooks.mjs';
 import { fetchJson } from './httpClient.js';
 import { downloadText } from './download.js';
 import { reportFailure } from './async.js';
+import { useB3 } from '../b3/state.js';
 
 const clock = (at) => new Date(at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
 
@@ -92,6 +93,7 @@ export function ExportDrawer({ scopes, overlay, onClose }) {
 
 // ⚠️ THE OPEN STATE IS THE SHELL'S WHEN THE SHELL OFFERS ONE. The strip is inside the masthead and the drawer must not be, so the one piece of state they share is lifted rather than duplicated; without the props it keeps its own, which is what any other caller gets.
 export function ExportStrip({ label, scopes, overlay, open: openProp = null, onToggle = null }) {
+    const b3e6 = useB3('e6');
     const [openLocal, setOpenLocal] = useState(false);
     if (!scopes || !scopes.length) return null;
     const open = onToggle ? Boolean(openProp) : openLocal;
@@ -109,6 +111,6 @@ export function ExportStrip({ label, scopes, overlay, open: openProp = null, onT
             </button>
             <!-- The list lives in the DRAWER, which shell.js mounts. It used to also render inline here, which
                  was the same component in two homes and they had already begun to drift. -->
-            <span class="mh-take-n">${exportSummary(scopes)}</span>
+            ${b3e6 !== 'now' ? html`<span class="mh-take-n b3-facts">${String(exportSummary(scopes)).split(' · ').map((x) => { const m = /^(\S+)\s(.*)$/.exec(x); return html`<span class="b3-fact" key=${x}>${m ? html`<b>${m[1]}</b> ${m[2]}` : x}</span>`; })}</span>` : html`<span class="mh-take-n">${exportSummary(scopes)}</span>`}
         </div>`;
 }
```


## `portal/ui/history.js`

```diff
diff --git a/portal/ui/history.js b/local/pins2-board-3/redo/ui/history.js
index 1cbbf4f2..1aab4e9f 100644
--- a/portal/ui/history.js
+++ b/local/pins2-board-3/redo/ui/history.js
@@ -12,6 +12,8 @@ import { Icon } from './icons.js';
 import { fetchJson } from './httpClient.js';
 import { useAsync, RealmShell, reportFailure } from './async.js';
 import { useOverlay, Drawer } from './overlay.js';
+import { useB3 } from '../b3/state.js';
+import { B3History } from '../b3/history.js';
 
 // Analytics' Health tiles and level rows still open this river pre-filtered. Routing is an exact hash match, so the filter is handed over in sessionStorage under this key and consumed once, on mount.
 export const HISTORY_FILTER_KEY = 'history.filter';
@@ -29,14 +31,14 @@ function takeHandoff() {
 const KIND_LABEL = { change: 'CHANGE', alert: 'ALERT', boot: 'RESTART' };
 
 // Where the event came from, which is the column that makes "one history, two front doors" true rather than asserted: a ChangeLog row written by the portal and one written by /manage are the same kind of thing from different surfaces, and you can only see that if the surface is a column.
-function sourceOf(row) {
+export function sourceOf(row) {
     if (row.kind !== 'change') return '—';
     const s = (row.source || row.via || '').toLowerCase();
     // 🔴 THREE READINGS, NOT TWO. Until 2026-09-10 15:06 EDT this was a ternary over a field nothing wrote, so it answered DISCORD for every row including changes made in this very window. Rows from before models/ChangeLog.js gained `source` genuinely have no origin recorded, and an em dash says so -- the portal's own rule that a figure it does not have is never a figure it guesses.
     return s === 'portal' ? 'PORTAL' : s === 'discord' ? 'DISCORD' : '—';
 }
 
-function summaryOf(row) {
+export function summaryOf(row) {
     if (row.kind === 'alert') return row.title || 'Alert';
     if (row.kind === 'boot') return `restarted — ${row.kind_ || row.bootKind || row.version || 'boot'}`;
     return row.summary || row.target || row.action || 'Change';
@@ -53,11 +55,11 @@ function whenText(v) {
 }
 
 // Level counts ride on the Level chips (§10.4 C1: counts live on chips, never beside the table). Computed from the rows the page holds, so a count and the filter it labels always agree.
-function withLevelCounts(groups, rows) {
+export function withLevelCounts(groups, rows) {
     return groups.map((g) => (g.key !== 'level' ? g : { ...g, options: g.options.map((o) => ({ ...o, count: rows.filter((r) => r.level === o.value).length.toLocaleString() })) }));
 }
 
-const RIVER_COLUMNS = [
+export const RIVER_COLUMNS = [
     { key: 'at', label: 'When', col: 'c-win', dataKind: 'date', render: (r) => html`<span class="whent">${whenText(r.at)}</span>` },
     { key: 'kind', label: 'Kind', col: 'c-type', render: (r) => html`<span class=${'rivk ' + r.kind}>${KIND_LABEL[r.kind] || r.kind}</span>` },
     // ⚠️ The source is PLAIN TEXT in a monospaced column. It used to carry a `.src` chip class with no rule behind it, and a chip here would compete with the kind chip beside it for the same reading — one of the two has to be quieter, and the kind is the one that classifies.
@@ -73,13 +75,13 @@ const RIVER_COLUMNS = [
 ];
 
 // 🔴 A NAME IF ONE EXISTS, AND A HONEST SHORT ID IF NOT -- never nineteen digits truncated to six, which is what this column showed until 2026-09-10 15:08 EDT. The map comes from portal/api/analytics.js and holds only what the codebase actually stores: `owner`, plus each granted admin's own note. An unknown id keeps its last six digits behind an ellipsis, which at least reads as an identifier rather than as a number that means something.
-function actorLabel(actorId, actors) {
+export function actorLabel(actorId, actors) {
     if (!actorId) return 'system';
     const named = actors && actors[actorId];
     return named || ('…' + String(actorId).slice(-6));
 }
 
-const RIVER_FILTERS = [
+export const RIVER_FILTERS = [
     // 🔴 "no color identity within these buttons" — pin pmtuxqsk4, on the `alerts` chip. Armory's category chips have carried a topic swatch since the Manifest gained `topic: true`; Analytics never passed it, so the one realm whose whole subject IS three colour-coded kinds rendered its filter as three grey words. The hexes are `.rivk`'s, not new ones — the chip and the badge it filters to now agree. ⚠️ Level is deliberately left neutral: `lv-error`/`lv-warn`/`lv-caution`/`lv-info` are a SEVERITY ramp rather than a topic vocabulary, and inventing a fourth mapping for them is how a third vocabulary starts. If that ramp should reach the chips it is one line, and it is a decision.
     { key: 'kind', label: 'Kind', topic: true, options: [
         { value: 'change', label: 'changes', hex: 'var(--info)' },
@@ -128,7 +130,7 @@ const EVENT_NOTE = {
 };
 
 // ⚠️ A ROW WITH NO USABLE DATE MUST NOT TAKE THE REALM DOWN. `new Date(x).toISOString()` throws a RangeError on an unparseable value, and this renders inside the page rather than beside it -- one malformed `createdAt` in one of three collections would blank Analytics entirely, mid-render, with no error state.
-function EventDrawer({ row, onClose, onRevert }) {
+export function EventDrawer({ row, onClose, onRevert }) {
     const at = new Date(row.at);
     const atText = whenText(at);
     const revertable = row.kind === 'change' && !row.undone;
@@ -157,6 +159,7 @@ export function HistoryRealm({ session }) {
     const [riverFilter] = useState(takeHandoff);
     const [openEvent, setOpenEvent] = useState(null);
     const overlay = useOverlay();
+    const p9 = useB3('p9');
 
     if (!load.data) return html`<${RealmShell} realm="history" session=${session} error=${load.error} slow=${load.slow}
                                                onRetry=${load.reload} skeleton=${{ rows: 8, lines: [18, 30, 14, 22, 10] }} />`;
@@ -235,7 +238,7 @@ export function HistoryRealm({ session }) {
                                                    { value: changes.length, label: 'changes shown' },
                                                    { value: reversible, label: 'reversible' },
                                                ]} />`}
-                  manifestSlot=${html`<${Manifest} rows=${rows} columns=${RIVER_COLUMNS} searchableFields=${['summary', 'title', 'actor', 'detail']}
+                  manifestSlot=${p9 !== 'now' ? html`<${B3History} rows=${rows} actors=${data.actors} total=${data.riverTotal ?? rows.length} selectedId=${openEvent && openEvent.id} onOpen=${(row) => setOpenEvent(row)} onRevert=${confirmRevert} hasMore=${rows.length < (data.riverTotal ?? rows.length)} onMore=${() => setRiverLimit((n) => n + 100)} />` : html`<${Manifest} rows=${rows} columns=${RIVER_COLUMNS} searchableFields=${['summary', 'title', 'actor', 'detail']}
                                                     title="One history, both front doors" label="Events" filterGroups=${withLevelCounts(RIVER_FILTERS, rows)}
                                                     headerRight="Alerts, changes and boots are all events — filtering one stream beats switching between four lists."
                                                     emptyText="No changes, alerts or restarts have been recorded yet."
```


## `portal/ui/httpClient.js`

```diff
diff --git a/portal/ui/httpClient.js b/local/pins2-board-3/redo/ui/httpClient.js
index 622b79af..50aa6dbe 100644
--- a/portal/ui/httpClient.js
+++ b/local/pins2-board-3/redo/ui/httpClient.js
@@ -1,28 +1,128 @@
-// portal/ui/httpClient.js — ESM. The one fetch wrapper every realm should use, so a 401 (session expired) and a 403 (access revoked) are recognized the same way everywhere instead of each realm re-deriving its own error shape from the response body (simplify Reuse #1 / Altitude #16 — this used to live as an unexported local in app.js, used only for /auth/csrf).
+// Board 3 version 2 — BOARD ONLY. This file replaces portal/ui/httpClient.js inside local/pins2-board-3/v2 and nowhere else.
 //
-// 🔴 IT USED TO THROW, AND NOTHING CAUGHT IT. `return res.json()` rejects on a dropped connection and on any non-JSON body — which is exactly what a 500 produces, and what a proxy or a tunnel in front of the portal produces. Every realm called this as `fetchJson(path).then(setData)` with no second argument, so all three cases became an unhandled rejection and the page sat on the word "Loading" forever. A request now always RESOLVES; the payload says what happened, and portal/ui/async.logic.js turns that into a verdict.
-//
-// 🔴 A 4xx BODY IS AN ANSWER AND MUST SURVIVE UNTOUCHED. The commit path reads a 409 carrying the gate result ({ok:false, reason}), and Access reads a 400 carrying {error}. Collapsing every non-2xx into a generic failure would have silently destroyed both — the caller would see no reason, show its fallback string, and the specific sentence the server wrote would be gone. So only 5xx, an unreadable body, and a connection that never landed are converted; everything else passes through with `httpStatus` added, which is additive and cannot change an existing read.
-export async function fetchJson(path, opts) {
-    let res;
-    try {
-        res = await fetch(path, { credentials: 'same-origin', ...opts });
-    } catch (e) {
-        // A fetch that rejects never reached the server: the tunnel is down, the machine is offline, or the request was aborted. Nothing was written, and saying so is the point.
-        return { failed: true, offline: true, status: 0, detail: String((e && e.message) || e) };
-    }
-    if (res.status === 401) return { signedOut: true };
-    if (res.status === 403) return { forbidden: true };
-
-    let body;
-    try {
-        body = await res.json();
-    } catch (e) {
-        return { failed: true, unreadable: true, status: res.status, detail: String((e && e.message) || e) };
-    }
-    if (res.status >= 500) {
-        return { ...(body && typeof body === 'object' ? body : {}), failed: true, status: res.status,
-            detail: (body && body.error) || null };
+// The board runs the portal's own components (copied verbatim from portal/public/ui) so what Harkirat clicks on the board is what the portal does. Every GET answers with what the dev portal returned on 2026-09-15 (data/*.js, written by capture.cjs), so the rows are real dev data. Every write stages into an in-page store instead of a database, so staging, the tray, dashed staged rows and Discard all behave; nothing leaves the page.
+// Same contract as the real client: a request always resolves, and it resolves on a later tick.
+import CSRF from '../data/csrf.js';
+import ARMORY from '../data/armory.js';
+import REVIEW from '../data/review.js';
+import BROADCAST from '../data/broadcast.js';
+import ANALYTICS from '../data/analytics.js';
+import ANALYTICS300 from '../data/analytics300.js';
+import CHANGESET from '../data/changeset.js';
+import PREVIEWS from '../data/previews.js';
+
+const builds = () => ARMORY.builds;
+const buildById = (id) => builds().find((b) => String(b._id) === String(id));
+const TIER = (type) => (/delete|purge|remove/i.test(type) ? 2 : 1);
+const staged = [];
+let seq = 0;
+
+function nameOf(op) {
+    const id = (op.target && (op.target.id || op.target._id)) || (op.payload && op.payload.id);
+    const b = id && buildById(id);
+    if (b) return `${b.weaponName} · ${b.buildName || 'Build'}`;
+    const ids = op.payload && Array.isArray(op.payload.ids) ? op.payload.ids : [];
+    if (ids.length) return ids.length === 1 && buildById(ids[0]) ? `${buildById(ids[0]).weaponName} · ${buildById(ids[0]).buildName}` : `${ids.length} builds`;
+    return (op.payload && (op.payload.weaponName || op.payload.title || op.payload.text)) || op.type;
+}
+
+function reviewPayload() {
+    const ops = staged.flatMap((cs) => cs.ops.map((o, index) => ({
+        id: `${cs._id}:${index}`, changesetId: cs._id, index, realm: cs.realm, op: o.type, tier: cs.tier,
+        name: nameOf(o), verb: /delete/i.test(o.type) ? 'deleted' : /add|create/i.test(o.type) ? 'added' : 'changed',
+        rows: Object.entries(o.payload || {}).filter(([k]) => k !== 'ids' && k !== 'id').slice(0, 6).map(([key, to]) => ({ key, from: null, to: Array.isArray(to) ? to.join(', ') : to })),
+        destroys: cs.tier === 3, exported: false, exportedAt: null, stale: false, staleChecked: true, blocked: null,
+        confirmText: cs._id.toUpperCase(),
+        targetIds: [o.target && (o.target.id || o.target._id), o.payload && o.payload.id, ...((o.payload && Array.isArray(o.payload.ids)) ? o.payload.ids : [])].filter(Boolean).map(String),
+    })));
+    const changesets = staged.map((cs) => ({ id: cs._id, realm: cs.realm, tier: cs.tier, state: 'staged', exportedAt: null, confirmText: cs._id.toUpperCase(), opCount: cs.ops.length, gate: { ok: cs.tier !== 3, reason: cs.tier === 3 ? 'export required' : null } }));
+    return { ops: [...REVIEW.ops, ...ops], changesets: [...REVIEW.changesets, ...changesets] };
+}
+
+function exportText(list) {
+    return list.map((l) => {
+        const badges = [l.isMeta ? 'meta' : null, l.categoryRank, l.dmzRangeRank ? String(l.dmzRangeRank).replace('-', '') : null, l.isToxic ? 'toxic' : null].filter(Boolean).join(', ');
+        const lines = [`${l.weaponName} | ${l.category}`];
+        if (l.buildName) lines.push(`Build: ${l.buildName}`);
+        if (l.imageKey && !String(l.imageKey).startsWith('http')) lines.push(`Image: ${l.imageKey}`);
+        if (l.shareCode) lines.push(`Code: ${l.shareCode}`);
+        if (badges) lines.push(`Badges: ${badges}`);
+        lines.push(...(l.attachments || []).map((a) => `- ${a}`));
+        return lines.join('\n');
+    }).join('\n\n');
+}
+
+// The block grammar the real parser reads (utils/adminParser.js), narrowed the same way the fixture harness narrows it; "existing" is decided against the real dev builds.
+function parseBulk(body) {
+    const mode = (body && body.mode) === 'DMZ' ? 'DMZ' : 'MP';
+    const KEYS = { build: 'buildName', image: 'imageKey', code: 'shareCode', badges: 'badges' };
+    const blocks = String((body && body.text) || '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
+    const rows = []; const errors = [];
+    for (const block of blocks) {
+        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
+        const head = lines[0];
+        const snippet = head.length > 60 ? `${head.slice(0, 60)}...` : head;
+        const parts = head.split('|').map((x) => x.trim());
+        if (!parts[0] || !parts[1]) { errors.push(`"${snippet}" -- a block's first line must be "Weapon | Category", and both halves are required.`); continue; }
+        const fields = {}; const attachments = []; let badKey = null;
+        for (const line of lines.slice(1)) {
+            if (/^[-*•]\s+/.test(line)) { attachments.push(line.replace(/^[-*•]\s+/, '').trim()); continue; }
+            const keyed = /^([A-Za-z ]+):\s*(.*)$/.exec(line);
+            if (!keyed) { attachments.push(line); continue; }
+            const key = keyed[1].trim().toLowerCase();
+            if (!Object.prototype.hasOwnProperty.call(KEYS, key)) { badKey = keyed[1].trim(); break; }
+            fields[KEYS[key]] = keyed[2].trim();
+        }
+        if (badKey) { errors.push(`"${snippet}" -- unrecognized field "${badKey}:". Valid fields are Build, Image, Code and Badges.`); continue; }
+        if (!attachments.length) { errors.push(`"${snippet}" -- no attachment lines found under the header`); continue; }
+        const weaponKey = parts[0].toLowerCase().replace(/\s+/g, '');
+        const buildName = fields.buildName || 'Standard Build';
+        rows.push({ weaponName: parts[0], buildName, category: parts[1].toUpperCase(), attachments: attachments.length, imageKey: fields.imageKey || '', shareCode: fields.shareCode || '',
+            existing: builds().some((b) => b.mode === mode && String(b.weaponName).toLowerCase().replace(/\s+/g, '') === weaponKey && (b.buildName || 'Standard Build') === buildName) });
     }
-    return (body && typeof body === 'object') ? { ...body, httpStatus: res.status } : body;
+    return { mode, blocks: blocks.length, rows, errors };
+}
+
+const ROUTES = [
+    [/^\/auth\/csrf$/, () => CSRF],
+    [/^\/api\/armory$/, () => ARMORY],
+    [/^\/api\/review$/, () => reviewPayload()],
+    [/^\/api\/broadcast$/, () => BROADCAST],
+    [/^\/api\/analytics$/, (q) => (Number(q.get('river')) > 100 ? ANALYTICS300 : ANALYTICS)],
+    [/^\/api\/armory\/preview$/, (q) => PREVIEWS[q.get('id')] || { card: null }],
+    [/^\/api\/armory\/export$/, (q) => {
+        const ids = String(q.get('ids') || '').split(',').filter(Boolean);
+        const mode = q.get('mode'); const cat = (q.get('category') || '').toUpperCase();
+        const list = ids.length ? builds().filter((b) => ids.includes(String(b._id))) : builds().filter((b) => (!mode || b.mode === mode) && (!cat || String(b.category).toUpperCase() === cat));
+        return { text: exportText(list), count: list.length };
+    }],
+    [/^\/api\/parse-bulk\/loadout$/, (q, body) => parseBulk(body)],
+    [/^\/api\/parse-date$/, (q) => ({ q: q.get('q'), iso: null })],
+    [/^\/api\/changeset$/, (q, body) => {
+        if (!body) return { changesets: [...CHANGESET.changesets, ...staged] };
+        const ops = body.ops || [];
+        const cs = { _id: `b3cs${++seq}`, realm: body.realm, tier: Math.max(1, ...ops.map((o) => o.tier || TIER(o.type))), state: 'staged', ops, exportedAt: null, createdAt: new Date().toISOString() };
+        staged.push(cs);
+        return { changesetId: cs._id, state: 'staged', tier: cs.tier, failures: [], preview: [] };
+    }],
+    [/^\/api\/changeset\/[^/]+\/(discard|commit)$/, (q, body, path) => {
+        const id = path.split('/')[3];
+        const i = staged.findIndex((c) => c._id === id);
+        if (i >= 0) staged.splice(i, 1);
+        return { ok: true };
+    }],
+    [/^\/api\/changeset\/[^/]+\/preview$/, () => ({ preview: null })],
+    [/^\/api\/revert\//, () => ({ ok: true })],
+];
+
+export async function fetchJson(path, opts) {
+    const [pathname, query = ''] = String(path).split('?');
+    let body = null;
+    try { body = opts && opts.body ? JSON.parse(opts.body) : null; } catch (e) { body = null; }
+    await new Promise((r) => setTimeout(r, 0));
+    for (const [re, make] of ROUTES) if (re.test(pathname)) return make(new URLSearchParams(query), body, pathname);
+    return { ok: true };
 }
+
+export const __board = { staged, builds };
+window.__b3data = __board;
```


## `portal/ui/icons.js`

```diff
diff --git a/portal/ui/icons.js b/local/pins2-board-3/redo/ui/icons.js
index 70aca763..800be5e4 100644
--- a/portal/ui/icons.js
+++ b/local/pins2-board-3/redo/ui/icons.js
@@ -7,9 +7,37 @@
 // Every icon inherits currentColor and is 1em square (see .ic in shell.css), so it sits in text without a fight. Decorative by default — an icon beside a word is not read twice; pass `label` only when the icon is the ONLY thing carrying the meaning.
 import { h } from '../vendor/preact.mjs';
 import { html } from '../vendor/htm-preact.mjs';
+import { b3, useB3 } from '../b3/state.js';
 
 // Lucide path data, verbatim. Keep Lucide's own names so a swap or an addition is a lookup rather than a guess.
 const PATHS = {
+    // Board 3 v2 — icons the proposals need that the portal sprite lacks (Lucide, MIT).
+    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
+    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
+    'undo-2': '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
+    'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
+    'bot': '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
+    'rotate-cw': '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
+    'tag': '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
+    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
+    'chevrons-down-up': '<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>',
+    'list-checks': '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
+    'code': '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
+    'corner-down-left': '<path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/>',
+    'pencil': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
+    'repeat': '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
+    'text': '<path d="M15 12H3"/><path d="M17 18H3"/><path d="M21 6H3"/>',
+    'calendar-plus': '<path d="M8 2v4"/><path d="M16 2v4"/><path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8"/><path d="M3 10h18"/><path d="M16 19h6"/><path d="M19 16v6"/>',
+    'crown': '<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/>',
+    'zap': '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
+    'filter': '<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>',
+    'arrow-down-up': '<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>',
+    'panel-bottom-open': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 15h18"/><path d="m9 10 3-3 3 3"/>',
+    'sparkles': '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
+    'mouse-pointer-click': '<path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/>',
+    'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
+    'chevron-left': '<path d="m15 18-6-6 6-6"/>',
+    'grip-vertical': '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
     'check':        '<path d="M20 6 9 17l-5-5"/>',
     'x':            '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
     'plus':         '<path d="M5 12h14"/><path d="M12 5v14"/>',
@@ -39,14 +67,32 @@ const PATHS = {
     'radio':        '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>',
     'calendar':     '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
     'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
+    'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
     'infinity':     '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>',
     'history':      '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
     'clock':        '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
     'calendar-days':'<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>',
     // The New Build drawer's Add build / Bulk create toggle (pins batch 2, row 2, G9) -- a single card vs a stack of them, so the two modes read as "one" and "many" rather than needing a label to tell them apart.
     'card':         '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
+    'table':        '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 9v12"/>',
+    'list':         '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
+    'columns-3':    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>',
+    'award':        '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
+    // ROUND 10A (2026-09-20 11:17 EDT): THE SEVEN REALM GLYPHS, COPIED VERBATIM FROM portal/ui/shell.js's REALM_ICON.
+    // "look at the Realm icons, they don't even match the icons used for those realms." They did not: the portal
+    // draws Armory as a ringed sight, Broadcast as a megaphone and Access as a key, and the History chips had
+    // invented layers, a radio wave and a shield. Same path data, one source, so the two surfaces cannot drift.
+    'r-season': '<path d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z"/>',
+    'r-armory': '<path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 2v4M12 18v4M2 12h4M18 12h4M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>',
+    'r-broadcast': '<path d="M4 10v4a1 1 0 0 0 1 1h3l5 4V5L8 9H5a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6M19.5 6.5a7.5 7.5 0 0 1 0 11"/>',
+    'r-access': '<path d="M15 7a4 4 0 1 1-3.9 5H8v2H6v2H3v-3l8.1-8.1A4 4 0 0 1 15 7zM16 10.5h.01"/>',
+    'r-analytics': '<path d="M3 17l4-6 4 3 4-7 3 4M3 21h18"/>',
+    'r-history': '<path d="M3 12a9 9 0 1 0 2.64-6.36L3 8M3 3v5h5M12 7v5l3 2"/>',
+    'r-review': '<path d="M4 6h16M4 12h10M4 18h7M15 17l2.5 2.5L22 15"/>',
     'layers':       '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 7.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m6.08 10.5-3.5 1.6a1 1 0 0 0 0 1.81l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59"/><path d="m6.08 15.5-3.5 1.6a1 1 0 0 0 0 1.81l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-3.5-1.59"/>'};
 
+PATHS['b2-fold'] = '<path d="M12 22v-6M12 8V2M4 12H2M10 12H8M16 12h-2M22 12h-2m-5 7-3-3-3 3m6-14-3 3-3-3"/>';
+PATHS['b2-unfold'] = '<path d="M12 22v-6M12 8V2M4 12H2M10 12H8M16 12h-2M22 12h-2m-5 7-3 3-3-3m6-14-3-3-3 3"/>';
 export const ICON_NAMES = Object.keys(PATHS);
 
 // 🔴 THE SPRITE IS INJECTED AT MODULE EVALUATION, not on DOMContentLoaded. `<use href="#i-…">` resolves against the document, and an element already in the DOM when its symbol arrives is not guaranteed to re-resolve — so waiting can leave icons permanently blank on a page whose markup rendered during parsing. documentElement always exists by the time a module body runs.
@@ -86,6 +132,9 @@ const FOLD_CLOSED = 'M6 9 L12 15 L18 9';
 const FOLD_OPEN = 'M6 15 L12 9 L18 15';
 
 export function Fold({ open, cls }) {
+    // BOARD: pin 5 asks for board 2's fold marks, which do not collide with the sort chevrons. A1's
+    // fixed state swaps them in everywhere a fold control is drawn.
+    if (useB3('a1') === 'fixed') return html`<${Icon} name=${open ? 'b2-fold' : 'b2-unfold'} cls=${'ic-fold' + (cls ? ' ' + cls : '')} />`;
     return html`
         <svg class=${'ic ic-fold' + (open ? ' open' : '') + (cls ? ' ' + cls : '')}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
```


## `portal/ui/manifest.js`

```diff
diff --git a/portal/ui/manifest.js b/local/pins2-board-3/redo/ui/manifest.js
index 467a2f2b..512b5bc3 100644
--- a/portal/ui/manifest.js
+++ b/local/pins2-board-3/redo/ui/manifest.js
@@ -6,6 +6,7 @@ import { html } from '../vendor/htm-preact.mjs';
 import { useState, useMemo, useEffect } from '../vendor/preact-hooks.mjs';
 import { stageAndCommit } from './composeClient.js';
 import { Icon } from './icons.js';
+import { b3, useB3, hooks } from '../b3/state.js';
 
 // `filterGroups` is [{key, label, options:[{value,label}]}]. One CHIP PER GROUP that cycles through its own options, not one chip per option: 03-three-surfaces.html renders exactly two chips ("Type: all ×", "State: staged ×") for a table with five types and four states, so the chip shows the current value rather than enumerating every possible one. `all` is always the first option and is what the × returns to. The state pill's own class comes from the state VALUE, so a realm reporting 'scheduled' or 'expired' gets the right shape without this component learning its vocabulary. Anything unrecognised falls to the conflict shape, which is the safe default: an unknown state should look like something to look at, never like a confirmed live row. 🔴 EXPORTED, because a realm that needs to add something BESIDE the state (Season's outlives-the-season warning) used to supply its own `render` and lose the pill entirely — the column whose whole job is state, drawn as a bare word, on every row. ⚠️ `live` MAPS TO `saved`. The stylesheet fills `.stt.saved`; `.stt.live` has no rule, so the one column whose job is to carry state as a filled chip rendered as plain text on every live row. The stored value and the class are different vocabularies and this is where they meet. 🔴 FOUR OF THESE SIX EMITTED A CLASS NEITHER STYLESHEET DEFINES, AND TWO OF THE FOUR WERE REACHABLE. Measured 2026-09-01 from Broadcast's pass: `.stt.stag`, `.stt.sched`, `.stt.exp` and `.stt.conf` have ZERO rules in `portal/ui/app.css` AND zero in the design's — only `.stt.saved`, `.stt.staged` and `.stt.conflict` exist. `season.logic.js`'s `stateForElement` returns exactly live | staged | conflict, so every STAGED and every CONFLICT row on Season had been rendering its state chip with no shape at all — bare 9px mono text — against COMPANION §0.0's law that SHAPE carries state (solid live, dashed staged, hatched conflict). Same defect as Armory's `RANK_KEY` emitting `t-t3` against `.t-top3`, in the same component, and `portalReverseOrphans` carried it in its accepted-debt baseline for the same reason. ⚠️ `scheduled` and `expired` are UNREACHABLE today — Broadcast is the only realm with those states and it renders its own chip. They map the way Broadcast's own renderer maps them (anything not staged is solid), so the two vocabularies cannot drift apart if a realm ever does route them through here. ⚠️ `scheduled`/`expired` map to `saved` because Broadcast's own hand-rolled renderer does (anything not staged is solid) and they are unreachable through this component today. 🔴 A LATER SELF-REVIEW CAUGHT THE HAZARD IN THAT CHOICE: if a realm ever DOES route a scheduled row through here it renders a solid green SAVED chip, which claims a not-yet-live thing is live — a wrong render, worse than the no-shape defect this map was fixed to remove. The comment above already names the safe answer (*anything unrecognised falls to the conflict shape… an unknown state should look like something to look at, never like a confirmed live row*), so the two are listed explicitly and everything else falls there.
 const PILL = { live: 'saved', saved: 'saved', staged: 'staged', conflict: 'conflict' };
@@ -34,7 +35,9 @@ function FilterChips({ groups, filters, onChange }) {
     //
     // It is also the better control on its own merits, which is worth saying so nobody re-litigates it from taste: a cycling chip hides the vocabulary until you click it, gives no way to reach the third option except by passing through the second, and cannot show which values EXIST. A row of chips is the filter and the legend at once. 🔴 EACH GROUP IS ITS OWN WRAPPER NOW (plan pins batch 2 §10.4 C5 C6, 2026-09-15 00:07 EDT). The label and its chips sit in one inline group, and a second group follows behind one divider with 16px either side — so a toolbar reads as sets, and the label-to-control gap is one number on every realm. The group's own name still reaches the reader (pin pmtvr01ji: two identical All chips with nothing saying what either governs). A topic chip carries its swatch; a severity chip carries a four-bar meter (board 2 G11 row 4) whose lit count is the option's `bars`, in the option's `sv` ink.
     return groups.map((g) => {
-        const options = [{ value: 'all', label: 'All' }, ...g.options];
+        // All carries its count like every other chip (thread 835f9aa3) — the sum of the chips, which is the rows shown.
+        const total = g.options.length && g.options.every((o) => o.count != null) ? g.options.reduce((a, o) => a + o.count, 0) : null;
+        const options = [{ value: 'all', label: 'All', count: total }, ...g.options];
         const current = filters[g.key] || 'all';
         return html`<span class="mt-grp" key=${g.key} role="group" aria-label=${g.label || g.key}>
             ${g.label ? html`<span class="mlabel"><span>${g.label}</span></span>` : null}
@@ -43,7 +46,7 @@ function FilterChips({ groups, filters, onChange }) {
                     class=${'chip' + (g.topic && o.value !== 'all' ? ' topic' : '') + (o.bars ? ' lvchip' : '')}
                     style=${o.hex ? `--c:${o.hex}` : (o.sv ? `--sv:${o.sv}` : null)}
                     title=${o.value === 'all' ? `All ${String(g.label || '').toLowerCase()}` : `Only ${o.label}`}
-                    onClick=${() => onChange({ ...filters, [g.key]: o.value })}>${g.topic && o.value !== 'all' ? html`<i></i>` : null}${o.bars ? html`<span class="msev" data-n=${o.bars} aria-hidden="true"><i></i><i></i><i></i><i></i></span>` : null}${o.label}${o.count == null ? null : html` <em>${o.count}</em>`}</button>`)}
+                    onClick=${() => onChange({ ...filters, [g.key]: o.value })}>${g.topic && o.value !== 'all' ? html`<i></i>` : null}${o.bars ? html`<span class="msev" data-n=${o.bars} aria-hidden="true"><i></i><i></i><i></i><i></i></span>` : null}<span class="cl">${o.label}</span>${o.count == null ? null : html` <em>${o.count}</em>`}</button>`)}
         </span>`;
     });
 }
@@ -91,6 +94,7 @@ export function Manifest({ label = null, rows, columns, searchableFields, bulkAc
     onFiltersChange = null,
     // The inbound twin of onFiltersChange, for a realm whose OWN surface is a filter control -- Analytics' Alerts-by-level rows are buttons in the design that set the river to that level, and there was no way to drive these chips from outside. ⚠️ SHAPED SO IT CANNOT LOOP. The comment above records that reporting OUT was done from the click rather than an effect precisely to avoid a render loop, and an inbound effect reintroduces that hazard -- so this one is keyed on `seq` ALONE, a counter that only ever changes on a user action. The effect calls setFilters, the component re-renders, `seq` is unchanged, the effect does not run again. Keying it on the filters object instead would re-run on every render, which is the loop.
     filterSignal = null,
+    selectSignal = null,   // BOARD ONLY: {ids, seq} so a gate can show a selection without a click
     // The size of the collection this table is a view OF, when the realm narrowed it before handing it over.
     totalRows = null,
     // 🔴 THE ROWS ARE A WINDOW AND EVERY NUMBER BESIDE THEM WAS NOT. Analytics' river is the newest 100 of each of three collections; `totalRows` is all of them, all time. So the count read "2 of 1,307" under a filter -- a numerator drawn from a population the denominator does not describe -- and at the cap it read "100 of 100", which is indistinguishable from "you are seeing everything" and is the precise lie `totalRows` was added to prevent. A realm that hands over a WINDOW says so, and the line states the window instead of implying its absence. A realm that hands over a WINDOW says so, and the line then states three separate quantities instead of implying they are one: how many you can see, how big the window is, and how big the collection is. Left null, nothing changes. ⚠️ AND IT ALWAYS SAYS IT, NOT ONLY AT THE CAP -- the first version triggered on `rows.length >= pageCap`, which is the same lie one state over: an eleven-row window out of 1,323 reads "11 of 1,323" and invites the reader to scroll for the rest. The shape it lands on, `N shown · newest M of T`, is the design's own ("12 shown · 1323 recorded").
@@ -98,7 +102,7 @@ export function Manifest({ label = null, rows, columns, searchableFields, bulkAc
     // A line under the toolbar, which is where the design puts its own (armory.html's activeFilter sits in exactly this slot). A PROP rather than something a realm renders beside the Manifest, because any sibling element between the two panels breaks the .panel + .panel selector that gives the table its ground.
     caption = null,
     // 🔴 THE ONE OPTIONAL BODY PROP (plan pins batch 2 §10.4 Architecture, 2026-09-15 00:23 EDT). Armory's weapon groups cannot be column renderers, so a realm may render the body itself from the rows this component has already searched, filtered, sorted and marked selected. The Manifest keeps its tools row, search, chips, selection, bulk bar, sort persistence, empty states and SelectionBar; only Armory passes this, and every other realm renders exactly as before.
-    renderBody = null}) {
+    renderBody = null, renderSelection = null}) {
     const [query, setQuery] = useState('');
     const [filters, setFilters] = useState({});
     useEffect(() => { if (filterSignal && filterSignal.filters) setFilters(filterSignal.filters); }, [filterSignal && filterSignal.seq]);
@@ -117,6 +121,10 @@ export function Manifest({ label = null, rows, columns, searchableFields, bulkAc
         try { localStorage.setItem(sortKey, JSON.stringify(sort)); } catch { /* nothing to do; the sort still works for this visit */ }
     }, [sortKey, sort.column, sort.direction]);
     const [selected, setSelected] = useState(new Set());
+    useB3('p5');
+    const a1 = useB3('a1');
+    useEffect(() => { if (!realm) return undefined; hooks[`${realm}Select`] = (ids) => setSelected(new Set(ids)); return () => { delete hooks[`${realm}Select`]; }; });
+    useEffect(() => { if (selectSignal) setSelected(new Set(selectSignal.ids || [])); }, [selectSignal && selectSignal.seq]);
     const [editingCell, setEditingCell] = useState(null); // {rowId, columnKey} | null
     const [editValue, setEditValue] = useState('');
 
@@ -128,7 +136,13 @@ export function Manifest({ label = null, rows, columns, searchableFields, bulkAc
 
     // One function for the select-all, because the click path and the key path must not be two implementations of one act — that divergence is what let the keyboard path be missing entirely. Added 2026-09-04 22:43 EDT.
     const allShown = () => visible.length > 0 && visible.every((r) => selected.has(r.id));
-    const toggleAll = () => setSelected(allShown() ? new Set() : new Set(visible.map((r) => r.id)));
+    // 🔴 A [-] CLEARS, AND ONLY WHAT IT GOVERNS (Harkirat, 2026-09-18, thread 2aed701d): mixed used to select everything, and
+    // ticking replaced any selection made under another filter. Now any shown selection clears the SHOWN ones; none selects them,
+    // added to whatever else is selected.
+    const toggleAll = () => {
+        const ids = visible.map((r) => r.id);
+        setSelected(ids.some((id) => selected.has(id)) ? new Set([...selected].filter((id) => !ids.includes(id))) : new Set([...selected, ...ids]));
+    };
 
     async function commitEdit(row, columnKey) {
         const op = buildEditOp(row, columnKey, editValue);
@@ -172,7 +186,7 @@ export function Manifest({ label = null, rows, columns, searchableFields, bulkAc
                         <input id="manifest-search" class=${query ? 'has-hits' : ''} value=${query} placeholder=${searchPlaceholder || 'Search…'} onInput=${(e) => setQuery(e.target.value)} />
                         ${query ? html`<span class="mhits" aria-live="polite">${visible.length.toLocaleString()} ${visible.length === 1 ? 'match' : 'matches'}</span>` : null}
                     </span>
-                    ${onAdd ? html`<button class="chip go madd" onClick=${onAdd}><${Icon} name="plus" />${String(addLabel).replace(/^\+\s*/, '')}</button>` : null}
+                    ${onAdd ? html`<button class="pill lead madd" onClick=${onAdd}><${Icon} name="plus" />${String(addLabel).replace(/^\+\s*/, '')}</button>` : null}
                 </div>
                 ${filterGroups.length || extraChips ? html`<div class="mt-r2">
                     ${filterGroups.length ? html`<${FilterChips} groups=${filterGroups} filters=${filters}
@@ -361,7 +375,7 @@ export function Manifest({ label = null, rows, columns, searchableFields, bulkAc
                  one here on Season — a name, a type, two dates and a button — as the fast path beside the
                  composer above, and the portal had only the composer. -->
             ${footRow || null}
-            ${selected.size && bulkActions.length ? html`
+            ${selected.size && renderSelection && b3('p5') !== 'now' ? renderSelection({ ids: [...selected], clear: () => setSelected(new Set()), setMany: (ids, on) => setSelected(setSelection(selected, ids, on)) }) : selected.size && bulkActions.length ? html`
                 <${SelectionBar} count=${selected.size} noun=${rowNoun} tier=${bulkTier}
                                  badge=${bulkNote} summary=${selectionSummary()}
                                  onClear=${() => setSelected(new Set())}
```


## `portal/ui/overlay.js`

```diff
diff --git a/portal/ui/overlay.js b/local/pins2-board-3/redo/ui/overlay.js
index 0a15c532..e915b8ff 100644
--- a/portal/ui/overlay.js
+++ b/local/pins2-board-3/redo/ui/overlay.js
@@ -8,7 +8,7 @@ import { html } from '../vendor/htm-preact.mjs';
 import { useEffect, useRef, useState } from '../vendor/preact-hooks.mjs';
 import { Icon } from './icons.js';
 
-export function Drawer({ eyebrow, title, children, actions, wide, side, onClose }) {
+export function Drawer({ eyebrow, title, children, actions, wide, side, onClose, onBack = null }) {
     const ref = useRef(null);
     // Which regions the dialog takes out of the page. Resolved on every pass rather than captured once: Preact re-renders the Shell when the overlay slot changes, and an attribute written to a node that has since been replaced is an attribute on nothing.
     const shellRegions = () => [
@@ -71,7 +71,12 @@ export function Drawer({ eyebrow, title, children, actions, wide, side, onClose
                      inherits metrics nothing here controls, and reference_never_text_glyphs_for_icons is a standing
                      rule while that argument is an inline comment. Kept with shell.js's crumb separator: the two are
                      one rule, and resolving them differently leaves the console with two habits instead. -->
-                <button class="x" aria-label="Close" onClick=${onClose}><${Icon} name="x" cls="sm" /></button>
+                <!-- Board 3-D round 5a (2026-09-18): Back and Close are one pair of icon buttons that say their word on hover
+                     or keyboard focus, the manifest fold's pattern. Back renders only when the drawer has a step to go back to. -->
+                <div class="dw-nav">
+                    ${onBack ? html`<button class="x bk" aria-label="Back" onClick=${onBack}><${Icon} name="chevron-left" cls="sm" /><b aria-hidden="true">Back</b></button>` : null}
+                    <button class="x" aria-label="Close" onClick=${onClose}><${Icon} name="x" cls="sm" /><b aria-hidden="true">Close</b></button>
+                </div>
             </header>
             <div class="dw-b">${children}</div>
             ${actions ? html`<footer class="dw-f">${actions}</footer>` : null}
```


## `portal/ui/shell.js`

```diff
diff --git a/portal/ui/shell.js b/local/pins2-board-3/redo/ui/shell.js
index 9ca5070a..a1c2e2dc 100644
--- a/portal/ui/shell.js
+++ b/local/pins2-board-3/redo/ui/shell.js
@@ -9,6 +9,8 @@ import { useAvatarTint } from './avatarTint.js';
 import { Icon } from './icons.js';
 import { useState, useEffect, useRef } from '../vendor/preact-hooks.mjs';
 import { CommandBar } from './palette.js';
+import { useB3 } from '../b3/state.js';
+import { B3CommandBar } from '../b3/palette.js';
 import { useOverlay } from './overlay.js';
 import { ExportStrip, ExportDrawer } from './exportPanel.js';
 import { StagedTray } from './tray.js';
@@ -360,11 +362,12 @@ function Account({ session, staged, onSignOut, chrome }) {
 //
 // ⚠️ The commit chip is ABSENT at zero rather than reading "0 staged". A chip that is always there is a permanent third copy of the tray and the rail badge; one that appears only when there is something to act on is the same fact at the moment it becomes actionable.
 function Header({ realm, view, session, staged, commands, onSignOut, chrome }) {
+    const p7 = useB3('p7');
     return html`
         <header id="hdr">
             <button class="mk" title="Home" onClick=${() => { location.hash = '#/home'; }}><span class="glyph"></span>DIOREO<b>/</b>PORTAL</button>
             <span class="sp"></span>
-            <${CommandBar} commands=${commands} realmLabel=${realm === 'home' ? null : realmLabelOf(realm)} />
+            ${p7 !== 'now' ? html`<${B3CommandBar} commands=${commands} realmLabel=${realm === 'home' ? null : realmLabelOf(realm)} />` : html`<${CommandBar} commands=${commands} realmLabel=${realm === 'home' ? null : realmLabelOf(realm)} />`}
             <span class="sp"></span>
             ${staged ? html`
                 <a class="hdr-commit" href="#/review"><b>${staged}</b>${' '}<span>staged · review</span></a>` : null}
@@ -592,7 +595,7 @@ export function Shell({ realm, session, view, viewOptions, onSetView, viewSlot,
                             ${viewOptions.length > 1 ? html`
                                 <div class="seg" role="tablist" aria-label="View">
                                     ${viewOptions.map((v) => html`
-                                        <button role="tab" aria-selected=${v === view ? 'true' : 'false'} onClick=${() => onSetView(v)}>${v}${viewCounts && viewCounts[v] != null ? html`${' '}<em class="segn">${viewCounts[v]}</em>` : null}</button>`)}
+                                        <button role="tab" aria-selected=${v === view ? 'true' : 'false'} onClick=${() => onSetView(v)}>${v}${viewCounts && viewCounts[v] != null ? (typeof viewCounts[v] === 'object' ? html`${' '}<em class=${'b3-segst ' + viewCounts[v].tone}><${Icon} name=${viewCounts[v].tone === 'ok' ? 'check' : 'triangle-alert'} />${viewCounts[v].text}</em>` : html`${' '}<em class="segn">${viewCounts[v]}</em>`) : null}</button>`)}
                                 </div>` : null}
                             <!-- ⚠️ ORDER IS THE DESIGN'S, AND IT WAS WRONG. The bar reads title · views · the
                                  view's own controls · what the marks mean · where you are — so the Track's zoom
```


## `app.css` — against `portal/public/app.css`

```diff
diff --git a/portal/public/app.css b/local/pins2-board-3/redo/app.css
index 85107e32..ed9e4e3c 100644
--- a/portal/public/app.css
+++ b/local/pins2-board-3/redo/app.css
@@ -440,5 +440,16 @@ button {
     transition: background .12s ease, border-color .12s ease, color .12s ease;
 }
-button:hover:not(:disabled) { background: var(--rule); border-color: var(--ink3); }
+/* 🔴 ROUND 10G (2026-09-20 12:18 EDT) — THE GREY WASH ON EVERY HOVER, AND ITS THIRD SIGHTING.
+   "you claimed to have fixed the hover tints but they're literally still grey wash." Measured: hovering History's
+   Restarts chip paints `rgb(42,52,61)` — #2A343D, which is `--rule` — while the ring beside it is the chip's own
+   violet at 45%. Half the rule applied and half did not, because this line is `button:hover:not(:disabled)`: an
+   ELEMENT selector carrying two pseudo-classes, (0,2,1), which outranks every `.control:hover` in the kit at (0,2,0).
+   So a classed control's own hover background loses to this one, always, everywhere — `.b3-fc`, `.b3-btn2`, `.pill`,
+   `.chip`, every one of them — and only rules that happen to sit at (0,3,0) or higher, like `[aria-pressed=true]`,
+   ever showed their hue. That is why the PRESSED tint worked and the HOVER tint did not.
+   ⚠️ THIS IS THE SAME LINE gates.css:261 ALREADY DOCUMENTS, and the previous round answered it for a NAMED LIST of
+   six controls instead of at the source — so it came back on the seventh. A classed control owns its own states;
+   this rule is for a button nobody has styled, and it now says so. */
+button:is(:not([class]),[class=""]):hover:not(:disabled) { background: var(--rule); border-color: var(--ink3); }
 input:hover:not(:disabled), select:hover:not(:disabled), textarea:hover:not(:disabled) { border-color: var(--ink3); }
 input:disabled, select:disabled, textarea:disabled, button:disabled {
@@ -5247,6 +5258,13 @@ body.has-selbar .tray{transform:translateY(-78px);transition:transform var(--dur
 .exs-i.done .exs-t b::after{content:" ✓";color:var(--ok)}
 .exs-t{flex:1 1 200px;min-width:0}
-.exs-t b{font:600 var(--t-base)/1.35 var(--ui);color:var(--ink);display:block}
-.exs-t span{font-size:var(--t-sm);color:var(--ink3)}
+.exs-t b{font:600 var(--t-lg)/1.35 var(--ui);color:var(--ink);display:block}
+/* 2026-09-20 22:26 EDT — A DESCENDANT SELECTOR REACHED INSIDE A COMPONENT IT KNOWS NOTHING ABOUT.
+   This was written for the row's own subtitle span and it is a descendant, not a child, so the
+   moment the landing's filename became the picker's rename chip it also restyled that chip's
+   .b3-xf-nm and .b3-xf-ext — a direct font-size beats the button's inherited one, so the text
+   drew at --t-sm where the same chip in the export list draws at --t-xs. The colour survived
+   only because the tint rule is four classes deep. One character fixes it: the rule means the
+   row's own span, and says so now. */
+.exs-t > span{font-size:var(--t-sm);color:var(--ink3)}
 .exs-c{font:500 var(--t-sm)/1 var(--data);color:var(--ink2);white-space:nowrap}
 .exs-c em{font-style:normal;color:var(--ink3);font-size:var(--t-xs);letter-spacing:.08em;text-transform:uppercase}
```

### Where each removed line lives in the SOURCE

| line the kit replaced | in `portal/ui/app.css` |
|---|---|
| `button:hover:not(:disabled) { background: var(--rule); border-color: var(--ink3); }` | **not in portal/ui/app.css** — it came from `tokens.css` or `v2card.css`, which the build concatenates |
| `.exs-t b{font:600 var(--t-base)/1.35 var(--ui);color:var(--ink);display:block}` | `portal/ui/app.css:4671` |
| `.exs-t span{font-size:var(--t-sm);color:var(--ink3)}` | `portal/ui/app.css:4672` |
