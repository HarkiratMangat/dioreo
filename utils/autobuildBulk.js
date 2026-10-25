// utils/autobuildBulk.js Bulk /autobuild: several Gunsmith screenshots read in one go and reviewed one page per build (Harkirat, 2026-10-20 10:15 EDT, pick "A": both the right-click and /autobuild's extra screenshot slots; 10:24 EDT: the right-click picker stays and takes several picks). Spec: local/project/features/launch-extras/spec.md (gitignored; the decisions are restated in .claude/rules/autobuild.md).
//
// Every build in a batch is an ordinary /autobuild review: its `data` lives in utils/autobuildPipeline.js's pendingAutobuilds under its own token, and reading, saving and editing go through that file's shared halves (extractToData, confirmCore, applyEditFields), so a batch build is saved exactly the way a single one is. This file only holds the batch around them: which builds, in what order, which page is showing, and what happened to each.
//
// Custom ids are `autobuild_b|<action>|<batchKey>|<index>`. The `autobuild_` prefix routes them to handlers/autobuild.js and puts them behind handlers/router.js's /autobuild access check, the same as the single review's buttons.
//
// After his first click-test (2026-10-20 12:10 EDT): the overview lists every build with what needs a look, the pager is the bot's usual arrows (utils/paginationRow.js), the buttons say Save / Adjust / Discard and name the build, and a batch started from the right-click can take more of that message's screenshots (Add more).
const BOT_EMOJI = require('./emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const crypto = require('crypto');
const { pendingAutobuilds, pendingImageRetries, buildReviewCard, extractToData, confirmCore, confirmMessage, confirmReply, reuploadRow, buildEditModal, applyEditFields, releaseCache } = require('./autobuildPipeline');
const { sendV2Payload } = require('./sendV2Payload');
const { buildPaginationRow } = require('./paginationRow');
const emojis = require('./emojiMap');

const MAX_SCREENSHOTS = 10;
// How long a batch idles before it closes, counted from its LAST click: 14 minutes for every batch, private or public, and its buttons grey out at the end (Harkirat, 2026-10-20 14:11 EDT: "i thought we kept it the 14 so we can have the grey buttons?"). Greying out has to happen inside the 15-minute life of the last click's token, the only thing that can edit the panel, so the idle length stays under 15. A 30-minute public window was tried at 13:57 EDT and dropped because it could not grey out. Found 13:49 EDT: the panel had been dying at 10 minutes because every send went through sendV2Payload's bot-wide idle disable at its default length.
const IDLE_MS = 14 * 60 * 1000;
const READ_AT_ONCE = 3;

// THE BATCH IS SAVED (2026-10-25 14:03 EDT, Harkirat's resume asks): every change is written to models/AutobuildBatch.js, one open batch per admin (his pick A), and this Map is only the in-memory copy. A batch whose panel went idle, or that the bot restarted under, is loaded back by its key (loadBatch) or by its admin (openBatchFor), its reviews put back into pendingAutobuilds and its failed uploads into pendingImageRetries. A bare /autobuild reopens it and new screenshots JOIN it. It ends only when every build is saved or discarded: then, at the panel's next idle, the record is deleted with its cached screenshots (finalize).
//
// key -> { items: [{ url, token, data, status, error, doc, retryToken, sourceIndex }], page, skipped, adminId, source } status: pending (to review) · saved · cancelled (discarded) · failed (couldn't read) · retry (image upload failed on Save) source: { key, total } when the batch came from the right-click's picker, so Add more can offer that message's other screenshots.
const batches = new Map();

const norm = (a) => String(a || '').trim().toLowerCase();
const weaponKeyOf = (data) => (data.weaponName || '').toLowerCase().replace(/\s+/g, '');

// Two screenshots of the same build in one batch: same weapon, same mode, and either the same Gunsmith code (MP) or the same attachment set, order ignored. Only EARLIER builds that were read and not discarded count, so the warning sits on the later page. Returns the earlier build's number, or 0. Pure.
function batchDuplicateOf(items, index) {
    const me = items[index]?.data;
    if (!me) return 0;
    const set = (d) => [...new Set((d.attachments || []).map(norm).filter(Boolean))].sort().join('|');
    for (let i = 0; i < index; i++) {
        const other = items[i];
        if (!other.data || other.status === 'cancelled' || other.status === 'failed') continue;
        const d = other.data;
        if (weaponKeyOf(d) !== weaponKeyOf(me) || (d.mode || 'MP') !== (me.mode || 'MP')) continue;
        const sameCode = me.mode !== 'DMZ' && me.gunsmithCode && norm(me.gunsmithCode) === norm(d.gunsmithCode);
        if (sameCode || (set(me) && set(me) === set(d))) return i + 1;
    }
    return 0;
}

function batchDuplicateNote(items, index) {
    const n = batchDuplicateOf(items, index);
    return n ? `${BOT_EMOJI.warn} **Same as Build ${n} in this batch**\n> Two screenshots of one build\n> **Fix:** discard one, unless they really are different builds` : null;
}

// What a build still to review needs looked at, in a few words each, for the overview. Pure.
function flagsOf(items, index) {
    const d = items[index].data || {};
    const flags = [];
    const dup = batchDuplicateOf(items, index);
    if (dup) flags.push(`same as #${dup}`);
    if (d.duplicateWarning) flags.push('possible duplicate');
    if (!d.category) flags.push('category unknown');
    else if (d.categoryConflict) flags.push(`saved elsewhere as ${d.categoryConflict}`);
    if (!d.mode) flags.push('MP or DMZ unknown');
    if (d.equipCapWarning) flags.push('too many attachments');
    if (d.labelConflict) flags.push('label already used');
    const cu = d.catalogueUnknown;
    if (cu?.weapon) flags.push('weapon not in the catalogue');
    if (cu?.attachments) flags.push(`${cu.attachments} unknown attachment${cu.attachments === 1 ? '' : 's'}`);
    return flags;
}

// The header at the top of every page, in Harkirat's format (2026-10-20 13:49 EDT): the title with which build is showing, a Ready line naming the builds that can be saved as they are, and a Check line naming each one that needs a look and why. A line with nothing to list is left out. Saved and discarded builds are on neither line; their own pages say so. Pure.
function overview(batch, index) {
    const total = batch.items.length;
    const name = (it, i) => `\`#${i + 1} ${it.data?.weaponName || `Image ${it.sourceIndex != null ? it.sourceIndex + 1 : i + 1}`}\``;
    const ready = [];
    const check = [];
    batch.items.forEach((it, i) => {
        if (it.status === 'pending') {
            const flags = flagsOf(batch.items, i);
            if (flags.length) check.push(`${name(it, i)} ${flags.join(', ')}`); else ready.push(name(it, i));
        } else if (it.status === 'failed') check.push(`${name(it, i)} couldn't read`);
        else if (it.status === 'retry') check.push(`${name(it, i)} image upload failed`);
    });
    const lines = [`## Review Extracted ${total === 1 ? 'Gunsmith' : 'Gunsmiths'}${total > 1 ? ` · \`#${index + 1} of ${total}\`` : ''}`];
    if (ready.length) lines.push(`-# ${emojis.checkmark} **Ready:** ${ready.join(' · ')}`);
    if (check.length) lines.push(`-# ${emojis.warn} **Check:** ${check.join(' · ')}`);
    if (batch.skipped) lines.push(`-# ${batch.skipped} not read (${MAX_SCREENSHOTS} at most)`);
    return lines.join('\n');
}

// The next build still to review after `from`, wrapping round; -1 when none is left. Pure.
function nextPendingIndex(items, from) {
    for (let step = 1; step <= items.length; step++) {
        const i = (from + step) % items.length;
        if (items[i].status === 'pending') return i;
    }
    return -1;
}

const id = (action, key, index = '') => `autobuild_b|${action}|${key}|${index}`;
// Button icons from the bot's own set, read at render time, as the draw calculator's buttons do.
const icon = (key) => emojis.parseEmoji(emojis[key]);

// The controls under every page, spaced the way Harkirat set them (2026-10-20 13:19 EDT: "i dont like the way the buttons are all sandwiched together"): a small blank gap before the arrow pager, a small divider before Save All / Discard All, then the Open and Undo menus. Add more sits OUTSIDE the panel, as its own row under it. Returns { inside, outside }.
function batchRows(batch, key, index, heldImages) {
    const inside = [];
    const outside = [];
    const pager = buildPaginationRow({ totalChunks: batch.items.length, currentPage: index, makeCustomId: (p) => id('page', key, p), indicatorCustomId: id('ind', key) });
    if (pager) inside.push({ type: 14, spacing: 1, divider: false }, pager);
    const pending = batch.items.filter(it => it.status === 'pending').length;
    // More screenshots join this batch through the start form (2026-10-25 14:03 EDT).
    inside.push({ type: 14, spacing: 1, divider: false }, { type: 1, components: [{ type: 2, style: 2, label: 'Add screenshots', custom_id: id('add', key), emoji: icon('edit') }] });
    if (pending > 1) {
        inside.push({ type: 14, spacing: 1, divider: true }, { type: 1, components: [
            { type: 2, style: 3, label: `Save All ${pending}`, custom_id: id('all', key), emoji: icon('saveStar') },
            { type: 2, style: 4, label: `Discard All ${pending}`, custom_id: id('none', key), emoji: icon('deleteAll') },
        ] });
    }
    const saved = batch.items.filter(it => it.status === 'saved');
    if (saved.length) {
        inside.push({ type: 1, components: [{
            type: 3, custom_id: id('open', key), placeholder: 'Open a saved loadout',
            options: saved.map(it => ({ label: `${it.doc.weaponName} — ${it.doc.buildName}`.slice(0, 100), value: String(it.doc._id) })),
        }] });
    }
    // Undo a discard (Harkirat, 2026-10-20 12:36 EDT): the build comes back exactly as it was read, with no second vision call.
    const discarded = batch.items.map((it, i) => ({ it, i })).filter(({ it }) => it.status === 'cancelled' && it.data);
    if (discarded.length) {
        inside.push({ type: 1, components: [{
            type: 3, custom_id: id('undo', key), placeholder: 'Undo a discard',
            min_values: 1, max_values: discarded.length,
            options: discarded.map(({ it, i }) => ({ label: `#${i + 1} ${it.data.weaponName}`.slice(0, 100), value: String(i) })),
        }] });
    }
    const more = unreadImages(batch, heldImages);
    if (more.length) {
        outside.push({ type: 1, components: [{
            type: 3, custom_id: id('more', key), placeholder: `Add more screenshots from that message (${more.length} not read)`,
            min_values: 1, max_values: Math.min(more.length, MAX_SCREENSHOTS - batch.items.length),
            options: more.map(i => ({ label: `Image ${i + 1}`, value: String(i) })),
        }] });
    }
    return { inside, outside };
}

// The source message's screenshots this batch has not read, while there is room for them. Pure given the held images.
function unreadImages(batch, heldImages) {
    if (!batch.source || !heldImages || batch.items.length >= MAX_SCREENSHOTS) return [];
    const read = new Set(batch.items.map(it => it.sourceIndex));
    return heldImages.slice(0, MAX_SCREENSHOTS).map((_, i) => i).filter(i => !read.has(i));
}

// One page of a batch, as Components V2. A build still to review is today's review card with the batch overview on top, the in-batch duplicate note, its own Save / Adjust / Discard and the batch rows; any other build is a short status card with its screenshot. Pure given the batch.
function renderPage(batch, key, index, heldImages = null) {
    const item = batch.items[index];
    const header = overview(batch, index);
    const { inside, outside } = batchRows(batch, key, index, heldImages);
    // A live countdown at the base of the panel (Harkirat, 2026-10-20 14:07 EDT); Discord renders <t:…:R> as "in 13 minutes" and counts it down by itself. Every click renews it, since show() calls touch() before rendering.
    if (batch.expiresAt) inside.push({ type: 10, content: `-# Panel timeout: <t:${Math.floor(batch.expiresAt / 1000)}:R> · Press a button to renew!` });
    if (item.status === 'pending') {
        const n = index + 1;
        const card = buildReviewCard(item.token, item.data, {
            title: header,
            notes: [batchDuplicateNote(batch.items, index), item.data.rivalNote || null],
            rows: [
                // Pressing Save on a build another admin also has waiting asks first (2026-10-25 14:01 EDT): keep yours, or leave it to them (yours is discarded).
                item.askRival
                    ? { type: 1, components: [
                        { type: 2, style: 3, label: 'Save mine', custom_id: id('force', key, index), emoji: icon('saveStar') },
                        { type: 2, style: 4, label: 'Leave it to them', custom_id: id('yield', key, index), emoji: icon('deleteBin') },
                        { type: 2, style: 2, label: 'Back', custom_id: id('page', key, index) },
                    ] }
                    : { type: 1, components: [
                        { type: 2, style: 3, label: `Save Build ${n}`, custom_id: id('confirm', key, index), emoji: icon('saveStar') },
                        { type: 2, style: 1, label: 'Adjust', custom_id: id('edit', key, index), emoji: icon('edit') },
                        { type: 2, style: 4, label: `Discard Build ${n}`, custom_id: id('cancel', key, index), emoji: icon('deleteBin') },
                    ] },
                ...inside,
            ],
        });
        return [...card.components, ...outside];
    }
    const warn = emojis.warn;
    const line = {
        saved: () => `${BOT_EMOJI.checkmark} **Saved:** ${item.doc.weaponName} — ${item.doc.buildName} (${item.doc.category}${item.doc.mode === 'DMZ' ? ', DMZ' : ''})`,
        cancelled: () => BOT_EMOJI.cross + ' **Discarded:** nothing saved or uploaded.',
        failed: () => `${warn} **Couldn't read this screenshot:** ${item.error}`,
        retry: () => `${warn} **Image upload failed** (${item.error}). Nothing was saved yet. Press **Re-upload** to send the image again.`,
    }[item.status]();
    return [{ type: 17, accent_color: 2829617, components: [
        { type: 10, content: header },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: line },
        { type: 12, items: [{ media: { url: item.url } }] },
        ...(item.status === 'retry' ? [reuploadRow(item.retryToken)] : []),
        ...(inside.length ? [{ type: 14, spacing: 1, divider: true }, ...inside] : []),
    ] }, ...outside];
}

