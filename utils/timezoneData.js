// ==========================================
// TIMEZONE DATA — expanded list + fuzzy city search
// ==========================================
// /settings' timezone dropdown used to be 15 hardcoded IANA zones with no way to reach anything else. Added 2026-08-15 13:13 EDT (Harkirat's request): a much bigger list, searchable by city name/alias via a modal (see handlers/settings.js's `settingstz_` branches) -- Discord's own select menu caps at 25 options, so a bigger list can only ever be *searched*, never all shown at once.
//
// Each entry is one IANA zone with a friendly label and a list of aliases (other city names / country names / abbreviations someone might actually type) that should also resolve to it. QUICK_TIMEZONES is the original 15-zone shortlist (kept as the dropdown's direct picks, so the common case stays a single click) plus a couple more common ones, capped at 24 to leave room for the dropdown's 25th "Search for your city..." option.
const { fuzzyMatch } = require('./search');

const ALL_TIMEZONES = [
    { tz: 'America/Toronto', label: 'Eastern (Toronto/NY) (EDT)', aliases: ['toronto', 'new york', 'nyc', 'est', 'edt', 'eastern', 'ontario', 'montreal'] },
    { tz: 'America/Winnipeg', label: 'Central (Winnipeg/Chicago) (CDT)', aliases: ['winnipeg', 'chicago', 'cst', 'cdt', 'central', 'houston', 'dallas'] },
    { tz: 'America/Edmonton', label: 'Mountain (Edmonton/Denver) (MDT)', aliases: ['edmonton', 'denver', 'mst', 'mdt', 'mountain', 'calgary', 'phoenix'] },
    { tz: 'America/Vancouver', label: 'Pacific (Vancouver/LA) (PDT)', aliases: ['vancouver', 'los angeles', 'la', 'pst', 'pdt', 'pacific', 'seattle', 'san francisco'] },
    { tz: 'America/Anchorage', label: 'Alaska Time (Anchorage) (AKDT)', aliases: ['anchorage', 'alaska', 'akdt', 'akst'] },
    { tz: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu) (HST)', aliases: ['honolulu', 'hawaii', 'hst'] },
    { tz: 'America/Mexico_City', label: 'Central Mexico (Mexico City) (CST)', aliases: ['mexico city', 'mexico', 'cdmx'] },
    { tz: 'America/Bogota', label: 'Colombia Time (Bogotá) (COT)', aliases: ['bogota', 'bogotá', 'colombia', 'lima', 'peru'] },
    { tz: 'America/Argentina/Buenos_Aires', label: 'Argentina Time (Buenos Aires) (ART)', aliases: ['buenos aires', 'argentina'] },
    { tz: 'America/Sao_Paulo', label: 'Brazil Standard Time (São Paulo) (BRT)', aliases: ['sao paulo', 'são paulo', 'brazil', 'rio', 'rio de janeiro', 'brt'] },
    { tz: 'America/Halifax', label: 'Atlantic Time (Halifax) (ADT)', aliases: ['halifax', 'atlantic', 'adt', 'nova scotia'] },
    { tz: 'Europe/London', label: 'United Kingdom (London) (GMT)', aliases: ['london', 'uk', 'united kingdom', 'britain', 'gmt', 'england', 'dublin', 'ireland'] },
    { tz: 'Europe/Paris', label: 'Central Europe (Paris/Berlin) (CET)', aliases: ['paris', 'berlin', 'cet', 'central europe', 'france', 'germany', 'amsterdam', 'brussels'] },
    { tz: 'Europe/Madrid', label: 'Spain (Madrid) (CET)', aliases: ['madrid', 'spain', 'barcelona'] },
    { tz: 'Europe/Rome', label: 'Italy (Rome) (CET)', aliases: ['rome', 'italy', 'milan'] },
    { tz: 'Europe/Athens', label: 'Eastern Europe (Athens/Cairo) (EET)', aliases: ['athens', 'cairo', 'eet', 'eastern europe', 'greece', 'egypt'] },
    { tz: 'Europe/Istanbul', label: 'Turkey (Istanbul) (TRT)', aliases: ['istanbul', 'turkey'] },
    { tz: 'Europe/Moscow', label: 'Russia (Moscow) (MSK)', aliases: ['moscow', 'russia', 'msk'] },
    { tz: 'Africa/Lagos', label: 'West Africa (Lagos) (WAT)', aliases: ['lagos', 'nigeria', 'west africa', 'wat', 'accra', 'ghana'] },
    { tz: 'Africa/Johannesburg', label: 'South Africa (Johannesburg) (SAST)', aliases: ['johannesburg', 'south africa', 'sast', 'cape town'] },
    { tz: 'Asia/Dubai', label: 'Gulf Standard Time (Dubai) (GST)', aliases: ['dubai', 'uae', 'gst', 'abu dhabi'] },
    { tz: 'Asia/Riyadh', label: 'Saudi Arabia (Riyadh) (AST)', aliases: ['riyadh', 'saudi arabia', 'saudi'] },
    { tz: 'Asia/Jerusalem', label: 'Israel (Jerusalem/Tel Aviv) (IDT)', aliases: ['jerusalem', 'tel aviv', 'israel'] },
    { tz: 'Asia/Karachi', label: 'Pakistan (Karachi) (PKT)', aliases: ['karachi', 'pakistan', 'islamabad'] },
    { tz: 'Asia/Kolkata', label: 'India Standard Time (New Delhi) (IST)', aliases: ['new delhi', 'delhi', 'mumbai', 'india', 'ist', 'bangalore', 'kolkata'] },
    { tz: 'Asia/Dhaka', label: 'Bangladesh (Dhaka) (BST)', aliases: ['dhaka', 'bangladesh'] },
    { tz: 'Asia/Bangkok', label: 'Thailand (Bangkok) (ICT)', aliases: ['bangkok', 'thailand'] },
    { tz: 'Asia/Jakarta', label: 'Indonesia (Jakarta) (WIB)', aliases: ['jakarta', 'indonesia'] },
    { tz: 'Asia/Singapore', label: 'Singapore Standard Time (SGT)', aliases: ['singapore', 'sgt', 'kuala lumpur', 'malaysia'] },
    { tz: 'Asia/Manila', label: 'Philippines (Manila) (PHT)', aliases: ['manila', 'philippines'] },
    { tz: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)', aliases: ['hong kong', 'hkt'] },
    { tz: 'Asia/Shanghai', label: 'China Standard Time (Beijing/Shanghai) (CST)', aliases: ['beijing', 'shanghai', 'china'] },
    { tz: 'Asia/Seoul', label: 'South Korea (Seoul) (KST)', aliases: ['seoul', 'south korea', 'korea', 'kst'] },
    { tz: 'Asia/Tokyo', label: 'Japan Standard Time (Tokyo) (JST)', aliases: ['tokyo', 'japan', 'jst', 'osaka'] },
    { tz: 'Australia/Perth', label: 'Western Australia Time (Perth) (AWST)', aliases: ['perth', 'western australia', 'awst'] },
    { tz: 'Australia/Adelaide', label: 'Central Australia Time (Adelaide) (ACST)', aliases: ['adelaide', 'central australia', 'acst'] },
    { tz: 'Australia/Brisbane', label: 'Queensland (Brisbane) (AEST)', aliases: ['brisbane', 'queensland'] },
    { tz: 'Australia/Sydney', label: 'Eastern Australia Time (Sydney) (AEST)', aliases: ['sydney', 'melbourne', 'aest', 'eastern australia', 'australia', 'canberra'] },
    { tz: 'Pacific/Auckland', label: 'New Zealand Time (Auckland) (NZST)', aliases: ['auckland', 'new zealand', 'nzst', 'wellington'] },
    { tz: 'Pacific/Fiji', label: 'Fiji Time (FJT)', aliases: ['fiji'] },
    { tz: 'Etc/UTC', label: 'Coordinated Universal Time (UTC)', aliases: ['utc', 'gmt+0', 'z', 'zulu'] }
];

