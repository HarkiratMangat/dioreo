// ==========================================
// /manage — LOADOUTS PAGES (MP + DMZ)
// ==========================================
// Every DB-mutating operation the Loadouts pages reach: single add/edit, bulk add/replace/delete,
// and the two export flows. MP and DMZ share this one file (same as manageActions.js's
// loadoutsActions() factory) since they're structurally identical pages differing only in `mode`,
// carried on the custom_id suffix (`add_loadout_MP`, `modal_loadouts_bulk_add_DMZ`, etc.). Split out
// of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/
// 2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js.
//
// ⚠️ NO PURGE HERE, DELIBERATELY -- Loadouts has no Purge button at all (see
// .claude/rules/manage-panel.md). Only draws.js/calendar.js/patchnotes.js export a purge().
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and
// .claude/rules/interaction-router.md.

const { recordChange } = require('../../utils/changeStore');
const { registerUndo } = require('./shared');

// --- SAVE EDITED LOADOUT --- custom_id: edit_loadout_{id}
async function editLoadout(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseLoadoutBadges } = require('../../utils/adminParser');
    const { checkImageExists } = require('../../utils/loadoutRender');
    const Loadout = require('../../models/Loadout');
    const targetId = interaction.customId.replace('edit_loadout_', '');

    // Field is "Category | Badges" (2 segments) -- Mode is not editable through this modal at all
    // (MP/DMZ are separate panel pages, so there's no "move a loadout to the other mode" action);
    // it's read straight off the existing document instead.
    const existingLoadout = await Loadout.findById(targetId).lean();
    const metaParts = interaction.fields.getTextInputValue('meta').split('|').map(s => s.trim());
    const attachmentsArray = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);
    let { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized } = parseLoadoutBadges(metaParts[1]);

    // Slot labels (Muzzle/Barrel/...) only ever come from /autobuild's vision extraction, so this
    // plain-text modal can't supply new ones -- the best it can do is KEEP the existing mapping, and
    // only when it's still valid: valid only if the attachment list is byte-for-byte unchanged (same
    // length + same names in the same order); any real content/order change invalidates slot
    // identity, so it's cleared rather than carried forward misaligned onto the wrong attachment.
    const existingAttachments = existingLoadout?.attachments || [];
    const attachmentsUnchanged = attachmentsArray.length === existingAttachments.length
        && attachmentsArray.every((a, i) => a === existingAttachments[i]);
    const attachmentSlots = attachmentsUnchanged ? (existingLoadout?.attachmentSlots || []) : [];

    const weaponName = interaction.fields.getTextInputValue('weapon');
    const weaponKey = weaponName.toLowerCase().replace(/\s+/g, '');
    const buildName = interaction.fields.getTextInputValue('build');
    const mode = existingLoadout?.mode || 'MP';

    // DMZ never uses the per-category Best/TopN system -- a bare "best"/"topN" token (no
    // -close/-midlong suffix) still parses into categoryRank since the parser doesn't know the mode,
    // so move it over to dmzRangeRank here instead.
    if (mode === 'DMZ' && categoryRank && !dmzRangeRank) {
        dmzRangeRank = categoryRank;
        categoryRank = null;
    }

    const imageKey = interaction.fields.getTextInputValue('image');

    await Loadout.findByIdAndUpdate(targetId, {
        weaponName,
        weaponKey,
        buildName,
        attachments: attachmentsArray,
        attachmentSlots,
        imageKey,
        category: metaParts[0]?.toUpperCase() || 'AR',
        mode,
        isMeta,
        categoryRank,
        dmzRangeRank,
        isToxic
    });

    // Badges describe the WEAPON, not one specific build variant -- propagate the same badges to
    // every other build sharing this weaponKey+mode. Only done on edit (not on creating a brand-new
    // build) -- the add-loadout modal has no badges pre-filled, so propagating from there would
    // silently wipe existing siblings' badges any time a new build is added without retyping them.
    const propagateResult = await Loadout.updateMany(
        { weaponKey, mode, _id: { $ne: targetId } },
        { isMeta, categoryRank, dmzRangeRank, isToxic }
    );

    // Keep Cloudinary structured metadata in sync -- re-sync this build AND every sibling, since
    // badges are weapon-level and may have just propagated. Best-effort, never throws. Each sibling
    // now carries its OWN persisted attachmentSlots -- pass it through so per-slot fields actually
    // re-sync when valid, instead of unconditionally skipping them.
    const { syncLoadoutMetadata } = require('../../utils/loadoutImageCache');
    for (const sib of await Loadout.find({ weaponKey, mode })) await syncLoadoutMetadata(sib, sib.attachmentSlots);

    recordChange({ actorId: interaction.user.id, page: mode === 'MP' ? 'loadouts_mp' : 'loadouts_dmz', action: 'edit', model: 'Loadout', target: `${weaponName} (${buildName})`, summary: `Edited loadout "${weaponName} (${buildName})"` });
    let confirmation = `✅ **Loadout Updated Successfully!** ${weaponName} (${buildName})`;
    if (propagateResult.modifiedCount > 0) {
        confirmation += `\n-# Badges also synced to ${propagateResult.modifiedCount} other build(s) of this weapon.`;
    }
    if (unrecognized.length > 0) {
        confirmation += `\n⚠️ Badge input not recognized and ignored: \`${unrecognized.join(', ')}\`. Valid options: \`meta\`, \`best\`, \`toxic\`, \`topN\` (e.g. \`top3\`), or a DMZ range badge (\`bestclose\`, \`bestmidlong\`, \`top3close\`, \`top5midlong\`).`;
    }
    // Real Cloudinary existence check -- catches the exact silent-failure mode where a mismatched
    // key saves fine and only shows up as a broken card image later. Advisory only -- never blocks
    // the save, which already happened above.
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
    const Loadout = require('../../models/Loadout');
    const pageMode = interaction.customId.replace('add_loadout_', '');

    // Field is "Category | Badges" (2 segments) -- Mode has no modal field since the Add button
    // itself is already MP/DMZ-scoped by which page it's on.
    const metaParts = interaction.fields.getTextInputValue('meta').split('|').map(s => s.trim());
    const attachmentsArray = interaction.fields.getTextInputValue('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);
    // Unlike editLoadout above, this does NOT propagate badges to sibling builds of the same weapon
    // -- this modal has nothing pre-filled, so a blank badges field here (the common case when just
    // adding another build variant) would silently wipe any badges already set on the weapon's
    // existing builds. Re-editing an existing build is the supported way to (re)sync badges.
    let { isMeta, categoryRank, dmzRangeRank, isToxic, unrecognized } = parseLoadoutBadges(metaParts[1]);
    if (pageMode === 'DMZ' && categoryRank && !dmzRangeRank) {
        dmzRangeRank = categoryRank;
        categoryRank = null;
    }

    const imageKey = interaction.fields.getTextInputValue('image');

    const newLoadout = new Loadout({
        weaponName: interaction.fields.getTextInputValue('weapon'),
        weaponKey: interaction.fields.getTextInputValue('weapon').toLowerCase().replace(/\s+/g, ''),
        buildName: interaction.fields.getTextInputValue('build'),
        attachments: attachmentsArray,
        imageKey,
        category: metaParts[0]?.toUpperCase() || 'AR',
        mode: pageMode,
        isMeta,
        categoryRank,
        dmzRangeRank,
        isToxic
    });

    await newLoadout.save();
    recordChange({ actorId: interaction.user.id, page: pageMode === 'MP' ? 'loadouts_mp' : 'loadouts_dmz', action: 'add', model: 'Loadout', target: `${newLoadout.weaponName} (${newLoadout.buildName})`, summary: `Added loadout "${newLoadout.weaponName} (${newLoadout.buildName})"` });
    // Sync Cloudinary structured metadata for the new build. Best-effort: if the admin hasn't
    // uploaded the image to that key yet, the asset doesn't exist and this is a silent no-op (the
    // metadata gets set on the next edit once the image is there). No slot data (only /autobuild has
    // it). No badge propagation on ADD (see the note above), so only this one build is synced.
    await require('../../utils/loadoutImageCache').syncLoadoutMetadata(newLoadout);
    let confirmation = `✅ **Successfully saved Loadout: ${newLoadout.weaponName} (${newLoadout.buildName}, ${newLoadout.mode})!**`;
    if (unrecognized.length > 0) {
        confirmation += `\n⚠️ Badge input not recognized and ignored: \`${unrecognized.join(', ')}\`. Valid options: \`meta\`, \`best\`, \`toxic\`, \`topN\` (e.g. \`top3\`), or a DMZ range badge (\`bestclose\`, \`bestmidlong\`, \`top3close\`, \`top5midlong\`).`;
    }
    if (!(await checkImageExists(imageKey))) {
        confirmation += `\n⚠️ **Heads up:** no image found on Cloudinary at key \`${imageKey}\` -- the card will show broken until an image with that exact Public ID is uploaded there.`;
    }
    return interaction.followUp({ content: confirmation });
}

