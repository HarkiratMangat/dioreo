// ==========================================
// COMMAND: /draw calculator -- saved baskets, per-banner planning
// ==========================================
// Deliberately exports NO `data`. bot/registry.js's loadCommandModules() only registers a module having BOTH `data` and `execute`, and keys the registration by data.name -- a second file exporting setName('draw') would register a DUPLICATE `draw` command and silently overwrite drawprices.js's registration in client.commands. This module stays safely un-registered while remaining requireable from commands/drawprices.js, which owns the `draw` group's builder and dispatches the `calculator` subcommand here.
//
// ⚠️ FIFTH PASS, 2026-08-27 11:48 EDT -- rebuilt around the saved-basket redesign (docs/superpowers/specs/2026-08-27-draw-calculator-multi-draw-design.md, revision 3). The whole prior single-draw model (drawKey/pullsDone/target/targetValue living in the customId) is GONE. 🔴 THE BASKET IS A FLAT LIST OF BANNERS -- "quantity" does not exist as a concept. Three Mythic Weapon banners are three separate, independently-orderable rows in `basket.banners`, each with its own `pullsDone`. Budget mode and per-banner goals other than "finish" are explicitly out of scope (spec §10) -- there is no goal select any more, every banner is always priced to completion.
//
// ⚠️ STATE NOW LIVES IN TWO PLACES ON PURPOSE. The customId carries only a reference plus transient VIEW state (which page, detail on/off, the reorder focus pointer, the author lock) -- `calc~<verb>~<basketId>~g<page>~x<detail>~f<focus>~a<authorId base36>`. The basket itself (banners/region/balance/includeUpgrades/entitlementMask/name) lives in the DrawBasket collection via utils/drawBasketStore.js, and is looked up fresh on every render. 🔴 THAT MEANS THE PANEL CAN NOW GO STALE -- a basket can be deleted, or an unnamed one can expire (30-day TTL) -- which the old fully-stateless design made structurally impossible. Every render path through buildCalculatorPanel() takes `basket` as an explicit possibly-null argument and has a real "this basket no longer exists" branch; there is no path that assumes it is there.
const { withShareButton } = require('../utils/shareButton');
const { resolveEphemeral } = require('../utils/ephemeral');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { mentionCommand } = require('../utils/commandMentions');
const { getAccentColorForCommand } = require('../utils/accentColor');
const emojis = require('../utils/emojiMap');
const UserPreference = require('../models/UserPreference');
const { DRAW_META, REGION_ORDER, REGION_EMOJI_KEY, PRESET_ACCENT, UPGRADE_LABEL } = require('./drawprices');
const { pullCount, upgradeCost, remainingToFinish, spentSoFar, basketCost } = require('../utils/drawCost');
const crypto = require('crypto');
const { CP_PACKAGES, formatMoney, optimizePurchase } = require('../utils/cpPackages');

