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
