---
kind: plan
status: frozen
---

# Portal core — remaining entities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ⚠️ **`status: frozen` and the checkbox syntax below are not in conflict, though they read that way.** `doc-frontmatter` allows a `kind: plan` only `frozen` or `superseded`, and `frozen` here governs the plan's **design content** — its tasks, code and reasoning are a dated snapshot and must not be quietly rewritten. The `- [ ]` boxes are the *executing* session's progress marks. **Tick boxes; do not revise tasks.** If a task turns out to be wrong, that is a finding to raise and a new dated plan, not an edit.

**Goal:** Move calendar, loadouts, patch notes, season and announcements onto the operation core proven on draws, then retire the in-memory undo store entirely so every audited change in the system is revertible from either surface.

**Architecture:** Same four verbs as plan 1. The one genuinely new thing is that **two of these entities are separate Mongo documents rather than array elements inside `SeasonalData`**, so they need a second concurrency helper — element-identity does not apply to them, and using it would be a category error.

**Tech Stack:** Node 24 (CommonJS), Mongoose 9, plain `node scripts/*.test.js` files.

**Spec:** `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md`

**Depends on:** `docs/superpowers/plans/2026-08-20-portal-core-operation-algebra.md` — every task here assumes `core/ops/index.js`, `core/changeset.js`, `core/mongo/positional.js`, `core/revert.js` and `ChangeLog.inverse` exist and that draws is proven on them.

## Global Constraints

- Everything in plan 1's Global Constraints still applies, unchanged.
- **`SeasonalData` array elements** (calendar, patch notes, season draft) use `core/mongo/positional.js` — never `.save()`.
- **`Loadout` and `Announcement` are their own documents.** They use `core/mongo/document.js` (Task 1) with Mongoose's `__v` — element-identity is the wrong tool and would silently do nothing.
- **A handler refactor is finished only when its snapshot test passes AND it has been clicked in Discord on the dev bot.** A snapshot proves shape, not that the write landed.
- Branch off `v3-pre-release`, PR into `v3-pre-release`.

## File Structure

| Path | Responsibility |
|---|---|
| `core/mongo/document.js` | Whole-document optimistic concurrency for `Loadout` and `Announcement`. |
| `core/ops/calendar.js` | Eight calendar op types. |
| `core/ops/loadouts.js` | Six loadout op types, MP and DMZ from one table keyed on `mode`. |
| `core/ops/patchnotes.js` | Five patch-note op types. |
| `core/ops/season.js` | Four season op types — the highest-blast-radius ops in the system. |
| `core/ops/announcements.js` | Three announcement op types. |
| `handlers/manage/*.js` | **Modify** — mutation bodies replaced. Everything Discord-facing untouched. |
| `handlers/manage/shared.js` | **Modify** — `registerUndo` deleted in Task 7. |

---

### Task 1: Document-identity concurrency for `Loadout` and `Announcement`

**Files:**
- Create: `core/mongo/document.js`
- Test: `scripts/documentWrite.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `updateDocument({ Model, id, expectVersion, set, session })` → `{ ok: true, version } | { ok: false, reason: 'conflict' | 'missing' }` · `createDocument(...)` · `deleteDocument(...)`

**Why this is not `positional.js`:** `models/Loadout.js` and `models/Announcement.js` are one document per record. `positional.js` writes an element *inside* an array using `arrayFilters` and a `$` positional operator; pointed at a top-level document it matches nothing and returns `{ ok: false, reason: 'missing' }` — a **silent no-op that looks like a legitimate outcome.** The distinction is the whole reason this task exists.

- [ ] **Step 1: Write the failing test**

```js
// scripts/documentWrite.test.js
const assert = require('assert');
const { buildVersionedFilter } = require('../core/mongo/document');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('the filter pins both the id AND the expected version', () => {
    const f = buildVersionedFilter({ id: '65abc', expectVersion: 3 });
    assert.strictEqual(f._id, '65abc');
    assert.strictEqual(f.__v, 3, 'no version assertion — a stale write would win a race it should lose');
});

check('a missing expectVersion is REJECTED, never treated as "any version"', () => {
    assert.throws(() => buildVersionedFilter({ id: '65abc' }), /expectVersion/,
        'an unguarded document write must be impossible to construct');
});

