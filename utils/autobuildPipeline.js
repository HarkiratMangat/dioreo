// utils/autobuildPipeline.js
// Shared state + logic for /autobuild, required from BOTH commands/autobuild.js's execute() (initial
// invocation) and index.js's button/modal handlers (Confirm/Edit/Cancel/retry, added in Tasks 7/8).
// Kept out of commands/autobuild.js itself so index.js can reach the same pendingAutobuilds Map
// without a circular require -- index.js is the entry point and exports nothing today; every command
// file already requires shared logic FROM utils/, never the reverse. Full design:
// docs/superpowers/specs/2026-07-19-loadout-automation-poc-design.md.
const crypto = require('crypto');
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Loadout = require('../models/Loadout');
const { extractLoadoutFromImage } = require('./visionExtract');
const { correctAttachmentName, correctGunsmithCode, parseLoadoutBadges, normalizeWeaponName, orderAttachmentsBySlot } = require('./adminParser');
const { sendV2Payload } = require('./sendV2Payload');
const { computeWeaponKeyAndBuild, buildLoadoutCard, getMpCategoryAccent, findDuplicateLoadouts } = require('./loadoutRender');
const { uploadLoadoutImage, syncLoadoutMetadata } = require('./loadoutImageCache');
const { mentionCommand } = require('./commandMentions');

// token -> { weaponName, gunsmithCode, attachments[5], category, badgesRaw, mode:'MP', sourceImageUrl, adminId }
// Same short-lived-token pattern as index.js's pendingManageEdits (10 min TTL, set at insertion time
// by whichever function stashes a new entry).
const pendingAutobuilds = new Map();

// Tracks tokens currently mid-upload/write inside confirmAndWrite -- closes a real duplicate-write
// race: `confirmAndWrite` only deletes a token from `pendingAutobuilds` AFTER its write durably
// succeeds (a deliberate fix for an earlier data-loss bug, see git history around this file), which
// means the token stays visible in the Map for the full duration of the Cloudinary upload + Mongo
// write. Without this marker, two overlapping Confirm clicks on the same token (an admin
// double-click, or a race with something else reading the same token) would both pass the "does
// this token still exist" guard and both independently upload+write, producing two duplicate builds
// for one weapon. Always released in a `finally` so an unexpected throw (e.g. doc.save() failing)
// doesn't permanently strand the token as "in progress" for the rest of its 10-minute TTL.
const confirmInProgress = new Set();

// Recomputes the two advisory warnings shown on the review card (mutates `data` in place). Called at
// initial extraction AND after every Edit submission, since editing the weapon/code/attachments/
// category is exactly what changes whether either warning applies. Pure given `allMpBuilds` (the full
// current MP loadout set) -- the caller does the DB fetch so this stays cheap to re-run.
//   - categoryConflict: an existing build of THIS weapon is saved under a DIFFERENT category than the
//     one chosen here (live-test 4 -- picking MARKSMAN for a weapon already saved as AR silently
//     registered AK117 under two categories). weaponKey is the weapon's identity, so a weapon living
//     under two categories is always a mistake worth flagging.
//   - duplicateWarning: this looks like a build already in the DB (live-test 1 + note #14) -- see
//     loadoutRender.js's findDuplicateLoadouts for the two soft rules.
function refreshReviewWarnings(data, allMpBuilds) {
    const weaponKey = (data.weaponName || '').toLowerCase().replace(/\s+/g, '');
    const siblings = allMpBuilds.filter(b => b.weaponKey === weaponKey);
    const conflicting = data.category
        ? siblings.find(b => (b.category || '').toUpperCase() !== data.category.toUpperCase())
        : null;
    data.categoryConflict = conflicting ? conflicting.category : null;

    const dupes = findDuplicateLoadouts({ gunsmithCode: data.gunsmithCode, attachments: data.attachments }, allMpBuilds);
    if (dupes.length > 0) {
        const d = dupes[0];
        const extra = dupes.length > 1 ? ` _(+${dupes.length - 1} more)_` : '';
        data.duplicateWarning = `⚠️ **Possible duplicate:** this looks like **${d.weaponName} — ${d.buildName}**, already in the database (matching Gunsmith code + ${d.overlap}/${d.total} attachments)${extra}. Only Confirm if it's genuinely a new build.`;
    } else {
        data.duplicateWarning = null;
    }
}

