---
kind: plan
status: frozen
---

# Portal core — operation algebra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ⚠️ **`status: frozen` and the checkbox syntax below are not in conflict, though they read that way.** `doc-frontmatter` allows a `kind: plan` only `frozen` or `superseded`, and `frozen` here governs the plan's **design content** — its tasks, code and reasoning are a dated snapshot and must not be quietly rewritten. The `- [ ]` boxes are the *executing* session's progress marks. **Tick boxes; do not revise tasks.** If a task turns out to be wrong, that is a finding to raise and a new dated plan, not an edit.

**Goal:** Extract every `/manage` draws mutation into a shared, transactional operation algebra that both Discord and the future web portal call, and give the system durable cross-surface undo — with `/manage`'s Discord behaviour provably unchanged.

**Architecture:** Mutations become values (`{ type, target, payload }`) with four verbs over them — `validate` (pure), `preview` (pure), `apply` (transactional, always audits), `invert` (pure). `handlers/manage/draws.js` keeps every modal, container and custom_id and loses only its mutation bodies. Concurrency is element-identity, never whole-document `.save()`, because `SeasonalData` is one global document whose arrays would otherwise produce constant false conflicts.

**Tech Stack:** Node 24 (CommonJS), Mongoose 9, plain `node scripts/*.test.js` test files following `scripts/manageActions.test.js`'s `check(name, fn)` pattern. No test framework — Vitest is deferred repo-wide.

**Spec:** `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md`

## Scope, and the two plans this is NOT

The spec covers three independent subsystems. Executing them as one plan would produce something no reviewer could gate. This plan is subsystem one, and it **ships value with no portal in existence**: `/manage` gains durable undo that survives a restart, and every draws mutation becomes transactional.

| Plan | Subsystem | Depends on |
|---|---|---|
| **This one** | The core algebra, proven end-to-end on draws | nothing |
| **Plan 2** — `docs/superpowers/plans/2026-08-20-portal-core-remaining-entities.md` | The remaining entities (calendar · loadouts · patchnotes · season · announcements), then `registerUndo` retires | this plan's proven pattern |
| **Plan 3** — `docs/superpowers/plans/2026-08-20-portal-server-and-realms.md` | `portal/` — the server, Discord OAuth, sessions, and the five realms | plans 1 and 2 |

**Draws is the chosen vertical slice** because it is the only entity carrying all three tiers (single add/edit/delete, bulk add/replace/delete, and three separate purge scopes), so proving the pattern there proves it everywhere.

## Global Constraints

- **Never call `.save()` on a whole `SeasonalData` document.** It is one global doc (`docType: 'global'`); a stale in-memory copy writes the whole array back and silently reverts a concurrent edit. Use targeted positional updates asserting the prior value.
- **Every schema field must be declared in `models/` in the same change as the code that sets it.** Mongoose accepts an undeclared field in memory and drops it on the next fetch.
- **`apply()` is the only thing that writes, and it always records a `ChangeLog` row.** The caller cannot opt out.
- **The op vocabulary is derived from `utils/manageActions.js`, never declared separately.** A conservation test enforces it in both directions.
- **`/manage`'s Discord output must not change.** Every modal, container, custom_id, label and ephemeral flag stays byte-identical.
- Test files: `scripts/<name>.test.js`, wired into `package.json`'s `test` script in the same task that creates them.
- Commit subjects: Conventional Commits — `<type>(<scope>): <description>`, lowercase, imperative, no trailing period. Both co-author trailers on every commit.
- Branch off `v3-pre-release`, PR into `v3-pre-release` (`gh pr create --base v3-pre-release`). Never `main`.

## File Structure

| Path | Responsibility |
|---|---|
| `core/ops/index.js` | The op contract, the registry bridge, and `resolveOp()`. Knows nothing about any entity. |
| `core/ops/draws.js` | The seven draw op types and their four verbs. Only file that knows a draw's shape. |
| `core/mongo/positional.js` | Element-identity update + conflict detection. The only place an array element is written. |
| `core/changeset.js` | Compose N ops, preview them together, commit in one transaction. |
| `core/revert.js` | Turn a `ChangeLog` row's stored inverse back into an op and apply it. |
| `models/ChangeLog.js` | **Modify** — gains `inverse`. |
| `utils/changeStore.js` | **Modify** — records and reads `inverse`. |
| `handlers/manage/draws.js` | **Modify** — mutation bodies replaced by core calls. Everything Discord-facing untouched. |

---

### Task 0: Verify the five premises before building on them

**Files:**
- Create: `scripts/portalPremises.test.js`
- Create: `local/portal-premise-findings.md`

**Interfaces:**
- Consumes: nothing
- Produces: a written go/no-go. **Premise 1 failing invalidates Task 5 and the spec's tier-2 model.**

- [ ] **Step 1: Write the transaction probe**

```js
// scripts/portalPremises.test.js
// Premise checks from docs/superpowers/specs/2026-08-20-web-admin-portal-design.md §12.
// Run against the DEV database only: node --env-file=.env.dev scripts/portalPremises.test.js
const assert = require('assert');
const mongoose = require('mongoose');

async function premise1_transactions() {
    const uri = process.env.MONGODB_URI;
    assert.ok(/dev/.test(uri), 'refusing to run against a non-dev database');
    await mongoose.connect(uri);
    const Probe = mongoose.model('Probe', new mongoose.Schema({ k: String, v: Number }));
    await Probe.deleteMany({ k: /^probe-/ });

    const session = await mongoose.startSession();
    let rolledBack = false;
    try {
        await session.withTransaction(async () => {
            await Probe.create([{ k: 'probe-a', v: 1 }], { session });
            await Probe.create([{ k: 'probe-b', v: 2 }], { session });
            throw new Error('deliberate rollback');
        });
    } catch (e) {
        rolledBack = e.message === 'deliberate rollback';
    }
    const afterRollback = await Probe.countDocuments({ k: /^probe-/ });
    assert.strictEqual(afterRollback, 0, `rollback left ${afterRollback} docs — transactions are NOT atomic here`);

    await session.withTransaction(async () => {
        await Probe.create([{ k: 'probe-a', v: 1 }], { session });
        await Probe.create([{ k: 'probe-b', v: 2 }], { session });
    });
    const afterCommit = await Probe.countDocuments({ k: /^probe-/ });
    assert.strictEqual(afterCommit, 2, 'commit did not persist both documents');

    await Probe.deleteMany({ k: /^probe-/ });
    await session.endSession();
    return { rolledBack, afterCommit };
}
```

- [ ] **Step 2: Write the subdocument-identity probe**

```js
async function premise4_elementIdentity() {
    const SeasonalData = require('../models/SeasonalData');
    const doc = await SeasonalData.findOne({ docType: 'global' });
    assert.ok(doc, 'no global SeasonalData document in the dev database');
    assert.ok(doc.newDraws.length > 0, 'seed at least one draw in dev before running this');

    const target = doc.newDraws[0];
    const idBefore = String(target._id);
    const titleBefore = target.title;

    // The positional update the whole concurrency model depends on.
    const ok = await SeasonalData.updateOne(
        { docType: 'global', 'newDraws._id': target._id, 'newDraws.title': titleBefore },
        { $set: { 'newDraws.$.title': titleBefore + ' (probe)' } }
    );
    assert.strictEqual(ok.modifiedCount, 1, 'positional update did not match');

    const stale = await SeasonalData.updateOne(
        { docType: 'global', 'newDraws._id': target._id, 'newDraws.title': titleBefore },
        { $set: { 'newDraws.$.title': 'should not happen' } }
    );
    assert.strictEqual(stale.modifiedCount, 0, 'a STALE prior-value assertion still wrote — conflict detection is broken');

    const after = await SeasonalData.findOne({ docType: 'global' }).lean();
    const same = after.newDraws.find(d => String(d._id) === idBefore);
    assert.ok(same, '_id did not survive the positional update');

    await SeasonalData.updateOne(
        { docType: 'global', 'newDraws._id': target._id },
        { $set: { 'newDraws.$.title': titleBefore } }
    );
    return { idStable: true, staleRejected: true };
}
```

- [ ] **Step 3: Write the render-import probe**

```js
function premise5_renderImports() {
    // The spec claims buildLoadoutCard() is importable with no discord.js and no client.
    const before = Object.keys(require.cache).length;
    const { buildLoadoutCard } = require('../utils/loadoutRender');
    assert.strictEqual(typeof buildLoadoutCard, 'function', 'buildLoadoutCard is not exported');
    assert.ok(!Object.keys(require.cache).some(p => p.includes('node_modules/discord.js')),
        'requiring loadoutRender pulled in discord.js');
    // The REAL risk: emojiMap values are rewritten at bot boot by refreshEmojiIds(client).
    // With no client they are pre-sync PRODUCTION ids. Record what they actually are.
    const emojis = require('../utils/emojiMap');
    const sample = Object.entries(emojis).slice(0, 3);
    console.log('    emoji ids WITHOUT a client (what the portal would render):', JSON.stringify(sample));
    return { importedClean: true, requireDelta: Object.keys(require.cache).length - before };
}
```

- [ ] **Step 3b: Make the local database capable of the thing you are about to test**

