// scripts/lib/designClasses.cjs — WHICH CLASSES THE DESIGN ITSELF EMITS.
//
// 🔴 WHY THIS EXISTS. Two gates — `portal:orphans` and `portal:reverse-orphans` — both fail on "a class
// emitted with no rule behind it", and neither could tell the two cases apart:
//
//   · the PORTAL invented a class and nothing styles it        → a real defect, an element with no styling
//   · the DESIGN emits it unstyled and the portal matches that → the conformance pass working
//
// Found 2026-08-31, when the mode collapse removed the portal-only rule behind `.rowlife` and both gates
// reported it. But the mockup's own season.html emits `<div class="rowmeta rowlife">` on every row and its
// stylesheet defines no `.rowlife` either — it is a semantic hook the design carries unstyled. Matching it
// is correct, and REMOVING it would change the element's class list, which is what the audit's walk pairs
// on, desynchronising every node beneath.
//
// ⚠️ IT IS NOT AN EXEMPTION. An inherited orphan is reported on every run and simply does not FAIL, so it
// can never quietly become an excuse — and it never needs a line in a debt baseline, whose own rule is that
// it only ever shrinks. Growing a baseline to absorb a correct match would have made that ratchet a diary.
//
// ⚠️ NO FALLBACK ON A MEASUREMENT. If the package cannot be read this returns an EMPTY set and the caller
// must say so, rather than silently certifying every orphan as the design's.

const fs = require('fs');
const path = require('path');

const PKG = path.join(__dirname, '..', '..', 'docs', 'superpowers', 'mockups', '2026-08-23-portal-interactive');

function designClasses(dir = PKG) {
    const out = new Set();
    if (!fs.existsSync(dir)) return out;
    for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.html')) continue;
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        // The package's pages are templates, so a class attribute routinely holds `${...}` interpolation.
        // Split on everything a template can put between names and keep only real identifiers.
        for (const m of src.matchAll(/class="([^"]*)"/g)) {
            for (const c of m[1].split(/[\s${}?:'"+()!=<>&|.,]+/)) {
                if (/^[a-zA-Z][\w-]*$/.test(c)) out.add(c);
            }
        }
    }
    return out;
}

module.exports = { designClasses, PKG };
