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
            // An option's picture takes a number too (merged builds, 2026-11-05).
            const pattern = cache.takenKeyPattern(weaponName);
            const taken = await Loadout.find({ $or: [{ imageKey: pattern }, { 'variants.imageKey': pattern }] }).select('imageKey variants.imageKey').lean();
            key = cache.deriveImageKey(weaponName, 'DMZ', taken.flatMap(t => [t.imageKey, ...(t.variants || []).map(v => v.imageKey)]).filter(Boolean));
        }
        let sourceHash;
        if (shot) {
            const bytes = await screenshotBytes(shot.url);
            if (!bytes) return { error: "Couldn't read that screenshot. Attach it again." };
            sourceHash = require('crypto').createHash('sha256').update(bytes).digest('hex');
            const other = await Loadout.findOne({ $or: [{ sourceHash }, { 'variants.sourceHash': sourceHash }], ...(targetId ? { _id: { $ne: targetId } } : {}) }).lean();
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
        // A replace at the same key is listed under What changed (savedPanel's pictureReplaced), so it needs no note as well.
        return { imageKey: key, imageVersion: up.version, sourceHash, uploaded: true, replaced: oldKey === key, note: oldKey === key ? null : `Picture uploaded as \`${key}\`.` };
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
    return { imageKey: key, imageVersion: moved.version, uploaded: true, note: same
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

// The Edit pop-up for one build, with its weapon's builds so a legacy build gets its build #. `option` opens one option of a merged build (utils/loadoutOptions.js); its id is `{id}~{option}`, read back by splitTarget.
async function editLoadoutModal(doc, option = 0) {
    const Loadout = require('../../models/Loadout');
    const siblings = await Loadout.find({ weaponKey: doc.weaponKey, mode: doc.mode }).lean();
    return require('../../commands/manage').buildEditLoadoutModal(doc, String(doc._id), siblings, option);
}

// `{id}` or `{id}~{option}`, the target an edit_loadout_ / mng_ldedit_ id names. A bad or missing option is 0 (Option A).
function splitTarget(raw) {
    const [id, opt] = String(raw || '').split('~');
    const option = Number(opt);
    return { id, option: Number.isInteger(option) && option > 0 ? option : 0 };
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

// A code that looks cut off: the same Back to edit / Save anyway, before the catalogue check (Harkirat, 2026-10-28 01:06 EDT).
async function warnCutCode(interaction, pending, lines) {
    const token = holdPending(interaction, pending);
    return interaction.followUp({ flags: 32768 | 64, components: require('../../utils/loadoutPanels').codePanel({ lines, token }) });
}

async function warnUnknownNames(interaction, pending, unknown) {
    const token = holdPending(interaction, pending);
    return interaction.followUp({ flags: 32768 | 64, components: require('../../utils/loadoutPanels').cataloguePanel({ described: describeUnknown(unknown), token }) });
}

// The picture warning (his three options, see resolvePicture): an MP edit whose attachments AND code changed, with no new picture. Nothing is saved until he picks one; what was typed waits in the same store as the catalogue warning's. A panel rather than a text line, with the current picture beside it, and the buttons in his order: Keep · Save without · Upload a new one on the right (Harkirat, 2026-10-26 11:46 EDT). Save without a picture uses the Collapse (minus) icon, his pick over DeleteBin, Cross and DB_Delete (2026-10-26 12:00 EDT: "use the minus emoji").
function pictureWarningPanel(imageKey, token, { noneEmoji = BOT_EMOJI.collapse, build = null } = {}) {
    const { buildImageUrl, pictureVersion } = require('../../utils/loadoutRender');
    const icon = (e) => BOT_EMOJI.parseEmoji(e);
    return [{ type: 17, accent_color: 0xF0B232, components: [
        { type: 9,
          components: [{ type: 10, content: `### ${BOT_EMOJI.warn} Attachments changed, so the picture might not match\n-# **Picture:** \`${imageKey}\`\n-# Nothing is saved until you pick.` }],
          accessory: { type: 11, media: { url: buildImageUrl(imageKey, pictureVersion(build)) } } },
        { type: 1, components: [
            { type: 2, style: 2, label: 'Keep the picture', custom_id: `mng_picok|${token}`, emoji: icon(BOT_EMOJI.keep) },
            { type: 2, style: 2, label: 'Save without a picture', custom_id: `mng_picnone|${token}`, emoji: icon(noneEmoji) },
            { type: 2, style: 1, label: 'Upload a new picture', custom_id: `mng_picnew|${token}`, emoji: icon(BOT_EMOJI.plus) }
        ] }
    ] }];
}

async function warnOldPicture(interaction, pending, imageKey, build) {
    const token = holdPending(interaction, pending);
    return interaction.followUp({ flags: 32768 | 64, components: pictureWarningPanel(imageKey, token, { build }) });
}

// custom_ids: mng_catok|{token} · mng_catedit|{token} (the catalogue warning) · mng_codeok|{token} · mng_codeedit|{token} (the code warning) · mng_picok|{token} · mng_picnew|{token} · mng_picnone|{token} (the picture warning). Only the admin who submitted may press them; the router's /manage admin lock has already run.
async function handleCatalogueWarning(interaction) {
    const [kind, token] = interaction.customId.split('|');
    const pending = pendingCatalogue.get(token);
    if (!pending) return await interaction.reply({ content: `${require('../../utils/emojiMap').cross} That save expired. Open it again from /manage.`, ephemeral: true });
    if (pending.userId !== interaction.user.id) return await interaction.reply({ content: BOT_EMOJI.cross + ' Only the admin who made this save can finish it.', ephemeral: true });
    const manage = require('../../commands/manage');
    const { customId } = pending;

    // Back to edit, and Upload a new picture: the same box, refilled, with the screenshot field ready.
    if (kind === 'mng_catedit' || kind === 'mng_codeedit' || kind === 'mng_picnew') {
        let modal;
        if (customId.startsWith('add_loadout_')) modal = manage.buildAddLoadoutModal(customId.replace('add_loadout_', ''));
        else if (customId.startsWith('modal_loadouts_bulk_add_')) modal = manage.buildLoadoutsBulkAddModal(customId.replace('modal_loadouts_bulk_add_', ''));
        else {
            const Loadout = require('../../models/Loadout');
            const { id, option } = splitTarget(customId.replace('edit_loadout_', ''));
            const current = await Loadout.findById(id).lean();
            if (!current) return await interaction.reply({ content: BOT_EMOJI.cross + ' That build no longer exists -- it may have been deleted or edited elsewhere. Search again.', ephemeral: true });
            modal = await editLoadoutModal(current, option);
        }
        return await interaction.showModal(manage.prefillModal(modal, pending.values));
    }

    pendingCatalogue.delete(token);
    const pictureChoice = kind === 'mng_picok' ? 'keep' : kind === 'mng_picnone' ? 'none' : pending.pictureChoice;
    // Both warnings are Components V2 panels, which take no `content`, so the "saving" state is a panel too.
    const { notePanel } = require('../../utils/loadoutPanels');
    await interaction.update({ flags: 32768, components: notePanel(kind === 'mng_catok' ? `${require('../../utils/emojiMap').cooldown} Saving it as typed, and adding the new names…` : `${require('../../utils/emojiMap').cooldown} Saving…`) });
    // `acks`: the warnings this save has already been answered on, so a replay asks only what it has not (code, then catalogue, then picture).
    const acks = [...(pending.acks || []), ...(kind === 'mng_catok' ? ['catalogue'] : kind === 'mng_codeok' ? ['code'] : [])];
    const preset = { customId, values: pending.values, pictureChoice, acks };
    if (customId.startsWith('add_loadout_')) return await addLoadout(interaction, preset);
    if (customId.startsWith('modal_loadouts_bulk_add_')) return await bulkAddLoadouts(interaction, preset);
    return await editLoadout(interaction, preset);
}

// The badge lines under an add or edit confirmation: tokens that matched nothing, then tokens that were understood but changed or left off (top4 read as top5, Ass beside a tier, a rank mode on DMZ), each with its reason.
function badgeNotes(unrecognized, warnings) {
    let out = '';
    if (unrecognized.length > 0) {
        out += `\n${BOT_EMOJI.warn} Badge input not recognized and ignored: \`${unrecognized.join(', ')}\`. Valid options: \`meta\`, \`toxic\`, \`ass\`, \`best\`, \`top3\`, \`top5\`, \`hm\`, a rank mode (\`hp\`, \`s&d\`, \`dom\`, \`tdm\`, \`ftl\`, \`control\`; MP only), or a DMZ range badge (\`bestclose\`, \`top3midlong\`, \`capableclose\`).`;
    }
    for (const w of warnings) out += `\n${BOT_EMOJI.warn} ${w}`;
    return out;
}

// --- A MERGED BUILD'S OPTIONS (Harkirat, 2026-11-05 14:41 EST: "we just number the build as '1, 1b, 1c' etc and if it has b c d e etc then it means its a merge build and should be added to the same page"; his pick, "Build it as shown", 14:50 EST) --- The same Add and Edit pop-up, the build # with a letter: `2b` is Build 2's Option B (utils/loadoutOptions.js). What a save does depends only on where the option is and where the number sends it:
//   self  · the option stays on its build: edited in place, and a different letter SWAPS it with the option there (the build-number rule, so `2c` -> `2` makes it Option A and the old A takes `2c`)
//   join  · a letter on ANOTHER build: it is inserted there, and the build it left loses it (a build with no other option is deleted, so it has merged)
//   add   · Create New with a letter: inserted into that build
//   split · a plain number on another build: it becomes its own build there, the add rule for numbers (the build holding it moves to the end)
// Only `self` writes the whole build's category, label and badges; an option that joins or is added takes its new build's, which the saved panel says. Weapon name: a build with options keeps it (a rename moves a build into another weapon's numbers, and an option save renumbers nothing). Returns the plan, or { error }.
function planOptionSave({ existing, targetId, targetOption, ident, weaponKey, siblings }) {
    const lo = require('../../utils/loadoutOptions');
    const form = require('../../utils/loadoutForm');
    const { variantView, variantCount } = require('../../utils/loadoutRender');
    const src = existing || null;
    const srcCount = src ? variantCount(src) : 0;
    if (src && targetOption >= srcCount) return { error: 'That option no longer exists. Search again.' };
    if (src && srcCount > 1 && weaponKey !== src.weaponKey) return { error: `A build with options keeps its weapon name (\`${src.weaponName}\`). Move an option to another build with its build #, or rename the build once it has one option.` };
    const before = src ? variantView(src, targetOption) : null;
    const inPool = src && siblings.some(b => String(b._id) === String(targetId));
    const srcNumber = src ? form.numberFor(src, inPool ? siblings : [src]) : null;
    const number = ident.number ?? srcNumber;
    if (number == null) return { error: 'Give the build # this option belongs to, e.g. `SMG, 2b, 1C2B4A8B9A`.' };
    const range = (n, count) => (count === 1 ? `only \`${n}\`` : `options \`${n}\` to \`${lo.optionTag(n, count - 1)}\``);
    const dest = siblings.find(b => form.numberFor(b, siblings) === number) || null;
    if (src && dest && String(dest._id) === String(src._id)) {
        const to = ident.number == null ? targetOption : ident.option;
        if (to >= srcCount) return { error: `Build ${number} has ${range(number, srcCount)}, so \`${lo.optionTag(number, to)}\` isn't one of them. To add an option, use Create New with \`${lo.optionTag(number, srcCount)}\`.` };
        return { kind: 'self', src, from: targetOption, to, before, number };
    }
    if (ident.lettered) {
        if (!dest) return { error: `There is no Build ${number} of this weapon, so it has no \`${lo.optionTag(number, ident.option)}\`. A plain build # makes a new build.` };
        const count = variantCount(dest);
        if (count >= lo.MAX_OPTIONS) return { error: `Build ${number} already has ${lo.MAX_OPTIONS} options, the most a build can have.` };
        if (ident.option > count) return { error: `Build ${number} has ${range(number, count)}, so the next one is \`${lo.optionTag(number, count)}\`.` };
        return { kind: src ? 'join' : 'add', src, from: targetOption, dest, to: ident.option, before, number, srcNumber };
    }
    // A plain number on another build: this option becomes its own build there. Only an option of a merged build gets here (a plain build with a plain number is an ordinary edit).
    const free = form.planNumbering({ siblings, targetId: null, wanted: number });
    if (free.error) return { error: free.error };
    return { kind: 'split', src, from: targetOption, before, number, srcNumber };
}

// Commits an option save planned above, and answers with the build as it now stands, the option on show.
async function saveOption(interaction, { plan, picture, fail, unknown, mode, weaponName, label, code, attachments, ident, badges, alerts }) {
    const lo = require('../../utils/loadoutOptions');
    const { variantView } = require('../../utils/loadoutRender');
    const { isRealImageKey } = require('../../utils/loadoutImageCache');
    const Loadout = require('../../models/Loadout');
    const { before, src, from } = plan;
    const sameKey = Boolean(before) && picture.imageKey === before.imageKey;
    const sameList = Boolean(before) && (before.attachments || []).length === attachments.length && before.attachments.every((a, i) => a === attachments[i]);
    const option = lo.cleanOption({
        attachments,
        // Slot names stay only with the same list; core reads new ones off the catalogue.
        attachmentSlots: sameList ? before.attachmentSlots : [],
        shareCode: mode === 'MP' ? code : '',
        imageKey: picture.imageKey,
        imageVersion: picture.imageVersion ?? (sameKey ? before.imageVersion : null),
        sourceHash: picture.sourceHash ?? (sameKey ? before.sourceHash : null),
        label: src && from > 0 ? (src.variants[from - 1].label || '') : '',
    });
    const target = (doc) => ({ id: String(doc._id), mode: doc.mode });
    const removeFrom = (doc, i) => (lo.optionsOf(doc).length > 1
        ? { type: 'loadout.options', target: target(doc), payload: lo.optionsToFields(lo.removeAt(lo.optionsOf(doc), i)) }
        : { type: 'loadout.delete', target: target(doc) });

    const ops = [];
    if (plan.kind === 'self') {
        let options = lo.optionsOf(src);
        options[from] = option;
        if (plan.to !== from) options = lo.move(options, from, plan.to);
        ops.push({ type: 'loadout.options', target: target(src), payload: { ...lo.optionsToFields(options), category: ident.category, label, ...badges } });
    } else if (plan.kind === 'join' || plan.kind === 'add') {
        // Removed from its build first, so the build it joins never holds the same code twice inside the transaction.
        if (src) ops.push(removeFrom(src, from));
        ops.push({ type: 'loadout.options', target: target(plan.dest), payload: lo.optionsToFields(lo.insertAt(lo.optionsOf(plan.dest), option, plan.to)) });
    } else {
        ops.push(removeFrom(src, from));
        ops.push({ type: 'loadout.add', payload: {
            weaponName, label, buildNumber: plan.number, mode, attachments, imageKey: option.imageKey, category: ident.category, ...badges,
            ...(option.attachmentSlots.length ? { attachmentSlots: option.attachmentSlots } : {}),
            ...(mode === 'MP' ? { shareCode: code } : {}),
            ...(option.sourceHash ? { sourceHash: option.sourceHash } : {}),
            ...(option.imageVersion ? { imageVersion: option.imageVersion } : {}),
        } });
    }
    const result = await commitSet([...ops, ...learnOps(unknown, { category: ident.category, mode })], { actorId: interaction.user.id });
    if (!result.ok) return await fail(extractCommitError(result));

    const L = lo.optionLetter;
    const tagOf = (n, i) => `\`${lo.optionTag(n, i)}\``;
    const notes = [];
    let savedId, shown, moveLine = null;
    if (plan.kind === 'self') {
        savedId = String(src._id); shown = plan.to;
        if (plan.to !== from) {
            moveLine = `${tagOf(plan.number, from)} → ${tagOf(plan.number, plan.to)}`;
            notes.push(`Option ${L(from)} is now Option ${L(plan.to)}, and the old Option ${L(plan.to)} is now Option ${L(from)}.`);
        }
    } else if (plan.kind === 'join' || plan.kind === 'add') {
        savedId = String(plan.dest._id); shown = plan.to;
        if (src) {
            moveLine = `${tagOf(plan.srcNumber, from)} → ${tagOf(plan.number, plan.to)}`;
            notes.push(lo.optionsOf(src).length > 1 ? `It left Build ${plan.srcNumber}, whose later options moved up a letter.` : `Build ${plan.srcNumber} is now this option, so it is gone from the list.`);
        }
        notes.push(`The weapon box, label and badges stay Build ${plan.number}'s.`);
    } else {
        savedId = String(result.results[1].applied.id); shown = 0;
        moveLine = `${tagOf(plan.srcNumber, from)} → ${tagOf(plan.number, 0)}`;
        notes.push(`It left Build ${plan.srcNumber} and is now its own build. Build ${plan.srcNumber}'s later options moved up a letter.`);
        for (const m of result.results[1].applied.moved || []) {
            const other = await Loadout.findById(m.id).select('buildName').lean();
            notes.push(`Swapped: the build that was Build ${plan.number} is now ${other?.buildName || 'moved'}.`);
        }
    }
    if (picture.note) notes.push(picture.note);
    if (unknown.count) notes.push(`Added to the catalogue: ${describeUnknown(unknown)}.`);
    const saved = await Loadout.findById(savedId).lean();
    const warns = alerts.split('\n').filter(Boolean).map(l => l.replace(`${BOT_EMOJI.warn} `, ''));
    const view = saved && variantView(saved, shown);
    if (view && !picture.uploaded && isRealImageKey(view.imageKey) && !(await require('../../utils/loadoutRender').checkImageExists(view.imageKey))) {
        warns.push(`**No picture on Cloudinary** at \`${view.imageKey}\`: the card shows broken until one is added with Edit again.`);
    }
    if (!saved) return await interaction.followUp({ content: `${BOT_EMOJI.checkmark} Saved.` });
    const { savedPanel } = require('../../utils/loadoutPanels');
    // `before` is the option as it was (an added option had none), so What changed reads like a build's.
    return interaction.followUp({ flags: 32768 | 64, components: savedPanel({ doc: saved, option: shown, before: before ? { ...before, buildName: src.buildName } : null, moveLine, changeIds: result.changeIds, notes, warnings: warns, pictureReplaced: Boolean(picture.replaced) }) });
}

// --- SAVE A LOADOUT (Add or Edit) --- custom_ids: add_loadout_{MP|DMZ} · edit_loadout_{id}. One body for both since the five-field pop-up (2026-10-26 01:19 EDT): the two had drifted into near copies. `preset` is a Save anyway replay (handleCatalogueWarning above): the typed values come from the warning's pending store instead of a pop-up, and the catalogue check is skipped because the admin already saw it.
async function saveLoadout(interaction, preset, isEdit) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });
    const { parseLoadoutBadges, correctGunsmithCode, gunsmithCodeProblem } = require('../../utils/adminParser');
    const { checkImageExists, isPlaceholderBuild } = require('../../utils/loadoutRender');
    const { isHttpImageSource, isRealImageKey } = require('../../utils/loadoutImageCache');
    const form = require('../../utils/loadoutForm');
    const Loadout = require('../../models/Loadout');
    const field = fieldReader(interaction, preset);
    const customId = preset ? preset.customId : interaction.customId;
    const fail = failer(interaction, preset);

    // Mode is not editable here (MP and DMZ are separate panel pages): an edit reads it off the build, an add off the page's custom_id.
    let existing = null, targetId = null, targetOption = 0, mode;
    if (isEdit) {
        ({ id: targetId, option: targetOption } = splitTarget(customId.replace('edit_loadout_', '')));
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
    // A merged build, or a build # with a letter (`2b`), is saved option by option (planOptionSave below). A plain build saves as it always has.
    const optionPath = isEdit ? (targetOption > 0 || (existing.variants || []).length > 0 || ident.lettered) : ident.lettered;
    let plan = null;
    if (optionPath) {
        plan = planOptionSave({ existing, targetId, targetOption, ident, weaponKey, siblings });
        if (plan.error) return await fail(plan.error);
    }
    // The same code twice on one weapon is the same attachments twice, so the same build. Every option's code counts; the option being saved is not its own clash.
    const lo = require('../../utils/loadoutOptions');
    const clash = code && siblings.find(b => lo.optionsOf(b).some((o, i) => form.sameCode(o.shareCode, code) && !(String(b._id) === targetId && (!optionPath || i === targetOption))));
    if (clash) return await fail(`${clash.weaponName} ${clash.buildName} already has the code \`${code}\`, and the same code is the same build. Edit that one instead.`);
    // An edit that renames the weapon joins the other weapon's builds as a new one would.
    const inPool = isEdit && siblings.some(b => String(b._id) === targetId);
    const numbering = optionPath ? { number: ident.number } : form.planNumbering({ siblings, targetId: inPool ? targetId : null, wanted: ident.number });
    if (numbering.error) return await fail(numbering.error);

    // A code that looks cut off asks first (Harkirat, 2026-10-28 01:06 EDT), so a lost last O is caught before it saves.
    const acks = preset?.acks || [];
    const codeProblem = mode === 'MP' && code ? gunsmithCodeProblem(code) : null;
    if (codeProblem && !acks.includes('code')) {
        const held = shotOf(interaction, preset);
        return await warnCutCode(interaction, { customId, acks, values: { ...readValues(field, LOADOUT_FIELDS), ...(held ? { [SHOT_KEY]: held.url } : {}) } }, [`\`${code}\`: ${codeProblem}.`]);
    }

    // Checked BEFORE the picture, so Back to edit never leaves an uploaded image behind a build that was not saved.
    const shot = shotOf(interaction, preset);
    const unknown = await findUnknownNames({ weaponName, attachments });
    if (unknown.count && !acks.includes('catalogue')) {
        return await warnUnknownNames(interaction, { customId, acks, values: { ...readValues(field, LOADOUT_FIELDS), ...(shot ? { [SHOT_KEY]: shot.url } : {}) } }, unknown);
    }
    const url = field('image_url').trim();
    if (url && shot) return await fail('Use the image URL or the screenshot, not both.');
    if (url && !isHttpImageSource(url)) return await fail('The image box takes a link starting with https://. Picture keys come from the gunsmith code now, so a key is never typed.');
    // An option's picture is that option's: an edit compares against the option, and an added option has none yet.
    const pictureOf = optionPath ? plan.before : existing;
    const picture = await resolvePicture({ existing: pictureOf, mode, weaponName, code, attachments, url, shot, targetId, choice: preset?.pictureChoice || null });
    if (picture.error) return await fail(picture.error);
    if (picture.ask) return await warnOldPicture(interaction, { customId, acks: [...acks, 'catalogue'], values: readValues(field, LOADOUT_FIELDS) }, pictureOf.imageKey, pictureOf);
    if (optionPath) {
        return await saveOption(interaction, { plan, picture, fail, unknown, mode, weaponName, label, code, attachments, ident,
            badges: { isMeta, categoryRank, dmzRangeRank, isToxic, isAss, rankModes }, alerts: badgeNotes(unrecognized, warnings) });
    }

    // The number goes to core as `buildNumber`, and core names the build and swaps the one holding it (core/ops/loadouts.js numberBuild, 2026-10-26 12:17 EDT), the same rule the portal gets. The check above only answers early with a clear message.
    const payload = {
        weaponName, label, buildNumber: numbering.number, mode, attachments, imageKey: picture.imageKey,
        category: ident.category, isMeta, categoryRank, dmzRangeRank, isToxic, isAss, rankModes,
        ...(mode === 'MP' ? { shareCode: code } : {}),
        ...(picture.sourceHash ? { sourceHash: picture.sourceHash } : {}),
        // Cloudinary's version of the picture just uploaded, so the card's URL changes with it (utils/loadoutRender.js pictureVersion).
        ...(picture.imageVersion ? { imageVersion: picture.imageVersion } : {}),
    };
    const result = await commitSet(
        [isEdit ? { type: 'loadout.edit', target: { id: targetId }, payload } : { type: 'loadout.add', payload },
         ...learnOps(unknown, { category: ident.category, mode })],
        { actorId: interaction.user.id }
    );
    if (!result.ok) return await fail(extractCommitError(result));

    // The answer is the build as it now stands, with what changed and the next steps as buttons (Harkirat, 2026-10-26 11:54 EDT: "better visual information ... so things aren't being second guessed, and there's like buttons as well").
    const savedId = isEdit ? targetId : result.results[0].applied.id;
    const saved = await Loadout.findById(savedId).lean();
    const notes = [];
    if (picture.note) notes.push(picture.note);
    // A swap core made: the other build, by where it went.
    for (const m of result.results[0].applied.moved || []) {
        const other = await Loadout.findById(m.id).select('buildName').lean();
        notes.push(`Swapped: the build that was ${saved.buildName} is now ${other?.buildName || 'moved'}.`);
    }
    if (unknown.count) notes.push(`Added to the catalogue: ${describeUnknown(unknown)}.`);
    const alerts = [...badgeNotes(unrecognized, warnings).split('\n').filter(Boolean).map(l => l.replace(`${BOT_EMOJI.warn} `, ''))];
    // Real Cloudinary existence check: a key with no picture saves fine and only shows later as a broken card. Advisory only. Skipped right after an upload, whose HEAD probe would race Cloudinary's CDN.
    if (!picture.uploaded && isRealImageKey(picture.imageKey) && !(await checkImageExists(picture.imageKey))) {
        alerts.push(`**No picture on Cloudinary** at \`${picture.imageKey}\`: the card shows broken until one is added with Edit again.`);
    }
    const { savedPanel } = require('../../utils/loadoutPanels');
    return interaction.followUp({ flags: 32768 | 64, components: savedPanel({ doc: saved, before: existing, changeIds: result.changeIds, notes, warnings: alerts, pictureReplaced: Boolean(picture.replaced) }) });
}

// --- A SAVED LOADOUT'S BUTTONS --- custom_ids: mng_ldopen_{id} · mng_ldedit_{id} · mng_ldrevert|{changeId,...}. Stateless, so they keep working after a restart. The router's /manage lock has already run; Revert is gated per change by the same check /bot analytics' Revert uses (utils/adminAccess.js checkRevert), which core/revert.js runs again.
async function handleSavedAction(interaction) {
    const id = interaction.customId;
    const Loadout = require('../../models/Loadout');
    if (id.startsWith('mng_ldopen_')) return await require('../../utils/openLoadoutCard').openLoadout(interaction, id.replace('mng_ldopen_', ''), { ephemeral: true });
    if (id.startsWith('mng_ldedit_')) {
        const t = splitTarget(id.replace('mng_ldedit_', ''));
        const doc = await Loadout.findById(t.id).lean();
        if (!doc) return await interaction.reply({ content: `${BOT_EMOJI.cross} That build no longer exists.`, ephemeral: true });
        return await interaction.showModal(await editLoadoutModal(doc, Math.min(t.option, (doc.variants || []).length)));
    }
    // Add option: the Create New pop-up, filled with this build's weapon and its next option's tag (`2d`) and the attachments of the option on show, so a variation is a few edits away. The code and the picture are left for the new option's own.
    if (id.startsWith('mng_ldaddopt_')) {
        const t = splitTarget(id.replace('mng_ldaddopt_', ''));
        const doc = await Loadout.findById(t.id).lean();
        if (!doc) return await interaction.reply({ content: `${BOT_EMOJI.cross} That build no longer exists.`, ephemeral: true });
        const form = require('../../utils/loadoutForm');
        const lo = require('../../utils/loadoutOptions');
        const siblings = await Loadout.find({ weaponKey: doc.weaponKey, mode: doc.mode }).lean();
        const count = 1 + (doc.variants || []).length;
        if (count >= lo.MAX_OPTIONS) return await interaction.reply({ content: `${BOT_EMOJI.cross} ${doc.weaponName} ${doc.buildName} already has ${lo.MAX_OPTIONS} options, the most a build can have.`, ephemeral: true });
        const tag = lo.optionTag(form.numberFor(doc, siblings) ?? 1, count);
        const view = require('../../utils/loadoutRender').variantView(doc, t.option);
        const manage = require('../../commands/manage');
        return await interaction.showModal(manage.prefillModal(manage.buildAddLoadoutModal(doc.mode || 'MP'), {
            weapon: doc.label ? `${doc.weaponName}, ${doc.label}` : doc.weaponName,
            build: doc.mode === 'DMZ' ? `${doc.category}, ${tag}` : `${doc.category}, ${tag}, `,
            attachments: (view.attachments || []).join('\n'),
        }));
    }
    if (id.startsWith('mng_ldcredit_')) {
        const doc = await Loadout.findById(id.replace('mng_ldcredit_', '')).lean();
        if (!doc) return await interaction.reply({ content: `${BOT_EMOJI.cross} That build no longer exists.`, ephemeral: true });
        return await interaction.showModal(creditModal(doc));
    }
    // Revert is shared with the draw, event and season panels (handlers/manage/results.js).
    const changeIds = id.replace('mng_ldrevert|', '').split(',').filter(Boolean);
    return await require('./results').revertChanges(interaction, changeIds, 'the build is back as it was.\n-# The picture keys the save made stay on Cloudinary');
}

// --- CREDIT (Harkirat, 2026-11-02 23:10 EST: @user, a plain username, a hyperlink or anonymous, prefixed "Submitted by", "Credit:" or "Build by") --- The pop-up behind a build's Credit button. Five boxes, Discord's limit: how it shows, the prefix, a Discord user, a name, a link. Only this pop-up can set a hyperlink (utils/loadoutCredit.js). Saved through core's loadout.credit, so the answer carries Revert. Raw API JSON, as the Edit pop-up is (a select inside a Label).
function creditModal(doc) {
    const { CREDIT_MAX, URL_MAX, submissionCredit } = require('../../utils/loadoutCredit');
    // A build with no credit field yet shows what its footer shows now: the submitter it falls back to.
    const c = doc.credit?.show ? doc.credit : doc.submittedBy?.discordId ? submissionCredit(doc.submittedBy) : null;
    const userId = c?.discordId || doc.submittedBy?.discordId || null;
    const opt = (label, value, on) => ({ label, value, default: Boolean(on) });
    return {
        custom_id: `mng_ldcreditm_${doc._id}`, title: `Credit: ${doc.weaponName} ${doc.buildName}`.slice(0, 45),
        components: [
            { type: 18, label: 'Show as', description: 'No credit hides the line; a submitted build still reads By anonymous',
              component: { type: 3, custom_id: 'show', required: true, min_values: 1, max_values: 1, options: [
                  opt('@user (clickable)', 'user', c?.show === 'user'), opt('Username (plain text)', 'name', c?.show === 'name'),
                  opt('Hyperlink', 'link', c?.show === 'link'), opt('By anonymous', 'anonymous', c?.show === 'anonymous'), opt('No credit', 'none', !c || c.show === 'none')] } },
            { type: 18, label: 'Prefix', description: 'Not used for anonymous',
              component: { type: 3, custom_id: 'prefix', required: false, min_values: 0, max_values: 1, options: [
                  opt('Submitted by', 'submitted', !c?.prefix || c.prefix === 'submitted'), opt('Credit:', 'credit', c?.prefix === 'credit'), opt('Build by', 'buildby', c?.prefix === 'buildby')] } },
            { type: 18, label: 'Discord user', description: 'For @user; for Username, their username is used when Name is empty',
              component: { type: 5, custom_id: 'user', required: false, min_values: 0, max_values: 1, ...(userId ? { default_values: [{ id: userId, type: 'user' }] } : {}) } },
            { type: 18, label: 'Name', description: 'The plain-text name, or the hyperlink\'s text',
              component: { type: 4, custom_id: 'name', style: 1, required: false, max_length: CREDIT_MAX, ...(c?.name ? { value: c.name } : {}) } },
            { type: 18, label: 'Link', description: 'For Hyperlink only: https://…',
              component: { type: 4, custom_id: 'url', style: 1, required: false, max_length: URL_MAX, ...(c?.url ? { value: c.url } : {}) } },
        ],
    };
}

async function saveCredit(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const Loadout = require('../../models/Loadout');
    const { normalizeCredit } = require('../../utils/loadoutCredit');
    const id = interaction.customId.replace('mng_ldcreditm_', '');
    const before = await Loadout.findById(id).lean();
    if (!before) return await interaction.followUp({ content: `${BOT_EMOJI.cross} That build no longer exists.` });
    const get = (fn) => { try { return fn(); } catch { return null; } };
    const show = (get(() => interaction.fields.getStringSelectValues('show')) || [])[0] || 'none';
    const prefix = (get(() => interaction.fields.getStringSelectValues('prefix')) || [])[0] || 'submitted';
    const user = get(() => interaction.fields.getSelectedUsers('user')?.first()) || null;
    const typed = (get(() => interaction.fields.getTextInputValue('name')) || '').trim();
    const url = (get(() => interaction.fields.getTextInputValue('url')) || '').trim();
    const fail = (msg) => interaction.followUp({ content: `${BOT_EMOJI.cross} ${msg} Nothing was changed.` });
    if (user?.bot) return await fail('That is a bot, not a player.');
    if (show === 'user' && !user) return await fail('Pick the Discord user for @user.');
    if (url && show !== 'link') return await fail('A link only shows with **Hyperlink**. Pick Hyperlink, or empty the Link box.');
    const { credit, error } = normalizeCredit({ show, prefix, discordId: user?.id, name: typed || (show === 'name' && user ? user.username : ''), url });
    if (error) return await fail(error);
    const result = await commitSet([{ type: 'loadout.credit', target: { id, mode: before.mode }, payload: { credit } }], { actorId: interaction.user.id });
    if (!result.ok) return await fail(extractCommitError(result));
    const saved = await Loadout.findById(id).lean();
    const { savedPanel } = require('../../utils/loadoutPanels');
    return interaction.followUp({ flags: 32768 | 64, components: savedPanel({ doc: saved, before, changeIds: result.changeIds }) });
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
    const { parseBulkLoadoutList, correctGunsmithCode, gunsmithCodeProblem } = require('../../utils/adminParser');
    const parsed = parseBulkLoadoutList(bulkText).parsed;
    // Codes that look cut off ask first, as a single save does (Harkirat, 2026-10-28 01:06 EDT).
    const acks = preset?.acks || [];
    const cut = pageMode === 'MP' ? parsed.map(p => ({ p, code: p.shareCode ? correctGunsmithCode(String(p.shareCode).trim()) : '' })).filter(x => x.code && gunsmithCodeProblem(x.code)) : [];
    if (cut.length && !acks.includes('code')) {
        return await warnCutCode(interaction, { customId, acks, values: readValues(field, ['bulk_text']) }, cut.map(x => `**${x.p.weaponName}**: \`${x.code}\``));
    }
    const unknown = { weapon: null, attachments: [], count: 0, weapons: [] };
    const seen = new Set();
    for (const p of parsed) {
        const u = await findUnknownNames({ weaponName: p.weaponName, attachments: p.attachments });
        if (u.weapon && !seen.has(`w|${normKey(u.weapon)}`)) { seen.add(`w|${normKey(u.weapon)}`); unknown.weapons.push({ name: u.weapon, category: p.category }); }
        for (const a of u.attachments) if (!seen.has(`a|${normKey(a)}`)) { seen.add(`a|${normKey(a)}`); unknown.attachments.push(a); }
    }
    unknown.count = unknown.weapons.length + unknown.attachments.length;
    if (unknown.count && !acks.includes('catalogue')) {
        return await warnUnknownNames(interaction, { customId, acks, values: readValues(field, ['bulk_text']) },
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

    // Counts first, then what was skipped and what is missing a picture (2026-10-26 11:54 EDT, the panel the single saves use).
    const { bulkPanel } = require('../../utils/loadoutPanels');
    return interaction.followUp({ flags: 32768 | 64, components: bulkPanel({ mode: pageMode, created: applied.created, updated: applied.updated, learned: learn.map(i => i.name), skipped: applied.parseErrors, missingImages: applied.missingImages }) });
}

// --- BULK DELETE LOADOUTS --- custom_id: modal_loadouts_bulk_remove_{MP|DMZ} Lines are "Weapon" (removes every build of that weapon) or "Weapon | Build Name" (removes just that one build). Dry-run only -- the confirmed delete targets the exact ids collected here rather than re-matching titles at commit time, same reasoning as draws.js/calendar.js's bulk-delete routes.
async function bulkDeleteLoadouts(interaction) {
    const { fuzzyMatch } = require('../../utils/search');
    const { registerBulkDelete } = require('./shared');
    const Loadout = require('../../models/Loadout');
    const mode = interaction.customId.replace('modal_loadouts_bulk_remove_', '');
    const lines = interaction.fields.getTextInputValue('lines').split('\n').map(l => l.trim()).filter(Boolean);

    const toDelete = []; // { label, ids }
    const optionCuts = new Map(); // build id -> { doc, indexes:Set } (one option of a merged build, `Weapon | 2b`)
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
            // `2` is Build 2, and `2b` only Build 2's Option B (merged builds, 2026-11-05).
            const tag = /^(?:build\s*)?(\d+)([a-z])?$/i.exec(buildPart);
            const name = tag ? `Build ${Number(tag[1])}` : buildPart;
            const option = tag?.[2] ? tag[2].toLowerCase().charCodeAt(0) - 97 : null;
            const buildDoc = candidates.find(l => l.weaponKey === match.weaponKey && l.mode === mode && l.buildName === name);
            const count = buildDoc ? 1 + (buildDoc.variants || []).length : 0;
            if (buildDoc && option !== null && count > 1) {
                if (option >= count) { notFound.push(`${weaponPart} | ${buildPart} (${name} has ${count} options)`); continue; }
                const cut = optionCuts.get(String(buildDoc._id)) || { doc: buildDoc, indexes: new Set() };
                cut.indexes.add(option);
                optionCuts.set(String(buildDoc._id), cut);
            } else if (buildDoc) toDelete.push({ label: `${match.weaponName} (${buildPart})`, ids: [String(buildDoc._id)] });
            else notFound.push(`${weaponPart} | ${mode} | ${buildPart}`);
        } else {
            const docs = candidates.filter(l => l.weaponKey === match.weaponKey && l.mode === mode);
            toDelete.push({ label: `${match.weaponName} (all ${docs.length} build(s))`, ids: docs.map(d => String(d._id)) });
        }
    }

    // Options of a build that is going anyway need no cut; a build losing every option is deleted.
    const lo = require('../../utils/loadoutOptions');
    const optionOps = [];
    const going = new Set(toDelete.flatMap(t => t.ids));
    for (const [id, { doc, indexes }] of optionCuts) {
        if (going.has(id)) continue;
        const left = lo.optionsOf(doc).filter((_, i) => !indexes.has(i));
        const tags = [...indexes].sort().map(i => lo.optionLetter(i)).join(', ');
        if (!left.length) { toDelete.push({ label: `${doc.weaponName} (${doc.buildName}, every option)`, ids: [id] }); continue; }
        optionOps.push({ type: 'loadout.options', target: { id, mode: doc.mode }, payload: lo.optionsToFields(left) });
        toDelete.push({ label: `${doc.weaponName} (${doc.buildName}, Option ${tags})`, ids: [] });
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
                [...optionOps, ...(ids.length ? [{ type: 'loadout.bulkDelete', target: { mode }, payload: { ids } }] : [])],
                { actorId: interaction.user.id }
            );
            if (!result.ok) throw new Error(extractCommitError(result));
            return result.changeIds;   // for the Revert button under the result (handlers/manage/index.js)
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
    // One option of a merged build (the search's `2b`, utils/loadoutForm.js pickBuildOption): only that option goes and the later ones move up a letter. The build's last option is the build, so it deletes the build.
    const { id, option } = splitTarget(match.id);
    if (match.option != null || option) {
        const Loadout = require('../../models/Loadout');
        const lo = require('../../utils/loadoutOptions');
        const doc = await Loadout.findById(id).lean();
        const options = lo.optionsOf(doc);
        const i = match.option ?? option;
        if (doc && options.length > 1 && i < options.length) {
            const result = await commitSet([{ type: 'loadout.options', target: { id, mode: doc.mode }, payload: lo.optionsToFields(lo.removeAt(options, i)) }], { actorId });
            if (!result.ok) throw new Error(extractCommitError(result));
            return result.changeIds;
        }
    }
    // `mode` rides on the target so core/changeset.js's pageForOp stamps the ChangeLog row with the RIGHT page: MP and DMZ share this op, and without it every DMZ delete was recorded as MP, which then gated its Revert on the wrong page.
    const result = await commitSet([{ type: 'loadout.delete', target: { id, ...(match.doc?.mode ? { mode: match.doc.mode } : {}) } }], { actorId });
    if (!result.ok) throw new Error(extractCommitError(result));
    return result.changeIds;   // for the Revert button under "Deleted" (handlers/manage/index.js)
}

module.exports = { editLoadout, addLoadout, editLoadoutModal, splitTarget, planOptionSave, creditModal, saveCredit, pictureWarningPanel, handleSavedAction, bulkAddLoadouts, handleCatalogueWarning, bulkDeleteLoadouts, exportUpTo5, exportCategory, deleteItem };
