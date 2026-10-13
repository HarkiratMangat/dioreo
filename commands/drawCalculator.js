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
const { pullCount, upgradeCost, remainingToFinish, basketCost } = require('../utils/drawCost');
const { CP_PACKAGES, formatMoney, optimizePurchase } = require('../utils/cpPackages');

// 📝 PLAYER-FACING VOCABULARY, decided by Harkirat 2026-08-27 after three rounds of rejected candidates. The saved thing is a **calculation** (his own word: "reset/new calculation"); one row in it is a **line** (provisional -- he expects to revisit it). Both replace "basket"/"banner": "banner" collides with Discord profile banners, and every container metaphor (basket/cart/plan/list) read wrong because the player is PURCHASING and budgeting, not collecting. INTERNAL identifiers (DrawBasket, drawBasketStore, `basket`, `banners`) deliberately keep the old names -- renaming the model would churn PRIVACY.md, the store, and every test for something no user can see. Only strings a player reads are in scope here.
const DRAW_KEYS = Object.keys(DRAW_META);
// 4, not 5, since 2026-10-13 14:26 EDT: each line now carries its own ▲ (a Section with a button accessory, 3 components) in place of the shared reorder select and ▲/▼ row, and 5 such lines measured past the 40-component cap. Same count the setup form uses.
const MAX_BANNERS_PER_PAGE = 4;
// The SETUP screen paginates tighter than the Edit page, and the difference is a budget fact, not an inconsistency: setup also carries the saved-calculations list, the draw multi-select, the region row and the Calculate row, all of which the Edit page does without. Measured by the sweep in scripts/drawCalcBudget.test.js -- change this number and that test tells you immediately whether it still fits.
const SETUP_LINES_PER_PAGE = 4;
// The setup form's own budget (container included): 40, minus the Show Everyone row (2) and the bottom nav row at its widest on the form (1 + 4 buttons, counting the dev-only style switch). buildSetupPanel drops lines per page until it fits, so a style that adds rows can never push a send over the cap.
const SETUP_CONTAINER_BUDGET = 33;

// 🧪 THREE WAYS TO SET HOW MANY OF A DRAW (2026-10-13 17:46 EDT). Harkirat asked for a way to pick quantities of the same draw up front, was unsure which shape, and asked for all three built so he could try each in the bot:
//   A · one "How many of each?" dropdown in place of "+ Add the same draw again"
//   B · a "× N" dropdown per picked draw (falls back to A when the form cannot fit it)
//   C · "+ Add another" / "− Remove" options inside each line's own pulls dropdown
// The data model is unchanged: copies are still separate lines, each with its own pulls. Which style renders is process-wide, from CALC_QTY_STYLE (default A), and the dev bot shows a "Test: style" button on the form that cycles it. Once he picks one, delete the other two and the switch.
const QTY_STYLES = ['A', 'B', 'C'];
// A const holder, not a module-scope `let`: scripts/hotpatch.test.js refuses a `let` because a hot reload would silently reset it. A reload resetting this dev switch to the default is harmless.
const qtyState = { style: QTY_STYLES.includes(process.env.CALC_QTY_STYLE) ? process.env.CALC_QTY_STYLE : 'A' };
function getQtyStyle() { return qtyState.style; }
function setQtyStyle(style) { if (QTY_STYLES.includes(style)) qtyState.style = style; return qtyState.style; }
function cycleQtyStyle() { return setQtyStyle(QTY_STYLES[(QTY_STYLES.indexOf(qtyState.style) + 1) % QTY_STYLES.length]); }
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