// Canonically orders the parallel attachments[]/slots[] arrays (adminParser.orderAttachmentsBySlot) and
// drops empty/blank entries -- a restricted or unread slot pads to '' during extraction, and a slot the
// vision model was (now) told to skip simply isn't there. Keeps the two arrays ALIGNED so per-slot
// Cloudinary metadata never maps an attachment name onto the wrong slot. Shared by runExtraction (for
// the review card + the stored data) and writeLoadoutDoc (defense-in-depth for the retry path).
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

// Ephemeral review card: weapon/code/attachments/category/badges as extracted so far, plus the RAW
// source screenshot as the preview image (not yet uploaded to Cloudinary -- see the design spec for
// why: an edited weapon name during review must never orphan an upload under the wrong key).
function buildReviewCard(token, data) {
    const categoryLine = data.category ? data.category : '⚠️ needs review (use Edit to set one)';
    const attachmentsLines = data.attachments.map((a, i) => `${i + 1}. \`${a || '(empty)'}\``).join('\n');
    const badgesLine = data.badgesRaw && data.badgesRaw.trim()
        ? data.badgesRaw.trim()
        : '_(none entered -- will inherit from an existing build of this weapon if one exists)_';

    const components = [
        { type: 10, content: `# Review Extracted Loadout` },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: `**Weapon:** ${data.weaponName}\n**Category:** ${categoryLine}\n**Gunsmith Code:** \`${data.gunsmithCode}\`` },
        { type: 10, content: `**Attachments:**\n${attachmentsLines}` },
        { type: 10, content: `**Badges:** ${badgesLine}` }
    ];
    // Advisory warnings (never block Confirm) -- see refreshReviewWarnings above.
    if (data.categoryConflict) {
        components.push({ type: 10, content: `⚠️ **Category mismatch:** this weapon is already saved as **${data.categoryConflict}**. Saving it as **${data.category}** will register it under two categories — double-check the category before confirming (use **Edit** to change it).` });
    }
    if (data.duplicateWarning) {
        components.push({ type: 10, content: data.duplicateWarning });
    }
    components.push({ type: 12, items: [{ media: { url: data.sourceImageUrl } }] });
    components.push({ type: 14, spacing: 1, divider: true });
    components.push({
        type: 1,
        components: [
            { type: 2, style: 3, label: 'Confirm', custom_id: `autobuild_confirm_${token}` },
            { type: 2, style: 1, label: 'Edit', custom_id: `autobuild_editbtn_${token}` },
            { type: 2, style: 4, label: 'Cancel', custom_id: `autobuild_cancel_${token}` }
        ]
    });

    const container = {
        type: 17,
        accent_color: 2829617, // neutral gray fallback (same as DEFAULT_MP_ACCENT in loadoutRender.js) -- category may still be unresolved at review time, so this card never guesses a per-category color
        components
    };
    return { components: [container], flags: 32768 };
}

// Category: explicit option > an existing sibling build's category > unresolved (null).
// Badges: explicit option > (if blank) an existing sibling's badges, reconstructed as a token string
// > empty (per the design spec's "blank inherits from an existing build if one exists" rule).
async function resolveCategoryAndBadges(weaponName, explicitCategory, badgesOption) {
    const weaponKey = weaponName.toLowerCase().replace(/\s+/g, '');
    let category = explicitCategory || null;
    let badgesRaw = badgesOption || '';

    if (!category || !badgesRaw.trim()) {
        const sibling = await Loadout.findOne({ weaponKey, mode: 'MP' }).lean();
        if (sibling) {
            if (!category) category = sibling.category;
            if (!badgesRaw.trim()) {
                badgesRaw = [sibling.isMeta ? 'meta' : null, sibling.categoryRank, sibling.isToxic ? 'toxic' : null].filter(Boolean).join(',');
            }
        }
    }
    return { category, badgesRaw };
}

