// utils/autobuildPipeline.js
// Shared state + logic for /autobuild, required from BOTH commands/autobuild.js's execute() (initial
// invocation) and index.js's button/modal handlers (Confirm/Edit/Cancel/retry, added in Tasks 7/8).
// Kept out of commands/autobuild.js itself so index.js can reach the same pendingAutobuilds Map
// without a circular require -- index.js is the entry point and exports nothing today; every command
// file already requires shared logic FROM utils/, never the reverse. Full design:
// docs/superpowers/specs/2026-07-19-loadout-automation-poc-design.md.
const crypto = require('crypto');
const Loadout = require('../models/Loadout');
const { extractLoadoutFromImage } = require('./visionExtract');
const { correctAttachmentName, correctGunsmithCode } = require('./adminParser');
const { sendV2Payload } = require('./sendV2Payload');

// token -> { weaponName, gunsmithCode, attachments[5], category, badgesRaw, mode:'MP', sourceImageUrl, adminId }
// Same short-lived-token pattern as index.js's pendingManageEdits (10 min TTL, set at insertion time
// by whichever function stashes a new entry).
const pendingAutobuilds = new Map();

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

module.exports = { pendingAutobuilds, buildReviewCard, resolveCategoryAndBadges, runExtraction };
