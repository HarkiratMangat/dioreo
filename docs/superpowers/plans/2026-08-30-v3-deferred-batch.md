---
kind: plan
status: live
---

# V3 Deferred-Item Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, batch execution with checkpoints) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do NOT dispatch subagents for this plan — Harkirat's explicit instruction for this batch.

**Goal:** Close out six independent, previously-filed `docs/db-deferred-list.md` items ahead of v3 launch: verify the prod VM's live version, fix the calendar bulk-import parser's trailing-letter truncation bug, give `/colors` its own visibility preference, fold `/invite` into `/help`'s Utilities category, add a read-only Atlas credential path for `scripts/analytics.mjs`, and close the img2webp/cache-channel-env prod deploy blocker.

**Architecture:** Six unrelated, independently-shippable changes across bot code, one Mongoose schema, one script, and prod infrastructure (GCP VM + MongoDB Atlas). No task depends on another; they may be done in any order, but two of them (Task 5's Atlas user, Task 6's VM mutation) mutate live shared production systems and each carries its own explicit-confirmation checkpoint that must not be skipped.

**Tech Stack:** discord.js v14, Mongoose/MongoDB Atlas, Node.js, GCP Compute Engine + systemd, `gcloud` CLI (already authenticated in this environment — confirmed live via `gcloud compute instances describe diors-builds-bot --zone us-east1-b` returning `RUNNING`), the MongoDB Atlas MCP tools (`atlas-list-projects`, `atlas-create-db-user`, etc. — confirmed present and schema-loaded in this session).

**Spec:** None — every item here was already scoped in `docs/db-deferred-list.md` (Active Bugs / 🔔 Reminders) and `docs/ROADMAP.md`'s v3 launch checklist; this plan is the implementation-level detail those entries deliberately left as pointers. Two design forks that blocked writing this plan were resolved directly with Harkirat on 2026-08-30 21:22 EDT: **`/invite` folds into the existing Utilities category** (not a new category, not landing-page-only), and **the broader `/help` landing-page category reorg is explicitly deferred until `/draw calculator` is fully finished** — it is NOT part of this plan.

## Global Constraints

