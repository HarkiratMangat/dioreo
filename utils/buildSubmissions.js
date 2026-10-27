// utils/buildSubmissions.js -- Submit a Build and Dispute a Build (Harkirat's /gunsmith review, 2026-10-25 16:40-17:08 EDT).
//
// SUBMIT: the No build yet card's "Submit a Build" opens a pop-up (the weapon, a screenshot (preferred, not required), the Gunsmith Code, attachments and notes, and whether to show their name). Dioreo Admin DMs it to the owner with Read Screenshot (only when one is attached) / Approve / Deny. Read Screenshot opens the usual /autobuild review; Approve opens a pop-up of their fields to fix typos first (his pick). Whichever way the build is saved, utils/autobuildPipeline.js's confirmCore writes it with `submittedBy` and calls onSaved here, which DMs the submitter a thank-you. Deny closes it with no DM.
//
// DISPUTE: /help's Gunsmith page carries "Dispute a Build" (his "help only"): which build, Remove it or Credit me, a link to their original post, their original screenshot (optional), notes. Dioreo Admin DMs it to the owner with Remove build / Change credit (credits the person disputing, his call) / Deny / More info, and the person disputing is DMed for every outcome he picks (his option C, offered beside /help's "or DM <@owner>").
//
// ⚠️ THESE ARE PROACTIVE DMs, the third and fourth exceptions to CLAUDE.md's "answers ONLY through interactions" invariant: to the OWNER (each submission or dispute), and to the player who submitted or disputed (only about their own submission or dispute, and only when he acts). Never a channel, never anyone else. Every DM goes out with no allowed mentions.
//
// One submission or dispute per person every 10 minutes, counted from the stored records (models/BuildSubmission.js, models/BuildDispute.js, both kept 90 days).
const { Routes } = require('discord.js');
const BuildSubmission = require('../models/BuildSubmission');
const BuildDispute = require('../models/BuildDispute');
const { ALLOWED_ADMIN_ID, isOwnerId } = require('./owner');
const emojis = require('./emojiMap');
const { runWithContext, getContext } = require('./requestContext');

const RATE_MS = 10 * 60 * 1000;
const label = (text, description, component) => ({ type: 18, label: text, ...(description ? { description } : {}), component });
const idOf = (doc) => String(doc._id);

