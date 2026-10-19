// utils/visionExtract.js Calls Gemini's vision API to extract structured loadout data from a Gunsmith screenshot. Isolated in its own module (per the design spec) so swapping vision backends later is a one-file change. Raw `fetch` REST call, no SDK dependency -- consistent with this repo's general "minimal deps" preference (utils/sendV2Payload.js does the same thing for Discord's own API).
//
// Model: gemini-3.8-flash since 2026-10-19 18:14 EDT -- see the dated "Moved to gemini-3.8-flash" note at the end of this paragraph; everything before it is the history of the original pick. Original model choice: gemini-3.5-flash, confirmed live against the real API during the 2026-07-19 design session via a `models.list` call -- picked over gemini-3.1-flash-lite because character-level read accuracy on the Gunsmith code matters here (lite trades accuracy for speed/cost in a way that works against adminParser.js's correctGunsmithCode(), whose whole job is cleaning up a FEW misreads, not compensating for a systematically less accurate model). Picked over the gemini-3-pro-preview/gemini-3.1-pro-preview family because those are `-preview` builds, not stable -- don't depend on a preview model for a live bot feature. Re-verify this is still the current recommended model before reusing this module elsewhere; new model families ship fast (see the design spec's own note on this exact choice going stale mid-session, from outdated training data, the first time it was picked). Claude (2026-07-22): evaluated switching to gemini-3.6-flash (released ~2026-07-21) after a ~$20 GCP cost spike prompted a billing investigation. Root cause of the spike was NOT this pipeline's normal usage -- Cloud Monitoring's token_count metric showed ~16.3M input tokens burned in a single day (2026-07-20) against the `global` endpoint specifically, ~16x every other day/model/region combined (the legitimate 132-loadout bulk backfill on 07-21, on the production `us` endpoint, was only ~230K input + 207K output tokens -- a few cents, exactly as estimated). The `global`-endpoint spike lines up with the Antigravity migration/debugging session from 2026-07-20 (see this file's next comment block, and docs/DEVLOG.md's 2026-07-20 entry) -- almost certainly a debugging/retry loop hammering generateContent while chasing the endpoint-404/role-format issues, not a code path this bot runs in production. No stray process was found still running, so this isn't an ongoing leak. Decision: STAY on gemini-3.5-flash, not gemini-3.6-flash, for now -- gemini-3.6-flash's own docs (fetched 2026-07-22) only list `global` as a supported endpoint/region (no `us`/`eu` Multi- Region yet), no pricing table was published as of this writing, and its stated efficiency gain is "fewer turns" on multi-step/agentic workflows -- this pipeline is a single-shot image-to-JSON call, so that specific saving doesn't apply here. Revisit once gemini-3.6-flash has published pricing and a `us`/`eu` region option (avoids repeating the exact endpoint-availability confusion that caused this incident) -- don't switch models again without checking both first. Moved to gemini-3.8-flash (2026-10-19 18:14 EDT, Harkirat asked for the newest model in the same mid tier: no Pro, no Flash-Lite). Checked against Google's own docs that day, and those two conditions above are now met: the Agent Platform (formerly Vertex AI) release notes list 3.6 Flash GA 2026-07-21, 3.7 Flash GA 2026-08-13 and 3.8 Flash GA 2026-09-02 ("generally available (GA) and available for production use"); docs.cloud.google.com/gemini-enterprise-agent-platform/resources/locations lists gemini-3.8-flash under the United States multi-region (`us`); and the pricing page publishes its rates (see PRICING_PER_1M_TOKENS below, which are roughly half of 3.5 Flash's). 3.6 and 3.7 were skipped because 3.8 is the newest GA Flash and the jump costs nothing extra. API changes from 3.5 checked in Google's "What's new in Gemini 3.6 Flash" and "What's new in Gemini 3.8 Flash" (no separate 3.7 page exists): `temperature`/`top_p`/`top_k` and `candidate_count` are deprecated, `thinking_budget` is replaced by `thinking_level` (`low`/`medium`/`high`, default `medium`, the same default 3.5 had, so thinking did not get heavier; `minimal` returns an error), and the final user turn must contain non-empty text. This call sends none of the deprecated parameters and its single user turn carries the prompt text, so the request body needed no change. The `us` endpoint for 3.8 is LISTED, not yet exercised by a live call from this repo: `node --env-file=.env.dev scripts/test-vertex-extract.js` or `scripts/autobuildDmzCheck.js` on Harkirat's Mac is what proves it. Antigravity (2026-07-20): Migrated to GCP Vertex AI using keyless Application Default Credentials (ADC) to resolve Google AI Studio prepayment limits and draw from the GCP billing credits. Claude (2026-07-20): fixed several issues found after reviewing Antigravity's changes -- see docs/DEVLOG.md's 2026-07-20 entry for the full account (what worked, what didn't, and why). In this file specifically: DEFAULT_LOCATION corrected from 'us-central1' (404s for gemini-3.5-flash) to 'us' (the confirmed-working Multi-Region endpoint); the prompt now explicitly forbids a weapon-name prefix on gunsmithCode (a real bug found live: extraction returned "Locus-1B2A4B8C9C" instead of "1B2A4B8C9C" -- see adminParser.js's stripCodePrefix() for a structural backstop on top of this prompt fix); and attachments now also extract each slot's on-screen label (e.g. "Muzzle", "Barrel") for Cloudinary structured metadata -- a requirement Antigravity's session never implemented at all.
const { execSync } = require('child_process');