⚠️ **MEASURED 2026-08-20 18:15 EDT: the local MongoDB is a STANDALONE** (`db.hello().setName` is `null`, version 8.3.7). **Transactions require a replica set**, so running Step 4 against `.env.dev` as-is fails for a reason that has nothing to do with Atlas — and reading that failure as "M0 does not support transactions" would reopen the spec for nothing. **This probe as originally written would have produced a confident, wrong answer.**

```bash
mongod --dbpath /usr/local/var/mongodb --replSet rs0   # or add `replication.replSetName: rs0` to mongod.conf
mongosh --eval 'rs.initiate()'
mongosh --quiet --eval 'db.hello().setName'            # must now print rs0, not null
```

**If you will not change the local instance, run the probe against a throwaway database on the Atlas cluster instead** — the design question is about Atlas, not about localhost. Either way, **the findings note must state which database the probe ran against**, or the result answers a question nobody asked.

- [ ] **Step 4: Run it and read every result**

Run `mongosh --quiet --eval 'db.hello().setName'` first — **if it prints `null`, stop and do Step 3b.** Then: `node --env-file=.env.dev scripts/portalPremises.test.js` Expected: all three report PASS. **If premise 1 fails against a CONFIRMED replica set, STOP and re-open the spec** — tier 2 needs a different commit strategy and Task 5 as written is invalid.

- [ ] **Step 5: Measure the two premises a script cannot**

✅ **Both were measured 2026-08-20 18:20 EDT.** Re-run immediately before plan 3 Task 7 anyway — these move.

```bash
gcloud compute ssh diors-builds-bot --zone=us-east1-b --quiet --command='free -m | head -2; systemctl show diors-bot -p MemoryCurrent; which cloudflared || echo cloudflared:NOT-INSTALLED'
```

**Measured:** 969 MB total · 579 MB used · **390 MB available** · `diors-bot` at **131 MB** · `cloudflared` **NOT INSTALLED** · disk 24 GB free of 30. Two things follow. The bot has grown ~17% since the 112 MB in `docs/reference/deployment-and-ops.md`, so **that figure is stale and gets re-dated in this task**. And 390 MB against plan 3's 250 MB stop-threshold is a real but not generous margin — a 125 MB portal leaves ~265 MB.

- [ ] **Step 6: Write the findings down**

Record every result in `local/portal-premise-findings.md` with the date and the exact command. A premise that was checked and forgotten is a premise that gets re-assumed. State the go/no-go explicitly.

- [ ] **Step 7: Commit**

```bash
git add scripts/portalPremises.test.js
git commit -m "test(portal): probe the five premises the portal design rests on"
```

---

### Task 0b: Extract `ALLOWED_ADMIN_ID` out of `commands/manage.js`

**Files:**
- Create: `utils/owner.js`
- Modify: `utils/adminAccess.js` · `commands/manage.js` · `scripts/botAccessPermissions.test.js`
- **NOT** `handlers/router.js` — verified 2026-08-20: it never requires `commands/manage`. Its only `ALLOWED_ADMIN_ID` occurrences are prose comments at lines 147 and 161, and its real owner check is `require('../utils/adminAccess')` at line 280, which this task fixes from the other end.
- Modify: `docs/legal/PRIVACY.md`
- Test: `scripts/ownerModule.test.js`

**Interfaces:**
- Consumes: nothing — `utils/owner.js` must import nothing at all
- Produces: `ALLOWED_ADMIN_ID` (string) · `isOwnerId(id)` → boolean

**Why this is a prerequisite and not cleanup:** measured 2026-08-20, `utils/adminAccess.js` has a transitive require closure of **39 local files plus `discord.js`, `jimp` and `child_process`**, entirely because `isOwner()` reaches for `require('../commands/manage')`. The portal must resolve permissions on every request; doing that today would load discord.js and an image library into a process with no Discord client. **The spec's whole "reuse the core" argument fails without this.**

- [ ] **Step 1: Write the failing test**

```js
// scripts/ownerModule.test.js
// The property under test is the CLOSURE, not the value. utils/owner.js exists so that requiring
// the permission layer does not drag in the command surface.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function closure(entry) {
    const stack = [path.resolve(__dirname, '..', entry)];
    const local = new Set(); const ext = new Set();
    while (stack.length) {
        const f = stack.pop();
        if (local.has(f)) continue;
        local.add(f);
        let src; try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
        for (const m of src.matchAll(/require\(['"]([^'"]+)['"]\)/g)) {
            const r = m[1];
            if (!r.startsWith('.')) { ext.add(r); continue; }
            let q = path.resolve(path.dirname(f), r);
            if (!q.endsWith('.js')) q += '.js';
            if (fs.existsSync(q)) stack.push(q);
        }
    }
    return { local, ext };
}

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  \u2713 ${name}`); }
    catch (e) { failures++; console.error(`  \u2717 ${name}\n      ${e.message}`); }
}

check('utils/owner.js imports nothing', () => {
    const c = closure('utils/owner.js');
    assert.strictEqual(c.local.size, 1, `owner.js pulled ${c.local.size} local files; it must be a leaf`);
    assert.strictEqual(c.ext.size, 0, `owner.js pulled npm modules: ${[...c.ext].join(',')}`);
});

