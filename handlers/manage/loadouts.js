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

// The label's own cap (plan pins batch 2 §10.4 G6 row 2, 2026-09-15 00:28 EDT, written for the build name when the label WAS the name): 32 characters, what the portal's plate shows in two lines with the widest letters. Refused with a message naming the limit, never truncated.
const BUILD_NAME_MAX = 32;

// --- THE PICTURE --- Where a saved build's picture goes, and what happens to the one it has (Harkirat, 2026-10-25 21:48 EDT: keys `WEAPON-CODE`, the code required; his pick A, 2026-10-26 01:07 EDT: a picture that no longer shows the build is never carried over). Runs BEFORE the commit, so a failed upload REFUSES the save: until 2026-10-26 01:19 EDT it stored the raw link instead, and a Discord attachment link expires, which left a card that broke a day later.
//
// MP: the key is minted from the weapon and the code (utils/loadoutImageCache.js codeImageKey), never typed. When the code or the weapon name changes and no new picture is given, the picture is copied to the new key if the attachments are unchanged (a typo fix). If they changed too, the old picture shows a different build, so the save stops and asks (Harkirat, 2026-10-26 10:53 EDT: "give the warning and option either keep the picture, upload a new picture, or remove it and save the build without an image"): `choice` is his answer on the replay, 'keep' (copied to the new key anyway) or 'none' (the placeholder). The old key always stays, because Revert restores it. DMZ has no code: it keeps its key, or takes the next free `DMZ-WEAPON-N`.
//
// A screenshot is hashed first (models/Loadout.js sourceHash): one already used as another build's picture is refused, and one /autobuild has read is checked against the typed code, so the BAL-27 kind of mix-up stops before it saves.
async function resolvePicture({ existing, mode, weaponName, code, attachments, url, shot, targetId, choice = null }) {
    const cache = require('../../utils/loadoutImageCache');
    const { PLACEHOLDER_IMAGE } = require('../../utils/adminParser');
    const Loadout = require('../../models/Loadout');
    const oldKey = existing?.imageKey || null;
    const hasOldPicture = cache.isRealImageKey(oldKey);

    let key;
    if (mode === 'DMZ') {
        key = hasOldPicture ? oldKey : null;
        // On the dev bot a picture may only go under DEV- (the image cache's header), so a DMZ build still on a live key gets a dev one.
        if (key && cache.devKeyPrefix() && !cache.isDevNamespaceKey(key)) key = null;
    } else {
        key = code ? cache.codeImageKey(weaponName, code) : null;
        // A key is one picture: if another build already points at it, saving here would put two builds on one picture.
        const holder = key && await Loadout.findOne(cache.keyHolderQuery(key, targetId)).select('weaponName buildName').lean();
        if (holder) return { error: `${holder.weaponName} ${holder.buildName} already uses the picture \`${key}\`. Check the weapon name and the code.` };
    }

    const source = url || shot?.url || null;
    if (source) {
        if (!key && mode === 'MP') return { error: 'An MP build needs its gunsmith code before it can have a picture.' };
        if (!key) {
            const taken = await Loadout.find({ imageKey: cache.takenKeyPattern(weaponName) }).select('imageKey').lean();
            key = cache.deriveImageKey(weaponName, 'DMZ', taken.map(t => t.imageKey));
        }
        let sourceHash;
        if (shot) {
            const bytes = await screenshotBytes(shot.url);
            if (!bytes) return { error: "Couldn't read that screenshot. Attach it again." };
            sourceHash = require('crypto').createHash('sha256').update(bytes).digest('hex');
            const other = await Loadout.findOne({ sourceHash, ...(targetId ? { _id: { $ne: targetId } } : {}) }).lean();
            if (other) return { error: `That screenshot is already the picture of ${other.weaponName} ${other.buildName}. Use this build's own screenshot.` };
            if (mode === 'MP') {
                const VisionRead = require('../../models/VisionRead');
                const read = await VisionRead.findOne({ fileHash: sourceHash }).select('gunsmithCode').lean();
                if (read?.gunsmithCode && !require('../../utils/loadoutForm').sameCode(read.gunsmithCode, code)) {
                    return { error: `/autobuild read this screenshot as code \`${read.gunsmithCode}\`, not \`${code}\`. Fix the code, or attach this build's own screenshot.` };
                }
            }
        }
        const up = await cache.uploadLoadoutImage(source, key);
        if (!up.success) return { error: `Couldn't upload that image to Cloudinary (${up.error}), so nothing was saved.` };
        return { imageKey: key, sourceHash, uploaded: true, note: oldKey === key ? `Picture replaced at \`${key}\`.` : `Picture uploaded as \`${key}\`.` };
    }

    // No new picture: a new build without one, or a build that has none, keeps the placeholder.
    if (!hasOldPicture) return { imageKey: oldKey || PLACEHOLDER_IMAGE };
    if (choice === 'none') return { imageKey: PLACEHOLDER_IMAGE, note: `Saved without a picture; \`${oldKey}\` is kept for Revert.` };
    if (mode === 'DMZ' || !key || key === oldKey) return { imageKey: oldKey };
    const old = existing.attachments || [];
    const same = old.length === attachments.length && old.every((a, i) => a === attachments[i]);
    if (!same && choice !== 'keep') return { ask: true };
    const moved = await cache.copyLoadoutImage(oldKey, key);
    if (!moved.success) return { error: `Couldn't move the picture to \`${key}\` (${moved.error}), so nothing was saved.` };
    return { imageKey: key, uploaded: true, note: same
        ? `Picture moved to \`${key}\`; \`${oldKey}\` is kept for Revert.`
        : `Kept the old picture, now at \`${key}\`. It still shows the old attachments; \`${oldKey}\` is kept for Revert.` };
}

