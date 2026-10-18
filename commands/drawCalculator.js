// ==========================================
// COMMAND: /draw calculator -- saved baskets, per-banner planning
// ==========================================
// Deliberately exports NO `data`. bot/registry.js's loadCommandModules() only registers a module having BOTH `data` and `execute`, and keys the registration by data.name -- a second file exporting setName('draw') would register a DUPLICATE `draw` command and silently overwrite drawprices.js's registration in client.commands. This module stays safely un-registered while remaining requireable from commands/drawprices.js, which owns the `draw` group's builder and dispatches the `calculator` subcommand here.
//
// ⚠️ FIFTH PASS, 2026-08-27 11:48 EDT -- rebuilt around the saved-basket redesign (docs/superpowers/specs/2026-08-27-draw-calculator-multi-draw-design.md, revision 3). The whole prior single-draw model (drawKey/pullsDone/target/targetValue living in the customId) is GONE. 🔴 THE BASKET IS A FLAT LIST OF BANNERS -- "quantity" does not exist as a concept. Three Mythic Weapon banners are three separate, independently-orderable rows in `basket.banners`, each with its own `pullsDone`. Budget mode and per-banner goals other than "finish" are explicitly out of scope (spec §10) -- there is no goal select any more, every banner is always priced to completion.
//
// ⚠️ STATE NOW LIVES IN TWO PLACES ON PURPOSE. The customId carries only a reference plus transient VIEW state (which page, detail on/off, the reorder focus pointer, the author lock) -- `calc~<verb>~<basketId>~g<page>~x<detail>~f<focus>~a<authorId base36>`. The basket itself (banners/region/balance/includeUpgrades/entitlementMask/name) lives in the DrawBasket collection via utils/drawBasketStore.js, and is looked up fresh on every render. 🔴 THAT MEANS THE PANEL CAN NOW GO STALE -- a basket can be deleted, or an unnamed one can expire (30-day TTL) -- which the old fully-stateless design made structurally impossible. Every render path through buildCalculatorPanel() takes `basket` as an explicit possibly-null argument and has a real "this basket no longer exists" branch; there is no path that assumes it is there.
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { mentionCommand } = require('../utils/commandMentions');
const { getAccentColorForCommand } = require('../utils/accentColor');
const emojis = require('../utils/emojiMap');
const UserPreference = require('../models/UserPreference');
const { DRAW_META, REGION_ORDER, REGION_EMOJI_KEY, PRESET_ACCENT, UPGRADE_LABEL, MYTHIC_UPGRADE, upgradeFullAmount, SERIES_ARMORY, ARMORY_SPIN_CP } = require('./drawprices');
const { pullCount, upgradeCost, remainingToFinish, spentSoFar, basketCost, upgradePlan, upgradeState, characterPreset, isArmoryKey, armorySize, upgradeKeyOf, ARMORY_SIZES, ARMORY_DEFAULT_SIZE } = require('../utils/drawCost');
const crypto = require('crypto');
const { CP_PACKAGES, STOCK_UP_RULES, PURCHASE_RULES, normalCp, priceCents, formatMoney, optimizePurchase } = require('../utils/cpPackages');
const { buildTitleBlock, toBoldItalicUnicode } = require('../utils/titleBlock');

// 📝 PLAYER-FACING VOCABULARY, decided by Harkirat 2026-08-27 after three rounds of rejected candidates. The saved thing is a **calculation** (his own word: "reset/new calculation"); one row in it is a **line** (provisional -- he expects to revisit it). Both replace "basket"/"banner": "banner" collides with Discord profile banners, and every container metaphor (basket/cart/plan/list) read wrong because the player is PURCHASING and budgeting, not collecting. INTERNAL identifiers (DrawBasket, drawBasketStore, `basket`, `banners`) deliberately keep the old names -- renaming the model would churn PRIVACY.md, the store, and every test for something no user can see. Only strings a player reads are in scope here.
const DRAW_KEYS = Object.keys(DRAW_META);
// Every draw a calculation can hold: the nine ladder draws, then the three Series Armories (2026-10-18 12:15 EDT). Advanced draws stay out (deferred). The order is also the bit order of the untick confirm's mask.
const CALC_KEYS = [...DRAW_KEYS, ...Object.keys(SERIES_ARMORY)];
function metaOf(key) { return DRAW_META[key] || SERIES_ARMORY[key] || null; }
// What one "pull" of a line is: a spin, or for an armory the item it holds.
function unitOf(drawKey) { return SERIES_ARMORY[drawKey] ? `${SERIES_ARMORY[drawKey].noun}s` : 'Spins'; }
// A line picked from this season's draws reads as that draw; any other line as its draw type.
function lineName(b) { return (b && b.title) || shortName(b && b.drawKey); }
// Five lines per page (2026-10-14 00:15 EDT). He asked for six; six measured past Discord's message SIZE cap, not the 40-component one: each line's dropdown carries 11-13 labelled options, and seven different draws at six per page came to ~13,800 characters against a cap measured between 13,100 and 13,412 on the dev bot. Five fits every draw mix under SETUP_JSON_BUDGET; buildSetupPanel still drops further when the saved list needs the room.
const SETUP_LINES_PER_PAGE = 5;
// The setup form's own budget (container included): 40, minus the Show Everyone row (2) and the form's bottom nav row (1 + 2 buttons: Draw Prices · Help; Saved and New Calculation sit in the form's own Calculate row since 2026-10-14 16:51 EDT). Was 33 with four nav buttons, 2026-10-14 13:13 EDT). buildSetupPanel drops lines per page until it fits. 37 since 2026-10-14 18:34 EDT: the Show Everyone row (2) is gone from this command.
const SETUP_CONTAINER_BUDGET = 37;
// Discord ALSO caps a message's size, separately from the 40 components (40005 "Message size exceeds maximum allowed"). Measured 2026-10-14 00:12 EDT on the dev bot: a form serialising to 13,687 characters of JSON posted, one at 16,634 was refused (six lines plus 25 saved calculations). 12,000 leaves margin; buildSetupPanel drops lines per page until both budgets hold.
const SETUP_JSON_BUDGET = 12000;
// One calculation holds at most this many lines; the add picker disables itself at the cap and the handler stops there too.
const MAX_LINES = 25;
// How many calculations one player can keep (2026-10-14 13:13 EDT, his intake asked what the limit is and what happens at it). 25 is one dropdown's worth, so the Saved page can always list every one; at the cap Save refuses with a notice and never evicts one he named.
const MAX_SAVED = 25;

function countComponents(node) {
    if (Array.isArray(node)) return node.reduce((n, x) => n + countComponents(x), 0);
    if (!node || typeof node !== 'object') return 0;
    return 1 + countComponents(node.components || []) + (node.accessory ? countComponents(node.accessory) : 0);
}


function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
function regionLabel(region) { return `${(region || 'region_10').split('_')[1]} CP`; }
function plural(n, word) { return `${n} ${word}${n === 1 ? '' : 's'}`; }

// 🔴 NEVER write `DRAW_META[b.drawKey].name` for a drawKey that came out of a STORED calculation. DRAW_KEYS is derived from DRAW_META, so anything rendered from a select is safe by construction -- but a saved calculation holds whatever key it held on the day it was saved, and draws rotate. The day a key is retired from DRAW_META, every stored calculation containing it would throw on render, and the owner could not even open the panel to delete the entry. Degrade to the raw key instead: it is ugly, it is honest, and it leaves the row deletable. (Found 2026-08-27 by a test fixture using a key that does not exist -- the fixture was wrong, the crash it exposed was not.)
function drawName(drawKey) { return metaOf(drawKey)?.name || `Unrecognized draw (${drawKey})`; }

// SHORT NAMES for the calculator's own pickers (2026-10-13 12:40 EDT, Harkirat's click-test). Discord cuts a chosen option's chip after roughly 24 characters, and the full names put the only distinguishing word LAST -- "Legendary Weapon Draw (R" was all that showed, which cannot tell Reactive from Non-Reactive. These lead with what separates one draw from another and stay under the cut. The full name still appears in every text list and option description. Calculator-only: /draw prices keeps DRAW_META's names. ONE NAME PER DRAW, used everywhere in the calculator (2026-10-13 23:01 EDT, Harkirat's intake: "Reactive Legendary -> reword to \"Legendary Weapon (Reactive)\"; similarly for non-reactive ... and so on"). The panel used to call one draw two things (this short name in the dropdowns, DRAW_META's full "... Draw" name in the lists), and the descriptions repeated the full name after the short one. A description never repeats the name now.
const SHORT_NAME = {
    mythicWeapon: 'Mythic Weapon',
    mythicCharacter: 'Mythic Character',
    legendaryGunReactive: 'Legendary Weapon (Reactive)',
    legendaryGunNonReactive: 'Legendary Weapon (Non-Reactive)',
    doubleLegendaryWeapons: 'Double Legendary Weapons',
    legendaryCharacterWeapon: 'Legendary Character',
    sevenSpinLegendaryWeapon: '7 Spins Legendary Weapon',
    pickYourRewardCard: 'Pick Your Reward Card',
    doubleEpicCharacters: 'Double Epic Characters',
    armoryMythicWeapon: 'Mythic Weapon Armory',
    armoryLegendaryWeapon: 'Legendary Weapon Armory',
    armoryLegendaryCharacter: 'Legendary Character Armory'
};
function shortName(drawKey) { return SHORT_NAME[drawKey] || drawName(drawKey); }

const DRAW_DATA = require('./drawprices').DRAW_DATA;
function entryFor(region, drawKey) { return (DRAW_DATA[region] && DRAW_DATA[region][drawKey]) || null; }
function regionsWithData(drawKey) { return REGION_ORDER.filter(r => entryFor(r, drawKey)); }

// Pure input/selection helpers the handler uses. They live here, not in handlers/drawCalc.js, because a handler module exports exactly ONE function (scripts/handlerRouting.test.js) and both need direct tests (2026-10-13 12:42 EDT).
function parseAmount(raw) {
    if (!raw) return 0;
    const cleaned = String(raw).trim().toLowerCase().replace(/[, ]/g, '');
    // Strip a trailing "cp" (2026-10-13 10:37 EDT): every figure on the panel reads like `26,630 CP`, so `3000 CP` is the input the panel itself teaches, and it used to be rejected as invalid.
    const unit = cleaned.endsWith('cp') ? cleaned.slice(0, -2) : cleaned;
    if (unit === '') return 0;
    const k = unit.endsWith('k');
    const n = Number(k ? unit.slice(0, -1) : unit);
    if (!Number.isFinite(n) || n < 0) return null;
    // Whole CP only (2026-10-17 12:01 EDT, Harkirat: "CP are allowed of any whole number value ... no decimal values"). It used to floor 3.5 to 3 without a word. `3.5k` is still 3,500; the rounding absorbs float error (3.7 × 1000 is 3700.0000000000005).
    const v = k ? n * 1000 : n;
    const r = Math.round(v);
    return Math.abs(v - r) > 1e-6 ? null : r;
}
// Mythic Cards and Coins in the Balance pop-up (2026-10-17 12:01 EDT, Harkirat: "only allowed as steps of 5 ... Only 0 or multiples of 5s, 10s"). Every tier cost in the game is a multiple of 5, so this never refuses a real count. Blank is 0, like CP. The balance pop-up's three fields, read together. A field that is fine is saved even when another is refused (2026-10-17 19:04 EDT, Harkirat: "yeah go ahead. and lets keep the warning in the seperate message (ephemeral)"), so nobody retypes the ones that were right; the warning names each refused field and how to fix it. A field the pop-up did not carry is null and changes nothing.
function readBalanceFields({ amount = null, cards = null, coins = null }) {
    const fields = {}, saved = [], refused = [];
    const take = (raw, label, parse, key, hint) => {
        if (raw === null) return;
        const v = parse(raw);
        if (v === null) refused.push(`**${label}** \`${String(raw).trim().slice(0, 20)}\` wasn't saved: ${hint}`);
        else { fields[key] = v; saved.push(label); }
    };
    take(amount, 'CP', parseAmount, 'balance', 'use a whole number, like `3000` or `3k`.');
    take(cards, 'Mythic Cards', parseCount, 'mythicCards', 'use 0 or a multiple of 5, like `300`.');
    take(coins, 'Mythic Coins', parseCount, 'mythicCoins', 'use 0 or a multiple of 5, like `300`.');
    const lead = saved.length ? `Saved ${saved.join(' and ')}.` : 'Nothing was saved.';
    const warning = refused.length ? `⚠️ ${lead}\n${refused.map(r => `- ${r}`).join('\n')}\nPress **Set Balance** to fix ${refused.length === 1 ? 'it' : 'them'}.` : null;
    return { fields, warning };
}
function parseCount(raw) {
    if (raw === null || raw === undefined) return 0;
    // "250 cards", "250 mythic card", "2 k" (2026-10-17 19:04 EDT, Harkirat: "what about `3 k`? or `250 card` or `250 mythic card`").
    const cleaned = String(raw).trim().toLowerCase().replace(/[, ]/g, '').replace(/(mythic)?(cards?|coins?)$/, '');
    if (cleaned === '') return 0;
    const k = cleaned.endsWith('k');
    const n = Number(k ? cleaned.slice(0, -1) : cleaned);
    if (!Number.isFinite(n) || n < 0) return null;
    const v = k ? n * 1000 : n;
    const r = Math.round(v);
    if (Math.abs(v - r) > 1e-6 || r % 5 !== 0) return null;
    return r;
}

// The picker's FULL selection is the set of draws to keep: lines of an unticked draw go, a newly ticked draw gets one fresh line at 0 pulls, every other line keeps its place and progress. A new line: 0 done, and for an armory the default size until the line's dropdown says otherwise.
function freshLine(drawKey) { return isArmoryKey(drawKey) ? { drawKey, pullsDone: 0, size: ARMORY_DEFAULT_SIZE } : { drawKey, pullsDone: 0 }; }
function applySelection(banners, selected) {
    const present = new Set(banners.map(b => b.drawKey));
    const kept = banners.filter(b => selected.has(b.drawKey));
    for (const key of selected) if (!present.has(key)) kept.push(freshLine(key));
    return kept;
}

// The slash-command shortcut (2026-10-13 12:47 EDT, Harkirat: "yeah wire them"). `draw`, `pulls` and `balance` sat on /draw calculator doing nothing once the setup form arrived. Now `draw` opens a NEW calculation straight on its result -- one line at `pulls`, the player's `balance` -- skipping the form and Calculate. `balance` alone lands on whichever calculation opens. `pulls` is clamped to the draw's real pull count, since two draws have 7 pulls and the option allows 10 (Discord's min/max is one range for every draw). Pure, so it is tested without Discord or Mongo.
function slashShortcut({ draw = null, pulls = null, balance = null, region = 'region_10' }) {
    const notes = [];
    if (pulls !== null && !draw) notes.push('`pulls` needs a `draw` to count against, so it was left out.');
    if (!draw || !DRAW_META[draw]) return { create: null, balance, notice: notes.join(' ') || null };
    const total = pullCount(region, draw);
    let pullsDone = Math.max(0, pulls ?? 0);
    if (total !== null && pullsDone > total) {
        notes.push(`${shortName(draw)} has ${total} Attempts, so ${pullsDone} was set to ${total}.`);
        pullsDone = total;
    }
    return {
        create: { banners: [{ drawKey: draw, pullsDone }], region, balance: balance ?? 0, submitted: true },
        balance: null,
        notice: notes.join(' ') || null
    };
}

