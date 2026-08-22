---
kind: plan
status: frozen
---

# Portal compose UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close plan 3's remaining gap — wire real add/edit/bulk compose actions into the already-built Season/Armory/Broadcast realms, so staging a changeset and committing it works end-to-end from the browser, not just from a script.

**Architecture:** Frontend-only against the already-built `core/ops` + `core/changeset.js` pathway, plus one new read-only preview endpoint. A shared `composeClient.js` (stage / stage-and-commit) and two new opt-in `<Manifest>` hooks (`onAdd`, `columns[].editable`+`buildEditOp`) are reused by all three realms rather than duplicated per realm.

**Tech Stack:** Preact + htm (no bundler), CommonJS `.logic.js` siblings for pure/testable logic, Node `node:http` backend, Mongoose/MongoDB transactions.

**Spec:** `docs/superpowers/specs/2026-08-21-portal-compose-ui-design.md` (this task's own design) + `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md` (the frozen parent spec).

## Global Constraints

- **No `core/ops/*.js` changes, no new `Changeset`/model fields.** Every compose action must resolve to an existing op type with its existing payload shape (verified against the real registered ops, not assumed).
- **Shape carries state, colour carries topic** (parent spec §9) — any new UI state (staged/blocked/conflict) uses the existing `bar live`/`bar stag`/`bar conf` class convention from `track.logic.js`'s `bandClass`, never a new colour-only signal.
- **Every input needs a real `<label>`** (accessibility fix already landed this session) — reuse the `.sr-only` + `for`/`id` pairing pattern from `portal/ui/access.js`'s `GrantForm`.
- **The portal never calls `.save()` on a whole `SeasonalData` document** (parent spec §6.1) — not touched by this plan since it only composes ops, never writes Mongo directly.
- **CSRF token required on every mutating request** (`x-csrf-token` header, from `session.csrfToken`) — every `composeClient` call takes it as a parameter.
- Soft-wrapped prose in any `.md` this plan touches — one physical line per paragraph (repo convention, `npm run docs:reflow`).

---

### Task 1: `composeClient.js`, the Armory preview endpoint, and `v2Render.js`

**Files:**
- Create: `portal/ui/composeClient.js` (ESM)
- Create: `portal/ui/v2Render.js` (ESM)
- Create: `portal/ui/v2Render.logic.js` (CommonJS — the pure markdown-line parser `v2Render.js` and the test both use)
- Modify: `portal/api/armory.js` (add `GET /api/armory/preview`)
- Test: `scripts/portalComposeClient.test.js`

**Interfaces:**
- Consumes: `fetchJson` from `portal/ui/httpClient.js`; `buildLoadoutCard`, `getMpCategoryAccent` from `utils/loadoutRender.js`; `grantedPagesFor` from `portal/api/realmAccess.js`; `sendJson`, `forbidden` from `portal/api/httpUtil.js`.
- Produces: `stageOps(realm, ops, csrfToken) -> Promise<{changesetId,state,tier,failures,preview}>`, `stageAndCommit(realm, ops, csrfToken) -> Promise<{ok,changeIds?,results?,reason?}>` (both consumed by Tasks 2-6). `renderV2(components) -> htm tree` (consumed by Task 5). `parseV2Markdown(text) -> {type:'h1'|'h3'|'small'|'blockquote'|'p', text}[]` (pure, CommonJS, tested directly).

- [ ] **Step 1: Write the failing test for the markdown line parser and op-staging client**

```js
// scripts/portalComposeClient.test.js
const assert = require('assert');
const { parseV2Markdown } = require('../portal/ui/v2Render.logic');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('a # line becomes an h1 line, stripped of the marker', () => {
    assert.deepStrictEqual(parseV2Markdown('# AK-47')[0], { type: 'h1', text: 'AK-47' });
});

check('a ### line becomes an h3 line', () => {
    assert.deepStrictEqual(parseV2Markdown('### Attachments')[0], { type: 'h3', text: 'Attachments' });
});

check('a -# line becomes a small/footer line', () => {
    assert.deepStrictEqual(parseV2Markdown('-# AR • Build 1 of 3')[0], { type: 'small', text: 'AR • Build 1 of 3' });
});

check('a > line becomes a blockquote line', () => {
    assert.deepStrictEqual(parseV2Markdown('> No suppressor build')[0], { type: 'blockquote', text: 'No suppressor build' });
});

check('a plain line becomes a paragraph line, and multi-line content yields one entry per line', () => {
    const lines = parseV2Markdown('### Attachments\n• `Muzzle`\n• `Barrel`');
    assert.strictEqual(lines.length, 3);
    assert.deepStrictEqual(lines[1], { type: 'p', text: '• `Muzzle`' });
});

check('a bold **word** segment inside a line is preserved as literal text (renderer bolds it, parser does not strip markers)', () => {
    assert.strictEqual(parseV2Markdown('**Fastest ADS**')[0].text, '**Fastest ADS**');
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/portalComposeClient.test.js`
Expected: `Cannot find module '../portal/ui/v2Render.logic'`

- [ ] **Step 3: Write `v2Render.logic.js`**

```js
// portal/ui/v2Render.logic.js — CommonJS, imports nothing. The pure per-line markdown classifier
// v2Render.js renders from. Scoped to exactly what buildLoadoutCard() (utils/loadoutRender.js)
// emits inside a type-10 TextDisplay: `# `/`### `/`-# ` line prefixes and `> ` blockquote lines,
// never a general markdown grammar.
function parseV2Markdown(text) {
    return String(text || '').split('\n').map((line) => {
        if (line.startsWith('# ')) return { type: 'h1', text: line.slice(2) };
        if (line.startsWith('### ')) return { type: 'h3', text: line.slice(4) };
        if (line.startsWith('-# ')) return { type: 'small', text: line.slice(3) };
        if (line.startsWith('> ')) return { type: 'blockquote', text: line.slice(2) };
        return { type: 'p', text: line };
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseV2Markdown };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/portalComposeClient.test.js`
Expected: `5 passed, 0 failed` (well, all `check()` calls print `✓`; script exits 0)

- [ ] **Step 5: Write `v2Render.js`**

Renders exactly the 5 Components V2 types `buildLoadoutCard()` emits: type 17 (Container), type 10 (TextDisplay, run through `parseV2Markdown`), type 14 (Separator), type 12 (MediaGallery, one image), type 1 (ActionRow of type-2 Buttons, rendered inert).

```js
// portal/ui/v2Render.js — ESM. Renders the raw Components V2 JSON buildLoadoutCard() returns.
// Scoped to exactly the 5 component types that function emits — NOT a general Components V2
// interpreter (see docs/superpowers/specs/2026-08-21-portal-compose-ui-design.md §2). Buttons
// render disabled: this is a picture of what Discord will show, not a live Discord message.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { parseV2Markdown } from './v2Render.logic.js';

function renderTextDisplay(component, key) {
    return html`<div class="v2-text" key=${key}>
        ${parseV2Markdown(component.content).map((line, i) => {
            if (line.type === 'h1') return html`<h1 key=${i}>${line.text}</h1>`;
            if (line.type === 'h3') return html`<h3 key=${i}>${line.text}</h3>`;
            if (line.type === 'small') return html`<p class="v2-small" key=${i}>${line.text}</p>`;
            if (line.type === 'blockquote') return html`<blockquote key=${i}>${line.text}</blockquote>`;
            return html`<p key=${i}>${line.text}</p>`;
        })}
    </div>`;
}

function renderComponent(component, key) {
    if (component.type === 10) return renderTextDisplay(component, key);
    if (component.type === 14) return html`<hr class="v2-sep" key=${key} />`;
    if (component.type === 12) {
        const url = component.items?.[0]?.media?.url;
        return url ? html`<img class="v2-media" src=${url} key=${key} /> ` : null;
    }
    if (component.type === 1) {
        return html`<div class="v2-row" key=${key}>
            ${(component.components || []).map((b, i) => html`<button disabled key=${i}>${b.label}</button>`)}
        </div>`;
    }
    return null;
}

export function renderV2(components) {
    const container = (components || []).find((c) => c.type === 17);
    if (!container) return html`<p class="v2-empty">No preview available.</p>`;
    return html`
        <div class="v2-card" style=${`--v2-accent:#${(container.accent_color ?? 0).toString(16).padStart(6, '0')}`}>
            ${container.components.map((c, i) => renderComponent(c, i))}
        </div>
    `;
}
```

- [ ] **Step 6: Write `composeClient.js`**

```js
// portal/ui/composeClient.js — ESM. The one client every realm uses to turn a composed op (or a
// bulk set of ops) into a real changeset. See docs/superpowers/specs/2026-08-21-portal-compose-ui-design.md §1
// for why there are two entry points: stageOps alone (Add forms, Track drag, bulk actions — the
// result surfaces on Board for a deliberate Commit, matching the approved mockup) and
// stageAndCommit (Manifest's single-cell inline edit — always tier 1, so committing needs no
// gates, giving the "saves on field commit" feel the parent spec's §5 describes).
import { fetchJson } from './httpClient.js';

export async function stageOps(realm, ops, csrfToken) {
    return fetchJson('/api/changeset', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ realm, ops }),
    });
}

export async function stageAndCommit(realm, ops, csrfToken) {
    const staged = await stageOps(realm, ops, csrfToken);
    if (staged.signedOut || staged.forbidden) return { ok: false, reason: 'You do not have access.' };
    if (!staged.changesetId) return { ok: false, reason: staged.error || 'Could not stage the change.' };
    const res = await fetchJson(`/api/changeset/${staged.changesetId}/commit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({}),
    });
    return res;
}
```

- [ ] **Step 7: Add the Armory preview endpoint**

Read the current `route('GET', /^\/api\/armory$/, ...)` block in `portal/api/armory.js` first (it was rewritten earlier this session to use `grantedPagesFor`/`sendJson`/`forbidden` — match that exact style). Add a second route in the same `register(route)` function, after the existing one:

```js
    route('GET', /^\/api\/armory\/preview$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, ARMORY_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const id = url.searchParams.get('id');
        const build = id && await Loadout.findById(id).lean();
        if (!build) return sendJson(res, 404, { error: 'no such loadout' });
        const card = buildLoadoutCard([build], 0, { color: getMpCategoryAccent(build.category), idPrefix: 'preview_' });
        sendJson(res, 200, { card });
    }));