// Claude (2026-07-22): per-call token/cost logging, added after the $20 spike investigation above. Cloud Monitoring's token_count metric only reports aggregate totals per model/region/day -- it has no per-call detail, so diagnosing WHICH call was responsible for a spike took two days of forensic digging (see this file's dated comment above) instead of a single log line. This closes that gap. Google Cloud Assist recommended a full Cloud Logging (winston/SDK) middleware that also logs the exact prompt text; adapted rather than followed literally:
//  - Token counts + computed cost: implemented below, via a plain structured console.log line -- journald already captures every console line on the VM (`sudo journalctl -u diors-bot`, see CLAUDE.md's "Deployment & Ops" section), so this needs zero new dependency and zero new GCP service. Adding @google-cloud/logging (or winston+a GCP transport) for a bot at this call volume (a few loadouts a week) would be the kind of unused-dependency weight this repo's own housekeeping passes have specifically gone back and removed elsewhere (see CLAUDE.md's "unused mongodb/express dependency" cleanup) -- console.log->journald already fully covers the "searchable structured log" need at this scale.
//  - Exact prompt text: deliberately NOT logged. The "prompt" here is a full base64-encoded screenshot (often hundreds of KB) -- logging it verbatim would balloon every log line for no debugging value beyond what the token count already conveys, and would mean re-persisting a copy of the user's uploaded image data outside of Cloudinary (which already stores it, once a build is confirmed) for no real benefit.
// Pricing re-checked 2026-10-19 18:14 EDT for gemini-3.8-flash (cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing, Standard tier, prompts up to 200K tokens). 3.8 Flash launched on an introductory rate that runs through 2026-12-31 and then doubles, so both periods are kept and picked by the call's own date: one constant would have quietly halved every logged cost from New Year's Day. "Regional" is what Google's sheet calls non-global, which covers this pipeline's `us` multi-region default. Output is billed for the response AND the model's thinking ("Text output (response and reasoning)"), so the estimate counts both. These rates are for MODEL; a GCP_MODEL override in .env logs a cost at 3.8 Flash's prices. This is an estimate for observability, not a billing source of truth; re-check these numbers whenever MODEL changes or Google revises the sheet (this table can't self-update). Previous figures, gemini-3.5-flash 2026-07-22: global $1.50/$9.00, regional $1.65/$9.90.
const PRICING_PER_1M_TOKENS = [
    { until: '2027-01-01T00:00:00Z', global: { input: 0.75, output: 3.75 }, regional: { input: 0.825, output: 4.125 } },
    { until: null, global: { input: 1.50, output: 7.50 }, regional: { input: 1.65, output: 8.25 } },
];