// SHORT NAMES for the calculator's own pickers (2026-10-13 12:40 EDT, Harkirat's click-test). Discord cuts a chosen option's chip after roughly 24 characters, and the full names put the only distinguishing word LAST -- "Legendary Weapon Draw (R" was all that showed, which cannot tell Reactive from Non-Reactive. These lead with what separates one draw from another and stay under the cut. The full name still appears in every text list and option description. Calculator-only: /draw prices keeps DRAW_META's names.
const SHORT_NAME = {
    mythicWeapon: 'Mythic Weapon',
    mythicCharacter: 'Mythic Character',
    legendaryGunReactive: 'Reactive Legendary',
    legendaryGunNonReactive: 'Non-Reactive Legendary',
    doubleLegendaryWeapons: 'Double Legendary',
    legendaryCharacterWeapon: 'Legendary Character',
    sevenSpinLegendaryWeapon: '7-Spin Legendary',
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
        notes.push(`${drawName(draw)} has ${total} pulls, so ${pullsDone} was set to ${total}.`);
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
    return {
        verb: parts[1] || 'landing',
        basketId: parts[2] || null,
        page: Number(get('g', 0)) || 0,
        detail: get('x', '0') === '1',
        focus: focusRaw === '' ? null : (Number(focusRaw) || 0),
        authorId: authorB36 ? fromBase36Id(authorB36) : null,
        bpage: Number(get('p', 0)) || 0,
        targetRegion: regionDigits ? `region_${regionDigits}` : null,
        mask: maskRaw ? (parseInt(maskRaw, 36) || 0) : 0
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
            type: 3, custom_id: encodeState('draws', state), placeholder: 'Which draws are you pricing out?',
            min_values: 0, max_values: DRAW_KEYS.length,
            // Descriptions inherited from the retired single-pick landing select: a player choosing what to price needs the pull count and the full fresh cost at THIS region, not just a bare total.
            options: DRAW_KEYS.map(key => {
                const total = pullCount(basket.region, key);
                const upgrade = total !== null ? upgradeCost(basket.region, key) : null;
                return {
                    label: shortName(key),
                    value: key,
                    description: total === null
                        ? `${DRAW_META[key].name} · no data at ${regionLabel(basket.region)} yet`
                        : `${plural(total, 'pull')} · ${fmt(remainingToFinish(basket.region, key, 0))} CP total${upgrade !== null ? ` + ${fmt(upgrade)} Upgrade` : ''} · ${DRAW_META[key].name}`.slice(0, 100),
                    emoji: emojis.parseEmoji(emojis[DRAW_META[key].tier]),
                    default: present.has(key)
                };
            })
        }]
    };
}

// Page 2's per-banner pulls-done dropdown. 🔴 The placeholder is REPLACED by the chosen option once picked, so without a banner number in every option a set dropdown stops saying which banner it belongs to (spec §2, found live) -- every option and the placeholder both carry `#N`. `f` here carries WHICH banner index this specific select edits, not the reorder pointer -- a per-control target, scoped to this one customId, distinct from the reorder focus stored across renders.
function bannerPullsRow(state, basket, index, { lineActions = false } = {}) {
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
    for (let n = 0; n <= total && options.length < 25; n++) {
        // The draw's name rides in the LABEL (2026-10-13 12:40 EDT): a closed select shows only the chosen option's label, so "#1 — Not started" / "#2 — Not started" could not say which draw each line was once two different draws were in play.
        options.push({
            label: `#${index + 1} ${shortName(banner.drawKey)} · ${n === 0 ? 'not started' : `${plural(n, 'pull')} done`}`,
            value: String(n),
            description: n === total ? `Finished · nothing left on ${meta.name}` : `${fmt(remainingToFinish(basket.region, banner.drawKey, n))} CP left on ${meta.name}`,
            default: n === banner.pullsDone
        });
    }
    // Style C puts the quantity controls inside the line's own dropdown, below the pull counts.
    if (lineActions) {
        options.push({ label: `+ Add another ${shortName(banner.drawKey)}`, value: 'add', description: 'A second copy of this draw, starting at 0 pulls' });
        options.push({ label: `− Remove line #${index + 1}`, value: 'del', description: banner.pullsDone ? `Removes it and its ${plural(banner.pullsDone, 'pull')}` : 'Removes this line' });
    }
    return { type: 1, components: [{ type: 3, custom_id: encodeState('bpulls', rowState), placeholder: `#${index + 1} ${shortName(banner.drawKey)}`, options }] };
}

// Style A: one dropdown, every picked draw × 1..max. Picking sets that draw's count.
function qtyAllRow(state, basket) {
    const types = usedTypes(basket.banners).filter(k => DRAW_META[k]);
    const max = maxCountFor(types.length);
    const options = [];
    for (const t of types) {
        const cur = basket.banners.filter(b => b.drawKey === t).length;
        for (let n = 1; n <= max; n++) options.push({
            label: `${shortName(t)} × ${n}`, value: `${t}:${n}`,
            description: n === cur ? 'What you have now' : n > cur ? `Adds ${copies(n - cur)}` : `Removes ${copies(cur - n)}`,
            emoji: emojis.parseEmoji(emojis[DRAW_META[t].tier])
        });
    }
    return { type: 1, components: [{ type: 3, custom_id: encodeState('qty', state), placeholder: 'How many of each draw?', options: options.slice(0, 25) }] };
}

