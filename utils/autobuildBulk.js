// utils/autobuildBulk.js Bulk /autobuild: several Gunsmith screenshots read in one go and reviewed one page per build (Harkirat, 2026-10-20 10:15 EDT, pick "A": both the right-click and /autobuild's extra screenshot slots; 10:24 EDT: the right-click picker stays and takes several picks). Spec: local/project/features/launch-extras/spec.md (gitignored; the decisions are restated in .claude/rules/autobuild.md).
//
// Every build in a batch is an ordinary /autobuild review: its `data` lives in utils/autobuildPipeline.js's pendingAutobuilds under its own token, and reading, saving and editing go through that file's shared halves (extractToData, confirmCore, applyEditFields), so a batch build is saved exactly the way a single one is. This file only holds the batch around them: which builds, in what order, which page is showing, and what happened to each.
//
// Custom ids are `autobuild_b|<action>|<batchKey>|<index>`. The `autobuild_` prefix routes them to handlers/autobuild.js and puts them behind handlers/router.js's /autobuild access check, the same as the single review's buttons.
//
// After his first click-test (2026-10-20 12:10 EDT): the overview lists every build with what needs a look, the pager is the bot's usual arrows (utils/paginationRow.js), the buttons say Save / Adjust / Discard and name the build, and a batch started from the right-click can take more of that message's screenshots (Add more).
const crypto = require('crypto');
const { pendingAutobuilds, buildReviewCard, extractToData, confirmCore, confirmMessage, buildEditModal, applyEditFields } = require('./autobuildPipeline');
const { sendV2Payload } = require('./sendV2Payload');
const { buildPaginationRow } = require('./paginationRow');
const emojis = require('./emojiMap');

const MAX_SCREENSHOTS = 10;
const BATCH_MS = 30 * 60 * 1000; // a single review keeps 10 minutes; ten reviews need longer
const READ_AT_ONCE = 3;

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
    return n ? `⚠️ **Same as Build ${n} in this batch:** two screenshots of one build. Discard one of them unless they really are different builds.` : null;
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
    if (d.catalogueWarning) flags.push('names not in the catalogue');
    return flags;
}

// The batch overview at the top of every page: one line per build, the one on screen marked, each with its state and what needs a look. Pure.
function overview(batch, index) {
    const warn = emojis.warn;
    const lines = batch.items.map((it, i) => {
        const name = it.data?.weaponName || it.doc?.weaponName || `Image ${it.sourceIndex != null ? it.sourceIndex + 1 : i + 1}`;
        let state;
        if (it.status === 'pending') {
            const flags = flagsOf(batch.items, i);
            state = flags.length ? `${warn} ${flags.join(' · ')}` : '⏳ ready to save';
        } else if (it.status === 'saved') state = `✅ saved as ${it.doc.buildName}`;
        else if (it.status === 'cancelled') state = '❌ discarded';
        else if (it.status === 'failed') state = `${warn} couldn't read`;
        else state = `${warn} image upload failed`;
        const here = i === index ? '▸ ' : '';
        return `${here}**${i + 1}. ${name}** — ${state}`;
    });
    const tail = batch.skipped ? `\n-# ${batch.skipped} not read (${MAX_SCREENSHOTS} at most)` : '';
    return `${lines.join('\n')}${tail}`;
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

// The rows under every page: the bot's usual arrow pager, then the batch actions, then Add more when the right-click message has screenshots this batch has not read.
function batchRows(batch, key, index, heldImages) {
    const rows = [];
    const pager = buildPaginationRow({ totalChunks: batch.items.length, currentPage: index, makeCustomId: (p) => id('page', key, p), indicatorCustomId: id('ind', key) });
    if (pager) rows.push(pager);
    const pending = batch.items.filter(it => it.status === 'pending').length;
    if (pending > 1) {
        rows.push({ type: 1, components: [
            { type: 2, style: 3, label: `Save All ${pending}`, custom_id: id('all', key) },
            { type: 2, style: 4, label: `Discard All ${pending}`, custom_id: id('none', key) },
        ] });
    }
    const more = unreadImages(batch, heldImages);
    if (more.length) {
        rows.push({ type: 1, components: [{
            type: 3, custom_id: id('more', key), placeholder: `Add more screenshots from that message (${more.length} not read)`,
            min_values: 1, max_values: Math.min(more.length, MAX_SCREENSHOTS - batch.items.length),
            options: more.map(i => ({ label: `Image ${i + 1}`, value: String(i) })),
        }] });
    }
    return rows;
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
    const rows = batchRows(batch, key, index, heldImages);
    if (item.status === 'pending') {
        const n = index + 1;
        const card = buildReviewCard(item.token, item.data, {
            header,
            notes: [batchDuplicateNote(batch.items, index)],
            rows: [
                { type: 1, components: [
                    { type: 2, style: 3, label: `Save Build ${n}`, custom_id: id('confirm', key, index) },
                    { type: 2, style: 1, label: 'Adjust', custom_id: id('edit', key, index) },
                    { type: 2, style: 4, label: `Discard Build ${n}`, custom_id: id('cancel', key, index) },
                ] },
                ...rows,
            ],
        });
        return card.components;
    }
    const warn = emojis.warn;
    const line = {
        saved: () => `✅ **Saved:** ${item.doc.weaponName} — ${item.doc.buildName} (${item.doc.category}${item.doc.mode === 'DMZ' ? ', DMZ' : ''})`,
        cancelled: () => '❌ **Discarded:** nothing saved or uploaded.',
        failed: () => `${warn} **Couldn't read this screenshot:** ${item.error}`,
        retry: () => `${warn} **Image upload failed** (${item.error}). Nothing was saved yet. Try the image again with\n\`/autobuild retry_token:${item.retryToken} screenshot:<new attachment>\``,
    }[item.status]();
    return [{ type: 17, accent_color: 2829617, components: [
        { type: 10, content: '# Review Extracted Loadouts' },
        { type: 10, content: header },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: line },
        { type: 12, items: [{ media: { url: item.url } }] },
        ...(rows.length ? [{ type: 14, spacing: 1, divider: true }, ...rows] : []),
    ] }];
}