check('utils/adminAccess.js never reaches a command module or discord.js', () => {
    const c = closure('utils/adminAccess.js');
    const bad = [...c.local].filter(f => f.includes('/commands/'));
    assert.deepStrictEqual(bad, [], `adminAccess reaches command modules: ${bad.join(', ')}`);
    for (const heavy of ['discord.js', 'jimp', 'child_process']) {
        assert.ok(!c.ext.has(heavy), `adminAccess still pulls ${heavy} — the portal cannot require it`);
    }
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/ownerModule.test.js` Expected: both FAIL — owner.js does not exist, and adminAccess reaches `commands/manage.js`.

- [ ] **Step 3: Create the leaf module**

```js
// utils/owner.js
//
// The hardcoded ultimate owner, and NOTHING else. This file must never import anything.
//
// \u26a0\ufe0f WHY IT IS ITS OWN FILE. This constant used to live in commands/manage.js, which meant
// utils/adminAccess.js -- the permission layer every admin surface calls -- transitively pulled in
// 39 files including discord.js, jimp and child_process just to answer "is this the owner". That is
// invisible inside the bot, where all of it is loaded anyway, and fatal for any process that is NOT
// the bot. scripts/ownerModule.test.js asserts the closure stays empty.
const ALLOWED_ADMIN_ID = '1139845545754632283';

const isOwnerId = (id) => id === ALLOWED_ADMIN_ID;

module.exports = { ALLOWED_ADMIN_ID, isOwnerId };
```

- [ ] **Step 4: Repoint every reader**

`utils/adminAccess.js` — replace the lazy `require('../commands/manage')` inside `isOwner()` with a top-level `const { isOwnerId } = require('./owner');` and call it directly. `scripts/botAccessPermissions.test.js` — import from `utils/owner` instead of `commands/manage`. **Leave `handlers/router.js` alone** — it consumes `isOwner` from `adminAccess` and is fixed transitively. `commands/manage.js` — re-export it (`const { ALLOWED_ADMIN_ID } = require('../utils/owner');`) so nothing outside this task's file list breaks, and leave a one-line comment saying where it moved and why.

- [ ] **Step 5: Update the published privacy policy in the same change**

`docs/legal/PRIVACY.md`'s verification table asserts *"`ALLOWED_ADMIN_ID` guards in `commands/manage.js`, `commands/autobuild.js`, and the central interaction router."* That sentence becomes false the moment Step 4 lands. Repoint it at `utils/owner.js`. **This is a published document** — `dior legal build` must be re-run and `public/` committed, per the site rules.

- [ ] **Step 6: Run the full suite**

Run: `node scripts/ownerModule.test.js && npm test` Expected: the two new checks pass and all **42** existing test files still pass (41 under `scripts/` plus `utils/discordCdnAssetIndex.test.js`, counted from `package.json` — not the 28 an earlier draft asserted). `scripts/botAccessPermissions.test.js` is the one most likely to break — it imported the constant from the old location.

- [ ] **Step 7: Commit**

```bash
git add utils/owner.js utils/adminAccess.js handlers/router.js commands/manage.js \
        scripts/ownerModule.test.js scripts/botAccessPermissions.test.js \
        docs/legal/PRIVACY.md public/ package.json
git commit -m "refactor(admin): move ALLOWED_ADMIN_ID to a leaf module"
```

---

### Task 1: The op contract and its registry bridge

**Files:**
- Create: `core/ops/index.js`
- Test: `scripts/coreOps.test.js`
- Modify: `package.json` (add the test to the `test` script)

**Interfaces:**
- Consumes: `utils/manageActions.js`'s `ACTIONS_BY_PAGE`, `resolveAction`
- Produces: `registerEntity(name, opTypes)` · `resolveOp(type)` → `{ validate, preview, apply, invert }` · `listOpTypes()` → `string[]` · `opTypeForAction(page, actionId)` → `string | null`

- [ ] **Step 1: Write the failing conservation test**

```js
// scripts/coreOps.test.js
const assert = require('assert');
const { ACTIONS_BY_PAGE } = require('../utils/manageActions');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('every registered op type resolves to all four verbs', () => {
    for (const type of ops.listOpTypes()) {
        const impl = ops.resolveOp(type);
        for (const verb of ['validate', 'preview', 'apply', 'invert']) {
            assert.strictEqual(typeof impl[verb], 'function', `${type} is missing ${verb}()`);
        }
    }
});

check('every mutating draws action maps to an op type', () => {
    const nonMutating = new Set(['formatguide', 'exportnew', 'exportreturning']);
    for (const a of ACTIONS_BY_PAGE.draws) {
        if (nonMutating.has(a.id)) continue;
        assert.ok(ops.opTypeForAction('draws', a.id),
            `draws:${a.id} has no op type — a button with no core behind it`);
    }
});

check('every draws op type maps back to a registry action', () => {
    for (const type of ops.listOpTypes().filter(t => t.startsWith('draw.'))) {
        assert.ok(ops.actionForOpType(type),
            `${type} maps to no registry action — dead core code`);
    }
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/coreOps.test.js` Expected: FAIL with `Cannot find module '../core/ops'`

- [ ] **Step 3: Write the minimal implementation**

```js
// core/ops/index.js
//
// THE OP CONTRACT. Every mutation in this system is a value — { type, target, payload } — and
// this module is the only thing that knows how a type maps to behaviour. Entities register here;
// nothing else may.
//
// ⚠️ The op vocabulary is DERIVED from utils/manageActions.js, never declared beside it. That
// registry exists because two hand-synced copies of the action list was judged unacceptable, and
// a third copy here would recreate that bug across two runtimes. scripts/coreOps.test.js asserts
// conservation in both directions.
const REGISTRY = new Map();          // opType -> { validate, preview, apply, invert }
const ACTION_TO_OP = new Map();      // "page:actionId" -> opType
const OP_TO_ACTION = new Map();      // opType -> "page:actionId"

function registerEntity(entity, opTypes) {
    for (const [type, impl] of Object.entries(opTypes)) {
        if (REGISTRY.has(type)) throw new Error(`duplicate op type "${type}"`);
        for (const verb of ['validate', 'preview', 'apply', 'invert']) {
            if (typeof impl[verb] !== 'function') throw new Error(`${type} is missing ${verb}()`);
        }
        REGISTRY.set(type, impl);
        // 🔴 `action` is a STRING OR AN ARRAY, because the mapping is genuinely many-to-one. Draws alone has TEN mutating actions and seven op types: `addnew`/`addreturning` are one op differing by payload, and `purgenew`/`purgereturning`/`purgeall` are one op differing by scope. A 1:1 Map cannot express that, and scripts/coreOps.test.js's conservation check could never pass over one.
        const actions = impl.action ? (Array.isArray(impl.action) ? impl.action : [impl.action]) : [];
        for (const a of actions) {
            if (ACTION_TO_OP.has(a)) throw new Error(`action "${a}" is already claimed by op "${ACTION_TO_OP.get(a)}"`);
            ACTION_TO_OP.set(a, type);
        }
        if (actions.length) OP_TO_ACTION.set(type, actions);
    }
}

function resolveOp(type) {
    const impl = REGISTRY.get(type);
    if (!impl) throw new Error(`unknown op type "${type}"`);
    return impl;
}

const listOpTypes = () => [...REGISTRY.keys()];
const opTypeForAction = (page, actionId) => ACTION_TO_OP.get(`${page}:${actionId}`) || null;
const actionForOpType = (type) => OP_TO_ACTION.get(type) || null;   // an ARRAY of `page:id` keys, or null

// 🔴 ORDER IS LOAD-BEARING AND THIS IS NOT STYLE. `module.exports` is assigned FIRST, then the entities are required. Entities do `const { registerEntity } = require('./index')`, so if that require sits ABOVE this assignment, `module.exports` is still the default `{}` at that moment and `registerEntity` is `undefined` — a hard TypeError on load, before a single test runs. An earlier draft of this plan had exactly that shape and would have failed on the first `require`.
module.exports = { registerEntity, resolveOp, listOpTypes, opTypeForAction, actionForOpType };

// AFTER the export, never before. Entities self-register as a side effect of being required.
require('./draws');
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/coreOps.test.js` Expected: **the first check passes and the two draws checks FAIL, so the file exits 1.** Correct at this point — those two checks are the *reason* Task 4 exists, and they pass there. ⚠️ An earlier draft said "three ✓, exit 0" AND "it will still fail" in one breath; the harness is `process.exit(failures ? 1 : 0)`, so only one can be true. **Do not wire this file into `npm test` until Task 4** — move Step 5's wiring there.

- [ ] **Step 5: Document the new top-level directory BEFORE committing it**

🔴 **`core/` is a new tracked top-level directory and `docs-audit`'s `top-level-dirs` is an ERROR check** — it asserts every tracked top-level directory is described in `CLAUDE.md` or `docs/README.md`, and `core/` appears in neither (verified 2026-08-20: 0 occurrences in both). **The commit below turns CI red on the next run** unless this lands with it. Add a row to `CLAUDE.md`'s 🧭 Runtime code layout table:

| Path | Holds | Notes |
|---|---|---|
| **`core/`** | The operation algebra — every DB mutation as a value, with `validate`/`preview`/`apply`/`invert` | Imports no discord.js and knows nothing about HTTP. Both `/manage` and the web portal drive it. Design: `docs/superpowers/specs/2026-08-20-web-admin-portal-design.md` |

⚠️ **`portal/` needs the same treatment in plan 3 Task 1**, for the same reason.

- [ ] **Step 6: Commit — but do NOT wire the test in yet**

Two of `coreOps.test.js`'s three checks legitimately fail until Task 4 (see Step 4), so appending it to `npm test` here would make the suite red for two tasks. Wire it in **Task 4 Step 5**, where it goes green.

```bash
git add core/ops/index.js scripts/coreOps.test.js CLAUDE.md
git commit -m "feat(core): add the operation contract and its registry bridge"
```

---

### Task 2: `ChangeLog.inverse` — durable, cross-surface undo

**Files:**
- Modify: `models/ChangeLog.js`
- Modify: `utils/changeStore.js`
- Test: `scripts/changeInverse.test.js`
- Modify: `docs/legal/PRIVACY.md` — **only if** the stored inverse can contain a Discord id (see Step 1)

**Interfaces:**
- Consumes: nothing
- Produces: `recordChange({ ..., inverse })` · `getChange(changeId)` → row including `inverse`

- [ ] **Step 1: Decide the privacy question before writing the field**

`ChangeLog.actorId` is already inventoried in `PRIVACY.md`. The new `inverse` field stores an **op payload**, and a payload for an admin-grant op would contain a third party's Discord id. Admin ops are **out of scope for this plan** (they live in plan 3), so no policy change is needed now — but write that reasoning into the schema comment, because the moment plan 3 adds `admin.grant`, the answer changes and the next reader must see why.

- [ ] **Step 2: Write the failing test**

```js
// scripts/changeInverse.test.js
const assert = require('assert');
const ChangeLog = require('../models/ChangeLog');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('the inverse field is declared on the schema', () => {
    const path = ChangeLog.schema.path('inverse');
    assert.ok(path, 'inverse is NOT declared — Mongoose will accept it in memory and drop it on the next fetch');
});

check('inverse defaults to null, not undefined', () => {
    const doc = new ChangeLog({ changeId: 'Test01-01' });
    assert.strictEqual(doc.inverse, null, 'a missing inverse must be null so "is this revertible" is answerable');
});

check('inverse survives a round trip through the schema', () => {
    const op = { type: 'draw.delete', target: { id: 'abc' }, payload: { title: 'Iron Wolf' } };
    const doc = new ChangeLog({ changeId: 'Test01-02', inverse: op });
    assert.deepStrictEqual(doc.toObject().inverse, op);
});

process.exit(failures ? 1 : 0);
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node scripts/changeInverse.test.js` Expected: FAIL — "inverse is NOT declared"

- [ ] **Step 4: Add the field**

```js
// models/ChangeLog.js — add inside the schema, after `undone`
    // The op that reverses this change, stored so revert works from EITHER surface and survives a
    // restart. handlers/manage/shared.js's registerUndo() holds a closure in a router-private Map:
    // it dies with the process and the web cannot see it. This does neither.
    //
    // ⚠️ PRIVACY: today every op payload here describes CONTENT (a draw, an event, a build), so the
    // only per-user field on this model is still `actorId`, already inventoried in PRIVACY.md §2.1b
    // and Appendix A. THAT CHANGES the moment an admin-grant op is stored, because its payload
    // carries a third party's Discord id — update the policy in the SAME change that adds one.
    inverse: { type: mongoose.Schema.Types.Mixed, default: null },
```

- [ ] **Step 5: Record and read it in the store — and fix three things about `recordChange` that break the core's contract**

🔴 **Read `utils/changeStore.js` before writing this.** Its current shape defeats three separate claims the spec makes, and passing `inverse` through is the *smallest* of the four changes needed. Verified 2026-08-20: `recordChange` is a `.catch()`-terminated async IIFE.

1. **It returns `undefined`.** A `.catch()`-terminated chain with no `return` resolves to `undefined`, so `commitSet`'s `row?.changeId` is *always* `undefined` — meaning `changeIds: [undefined]`, a `bot_revert_undefined` custom_id in Task 7, and a revert that can never find its row.
2. **It takes no `session`.** `ChangeLog.create()` and `nextDailyChangeId()`'s `AlertCounter.findOneAndUpdate` run **outside** any transaction they are called within, so a rolled-back changeset still leaves audit rows claiming changes that never happened — the exact inverse of hazard H6.
3. **Its own header says it is fire-and-forget and never throws**, which is correct and deliberate for a Discord handler where a logging failure must not break the admin action. That contract is right *there* and wrong *here*.

```js
// utils/changeStore.js — add an OPTIONAL transactional mode. The existing fire-and-forget behaviour
// is preserved exactly when no session is passed, so every current caller is unaffected.
async function recordChangeIn(session, fields) {
    const now = new Date();
    const changeId = await nextDailyChangeId(now, session);   // must accept + forward the session
    const [row] = await ChangeLog.create([{
        changeId, actorId: fields.actorId, page: fields.page, action: fields.action,
        model: fields.model, target: fields.target, summary: fields.summary, detail: fields.detail,
        inverse: fields.inverse ?? null, createdAt: now,
    }], { session });
    return row;                                    // ← RETURNS the row. This is what changeId needs.
}

// Unchanged for Discord callers: still fire-and-forget, still never throws, still returns nothing.
function recordChange(fields) { /* existing body + `inverse: fields.inverse ?? null` */ }

async function getChange(changeId) { return await ChangeLog.findOne({ changeId }).lean(); }
```
⚠️ `nextDailyChangeId` must gain an optional `session` too, or the atomic `$inc` on `AlertCounter` escapes the transaction and can mint an id for a change that gets rolled back.

// New export, so revert can fetch one row without loading a page of them. async function getChange(changeId) { return await ChangeLog.findOne({ changeId }).lean(); }
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `node scripts/changeInverse.test.js` Expected: three ✓, exit 0

- [ ] **Step 7: Commit**

```bash
git add models/ChangeLog.js utils/changeStore.js scripts/changeInverse.test.js package.json git commit -m "feat(core): persist a change's inverse so undo survives a restart"
```

---

### Task 3: Element-identity writes and conflict detection

**Files:**
- Create: `core/mongo/positional.js`
- Test: `scripts/positionalWrite.test.js`

**Interfaces:**
- Consumes: nothing
- Produces: `updateElement({ Model, docFilter, arrayPath, elementId, expect, set })` → `{ ok: true } | { ok: false, reason: 'conflict' | 'missing' }` · `removeElement(...)` · `appendElement(...)`

- [ ] **Step 1: Write the failing test**

```js
// scripts/positionalWrite.test.js // Pure query-shape tests — no DB. What is being asserted is that the FILTER carries a prior-value // assertion, because that assertion is the entire conflict-detection mechanism. A positional update // without it silently wins a race it should have lost. const assert = require('assert'); const { buildElementFilter, buildElementUpdate } = require('../core/mongo/positional');

let failures = 0; function check(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); } }

check('the filter pins the document, the element AND the expected prior values', () => { const f = buildElementFilter({ docFilter: { docType: 'global' }, arrayPath: 'newDraws', elementId: '65abc', expect: { title: 'Iron Wolf' } }); assert.strictEqual(f.docType, 'global'); assert.strictEqual(f['newDraws._id'], '65abc'); assert.strictEqual(f['newDraws.title'], 'Iron Wolf', 'no prior-value assertion — a stale write would succeed'); });

check('an empty expect is REJECTED, never silently allowed', () => { assert.throws(() => buildElementFilter({ docFilter: { docType: 'global' }, arrayPath: 'newDraws', elementId: '65abc', expect: {} }), /expect/, 'an unguarded positional write must be impossible to construct'); });

check('the update targets the matched element only', () => { const u = buildElementUpdate({ arrayPath: 'newDraws', set: { title: 'Nightfall' } }); assert.deepStrictEqual(u, { $set: { 'newDraws.$.title': 'Nightfall' } }); });

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/positionalWrite.test.js` Expected: FAIL with `Cannot find module '../core/mongo/positional'`

- [ ] **Step 3: Write the implementation**

```js
// core/mongo/positional.js // // ⚠️ WHY THIS FILE EXISTS. models/SeasonalData.js is ONE global document whose arrays hold // newDraws, returningDraws, calendar and patchNotes. So a draws edit and a calendar edit touch the // same document, and ordinary document-level optimistic locking (__v) would raise a conflict on // nearly every pair of UNRELATED concurrent edits — false conflicts that train you to click through // the warning, which is worse than no check. But skipping versioning is worse still: doc.save() on // a stale copy writes the whole array back and silently reverts the other edit. // // So conflicts are detected at ELEMENT identity: pin the subdocument by _id AND assert its prior // values in the same filter. A mismatch matches zero documents, which IS the conflict signal. // // 🔴 Nothing in core/ may call .save() on a SeasonalData document. This module is the only writer.

function buildElementFilter({ docFilter, arrayPath, elementId, expect }) { if (!expect || Object.keys(expect).length === 0) { throw new Error('buildElementFilter: `expect` may not be empty — an unguarded positional write can win a race it should lose'); } const filter = { ...docFilter, [`${arrayPath}._id`]: elementId }; for (const [k, v] of Object.entries(expect)) filter[`${arrayPath}.${k}`] = v; return filter; }

function buildElementUpdate({ arrayPath, set }) { const $set = {}; for (const [k, v] of Object.entries(set)) $set[`${arrayPath}.$.${k}`] = v; return { $set }; }

async function updateElement({ Model, docFilter, arrayPath, elementId, expect, set, session }) { const res = await Model.updateOne( buildElementFilter({ docFilter, arrayPath, elementId, expect }), buildElementUpdate({ arrayPath, set }), { session } ); if (res.matchedCount === 1) return { ok: true }; // Distinguish "someone changed it" from "it is gone" — the messages a human needs differ. const stillThere = await Model.countDocuments({ ...docFilter, [`${arrayPath}._id`]: elementId }, { session }); return { ok: false, reason: stillThere ? 'conflict' : 'missing' }; }

async function appendElement({ Model, docFilter, arrayPath, element, session }) { const res = await Model.updateOne(docFilter, { $push: { [arrayPath]: element } }, { session }); return res.matchedCount === 1 ? { ok: true } : { ok: false, reason: 'missing' }; }

async function removeElement({ Model, docFilter, arrayPath, elementId, session }) { const res = await Model.updateOne(docFilter, { $pull: { [arrayPath]: { _id: elementId } } }, { session }); return res.modifiedCount === 1 ? { ok: true } : { ok: false, reason: 'missing' }; }

module.exports = { buildElementFilter, buildElementUpdate, updateElement, appendElement, removeElement };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/positionalWrite.test.js` Expected: three ✓, exit 0

- [ ] **Step 5: Commit**

```bash
git add core/mongo/positional.js scripts/positionalWrite.test.js package.json git commit -m "feat(core): add element-identity writes with prior-value conflict detection"
```

---

### Task 4: `core/ops/draws.js` — the seven draw ops

**Files:**
- Create: `core/ops/draws.js`
- Test: `scripts/drawOps.test.js`

**Interfaces:**
- Consumes: `core/ops/index.js`'s `registerEntity`, `core/mongo/positional.js`, `utils/adminParser.js`'s `parseBulkDrawList`/`formatDrawsAsBulkText`/`parseAdminDate`
- Produces: op types `draw.add` · `draw.edit` · `draw.delete` · `draw.bulkAdd` · `draw.bulkReplace` · `draw.bulkDelete` · `draw.purge`, each with `{ validate, preview, apply, invert, action, tier }`

- [ ] **Step 1: Write the failing test for `validate` and `invert`**

```js
// scripts/drawOps.test.js // validate() and invert() are PURE — no DB, no network. apply() is covered by Task 7's integration test. const assert = require('assert'); const ops = require('../core/ops');

let failures = 0; function check(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); } }

check('draw.add rejects a draw with no title', () => { const r = ops.resolveOp('draw.add').validate({ type: 'draw.add', payload: { title: '', category: 'new' } }); assert.strictEqual(r.ok, false); assert.ok(r.errors.some(e => /title/i.test(e)), `expected a title error, got ${JSON.stringify(r.errors)}`); });

check('draw.add normalizes the title to title case', () => { const r = ops.resolveOp('draw.add').validate({ type: 'draw.add', payload: { title: 'iron wolf — legendary', category: 'new', items: [] } }); assert.strictEqual(r.ok, true, JSON.stringify(r.errors)); assert.strictEqual(r.normalized.payload.title, 'Iron Wolf — Legendary'); });

check('draw.add inverts to draw.delete naming the created element', () => { const inv = ops.resolveOp('draw.add').invert({ action: 'add', model: 'SeasonalData', applied: { category: 'new', elementId: '65abc', title: 'Iron Wolf' } }); assert.strictEqual(inv.type, 'draw.delete'); assert.strictEqual(inv.target.elementId, '65abc'); });

check('draw.bulkReplace inverts to a bulkReplace carrying the FULL prior set', () => { const prior = [{ title: 'A' }, { title: 'B' }, { title: 'C' }, { title: 'D' }]; const inv = ops.resolveOp('draw.bulkReplace').invert({ action: 'bulkReplace', applied: { category: 'new', replaced: prior, added: [{ title: 'Nightfall' }] } }); assert.strictEqual(inv.type, 'draw.bulkReplace'); assert.deepStrictEqual(inv.payload.draws, prior, 'the inverse of a replace must restore every element it destroyed, not just record the count'); });

check('every draw op declares a tier, and purge/bulkReplace are tier 3 and 2', () => { for (const t of ops.listOpTypes().filter(t => t.startsWith('draw.'))) { assert.ok([1, 2, 3].includes(ops.resolveOp(t).tier), `${t} has no tier`); } assert.strictEqual(ops.resolveOp('draw.purge').tier, 3); assert.strictEqual(ops.resolveOp('draw.bulkReplace').tier, 2); assert.strictEqual(ops.resolveOp('draw.add').tier, 1); });

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/drawOps.test.js` Expected: FAIL — `unknown op type "draw.add"`

- [ ] **Step 3: Implement the entity**

```js
// core/ops/draws.js // // The seven draw mutations, as ops. This is the ONLY file that knows a draw's shape. // // ⚠️ `tier` is derived from REVERSIBILITY, not from how scary the button looks (spec §5): //   1 — an exact inverse exists and is cheap to record //   2 — multi-element or destroys prior state; the inverse is a snapshot taken at apply() time //   3 — irreversible or system-altering; the caller must gate on an export before committing const mongoose = require('mongoose'); const { registerEntity } = require('./index'); const { updateElement, appendElement, removeElement } = require('../mongo/positional'); const { toTitleCase, parseBulkDrawList, parseAdminDate } = require('../../utils/adminParser'); const SeasonalData = require('../../models/SeasonalData');

const DOC = { docType: 'global' }; const pathFor = (category) => (category === 'returning' ? 'returningDraws' : 'newDraws');

// 🔴 AN ALREADY-PARSED PAYLOAD IS NOT RE-PARSED. `commitSet` runs `validateSet` before applying — including on an INVERSE produced by `invert()`, which carries structured `parsed` data and never the original `text`. A validator that unconditionally re-parses `payload.text || ''` would parse an empty string, overwrite `payload.parsed`, and silently restore NOTHING. That would have made undo a no-op for bulkDelete, purge and bulkReplace — this plan's headline deliverable. scripts/drawOps.test.js round-trips every inverse back through validate() for exactly this reason. const alreadyParsed = (op) => op.payload?.parsed && !op.payload?.text;

function validateOne(payload) { const errors = []; if (!payload?.title?.trim()) errors.push('A draw needs a title.'); if (!['new', 'returning'].includes(payload?.category)) errors.push('Category must be "new" or "returning".'); if (payload?.endDate && !parseAdminDate(payload.endDate)) errors.push(`Could not read the date "${payload.endDate}".`); if (errors.length) return { ok: false, errors }; return { ok: true, errors: [], normalized: { payload: { ...payload, title: toTitleCase(payload.title.trim()), items: payload.items || [] } } }; }

registerEntity('draws', { 'draw.add': { action: ['draws:addnew', 'draws:addreturning'],   // one op; `payload.category` is the difference tier: 1, validate: (op) => validateOne(op.payload), preview: (op, live) => ({ before: { count: live[pathFor(op.payload.category)].length }, after: { count: live[pathFor(op.payload.category)].length + 1, added: op.payload.title } }), apply: async (op, { session }) => { const path = pathFor(op.payload.category); const element = { ...op.payload }; // 🔴 THE _id IS MINTED HERE, not discovered by reading the array tail back. A tail read is wrong twice over: `session.withTransaction()` RETRIES its whole callback on a transient error, and `commitSet` runs N ops in one transaction, so an earlier op's $push moves the tail a later op would read. Every SeasonalData subdocument array has _id enabled, so the id can simply be generated and asserted. element._id = new mongoose.Types.ObjectId(); const res = await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path, element, session }); if (!res.ok) return res; const created = element; return { ok: true, change: { action: 'add', model: 'SeasonalData', target: op.payload.title, summary: `Added new draw "${op.payload.title}"` }, applied: { category: op.payload.category, elementId: String(created._id), title: op.payload.title } }; }, invert: (change) => ({ type: 'draw.delete', target: { category: change.applied.category, elementId: change.applied.elementId }, payload: { title: change.applied.title } }) },

    'draw.delete': {
        action: 'draws:delete', tier: 1,
        validate: (op) => op.target?.elementId
            ? { ok: true, errors: [], normalized: op }
            : { ok: false, errors: ['No draw was selected.'] },
        preview: (op, live) => {
            const path = pathFor(op.target.category);
            const gone = live[path].find(d => String(d._id) === op.target.elementId);
            return { before: { draw: gone }, after: { draw: null } };
        },
        apply: async (op, { session }) => {
            const path = pathFor(op.target.category);
            const before = await SeasonalData.findOne(DOC).select(path).lean().session(session);
            const gone = before[path].find(d => String(d._id) === op.target.elementId);
            if (!gone) return { ok: false, reason: 'missing' };
            const res = await removeElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path,
                                              elementId: op.target.elementId, session });
            if (!res.ok) return res;
            return {
                ok: true,
                change: { action: 'delete', model: 'SeasonalData', target: gone.title,
                          summary: `Deleted draw "${gone.title}"` },
                applied: { category: op.target.category, removed: gone }
            };
        },
        invert: (change) => ({
            type: 'draw.add',
            payload: { ...change.applied.removed, category: change.applied.category }
        })
    },

    'draw.edit': {
        action: 'draws:edit', tier: 1,
        validate: (op) => {
            if (!op.target?.elementId) return { ok: false, errors: ['No draw was selected.'] };
            return validateOne({ ...op.payload, category: op.target.category });
        },
        preview: (op, live) => {
            const path = pathFor(op.target.category);
            const cur = live[path].find(d => String(d._id) === op.target.elementId);
            return { before: cur, after: { ...cur, ...op.payload } };
        },
        apply: async (op, { session }) => {
            const path = pathFor(op.target.category);
            const before = await SeasonalData.findOne(DOC).select(path).lean().session(session);
            const cur = before[path].find(d => String(d._id) === op.target.elementId);
            if (!cur) return { ok: false, reason: 'missing' };
            // The prior-value assertion IS the conflict check — see core/mongo/positional.js.
            const expect = Object.fromEntries(Object.keys(op.payload).map(k => [k, cur[k]]));
            const res = await updateElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path,
                                              elementId: op.target.elementId, expect, set: op.payload, session });
            if (!res.ok) return res;
            return {
                ok: true,
                change: { action: 'edit', model: 'SeasonalData', target: cur.title,
                          summary: `Edited draw "${cur.title}"` },
                applied: { category: op.target.category, elementId: op.target.elementId, prior: expect }
            };
        },
        invert: (change) => ({
            type: 'draw.edit',
            target: { category: change.applied.category, elementId: change.applied.elementId },
            payload: change.applied.prior
        })
    },

    'draw.bulkAdd': {
        action: 'draws:bulkadd', tier: 2,
        validate: (op) => {
            if (alreadyParsed(op)) return { ok: true, errors: [], normalized: op };  // an inverse — do not re-parse
            const parsed = parseBulkDrawList(op.payload.text || '');
            if (!parsed || (!parsed.newDraws?.length && !parsed.returningDraws?.length)) {
                return { ok: false, errors: ['Nothing in that text parsed as a draw. Check the Bulk Format Guide.'] };
            }
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed } } };
        },
        preview: (op, live) => ({
            before: { new: live.newDraws.length, returning: live.returningDraws.length },
            after: {
                new: live.newDraws.length + (op.payload.parsed.newDraws?.length || 0),
                returning: live.returningDraws.length + (op.payload.parsed.returningDraws?.length || 0)
            }
        }),
        apply: async (op, { session }) => {
            const { newDraws = [], returningDraws = [] } = op.payload.parsed;
            const added = { newDraws: [], returningDraws: [] };
            for (const [path, list] of [['newDraws', newDraws], ['returningDraws', returningDraws]]) {
                for (const d of list) {
                    await appendElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path, element: d, session });
                }
                added[path] = list;
            }
            const total = newDraws.length + returningDraws.length;
            const fresh = await SeasonalData.findOne(DOC).lean().session(session);
            const ids = { newDraws: fresh.newDraws.slice(-newDraws.length).map(d => String(d._id)),
                          returningDraws: fresh.returningDraws.slice(-returningDraws.length).map(d => String(d._id)) };
            return {
                ok: true,
                change: { action: 'bulkAdd', model: 'SeasonalData', target: `${total} draws`,
                          summary: `Added ${total} draws in bulk` },
                applied: { ids }
            };
        },
        invert: (change) => ({
            type: 'draw.bulkDelete',
            target: { ids: change.applied.ids },
            payload: {}
        })
    },

    'draw.bulkReplace': {
        action: 'draws:bulkreplace', tier: 2,
        validate: (op) => {
            if (alreadyParsed(op)) return { ok: true, errors: [], normalized: op };  // an inverse — do not re-parse
            const parsed = parseBulkDrawList(op.payload.text || '');
            if (!parsed) return { ok: false, errors: ['Nothing in that text parsed as a draw.'] };
            return { ok: true, errors: [], normalized: { ...op, payload: { ...op.payload, parsed } } };
        },
        preview: (op, live) => ({
            before: { draws: live[pathFor(op.target.category)] },
            after: { draws: op.payload.parsed[pathFor(op.target.category)] || [] }
        }),
        apply: async (op, { session }) => {
            const path = pathFor(op.target.category);
            const before = await SeasonalData.findOne(DOC).select(path).lean().session(session);
            const replaced = before[path];                       // the full prior set — this IS the inverse
            const incoming = op.payload.parsed[path] || [];
            await SeasonalData.updateOne(DOC, { $set: { [path]: incoming } }, { session });
            return {
                ok: true,
                change: { action: 'bulkReplace', model: 'SeasonalData', target: `${path}`,
                          summary: `Replaced ${replaced.length} draws with ${incoming.length}` },
                applied: { category: op.target.category, replaced, added: incoming }
            };
        },
        invert: (change) => ({
            type: 'draw.bulkReplace',
            target: { category: change.applied.category },
            payload: { draws: change.applied.replaced, parsed: { [pathFor(change.applied.category)]: change.applied.replaced } }
        })
    },

    'draw.bulkDelete': {
        action: 'draws:bulkdelete', tier: 2,
        validate: (op) => (op.target?.ids || op.payload?.titles)
            ? { ok: true, errors: [], normalized: op }
            : { ok: false, errors: ['Nothing was selected to delete.'] },
        preview: (op, live) => ({ before: { count: live.newDraws.length + live.returningDraws.length },
                                  after: { removing: (op.target.ids?.newDraws?.length || 0) + (op.target.ids?.returningDraws?.length || 0) } }),
        apply: async (op, { session }) => {
            const removed = { newDraws: [], returningDraws: [] };
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            for (const path of ['newDraws', 'returningDraws']) {
                for (const id of op.target.ids?.[path] || []) {
                    const gone = before[path].find(d => String(d._id) === id);
                    if (gone) removed[path].push(gone);
                    await removeElement({ Model: SeasonalData, docFilter: DOC, arrayPath: path, elementId: id, session });
                }
            }
            const total = removed.newDraws.length + removed.returningDraws.length;
            return {
                ok: true,
                change: { action: 'bulkDelete', model: 'SeasonalData', target: `${total} draws`,
                          summary: `Deleted ${total} draws in bulk` },
                applied: { removed }
            };
        },
        invert: (change) => ({
            type: 'draw.bulkAdd',
            payload: { parsed: change.applied.removed }
        })
    },

    'draw.purge': {
        action: ['draws:purgeall', 'draws:purgenew', 'draws:purgereturning'],   // one op; `target.scope` is the difference
        tier: 3,
        validate: (op) => ['all', 'new', 'returning'].includes(op.target?.scope)
            ? { ok: true, errors: [], normalized: op }
            : { ok: false, errors: ['Purge scope must be all, new or returning.'] },
        preview: (op, live) => ({
            before: { new: live.newDraws.length, returning: live.returningDraws.length },
            after: {
                new: op.target.scope === 'returning' ? live.newDraws.length : 0,
                returning: op.target.scope === 'new' ? live.returningDraws.length : 0
            }
        }),
        apply: async (op, { session }) => {
            const before = await SeasonalData.findOne(DOC).lean().session(session);
            const $set = {};
            if (op.target.scope !== 'returning') $set.newDraws = [];
            if (op.target.scope !== 'new') $set.returningDraws = [];
            await SeasonalData.updateOne(DOC, { $set }, { session });
            return {
                ok: true,
                change: { action: 'purge', model: 'SeasonalData', target: `draws (${op.target.scope})`,
                          summary: `Purged draws — scope "${op.target.scope}"` },
                applied: { scope: op.target.scope, newDraws: before.newDraws, returningDraws: before.returningDraws }
            };
        },
        // 🔴 NOT `category: 'both'`. `pathFor()` maps anything that is not 'returning' to 'newDraws', so a 'both' inverse would restore new draws and SILENTLY DROP every returning draw. Reverting a scope:'all' purge is TWO ops, and `commitSet` applies them atomically — which is why `invert()` may return an array.
        invert: (change) => [
            { type: 'draw.bulkReplace', target: { category: 'new' },
              payload: { parsed: { newDraws: change.applied.newDraws } } },
            { type: 'draw.bulkReplace', target: { category: 'returning' },
              payload: { parsed: { returningDraws: change.applied.returningDraws } } }
        ]
    }
});
```

- [ ] **Step 4: Run both tests to verify they pass**

Run: `node scripts/drawOps.test.js && node scripts/coreOps.test.js` Expected: all ✓, exit 0. `coreOps.test.js`'s two draws-conservation checks now pass for the first time.

- [ ] **Step 5: Commit**

```bash
git add core/ops/draws.js scripts/drawOps.test.js package.json git commit -m "feat(core): implement the seven draw operations"
```

---

### Task 5: `core/changeset.js` — commit N ops atomically

**Files:**
- Create: `core/changeset.js`
- Test: `scripts/changeset.test.js`

**Interfaces:**
- Consumes: `core/ops/index.js`, `utils/changeStore.js`'s `recordChange`, Mongoose sessions
- Produces: `validateSet(ops)` · `previewSet(ops, live)` · `commitSet(ops, { actorId })` → `{ ok, changeIds[], failedAt }`

**⚠️ Gate:** do not start this task until Task 0 premise 1 reported PASS. If transactions are unavailable on M0, this task's design is invalid and the spec needs reopening.

- [ ] **Step 1: Write the failing test**

```js
// scripts/changeset.test.js // The property under test is ALL-OR-NOTHING. The bot reads fresh on every interaction, so a // half-applied set is served to real users within seconds — this is the highest-consequence // invariant in the whole core. const assert = require('assert'); const { validateSet } = require('../core/changeset');