// Style B: one "× N" dropdown per picked draw, showing its current count.
function qtyTypeRow(state, basket, drawKey) {
    const cur = basket.banners.filter(b => b.drawKey === drawKey).length;
    const max = Math.min(25, Math.max(4, cur));
    return { type: 1, components: [{
        type: 3, custom_id: encodeState('qty', state), placeholder: `${shortName(drawKey)} × ${cur}`,
        options: Array.from({ length: max }, (_, i) => ({ label: `${shortName(drawKey)} × ${i + 1}`, value: `${drawKey}:${i + 1}`, default: i + 1 === cur, emoji: emojis.parseEmoji(emojis[DRAW_META[drawKey].tier]) }))
    }] };
}

// "+ Add another" -- lists the DISTINCT types already in the basket (spec §2); picking one appends a fresh banner (0 pulls) of that same type as a new, independently-orderable row.
function addAnotherRow(state, basket) {
    // Filter to keys drawprices still knows -- buildDrawEntries indexes DRAW_META directly and would throw on a retired key (same hazard drawName() guards for the text paths).
    const types = usedTypes(basket.banners).filter(k => DRAW_META[k]);
    return {
        type: 1,
        components: [{
            type: 3, custom_id: encodeState('addmore', state), placeholder: '+ Add the same draw again (two running at once)...',
            options: types.map(key => ({
                label: shortName(key),
                value: key,
                description: `A second ${DRAW_META[key].name}, starting at 0 pulls`.slice(0, 100),
                emoji: emojis.parseEmoji(emojis[DRAW_META[key].tier])
            }))
        }]
    };
}

function pageNavRow(state, banners, perPage = MAX_BANNERS_PER_PAGE) {
    const totalPages = Math.max(1, Math.ceil(banners.length / perPage));
    const current = Math.min(state.bpage || 0, totalPages - 1);
    return {
        type: 1,
        components: [
            { type: 2, style: 2, label: '◀ Prev', custom_id: encodeState('bpage', { ...state, bpage: Math.max(0, current - 1) }), disabled: current === 0 },
            { type: 2, style: 2, label: `Page ${current + 1}/${totalPages}`, custom_id: encodeState('bpage', state), disabled: true },
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
            style: key === basket.region ? 1 : 2,
            disabled: key === basket.region,
            custom_id: encodeState('region', { ...state, targetRegion: key }),
            label: regionLabel(key),
            emoji: emojis.parseEmoji(emojis[REGION_EMOJI_KEY[key]])
        }))
    };
}

// The caption above the region buttons (2026-10-13 12:40 EDT). Three "10 / 20 / 30 CP" buttons sit among a dozen real CP amounts and read like one of them; nothing said what a region is or how a player finds theirs. The first pull's price IS the region, so that is the one sentence that answers both.
function regionCaption() { return { type: 10, content: '-# **Region** · the CP price of your first pull on a draw' }; }

// The upgrade toggle shows only when a line's draw HAS an upgrade somewhere (2026-10-13 12:40 EDT). It used to show "Upgrade: NO" on a calculation of Legendary draws, which have none -- a control that could not change anything. Labels stay "Upgrade: YES / NO" (2026-10-13 15:21 EDT, Harkirat: "it's like super long... Yes, upgrade no"): the 2026-10-13 round had made them "Included / Not included", which he turned down as too long.
function upgradeButton(state, basket, extra = {}) {
    if (!(basket?.banners || []).some(b => hasUpgradeAnywhere(b.drawKey))) return null;
    const cardEmoji = usedTypes(basket.banners).map(upgradeCardEmoji).find(Boolean);
    return { type: 2, style: basket.includeUpgrades ? 3 : 2, label: basket.includeUpgrades ? 'Upgrade: YES' : 'Upgrade: NO', custom_id: encodeState('upg', state), ...(cardEmoji ? { emoji: emojis.parseEmoji(cardEmoji) } : {}), ...extra };
}

