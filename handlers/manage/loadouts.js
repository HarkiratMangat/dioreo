// ==========================================
// /manage — LOADOUTS PAGES (MP + DMZ)
// ==========================================
// Every DB-mutating operation the Loadouts pages reach: single add/edit, bulk add/replace/delete, and the two export flows. MP and DMZ share this one file (same as manageActions.js's loadoutsActions() factory) since they're structurally identical pages differing only in `mode`, carried on the custom_id suffix (`add_loadout_MP`, `modal_loadouts_bulk_add_DMZ`, etc.). Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js.
//
// ⚠️ NO PURGE HERE, DELIBERATELY -- Loadouts has no Purge button at all (see .claude/rules/manage-panel.md). Only draws.js/calendar.js/patchnotes.js export a purge().
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and .claude/rules/interaction-router.md.
//
// ⚠️ MUTATIONS ROUTE THROUGH THE OPERATION CORE (core/changeset.js's commitSet), as of plan 2 Task 3 (2026-08-21 13:01 EDT). Badge parsing (utils/adminParser.js's parseLoadoutBadges) and the DMZ categoryRank->dmzRangeRank swap stay HERE, same as before -- the op expects already-parsed badge fields, not raw modal text. Cloudinary structured-metadata sync and the attachmentSlots byte-identity check moved INTO core/ops/loadouts.js's apply() (badge propagation to sibling builds lived there too until 2026-10-19, when every badge became per build) (see that file's own header for the real defects found integrating this: weaponKey must be a plain normalize, not /autobuild's auto-namer; "Add"/"Replace Multiple" share ONE upsert body since there is no wholesale-replace for loadouts; a shareCode key must be OMITTED entirely on edit or it silently wipes an /autobuild-set gunsmith code). Undo now lives on /bot analytics' Changes page (core/revert.js) -- the old in-memory Undo button is GONE from every mutation here (see handlers/manage/shared.js's own header for where it used to live). Export flows (exportUpTo5/exportCategory) are read-only and untouched.