```

Add `buildLoadoutCard` to the existing `require('../../utils/loadoutRender')` line's destructure (it already imports `findDuplicateLoadouts, getMpCategoryAccent` from that module — add `buildLoadoutCard` alongside them).

- [ ] **Step 8: Boot-test the new route**

```bash
node --check portal/api/armory.js && node --check portal/ui/composeClient.js
node --env-file=.env.dev portal/server.js &
sleep 2
```

Then, using the same seeded-owner-session technique already proven this session (`crypto.randomBytes` raw token → hash → `PortalSession.create` → `fetch` with a `Cookie` header), hit `GET /api/armory` to get a real loadout `_id`, then `GET /api/armory/preview?id=<that id>` with the session cookie and confirm the response is `200` with a `card.components` array whose first element has `type: 17`. Stop the server and delete the seeded session afterward.

- [ ] **Step 9: Commit**

```bash
git add portal/ui/composeClient.js portal/ui/v2Render.js portal/ui/v2Render.logic.js portal/api/armory.js scripts/portalComposeClient.test.js package.json
git commit -m "feat(portal): add the shared compose client, a scoped V2 preview renderer, and the Armory preview endpoint"
```

---

### Task 2: `<Manifest>` gains `onAdd` and click-to-edit

**Files:**
- Modify: `portal/ui/manifest.js`
- Test: extend `scripts/portalUi.test.js` (no new pure logic here — `onAdd`/`buildEditOp` are just props, tested indirectly through Task 3's realm-level test; this task's own verification is the browser check in Step 4)

**Interfaces:**
- Consumes: `composeClient.stageAndCommit` (called internally by Manifest when a `columns[].editable` cell commits).
- Produces: `<Manifest>` now accepts two new optional props — `onAdd: () => void` and, per-column, `editable: true` + a realm-supplied `buildEditOp: (row, columnKey, newValue) => op`. Consumed by Tasks 3, 5, 6.

- [ ] **Step 1: Add the toolbar Add button and inline-edit state**

Read `portal/ui/manifest.js` first — it's small (54 lines). Replace the whole file:

```js
// portal/ui/manifest.js — ESM. The Manifest: search, filter chips, sortable table, multi-select, bulk bar,
// and (new) an opt-in Add button + click-to-edit cell. Reused UNCHANGED by every realm (spec §8.2) — a realm
// supplies only `columns`/`rows`/`bulkActions`/`onAdd`/`buildEditOp`, never its own copy of this component.
//
// filterRows/sortRows/toggleSelection come from manifest.logic.js, loaded as a classic script — see track.js's
// header comment for why that is the real cross-runtime resolution here.
import { h } from '../vendor/preact.mjs';
import { html } from '../vendor/htm-preact.mjs';
import { useState, useMemo } from '../vendor/preact-hooks.mjs';
import { stageAndCommit } from './composeClient.js';

