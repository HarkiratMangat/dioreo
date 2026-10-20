// utils/autobuildPipeline.js Shared state + logic for /autobuild, required from BOTH commands/autobuild.js's execute() (initial invocation) and handlers/autobuild.js's button/modal handlers (Confirm/Edit/Cancel/retry, added in Tasks 7/8). Kept out of commands/autobuild.js itself so handlers/autobuild.js can reach the same pendingAutobuilds Map without a circular require -- the router imports handlers, not the reverse; every command file already requires shared logic FROM utils/, never the reverse. Full design: docs/superpowers/specs/2026-07-19-loadout-automation-poc-design.md.
const BOT_EMOJI = require('./emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const crypto = require('crypto');
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Loadout = require('../models/Loadout');
const { extractLoadoutFromImage } = require('./visionExtract');
const { correctAttachmentName, correctGunsmithCode, parseLoadoutBadges, normalizeWeaponName, orderAttachmentsBySlot } = require('./adminParser');
const { getCatalogueIndex, findUnknownNames, learnItems, describeUnknown } = require('./catalogue');
const { sendV2Payload } = require('./sendV2Payload');
const { computeWeaponKeyAndBuild, buildLoadoutCard, getMpCategoryAccent, findDuplicateLoadouts } = require('./loadoutRender');
const { uploadLoadoutImage, syncLoadoutMetadata, deriveImageKey } = require('./loadoutImageCache');
const { glyphs } = require('./emojiMap');
const { mentionCommand } = require('./commandMentions');

// token -> { weaponName, gunsmithCode, attachments[], attachmentSlots[], category, badgesRaw, mode: 'MP'|'DMZ'|null, modeSignals, sourceImageUrl, adminId } Same short-lived-token pattern as handlers/manage.js's pendingManageEdits (10 min TTL, set at insertion time by whichever function stashes a new entry).
const pendingAutobuilds = new Map();

// Tracks tokens currently mid-upload/write inside confirmAndWrite -- closes a real duplicate-write race: `confirmAndWrite` only deletes a token from `pendingAutobuilds` AFTER its write durably succeeds (a deliberate fix for an earlier data-loss bug, see git history around this file), which means the token stays visible in the Map for the full duration of the Cloudinary upload + Mongo write. Without this marker, two overlapping Confirm clicks on the same token (an admin double-click, or a race with something else reading the same token) would both pass the "does this token still exist" guard and both independently upload+write, producing two duplicate builds for one weapon. Always released in a `finally` so an unexpected throw (e.g. doc.save() failing) doesn't permanently strand the token as "in progress" for the rest of its 10-minute TTL.
const confirmInProgress = new Set();

// Recomputes the two advisory warnings shown on the review card (mutates `data` in place). Called at initial extraction AND after every Edit submission, since editing the weapon/code/attachments/ category is exactly what changes whether either warning applies. Pure given `allMpBuilds` (the full current MP loadout set) -- the caller does the DB fetch so this stays cheap to re-run.
//   - categoryConflict: an existing build of THIS weapon is saved under a DIFFERENT category than the one chosen here (live-test 4 -- picking MARKSMAN for a weapon already saved as AR silently registered AK117 under two categories). weaponKey is the weapon's identity, so a weapon living under two categories is always a mistake worth flagging.
//   - duplicateWarning: this looks like a build already in the DB (live-test 1 + note #14) -- see loadoutRender.js's findDuplicateLoadouts for the two soft rules.
//   - equipCapWarning: an MP build with more than five attachments. MP's equip cap is five (the `ATTACHMENTS ● ● ● ● ●` row), so a sixth means a misread or the wrong mode -- the extraction cap is nine for both modes now (see utils/visionExtract.js's MAX_ATTACHMENTS), so nothing upstream stops it any more.
// `allBuilds` is BOTH modes since 2026-10-19 17:52 EDT. The category check reads every mode, because a category belongs to the WEAPON (an AK117 is an AR in MP and in DMZ); the duplicate check reads only this build's own mode, because an MP and a DMZ build of the same gun are never duplicates of each other. An unresolved mode (null) checks as MP, which is what this function did before DMZ existed here.
function refreshReviewWarnings(data, allBuilds) {
    const weaponKey = (data.weaponName || '').toLowerCase().replace(/\s+/g, '');
    const siblings = allBuilds.filter(b => b.weaponKey === weaponKey);
    const conflicting = data.category
        ? siblings.find(b => (b.category || '').toUpperCase() !== data.category.toUpperCase())
        : null;
    data.categoryConflict = conflicting ? conflicting.category : null;

    const sameMode = allBuilds.filter(b => (b.mode || 'MP') === (data.mode || 'MP'));
    // Position in /gunsmith, which lists a weapon's builds in _id order (utils/loadoutLookup.js; the portal's buildNumberOf uses the same rule). The new build would come last.
    const ordered = sameMode.filter(b => b.weaponKey === weaponKey).sort((a, b) => String(a._id).localeCompare(String(b._id)));
    data.ordinal = ordered.length + 1;
    // A build label is the build's own name (buildName); two builds of one weapon can never share one, because /manage's bulk upsert keys on {weaponKey, mode, buildName}. Save refuses a taken label.
    const label = String(data.buildLabel || '').trim().toLowerCase();
    data.labelConflict = label ? ordered.some(b => String(b.buildName || '').trim().toLowerCase() === label) : false;

    const dupes = data.mode === 'DMZ'
        ? findDmzDuplicates(weaponKey, data.attachments, sameMode)
        : findDuplicateLoadouts({ gunsmithCode: data.gunsmithCode, attachments: data.attachments }, sameMode);
    // Every warning has Harkirat's shape (2026-10-20 13:19 EDT): a bold title line, then `>` lines for the detail and what to do.
    data.equipCapWarning = data.mode === 'MP' && data.attachments.length > 5
        ? `${BOT_EMOJI.warn} **${data.attachments.length} attachments on an MP build**\n> MP equips at most 5, so one is probably misread, or this is a DMZ screenshot\n> **Fix:** the list or the mode, with **Adjust**`
        : null;
    if (dupes.length > 0) {
        const d = dupes[0];
        const pos = ordered.findIndex(b => String(b._id) === String(d.id)) + 1;
        const matching = data.mode === 'DMZ' ? `\`Same weapon\` + \`${d.overlap}/${d.total} attachments\`` : `\`${d.code === 'exact' ? 'Gunsmith code' : 'Similar Gunsmith code'}\` + \`${d.overlap}/${d.total} attachments\``;
        const cmd = `/gunsmith ${data.mode === 'DMZ' ? 'dmz' : 'mp'} weapon:${d.weaponName}${pos ? ` build:${pos}` : ''}`;
        const more = dupes.length > 1 ? `\n> **Also matches:** ${dupes.length - 1} more build${dupes.length === 2 ? '' : 's'}` : '';
        data.duplicateWarning = `${BOT_EMOJI.warn} **Possible duplicate:** this looks like **${d.weaponName} — ${d.buildName}**\n> **Matching:** ${matching}\n> **Check:** \`${cmd}\`${more}`;
    } else {
        data.duplicateWarning = null;
    }
    data.labelWarning = data.labelConflict
        ? `${BOT_EMOJI.warn} **Label already used:** ${data.weaponName} already has a build called \`${data.buildLabel}\`\n> **Fix:** pick another label with **Adjust**; Save is blocked until then`
        : null;
}

// The stored builds' attachment names plus the catalogue's, so a misread snaps onto a real name even when no build has used it yet.
async function knownAttachmentNames(allMpBuilds) {
    const catIndex = await getCatalogueIndex();
    return [...new Set([...allMpBuilds.flatMap(l => l.attachments), ...(catIndex ? [...catIndex.attachments.values()].map(i => i.name) : [])])];
}

// The same warning /manage gives (Harkirat, 2026-10-19 16:13 EDT: warn, then confirm or go back to edit): the review card's Confirm is the "save anyway", and Edit is the way back. It also records, on `data`, what the batch header needs (`catalogueUnknown`) and the slot shown beside each attachment (`slotLabels`): the screenshot's own label for MP, else the catalogue's slot, else nothing. Harkirat, 2026-10-20 12:36 EDT: "is the weapon name not in the catalogue or the attachments??" -- so the warning now names which.
async function catalogueWarningFor(data) {
    const index = await getCatalogueIndex();
    const { normKey } = require('./catalogue');
    data.slotLabels = (data.attachments || []).map((a, i) => (data.attachmentSlots || [])[i] || index?.attachments.get(normKey(a))?.slot || '');
    const unknown = await findUnknownNames({ weaponName: data.weaponName, attachments: data.attachments });
    data.catalogueUnknown = unknown.count ? { weapon: !!unknown.weapon, attachments: unknown.attachments.length } : null;
    if (!unknown.count) return null;
    const list = (names) => names.map(a => `\`${a}\``).join(', ');
    const n = unknown.attachments.length;
    const atts = `${n} attachment${n === 1 ? '' : 's'}`;
    const title = unknown.weapon && n ? `the weapon and ${atts}` : unknown.weapon ? 'the weapon' : atts;
    const lines = [unknown.weapon ? `> **Weapon:** \`${unknown.weapon}\`` : null, n ? `> **${n === 1 ? 'Attachment' : 'Attachments'}:** ${list(unknown.attachments)}` : null].filter(Boolean);
    return `${BOT_EMOJI.warn} **Not in the catalogue yet:** ${title}\n${lines.join('\n')}\n-# *A typo, or a new item? **Save** adds the names; **Adjust** fixes them first*`;
}

// DMZ builds carry no Gunsmith code (the DMZ screen shows none), so findDuplicateLoadouts' code-based rules can never match one. A DMZ duplicate is the same weapon with the same attachment SET, order ignored, compared the way that function compares names (trimmed, case-folded). Kept here rather than in utils/loadoutRender.js so this change stays out of the loadout renderer.
function findDmzDuplicates(weaponKey, attachments, dmzBuilds) {
    const norm = (a) => String(a || '').trim().toLowerCase();
    const cand = [...new Set((attachments || []).map(norm).filter(Boolean))].sort();
    if (cand.length === 0) return [];
    return (dmzBuilds || [])
        .filter(b => b.weaponKey === weaponKey)
        .filter(b => {
            const have = [...new Set((b.attachments || []).map(norm).filter(Boolean))].sort();
            return have.length === cand.length && have.every((a, i) => a === cand[i]);
        })
        .map(b => ({ weaponName: b.weaponName, buildName: b.buildName, overlap: cand.length, total: cand.length, id: b._id, code: null }));
}

// The mode a review carries: an explicit `mode:` on /autobuild wins, then what the screenshot's chrome said (utils/visionExtract.js's classifyMode), then null -- which the review card shows as a question and Confirm refuses, exactly like an unresolved category.
function resolveMode(explicitMode, detectedMode) {
    if (explicitMode === 'MP' || explicitMode === 'DMZ') return explicitMode;
    if (detectedMode === 'MP' || detectedMode === 'DMZ') return detectedMode;
    return null;
}

// "Category | Mode" -- the Edit box's combined field (Discord caps a modal at five fields and all five are taken). The mode half is optional and keeps the current mode when left off, so an old habit of typing only "AR" still works. Anything that isn't MP or DMZ clears the mode, and the review card then asks for it, rather than guessing.
function parseCategoryAndMode(raw, currentMode) {
    const [catPart, modePart] = String(raw || '').split('|').map(p => p.trim());
    const category = (catPart || '').toUpperCase() || null;
    if (modePart === undefined) return { category, mode: currentMode || null };
    const m = modePart.toUpperCase();
    return { category, mode: m === 'MP' || m === 'DMZ' ? m : null };
}

// Canonically orders the parallel attachments[]/slots[] arrays (adminParser.orderAttachmentsBySlot) and drops empty/blank entries -- a restricted or unread slot pads to '' during extraction, and a slot the vision model was (now) told to skip simply isn't there. Keeps the two arrays ALIGNED so per-slot Cloudinary metadata never maps an attachment name onto the wrong slot. Shared by runExtraction (for the review card + the stored data) and writeLoadoutDoc (defense-in-depth for the retry path).
function cleanAttachmentPairs(attachments, slots) {
    const ordered = orderAttachmentsBySlot(attachments, slots);
    const outA = [];
    const outS = [];
    ordered.attachments.forEach((name, i) => {
        const n = (name || '').trim();
        if (!n) return;
        outA.push(n);
        outS.push(ordered.slots[i] || '');
    });
    return { attachments: outA, attachmentSlots: outS };
}

// A button icon from the bot's own set, read at render time (the draw calculator's buttons are the reference: saveStar on Save, deleteBin on delete).
function emojiIcon(key) { const e = require('./emojiMap'); return e.parseEmoji(e[key]); }

// Ephemeral review card: weapon/code/attachments/category/badges as extracted so far, plus the RAW source screenshot as the preview image (not yet uploaded to Cloudinary -- see the design spec for why: an edited weapon name during review must never orphan an upload under the wrong key). `opts` (bulk /autobuild, 2026-10-20 10:33 EDT): `header` adds a line under the title, `notes` adds warnings after the standard ones, `rows` replaces the Confirm/Edit/Cancel row. A single review passes none of them and renders exactly as before.
function buildReviewCard(token, data, opts = {}) {
    const e = require('./emojiMap');
    // Warnings first, above the build (Harkirat, 2026-10-20 13:19 EDT: "warning section should be above the wep name, mode, etc.").
    const warnings = [
        data.categoryConflict ? `${BOT_EMOJI.warn} **Category mismatch:** this weapon is already saved as \`${data.categoryConflict}\`\n> **Saving as:** \`${data.category}\`, so it would sit under two categories\n> **Fix:** change the category with **Adjust**` : null,
        data.labelWarning, data.duplicateWarning, data.catalogueWarning, data.equipCapWarning, ...(opts.notes || []),
    ].filter(Boolean);

    // His text layout, verbatim where he gave it (2026-10-20 13:19 EDT); the DMZ code line, a set label and the mode hints other than "detected" follow its pattern.
    const label = String(data.buildLabel || '').trim();
    const modeHint = data.mode
        ? (data.modeSource === 'explicit' ? 'Set by you' : 'Detected from the screenshot')
        : "Couldn't tell MP from DMZ; set it with **Adjust**";
    const badges = String(data.badgesRaw || '').trim();
    const codeLine = data.gunsmithCode
        ? `> **Gunsmith Code:** \`${data.gunsmithCode}\``
        : `> **Gunsmith Code:** \`—\`${data.mode === 'DMZ' ? '\n> -# *DMZ builds have no code*' : ''}`;
    const attachmentLines = data.attachments.map((a, i) => {
        const slot = (data.slotLabels || [])[i];
        return `${i + 1}. **\`${a || '(empty)'}\`**${slot ? ` · \`(${slot.toUpperCase()})\`` : ''}`;
    });
    const body = [
        `## Weapon: \`${data.weaponName}\` — \`${data.category || 'unknown'}\``,
        `> **Label:** \`${label || '—'}\``,
        label ? null : '> -# *Set custom build label using **Adjust***',
        `**Build:** \`Build ${data.ordinal || 1}\``,
        `**Mode:** \`${data.mode || 'unknown'}\``,
        `-# *${modeHint}*`,
        `**Badges:** \`${badges || '—'}\``,
        badges ? null : '-# *Badges are per build; add using **Adjust***',
        '',
        '### Attachments:',
        codeLine,
        ...attachmentLines,
    ].filter(l => l !== null).join('\n');

    const components = [
        { type: 10, content: `# Review Extracted Loadout` },
        ...(opts.header ? [{ type: 10, content: opts.header }] : []),
        { type: 14, spacing: 1, divider: true },
    ];
    if (warnings.length) {
        for (const w of warnings) components.push({ type: 10, content: w });
        components.push({ type: 14, spacing: 1, divider: true });
    }
    components.push({ type: 10, content: body });
    components.push({ type: 12, items: [{ media: { url: data.sourceImageUrl } }] });
    components.push({ type: 14, spacing: 1, divider: true });
    components.push(...(opts.rows || [{
        type: 1,
        components: [
            { type: 2, style: 3, label: 'Save Build', custom_id: `autobuild_confirm_${token}`, emoji: emojiIcon('saveStar') },
            { type: 2, style: 1, label: 'Adjust', custom_id: `autobuild_editbtn_${token}`, emoji: emojiIcon('edit') },
            { type: 2, style: 4, label: 'Discard', custom_id: `autobuild_cancel_${token}`, emoji: emojiIcon('deleteBin') }
        ]
    }]));
    for (const c of components) if (c.type === 10 && c.content) c.content = e.glyphs(c.content);

    const container = {
        type: 17,
        accent_color: 2829617, // neutral gray fallback (same as DEFAULT_MP_ACCENT in loadoutRender.js) -- category may still be unresolved at review time, so this card never guesses a per-category color
        components
    };
    return { components: [container], flags: 32768 };
}

// A sibling build's badges as the token string the Badges field takes (utils/adminParser.js's parseLoadoutBadges). A DMZ rank is stored as `best-close` / `top3-midlong` / bare `best`, and typed as `bestclose` / `top3midlong` / `best`, so the hyphen comes out; writeLoadoutDoc moves a bare tier back onto dmzRangeRank for a DMZ build, the same swap /manage's DMZ page makes.
function badgeTokensOf(build) {
    const rank = build.mode === 'DMZ' ? (build.dmzRangeRank || '').replace('-', '') : build.categoryRank;
    return [build.isMeta ? 'meta' : null, rank || null, build.isToxic ? 'toxic' : null].filter(Boolean).join(',');
}

// Category: explicit option > an existing sibling build's category > unresolved (null). Badges: the explicit option only. They used to inherit a sibling's badges when blank (the design spec's "blank inherits from an existing build" rule), which made sense while badges described the weapon; since 2026-10-19 15:59 EDT every badge is per build (Harkirat: "move all badge types to per build instead per weapon"), so a new build starts with none unless the admin gives some.
async function resolveCategoryAndBadges(weaponName, explicitCategory, badgesOption, mode = 'MP') {
    const weaponKey = weaponName.toLowerCase().replace(/\s+/g, '');
    let category = explicitCategory || null;
    let badgesRaw = badgesOption || '';

    if (!category) {
        const siblings = await Loadout.find({ weaponKey }).lean();
        const sameMode = mode ? siblings.find(b => (b.mode || 'MP') === mode) : null;
        const anyMode = sameMode || siblings[0];
        if (anyMode) category = anyMode.category;
    }
    // No build of this weapon yet: the CODM catalogue knows its class (seeded from his weapons-and-attachments screenshot, utils/catalogue.js). Found 2026-10-20 12:10 EDT: an S36 came back "category unknown" while the catalogue had it as an LMG.
    if (!category) {
        const catIndex = await getCatalogueIndex();
        const known = catIndex?.weapons.get(require('./catalogue').normKey(weaponName));
        if (known?.category) category = known.category;
    }
    return { category, badgesRaw };
}

// The reading half of runExtraction, shared with utils/autobuildBulk.js (2026-10-20 10:33 EDT, bulk /autobuild): one screenshot in, one review's `data` out, nothing sent and nothing stashed. It THROWS when the vision call fails, so each caller words the failure its own way. `allBuilds` lets a caller reading several screenshots fetch the build list once instead of once per image.
async function extractToData(sourceImageUrl, { explicitCategory = null, badgesOption = null, explicitMode = null, adminId, allBuilds = null } = {}) {
    // The catalogue's weapon names ride in the prompt; its attachment names join the stored ones the corrector below snaps a misread onto.
    const catIndex = await getCatalogueIndex();
    const extracted = await extractLoadoutFromImage(sourceImageUrl, { taskName: 'autobuild_live', knownWeapons: catIndex ? [...catIndex.weapons.values()].map(w => w.name) : [] });
    // One fetch, reused for BOTH the attachment-name corrector's known-vocabulary set AND the duplicate/category-conflict warnings (refreshReviewWarnings) -- richer field select than the old attachments-only projection so those checks have shareCode/category/weaponName to work with. Both modes since 2026-10-19 17:52 EDT: DMZ uses the same attachment names (and adds some MP builds don't have), so the vocabulary is the union, and refreshReviewWarnings splits by mode where it matters.
    const builds = allBuilds || await Loadout.find({}).select('weaponKey weaponName category buildName shareCode attachments mode').lean();
    const knownAttachments = await knownAttachmentNames(builds);
    const correctedAttachments = extracted.attachments.map(a => correctAttachmentName(a, knownAttachments));
    const correctedCode = correctGunsmithCode(extracted.gunsmithCode);
    // Strip skin suffix + normalize casing so the weaponKey/imageKey/display value all resolve to the real weapon (see normalizeWeaponName) -- this is the fix for the v2-test "new weapon created from the skin name" cascade. Everything below uses the normalized name, not the raw extraction.
    const weaponName = normalizeWeaponName(extracted.weaponName);
    const mode = resolveMode(explicitMode, extracted.mode);
    // A DMZ screen prints no slot labels (.claude/rules/autobuild.md, Harkirat 2026-09-16 11:31 EDT), so any label the model gave for one is a guess. Blanking them does two things: no guessed slot reaches Cloudinary's per-slot metadata, and orderAttachmentsBySlot's stable sort then keeps the on-screen order, which is the order every stored DMZ build already uses (Muzzle, Barrel, Optic, ... Rear Grip).
    const slotsIn = mode === 'DMZ' ? extracted.attachmentSlots.map(() => '') : extracted.attachmentSlots;
    // Reorder into canonical slot order, then drop empty/restricted slots (they pad to '' upstream), keeping attachments and their parallel slot labels aligned so per-slot metadata stays correct.
    const { attachments: cleanAttachments, attachmentSlots: cleanSlots } = cleanAttachmentPairs(correctedAttachments, slotsIn);

    const { category, badgesRaw } = await resolveCategoryAndBadges(weaponName, explicitCategory, badgesOption, mode);

    const data = {
        weaponName,
        gunsmithCode: correctedCode,
        attachments: cleanAttachments,
        // Feeds the per-slot Cloudinary structured metadata (Muzzle/Barrel/... fields) via loadoutImageCache.js's buildLoadoutMetadata/SLOT_TO_FIELD -- Cloudinary-only, not written to the Loadout doc, which is exactly why the per-slot fields can only ever be filled by /autobuild. Kept aligned to `attachments` above by cleanAttachmentPairs (same order, same filtering). Not re-corrected against knownAttachments the way `attachments` itself is: slot labels are a small closed vocabulary (Muzzle/Barrel/Optic/...), not free text prone to the same misread-spelling drift attachment NAMES have.
        attachmentSlots: cleanSlots,
        category,
        badgesRaw,
        mode,
        // Where the mode came from, for the review card's mode line; never stored on the Loadout.
        modeSource: explicitMode ? 'explicit' : (mode ? 'detected' : null),
        modeSignals: extracted.modeSignals,
        sourceImageUrl,
        adminId
    };
    refreshReviewWarnings(data, builds);
    data.catalogueWarning = await catalogueWarningFor(data);
    return data;
}

// Runs extraction + post-processing + stashes a pending token, then sends the review card as this interaction's own deferred reply. Caller must have already called interaction.deferReply() (ephemeral per the command's `visibility` option, default hidden). `explicitMode` is /autobuild's `mode:` option; the right-click and its picker pass nothing, so the screenshot decides.
async function runExtraction(interaction, sourceImageUrl, explicitCategory, badgesOption, explicitMode = null) {
    let data;
    try {
        data = await extractToData(sourceImageUrl, { explicitCategory, badgesOption, explicitMode, adminId: interaction.user.id });
    } catch (err) {
        console.error('Autobuild extraction failed:', err.message);
        return interaction.followUp({ content: `${BOT_EMOJI.cross} Couldn't extract loadout data from that image: ${err.message}`, ephemeral: true });
    }

    const token = crypto.randomBytes(8).toString('hex');
    pendingAutobuilds.set(token, data);
    setTimeout(() => pendingAutobuilds.delete(token), 10 * 60 * 1000).unref();

    const card = buildReviewCard(token, data);
    return sendV2Payload(interaction, card.components, { flags: card.flags });
}

// Confirmed-but-image-upload-failed state -- separate from pendingAutobuilds (the pre-Confirm review state) because once Confirmed, the admin has already approved the CONTENT; only the image itself needs retrying. weaponKey/buildName/imageKey are pre-computed and stored here so a retry reuses the exact same values rather than recomputing (and risking a different result if another build for the same weapon was added in the meantime).
const pendingImageRetries = new Map(); // retryToken -> confirmed data + { weaponKey, buildName, imageKey }

// Same duplicate-write guard as confirmInProgress above, scoped to retryImageUpload's own token space. This path is actually the MORE exposed of the two -- it's driven by the `/autobuild retry_token:` slash command, not a button, so it gets none of handlers/router.js's generic anti-spam cooldown (that guard is scoped to isButton()/isStringSelectMenu() only). Two quick resubmits of the same retry_token (an accidental double-submit) would otherwise race freely for the entire upload+write duration.
const retryInProgress = new Set();

// Replaces the message this interaction is answering (the ephemeral review card, or the retry command's own reply) IN PLACE with the given Components V2 card, via sendV2Payload's `rest.patch(
// @original)`. Changed 2026-07-21 from POSTing a brand-new message (per Harkirat's live-test note #11: "instead of a new msg to open loadout, why not just edit the review panel, remove it, and edit in the 'loadout created, open loadout' msg") -- so Confirm swaps the review card straight into the post-creation card instead of leaving a stale review panel sitting above a new message. Wrapped in its own try/catch: a failure here happens AFTER the Loadout doc/Cloudinary upload has already durably succeeded (every caller only reaches this once its write is committed), so a dead interaction token must never look like the whole Confirm/retry operation failed. Never rethrows -- a missed confirmation edit is a silent-but-safe UX gap, not a data-loss bug.
async function replaceWithV2Card(interaction, card) {
    try {
        return await sendV2Payload(interaction, card.components, { flags: card.flags });
    } catch (notifyError) {
        console.error('Failed to render autobuild post-creation card (interaction token likely expired) -- underlying Loadout doc was already saved successfully:', notifyError);
    }
}

// The badge fields a build of this mode stores. DMZ never sets categoryRank and MP never sets dmzRangeRank (models/Loadout.js); a bare `best`/`topN` typed for a DMZ build parses as categoryRank because the parser does not know the mode, so it moves to dmzRangeRank here -- the same swap handlers/manage/loadouts.js makes on /manage's DMZ page.
function badgeFieldsFor(mode, badgesRaw) {
    // The parser is told the mode, so a rank mode on a DMZ build is dropped there (MP only), and Ass is already dropped beside Meta or a tier.
    const { isMeta, categoryRank, dmzRangeRank, isToxic, isAss, rankModes } = parseLoadoutBadges(badgesRaw, mode);
    if (mode === 'DMZ') return { isMeta, isToxic, isAss, rankModes: [], categoryRank: null, dmzRangeRank: dmzRangeRank || categoryRank || null };
    return { isMeta, isToxic, isAss, rankModes, categoryRank, dmzRangeRank: null };
}

async function writeLoadoutDoc(data, imageKeyOverride) {
    const mode = data.mode === 'DMZ' ? 'DMZ' : 'MP';
    const badges = badgeFieldsFor(mode, data.badgesRaw);
    // Final safety pass: never persist an empty/blank attachment (a restricted/unread slot), and keep the parallel slot labels aligned for the metadata sync below. Idempotent for the normal path (runExtraction already cleaned these); the point is to also cover the retry path. A DMZ build's slots are blanked again here because an Edit can turn an unresolved review into a DMZ one after runExtraction ran.
    const slotsIn = mode === 'DMZ' ? (data.attachments || []).map(() => '') : data.attachmentSlots;
    const { attachments, attachmentSlots } = cleanAttachmentPairs(data.attachments, slotsIn);
    const doc = new Loadout({
        weaponKey: data.weaponKey,
        weaponName: data.weaponName,
        category: data.category,
        mode,
        buildName: data.buildName,
        attachments,
        attachmentSlots,
        imageKey: imageKeyOverride || data.imageKey,
        shareCode: data.gunsmithCode || '',
        ...badges
    });
    await doc.save();

    // Confirm is the review card's "save anyway": names the catalogue did not know are added, through the op core so /bot analytics logs them. Best-effort -- the build is already saved, and a failure here only means the names warn again next time.
    try {
        const unknown = await findUnknownNames({ weaponName: data.weaponName, attachments });
        if (unknown.count) {
            const { commitSet } = require('../core/changeset');
            await commitSet([{ type: 'catalogue.learn', payload: { items: learnItems(unknown, { category: data.category }), mode } }], { actorId: data.adminId });
        }
    } catch (err) {
        console.error('Could not add /autobuild names to the catalogue:', err?.message || err);
    }

    // Badges are per build (2026-10-19 15:59 EDT), so nothing is copied to the weapon's other builds and only this build's metadata is synced. Best-effort, never throws; the new build gets its per-slot data too, since only /autobuild has the slot-to-attachment mapping from the vision extraction.
    await syncLoadoutMetadata(doc, attachmentSlots);
    return doc;
}

function buildPostCreationCard(doc, imageWarning) {
    const accentColor = getMpCategoryAccent(doc.category);
    let content = `${BOT_EMOJI.checkmark} **Loadout created:** ${doc.weaponName} (${doc.buildName}, ${doc.category}${doc.mode === 'DMZ' ? ', DMZ' : ''})`;
    if (imageWarning) content += `\n${BOT_EMOJI.warn} ${imageWarning}`;
    const container = {
        type: 17,
        accent_color: accentColor,
        components: [
            { type: 10, content },
            { type: 1, components: [{ type: 2, style: 3, label: 'Open Loadout', custom_id: `autobuild_openloadout_${doc._id}` }] }
        ]
    };
    return { components: [container], flags: 32768 };
}

// The next MP build number for a weapon: one past the highest of its "Build N" names AND its WEAPON-N image keys (2026-10-20 13:22 EDT). Counting names alone missed a build that carries a label, so the next build was handed that build's image key and uploaded over its image. Pure.
function nextBuildNumber(weaponName, siblingDocs) {
    const base = String(weaponName || '').trim().toUpperCase().replace(/\s+/g, '-').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keyRe = new RegExp(`^${base}-(\\d+)(?:\\.\\w+)?$`, 'i');
    const keyNums = (siblingDocs || []).map(d => keyRe.exec(d.imageKey || '')).filter(Boolean).map(m => parseInt(m[1], 10));
    const nameNums = (siblingDocs || []).map(d => /^Build (\d+)$/.exec(d.buildName || '')).filter(Boolean).map(m => parseInt(m[1], 10));
    return Math.max(0, ...keyNums, ...nameNums) + 1;
}

// The saving half of confirmAndWrite, shared with utils/autobuildBulk.js (2026-10-20 10:33 EDT): validates, uploads the image and writes the build, and REPORTS what happened instead of answering an interaction, so a batch page can show the result in place. Statuses: saved (doc) · retry (retryToken, error) · expired · nocategory · nomode · busy.
async function confirmCore(token) {
    const data = pendingAutobuilds.get(token);
    if (!data) return { status: 'expired' };
    if (!data.category) return { status: 'nocategory' };
    if (!data.mode) return { status: 'nomode' };
    if (data.labelConflict) return { status: 'labeltaken' };

    // Claim the token before any slow work starts -- see confirmInProgress's own comment above for why this exists. Checked AFTER the two cheap validation returns above (an unresolved-category click never reaches Cloudinary/Mongo, so it's not part of the race this guards against).
    if (confirmInProgress.has(token)) return { status: 'busy' };
    confirmInProgress.add(token);

    try {
        const weaponKeyForLookup = data.weaponName.toLowerCase().replace(/\s+/g, '');
        const siblingDocs = await Loadout.find({ weaponKey: weaponKeyForLookup, mode: data.mode }).select('buildName imageKey').lean();
        const label = String(data.buildLabel || '').trim();
        if (label && siblingDocs.some(s => String(s.buildName || '').trim().toLowerCase() === label.toLowerCase())) return { status: 'labeltaken' };
        // The next number counts the image keys too, not only "Build N" names (2026-10-20 13:22 EDT): once a build carries a label, its WEAPON-N image key is invisible to a names-only count, and the next build would have been handed the same key and uploaded over its image.
        const base = data.weaponName.trim().toUpperCase().replace(/\s+/g, '-');
        const next = nextBuildNumber(data.weaponName, siblingDocs);
        const computed = { ...computeWeaponKeyAndBuild(data.weaponName, []), buildName: `Build ${next}`, imageKey: `${base}-${next}` };
        const weaponKey = computed.weaponKey;
        const buildName = label || computed.buildName;
        // MP keeps computeWeaponKeyAndBuild's `WEAPON-N` key exactly as before. DMZ needs the `DMZ-` prefix (Cloudinary public_ids are global, so an unprefixed DMZ key would overwrite the MP build's image of the same weapon), and takes the next key that is actually FREE rather than the next build NUMBER: an existing DMZ build with a human build name still holds its `DMZ-WEAPON-1`, and numbering by name alone would hand that key out again and overwrite its image. utils/loadoutImageCache.js's deriveImageKey is the one place that rule lives; /manage's DMZ page uses it too.
        let imageKey = computed.imageKey;
        if (data.mode === 'DMZ') {
            const base = data.weaponName.trim().toUpperCase().replace(/\s+/g, '-').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const taken = await Loadout.find({ imageKey: new RegExp(`^DMZ-${base}-\\d+$`, 'i') }).select('imageKey').lean();
            imageKey = deriveImageKey(data.weaponName, 'DMZ', taken.map(t => t.imageKey));
        }

        // Image only -- structured metadata is set from the saved Loadout doc by writeLoadoutDoc -> syncLoadoutMetadata (which also has the per-slot data), so a metadata problem can never fail this upload.
        const uploadResult = await uploadLoadoutImage(data.sourceImageUrl, imageKey);

        if (uploadResult.success) {
            // Delete AFTER the write succeeds, not before -- if doc.save() throws (a real possibility: Mongoose validation, a dropped connection), the token must still be sitting in pendingAutobuilds so the confirmed data isn't silently lost with nothing written anywhere. (Found in review: this used to delete first, which meant a save() failure here lost the data permanently -- no Loadout doc, no recoverable token.)
            const doc = await writeLoadoutDoc({ ...data, weaponKey, buildName, imageKey });
            pendingAutobuilds.delete(token);
            return { status: 'saved', doc };
        }

        // First failure: do NOT write yet. Stash the confirmed data (with weaponKey/buildName/imageKey already computed) under a new retry token, ask for the image again.
        const retryToken = crypto.randomBytes(8).toString('hex');
        pendingImageRetries.set(retryToken, { ...data, weaponKey, buildName, imageKey });
        setTimeout(() => pendingImageRetries.delete(retryToken), 10 * 60 * 1000).unref();
        pendingAutobuilds.delete(token);
        return { status: 'retry', retryToken, error: uploadResult.error };
    } finally {
        // Always released, whether this call finished normally (either branch above) or threw unexpectedly -- a genuine failure must not permanently block every later attempt on this token for the rest of its TTL.
        confirmInProgress.delete(token);
    }
}

// What a single review says for each confirmCore status other than `saved`. The wording is the one confirmAndWrite always used.
function confirmMessage(client, result) {
    switch (result.status) {
        case 'expired': return glyphs(`${BOT_EMOJI.cross} This review has expired or was already handled. Run ${mentionCommand(client, '/autobuild')} again.`);
        case 'nocategory': return glyphs(BOT_EMOJI.cross + ' Category is still unresolved -- click **Adjust** and set one before saving.');
        case 'nomode': return glyphs(BOT_EMOJI.cross + " MP or DMZ is still unresolved -- click **Adjust** and put `| MP` or `| DMZ` after the category before saving.");
        case 'busy': return '⏳ Already saving this build -- give it a moment.';
        case 'labeltaken': return `${BOT_EMOJI.cross} That build label is already used by another build of this weapon -- pick another with **Adjust**.`;
        case 'retry': return glyphs(`${BOT_EMOJI.warn} Image upload to Cloudinary failed (${result.error}). Nothing was saved yet -- re-run this to try the image again:\n\`/autobuild retry_token:${result.retryToken} screenshot:<new attachment>\` (or use \`url:\` instead)\n\nIf it fails again, the loadout will be created anyway without an image, and you can fix it later via \`/manage\`.`);
        default: return glyphs(BOT_EMOJI.cross + ' Something went wrong saving this build.');
    }
}

// Confirm click -- `interaction` is the BUTTON interaction. Caller (handlers/autobuild.js) must call interaction.deferUpdate() before calling this, since the review card is being replaced.
async function confirmAndWrite(interaction, token) {
    const result = await confirmCore(token);
    if (result.status === 'saved') return await replaceWithV2Card(interaction, buildPostCreationCard(result.doc, null));
    return interaction.followUp({ content: confirmMessage(interaction.client, result), ephemeral: true });
}

// Second attempt, via /autobuild's retry_token option (commands/autobuild.js calls this directly -- see the design spec's "Image retry mechanism" decision for why this can't be a button/modal).
async function retryImageUpload(interaction, token, newImageUrl) {
    const data = pendingImageRetries.get(token);
    if (!data) {
        return interaction.followUp({ content: `${BOT_EMOJI.cross} That retry token has expired or was already used. Run ${mentionCommand(interaction.client, '/autobuild')} again from scratch.`, ephemeral: true });
    }
    // NOTE: deletion moved to AFTER each write below actually succeeds (was deleted here, before either write attempt) -- same class of bug as confirmAndWrite's success path. If writeLoadoutDoc throws (Mongoose validation/connection error) on either branch, the token must still be in pendingImageRetries so the confirmed data isn't silently lost with no Loadout doc written.

    // Claim the token before any slow work starts -- see retryInProgress's own comment above.
    if (retryInProgress.has(token)) {
        return interaction.followUp({ content: '⏳ Already processing this retry -- give it a moment.', ephemeral: true });
    }
    retryInProgress.add(token);

    try {
        const uploadResult = await uploadLoadoutImage(newImageUrl, data.imageKey); // image only; metadata via writeLoadoutDoc -> syncLoadoutMetadata
        if (uploadResult.success) {
            const doc = await writeLoadoutDoc(data);
            pendingImageRetries.delete(token);
            const card = buildPostCreationCard(doc, null);
            return await replaceWithV2Card(interaction, card);
        }

        // Second failure -- write anyway with a placeholder key, never lose the already-confirmed data. checkImageExists() (called wherever the resulting card is later rendered, e.g. /all) correctly flags this as broken -- same existing warning path every other loadout save already goes through, nothing new needed for that part.
        const placeholderKey = `PENDING-UPLOAD-${token}`;
        const doc = await writeLoadoutDoc(data, placeholderKey);
        pendingImageRetries.delete(token);
        const card = buildPostCreationCard(doc, `No image could be uploaded (tried twice). Fix it via ${mentionCommand(interaction.client, '/manage')} -> Edit Loadout -> set a real Cloudinary Image Key.`);
        return await replaceWithV2Card(interaction, card);
    } finally {
        // Always released -- same reasoning as confirmInProgress's finally above.
        retryInProgress.delete(token);
    }
}

async function cancelReview(interaction, token) {
    pendingAutobuilds.delete(token);
    return interaction.followUp({ content: glyphs(BOT_EMOJI.cross + ' Discarded -- nothing was saved or uploaded.'), ephemeral: true });
}

// Edit modal -- ALL fields in one modal (per the design spec's decision), pre-filled from the pending token's current data. Discord caps a modal at 5 fields; attachments share ONE Paragraph field (one per line, matching every other loadout modal's convention in commands/manage.js) so weapon/code/attachments/category/badges all fit.
function buildEditModal(token, data, customId = `autobuild_editmodal_${token}`) {
    const modal = new ModalBuilder().setCustomId(customId).setTitle('Adjust Extracted Loadout');
    modal.addComponents(
        // `|| ''` fallback on both -- TextInputBuilder.setValue(undefined) throws SYNCHRONOUSLY, which would throw inside showModal() before the interaction is ever acknowledged (the exact production incident documented in CLAUDE.md's `/manage` batch-refinement-pass section: buildEditDrawModal's .setValue(targetDraw.thumbnailUrl) on a legacy doc missing that field). Gemini extraction can genuinely leave weaponName/gunsmithCode undefined on a bad read, so this can't assume they're set the way category/badgesRaw two lines below already correctly don't assume.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('weapon').setLabel('Weapon Name').setStyle(TextInputStyle.Short).setValue(data.weaponName || '').setRequired(true)),
        // Not required since 2026-10-19 17:53 EDT: a DMZ build has no Gunsmith code at all, and a required box would force one to be invented.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('code').setLabel('Build Label | Gunsmith Code').setPlaceholder('Ranked | 1A2B3C4D5E   (both optional)').setStyle(TextInputStyle.Short).setValue(`${data.buildLabel || ''} | ${data.gunsmithCode || ''}`).setRequired(false)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (one per line)').setStyle(TextInputStyle.Paragraph).setValue(data.attachments.join('\n')).setRequired(true)),
        // The mode rides in the category box as "Category | Mode" because all five modal slots are taken -- the shape /manage's loadout box used for the same reason. See parseCategoryAndMode.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('category').setLabel('Category | Mode').setStyle(TextInputStyle.Short).setPlaceholder('AR | MP   or   SNIPER | DMZ').setValue(`${data.category || ''} | ${data.mode || ''}`).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('badges').setLabel('Badges (optional)').setStyle(TextInputStyle.Short).setPlaceholder('meta,best,top5,toxic').setValue(data.badgesRaw || '').setRequired(false))
    );
    return modal;
}

// The modal's fields applied to a review's `data`, returning the updated copy -- shared with utils/autobuildBulk.js (2026-10-20 10:33 EDT). Re-runs the SAME post-processing (fuzzy-match + code-corrector) on whatever was typed, per the design spec. Neither stashes nor answers the interaction.
async function applyEditFields(interaction, data) {
    // Same normalizer as the initial extraction: strip a skin suffix + force the all-caps convention, so a manually-typed "Machine Pistol" or "R9-0 - Death's Voice" is stored consistently too.
    const weaponName = normalizeWeaponName(interaction.fields.getTextInputValue('weapon'));
    // "Build Label | Gunsmith Code" (2026-10-20 13:22 EDT, Harkirat: "implement the build label into autobuild"), /manage's own "Build Name | Share Code" convention, because the modal's five fields are taken. With no pipe, a value shaped like a code is the code and anything else is the label.
    const codeBox = interaction.fields.getTextInputValue('code');
    let buildLabel, rawCode;
    if (codeBox.includes('|')) { const [l, ...rest] = codeBox.split('|'); buildLabel = l.trim(); rawCode = rest.join('|').trim(); }
    else if (/^(?:\d[A-Za-z])+\d?$|^(?:[A-Za-z]\d)+[A-Za-z]?$/.test(codeBox.trim().replace(/\s+/g, ''))) { buildLabel = ''; rawCode = codeBox.trim(); }
    else { buildLabel = codeBox.trim(); rawCode = ''; }
    const rawAttachments = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(Boolean);
    const { category, mode } = parseCategoryAndMode(interaction.fields.getTextInputValue('category'), data.mode);
    const badgesRaw = interaction.fields.getTextInputValue('badges').trim();

    // Same richer select as runExtraction -- reused for the attachment corrector AND the recomputed duplicate/category-conflict warnings (an Edit is exactly what changes whether either applies).
    const allBuilds = await Loadout.find({}).select('weaponKey weaponName category buildName shareCode attachments mode').lean();
    const knownAttachments = await knownAttachmentNames(allBuilds);
    // Variable length now (was force-padded to exactly 5) -- a restricted-slot weapon legitimately has fewer, and blank lines were already filtered out above.
    const correctedAttachments = rawAttachments.map(a => correctAttachmentName(a, knownAttachments));
    // correctGunsmithCode('') returns '' unchanged, so a blank DMZ code stays blank.
    const correctedCode = correctGunsmithCode(rawCode);

    // The Edit modal carries attachment NAMES only, no slot labels, so an edit that changes the attachment list can't keep a valid slot->name mapping. Keep the extraction's slots ONLY if the list is unchanged (a badge/category-only edit, the common case) so per-slot metadata survives; otherwise clear it, so a later Confirm writes no per-slot metadata rather than WRONG per-slot metadata. (buildLoadoutMetadata skips per-slot fields entirely when slots is empty.)
    const attachmentsUnchanged = correctedAttachments.length === data.attachments.length
        && correctedAttachments.every((a, i) => a === data.attachments[i]);
    const attachmentSlots = attachmentsUnchanged ? data.attachmentSlots : [];

    const updated = {
        ...data,
        weaponName,
        gunsmithCode: correctedCode,
        attachments: correctedAttachments,
        attachmentSlots,
        category,
        mode,
        modeSource: mode === data.mode ? data.modeSource : (mode ? 'explicit' : null),
        badgesRaw,
        buildLabel
    };
    refreshReviewWarnings(updated, allBuilds);
    updated.catalogueWarning = await catalogueWarningFor(updated);
    return updated;
}

// Modal submit -- `interaction` is the ModalSubmitInteraction, not yet deferred by the caller -- this function defers itself (deferUpdate, since it's replacing the review card the modal was opened from).
async function applyEditSubmission(interaction, token) {
    const data = pendingAutobuilds.get(token);
    if (!data) {
        return interaction.reply({ content: `${BOT_EMOJI.cross} This review has expired. Run ${mentionCommand(interaction.client, '/autobuild')} again.`, ephemeral: true });
    }
    await interaction.deferUpdate();
    const updated = await applyEditFields(interaction, data);
    pendingAutobuilds.set(token, updated);

    const card = buildReviewCard(token, updated);
    // NOT interaction.editReply(card) -- `card` is raw Components V2 JSON (a type-17 Container), and discord.js's high-level editReply()/reply()/followUp()/update() don't reliably serialize that (no builder class exists for a type-17 Container). Same bypass runExtraction() already uses above for the identical shape of payload -- sendV2Payload PATCHes @original via a raw rest call instead.
    return sendV2Payload(interaction, card.components, { flags: card.flags });
}

module.exports = {
    pendingAutobuilds, buildReviewCard, resolveCategoryAndBadges, runExtraction, confirmAndWrite, retryImageUpload, cancelReview, buildEditModal, applyEditSubmission,
    // The shared halves bulk /autobuild (utils/autobuildBulk.js) drives.
    extractToData, confirmCore, confirmMessage, applyEditFields,
    // Exported for scripts/autobuildDmz.test.js; nothing else calls them.
    resolveMode, parseCategoryAndMode, refreshReviewWarnings, nextBuildNumber, findDmzDuplicates, badgeTokensOf, badgeFieldsFor, writeLoadoutDoc, cleanAttachmentPairs
};
