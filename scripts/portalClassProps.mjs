// scripts/portalClassProps.mjs — the one list both portal class gates read.
//
// 🔴 IT EXISTS BECAUSE THE TWO GATES DRIFTED AND A NO-OP CLASS SHIPPED THROUGH THE GAP. `portal:coverage` counts what the portal emits; `portal:orphans` refuses a class with no rule behind it. Coverage's own header claims the pair holds each other — "neither direction is free" — and that claim was FALSE on 2026-08-26: `tone` was added to coverage's prop list and not to orphans', so `tone: 'live'` counted as covered while the gate that would have caught `.stat.live` having no rule anywhere could not see the syntax at all. A class that styled nothing shipped, and the number went up.
//
// ⚠️ A PROP THAT NAMES A CLASS GOES HERE, NOWHERE ELSE. Neither gate keeps its own copy, so they cannot disagree again — which is the only version of "the gates hold each other" that is actually true.
//
// ⚠️ AND IT IS A MODULE WITH NO SIDE EFFECTS ON PURPOSE. The first attempt put this constant in portalOrphans.mjs and imported it from coverage — which RAN the orphan check on import, so `portalCoverage` printed the other gate's output instead of its own. A script is not a library.
export const CLASS_PROPS = ['col', 'metaClass', 'cls', 'accentClass', 'tone'];