function heldImagesFor(interaction, batch) {
    if (!batch.source) return null;
    return interaction.client.commands.get('Autobuild Gunsmith')?.heldFor(batch.source.key)?.images || null;
}

// Always the page you are on, even when nothing is left to review: a save, a discard or a failure stays in front of you (Harkirat, 2026-10-20 12:36 EDT: "leave me on that build's page, let me see the confirmation or problem"). The saved builds open from the menu under it.
function render(batch, key, heldImages) {
    return renderPage(batch, key, batch.page, heldImages);
}

// Every text block goes through emojiMap.glyphs on the way out, so no Unicode status glyph reaches a batch page whichever line composed it.
function withGlyphs(components) {
    const walk = (c) => { if (c.type === 10 && c.content) c.content = emojis.glyphs(c.content); (c.components || []).forEach(walk); };
    components.forEach(walk);
    return components;
}

// The bot-wide expiry greys the batch out after IDLE_MS without a click.
async function show(interaction, batch, key) {
    touch(key, batch);
    await refreshForRender(interaction, batch, key);
    await persist(key, batch);
    return sendV2Payload(interaction, withGlyphs(render(batch, key, heldImagesFor(interaction, batch))), { expiryMs: IDLE_MS });
}

function touch(key, batch) {
    if (batch.timer) clearTimeout(batch.timer);
    batch.expiresAt = Date.now() + IDLE_MS;
    batch.timer = setTimeout(() => {
        // A batch with builds still waiting stays saved for a bare /autobuild to reopen; only its in-memory copy goes. A finished one is deleted with its cached screenshots: a discarded build's picture is kept until here, so Undo a discard works while the panel is open.
        if (isOpen(batch)) unload(key, batch);
        else finalize(key, batch).catch(err => console.error('Bulk autobuild: could not close a finished batch:', err.message));
    }, IDLE_MS);
    batch.timer.unref?.();
}