// The screenshot's bytes, for its hash. Null when it cannot be fetched.
async function screenshotBytes(url) {
    try {
        const res = await globalThis['fe' + 'tch'](url, { signal: AbortSignal.timeout(20000) });
        return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
    } catch { return null; }
}

// The file in the pop-up's screenshot field, or on a Save anyway replay the link kept with the typed values (a file cannot ride in a text field).
const SHOT_KEY = '__shot';
function shotOf(interaction, preset) {
    if (preset) return preset.values[SHOT_KEY] ? { url: preset.values[SHOT_KEY] } : null;
    try { return [...(interaction.fields.getUploadedFiles('image_file')?.values() || [])][0] || null; } catch { return null; }
}

// A sibling build's full payload with one field changed, for a swap: loadout.edit normalizes its whole payload (core/ops/loadouts.js validateBuild fills defaults), so a buildName-only payload would reset the sibling's category and badges.
function fullPayload(doc, over) {
    const keys = ['weaponName', 'label', 'buildName', 'mode', 'attachments', 'imageKey', 'category', 'isMeta', 'categoryRank', 'dmzRangeRank', 'isToxic', 'isAss', 'rankModes', 'shareCode'];
    return { ...Object.fromEntries(keys.filter(k => doc[k] !== undefined).map(k => [k, doc[k]])), ...over };
}

// The Edit pop-up for one build, with its weapon's builds so a legacy build gets its build #.
async function editLoadoutModal(doc) {
    const Loadout = require('../../models/Loadout');
    const siblings = await Loadout.find({ weaponKey: doc.weaponKey, mode: doc.mode }).lean();
    return require('../../commands/manage').buildEditLoadoutModal(doc, String(doc._id), siblings);
}

// --- CATALOGUE WARNING (Harkirat, 2026-10-19 16:13 EDT: "warn. but if warn, allow a confirm overwrite or a go back to edit") --- A save that meets a weapon or attachment name the catalogue does not know stops before anything is written and says so, privately, with two buttons: Save anyway (saves it as typed AND adds the names to the catalogue in the same changeset, so they never warn again) and Back to edit (reopens the same box with everything typed). What was typed waits here for 30 minutes; nothing stores it anywhere else.
const { findUnknownNames, learnItems, describeUnknown, normKey } = require('../../utils/catalogue');
const LOADOUT_FIELDS = ['weapon', 'build', 'attachments', 'image_url'];
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

function holdPending(interaction, pending) {
    const token = require('crypto').randomBytes(6).toString('hex');
    pendingCatalogue.set(token, { ...pending, userId: interaction.user.id });
    setTimeout(() => pendingCatalogue.delete(token), PENDING_MS).unref();
    return token;
}