// Sets how many lines of one draw a calculation has. New copies start at 0 pulls and sit right after that draw's last line, so a draw's copies stay together; lowering the count removes copies with no pulls first, newest first, and only then copies with pulls. `removed` lets the caller ask before throwing away entered pulls.
function setTypeCount(banners, drawKey, count) {
    const list = [...(banners || [])];
    const idx = list.map((b, i) => (b.drawKey === drawKey ? i : -1)).filter(i => i !== -1);
    if (count > idx.length) {
        const at = idx.length ? idx[idx.length - 1] + 1 : list.length;
        list.splice(at, 0, ...Array.from({ length: count - idx.length }, () => freshLine(drawKey)));
        return { banners: list, removed: [] };
    }
    const order = [...idx].reverse().sort((a, b) => (list[a].pullsDone > 0) - (list[b].pullsDone > 0));
    const drop = new Set(order.slice(0, idx.length - count));
    return { banners: list.filter((_, i) => !drop.has(i)), removed: list.filter((_, i) => drop.has(i)) };
}
function copies(n) { return n === 1 ? '1 copy' : `${n} copies`; }
// Style A's one dropdown lists every picked draw × 1..max, kept within Discord's 25 options.
function maxCountFor(typeCount) { return Math.max(1, Math.min(4, Math.floor(25 / Math.max(1, typeCount)))); }

function upgradeCardEmoji(drawKey) {
    if (upgradeKeyOf(drawKey) === 'mythicWeapon') return emojis.mythicCard;
    if (upgradeKeyOf(drawKey) === 'mythicCharacter') return emojis.mythicCoin;
    return null;
}

// ==========================================
// MYTHIC UPGRADES BY TIER (2026-10-17 13:12 EDT, Harkirat: "Yeah you can build it")
// ==========================================
// The math lives in utils/drawCost.js (upgradePlan); these turn it into words and controls. Cards and coins held are a SHARED pool each, so the CP for upgrades is worked out once per currency, never per line.
function heldOf(basket) { return { mythicCards: basket?.mythicCards || 0, mythicCoins: basket?.mythicCoins || 0 }; }
function costOf(basket) { return basketCost(basket.region, basket.banners, basket.includeUpgrades, heldOf(basket)); }
// "Level 5"; "7/9 Tiers + Final Form".
function upgradeStateText(drawKey, arr) {
    const u = MYTHIC_UPGRADE[upgradeKeyOf(drawKey)];
    if (u.levels) return `Level ${arr[0]}`;
    const P = u.paths.length;
    const tiers = arr.slice(0, P).reduce((a, b) => a + b, 0);
    return `${tiers}/${P * u.tiers.length} Tiers${arr[P] ? ` + ${u.finalForm.name}` : ''}`;
}
function upgradeIsSet(line) { return Boolean(line) && line.want.some((w, i) => w > line.have[i]); }
// "Level 2 → Level 5", or just "Level 5" from nothing.
function upgradeTransition(line) {
    const from = line.have.some(Boolean) ? `${upgradeStateText(line.drawKey, line.have)} → ` : '';
    return `${from}${upgradeStateText(line.drawKey, line.want)}`;
}
function upgradeTargetText(line) {
    if (!upgradeIsSet(line)) return line.have.some(Boolean) ? `${upgradeStateText(line.drawKey, line.have)} · Nothing to Add` : 'No Upgrade Set';
    return `${upgradeTransition(line)} · ${fmt(line.need)} ${MYTHIC_UPGRADE[upgradeKeyOf(line.drawKey)].currency}`;
}
// One Mythic line: a button that opens its pop-up. Two or more: a dropdown of the Mythic lines, each option opening that line's pop-up (2026-10-17 12:33 EDT, his "a modal to submit the 'Character Upgrade' selections"). A dropdown needs a row of its own, so it comes back as `row`.
function upgradeControls(state, basket, extra = {}) {
    const lines = basket?.banners?.length ? upgradePlan(basket).lines : [];
    if (!lines.length) return { button: null, row: null };
    const icon = key => (upgradeCardEmoji(key) ? { emoji: emojis.parseEmoji(upgradeCardEmoji(key)) } : {});
    if (lines.length === 1) {
        const l = lines[0];
        const set = upgradeIsSet(l);
        return { button: { type: 2, style: set ? 3 : 2, label: `Upgrade: ${set ? upgradeStateText(l.drawKey, l.want) : 'None'}`.slice(0, 80), custom_id: encodeState('upgset', { ...state, focus: l.index }), ...icon(l.drawKey), ...extra }, row: null };
    }
    return { button: null, row: { type: 1, components: [{
        type: 3, custom_id: encodeState('upgpick', state), placeholder: 'Set an upgrade for a Mythic draw...', ...(extra.disabled ? { disabled: true } : {}),
        options: lines.slice(0, 25).map(l => ({ label: `#${l.index + 1} ${shortName(l.drawKey)}`, value: String(l.index), description: upgradeTargetText(l).slice(0, 100), ...icon(l.drawKey) }))
    }] } };
}
function balanceLabel(basket) {
    const parts = [];
    if (basket?.balance) parts.push(`${fmt(basket.balance)} CP`);
    if (basket?.mythicCards) parts.push(`${fmt(basket.mythicCards)} Cards`);
    if (basket?.mythicCoins) parts.push(`${fmt(basket.mythicCoins)} Coins`);
    return parts.length ? `Balance: ${parts.join(' · ')}`.slice(0, 80) : 'Set Balance';
}

// THE UPGRADE POP-UP, as raw modal JSON so it is tested without Discord. Discord allows dropdowns in a pop-up inside a Label (type 18), five at most, so a character's Quick Pick, three Tech paths and Final Form fill it exactly. "Already" fields appear only once the draw is finished: upgrades unlock after the last spin, so before that there is nothing to have (2026-10-17 12:12 EDT, his "the question is kind of conditional on the fact if the user has completed 10/10 spins").
function sumTierCost(tiers, from, to) { let n = 0; for (let t = from; t < to; t++) n += tiers[t]; return n; }
function buildUpgradeModal(state, basket, index) {
    const b = basket?.banners?.[index];
    const u = b && MYTHIC_UPGRADE[upgradeKeyOf(b.drawKey)];
    if (!u) return null;
    const total = pullCount(basket.region, b.drawKey, b);
    // An armory's collected weapons can already be upgraded, so "Already At" shows once one is collected; a draw's only once it is finished.
    const armory = isArmoryKey(b.drawKey);
    const complete = armory ? (b.pullsDone || 0) > 0 : total !== null && b.pullsDone >= total;
    const st = upgradeState(b, { complete, includeUpgrades: basket.includeUpgrades });
    const label = (text, description, component) => ({ type: 18, label: text, ...(description ? { description } : {}), component });
    // Optional, every one (2026-10-18 13:05 EDT, his ask): a dropdown left alone keeps what it shows.
    const select = (id, options) => ({ type: 3, custom_id: id, required: false, options: options.map(o => ({ label: o.label, value: o.value, ...(o.description ? { description: o.description } : {}), ...(o.default ? { default: true } : {}) })) });
    const components = [];
    if (u.levels) {
        const at = [0, ...u.levels];
        if (complete) {
            components.push(label('Already At', armory ? 'The level your collected weapons are at now' : 'The level this weapon is upgraded to now', select('have', at.map((n, lv) => ({
                label: lv ? `Level ${lv}${lv === u.levels.length ? ' (Max)' : ''}` : 'Level 0 · Not Upgraded', value: String(lv),
                description: lv ? `${fmt(n)} Cards Used` : null, default: st.have[0] === lv
            })))));
        }
        components.push(label('Upgrade to Level', armory ? `Every weapon in the armory (${armorySize(b)})` : complete ? 'Cards still needed count from Already At' : 'Upgrades unlock once this draw is finished', select('want', [
            { label: 'No Upgrade', value: '0', default: st.want[0] === st.have[0] },
            ...u.levels.map((n, i) => ({ label: `Level ${i + 1}${i + 1 === u.levels.length ? ' (Max)' : ''}`, value: String(i + 1), description: `${fmt(n)} Cards in Total`, default: st.want[0] === i + 1 && st.want[0] !== st.have[0] }))
        ])));
    } else {
        const P = u.paths.length, T = u.tiers.length;
        const pathFull = sumTierCost(u.tiers, 0, T);
        const cheapest = characterPreset(u.paths.map(() => 0).concat(0), 'ff');
        const cheapestCoins = cheapest.slice(0, P).reduce((n, t) => n + sumTierCost(u.tiers, 0, t), 0) + u.finalForm.cost;
        components.push(label('Quick Pick', 'Quick Pick ignores the other toggles below', select('quick', [
            { label: 'Use My Choices Below', value: 'keep', default: true },
            { label: 'No Upgrade', value: 'none' },
            { label: 'One Full Path', value: 'path', description: complete ? 'Finishes the path closest to done' : `${fmt(pathFull)} Coins` },
            { label: 'Two Full Paths', value: 'path2', description: complete ? 'Finishes the two paths closest to done' : `${fmt(2 * pathFull)} Coins` },
            { label: `Cheapest ${u.finalForm.name}`, value: 'ff', description: complete ? 'From the tiers you already have' : `${fmt(cheapestCoins)} Coins · ${u.finalForm.minTiers} of ${P * T} Tiers + ${u.finalForm.name}` },
            { label: 'Everything', value: 'all', description: complete ? `Every tier and ${u.finalForm.name}` : `${fmt(upgradeFullAmount(b.drawKey))} Coins` }
        ])));
        u.paths.forEach((name, p) => {
            const options = [];
            if (complete) {
                for (let h = 0; h <= T; h++) for (let w = h; w <= T; w++) options.push({ label: h === w ? `At Tier ${h} · Keep` : `At Tier ${h} → Tier ${w}`, value: `${h}${w}`, description: h === w ? null : `${fmt(sumTierCost(u.tiers, h, w))} Coins`, default: st.have[p] === h && st.want[p] === w });
            } else {
                for (let w = 0; w <= T; w++) options.push({ label: w ? `Tier ${w}` : 'Tier 0 · Skip', value: `0${w}`, description: w ? `${fmt(sumTierCost(u.tiers, 0, w))} Coins` : null, default: st.want[p] === w });
            }
            components.push(label(name, null, select(`p${p}`, options)));
        });
        const ffHave = st.have[P] === 1, ffWant = st.want[P] === 1;
        components.push(label(u.finalForm.name, `Needs ${u.finalForm.minTiers} of ${P * T} tiers`, select('ff', [
            { label: complete ? "Don't Have It · Skip" : 'Skip', value: '00', default: !ffWant },
            { label: 'Add It', value: '01', description: `${fmt(u.finalForm.cost)} Coins`, default: ffWant && !ffHave },
            ...(complete ? [{ label: 'Already Have It', value: '11', default: ffHave }] : [])
        ])));
    }
    return { custom_id: encodeState(u.levels ? 'upgsavew' : 'upgsavec', { ...state, focus: index }), title: `#${index + 1} ${lineName(b)} Upgrade`.slice(0, 45), components };
}
// Reads the pop-up back. `get(id)` returns the picked value or null. Pure, so it is tested without Discord. Final Form asked for below 7 of 9 tiers is left off and said so (his "Final upgrade can only be purchased if a minimum of 7 of the 9 sub-tiers are purchased").
function readUpgradeModal(drawKey, complete, get) {
    const u = MYTHIC_UPGRADE[upgradeKeyOf(drawKey)];
    if (!u) return null;
    const int = v => Math.max(0, Math.floor(Number(v) || 0));
    if (u.levels) {
        const have = [complete ? Math.min(u.levels.length, int(get('have'))) : 0];
        const asked = Math.min(u.levels.length, int(get('want')));
        const notice = asked && asked <= have[0] ? `Already at Level ${have[0]}, so there is nothing to add.` : null;
        return { have, want: [Math.max(asked, have[0])], notice };
    }
    const P = u.paths.length, T = u.tiers.length;
    const pair = id => { const v = String(get(id) || '00'); return [Math.min(T, int(v[0])), Math.min(T, int(v[1]))]; };
    const have = [], want = [];
    for (let p = 0; p < P; p++) { const [h, w] = pair(`p${p}`); have.push(complete ? h : 0); want.push(Math.max(w, complete ? h : 0)); }
    const [fh, fw] = pair('ff');
    have.push(complete && fh ? 1 : 0);
    want.push(fw || have[P] ? 1 : 0);
    const quick = get('quick');
    const final = quick && quick !== 'keep' ? characterPreset(have, quick) : want;
    let notice = null;
    const tiers = final.slice(0, P).reduce((a, b) => a + b, 0);
    if (final[P] && !have[P] && tiers < u.finalForm.minTiers) { final[P] = 0; notice = `${u.finalForm.name} needs ${u.finalForm.minTiers} of ${P * T} tiers, so it was left off.`; }
    return { have, want: final, notice };
}

// ==========================================
// STATE CODEC -- view state only, see the file header for why the basket itself is never here.
// ==========================================
function defaultState() {
    return { verb: 'landing', basketId: null, page: 0, detail: false, focus: null, authorId: null };
}

// A raw 19-digit snowflake in decimal is longer than it needs to be in a budget this roomy now that the basket itself doesn't ride here -- kept base-36 anyway (spec §5) for consistency with every other id this project encodes into a customId. BigInt throughout: a snowflake exceeds Number.MAX_SAFE_INTEGER, so this cannot go through parseInt/Number without silent precision loss.
function toBase36Id(discordId) {
    let n = BigInt(discordId);
    if (n === 0n) return '0';
    const digits = '0123456789abcdefghijklmnopqrstuvwxyz';
    let out = '';
    while (n > 0n) { out = digits[Number(n % 36n)] + out; n /= 36n; }
    return out;
}

function fromBase36Id(str) {
    let n = 0n;
    for (const ch of String(str).toLowerCase()) {
        const d = parseInt(ch, 36);
        if (Number.isNaN(d)) return null; // malformed/stale segment -- decode to "no author", never throw
        n = n * 36n + BigInt(d);
    }
    return n.toString();
}

