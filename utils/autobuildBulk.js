// utils/autobuildBulk.js Bulk /autobuild: several Gunsmith screenshots read in one go and reviewed one page per build (Harkirat, 2026-10-20 10:15 EDT, pick "A": both the right-click and /autobuild's extra screenshot slots; 10:24 EDT: the right-click picker stays and takes several picks). Spec: local/project/features/launch-extras/spec.md (gitignored; the decisions are restated in .claude/rules/autobuild.md).
//
// Every build in a batch is an ordinary /autobuild review: its `data` lives in utils/autobuildPipeline.js's pendingAutobuilds under its own token, and reading, saving and editing go through that file's shared halves (extractToData, confirmCore, applyEditFields), so a batch build is saved exactly the way a single one is. This file only holds the batch around them: which builds, in what order, which page is showing, and what happened to each.
//
// Custom ids are `autobuild_b|<action>|<batchKey>|<index>`. The `autobuild_` prefix routes them to handlers/autobuild.js and puts them behind handlers/router.js's /autobuild access check, the same as the single review's buttons.
const crypto = require('crypto');
const { pendingAutobuilds, buildReviewCard, extractToData, confirmCore, confirmMessage, buildEditModal, applyEditFields } = require('./autobuildPipeline');
const { sendV2Payload } = require('./sendV2Payload');

const MAX_SCREENSHOTS = 10;
const BATCH_MS = 30 * 60 * 1000; // a single review keeps 10 minutes; ten reviews need longer
const READ_AT_ONCE = 3;

// key -> { items: [{ url, token, data, status, error, doc, retryToken }], page, skipped, adminId }
// status: pending (to review) · saved · cancelled · failed (couldn't read) · retry (image upload failed on Confirm)
const batches = new Map();

const norm = (a) => String(a || '').trim().toLowerCase();
const weaponKeyOf = (data) => (data.weaponName || '').toLowerCase().replace(/\s+/g, '');

// Two screenshots of the same build in one batch: same weapon, same mode, and either the same Gunsmith code (MP) or the same attachment set, order ignored. Only EARLIER builds that were read and not cancelled count, so the warning sits on the later page, as the spec says. Pure.
function batchDuplicateNote(items, index) {
    const me = items[index]?.data;
    if (!me) return null;
    const set = (d) => [...new Set((d.attachments || []).map(norm).filter(Boolean))].sort().join('|');
    for (let i = 0; i < index; i++) {
        const other = items[i];
        if (!other.data || other.status === 'cancelled' || other.status === 'failed') continue;
        const d = other.data;
        if (weaponKeyOf(d) !== weaponKeyOf(me) || (d.mode || 'MP') !== (me.mode || 'MP')) continue;
        const sameCode = me.mode !== 'DMZ' && me.gunsmithCode && norm(me.gunsmithCode) === norm(d.gunsmithCode);
        if (sameCode || (set(me) && set(me) === set(d))) {
            return `⚠️ **Same as Build ${i + 1} in this batch:** two screenshots of one build. Cancel one of them unless they really are different builds.`;
        }
    }
    return null;
}

// The next build still to review after `from`, wrapping round; -1 when none is left. Pure.
function nextPendingIndex(items, from) {
    for (let step = 1; step <= items.length; step++) {
        const i = (from + step) % items.length;
        if (items[i].status === 'pending') return i;
    }
    return -1;
}

function counts(items) {
    const c = { pending: 0, saved: 0, cancelled: 0, failed: 0, retry: 0 };
    for (const it of items) c[it.status]++;
    return c;
}

function headerLine(batch, index) {
    const c = counts(batch.items);
    const parts = [`Build ${index + 1} of ${batch.items.length}`];
    if (c.saved) parts.push(`✅ ${c.saved} saved`);
    if (c.pending) parts.push(`⏳ ${c.pending} to review`);
    if (c.cancelled) parts.push(`❌ ${c.cancelled} cancelled`);
    if (c.failed + c.retry) parts.push(`⚠️ ${c.failed + c.retry} need a look`);
    if (batch.skipped) parts.push(`${batch.skipped} not read (${MAX_SCREENSHOTS} at most)`);
    return `-# ${parts.join(' · ')}`;
}

const id = (action, key, index = '') => `autobuild_b|${action}|${key}|${index}`;

function pagerRow(batch, key, index) {
    const anyPending = batch.items.some(it => it.status === 'pending');
    const buttons = [
        { type: 2, style: 2, label: '◀ Prev', custom_id: id('page', key, index - 1), disabled: index === 0 },
        { type: 2, style: 2, label: 'Next ▶', custom_id: id('page', key, index + 1), disabled: index === batch.items.length - 1 },
    ];
    if (anyPending) {
        buttons.push({ type: 2, style: 3, label: 'Confirm All', custom_id: id('all', key) });
        buttons.push({ type: 2, style: 4, label: 'Cancel All', custom_id: id('none', key) });
    }
    return { type: 1, components: buttons };
}

