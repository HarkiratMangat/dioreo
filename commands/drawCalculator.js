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
const { DRAW_META, REGION_ORDER, REGION_EMOJI_KEY, PRESET_ACCENT, UPGRADE_LABEL } = require('./drawprices');
const { pullCount, upgradeCost, remainingToFinish, spentSoFar, basketCost } = require('../utils/drawCost');
const crypto = require('crypto');
const { CP_PACKAGES, STOCK_UP_RULES, normalCp, priceCents, formatMoney, optimizePurchase } = require('../utils/cpPackages');
const { buildTitleBlock, toBoldItalicUnicode } = require('../utils/titleBlock');

// 📝 PLAYER-FACING VOCABULARY, decided by Harkirat 2026-08-27 after three rounds of rejected candidates. The saved thing is a **calculation** (his own word: "reset/new calculation"); one row in it is a **line** (provisional -- he expects to revisit it). Both replace "basket"/"banner": "banner" collides with Discord profile banners, and every container metaphor (basket/cart/plan/list) read wrong because the player is PURCHASING and budgeting, not collecting. INTERNAL identifiers (DrawBasket, drawBasketStore, `basket`, `banners`) deliberately keep the old names -- renaming the model would churn PRIVACY.md, the store, and every test for something no user can see. Only strings a player reads are in scope here.
const DRAW_KEYS = Object.keys(DRAW_META);
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
function drawName(drawKey) { return DRAW_META[drawKey]?.name || `Unrecognized draw (${drawKey})`; }

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
    doubleEpicCharacters: 'Double Epic Characters'
};
function shortName(drawKey) { return SHORT_NAME[drawKey] || drawName(drawKey); }
// A draw that HAS an upgrade somewhere -- the toggle is meaningful for it even at a region with no upgrade price yet, because that gap is exactly what the cost block has to say out loud.
function hasUpgradeAnywhere(drawKey) { return REGION_ORDER.some(r => upgradeCost(r, drawKey) !== null); }

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
    return Math.floor(k ? n * 1000 : n);
}

// The picker's FULL selection is the set of draws to keep: lines of an unticked draw go, a newly ticked draw gets one fresh line at 0 pulls, every other line keeps its place and progress.
function applySelection(banners, selected) {
    const present = new Set(banners.map(b => b.drawKey));
    const kept = banners.filter(b => selected.has(b.drawKey));
    for (const key of selected) if (!present.has(key)) kept.push({ drawKey: key, pullsDone: 0 });
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
        notes.push(`${shortName(draw)} has ${total} Items, so ${pullsDone} was set to ${total}.`);
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
        list.splice(at, 0, ...Array.from({ length: count - idx.length }, () => ({ drawKey, pullsDone: 0 })));
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
    if (drawKey === 'mythicWeapon') return emojis.mythicCard;
    if (drawKey === 'mythicCharacter') return emojis.mythicCoin;
    return null;
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
    for (const b of banners || []) {
        const last = groups[groups.length - 1];
        if (last && last.drawKey === b.drawKey && last.pullsDone === b.pullsDone) last.count++;
        else groups.push({ drawKey: b.drawKey, pullsDone: b.pullsDone, count: 1 });
    }
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
            min_values: 0, max_values: DRAW_KEYS.length,
            options: DRAW_KEYS.map(key => {
                return {
                    label: shortName(key),
                    value: key,
                    description: freshDrawDescription(basket.region, key),
                    emoji: emojis.parseEmoji(emojis[DRAW_META[key].tier]),
                    default: present.has(key)
                };
            })
        }]
    };
}

// Page 2's per-banner pulls-done dropdown. 🔴 The placeholder is REPLACED by the chosen option once picked, so without a banner number in every option a set dropdown stops saying which banner it belongs to (spec §2, found live) -- every option and the placeholder both carry `#N`. `f` here carries WHICH banner index this specific select edits, not the reorder pointer -- a per-control target, scoped to this one customId, distinct from the reorder focus stored across renders. `removable` ends the dropdown with the line's own Remove option.
function bannerPullsRow(state, basket, index, { removable = false } = {}) {
    const banner = basket.banners[index];
    const total = pullCount(basket.region, banner.drawKey);
    const meta = DRAW_META[banner.drawKey] || { name: drawName(banner.drawKey), tier: null };
    const rowState = { ...state, focus: index };
    if (total === null) {
        return { type: 1, components: [{
            type: 3, custom_id: encodeState('bpulls', rowState), placeholder: `#${index + 1} ${shortName(banner.drawKey)} · no data at this region`,
            options: [{ label: 'No data at this region', value: '0', default: true }], disabled: true
        }] };
    }
    const options = [];
    const icon = meta.tier ? emojis.parseEmoji(emojis[meta.tier]) : undefined;
    // The action FIRST (2026-10-13 23:01 EDT, his intake: "make the \"remove\" line the first item"), then the progress values. Its mark is an emoji like the tier badge, not an "✕" typed into the label, and it reads "Remove this Selection" (2026-10-14 13:13 EDT, Harkirat). Move Up is gone with the order it changed: nothing but a running total ever read the order (2026-10-14 13:13 EDT, his call: "let's remove it for now").
    if (removable) {
        // His own Cross emoji (2026-10-14 16:51 EDT), in place of the ✖️ character.
        options.push({ label: 'Remove this Selection', value: 'del', emoji: emojis.parseEmoji(emojis.cross), description: banner.pullsDone ? `Drops It and Its ${banner.pullsDone}/${total} Spins` : 'Takes It Out of This Calculation' });
    }
    for (let n = 0; n <= total && options.length < 25; n++) {
        // The draw's name rides in the LABEL (2026-10-13 12:40 EDT): a closed select shows only the chosen option's label.
        options.push({
            // Progress FIRST (2026-10-13 23:10 EDT): a closed select on a phone shows about 30 characters, and "#2 Legendary Weapon (Non-Reactive) — 7/10 Items" lost the progress, the one thing the line exists to set. "Spins" for a count of attempts, "Items" for what a draw holds (2026-10-14 13:13 EDT, Harkirat: "when generally refering to them, it's items, when referring to a specific count/attempts then spins"). The description gives both sides of the spend: what those spins cost, and what finishing costs from there. Only the CHOSEN value carries the line number and the draw (2026-10-14 13:16 EDT): a closed select shows only that one label, and in the open list the rest repeated "#1 · … · Legendary Weapon (Reactive)" eleven times. It also pays for the longer spend description inside Discord's message size cap, which is what keeps five lines a page.
            label: n === banner.pullsDone ? `#${index + 1} · ${n}/${total} Spins · ${shortName(banner.drawKey)}` : `${n}/${total} Spins`,
            value: String(n),
            description: `${fmt(spentSoFar(basket.region, banner.drawKey, n))} CP Spent · ${n === total ? 'Finished' : `${fmt(remainingToFinish(basket.region, banner.drawKey, n))} CP to Completion`}`,
            // The tier icon rides on the CHOSEN value only (2026-10-14 00:12 EDT): that is the option a closed select shows, and an icon on every value took six lines' dropdowns past Discord's message size limit (40005, measured 10,225 bytes of components).
            ...(icon && n === banner.pullsDone ? { emoji: icon } : {}),
            // `default` only on the chosen value: `default: false` on the other ten cost every line ~170 characters of Discord's size cap.
            ...(n === banner.pullsDone ? { default: true } : {})
        });
    }
    return { type: 1, components: [{ type: 3, custom_id: encodeState('bpulls', rowState), placeholder: `#${index + 1} ${shortName(banner.drawKey)}`, options }] };
}

