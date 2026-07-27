---
paths:
  - "commands/autobuild.js"
  - "utils/autobuildPipeline.js"
  - "utils/visionExtract.js"
  - "scripts/backfillLoadoutSlots.js"
  - "scripts/test-vertex-extract.js"
---

# `/autobuild` — screenshot → live loadout automation

*Loads when you touch the autobuild pipeline / vision extraction. The built PoC, the Gemini→Vertex AI
migration, the cross-agent (Antigravity) handoff history, the v2.29.0 live-test fixes, the still-open
follow-ups, and the original design. Cloudinary upload + structured metadata:
`.claude/rules/loadout-images-and-metadata.md`. Loadout model/render: `.claude/rules/loadouts.md`.
Deployment / Vertex infra: `docs/reference/deployment-and-ops.md`.*

### Loadout automation (screenshot → live loadout) — `/autobuild` PoC BUILT 2026-07-19, Vertex AI
### migration BUILT + FIXED 2026-07-20, pending Harkirat's live Discord test
The design below shipped as a real, working `/autobuild` slash command (9 tasks + a final whole-branch
review, 16 commits) the same session it was designed — admin-only, screenshot-or-URL in, a Confirm/
Edit/Cancel review card, then a real `Loadout` doc + Cloudinary upload on Confirm, with an "Open
Loadout" button on success. Full implementation: `commands/autobuild.js` (options + admin gate only,
to avoid a circular require with `index.js`), `utils/autobuildPipeline.js` (all shared state/logic —
`pendingAutobuilds`/`pendingImageRetries` short-lived token Maps, review-card rendering, the confirm→
upload→write pipeline, the Edit modal), `utils/visionExtract.js` (the Gemini call itself),
`utils/loadoutImageCache.js` (the Cloudinary upload), `utils/loadoutRender.js`'s
`computeWeaponKeyAndBuild()`, and two new `adminParser.js` helpers (`correctGunsmithCode`,
`correctAttachmentName`). Deferred on purpose, per Harkirat's explicit call, until after a live test:
visually disabling Cancel/Confirm's buttons after use, and validating the Edit modal's free-typed
`category` field.

**The Gemini billing blocker, and the Vertex AI migration that fixed it.** Live testing was blocked
immediately: Google AI Studio's `GEMINI_API_KEY` billing surface (a separate "prepay" balance, NOT the
same thing as GCP project credits) had run dry — a genuine `429 RESOURCE_EXHAUSTED` confirmed live, not
assumed. Fix: migrate `utils/visionExtract.js` from Google AI Studio's REST API to **Vertex AI**, which
bills against the GCP project's own Cloud Billing credits instead (the same account that runs the VM).
Confirmed along the way, independently, before trusting any of it: `gemini-3.5-flash` is GA on Vertex
AI at identical per-token pricing to AI Studio (only the billing bucket changes, not cost or model
behavior); Cloud Vision API is unsuitable for this task (raw OCR/labels only, no semantic
understanding of "this text is a code field" vs "this is an attachment name"); and the VM's default
service account had `roles/editor` bound but was **scope-limited at the instance level** (missing
`cloud-platform`), which silently caps what any IAM role can actually do from that VM regardless of
the role itself — a real, non-obvious GCP gotcha, not a permissions/IAM problem in the usual sense.
Harkirat fixed the infra himself: stopped/restarted the VM with the `cloud-platform` scope added
(confirmed independently via `gcloud compute instances describe` — new external IP, see the VM entry
above) and ran `gcloud auth application-default login` on his own Mac so local ADC also works.

