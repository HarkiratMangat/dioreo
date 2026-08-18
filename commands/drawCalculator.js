// ==========================================
// COMMAND: /draw calculator -- panel rendering + execute()
// ==========================================
// Deliberately exports NO `data`. bot/registry.js's loadCommandModules() only registers a module having BOTH `data` and `execute`, and keys the registration by data.name -- a second file exporting setName('draw') would register a DUPLICATE `draw` command and silently overwrite drawprices.js's registration in client.commands. This module stays safely un-registered while remaining requireable from commands/drawprices.js, which owns the `draw` group's builder and dispatches the `calculator` subcommand here. See docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md's "registration constraint" section.
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
const { CP_PACKAGES, normalCp, formatMoney, optimizePurchase } = require('../utils/cpPackages');

const DRAW_KEYS = Object.keys(DRAW_META);

// ==========================================
// STATE CODEC
// ==========================================
// All wizard state rides in the customId -- no model, no cache, no per-user persistence beyond the one deliberate exception (cpCurrency, Task 4). That is a PRIVACY decision as much as an architectural one: storing someone's CP balance and spend progress would need a PRIVACY.md Appendix A entry and would trip the privacy-inventory docs-audit gate. It also makes the region toggle (Task 7) free -- every click just recomputes, which is a few million integer ops, far below the Discord round trip. There is nothing to invalidate.
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
// STAGE A -- SETUP PANEL
// ==========================================
// The draw-type dropdown doubles as the guide (design decision 13): selecting a draw changes what the panel EXPLAINS, not merely what it computes. Numbers are always derived from drawCost.js / DRAW_DATA, never hand-typed here -- see that module's own header comment.
function drawGuideText(region, drawKey) {
    const meta = DRAW_META[drawKey];
    const total = pullCount(region, drawKey);
    const upgrade = upgradeCost(region, drawKey);
    const sentences = [`**${meta.name}** is a **${total}-pull** draw -- "finishing" it means completing all ${total} pulls.`];
    if (upgrade !== null) {
        sentences.push('It also has a separate **Upgrade** step, which you can add to the total below.');
    }
    return sentences.join(' ');
}

// Inputs that don't apply to a draw type are not rendered (design decision 14) -- the upgrade toggle only appears where upgradeCost() finds real data, and the 2X entitlement select only appears when a live event exists or the user has asserted one via `assertDoubleCP`.
function buildSetupPanel(state, accentColor, { liveDoubleCPEntry = null, assertDoubleCP = false } = {}) {
    const total = pullCount(state.region, state.drawKey);
    const upgrade = upgradeCost(state.region, state.drawKey);
    const entitlementsVisible = Boolean(liveDoubleCPEntry) || assertDoubleCP;

    const components = [
        buildTitleBlock('Cost Calculator', emojis.drawPrices, 'Work out what you still need to finish', 2, true),
        { type: 14, spacing: 2, divider: true },
        { type: 10, content: drawGuideText(state.region, state.drawKey) },
        {
            type: 1,
            components: [{
                type: 3, custom_id: encodeState('draw', state), placeholder: 'Choose a draw type...',
                options: DRAW_KEYS.map(key => ({
                    label: DRAW_META[key].name,
                    value: key,
                    description: `${pullCount(state.region, key)} pulls`,
                    default: key === state.drawKey
                }))
            }]
        },
        {
            type: 1,
            components: [{
                type: 3, custom_id: encodeState('target', state), placeholder: 'What are you trying to reach?',
                options: [
                    { label: 'Finish the draw', value: 'F', description: `Complete all ${total} pulls`, default: state.target === 'F' },
                    { label: 'Stop at a specific pull', value: 'P', description: 'Reach a chosen pull number', default: state.target === 'P' },
                    { label: 'Spend a set budget', value: 'B', description: 'See how far a CP or money budget goes', default: state.target === 'B' }
                ]
            }]
        }
    ];

    if (upgrade !== null) {
        components.push({
            type: 1,
            components: [{
                type: 2, style: state.includeUpgrades ? 3 : 2,
                label: state.includeUpgrades ? '✅ Upgrade Included' : 'Include the Upgrade?',
                custom_id: encodeState('upg', state)
            }]
        });
    }

    if (entitlementsVisible) {
        components.push({ type: 10, content: liveDoubleCPEntry
            ? `-# 🎉 A **Double CP** event looks live right now${liveDoubleCPEntry.endDate ? ` (ends <t:${Math.floor(new Date(liveDoubleCPEntry.endDate).getTime() / 1000)}:R>)` : ''}. Select which packages you still have a 2X entitlement on, if any.`
            : `-# Select which packages you still have an unused 2X entitlement on, if the event is running.` });
        components.push({
            type: 1,
            components: [{
                type: 3, custom_id: encodeState('ent', state), placeholder: 'Unused 2X entitlements (optional)...',
                min_values: 0, max_values: CP_PACKAGES.length,
                options: CP_PACKAGES.map((p, i) => ({
                    label: `${p.baseCp.toLocaleString('en-US')} CP package`,
                    value: p.id,
                    default: (state.entitlementMask & (1 << i)) !== 0
                }))
            }]
        });
    }

    components.push({
        type: 1,
        components: [
            { type: 2, style: 2, label: 'Enter Your Numbers', custom_id: encodeState('modal', state) },
            { type: 2, style: 3, label: 'Calculate', custom_id: encodeState('run', state) }
        ]
    });

    return {
        type: 17,
        accent_color: accentColor,
        components
    };
}