export function Manifest({ rows, columns, searchableFields, bulkActions = [], stateOf = (r) => r.state, onAdd, realm, buildEditOp, csrfToken, onEditError }) {
    const [query, setQuery] = useState('');
    const [filters, setFilters] = useState({});
    const [sort, setSort] = useState({ column: null, direction: 'asc' });
    const [selected, setSelected] = useState(new Set());
    const [editingCell, setEditingCell] = useState(null); // {rowId, columnKey} | null
    const [editValue, setEditValue] = useState('');

    const visible = useMemo(
        () => sortRows(filterRows(rows, { query, searchableFields, filters }), sort),
        [rows, query, filters, sort]
    );

    async function commitEdit(row, columnKey) {
        const op = buildEditOp(row, columnKey, editValue);
        setEditingCell(null);
        const result = await stageAndCommit(realm, [op], csrfToken);
        if (!result.ok && onEditError) onEditError(result.reason || 'Edit failed.');
    }

    return html`
        <div class="panel" id="manifest">
            <div class="mtools">
                <span class="srch"><label class="sr-only" for="manifest-search">Search</label><input id="manifest-search" value=${query} placeholder="Search…" onInput=${(e) => setQuery(e.target.value)} /></span>
                <span class="rt">${visible.length} of ${rows.length} shown${selected.size ? ` · ${selected.size} selected` : ''}</span>
                ${onAdd ? html`<button class="accent-fill" onClick=${onAdd}>+ Add</button>` : null}
            </div>
            <table>
                <thead><tr>
                    <th style="width:34px"></th>
                    ${columns.map(c => html`<th onClick=${() => setSort({ column: c.key, direction: sort.column === c.key && sort.direction === 'asc' ? 'desc' : 'asc' })}>${c.label}</th>`)}
                </tr></thead>
                <tbody>
                    ${visible.map(row => html`
                        <tr class=${selected.has(row.id) ? 'sel' : ''}>
                            <td><label class="sr-only" for=${`sel-${row.id}`}>Select ${row[columns[0].key]}</label><input id=${`sel-${row.id}`} type="checkbox" checked=${selected.has(row.id)} onChange=${() => setSelected(toggleSelection(selected, row.id))} /></td>
                            ${columns.map(c => {
                                const isEditing = editingCell && editingCell.rowId === row.id && editingCell.columnKey === c.key;
                                if (isEditing) {
                                    return html`<td key=${c.key}>
                                        <label class="sr-only" for=${`edit-${row.id}-${c.key}`}>Edit ${c.label}</label>
                                        <input id=${`edit-${row.id}-${c.key}`} value=${editValue} autoFocus
                                               onInput=${(e) => setEditValue(e.target.value)}
                                               onKeyDown=${(e) => { if (e.key === 'Enter') commitEdit(row, c.key); if (e.key === 'Escape') setEditingCell(null); }}
                                               onBlur=${() => setEditingCell(null)} />
                                    </td>`;
                                }
                                return html`
                                    <td class=${c.key === columns[0].key ? 'n' : c.dataKind === 'date' ? 'd' : ''}
                                        onClick=${c.editable ? () => { setEditingCell({ rowId: row.id, columnKey: c.key }); setEditValue(String(row[c.key] ?? '')); } : null}
                                        style=${c.editable ? 'cursor:text' : ''}>
                                        ${c.key === columns[0].key ? html`<span class="dot" style=${`--topic-accent:var(${row.topicVar || '--ink3'})`}></span>` : null}
                                        ${c.render ? c.render(row) : (c.key === 'state'
                                            ? html`<span class=${'stt ' + (stateOf(row) === 'live' ? 'live' : stateOf(row) === 'staged' ? 'stag' : 'conf')}>${stateOf(row).toUpperCase()}</span>`
                                            : row[c.key])}
                                    </td>
                                `;
                            })}
                        </tr>
                    `)}
                </tbody>
            </table>
            ${selected.size ? html`
                <div class="bulk">
                    <span>${selected.size} selected</span>
                    ${bulkActions.map(a => html`<button class=${a.danger ? 'danger' : ''} onClick=${() => a.onClick([...selected])}>${a.label}</button>`)}
                </div>
            ` : null}
        </div>
    `;
}
```

- [ ] **Step 2: Syntax-check**

Run: `node --check portal/ui/manifest.js` — expected to fail (ESM `import`/`export` in a CJS-default project); instead confirm no stray syntax error by eye and defer real verification to Step 4's browser check (matches how every other `portal/ui/*.js` file in this repo is verified — none of them pass `node --check` for the same reason).

- [ ] **Step 3: Add `.v2-*` and `.mtools button` CSS**

Read `portal/ui/*.css` to find where `.mtools` is styled (in the shared stylesheet the build concatenates — check `scripts/buildPortal.js` for which files it concatenates and in what order). Add, in that file:

```css
.mtools button.accent-fill { margin-left: auto; padding: 6px 14px; border-radius: 6px; border: none; background: var(--patch); color: var(--on-accent); font-weight: 600; cursor: pointer; }
.v2-card { border: 1px solid var(--rule); border-left: 3px solid var(--v2-accent, var(--rule)); border-radius: 6px; padding: 12px 14px; background: var(--raised); }
.v2-card h1 { font-size: 18px; margin: 0 0 6px; }
.v2-card h3 { font-size: 13px; color: var(--ink2); margin: 10px 0 4px; }
.v2-card p { margin: 2px 0; font-size: 13px; }
.v2-card .v2-small { color: var(--ink3); font-family: 'JetBrains Mono', monospace; font-size: 11px; }
.v2-card blockquote { border-left: 2px solid var(--rule); margin: 6px 0; padding-left: 10px; color: var(--ink2); }
.v2-card .v2-sep { border: none; border-top: 1px solid var(--rule); margin: 8px 0; }
.v2-card .v2-media { max-width: 100%; border-radius: 4px; margin: 8px 0; }
.v2-card .v2-row { display: flex; gap: 6px; margin-top: 8px; }
.v2-card .v2-row button { opacity: 0.6; cursor: default; }
```

- [ ] **Step 4: Rebuild and verify in the browser**

```bash
node scripts/buildPortal.js
node --env-file=.env.dev portal/server.js &
sleep 2
```

Open the portal in the Browser pane at `http://127.0.0.1:8787/review/index.html` (the static fixture harness from Session C — confirm it still exists at `portal/public/review/index.html`; if it was cleaned up, seed a real owner session the way Task 1 Step 8 did and hit the real signed-in app instead). Confirm no console errors, and that `<Manifest>` renders without `onAdd`/`buildEditOp` (both optional) exactly as it did before this task — the existing Access/Analytics realms pass neither prop, so this is a regression check as much as a new-feature check. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add portal/ui/manifest.js portal/ui/*.css
git commit -m "feat(portal): give Manifest an opt-in Add button and click-to-edit cell"
```

---

### Task 3: Season — Add composer, inline edit, and bulk actions

**Files:**
- Modify: `portal/ui/season.js`
- Test: extend `scripts/portalRealms.test.js` with the op-builder pure functions below

**Interfaces:**
- Consumes: `stageOps`/`stageAndCommit` (Task 1), `onAdd`/`buildEditOp` (Task 2).
- Produces: `buildSeasonAddOp(kind, fields) -> op`, `buildSeasonEditOp(row, columnKey, newValue) -> op` — both pure, exported from a new `portal/ui/season.logic.js` so they're testable as data.

- [ ] **Step 1: Write the failing test**

```js
// added to scripts/portalRealms.test.js
const { buildSeasonAddOp, buildSeasonEditOp } = require('../portal/ui/season.logic');

check('buildSeasonAddOp builds a draw.add op for kind=draw', () => {
    const op = buildSeasonAddOp('draw', { title: 'Wraith', category: 'newDraws', endDate: '2026-09-01', items: ['a', 'b'] });
    assert.strictEqual(op.type, 'draw.add');
    assert.strictEqual(op.payload.title, 'Wraith');
    assert.strictEqual(op.payload.category, 'newDraws');
});

check('buildSeasonAddOp builds a calendar.add op for kind=event', () => {
    const op = buildSeasonAddOp('event', { title: 'Clan wars', startDate: '2026-09-01', endDate: '2026-09-08' });
    assert.strictEqual(op.type, 'calendar.add');
});

check('buildSeasonEditOp on a draw row edits the end date, preserving the rest of the row', () => {
    const row = { id: 'x1', lane: 'draw', category: 'newDraws', title: 'Iron Wolf', items: ['a'], endDate: '2026-08-10' };
    const op = buildSeasonEditOp(row, 'endDate', '2026-08-13');
    assert.strictEqual(op.type, 'draw.edit');
    assert.strictEqual(op.payload.endDate, '2026-08-13');
    assert.deepStrictEqual(op.payload.items, ['a']);
});

check('buildSeasonEditOp on an event row edits via calendar.edit', () => {
    const row = { id: 'x2', lane: 'event', title: 'Season launch', startDate: '2026-08-01', endDate: '2026-08-08' };
    const op = buildSeasonEditOp(row, 'title', 'Season 8 launch');
    assert.strictEqual(op.type, 'calendar.edit');
    assert.strictEqual(op.payload.title, 'Season 8 launch');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/portalRealms.test.js`
Expected: `Cannot find module '../portal/ui/season.logic'`

- [ ] **Step 3: Write `portal/ui/season.logic.js`**

Read `core/ops/draws.js` (`draw.add`/`draw.edit`/`draw.delete`, `pathFor(category)`) and `core/ops/calendar.js` (`calendar.add`/`calendar.edit`) first to confirm the exact `target`/`payload` fields each `validate()` reads, then:

```js
// portal/ui/season.logic.js — CommonJS, imports nothing. Pure op-builders for the Season realm's
// compose actions, tested directly by scripts/portalRealms.test.js.
const KIND_TO_ENTITY = { draw: 'draw', returning: 'draw', event: 'calendar', playlist: 'calendar' };

function buildSeasonAddOp(kind, fields) {
    const entity = KIND_TO_ENTITY[kind];
    if (entity === 'draw') {
        return { type: 'draw.add', target: null, payload: { title: fields.title, category: fields.category, endDate: fields.endDate, items: fields.items || [] } };
    }
    return { type: 'calendar.add', target: null, payload: { title: fields.title, startDate: fields.startDate, endDate: fields.endDate, category: fields.category || (kind === 'playlist' ? 'Playlist' : 'Event'), isOngoing: !!fields.isOngoing, isDoubleCP: !!fields.isDoubleCP } };
}

// Edits one field of an existing row, preserving the rest -- draw.edit/calendar.edit's validate()
// needs the full record, not a partial patch (core/ops/draws.js, core/ops/calendar.js).
function buildSeasonEditOp(row, columnKey, newValue) {
    const isDraw = row.lane === 'draw' || row.lane === 'returning';
    const type = isDraw ? 'draw.edit' : 'calendar.edit';
    const target = isDraw ? { category: row.category, elementId: row.id } : { elementId: row.id };
    const payload = { ...row, [columnKey]: newValue };
    delete payload.id; delete payload.lane; delete payload.state; delete payload.window; delete payload.topicVar;
    return { type, target, payload };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildSeasonAddOp, buildSeasonEditOp, KIND_TO_ENTITY };
}
```

**Before finalizing this step:** read `core/ops/draws.js`'s `'draw.edit'` and `core/ops/calendar.js`'s `'calendar.edit'` entries in full (their `validate`/`apply` bodies) to confirm `target` shape (`{category, elementId}` vs `{elementId}`) and required payload fields exactly — the snippet above is the design's best read of the op signatures gathered during Task 1's research pass, but this step is where it gets checked against the real `validate()` bodies, not assumed a second time.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/portalRealms.test.js`
Expected: all 4 new checks pass, plus every pre-existing check in that file still passes (5 from before this plan, per this session's earlier verification).

- [ ] **Step 5: Wire the Add composer and Manifest hooks into `season.js`**

Read the current `portal/ui/season.js` (already modified once this session for the `/simplify` fixes — re-read it fresh, don't rely on the earlier-in-session version from memory). Add:
- An `AddComposer` component: a kind picker (`draw`/`returning`/`event`/`playlist`) that reveals the relevant fields, an inline `<form>`-like block rendered above `<Manifest>` in `viewSlot` when a `showAdd` state flag is true, calling `stageOps('season', [buildSeasonAddOp(kind, fields)], session.csrfToken)` on submit, then closing itself and calling `fetchChangesets('season').then(setChangesets)` so the new staged item appears on Board immediately.
- Pass `onAdd={() => setShowAdd(true)}`, `realm="season"`, `csrfToken={session.csrfToken}`, `buildEditOp={buildSeasonEditOp}`, `onEditError={(msg) => setNotices([...notices, { changeId: 'edit-' + Date.now(), summary: msg }])}` to the existing `<Manifest>` call.
- Mark `title` and `window`'s underlying `endDate` as `editable: true` in `SEASON_COLUMNS`.
- Add a "Shift dates…" and "Stage deletion" bulk action to the existing (currently empty) Manifest `bulkActions` prop, each building ops from the selected row ids via `buildSeasonEditOp`/the relevant `bulkDelete` op type, then calling `stageOps` and refetching changesets.

Import `{ buildSeasonAddOp, buildSeasonEditOp }` from `./season.logic.js` and `{ stageOps }` from `./composeClient.js` at the top of `season.js`.

- [ ] **Step 6: Rebuild and verify in the browser against real local Mongo**

```bash
node scripts/buildPortal.js
node --env-file=.env.dev portal/server.js &
sleep 2
```

Using the seeded-owner-session technique (Task 1 Step 8), sign in via the Browser pane by setting the cookie through an actual `Set-Cookie` response is not possible for `HttpOnly` — instead drive this verification the way Task 1 did: direct `fetch` calls with an explicit `Cookie` header exercising the real `AddComposer`-equivalent flow (`POST /api/changeset` with a `draw.add` op built by hand matching `buildSeasonAddOp`'s output), confirming it stages, appears in `GET /api/changeset?realm=season`, and commits cleanly, THEN separately browser-load the signed-out Door page to confirm the rebuilt bundle has no console errors (parallel to Task 2 Step 4). Revert/delete every test-created draw/session afterward exactly as Task 1 Step 8 and the earlier `/simplify` verification pass did. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add portal/ui/season.js portal/ui/season.logic.js scripts/portalRealms.test.js package.json
git commit -m "feat(portal): wire Season's Add composer, inline edit, and bulk staging"
```

---

### Task 4: Track drag handles

**Files:**
- Modify: `portal/ui/track.logic.js` (add `dateFromOffset`, `editOpFor`)
- Modify: `portal/ui/track.js` (wire pointer events)
- Test: extend `scripts/portalUi.test.js`

**Interfaces:**
- Consumes: `barGeometry` (existing, `track.logic.js`), `stageOps` (Task 1).
- Produces: `dateFromOffset(offsetPercent, window) -> Date`, `editOpFor(item, newEndDate) -> op` — both pure.

- [ ] **Step 1: Write the failing test**

```js
// added to scripts/portalUi.test.js
const { dateFromOffset, editOpFor } = require('../portal/ui/track.logic');

check('dateFromOffset is the inverse of barGeometry's left/width math, snapped to a day', () => {
    const window = { start: '2026-08-01', end: '2026-08-08' }; // exactly 7 days wide
    const half = dateFromOffset(50, window);
    assert.strictEqual(half.toISOString().slice(0, 10), '2026-08-04' /* 3.5 days in, snapped down */);
});