// The end of a batch: one line per build, and an Open loadout menu for the saved ones. Add more stays while the message has screenshots left. Pure.
function renderSummary(batch, key, heldImages = null) {
    const warn = emojis.warn;
    const lines = batch.items.map((it, i) => {
        if (it.status === 'saved') return `${i + 1}. ✅ ${it.doc.weaponName} — ${it.doc.buildName} (${it.doc.category}${it.doc.mode === 'DMZ' ? ', DMZ' : ''})`;
        if (it.status === 'retry') return `${i + 1}. ${warn} image upload failed: \`/autobuild retry_token:${it.retryToken} screenshot:<new attachment>\``;
        if (it.status === 'failed') return `${i + 1}. ${warn} couldn't read: ${it.error}`;
        return `${i + 1}. ❌ discarded`;
    });
    const saved = batch.items.filter(it => it.status === 'saved');
    const components = [
        { type: 10, content: `# Batch done\n-# ✅ ${saved.length} saved of ${batch.items.length}${batch.skipped ? ` · ${batch.skipped} not read (${MAX_SCREENSHOTS} at most)` : ''}` },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: lines.join('\n') },
    ];
    if (saved.length) {
        components.push({ type: 1, components: [{
            type: 3, custom_id: id('open', key), placeholder: 'Open a saved loadout',
            options: saved.map(it => ({ label: `${it.doc.weaponName} — ${it.doc.buildName}`.slice(0, 100), value: String(it.doc._id) })),
        }] });
    }
    const more = batchRows(batch, key, 0, heldImages).filter(r => r.components[0].type === 3);
    components.push(...more);
    return [{ type: 17, accent_color: 2829617, components }];
}

function heldImagesFor(interaction, batch) {
    if (!batch.source) return null;
    return interaction.client.commands.get('Autobuild Loadout')?.heldFor(batch.source.key)?.images || null;
}

function render(batch, key, heldImages) {
    return batch.items.some(it => it.status === 'pending') ? renderPage(batch, key, batch.page, heldImages) : renderSummary(batch, key, heldImages);
}

async function show(interaction, batch, key) {
    return sendV2Payload(interaction, render(batch, key, heldImagesFor(interaction, batch)));
}

