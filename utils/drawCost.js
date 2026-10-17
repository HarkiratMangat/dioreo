// ==========================================
// DRAW REMAINDER MATH
// ==========================================
// "I have done N pulls -- what is left?" Every figure here is a slice or a sum of DRAW_DATA's existing per-pull arrays; nothing is stored and nothing is hand-typed, which is the same rule DRAW_DATA's own header comment sets out. Deliberately knows NOTHING about money -- utils/ cpPackages.js handles that half. Design: docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md.
//
// ⚠️ PULL COUNTS ARE NOT UNIFORMLY TEN. sevenSpinLegendaryWeapon and pickYourRewardCard have SEVEN pulls. Every bound below derives from draws.length for that reason; a hardcoded 10 would pass testing on the seven common draws and silently overcount on the other two.
//
// ⚠️ ABSENT DATA RETURNS null, NEVER AN ESTIMATE. doubleEpicCharacters has no data at region_20 or region_30, and the two mythic draws have no upgrade figure at region_20. Both gaps are deliberate -- Harkirat refused to ship a speculative estimate as real pricing -- so callers render the existing "haven't done the research yet" placeholder rather than computing around them.
const { DRAW_DATA, MYTHIC_UPGRADE, upgradeFullAmount } = require('../commands/drawprices');

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