// The draw picker once a calculation has lines (Harkirat chose this shape 2026-10-13 19:47 EDT, after trying three on the dev bot). Each draw ticked adds ONE line of it, placed right after that draw's existing lines, so ticking a draw you already have runs another of it; nothing is ever shown ticked, and removing lives in each line's own dropdown. It sits BELOW the lines: the list grows above the control that adds to it, and an empty form shows its first-pick picker in that same spot.
function addDrawsRow(state, basket) {
    const room = MAX_LINES - basket.banners.length;
    return { type: 1, components: [{
        type: 3, custom_id: encodeState('addmore', state),
        placeholder: room > 0 ? 'Add more draws to selection' : `Full: a calculation holds up to ${MAX_LINES} draws`,
        min_values: 1, max_values: Math.max(1, Math.min(DRAW_KEYS.length, room)), disabled: room <= 0,
        options: DRAW_KEYS.map(key => {
            const have = basket.banners.filter(b => b.drawKey === key).length;
            return {
                label: shortName(key), value: key,
                // The count leads (2026-10-14 16:51 EDT, Harkirat: "1x in your selection"). An option description is plain text in Discord: it cannot be bold.
                description: have ? `${have}× In Your Selection · Pick to Add Another` : freshDrawDescription(basket.region, key),
                emoji: emojis.parseEmoji(emojis[DRAW_META[key].tier])
            };
        })
    }] };
}
// One description for a draw nobody has started, shared by both pickers: what it holds and what it costs at this region, in Title Case, never its name again.
function freshDrawDescription(region, key) {
    const total = pullCount(region, key);
    if (total === null) return `No Data at ${regionLabel(region)} Yet`;
    const upgrade = upgradeCost(region, key);
    // No "·" before the upgrade (2026-10-14 16:51 EDT, Harkirat): the "+" already joins it to the total.
    return `${total} Items · ${fmt(remainingToFinish(region, key, 0))} CP Total${upgrade !== null ? ` + ${fmt(upgrade)} CP Upgrade` : ''}`.slice(0, 100);
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
// Room between blocks without a rule (his "more breathing room"): a separator with no divider.
const SPACER = { type: 14, spacing: 2, divider: false };
// "Your Selections" once there are two or more draws (2026-10-14 16:51 EDT, Harkirat).
function selectionHeading(banners) { return (banners || []).length >= 2 ? 'Your Selections' : 'Your Selection'; }

// The upgrade toggle shows only when a line's draw HAS an upgrade somewhere (2026-10-13 12:40 EDT). It used to show "Upgrade: NO" on a calculation of Legendary draws, which have none -- a control that could not change anything. Labels stay "Upgrade: YES / NO" (2026-10-13 15:21 EDT, Harkirat: "it's like super long... Yes, upgrade no"): the 2026-10-13 round had made them "Included / Not included", which he turned down as too long.
function upgradeButton(state, basket, extra = {}) {
    if (!(basket?.banners || []).some(b => hasUpgradeAnywhere(b.drawKey))) return null;
    const cardEmoji = usedTypes(basket.banners).map(upgradeCardEmoji).find(Boolean);
    return { type: 2, style: basket.includeUpgrades ? 3 : 2, label: basket.includeUpgrades ? 'Upgrade: YES' : 'Upgrade: NO', custom_id: encodeState('upg', state), ...(cardEmoji ? { emoji: emojis.parseEmoji(cardEmoji) } : {}), ...extra };
}

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

// NO EMOJI on either button (2026-08-27, Harkirat) -- `mngEdit` was a pencil paired with a button labelled "Save", which never matched, and a destructive action reads clearer without decoration. Rename doubles as "Save" for an unnamed basket -- naming it IS the save, since that is the one thing that exempts a basket from the 30-day TTL (models/DrawBasket.js). Delete is two-step, same pattern as Reset below -- one misclick must never destroy a named basket (plan Task 5's own verify requirement).
function basketManageRow(state, basket) {
    // Balance and Upgrade side by side (2026-10-14 16:51 EDT, Harkirat: "move upgrade button beside the Set balance button"). Save, Rename and Delete moved to the Saved view, where the calculation's own section manages it (2026-10-14 16:51 EDT).
    return { type: 1, components: [
        { type: 2, style: 2, label: basket.balance ? `Balance: ${fmt(basket.balance)} CP` : 'Set Balance', custom_id: encodeState('modal', state), emoji: emojis.parseEmoji(emojis.cp2) },
        upgradeButton(state, basket)
    ].filter(Boolean) };
}

// 🔴 RETURNED AS A TOP-LEVEL SIBLING of the Container, never pushed inside it (fixed 2026-08-27) -- it was rendering as a child, which boxes the nav inside the panel's accent border instead of sitting under it the way every other command in this bot places its nav. buildCalculatorPanel is the ONE place that attaches it; do not push it into a page builder's `components`. Replaces buildGlobalNavRow entirely (Task 9) -- Draw Info and Help are the calculator's own ephemeral panels, Draw Prices is the one cross-link back to the sibling command, Reset is two-step (Danger style once armed) exactly like Delete Basket above, and clears basket, balance, focus and page (spec §9) without deleting the basket document itself. `showReset` is false on the setup form: there is no computed result to clear yet, and a live button that does nothing visible is worse than an absent one. On a submitted calculation it reads "New Calculation" -- Harkirat's own phrase for the action that ends a result's persistence and returns to the form. Draw Prices · New Calculation · Help (2026-10-13 23:01 EDT, his intake: Draw Info removed, since /draw prices shows the same draws; New Calculation on EVERY page once there is something to clear, where it used to appear only on the result). "View Saved", no counter (2026-10-14 17:58 EDT, Harkirat).
function savedButton(state) {
    return { type: 2, style: 2, label: 'View Saved', custom_id: encodeState('saved', state), emoji: emojis.parseEmoji(emojis.viewSaved) };
}
function newCalculationButton(state) {
    const armed = state.verb === 'resetarm';
    return { type: 2, style: armed ? 4 : 2, label: armed ? 'New Calculation — click again' : 'New Calculation', custom_id: encodeState(armed ? 'reset' : 'resetarm', state) };
}
// `inForm`: on the form, Saved and New Calculation sit in its own Calculate row (2026-10-14 16:51 EDT, Harkirat: "move calculate down to its own action row, with a divider above it. Move New calculation and saved into that same row"), so the nav keeps only Draw Prices and Help there.
// The Saved view's and the Save step's footer (2026-10-16 11:19 EDT, Harkirat: "put the 'back' button inside of the embed as a footer button. reworded to 'Back to Calculation'. With a button beside it for 'New Calculation'", and "use the left arrow we use for pagination").
function savedFooterRow(state) {
    return { type: 1, components: [
        { type: 2, style: 2, label: 'Back to Calculation', custom_id: encodeState('back', state), emoji: emojis.parseEmoji(emojis.left) },
        newCalculationButton(state)
    ] };
}
function bottomNavRow(state, { showReset = true, savedCount = 0, onSaved = false, inForm = false } = {}) {
    // Its own private message (2026-10-13 12:40 EDT) -- it used to be the global nav's `nav_prices`, which turned THIS panel into /draw prices in place.
    const components = [{ type: 2, style: 2, label: 'Draw Prices', custom_id: encodeState('prices', state) }];
    // Saved calculations are their own view of this same message (2026-10-14 13:19 EDT, Harkirat's "surface switch"). On that view the slot reads Back.
    // On the Saved view and the Save step the way back lives INSIDE the panel as a footer row (2026-10-16 11:19 EDT, savedFooterRow), so the nav keeps only Draw Prices and Help there.
    if (!onSaved && !inForm) {
        components.push(savedButton(state));
        if (showReset) components.push(newCalculationButton(state));
    }
    components.push({ type: 2, style: 2, label: 'Help', custom_id: encodeState('help', state) });
    return { type: 1, components };
}

// The setup form's balance row: Set Balance with Upgrade beside it (2026-10-14 16:51 EDT). Both are disabled until a draw exists, because both write to a calculation document that does not exist yet and would otherwise accept input and silently discard it.
function setupBalanceRow(state, basket) {
    const hasBasket = Boolean(basket && basket._id);
    return { type: 1, components: [
        { type: 2, style: 2, disabled: !hasBasket, custom_id: encodeState('modal', state), emoji: emojis.parseEmoji(emojis.cp2),
          label: basket?.balance ? `Balance: ${fmt(basket.balance)} CP` : 'Set Balance' },
        (basket?.banners?.length ? upgradeButton(state, basket, { disabled: !hasBasket }) : null)
    ].filter(Boolean) };
}
// Order New Calculation · View Saved · Calculate (2026-10-14 17:58 EDT, Harkirat: "move new calc button to the front of the row. saved in middle. calculate last"). The form's last row, under its own divider (2026-10-14 16:51 EDT): Calculate (the ONLY Primary button in this command, with his Sparkles emoji), then New Calculation once there is something to clear, then Saved.
function setupSubmitRow(state, basket, savedCount) {
    const lines = basket?.banners?.length || 0;
    return { type: 1, components: [
        lines ? newCalculationButton(state) : null,
        savedButton(state),
        { type: 2, style: 1, label: 'Calculate', custom_id: encodeState('submit', state), disabled: lines === 0, emoji: emojis.parseEmoji(emojis.sparkles) }
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
    const { total: needed, perBanner } = basketCost(basket.region, basket.banners, basket.includeUpgrades);
    const shortfall = needed - (basket.balance || 0);
    const clean = t => String(t).replace(/[`*_~|]/g, '');
    const out = [`## Lucky Draw Calculation${basket.name ? `: ${clean(basket.name)}` : ''}`];
    out.push(`-# ${regionLabel(basket.region)} region · Upgrade ${basket.includeUpgrades ? 'included' : 'not included'}`);
    out.push('', '**Draws**');
    let spentAll = 0;
    for (const g of groupForDisplay(basket.banners)) {
        const one = perBanner.find(b => b.drawKey === g.drawKey && b.pullsDone === g.pullsDone);
        const total = pullCount(basket.region, g.drawKey);
        const name = `${shortName(g.drawKey)}${g.count > 1 ? ` ×${g.count}` : ''}`;
        if (!one || !one.priced || total === null) { out.push(`- ${name}: ${g.pullsDone} Spins · no price at this region`); continue; }
        const spent = (spentSoFar(basket.region, g.drawKey, g.pullsDone) || 0) * g.count;
        spentAll += spent;
        const finish = (one.cost - (one.upgrade || 0)) * g.count;
        const left = total - g.pullsDone;
        out.push(`- **${name}**: ${g.pullsDone}/${total} Spins · ${left ? `${left} left · ${fmt(finish)} CP to finish` : 'finished'}${spent ? ` · ${fmt(spent)} CP spent` : ''}`);
        if (one.upgrade) out.push(`  - Upgrade: + ${fmt(one.upgrade * g.count)} CP`);
        else if (basket.includeUpgrades && hasUpgradeAnywhere(g.drawKey)) out.push('  - Upgrade: no price at this region yet, so not included');
    }
    out.push('', `**CP Needed:** ${fmt(needed)} CP${spentAll ? ` (${fmt(spentAll)} CP already spent)` : ''}`);
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
// The COMPACT cost block only, since Harkirat's Full Breakdown layout (2026-10-16) renders the detail view through breakdownCostLines.
function buildCostBlock(state, basket, currency, client) {
    const dot = emojis.smallDot;
    const dash = emojis.blueDash;
    const { total: needed, perBanner } = basketCost(basket.region, basket.banners, basket.includeUpgrades);
    const unpriced = perBanner.filter(b => !b.priced);
    const shortfall = needed - (basket.balance || 0);

    // 🔴 CP NEEDED LEADS. This block used to open with "Draws in basket: 2" and put the one number the whole command exists to produce THIRD -- the eye landed on a count nobody asked for. The count itself is gone: the DRAWS IN PROGRESS list sits directly above and already shows every line. CP Needed is the block's own heading (2026-10-14 16:51 EDT, Harkirat: "move CP needed into a ### heading"). No Balance or Region line (2026-10-14 13:19 EDT): the button and the toggle show both. What the balance CHANGES is on no button, so it stays, as one quiet line.
    const lines = [`## Cost Breakdown`, `### CP Needed: \`${fmt(needed)} CP\``];
    if (basket.balance && shortfall > 0) lines.push(`-# **${fmt(shortfall)} CP** still to buy after your ${fmt(basket.balance)} CP balance.`);
    if (unpriced.length) {
        lines.push(`⚠️ **${plural(unpriced.length, 'line')} excluded** — no sourced pricing at ${regionLabel(basket.region)}: ${unpriced.map(b => shortName(b.drawKey)).join(', ')}.`);
    }
    // 🔴 A SILENT ZERO, FOUND 2026-10-13 12:40 EDT. Mythic draws have no upgrade price at the 20 CP region, so "Upgrade: Included" added nothing there while the button claimed it was in the total. Say so instead.
    const upgradeMissing = basket.includeUpgrades ? perBanner.filter(b => b.priced && b.upgrade === null && hasUpgradeAnywhere(b.drawKey)) : [];
    if (upgradeMissing.length) {
        lines.push(`⚠️ **Upgrade not included** for ${[...new Set(upgradeMissing.map(b => shortName(b.drawKey)))].join(', ')} — no upgrade price at ${regionLabel(basket.region)} yet.`);
    }

    // Two different "nothing to buy" states (2026-10-13 12:40 EDT): every line already finished, and a balance that covers what is left. The first used to say "Your balance already covers this" with no balance set at all.
    if (needed === 0 && !unpriced.length) {
        lines.push('');
        lines.push('✅ **Every draw here is finished** — nothing left to buy.');
        return lines;
    }
    if (shortfall <= 0) {
        lines.push('');
        lines.push(`✅ **Your balance covers this**, with **\`${fmt(-shortfall)} CP\`** to spare.`);
        return lines;
    }

    const doubleCpAvailable = CP_PACKAGES.filter((p, i) => (basket.entitlementMask & (1 << i)) !== 0).map(p => p.id);
    const result = optimizePurchase(shortfall, { currency, doubleCpAvailable });
    if (!result || !result.cheapest) {
        lines.push('');
        lines.push(`⚠️ **${fmt(shortfall)} CP** is more than a reasonable number of store purchases can cover at once.`);
        return lines;
    }
    const describeCp = r => r.combo.map(c => `**${c.count}×** ${fmt(c.cpEach)} CP${c.mode === 'double' ? ' (2X)' : ''}`).join(' + ');
    // ONE SHAPE FOR EVERY PACKAGE, in both views (2026-10-14 16:51 EDT, Harkirat: "better structure that section that mentions the cost, the packages, the left over CP. Class, not instance"): the price and the packs on a quoted line, then one quiet line of what is bought and left over. The Full Breakdown has its own layout (breakdownCostLines). A label ("Cheapest", "Stock Up") shows only when there are two options to tell apart: "no point stating Cheapest when no other option is being presented".
    const settingsMention = client ? mentionCommand(client, '/settings') : '`/settings`';
    const option = (label, r, extra = null) => [
        ...(label ? [`**${label}**`] : []),
        `> **\`${formatMoney(r.totalCents, currency)}\`** for ${describeCp(r)}`,
        `-# ${fmt(r.totalCp)} CP Bought · ${fmt(r.leftoverCp)} CP Left Over${extra ? ` · ${extra}` : ''}`
    ];
    // "Bundle" everywhere (2026-10-16 01:20 EDT, Harkirat "yes" to matching his Full Breakdown's word): the compact view, Help, Export and the 2X select all say bundle now.
    lines.push('### Recommended Bundle');
    lines.push(...option(null, result.cheapest));
    // A blank line between the two options (click-test 2026-10-14 18:56 EDT): without it "Stock Up" sat flush against Cheapest's last line and read as part of it. A bold label is not a heading, so the blank line does not stack a heading margin.
    // The currency line shows in BOTH views (2026-10-13 12:40 EDT): a player outside the US must see which currency these are, and where to change it.
    lines.push(`-# Prices in **${currency}** · change in ${settingsMention}`);
    return lines;
}

// ==========================================
// PAGES
// ==========================================
// A saved calculation's name gets its own line under the title (2026-10-14 13:13 EDT, Harkirat: "Maybe put it in a 2nd line? '> ### Viewing Saved: `the name`'"). A backtick in a name would end the code span early, so it is swapped for a plain quote here only. Same style as the Season Calendar's season line (2026-10-14 16:51 EDT, Harkirat): utils/titleBlock.js's caption in bold-italic letters. A backtick in a name is swapped for a plain quote so it cannot open a code span.
function titleBlock(basket) {
    // The name sits in a code span after the styled caption (2026-10-16 09:59 EDT, Harkirat: "wrap the saved calc's name in backticks for 'viewing saved: `name`'").
    if (basket && basket.name) return { type: 10, content: `## ${emojis.calculator} Lucky Draw Calculator\n${toBoldItalicUnicode('Viewing Saved:')} \`${String(basket.name).replace(/`/g, "'")}\`` };
    // A working copy shows NO "Edited from Saved" line any more (2026-10-16 09:59 EDT, Harkirat: "when a saved calc is changed/edits, just remove the 'edited from saved' line because at that point it's basically a new calc that the user would save anyway"). `sourceName` still reaches the Saved view and the Save step, which offer saving over the original.
    return { type: 10, content: `## ${emojis.calculator} Lucky Draw Calculator` };
}

// ==========================================
// THE SETUP FORM -- the first screen, and the one the whole command now leads FROM
// ==========================================
// 🔴 THIS REVERSES THIS COMMAND'S OWN "never a setup form again" RULE, deliberately (Harkirat, 2026-08-27). That rule came from a single-draw panel where five interactions preceded any figure AT ALL, every single visit. Two things make this different, and both are load-bearing rather than cosmetic:
//   1. ONE screen. The saved-calculations list and the form share it -- loading an old calculation and starting a new one are both one interaction from opening the command, never a hop apart.
//   2. IT PERSISTS. Pressing Calculate sets `submitted` on the basket document, so the result is what you come back to -- until you press New Calculation. The form is filled in once, not on every visit.
// If either of those is ever removed, this is the old failure again and the old rule should come back.
function buildSetupPanel(state, basket, accentColor, { region, notice = null, dropConfirm = null, savedCount = 0 } = {}) {
    // A shim, so every row builder below works identically whether a draft document exists yet or not.
    const draft = basket || { banners: [], region: region || 'region_10', balance: 0, includeUpgrades: false };
    const banners = draft.banners || [];
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];
    if (notice) components.push({ type: 10, content: `-# ${notice}` });

    // The saved-calculations loader left this screen for its own view (2026-10-14 13:13 EDT, Harkirat's footer-button idea, built as a view of this message rather than a popup): the nav row's Saved button reaches it from every screen, so a first-timer still sees that saving exists. Headings name what each block is FOR, with one short hint each (2026-10-14 00:08 EDT and 2026-10-14 13:13 EDT, Harkirat: "Start a Calculation" on the empty screen; "## Your Selection" over "### Set Current Attempts" once there are lines; Title Case, as every heading in the calculator). "Your Selections" from two draws up, and "Adjust Partial Completion" (2026-10-14 16:51 EDT, Harkirat).
    components.push({ type: 10, content: banners.length
        ? `## ${selectionHeading(banners)}\n### Adjust Partial Completion\n-# Set how many spins you've already performed on each draw. \`0\` means draw is unattempted.`
        : '## Start a Calculation\n-# Pick all the draw types you want to calculate. You can add more later.' });
    // The untick confirm replaces the picker here too (2026-10-13 12:43 EDT). With lines, the picker moves below them as "Add more draws to selection" (addDrawsRow).
    if (dropConfirm) components.push(dropConfirmRow(state, dropConfirm.mask, dropConfirm.count, dropConfirm.verb, dropConfirm.label));
    else if (!banners.length) components.push(typesSelectRow(state, draft));

    // No heading and no divider before the region row (2026-10-14 13:13 EDT, his intake); a spacer keeps the room the divider gave. The "Tweak Calculation" heading's own top margin replaces the spacer that sat here (2026-10-14 17:59 EDT); keeping both cost the component that keeps five lines a page.
    const tail = [regionCaption(), regionRow(state, draft), setupBalanceRow(state, basket), { type: 14, spacing: 2, divider: true }, setupSubmitRow(state, basket, savedCount)];
    // Builds the middle of the form at one lines-per-page: the lines, the pager, then the add picker under its own heading.
    const build = perPage => {
        const pages = linePages(banners, perPage);
        const bpage = Math.min(state.bpage || 0, pages.length - 1);
        const mid = pages[bpage].map(i => bannerPullsRow(state, draft, i, { removable: true }));
        if (pages.length > 1) mid.push(pageNavRow({ ...state, bpage }, pages.length));
        if (banners.length && !dropConfirm) {
            // A sub-heading of the selection, worded as the action (2026-10-14 16:51 EDT, Harkirat: "should be ###. also reword to add more draws"). Room above it (2026-10-14 17:58 EDT, Harkirat: "add some space above the add more draws heading").
            mid.push({ type: 14, spacing: 1, divider: false });
            mid.push({ type: 10, content: '### Add More Draws\n-# Select more draw types or add more of the same type to calculate multiple at the same time.' });
            mid.push(addDrawsRow(state, draft));
        }
        return [...components, ...mid, ...tail];
    };
    // Fewer lines per page until it fits.
    let out = [];
    for (let perPage = SETUP_LINES_PER_PAGE; perPage >= 1; perPage--) {
        out = build(perPage);
        if (1 + countComponents(out) <= SETUP_CONTAINER_BUDGET && JSON.stringify(out).length <= SETUP_JSON_BUDGET) break;
    }
    return { type: 17, accent_color: accentColor, components: out };
}

// ==========================================
// THE SAVED VIEW -- a view of this same message, reached from the nav row's Saved button (2026-10-14 13:13 EDT)
// ==========================================
// His intake asked how a calculation is removed, what the limit is, and what happens at it; the answer was "one at a time, from a result page, named ones only, no limit, and the loader silently showed only the first 25". This view is where all of that lives now: reopen one, delete several, or delete them all. What a saved calculation IS, in its option (his "they barely hold any info"): what it still costs, the region, and its draws; "Draft" when it was never calculated. Cut at Discord's 100 characters.
function savedDescription(b) {
    const banners = b.banners || [];
    if (!banners.length) return 'Empty';
    const { total } = basketCost(b.region, banners, b.includeUpgrades);
    const draws = usedTypes(banners).map(k => { const n = banners.filter(x => x.drawKey === k).length; return `${shortName(k)}${n > 1 ? ` ×${n}` : ''}`; }).join(', ');
    const text = `${b.submitted ? '' : 'Draft · '}${fmt(total)} CP Needed · ${regionLabel(b.region)} · ${draws}`;
    return text.length > 100 ? `${text.slice(0, 99)}…` : text;
}
function savedEmoji(b) {
    const key = (b.banners || []).map(x => x.drawKey).find(k => DRAW_META[k]);
    return key ? emojis.parseEmoji(emojis[DRAW_META[key].tier]) : undefined;
}
function lastChanged(b) {
    const d = new Date(b.updatedAt || b.createdAt || 0);
    return Number.isNaN(d.getTime()) || d.getTime() === 0 ? null : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
// A checksum of the list a delete was picked from (see encodeState's `k`).
function savedChecksum(list) {
    return crypto.createHash('sha1').update((list || []).map(b => String(b._id)).join(',')).digest('hex').slice(0, 6);
}

// THE SAVE STEP (page 4, 2026-10-14 17:28 EDT): what Save opens. A saved calculation is only ever changed here, deliberately: save the open calculation as a new one, or pick a saved one and confirm saving over it (Harkirat: "a user needs to press save and select that previous saved result to override it"). The one it was opened from, if any, is marked in the list.
function buildSaveStepPanel(state, savedBaskets, accentColor, { notice = null, current = null, overwriteConfirm = null } = {}) {
    const list = (savedBaskets || []).slice(0, MAX_SAVED);
    const view = { ...state, page: 4 };
    const components = [titleBlock(current), { type: 14, spacing: 2, divider: true }];
    if (notice) components.push({ type: 10, content: `-# ${notice}` });
    // Copy reworked 2026-10-16 11:14 EDT (Harkirat: "better phrase ... and add some bold text to it's hint"; placeholder "Or replace a previously saved calculation..."; the count line "could also be designed better itself. and include a small space divider there").
    components.push({ type: 10, content: `## Save This Calculation\n-# **Save as New** keeps it as its own calculation, or **replace** one you saved before.` });
    if (overwriteConfirm) {
        components.push({ type: 1, components: [
            { type: 2, style: 4, label: `Save Over "${String(overwriteConfirm.name).slice(0, 60)}"`, custom_id: encodeState('owok', { ...view, target: overwriteConfirm.target }) },
            { type: 2, style: 2, label: 'Keep It', custom_id: encodeState('savepick', view) }
        ] });
    } else {
        components.push({ type: 1, components: [
            { type: 2, style: 1, label: 'Save as New', custom_id: encodeState('modal_name', view), emoji: emojis.parseEmoji(emojis.saveStar) },
            { type: 2, style: 2, label: 'Cancel', custom_id: encodeState('saved', { ...state, page: 3 }) }
        ] });
        if (list.length) {
            components.push({ type: 1, components: [{
                type: 3, custom_id: encodeState('owsel', view), placeholder: 'Or replace a previously saved calculation...',
                options: list.map(b => ({ label: String(b.name).slice(0, 100), value: String(b._id), description: current && String(current.sourceId) === String(b._id) ? 'Opened From This One' : cutText(savedDescription(b), 60), ...(savedEmoji(b) ? { emoji: savedEmoji(b) } : {}) }))
            }] });
        }
    }
    components.push({ type: 14, spacing: 1, divider: false }, { type: 10, content: `-# **${list.length} of ${MAX_SAVED}** saved${list.length ? ' · Replacing one overwrites its draws, spins, region, balance and upgrade setting.' : ''}` });
    components.push(savedFooterRow(state));
    return { type: 17, accent_color: accentColor, components };
}
function cutText(text, n) { return text.length > n ? `${text.slice(0, n - 1)}…` : text; }

// Two 25-option dropdowns of long names can pass Discord's message size cap on their own (measured 2026-10-14 13:16 EDT: 14,001 characters of JSON at 25 calculations with 80-character names), so the view gives up detail in steps until it fits: the delete list's descriptions first, then the reopen list's descriptions are cut shorter, then the delete list's names. A player with short names never loses any of it.
function buildSavedPanel(state, savedBaskets, accentColor, options = {}) {
    let out;
    for (let level = 0; level <= 3; level++) {
        out = buildSavedPanelAt(state, savedBaskets, accentColor, options, level);
        if (JSON.stringify(out).length <= SETUP_JSON_BUDGET) break;
    }
    return out;
}
function buildSavedPanelAt(state, savedBaskets, accentColor, { notice = null, savedConfirm = null, current = null } = {}, level = 0) {
    const list = (savedBaskets || []).slice(0, MAX_SAVED);
    const cut = (text, n) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);
    const view = { ...state, page: 3 };
    const components = [titleBlock(current), { type: 14, spacing: 2, divider: true }];
    if (notice) components.push({ type: 10, content: `-# ${notice}` });
    // The calculation this message has open, managed at the top (2026-10-14 16:51 EDT, Harkirat: "if viewing a saved calc and then the saved button is tapped, it should show a section at the top of it with options to edit that saved option such as renaming it, deleting it"). Rename and Delete left the result for here; an unsaved one is saved from here.
    if (current && current.name) {
        const armed = state.verb === 'delarm';
        components.push({ type: 10, content: `## This Calculation\n-# Rename it, or delete it from your saved calculations.` });
        components.push({ type: 1, components: [
            { type: 2, style: 2, label: 'Rename', custom_id: encodeState('modal_name', view) },
            { type: 2, style: armed ? 4 : 2, label: armed ? 'Delete Calculation — click again' : 'Delete Calculation', custom_id: encodeState(armed ? 'del' : 'delarm', view) }
        ] });
        components.push({ type: 14, spacing: 2, divider: true });
    } else if (current && (current.banners || []).length) {
        // Save opens the save step (2026-10-14 17:28 EDT): save it as a new one, or pick a saved calculation to save over.
        components.push({ type: 10, content: current.sourceName
            ? `## This Calculation\n-# Edited from **${current.sourceName}**, which is unchanged until you save over it.`
            : `## This Calculation\n-# Not saved yet. Save it to keep it here; an unsaved one is cleared 30 days after it was started.` });
        components.push({ type: 1, components: [{ type: 2, style: 2, label: 'Save', custom_id: encodeState('savepick', view), emoji: emojis.parseEmoji(emojis.saveStar) }] });
        components.push({ type: 14, spacing: 2, divider: true });
    }
    components.push({ type: 10, content: `## Saved Calculations\n-# ${list.length ? 'Reopen a saved calculation.' : 'None saved yet. Press **Save** on a result to keep it here.'}` });
    components.push({ type: 1, components: [list.length ? {
        type: 3, custom_id: encodeState('load', view), placeholder: `Reopen a saved calculation (${list.length})`,
        options: list.map(b => ({ label: String(b.name).slice(0, 100), value: String(b._id), description: level >= 2 ? cut(savedDescription(b), 60) : savedDescription(b), ...(savedEmoji(b) ? { emoji: savedEmoji(b) } : {}) }))
    } : {
        type: 3, custom_id: encodeState('load', view), placeholder: 'No saved calculations yet', disabled: true,
        options: [{ label: 'No saved calculations yet', value: 'none' }]
    }] });
    if (list.length) {
        components.push(SPACER);
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
                options: list.map(b => ({ label: level >= 3 ? cut(String(b.name), 40) : String(b.name).slice(0, 100), value: String(b._id), ...(level >= 1 ? {} : { description: `${plural((b.banners || []).length, 'Draw')}${lastChanged(b) ? ` · Last Changed ${lastChanged(b)}` : ''}` }) }))
            }] });
        }
        const armed = state.verb === 'delallarm';
        components.push({ type: 1, components: [{ type: 2, style: armed ? 4 : 2, label: armed ? `Delete All (${list.length}) — click again` : 'Delete All', custom_id: encodeState(armed ? 'delall' : 'delallarm', view) }] });
    }
    components.push({ type: 10, content: `-# ${list.length}/${MAX_SAVED} saved. An unsaved calculation is cleared 30 days after it was started.` });
    components.push(savedFooterRow(state));
    return { type: 17, accent_color: accentColor, components };
}