// --- BULK ADD/REPLACE LOADOUTS (upsert, never wholesale-replaces) --- custom_id:
// modal_loadouts_bulk_add_{MP|DMZ}. "Replace" also routes into this exact modal/handler (see
// manageActions.js's comment on why). Unlike the draws/calendar bulk routes, this NEVER
// wholesale-replaces the Loadout collection -- that would wipe every loadout in the database. Each
// parsed block upserts by {weaponKey, mode, buildName}. `pageMode` force-overrides every parsed
// entry's mode regardless of what's typed in the pasted text's Mode field -- the page already
// scopes it, this just guards against a stray mismatched value silently filing a loadout under the
// wrong page.
async function bulkAddLoadouts(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { parseBulkLoadoutList } = require('../../utils/adminParser');
    const { checkImageExists } = require('../../utils/loadoutRender');
    const Loadout = require('../../models/Loadout');
    const pageMode = interaction.customId.replace('modal_loadouts_bulk_add_', '');
    const bulkText = interaction.fields.getTextInputValue('bulk_text');
    const { parsed, errors } = parseBulkLoadoutList(bulkText);

    let created = 0;
    let updated = 0;
    const missingImages = []; // { label, imageKey }
    const touchedKeys = new Set(); // weaponKeys to re-sync Cloudinary metadata for after the loop
    for (const rawEntry of parsed) {
        const entry = { ...rawEntry, mode: pageMode };
        const { weaponKey, mode, buildName, imageKey } = entry;
        touchedKeys.add(weaponKey);
        const existing = await Loadout.findOne({ weaponKey, mode, buildName });
        if (existing) {
            await Loadout.updateOne({ _id: existing._id }, entry);
            updated++;
        } else {
            await new Loadout(entry).save();
            created++;
        }
        // Weapon-level badges sync across every other build sharing this weaponKey+mode -- same
        // reasoning as editLoadout above.
        await Loadout.updateMany(
            { weaponKey, mode, buildName: { $ne: buildName } },
            { isMeta: entry.isMeta, categoryRank: entry.categoryRank, dmzRangeRank: entry.dmzRangeRank, isToxic: entry.isToxic }
        );
        if (!(await checkImageExists(imageKey))) missingImages.push({ label: `${entry.weaponName} (${buildName})`, imageKey });
    }

    // Synced once per weaponKey after the loop (not per-block) so a paste with several builds of one
    // weapon doesn't re-sync the same siblings repeatedly. Best-effort, never throws.
    const { syncLoadoutMetadata } = require('../../utils/loadoutImageCache');
    for (const wk of touchedKeys) {
        for (const b of await Loadout.find({ weaponKey: wk, mode: pageMode })) await syncLoadoutMetadata(b);
    }

    recordChange({ actorId: interaction.user.id, page: pageMode === 'MP' ? 'loadouts_mp' : 'loadouts_dmz', action: 'bulkAdd', model: 'Loadout', target: `${pageMode} Loadouts`, summary: `Bulk import ${pageMode} loadouts`, detail: `${created} created, ${updated} updated` });
    let confirmation = `✅ **Bulk Loadout Import Complete!**\n${created} new build(s) added, ${updated} existing build(s) updated.`;
    if (errors.length > 0) {
        confirmation += `\n⚠️ ${errors.length} block(s) skipped:\n${errors.map(e => `- ${e}`).join('\n')}`;
    }
    if (missingImages.length > 0) {
        confirmation += `\n⚠️ No Cloudinary image found for ${missingImages.length} build(s) -- these will show broken until uploaded there with the exact Public ID typed:\n${missingImages.map(m => `- ${m.label}: \`${m.imageKey}\``).join('\n')}`;
    }
    return interaction.followUp({ content: confirmation });
}

// --- BULK DELETE LOADOUTS --- custom_id: modal_loadouts_bulk_remove_{MP|DMZ}
// Lines are "Weapon" (removes every build of that weapon) or "Weapon | Build Name" (removes just
// that one build). Dry-run only -- the actual deleteOne/deleteMany calls happen from index.js's
// mng_bulkdelconfirm_ dispatch via the apply() closure stashed here.
async function bulkDeleteLoadouts(interaction) {
    const { fuzzyMatch } = require('../../utils/search');
    const { randomUUID } = require('crypto');
    const { pendingBulkDeletes } = require('./shared');
    const Loadout = require('../../models/Loadout');
    const mode = interaction.customId.replace('modal_loadouts_bulk_remove_', '');
    const lines = interaction.fields.getTextInputValue('lines').split('\n').map(l => l.trim()).filter(Boolean);

    const toDelete = []; // { weaponKey, buildName?, label, docs (for undo) }
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
            if (buildDoc) toDelete.push({ weaponKey: match.weaponKey, buildName: buildPart, label: `${match.weaponName} (${buildPart})`, docs: [buildDoc] });
            else notFound.push(`${weaponPart} | ${mode} | ${buildPart}`);
        } else {
            const docs = candidates.filter(l => l.weaponKey === match.weaponKey && l.mode === mode);
            toDelete.push({ weaponKey: match.weaponKey, buildName: null, label: `${match.weaponName} (all ${docs.length} build(s))`, docs });
        }
    }

    if (toDelete.length === 0) {
        return interaction.reply({ content: `❌ Nothing matched -- nothing to delete.${notFound.length ? `\n⚠️ Not found: ${notFound.join(', ')}` : ''}`, ephemeral: true });
    }

    const summary = [`Removed: ${toDelete.map(t => t.label).join(', ')}`];
    if (notFound.length) summary.push(`⚠️ Not found: ${notFound.join(', ')}`);

    const token = randomUUID().slice(0, 8);
    pendingBulkDeletes.set(token, {
        description: `Bulk Delete ${mode} Loadouts`,
        summary,
        apply: async () => {
            for (const entry of toDelete) {
                if (entry.buildName) await Loadout.deleteOne({ weaponKey: entry.weaponKey, mode, buildName: entry.buildName });
                else await Loadout.deleteMany({ weaponKey: entry.weaponKey, mode });
            }
            recordChange({ actorId: interaction.user.id, page: mode === 'MP' ? 'loadouts_mp' : 'loadouts_dmz', action: 'bulkDelete', model: 'Loadout', target: `${mode} Loadouts`, summary: `Bulk delete ${mode} loadouts`, detail: summary.join(' | ') });
            return registerUndo(`Bulk Delete ${mode} Loadouts`, async () => {
                const restoreDocs = toDelete.flatMap(t => t.docs).map(d => { const c = { ...d }; delete c._id; return c; });
                if (restoreDocs.length) await Loadout.insertMany(restoreDocs);
            });
        }
    });
    setTimeout(() => pendingBulkDeletes.delete(token), 10 * 60 * 1000).unref();

    return interaction.reply({
        content: `⚠️ **Confirm Bulk Delete?**\n${summary.join('\n')}`,
        components: [{
            type: 1, components: [
                { type: 2, style: 4, label: 'Yes, Delete', custom_id: `mng_bulkdelconfirm_${token}` },
                { type: 2, style: 2, label: 'Cancel', custom_id: `mng_bulkdelcancel_${token}` }
            ]
        }],
        ephemeral: true
    });
}

// --- EXPORT UP TO 5 LOADOUTS --- custom_id: modal_loadouts_export5_{MP|DMZ}
// Fuzzy-matches each pasted weapon name (up to 5) against that mode's collection -- the real
// search+multi-select-from-a-list version is deferred future work (see manage-panel.md); this is a
// working placeholder for the same outcome.
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
    return interaction.followUp({ content, files: [{ attachment: Buffer.from(text, 'utf-8'), name: `${mode.toLowerCase()}_loadouts_export.txt` }] });
}

// --- EXPORT A LOADOUT CATEGORY --- custom_id: modal_loadouts_exportcategory_{MP|DMZ}
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
    return interaction.followUp({
        content: `📤 **Exported ${loadouts.length} ${mode} ${category} loadout(s)** in Bulk Add format. Paste this back into the Bulk Add action.`,
        files: [{ attachment: Buffer.from(text, 'utf-8'), name: `${mode.toLowerCase()}_${category.toLowerCase()}_loadouts_export.txt` }]
    });
}

// --- DELETE (loadouts) --- called from index.js's mng_delconfirm_ dispatch with the resolved match.
async function deleteItem(match, actorId) {
    const Loadout = require('../../models/Loadout');
    const removedDoc = match.doc;
    await Loadout.findByIdAndDelete(match.id);
    recordChange({ actorId, page: removedDoc.mode === 'MP' ? 'loadouts_mp' : 'loadouts_dmz', action: 'delete', model: 'Loadout', target: match.label, summary: `Deleted loadout "${match.label}"` });
    return registerUndo(`Delete loadout "${match.label}"`, async () => {
        const restoreDoc = { ...removedDoc };
        delete restoreDoc._id; // let Mongo assign a fresh _id on re-insert
        await Loadout.create(restoreDoc);
    });
}

module.exports = { editLoadout, addLoadout, bulkAddLoadouts, bulkDeleteLoadouts, exportUpTo5, exportCategory, deleteItem };