// ---- the two clients: Dioreo Admin DMs the owner (his ask, 2026-10-25 16:59 EDT), the public app DMs players (they may not have the admin app) ----
function adminOrPublic() {
    const { clients } = require('../bot/clients');
    return clients.admin || clients.public;
}
function publicApp() {
    const { clients } = require('../bot/clients');
    return clients.public || clients.admin;
}
async function dmChannel(client, userId) {
    return client.rest.post(Routes.userChannels(), { body: { recipient_id: userId } });
}
// Emoji ids belong to one app, and emojiMap answers for the app handling the click. A DM sent by the OTHER app must be composed under that app's id, or its emojis show as text: found click-testing 2026-10-25 18:04 EDT, when the thank-you DM, sent by Dioreo after an Approve clicked on Dioreo Admin's card, read ":Checkmark:". So DM bodies are passed as functions and built here, under the id of the app that sends them.
function composeAs(client, build) {
    if (typeof build !== 'function') return build;
    const appId = client?.application?.id ?? client?.user?.id ?? null;
    return runWithContext({ ...(getContext() || {}), appId }, build);
}
// Sends a Components V2 card to the owner, from Dioreo Admin, falling back to the public app if Dioreo Admin cannot open the DM. Returns { channelId, message, client }.
async function dmOwner(body, files = []) {
    const tried = [adminOrPublic(), publicApp()].filter((c, i, a) => c && a.indexOf(c) === i);
    let lastError;
    for (const client of tried) {
        try {
            const dm = await dmChannel(client, ALLOWED_ADMIN_ID);
            const message = await client.rest.post(Routes.channelMessages(dm.id), { body: { ...composeAs(client, body), allowed_mentions: { parse: [] } }, files });
            return { channelId: dm.id, message, client };
        } catch (err) { lastError = err; }
    }
    throw lastError || new Error('no client to DM the owner');
}
// A plain DM to a player from the public app. Never throws: a player who blocks DMs only misses the note.
async function dmPlayer(userId, content) {
    try {
        const client = publicApp();
        const dm = await dmChannel(client, userId);
        await client.rest.post(Routes.channelMessages(dm.id), { body: { content: composeAs(client, content), allowed_mentions: { parse: [] } } });
        return true;
    } catch (err) {
        console.error('Could not DM a player about their build submission or dispute:', err?.message || err);
        return false;
    }
}
async function recentFrom(userId) {
    const since = new Date(Date.now() - RATE_MS);
    const [s, d] = await Promise.all([BuildSubmission.findOne({ discordId: userId, createdAt: { $gt: since } }).sort({ createdAt: -1 }).lean(), BuildDispute.findOne({ discordId: userId, createdAt: { $gt: since } }).sort({ createdAt: -1 }).lean()]);
    const last = [s, d].filter(Boolean).sort((a, b) => b.createdAt - a.createdAt)[0];
    return last ? Math.floor((new Date(last.createdAt).getTime() + RATE_MS) / 1000) : null;
}
// The 10-minute check above and the create that follows are separate database calls, with a file fetch between them, so two pop-ups sent at once could both pass the check (security review, 2026-10-25 17:37 EDT). The bot is one process, so a per-user claim taken before the first await makes the check and the create one step; the second pop-up is turned away while the first is still sending.
const inFlight = new Set();
async function oneAtATime(interaction, run) {
    const id = interaction.user.id;
    if (inFlight.has(id)) {
        try { await interaction.reply({ content: `${emojis.cross} Your last one is still sending. Try again in a moment.`, ephemeral: true }); } catch (e) { console.error('Failed to answer a second submission sent at once:', e); }
        return;
    }
    inFlight.add(id);
    try { return await run(interaction); } finally { inFlight.delete(id); }
}
// Answers a person still inside their 10 minutes and returns true; false lets them through. The Submit a Build and Dispute a Build buttons call it too, before their pop-up opens, so nobody fills in a form only to be turned away (found click-testing 2026-10-25 18:07 EDT); the pop-up's save checks again.
async function rateLimitReply(interaction, wait) {
    if (!wait) return false;
    try { await interaction.reply({ content: `${emojis.cross} You can send one build or dispute every 10 minutes. Try again <t:${wait}:R>.`, ephemeral: true }); } catch (e) { console.error('Failed to answer a rate-limited submission or dispute:', e); }
    return true;
}
// The uploaded file as something to re-send: its bytes and a name. Null when none, or when it cannot be fetched.
async function fileFrom(interaction, id) {
    let file = null;
    try { file = [...(interaction.fields.getUploadedFiles(id)?.values() || [])][0] || null; } catch { file = null; }
    if (!file) return null;
    try {
        const res = await fetch(file.url, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) return null;
        const ext = (String(file.name || '').match(/\.(png|jpe?g|webp|gif)$/i) || [, 'png'])[1].toLowerCase();
        return { name: `shot.${ext}`, data: Buffer.from(await res.arrayBuffer()) };
    } catch { return null; }
}
const text = (interaction, id) => { try { return (interaction.fields.getTextInputValue(id) || '').trim(); } catch { return ''; } };
const pick = (interaction, id) => { try { return interaction.fields.getStringSelectValues(id) || []; } catch { return []; } };

// ---- SUBMIT ----

