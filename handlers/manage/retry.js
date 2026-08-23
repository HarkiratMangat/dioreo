// ==========================================
// /manage — FAILED-SUBMISSION RETRY (2026-08-22)
// ==========================================
// Harkirat's ask, filed in docs/db-deferred-list.md: when a modal submit fails, the ephemeral error should carry (a) a copy-pasteable reconstruction of what was typed, so it can go straight back in instead of being retyped from scratch, and (b) a button that reopens the same modal directly -- "so the original `/manage` command message doesn't have to be found in chat."
//
// ⚠️ WHY A BUTTON AND NOT A MODAL. Discord's API cannot answer a MODAL_SUBMIT interaction with another modal (`ModalSubmitInteraction.prototype.showModal` is `undefined` in discord.js v14.26.4 -- see handlers/manage/shared.js's handleSearchSubmit, which pays the same toll). So the failure reply hands out a button, and the BUTTON click opens the refilled modal. That is the same one-extra-click shape pendingManageEdits already uses, and it is a platform constraint, not a design choice.
//
// ⚠️ THE SNIPPET AND THE BUTTON HAVE DIFFERENT LIFETIMES, ON PURPOSE. The token expires in 10 minutes (matching every other pending-token store in this panel); the snippet in the message body does not expire at all. That is the whole reason both were asked for rather than either alone -- the button is the fast path, the snippet is what survives a coffee break.
//
// ⚠️ THE SNIPPET IS IN THE ENTITY'S OWN BULK FORMAT, not a dump of the raw fields. Draws and calendar already have canonical one-line formats (utils/adminParser.js's parseBulkDrawList / parseBulkEvents) and loadouts has its labelled block, so a reconstruction in those formats pastes back into EITHER the field it came from or that entity's Bulk Add modal. A raw field dump would paste back into neither.
const { randomUUID } = require('crypto');

// token -> { modalCustomId, values }
const pendingModalRetries = new Map();
const RETRY_TTL_MS = 10 * 60 * 1000;
// Discord's message content cap is 2000; this leaves generous room for the error text, the hint line and the code fence itself.
const MAX_SNIPPET = 1200;

// A submitted modal's every field as { customId: value }. `interaction.fields.fields` is discord.js's Collection of the submitted components; the `interaction.components` walk is a fallback so a library shape change degrades to "no snippet, no prefill" rather than throwing inside an error handler -- which would replace a useful message with a crash.
function captureModalValues(interaction) {
    const out = {};
    try {
        for (const field of interaction.fields.fields.values()) out[field.customId] = field.value ?? '';
        if (Object.keys(out).length) return out;
    } catch { /* fall through to the component walk */ }
    try {
        for (const row of interaction.components || []) {
            for (const comp of row.components || []) {
                if (comp?.customId) out[comp.customId] = comp.value ?? '';
            }
        }
    } catch { /* leave `out` as whatever was collected */ }
    return out;
}

// ---------------------------------------------------------------- snippet builders
const v = (values, key) => (values[key] || '').trim();

// "Title, m Item 1, l Item 2, July 15, url" -- exactly parseBulkDrawList's own line format, which is also what the Add Draw modal's 5th "Or Paste As One Line" field accepts. Items arrive as one shorthand per LINE and are joined with commas here, which is the only shape difference between the two.
function drawSnippet(values) {
    if (v(values, 'combined')) return v(values, 'combined');
    const items = v(values, 'items').split('\n').map(l => l.trim()).filter(Boolean).join(', ');
    return [v(values, 'title'), items, v(values, 'date'), v(values, 'url')].filter(Boolean).join(', ');
}

// "7/2 - 8/5 | Title" -- parseBulkEvents' format. A blank End Date means All Season, which is what that parser reads "All Season" as, so it is spelled out rather than left empty.
function calendarSnippet(values) {
    const start = v(values, 'start_date');
    const end = v(values, 'end_date') || 'All Season';
    const title = v(values, 'title');
    if (!start && !title) return '';
    return `${start} - ${end} | ${title}`;
}