// ---- the saved batch (models/AutobuildBatch.js) ----

const dbUp = () => { try { return require('mongoose').connection.readyState === 1; } catch { return false; } };
const Stored = () => require('../models/AutobuildBatch');
// Open while any build still waits for Save or Discard, a failed upload included.
const isOpen = (batch) => batch.items.some(it => it.status === 'pending' || it.status === 'retry');

// A batch as stored: everything but the timer, a saved build reduced to the summary its page shows, and a failed upload's retry data so Re-upload survives a restart. Pure.
function toStored(batch) {
    return {
        ownerId: batch.adminId, page: batch.page, skipped: batch.skipped || 0, source: batch.source || null, public: Boolean(batch.public),
        items: batch.items.map(it => ({
            url: it.url, token: it.token || null, data: it.data || null, status: it.status, error: it.error || null,
            doc: it.doc ? { _id: String(it.doc._id), weaponName: it.doc.weaponName, buildName: it.doc.buildName, category: it.doc.category, mode: it.doc.mode } : null,
            retryToken: it.retryToken || null, retryData: it.retryToken ? (pendingImageRetries.get(it.retryToken) || it.retryData || null) : null,
            sourceIndex: it.sourceIndex ?? null, sourceLabel: it.sourceLabel || null,
        })),
    };
}