function costActionRow(state, basket) {
    return {
        type: 1,
        components: [
            { type: 2, style: 2, label: basket.balance ? `Balance: ${fmt(basket.balance)} CP` : 'Set Balance', custom_id: encodeState('modal', state), emoji: emojis.parseEmoji(emojis.cp2) },
            upgradeButton(state, basket),
            { type: 2, style: 2, label: 'Edit Draws', custom_id: encodeState('page', { ...state, page: 1 }) }
        ].filter(Boolean)
    };
}

// The confirm a draw untick needs when it would delete progress (2026-10-13 12:40 EDT). Unticking a draw in the picker removes EVERY line of it; with progress on one, that silently threw away pulls the player had entered. `mask` is the selection they asked for, applied only when they confirm.
function dropConfirmRow(state, mask, count, verb = 'dropok') {
    return {
        type: 1,
        components: [
            { type: 2, style: 4, label: `Remove ${plural(count, 'line')}`, custom_id: encodeState(verb, { ...state, mask }) },
            { type: 2, style: 2, label: 'Keep them', custom_id: encodeState('page', { ...state, page: 0 }) }
        ]
    };
}

// NO EMOJI on either button (2026-08-27, Harkirat) -- `mngEdit` was a pencil paired with a button labelled "Save", which never matched, and a destructive action reads clearer without decoration. Rename doubles as "Save" for an unnamed basket -- naming it IS the save, since that is the one thing that exempts a basket from the 30-day TTL (models/DrawBasket.js). Delete is two-step, same pattern as Reset below -- one misclick must never destroy a named basket (plan Task 5's own verify requirement).
function basketManageRow(state, basket) {
    const deleteArmed = state.verb === 'delarm';
    // Delete shows only on a SAVED calculation (2026-10-13 12:40 EDT). On an unsaved one it did exactly what New Calculation does, so the two sat side by side meaning the same thing.
    const components = [{ type: 2, style: 2, label: basket.name ? 'Rename' : 'Save', custom_id: encodeState('modal_name', state) }];
    if (basket.name) components.push({ type: 2, style: deleteArmed ? 4 : 2, label: deleteArmed ? 'Delete Calculation — click again' : 'Delete Calculation', custom_id: encodeState(deleteArmed ? 'del' : 'delarm', state) });
    return { type: 1, components };
}

