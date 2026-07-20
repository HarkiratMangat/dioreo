# Loadout Automation PoC — `/autobuild` (screenshot → live MP loadout)

**Status:** Approved 2026-07-19, not yet implemented.
**Scope:** Standalone proof-of-concept slash command, NOT `/manage` integration. MP loadouts only —
DMZ (9 attachments, `dmzRangeRank`, different UI) is explicitly out of scope for this pass; mode is
hardcoded to `'MP'`.

## Background

Full context lives in `CLAUDE.md`'s "Loadout automation (screenshot → live loadout)" section
(under "Next planned work"), written from an earlier design-only session. This spec narrows that
into a concrete, buildable first pass, resolving the two open questions Harkirat raised (attachment
vs. URL input; post-creation confirmation UX) plus several implementation-shape decisions made during
this brainstorming session.

Goal: submit a Gunsmith screenshot and have the bot extract weapon name / Gunsmith code / 5
attachments, auto-generate the `WEAPON-NAME-N` image key, upload to Cloudinary, and create the
`Loadout` doc — without hand-typing any of it, but never auto-publishing without an explicit review
step.

## Command surface: `/autobuild`

New file `commands/autobuild.js`. Admin-only — same `ALLOWED_ADMIN_ID` check `/manage` already
exports and uses, since this mutates the DB. `.setIntegrationTypes([1]).setContexts([0, 1, 2])` like
every other command (DM/user-install support).

Options:
- `screenshot` (attachment, optional) — the Gunsmith screenshot.
- `url` (string, optional) — alternative to `screenshot`. Exactly one of `screenshot`/`url` must be
  given on a fresh submission (validate and reject with a clear ephemeral message if zero or both are
  provided).
- `category` (string choice: AR/SMG/LMG/MARKSMAN/SNIPER/SHOTGUN/SECONDARIES, optional) — explicit
  override for category resolution (see below).
- `badges` (string, optional) — same comma-token format `/manage`'s badges field already parses via
  `parseLoadoutBadges()` (`meta`, `best`, `top{N}`, `toxic`). Blank = inherit from an existing sibling
  build of the same weapon if one exists (copy `isMeta`/`categoryRank`/`isToxic` from the first
  `Loadout.findOne({weaponKey, mode:'MP'})` match); if no sibling exists, leave badges unset.
- `retry_token` (string, optional) — present only when re-submitting an image after a Cloudinary
  upload failure (see "Confirm → write pipeline" below). When set: `screenshot`/`url` are still
  required (one of them), every other option is ignored, and the command skips straight to the
  upload-retry path using the already-confirmed data stashed under that token.

## Category resolution order

1. Explicit `category` option, if given.
2. Else, `Loadout.findOne({ weaponKey, mode: 'MP' })` for the extracted (post-corrected) weapon name's
   slugified key — reuse its category if a sibling build already exists.
3. Else, unresolved. The review card (below) shows category as a required field with no value; the
   Confirm button stays enabled but Confirm fails fast with an inline "pick a category via Edit first"
   message if still unresolved at click time (simpler than wiring a disabled-button state that has to
   be recomputed on every Edit re-render).

## Vision extraction — `utils/visionExtract.js`

One exported function: `extractLoadoutFromImage(imageUrl)`. Calls the Gemini API
(`gemini-3.5-flash` — confirmed live via this session's own `models.list` call against the real key;
newest stable flash-tier model as of 2026-07-19, multimodal, supports `generateContent`. Picked over
`gemini-3.1-flash-lite` because character-level read accuracy on the Gunsmith code matters here — lite
trades accuracy for speed/cost in a way that works against the corrector step's whole purpose. Picked
over `gemini-3-pro-preview`/`gemini-3.1-pro-preview` because those are `-preview` builds, not stable,
and pro-tier reasoning is overkill for structured extraction. Re-verify this is still the right/current
model at implementation time — new model families ship fast, and hardcoding a snapshot in a design doc
is exactly the kind of claim that can go stale) with the image + a prompt requesting strict JSON:

```json
{ "weaponName": "...", "gunsmithCode": "...", "attachments": ["...", "...", "...", "...", "..."] }
```