// A stored batch back in memory, its reviews and retries put back where Save, Adjust and Re-upload look for them.
function fromStored(doc) {
    const batch = { items: (doc.items || []).map(it => ({ ...it })), page: doc.page || 0, skipped: doc.skipped || 0, adminId: doc.ownerId, source: doc.source || null, public: Boolean(doc.public) };
    for (const it of batch.items) {
        if (it.status === 'pending' && it.token && it.data) pendingAutobuilds.set(it.token, it.data);
        if (it.status === 'retry' && it.retryToken && it.retryData) pendingImageRetries.set(it.retryToken, it.retryData);
    }
    return batch;
}

async function persist(key, batch) {
    if (!dbUp()) return;
    try {
        await Stored().updateOne({ key }, { $set: toStored(batch) }, { upsert: true });
    } catch (err) {
        console.error('Bulk autobuild: could not save the batch (it still works until the bot restarts):', err.message);
    }
}

// The in-memory batch, else the saved one by its key, else null.
async function loadBatch(key) {
    if (batches.has(key)) return batches.get(key);
    if (!dbUp()) return null;
    try {
        const doc = await Stored().findOne({ key }).lean();
        if (!doc) return null;
        const batch = fromStored(doc);
        batches.set(key, batch);
        return batch;
    } catch (err) {
        console.error('Bulk autobuild: could not load a saved batch:', err.message);
        return null;
    }
}