// Exported so scripts/visionCost.test.js can pin the rate switch and the thinking-token count without a Vertex call.
function estimateVisionCostUsd(gcpLocation, usageMetadata, at = new Date()) {
    const period = PRICING_PER_1M_TOKENS.find(p => p.until === null || at < new Date(p.until));
    const rates = gcpLocation === 'global' ? period.global : period.regional;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    // thoughtsTokenCount is reported separately from candidatesTokenCount and billed at the output rate. Before 2026-10-19 the log counted candidates only, so every earlier vision_call_cost line under-reports a thinking model's real cost.
    const outputTokens = (usageMetadata?.candidatesTokenCount || 0) + (usageMetadata?.thoughtsTokenCount || 0);
    return { inputTokens, outputTokens, estimatedCostUsd: (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output };
}

function logVisionCallCost(taskName, gcpLocation, gcpModel, usageMetadata) {
    try {
        const { inputTokens, outputTokens, estimatedCostUsd } = estimateVisionCostUsd(gcpLocation, usageMetadata);
        const thinkingTokens = usageMetadata?.thoughtsTokenCount || 0;
        console.log(JSON.stringify({
            log: 'vision_call_cost',
            taskName: taskName || 'unspecified',
            model: gcpModel,
            location: gcpLocation,
            inputTokens,
            outputTokens,
            thinkingTokens,
            estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
            timestamp: new Date().toISOString(),
        }));
    } catch (e) {
        // Never let cost logging break the actual extraction -- same "logging must never affect the thing it observes" rule utils/alertWebhook.js already documents for Discord alerting.
    }
}

const MODEL = 'publishers/google/models/gemini-3.8-flash';
const DEFAULT_PROJECT_ID = 'gen-lang-client-0549308254';
// 'us' is a Vertex AI Multi-Region endpoint (aiplatform.us.rep.googleapis.com) -- confirmed live this is where gemini-3.5-flash was available, and Google's locations page lists gemini-3.8-flash there too (2026-10-19, see the top comment for what is and isn't proven live); the original 'us-central1' single-region guess 404'd. This is only the FALLBACK default (a real .env's GCP_LOCATION always wins, see below) but it must itself be a working value -- a wrong fallback here would silently break the moment .env is missing this var (e.g. a fresh VM .env that hasn't been re-synced since this variable was added).
const DEFAULT_LOCATION = 'us';

// Prompt is parameterized by how many attachment slots to expect (up to `maxAttachments`, default 9 -- see MAX_ATTACHMENTS below). Rewritten 2026-07-21 after live v2 testing surfaced two real misreads:
//   - weaponName was grabbing the equipped SKIN's stylized title (e.g. "R9-0 - Death's Voice") instead of the base weapon ("R9-0"), which cascaded into a wrong weaponKey/imageKey and a brand-new "weapon" being created instead of a build added to the existing one. Now asks for the base weapon only (a structural backstop, adminParser.js's normalizeWeaponName, strips a skin suffix too).
//   - a RESTRICTED slot (a slot locked by another attachment, shown with a crossed-out/prohibited icon) was being emitted as if the slot LABEL were an attachment (J358's "Trigger Action"). Now explicitly told to skip restricted AND empty slots, and never to output a slot label as an attachment name.
// The old "exactly 5" wording is gone -- forcing a count is what made a restricted-slot weapon hallucinate a 5th attachment; the pipeline pads/filters for the review card instead. DMZ DETECTION (2026-10-19 17:53 EDT, docs/db-deferred-list.md's "/autobuild: recognise DMZ builds, not just MP"). The model is NOT asked which mode the screen is. It reports four pieces of UI chrome as plain yes/no facts, and classifyMode() below decides, so the rule lives in code that can be tested without a Vertex call and cannot drift between prompt wordings. The four are the text-bearing discriminators from .claude/rules/autobuild.md's "MP vs DMZ" table, strongest first. ⚠️ Deliberately NOT asked: slot COUNT (a DMZ SVD has five slots), slot POSITION (renames and moves), the `ATTACHMENTS ● ● ● ● ●` dot row (Harkirat: "i wouldnt fixate on those dot elements" -- a miscounted glyph would silently flip the mode), and the top-right MAX/GOLD badge (a weapon-levelling display, not rarity or mode).
//
// The slot label: MP prints one above each attachment, DMZ prints none at all (Harkirat, 2026-09-16 11:31 EDT), so the model is told to copy a printed label verbatim -- including weapon-specific renames like Bowstring or Limb -- and to leave it blank rather than guess one from a position or an icon. A guessed DMZ slot would land in Cloudinary's per-slot metadata as fact.
function buildPrompt(maxAttachments, knownWeapons = []) {
    return buildBasePrompt(maxAttachments) + weaponVocabulary(knownWeapons);
}

// The CODM catalogue's weapon names (utils/catalogue.js), so the model spells a known weapon the way the game does instead of guessing from a stylised skin title. Names only, never attachments: the attachment list runs to hundreds of names and is corrected after extraction instead (correctAttachmentName against the same catalogue).
function weaponVocabulary(knownWeapons) {
    if (!knownWeapons?.length) return '';
    return `\n\nKnown CODM weapon names. When the screenshot's weapon is one of these, use this exact spelling for weaponName: ${knownWeapons.join(', ')}.`;
}

function buildBasePrompt(maxAttachments) {
    return `You are looking at a screenshot of a Call of Duty Mobile (CODM) "Gunsmith" weapon customization screen. Extract exactly this information and respond with ONLY a JSON object, no markdown code fences, no extra text:

{
  "weaponName": "the BASE weapon's name ONLY, e.g. 'R9-0', 'AK117', 'Fennec'. Do NOT include any weapon SKIN, blueprint, or camo name. The screen often shows the equipped skin's stylized title joined to the weapon by a spaced dash (e.g. it may display 'R9-0 - Death's Voice', but the weapon is just 'R9-0'). Return only the underlying weapon name -- never the skin name, never a 'weapon - skin' combination.",
  "gunsmithCode": "ONLY the short alphanumeric share code itself (usually labeled 'Code' or similar, or appended to the weapon name in the title), alternating numbers and letters, e.g. '1B2A4B8C9C'. Do NOT include the weapon name, a hyphen, or any other prefix/suffix -- return the code characters only, nothing else. If no such code is shown anywhere on the screen, use an empty string.",
  "screen": {
    "penStats": "true if the stats include a stat labelled 'PEN.' or 'PEN. MULTI', otherwise false",
    "selectBlueprints": "true if a 'SELECT BLUEPRINTS' button or label is visible, otherwise false",
    "equipCustomizeTabs": "true if tabs labelled 'EQUIP' and 'CUSTOMIZE' are visible, otherwise false",
    "codeInTitle": "true if the weapon's title has an alphanumeric code joined to it, e.g. 'Dobvra-1D2C5F7B8B', otherwise false"
  },
  "attachments": [
    {"slot": "the slot's label EXACTLY as printed on screen, e.g. Muzzle, Barrel, Optic, Stock, Underbarrel, Rear Grip, Ammunition, Perk, Laser, Trigger Action -- some weapons print their own names instead, such as Bowstring, Limb, Bolt, Foregrip, Mag, Guard or Smoothbore, and those must be copied as printed. If no label is printed for the slot, use an empty string; never guess a slot from its position or its icon", "name": "the equipped attachment's name in that slot"}
  ]
}

Answer each "screen" field with a JSON boolean (true or false), judged only from text you can actually read on the screen.

Include one object per slot that ACTUALLY HAS AN ATTACHMENT EQUIPPED, in the order they appear on screen -- up to ${maxAttachments}. IMPORTANT: skip any slot that is EMPTY, and skip any slot showing a crossed-out or prohibited icon (a slashed circle, or a struck-through symbol) -- that icon means the slot is RESTRICTED (locked by another equipped attachment) and has nothing equipped, so it must NOT appear in the array at all. Never invent an attachment for a restricted or empty slot, and never output a slot's label as if it were the attachment name. If you genuinely cannot read a value for a field that IS equipped, use an empty string for that field rather than omitting the key.`;
}

// Antigravity (2026-07-20): Keyless OAuth 2.0 Token Retriever Dynamically fetches the bearer token from the GCP Metadata Server when running on Compute Engine VM, or falls back to execSync'ing local gcloud ADC when running on local Mac in development.
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
    // Claude (2026-07-20): both paths above fell through without a token (metadata server unreachable AND gcloud produced no usable output, whether by throwing or by printing an empty string) -- Antigravity's original version only threw from inside the gcloud catch block, so an empty-but- non-throwing `execSync` result silently returned `undefined` here instead of a clear error.
    throw new Error('GCP credentials missing: Instance metadata server unreachable and local gcloud ADC is unauthenticated. Please run "gcloud auth application-default login" locally.');
}

