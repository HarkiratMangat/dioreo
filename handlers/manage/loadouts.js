// ==========================================
// /manage — LOADOUTS PAGES (MP + DMZ)
// ==========================================
// Every DB-mutating operation the Loadouts pages reach: single add/edit, bulk add/replace/delete, and the two export flows. MP and DMZ share this one file (same as manageActions.js's loadoutsActions() factory) since they're structurally identical pages differing only in `mode`, carried on the custom_id suffix (`add_loadout_MP`, `modal_loadouts_bulk_add_DMZ`, etc.). Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/ 2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js.
//
// ⚠️ NO PURGE HERE, DELIBERATELY -- Loadouts has no Purge button at all (see .claude/rules/manage-panel.md). Only draws.js/calendar.js/patchnotes.js export a purge().
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and .claude/rules/interaction-router.md.
//
// ⚠️ MUTATIONS ROUTE THROUGH THE OPERATION CORE (core/changeset.js's commitSet), as of plan 2 Task 3 (2026-08-21 13:01 EDT). Badge parsing (utils/adminParser.js's parseLoadoutBadges) and the DMZ categoryRank->dmzRangeRank swap stay HERE, same as before -- the op expects already-parsed badge fields, not raw modal text. Cloudinary structured-metadata sync, badge propagation to sibling builds, and the attachmentSlots byte-identity check all moved INTO core/ops/loadouts.js's apply() (see that file's own header for the real defects found integrating this: weaponKey must be a plain normalize, not /autobuild's auto-namer; "Add"/"Replace Multiple" share ONE upsert body since there is no wholesale-replace for loadouts; a shareCode key must be OMITTED entirely on edit or it silently wipes an /autobuild-set gunsmith code). Undo now lives on /bot analytics' Changes page (core/revert.js) -- the old in-memory Undo button is GONE from every mutation here (see handlers/manage/shared.js's own header for where it used to live). Export flows (exportUpTo5/exportCategory) are read-only and untouched.

const { commitSet } = require('../../core/changeset');