function buildMissingBasketPanel(state, accentColor, savedCount = 0) {
    return buildSetupPanel({ ...state, basketId: null }, null, accentColor, {
        savedCount,
        region: 'region_10',
        notice: '⚠️ That saved calculation no longer exists — it may have expired, or been deleted.'
    });
}

// FULL BREAKDOWN -- Harkirat's own layout (2026-10-16 01:11 EDT, "Can we try this rough layout format i made for the full breakdown?"). Every line on its own row with what it costs in full, then what is spent and what is left; CP still needed as a sum the player can check (cost of draws - spent - balance), each term itemised per row; then the bundles. Simplify keeps the old compact view untouched.
// `level` keeps it inside Discord's message limits at many lines: 0 = one row per line, 1 = adjacent identical lines share a row ("#1–#3"), 2 = those shared rows without their spent/remaining note, 3 = the two sums show their totals without the per-row terms, 4 = one row per draw TYPE (every line of it summed, spins as done/total across them), which caps the rows at the number of draw types. Discord refuses a message whose text displays add up to more than 4,000 characters (COMPONENT_DISPLAYABLE_TEXT_SIZE_EXCEEDED, probed 2026-10-16 01:12 EDT); 25 distinct lines at level 2 measured 4,974.
const BREAK = ' ⌇ ';
function lineFigures(basket) {
    return (basket.banners || []).map((b, i) => {
        const left = remainingToFinish(basket.region, b.drawKey, b.pullsDone);
        const priced = left !== null;
        const upgrade = priced && basket.includeUpgrades ? upgradeCost(basket.region, b.drawKey) : null;
        const spent = priced ? spentSoFar(basket.region, b.drawKey, b.pullsDone) : 0;
        const leftAll = priced ? left + (upgrade || 0) : 0;
        return { n: i + 1, drawKey: b.drawKey, pullsDone: b.pullsDone, total: pullCount(basket.region, b.drawKey), priced, spent, left: leftAll, full: spent + leftAll };
    });
}
function breakdownRows(figs, level) {
    if (level === 0) return figs.map(f => ({ ...f, from: f.n, to: f.n, count: 1 }));
    if (level >= 4) {
        const byType = new Map();
        for (const f of figs) {
            const g = byType.get(f.drawKey) || { ...f, count: 0, spent: 0, left: 0, full: 0, pullsDone: 0, total: 0, byType: true };
            g.count++; g.spent += f.spent; g.left += f.left; g.full += f.full; g.pullsDone += f.pullsDone; g.total += f.total || 0;
            byType.set(f.drawKey, g);
        }
        return [...byType.values()];
    }
    const rows = [];
    for (const f of figs) {
        const last = rows[rows.length - 1];
        if (last && last.drawKey === f.drawKey && last.pullsDone === f.pullsDone && last.priced === f.priced) { last.to = f.n; last.count++; }
        else rows.push({ ...f, from: f.n, to: f.n, count: 1 });
    }
    return rows;
}
function breakdownSelectionText(basket, level) {
    const dash = emojis.blueDash;
    const rows = breakdownRows(lineFigures(basket), level);
    const out = [`## ${selectionHeading(basket.banners)}`];
    for (const r of rows) {
        const icon = DRAW_META[r.drawKey] ? emojis[DRAW_META[r.drawKey].tier] : emojis.smallDot;
        const name = `${shortName(r.drawKey)}${r.count > 1 ? ` ×${r.count}` : ''}`;
        // A per-type row (level 4) already carries its lines' sums, so it is never multiplied again.
        const k = r.byType ? 1 : r.count;
        if (r.byType) { out.push(`${icon} ${name} · \`${r.pullsDone}/${r.total || '?'}\` Spins ${dash} **${r.priced ? `\`${fmt(r.full)} CP\`` : 'no price here'}**`); continue; }
        const num = r.from === r.to ? `#${r.from}` : `#${r.from}–#${r.to}`;
        out.push(`${icon} ${num} · \`${r.pullsDone}/${r.total ?? '?'}\` Spins · ${name} ${dash} **${r.priced ? `\`${fmt(r.full * k)} CP\`` : 'no price here'}**`);
        if (level < 2) out.push(r.priced
            ? `-# \`${fmt(r.spent * r.count)} CP\` spent · \`${fmt(r.left * r.count)} CP\` remaining until completion`
            : `-# No sourced price at ${regionLabel(basket.region)}, so this line is left out of the totals.`);
    }
    return out.join('\n');
}
function breakdownCostLines(basket, currency, client, level) {
    const b1 = emojis.b1;
    const figs = lineFigures(basket).filter(f => f.priced);
    const rows = breakdownRows(figs, level);
    const full = figs.reduce((n, f) => n + f.full, 0);
    const spent = figs.reduce((n, f) => n + f.spent, 0);
    const needed = full - spent;
    const balance = basket.balance || 0;
    const shortfall = needed - balance;
    const term = (r, key) => `\`${r.count > 1 ? `${r.count} × ` : ''}${fmt(r[key])} CP\``;
    const terms = key => level >= 3 ? `across ${plural(figs.length, 'line')}` : (rows.length ? rows.map(r => term(r, key)).join(' **+** ') : '`0 CP`');
    const head = [
        '## Cost Breakdown',
        `**CP still needed**${BREAK}**\`${fmt(Math.max(shortfall, 0))} CP\`**`,
        '-# `Cost of draws` **-** `amount spent` **-** `CP Balance`'
    ];
    const tail = [
        `Full cost of draws${BREAK}\`${fmt(full)} CP\` Total`,
        `-# ${b1} ${terms('full')}`,
        `Amount Spent so far${BREAK}\`${fmt(spent)} CP\` Total`,
        `-# ${b1} ${terms('spent')}`,
        balance ? `CP Balance${BREAK}\`${fmt(balance)} CP\`` : `CP Balance${BREAK}\`0 CP\` Assumed`,
        `-# ${b1} ${balance ? 'Set under Tweak Calculation' : '`Not set`'}`
    ];
    const unpriced = lineFigures(basket).filter(f => !f.priced);
    if (unpriced.length) tail.push(`⚠️ **${plural(unpriced.length, 'line')} excluded** — no sourced pricing at ${regionLabel(basket.region)}: ${[...new Set(unpriced.map(f => shortName(f.drawKey)))].join(', ')}.`);
    const upgradeMissing = basket.includeUpgrades ? lineFigures(basket).filter(f => f.priced && upgradeCost(basket.region, f.drawKey) === null && hasUpgradeAnywhere(f.drawKey)) : [];
    if (upgradeMissing.length) tail.push(`⚠️ **Upgrade not included** for ${[...new Set(upgradeMissing.map(f => shortName(f.drawKey)))].join(', ')} — no upgrade price at ${regionLabel(basket.region)} yet.`);

    if (needed === 0 && !unpriced.length) return { head, tail: [...tail, '', '✅ **Every draw here is finished** — nothing left to buy.'] };
    if (shortfall <= 0) return { head, tail: [...tail, '', `✅ **Your balance covers this**, with **\`${fmt(-shortfall)} CP\`** to spare.`] };

    const doubleCpAvailable = CP_PACKAGES.filter((pk, i) => (basket.entitlementMask & (1 << i)) !== 0).map(pk => pk.id);
    const result = optimizePurchase(shortfall, { currency, doubleCpAvailable });
    if (!result || !result.cheapest) return { head, tail: [...tail, '', `⚠️ **${fmt(shortfall)} CP** is more than a reasonable number of store purchases can cover at once.`] };
    const money = cents => formatMoney(cents, currency);
    const bundle = (label, r) => [
        `**${label}**${BREAK}**\`${fmt(r.totalCp)} CP\`** for **\`${money(r.totalCents)}\`**`,
        ...r.combo.map(c => `> **${c.count}×** ${fmt(c.cpEach)} CP bundle${c.mode === 'double' ? ' (2X)' : ''}${BREAK}\`${money(c.priceCents)}\`${c.count > 1 ? ' each' : ''}`),
        `-# \`${fmt(r.totalCp)} CP\` Bought · \`${fmt(shortfall)} CP\` Needed${BREAK}**\`${fmt(r.leftoverCp)} CP\` Left Over**`
    ];
    const settingsMention = client ? mentionCommand(client, '/settings') : '`/settings`';
    tail.push(result.stockUp ? '## Recommended Bundles' : '## Recommended Bundle', ...bundle('Cheapest', result.cheapest));
    if (result.stockUp) {
        tail.push('', ...bundle('Stock Up', result.stockUp));
        tail.push(`-# **${money(result.stockUp.extraCents)} more** for **${fmt(result.stockUp.extraCp)} extra CP** at a *better rate*, worth it if you plan to purchase more draws in the future.`);
    }
    tail.push('', '-# Estimates only; local tax and conversion vary. CoD:M webstore prices **not** considered.', `-# Prices in **${currency}** · Change in ${settingsMention}`);
    return { head, tail };
}
// Discord's text cap for one message's text displays, used with SETUP_JSON_BUDGET to pick the Full Breakdown's level.
const TEXT_BUDGET = 4000;
function textLength(node) {
    let n = node && node.type === 10 ? (node.content || '').length : 0;
    for (const c of (node && node.components) || []) n += textLength(c);
    if (node && node.accessory) n += textLength(node.accessory);
    return n;
}