let failures = 0; function check(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); } }

check('validateSet reports EVERY invalid op, not just the first', () => { const r = validateSet([ { type: 'draw.add', payload: { title: '', category: 'new' } }, { type: 'draw.add', payload: { title: 'Fine', category: 'nonsense' } } ]); assert.strictEqual(r.ok, false); assert.strictEqual(r.failures.length, 2, 'a set that stops at the first error makes you fix them one round trip at a time'); });

check('validateSet reports the INDEX of each failure', () => { const r = validateSet([ { type: 'draw.add', payload: { title: 'Fine', category: 'new', items: [] } }, { type: 'draw.add', payload: { title: '', category: 'new' } } ]); assert.strictEqual(r.failures[0].index, 1, 'without an index you cannot show the user WHICH row is wrong'); });

check('the highest tier in the set is reported, because it gates the commit', () => { const r = validateSet([ { type: 'draw.add', payload: { title: 'A', category: 'new', items: [] } }, { type: 'draw.purge', target: { scope: 'all' } } ]); assert.strictEqual(r.tier, 3, 'one tier-3 op makes the whole set tier 3'); });

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/changeset.test.js` Expected: FAIL with `Cannot find module '../core/changeset'`

- [ ] **Step 3: Write the implementation**

```js
// core/changeset.js // // A changeset is N ops that commit together or not at all. // // ⚠️ ALL-OR-NOTHING IS NOT A NICETY. The bot re-reads SeasonalData on every single interaction // (commands/draws.js, calendar.js, patchnotes.js all call findOne(...).lean() per interaction), so // a half-applied set is served to real users within seconds. That is why this uses a real Mongo // transaction and not a best-effort loop. const mongoose = require('mongoose'); const { resolveOp, actionForOpType } = require('./ops'); const { recordChangeIn } = require('../utils/changeStore');