// Saves every build still to review, in order (one at a time, so two builds of one weapon get different build names). Stops at the first build that is missing a category or a mode and returns its index; a failed image upload is recorded and the run carries on. `confirm` is confirmCore, passed in so the stop rule can be tested without a database.
async function confirmAllItems(batch, confirm = confirmCore) {
    for (let i = 0; i < batch.items.length; i++) {
        const item = batch.items[i];
        if (item.status !== 'pending') continue;
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

// Reads screenshots three at a time into new batch items, stashing each as an ordinary review under its own token. Shared by a new batch and by Add more.
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
                item.data = await extractToData(item.url, { explicitCategory, badgesOption, explicitMode, adminId: interaction.user.id, allBuilds });
                item.token = crypto.randomBytes(8).toString('hex');
                pendingAutobuilds.set(item.token, item.data);
                setTimeout(() => pendingAutobuilds.delete(item.token), BATCH_MS).unref();
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

// Starts a batch. The caller has already deferred (deferReply for /autobuild, deferUpdate for the right-click's picker), exactly like runExtraction. `source` ({ key, indices }) is the right-click's held message and which of its images these are.
async function runBulk(interaction, urls, { explicitCategory = null, badgesOption = null, explicitMode = null, skipped = 0, source = null } = {}) {
    const list = urls.slice(0, MAX_SCREENSHOTS);
    skipped += urls.length - list.length;
    const items = list.map((url, i) => ({ url, status: 'pending', sourceIndex: source ? source.indices[i] : null }));
    await readInto(interaction, items, { explicitCategory, badgesOption, explicitMode });

    const key = crypto.randomBytes(6).toString('hex');
    const batch = { items, page: 0, skipped, adminId: interaction.user.id, source: source ? { key: source.key } : null };
    const first = items.findIndex(it => it.status === 'pending');
    batch.page = first === -1 ? 0 : first;
    batches.set(key, batch);
    setTimeout(() => batches.delete(key), BATCH_MS).unref();
    return show(interaction, batch, key);
}

// ---- button / select / modal handlers, called from handlers/autobuild.js ----

function parse(customId) {
    const [, action, key, index] = customId.split('|');
    return { action, key, index: index === '' || index === undefined ? null : Number(index) };
}

async function expired(interaction) {
    try {
        await interaction.reply({ content: '❌ This batch has expired (30 minutes) or the bot restarted. Run it again.', ephemeral: true });
    } catch (notifyError) {
        console.error('Bulk autobuild: could not explain an expired batch (interaction likely expired):', notifyError);
    }
}

// Everything except the Adjust button and the modal submit, which have their own entry points below (showModal must answer a button, never a modal submit), and Open, which handlers/autobuild.js answers with the single review's own code.
async function handleBatchComponent(interaction) {
    const { action, key, index } = parse(interaction.customId);
    const batch = batches.get(key);
    if (!batch) return expired(interaction);

    if (action === 'confirm' || action === 'all') {
        // Save writes a Loadout straight to Mongo, so it asks the same tier the single review's Save asks.
        const { canDo, denyDo } = require('./adminAccess');
        if (!(await canDo(interaction.user.id, 'autobuild.confirm'))) {
            return await interaction.reply({ content: denyDo('autobuild.confirm'), ephemeral: true });
        }
    }
    await interaction.deferUpdate();

    if (action === 'page') {
        batch.page = Math.max(0, Math.min(batch.items.length - 1, index));
    } else if (action === 'confirm' || action === 'cancel') {
        const item = batch.items[index];
        if (item && item.status === 'pending') {
            if (action === 'cancel') {
                pendingAutobuilds.delete(item.token);
                item.status = 'cancelled';
            } else {
                const result = await confirmCore(item.token);
                if (applyResult(item, result) === 'stop') {
                    await interaction.followUp({ content: confirmMessage(interaction.client, result), ephemeral: true }).catch(() => {});
                }
            }
            if (item.status !== 'pending') {
                const nxt = nextPendingIndex(batch.items, index);
                if (nxt !== -1) batch.page = nxt;
            }
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
            pendingAutobuilds.delete(item.token);
            item.status = 'cancelled';
        }
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
    const item = batches.get(key)?.items[index];
    const data = item && pendingAutobuilds.get(item.token);
    if (!data || item.status !== 'pending') return expired(interaction);
    return interaction.showModal(buildEditModal(item.token, data, id('editmodal', key, index)));
}

async function applyBatchEdit(interaction) {
    const { key, index } = parse(interaction.customId);
    const batch = batches.get(key);
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
    runBulk, handleBatchComponent, showBatchEditModal, applyBatchEdit, MAX_SCREENSHOTS,
    // Exported for scripts/autobuildBulk.test.js.
    batches, batchDuplicateNote, batchDuplicateOf, flagsOf, overview, nextPendingIndex, renderPage, renderSummary, confirmAllItems, applyResult, unreadImages,
};