- Never print the full contents of `.env` (prod or dev), a MongoDB connection string, or an Atlas password to any command output or transcript — read/grep for specific values only, never `cat` the whole file.
- Any Mongoose schema field addition must land in the model file in the same change as its first use (the schema-save gotcha — `root CLAUDE.md`'s "Database schema gotcha").
- Update or add a "why" context comment wherever a change makes an existing one stale or removes the code it was explaining (`root CLAUDE.md`'s "Maintaining context comments").
- `npm test` and `npm run docs:audit` must both exit 0 after every task that touches repo code.
- Tasks 5 (Atlas DB user) and 6 (VM package install + prod `.env` edit + restart) are **explicit-permission-required, live-production-mutation checkpoints** — state exactly what will run, wait for Harkirat's explicit go-ahead, and only then execute. This is not the same gate as a git push/merge; it is a direct infrastructure mutation and gets its own confirmation regardless.
- This plan makes no git commits to `main` or `v3-pre-release` on its own — per the branch→PR workflow, code changes land on a feature branch and a PR is opened only when Harkirat asks for one. Each task still ends with a local commit on the working branch, per this repo's normal checkpoint-commit practice.

---

### Task 1: Verify the VM's actually-deployed version

**Files:** None — read-only diagnostic task, no code changes.

**Interfaces:** None — independent of every other task.

- [ ] **Step 1: Run the existing VM instrument panel**

`scripts/vmstatus.sh` already reports the running commit + `package.json` version and diffs them against `origin/main`'s `package.json` (see `scripts/vmstatus.sh:120-122,234-235`) — this task does not need new tooling, just running what exists and reading it correctly.

```bash
./scripts/vmstatus.sh
```

- [ ] **Step 2: Read the verdict line and the main-vs-running diff**

The panel prints a line shaped like `v<RUN_VERSION> · <RUN_COMMIT>` plus a comparison against `origin/main`'s `package.json` version. Confirm:
- What version/commit is actually running on the VM right now.
- Whether that matches the tip of `main` (expected drift is fine if `main` has unreleased commits sitting undeployed — per this repo's own rule, "a merged version can sit undeployed indefinitely" — but the drift must be *known*, not assumed).

- [ ] **Step 3: Report the finding explicitly**

State to Harkirat, in plain terms: "VM is running vX.Y.Z (commit `abc1234`); `main` is at vA.B.C (commit `def5678`)" — and whether they match. This is the entire deliverable for this task; do not add a release/tag on top of the VM until this is stated and acknowledged, per `docs/ROADMAP.md`'s launch-checklist step 3.

No commit — nothing in the repo changes.

---

### Task 2: Fix the calendar bulk-import parser's trailing-letter truncation bug

**Files:**
- Modify: `utils/adminParser.js:187,217-243` (the `BULLETED_ENTRY` regex + its consumer inside `parseBulkEvents`)
- Test: `scripts/calendarOps.test.js` (append new cases)

**Interfaces:**
- Consumes: `buildCalendarEventFromParts(prefixChar, rawEntry)` — unchanged signature, already defined at `utils/adminParser.js:188`. Returns `{ title, startDate, endDate, isOngoing, category, isDoubleCP }` or `null`.
- Produces: `parseBulkEvents(bulkText)` — unchanged signature and return shape (array of the objects above). No caller outside this file needs to change.

**Root cause (verified live before writing this plan, not assumed):** `BULLETED_ENTRY = /([depgm])?•\s*([\s\S]*?)(?=[depgm]?•|$)/g` uses a **non-greedy** content group with a lookahead that itself contains an *optional* prefix letter. When a title's own last character happens to be one of `d/p/e/g/m` and is immediately followed by a real bullet, the non-greedy engine finds it can satisfy the lookahead *one character earlier* by treating that trailing letter as the *next* entry's optional prefix — so it stops the match there instead of at the real boundary. Reproduced live:

```bash
node -e "console.log(require('./utils/adminParser').parseBulkEvents('p•7/1 - 7/2 | Warzone Rumble•e•7/3 - 7/4 | Anniversary'))"
# → first title comes back "Warzone Rumbl" (truncated), not "Warzone Rumble"
```

**The fix:** this bulleted grammar's own bullets are a genuine, unambiguous delimiter — the header comment on `buildCalendarEventFromParts` already states `'•' never appears inside content`. So `line.split('•')` on a per-line basis (the surrounding per-line loop already exists, added 2026-08-22) produces a clean, strictly-alternating `[prefixCandidate, body, prefixCandidate, body, ...]` array with **no lookahead ambiguity at all**, because a literal split never has to guess where a match "could" have stopped. Verified against both known repros and the no-prefix / prefixed-normal cases before writing this task:

```
split('p•7/1 - 7/2 | Warzone Rumble•e•7/3 - 7/4 | Anniversary')
  → ['p', '7/1 - 7/2 | Warzone Rumble', 'e', '7/3 - 7/4 | Anniversary']
  → pairs (0,1) and (2,3) → title "Warzone Rumble" (correct), title "Anniversary" with category "event" (correct)
```

- [ ] **Step 1: Write the failing tests**

Append to `scripts/calendarOps.test.js` (matches its existing `check(name, fn)` harness and its existing convention of driving bugs through `ops.resolveOp('calendar.bulkAdd').validate(...)`, whose normalized shape is `{ title, date, endDate, isOngoing, category, isDoubleCP }` — verified live; note the field is `date`, not `startDate`, at this layer):

```js
check('calendar.bulkAdd: a title ending in a class letter is not truncated when the next entry is prefixed', () => {
    const r = ops.resolveOp('calendar.bulkAdd').validate({
        type: 'calendar.bulkAdd', payload: { text: 'p•7/1 - 7/2 | Warzone Rumble•e•7/3 - 7/4 | Anniversary' }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    const [first, second] = r.normalized.payload.parsed;
    assert.strictEqual(first.title, 'Warzone Rumble', 'the trailing "e" of "Rumble" must not be eaten as the next entry\'s prefix');
    assert.strictEqual(first.category, 'playlist', 'entry 1 must keep its own "p" prefix');
    assert.strictEqual(second.title, 'Anniversary');
    assert.strictEqual(second.category, 'event', 'entry 2 must still get its own "e" prefix, not lose it to entry 1');
});

check('calendar.bulkAdd: the original db-deferred-list repro ("Krai BR Mode")', () => {
    const r = ops.resolveOp('calendar.bulkAdd').validate({
        type: 'calendar.bulkAdd', payload: { text: 'p•6/1 - 6/2 | Krai BR Mode•e•7/18 - 7/19 | Anniversary' }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.parsed[0].title, 'Krai BR Mode', 'must not truncate to "Krai BR Mod"');
});
```

- [ ] **Step 2: Run the test file to confirm it fails**

```bash
node scripts/calendarOps.test.js
```
Expected: the two new checks print `✗`, with the `Warzone Rumble`/`Krai BR Mode` assertions failing against the current `Warzone Rumbl`/`Krai BR Mod` output; exit code 1.

- [ ] **Step 3: Replace the lookahead regex with the split-based parse**

In `utils/adminParser.js`, replace the comment + constant at (current) line 217-218:

```js
// Can't just bulkText.split('•') anymore -- the prefix letter sits BEFORE the bullet it belongs to, so a naive split leaves it dangling on the END of the PREVIOUS entry's content instead of tagging the entry that follows. This regex's non-greedy content group stops as early as possible, which is always right at the next real "[dpe]?•" boundary -- verified against legacy unprefixed text too (no prefix character = zero-width match, same split points as the old bulkText.split('•') behavior).
const BULLETED_ENTRY = /([depgm])?•\s*([\s\S]*?)(?=[depgm]?•|$)/g;
```

with:

```js
// A literal '•' is an unambiguous delimiter in this format (per buildCalendarEventFromParts's own header comment: '•' never appears inside content), so line.split('•') always yields a clean, strictly alternating [prefixCandidate, body, prefixCandidate, body, ...] array -- no regex guessing required. The PREVIOUS implementation used a non-greedy lookahead regex ("[depgm]?•|$") that had to GUESS where a body ended, and a non-greedy engine always prefers the EARLIEST position that satisfies the lookahead -- so whenever a title's own last character happened to be one of d/p/e/g/m and was immediately followed by a real bullet, it silently swallowed that trailing letter as if it were the NEXT entry's optional prefix, truncating the title by one character (found live 2026-08-22 19:30 EDT, "Krai BR Mode" -> "Krai BR Mod"; see docs/db-deferred-list.md). Splitting on the literal character has no such ambiguity: a segment is either exactly one of the five prefix letters (sitting alone between two bullets) or it is body text, and there is no position where the same character could plausibly be read as either.
```

Then replace the per-line consumer loop at (current) lines 228-234:

```js
        if (line.includes('•')) {
            let match;
            BULLETED_ENTRY.lastIndex = 0; // stateful global regex reused across lines -- reset or later lines silently start mid-pattern
            while ((match = BULLETED_ENTRY.exec(line)) !== null) {
                const built = buildCalendarEventFromParts(match[1], match[2]);
                if (built) parsedEvents.push(built);
            }
        } else {
```

with:

```js
        if (line.includes('•')) {
            // Pair the split output two at a time: even indices are the prefix candidate for the
            // entry that follows (possibly '', meaning no explicit prefix), odd indices are that
            // entry's body. A trailing unpaired fragment (an incomplete paste ending mid-bullet) is
            // silently dropped by the `i + 1 < parts.length` bound, same as it would have been before.
            const parts = line.split('•');
            for (let i = 0; i + 1 < parts.length; i += 2) {
                const prefixChar = /^[depgm]$/.test(parts[i]) ? parts[i] : undefined;
                const built = buildCalendarEventFromParts(prefixChar, parts[i + 1]);
                if (built) parsedEvents.push(built);
            }
        } else {
```

- [ ] **Step 4: Verify no other file references the now-removed `BULLETED_ENTRY` constant**

```bash
rg -n "BULLETED_ENTRY" utils/adminParser.js
```
Expected: zero matches (it was module-private and only used in the block just replaced).

- [ ] **Step 5: Run the full test file and confirm everything passes**

```bash
node scripts/calendarOps.test.js
```
Expected: exit code 0, including every pre-existing check (double-CP detection, unprefixed default category, title-case preservation, etc.) — this proves the fix didn't regress the cases that already worked.

- [ ] **Step 6: Check whether any already-saved calendar titles in the database are already truncated**

Per the original filing's own instruction — this is a real data-integrity question, not just a code-correctness one. Using the MongoDB MCP `find` tool (already loaded this session) against the connection this environment is configured for, state clearly which database (prod vs. dev) was checked:

```
find({ database: "<confirm prod or dev by name before running>", collection: "seasonaldatas", filter: {}, projection: { calendar: 1 }, limit: 50 })
```

Scan the returned `calendar[].title` values for any ending in a class letter (`d/p/e/g/m`) immediately followed by what looks like a missing final letter (e.g. "Warzone Rumbl", "Krai BR Mod"). If any are found, report them to Harkirat rather than silently editing production data — do not auto-correct titles without his sign-off.

- [ ] **Step 7: Run the full suite and commit**

```bash
npm test && npm run docs:audit
git add utils/adminParser.js scripts/calendarOps.test.js
git commit -m "fix(manage): stop calendar bulk-import from truncating titles ending in a prefix letter"
```

---

### Task 3: Detach `/colors`'s visibility from `/settings`

**Files:**
- Modify: `models/UserPreference.js:12` (add the new schema field)
- Modify: `commands/settings.js:97,179` (derive + render the 5th toggle row)
- Modify: `handlers/settings.js:101-108` (handle the two new toggle actions)
- Modify: `commands/colors.js:35-38` (switch `/colors`' own visibility resolution to the new field)
- Modify: `handlers/colors.js:44` (leave the `colors_view` button's resolution alone, but add a comment saying so is deliberate)

**Interfaces:** None — independent of every other task. No function signatures change; this only adds a schema field and a new pair of `handlers/settings.js` branch conditions following the exact pattern the other four toggles already use.

- [ ] **Step 1: Add the schema field**

In `models/UserPreference.js`, immediately after line 12 (`settingsVisibility: { type: String, default: 'public' },`):

```js
    colorsVisibility: { type: String, default: 'public' },
```

Default `'public'` matches `settingsVisibility`'s own default, so no existing user's effective `/colors` behavior changes the moment this ships — they keep seeing exactly what they see today until they touch the new toggle.

- [ ] **Step 2: Render the 5th toggle row on `/settings` page 0**

In `commands/settings.js`, add a derived variable alongside the other three at line 97:

```js
        const colorsVis = (prefs.colorsVisibility || 'public').toUpperCase();
```

Then add a 5th `buildToggleRow` call immediately after line 179 (`containerComponents.push(buildToggleRow('Settings Dashboard', settingsVis, ...))`), following the exact same pattern:

```js
            containerComponents.push(buildToggleRow('Colors', colorsVis, `toggle_colors_public`, `toggle_colors_ephemeral`));
```

- [ ] **Step 3: Wire the two new toggle actions**

In `handlers/settings.js`, add two lines immediately after the existing `settings_public`/`settings_ephemeral` pair (currently lines 107-108):

```js
            if (action === 'colors_public') prefs.colorsVisibility = 'public';
            if (action === 'colors_ephemeral') prefs.colorsVisibility = 'ephemeral';
```

- [ ] **Step 4: Switch `/colors`' own invocation to the new field**

In `commands/colors.js`, replace the comment and call at lines 35-38:

```js
        // No dedicated visibility preference field of its own -- reuses settingsVisibility, same as the "View Colors" button inside /settings itself, so behavior stays consistent between the two entry points unless this specific invocation explicitly overrides it.
```
```js
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'settingsVisibility' });
```

with:

```js
        // /colors has its OWN visibility preference (colorsVisibility), detached from settingsVisibility 2026-08-30 21:39 EDT per docs/ROADMAP.md -- the "View Colors" button ON the /settings panel deliberately still reads settingsVisibility (see handlers/colors.js's colors_view branch), so the two entry points to the same panel can now diverge on purpose.
```
```js
        const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'colorsVisibility' });
```

- [ ] **Step 5: Document why `colors_view` does NOT follow the same change**

In `handlers/colors.js`, at line 44 (`const isEphemeral = (prefs.settingsVisibility || 'public').toUpperCase() !== 'PUBLIC';`), add a comment directly above it:

```js
        // Deliberately still settingsVisibility, NOT colorsVisibility -- this button lives ON the /settings panel itself, and its own detached-visibility item (docs/ROADMAP.md) explicitly keeps "View Colors" tied to settings visibility while giving the STANDALONE /colors command its own preference. Do not "fix" this to match commands/colors.js.
```

- [ ] **Step 6: Manually verify the two entry points now diverge**

No new automated test exists for `/settings` panel rendering beyond the help snapshot (which doesn't cover this file) — run the dev bot and confirm behaviorally:

```bash
node --watch --env-file=.env.dev index.js
```
On the dev bot: open `/settings`, toggle "Colors" to Hidden while leaving "Settings Dashboard" Public. Then run `/colors` (bare, no visibility option) and confirm the response is ephemeral. Then click "View Colors" from the still-public `/settings` panel and confirm THAT response is public — proving the two are now independent.

- [ ] **Step 7: Run the full suite and commit**

```bash
npm test && npm run docs:audit
git add models/UserPreference.js commands/settings.js handlers/settings.js commands/colors.js handlers/colors.js
git commit -m "feat(settings): give /colors its own visibility preference, detached from /settings"
```

---

### Task 4: Fold `/invite` into `/help`'s Utilities category

**Files:**
- Modify: `commands/help.js` (COMMAND_ALIASES map, and the `utilities` entry in `CATEGORY_DEFS`)
- Modify: `scripts/fixtures/helpBodySnapshot.json` (regenerated, not hand-edited)
- Test: `scripts/helpBodySnapshot.test.js` (no code change — it re-asserts against the regenerated fixture)

**Interfaces:** None — independent of every other task. Uses the existing `cmd(name, { requires, suffix, description, options })` helper (`commands/help.js:68`) with no new parameters.

**Per Harkirat's decision (2026-08-30 21:22 EDT):** fold into Utilities, the smallest of the three options — `/help` itself stays unlisted in its own directory (a separate, still-open gap, not part of this task).

- [ ] **Step 1: Add the alias entry**

In `commands/help.js`'s `COMMAND_ALIASES` map, add a new line following the existing entries' style (alphabetically adjacent to `/gunsmiths` is fine, ordering here isn't load-bearing):

```js
    '/invite': ['add', 'install', 'addbot', 'share', 'link'],
```

Do **not** add `'server'` — that alias already belongs to `/admin` (per the existing `CATEGORY_ALIASES`/`COMMAND_ALIASES` comment on alias collisions).

- [ ] **Step 2: Add `/invite` to the Utilities category and reword its description**

In `commands/help.js`'s `CATEGORY_DEFS`, the `utilities` entry currently reads (around line 148):

```js
    {
        key: 'utilities', label: 'Utilities', emojiKey: 'eyedropper', dropdownDescription: 'Timestamp & profile color tools',
        staticCommands: [
            cmd('/colors', { ... }),
            cmd('/timestamp', { ... })
        ]
    },
```

Change `dropdownDescription` and add `/invite` as a third `staticCommands` entry:

```js
    {
        key: 'utilities', label: 'Utilities', emojiKey: 'eyedropper', dropdownDescription: 'Timestamp, profile color tools & sharing Dioreo',
        staticCommands: [
            cmd('/colors', {
                description: 'View the colors extracted from your Discord profile and pick which one accents your panels',
                options: [
                    { name: 'page', required: false, desc: 'Jump directly to Avatar, Banner, Name, Nameplate, or Deco' },
                    { name: 'source', required: false, desc: 'Read from your main profile, or your profile for this server' }
                ]
            }),
            cmd('/timestamp', {
                description: 'Convert almost any date or time — including natural language — into a Discord timestamp that displays correctly in everyone\'s own timezone',
                options: [
                    { name: 'datetime', required: true, desc: 'e.g. "tomorrow", "in 2 hours", "dec 25 at 9am", "19:30", "next monday"' },
                    { name: 'timezone', required: false, desc: (client) => `Defaults to your saved ${mentionCommand(client, '/settings')} timezone` },
                    { name: 'style', required: false, desc: 'Pick one format, or leave blank for all formats' },
                    { name: 'view', required: false, desc: 'Embed or plain Text, one-off only' }
                ]
            }),
            cmd('/invite', {
                description: 'Get a link to add Dioreo to a server or your own account, or a plain URL to share outside Discord'
            })
        ]
    },
```

(Only the `dropdownDescription` value and the new `cmd('/invite', ...)` entry are new; the two existing `cmd()` calls are unchanged — reproduced here in full because `staticCommands` is a single array literal and a partial edit instruction would be ambiguous about where the new entry's comma goes.)

- [ ] **Step 3: Regenerate the snapshot fixture**

This is an **intentional** rendering change, and `scripts/helpBodySnapshot.test.js`'s own header comment requires exactly this:

```bash
node scripts/fixtures/captureHelpSnapshot.mjs
```

- [ ] **Step 4: Confirm the fixture actually changed, and inspect the diff**

```bash
git diff scripts/fixtures/helpBodySnapshot.json
```
Expected: a diff touching the `utilities` category's rendered body/dropdown text across the permission matrices in `scripts/helpBodySnapshot.test.js`, adding the `/invite` line. If the diff is empty, Step 2's edit did not take effect — stop and re-check before proceeding.

- [ ] **Step 5: Run the snapshot test and confirm it passes against the new fixture**

```bash
node scripts/helpBodySnapshot.test.js
```
Expected: exit code 0.

- [ ] **Step 6: Manually confirm on the dev bot**

```bash
node --watch --env-file=.env.dev index.js
```
On the dev bot: `/help` → Utilities category → confirm `/invite` appears with the new description. Then `/help cmd:invite` and confirm it resolves to the Utilities detail page (not the landing page, which was the previously-correct-but-unhelpful behavior this task retires). Then `/help cmd:add` (one of the new aliases) and confirm it also resolves there.

- [ ] **Step 7: Run the full suite and commit**

```bash
npm test && npm run docs:audit
git add commands/help.js scripts/fixtures/helpBodySnapshot.json
git commit -m "feat(help): fold /invite into the Utilities category, per docs/db-deferred-list.md"
```

---

### Task 5: Read-only Atlas user for `scripts/analytics.mjs`

**Files:**
- Modify: `scripts/analytics.mjs:12-19` (env var fallback)

**Interfaces:** None — independent of every other task.

This task has two independent halves: a **code change** (regular risk, no confirmation needed) and an **infrastructure action** (explicit-permission checkpoint). The code change works correctly whether or not the Atlas user exists yet, per its own designed fallback.

- [ ] **Step 1: Add the env var fallback in code**

In `scripts/analytics.mjs`, replace:

```js
async function connectMongo() {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    const mongoose = require('mongoose');
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set (check .env)');
    await mongoose.connect(uri);
    return mongoose;
}
```

with:

```js
async function connectMongo() {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    const mongoose = require('mongoose');
    // Prefers a read-only credential scoped to this analysis path over the read-write MONGODB_URI
    // every other script uses, per docs/superpowers/specs/2026-08-16-observability-layer-design.md's
    // storage-growth section. Falls back to MONGODB_URI so this script keeps working before the
    // read-only user exists (see docs/db-deferred-list.md) or if ANALYTICS_READONLY_URI is ever unset.
    const uri = process.env.ANALYTICS_READONLY_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error('ANALYTICS_READONLY_URI or MONGODB_URI must be set (check .env)');
    await mongoose.connect(uri);
    return mongoose;
}
```

- [ ] **Step 2: Confirm existing script tests still pass**

```bash
node scripts/analytics.test.mjs
```
Expected: exit code 0 — this script's test does not currently exercise the URI-resolution branch directly (it was reading `MONGODB_URI` unconditionally before), so a pass here confirms no regression, not new coverage of the fallback itself.

- [ ] **Step 3: Run the script against the existing `.env` to confirm nothing broke**

```bash
node --env-file=.env scripts/analytics.mjs summary --days 7
```
Expected: same output shape as before this change (falls through to `MONGODB_URI` since `ANALYTICS_READONLY_URI` doesn't exist yet).

- [ ] **Step 4: Commit the code half independently**

```bash
git add scripts/analytics.mjs
git commit -m "feat(analytics): prefer a read-only Atlas credential when one is configured"
```

- [ ] **Step 5: CHECKPOINT — confirm before creating the live Atlas user**

**Do not proceed past this point without Harkirat's explicit go-ahead.** State plainly: "I'm about to create a new MongoDB Atlas database user named `<username>` with `read` role scoped to the `<database name>` database, in Atlas project `<projectId>`, for `scripts/analytics.mjs` to use instead of the production read-write credential. Confirm before I create it."

To determine the exact project and database name without ever printing the full connection string:

```bash
node -e "require('dotenv').config(); console.log(new URL(process.env.MONGODB_URI.replace('mongodb+srv://','https://')).pathname.slice(1) || '(default db)')"
```
(prints only the database name segment, never the credentials)

Then, read-only, to find the project id:

```
atlas-list-projects()
```

- [ ] **Step 6: On go-ahead, create the read-only user**

```
atlas-create-db-user({
  projectId: "<confirmed in Step 5>",
  username: "analytics-readonly",
  roles: [{ roleName: "read", databaseName: "<confirmed in Step 5>" }]
})
```

Leave `password` unset — the tool generates one. **Capture the generated password and connection string immediately and hand it to Harkirat directly (not left in this transcript) for him to add as `ANALYTICS_READONLY_URI` in prod's `.env`** — this repository has no mechanism to write to prod's `.env` from this task (that's Task 6's job for a different pair of variables, and even there it's SSH, not something this MCP tool does).

- [ ] **Step 7: Verify the new user is read-only**

```bash
node -e "
const { MongoClient } = require('mongodb');
(async () => {
  const client = new MongoClient(process.env.ANALYTICS_READONLY_URI);
  await client.connect();
  const db = client.db();
  try {
    await db.collection('analyticsevents').insertOne({ _test: true });
    console.log('❌ WRITE SUCCEEDED — the user is not actually read-only');
  } catch (e) {
    console.log('✅ write correctly rejected:', e.codeName || e.message);
  }
  await client.close();
})();
" 
```
Run this with `ANALYTICS_READONLY_URI` set in the environment (not committed anywhere). Expected: a rejected write (`Unauthorized` or similar).

---

### Task 6: Close the img2webp / prod cache-channel-env deploy blocker

**Files:** None in this repository — this is a VM-side package install and a prod `.env` edit, both outside version control by design.

**Interfaces:** None — independent of every other task.

This is the one item flagged as a genuine **v3 deploy blocker** with a silent failure mode: without it, every animated nameplate/decoration WebP render on prod quietly no-ops.

- [ ] **Step 1: Confirm SSH reaches the VM**

```bash
gcloud compute ssh diors-builds-bot --zone=us-east1-b --command="echo ok"
```
Expected: `ok`. (Already confirmed the instance itself is reachable and `RUNNING` via `gcloud compute instances describe`; this step confirms the SSH path specifically, which is a separate mechanism.)

- [ ] **Step 2: Confirm the package is actually missing (don't assume the filing is still current)**

```bash
gcloud compute ssh diors-builds-bot --zone=us-east1-b --command="which img2webp || echo MISSING"
```
Expected: `MISSING` (per the original filing). If it already exists, this half of the task is done — skip to Step 5 and only handle the env vars.

- [ ] **Step 3: Determine the correct env var values without exposing secrets**

Both channel IDs already exist in this repo's own `.env.dev` (gitignored, but present in this working copy) — they are Discord channel snowflake IDs for Harkirat's own "dioreoland" storage server, and per `utils/discordCdnStorage.js`'s header this is the SAME storage server the prod bot needs to join, so the same channel ids apply:

```bash
rg -n "^NAMEPLATE_CACHE_CHANNEL_ID=|^DECORATION_CACHE_CHANNEL_ID=" .env.dev
```

- [ ] **Step 4: CHECKPOINT — confirm before mutating the production VM**

**Do not proceed past this point without Harkirat's explicit go-ahead.** State plainly, naming the three concrete actions: "I'm about to (1) run `sudo apt-get install -y webp` on the prod VM, (2) append `NAMEPLATE_CACHE_CHANNEL_ID` and `DECORATION_CACHE_CHANNEL_ID` to prod's `.env` with the same values `.env.dev` uses, and (3) restart the bot via `./scripts/deploy.sh manual` to pick up the env change. Confirm before I run these." This also needs the prod bot to actually be invited to dioreoland with real channel permissions (per `CLAUDE.md`'s documented exception for these two cache channels) — confirm that invite has happened, or is happening in the same session, before this step does anything useful.

- [ ] **Step 5: Install the package**

```bash
gcloud compute ssh diors-builds-bot --zone=us-east1-b --command="sudo apt-get update && sudo apt-get install -y webp"
```

- [ ] **Step 6: Verify the binary is present**

```bash
gcloud compute ssh diors-builds-bot --zone=us-east1-b --command="which img2webp"
```
Expected: a path (e.g. `/usr/bin/img2webp`).

- [ ] **Step 7: Append the two env vars to prod's `.env` without ever printing the whole file**

Using the values read in Step 3 (substitute the real values in place of the placeholders below — never paste the actual channel ids into a shared transcript unnecessarily beyond what's needed to run the command):

```bash
gcloud compute ssh diors-builds-bot --zone=us-east1-b --command="grep -q '^NAMEPLATE_CACHE_CHANNEL_ID=' ~/dioreo/.env || echo 'NAMEPLATE_CACHE_CHANNEL_ID=<value>' | sudo tee -a ~/dioreo/.env >/dev/null"
gcloud compute ssh diors-builds-bot --zone=us-east1-b --command="grep -q '^DECORATION_CACHE_CHANNEL_ID=' ~/dioreo/.env || echo 'DECORATION_CACHE_CHANNEL_ID=<value>' | sudo tee -a ~/dioreo/.env >/dev/null"
```
(Confirm the actual prod repo path on the VM first if `~/dioreo` isn't it — check `docs/reference/deployment-and-ops.md` or `scripts/deploy.sh`'s own `cd` target if unsure; do not guess.)

- [ ] **Step 8: Verify the vars landed, without printing their values**

```bash
gcloud compute ssh diors-builds-bot --zone=us-east1-b --command="grep -c '^NAMEPLATE_CACHE_CHANNEL_ID=\|^DECORATION_CACHE_CHANNEL_ID=' ~/dioreo/.env"
```
Expected: `2`.

- [ ] **Step 9: Restart to pick up the env change**

```bash
gcloud compute ssh diors-builds-bot --zone=us-east1-b --command="cd ~/dioreo && ./scripts/deploy.sh manual"
```

- [ ] **Step 10: Verify the service is healthy after restart**

```bash
./scripts/vmstatus.sh
```
Expected: `diors-bot` active, no new errors since the restart.

- [ ] **Step 11: Note the still-owed behavioral verification**

A successful restart proves the env vars are set and the binary exists — it does **not** prove an animated nameplate actually renders as WebP through Discord's own CDN end to end. That needs a real `/colors` render of a user with an animated nameplate on prod, which is a live-Discord check, not a script. State this explicitly as still-owed after this task closes, per the original filing's own words: "a successful deploy proves nothing here, by construction."

---

## Self-Review

**Spec coverage:** all six `docs/db-deferred-list.md` / `docs/ROADMAP.md` items named by Harkirat have a task. The two design forks (`/invite` placement, landing-page reorg) were resolved directly with him before this plan was written, not left as open questions inside it.

**Placeholder scan:** every step carries real, verified code or a real, verified shell command — no `TBD`/`add appropriate handling`/`similar to Task N`. The two `<value>`/`<username>`/`<projectId>` placeholders in Tasks 5 and 6 are deliberate: they are secrets/ids that cannot be known until the corresponding checkpoint step reads them live, and both are explicitly called out as "substitute the real value" rather than left ambiguous about what they are.

**Type/shape consistency:** `parseBulkEvents`'s output shape (Task 2), `buildToggleRow`'s signature (Task 3), `cmd()`'s signature (Task 4), and `connectMongo()`'s signature (Task 5) are all reused unchanged from what already exists in the repo — verified by reading each call site directly rather than assumed from memory.

**Scope check:** each task is independently shippable and independently testable; none blocks another. This plan does not include the `/help` landing-page category reorg (deferred by Harkirat until `/draw calculator` finishes) or the Discord Developer Portal listing update (deferred by Harkirat to a post-v3 minor update) — both were explicitly excluded from scope during this session, not overlooked.

## Audit log — falsification pass (2026-08-30 21:40 EDT)

Before finalizing, each task's factual claims were checked against the live repo/environment rather than trusted from the original `docs/db-deferred-list.md` filings, which are sometimes stale relative to current code:

- **Task 2's premise was re-verified, not assumed.** The parser had already been partially refactored (2026-08-22 19:47 EDT, per its own comments) for an unrelated multi-line-swallowing bug, which could plausibly have also fixed this one as a side effect. It had not — `node -e "require('./utils/adminParser').parseBulkEvents(...)"` was run against the exact repro string before writing this task, confirming the bug still reproduces today, byte-for-byte as originally filed.
- **The proposed fix was tested against both known repros AND the no-ambiguity cases before being written into this plan** (a standalone Node scratch script, not committed), confirming the split-based approach produces the correct untruncated titles and correct per-entry categories in every case tried, including the previously-correct "no trailing-letter collision" cases (regression safety).
- **Task 2's test used the wrong field name in an early draft** (`startDate`) — corrected to `date` after running `ops.resolveOp('calendar.bulkAdd').validate(...)` live and reading its actual normalized output shape, rather than assuming it matched `parseBulkEvents`' own raw return shape one layer down.
- **Task 3's "leave `colors_view` alone" claim was verified by reading `handlers/colors.js:44` directly** rather than assumed from the ROADMAP item's prose — confirmed it currently reads `prefs.settingsVisibility` today, so the plan's Step 5 comment is accurate, not aspirational.
- **Task 4's fixture-regeneration requirement comes from `scripts/helpBodySnapshot.test.js`'s own header comment**, read directly, not inferred — it explicitly states any intentional rendering change must re-run the capture script.
- **Task 5's "the code degrades gracefully" claim matches the actual current code** (`scripts/analytics.mjs:12` already carries a comment describing exactly this intended fallback, confirming the fix direction was already decided by whoever wrote that comment, not invented fresh here).
- **Tasks 5 and 6's `gcloud`/Atlas capability claims were verified live before being written into the plan as executable steps**, not assumed from `scripts/vmstatus.sh`'s comments alone: `gcloud compute instances describe diors-builds-bot --zone us-east1-b` was actually run and returned `RUNNING`, and the MongoDB Atlas MCP tool schemas (`atlas-create-db-user` etc.) were actually loaded and inspected in this session, confirming write capability exists at the tool level. Neither task assumes SSH itself succeeds — Task 6 Step 1 verifies that specifically before anything mutating runs.
- **Residual risk, accepted rather than engineered around:** Task 2's split-based fix has one theoretical edge case — two adjacent literal bullets with nothing between them (`••`) would consume one pair as an empty, silently-dropped entry and shift alignment for everything after it on that line. This is not a new regression (the old regex's behavior on adjacent bullets was never characterized either), has zero observed real-world occurrences, and the format's own bullets come from a clean Notes-app list paste where this shouldn't arise — per this repo's own standing rule against inventing policy for a case with no evidence it occurs, this is noted rather than defended against.