// 📝 PLAYER-FACING VOCABULARY, decided by Harkirat 2026-08-27 after three rounds of rejected candidates. The saved thing is a **calculation** (his own word: "reset/new calculation"); one row in it is a **line** (provisional -- he expects to revisit it). Both replace "basket"/"banner": "banner" collides with Discord profile banners, and every container metaphor (basket/cart/plan/list) read wrong because the player is PURCHASING and budgeting, not collecting. INTERNAL identifiers (DrawBasket, drawBasketStore, `basket`, `banners`) deliberately keep the old names -- renaming the model would churn PRIVACY.md, the store, and every test for something no user can see. Only strings a player reads are in scope here.
const DRAW_KEYS = Object.keys(DRAW_META);
// Five lines per page (2026-10-14 00:15 EDT). He asked for six; six measured past Discord's message SIZE cap, not the 40-component one: each line's dropdown carries 11-13 labelled options, and seven different draws at six per page came to ~13,800 characters against a cap measured between 13,100 and 13,412 on the dev bot. Five fits every draw mix under SETUP_JSON_BUDGET; buildSetupPanel still drops further when the saved list needs the room.
const SETUP_LINES_PER_PAGE = 5;
// The setup form's own budget (container included): 40, minus the Show Everyone row (2) and the bottom nav row (1 + up to 4 buttons: Draw Prices · Saved · New Calculation · Help, 2026-10-14 13:13 EDT). buildSetupPanel drops lines per page until it fits.
const SETUP_CONTAINER_BUDGET = 33;
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
        check: checkRaw || null
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
        options.push({ label: 'Remove this Selection', value: 'del', emoji: { name: '✖️' }, description: banner.pullsDone ? `Drops It and Its ${banner.pullsDone}/${total} Spins` : 'Takes It Out of This Calculation' });
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
                description: have ? `In Your Selection ×${have} · Pick to Add Another` : freshDrawDescription(basket.region, key),
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
    return `${total} Items · ${fmt(remainingToFinish(region, key, 0))} CP Total${upgrade !== null ? ` · + ${fmt(upgrade)} CP Upgrade` : ''}`.slice(0, 100);
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
                label: `${fmt(p.baseCp)} CP package`,
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

// The caption above the region buttons (2026-10-13 12:40 EDT). Three "10 / 20 / 30 CP" buttons sit among a dozen real CP amounts and read like one of them; nothing said what a region is or how a player finds theirs. The first pull's price IS the region, so that is the one sentence that answers both. No heading and no divider above it (2026-10-14 13:13 EDT, Harkirat: "'Your Region & CP Balance' remove it. Also remove the divider above it"); the hint alone labels the row, and Help keeps what a region is.
function regionCaption() { return { type: 10, content: '-# Set your CP region and current balance.' }; }
// Room between blocks without a rule (his "more breathing room"): a separator with no divider.
const SPACER = { type: 14, spacing: 2, divider: false };

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
            { type: 2, style: 2, label: count === 1 ? 'Keep it' : 'Keep them', custom_id: encodeState('page', { ...state, mask: 0 }) }
        ]
    };
}

// NO EMOJI on either button (2026-08-27, Harkirat) -- `mngEdit` was a pencil paired with a button labelled "Save", which never matched, and a destructive action reads clearer without decoration. Rename doubles as "Save" for an unnamed basket -- naming it IS the save, since that is the one thing that exempts a basket from the 30-day TTL (models/DrawBasket.js). Delete is two-step, same pattern as Reset below -- one misclick must never destroy a named basket (plan Task 5's own verify requirement).
function basketManageRow(state, basket) {
    const deleteArmed = state.verb === 'delarm';
    // Delete shows only on a SAVED calculation (2026-10-13 12:40 EDT). On an unsaved one it did exactly what New Calculation does, so the two sat side by side meaning the same thing. Set Balance leads this row on the result (2026-10-13 23:10 EDT): "I have more CP now" is the commonest return visit, and sending it through Edit and Calculate turned one tap into three. The upgrade toggle sits here too (2026-10-14 13:13 EDT, Harkirat: "why are the cp region buttons gone from this screen? and the upgrade yes/no button"): a choice that changes the total is made where the total is.
    const components = [
        { type: 2, style: 2, label: basket.balance ? `Balance: ${fmt(basket.balance)} CP` : 'Set Balance', custom_id: encodeState('modal', state), emoji: emojis.parseEmoji(emojis.cp2) },
        upgradeButton(state, basket),
        { type: 2, style: 2, label: basket.name ? 'Rename' : 'Save', custom_id: encodeState('modal_name', state) }
    ].filter(Boolean);
    if (basket.name) components.push({ type: 2, style: deleteArmed ? 4 : 2, label: deleteArmed ? 'Delete Calculation — click again' : 'Delete Calculation', custom_id: encodeState(deleteArmed ? 'del' : 'delarm', state) });
    return { type: 1, components };
}

