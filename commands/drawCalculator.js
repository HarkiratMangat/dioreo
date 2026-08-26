// ==========================================
// COMMAND: /draw calculator -- one live panel
// ==========================================
// Deliberately exports NO `data`. bot/registry.js's loadCommandModules() only registers a module having BOTH `data` and `execute`, and keys the registration by data.name -- a second file exporting setName('draw') would register a DUPLICATE `draw` command and silently overwrite drawprices.js's registration in client.commands. This module stays safely un-registered while remaining requireable from commands/drawprices.js, which owns the `draw` group's builder and dispatches the `calculator` subcommand here. See docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md's "registration constraint" section.
//
// ⚠️ ONE PANEL, NOT TWO STAGES (rebuilt 2026-08-26 11:14 EDT). The original build was a setup FORM you filled in and then pressed "Calculate" on: pick a draw, pick a goal, open a modal, type two numbers, submit, press Calculate -- five interactions before a single figure appeared, and the setup panel showed no numbers at all while you filled it in. Every figure here is a pure function of the state carried in the customId, so recomputing on every click costs a few thousand integer ops against a Discord round trip. The panel therefore ALWAYS shows the answer and every control edits it in place. That also removes the modal from the common path: "pulls done" and "which pull am I aiming for" are small bounded integers, which is a SELECT -- a text field for them was the single most hostile thing about the old flow. Only genuinely free-form amounts (a CP balance, a CP budget) still open a modal.
//
// ⚠️ ABSENT DATA IS A FIRST-CLASS STATE, NOT AN EDGE CASE. DRAW_DATA has real holes -- doubleEpicCharacters exists only at region_10. The old setup panel never checked, so pullCount() returned null and the panel rendered "is a **null-pull** draw", "Complete all null pulls" and "null pulls" in the dropdown, while the modal's `pullsDone > total` check compared against null and rejected EVERY non-zero entry. buildCalculatorPanel() now branches on entryFor() before it reads any count, and the pull/goal selects -- both of which are enumerations OF a pull count -- are simply not rendered when there is no count to enumerate.
const { getAccentColorForCommand } = require('../utils/accentColor');
const { buildTitleBlock } = require('../utils/titleBlock');
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { mentionCommand } = require('../utils/commandMentions');
const emojis = require('../utils/emojiMap');
const UserPreference = require('../models/UserPreference');
const { DRAW_META, DRAW_DATA, REGION_ORDER, REGION_EMOJI_KEY, PRESET_ACCENT } = require('./drawprices');
const { pullCount, upgradeCost, spentSoFar, remainingToFinish, remainingToPull, reachableWithBudget } = require('../utils/drawCost');
const { CP_PACKAGES, formatMoney, optimizePurchase } = require('../utils/cpPackages');

const DRAW_KEYS = Object.keys(DRAW_META);

// The progress bar's two cells. Deliberately geometric block characters rather than emoji: a custom emoji costs a CDN fetch per cell and renders off the text baseline, and ten of them side by side wraps on a phone. These are one character wide in every Discord client.
const BAR_FILLED = '▰';
const BAR_EMPTY = '▱';

function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
function regionLabel(region) { return `${region.split('_')[1]} CP`; }
function plural(n, word) { return `${n} ${word}${n === 1 ? '' : 's'}`; }

// The one place this module asks "does real data exist here". utils/drawCost.js's functions each answer null independently; asking THEM is how the old panel ended up printing the word null.
function entryFor(region, drawKey) { return (DRAW_DATA[region] && DRAW_DATA[region][drawKey]) || null; }
function regionsWithData(drawKey) { return REGION_ORDER.filter(r => entryFor(r, drawKey)); }

function progressBar(done, total) {
    const filled = Math.max(0, Math.min(done, total));
    return BAR_FILLED.repeat(filled) + BAR_EMPTY.repeat(Math.max(0, total - filled));
}