// The admin's open batch ({ key, batch }), or null. Finished ones met on the way are closed.
async function openBatchFor(adminId) {
    for (const [key, batch] of batches) if (batch.adminId === adminId && isOpen(batch)) return { key, batch };
    if (!dbUp()) return null;
    try {
        const docs = await Stored().find({ ownerId: adminId }).sort({ updatedAt: -1 }).lean();
        for (const doc of docs) {
            const batch = batches.get(doc.key) || fromStored(doc);
            if (isOpen(batch)) { batches.set(doc.key, batch); return { key: doc.key, batch }; }
            await finalize(doc.key, batch);
        }
    } catch (err) {
        console.error('Bulk autobuild: could not look for an open batch:', err.message);
    }
    return null;
}

// Out of memory only; the saved record stays.
function unload(key, batch) {
    if (batch.timer) clearTimeout(batch.timer);
    batches.delete(key);
    for (const it of batch.items) if (it.token) pendingAutobuilds.delete(it.token);
}

// Every build saved or discarded: the record goes, and so does every cached screenshot a saved build did not already release.
async function finalize(key, batch) {
    unload(key, batch);
    for (const it of batch.items) if (it.status !== 'saved') releaseCache(it.data);
    if (dbUp()) await Stored().deleteOne({ key }).catch(err => console.error('Bulk autobuild: could not delete a finished batch:', err.message));
}

// ---- other admins' batches, and the live build number (2026-10-25 14:01-14:05 EDT, Harkirat: "have a conflict check when an admin presses confirm ... same weapon, or a build using the same attachment") ----

const sameBuildKey = (d) => {
    const set = [...new Set((d.attachments || []).map(norm).filter(Boolean))].sort().join('|');
    return { weapon: weaponKeyOf(d), mode: d.mode || 'MP', code: d.mode !== 'DMZ' ? norm(d.gunsmithCode) : '', set };
};
// How two waiting builds relate: 'build' (same weapon and mode, and the same Gunsmith code or attachment set), 'weapon' (same weapon and mode only), or null. Pure.
function clashOf(a, b) {
    const x = sameBuildKey(a), y = sameBuildKey(b);
    if (!x.weapon || x.weapon !== y.weapon || x.mode !== y.mode) return null;
    if ((x.code && x.code === y.code) || (x.set && x.set === y.set)) return 'build';
    return 'weapon';
}

const nameCache = new Map();
// An admin as the reader sees them: their nickname in this server, else their display name.
async function adminName(interaction, id) {
    const cacheKey = `${interaction.guildId || 'dm'}|${id}`;
    if (nameCache.has(cacheKey)) return nameCache.get(cacheKey);
    let name = 'another admin';
    try {
        const member = interaction.guild ? await interaction.guild.members.fetch(id).catch(() => null) : null;
        const user = member?.user || await interaction.client.users.fetch(id);
        name = member?.nickname || user.globalName || user.username || name;
    } catch { /* keep the fallback */ }
    nameCache.set(cacheKey, name);
    return name;
}