// ==========================================
// MYTHIC UPGRADES BY TIER (2026-10-17 13:12 EDT, Harkirat's build go)
// ==========================================
// A line's upgrade is a HAVE and a WANT, each an array: weapon `[level]` (0-5); character `[battle, arm, color, finalForm]` (tiers 0-3, then 0/1). Stored on the line as `upHave`/`upWant` (models/DrawBasket.js). HAVE only counts on a line whose draw is finished: upgrades unlock only after the last spin, so any earlier line has nothing upgraded yet. A line with no stored WANT has no upgrade; `includeUpgrades` is no longer read (see upgradeState).
function upgradeShape(key) {
    const u = MYTHIC_UPGRADE[key];
    if (!u) return null;
    return u.levels ? [u.levels.length] : [...u.paths.map(() => u.tiers.length), 1];
}
function cleanUpgradeArray(arr, max) {
    if (!Array.isArray(arr) || arr.length !== max.length) return null;
    const out = arr.map((v, i) => Math.max(0, Math.min(max[i], Math.floor(Number(v) || 0))));
    return out;
}
function upgradeState(banner, { complete, includeUpgrades }) {
    const max = upgradeShape(banner.drawKey);
    if (!max) return null;
    const zero = max.map(() => 0);
    const have = (complete && cleanUpgradeArray(banner.upHave, max)) || zero;
    const stored = cleanUpgradeArray(banner.upWant, max);
    // No stored target means no upgrade (2026-10-17 19:15 EDT). Lines used to fall back to the old basket-wide Upgrade: YES toggle, so a calculation copied from one with the toggle on showed every newly added Mythic draw at Max (Harkirat: "confused why it's assuming max upgrade for #4 and #5?"). The toggle left the UI with the tier pop-ups, and the calculator has never shipped, so no player's saved price changes.
    const want = (stored || zero).map((w, i) => Math.max(w, have[i]));
    return { have, want, explicit: Boolean(stored) };
}
function sumTiers(tiers, from, to) { let n = 0; for (let t = from; t < to; t++) n += tiers[t]; return n; }
// What a line still has to collect, in its own currency. Final Form only counts when the wanted tiers reach its minimum; finalFormBlocked says it was asked for and could not be.
function upgradeNeed(key, have, want) {
    const u = MYTHIC_UPGRADE[key];
    if (!u) return { need: 0, finalFormBlocked: false };
    if (u.levels) {
        const at = [0, ...u.levels];
        return { need: want[0] > have[0] ? at[want[0]] - at[have[0]] : 0, finalFormBlocked: false };
    }
    let need = 0;
    for (let p = 0; p < u.paths.length; p++) need += sumTiers(u.tiers, have[p], want[p]);
    const tiersWanted = want.slice(0, u.paths.length).reduce((a, b) => a + b, 0);
    const ffWanted = want[u.paths.length] === 1 && have[u.paths.length] !== 1;
    const ffAllowed = tiersWanted >= u.finalForm.minTiers;
    if (ffWanted && ffAllowed) need += u.finalForm.cost;
    return { need, finalFormBlocked: ffWanted && !ffAllowed };
}
// The character presets (Harkirat 2026-10-17 12:12 EDT: "full path, cheapest to final form, everything"), always from what the player already has. Brute force over every wanted tier set at or above HAVE: at most 4^3 = 64 cases, so it is exact rather than a greedy guess.
function characterPreset(have, preset) {
    const u = MYTHIC_UPGRADE.mythicCharacter;
    const P = u.paths.length, T = u.tiers.length;
    const ff = have[P] === 1 ? 1 : 0;
    if (preset === 'none') return [...have.slice(0, P), ff];
    if (preset === 'all') return [...u.paths.map(() => T), 1];
    if (preset === 'path') {
        if (have.slice(0, P).some(t => t === T)) return [...have.slice(0, P), ff];
        let best = 0;
        for (let p = 1; p < P; p++) if (have[p] > have[best]) best = p;
        return [...have.slice(0, P).map((t, p) => (p === best ? T : t)), ff];
    }
    if (preset === 'ff') {
        let best = null;
        const walk = (p, acc) => {
            if (p === P) {
                if (acc.reduce((a, b) => a + b, 0) < u.finalForm.minTiers) return;
                const cost = acc.reduce((n, t, i) => n + sumTiers(u.tiers, have[i], t), 0);
                if (!best || cost < best.cost) best = { cost, tiers: [...acc] };
                return;
            }
            // Highest tier first, and only a strictly cheaper set replaces the best, so a tie finishes the earlier path: Battle Tech complete, the other two at Tier 2.
            for (let t = T; t >= have[p]; t--) walk(p + 1, [...acc, t]);
        };
        walk(0, []);
        return [...best.tiers, 1];
    }
    return null;
}
// THE SHARED POOL (Harkirat 2026-10-17 12:12 EDT: Mythic Cards and Coins are "shared"). Every line's need is added up per currency BEFORE converting to spins, because what one spin over-collects carries to the next weapon: two weapons needing 400 cards each are ceil(800 / 197.5) = 5 spins, never 3 + 3. The held balance comes off the pooled need. Spins use integer arithmetic (need × count ÷ full, rounded up) so 2,820 coins is exactly 14 spins, never 15 from a float.
function upgradePlan(basket) {
    const region = basket.region;
    const lines = [];
    (basket.banners || []).forEach((b, index) => {
        if (!MYTHIC_UPGRADE[b.drawKey]) return;
        const total = pullCount(region, b.drawKey);
        const st = upgradeState(b, { complete: total !== null && b.pullsDone >= total, includeUpgrades: basket.includeUpgrades });
        lines.push({ index, drawKey: b.drawKey, ...st, ...upgradeNeed(b.drawKey, st.have, st.want) });
    });
    const pools = Object.keys(MYTHIC_UPGRADE).filter(key => lines.some(l => l.drawKey === key)).map(key => {
        const u = MYTHIC_UPGRADE[key];
        const need = lines.filter(l => l.drawKey === key).reduce((n, l) => n + l.need, 0);
        const held = Math.max(0, Math.floor(Number(basket[u.heldField]) || 0));
        const short = Math.max(0, need - held);
        const entry = entryFor(region, key);
        const full = upgradeFullAmount(key);
        const count = entry && entry.upgrade ? entry.upgrade.count : null;
        const spins = count ? Math.floor((short * count + full - 1) / full) : null;
        const perDraw = entry && entry.upgrade ? entry.upgrade.perDraw : null;
        return { drawKey: key, currency: u.currency, need, held, short, spins, perDraw, cp: spins !== null && perDraw !== null ? spins * perDraw : null, perSpin: count ? full / count : null };
    });
    const cp = pools.reduce((n, p) => n + (p.cp || 0), 0);
    return { lines, pools, cp, missing: pools.filter(p => p.short > 0 && p.cp === null) };
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
// Upgrades are no longer a per-line CP figure (2026-10-17 13:17 EDT): they are pooled per currency (upgradePlan), so `cost` is the draw alone, each line's `upgrade` is its tier state and need in cards or coins, and the pooled upgrade CP joins `total` once. `held` carries the basket's mythicCards/mythicCoins.
function basketCost(region, banners, includeUpgrades, held = {}) {
    let drawTotal = 0;
    const upgrades = upgradePlan({ region, banners, includeUpgrades, ...held });
    const perBanner = (banners || []).map((b, i) => {
        const remaining = remainingToFinish(region, b.drawKey, b.pullsDone);
        const priced = remaining !== null;
        const cost = priced ? remaining : 0;
        if (priced) drawTotal += cost;
        return { drawKey: b.drawKey, pullsDone: b.pullsDone, cost, priced, upgrade: upgrades.lines.find(l => l.index === i) || null };
    });
    return { total: drawTotal + upgrades.cp, drawTotal, perBanner, upgrades };
}

module.exports = { pullCount, spentSoFar, remainingToFinish, remainingToPull, upgradeCost, reachableWithBudget, basketCost, upgradePlan, upgradeState, upgradeNeed, upgradeShape, characterPreset };