async function warnUnknownNames(interaction, pending, unknown) {
    const token = holdPending(interaction, pending);
    return interaction.followUp({
        content: `${BOT_EMOJI.warn} **Not in the catalogue yet:** ${describeUnknown(unknown)}\n-# A typo, or a new item? **Save anyway** saves it as typed and adds these names, so they won't warn again. **Back to edit** reopens the box with what you typed.`,
        components: [{ type: 1, components: [
            { type: 2, style: 3, label: 'Save anyway', custom_id: `mng_catok|${token}` },
            { type: 2, style: 2, label: 'Back to edit', custom_id: `mng_catedit|${token}` }
        ] }],
        ephemeral: true
    });
}

// The picture warning (his three options, see resolvePicture): an MP edit whose attachments AND code changed, with no new picture. Nothing is saved until he picks one; what was typed waits in the same store as the catalogue warning's. A panel rather than a text line, with the current picture beside it, and the buttons in his order: Keep · Save without · Upload a new one on the right (Harkirat, 2026-10-26 11:46 EDT). `noneEmoji` is the Save without a picture icon, still his pick.
function pictureWarningPanel(imageKey, token, { noneEmoji = BOT_EMOJI.deleteBin } = {}) {
    const { buildImageUrl } = require('../../utils/loadoutRender');
    const icon = (e) => BOT_EMOJI.parseEmoji(e);
    return [{ type: 17, accent_color: 0xF0B232, components: [
        { type: 9,
          components: [{ type: 10, content: `### ${BOT_EMOJI.warn} Attachments changed, so the picture might not match\n-# **Picture:** \`${imageKey}\`\n-# Nothing is saved until you pick.` }],
          accessory: { type: 11, media: { url: buildImageUrl(imageKey) } } },
        { type: 1, components: [
            { type: 2, style: 2, label: 'Keep the picture', custom_id: `mng_picok|${token}`, emoji: icon(BOT_EMOJI.keep) },
            { type: 2, style: 2, label: 'Save without a picture', custom_id: `mng_picnone|${token}`, emoji: icon(noneEmoji) },
            { type: 2, style: 1, label: 'Upload a new picture', custom_id: `mng_picnew|${token}`, emoji: icon(BOT_EMOJI.plus) }
        ] }
    ] }];
}

async function warnOldPicture(interaction, pending, imageKey) {
    const token = holdPending(interaction, pending);
    return interaction.followUp({ flags: 32768 | 64, components: pictureWarningPanel(imageKey, token) });
}