// Before every page is drawn: each waiting build's number and its duplicate warnings are worked out again from the builds saved now (another admin may have saved one since), and each is compared with the other admins' waiting builds. Sets `rivalNote` (shown) and `rival` ({ kind, name }) on the build's data. Skipped without a database.
async function refreshForRender(interaction, batch, key) {
    const pending = batch.items.filter(it => it.status === 'pending' && it.data);
    if (!pending.length || !dbUp()) return;
    try {
        const Loadout = require('../models/Loadout');
        const allBuilds = await Loadout.find({}).select('weaponKey weaponName category buildName shareCode attachments mode').lean();
        const { refreshReviewWarnings } = require('./autobuildPipeline');
        for (const it of pending) refreshReviewWarnings(it.data, allBuilds);
        const others = await Stored().find({ ownerId: { $ne: batch.adminId }, key: { $ne: key } }).lean();
        for (const it of pending) {
            it.data.rival = null;
            it.data.rivalNote = null;
            let found = null;
            for (const doc of others) {
                for (const o of doc.items || []) {
                    if (o.status !== 'pending' || !o.data) continue;
                    const kind = clashOf(it.data, o.data);
                    if (kind && (!found || (found.kind === 'weapon' && kind === 'build'))) found = { kind, ownerId: doc.ownerId };
                }
            }
            if (!found) continue;
            const name = await adminName(interaction, found.ownerId);
            it.data.rival = { kind: found.kind, name };
            it.data.rivalNote = found.kind === 'build'
                ? `${BOT_EMOJI.warn} **Also waiting in ${name}'s batch:** the same ${it.data.weaponName} build\n> Whoever saves first keeps it; the other becomes a duplicate\n> **Save** asks you to pick: save yours, or leave it to them`
                : `${BOT_EMOJI.warn} **${name} is also reviewing a ${it.data.weaponName} build**\n> Build numbers go in Save order: whoever saves first takes Build ${it.data.ordinal || 1}`;
        }
    } catch (err) {
        console.error('Bulk autobuild: could not compare with other batches:', err.message);
    }
}

// Saves every build still to review, in order (one at a time, so two builds of one weapon get different build names). Stops at the first build that is missing a category or a mode and returns its index; a failed image upload is recorded and the run carries on. `confirm` is confirmCore, passed in so the stop rule can be tested without a database.
async function confirmAllItems(batch, confirm = confirmCore) {
    for (let i = 0; i < batch.items.length; i++) {
        const item = batch.items[i];
        if (item.status !== 'pending') continue;
        // A build another admin also has waiting is never saved by Save All; it stops there and asks.
        if (item.data?.rival?.kind === 'build') { item.askRival = true; return { stoppedAt: i, result: { status: 'rival', message: `Build ${i + 1} is also waiting in ${item.data.rival.name}'s batch.` } }; }
        const result = await confirm(item.token);
        if (applyResult(item, result) === 'stop') return { stoppedAt: i, result };
    }
    return { stoppedAt: -1 };
}

// Records a confirmCore result on a batch item. Returns 'stop' when the build needs an Adjust before it can be saved.
function applyResult(item, result) {
    if (result.status === 'saved') { item.status = 'saved'; item.doc = result.doc; return 'ok'; }
    if (result.status === 'retry') { item.status = 'retry'; item.retryToken = result.retryToken; item.error = result.error; return 'ok'; }
    if (result.status === 'expired') { item.status = 'cancelled'; return 'ok'; }
    return 'stop'; // nocategory · nomode · busy
}

function readingCard(done, total) {
    return [{ type: 17, accent_color: 2829617, components: [
        { type: 10, content: `## Reading ${total} screenshot${total === 1 ? '' : 's'}…\n-# ${done} of ${total} done` },
    ] }];
}

// Reads screenshots three at a time into new batch items, stashing each as an ordinary review under its own token. Shared by a new batch and by Add more. An item's own preset (the start form, 2026-10-25 12:49 EDT) wins over the batch-wide options for what it names, and leaves the rest to them.
async function readInto(interaction, newItems, { explicitCategory = null, badgesOption = null, explicitMode = null } = {}) {
    const Loadout = require('../models/Loadout');
    const allBuilds = await Loadout.find({}).select('weaponKey weaponName category buildName shareCode attachments mode').lean();
    let done = 0;
    await sendV2Payload(interaction, readingCard(0, newItems.length)).catch(() => {});
    let next = 0;
    const worker = async () => {
        while (next < newItems.length) {
            const item = newItems[next++];
            try {
                const p = item.preset;
                item.data = await extractToData(item.url, {
                    explicitCategory: p?.category || explicitCategory,
                    badgesOption: p?.badges?.length ? p.badges.join(',') : badgesOption,
                    explicitMode: p?.mode || explicitMode,
                    adminId: interaction.user.id, allBuilds,
                });
                if (item.sourceLabel) item.data.sourceLabel = item.sourceLabel;
                const presetNote = require('./autobuildStart').presetWarning(p);
                if (presetNote) item.data.presetWarning = presetNote;
                if (item.formNotes?.length) item.data.formNotes = item.formNotes;
                item.token = crypto.randomBytes(8).toString('hex');
                pendingAutobuilds.set(item.token, item.data); // dropped by the batch's own timer (touch), with the batch
            } catch (err) {
                console.error('Bulk autobuild: extraction failed for one screenshot:', err.message);
                item.status = 'failed';
                item.error = err.message.slice(0, 300);
            }
            done++;
            await sendV2Payload(interaction, readingCard(done, newItems.length)).catch(() => {});
        }
    };
    await Promise.all(Array.from({ length: Math.min(READ_AT_ONCE, newItems.length) }, worker));
}