check('version 0 is a valid expectation, not a falsy absence', () => {
    const f = buildVersionedFilter({ id: '65abc', expectVersion: 0 });
    assert.strictEqual(f.__v, 0, 'a brand-new document has __v 0 and must still be writable');
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/documentWrite.test.js` Expected: FAIL with `Cannot find module '../core/mongo/document'`

- [ ] **Step 3: Write the implementation**

```js
// core/mongo/document.js
//
// Optimistic concurrency for entities that are their OWN Mongo document — models/Loadout.js and
// models/Announcement.js.
//
// ⚠️ THIS IS NOT core/mongo/positional.js AND THE TWO ARE NOT INTERCHANGEABLE. positional.js writes
// an element INSIDE an array on one shared document (SeasonalData), where document-level versioning
// would fire false conflicts on unrelated edits. Here every record is its own document, so plain
// __v versioning is exactly right — and pointing positional.js at one of these matches nothing and
// returns `missing`, which reads as a legitimate outcome rather than a bug.
//
// The `expectVersion: 0` case is why the guard tests for undefined and not falsiness: a freshly
// created document has __v === 0, and `if (!expectVersion)` would reject a perfectly valid write.

function buildVersionedFilter({ id, expectVersion }) {
    if (expectVersion === undefined || expectVersion === null) {
        throw new Error('buildVersionedFilter: `expectVersion` is required — an unguarded document write can win a race it should lose');
    }
    return { _id: id, __v: expectVersion };
}

async function updateDocument({ Model, id, expectVersion, set, session }) {
    const res = await Model.updateOne(
        buildVersionedFilter({ id, expectVersion }),
        { $set: set, $inc: { __v: 1 } },
        { session }
    );
    if (res.matchedCount === 1) return { ok: true, version: expectVersion + 1 };
    const exists = await Model.exists({ _id: id }, { session });
    return { ok: false, reason: exists ? 'conflict' : 'missing' };
}

async function createDocument({ Model, doc, session }) {
    const [created] = await Model.create([doc], { session });
    return { ok: true, id: String(created._id), version: created.__v ?? 0 };
}

async function deleteDocument({ Model, id, expectVersion, session }) {
    const res = await Model.deleteOne(buildVersionedFilter({ id, expectVersion }), { session });
    if (res.deletedCount === 1) return { ok: true };
    const exists = await Model.exists({ _id: id }, { session });
    return { ok: false, reason: exists ? 'conflict' : 'missing' };
}

module.exports = { buildVersionedFilter, updateDocument, createDocument, deleteDocument };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/documentWrite.test.js` Expected: three ✓, exit 0

- [ ] **Step 4b: Re-validate the four-verb contract against a standalone document BEFORE converting anything**

Plan 1 proved the contract on draws, which lives in `SeasonalData`'s arrays and only ever exercises `positional.js`. **Nothing has yet tested whether `{ validate, preview, apply, invert }` fits an entity that is its own document** — and this is the first and cheapest moment to find out. Write one throwaway op against `Announcement` (the simplest standalone entity), run it through `core/changeset.js`, and confirm four things: `apply()` returns the same `{ ok, change, applied }` shape; `invert()` can reconstruct the record from `applied` alone; a conflicting write returns `{ ok: false, reason: 'conflict' }` rather than throwing; and the whole thing rolls back inside a transaction.

**If any of those need a different shape, stop and fix the contract here** — before five entities are built on it. Delete the throwaway op afterwards; its job was the answer, not the code.

- [ ] **Step 5: Commit**

```bash
git add core/mongo/document.js scripts/documentWrite.test.js package.json
git commit -m "feat(core): add document-identity concurrency for standalone records"
```

---

### Task 2: `core/ops/calendar.js`

**Files:**
- Create: `core/ops/calendar.js`
- Test: `scripts/calendarOps.test.js`
- Modify: `core/ops/index.js` (add `require('./calendar')`)

**Interfaces:**
- Consumes: `core/mongo/positional.js`, `utils/adminParser.js`'s `parseBulkEvents`/`normalizeCalendarCategory`/`guessCalendarCategory`/`formatCalendarAsBulkText`
- Produces: `calendar.add` · `calendar.edit` · `calendar.delete` · `calendar.bulkAdd` · `calendar.bulkReplace` · `calendar.bulkDelete` · `calendar.setBanners` · `calendar.purge`

**The calendar-specific trap:** an event carries a **category** (`draw` / `event` / `playlist`, from the bulk parser's `d•`/`e•`/`p•` prefix) and a **2XCP flag**. `models/SeasonalData.js` records that `draft.calendar` once lost the 2XCP field because it was a hand-copied sub-schema — so `validate()` must assert the field survives, not assume it.

- [ ] **Step 1: Write the failing test, including the field that was lost once before**

```js
// scripts/calendarOps.test.js
const assert = require('assert');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('calendar.add defaults an unprefixed entry to category "event"', () => {
    const r = ops.resolveOp('calendar.add').validate({
        type: 'calendar.add', payload: { title: 'Clan wars', startDate: 'Aug 24', endDate: 'Aug 31' }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.category, 'event',
        'an unprefixed entry must keep rendering in the section it always has');
});

check('calendar.add preserves the 2XCP flag — the field draft.calendar once dropped', () => {
    const r = ops.resolveOp('calendar.add').validate({
        type: 'calendar.add', payload: { title: 'Double CP', startDate: 'Aug 11', endDate: 'Aug 15', is2XCP: true }
    });
    assert.strictEqual(r.normalized.payload.is2XCP, true,
        'losing this silently made Promote to Live flatten every staged 2X CP event — see models/SeasonalData.js');
});

check('calendar.bulkReplace inverts carrying the FULL prior set', () => {
    const prior = [{ title: 'A' }, { title: 'B' }];
    const inv = ops.resolveOp('calendar.bulkReplace').invert({
        action: 'bulkReplace', applied: { replaced: prior, added: [{ title: 'C' }] }
    });
    assert.deepStrictEqual(inv.payload.events, prior);
});

check('calendar.purge is tier 3 and setBanners is tier 1', () => {
    assert.strictEqual(ops.resolveOp('calendar.purge').tier, 3);
    assert.strictEqual(ops.resolveOp('calendar.setBanners').tier, 1);
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/calendarOps.test.js` Expected: FAIL — `unknown op type "calendar.add"`

- [ ] **Step 3: Implement, following the shape `core/ops/draws.js` established**

```js
// core/ops/calendar.js
const { registerEntity } = require('./index');
const { updateElement, appendElement, removeElement } = require('../mongo/positional');
const { parseBulkEvents, normalizeCalendarCategory, guessCalendarCategory, parseAdminDate, toTitleCase } =
    require('../../utils/adminParser');
const SeasonalData = require('../../models/SeasonalData');

const DOC = { docType: 'global' };
const PATH = 'calendar';

function validateEvent(payload) {
    const errors = [];
    if (!payload?.title?.trim()) errors.push('An event needs a title.');
    for (const f of ['startDate', 'endDate']) {
        if (payload?.[f] && !parseAdminDate(payload[f])) errors.push(`Could not read the ${f} "${payload[f]}".`);
    }
    if (errors.length) return { ok: false, errors };
    // normalizeCalendarCategory falls back to guessCalendarCategory, which is what keeps an
    // unprefixed entry rendering in the section it always did.
    const category = normalizeCalendarCategory(payload.category, payload.title) || guessCalendarCategory(payload.title);
    return {
        ok: true, errors: [],
        normalized: { payload: { ...payload, title: toTitleCase(payload.title.trim()), category, is2XCP: !!payload.is2XCP } }
    };
}

registerEntity('calendar', {
    'calendar.add': {
        action: 'calendar:add', tier: 1,
        validate: (op) => validateEvent(op.payload),
        preview: (op, live) => ({ before: { count: live.calendar.length }, after: { count: live.calendar.length + 1 } }),
        apply: async (op, { session }) => {
            const res = await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, element: op.payload, session });
            if (!res.ok) return res;
            const fresh = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const created = fresh[PATH][fresh[PATH].length - 1];
            return {
                ok: true,
                change: { action: 'add', model: 'SeasonalData', target: op.payload.title, summary: `Added calendar event "${op.payload.title}"` },
                applied: { elementId: String(created._id), title: op.payload.title }
            };
        },
        invert: (c) => ({ type: 'calendar.delete', target: { elementId: c.applied.elementId }, payload: { title: c.applied.title } })
    },

    'calendar.delete': {
        action: 'calendar:delete', tier: 1,
        validate: (op) => op.target?.elementId ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No event was selected.'] },
        preview: (op, live) => ({ before: { event: live.calendar.find(e => String(e._id) === op.target.elementId) }, after: { event: null } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const gone = before[PATH].find(e => String(e._id) === op.target.elementId);
            if (!gone) return { ok: false, reason: 'missing' };
            const res = await removeElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, elementId: op.target.elementId, session });
            if (!res.ok) return res;
            return {
                ok: true,
                change: { action: 'delete', model: 'SeasonalData', target: gone.title, summary: `Deleted calendar event "${gone.title}"` },
                applied: { removed: gone }
            };
        },
        invert: (c) => ({ type: 'calendar.add', payload: c.applied.removed })
    },

    'calendar.edit': {
        action: 'calendar:edit', tier: 1,
        validate: (op) => op.target?.elementId ? validateEvent(op.payload) : { ok: false, errors: ['No event was selected.'] },
        preview: (op, live) => {
            const cur = live.calendar.find(e => String(e._id) === op.target.elementId);
            return { before: cur, after: { ...cur, ...op.payload } };
        },
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const cur = before[PATH].find(e => String(e._id) === op.target.elementId);
            if (!cur) return { ok: false, reason: 'missing' };
            const expect = Object.fromEntries(Object.keys(op.payload).map(k => [k, cur[k]]));
            const res = await updateElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH,
                                              elementId: op.target.elementId, expect, set: op.payload, session });
            if (!res.ok) return res;
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: cur.title, summary: `Edited calendar event "${cur.title}"` },
                applied: { elementId: op.target.elementId, prior: expect }
            };
        },
        invert: (c) => ({ type: 'calendar.edit', target: { elementId: c.applied.elementId }, payload: c.applied.prior })
    },

    'calendar.bulkAdd': {
        action: 'calendar:addmultiple', tier: 2,
        validate: (op) => {
            const parsed = parseBulkEvents(op.payload.text || '');
            if (!parsed?.length) return { ok: false, errors: ['Nothing in that text parsed as an event. Check the Bulk Format Guide.'] };
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed } } };
        },
        preview: (op, live) => ({ before: { count: live.calendar.length }, after: { count: live.calendar.length + op.payload.parsed.length } }),
        apply: async (op, { session }) => {
            for (const e of op.payload.parsed) {
                await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, element: e, session });
            }
            const fresh = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const ids = fresh[PATH].slice(-op.payload.parsed.length).map(e => String(e._id));
            return {
                ok: true,
                change: { action: 'bulkAdd', model: 'SeasonalData', target: `${op.payload.parsed.length} events`,
                          summary: `Added ${op.payload.parsed.length} calendar events in bulk` },
                applied: { ids }
            };
        },
        invert: (c) => ({ type: 'calendar.bulkDelete', target: { ids: c.applied.ids } })
    },

    'calendar.bulkReplace': {
        action: 'calendar:replacemultiple', tier: 2,
        validate: (op) => {
            const parsed = parseBulkEvents(op.payload.text || '');
            if (!parsed) return { ok: false, errors: ['Nothing in that text parsed as an event.'] };
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed } } };
        },
        preview: (op, live) => ({ before: { events: live.calendar }, after: { events: op.payload.parsed } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const replaced = before[PATH];
            await SeasonalData.updateOne(DOC, { $set: { [PATH]: op.payload.parsed } }, { session });
            return {
                ok: true,
                change: { action: 'bulkReplace', model: 'SeasonalData', target: 'calendar',
                          summary: `Replaced ${replaced.length} events with ${op.payload.parsed.length}` },
                applied: { replaced, added: op.payload.parsed }
            };
        },
        invert: (c) => ({ type: 'calendar.bulkReplace', payload: { events: c.applied.replaced, parsed: c.applied.replaced } })
    },

    'calendar.bulkDelete': {
        action: 'calendar:deletemultiple', tier: 2,
        validate: (op) => op.target?.ids?.length ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['Nothing was selected to delete.'] },
        preview: (op, live) => ({ before: { count: live.calendar.length }, after: { removing: op.target.ids.length } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            const removed = [];
            for (const id of op.target.ids) {
                const gone = before[PATH].find(e => String(e._id) === id);
                if (gone) removed.push(gone);
                await removeElement({ Model: SeasonalData, docFilter: DOC, arrayPath: PATH, elementId: id, session });
            }
            return {
                ok: true,
                change: { action: 'bulkDelete', model: 'SeasonalData', target: `${removed.length} events`,
                          summary: `Deleted ${removed.length} calendar events in bulk` },
                applied: { removed }
            };
        },
        invert: (c) => ({ type: 'calendar.bulkAdd', payload: { parsed: c.applied.removed } })
    },

    'calendar.setBanners': {
        action: 'calendar:banners', tier: 1,
        validate: (op) => {
            const keys = ['draw', 'event', 'playlist'];
            const bad = Object.keys(op.payload || {}).filter(k => !keys.includes(k));
            return bad.length ? { ok: false, errors: [`Unknown banner page: ${bad.join(', ')}`] }
                              : { ok: true, errors: [], normalized: op };
        },
        preview: (op, live) => ({ before: live.calendarBanners || {}, after: { ...(live.calendarBanners || {}), ...op.payload } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const prior = before.calendarBanners || {};
            await SeasonalData.updateOne(DOC, { $set: { calendarBanners: { ...prior, ...op.payload } } }, { session });
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: 'calendar banners', summary: 'Updated calendar banners' },
                applied: { prior }
            };
        },
        invert: (c) => ({ type: 'calendar.setBanners', payload: c.applied.prior })
    },

    'calendar.purge': {
        action: 'calendar:purge', tier: 3,
        validate: () => ({ ok: true, errors: [], normalized: {} }),
        preview: (op, live) => ({ before: { count: live.calendar.length }, after: { count: 0 } }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).select(PATH).lean().session(session);
            await SeasonalData.updateOne(DOC, { $set: { [PATH]: [] } }, { session });
            return {
                ok: true,
                change: { action: 'purge', model: 'SeasonalData', target: 'calendar', summary: `Purged ${before[PATH].length} calendar events` },
                applied: { events: before[PATH] }
            };
        },
        invert: (c) => ({ type: 'calendar.bulkReplace', payload: { events: c.applied.events, parsed: c.applied.events } })
    }
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/calendarOps.test.js` Expected: four ✓, exit 0

- [ ] **Step 5: Snapshot the calendar modals BEFORE refactoring the handler**

Copy `scripts/drawsHandlerSnapshot.test.js` to `scripts/calendarHandlerSnapshot.test.js`, capturing `buildCalendarAddModal()`, the bulk modals, the banners modal and both search modals. Write the fixture from unmodified code, run it green, and **commit the fixture before touching `handlers/manage/calendar.js`.**

- [ ] **Step 6: Refactor `handlers/manage/calendar.js` onto the core**

One mutation at a time, running the snapshot after each — same pattern as plan 1 Task 6. The four `registerUndo` call sites at lines 101, 153, 207 and 223 disappear as their ops gain an `invert`.

- [ ] **Step 7: Click-test on the dev bot**

`node --watch --env-file=.env.dev index.js`, then `/manage section:calendar` → Add, Edit, Delete, Add Multiple, Replace Multiple, Delete Multiple, Banners, Purge. Confirm each appears in `/calendar` and writes a `/bot analytics` Changes row. **Check the 2XCP flag specifically** — it is the field this file has lost before.

- [ ] **Step 8: Commit**

```bash
git add core/ops/calendar.js core/ops/index.js handlers/manage/calendar.js \
        scripts/calendarOps.test.js scripts/calendarHandlerSnapshot.test.js scripts/fixtures/ package.json