// ==========================================
// STAGE B -- RESULTS PANEL
// ==========================================
function formatCP(n) { return n.toLocaleString('en-US'); }

// Same visual convention as drawprices.js's boldDrawSequence/cumulativeSequence (not imported -- those read a full `entry.draws` array; this reads a SLICE starting at pullsDone, which is a different enough shape that reusing them would need the same shim either way).
function cumulativeFrom(draws, fromIndex, startingTotal) {
    let running = startingTotal;
    return draws.slice(fromIndex).map(n => { running += n; return formatCP(running); }).join(' › ');
}

// The savings callout's baseline (design item 8): the smallest single package that covers the shortfall alone -- optimizePurchase's own `naive` result already computes exactly this.
function buildEntitlementList(mask) {
    return CP_PACKAGES.filter((p, i) => (mask & (1 << i)) !== 0).map(p => p.id);
}

function buildResultsPanel(state, accentColor, { currency = 'USD', client } = {}) {
    const meta = DRAW_META[state.drawKey];
    const entry = DRAW_DATA[state.region][state.drawKey];
    const components = [
        buildTitleBlock('Cost Calculator — Results', emojis.drawPrices, meta.name, 2, true),
        { type: 14, spacing: 2, divider: true }
    ];

    // Absent data (design "Degradation" section) -- doubleEpicCharacters at region_20/region_30. Never interpolate: say so plainly and render no purchase recommendation at all.
    if (!entry) {
        components.push({ type: 10, content: `-# We haven't sourced real pricing data for **${meta.name}** at this region yet. Switch regions below, or check back later.` });
        components.push({
            type: 1,
            components: REGION_ORDER.map(key => ({
                type: 2, style: key === state.region ? 1 : 2, disabled: key === state.region,
                custom_id: encodeState('region', { ...state, region: key }),
                label: `${key.split('_')[1]} CP`,
                emoji: emojis.parseEmoji(emojis[REGION_EMOJI_KEY[key]])
            }))
        });
        components.push({ type: 1, components: [{ type: 2, style: 2, label: 'Edit Inputs', custom_id: encodeState('edit', state) }] });
        return { type: 17, accent_color: accentColor, components };
    }

    const total = entry.draws.length;
    const spent = spentSoFar(state.region, state.drawKey, state.pullsDone);
    const upgrade = state.includeUpgrades ? upgradeCost(state.region, state.drawKey) : null;

    let headline, shortfall, pullsRemainingText, remainingCp;
    let budgetResult = null;

    if (state.target === 'B') {
        // Budget mode -- targetValue is a CP amount (see this module's header note: the "budget in real money" half of design decision 10 is not built in this pass; see the PR description).
        budgetResult = reachableWithBudget(state.region, state.drawKey, state.pullsDone, state.targetValue);
        headline = `Spending **${formatCP(state.targetValue)} CP** from pull ${state.pullsDone} gets you to **pull ${budgetResult.pullsReachable}** of ${total}.`;
        remainingCp = 0; // budget mode has no "shortfall to buy" -- it answers a different question
        shortfall = 0;
    } else {
        const targetPull = state.target === 'P' ? Math.min(Math.max(state.targetValue, state.pullsDone), total) : total;
        remainingCp = state.target === 'P' ? remainingToPull(state.region, state.drawKey, state.pullsDone, targetPull) : remainingToFinish(state.region, state.drawKey, state.pullsDone);
        const totalNeeded = remainingCp + (upgrade || 0);
        shortfall = totalNeeded - state.balance;
        pullsRemainingText = `**${targetPull - state.pullsDone}** pull(s) remaining (to pull ${targetPull} of ${total})`;
        // "CP still needed" is the SHORTFALL (netted against balance already held), not the raw totalNeeded -- otherwise this headline contradicts the already-covered branch below it, which reads the same shortfall value.
        headline = `You need **${formatCP(Math.max(shortfall, 0))} CP** more to reach pull ${targetPull}. ${pullsRemainingText}.`;
    }

    components.push({ type: 10, content: headline });
    components.push({ type: 10, content: `-# Spent so far (${state.pullsDone} pull${state.pullsDone === 1 ? '' : 's'}): **${formatCP(spent)} CP**` });

    if (state.target !== 'B' && state.pullsDone < total) {
        const bold = entry.draws.slice(state.pullsDone).map(n => `**${formatCP(n)}**`).join(' / ');
        const cumulative = cumulativeFrom(entry.draws, state.pullsDone, spent);
        components.push({ type: 10, content: `${bold}\n-# **CP Spent:** ${cumulative}` });
    }

    if (upgrade !== null) {
        components.push({ type: 10, content: `-# **Upgrade add-on:** +${formatCP(upgrade)} CP` });
    }

    if (state.target === 'B') {
        components.push({ type: 10, content: budgetResult.cpShortOfNext !== null
            ? `-# You'd be **${formatCP(budgetResult.cpShortOfNext)} CP** short of pull ${budgetResult.pullsReachable + 1}.`
            : `-# That budget finishes the draw outright, with **${formatCP(state.targetValue - budgetResult.cpUsed)} CP** left over.` });
        components.push({ type: 1, components: [{ type: 2, style: 2, label: 'Edit Inputs', custom_id: encodeState('edit', state) }] });
        return { type: 17, accent_color: accentColor, components };
    }

    components.push({ type: 10, content: `-# Balance to shortfall: ${formatCP(remainingCp)}${upgrade ? ` + ${formatCP(upgrade)} upgrade` : ''} − ${formatCP(state.balance)} balance = **${formatCP(Math.max(shortfall, 0))} CP short**` });

    // The already-covered branch (design item 6) -- the best answer a spend-minimizer can give, and the easiest to forget to build. No optimizer output at all when the balance already covers it.
    if (shortfall <= 0) {
        components.push({ type: 10, content: `✅ **You already have enough. Buy nothing.**` });
    } else {
        const doubleCpAvailable = buildEntitlementList(state.entitlementMask);
        const result = optimizePurchase(shortfall, { currency, doubleCpAvailable });
        // Reads the optimizer's OWN cpEach rather than re-deriving with normalCp() (v3-pre-release review, finding #3) -- normalCp() never applies the double-CP bonus, so every 2X combo entry rendered the un-doubled figure.
        const describeCombo = (r) => r.combo.map(c => `${c.count}× ${c.cpEach.toLocaleString('en-US')} CP${c.mode === 'double' ? ' (2X)' : ''} pack`).join(', ');

        components.push({ type: 10, content: `**Cheapest:** ${describeCombo(result.cheapest)} — ${formatMoney(result.cheapest.totalCents, currency)}, ${formatCP(result.cheapest.leftoverCp)} CP leftover (${result.cheapest.transactions} purchase${result.cheapest.transactions === 1 ? '' : 's'})` });
        if (result.leastWaste.totalCents !== result.cheapest.totalCents || result.leastWaste.leftoverCp !== result.cheapest.leftoverCp) {
            components.push({ type: 10, content: `**Least Waste:** ${describeCombo(result.leastWaste)} — ${formatMoney(result.leastWaste.totalCents, currency)}, ${formatCP(result.leastWaste.leftoverCp)} CP leftover (${result.leastWaste.transactions} purchase${result.leastWaste.transactions === 1 ? '' : 's'})` });
        }

        const savings = result.naive.totalCents - result.cheapest.totalCents;
        if (savings > 0) {
            components.push({ type: 10, content: `-# 💰 Saves **${formatMoney(savings, currency)}** versus just buying the ${result.naive.combo[0].cpEach.toLocaleString('en-US')} CP pack on its own.` });
        }
    }

    // Region reality check (design item 9) -- computed live since the region toggle recomputes everything from scratch anyway (see this file's Statelessness note).
    const otherRegions = REGION_ORDER.filter(r => r !== state.region);
    const otherShortfalls = otherRegions.map(r => {
        const e = DRAW_DATA[r][state.drawKey];
        if (!e) return null;
        const rem = state.target === 'P'
            ? remainingToPull(r, state.drawKey, state.pullsDone, Math.min(Math.max(state.targetValue, state.pullsDone), e.draws.length))
            : remainingToFinish(r, state.drawKey, state.pullsDone);
        return `${r.split('_')[1]} CP: ${formatCP(rem)}`;
    }).filter(Boolean);
    if (otherShortfalls.length) {
        components.push({ type: 10, content: `-# Packages cost the same everywhere, but draws don't — the same result at a higher region costs more real money for identical rewards (${otherShortfalls.join(', ')}).` });
    }

    components.push({ type: 10, content: `-# Estimate only — actual store prices vary with local tax and currency conversion.` });

    // Region toggle row (design item, mirrors drawprices.js's own 3-way switcher exactly).
    components.push({
        type: 1,
        components: REGION_ORDER.map(key => ({
            type: 2, style: key === state.region ? 1 : 2, disabled: key === state.region,
            custom_id: encodeState('region', { ...state, region: key }),
            label: `${key.split('_')[1]} CP`,
            emoji: emojis.parseEmoji(emojis[REGION_EMOJI_KEY[key]])
        }))
    });
    components.push({
        type: 1,
        components: [{ type: 2, style: 2, label: 'Edit Inputs', custom_id: encodeState('edit', state) }]
    });
    if (client) {
        components.push({ type: 10, content: `-# See the full breakdown any time with ${mentionCommand(client, '/draw prices')}.` });
    }

    return { type: 17, accent_color: accentColor, components };
}

async function execute(interaction) {
    const userId = interaction.user.id;
    const prefs = await UserPreference.findOne({ discordId: userId });

    let argPrivate = null;
    if (interaction.isChatInputCommand()) {
        const visibilityChoice = interaction.options.getString('visibility');
        argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
    }
    // Reuses the shared "Seasonal Content" toggle (Option A, design-decisions.md) -- the calculator is part of the same /draw family as /draw prices, not a new visibility axis of its own.
    const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });
    if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

    const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
    const state = defaultState();
    if (prefs?.defaultRegionMode && prefs.defaultRegionMode !== 'last_viewed') state.region = prefs.defaultRegionMode;
    else if (prefs?.defaultRegion) state.region = prefs.defaultRegion;

    const liveDoubleCPEntry = await findLiveDoubleCPEntry();
    const containerPayload = buildSetupPanel(state, accentColor, { liveDoubleCPEntry });
    const globalNavigationRow = buildGlobalNavRow('nav_prices');

    return sendV2Payload(interaction, withShareButton([containerPayload, globalNavigationRow], isEphemeral));
}

module.exports = { encodeState, decodeState, defaultState, buildSetupPanel, buildResultsPanel, isDoubleCPEventLive, findLiveDoubleCPEntry, execute };
