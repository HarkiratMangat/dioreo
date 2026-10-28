// utils/loadoutPanels.js
//
// The panels /manage's loadout flow answers with (Harkirat, 2026-10-26 11:46 EDT: "even the confirmation messages and stuff, can you make them like as an embed so they at least look nice? And maybe like actually provide like better visual information into them. So like things aren't being second guessed, and there's like buttons as well, like actions like, oh, like open the loadout, ... or edit it again"). Pure: each takes plain data and returns Components V2 JSON, so scripts/loadoutPanels.test.js pins them without Discord or Mongo.
//
// Every panel shows the build the way it now stands, with its picture beside it when it has a real one, so a wrong picture or a wrong build is visible at a glance; an edit lists only what changed, old value struck through. The buttons do the next thing without the four hops back through /manage: Open (the real /gunsmith card, privately), Edit again (the pop-up, straight from the button), and Revert (every change the save made, newest first).
const emojis = require('./emojiMap');

const ACCENT = { MP: 16725040, DMZ: 3373990 };   // commands/manage.js PAGE_ACCENT loadouts_mp / loadouts_dmz
const WARN_ACCENT = 0xF0B232;
const FAIL_ACCENT = 0xED4245;

const isRealPicture = (key) => Boolean(key) && !/^(https?:|PENDING-UPLOAD-)/i.test(String(key));
const code = (s) => `\`${String(s).replace(/`/g, 'ˋ')}\``;

// One header block: the title and summary lines, with the build's picture as the accessory when it has one.
function headerBlock(title, lines, imageKey) {
    const content = [title, ...lines.filter(Boolean)].join('\n');
    if (!isRealPicture(imageKey)) return { type: 10, content };
    const { buildImageUrl } = require('./loadoutRender');
    return { type: 9, components: [{ type: 10, content }], accessory: { type: 11, media: { url: buildImageUrl(imageKey) } } };
}

// "AR · Build 2 · Ranked · `1C2B4A8B9A`" and the badges, the same facts the Edit pop-up holds.
function identityLines(doc) {
    const { loadoutBadgeTokens } = require('./adminParser');
    const badges = loadoutBadgeTokens(doc);
    return [
        `-# ${[doc.category, doc.buildName, doc.label, doc.shareCode && code(doc.shareCode)].filter(Boolean).join(' · ')}`,
        badges.length ? `-# Badges: ${badges.join(', ')}` : null,
    ];
}

const attachmentList = (doc) => (doc.attachments || []).map((a, i) => `${i + 1}. ${a}`).join('\n');

// What an edit changed, field by field. `before` is the stored build, `after` what was saved.
function changeLines(before, after) {
    if (!before) return [];
    const { loadoutBadgeTokens } = require('./adminParser');
    const out = [];
    const was = (a, b, name) => { if ((a || '') !== (b || '')) out.push(`**${name}:** ${a ? `~~${a}~~ → ` : ''}${b || '*none*'}`); };
    was(before.weaponName, after.weaponName, 'Weapon');
    was(before.label, after.label, 'Label');
    was(before.buildName, after.buildName, 'Build #');
    was(before.category, after.category, 'Category');
    was(before.shareCode, after.shareCode, 'Code');
    const oldA = before.attachments || [], newA = after.attachments || [];
    const added = newA.filter(a => !oldA.includes(a)), removed = oldA.filter(a => !newA.includes(a));
    if (added.length || removed.length) out.push(`**Attachments:** ${[...added.map(a => `+ ${a}`), ...removed.map(a => `− ~~${a}~~`)].join(' · ')}`);
    else if (oldA.join('|') !== newA.join('|')) out.push('**Attachments:** reordered');
    was(loadoutBadgeTokens(before).join(', '), loadoutBadgeTokens(after).join(', '), 'Badges');
    if ((before.imageKey || '') !== (after.imageKey || '')) out.push(`**Picture:** ${isRealPicture(after.imageKey) ? code(after.imageKey) : '*none*'}`);
    return out;
}

// The buttons under a saved build. `changeIds` are every ChangeLog row the save wrote; they ride in the Revert id, which stays inside Discord's 100 characters for any real save (ids are like `#147`).
function actionRow(doc, changeIds = []) {
    const id = String(doc._id);
    const revertId = `mng_ldrevert|${changeIds.join(',')}`;
    return { type: 1, components: [
        { type: 2, style: 2, label: 'Open in /gunsmith', custom_id: `mng_ldopen_${id}`, emoji: emojis.parseEmoji(emojis.search) },
        { type: 2, style: 1, label: 'Edit again', custom_id: `mng_ldedit_${id}`, emoji: emojis.parseEmoji(emojis.edit) },
        ...(changeIds.length && revertId.length <= 100 ? [{ type: 2, style: 4, label: 'Revert', custom_id: revertId }] : []),
    ] };
}