// 🔴 RETURNED AS A TOP-LEVEL SIBLING of the Container, never pushed inside it (fixed 2026-08-27) -- it was rendering as a child, which boxes the nav inside the panel's accent border instead of sitting under it the way every other command in this bot places its nav. buildCalculatorPanel is the ONE place that attaches it; do not push it into a page builder's `components`. Replaces buildGlobalNavRow entirely (Task 9) -- Draw Info and Help are the calculator's own ephemeral panels, Draw Prices is the one cross-link back to the sibling command, Reset is two-step (Danger style once armed) exactly like Delete Basket above, and clears basket, balance, focus and page (spec §9) without deleting the basket document itself. `showReset` is false on the setup form: there is no computed result to clear yet, and a live button that does nothing visible is worse than an absent one. On a submitted calculation it reads "New Calculation" -- Harkirat's own phrase for the action that ends a result's persistence and returns to the form. Draw Prices · New Calculation · Help (2026-10-13 23:01 EDT, his intake: Draw Info removed, since /draw prices shows the same draws; New Calculation on EVERY page once there is something to clear, where it used to appear only on the result).
function bottomNavRow(state, { showReset = true, savedCount = 0, onSaved = false } = {}) {
    const resetArmed = state.verb === 'resetarm';
    // Its own private message (2026-10-13 12:40 EDT) -- it used to be the global nav's `nav_prices`, which turned THIS panel into /draw prices in place.
    const components = [{ type: 2, style: 2, label: 'Draw Prices', custom_id: encodeState('prices', state) }];
    // Saved calculations moved off the landing into their own view of this same message (2026-10-14 13:13 EDT, Harkirat's "surface switch"): the loader no longer takes the form's room or its share of Discord's size cap. On that view the slot reads Back.
    components.push(onSaved
        ? { type: 2, style: 2, label: '◀ Back', custom_id: encodeState('back', state) }
        : { type: 2, style: 2, label: savedCount ? `Saved (${savedCount})` : 'Saved', custom_id: encodeState('saved', state) });
    if (showReset) components.push({ type: 2, style: resetArmed ? 4 : 2, label: resetArmed ? 'New Calculation — click again' : 'New Calculation', custom_id: encodeState(resetArmed ? 'reset' : 'resetarm', state) });
    components.push({ type: 2, style: 2, label: 'Help', custom_id: encodeState('help', state) });
    return { type: 1, components };
}

// The setup form's own action row. Calculate is the ONLY Primary-styled button anywhere in this command -- the whole screen exists to lead to it. Balance and Upgrade are disabled until a draw exists, because both write to a basket document that has not been created yet and would otherwise accept input and silently discard it.
function setupActionRow(state, basket) {
    const hasBasket = Boolean(basket && basket._id);
    const lines = basket?.banners?.length || 0;
    return {
        type: 1,
        components: [
            { type: 2, style: 2, disabled: !hasBasket, custom_id: encodeState('modal', state), emoji: emojis.parseEmoji(emojis.cp2),
              label: basket?.balance ? `Balance: ${fmt(basket.balance)} CP` : 'Set Balance' },
            { type: 2, style: 1, label: 'Calculate', custom_id: encodeState('submit', state), disabled: lines === 0 }
        ].filter(Boolean)
    };
}