// `r` is an OPTIONAL trailing field, emitted only by regionRow -- every other control leaves it off entirely rather than paying bytes for a field almost no click needs. It carries the TARGET region for a 'region' verb click; it is never the basket's own persisted region (that lives on the basket document, read fresh at render time, same as everything else in §5). `p` (the within-BASKET-page banner-list page, distinct from `g`'s COST/BASKET page selector) and `r` (a region-switch's TARGET region) are both OPTIONAL trailing fields -- most controls need neither, so most customIds don't pay their bytes.
function encodeState(verb, s) {
    const fields = [
        'calc', verb,
        s.basketId || '',
        `g${s.page || 0}`,
        `x${s.detail ? 1 : 0}`,
        `f${(s.focus === null || s.focus === undefined) ? '' : s.focus}`,
        `a${s.authorId ? toBase36Id(s.authorId) : ''}`
    ];
    if (s.bpage) fields.push(`p${s.bpage}`);
    if (s.targetRegion) fields.push(`r${s.targetRegion.replace('region_', '')}`);
    // `m` carries a pending draw selection while the player confirms removing lines that have progress -- a bitmask over DRAW_KEYS, base 36. Only the two confirm buttons ever carry it.
    if (s.mask) fields.push(`m${s.mask.toString(36)}`);
    // `k` carries a checksum of the saved list while the player confirms deleting some of it (savedChecksum): `m` is then a mask over that list's positions, and the checksum refuses the delete if the list changed in between, rather than deleting whatever now sits at those positions.
    if (s.check) fields.push(`k${s.check}`);
    // `t` names the saved calculation an overwrite will replace (2026-10-14 17:26 EDT); only the Save view's confirm carries it.
    if (s.target) fields.push(`t${s.target}`);
    return fields.join('~');
}

function decodeState(customId) {
    const parts = customId.split('~');
    const get = (prefix, fallback) => {
        const hit = parts.slice(3).find(p => p.startsWith(prefix));
        return hit === undefined ? fallback : hit.slice(prefix.length);
    };
    const focusRaw = get('f', '');
    const authorB36 = get('a', '');
    const regionDigits = get('r', '');
    const maskRaw = get('m', '');
    const checkRaw = get('k', '');
    const targetRaw = get('t', '');
    return {
        verb: parts[1] || 'landing',
        basketId: parts[2] || null,
        page: Number(get('g', 0)) || 0,
        detail: get('x', '0') === '1',
        focus: focusRaw === '' ? null : (Number(focusRaw) || 0),
        authorId: authorB36 ? fromBase36Id(authorB36) : null,
        bpage: Number(get('p', 0)) || 0,
        targetRegion: regionDigits ? `region_${regionDigits}` : null,
        mask: maskRaw ? (parseInt(maskRaw, 36) || 0) : 0,
        check: checkRaw || null,
        target: targetRaw || null
    };
}

// Clamps a reorder-focus pointer to a real index whenever the banner list underneath it shrank (a delete, or switching baskets) -- the same "never leave an impossible value behind" role clampStateToDraw played in the old single-draw codec.
function clampFocus(focus, bannerCount) {
    if (focus === null || bannerCount === 0) return null;
    return Math.max(0, Math.min(focus, bannerCount - 1));
}

// ==========================================
// CALENDAR DETECTION -- unchanged from the single-draw panel; entitlements are basket-wide now, not per-draw, so this still applies exactly as before.
// ==========================================
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
// BASKET HELPERS
// ==========================================
// The distinct draw TYPES currently represented in the basket, in first-seen order -- backs both the COST page's multi-select (which types are "in") and Page 2's "+ Add another" select (which types can be duplicated as a fresh banner).
function usedTypes(banners) {
    const seen = [];
    for (const b of banners || []) if (!seen.includes(b.drawKey)) seen.push(b.drawKey);
    return seen;
}

// Display compression for the COST page's basket listing ONLY (spec §1: "Page 1 may render three consecutive identical-progress banners as ×3 for readability. Page 2 always shows them individually, because that is where they are edited."). State stays flat either way -- this touches nothing but the rendered string.
function groupForDisplay(banners) {
    const groups = [];
    // Lines with different upgrade plans never merge (2026-10-17 13:17 EDT); `first` is the index of the group's first line.
    const upKey = b => JSON.stringify([b.upHave || null, b.upWant || null, b.title || null, b.size || null, b.spinsIn || 0]);
    (banners || []).forEach((b, i) => {
        const last = groups[groups.length - 1];
        if (last && last.drawKey === b.drawKey && last.pullsDone === b.pullsDone && last.upKey === upKey(b)) last.count++;
        else groups.push({ drawKey: b.drawKey, pullsDone: b.pullsDone, count: 1, first: i, upKey: upKey(b), line: b });
    });
    return groups;
}

// ==========================================
// SELECT / BUTTON ROWS
// ==========================================
// COST page's multi-select -- "which draw TYPES are in this basket". Selecting a type not currently present appends ONE fresh banner (0 pulls, no inherited defaults -- spec §2, decision 11: "calculators don't assume or constrain answers"). Deselecting a present type removes EVERY banner of that type -- a duplicate of a type is added back one at a time via "+ Add another" on Page 2, which this control cannot express (a multi-select's state is a set, not a multiset).
function typesSelectRow(state, basket) {
    const present = new Set(usedTypes(basket.banners));
    return {
        type: 1,
        components: [{
            // An instruction, not a question (his intake): the form reads as steps to follow.
            type: 3, custom_id: encodeState('draws', state), placeholder: 'Select draw types to calculate',
            min_values: 0, max_values: CALC_KEYS.length,
            options: CALC_KEYS.map(key => {
                return {
                    label: shortName(key),
                    value: key,
                    description: freshDrawDescription(basket.region, key),
                    emoji: emojis.parseEmoji(emojis[metaOf(key).tier]),
                    default: present.has(key)
                };
            })
        }]
    };
}

// Page 2's per-banner pulls-done dropdown. 🔴 The placeholder is REPLACED by the chosen option once picked, so without a banner number in every option a set dropdown stops saying which banner it belongs to (spec §2, found live) -- every option and the placeholder both carry `#N`. `f` here carries WHICH banner index this specific select edits, not the reorder pointer -- a per-control target, scoped to this one customId, distinct from the reorder focus stored across renders. `removable` ends the dropdown with the line's own Remove option.
function bannerPullsRow(state, basket, index, { removable = false } = {}) {
    const banner = basket.banners[index];
    const total = pullCount(basket.region, banner.drawKey, banner);
    const meta = metaOf(banner.drawKey) || { name: drawName(banner.drawKey), tier: null };
    const rowState = { ...state, focus: index };
    const unit = unitOf(banner.drawKey);
    if (total === null) {
        return { type: 1, components: [{
            type: 3, custom_id: encodeState('bpulls', rowState), placeholder: `#${index + 1} ${lineName(banner)} · no data at this region`,
            options: [{ label: 'No data at this region', value: '0', default: true }], disabled: true
        }] };
    }
    const options = [];
    const icon = meta.tier ? emojis.parseEmoji(emojis[meta.tier]) : undefined;
    // The action FIRST (2026-10-13 23:01 EDT, his intake), then the progress values. His own Cross emoji (2026-10-14 16:51 EDT).
    if (removable) {
        options.push({ label: 'Remove this Selection', value: 'del', emoji: emojis.parseEmoji(emojis.cross), description: banner.pullsDone ? `Drops It and Its ${banner.pullsDone}/${total} ${unit}` : 'Takes It Out of This Calculation' });
    }
    // An armory line that did not come from a season draw also picks its SIZE (2026-10-18 12:15 EDT): one pick sets both, "2/5 Weapons", across the sizes he has seen (3–6 items, 22 values). A season draw's size is its own item count, so its line lists only that size.
    const sizes = isArmoryKey(banner.drawKey) && !banner.title ? ARMORY_SIZES : [isArmoryKey(banner.drawKey) ? armorySize(banner) : total];
    for (const size of sizes) {
        for (let n = 0; n <= size && options.length < 25; n++) {
            const chosen = n === banner.pullsDone && (sizes.length === 1 || size === armorySize(banner));
            // Spins toward the next item count only on the chosen value; the others price a fresh armory of that size.
            const line = isArmoryKey(banner.drawKey) ? { ...banner, size, spinsIn: chosen ? banner.spinsIn : 0 } : banner;
            const left = remainingToFinish(basket.region, banner.drawKey, n, line);
            options.push({
                // The draw's name rides in the LABEL of the chosen value only (2026-10-13 12:40 EDT): a closed select shows only that label. Progress first (2026-10-13 23:10 EDT): a phone shows about 30 characters. "#1 · Progress: 0/10 Spins" (2026-10-18 13:05 EDT, Harkirat: "it doesnt really make sense including the draw name inside the dropdown"): the line's name sits right above it now.
                label: chosen ? `#${index + 1} · Progress: ${n}/${size} ${unit}` : `${n}/${size} ${unit}`,
                value: sizes.length > 1 ? `${size}:${n}` : String(n),
                description: `${fmt(spentSoFar(basket.region, banner.drawKey, n, line))} CP Spent · ${n === size ? 'Finished' : `${fmt(left)} CP to Completion`}`,
                // The tier icon and `default` only on the chosen value: each costs every line characters of Discord's size cap (2026-10-14 00:12 EDT).
                ...(icon && chosen ? { emoji: icon } : {}),
                ...(chosen ? { default: true } : {})
            });
        }
    }
    return { type: 1, components: [{ type: 3, custom_id: encodeState('bpulls', rowState), placeholder: `#${index + 1} ${lineName(banner)}`.slice(0, 150), options }] };
}

// The draw picker once a calculation has lines (Harkirat chose this shape 2026-10-13 19:47 EDT, after trying three on the dev bot). Each draw ticked adds ONE line of it, placed right after that draw's existing lines, so ticking a draw you already have runs another of it; nothing is ever shown ticked, and removing lives in each line's own dropdown. It sits BELOW the lines: the list grows above the control that adds to it, and an empty form shows its first-pick picker in that same spot.
function addDrawsRow(state, basket) {
    const room = MAX_LINES - basket.banners.length;
    return { type: 1, components: [{
        type: 3, custom_id: encodeState('addmore', state),
        placeholder: room > 0 ? 'Add more draws to selection' : `Full: a calculation holds up to ${MAX_LINES} draws`,
        min_values: 1, max_values: Math.max(1, Math.min(CALC_KEYS.length, room)), disabled: room <= 0,
        options: CALC_KEYS.map(key => {
            const have = basket.banners.filter(b => b.drawKey === key).length;
            return {
                label: shortName(key), value: key,
                // The count leads (2026-10-14 16:51 EDT, Harkirat: "1x in your selection"). An option description is plain text in Discord: it cannot be bold.
                description: have ? `${have}× In Your Selection · Pick to Add Another` : freshDrawDescription(basket.region, key),
                emoji: emojis.parseEmoji(emojis[metaOf(key).tier])
            };
        })
    }] };
}
// One description for a draw nobody has started, shared by both pickers: what it holds and what it costs at this region, in Title Case, never its name again.
function freshDrawDescription(region, key) {
    // An armory is priced per item (his /draw prices wording, "Per Weapon").
    if (isArmoryKey(key)) {
        const a = SERIES_ARMORY[key];
        return ARMORY_SPIN_CP[region] ? `${fmt(a.spins * ARMORY_SPIN_CP[region])} CP per ${a.noun} · ${a.spins} Spins Each` : `No Data at ${regionLabel(region)} Yet`;
    }
    const total = pullCount(region, key);
    if (total === null) return `No Data at ${regionLabel(region)} Yet`;
    const upgrade = upgradeCost(region, key);
    // No "·" before the upgrade (2026-10-14 16:51 EDT, Harkirat): the "+" already joins it to the total. "Attempts" took the place of "Items" (2026-10-17 17:20 EDT, Harkirat: "'attempts' basically took the spot of 'items'. spins stays as-is.").
    return `${total} Attempts · ${fmt(remainingToFinish(region, key, 0))} CP Total${upgrade !== null ? ` + ${fmt(upgrade)} CP Upgrade` : ''}`.slice(0, 100);
}
function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

// Pages hold whole draws: a draw's consecutive lines stay on one page (Harkirat, 2026-10-13 19:47 EDT: two of a draw split across two pages read as unrelated). A run longer than a page is the one case that still splits. Returns the line indices on each page.
function linePages(banners, perPage) {
    const pages = [];
    let cur = [];
    for (let i = 0; i < banners.length;) {
        let j = i;
        while (j < banners.length && banners[j].drawKey === banners[i].drawKey) j++;
        const run = [];
        for (let k = i; k < j; k++) run.push(k);
        if (cur.length && cur.length + run.length > perPage) { pages.push(cur); cur = []; }
        while (run.length > perPage) pages.push(run.splice(0, perPage));
        cur.push(...run);
        i = j;
    }
    if (cur.length || !pages.length) pages.push(cur);
    return pages;
}

function pageNavRow(state, totalPages) {
    const current = Math.min(state.bpage || 0, totalPages - 1);
    return {
        type: 1,
        components: [
            { type: 2, style: 2, label: '◀ Prev', custom_id: encodeState('bpage', { ...state, bpage: Math.max(0, current - 1) }), disabled: current === 0 },
            // Its own verb: on the first page Prev targets page 0 and on the last Next targets the current page, so a 'bpage' id here would equal one of theirs and Discord rejects the whole message (COMPONENT_CUSTOM_ID_DUPLICATED, found 2026-10-13 on any form with 5+ lines). Disabled, so no handler reads it.
            { type: 2, style: 2, label: `Page ${current + 1}/${totalPages}`, custom_id: encodeState('bpinfo', state), disabled: true },
            { type: 2, style: 2, label: 'Next ▶', custom_id: encodeState('bpage', { ...state, bpage: Math.min(totalPages - 1, current + 1) }), disabled: current === totalPages - 1 }
        ]
    };
}

function entitlementSelectRow(state, basket) {
    return {
        type: 1,
        components: [{
            type: 3, custom_id: encodeState('ent', state), placeholder: 'Unused 2X entitlements (optional)...',
            min_values: 0, max_values: CP_PACKAGES.length,
            options: CP_PACKAGES.map((p, i) => ({
                label: `${fmt(p.baseCp)} CP bundle`,
                value: p.id,
                description: `Gives ${fmt(p.baseCp * 2)} CP during a 2X event`,
                default: (basket.entitlementMask & (1 << i)) !== 0
            }))
        }]
    };
}

// Region switching (kept from the single-draw panel, verb 'region') -- MUST preserve every banner's progress (spec §9): switching region never touches `basket.banners`, only `basket.region`, so pullsDone rides across unaffected. A banner with no data at the new region still renders (excluded from the total, named on its own row -- buildCostBlock's `unpriced` branch), never silently dropped.
function regionRow(state, basket) {
    return {
        type: 1,
        components: REGION_ORDER.map(key => ({
            type: 2,
            // Green AND disabled for the current region, same as /draw prices (2026-10-14 13:13 EDT, Harkirat: "make it green-disabled"): green says which is active, disabled says there is nothing to press. Green and live (2026-10-14 00:16 EDT) re-rendered the same thing on a click.
            style: key === basket.region ? 3 : 2,
            disabled: key === basket.region,
            custom_id: encodeState('region', { ...state, targetRegion: key }),
            label: regionLabel(key),
            emoji: emojis.parseEmoji(emojis[REGION_EMOJI_KEY[key]])
        }))
    };
}

