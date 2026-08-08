---
kind: plan
status: frozen
---

# /autobuild Loadout Automation PoC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a standalone admin-only `/autobuild` slash command that takes a CODM Gunsmith screenshot (or URL), extracts weapon/code/attachments via Gemini vision, lets the admin review/edit before anything is saved, then creates a real `Loadout` doc with an auto-generated Cloudinary-hosted image.

**Architecture:** One new command file (`commands/autobuild.js`) that only does option parsing + admin gating. All extraction/state/write logic lives in a new shared module (`utils/autobuildPipeline.js`), which both `commands/autobuild.js` and `index.js`'s button/modal handlers require — this avoids a circular require between `index.js` (the entry point, which exports nothing today) and a command file. Supporting pure-logic helpers (Gunsmith-code corrector, attachment fuzzy-corrector, weaponKey/build-numbering, Cloudinary upload) each get their own small addition to an existing or new `utils/` file.

**Tech Stack:** discord.js v14.26.4 (`SlashCommandBuilder.addAttachmentOption`, Components V2, raw `fetch` for Gemini REST), Mongoose (`Loadout` model, unchanged schema), Cloudinary Node SDK (already a dependency), Node's built-in `fetch`.

## Global Constraints

- Full behavioral source of truth: `docs/superpowers/specs/2026-07-19-loadout-automation-poc-design.md` — read it before starting if you haven't already.
- MP loadouts only. `mode` is always the literal string `'MP'` — no DMZ branch anywhere in this feature.
- Admin-only: every new custom_id this feature creates starts with `autobuild_` so it's covered by adding that one prefix to `index.js`'s existing `MANAGE_CUSTOM_ID_PREFIXES` array (`index.js:621`) — do not duplicate the `ALLOWED_ADMIN_ID` check by hand anywhere else.
- Model: `gemini-3.5-flash`, called via raw `fetch` against `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`, auth header `x-goog-api-key`. No new npm package.
- `GEMINI_API_KEY` is already in `.env` and confirmed live/working — reference via `process.env.GEMINI_API_KEY`. `.env` is loaded once at the top of `index.js` (`require('dotenv').config()` at `index.js:48`); command/utils files just read `process.env` directly, they never call `dotenv.config()` themselves.
- Never write a `Loadout` doc before the admin clicks Confirm. Never call Cloudinary before Confirm. Cancel must leave zero trace in Mongo or Cloudinary.
- Follow this codebase's comment convention: explain *why*, not *what*, especially for any non-obvious decision (see CLAUDE.md's "Maintaining context comments" section).
- Reuse existing helpers rather than reimplementing: `utils/search.js`'s `fuzzyMatch`/`normalizeForSearch`, `utils/loadoutRender.js`'s `buildImageUrl`/`checkImageExists`/`buildLoadoutCard`/`getMpCategoryAccent`, `utils/sendV2Payload.js`'s `sendV2Payload`, `utils/adminParser.js`'s `parseLoadoutBadges`.
- This repo has no automated test runner/framework configured (no `test` script in `package.json`, no Jest/Mocha) — "tests" in this plan mean small standalone `node` scratch-script verification runs, matching how every prior session in this repo has verified changes. Do not introduce a test framework as part of this feature.
- Every step that changes code shows the complete code to write — no "similar to above" shortcuts.

---

### Task 1: Gunsmith-code structural corrector

**Files:**
- Modify: `utils/adminParser.js` (add function after `parseLoadoutBadges`, ~line 249; add export at bottom, ~line 406)
- Test: scratch script under the scratchpad directory

**Interfaces:**
- Produces: `correctGunsmithCode(code: string): string` — exported from `utils/adminParser.js`.

CODM Gunsmith codes alternate Number-Letter-Number-Letter... for their full length (confirmed against a real `shareCode` value already referenced in this codebase — `commands/manage.js:484`'s placeholder example `1I2C6B8A9D`: positions 0/2/4/6/8 are digits, positions 1/3/5/7/9 are letters). A vision model reading a small in-game font is expected to occasionally misread a character as its visual look-alike from the WRONG class for its position. This corrector only touches a character when its position's expected type (digit vs. letter) doesn't match what's actually there, and only when a known look-alike mapping exists — an already-correct character, even one that happens to resemble something else, is never touched.

- [ ] **Step 1: Write the verification script**

Create `/private/tmp/claude-501/-Applications-Claude-Code-Diors-Builds/535689ee-aa29-4f2f-83d4-44407a4c8f58/scratchpad/test-code-corrector.js`:

```js
const { correctGunsmithCode } = require('/Applications/Claude Code/Diors-Builds/utils/adminParser');

// 10-char alternating Number-Letter codes: positions 0,2,4,6,8 = digit; 1,3,5,7,9 = letter
const cases = [
    ['1I2C6B8A9D', '1I2C6B8A9D'], // fully valid already -- must not be touched
    ['lI2C6B8A9D', '1I2C6B8A9D'], // digit-slot 0 misread as letter 'l' -> snap to '1'
    ['102C6B8A9D', '1O2C6B8A9D'], // letter-slot 1 misread as digit '0' -> snap to 'O'
    ['1I8C6B8A9D', '1I8C6B8A9D'], // digit-slot 2 already '8' (a real digit) -- unchanged, even though '8' visually resembles 'B'
    ['1I2C6B8A9l', '1I2C6B8A9I'], // letter-slot 9 misread as digit-ish 'l' -> snap to 'I'
];

let failures = 0;
for (const [input, expected] of cases) {
    const got = correctGunsmithCode(input);
    const pass = got === expected;
    if (!pass) failures++;
    console.log(`${input} -> ${got} (expected ${expected}) ${pass ? 'PASS' : 'FAIL'}`);
}
console.log(failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`);
```

- [ ] **Step 2: Run it to confirm it currently fails**

Run: `node /private/tmp/claude-501/-Applications-Claude-Code-Diors-Builds/535689ee-aa29-4f2f-83d4-44407a4c8f58/scratchpad/test-code-corrector.js` Expected: throws `TypeError: correctGunsmithCode is not a function` (export doesn't exist yet).

- [ ] **Step 3: Implement `correctGunsmithCode`**

Add to `utils/adminParser.js`, right after `parseLoadoutBadges` (after line 249, before the `PLACEHOLDER_IMAGE` constant):

```js
// Gunsmith-code structural corrector (added for /autobuild's vision-extraction pipeline) -- CODM
// Gunsmith share codes alternate Number-Letter-Number-Letter... for their full length (confirmed
// against a real shareCode already referenced in this codebase, manage.js's placeholder example
// "1I2C6B8A9D"). A vision model reading a small, low-contrast in-game font is expected to
// occasionally misread a character as its visual look-alike from the WRONG character class for its
// position -- a digit-shaped glyph landing in a letter slot, or vice versa. Position parity (even
// index = digit, odd index = letter) decides what a character SHOULD be; a small look-alike map
// decides what to snap it to if it's currently the wrong type. A character already the right type
// for its position is left completely untouched, even if it visually resembles something else (an
// '8' correctly sitting in a digit slot is never touched, even though '8' can also look like 'B') --
// this only fires on an actual type mismatch, never a same-type "does this look right" guess, which
// would risk corrupting already-correct input.
const DIGIT_TO_LETTER = { '0': 'O', '1': 'I', '8': 'B', '5': 'S' };
const LETTER_TO_DIGIT = { O: '0', I: '1', L: '1', B: '8', S: '5' };

function correctGunsmithCode(code) {
    if (!code) return code;
    return code.split('').map((ch, i) => {
        const expectDigit = i % 2 === 0; // position 0,2,4,... = digit; 1,3,5,... = letter
        if (expectDigit && /[A-Za-z]/.test(ch)) {
            return LETTER_TO_DIGIT[ch.toUpperCase()] || ch; // no known look-alike -- leave as-is
        }
        if (!expectDigit && /[0-9]/.test(ch)) {
            return DIGIT_TO_LETTER[ch] || ch;
        }
        return ch; // already the right type for its position -- untouched
    }).join('');
}
```

Add `correctGunsmithCode` to the `module.exports` object at the bottom of the file (line 406):

```js
module.exports = { toTitleCase, resolveTier, parseAdminDate, parseItemLine, parseBulkDrawList, parseBulkEvents, formatDrawsAsBulkText, formatAdminDate, parseLoadoutBadges, parseBulkLoadoutList, splitTitleDate, formatCalendarAsBulkText, formatPatchNotesAsText, formatLoadoutsAsBulkText, correctGunsmithCode };
```

- [ ] **Step 4: Run the verification script again**

Run: `node /private/tmp/claude-501/-Applications-Claude-Code-Diors-Builds/535689ee-aa29-4f2f-83d4-44407a4c8f58/scratchpad/test-code-corrector.js` Expected: `ALL PASS`, all 5 lines show `PASS`.

- [ ] **Step 5: Commit**

```bash
git add utils/adminParser.js
git commit -m "$(cat <<'EOF'
Add Gunsmith-code structural corrector for /autobuild pipeline