// ==========================================
// STATE CODEC
// ==========================================
// All panel state rides in the customId -- no model, no cache, no per-user persistence beyond the one deliberate exception (cpCurrency). That is a PRIVACY decision as much as an architectural one: storing someone's CP balance and spend progress would need a PRIVACY.md Appendix A entry and would trip the privacy-inventory docs-audit gate. It is also what makes a single always-live panel affordable -- every click just recomputes, and there is nothing to invalidate.
//
// Format: calc~<verb>~r<region digits>~d<draw index>~p<pulls done>~t<target>~v<target value>
//         ~b<balance>~u<0|1 upgrades>~e<2X entitlement bitmask>
// Fields are looked up BY PREFIX rather than by position, so a missing field decodes to its default instead of shifting every field after it. Discord's customId cap is 100 chars; a maximal state here is about 48.
function defaultState() {
    return {
        verb: 'setup',
        region: 'region_10',
        drawKey: DRAW_KEYS[0],
        pullsDone: 0,
        target: 'F',            // F = finish, P = specific pull, B = budget
        targetValue: 0,
        balance: 0,
        includeUpgrades: false,
        entitlementMask: 0
    };
}

function encodeState(verb, s) {
    return [
        'calc', verb,
        `r${s.region.replace('region_', '')}`,
        `d${DRAW_KEYS.indexOf(s.drawKey)}`,
        `p${s.pullsDone}`,
        `t${s.target}`,
        `v${s.targetValue || 0}`,
        `b${s.balance || 0}`,
        `u${s.includeUpgrades ? 1 : 0}`,
        `e${s.entitlementMask || 0}`
    ].join('~');
}

function decodeState(customId) {
    const parts = customId.split('~');
    const get = (prefix, fallback) => {
        const hit = parts.slice(2).find(p => p.startsWith(prefix));
        return hit === undefined ? fallback : hit.slice(prefix.length);
    };
    return {
        verb: parts[1] || 'setup',
        region: `region_${get('r', '10')}`,
        drawKey: DRAW_KEYS[Number(get('d', 0))] || DRAW_KEYS[0],
        pullsDone: Number(get('p', 0)),
        target: get('t', 'F'),
        targetValue: Number(get('v', 0)),
        balance: Number(get('b', 0)),
        includeUpgrades: get('u', '0') === '1',
        entitlementMask: Number(get('e', 0))
    };
}

// Every control that can change WHICH draw or region is in play runs its result through here, because both of those change the valid range of everything else. Switching from a 10-pull draw to a 7-pull one while sitting on "8 pulls done, stop at pull 9" must not leave two impossible values in the state -- they would render an out-of-range ladder and a negative remainder. Clamping here rather than at each read site is what keeps the render functions free of range guards.
function clampStateToDraw(state) {
    const total = pullCount(state.region, state.drawKey);
    if (total === null) return { ...state, pullsDone: 0 };
    const pullsDone = Math.max(0, Math.min(state.pullsDone, total));
    let { target, targetValue } = state;
    if (target === 'P' && (targetValue < 1 || targetValue > total)) { target = 'F'; targetValue = 0; }
    return { ...state, pullsDone, target, targetValue };
}

// ==========================================
// CALENDAR DETECTION -- is a 2X CP event live right now?
// ==========================================
// Reuses the LOGIC commands/calendar.js's isEventEnded() already established for its active-filter mode (ongoing checks bpEnd/bpEndTBD, a dated entry checks its own endDate) rather than a third independent date comparison -- that function is private to calendar.js, so this mirrors its convention instead of importing it, per the design's "reuse the liveness logic" instruction. An entry is live when it is ongoing (and the season hasn't ended), or now falls within date..endDate.
function isDoubleCPEventLive(entry, seasonalDoc, nowMs) {
    if (!entry || !entry.isDoubleCP) return false;
    if (entry.isOngoing) {
        if (seasonalDoc.bpEndTBD) return true;
        return !seasonalDoc.bpEnd || new Date(seasonalDoc.bpEnd).getTime() > nowMs;
    }
    return new Date(entry.date).getTime() <= nowMs && new Date(entry.endDate).getTime() > nowMs;
}

async function findLiveDoubleCPEntry() {
    const SeasonalData = require('../models/SeasonalData');
    const seasonalDoc = await SeasonalData.findOne({ docType: 'global' }).lean();
    if (!seasonalDoc) return null;
    const nowMs = Date.now();
    return (seasonalDoc.calendar || []).find(e => isDoubleCPEventLive(e, seasonalDoc, nowMs)) || null;
}