git commit -m "feat(core): move calendar mutations onto the operation core"
```

---

### Task 3: `core/ops/loadouts.js` — MP and DMZ

**Files:**
- Create: `core/ops/loadouts.js`
- Test: `scripts/loadoutOps.test.js`
- Modify: `core/ops/index.js`

**Interfaces:**
- Consumes: `core/mongo/document.js` (**not** `positional.js`), `utils/adminParser.js`'s `parseBulkLoadoutList`/`parseLoadoutBadges`/`correctGunsmithCode`/`orderAttachmentsBySlot`/`normalizeWeaponName`, `utils/loadoutRender.js`'s `computeWeaponKeyAndBuild`/`findDuplicateLoadouts`
- Produces: `loadout.add` · `loadout.edit` · `loadout.delete` · `loadout.bulkAdd` · `loadout.bulkReplace` · `loadout.bulkDelete`

**Two things make loadouts different from every other entity.** They are **their own documents**, so this file uses `core/mongo/document.js` — reaching for `positional.js` here matches nothing and returns `missing`, which reads as a legitimate outcome. And **MP and DMZ are the same ops with a different `mode`**, derived from the page exactly as `utils/manageActions.js`'s `loadoutModeFor`/`pageForLoadoutMode` already do, so the two can never drift apart.

- [ ] **Step 1: Write the failing test**

```js
// scripts/loadoutOps.test.js
const assert = require('assert');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('loadout.add requires a mode, and rejects anything that is not MP or DMZ', () => {
    const bad = ops.resolveOp('loadout.add').validate({
        type: 'loadout.add', payload: { weaponName: 'FENNEC', buildName: 'CQB', mode: 'WZ' }
    });
    assert.strictEqual(bad.ok, false);
    assert.ok(bad.errors.some(e => /mode/i.test(e)));
});

