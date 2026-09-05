// portal/ui/tray.js — ESM. The STAGED tray the design floats on every page.
//
// 🔴 THIS FILE HELD A DIFFERENT COMPONENT UNTIL 2026-09-04 21:09 EDT, AND IT HAD NEVER RENDERED ONCE. It was a "Saved · Undo" tray for tier-1 direct edits, driven by a `notices` list that `season.js` initialised to `[]` and nothing anywhere ever added to — two removal handlers and no producer — so `Tray` returned `null` on every render of the one realm that mounted it. Its 35 lines, its `.tray` rules and Season's `traySlot` were all dead. Same class as `badges` reaching two realms, `oneway.js`'s seven ops with no button, and the `flags` prop threaded to nothing.
//
// 🔴 AND THE DESIGN'S TRAY IS NOT THAT COMPONENT. The mockup's `assets/shell.js` floats a STAGED tray on every page — "Staged · N changes", one row per staged op, Discard all and Review & commit — driven by its own store. The portal had no such surface anywhere. Found by opening Broadcast's export drawer: the whole tray came back ONLY IN MOCKUP, and it is the largest ④ row on that realm (`main`'s paddingBottom, reach 234) because its absence changes the page under it. ⚠️ **The resting audit never reported it** — the LCS alignment paired it away, which is the caveat the plan already carries: an instrument's pairing is not evidence about the page. **The overlay tier found a defect on the resting page.**
//
// ⚠️ EVERY ROW ROUTES TO REVIEW RATHER THAN PROMISING AN UNDO THIS API CANNOT DO. The design undoes a single staged op from a client-side store that holds its inverse; here staging is server-side and the only discard endpoint takes a CHANGESET, so a per-row "Undo" would silently take back the other four ops in the same changeset. The design has this exact fallback already and names it — *"Not a refusal — a route. The inverse lives on the page that staged it."* — so the row says Review and means it. Wiring a per-op discard is filed, not faked.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState } from '../vendor/preact-hooks.mjs';

// Collapsing is remembered, because the tray is `position:fixed` bottom-right and a tall changeset can cover a control — measured on Broadcast in the design's own comment, where it sat over "+ Post announcement". A reader who collapses it once should not have to do it again on the next realm. 🔴 DEFAULT CLOSED, NOT OPEN — the design's own comment carries the reason and the measurement: *"The tray is a status object: its job is to say that staged work exists and offer the two verbs, and it does both collapsed. Defaulting to the full list put a 269px floating panel over page content on every realm from the first paint — the reader had to dismiss the portal's own chrome before reading the realm."* The first version of this file defaulted OPEN and every realm's page grew ~154px. ⚠️ sessionStorage, matching the design: a collapse is a decision about this sitting, not a preference.
const KEY = 'dioreo-tray-open';
const readCollapsed = () => { try { return sessionStorage.getItem(KEY) !== '1'; } catch { return true; } };
const writeCollapsed = (v) => { try { sessionStorage.setItem(KEY, v ? '0' : '1'); } catch { /* private window */ } };

// ⚠️ `hidden` IS NOT A STYLE PREFERENCE HERE. The tray is `position:fixed` and lives OUTSIDE any open drawer, so while a modal is up its three controls are still in the tab order — PASS 4 of the states walk calls that "Tab walks out of something that claims to be modal", and it caught this component on its first run. `inert` removes the subtree from focus and from the accessibility tree in one attribute, which is the whole fix.
export function StagedTray({ ops, onDiscardAll, busy = false, inert = false }) {
    const [collapsed, setCollapsed] = useState(readCollapsed);
    if (!ops || ops.length === 0) return null;
    const toggle = () => { const next = !collapsed; setCollapsed(next); writeCollapsed(next); };
    // The one thing that stops a commit, said where an admin is actually looking. Absent at zero rather than reading "0 blocked" — the same rule the rail badge and the commit chip follow.
    const blocked = ops.filter((o) => o.destroys && !o.exported).length;
    return html`
        <div class=${'tray' + (collapsed ? ' collapsed' : '')} role="status" aria-label="Staged changes"
             inert=${inert ? '' : null} aria-hidden=${inert ? 'true' : null}>
            <div class="tray-h" role="button" tabindex="0" aria-expanded=${String(!collapsed)}
                 onClick=${toggle}
                 onKeyDown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}>
                <!-- The ${' '} is load-bearing: htm drops a whitespace-only text node across a newline, so
                     without it the fused accessible name is announced as "Staged4 changes". PASS 6 of the
                     states walk checks exactly this on every realm and state, and caught it here. -->
                <span class="t">Staged</span>${' '}
                <span class="n">${ops.length} ${ops.length === 1 ? 'change' : 'changes'}</span>
            </div>
            <div class="rounds">
                ${ops.map((o) => html`
                    <div class=${'round' + (o.tier === 3 ? ' t3' : '')} key=${o.id}>
                        <span class="tier">T${o.tier}</span>
                        <b>${o.name || 'unnamed record'}</b>${' '}${o.verb || 'added'}
                        <a class="round-u" href="#/review"
                           aria-label=${`Review ${o.name || 'this change'} on the commit screen`}>Review</a>
                    </div>`)}
            </div>
            ${blocked ? html`
                <p class="hint">${blocked} tier-3 change${blocked === 1 ? '' : 's'}${' '}
                    ${blocked === 1 ? 'needs' : 'need'} an export before ${blocked === 1 ? 'it' : 'they'} will commit.</p>` : null}
            <div class="tray-f">
                <button class="btn no" disabled=${busy} onClick=${onDiscardAll}>Discard all</button>
                <a class="btn go" href="#/review">Review & commit</a>
            </div>
        </div>
    `;
}

// ⚠️ NO `Tray` ALIAS ON PURPOSE. A stale import must fail LOUDLY at the call site — a compatible name that renders nothing is exactly how the dead component survived unnoticed for the life of this branch.