// The registry key is `page:id`, so a change's page is already knowable from its op. Falls back to // the op's own namespace rather than a literal, so a not-yet-registered op still records truthfully. function pageForOp(type) { const actions = actionForOpType(type); return actions?.[0]?.split(':')[0] ?? type.split('.')[0]; }

function validateSet(ops) { const failures = []; const normalized = []; let tier = 1; ops.forEach((op, index) => { let impl; try { impl = resolveOp(op.type); } catch (e) { failures.push({ index, errors: [e.message] }); return; } tier = Math.max(tier, impl.tier); const r = impl.validate(op); if (!r.ok) failures.push({ index, errors: r.errors }); else normalized.push(r.normalized || op); }); return { ok: failures.length === 0, failures, normalized, tier }; }

function previewSet(ops, live) { return ops.map((op, index) => ({ index, ...resolveOp(op.type).preview(op, live) })); }

async function commitSet(ops, { actorId }) { const v = validateSet(ops); if (!v.ok) return { ok: false, failures: v.failures };

    const session = await mongoose.startSession();
    const changeIds = [];
    let failedAt = null;
    try {
        await session.withTransaction(async () => {
            // invert() may return an ARRAY, so an inverse changeset is flattened before it is applied.
            for (const [index, op] of v.normalized.flat().entries()) {
                const impl = resolveOp(op.type);
                const res = await impl.apply(op, { session, actorId });
                if (!res.ok) { failedAt = { index, reason: res.reason }; throw new Error(`op ${index} failed: ${res.reason}`); }
                // apply() is the ONLY writer and it ALWAYS audits — the caller cannot opt out.
                // 🔴 `page` is DERIVED FROM THE OP TYPE, never hardcoded. An earlier draft wrote
                // `page: 'draws'` here — which would have stamped every calendar, loadout, patchnote,
                // season and announcement row as `draws` the moment plan 2 lands, breaking
                // getRecentChanges({filterPage}) in /bot analytics AND core/revert.js's
                // ON_CORE.has(row.page) branch, which is the entire mechanism this design added.
                const row = await recordChangeIn(session, {
                    ...res.change, actorId, page: pageForOp(op.type),
                    inverse: impl.invert({ ...res.change, applied: res.applied })
                });
                changeIds.push(row.changeId);
            }
        });
    } catch (e) {
        return { ok: false, failedAt, error: e.message };
    } finally {
        await session.endSession();
    }
    return { ok: true, changeIds };
}