// ==========================================
// CONTROLS
// ==========================================
// Every option carries its own PRICE. A dropdown whose options read "Stop at pull 7" tells you nothing you did not already know; one whose options read "Stop at pull 7 -- 6,800 CP from here" turns the control itself into the comparison the old two-stage flow made you visit a separate panel for. The figures are the same drawCost.js calls the panel body makes, so they cannot disagree with the answer above them.
function drawSelectRow(state) {
    return {
        type: 1,
        components: [{
            type: 3, custom_id: encodeState('draw', state), placeholder: 'Which draw are you pulling on?',
            options: DRAW_KEYS.map(key => {
                const total = pullCount(state.region, key);
                return {
                    label: DRAW_META[key].name,
                    value: key,
                    // A draw with no data at THIS region says so in its own description rather than silently offering itself as if it were priced -- selecting it is still allowed, and lands on the no-data panel with its region buttons.
                    description: total === null ? `No data at ${regionLabel(state.region)} yet` : `${plural(total, 'pull')} · ${fmt(remainingToFinish(state.region, key, 0))} CP in full`,
                    emoji: emojis.parseEmoji(emojis[DRAW_META[key].tier]),
                    default: key === state.drawKey
                };
            })
        }]
    };
}

function pullsSelectRow(state, total) {
    const options = [];
    for (let n = 0; n <= total && options.length < 25; n++) {
        options.push({
            label: n === 0 ? 'I have not started this draw' : `${plural(n, 'pull')} done`,
            value: String(n),
            description: n === 0 ? 'Price the draw from scratch' : `${fmt(spentSoFar(state.region, state.drawKey, n))} CP spent so far`,
            default: n === state.pullsDone
        });
    }
    return { type: 1, components: [{ type: 3, custom_id: encodeState('pulls', state), placeholder: 'How many pulls have you done?', options }] };
}

// The goal select folds the old "target type" dropdown and its modal-entered target VALUE into one control. "Stop at a specific pull" used to be a mode you chose and then typed a number for in a modal; a pull number is bounded by the draw's own length, so every reachable value is simply an option -- and each one is priced from where the player currently is.
function goalSelectRow(state, total) {
    const options = [{
        label: 'Finish the draw',
        value: 'F',
        description: `All ${total} pulls · ${fmt(remainingToFinish(state.region, state.drawKey, state.pullsDone))} CP from here`,
        default: state.target === 'F'
    }];
    for (let p = 1; p <= total; p++) {
        const need = remainingToPull(state.region, state.drawKey, state.pullsDone, p);
        options.push({
            label: `Stop at pull ${p}`,
            value: `P${p}`,
            description: p <= state.pullsDone ? 'Already reached' : `${fmt(need)} CP from here`,
            default: state.target === 'P' && state.targetValue === p
        });
    }
    options.push({ label: 'Spend a set budget', value: 'B', description: 'See how far an amount of CP goes', default: state.target === 'B' });
    return { type: 1, components: [{ type: 3, custom_id: encodeState('goal', state), placeholder: 'What are you aiming for?', options }] };
}

function entitlementSelectRow(state) {
    return {
        type: 1,
        components: [{
            type: 3, custom_id: encodeState('ent', state), placeholder: 'Unused 2X entitlements (optional)...',
            min_values: 0, max_values: CP_PACKAGES.length,
            options: CP_PACKAGES.map((p, i) => ({
                label: `${fmt(p.baseCp)} CP package`,
                value: p.id,
                description: `Gives ${fmt(p.baseCp * 2)} CP during a 2X event`,
                default: (state.entitlementMask & (1 << i)) !== 0
            }))
        }]
    };
}

// One row carries every remaining control, and it is capped at Discord's five buttons per row by construction: three regions, then the upgrade toggle only where real upgrade data exists, then the amount button. Splitting these across two rows was tried and reads worse -- the region switch and the upgrade toggle are the same KIND of thing (adjust what is being priced), and separating them implied a hierarchy that is not there.
function controlsRow(state, { hasUpgrade, hasData }) {
    const buttons = REGION_ORDER.map(key => ({
        type: 2,
        style: key === state.region ? 1 : 2,
        disabled: key === state.region,
        custom_id: encodeState('region', { ...state, region: key }),
        label: regionLabel(key),
        emoji: emojis.parseEmoji(emojis[REGION_EMOJI_KEY[key]])
    }));
    if (hasUpgrade) {
        buttons.push({
            type: 2,
            style: state.includeUpgrades ? 3 : 2,
            label: state.includeUpgrades ? 'Upgrade: On' : 'Upgrade: Off',
            custom_id: encodeState('upg', state)
        });
    }
    if (hasData) {
        buttons.push({
            type: 2, style: 2,
            label: state.target === 'B' ? 'Set Budget' : 'Set Balance',
            custom_id: encodeState('modal', state)
        });
    }
    return { type: 1, components: buttons };
}