// Runs extraction + post-processing + stashes a pending token, then sends the review card as this
// interaction's own deferred reply. Caller must have already called interaction.deferReply() (ephemeral
// per the command's `private` option, default true).
async function runExtraction(interaction, sourceImageUrl, explicitCategory, badgesOption) {
    let extracted;
    try {
        extracted = await extractLoadoutFromImage(sourceImageUrl, { taskName: 'autobuild_live' });
    } catch (err) {
        console.error('Autobuild extraction failed:', err.message);
        return interaction.followUp({ content: `❌ Couldn't extract loadout data from that image: ${err.message}`, ephemeral: true });
    }

    // One fetch, reused for BOTH the attachment-name corrector's known-vocabulary set AND the
    // duplicate/category-conflict warnings (refreshReviewWarnings) -- richer field select than the
    // old attachments-only projection so those checks have shareCode/category/weaponName to work with.
    const allMpBuilds = await Loadout.find({ mode: 'MP' }).select('weaponKey weaponName category buildName shareCode attachments').lean();
    const knownAttachments = [...new Set(allMpBuilds.flatMap(l => l.attachments))];
    const correctedAttachments = extracted.attachments.map(a => correctAttachmentName(a, knownAttachments));
    const correctedCode = correctGunsmithCode(extracted.gunsmithCode);
    // Strip skin suffix + normalize casing so the weaponKey/imageKey/display value all resolve to the
    // real weapon (see normalizeWeaponName) -- this is the fix for the v2-test "new weapon created from
    // the skin name" cascade. Everything below uses the normalized name, not the raw extraction.
    const weaponName = normalizeWeaponName(extracted.weaponName);
    // Reorder into canonical slot order, then drop empty/restricted slots (they pad to '' upstream),
    // keeping attachments and their parallel slot labels aligned so per-slot metadata stays correct.
    const { attachments: cleanAttachments, attachmentSlots: cleanSlots } = cleanAttachmentPairs(correctedAttachments, extracted.attachmentSlots);

    const { category, badgesRaw } = await resolveCategoryAndBadges(weaponName, explicitCategory, badgesOption);

    const token = crypto.randomBytes(8).toString('hex');
    const data = {
        weaponName,
        gunsmithCode: correctedCode,
        attachments: cleanAttachments,
        // Feeds the per-slot Cloudinary structured metadata (Muzzle/Barrel/... fields) via
        // loadoutImageCache.js's buildLoadoutMetadata/SLOT_TO_FIELD -- Cloudinary-only, not written to
        // the Loadout doc, which is exactly why the per-slot fields can only ever be filled by
        // /autobuild. Kept aligned to `attachments` above by cleanAttachmentPairs (same order, same
        // filtering). Not re-corrected against knownAttachments the way `attachments` itself is: slot
        // labels are a small closed vocabulary (Muzzle/Barrel/Optic/...), not free text prone to the
        // same misread-spelling drift attachment NAMES have.
        attachmentSlots: cleanSlots,
        category,
        badgesRaw,
        mode: 'MP',
        sourceImageUrl,
        adminId: interaction.user.id
    };
    refreshReviewWarnings(data, allMpBuilds);
    pendingAutobuilds.set(token, data);
    setTimeout(() => pendingAutobuilds.delete(token), 10 * 60 * 1000).unref();

    const card = buildReviewCard(token, data);
    return sendV2Payload(interaction, card.components, { flags: card.flags });
}

// Confirmed-but-image-upload-failed state -- separate from pendingAutobuilds (the pre-Confirm review
// state) because once Confirmed, the admin has already approved the CONTENT; only the image itself
// needs retrying. weaponKey/buildName/imageKey are pre-computed and stored here so a retry reuses the
// exact same values rather than recomputing (and risking a different result if another build for the
// same weapon was added in the meantime).
const pendingImageRetries = new Map(); // retryToken -> confirmed data + { weaponKey, buildName, imageKey }

// Same duplicate-write guard as confirmInProgress above, scoped to retryImageUpload's own token
// space. This path is actually the MORE exposed of the two -- it's driven by the `/autobuild
// retry_token:` slash command, not a button, so it gets none of index.js's generic anti-spam
// cooldown (that guard is scoped to isButton()/isStringSelectMenu() only). Two quick resubmits of
// the same retry_token (an accidental double-submit) would otherwise race freely for the entire
// upload+write duration.
const retryInProgress = new Set();

// Replaces the message this interaction is answering (the ephemeral review card, or the retry
// command's own reply) IN PLACE with the given Components V2 card, via sendV2Payload's `rest.patch(
// @original)`. Changed 2026-07-21 from POSTing a brand-new message (per Harkirat's live-test note
// #11: "instead of a new msg to open loadout, why not just edit the review panel, remove it, and edit
// in the 'loadout created, open loadout' msg") -- so Confirm swaps the review card straight into the
// post-creation card instead of leaving a stale review panel sitting above a new message.
// Wrapped in its own try/catch: a failure here happens AFTER the Loadout doc/Cloudinary upload has
// already durably succeeded (every caller only reaches this once its write is committed), so a dead
// interaction token must never look like the whole Confirm/retry operation failed. Never rethrows --
// a missed confirmation edit is a silent-but-safe UX gap, not a data-loss bug.
async function replaceWithV2Card(interaction, card) {
    try {
        return await sendV2Payload(interaction, card.components, { flags: card.flags });
    } catch (notifyError) {
        console.error('Failed to render autobuild post-creation card (interaction token likely expired) -- underlying Loadout doc was already saved successfully:', notifyError);
    }
}