module.exports = { validateSet, previewSet, commitSet };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/changeset.test.js` Expected: three ✓, exit 0

- [ ] **Step 5: Commit**

```bash
git add core/changeset.js scripts/changeset.test.js package.json git commit -m "feat(core): commit a changeset atomically or not at all"
```

---

### Task 6: Refactor `handlers/manage/draws.js` onto the core

**Files:**
- Modify: `handlers/manage/draws.js`
- Test: `scripts/drawsHandlerSnapshot.test.js`

**Interfaces:**
- Consumes: `core/changeset.js`'s `commitSet`
- Produces: no new exports. **The deliverable is that nothing changes.**

**⚠️ This is the task most likely to break something a user sees, and the least likely to fail a test that does not exist yet.** Write the snapshot FIRST, against the current code, before touching anything.

- [ ] **Step 1: Capture a before-snapshot of the CURRENT Discord output**

```js
// scripts/drawsHandlerSnapshot.test.js // Written BEFORE the refactor, against the pre-refactor code, so it can prove the refactor changed // nothing a user sees. This is the technique from feedback_snapshot_before_unclickable_refactor: // when click-testing is impractical, a deepStrictEqual against a captured fixture is the substitute. const assert = require('assert'); const fs = require('fs'); const path = require('path'); const manageCommand = require('../commands/manage');