// The dropdown's direct one-click picks -- the original 15 plus a handful more common ones, capped at 24 so the "Search for your city..." sentinel fits as the 25th option (Discord's select-menu cap). Order matches ALL_TIMEZONES's rough geographic grouping.
const QUICK_ZONES = [
    'America/Toronto', 'America/Winnipeg', 'America/Edmonton', 'America/Vancouver',
    'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Athens', 'Europe/Moscow',
    'Africa/Johannesburg', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Hong_Kong',
    'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Australia/Perth',
    'Pacific/Auckland', 'Pacific/Honolulu', 'America/Mexico_City', 'Etc/UTC'
];
const QUICK_TIMEZONES = QUICK_ZONES.map(tz => ALL_TIMEZONES.find(z => z.tz === tz)).filter(Boolean);

function findTimezoneLabel(tz) {
    return ALL_TIMEZONES.find(z => z.tz === tz)?.label || tz;
}

// Fuzzy-matches a typed query against every zone's IANA id, label, AND every alias -- so "sydney", "australia", "aest" and even a raw "Australia/Sydney" all find the same entry. Returns up to `limit` zones; fuzzyMatch has no scoring, so this preserves ALL_TIMEZONES' order among whatever matches rather than ranking by closeness.
function searchTimezones(query, limit = 25) {
    const q = (query || '').trim();
    if (!q) return [];
    return ALL_TIMEZONES.filter(z =>
        fuzzyMatch(q, z.tz) || fuzzyMatch(q, z.label) || z.aliases.some(a => fuzzyMatch(q, a))
    ).slice(0, limit);
}

module.exports = { ALL_TIMEZONES, QUICK_TIMEZONES, findTimezoneLabel, searchTimezones };