const BOT_EMOJI = require('../../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { commitSet } = require('../../core/changeset');
const { extractCommitError } = require('./shared');
const { failWithRetry } = require('./retry');

// The build name's own cap (plan pins batch 2 §10.4 G6 row 2, 2026-09-15 00:28 EDT): 32 characters, what the portal's plate shows in two lines with the widest letters. The modal field is capped at 47 as a whole; this refuses a longer NAME part with a message naming the limit, and never truncates it silently.
const BUILD_NAME_MAX = 32;

// --- IMAGE FIELD: Public ID *or* a pasted URL --- (2026-08-22, deferred item "MP/DMZ Loadout: no way to provide an image by URL") Every other image-bearing entity (draws/calendar/patch-notes) already accepts a raw URL and re-hosts it to Cloudinary; loadouts alone required the admin to have uploaded the file and to know the exact Public ID convention BEFORE opening the modal -- the one field in that modal depending on a step outside the bot. This closes that gap without spending a 6th modal slot (Discord's hard cap is 5 and the modal already uses all 5): the SAME field takes either form, told apart by the URL scheme.
//
// `existingKey` is what makes Edit safe. Harkirat's ask was to replace the picture while KEEPING the same public_id so nothing referencing the key breaks -- uploadLoadoutImage passes `overwrite: true, invalidate: true`, so re-uploading at the existing key is exactly that, and the stored imageKey never changes.
//
// A FAILED upload does not fail the save: the raw URL is stored as the imageKey instead. That is a supported state, not a fudge -- utils/loadoutRender.js's buildImageUrl passes an `http`-prefixed imageKey straight through as the card's image URL (it exists for the originally-imgur-hosted LOCUS rows) -- and it mirrors utils/cloudinaryCache.js's resolveThumbnail, which falls back to the raw URL for the same reason so a draw still saves when Cloudinary is unreachable or a dev instance is write-blocked.
async function resolveImageInput({ raw, weaponName, mode, existingKey = null }) {
    const { isHttpImageSource, deriveImageKey, uploadLoadoutImage } = require('../../utils/loadoutImageCache');
    const value = (raw || '').trim();
    if (!isHttpImageSource(value)) return { imageKey: value, uploaded: false, note: null };

    const Loadout = require('../../models/Loadout');
    let imageKey = existingKey && !isHttpImageSource(existingKey) && !String(existingKey).startsWith('PENDING-UPLOAD-')
        ? existingKey
        : null;
    if (!imageKey) {
        // Only the keys that could actually collide with the one about to be minted -- a full-collection scan would work too, but this stays correct as the collection grows.
        const base = String(weaponName || '').trim().toUpperCase().replace(/\s+/g, '-').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const taken = await Loadout.find({ imageKey: new RegExp(`^(DMZ-)?${base}-\\d+$`, 'i') }).select('imageKey').lean();
        imageKey = deriveImageKey(weaponName, mode, taken.map(t => t.imageKey));
    }

    const result = await uploadLoadoutImage(value, imageKey);
    if (!result.success) {
        return { imageKey: value, uploaded: false,
                 note: `\n${BOT_EMOJI.warn} Couldn't upload that image to Cloudinary (${result.error}) -- the raw URL was saved as the image instead, so the card still renders but the image isn't re-hosted.` };
    }
    return { imageKey, uploaded: true,
             note: existingKey === imageKey
                 ? `\n-# 🖼️ Image replaced on Cloudinary at the same key \`${imageKey}\` -- nothing referencing that key changed.`
                 : `\n-# 🖼️ Image uploaded to Cloudinary as \`${imageKey}\`.` };
}

// --- CATALOGUE WARNING (Harkirat, 2026-10-19 16:13 EDT: "warn. but if warn, allow a confirm overwrite or a go back to edit") --- A save that meets a weapon or attachment name the catalogue does not know stops before anything is written and says so, privately, with two buttons: Save anyway (saves it as typed AND adds the names to the catalogue in the same changeset, so they never warn again) and Back to edit (reopens the same box with everything typed). What was typed waits here for 30 minutes; nothing stores it anywhere else.
const { findUnknownNames, learnItems, describeUnknown, normKey } = require('../../utils/catalogue');
const LOADOUT_FIELDS = ['weapon', 'build', 'attachments', 'image', 'meta'];
const PENDING_MS = 30 * 60 * 1000;
const pendingCatalogue = new Map(); // token -> { customId, values, userId }

const fieldReader = (interaction, preset) => (k) => preset ? (preset.values[k] ?? '') : interaction.fields.getTextInputValue(k);
const readValues = (field, ids) => Object.fromEntries(ids.map(id => [id, field(id)]));
// A replay comes from a button, which failWithRetry's modal rebuild cannot answer; it gets a plain private note instead.
const failer = (interaction, preset) => (msg) => preset
    ? interaction.followUp({ content: `${BOT_EMOJI.cross} ${msg}`, ephemeral: true })
    : failWithRetry(interaction, msg);
const learnOps = (unknown, { category, mode }) => unknown.count
    ? [{ type: 'catalogue.learn', payload: { items: learnItems(unknown, { category }), mode } }]
    : [];

async function warnUnknownNames(interaction, pending, unknown) {
    const token = require('crypto').randomBytes(6).toString('hex');
    pendingCatalogue.set(token, { ...pending, userId: interaction.user.id });
    setTimeout(() => pendingCatalogue.delete(token), PENDING_MS).unref();
    return interaction.followUp({
        content: `${BOT_EMOJI.warn} **Not in the catalogue yet:** ${describeUnknown(unknown)}\n-# A typo, or a new item? **Save anyway** saves it as typed and adds these names, so they won't warn again. **Back to edit** reopens the box with what you typed.`,
        components: [{ type: 1, components: [
            { type: 2, style: 3, label: 'Save anyway', custom_id: `mng_catok|${token}` },
            { type: 2, style: 2, label: 'Back to edit', custom_id: `mng_catedit|${token}` }
        ] }],
        ephemeral: true
    });
}

// custom_ids: mng_catok|{token} · mng_catedit|{token}. Only the admin who submitted may press them; the router's /manage admin lock has already run.
async function handleCatalogueWarning(interaction) {
    const [kind, token] = interaction.customId.split('|');
    const pending = pendingCatalogue.get(token);
    if (!pending) return await interaction.reply({ content: '⏳ That save expired. Open it again from /manage.', ephemeral: true });
    if (pending.userId !== interaction.user.id) return await interaction.reply({ content: BOT_EMOJI.cross + ' Only the admin who made this save can finish it.', ephemeral: true });
    const manage = require('../../commands/manage');
    const { customId } = pending;

    if (kind === 'mng_catedit') {
        let modal;
        if (customId.startsWith('add_loadout_')) modal = manage.buildAddLoadoutModal(customId.replace('add_loadout_', ''));
        else if (customId.startsWith('modal_loadouts_bulk_add_')) modal = manage.buildLoadoutsBulkAddModal(customId.replace('modal_loadouts_bulk_add_', ''));
        else {
            const Loadout = require('../../models/Loadout');
            const id = customId.replace('edit_loadout_', '');
            const current = await Loadout.findById(id).lean();
            if (!current) return await interaction.reply({ content: BOT_EMOJI.cross + ' That build no longer exists -- it may have been deleted or edited elsewhere. Search again.', ephemeral: true });
            modal = manage.buildEditLoadoutModal(current, id);
        }
        return await interaction.showModal(manage.prefillModal(modal, pending.values));
    }

    pendingCatalogue.delete(token);
    await interaction.update({ content: '⏳ Saving it as typed, and adding the new names…', components: [] });
    const preset = { customId, values: pending.values };
    if (customId.startsWith('add_loadout_')) return await addLoadout(interaction, preset);
    if (customId.startsWith('modal_loadouts_bulk_add_')) return await bulkAddLoadouts(interaction, preset);
    return await editLoadout(interaction, preset);
}

// The badge lines under an add or edit confirmation: tokens that matched nothing, then tokens that were understood but changed or left off (top4 read as top5, Ass beside a tier, a rank mode on DMZ), each with its reason.
function badgeNotes(unrecognized, warnings) {
    let out = '';
    if (unrecognized.length > 0) {
        out += `\n${BOT_EMOJI.warn} Badge input not recognized and ignored: \`${unrecognized.join(', ')}\`. Valid options: \`meta\`, \`toxic\`, \`ass\`, \`best\`, \`top3\`, \`top5\`, \`capable\`, a rank mode (\`hp\`, \`s&d\`, \`dom\`, \`tdm\`, \`ftl\`, \`control\`; MP only), or a DMZ range badge (\`bestclose\`, \`top3midlong\`, \`capableclose\`).`;
    }
    for (const w of warnings) out += `\n${BOT_EMOJI.warn} ${w}`;
    return out;
}

// --- SAVE EDITED LOADOUT --- custom_id: edit_loadout_{id}. `preset` is a Save anyway replay (handleCatalogueWarning below): the typed values come from the warning's pending store instead of a modal, and the catalogue check is skipped because the admin already saw it.
async function editLoadout(interaction, preset = null) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });
    const { parseLoadoutBadges } = require('../../utils/adminParser');
    const { checkImageExists } = require('../../utils/loadoutRender');
    const Loadout = require('../../models/Loadout');
    const field = fieldReader(interaction, preset);
    const customId = preset ? preset.customId : interaction.customId;
    const fail = failer(interaction, preset);
    const targetId = customId.replace('edit_loadout_', '');

    // Mode is not editable through this modal at all (MP/DMZ are separate panel pages) -- read straight off the existing document, same as before the refactor.
    const existingLoadout = await Loadout.findById(targetId).lean();
    // A stale search result (the build was deleted/edited elsewhere between the search modal and this submit) still needs a reply -- deferReply() already ran above, so a bare `return` here leaves the interaction "thinking..." until the token expires. The pre-core handler always replied on this path too (confirmed via git history); a prior comment here claiming otherwise was wrong.
    if (!existingLoadout) return await interaction.followUp({ content: BOT_EMOJI.cross + ' That build no longer exists -- it may have been deleted or edited elsewhere. Search again.' });
    const mode = existingLoadout.mode || 'MP';

    // Field is "Category | Badges" (2 segments).
    const metaParts = field('meta').split('|').map(s => s.trim());
    const attachmentsArray = field('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);
    let { isMeta, categoryRank, dmzRangeRank, isToxic, isAss, rankModes, unrecognized, warnings } = parseLoadoutBadges(metaParts[1], mode);

    // DMZ never uses the per-category Best/TopN system -- a bare "best"/"topN" token (no -close/-midlong suffix) still parses into categoryRank since the parser doesn't know the mode, so move it over to dmzRangeRank here instead.
    if (mode === 'DMZ' && categoryRank && !dmzRangeRank) {
        dmzRangeRank = categoryRank;
        categoryRank = null;
    }

    const weaponName = field('weapon');
    // "Build Name | Share Code" -- pipe optional. No `|` at all omits shareCode from the payload entirely (preserves whatever's already saved, e.g. an /autobuild-set code); `|` with an empty tail explicitly clears it to ''; `|` with real text sets it (core/ops/loadouts.js normalizes via correctGunsmithCode()).
    const buildRaw = field('build');
    const buildPipeIndex = buildRaw.indexOf('|');
    const buildName = (buildPipeIndex === -1 ? buildRaw : buildRaw.slice(0, buildPipeIndex)).trim();
    if (buildName.length > BUILD_NAME_MAX) {
        return await fail(`A build name can be at most ${BUILD_NAME_MAX} characters — this one is ${buildName.length}. Shorten it and submit again.`);
    }
    // Checked BEFORE the image step, so Back to edit never leaves an uploaded image behind a build that was not saved.
    const unknown = await findUnknownNames({ weaponName, attachments: attachmentsArray });
    if (unknown.count && !preset) return await warnUnknownNames(interaction, { customId, values: readValues(field, LOADOUT_FIELDS) }, unknown);
    const hasShareCodeSegment = buildPipeIndex !== -1;
    const shareCodeInput = hasShareCodeSegment ? buildRaw.slice(buildPipeIndex + 1).trim() : null;
    const image = await resolveImageInput({
        raw: field('image'),
        weaponName, mode, existingKey: existingLoadout.imageKey
    });
    const imageKey = image.imageKey;

    const result = await commitSet(
        [{ type: 'loadout.edit', target: { id: targetId },
           payload: { weaponName, buildName, mode, attachments: attachmentsArray, imageKey,
                      category: metaParts[0], isMeta, categoryRank, dmzRangeRank, isToxic, isAss, rankModes,
                      ...(hasShareCodeSegment ? { shareCode: shareCodeInput } : {}) } },
         ...learnOps(unknown, { category: metaParts[0], mode })],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        return await fail(extractCommitError(result));
    }

    let confirmation = `${BOT_EMOJI.checkmark} **Loadout Updated Successfully!** ${weaponName} (${buildName})`;
    if (image.note) confirmation += image.note;
    if (unknown.count) confirmation += `\n-# Added to the catalogue: ${describeUnknown(unknown)}.`;
    // States what happened to the Share Code explicitly (sequential-thinking audit finding, 2026-08-22 20:15 EDT) -- the omit/clear/set distinction is exactly the kind of non-obvious field behavior this session's other confirmation-message additions exist to surface, and this field in particular can silently wipe an /autobuild-set code if a future edit gets this wrong.
    if (hasShareCodeSegment) {
        confirmation += shareCodeInput ? `\n-# Share Code: set to \`${shareCodeInput}\`.` : '\n-# Share Code: cleared.';
    } else if (existingLoadout.shareCode) {
        confirmation += `\n-# Share Code: unchanged (\`${existingLoadout.shareCode}\` preserved).`;
    }
    confirmation += badgeNotes(unrecognized, warnings);
    // Real Cloudinary existence check -- catches the exact silent-failure mode where a mismatched key saves fine and only shows up as a broken card image later. Advisory only -- never blocks the save, which already happened above. Skipped when this submission just uploaded the image itself -- the HEAD probe would be racing Cloudinary's own CDN propagation and could report a freshly-uploaded asset as missing.
    if (!image.uploaded && !(await checkImageExists(imageKey))) {
        confirmation += `\n${BOT_EMOJI.warn} **Heads up:** no image found on Cloudinary at key \`${imageKey}\` -- the card will show broken until an image with that exact Public ID is uploaded there.`;
    }

    return interaction.followUp({ content: confirmation });
}