async function writeLoadoutDoc(data, imageKeyOverride) {
    const { isMeta, categoryRank, isToxic } = parseLoadoutBadges(data.badgesRaw);
    // Final safety pass: never persist an empty/blank attachment (a restricted/unread slot), and keep
    // the parallel slot labels aligned for the metadata sync below. Idempotent for the normal path
    // (runExtraction already cleaned these); the point is to also cover the retry path.
    const { attachments, attachmentSlots } = cleanAttachmentPairs(data.attachments, data.attachmentSlots);
    const doc = new Loadout({
        weaponKey: data.weaponKey,
        weaponName: data.weaponName,
        category: data.category,
        mode: 'MP',
        buildName: data.buildName,
        attachments,
        attachmentSlots,
        imageKey: imageKeyOverride || data.imageKey,
        shareCode: data.gunsmithCode,
        isMeta,
        categoryRank,
        isToxic
    });
    await doc.save();

    // Badges describe the WEAPON, not one build variant -- sync them to every sibling build so a
    // badge set here (e.g. Meta added during review) shows on the weapon's OTHER builds too (live-test
    // 3: the badge only landed on the new build). Mirrors index.js's edit_loadout_ propagation.
    // Guarded on "at least one badge is actually set" so a blank never WIPES siblings -- and because
    // /autobuild already RESOLVES blank badges by inheriting from an existing sibling
    // (resolveCategoryAndBadges), a still-blank value here genuinely means no weapon-level badge
    // exists, so skipping propagation in that case is correct, not a gap.
    const badgesSet = isMeta || categoryRank || isToxic;
    if (badgesSet) {
        await Loadout.updateMany(
            { weaponKey: data.weaponKey, mode: 'MP', _id: { $ne: doc._id } },
            { isMeta, categoryRank, isToxic }
        );
    }

    // Cloudinary structured metadata (best-effort, never throws). The new build gets its per-slot data
    // too (only the /autobuild path has the slot->attachment mapping from the vision extraction). If
    // badges just propagated, re-sync the affected siblings so their Cloudinary badge metadata matches.
    await syncLoadoutMetadata(doc, attachmentSlots);
    if (badgesSet) {
        const siblings = await Loadout.find({ weaponKey: data.weaponKey, mode: 'MP', _id: { $ne: doc._id } });
        for (const sibling of siblings) await syncLoadoutMetadata(sibling);
    }
    return doc;
}