function buildBreakdownPage(state, basket, accentColor, options, level) {
    const { currency = 'USD', client = null, liveDoubleCPEntry = null } = options;
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];
    components.push({
        type: 9,
        components: [{ type: 10, content: breakdownSelectionText(basket, level) }],
        accessory: { type: 2, style: 2, label: 'Edit Selection', custom_id: encodeState('edit', state), emoji: emojis.parseEmoji(emojis.editCalc) }
    });
    if (options.notice) components.push({ type: 10, content: `-# ${options.notice}` });
    if (options.dropConfirm) components.push(dropConfirmRow(state, options.dropConfirm.mask, options.dropConfirm.count, options.dropConfirm.verb, options.dropConfirm.label));
    components.push({ type: 14, spacing: 1, divider: true });
    const { head, tail } = breakdownCostLines(basket, currency, client, level);
    components.push({
        type: 9,
        components: [{ type: 10, content: head.join('\n') }],
        accessory: { type: 2, style: 2, label: 'Simplify', custom_id: encodeState('detail', state), emoji: emojis.parseEmoji(emojis.collapse) }
    });
    components.push({ type: 14, spacing: 1, divider: false }, { type: 10, content: tail.join('\n') });
    return finishCostPage(state, basket, accentColor, components, liveDoubleCPEntry);
}