// 🔴 RETURNED AS A TOP-LEVEL SIBLING of the Container, never pushed inside it (fixed 2026-08-27) -- it was rendering as a child, which boxes the nav inside the panel's accent border instead of sitting under it the way every other command in this bot places its nav. buildCalculatorPanel is the ONE place that attaches it; do not push it into a page builder's `components`. Replaces buildGlobalNavRow entirely (Task 9) -- Draw Info and Help are the calculator's own ephemeral panels, Draw Prices is the one cross-link back to the sibling command, Reset is two-step (Danger style once armed) exactly like Delete Basket above, and clears basket, balance, focus and page (spec §9) without deleting the basket document itself. `showReset` is false on the setup form: there is no computed result to clear yet, and a live button that does nothing visible is worse than an absent one. On a submitted calculation it reads "New Calculation" -- Harkirat's own phrase for the action that ends a result's persistence and returns to the form.
function bottomNavRow(state, { showReset = true } = {}) {
    const resetArmed = state.verb === 'resetarm';
    const components = [
        { type: 2, style: 2, label: 'Draw Info', custom_id: encodeState('info', state) },
        // Its own private message (2026-10-13 12:40 EDT), like Draw Info -- it used to be the global nav's `nav_prices`, which turned THIS panel into /draw prices in place.
        { type: 2, style: 2, label: 'Draw Prices', custom_id: encodeState('prices', state) }
    ];
    if (showReset) components.push({ type: 2, style: resetArmed ? 4 : 2, label: resetArmed ? 'New Calculation — click again' : 'New Calculation', custom_id: encodeState(resetArmed ? 'reset' : 'resetarm', state) });
    components.push({ type: 2, style: 2, label: 'Help', custom_id: encodeState('help', state) });
    // Dev bot only, on the form: cycles the three quantity styles so Harkirat can try each (see QTY_STYLES).
    if (!showReset && process.env.NODE_ENV === 'development') components.push({ type: 2, style: 2, label: `Test: style ${getQtyStyle()}`, custom_id: encodeState('qstyle', state) });
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
            upgradeButton(state, basket, { disabled: !hasBasket }),
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
    const lines = [`## COST BREAKDOWN`];
    lines.push(`${dot} CP Needed: **\`${fmt(needed)} CP\`**`);
    // No balance means no balance line (2026-10-13 12:40 EDT): "Not specified" in a code chip read like a value.
    lines.push(basket.balance ? `${dot} Balance: **\`${fmt(basket.balance)} CP\`** ${dash} Region: **\`${regionLabel(basket.region)}\`**` : `${dot} Region: **\`${regionLabel(basket.region)}\`**`);
    if (unpriced.length) {
        lines.push(`⚠️ **${plural(unpriced.length, 'line')} excluded** — no sourced pricing at ${regionLabel(basket.region)}: ${unpriced.map(b => drawName(b.drawKey)).join(', ')}.`);
    }
    // 🔴 A SILENT ZERO, FOUND 2026-10-13 12:40 EDT. Mythic draws have no upgrade price at the 20 CP region, so "Upgrade: Included" added nothing there while the button claimed it was in the total. Say so instead.
    const upgradeMissing = basket.includeUpgrades ? perBanner.filter(b => b.priced && b.upgrade === null && hasUpgradeAnywhere(b.drawKey)) : [];
    if (upgradeMissing.length) {
        lines.push(`⚠️ **Upgrade not included** for ${[...new Set(upgradeMissing.map(b => drawName(b.drawKey)))].join(', ')} — no upgrade price at ${regionLabel(basket.region)} yet.`);
    }

    if (!compact) {
        // NO explicit blank line before a `##` heading (2026-08-27) -- Discord gives a heading its own top margin, and that margin does NOT collapse against a blank line, so the two stacked into the gap Harkirat flagged between COST BREAKDOWN and PRIORITY PLAN. Same reasoning for the missing blank after the loop below.
        lines.push(`## PRIORITY PLAN`);
        let running = 0;
        perBanner.forEach((b, i) => {
            running += b.cost;
            const total = pullCount(basket.region, b.drawKey);
            lines.push(`${dot} ${i + 1}. ${drawName(b.drawKey)} — ${b.pullsDone}/${total ?? '?'} ${dash} **${fmt(b.cost)} CP** ${dash} running **${fmt(running)} CP**`);
        });
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
    // Compact line (2026-10-13 12:40 EDT): the price first, the packs, then what is left over -- it used to say the CP total twice ("10,800 CP for CA$129.99 — 1× 10,800 CP") and hide the leftover entirely.
    const packageLines = (label, r) => compact
        ? [`**${label}:** **\`${formatMoney(r.totalCents, currency)}\`** for ${describeCp(r)}${r.leftoverCp > 0 ? ` · **${fmt(r.leftoverCp)} CP** left over` : ''}`]
        : [
            `**${label} Method**`,
            `> **\`${fmt(r.totalCp)} CP\`** for **\`${formatMoney(r.totalCents, currency)}\`**`,
            `${describeCp(r)} ⌇ **\`${fmt(r.totalCp)} CP\`**`,
            `${describePrices(r)} ⌇ **\`${formatMoney(r.totalCents, currency)}\`**`,
            `-# Left Over: **\`${fmt(r.leftoverCp)} CP\`** (${fmt(r.totalCp)} CP Purchase − ${fmt(shortfall)} CP Needed)`
        ];

    lines.push('## RECOMMENDED PACKAGE');
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
function titleBlock(basket) {
    const suffix = basket && basket.name ? ` — ${basket.name}` : '';
    return { type: 10, content: `## ${emojis.calculator} Lucky Draw Calculator${suffix}` };
}

// ==========================================
// THE SETUP FORM -- the first screen, and the one the whole command now leads FROM
// ==========================================
// 🔴 THIS REVERSES THIS COMMAND'S OWN "never a setup form again" RULE, deliberately (Harkirat, 2026-08-27). That rule came from a single-draw panel where five interactions preceded any figure AT ALL, every single visit. Two things make this different, and both are load-bearing rather than cosmetic:
//   1. ONE screen. The saved-calculations list and the form share it -- loading an old calculation and starting a new one are both one interaction from opening the command, never a hop apart.
//   2. IT PERSISTS. Pressing Calculate sets `submitted` on the basket document, so the result is what you come back to -- until you press New Calculation. The form is filled in once, not on every visit.
// If either of those is ever removed, this is the old failure again and the old rule should come back.
function buildSetupPanel(state, basket, savedBaskets, accentColor, { region, notice = null, dropConfirm = null } = {}) {
    // A shim, so every row builder below works identically whether a draft document exists yet or not.
    const draft = basket || { banners: [], region: region || 'region_10', balance: 0, includeUpgrades: false };
    const banners = draft.banners || [];
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];
    if (notice) components.push({ type: 10, content: `-# ${notice}` });

    if (savedBaskets && savedBaskets.length) {
        components.push({ type: 10, content: `## SAVED CALCULATIONS\n${savedBaskets.map(b => `${emojis.smallDot} **${b.name}** — ${plural(b.banners.length, 'line')}`).join('\n')}` });
        components.push({
            type: 1, components: [{
                type: 3, custom_id: encodeState('load', state), placeholder: 'Load a saved calculation...',
                options: savedBaskets.slice(0, 25).map(b => ({ label: b.name, value: String(b._id), description: `${plural(b.banners.length, 'line')} · ${regionLabel(b.region)}` }))
            }]
        });
        components.push({ type: 14, spacing: 1, divider: true });
    }

    components.push({ type: 10, content: banners.length
        ? `## SET UP YOUR CALCULATION\n-# Set how many pulls you have already done on each draw, then press **Calculate**.`
        // Leads with what the player GETS (2026-10-13 12:40 EDT); it used to open with the steps.
        : `## SET UP YOUR CALCULATION\nSee how much CP you still need, and the cheapest way to buy it.\n-# Pick every draw you are pricing out, then set your progress, balance and region.` });
    // The untick confirm replaces the picker here too (2026-10-13 12:43 EDT): the form's picker deletes lines the same way the result page's does, and without this branch a draft's untick re-rendered unchanged with no explanation.
    components.push(dropConfirm ? dropConfirmRow(state, dropConfirm.mask, dropConfirm.count, dropConfirm.verb) : typesSelectRow(state, draft));

    const types = usedTypes(banners).filter(k => DRAW_META[k]);
    const tail = [{ type: 14, spacing: 1, divider: true }, regionCaption(), regionRow(state, draft), setupActionRow(state, basket)];
    // Builds the middle of the form for one quantity style at one lines-per-page. Pagination and the style-A dropdown are never both shown, the same budget rule "+ Add another" followed.
    const build = (perPage, style) => {
        const mid = [];
        if (style === 'B') for (const t of types) mid.push(qtyTypeRow(state, draft, t));
        const totalPages = Math.max(1, Math.ceil(banners.length / perPage));
        const bpage = Math.min(state.bpage || 0, totalPages - 1);
        const start = bpage * perPage;
        for (const i of banners.map((_, i) => i).slice(start, start + perPage)) mid.push(bannerPullsRow(state, draft, i, { lineActions: style === 'C' }));
        if (totalPages > 1) mid.push(pageNavRow({ ...state, bpage }, banners, perPage));
        else if (types.length && style === 'A') mid.push(qtyAllRow(state, draft));
        return [...components, ...mid, ...tail];
    };
    // Fewer lines per page until it fits; style B falls back to A when even one line per page will not.
    let out = [];
    for (const style of getQtyStyle() === 'B' ? ['B', 'A'] : [getQtyStyle()]) {
        for (let perPage = SETUP_LINES_PER_PAGE; perPage >= 1; perPage--) {
            out = build(perPage, style);
            if (1 + countComponents(out) <= SETUP_CONTAINER_BUDGET) return { type: 17, accent_color: accentColor, components: out };
        }
    }
    return { type: 17, accent_color: accentColor, components: out };
}

function buildMissingBasketPanel(state, savedBaskets, accentColor) {
    return buildSetupPanel({ ...state, basketId: null }, null, savedBaskets, accentColor, {
        region: 'region_10',
        notice: '⚠️ That saved calculation no longer exists — it may have expired, or been deleted.'
    });
}

function buildCostPage(state, basket, accentColor, options = {}) {
    const { currency = 'USD', client = null, liveDoubleCPEntry = null } = options;
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];

    if (!basket.banners.length) {
        // Empty basket returns to the landing look (spec §9), but STAYS bound to this basketId so picking a draw adds to the same (possibly named) basket instead of creating a second one.
        return buildSetupPanel(state, basket, options.savedBaskets, accentColor, { region: basket.region, notice: basket.name ? `"${basket.name}" is empty — pick a draw to add to it.` : null });
    }

    const groups = groupForDisplay(basket.banners);
    // "YOUR DRAWS", not "DRAWS IN PROGRESS" (2026-10-13 12:40 EDT) -- it headed lines at 0 pulls. And a grouped ×N keeps its progress figure; it used to drop it while a single line showed "— 0/10".
    components.push({ type: 10, content: `## YOUR DRAWS\n${groups.map(g => `${emojis.smallDot} ${drawName(g.drawKey)}${g.count > 1 ? ` ×${g.count}` : ''} — ${g.pullsDone}/${pullCount(basket.region, g.drawKey) ?? '?'}`).join('\n')}` });
    if (options.notice) components.push({ type: 10, content: `-# ${options.notice}` });
    if (options.dropConfirm) components.push(dropConfirmRow(state, options.dropConfirm.mask, options.dropConfirm.count, options.dropConfirm.verb));
    else components.push(typesSelectRow(state, basket));
    components.push({ type: 14, spacing: 1, divider: true });

    // Show Breakdown sits BESIDE the COST BREAKDOWN heading (2026-10-13 14:18 EDT, Harkirat: "why don't we move the show breakdown button? maybe inline with the cost breakdown section"). It is a Section with the button as its accessory, so the button sits next to what it expands; it also takes one button out of the action row, which wrapped Edit Draws onto a row of its own once a balance widened Set Balance.
    const costLines = buildCostBlock(state, basket, currency, client, { compact: !state.detail });
    const split = costLines.findIndex((l, i) => i > 0 && (l === '' || l.startsWith('## ')));
    const head = split === -1 ? costLines : costLines.slice(0, split);
    const tail = split === -1 ? [] : costLines.slice(split);
    while (tail[0] === '') tail.shift();
    components.push({
        type: 9,
        components: [{ type: 10, content: head.join('\n') }],
        accessory: { type: 2, style: 2, label: state.detail ? 'Simplify' : 'Show Breakdown', custom_id: encodeState('detail', state), emoji: emojis.parseEmoji(state.detail ? emojis.simplify : emojis.expand) }
    });
    if (tail.length) components.push({ type: 10, content: tail.join('\n') });
    components.push(costActionRow(state, basket));
    components.push(basketManageRow(state, basket));

    if (liveDoubleCPEntry || basket.entitlementMask) {
        components.push({ type: 10, content: liveDoubleCPEntry
            ? `-# 🎉 A **Double CP** event looks live right now${liveDoubleCPEntry.endDate ? ` (ends <t:${Math.floor(new Date(liveDoubleCPEntry.endDate).getTime() / 1000)}:R>)` : ''}. Tell the optimizer which packages you still have a 2X entitlement on.`
            : `-# Select which packages you still have an unused 2X entitlement on, if the event is running.` });
        components.push(entitlementSelectRow(state, basket));
    }
    components.push({ type: 14, spacing: 1, divider: true });
    components.push(regionCaption());
    components.push(regionRow(state, basket));
    return { type: 17, accent_color: accentColor, components };
}