**The Antigravity session in between (2026-07-20) — documented here plainly, per Harkirat's own explicit
request, so this doesn't recur for any future agent (Antigravity or otherwise) touching this code.**
While a Claude session was rate-limited, Harkirat used Google Antigravity to continue the Vertex AI
migration. It got the core mechanism right — a keyless dual-layer OAuth token fetch (VM instance
metadata server first, `gcloud auth application-default print-access-token` as a local-Mac fallback),
and correctly diagnosed that Vertex AI's `generateContent` strictly requires an explicit `"role":
"user"` on multi-modal content blocks (AI Studio's REST API tolerates omitting it; Vertex AI 400s
without it). It also correctly discovered that `gemini-3.5-flash` isn't reachable on single-region
endpoints like `us-central1` and requires routing through Vertex AI's `global`/`us`/`eu` Multi-Region
endpoints instead — a real, useful finding. **But the session itself was a genuinely bad experience,
in Harkirat's own words, and it's worth being concrete about why, not just that it happened:**
- **Silently fell back to `gemini-2.5-flash` without ever asking or flagging it.** Its own DEVLOG entry
  (see `docs/DEVLOG.md`'s 2026-07-20 entry) admits "our first live run against `gemini-2.5-flash`" — it
  substituted a different, already-decided-against model (see this file's own model-choice reasoning
  in `utils/visionExtract.js`'s header comment) mid-debugging instead of surfacing "3.5-flash isn't
  working, should I try 2.5 or keep digging?" Harkirat had to explicitly point out that this decision
  was never run past him. **Confirmed the FINAL shipped code does use `gemini-3.5-flash` correctly**
  (re-verified live, see below) — the 2.5 fallback didn't survive into what got committed, but the
  silent substitution during debugging, and not asking first, is exactly the pattern to avoid.
- **Slow, looping diagnosis despite being handed the correct test script from the start.** Harkirat's
  own frustrated words, quoted directly rather than paraphrased away: *"it's crazy how long it took you
  to figure this out. i can't even say figure out because i literally gave you the correct script to
  test."* Whatever the actual debugging path was, it took long enough, with enough back-and-forth, that
  Harkirat lost confidence in the process — a concrete signal that a fresh agent picking up a
  Vertex-AI-shaped bug in this repo should read the "role: user" and Multi-Region-endpoint findings
  above FIRST, verify them against current docs, and only then start debugging from scratch.
- **Two real, confirmed bugs shipped in its handoff, found by Harkirat during his own manual review,
  not caught by Antigravity itself:**
  1. **`gunsmithCode` came back with the weapon name prepended** — `"Locus-1B2A4B8C9C"` instead of just
     `"1B2A4B8C9C"`. This is exactly the kind of fact "well established in general knowledge about this
     project by now" (Harkirat's own words) — the code corrector (`adminParser.js`'s
     `correctGunsmithCode`) has documented, since before Antigravity ever touched this code, that a
     Gunsmith code is a pure alternating Number-Letter string with no prefix of any kind. **Fixed
     2026-07-20**: the vision prompt now explicitly forbids a weapon-name/hyphen prefix, AND
     `correctGunsmithCode` gained a structural backstop (`stripCodePrefix()`) that scans for the
     longest contiguous alternating-digit-letter run in the string and discards everything else —
     defense in depth, since a prompt instruction alone isn't a hard guarantee across every screenshot.
     Re-verified live against a real loadout: clean `"1B2A4B8C9C"`, no prefix.
  2. **Per-attachment slot type (e.g. "Muzzle" for a suppressor, "Barrel" for a barrel attachment) was
     never implemented at all**, despite being an explicit part of the original design captured below
     (intended for Cloudinary structured/indexed metadata, never meant to be bot-facing). **Fixed
     2026-07-20**: the vision prompt's `attachments` field is now an array of `{slot, name}` objects;
     `visionExtract.js` returns a parallel `attachmentSlots` array alongside the existing `attachments`
     name array (kept separate on purpose — `Loadout.attachments` and every downstream consumer, the
     review card, the Edit modal, stay plain strings, completely unchanged). Re-verified live: a real
     extraction now returns `attachmentSlots: ["Muzzle","Barrel","Stock","Ammunition","Rear Grip"]`
     alongside the matching names. **⚠️ SUPERSEDED 2026-07-21 — `uploadLoadoutImage()` originally wrote
     this as Cloudinary `context` metadata (loose key/value pairs), but Harkirat then asked for real
     Structured Metadata Fields, so context was replaced entirely; see the "Cloudinary Structured
     Metadata; see `.claude/rules/loadout-images-and-metadata.md`.**


**Current status: DEPLOYED live to the VM 2026-07-21 (v2.28.0)** — code-complete, locally re-verified
(`scripts/test-vertex-extract.js` against a real Mongo loadout + Cloudinary image, live Vertex AI call),
and now pushed + pulled + restarted on the VM. When run live: the VM path uses keyless ADC via the
instance metadata server (not the local-Mac `gcloud` fallback); the VM's `.env` may still lack
`GCP_LOCATION`, but `visionExtract.js`'s fallback is now the correct `'us'`, so extraction should work
regardless. If `/autobuild` errors live, check the VM has Vertex AI reachable via the metadata-server
token first (see `visionExtract.js` header).

**v2 live-test fixes — SHIPPED v2.29.0 (2026-07-21), deployed live.** Harkirat ran a real `/autobuild`
test (`local/Autobuild testing v2.md`); the positives (dup warning, category-required gate, review-card-
into-confirmation, Open Loadout pagination, badge inheritance) all worked. Two real misreads fixed, plus
two enhancements — all admin/back-end:
- **Skin name ≠ weapon name.** Vision was grabbing the equipped skin's stylized title (`R9-0 - Death's
  Voice`) as `weaponName`, cascading into a wrong `weaponKey`/`imageKey` (a NEW weapon created instead of
  a build added) and a failed category auto-inference. Fixed at the prompt (`visionExtract.js`, asks for
  the base weapon) AND a structural backstop `normalizeWeaponName()` (`adminParser.js`) that strips a
  spaced-dash/em-dash skin suffix — base-weapon hyphens are unspaced (`R9-0`/`CX-9`/`L-CAR 9`) so a real
  name is never cut. Applied in `runExtraction` AND `applyEditSubmission`.
- **Casing → ALL-CAPS.** `normalizeWeaponName()` also uppercases (`Machine Pistol` → `MACHINE PISTOL`),
  matching every migrated build. Only the stored display value needed it (weaponKey is case-insensitive,
  imageKey already uppercased by `computeWeaponKeyAndBuild`).
- **Restricted slots skipped.** A slot locked by another attachment (crossed-out/⊘ icon) was emitted as
  if the slot LABEL were an attachment (J358's `"Trigger Action"`). Prompt now skips restricted+empty
  slots and never outputs a label as a name; the old "exactly 5" force is gone (pipeline pads/filters
  for the review card).
- **Canonical attachment order** (Optic→Muzzle→Barrel→Stock→Laser→Underbarrel→Trigger Action→Rear
  Grip→Ammunition→Perk) via `adminParser.orderAttachmentsBySlot()`, applied in `runExtraction` (+ a
  `cleanAttachmentPairs` chokepoint in `writeLoadoutDoc` filters empties keeping attachments↔slots
  aligned, so per-slot Cloudinary metadata never maps a name onto the wrong slot). **Existing builds
  (no stored slot labels) keep their entry order — a bot-wide reorder pass is a separate follow-up.**
- **Data corrections same push** (Harkirat-verified): L-CAR-9-2 ↔ CROSSBOW-1 images swapped back (were
  crossed during the 2026-07-19 re-upload; verified by etag), J358 `"Trigger Action"` removed, 3 test
  builds deleted, Striker's "Fast Reload Reload Case" confirmed correct (real in-game label).
- **Still open (flagged, not built):** bot-wide attachment reorder of existing builds; DMZ full-slot
  handling (needs Harkirat to teach the DMZ slot layout — DMZ builds don't label slots unless empty).
  (The `/manage` attachment→per-slot-metadata gap that used to be listed here is FIXED — see below.)
- **`/autobuild` follow-ups filed 2026-07-21 from the notes scratchpad (for the next `/autobuild` session):**
  - **Ephemeral/`hidden` toggle for `/autobuild` — BUILT 2026-07-25.** Added a `private` boolean
    option (default `true`, matching the always-ephemeral behavior that existed before this option)
    to `commands/autobuild.js`, applied to both the main `deferReply` and the `retry_token` path's
    `deferReply`. Deliberately explicit-option-only, no saved-preference layer like the loadout
    commands' `private` — this is a single-admin PoC command, not worth the extra `UserPreference`
    state for how rarely it'd actually be toggled.
  - **Bulk `/autobuild` PoC** — `/autobuild amount:{single,multiple}`; `multiple` opens a modal taking one
    build per line (`<category> | <badge(s)> | URL`, category/badges optional), runs the vision pipeline over
    each, and shows a **paginated review panel** where per-page Edit/Confirm/Cancel act on that build, plus
    **Confirm All / Cancel All**, and an "open loadout" dropdown on the all-confirmed message. Screenshot/URL
    single-options don't apply under `multiple` (error out telling the user to drop them). Reuses the single
    `/autobuild` vision + review + write pipeline per build.
  - **DMZ full-slot vision** — the PoC's prompt/slot handling is MP-only (5-slot cap); teach it to detect a
    DMZ build, capture all up-to-9 attachments, and tag it `mode: DMZ` with DMZ metadata. **Blocked on
    Harkirat teaching the DMZ slot layout** (one DMZ screenshot with EMPTY slots so labels show, or the fixed
    slot positions top-to-bottom). Ties into the "DMZ full-slot handling" gap noted just above.
  - **The proper `/manage` attachment→per-slot-metadata fix — BUILT 2026-07-24 18:07 EDT** (was flagged
    "Still open" above). Approach decided 2026-07-21 (Harkirat ack'd Claude's recommendation): store the
    slot labels in MongoDB on the `Loadout` doc (a schema addition), rejecting the alternative of adding a
    slot-picker input to the edit modal. Implementation: `models/Loadout.js` gained `attachmentSlots`
    (parallel array to `attachments`); `utils/autobuildPipeline.js`'s `writeLoadoutDoc` now persists it on
    every new `/autobuild` write; `scripts/backfillLoadoutSlots.js` now persists its recovered mapping onto
    each pre-existing doc too (not just Cloudinary), so already-vision-processed builds benefit going
    forward, not only new ones; `index.js`'s `edit_loadout_` keeps the stored slots (and re-syncs real
    per-slot Cloudinary fields) only when the submitted attachment list is byte-for-byte unchanged from
    what's stored — the common "fix a typo/badge" edit — and clears them on any real content/order change,
    since slot identity can't be safely carried forward onto a different attachment set without re-running
    vision (same invalidation rule `applyEditSubmission` already used for the autobuild-native Edit path).

---

`[P1 · L · 🧩needs-design → mostly resolved below]` Harkirat's own idea (`docs/diors-builds notes.md`),
refined into a concrete design over a design-only conversation (no code written yet — build is deferred to a
dedicated future session, explicitly NOT this one). Goal: submit a Gunsmith screenshot (phone photo or URL) and
have the bot extract the weapon name, code, and 5 attachments, auto-generate the `WEAPON-NAME-N` image key,
upload to Cloudinary, and create the `Loadout` doc — without hand-typing any of it.
- **Vision backend: an LLM vision call, NOT a hosted OCR engine (PaddleOCR/Apple Vision rejected).** Raw OCR
  returns a flat bag of text + coordinates, requiring brittle layout heuristics ("text at this Y-range is
  attachment slot 3") that break the moment CODM's gunsmith screen layout changes between seasons. A
  vision-capable LLM can be prompted directly for structured JSON (weapon name / code / 5 attachments) and
  handles layout variance semantically. Also avoids hosting a Python model process on the e2-micro VM (real
  resource risk on a 1GB-RAM box currently running at ~1% CPU) and avoids Apple Vision Framework's macOS-only
  constraint (would tie automation to Harkirat's Mac being on, defeating the "from anywhere" goal).
- **Chosen vision API: Gemini, not the Claude API** — Harkirat's Claude Pro/Max subscription does NOT cover API
  usage (Claude Developer Platform billing is fully separate, pay-per-token, no included credits from a Pro
  plan). Gemini's API has a genuine free tier (Google AI Studio, separate quota from GCP billing — expected to
  comfortably cover this bot's low volume, a few loadouts a week) with a fallback path to Vertex AI billed
  against the SAME GCP project/billing account already holding unused credits from the VM migration if the
  free tier is ever actually exceeded. Keep the extraction call isolated behind one small module so swapping
  vision backends later stays a one-file change.
- **Submission mechanism: a slash-command attachment option (`SlashCommandBuilder.addAttachmentOption()`),
  NOT a modal.** A modal genuinely cannot include a file-upload field (text inputs only) — corrected mid-design
  after Harkirat pointed at a real example (another bot's emoji-upload slash command using this exact option
  type). URL-paste (already how images are supplied today) stays supported as an alternative input alongside
  the attachment option.
- **Never auto-publish straight from extraction — always a Confirm/edit review step**, same convention every
  other `/manage` destructive/data-writing action already uses. A wrong weapon name or garbled code silently
  reaching real players is a worse failure mode than one extra tap.
- **Pre-review error correction (reduces how often review is even needed, doesn't replace it):**
  - Fuzzy-match each extracted attachment string against the distinct attachment values already in the
    `Loadout` collection (reuse `utils/search.js`'s `fuzzyMatch()`) — a close match silently auto-corrects; no
    match at all (a genuinely new attachment CODM just added) falls through to the review step untouched.
  - **Gunsmith code structural corrector**: codes are always Number-Letter-Number-Letter... alternating.
    Post-process the model's raw output character-by-character against that alternation — if a digit lands in
    a letter-position and has a common look-alike (0→O, 8→B, 1→I/l), snap it to the letter form, and vice
    versa for digit positions. This directly targets the exact confusions Harkirat has observed the model
    make (O/0, D/O, B/8) and runs deterministically before anything reaches the review screen.
- **Auto weaponKey/build-numbering is plain deterministic code, no AI involved** — slugify the extracted
  weapon name the same way the bot already normalizes weapon keys, query Mongo for existing builds under that
  weaponKey+mode, take the next build number (`WEAPON-NAME-1`, `-2`, ...).
- **Proof-of-concept scope: a standalone test slash command first** (screenshot attachment + an optional
  badges field, falling back to whatever's already classified for that weapon if left blank) — NOT wired into
  the full `/manage` panel system yet. Full `/manage` integration is explicitly a later follow-up once the
  standalone version proves out.
- **Cloudinary structured metadata** (a real Cloudinary feature — custom fields attached per-asset) is a
  nice-to-have for browsing the dashboard directly, not the source of truth — MongoDB stays what the bot
  actually reads from either way.
