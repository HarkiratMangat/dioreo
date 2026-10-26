---
kind: plan
status: frozen
---

# `/gunsmiths` Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/all` and the eight per-category MP loadout commands with a single `/gunsmiths` carrying two subcommands — `search` (MP weapon lookup) and `list` (scoped card browser over 11 named scopes).

**Architecture:** One shared lookup function (`utils/loadoutLookup.js`) replaces the duplicated weapon-lookup logic in `commands/dmz.js` and the router's fallback. One scope descriptor `{mode, category, metaOnly}` drives every browse view — categories, meta and DMZ are the same engine. `commands/gunsmiths.js` becomes an ordinary command module, which deletes the router's special-case fallback entirely.

**Tech Stack:** discord.js v14 (`SlashCommandBuilder`, Components V2 raw JSON), Mongoose/MongoDB, Node 24.

**Spec:** `docs/superpowers/specs/2026-08-15-gunsmiths-command-consolidation-design.md` — read it first; this plan argues from it.

## Global Constraints

- **Branch off `v3-pre-release`, PR back into `v3-pre-release`** — never `main`. `gh pr create --base v3-pre-release` (gh defaults to `main` and will not warn).
- **Version: `3.29.0-pre`** in BOTH `package.json` and `package-lock.json` (a mismatch broke PR #130). Pre-release line takes a MODERATE bump per merge; the trailing `0` never moves.
- **ADD BEFORE DELETE.** `/gunsmiths` must register and work before the nine builders are removed. The dev bot runs `node --watch`, so a wrong order leaves it with no loadout lookup.
- **Every new handler branch carries an explicit `isButton()` / `isStringSelectMenu()` type test.** A select branch written under `isButton()` becomes dead code with no error — this exact bug has shipped twice in this file.
- **Never `return interaction.reply(...)` unawaited** in an error branch; await it inside its own small try/catch. An unawaited rejection escapes the router's crash net and kills the process.
- **Custom_id prefixes:** new family is `gsb~`. It must never begin with `mp` or `dmz` (owned as bare `startsWith` prefixes by the same handler).
- **Commit trailers** on every commit:
  ```
  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
  Co-Authored-By: diorswrld <310361322+diorswrld@users.noreply.github.com>
  ```
- **Markdown prose is soft-wrapped** — one logical line per paragraph. `npm run docs:reflow -- --write` before committing docs.
- **Read a gate's EXIT CODE**, never its trailing summary: `npm test >/tmp/t.log 2>&1; echo "exit=$?"`.

---

## File Structure

| File | Responsibility |
|---|---|
| `commands/gunsmiths.js` **(new)** | The `data` builder (2 subcommands) + `execute()` dispatch. No rendering logic. |
| `utils/loadoutLookup.js` **(new)** | `lookupAndRenderWeapon()` — the single weapon-lookup+render path, shared by `/dmz` and `/gunsmiths search`. |
| `utils/loadoutScopes.js` **(new)** | `SCOPES`, `parseScopeToken()`, `formatScopeToken()`, `resolveScopeBuilds()`, `flatIndexToPosition()`. Pure data/query logic, no Discord objects — so it is unit-testable without a client. |
| `utils/loadoutRender.js` (modify) | Gains the `browse` option and `hideBadges`; `buildCategoryBrowseRow` gains a custom_id override and non-silent overflow. |
| `handlers/loadouts.js` (modify) | Gains `gsb~` to `OWNED_PREFIXES` and two branches (next/prev, jump). No in-panel scope switcher — `list scope:` supersedes it. |
| `handlers/router.js` (modify) | Autocomplete route reworked for `gunsmiths`; the ~110-line MP fallback deleted. |
| `bot/registry.js` (modify) | `/all` + the 8 builders deleted; `buildCategoryCommands` → `applyGunsmithsScopeChoices`. |
| `commands/dmz.js` (modify) | Reduced to a thin wrapper over `lookupAndRenderWeapon`. |
| `commands/help.js` (modify) | Gunsmiths category rewritten; `getLiveGunsmithCommandNames()` deleted. |
| `scripts/gunsmithsCommandShape.test.js` **(new)** | Pre-flight: asserts the registered command JSON's shape without touching Discord. |

---

### Task 1: Prove the registry can inject scope choices (SPIKE — do this first)

Everything about the registry approach depends on discord.js allowing a nested subcommand option's choices to be set **after** the builder is constructed. If it does not, the shape of Tasks 2 and 6 changes. Find out in five minutes, not in the middle of Task 6.

**Files:**
- Create: `/private/tmp/claude-501/-Applications-Claude-Code-Diors-Builds/*/scratchpad/spike-choices.js` (throwaway — do not commit)

- [ ] **Step 1: Write the spike**

```js
const { SlashCommandBuilder } = require('discord.js');
const b = new SlashCommandBuilder().setName('gunsmiths').setDescription('x')
  .addSubcommand(sc => sc.setName('list').setDescription('y')
    .addStringOption(o => o.setName('scope').setDescription('z').setRequired(true)));
// Mutate AFTER construction, the way registry.js will have to.
const listSub = b.options.find(o => o.name === 'list');
const scopeOpt = listSub.options.find(o => o.name === 'scope');
scopeOpt.setChoices({ name: 'AR', value: 'MP.AR.std' }, { name: 'DMZ', value: 'DMZ.*.std' });
const json = b.toJSON();
console.log(JSON.stringify(json.options[0].options[0].choices, null, 2));
console.log('TOP-LEVEL OPTION TYPES:', json.options.map(o => o.type)); // must be [1] = subcommand only
```

- [ ] **Step 2: Run it**

Run: `node <scratchpad>/spike-choices.js` Expected: the two choices print, and top-level option types are `[1]`.

- [ ] **Step 3: Record the outcome in the spec**

If it works, delete the ⚠️ pre-flight-assertion warning block in the spec's `bot/registry.js` section and replace it with one line stating it was proven on 2026-08-15. If it FAILS, switch to the documented fallback: `commands/gunsmiths.js` exports an async `buildData()` factory that `bot/registry.js` awaits, and `client.commands` is populated after that resolves. Update the spec's registry section before continuing.

- [ ] **Step 4: No commit** (scratch file, and the spec edit rides with Task 9)

---

### Task 2: `utils/loadoutScopes.js` — the scope engine

Pure logic, no Discord objects, so it is testable without a bot.

**Files:**
- Create: `utils/loadoutScopes.js`
- Create: `scripts/loadoutScopes.test.js`

**Interfaces:**
- Produces: `SCOPES` (array of `{value, label, mode, category, metaOnly}`), `parseScopeToken(token) → {mode, category, metaOnly}`, `formatScopeToken(scope) → string`, `resolveScopeBuilds(scope) → Promise<Build[]>`, `flatIndexToPosition(builds, flatIndex) → {weaponKey, weaponBuilds, indexWithinWeapon}`.
- Consumes: `models/Loadout`.

- [ ] **Step 1: Write the failing test**

```js
// scripts/loadoutScopes.test.js
const assert = require('assert');
const { parseScopeToken, formatScopeToken, flatIndexToPosition } = require('../utils/loadoutScopes');

// round-trip: a token must survive format(parse(t)) === t, or a click loses its scope
for (const t of ['MP.AR.std', 'MP.*.std', 'MP.*.meta', 'DMZ.*.meta', 'DMZ.*.std']) {
    assert.strictEqual(formatScopeToken(parseScopeToken(t)), t, `round-trip failed for ${t}`);
}

// flatIndexToPosition must map a flat position onto the right weapon AND the right index inside it
const builds = [
    { weaponKey: 'ak117', buildName: 'A' }, { weaponKey: 'ak117', buildName: 'B' },
    { weaponKey: 'cx-9',  buildName: 'C' },
];
assert.deepStrictEqual(flatIndexToPosition(builds, 1).weaponKey, 'ak117');
assert.strictEqual(flatIndexToPosition(builds, 1).indexWithinWeapon, 1);
assert.strictEqual(flatIndexToPosition(builds, 2).weaponKey, 'cx-9');
assert.strictEqual(flatIndexToPosition(builds, 2).indexWithinWeapon, 0);
// out-of-range clamps rather than throwing -- a build deleted mid-browse must not crash the click
assert.strictEqual(flatIndexToPosition(builds, 99).weaponKey, 'cx-9');
console.log('✓ loadoutScopes');
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node scripts/loadoutScopes.test.js` Expected: FAIL — `Cannot find module '../utils/loadoutScopes'`.

- [ ] **Step 3: Implement `utils/loadoutScopes.js`**

```js
// Scope descriptor: {mode:'MP'|'DMZ', category:string|null, metaOnly:boolean}.
// Token form `<mode>.<category|*>.<meta|std>` is what travels in a gsb~ custom_id.
const Loadout = require('../models/Loadout');

function formatScopeToken({ mode, category, metaOnly }) {
    return `${mode}.${category || '*'}.${metaOnly ? 'meta' : 'std'}`;
}
function parseScopeToken(token) {
    const [mode, category, kind] = String(token).split('.');
    return { mode, category: category === '*' ? null : category, metaOnly: kind === 'meta' };
}

// Deterministic ordering is REQUIRED: nothing is stored server-side, so every click re-derives
// this list and must get the same order or the flat index points somewhere else.
async function resolveScopeBuilds({ mode, category, metaOnly }) {
    const filter = { mode };
    if (category) filter.category = category;
    if (metaOnly) filter.isMeta = true;
    const builds = await Loadout.find(filter).lean();
    return builds.sort((a, b) =>
        a.category.localeCompare(b.category) ||
        a.weaponName.localeCompare(b.weaponName) ||
        String(a.buildName).localeCompare(String(b.buildName)) ||
        // FINAL TIE-BREAK, and it is load-bearing: `buildName` defaults to 'Standard Build' for
        // every row that does not set one, so all three keys can tie. Without this the order falls
        // back to whatever Mongo returned, which is not stable across two queries -- and since every
        // click re-derives this list, an unstable tie silently moves the flat index onto a different
        // build. That is the exact drift this design claims to bound.
        String(a._id).localeCompare(String(b._id)));
}

// Clamped, never throwing: /manage can add or delete a build between two clicks.
function flatIndexToPosition(builds, flatIndex) {
    const i = Math.min(Math.max(Number(flatIndex) || 0, 0), builds.length - 1);
    const weaponKey = builds[i].weaponKey;
    const weaponBuilds = builds.filter(b => b.weaponKey === weaponKey);
    // IDENTITY comparison, not _id: weaponBuilds is filtered FROM this same array, so the object
    // reference is exact. An _id comparison looks more careful and is actually WRONG -- two builds
    // whose _id is undefined (any fixture, any projection that omits it) both stringify to
    // "undefined" and collapse onto index 0. Found while re-reading this plan, 2026-08-15 20:55 EDT.
    const indexWithinWeapon = Math.max(0, weaponBuilds.indexOf(builds[i]));
    return { weaponKey, weaponBuilds, indexWithinWeapon };
}

// The 4 fixed scopes; the 7 category scopes are appended at registration from the live DB.
const FIXED_SCOPES = [
    { value: 'MP.*.std',   label: 'All MP builds', mode: 'MP',  category: null, metaOnly: false },
    { value: 'MP.*.meta',  label: 'Meta — MP',     mode: 'MP',  category: null, metaOnly: true  },
    { value: 'DMZ.*.meta', label: 'Meta — DMZ',    mode: 'DMZ', category: null, metaOnly: true  },
    { value: 'DMZ.*.std',  label: 'DMZ',           mode: 'DMZ', category: null, metaOnly: false },
];

module.exports = { formatScopeToken, parseScopeToken, resolveScopeBuilds, flatIndexToPosition, FIXED_SCOPES };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/loadoutScopes.test.js` Expected: `✓ loadoutScopes`

- [ ] **Step 5: Wire it into `npm test`**

Add `node scripts/loadoutScopes.test.js` to the `test` script chain in `package.json`, beside the existing routing tests. Then run `npm test >/tmp/t.log 2>&1; echo "exit=$?"` and confirm `exit=0`.

- [ ] **Step 6: Commit**

```bash
git add utils/loadoutScopes.js scripts/loadoutScopes.test.js package.json
git commit -m "feat(gunsmiths): scope descriptor engine for loadout browsing"
```

---

### Task 3: `utils/loadoutRender.js` — the `browse` option, without regressing existing cards

`buildLoadoutCard` has **five call sites**: `commands/dmz.js:123`, `handlers/router.js:508`, `handlers/loadouts.js:78` and `:147`, and **`handlers/autobuild.js:66`**. `/autobuild`'s review card is downstream of this task. The deliverable is a new capability **plus** proof that the old output did not move.

**Files:**
- Modify: `utils/loadoutRender.js` (`buildLoadoutCard` ~line 271, `buildCategoryBrowseRow` ~line 223)
- Create: `scripts/loadoutRenderSnapshot.test.js`

**Interfaces:**
- Consumes: `formatScopeToken` from Task 2.
- Produces: `buildLoadoutCard(builds, index, { color, idPrefix, isEphemeral, categoryBuilds, hideBadges, browse })` where `browse = { scopeToken, flatIndex, flatTotal, scopeLabel } | null`.

- [ ] **Step 1: Write the regression test FIRST, against current behaviour**

```js
// scripts/loadoutRenderSnapshot.test.js
const assert = require('assert');
const { buildLoadoutCard } = require('../utils/loadoutRender');
const fixture = [{ weaponKey: 'ak117', weaponName: 'AK117', category: 'AR', mode: 'MP',
    buildName: 'Standard', attachments: ['A', 'B'], imageKey: 'K', description: '',
    shareCode: 'CODE', isMeta: false, isToxic: false, categoryRank: null, lastUpdated: new Date(0) }];

// 1. A NORMAL card (no `browse`) must keep emitting mp-prefixed, weapon-scoped ids.
const normal = buildLoadoutCard(fixture, 0, { color: 1, idPrefix: 'mp', isEphemeral: false, categoryBuilds: null });
const ids = JSON.stringify(normal).match(/"custom_id":"[^"]+"/g) || [];
assert.ok(ids.some(i => i.includes('mpcopy_ak117_0')), 'normal card lost its mp copy id');
assert.ok(!JSON.stringify(normal).includes('gsb~'), 'normal card must never emit a gsb~ id');

// 2. A BROWSE card pages across the scope, not within the weapon.
const browsed = buildLoadoutCard(fixture, 0, { color: 1, idPrefix: 'mp', isEphemeral: false,
    categoryBuilds: null, browse: { scopeToken: 'MP.AR.std', flatIndex: 6, flatTotal: 35, scopeLabel: 'AR' } });
const bs = JSON.stringify(browsed);
assert.ok(bs.includes('gsb~next~MP.AR.std~6'), 'browse card missing scope-paged next id');
assert.ok(bs.includes('"7 / 35"'), 'browse card indicator must show FLAT position');
assert.ok(bs.includes('mpcopy_ak117_0'), 'browse card must KEEP the mp copy id (handler reuse)');

// 3. hideBadges suppresses the badge line without touching anything else.
const meta = [{ ...fixture[0], isMeta: true }];
assert.ok(JSON.stringify(buildLoadoutCard(meta, 0, { color: 1, idPrefix: 'mp' })).includes('Meta'));
assert.ok(!JSON.stringify(buildLoadoutCard(meta, 0, { color: 1, idPrefix: 'mp', hideBadges: true })).includes('Meta'));
console.log('✓ loadoutRender snapshot');
```

- [ ] **Step 2: Run it to confirm the NEW assertions fail and the OLD one passes**

Run: `node scripts/loadoutRenderSnapshot.test.js` Expected: assertion 1 passes, assertion 2 FAILS on the missing `gsb~next~…` id. That split is the point — it proves the test can fail and that current behaviour is already correct.

- [ ] **Step 3: Implement in `utils/loadoutRender.js`**

In `buildLoadoutCard`'s destructured options add `hideBadges = false, browse = null`. Then:
- Guard the badge line: `const badgesLine = hideBadges ? null : buildBadgesLine(activeBuild);`
- Replace the `buildPaginationRow({...})` call with:

```js
    // A browse card pages across the whole SCOPE, so its ids carry the scope token + flat index and
    // its indicator counts the scope. A normal card is untouched -- same ids, same totals as before.
    const paginationRow = browse
        ? buildPaginationRow({
            totalChunks: browse.flatTotal,
            currentPage: browse.flatIndex,
            prevCustomId: `gsb~prev~${browse.scopeToken}~${browse.flatIndex}`,
            nextCustomId: `gsb~next~${browse.scopeToken}~${browse.flatIndex}`,
            indicatorCustomId: `gsb~ind~${browse.scopeToken}`
        })
        : buildPaginationRow({
            totalChunks: builds.length,
            currentPage: index,
            prevCustomId: `${idPrefix}prev_${activeBuild.weaponKey}_${index}`,
            nextCustomId: `${idPrefix}next_${activeBuild.weaponKey}_${index}`,
            indicatorCustomId: `${idPrefix}_page_indicator`
        });
```
- Leave the two Copy buttons EXACTLY as they are. They stay `mp`/`dmz`-prefixed on purpose: they encode weaponKey + index-within-weapon and the existing copy handler already re-queries and indexes correctly, so a browse card reuses that path with zero new code.
- Pass the browse dropdown an id override:

```js
    const scopeLabel = browse ? browse.scopeLabel : (activeBuild.mode === 'DMZ' ? 'DMZ' : activeBuild.category);
    const browseRow = buildCategoryBrowseRow(categoryBuilds, activeBuild.weaponKey, idPrefix, scopeLabel,
        browse ? `gsb~jump~${browse.scopeToken}` : null);
```

In `buildCategoryBrowseRow`, add a fifth parameter `customIdOverride = null`, use it in place of `${idPrefix}browse`, and **replace the silent truncation**:

```js
    // Never drop weapons silently -- commands/admin.js:219 sets the house rule for this exact
    // situation. Window around the active weapon so paging forward reveals the rest, and say so.
    let truncated = options;
    let overflowNote = null;
    if (options.length > 25) {
        const active = Math.max(0, options.findIndex(o => o.value === activeWeaponKey));
        const start = Math.min(Math.max(0, active - 12), options.length - 25);
        truncated = options.slice(start, start + 25);
        overflowNote = `Showing 25 of ${options.length} — use /gunsmiths search to jump to any weapon`;
    }
```
Return the note alongside the row (`{ row, overflowNote }` would change every caller — instead append it to the select's `placeholder` when present, which keeps the return type unchanged). ⚠️ **A select `placeholder` caps at 150 characters**, so build it as `Browse ${scopeLabel} — 25 of ${n}, use /gunsmiths search for the rest` and assert the length in the snapshot test rather than assuming it fits.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/loadoutRenderSnapshot.test.js` Expected: `✓ loadoutRender snapshot`

- [ ] **Step 5: Prove no existing surface moved**

Run: `npm test >/tmp/t.log 2>&1; echo "exit=$?"` → `exit=0`. Then boot the dev bot (`node --watch --env-file=.env.dev index.js`) and check **both** downstream card surfaces, because five call sites run through this function:
- `/dmz weapon:fennec` — the card must look exactly as before, and Prev/Next must still page within the weapon.
- **`/autobuild`** with any image — its review card renders through the same builder with `idPrefix: 'mp'`, so a mistake here surfaces there too. This is the surface most likely to be forgotten.

- [ ] **Step 6: Commit**

```bash
git add utils/loadoutRender.js scripts/loadoutRenderSnapshot.test.js package.json
git commit -m "feat(gunsmiths): browse-scope option and hideBadges on the loadout card"
```

---

### Task 4: `utils/loadoutLookup.js` — one weapon-lookup path

**Files:**
- Create: `utils/loadoutLookup.js`
- Modify: `commands/dmz.js` (reduce to a wrapper)

**Interfaces:**
- Produces: `lookupAndRenderWeapon(interaction, { mode, rawQuery, requestedBuild, visibilityChoice })`.

- [ ] **Step 1: Move the logic verbatim**

Lift the body of the router's MP fallback (`handlers/router.js`, the block beginning `// MP LOADOUT CATEGORY COMMAND FALLBACK`) into `lookupAndRenderWeapon`, parameterised by `mode`. **Do not rewrite it while moving it.** It carries four behaviours that must survive intact:
1. `prefs` and the builds query kicked off concurrently, only `prefs` awaited before `deferReply` (keeps the 3s ack window).
2. `resolveEphemeral({ argPrivate, prefs, prefsField: 'loadoutVisibility' })`.
3. **The short/partial fuzzy fallback** — exact `weaponKey` miss → `findWeaponMatches` over `{mode}` (plus `category` when scoped) → 1 match auto-resolves, 2+ replies "not specific enough". This is the piece most likely to be lost in the move.
4. Awaited `followUp` inside its own try/catch on every error branch.

Drop only the trailing `maybeSendAnnouncement()` call — the modular-command branch already fires it, and this function will now be reached through that branch.

- [ ] **Step 2: Reduce `commands/dmz.js`**

Its `execute()` becomes:

```js
    async execute(interaction) {
        const { lookupAndRenderWeapon } = require('../utils/loadoutLookup');
        return lookupAndRenderWeapon(interaction, {
            mode: 'DMZ',
            rawQuery: interaction.options.getString('weapon'),
            requestedBuild: interaction.options.getInteger('build'),
            visibilityChoice: interaction.options.getString('visibility'),
        });
    },
```

- [ ] **Step 3: Verify `/dmz` is unchanged**

`node --check commands/dmz.js utils/loadoutLookup.js`, then on the dev bot: `/dmz weapon:fennec` (exact), `/dmz weapon:fen` (fuzzy), `/dmz weapon:zzz` (not found). All three must behave exactly as before this task.

- [ ] **Step 4: Commit**

```bash
git add utils/loadoutLookup.js commands/dmz.js
git commit -m "refactor(loadouts): extract the shared weapon lookup path"
```

---

### Task 5: `commands/gunsmiths.js` — the command module (ADD, do not yet delete)

**Files:**
- Create: `commands/gunsmiths.js`
- Create: `scripts/gunsmithsCommandShape.test.js`

**Interfaces:**
- Consumes: `lookupAndRenderWeapon` (Task 4), `resolveScopeBuilds` / `parseScopeToken` / `flatIndexToPosition` / `FIXED_SCOPES` (Task 2), `buildLoadoutCard` with `browse` (Task 3).
- Produces: `module.exports = { data, execute, renderScopeBrowse }` — `renderScopeBrowse(interaction, scope, flatIndex, { isEphemeral, isUpdate })` is what Task 7's handler branches call.

- [ ] **Step 1: Write the shape pre-flight test**

```js
// scripts/gunsmithsCommandShape.test.js
const assert = require('assert');
const { data } = require('../commands/gunsmiths');
const json = data.toJSON();

// The constraint that forced this whole design: a command with subcommands may have NO top-level options.
assert.deepStrictEqual([...new Set(json.options.map(o => o.type))], [1],
    'top-level options must be subcommands (type 1) ONLY — Discord rejects a mix');
assert.strictEqual(json.options.length, 2, 'expected exactly 2 subcommands');
assert.deepStrictEqual(json.options.map(o => o.name).sort(), ['list', 'search']);
assert.deepStrictEqual(json.integration_types, [0, 1], 'must be guild + user installable (v3)');

// Discord's own limits, asserted here so a violation is a TEST failure rather than a registration
// rejection at boot: descriptions cap at 100 chars, choice names at 100.
const allDescs = [json.description, ...json.options.flatMap(o => [o.description, ...(o.options || []).map(x => x.description)])];
allDescs.forEach(dsc => assert.ok(dsc.length <= 100, `description over 100 chars: "${dsc}"`));
const scopeOpt = json.options.find(o => o.name === 'list').options.find(o => o.name === 'scope');
scopeOpt.choices.forEach(c => assert.ok(c.name.length <= 100, `choice name too long: ${c.name}`));
assert.strictEqual(scopeOpt.choices.length, 11, 'expected 11 scope choices (7 live categories + 4 fixed)');

// The falsifier: a builder that mixes a top-level option MUST trip the first assertion.
const { SlashCommandBuilder } = require('discord.js');
const bad = new SlashCommandBuilder().setName('x').setDescription('x')
    .addSubcommand(s => s.setName('a').setDescription('a')).addStringOption(o => o.setName('b').setDescription('b'));
assert.throws(() => {
    const bj = bad.toJSON();
    assert.deepStrictEqual([...new Set(bj.options.map(o => o.type))], [1]);
}, 'the shape assertion is vacuous — it did not reject a mixed builder');
console.log('✓ gunsmiths command shape');
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `node scripts/gunsmithsCommandShape.test.js` Expected: FAIL — `Cannot find module '../commands/gunsmiths'`.

- [ ] **Step 3: Implement `commands/gunsmiths.js`**

`data`: `setName('gunsmiths')`, `.setIntegrationTypes([0,1]).setContexts([0,1,2])`, two subcommands — `search`: `weapon` (string, required, autocomplete), `build` (integer, min 1), `visibility` (string, choices Hidden/Public). `list`: `scope` (string, required — choices injected in Task 6), `visibility` (same choices).

`execute()`:

```js
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        if (sub === 'search') {
            const raw = interaction.options.getString('weapon');
            // A `~cat~<CATEGORY>` value comes from a category row in the autocomplete list; `~` can
            // never appear in a weaponKey (checked against all 70), so this cannot collide.
            if (raw.startsWith('~cat~')) {
                // `build:` is deliberately IGNORED on a category row -- it means "build N of this
                // weapon", and a scope browse has no single weapon. Silently starting at flat index
                // N-1 would be a different, surprising meaning.
                return renderScopeBrowse(interaction, { mode: 'MP', category: raw.slice(5), metaOnly: false }, 0, {});
            }
            const { lookupAndRenderWeapon } = require('../utils/loadoutLookup');
            return lookupAndRenderWeapon(interaction, { mode: 'MP', rawQuery: raw,
                requestedBuild: interaction.options.getInteger('build'),
                visibilityChoice: interaction.options.getString('visibility') });
        }
        const { parseScopeToken } = require('../utils/loadoutScopes');
        return renderScopeBrowse(interaction, parseScopeToken(interaction.options.getString('scope')), 0, {});
    },
```

`renderScopeBrowse(interaction, scope, flatIndex, { isUpdate = false })`:

⚠️ **Ephemerality resolves from two DIFFERENT sources depending on the path, and getting this wrong makes the Share button vanish mid-browse.** On the FIRST render, resolve prefs + `resolveEphemeral({ argPrivate, prefs, prefsField: 'loadoutVisibility' })` and `deferReply({ ephemeral })`. On an UPDATE (a `gsb~` click) there is no `execute()` to re-resolve from, so read it off the message exactly as the existing pagination handler does — `const isEphemeral = Boolean(interaction.message.flags?.bitfield & 64)` — then `deferUpdate()`. See `.claude/rules/rendering-and-ui.md`: every re-render path must thread `isEphemeral` through or the Share button silently disappears after the first interaction.

Then: `resolveScopeBuilds(scope)`, empty → an awaited `followUp` saying the scope has no builds yet, else `flatIndexToPosition`, then `buildLoadoutCard(weaponBuilds, indexWithinWeapon, { color: getMpCategoryAccent(...), idPrefix: scope.mode === 'DMZ' ? 'dmz' : 'mp', isEphemeral, categoryBuilds: builds, hideBadges: scope.metaOnly, browse: { scopeToken, flatIndex, flatTotal: builds.length, scopeLabel } })` and `sendV2Payload`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/gunsmithsCommandShape.test.js` → `✓ gunsmiths command shape`. Add it to `npm test`.

- [ ] **Step 5: Commit**

```bash
git add commands/gunsmiths.js scripts/gunsmithsCommandShape.test.js package.json
git commit -m "feat(gunsmiths): add the /gunsmiths command module"
```

---

### Task 6: Register `/gunsmiths` and inject the scope choices (still no deletion)

**Files:**
- Modify: `bot/registry.js` (rename `buildCategoryCommands` → `applyGunsmithsScopeChoices`)
- Modify: `bot/lifecycle.js:215` (the call site)

- [ ] **Step 1: Rewrite the DB pass**

```js
// Was buildCategoryCommands(): it used to CREATE the eight per-category commands. It now fills in
// /gunsmiths list's `scope` choices from the same live query, so a new category appears on its own.
// Still runs after ClientReady and before the REST PUT -- it needs a DB round-trip, and the array
// and client.commands hold the SAME builder object, so mutating here keeps both consistent.
async function applyGunsmithsScopeChoices(commands) {
    const Loadout = require('../models/Loadout');
    const { FIXED_SCOPES } = require('../utils/loadoutScopes');
    const dbCategories = await Loadout.distinct('category', { mode: 'MP' });
    // SECONDARIES is merged in (not appended) so it is ready the moment Harkirat adds one, and so
    // re-running this after real data exists cannot register it twice.
    const cats = Array.from(new Set([...dbCategories, 'SECONDARIES'])).sort();
    const choices = [
        ...cats.map(c => ({ name: c, value: `MP.${c}.std` })),
        ...FIXED_SCOPES.map(s => ({ name: s.label, value: s.value })),
    ];
    const gunsmiths = commands.find(c => (c.toJSON ? c.toJSON().name : c.name) === 'gunsmiths');
    if (!gunsmiths) { console.error('⚠️ /gunsmiths not found in the command array — scope choices NOT applied'); return commands; }
    const listSub = gunsmiths.options.find(o => o.name === 'list');
    listSub.options.find(o => o.name === 'scope').setChoices(...choices);
    return commands;
}
```

- [ ] **Step 2: Update the call site**

`bot/lifecycle.js:215` — `await buildCategoryCommands(commands);` → `await applyGunsmithsScopeChoices(commands);`, and the import on line 20.

- [ ] **Step 3: Boot the dev bot and verify registration**

Run `node --watch --env-file=.env.dev index.js`. Expect the registration success log and **no** `DISCORD SYSTEM REGISTRATION FAULT LOG`. In Discord, `/gunsmiths list scope:` must offer 11 choices. `/all` and the eight still exist at this point — that is correct, deletion is Task 8.

- [ ] **Step 4: Commit**

```bash
git add bot/registry.js bot/lifecycle.js
git commit -m "feat(gunsmiths): register /gunsmiths and derive its scope choices from the DB"
```

---

### Task 7: Autocomplete + the `gsb~` handler branches

**Files:**
- Modify: `handlers/router.js` (autocomplete route, ~line 313)
- Modify: `handlers/loadouts.js` (`OWNED_PREFIXES` line 21, new branches)

- [ ] **Step 1: Rework the autocomplete route**

Replace the `commandName === 'dmz' / !== 'all'` filter block with: if `commandName === 'gunsmiths'`, guard on `interaction.options.getSubcommand() === 'search'` (return `[]` otherwise — `list` uses static choices and must never reach here), query `{mode:'MP'}`, and prepend category rows:

```js
            // Category rows are "sticky" only in the sense that WE author every slot on every
            // keystroke -- Discord has no pinning. They are filtered by the same fuzzyMatch as
            // weapons so a typed "ak" spends all 25 slots on weapons, and an empty box shows all
            // seven categories, which is the discovery surface that replaces losing /smg.
            const catRows = categories
                .filter(c => !focusedValue || fuzzyMatch(focusedValue, c))
                .map(c => ({ name: `▸ All ${c} builds`, value: `~cat~${c}` }));
            const weaponRows = findWeaponMatches(focusedValue, distinctChoices)
                .map(w => ({ name: `[${displayCategoryLabel(w.category)}] ${w.weaponName}`, value: w.weaponKey }));
            return await interaction.respond([...catRows, ...weaponRows].slice(0, 25));
```

Keep the `/dmz` branch (`commandName === 'dmz'` → `{mode:'DMZ'}`) exactly as it is.

- [ ] **Step 2: Add the handler branches**

`OWNED_PREFIXES` → `["mpbrowse", "dmzbrowse", "gsb~", "dmz", "mp"]`. Three branches, **each with its own type test**:

```js
        // Scope paging. Type-tested because `gsb~jump` is a SELECT and would otherwise be caught by
        // a bare startsWith here -- the exact dead-branch bug this file's header documents.
        if (interaction.isButton() && interaction.customId.startsWith('gsb~')) {
            const [, action, scopeToken, flatIndexRaw] = interaction.customId.split('~');
            if (action !== 'next' && action !== 'prev') return; // `ind` is a disabled label
            const { parseScopeToken, resolveScopeBuilds } = require('../utils/loadoutScopes');
            const { renderScopeBrowse } = require('../commands/gunsmiths');
            const scope = parseScopeToken(scopeToken);
            const builds = await resolveScopeBuilds(scope);
            // Guard BEFORE the modulo. /manage can purge a scope empty between render and click:
            // `(cur + 1) % 0` is NaN, and flatIndexToPosition's clamp yields -1 -> builds[-1] is
            // undefined -> throws. renderScopeBrowse has its own empty guard, but it sits DOWNSTREAM
            // of this arithmetic and never gets the chance to fire.
            if (!builds.length) return await renderScopeBrowse(interaction, scope, 0, { isUpdate: true });
            const cur = parseInt(flatIndexRaw, 10) || 0;
            const next = action === 'next'
                ? (cur + 1) % builds.length
                : (cur - 1 + builds.length) % builds.length;
            return await renderScopeBrowse(interaction, scope, next, { isUpdate: true });
        }

        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('gsb~jump~')) {
            const scopeToken = interaction.customId.split('~')[2];
            const { parseScopeToken, resolveScopeBuilds } = require('../utils/loadoutScopes');
            const { renderScopeBrowse } = require('../commands/gunsmiths');
            const scope = parseScopeToken(scopeToken);
            const builds = await resolveScopeBuilds(scope);
            if (!builds.length) return await renderScopeBrowse(interaction, scope, 0, { isUpdate: true });
            const target = Math.max(0, builds.findIndex(b => b.weaponKey === interaction.values[0]));
            return await renderScopeBrowse(interaction, scope, target, { isUpdate: true });
        }
```

⚠️ Place these **before** the existing bare `startsWith('mp')` / `startsWith('dmz')` button branch is irrelevant (`gsb~` shares no prefix with either), but keep them grouped with the other loadout branches for readability.

- [ ] **Step 3: Run the routing contract test**

Run: `node scripts/handlerRouting.test.js` — it enforces that every prefix a handler owns is declared and that no two modules claim overlapping prefixes. Expected: PASS. Then `npm test >/tmp/t.log 2>&1; echo "exit=$?"` → 0.

- [ ] **Step 4: Commit**

```bash
git add handlers/router.js handlers/loadouts.js
git commit -m "feat(gunsmiths): sticky-category autocomplete and gsb~ browse routing"
```

---

### Task 8: Delete the nine commands and the router fallback (ONLY after Task 7 is verified live)

- [ ] **Step 1: Confirm the replacement works first**

On the dev bot, run every step of the spec's click-test items 1–11. Do not proceed on a partial pass.

- [ ] **Step 2: Delete**

`bot/registry.js` — remove the `/all` builder and its comment block, and the ⚠️ header comment about the nine commands (it stops being true). `handlers/router.js` — delete the entire MP fallback block, from `// MP LOADOUT CATEGORY COMMAND FALLBACK` to the `return;` that ends it, and delete its `maybeSendAnnouncement` call.

- [ ] **Step 3: Verify the deletion is complete and the bot still boots**

```bash
rg -n "'all'|categoryCommand|MP LOADOUT CATEGORY" bot/registry.js handlers/router.js
node --check bot/registry.js handlers/router.js
npm test >/tmp/t.log 2>&1; echo "exit=$?"
```
Then restart the dev bot and confirm `/all` and the eight are **gone** from Discord's command list, and `/gunsmiths` still works.

- [ ] **Step 4: Commit**

```bash
git add bot/registry.js handlers/router.js
git commit -m "refactor(gunsmiths): remove /all, the eight category commands and the router fallback"
```

---

### Task 9: `/help`, docs, records, version

- [ ] **Step 1: `commands/help.js`**

`CATEGORY_DEFS.gunsmiths.staticCommands` → `[cmd('/gunsmiths'), cmd('/dmz')]`. Move `/all`'s `COMMAND_ALIASES` entry to `/gunsmiths`, adding `meta` and `category`. **Also add every RETIRED command name as an alias** — `all`, `ar`, `smg`, `lmg`, `sniper`, `marksman`, `shotgun`, `secondaries` — all pointing at `/gunsmiths`. Two lines, and it turns `/help cmd:smg` (the exact thing a confused user types after their command disappears) from a dead end into the redirect. **Delete `getLiveGunsmithCommandNames()`** and its call in `suggestHelpCommandNames`. Rewrite the usage block at ~line 257 for the two subcommands. ⚠️ Update the file-header comment claiming Gunsmiths is "the one deliberate exception, since /all, /dmz and every per-category command share the identical 3 options" — that becomes false.

- [ ] **Step 2: Docs, in one scripted pass**

`CLAUDE.md` (the `bot/registry.js` nav-map row and its ⚠️), `.claude/rules/loadouts.md`, `commands-overview.md`, `interaction-router.md`, `accent-and-colors.md:73`, `models/UserPreference.js`'s comment. `docs/ROADMAP.md`: mark the consolidation shipped and **reconcile the three overlapping entries** (the `/loadout` consolidation item, the standalone `/meta` item, and "optional paginated multi-weapon loadout view") — all are satisfied or superseded; leaving them open invites a duplicate build.

- [ ] **Step 2b: Update the MEMORY STORE — four files assert the nine-command surface as present tense**

⚠️ **Memory files never appear in a git diff, so nothing else surfaces them, and this is exactly the omission that shipped on 2026-08-08.** These are TRUE today and become FALSE the moment the nine are deleted. Swept 2026-08-15 20:50 EDT:

| File | What goes stale |
|---|---|
| `project_index_js_split.md:18` | table row: "`/all` and the 8 per-category weapon commands are built HERE" |
| `project_guild_install_v3.md:31` | the ⚠️ block naming all eight plus `all`, and "18 public cmds" |
| `project_help_command_and_visibility_rename.md:11` | describes `/help`'s Gunsmiths category as `/all`, `/dmz`, every per-category command |
| `MEMORY.md:5` | the `project_guild_install_v3` index line: "8 weapon cmds are built in `bot/registry.js`" |

Rewrite each to past tense pointing at `project_gunsmiths_consolidation.md`, and flip that memory's own opening from "DESIGNED, not built" to shipped. **Do not delete the registry trap note** — it stays as the reason the consolidation happened.

- [ ] **Step 2c: Put the new `/help` Gunsmiths copy in front of Harkirat before committing it**

The existing Gunsmiths help page was built from his own mockup (`local/gunsmithsUI.json`, gitignored) and lists `/all` plus all eight by name. The replacement is new user-facing copy for a two-subcommand surface, not a mechanical substitution — show him the rendered page and let him redline it. `feedback_ask_before_visual_rework` applies.

- [ ] **Step 3: Records + version**

`docs/CHANGELOG.md` entry as `Pre-Release v3.29.0 — <real clock time> (#PR)` with **no hash**, and backfill the previous entry's hash. `CHANGELOG-SUMMARY.md` player-facing line. `DEVLOG.md` narrative entry — this one earns it: a Discord constraint (no top-level options alongside subcommands) forced the shape, and the surface was revised twice mid-design. Bump `package.json` **and** `package-lock.json` to `3.29.0-pre`.

- [ ] **Step 4: Gates**

```bash
npm run docs:reflow -- --write
npm run docs:audit >/tmp/a.log 2>&1; echo "exit=$?"
npm test >/tmp/t.log 2>&1; echo "exit=$?"
```
Both must be `exit=0`. `git add` any new doc **before** running these — both gates read `git ls-files`, and an untracked file passes vacuously.

- [ ] **Step 5: Commit and open the PR**

```bash
git add -A
git commit -m "docs(gunsmiths): help rewrite, rules, records and the v3.29.0-pre bump"
gh pr create --base v3-pre-release --title "feat(gunsmiths): consolidate the nine MP loadout commands into /gunsmiths"
```

---

## Post-merge, not code: announce the change

Nine commands are about to vanish from users' muscle memory, and this bot **already has the tool for that** — the announcement system (`/manage` → modal → delivered as an ephemeral follow-up on each user's next command, tracked per-user via `seenAnnouncementIds`, shipped 2026-08-13). One modal from Harkirat covers the whole migration: *"`/all` and the per-category commands are now `/gunsmiths search` and `/gunsmiths list`."* Nothing to build, and it is the difference between a rename that reads as an upgrade and one that reads as something broken.

## Performance — deliberately NOT optimised

`list scope:All MP builds` re-queries and re-sorts ~125 documents per click. At 133 documents collection-wide that is free, and caching the flat list would reintroduce exactly the staleness that re-deriving avoids — a `/manage` edit appears on the next click precisely because nothing is cached. **Do not add a cache here.**

## Verification summary

**Automated (every stage):** `node --check` on touched files · `scripts/loadoutScopes.test.js` · `scripts/loadoutRenderSnapshot.test.js` · `scripts/gunsmithsCommandShape.test.js` · `scripts/handlerRouting.test.js` · full `npm test` · `npm run docs:audit`.

**Owed to Harkirat — dev-bot click-test, 14 steps, in the spec's "Owed" section.** Keep it separate from the `index.js` split's outstanding click-test; do not fold the two.

**Not covered by any automated gate, and therefore explicitly owed:** that Discord accepts the registered command JSON, that autocomplete scopes and orders correctly on a real client, and that every `gsb~` button behaves. No test in this plan proves any of those.