// The labelled block from utils/adminParser.js's parseBulkLoadoutList. The single-item modal splits its data across pipe-delimited fields ("Build Name | Share Code", "Category | Badges") because Discord caps a modal at 5 inputs; this unpacks those back into the bulk format's own one-field-per-line shape.
function loadoutSnippet(values) {
    const weapon = v(values, 'weapon');
    const [buildName, shareCode] = v(values, 'build').split('|').map(s => (s || '').trim());
    const [category, badges] = v(values, 'meta').split('|').map(s => (s || '').trim());
    const lines = [`${weapon} | ${category || 'AR'}`];
    if (buildName) lines.push(`Build: ${buildName}`);
    if (v(values, 'image')) lines.push(`Image: ${v(values, 'image')}`);
    if (shareCode) lines.push(`Code: ${shareCode}`);
    if (badges) lines.push(`Badges: ${badges}`);
    lines.push(...v(values, 'attachments').split('\n').map(a => a.trim()).filter(Boolean).map(a => `- ${a}`));
    return lines.join('\n');
}

// A bulk modal's paste IS already in its canonical format, so the snippet is the text straight back. Labelled when a modal has two paste fields (Draws' New + Returning) so the two halves can be told apart on the way back in.
const passthrough = (key) => (values) => v(values, key);
function drawsBulkSnippet(values) {
    const parts = [];
    if (v(values, 'new_text')) parts.push(`# New Draws\n${v(values, 'new_text')}`);
    if (v(values, 'returning_text')) parts.push(`# Returning Draws\n${v(values, 'returning_text')}`);
    return parts.join('\n\n');
}

// ---------------------------------------------------------------- the modal table Each entry rebuilds its modal from the customId alone. Every EDIT builder is handed a SYNTHETIC empty document rather than a database read: every field it would pre-fill is overwritten from the captured values one step later, so a re-fetch would be a round trip whose result is discarded -- and it would also fail exactly when the record was deleted between the two clicks, which is precisely when the admin most wants their typing back.
function specs() {
    const m = require('../../commands/manage');
    return [
        { test: (id) => id === 'add_draw_new' || id === 'add_draw_returning',
          rebuild: (id) => m.buildAddDrawModal(id.replace('add_draw_', '')), snippet: drawSnippet },
        { test: (id) => id.startsWith('edit_draw_'),
          rebuild: (id) => { const [, , targetId, drawType] = id.split('_');
                             return m.buildEditDrawModal({ title: '', items: [], date: new Date(), thumbnailUrl: '' }, targetId, drawType); },
          snippet: drawSnippet },
        { test: (id) => id === 'modal_draws_bulk_add_both' || id === 'modal_draws_bulk_replace_both',
          rebuild: (id) => m.buildBulkBothDrawsModal(id.includes('_replace_') ? 'replace' : 'add'), snippet: drawsBulkSnippet },

        { test: (id) => id === 'modal_calendar_add', rebuild: () => m.buildCalendarAddModal(), snippet: calendarSnippet },
        { test: (id) => id.startsWith('edit_calendar_'),
          rebuild: (id) => m.buildEditCalendarModal({ title: '', date: null, endDate: null, isOngoing: true, category: 'event', isDoubleCP: false }, id.replace('edit_calendar_', '')),
          snippet: calendarSnippet },
        { test: (id) => id === 'modal_calendar_bulk_add' || id === 'modal_calendar_bulk_replace',
          rebuild: (id) => m.buildCalendarBulkModal(id === 'modal_calendar_bulk_replace' ? 'replace' : 'add'), snippet: passthrough('bulk_text') },

        { test: (id) => id.startsWith('add_loadout_'),
          rebuild: (id) => m.buildAddLoadoutModal(id.replace('add_loadout_', '')), snippet: loadoutSnippet },
        { test: (id) => id.startsWith('edit_loadout_'),
          rebuild: (id) => m.buildEditLoadoutModal({ weaponName: '', buildName: '', shareCode: '', attachments: [], imageKey: '', category: '', isMeta: false, categoryRank: null, dmzRangeRank: null, isToxic: false }, id.replace('edit_loadout_', '')),
          snippet: loadoutSnippet },
        { test: (id) => id.startsWith('modal_loadouts_bulk_add_'),
          rebuild: (id) => m.buildLoadoutsBulkAddModal(id.replace('modal_loadouts_bulk_add_', '')), snippet: passthrough('bulk_text') },
    ];
}