function buildCostPage(state, basket, accentColor, options = {}) {
    const { currency = 'USD', client = null, liveDoubleCPEntry = null } = options;
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];

    if (!basket.banners.length) {
        // Empty basket returns to the landing look (spec §9), but STAYS bound to this basketId so picking a draw adds to the same (possibly named) basket instead of creating a second one.
        return buildSetupPanel(state, basket, accentColor, { region: basket.region, savedCount: options.savedCount ?? (options.savedBaskets || []).length, notice: basket.name ? `"${basket.name}" is empty — pick a draw to add to it.` : null });
    }

    if (state.detail) {
        // Harkirat's Full Breakdown layout, at the most detailed level that fits (see breakdownRows).
        let out = null;
        for (const level of [0, 1, 2, 3, 4]) {
            out = buildBreakdownPage(state, basket, accentColor, options, level);
            if (JSON.stringify(out).length <= SETUP_JSON_BUDGET && textLength(out) <= TEXT_BUDGET) break;
        }
        return out;
    }
    const groups = groupForDisplay(basket.banners);
    // "Your Selection" with Edit BESIDE it (2026-10-13 23:01 EDT, his intake: Edit Draws sat at the bottom, away from the list it edits, while a draw picker here did half the job). Every input now lives on the form; Edit reopens it with everything kept, and this page only reports.
    components.push({
        type: 9,
        components: [{ type: 10, content: `## ${selectionHeading(basket.banners)}\n-# Press **Edit** to change your draws or spins.\n${groups.map(g => `${DRAW_META[g.drawKey] ? emojis[DRAW_META[g.drawKey].tier] : emojis.smallDot} ${shortName(g.drawKey)}${g.count > 1 ? ` ×${g.count}` : ''} — ${g.pullsDone}/${pullCount(basket.region, g.drawKey) ?? '?'} Spins`).join('\n')}` }],
        accessory: { type: 2, style: 2, label: 'Edit Selection', custom_id: encodeState('edit', state), emoji: emojis.parseEmoji(emojis.editCalc) }
    });
    if (options.notice) components.push({ type: 10, content: `-# ${options.notice}` });
    if (options.dropConfirm) components.push(dropConfirmRow(state, options.dropConfirm.mask, options.dropConfirm.count, options.dropConfirm.verb, options.dropConfirm.label));
    components.push({ type: 14, spacing: 1, divider: true });

    // Show Breakdown sits BESIDE the COST BREAKDOWN heading (2026-10-13 14:18 EDT, Harkirat: "why don't we move the show breakdown button? maybe inline with the cost breakdown section"). It is a Section with the button as its accessory, so the button sits next to what it expands; it also takes one button out of the action row, which wrapped Edit Draws onto a row of its own once a balance widened Set Balance.
    const costLines = buildCostBlock(state, basket, currency, client);
    // The head is the heading and CP Needed with its notes; the tail starts at the next heading or blank line.
    const split = costLines.findIndex((l, i) => i > 1 && (l === '' || l.startsWith('### ') || l.startsWith('## ')));
    const head = split === -1 ? costLines : costLines.slice(0, split);
    const tail = split === -1 ? [] : costLines.slice(split);
    while (tail[0] === '') tail.shift();
    components.push({
        type: 9,
        components: [{ type: 10, content: head.join('\n') }],
        accessory: { type: 2, style: 2, label: 'Full Breakdown', custom_id: encodeState('detail', state), emoji: emojis.parseEmoji(emojis.expand) }
    });
    // Room between the figures and the package that buys them (2026-10-14 13:13 EDT, his "more breathing room").
    if (tail.length) components.push({ type: 14, spacing: 1, divider: false }, { type: 10, content: tail.join('\n') });
    return finishCostPage(state, basket, accentColor, components, liveDoubleCPEntry);
}