// The caption above the region buttons (2026-10-13 12:40 EDT). How a player finds their region lives in Help, which names the draws whose first spin IS the region (not every draw's is: Mythic Character and Pick Your Reward Card start higher, measured 2026-10-14 18:33 EDT). No heading and no divider above it (2026-10-14 13:13 EDT, Harkirat: "'Your Region & CP Balance' remove it. Also remove the divider above it"); the hint alone labels the row, and Help keeps what a region is. "### Tweak Calculation" over the hint (2026-10-14 17:58 EDT, Harkirat).
function regionCaption() { return { type: 10, content: '### Tweak Calculation\n-# Set your CP region and current balance.' }; }
// The simplified result's caption, his draft (2026-10-17 17:08 EDT): bold, not a heading, over one line of what the controls do.
const TWEAK_RESULT_CAPTION = { type: 10, content: '**Tweak Calculation**\n-# Adjust the result in real time.' };
// Room between blocks without a rule (his "more breathing room"): a separator with no divider.
const SPACER = { type: 14, spacing: 2, divider: false };
// "Your Selections" once there are two or more draws (2026-10-14 16:51 EDT, Harkirat).
function selectionHeading(banners) { return (banners || []).length >= 2 ? 'Your Selections' : 'Your Selection'; }

// The old "Upgrade: YES / NO" toggle (verb `upg`) gave way to upgradeControls on 2026-10-17 13:17 EDT: a per-line target set in a pop-up. Its verb still answers panels posted before; the includeUpgrades it flips no longer prices anything (2026-10-17 19:16 EDT).

// The confirm a draw untick needs when it would delete progress (2026-10-13 12:40 EDT). Unticking a draw in the picker removes EVERY line of it; with progress on one, that silently threw away pulls the player had entered. `mask` is the selection they asked for, applied only when they confirm. `label` names what goes (a single line's confirm says "Remove #2"); Keep stays on the page it was asked from, so a confirm on the editing view does not drop the player back on the result.
function dropConfirmRow(state, mask, count, verb = 'dropok', label = null) {
    return {
        type: 1,
        components: [
            { type: 2, style: 4, label: label || `Remove ${plural(count, 'line')}`, custom_id: encodeState(verb, { ...state, mask }) },
            // Title Case like every other button (click-test 2026-10-14 18:58 EDT).
            { type: 2, style: 2, label: count === 1 ? 'Keep It' : 'Keep Them', custom_id: encodeState('page', { ...state, mask: 0 }) }
        ]
    };
}

// NO EMOJI on either button (2026-08-27, Harkirat) -- `mngEdit` was a pencil paired with a button labelled "Save", which never matched, and a destructive action reads clearer without decoration. Rename doubles as "Save" for an unnamed basket -- naming it IS the save, since that is the one thing that exempts a basket from the 30-day TTL (models/DrawBasket.js). Delete is two-step, same pattern as Reset below -- one misclick must never destroy a named basket (plan Task 5's own verify requirement). The Upgrade button left this row 2026-10-18 12:15 EDT (Harkirat: "yeah sure"): it lives beside each Mythic line on Set Draw Progress, with every other per-line setting.
function basketManageRows(state, basket) {
    // Balance and Upgrade side by side (2026-10-14 16:51 EDT, Harkirat: "move upgrade button beside the Set balance button"). Save, Rename and Delete moved to the Saved view, where the calculation's own section manages it (2026-10-14 16:51 EDT). With two or more Mythic lines the upgrade control is a dropdown, which takes its own row under it.
    return [{ type: 1, components: [
        { type: 2, style: 2, label: balanceLabel(basket), custom_id: encodeState('modal', state), emoji: emojis.parseEmoji(emojis.cp2) }
    ] }];
}

// 🔴 RETURNED AS A TOP-LEVEL SIBLING of the Container, never pushed inside it (fixed 2026-08-27) -- it was rendering as a child, which boxes the nav inside the panel's accent border instead of sitting under it the way every other command in this bot places its nav. buildCalculatorPanel is the ONE place that attaches it; do not push it into a page builder's `components`. Replaces buildGlobalNavRow entirely (Task 9) -- Draw Info and Help are the calculator's own ephemeral panels, Draw Prices is the one cross-link back to the sibling command, Reset is two-step (Danger style once armed) exactly like Delete Basket above, and clears basket, balance, focus and page (spec §9) without deleting the basket document itself. `showReset` is false on the setup form: there is no computed result to clear yet, and a live button that does nothing visible is worse than an absent one. On a submitted calculation it reads "New Calculation" -- Harkirat's own phrase for the action that ends a result's persistence and returns to the form. Draw Prices · New Calculation · Help (2026-10-13 23:01 EDT, his intake: Draw Info removed, since /draw prices shows the same draws; New Calculation on EVERY page once there is something to clear, where it used to appear only on the result). "View Saved", no counter (2026-10-14 17:58 EDT, Harkirat).
function savedButton(state) {
    return { type: 2, style: 2, label: 'View Saved', custom_id: encodeState('saved', state), emoji: emojis.parseEmoji(emojis.viewSaved) };
}
function newCalculationButton(state) {
    const armed = state.verb === 'resetarm';
    // NewCalc icon (2026-10-16 14:31 EDT).
    return { type: 2, style: armed ? 4 : 2, label: armed ? 'New Calculation — click again' : 'New Calculation', custom_id: encodeState(armed ? 'reset' : 'resetarm', state), emoji: emojis.parseEmoji(emojis.newCalc) };
}
// `inForm`: on the form, Saved and New Calculation sit in its own Calculate row (2026-10-14 16:51 EDT, Harkirat: "move calculate down to its own action row, with a divider above it. Move New calculation and saved into that same row"), so the nav keeps only Draw Prices and Help there. The Saved view's and the Save step's footer (2026-10-16 11:19 EDT, Harkirat: "put the 'back' button inside of the embed as a footer button. reworded to 'Back to Calculation'. With a button beside it for 'New Calculation'", and "use the left arrow we use for pagination").
function savedFooterRow(state) {
    return { type: 1, components: [
        { type: 2, style: 2, label: 'Back to Calculation', custom_id: encodeState('back', state), emoji: emojis.parseEmoji(emojis.left) },
        newCalculationButton(state)
    ] };
}
function bottomNavRow(state, { showReset = true, savedCount = 0, onSaved = false, inForm = false } = {}) {
    // Its own private message (2026-10-13 12:40 EDT) -- it used to be the global nav's `nav_prices`, which turned THIS panel into /draw prices in place.
    const components = [{ type: 2, style: 2, label: 'Draw Prices', custom_id: encodeState('prices', state) }];
    // Saved calculations are their own view of this same message (2026-10-14 13:19 EDT, Harkirat's "surface switch"). On that view the slot reads Back. On the Saved view and the Save step the way back lives INSIDE the panel as a footer row (2026-10-16 11:19 EDT, savedFooterRow), so the nav keeps only Draw Prices and Help there.
    if (!onSaved && !inForm) {
        components.push(savedButton(state));
        if (showReset) components.push(newCalculationButton(state));
    }
    components.push({ type: 2, style: 2, label: 'Help', custom_id: encodeState('help', state) });
    return { type: 1, components };
}

// The setup form's balance row: Set Balance with Upgrade beside it (2026-10-14 16:51 EDT). Both are disabled until a draw exists, because both write to a calculation document that does not exist yet and would otherwise accept input and silently discard it.
function setupBalanceRows(state, basket) {
    const hasBasket = Boolean(basket && basket._id);
    return [{ type: 1, components: [
        { type: 2, style: 2, disabled: !hasBasket, custom_id: encodeState('modal', state), emoji: emojis.parseEmoji(emojis.cp2), label: balanceLabel(basket) }
    ] }];
}
// Order New Calculation · View Saved · Calculate (2026-10-14 17:58 EDT, Harkirat: "move new calc button to the front of the row. saved in middle. calculate last"). The form's last row, under its own divider (2026-10-14 16:51 EDT): Calculate (the ONLY Primary button in this command, with his Sparkles emoji), then New Calculation once there is something to clear, then Saved.
function setupSubmitRow(state, basket, savedCount) {
    const lines = basket?.banners?.length || 0;
    return { type: 1, components: [
        lines ? newCalculationButton(state) : null,
        savedButton(state),
        { type: 2, style: 1, label: 'Calculate', custom_id: encodeState('submit', state), disabled: lines === 0, emoji: emojis.parseEmoji(emojis.calculate) }
    ].filter(Boolean) };
}
// The result ends with the same row, Save Result in Calculate's place with his SaveStar emoji (2026-10-14 17:58 EDT, Harkirat: "leave them in their current row. just replace calculate with Save result"). It opens the Save step: save as new, or save over a saved one.
function resultActionRow(state) {
    return { type: 1, components: [
        newCalculationButton(state),
        savedButton(state),
        // Export (2026-10-14 18:23 EDT, Harkirat: "an export button which outputs the result into a simple copy-able markdown for the user to share"). It answers privately with the result as plain markdown in a code block, so it copies cleanly and renders when pasted anywhere in Discord. The Show Everyone icon (2026-10-14 18:34 EDT, Harkirat), since Export is now how a result is shared.
        { type: 2, style: 2, label: 'Export', custom_id: encodeState('export', state), emoji: emojis.parseEmoji(emojis.copyExport) },
        { type: 2, style: 1, label: 'Save Result', custom_id: encodeState('savepick', state), emoji: emojis.parseEmoji(emojis.saveStar) }
    ] };
}

