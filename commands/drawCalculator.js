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
        drawKey: null,          // landing state (2026-08-26 13:29 EDT) -- no draw picked yet, no number computed
        pullsDone: 0,
        target: 'F',            // F = finish, P = specific pull, B = budget
        targetValue: 0,
        balance: 0,
        includeUpgrades: false,
        entitlementMask: 0,
        detail: false            // progressive disclosure (2026-08-26 13:19 EDT) -- collapsed by default
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
        `e${s.entitlementMask || 0}`,
        `x${s.detail ? 1 : 0}`
    ].join('~');
}

function decodeState(customId) {
    const parts = customId.split('~');
    const get = (prefix, fallback) => {
        const hit = parts.slice(2).find(p => p.startsWith(prefix));
        return hit === undefined ? fallback : hit.slice(prefix.length);
    };
    // d-1 (or a missing d field) decodes to null -- landing. Distinguishing "index 0 chosen" from "nothing chosen" is the whole point; DRAW_KEYS[-1] || DRAW_KEYS[0] would have silently resurrected drawKey to the first draw on every round trip through a customId that never carried one.
    const drawIndex = Number(get('d', '-1'));
    return {
        verb: parts[1] || 'setup',
        region: `region_${get('r', '10')}`,
        drawKey: drawIndex >= 0 ? (DRAW_KEYS[drawIndex] || null) : null,
        pullsDone: Number(get('p', 0)),
        target: get('t', 'F'),
        targetValue: Number(get('v', 0)),
        balance: Number(get('b', 0)),
        includeUpgrades: get('u', '0') === '1',
        entitlementMask: Number(get('e', 0)),
        detail: get('x', '0') === '1'
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

// One row carries every remaining control, and it is capped at Discord's five buttons per row by construction: three regions, then the upgrade toggle only where real upgrade data exists, then the amount button. Splitting these across two rows was tried and reads worse -- the region switch and the upgrade toggle are the same KIND of thing (adjust what is being priced), and separating them implied a hierarchy that is not there. THIRD PASS, 2026-08-26 12:50 EDT (Harkirat: "understand and contextualize the info at first glance, rather than being forced to read the entire thing to understand the structure"). The first two passes edited WORDING inside a fixed architecture -- every fact was a Text Display, all the same visual register, so nothing signalled what KIND of block a line belonged to without reading it. This pass adds real STRUCTURE: the balance/budget entry action moves off this row entirely, onto a Section accessory attached to the exact stat it acts on (see buildCalculatorPanel) -- co-locating the fact with the control that edits it, rather than making the reader carry the number nine lines down to a generic button row. Section+accessory is an established pattern in THIS codebase (commands/bot.js pairs a change summary with a Details button; commands/draws.js pairs an entry with a thumbnail) -- reused here, not invented.
function controlsRow(state, { hasUpgrade }) {
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

    // ---- Landing: no draw picked yet (2026-08-26 13:29 EDT) ---- Every user used to land on Mythic Weapon Draw, 0 pulls, finish -- a real computed answer to a question nobody had asked yet. Harkirat's pick from the AskUserQuestion fork. Nothing is computed here; the draw select is the only thing that matters, and with no option carrying default:true its PLACEHOLDER actually renders (verified: Discord only shows a select's placeholder when no option is marked default -- every other state in this file marks one, which is why the placeholder text elsewhere never appears).
    if (!state.drawKey) {
        return {
            type: 17, accent_color: accentColor,
            components: [
                buildTitleBlock('Cost Calculator', emojis.drawPrices, 'Work out what you need to finish a draw', 2, true),
                { type: 14, spacing: 2, divider: true },
                { type: 10, content: '🎯 Pick a draw below to see what you still need, and the cheapest way to buy it.' },
                drawSelectRow(state),
                controlsRow(state, { hasUpgrade: false }),
                pricesRow(state)
            ]
        };
    }

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
        components.push(controlsRow(state, { hasUpgrade: false }));
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

    // ---- The answer, as a Section -- co-locates the stat with the ONE control that acts on it, instead of leaving the reader to carry the number down to a generic button row. See controlsRow's own header comment for why.
    //
    // ⚠️ PROGRESSIVE DISCLOSURE, 2026-08-26 13:19 EDT -- Harkirat's pick after two rejections: a hybrid of this Section/accessory treatment with MOCKUP C. headline is ALWAYS on screen; detail (the ladder, the upgrade note, the Least Waste alternative, the region comparison, the estimate disclaimer) renders ONLY when state.detail is true, behind the "Show breakdown" toggle below. Nothing about WHICH facts exist changed -- only whether they render by default. The controls (selects, region/upgrade buttons) are NOT gated; the complaint was about stacked DATA, never about the pickers.
    const answer = state.target === 'B' ? budgetAnswer(state, entry, total) : goalAnswer(state, entry, total, upgrade);
    const sectionLines = state.detail ? [...answer.headline, ...answer.detail] : answer.headline;
    const answerBlock = { type: 10, content: sectionLines.join('\n') };
    components.push(answer.action ? {
        type: 9,
        components: [answerBlock],
        accessory: { type: 2, style: 2, label: answer.action === 'budget' ? 'Set Budget' : 'Set Balance', custom_id: encodeState('modal', state) }
    } : answerBlock);

    // ---- How to buy it ---- compact=true collapses Cheapest to the one line MOCKUP C showed ("Cheapest: $X -- combo"); Least Waste, the savings note and the purchase-count caption all move behind the same toggle as the ladder.
    const shortfall = state.target === 'B' ? 0 : shortfallFor(state, total, upgrade);
    if (shortfall > 0) {
        components.push({ type: 14, spacing: 2, divider: true });
        components.push({ type: 10, content: purchaseAdvice(shortfall, state, currency, { compact: !state.detail }).join('\n') });
    }

    // ---- The toggle -- only when there is real detail behind it. "Already there"/no-purchase-needed has no ladder and no purchase block, so there is nothing to collapse; finePrint's own showRegionRow already suppresses the one line that COULD differ there, so it renders unconditionally in that case exactly as before this pass.
    const hasDetail = answer.detail.length > 0 || (state.target !== 'B' && shortfall > 0);
    if (hasDetail) {
        components.push({ type: 1, components: [{ type: 2, style: 2, label: state.detail ? '↑ Hide breakdown' : '↓ Show breakdown', custom_id: encodeState('detail', state) }] });
    }

    // ---- Fine print ---- gated the same way: the region comparison and currency disclaimer are exactly the kind of thing MOCKUP C's collapsed state omitted entirely.
    if (!hasDetail || state.detail) {
        components.push({ type: 10, content: finePrint(state, currency, client, { upgradeIncluded: upgrade !== null, showRegionRow: answer.action !== null }).join('\n') });
    }

    // ---- Controls ---- A first-time user has no way to learn what these three dropdowns are FOR by looking at them: Discord shows a SELECT'S CURRENT VALUE once one option carries default:true (verified against the real render, 2026-08-26 12:55 EDT) -- and defaultState() always sets a concrete drawKey/pullsDone/target, so the placeholder text every select carries ("Which draw are you pulling on?" etc) never actually renders for anyone, first-time or not. It also isn't obvious there's no Calculate button to press -- every control here just edits the answer above in place. One line says both things once, economically, rather than three separate per-select captions (which would cost 3 more components for the same information).
    components.push({ type: 10, content: '-# 🎛️ Everything below edits the numbers above live — change the draw, how far you are, or your goal any time.' });
    components.push(drawSelectRow(state));
    components.push(pullsSelectRow(state, total));
    components.push(goalSelectRow(state, total));
    if (liveDoubleCPEntry || assertDoubleCP || state.entitlementMask) {
        components.push({ type: 10, content: liveDoubleCPEntry
            ? `-# 🎉 A **Double CP** event looks live right now${liveDoubleCPEntry.endDate ? ` (ends <t:${Math.floor(new Date(liveDoubleCPEntry.endDate).getTime() / 1000)}:R>)` : ''}. Tell the optimizer which packages you still have a 2X entitlement on.`
            : `-# Select which packages you still have an unused 2X entitlement on, if the event is running.` });
        components.push(entitlementSelectRow(state));
    }
    components.push(controlsRow(state, { hasUpgrade: upgradeAvailable !== null }));
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

    // THIRD PASS, 2026-08-26 13:19 EDT -- Harkirat's pick: a hybrid of the shipped Section/accessory treatment with progressive disclosure (MOCKUP C, DM'd for comparison). headline is ALWAYS shown; detail (the ladder + upgrade note) renders only when state.detail is true, via the "Show breakdown" toggle below. This is the split point buildCalculatorPanel joins back together based on that flag.
    const headline = [];
    const detail = [];
    if (pullsLeft <= 0 && !upgrade) {
        headline.push(`### ✅ You are already there`);
        headline.push(`You have completed **pull ${targetPull} of ${total}**. Aim further with the goal picker below.`);
        return { headline, detail, action: null }; // nothing left to enter a balance FOR
    }
    if (shortfall <= 0) {
        // Balance figure is already on the status line above -- this branch's only job is the outcome (covers it) and the leftover, not a third restatement of the balance.
        headline.push(`### ✅ You already have enough — buy nothing`);
        headline.push(`**${fmt(needed)} CP** covers ${pullsLeft > 0 ? plural(pullsLeft, 'more pull') : 'the upgrade'}, with **${fmt(-shortfall)} CP** left over.`);
    } else {
        // 2026-08-26 12:34 EDT, second pass -- Harkirat, looking at a live render: "this is NOT helpful, this is overwhelming". The FIRST pass cut sentence count but left "5,810 CP still needed" and "Finishes all 10 pulls." as two separate sentences restating the same fact from two angles. Fused into one: the amount and the goal are one idea, not two.
        headline.push(`### ${emojis.cp2} **${fmt(shortfall)} CP** to ${state.target === 'P' ? `reach pull ${targetPull} of ${total}` : `finish all ${total} pulls`}`);
        if (state.balance) headline.push(`-# ${fmt(needed)} CP to go − ${fmt(state.balance)} CP balance = **${fmt(shortfall)} CP** to buy.`);
    }

    // The ladder stops at the TARGET, not at the end of the draw. The old build always sliced to entry.draws.length, so choosing "stop at pull 5" printed all ten pulls underneath a headline that priced five -- the two disagreed on screen.
    const ladder = entry.draws.slice(state.pullsDone, targetPull);
    if (ladder.length) detail.push(`${ladder.map(n => `**${fmt(n)}**`).join(' / ')}`);
    // The controls row's "Upgrade: Off" button already says a step exists; this line's only job is the number the button can't show.
    if (upgradeAvailable !== null) {
        detail.push(upgrade !== null ? `-# +${fmt(upgrade)} CP upgrade included.` : `-# +${fmt(upgradeAvailable)} CP if you include the Upgrade below.`);
    }
    return { headline, detail, action: 'balance' };
}

function budgetAnswer(state, entry, total) {
    const headline = [];
    const detail = [];
    if (!state.targetValue) {
        headline.push(`### ${emojis.cp2} How far does a budget go?`);
        headline.push(`Press **Set Budget** and enter the CP you are willing to spend.`);
        return { headline, detail, action: 'budget' };
    }
    const result = reachableWithBudget(state.region, state.drawKey, state.pullsDone, state.targetValue);
    const gained = result.pullsReachable - state.pullsDone;
    headline.push(`### ${emojis.cp2} **${fmt(state.targetValue)} CP** reaches **pull ${result.pullsReachable}** of ${total}`);
    headline.push(gained > 0
        ? `That is **${plural(gained, 'more pull')}** from where you are now.`
        : `That is not enough for even one more pull from pull ${state.pullsDone}.`);
    detail.push(result.cpShortOfNext !== null
        ? `-# **${fmt(result.cpShortOfNext)} CP** short of pull ${result.pullsReachable + 1} · ${fmt(state.targetValue - result.cpUsed)} CP would go unspent.`
        : `-# That finishes the draw outright, with **${fmt(state.targetValue - result.cpUsed)} CP** left over.`);
    // Bold marks the pulls the budget actually covers, so the ladder answers "which ones do I get" rather than repeating the headline in list form.
    const ladder = entry.draws.slice(state.pullsDone);
    if (ladder.length) {
        detail.push(`-# **Pulls from here:** ${ladder.map((n, i) => (state.pullsDone + i < result.pullsReachable ? `**${fmt(n)}**` : fmt(n))).join(' / ')}`);
    }
    return { headline, detail, action: 'budget' };
}

// SECOND PASS, 2026-08-26 12:34 EDT (Harkirat, looking at a live render: "look how prose heavy it is... this is NOT helpful, this is overwhelming"). The FIRST pass (12:23 EDT) crammed price + combo + count + leftover into ONE bold sentence to cut from six lines to three -- that reduced line COUNT while making each line worse: "Cheapest -- CA$82.98 x 1x 880 CP + 1x 5,000 CP (2 purchases, 70 CP left over)" is one dense clause that wraps to three lines on a phone regardless of how few sentences it is. Line count was the wrong thing to optimize. This version optimizes WRAP count instead: each tier is a short bold price line (~20 chars), a plain combo line (~25 chars) -- neither wraps -- and one caption folding the count/leftover/savings, which is allowed to wrap once because it is the lowest-priority tier, same as the region-comparison and estimate lines below it. THIRD PASS, 2026-08-26 13:19 EDT -- {compact} collapses to the ONE line MOCKUP C's collapsed state showed ("Cheapest: $X -- combo"), for when state.detail is false. Least Waste, the purchase-count caption and the savings note only exist in the full render.
function purchaseAdvice(shortfall, state, currency, { compact = false } = {}) {
    const doubleCpAvailable = CP_PACKAGES.filter((p, i) => (state.entitlementMask & (1 << i)) !== 0).map(p => p.id);
    const result = optimizePurchase(shortfall, { currency, doubleCpAvailable });
    // Reads the optimizer's OWN cpEach rather than re-deriving with normalCp() (v3-pre-release review, finding #3) -- normalCp() never applies the double-CP bonus, so every 2X combo entry rendered the un-doubled figure.
    const describe = r => r.combo.map(c => `${c.count}× ${fmt(c.cpEach)} CP${c.mode === 'double' ? ' (2X)' : ''}`).join(' + ');
    if (compact) {
        return [`-# 🛒 Cheapest: **${formatMoney(result.cheapest.totalCents, currency)}** — ${describe(result.cheapest)}`];
    }
    const savings = result.naive.totalCents - result.cheapest.totalCents;
    const savingsNote = savings > 0 ? `saves ${formatMoney(savings, currency)} vs. ${fmt(result.naive.combo[0].cpEach)} CP alone` : null;
    const lines = [
        `### 🛒 Cheapest — **${formatMoney(result.cheapest.totalCents, currency)}**`,
        describe(result.cheapest),
        `-# ${plural(result.cheapest.transactions, 'purchase')} · ${fmt(result.cheapest.leftoverCp)} CP left over${savingsNote ? ` · ${savingsNote}` : ''}`
    ];
    // Its own header+emoji (2026-08-26 12:50 EDT), matching Cheapest's -- plain bold text at the same weight as the combo line above it read as a continuation of that line, not as an unmistakably SEPARATE alternative. A reader skimming for "is there another option" needs a landmark as strong as the one that told them "Cheapest" was here.
    if (result.leastWaste.totalCents !== result.cheapest.totalCents || result.leastWaste.leftoverCp !== result.cheapest.leftoverCp) {
        lines.push(
            `### ⚖️ Least Waste — **${formatMoney(result.leastWaste.totalCents, currency)}**`,
            describe(result.leastWaste),
            `-# ${plural(result.leastWaste.transactions, 'purchase')} · ${fmt(result.leastWaste.leftoverCp)} CP left over`
        );
    }
    return lines;
}

function finePrint(state, currency, client, { upgradeIncluded = false, showRegionRow = true } = {}) {
    const lines = [];
    // Region reality check -- computed live, since every control recomputes the whole panel from scratch anyway (see the Statelessness note above).
    //
    // ⚠️ EVERY FIGURE ON THIS ROW MUST BE THE SAME KIND OF FIGURE, and the first version was not. It listed only the OTHER regions, and compared them against a headline that had the upgrade folded in -- so with the upgrade toggled on, a 6,070 CP local total sat beside "20 CP 640 CP" and the sentence claiming higher regions cost MORE was refuted by its own numbers. Two fixes: the current region is in the row (a comparison needs its own baseline present, not implied by the panel above it), and the upgrade is excluded from all three, which is the only basis available -- mythicWeapon has no upgrade figure at region_20 at all, so including it would have compared a total against a subtotal.
    //
    // ⚠️ SUPPRESSED when there's nothing left to compare (showRegionRow=false, 2026-08-26 12:54 EDT) -- the "already there" branch (goalAnswer's action:null) has pullsLeft<=0, so every region's remaining figure is genuinely 0, and a row reading "20 CP 0 - 30 CP 0 CP" is not a comparison, it's noise stating the same non-fact three times. Caught by READING a render, not by counting components -- a structural check would have passed this every time.
    if (state.target !== 'B' && showRegionRow) {
        const row = REGION_ORDER.map(r => {
            const e = entryFor(r, state.drawKey);
            if (!e) return null;
            const need = state.target === 'P'
                ? remainingToPull(r, state.drawKey, state.pullsDone, Math.min(Math.max(state.targetValue, state.pullsDone), e.draws.length))
                : remainingToFinish(r, state.drawKey, state.pullsDone);
            return r === state.region ? null : `${regionLabel(r)} ${fmt(need)}`;
        }).filter(Boolean);
        // SECOND PASS, 2026-08-26 12:34 EDT: the current region's own figure used to sit in this row too ("10 CP region **5,810**") -- but that number is already the giant headline three lines up. Repeating it here, in grey caption text, was pure redundancy; the row now names only the OTHER regions, which is the only new information it was ever providing. Shortened the trailing clause from a full sentence to a short tag for the same reason the purchase block was split -- one idea, one line, no wrap-inducing run-on.
        if (row.length) lines.push(`-# Other regions, same goal: ${row.join(' · ')} CP${upgradeIncluded ? ' (upgrade excluded)' : ''}.`);
    }
    const settingsMention = client ? mentionCommand(client, '/settings') : '`/settings`';
    lines.push(`-# Estimate only — varies by tax/conversion. Currency: **${currency}** (${settingsMention}).`);
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