// Nine is the most slot positions either mode shows (Muzzle, Barrel, Optic, Stock, Perk, Laser, Underbarrel, Ammunition, Rear Grip). It was 5 until 2026-10-19 17:53 EDT, and that was the bug Harkirat's note names: "DMZ partials are the 5-attachment prompt cap". 5 is MP's EQUIP cap, not its slot count, so it was right for MP and cut every DMZ build short. One cap now serves both, because the mode is only known once the model has answered: an MP screen cannot show more than five equipped, and the prompt's skip-empty-and-restricted wording is what stops a nine-slot cap inventing attachments on a short weapon. ⚠️ Keep that wording whenever this prompt is edited.
const MAX_ATTACHMENTS = 9;

// The mode from the four `screen` facts the model reported. Two agreeing signals and no conflicting one, or null: a build filed under the wrong mode is worse than one the review card asks about (.claude/rules/autobuild.md, "Prefer two agreeing signals, and if they conflict, return the mode as unknown rather than guessing"). A missing or non-boolean field counts as not seen, never as a vote, so a malformed answer degrades to null instead of to a mode. A string "true" is not true: the prompt asks for JSON booleans, and accepting strings would make "false" truthy.
function classifyMode(screen) {
    const seen = (key) => screen != null && screen[key] === true;
    const dmz = ['penStats', 'equipCustomizeTabs'].filter(seen).length;
    const mp = ['selectBlueprints', 'codeInTitle'].filter(seen).length;
    if (dmz >= 2 && mp === 0) return 'DMZ';
    if (mp >= 2 && dmz === 0) return 'MP';
    return null;
}