// Starts a batch. The caller has already deferred (deferReply for /autobuild, deferUpdate for the right-click's picker), exactly like runExtraction. `source` ({ key, indices }) is the right-click's held message and which of its images these are. `images` (the start form, 2026-10-25 12:49 EDT): `{ url, label, preset }` per entry, aligned with `urls`; `notes` ride on the first build's page.
async function runBulk(interaction, urls, { explicitCategory = null, badgesOption = null, explicitMode = null, skipped = 0, source = null, ephemeral = true, images = null, notes = [] } = {}) {
    const list = urls.slice(0, MAX_SCREENSHOTS);
    skipped += urls.length - list.length;
    const items = list.map((url, i) => ({ url, status: 'pending', sourceIndex: source ? source.indices[i] : null, preset: images?.[i]?.preset || null, sourceLabel: images?.[i]?.label || null, formNotes: i === 0 ? notes : null }));
    await readInto(interaction, items, { explicitCategory, badgesOption, explicitMode });
    // Preset and form notes are written into each build's data; the item copies are not needed once read.
    for (const it of items) { delete it.preset; delete it.formNotes; }

    // An open batch is JOINED, not replaced (Harkirat, 2026-10-25 13:38 EDT: "the joining method that just makes more practical sense"): the new builds go on the end and the page opens on the first of them.
    const open = await openBatchFor(interaction.user.id);
    if (open) {
        const firstNew = open.batch.items.length;
        open.batch.items.push(...items);
        open.batch.skipped = (open.batch.skipped || 0) + skipped;
        if (source && !open.batch.source) open.batch.source = { key: source.key };
        const firstPending = items.findIndex(it => it.status === 'pending');
        open.batch.page = firstNew + (firstPending === -1 ? 0 : firstPending);
        return show(interaction, open.batch, open.key);
    }

    const key = crypto.randomBytes(6).toString('hex');
    // Public only when the reply really is public: a server policy can force it private after `visibility: public` was asked for.
    const batch = { items, page: 0, skipped, adminId: interaction.user.id, source: source ? { key: source.key } : null, public: !ephemeral && interaction.ephemeral !== true };
    const first = items.findIndex(it => it.status === 'pending');
    batch.page = first === -1 ? 0 : first;
    batches.set(key, batch);
    return show(interaction, batch, key);
}

// A bare /autobuild with a batch open: the batch, where it was left (2026-10-25 14:03 EDT). Returns false when there is none, so the caller opens the form instead. The caller has not answered yet.
async function resumeOpenBatch(interaction) {
    const open = await openBatchFor(interaction.user.id);
    if (!open) return false;
    await interaction.deferReply({ ephemeral: true });
    await show(interaction, open.batch, open.key);
    return true;
}

// ---- button / select / modal handlers, called from handlers/autobuild.js ----

function parse(customId) {
    const [, action, key, index] = customId.split('|');
    return { action, key, index: index === '' || index === undefined ? null : Number(index) };
}

async function expired(interaction) {
    try {
        await interaction.reply({ content: emojis.glyphs(BOT_EMOJI.cross + ' This batch is finished or no longer exists. Run `/autobuild` to start a new one.'), ephemeral: true });
    } catch (notifyError) {
        console.error('Bulk autobuild: could not explain an expired batch (interaction likely expired):', notifyError);
    }
}