// THE EXPORT, between the compact result and Full Breakdown (2026-10-14 19:28 EDT, Harkirat: "provide a more detailed breakdown. not the full breakdown but also not the simplified, somewhere inbetween"). Each draw shows its spins, what is left, what is already spent and what finishing costs (the upgrade on its own line when it is on); then CP needed, what the balance leaves, the recommended packs with their prices, and the Stock Up option when there is one. Plain markdown: no custom emoji (they break outside this bot's servers) and no code-span chips, so it reads the same wherever it is pasted.
function buildExportText(basket, currency = 'USD') {
    const { total: needed, perBanner, upgrades } = costOf(basket);
    const shortfall = needed - (basket.balance || 0);
    const clean = t => String(t).replace(/[`*_~|]/g, '');
    const out = [`## Lucky Draw Calculation${basket.name ? `: ${clean(basket.name)}` : ''}`];
    out.push(`-# ${regionLabel(basket.region)} region${upgrades.lines.some(upgradeIsSet) ? ' · Mythic upgrades included' : ''}`);
    out.push('', '**Draws**');
    let spentAll = 0;
    for (const g of groupForDisplay(basket.banners)) {
        const one = perBanner[g.first];
        const total = pullCount(basket.region, g.drawKey, g.line);
        const unit = unitOf(g.drawKey);
        const name = `${lineName(g.line)}${g.count > 1 ? ` ×${g.count}` : ''}`;
        if (!one || !one.priced || total === null) { out.push(`- ${name}: ${g.pullsDone} ${unit} · no price at this region`); continue; }
        const spent = (spentSoFar(basket.region, g.drawKey, g.pullsDone, g.line) || 0) * g.count;
        spentAll += spent;
        const finish = one.cost * g.count;
        const left = total - g.pullsDone;
        const spinsIn = isArmoryKey(g.drawKey) && left && g.line.spinsIn ? ` · ${g.line.spinsIn} spins in` : '';
        out.push(`- **${name}**: ${g.pullsDone}/${total} ${unit}${spinsIn} · ${left ? `${left} left · ${fmt(finish)} CP to finish` : 'finished'}${spent ? ` · ${fmt(spent)} CP spent` : ''}`);
        if (upgradeIsSet(one.upgrade)) out.push(`  - Upgrade: ${upgradeTargetText(one.upgrade).replace(/ (Cards|Coins)$/, m => m.toLowerCase())}${g.count > 1 ? ' each' : ''}`);
    }
    // The pooled upgrade, once per currency (cards and coins are shared across every Mythic line).
    for (const p of upgrades.pools.filter(x => x.need)) {
        out.push(`- **Mythic ${p.currency}:** ${fmt(p.need)} needed${p.held ? ` − ${fmt(p.held)} held` : ''} → ${p.short ? `about ${p.spins} spins${p.cp !== null ? ` · ${fmt(p.cp)} CP` : ' · no upgrade price at this region yet'}` : 'covered'}`);
    }
    // "You Need", the result's own word for this figure (2026-10-17 18:28 EDT).
    out.push('', `**You Need:** ${fmt(needed)} CP${spentAll ? ` (${fmt(spentAll)} CP already spent)` : ''}`);
    if (basket.balance) out.push(shortfall > 0 ? `**Balance:** ${fmt(basket.balance)} CP → **${fmt(shortfall)} CP** to buy` : `**Balance:** ${fmt(basket.balance)} CP covers it, with ${fmt(-shortfall)} CP to spare`);
    if (shortfall > 0) {
        const doubleCpAvailable = CP_PACKAGES.filter((p, i) => (basket.entitlementMask & (1 << i)) !== 0).map(p => p.id);
        const result = optimizePurchase(shortfall, { currency, doubleCpAvailable });
        const packs = r => r.combo.map(c => `${c.count}× ${fmt(c.cpEach)} CP${c.mode === 'double' ? ' (2X)' : ''}`).join(' + ');
        if (result?.cheapest) {
            const r = result.cheapest;
            out.push('', `**Recommended Bundle:** ${formatMoney(r.totalCents, currency)}`);
            for (const c of r.combo) out.push(`- ${c.count}× ${fmt(c.cpEach)} CP${c.mode === 'double' ? ' (2X)' : ''} · ${formatMoney(c.priceCents * c.count, currency)}`);
            out.push(`-# ${fmt(r.totalCp)} CP bought · ${fmt(r.leftoverCp)} CP left over`);
            if (result.stockUp) out.push(`**Stock Up option:** ${formatMoney(result.stockUp.totalCents, currency)} for ${packs(result.stockUp)} (${fmt(result.stockUp.leftoverCp)} CP left over, a better CP rate)`);
            out.push(`-# Prices in ${currency}, estimates only.`);
        }
    }
    return out.join('\n').slice(0, 1800);
}

// ==========================================
// COST BREAKDOWN -- basket-wide, always priced to FINISH every banner (budget mode and per-banner goals other than Finish are out of scope, spec §10 -- there is no goal select any more).
// ==========================================
// THE SIMPLIFIED VIEW'S COST AND PURCHASE, Harkirat's draft (2026-10-17 17:08 EDT, "here's my preliminary draft for the simplified view ... fix it/polish it up. add in the mythic upgrade stuff i missed"). CP Still Needed leads, quoted; then the sum that reaches it, one term per line with its sign; then the purchase that covers it, with each bundle on its own glowing-dot line. Returns the cost lines, the purchase lines, and whether there is anything to buy. The Full Breakdown has its own layout (breakdownCostLines).
function buildCostBlock(state, basket, currency, client, { detail = false, level = 0, memo = null } = {}) {
    const { total: needed, drawTotal, perBanner, upgrades } = costOf(basket);
    const unpriced = perBanner.filter(b => !b.priced);
    const balance = basket.balance || 0;
    const spent = (basket.banners || []).reduce((n, b) => n + (spentSoFar(basket.region, b.drawKey, b.pullsDone, b) || 0), 0);
    const shortfall = needed - balance;
    // THE FULL BREAKDOWN IS THE SAME LAYOUT WITH ITS WORKING SHOWN (2026-10-17 17:30 EDT, Harkirat: "use the simplified version as a reference point ... so they actually flow better as 2 matching sets instead of 2 completely different designs and structures"). It adds what each sum is made of, a `-#` line of terms under Full Cost and Spent Already, and in the purchase the Stock Up option and the estimates note. At many lines the terms group identical lines ("2 × `4,950 CP`"), then collapse to "across N lines".
    const priced = lineFigures(basket).filter(f => f.priced);
    const rows = breakdownRows(priced, level >= 4 ? 4 : level >= 1 ? 1 : 0);
    const terms = key => (level >= 3 ? `across ${plural(priced.length, 'line')}` : rows.map(r => `\`${r.count > 1 && !r.byType ? `${r.count} × ` : ''}${fmt(r[key])} CP\``).join(' **+** ') || '`0 CP`');
    // HIS LAYOUT FOR BOTH VIEWS (2026-10-17 18:28 EDT; the tree he tried first was dropped because "-# lines break the emoji tree illusion"). The simplified view: You Need in bold, then one quiet line naming the sum's terms. The Full Breakdown: the same headline, then the sum quoted, one term per line with its sign and a `-#` line of what it is made of. Colons for a label and its value, ⌇ for a thing and what it costs, the grammar /draw prices already uses.
    const quiet = key => (detail ? [`> -# ${terms(key)}`] : []);
    const cost = ['## Cost Breakdown', `**You Need: \`${fmt(Math.max(shortfall, 0))} CP\`**`];
    if (!detail) {
        // Plain words, not code spans (2026-10-17 18:41 EDT, Harkirat on his phone: "Yeah it does wrap ... -# plain text?"): spans are wider and wrapped the line on a phone.
        cost.push(`-# Cost of Draws${upgrades.cp ? ' **+** Mythic Upgrades' : ''} **−** Spent Already **−** CP Balance`);
    } else {
        cost.push(`> Full Cost of Draws: \`${fmt(drawTotal + spent)} CP\``, ...quiet('full'));
        if (upgrades.cp) {
            cost.push(`> **+** Mythic Upgrades: \`${fmt(upgrades.cp)} CP\``);
            for (const p of upgrades.pools.filter(x => x.need)) {
                const icon = p.drawKey === 'mythicWeapon' ? emojis.mythicCard : emojis.mythicCoin;
                cost.push(`> -# ${icon} \`${fmt(p.need)}\` ${p.currency}${p.held ? ` − \`${fmt(p.held)}\` held` : ''} → about ${p.spins} spins × \`${fmt(p.perDraw)} CP\``);
            }
        }
        cost.push(`> **−** Spent Already: \`${fmt(spent)} CP\``, ...quiet('spent'));
        // "Not set" so a balance nobody entered does not read as one set to 0.
        cost.push(`> **−** CP Balance: \`${fmt(balance)} CP\`${balance ? '' : ' *(not set)*'}`);
    }
    if (unpriced.length) cost.push(`⚠️ **${plural(unpriced.length, 'line')} excluded** — no sourced pricing at ${regionLabel(basket.region)}: ${unpriced.map(b => shortName(b.drawKey)).join(', ')}.`);
    // 🔴 A SILENT ZERO, FOUND 2026-10-13 12:40 EDT: an upgrade with no price at the region used to add nothing while claiming it was included. Say so instead.
    cost.push(...upgradeWarnings(basket, upgrades));

    // Two different "nothing to buy" states (2026-10-13 12:40 EDT): every line already finished, and a balance that covers what is left.
    if (needed === 0 && !unpriced.length) return { cost, purchase: [`${emojis.checkmark} **Every draw here is finished** — nothing left to buy.`], buying: false };
    if (shortfall <= 0) return { cost, purchase: [`${emojis.checkmark} **Your balance covers this**, with **\`${fmt(-shortfall)} CP\`** to spare.`], buying: false };

    const doubleCpAvailable = CP_PACKAGES.filter((p, i) => (basket.entitlementMask & (1 << i)) !== 0).map(p => p.id);
    // The purchase search is the expensive part and does not change with the fitting level, so one render runs it once (`memo`), however many levels it tries.
    const result = memo && 'result' in memo ? memo.result : optimizePurchase(shortfall, { currency, doubleCpAvailable });
    if (memo) memo.result = result;
    if (!result || !result.cheapest) return { cost, purchase: [`⚠️ **${fmt(shortfall)} CP** is more than a reasonable number of store purchases can cover at once.`], buying: false };
    const settingsMention = client ? mentionCommand(client, '/settings') : '`/settings`';
    const money = cents => formatMoney(cents, currency);
    const stockUp = detail ? result.stockUp : null;
    const afterWhat = ` after completing your draws${upgrades.cp ? ' and upgrades' : ''}`;
    // One option: the total for its price (labelled only when two options show, 2026-10-14 16:47 EDT), what is left over, then each bundle quoted with ⌇ before its price.
    const option = (r, label) => [
        `**${label ? `${label}: ` : ''}\`${fmt(r.totalCp)} CP\`** for **\`${money(r.totalCents)}\`**`,
        `-# **\`${fmt(r.leftoverCp)} CP\` left over**${detail ? afterWhat : ''}`,
        ...r.combo.map(c => `> **${c.count}× \`${fmt(c.cpEach)} CP\`** bundle${c.mode === 'double' ? ' (2X)' : ''}${BREAK}**\`${money(c.priceCents)}\`**${c.count > 1 ? ' each' : ''}`)
    ];
    const purchase = ['## Suggested Purchase', ...option(result.cheapest, stockUp ? 'Just Enough' : null)]; // "Just Enough" (2026-10-17 21:33 EDT, Harkirat: "sure sounds good"): the pick is no longer always the cheapest, and "Best Pick" would read as better than Stock Up
    if (stockUp) {
        purchase.push('', ...option(stockUp, 'Stock Up'));
        // extraCents can be 0 or below: Stock Up may need MORE purchases for the same money or a few cents less (EUR 2,364 CP short: three bundles for €29.97 against one for €29.99), so "Costs −€0.02 more" is never printed.
        const costWord = stockUp.extraCents > 0 ? `**${money(stockUp.extraCents)} more**` : stockUp.extraCents === 0 ? '**the same**' : `**${money(-stockUp.extraCents)} less**`;
        purchase.push(`> -# Costs ${costWord} · Buys **${fmt(stockUp.extraCp)} extra CP** at a better rate`);
    }
    // The currency line stays (2026-10-13 12:40 EDT): a player outside the US must see which currency these are, and where to change it. Italic, his draft.
    purchase.push(detail
        ? `-# *Estimates only: local tax and currency conversion vary, and CoD: Mobile web store prices are not included · Prices in **${currency}** · Change in ${settingsMention}*`
        : `-# *Prices in **${currency}** · Change in ${settingsMention}*`);
    return { cost, purchase, buying: true };
}

// The simplified view's selection list, his draft: each draw a bold heading line, then a quoted Price line with its attempts, a quiet spent / to-complete line, and the Mythic upgrade when one is set. `level` keeps it inside Discord's 4,000-character text cap at many lines: 0 = a block per line, 1 = adjacent identical lines share a block (prices "each"), 2 = those blocks without the quiet line, 3 = one block per draw type.
function compactSelectionText(basket, level, detail = false) {
    const rows = breakdownRows(lineFigures(basket), level >= 3 ? 4 : level >= 1 ? 1 : 0);
    const out = [];
    for (const r of rows) {
        const icon = metaOf(r.drawKey) ? emojis[metaOf(r.drawKey).tier] : emojis.smallDot;
        const num = r.byType ? '' : `${r.from === r.to ? `#${r.from}` : `#${r.from}–#${r.to}`} · `;
        const many = r.count > 1;
        out.push(`**${icon} ${num}${r.byType ? shortName(r.drawKey) : lineName(r)}${many ? ` ×${r.count}` : ''}**`);
        // A season draw names its Draw Type under its own name (decided 2026-10-17 21:28 EDT).
        if (r.title && !r.byType) out.push(`-# ${shortName(r.drawKey)}`);
        if (!r.priced) { out.push(`> -# No sourced price at ${regionLabel(basket.region)}, so it is left out of the totals.`); continue; }
        // A per-type row carries its lines' sums, so it never says "each".
        const each = many && !r.byType ? ' each' : '';
        const unit = isArmoryKey(r.drawKey) ? unitOf(r.drawKey) : 'Attempts';
        out.push(`> **Price: \`${fmt(r.drawFull)} CP\`**${each} · \`${r.pullsDone}/${r.total ?? '?'}\` ${unit}${r.spinsIn && !r.byType ? ` + ${r.spinsIn} spins` : ''}`);
        // The spent / to-complete line is the Full Breakdown's only (2026-10-17 17:41 EDT, Harkirat: "for the simplified view, we should drop the '0 CP Spent · 4,950 CP To Complete' lines ... And show them during full breakdown view").
        if (detail && level < 2) out.push(`> -# \`${fmt(r.spent)} CP\` Spent · \`${fmt(r.drawLeft)} CP\` To Complete${each}`);
        if (r.up || r.upNeed) {
            const u = MYTHIC_UPGRADE[upgradeKeyOf(r.drawKey)];
            const icon2 = upgradeKeyOf(r.drawKey) === 'mythicWeapon' ? emojis.mythicCard : emojis.mythicCoin;
            out.push(`> -# ${icon2} Upgrade${r.up && !r.byType ? ` ${upgradeTransition(r.up)}` : ''} · \`${fmt(r.upNeed)} ${u.currency}\`${each}`);
        }
    }
    return out.join('\n');
}

// ==========================================
// PAGES
// ==========================================
// A saved calculation's name gets its own line under the title (2026-10-14 13:13 EDT, Harkirat: "Maybe put it in a 2nd line? '> ### Viewing Saved: `the name`'"). A backtick in a name would end the code span early, so it is swapped for a plain quote here only. Same style as the Season Calendar's season line (2026-10-14 16:51 EDT, Harkirat): utils/titleBlock.js's caption in bold-italic letters. A backtick in a name is swapped for a plain quote so it cannot open a code span.
function titleBlock(basket) {
    // "Lucky Draw Cost Calculator" (2026-10-17 17:08 EDT, his draft's title). The name sits in a code span after the styled caption (2026-10-16 09:59 EDT, Harkirat: "wrap the saved calc's name in backticks for 'viewing saved: `name`'").
    if (basket && basket.name) return { type: 10, content: `## ${emojis.calculator} Lucky Draw Cost Calculator\n${toBoldItalicUnicode('Viewing Saved:')} \`${String(basket.name).replace(/`/g, "'")}\`` };
    // A working copy shows NO "Edited from Saved" line any more (2026-10-16 09:59 EDT, Harkirat: "when a saved calc is changed/edits, just remove the 'edited from saved' line because at that point it's basically a new calc that the user would save anyway"). `sourceName` still reaches the Saved view and the Save step, which offer saving over the original.
    return { type: 10, content: `## ${emojis.calculator} Lucky Draw Cost Calculator` };
}

// ==========================================
// THE SETUP FORM -- the first screen, and the one the whole command now leads FROM
// ==========================================
// 🔴 THIS REVERSES THIS COMMAND'S OWN "never a setup form again" RULE, deliberately (Harkirat, 2026-08-27). That rule came from a single-draw panel where five interactions preceded any figure AT ALL, every single visit. Two things make this different, and both are load-bearing rather than cosmetic:
//   1. ONE screen. The saved-calculations list and the form share it -- loading an old calculation and starting a new one are both one interaction from opening the command, never a hop apart.
//   2. IT PERSISTS. Pressing Calculate sets `submitted` on the basket document, so the result is what you come back to -- until you press New Calculation. The form is filled in once, not on every visit.
// If either of those is ever removed, this is the old failure again and the old rule should come back. THE FORM AS A SUMMARY (2026-10-18 12:15 EDT, Harkirat's Mock B: "i think B might be better? we're we nearly at component limit for the landing panel anyway"). Measured that minute: 5 lines cost 30–32 of 40 components and 10.7–11.4k of the 12k size budget. Each line is now a line of text, and every per-line control (spins, a Series Armory's size and spins toward the next item, a Mythic upgrade) is on Set Draw Progress, one press away.
function selectionSummary(basket, max = 12) {
    const lines = (basket.banners || []).map((b, i) => {
        const total = pullCount(basket.region, b.drawKey, b);
        const icon = metaOf(b.drawKey) ? emojis[metaOf(b.drawKey).tier] : emojis.smallDot;
        const spinsIn = isArmoryKey(b.drawKey) && b.spinsIn && total !== null && b.pullsDone < total ? ` · ${b.spinsIn} Spins In` : '';
        // The tier icon first, then the number (2026-10-18 13:05 EDT, his "keep the emojis first"); a season draw's type under it; the upgrade on its own quoted line with its card or coin (his format).
        const out = [`${icon} **#${i + 1}** ${lineName(b)} · \`${b.pullsDone}/${total ?? '?'}\` ${unitOf(b.drawKey)}${spinsIn}`];
        if (b.title) out.push(`-# ${shortName(b.drawKey)}`);
        if (Array.isArray(b.upWant) && upgradeKeyOf(b.drawKey) && b.upWant.some(Boolean)) out.push(`> -# ${upgradeCardEmoji(b.drawKey) || ''} Upgrade to ${upgradeStateText(b.drawKey, b.upWant)}`);
        return out.join('\n');
    });
    if (lines.length > max) return [...lines.slice(0, max), `-# …and ${lines.length - max} more, all on **Set Draw Progress**.`].join('\n');
    return lines.join('\n');
}
// "Set Draw Progress & Upgrades" once a Mythic line is in the calculation (2026-10-18 13:05 EDT, his ask), on the button and the screen it opens.
function progressTitle(basket) { return (basket?.banners || []).some(b => upgradeKeyOf(b.drawKey)) ? 'Set Draw Progress & Upgrades' : 'Set Draw Progress'; }
function progressButton(state, basket) { return { type: 2, style: 2, label: progressTitle(basket), custom_id: encodeState('progress', state), emoji: emojis.parseEmoji(emojis.editCalc) }; }

// THIS SEASON'S DRAWS (sidelined 2026-10-17 21:29 EDT, built 2026-10-18 12:15 EDT). First on the form (his "yes"). Each option is the draw's own title with its Draw Type under it (decided 2026-10-17 21:28 EDT). The list is listSeasonDraws's, read by the caller and passed in, because building a panel never touches the database.
function seasonDrawsRow(state, seasonDraws, room) {
    if (!seasonDraws || !seasonDraws.length) return null;
    const list = seasonDraws.slice(0, 25);
    return { type: 1, components: [{
        type: 3, custom_id: encodeState('season', state),
        placeholder: room > 0 ? "Add this season's draws" : `Full: a calculation holds up to ${MAX_LINES} draws`,
        min_values: 1, max_values: Math.max(1, Math.min(list.length, room)), disabled: room <= 0,
        options: list.map(d => ({
            label: String(d.title).slice(0, 100), value: d.id,
            // The calculator's own short name for the type, never the "... Draw" full name (his rename rule, 2026-10-13 23:03 EDT).
            description: `${shortName(d.drawKey)}${isArmoryKey(d.drawKey) ? ` · ${d.size} ${unitOf(d.drawKey)}` : ''}${d.date ? ` · ${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}` : ''}`.slice(0, 100),
            emoji: emojis.parseEmoji(emojis[metaOf(d.drawKey).tier])
        }))
    }] };
}