Implementation: plain `fetch()` REST call to
`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent`, image
passed as inline base64 or via Gemini's file-data URI support (implementation detail decided during
the plan/build step — whichever avoids double-downloading the image unnecessarily). Auth via
`x-goog-api-key` header (confirmed working format this session), key from new `GEMINI_API_KEY` env var
(already added to `.env` and live-verified working).

No SDK dependency needed — a raw `fetch` call is enough for one endpoint, consistent with this repo's
general preference for minimal deps (`sendV2Payload.js` already does raw REST similarly for Discord).

A hard failure here (network error, non-200, malformed/unparseable JSON, any of the 3 fields missing)
aborts immediately with an ephemeral error. **Nothing is written or uploaded anywhere at this stage.**

## Post-processing (runs on every extraction AND every Edit-modal resubmit)

New function(s), likely added to `utils/adminParser.js` alongside the existing `parseLoadoutBadges`:

- **Attachment fuzzy-correction**: each of the 5 extracted attachment strings run through
  `utils/search.js`'s `fuzzyMatch()` against the distinct attachment values already present across
  `Loadout` — a match above the existing fuzzy-match bar auto-corrects to the canonical stored
  spelling; no match passes through untouched (assumed a genuinely new attachment).
- **Gunsmith code corrector**: new `correctGunsmithCode(code)`. CODM Gunsmith codes alternate
  Number-Letter-Number-Letter...; walk the string position by position, and where a character's type
  (digit vs letter) doesn't match its expected position AND has a known look-alike
  (`0↔O`, `8↔B`, `1↔I`/`1↔l`, `D↔O`), snap it to the expected type. Deterministic, no AI involved,
  targets the exact confusions noted in CLAUDE.md's design capture.

## Pending-review store

New in-memory `Map` in `index.js`, `pendingAutobuilds` — same short-lived-token pattern as
`pendingManageEdits`/`manageUndoStore` (random token key, ~10 min TTL). Stashes: corrected
`weaponName`/`gunsmithCode`/`attachments[5]`/`category`/badges fields, `mode: 'MP'`, the source image
reference (attachment URL or provided `url`), and the invoking admin's Discord ID (defense-in-depth;
the command itself is already admin-gated).

## Review card (ephemeral)

Components V2 card, same visual conventions as the rest of the bot (title block, container, dividers).
Shows: weapon name, Gunsmith code, 5 attachments, category (or a visible "⚠️ needs review" state if
unresolved), badges (or "none"), and the **raw source screenshot** as the preview image — deliberately
NOT yet uploaded to Cloudinary, so an edited weapon name during review never orphans an upload under
the wrong key.

Buttons: **Confirm**, **Edit**, **Cancel** (one row, all three fit comfortably under Discord's 5-per-row
cap).