// The return trip (2026-08-26 12:16 EDT, Harkirat: "a matching pair" -- its own row, not folded into controlsRow, which is already full at up to 5 buttons). Points at the EXACT custom_id drawprices.js's own region-switch buttons produce, so this routes through handlers/drawprices.js's existing price_region_ branch with no new handler code on either side.
function pricesRow(state) {
    return {
        type: 1,
        components: [{
            type: 2, style: 2, label: 'Draw Prices',
            emoji: emojis.parseEmoji(emojis.drawPrices),
            custom_id: `price_region_${state.region.replace('region_', '')}_0`
        }]
    };
}

// ==========================================
// PANEL
// ==========================================
function buildCalculatorPanel(state, accentColor, options = {}) {
    const { liveDoubleCPEntry = null, assertDoubleCP = false, currency = 'USD', client = null, notice = null } = options;
    const meta = DRAW_META[state.drawKey];
    const entry = entryFor(state.region, state.drawKey);
    const components = [
        buildTitleBlock('Cost Calculator', emojis.drawPrices, meta.name, 2, true),
        { type: 14, spacing: 2, divider: true }
    ];

    // ---- No data for this draw at this region ---- Never interpolate a missing price (Harkirat's standing call, see DRAW_DATA's own header). Say plainly which regions DO have it, and leave the region row as the way out -- the pull and goal selects are enumerations of a pull count that does not exist here, so they are absent rather than empty.
    if (!entry) {
        const available = regionsWithData(state.drawKey);
        components.push({ type: 10, content: [
            `⚠️ **No sourced pricing for this draw at the ${regionLabel(state.region)} region.**`,
            available.length
                ? `-# Real figures exist at **${available.map(regionLabel).join('** and **')}** — switch below and the numbers come back.`
                : `-# We have not sourced this draw at any region yet.`
        ].join('\n') });
        components.push(drawSelectRow(state));
        components.push(controlsRow(state, { hasUpgrade: false, hasData: false }));
        components.push(pricesRow(state));
        return { type: 17, accent_color: accentColor, components };
    }

    const total = entry.draws.length;
    const spent = spentSoFar(state.region, state.drawKey, state.pullsDone);
    const upgradeAvailable = upgradeCost(state.region, state.drawKey);
    const upgrade = state.includeUpgrades && upgradeAvailable !== null ? upgradeAvailable : null;

    // ---- Where you are ----
    const statusLines = [
        `\`${regionLabel(state.region)}\`  ${progressBar(state.pullsDone, total)}  **${state.pullsDone} / ${total} pulls**`,
        `-# ${state.pullsDone ? `Spent so far **${fmt(spent)} CP**` : 'Not started yet'}${state.balance ? ` · Balance **${fmt(state.balance)} CP**` : ' · No balance entered'}`
    ];
    if (notice) statusLines.push(`-# ${notice}`);
    components.push({ type: 10, content: statusLines.join('\n') });
    components.push({ type: 14, spacing: 2, divider: true });

    // ---- The answer ----
    components.push({ type: 10, content: (state.target === 'B'
        ? budgetAnswer(state, entry, total)
        : goalAnswer(state, entry, total, upgrade)).join('\n') });

    // ---- How to buy it ----
    const shortfall = state.target === 'B' ? 0 : shortfallFor(state, total, upgrade);
    if (shortfall > 0) {
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({ type: 10, content: purchaseAdvice(shortfall, state, currency).join('\n') });
    }

    // ---- Fine print ----
    components.push({ type: 10, content: finePrint(state, currency, client, { upgradeIncluded: upgrade !== null }).join('\n') });

    // ---- Controls ----
    components.push(drawSelectRow(state));
    components.push(pullsSelectRow(state, total));
    components.push(goalSelectRow(state, total));
    if (liveDoubleCPEntry || assertDoubleCP || state.entitlementMask) {
        components.push({ type: 10, content: liveDoubleCPEntry
            ? `-# 🎉 A **Double CP** event looks live right now${liveDoubleCPEntry.endDate ? ` (ends <t:${Math.floor(new Date(liveDoubleCPEntry.endDate).getTime() / 1000)}:R>)` : ''}. Tell the optimizer which packages you still have a 2X entitlement on.`
            : `-# Select which packages you still have an unused 2X entitlement on, if the event is running.` });
        components.push(entitlementSelectRow(state));
    }
    components.push(controlsRow(state, { hasUpgrade: upgradeAvailable !== null, hasData: true }));
    components.push(pricesRow(state));

    return { type: 17, accent_color: accentColor, components };
}