function submitModal({ mode = 'MP', weaponName = '', category = '' }) {
    return {
        title: 'Submit a Build', custom_id: `gsb~subsave~${mode}~${category || ''}`,
        components: [
            label('Weapon', null, { type: 4, custom_id: 'weapon', style: 1, required: true, max_length: 60, ...(weaponName ? { value: weaponName } : {}) }),
            label('Screenshot', 'Preferred: a Gunsmith screenshot of the build', { type: 19, custom_id: 'shot', min_values: 0, max_values: 1, required: false }),
            ...(mode === 'DMZ' ? [] : [label('Gunsmith Code', 'Optional', { type: 4, custom_id: 'code', style: 1, required: false, max_length: 30 })]),
            label('Attachments and notes', 'Attachments one per line; anything else after a blank line', { type: 4, custom_id: 'details', style: 2, required: false, max_length: 1500 }),
            label('Credit', 'Your Discord ID is kept privately so disputes can be checked, even if you stay anonymous', { type: 3, custom_id: 'credit', required: true, min_values: 1, max_values: 1,
                options: [{ label: 'Show my name on the build', value: 'yes' }, { label: 'Stay anonymous', value: 'no' }] }),
        ],
    };
}

// "Attachments one per line; anything else after a blank line". Pure.
function parseDetails(raw) {
    const blocks = String(raw || '').replace(/\r/g, '').split(/\n\s*\n/);
    const attachments = (blocks.shift() || '').split('\n').map(l => l.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim()).filter(Boolean).slice(0, 9);
    return { attachments, notes: blocks.join('\n\n').trim().slice(0, 1000) };
}

function submissionCard(sub, { imageUrl = null, state = sub.status, note = null } = {}) {
    const { getMpCategoryAccent } = require('./loadoutRender');
    const head = `## Build submitted: ${sub.weaponName}\n-# ${[sub.mode, sub.category].filter(Boolean).join(' · ')} · from <@${sub.discordId}> · ${sub.credited ? 'wants their name shown' : 'anonymous'}`;
    const body = [];
    body.push(sub.attachments.length ? `### Attachments\n${sub.attachments.map((a, i) => `${i + 1}. \`${a}\``).join('\n')}` : '*No attachments typed.*');
    if (sub.gunsmithCode) body.push(`### Gunsmith Code: \`${sub.gunsmithCode}\``);
    if (sub.notes) body.push(sub.notes.split('\n').map(l => `> ${l}`).join('\n'));
    const parts = [{ type: 10, content: head }, { type: 14, spacing: 1, divider: true }, { type: 10, content: body.join('\n') }];
    if (imageUrl) parts.push({ type: 14, spacing: 1, divider: false }, { type: 12, items: [{ media: { url: imageUrl } }] });
    parts.push({ type: 14, spacing: 2, divider: true });
    const id = idOf(sub);
    if (state === 'pending') {
        parts.push({ type: 1, components: [
            ...(sub.hasScreenshot ? [{ type: 2, style: 2, label: 'Read Screenshot', custom_id: `gsb~sub~read~${id}` }] : []),
            { type: 2, style: 3, label: 'Approve', custom_id: `gsb~sub~ok~${id}` },
            { type: 2, style: 4, label: 'Deny', custom_id: `gsb~sub~no~${id}` },
        ] });
        if (note) parts.push({ type: 10, content: `-# ${note}` });
    } else {
        const when = sub.resolvedAt ? ` <t:${Math.floor(new Date(sub.resolvedAt).getTime() / 1000)}:R>` : '';
        parts.push({ type: 10, content: state === 'approved' ? `${emojis.checkmark} **Approved**${when}${note ? ` · ${note}` : ''}` : `${emojis.cross} **Denied**${when}` });
    }
    return [{ type: 17, accent_color: getMpCategoryAccent(sub.category), components: parts }];
}