function buildSetupPanel(state, basket, accentColor, { region, notice = null, dropConfirm = null, savedCount = 0, seasonDraws = null } = {}) {
    // A shim, so every row builder below works identically whether a draft document exists yet or not.
    const draft = basket || { banners: [], region: region || 'region_10', balance: 0, includeUpgrades: false };
    const banners = draft.banners || [];
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];
    if (notice) components.push({ type: 10, content: `-# ${notice}` });
    const season = seasonDrawsRow(state, seasonDraws, MAX_LINES - banners.length);
    if (!banners.length) {
        components.push({ type: 10, content: season ? "## Start a Calculation\n-# Pick this season's draws, or any draw types. You can add more later." : '## Start a Calculation\n-# Pick all the draw types you want to calculate. You can add more later.' });
        if (dropConfirm) components.push(dropConfirmRow(state, dropConfirm.mask, dropConfirm.count, dropConfirm.verb, dropConfirm.label));
        else {
            if (season) components.push(season);
            components.push(typesSelectRow(state, draft));
        }
    } else {
        // The summary rides in a Section with Set Draw Progress as its button, the way the result's selection carries Edit Selection.
        components.push({ type: 9, components: [{ type: 10, content: `## ${selectionHeading(banners)}\n${selectionSummary(draft)}` }], accessory: progressButton(state, draft) });
        if (dropConfirm) components.push(dropConfirmRow(state, dropConfirm.mask, dropConfirm.count, dropConfirm.verb, dropConfirm.label));
        else {
            components.push({ type: 14, spacing: 1, divider: false });
            components.push({ type: 10, content: season ? "### Add More Draws\n-# Add this season's draws, or more draw types and copies of the same one." : '### Add More Draws\n-# Select more draw types or add more of the same type to calculate multiple at the same time.' });
            if (season) components.push(season);
            components.push(addDrawsRow(state, draft));
        }
    }
    components.push(regionCaption(), regionRow(state, draft), ...setupBalanceRows(state, basket), { type: 14, spacing: 2, divider: true }, setupSubmitRow(state, basket, savedCount));
    return { type: 17, accent_color: accentColor, components };
}

// SET DRAW PROGRESS (2026-10-18 12:15 EDT): every line's progress in one place (his ask, "a single button for 'Set Draw Progress' that changes the panel"). The rule for every kind of draw, now and later: the line's DROPDOWN is its main progress, and a BUTTON beside the line's name opens everything else it has. A Mythic draw's button is its Upgrade; a Series Armory's is Spins In; a Mythic Weapon armory has both, so its two buttons sit in a row under the dropdown. Advanced draws, when they come, get the same shape.
function lineExtraButtons(state, basket, index) {
    const b = basket.banners[index];
    const out = [];
    if (upgradeKeyOf(b.drawKey)) {
        const line = upgradePlan(basket).lines.find(l => l.index === index);
        const set = upgradeIsSet(line);
        out.push({ type: 2, style: set ? 3 : 2, label: `Upgrade: ${set ? upgradeStateText(b.drawKey, line.want) : 'None'}`.slice(0, 80), custom_id: encodeState('upgset', { ...state, focus: index }), ...(upgradeCardEmoji(b.drawKey) ? { emoji: emojis.parseEmoji(upgradeCardEmoji(b.drawKey)) } : {}) });
    }
    if (isArmoryKey(b.drawKey)) {
        const done = (b.pullsDone || 0) >= armorySize(b);
        out.push({ type: 2, style: b.spinsIn && !done ? 3 : 2, label: done ? 'Spins In: Finished' : `Spins In: ${b.spinsIn || 0}`, custom_id: encodeState('spinsin', { ...state, focus: index }), disabled: done });
    }
    return out;
}
function progressLineBlocks(state, basket, index) {
    const b = basket.banners[index];
    const icon = metaOf(b.drawKey) ? emojis[metaOf(b.drawKey).tier] : emojis.smallDot;
    const text = `${icon} **#${index + 1}** ${lineName(b)}${b.title ? `\n-# ${shortName(b.drawKey)}` : ''}`;
    const extra = lineExtraButtons(state, basket, index);
    const head = extra.length === 1 ? { type: 9, components: [{ type: 10, content: text }], accessory: extra[0] } : { type: 10, content: text };
    const out = [head, bannerPullsRow(state, basket, index, { removable: true })];
    if (extra.length > 1) out.push({ type: 1, components: extra });
    return out;
}
function buildProgressPanel(state, basket, accentColor, { notice = null, dropConfirm = null } = {}) {
    const banners = basket.banners || [];
    const top = [titleBlock(basket), { type: 14, spacing: 2, divider: true },
        { type: 10, content: `## ${progressTitle(basket)}\n-# Set how far you are on each draw. \`0\` means you haven't started it.` }];
    if (notice) top.push({ type: 10, content: `-# ${notice}` });
    if (dropConfirm) top.push(dropConfirmRow(state, dropConfirm.mask, dropConfirm.count, dropConfirm.verb, dropConfirm.label));
    const back = [{ type: 14, spacing: 2, divider: true }, { type: 1, components: [{ type: 2, style: 2, label: 'Back to Calculation', custom_id: encodeState('progback', state), emoji: emojis.parseEmoji(emojis.left) }] }];
    const build = perPage => {
        const pages = linePages(banners, perPage);
        const bpage = Math.min(state.bpage || 0, pages.length - 1);
        const mid = [];
        pages[bpage].forEach((i, k) => { if (k) mid.push({ type: 14, spacing: 1, divider: true }); mid.push(...progressLineBlocks(state, basket, i)); });
        if (pages.length > 1) mid.push(pageNavRow({ ...state, bpage }, pages.length));
        return [...top, ...mid, ...back];
    };
    // Fewer lines per page until it fits (the same two budgets as the form): a Series Armory's 22-value dropdown is about twice a ladder line's size.
    let out = [];
    for (let perPage = SETUP_LINES_PER_PAGE; perPage >= 1; perPage--) {
        out = build(perPage);
        if (1 + countComponents(out) <= SETUP_CONTAINER_BUDGET && JSON.stringify(out).length <= SETUP_JSON_BUDGET) break;
    }
    return { type: 17, accent_color: accentColor, components: out };
}

// SPINS IN (2026-10-18 12:15 EDT): spins already done toward a Series Armory's next item, one optional box. Blank is 0.
function buildSpinsInModal(state, basket, index) {
    const b = basket?.banners?.[index];
    if (!b || !isArmoryKey(b.drawKey)) return null;
    const a = SERIES_ARMORY[b.drawKey];
    return {
        custom_id: encodeState('spinsinsave', { ...state, focus: index }), title: `#${index + 1} ${lineName(b)}`.slice(0, 45),
        components: [{ type: 18, label: `Spins toward the next ${a.noun.toLowerCase()}`, description: `0 to ${a.spins - 1}. A ${a.noun.toLowerCase()} is guaranteed at ${a.spins} spins.`,
            component: { type: 4, custom_id: 'spins', style: 1, required: false, max_length: 4, placeholder: 'e.g. 40', ...(b.spinsIn ? { value: String(b.spinsIn) } : {}) } }]
    };
}
// Reads the box back: a whole number from 0 to one less than an item's spins, or null with nothing saved.
function readSpinsIn(drawKey, raw) {
    const a = SERIES_ARMORY[drawKey];
    if (!a) return null;
    const t = String(raw ?? '').trim().replace(/spins?$/i, '').trim();
    if (t === '') return 0;
    const v = Number(t);
    return Number.isInteger(v) && v >= 0 && v < a.spins ? v : null;
}

// THIS SEASON'S DRAWS, read from the database (2026-10-18 12:15 EDT, Harkirat's rule): every draw stored this season, past, live and upcoming. The list is wiped at the season's end (`bpEnd`): after it, a draw stays only while it still runs, its calendar end date later than now, and a draw with no calendar end date ends with the season. "only remove previous season's draws automatically; basically linking the draw calc dropdown wipe to season end date". Left out: a draw with no Draw Type or Unsure / Unknown (nothing to price), and the Advanced draws (not in the calculator yet).
async function listSeasonDraws(nowMs = Date.now()) {
    const SeasonalData = require('../models/SeasonalData');
    const { isPricedDrawType, armoryItemCount } = require('../utils/drawTypes');
    const { isSameDrawTitle } = require('../utils/search');
    const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
    if (!doc) return [];
    const bpEndMs = doc.bpEnd && !doc.bpEndTBD ? new Date(doc.bpEnd).getTime() : null;
    const seasonOver = bpEndMs !== null && nowMs > bpEndMs;
    const calendarDraws = (doc.calendar || []).filter(e => e.category === 'draw');
    const out = [];
    for (const d of [...(doc.newDraws || []), ...(doc.returningDraws || [])]) {
        if (!d.priceType || !isPricedDrawType(d.priceType) || !CALC_KEYS.includes(d.priceType)) continue;
        if (seasonOver) {
            const cal = calendarDraws.find(e => isSameDrawTitle(e.title, d.title));
            const endMs = cal && cal.endDate ? new Date(cal.endDate).getTime() : bpEndMs;
            if (!(endMs > nowMs)) continue;
        }
        out.push({ id: String(d._id), title: d.title, drawKey: d.priceType, date: d.date || null, size: isArmoryKey(d.priceType) ? Math.max(1, armoryItemCount(d)) : null });
    }
    return out.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
}

// ==========================================
// THE SAVED VIEW -- a view of this same message, reached from the nav row's Saved button (2026-10-14 13:13 EDT)
// ==========================================
// His intake asked how a calculation is removed, what the limit is, and what happens at it; the answer was "one at a time, from a result page, named ones only, no limit, and the loader silently showed only the first 25". This view is where all of that lives now: reopen one, delete several, or delete them all. What a saved calculation IS, in its option (his "they barely hold any info"): what it still costs, the region, and its draws; "Draft" when it was never calculated. Cut at Discord's 100 characters. What a saved calculation IS, in its option (2026-10-16 14:31 EDT, Harkirat: "remove the emojis, they don't make sense in this list" and "add a date to it? and anything else that can help someone better distinguish the saved items"): when it last changed (in the viewer's own timezone), what it still costs, its region and its draws. An option's description is plain text capped at 100 characters, so a custom emoji could never render there anyway.
function savedDescription(b, { timezone = null, mark = null } = {}) {
    const banners = b.banners || [];
    const when = lastChanged(b, timezone);
    const lead = [mark, b.submitted ? null : 'Draft', when].filter(Boolean).join(' · ');
    if (!banners.length) return [lead, 'Empty'].filter(Boolean).join(' · ');
    const { total } = basketCost(b.region, banners, b.includeUpgrades, heldOf(b));
    const draws = usedTypes(banners).map(k => { const n = banners.filter(x => x.drawKey === k).length; return `${shortName(k)}${n > 1 ? ` ×${n}` : ''}`; }).join(', ');
    const text = [lead, `${fmt(total)} CP Needed`, regionLabel(b.region), draws].filter(Boolean).join(' · ');
    return text.length > 100 ? `${text.slice(0, 99)}…` : text;
}
function lastChanged(b, timezone = null) {
    const d = new Date(b.updatedAt || b.createdAt || 0);
    if (Number.isNaN(d.getTime()) || d.getTime() === 0) return null;
    try { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(timezone ? { timeZone: timezone } : {}) }); }
    catch { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
}
// A checksum of the list a delete was picked from (see encodeState's `k`).
function savedChecksum(list) {
    return crypto.createHash('sha1').update((list || []).map(b => String(b._id)).join(',')).digest('hex').slice(0, 6);
}