// The number the whole panel turns on: what is left to buy AFTER the balance already in hand. The old build printed this three times in three framings -- as a headline, as an equation, and again inside the already-covered branch -- and the headline read the raw total while the branch read the netted one, so the two contradicted each other whenever a balance was entered. One function, one meaning.
function shortfallFor(state, total, upgrade) {
    const targetPull = state.target === 'P' ? Math.min(Math.max(state.targetValue, state.pullsDone), total) : total;
    const remainingCp = state.target === 'P'
        ? remainingToPull(state.region, state.drawKey, state.pullsDone, targetPull)
        : remainingToFinish(state.region, state.drawKey, state.pullsDone);
    return remainingCp + (upgrade || 0) - state.balance;
}

function goalAnswer(state, entry, total, upgrade) {
    const targetPull = state.target === 'P' ? Math.min(Math.max(state.targetValue, state.pullsDone), total) : total;
    const remainingCp = state.target === 'P'
        ? remainingToPull(state.region, state.drawKey, state.pullsDone, targetPull)
        : remainingToFinish(state.region, state.drawKey, state.pullsDone);
    const needed = remainingCp + (upgrade || 0);
    const shortfall = needed - state.balance;
    const pullsLeft = targetPull - state.pullsDone;
    const upgradeAvailable = upgradeCost(state.region, state.drawKey);
    const lines = [];

    if (pullsLeft <= 0 && !upgrade) {
        lines.push(`### ✅ You are already there`);
        lines.push(`You have completed **pull ${targetPull} of ${total}**. Aim further with the goal picker below.`);
        return lines;
    }
    if (shortfall <= 0) {
        lines.push(`### ✅ You already have enough — buy nothing`);
        lines.push(`**${fmt(needed)} CP** covers ${pullsLeft > 0 ? plural(pullsLeft, 'more pull') : 'the upgrade'}, and you hold **${fmt(state.balance)} CP**.`);
        lines.push(`-# That leaves **${fmt(-shortfall)} CP** spare afterwards.`);
    } else {
        lines.push(`### ${emojis.cp2} **${fmt(shortfall)} CP** still needed`);
        // Finishing and stopping short are different sentences. One "takes you to pull 10 of 10" template covered both and read as a tautology on the commonest goal there is.
        lines.push(state.target === 'P'
            ? `Stops you at **pull ${targetPull} of ${total}** — ${plural(pullsLeft, 'pull')} away.`
            : `Finishes all **${total} pulls**${state.pullsDone ? ` — ${pullsLeft} to go` : ''}.`);
        if (state.balance) lines.push(`-# ${fmt(needed)} CP to go − ${fmt(state.balance)} CP balance = **${fmt(shortfall)} CP** to buy.`);
    }

    // The ladder stops at the TARGET, not at the end of the draw. The old build always sliced to entry.draws.length, so choosing "stop at pull 5" printed all ten pulls underneath a headline that priced five -- the two disagreed on screen. Bold ladder only -- a THIRD framing of the same numbers as a running-cumulative "CP Spent" line used to sit under this too. The headline already gives the aggregate; this gives the per-pull detail. Cut 2026-08-26 12:23 EDT, prose-density pass.
    const ladder = entry.draws.slice(state.pullsDone, targetPull);
    if (ladder.length) lines.push(`${ladder.map(n => `**${fmt(n)}**`).join(' / ')}`);
    // The controls row's "Upgrade: Off" button already says a step exists; this line's only job is the number the button can't show.
    if (upgradeAvailable !== null) {
        lines.push(upgrade !== null ? `-# +${fmt(upgrade)} CP upgrade included.` : `-# +${fmt(upgradeAvailable)} CP if you include the Upgrade below.`);
    }
    return lines;
}