const FIXTURE = path.join(__dirname, 'fixtures', 'draws-modals.json');

function capture() { return { addNew: manageCommand.buildAddDrawModal('new').toJSON(), addReturning: manageCommand.buildAddDrawModal('returning').toJSON(), bulkAdd: manageCommand.buildBulkBothDrawsModal('add').toJSON(), bulkReplace: manageCommand.buildBulkBothDrawsModal('replace').toJSON(), bulkRemove: manageCommand.buildBulkRemoveDrawsModal('either').toJSON(), searchEdit: manageCommand.buildSearchModal('draws', 'edit').toJSON(), searchDelete: manageCommand.buildSearchModal('draws', 'delete').toJSON() }; }

if (process.argv.includes('--write')) { fs.mkdirSync(path.dirname(FIXTURE), { recursive: true }); fs.writeFileSync(FIXTURE, JSON.stringify(capture(), null, 2)); console.log('  · fixture written —', FIXTURE); process.exit(0); }

const expected = JSON.parse(fs.readFileSync(FIXTURE, 'utf8')); assert.deepStrictEqual(capture(), expected, 'a /manage draws modal changed shape — the refactor was supposed to be invisible'); console.log('  ✓ every draws modal is byte-identical to the pre-refactor fixture');
```

- [ ] **Step 2: Write the fixture from the UNMODIFIED code and commit it**

Run: `node scripts/drawsHandlerSnapshot.test.js --write && node scripts/drawsHandlerSnapshot.test.js` Expected: fixture written, then ✓. **Commit the fixture now, before any refactor**, or the baseline is worthless.

```bash
git add scripts/drawsHandlerSnapshot.test.js scripts/fixtures/draws-modals.json package.json git commit -m "test(manage): snapshot the draws modals before refactoring them"
```

- [ ] **Step 3: Replace one mutation body with a core call**

In `handlers/manage/draws.js`, find the add-draw modal-submit branch. Keep the modal parsing and the reply formatting exactly as they are; replace only the section that mutates `SeasonalData` and records the change:

```js
// BEFORE — mutation, audit and reply interleaved // const doc = await SeasonalData.findOne({ docType: 'global' }); // doc.newDraws.push({ title, endDate, items }); // await doc.save(); // await recordChange({ ... });

// AFTER — the handler builds an op and formats a reply; core does the rest. const { commitSet } = require('../../core/changeset'); const result = await commitSet( [{ type: 'draw.add', payload: { title, endDate, items, category } }], { actorId: interaction.user.id } ); if (!result.ok) { const why = result.failures?.[0]?.errors?.join(' ') || result.error; return await interaction.editReply({ content: `❌ ${why}` }); }
```

- [ ] **Step 4: Run the snapshot to verify nothing user-visible moved**

Run: `node scripts/drawsHandlerSnapshot.test.js` Expected: ✓ — identical to the fixture

- [ ] **Step 5: Test it live on the dev bot**

Run: `node --watch --env-file=.env.dev index.js`, then in Discord run `/manage section:draws`, click **Add New**, submit a real draw, and confirm: the modal looks unchanged, the draw appears in `/draw`, and a row appears in `/bot analytics` → Changes.

**This step is not optional.** A snapshot proves the modal's shape, not that the write reached Mongo.

- [ ] **Step 6: Repeat for the remaining six draw mutations**

Same pattern, one at a time, running the snapshot after each: `draws:edit`, `draws:delete`, `draws:bulkadd`, `draws:bulkreplace`, `draws:bulkdelete`, and the three purge scopes.

- [ ] **Step 7: Commit**

```bash
git add handlers/manage/draws.js git commit -m "refactor(manage): route draws mutations through the operation core"
```

---

### Task 7: Durable revert, end to end

**Files:**
- Create: `core/revert.js`
- Test: `scripts/revert.test.js`
- Modify: `handlers/bot.js` — add a Revert control to the Changes page

**Interfaces:**
- Consumes: `utils/changeStore.js`'s `getChange`/`markUndone`, `core/changeset.js`'s `commitSet`
- Produces: `revertChange(changeId, { actorId })` → `{ ok, changeId }`

- [ ] **Step 1: Write the failing test**

```js
// scripts/revert.test.js const assert = require('assert'); const { canRevert } = require('../core/revert');

let failures = 0; function check(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); } }

check('a row from BEFORE the core existed says so', () => { const r = canRevert({ changeId: 'Aug20-01', inverse: null, undone: false, page: 'draws' }); assert.strictEqual(r.ok, false); assert.match(r.reason, /predates/i, 'the message must explain WHY, since every pre-Task-2 row is in this state'); });