// --- SAVE EDITED LOADOUT --- custom_id: edit_loadout_{id}
async function editLoadout(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseLoadoutBadges } = require('../../utils/adminParser');
    const { checkImageExists } = require('../../utils/loadoutRender');
    const Loadout = require('../../models/Loadout');
    const targetId = interaction.customId.replace('edit_loadout_', '');

    // Mode is not editable through this modal at all (MP/DMZ are separate panel pages) -- read straight off the existing document, same as before the refactor.
    const existingLoadout = await Loadout.findById(targetId).lean();
    if (!existingLoadout) return; // Preserves the original's silent no-op on a stale search result.
    const mode = existingLoadout.mode || 'MP';

    // Field is "Category | Badges" (2 segments).
    const metaParts = interaction.fields.getTextInputValue('meta').split('|').map(s => s.trim());
    const attachmentsArray = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);
    let { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized } = parseLoadoutBadges(metaParts[1]);

    // DMZ never uses the per-category Best/TopN system -- a bare "best"/"topN" token (no -close/-midlong suffix) still parses into categoryRank since the parser doesn't know the mode, so move it over to dmzRangeRank here instead.
    if (mode === 'DMZ' && categoryRank && !dmzRangeRank) {
        dmzRangeRank = categoryRank;
        categoryRank = null;
    }

    const weaponName = interaction.fields.getTextInputValue('weapon');
    const buildName = interaction.fields.getTextInputValue('build');
    const imageKey = interaction.fields.getTextInputValue('image');

    const result = await commitSet(
        [{ type: 'loadout.edit', target: { id: targetId },
           payload: { weaponName, buildName, mode, attachments: attachmentsArray, imageKey,
                      category: metaParts[0], isMeta, categoryRank, dmzRangeRank, isToxic } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        const why = result.failures?.[0]?.errors?.join(' ') || result.error;
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { applied } = result.results[0];

    let confirmation = `✅ **Loadout Updated Successfully!** ${weaponName} (${buildName})`;
    if (applied.propagatedCount > 0) {
        confirmation += `\n-# Badges also synced to ${applied.propagatedCount} other build(s) of this weapon.`;
    }
    if (unrecognized.length > 0) {
        confirmation += `\n⚠️ Badge input not recognized and ignored: \`${unrecognized.join(', ')}\`. Valid options: \`meta\`, \`best\`, \`toxic\`, \`topN\` (e.g. \`top3\`), or a DMZ range badge (\`bestclose\`, \`bestmidlong\`, \`top3close\`, \`top5midlong\`).`;
    }
    // Real Cloudinary existence check -- catches the exact silent-failure mode where a mismatched key saves fine and only shows up as a broken card image later. Advisory only -- never blocks the save, which already happened above.
    if (!(await checkImageExists(imageKey))) {
        confirmation += `\n⚠️ **Heads up:** no image found on Cloudinary at key \`${imageKey}\` -- the card will show broken until an image with that exact Public ID is uploaded there.`;
    }

    return interaction.followUp({ content: confirmation });
}

// --- SAVE NEW SINGLE LOADOUT --- custom_id: add_loadout_{MP|DMZ}
async function addLoadout(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseLoadoutBadges } = require('../../utils/adminParser');
    const { checkImageExists } = require('../../utils/loadoutRender');
    const pageMode = interaction.customId.replace('add_loadout_', '');

    // Field is "Category | Badges" (2 segments) -- Mode has no modal field since the Add button itself is already MP/DMZ-scoped by which page it's on.
    const metaParts = interaction.fields.getTextInputValue('meta').split('|').map(s => s.trim());
    const attachmentsArray = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);
    // Unlike editLoadout above, this does NOT propagate badges to sibling builds of the same weapon (the op's loadout.add never calls propagateBadges) -- this modal has nothing pre-filled, so a blank badges field here (the common case when just adding another build variant) would silently wipe any badges already set on the weapon's existing builds. Re-editing an existing build is the supported way to (re)sync badges.
    let { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized } = parseLoadoutBadges(metaParts[1]);
    if (pageMode === 'DMZ' && categoryRank && !dmzRangeRank) {
        dmzRangeRank = categoryRank;
        categoryRank = null;
    }

    const weaponName = interaction.fields.getTextInputValue('weapon');
    const buildName = interaction.fields.getTextInputValue('build');
    const imageKey = interaction.fields.getTextInputValue('image');

    const result = await commitSet(
        [{ type: 'loadout.add',
           payload: { weaponName, buildName, mode: pageMode, attachments: attachmentsArray, imageKey,
                      category: metaParts[0], isMeta, categoryRank, dmzRangeRank, isToxic } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        const why = result.failures?.[0]?.errors?.join(' ') || result.error;
        return await interaction.followUp({ content: `❌ ${why}` });
    }

    let confirmation = `✅ **Successfully saved Loadout: ${weaponName} (${buildName}, ${pageMode})!**`;
    if (unrecognized.length > 0) {
        confirmation += `\n⚠️ Badge input not recognized and ignored: \`${unrecognized.join(', ')}\`. Valid options: \`meta\`, \`best\`, \`toxic\`, \`topN\` (e.g. \`top3\`), or a DMZ range badge (\`bestclose\`, \`bestmidlong\`, \`top3close\`, \`top5midlong\`).`;
    }
    if (!(await checkImageExists(imageKey))) {
        confirmation += `\n⚠️ **Heads up:** no image found on Cloudinary at key \`${imageKey}\` -- the card will show broken until an image with that exact Public ID is uploaded there.`;
    }
    return interaction.followUp({ content: confirmation });
}

// --- BULK ADD/REPLACE LOADOUTS (upsert, never wholesale-replaces) --- custom_id: modal_loadouts_bulk_add_{MP|DMZ}. "Replace" also routes into this exact modal/handler (see manageActions.js's comment on why). Parsing now happens INSIDE the op (core/ops/loadouts.js), which upserts by {weaponKey, mode, buildName} -- this handler just relays the raw pasted text and `mode`.
async function bulkAddLoadouts(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const pageMode = interaction.customId.replace('modal_loadouts_bulk_add_', '');
    const bulkText = interaction.fields.getTextInputValue('bulk_text');

    const result = await commitSet(
        [{ type: 'loadout.bulkAdd', target: { mode: pageMode }, payload: { text: bulkText } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        const why = result.failures?.[0]?.errors?.join(' ') || result.error;
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { applied } = result.results[0];

    let confirmation = `✅ **Bulk Loadout Import Complete!**\n${applied.created} new build(s) added, ${applied.updated} existing build(s) updated.`;
    if (applied.parseErrors.length > 0) {
        confirmation += `\n⚠️ ${applied.parseErrors.length} block(s) skipped:\n${applied.parseErrors.map(e => `- ${e}`).join('\n')}`;
    }
    if (applied.missingImages.length > 0) {
        confirmation += `\n⚠️ No Cloudinary image found for ${applied.missingImages.length} build(s) -- these will show broken until uploaded there with the exact Public ID typed:\n${applied.missingImages.map(m => `- ${m.label}: \`${m.imageKey}\``).join('\n')}`;
    }
    return interaction.followUp({ content: confirmation });
}

// --- BULK DELETE LOADOUTS --- custom_id: modal_loadouts_bulk_remove_{MP|DMZ} Lines are "Weapon" (removes every build of that weapon) or "Weapon | Build Name" (removes just that one build). Dry-run only -- the confirmed delete targets the exact ids collected here rather than re-matching titles at commit time, same reasoning as draws.js/calendar.js's bulk-delete routes.
async function bulkDeleteLoadouts(interaction) {
    const { fuzzyMatch } = require('../../utils/search');
    const { registerBulkDelete } = require('./shared');
    const Loadout = require('../../models/Loadout');
    const mode = interaction.customId.replace('modal_loadouts_bulk_remove_', '');
    const lines = interaction.fields.getTextInputValue('lines').split('\n').map(l => l.trim()).filter(Boolean);

    const toDelete = []; // { label, ids }
    const notFound = [];
    const candidates = await Loadout.find({ mode }).lean();
    for (const line of lines) {
        const [weaponPart, buildPart] = line.split('|').map(p => p?.trim());
        if (!weaponPart) {
            notFound.push(`"${line}" (need at least a weapon name)`);
            continue;
        }
        const match = candidates.find(l => fuzzyMatch(weaponPart, l.weaponName));
        if (!match) {
            notFound.push(`${weaponPart} (${mode})`);
            continue;
        }

        if (buildPart) {
            const buildDoc = candidates.find(l => l.weaponKey === match.weaponKey && l.mode === mode && l.buildName === buildPart);
            if (buildDoc) toDelete.push({ label: `${match.weaponName} (${buildPart})`, ids: [String(buildDoc._id)] });
            else notFound.push(`${weaponPart} | ${mode} | ${buildPart}`);
        } else {
            const docs = candidates.filter(l => l.weaponKey === match.weaponKey && l.mode === mode);
            toDelete.push({ label: `${match.weaponName} (all ${docs.length} build(s))`, ids: docs.map(d => String(d._id)) });
        }
    }

    if (toDelete.length === 0) {
        return interaction.reply({ content: `❌ Nothing matched -- nothing to delete.${notFound.length ? `\n⚠️ Not found: ${notFound.join(', ')}` : ''}`, ephemeral: true });
    }

    const summary = [`Removed: ${toDelete.map(t => t.label).join(', ')}`];
    if (notFound.length) summary.push(`⚠️ Not found: ${notFound.join(', ')}`);
    const ids = toDelete.flatMap(t => t.ids);

    return registerBulkDelete(interaction, {
        description: `Bulk Delete ${mode} Loadouts`,
        summary,
        apply: async () => {
            const result = await commitSet(
                [{ type: 'loadout.bulkDelete', target: { mode }, payload: { ids } }],
                { actorId: interaction.user.id }
            );
            if (!result.ok) throw new Error(result.failures?.[0]?.errors?.join(' ') || result.error);
            return null;   // Undo now lives on /bot analytics' Changes page (core/revert.js) -- no inline undo token.
        }
    });
}

// --- EXPORT UP TO 5 LOADOUTS --- custom_id: modal_loadouts_export5_{MP|DMZ} Read-only -- fuzzy-matches each pasted weapon name (up to 5) against that mode's collection. The real search+multi-select-from-a-list version is deferred future work (see manage-panel.md); this is a working placeholder for the same outcome.
async function exportUpTo5(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { fuzzyMatch } = require('../../utils/search');
    const { formatLoadoutsAsBulkText } = require('../../utils/adminParser');
    const Loadout = require('../../models/Loadout');
    const mode = interaction.customId.replace('modal_loadouts_export5_', '');
    const requested = interaction.fields.getTextInputValue('weapons').split('\n').map(w => w.trim()).filter(Boolean).slice(0, 5);
    const candidates = await Loadout.find({ mode }).lean();

    const matched = [];
    const notFound = [];
    for (const weapon of requested) {
        const hits = candidates.filter(l => fuzzyMatch(weapon, l.weaponName));
        if (hits.length > 0) matched.push(...hits);
        else notFound.push(weapon);
    }

    if (matched.length === 0) {
        return interaction.followUp({ content: `❌ No matches found for: ${requested.join(', ')}` });
    }

    const text = formatLoadoutsAsBulkText(matched);
    let content = `📤 **Exported ${matched.length} ${mode} loadout(s)** in Bulk Add format. Paste this back into the Bulk Add action.`;
    if (notFound.length) content += `\n⚠️ Not found: ${notFound.join(', ')}`;
    const { exportFileReply } = require('../../utils/manageActions');
    return exportFileReply(interaction, content, `${mode.toLowerCase()}_loadouts_export.txt`, text);
}

// --- EXPORT A LOADOUT CATEGORY --- custom_id: modal_loadouts_exportcategory_{MP|DMZ} Read-only.
async function exportCategory(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { formatLoadoutsAsBulkText } = require('../../utils/adminParser');
    const Loadout = require('../../models/Loadout');
    const mode = interaction.customId.replace('modal_loadouts_exportcategory_', '');
    const category = interaction.fields.getTextInputValue('category').trim().toUpperCase();
    const loadouts = await Loadout.find({ mode, category }).lean();

    if (loadouts.length === 0) {
        return interaction.followUp({ content: `❌ No ${mode} loadouts found in category "${category}".` });
    }

    const text = formatLoadoutsAsBulkText(loadouts);
    const { exportFileReply } = require('../../utils/manageActions');
    return exportFileReply(
        interaction,
        `📤 **Exported ${loadouts.length} ${mode} ${category} loadout(s)** in Bulk Add format. Paste this back into the Bulk Add action.`,
        `${mode.toLowerCase()}_${category.toLowerCase()}_loadouts_export.txt`,
        text
    );
}

// --- DELETE (loadouts) --- called from index.js's mng_delconfirm_ dispatch with the resolved match.
async function deleteItem(match, actorId) {
    const result = await commitSet([{ type: 'loadout.delete', target: { id: match.id } }], { actorId });
    if (!result.ok) throw new Error(result.failures?.[0]?.errors?.join(' ') || result.error);
    return null;   // Undo now lives on /bot analytics' Changes page (core/revert.js) -- no inline undo token.
}

module.exports = { editLoadout, addLoadout, bulkAddLoadouts, bulkDeleteLoadouts, exportUpTo5, exportCategory, deleteItem };
