// scripts/portalOpsReach.test.js — can every declared capability be reached at all?
//
// 🔴 EIGHTEEN OF FORTY-TWO DECLARED OPS HAD NO PORTAL SURFACE, and the two that mattered most were loadout.bulkAdd and loadout.bulkReplace: tier 2, real /manage action ids, a permission scope, a tested apply() with a compound inverse — and not one affordance anywhere in the portal. That is the same shape as the seven tier-3 operations found the day before, and no gate could see it for the same reason: every other check here measures what the code DOES, and a capability with no affordance does nothing.
//
// 🔴 THE ONLY CHECK THAT CAN SEE AN ABSENCE IS CONSERVATION — what one authority declares against what another offers. scripts/portalOneWay.test.js does that for tier 3 and for season; this does it for the WHOLE registry, which is the generalisation that would have caught all eighteen at once. Every op is either named by a portal source file or carries an entry here saying why it must not be, and an entry that stops being true fails this file.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let failures = 0;
const say = console.log.bind(console);
function check(name, fn) {
    try { fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

say('portalOpsReach — is every declared capability reachable from the portal?');

const ROOT = path.join(__dirname, '..');
const uiSource = fs.readdirSync(path.join(ROOT, 'portal', 'ui'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(ROOT, 'portal', 'ui', f), 'utf8'))
    .join('\n');

// 🔴 AN ENTRY HERE IS A CLAIM THAT GETS CHECKED, not a suppression. Each names the property that makes a portal button wrong, and the two checks below verify that property against core/ops itself — so an op that gains a /manage action, or an "inverse-only" op that turns out to have no inverting producer, fails rather than sitting quietly on this list forever.
const NO_SURFACE = {
    // ── Inverse-only: produced by another op's invert() and by nothing else. A button for one of these would let somebody restore a thing nobody removed.
    'patchnote.removeSeason': { why: 'inverse-only — patchnote.addSeason inverts to it', inverseOnly: true },
    'patchnote.restoreSeason': { why: 'inverse-only — patchnote.removeSeason inverts to it', inverseOnly: true },
    'patchnote.restore': { why: 'inverse-only — patchnote.purge inverts to it', inverseOnly: true },
    'season.restoreSnapshot': { why: 'inverse-only — season.promoteDraft inverts to it', inverseOnly: true },
    'season.restoreDraft': { why: 'inverse-only — season.discardDraft inverts to it', inverseOnly: true },

    // ── Reached through an EQUIVALENT op, deliberately. The capability is offered; this particular type is not the one the surface sends. `equivalent` names the type that IS sent, and the check below asserts that one really is reachable — otherwise this list would excuse an absence by pointing at a second absence.
    'loadout.delete': { equivalent: 'loadout.bulkDelete', why: 'the Manifest stages loadout.bulkDelete with a one-element id list, so one delete and many are one code path and one changeset row' },
    'loadout.bulkReplace': { equivalent: 'loadout.bulkAdd', why: 'core/ops gives it the SAME apply() body as loadout.bulkAdd and keeps it a distinct type only so the registry\'s separate bulkreplace action id resolves — /manage opens the identical modal for both. A second button would be one upsert wearing two names' },
    'draw.bulkAdd': { equivalent: 'draw.add', why: 'the composer stages one draw.add per pasted row, so each row is separately visible on Review and separately invertible; the draft path uses season.bulkDraftDraws' },
    'draw.bulkReplace': { equivalent: 'draw.add', why: 'wholesale replace has no portal surface on purpose — it deletes every draw the paste did not mention, and the composer upserts row by row instead' },
    'draw.bulkDelete': { equivalent: 'draw.delete', why: 'the Track and Manifest delete a draw at a time; a multi-select delete would stage those same ops' },
    'calendar.bulkAdd': { equivalent: 'calendar.add', why: 'the composer stages one calendar.add per pasted row; the draft path uses season.bulkDraftCalendar' },
    'calendar.bulkReplace': { equivalent: 'calendar.add', why: 'same wholesale-replace hazard as draw.bulkReplace' },
    'calendar.bulkDelete': { equivalent: 'calendar.delete', why: 'the Track and Manifest delete an entry at a time' },
};

check('every declared op is either named by a portal source file or excluded here, with a reason', () => {
    const ops = require('../core/ops');
    const declared = ops.listOpTypes();
    assert.ok(declared.length >= 30, `the registry scan found ${declared.length} ops — too few to be real, so this check would be vacuous`);
    const unreached = declared.filter((t) => !uiSource.includes(`'${t}'`) && !uiSource.includes(`"${t}"`) && !NO_SURFACE[t]);
    assert.deepStrictEqual(unreached, [], `core/ops declares ${unreached.join(', ')} and no portal surface names it — build the surface, or add an entry to NO_SURFACE saying why there must not be one`);
});

check('THE REACHABILITY CHECK CAN FAIL: an op named nowhere and not excluded is caught', () => {
    assert.throws(() => {
        const src = "type: 'loadout.add'";
        const unreached = ['loadout.add', 'loadout.bulkAdd'].filter((t) => !src.includes(`'${t}'`) && !{}[t]);
        assert.deepStrictEqual(unreached, [], `unreached: ${unreached.join(', ')}`);
    }, /unreached: loadout\.bulkAdd/);
});

check('no exclusion is stale — every key is still a real op type', () => {
    const ops = require('../core/ops');
    const declared = new Set(ops.listOpTypes());
    const ghosts = Object.keys(NO_SURFACE).filter((t) => !declared.has(t));
    assert.deepStrictEqual(ghosts, [], `NO_SURFACE excuses ${ghosts.join(', ')}, which core/ops no longer declares`);
});

// ⚠️ THE EXCLUSION IS ONLY AS GOOD AS ITS CLAIM. "Inverse-only" means the op is not something an admin picks, and the property that makes that true is having no /manage action id — the same property portalOneWay.test.js filters tier-3 ops on. An op that gains one has become pickable and needs a surface, so it must fall out of this list rather than keep being excused by a comment written when it did not.
check('every op claimed INVERSE-ONLY really has no /manage action', () => {
    const ops = require('../core/ops');
    const wrong = Object.entries(NO_SURFACE)
        .filter(([, v]) => v.inverseOnly)
        .filter(([t]) => Boolean(ops.resolveOp(t).action))
        .map(([t]) => t);
    assert.deepStrictEqual(wrong, [], `${wrong.join(', ')} is excused as inverse-only but carries a /manage action, so an admin can pick it and the portal cannot`);
});

check('every op claimed INVERSE-ONLY is really produced by some other op\'s invert()', () => {
    const ops = require('../core/ops');
    const core = fs.readdirSync(path.join(ROOT, 'core', 'ops'))
        .filter((f) => f.endsWith('.js'))
        .map((f) => fs.readFileSync(path.join(ROOT, 'core', 'ops', f), 'utf8')).join('\n');
    const claimed = Object.entries(NO_SURFACE).filter(([, v]) => v.inverseOnly).map(([t]) => t);
    assert.ok(claimed.length >= 3, `only ${claimed.length} inverse-only claims — too few for this check to mean anything`);
    // The producer is another op's invert(); the op's OWN registration line is not evidence of one, so it is removed before looking.
    const orphans = claimed.filter((t) => {
        const withoutOwnKey = core.split(`'${t}': {`).join('');
        return !withoutOwnKey.includes(`type: '${t}'`);
    });
    assert.deepStrictEqual(orphans, [], `${orphans.join(', ')} is excused as inverse-only, but no invert() in core/ops produces it — it is simply unreachable`);
});

// ⚠️ AN EXCUSE THAT POINTS AT A SECOND ABSENCE IS NOT AN EXCUSE. "Reached through draw.add instead" only holds while draw.add is itself reachable — so the equivalent is checked exactly the way the excused op would have been.
check('every EQUIVALENT named as the reason really is reachable', () => {
    const ops = require('../core/ops');
    const claimed = Object.entries(NO_SURFACE).filter(([, v]) => v.equivalent);
    assert.ok(claimed.length >= 5, `only ${claimed.length} equivalence claims — too few for this check to mean anything`);
    const broken = claimed
        .filter(([, v]) => !uiSource.includes(`'${v.equivalent}'`) || !ops.listOpTypes().includes(v.equivalent))
        .map(([t, v]) => `${t} -> ${v.equivalent}`);
    assert.deepStrictEqual(broken, [], `${broken.join(', ')} — the op named as the reachable equivalent is not itself reachable`);
});

check('THE EQUIVALENCE CLAIM CAN FAIL: pointing at an unreachable op is caught', () => {
    assert.throws(() => {
        const src = "type: 'draw.add'";
        const broken = [['draw.bulkAdd', 'draw.add'], ['calendar.bulkAdd', 'calendar.add']]
            .filter(([, eq]) => !src.includes(`'${eq}'`)).map(([t, eq]) => `${t} -> ${eq}`);
        assert.deepStrictEqual(broken, [], `broken: ${broken.join(', ')}`);
    }, /broken: calendar\.bulkAdd -> calendar\.add/);
});

check('THE INVERSE-ONLY CLAIM CAN FAIL: an op nothing inverts to is caught', () => {
    assert.throws(() => {
        const core = "invert: (c) => ({ type: 'patchnote.removeSeason' })";
        const orphans = ['patchnote.removeSeason', 'season.restoreDraft'].filter((t) => !core.includes(`type: '${t}'`));
        assert.deepStrictEqual(orphans, [], `orphans: ${orphans.join(', ')}`);
    }, /orphans: season\.restoreDraft/);
});


say(failures ? `\n✗ ${failures} failed` : '\n✅ portalOpsReach: every op core/ops declares is reachable from the portal, or excused by a claim that is itself checked');
process.exit(failures ? 1 : 0);