function buildBasketPage(state, basket, accentColor) {
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];

    if (!basket.banners.length) {
        components.push({ type: 10, content: 'This calculation is empty — go back to the Cost page and pick a draw.' });
        components.push({ type: 1, components: [{ type: 2, style: 1, label: '◀ Cost Breakdown', custom_id: encodeState('page', { ...state, page: 0 }) }] });
        return { type: 17, accent_color: accentColor, components };
    }

    // 🔴 REORDER IS A ▲ ON EACH LINE (2026-10-13 14:26 EDT, Harkirat picked option A). It replaced a shared "Reorder: pick a line" select plus ▲/▼ buttons, where moving #5 to the top took a pick and four clicks; now each line's own heading carries a ▲ that moves it up one place, and the separate list that repeated every dropdown is gone. Priority is still the array order and is never sorted for the player.
    components.push({ type: 10, content: '## YOUR DRAWS\n-# Set the **pulls done** on each draw. ▲ moves a draw up the Priority Plan.' });

    const totalPages = Math.max(1, Math.ceil(basket.banners.length / MAX_BANNERS_PER_PAGE));
    const bpage = Math.min(state.bpage || 0, totalPages - 1);
    const start = bpage * MAX_BANNERS_PER_PAGE;
    const pageIndices = basket.banners.map((_, i) => i).slice(start, start + MAX_BANNERS_PER_PAGE);

    for (const i of pageIndices) {
        components.push({
            type: 9,
            components: [{ type: 10, content: `**#${i + 1}** · ${drawName(basket.banners[i].drawKey)}` }],
            accessory: { type: 2, style: 2, label: '▲', custom_id: encodeState('up', { ...state, focus: i }), disabled: i === 0 }
        });
        components.push(bannerPullsRow(state, basket, i));
    }

    if (totalPages > 1) components.push(pageNavRow({ ...state, bpage }, basket.banners));
    if (usedTypes(basket.banners).length) components.push(addAnotherRow(state, basket));

    components.push({ type: 14, spacing: 1, divider: true });
    components.push({ type: 1, components: [{ type: 2, style: 1, label: '◀ Cost Breakdown', custom_id: encodeState('page', { ...state, page: 0 }) }] });
    return { type: 17, accent_color: accentColor, components };
}

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
            '**Calculation** — everything you are pricing out in one go. Name it to keep it; see Save below.',
            '**Line** — one draw in that calculation, plus how many pulls you have already done on it. There is no "quantity": three Mythic Weapon draws are three separate lines, each with its own progress, because you are rarely equally far along on all three.',
            '**Priority** — the ORDER your draws appear in. It is never sorted for you; ▲ beside a draw on the Edit Draws page moves it up.',
            '**Simplify / Show Breakdown** — collapses or expands the full per-package math. Simplify still shows the total CP needed and the cheapest package.',
            '**Region** — the CP price of your first pull on a draw (10, 20 or 30 CP). It changes every price in the calculation.',
            '**Shortcut** — `/draw calculator draw: pulls: balance:` skips the form and opens straight on that draw\'s result.',
            '**Save** — naming a calculation is what keeps it. An unnamed one is cleared automatically after 30 days; a named one is kept until you delete it. Running `/draw calculator` again reopens the calculation you changed last.'
        ].join('\n\n') }
    ];
    return { type: 17, accent_color: accentColor, components };
}

