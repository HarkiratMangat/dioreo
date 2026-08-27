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

const DRAW_KEYS = Object.keys(DRAW_META);
const MAX_BANNERS_PER_PAGE = 5; // readability, not budget -- 9 fit inside the component cap (spec §2)

const BAR_FILLED = '▰';
const BAR_EMPTY = '▱';

function fmt(n) { return Number(n || 0).toLocaleString('en-US'); }
function regionLabel(region) { return `${(region || 'region_10').split('_')[1]} CP`; }
function plural(n, word) { return `${n} ${word}${n === 1 ? '' : 's'}`; }

const DRAW_DATA = require('./drawprices').DRAW_DATA;
function entryFor(region, drawKey) { return (DRAW_DATA[region] && DRAW_DATA[region][drawKey]) || null; }
function regionsWithData(drawKey) { return REGION_ORDER.filter(r => entryFor(r, drawKey)); }

function progressBar(done, total) {
    const filled = Math.max(0, Math.min(done, total));
    return BAR_FILLED.repeat(filled) + BAR_EMPTY.repeat(Math.max(0, total - filled));
}

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
    return {
        verb: parts[1] || 'landing',
        basketId: parts[2] || null,
        page: Number(get('g', 0)) || 0,
        detail: get('x', '0') === '1',
        focus: focusRaw === '' ? null : (Number(focusRaw) || 0),
        authorId: authorB36 ? fromBase36Id(authorB36) : null,
        bpage: Number(get('p', 0)) || 0,
        targetRegion: regionDigits ? `region_${regionDigits}` : null
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
// Landing's draw picker -- also reused as the "start a new basket" control when an existing (possibly named) basket has been emptied by Reset (state.basketId still points at it, so picking here ADDS to that same basket rather than creating a second one -- see buildLandingPanel).
function drawSelectRow(state, region) {
    return {
        type: 1,
        components: [{
            type: 3, custom_id: encodeState('draws', state), placeholder: 'Pick a draw to add to your basket...',
            options: DRAW_KEYS.map(key => {
                const total = pullCount(region, key);
                const upgrade = total !== null ? upgradeCost(region, key) : null;
                return {
                    label: DRAW_META[key].name,
                    value: key,
                    description: total === null
                        ? `No data at ${regionLabel(region)} yet`
                        : `${plural(total, 'pull')} · ${fmt(remainingToFinish(region, key, 0))} CP total${upgrade !== null ? ` + ${fmt(upgrade)} CP Upgrade` : ''}`,
                    emoji: emojis.parseEmoji(emojis[DRAW_META[key].tier])
                };
            })
        }]
    };
}

// COST page's multi-select -- "which draw TYPES are in this basket". Selecting a type not currently present appends ONE fresh banner (0 pulls, no inherited defaults -- spec §2, decision 11: "calculators don't assume or constrain answers"). Deselecting a present type removes EVERY banner of that type -- a duplicate of a type is added back one at a time via "+ Add another" on Page 2, which this control cannot express (a multi-select's state is a set, not a multiset).
function typesSelectRow(state, basket) {
    const present = new Set(usedTypes(basket.banners));
    return {
        type: 1,
        components: [{
            type: 3, custom_id: encodeState('draws', state), placeholder: 'Which draws are in your basket?',
            min_values: 0, max_values: DRAW_KEYS.length,
            options: DRAW_KEYS.map(key => ({
                label: DRAW_META[key].name,
                value: key,
                description: `${fmt(remainingToFinish(basket.region, key, 0))} CP fresh`,
                emoji: emojis.parseEmoji(emojis[DRAW_META[key].tier]),
                default: present.has(key)
            }))
        }]
    };
}

// Page 2's per-banner pulls-done dropdown. 🔴 The placeholder is REPLACED by the chosen option once picked, so without a banner number in every option a set dropdown stops saying which banner it belongs to (spec §2, found live) -- every option and the placeholder both carry `#N`. `f` here carries WHICH banner index this specific select edits, not the reorder pointer -- a per-control target, scoped to this one customId, distinct from the reorder focus stored across renders.
function bannerPullsRow(state, basket, index) {
    const banner = basket.banners[index];
    const total = pullCount(basket.region, banner.drawKey);
    const meta = DRAW_META[banner.drawKey];
    const rowState = { ...state, focus: index };
    if (total === null) {
        return { type: 1, components: [{
            type: 3, custom_id: encodeState('bpulls', rowState), placeholder: `#${index + 1} — ${meta.name} (no data at this region)`,
            options: [{ label: 'No data at this region', value: '0', default: true }], disabled: true
        }] };
    }
    const options = [];
    for (let n = 0; n <= total && options.length < 25; n++) {
        options.push({
            label: `#${index + 1} — ${n === 0 ? 'Not started' : `${plural(n, 'pull')} done`}`,
            value: String(n),
            description: n === 0 ? meta.name : `${fmt(remainingToFinish(basket.region, banner.drawKey, n))} CP left on ${meta.name}`,
            default: n === banner.pullsDone
        });
    }
    return { type: 1, components: [{ type: 3, custom_id: encodeState('bpulls', rowState), placeholder: `#${index + 1} — ${meta.name}`, options }] };
}

// "+ Add another" -- lists the DISTINCT types already in the basket (spec §2); picking one appends a fresh banner (0 pulls) of that same type as a new, independently-orderable row.
function addAnotherRow(state, basket) {
    const types = usedTypes(basket.banners);
    return {
        type: 1,
        components: [{
            type: 3, custom_id: encodeState('addmore', state), placeholder: '+ Add another banner of a draw you already have...',
            options: types.map(key => ({
                label: DRAW_META[key].name,
                value: key,
                description: `Adds one more ${DRAW_META[key].name} banner at 0 pulls`,
                emoji: emojis.parseEmoji(emojis[DRAW_META[key].tier])
            }))
        }]
    };
}

// The ONE remaining focus pointer (spec §2) -- which banner ▲/▼ will move. A select, not a per-banner button pair, because a button pair per banner would cost a whole extra Action Row PER banner (5 banners = 5 extra rows) for a control used far less often than pulls-done.
function reorderFocusRow(state, basket) {
    return {
        type: 1,
        components: [{
            type: 3, custom_id: encodeState('setfocus', state), placeholder: 'Reorder: pick a banner to move...',
            options: basket.banners.map((b, i) => ({
                label: `#${i + 1} — ${DRAW_META[b.drawKey].name} (${b.pullsDone}/${pullCount(basket.region, b.drawKey) ?? '?'})`,
                value: String(i),
                default: state.focus === i
            }))
        }]
    };
}

function reorderButtonsRow(state, basket) {
    const focus = clampFocus(state.focus, basket.banners.length);
    return {
        type: 1,
        components: [
            { type: 2, style: 2, label: '▲ Move Up', custom_id: encodeState('up', { ...state, focus }), disabled: focus === null || focus === 0 },
            { type: 2, style: 2, label: '▼ Move Down', custom_id: encodeState('down', { ...state, focus }), disabled: focus === null || focus === basket.banners.length - 1 }
        ]
    };
}

function pageNavRow(state, banners) {
    const totalPages = Math.max(1, Math.ceil(banners.length / MAX_BANNERS_PER_PAGE));
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

function costActionRow(state, basket) {
    const cardEmoji = usedTypes(basket.banners).map(upgradeCardEmoji).find(Boolean);
    return {
        type: 1,
        components: [
            { type: 2, style: 2, label: 'Set Balance', custom_id: encodeState('modal', state), emoji: emojis.parseEmoji(emojis.cp2) },
            { type: 2, style: basket.includeUpgrades ? 3 : 2, label: basket.includeUpgrades ? 'Upgrade: YES' : 'Upgrade: NO', custom_id: encodeState('upg', state), ...(cardEmoji ? { emoji: emojis.parseEmoji(cardEmoji) } : {}) },
            { type: 2, style: 2, label: state.detail ? 'Simplify' : 'Show Breakdown', custom_id: encodeState('detail', state), emoji: emojis.parseEmoji(state.detail ? emojis.simplify : emojis.expand) },
            { type: 2, style: 2, label: 'Edit Basket', custom_id: encodeState('page', { ...state, page: 1 }) }
        ]
    };
}

// Rename doubles as "Save" for an unnamed basket -- naming it IS the save, since that is the one thing that exempts a basket from the 30-day TTL (models/DrawBasket.js). Delete is two-step, same pattern as Reset below -- one misclick must never destroy a named basket (plan Task 5's own verify requirement).
function basketManageRow(state, basket) {
    const deleteArmed = state.verb === 'delarm';
    return {
        type: 1,
        components: [
            { type: 2, style: 2, label: basket.name ? 'Rename' : 'Save', custom_id: encodeState('modal_name', state), emoji: emojis.parseEmoji(emojis.mngEdit) },
            { type: 2, style: deleteArmed ? 4 : 2, label: deleteArmed ? 'Delete Basket — click again' : 'Delete Basket', custom_id: encodeState(deleteArmed ? 'del' : 'delarm', state), emoji: emojis.parseEmoji(emojis.mngDelete) }
        ]
    };
}

// Replaces buildGlobalNavRow entirely (Task 9) -- Draw Info and Help are the calculator's own ephemeral panels, Draw Prices is the one cross-link back to the sibling command, Reset is two-step (Danger style once armed) exactly like Delete Basket above, and clears basket, balance, focus and page (spec §9) without deleting the basket document itself.
function bottomNavRow(state) {
    const resetArmed = state.verb === 'resetarm';
    return {
        type: 1,
        components: [
            { type: 2, style: 2, label: 'Draw Info', custom_id: encodeState('info', state) },
            { type: 2, style: 2, label: 'Draw Prices', custom_id: 'nav_prices' },
            { type: 2, style: resetArmed ? 4 : 2, label: resetArmed ? 'Reset — click again' : 'Reset', custom_id: encodeState(resetArmed ? 'reset' : 'resetarm', state) },
            { type: 2, style: 2, label: 'Help', custom_id: encodeState('help', state) }
        ]
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

    const lines = [`## COST BREAKDOWN`];
    lines.push(`${dot} Draws in basket: **\`${fmt(basket.banners.length)}\`**`);
    lines.push(`${dot} Balance: **\`${basket.balance ? `${fmt(basket.balance)} CP` : 'Not specified'}\`** ${dash} Region: **\`${regionLabel(basket.region)}\`**`);
    lines.push(`${dot} CP Needed: **\`${fmt(needed)} CP\`**`);
    if (unpriced.length) {
        lines.push(`⚠️ **${plural(unpriced.length, 'banner')} excluded** — no sourced pricing at ${regionLabel(basket.region)}: ${unpriced.map(b => DRAW_META[b.drawKey].name).join(', ')}.`);
    }

    if (!compact) {
        lines.push('');
        lines.push(`## PRIORITY PLAN`);
        let running = 0;
        perBanner.forEach((b, i) => {
            running += b.cost;
            const total = pullCount(basket.region, b.drawKey);
            lines.push(`${dot} ${i + 1}. ${DRAW_META[b.drawKey].name} — ${b.pullsDone}/${total ?? '?'} ${dash} **${fmt(b.cost)} CP** ${dash} running **${fmt(running)} CP**`);
        });
        lines.push('');
    }

    if (shortfall <= 0) {
        lines.push('');
        lines.push('✅ **Your balance already covers this.**');
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
    const packageLines = (label, r) => compact
        ? [`**${label}:** **\`${fmt(r.totalCp)} CP\`** for **\`${formatMoney(r.totalCents, currency)}\`** — ${describeCp(r)}`]
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
        lines.push(...packageLines('Stock Up', result.stockUp));
        lines.push(`-# Costs **\`${formatMoney(result.stockUp.extraCents, currency)}\`** more than Cheapest, but banks **\`${fmt(result.stockUp.extraCp)}\`** extra CP at a better rate — worth it only if you plan to keep pulling.`);
    }
    if (!compact) {
        const settingsMention = client ? mentionCommand(client, '/settings') : '`/settings`';
        lines.push(`-# _Estimates only — varies by tax/conversion. Currency: **${currency}** (Change in ${settingsMention})._`);
    }
    return lines;
}

// ==========================================
// PAGES
// ==========================================
function titleBlock(basket) {
    const suffix = basket && basket.name ? ` — ${basket.name}` : '';
    return { type: 10, content: `## ${emojis.calculator} Lucky Draw Calculator${suffix}` };
}

function buildLandingPanel(state, savedBaskets, accentColor, { region, notice = null } = {}) {
    const components = [
        titleBlock(null),
        { type: 14, spacing: 2, divider: true }
    ];
    if (notice) components.push({ type: 10, content: `-# ${notice}` });
    components.push({ type: 10, content: '🎯 Pick a draw below to start (or add to) your basket, and see what you still need.' });
    components.push(drawSelectRow(state, region));
    if (savedBaskets && savedBaskets.length) {
        components.push({ type: 14, spacing: 1, divider: true });
        components.push({ type: 10, content: `## SAVED BASKETS\n${savedBaskets.map(b => `${emojis.smallDot} **${b.name}** — ${plural(b.banners.length, 'banner')}`).join('\n')}` });
        components.push({
            type: 1, components: [{
                type: 3, custom_id: encodeState('load', state), placeholder: 'Load a saved basket...',
                options: savedBaskets.slice(0, 25).map(b => ({ label: b.name, value: String(b._id), description: `${plural(b.banners.length, 'banner')} · ${regionLabel(b.region)}` }))
            }]
        });
    }
    return { type: 17, accent_color: accentColor, components };
}

function buildMissingBasketPanel(state, savedBaskets, accentColor) {
    return buildLandingPanel({ ...state, basketId: null }, savedBaskets, accentColor, {
        region: 'region_10',
        notice: '⚠️ That saved basket no longer exists — it may have expired, or been deleted.'
    });
}

function buildCostPage(state, basket, accentColor, options = {}) {
    const { currency = 'USD', client = null, liveDoubleCPEntry = null } = options;
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];

    if (!basket.banners.length) {
        // Empty basket returns to the landing look (spec §9), but STAYS bound to this basketId so picking a draw adds to the same (possibly named) basket instead of creating a second one.
        return buildLandingPanel(state, options.savedBaskets, accentColor, { region: basket.region, notice: basket.name ? `"${basket.name}" is empty — pick a draw to add to it.` : null });
    }

    const groups = groupForDisplay(basket.banners);
    components.push({ type: 10, content: `## YOUR BASKET\n${groups.map(g => `${emojis.smallDot} ${DRAW_META[g.drawKey].name}${g.count > 1 ? ` ×${g.count}` : ` — ${g.pullsDone}/${pullCount(basket.region, g.drawKey) ?? '?'}`}`).join('\n')}` });
    components.push(typesSelectRow(state, basket));
    components.push({ type: 14, spacing: 1, divider: true });

    components.push({ type: 10, content: buildCostBlock(state, basket, currency, client, { compact: !state.detail }).join('\n') });
    components.push(costActionRow(state, basket));
    components.push(basketManageRow(state, basket));

    if (liveDoubleCPEntry || basket.entitlementMask) {
        components.push({ type: 10, content: liveDoubleCPEntry
            ? `-# 🎉 A **Double CP** event looks live right now${liveDoubleCPEntry.endDate ? ` (ends <t:${Math.floor(new Date(liveDoubleCPEntry.endDate).getTime() / 1000)}:R>)` : ''}. Tell the optimizer which packages you still have a 2X entitlement on.`
            : `-# Select which packages you still have an unused 2X entitlement on, if the event is running.` });
        components.push(entitlementSelectRow(state, basket));
    }
    components.push({ type: 14, spacing: 1, divider: true });
    components.push(regionRow(state, basket));
    components.push(bottomNavRow(state));
    return { type: 17, accent_color: accentColor, components };
}

function buildBasketPage(state, basket, accentColor) {
    const components = [titleBlock(basket), { type: 14, spacing: 2, divider: true }];

    if (!basket.banners.length) {
        components.push({ type: 10, content: 'Your basket is empty — go back to the Cost page and pick a draw.' });
        components.push({ type: 1, components: [{ type: 2, style: 1, label: '◀ Cost Breakdown', custom_id: encodeState('page', { ...state, page: 0 }) }] });
        components.push(bottomNavRow(state));
        return { type: 17, accent_color: accentColor, components };
    }

    components.push({ type: 10, content: '-# Select the **Pulls Done** for each banner below. Reorder with the select + ▲/▼ near the bottom.' });

    const totalPages = Math.max(1, Math.ceil(basket.banners.length / MAX_BANNERS_PER_PAGE));
    const bpage = Math.min(state.bpage || 0, totalPages - 1);
    const start = bpage * MAX_BANNERS_PER_PAGE;
    const pageIndices = basket.banners.map((_, i) => i).slice(start, start + MAX_BANNERS_PER_PAGE);

    components.push({ type: 10, content: `## BASKET LIST\n${pageIndices.map(i => `${emojis.smallDot} #${i + 1} — ${DRAW_META[basket.banners[i].drawKey].name} (${basket.banners[i].pullsDone}/${pullCount(basket.region, basket.banners[i].drawKey) ?? '?'})`).join('\n')}` });
    for (const i of pageIndices) components.push(bannerPullsRow(state, basket, i));

    if (totalPages > 1) components.push(pageNavRow({ ...state, bpage }, basket.banners));
    if (usedTypes(basket.banners).length) components.push(addAnotherRow(state, basket));

    if (basket.banners.length > 1) {
        components.push({ type: 14, spacing: 1, divider: true });
        components.push(reorderFocusRow(state, basket));
        components.push(reorderButtonsRow(state, basket));
    }

    components.push({ type: 14, spacing: 1, divider: true });
    components.push({ type: 1, components: [{ type: 2, style: 1, label: '◀ Cost Breakdown', custom_id: encodeState('page', { ...state, page: 0 }) }] });
    components.push(bottomNavRow(state));
    return { type: 17, accent_color: accentColor, components };
}

// Draw Info -- its OWN ephemeral message, own fresh 40-component budget, full buildDrawEntries fidelity for every DISTINCT draw type in the basket (measured 23/40 at all nine draw types in the single-draw design; a basket of any size still spans at most nine distinct types, so this never needs pagination -- spec §3).
function buildDrawInfoPanel(basket, accentColor) {
    const { buildDrawEntries } = require('./drawprices');
    const types = usedTypes(basket.banners);
    const components = [{ type: 10, content: `## ${emojis.calculator} Draw Info` }, { type: 14, spacing: 2, divider: true }];
    if (!types.length) {
        components.push({ type: 10, content: 'Your basket is empty — nothing to show yet.' });
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
            '**Basket** — a flat list of banners you\'re tracking. There is no "quantity" — three Mythic Weapon banners are three separate rows, each with its own progress.',
            '**Banner** — one entry in the basket: a draw type plus how many pulls you\'ve done on it.',
            '**Priority** — the ORDER banners appear in. It is never sorted for you; reorder with the select + ▲/▼ on the Basket page.',
            '**Simplify / Show Breakdown** — collapses or expands the full per-package math. Simplify still shows the total CP needed and the cheapest package.',
            '**Save** — naming your basket (via the Rename button) is what keeps it: an unnamed basket is cleared automatically after 30 days.'
        ].join('\n\n') }
    ];
    return { type: 17, accent_color: accentColor, components };
}

// ==========================================
// DISPATCH
// ==========================================
function buildCalculatorPanel(state, basket, accentColor, options = {}) {
    if (!basket) return buildMissingBasketPanel(state, options.savedBaskets, accentColor);
    return state.page === 1 ? buildBasketPage(state, basket, accentColor) : buildCostPage(state, basket, accentColor, options);
}

// ==========================================
// SLASH ENTRY
// ==========================================
async function execute(interaction) {
    const userId = interaction.user.id;
    const prefs = await UserPreference.findOne({ discordId: userId });
    const basketStore = require('../utils/drawBasketStore');

    let argPrivate = null;
    const state = { ...defaultState(), authorId: userId };
    let region = 'region_10';
    if (prefs?.defaultRegionMode && prefs.defaultRegionMode !== 'last_viewed') region = prefs.defaultRegionMode;
    else if (prefs?.defaultRegion) region = prefs.defaultRegion;

    if (interaction.isChatInputCommand()) {
        const visibilityChoice = interaction.options.getString('visibility');
        argPrivate = visibilityChoice === null ? null : visibilityChoice === 'hidden';
        const regionOption = interaction.options.getString('region');
        if (regionOption && REGION_ORDER.includes(regionOption)) region = regionOption;
    }

    const isEphemeral = resolveEphemeral({ argPrivate, prefs, prefsField: 'seasonalVisibility' });
    if (!interaction.deferred) await interaction.deferReply({ flags: isEphemeral ? 64 : 0 });

    const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
    const savedBaskets = await basketStore.listForUser(userId);
    const containerPayload = buildLandingPanel(state, savedBaskets, accentColor, { region });

    return sendV2Payload(interaction, withShareButton([containerPayload], isEphemeral));
}

module.exports = {
    encodeState, decodeState, defaultState, clampFocus,
    buildCalculatorPanel, buildLandingPanel, buildMissingBasketPanel, buildDrawInfoPanel, buildHelpPanel,
    buildCostBlock, entryFor, regionsWithData, progressBar, usedTypes, groupForDisplay,
    isDoubleCPEventLive, findLiveDoubleCPEntry, execute
};
