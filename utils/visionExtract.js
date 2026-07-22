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
// Claude (2026-07-22): evaluated switching to gemini-3.6-flash (released ~2026-07-21) after a ~$20
// GCP cost spike prompted a billing investigation. Root cause of the spike was NOT this pipeline's
// normal usage -- Cloud Monitoring's token_count metric showed ~16.3M input tokens burned in a single
// day (2026-07-20) against the `global` endpoint specifically, ~16x every other day/model/region
// combined (the legitimate 132-loadout bulk backfill on 07-21, on the production `us` endpoint, was
// only ~230K input + 207K output tokens -- a few cents, exactly as estimated). The `global`-endpoint
// spike lines up with the Antigravity migration/debugging session from 2026-07-20 (see this file's
// next comment block, and docs/DEVLOG.md's 2026-07-20 entry) -- almost certainly a debugging/retry
// loop hammering generateContent while chasing the endpoint-404/role-format issues, not a code path
// this bot runs in production. No stray process was found still running, so this isn't an ongoing
// leak. Decision: STAY on gemini-3.5-flash, not gemini-3.6-flash, for now -- gemini-3.6-flash's own
// docs (fetched 2026-07-22) only list `global` as a supported endpoint/region (no `us`/`eu` Multi-
// Region yet), no pricing table was published as of this writing, and its stated efficiency gain is
// "fewer turns" on multi-step/agentic workflows -- this pipeline is a single-shot image-to-JSON call,
// so that specific saving doesn't apply here. Revisit once gemini-3.6-flash has published pricing and
// a `us`/`eu` region option (avoids repeating the exact endpoint-availability confusion that caused
// this incident) -- don't switch models again without checking both first.
// Antigravity (2026-07-20): Migrated to GCP Vertex AI using keyless Application Default Credentials (ADC)
// to resolve Google AI Studio prepayment limits and draw from the GCP billing credits.
// Claude (2026-07-20): fixed several issues found after reviewing Antigravity's changes -- see
// docs/DEVLOG.md's 2026-07-20 entry for the full account (what worked, what didn't, and why). In this
// file specifically: DEFAULT_LOCATION corrected from 'us-central1' (404s for gemini-3.5-flash) to 'us'
// (the confirmed-working Multi-Region endpoint); the prompt now explicitly forbids a weapon-name
// prefix on gunsmithCode (a real bug found live: extraction returned "Locus-1B2A4B8C9C" instead of
// "1B2A4B8C9C" -- see adminParser.js's stripCodePrefix() for a structural backstop on top of this
// prompt fix); and attachments now also extract each slot's on-screen label (e.g. "Muzzle", "Barrel")
// for Cloudinary structured metadata -- a requirement Antigravity's session never implemented at all.
const { execSync } = require('child_process');

// Claude (2026-07-22): per-call token/cost logging, added after the $20 spike investigation above.
// Cloud Monitoring's token_count metric only reports aggregate totals per model/region/day -- it has
// no per-call detail, so diagnosing WHICH call was responsible for a spike took two days of forensic
// digging (see this file's dated comment above) instead of a single log line. This closes that gap.
// Google Cloud Assist recommended a full Cloud Logging (winston/SDK) middleware that also logs the
// exact prompt text; adapted rather than followed literally:
//  - Token counts + computed cost: implemented below, via a plain structured console.log line --
//    journald already captures every console line on the VM (`sudo journalctl -u diors-bot`, see
//    CLAUDE.md's "Deployment & Ops" section), so this needs zero new dependency and zero new GCP
//    service. Adding @google-cloud/logging (or winston+a GCP transport) for a bot at this call volume
//    (a few loadouts a week) would be the kind of unused-dependency weight this repo's own housekeeping
//    passes have specifically gone back and removed elsewhere (see CLAUDE.md's "unused mongodb/express
//    dependency" cleanup) -- console.log->journald already fully covers the "searchable structured log"
//    need at this scale.
//  - Exact prompt text: deliberately NOT logged. The "prompt" here is a full base64-encoded screenshot
//    (often hundreds of KB) -- logging it verbatim would balloon every log line for no debugging value
//    beyond what the token count already conveys, and would mean re-persisting a copy of the user's
//    uploaded image data outside of Cloudinary (which already stores it, once a build is confirmed) for
//    no real benefit.
// Pricing below confirmed live 2026-07-22 (cloud.google.com/vertex-ai/generative-ai/pricing) -- this is
// an estimate for observability, not a billing source of truth; re-check these numbers if Google revises
// gemini-3.5-flash's price sheet (unlikely to happen silently, but this constant can't self-update).
const PRICING_PER_1M_TOKENS = {
    global: { input: 1.50, output: 9.00 },
    regional: { input: 1.65, output: 9.90 }, // 'us' / 'eu' Multi-Region endpoints (this pipeline's default)
};