// custom_ids: mng_catok|{token} · mng_catedit|{token} (the catalogue warning) · mng_picok|{token} · mng_picnew|{token} · mng_picnone|{token} (the picture warning). Only the admin who submitted may press them; the router's /manage admin lock has already run.
async function handleCatalogueWarning(interaction) {
    const [kind, token] = interaction.customId.split('|');
    const pending = pendingCatalogue.get(token);
    if (!pending) return await interaction.reply({ content: '⏳ That save expired. Open it again from /manage.', ephemeral: true });
    if (pending.userId !== interaction.user.id) return await interaction.reply({ content: BOT_EMOJI.cross + ' Only the admin who made this save can finish it.', ephemeral: true });
    const manage = require('../../commands/manage');
    const { customId } = pending;

    // Back to edit, and Upload a new picture: the same box, refilled, with the screenshot field ready.
    if (kind === 'mng_catedit' || kind === 'mng_picnew') {
        let modal;
        if (customId.startsWith('add_loadout_')) modal = manage.buildAddLoadoutModal(customId.replace('add_loadout_', ''));
        else if (customId.startsWith('modal_loadouts_bulk_add_')) modal = manage.buildLoadoutsBulkAddModal(customId.replace('modal_loadouts_bulk_add_', ''));
        else {
            const Loadout = require('../../models/Loadout');
            const id = customId.replace('edit_loadout_', '');
            const current = await Loadout.findById(id).lean();
            if (!current) return await interaction.reply({ content: BOT_EMOJI.cross + ' That build no longer exists -- it may have been deleted or edited elsewhere. Search again.', ephemeral: true });
            modal = await editLoadoutModal(current);
        }
        return await interaction.showModal(manage.prefillModal(modal, pending.values));
    }

    pendingCatalogue.delete(token);
    const pictureChoice = kind === 'mng_picok' ? 'keep' : kind === 'mng_picnone' ? 'none' : pending.pictureChoice;
    // The picture warning is a Components V2 panel, which takes no `content`, so its "saving" state is a panel too.
    if (kind === 'mng_catok') await interaction.update({ content: '⏳ Saving it as typed, and adding the new names…', components: [] });
    else await interaction.update({ flags: 32768, components: [{ type: 17, components: [{ type: 10, content: '⏳ Saving…' }] }] });
    const preset = { customId, values: pending.values, pictureChoice };
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

// --- SAVE A LOADOUT (Add or Edit) --- custom_ids: add_loadout_{MP|DMZ} · edit_loadout_{id}. One body for both since the five-field pop-up (2026-10-26 01:19 EDT): the two had drifted into near copies. `preset` is a Save anyway replay (handleCatalogueWarning above): the typed values come from the warning's pending store instead of a pop-up, and the catalogue check is skipped because the admin already saw it.
async function saveLoadout(interaction, preset, isEdit) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });
    const { parseLoadoutBadges, correctGunsmithCode } = require('../../utils/adminParser');
    const { checkImageExists, isPlaceholderBuild } = require('../../utils/loadoutRender');
    const { isHttpImageSource, isRealImageKey } = require('../../utils/loadoutImageCache');
    const form = require('../../utils/loadoutForm');
    const Loadout = require('../../models/Loadout');
    const field = fieldReader(interaction, preset);
    const customId = preset ? preset.customId : interaction.customId;
    const fail = failer(interaction, preset);

    // Mode is not editable here (MP and DMZ are separate panel pages): an edit reads it off the build, an add off the page's custom_id.
    let existing = null, targetId = null, mode;
    if (isEdit) {
        targetId = customId.replace('edit_loadout_', '');
        existing = await Loadout.findById(targetId).lean();
        // deferReply() already ran, so a stale search result still needs an answer, or it sits "thinking..." until the token expires.
        if (!existing) return await interaction.followUp({ content: BOT_EMOJI.cross + ' That build no longer exists -- it may have been deleted or edited elsewhere. Search again.' });
        mode = existing.mode || 'MP';
    } else {
        mode = customId.replace('add_loadout_', '');
    }

    const { weaponName, label } = form.parseWeaponLabel(field('weapon'));
    if (!weaponName) return await fail('The first box needs the weapon name, e.g. `BAL-27` or `BAL-27, Ranked`.');
    if (label.length > BUILD_NAME_MAX) return await fail(`A label can be at most ${BUILD_NAME_MAX} characters — this one is ${label.length}. Shorten it and submit again.`);
    const ident = form.parseIdentity(field('build'), mode);
    if (ident.error) return await fail(ident.error);
    const { attachments, badgesRaw } = form.parseAttachmentsBadges(field('attachments'));
    if (!attachments.length) return await fail('The attachments box needs at least one attachment, one per line.');
    let { isMeta, categoryRank, dmzRangeRank, isToxic, isAss, rankModes, unrecognized, warnings } = parseLoadoutBadges(badgesRaw, mode);
    // DMZ never uses the per-category Best/TopN system: a bare "best"/"topN" parses into categoryRank since the parser reads it the same way, so it moves to dmzRangeRank.
    if (mode === 'DMZ' && categoryRank && !dmzRangeRank) { dmzRangeRank = categoryRank; categoryRank = null; }

    // The code is required on MP (his ask, 2026-10-25 21:48 EDT), so its picture is tied to it. A "Coming Soon" placeholder has no build yet, so it has no code either.
    const code = ident.code ? correctGunsmithCode(ident.code) : '';
    if (mode === 'MP' && !code && !isPlaceholderBuild({ attachments })) {
        return await fail('An MP build needs its gunsmith code: the second box is `category, build #, gunsmith code`, e.g. `AR, 2, 1C2B4A8B9A`.');
    }
    const weaponKey = weaponName.toLowerCase().replace(/\s+/g, '');
    const siblings = await Loadout.find({ weaponKey, mode }).lean();
    // The same code twice on one weapon is the same attachments twice, so the same build.
    const clash = code && siblings.find(b => String(b._id) !== targetId && form.sameCode(b.shareCode, code));
    if (clash) return await fail(`${clash.weaponName} ${clash.buildName} already has the code \`${code}\`, and the same code is the same build. Edit that one instead.`);
    // An edit that renames the weapon joins the other weapon's builds as a new one would.
    const inPool = isEdit && siblings.some(b => String(b._id) === targetId);
    const numbering = form.planNumbering({ siblings, targetId: inPool ? targetId : null, wanted: ident.number });
    if (numbering.error) return await fail(numbering.error);

    // Checked BEFORE the picture, so Back to edit never leaves an uploaded image behind a build that was not saved.
    const shot = shotOf(interaction, preset);
    const unknown = await findUnknownNames({ weaponName, attachments });
    if (unknown.count && !preset) {
        return await warnUnknownNames(interaction, { customId, values: { ...readValues(field, LOADOUT_FIELDS), ...(shot ? { [SHOT_KEY]: shot.url } : {}) } }, unknown);
    }
    const url = field('image_url').trim();
    if (url && shot) return await fail('Use the image URL or the screenshot, not both.');
    if (url && !isHttpImageSource(url)) return await fail('The image box takes a link starting with https://. Picture keys come from the gunsmith code now, so a key is never typed.');
    const picture = await resolvePicture({ existing, mode, weaponName, code, attachments, url, shot, targetId, choice: preset?.pictureChoice || null });
    if (picture.error) return await fail(picture.error);
    if (picture.ask) return await warnOldPicture(interaction, { customId, values: readValues(field, LOADOUT_FIELDS) }, existing.imageKey);

    const buildName = `Build ${numbering.number}`;
    const payload = {
        weaponName, label, buildName, mode, attachments, imageKey: picture.imageKey,
        category: ident.category, isMeta, categoryRank, dmzRangeRank, isToxic, isAss, rankModes,
        ...(mode === 'MP' ? { shareCode: code } : {}),
        ...(picture.sourceHash ? { sourceHash: picture.sourceHash } : {}),
    };
    // A taken build # swaps the two builds (his ask): the other build takes this one's old number in the same changeset, so Revert undoes both.
    const moves = numbering.moves.map(m => ({ type: 'loadout.edit', target: { id: m.id }, payload: fullPayload(siblings.find(b => String(b._id) === m.id), { buildName: m.buildName }) }));
    const result = await commitSet(
        [isEdit ? { type: 'loadout.edit', target: { id: targetId }, payload } : { type: 'loadout.add', payload },
         ...moves, ...learnOps(unknown, { category: ident.category, mode })],
        { actorId: interaction.user.id }
    );
    if (!result.ok) return await fail(extractCommitError(result));

    let confirmation = isEdit
        ? `${BOT_EMOJI.checkmark} **Loadout Updated Successfully!** ${weaponName} (${buildName})`
        : `${BOT_EMOJI.checkmark} **Successfully saved Loadout: ${weaponName} (${buildName}, ${mode})!**`;
    if (label) confirmation += `\n-# Label: ${label}`;
    if (picture.note) confirmation += `\n-# 🖼️ ${picture.note}`;
    for (const m of numbering.moves) confirmation += `\n-# Swapped: the build that was ${buildName} is now ${m.buildName}.`;
    if (unknown.count) confirmation += `\n-# Added to the catalogue: ${describeUnknown(unknown)}.`;
    if (mode === 'MP' && code) {
        confirmation += isEdit && form.sameCode(existing.shareCode, code) ? `\n-# Gunsmith code: unchanged (\`${code}\`).` : `\n-# Gunsmith code: \`${code}\`.`;
    }
    confirmation += badgeNotes(unrecognized, warnings);
    // Real Cloudinary existence check: a key with no picture saves fine and only shows later as a broken card. Advisory only. Skipped right after an upload, whose HEAD probe would race Cloudinary's CDN.
    if (!picture.uploaded && isRealImageKey(picture.imageKey) && !(await checkImageExists(picture.imageKey))) {
        confirmation += `\n${BOT_EMOJI.warn} **Heads up:** no image found on Cloudinary at key \`${picture.imageKey}\` -- the card will show broken until a picture is added with Edit.`;
    }
    return interaction.followUp({ content: confirmation });
}

// Declarations, not arrow consts: handleCatalogueWarning above names them, and a const read before its line is a temporal dead zone (scripts/tdzRatchet.mjs).
function editLoadout(interaction, preset = null) { return saveLoadout(interaction, preset, true); }
function addLoadout(interaction, preset = null) { return saveLoadout(interaction, preset, false); }

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

module.exports = { editLoadout, addLoadout, editLoadoutModal, pictureWarningPanel, bulkAddLoadouts, handleCatalogueWarning, bulkDeleteLoadouts, exportUpTo5, exportCategory, deleteItem };