// ==========================================
// COST BREAKDOWN -- basket-wide, always priced to FINISH every banner (budget mode and per-banner goals other than Finish are out of scope, spec §10 -- there is no goal select any more).
// ==========================================
function buildCostBlock(state, basket, currency, client, { compact }) {
    const dot = emojis.smallDot;
    const dash = emojis.blueDash;
    const { total: needed, perBanner } = basketCost(basket.region, basket.banners, basket.includeUpgrades);
    const unpriced = perBanner.filter(b => !b.priced);
    const shortfall = needed - (basket.balance || 0);

    // 🔴 CP NEEDED LEADS. This block used to open with "Draws in basket: 2" and put the one number the whole command exists to produce THIRD -- the eye landed on a count nobody asked for. The count itself is gone: the DRAWS IN PROGRESS list sits directly above and already shows every line.
    const lines = [`## Cost Breakdown`];
    lines.push(`${dot} CP Needed: **\`${fmt(needed)} CP\`**`);
    // No Balance or Region line (2026-10-14 13:13 EDT, Harkirat: "redundant now that the balance is included inside the balance button. and the region is a toggle"). What the balance CHANGES is not on any button, so that one figure stays: what is left to buy after it.
    if (basket.balance && shortfall > 0) lines.push(`${dot} Still to Buy: **\`${fmt(shortfall)} CP\`** after your balance`);
    if (unpriced.length) {
        lines.push(`⚠️ **${plural(unpriced.length, 'line')} excluded** — no sourced pricing at ${regionLabel(basket.region)}: ${unpriced.map(b => shortName(b.drawKey)).join(', ')}.`);
    }
    // 🔴 A SILENT ZERO, FOUND 2026-10-13 12:40 EDT. Mythic draws have no upgrade price at the 20 CP region, so "Upgrade: Included" added nothing there while the button claimed it was in the total. Say so instead.
    const upgradeMissing = basket.includeUpgrades ? perBanner.filter(b => b.priced && b.upgrade === null && hasUpgradeAnywhere(b.drawKey)) : [];
    if (upgradeMissing.length) {
        lines.push(`⚠️ **Upgrade not included** for ${[...new Set(upgradeMissing.map(b => shortName(b.drawKey)))].join(', ')} — no upgrade price at ${regionLabel(basket.region)} yet.`);
    }

    if (!compact) {
        // NO explicit blank line before a heading (2026-08-27) -- Discord gives a heading its own top margin, and that margin does NOT collapse against a blank line, so the two stack. The Priority Plan that sat here is gone (2026-10-14 13:13 EDT, his call): its order changed only a running-total column nothing else read. What each draw costs is the part of it that answered a question.
        lines.push(`### Cost Per Draw`);
        for (const g of groupForDisplay(basket.banners)) {
            const one = perBanner.find(b => b.drawKey === g.drawKey && b.pullsDone === g.pullsDone);
            const total = pullCount(basket.region, g.drawKey);
            const icon = DRAW_META[g.drawKey] ? emojis[DRAW_META[g.drawKey].tier] : dot;
            lines.push(`${icon} ${shortName(g.drawKey)}${g.count > 1 ? ` ×${g.count}` : ''} — ${g.pullsDone}/${total ?? '?'} Spins ${dash} **${one && one.priced ? `${fmt(one.cost * g.count)} CP` : 'no price here'}**`);
        }
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
    const describePrices = r => r.combo.map(c => `${formatMoney(c.priceCents * c.count, currency)}`).join(' + ');
    // Compact line (2026-10-13 12:40 EDT): the price first, the packs, then what is left over -- it used to say the CP total twice ("10,800 CP for CA$129.99 — 1× 10,800 CP") and hide the leftover entirely. The breakdown view keeps that same headline and adds ONE quiet line under it (2026-10-14 13:13 EDT, his "refine the display"): it used to restate the price and the CP three times over four lines ("21,600 CP for CA$259.98" / "2× 10,800 CP ⌇ 21,600 CP" / "CA$259.98 ⌇ CA$259.98"). The per-pack prices show only when there is more than one kind of pack to split them across.
    const packageLines = (label, r) => compact
        ? [`**${label}:** **\`${formatMoney(r.totalCents, currency)}\`** for ${describeCp(r)}${r.leftoverCp > 0 ? ` · **${fmt(r.leftoverCp)} CP** left over` : ''}`]
        : [
            `**${label}:** **\`${formatMoney(r.totalCents, currency)}\`** for ${describeCp(r)}`,
            `-# ${r.combo.length > 1 ? `${describePrices(r)} · ` : ''}${fmt(r.totalCp)} CP Bought · ${fmt(r.leftoverCp)} CP Left Over`
        ];

    lines.push('### Recommended Package');
    lines.push(...packageLines('Cheapest', result.cheapest));
    if (!compact && result.stockUp) {
        lines.push(''); // the two methods ran together as one block without this -- they are alternatives, not a continuation
        lines.push(...packageLines('Stock Up', result.stockUp));
        lines.push(`-# Costs **\`${formatMoney(result.stockUp.extraCents, currency)}\`** more than Cheapest, but banks **\`${fmt(result.stockUp.extraCp)}\`** extra CP at a better rate — worth it only if you plan to keep pulling.`);
    }
    const settingsMention = client ? mentionCommand(client, '/settings') : '`/settings`';
    // The currency line shows in BOTH views (2026-10-13 12:40 EDT). It used to live only behind Show Breakdown, so a player outside the US saw dollars with no hint they were dollars, or where to change them.
    lines.push(compact
        ? `-# Prices in **${currency}** · change in ${settingsMention}`
        : `-# _Estimates only — varies by tax/conversion. Currency: **${currency}** (Change in ${settingsMention})._`);
    return lines;
}

// ==========================================
// PAGES
// ==========================================
// A saved calculation's name gets its own line under the title (2026-10-14 13:13 EDT, Harkirat: "Maybe put it in a 2nd line? '> ### Viewing Saved: `the name`'"). A backtick in a name would end the code span early, so it is swapped for a plain quote here only.
function titleBlock(basket) {
    const named = basket && basket.name ? `\n> ### Viewing Saved: \`${String(basket.name).replace(/`/g, "'")}\`` : '';
    return { type: 10, content: `## ${emojis.calculator} Lucky Draw Calculator${named}` };
}