async function handleSubmitSave(interaction) { return oneAtATime(interaction, sendSubmission); }
async function sendSubmission(interaction) {
    const [, , mode = 'MP', category = ''] = interaction.customId.split('~');
    if (await rateLimitReply(interaction, await recentFrom(interaction.user.id))) return;
    await interaction.deferReply({ ephemeral: true });
    const shot = await fileFrom(interaction, 'shot');
    const { attachments, notes } = parseDetails(text(interaction, 'details'));
    const sub = await BuildSubmission.create({
        discordId: interaction.user.id, mode: mode === 'DMZ' ? 'DMZ' : 'MP', category: category || null,
        weaponName: text(interaction, 'weapon').toUpperCase().slice(0, 60), gunsmithCode: mode === 'DMZ' ? '' : text(interaction, 'code').toUpperCase().replace(/\s+/g, ''),
        attachments, notes, credited: pick(interaction, 'credit')[0] === 'yes', hasScreenshot: Boolean(shot),
    });
    try {
        const files = shot ? [shot] : [];
        const sent = await dmOwner(() => ({ flags: 32768, components: submissionCard(sub, { imageUrl: shot ? `attachment://${shot.name}` : null }) }), files);
        await BuildSubmission.updateOne({ _id: sub._id }, { $set: { dmChannelId: sent.channelId, dmMessageId: sent.message.id } });
    } catch (err) {
        console.error('Could not DM the owner a build submission:', err?.message || err);
        await BuildSubmission.deleteOne({ _id: sub._id });
        await interaction.editReply({ content: `${emojis.cross} Your build could not be sent just now. Please try again later.` });
        return;
    }
    await interaction.editReply({ content: `${emojis.checkmark} Sent to Dioreo, thanks! You'll get a DM if your **${sub.weaponName}** build is added.` });
}

// The screenshot on the owner's DM card, fresh: Discord's links expire, so it is read off the message the button sits on.
const cardImageUrl = (interaction) => interaction.message?.attachments?.first?.()?.url || null;

async function loadPending(interaction, Model, id) {
    if (!isOwnerId(interaction.user.id)) {
        try { await interaction.reply({ content: `${emojis.cross} Only Dioreo's developer can act on this.`, ephemeral: true }); } catch (e) { console.error(e); }
        return null;
    }
    const doc = await Model.findById(id).catch(() => null);
    if (!doc) {
        try { await interaction.reply({ content: `${emojis.cross} That one is no longer stored (records are kept 90 days).`, ephemeral: true }); } catch (e) { console.error(e); }
        return null;
    }
    return doc;
}

// Read Screenshot / Approve / Deny on the owner's DM card: `gsb~sub~<read|ok|no>~<id>`.
async function handleSubmissionButton(interaction) {
    const [, , action, id] = interaction.customId.split('~');
    const sub = await loadPending(interaction, BuildSubmission, id);
    if (!sub) return;
    if (sub.status !== 'pending') {
        try { await interaction.reply({ content: `This submission was already ${sub.status}.`, ephemeral: true }); } catch (e) { console.error(e); }
        return;
    }
    const pipeline = require('./autobuildPipeline');
    if (action === 'ok') return interaction.showModal(approveModal(sub));
    if (action === 'no') {
        await interaction.deferUpdate();
        sub.status = 'denied'; sub.resolvedAt = new Date(); await sub.save();
        const { sendV2Payload } = require('./sendV2Payload');
        return sendV2Payload(interaction, submissionCard(sub, { imageUrl: cardImageUrl(interaction) }), { skipExpiry: true });
    }
    if (action === 'read') {
        const url = cardImageUrl(interaction);
        if (!url) {
            try { await interaction.reply({ content: `${emojis.cross} This submission has no screenshot to read.`, ephemeral: true }); } catch (e) { console.error(e); }
            return;
        }
        await interaction.deferReply();
        let data;
        try {
            data = await pipeline.extractToData(url, { explicitMode: sub.mode, explicitCategory: sub.category || null, adminId: interaction.user.id });
        } catch (err) {
            return interaction.editReply({ content: `${emojis.cross} Couldn't read that screenshot: ${err.message}` });
        }
        if (!data.gunsmithCode && sub.gunsmithCode) data.gunsmithCode = sub.gunsmithCode;
        data.submission = { id: idOf(sub), discordId: sub.discordId, credited: sub.credited };
        const token = require('crypto').randomBytes(8).toString('hex');
        pipeline.pendingAutobuilds.set(token, data);
        setTimeout(() => pipeline.pendingAutobuilds.delete(token), 60 * 60 * 1000).unref();
        const card = pipeline.buildReviewCard(token, data);
        const { sendV2Payload } = require('./sendV2Payload');
        return sendV2Payload(interaction, card.components, { flags: card.flags });
    }
}

