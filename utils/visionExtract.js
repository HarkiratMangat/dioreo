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

const MODEL = 'publishers/google/models/gemini-3.5-flash';
const DEFAULT_PROJECT_ID = 'gen-lang-client-0549308254';
// 'us' is a Vertex AI Multi-Region endpoint (aiplatform.us.rep.googleapis.com) -- confirmed live this
// is where gemini-3.5-flash is actually available; the original 'us-central1' single-region guess
// 404'd. This is only the FALLBACK default (a real .env's GCP_LOCATION always wins, see below) but it
// must itself be a working value -- a wrong fallback here would silently break the moment .env is
// missing this var (e.g. a fresh VM .env that hasn't been re-synced since this variable was added).
const DEFAULT_LOCATION = 'us';

const PROMPT = `You are looking at a screenshot of a Call of Duty Mobile (CODM) "Gunsmith" weapon customization screen. Extract exactly this information and respond with ONLY a JSON object, no markdown code fences, no extra text:

{
  "weaponName": "the weapon's name as shown on screen",
  "gunsmithCode": "ONLY the short alphanumeric share code itself (usually labeled 'Code' or similar), alternating numbers and letters, e.g. '1B2A4B8C9C'. Do NOT include the weapon name, a hyphen, or any other prefix/suffix -- return the code characters only, nothing else.",
  "attachments": [
    {"slot": "the attachment slot's on-screen label, e.g. Muzzle, Barrel, Optic, Stock, Underbarrel, Rear Grip, Ammunition, Perk, Laser", "name": "the equipped attachment's name in that slot"}
  ]
}

The attachments array must contain exactly 5 objects, one per equipped attachment slot, in the order they appear on screen. If you cannot find a value for a field, use an empty string for that field (or an empty array entry for a missing attachment) rather than omitting the key.`;

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

async function extractLoadoutFromImage(imageUrl) {
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
                { text: PROMPT },
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
    // Pad/truncate to exactly 5 -- the review card always shows 5 slots; a short array would leave
    // later slots as `undefined` rather than an editable empty string.
    const attachments = [0, 1, 2, 3, 4].map(i => {
        const item = parsed.attachments[i];
        if (typeof item === 'string') return item;
        return (item && typeof item.name === 'string') ? item.name : '';
    });
    // Parallel array, same 5-length convention as `attachments` -- NOT bot-facing (Loadout.attachments
    // stays plain strings everywhere downstream), only ever consumed by uploadLoadoutImage() to attach
    // as Cloudinary context metadata for indexing. See utils/autobuildPipeline.js/loadoutImageCache.js.
    const attachmentSlots = [0, 1, 2, 3, 4].map(i => {
        const item = parsed.attachments[i];
        return (item && typeof item.slot === 'string') ? item.slot : '';
    });

    return { weaponName: parsed.weaponName, gunsmithCode: parsed.gunsmithCode, attachments, attachmentSlots };
}

module.exports = { extractLoadoutFromImage };