function budgetAnswer(state, entry, total) {
    const lines = [];
    if (!state.targetValue) {
        lines.push(`### ${emojis.cp2} How far does a budget go?`);
        lines.push(`Press **Set Budget** below and enter the CP you are willing to spend.`);
        return lines;
    }
    const result = reachableWithBudget(state.region, state.drawKey, state.pullsDone, state.targetValue);
    const gained = result.pullsReachable - state.pullsDone;
    lines.push(`### ${emojis.cp2} **${fmt(state.targetValue)} CP** reaches **pull ${result.pullsReachable}** of ${total}`);
    lines.push(gained > 0
        ? `That is **${plural(gained, 'more pull')}** from where you are now.`
        : `That is not enough for even one more pull from pull ${state.pullsDone}.`);
    lines.push(result.cpShortOfNext !== null
        ? `-# **${fmt(result.cpShortOfNext)} CP** short of pull ${result.pullsReachable + 1} · ${fmt(state.targetValue - result.cpUsed)} CP would go unspent.`
        : `-# That finishes the draw outright, with **${fmt(state.targetValue - result.cpUsed)} CP** left over.`);
    // Bold marks the pulls the budget actually covers, so the ladder answers "which ones do I get" rather than repeating the headline in list form.
    const ladder = entry.draws.slice(state.pullsDone);
    if (ladder.length) {
        lines.push(`-# **Pulls from here:** ${ladder.map((n, i) => (state.pullsDone + i < result.pullsReachable ? `**${fmt(n)}**` : fmt(n))).join(' / ')}`);
    }
    return lines;
}

// Six lines compressed to three (2026-08-26 12:23 EDT, Harkirat: "this is overwhelming"): combo, purchase-count and leftover used to each get their own line per tier. Same numbers, one line per tier.
function purchaseAdvice(shortfall, state, currency) {
    const doubleCpAvailable = CP_PACKAGES.filter((p, i) => (state.entitlementMask & (1 << i)) !== 0).map(p => p.id);
    const result = optimizePurchase(shortfall, { currency, doubleCpAvailable });
    // Reads the optimizer's OWN cpEach rather than re-deriving with normalCp() (v3-pre-release review, finding #3) -- normalCp() never applies the double-CP bonus, so every 2X combo entry rendered the un-doubled figure.
    const describe = r => r.combo.map(c => `${c.count}× ${fmt(c.cpEach)} CP${c.mode === 'double' ? ' (2X)' : ''}`).join(' + ');
    const tierLine = (label, r) => `${label} — **${formatMoney(r.totalCents, currency)}** · ${describe(r)} (${plural(r.transactions, 'purchase')}, ${fmt(r.leftoverCp)} CP left over)`;
    const lines = [`### 🛒 ${tierLine('Cheapest', result.cheapest)}`];
    const savings = result.naive.totalCents - result.cheapest.totalCents;
    if (savings > 0) lines.push(`-# 💰 Saves **${formatMoney(savings, currency)}** vs. one ${fmt(result.naive.combo[0].cpEach)} CP pack alone.`);
    if (result.leastWaste.totalCents !== result.cheapest.totalCents || result.leastWaste.leftoverCp !== result.cheapest.leftoverCp) {
        lines.push(tierLine('Least waste', result.leastWaste));
    }
    return lines;
}