// ==========================================
// THE SETUP FORM -- the first screen, and the one the whole command now leads FROM
// ==========================================
// 🔴 THIS REVERSES THIS COMMAND'S OWN "never a setup form again" RULE, deliberately (Harkirat, 2026-08-27). That rule came from a single-draw panel where five interactions preceded any figure AT ALL, every single visit. Two things make this different, and both are load-bearing rather than cosmetic:
//   1. ONE screen. The saved-calculations list and the form share it -- loading an old calculation and starting a new one are both one interaction from opening the command, never a hop apart.
//   2. IT PERSISTS. Pressing Calculate sets `submitted` on the basket document, so the result is what you come back to -- until you press New Calculation. The form is filled in once, not on every visit.
// If either of those is ever removed, this is the old failure again and the old rule should come back.
function buildSetupPanel(state, basket, accentColor, { region, notice = null, dropConfirm = null } = {}) {
    // A shim, so every row builder below works identically whether a draft document exists yet or not.
    const draft = basket || { banners: [], region: region || 'region_10', balance: 0, includeUpgrades: false };
    const banners = draft.banners || [];
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];
    if (notice) components.push({ type: 10, content: `-# ${notice}` });

    // The saved-calculations loader left this screen for its own view (2026-10-14 13:13 EDT, Harkirat's footer-button idea, built as a view of this message rather than a popup): the nav row's Saved button reaches it from every screen, so a first-timer still sees that saving exists. Headings name what each block is FOR, with one short hint each (2026-10-14 00:08 EDT and 2026-10-14 13:13 EDT, Harkirat: "Start a Calculation" on the empty screen; "## Your Selection" over "### Set Current Attempts" once there are lines; Title Case, as every heading in the calculator).
    components.push({ type: 10, content: banners.length
        ? '## Your Selection\n### Set Current Attempts\n-# Set how many spins you\'ve already performed on each draw. `0` means draw is unattempted.'
        : '## Start a Calculation\n-# Pick all the draw types you want to calculate. You can add more later.' });
    // The untick confirm replaces the picker here too (2026-10-13 12:43 EDT). With lines, the picker moves below them as "Add more draws to selection" (addDrawsRow).
    if (dropConfirm) components.push(dropConfirmRow(state, dropConfirm.mask, dropConfirm.count, dropConfirm.verb, dropConfirm.label));
    else if (!banners.length) components.push(typesSelectRow(state, draft));

    // No heading and no divider before the region row (2026-10-14 13:13 EDT, his intake); a spacer keeps the room the divider gave.
    const tail = [SPACER, regionCaption(), regionRow(state, draft), setupActionRow(state, basket)];
    // Builds the middle of the form at one lines-per-page: the lines, the pager, then the add picker under its own heading.
    const build = perPage => {
        const pages = linePages(banners, perPage);
        const bpage = Math.min(state.bpage || 0, pages.length - 1);
        const mid = pages[bpage].map(i => bannerPullsRow(state, draft, i, { removable: true }));
        if (pages.length > 1) mid.push(pageNavRow({ ...state, bpage }, pages.length));
        if (banners.length && !dropConfirm) {
            mid.push({ type: 10, content: '## Calculate Multiple Draws\n-# Select more draw types or add more of the same type to calculate multiple at the same time.' });
            mid.push(addDrawsRow(state, draft));
        }
        // The upgrade is a choice about the draws, so it sits with them (2026-10-13 23:10 EDT), only when a picked draw has one.
        const upgrade = upgradeButton(state, basket, { disabled: !(basket && basket._id) });
        if (upgrade && banners.length) mid.push({ type: 1, components: [upgrade] });
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

// Two 25-option dropdowns of long names can pass Discord's message size cap on their own (measured 2026-10-14 13:16 EDT: 14,001 characters of JSON at 25 calculations with 80-character names), so the view gives up detail in steps until it fits: the delete list's descriptions first, then the reopen list's descriptions are cut shorter, then the delete list's names. A player with short names never loses any of it.
function buildSavedPanel(state, savedBaskets, accentColor, options = {}) {
    let out;
    for (let level = 0; level <= 3; level++) {
        out = buildSavedPanelAt(state, savedBaskets, accentColor, options, level);
        if (JSON.stringify(out).length <= SETUP_JSON_BUDGET) break;
    }
    return out;
}
function buildSavedPanelAt(state, savedBaskets, accentColor, { notice = null, savedConfirm = null } = {}, level = 0) {
    const list = (savedBaskets || []).slice(0, MAX_SAVED);
    const cut = (text, n) => (text.length > n ? `${text.slice(0, n - 1)}…` : text);
    const view = { ...state, page: 3 };
    const components = [titleBlock(null), { type: 14, spacing: 2, divider: true }];
    if (notice) components.push({ type: 10, content: `-# ${notice}` });
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
        components.push({ type: 1, components: [{ type: 2, style: armed ? 4 : 2, label: armed ? `Delete All ${list.length} — click again` : 'Delete All', custom_id: encodeState(armed ? 'delall' : 'delallarm', view) }] });
    }
    components.push({ type: 10, content: `-# ${list.length}/${MAX_SAVED} saved. An unsaved calculation is cleared 30 days after it was started.` });
    return { type: 17, accent_color: accentColor, components };
}