// The rows under the cost, shared by the compact view and the Full Breakdown.
function finishCostPage(state, basket, accentColor, components, liveDoubleCPEntry) {
    // Region and upgrade are adjustable right here (2026-10-14 13:13 EDT, Harkirat): "why are the cp region buttons gone from this screen? and the upgrade yes/no button". A click re-prices this same result.
    components.push({ type: 14, spacing: 2, divider: true }, regionCaption(), regionRow(state, basket), basketManageRow(state, basket), { type: 14, spacing: 2, divider: true }, resultActionRow(state));

    if (liveDoubleCPEntry || basket.entitlementMask) {
        components.push({ type: 10, content: liveDoubleCPEntry
            ? `-# 🎉 A **Double CP** event looks live right now${liveDoubleCPEntry.endDate ? ` (ends <t:${Math.floor(new Date(liveDoubleCPEntry.endDate).getTime() / 1000)}:R>)` : ''}. Tell the optimizer which bundles you still have a 2X entitlement on.`
            : `-# Select which bundles you still have an unused 2X entitlement on, if the event is running.` });
        components.push(entitlementSelectRow(state, basket));
    }
    return { type: 17, accent_color: accentColor, components };
}

// The Edit Draws page is gone (2026-10-13 23:01 EDT): Edit on the result reopens the form, which holds every line, its progress, Remove and Move Up. A panel posted before that still sends page 1, which now renders the result.

