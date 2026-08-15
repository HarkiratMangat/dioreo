// ==========================================
// AUDIT — INTERACTION HANDLER
// ==========================================
// /audit panel. Mirrors handlers/alerts.js's shape -- see that file's header for the crash-net
// contract this module follows too (awaited from handlers/router.js's single top-level try/catch;
// no local try/catch that swallows, no listeners registered here).
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `audit_`.
//
// customId shape: most branches carry filter state after the action, joined on '~' --
// `audit_page_<n>~<pageFilter>~<actorFilter>`, `audit_export~<pageFilter>~<actorFilter>`,
// `audit_filterpage~<actorFilter>` (a SELECT whose own value carries the page filter),
// `audit_filteractor~<pageFilter>` (a BUTTON opening a modal) /
// `audit_filteractormodal~<pageFilter>` (that modal's submit). '~' never appears inside a page key
// (loadouts_mp/loadouts_dmz use '_') or a Discord snowflake, so splitting on it is unambiguous.

const OWNED_PREFIXES = ["audit_"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

// Splits the trailing `~pf~af` (or `~af` for the single-state branches) off a customId that has
// already had its leading action token stripped.
function parseState(rest) {
    const [pf, af] = (rest || '').split('~');
    return { filterPage: pf || null, filterActor: af || null };
}

async function route(interaction) {
    // --- Export: a FRESH ephemeral message carrying the .txt, so the panel itself is left untouched.
    if (interaction.isButton() && interaction.customId.startsWith('audit_export~')) {
        await interaction.deferReply({ flags: 64 });
        const { buildChangeExport } = require('../utils/changeStore');
        const { filterPage, filterActor } = parseState(interaction.customId.replace('audit_export~', ''));
        const text = await buildChangeExport({ filterPage, filterActor });
        const stamp = new Date().toISOString().slice(0, 10);
        return interaction.editReply({ content: '📄 Change log export:', files: [{ attachment: Buffer.from(text, 'utf-8'), name: `dior-audit-${stamp}.txt` }] });
    }

    // --- Pagination through the recent-change list (custom_id encodes target page + filters,
    // stateless -- same shape /alerts uses).
    if (interaction.isButton() && interaction.customId.startsWith('audit_page_')) {
        await interaction.deferUpdate();
        const { buildAuditPanel } = require('../commands/audit');
        const { sendV2Payload } = require('../utils/sendV2Payload');
        const rest = interaction.customId.replace('audit_page_', '');
        const [pageStr, tail] = [rest.split('~')[0], rest.slice(rest.indexOf('~') + 1)];
        const page = parseInt(pageStr, 10) || 0;
        const { filterPage, filterActor } = parseState(tail);
        return sendV2Payload(interaction, await buildAuditPanel({ page, filterPage, filterActor }));
    }

    // --- Page filter dropdown -- its own picked value carries the page filter (or the "All pages"
    // sentinel), the customId tail carries whatever actor filter was already active.
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('audit_filterpage~')) {
        await interaction.deferUpdate();
        const { buildAuditPanel } = require('../commands/audit');
        const { sendV2Payload } = require('../utils/sendV2Payload');
        const filterActor = interaction.customId.replace('audit_filterpage~', '') || null;
        const picked = interaction.values[0];
        const filterPage = picked === '__all__' ? null : picked;
        return sendV2Payload(interaction, await buildAuditPanel({ page: 0, filterPage, filterActor }));
    }

    // --- "Filter by Actor" button -- opens a one-field modal collecting a Discord user ID (blank
    // clears the filter). The already-active page filter rides along in the customId.
    if (interaction.isButton() && interaction.customId.startsWith('audit_filteractor~')) {
        const filterPage = interaction.customId.replace('audit_filteractor~', '') || '';
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
        const modal = new ModalBuilder()
            .setCustomId(`audit_filteractormodal~${filterPage}`)
            .setTitle('Filter by Actor')
            .addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('actor_id')
                    .setLabel('Discord user ID (blank clears the filter)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            ));
        return interaction.showModal(modal);
    }

    // --- That modal's submit.
    if (interaction.isModalSubmit() && interaction.customId.startsWith('audit_filteractormodal~')) {
        await interaction.deferUpdate();
        const filterPage = interaction.customId.replace('audit_filteractormodal~', '') || null;
        const rawId = interaction.fields.getTextInputValue('actor_id').trim().replace(/[<@!>]/g, '');
        const filterActor = /^\d{17,20}$/.test(rawId) ? rawId : null;
        const { buildAuditPanel } = require('../commands/audit');
        const { sendV2Payload } = require('../utils/sendV2Payload');
        return sendV2Payload(interaction, await buildAuditPanel({ page: 0, filterPage, filterActor }));
    }

    // --- Clear both filters in one click.
    if (interaction.isButton() && interaction.customId === 'audit_clearfilters') {
        await interaction.deferUpdate();
        const { buildAuditPanel } = require('../commands/audit');
        const { sendV2Payload } = require('../utils/sendV2Payload');
        return sendV2Payload(interaction, await buildAuditPanel({ page: 0 }));
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handleAuditInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleAuditInteraction, OWNED_PREFIXES };