function buildMissingBasketPanel(state, accentColor) {
    return buildSetupPanel({ ...state, basketId: null }, null, accentColor, {
        region: 'region_10',
        notice: '⚠️ That saved calculation no longer exists — it may have expired, or been deleted.'
    });
}

function buildCostPage(state, basket, accentColor, options = {}) {
    const { currency = 'USD', client = null, liveDoubleCPEntry = null } = options;
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];

    if (!basket.banners.length) {
        // Empty basket returns to the landing look (spec §9), but STAYS bound to this basketId so picking a draw adds to the same (possibly named) basket instead of creating a second one.
        return buildSetupPanel(state, basket, accentColor, { region: basket.region, notice: basket.name ? `"${basket.name}" is empty — pick a draw to add to it.` : null });
    }

    const groups = groupForDisplay(basket.banners);
    // "Your Selection" with Edit BESIDE it (2026-10-13 23:01 EDT, his intake: Edit Draws sat at the bottom, away from the list it edits, while a draw picker here did half the job). Every input now lives on the form; Edit reopens it with everything kept, and this page only reports.
    components.push({
        type: 9,
        components: [{ type: 10, content: `## Your Selection\n-# Press **Edit** to change your draws or spins.\n${groups.map(g => `${DRAW_META[g.drawKey] ? emojis[DRAW_META[g.drawKey].tier] : emojis.smallDot} ${shortName(g.drawKey)}${g.count > 1 ? ` ×${g.count}` : ''} — ${g.pullsDone}/${pullCount(basket.region, g.drawKey) ?? '?'} Spins`).join('\n')}` }],
        accessory: { type: 2, style: 2, label: 'Edit', custom_id: encodeState('edit', state) }
    });
    if (options.notice) components.push({ type: 10, content: `-# ${options.notice}` });
    if (options.dropConfirm) components.push(dropConfirmRow(state, options.dropConfirm.mask, options.dropConfirm.count, options.dropConfirm.verb, options.dropConfirm.label));
    components.push({ type: 14, spacing: 1, divider: true });

    // Show Breakdown sits BESIDE the COST BREAKDOWN heading (2026-10-13 14:18 EDT, Harkirat: "why don't we move the show breakdown button? maybe inline with the cost breakdown section"). It is a Section with the button as its accessory, so the button sits next to what it expands; it also takes one button out of the action row, which wrapped Edit Draws onto a row of its own once a balance widened Set Balance.
    const costLines = buildCostBlock(state, basket, currency, client, { compact: !state.detail });
    const split = costLines.findIndex((l, i) => i > 0 && (l === '' || l.startsWith('### ') || l.startsWith('## ')));
    const head = split === -1 ? costLines : costLines.slice(0, split);
    const tail = split === -1 ? [] : costLines.slice(split);
    while (tail[0] === '') tail.shift();
    components.push({
        type: 9,
        components: [{ type: 10, content: head.join('\n') }],
        accessory: { type: 2, style: 2, label: state.detail ? 'Simplify' : 'Show Breakdown', custom_id: encodeState('detail', state), emoji: emojis.parseEmoji(state.detail ? emojis.simplify : emojis.expand) }
    });
    // Room between the figures and the package that buys them (2026-10-14 13:13 EDT, his "more breathing room").
    if (tail.length) components.push(SPACER, { type: 10, content: tail.join('\n') });
    // Region and upgrade are adjustable right here (2026-10-14 13:13 EDT, Harkirat): "why are the cp region buttons gone from this screen? and the upgrade yes/no button". A click re-prices this same result.
    components.push({ type: 14, spacing: 2, divider: true }, regionCaption(), regionRow(state, basket), basketManageRow(state, basket));

    if (liveDoubleCPEntry || basket.entitlementMask) {
        components.push({ type: 10, content: liveDoubleCPEntry
            ? `-# 🎉 A **Double CP** event looks live right now${liveDoubleCPEntry.endDate ? ` (ends <t:${Math.floor(new Date(liveDoubleCPEntry.endDate).getTime() / 1000)}:R>)` : ''}. Tell the optimizer which packages you still have a 2X entitlement on.`
            : `-# Select which packages you still have an unused 2X entitlement on, if the event is running.` });
        components.push(entitlementSelectRow(state, basket));
    }
    return { type: 17, accent_color: accentColor, components };
}