// ==========================================
// DISPATCH
// ==========================================
// Returns the message's TOP-LEVEL component list, not a single Container -- the nav row is a sibling of the Container, not a child (see bottomNavRow). Landing/missing states get no nav row: there is nothing yet to reset, and Draw Info has nothing to show.
function buildCalculatorPanel(state, basket, accentColor, options = {}) {
    // No basket at all -> the setup form, empty. A basketId that resolved to nothing -> the same form, with a notice.
    if (!basket) {
        const container = state.basketId
            ? buildMissingBasketPanel(state, options.savedBaskets, accentColor)
            : buildSetupPanel(state, null, options.savedBaskets, accentColor, { region: options.region, notice: options.notice });
        return [container, bottomNavRow(state, { showReset: false })];
    }
    // 🔴 `submitted` is what separates a draft from a result, and it lives on the DOCUMENT, not the customId -- that is the whole reason a result survives a restart and "persists until reset / new calculation".
    if (!basket.submitted) {
        return [buildSetupPanel(state, basket, options.savedBaskets, accentColor, { notice: options.notice, dropConfirm: options.dropConfirm }), bottomNavRow(state, { showReset: false })];
    }
    const container = state.page === 1 ? buildBasketPage(state, basket, accentColor) : buildCostPage(state, basket, accentColor, options);
    return [container, bottomNavRow(state)];
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
    buildCalculatorPanel, buildSetupPanel, buildMissingBasketPanel, buildDrawInfoPanel, buildHelpPanel,
    buildCostBlock, entryFor, regionsWithData, usedTypes, groupForDisplay,
    isDoubleCPEventLive, findLiveDoubleCPEntry, execute,
    parseAmount, applySelection, shortName, SHORT_NAME, slashShortcut,
    setTypeCount, getQtyStyle, setQtyStyle, cycleQtyStyle, QTY_STYLES, SETUP_CONTAINER_BUDGET
};
