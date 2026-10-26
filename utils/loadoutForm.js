// utils/loadoutForm.js
//
// /manage's Add and Edit Loadout pop-up, as five fields (Harkirat, 2026-10-25 21:48 EDT): "weapon name and label" · "category, build #, gunsmith code" · "attachments and badges" · "replace image (url)" · "replace image (screenshot)". This module reads and writes the three text fields and works out build numbers; it knows nothing about Discord or Mongo, so scripts/loadoutForm.test.js can pin every rule.
//
// The label is back-end only and in the pop-up it stays behind the weapon name, as `BAL-27, Ranked` (his word, 2026-10-25 22:15 EDT). Before this the label WAS the build's name, so a labelled build had no number at all; buildName is now always `Build N` and the label has its own field (models/Loadout.js).

// Either separator, his "comma or | separated". No weapon name or category contains one, and a gunsmith code is letters and digits only.
const SEPARATOR = /[,|]/;
const BUILD_NUMBER = /^Build (\d+)$/i;

// "BAL-27, Ranked" -> { weaponName: 'BAL-27', label: 'Ranked' }. Split at the FIRST separator only, so a label may itself hold a comma.
function parseWeaponLabel(raw) {
    const s = String(raw || '').trim();
    const i = s.search(SEPARATOR);
    if (i === -1) return { weaponName: s, label: '' };
    return { weaponName: s.slice(0, i).trim(), label: s.slice(i + 1).trim() };
}

// "AR, 2, 1C2B4A8B9A" (MP) or "AR, 2" (DMZ, whose gunsmith screens carry no code). An empty build # is allowed and means "next" on a new build and "unchanged" on an edit. Returns { category, number, code } or { error }.
function parseIdentity(raw, mode) {
    const parts = String(raw || '').split(SEPARATOR).map(p => p.trim());
    const [category, numberRaw = '', codeRaw = ''] = parts;
    if (!category) return { error: mode === 'DMZ' ? 'The second box needs a category first, e.g. `AR, 2`.' : 'The second box needs a category first, e.g. `AR, 2, 1C2B4A8B9A`.' };
    if (parts.length > (mode === 'DMZ' ? 2 : 3)) return { error: mode === 'DMZ' ? 'The second box takes `category, build #` on a DMZ build (DMZ has no gunsmith code).' : 'The second box takes `category, build #, gunsmith code`.' };
    let number = null;
    if (numberRaw) {
        if (!/^\d+$/.test(numberRaw) || Number(numberRaw) < 1) return { error: `\`${numberRaw}\` isn't a build number. Use 1, 2, 3...` };
        number = Number(numberRaw);
    }
    const code = mode === 'DMZ' ? '' : codeRaw.replace(/\s+/g, '').toUpperCase();
    // Letters and digits only: the code becomes the picture's key (utils/loadoutImageCache.js isKeyableCode says why).
    if (code && !/^[A-Z0-9]{4,16}$/.test(code)) return { error: `\`${codeRaw}\` doesn't look like a gunsmith code: it is letters and digits only, e.g. \`1C2B4A8B9A\`.` };
    return { category: category.toUpperCase(), number, code };
}

// The attachments box: one attachment per line, and a `Badges:` line for the badges (the pop-up has no sixth slot, Discord's cap). A leading bullet is dropped, as the bulk format allows.
const BADGES_LINE = /^badges\s*:\s*(.*)$/i;
function parseAttachmentsBadges(raw) {
    const attachments = [];
    let badgesRaw = '';
    for (const line of String(raw || '').split('\n').map(l => l.trim()).filter(Boolean)) {
        const badge = BADGES_LINE.exec(line);
        if (badge) { badgesRaw = [badgesRaw, badge[1].trim()].filter(Boolean).join(', '); continue; }
        attachments.push(line.replace(/^[-•*]\s+/, '').trim());
    }
    return { attachments: attachments.filter(Boolean), badgesRaw };
}

// The number in a `Build N` name, or null for a legacy labelled build (one whose label was stored as its name).
function buildNumberOf(buildName) {
    const m = BUILD_NUMBER.exec(String(buildName || '').trim());
    return m ? Number(m[1]) : null;
}