// --- SAVE NEW SINGLE LOADOUT --- custom_id: add_loadout_{MP|DMZ}. `preset`: see editLoadout.
async function addLoadout(interaction, preset = null) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });
    const { parseLoadoutBadges } = require('../../utils/adminParser');
    const { checkImageExists } = require('../../utils/loadoutRender');
    const field = fieldReader(interaction, preset);
    const customId = preset ? preset.customId : interaction.customId;
    const fail = failer(interaction, preset);
    const pageMode = customId.replace('add_loadout_', '');

    // Field is "Category | Badges" (2 segments) -- Mode has no modal field since the Add button itself is already MP/DMZ-scoped by which page it's on.
    const metaParts = field('meta').split('|').map(s => s.trim());
    const attachmentsArray = field('attachments').split('\n').map(s => s.trim()).filter(s => s.length > 0);
    // Badges are per build (Harkirat, 2026-10-19 15:59 EDT): what is typed here lands on this new build only, and the weapon's other builds keep their own.
    let { isMeta, categoryRank, dmzRangeRank, isToxic, isAss, rankModes, unrecognized, warnings } = parseLoadoutBadges(metaParts[1], pageMode);
    if (pageMode === 'DMZ' && categoryRank && !dmzRangeRank) {
        dmzRangeRank = categoryRank;
        categoryRank = null;
    }

    const weaponName = field('weapon');
    // Same "Build Name | Share Code" convention as editLoadout -- see that function's comment.
    const buildRaw = field('build');
    const buildPipeIndex = buildRaw.indexOf('|');
    const buildName = (buildPipeIndex === -1 ? buildRaw : buildRaw.slice(0, buildPipeIndex)).trim();
    if (buildName.length > BUILD_NAME_MAX) {
        return await fail(`A build name can be at most ${BUILD_NAME_MAX} characters — this one is ${buildName.length}. Shorten it and submit again.`);
    }
    const unknown = await findUnknownNames({ weaponName, attachments: attachmentsArray });
    if (unknown.count && !preset) return await warnUnknownNames(interaction, { customId, values: readValues(field, LOADOUT_FIELDS) }, unknown);
    const hasShareCodeSegment = buildPipeIndex !== -1;
    const shareCodeInput = hasShareCodeSegment ? buildRaw.slice(buildPipeIndex + 1).trim() : null;
    const image = await resolveImageInput({
        raw: field('image'),
        weaponName, mode: pageMode
    });
    const imageKey = image.imageKey;

    const result = await commitSet(
        [{ type: 'loadout.add',
           payload: { weaponName, buildName, mode: pageMode, attachments: attachmentsArray, imageKey,
                      category: metaParts[0], isMeta, categoryRank, dmzRangeRank, isToxic, isAss, rankModes,
                      ...(hasShareCodeSegment ? { shareCode: shareCodeInput } : {}) } },
         ...learnOps(unknown, { category: metaParts[0], mode: pageMode })],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        return await fail(extractCommitError(result));
    }

    let confirmation = `${BOT_EMOJI.checkmark} **Successfully saved Loadout: ${weaponName} (${buildName}, ${pageMode})!**`;
    if (image.note) confirmation += image.note;
    if (unknown.count) confirmation += `\n-# Added to the catalogue: ${describeUnknown(unknown)}.`;
    // Only worth a line when a code was actually typed -- unlike editLoadout there's no prior state to report on a brand-new build, so staying silent when the field was left as a bare build name (the common case) avoids cluttering every single Add confirmation with a non-event.
    if (hasShareCodeSegment && shareCodeInput) {
        confirmation += `\n-# Share Code: \`${shareCodeInput}\`.`;
    }
    confirmation += badgeNotes(unrecognized, warnings);
    // Skipped when this submission just uploaded the image itself -- the HEAD probe would be racing Cloudinary's own CDN propagation and could report a freshly-uploaded asset as missing.
    if (!image.uploaded && !(await checkImageExists(imageKey))) {
        confirmation += `\n${BOT_EMOJI.warn} **Heads up:** no image found on Cloudinary at key \`${imageKey}\` -- the card will show broken until an image with that exact Public ID is uploaded there.`;
    }
    return interaction.followUp({ content: confirmation });
}