// Everything except the Adjust button and the modal submit, which have their own entry points below (showModal must answer a button, never a modal submit), and Open, which handlers/autobuild.js answers with the single review's own code.
async function handleBatchComponent(interaction) {
    const { action, key, index } = parse(interaction.customId);
    const batch = await loadBatch(key);
    if (!batch) return expired(interaction);

    if (action === 'confirm' || action === 'all' || action === 'force') {
        // Save writes a Loadout straight to Mongo, so it asks the same tier the single review's Save asks.
        const { canDo, denyDo } = require('./adminAccess');
        if (!(await canDo(interaction.user.id, 'autobuild.confirm'))) {
            return await interaction.reply({ content: denyDo('autobuild.confirm'), ephemeral: true });
        }
    }
    await interaction.deferUpdate();

    if (action === 'page') {
        batch.page = Math.max(0, Math.min(batch.items.length - 1, index));
        if (batch.items[batch.page]) batch.items[batch.page].askRival = false;
    } else if (action === 'confirm' && batch.items[index]?.status === 'pending' && batch.items[index].data?.rival?.kind === 'build') {
        // The same build is waiting in another admin's batch: ask before saving.
        batch.items[index].askRival = true;
        batch.page = index;
    } else if (action === 'confirm' || action === 'cancel' || action === 'force' || action === 'yield') {
        const item = batch.items[index];
        if (item && item.status === 'pending') {
            item.askRival = false;
            if (action === 'cancel' || action === 'yield') {
                require('./visionReads').noteOutcome(item.data?.readId, 'discarded');
                pendingAutobuilds.delete(item.token);
                item.status = 'cancelled';
            } else {
                const result = await confirmCore(item.token);
                if (applyResult(item, result) === 'stop') {
                    await interaction.followUp(confirmReply(interaction.client, result)).catch(() => {});
                }
            }
            batch.page = index;
        }
    } else if (action === 'all') {
        const { stoppedAt, result } = await confirmAllItems(batch);
        if (stoppedAt !== -1) {
            batch.page = stoppedAt;
            await interaction.followUp({ content: `Stopped at Build ${stoppedAt + 1}. ${confirmMessage(interaction.client, result)} Then Save All again.`, ephemeral: true }).catch(() => {});
        }
    } else if (action === 'none') {
        for (const item of batch.items) {
            if (item.status !== 'pending') continue;
            require('./visionReads').noteOutcome(item.data?.readId, 'discarded');
            pendingAutobuilds.delete(item.token);
            item.status = 'cancelled';
        }
    } else if (action === 'undo') {
        const restored = interaction.values.map(Number).filter(i => batch.items[i]?.status === 'cancelled' && batch.items[i].data).sort((a, b) => a - b);
        for (const i of restored) {
            const item = batch.items[i];
            pendingAutobuilds.set(item.token, item.data);
            require('./visionReads').noteOutcome(item.data?.readId, null);
            item.status = 'pending';
        }
        if (restored.length) batch.page = restored[0];
    } else if (action === 'more') {
        const held = heldImagesFor(interaction, batch);
        if (!held) {
            await interaction.followUp({ content: "That message's screenshots aren't held any more (the bot restarted, or 30 minutes passed). Right-click it again.", ephemeral: true }).catch(() => {});
        } else {
            const already = new Set(batch.items.map(it => it.sourceIndex));
            const picked = interaction.values.map(Number).filter(i => !already.has(i) && held[i]).sort((a, b) => a - b).slice(0, MAX_SCREENSHOTS - batch.items.length);
            const added = picked.map(i => ({ url: held[i], status: 'pending', sourceIndex: i }));
            await readInto(interaction, added);
            const firstNew = batch.items.length;
            batch.items.push(...added);
            batch.page = firstNew;
        }
    }
    return show(interaction, batch, key);
}

async function showBatchEditModal(interaction) {
    const { key, index } = parse(interaction.customId);
    const batch = await loadBatch(key);
    const item = batch?.items[index];
    const data = item && pendingAutobuilds.get(item.token);
    if (!data || item.status !== 'pending') return expired(interaction);
    touch(key, batch);
    return interaction.showModal(buildEditModal(item.token, data, id('editmodal', key, index)));
}

async function applyBatchEdit(interaction) {
    const { key, index } = parse(interaction.customId);
    const batch = await loadBatch(key);
    const item = batch?.items[index];
    const data = item && pendingAutobuilds.get(item.token);
    if (!data || item.status !== 'pending') return expired(interaction);
    await interaction.deferUpdate();
    const updated = await applyEditFields(interaction, data);
    pendingAutobuilds.set(item.token, updated);
    item.data = updated;
    batch.page = index;
    return show(interaction, batch, key);
}

module.exports = {
    runBulk, handleBatchComponent, showBatchEditModal, applyBatchEdit, resumeOpenBatch, openBatchFor, MAX_SCREENSHOTS,
    // Exported for scripts/autobuildBulk.test.js.
    batches, withGlyphs, IDLE_MS, toStored, fromStored, isOpen, clashOf, batchDuplicateNote, batchDuplicateOf, flagsOf, overview, nextPendingIndex, renderPage, confirmAllItems, applyResult, unreadImages,
};