// One page of a batch, as Components V2. A build still to review is today's review card with a header, the in-batch duplicate note, its own Confirm/Edit/Cancel and the pager; any other build is a short status card with its screenshot. Pure given the batch.
function renderPage(batch, key, index) {
    const item = batch.items[index];
    const header = headerLine(batch, index);
    if (item.status === 'pending') {
        const card = buildReviewCard(item.token, item.data, {
            header,
            notes: [batchDuplicateNote(batch.items, index)],
            rows: [
                { type: 1, components: [
                    { type: 2, style: 3, label: 'Confirm', custom_id: id('confirm', key, index) },
                    { type: 2, style: 1, label: 'Edit', custom_id: id('edit', key, index) },
                    { type: 2, style: 4, label: 'Cancel', custom_id: id('cancel', key, index) },
                ] },
                pagerRow(batch, key, index),
            ],
        });
        return card.components;
    }
    const line = {
        saved: () => `✅ **Saved:** ${item.doc.weaponName} — ${item.doc.buildName} (${item.doc.category}${item.doc.mode === 'DMZ' ? ', DMZ' : ''})`,
        cancelled: () => '❌ **Cancelled:** nothing saved or uploaded.',
        failed: () => `⚠️ **Couldn't read this screenshot:** ${item.error}`,
        retry: () => `⚠️ **Image upload failed** (${item.error}). Nothing was saved yet. Try the image again with\n\`/autobuild retry_token:${item.retryToken} screenshot:<new attachment>\``,
    }[item.status]();
    return [{ type: 17, accent_color: 2829617, components: [
        { type: 10, content: '# Review Extracted Loadout' },
        { type: 10, content: header },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: line },
        { type: 12, items: [{ media: { url: item.url } }] },
        { type: 14, spacing: 1, divider: true },
        pagerRow(batch, key, index),
    ] }];
}

// The end of a batch: one line per build, and an Open loadout menu for the saved ones. Pure.
function renderSummary(batch, key) {
    const lines = batch.items.map((it, i) => {
        if (it.status === 'saved') return `${i + 1}. ✅ ${it.doc.weaponName} — ${it.doc.buildName} (${it.doc.category}${it.doc.mode === 'DMZ' ? ', DMZ' : ''})`;
        if (it.status === 'retry') return `${i + 1}. ⚠️ image upload failed: \`/autobuild retry_token:${it.retryToken} screenshot:<new attachment>\``;
        if (it.status === 'failed') return `${i + 1}. ⚠️ couldn't read: ${it.error}`;
        return `${i + 1}. ❌ cancelled`;
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
    return [{ type: 17, accent_color: 2829617, components }];
}

function render(batch, key) {
    return batch.items.some(it => it.status === 'pending') ? renderPage(batch, key, batch.page) : renderSummary(batch, key);
}

async function show(interaction, batch, key) {
    return sendV2Payload(interaction, render(batch, key));
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

// Records a confirmCore result on a batch item. Returns 'stop' when the build needs an Edit before it can be saved.
function applyResult(item, result) {
    if (result.status === 'saved') { item.status = 'saved'; item.doc = result.doc; return 'ok'; }
    if (result.status === 'retry') { item.status = 'retry'; item.retryToken = result.retryToken; item.error = result.error; return 'ok'; }
    if (result.status === 'expired') { item.status = 'cancelled'; return 'ok'; }
    return 'stop'; // nocategory · nomode · busy
}

function readingCard(done, total) {
    return [{ type: 17, accent_color: 2829617, components: [
        { type: 10, content: `## Reading ${total} screenshots…\n-# ${done} of ${total} done` },
    ] }];
}

// Reads every screenshot (three at a time), stashes each build as an ordinary review under its own token, and shows the first page. The caller has already deferred (deferReply for /autobuild, deferUpdate for the right-click's picker), exactly like runExtraction.
async function runBulk(interaction, urls, { explicitCategory = null, badgesOption = null, explicitMode = null, skipped = 0 } = {}) {
    const list = urls.slice(0, MAX_SCREENSHOTS);
    skipped += urls.length - list.length;
    const Loadout = require('../models/Loadout');
    const allBuilds = await Loadout.find({}).select('weaponKey weaponName category buildName shareCode attachments mode').lean();
    const items = list.map(url => ({ url, status: 'pending' }));

    let done = 0;
    await sendV2Payload(interaction, readingCard(0, list.length)).catch(() => {});
    let next = 0;
    const worker = async () => {
        while (next < items.length) {
            const item = items[next++];
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
            await sendV2Payload(interaction, readingCard(done, list.length)).catch(() => {});
        }
    };
    await Promise.all(Array.from({ length: Math.min(READ_AT_ONCE, items.length) }, worker));

    const key = crypto.randomBytes(6).toString('hex');
    const batch = { items, page: 0, skipped, adminId: interaction.user.id };
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

// Everything except the Edit button and the modal submit, which have their own entry points below (showModal must answer a button, never a modal submit).
async function handleBatchComponent(interaction) {
    const { action, key, index } = parse(interaction.customId);
    const batch = batches.get(key);
    if (!batch) return expired(interaction);

    if (action === 'confirm' || action === 'all') {
        // Confirm writes a Loadout straight to Mongo, so it asks the same tier the single review's Confirm asks.
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
            await interaction.followUp({ content: `Stopped at Build ${stoppedAt + 1}. ${confirmMessage(interaction.client, result)} Then Confirm All again.`, ephemeral: true }).catch(() => {});
        }
    } else if (action === 'none') {
        for (const item of batch.items) {
            if (item.status !== 'pending') continue;
            pendingAutobuilds.delete(item.token);
            item.status = 'cancelled';
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
    batches, batchDuplicateNote, nextPendingIndex, renderPage, renderSummary, confirmAllItems, applyResult, headerLine,
};