// `maxAttachments` (default MAX_ATTACHMENTS) -- how many attachment slots to extract. Kept as an option rather than a separate function so there's still ONE extraction path to maintain; scripts/backfillLoadoutSlots.js passes 9 explicitly.
async function extractLoadoutFromImage(imageUrl, { maxAttachments = MAX_ATTACHMENTS, taskName, knownWeapons = [] } = {}) {
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

    // Gemini's generateContent accepts an image as inline base64 bytes, not an arbitrary URL it fetches itself -- download the source image ourselves first, same "resolve the image locally before doing anything else with it" shape this repo's other image-processing utils already use (e.g. utils/stillFrame.js, utils/colorExtract.js).
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`Failed to download source image: HTTP ${imageRes.status}`);
    const contentType = imageRes.headers.get('content-type') || 'image/png';
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
    const base64Image = imageBuffer.toString('base64');

    const requestBody = {
        contents: [{
            role: 'user',
            parts: [
                { text: buildPrompt(maxAttachments, knownWeapons) },
                { inline_data: { mime_type: contentType, data: base64Image } }
            ]
        }],
        // No thinkingConfig on purpose: 3.8 Flash defaults to `medium`, which is what this pipeline was moved over on. If one is ever added, use `thinking_level` (`low`/`medium`/`high`); `minimal` is an error on 3.8 and `thinking_budget` is the retired form.
        generationConfig: { responseMimeType: 'application/json' }
    };

    // Dependency timing (2026-08-16, observability stage 2) -- extractLoadoutFromImage() is the one and only runtime path to Vertex, so this single wrap is the whole integration. Tokens are added below, once usageMetadata is actually in hand.
    const { timeDependency, noteDep } = require('./eventStore');
    const res = await timeDependency('vertex', () => fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody)
    }));

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gemini API returned HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    // Logged as soon as we have a response, regardless of what happens to the text below -- tokens are already spent the moment Vertex AI replies, whether or not the JSON that follows parses cleanly.
    logVisionCallCost(taskName, gcpLocation, gcpModel, data?.usageMetadata);
    // Same reasoning as logVisionCallCost's own placement: tokens are spent the moment Vertex replies, whether or not the JSON below parses. Reported as a zero-duration second call so the token total lands on the dep row the timing wrapper already created, without double-counting the latency.
    if (data?.usageMetadata?.totalTokenCount) noteDep('vertex', 0, true, { tokens: data.usageMetadata.totalTokenCount, countsAsCall: false });
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error('Gemini response had no extractable text content');

    let parsed;
    try {
        parsed = JSON.parse(rawText);
    } catch {
        throw new Error(`Gemini response was not valid JSON: ${rawText.slice(0, 300)}`);
    }

    return shapeExtraction(parsed, maxAttachments);
}