check('loadout.add normalizes the weapon name and derives weaponKey', () => {
    const r = ops.resolveOp('loadout.add').validate({
        type: 'loadout.add', payload: { weaponName: 'fennec', buildName: 'CQB', mode: 'MP', category: 'SMG', attachments: [] }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.weaponName, 'FENNEC');
    assert.ok(r.normalized.payload.weaponKey, 'weaponKey must be derived, never typed');
});

check('loadout.add corrects a gunsmith code rather than storing a typo', () => {
    const r = ops.resolveOp('loadout.add').validate({
        type: 'loadout.add', payload: { weaponName: 'FENNEC', buildName: 'CQB', mode: 'MP',
                                        category: 'SMG', attachments: [], shareCode: ' 6zq4-kp2m-vx90 ' }
    });
    assert.strictEqual(r.normalized.payload.shareCode, '6ZQ4-KP2M-VX90');
});

check('loadout.delete inverts to an add carrying the whole document', () => {
    const doc = { weaponName: 'FENNEC', buildName: 'CQB', mode: 'MP', attachments: [1, 2, 3, 4, 5] };
    const inv = ops.resolveOp('loadout.delete').invert({ action: 'delete', applied: { removed: doc } });
    assert.strictEqual(inv.type, 'loadout.add');
    assert.deepStrictEqual(inv.payload, doc, 'restoring a build must restore its attachments, not just its name');
});

check('loadout.bulkReplace is tier 2 and scoped to ONE mode', () => {
    assert.strictEqual(ops.resolveOp('loadout.bulkReplace').tier, 2);
    const r = ops.resolveOp('loadout.bulkReplace').validate({ type: 'loadout.bulkReplace', target: {}, payload: { text: 'x' } });
    assert.strictEqual(r.ok, false, 'a replace with no mode would wipe both MP and DMZ');
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/loadoutOps.test.js` Expected: FAIL — `unknown op type "loadout.add"`

- [ ] **Step 3: Implement**

```js
// core/ops/loadouts.js
//
// ⚠️ Loadouts are THEIR OWN DOCUMENTS. This file uses core/mongo/document.js, never
// core/mongo/positional.js — pointing the positional helper at a top-level document matches nothing
// and returns { ok:false, reason:'missing' }, which is indistinguishable from a legitimate outcome.
//
// ⚠️ MP and DMZ are ONE table keyed on `mode`, mirroring utils/manageActions.js's loadoutModeFor /
// pageForLoadoutMode, so the two collections cannot drift apart.
const { registerEntity } = require('./index');
const { updateDocument, createDocument, deleteDocument } = require('../mongo/document');
const { parseBulkLoadoutList, parseLoadoutBadges, correctGunsmithCode, orderAttachmentsBySlot, normalizeWeaponName } =
    require('../../utils/adminParser');
const { computeWeaponKeyAndBuild, findDuplicateLoadouts } = require('../../utils/loadoutRender');
const Loadout = require('../../models/Loadout');

const MODES = ['MP', 'DMZ'];

function validateBuild(payload) {
    const errors = [];
    if (!payload?.weaponName?.trim()) errors.push('A build needs a weapon name.');
    if (!payload?.buildName?.trim()) errors.push('A build needs a build name.');
    if (!MODES.includes(payload?.mode)) errors.push(`Mode must be one of ${MODES.join(' or ')}.`);
    if (errors.length) return { ok: false, errors };

    const weaponName = normalizeWeaponName(payload.weaponName);
    const { weaponKey } = computeWeaponKeyAndBuild(weaponName, []);
    return {
        ok: true, errors: [],
        normalized: {
            payload: {
                ...payload,
                weaponName, weaponKey,
                buildName: payload.buildName.trim(),
                shareCode: payload.shareCode ? correctGunsmithCode(payload.shareCode.trim()) : undefined,
                badges: payload.badges ? parseLoadoutBadges(payload.badges) : (payload.badgesArray || []),
                attachments: orderAttachmentsBySlot(payload.attachments || [], payload.slots)
            }
        }
    };
}

registerEntity('loadouts', {
    'loadout.add': {
        action: 'loadouts_mp:add', tier: 1,
        validate: (op) => validateBuild(op.payload),
        preview: async (op) => {
            const siblings = await Loadout.find({ weaponKey: op.payload.weaponKey, mode: op.payload.mode }).lean();
            return { before: { builds: siblings.length }, after: { builds: siblings.length + 1 },
                     warnings: findDuplicateLoadouts(op.payload, siblings) };
        },
        apply: async (op, { session }) => {
            const res = await createDocument({ Model: Loadout, doc: op.payload, session });
            return {
                ok: true,
                change: { action: 'add', model: 'Loadout', target: `${op.payload.weaponName} — ${op.payload.buildName}`,
                          summary: `Added ${op.payload.mode} loadout "${op.payload.weaponName} — ${op.payload.buildName}"` },
                applied: { id: res.id }
            };
        },
        invert: (c) => ({ type: 'loadout.delete', target: { id: c.applied.id } })
    },

    'loadout.edit': {
        action: 'loadouts_mp:edit', tier: 1,
        validate: (op) => op.target?.id ? validateBuild(op.payload) : { ok: false, errors: ['No build was selected.'] },
        preview: async (op) => {
            const cur = await Loadout.findById(op.target.id).lean();
            return { before: cur, after: { ...cur, ...op.payload } };
        },
        apply: async (op, { session }) => {
            const cur = await Loadout.findById(op.target.id).session(session).lean();
            if (!cur) return { ok: false, reason: 'missing' };
            const prior = Object.fromEntries(Object.keys(op.payload).map(k => [k, cur[k]]));
            const res = await updateDocument({ Model: Loadout, id: op.target.id, expectVersion: cur.__v, set: op.payload, session });
            if (!res.ok) return res;
            return {
                ok: true,
                change: { action: 'edit', model: 'Loadout', target: `${cur.weaponName} — ${cur.buildName}`,
                          summary: `Edited loadout "${cur.weaponName} — ${cur.buildName}"` },
                applied: { id: op.target.id, prior, version: res.version }
            };
        },
        invert: (c) => ({ type: 'loadout.edit', target: { id: c.applied.id }, payload: c.applied.prior })
    },

    'loadout.delete': {
        action: 'loadouts_mp:delete', tier: 1,
        validate: (op) => op.target?.id ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['No build was selected.'] },
        preview: async (op) => ({ before: { build: await Loadout.findById(op.target.id).lean() }, after: { build: null } }),
        apply: async (op, { session }) => {
            const cur = await Loadout.findById(op.target.id).session(session).lean();
            if (!cur) return { ok: false, reason: 'missing' };
            const res = await deleteDocument({ Model: Loadout, id: op.target.id, expectVersion: cur.__v, session });
            if (!res.ok) return res;
            const { _id, __v, ...rest } = cur;
            return {
                ok: true,
                change: { action: 'delete', model: 'Loadout', target: `${cur.weaponName} — ${cur.buildName}`,
                          summary: `Deleted loadout "${cur.weaponName} — ${cur.buildName}"` },
                applied: { removed: rest }
            };
        },
        invert: (c) => ({ type: 'loadout.add', payload: c.applied.removed })
    },

    'loadout.bulkAdd': {
        action: 'loadouts_mp:bulkadd', tier: 2,
        validate: (op) => {
            if (!MODES.includes(op.target?.mode)) return { ok: false, errors: ['Bulk add needs a mode (MP or DMZ).'] };
            const parsed = parseBulkLoadoutList(op.payload.text || '');
            if (!parsed?.length) return { ok: false, errors: ['Nothing in that text parsed as a loadout.'] };
            const withMode = parsed.map(b => ({ ...b, mode: op.target.mode }));
            const bad = withMode.map(validateBuild).filter(r => !r.ok);
            if (bad.length) return { ok: false, errors: bad.flatMap(r => r.errors) };
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed: withMode.map(b => validateBuild(b).normalized.payload) } } };
        },
        preview: async (op) => ({ before: { builds: await Loadout.countDocuments({ mode: op.target.mode }) },
                                  after: { adding: op.payload.parsed.length } }),
        apply: async (op, { session }) => {
            const ids = [];
            for (const b of op.payload.parsed) {
                const r = await createDocument({ Model: Loadout, doc: b, session });
                ids.push(r.id);
            }
            return {
                ok: true,
                change: { action: 'bulkAdd', model: 'Loadout', target: `${ids.length} ${op.target.mode} builds`,
                          summary: `Added ${ids.length} ${op.target.mode} loadouts in bulk` },
                applied: { ids }
            };
        },
        invert: (c) => ({ type: 'loadout.bulkDelete', target: { ids: c.applied.ids } })
    },

    'loadout.bulkReplace': {
        action: 'loadouts_mp:bulkreplace', tier: 2,
        validate: (op) => {
            if (!MODES.includes(op.target?.mode)) {
                return { ok: false, errors: ['Replace Multiple needs a mode — without one it would wipe both MP and DMZ.'] };
            }
            const parsed = parseBulkLoadoutList(op.payload.text || '');
            if (!parsed) return { ok: false, errors: ['Nothing in that text parsed as a loadout.'] };
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed: parsed.map(b => ({ ...b, mode: op.target.mode })) } } };
        },
        preview: async (op) => ({ before: { builds: await Loadout.find({ mode: op.target.mode }).lean() },
                                  after: { builds: op.payload.parsed } }),
        apply: async (op, { session }) => {
            const replaced = await Loadout.find({ mode: op.target.mode }).session(session).lean();
            await Loadout.deleteMany({ mode: op.target.mode }, { session });
            for (const b of op.payload.parsed) await createDocument({ Model: Loadout, doc: b, session });
            return {
                ok: true,
                change: { action: 'bulkReplace', model: 'Loadout', target: `${op.target.mode} loadouts`,
                          summary: `Replaced ${replaced.length} ${op.target.mode} loadouts with ${op.payload.parsed.length}` },
                applied: { mode: op.target.mode, replaced: replaced.map(({ _id, __v, ...r }) => r) }
            };
        },
        invert: (c) => ({ type: 'loadout.bulkReplace', target: { mode: c.applied.mode },
                          payload: { parsed: c.applied.replaced } })
    },

    'loadout.bulkDelete': {
        action: 'loadouts_mp:bulkdelete', tier: 2,
        validate: (op) => op.target?.ids?.length ? { ok: true, errors: [], normalized: op } : { ok: false, errors: ['Nothing was selected to delete.'] },
        preview: async (op) => ({ before: { removing: op.target.ids.length } }),
        apply: async (op, { session }) => {
            const removed = await Loadout.find({ _id: { $in: op.target.ids } }).session(session).lean();
            await Loadout.deleteMany({ _id: { $in: op.target.ids } }, { session });
            return {
                ok: true,
                change: { action: 'bulkDelete', model: 'Loadout', target: `${removed.length} builds`,
                          summary: `Deleted ${removed.length} loadouts in bulk` },
                applied: { removed: removed.map(({ _id, __v, ...r }) => r) }
            };
        },
        invert: (c) => ({ type: 'loadout.bulkAdd', target: { mode: c.applied.removed[0]?.mode },
                          payload: { parsed: c.applied.removed } })
    }
});
```

- [ ] **Step 4: Run the test**

Run: `node scripts/loadoutOps.test.js` Expected: five ✓, exit 0

- [ ] **Step 5: Register both pages against the same ops**

`core/ops/index.js`'s `ACTION_TO_OP` maps one action per op. Loadouts need both `loadouts_mp:add` and `loadouts_dmz:add` to reach `loadout.add`. Extend `registerEntity` to accept `action` as an **array**, and add a conservation check to `scripts/coreOps.test.js` asserting every mutating action on **both** loadout pages resolves.

- [ ] **Step 6: Snapshot, refactor, click-test**

Same three-step pattern as Task 2, against `handlers/manage/loadouts.js`. Its two `registerUndo` sites (lines 240, 309) disappear. **Click-test both MP and DMZ** — they are one code path with a different `mode`, and testing only MP proves half of it.

- [ ] **Step 7: Commit**

```bash
git add core/ops/loadouts.js core/ops/index.js handlers/manage/loadouts.js scripts/ package.json
git commit -m "feat(core): move MP and DMZ loadout mutations onto the operation core"
```

---

### Task 4: `core/ops/patchnotes.js`

**Files:**
- Create: `core/ops/patchnotes.js` · Test: `scripts/patchnoteOps.test.js` · Modify: `core/ops/index.js`

**Interfaces:**
- Consumes: `core/mongo/positional.js`, `utils/adminParser.js`'s `formatPatchNotesAsText`
- Produces: `patchnote.setDateInfo` · `patchnote.setUrls1` · `patchnote.setUrls2` · `patchnote.addSeason` · `patchnote.purge`

**The patch-notes trap:** each entry's cached images are keyed on **that subdocument's own `_id`** (`models/SeasonalData.js` says so explicitly), and retention is season-based rather than age-based — an image stays cached while its entry is one of the five most recent. So an op that **replaces** an entry rather than editing it in place orphans its images. Every op here edits in place or appends; none replaces.

- [ ] **Step 1: Write the failing test**

```js
// scripts/patchnoteOps.test.js
const assert = require('assert');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('addSeason APPENDS and never touches the current entry', () => {
    const impl = ops.resolveOp('patchnote.addSeason');
    assert.strictEqual(impl.tier, 2);
    const live = { patchNotes: [{ title: 'S7', _id: 'a' }] };
    const p = impl.preview({ type: 'patchnote.addSeason', payload: { title: 'S8' } }, live);
    assert.strictEqual(p.after.count, 2, 'adding a season must not overwrite the live one');
});