Deterministic Number-Letter alternation check with a look-alike map
(0/O, 1/I/l, 8/B, 5/S) -- snaps a character to the right type only
when its position expects the other type, never touches an already-
correct character. Feeds into the vision-extraction post-processing
step.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Gemini vision extraction module

**Files:**
- Create: `utils/visionExtract.js`
- Test: scratch script against a real screenshot URL

**Interfaces:**
- Consumes: `process.env.GEMINI_API_KEY` (already set).
- Produces: `extractLoadoutFromImage(imageUrl: string): Promise<{ weaponName: string, gunsmithCode: string, attachments: string[] }>` — throws on any failure (network error, non-200, malformed JSON, missing/wrong-shaped fields); `attachments` is always exactly 5 entries (padded with `''` if the model returned fewer). Callers (Task 6) must catch and handle the throw.

- [ ] **Step 1: Write the module**

Create `utils/visionExtract.js`:

```js
// utils/visionExtract.js
// Calls Gemini's vision API to extract structured loadout data from a Gunsmith screenshot. Isolated
// in its own module (per the design spec) so swapping vision backends later is a one-file change.
// Raw `fetch` REST call, no SDK dependency -- consistent with this repo's general "minimal deps"
// preference (utils/sendV2Payload.js does the same thing for Discord's own API).
//
// Model choice: gemini-3.5-flash, confirmed live against the real API during the 2026-07-19 design
// session via a `models.list` call -- picked over gemini-3.1-flash-lite because character-level read
// accuracy on the Gunsmith code matters here (lite trades accuracy for speed/cost in a way that
// works against adminParser.js's correctGunsmithCode(), whose whole job is cleaning up a FEW
// misreads, not compensating for a systematically less accurate model). Picked over the
// gemini-3-pro-preview/gemini-3.1-pro-preview family because those are `-preview` builds, not
// stable -- don't depend on a preview model for a live bot feature. Re-verify this is still the
// current recommended model before reusing this module elsewhere; new model families ship fast (see
// the design spec's own note on this exact choice going stale mid-session, from outdated training
// data, the first time it was picked).
const MODEL = 'gemini-3.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT = `You are looking at a screenshot of a Call of Duty Mobile (CODM) "Gunsmith" weapon customization screen. Extract exactly this information and respond with ONLY a JSON object, no markdown code fences, no extra text:

{
  "weaponName": "the weapon's name as shown on screen",
  "gunsmithCode": "the alphanumeric share code shown on screen (usually labeled 'Code' or similar, a short string alternating numbers and letters)",
  "attachments": ["attachment 1 name", "attachment 2 name", "attachment 3 name", "attachment 4 name", "attachment 5 name"]
}

The attachments array must contain exactly 5 strings, one per equipped attachment slot, in the order they appear on screen. If you cannot find a value for a field, use an empty string for that field (or an empty array entry for a missing attachment) rather than omitting the key.`;

async function extractLoadoutFromImage(imageUrl) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    // Gemini's generateContent accepts an image as inline base64 bytes, not an arbitrary URL it
    // fetches itself -- download the source image ourselves first, same "resolve the image locally
    // before doing anything else with it" shape this repo's other image-processing utils already
    // use (e.g. utils/stillFrame.js, utils/colorExtract.js).
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`Failed to download source image: HTTP ${imageRes.status}`);
    const contentType = imageRes.headers.get('content-type') || 'image/png';
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const base64Image = imageBuffer.toString('base64');

    const requestBody = {
        contents: [{
            parts: [
                { text: PROMPT },
                { inline_data: { mime_type: contentType, data: base64Image } }
            ]
        }],
        generationConfig: { responseMimeType: 'application/json' }
    };

    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gemini API returned HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Gemini response had no extractable text content');

    let parsed;
    try {
        parsed = JSON.parse(rawText);
    } catch {
        throw new Error(`Gemini response was not valid JSON: ${rawText.slice(0, 300)}`);
    }

    if (typeof parsed.weaponName !== 'string' || typeof parsed.gunsmithCode !== 'string' || !Array.isArray(parsed.attachments)) {
        throw new Error(`Gemini response missing required fields: ${JSON.stringify(parsed).slice(0, 300)}`);
    }

    // Pad/truncate to exactly 5 -- the review card always shows 5 slots; a short array would leave
    // later slots as `undefined` rather than an editable empty string.
    const attachments = [0, 1, 2, 3, 4].map(i => parsed.attachments[i] || '');

    return { weaponName: parsed.weaponName, gunsmithCode: parsed.gunsmithCode, attachments };
}

module.exports = { extractLoadoutFromImage };
```

- [ ] **Step 2: Verify with a real screenshot URL**

You need a real CODM Gunsmith screenshot URL. Get one by querying an existing loadout via the MongoDB MCP tool (`find` on the `loadouts` collection, any `mode:'MP'` doc) and constructing its Cloudinary URL: `https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/<imageKey>` (or ask Harkirat for a fresh screenshot URL directly).

Write `/private/tmp/claude-501/-Applications-Claude-Code-Diors-Builds/535689ee-aa29-4f2f-83d4-44407a4c8f58/scratchpad/test-vision-extract.js`:

```js
require('dotenv').config({ path: '/Applications/Claude Code/Diors-Builds/.env' });
const { extractLoadoutFromImage } = require('/Applications/Claude Code/Diors-Builds/utils/visionExtract');

extractLoadoutFromImage(process.argv[2])
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(err => console.error('FAILED:', err.message));
```

Run: `node /private/tmp/.../scratchpad/test-vision-extract.js "<a real image URL>"` Expected: a JSON object with `weaponName`, `gunsmithCode`, and a 5-element `attachments` array printed, no `FAILED:` line. Sanity-check the extracted weapon name is plausible for whatever image you used — exact accuracy isn't the point of this check, confirming the full round trip (download → Gemini call → JSON parse → returned shape) works with zero thrown errors is.

- [ ] **Step 3: Commit**

```bash
git add utils/visionExtract.js
git commit -m "$(cat <<'EOF'
Add Gemini vision extraction module for /autobuild

extractLoadoutFromImage(imageUrl) downloads the source image, sends it
to gemini-3.5-flash with a structured-JSON prompt, and returns
{weaponName, gunsmithCode, attachments[5]}. Raw fetch, no SDK. Throws
on any failure -- callers must not write anything until this resolves.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Attachment fuzzy-correction helper

**Files:**
- Modify: `utils/adminParser.js` (add function after `correctGunsmithCode` from Task 1; add `require('./search')` destructure near the top if not already present; add export)
- Test: scratch script

**Interfaces:**
- Consumes: `utils/search.js`'s `fuzzyMatch(query, target): boolean` and `normalizeForSearch(str): string` (both already exist, no changes needed).
- Produces: `correctAttachmentName(extracted: string, knownAttachments: string[]): string` — exported from `utils/adminParser.js`.

`fuzzyMatch(query, target)` checks whether `normalize(target)` *contains* `normalize(query)` as a substring. Because either the extracted text or the true stored name could be the "noisier" one (extra/missing characters), check for an exact normalized match first, then try `fuzzyMatch` in both directions before giving up.

- [ ] **Step 1: Write the verification script**

Create `/private/tmp/claude-501/-Applications-Claude-Code-Diors-Builds/535689ee-aa29-4f2f-83d4-44407a4c8f58/scratchpad/test-attachment-correct.js`:

```js
const { correctAttachmentName } = require('/Applications/Claude Code/Diors-Builds/utils/adminParser');

const known = ['Gauge-9 Mono', 'Crown-H3 Barrel', 'OWC Skeleton Stock', 'YKM Combat Stock', 'Fabric Grip'];

const cases = [
    ['Gauge-9 Mono', 'Gauge-9 Mono'],       // exact match, unchanged
    ['gauge9mono', 'Gauge-9 Mono'],         // normalized-equal -> canonical spelling
    ['Gauge-9 Mo', 'Gauge-9 Mono'],         // truncated read -- substring match resolves to canonical
    ['Some Totally New Attachment', 'Some Totally New Attachment'], // no match -> passes through untouched
];