function finePrint(state, currency, client, { upgradeIncluded = false } = {}) {
    const lines = [];
    // Region reality check -- computed live, since every control recomputes the whole panel from scratch anyway (see the Statelessness note above).
    //
    // ⚠️ EVERY FIGURE ON THIS ROW MUST BE THE SAME KIND OF FIGURE, and the first version was not. It listed only the OTHER regions, and compared them against a headline that had the upgrade folded in -- so with the upgrade toggled on, a 6,070 CP local total sat beside "20 CP 640 CP" and the sentence claiming higher regions cost MORE was refuted by its own numbers. Two fixes: the current region is in the row (a comparison needs its own baseline present, not implied by the panel above it), and the upgrade is excluded from all three, which is the only basis available -- mythicWeapon has no upgrade figure at region_20 at all, so including it would have compared a total against a subtotal.
    if (state.target !== 'B') {
        const row = REGION_ORDER.map(r => {
            const e = entryFor(r, state.drawKey);
            if (!e) return null;
            const need = state.target === 'P'
                ? remainingToPull(r, state.drawKey, state.pullsDone, Math.min(Math.max(state.targetValue, state.pullsDone), e.draws.length))
                : remainingToFinish(r, state.drawKey, state.pullsDone);
            // The unit lives in the label, once. Region names are themselves CP figures ("10 CP"), so repeating CP after each number produced "10 CP 5,810 CP · 20 CP 10,075 CP" -- four CPs in a row where two of them mean different things.
            return r === state.region ? `${regionLabel(r)} region **${fmt(need)}**` : `${regionLabel(r)} ${fmt(need)}`;
        }).filter(Boolean);
        // Shortened 2026-08-26 12:23 EDT: this used to spell out "identical rewards, so a higher region is simply more real money" in full every render. The /draw prices pointer is cut outright -- pricesRow (below) is now a real button, not a name in prose.
        if (row.length > 1) lines.push(`-# ${row.join(' · ')} CP${upgradeIncluded ? ' *(upgrade excluded)*' : ''} — same reward, higher region costs more.`);
    }
    const settingsMention = client ? mentionCommand(client, '/settings') : '`/settings`';
    lines.push(`-# Estimate only, ${currency} — varies with tax/conversion. Change currency in ${settingsMention}.`);
    return lines;
}

// ==========================================
// SLASH ENTRY
// ==========================================
// The options exist so the panel is not the ONLY way in. Someone who already knows their situation types it once -- `/draw calculator draw:… pulls:3 balance:3000` -- and the first thing they see is the answer, with the controls underneath for adjusting it. Every option is optional, so the bare command still opens on a sensible default.
async function execute(interaction) {
    const userId = interaction.user.id;
    const prefs = await UserPreference.findOne({ discordId: userId });

    let argPrivate = null;
    let notice = null;
    const state = defaultState();

    if (prefs?.defaultRegionMode && prefs.defaultRegionMode !== 'last_viewed') state.region = prefs.defaultRegionMode;
    else if (prefs?.defaultRegion) state.region = prefs.defaultRegion;

    if (interaction.isChatInputCommand()) {
        const visibilityChoice = interaction.options.getString('visibility');
        argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';

        const regionOption = interaction.options.getString('region');
        if (regionOption && REGION_ORDER.includes(regionOption)) state.region = regionOption;

        const drawOption = interaction.options.getString('draw');
        if (drawOption && DRAW_META[drawOption]) state.drawKey = drawOption;

        const balanceOption = interaction.options.getInteger('balance');
        if (balanceOption !== null && balanceOption >= 0) state.balance = balanceOption;

        const pullsOption = interaction.options.getInteger('pulls');
        if (pullsOption !== null && pullsOption >= 0) {
            const total = pullCount(state.region, state.drawKey);
            // Clamping silently is the anti-pattern the old modal validation existed to avoid -- so it clamps AND says so, in the panel itself, where the corrected figure sits right beside the note.
            if (total !== null && pullsOption > total) {
                state.pullsDone = total;
                notice = `You asked for ${pullsOption} pulls, but **${DRAW_META[state.drawKey].name}** only has ${total} — showing ${total}.`;
            } else {
                state.pullsDone = pullsOption;
            }
        }
    }

    // Reuses the shared "Seasonal Content" toggle (Option A, design-decisions.md) -- the calculator is part of the same /draw family as /draw prices, not a new visibility axis of its own.
    const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });
    if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

    const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
    const liveDoubleCPEntry = await findLiveDoubleCPEntry();
    const containerPayload = buildCalculatorPanel(clampStateToDraw(state), accentColor, {
        liveDoubleCPEntry,
        currency: prefs?.cpCurrency || 'USD',
        client: interaction.client,
        notice
    });
    const globalNavigationRow = buildGlobalNavRow('nav_prices');

    return sendV2Payload(interaction, withShareButton([containerPayload, globalNavigationRow], isEphemeral));
}

module.exports = {
    encodeState, decodeState, defaultState, clampStateToDraw,
    buildCalculatorPanel, entryFor, regionsWithData, progressBar, shortfallFor,
    isDoubleCPEventLive, findLiveDoubleCPEntry, execute
};
