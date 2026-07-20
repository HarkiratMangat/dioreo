// utils/autobuildPipeline.js
// Shared state + logic for /autobuild, required from BOTH commands/autobuild.js's execute() (initial
// invocation) and index.js's button/modal handlers (Confirm/Edit/Cancel/retry, added in Tasks 7/8).
// Kept out of commands/autobuild.js itself so index.js can reach the same pendingAutobuilds Map
// without a circular require -- index.js is the entry point and exports nothing today; every command
// file already requires shared logic FROM utils/, never the reverse. Full design:
// docs/superpowers/specs/2026-07-19-loadout-automation-poc-design.md.
const crypto = require('crypto');
const { Routes, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Loadout = require('../models/Loadout');
const { extractLoadoutFromImage } = require('./visionExtract');
const { correctAttachmentName, correctGunsmithCode, parseLoadoutBadges } = require('./adminParser');
const { sendV2Payload } = require('./sendV2Payload');
const { computeWeaponKeyAndBuild, buildLoadoutCard, getMpCategoryAccent } = require('./loadoutRender');
const { uploadLoadoutImage } = require('./loadoutImageCache');

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

// Ephemeral review card: weapon/code/attachments/category/badges as extracted so far, plus the RAW
// source screenshot as the preview image (not yet uploaded to Cloudinary -- see the design spec for
// why: an edited weapon name during review must never orphan an upload under the wrong key).
function buildReviewCard(token, data) {
    const categoryLine = data.category ? data.category : '⚠️ needs review (use Edit to set one)';
    const attachmentsLines = data.attachments.map((a, i) => `${i + 1}. \`${a || '(empty)'}\``).join('\n');
    const badgesLine = data.badgesRaw && data.badgesRaw.trim()
        ? data.badgesRaw.trim()
        : '_(none entered -- will inherit from an existing build of this weapon if one exists)_';

    const container = {
        type: 17,
        accent_color: 2829617, // neutral gray fallback (same as DEFAULT_MP_ACCENT in loadoutRender.js) -- category may still be unresolved at review time, so this card never guesses a per-category color
        components: [
            { type: 10, content: `# Review Extracted Loadout` },
            { type: 14, spacing: 1, divider: true },
            { type: 10, content: `**Weapon:** ${data.weaponName}\n**Category:** ${categoryLine}\n**Gunsmith Code:** \`${data.gunsmithCode}\`` },
            { type: 10, content: `**Attachments:**\n${attachmentsLines}` },
            { type: 10, content: `**Badges:** ${badgesLine}` },
            { type: 12, items: [{ media: { url: data.sourceImageUrl } }] },
            { type: 14, spacing: 1, divider: true },
            {
                type: 1,
                components: [
                    { type: 2, style: 3, label: 'Confirm', custom_id: `autobuild_confirm_${token}` },
                    { type: 2, style: 1, label: 'Edit', custom_id: `autobuild_editbtn_${token}` },
                    { type: 2, style: 4, label: 'Cancel', custom_id: `autobuild_cancel_${token}` }
                ]
            }
        ]
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
// interaction's own deferred reply. Caller must have already called interaction.deferReply({ephemeral:true}).
async function runExtraction(interaction, sourceImageUrl, explicitCategory, badgesOption) {
    let extracted;
    try {
        extracted = await extractLoadoutFromImage(sourceImageUrl);
    } catch (err) {
        console.error('Autobuild extraction failed:', err.message);
        return interaction.followUp({ content: `❌ Couldn't extract loadout data from that image: ${err.message}`, ephemeral: true });
    }

    const allLoadouts = await Loadout.find({ mode: 'MP' }).select('attachments').lean();
    const knownAttachments = [...new Set(allLoadouts.flatMap(l => l.attachments))];
    const correctedAttachments = extracted.attachments.map(a => correctAttachmentName(a, knownAttachments));
    const correctedCode = correctGunsmithCode(extracted.gunsmithCode);

    const { category, badgesRaw } = await resolveCategoryAndBadges(extracted.weaponName, explicitCategory, badgesOption);

    const token = crypto.randomBytes(8).toString('hex');
    const data = {
        weaponName: extracted.weaponName,
        gunsmithCode: correctedCode,
        attachments: correctedAttachments,
        category,
        badgesRaw,
        mode: 'MP',
        sourceImageUrl,
        adminId: interaction.user.id
    };
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

// Sends a NEW ephemeral follow-up message carrying raw Components V2 JSON (a type-17 Container).
// discord.js's high-level `interaction.followUp({components})` does NOT reliably serialize raw V2
// JSON -- no builder class exists for a type-17 Container, the exact same limitation already
// documented at every other V2 send site in this codebase (utils/sendV2Payload.js's own header
// comment; index.js's `set_accent_style`/'displayName' Nitro notice, which hit this same wall for a
// brand-new follow-up message and worked around it with this identical raw POST). `sendV2Payload`
// itself doesn't apply here because it PATCHes `@original` -- this needs a genuinely NEW message
// (the post-creation card is a separate message from the review card, per the design spec), so this
// mirrors that pattern with `rest.post(Routes.webhook(...))` instead of `rest.patch(...)`. Always
// ephemeral (64) -- every message in this admin-only flow stays private; only the "Open Loadout"
// button click below produces a real public message.
async function followUpV2Card(interaction, card) {
    // Wrapped in its own try/catch, matching the identical precedent at index.js's 'displayName'
    // Nitro-notice handler (~line 996-1020) -- a failure here happens AFTER the Loadout doc/Cloudinary
    // upload has already succeeded (both callers below only ever reach this once their write is durable),
    // so a dead interaction token here must never look like the whole Confirm/retry operation failed.
    // Never rethrows -- the underlying data is already safely saved; a missed confirmation message is a
    // silent-but-safe UX gap, not a data-loss bug.
    try {
        return await interaction.client.rest.post(
            Routes.webhook(interaction.applicationId, interaction.token),
            { body: { flags: (card.flags || 32768) | 64, components: card.components } }
        );
    } catch (notifyError) {
        console.error('Failed to send autobuild post-creation card (interaction token likely expired) -- underlying Loadout doc was already saved successfully:', notifyError);
    }
}

async function writeLoadoutDoc(data, imageKeyOverride) {
    const { isMeta, categoryRank, isToxic } = parseLoadoutBadges(data.badgesRaw);
    const doc = new Loadout({
        weaponKey: data.weaponKey,
        weaponName: data.weaponName,
        category: data.category,
        mode: 'MP',
        buildName: data.buildName,
        attachments: data.attachments,
        imageKey: imageKeyOverride || data.imageKey,
        shareCode: data.gunsmithCode,
        isMeta,
        categoryRank,
        isToxic
    });
    await doc.save();
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
        return interaction.followUp({ content: '❌ This review has expired (10 minute window) or was already handled. Run `/autobuild` again.', ephemeral: true });
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
            return await followUpV2Card(interaction, card);
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
        return interaction.followUp({ content: '❌ That retry token has expired or was already used. Run `/autobuild` again from scratch.', ephemeral: true });
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
        const uploadResult = await uploadLoadoutImage(newImageUrl, data.imageKey);
        if (uploadResult.success) {
            const doc = await writeLoadoutDoc(data);
            pendingImageRetries.delete(token);
            const card = buildPostCreationCard(doc, null);
            return await followUpV2Card(interaction, card);
        }

        // Second failure -- write anyway with a placeholder key, never lose the already-confirmed data.
        // checkImageExists() (called wherever the resulting card is later rendered, e.g. /all) correctly
        // flags this as broken -- same existing warning path every other loadout save already goes
        // through, nothing new needed for that part.
        const placeholderKey = `PENDING-UPLOAD-${token}`;
        const doc = await writeLoadoutDoc(data, placeholderKey);
        pendingImageRetries.delete(token);
        const card = buildPostCreationCard(doc, 'No image could be uploaded (tried twice). Fix it via `/manage` -> Edit Loadout -> set a real Cloudinary Image Key.');
        return await followUpV2Card(interaction, card);
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
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('attachments').setLabel('Attachments (One per line, 5 total)').setStyle(TextInputStyle.Paragraph).setValue(data.attachments.join('\n')).setRequired(true)),
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
        return interaction.reply({ content: '❌ This review has expired. Run `/autobuild` again.', ephemeral: true });
    }
    await interaction.deferUpdate();

    const weaponName = interaction.fields.getTextInputValue('weapon').trim();
    const rawCode = interaction.fields.getTextInputValue('code').trim();
    const rawAttachments = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(Boolean);
    const category = interaction.fields.getTextInputValue('category').trim().toUpperCase();
    const badgesRaw = interaction.fields.getTextInputValue('badges').trim();

    const allLoadouts = await Loadout.find({ mode: 'MP' }).select('attachments').lean();
    const knownAttachments = [...new Set(allLoadouts.flatMap(l => l.attachments))];
    const correctedAttachments = [0, 1, 2, 3, 4].map(i => correctAttachmentName(rawAttachments[i] || '', knownAttachments));
    const correctedCode = correctGunsmithCode(rawCode);

    const updated = {
        ...data,
        weaponName,
        gunsmithCode: correctedCode,
        attachments: correctedAttachments,
        category: category || null,
        badgesRaw
    };
    pendingAutobuilds.set(token, updated);

    const card = buildReviewCard(token, updated);
    // NOT interaction.editReply(card) -- `card` is raw Components V2 JSON (a type-17 Container), and
    // discord.js's high-level editReply()/reply()/followUp()/update() don't reliably serialize that (no
    // builder class exists for a type-17 Container). Same bypass runExtraction() already uses above for
    // the identical shape of payload -- sendV2Payload PATCHes @original via a raw rest call instead.
    return sendV2Payload(interaction, card.components, { flags: card.flags });
}

module.exports = { pendingAutobuilds, buildReviewCard, resolveCategoryAndBadges, runExtraction, confirmAndWrite, retryImageUpload, cancelReview, buildEditModal, applyEditSubmission };