// Approve opens their fields first, so a typo can be fixed before it saves (his pick, 2026-10-25 17:08 EDT).
function approveModal(sub) {
    const field = (custom_id, value, style = 1, max = 100, required = false) => ({ type: 4, custom_id, style, required, max_length: max, ...(value ? { value } : {}) });
    return {
        title: `Approve: ${sub.weaponName}`.slice(0, 45), custom_id: `gsb~subok~${idOf(sub)}`,
        components: [
            label('Weapon | Category', 'e.g. AK117 | AR', field('wc', `${sub.weaponName} | ${sub.category || ''}`.trim(), 1, 80, true)),
            // The code is needed on MP (2026-10-26 01:19 EDT: the picture is keyed by it), so a submission without one saves only once it is typed here.
            label('Build Label | Gunsmith Code', sub.mode === 'DMZ' ? 'Label optional, e.g. Ranked' : 'Label optional; the code is needed, e.g. | 1C2B4A8B9A', field('lc', sub.gunsmithCode ? `| ${sub.gunsmithCode}` : '', 1, 80)),
            label('Attachments', 'One per line', field('att', sub.attachments.join('\n'), 2, 1000, true)),
            label('Badges', 'Optional, e.g. meta, best, hp', field('badges', '', 1, 100)),
        ],
    };
}

async function handleApproveSave(interaction) {
    const id = interaction.customId.split('~')[2];
    const sub = await loadPending(interaction, BuildSubmission, id);
    if (!sub) return;
    await interaction.deferReply({ ephemeral: true });
    if (sub.status !== 'pending') return interaction.editReply({ content: `This submission was already ${sub.status}.` });
    const { normalizeWeaponName, correctGunsmithCode } = require('./adminParser');
    const [weaponRaw, categoryRaw] = text(interaction, 'wc').split('|').map(s => s.trim());
    const [labelRaw, codeRaw] = (text(interaction, 'lc') + '|').split('|').map(s => s.trim());
    const attachments = text(interaction, 'att').split('\n').map(s => s.trim()).filter(Boolean).slice(0, sub.mode === 'DMZ' ? 9 : 5);
    const slots = sub.mode === 'DMZ' ? attachments.map(() => '') : await require('./catalogue').slotsFor(attachments);
    const data = {
        weaponName: normalizeWeaponName(weaponRaw || sub.weaponName), category: String(categoryRaw || sub.category || '').toUpperCase() || null, mode: sub.mode,
        gunsmithCode: sub.mode === 'DMZ' ? '' : correctGunsmithCode(codeRaw || ''), attachments, attachmentSlots: slots.length === attachments.length ? slots : attachments.map(() => ''),
        badgesRaw: text(interaction, 'badges'), buildLabel: labelRaw || '', sourceImageUrl: cardImageUrl(interaction), adminId: interaction.user.id,
        submission: { id: idOf(sub), discordId: sub.discordId, credited: sub.credited },
    };
    const pipeline = require('./autobuildPipeline');
    const token = require('crypto').randomBytes(8).toString('hex');
    pipeline.pendingAutobuilds.set(token, data);
    const result = await pipeline.confirmCore(token);
    if (result.status === 'saved') return interaction.editReply({ content: `${emojis.checkmark} Saved **${result.doc.weaponName}** (${result.doc.buildName}). The submitter was thanked by DM.` });
    pipeline.pendingAutobuilds.delete(token);
    return interaction.editReply({ content: pipeline.confirmMessage(interaction.client, result) });
}