// THE SAVED VIEW, with saving folded in (2026-10-16 14:31 EDT, Harkirat: "why switch the entire panel when clicking save within the 'view saved' panel? ... why not just have that save/replace direction in the 'view saved' panel itself?"). The separate Save step (page 4) is gone; a panel still carrying page 4 renders this. His structure, top to bottom: the title with "Saved Calculations" as its caption; a large divider; the save section; a small spacer; Your Saved Calculations; a small divider; Delete; a large divider; the Back to Calculation / New Calculation footer.
function cutText(text, n) { return text.length > n ? `${text.slice(0, n - 1)}…` : text; }
// Three 25-option dropdowns of long names pass Discord's message size cap on their own, so the view gives up detail in steps until it fits: the delete list's descriptions, the replace list's descriptions, shorter reopen descriptions, shorter delete and replace names, then the reopen descriptions. A player with short names never loses any of it.
function buildSavedPanel(state, savedBaskets, accentColor, options = {}) {
    let out;
    for (let level = 0; level <= 5; level++) {
        out = buildSavedPanelAt(state, savedBaskets, accentColor, options, level);
        if (JSON.stringify(out).length <= SETUP_JSON_BUDGET) break;
    }
    return out;
}
function buildSavedPanelAt(state, savedBaskets, accentColor, { notice = null, savedConfirm = null, overwriteConfirm = null, current = null, timezone = null } = {}, level = 0) {
    const list = (savedBaskets || []).slice(0, MAX_SAVED);
    const view = { ...state, page: 3 };
    const describe = (b, mark) => savedDescription(b, { timezone, mark });
    const options = (descOf, nameLen = 100) => list.map(b => ({ label: cutText(String(b.name), nameLen), value: String(b._id), ...(descOf ? { description: descOf(b) } : {}) }));
    const openMark = b => (current && String(current._id) === String(b._id) ? 'Open Now' : null);
    const components = [
        { type: 10, content: `## ${emojis.calculator} Lucky Draw Cost Calculator\n${toBoldItalicUnicode('Saved Calculations')}` },
        { type: 14, spacing: 2, divider: true }
    ];
    if (notice) components.push({ type: 10, content: `-# ${notice}` });

    // The save section: the open calculation, managed here.
    let saveSection = false;
    if (current && current.name) {
        const armed = state.verb === 'delarm';
        components.push({ type: 10, content: `## This Calculation\n-# Viewing **${String(current.name).replace(/\*/g, '')}**. Rename it, or delete it from your saved calculations.` });
        components.push({ type: 1, components: [
            { type: 2, style: 2, label: 'Rename', custom_id: encodeState('modal_name', view) },
            { type: 2, style: armed ? 4 : 2, label: armed ? 'Delete Calculation — click again' : 'Delete Calculation', custom_id: encodeState(armed ? 'del' : 'delarm', view) }
        ] });
        saveSection = true;
    } else if (current && (current.banners || []).length) {
        const lines = ['## Save This Calculation'];
        // Conditional, so it is quoted (2026-10-16 18:57 EDT, Harkirat: "format it as `> -# text`").
        if (current.sourceName) lines.push(`> -# Edited from **${current.sourceName}**, which stays as it was unless you replace it.`);
        lines.push('-# **Save as New** keeps it as its own calculation, or **replace** one you saved before.');
        components.push({ type: 10, content: lines.join('\n') });
        if (overwriteConfirm) {
            components.push({ type: 1, components: [
                { type: 2, style: 4, label: `Replace "${String(overwriteConfirm.name).slice(0, 60)}"`, custom_id: encodeState('owok', { ...view, target: overwriteConfirm.target }) },
                { type: 2, style: 2, label: 'Keep It', custom_id: encodeState('saved', view) }
            ] });
        } else {
            components.push({ type: 1, components: [{ type: 2, style: 1, label: 'Save as New', custom_id: encodeState('modal_name', view), emoji: emojis.parseEmoji(emojis.saveStar) }] });
            if (list.length) {
                const mark = b => (String(current.sourceId) === String(b._id) ? 'Edited From This One' : null);
                components.push({ type: 1, components: [{
                    type: 3, custom_id: encodeState('owsel', view), placeholder: 'Or replace a previously saved calculation...',
                    options: options(level >= 2 ? null : b => describe(b, mark(b)), level >= 4 ? 40 : 100)
                }] });
            }
        }
        saveSection = true;
    }
    if (saveSection) components.push({ type: 14, spacing: 1, divider: false });

    components.push({ type: 10, content: list.length ? '## Your Saved Calculations' : '## Your Saved Calculations\n-# None saved yet. Save a calculation to keep it here.' });
    components.push({ type: 1, components: [list.length ? {
        type: 3, custom_id: encodeState('load', view), placeholder: `Reopen a saved calculation (${list.length}/${MAX_SAVED} slots)`,
        options: options(level >= 5 ? null : b => (level >= 3 ? cutText(describe(b, openMark(b)), 60) : describe(b, openMark(b))))
    } : {
        type: 3, custom_id: encodeState('load', view), placeholder: 'No saved calculations yet', disabled: true,
        options: [{ label: 'No saved calculations yet', value: 'none' }]
    }] });
    if (list.length) {
        components.push({ type: 14, spacing: 1, divider: true });
        components.push({ type: 10, content: `### Delete\n-# Pick the ones you no longer need. Nothing is deleted until you confirm.` });
        if (savedConfirm) {
            components.push({ type: 1, components: [
                { type: 2, style: 4, label: `Delete ${plural(savedConfirm.count, 'Calculation')}`, custom_id: encodeState('savedelok', { ...view, mask: savedConfirm.mask, check: savedConfirm.check }) },
                { type: 2, style: 2, label: savedConfirm.count === 1 ? 'Keep It' : 'Keep Them', custom_id: encodeState('saved', view) }
            ] });
        } else {
            components.push({ type: 1, components: [{
                type: 3, custom_id: encodeState('savedsel', view), placeholder: 'Pick calculations to delete',
                min_values: 1, max_values: list.length,
                options: options(level >= 1 ? null : b => describe(b, openMark(b)), level >= 4 ? 40 : 100)
            }] });
        }
        const armed = state.verb === 'delallarm';
        components.push({ type: 1, components: [{ type: 2, style: armed ? 4 : 2, label: armed ? `Delete All (${list.length}) — click again` : 'Delete All', custom_id: encodeState(armed ? 'delall' : 'delallarm', view), emoji: emojis.parseEmoji(emojis.deleteAll) }] });
    }
    // "An unsaved calculation is cleared 30 days after it was started" left this view for Help, which already says it under Saving.
    components.push({ type: 14, spacing: 2, divider: true }, savedFooterRow(state));
    return { type: 17, accent_color: accentColor, components };
}

function buildMissingBasketPanel(state, accentColor, savedCount = 0) {
    return buildSetupPanel({ ...state, basketId: null }, null, accentColor, {
        savedCount,
        region: 'region_10',
        notice: '⚠️ That saved calculation no longer exists — it may have expired, or been deleted.'
    });
}

// FULL BREAKDOWN -- Harkirat's own layout (2026-10-16 01:11 EDT, "Can we try this rough layout format i made for the full breakdown?"). Every line on its own row with what it costs in full, then what is spent and what is left; CP still needed as a sum the player can check (cost of draws - spent - balance), each term itemised per row; then the bundles. Simplify keeps the old compact view untouched. `level` keeps it inside Discord's message limits at many lines: 0 = one row per line, 1 = adjacent identical lines share a row ("#1–#3"), 2 = those shared rows without their spent/remaining note, 3 = the two sums show their totals without the per-row terms, 4 = one row per draw TYPE (every line of it summed, spins as done/total across them), which caps the rows at the number of draw types. Discord refuses a message whose text displays add up to more than 4,000 characters (COMPONENT_DISPLAYABLE_TEXT_SIZE_EXCEEDED, probed 2026-10-16 01:12 EDT); 25 distinct lines at level 2 measured 4,974.
const BREAK = ' ⌇ ';
// Warnings the two cost views share: an upgrade pool with no price at this region, and Final Form asked for below its minimum.
function upgradeWarnings(basket, upgrades) {
    const out = [];
    if (upgrades.missing.length) out.push(`⚠️ **Upgrade not included** for ${upgrades.missing.map(p => `Mythic ${p.currency}`).join(', ')} — no upgrade price at ${regionLabel(basket.region)} yet.`);
    if (upgrades.lines.some(l => l.finalFormBlocked)) out.push(`⚠️ **${MYTHIC_UPGRADE.mythicCharacter.finalForm.name} left out** — it needs ${MYTHIC_UPGRADE.mythicCharacter.finalForm.minTiers} of 9 tiers.`);
    return out;
}
function lineFigures(basket) {
    const plan = upgradePlan(basket);
    return (basket.banners || []).map((b, i) => {
        const left = remainingToFinish(basket.region, b.drawKey, b.pullsDone, b);
        const priced = left !== null;
        const spent = priced ? spentSoFar(basket.region, b.drawKey, b.pullsDone, b) : 0;
        const total = pullCount(basket.region, b.drawKey, b);
        const spinsIn = isArmoryKey(b.drawKey) && total !== null && b.pullsDone < total ? (b.spinsIn || 0) : 0;
        const leftAll = priced ? left : 0;
        // The draw and its Mythic upgrade are kept apart (2026-10-16 14:32 EDT, Harkirat's layout states the upgrade on its own). Since 2026-10-17 13:17 EDT a line's upgrade is what it still needs in CARDS or COINS (`upNeed`), because both are pooled across lines and only the pool becomes CP; `full`/`left` are the draw alone.
        const up = plan.lines.find(l => l.index === i) || null;
        const upNeed = upgradeIsSet(up) ? up.need : 0;
        return { n: i + 1, drawKey: b.drawKey, title: b.title || null, spinsIn, pullsDone: b.pullsDone, total, priced, spent, left: leftAll, full: spent + leftAll, drawLeft: leftAll, drawFull: spent + leftAll, up: upNeed ? up : null, upNeed, upKey: JSON.stringify([up ? up.have : null, up ? up.want : null, b.title || null, total, spinsIn]) };
    });
}
function breakdownRows(figs, level) {
    if (level === 0) return figs.map(f => ({ ...f, from: f.n, to: f.n, count: 1 }));
    if (level >= 4) {
        const byType = new Map();
        for (const f of figs) {
            const g = byType.get(f.drawKey) || { ...f, count: 0, spent: 0, left: 0, full: 0, drawLeft: 0, drawFull: 0, upNeed: 0, up: null, pullsDone: 0, total: 0, byType: true };
            g.count++; g.spent += f.spent; g.left += f.left; g.full += f.full; g.drawLeft += f.drawLeft; g.drawFull += f.drawFull; g.upNeed += f.upNeed; g.pullsDone += f.pullsDone; g.total += f.total || 0;
            byType.set(f.drawKey, g);
        }
        return [...byType.values()];
    }
    const rows = [];
    for (const f of figs) {
        const last = rows[rows.length - 1];
        if (last && last.drawKey === f.drawKey && last.pullsDone === f.pullsDone && last.priced === f.priced && last.upKey === f.upKey) { last.to = f.n; last.count++; }
        else rows.push({ ...f, from: f.n, to: f.n, count: 1 });
    }
    return rows;
}
// Discord's text cap for one message's text displays, used with SETUP_JSON_BUDGET to pick the Full Breakdown's level.
const TEXT_BUDGET = 4000;
function textLength(node) {
    let n = node && node.type === 10 ? (node.content || '').length : 0;
    for (const c of (node && node.components) || []) n += textLength(c);
    if (node && node.accessory) n += textLength(node.accessory);
    return n;
}

// Edit Selection is the list Section's button (2026-10-17 17:26 EDT). The 2026-10-16 20:31 EDT rule that kept buttons off Section accessories for phones was reversed by his own testing.
function editSelectionButton(state) { return { type: 2, style: 2, label: 'Edit Selection', custom_id: encodeState('edit', state), emoji: emojis.parseEmoji(emojis.editCalc) }; }
function buildCostPage(state, basket, accentColor, options = {}) {
    const { currency = 'USD', client = null, liveDoubleCPEntry = null } = options;
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];

    if (!basket.banners.length) {
        // Empty basket returns to the landing look (spec §9), but STAYS bound to this basketId so picking a draw adds to the same (possibly named) basket instead of creating a second one.
        return buildSetupPanel(state, basket, accentColor, { region: basket.region, savedCount: options.savedCount ?? (options.savedBaskets || []).length, notice: basket.name ? `"${basket.name}" is empty — pick a draw to add to it.` : null });
    }

    // HIS SIMPLIFIED VIEW (2026-10-17 17:08 EDT), built the way he tested it (2026-10-17 17:26 EDT, Harkirat: "i had done a section+accent element type of component. where 'Your Draw Selections' was 1 section+button. and 'Cost Breakdown' combined with 'Suggested Purchase' were 1 section+button"). So each block is a Section with its button as the accessory: the list with Edit Selection, then Cost Breakdown and Suggested Purchase together with Full Breakdown. This reverses the 2026-10-16 20:31 EDT move of these buttons onto their own rows. The Full Breakdown is the same two Sections with its working shown and Simplify as the button (2026-10-17 17:30 EDT, "2 matching sets"). Fewer details per line until it fits Discord's caps.
    const memo = {};
    const build = level => {
        const out = [...components];
        out.push({ type: 9, components: [{ type: 10, content: `## ${basket.banners.length >= 2 ? 'Your Draw Selections' : 'Your Draw Selection'}\n${compactSelectionText(basket, Math.min(level, 3), state.detail)}` }], accessory: editSelectionButton(state) });
        if (options.notice) out.push({ type: 10, content: `-# ${options.notice}` });
        if (options.dropConfirm) out.push(dropConfirmRow(state, options.dropConfirm.mask, options.dropConfirm.count, options.dropConfirm.verb, options.dropConfirm.label));
        out.push({ type: 14, spacing: 1, divider: true });
        const { cost, purchase } = buildCostBlock(state, basket, currency, client, { detail: state.detail, level, memo });
        const toggle = state.detail ? { label: 'Simple Breakdown', emoji: emojis.collapse } : { label: 'Full Breakdown', emoji: emojis.expand };
        out.push({ type: 9, components: [{ type: 10, content: cost.join('\n') }, { type: 10, content: purchase.join('\n') }], accessory: { type: 2, style: 2, label: toggle.label, custom_id: encodeState('detail', state), emoji: emojis.parseEmoji(toggle.emoji) } });
        return finishCostPage(state, basket, accentColor, out, liveDoubleCPEntry, { caption: TWEAK_RESULT_CAPTION });
    };
    let out = null;
    for (const level of [0, 1, 2, 3, 4]) {
        out = build(level);
        if (JSON.stringify(out).length <= SETUP_JSON_BUDGET && textLength(out) <= TEXT_BUDGET) break;
    }
    return out;
}

// The rows under the cost, shared by the compact view and the Full Breakdown.
function finishCostPage(state, basket, accentColor, components, liveDoubleCPEntry, { caption = null } = {}) {
    // Region and upgrade are adjustable right here (2026-10-14 13:13 EDT, Harkirat): "why are the cp region buttons gone from this screen? and the upgrade yes/no button". A click re-prices this same result.
    components.push({ type: 14, spacing: 2, divider: true }, caption || regionCaption(), regionRow(state, basket), ...basketManageRows(state, basket), { type: 14, spacing: 2, divider: true }, resultActionRow(state));

    if (liveDoubleCPEntry || basket.entitlementMask) {
        components.push({ type: 10, content: liveDoubleCPEntry
            ? `-# 🎉 A **Double CP** event looks live right now${liveDoubleCPEntry.endDate ? ` (ends <t:${Math.floor(new Date(liveDoubleCPEntry.endDate).getTime() / 1000)}:R>)` : ''}. Tell the optimizer which bundles you still have a 2X entitlement on.`
            : `-# Select which bundles you still have an unused 2X entitlement on, if the event is running.` });
        components.push(entitlementSelectRow(state, basket));
    }
    return { type: 17, accent_color: accentColor, components };
}

// The Edit Draws page is gone (2026-10-13 23:01 EDT): Edit on the result reopens the form, which holds every line, its progress, Remove and Move Up. A panel posted before that still sends page 1, which now renders the result.

// RETIRED FROM THE UI, KEPT ON PURPOSE (2026-10-14 19:58 EDT): the Draw Info button left the calculator's nav row in the intake of 2026-10-14 (commit 15b49b09), so no new panel can reach this. It still runs for a panel posted before that, through the old `info` verb in handlers/drawCalc.js, and one case in scripts/drawCalcBudget.test.js covers it. Harkirat chose to leave it until a later code-housekeeping session decides on deletion (filed in docs/db-deferred-list.md, Someday / tech-debt). /draw prices shows real pricing in the meantime. Draw Info -- its OWN ephemeral message, own fresh 40-component budget, full buildDrawEntries fidelity for every DISTINCT draw type in the basket (measured 23/40 at all nine draw types in the single-draw design; a basket of any size still spans at most nine distinct types, so this never needs pagination -- spec §3).
function buildDrawInfoPanel(basket, accentColor) {
    const { buildDrawEntries } = require('./drawprices');
    // Filter to keys drawprices still knows -- buildDrawEntries indexes DRAW_META directly and would throw on a retired key (same hazard drawName() guards on the text paths).
    const types = usedTypes(basket.banners).filter(k => DRAW_META[k]);
    const components = [{ type: 10, content: `## ${emojis.calculator} Draw Info` }, { type: 14, spacing: 2, divider: true }];
    if (!types.length) {
        components.push({ type: 10, content: 'This calculation is empty — nothing to show yet.' });
    } else {
        const blocks = buildDrawEntries(basket.region, types);
        for (const set of blocks) for (const block of set) components.push({ type: 10, content: block });
    }
    return { type: 17, accent_color: accentColor, components };
}