check('a row from an entity NOT YET on the core says something different', () => { // Between this plan and plan 2, calendar/loadouts/patchnotes/season/announcements still use the // in-memory registerUndo (13 call sites across five files). Their rows are BRAND NEW and also // have inverse: null — telling the user they "predate revert support" would be plainly false and // would read as a bug. const r = canRevert({ changeId: 'Aug20-09', inverse: null, undone: false, page: 'calendar' }); assert.strictEqual(r.ok, false); assert.match(r.reason, /not yet/i, 'an unmigrated entity must not be described as historical'); assert.doesNotMatch(r.reason, /predates/i); });

check('an already-undone row cannot be reverted twice', () => { const r = canRevert({ changeId: 'Aug20-02', inverse: { type: 'draw.add' }, undone: true }); assert.strictEqual(r.ok, false); assert.match(r.reason, /already/i); });

check('a row with an inverse and not undone can be reverted', () => { assert.strictEqual(canRevert({ changeId: 'Aug20-03', inverse: { type: 'draw.add' }, undone: false }).ok, true); });

process.exit(failures ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node scripts/revert.test.js` Expected: FAIL with `Cannot find module '../core/revert'`

- [ ] **Step 3: Write the implementation**

```js
// core/revert.js // // Turns a ChangeLog row's stored inverse back into an op and applies it. // // ⚠️ Every row written BEFORE core/ops existed has inverse: null and is not revertible. That is // correct and permanent — do not backfill a guess. canRevert() says so in words, because otherwise // every historical row looks like a bug. const { getChange, markUndone } = require('../utils/changeStore'); const { commitSet } = require('./changeset');

// Entities routed through core/ops. Grows in plan 2 until it covers everything, then this whole // distinction disappears along with handlers/manage/shared.js's registerUndo. const ON_CORE = new Set(['draws']);

function canRevert(row) { if (!row) return { ok: false, reason: 'That change no longer exists.' }; if (row.undone) return { ok: false, reason: 'That change was already reverted.' }; if (!row.inverse) { // TWO different reasons produce inverse: null, and conflating them tells the user something // false. A pre-core row is historical; an unmigrated entity's row is minutes old. return ON_CORE.has(row.page) ? { ok: false, reason: 'That change predates revert support, so there is nothing to undo it with.' } : { ok: false, reason: `Reverting ${row.page || 'this section'} is not yet supported — use the Undo button on the original message.` }; } return { ok: true }; }

async function revertChange(changeId, { actorId }) { const row = await getChange(changeId); const gate = canRevert(row); if (!gate.ok) return { ok: false, reason: gate.reason };

    const result = await commitSet([row.inverse], { actorId });
    if (!result.ok) return { ok: false, reason: result.error || 'The revert could not be applied.' };

    await markUndone(changeId);
    return { ok: true, changeId: result.changeIds[0] };
}

module.exports = { canRevert, revertChange };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/revert.test.js` Expected: **four** ✓, exit 0 — the file has four `check()` calls

- [ ] **Step 5: Add the Revert control to `/bot analytics` → Changes**

In `handlers/bot.js`'s Changes page, add a button per row with `custom_id` `bot_revert_<changeId>`, disabled when `canRevert()` says no, with the reason as the row's text.

🔴 **The `bot_` router guard is NOT sufficient, and `handlers/bot.js` already says why in a comment at the top of the file.** `handlers/router.js:154` maps `bot_` → `hasCommandAccess(userId, 'bot')`, which only proves *this user has some /bot access* — the `bot` token is grantable to any admin for analytics. It does **not** prove they may mutate the page a given change belongs to. Without a second check, **an admin granted `bot` purely to read analytics could revert changes on `/manage` pages they hold no scope for** — a privilege escalation, in the one control that writes to live data from a read-only surface.

```js
// In the bot_revert_ branch, before anything else. Same shape /bot access and bot_hp_restart // already use — they re-check independently rather than trusting the prefix guard. const { hasManagePageAccess } = require('../utils/adminAccess'); const row = await getChange(changeId); if (!row || !(await hasManagePageAccess(interaction.user.id, row.page))) { return interaction.reply({ content: "🔒 You don't have access to the section that change belongs to.", ephemeral: true }); }
```
⚠️ This is why finding #9 matters operationally and not cosmetically: **if `page` were hardcoded to `'draws'`, this permission check would grant or deny on a lie.**

- [ ] **Step 6: Test it live on the dev bot**

Add a draw via `/manage`, open `/bot analytics` → Changes, revert it, and confirm the draw disappears from `/draw` and the row shows as reverted. **Then restart the dev bot and revert a different row** — that is the property this whole task exists for, and an in-memory undo would fail exactly there.

- [ ] **Step 7: Commit**

```bash
git add core/revert.js scripts/revert.test.js handlers/bot.js package.json git commit -m "feat(core): revert any audited change from either surface"
```

---

## Self-review

**Spec coverage.** §4 (algebra) → Tasks 1, 4. §4.1 (registry invariant) → Task 1 Step 1. §5 (tiers) → Task 4's `tier` field and its test. §6.1 (element identity) → Task 3. §6.2 H2/H3 (transactions) → Task 5. H6 (audit gaps) → Task 5's `commitSet`, where `recordChange` is unskippable. §11 (`ChangeLog.inverse`) → Task 2. §12 (premises) → Task 0.

**Deliberately not covered here, and tracked as plans 2 and 3:** the other five entities and their handlers; `portal/`; auth; the frontend; `Announcement.startsAt`; `PortalSession`; `Changeset` as a persisted model (Task 5's changeset is in-memory — persistence arrives with plan 3, when a session can expire mid-compose).

**Placeholder scan.** No TBDs. Every code step carries real code. Task 6 Step 6 says "repeat for the remaining six" and names all six explicitly rather than gesturing at them.

**Type consistency.** `apply()` returns `{ ok, change, applied }` in all seven ops; `invert(change)` reads `change.applied` in all seven; `commitSet` passes `{ ...res.change, applied: res.applied }` into `invert`, matching. `updateElement`/`appendElement`/`removeElement` all return `{ ok }` or `{ ok: false, reason }`.

## Audit log

A falsification pass was run against this plan — the question was *where is this wrong*.

**P1 — Task 6 originally had no way to prove the refactor was invisible.** It said "verify `/manage` still works", which is untestable and would have been signed off by eye. Now the snapshot fixture is captured from unmodified code and committed *before* any edit (Step 2), because a baseline written after the change proves nothing. Live dev-bot testing is a separate, mandatory step, since a modal-shape snapshot says nothing about whether the write reached Mongo.

**P2 — Task 5 was ordered before Task 0's transaction probe in the first draft.** That is backwards: if M0 refuses transactions, Task 5's entire design is invalid, and building it first would mean discovering that after the code existed. Task 5 now carries an explicit gate.

**P3 — `draw.bulkReplace`'s inverse would have recorded a count, not the data.** The first sketch stored `{ replaced: 4 }`. That makes the inverse a description of a loss rather than a repair. It now stores the full prior array, and `drawOps.test.js` asserts `deepStrictEqual` against it specifically so a future "optimization" to store a count fails loudly.

**P4 — every historical `ChangeLog` row will look broken.** Rows written before Task 2 have `inverse: null`, so the entire existing audit history is non-revertible. Left as-is deliberately — backfilling a guessed inverse would be worse — but `canRevert()` now returns a *reason* rather than a bare false, so the UI can say "predates revert support" instead of rendering a disabled button with no explanation.

**P5 — `validateSet` stopping at the first failure was the obvious implementation and is the wrong one.** With a forty-row bulk paste it would make you fix errors one round trip at a time. The test asserts every failure is reported *and* carries its index, since without the index the UI cannot point at the offending row.

**P6 — Task 2's privacy question was nearly skipped as "no new per-user field".** True today, and false the moment plan 3 adds an admin-grant op, whose inverse payload carries a third party's Discord id. Recorded in the schema comment rather than left for the next reader to rediscover, because `docs-audit`'s `privacy-model-coverage` will not catch it — the field is `Mixed`, and the check looks at field names.

**P7 — the plan's own premise that `utils/adminAccess.js` is reusable was false, and nothing in the plan would have caught it.** Task 5's `commitSet` and every future portal route resolve permissions through it, and it transitively pulls 39 files including `discord.js` and `jimp`. Found by computing the require closure rather than reading imports one level deep. Task 0b now fixes it *before* anything depends on it, and `scripts/ownerModule.test.js` asserts the closure stays clean so it cannot regress.

**P8 — `canRevert()` would have lied for weeks.** `registerUndo` has 13 call sites across five entity files; this plan converts only draws' four. Between this plan and plan 2, a calendar row written five minutes ago also has `inverse: null`, and the original message said it "predates revert support". Now two distinct reasons, with a test asserting an unmigrated entity is never described as historical.

**P9 — the premise probe would have produced a confident wrong answer.** Task 0 pinned itself to `.env.dev` with `assert.ok(/dev/.test(uri))` — a good guard against writing to prod, and it forces the probe onto a **standalone** local MongoDB where transactions cannot work regardless of Atlas. A failure there reads exactly like "M0 does not support transactions", which would have reopened the spec for nothing. Step 3b now converts the local instance to a single-node replica set first, and the findings note must record which database was used.

**P10 — draws does not exercise both concurrency models, so this plan locks a contract it has only half-tested.** Draws lives in `SeasonalData`'s arrays and proves `core/mongo/positional.js`; it never touches a standalone document, so `core/mongo/document.js` — and any pressure it puts on the four-verb shape — is not discovered until plan 2. **Accepted rather than restructured**, because plan 2 already places `document.js` as its *first* task, before any standalone entity converts, so the discovery happens at the cheapest moment. Plan 2 Task 1 now carries an explicit step to re-validate the contract against a standalone document before anything else proceeds.

**P11 — a fresh reader with no session context found this plan's first file unable to load.** `core/ops/index.js` required `./draws` above `module.exports`, so `registerEntity` was `undefined` inside the entity — a TypeError on `require`, before any test ran. Three falsification passes had gone over this file. **Reading a plan is not running it**; the fix is one line of ordering and a comment saying why the order is load-bearing.

**P12 — the conservation test could not pass over the map it was given.** Ten mutating draws actions, seven op types, a 1:1 `Map`. `registerEntity` now accepts an array of actions and rejects a double-claim, and `draw.add`/`draw.purge` claim their two and three respectively.

**P13 — three inverses were destroyed by the validator on the way back in**, because `commitSet` validates before applying and the bulk validators unconditionally re-parsed `payload.text || ''`. Undo would have silently restored nothing for bulkDelete, purge and bulkReplace. The `alreadyParsed` guard fixes it; **P3's test was asserting `invert()`'s return value and never round-tripping it**, which is why P3 recorded this as already solved.

**P14 — `draw.purge`'s inverse used `category: 'both'`, which `pathFor()` maps to `newDraws`.** Reverting a `scope: 'all'` purge would have restored new draws and silently dropped every returning draw. `invert()` may now return an array, and `commitSet` flattens.

**P15 — `recordChange` cannot be used the way Task 5 used it.** It returns `undefined` and takes no session, so `changeIds` was always `[undefined]` and audit rows escaped the transaction. Task 2 now adds a transactional `recordChangeIn(session, fields)` beside it, leaving the fire-and-forget Discord path untouched.

**P16 — `page: 'draws'` was hardcoded in a module described as generic**, which would have mislabelled every other entity's audit rows the moment plan 2 landed — breaking `/bot analytics` filtering *and* the `ON_CORE.has(row.page)` branch P8 exists to serve. Now derived from the op type.

**P17 — the Revert button was a privilege escalation.** The `bot_` guard proves *some* `/bot` access, not page scope, and `handlers/bot.js` documents that in a comment at the top. An analytics-only admin could have reverted anything.

**P18 — `core/` is a new tracked top-level directory and `top-level-dirs` is an ERROR check.** The first commit would have turned CI red.

**P19 — smaller, all real:** `_id` discovered by a tail read inside a retrying transaction; "28 existing tests" against a real 42; a step asserting both "three ✓, exit 0" and "it will still fail"; a revert test said to have three checks that has four; and `handlers/router.js` listed for an edit it has nothing to receive.

**Not found:** no defect in the op contract's four-verb shape, in the element-identity filter design, or in the task ordering after P2 was fixed. That is an absence of findings, not proof they are right.