let failures = 0;
for (const [input, expected] of cases) {
    const got = correctAttachmentName(input, known);
    const pass = got === expected;
    if (!pass) failures++;
    console.log(`${input} -> ${got} (expected ${expected}) ${pass ? 'PASS' : 'FAIL'}`);
}
console.log(failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`);
```

- [ ] **Step 2: Run it to confirm it currently fails**

Run: `node /private/tmp/.../scratchpad/test-attachment-correct.js` Expected: throws (function doesn't exist yet).

- [ ] **Step 3: Implement `correctAttachmentName`**

Check the top of `utils/adminParser.js` (lines 1-5) for existing `require` statements. Add this new one alongside them (do not duplicate if `./search` is somehow already required):

```js
const { fuzzyMatch, normalizeForSearch } = require('./search');
```

Add to `utils/adminParser.js`, right after `correctGunsmithCode`:

```js
// Fuzzy-corrects one vision-extracted attachment name against the set of attachment strings already
// used somewhere in the Loadout collection -- a vision model reading a small in-game label can get
// spacing/punctuation/capitalization slightly wrong ("Gauge-9 Mo" for "Gauge-9 Mono") even when it
// got the actual attachment right. Checks for an exact normalized match first (cheapest, most common
// case once the model gets it basically right), then falls back to a two-directional fuzzyMatch scan
// (either string could be the "noisier" one depending on what the model added or dropped) so a real
// but imperfect read still resolves to the canonical stored spelling. No match at all -- likely a
// genuinely new attachment CODM just added -- passes the extracted text through untouched rather than
// forcing it onto something wrong.
function correctAttachmentName(extracted, knownAttachments) {
    if (!extracted) return extracted;
    const normalizedExtracted = normalizeForSearch(extracted);

    const exact = knownAttachments.find(known => normalizeForSearch(known) === normalizedExtracted);
    if (exact) return exact;

    const fuzzy = knownAttachments.find(known => fuzzyMatch(extracted, known) || fuzzyMatch(known, extracted));
    return fuzzy || extracted;
}
```

Add `correctAttachmentName` to `module.exports`:

```js
module.exports = { toTitleCase, resolveTier, parseAdminDate, parseItemLine, parseBulkDrawList, parseBulkEvents, formatDrawsAsBulkText, formatAdminDate, parseLoadoutBadges, parseBulkLoadoutList, splitTitleDate, formatCalendarAsBulkText, formatPatchNotesAsText, formatLoadoutsAsBulkText, correctGunsmithCode, correctAttachmentName };
```

- [ ] **Step 4: Run the verification script again**

Run: `node /private/tmp/.../scratchpad/test-attachment-correct.js` Expected: `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add utils/adminParser.js
git commit -m "$(cat <<'EOF'
Add attachment fuzzy-correction helper for /autobuild pipeline

correctAttachmentName() snaps a vision-extracted attachment string to
its canonical spelling already in the Loadout collection (exact
normalized match first, then a two-directional fuzzyMatch fallback),
leaving genuinely unmatched text untouched.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Cloudinary loadout-image upload module

**Files:**
- Create: `utils/loadoutImageCache.js`
- Test: scratch script against a real image URL, verified via the Cloudinary MCP tool

**Interfaces:**
- Produces: `uploadLoadoutImage(sourceUrl: string, imageKey: string): Promise<{ success: boolean, error: string|null }>` — never throws (matches `utils/cloudinaryCache.js`'s never-throw convention), folder is always `gun-builds`, `public_id` is exactly `imageKey` (bare, NOT folder-prefixed — `gun-builds` is dynamic-folder mode, decoupled from the public_id path, per CLAUDE.md's Cloudinary workflow docs and matching how `asset_folder` already works in `utils/cloudinaryCache.js`).

- [ ] **Step 1: Write the module**

Create `utils/loadoutImageCache.js`:

```js
// utils/loadoutImageCache.js
// Uploads a screenshot (already confirmed by the admin during /autobuild's review step) into
// Cloudinary under a specific, pre-computed Public ID key -- distinct from utils/cloudinaryCache.js
// (which derives its OWN key from a title slug for draw thumbnails) because here the caller has
// already decided the exact key (WEAPON-NAME-N, computed by utils/loadoutRender.js's
// computeWeaponKeyAndBuild) and just needs it uploaded verbatim. Also distinct from
// utils/patchNotesCache.js's season-scoped retention model -- loadout images have no expiry at all
// (same as every other admin-added loadout image), so there's no pruning logic here, just upload.
//
// SECURITY: same rule as utils/cloudinaryCache.js and utils/patchNotesCache.js -- never log a raw
// Cloudinary error object. The Admin/Upload API's rejected-promise can carry the account's live API
// key+secret in `request_options.auth`; only ever read `.message`/`.error.message` off a caught error.
const cloudinary = require('cloudinary').v2;

const FOLDER = 'gun-builds'; // same flat folder every existing loadout image already lives in

function safeErrorMessage(err) {
    return err?.message || err?.error?.message || 'Unknown Cloudinary error';
}

// Remote-URL-to-remote-URL upload (Cloudinary fetches the bytes server-side, same pattern as
// utils/cloudinaryCache.js's cacheThumbnail) -- overwrite: true so a retry (see the design spec's
// retry_token flow) safely re-uploads under the exact same key rather than erroring on a collision.
async function uploadLoadoutImage(sourceUrl, imageKey) {
    try {
        await cloudinary.uploader.upload(sourceUrl, {
            public_id: imageKey, // bare key, NOT folder-prefixed -- gun-builds is dynamic-folder mode,
                                  // decoupled from public_id (see CLAUDE.md's Cloudinary workflow docs)
            asset_folder: FOLDER,
            overwrite: true,
            invalidate: true,
            resource_type: 'image'
        });
        return { success: true, error: null };
    } catch (err) {
        const message = safeErrorMessage(err);
        console.error(`Loadout image upload failed for key "${imageKey}": ${message}`);
        return { success: false, error: message };
    }
}

module.exports = { uploadLoadoutImage, FOLDER };
```

- [ ] **Step 2: Verify with a real image URL**

Write `/private/tmp/.../scratchpad/test-loadout-image-upload.js`:

```js
require('dotenv').config({ path: '/Applications/Claude Code/Diors-Builds/.env' });
const { uploadLoadoutImage } = require('/Applications/Claude Code/Diors-Builds/utils/loadoutImageCache');

uploadLoadoutImage(process.argv[2], 'AUTOBUILD-TEST-DELETE-ME')
    .then(result => console.log(JSON.stringify(result)));
```

Run: `node /private/tmp/.../scratchpad/test-loadout-image-upload.js "<a real image URL>"` Expected: `{"success":true,"error":null}`.

Then verify via the Cloudinary MCP tool (`get-asset-details` on public_id `AUTOBUILD-TEST-DELETE-ME`, or `search-assets`) that it actually landed in the `gun-builds` folder under that exact key — then delete it via the MCP tool's `delete-asset` so this test upload doesn't linger in the real account.

- [ ] **Step 3: Commit**

```bash
git add utils/loadoutImageCache.js
git commit -m "$(cat <<'EOF'
Add Cloudinary upload module for /autobuild loadout images

uploadLoadoutImage(sourceUrl, imageKey) uploads under a pre-computed
key into the existing gun-builds folder. Never throws, sanitizes any
Cloudinary error before logging (same convention as
cloudinaryCache.js/patchNotesCache.js).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Build-numbering + weaponKey helper

**Files:**
- Modify: `utils/loadoutRender.js` (add function after `buildImageUrl`, ~line 51; add to `module.exports`, ~line 277)
- Test: scratch script, cross-checked against real Mongo data via the MongoDB MCP tool

**Interfaces:**
- Produces: `computeWeaponKeyAndBuild(weaponName: string, existingBuildNames: string[]): { weaponKey: string, buildName: string, imageKey: string }` — pure function, no I/O. Stays model-agnostic (takes `existingBuildNames` as a plain array, doesn't import `Loadout` itself) matching every other `utils/` file's convention in this repo (e.g. `utils/cloudinaryCache.js`'s `pruneExpiredThumbnails(currentUrls)` takes data as a parameter rather than querying Mongo itself).

- [ ] **Step 1: Confirm the real imageKey convention against live data**

Before writing the test cases, confirm the exact convention this codebase already uses for a single-word weapon name (no space to turn into a hyphen). Query the `Loadout` collection via the MongoDB MCP tool for a single-word weapon (e.g. `find` with `{weaponName: {$regex: '^BP50$', $options: 'i'}}` or similar) and note its real `imageKey`. Use that confirmed value (not a guess) in Step 2's test cases below.

- [ ] **Step 2: Write the verification script**

Create `/private/tmp/claude-501/-Applications-Claude-Code-Diors-Builds/535689ee-aa29-4f2f-83d4-44407a4c8f58/scratchpad/test-build-numbering.js`:

```js
const { computeWeaponKeyAndBuild } = require('/Applications/Claude Code/Diors-Builds/utils/loadoutRender');

const cases = [
    // [weaponName, existingBuildNames, expected]
    ['Holger 26', [], { weaponKey: 'holger26', buildName: 'Build 1', imageKey: 'HOLGER-26-1' }],
    ['Holger 26', ['Build 1'], { weaponKey: 'holger26', buildName: 'Build 2', imageKey: 'HOLGER-26-2' }],
    // Gap-safe: Build 2 was deleted, only Build 1 and Build 3 remain -- next must be Build 4, not a
    // colliding Build 3 (a naive count-based "existingBuildNames.length + 1" would wrongly compute 3 here)
    ['Holger 26', ['Build 1', 'Build 3'], { weaponKey: 'holger26', buildName: 'Build 4', imageKey: 'HOLGER-26-4' }],
    // Non-"Build N"-shaped existing names (an admin-typed variant label) are ignored for numbering purposes
    ['Holger 26', ['Aggressive Flex', 'Build 1'], { weaponKey: 'holger26', buildName: 'Build 2', imageKey: 'HOLGER-26-2' }],
];

let failures = 0;
for (const [name, existing, expected] of cases) {
    const got = computeWeaponKeyAndBuild(name, existing);
    const pass = JSON.stringify(got) === JSON.stringify(expected);
    if (!pass) failures++;
    console.log(`${name} + [${existing}] -> ${JSON.stringify(got)} (expected ${JSON.stringify(expected)}) ${pass ? 'PASS' : 'FAIL'}`);
}
console.log(failures === 0 ? 'ALL PASS' : `${failures} FAILURE(S)`);
```

(These 4 cases only use multi-word weapon names, sidestepping the single-word convention question — add one more case here using the real single-word weapon + real `imageKey` convention confirmed in Step 1 before moving on, so that convention is actually covered by a test.)

- [ ] **Step 3: Run it to confirm it currently fails**

Run: `node /private/tmp/.../scratchpad/test-build-numbering.js` Expected: throws (function doesn't exist yet).

- [ ] **Step 4: Implement `computeWeaponKeyAndBuild`**

Add to `utils/loadoutRender.js`, right after `buildImageUrl` (after line 51):

```js
// Deterministic weaponKey + next-build-number + Cloudinary-key computation for /autobuild -- no AI
// involved (per the design spec). weaponKey matches the exact convention every other write site in
// this codebase already uses (index.js's add_loadout_/edit_loadout_ handlers: lowercase, spaces
// stripped). buildName follows a plain "Build N" convention specific to auto-created loadouts (there's
// no human-typed variant label like "Aggressive Flex" available from a screenshot) -- N is computed
// from the HIGHEST existing "Build N" number among this weapon's current builds, not a count, so a
// deleted build in the middle can't produce a colliding buildName. Non-"Build N"-shaped existing names
// are simply ignored for this max-finding purpose, not treated as errors.
// imageKey follows the documented convention (CLAUDE.md's "Recommended naming convention" note):
// WeaponKey-BuildNum, all-caps, hyphens preserved from the weapon name's own word breaks (a
// multi-word name like "Holger 26" becomes "HOLGER-26", a single-word name stays single-word with no
// hyphen invented that wasn't already implied by a space).
function computeWeaponKeyAndBuild(weaponName, existingBuildNames) {
    const weaponKey = weaponName.toLowerCase().replace(/\s+/g, '');

    let maxBuildNum = 0;
    for (const name of existingBuildNames) {
        const match = /^Build (\d+)$/.exec(name || '');
        if (match) maxBuildNum = Math.max(maxBuildNum, parseInt(match[1], 10));
    }
    const nextBuildNum = maxBuildNum + 1;

    const imageBase = weaponName.trim().toUpperCase().replace(/\s+/g, '-');
    const imageKey = `${imageBase}-${nextBuildNum}`;

    return { weaponKey, buildName: `Build ${nextBuildNum}`, imageKey };
}
```

Add `computeWeaponKeyAndBuild` to `module.exports` (line 277):

```js
module.exports = { buildImageUrl, checkImageExists, buildLoadoutCard, getMpCategoryAccent, displayCategoryLabel, computeWeaponKeyAndBuild };
```

- [ ] **Step 5: Run the verification script again**

Run: `node /private/tmp/.../scratchpad/test-build-numbering.js` Expected: `ALL PASS`.

- [ ] **Step 6: Commit**

```bash
git add utils/loadoutRender.js
git commit -m "$(cat <<'EOF'
Add deterministic weaponKey/build-numbering helper for /autobuild

computeWeaponKeyAndBuild() derives weaponKey (matching the existing
add/edit-loadout convention), the next "Build N" name (max-existing+1,
gap-safe), and the WEAPON-NAME-N Cloudinary key -- pure function, no
I/O, no AI.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Pipeline module + `/autobuild` command file (options, extraction, review card)

**Files:**
- Create: `utils/autobuildPipeline.js`
- Create: `commands/autobuild.js`
- Modify: `index.js` (add `'autobuild_'` to `MANAGE_CUSTOM_ID_PREFIXES` at line 621)
- Test: `node -c` syntax check + `require()` smoke test (real Discord-interaction testing happens in Task 7)

**Interfaces:**
- Consumes: `extractLoadoutFromImage` (Task 2), `correctAttachmentName`/`correctGunsmithCode`/`parseLoadoutBadges` (Tasks 1/3/existing), `Loadout` model (existing).
- Produces (from `utils/autobuildPipeline.js`): `pendingAutobuilds` (a `Map`, token → `{ weaponName, gunsmithCode, attachments: string[5], category: string|null, badgesRaw: string, mode: 'MP', sourceImageUrl: string, adminId: string }`), `buildReviewCard(token, data)`, `runExtraction(interaction, sourceImageUrl, explicitCategory, badgesOption)`. Consumed by `commands/autobuild.js`'s `execute()` and by Tasks 7/8's `index.js` handlers.

This task covers option validation, category/badges resolution, extraction, post-processing, and rendering the FIRST review card (Confirm/Edit/Cancel buttons wired with the right custom_ids, but their handlers don't exist until Tasks 7/8 — a click before then will correctly do nothing, which is expected mid-plan).

- [ ] **Step 1: Add `'autobuild_'` to the admin-guard prefix list**

In `index.js`, find `MANAGE_CUSTOM_ID_PREFIXES` (line 621):

```js
const MANAGE_CUSTOM_ID_PREFIXES = [
    'mng_', 'modal_', 'add_loadout_', 'edit_loadout_', 'edit_calendar_', 'edit_draw_', 'add_draw_'
];
```

Change to:

```js
const MANAGE_CUSTOM_ID_PREFIXES = [
    'mng_', 'modal_', 'add_loadout_', 'edit_loadout_', 'edit_calendar_', 'edit_draw_', 'add_draw_',
    'autobuild_' // /autobuild's review-card buttons + edit modal (2026-07-19) -- same admin-only lock
];
```

- [ ] **Step 2: Create `utils/autobuildPipeline.js`**

```js
// utils/autobuildPipeline.js
// Shared state + logic for /autobuild, required from BOTH commands/autobuild.js's execute() (initial
// invocation) and index.js's button/modal handlers (Confirm/Edit/Cancel/retry, added in Tasks 7/8).
// Kept out of commands/autobuild.js itself so index.js can reach the same pendingAutobuilds Map
// without a circular require -- index.js is the entry point and exports nothing today; every command
// file already requires shared logic FROM utils/, never the reverse. Full design:
// docs/superpowers/specs/2026-07-19-loadout-automation-poc-design.md.
const crypto = require('crypto');
const Loadout = require('../models/Loadout');
const { extractLoadoutFromImage } = require('./visionExtract');
const { correctAttachmentName, correctGunsmithCode } = require('./adminParser');
const { sendV2Payload } = require('./sendV2Payload');

// token -> { weaponName, gunsmithCode, attachments[5], category, badgesRaw, mode:'MP', sourceImageUrl, adminId }
// Same short-lived-token pattern as index.js's pendingManageEdits (10 min TTL, set at insertion time
// by whichever function stashes a new entry).
const pendingAutobuilds = new Map();

// Ephemeral review card: weapon/code/attachments/category/badges as extracted so far, plus the RAW
// source screenshot as the preview image (not yet uploaded to Cloudinary -- see the design spec for
// why: an edited weapon name during review must never orphan an upload under the wrong key).
function buildReviewCard(token, data) {
    const categoryLine = data.category ? data.category : '⚠️ needs review (use Edit to set one)';
    const attachmentsLines = data.attachments.map((a, i) => `${i + 1}. \`${a || '(empty)'}\``).join('\n');
    const badgesLine = data.badgesRaw && data.badgesRaw.trim()
        ? data.badgesRaw.trim()
        : '_(none entered -- will inherit from an existing build of this weapon if one exists)_';

    const container = {
        type: 17,
        accent_color: 2829617, // neutral gray (DEFAULT_MP_ACCENT below) -- category may still be unresolved at review time, so this card never guesses a per-category color
        components: [
            { type: 10, content: `# Review Extracted Loadout` },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: `**Weapon:** ${data.weaponName}\n**Category:** ${categoryLine}\n**Gunsmith Code:** \`${data.gunsmithCode}\`` },
            { type: 10, content: `**Attachments:**\n${attachmentsLines}` },
            { type: 10, content: `**Badges:** ${badgesLine}` },
            { type: 12, items: [{ media: { url: data.sourceImageUrl } }] },
            { type: 14, spacing: 1, divider: true },
            {
                type: 1,
                components: [
                    { type: 2, style: 3, label: 'Confirm', custom_id: `autobuild_confirm_${token}` },
                    { type: 2, style: 1, label: 'Edit', custom_id: `autobuild_editbtn_${token}` },
                    { type: 2, style: 4, label: 'Cancel', custom_id: `autobuild_cancel_${token}` }
                ]
            }
        ]
    };
    return { components: [container], flags: 32768 };
}

// Category: explicit option > an existing sibling build's category > unresolved (null).
// Badges: explicit option > (if blank) an existing sibling's badges, reconstructed as a token string
// > empty (per the design spec's "blank inherits from an existing build if one exists" rule).
async function resolveCategoryAndBadges(weaponName, explicitCategory, badgesOption) {
    const weaponKey = weaponName.toLowerCase().replace(/\s+/g, '');
    let category = explicitCategory || null;
    let badgesRaw = badgesOption || '';

    if (!category || !badgesRaw.trim()) {
        const sibling = await Loadout.findOne({ weaponKey, mode: 'MP' }).lean();
        if (sibling) {
            if (!category) category = sibling.category;
            if (!badgesRaw.trim()) {
                badgesRaw = [sibling.isMeta ? 'meta' : null, sibling.categoryRank, sibling.isToxic ? 'toxic' : null].filter(Boolean).join(',');
            }
        }
    }
    return { category, badgesRaw };
}

// Runs extraction + post-processing + stashes a pending token, then sends the review card as this
// interaction's own deferred reply. Caller must have already called interaction.deferReply({ephemeral:true}).
async function runExtraction(interaction, sourceImageUrl, explicitCategory, badgesOption) {
    let extracted;
    try {
        extracted = await extractLoadoutFromImage(sourceImageUrl);
    } catch (err) {
        console.error('Autobuild extraction failed:', err.message);
        return interaction.followUp({ content: `❌ Couldn't extract loadout data from that image: ${err.message}` });
    }

    const allLoadouts = await Loadout.find({ mode: 'MP' }).select('attachments').lean();
    const knownAttachments = [...new Set(allLoadouts.flatMap(l => l.attachments))];
    const correctedAttachments = extracted.attachments.map(a => correctAttachmentName(a, knownAttachments));
    const correctedCode = correctGunsmithCode(extracted.gunsmithCode);

    const { category, badgesRaw } = await resolveCategoryAndBadges(extracted.weaponName, explicitCategory, badgesOption);

    const token = crypto.randomBytes(8).toString('hex');
    const data = {
        weaponName: extracted.weaponName,
        gunsmithCode: correctedCode,
        attachments: correctedAttachments,
        category,
        badgesRaw,
        mode: 'MP',
        sourceImageUrl,
        adminId: interaction.user.id
    };
    pendingAutobuilds.set(token, data);
    setTimeout(() => pendingAutobuilds.delete(token), 10 * 60 * 1000).unref();

    const card = buildReviewCard(token, data);
    return sendV2Payload(interaction, card.components, { flags: card.flags });
}

module.exports = { pendingAutobuilds, buildReviewCard, resolveCategoryAndBadges, runExtraction };
```

- [ ] **Step 3: Create `commands/autobuild.js`**

```js
// commands/autobuild.js
// Screenshot -> Gemini vision extraction -> review/edit -> Cloudinary upload -> Loadout doc, gated
// behind an explicit admin Confirm step. Full design: docs/superpowers/specs/2026-07-19-loadout-
// automation-poc-design.md. Admin-only (same ALLOWED_ADMIN_ID as /manage), MP-only for this PoC.
// Extraction/state/write logic lives in utils/autobuildPipeline.js, shared with index.js's button/
// modal handlers for Confirm/Edit/Cancel/retry -- this file only does option parsing + admin gating.
const { SlashCommandBuilder } = require('discord.js');
const { ALLOWED_ADMIN_ID } = require('./manage');
const { runExtraction } = require('../utils/autobuildPipeline');

const CATEGORY_CHOICES = ['AR', 'SMG', 'LMG', 'MARKSMAN', 'SNIPER', 'SHOTGUN', 'SECONDARIES'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autobuild')
        .setDescription('Extract an MP loadout from a Gunsmith screenshot (admin-only PoC)')
        .setDefaultMemberPermissions(0)
        .addAttachmentOption(option => option.setName('screenshot').setDescription('The Gunsmith screenshot (or use the url option instead)'))
        .addStringOption(option => option.setName('url').setDescription('A URL to the screenshot, instead of an attachment'))
        .addStringOption(option => option.setName('category').setDescription('Weapon category (optional -- will look up or ask if omitted)').addChoices(...CATEGORY_CHOICES.map(c => ({ name: c, value: c }))))
        .addStringOption(option => option.setName('badges').setDescription('meta,best,top5,toxic (optional -- blank inherits from an existing build of this weapon)'))
        .addStringOption(option => option.setName('retry_token').setDescription('Only used when re-submitting an image after a Cloudinary upload failure'))
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),

    async execute(interaction) {
        if (interaction.user.id !== ALLOWED_ADMIN_ID) {
            return interaction.reply({ content: "🔒 **This one's admin-only.** Try any of the bot's public commands instead!", ephemeral: true });
        }

        const attachment = interaction.options.getAttachment('screenshot');
        const url = interaction.options.getString('url');
        const retryToken = interaction.options.getString('retry_token');
        const imageUrl = attachment ? attachment.url : (url ? url.trim() : null);

        // retry_token path (Task 7 adds retryImageUpload) -- Discord modals can't accept file
        // attachments, so "ask for the image again" after a Cloudinary failure has to be a fresh
        // slash-command invocation, not a button/modal round-trip. See the design spec's "Image
        // retry mechanism" decision.
        if (retryToken) {
            if (!imageUrl) {
                return interaction.reply({ content: '❌ Provide `screenshot` or `url` with a retry_token.', ephemeral: true });
            }
            await interaction.deferReply({ ephemeral: true });
            const { retryImageUpload } = require('../utils/autobuildPipeline');
            return retryImageUpload(interaction, retryToken, imageUrl);
        }

        if ((attachment && url) || (!attachment && !url)) {
            return interaction.reply({ content: '❌ Provide exactly one of `screenshot` or `url`.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });
        const category = interaction.options.getString('category');
        const badges = interaction.options.getString('badges');
        return runExtraction(interaction, imageUrl, category, badges);
    }
};
```

Note: `retryImageUpload` is required lazily inside the `if (retryToken)` branch (not at the top of the file) because it doesn't exist until Task 7 — requiring it eagerly at module load time would throw `undefined is not a function` the moment this file loads, before Task 7 ever runs. Once Task 7 adds it to `utils/autobuildPipeline.js`'s exports, this lazy require continues to work unchanged (no need to move it to a top-level require afterward, though doing so is harmless once Task 7 is done).

- [ ] **Step 4: Verify both files load without error**

Run: `node -e "require('/Applications/Claude Code/Diors-Builds/utils/autobuildPipeline.js'); console.log('pipeline loads OK')"` Expected: `pipeline loads OK`.

Run: `node -e "require('/Applications/Claude Code/Diors-Builds/commands/autobuild.js'); console.log('command loads OK')"` Expected: `command loads OK` (the lazy `require` inside `execute()` means the missing `retryImageUpload` export doesn't matter yet — it's only resolved if that code path actually runs).

Run: `node -c /Applications/Claude\ Code/Diors-Builds/index.js` Expected: no output (valid syntax) — confirms the `MANAGE_CUSTOM_ID_PREFIXES` edit from Step 1 didn't break anything.

- [ ] **Step 5: Commit**

```bash
git add commands/autobuild.js utils/autobuildPipeline.js index.js
git commit -m "$(cat <<'EOF'
Add /autobuild command: options, extraction, review card

New admin-only slash command taking a screenshot attachment or url,
optional category/badges/retry_token. Extraction + post-processing +
pending-token state lives in utils/autobuildPipeline.js (shared with
index.js's upcoming button/modal handlers, avoiding a circular
require with index.js). Renders an ephemeral review card with
Confirm/Edit/Cancel -- those buttons don't do anything yet, wired in
the next commits.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Confirm → write pipeline (Cloudinary upload, Loadout doc write, retry, post-creation card)

**Files:**
- Modify: `utils/autobuildPipeline.js` (add requires, `pendingImageRetries` Map, `writeLoadoutDoc`, `buildPostCreationCard`, `confirmAndWrite`, `retryImageUpload`, `cancelReview`; update `module.exports`)
- Modify: `index.js` (add `autobuild_confirm_`/`autobuild_cancel_`/`autobuild_openloadout_` handlers inside the existing `isButton()` block, which starts at `index.js:1160`)
- Test: `node -c` syntax check, then a manual end-to-end Discord verification pass (documented as a checklist — this touches live Discord/Mongo/Cloudinary and cannot be a scratch script)

**Interfaces:**
- Consumes: `pendingAutobuilds` (Task 6), `computeWeaponKeyAndBuild` (Task 5), `uploadLoadoutImage` (Task 4), `parseLoadoutBadges` (existing), `buildLoadoutCard`/`getMpCategoryAccent` (existing).
- Produces: `confirmAndWrite(interaction, token)`, `retryImageUpload(interaction, token, newImageUrl)`, `cancelReview(interaction, token)` — all exported from `utils/autobuildPipeline.js`.

- [ ] **Step 1: Add new requires to `utils/autobuildPipeline.js`**

At the top of the file, alongside the existing requires from Task 6, add:

```js
const { computeWeaponKeyAndBuild, buildLoadoutCard, getMpCategoryAccent } = require('./loadoutRender');
const { uploadLoadoutImage } = require('./loadoutImageCache');
```

And add `parseLoadoutBadges` to the existing `require('./adminParser')` destructure (it currently reads `const { correctAttachmentName, correctGunsmithCode } = require('./adminParser');` from Task 6 Step 2 — change it to):

```js
const { correctAttachmentName, correctGunsmithCode, parseLoadoutBadges } = require('./adminParser');
```

- [ ] **Step 2: Add the write pipeline functions**

Add these to `utils/autobuildPipeline.js`, right before `module.exports`:

```js
// Confirmed-but-image-upload-failed state -- separate from pendingAutobuilds (the pre-Confirm review
// state) because once Confirmed, the admin has already approved the CONTENT; only the image itself
// needs retrying. weaponKey/buildName/imageKey are pre-computed and stored here so a retry reuses the
// exact same values rather than recomputing (and risking a different result if another build for the
// same weapon was added in the meantime).
const pendingImageRetries = new Map(); // retryToken -> confirmed data + { weaponKey, buildName, imageKey }

async function writeLoadoutDoc(data, imageKeyOverride) {
    const { isMeta, categoryRank, isToxic } = parseLoadoutBadges(data.badgesRaw);
    const doc = new Loadout({
        weaponKey: data.weaponKey,
        weaponName: data.weaponName,
        category: data.category,
        mode: 'MP',
        buildName: data.buildName,
        attachments: data.attachments,
        imageKey: imageKeyOverride || data.imageKey,
        shareCode: data.gunsmithCode,
        isMeta,
        categoryRank,
        isToxic
    });
    await doc.save();
    return doc;
}

function buildPostCreationCard(doc, imageWarning) {
    const accentColor = getMpCategoryAccent(doc.category);
    let content = `✅ **Loadout created:** ${doc.weaponName} (${doc.buildName}, ${doc.category})`;
    if (imageWarning) content += `\n⚠️ ${imageWarning}`;
    const container = {
        type: 17,
        accent_color: accentColor,
        components: [
            { type: 10, content },
            { type: 1, components: [{ type: 2, style: 3, label: 'Open Loadout', custom_id: `autobuild_openloadout_${doc._id}` }] }
        ]
    };
    return { components: [container], flags: 32768 };
}

// Confirm click -- `interaction` is the BUTTON interaction. Caller (index.js) must call
// interaction.deferUpdate() before calling this, since the review card is being replaced.
async function confirmAndWrite(interaction, token) {
    const data = pendingAutobuilds.get(token);
    if (!data) {
        return interaction.followUp({ content: '❌ This review has expired (10 minute window) or was already handled. Run `/autobuild` again.' });
    }
    if (!data.category) {
        return interaction.followUp({ content: '❌ Category is still unresolved -- click **Edit** and set one before confirming.' });
    }

    const weaponKeyForLookup = data.weaponName.toLowerCase().replace(/\s+/g, '');
    const siblingBuildNames = (await Loadout.find({ weaponKey: weaponKeyForLookup, mode: 'MP' }).select('buildName').lean()).map(l => l.buildName);
    const { weaponKey, buildName, imageKey } = computeWeaponKeyAndBuild(data.weaponName, siblingBuildNames);

    const uploadResult = await uploadLoadoutImage(data.sourceImageUrl, imageKey);

    if (uploadResult.success) {
        pendingAutobuilds.delete(token);
        const doc = await writeLoadoutDoc({ ...data, weaponKey, buildName, imageKey });
        const card = buildPostCreationCard(doc, null);
        return interaction.followUp(card);
    }

    // First failure: do NOT write yet. Stash the confirmed data (with weaponKey/buildName/imageKey
    // already computed) under a new retry token, ask for the image again.
    const retryToken = crypto.randomBytes(8).toString('hex');
    pendingImageRetries.set(retryToken, { ...data, weaponKey, buildName, imageKey });
    setTimeout(() => pendingImageRetries.delete(retryToken), 10 * 60 * 1000).unref();
    pendingAutobuilds.delete(token);

    return interaction.followUp({
        content: `⚠️ Image upload to Cloudinary failed (${uploadResult.error}). Nothing was saved yet -- re-run this to try the image again:\n\`/autobuild retry_token:${retryToken} screenshot:<new attachment>\` (or use \`url:\` instead)\n\nIf it fails again, the loadout will be created anyway without an image, and you can fix it later via \`/manage\`.`
    });
}

// Second attempt, via /autobuild's retry_token option (commands/autobuild.js calls this directly --
// see the design spec's "Image retry mechanism" decision for why this can't be a button/modal).
async function retryImageUpload(interaction, token, newImageUrl) {
    const data = pendingImageRetries.get(token);
    if (!data) {
        return interaction.followUp({ content: '❌ That retry token has expired or was already used. Run `/autobuild` again from scratch.' });
    }
    pendingImageRetries.delete(token);

    const uploadResult = await uploadLoadoutImage(newImageUrl, data.imageKey);
    if (uploadResult.success) {
        const doc = await writeLoadoutDoc(data);
        const card = buildPostCreationCard(doc, null);
        return interaction.followUp(card);
    }

    // Second failure -- write anyway with a placeholder key, never lose the already-confirmed data.
    // checkImageExists() (called wherever the resulting card is later rendered, e.g. /all) correctly
    // flags this as broken -- same existing warning path every other loadout save already goes
    // through, nothing new needed for that part.
    const placeholderKey = `PENDING-UPLOAD-${token}`;
    const doc = await writeLoadoutDoc(data, placeholderKey);
    const card = buildPostCreationCard(doc, 'No image could be uploaded (tried twice). Fix it via `/manage` -> Edit Loadout -> set a real Cloudinary Image Key.');
    return interaction.followUp(card);
}

async function cancelReview(interaction, token) {
    pendingAutobuilds.delete(token);
    return interaction.followUp({ content: '❌ Cancelled -- nothing was saved or uploaded.' });
}
```

Update `module.exports`:

```js
module.exports = { pendingAutobuilds, buildReviewCard, resolveCategoryAndBadges, runExtraction, confirmAndWrite, retryImageUpload, cancelReview };
```

- [ ] **Step 3: Wire the button handlers in `index.js`**

Inside the `isButton()` block (starts `index.js:1160`), add the following as its own clearly-marked section (placement relative to other unrelated handlers in that block doesn't matter):

```js
    // --- AUTOBUILD: CONFIRM ---
    if (interaction.customId.startsWith('autobuild_confirm_')) {
        const token = interaction.customId.replace('autobuild_confirm_', '');
        await interaction.deferUpdate();
        const { confirmAndWrite } = require('./utils/autobuildPipeline');
        return confirmAndWrite(interaction, token);
    }

    // --- AUTOBUILD: CANCEL ---
    if (interaction.customId.startsWith('autobuild_cancel_')) {
        const token = interaction.customId.replace('autobuild_cancel_', '');
        await interaction.deferUpdate();
        const { cancelReview } = require('./utils/autobuildPipeline');
        return cancelReview(interaction, token);
    }

    // --- AUTOBUILD: OPEN LOADOUT --- answers THIS button's own interaction with a brand-new PUBLIC
    // message (not an edit of the ephemeral confirmation), same shape /dmz's execute() uses for its
    // own initial send. See the design spec's "Open Loadout" section.
    if (interaction.customId.startsWith('autobuild_openloadout_')) {
        const loadoutId = interaction.customId.replace('autobuild_openloadout_', '');
        const Loadout = require('./models/Loadout');
        const { buildLoadoutCard, getMpCategoryAccent } = require('./utils/loadoutRender');
        const doc = await Loadout.findById(loadoutId).lean();
        if (!doc) {
            return interaction.reply({ content: '❌ That loadout no longer exists.', ephemeral: true });
        }
        const categoryBuilds = await Loadout.find({ category: doc.category, mode: 'MP' }).lean();
        const accentColor = getMpCategoryAccent(doc.category);
        const cardPayload = buildLoadoutCard([doc], 0, { color: accentColor, idPrefix: 'mp', isEphemeral: false, categoryBuilds });
        await interaction.deferReply({ ephemeral: false });
        const { sendV2Payload } = require('./utils/sendV2Payload');
        return sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
    }
```

- [ ] **Step 4: Syntax check**

Run: `node -c /Applications/Claude\ Code/Diors-Builds/index.js && node -c /Applications/Claude\ Code/Diors-Builds/utils/autobuildPipeline.js && echo "SYNTAX OK"` Expected: `SYNTAX OK`.

- [ ] **Step 5: Manual end-to-end verification (checklist — requires real Discord/Mongo/Cloudinary access)**

This cannot be a scratch script — hand this checklist to Harkirat if this environment lacks live Discord access, or run it directly if it doesn't:

1. Run `/autobuild` with a real Gunsmith screenshot attachment, no other options.
2. Confirm the review card shows a plausible weapon name, code, 5 attachments, and either a resolved category or the "needs review" state.
3. Click **Confirm**. Confirm a `Loadout` doc appears in Mongo (`mode:'MP'`) and the asset appears in Cloudinary's `gun-builds` folder under the expected `WEAPON-NAME-N` key.
4. Click **Open Loadout** on the resulting confirmation. Confirm a real PUBLIC (non-ephemeral) loadout card message appears, matching what `/all` would show for that weapon.
5. Separately, run `/autobuild` again and click **Cancel** on the review card. Confirm nothing was written to Mongo or Cloudinary.
6. Separately, run `/autobuild` with `category` explicitly set, and again omitted for a weapon with no existing MP sibling — confirm the omitted case shows the "needs review" state and Confirm is rejected with the inline error (Edit itself is Task 8 — if that's not done yet, re-check this specific sub-case after Task 8 lands).

- [ ] **Step 6: Commit**

```bash
git add utils/autobuildPipeline.js index.js
git commit -m "$(cat <<'EOF'
Wire /autobuild Confirm/Cancel/Open Loadout + image-retry pipeline

Confirm uploads to Cloudinary under a deterministic WEAPON-NAME-N key
and writes the Loadout doc; a first upload failure stashes the
confirmed data and asks for the image again via a retry_token; a
second failure writes anyway with a placeholder key. Cancel discards
the pending token with nothing written. Open Loadout sends a real
public loadout card via the existing buildLoadoutCard().

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Edit modal

**Files:**
- Modify: `utils/autobuildPipeline.js` (add `discord.js` modal-builder requires, `buildEditModal`, `applyEditSubmission`; update `module.exports`)
- Modify: `index.js` (add `autobuild_editbtn_` handler in the `isButton()` block; add `autobuild_editmodal_` handler in the `isModalSubmit()` block, which starts at `index.js:2200`)
- Test: `node -c` syntax check, then manual Discord verification

**Interfaces:**
- Produces: `buildEditModal(token, data)` (a `ModalBuilder`), `applyEditSubmission(interaction, token)` (re-runs post-processing on submitted fields, updates `pendingAutobuilds`, re-renders the review card via `interaction.editReply`).

**⚠️ Critical placement rule — read before writing any code for this task:** `autobuild_editbtn_` is a BUTTON custom_id and its handler MUST live in the `isButton()` block. `ModalSubmitInteraction.prototype.showModal` is `undefined` in this discord.js version (v14.26.4) — a modal can only be opened from a button, select-menu, or slash-command interaction, never from another modal's submit. This exact mistake (`mng_editbtn_` placed next to its modal-submit sibling instead of in the button block) already caused a real production bug in this codebase once — see CLAUDE.md's "SEQUEL BUG" note and the breadcrumb comments at `index.js:2171-2199`. Do not place `autobuild_editbtn_`'s handler near `autobuild_editmodal_`'s handler just because they feel related — they are different interaction types in different top-level blocks.

- [ ] **Step 1: Add modal-builder requires to `utils/autobuildPipeline.js`**

Add near the top of the file, alongside the existing requires:

```js
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
```

- [ ] **Step 2: Add `buildEditModal` and `applyEditSubmission`**

Add to `utils/autobuildPipeline.js`, right before `module.exports`:

```js
// Edit modal -- ALL fields in one modal (per the design spec's decision), pre-filled from the pending
// token's current data. Discord caps a modal at 5 fields; attachments share ONE Paragraph field (one
// per line, matching every other loadout modal's convention in commands/manage.js) so
// weapon/code/attachments/category/badges all fit.
function buildEditModal(token, data) {
    const modal = new ModalBuilder().setCustomId(`autobuild_editmodal_${token}`).setTitle('Edit Extracted Loadout');
    modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('weapon').setLabel('Weapon Name').setStyle(TextInputStyle.Short).setValue(data.weaponName).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('code').setLabel('Gunsmith Code').setStyle(TextInputStyle.Short).setValue(data.gunsmithCode).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (One per line, 5 total)').setStyle(TextInputStyle.Paragraph).setValue(data.attachments.join('\n')).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('category').setLabel('Category').setStyle(TextInputStyle.Short).setPlaceholder('AR / SMG / LMG / MARKSMAN / SNIPER / SHOTGUN / SECONDARIES').setValue(data.category || '').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('badges').setLabel('Badges (optional)').setStyle(TextInputStyle.Short).setPlaceholder('meta,best,top5,toxic').setValue(data.badgesRaw || '').setRequired(false))
    );
    return modal;
}

// Modal submit -- re-runs the SAME post-processing (fuzzy-match + code-corrector) on whatever was
// typed, per the design spec. `interaction` is the ModalSubmitInteraction, not yet deferred by the
// caller -- this function defers itself (deferUpdate, since it's replacing the review card the modal
// was opened from).
async function applyEditSubmission(interaction, token) {
    const data = pendingAutobuilds.get(token);
    if (!data) {
        return interaction.reply({ content: '❌ This review has expired. Run `/autobuild` again.', ephemeral: true });
    }
    await interaction.deferUpdate();

    const weaponName = interaction.fields.getTextInputValue('weapon').trim();
    const rawCode = interaction.fields.getTextInputValue('code').trim();
    const rawAttachments = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(Boolean);
    const category = interaction.fields.getTextInputValue('category').trim().toUpperCase();
    const badgesRaw = interaction.fields.getTextInputValue('badges').trim();

    const allLoadouts = await Loadout.find({ mode: 'MP' }).select('attachments').lean();
    const knownAttachments = [...new Set(allLoadouts.flatMap(l => l.attachments))];
    const correctedAttachments = [0, 1, 2, 3, 4].map(i => correctAttachmentName(rawAttachments[i] || '', knownAttachments));
    const correctedCode = correctGunsmithCode(rawCode);

    const updated = {
        ...data,
        weaponName,
        gunsmithCode: correctedCode,
        attachments: correctedAttachments,
        category: category || null,
        badgesRaw
    };
    pendingAutobuilds.set(token, updated);

    const card = buildReviewCard(token, updated);
    return interaction.editReply(card);
}
```

Update `module.exports`:

```js
module.exports = { pendingAutobuilds, buildReviewCard, resolveCategoryAndBadges, runExtraction, confirmAndWrite, retryImageUpload, cancelReview, buildEditModal, applyEditSubmission };
```

- [ ] **Step 3: Wire `autobuild_editbtn_` in `index.js`'s `isButton()` block**

Add alongside the Task 7 button handlers (same block):

```js
    // --- AUTOBUILD: EDIT BUTTON --- MUST stay in isButton(), never moved next to autobuild_editmodal_
    // below -- see this feature's "Critical placement rule" (same class of bug CLAUDE.md documents
    // already happening once for /manage's mng_editbtn_/mng_search_ pair). showModal() is valid as a
    // response to a button click; it is NOT valid as a response to a modal submit.
    if (interaction.customId.startsWith('autobuild_editbtn_')) {
        const token = interaction.customId.replace('autobuild_editbtn_', '');
        const { pendingAutobuilds, buildEditModal } = require('./utils/autobuildPipeline');
        const data = pendingAutobuilds.get(token);
        if (!data) {
            return interaction.reply({ content: '❌ This review has expired. Run `/autobuild` again.', ephemeral: true });
        }
        return interaction.showModal(buildEditModal(token, data));
    }
```

- [ ] **Step 4: Wire `autobuild_editmodal_` in `index.js`'s `isModalSubmit()` block**

Inside the `isModalSubmit()` block (`index.js:2200`), add:

```js
    // --- AUTOBUILD: EDIT MODAL SUBMIT --- see the breadcrumb on autobuild_editbtn_ above (isButton()
    // block) for why this is a SEPARATE handler in a SEPARATE block, not a shared one.
    if (interaction.customId.startsWith('autobuild_editmodal_')) {
        const token = interaction.customId.replace('autobuild_editmodal_', '');
        const { applyEditSubmission } = require('./utils/autobuildPipeline');
        return applyEditSubmission(interaction, token);
    }
```

- [ ] **Step 5: Syntax check**

Run: `node -c /Applications/Claude\ Code/Diors-Builds/index.js && node -c /Applications/Claude\ Code/Diors-Builds/utils/autobuildPipeline.js && echo "SYNTAX OK"` Expected: `SYNTAX OK`.

- [ ] **Step 6: Manual verification**

1. Run `/autobuild` with a screenshot. On the review card, click **Edit**.
2. Confirm the modal opens pre-filled with the current weapon name/code/attachments/category/badges.
3. Change the weapon name and one attachment, submit.
4. Confirm the review card re-renders with the new values, and the attachment you changed shows its corrected/canonical form if it matched something already in the DB.
5. Click **Confirm** and confirm the resulting `Loadout` doc reflects the EDITED values, not the original extraction.
6. Re-check Task 7 Step 5's item 6 now (the "category omitted, no sibling exists" case): confirm Edit lets you set a category and Confirm then succeeds.

- [ ] **Step 7: Commit**

```bash
git add utils/autobuildPipeline.js index.js
git commit -m "$(cat <<'EOF'
Add /autobuild Edit modal

One modal, all fields (weapon/code/attachments/category/badges),
pre-filled from the pending review token. Submit re-runs the same
attachment fuzzy-correction + Gunsmith-code corrector as the initial
extraction, then re-renders the review card. Edit's button handler is
kept in the isButton() block, separate from the modal-submit handler
-- showModal() cannot be called from a modal-submit interaction.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Final smoke test + wrap-up

**Files:**
- Check for and modify (only if it already exists): `.env.example` or similar template file
- No other code changes — this task is verification-only

- [ ] **Step 1: Check for an env template file**

Run: `ls -la "/Applications/Claude Code/Diors-Builds" | grep -i env`

If a non-gitignored template file already exists (e.g. `.env.example`), add a `GEMINI_API_KEY=` line (key name only, no value) so a future fresh clone knows this variable is needed. If no such file exists in this repo already, skip this step — do not introduce a new file pattern this repo doesn't already use.

- [ ] **Step 2: Full-repo syntax sanity check**

Run: `node -c index.js && node -c commands/autobuild.js && node -c utils/autobuildPipeline.js && node -c utils/visionExtract.js && node -c utils/loadoutImageCache.js && node -c utils/adminParser.js && node -c utils/loadoutRender.js && echo "ALL SYNTAX OK"` Expected: `ALL SYNTAX OK`.

- [ ] **Step 3: Confirm no other bot instance is running before any local boot test**

This is a single-token bot — running a second live instance (alongside the production VM's `diors-bot` systemd service) makes Discord route interactions to a random instance and both instances' `deferReply`/`deferUpdate` calls race each other, which has caused real production incidents in this codebase before (see CLAUDE.md's "Single-instance guard" note).

> **⚠️ Superseded 2026-07-26 13:45 EDT (historical plan — kept as written).** The collision is **per token**. A local dev bot (`Dio (Dev)`, `node --watch --env-file=.env.dev index.js`) now exists on its own token and its own local Mongo, so this step's "confirm no other instance before a local boot" only applies to a local run using **prod's** `.env`. See `docs/reference/deployment-and-ops.md`.

Run: `ps aux | grep "node index.js" | grep -v grep`

If the VM is currently running the bot live (check via `scripts/vmstatus.sh` if you have SSH access, or ask Harkirat), do **not** also boot a local instance for verification — hand Task 6-8's manual Discord checklists back to Harkirat to run against the live bot instead (after he deploys this branch/commit to the VM himself), rather than risking a local/production collision.

- [ ] **Step 4: Local boot test (only if confirmed safe per Step 3)**

Run `node index.js` and confirm it boots to the two `handleBotReady()` confirmation log lines with no thrown errors, and that `/autobuild` is included in whatever log line confirms slash-command registration (grep `index.js` for the `REST`/`Routes.applicationCommands` call that pushes commands to Discord, to confirm new command files from `commands/` are picked up by that same registration call automatically — they should be, per the existing `fs.readdirSync` loop, but confirm rather than assume).

- [ ] **Step 5: Report completion to Harkirat**

Summarize: all 8 feature commits made (Tasks 1-8), which manual Discord/Mongo/Cloudinary verification steps were actually completed during implementation vs. handed back to him to run himself, and restate explicitly that this is a PoC — `/manage` integration, DMZ support, and real mode-inference are out of scope per the design spec and not part of this plan.

---

## Self-Review Notes

- **Spec coverage:** category resolution order (Task 6's `resolveCategoryAndBadges`), MP-only/`mode:'MP'` hardcoded everywhere (Tasks 6-8), attachment-XOR-url validation (Task 6 `execute()`), badges-blank-inherits (Task 6), review card shows the RAW screenshot pre-Cloudinary (Task 6's `buildReviewCard` uses `data.sourceImageUrl`, never a Cloudinary URL, until after Confirm), Edit as one modal with all fields (Task 8), Cancel leaves zero trace (Task 7's `cancelReview` never touches Cloudinary or Mongo), Confirm-then-Cloudinary-then-write ordering (Task 7's `confirmAndWrite`), retry_token mechanism via a fresh slash-command call (Task 6's `execute()` retry branch + Task 7's `retryImageUpload`), second-failure writes with a placeholder key (Task 7), Open Loadout sends a real public message via the existing `buildLoadoutCard` (Task 7 Step 3). All design-spec requirements are covered by a task.
- **Placeholder scan:** no TBD/TODO markers in any deliverable code block; every step shows complete, final code (the earlier draft of this plan had "wrong attempt, corrected" scratch reasoning left in — removed in this revision).
- **Type consistency:** the `pendingAutobuilds` data shape (`{weaponName, gunsmithCode, attachments, category, badgesRaw, mode, sourceImageUrl, adminId}`) is identical across Tasks 6, 7, and 8. `computeWeaponKeyAndBuild`'s return shape (`{weaponKey, buildName, imageKey}`) matches exactly how Task 7's `confirmAndWrite` destructures it. `pendingImageRetries`' stored shape (Task 7) is the spread of `data` plus `weaponKey`/`buildName`/`imageKey`, and `retryImageUpload`/`writeLoadoutDoc` both read it consistently.
- **Scope check:** appropriately sized as one cohesive feature — 9 tasks, each independently committable, but genuinely sequential (Task 7 needs Task 6's `pendingAutobuilds`; Task 8 needs Task 6's `buildReviewCard`). Not decomposed further since no task produces standalone user-facing value until Task 7 lands the actual write.