// --- BULK ADD/REPLACE LOADOUTS (upsert, never wholesale-replaces) --- custom_id: modal_loadouts_bulk_add_{MP|DMZ}. "Replace" also routes into this exact modal/handler (see manageActions.js's comment on why). Parsing now happens INSIDE the op (core/ops/loadouts.js), which upserts by {weaponKey, mode, buildName} -- this handler just relays the raw pasted text and `mode`.
async function bulkAddLoadouts(interaction, preset = null) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });
    const field = fieldReader(interaction, preset);
    const customId = preset ? preset.customId : interaction.customId;
    const fail = failer(interaction, preset);
    const pageMode = customId.replace('modal_loadouts_bulk_add_', '');
    const bulkText = field('bulk_text');

    // The catalogue check over every pasted block, merged into one list; each unknown weapon keeps the category its own block gave.
    const { parseBulkLoadoutList } = require('../../utils/adminParser');
    const unknown = { weapon: null, attachments: [], count: 0, weapons: [] };
    const seen = new Set();
    for (const p of parseBulkLoadoutList(bulkText).parsed) {
        const u = await findUnknownNames({ weaponName: p.weaponName, attachments: p.attachments });
        if (u.weapon && !seen.has(`w|${normKey(u.weapon)}`)) { seen.add(`w|${normKey(u.weapon)}`); unknown.weapons.push({ name: u.weapon, category: p.category }); }
        for (const a of u.attachments) if (!seen.has(`a|${normKey(a)}`)) { seen.add(`a|${normKey(a)}`); unknown.attachments.push(a); }
    }
    unknown.count = unknown.weapons.length + unknown.attachments.length;
    if (unknown.count && !preset) {
        return await warnUnknownNames(interaction, { customId, values: readValues(field, ['bulk_text']) },
            { ...unknown, weapon: unknown.weapons.map(w => w.name).join('`, `') || null });
    }
    const learn = [
        ...unknown.weapons.flatMap(w => learnItems({ weapon: w.name, attachments: [] }, { category: w.category })),
        ...learnItems({ weapon: null, attachments: unknown.attachments })
    ];

    const result = await commitSet(
        [{ type: 'loadout.bulkAdd', target: { mode: pageMode }, payload: { text: bulkText } },
         ...(learn.length ? [{ type: 'catalogue.learn', payload: { items: learn, mode: pageMode } }] : [])],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        return await fail(extractCommitError(result));
    }
    const { applied } = result.results[0];

    let confirmation = `${BOT_EMOJI.checkmark} **Bulk Loadout Import Complete!**\n${applied.created} new build(s) added, ${applied.updated} existing build(s) updated.`;
    if (learn.length) confirmation += `\n-# Added to the catalogue: ${learn.map(i => `\`${i.name}\``).join(', ')}.`;
    if (applied.parseErrors.length > 0) {
        confirmation += `\n${BOT_EMOJI.warn} ${applied.parseErrors.length} block(s) skipped:\n${applied.parseErrors.map(e => `- ${e}`).join('\n')}`;
    }
    if (applied.missingImages.length > 0) {
        confirmation += `\n${BOT_EMOJI.warn} No Cloudinary image found for ${applied.missingImages.length} build(s) -- these will show broken until uploaded there with the exact Public ID typed:\n${applied.missingImages.map(m => `- ${m.label}: \`${m.imageKey}\``).join('\n')}`;
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
        return interaction.reply({ content: `${BOT_EMOJI.cross} Nothing matched -- nothing to delete.${notFound.length ? `\n${BOT_EMOJI.warn} Not found: ${notFound.join(', ')}` : ''}`, ephemeral: true });
    }

    const summary = [`Removed: ${toDelete.map(t => t.label).join(', ')}`];
    if (notFound.length) summary.push(`${BOT_EMOJI.warn} Not found: ${notFound.join(', ')}`);
    const ids = toDelete.flatMap(t => t.ids);

    return registerBulkDelete(interaction, {
        description: `Bulk Delete ${mode} Loadouts`,
        summary,
        apply: async () => {
            const result = await commitSet(
                [{ type: 'loadout.bulkDelete', target: { mode }, payload: { ids } }],
                { actorId: interaction.user.id }
            );
            if (!result.ok) throw new Error(extractCommitError(result));
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
        return interaction.followUp({ content: `${BOT_EMOJI.cross} No matches found for: ${requested.join(', ')}` });
    }

    const text = formatLoadoutsAsBulkText(matched);
    let content = `📤 **Exported ${matched.length} ${mode} loadout(s)** in Bulk Add format. Paste this back into the Bulk Add action.`;
    if (notFound.length) content += `\n${BOT_EMOJI.warn} Not found: ${notFound.join(', ')}`;
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
        return interaction.followUp({ content: `${BOT_EMOJI.cross} No ${mode} loadouts found in category "${category}".` });
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
    // `mode` rides on the target so core/changeset.js's pageForOp stamps the ChangeLog row with the RIGHT page: MP and DMZ share this op, and without it every DMZ delete was recorded as MP, which then gated its Revert on the wrong page.
    const result = await commitSet([{ type: 'loadout.delete', target: { id: match.id, ...(match.doc?.mode ? { mode: match.doc.mode } : {}) } }], { actorId });
    if (!result.ok) throw new Error(extractCommitError(result));
    return null;   // Undo now lives on /bot analytics' Changes page (core/revert.js) -- no inline undo token.
}

module.exports = { editLoadout, addLoadout, bulkAddLoadouts, handleCatalogueWarning, bulkDeleteLoadouts, exportUpTo5, exportCategory, deleteItem };