// THE HELP PANEL (2026-10-14 18:33 EDT, Harkirat's second pass: "add some emojis to the help sections. and the 'words you'll see' section is useless. similarly with the button sections. rework those to hold and visually show better info"). Help now explains what the screen CANNOT show: how a draw's price climbs spin by spin (drawn from the player's own draw at their own region), how to find a region, and what the result's figures mean, including the optimizer's real rules. Labels a button already carries are not repeated here. 🔴 A REGION IS NOT "THE FIRST SPIN ON ANY DRAW". Measured 2026-10-14 18:33 EDT: Mythic Character's first spin is 20/35/50 CP and Pick Your Reward Card's is 60/90/120 at the 10/20/30 regions, so the old Help line ("check it on any draw") would make a player on the 10 CP region read 20 and pick wrong. Help names the draws whose first spin IS the region.
function helpLadder(region, drawKey) {
    const pick = (r, k) => (entryFor(r, k) && entryFor(r, k).draws ? { region: r, drawKey: k } : null);
    const at = pick(region, drawKey) || pick(region, 'mythicWeapon') || pick('region_10', 'mythicWeapon');
    const draws = entryFor(at.region, at.drawKey).draws;
    const total = draws.reduce((x, y) => x + y, 0);
    const last3 = draws.slice(-3).reduce((x, y) => x + y, 0);
    return { ...at, draws, total, lastShare: Math.round((100 * last3) / total) };
}
// Price per 100 CP for every pack in the viewer's currency (Harkirat, 2026-10-16 00:05 EDT: "why not actually give some better insight? so the user doesnt assume we're giving that 'better rate' out of our ass"). Per 100 CP rather than CP per unit of money so a zero-decimal currency (JPY) still reads as a real price. The rates are not monotonic -- in CAD the 80 CP pack beats every pack up to 5,000 -- which is exactly why Stock Up is computed per currency rather than assumed from "bigger is better".
function packRates(currency) {
    const rates = CP_PACKAGES.map(pkg => ({ cp: normalCp(pkg), per100: Math.round((priceCents(pkg, currency) * 100) / normalCp(pkg)) }));
    const best = Math.min(...rates.map(r => r.per100));
    return rates.map(r => ({ ...r, best: r.per100 === best }));
}
function buildHelpPanel(accentColor, { region = 'region_10', drawKey = 'mythicWeapon', currency = 'USD', client = null } = {}) {
    const dot = emojis.smallDot;
    const divider = { type: 14, spacing: 2, divider: true };
    const ladder = helpLadder(region, drawKey);
    const tier = DRAW_META[ladder.drawKey] ? emojis[DRAW_META[ladder.drawKey].tier] : dot;
    const regionChips = REGION_ORDER.map(r => `${emojis[REGION_EMOJI_KEY[r]]} **${regionLabel(r)}**`).join('  ');
    const row = (term, meaning) => `${dot} **${term}** · ${meaning}`;
    const components = [
        { type: 10, content: `## ${emojis.calculator} Calculator Help\n-# How the calculator works, and how to read what it tells you.` },
        divider,
        { type: 10, content: [
            '### 🧭 How It Works',
            '1. **Pick your draws** under Start a Calculation',
            '2. **Set your progress** under Set Draw Progress, on any draw you have already started',
            '3. **Set your region and balance** under Tweak Calculation',
            `4. **Press ${emojis.calculate} Calculate** for the CP you need and the cheapest way to buy it`
        ].join('\n') },
        divider,
        { type: 10, content: [
            '### 📈 How Prices Work',
            `Every spin costs more than the last. ${tier} **${shortName(ladder.drawKey)}** at ${emojis[REGION_EMOJI_KEY[ladder.region]]} **${regionLabel(ladder.region)}**:`,
            ladder.draws.map(n => `\`${fmt(n)}\``).join(' › '),
            `-# ${ladder.draws.length} spins = **${fmt(ladder.total)} CP**. The last 3 spins are **${ladder.lastShare}%** of it, so every spin you have already done matters.`
        ].join('\n') },
        { type: 10, content: [
            '### 🗺️ Find Your Region',
            regionChips,
            'Your region is the price of the **first spin** on a Mythic Weapon or a Legendary Weapon draw.',
            '-# Mythic Character and Pick Your Reward Card start higher, so do not check those.'
        ].join('\n') },
        divider,
        { type: 10, content: [
            '### 🧾 Reading Your Result',
            row('Recommended Bundle', `fewest purchases within ${Math.round(PURCHASE_RULES.tolerancePct * 100)}% of the cheapest, or a small bundle's price more per purchase saved`),
            row('Left Over', 'CP the bundles give beyond what you need; it stays in your account'),
            row('Stock Up', 'a bigger buy at a better rate; see Why Stock Up below'),
            row('2X Bundles', 'tick the bundles you can still buy at double CP; the recommendation uses them'),
            // Derived from the ladders and DRAW_DATA's spin counts, never typed (2026-10-17 13:17 EDT).
            row('Mythic Upgrade', `spins are estimates: a 10x spin averages about ${['mythicWeapon', 'mythicCharacter'].map(k => `${Math.round(upgradeFullAmount(k) / entryFor('region_10', k).upgrade.count)} ${k === 'mythicWeapon' ? 'cards' : 'coins'}`).join(' or ')}; what you hold comes off first`)
        ].join('\n') },
        divider,
        { type: 10, content: [
            '### 💰 Why Stock Up',
            // Currency is named first (Harkirat, 2026-10-16 00:14 EDT: "the fact that the stock-up varies by currency and the calculation adapts based on your set currency"), and the hint stays ONE line ("can you not artificially line break the hint line please?").
            `Bundle prices differ by currency, so the calculator uses yours: **${currency}**, set in ${client ? mentionCommand(client, '/settings') : '`/settings`'}.`,
            'Price per 100 CP (lower is better):',
            ...packRates(currency).map(r => `${dot} **${fmt(r.cp)} CP** · ${formatMoney(r.per100, currency)}${r.best ? ' · **best rate**' : ''}`),
            `-# Stock Up is worked out in your currency: it shows in Full Breakdown only when it gets at least ${Math.round(STOCK_UP_RULES.minRateGain * 100)}% more CP for your money than the Recommended Bundle, costs at most ${STOCK_UP_RULES.budgetMult}× as much, and takes at most ${STOCK_UP_RULES.maxPurchases} purchases, or as many as the Recommended Bundle when it needs more.`
        ].join('\n') },
        divider,
        { type: 10, content: [
            `### ${emojis.saveStar} Saving`,
            row('Saved stays saved', 'changing one opens a copy; it only changes when you save over it'),
            row('Save over', 'Save Result lets you pick any saved one to replace'),
            row('Limits', `up to ${MAX_SAVED} saved; an unsaved one clears after 30 days`)
        ].join('\n') },
        divider,
        { type: 10, content: '### ⚡ Shortcut\n`/draw calculator draw: pulls: balance:`\n-# Skips the form and opens straight on that draw\'s result.' }
    ];
    return { type: 17, accent_color: accentColor, components };
}

// ==========================================
// DISPATCH
// ==========================================
// Returns the message's TOP-LEVEL component list, not a single Container -- the nav row is a sibling of the Container, not a child (see bottomNavRow). Landing/missing states get no nav row: there is nothing yet to reset, and Draw Info has nothing to show.
function buildCalculatorPanel(state, basket, accentColor, options = {}) {
    const savedCount = options.savedCount ?? (options.savedBaskets || []).length;
    const nav = extra => bottomNavRow(state, { savedCount, ...extra });
    // Page 3 is the Saved view; it belongs to no one calculation, and Back returns to whichever this message had open. Page 4 (the old Save step) folded into the Saved view (2026-10-16), so a panel still carrying it renders this too.
    if (state.page === 3 || state.page === 4) return [buildSavedPanel({ ...state, page: 3 }, options.savedBaskets, accentColor, { notice: options.notice, savedConfirm: options.savedConfirm, overwriteConfirm: options.overwriteConfirm, current: basket, timezone: options.timezone }), nav({ showReset: false, onSaved: true })];
    // No basket at all -> the setup form, empty. A basketId that resolved to nothing -> the same form, with a notice.
    if (!basket) {
        const container = state.basketId
            ? buildMissingBasketPanel(state, accentColor, savedCount)
            : buildSetupPanel(state, null, accentColor, { region: options.region, notice: options.notice, savedCount, seasonDraws: options.seasonDraws });
        return [container, nav({ inForm: true })];
    }
    // 🔴 `submitted` is what separates a draft from a result, and it lives on the DOCUMENT, not the customId -- that is the whole reason a result survives a restart and "persists until reset / new calculation". Page 5 is Set Draw Progress, for a draft and a submitted calculation alike.
    if (state.page === 5 && basket.banners.length) return [buildProgressPanel(state, basket, accentColor, { notice: options.notice, dropConfirm: options.dropConfirm }), nav({ inForm: true })];
    if (!basket.submitted) {
        return [buildSetupPanel(state, basket, accentColor, { notice: options.notice, dropConfirm: options.dropConfirm, savedCount, seasonDraws: options.seasonDraws }), nav({ inForm: true })];
    }
    // Edit is a VIEW (page 2) on a calculation that stays submitted (2026-10-13 23:10 EDT): an abandoned edit still reopens on its result, the persistence the form's own header calls load-bearing. Calculate returns to page 0.
    if (state.page === 2) return [buildSetupPanel(state, basket, accentColor, { notice: options.notice, dropConfirm: options.dropConfirm, savedCount, seasonDraws: options.seasonDraws }), nav({ inForm: true })];
    const container = buildCostPage(state, basket, accentColor, options);
    return [container, nav({ inForm: true })];
}

// ==========================================
// SLASH ENTRY
// ==========================================
async function execute(interaction) {
    const userId = interaction.user.id;
    const prefs = await UserPreference.findOne({ discordId: userId });
    const basketStore = require('../utils/drawBasketStore');

    let argPrivate = null;
    let shortcut = { create: null, balance: null, notice: null };
    const state = { ...defaultState(), authorId: userId };
    let region = 'region_10';
    if (prefs?.defaultRegionMode && prefs.defaultRegionMode !== 'last_viewed') region = prefs.defaultRegionMode;
    else if (prefs?.defaultRegion) region = prefs.defaultRegion;

    if (interaction.isChatInputCommand()) {
        const visibilityChoice = interaction.options.getString('visibility');
        argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
        // `region`, `draw`, `pulls` and `balance` were unwired from the slash command 2026-10-17 23:38 EDT (commands/drawprices.js, addCalculatorShortcutOptions), so these reads return null and no shortcut runs. Kept so wiring them back is one call.
        const regionOption = interaction.options.getString('region');
        if (regionOption && REGION_ORDER.includes(regionOption)) region = regionOption;
        shortcut = slashShortcut({
            draw: interaction.options.getString('draw'),
            pulls: interaction.options.getInteger('pulls'),
            balance: interaction.options.getInteger('balance'),
            region
        });
    }

    const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'calculatorVisibility' });
    if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

    const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
    const savedBaskets = await basketStore.listForUser(userId);
    // 🔴 REOPEN THE LAST CALCULATION (2026-10-13 12:40 EDT). This always opened an empty form, and listForUser lists NAMED calculations only -- so an unsaved result could not be reached again once its message scrolled away, which broke the "persists until New Calculation" promise the setup form was approved on. A calculation reopened this way shows exactly what it was: the result if it was calculated, the form with its draws if not. The shortcut's new calculation wins over reopening the last one; a bare `balance` is written onto whichever opens (a fresh draft when there is none, so it is not lost).
    let latest = shortcut.create ? await basketStore.save(userId, shortcut.create) : await basketStore.latestForUser(userId);
    if (shortcut.balance !== null) latest = latest ? await basketStore.save(userId, { _id: latest._id, balance: shortcut.balance }) : await basketStore.save(userId, { banners: [], region, balance: shortcut.balance });
    const openState = latest ? { ...state, basketId: String(latest._id) } : state;
    // `page:` (2026-10-17 23:51 EDT, Harkirat). Help opened from the command IS the message, so it carries an Open Calculator button that turns this message into the calculator (verb `page`, the last calculation or the landing); after that, the calculator's own Help button opens its private copy as usual. View Saved is page 3; Start a Calculation is the landing, leaving the last calculation saved.
    const pageChoice = interaction.isChatInputCommand() ? interaction.options.getString('page') : null;
    if (pageChoice === 'help') {
        const help = buildHelpPanel(accentColor, { region: latest?.region || region, drawKey: latest?.banners?.[0]?.drawKey || 'mythicWeapon', currency: prefs?.cpCurrency || 'USD', client: interaction.client });
        const openRow = { type: 1, components: [{ type: 2, style: 2, label: 'Open Calculator', emoji: emojis.parseEmoji(emojis.calculator), custom_id: encodeState('page', { ...openState, page: 0 }) }] };
        return sendV2Payload(interaction, [help, openRow], { skipExpiry: true });
    }
    const viewState = pageChoice === 'saved' ? { ...openState, page: 3 } : pageChoice === 'start' ? state : openState;
    const viewBasket = pageChoice === 'start' ? null : latest;
    const panel = buildCalculatorPanel(viewState, viewBasket, accentColor, {
        savedBaskets, region, notice: shortcut.notice, seasonDraws: await listSeasonDraws(),
        currency: prefs?.cpCurrency || 'USD',
        client: interaction.client,
        liveDoubleCPEntry: viewBasket && viewBasket.submitted ? await findLiveDoubleCPEntry() : null
    });

    // skipExpiry (spec decision 7, "never expires"): re-derived 2026-08-27 against sendV2Payload's own bar -- "nothing on this panel can go stale". It holds. Every control is author-locked and re-reads the calculation from Mongo on each click, so a panel found hours later rebuilds from live data rather than showing a frozen view; and a component click is its own interaction with its own fresh 15-minute token, so editing this message never runs out of runway the way a single long-lived token would. No Show Everyone row (2026-10-14 18:34 EDT, Harkirat: "remove show everyone component"): Export shares the result as text instead, and the freed row is two more components for the form.
    return sendV2Payload(interaction, panel, { skipExpiry: true });
}

module.exports = {
    encodeState, decodeState, defaultState, clampFocus,
    buildCalculatorPanel, buildSetupPanel, buildMissingBasketPanel, buildExportText, buildDrawInfoPanel, buildHelpPanel, buildSavedPanel, savedChecksum, savedDescription,
    buildCostBlock, entryFor, regionsWithData, usedTypes, groupForDisplay,
    isDoubleCPEventLive, findLiveDoubleCPEntry, execute,
    parseAmount, parseCount, readBalanceFields, applySelection, shortName, SHORT_NAME, slashShortcut,
    buildUpgradeModal, readUpgradeModal, upgradeControls, balanceLabel,
    setTypeCount, SETUP_CONTAINER_BUDGET, SETUP_JSON_BUDGET, MAX_LINES, MAX_SAVED, linePages,
    CALC_KEYS, metaOf, unitOf, lineName, freshLine, buildProgressPanel, buildSpinsInModal, readSpinsIn, listSeasonDraws, selectionSummary
};