function specFor(modalCustomId) {
    return specs().find(s => s.test(modalCustomId)) || null;
}

// Inline code for a one-liner, a fence for anything multi-line -- Harkirat asked for "a one-line inline-code block", which is right for a single item and wrong for a pasted list. A literal ``` inside the text would otherwise close the fence early and spill the rest as prose, so it is broken with a zero-width space.
function codeBlock(text) {
    const clipped = text.length > MAX_SNIPPET
        ? `${text.slice(0, MAX_SNIPPET)}\n… (truncated here -- "Try Again" still carries the full text)`
        : text;
    if (!clipped.includes('\n')) return `\`${clipped.replace(/`/g, '​`')}\``;
    return `\`\`\`\n${clipped.replace(/```/g, '`​``')}\n\`\`\``;
}

/**
 * The replacement for `interaction.followUp({ content: `❌ ${why}` })` in every /manage modal-submit failure branch. Falls back to a plain error message -- never a throw -- for a modal with no entry in the table above, so adding a new modal can't turn its own error path into a crash.
 *
 * Handles both response states on purpose: most submit handlers deferReply() first (so followUp), but the validation branches that reject before any DB work have not acked yet (so reply).
 */
async function failWithRetry(interaction, message) {
    const send = (payload) => (interaction.deferred || interaction.replied)
        ? interaction.followUp(payload)
        : interaction.reply({ ...payload, ephemeral: true });

    const spec = specFor(interaction.customId);
    if (!spec) return await send({ content: `❌ ${message}` });

    const values = captureModalValues(interaction);
    const token = randomUUID().slice(0, 8);
    pendingModalRetries.set(token, { modalCustomId: interaction.customId, values });
    setTimeout(() => pendingModalRetries.delete(token), RETRY_TTL_MS).unref();

    let content = `❌ ${message}`;
    let snippet = '';
    try { snippet = (spec.snippet(values) || '').trim(); } catch { snippet = ''; }
    if (snippet) content += `\n**What you entered** — copy this if you want to keep it:\n${codeBlock(snippet)}`;
    content += `\n-# **Try Again** reopens this form with your values already filled in — no need to find the original \`/manage\` message. The button stops working after 10 minutes; the text above doesn't.`;

    return await send({
        content,
        components: [{ type: 1, components: [{ type: 2, style: 1, label: 'Try Again', custom_id: `mng_retry_${token}` }] }]
    });
}

/**
 * The `mng_retry_{token}` button's response: the same modal, refilled. Returns null when the token has expired, so the caller can say so rather than opening a blank form the admin would mistake for their own data being lost.
 *
 * Refills through the modal's JSON rather than the builder API: `showModal()` accepts raw API data, and mutating `value` on the serialized payload avoids reaching into ActionRowBuilder/TextInputBuilder internals whose shape is a discord.js implementation detail.
 */
function buildRetryModal(token) {
    const pending = pendingModalRetries.get(token);
    if (!pending) return null;
    const spec = specFor(pending.modalCustomId);
    if (!spec) return null;

    const json = spec.rebuild(pending.modalCustomId).toJSON();
    for (const row of json.components || []) {
        for (const comp of row.components || []) {
            const stored = pending.values[comp.custom_id];
            if (typeof stored === 'string') comp.value = stored;
        }
    }
    return json;
}

module.exports = { failWithRetry, buildRetryModal, pendingModalRetries, captureModalValues, specFor, codeBlock, loadoutSnippet, drawSnippet, calendarSnippet };