// Called by autobuildPipeline.js's confirmCore once a submitted build is saved, however it was saved. Never throws.
async function onSaved(submission, doc) {
    try {
        const sub = await BuildSubmission.findById(submission.id);
        if (!sub) return;
        sub.status = 'approved'; sub.resolvedAt = new Date(); sub.loadoutId = String(doc._id); await sub.save();
        const { mentionCommand } = require('./commandMentions');
        await dmPlayer(sub.discordId, () => `${emojis.checkmark} Thanks! Your **${doc.weaponName}** build is now in Dioreo. Find it with ${mentionCommand(publicApp(), `/gunsmith ${doc.mode === 'DMZ' ? 'dmz' : 'mp'}`)}${sub.credited ? ', with your name on it' : ''}.`);
        // The owner's DM card shows it was approved.
        if (sub.dmChannelId && sub.dmMessageId) {
            const client = adminOrPublic();
            const msg = await client.rest.get(Routes.channelMessage(sub.dmChannelId, sub.dmMessageId)).catch(() => null);
            const imageUrl = msg?.attachments?.[0]?.url || null;
            await client.rest.patch(Routes.channelMessage(sub.dmChannelId, sub.dmMessageId), { body: { flags: 32768, components: submissionCard(sub, { imageUrl, note: `saved as ${doc.buildName}` }), allowed_mentions: { parse: [] } } }).catch(err => console.error('Could not mark a submission card approved:', err?.message || err));
        }
    } catch (err) {
        console.error('Build submission follow-up failed (the build itself is saved):', err?.message || err);
    }
}

// ---- DISPUTE ----

function disputeModal() {
    return {
        title: 'Dispute a Build', custom_id: 'gsb~dissave',
        components: [
            label('Which build', 'The weapon and build, e.g. AK117 Build 2', { type: 4, custom_id: 'build', style: 1, required: true, max_length: 60 }),
            label('What you want', null, { type: 3, custom_id: 'ask', required: true, min_values: 1, max_values: 1, options: [{ label: 'Remove the build', value: 'remove' }, { label: 'Credit me instead', value: 'credit' }] }),
            label('Proof', 'A link to your original post, from before the build went live', { type: 4, custom_id: 'proof', style: 1, required: true, max_length: 300 }),
            label('Your original screenshot', 'Optional', { type: 19, custom_id: 'shot', min_values: 0, max_values: 1, required: false }),
            label('Notes', null, { type: 4, custom_id: 'notes', style: 2, required: false, max_length: 1000 }),
        ],
    };
}