check('dateFromOffset clamps to the window edges', () => {
    const window = { start: '2026-08-01', end: '2026-08-08' };
    assert.strictEqual(dateFromOffset(-10, window).toISOString().slice(0, 10), '2026-08-01');
    assert.strictEqual(dateFromOffset(150, window).toISOString().slice(0, 10), '2026-08-08');
});

check('editOpFor preserves every field of the dragged item except the edited date', () => {
    const item = { id: 'r1', lane: 'draw', category: 'newDraws', title: 'Havoc rerun', items: ['a', 'b'], startDate: '2026-08-04', endDate: '2026-08-13' };
    const op = editOpFor(item, new Date('2026-08-16'));
    assert.strictEqual(op.type, 'draw.edit');
    assert.strictEqual(op.payload.endDate.slice(0, 10), '2026-08-16');
    assert.strictEqual(op.payload.title, 'Havoc rerun');
    assert.deepStrictEqual(op.payload.items, ['a', 'b']);
});

check('editOpFor resolves calendar items to calendar.edit', () => {
    const item = { id: 'e1', lane: 'event', title: 'Clan wars', startDate: '2026-08-22', endDate: '2026-08-28' };
    const op = editOpFor(item, new Date('2026-08-30'));
    assert.strictEqual(op.type, 'calendar.edit');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/portalUi.test.js`
Expected: `Cannot find module` error, or (once `track.logic.js` exists) `dateFromOffset is not a function`.

- [ ] **Step 3: Implement `dateFromOffset` and `editOpFor` in `track.logic.js`**

Read the current file (already shown above — `barGeometry` already computes `left`/`width` percentages from a window; `dateFromOffset` is its inverse). Add, before the final `module.exports` guard:

```js
// The inverse of barGeometry's left-percent math: given a pointer's percent-position across the
// visible window, return the snapped (day-granularity) date under it. Clamped to the window.
function dateFromOffset(offsetPercent, window) {
    const wStart = new Date(window.start).getTime();
    const wEnd = new Date(window.end).getTime();
    const clamped = Math.max(0, Math.min(100, offsetPercent));
    const ms = wStart + (clamped / 100) * (wEnd - wStart);
    const snapped = Math.round(ms / 86400000) * 86400000;
    return new Date(Math.max(wStart, Math.min(wEnd, snapped)));
}

// Builds an edit op for a dragged Track item, preserving every field except the edited date.
// draw.edit/calendar.edit's validate() needs the full record -- same contract as season.logic.js's
// buildSeasonEditOp, duplicated here (not imported) because track.logic.js must import nothing,
// per this file's own header comment, and season.js's ESM sibling can't be required from a CJS file.
function editOpFor(item, newEndDate) {
    const isDraw = item.lane === 'draw' || item.lane === 'returning';
    const type = isDraw ? 'draw.edit' : 'calendar.edit';
    const target = isDraw ? { category: item.category, elementId: item.id } : { elementId: item.id };
    const payload = { ...item, endDate: newEndDate.toISOString() };
    delete payload.id; delete payload.lane;
    return { type, target, payload };
}
```

Update the `module.exports` line to include `dateFromOffset, editOpFor`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/portalUi.test.js`
Expected: all checks pass, including the 3 pre-existing ones from this session's `/simplify` verification.

- [ ] **Step 5: Wire pointer events in `track.js`**

Read the current `portal/ui/track.js`. Add a right-edge handle (a thin absolutely-positioned div at the end of each band, `onPointerDown`) that tracks `pointermove`/`pointerup` on `window` (not the element, so the drag survives leaving the band's bounding box), computes the pointer's x-offset as a percent of the ruler's own bounding rect width (`getBoundingClientRect()`), calls `dateFromOffset` for a live tooltip during the drag, and on `pointerup` calls `editOpFor` then `stageOps('season', [op], session.csrfToken)` followed by the same `fetchChangesets('season').then(setChangesets)` refresh Task 3's Add composer uses (passed down from `season.js` as a new `onDragCommit` prop, since `track.js` itself has no `session`/`csrfToken` — keep it a dumb rendering component per the spec's reuse philosophy, same reasoning as Manifest not knowing op shapes).

- [ ] **Step 6: Verify in the browser**

```bash
node scripts/buildPortal.js
node --env-file=.env.dev portal/server.js &
sleep 2
```

Seed an owner session (Task 1 Step 8's technique), drive a drag via `mcp__Claude_Browser__computer`'s `left_click_drag` on a real band's right edge in the signed-in Track view, screenshot before/after, then confirm via a direct `GET /api/changeset?realm=season` fetch that a new staged changeset with a `draw.edit`/`calendar.edit` op appeared. Revert/clean up the same way as prior tasks. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add portal/ui/track.js portal/ui/track.logic.js scripts/portalUi.test.js package.json
git commit -m "feat(portal): add Track drag handles for shifting an item's end date"
```

---

### Task 5: Armory — Add build form, inline edit, bulk actions, and live preview

**Files:**
- Modify: `portal/ui/armory.js`
- Modify: `portal/api/armory.js` (adds `GET /api/armory/export`)
- Create: `portal/ui/armory.logic.js`
- Test: extend `scripts/portalRealms.test.js`

**Interfaces:**
- Consumes: `stageOps`/`stageAndCommit` (Task 1), `renderV2` (Task 1), `onAdd`/`buildEditOp` (Task 2).
- Produces: `buildArmoryAddOp(fields) -> op`, `buildArmoryEditOp(row, columnKey, newValue) -> op`, `parseBadgesToken` re-exported from the same badges grammar `/manage` uses.

- [ ] **Step 1: Write the failing test**

```js
// added to scripts/portalRealms.test.js
const { buildArmoryAddOp, buildArmoryEditOp } = require('../portal/ui/armory.logic');

check('buildArmoryAddOp builds a loadout.add op with the mode fixed by the current page', () => {
    const op = buildArmoryAddOp({ weaponName: 'AK-47', category: 'AR', buildName: 'No Recoil', mode: 'MP', attachments: ['a', 'b'] });
    assert.strictEqual(op.type, 'loadout.add');
    assert.strictEqual(op.payload.mode, 'MP');
    assert.strictEqual(op.payload.weaponName, 'AK-47');
});

check('buildArmoryEditOp edits a badges field via loadout.edit, preserving weaponKey/mode', () => {
    const row = { id: 'l1', weaponKey: 'ak-47', mode: 'MP', category: 'AR', buildName: 'No Recoil', attachments: ['a'], isMeta: false, isToxic: false, categoryRank: null };
    const op = buildArmoryEditOp(row, 'isMeta', true);
    assert.strictEqual(op.type, 'loadout.edit');
    assert.strictEqual(op.payload.isMeta, true);
    assert.strictEqual(op.payload.weaponKey, 'ak-47');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/portalRealms.test.js`
Expected: `Cannot find module '../portal/ui/armory.logic'`

- [ ] **Step 3: Write `portal/ui/armory.logic.js`**

Read `core/ops/loadouts.js`'s `'loadout.add'`/`'loadout.edit'` entries in full first to confirm `target` shape (an existing build is targeted by `op.target.id`, per the earlier grep showing `excludeId: op.target.id` inside `loadout.edit`'s `apply`) and every payload field `validate`/`apply` actually reads, then:

```js
// portal/ui/armory.logic.js — CommonJS, imports nothing. Pure op-builders for the Armory realm.
function buildArmoryAddOp(fields) {
    return {
        type: 'loadout.add', target: null,
        payload: {
            weaponName: fields.weaponName, category: fields.category, mode: fields.mode,
            buildName: fields.buildName || 'Standard Build', imageKey: fields.imageKey || '',
            shareCode: fields.shareCode, attachments: fields.attachments || [],
            isMeta: !!fields.isMeta, isToxic: !!fields.isToxic,
            categoryRank: fields.categoryRank || null, dmzRangeRank: fields.dmzRangeRank || null,
        },
    };
}

function buildArmoryEditOp(row, columnKey, newValue) {
    const payload = { ...row, [columnKey]: newValue };
    delete payload.id; delete payload.coverage; delete payload.accent;
    return { type: 'loadout.edit', target: { id: row.id }, payload };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildArmoryAddOp, buildArmoryEditOp };
}
```

**Before finalizing:** confirm `op.target.id` (vs. `op.target.elementId` or a bare string) against `core/ops/loadouts.js`'s real `'loadout.edit'.apply` body — the grep in Task 1's research showed `op.target.id` used once (`excludeId: op.target.id`), but read the full block to be certain there isn't a second, different target field the delete/edit path also expects.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/portalRealms.test.js` — all checks pass, including every earlier one from this plan and from before it.

- [ ] **Step 5: Wire the Add form, inline edit, bulk actions, and live preview into `armory.js`**

Read the current `portal/ui/armory.js` (already modified once this session). Add:
- An `AddBuildForm` mirroring `/manage`'s real add-loadout modal fields (weapon name, category select, build name, image key, share code, badges token input using the same comma-separated grammar `utils/adminParser.js`'s `parseLoadoutBadges` validates — surface its rejected-token message verbatim on a validation failure, don't invent new wording), rendered above `<Rack>`/`<Coverage>` when `showAdd` is true. On submit, `stageOps('armory', [buildArmoryAddOp({...fields, mode: 'MP'})], session.csrfToken)`.
- Pass `onAdd`, `realm="armory"`, `csrfToken`, `buildEditOp={buildArmoryEditOp}` to the existing `<Manifest>` call; mark the badges-bearing columns `editable: true`.
- A `selectedBuildId` state, set when a Manifest row is clicked (not just checkbox-selected — add an `onRowClick` prop to `<Manifest>` in this task, since Task 2 only added cell-click-to-edit, not row-click-to-preview; wire it the same opt-in way). When set, fetch `GET /api/armory/preview?id=${selectedBuildId}` and render `renderV2(data.card.components)` in a "LIVE PREVIEW" panel beside Rack/Coverage.
- Bulk actions: "Set badges…" (opens a small inline prompt reusing the same badges-token parsing as the Add form, applies `loadout.edit` to every selected id), "Export selection" (`utils/adminParser.js`'s `formatLoadoutsAsBulkText` is currently only wired to Discord-side callers — `handlers/manage/loadouts.js`, `utils/manageActions.js` — so this task adds a new route in `portal/api/armory.js`, gated identically to the other two Armory routes:
```js
    route('GET', /^\/api\/armory\/export$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, ARMORY_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean);
        const builds = await Loadout.find({ _id: { $in: ids } }).lean();
        const { formatLoadoutsAsBulkText } = require('../../utils/adminParser');
        sendJson(res, 200, { text: formatLoadoutsAsBulkText(builds) });
    }));
```
the frontend triggers a browser download of the returned `text` the same way a native `<a>` with a `data:` URL or `Blob` would — no server-side file write), "Stage deletion" (`loadout.bulkDelete`). **"Re-fetch images" is deliberately not built** — see the design doc §5.

- [ ] **Step 6: Verify in the browser against real local Mongo**

Same pattern as Task 3 Step 6 and Task 4 Step 6: direct authenticated `fetch` calls proving `loadout.add`/`loadout.edit` stage and commit correctly against real data, plus a browser screenshot of the LIVE PREVIEW panel actually rendering a real build's card via `GET /api/armory/preview`. Clean up every test-created loadout/session afterward. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add portal/ui/armory.js portal/ui/armory.logic.js scripts/portalRealms.test.js package.json
git commit -m "feat(portal): wire Armory's Add form, inline edit, bulk staging, and the live buildLoadoutCard preview"
```

---

### Task 6: Broadcast — Post/edit form, inline edit, bulk actions

**Files:**
- Modify: `portal/ui/broadcast.js`
- Create: `portal/ui/broadcast.logic.js`
- Test: extend `scripts/portalRealms.test.js`

**Interfaces:**
- Consumes: `stageOps`/`stageAndCommit` (Task 1), `onAdd`/`buildEditOp` (Task 2).
- Produces: `buildBroadcastAddOp(fields) -> op`, `buildBroadcastEditOp(row, columnKey, newValue) -> op`.

- [ ] **Step 1: Write the failing test**

```js
// added to scripts/portalRealms.test.js
const { buildBroadcastAddOp, buildBroadcastEditOp } = require('../portal/ui/broadcast.logic');

check('buildBroadcastAddOp builds an announcement.post op', () => {
    const op = buildBroadcastAddOp({ text: 'Season 8 is live', expiresAt: '2026-10-01', startsAt: null, color: 0xf2c230 });
    assert.strictEqual(op.type, 'announcement.post');
    assert.strictEqual(op.payload.text, 'Season 8 is live');
});

check('buildBroadcastEditOp edits an announcement via announcement.edit, targeting its id', () => {
    const row = { id: 'a1', text: 'Old text', expiresAt: '2026-10-01', startsAt: null };
    const op = buildBroadcastEditOp(row, 'text', 'New text');
    assert.strictEqual(op.type, 'announcement.edit');
    assert.strictEqual(op.target.id, 'a1');
    assert.strictEqual(op.payload.text, 'New text');
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/portalRealms.test.js`
Expected: `Cannot find module '../portal/ui/broadcast.logic'`

- [ ] **Step 3: Write `portal/ui/broadcast.logic.js`**

Read `core/ops/announcements.js`'s `'announcement.post'`/`'announcement.edit'`/`'announcement.delete'` entries in full first (target shape for edit/delete — check whether it's `op.target.id` or `op.target.elementId`, since this hasn't been confirmed the way loadouts' has), then:

```js
// portal/ui/broadcast.logic.js — CommonJS, imports nothing. Pure op-builders for the Broadcast realm.
function buildBroadcastAddOp(fields) {
    return { type: 'announcement.post', target: null, payload: { text: fields.text, expiresAt: fields.expiresAt || null, startsAt: fields.startsAt || null, color: fields.color } };
}

function buildBroadcastEditOp(row, columnKey, newValue) {
    return { type: 'announcement.edit', target: { id: row.id }, payload: { text: row.text, expiresAt: row.expiresAt, startsAt: row.startsAt, [columnKey]: newValue } };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { buildBroadcastAddOp, buildBroadcastEditOp };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/portalRealms.test.js` — all checks pass.

- [ ] **Step 5: Wire the Post form, inline edit, and bulk actions into `broadcast.js`**

Read the current `portal/ui/broadcast.js`. Add a `PostForm` (text textarea, `startsAt`/`expiresAt` date inputs, a colour swatch defaulting to a generated accent) above `<NowShowing>`/`<Airtime>` when `showAdd` is true, wired to `onAdd`. Mark `text`/`expiresAt` columns `editable: true` on `<Manifest>` with `buildEditOp={buildBroadcastEditOp}`. Bulk actions: "Export selection", "Stage deletion" (`announcement.delete` per selected id — no bulk-delete op exists for announcements, so this builds one `announcement.delete` op per selected id in a single `ops[]` array passed to one `stageOps` call, which is exactly what a multi-op changeset is for).

- [ ] **Step 6: Verify in the browser against real local Mongo**

Same pattern as Tasks 3-5: direct authenticated `fetch` proving `announcement.post`/`edit`/`delete` stage and commit correctly, clean up test data, confirm no console errors on a rebuild.

- [ ] **Step 7: Commit**

```bash
git add portal/ui/broadcast.js portal/ui/broadcast.logic.js scripts/portalRealms.test.js package.json
git commit -m "feat(portal): wire Broadcast's Post form, inline edit, and bulk staging"
```

---

### Task 7: Full verification pass

**Files:** none (verification only)

**Interfaces:** none — this task consumes everything from Tasks 1-6 and asserts the whole system together.

- [ ] **Step 1: Run every portal test file directly**

```bash
node scripts/portalBoot.test.js
node scripts/portalAuth.test.js
node scripts/portalApi.test.js
node scripts/portalUi.test.js
node scripts/portalRealms.test.js
node scripts/portalComposeClient.test.js
```

Expected: every one exits 0. (Run them directly, not through `npm test`'s `&&` chain — the chain still breaks on the pre-existing, already-filed `announcementsHandlerSnapshot.test.js` flake before reaching the portal tests, exactly as it did earlier this session.)

- [ ] **Step 2: End-to-end browser walkthrough with a real seeded session**

Boot the portal against local dev Mongo, seed a fresh owner `PortalSession` (Task 1 Step 8's technique), and — using the Browser pane with the session cookie set the only way that works for an `HttpOnly` cookie (a real `Set-Cookie` response; if no OAuth-free login path exists, continue using direct authenticated `fetch` calls as the primary verification and the signed-out Door page as the browser-console check, exactly as every task above already did) — walk through: stage a Season draw add, drag a Track band's end date, stage an Armory build add and view its live preview, stage a Broadcast post, commit each from Board, and revert one. Screenshot the Board mid-pipeline (Staged/Blocked/Ready) and the Armory live preview panel. Delete every test-created document and the seeded session afterward.

- [ ] **Step 3: Run the full project gate**

```bash
npm run docs:audit
```

Expected: `docs-audit: all checks passed.`

- [ ] **Step 4: Update the handoff's own gap statement**

`local/handoff/2026-08-21-portal-plan3-session-C.md` is gitignored (lives under `local/`), so it needs no edit for tracked history — but re-read its "THE ONE THING TO INTERNALIZE FIRST" section one more time and confirm every bullet it lists (Track drag handles, Armory add/edit form + `buildLoadoutCard()` preview, Broadcast form, `Manifest`'s `bulkActions` actually driving `core/ops`) is now true. If any bullet is still false, that's a real gap this plan missed — file it in `docs/db-deferred-list.md` rather than silently leaving it unstated.

- [ ] **Step 5: Commit the final state**

```bash
git status --short
```

If everything from Tasks 1-6 was already committed per-task, this step is a no-op confirmation, not a new commit — the plan's own task-by-task commits are the real history.

## Audit log

A falsification pass was run per `.claude/rules/plan-drafting.md` before this plan was considered final — asking where THIS PLAN specifically is wrong (the design doc's own audit log covers the architecture; this one covers whether the plan correctly implements that architecture).

**F1 — the `op.target` shape for Armory/Broadcast edits was written from a partial grep, not the full function body, and got checked before the plan was finalized.** Ran a second, targeted grep against `core/ops/loadouts.js`'s `loadout.edit`/`loadout.delete` and `core/ops/announcements.js`'s `announcement.edit`/`announcement.delete` — both confirmed `target: { id }`, matching what Tasks 5-6's op-builders already assumed. No change needed, but this was a real gap between "read once during research" and "verified before the plan shipped," and it's exactly the class of error `plan-drafting.md` exists to catch — recorded as cleared, not skipped.

**F2 — Task 5's "Export selection" bulk action was a placeholder in the first draft** ("confirm it's already exposed anywhere in the portal API; if not, this step adds a route" — a conditional with no committed code, which is exactly the shape `writing-plans`' own "No Placeholders" rule forbids). Checked: `formatLoadoutsAsBulkText` has zero portal call sites, only Discord-side ones. Firmed up into a real route with real code in the same pass that found it, rather than leaving the conditional for the implementer to resolve mid-task.

**F3 — season.logic.js's `buildSeasonEditOp` and track.logic.js's `editOpFor` duplicate near-identical logic, and that duplication is deliberate, not missed.** `track.logic.js`'s own header comment (already in the codebase, not written by this plan) states it must import nothing, so it cannot `require()` an ESM sibling's CJS logic file across the CJS/ESM boundary the ESM `.js`/CJS `.logic.js` split exists to enforce (parent spec §12a). The two functions are ~6 lines each; a shared third module would need to sit somewhere both can reach without crossing that boundary, and the actual gain (avoiding one small duplicated function) is smaller than the indirection it would cost. Kept as stated, explicit duplication rather than a forced abstraction.

**F4 — Task 2's Step 2 ("syntax-check... expected to fail") reads like a placeholder step with no real verification, and it is genuinely the only step in this plan that can't run a real check before Task 2's own Step 4.** This isn't a plan defect — every other `portal/ui/*.js` file in the existing, already-shipped codebase has the identical property (ESM `import`/`export` can't be `node --check`ed in a project with no `"type": "module"`), and Step 4's real browser check is what actually verifies it. Named here so a future reader doesn't mistake Step 2's honesty about that limitation for an unfixed gap.

**F5 — cleared, not a defect: whether committing per-task (Task 1 through 6) versus one final commit changes anything about `docs-audit`'s hash-chain or version-coverage checks.** Checked `docs/README.md`'s per-push chore checklist and `scripts/docs-audit.mjs --list` (already run once this session, clean) — those checks operate on the changelog/version state at PUSH time, not per-commit, so per-task commits on a branch (free per this project's own git-workflow convention, `project_git_workflow` memory) are exactly the existing convention, not a new risk this plan introduces.

**Not found, and worth stating:** no defect in the decision to skip a dedicated `superpowers:subagent-driven-development` dispatch for Tasks 1-6 — Harkirat's delegation this session asked for autonomous execution without further check-ins, and per this project's own turn-cost convention (`feedback_token_conscious_tool_routing` memory: "subagent/Agent spawns — explicit request only"), inline execution via `superpowers:executing-plans` is the correct default absent an explicit ask for subagents.
