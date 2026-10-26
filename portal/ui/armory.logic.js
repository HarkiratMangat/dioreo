// portal/ui/armory.logic.js — CommonJS, imports nothing. Pure op-builders + the badges-token parser for the Armory realm, tested directly by scripts/portalRealms.test.js.
//
// parseBadgesToken() is a client-side port of utils/adminParser.js's parseLoadoutBadges() -- that function lives in a Node-only module (chrono-node/dayjs deps) the browser bundle never loads, so this reproduces its exact grammar rather than reaching across the server boundary. Any change to the real parser's token vocabulary must be mirrored here.
function parseBadgesToken(badgesStr, mode) {
    const tokens = (badgesStr || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
    let isMeta = false;
    let categoryRank = null;
    let dmzRangeRank = null;
    let isToxic = false;
    const unrecognized = [];

    for (const token of tokens) {
        if (token === 'meta') { isMeta = true; continue; }
        if (token === 'best') { categoryRank = 'best'; continue; }
        if (token === 'toxic') { isToxic = true; continue; }
        const rangeMatch = token.match(/^(best|top\s*\d+)(close|midlong)$/);
        if (rangeMatch) {
            const tier = rangeMatch[1].replace(/\s+/g, '');
            dmzRangeRank = `${tier}-${rangeMatch[2]}`;
            continue;
        }
        const topMatch = token.match(/^top\s*(\d+)$/);
        if (topMatch) { categoryRank = `top${topMatch[1]}`; continue; }
        unrecognized.push(token);
    }
    // DMZ never uses the per-category Best/TopN system -- same swap handlers/manage/loadouts.js applies server-side (a bare "best"/"topN" token doesn't know the mode on its own, so it moves over to dmzRangeRank here instead once the mode is known).
    if (mode === 'DMZ' && categoryRank && !dmzRangeRank) {
        dmzRangeRank = categoryRank;
        categoryRank = null;
    }
    return { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized };
}

// core/ops/loadouts.js's loadout.add/loadout.edit both run every payload field through validateBuild(), which REQUIRES weaponName + a valid mode and recomputes weaponKey itself -- callers never need to derive it. loadout.edit's real target shape is { id } (confirmed reading core/ops/loadouts.js's 'loadout.edit' entry in full: `Loadout.findById(op.target.id)`), matching loadout.delete/bulkDelete's own `{ id }`/`{ ids }` shapes. ⚠️ shareCode is NOT collected here, and this Armory form is now BEHIND Discord's own /manage on this front (reversed 2026-08-22 20:18 EDT -- this comment used to say "the real /manage add-loadout modal has no field for it either", which was true when written but is no longer true: Discord's Add/Edit Loadout modal now accepts "Build Name | Share Code" as a pipe-delimited convention on its existing `build` field, precisely because Discord modals cap at 5 fields with all 5 already used, so a real 6th field was never possible there -- see commands/manage.js/handlers/manage/loadouts.js. THIS form has no such 5-field constraint (it's a web form), so adding a real, dedicated Share Code input here would be more straightforward than the Discord workaround, not blocked by it. Filed as a follow-up in docs/db-deferred-list.md, not built here. Until then: on EDIT, this form still cannot show or change an existing (possibly /autobuild-set) shareCode at all -- the op-layer contract this comment originally described still holds and is still correct: see core/ops/loadouts.js's own header for why an always-present '' payload key would silently wipe a real gunsmith code on an EDIT (add is unaffected -- there is nothing yet to wipe on a new build). ⚠️ BADGES ARRIVE TWO WAYS NOW, and the token path stays because it is what a paste and a bulk apply speak. The add FORM sets the four fields directly — it has real controls, so making it serialise `meta, top3` into a string for this function to parse back would be a round trip through a grammar that exists for text input. An explicit field wins over the token when both are present.
//
// 🔴 shareCode IS OMITTED WHEN BLANK RATHER THAN SENT EMPTY. core/ops/loadouts.js spreads this payload straight into a Mongo $set, and its own header says an always-present '' would wipe a real code. Nothing exists to wipe on an ADD — but the two op-builders here must speak one contract, or the rule holds in one place and not the other, which is how it stops being a rule.
function buildArmoryAddOp(fields) {
    const token = parseBadgesToken(fields.badges, fields.mode);
    const pick = (explicit, fromToken) => (explicit === undefined ? fromToken : explicit);
    const shareCode = (fields.shareCode || '').trim();
    return {
        type: 'loadout.add', target: null,
        payload: {
            weaponName: fields.weaponName, category: fields.category, mode: fields.mode,
            buildName: fields.buildName || 'Standard Build', imageKey: fields.imageKey || '',
            attachments: fields.attachments || [],
            description: fields.description || '',
            ...(shareCode ? { shareCode } : {}),
            isMeta: Boolean(pick(fields.isMeta, token.isMeta)),
            isToxic: Boolean(pick(fields.isToxic, token.isToxic)),
            categoryRank: pick(fields.categoryRank, token.categoryRank) || null,
            dmzRangeRank: pick(fields.dmzRangeRank, token.dmzRangeRank) || null,
        },
    };
}

// The vocabulary utils/adminParser.js's parseLoadoutBadges accepts, spelled the way core/ops stores it. A DMZ build ranks on a combat RANGE as well as a tier, which is why it is one field of compound values rather than two.
const DMZ_RANGE_TOKENS = ['best-close', 'best-midlong', 'top3-close', 'top3-midlong', 'top5-close', 'top5-midlong'];
const MP_RANK_TOKENS = ['best', 'top3', 'top4', 'top5'];

// Edits one field of an existing row, preserving the rest -- loadout.edit's validate() needs the full build (weaponName/mode/etc), not a partial patch, same contract as every other entity's edit op in this portal.
function buildArmoryEditOp(row, columnKey, newValue) {
    const payload = { ...row, [columnKey]: newValue };
    delete payload.id; delete payload.coverage; delete payload.accent;
    return { type: 'loadout.edit', target: { id: row.id }, payload };
}

// ── THE BULK PASTE ────────────────────────────────────────────────────────────────────────────
//
// 🔴 A PASTE PREVIEW THAT ONLY COUNTS THE ERROR ARRAY LIES IN BOTH DIRECTIONS. utils/adminParser.js's parseBulkLoadoutList pushes an error and drops the block when it cannot read the header, and pushes an error but KEEPS the block when a badge token is unrecognised — so "6 problems" over a paste where four builds saved fine is both alarming and wrong, and "4 understood, 6 errors" reads as arithmetic nobody can follow. The server returns the BLOCK count, which makes the split exact: a block either parsed or it did not.
//
// ⚠️ THE DECOMPOSITION IS DERIVED FROM THAT PARSER'S CONTROL FLOW, not assumed — every rejecting branch there ends in `continue`, and the badge branch is the only one that pushes an error and falls through to `parsed.push`. scripts/portalArmoryBulk.test.js asserts it against the real parser on real text, so a change to the parser fails a test instead of silently re-conflating the two.
function bulkPasteSummary(result) {
    const rows = (result && result.rows) || [];
    const errors = (result && result.errors) || [];
    const blocks = Number.isFinite(result && result.blocks) ? result.blocks : rows.length;
    const rejected = Math.max(0, blocks - rows.length);
    const updates = rows.filter((r) => r.existing).length;
    return {
        blocks, understood: rows.length, rejected,
        warnings: Math.max(0, errors.length - rejected),
        updates, creates: rows.length - updates,
        canStage: rows.length > 0,
    };
}

// ⚠️ SELECTION STAYS FIRST. The Manifest's own "Export selection" has always sent `ids`, and the route still reads that before anything else — the two new scopes are additions, not a replacement, and reordering them here would silently change what an existing button exports.
function armoryExportQuery({ scope, mode, category, ids }) {
    if (scope === 'selection') return `ids=${(ids || []).join(',')}`;
    if (scope === 'category' && category) return `mode=${encodeURIComponent(mode)}&category=${encodeURIComponent(category)}`;
    return `mode=${encodeURIComponent(mode)}`;
}

// 🔴 "UPDATE" IS NOT A PREVIEW. The bulk paste told you a block would update an existing build and stopped there — so a paste that silently rewrote a category, dropped a share code or changed a rank looked exactly like one that changed nothing, and the only way to find out was to stage it and read the diff on the Review screen. These are the fields the upsert actually writes.
//
// ⚠️ THE MATCH IS THE CLIENT'S, THE VERDICT IS THE SERVER'S. /api/parse-bulk/loadout decides update-or-new on `weaponKey` — a normalised form this browser does not compute — so `existing` is taken from the reply and never re-derived here. This only names the CHANGING FIELDS, and when it cannot find the local record it says so rather than reporting "no change", because a silent empty diff over a real update is the exact failure it exists to prevent.
const BULK_DIFF_FIELDS = ['category', 'shareCode', 'imageKey', 'categoryRank', 'dmzRangeRank', 'isMeta', 'isToxic'];
const FIELD_WORDS = {
    category: 'Category', shareCode: 'Share code', imageKey: 'Image reference',
    categoryRank: 'Category rank', dmzRangeRank: 'DMZ range rank', isMeta: 'Meta badge', isToxic: 'Toxic badge',
};

const sameish = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

function findLocalBuild(builds, row, mode) {
    return (builds || []).find((b) => b.mode === mode
        && sameish(b.weaponName, row.weaponName) && sameish(b.buildName, row.buildName)) || null;
}

function bulkFieldDiff(row, before) {
    if (!before) return null;
    const out = [];
    for (const f of BULK_DIFF_FIELDS) {
        // A field the block did not mention arrives undefined and the upsert leaves it alone; only a value that is actually present can be a change.
        if (row[f] === undefined) continue;
        if (!sameish(before[f], row[f])) out.push({ field: f, word: FIELD_WORDS[f] || f, was: before[f], now: row[f] });
    }
    // The attachment LIST is what changes; the count is what the preview row carries, and a count that matches can still be a different set. Named honestly rather than claimed as equality.
    const beforeN = (before.attachments || []).length;
    if (typeof row.attachments === 'number' && row.attachments !== beforeN) {
        out.push({ field: 'attachments', word: 'Attachments', was: `${beforeN}`, now: `${row.attachments}` });
    }
    return out;
}

// ── THE MANIFEST ROW: BUILD NUMBER, CODE COPY, THE SHARE COMMAND, THE HUMAN LABEL ────────────
//
// Pin pmtylf7gz (2026-09-13 17:38 EDT, pins batch 2, spec §6). buildName is being retired as the thing a reader is shown -- 131 of 133 dev-catalogue builds hold a bare ordinal ("Build 1") and one holds a gunsmith code sitting in the wrong field -- WITHOUT retiring it as an IDENTITY, because /autobuild derives the next build number and the Cloudinary imageKey from "Build N" names (utils/loadoutRender.js's computeWeaponKeyAndBuild), the add/bulk-upsert match on {weaponKey, mode, buildName} (core/ops/loadouts.js, portal/api/bulk.js), delete-by-"weapon | build" matches it (core/ops/loadouts.js), Cloudinary metadata parses Build_Number out of it (utils/loadoutImageCache.js), and the scope sort tie-breaks on it (utils/loadoutScopes.js). So this is DISPLAY-ONLY: no write path here, no migration, buildName stays exactly what it has always been in storage.

// buildNumberOf(builds, build): this build's position among its own weapon+mode siblings, 1-based, ordered by _id -- the SAME tie-break utils/loadoutScopes.js's resolveScopeBuilds() uses, so a build shown here as "Build 2 of 5" is the same build /gunsmiths' own footer would call "Build 2 of 5".
function buildNumberOf(builds, build) {
    const key = String((build && (build._id ?? build.id)) ?? '');
    const siblings = (builds || [])
        .filter((b) => b.weaponKey === build.weaponKey && b.mode === build.mode)
        .sort((a, b) => String(a._id ?? a.id).localeCompare(String(b._id ?? b.id)));
    const at = siblings.findIndex((b) => String(b._id ?? b.id) === key);
    return { n: at === -1 ? 1 : at + 1, of: siblings.length || 1 };
}

// copyCodeText(build): what the row's copy icon actually copies. DMZ has no code by design (spec §6) -- an empty string here is correct, not a missing value.
function copyCodeText(build) {
    return (build && build.shareCode) || '';
}

// shareCommandText(build, n): the literal text a share icon copies, pasteable straight into Discord. 🔴 PROVEN TO RESOLVE, NOT ASSERTED. commands/gunsmiths.js's `search` subcommand's `weapon` option is autocomplete-backed but not required to come FROM autocomplete -- Discord submits whatever text a user typed. utils/loadoutLookup.js's lookupAndRenderWeapon() resolves it with `weaponKey = rawQuery.toLowerCase().replace(/\s+/g, '')`, and core/ops/loadouts.js's deriveWeaponKey() (the ONLY place a stored weaponKey is ever produced) is the exact same normalize applied to weaponName. So `build.weaponName`, typed back in verbatim, always re-derives the SAME weaponKey the document was saved under -- proven against the real normalize in scripts/armoryRealm.test.js, not by inspection.
function shareCommandText(build, n) {
    return `/gunsmiths search weapon:${build.weaponName} build:${n} visibility:Public`;
}

// The gunsmith-code shape utils/adminParser.js's own stripCodePrefix() comment already names: a genuine code is a contiguous digit-letter-digit-letter... run. Reused here so a stray code sitting in the buildName field (spec §6's dev-catalogue finding, "1C2B5B6D7O") is never shown as though it were a human label -- it already has a real home, the code column, and showing it twice would read as two different facts that happen to be identical.
const GUNSMITH_CODE_SHAPE = /^(?:\d[A-Za-z]){3,}\d?$/;

// displayBuildLabel(build): the human label the Manifest row/drawer show for buildName, or '' when there is nothing human to show -- an ordinal ("Build 3"), the schema default ("Standard Build"), or a gunsmith code in the wrong field. Storage is UNCHANGED either way; this decides what gets DISPLAYED, never what gets written. handlers/manage/loadouts.js and commands/manage.js relabel the Discord modal field around this same idea (an optional human build name) without changing the pipe share-code convention or what gets stored.
function displayBuildLabel(build) {
    const name = String((build && build.buildName) || '').trim();
    if (!name) return '';
    if (/^Build \d+$/.test(name)) return '';
    if (name === 'Standard Build') return '';
    if (GUNSMITH_CODE_SHAPE.test(name)) return '';
    return name;
}

// ── THE RACK'S SHAPE, AND THE TWO SEARCHES OVER IT ────────────────────────────────────────────
//
// 🔴 THE RACK IS GROUPED BY CATEGORY AND OPENS CLOSED — Harkirat, Pin 21: "WHY do I have to scroll all the way". Grouped by rank tier it was five permanently-open rows over the whole catalogue, so every visit began by scrolling past everything to reach the one weapon class you came for. Category is the axis a reader arrives with ("show me the SMGs"); rank has not been lost, it has moved one level down — the weapon groups inside a category are ordered best-first and each carries its tier as a badge, so the board still answers "what is ranked where" once it is open.
//
// ⚠️ THIS LIVES IN THE LOGIC FILE RATHER THAN IN armory.js BECAUSE EVERY FACT ON A CATEGORY HEADER IS ARITHMETIC — the count, the ordering, the teaser — and arithmetic that only a browser can run is arithmetic nothing checks. ORDER_STAMP is deliberately absent: the display order is a constant below, not a date.
const RANK_ORDER = ['best', 'top3', 'top4', 'top5', null];
const RANK_LABEL = { best: 'Best in category', top3: 'Top 3', top4: 'Top 4', top5: 'Top 5', null: 'Unranked' };
// 🔴 THESE STRINGS ARE CSS CLASS NAMES. app.css's `.t-best/.t-top3/.t-top4/.t-top5/.t-unranked` are what grade a tier visually, and this map once emitted `t-t3`/`t-t4`/`t-t5`/`t-none` — four selectors that named nothing while every gate stayed green. They now ride on the WEAPON GROUP rather than on a tier row, because the tier row is gone.
const RANK_KEY = { best: 'best', top3: 'top3', top4: 'top4', top5: 'top5', null: 'unranked' };

// The mockup's own chip vocabulary and display order (armory.html's `renderCatChips`) — short labels, distinct from the precise CATEGORY_LABEL the edit form's dropdown uses, which is verbose on purpose.
const CATEGORY_CHIP_LABEL = { AR: 'Assault', SMG: 'SMG', LMG: 'LMG', MARKSMAN: 'Marksman', SNIPER: 'Sniper', SHOTGUN: 'Shotgun', SECONDARIES: 'Secondaries' };
const CATEGORY_CHIP_ORDER = ['AR', 'SMG', 'LMG', 'MARKSMAN', 'SNIPER', 'SHOTGUN', 'SECONDARIES'];

// A DMZ build ranks on dmzRangeRank, which also encodes a combat range (`best-close`, `best-midlong`) — the tier is the part before the hyphen. An MP build ranks on categoryRank. Reading the wrong field is how DMZ builds all pile into Unranked while looking correct.
function rankOf(b) {
    const raw = b.mode === 'DMZ' ? b.dmzRangeRank : b.categoryRank;
    if (!raw) return null;
    return String(raw).split('-')[0];
}

// A weapon's position is its BEST claim, never its worst: a weapon with one Best build and three unranked ones is a Best weapon. `null` is RANK_ORDER's last entry, so unranked sorts last without a special case.
function bestRankIndex(list) {
    return (list || []).reduce((best, b) => Math.min(best, RANK_ORDER.indexOf(rankOf(b))), RANK_ORDER.length - 1);
}

// One entry per category PRESENT in the list, in the mockup's display order, with anything unexpected appended alphabetically rather than dropped — a category that exists in the data and not in the order table is a build nobody can find, which is worse than a row in the wrong place.
function rackCategories(builds) {
    const all = builds || [];
    const present = new Set(all.map((b) => b.category));
    const ordered = CATEGORY_CHIP_ORDER.filter((c) => present.has(c))
        .concat([...present].filter((c) => c && !CATEGORY_CHIP_ORDER.includes(c)).sort());
    return ordered.map((category) => {
        const list = all.filter((b) => b.category === category);
        const byWeapon = new Map();
        for (const b of list) {
            if (!byWeapon.has(b.weaponName)) byWeapon.set(b.weaponName, []);
            byWeapon.get(b.weaponName).push(b);
        }
        const groups = [...byWeapon.entries()]
            .map(([weapon, list2]) => {
                const tier = RANK_ORDER[bestRankIndex(list2)];
                return { weapon, builds: list2, tier, tierKey: RANK_KEY[String(tier)], tierLabel: RANK_LABEL[String(tier)] };
            })
            .sort((a, b) => RANK_ORDER.indexOf(a.tier) - RANK_ORDER.indexOf(b.tier) || a.weapon.localeCompare(b.weapon));
        // The teaser is the whole point of a closed row: a header reading "SMG 28" tells you nothing you could not have guessed, and one reading "SMG 28 — Best in category: Fennec" tells you whether to open it.
        const top = groups[0] || null;
        const topBuild = top
            ? [...top.builds].sort((x, y) => RANK_ORDER.indexOf(rankOf(x)) - RANK_ORDER.indexOf(rankOf(y)))[0]
            : null;
        return {
            category, label: CATEGORY_CHIP_LABEL[category] || category,
            builds: list, groups, count: list.length, weapons: byWeapon.size,
            accent: (list[0] && list[0].accent) || null,
            teaser: topBuild ? `${topBuild.weaponName} · ${topBuild.buildName || 'Standard Build'}` : '',
            teaserRank: top ? top.tierLabel : RANK_LABEL['null'],
        };
    });
}

// ── THE WEAPON SEARCH ─────────────────────────────────────────────────────────────────────────
//
// 🔴 PICK-TWO WAS THE WRONG QUESTION — Harkirat, Pin 18: "why can't I just type the weapon name / compare multiple builds of that weapon". Compare offered the first forty builds in the catalogue as chips and asked you to find two by eye; the comparison anyone actually wants is "this weapon, all of its builds", which a chip bar can express only by scrolling to two chips that happen to share a name. So the entry point is a typed weapon and the comparison is its whole sibling set — which is exactly the set the near-duplicate flag is about.
function weaponOptions(builds) {
    const byWeapon = new Map();
    for (const b of builds || []) {
        if (!byWeapon.has(b.weaponName)) byWeapon.set(b.weaponName, []);
        byWeapon.get(b.weaponName).push(b);
    }
    return [...byWeapon.entries()]
        .map(([weapon, list]) => ({ weapon, builds: list, category: list[0].category }))
        // Most builds first, because a weapon with five builds is the one this view exists for; ties by name so the list is stable between renders rather than in Map insertion order, which follows the API's own ordering.
        .sort((a, b) => b.builds.length - a.builds.length || a.weapon.localeCompare(b.weapon));
}

// ⚠️ SUBSTRING, NOT PREFIX. "117" finds the AK117 and "fen" finds the Fennec; a prefix match would refuse the first and a fuzzy match would offer weapons that share no letters in order, which reads as a broken search. Already-picked weapons are removed rather than shown disabled: an option that cannot be chosen is a dead row in a list whose whole job is that every row is one keystroke from being chosen.
function matchWeapons(options, q, picked, limit = 8) {
    const needle = String(q || '').trim().toLowerCase();
    if (!needle) return [];
    const taken = picked || [];
    return (options || [])
        .filter((o) => o.weapon.toLowerCase().includes(needle) && !taken.includes(o.weapon))
        .slice(0, limit);
}

// ── WHAT STOPS A DRAWER FROM STAGING ──────────────────────────────────────────────────────────
//
// 🔴 A DISABLED CONTROL THAT DOES NOT SAY WHY IS THE SAME DEFECT AS A CHECK THAT CANNOT FAIL: the reader learns nothing from it. Both drawers put the reason on the footer line beside the button, so the sentence and the state it explains are one thing rather than a greyed button and a required-field marker eight hundred pixels above it.
//
// ⚠️ THE GUNSMITH CODE NEVER BLOCKS, and that is a decision rather than an omission. correctGunsmithCode CORRECTS a code — it maps look-alike characters onto whichever type each position expects — so refusing input client-side would refuse exactly the input the server was about to fix.
function addFormBlockers(f) {
    const out = [];
    if (!String((f && f.weaponName) || '').trim()) out.push('a weapon name');
    if (!String((f && f.category) || '').trim()) out.push('a category');
    return out;
}

// The fields loadout.edit actually writes, which is what makes "nothing has changed" answerable. `attachments` is compared as a LIST rather than a count: two five-attachment lists that differ in one string are a real edit, and a count comparison would call them equal.
const EDIT_DIRTY_FIELDS = ['weaponName', 'buildName', 'category', 'mode', 'shareCode', 'imageKey',
    'isMeta', 'isToxic', 'categoryRank', 'dmzRangeRank', 'description'];

function editedFields(build, draft) {
    const before = build || {};
    const after = draft || {};
    const out = EDIT_DIRTY_FIELDS.filter((k) => String(before[k] ?? '') !== String(after[k] ?? ''));
    if ((before.attachments || []).join('\u0000') !== (after.attachments || []).join('\u0000')) out.push('attachments');
    return out;
}

// 🔴 STAGING A NO-OP EDIT IS NOT HARMLESS — it puts a row on the Review screen that changes nothing, which somebody then has to read, understand and decide about. An edit drawer that cannot tell you it has nothing to stage is one that quietly manufactures work for the only screen that commits.
function editorBlockers(build, draft) {
    const out = [];
    if (!String((draft && draft.weaponName) || '').trim()) out.push('a weapon name');
    else if (!editedFields(build, draft).length) out.push('a change — every field still matches the live build');
    return out;
}


// ── THE GUNSMITH CODE NAMES A SLOT PER DIGIT, AND CROSS-BUILD FACTS NAME THE ATTACHMENT ────────
//
// Brief D 1b, spec §6/§10.1 row 15. A CODM Gunsmith share code alternates Number-Letter for its whole length (utils/adminParser.js's correctGunsmithCode comment), and the NUMBER is fixed to one slot -- this is a Gunsmith-code fact, not something any one build's data decides. Mirrored here rather than imported because utils/adminParser.js is Node-only (chrono-node/dayjs) and the browser bundle never loads it -- same pattern as parseBadgesToken above.
const SLOT_DIGIT_TO_KEY = { '1': 'muzzle', '2': 'barrel', '3': 'optic', '4': 'stock', '5': 'perk',
    '6': 'laser', '7': 'underbarrel', '8': 'ammunition', '9': 'rear grip' };
// utils/adminParser.js's CANONICAL_SLOT_ORDER, mirrored (see SLOT_DIGIT_TO_KEY above for why). 'trigger action' is carried for fidelity with that array but is never a slot any build actually populates -- visionExtract.js's prompt has no field for it -- so DISPLAY_SLOT_ORDER below drops it.
const CANONICAL_SLOT_ORDER = ['optic', 'muzzle', 'barrel', 'stock', 'laser', 'underbarrel', 'trigger action', 'rear grip', 'ammunition', 'perk'];
const DISPLAY_SLOT_ORDER = CANONICAL_SLOT_ORDER.filter((s) => s !== 'trigger action');
const SLOT_LABEL_TEXT = { optic: 'Optic', muzzle: 'Muzzle', barrel: 'Barrel', stock: 'Stock', laser: 'Laser',
    underbarrel: 'Underbarrel', 'rear grip': 'Rear Grip', ammunition: 'Ammunition', perk: 'Perk' };

const canonicalSlot = (raw) => String(raw || '').toLowerCase().trim();

// A code's pairs, in the order they appear -- "2A4B5A8C9C" -> [{pair:'2A',digit:'2',letter:'A'}, ...]. Tolerant of a code still mid-typing (an odd trailing digit with no letter yet is simply not a pair).
function parseCodePairs(code) {
    const out = [];
    for (const m of String(code || '').matchAll(/(\d)([A-Za-z])/g)) {
        out.push({ pair: `${m[1]}${m[2].toUpperCase()}`, digit: m[1], letter: m[2].toUpperCase() });
    }
    return out;
}

// slotCatalogue(builds, mode): attachment name -> slot label ("Barrel"), read off every build's parallel attachments[]/attachmentSlots[] arrays (backfilled from Cloudinary metadata, scripts/backfillSlotsFromMetadata.js). Mode-scoped: MP and DMZ draw from largely disjoint attachment pools, and a cross-mode collision would misname a slot the way a cross-weapon one would (row 15's own measurement). Feeds the weapon/attachment fuzzy search (row 16) -- narrowing which attachments a slot's search offers, and greying a match whose slot is already filled.
function slotCatalogue(builds, mode) {
    const map = {};
    for (const b of builds || []) {
        if (mode && b.mode !== mode) continue;
        const names = b.attachments || [];
        const slots = b.attachmentSlots || [];
        for (let i = 0; i < names.length; i++) {
            const name = String(names[i] || '').trim();
            const slot = canonicalSlot(slots[i]);
            if (!name || !SLOT_LABEL_TEXT[slot]) continue;
            map[name] = SLOT_LABEL_TEXT[slot];
        }
    }
    return map;
}

// codeFill(builds, weaponKey, mode, code): one entry per digit-letter pair in `code`, in DISPLAY_SLOT_ORDER, naming the attachment another build of the SAME weapon+mode carries at that exact pair -- or null when this weapon has never used it. MP only (row 17: DMZ has no code).
//
// 🔴 THE REGISTRY IS SCOPED TO ONE WEAPON, NEVER GLOBAL -- this IS the falsifier (row 15: the same pair disagrees across different weapons 36 of 56 times measured). A registry built over every weapon and keyed only by pair would let a Fennec's "2A" answer for a LOCUS's "2A"; scoping the loop to `b.weaponKey === weaponKey` up front makes that structurally impossible rather than merely untested.
function codeFill(builds, weaponKey, mode, code) {
    if (mode !== 'MP') return [];
    const pairs = parseCodePairs(code);
    if (!pairs.length) return [];
    const registry = {}; // pair -> attachment name, built only from THIS weapon's own MP siblings.
    for (const b of builds || []) {
        if (b.mode !== 'MP' || b.weaponKey !== weaponKey || !b.shareCode) continue;
        const names = b.attachments || [];
        const slots = b.attachmentSlots || [];
        const bPairs = parseCodePairs(b.shareCode);
        for (let i = 0; i < names.length; i++) {
            const slotKey = canonicalSlot(slots[i]);
            const name = String(names[i] || '').trim();
            if (!name || !SLOT_LABEL_TEXT[slotKey]) continue;
            // The pair whose DIGIT matches this attachment's slot is the pair that named it in b's own code.
            const found = bPairs.find((p) => SLOT_DIGIT_TO_KEY[p.digit] === slotKey);
            if (found && registry[found.pair] === undefined) registry[found.pair] = name;
        }
    }
    const byDigit = new Map(pairs.map((p) => [SLOT_DIGIT_TO_KEY[p.digit], p]));
    return DISPLAY_SLOT_ORDER
        .filter((slot) => byDigit.has(slot))
        .map((slot) => {
            const p = byDigit.get(slot);
            return { pair: p.pair, digit: p.digit, slot, label: SLOT_LABEL_TEXT[slot], name: registry[p.pair] || null };
        });
}


// deriveNextImageKey(builds, weaponName, mode): client-side mirror of utils/loadoutImageCache.js's deriveImageKey -- same convention (WEAPON-NAME-N, DMZ- prefixed for DMZ), computed against every imageKey already IN the loaded catalogue rather than a server round trip, so the New Build drawer can show the real next key ("AK117-6") live as the weapon name is typed. Server-side deriveImageKey stays the one place the ACTUAL upload uses (core/ops/loadouts.js, at commit) -- this is a preview only.
function deriveNextImageKey(builds, weaponName, mode) {
    const base = String(weaponName || '').trim().toUpperCase().replace(/\s+/g, '-');
    if (!base) return '';
    const prefix = mode === 'DMZ' ? 'DMZ-' : '';
    const taken = new Set((builds || []).map((b) => String(b.imageKey || '').toUpperCase()));
    let n = 1;
    while (taken.has(`${prefix}${base}-${n}`)) n++;
    return `${prefix}${base}-${n}`;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { bulkFieldDiff, findLocalBuild, buildArmoryAddOp, buildArmoryEditOp, parseBadgesToken, bulkPasteSummary, armoryExportQuery, DMZ_RANGE_TOKENS, MP_RANK_TOKENS,
        RANK_ORDER, RANK_LABEL, RANK_KEY, CATEGORY_CHIP_LABEL, CATEGORY_CHIP_ORDER,
        rankOf, bestRankIndex, rackCategories, weaponOptions, matchWeapons,
        addFormBlockers, editedFields, editorBlockers, EDIT_DIRTY_FIELDS,
        buildNumberOf, copyCodeText, shareCommandText, displayBuildLabel, GUNSMITH_CODE_SHAPE,
        slotCatalogue, codeFill, parseCodePairs, DISPLAY_SLOT_ORDER, SLOT_LABEL_TEXT, SLOT_DIGIT_TO_KEY, deriveNextImageKey };
}