// RETIRED FROM THE UI, KEPT ON PURPOSE (2026-10-14 19:58 EDT): the Draw Info button left the calculator's nav row in the intake of 2026-10-14 (commit 15b49b09), so no new panel can reach this. It still runs for a panel posted before that, through the old `info` verb in handlers/drawCalc.js, and one case in scripts/drawCalcBudget.test.js covers it. Harkirat chose to leave it until a later code-housekeeping session decides on deletion (filed in docs/db-deferred-list.md, Someday / tech-debt). /draw prices shows real pricing in the meantime.
// Draw Info -- its OWN ephemeral message, own fresh 40-component budget, full buildDrawEntries fidelity for every DISTINCT draw type in the basket (measured 23/40 at all nine draw types in the single-draw design; a basket of any size still spans at most nine distinct types, so this never needs pagination -- spec §3).
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
            '2. **Set your spins** on any draw you have already started',
            '3. **Set your region and balance** under Tweak Calculation',
            `4. **Press ${emojis.sparkles} Calculate** for the CP you need and the cheapest way to buy it`
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
            row('Recommended Bundle', 'the fewest store purchases within 3% of the cheapest price'),
            row('Left Over', 'CP the bundles give beyond what you need; it stays in your account'),
            row('Stock Up', 'a bigger buy at a better rate; see Why Stock Up below'),
            row('2X Bundles', 'tick the bundles you can still buy at double CP; the recommendation uses them')
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
    // Page 3 is the Saved view; it belongs to no one calculation, and Back returns to whichever this message had open.
    if (state.page === 3) return [buildSavedPanel(state, options.savedBaskets, accentColor, { notice: options.notice, savedConfirm: options.savedConfirm, current: basket }), nav({ showReset: false, onSaved: true })];
    if (state.page === 4) return [buildSaveStepPanel(state, options.savedBaskets, accentColor, { notice: options.notice, current: basket, overwriteConfirm: options.overwriteConfirm }), nav({ showReset: false, onSaved: true })];
    // No basket at all -> the setup form, empty. A basketId that resolved to nothing -> the same form, with a notice.
    if (!basket) {
        const container = state.basketId
            ? buildMissingBasketPanel(state, accentColor, savedCount)
            : buildSetupPanel(state, null, accentColor, { region: options.region, notice: options.notice, savedCount });
        return [container, nav({ inForm: true })];
    }
    // 🔴 `submitted` is what separates a draft from a result, and it lives on the DOCUMENT, not the customId -- that is the whole reason a result survives a restart and "persists until reset / new calculation".
    if (!basket.submitted) {
        return [buildSetupPanel(state, basket, accentColor, { notice: options.notice, dropConfirm: options.dropConfirm, savedCount }), nav({ inForm: true })];
    }
    // Edit is a VIEW (page 2) on a calculation that stays submitted (2026-10-13 23:10 EDT): an abandoned edit still reopens on its result, the persistence the form's own header calls load-bearing. Calculate returns to page 0.
    if (state.page === 2) return [buildSetupPanel(state, basket, accentColor, { notice: options.notice, dropConfirm: options.dropConfirm, savedCount }), nav({ inForm: true })];
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
    const panel = buildCalculatorPanel(openState, latest, accentColor, {
        savedBaskets, region, notice: shortcut.notice,
        currency: prefs?.cpCurrency || 'USD',
        client: interaction.client,
        liveDoubleCPEntry: latest && latest.submitted ? await findLiveDoubleCPEntry() : null
    });

    // skipExpiry (spec decision 7, "never expires"): re-derived 2026-08-27 against sendV2Payload's own bar -- "nothing on this panel can go stale". It holds. Every control is author-locked and re-reads the calculation from Mongo on each click, so a panel found hours later rebuilds from live data rather than showing a frozen view; and a component click is its own interaction with its own fresh 15-minute token, so editing this message never runs out of runway the way a single long-lived token would. No Show Everyone row (2026-10-14 18:34 EDT, Harkirat: "remove show everyone component"): Export shares the result as text instead, and the freed row is two more components for the form.
    return sendV2Payload(interaction, panel, { skipExpiry: true });
}

module.exports = {
    encodeState, decodeState, defaultState, clampFocus,
    buildCalculatorPanel, buildSetupPanel, buildMissingBasketPanel, buildExportText, buildDrawInfoPanel, buildHelpPanel, buildSavedPanel, buildSaveStepPanel, savedChecksum, savedDescription,
    buildCostBlock, entryFor, regionsWithData, usedTypes, groupForDisplay,
    isDoubleCPEventLive, findLiveDoubleCPEntry, execute,
    parseAmount, applySelection, shortName, SHORT_NAME, slashShortcut,
    setTypeCount, SETUP_CONTAINER_BUDGET, SETUP_JSON_BUDGET, MAX_LINES, MAX_SAVED, linePages
};