check('setDateInfo edits IN PLACE, preserving the subdocument _id', () => {
    const inv = ops.resolveOp('patchnote.setDateInfo').invert({
        action: 'edit', applied: { elementId: 'a', prior: { info: 'old' } }
    });
    assert.strictEqual(inv.target.elementId, 'a',
        'the image cache is keyed on this _id — an op that changes it orphans every cached image');
});

check('purge is tier 3 and its inverse carries every entry', () => {
    const impl = ops.resolveOp('patchnote.purge');
    assert.strictEqual(impl.tier, 3);
    const entries = [{ title: 'S6' }, { title: 'S7' }];
    assert.deepStrictEqual(impl.invert({ action: 'purge', applied: { entries } }).payload.entries, entries);
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/patchnoteOps.test.js` Expected: FAIL — `unknown op type "patchnote.addSeason"`

- [ ] **Step 3: Implement, following `core/ops/calendar.js`'s element-identity shape**

The five ops, all against `SeasonalData.patchNotes`: `setDateInfo`/`setUrls1`/`setUrls2` are in-place `updateElement` edits on the newest entry (tier 1, inverse = the prior field values); `addSeason` is an `appendElement` (tier 2, inverse = `patchnote.removeSeason` by `_id`); `purge` is a `$set: { patchNotes: [] }` (tier 3, inverse = a bulk restore carrying every entry). Each `apply()` returns `{ ok, change, applied }` and each `invert()` reads `change.applied`, matching plan 1's contract exactly.

- [ ] **Step 4: Run the test, then snapshot, refactor and click-test**

Same three-step pattern. `handlers/manage/patchnotes.js`'s single `registerUndo` (line 151) disappears. **Click-test that a patch-note image still resolves after an edit** — that is the failure this entity's trap predicts.

- [ ] **Step 5: Commit**

```bash
git add core/ops/patchnotes.js core/ops/index.js handlers/manage/patchnotes.js scripts/ package.json
git commit -m "feat(core): move patch-note mutations onto the operation core"
```

---

### Task 5: `core/ops/season.js` — the highest blast radius in the system

**Files:**
- Create: `core/ops/season.js` · Test: `scripts/seasonOps.test.js` · Modify: `core/ops/index.js`

**Interfaces:**
- Consumes: `core/mongo/positional.js`, `utils/adminParser.js`'s `parseAdminDate`
- Produces: `season.setTitlesDeadlines` · `season.promoteDraft` · `season.discardDraft` · `season.startNew`

**Read this before writing any of it.** `season.promoteDraft` and `season.startNew` **rotate live data that every public command reads**. `models/SeasonalData.js` records why the draft area exists at all: editing `newDraws`/`calendar`/`bpEnd` directly during the overlap between "current season not over" and "new season announced" *immediately overwrote what was still publicly live*. These two ops are tier 3 and their inverse must capture the **entire pre-rotation document**, not a diff — a diff of a rotation is not a restore.

- [ ] **Step 1: Write the failing test**

```js
// scripts/seasonOps.test.js
const assert = require('assert');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('promoteDraft and startNew are BOTH tier 3', () => {
    assert.strictEqual(ops.resolveOp('season.promoteDraft').tier, 3);
    assert.strictEqual(ops.resolveOp('season.startNew').tier, 3);
});

check('promoteDraft inverts by restoring the WHOLE prior document, not a diff', () => {
    const snapshot = { title: 'S7', bpEnd: '2026-09-04', newDraws: [1, 2], returningDraws: [3], calendar: [4, 5] };
    const inv = ops.resolveOp('season.promoteDraft').invert({ action: 'promote', applied: { snapshot } });
    assert.strictEqual(inv.type, 'season.restoreSnapshot');
    assert.deepStrictEqual(inv.payload.snapshot, snapshot,
        'a rotation cannot be undone by a diff — every rotated field must be in the snapshot');
});

check('setTitlesDeadlines accepts the literal word TBD without corrupting the date', () => {
    const r = ops.resolveOp('season.setTitlesDeadlines').validate({
        type: 'season.setTitlesDeadlines', payload: { title: 'Season 8', bpEnd: 'TBD' }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.bpEndTBD, true);
    assert.strictEqual(r.normalized.payload.bpEnd, null,
        'TBD must set the flag and NULL the date — the L194 bug was TBD silently becoming a real date');
});

check('discardDraft is tier 2 and restores the discarded draft', () => {
    const impl = ops.resolveOp('season.discardDraft');
    assert.strictEqual(impl.tier, 2);
    const draft = { newDraws: [1], calendar: [2] };
    assert.deepStrictEqual(impl.invert({ action: 'discard', applied: { draft } }).payload.draft, draft);
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/seasonOps.test.js` Expected: FAIL — `unknown op type "season.promoteDraft"`

- [ ] **Step 3: Implement, with a fifth internal op for the inverse**

`season.restoreSnapshot` is registered but **not** exposed as a `/manage` action and carries no `action` key — it exists solely as the inverse of the two rotations. Its `apply()` is a single `$set` of every field the snapshot holds. Add a check to `scripts/coreOps.test.js` allowing exactly this one op type to have no registry action, with the reason stated inline, so the conservation test does not have to be weakened generally.

- [ ] **Step 4: Run the test, then snapshot, refactor and click-test**

`handlers/manage/season.js`'s two `registerUndo` sites (lines 62, 194) disappear. **Click-test the full rotation on the dev bot with real data**: set up a draft, promote it, confirm `/draws`, `/calendar` and `/season end` all show the new season, then **revert from `/bot analytics` Changes and confirm every one of them goes back**. This is the single most consequential revert in the system.

- [ ] **Step 5: Commit**

```bash
git add core/ops/season.js core/ops/index.js handlers/manage/season.js scripts/ package.json
git commit -m "feat(core): move season lifecycle mutations onto the operation core"
```

---

### Task 6: `core/ops/announcements.js`

**Files:**
- Create: `core/ops/announcements.js` · Test: `scripts/announcementOps.test.js` · Modify: `core/ops/index.js` · `models/Announcement.js`

**Interfaces:**
- Consumes: `core/mongo/document.js`
- Produces: `announcement.post` · `announcement.edit` · `announcement.delete`

**Announcements are their own documents**, so this uses `core/mongo/document.js`. This task also closes the filed `startsAt` gap, because scheduling is what the portal's Broadcast realm needs and the field cannot be added later by the frontend alone.

- [ ] **Step 1: Add `startsAt` to the schema, in the same change as the code that sets it**

```js
// models/Announcement.js — add beside expiresAt
    // Scheduling (added with the operation core). Without this an announcement goes live the instant
    // it is posted and the only time control is an END. null means "live now", which is exactly the
    // pre-existing behaviour, so every existing document keeps working untouched.
    //
    // ⚠️ Declared here in the SAME change as the op that writes it — root CLAUDE.md's schema-save
    // gotcha. models/SeasonalData.js's draft.calendar is the recorded cost of getting this wrong.
    startsAt: { type: Date, default: null },
```

- [ ] **Step 2: Write the failing test**

```js
// scripts/announcementOps.test.js
const assert = require('assert');
const Announcement = require('../models/Announcement');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('startsAt is declared on the schema and defaults to null', () => {
    const path = Announcement.schema.path('startsAt');
    assert.ok(path, 'startsAt is NOT declared — Mongoose will drop it silently on the next fetch');
    assert.strictEqual(new Announcement({ text: 'x', createdBy: 'y', color: 0 }).startsAt, null,
        'null must mean "live now", so every existing announcement keeps its current behaviour');
});

check('announcement.post rejects a start after its own expiry', () => {
    const r = ops.resolveOp('announcement.post').validate({
        type: 'announcement.post',
        payload: { text: 'hi', color: 0, startsAt: '2026-09-10', expiresAt: '2026-09-01' }
    });
    assert.strictEqual(r.ok, false);
    assert.ok(r.errors.some(e => /before/i.test(e)), 'an announcement that expires before it starts can never show');
});

check('announcement.delete inverts to a post carrying the original createdAt', () => {
    const doc = { text: 'hi', color: 1, createdBy: 'u', createdAt: new Date('2026-08-01') };
    const inv = ops.resolveOp('announcement.delete').invert({ action: 'delete', applied: { removed: doc } });
    assert.strictEqual(inv.type, 'announcement.post');
    assert.deepStrictEqual(inv.payload.createdAt, doc.createdAt,
        'restoring must not silently re-date the announcement to now');
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 3: Run it to verify it fails, implement, run again**

Run: `node scripts/announcementOps.test.js` Expected: FAIL on the schema check first, then three ✓ once `startsAt` and the three ops exist.

- [ ] **Step 4: Update the privacy policy if — and only if — the inventory changes**

`Announcement.createdBy` is already inventoried. `startsAt` is a timestamp, not per-user data, so **no policy change is needed** — but state that conclusion in the commit body rather than leaving it unexamined, because `privacy-model-coverage` will not flag a field it considers non-identifying and the next reader should see it was checked.

- [ ] **Step 5: Snapshot, refactor `handlers/manage/announcements.js`, click-test**

Including the per-row `mng_announce_edit` / `mng_announce_delete` buttons, which `utils/manageActions.js` deliberately does **not** carry (their ids embed a Mongo `_id` that `parseMngId`'s group/action split cannot represent). They still need ops behind them.

- [ ] **Step 6: Commit**

```bash
git add core/ops/announcements.js core/ops/index.js models/Announcement.js handlers/manage/announcements.js scripts/ package.json
git commit -m "feat(core): move announcement mutations onto the core and add scheduling"
```

---

### Task 7: Retire `registerUndo` and close the conservation loop

**Files:**
- Modify: `handlers/manage/shared.js` · `handlers/manage/index.js` · `core/revert.js` · `scripts/coreOps.test.js`
- Test: `scripts/undoRetired.test.js`

**Interfaces:**
- Consumes: everything above
- Produces: nothing new. The deliverable is a **deletion** and a check that makes regression impossible.

- [ ] **Step 1: Write the failing test**

```js
// scripts/undoRetired.test.js
// Two properties, and the second is the one that matters long-term: every mutating /manage action
// must resolve to an op, so a NEW action cannot be added without core behaviour behind it.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ACTIONS_BY_PAGE } = require('../utils/manageActions');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('registerUndo is gone from the entire handler tree', () => {
    const dir = path.join(__dirname, '..', 'handlers', 'manage');
    const hits = fs.readdirSync(dir)
        .filter(f => f.endsWith('.js'))
        .filter(f => fs.readFileSync(path.join(dir, f), 'utf8').includes('registerUndo'));
    assert.deepStrictEqual(hits, [], `registerUndo still used in: ${hits.join(', ')}`);
});

check('EVERY mutating action on EVERY page resolves to an op', () => {
    const readOnly = new Set(['formatguide', 'exportnew', 'exportreturning', 'export',
                              'exportall', 'exportupto5', 'exportcategory']);
    const missing = [];
    for (const [page, list] of Object.entries(ACTIONS_BY_PAGE)) {
        for (const a of list) {
            if (readOnly.has(a.id)) continue;
            if (!ops.opTypeForAction(page, a.id)) missing.push(`${page}:${a.id}`);
        }
    }
    assert.deepStrictEqual(missing, [], `actions with no op behind them: ${missing.join(', ')}`);
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/undoRetired.test.js` Expected: FAIL on both until every handler is converted.

- [ ] **Step 3: Delete the undo store**

Remove `registerUndo`, `undoButtonRow` and the undo `Map` from `handlers/manage/shared.js`, and the `mng_undo_` branch from `handlers/manage/index.js` (line ~126). **Leave a breadcrumb comment** where the branch was, naming `core/revert.js` as its replacement — the same convention `index.js` already uses for its removed PHASE blocks.

- [ ] **Step 4: Open `ON_CORE` to everything**

In `core/revert.js`, replace the `ON_CORE` set with a constant `true` and delete the two-reason branch added in plan 1 Task 7 — with every entity converted, "not yet supported" can no longer be true, and leaving dead branches teaches the next reader that some entity is still unmigrated.

- [ ] **Step 5: Run everything**

Run: `node scripts/undoRetired.test.js && npm test` Expected: both new checks pass and the full suite is green.

- [ ] **Step 6: Click-test the whole surface on the dev bot**

Every page, every mutating action, then a revert of each from `/bot analytics` → Changes. **Then restart the dev bot and revert something else** — the property this entire plan exists for.

- [ ] **Step 7: Commit**

```bash
git add handlers/manage/shared.js handlers/manage/index.js core/revert.js scripts/ package.json
git commit -m "refactor(manage): retire the in-memory undo store"
```

---

## Self-review

**Spec coverage.** Every entity named in spec §8.2 has a task. The `Announcement.startsAt` gap filed in `db-deferred-list.md` closes in Task 6. The `registerUndo` retirement that plan 1's P8 identified closes in Task 7.

**Deliberately not covered:** anything under `portal/` — that is plan 3.

**Placeholder scan.** Tasks 4 and 5 describe their implementations in prose rather than full code, and that is a deliberate, stated exception: both follow shapes given in full in Tasks 2 and 3, and their *tests* — which are what pin behaviour — are written out completely. Every trap specific to those entities is named. No "similar to Task N" without saying what is similar and what is not.

**Type consistency.** `apply()` returns `{ ok, change, applied }` and `invert(change)` reads `change.applied` in all thirty-one ops across both plans. `updateElement`/`updateDocument` both return `{ ok }` or `{ ok: false, reason }`.

## Audit log

**Q1 — the first draft used `core/mongo/positional.js` for loadouts and announcements.** They are separate documents, not array elements, so a positional update would have matched nothing and returned `{ ok: false, reason: 'missing' }` — **indistinguishable from a legitimate outcome**, which is how a whole entity's writes fail silently. Task 1 now exists solely to give them the right tool, and both files carry a comment saying why they are not interchangeable.

**Q2 — `buildVersionedFilter` would have rejected version 0.** The obvious guard is `if (!expectVersion) throw`, and a freshly created Mongoose document has `__v === 0`. That would have made every brand-new record permanently unwritable through the core, and only on records nobody had edited yet — the kind of bug that ships. The guard tests for `undefined`/`null`, and a test pins the `0` case specifically.

**Q3 — `loadout.bulkReplace` with no `mode` would have wiped both MP and DMZ.** The op scopes its delete by `mode`, and a missing mode makes that filter `{ mode: undefined }`, which Mongo treats as matching nothing — or, worse, an unscoped delete if the filter is built by spreading. `validate()` now refuses outright, with the consequence spelled out in the error, and a test asserts the refusal.

**Q4 — `season.promoteDraft`'s inverse was going to be a diff.** A rotation moves several top-level fields and two whole arrays at once; a field-level diff of that is not a restore. The inverse is a full pre-rotation snapshot, applied by a fifth op (`season.restoreSnapshot`) that is deliberately *not* reachable from `/manage` — which then needed an explicit, reasoned exemption in the conservation test rather than weakening it for everything.

**Q5 — patch notes would have orphaned every cached image.** `models/SeasonalData.js` states that cached patch-note images are keyed on the subdocument's own `_id` with season-based retention. An op that replaced an entry rather than editing in place would mint a new `_id` and strand its images with nothing pointing at them and no age-based cleanup to catch it. Every op in Task 4 edits in place or appends, and the test pins `elementId` stability with that reason in the assertion message.

**Q6 — Task 7's "delete registerUndo" was, on its own, a regression waiting to happen.** Deleting it proves nothing about whether every action gained an op. The conservation check that *every mutating action on every page* resolves is what makes the deletion safe, and it also means a future action added with no core behind it fails the suite instead of silently having no undo.

**Not found:** no defect in the four-verb contract under five more entities, and no case where element-identity and document-identity concurrency were genuinely ambiguous once the question was asked.