function logVisionCallCost(taskName, gcpLocation, gcpModel, usageMetadata) {
    try {
        const rates = gcpLocation === 'global' ? PRICING_PER_1M_TOKENS.global : PRICING_PER_1M_TOKENS.regional;
        const inputTokens = usageMetadata?.promptTokenCount || 0;
        const outputTokens = usageMetadata?.candidatesTokenCount || 0;
        const estimatedCostUsd = (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output;
        console.log(JSON.stringify({
            log: 'vision_call_cost',
            taskName: taskName || 'unspecified',
            model: gcpModel,
            location: gcpLocation,
            inputTokens,
            outputTokens,
            estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
            timestamp: new Date().toISOString(),
        }));
    } catch (e) {
        // Never let cost logging break the actual extraction -- same "logging must never affect the
        // thing it observes" rule utils/alertWebhook.js already documents for Discord alerting.
    }
}

const MODEL = 'publishers/google/models/gemini-3.5-flash';
const DEFAULT_PROJECT_ID = 'gen-lang-client-0549308254';
// 'us' is a Vertex AI Multi-Region endpoint (aiplatform.us.rep.googleapis.com) -- confirmed live this
// is where gemini-3.5-flash is actually available; the original 'us-central1' single-region guess
// 404'd. This is only the FALLBACK default (a real .env's GCP_LOCATION always wins, see below) but it
// must itself be a working value -- a wrong fallback here would silently break the moment .env is
// missing this var (e.g. a fresh VM .env that hasn't been re-synced since this variable was added).
const DEFAULT_LOCATION = 'us';

// Prompt is parameterized by how many attachment slots to expect (up to `maxAttachments`). /autobuild
// passes the default 5 (MP); the DMZ slot backfill (scripts/backfillLoadoutSlots.js) passes 9 (DMZ
// equips up to 9). Rewritten 2026-07-21 after live v2 testing surfaced two real misreads:
//   - weaponName was grabbing the equipped SKIN's stylized title (e.g. "R9-0 - Death's Voice") instead
//     of the base weapon ("R9-0"), which cascaded into a wrong weaponKey/imageKey and a brand-new
//     "weapon" being created instead of a build added to the existing one. Now asks for the base weapon
//     only (a structural backstop, adminParser.js's normalizeWeaponName, strips a skin suffix too).
//   - a RESTRICTED slot (a slot locked by another attachment, shown with a crossed-out/prohibited icon)
//     was being emitted as if the slot LABEL were an attachment (J358's "Trigger Action"). Now explicitly
//     told to skip restricted AND empty slots, and never to output a slot label as an attachment name.
// The old "exactly 5" wording is gone -- forcing a count is what made a restricted-slot weapon hallucinate
// a 5th attachment; the pipeline pads/filters for the review card instead.
function buildPrompt(maxAttachments) {
    return `You are looking at a screenshot of a Call of Duty Mobile (CODM) "Gunsmith" weapon customization screen. Extract exactly this information and respond with ONLY a JSON object, no markdown code fences, no extra text:

{
  "weaponName": "the BASE weapon's name ONLY, e.g. 'R9-0', 'AK117', 'Fennec'. Do NOT include any weapon SKIN, blueprint, or camo name. The screen often shows the equipped skin's stylized title joined to the weapon by a spaced dash (e.g. it may display 'R9-0 - Death's Voice', but the weapon is just 'R9-0'). Return only the underlying weapon name -- never the skin name, never a 'weapon - skin' combination.",
  "gunsmithCode": "ONLY the short alphanumeric share code itself (usually labeled 'Code' or similar), alternating numbers and letters, e.g. '1B2A4B8C9C'. Do NOT include the weapon name, a hyphen, or any other prefix/suffix -- return the code characters only, nothing else.",
  "attachments": [
    {"slot": "the attachment slot's on-screen label, e.g. Muzzle, Barrel, Optic, Stock, Underbarrel, Rear Grip, Ammunition, Perk, Laser, Trigger Action", "name": "the equipped attachment's name in that slot"}
  ]
}

Include one object per slot that ACTUALLY HAS AN ATTACHMENT EQUIPPED, in the order they appear on screen -- up to ${maxAttachments}. IMPORTANT: skip any slot that is EMPTY, and skip any slot showing a crossed-out or prohibited icon (a slashed circle, or a struck-through symbol) -- that icon means the slot is RESTRICTED (locked by another equipped attachment) and has nothing equipped, so it must NOT appear in the array at all. Never invent an attachment for a restricted or empty slot, and never output a slot's label as if it were the attachment name. If you genuinely cannot read a value for a field that IS equipped, use an empty string for that field rather than omitting the key.`;
}

// Antigravity (2026-07-20): Keyless OAuth 2.0 Token Retriever
// Dynamically fetches the bearer token from the GCP Metadata Server when running on Compute Engine VM,
// or falls back to execSync'ing local gcloud ADC when running on local Mac in development.
async function getGcpAccessToken() {
    // 1. Try GCP VM Instance Metadata Server
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 500); // 500ms timeout for instant local fallback
        const res = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
            headers: { 'Metadata-Flavor': 'Google' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
            const data = await res.json();
            if (data.access_token) {
                return data.access_token;
            }
        }
    } catch (e) {
        // Fall through to local gcloud command
    }

    // 2. Try Local Mac gcloud Application Default Credentials (ADC)
    try {
        const token = execSync('gcloud auth application-default print-access-token', {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
        if (token && token.trim()) {
            return token.trim();
        }
    } catch (e) {
        // fall through to the shared throw below
    }
    // Claude (2026-07-20): both paths above fell through without a token (metadata server unreachable
    // AND gcloud produced no usable output, whether by throwing or by printing an empty string) --
    // Antigravity's original version only threw from inside the gcloud catch block, so an empty-but-
    // non-throwing `execSync` result silently returned `undefined` here instead of a clear error.
    throw new Error('GCP credentials missing: Instance metadata server unreachable and local gcloud ADC is unauthenticated. Please run "gcloud auth application-default login" locally.');
}

// `maxAttachments` (default 5) -- how many attachment slots to extract. /autobuild always uses the
// default 5 (MP), so its behavior is unchanged; the DMZ slot backfill passes 9. Kept as an option
// rather than a separate function so there's still ONE extraction path to maintain.
async function extractLoadoutFromImage(imageUrl, { maxAttachments = 5, taskName } = {}) {
    const accessToken = await getGcpAccessToken();
    const gcpProjectId = process.env.GCP_PROJECT_ID || DEFAULT_PROJECT_ID;
    const gcpLocation = process.env.GCP_LOCATION || DEFAULT_LOCATION;
    const gcpModel = process.env.GCP_MODEL || MODEL;

    let modelPath = gcpModel;
    if (!modelPath.startsWith('publishers/google/models/')) {
        modelPath = `publishers/google/models/${modelPath}`;
    }

    let host;
    if (gcpLocation === 'global') {
        host = 'https://aiplatform.googleapis.com';
    } else if (gcpLocation === 'us') {
        host = 'https://aiplatform.us.rep.googleapis.com';
    } else if (gcpLocation === 'eu') {
        host = 'https://aiplatform.eu.rep.googleapis.com';
    } else {
        host = `https://${gcpLocation}-aiplatform.googleapis.com`;
    }

    const endpoint = `${host}/v1/projects/${gcpProjectId}/locations/${gcpLocation}/${modelPath}:generateContent`;

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
            role: 'user',
            parts: [
                { text: buildPrompt(maxAttachments) },
                { inline_data: { mime_type: contentType, data: base64Image } }
            ]
        }],
        generationConfig: { responseMimeType: 'application/json' }
    };

    const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gemini API returned HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    // Logged as soon as we have a response, regardless of what happens to the text below -- tokens are
    // already spent the moment Vertex AI replies, whether or not the JSON that follows parses cleanly.
    logVisionCallCost(taskName, gcpLocation, gcpModel, data?.usageMetadata);
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

    // Attachments are now {slot, name} objects (added 2026-07-20 for Cloudinary structured metadata --
    // see this file's top comment). Accept a plain string too for robustness (a model response that
    // drops the object wrapper on an empty/unclear slot) rather than throwing on a partially-shaped item.
    // Pad/truncate to exactly `maxAttachments` (5 for /autobuild's review card, which always shows 5
    // slots; a short array would leave later slots as `undefined` rather than an editable empty string).
    const slotIndexes = Array.from({ length: maxAttachments }, (_, i) => i);
    const attachments = slotIndexes.map(i => {
        const item = parsed.attachments[i];
        if (typeof item === 'string') return item;
        return (item && typeof item.name === 'string') ? item.name : '';
    });
    // Parallel array to `attachments` -- NOT bot-facing (Loadout.attachments stays plain strings
    // everywhere downstream), only ever consumed to attach per-slot Cloudinary structured metadata for
    // indexing. See utils/autobuildPipeline.js/loadoutImageCache.js.
    const attachmentSlots = slotIndexes.map(i => {
        const item = parsed.attachments[i];
        return (item && typeof item.slot === 'string') ? item.slot : '';
    });

    return { weaponName: parsed.weaponName, gunsmithCode: parsed.gunsmithCode, attachments, attachmentSlots };
}

module.exports = { extractLoadoutFromImage };
