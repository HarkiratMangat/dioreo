---
kind: reference
status: live
---

# Board 4: Collective — the exact changes to PORTAL code

*Generated 2026-09-30T02:48:12.281Z by `maps.cjs` from `docs/pins2/kit/` at repo commit `bd5463b1 plus the working tree`. The kit's copies of portal files (`ui/*.js` against `portal/ui/`, `app.css` against the built `portal/public/app.css`), as unified diffs: 10 files differ. Board chrome copies (`ui/app.js`, `ui/httpClient.js`, `ui/conform.js`) are left out — applying them would break the portal (Board 3-E's file-map). A `useB3()` branch collapses to the arm the board holds (`switches.md`).*

## `app.css` → `portal/public/app.css`

```diff
diff --git aportal/public/app.css bkit/app.css
index 85107e32..8c47c2ea 100644
--- aportal/public/app.css	
+++ bkit/app.css	
@@ -439,7 +439,18 @@ button {
     cursor: pointer;
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
     opacity: .45;
@@ -1111,7 +1122,7 @@ main{overflow:auto;padding-bottom:140px}
 .wg-cb[aria-checked=mixed] .cb{background:color-mix(in srgb,var(--patch) 40%,var(--sunk));border-color:var(--patch)}
 .wg-line{display:flex;align-items:center;min-width:0;gap:var(--s3)}
 .wg-line b{font:600 var(--t-md)/1 var(--ui);letter-spacing:.005em;color:var(--ink);white-space:nowrap}
-.wg-line small{font:600 var(--t-micro)/1 var(--data);letter-spacing:.16em;text-transform:uppercase;color:var(--c);white-space:nowrap}
+.wg-line small,.f-menu .f-om{font:600 var(--t-micro)/1 var(--data);letter-spacing:.16em;text-transform:uppercase;color:var(--c);white-space:nowrap}
 .wg-nb{font-style:normal;letter-spacing:.14em;color:var(--ink3)}
 .wg-nb::before{content:"";display:inline-block;width:3px;height:3px;margin:0 9px 2px;border-radius:var(--rad-round);background:var(--ink4)}
 .wg-tags{display:flex;align-items:center;gap:6px;min-height:22px;padding-left:var(--s4);margin-left:var(--s2);box-shadow:inset 1px 0 0 var(--rule2)}
@@ -1163,7 +1174,7 @@ main{overflow:auto;padding-bottom:140px}
 .wg-plate span{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
 .wg-rail{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-width:0}
 .wg-at{display:inline-flex;align-items:center;min-width:0;height:28px;padding:0 10px;border-radius:var(--rad-2);background:linear-gradient(180deg,color-mix(in srgb,var(--ink) 4%,var(--sunk)),var(--sunk));box-shadow:inset 0 0 0 1px var(--rule2),inset 0 1px 0 color-mix(in srgb,var(--ink) 6%,transparent);font:500 var(--t-sm)/1 var(--ui);color:var(--ink);white-space:nowrap}
-.wg-at[style]{background:color-mix(in srgb,var(--sl) 11%,var(--sunk));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sl) 30%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 14%,transparent)}
+.wg-at[style],.b4 .cx-same .cx-sv.wg-at{background:color-mix(in srgb,var(--sl) 11%,var(--sunk));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sl) 30%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 14%,transparent)}
 .wg-r:hover .wg-at[style]{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--sl) 48%,transparent),inset 0 1px 0 color-mix(in srgb,var(--sl) 20%,transparent)}
 .wg-at.gap{background:none;box-shadow:none;outline:1px dashed color-mix(in srgb,var(--warn) 55%,transparent);outline-offset:-1px;color:var(--warn-ink)}
 .wg-im{display:grid;place-items:center;width:28px;height:28px;color:color-mix(in srgb,var(--ok) 80%,var(--ink3))}
@@ -5246,8 +5257,15 @@ body.has-selbar .tray{transform:translateY(-78px);transition:transform var(--dur
 .exs-i.done{border-color:color-mix(in srgb,var(--ok) 42%,transparent)}
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

## `ui/armory.js` → `portal/ui/armory.js`

```diff
diff --git aportal/ui/armory.js bkit/ui/armory.js
index fe9fc32d..1c7f7805 100644
--- aportal/ui/armory.js	
+++ bkit/ui/armory.js	
@@ -14,8 +14,14 @@ import { renderV2 } from './v2Render.js';
 import { useOverlay, Drawer } from './overlay.js';
 import { reportFailure } from './async.js';
 import { downloadText } from './download.js';
-
-const MODES = ['MP', 'DMZ'];
+// Board 3 v2 — the proposals, mounted into the real Armory.
+import { useB3, hooks } from '../b3/state.js';
+import { B3Badges, ProblemChip, SelectAllBox, SelectionDock, MODE_ICON } from '../b3/armory-parts.js';
+import { modesOf } from '../b4/bulkformat.js';
+import { B3BuildDrawer } from '../b3/drawer.js';
+import { RepairsPanel, repairsStatus } from '../b3/repairs.js';
+
+export const MODES = ['MP', 'DMZ'];
 const CATEGORIES = ['AR', 'SMG', 'SNIPER', 'LMG', 'SHOTGUN', 'MARKSMAN', 'SECONDARIES', 'MELEE'];
 
 // 🔴 THE MANIFEST NAMED EVERY BUILD AND SHOWED WHAT WAS IN NONE OF THEM. Weapon, build, category, mode and a comma-joined list of defect keys — so the one question you open a build list to answer, *what does this build actually run*, needed a click per row. The attachments peek and the badge chips are what the adopted table was styled for.
@@ -23,7 +29,7 @@ const CATEGORIES = ['AR', 'SMG', 'SNIPER', 'LMG', 'SHOTGUN', 'MARKSMAN', 'SECOND
 // ⚠️ THE PEEK SHOWS TWO AND COUNTS THE REST. Five attachment names is a paragraph in a table cell; two plus "+3" is the shape of the thing, and the editor is one click away for the rest.
 //
 // ⚠️ CATEGORY_CHIP_LABEL / CATEGORY_CHIP_ORDER LIVE IN armory.logic.js NOW, as bare globals the same way DMZ_RANGE_TOKENS always has — they are read by rackCategories(), which is arithmetic over the build list and therefore belongs somewhere a test can reach without a browser. They are still distinct from CATEGORY_LABEL below, which is verbose on purpose for the edit form's dropdown.
-const ARMORY_COLUMNS = [
+export const ARMORY_COLUMNS = [
     { key: 'weaponName', label: 'Weapon', editable: true,
       meta: (r) => `${r.mode} · ${(r.attachments || []).length} attachment${(r.attachments || []).length === 1 ? '' : 's'}` },
     // 🔴 CATEGORY BEFORE BUILD, which is armory.html's own order (Weapon · Category · Build · …). The portal had them the other way round, and the audit reported it as a SYMMETRIC pair — Category→Build and Build→Category — which §0.7c's own rule classifies as a pairing artifact. It was not one: a genuine column swap is exactly what a real reorder looks like to an LCS alignment. Caught only by opening the two captures and reading the header row. The rule needs the boundary: symmetry is evidence of an artifact ONLY when the two elements are interchangeable; two NAMED columns are not. 🔴 THIS COLUMN PRINTED THE STORED ENUM — "AR", "SNIPER", "SECONDARIES" — while a filter chip 200px above it read "Assault 35". One field, two vocabularies, one screen. armory.html prints the label. `editable` comes OFF with the fix and that is deliberate rather than a loss: a free-text cell over an enum could write "Assault" into a field whose only legal values are the keys, and display-vs-edit would have disagreed the moment the label rendered. Category is edited where it has always had a real control — the row editor's own <select>, one click away.
@@ -53,17 +59,19 @@ const ARMORY_COLUMNS = [
         if (r.categoryRank) chips.push(html`<b class="bdg rank" key="r">${String(r.categoryRank).toUpperCase()}</b>`);
         if (r.dmzRangeRank) chips.push(html`<b class="bdg dmz" key="d">${r.dmzRangeRank}</b>`);
         if (r.isToxic) chips.push(html`<b class="bdg toxic" key="t">TOXIC</b>`);
+        if (r.isAss) chips.push(html`<b class="bdg ass" key="a">ASS</b>`);
+        if (r.mode !== 'DMZ' && (r.rankModes || []).length) chips.push(html`<b class="bdg mode" key="rm">${r.rankModes.join(' | ')}</b>`);
         if (faults.length) chips.push(html`<b class="bdg bad" key="f" data-tip=${`${faults.length} problem${faults.length === 1 ? '' : 's'}\n${faults.map((f) => COVERAGE_LABEL[f] || f).join(' · ')}`}>${faults.length}<${Icon} name="triangle-alert" cls="sm" /></b>`);
         return chips.length ? html`<span class="tiers">${chips}</span>` : html`<span class="none">—</span>`;
     } },
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
@@ -85,13 +93,14 @@ function weaponTags(b) {
     if (b.mode === 'DMZ' && b.dmzRangeRank) tags.push({ t: 'dmz', label: String(b.dmzRangeRank).replace(/-/g, ' ').toUpperCase() });
     if (b.isMeta) tags.push({ t: 'meta', label: 'META' });
     if (b.isToxic) tags.push({ t: 'toxic', label: 'TOXIC' });
+    if (b.isAss) tags.push({ t: 'ass', label: 'ASS' });
     return tags;
 }
 function copyToClipboard(text) {
     try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch { /* a blocked clipboard leaves the flash unshown, never an error */ }
 }
 
-function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, onCollapseAll }) {
+export function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, onCollapseAll }) {
     const { visible, selected, sort, setSort, onRowClick, selectedRowId, onRemove, stateOf, toggle, setMany } = api;
     const [flash, setFlash] = useState(null);
     const [openFix, setOpenFix] = useState(null);
@@ -108,11 +117,12 @@ function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, on
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
@@ -127,12 +137,12 @@ function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, on
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
+                        <div class="wg-line"><b>${g.name}</b><small>${CATEGORY_CHIP_LABEL[first.category] || first.category}${(typeof window !== 'undefined' && window.B4_COLLECTIVE) ? null : html`<em class="wg-nb">${g.builds.length} build${g.builds.length === 1 ? '' : 's'}</em>`}</small>${(typeof window !== 'undefined' && window.B4_COLLECTIVE) ? html`<em class="wg-nb b3-sd-gn">${g.builds.length} build${g.builds.length === 1 ? '' : 's'}</em>` : null}${p1 !== 'now' ? html`<${B3Badges} b=${first} />` : tags.length ? html`<span class="wg-tags">${tags.map((t) => html`<span class="wg-tag" data-t=${t.t} key=${t.t}>${t.label}</span>`)}</span>` : null}</div>
+                        ${faulty.length && p3 !== 'now' ? html`<${ProblemChip} weapon=${g.name} faulty=${faulty} builds=${builds} onOpen=${(b) => onRowClick(b)} />` : faulty.length ? html`<span class="wg-fwrap" onClick=${(e) => e.stopPropagation()}>
                             <button type="button" class="wg-fsum" aria-expanded=${openFix === g.name ? 'true' : 'false'} onClick=${() => setOpenFix(openFix === g.name ? null : g.name)}><${Icon} name="triangle-alert" />${faulty.length === 1 ? 'Fix build' : 'Fix builds'}<span class="wg-fnos">${faulty.map((x) => html`<i key=${x.n}>${x.n}</i>`)}</span></button>
                             <span class="wg-fpop" role="tooltip">${faulty.map((x) => html`<span class="wg-fpr" key=${x.n}><i>${x.n}</i><span>${x.f.map((f) => html`<span key=${f}>${FAULT_TEXT[f](x.b)}</span>`)}</span></span>`)}</span>
                         </span>` : html`<span></span>`}
@@ -148,6 +158,8 @@ function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, on
                         const atts = orderedAttachments(b);
                         const empties = (b.attachments || []).length <= 2 ? Math.max(0, 5 - atts.length) : 0;
                         const codeBad = (b.coverage || []).includes('code-length-mismatch');
+                        // 2026-09-19 10:26 EDT: the attachments past the code's last pair are the ones it does not carry (his thread on JAK-12 build 1).
+                        const pairs = codeBad ? Math.floor(String(b.shareCode || '').length / 2) : Infinity;
                         return html`
                         <div key=${b.id} class=${'wg-r' + (f.length ? ' bad' : '') + (stateOf(b) === 'staged' ? ' staged' : '') + (sel ? ' sel' : '') + (open ? ' open' : '') + (dmz ? ' dmz' : '')}
                              tabIndex="0" onClick=${() => onRowClick(b)} onKeyDown=${keyAct(() => onRowClick(b))}>
@@ -158,16 +170,16 @@ function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, on
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
                                 ? html`<button type="button" class="wg-code" aria-label=${`Copy gunsmith code ${b.shareCode}`} onClick=${(e) => { e.stopPropagation(); copy(b.id + ':code', copyCodeText(b)); }}><span class="wg-ig"><span class="wg-igf"><span class=${'wg-ct' + (codeBad ? ' bad' : '')} title=${codeBad ? FAULT_TEXT['code-length-mismatch'](b) : null}>${b.shareCode}</span></span><span class="wg-igb"><${Icon} name=${flash === b.id + ':code' ? 'check' : 'copy'} /></span></span></button>`
                                 : html`<span class="wg-ig none"><span class="wg-cnone"><${Icon} name="triangle-alert" />No code</span></span>`}
                             <div class="wg-acts" onClick=${(e) => e.stopPropagation()}>
-                                <button type="button" class="wg-ib" aria-label="Copy share command" data-tip="Copy share command" onClick=${() => copy(b.id + ':share', shareCommandText(b, n))}><${Icon} name=${flash === b.id + ':share' ? 'check' : 'share-2'} /></button>
+                                <button type="button" class=${'wg-ib wg-share' + (flash === b.id + ':share' ? ' is-done' : '')} aria-label="Copy share command" data-tip="Copy share command" onClick=${() => copy(b.id + ':share', shareCommandText(b, n))}><${Icon} name=${flash === b.id + ':share' ? 'check' : 'share-2'} /></button>
                                 <i class="wg-vr" aria-hidden="true"></i>
                                 <button type="button" class="wg-ib wg-del" aria-label=${`Stage deletion of ${b.weaponName} build ${n}`} onClick=${() => onRemove(b)}><${Icon} name="trash-2" /></button>
                             </div>
@@ -179,7 +191,7 @@ function ArmoryGroups({ api, builds, mode, attView, collapsed, onToggleGroup, on
 }
 
 // 🔴 'no-badges' and 'wrong-attachment-count' RETIRED 2026-09-13 17:36 EDT (pins batch 2, pin pmtylf7gz) -- see portal/api/armory.js's coverageFlags for why neither was a real defect. 'few-attachments' and 'code-length-mismatch' are their replacements, not renames: the flag KEYS changed, not just the label text.
-const COVERAGE_LABEL = {
+export const COVERAGE_LABEL = {
     'missing-image': 'Missing image', 'few-attachments': '2 or fewer attachments',
     'stale-90d': 'Not updated in 90 days', 'near-duplicate': 'Near-duplicate code',
     'no-code': 'No gunsmith code', 'code-length-mismatch': 'Code length doesn’t match attachments',
@@ -203,7 +215,7 @@ export function splitCoverage(b) {
 }
 
 // ⚠️ BOTH NOTES READ FROM THE SAME DERIVATION THE MASTHEAD DOES, so a panel and the figures above it cannot disagree -- the failure this realm has already had twice. Each says what its own view is for and nothing the masthead has already said.
-function RackNote({ builds }) {
+export function RackNote({ builds }) {
     const ranked = builds.filter((b) => b.categoryRank || b.dmzRangeRank).length;
     return html`<span class="rt">${ranked} of ${builds.length} ranked</span>`;
 }
@@ -289,6 +301,7 @@ function Rack({ builds, onPick, onAdd, onEdit }) {
         setCOpen(next);
     };
     const openCount = cats.filter((c) => copen.has(c.category)).length;
+    const e6 = useB3('e6');
 
     // An empty armory is not an error and it is not a table with no rows: it is a page whose only useful content is the way out of it, so it carries the button rather than describing one.
     if (!builds.length) {
@@ -309,7 +322,7 @@ function Rack({ builds, onPick, onAdd, onEdit }) {
             <div class="racktools">
                 <button class="chip" disabled=${openCount === cats.length} onClick=${() => setAll(true)}>Expand all</button>
                 <button class="chip" disabled=${openCount === 0} onClick=${() => setAll(false)}>Collapse all</button>
-                <span class="rkt-n">${cats.length} categories · ${builds.length} builds · ${openCount === 0 ? 'all closed — open the one you came for' : openCount + ' open'}</span>
+                ${e6 !== 'now' ? html`<span class="rkt-n b3-facts"><span class="b3-fact"><${Icon} name="layers" /><b>${cats.length}</b> categories</span><span class="b3-fact"><b>${builds.length}</b> builds</span><span class="b3-fact"><${Icon} name="chevrons-down-up" />${openCount === 0 ? 'all closed' : html`<b>${openCount}</b> open`}</span></span>` : html`<span class="rkt-n">${cats.length} categories · ${builds.length} builds · ${openCount === 0 ? 'all closed — open the one you came for' : openCount + ' open'}</span>`}
             </div>
             <div class="rack">
                 ${cats.map((c) => {
@@ -356,7 +369,7 @@ const COVERAGE_WHY = {
     'code-length-mismatch': 'A real code pairs two characters per attachment; this one’s length disagrees with its own build.',
 };
 
-function Coverage({ builds, active, onFilter }) {
+export function Coverage({ builds, active, onFilter }) {
     const flags = Object.keys(COVERAGE_LABEL);
     const total = Math.max(1, builds.length);
     const hitsFor = (f) => builds.filter((b) => (b.coverage || []).includes(f));
@@ -599,7 +612,7 @@ function AddBuildPanel({ f, setF, atts, setAtts, filledFromCode, builds, weaponN
         </div>`;
 }
 