// The Edit Draws page is gone (2026-10-13 23:01 EDT): Edit on the result reopens the form, which holds every line, its progress, Remove and Move Up. A panel posted before that still sends page 1, which now renders the result.

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

function buildHelpPanel(accentColor) {
    const components = [
        { type: 10, content: `## ${emojis.calculator} How the calculator works` },
        { type: 14, spacing: 2, divider: true },
        { type: 10, content: [
            '**Calculation** — everything you are pricing out in one go. Name it with **Save** to keep it; **Saved** lists the ones you kept.',
            '**Your Selection** — the draws you are running. Pick a draw again in **Add more draws to selection** to run two of it. Each draw\'s dropdown sets how many spins you have already done, and holds **Remove this Selection**.',
            '**Items** — what a draw holds. Most have 10, two have 7. Each spin wins one.',
            '**Region** — the CP price of your first pull on a draw (10, 20 or 30 CP), which sets every other price. Check it on any draw in the game.',
            '**Balance** — the CP you already have. The package only buys what is left.',
            '**Edit** — on the result, reopens the form with everything kept. Region, upgrade and balance also change right on the result. **New Calculation** clears it and starts again.',
            '**Shortcut** — `/draw calculator draw: pulls: balance:` skips the form and opens straight on that draw\'s result.',
            `**Saved calculations** — a named one is kept until you delete it in **Saved**, up to ${MAX_SAVED}; an unnamed one is cleared 30 days after it was started. Running \`/draw calculator\` again reopens the one you changed last.`
        ].join('\n\n') }
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
    if (state.page === 3) return [buildSavedPanel(state, options.savedBaskets, accentColor, { notice: options.notice, savedConfirm: options.savedConfirm }), nav({ showReset: false, onSaved: true })];
    // No basket at all -> the setup form, empty. A basketId that resolved to nothing -> the same form, with a notice.
    if (!basket) {
        const container = state.basketId
            ? buildMissingBasketPanel(state, accentColor)
            : buildSetupPanel(state, null, accentColor, { region: options.region, notice: options.notice });
        return [container, nav({ showReset: false })];
    }
    // 🔴 `submitted` is what separates a draft from a result, and it lives on the DOCUMENT, not the customId -- that is the whole reason a result survives a restart and "persists until reset / new calculation".
    if (!basket.submitted) {
        return [buildSetupPanel(state, basket, accentColor, { notice: options.notice, dropConfirm: options.dropConfirm }), nav({ showReset: basket.banners.length > 0 })];
    }
    // Edit is a VIEW (page 2) on a calculation that stays submitted (2026-10-13 23:10 EDT): an abandoned edit still reopens on its result, the persistence the form's own header calls load-bearing. Calculate returns to page 0.
    if (state.page === 2) return [buildSetupPanel(state, basket, accentColor, { notice: options.notice, dropConfirm: options.dropConfirm }), nav({ showReset: true })];
    const container = buildCostPage(state, basket, accentColor, options);
    return [container, nav()];
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

    // skipExpiry (spec decision 7, "never expires"): re-derived 2026-08-27 against sendV2Payload's own bar -- "nothing on this panel can go stale". It holds. Every control is author-locked and re-reads the calculation from Mongo on each click, so a panel found hours later rebuilds from live data rather than showing a frozen view; and a component click is its own interaction with its own fresh 15-minute token, so editing this message never runs out of runway the way a single long-lived token would.
    return sendV2Payload(interaction, withShareButton(panel, isEphemeral), { skipExpiry: true });
}

module.exports = {
    encodeState, decodeState, defaultState, clampFocus,
    buildCalculatorPanel, buildSetupPanel, buildMissingBasketPanel, buildDrawInfoPanel, buildHelpPanel, buildSavedPanel, savedChecksum, savedDescription,
    buildCostBlock, entryFor, regionsWithData, usedTypes, groupForDisplay,
    isDoubleCPEventLive, findLiveDoubleCPEntry, execute,
    parseAmount, applySelection, shortName, SHORT_NAME, slashShortcut,
    setTypeCount, SETUP_CONTAINER_BUDGET, SETUP_JSON_BUDGET, MAX_LINES, MAX_SAVED, linePages
};
