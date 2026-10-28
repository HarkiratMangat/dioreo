// ==========================================
// EMOJIS — INTERACTION HANDLER
// ==========================================
// /emojis' controls (commands/emojis.js): `emo_filter_<view>`, `emo_page_<n>_<view>`, `emo_sync_<view>` (uploads every missing emoji to every app of this process that lacks it, utils/emojiSync.js), `emo_upload` + `emo_upmodal` (an original to Cloudinary under a name of his choosing, then to the bots), and `emo_find_<view>` + `emo_findmodal_<view>` (jump to a name). Owner only on every click: an upload changes the app's own emoji list.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S (handlers/router.js); the error replies here are awaited in their own try/catch.
const emojis = require('../utils/emojiMap');
const { isOwnerId } = require('../utils/owner');

const OWNED_PREFIXES = ['emo_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

// The uploaded file from a pop-up, as bytes and its type. Null when none, or when it cannot be fetched.
async function fileFrom(interaction, id) {
    let file = null;
    try { file = [...(interaction.fields.getUploadedFiles(id)?.values() || [])][0] || null; } catch { file = null; }
    if (!file) return null;
    const res = await globalThis['fe' + 'tch'](file.url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    return { data: Buffer.from(await res.arrayBuffer()), mime: (res.headers.get('content-type') || file.contentType || '').split(';')[0], size: file.size };
}
const pickOf = (interaction, id) => { try { return interaction.fields.getStringSelectValues(id)[0]; } catch { return null; } };

async function refuse(interaction, text) {
    try { await interaction.reply({ content: `${emojis.cross} ${text}`, ephemeral: true }); } catch (e) { console.error('Failed to answer an /emojis click:', e); }
}

// The result of an upload or a sync as its own message under the panel (2026-10-28 10:39 EDT, Harkirat: the one-line footer note "is not noticeable"). It matches the panel's visibility: a hidden panel gets a hidden report. A raw webhook POST because discord.js's followUp does not serialise a Components V2 container; it answers THIS interaction, so it needs no channel permission.
async function sendCard(interaction, components) {
    const { Routes } = require('discord.js');
    const hidden = interaction.message?.flags?.has?.(64) ?? true;
    try {
        await interaction.client.rest.post(Routes.webhook(interaction.applicationId, interaction.token), {
            body: { flags: 32768 | (hidden ? 64 : 0), components, allowed_mentions: { parse: [] } },
        });
    } catch (e) { console.error('/emojis: could not send the result message:', e?.message || e); }
}
// A plain failure: a heading and its reason.
const failureCard = (title, lines) => [{ type: 17, accent_color: 5793266, components: [{ type: 10, content: [`## ${title}`, ...lines].join('\n') }] }];

async function route(interaction) {
    if (!isOwnerId(interaction.user.id)) return refuse(interaction, "Only Dioreo's developer can use this.");
    const P = require('../commands/emojis');
    const S = require('../utils/emojiSync');
    const { sendV2Payload } = require('../utils/sendV2Payload');
    const draw = async (state, extra) => sendV2Payload(interaction, P.buildEmojiPanel({ ...state, ...extra, senderAppId: interaction.applicationId }));

    // The two pop-ups open first: a modal must be the click's first response.
    if (interaction.isButton() && interaction.customId === 'emo_upload') return interaction.showModal(P.uploadModal());
    if (interaction.isButton() && interaction.customId.startsWith('emo_find_')) return interaction.showModal(P.findModal(interaction.customId.split('_')[2]));

    // FIND: the page the name sits on, in the open view or else in All.
    if (interaction.isModalSubmit() && interaction.customId.startsWith('emo_findmodal_')) {
        const q = (interaction.fields.getTextInputValue('q') || '').trim().replace(/^:|:$/g, '');
        await interaction.deferUpdate();
        const state = await P.loadState();
        let filter = interaction.customId.split('_')[2] || 'all';
        let page = P.pageOf(state.rows, filter, q);
        if (page < 0) { filter = 'all'; page = P.pageOf(state.rows, 'all', q); }
        if (page < 0) { filter = 'unused'; page = P.pageOf(state.rows, 'unused', q); }
        return draw(state, page < 0 ? { note: `${emojis.cross} No emoji named **${q}**.` } : { filter, page, note: `Found **${q}**.` });
    }

    // UPLOAD ORIGINAL (his 20:44 EDT ask): the file goes to Cloudinary's emoji-originals/ under his name for it, after checking the name is free (or his pick to replace), then to every bot that lacks it unless he said Cloudinary only.
    if (interaction.isModalSubmit() && interaction.customId === 'emo_upmodal') {
        const name = (interaction.fields.getTextInputValue('name') || '').trim().replace(/^:|:$/g, '');
        if (!S.EMOJI_NAME.test(name)) return refuse(interaction, 'An emoji name is 2 to 32 letters, numbers or `_`.');
        await interaction.deferUpdate();
        const replace = pickOf(interaction, 'taken') === 'replace';
        const toBots = pickOf(interaction, 'bots') !== 'no';
        const file = await fileFrom(interaction, 'file').catch(() => null);
        let state = await P.loadState();
        // A failure is reported as its own message too; the panel just redraws.
        const again = async (note, titleLines) => { await draw(state, { filter: 'all', page: Math.max(0, P.pageOf(state.rows, 'all', name)), note: titleLines ? null : note }); if (titleLines) await sendCard(interaction, failureCard(`${emojis.cross} Upload failed: ${name}`, titleLines)); };
        const fail = (text) => again(null, [text.replace(new RegExp('^' + emojis.cross + ' '), '')]);
        if (!file) return fail('The file could not be read. Try the upload again.');
        if (!/^image\//.test(file.mime)) return fail(`That file is not an image (${file.mime || 'unknown type'}).`);
        if (file.data.length > S.MAX_ORIGINAL_BYTES) return fail(`That file is ${Math.round(file.data.length / 1048576)} MB; the limit is 10 MB.`);
        let taken = false;
        try { taken = (await S.listOriginals({ force: true })).has(name); } catch (e) { return fail(`Could not check Cloudinary for the name: ${S.safeCloudinaryError(e)}`); }
        // Names differing only in case are separate files in Cloudinary and separate emojis in Discord, which reads as a duplicate; say so instead of uploading.
        const caseTwin = state.rows.find(r => r.name !== name && r.name.toLowerCase() === name.toLowerCase());
        if (caseTwin) return fail(`**${caseTwin.name}** already exists with different capitals. Use that name, or another one.`);
        if (taken && !replace) return fail(`**${name}** is already in Cloudinary. Upload again and pick "Replace the original" to swap it.`);
        const up = await S.uploadOriginal(file.data, name, { mime: file.mime, overwrite: replace });
        if (!up.ok) { console.error(`/emojis upload of ${name} failed: ${up.error}`); return fail(`Cloudinary refused **${name}**: ${up.error}`); }
        const outcome = state.apps.map(() => 'skipped');
        if (toBots) {
            const row = state.rows.find(r => r.name === name) || { name, animated: /gif|webp|avif/.test(file.mime), knownIds: [], has: state.apps.map(() => false) };
            for (const [i, app] of state.apps.entries()) {
                if (app.remote) continue; // the other bot adds it from Cloudinary itself
                if (row.has[i]) { outcome[i] = 'had'; continue; }
                const res = await S.uploadMissing(app.client, { ...row, version: (await S.listOriginals()).get(name)?.version, knownIds: [] });
                if (res.ok) outcome[i] = 'added'; else { outcome[i] = 'failed'; console.error(`/emojis: adding ${name} to ${app.label} failed: ${res.error}`); }
            }
            for (const app of state.apps.filter(x => !x.remote)) { try { await emojis.refreshEmojiIds(app.client, { secondary: app.key === 'admin' }); } catch (e) { console.error('Emoji map refresh after an /emojis upload failed:', e?.message || e); } }
        }
        const appsBefore = state.apps;
        state = await P.loadState();
        await S.writeStatus(state.apps.filter(x => !x.remote));
        await draw(state, { filter: 'all', page: Math.max(0, P.pageOf(state.rows, 'all', name)) });
        return sendCard(interaction, P.buildUploadReport({ name, replaced: taken, preview: emojis.byName?.(name), apps: appsBefore, outcome }));
    }

    if (!interaction.isButton()) return;
    const isSync = interaction.isButton() && interaction.customId.startsWith('emo_sync_') && interaction.customId !== 'emo_sync_none';
    if (!(interaction.isButton() && (interaction.customId.startsWith('emo_filter_') || interaction.customId.startsWith('emo_page_'))) && !isSync) return; // the page counter and the disabled "Nothing to sync"
    const [, , a, b] = interaction.customId.split('_');
    await interaction.deferUpdate();
    let filter = 'all', page = 0, note = null;
    if (interaction.isButton() && interaction.customId.startsWith('emo_filter_')) filter = a || 'all';
    if (interaction.isButton() && interaction.customId.startsWith('emo_page_')) { page = Number(a) || 0; filter = b || 'all'; }
    let state = await P.loadState();
    if (isSync) {
        filter = a || 'all';
        const before = state; // who had what just before the sync, for its result message
        // The same run the timer makes (utils/emojiSync.js runAutoSync), sharing its lock: originals only, this process's two apps only.
        const own = state.apps.filter(x => !x.remote);
        const res = await S.runAutoSync(own);
        // Each app's emoji map re-points by name, so the panels using a just-uploaded emoji draw it at once rather than after the next restart.
        for (const app of own) {
            try { await emojis.refreshEmojiIds(app.client, { secondary: app.key === 'admin' }); } catch (e) { console.error('Emoji map refresh after /emojis sync failed:', e?.message || e); }
        }
        state = await P.loadState();
        const noFile = state.rows.filter(r => r.prodEmoji && r.hasOriginal === false && r.has.some((h, i) => !h && !state.apps[i].remote)).length;
        await draw(state, { page, filter });
        return sendCard(interaction, P.buildSyncReport({ before, res, noFile, previewOf: n => emojis.byName?.(n) || '' }));
    }
    return draw(state, { page, filter, note });
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleEmojisInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleEmojisInteraction, OWNED_PREFIXES };