- **Edit** → one modal (Discord's `showModal()` from a button interaction, same as `/manage`'s
  `mng_editbtn_` pattern — NOT from a modal-submit, which can't open another modal), all fields
  pre-filled: weapon name, Gunsmith code, 5 attachment slots, category, badges. Reuses the
  add/edit-loadout modal field shape from `manage.js`. Submit re-runs the SAME post-processing
  (fuzzy-match + code-corrector) on whatever was typed, updates the pending-review token's stashed
  data, and re-renders the review card.
- **Cancel** → token deleted from `pendingAutobuilds`, review card edited to a deactivated/cancelled
  state. Nothing was ever uploaded or written — Cloudinary and Mongo are both untouched at this point
  regardless of how many Edit round-trips happened.

## Confirm → write pipeline

1. Compute final `weaponKey` (same slugify convention already used elsewhere: lowercase, spaces
   stripped) from the (possibly edited) weapon name.
2. Query `Loadout.find({ weaponKey, mode: 'MP' })`, take the next `Build N` number (existing pattern,
   e.g. `migrateBuildsToMongo.js`/`edit_loadout_` build-numbering logic).
3. Generate the Cloudinary key: `WEAPON-NAME-N` (matches the naming convention already documented and
   called out in `/manage`'s "How Images Work" info block).
4. Upload the source image (the attachment URL or provided `url` stashed on the token) to Cloudinary
   under that key, `asset_folder: 'gun-builds'` (same folder every other loadout image lives in).
   - **Upload succeeds** → write the full `Loadout` doc (`weaponKey`, `weaponName`, `category`,
     `mode: 'MP'`, `buildName: "Build N"`, `attachments`, `imageKey`, `shareCode: gunsmithCode`,
     badges fields per the resolution above). Delete the pending-review token. Show the ephemeral
     post-creation confirmation (below) with an **Open Loadout** button.
   - **Upload fails (no `retry_token` was used to get here — i.e. this is the first attempt)** → do
     **NOT** write the Loadout doc yet. Keep the token alive (refresh its TTL). Reply ephemeral with
     the `retry_token` value and instructions: re-run
     `/autobuild retry_token:<token> screenshot:<new attachment>` (or `url:`) to try the image again.
   - **Upload fails again (this attempt WAS via `retry_token`)** → write the `Loadout` doc anyway,
     with a placeholder `imageKey` (a clearly-fake sentinel string, e.g. `PENDING-UPLOAD-<token>`) so
     the extracted data isn't lost. This reuses the existing `checkImageExists()` warning path
     unmodified — a HEAD request against the bogus constructed URL 404s, and the confirmation message
     already knows how to surface "⚠️ no image found at that key" (same code path every other
     Add/Edit/Bulk-Add loadout save already goes through). Delete the pending token either way (this
     was the last attempt). The confirmation message notes the image needs a manual fix via `/manage`.

## Post-creation confirmation (ephemeral)

Short Components V2 message: weapon name, build number, category, a one-line summary of what was
saved, and (if applicable) the "⚠️ no image found" warning from `checkImageExists()`. One button:
**Open Loadout**.

- **Open Loadout** click → answers that button's OWN interaction with a **brand-new, non-ephemeral**
  message (not an edit of the ephemeral confirmation) built via the existing `buildLoadoutCard()` /
  `sendV2Payload` pattern already used by `/dmz` and the MP fallback route — i.e. a real public loadout
  card, exactly as if `/all` had just returned it.

## Error handling summary

| Failure point | Result |
|---|---|
| Bad options (both/neither screenshot+url, on a non-retry call) | Ephemeral validation error, nothing runs |
| Gemini extraction fails/malformed | Ephemeral error, nothing written/uploaded |
| Cloudinary upload fails (1st attempt) | Nothing written; ephemeral reply with `retry_token` instructions |
| Cloudinary upload fails (2nd attempt, via retry_token) | Loadout doc written with placeholder imageKey; confirmation flags it needs a manual image fix |
| Cancel clicked at any point during review | Token discarded; nothing ever written or uploaded |

## New dependencies / config

- `GEMINI_API_KEY` — added to `.env` this session, live-verified against
  `generativelanguage.googleapis.com` (200 response). Also confirmed the key runs under project
  `gen-lang-client-0549308254` — the SAME GCP project as the `diors-builds-bot` VM, already
  billing-enabled on the same billing account (`01FB53-3A80FB-BC32B1`) that holds the VM's $300 +
  $10/mo credits — so this is Tier 1 (pay-as-you-go against existing credits, not the hard-capped
  Free tier), automatic the moment a project has billing linked, not something misconfigured. A live
  `models.list` call against this key surfaced the full current model catalogue, which is how
  `gemini-3.5-flash` (see above) was picked over the `gemini-2.5-flash` this doc originally assumed —
  training-data knowledge was 6 months stale on what Gemini generation is current. No new npm package
  required (raw `fetch`).

## Explicitly out of scope for this pass

- `/manage` integration (a later follow-up per the roadmap).
- DMZ mode (hardcoded to MP; real mode-inference from visual cues is noted as required future work,
  not built now).
- Cloudinary structured metadata (nice-to-have, not required).
- Any UI for browsing/retrying a whole batch of pending autobuilds — one `pendingAutobuilds` token is
  handled at a time, same as every other single-purpose pending-action Map in this codebase.
