// ==========================================
// COMMAND: /draw calculator -- one live panel
// ==========================================
// Deliberately exports NO `data`. bot/registry.js's loadCommandModules() only registers a module having BOTH `data` and `execute`, and keys the registration by data.name -- a second file exporting setName('draw') would register a DUPLICATE `draw` command and silently overwrite drawprices.js's registration in client.commands. This module stays safely un-registered while remaining requireable from commands/drawprices.js, which owns the `draw` group's builder and dispatches the `calculator` subcommand here. See docs/superpowers/specs/2026-08-15-draw-cost-calculator-design.md's "registration constraint" section.
//
// ⚠️ FOURTH PASS, 2026-08-26 17:26 EDT -- rebuilt around Harkirat's OWN mockup (a real Components V2 message he built and exported as JSON, pasted in verbatim rather than described). Three prior passes each guessed at "better structure" from first principles and were each rejected; this one implements a concrete, given spec instead. The panel is still ONE always-live message (see the 11:14 EDT note below, unchanged) -- what changed is the CONTENT MODEL: the top block reuses /draw prices' own per-draw entry renderer verbatim (drawprices.js's buildDrawEntries, exported for exactly this), and everything calculator-specific lives in a single "## COST BREAKDOWN" block whose density is controlled by ONE button, relabelled "Simplify" (collapse) / "Show Breakdown" (expand) per Harkirat's own words -- "Simplify is basically a reword of Hide breakdown". The Section+accessory landmark pattern from the third pass is GONE: his mockup puts every control back into plain Action Rows, and there is no color/border primitive in Components V2 for a Section to buy over a well-structured Text Display anyway (see the corrected mockups from earlier this session).
//
// ⚠️ ONE PANEL, NOT TWO STAGES (rebuilt 2026-08-26 11:14 EDT, still true). The original build was a setup FORM you filled in and then pressed "Calculate" on: pick a draw, pick a goal, open a modal, type two numbers, submit, press Calculate -- five interactions before a single figure appeared, and the setup panel showed no numbers at all while you filled it in. Every figure here is a pure function of the state carried in the customId, so recomputing on every click costs a few thousand integer ops against a Discord round trip. The panel therefore ALWAYS shows the answer and every control edits it in place. That also removes the modal from the common path: "pulls done" and "which pull am I aiming for" are small bounded integers, which is a SELECT -- a text field for them was the single most hostile thing about the old flow. Only genuinely free-form amounts (a CP balance, a CP budget) still open a modal.
//
// ⚠️ ABSENT DATA IS A FIRST-CLASS STATE, NOT AN EDGE CASE. DRAW_DATA has real holes -- doubleEpicCharacters exists only at region_10. buildCalculatorPanel() branches on entryFor() before it reads any count, and the pull/goal selects -- both of which are enumerations OF a pull count -- are simply not rendered when there is no count to enumerate.
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { mentionCommand } = require('../utils/commandMentions');
const { getAccentColorForCommand } = require('../utils/accentColor');
const emojis = require('../utils/emojiMap');
const UserPreference = require('../models/UserPreference');
const { DRAW_META, DRAW_DATA, REGION_ORDER, REGION_EMOJI_KEY, PRESET_ACCENT, buildDrawEntries, UPGRADE_LABEL } = require('./drawprices');
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

// Only mythicWeapon/mythicCharacter have the Mythic Card upgrade mechanic (UPGRADE_LABEL's own two keys) -- every other draw has no upgrade at all, so this returns null for them rather than a fallback icon.
function upgradeCardEmoji(drawKey) {
    if (drawKey === 'mythicWeapon') return emojis.mythicCard;
    if (drawKey === 'mythicCharacter') return emojis.mythicCoin;
    return null;
}