-function BulkBadgesPanel({ ids, onApply, onCancel }) {
+export function BulkBadgesPanel({ ids, onApply, onCancel }) {
     const [badges, setBadges] = useState('');
     return html`
         <div style="display:flex;gap:8px;align-items:center;padding:10px 14px;border-top:1px dashed var(--rule)">
@@ -661,7 +674,7 @@ function BuildIssues({ build }) {
         </div>`;
 }
 
-function BuildEditor({ build, csrfToken, onStage, onClose }) {
+export function BuildEditor({ build, csrfToken, onStage, onClose }) {
     const [draft, setDraft] = useState({ ...build, attachments: [...(build.attachments || [])] });
     const [card, setCard] = useState(null);
     const [imgFailed, setImgFailed] = useState(false);
@@ -828,16 +841,31 @@ const COMPARE_FIELDS = [
 // 🔴 `.cmpcards` EXPECTED `.dcard` CHILDREN AND GOT BARE DIVS, so the column layout, the dividers and every rule under `.dcard.lc` styled nothing — twelve classes with rules and no markup. The card is the RECORD, laid out so two of them line up field for field: the attachment list is the thing you actually compare, and reading it out of two Discord renders means reading two pictures.
 //
 // ⚠️ THE DISCORD RENDER MOVED OUT OF COMPARE, not away. It lives in the build editor's own side column under "What Discord sends", where it sits beside the fields that produce it. Here it cost one request per picked build to show two images you cannot align, while the table below already reports every field that differs.
-function LoadoutCard({ build, siblings }) {
+function rankWord(b) {
+    const r = b.mode === 'DMZ' ? b.dmzRangeRank : b.categoryRank;
+    const m = /^(best|top(\d+)|capable)/.exec(String(r || ''));
+    if (!m) return null;
+    const head = m[1] === 'best' ? 'BEST' : m[1] === 'capable' ? 'CAPABLE' : `TOP ${m[2]}`;
+    if (b.mode !== 'DMZ') return `${head} ${b.category === 'SECONDARIES' ? 'SECONDARY' : b.category}`;
+    return `${head} ${r.includes('-close') ? 'CLOSE RANGE' : r.includes('-midlong') ? 'MID-LONG RANGE' : 'DMZ'}`;
+}
+
+export function LoadoutCard({ build, siblings }) {
     const b = build;
     const idx = siblings.findIndex((s) => String(s._id) === String(b._id)) + 1;
     const badges = [
         b.isMeta ? 'META' : null,
-        b.categoryRank ? String(b.categoryRank).toUpperCase() : null,
-        b.dmzRangeRank ? String(b.dmzRangeRank) : null,
+        // 2026-09-22 13:45 EDT — the rank reads as the bot writes it (utils/loadoutRender.js buildBadgesLine), never as the stored token: the DMZ
+        // preview printed a raw 'top5'. MP: Best / Top N plus the category; DMZ: plus Close Range, Mid-Long Range or DMZ.
+        rankWord(b),
         b.isToxic ? 'TOXIC' : null,
+        b.isAss ? 'ASS' : null,
     ].filter(Boolean);
-    const code = b.mode !== 'DMZ' && (b.shareCode || b.buildName);
+    // 2026-09-21 14:37 EDT — THE BUILD NAME NEVER STANDS IN FOR THE CODE (ledger: "A missing gunsmith code"). It did here, so typing a Label in the
+    // New build drawer wrote into the preview's Gunsmith Code. MP without a code says so; DMZ has no code slot at all.
+    // 2026-09-25 23:19 EDT (his 23:12 EDT, the Modes family): the bot prints the family as its own line, "Recommended Rank Mode: HP | S&D", each name after its mark (his SVGs become the bot's emoji)
+    const modes = modesOf(b);
+    const code = b.mode !== 'DMZ' ? (b.shareCode || null) : null;
     const [failed, setFailed] = useState(false);
     const atts = b.attachments || [];
     const slots = b.attachmentSlots || [];
@@ -845,16 +873,17 @@ function LoadoutCard({ build, siblings }) {
     return html`
         <div class="dcard lc" style=${`--c:${b.accent || 'var(--r-armory)'}`}>
             <h6 role="heading" aria-level="3">${b.weaponName}</h6>
-            ${badges.length ? html`<div class="lc-badges">${badges.map((x) => html`<span key=${x}>${x}</span>`)}</div>` : null}
+            ${badges.length ? html`<div class="lc-badges">${badges.map((x) => html`<span key=${x} data-k=${x === 'META' ? 'meta' : x === 'TOXIC' ? 'toxic' : x === 'ASS' ? 'ass' : /^CAPABLE/i.test(x) ? 'capable' : /^BEST/i.test(x) ? 'best' : /^TOP\s*(\d)/i.test(x) ? `top${/^TOP\s*(\d)/i.exec(x)[1]}` : 'tier'}>${x}</span>`)}</div>` : null}
+            ${modes.length ? html`<div class="lc-modes"><b>Recommended Rank Mode:</b>${modes.map((m, i) => html`${i ? html`<i aria-hidden="true">|</i>` : null}<span key=${m} data-m=${m}><${Icon} name=${MODE_ICON[m]} />${m}</span>`)}</div>` : null}
             <div class="lc-rule"></div>
             ${b.description ? html`<blockquote class="lc-desc">${b.description}</blockquote>` : null}
             <div class="lc-h">Attachments</div>
             <ul class="lc-att">
                 ${atts.length
-                    ? atts.map((a, i) => html`<li key=${i}><code>${a}</code>${slots[i] ? html`<em>${slots[i]}</em>` : null}</li>`)
+                    ? atts.map((a, i) => html`<li key=${i} style=${slots[i] ? `--sl:${slotVar(slots[i])}` : null}><code>${a}</code>${slots[i] ? html`<em>${slots[i]}</em>` : null}</li>`)
                     : html`<li class="none">none recorded</li>`}
             </ul>
-            ${code ? html`<div class="lc-h">Gunsmith Code</div><div class="lc-code">${code}</div>` : null}
+            ${b.mode !== 'DMZ' ? html`<div class="lc-h">Gunsmith Code</div><div class=${'lc-code' + (code ? '' : ' none')}>${code || 'no code'}</div>` : null}
             ${b.imageKey && b.imageUrl
                 ? html`
                     <div class=${'lc-img' + (failed ? ' failed' : '')}>
@@ -915,9 +944,14 @@ function WeaponSearch({ options, picked, roomLeft, onPick }) {
 }
 
 // ⚠️ THE SAME ROWS ARE DRAWN WHETHER THEY MATCH OR NOT. Showing only the differences would be shorter and would answer a different question: "these two are identical apart from the image" is a conclusion you can only reach by seeing the fields that agree. `.cmptab tr.same` is the adopted sheet's own class for exactly that. 2026-09-11 09:15 EDT -- every build of both picked weapons used to auto-fill the columns; Harkirat, direct: "what if i only want to compare AK117 build 1 vs AS VAL build 2? why does it force load both AS VAL builds?" Picking a WEAPON and picking WHICH of its builds are two different acts, so a weapon with more than one build now gets its own row of toggle chips -- the same `.chip` control already used to remove a whole weapon, one level down. Unchecked means excluded, not deleted. 🔴 COMPARE AS THE DESIGN BOARD DRAWS IT (plan pins batch 2 §10.2, G10 answered 2026-09-14 01:18 EDT; built 2026-09-15 08:37 EDT). One row per attachment SLOT in Harkirat's display order, never one comma-joined cell — two builds that differ by one attachment could not be told apart. The first column is the baseline, tinted and headed so; a value that differs from it is raised with a --patch ring and carries a visually hidden "differs" (colour is never the only signal); a slot the baseline has and a build lacks is a dashed Not equipped cell; a slot neither uses is a dash. Fields identical on every shown build fold into one "Same on all N" row. The table comes first and the Discord cards wait behind Show cards, closed on every open (Harkirat, 2026-09-13 20:52 EDT). Two weapons split the six columns between them rather than the first filling them, and a build that did not fit says so on its own chip.
-function Compare({ builds, weapons, onSetWeapons, onOpenRack, onAdd }) {
+// 🔴 BOARD 1 · G10's MARKUP (Board 4: Collective, 2026-09-21 12:37 EDT). Session 2 built this Compare from board 1 with its own class names, so
+// board 1's look could not reach it. Every class is now board 1's (pb-tbl, pb-k, pb-base, pb-v …), scoped by .b1 to b1.css.
+const CAT_NOUN = { AR: 'assault rifle', SMG: 'SMG', LMG: 'LMG', MARKSMAN: 'marksman rifle', SNIPER: 'sniper', SHOTGUN: 'shotgun', SECONDARIES: 'secondary', MELEE: 'melee weapon' };
+export function Compare({ builds, weapons, onSetWeapons, onOpenRack, onAdd }) {
     const [excluded, setExcluded] = useState(() => new Set());
     const [showCards, setShowCards] = useState(false);
+    // Board 4 (pass 2, 2026-09-21 22:39 EDT): the weapon chip is the weapon-chip family (.b3-sc) and the build toggles are the Export picker's keys (.b3-xr-k).
+    const B4 = typeof window !== 'undefined' && window.B4_COLLECTIVE;
     const toggleBuild = (id) => setExcluded((prev) => {
         const next = new Set(prev);
         if (next.has(id)) next.delete(id); else next.add(id);
@@ -952,7 +986,7 @@ function Compare({ builds, weapons, onSetWeapons, onOpenRack, onAdd }) {
 
     if (!options.length) {
         return html`
-            <div id="compare">
+            <div id="compare" class="b1">
                 <p class="empty"><b>Nothing to compare yet.</b>${' '}Add a build and its slots line up here.</p>
                 <div class="racktools"><button class="pill lead" onClick=${onAdd}>Add a build</button></div>
             </div>`;
@@ -973,10 +1007,11 @@ function Compare({ builds, weapons, onSetWeapons, onOpenRack, onAdd }) {
             rows.push({ key: 'Attachments', vals: chosen.map((b) => ((b.attachmentSlots || []).some(Boolean) ? null : (b.attachments || []).join(', ') || null)), slot: false });
         }
         const fields = [
-            ['Rank', (b) => (b.dmzRangeRank || b.categoryRank ? String(b.dmzRangeRank || b.categoryRank).replace(/^top(\d)$/, 'Top $1').replace(/^best/, 'Best').replace(/-/g, ' ') : null)],
-            ['Meta', (b) => (b.isMeta ? 'Yes' : 'No')],
-            ['Toxic', (b) => (b.isToxic ? 'Yes' : 'No')],
-            ['Image', (b) => (b.imageKey ? 'Set' : 'Not set')],
+            // Rank belongs to ONE weapon: ranks are within a category and per weapon, so across two it is Category that is compared.
+            ...(twoWeapons ? [] : [['Rank', (b) => (b.dmzRangeRank || b.categoryRank ? String(b.dmzRangeRank || b.categoryRank).replace(/^top(\d)$/, 'Top $1').replace(/^best/, 'Best').replace(/-/g, ' ') : null)]]),
+            // Board 1 · G10 names Rank on one weapon and Category across two, and nothing else: Meta, Toxic and Image were Session 2's
+            // additions and are not on the board (Board 4: Collective, 2026-09-21 12:37 EDT).
+            ...(twoWeapons ? [['Category', (b) => b.category || null]] : []),
         ];
         for (const [k, read] of fields) {
             const vals = chosen.map(read);
@@ -985,84 +1020,88 @@ function Compare({ builds, weapons, onSetWeapons, onOpenRack, onAdd }) {
         }
     }
     const codeVals = chosen.map((b) => (b.mode === 'DMZ' ? null : b.shareCode || null));
-    const showCode = chosen.length > 1 && codeVals.some((v) => v != null);
+    // Board 1 · G10 draws the Code group for one weapon only: a digit–letter pair names a different attachment on another weapon (§10.1 row 15),
+    // so two weapons' codes side by side would line up things that do not correspond.
+    const showCode = !twoWeapons && chosen.length > 1 && codeVals.some((v) => v != null);
     const differing = rows.length + (showCode && !codeVals.every((v) => v === codeVals[0]) ? 1 : 0);
     const slotsUsed = SLOT_ORDER.filter((s) => chosen.some((b) => slotOf(b, s) != null)).length;
     const notShown = visibleCount - chosen.length;
     const statLine = chosen.length > 1 ? `${chosen.length} builds · ${slotsUsed} slots used · ${differing} differ${notShown ? ` · ${notShown} not shown` : ''}` : '';
     const cell = (v, i, base, slot) => {
-        if (i === 0) return v == null ? html`<span class="cv x">—</span>` : html`<span class="cv">${v}</span>`;
-        if (v == null) return slot && base != null ? html`<span class="cv rm">Not equipped</span>` : html`<span class="cv x">—</span>`;
-        return v === base ? html`<span class="cv">${v}</span>` : html`<span class="cv d">${v}<span class="sr"> differs</span></span>`;
+        if (i === 0) return v == null ? html`<span class="pb-v pb-x">—</span>` : html`<span class="pb-v">${v}</span>`;
+        if (v == null) return slot && base != null ? html`<span class="pb-v pb-rm">Not equipped</span>` : html`<span class="pb-v pb-x">—</span>`;
+        return v === base ? html`<span class="pb-v">${v}</span>` : html`<span class="pb-v pb-d">${v}<span class="sr"> differs</span></span>`;
     };
     const oneBuild = picked.length && chosen.length === 1 ? chosen[0] : null;
-    const rival = oneBuild ? options.find((o) => o.weapon !== oneBuild.weaponName && catOf(o) === oneBuild.category) : null;
-
+    // Board 1 · G10 view 2 offers up to three same-category weapons as "+ Name" pills.
+    const rivals = oneBuild ? options.filter((o) => o.weapon !== oneBuild.weaponName && catOf(o) === oneBuild.category).slice(0, 3) : [];
+
+    // The landing shows the thing itself, faded — a real weapon's first three builds slot by slot — as the Export picker's empty state does (.b3-xt-ghost).
+    const ghostOf = (o) => {
+        if (!o) return null;
+        const bs = [...o.builds].sort((x, y) => numberOf(x) - numberOf(y)).slice(0, 3);
+        const slots = [...new Set(bs.flatMap((b) => (b.attachmentSlots || []).filter(Boolean)))].slice(0, 5);
+        return html`<div class="b4-cmp-ghost" aria-hidden="true"><table class="cmpt"><thead><tr><th class="k"></th>${bs.map((b, k) => html`<th class=${k === 0 ? 'base' : ''} key=${k}>Build ${numberOf(b)}<small>${o.weapon}</small></th>`)}</tr></thead><tbody>${slots.map((s) => html`<tr key=${s}><th class="k">${s}</th>${bs.map((b, k) => html`<td class=${k === 0 ? 'base' : ''} key=${k}>${slotOf(b, s) || '—'}</td>`)}</tr>`)}</tbody></table></div>`;
+    };
     return html`
-        <div id="compare">
+        <div id="compare" class="b1">
             <div class="cmpbar">
                 <${WeaponSearch} options=${options} picked=${picked} roomLeft=${chosen.length < MAX_COMPARE_COLUMNS} onPick=${(w) => onSetWeapons([...picked, w])} />
                 ${picked.map((w) => {
                     const o = optionOf(w);
                     return html`
                     <span class="cmppick" key=${w} role="group" aria-label=${w}>
-                        <button class="chip on" onClick=${() => onSetWeapons(picked.filter((x) => x !== w))} aria-label=${`Remove ${w} from the comparison`}>${w}<${Icon} name="x" cls="sm" /></button>
+                        ${B4 ? html`<span class="b3-sc" style=${`--c:${(o.builds[0] || {}).accent || 'var(--ink3)'}`}><i aria-hidden="true"></i><span class="b3-nw">${w}<em>${o.builds.length} build${o.builds.length === 1 ? '' : 's'}</em></span><button type="button" aria-label=${`Remove ${w} from the comparison`} onClick=${() => onSetWeapons(picked.filter((x) => x !== w))}><${Icon} name="x" /></button></span>`
+                            : html`<button class="chip on" onClick=${() => onSetWeapons(picked.filter((x) => x !== w))} aria-label=${`Remove ${w} from the comparison`}>${w}<${Icon} name="x" cls="sm" /></button>`}
                         ${o.builds.length > 1 ? html`
                             <span class="cmpbrow">
                                 ${[...o.builds].sort((x, y) => numberOf(x) - numberOf(y)).map((b) => { const id = String(b._id); const on = !excluded.has(id); const cut = on && !shownIds.has(id); return html`
-                                    <button type="button" key=${id} class=${'chip' + (cut ? ' cut' : '')} aria-pressed=${on ? 'true' : 'false'}
+                                    <button type="button" key=${id} class=${B4 ? 'b3-xr-k' : 'chip' + (cut ? ' pb-cut' : '')} data-cut=${B4 && cut ? 'true' : null} style=${B4 ? `--c:${b.accent || 'var(--ink3)'}` : null} aria-pressed=${on ? 'true' : 'false'}
                                             title=${cut ? 'Selected, but past the six columns this table shows' : null}
                                             aria-label=${`${w} build ${numberOf(b)}${cut ? ', not shown' : ''}`}
-                                            onClick=${() => toggleBuild(id)}>${numberOf(b)}</button>`; })}
+                                            onClick=${() => toggleBuild(id)}>${B4 ? html`<span class="b3-xr-top"><b>${numberOf(b)}</b></span>` : numberOf(b)}</button>`; })}
                             </span>` : null}
                     </span>`;
                 })}
             </div>
+            ${''/* 2026-09-21 13:06 EDT — BOARD 1 · G10's STRUCTURE, element for element (Board 4: Collective). The stats and the table sit
+                 directly under the bar; the Same row and Show cards live INSIDE .pb-cmp; the empty and one-build states are board 1's —
+                 a sentence and a row of weapon pills, centred — not Session 2's "Compare X against Y" / "Show it in the tier board". */}
             ${!picked.length ? html`
-                <div class="cmp">
-                    <p class="empty"><b>Pick a weapon</b>${' '}Its builds line up slot by slot. Add a second weapon to set them side by side.</p>
-                    <div class="racktools">
-                        ${pair ? html`<button class="pill lead" onClick=${() => onSetWeapons([pair[0].weapon, pair[1].weapon])}>Compare ${pair[0].weapon} against ${pair[1].weapon}</button>` : null}
-                        ${suggest ? html`<button class="pill" onClick=${() => onSetWeapons([suggest.weapon])}>Or just ${suggest.weapon}</button>` : null}
+                <div class="empty">${B4 ? ghostOf((pair || [])[0]) : null}<b>Pick a weapon</b>Its builds line up slot by slot
+                    ${(pair || []).length ? html`<div class="pb-sugg">${pair.map((o) => html`<button class=${B4 ? 'pill b3-sc b4-sg' : 'pill'} key=${o.weapon} onClick=${() => onSetWeapons([o.weapon])}>${o.weapon} · ${o.builds.length} builds</button>`)}</div>` : null}
+                </div>`
+            : chosen.length > 1 ? html`
+                <div class="sr" aria-live="polite">${statLine}</div>
+                <div class="cmpstats" aria-hidden="true">
+                    <span class="cmpstat"><b>${chosen.length}</b><span>builds</span></span>
+                    <span class="cmpstat"><b>${slotsUsed}</b><span>slots used</span></span>
+                    ${notShown ? html`<span class="cmpstat pb-over"><b>${notShown}</b><span>not shown</span></span>` : html`<span class="cmpstat"><b>${differing}</b><span>differ</span></span>`}
+                </div>
+                <div class="pb-cmp">
+                    <div class="pb-scroll"><table class="pb-tbl">
+                        <caption class="sr">${picked.join(' and ')} builds, compared slot by slot against ${colLabel(chosen[0])}</caption>
+                        <thead><tr><th class="pb-k" scope="col"><span class="sr">Slot</span></th>${chosen.map((b, i) => html`<th key=${String(b._id)} scope="col" class=${i === 0 ? 'pb-base' : ''}>${colLabel(b)}${i === 0 ? html`<small>baseline</small>` : null}</th>`)}</tr></thead>
+                        <tbody>
+                            ${rows.map((r) => html`
+                                <tr key=${r.key}><th class="pb-k" scope="row">${r.key}</th>${r.vals.map((v, i) => html`<td key=${i} class=${i === 0 ? 'pb-base' : ''}>${cell(v, i, r.vals[0], r.slot)}</td>`)}</tr>`)}
+                            ${showCode ? html`
+                                <tr class="pb-gap"><th colspan=${chosen.length + 1} scope="rowgroup">Code</th></tr>
+                                <tr><th class="pb-k" scope="row"><span class="sr">Gunsmith code</span></th>${codeVals.map((v, i) => html`<td key=${i} class=${i === 0 ? 'pb-base' : ''}>${v == null ? html`<span class="pb-v pb-x">—</span>` : html`<span class=${'pb-v pb-m' + (i && v !== codeVals[0] ? ' pb-d' : '')}>${v}${i && v !== codeVals[0] ? html`<span class="sr"> differs</span>` : null}</span>`}</td>`)}</tr>` : null}
+                        </tbody>
+                    </table></div>
+                    ${same.length ? html`<div class="pb-same"><span>Same on all ${chosen.length}</span>${same.map(([k, v]) => html`<span class="pill" key=${k}>${k}<b>${v}</b></span>`)}</div>` : null}
+                    <div class="pb-fold">
+                        <button type="button" class="chip" aria-expanded=${showCards ? 'true' : 'false'} onClick=${() => setShowCards(!showCards)}><${Fold} open=${showCards} />${showCards ? 'Hide cards' : 'Show cards'}</button>
+                        ${showCards ? html`<div class="cmpcards" data-cards=${chosen.length}>${chosen.map((b) => (B4 ? html`<figure class="b4-cc" key=${String(b._id)}><figcaption><b>${colLabel(b)}</b>${b.buildName && !/^build \d+$/i.test(b.buildName) ? html`<span>${b.buildName}</span>` : null}</figcaption><${LoadoutCard} build=${b} siblings=${siblingsOf(b)} /></figure>`
+                            : html`<${LoadoutCard} key=${String(b._id)} build=${b} siblings=${siblingsOf(b)} />`))}</div>` : null}
                     </div>
                 </div>`
-            : html`
-                <div class="cmp">
-                    <div class="sr" aria-live="polite">${statLine}</div>
-                    ${chosen.length > 1 ? html`
-                        <div class="cmpstats" aria-hidden="true">
-                            <span class="cmpstat"><b>${chosen.length}</b><span>builds</span></span>
-                            <span class="cmpstat"><b>${slotsUsed}</b><span>slots used</span></span>
-                            <span class="cmpstat"><b>${differing}</b><span>differ</span></span>
-                            ${notShown ? html`<span class="cmpstat over"><b>${notShown}</b><span>not shown</span></span>` : null}
-                        </div>
-                        <div class="cmpscroll">
-                        <table class="cmpt">
-                            <caption class="sr">${picked.join(' and ')} builds, compared slot by slot against ${colLabel(chosen[0])}</caption>
-                            <thead><tr><th class="k" scope="col"><span class="sr">Slot</span></th>${chosen.map((b, i) => html`<th key=${String(b._id)} scope="col" class=${i === 0 ? 'base' : ''}>${colLabel(b)}${i === 0 ? html`<small>baseline</small>` : null}</th>`)}</tr></thead>
-                            <tbody>
-                                ${rows.map((r) => html`
-                                    <tr key=${r.key}><th class="k" scope="row">${r.key}</th>${r.vals.map((v, i) => html`<td key=${i} class=${i === 0 ? 'base' : ''}>${cell(v, i, r.vals[0], r.slot)}</td>`)}</tr>`)}
-                                ${showCode ? html`
-                                    <tr class="gap"><th colspan=${chosen.length + 1} scope="rowgroup">Code</th></tr>
-                                    <tr><th class="k" scope="row"><span class="sr">Gunsmith code</span></th>${codeVals.map((v, i) => html`<td key=${i} class=${i === 0 ? 'base' : ''}>${v == null ? html`<span class="cv x">—</span>` : html`<span class=${'cv m' + (i && v !== codeVals[0] ? ' d' : '')}>${v}${i && v !== codeVals[0] ? html`<span class="sr"> differs</span>` : null}</span>`}</td>`)}</tr>` : null}
-                            </tbody>
-                        </table>
-                        </div>
-                        ${same.length ? html`<div class="cmpsame"><span>Same on all ${chosen.length}</span>${same.map(([k, v]) => html`<span class="pill" key=${k}>${k}<b>${v}</b></span>`)}</div>` : null}`
-                    : oneBuild ? html`
-                        <p class="empty"><b>${oneBuild.weaponName} has one build here</b>${' '}Add a second weapon to set it beside another.</p>
-                        <div class="racktools">
-                            ${rival ? html`<button class="pill lead" onClick=${() => onSetWeapons([...picked, rival.weapon])}>Compare ${oneBuild.weaponName} against ${rival.weapon}</button>` : null}
-                            <button class="pill" onClick=${() => onOpenRack(oneBuild.weaponName)}>Show it in the tier board</button>
-                        </div>`
-                    : html`<p class="empty"><b>Every build is switched off</b>${' '}Turn a build back on above.</p>`}
-                    ${chosen.length ? html`
-                        <div class="cmpfold">
-                            <button type="button" class="chip" aria-expanded=${showCards ? 'true' : 'false'} onClick=${() => setShowCards(!showCards)}><${Fold} open=${showCards} />${showCards ? 'Hide cards' : 'Show cards'}</button>
-                            ${showCards ? html`<div class="cmpcards">${chosen.map((b) => html`<${LoadoutCard} key=${String(b._id)} build=${b} siblings=${siblingsOf(b)} />`)}</div>` : null}
-                        </div>` : null}
-                </div>`}
+            : oneBuild ? html`
+                <div class="empty"><b>${oneBuild.weaponName} has one build</b>Add another ${CAT_NOUN[oneBuild.category] || 'weapon'} to line them up
+                    ${rivals.length ? html`<div class="pb-sugg">${rivals.map((o) => html`<button class=${B4 ? 'pill b3-sc b4-sg' : 'pill'} key=${o.weapon} onClick=${() => onSetWeapons([...picked, o.weapon])}>+ ${o.weapon}</button>`)}</div>` : null}
+                </div>`
+            : html`<div class="empty"><b>Every build is switched off</b>Turn a build back on above</div>`}
         </div>
     `;
 }
@@ -1070,7 +1109,7 @@ function Compare({ builds, weapons, onSetWeapons, onOpenRack, onAdd }) {
 // ── THE ACTIVE FILTER BAR ─────────────────────────────────────────────────────────────────────
 //
 // 🔴 THE FILTER WAS INVISIBLE FROM THE TABLE IT FILTERED. Clicking a Coverage card narrowed the Manifest and said so only in the Manifest's header-right corner, as a bare string with no way back — so a reader who scrolled past it saw a short table and no reason for it, which reads as missing data rather than as a filter. The bar states every active narrowing, in the words the control used, with the count it produced and one control that undoes all of it.
-function FilterBar({ weapon, flag, shown, total, onClear }) {
+export function FilterBar({ weapon, flag, shown, total, onClear }) {
     if (!weapon && !flag) return null;
     return html`
         <div class="afbar">
@@ -1194,7 +1233,7 @@ function BulkCreatePanel({ builds, mode, csrfToken, overlay, onStaged, busy, set
 // ── THE DRAWER ITSELF ────────────────────────────────────────────────────────────────────────
 //
 // Row 2 (G9): the header holds only eyebrow/title/×; a toolbar under it carries the MP/DMZ switch (unchanged look), a rule, then Add build · Bulk create. Row 5: Esc/scrim on a dirty draft asks first. Row 11/12 (harden): handleAdd's stageOps() result is checked rather than assumed, and Stage shows a busy state so a double click cannot stage the same build twice.
-function NewBuildDrawer({ builds, mode, onSubmit, onStaged, onCancel, csrfToken, overlay, initialPanel = 'add' }) {
+export function NewBuildDrawer({ builds, mode, onSubmit, onStaged, onCancel, csrfToken, overlay, initialPanel = 'add' }) {
     const [panel, setPanel] = useState(initialPanel);
     const [f, setF] = useState({
         weaponName: '', category: 'AR', mode, buildName: '', imageKey: '', imageSourceUrl: '', imageLinkText: '',
@@ -1318,11 +1357,11 @@ function NewBuildDrawer({ builds, mode, onSubmit, onStaged, onCancel, csrfToken,
 
 
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
@@ -1360,6 +1399,18 @@ export function ArmoryRealm({ session }) {
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
@@ -1412,6 +1463,7 @@ export function ArmoryRealm({ session }) {
     const rows = inMode
         .filter((b) => !coverageFilter || (b.coverage || []).includes(coverageFilter.flag))
         .filter((b) => !weaponFilter || b.weaponName === weaponFilter)
+        .filter((b) => !b3Badge || (b3Badge === 'meta' ? b.isMeta : b3Badge === 'toxic' ? b.isToxic : b.categoryRank === b3Badge))
         .map((b) => ({ ...b, id: b._id, topicVar: null, accentHex: b.accent, state: stagedTargets.has(String(b._id)) ? 'staged' : b.state }));
 
     // 🔴 A DRAWER OVER A ROW THAT NO LONGER EXISTS. The editor used to be handed `builds.find(...)` inline, so a staged bulk deletion followed by a refresh could hand it `undefined` and the first field read would throw inside a modal with the page behind it inert — a dead screen with no way out but Escape. Resolved once here, and the drawer is simply not rendered when the build it was opened for has gone.
@@ -1486,7 +1538,7 @@ export function ArmoryRealm({ session }) {
     const rankedNow = inMode.filter((b) => b.categoryRank || b.dmzRangeRank).length;
     // G1 (§10.4, board row armory.js:1315): Tier board's and Repairs' counts moved onto their tabs (viewCounts below); Compare lost its "type a weapon name" instruction and names the weapons only once there are some.
     const failingChecks = Object.keys(COVERAGE_LABEL).filter((f) => inMode.some((b) => (b.coverage || []).includes(f))).length;
-    const viewCounts = { [VIEWS.rack]: `${rankedNow}/${inMode.length}`, [VIEWS.coverage]: failingChecks };
+    const viewCounts = { [VIEWS.rack]: `${rankedNow}/${inMode.length}`, [VIEWS.coverage]: p6v !== 'now' ? repairsStatus(inMode, p6day === 'clean') : failingChecks };
     const viewMeta = view === VIEWS.compare && comparedWeapons.length
             ? `${comparedWeapons.join(' · ')} — ${inMode.filter((b) => comparedWeapons.includes(b.weaponName)).length} builds`
         : view === VIEWS.bulk ? `${inMode.length} ${armMode} builds · pipe format, lossless round trip` : null;
@@ -1532,7 +1584,7 @@ export function ArmoryRealm({ session }) {
                   stagedOps=${load.data.stagedUnknown ? null : load.data.stagedOps}
                   overlaySlot=${html`
                       ${overlay.render()}
-                      ${showAdd ? html`<${NewBuildDrawer} builds=${builds} mode=${addMode} initialPanel=${addPanel} csrfToken=${session.csrfToken} overlay=${overlay}
+                      ${showAdd && g9v === 'now' ? html`<${NewBuildDrawer} builds=${builds} mode=${addMode} initialPanel=${addPanel} csrfToken=${session.csrfToken} overlay=${overlay}
                                                         onSubmit=${handleAdd} onCancel=${() => setShowAdd(false)}
                                                         onStaged=${(s) => {
                                                             setShowAdd(false);
@@ -1540,6 +1592,10 @@ export function ArmoryRealm({ session }) {
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
@@ -1591,7 +1647,10 @@ export function ArmoryRealm({ session }) {
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
@@ -1601,9 +1660,9 @@ export function ArmoryRealm({ session }) {
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
@@ -1617,11 +1676,15 @@ export function ArmoryRealm({ session }) {
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

## `ui/armory.logic.js` → `portal/ui/armory.logic.js`

```diff
diff --git aportal/ui/armory.logic.js bkit/ui/armory.logic.js
index 9fd1fbd9..ad67927e 100644
--- aportal/ui/armory.logic.js	
+++ bkit/ui/armory.logic.js	
@@ -1,26 +1,35 @@
 // portal/ui/armory.logic.js — CommonJS, imports nothing. Pure op-builders + the badges-token parser for the Armory realm, tested directly by scripts/portalRealms.test.js.
 //
 // parseBadgesToken() is a client-side port of utils/adminParser.js's parseLoadoutBadges() -- that function lives in a Node-only module (chrono-node/dayjs deps) the browser bundle never loads, so this reproduces its exact grammar rather than reaching across the server boundary. Any change to the real parser's token vocabulary must be mirrored here.
+const RANK_MODES = ['HP', 'S&D', 'DOM', 'TDM', 'FTL', 'Control'];
+const RANK_MODE_TOKENS = { hp: 'HP', 's&d': 'S&D', snd: 'S&D', sd: 'S&D', dom: 'DOM', tdm: 'TDM', ftl: 'FTL', control: 'Control', ctrl: 'Control' };
 function parseBadgesToken(badgesStr, mode) {
     const tokens = (badgesStr || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
     let isMeta = false;
     let categoryRank = null;
     let dmzRangeRank = null;
     let isToxic = false;
+    let isAss = false;
+    const modes = new Set();
     const unrecognized = [];
 
     for (const token of tokens) {
         if (token === 'meta') { isMeta = true; continue; }
         if (token === 'best') { categoryRank = 'best'; continue; }
         if (token === 'toxic') { isToxic = true; continue; }
-        const rangeMatch = token.match(/^(best|top\s*\d+)(close|midlong)$/);
+        if (token === 'ass') { isAss = true; continue; }
+        // 2026-09-25 23:19 EDT (his 23:12 EDT, the Modes family): the Modes family, MP only — the bot's parser (utils/adminParser.js) takes the same tokens in Session 5
+        if (RANK_MODE_TOKENS[token]) { if (mode === 'DMZ') unrecognized.push(token); else modes.add(RANK_MODE_TOKENS[token]); continue; }
+        if (token === 'capable') { categoryRank = 'capable'; continue; }
+        const rangeMatch = token.match(/^(best|top\s*\d+|capable)-?(close|midlong)$/);
         if (rangeMatch) {
             const tier = rangeMatch[1].replace(/\s+/g, '');
             dmzRangeRank = `${tier}-${rangeMatch[2]}`;
             continue;
         }
         const topMatch = token.match(/^top\s*(\d+)$/);
-        if (topMatch) { categoryRank = `top${topMatch[1]}`; continue; }
+        // v19: Top 4 is retired; a top-4 build is inside the top five, so an old token reads as top5
+        if (topMatch) { categoryRank = `top${topMatch[1] === '4' ? '5' : topMatch[1]}`; continue; }
         unrecognized.push(token);
     }
     // DMZ never uses the per-category Best/TopN system -- same swap handlers/manage/loadouts.js applies server-side (a bare "best"/"topN" token doesn't know the mode on its own, so it moves over to dmzRangeRank here instead once the mode is known).
@@ -28,7 +37,8 @@ function parseBadgesToken(badgesStr, mode) {
         dmzRangeRank = categoryRank;
         categoryRank = null;
     }
-    return { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized };
+    const rankModes = RANK_MODES.filter((m) => modes.has(m));
+    return { isMeta, categoryRank, dmzRangeRank, isToxic, isAss, rankModes, unrecognized };
 }
 
 // core/ops/loadouts.js's loadout.add/loadout.edit both run every payload field through validateBuild(), which REQUIRES weaponName + a valid mode and recomputes weaponKey itself -- callers never need to derive it. loadout.edit's real target shape is { id } (confirmed reading core/ops/loadouts.js's 'loadout.edit' entry in full: `Loadout.findById(op.target.id)`), matching loadout.delete/bulkDelete's own `{ id }`/`{ ids }` shapes. ⚠️ shareCode is NOT collected here, and this Armory form is now BEHIND Discord's own /manage on this front (reversed 2026-08-22 20:18 EDT -- this comment used to say "the real /manage add-loadout modal has no field for it either", which was true when written but is no longer true: Discord's Add/Edit Loadout modal now accepts "Build Name | Share Code" as a pipe-delimited convention on its existing `build` field, precisely because Discord modals cap at 5 fields with all 5 already used, so a real 6th field was never possible there -- see commands/manage.js/handlers/manage/loadouts.js. THIS form has no such 5-field constraint (it's a web form), so adding a real, dedicated Share Code input here would be more straightforward than the Discord workaround, not blocked by it. Filed as a follow-up in docs/db-deferred-list.md, not built here. Until then: on EDIT, this form still cannot show or change an existing (possibly /autobuild-set) shareCode at all -- the op-layer contract this comment originally described still holds and is still correct: see core/ops/loadouts.js's own header for why an always-present '' payload key would silently wipe a real gunsmith code on an EDIT (add is unaffected -- there is nothing yet to wipe on a new build). ⚠️ BADGES ARRIVE TWO WAYS NOW, and the token path stays because it is what a paste and a bulk apply speak. The add FORM sets the four fields directly — it has real controls, so making it serialise `meta, top3` into a string for this function to parse back would be a round trip through a grammar that exists for text input. An explicit field wins over the token when both are present.
@@ -48,15 +58,17 @@ function buildArmoryAddOp(fields) {
             ...(shareCode ? { shareCode } : {}),
             isMeta: Boolean(pick(fields.isMeta, token.isMeta)),
             isToxic: Boolean(pick(fields.isToxic, token.isToxic)),
+            isAss: Boolean(pick(fields.isAss, token.isAss)),
             categoryRank: pick(fields.categoryRank, token.categoryRank) || null,
             dmzRangeRank: pick(fields.dmzRangeRank, token.dmzRangeRank) || null,
+            rankModes: fields.mode === 'DMZ' ? [] : (pick(fields.rankModes, token.rankModes) || []),
         },
     };
 }
 
 // The vocabulary utils/adminParser.js's parseLoadoutBadges accepts, spelled the way core/ops stores it. A DMZ build ranks on a combat RANGE as well as a tier, which is why it is one field of compound values rather than two.
 const DMZ_RANGE_TOKENS = ['best-close', 'best-midlong', 'top3-close', 'top3-midlong', 'top5-close', 'top5-midlong'];
-const MP_RANK_TOKENS = ['best', 'top3', 'top4', 'top5'];
+const MP_RANK_TOKENS = ['best', 'top3', 'top5', 'capable'];
 
 // Edits one field of an existing row, preserving the rest -- loadout.edit's validate() needs the full build (weaponName/mode/etc), not a partial patch, same contract as every other entity's edit op in this portal.
 function buildArmoryEditOp(row, columnKey, newValue) {
@@ -94,10 +106,10 @@ function armoryExportQuery({ scope, mode, category, ids }) {
 // 🔴 "UPDATE" IS NOT A PREVIEW. The bulk paste told you a block would update an existing build and stopped there — so a paste that silently rewrote a category, dropped a share code or changed a rank looked exactly like one that changed nothing, and the only way to find out was to stage it and read the diff on the Review screen. These are the fields the upsert actually writes.
 //
 // ⚠️ THE MATCH IS THE CLIENT'S, THE VERDICT IS THE SERVER'S. /api/parse-bulk/loadout decides update-or-new on `weaponKey` — a normalised form this browser does not compute — so `existing` is taken from the reply and never re-derived here. This only names the CHANGING FIELDS, and when it cannot find the local record it says so rather than reporting "no change", because a silent empty diff over a real update is the exact failure it exists to prevent.
-const BULK_DIFF_FIELDS = ['category', 'shareCode', 'imageKey', 'categoryRank', 'dmzRangeRank', 'isMeta', 'isToxic'];
+const BULK_DIFF_FIELDS = ['category', 'shareCode', 'imageKey', 'categoryRank', 'dmzRangeRank', 'isMeta', 'isToxic', 'isAss', 'rankModes'];
 const FIELD_WORDS = {
     category: 'Category', shareCode: 'Share code', imageKey: 'Image reference',
-    categoryRank: 'Category rank', dmzRangeRank: 'DMZ range rank', isMeta: 'Meta badge', isToxic: 'Toxic badge',
+    categoryRank: 'Category rank', dmzRangeRank: 'DMZ range rank', isMeta: 'Meta badge', isToxic: 'Toxic badge', isAss: 'Ass badge', rankModes: 'Rank Mode',
 };
 
 const sameish = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
@@ -165,10 +177,10 @@ function displayBuildLabel(build) {
 // 🔴 THE RACK IS GROUPED BY CATEGORY AND OPENS CLOSED — Harkirat, Pin 21: "WHY do I have to scroll all the way". Grouped by rank tier it was five permanently-open rows over the whole catalogue, so every visit began by scrolling past everything to reach the one weapon class you came for. Category is the axis a reader arrives with ("show me the SMGs"); rank has not been lost, it has moved one level down — the weapon groups inside a category are ordered best-first and each carries its tier as a badge, so the board still answers "what is ranked where" once it is open.
 //
 // ⚠️ THIS LIVES IN THE LOGIC FILE RATHER THAN IN armory.js BECAUSE EVERY FACT ON A CATEGORY HEADER IS ARITHMETIC — the count, the ordering, the teaser — and arithmetic that only a browser can run is arithmetic nothing checks. ORDER_STAMP is deliberately absent: the display order is a constant below, not a date.
-const RANK_ORDER = ['best', 'top3', 'top4', 'top5', null];
-const RANK_LABEL = { best: 'Best in category', top3: 'Top 3', top4: 'Top 4', top5: 'Top 5', null: 'Unranked' };
+const RANK_ORDER = ['best', 'top3', 'top5', 'capable', null];
+const RANK_LABEL = { best: 'Best in category', top3: 'Top 3', top5: 'Top 5', capable: 'Capable', null: 'Unranked' };
 // 🔴 THESE STRINGS ARE CSS CLASS NAMES. app.css's `.t-best/.t-top3/.t-top4/.t-top5/.t-unranked` are what grade a tier visually, and this map once emitted `t-t3`/`t-t4`/`t-t5`/`t-none` — four selectors that named nothing while every gate stayed green. They now ride on the WEAPON GROUP rather than on a tier row, because the tier row is gone.
-const RANK_KEY = { best: 'best', top3: 'top3', top4: 'top4', top5: 'top5', null: 'unranked' };
+const RANK_KEY = { best: 'best', top3: 'top3', top5: 'top5', capable: 'capable', null: 'unranked' };
 
 // The mockup's own chip vocabulary and display order (armory.html's `renderCatChips`) — short labels, distinct from the precise CATEGORY_LABEL the edit form's dropdown uses, which is verbose on purpose.
 const CATEGORY_CHIP_LABEL = { AR: 'Assault', SMG: 'SMG', LMG: 'LMG', MARKSMAN: 'Marksman', SNIPER: 'Sniper', SHOTGUN: 'Shotgun', SECONDARIES: 'Secondaries' };
@@ -259,7 +271,7 @@ function addFormBlockers(f) {
 
 // The fields loadout.edit actually writes, which is what makes "nothing has changed" answerable. `attachments` is compared as a LIST rather than a count: two five-attachment lists that differ in one string are a real edit, and a count comparison would call them equal.
 const EDIT_DIRTY_FIELDS = ['weaponName', 'buildName', 'category', 'mode', 'shareCode', 'imageKey',
-    'isMeta', 'isToxic', 'categoryRank', 'dmzRangeRank', 'description'];
+    'isMeta', 'isToxic', 'isAss', 'rankModes', 'categoryRank', 'dmzRangeRank', 'description'];
 
 function editedFields(build, draft) {
     const before = build || {};
@@ -350,18 +362,22 @@ function codeFill(builds, weaponKey, mode, code) {
 
 
 // deriveNextImageKey(builds, weaponName, mode): client-side mirror of utils/loadoutImageCache.js's deriveImageKey -- same convention (WEAPON-NAME-N, DMZ- prefixed for DMZ), computed against every imageKey already IN the loaded catalogue rather than a server round trip, so the New Build drawer can show the real next key ("AK117-6") live as the weapon name is typed. Server-side deriveImageKey stays the one place the ACTUAL upload uses (core/ops/loadouts.js, at commit) -- this is a preview only.
-function deriveNextImageKey(builds, weaponName, mode) {
+// v19 (his item 13, 2026-09-24): a new AK117 build was offered AK117-1, which Build 1 holds. Stored keys carry their extension ("AK117-1.png") and the
+// candidates do not, so no key ever matched and every weapon was offered -1. Keys compare without the extension, and `reserved` adds the keys
+// taken outside the catalogue: uploads no build uses yet, and the other builds in the same drawer.
+function deriveNextImageKey(builds, weaponName, mode, reserved) {
     const base = String(weaponName || '').trim().toUpperCase().replace(/\s+/g, '-');
     if (!base) return '';
     const prefix = mode === 'DMZ' ? 'DMZ-' : '';
-    const taken = new Set((builds || []).map((b) => String(b.imageKey || '').toUpperCase()));
+    const bare = (k) => String(k || '').trim().toUpperCase().replace(/\.(PNG|JPE?G|WEBP|GIF)$/, '');
+    const taken = new Set([...(builds || []).map((b) => bare(b.imageKey)), ...(reserved || []).map(bare)]);
     let n = 1;
     while (taken.has(`${prefix}${base}-${n}`)) n++;
     return `${prefix}${base}-${n}`;
 }
 
 if (typeof module !== 'undefined' && module.exports) {
-    module.exports = { bulkFieldDiff, findLocalBuild, buildArmoryAddOp, buildArmoryEditOp, parseBadgesToken, bulkPasteSummary, armoryExportQuery, DMZ_RANGE_TOKENS, MP_RANK_TOKENS,
+    module.exports = { bulkFieldDiff, findLocalBuild, buildArmoryAddOp, buildArmoryEditOp, parseBadgesToken, bulkPasteSummary, armoryExportQuery, DMZ_RANGE_TOKENS, MP_RANK_TOKENS, RANK_MODES,
         RANK_ORDER, RANK_LABEL, RANK_KEY, CATEGORY_CHIP_LABEL, CATEGORY_CHIP_ORDER,
         rankOf, bestRankIndex, rackCategories, weaponOptions, matchWeapons,
         addFormBlockers, editedFields, editorBlockers, EDIT_DIRTY_FIELDS,
```

## `ui/broadcast.js` → `portal/ui/broadcast.js`

```diff
diff --git aportal/ui/broadcast.js bkit/ui/broadcast.js
index 68764342..b97ba53b 100644
--- aportal/ui/broadcast.js	
+++ bkit/ui/broadcast.js	
@@ -3,7 +3,7 @@
 // buildBroadcastAddOp/buildBroadcastEditOp come from broadcast.logic.js, loaded as a plain CLASSIC <script> before this module -- see track.js's header comment for why a literal ESM import of a .logic.js sibling would fail in a real browser (found live in season.js's own prior version).
 import { h } from '../vendor/preact.mjs';
 import { html } from '../vendor/htm-preact.mjs';
-import { useState, useEffect } from '../vendor/preact-hooks.mjs';
+import { useState, useEffect, useRef, useLayoutEffect } from '../vendor/preact-hooks.mjs';
 import { Shell, Masthead, MastheadNew } from './shell.js';
 import { DiscordCard } from './v2Render.js';
 import { Manifest } from './manifest.js';
@@ -14,45 +14,56 @@ import { useAsync, RealmShell, reportFailure } from './async.js';
 import { stageOps } from './composeClient.js';
 import { useOverlay, Drawer } from './overlay.js';
 import { SmartDate } from './composer.js';
+import { useB3 } from '../b3/state.js';
+import { EndPicker, NeverChip, ForeverAhead, stagedEndOf, DateGrid, usePop, FoldBtn, BudgetMeter, BudgetReadout, Stepper, AccentBlock, randomAccent, hexOf, accentTooDark } from '../b3/broadcast.js';
+import { isoLocal } from '../b3/state.js';
+import { MediaWell, Chip, useStageMin, StageMinBtn, StageMini } from '../b4/form.js';
+import { CharCount } from '../gates/lib.js';
 
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
-    { key: 'text', label: 'Announcement', editable: true, col: 'c-bc-text',
+export const BROADCAST_COLUMNS = [
+    // 2026-09-21 19:21 EDT — no longer `editable`: a click on the row opens the editor (Board 4), and a cell never turns into a field.
+    { key: 'text', label: 'Announcement', col: 'c-bc-text',
       dotClass: () => 'bcbar', dotStyle: (r) => `--c:${accentOf(r)}`,
-      render: (r) => { const t = String(r.text || '').replace(/^#{1,3}\s+/, ''); return html`<b title=${t}>${t}</b>`; } },
+      render: (r) => { const full = String(r.text || '').replace(/^#{1,3}\s+/gm, ''); const t = (full.split('\n').find((l) => l.trim()) || '').trim(); return html`<b title=${full}>${t}</b>`; } },   // 2026-09-27 22:03 EDT: a post is named by its FIRST line (its # heading); the break between heading and body used to vanish
     { key: 'createdAt', label: 'Posted', col: 'c-bc-date', dataKind: 'nums', render: (r) => html`<span class="bcdt">${fmtDay(r.createdAt)}<small>${agoText(r.createdAt)}</small></span>` },
     { key: 'startsAt', label: 'Starts', col: 'c-bc-date', dataKind: 'nums', render: (r) => (r.startsAt ? html`<span class="bcdt">${fmtDay(r.startsAt)}</span>` : html`<span class="bcdt dim">On posting</span>`) },
-    { key: 'expiresAt', label: 'Ends', col: 'c-bc-date', dataKind: 'nums', render: (r) => (r.expiresAt ? html`<span class="bcdt">${fmtDay(r.expiresAt)}</span>` : html`<span class="bcdt never"><${Icon} name="infinity" />No end</span>`) },
+    { key: 'expiresAt', label: 'Ends', col: 'c-bc-date', dataKind: 'nums', render: (r) => (r.expiresAt ? html`<span class="bcdt">${fmtDay(r.expiresAt)}</span>` : html`<span class="bcdt never"><${Icon} name="infinity" /><span class="w">No end</span></span>`) },
     { key: 'state', label: 'State', col: 'c-bc-state',
-      render: (r) => { const l = LIFECYCLE[lifecycleOf(r)]; return html`<span class=${'btab' + (r.state === 'staged' ? ' staged' : '')} style=${`--lc:${l.c}`}><${Icon} name=${l.icon} />${l.word}</span>`; } },
+      render: (r) => { const l = LIFECYCLE[lifecycleOf(r)];
+          // 2026-09-21 19:21 EDT — a staged row is not "Live now" with a dashed edge: it is a pending change, so it says so, in --staged with
+          // the Review realm's mark (staged work waits on Review; the sprite has no separate staged glyph). Its left bar stays the tab's own bar; top, right and bottom go dashed (Harkirat, Board 4 intake C7-6).
+          if (r.state === 'staged') return html`<span class="btab staged" style="--lc:var(--staged)"><${Icon} name="r-review" /><span class="w">Change staged</span></span>`;
+          return html`<span class="btab" style=${`--lc:${l.c}`}><${Icon} name=${l.icon} /><span class="w">${l.word}</span></span>`; } },
 ];
 
 
 // The State chips keep the portal's chip with its colour dot (board 2 popup, 13:06 EDT) and carry their counts (§10.4 C1). The words match the Tab in the column, so the filter and the thing it filters say the same thing.
-function broadcastFilters(all) {
+export function broadcastFilters(all) {
     const n = (s) => all.filter((a) => lifecycleOf(a) === s).length;
     return [{ key: 'state', label: 'State', topic: true, options: [
-        { value: 'live', label: 'Live now', hex: 'var(--ok)', count: n('live') },
-        { value: 'scheduled', label: 'Upcoming', hex: 'var(--sched)', count: n('scheduled') },
-        { value: 'expired', label: 'Ended', hex: 'var(--ink3)', count: n('expired') },
+        // The chips carry the same icon as the row's state tab, not a dot (Board 4 intake C7-7).
+        { value: 'live', label: 'Live now', hex: 'var(--ok)', icon: LIFECYCLE.live.icon, count: n('live') },
+        { value: 'scheduled', label: 'Upcoming', hex: 'var(--sched)', icon: LIFECYCLE.scheduled.icon, count: n('scheduled') },
+        { value: 'expired', label: 'Ended', hex: 'var(--ink3)', icon: LIFECYCLE.expired.icon, count: n('expired') },
     ] }];
 }
 
 // The topic accent for an announcement is its OWN stored colour (models/Announcement.js's `color`, generated once at creation and never regenerated on edit), so the portal's dot matches the embed Discord actually renders rather than inventing a second palette. ⚠️ NEVER RETURNS NULL. models/Announcement.js makes `color` required, but a document written before that field existed -- or any future partial -- would leave --topic-accent unset, and the rules that consume it pair a fill with #000 ink. --patch is the safe floor (12.53:1 under #000).
-const accentOf = (a) => (typeof a.color === 'number' ? '#' + a.color.toString(16).padStart(6, '0') : 'var(--patch)');
+export const accentOf = (a) => (typeof a.color === 'number' ? '#' + a.color.toString(16).padStart(6, '0') : 'var(--patch)');
 
 // Now showing -- the live set in the order Discord delivers it.
 //
@@ -67,7 +78,7 @@ const firstHeading = (t) => (String(t || '').match(/^#{1,3}\s+(.+)$/m) || [])[1]
 const bodyOf = (t) => String(t || '').replace(/^#{1,3}\s+.+$/m, '').trim().slice(0, 110) || String(t || '').slice(0, 110);
 
 // 🔴 WHOLE DAYS BETWEEN TWO DATES, not hours divided by 24. The design counts from midnight to midnight, so an announcement posted at 18:41 twenty days ago is "19d" there and was "20d" here — every age on the page off by one, in a direction that depends on the time of day the fixture happens to carry. 🔴 FLOOR FROM TODAY'S MIDNIGHT TO THE ACTUAL TIMESTAMP, which is what the design's own days() does and what makes "up 19d" 19 rather than 20. Rounding date-to-date gives 20 for a post made at 18:41 twenty calendar days ago; the design counts ELAPSED days from the moment it was posted to the start of today, so a post nineteen-and-a-quarter days old is nineteen. Every age on this realm was one out until this was measured against the design rather than reasoned about.
-const daysBetween = (a, b) => Math.max(0, Math.floor(
+export const daysBetween = (a, b) => Math.max(0, Math.floor(
     (new Date(new Date(b).toISOString().slice(0, 10) + 'T00:00:00Z') - new Date(a)) / 86400000));
 
 const relDay = (iso) => {
@@ -76,7 +87,7 @@ const relDay = (iso) => {
 };
 
 // 🔴 CHANGES AHEAD REPLACES "WHAT ONE PLAYER GETS" (plan pins batch 2 §10.4 G3 row 5, popup 2026-09-14 10:33 EDT). The composer now shows the Discord card itself, so this column answers the question the queue cannot: what is about to change. Every future start and every future end, soonest first, as a date tile and the announcement clamped to two lines.
-function ChangesAhead({ all }) {
+export function ChangesAhead({ all, b3extra = null }) {
     const now = Date.now();
     const events = [];
     for (const a of all) {
@@ -89,17 +100,18 @@ function ChangesAhead({ all }) {
     return html`
         <div class="bchg" role="group" aria-label="Changes ahead">
             <h5>Changes ahead</h5>
+            ${b3extra}
             ${events.length ? events.slice(0, 6).map((ev, i) => { const d = new Date(ev.at); return html`
                 <div class="bchg-i" key=${i} style=${`--gc:${ev.c}`}>
                     <time datetime=${d.toISOString()}><small>${d.toLocaleDateString(undefined, { month: 'short' })}</small>${d.getDate()}</time>
-                    <span><b>${String(ev.a.text || '').replace(/^#{1,3}\s+/gm, '')}</b><em>${ev.verb}</em></span>
+                    <span><b>${(String(ev.a.text || '').replace(/^#{1,3}\s+/gm, '').split('\n').find((l) => l.trim()) || '').trim()}</b><em>${ev.verb}</em></span>
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
@@ -109,10 +121,11 @@ function queueWindow(live) {
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
@@ -128,11 +141,12 @@ function NowShowing({ live, cap, onEdit, onEditDates, onRemove }) {
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
@@ -145,10 +159,10 @@ function NowShowing({ live, cap, onEdit, onEditDates, onRemove }) {
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
@@ -166,7 +180,7 @@ function NowShowing({ live, cap, onEdit, onEditDates, onRemove }) {
                     })}
                 </div>`}
             </div>
-            <${ChangesAhead} all=${live} />
+            <${ChangesAhead} all=${live} b3extra=${b3forever.length ? html`<${ForeverAhead} list=${b3forever} accentOf=${accentOf} daysBetween=${daysBetween} csrfToken=${b3.csrfToken} overlay=${b3.overlay} onStaged=${b3.onStaged} />` : null} />
         </div>
     `;
 }
@@ -192,7 +206,7 @@ function airtimeWindow(all, todayIso) {
  * different strings truncated to the same string is still well-formed text. A shared opener is not
  * a seeding artefact either: a house style ("PSA:", "[Maintenance]") collides in exactly the same
  * way. Strip whatever prefix ALL of them share, back off to a word boundary, then truncate. */
-function commonPrefix(list) {
+export function commonPrefix(list) {
     if (list.length < 2) return '';
     let n = 0;
     while (n < list[0].length && list.every((t) => t[n] === list[0][n])) n++;
@@ -200,7 +214,7 @@ function commonPrefix(list) {
     return list[0].slice(0, n);
 }
 // A leading "# ..." is a Discord heading, not part of the name -- the queue preview already treats it that way, so the axis has to as well or the same announcement is called two different things on two views of one page.
-const bareText = (t) => String(t || '').replace(/^#{1,3}\s+/, '');
+const bareText = (t) => (String(t || '').replace(/^#{1,3}\s+/gm, '').split('\n').find((l) => l.trim()) || '').trim();
 
 // ⚠️ htm DELETES THE SPACE BEFORE AN INLINE TAG WHEN A NEWLINE SITS THERE. A whitespace-only chunk that spans a line break is dropped, so wrapping a paragraph's source at a tag boundary renders "otherwise atcreatedAt" on screen while the source reads correctly -- and every text comparison in this repo normalises whitespace before comparing, so nothing but the overlay could see it. Prose containing inline tags stays on one physical line. ⚠️ AIRTIME RENDERS NO PANEL AND NO HEADING OF ITS OWN. It is one of the realm view panel's two views, exactly as the delivery queue is, so its chrome is the Shell's `.ph` -- the realm title, the view tabs, the key and the meta line. It used to open its own `div.panel` with its own `Airtime` heading and date range inside the Shell's panel, which titled the view twice, indented the content by a second gutter (the racknote wrapped to two lines at 585px narrower) and made the page 78px taller than the design's.
 function Airtime({ all }) {
@@ -254,7 +268,7 @@ function Airtime({ all }) {
 }
 
 // The proactive data-quality callout from 05-door-broadcast-ops.html. It names the specific announcement and the specific number rather than warning in the abstract -- an "announcements can stay up forever" notice teaches nothing, "this one has been up 19 days" is actionable.
-function HeadsUp({ all, onSetEnd }) {
+export function HeadsUp({ all, onSetEnd }) {
     const forever = all.filter((a) => a.state === 'live' && !a.expiresAt)
         .map((a) => ({ ...a, days: daysBetween(a.createdAt, Date.now()) }))
         .sort((a, b) => b.days - a.days);
@@ -277,13 +291,21 @@ function HeadsUp({ all, onSetEnd }) {
 }
 
 // The shared 6,000-character embed budget every live post competes for (Discord's real limit on total embed content in one message, measured 2026-09-13; §10.3 row 10). Excludes whatever announcement is currently open in the composer, so editing one doesn't count its own old text against its new length.
-const EMBED_BUDGET = 6000;
+export const EMBED_BUDGET = 6000;
+// 2026-09-26 21:19 EDT: the bot's embed description is the text plus "\n\n-# Posted <t:UNIX:R>" (utils/announcement.js buildAnnouncementEmbed), 28 characters
+// with a 10-digit time, and Discord counts the whole description toward the 6,000 (its docs, Embed Limits). So every post costs 28 more than its text.
+export const POSTED_LINE = 28;
+export function liveSegs(all, excludeId = null) {
+    return (all || []).filter((a) => a.state === 'live' && String(a.id || a._id) !== String(excludeId || ''))
+        .map((a) => ({ n: (a.text || '').length + POSTED_LINE, c: accentOf(a) }));
+}
 function otherLiveLength(all, excludeId) {
     return (all || [])
         .filter((a) => a.state === 'live' && String(a.id || a._id) !== String(excludeId || ''))
-        .reduce((sum, a) => sum + (a.text || '').length, 0);
+        .reduce((sum, a) => sum + (a.text || '').length + POSTED_LINE, 0);
 }
 
+
 // The Show-each-player stepper's card glyphs (§10.3 row 3) — one small raised tile per showing.
 function RepeatGlyphs({ n }) {
     const count = Math.max(1, Number(n) || 1);
@@ -297,131 +319,206 @@ function RepeatGlyphs({ n }) {
 // Mirrors /manage's real post-announcement modal (text/expiry) plus startsAt, a banner image and a repeat count (pins batch 2, spec §7/§10.3). The Discord-side fields stay authoritative for what the server accepts; this drawer is the richer web equivalent, built per the pins-2 design board (G8).
 //
 // ⚠️ EDIT AND POST SHARE ONE FORM. `initial` is the announcement object when opened from Broadcast's "Edit"/"Dates and repeats" buttons or HeadsUp's "Set an end date" (null when opened from "+ Post announcement") — pre-fills every field and switches submit() to an announcement.edit op that carries bannerImageUrl and repeatCount (row 8: an edit that omits them would silently wipe them, see core/ops/announcements.js's apply()).
-function PostForm({ initial, allAnnouncements, onSubmit, onCancel }) {
-    const editing = Boolean(initial);
+// 2026-09-21 19:21 EDT — `again`: an Ended announcement opens here to be POSTED AGAIN — its fields prefilled, a new post staged, no edit of the old one.
+export function PostForm({ initial, again = false, allAnnouncements, onSubmit, onCancel }) {
+    const editing = Boolean(initial) && !again;
     const [text, setText] = useState(initial?.text || '');
-    const [startsAt, setStartsAt] = useState('');
-    const [startsIso, setStartsIso] = useState(initial?.startsAt ? String(initial.startsAt).slice(0, 10) : null);
-    const [expiresAt, setExpiresAt] = useState('');
-    const [expiresIso, setExpiresIso] = useState(initial?.expiresAt ? String(initial.expiresAt).slice(0, 10) : null);
+    // 2026-09-27 22:58 EDT (found opening Edit at 2x): an edit opened with EMPTY date fields, and BoardDate's empty-field branch then cleared the iso it was given —
+    // so Edit showed "Optional / In 60 days" for a post ending Dec 31, and staging it would have sent no end. The fields open on the words of the dates it has.
+    const dayWords = (v) => new Date(v).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');
+    const [startsAt, setStartsAt] = useState(!again && initial?.startsAt ? dayWords(initial.startsAt) : '');
+    const [startsIso, setStartsIso] = useState(!again && initial?.startsAt ? String(initial.startsAt).slice(0, 10) : null);
+    const [expiresAt, setExpiresAt] = useState(!again && initial?.expiresAt ? dayWords(initial.expiresAt) : '');
+    const [expiresIso, setExpiresIso] = useState(!again && initial?.expiresAt ? String(initial.expiresAt).slice(0, 10) : null);
     // "Never ends" is its own switch (row 1, G8) rather than inferred from a blank field, because blank and never are two different real values now (see broadcast.logic.js's buildBroadcastComposerOp).
     const [neverEnds, setNeverEnds] = useState(Boolean(editing && initial && !initial.expiresAt));
-    const [bannerLink, setBannerLink] = useState(initial?.bannerImageUrl || '');
-    const [bannerBroken, setBannerBroken] = useState(false);
-    const [bannerDims, setBannerDims] = useState(null);
+    // 2026-09-25 00:29 EDT: the banner is the build drawer's image well — an upload or a link — so its state is that well's shape
+    const [bn, setBn] = useState({ imageMethod: initial?.bannerImageUrl ? 'link' : 'up', imageLink: initial?.bannerImageUrl || '', fileName: '', fileSize: '', filePreview: '' });
+    const setBanner = (p) => setBn((o) => ({ ...o, ...p }));
+    const bannerUrl = (bn.imageMethod === 'link' ? bn.imageLink : bn.filePreview || '').trim();
+    // 2026-09-25 01:22 EDT: the card's banner needs its own load state — a link that 404s drew an empty 148px box between the body and the footer (the sweep before v23)
+    const [bannerBad, setBannerBad] = useState(false);
+    useEffect(() => { setBannerBad(false); }, [bannerUrl]);
     const [repeatCount, setRepeatCount] = useState(initial?.repeatCount || 1);
+    // 2026-09-27 21:42 EDT (his v36 intake): the accent is chosen here. A NEW post opens on a fresh colour every time, as the bot would mint one; Edit and Post it again keep
+    // the one it has. The card preview, the text box and this post's share of the budget all wear it — never the realm's pink.
+    const [color, setColor] = useState(() => (typeof initial?.color === 'number' ? initial.color : randomAccent()));
+    const [autoColor, setAutoColor] = useState(!(initial && typeof initial.color === 'number'));
+    const accent = hexOf(color);
+    // The text box is the queue card's quote box (his: "the list design we already use in the announcement card (preview + footer)"): folded, it wears the
+    // accent as the card does; open — by Expand or by typing in it — it is the fields' black with the focus glow round the whole box. Folded each time the drawer opens.
+    const [tbOpen, setTbOpen] = useState(false);
+    const [tbFocus, setTbFocus] = useState(false);
+    const [clamps, setClamps] = useState(false);
+    const taRef = useRef(null);
+    const twinRef = useRef(null);
+    const expanded = tbOpen || tbFocus;
+    useLayoutEffect(() => {
+        const t = taRef.current;
+        if (!t) return;
+        const cs = getComputedStyle(t);
+        const two = parseFloat(cs.lineHeight) * 2 + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
+        // measured on a hidden twin, so the box's own height never passes through 'auto' and the fold animates between two real heights
+        const ch = twinRef.current ? twinRef.current.scrollHeight : t.scrollHeight;
+        setClamps(ch > two + 2);
+        t.style.height = `${expanded ? Math.max(150, ch) : two}px`;
+    }, [text, expanded]);
+    // It opens when a person reaches for it — a press in the box, a key in it, Expand — never on the drawer's own focus on open, so it is folded each time
+    // the drawer opens. Collapse folds it without taking the caret away (a blur would hand focus back to the drawer's first field: this one).
+    const fold = () => { if (expanded) { setTbOpen(false); setTbFocus(false); } else { setTbOpen(true); if (taRef.current) taRef.current.focus(); } };
     const [busy, setBusy] = useState(false);
 
-    useEffect(() => { setBannerBroken(false); setBannerDims(null); }, [bannerLink]);
-
     const unresolved = [startsAt.trim() && !startsIso ? 'the start' : '', (!neverEnds && expiresAt.trim() && !expiresIso) ? 'the end' : ''].filter(Boolean);
-    const ready = text.trim() && !unresolved.length && !busy;
+    // 2026-09-26 20:01 EDT (harden): Discord's modal caps /manage's announcement at 4,000 and the embed description at 4,096 (commands/manage.js), and core's
+    // (2026-09-26 21:19 EDT: the description also carries the 28-character Posted line, so the text's real delivery cap is 4,068, and a post past it is rejected with
+    // every other post in the same reply — 4,000 keeps a margin under both.)
+    // validatePost checks no length — so a longer post staged here could never be edited in /manage and would fail at delivery. Past 4,000 blocks.
+    const TEXT_MAX = 4000;
+    const overText = text.length > TEXT_MAX;
+    const ready = text.trim() && !unresolved.length && !overText && !busy;
 
     const otherLen = otherLiveLength(allAnnouncements, initial?.id || initial?._id);
-    const thisLen = text.length;
+    const thisLen = text.length + POSTED_LINE;
     const totalLen = otherLen + thisLen;
     const overBudget = totalLen > EMBED_BUDGET;
+    // the rows of the Before staging panel: text (needed, and within 4,000), the dates (readable), the shared budget (a warning only)
+    const checks = [
+        { k: 'text', to: 'post-text', label: 'Text', tone: !text.trim() || overText ? 'warn' : 'ok',
+          say: !text.trim() ? 'Needs its text' : overText ? `${(text.length - TEXT_MAX).toLocaleString()} over the ${TEXT_MAX.toLocaleString()}-character limit` : `${text.length.toLocaleString()} of ${TEXT_MAX.toLocaleString()} characters` },
+        { k: 'dates', to: unresolved[0] === 'the end' ? 'post-ends' : 'post-starts', label: 'Dates', tone: unresolved.length ? 'warn' : 'ok',
+          say: unresolved.length ? `Needs a readable date for ${unresolved[0]}` : 'Readable' },
+        { k: 'budget', to: 'post-text', label: 'Delivery', tone: overBudget ? 'caution' : 'ok',
+          say: overBudget ? `With the live posts, ${(totalLen - EMBED_BUDGET).toLocaleString()} over the ${EMBED_BUDGET.toLocaleString()} one message carries` : 'Fits in one message with the live posts' },
+    ];
 
     function submit() {
         setBusy(true);
         const fields = {
             text,
             startsAt: startsIso || null,
-            bannerImageUrl: bannerLink.trim() || null,
+            bannerImageUrl: bannerUrl || null,
             repeatCount,
+            color,
             // undefined (blank, omit the key) | null (Never ends) | an ISO string (a resolved date).
             expiresAt: neverEnds ? null : (expiresIso || undefined),
         };
-        const op = buildBroadcastComposerOp(fields, initial);
+        const op = buildBroadcastComposerOp(fields, editing ? initial : null);
         Promise.resolve(onSubmit(op)).then((ok) => { if (ok === false) setBusy(false); });
     }
 
+    // 2026-09-29 13:23 EDT (his V40 class T, "i've already asked 2-3 times"): Text, Accent and Banner are SECTIONS, headed as the build drawer heads Build — the .f-h
+    // heading, its size and its rule running to the right, its state chip beside it. Starts, Ends and Show each player stay field labels.
+    // 🔴 BOARD 1 · G8, AS DRAWN (Board 4: Collective, 2026-09-21 12:32 EDT). Session 2's port of this drawer kept the fields and lost the design:
+    // no thumbnail beside the banner link, no echo under either date, a checkbox where the board has a switch, a thin budget line with
+    // its figure on the wrong side, one pink square for the showings, and a preview that printed the raw markdown. This is board 1's
+    // markup, class for class, wired to the same state and the same op builder; its look is b1.css (board 1's own rules, scoped .b1).
+    const lines = text.split('\n'); const head = /^#{1,3}\s+/.test(lines[0] || '') ? lines[0].replace(/^#{1,3}\s+/, '') : '';
+    const body = (head ? lines.slice(1) : lines).join('\n').trim();
+    const withCode = (t) => t.split(/(\/[a-z][\w-]*(?:\s[a-z][\w-]*)?)/g).map((part, i) => (i % 2 ? html`<code key=${i}>${part}</code>` : part));
+    const shown = Math.max(1, repeatCount);
+    const [smin, setSmin] = useStageMin();
+    const blockN = checks.filter((c) => c.tone === 'warn').length;
     return html`
-        <${Drawer} eyebrow=${editing ? 'announcement.edit · tier 1' : 'announcement.post · tier 1'}
-                   title=${editing ? 'Edit announcement' : 'Post an announcement'} wide onClose=${onCancel}
+        <${Drawer} cls="b1"
+                   title=${again ? 'Post it again' : editing ? 'Edit announcement' : 'Post an announcement'} wide onClose=${onCancel}
                    actions=${html`
-                       <span role="status" class=${'why' + (text.trim() ? '' : ' blocked')}>${!text.trim() ? 'Write the announcement first.'
-                           : ready ? 'Stages one operation. Nothing reaches a player until you commit it on Review.'
-                           : unresolved.length ? `${unresolved.join(' and ')} ${unresolved.length > 1 ? 'are' : 'is'} not a date yet` : ''}</span>
-                       <button class="btn" onClick=${onCancel}>Cancel</button>
-                       <button class="btn go" disabled=${!ready} onClick=${submit}>${busy ? 'Staging…' : (editing ? 'Stage this edit' : 'Stage post')}</button>`}>
-            <div class="dwbody bcast-composer">
-                <div class="bed-main">
-                    <div class="dwfield"><label for="post-text">Text</label>
-                        <textarea id="post-text" rows="4" placeholder="Type a # heading on the first line if you want one."
-                                  value=${text} onInput=${(e) => setText(e.target.value)}></textarea>
-                        <div class=${'cmeter bcast' + (overBudget ? ' bad' : '')}>
-                            <i style=${`width:${Math.min(100, (otherLen / EMBED_BUDGET) * 100)}%;opacity:.38`}></i>
-                            <i style=${`width:${Math.min(100 - Math.min(100, (otherLen / EMBED_BUDGET) * 100), (thisLen / EMBED_BUDGET) * 100)}%;margin-left:${Math.min(100, (otherLen / EMBED_BUDGET) * 100)}%`}></i>
-                        </div>
-                        <span class=${'meter-note' + (overBudget ? ' bad' : '')}>${Math.max(0, EMBED_BUDGET - totalLen)} of ${EMBED_BUDGET} left</span>
-                    </div>
-
-                    <div class="dwfield"><label for="post-banner">Banner</label>
-                        <div class="banner-row">
-                            <input id="post-banner" value=${bannerLink} placeholder="https://…" autocomplete="off" spellcheck="false"
-                                   onInput=${(e) => setBannerLink(e.target.value)} />
-                            ${bannerLink.trim() ? html`
-                                <div class=${'banner-thumb' + (bannerBroken ? ' bad' : '')}>
-                                    <img src=${bannerLink.trim()} alt=""
-                                         onLoad=${(e) => setBannerDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
-                                         onError=${() => setBannerBroken(true)} />
-                                </div>` : null}
-                        </div>
-                        ${bannerLink.trim() ? html`
-                            <span class=${'banner-echo' + (bannerBroken ? ' bad' : '')}>${bannerBroken ? "didn't load" : (bannerDims ? `✓ ${bannerDims.w} × ${bannerDims.h}` : '')}</span>` : null}
-                    </div>
-
-                    <div class="dw-grid2 bcast-dates">
-                        <${SmartDate} chrome="drawer" id="post-starts" label="Starts"
-                                      placeholder="in 3 days, or Sep 21"
-                                      value=${startsAt} iso=${startsIso}
+                       <${StageMini} tone=${blockN ? 'warn' : 'ok'} say=${blockN ? `Before staging: ${checks.filter((c) => c.tone === 'warn').map((c) => c.say.toLowerCase()).join(' · ')}` : 'Ready to stage'} />
+                       <button class="b3-btn2" onClick=${onCancel}>Cancel</button>
+                       <button class="b3-btn2 go" disabled=${!ready} onClick=${submit}>${busy ? 'Staging…' : (editing ? 'Stage this edit' : 'Stage post')}</button>`}>
+            <div class="bed">
+                <div class="pb-col b3-fady">
+                    <div class="dwfield pb-txf"><h4 class="f-h pb-sech"><span><label for="post-text">Text</label></span>${!text.trim() ? html`<${Chip} tone="warn" icon="triangle-alert">Required<//>` : overText ? html`<${Chip} tone="warn" icon="triangle-alert">Over ${TEXT_MAX.toLocaleString()}<//>` : html`<span class="f-okm" title="Filled"><${Icon} name="check" /></span>`}</h4>
+                        <div class=${'pb-enc b4-tb' + (expanded ? ' b4-tbx' : '') + (clamps && !expanded ? ' b4-tbclip' : '')} style=${`--c:${accent}`} onPointerDown=${(e) => { if (e.target.closest('.b4-fold') || expanded) return; setTbFocus(true); requestAnimationFrame(() => { if (taRef.current) taRef.current.focus(); }); }}>
+                            <textarea id="post-text" ref=${taRef} rows="2" placeholder="Type a # heading on the first line if you want one."
+                                      value=${text} onInput=${(e) => { setText(e.target.value); setTbFocus(true); }} onKeyDown=${(e) => { if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') setTbFocus(true); }} onBlur=${() => setTbFocus(false)}></textarea>
+                            <textarea class="b4-tbm" ref=${twinRef} aria-hidden="true" tabindex="-1" readonly value=${text}></textarea>
+                            <div class="pb-encf">
+                                <div class="b4-tbc"><${CharCount} n=${text.length} cap=${TEXT_MAX} warnAt=${3600} />
+                                    <div class=${'pb-meter2 g-fact b3-cc' + (overBudget ? ' over' : '')} aria-label="Delivery budget, each live post in its colour"><${Icon} name="text" />
+                                        <${BudgetMeter} segs=${[...liveSegs(allAnnouncements, initial?.id || initial?._id), { n: thisLen, c: accent }]} total=${EMBED_BUDGET} />
+                                        <${BudgetReadout} used=${totalLen} total=${EMBED_BUDGET} /></div></div>
+                                ${clamps ? html`<${FoldBtn} open=${expanded} onMouseDown=${(e) => e.preventDefault()} onClick=${(e) => { e.stopPropagation(); fold(); }} />` : null}
+                            </div></div></div>
+                    <div class="dw-grid2" style="gap:0 16px">
+                        <${BoardDate} id="post-starts" label="Starts" opt=${!startsAt.trim()} placeholder="Now" hint=${typeof window !== 'undefined' && window.B4_COLLECTIVE ? { icon: 'radio', v: 'Now', q: 'when you commit it' } : null}
+                                      rel=${(i) => { const d = Math.round((new Date(`${i}T12:00:00`) - new Date(`${isoLocal()}T12:00:00`)) / 864e5); return d <= 0 ? 'live today' : d === 1 ? 'live tomorrow' : `live in ${d} days`; }}
+                                      min=${isoLocal()} value=${startsAt} iso=${startsIso}
                                       onChange=${(v, i) => { setStartsAt(v); setStartsIso(i); }} />
-                        <div class="dwfield ends-field">
-                            <label for="post-expires"><span>Ends</span>${' '}
-                                <label class="seg-sw-inline">
-                                    <input type="checkbox" checked=${neverEnds} onChange=${(e) => setNeverEnds(e.target.checked)} />
-                                    <span>Never ends</span>
-                                </label>
-                            </label>
-                            ${neverEnds
-                                ? html`<div class="never-ends-field"><span>Stays up until you remove it</span></div>`
-                                : html`<${SmartDate} chrome="drawer" id="post-expires" label=""
-                                                     placeholder="Sep 21"
-                                                     value=${expiresAt} iso=${expiresIso}
-                                                     onChange=${(v, i) => { setExpiresAt(v); setExpiresIso(i); }} />`}
-                        </div>
-                    </div>
-
-                    <div class="dwfield"><label>Show each player</label>
-                        <div class="repeat-row">
-                            <div class="stepper">
-                                <button type="button" class="step-btn" disabled=${repeatCount <= 1}
-                                        onClick=${() => setRepeatCount(Math.max(1, repeatCount - 1))}>−</button>
-                                <span class="step-val">${repeatCount}</span>
-                                <button type="button" class="step-btn" onClick=${() => setRepeatCount(repeatCount + 1)}>+</button>
-                            </div>
-                            <${RepeatGlyphs} n=${repeatCount} />
-                            <span class="clock-tag"><${Icon} name="clock" cls="sm" />1 a day max</span>
-                        </div>
+                        <${BoardDate} id="post-expires" label="Ends" opt=${!expiresAt.trim() && !neverEnds} placeholder=${typeof window !== 'undefined' && window.B4_COLLECTIVE ? 'In 60 days' : 'Blank'}
+                                      hint=${typeof window !== 'undefined' && window.B4_COLLECTIVE ? { icon: 'clock', v: new Date(new Date(startsIso ? startsIso + 'T12:00:00Z' : Date.now()).getTime() + 60 * 864e5).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', ''), q: '60 days after it starts' } : null}
+                                      rel=${(i) => { const d = Math.round((new Date(`${i}T12:00:00`) - new Date(`${startsIso || isoLocal()}T12:00:00`)) / 864e5); return d <= 0 ? 'ends the day it starts' : `shows for ${d} day${d === 1 ? '' : 's'}`; }}
+                                      min=${startsIso || isoLocal()} value=${expiresAt} iso=${expiresIso} never=${neverEnds}
+                                      onChange=${(v, i) => { setExpiresAt(v); setExpiresIso(i); }}
+                                      right=${html`<button type="button" class="pb-sw" role="switch" aria-checked=${neverEnds ? 'true' : 'false'} onClick=${() => setNeverEnds(!neverEnds)}><span class="pb-swt"><i></i></span>Never ends</button>`} />
                     </div>
+                    <div class="dwfield"><div class="pb-lrow"><label>Show each player</label></div>
+                        <div class="pb-rep">
+                            <${Stepper} value=${repeatCount} onChange=${setRepeatCount} />
+                            <span class="pb-gapday"><${Icon} name="repeat" />1 a day max</span></div></div>
+                    <div class="dwfield pb-accf"><h4 class="f-h pb-sech"><span><label for="post-accent">Accent</label></span>${autoColor ? html`<${Chip} tone="neutral">Auto<//>` : null}${accentTooDark(color) ? html`<${Chip} tone="warn" icon="triangle-alert">Hard to see<//>` : null}</h4>
+                        <${AccentBlock} id="post-accent" value=${color} onChange=${(n) => { setColor(n); setAutoColor(false); }} /></div>
+                    <div class="dwfield pb-bnf"><h4 class="f-h pb-sech"><span><label>Banner</label></span>${!bannerUrl ? html`<${Chip} tone="neutral">Optional<//>` : null}</h4>
+                        <${MediaWell} f=${bn} set=${setBanner} id="post-banner" sources=${['up', 'link']} keyed=${false} what="an image" /></div>
                 </div>
-                <aside class="bed-side">
-                    <div class="bed-sec">
-                        <h5>In Discord</h5>
-                        ${text.trim() ? html`
-                            <div class="post-prev">
-                                ${bannerLink.trim() && !bannerBroken ? html`<img class="post-prev-banner" src=${bannerLink.trim()} alt="" />` : null}
-                                <p class="post-prev-text">${text.length > 240 ? `${text.slice(0, 240)}…` : text}</p>
-                                <span class="post-prev-when">${startsIso ? `Posts ${startsIso}` : 'Posts now'}</span>
-                            </div>` : html`<p class="empty">Type the announcement and the card builds itself here.</p>`}
-                    </div>
-                </aside>
+                <aside class="bed-side pb-card"><div class="bed-sec f-prev"><h5>In Discord</h5><div class="f-prevsc b3-fady">
+                    ${text.trim() ? html`
+                        <div class="dcard" style=${`--c:${accent}`}>${head ? html`<div class="pb-h">${head}</div>` : null}
+                            ${body ? html`<p>${withCode(body)}</p>` : null}
+                            ${bannerUrl ? html`<div class=${'pb-img2' + (bannerBad ? ' pb-bad' : '')} style=${!bannerBad ? `background-image:url(${JSON.stringify(bannerUrl)});background-size:cover;background-position:center` : null}>${bannerBad ? html`<${Icon} name="image" cls="xl" />` : html`<img src=${bannerUrl} alt="" style="display:none" onError=${() => setBannerBad(true)} />`}</div>` : null}
+                            <div class="pb-ts">${startsIso ? `Posted ${new Date(startsIso + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Posted now'}</div></div>`
+                        : (typeof window !== 'undefined' && window.B4_COLLECTIVE) ? html`<div class="b4-ghostcard" aria-hidden="true"><div class="dcard" style=${`--c:${accent}`}><div class="pb-h">The first line becomes the title</div><p>Everything under it is the body, and <code>/draw prices</code> shows as a command.</p><div class="pb-ts">Posted now</div></div></div><p class="empty">Type the announcement and the card builds itself here.</p>`
+                        : html`<p class="empty">Type the announcement and the card builds itself here.</p>`}
+                </div></div>
+                ${''/* 2026-09-26 20:03 EDT (harden): what stands between this post and Stage, as the build drawer says it — the side column's Before staging panel
+                     (.f-stage, b4/form.js), one row per check with the same marks; a row jumps to its field. The footer holds only the buttons. */}
+                <div class=${'f-stage pb-ready' + (smin ? ' min' : '')} role="status" aria-live="polite" inert=${smin ? true : null}>
+                    <h5><span>${!ready && !busy ? 'Before staging' : 'Ready to stage'}</span><${StageMinBtn} onMin=${() => setSmin(true)} /></h5>
+                    <ul>${checks.map((c) => html`<li key=${c.k}><button type="button" class="f-st" onClick=${() => { const el = document.getElementById(c.to); if (el) el.focus(); }}
+                            aria-label=${`${c.label}: ${c.say}`}>
+                        <span class="f-stm" data-tone=${c.tone}><${Icon} name=${c.tone === 'ok' ? 'check' : 'triangle-alert'} /></span>
+                        <span class="f-stn"><b>${c.label}</b></span><span class="f-stw" data-tone=${c.tone}>${c.say}</span></button></li>`)}</ul>
+                </div></aside>
             </div>
         <//>
     `;
 }
 
+// A date field as board 1 · G8 draws it: the label row (with an optional control on its right), the input, and the echo of what the
+// server resolved — ✓ and the day in the ok colour, or the default in dim. Same server parse and debounce as SmartDate.
+function BoardDate({ id, label, placeholder, value, iso, onChange, right = null, never = false, dflt = null, opt = false, hint = null, rel = null, min = '' }) {
+    const latest = { current: value };
+    const pop = usePop({ w: 270, align: right ? 'end' : 'start' });
+    const picked = useRef('');
+    // 2026-09-27 18:52 EDT: a picked day writes its own words into the field AND its iso, so it is never sent back through the parser
+    const pick = (s) => { pop.close(); if (!s) { picked.current = ''; onChange('', null); return; } const t = new Date(`${s}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', ''); picked.current = t; onChange(t, s); };
+    useEffect(() => {
+        const raw = String(value || '').trim();
+        if (!raw) { onChange(value, null); return undefined; }
+        if (raw === picked.current) return undefined;
+        const t = setTimeout(() => { fetchJson(`/api/parse-date?q=${encodeURIComponent(raw)}`).then((d) => { if (latest.current === value) onChange(value, d.iso || null); }).catch(() => {}); }, 220);
+        return () => clearTimeout(t);
+    }, [value]);
+    const raw = String(value || '').trim();
+    const day = (i) => new Date(i + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).replace(',', '');
+    // 2026-09-27 21:42 EDT (his v36 intake: "i want the *design* of Start/End's hints to be improved"): the line under a date is a READOUT, not a sentence — the date
+    // it resolves to first, in ink, then what that means, after a hairline: "Now | goes live when you commit it", "✓ Fri Oct 2 | goes live in 5 days",
+    // "Thu Nov 26 | 60 days after it starts". Its mark carries the state: neutral, ok, or warn with the value in warn ink.
+    const echo = (tone, icon, v, q) => html`<span class="pb-echo b4-echo" data-tone=${tone}><${Icon} name=${icon} /><b>${v}</b>${q ? html`<i aria-hidden="true"></i><span>${q}</span>` : null}</span>`;
+    const mark = !raw ? (opt ? html`<${Chip} tone="neutral">Optional<//>` : null) : iso ? html`<span class="f-okm" title="Readable"><${Icon} name="check" /></span>` : html`<${Chip} tone="warn">Can't read<//>`;
+    return html`
+        <div class=${'dwfield' + (right ? ' pb-endf' : '')} data-never=${never ? 'true' : 'false'}>
+            <div class="pb-lrow"><label for=${id}>${label}</label>${never ? null : mark}${right}</div>
+            ${never ? html`<div class="pb-neverval" style="display:flex"><${Icon} name="infinity" />Stays up until you remove it</div>`
+                : html`<div class="pb-dfld" ref=${pop.wrap}><input id=${id} type="text" autocomplete="off" spellcheck="false" placeholder=${placeholder} value=${value}
+                        onInput=${(e) => onChange(e.target.value, null)} onKeyDown=${(e) => { if (e.key === 'ArrowDown' && !pop.open) { e.preventDefault(); pop.setOpen(true); } }} />
+                    <button type="button" class="pb-dbtn" ref=${pop.btn} aria-label=${`Pick the ${label.toLowerCase()} date`} aria-expanded=${pop.open ? 'true' : 'false'} aria-haspopup="dialog" onClick=${() => pop.setOpen(!pop.open)}><${Icon} name="calendar-days" /></button>
+                    ${pop.open ? html`<div class="b3-datepop b4-pop fixed" ref=${pop.pop} style="width:270px" role="dialog" aria-label=${`${label} date`}>
+                        <${DateGrid} value=${iso || ''} min=${min} onPick=${pick} /></div>` : null}</div>`}
+            ${never ? null : !raw ? (hint ? echo('neutral', hint.icon, hint.v, hint.q) : null)
+                : iso ? echo('ok', 'check', day(iso), rel ? rel(iso) : null) : echo('warn', 'triangle-alert', 'Try “Friday” or “Oct 2”', null)}
+        </div>`;
+}
+
 // 🔴 AIRTIME PAINTS THREE BAR STATES AND NAMED NONE OF THEM. Solid is showing, hollow-dashed is scheduled, muted is over -- the same shape vocabulary the Track uses, and a reader met it with no key. ⚠️ Deliberately NOT the shared StateKey: that one teaches "dashed = staged", and here a dashed bar means an announcement that is written and simply has not started yet. Same shape, a neighbouring meaning, and the wrong word would be worse than no word.
 //
 // ⚠️ It names only states PRESENT on screen, the rule every key in this portal follows: a season with nothing scheduled should not send somebody hunting for a dashed bar that is not drawn.
@@ -431,6 +528,7 @@ export function BroadcastRealm({ session }) {
     const [notice, setNotice] = useState('');
     const [view, setView] = useState('Delivery queue');
     const overlay = useOverlay();
+    const p8 = useB3('p8');
 
 // 🔴 TWO REALMS COULD STAGE WORK AND NEITHER COULD TELL YOU IT HAD ANY. Season and Home both read /api/review to say how much is waiting — that is what feeds the rail's badge and the masthead's staged figure — and Armory and Broadcast, which stage on every edit, said nothing anywhere. You staged four builds, navigated away, and the console had no memory of it outside the Review screen.
 //
@@ -546,13 +644,13 @@ export function BroadcastRealm({ session }) {
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

## `ui/exportPanel.js` → `portal/ui/exportPanel.js`

```diff
diff --git aportal/ui/exportPanel.js bkit/ui/exportPanel.js
index 5c86b804..0c44c881 100644
--- aportal/ui/exportPanel.js	
+++ bkit/ui/exportPanel.js	
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

## `ui/history.js` → `portal/ui/history.js`

```diff
diff --git aportal/ui/history.js bkit/ui/history.js
index 1cbbf4f2..1aab4e9f 100644
--- aportal/ui/history.js	
+++ bkit/ui/history.js	
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

## `ui/icons.js` → `portal/ui/icons.js`

```diff
diff --git aportal/ui/icons.js bkit/ui/icons.js
index 70aca763..97ed1396 100644
--- aportal/ui/icons.js	
+++ bkit/ui/icons.js	
@@ -7,9 +7,44 @@
 // Every icon inherits currentColor and is 1em square (see .ic in shell.css), so it sits in text without a fight. Decorative by default — an icon beside a word is not read twice; pass `label` only when the icon is the ONLY thing carrying the meaning.
 import { h } from '../vendor/preact.mjs';
 import { html } from '../vendor/htm-preact.mjs';
+import { b3, useB3 } from '../b3/state.js';
 
 // Lucide path data, verbatim. Keep Lucide's own names so a swap or an addition is a lookup rather than a guess.
 const PATHS = {
+    // Board 3 v2 — icons the proposals need that the portal sprite lacks (Lucide, MIT).
+    'search': '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
+    // Board 4 · v11 (2026-09-22): the media well's sources (Lucide, MIT).
+    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
+    'upload': '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
+    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
+    'undo-2': '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
+    'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
+    'bot': '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
+    'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
+    'bookmark': '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
+    'rotate-cw': '<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>',
+    'tag': '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
+    'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
+    'chevrons-down-up': '<path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/>',
+    'list-checks': '<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>',
+    'code': '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
+    'corner-down-left': '<path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/>',
+    'pencil': '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
+    'repeat': '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
+    'shuffle': '<path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-7.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/>',
+    'calendar-clock': '<path d="M16 14v2.2l1.6 1"/><path d="M16 2v4"/><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M3 10h5"/><path d="M8 2v4"/><circle cx="16" cy="16" r="6"/>',
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
@@ -39,14 +74,56 @@ const PATHS = {
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
+    // v19 (his intake, 2026-09-24 13:48 EDT): the code-recognition mark, CAPABLE's mark and ASS's mark. The first two are Lucide's; Lucide draws no
+    // poop, so ASS's is drawn on Lucide's grid in its grammar (a 2px round stroke, three tiers and a curl), and measured beside skull and zap.
+    'wand-sparkles': '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
+    'thumbs-up': '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
+    'poop': '<path d="M5.75 15h12.5a2.75 2.75 0 0 1 0 5.5H5.75a2.75 2.75 0 0 1 0-5.5z"/><path d="M8 10h8a2.5 2.5 0 0 1 0 5H8a2.5 2.5 0 0 1 0-5z"/><path d="M9 10a3 3 0 0 1 3-3c1 0 1.8-.7 1.8-1.7 0-.6-.3-1.2-.7-1.8 2 .3 3.4 1.9 3.4 3.8 0 1.1-.4 2-1 2.7"/>',
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
+// 2026-09-26 11:14 EDT — his EXPANDED marks (his 11:10 EDT: "the same icons but each one has had their strokes expanded"): every stroke is his own outline at
+// his own width, drawn as a fill (docs/pins2/data/2026-09-25-codm-mode-icons/normalized-expanded, same 24-unit grid and centring as the stroke
+// copies). A fill carries his weights exactly (x1.0) and cannot be re-weighted. 2026-09-26 11:43 EDT: his pick over his strokes x1.3 — these ARE the marks now
+// (the stroke copies, the drawing fork and its sprite swap are gone); drawn at 20px in the 22px plate (b4/classes.css).
+// 2026-09-26 11:43 EDT (his "see if you can still improve it to better see the detail"): each drawing scaled up uniformly by 1.1, its longest side 22 of 24
+// units instead of 20 — 10% more of every line, nothing restyled; 23 and 24 were rendered too and touched the plate's ring at 20px.
+// 2026-09-26 12:27 EDT — his FILL marks (docs/pins2/data/2026-09-25-codm-mode-icons/fill-v2, his second fill; the first was removed 2026-09-26 12:48 EDT at his word): the same drawings with their shapes filled solid. His 12:22 EDT
+// "improve the filled variant. and put both on the board for me to check": 2026-09-26 12:53 EDT: his pick over his expanded
+// outlines ("v2 filled looks better. choose that") — these ARE the marks; the fork and the expanded set are gone. Both sets follow one rule — as large as the 20px box allows, width up to 24 units and height up to 22 (23+ put the ink on the
+// plate's 1px ring) — so the wide marks (S&D, DOM, TDM) grow to the box's width. Uniform per mark; nothing is restyled.
+export const MODE_F = {
+    'm-hp': '<g transform="translate(3.269 1.000) scale(0.009865)" style="fill:currentColor;stroke:none;fill-rule:evenodd;clip-rule:evenodd"><path d="M186,700C187,698 189,696 192,695C195,693 198,692 202,692C205,692 209,692 212,694L551,829L523,735C522,732 522,729 522,726C523,722 524,719 526,716C527,714 529,712 531,710C534,708 536,707 539,706C542,705 545,705 549,705C552,706 555,707 558,708L700,800L700,715C700,702 710,692 723,692L860,692C873,692 884,702 884,715L884,888L899,902L914,888L914,715C914,702 925,692 938,692L1076,692C1089,692 1099,702 1099,715L1099,799L1240,708C1249,703 1259,704 1267,710C1274,716 1278,726 1275,735L1247,829L1586,694C1595,690 1606,692 1612,700C1619,707 1620,718 1615,727L1062,1682L1066,1682C1072,1682 1078,1684 1082,1689C1087,1693 1089,1699 1089,1706L1087,1831C1087,1833 1086,1836 1086,1838L935,2259C932,2269 923,2275 913,2275L885,2275C875,2275 866,2269 863,2259L712,1838C712,1836 711,1833 711,1831L709,1706C709,1706 709,1705 709,1705C709,1693 719,1682 732,1682C732,1682 732,1682 732,1682L736,1682L183,727C181,724 180,720 180,717C180,713 180,710 182,707C183,704 184,702 186,700ZM796,1693C797,1693 797,1694 798,1695L820,1734L566,880L556,880C553,880 550,879 547,878L258,762L796,1693ZM876,2156L876,1923L763,1729L756,1729L758,1826L876,2156ZM700,854L585,779L606,849C606,849 606,850 606,851L876,1756L876,1256C876,1254 876,1251 877,1249C878,1247 879,1244 880,1242L915,1197L914,963L899,950L884,963L884,1164C884,1173 878,1182 870,1186C861,1189 851,1187 844,1181L707,1048C703,1043 700,1037 700,1031L700,854ZM1232,880L978,1734L1000,1695C1001,1694 1001,1693 1002,1693L1540,762L1251,878C1248,879 1245,880 1242,880L1232,880ZM1035,1729L922,1923L922,2156L1040,1826L1042,1729L1035,1729ZM1099,854L1099,1031C1099,1036 1097,1041 1095,1045L946,1233L946,1233L922,1264L922,1756L1192,851C1192,850 1192,849 1192,849L1213,779L1099,854ZM126,972L161,1036L230,1011C239,1007 249,1010 256,1016C262,1023 264,1033 260,1042L225,1121L211,1156L204,1176L193,1218L187,1251L182,1282L180,1302L180,1321L182,1352L187,1387L192,1410L202,1444L210,1466L219,1487L223,1496L235,1516L255,1547L279,1577L304,1606L329,1631L345,1645L373,1666L439,1710L476,1641C480,1634 488,1630 496,1629C504,1629 512,1633 516,1640L669,1870C673,1877 674,1887 670,1894C665,1902 657,1907 649,1906L374,1899C366,1899 359,1895 355,1888C351,1881 351,1872 355,1865L379,1820L336,1797C336,1797 336,1797 335,1797L301,1777C301,1777 300,1776 300,1776L264,1753C264,1752 263,1752 263,1752L240,1734C239,1734 239,1734 239,1733L227,1724C227,1724 227,1723 227,1723L206,1704C206,1704 205,1704 205,1704L184,1683C184,1683 184,1682 183,1682L152,1649C152,1648 152,1648 151,1648L122,1611C121,1611 121,1611 121,1610L103,1584C103,1584 102,1584 102,1584L94,1570C94,1570 93,1570 93,1569L78,1542C78,1542 78,1541 77,1541L64,1513C64,1513 64,1512 64,1512L52,1483C52,1483 51,1482 51,1482L37,1438C37,1437 37,1437 37,1437L29,1407C29,1407 29,1406 29,1406L20,1362C20,1362 20,1361 20,1361L16,1332C16,1331 16,1330 16,1330L14,1301C14,1300 14,1299 14,1299L15,1270C15,1270 15,1269 15,1269L18,1227C18,1226 18,1226 18,1226L23,1186C23,1185 23,1185 23,1185L33,1132C33,1132 33,1131 33,1131L41,1102C41,1101 41,1101 41,1100L50,1072C50,1071 50,1071 50,1071L79,989L83,976C86,967 94,961 103,960C112,959 121,963 126,972ZM111,1040L95,1086L86,1114L79,1142L69,1193L64,1231L61,1271L61,1299L62,1326L66,1354L74,1396L82,1424L95,1466L107,1494L119,1520L134,1546L141,1558L159,1583L187,1618L217,1650L238,1670L258,1688L268,1697L291,1714L325,1737L359,1756L422,1790C427,1793 431,1798 433,1804C435,1810 434,1816 431,1822L414,1854L605,1859L499,1698L468,1755C465,1761 459,1765 453,1766C446,1768 440,1767 434,1763L347,1705C346,1705 346,1704 345,1704L316,1682C316,1681 315,1681 315,1681L297,1665C297,1665 296,1664 296,1664L270,1638C270,1638 270,1637 270,1637L244,1607C243,1607 243,1607 243,1606L218,1575C218,1575 217,1574 217,1574L195,1541C195,1541 195,1540 194,1540L182,1519C182,1518 182,1518 182,1517L177,1507C176,1507 176,1506 176,1506L167,1484C166,1484 166,1483 166,1483L158,1459C158,1459 157,1458 157,1458L147,1422C147,1421 147,1421 147,1420L141,1396C141,1395 141,1395 141,1395L136,1358C136,1358 135,1357 135,1357L133,1323C133,1322 133,1322 133,1321L133,1300C133,1299 133,1299 134,1298L135,1277C135,1276 135,1276 136,1275L140,1243C141,1242 141,1242 141,1241L148,1208C148,1208 148,1207 148,1207L159,1164C160,1163 160,1162 160,1162L167,1140C167,1140 168,1139 168,1139L182,1103C182,1103 182,1103 182,1103L195,1073L159,1087C148,1091 136,1086 130,1076L111,1040ZM1715,976L1719,989L1748,1071C1748,1071 1748,1071 1748,1072L1757,1100C1757,1101 1757,1101 1757,1102L1765,1131C1765,1131 1765,1132 1765,1132L1775,1185C1775,1185 1775,1185 1775,1186L1780,1226C1780,1226 1780,1226 1780,1227L1783,1269C1783,1269 1783,1270 1783,1270L1784,1299C1784,1299 1784,1300 1784,1301L1782,1330C1782,1330 1782,1331 1782,1332L1778,1361C1778,1361 1778,1362 1778,1362L1769,1406C1769,1406 1769,1407 1769,1407L1761,1437C1761,1437 1761,1437 1761,1438L1747,1482C1747,1482 1746,1483 1746,1483L1734,1512C1734,1512 1734,1513 1734,1513L1721,1541C1720,1541 1720,1542 1720,1542L1705,1569C1705,1570 1704,1570 1704,1570L1696,1584C1696,1584 1695,1584 1695,1584L1677,1610C1677,1611 1677,1611 1676,1611L1647,1648C1646,1648 1646,1648 1646,1649L1615,1682C1614,1682 1614,1683 1614,1683L1593,1704C1593,1704 1592,1704 1592,1704L1571,1723C1571,1723 1571,1724 1571,1724L1559,1733C1559,1734 1559,1734 1558,1734L1535,1752C1535,1752 1534,1752 1534,1753L1498,1776C1498,1776 1497,1777 1497,1777L1463,1797C1462,1797 1462,1797 1462,1797L1419,1820L1443,1865C1447,1872 1447,1881 1443,1888C1439,1895 1432,1899 1424,1899L1149,1906C1141,1907 1133,1902 1128,1894C1124,1887 1125,1877 1129,1870L1282,1640C1286,1633 1294,1629 1302,1629C1310,1630 1318,1634 1322,1641L1359,1710L1425,1666L1453,1645L1469,1631L1494,1606L1519,1577L1543,1547L1563,1516L1575,1496L1579,1487L1588,1466L1596,1444L1606,1410L1611,1387L1616,1352L1618,1321L1618,1302L1616,1282L1611,1251L1605,1218L1594,1176L1587,1156L1573,1121L1538,1042C1534,1033 1536,1023 1542,1016C1549,1010 1559,1007 1568,1011L1637,1036L1672,972C1677,963 1686,959 1695,960C1704,961 1712,967 1715,976ZM1687,1040L1668,1076C1662,1086 1650,1091 1639,1087L1603,1073L1616,1103C1616,1103 1616,1103 1616,1103L1630,1139C1630,1139 1631,1140 1631,1140L1638,1162C1638,1162 1638,1163 1639,1164L1650,1207C1650,1207 1650,1208 1650,1208L1657,1241C1657,1242 1657,1242 1658,1243L1662,1275C1663,1276 1663,1276 1663,1277L1664,1298C1665,1299 1665,1299 1665,1300L1665,1321C1665,1322 1665,1322 1665,1323L1663,1357C1663,1357 1662,1358 1662,1358L1657,1395C1657,1395 1657,1395 1657,1396L1651,1420C1651,1421 1651,1421 1651,1422L1641,1458C1641,1458 1640,1459 1640,1459L1632,1483C1632,1483 1632,1484 1631,1484L1622,1506C1622,1506 1622,1507 1621,1507L1616,1517C1616,1518 1616,1518 1616,1519L1604,1540C1603,1540 1603,1541 1603,1541L1581,1574C1581,1574 1580,1575 1580,1575L1555,1606C1555,1607 1555,1607 1554,1607L1528,1637C1528,1637 1528,1638 1528,1638L1502,1664C1502,1664 1501,1665 1501,1665L1483,1681C1483,1681 1482,1681 1482,1682L1453,1704C1452,1704 1452,1705 1451,1705L1364,1763C1358,1767 1352,1768 1345,1766C1339,1765 1333,1761 1330,1755L1299,1698L1193,1859L1384,1854L1367,1822C1364,1816 1363,1810 1365,1804C1367,1798 1371,1793 1376,1790L1439,1756L1473,1737L1507,1714L1530,1697L1540,1688L1560,1670L1581,1650L1611,1618L1639,1583L1657,1558L1664,1546L1679,1520L1691,1494L1703,1466L1716,1424L1724,1396L1732,1354L1736,1326L1737,1299L1737,1271L1734,1231L1729,1193L1719,1142L1712,1114L1703,1086L1687,1040ZM623,643L480,172C476,161 481,150 490,145C500,139 511,141 519,149L727,367C731,371 733,376 733,382L742,535L783,535L783,378L751,378C743,378 735,374 731,367C727,360 726,351 730,344L878,58C882,50 890,45 899,45C908,45 916,50 920,58L1068,344C1072,351 1071,360 1067,367C1063,374 1055,378 1047,378L1015,378L1015,535L1056,535L1065,382C1065,376 1067,371 1071,367L1279,149C1287,141 1298,139 1308,145C1317,150 1322,161 1318,172L1175,643C1172,653 1163,659 1153,659L645,659C635,659 626,653 623,643ZM662,613L1136,613L1245,252L1111,393L1101,560C1100,573 1090,582 1078,582L991,582C979,582 968,572 968,559L968,355C968,342 979,331 991,331L1009,331L899,119L789,331L807,331C819,331 830,342 830,355L830,559C830,572 819,582 807,582L720,582C708,582 698,573 697,560L687,393L553,252L662,613Z"/></g>',
+    'm-snd': '<g transform="translate(0.283 1.000) scale(0.011294)" style="fill:currentColor;stroke:none;fill-rule:evenodd;clip-rule:evenodd"><g><path d="M1469,988L1610,1020C1612,1021 1614,1021 1616,1022L1665,1051L1795,1036C1798,1036 1802,1037 1806,1038L2083,1164C2091,1168 2096,1177 2095,1186L2063,1405C2063,1409 2061,1413 2058,1416L2006,1475L1981,1601C1980,1608 1974,1614 1967,1617L870,1959C866,1960 861,1960 857,1959L647,1885C643,1883 640,1881 637,1878L607,1840L461,1831C454,1830 448,1827 445,1821L339,1659C337,1657 336,1654 336,1651L310,1464C309,1458 311,1452 316,1447L358,1403L353,1318C352,1315 353,1313 354,1310L378,1236L234,1126C230,1122 227,1118 226,1112L216,1046L98,982C92,978 88,973 87,966L20,459C19,453 21,446 26,442L129,334L129,256C129,251 130,246 134,242L250,113C254,109 259,106 264,106L1343,12C1346,12 1349,12 1352,13L1433,40C1436,41 1439,43 1441,46L1530,143C1534,147 1535,152 1536,157L1536,211L1634,293C1639,297 1641,304 1641,310L1618,814C1618,821 1614,828 1608,831L1519,885L1516,916C1515,919 1514,923 1512,926L1469,988ZM408,1385L397,1372L399,1394L408,1385ZM467,1628C470,1627 473,1626 476,1626L610,1627L422,1401L353,1474L353,1474L467,1628ZM482,1790L619,1799C624,1799 628,1801 632,1804L645,1669L645,1668L497,1668L482,1790ZM363,1543L376,1641L458,1766L454,1647L363,1543ZM156,365L64,462L108,478C108,478 108,478 108,478L204,383L156,365ZM170,272L170,343C170,348 168,352 165,356L213,374L214,373C214,372 214,371 214,371L219,283L170,272ZM270,153L173,260L221,272C221,271 222,270 222,269L307,182L270,153ZM1390,69L1343,54L280,146L316,174C317,174 317,174 318,174L1390,69ZM1495,223C1495,223 1495,222 1495,221L1494,165L1424,88L345,193L254,281L238,364L295,360L291,323C291,320 292,318 293,316L349,238C350,235 353,234 356,233L1398,134C1402,133 1405,134 1407,137L1452,181C1455,183 1456,186 1456,189L1455,229L1495,223ZM1502,846L1578,801L1599,318L1511,243L1454,251L1452,334C1457,334 1461,336 1465,339L1489,358L1532,394C1537,398 1540,404 1539,411L1527,706C1526,713 1522,720 1516,723L1443,795C1442,796 1442,796 1442,796L1441,856L1502,846ZM1406,1032C1406,1031 1406,1031 1405,1031C1403,1027 1401,1023 1401,1018L412,1211L414,1212C421,1217 424,1226 422,1234L1406,1032ZM1644,1086L1598,1060L1470,1030L418,1247L398,1308L678,1643L894,1700L1974,1349C1977,1348 1979,1348 1982,1348L1992,1275L1984,1270C1983,1270 1982,1270 1980,1269L1646,1087C1645,1087 1645,1087 1644,1086ZM2051,1195L1794,1078L1694,1089L1981,1244L2051,1195ZM1994,1426L2023,1393L2047,1224L2025,1240L1994,1426ZM866,1917L1943,1581L1966,1463C1966,1462 1966,1461 1966,1460L1976,1392L1778,1456L1748,1608C1747,1612 1745,1616 1742,1619L1725,1635C1724,1636 1723,1637 1721,1638C1720,1638 1720,1639 1719,1639L1616,1671C1614,1672 1612,1672 1611,1670C1609,1669 1608,1667 1609,1665L1609,1663L1346,1745C1345,1745 1344,1746 1343,1747L1319,1764C1318,1765 1318,1766 1316,1766L1315,1767C1314,1767 1313,1768 1311,1768L1214,1801C1212,1801 1209,1801 1208,1799C1208,1799 1208,1799 1207,1799L1194,1783C1193,1782 1192,1781 1192,1779L1198,1644L910,1738L866,1917ZM868,1736L685,1688L669,1849L843,1910L868,1736ZM1231,1634L1210,1640L1204,1777L1212,1786L1238,1760L1242,1645L1231,1634ZM1287,1615L1243,1630L1249,1636L1287,1615ZM1286,1751C1286,1749 1286,1747 1286,1745L1301,1622L1254,1647L1250,1756L1286,1751ZM1360,1688L1352,1730L1617,1648C1619,1644 1623,1633 1619,1623C1617,1618 1613,1613 1606,1609C1605,1609 1605,1609 1604,1609L1360,1688ZM1627,1505L1614,1509L1609,1597C1621,1603 1627,1611 1630,1618C1633,1625 1633,1632 1632,1638L1638,1634L1643,1516L1627,1505ZM1693,1484L1641,1501L1649,1506L1693,1484ZM1691,1622C1690,1620 1690,1619 1691,1618L1700,1494L1655,1517L1650,1630L1691,1622ZM64,474L127,950L166,971L105,490L64,474ZM1451,381L1446,631C1446,636 1442,641 1437,642L345,807C342,808 339,807 337,805C334,803 333,800 333,797L308,513L259,566L299,902C299,903 299,905 299,906L339,933L332,846C331,835 339,825 349,823L368,821C370,820 371,820 372,820L1419,662C1430,660 1441,667 1442,679C1443,679 1443,680 1443,681L1443,682C1443,682 1443,683 1443,683L1442,760L1485,704C1485,691 1488,522 1488,449C1488,438 1487,426 1487,422C1479,408 1465,393 1461,389L1451,381ZM304,465L296,382L232,386L127,490L189,984L245,1014C246,1014 246,1015 247,1015L306,1043L349,1037L343,969L255,932C253,931 252,930 251,929C247,926 244,921 243,915L207,548C206,541 209,534 215,530L292,470C293,469 295,468 296,467C299,466 301,465 304,465ZM395,1097L445,1141L1367,957L1419,885L1421,703L394,876L395,1093C395,1095 395,1096 395,1097ZM1695,1633L1647,1643L1630,1655L1696,1634C1696,1633 1696,1633 1695,1633ZM1218,1567L1136,1591C1136,1591 1136,1591 1136,1591L859,1673C857,1674 855,1674 853,1673L713,1637C711,1636 709,1635 707,1633L442,1327C440,1324 439,1321 440,1318L448,1269C448,1269 449,1268 449,1268C449,1266 450,1264 452,1263L452,1263C453,1262 453,1262 454,1262L476,1250C477,1249 478,1249 479,1249L745,1195L745,1194L783,1187C785,1186 788,1185 791,1185C792,1185 793,1185 794,1186C797,1186 799,1187 802,1189L835,1210L911,1247L1175,1201L1353,1160C1354,1160 1355,1160 1355,1160L1356,1160L1356,1160C1357,1159 1358,1159 1359,1159L1627,1114C1629,1114 1631,1114 1633,1115L1917,1260C1918,1261 1919,1261 1919,1262L1948,1285C1951,1288 1953,1293 1951,1297L1935,1348C1933,1351 1931,1354 1927,1355L1662,1436C1661,1436 1661,1436 1661,1436L1659,1437L1630,1445C1630,1446 1629,1446 1629,1446L1226,1566C1223,1567 1220,1567 1218,1567ZM783,1226L747,1216L485,1270L476,1274L565,1371L886,1293L814,1246C814,1246 813,1246 813,1246L783,1226ZM574,1381L745,1569L1122,1452L950,1294L912,1302C908,1303 904,1303 900,1301L574,1381ZM729,1584L466,1295L462,1316L722,1617L726,1618C726,1616 726,1614 726,1612L729,1587C729,1586 729,1585 729,1584ZM776,1631L856,1652L1122,1573L1123,1495L789,1598L777,1629C776,1630 776,1630 776,1631ZM1155,1516L1147,1565L1194,1551L1155,1516ZM1361,1201L1183,1241L1183,1241L964,1290L1136,1449C1140,1449 1144,1451 1148,1454L1205,1505L1632,1378L1595,1355C1594,1354 1593,1353 1591,1351L1380,1197L1362,1201C1362,1201 1361,1201 1361,1201ZM1678,1408L1833,1361L1845,1286L1688,1361L1684,1378C1684,1378 1684,1378 1684,1379L1681,1395L1681,1396L1678,1408ZM1835,1243L1627,1137L1395,1193L1549,1305C1549,1305 1550,1306 1550,1306L1590,1325C1592,1322 1596,1319 1600,1318L1835,1243ZM1886,1269L1865,1295L1856,1354L1916,1335L1928,1297L1906,1279L1886,1269ZM1233,1782L1290,1763L1246,1768L1233,1782Z"/></g></g>',
+    'm-dom': '<g transform="translate(0.217 1.000) scale(0.011950)" style="fill:currentColor;stroke:none;fill-rule:evenodd;clip-rule:evenodd"><g><path d="M10,769L10,278C10,271 14,264 20,260L447,13C453,9 461,9 468,13L894,260C900,264 904,271 904,278L904,431L985,384C992,380 1000,380 1007,384L1088,431L1088,278C1088,271 1092,264 1098,260L1524,13C1531,9 1539,9 1545,13L1972,260C1978,264 1982,271 1982,278L1982,769C1982,777 1978,784 1972,788L1634,983L1634,1472C1634,1479 1631,1486 1624,1490L1007,1848C1000,1852 992,1852 985,1848L368,1490C361,1486 358,1479 358,1472L358,983L20,788C14,784 10,777 10,769ZM300,146L52,290L52,320L309,160L300,146ZM862,320L862,290L614,146L606,160L862,320ZM749,521L862,455L862,357L844,357L806,459C805,463 801,466 796,466L749,468L749,521ZM1130,357L1130,455L1243,521L1243,468L1196,466C1191,466 1187,463 1186,459L1148,357L1130,357ZM1378,147L1130,290L1130,320L1386,161L1378,147ZM1940,320L1940,290L1692,146L1684,160L1940,320ZM1827,658L1940,658L1940,357L1922,357L1884,459C1882,463 1879,466 1874,466L1827,468L1827,658ZM1634,890L1634,934L1940,757L1940,700L1827,700L1827,773C1827,777 1825,780 1821,782L1634,890ZM1265,534L1321,566C1320,559 1319,552 1319,546C1318,532 1319,517 1320,502C1321,487 1324,467 1327,453C1330,440 1335,425 1338,416C1340,408 1343,401 1346,395C1351,385 1361,365 1368,354C1374,345 1381,336 1388,327C1394,320 1401,312 1409,305C1417,298 1427,289 1437,283C1448,275 1461,268 1473,262C1486,256 1501,251 1514,247C1525,244 1539,241 1548,239C1556,238 1564,237 1572,237C1585,237 1614,237 1631,238C1646,239 1663,243 1675,247C1686,250 1701,255 1706,258C1710,260 1713,263 1716,267C1718,271 1720,276 1720,276C1721,280 1721,284 1720,287L1705,345C1704,351 1700,356 1694,359C1689,362 1682,362 1677,359C1677,359 1657,351 1647,348C1636,345 1622,343 1609,342C1597,341 1584,342 1573,343C1565,344 1556,345 1548,348C1539,351 1526,357 1519,361C1513,363 1509,367 1504,371C1499,375 1492,380 1488,385C1481,392 1472,404 1467,413C1462,419 1458,427 1455,434C1452,442 1449,449 1447,457C1445,466 1441,479 1440,491C1438,503 1437,514 1437,526C1437,538 1437,551 1439,563C1441,576 1443,591 1447,604C1451,617 1460,636 1466,648L1581,716C1597,714 1622,712 1633,710L1633,710C1639,709 1645,708 1651,706C1659,703 1678,696 1678,696C1684,693 1690,694 1696,696C1701,699 1705,704 1707,710L1720,769C1722,779 1717,788 1709,793C1709,793 1686,804 1675,807C1664,810 1648,813 1634,815L1634,865L1805,766L1805,458C1805,452 1809,447 1815,447L1866,444L1904,343C1906,338 1910,335 1914,335L1923,335L1672,179L1665,190C1662,195 1655,197 1650,194L1535,129L1420,194C1415,197 1408,195 1405,191L1398,180L1147,335L1155,335C1160,335 1164,338 1166,343L1204,444L1255,447C1260,447 1265,452 1265,458L1265,534ZM1592,833L1592,772L1224,558L1204,592L1592,833ZM1414,1320L1592,1320L1592,870L1554,870L1497,1020C1496,1024 1492,1027 1488,1027L1414,1030L1414,1320ZM1125,1731L1592,1460L1592,1362L1414,1362L1414,1477C1414,1481 1412,1485 1409,1487L1125,1650L1125,1731ZM889,1744L996,1806L1103,1744L1103,1644C1103,1640 1105,1636 1108,1634L1392,1471L1392,1020C1392,1014 1397,1009 1402,1009L1479,1005L1536,855C1537,851 1541,848 1546,848L1575,848L1193,610L1180,630C1177,635 1171,636 1166,634L996,539L826,634C821,636 815,635 812,630L799,610L417,848L446,848C451,848 455,851 456,855L513,1005L590,1009C595,1009 600,1014 600,1020L600,1471L884,1634C887,1636 889,1640 889,1644L889,1744ZM578,1362C578,1362 577,1362 577,1362L400,1362L400,1460L867,1731L867,1650L583,1487C580,1485 578,1481 578,1477L578,1362ZM400,870L400,1320L577,1320C577,1320 578,1320 578,1320L578,1030L504,1027C500,1027 496,1024 495,1020L438,870L400,870ZM768,558L400,772L400,833L788,592L768,558ZM358,865L358,807C343,806 325,805 317,804C310,803 298,798 298,798C291,795 286,787 286,779L286,275C286,271 287,267 289,264C289,264 292,260 294,258C298,254 301,253 305,252C310,250 323,248 332,247C347,245 379,242 401,241C423,240 448,240 468,242C487,244 508,247 524,252C538,256 555,264 565,269C573,274 581,280 588,286C594,292 600,298 605,305C611,313 619,327 623,337C627,345 629,355 631,363C632,371 633,380 633,388C632,399 630,421 627,433C624,445 619,456 613,466C607,476 599,485 591,493C587,498 581,503 576,507C577,508 579,508 579,509C589,516 602,524 612,534C621,545 630,559 635,572C637,576 638,580 639,585L727,534L727,458C727,452 732,447 737,447L788,444L826,343C828,338 832,335 837,335L845,335L595,179L587,190C584,195 577,197 572,194L457,129L342,194C337,197 330,195 327,190L320,179L69,335L78,335C82,335 86,338 88,343L126,444L177,447C183,447 187,452 187,458L187,766L358,865ZM165,700C165,700 165,700 164,700L52,700L52,757L358,934L358,890L171,782C167,780 165,777 165,773L165,700ZM52,357L52,658L164,658C165,658 165,658 165,658L165,468L118,466C113,466 110,463 108,459L70,357L52,357ZM936,684L1056,685C1065,685 1073,691 1076,700L1304,1430C1306,1436 1305,1443 1301,1449C1297,1454 1291,1457 1284,1457L1177,1456C1168,1456 1159,1450 1157,1441L1098,1240L894,1240L838,1441C836,1450 827,1456 818,1456L715,1456C708,1456 702,1453 698,1448C694,1442 693,1435 695,1429L916,699C919,690 927,684 936,684ZM996,881L929,1118L1063,1119L996,881ZM404,721L526,650C526,640 526,623 525,614C524,609 523,603 520,599C516,592 509,584 504,579C500,576 496,574 492,572C484,569 472,566 462,564C452,562 440,561 429,561C422,561 411,561 402,561L402,719L404,721ZM402,341L402,463C418,463 443,463 455,462C464,461 473,458 480,455C486,453 491,451 495,447C500,443 505,438 509,432C512,425 515,417 516,408C517,400 517,390 515,382C513,375 510,368 505,363C501,357 494,353 488,349C483,346 477,344 470,343C459,341 437,339 423,339C417,339 409,340 402,341Z"/></g></g>',
+    'm-tdm': '<g transform="translate(0.584 1.000) scale(0.012229)" style="fill:currentColor;stroke:none;fill-rule:evenodd;clip-rule:evenodd"><path d="M553,351L938,229C940,229 943,228 945,228C947,228 949,229 951,229L1337,351L1471,238C1476,234 1483,232 1489,234L1588,256L1685,175L1642,72C1639,66 1639,60 1642,54L1659,22C1663,15 1672,10 1681,12L1707,15C1712,16 1717,19 1720,22L1783,93L1814,81C1820,78 1828,80 1834,84L1869,111C1874,114 1878,121 1878,127L1878,155C1878,160 1875,165 1872,169L1857,185L1857,216C1857,223 1854,228 1849,232L1503,516L1503,647L1544,631C1550,628 1558,629 1563,633C1569,637 1573,643 1573,650L1573,1057C1573,1064 1569,1071 1563,1075C1557,1078 1550,1079 1544,1076L1503,1059C1503,1059 1503,1060 1503,1060L1501,1082C1501,1082 1501,1083 1501,1083L1498,1105C1498,1105 1498,1105 1498,1106L1494,1127C1494,1127 1494,1128 1494,1128L1489,1149C1489,1150 1489,1150 1489,1150L1483,1171C1483,1172 1483,1172 1482,1172L1476,1193C1476,1193 1475,1194 1475,1194L1471,1206C1474,1219 1483,1248 1494,1272C1498,1283 1503,1292 1507,1297C1514,1303 1525,1304 1536,1305C1556,1306 1577,1302 1577,1302C1583,1301 1589,1303 1594,1307L1869,1541C1878,1548 1879,1560 1872,1569L1694,1802C1687,1811 1674,1813 1665,1806C1665,1806 1600,1759 1576,1727C1528,1664 1377,1431 1364,1411L1355,1401L1328,1433C1328,1433 1328,1433 1328,1433L1312,1451C1312,1451 1311,1451 1311,1451L1278,1486C1278,1486 1277,1486 1277,1486L1242,1519C1242,1519 1242,1519 1242,1519L1224,1535C1224,1536 1224,1536 1223,1536L1187,1567C1187,1567 1186,1567 1186,1567L1168,1582C1167,1582 1167,1582 1167,1582L1129,1611C1129,1611 1129,1611 1129,1611L1071,1651C1071,1652 1070,1652 1070,1652L1012,1688C1012,1688 1012,1689 1012,1689L956,1720C952,1722 948,1723 945,1723C941,1723 937,1722 933,1720L878,1689C877,1689 877,1688 877,1688L819,1652C819,1652 819,1652 818,1651L761,1611C761,1611 760,1611 760,1611L722,1582C722,1582 722,1582 722,1582L703,1567C703,1567 703,1567 703,1567L666,1536C666,1536 666,1536 665,1535L647,1519C647,1519 647,1519 647,1519L612,1486C612,1486 612,1486 611,1486L578,1451C578,1451 578,1451 578,1451L562,1433C561,1433 561,1433 561,1433L534,1401L525,1411C512,1431 361,1664 313,1727C289,1759 224,1806 224,1806C215,1813 202,1811 195,1802L17,1569C10,1560 12,1548 20,1541L295,1307C300,1303 306,1301 313,1302C313,1302 333,1306 354,1305C364,1304 375,1303 382,1297C387,1292 391,1283 396,1272C406,1248 415,1219 419,1206L414,1194C414,1194 414,1193 414,1193L407,1172C407,1172 407,1172 407,1171L401,1150C401,1150 401,1150 401,1149L396,1128C395,1128 395,1127 395,1127L391,1106C391,1105 391,1105 391,1105L389,1083C389,1083 388,1082 388,1082L387,1060C387,1060 387,1059 387,1059L346,1076C339,1079 332,1078 326,1075C320,1071 317,1064 317,1057L317,650C317,643 320,637 326,633C332,629 339,628 345,631L386,647L386,516L40,232C35,228 33,223 33,216L33,185L17,169C14,165 12,160 12,155L12,127C12,121 15,114 20,111L56,84C61,80 69,78 76,81L107,93L170,22C173,19 177,16 182,15L209,12C217,10 226,15 230,22L247,54C250,60 250,66 248,72L204,175L301,256L400,234C407,232 413,234 418,238L553,351ZM428,663L550,712C558,715 563,723 563,731L563,971C563,979 558,987 551,990L428,1042L428,1057L430,1078L433,1099L436,1119L441,1140L447,1160L453,1180L461,1200L469,1220L478,1239L488,1258L498,1277L522,1315L535,1334L563,1370L592,1405L608,1422L641,1456L675,1489L693,1504L729,1535L747,1549L785,1577L842,1617L899,1653L945,1679L991,1653L1048,1617L1104,1577L1142,1549L1160,1535L1197,1504L1214,1489L1248,1456L1281,1422L1297,1405L1327,1370L1354,1334L1367,1315L1391,1277L1401,1258L1411,1239L1420,1220L1429,1200L1436,1180L1443,1160L1448,1140L1453,1119L1457,1099L1459,1078L1461,1057L1461,1042L1339,990C1331,987 1326,979 1326,971L1326,731C1326,723 1331,715 1339,712L1462,663L1462,435L945,271L428,435L428,663ZM684,450C684,450 684,450 685,450L939,363C941,362 943,362 945,362C947,362 949,362 951,363L1205,450C1205,450 1205,450 1205,450L1376,508C1382,510 1386,516 1386,522L1386,640C1386,646 1383,651 1378,653L1288,702L1288,1006C1315,1018 1378,1050 1378,1050C1384,1053 1387,1059 1386,1066C1386,1066 1362,1197 1280,1314L1280,1314C1230,1387 1188,1434 1080,1508C1075,1511 1069,1512 1064,1509C1060,1507 1057,1502 1056,1496L1054,1202L945,1097L836,1202L833,1496C833,1502 830,1507 825,1509C820,1512 814,1511 810,1508C701,1434 660,1387 609,1314L609,1314C527,1197 503,1066 503,1066C502,1059 505,1053 511,1050C511,1050 575,1018 601,1006L601,702L511,653C506,651 503,646 503,640L503,522C503,516 507,510 513,508L684,450ZM945,1061C948,1061 952,1063 955,1066L1079,1185C1082,1188 1083,1192 1083,1196L1086,1468C1170,1407 1208,1365 1251,1304L1187,1158C1186,1156 1185,1154 1185,1152L1185,521L945,441L704,521L704,1152C704,1154 704,1156 703,1158L638,1304C681,1365 719,1407 803,1468L806,1196C806,1192 808,1188 811,1185L934,1066C937,1063 941,1061 945,1061ZM1215,485L1215,510C1215,510 1215,510 1215,510L1215,1149L1271,1275C1324,1190 1348,1101 1355,1071C1332,1060 1279,1034 1268,1029C1262,1027 1259,1022 1259,1016L1259,693C1259,687 1262,682 1266,680L1357,631L1357,533L1215,485ZM619,1275L674,1149L674,510C674,510 674,510 674,510L674,485L533,533L533,631L623,680C628,682 631,687 631,693L631,1016C631,1022 627,1027 622,1029C611,1034 557,1060 535,1071C542,1101 565,1190 619,1275ZM1531,681L1367,745L1367,957L1531,1026L1531,681ZM358,681L358,1026L522,957L522,745L358,681Z"/></g>',
+    'm-ftl': '<g transform="translate(1.178 1.000) scale(0.012680)" style="fill:currentColor;stroke:none;fill-rule:evenodd;clip-rule:evenodd"><g><path d="M175,901C132,877 88,852 47,827C38,821 31,817 27,813C23,809 20,804 20,799C19,793 20,785 27,775L27,775L28,772L30,770C32,768 41,762 46,760C50,758 53,759 55,759C63,762 68,765 73,769C81,774 88,780 115,779C135,779 148,783 157,789C165,795 170,802 175,811L175,268C175,259 181,252 189,249L874,15C878,14 883,14 887,15L1572,249C1580,252 1586,259 1586,268L1586,806C1591,804 1597,800 1604,797C1632,782 1639,785 1659,785C1673,785 1673,783 1690,774C1694,772 1698,771 1702,772C1707,772 1712,775 1715,779C1718,783 1721,788 1723,791C1724,792 1725,794 1725,795C1727,800 1725,805 1721,808C1649,855 1648,857 1586,892C1586,901 1587,1054 1586,1090C1586,1102 1579,1115 1576,1124C1573,1131 1570,1138 1566,1144C1560,1154 1548,1175 1539,1189C1530,1203 1521,1217 1512,1229C1503,1241 1494,1252 1485,1263C1473,1277 1454,1300 1442,1314C1433,1325 1422,1335 1412,1346C1400,1359 1384,1377 1368,1391C1354,1405 1319,1434 1294,1454L1296,1455L1299,1455L1299,1455C1311,1461 1364,1494 1396,1513C1419,1526 1454,1544 1475,1557C1487,1564 1494,1571 1496,1575C1498,1579 1498,1583 1495,1587C1482,1604 1463,1628 1450,1650C1434,1676 1422,1701 1401,1742C1399,1747 1393,1750 1388,1748C1360,1737 1336,1719 1325,1710C1315,1702 1292,1672 1266,1636C1241,1601 1214,1561 1194,1536L1154,1568C1153,1569 1151,1570 1150,1571L1148,1572L1120,1592C1120,1592 1120,1592 1120,1592L1058,1633C1058,1633 1058,1633 1058,1633L997,1670C997,1670 997,1670 997,1670L942,1702C942,1702 942,1702 942,1702L923,1712C923,1712 923,1712 922,1712L889,1728C884,1730 877,1730 872,1728L839,1712C838,1712 838,1712 838,1712L819,1702C819,1702 819,1702 819,1702L764,1670C764,1670 764,1670 764,1670L703,1633C703,1633 703,1633 703,1633L641,1592C641,1592 641,1592 641,1592L613,1572L611,1571C610,1570 608,1570 607,1568L556,1529C542,1547 488,1638 437,1695C429,1703 410,1717 375,1727C370,1728 365,1726 362,1722L275,1582C273,1580 273,1577 273,1574C274,1571 276,1568 278,1567C278,1567 331,1533 348,1522C388,1498 428,1477 468,1455C445,1435 405,1401 389,1386C374,1373 359,1356 347,1344C336,1333 326,1322 316,1311C305,1298 287,1277 276,1263C267,1252 258,1241 249,1229C240,1217 231,1203 222,1189C213,1175 201,1154 195,1144C191,1138 188,1131 185,1124C182,1115 175,1102 175,1090C174,1057 175,922 175,901ZM215,806C220,800 225,796 229,794C235,791 240,791 245,793C249,795 253,798 255,803C257,807 259,813 259,820C261,832 260,849 261,863C261,869 262,875 264,878C267,881 270,884 274,887L274,339C274,330 280,323 288,320L874,120C878,119 883,119 887,120L1473,320C1481,323 1487,330 1487,339L1487,876C1494,871 1501,867 1505,864L1505,864C1505,843 1502,838 1506,813C1507,810 1508,807 1511,806C1517,801 1536,792 1545,790C1545,790 1546,790 1546,790L1546,282L880,56L215,282L215,806ZM766,1135C797,1148 833,1164 870,1181L870,164L614,251C614,257 614,264 614,270L614,270C614,272 613,276 610,282C609,284 608,286 607,288C607,289 607,289 607,290C610,292 617,298 621,302C627,309 632,316 633,324C634,331 634,336 635,341C635,347 636,350 644,357C648,361 649,364 650,367C651,369 651,370 651,372C704,394 726,403 737,408C748,413 750,415 754,420C759,425 760,433 756,441C753,447 745,454 744,455C736,461 735,460 727,468C725,470 719,473 710,474C706,475 701,475 696,476C697,476 698,477 699,478C702,480 705,483 707,487C711,496 715,499 721,503C728,510 739,518 758,537C768,547 767,558 762,567C757,575 748,582 746,583C743,586 740,588 737,589C736,590 734,591 733,591C734,593 735,597 736,599C739,605 740,613 738,620C736,625 738,629 738,633C738,639 737,645 732,651C731,652 731,653 730,653C732,657 734,660 735,664C743,684 729,710 708,717C682,725 645,726 615,767C614,767 611,772 609,777C608,780 606,783 608,786C709,949 712,947 733,991C762,1052 762,1066 766,1134C766,1134 766,1134 766,1135ZM892,1190C914,1177 951,1155 994,1131C994,1130 994,1129 994,1128C998,1060 999,1052 1028,991C1049,947 1052,949 1153,786C1155,783 1153,780 1152,777C1150,772 1147,767 1146,766C1116,726 1079,725 1053,717C1032,710 1018,684 1026,664C1027,660 1029,657 1031,653C1030,653 1030,652 1029,651C1024,644 1023,638 1023,632C1023,629 1025,625 1023,620C1021,612 1022,605 1025,599C1026,596 1027,593 1028,591C1027,591 1025,590 1024,589C1021,587 1018,586 1015,583C1013,582 1004,575 999,567C994,558 993,547 1003,537C1022,518 1033,510 1040,503C1046,499 1050,496 1054,487C1056,483 1059,480 1062,478C1063,477 1064,476 1065,476C1060,475 1055,475 1051,474C1042,473 1036,470 1034,468C1026,460 1025,461 1017,455L1017,455C1016,454 1008,447 1005,441C1001,433 1002,425 1007,420C1011,415 1013,413 1024,408C1035,403 1057,394 1110,372C1110,370 1110,369 1111,367C1112,364 1113,361 1117,357C1125,350 1126,347 1126,341C1127,336 1127,331 1128,324C1129,316 1134,309 1140,302C1144,298 1151,292 1154,290C1154,289 1154,289 1154,288C1153,286 1152,284 1151,282C1148,276 1147,272 1147,270L1147,270C1147,264 1147,258 1148,251L892,164L892,1190ZM1546,917C1538,924 1534,932 1530,938C1525,948 1520,955 1511,960C1507,961 1499,967 1487,974C1487,980 1487,1057 1487,1075C1487,1081 1484,1087 1482,1092C1480,1096 1478,1100 1476,1103C1471,1110 1462,1125 1456,1135C1449,1146 1442,1156 1435,1165C1428,1176 1419,1188 1410,1198C1399,1212 1382,1233 1370,1246C1362,1256 1352,1266 1343,1275C1330,1288 1312,1309 1295,1324C1276,1341 1223,1385 1197,1406C1216,1412 1238,1416 1246,1419C1248,1420 1250,1421 1252,1424C1254,1426 1255,1429 1256,1433C1280,1414 1325,1377 1342,1362C1357,1348 1371,1331 1383,1319C1393,1308 1403,1298 1412,1287C1424,1274 1443,1252 1454,1238C1463,1227 1471,1216 1479,1205C1488,1194 1497,1180 1505,1168C1514,1154 1526,1134 1532,1124L1532,1124C1534,1120 1536,1115 1538,1110C1541,1104 1546,1096 1546,1089C1547,1061 1546,963 1546,917ZM1167,1507C1157,1498 1137,1484 1113,1470L1060,1512L1060,1512C1060,1517 1059,1523 1057,1530C1049,1558 1046,1574 1026,1595C1023,1598 1018,1599 1014,1597L963,1575L890,1617C884,1621 877,1621 871,1617L821,1589C820,1588 820,1588 820,1588L790,1570C779,1576 766,1581 758,1582C751,1582 743,1578 736,1568C729,1560 722,1546 719,1535C714,1538 709,1540 703,1542C697,1545 693,1545 689,1544C685,1543 681,1540 677,1535C670,1526 661,1505 633,1466C621,1474 602,1487 585,1501L629,1535L630,1536C632,1536 633,1537 634,1538L664,1559L725,1599L784,1636L839,1667L856,1676L880,1687L905,1676L922,1667L977,1636L1036,1599L1097,1559L1127,1538C1128,1537 1129,1536 1131,1536L1132,1535L1167,1507ZM1036,1480C1036,1479 1036,1477 1037,1475C1037,1474 1042,1463 1042,1463L1042,1463C1044,1456 1062,1417 1098,1437C1144,1460 1182,1490 1189,1496C1204,1509 1247,1571 1284,1623C1308,1656 1329,1685 1338,1692C1348,1699 1365,1714 1386,1723C1405,1687 1416,1663 1431,1639C1443,1619 1458,1598 1471,1581C1469,1579 1466,1577 1464,1576C1443,1563 1407,1545 1385,1532C1355,1514 1308,1485 1292,1477C1289,1478 1281,1480 1275,1481C1267,1482 1259,1481 1253,1477C1249,1475 1246,1473 1243,1470C1242,1469 1240,1464 1239,1458C1238,1453 1237,1447 1236,1442C1236,1441 1235,1439 1235,1438C1223,1434 1196,1430 1176,1423C1175,1422 1174,1422 1173,1421C1138,1393 1137,1393 1099,1368C1081,1357 1080,1345 1081,1334C1081,1331 1082,1328 1082,1325C1082,1324 1083,1322 1082,1321C1074,1312 1051,1298 1021,1281C1020,1280 1019,1280 1018,1279L1018,1279C981,1259 934,1236 886,1213C886,1213 886,1213 885,1213C836,1189 785,1167 745,1150C738,1147 735,1147 732,1147C728,1146 723,1145 717,1142C697,1131 698,1130 478,1012C477,1012 476,1013 475,1013C472,1015 469,1018 465,1019C457,1024 447,1026 437,1019C417,1006 356,965 307,932C292,922 278,915 267,909C259,904 252,898 247,892C243,886 240,878 239,868C238,857 238,843 238,831C238,825 238,820 237,816L236,816C236,816 235,817 234,818C229,823 224,831 218,837C213,843 208,848 203,851C198,854 193,855 187,855C180,854 172,849 164,836C161,830 158,824 154,818C152,814 149,810 145,807C138,803 129,801 115,801C85,802 74,796 65,790C61,787 57,784 52,782L46,785C44,788 43,790 42,792C42,793 41,794 41,796C41,797 43,797 44,798C47,801 52,804 58,808C108,839 163,868 214,899C214,899 215,899 215,899L215,899C215,899 215,899 215,900C226,907 235,920 243,934C247,940 250,946 254,951C256,955 258,958 261,960C280,971 472,1080 500,1105C506,1110 508,1114 509,1118C510,1120 510,1123 513,1126C515,1127 521,1130 529,1133C552,1144 592,1161 636,1189C707,1235 705,1240 735,1247C749,1250 753,1246 780,1263C790,1268 796,1272 801,1277C806,1281 808,1285 809,1290C811,1297 809,1306 801,1319C769,1372 704,1411 667,1433C659,1438 651,1443 646,1445C648,1448 650,1452 650,1453C674,1486 685,1506 691,1517C693,1519 694,1521 695,1522C701,1519 707,1517 713,1514C801,1464 840,1413 862,1382L862,1382C864,1380 865,1378 867,1376C873,1368 878,1362 882,1358C887,1354 892,1352 897,1352C900,1352 905,1353 911,1357C920,1363 934,1374 946,1386C959,1399 971,1412 977,1421C981,1427 983,1433 983,1436C983,1441 981,1466 979,1486C979,1486 979,1487 979,1487C977,1498 976,1507 976,1512C974,1520 966,1537 961,1550L1015,1574C1027,1559 1030,1545 1036,1524C1039,1512 1037,1504 1036,1497C1036,1492 1035,1487 1036,1481L1035,1481L1036,1480ZM505,1433C513,1428 521,1423 530,1418C538,1412 547,1411 556,1410C561,1410 565,1410 569,1410C540,1387 486,1342 466,1324C449,1309 430,1288 418,1275C409,1266 401,1257 392,1248C382,1236 365,1215 355,1203C347,1194 339,1184 333,1175C328,1169 323,1162 318,1155C313,1147 307,1138 302,1130C296,1120 286,1105 283,1098C281,1095 279,1090 277,1087C276,1083 274,1079 274,1075C274,1061 274,1002 274,993C262,986 254,981 250,979C243,975 236,965 229,953C224,946 220,937 215,930C215,977 214,1063 215,1089C215,1096 220,1104 223,1110C225,1115 227,1120 229,1124L229,1124C235,1134 247,1154 256,1168C264,1180 273,1194 282,1205C290,1216 298,1227 307,1238C318,1251 335,1272 346,1285C356,1296 366,1306 376,1316C387,1328 401,1344 416,1357C434,1374 488,1419 505,1433ZM1447,804L1447,610C1434,604 1419,597 1412,594C1411,595 1410,597 1409,598L1409,598C1408,599 1408,601 1406,604C1402,610 1382,638 1379,682C1379,685 1381,687 1382,689C1385,691 1388,693 1390,694C1396,698 1400,702 1402,705C1416,728 1418,743 1418,755C1418,758 1418,763 1418,764C1425,781 1436,794 1447,804ZM1447,463L1447,353L1322,311C1329,321 1335,327 1348,341C1403,398 1430,434 1447,463ZM441,310L314,353L314,470C327,441 351,405 413,341C427,326 433,321 441,310ZM314,609L314,806C325,796 336,783 343,764C343,764 343,758 343,755C343,744 345,728 359,705C361,702 365,698 371,695C373,693 376,691 379,689C380,687 382,685 382,682C379,638 359,610 355,604C353,601 353,599 352,598L352,598L352,598C351,597 350,595 349,594C342,597 327,604 314,609ZM783,1495C770,1504 755,1514 738,1524C739,1525 739,1526 739,1527C741,1534 745,1543 750,1550C752,1554 756,1558 758,1560C764,1559 775,1554 783,1548C786,1547 789,1545 791,1543C791,1542 792,1541 792,1541C793,1535 792,1513 791,1507C790,1505 786,1500 783,1495ZM884,1389C896,1407 923,1438 959,1465C960,1453 961,1441 961,1437C960,1436 958,1432 956,1430C950,1422 941,1412 931,1402C919,1391 902,1378 897,1375C896,1375 896,1375 895,1376C892,1379 889,1384 884,1389L884,1389ZM623,1446C623,1443 623,1440 624,1438C624,1436 626,1434 629,1431C631,1429 636,1426 642,1422C672,1404 748,1365 782,1307C784,1304 786,1301 787,1299C787,1297 788,1296 788,1295C787,1293 786,1293 785,1291C781,1289 776,1286 769,1282C765,1279 762,1278 759,1276C747,1284 721,1303 703,1317C697,1322 690,1329 689,1330C686,1341 687,1349 681,1360C674,1371 661,1385 628,1405C599,1424 585,1428 581,1430C575,1432 569,1432 562,1432C555,1432 548,1432 542,1436C482,1475 421,1503 360,1541C347,1549 315,1570 299,1580L377,1703C401,1696 415,1686 420,1680C472,1623 526,1531 539,1515C556,1494 605,1458 623,1446ZM1716,788C1716,788 1715,788 1714,788C1715,788 1716,788 1716,788ZM1023,1257C1093,1210 1471,955 1501,940C1506,937 1508,933 1511,927C1519,915 1528,898 1555,884C1634,840 1631,841 1700,796C1700,795 1699,795 1699,794C1678,805 1677,806 1659,807C1643,807 1637,804 1614,816C1599,824 1590,830 1582,834C1572,839 1565,841 1554,840C1550,839 1546,837 1545,833C1544,832 1543,828 1543,823C1543,821 1543,817 1543,814C1538,815 1532,819 1527,821C1524,843 1527,847 1527,870L1527,870L1526,875L1524,878C1523,878 1521,880 1517,883C1486,903 1330,1002 1330,1002C1326,1004 1322,1004 1318,1002C1318,1002 1311,997 1303,993C1299,992 1295,990 1293,990C1221,1024 1002,1152 914,1202C954,1221 992,1240 1023,1257Z"/></g></g>',
+    'm-ctrl': '<g transform="translate(1.287 1.000) scale(0.011944)" style="fill:currentColor;stroke:none;fill-rule:evenodd;clip-rule:evenodd"><g><path d="M221,1538C21,1291 -26,1004 47,700C59,650 74,603 93,559L92,559C91,559 89,559 88,559L84,559C83,559 82,558 81,558L76,556C75,556 75,555 74,555L63,548C62,548 62,548 61,548L52,540C51,540 51,539 51,539L42,529C41,529 41,528 41,528L34,518C34,517 33,517 33,516L28,504C28,504 27,503 27,503L24,491C24,491 24,490 24,490L23,478C23,478 22,477 23,477L25,411C25,411 25,411 25,410L27,399C27,398 27,398 27,397L30,388C30,387 30,387 30,386L37,372C37,372 38,371 38,371L43,363C44,363 44,362 44,362L49,356C50,356 50,355 50,355L62,345C63,345 63,344 64,344L77,336C78,336 79,336 80,335L85,334C86,334 88,334 89,334L93,335C95,335 96,336 97,336L100,338C103,336 107,334 111,333C129,328 193,313 212,309L212,309C216,308 221,308 224,308C227,308 230,309 232,310C235,310 237,311 239,312C241,313 244,314 246,316C248,317 250,319 252,321C253,323 255,325 256,327C258,329 259,331 260,333C260,334 260,334 260,334C320,275 464,148 680,85C680,84 680,84 681,84C682,79 685,73 693,68C700,64 717,59 738,55C766,50 800,47 814,48C814,48 814,48 815,48C815,45 815,43 815,43L815,43C815,37 820,27 827,20C833,14 840,11 844,10C860,8 963,8 971,9C978,9 989,14 997,21C1004,28 1008,37 1008,43C1008,45 1008,47 1008,49C1038,43 1078,47 1104,54C1119,58 1130,64 1134,67C1135,68 1140,74 1142,85C1356,149 1497,272 1559,334L1561,329C1561,329 1562,328 1562,328L1565,323C1565,323 1566,322 1566,322L1571,318C1571,317 1572,317 1572,316L1577,313C1578,313 1578,313 1579,313L1584,310C1584,310 1585,310 1586,310L1591,309C1591,309 1592,308 1593,308L1598,308C1599,308 1599,308 1600,308L1606,309C1607,309 1607,309 1607,309L1704,332C1705,332 1706,332 1706,332L1715,336C1716,336 1716,337 1717,337L1719,338L1721,337C1722,336 1723,336 1724,335L1728,334C1729,334 1730,334 1731,334L1734,334C1735,334 1736,334 1737,335L1742,336C1742,337 1743,337 1743,337L1757,345C1757,345 1758,346 1759,346L1770,357C1771,357 1771,358 1772,358L1780,369C1780,369 1781,370 1781,370L1787,382C1787,383 1788,383 1788,384L1792,397C1792,397 1792,398 1792,398L1794,410C1794,411 1794,411 1794,411L1796,477C1797,477 1796,478 1796,479L1795,492C1795,493 1794,493 1794,494L1790,508C1789,509 1789,509 1789,510L1785,519C1784,519 1784,519 1784,520L1779,528C1778,528 1778,528 1778,529L1771,536C1771,536 1771,537 1770,537L1763,544C1763,544 1762,544 1762,544L1753,551C1752,551 1752,551 1751,552L1741,557C1740,557 1739,557 1739,558L1734,559C1732,559 1730,559 1729,559L1724,558C1723,558 1722,557 1720,557L1718,561L1719,560L1726,574C1726,575 1727,575 1727,576L1736,600C1856,876 1836,1241 1594,1539L1597,1538C1598,1538 1600,1538 1602,1539L1610,1541C1611,1542 1612,1542 1612,1542L1626,1550C1627,1550 1627,1551 1628,1551L1640,1561C1641,1562 1641,1562 1642,1563L1650,1573C1651,1574 1651,1574 1651,1575L1658,1587C1658,1587 1659,1588 1659,1588L1663,1601C1663,1602 1664,1602 1664,1603L1666,1617C1666,1617 1666,1618 1666,1618L1668,1678C1668,1678 1668,1679 1668,1679L1667,1693C1666,1694 1666,1694 1666,1695L1662,1708C1662,1708 1662,1709 1662,1709L1657,1718C1657,1719 1657,1719 1657,1719L1652,1727C1651,1728 1651,1728 1651,1729L1646,1735C1646,1735 1645,1735 1645,1736L1638,1742C1638,1743 1638,1743 1637,1743L1628,1750C1628,1751 1627,1751 1627,1751L1618,1756C1617,1757 1617,1757 1616,1757L1612,1758C1611,1759 1609,1759 1607,1759L1602,1759C1601,1758 1600,1758 1598,1757L1596,1756C1595,1756 1595,1756 1595,1757L1588,1761C1587,1762 1586,1762 1585,1763L1530,1779L1530,1782C1530,1784 1530,1785 1530,1786L1529,1790C1529,1792 1529,1793 1528,1795L1520,1806C1519,1806 1519,1807 1518,1807L1507,1818C1507,1818 1506,1819 1506,1819L1496,1826C1496,1826 1495,1826 1494,1826L1482,1832C1482,1832 1481,1832 1481,1833L1438,1846C1438,1846 1437,1846 1437,1846L1427,1848C1427,1848 1426,1848 1426,1848L1412,1849C1411,1849 1411,1849 1410,1849L1397,1848C1396,1848 1396,1847 1395,1847L1384,1844C1383,1844 1383,1844 1382,1844L1370,1838C1369,1838 1369,1837 1368,1837L1357,1829C1356,1829 1356,1828 1355,1828L1344,1817C1344,1816 1343,1816 1343,1815L1334,1802C1334,1802 1333,1801 1333,1800L1327,1786C1327,1785 1327,1785 1327,1784L1324,1769C1323,1768 1323,1768 1323,1767L1323,1757C1309,1767 1298,1774 1298,1774C1298,1774 1297,1774 1296,1775C1231,1811 1117,1833 1074,1839L1074,1839C1074,1839 1074,1839 1073,1839C1073,1839 992,1847 913,1847C831,1846 749,1832 749,1832C748,1832 748,1832 748,1832C676,1817 599,1797 554,1782C551,1781 527,1774 496,1760L496,1766C496,1767 496,1768 496,1769L492,1784C492,1785 492,1785 492,1786L486,1800C486,1801 485,1802 485,1802L477,1814C477,1814 477,1815 476,1815L465,1827C465,1827 464,1828 464,1828L451,1837C450,1837 450,1838 449,1838L437,1844C436,1844 436,1844 435,1844L424,1847C423,1847 423,1848 422,1848L409,1849C408,1849 408,1849 407,1849L393,1848C393,1848 392,1848 392,1848L382,1846C382,1846 381,1846 381,1846L338,1833C338,1832 337,1832 337,1832L325,1826C324,1826 323,1826 323,1826L313,1819C313,1819 312,1818 312,1818L301,1807C300,1807 300,1806 299,1806L291,1795C290,1793 290,1792 290,1790L289,1786C289,1785 289,1784 289,1783L289,1780C289,1780 289,1780 289,1779L238,1764C237,1764 237,1764 236,1763L228,1759C227,1759 226,1758 226,1758L223,1756C223,1756 223,1756 223,1756L219,1758C218,1758 217,1759 216,1759L213,1759C212,1759 210,1759 209,1759L206,1758C205,1758 205,1758 204,1758L198,1755C198,1754 197,1754 197,1754L185,1746C185,1746 184,1746 184,1745L174,1736C174,1735 173,1735 173,1735L166,1725C166,1725 165,1724 165,1724L159,1714C159,1713 159,1713 159,1712L154,1701C154,1700 154,1700 154,1699L152,1688C151,1687 151,1687 151,1686L151,1673C151,1672 151,1672 151,1672L153,1616C153,1615 153,1615 153,1614L156,1601C156,1600 156,1600 156,1599L160,1588C160,1588 161,1587 161,1587L169,1573C169,1572 170,1572 170,1572L175,1565C175,1565 175,1565 176,1564L183,1558C183,1557 183,1557 184,1557L197,1547C197,1547 198,1547 199,1546L213,1540C214,1539 215,1539 216,1539L220,1538C220,1538 221,1538 221,1538ZM108,637C101,660 94,685 88,710C19,997 61,1267 245,1501C245,1500 245,1500 245,1499L244,1495C244,1494 243,1493 243,1492L243,1486C243,1486 243,1486 243,1485L245,1472C245,1471 245,1470 245,1470L247,1464C70,1222 39,917 125,669L119,661C119,660 118,660 118,659L113,649C112,649 112,648 112,647L108,637ZM241,354C241,354 242,354 242,353L242,353C242,352 242,350 242,349C242,348 241,347 241,346C241,344 240,343 240,342L240,342C239,341 239,340 238,339L238,339C238,338 237,337 236,336L236,336C235,335 234,334 233,334L233,334C232,333 231,332 230,332C229,332 228,331 227,331C226,331 225,330 224,330C222,330 219,330 216,331C198,335 134,349 116,354C115,355 113,356 112,357C111,358 109,359 108,361C108,362 107,362 107,363L105,370L105,376L106,381L106,381L108,384L110,387C110,387 111,388 112,389C113,390 114,390 115,391C116,392 118,392 119,392C120,393 121,393 123,393C124,393 127,393 129,393C131,393 133,392 136,391L176,382C177,382 177,382 178,382C197,377 217,373 226,371C227,370 227,370 228,370C233,364 238,358 241,354ZM181,429L182,417L181,409L180,404C166,407 152,410 142,413L143,417C143,417 143,418 143,419L141,466L141,466L141,466L143,468L146,471C146,471 147,472 147,473L148,474L148,474C148,474 149,475 149,476L149,476L181,429ZM173,516L177,524L178,523C180,523 181,522 183,522L192,521C192,521 193,521 193,521L196,521L198,516C199,515 199,515 199,514C328,310 510,217 597,179C596,175 596,171 596,169C596,165 597,162 597,160L598,159C427,230 317,335 278,377C274,381 236,425 220,446L173,516ZM227,527L229,527C229,528 230,528 230,528L239,532C239,532 240,533 240,533L248,538C249,539 249,539 249,539L256,544C272,518 291,494 310,471C310,471 310,471 310,470C324,454 338,439 352,424C353,424 353,424 353,424C353,424 353,423 353,423C453,322 562,265 607,244C605,231 603,220 602,210C516,248 348,338 227,527ZM605,628C604,628 602,627 601,626C598,625 594,624 591,624C588,623 585,622 581,622C578,622 574,622 571,622C570,622 569,622 568,622C573,627 581,635 584,639L584,639C586,641 588,643 589,645C591,648 593,653 594,657C595,660 595,665 595,668C596,669 598,670 599,672C598,663 598,654 600,645C601,640 603,634 605,628ZM624,722C622,722 619,723 618,724L618,724C617,724 616,725 615,726C614,727 613,728 612,729C611,730 610,731 609,732C609,733 608,734 608,735C607,737 607,738 607,739C607,741 607,742 607,743C607,744 607,745 607,746C607,747 608,749 609,751C609,752 610,754 611,755C611,755 612,755 612,756C615,759 623,767 627,771C632,776 638,782 643,788C646,770 648,756 650,743C643,740 636,735 630,729C628,727 626,724 624,722ZM610,998C609,998 608,997 607,996L563,952L558,948L558,947L554,945L554,945L548,943L541,943L540,943L536,944L533,946L530,949L527,952L526,956L524,961L525,966L526,969L526,971L529,976L591,1038L597,1042L602,1043C605,1029 608,1014 610,998ZM551,1269L526,1291L526,1292L523,1295L522,1298L521,1300L521,1301L520,1305L520,1308L521,1312L523,1316L525,1319L528,1321L531,1323L536,1325C540,1309 545,1291 551,1269ZM528,1357L507,1374L507,1375L507,1379C507,1380 506,1380 506,1380C512,1378 517,1376 523,1375C525,1369 526,1363 528,1357ZM441,1575C429,1568 415,1557 404,1546L389,1559C389,1559 388,1559 388,1560L381,1564C399,1580 415,1593 433,1607C436,1596 439,1586 441,1575ZM349,1577C349,1577 348,1577 348,1577L332,1578C331,1578 331,1578 330,1578L320,1577L321,1579C322,1579 322,1580 322,1580L326,1589C327,1590 327,1590 327,1590L331,1601C331,1602 331,1602 331,1603L333,1612C333,1613 333,1613 333,1614L333,1616C362,1639 396,1660 418,1672C420,1662 422,1651 425,1639C398,1618 376,1600 349,1577ZM354,1681L349,1682L336,1687L330,1691L329,1699C329,1700 329,1700 328,1701L328,1702L350,1709L355,1710C355,1710 355,1710 355,1711L356,1711C357,1711 357,1711 357,1711L362,1713C363,1714 363,1714 364,1714L369,1718L375,1719C376,1719 376,1719 377,1719L416,1731C417,1731 418,1732 418,1732L423,1735C424,1735 424,1736 425,1737L428,1740C429,1741 430,1742 430,1742L433,1747C433,1748 433,1749 434,1749L435,1754C435,1756 435,1757 435,1758L434,1765C434,1767 434,1768 433,1769L430,1775C429,1776 429,1777 427,1778L422,1783C421,1784 420,1785 419,1785L412,1787C411,1788 409,1788 408,1788L400,1788C400,1788 399,1787 398,1787L373,1780L368,1784C368,1785 368,1785 367,1785L367,1785C367,1786 366,1786 365,1787L363,1788L362,1789C361,1789 361,1789 360,1790C360,1790 359,1790 359,1790L358,1791L355,1792C354,1792 354,1792 353,1792C353,1792 352,1792 352,1792L349,1793L348,1793C347,1793 347,1793 347,1793C346,1793 345,1793 345,1793L339,1793C339,1793 338,1793 337,1793L335,1793L335,1793C334,1793 333,1792 333,1792L331,1792C331,1792 331,1792 330,1792L323,1790L313,1786L316,1792L326,1801L335,1807L345,1812L387,1825L395,1826L407,1827L419,1826L429,1823L439,1818L450,1811L459,1801L466,1791L471,1779L474,1765L474,1752L473,1750C457,1742 439,1733 422,1723C415,1718 381,1698 354,1681ZM262,1433L268,1426C268,1426 268,1426 269,1425L287,1409C219,1309 155,1130 146,1004C136,868 165,749 175,716L173,715C172,715 172,714 171,714L162,707C162,706 161,706 161,706L148,693C73,926 102,1207 262,1433ZM1638,428L1672,473L1673,472L1676,468C1677,467 1677,467 1678,466L1678,466L1678,466L1676,419C1676,418 1676,418 1676,417L1677,413L1639,404L1639,404L1638,410L1637,419L1638,428ZM1648,512L1599,447L1599,446C1583,424 1582,424 1565,403L1542,377C1499,332 1391,229 1224,159C1224,161 1224,163 1224,165C1224,165 1223,171 1221,183C1308,221 1491,310 1620,514L1624,521L1636,522C1637,522 1639,522 1640,523L1642,524L1648,513C1648,513 1648,512 1648,512L1648,512ZM1217,213C1216,223 1214,235 1212,247C1258,269 1365,325 1464,423C1465,423 1465,424 1465,424C1465,424 1465,424 1466,424C1480,439 1494,454 1508,470C1508,470 1508,471 1509,471C1528,493 1546,518 1563,544L1564,543C1564,543 1565,543 1565,543L1573,536C1574,536 1574,536 1574,536L1585,530C1585,530 1586,529 1586,529L1592,527C1472,338 1303,252 1217,213ZM1217,622C1224,634 1227,645 1228,657C1228,659 1228,661 1228,664L1234,658L1235,657L1236,649C1236,648 1236,647 1236,646L1239,638C1239,637 1240,636 1240,636L1242,634L1242,633C1242,633 1243,632 1243,632L1244,631L1245,629C1245,629 1246,628 1246,628L1247,627L1247,627C1247,627 1247,626 1248,626L1252,622L1262,612L1255,611L1249,611L1241,612L1227,616L1219,621L1217,622ZM1211,714C1202,728 1192,737 1186,742L1186,742C1182,744 1176,747 1169,750C1170,762 1171,776 1173,792L1217,747L1219,743L1221,740L1222,737L1222,732L1222,728L1220,723L1218,719L1215,717L1211,714ZM1204,1000C1206,1014 1209,1029 1212,1045C1213,1045 1214,1044 1215,1044L1222,1042L1228,1038L1290,976L1293,972L1294,966L1295,961L1294,956L1292,952L1289,949L1286,946L1283,944L1279,943L1276,942L1272,942L1272,942L1267,944L1266,944L1261,947L1261,947L1258,950L1212,996C1209,999 1206,1000 1204,1000ZM1262,1264C1268,1290 1274,1311 1279,1327L1288,1323L1291,1321L1294,1319L1296,1315L1298,1312L1299,1308L1299,1305L1298,1300L1297,1297L1296,1295L1293,1292L1292,1290L1262,1264ZM1289,1354C1292,1364 1295,1371 1297,1376C1303,1378 1309,1381 1314,1384L1313,1381C1313,1380 1313,1380 1312,1379L1312,1375L1312,1374L1289,1354ZM1375,1578C1379,1589 1383,1599 1386,1609C1405,1595 1421,1581 1439,1565L1438,1565C1438,1564 1437,1564 1437,1564L1429,1558C1429,1558 1428,1558 1428,1557L1415,1545C1409,1550 1402,1557 1397,1561C1392,1565 1383,1572 1375,1578ZM1397,1639C1398,1643 1399,1646 1400,1649C1426,1629 1461,1599 1485,1578L1482,1578C1481,1578 1481,1578 1480,1578L1472,1577C1445,1600 1424,1619 1397,1639ZM1485,1633C1476,1641 1466,1649 1457,1657L1461,1657C1461,1657 1462,1658 1463,1658L1476,1660C1477,1661 1477,1661 1478,1661L1486,1665L1485,1633ZM1424,1684C1415,1692 1407,1698 1401,1702C1393,1708 1370,1724 1348,1740L1345,1752L1345,1766L1348,1779L1353,1791L1360,1802L1370,1812L1380,1818L1390,1823L1400,1826L1412,1827L1424,1826L1432,1825L1474,1812L1484,1807L1493,1801L1503,1792L1506,1786L1493,1790L1489,1792C1488,1792 1488,1792 1488,1792L1486,1792C1486,1792 1485,1793 1484,1793L1480,1793L1477,1793C1476,1793 1475,1793 1474,1793L1474,1793C1473,1793 1472,1793 1471,1793L1470,1793L1469,1793C1469,1793 1468,1793 1467,1792L1467,1792L1466,1792C1465,1792 1465,1792 1464,1792L1463,1791L1462,1791C1462,1791 1461,1790 1460,1790L1460,1790L1459,1790C1458,1789 1458,1789 1457,1789L1456,1788L1455,1788C1455,1787 1454,1787 1454,1787L1453,1786L1452,1786C1451,1785 1451,1785 1451,1784L1450,1784L1449,1784C1449,1783 1449,1783 1448,1782L1448,1782L1446,1780L1421,1787C1420,1787 1419,1788 1419,1788L1411,1788C1410,1788 1408,1788 1407,1787L1400,1785C1399,1785 1398,1784 1397,1783L1392,1778C1390,1777 1390,1776 1389,1775L1386,1769C1385,1767 1385,1766 1385,1765L1384,1758C1384,1757 1384,1755 1384,1754L1385,1749C1386,1749 1386,1748 1386,1747L1389,1742C1389,1742 1390,1741 1391,1740L1394,1737C1395,1736 1395,1735 1396,1735L1401,1732C1401,1732 1402,1731 1403,1731L1442,1719C1443,1719 1444,1719 1444,1719L1449,1718L1455,1714C1456,1714 1456,1714 1457,1713L1457,1713C1458,1713 1458,1713 1459,1713L1460,1712L1462,1711C1462,1711 1462,1711 1463,1711L1464,1711L1464,1711C1464,1710 1464,1710 1464,1710L1471,1708L1491,1702C1491,1702 1491,1702 1491,1702L1489,1692C1489,1692 1488,1692 1488,1691L1488,1690L1483,1687L1470,1682L1459,1679L1449,1679L1437,1680L1424,1684ZM1709,644C1709,644 1708,645 1708,645L1704,654C1704,654 1704,654 1704,655L1698,663C1698,664 1698,664 1698,664L1695,667L1698,675C1786,925 1760,1215 1579,1459C1579,1459 1579,1459 1579,1459L1573,1467L1574,1472C1574,1473 1574,1473 1575,1474L1576,1483C1576,1483 1576,1484 1576,1484L1576,1492C1576,1493 1576,1494 1575,1494L1575,1496C1786,1225 1808,899 1709,644ZM1672,692L1658,706C1657,706 1657,706 1657,707L1649,713C1649,713 1649,713 1648,713L1645,716L1646,719C1646,719 1646,719 1646,719C1714,937 1691,1193 1537,1411L1537,1411L1536,1412L1550,1426C1551,1426 1551,1426 1552,1427L1559,1436C1559,1436 1559,1436 1559,1436C1728,1204 1753,930 1672,692ZM1508,1613L1508,1616L1507,1627L1509,1678L1517,1686C1518,1687 1519,1688 1520,1690L1521,1693L1549,1685L1548,1679C1548,1678 1548,1678 1548,1677L1546,1630L1546,1630L1543,1626L1542,1626C1542,1625 1541,1624 1540,1624L1540,1623L1540,1622C1539,1622 1539,1622 1538,1621L1524,1599C1520,1603 1514,1608 1508,1613ZM1591,370L1594,371L1692,393L1699,393L1704,391L1708,388L1711,384L1712,383L1712,382L1714,376L1714,374L1715,373L1714,371L1714,369L1713,364L1711,361L1708,358L1705,355L1699,353L1603,331L1598,330L1595,330L1591,331L1588,332L1585,334L1582,337L1580,340L1579,343L1578,347L1577,350L1578,353L1578,354L1591,370ZM194,701L203,705L211,707L221,708L229,707L228,706C225,704 223,702 222,700C221,699 221,699 220,698C220,698 220,697 219,697C218,695 216,692 215,690C214,688 212,685 212,682C211,681 211,679 211,678C211,677 211,676 211,676C210,675 210,674 210,674C210,671 210,669 210,666L210,666L210,666L204,662C204,662 203,661 202,661L174,632C174,632 173,631 173,631L167,623L166,623L163,623C163,623 162,623 161,623L160,623L159,623C158,623 157,623 156,623L156,623C155,623 155,623 154,623L149,621C148,621 147,621 147,621L146,620C146,620 145,620 145,620L145,620L142,618C141,618 141,618 140,617L140,617C140,617 139,617 139,616L137,615L135,614C135,614 134,613 134,613C134,613 133,612 133,612L131,610L130,609C129,609 129,608 129,608C129,608 128,607 128,607L127,605L126,612L127,620L128,626L132,640L137,648L143,656L176,690L184,696L193,701L194,701L194,701ZM361,447C352,457 342,467 333,477C344,488 358,502 369,513C371,515 375,519 378,522C380,524 382,526 383,527C384,528 384,528 385,529C386,529 386,530 387,530C387,530 387,530 387,531L387,531C388,531 388,531 389,532C389,532 389,532 389,532C389,532 390,532 390,532C391,533 392,533 394,534C395,534 398,534 400,534C400,534 401,534 401,534C402,534 403,534 404,534C405,533 407,533 408,532C409,532 410,531 411,531L411,531C412,530 412,529 413,528C414,528 415,527 416,526C416,525 417,523 418,522C418,521 418,520 419,519C419,518 419,517 419,515C419,515 419,514 419,513C419,512 419,510 419,508C419,508 418,508 418,508C418,507 418,506 417,505C416,503 415,502 414,500C414,500 414,500 414,500C413,499 412,497 410,496C399,485 377,463 361,447ZM334,691C337,695 342,699 345,703C347,705 348,706 349,707C350,707 350,708 351,709C352,711 354,712 355,714C355,715 356,716 356,717L356,717C358,719 359,722 359,724C359,724 360,725 360,725C360,728 361,730 361,733C361,734 361,735 361,737C368,743 383,759 388,764C390,765 391,767 392,769C394,769 396,769 398,769C399,769 400,769 402,769C402,770 403,770 403,770C404,770 405,770 406,770C407,771 408,771 409,772C413,773 417,775 420,778C421,779 421,779 422,780C425,783 431,789 435,793C435,791 436,787 436,785C436,781 435,776 435,773C434,769 433,766 432,763C431,759 429,755 427,752C426,750 425,747 423,745C422,743 420,741 418,739C412,732 394,715 388,709C386,707 384,705 381,703C379,702 377,700 374,699C372,698 369,696 367,695C364,694 360,693 357,693C354,692 351,691 347,691C344,691 340,691 337,691C336,691 335,691 334,691ZM439,887L445,893L451,897L455,898L462,899C463,899 464,898 465,898C466,898 467,898 468,897C469,897 470,896 471,895C472,894 473,894 474,893C475,892 475,891 476,890L476,890C477,889 478,888 478,886C479,885 479,884 479,883L479,883C479,882 480,881 480,881L479,874L477,869C477,868 477,868 477,868L475,865C474,865 474,864 474,864L473,863L461,850C460,850 460,850 460,849C442,831 415,804 405,794C405,794 404,794 404,794C403,793 401,792 399,792C398,791 397,791 396,791C395,791 395,791 394,791C393,791 391,791 390,791C388,791 385,792 384,793L384,793C383,793 382,794 381,795C380,796 379,797 378,798C377,799 376,800 375,801C375,802 374,803 374,804C373,806 373,807 373,808C373,810 373,811 373,812C373,813 373,814 373,815C373,816 374,818 375,820C375,821 376,822 377,824C377,824 378,824 378,825C378,825 379,826 379,826C381,828 382,829 384,831C386,833 389,837 391,839C406,854 428,876 439,887ZM86,536L79,524L76,519C76,519 76,518 76,517L75,517L75,515C74,515 74,514 73,513L73,510L72,509C72,508 72,507 72,506L72,506L71,505C71,505 71,504 71,503L71,502L71,500C71,499 71,498 71,498L71,497L71,496C71,495 71,494 71,494L71,492L71,492C72,491 72,490 72,490L72,489L72,488C72,488 72,487 73,487L73,485L74,484C74,483 74,482 74,482L74,481L75,481C75,480 75,479 76,479L76,477L77,476C77,475 78,475 78,474L78,474L79,474C79,473 80,472 80,472L82,469C83,469 83,469 83,469L83,468L83,468L86,415C86,415 86,414 86,413L88,407C88,406 88,405 89,405L92,400C90,398 89,395 88,393C87,392 87,392 86,391L86,390C86,390 85,389 85,388C85,387 85,386 84,386C83,383 83,380 83,377C82,374 82,371 83,368L83,368C83,368 83,368 83,367C83,367 83,366 83,366C83,363 84,360 85,358C85,358 85,357 85,357L76,363L65,371L61,376L56,383L50,395L48,403L47,413L45,476L46,486L48,496L53,507L59,515L66,523L74,530L85,536L86,536ZM146,594L147,595L148,596L149,597L151,598L154,600L160,601L160,601L164,601L166,601L169,600L172,598L175,596L178,594L180,591L181,587L182,584L182,583L182,577L181,576L179,571L176,564L130,487L127,483L125,482L121,479L115,478L109,478L105,479L102,481L99,484L97,487L96,488L95,490L94,492L93,494L93,495L93,498L93,500L93,501L94,503L95,507L98,512L135,571C135,571 135,572 136,572L144,591L146,594ZM520,998L512,990C512,990 512,989 511,989L507,982C507,982 506,981 506,980C506,980 505,979 505,978L504,976L503,971C503,971 503,970 503,970C503,969 502,968 502,967L502,958L495,954C494,953 493,953 493,952L462,921L462,921C460,921 458,921 456,921C454,921 453,920 452,920C451,920 450,920 449,920C449,920 449,920 449,920C446,919 444,918 442,917C439,916 437,915 435,914C434,913 433,912 432,911C431,911 431,910 431,910C430,909 429,909 429,908C428,907 426,905 424,903L418,897L418,899L418,905L419,919L424,932L428,940L434,949L467,981L475,987L483,992L493,996L502,998L513,999L520,998ZM374,853C369,847 365,843 362,840C362,839 361,839 360,838C358,836 357,833 355,831C355,830 355,830 355,829C354,827 353,825 352,822C351,819 351,817 351,814C351,812 351,811 351,810L351,809C350,808 348,807 346,806L346,806C341,801 326,785 320,779C318,779 317,779 316,779L316,779C313,779 311,779 309,778C305,777 302,776 299,774C297,773 295,772 294,771C292,770 290,768 289,767C286,764 280,758 274,752C274,754 273,756 273,758C273,760 273,764 274,766C274,768 274,770 275,772C275,776 277,782 279,786C280,790 282,793 284,796C286,799 287,802 290,804C296,811 314,829 321,835C323,838 326,840 329,842C332,843 334,845 337,846C341,848 344,849 347,850C350,851 352,852 355,852C359,853 363,853 367,853L367,853C369,853 372,853 374,853ZM478,837C482,841 486,845 489,848L491,850C491,850 491,851 492,851L493,853C493,853 494,854 494,854L496,857C496,858 497,858 497,859L497,859C498,861 499,864 500,867C500,867 500,868 500,868C501,868 501,869 501,869C501,871 501,872 501,874C502,876 502,878 502,880L533,911C534,911 534,912 535,913L540,921L540,921L542,920C542,920 543,920 544,920L550,921C551,921 551,921 552,921L558,922C559,923 559,923 560,923L562,924L562,924C563,924 564,925 565,925L565,926L566,926C566,926 567,926 567,927L571,929L571,930C572,930 572,930 573,931C573,931 573,931 574,932L578,936L580,938L580,931L579,919L577,910L572,899L568,892L563,885L533,855L526,850L519,845L512,841L504,839L496,837L487,836L478,837ZM287,735C290,737 295,742 299,746L303,750C304,751 304,751 305,752C306,752 306,753 307,753C307,753 307,753 307,754L307,754C308,754 308,754 309,755C309,755 309,755 309,755C309,755 310,755 310,755C311,756 312,756 314,757C315,757 318,757 320,757C320,757 321,757 321,757C322,757 323,757 324,757C325,756 327,756 328,755C329,755 330,754 331,754L331,754C332,753 332,752 333,751C334,751 335,750 336,749C336,748 337,746 338,745C338,744 338,743 339,742C339,741 339,740 339,738C339,738 339,737 339,736C339,735 339,733 339,731C339,731 338,731 338,731C338,730 338,729 337,728C336,726 335,725 334,723C334,723 334,723 334,723C333,722 332,721 330,719C316,704 279,668 266,655L262,653L256,651L251,650C250,650 249,650 249,651C247,651 245,652 243,653C242,653 241,654 240,655L240,655C239,655 238,656 237,657C236,658 236,659 235,661C234,662 234,663 233,664C233,665 233,666 232,667L232,674L234,678L237,684L243,691C254,702 273,720 287,735ZM189,543L195,554L198,559C198,560 199,560 199,561L199,562L201,565C201,565 202,566 202,567L202,570L203,570C203,571 203,572 203,573L203,574C204,574 204,575 204,575L204,575L204,578C204,579 204,579 204,580L204,583L204,583L204,583L209,585C209,586 210,586 211,587L215,590C215,590 216,590 216,591L244,619C244,619 245,620 245,620L248,623C248,624 248,624 249,625L250,628L250,628L250,628C252,628 254,628 256,628C257,628 258,629 259,629C260,629 260,629 261,629C263,630 266,630 268,631C272,632 276,634 279,637L279,638C280,638 281,639 281,639L290,648L291,639L290,627L288,617L283,607L279,600L273,593L242,562L236,556L229,552L221,548L212,545L202,543L193,543L189,543ZM265,1489L268,1487C268,1486 268,1486 269,1486L270,1485L270,1485C270,1484 271,1483 272,1483L272,1482L273,1482C273,1482 274,1481 275,1481L275,1481L276,1480C277,1479 277,1479 278,1479L282,1477L282,1477C283,1477 283,1477 284,1476C284,1476 285,1476 286,1476L291,1475C292,1475 292,1474 293,1474L293,1474L293,1474C294,1474 295,1474 296,1474L298,1474L298,1474C299,1474 299,1474 300,1474L301,1474C302,1474 302,1474 303,1474L307,1475L307,1475L309,1472C310,1471 310,1471 310,1470L313,1467C313,1467 314,1467 314,1467L341,1442C342,1441 342,1441 343,1440L350,1436L350,1435C350,1434 350,1434 350,1433L350,1432L351,1427C351,1426 351,1425 351,1424C351,1424 351,1423 352,1423L354,1416C355,1415 355,1415 355,1414C356,1413 356,1412 357,1411L359,1409L360,1407C360,1406 361,1406 362,1405L362,1405C362,1405 362,1404 363,1404L371,1397L367,1396L359,1396L351,1396L343,1398L334,1401L328,1403L321,1408L315,1413L284,1441L279,1448L274,1454L269,1465L267,1475L265,1487L265,1489ZM230,1584L227,1589L226,1594L226,1595L226,1599L227,1605L227,1605L230,1610L233,1612L236,1615L240,1616L244,1617L248,1617L251,1616L255,1615L258,1613L262,1609L263,1608L276,1587L284,1576C284,1575 284,1575 284,1575L308,1538L316,1525L318,1520L318,1520L318,1517L318,1514L317,1510L316,1507L314,1504L312,1502L309,1499L306,1498L302,1497L298,1496L298,1496L296,1496L291,1497L286,1500L286,1500L285,1501L280,1506L230,1584ZM481,1384L482,1382L484,1379L485,1375L485,1372L484,1365L483,1362L482,1359L477,1354L474,1353L471,1352L464,1351L462,1351L457,1352L451,1356L447,1360L378,1420L376,1422L375,1424L373,1430L372,1434L372,1435L373,1440L374,1443L376,1447L379,1450L382,1452L386,1454L389,1454L395,1455L396,1454L400,1453L400,1453L404,1451L405,1450L481,1384ZM420,1354L432,1343L437,1339C438,1338 438,1338 438,1338L438,1338C438,1338 439,1337 439,1337L444,1334C445,1333 446,1333 447,1332L448,1332C449,1332 449,1331 450,1331L455,1330C456,1329 457,1329 457,1329L458,1329C458,1329 458,1329 458,1329L459,1329L463,1329C463,1329 464,1328 464,1329C465,1328 465,1328 465,1329L469,1329L470,1329L498,1304L498,1304L499,1299C499,1298 499,1298 499,1297L499,1297L499,1296C499,1296 500,1295 500,1294L500,1293L500,1292C501,1291 501,1291 501,1290L502,1289L503,1287C503,1286 503,1285 504,1284L505,1283L505,1282C505,1282 506,1281 507,1280L508,1278L509,1277C509,1277 510,1276 511,1276L511,1275L511,1275C512,1275 512,1274 512,1274L530,1259L521,1258L509,1258L499,1260L488,1264L482,1268L475,1272L441,1302L435,1308L430,1315L426,1323L423,1331L421,1340L420,1350L420,1354ZM428,1460L419,1467L419,1467C419,1467 419,1468 419,1468L418,1468C418,1468 417,1469 417,1469L416,1470L412,1472C411,1472 411,1473 410,1473L409,1473C408,1474 408,1474 407,1474L406,1474L404,1475C403,1475 403,1476 402,1476L401,1476L399,1476C398,1476 397,1477 396,1477L396,1477C395,1477 394,1477 394,1477L388,1476C387,1476 387,1476 387,1476L386,1477L386,1477L382,1482C382,1483 381,1484 381,1484L353,1510C352,1510 352,1511 351,1511L347,1514C346,1514 346,1514 345,1515L340,1516L340,1518L340,1518C340,1519 340,1519 340,1520L340,1522L340,1523C339,1524 339,1524 339,1525L339,1525C339,1526 339,1527 339,1527L337,1532C337,1533 337,1533 337,1534C336,1534 336,1535 336,1535L335,1536L334,1539C334,1539 334,1539 333,1540L327,1550L324,1555L332,1556L345,1555L358,1551L367,1547L375,1542L408,1512L415,1504L420,1496L425,1487L427,1477L428,1467L428,1460ZM312,1621L311,1616L310,1608L306,1598L303,1591L301,1589L281,1620C281,1621 280,1621 280,1622C280,1622 280,1622 279,1623L278,1624L274,1629C273,1629 273,1629 273,1629L271,1677C271,1677 271,1678 271,1678L270,1685L270,1685L298,1693L299,1690C300,1688 301,1687 302,1686L309,1679C309,1669 309,1658 309,1648C309,1639 311,1630 312,1621ZM330,1768L336,1770L338,1771L345,1771L346,1771L348,1771L350,1770L351,1770L352,1769L354,1768L357,1765L359,1763L361,1760L362,1756L363,1753L363,1749L362,1746L361,1743L359,1739L357,1737L354,1734L348,1731L344,1730L254,1703L248,1703L242,1705L238,1708L234,1712L232,1715L231,1719L231,1721L230,1724L231,1727L231,1727L232,1731L234,1735L236,1738L239,1740L245,1743L330,1768ZM210,1736L210,1734C209,1733 209,1733 209,1732L209,1732L209,1732C209,1731 209,1731 209,1730L209,1729L208,1727C208,1726 208,1725 208,1725L208,1724L208,1724C208,1723 208,1722 208,1722L209,1719L209,1717C209,1716 209,1715 209,1715C209,1714 209,1714 210,1713L211,1708C212,1707 212,1707 212,1706C212,1706 212,1705 213,1705L215,1700C216,1700 216,1699 216,1699L219,1695L215,1689C214,1688 214,1686 213,1685L212,1679C212,1678 212,1677 212,1676L213,1624L213,1624L213,1624C213,1623 212,1623 212,1622L212,1622L210,1620C210,1619 209,1619 209,1618L208,1615L207,1615C207,1614 207,1614 207,1613L206,1613C206,1612 206,1611 206,1611L204,1605C204,1604 204,1603 204,1603C204,1602 204,1602 204,1601L204,1601L203,1597C203,1597 203,1596 203,1595L204,1594L204,1593C203,1592 204,1591 204,1590L204,1589C204,1588 204,1588 204,1587L206,1581C206,1581 207,1580 207,1580C207,1579 207,1578 208,1578L212,1572L218,1562L209,1566L197,1574L192,1580L188,1585L181,1597L177,1606L175,1618L173,1672L173,1684L175,1694L179,1704L184,1713L190,1721L198,1729L208,1735L210,1736ZM523,667C524,668 526,670 527,671C528,672 529,672 530,673L530,673C530,674 531,674 533,675C534,675 535,676 536,676C537,676 538,677 539,677C540,677 542,677 543,677C544,677 545,677 546,676C548,676 549,675 550,675C551,674 552,674 553,673L553,673C554,672 555,672 556,671C557,670 557,669 558,668L558,668C559,667 559,666 560,665C560,664 561,663 561,661C562,660 562,659 562,658C562,657 562,655 562,654C562,653 561,652 561,651C561,650 560,649 560,648C559,646 557,643 556,642L556,642C547,632 521,606 502,588L502,588C501,587 500,586 498,584C493,579 488,575 485,572C484,571 483,571 482,570C480,569 478,569 476,569C474,569 473,569 471,569L471,569C469,569 466,570 464,571C463,572 462,572 462,573L462,573C461,574 460,575 459,576C458,577 457,578 456,579C456,580 455,582 455,583C454,584 454,585 454,587C454,588 454,589 454,591C454,592 454,593 454,595C455,596 455,597 456,598C456,599 457,601 458,602C459,603 460,604 461,605C474,618 509,653 523,667ZM414,468C417,472 422,476 425,480C427,481 428,483 429,484C430,484 430,485 431,486C432,488 434,489 435,491C435,492 436,493 436,494L436,494C438,496 439,499 439,501C439,501 440,502 440,502C440,505 441,507 441,510C441,511 441,512 441,514C448,520 463,536 468,541C470,542 471,545 472,546C475,546 480,546 483,547C487,548 491,550 494,551C497,553 500,555 502,557C504,559 509,564 513,568L515,570C515,568 516,564 516,562C516,558 515,553 515,550C514,546 513,543 512,540C511,536 509,532 507,529C506,527 505,524 503,522C502,520 500,518 498,516C492,509 474,492 468,486C466,484 464,482 461,480C459,479 457,477 454,476C452,475 449,473 447,472C444,471 440,470 437,470C434,469 431,468 427,468C424,468 420,468 417,468C416,468 415,468 414,468ZM454,630C453,628 452,627 450,625C447,623 445,620 444,619C443,618 443,618 442,617C442,617 442,616 441,616C439,614 437,611 435,608C434,604 432,600 432,596L432,596C431,593 431,589 431,586C430,585 428,584 426,583L426,583C421,578 406,562 400,556C398,556 397,556 396,556L396,556C393,556 391,556 389,555C385,554 382,553 379,551C377,550 375,549 374,548C372,547 370,545 369,544C365,541 360,535 354,529C354,531 353,533 353,535C353,537 353,541 354,543C354,545 354,547 355,549C355,553 357,559 359,563C360,567 362,570 364,573C366,576 367,579 370,581C376,588 394,606 401,612C403,615 406,617 409,619C412,620 414,622 417,623C421,625 424,626 427,627C430,628 432,629 435,629C439,630 443,630 447,630L447,630C449,630 452,630 454,630ZM608,784C603,778 599,774 596,771C596,771 595,770 594,769C593,767 591,764 589,762C589,761 589,761 589,760C588,758 587,756 586,753C585,750 585,748 585,745C585,743 585,742 585,741L585,740C584,739 582,738 580,737L580,737C575,732 560,716 554,710C551,710 546,710 543,709C539,708 536,707 533,705C530,704 527,702 524,699C522,697 517,692 513,688C512,687 512,687 511,686L508,683C508,685 507,687 507,689C507,691 507,695 508,697C508,699 508,701 509,703C509,707 511,713 513,717C514,721 516,724 518,727C520,730 521,733 524,735C530,742 548,760 555,766C557,769 560,771 563,773C566,774 568,776 571,777C575,779 578,780 581,781C584,782 586,783 589,783C593,784 597,784 601,784L601,784C603,784 606,784 608,784ZM694,726C694,727 694,729 693,730C690,753 686,789 677,851C630,1168 585,1297 569,1365C624,1354 735,1340 930,1342C1096,1344 1212,1361 1248,1367C1240,1344 1227,1302 1211,1235C1133,906 1129,777 1126,723C1125,714 1124,705 1124,701C1101,686 1049,673 988,667C892,656 773,661 698,703C696,708 695,715 694,726ZM1154,438C1153,438 1153,437 1152,437C1111,413 1039,393 919,393C780,392 710,417 675,439C674,441 672,442 670,443C655,453 648,463 644,469C630,493 643,514 660,524C662,512 664,503 665,500C668,493 674,485 684,479C694,472 708,466 725,461C786,443 890,436 981,442C1043,445 1098,455 1129,471C1148,481 1160,493 1164,506L1164,506C1164,507 1165,514 1166,523C1170,521 1174,518 1177,516C1186,509 1194,499 1194,487C1193,475 1184,460 1165,445C1161,443 1158,440 1154,438ZM677,391C723,369 797,350 919,351C1028,351 1100,367 1148,388C1163,300 1175,213 1180,177L1155,169L1138,255C1136,266 1126,273 1115,272C1105,271 1096,261 1097,250C1097,250 1101,136 1100,97C1098,96 1095,95 1093,95C1074,90 1046,85 1023,89L1011,200C1010,211 1001,220 990,220C978,219 969,210 969,199C969,199 968,98 966,51C951,50 881,50 857,51C855,81 850,200 850,200C850,211 841,220 830,220C818,220 809,211 809,200C809,200 805,126 800,91L721,103C720,139 722,253 722,253C722,264 713,274 702,274C691,274 681,266 680,254L674,168L639,180C645,220 666,326 677,391ZM1124,560C1124,545 1124,525 1123,518C1122,516 1121,515 1119,514C1114,510 1107,507 1099,504C1070,493 1026,486 978,484C893,478 794,485 737,501C726,505 717,508 710,512C707,514 705,515 703,517C703,519 701,530 700,538C699,545 698,552 698,560C701,559 704,558 707,557C755,541 870,530 977,536C1031,539 1083,547 1124,560ZM1167,703C1175,695 1187,678 1186,660C1185,644 1173,628 1146,614C1141,611 1137,609 1132,607C1132,607 1131,607 1130,606C1090,590 1033,581 975,578C873,572 765,582 720,597C708,600 698,604 689,608C687,609 686,610 684,610C662,622 649,634 643,647C637,661 642,676 650,687C652,690 654,693 656,695C657,693 657,691 658,690C662,676 666,673 673,669C755,621 887,613 993,625C1065,633 1125,651 1150,669C1158,674 1164,683 1166,701C1166,702 1167,703 1167,703ZM1302,1506C1302,1506 1302,1505 1301,1505C1258,1492 1076,1476 896,1478C715,1479 546,1494 503,1506C494,1538 464,1653 456,1694C491,1714 527,1728 548,1736L569,1680C573,1670 583,1665 594,1667C594,1667 644,1681 669,1686C693,1690 742,1697 742,1697C751,1698 759,1705 760,1715L771,1793C798,1797 856,1804 914,1805C969,1805 1026,1801 1053,1799L1064,1717C1065,1707 1073,1700 1082,1699C1082,1699 1117,1693 1134,1690C1159,1685 1232,1669 1232,1669C1241,1668 1249,1671 1254,1677L1291,1728C1312,1714 1347,1690 1365,1677C1352,1631 1313,1533 1302,1506ZM1274,1413C1274,1413 1273,1413 1272,1413C1268,1412 1263,1411 1258,1411C1254,1411 1127,1386 930,1384C654,1381 552,1411 534,1415C517,1420 507,1426 501,1434C494,1444 494,1455 495,1465L495,1465C498,1464 501,1463 505,1463C565,1450 725,1437 896,1436C1066,1434 1237,1449 1299,1462C1303,1462 1306,1463 1309,1464C1309,1462 1309,1460 1309,1458C1310,1448 1308,1436 1300,1426C1294,1420 1286,1416 1274,1413ZM1457,447C1446,458 1431,473 1420,485C1417,487 1414,491 1410,494C1409,496 1407,497 1405,499C1405,500 1404,500 1404,501C1403,501 1403,502 1402,502C1402,502 1402,503 1402,503L1402,503C1402,503 1401,504 1401,505C1401,505 1401,505 1401,505C1400,505 1400,505 1400,506C1400,507 1399,508 1399,509C1399,511 1398,513 1398,516C1398,516 1398,516 1398,517C1399,518 1399,519 1399,520C1399,521 1400,522 1400,523C1401,524 1401,525 1402,526C1403,527 1403,528 1404,529C1405,530 1406,531 1407,531C1408,532 1409,533 1411,533C1412,534 1413,534 1414,534C1415,535 1416,535 1417,535C1418,535 1418,535 1419,535C1421,535 1423,535 1424,534C1425,534 1425,534 1425,534C1426,534 1427,533 1428,533C1429,532 1431,531 1432,530C1433,530 1433,529 1433,529C1434,528 1435,527 1437,526C1448,515 1470,493 1485,477C1476,467 1467,457 1457,447ZM1289,1259L1307,1274C1307,1274 1307,1275 1308,1275L1308,1275C1308,1276 1309,1276 1309,1277L1310,1278L1313,1281C1313,1282 1314,1282 1314,1283L1314,1283L1314,1284C1315,1284 1316,1285 1316,1286L1317,1288L1318,1291C1319,1292 1319,1293 1319,1294C1319,1294 1319,1295 1319,1295L1321,1301C1321,1302 1321,1303 1321,1304L1321,1304L1348,1328L1350,1329L1353,1329L1354,1329C1355,1328 1355,1328 1356,1329L1358,1329L1358,1329C1359,1329 1360,1329 1361,1329L1361,1329L1362,1329C1362,1329 1363,1329 1364,1330L1368,1331L1369,1331C1370,1332 1371,1332 1372,1332L1379,1337C1380,1337 1380,1338 1381,1338L1381,1338C1381,1338 1381,1338 1382,1339L1382,1339L1399,1354L1399,1352L1399,1346L1396,1332L1391,1320L1386,1311L1379,1303L1344,1273L1335,1267L1326,1262L1318,1260L1308,1258L1297,1258L1289,1259ZM1448,1397L1457,1405C1457,1405 1457,1405 1458,1405C1458,1406 1459,1406 1459,1407L1463,1413C1464,1414 1464,1414 1464,1415C1465,1415 1465,1416 1465,1417L1467,1422L1467,1423C1468,1423 1468,1424 1468,1424C1468,1425 1468,1426 1468,1427L1468,1429L1469,1433C1469,1434 1469,1435 1469,1436L1469,1436L1469,1437L1469,1437L1475,1440C1476,1440 1477,1441 1477,1441L1505,1467C1506,1467 1506,1468 1507,1468L1512,1475L1516,1475L1519,1474C1520,1474 1520,1474 1521,1474L1521,1474C1522,1474 1523,1474 1523,1474L1524,1474L1526,1474C1527,1474 1527,1475 1528,1475L1533,1476C1534,1476 1535,1476 1535,1476L1540,1478C1541,1479 1541,1479 1542,1479L1545,1481C1546,1482 1546,1482 1546,1482L1546,1482C1547,1483 1547,1483 1548,1483L1549,1485L1551,1486C1552,1487 1552,1487 1552,1487L1554,1489L1554,1485L1553,1476L1551,1470L1546,1457L1541,1449L1535,1441L1502,1411L1494,1405L1485,1401L1475,1398L1465,1396L1455,1396L1448,1397ZM1601,1562L1606,1569L1609,1574C1610,1575 1610,1575 1610,1576L1611,1577L1611,1578C1612,1579 1612,1579 1612,1580L1614,1584L1614,1585C1614,1585 1614,1586 1615,1587L1615,1587C1615,1588 1615,1588 1615,1589L1615,1591L1616,1593C1616,1594 1616,1595 1616,1595L1616,1596L1616,1596C1616,1597 1616,1598 1616,1598L1615,1600L1615,1602C1615,1602 1615,1603 1615,1603L1615,1604L1615,1605C1615,1605 1615,1606 1615,1607L1614,1608L1614,1609C1614,1610 1613,1611 1613,1612L1613,1612C1613,1612 1612,1613 1612,1613L1611,1616L1610,1617C1610,1618 1610,1618 1610,1618C1610,1619 1609,1619 1609,1620L1606,1624L1606,1624L1607,1676C1607,1677 1607,1678 1607,1679L1605,1686C1605,1687 1604,1688 1604,1689L1600,1695L1602,1699L1604,1700C1604,1700 1604,1701 1604,1701C1605,1702 1605,1702 1605,1703L1606,1704L1608,1707C1608,1708 1608,1709 1608,1710L1609,1710C1609,1711 1609,1712 1609,1712L1609,1714L1610,1715C1610,1716 1610,1717 1610,1718L1610,1718C1610,1718 1610,1719 1610,1719L1611,1723L1611,1724C1611,1724 1611,1725 1611,1725C1611,1726 1611,1726 1611,1727L1610,1732C1610,1733 1610,1733 1609,1734L1609,1735C1609,1735 1609,1736 1609,1736L1615,1733L1623,1726L1629,1721L1633,1715L1638,1708L1641,1701L1645,1689L1646,1677L1644,1620L1642,1608L1638,1597L1632,1586L1625,1577L1615,1569L1603,1562L1601,1562ZM1535,1501L1534,1500L1527,1497L1522,1496L1521,1496L1518,1496L1517,1497L1513,1498L1510,1499L1508,1501L1505,1505L1503,1508L1502,1511L1501,1515L1501,1517L1501,1520L1501,1521L1502,1522L1504,1526L1510,1536L1558,1610L1558,1611L1563,1614L1567,1616L1573,1617L1579,1616L1582,1615L1585,1613L1589,1610L1591,1607L1591,1606L1592,1604L1593,1602L1593,1600L1594,1598L1594,1597L1593,1594L1593,1592L1593,1592L1591,1587L1587,1580L1539,1506L1536,1503L1535,1501ZM1588,1721L1588,1719L1588,1718L1586,1714L1586,1713L1585,1712L1583,1710L1580,1707L1577,1705L1573,1704L1569,1703L1562,1704L1477,1729L1471,1731L1468,1732L1467,1733L1464,1735L1462,1737L1459,1740L1458,1744L1457,1747L1456,1750L1456,1754L1457,1757L1459,1761L1461,1764L1463,1766L1464,1767L1465,1768L1467,1769L1469,1770L1470,1770L1472,1771L1473,1771L1475,1771L1478,1771L1483,1770L1486,1769L1577,1742L1582,1739L1585,1735L1588,1730L1589,1724L1588,1721ZM1339,1384L1413,1450L1414,1450L1415,1451L1419,1453L1424,1455L1425,1455L1430,1455L1433,1454L1437,1452L1440,1450L1443,1447L1445,1443L1446,1440L1447,1435L1446,1431L1446,1430L1446,1429L1445,1425L1441,1420L1368,1356L1368,1356L1361,1352L1357,1351L1356,1351L1354,1351L1348,1352L1345,1353L1342,1354L1338,1359L1334,1365L1334,1368L1334,1372L1334,1375L1335,1378L1339,1384ZM1495,1555L1491,1548L1486,1540C1485,1539 1485,1539 1485,1538L1484,1536L1483,1535C1483,1534 1482,1533 1482,1532L1481,1530L1481,1529C1480,1528 1480,1527 1480,1526L1480,1526L1480,1525C1480,1525 1480,1524 1479,1523L1479,1522L1479,1521C1479,1520 1479,1520 1479,1519L1479,1518L1479,1516L1479,1516L1474,1515C1473,1514 1473,1514 1472,1514L1468,1511C1467,1511 1467,1510 1466,1510L1438,1484C1438,1484 1437,1483 1437,1483L1432,1476L1432,1476L1431,1476L1425,1477C1425,1477 1424,1477 1423,1477C1422,1477 1421,1477 1420,1476L1419,1476L1417,1476C1416,1476 1416,1475 1415,1475L1412,1474L1411,1474C1411,1474 1410,1474 1410,1473L1409,1473C1408,1473 1408,1472 1407,1472L1404,1470L1402,1469C1402,1469 1401,1468 1400,1468L1400,1468C1400,1468 1400,1467 1400,1467L1399,1467L1391,1459L1391,1469L1392,1479L1396,1490L1400,1499L1405,1506L1410,1512L1442,1541L1449,1546L1457,1550L1464,1553L1472,1555L1482,1556L1492,1556L1495,1555ZM1384,793L1389,788L1396,781C1396,780 1397,780 1397,780C1397,780 1398,779 1398,779L1404,775C1405,774 1405,774 1405,774C1406,773 1407,773 1407,773L1413,771C1413,770 1414,770 1415,770C1415,770 1416,770 1417,770L1417,770L1421,769C1422,769 1423,769 1423,769L1426,769L1426,769L1427,769L1430,765C1430,764 1431,764 1431,764L1457,738L1458,737L1458,734L1458,734C1458,733 1458,732 1458,732L1459,729L1459,729C1459,728 1459,728 1459,727L1459,727C1459,726 1459,725 1459,725L1461,719C1462,719 1462,718 1462,718L1462,718C1463,717 1463,716 1463,716L1464,715L1465,713C1465,713 1466,712 1466,712L1468,710L1468,709C1468,709 1469,708 1469,708L1469,708L1469,707C1470,707 1470,707 1470,707L1475,702L1485,692L1478,691L1472,691L1464,692L1450,696L1442,701L1432,707L1401,738L1395,747L1390,755L1386,765L1384,774L1383,786L1384,793ZM1239,938L1242,935L1245,932C1246,931 1246,931 1247,931L1247,930L1247,930C1247,930 1248,929 1249,929L1249,929L1252,927C1252,926 1253,926 1253,926L1256,925L1256,924C1257,924 1258,923 1259,923L1259,923C1260,923 1260,923 1261,922L1267,921C1268,921 1268,921 1268,921C1269,920 1270,920 1270,920L1272,920L1275,920C1276,920 1277,920 1277,920L1278,920L1280,920L1284,913C1284,913 1285,912 1285,911L1313,884C1313,883 1313,883 1313,883L1317,880L1317,879L1317,879L1317,877C1317,876 1317,875 1317,875L1318,869C1318,869 1319,868 1319,867L1319,867L1321,862C1321,861 1321,861 1321,861C1322,860 1322,859 1322,859L1323,858L1324,855C1325,855 1325,854 1325,854L1327,852L1327,851C1327,851 1328,850 1328,850L1341,837L1334,836L1320,837L1314,839L1306,842L1297,847L1289,852L1256,885L1250,893L1245,902L1242,910L1240,919L1239,931L1239,938ZM1529,648L1535,641L1537,640C1537,640 1537,640 1538,639L1538,639C1539,639 1539,638 1540,638L1544,635L1546,634C1546,633 1547,633 1547,633C1548,632 1549,632 1549,632L1551,631L1554,630C1555,630 1555,630 1556,629L1557,629C1558,629 1559,629 1560,629L1560,629L1562,628C1563,628 1564,628 1564,628L1568,628L1569,628L1570,625C1571,624 1571,624 1571,623L1574,620C1574,620 1575,619 1575,619L1603,590C1604,590 1604,589 1605,589L1609,586C1609,586 1610,585 1611,585L1615,583L1615,581C1615,580 1615,580 1615,579L1615,579L1615,576C1615,575 1615,574 1616,574L1616,574C1616,573 1616,573 1616,572L1617,567C1617,566 1618,566 1618,565C1618,565 1618,564 1619,564L1619,563L1620,560C1621,560 1621,560 1621,559L1625,551L1630,543L1622,543L1609,545L1601,547L1595,549L1586,554L1579,560L1546,593L1539,601L1534,610L1531,619L1529,629L1528,641L1529,648ZM1307,990L1299,998L1308,999L1320,998L1330,995L1339,991L1346,987L1352,981L1384,950L1389,943L1393,936L1397,928L1399,920L1401,911L1401,901L1401,897L1399,900L1390,908C1390,909 1389,909 1389,909L1388,910C1388,910 1387,911 1387,911L1381,915C1380,916 1380,916 1379,916C1379,916 1379,917 1378,917L1373,919C1372,919 1371,919 1371,919L1371,920C1370,920 1369,920 1369,920L1367,920L1365,921C1365,921 1364,921 1363,921L1363,921C1363,921 1362,921 1362,921L1357,921L1357,921L1326,952C1326,953 1325,953 1324,954L1317,958L1317,959C1317,959 1317,960 1317,960L1317,961L1316,967C1316,968 1316,969 1316,970C1316,971 1316,971 1316,971L1313,979L1313,979C1313,980 1313,981 1312,982L1308,989C1307,989 1307,990 1307,990ZM1582,683L1584,681L1585,679L1586,676L1587,673L1587,672L1586,667L1584,661L1582,658L1580,655L1576,653L1573,651L1569,650L1562,651L1562,651L1558,652L1557,652L1557,653L1552,656L1551,657L1491,717L1486,722L1485,723L1482,727L1482,727L1480,732L1480,736L1480,739L1480,742L1482,746L1483,748L1486,752L1489,754L1492,756L1495,757L1499,757L1499,757L1505,757L1505,757L1510,755L1515,751L1522,744L1582,683ZM1733,357L1733,357L1735,362C1735,362 1735,363 1736,364L1736,364L1736,364C1736,365 1736,366 1736,367L1736,369L1736,370C1737,371 1737,371 1737,372L1737,372C1737,373 1737,373 1737,374L1736,375L1736,378C1736,379 1736,380 1736,380L1736,381C1736,381 1736,381 1736,382L1734,386C1734,387 1734,388 1734,388L1733,390L1733,391C1732,392 1732,392 1731,393L1731,394L1731,394C1731,395 1730,395 1730,396L1729,397L1727,400L1730,405C1731,406 1731,407 1732,408L1733,413C1733,414 1733,415 1733,415L1736,468L1736,468L1736,469L1737,469C1737,470 1738,471 1739,471L1739,472L1740,473C1740,473 1740,474 1741,474L1744,480C1744,480 1744,481 1745,482L1747,488C1747,489 1747,490 1747,490C1748,491 1748,492 1748,493L1748,494L1748,497C1748,497 1748,498 1748,499L1748,501L1748,502C1748,503 1748,504 1748,505L1748,505L1748,505C1747,506 1747,507 1747,507L1746,511L1746,513C1745,513 1745,514 1745,515C1745,515 1744,516 1744,516L1733,536L1741,532L1749,527L1755,521L1761,515L1765,508L1769,501L1773,488L1774,477L1772,413L1771,403L1767,392L1762,382L1755,372L1745,363L1733,357ZM1692,605L1691,607C1691,607 1690,608 1690,608L1686,612C1686,612 1685,613 1685,613L1680,616C1680,617 1679,617 1679,617L1676,619C1676,619 1675,619 1675,619L1674,620C1674,620 1673,620 1672,621L1666,622C1666,623 1665,623 1664,623L1664,623C1664,623 1664,623 1663,623L1662,623L1659,623C1658,623 1658,623 1657,623C1657,623 1657,623 1656,623L1651,623L1650,626C1649,627 1649,628 1648,629L1646,632C1645,632 1645,632 1645,632L1617,661C1616,661 1616,662 1615,662L1609,666L1609,672L1609,673C1609,674 1609,675 1609,675L1608,675C1608,676 1608,677 1608,678L1607,682L1606,684C1606,685 1606,686 1605,687L1605,687C1605,688 1605,689 1604,690L1602,693L1601,695C1601,696 1600,697 1599,697L1599,697C1599,698 1598,699 1598,699L1590,707L1598,708L1608,707L1620,704L1629,699L1636,695L1643,690L1675,658L1680,651L1685,644L1688,636L1691,628L1692,618L1693,608L1692,605ZM1725,506L1725,505L1726,501L1726,500L1726,495L1726,495L1724,490L1721,485L1720,484L1718,482L1715,480L1711,478L1707,478L1703,478L1699,479L1695,481L1693,482L1689,487L1688,488L1683,497L1645,562L1638,573L1637,578L1637,580L1637,581L1637,584L1638,587L1639,591L1641,593L1644,596L1647,598L1651,600L1654,601L1657,601L1660,601L1660,601L1666,599L1671,596L1676,590L1725,506ZM1545,752L1538,760L1530,767C1530,767 1530,767 1529,768L1529,768C1529,768 1528,769 1528,769L1523,773C1522,773 1521,774 1521,774L1521,774C1520,774 1519,775 1518,775L1513,777C1513,777 1513,777 1512,777L1512,778C1511,778 1510,778 1509,778L1508,778L1507,779C1506,779 1505,779 1504,779L1500,779L1500,779L1499,779L1473,806C1472,806 1472,806 1472,807L1468,809L1468,809L1468,812L1468,812C1468,813 1468,814 1468,815L1468,817L1468,819C1467,820 1467,821 1467,822L1466,823L1466,824C1466,825 1466,826 1465,827L1464,828L1464,830C1463,831 1463,832 1462,833L1461,834L1461,835C1460,836 1460,837 1459,837L1459,837L1458,838C1458,839 1458,839 1457,840L1445,853L1454,853L1465,852L1475,849L1485,845L1492,841L1498,835L1528,806L1533,799L1538,792L1541,784L1544,776L1545,766L1546,756L1545,752ZM1442,823L1442,823L1444,819L1445,817L1446,813L1446,811L1446,807L1444,802L1442,798L1439,795L1436,793L1432,792L1428,791L1427,791L1420,791L1416,793L1411,797L1404,804L1345,864L1344,865L1341,870L1341,870L1340,874L1339,880L1339,881L1340,884L1341,887L1343,890L1345,893L1349,896L1352,897L1355,898L1359,899L1361,899L1363,899L1364,898L1369,897L1375,892L1383,884L1442,823ZM1323,672L1307,688C1307,688 1306,689 1306,689L1301,693C1300,693 1299,694 1299,694L1290,698C1289,698 1288,698 1287,698L1278,699L1277,699L1251,726C1250,726 1250,726 1250,727L1246,729L1246,729L1246,739C1245,740 1245,741 1245,742L1242,750C1241,751 1241,752 1240,753L1236,758C1236,759 1236,759 1235,760L1223,773L1232,773L1243,772L1253,769L1263,765L1270,761L1276,755L1306,726L1311,719L1316,712L1319,704L1322,696L1323,686L1324,676L1323,672ZM1464,530C1461,533 1456,537 1453,541C1451,542 1450,544 1449,545C1448,545 1447,546 1447,547C1445,548 1443,550 1441,551C1440,551 1440,551 1439,552L1438,552C1436,553 1434,554 1432,555C1431,555 1431,555 1430,556C1428,556 1425,557 1423,557C1422,557 1420,557 1419,557C1412,563 1397,579 1392,584C1390,585 1388,587 1387,588L1387,592C1387,593 1387,594 1387,595L1385,603C1385,604 1384,605 1384,606L1380,613C1379,614 1379,615 1378,616L1363,631C1365,631 1368,631 1371,631C1375,631 1379,631 1383,630C1386,630 1389,629 1393,628C1396,627 1400,625 1404,623C1406,622 1408,621 1411,619C1413,617 1415,616 1417,614C1423,608 1441,590 1447,584C1449,582 1451,579 1452,577C1454,575 1455,572 1457,570C1458,568 1459,565 1460,562C1461,560 1462,556 1463,553C1464,550 1464,546 1464,543C1465,540 1465,536 1464,533C1464,532 1464,531 1464,530ZM1343,620C1343,619 1344,618 1345,618C1347,615 1356,606 1360,603C1360,602 1361,601 1362,600C1363,598 1364,596 1364,594C1365,592 1365,591 1365,589L1365,586L1363,580L1361,577L1358,574L1355,571L1351,570L1347,569L1343,569L1339,569L1336,571L1330,575L1268,637L1263,642L1261,644L1260,645L1259,648L1258,651L1257,655L1257,658L1258,662L1259,665L1264,672L1267,674L1270,675L1273,676L1277,677L1280,677L1284,676L1287,675L1293,670L1343,620ZM1303,570C1307,566 1313,560 1316,557C1319,555 1322,553 1325,551C1328,550 1333,548 1337,547L1337,547C1339,547 1344,547 1346,546C1352,541 1370,523 1376,515C1376,514 1376,513 1376,512C1377,509 1377,507 1377,504C1378,501 1380,498 1381,494C1382,493 1383,491 1385,489C1386,488 1387,486 1389,485C1392,481 1397,476 1404,470C1402,469 1400,469 1398,469C1395,469 1392,469 1389,469C1387,470 1385,470 1383,470C1380,471 1374,473 1369,474C1366,476 1362,478 1359,480C1357,481 1354,483 1352,485L1352,485C1345,492 1327,510 1320,517C1318,519 1316,522 1314,524C1312,527 1311,530 1309,533L1309,533C1308,536 1306,540 1305,543L1305,543C1305,545 1304,548 1303,551C1303,554 1302,559 1302,563L1302,563C1302,565 1303,568 1303,570Z"/></g></g>',
+};
+Object.assign(PATHS, MODE_F);
 export const ICON_NAMES = Object.keys(PATHS);
 
 // 🔴 THE SPRITE IS INJECTED AT MODULE EVALUATION, not on DOMContentLoaded. `<use href="#i-…">` resolves against the document, and an element already in the DOM when its symbol arrives is not guaranteed to re-resolve — so waiting can leave icons permanently blank on a page whose markup rendered during parsing. documentElement always exists by the time a module body runs.
@@ -86,6 +163,9 @@ const FOLD_CLOSED = 'M6 9 L12 15 L18 9';
 const FOLD_OPEN = 'M6 15 L12 9 L18 15';
 
 export function Fold({ open, cls }) {
+    // BOARD: pin 5 asks for board 2's fold marks, which do not collide with the sort chevrons. A1's
+    // fixed state swaps them in everywhere a fold control is drawn.
+    if (useB3('a1') === 'fixed') return html`<${Icon} name=${open ? 'b2-fold' : 'b2-unfold'} cls=${'ic-fold' + (cls ? ' ' + cls : '')} />`;
     return html`
         <svg class=${'ic ic-fold' + (open ? ' open' : '') + (cls ? ' ' + cls : '')}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
```

## `ui/manifest.js` → `portal/ui/manifest.js`

```diff
diff --git aportal/ui/manifest.js bkit/ui/manifest.js
index 467a2f2b..42f30945 100644
--- aportal/ui/manifest.js	
+++ bkit/ui/manifest.js	
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
+                    onClick=${() => onChange({ ...filters, [g.key]: o.value })}>${g.topic && o.value !== 'all' ? (o.icon ? html`<${Icon} name=${o.icon} />` : html`<i></i>`) : null}${o.bars ? html`<span class="msev" data-n=${o.bars} aria-hidden="true"><i></i><i></i><i></i><i></i></span>` : null}<span class="cl">${o.label}</span>${o.count == null ? null : html` <em>${o.count}</em>`}</button>`)}
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
@@ -234,6 +248,7 @@ export function Manifest({ label = null, rows, columns, searchableFields, bulkAc
                 </tr></thead>
                 <tbody>
                     ${visible.map(row => html`
+                        ${''/* 2026-09-21 13:28 EDT — the row carries its own accent (--c) as well as its swatch, so a realm can tint the whole row by it: board 2 · G11's row hover is three radial washes in the announcement's colour (pin 45). */}
                         <tr class=${(selected.has(row.id) ? 'sel' : '') + (selectedRowId != null && String(row.id) === String(selectedRowId) ? ' preview-sel' : '')}
                             ${''/* 🔴 `preview-sel` IS BACK AND IT HAS A RULE NOW — restored 2026-09-09 14:58 EDT, and the history is the point. It was emitted here for the life of the branch and painted by NOTHING on either side, so the one row a reader most needs to find looked exactly like its neighbours; it was then deleted rather than styled, because §0.6a said the portal renders the mockup's version until every realm matches and the mockup marks nothing here. **Conformance ended with the build-out**, and the state was always real: close the details panel on a 133-build rack or a 1,394-row river and nothing says which row you had open. ⚠️ **THIS IS A DELIBERATE DIVERGENCE, CHOSEN BY HARKIRAT** from three rendered options — no mark, a left edge, a tinted row — and he picked the edge because it reuses the accent language already on the page where a tint would read as the bulk-selection state. The design still marks nothing; that is a ledger row, not a defect here.
                                  ⚠️ AND IT CANNOT BE AN HTML COMMENT: this sits inside a tag's PROP LIST, where htm swallows every prop after an `<!-- -->`. The first version of this note did exactly that and would have killed `tabIndex`, `onKeyDown` and `onClick` on every manifest row on every realm. The `${''\/* *\/}` form two lines down is the file's own idiom for the same reason. */}
@@ -245,7 +260,8 @@ export function Manifest({ label = null, rows, columns, searchableFields, bulkAc
                                 if (e.target !== e.currentTarget) return;
                                 if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); }
                             }) : null}
-                            onClick=${onRowClick ? () => onRowClick(row) : null} style=${onRowClick ? 'cursor:pointer' : ''}>
+                            onClick=${onRowClick ? () => onRowClick(row) : null}
+                            style=${[onRowClick ? 'cursor:pointer' : '', (columns[0] && columns[0].dotStyle) ? columns[0].dotStyle(row) : ''].filter(Boolean).join(';')}>
                             <!-- 🔴 THE ONLY BROWSER-DEFAULT CONTROL LEFT IN THE PORTAL, on the row of every table.
                                  The adopted sheet has drawn a checkbox since it was adopted — a 16px sunk square that
                                  fills with the accent and strokes a tick — and the Manifest rendered a UA checkbox
@@ -337,13 +353,12 @@ export function Manifest({ label = null, rows, columns, searchableFields, bulkAc
                                  takes the destructive colour only on hover and focus. -->
                             ${onRemove ? html`
                                 <td class="ra" onClick=${(e) => e.stopPropagation()}>
-                                    <button class="rmv" data-tip=${removeLabel} aria-label=${`${removeLabel} ${row[columns[0].key]}`}
+                                    <button class="rmv wg-ib wg-del" data-tip=${removeLabel} aria-label=${`${removeLabel} ${row[columns[0].key]}`}
                                             onClick=${() => onRemove(row)}>
-                                        <!-- The design draws this one inline rather than through the sprite, and the
-                                             shapes are not the same glyph: its lid-and-body path is 15px wide against
-                                             the sprite's 11.5, on thirty-nine rows. The icon set is right everywhere
-                                             else; this control is the design's own. -->
-                                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg></button>
+                                        <!-- 2026-09-21 19:21 EDT — Harkirat: "why does this use a different delete button/icon/size? Use the same one used
+                                             in the armory manifest." The inline lid-and-body path is gone; this is the Armory row's own
+                                             delete, the sprite's trash-2 in the .wg-ib box. -->
+                                        <${Icon} name="trash-2" /></button>
                                 </td>` : null}
                         </tr>
                     `)}
@@ -361,7 +376,7 @@ export function Manifest({ label = null, rows, columns, searchableFields, bulkAc
                  one here on Season — a name, a type, two dates and a button — as the fast path beside the
                  composer above, and the portal had only the composer. -->
             ${footRow || null}
-            ${selected.size && bulkActions.length ? html`
+            ${selected.size && renderSelection && b3('p5') !== 'now' ? renderSelection({ ids: [...selected], clear: () => setSelected(new Set()), setMany: (ids, on) => setSelected(setSelection(selected, ids, on)) }) : selected.size && bulkActions.length ? html`
                 <${SelectionBar} count=${selected.size} noun=${rowNoun} tier=${bulkTier}
                                  badge=${bulkNote} summary=${selectionSummary()}
                                  onClear=${() => setSelected(new Set())}
```

## `ui/overlay.js` → `portal/ui/overlay.js`

```diff
diff --git aportal/ui/overlay.js bkit/ui/overlay.js
index 0a15c532..72955ee1 100644
--- aportal/ui/overlay.js	
+++ bkit/ui/overlay.js	
@@ -8,8 +8,13 @@ import { html } from '../vendor/htm-preact.mjs';
 import { useEffect, useRef, useState } from '../vendor/preact-hooks.mjs';
 import { Icon } from './icons.js';
 
-export function Drawer({ eyebrow, title, children, actions, wide, side, onClose }) {
+export function Drawer({ eyebrow, title, children, actions, wide, side, onClose, onBack = null, cls = '' }) {
     const ref = useRef(null);
+    // 🔴 (2026-09-22 15:38 EDT) THE ESCAPE KEY CLOSED THE DRAWER WITH THE FIRST RENDER'S onClose. The key listener is added once (deps []), so it
+    // held the closure from mount — when the draft was still empty — and Escape discarded a filled build without the "Discard this draft?"
+    // confirm that the Close button asks. Found by a flow test, not by looking. The listener now calls whatever onClose is current.
+    const closeRef = useRef(onClose);
+    closeRef.current = onClose;
     // Which regions the dialog takes out of the page. Resolved on every pass rather than captured once: Preact re-renders the Shell when the overlay slot changes, and an attribute written to a node that has since been replaced is an attribute on nothing.
     const shellRegions = () => [
         document.querySelector('.app > main'),
@@ -45,7 +50,7 @@ export function Drawer({ eyebrow, title, children, actions, wide, side, onClose
         // 🔴 `inert` IS NOT A TRAP, 2026-09-06 09:22 EDT: it removes the page from the tab order but the browser's own chrome is still past the last control, so Tab from the last field left the dialog for <body> (Season at stop 14, Armory at 23). The APG dialog pattern wraps at both edges; this is that, on the dialog's own keydown so it cannot interfere with anything outside.
         const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
         const onKey = (e) => {
-            if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
+            if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return; }
             if (e.key !== 'Tab' || !ref.current) return;
             const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
             if (!items.length) return;
@@ -59,7 +64,7 @@ export function Drawer({ eyebrow, title, children, actions, wide, side, onClose
 
     return html`
         <div class="scrim on" onClick=${onClose}></div>
-        <aside class=${'drawer open' + (wide ? ' wide' : '') + (side ? ' side' : '')}
+        <aside class=${'drawer open' + (wide ? ' wide' : '') + (side ? ' side' : '') + (cls ? ' ' + cls : '')}
                role="dialog" aria-modal="true" aria-label=${title} ref=${applyInert}>
             <header class="dw-h">
                 <div class="dw-ttl">
@@ -71,7 +76,12 @@ export function Drawer({ eyebrow, title, children, actions, wide, side, onClose
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
@@ -87,7 +97,7 @@ export function Confirm({ op, tier, title, body, confirmLabel, danger, typed, on
     const [text, setText] = useState('');
     const ready = !typed || typedConfirmReady(text, typed);
     return html`
-        <${Drawer} eyebrow=${op ? `${op} · tier ${tier || 3}` : `tier ${tier || 3}`} title=${title} onClose=${onCancel}
+        <${Drawer} cls="cfm" eyebrow=${op ? `${op} · tier ${tier || 3}` : `tier ${tier || 3}`} title=${title} onClose=${onCancel}
                    actions=${html`
                        <button class="btn" onClick=${onCancel}>Cancel</button>
                        <button class=${'btn ' + (danger ? 'dang' : 'go')} disabled=${!ready}
```

## `ui/shell.js` → `portal/ui/shell.js`

```diff
diff --git aportal/ui/shell.js bkit/ui/shell.js
index 9ca5070a..a1c2e2dc 100644
--- aportal/ui/shell.js	
+++ bkit/ui/shell.js	
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