// A saved build: `before` is null for an add. `notes` are side effects (a swap, a moved picture, names learned); `warnings` need a look.
function savedPanel({ doc, before = null, changeIds = [], notes = [], warnings = [] }) {
    const verb = before ? 'Updated' : 'Added';
    const changes = changeLines(before, doc);
    const components = [
        headerBlock(`### ${emojis.checkmark} ${verb} · ${doc.weaponName} ${doc.buildName}`, identityLines(doc), doc.imageKey),
        { type: 14, divider: true, spacing: 1 },
    ];
    if (before) components.push({ type: 10, content: changes.length ? `**What changed**\n${changes.map(c => `- ${c}`).join('\n')}` : '-# Nothing changed.' });
    components.push({ type: 10, content: `**Attachments**\n${attachmentList(doc)}` });
    // Side notes carry his Info mark (2026-10-26 12:46 EDT).
    if (notes.length) components.push({ type: 10, content: notes.map(n => `-# ${emojis.info} ${n}`).join('\n') });
    if (warnings.length) components.push({ type: 10, content: warnings.map(w => `${emojis.warn} ${w}`).join('\n') });
    components.push({ type: 14, divider: false, spacing: 1 }, actionRow(doc, changeIds));
    return [{ type: 17, accent_color: ACCENT[doc.mode] || ACCENT.MP, components }];
}

// The delete confirmation for one build: the build itself, so the right one goes.
function deletePanel({ doc, token }) {
    return [{ type: 17, accent_color: FAIL_ACCENT, components: [
        headerBlock(`### ${emojis.warn} Delete ${doc.weaponName} ${doc.buildName}?`, [...identityLines(doc), '-# Every change is recorded and can be reverted.'], doc.imageKey),
        { type: 10, content: `**Attachments**\n${attachmentList(doc)}` },
        { type: 1, components: [
            { type: 2, style: 2, label: 'Cancel', custom_id: `mng_delcancel_${token}` },
            { type: 2, style: 4, label: 'Yes, delete', custom_id: `mng_delconfirm_${token}`, emoji: emojis.parseEmoji(emojis.deleteBin) },
        ] },
    ] }];
}

// A bulk paste's result: the counts first, then what was skipped and what is missing a picture.
function bulkPanel({ mode, created, updated, learned = [], skipped = [], missingImages = [] }) {
    const lines = [`### ${emojis.checkmark} Bulk ${mode} import done`, `**${created}** added · **${updated}** updated${skipped.length ? ` · **${skipped.length}** skipped` : ''}`];
    if (learned.length) lines.push(`-# Added to the catalogue: ${learned.map(code).join(', ')}`);
    const components = [{ type: 10, content: lines.join('\n') }];
    if (skipped.length) components.push({ type: 14, divider: true, spacing: 1 }, { type: 10, content: `${emojis.warn} **Skipped**\n${skipped.map(s => `- ${s}`).join('\n')}`.slice(0, 3800) });
    if (missingImages.length) components.push({ type: 10, content: `${emojis.warn} **No picture on Cloudinary**\n${missingImages.map(m => `- ${m.label}: ${code(m.imageKey)}`).join('\n')}`.slice(0, 3800) });
    return [{ type: 17, accent_color: skipped.length ? WARN_ACCENT : (ACCENT[mode] || ACCENT.MP), components }];
}

// Names the catalogue does not know yet, before anything is saved.
function cataloguePanel({ described, token }) {
    return [{ type: 17, accent_color: WARN_ACCENT, components: [
        { type: 10, content: `### ${emojis.warn} Not in the catalogue yet\n${described}\n-# A typo, or a new item? **Save anyway** saves it as typed and adds these names, so they won't warn again. **Back to edit** reopens the box with what you typed.` },
        { type: 1, components: [
            { type: 2, style: 2, label: 'Back to edit', custom_id: `mng_catedit|${token}`, emoji: emojis.parseEmoji(emojis.edit) },
            { type: 2, style: 3, label: 'Save anyway', custom_id: `mng_catok|${token}`, emoji: emojis.parseEmoji(emojis.checkmark) },
        ] },
    ] }];
}

// A gunsmith code that looks cut off, before anything is saved (Harkirat, 2026-10-28 01:06 EDT). `lines` is one line per code.
function codePanel({ lines, token }) {
    const one = lines.length === 1;
    return [{ type: 17, accent_color: WARN_ACCENT, components: [
        { type: 10, content: `### ${emojis.warn} ${one ? 'This code looks' : 'These codes look'} cut off\n${lines.join('\n')}\n-# The game draws O like 0, so a last O is easy to lose. **Back to edit** reopens the box with what you typed; **Save anyway** saves it as it is.` },
        { type: 1, components: [
            { type: 2, style: 2, label: 'Back to edit', custom_id: `mng_codeedit|${token}`, emoji: emojis.parseEmoji(emojis.edit) },
            { type: 2, style: 3, label: 'Save anyway', custom_id: `mng_codeok|${token}`, emoji: emojis.parseEmoji(emojis.checkmark) },
        ] },
    ] }];
}

// A small one-line panel: "Saving…", a revert result, an expired button.
const notePanel = (text, accent) => [{ type: 17, ...(accent ? { accent_color: accent } : {}), components: [{ type: 10, content: text }] }];

module.exports = { savedPanel, deletePanel, bulkPanel, cataloguePanel, codePanel, notePanel, changeLines, actionRow, isRealPicture, ACCENT, WARN_ACCENT, FAIL_ACCENT };
