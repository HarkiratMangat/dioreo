// ==========================================
// DRAW REMAINDER MATH
// ==========================================
// "I have done N pulls -- what is left?" Every figure here is a slice or a sum of DRAW_DATA's existing per-pull arrays; nothing is stored and nothing is hand-typed, which is the same rule DRAW_DATA's own header comment sets out. Deliberately knows NOTHING about money -- utils/ cpPackages.js handles that half. Design: docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md.
//
// ⚠️ PULL COUNTS ARE NOT UNIFORMLY TEN. sevenSpinLegendaryWeapon and pickYourRewardCard have SEVEN pulls. Every bound below derives from draws.length for that reason; a hardcoded 10 would pass testing on the seven common draws and silently overcount on the other two.
//
// ⚠️ ABSENT DATA RETURNS null, NEVER AN ESTIMATE. doubleEpicCharacters has no data at region_20 or region_30, and the two mythic draws have no upgrade figure at region_20. Both gaps are deliberate -- Harkirat refused to ship a speculative estimate as real pricing -- so callers render the existing "haven't done the research yet" placeholder rather than computing around them.
const { DRAW_DATA } = require('../commands/drawprices');

function entryFor(region, key) {
    const regionData = DRAW_DATA[region];
    if (!regionData) return null;
    return regionData[key] || null;
}

function pullCount(region, key) {
    const entry = entryFor(region, key);
    return entry ? entry.draws.length : null;
}

function sumRange(draws, from, to) {
    let total = 0;
    for (let i = from; i < to; i++) total += draws[i];
    return total;
}

function spentSoFar(region, key, pullsDone) {
    const entry = entryFor(region, key);
    if (!entry) return null;
    return sumRange(entry.draws, 0, Math.min(pullsDone, entry.draws.length));
}

function remainingToFinish(region, key, pullsDone) {
    const entry = entryFor(region, key);
    if (!entry) return null;
    return sumRange(entry.draws, Math.min(pullsDone, entry.draws.length), entry.draws.length);
}

// targetPull is 1-indexed as a player counts them: "get me to pull 9" means through draws[8].
function remainingToPull(region, key, pullsDone, targetPull) {
    const entry = entryFor(region, key);
    if (!entry) return null;
    const to = Math.min(targetPull, entry.draws.length);
    return sumRange(entry.draws, Math.min(pullsDone, to), to);
}

function upgradeCost(region, key) {
    const entry = entryFor(region, key);
    if (!entry || !entry.upgrade) return null;
    return entry.upgrade.perDraw * entry.upgrade.count;
}

// Budget mode, the inverse question: "I can spend this much -- how far does it get me?" cpShortOfNext is what they would still need for the pull AFTER the one they can reach, and is null when the budget finishes the draw outright.
function reachableWithBudget(region, key, pullsDone, budgetCp) {
    const entry = entryFor(region, key);
    if (!entry) return null;
    let used = 0;
    let pull = pullsDone;
    while (pull < entry.draws.length && used + entry.draws[pull] <= budgetCp) {
        used += entry.draws[pull];
        pull++;
    }
    return {
        pullsReachable: pull,
        cpUsed: used,
        cpShortOfNext: pull < entry.draws.length ? entry.draws[pull] - (budgetCp - used) : null
    };
}

// The basket cost model (added 2026-08-27 11:41 EDT, the saved-basket redesign) -- one call over the WHOLE flat banner list, never a per-type loop, because the basket has no per-type grouping left to loop over (docs/superpowers/specs/2026-08-27-draw-calculator-multi-draw-design.md §1). Upgrades are added PER BANNER, not once per draw type -- three Mythic Weapon banners each carry their own upgrade cost when the toggle is on, because each is an independently in-progress draw.
//
// An unpriced banner (no DRAW_DATA at this region) is EXCLUDED from the total and reported with `priced: false` rather than silently dropped or estimated -- spec §9, and the same never-interpolate rule DRAW_DATA's own header sets out.
function basketCost(region, banners, includeUpgrades) {
    let total = 0;
    const perBanner = (banners || []).map(b => {
        const remaining = remainingToFinish(region, b.drawKey, b.pullsDone);
        const priced = remaining !== null;
        const upgrade = priced && includeUpgrades ? upgradeCost(region, b.drawKey) : null;
        const cost = priced ? remaining + (upgrade || 0) : 0;
        if (priced) total += cost;
        return { drawKey: b.drawKey, pullsDone: b.pullsDone, cost, priced, upgrade };
    });
    return { total, perBanner };
}

module.exports = { pullCount, spentSoFar, remainingToFinish, remainingToPull, upgradeCost, reachableWithBudget, basketCost };