// A weapon's builds in their shown order: by build number, then anything unnumbered by _id. /gunsmith's "Build N of M" and the pop-up's build # are then the same number, so a swap in the pop-up swaps the two cards (before this, /gunsmith listed in _id order and the stored number did not decide anything).
function compareBuilds(a, b) {
    const na = buildNumberOf(a.buildName), nb = buildNumberOf(b.buildName);
    if (na !== null && nb !== null && na !== nb) return na - nb;
    if (na !== null && nb === null) return -1;
    if (na === null && nb !== null) return 1;
    return String(a._id).localeCompare(String(b._id));
}

// A build's number for the pop-up: its own `Build N`, else its 1-based place among `siblings` (its weapon's builds in that mode, itself included).
function numberFor(build, siblings) {
    const own = buildNumberOf(build.buildName);
    if (own !== null) return own;
    const i = [...siblings].sort(compareBuilds).findIndex(s => String(s._id) === String(build._id));
    return i === -1 ? null : i + 1;
}

// What the save does to build numbers. `siblings` are the weapon's builds in this mode (on an edit, the target included). A number another build holds SWAPS them (his ask, 2026-10-25 21:48 EDT); on a new build, the holder moves to the end. Returns { number, moves: [{ id, buildName }] } or { error }.
function planNumbering({ siblings, targetId = null, wanted = null }) {
    const isAdd = !targetId;
    const others = siblings.filter(s => String(s._id) !== String(targetId));
    const target = isAdd ? null : siblings.find(s => String(s._id) === String(targetId));
    const max = isAdd ? others.length + 1 : siblings.length;
    const current = target ? numberFor(target, siblings) : null;
    const number = wanted ?? current ?? max;
    if (number < 1 || number > max) return { error: `This weapon has ${max === 1 ? '1 build slot' : `builds 1 to ${max}`}, so build # ${number} isn't one of them.` };
    const holder = others.find(s => numberFor(s, siblings) === number);
    const moves = [];
    if (holder) moves.push({ id: String(holder._id), buildName: `Build ${isAdd ? max : (current ?? max)}` });
    return { number, moves };
}

// The three text boxes, filled from a saved build, so reopening Edit and saving unchanged changes nothing. A legacy build with its label as its name shows that name as the label.
function editValues(build, siblings, badgeTokens = []) {
    const label = build.label || (buildNumberOf(build.buildName) === null && build.buildName !== 'Standard Build' ? build.buildName : '');
    const number = numberFor(build, siblings) ?? '';
    const identity = build.mode === 'DMZ'
        ? `${build.category}, ${number}`
        : `${build.category}, ${number}${build.shareCode ? `, ${build.shareCode}` : ''}`;
    return {
        weapon: label ? `${build.weaponName}, ${label}` : build.weaponName,
        build: identity,
        attachments: [...(build.attachments || []), `Badges: ${badgeTokens.join(', ')}`].join('\n'),
    };
}

// /manage's Edit search, straight to one build (Harkirat, 2026-10-26 12:24 EDT: "you can build the search"): `BAL-27 2`, `BAL-27, 2`, `BAL-27 Build 2` or `BAL-27 Ranked` is that build, with no picker. The query splits at a space, comma or pipe into a weapon and a tail; the tail is a build number, or a label (a legacy name counts). Returns the build only when exactly one matches, so anything ambiguous still gets the picker.
function pickBuild(query, builds) {
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const q = String(query || '').trim();
    const found = new Map();
    const cuts = [...q.matchAll(/[\s,|]+/g)].map(m => [m.index, m.index + m[0].length]);
    for (const [end, start] of cuts) {
        const weapon = norm(q.slice(0, end));
        let tail = q.slice(start).trim().replace(/^build\s+/i, '');
        if (!weapon || !tail) continue;
        const number = /^\d+$/.test(tail) ? Number(tail) : null;
        for (const b of builds) {
            if (norm(b.weaponName) !== weapon) continue;
            const hit = number !== null
                ? buildNumberOf(b.buildName) === number
                : [b.label, b.buildName].some(n => n && norm(n) === norm(tail));
            if (hit) found.set(String(b._id), b);
        }
    }
    return found.size === 1 ? [...found.values()][0] : null;
}

// Two gunsmith codes are the same code when they match ignoring case and spaces.
const sameCode = (a, b) => Boolean(a) && Boolean(b) && String(a).replace(/\s+/g, '').toUpperCase() === String(b).replace(/\s+/g, '').toUpperCase();

module.exports = { parseWeaponLabel, parseIdentity, parseAttachmentsBadges, buildNumberOf, compareBuilds, numberFor, planNumbering, editValues, sameCode, pickBuild };
