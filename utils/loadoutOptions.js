// utils/loadoutOptions.js
//
// A merged build's options as one list (Harkirat, 2026-11-05 14:41 EST: "lowkey thinking we just number the build as '1, 1b, 1c' etc and if it has b c d e etc then it means its a merge build and should be added to the same page"; he picked the mock-up "Build it as shown" at 14:50 EST). Option A is the build's own attachments, code and picture; option B onward are its `variants` (models/Loadout.js). /manage names them by number: `2` (or `2a`) is Build 2's Option A, `2b` its Option B. Players still see Option A / B / C on the card (utils/loadoutRender.js optionCards), so a letter here is only how an admin types it.
//
// Pure: no Mongo, no Discord, so scripts/loadoutOptions.test.js pins every rule. core/ops/loadouts.js `loadout.options` writes a list built here, and handlers/manage/loadouts.js decides which list to build.

// A card shows each option as a section with its picture (three components each) inside Discord's 40-component cap, and six already makes a long message.
const MAX_OPTIONS = 6;

// What one option holds: the fields that differ between options. Everything else on a build (weapon, category, label, badges, credit, description) belongs to the whole build, so to every option.
const OPTION_FIELDS = ['attachments', 'attachmentSlots', 'shareCode', 'imageKey', 'imageVersion', 'sourceHash'];
// The whole build's fields an option save may also change (the pop-up's weapon box and Badges line). Weapon name and mode are not here: a rename moves a build to another weapon's numbers, which an option save does not do.
// `description` (the build's comment) since 2026-11-06 10:58 EST: an option save of Option A or B carries the whole build's comment, and loadout.options refuses any field not listed here.
const BUILD_FIELDS = ['category', 'label', 'isMeta', 'categoryRank', 'dmzRangeRank', 'isToxic', 'isAss', 'rankModes', 'description'];

const letterOf = (i) => String.fromCharCode(97 + i);
const optionLetter = (i) => String.fromCharCode(65 + i);

// `2`, `2a`, `2B` -> { number: 2, option: 0|1, lettered }. Null when it is not a build number.
function parseBuildTag(raw) {
    const m = /^(\d+)([a-z])?$/i.exec(String(raw || '').trim());
    if (!m || Number(m[1]) < 1) return null;
    return { number: Number(m[1]), option: m[2] ? m[2].toLowerCase().charCodeAt(0) - 97 : 0, lettered: Boolean(m[2]) };
}

// Build 2's Option A is `2`, its Option B `2b`.
function optionTag(number, i) {
    return `${number}${i ? letterOf(i) : ''}`;
}

// One option as a plain object, missing fields as null so a write never leaves a moved option's old value behind (a `$set` drops an undefined key, so B's empty sourceHash moved to A would have kept A's).
function cleanOption(o = {}) {
    return {
        attachments: [...(o.attachments || [])],
        attachmentSlots: [...(o.attachmentSlots || [])],
        shareCode: o.shareCode || '',
        imageKey: o.imageKey || '',
        imageVersion: o.imageVersion ?? null,
        sourceHash: o.sourceHash ?? null,
        label: o.label || '',
    };
}

// A build's options in order, A first.
function optionsOf(build) {
    if (!build) return [];
    const root = cleanOption({ ...build, label: '' });
    return [root, ...((build.variants || []).map(cleanOption))];
}

// The fields that store a list of options: A's on the build itself, the rest as `variants`. An empty `variants` is [] (never undefined), so a Revert can clear options a build did not have.
function optionsToFields(options) {
    const [a, ...rest] = options.map(cleanOption);
    const { label, ...root } = a;
    void label;
    return { ...root, variants: rest };
}

function move(options, from, to) {
    const out = options.slice();
    [out[from], out[to]] = [out[to], out[from]];
    return out;
}
function insertAt(options, option, at) {
    const out = options.slice();
    out.splice(at, 0, option);
    return out;
}
function removeAt(options, at) {
    return options.filter((_, i) => i !== at);
}

// The rules a list must meet before it is written: at least one option, at most MAX_OPTIONS, each with attachments, and no code twice. Returns an error string or null. Codes against the weapon's OTHER builds are checked by the caller, which has them.
function listProblem(options) {
    if (!options.length) return 'A build needs at least one option.';
    if (options.length > MAX_OPTIONS) return `A build can have up to ${MAX_OPTIONS} options (${optionLetter(0)} to ${optionLetter(MAX_OPTIONS - 1)}).`;
    const empty = options.findIndex(o => !(o.attachments || []).length);
    if (empty !== -1) return `Option ${optionLetter(empty)} has no attachments.`;
    const norm = (c) => String(c || '').replace(/\s+/g, '').toUpperCase();
    for (let i = 0; i < options.length; i++) {
        for (let j = i + 1; j < options.length; j++) {
            if (norm(options[i].shareCode) && norm(options[i].shareCode) === norm(options[j].shareCode)) return `Options ${optionLetter(i)} and ${optionLetter(j)} have the same code \`${options[i].shareCode}\`, and the same code is the same build.`;
        }
    }
    return null;
}

// Every code a build holds, every option's.
function codesOf(build) {
    return optionsOf(build).map(o => o.shareCode).filter(Boolean);
}

module.exports = { MAX_OPTIONS, OPTION_FIELDS, BUILD_FIELDS, letterOf, optionLetter, parseBuildTag, optionTag, cleanOption, optionsOf, optionsToFields, move, insertAt, removeAt, listProblem, codesOf };