// ==========================================
// STATE CODEC
// ==========================================
// All panel state rides in the customId -- no model, no cache, no per-user persistence beyond the one deliberate exception (cpCurrency). That is a PRIVACY decision as much as an architectural one: storing someone's CP balance and spend progress would need a PRIVACY.md Appendix A entry and would trip the privacy-inventory docs-audit gate. It is also what makes a single always-live panel affordable -- every click just recomputes, and there is nothing to invalidate.
//
// Format: calc~<verb>~r<region digits>~d<draw index>~p<pulls done>~t<target>~v<target value>
//         ~b<balance>~u<0|1 upgrades>~e<2X entitlement bitmask>~x<0|1 detail>
// Fields are looked up BY PREFIX rather than by position, so a missing field decodes to its default instead of shifting every field after it. Discord's customId cap is 100 chars; a maximal state here is about 50.
function defaultState() {
    return {
        verb: 'setup',
        region: 'region_10',
        drawKey: null,          // landing state -- no draw picked yet, no number computed
        pullsDone: 0,
        target: 'F',            // F = finish, P = specific pull, B = budget
        targetValue: 0,
        balance: 0,
        includeUpgrades: false,
        entitlementMask: 0,
        detail: false            // progressive disclosure -- collapsed ("Simplify"d) by default
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

// The number the whole panel turns on: what is left to buy AFTER the balance already in hand.
function shortfallFor(state, total, upgrade) {
    const targetPull = state.target === 'P' ? Math.min(Math.max(state.targetValue, state.pullsDone), total) : total;
    const remainingCp = state.target === 'P'
        ? remainingToPull(state.region, state.drawKey, state.pullsDone, targetPull)
        : remainingToFinish(state.region, state.drawKey, state.pullsDone);
    return remainingCp + (upgrade || 0) - state.balance;
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
// Every option carries its own PRICE. A dropdown whose options read "Stop at pull 7" tells you nothing you did not already know; one whose options read "Stop at pull 7 -- 6,800 CP from here" turns the control itself into the comparison. The figures are the same drawCost.js calls the panel body makes, so they cannot disagree with the answer above them.
function drawSelectRow(state) {
    return {
        type: 1,
        components: [{
            type: 3, custom_id: encodeState('draw', state), placeholder: 'Which draw are you pulling on?',
            options: DRAW_KEYS.map(key => {
                const total = pullCount(state.region, key);
                // The two mythic draws have an Upgrade step that the "CP total" figure doesn't include -- mention it here too, or the dropdown quietly undersells what finishing this draw actually costs (found live 2026-08-26 17:34 EDT, Harkirat clicking through the real select).
                const upgrade = total !== null ? upgradeCost(state.region, key) : null;
                return {
                    label: DRAW_META[key].name,
                    value: key,
                    // A draw with no data at THIS region says so in its own description rather than silently offering itself as if it were priced -- selecting it is still allowed, and lands on the no-data panel with its region buttons.
                    description: total === null
                        ? `No data at ${regionLabel(state.region)} yet`
                        : `${plural(total, 'pull')} · ${fmt(remainingToFinish(state.region, key, 0))} CP total${upgrade !== null ? ` + ${fmt(upgrade)} CP Upgrade` : ''}`,
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

// Region-only now (2026-08-26 17:26 EDT) -- the upgrade toggle moved into the top control row (Set Balance/Upgrade/Simplify), matching Harkirat's own mockup, which puts all three of those together and keeps this row purely regional.
function controlsRow(state) {
    return {
        type: 1,
        components: REGION_ORDER.map(key => ({
            type: 2,
            style: key === state.region ? 1 : 2,
            disabled: key === state.region,
            custom_id: encodeState('region', { ...state, region: key }),
            label: regionLabel(key),
            emoji: emojis.parseEmoji(emojis[REGION_EMOJI_KEY[key]])
        }))
    };
}

// Points at the EXACT custom_id drawprices.js's own region-switch buttons produce, so this routes through handlers/drawprices.js's existing price_region_ branch with no new handler code on either side.
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

// The row above the dropdowns -- Set Balance/Set Budget, Upgrade (only where real upgrade data exists), Simplify/Show Breakdown. Matches Harkirat's own mockup exactly: all three in one Action Row, none of them a Section accessory.
function actionRow(state, { hasUpgrade }) {
    const buttons = [{
        type: 2, style: 2,
        label: state.target === 'B' ? 'Set Budget' : 'Set Balance',
        custom_id: encodeState('modal', state),
        emoji: emojis.parseEmoji(emojis.cp2)
    }];
    if (hasUpgrade) {
        const cardEmoji = upgradeCardEmoji(state.drawKey);
        buttons.push({
            type: 2, style: state.includeUpgrades ? 3 : 2,
            label: state.includeUpgrades ? 'Upgrade: On' : 'Upgrade: Off',
            custom_id: encodeState('upg', state),
            ...(cardEmoji ? { emoji: emojis.parseEmoji(cardEmoji) } : {})
        });
    }
    buttons.push({ type: 2, style: 2, label: state.detail ? 'Simplify' : 'Show Breakdown', custom_id: encodeState('detail', state) });
    return { type: 1, components: buttons };
}

// ==========================================
// COST BREAKDOWN -- matches Harkirat's own mockup (a real Components V2 message he built and exported, 2026-08-26 17:18 EDT). TYPE/TOTAL PRICE deliberately duplicate the reused /draw-prices summary block pushed just above this in buildCalculatorPanel -- his own mockup keeps both, so this block reads standalone without scrolling up. The region-comparison feature from the third pass is dropped entirely: it appears nowhere in his mockup and nothing asked for it to survive the redesign.
// ==========================================
function buildCostBreakdown(state, entry, total, upgrade, currency, client, { compact }) {
    const meta = DRAW_META[state.drawKey];
    const upgradeAvailable = upgradeCost(state.region, state.drawKey);
    const entryTotal = entry.draws.reduce((a, b) => a + b, 0);
    const targetPull = state.target === 'P' ? Math.min(Math.max(state.targetValue, state.pullsDone), total) : total;
    const remainingCp = state.target === 'P'
        ? remainingToPull(state.region, state.drawKey, state.pullsDone, targetPull)
        : remainingToFinish(state.region, state.drawKey, state.pullsDone);
    const needed = remainingCp + (upgrade || 0);
    const shortfall = needed - state.balance;
    const spent = spentSoFar(state.region, state.drawKey, state.pullsDone);
    const pullsLeft = Math.max(0, targetPull - state.pullsDone);

    // Mobile polish (2026-08-26 17:38 EDT, Harkirat's own click-through screenshot): every value used to sit inside a backtick code-span, which Discord renders as a grey boxed "pill" -- fine on desktop, but a long one (a draw NAME, a bar+fraction) wraps mid-box on a narrow phone width and reads as broken. Bold text wraps like a normal sentence with no box to break out of, so every value below is bold-only, no backticks. Also dropped the blank-line gap BETWEEN field pairs (TYPE/TOTAL, PROGRESS/PENDING, BALANCE/CP-SPENT) -- on mobile those gaps read as far larger relative to how little text sits between them than they did in the source mockup, which was likely viewed on desktop.
    const lines = [`## COST BREAKDOWN — ${regionLabel(state.region)} REGION`];

    if (!compact) {
        lines.push(`-# > TYPE: **${meta.name}**${upgrade !== null ? ` + **${UPGRADE_LABEL[state.drawKey]} Upgrade**` : ''}`);
        lines.push(upgrade !== null
            ? `-# > TOTAL PRICE: **${fmt(entryTotal)} CP Draw** + **${fmt(upgradeAvailable)} CP Upgrade** = **${fmt(entryTotal + upgradeAvailable)} CP**`
            : `-# > TOTAL PRICE: **${fmt(entryTotal)} CP**`);
        lines.push(`-# > PROGRESS:  **${progressBar(state.pullsDone, total)}**  **${state.pullsDone} / ${total} Pulls**`);
        const pending = [`**${fmt(pullsLeft)}x Draw Pull${pullsLeft === 1 ? '' : 's'}**`];
        if (upgrade !== null) pending.push(`**${fmt(entry.upgrade.count)}x Mythic Card Spin${entry.upgrade.count === 1 ? '' : 's'}**`);
        lines.push(`-# > PENDING: ${pending.join(' · ')}`);
        lines.push(`-# > BALANCE: **${state.balance ? `${fmt(state.balance)} CP` : 'Not specified'}**`);
        lines.push(`-# > CP SPENT: **${fmt(spent)} CP** · CP NEEDED: **${fmt(needed)} CP**`);
    } else {
        lines.push(`-# > PROGRESS:  **${progressBar(state.pullsDone, total)}**  **${state.pullsDone} / ${total} Pulls**`);
        lines.push(`-# > CP SPENT: **${fmt(spent)} CP** · CP NEEDED: **${fmt(needed)} CP**`);
    }

    if (shortfall <= 0) {
        lines.push('');
        lines.push('✅ **Your balance already covers this.**');
        return lines;
    }

    lines.push('');
    const doubleCpAvailable = CP_PACKAGES.filter((p, i) => (state.entitlementMask & (1 << i)) !== 0).map(p => p.id);
    const result = optimizePurchase(shortfall, { currency, doubleCpAvailable });
    // Reads the optimizer's OWN cpEach/priceCents rather than re-deriving with normalCp() (v3-pre-release review, finding #3) -- normalCp() never applies the double-CP bonus, so a re-derived 2X combo entry would render the un-doubled figure.
    const describeCp = r => r.combo.map(c => `**${c.count}×** ${fmt(c.cpEach)} CP${c.mode === 'double' ? ' (2X)' : ''}`).join(' + ');
    const describePrices = r => r.combo.map(c => `**${formatMoney(c.priceCents * c.count, currency)}**`).join(' + ');
    const packageLines = (label, r) => compact
        ? [`**${label}:** **${formatMoney(r.totalCents, currency)}** for **${fmt(r.totalCp)} CP** — ${describeCp(r)}`]
        : [
            `**${label} Method**`,
            `> **${formatMoney(r.totalCents, currency)}** for **${fmt(r.totalCp)} CP**`,
            `-# ${describeCp(r)} ⌇ **${fmt(r.totalCp)} CP**`,
            `-# ${describePrices(r)} ⌇ **${formatMoney(r.totalCents, currency)}**`,
            `-# Left Over: **${fmt(r.leftoverCp)} CP** (${fmt(r.totalCp)} CP Purchase − ${fmt(shortfall)} CP Needed)`
        ];

    lines.push('### RECOMMENDED PACKAGE');
    lines.push(...packageLines('Cheapest', result.cheapest));
    if (!compact && (result.leastWaste.totalCents !== result.cheapest.totalCents || result.leastWaste.leftoverCp !== result.cheapest.leftoverCp)) {
        lines.push('');
        lines.push(...packageLines('Least Waste', result.leastWaste));
    }
    if (!compact) {
        lines.push('');
        const settingsMention = client ? mentionCommand(client, '/settings') : '`/settings`';
        lines.push(`-# NOTE: Estimates only — varies by tax/conversion. Currency: **${currency}** (Change in ${settingsMention}).`);
    }
    return lines;
}

// Budget mode asks a different question ("how far does this go", not "what do I still need") -- kept as its own function rather than forced into buildCostBreakdown's TYPE/TOTAL/PENDING/RECOMMENDED PACKAGE shape, none of which apply here. No mockup was given for this mode; it keeps the same header for visual consistency with the goal-mode block sitting in the same slot.
function buildBudgetBreakdown(state, entry, total, { compact }) {
    const lines = [`## COST BREAKDOWN — ${regionLabel(state.region)} REGION`];
    lines.push(`-# > PROGRESS:  **${progressBar(state.pullsDone, total)}**  **${state.pullsDone} / ${total} Pulls**`);
    if (!state.targetValue) {
        lines.push('');
        lines.push('Press **Set Budget** and enter the CP you are willing to spend.');
        return lines;
    }
    const result = reachableWithBudget(state.region, state.drawKey, state.pullsDone, state.targetValue);
    const gained = result.pullsReachable - state.pullsDone;
    lines.push(`-# > BUDGET: **${fmt(state.targetValue)} CP** reaches **pull ${result.pullsReachable}** of ${total}`);
    if (!compact) {
        lines.push(gained > 0
            ? `-# That is **${plural(gained, 'more pull')}** from where you are now.`
            : `-# That is not enough for even one more pull from pull ${state.pullsDone}.`);
        lines.push(result.cpShortOfNext !== null
            ? `-# **${fmt(result.cpShortOfNext)} CP** short of pull ${result.pullsReachable + 1} · ${fmt(state.targetValue - result.cpUsed)} CP would go unspent.`
            : `-# That finishes the draw outright, with **${fmt(state.targetValue - result.cpUsed)} CP** left over.`);
        const ladder = entry.draws.slice(state.pullsDone);
        if (ladder.length) lines.push(`-# **Pulls from here:** ${ladder.map((n, i) => (state.pullsDone + i < result.pullsReachable ? `**${fmt(n)}**` : fmt(n))).join(' / ')}`);
    }
    return lines;
}

// ==========================================
// PANEL
// ==========================================
function buildCalculatorPanel(state, accentColor, options = {}) {
    const { liveDoubleCPEntry = null, assertDoubleCP = false, currency = 'USD', client = null, notice = null } = options;

    // Single-line title, no second caption line -- matches Harkirat's mockup exactly ("## <Calculator emoji> Lucky Draw Calculator", nothing beneath it). The draw name used to be the title's own heading; it now shows properly inside the reused /draw-prices summary block below, so the title no longer needs to carry it.
    const titleBlock = { type: 10, content: `## ${emojis.calculator} Lucky Draw Calculator` };

    // ---- Landing: no draw picked yet ---- Every user used to land on Mythic Weapon Draw, 0 pulls, finish -- a real computed answer to a question nobody had asked yet. Nothing is computed here; the draw select is the only thing that matters, and with no option carrying default:true its PLACEHOLDER actually renders (verified: Discord only shows a select's placeholder when no option is marked default).
    if (!state.drawKey) {
        return {
            type: 17, accent_color: accentColor,
            components: [
                titleBlock,
                { type: 14, spacing: 2, divider: true },
                { type: 10, content: '🎯 Pick a draw below to see what you still need, and the cheapest way to buy it.' },
                drawSelectRow(state),
                controlsRow(state),
                pricesRow(state)
            ]
        };
    }

    const entry = entryFor(state.region, state.drawKey);
    const components = [titleBlock, { type: 14, spacing: 2, divider: true }];

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
        components.push(controlsRow(state));
        components.push(pricesRow(state));
        return { type: 17, accent_color: accentColor, components };
    }

    const total = entry.draws.length;
    const upgradeAvailable = upgradeCost(state.region, state.drawKey);
    const upgrade = state.includeUpgrades && upgradeAvailable !== null ? upgradeAvailable : null;

    // ---- The reused /draw-prices summary -- heading, total, pull ladder, cumulative spend, and (where it exists) the Upgrade sub-block, all built by drawprices.js's OWN buildDrawEntries so the two commands can never drift into two similar-but-different renderings of the same draw. The upgrade sub-block's card emoji is spliced in here ONLY -- drawprices.js's shared output is untouched, so /draw prices itself is unaffected.
    const summaryBlocks = buildDrawEntries(state.region, [state.drawKey])[0];
    const upgradeHeading = upgrade !== null || state.includeUpgrades || upgradeAvailable !== null ? `**${UPGRADE_LABEL[state.drawKey]} Upgrade**` : null;
    const cardEmoji = upgradeCardEmoji(state.drawKey);
    const summaryWithIcon = cardEmoji && upgradeHeading
        ? summaryBlocks.map(b => b.startsWith(upgradeHeading) ? `${cardEmoji} ${b}` : b)
        : summaryBlocks;
    components.push({ type: 10, content: summaryWithIcon.join('\n') });
    components.push({ type: 14, spacing: 1, divider: true });

    // ---- COST BREAKDOWN -- the calculator-specific block, density controlled by state.detail. ----
    const breakdownLines = state.target === 'B'
        ? buildBudgetBreakdown(state, entry, total, { compact: !state.detail })
        : buildCostBreakdown(state, entry, total, upgrade, currency, client, { compact: !state.detail });
    components.push({ type: 10, content: breakdownLines.join('\n') });
    components.push(actionRow(state, { hasUpgrade: upgradeAvailable !== null }));
    components.push({ type: 14, spacing: 1, divider: true });

    // ---- Controls ----
    components.push({ type: 10, content: '-# Select the **Draw Type**, **Number of Pulls Done**, and **Your Goal** from the dropdowns below.' });
    components.push(drawSelectRow(state));
    components.push(pullsSelectRow(state, total));
    components.push(goalSelectRow(state, total));
    if (liveDoubleCPEntry || assertDoubleCP || state.entitlementMask) {
        components.push({ type: 10, content: liveDoubleCPEntry
            ? `-# 🎉 A **Double CP** event looks live right now${liveDoubleCPEntry.endDate ? ` (ends <t:${Math.floor(new Date(liveDoubleCPEntry.endDate).getTime() / 1000)}:R>)` : ''}. Tell the optimizer which packages you still have a 2X entitlement on.`
            : `-# Select which packages you still have an unused 2X entitlement on, if the event is running.` });
        components.push(entitlementSelectRow(state));
    }
    if (notice) components.push({ type: 10, content: `-# ${notice}` });
    components.push({ type: 14, spacing: 1, divider: true });
    components.push({ type: 10, content: '-# Use the buttons to toggle between **Regional Prices**.' });
    components.push(controlsRow(state));
    components.push(pricesRow(state));

    return { type: 17, accent_color: accentColor, components };
}

// ==========================================
// SLASH ENTRY
// ==========================================
// The options exist so the panel is not the ONLY way in. Someone who already knows their situation types it once -- `/draw calculator draw:… pulls:3 balance:3000` -- and the first thing they see is the answer, with the controls underneath for adjusting it. Every option is optional, so the bare command still opens on the landing state.
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