// The model's parsed JSON -> what callers get. Pulled out of extractLoadoutFromImage (2026-10-19 17:52 EDT) so scripts/autobuildDmz.test.js can drive real response shapes through it with no Vertex call.
function shapeExtraction(parsed, maxAttachments = MAX_ATTACHMENTS) {
    if (!parsed || typeof parsed.weaponName !== 'string' || typeof parsed.gunsmithCode !== 'string' || !Array.isArray(parsed.attachments)) {
        throw new Error(`Gemini response missing required fields: ${JSON.stringify(parsed).slice(0, 300)}`);
    }

    // Attachments are now {slot, name} objects (added 2026-07-20 for Cloudinary structured metadata -- see this file's top comment). Accept a plain string too for robustness (a model response that drops the object wrapper on an empty/unclear slot) rather than throwing on a partially-shaped item. Pad/truncate to exactly `maxAttachments` so every index is a string rather than `undefined`; utils/autobuildPipeline.js's cleanAttachmentPairs drops the empty ones before anything is shown or stored.
    const slotIndexes = Array.from({ length: maxAttachments }, (_, i) => i);
    const attachments = slotIndexes.map(i => {
        const item = parsed.attachments[i];
        if (typeof item === 'string') return item;
        return (item && typeof item.name === 'string') ? item.name : '';
    });
    // Parallel array to `attachments` -- NOT bot-facing (Loadout.attachments stays plain strings everywhere downstream), only ever consumed to attach per-slot Cloudinary structured metadata for indexing. See utils/autobuildPipeline.js/loadoutImageCache.js.
    const attachmentSlots = slotIndexes.map(i => {
        const item = parsed.attachments[i];
        return (item && typeof item.slot === 'string') ? item.slot : '';
    });

    // `screen` is optional on the way in: a response without it (an older prompt, a model that dropped it) classifies as null and the review card asks, rather than the whole extraction failing.
    const modeSignals = {
        penStats: parsed.screen?.penStats === true,
        selectBlueprints: parsed.screen?.selectBlueprints === true,
        equipCustomizeTabs: parsed.screen?.equipCustomizeTabs === true,
        codeInTitle: parsed.screen?.codeInTitle === true
    };
    return { weaponName: parsed.weaponName, gunsmithCode: parsed.gunsmithCode, attachments, attachmentSlots, mode: classifyMode(parsed.screen), modeSignals };
}

module.exports = { extractLoadoutFromImage, shapeExtraction, classifyMode, buildPrompt, estimateVisionCostUsd, MAX_ATTACHMENTS, MODEL };