// "AK117 Build 2" -> the build, or null. Pure parse, then the lookup /gunsmith uses.
function parseBuildText(raw) {
    const m = /^(.*?)(?:\s*[-,#]?\s*build\s*#?\s*(\d+))?\s*$/i.exec(String(raw || '').trim());
    return { name: (m && m[1] || '').trim(), number: m && m[2] ? Number(m[2]) : null };
}
async function findBuild(raw) {
    const { name, number } = parseBuildText(raw);
    if (!name) return null;
    const { resolveWeapon } = require('./loadoutLookup');
    for (const mode of ['MP', 'DMZ']) {
        const found = await resolveWeapon(mode, name).catch(() => ({}));
        if (found.builds && found.builds.length) {
            const list = found.builds;
            return (number && list[number - 1]) || list.find(b => b.submittedBy && b.submittedBy.discordId) || list[0];
        }
    }
    return null;
}

function disputeCard(dis, build, { imageUrl = null, state = dis.status, note = null } = {}) {
    const { getMpCategoryAccent } = require('./loadoutRender');
    const wants = dis.ask === 'credit' ? 'credit instead' : 'removal';
    const who = build ? (build.submittedBy && build.submittedBy.discordId ? `submitted by <@${build.submittedBy.discordId}>${build.submittedBy.credited ? '' : ' (anonymous to players)'}` : 'not a submitted build') : 'build not found';
    const lines = [
        `## Build dispute: ${dis.buildText}`,
        `-# From <@${dis.discordId}> · wants ${wants}`,
    ];
    const body = [
        `**Build:** ${build ? `${build.weaponName} (${build.buildName}, ${build.mode === 'DMZ' ? 'DMZ' : build.category}), ${who}` : '*Could not match a build to that text.*'}`,
        `**Proof:** ${dis.proofUrl}`,
        ...(dis.notes ? [dis.notes.split('\n').map(l => `> ${l}`).join('\n')] : []),
    ];
    const parts = [{ type: 10, content: lines.join('\n') }, { type: 14, spacing: 1, divider: true }, { type: 10, content: body.join('\n') }];
    if (imageUrl) parts.push({ type: 14, spacing: 1, divider: false }, { type: 12, items: [{ media: { url: imageUrl } }] });
    parts.push({ type: 14, spacing: 2, divider: true });
    const id = idOf(dis);
    if (state === 'pending') {
        parts.push({ type: 1, components: [
            { type: 2, style: 4, label: 'Remove build', custom_id: `gsb~dis~rm~${id}`, disabled: !build },
            { type: 2, style: 1, label: 'Change credit', custom_id: `gsb~dis~credit~${id}`, disabled: !build },
            { type: 2, style: 2, label: 'Deny', custom_id: `gsb~dis~no~${id}` },
            { type: 2, style: 2, label: 'More info', custom_id: `gsb~dis~info~${id}` },
        ] });
        if (note) parts.push({ type: 10, content: `-# ${note}` });
    } else {
        const word = { removed: 'Build removed', credited: 'Credit changed to them', denied: 'Denied' }[state] || state;
        parts.push({ type: 10, content: `${state === 'denied' ? emojis.cross : emojis.checkmark} **${word}**${dis.resolvedAt ? ` <t:${Math.floor(new Date(dis.resolvedAt).getTime() / 1000)}:R>` : ''}` });
    }
    return [{ type: 17, accent_color: getMpCategoryAccent(build ? build.category : null), components: parts }];
}

async function handleDisputeSave(interaction) { return oneAtATime(interaction, sendDispute); }
async function sendDispute(interaction) {
    if (await rateLimitReply(interaction, await recentFrom(interaction.user.id))) return;
    await interaction.deferReply({ ephemeral: true });
    const shot = await fileFrom(interaction, 'shot');
    const buildText = text(interaction, 'build');
    const build = await findBuild(buildText);
    const dis = await BuildDispute.create({
        discordId: interaction.user.id, buildText, loadoutId: build ? String(build._id) : null, ask: pick(interaction, 'ask')[0] === 'credit' ? 'credit' : 'remove',
        proofUrl: text(interaction, 'proof'), notes: text(interaction, 'notes'), hasScreenshot: Boolean(shot),
    });
    try {
        const sent = await dmOwner(() => ({ flags: 32768, components: disputeCard(dis, build, { imageUrl: shot ? `attachment://${shot.name}` : null }) }), shot ? [shot] : []);
        await BuildDispute.updateOne({ _id: dis._id }, { $set: { dmChannelId: sent.channelId, dmMessageId: sent.message.id } });
    } catch (err) {
        console.error('Could not DM the owner a build dispute:', err?.message || err);
        await BuildDispute.deleteOne({ _id: dis._id });
        await interaction.editReply({ content: `${emojis.cross} Your dispute could not be sent just now. Please try again later.` });
        return;
    }
    await interaction.editReply({ content: `${emojis.checkmark} Sent to Dioreo. You'll get a DM with the outcome.` });
}

// Remove build / Change credit / Deny / More info: `gsb~dis~<rm|credit|no|info>~<id>`. Every outcome DMs the person who disputed (his option C).
async function handleDisputeButton(interaction) {
    const [, , action, id] = interaction.customId.split('~');
    const dis = await loadPending(interaction, BuildDispute, id);
    if (!dis) return;
    if (dis.status !== 'pending') {
        try { await interaction.reply({ content: `This dispute was already ${dis.status}.`, ephemeral: true }); } catch (e) { console.error(e); }
        return;
    }
    if (action === 'info') return interaction.showModal({ title: 'Ask for more info', custom_id: `gsb~disinfo~${id}`, components: [label('What do you need from them?', null, { type: 4, custom_id: 'note', style: 2, required: true, max_length: 1000 })] });
    await interaction.deferUpdate();
    const Loadout = require('../models/Loadout');
    const build = dis.loadoutId ? await Loadout.findById(dis.loadoutId).lean() : null;
    const what = build ? `the **${build.weaponName}** build (${build.buildName})` : `"${dis.buildText}"`;
    if (action === 'rm' && build) {
        const { commitSet } = require('../core/changeset');
        const done = await commitSet([{ type: 'loadout.delete', target: { id: String(build._id) } }], { actorId: interaction.user.id });
        if (!done || done.ok === false) {
            try { await interaction.followUp({ content: `${emojis.cross} The build could not be removed: ${done?.error || 'unknown error'}.`, ephemeral: true }); } catch (e) { console.error(e); }
            return;
        }
        dis.status = 'removed';
        await dmPlayer(dis.discordId, () => `${emojis.checkmark} Your dispute about ${what} was upheld: the build was removed from Dioreo.`);
    } else if (action === 'credit' && build) {
        await Loadout.updateOne({ _id: build._id }, { $set: { submittedBy: { discordId: dis.discordId, credited: true } } });
        dis.status = 'credited';
        await dmPlayer(dis.discordId, () => `${emojis.checkmark} Your dispute about ${what} was upheld: the build now credits you.`);
    } else if (action === 'no') {
        dis.status = 'denied';
        await dmPlayer(dis.discordId, () => `Your dispute about ${what} was looked at, and the build stays as it is. If you have more proof, you can DM <@${ALLOWED_ADMIN_ID}>.`);
    } else {
        return;
    }
    dis.resolvedAt = new Date(); await dis.save();
    const { sendV2Payload } = require('./sendV2Payload');
    return sendV2Payload(interaction, disputeCard(dis, build, { imageUrl: cardImageUrl(interaction) }), { skipExpiry: true });
}

async function handleDisputeInfo(interaction) {
    const id = interaction.customId.split('~')[2];
    const dis = await loadPending(interaction, BuildDispute, id);
    if (!dis) return;
    await interaction.deferUpdate();
    const note = text(interaction, 'note');
    const sent = await dmPlayer(dis.discordId, () => `About your dispute on "${dis.buildText}", Dioreo needs a little more:\n> ${note.split('\n').join('\n> ')}\nPlease DM <@${ALLOWED_ADMIN_ID}> with it.`);
    const build = dis.loadoutId ? await require('../models/Loadout').findById(dis.loadoutId).lean() : null;
    const { sendV2Payload } = require('./sendV2Payload');
    return sendV2Payload(interaction, disputeCard(dis, build, { imageUrl: cardImageUrl(interaction), note: sent ? 'Asked them for more info.' : 'Could not DM them (their DMs may be closed).' }), { skipExpiry: true });
}

module.exports = {
    submitModal, parseDetails, submissionCard, handleSubmitSave, handleSubmissionButton, approveModal, handleApproveSave, onSaved,
    disputeModal, parseBuildText, disputeCard, handleDisputeSave, handleDisputeButton, handleDisputeInfo, RATE_MS, oneAtATime, composeAs, recentFrom, rateLimitReply,
    // utils/feedback.js (/help's Bugs & Suggestions) DMs the owner the same way.
    dmOwner, fileFrom,
};