function buildPostCreationCard(doc, imageWarning) {
    const accentColor = getMpCategoryAccent(doc.category);
    let content = `✅ **Loadout created:** ${doc.weaponName} (${doc.buildName}, ${doc.category})`;
    if (imageWarning) content += `\n⚠️ ${imageWarning}`;
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

// Confirm click -- `interaction` is the BUTTON interaction. Caller (index.js) must call
// interaction.deferUpdate() before calling this, since the review card is being replaced.
async function confirmAndWrite(interaction, token) {
    const data = pendingAutobuilds.get(token);
    if (!data) {
        return interaction.followUp({ content: `❌ This review has expired (10 minute window) or was already handled. Run ${mentionCommand(interaction.client, '/autobuild')} again.`, ephemeral: true });
    }
    if (!data.category) {
        return interaction.followUp({ content: '❌ Category is still unresolved -- click **Edit** and set one before confirming.', ephemeral: true });
    }

    // Claim the token before any slow work starts -- see confirmInProgress's own comment above for
    // why this exists. Checked AFTER the two cheap validation returns above (an unresolved-category
    // click never reaches Cloudinary/Mongo, so it's not part of the race this guards against).
    if (confirmInProgress.has(token)) {
        return interaction.followUp({ content: '⏳ Already processing this Confirm click -- give it a moment.', ephemeral: true });
    }
    confirmInProgress.add(token);

    try {
        const weaponKeyForLookup = data.weaponName.toLowerCase().replace(/\s+/g, '');
        const siblingBuildNames = (await Loadout.find({ weaponKey: weaponKeyForLookup, mode: 'MP' }).select('buildName').lean()).map(l => l.buildName);
        const { weaponKey, buildName, imageKey } = computeWeaponKeyAndBuild(data.weaponName, siblingBuildNames);

        // Image only -- structured metadata is set from the saved Loadout doc by writeLoadoutDoc ->
        // syncLoadoutMetadata (which also has the per-slot data), so a metadata problem can never fail
        // this upload.
        const uploadResult = await uploadLoadoutImage(data.sourceImageUrl, imageKey);

        if (uploadResult.success) {
            // Delete AFTER the write succeeds, not before -- if doc.save() throws (a real possibility:
            // Mongoose validation, a dropped connection), the token must still be sitting in
            // pendingAutobuilds so the confirmed data isn't silently lost with nothing written anywhere.
            // (Found in review: this used to delete first, which meant a save() failure here lost the
            // data permanently -- no Loadout doc, no recoverable token.)
            const doc = await writeLoadoutDoc({ ...data, weaponKey, buildName, imageKey });
            pendingAutobuilds.delete(token);
            const card = buildPostCreationCard(doc, null);
            return await replaceWithV2Card(interaction, card);
        }

        // First failure: do NOT write yet. Stash the confirmed data (with weaponKey/buildName/imageKey
        // already computed) under a new retry token, ask for the image again.
        const retryToken = crypto.randomBytes(8).toString('hex');
        pendingImageRetries.set(retryToken, { ...data, weaponKey, buildName, imageKey });
        setTimeout(() => pendingImageRetries.delete(retryToken), 10 * 60 * 1000).unref();
        pendingAutobuilds.delete(token);

        return interaction.followUp({
            content: `⚠️ Image upload to Cloudinary failed (${uploadResult.error}). Nothing was saved yet -- re-run this to try the image again:\n\`/autobuild retry_token:${retryToken} screenshot:<new attachment>\` (or use \`url:\` instead)\n\nIf it fails again, the loadout will be created anyway without an image, and you can fix it later via \`/manage\`.`,
            ephemeral: true
        });
    } finally {
        // Always released, whether this call finished normally (either branch above) or threw
        // unexpectedly -- a genuine failure must not permanently block every later attempt on this
        // token for the rest of its TTL.
        confirmInProgress.delete(token);
    }
}

// Second attempt, via /autobuild's retry_token option (commands/autobuild.js calls this directly --
// see the design spec's "Image retry mechanism" decision for why this can't be a button/modal).
async function retryImageUpload(interaction, token, newImageUrl) {
    const data = pendingImageRetries.get(token);
    if (!data) {
        return interaction.followUp({ content: `❌ That retry token has expired or was already used. Run ${mentionCommand(interaction.client, '/autobuild')} again from scratch.`, ephemeral: true });
    }
    // NOTE: deletion moved to AFTER each write below actually succeeds (was deleted here, before
    // either write attempt) -- same class of bug as confirmAndWrite's success path. If writeLoadoutDoc
    // throws (Mongoose validation/connection error) on either branch, the token must still be in
    // pendingImageRetries so the confirmed data isn't silently lost with no Loadout doc written.

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

        // Second failure -- write anyway with a placeholder key, never lose the already-confirmed data.
        // checkImageExists() (called wherever the resulting card is later rendered, e.g. /all) correctly
        // flags this as broken -- same existing warning path every other loadout save already goes
        // through, nothing new needed for that part.
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
    return interaction.followUp({ content: '❌ Cancelled -- nothing was saved or uploaded.', ephemeral: true });
}

// Edit modal -- ALL fields in one modal (per the design spec's decision), pre-filled from the pending
// token's current data. Discord caps a modal at 5 fields; attachments share ONE Paragraph field (one
// per line, matching every other loadout modal's convention in commands/manage.js) so
// weapon/code/attachments/category/badges all fit.
function buildEditModal(token, data) {
    const modal = new ModalBuilder().setCustomId(`autobuild_editmodal_${token}`).setTitle('Edit Extracted Loadout');
    modal.addComponents(
        // `|| ''` fallback on both -- TextInputBuilder.setValue(undefined) throws SYNCHRONOUSLY, which would
        // throw inside showModal() before the interaction is ever acknowledged (the exact production incident
        // documented in CLAUDE.md's `/manage` batch-refinement-pass section: buildEditDrawModal's
        // .setValue(targetDraw.thumbnailUrl) on a legacy doc missing that field). Gemini extraction can
        // genuinely leave weaponName/gunsmithCode undefined on a bad read, so this can't assume they're set
        // the way category/badgesRaw two lines below already correctly don't assume.
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('weapon').setLabel('Weapon Name').setStyle(TextInputStyle.Short).setValue(data.weaponName || '').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('code').setLabel('Gunsmith Code').setStyle(TextInputStyle.Short).setValue(data.gunsmithCode || '').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (one per line)').setStyle(TextInputStyle.Paragraph).setValue(data.attachments.join('\n')).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('category').setLabel('Category').setStyle(TextInputStyle.Short).setPlaceholder('AR / SMG / LMG / MARKSMAN / SNIPER / SHOTGUN / SECONDARIES').setValue(data.category || '').setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('badges').setLabel('Badges (optional)').setStyle(TextInputStyle.Short).setPlaceholder('meta,best,top5,toxic').setValue(data.badgesRaw || '').setRequired(false))
    );
    return modal;
}

// Modal submit -- re-runs the SAME post-processing (fuzzy-match + code-corrector) on whatever was
// typed, per the design spec. `interaction` is the ModalSubmitInteraction, not yet deferred by the
// caller -- this function defers itself (deferUpdate, since it's replacing the review card the modal
// was opened from).
async function applyEditSubmission(interaction, token) {
    const data = pendingAutobuilds.get(token);
    if (!data) {
        return interaction.reply({ content: `❌ This review has expired. Run ${mentionCommand(interaction.client, '/autobuild')} again.`, ephemeral: true });
    }
    await interaction.deferUpdate();

    // Same normalizer as the initial extraction: strip a skin suffix + force the all-caps convention,
    // so a manually-typed "Machine Pistol" or "R9-0 - Death's Voice" is stored consistently too.
    const weaponName = normalizeWeaponName(interaction.fields.getTextInputValue('weapon'));
    const rawCode = interaction.fields.getTextInputValue('code').trim();
    const rawAttachments = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(Boolean);
    const category = interaction.fields.getTextInputValue('category').trim().toUpperCase();
    const badgesRaw = interaction.fields.getTextInputValue('badges').trim();

    // Same richer select as runExtraction -- reused for the attachment corrector AND the recomputed
    // duplicate/category-conflict warnings (an Edit is exactly what changes whether either applies).
    const allMpBuilds = await Loadout.find({ mode: 'MP' }).select('weaponKey weaponName category buildName shareCode attachments').lean();
    const knownAttachments = [...new Set(allMpBuilds.flatMap(l => l.attachments))];
    // Variable length now (was force-padded to exactly 5) -- a restricted-slot weapon legitimately has
    // fewer, and blank lines were already filtered out above.
    const correctedAttachments = rawAttachments.map(a => correctAttachmentName(a, knownAttachments));
    const correctedCode = correctGunsmithCode(rawCode);

    // The Edit modal carries attachment NAMES only, no slot labels, so an edit that changes the
    // attachment list can't keep a valid slot->name mapping. Keep the extraction's slots ONLY if the
    // list is unchanged (a badge/category-only edit, the common case) so per-slot metadata survives;
    // otherwise clear it, so a later Confirm writes no per-slot metadata rather than WRONG per-slot
    // metadata. (buildLoadoutMetadata skips per-slot fields entirely when slots is empty.)
    const attachmentsUnchanged = correctedAttachments.length === data.attachments.length
        && correctedAttachments.every((a, i) => a === data.attachments[i]);
    const attachmentSlots = attachmentsUnchanged ? data.attachmentSlots : [];

    const updated = {
        ...data,
        weaponName,
        gunsmithCode: correctedCode,
        attachments: correctedAttachments,
        attachmentSlots,
        category: category || null,
        badgesRaw
    };
    refreshReviewWarnings(updated, allMpBuilds);
    pendingAutobuilds.set(token, updated);

    const card = buildReviewCard(token, updated);
    // NOT interaction.editReply(card) -- `card` is raw Components V2 JSON (a type-17 Container), and
    // discord.js's high-level editReply()/reply()/followUp()/update() don't reliably serialize that (no
    // builder class exists for a type-17 Container). Same bypass runExtraction() already uses above for
    // the identical shape of payload -- sendV2Payload PATCHes @original via a raw rest call instead.
    return sendV2Payload(interaction, card.components, { flags: card.flags });
}

module.exports = { pendingAutobuilds, buildReviewCard, resolveCategoryAndBadges, runExtraction, confirmAndWrite, retryImageUpload, cancelReview, buildEditModal, applyEditSubmission };
