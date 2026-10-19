// ==========================================
// RIGHT-CLICK → APPS → "Add to Patch Notes" (message context menu)
// ==========================================
// PROBE STAGE (2026-10-19 09:49 EDT). Before anything is built, this answers one question: does a message context-menu interaction carry a FORWARD's snapshot (its attachments and image urls) without the Message Content intent? Read over REST, the dev app gets the snapshot back blank. This logs what the interaction actually received and shows a private summary. `devOnly` keeps it off prod until the real feature replaces this body.
const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');
const { isOwnerId } = require('../utils/owner');

function describeMessage(msg) {
    return {
        content: msg.content ?? null,
        attachments: [...(msg.attachments?.values() ?? [])].map(a => ({
            name: a.name, url: a.url, proxyURL: a.proxyURL, contentType: a.contentType, width: a.width, height: a.height,
        })),
        embeds: (msg.embeds ?? []).map(e => ({ type: e.data?.type, url: e.url, image: e.image?.url ?? null, thumbnail: e.thumbnail?.url ?? null })),
    };
}

module.exports = {
    devOnly: true,
    data: new ContextMenuCommandBuilder()
        .setName('Add to Patch Notes')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(0)
        // ADMIN-ONLY, like /manage: user-install only.
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),

    async execute(interaction) {
        if (!isOwnerId(interaction.user.id)) {
            return await interaction.reply({ content: '❌ Only the bot owner can use this.', flags: MessageFlags.Ephemeral });
        }
        const msg = interaction.targetMessage;
        const report = {
            id: msg.id,
            channelId: msg.channelId,
            referenceType: msg.reference?.type ?? null,
            self: describeMessage(msg),
            snapshots: [...(msg.messageSnapshots?.values() ?? [])].map(describeMessage),
        };
        console.log('🧪 Add to Patch Notes probe:', JSON.stringify(report, null, 2));
        const snap = report.snapshots[0];
        const lines = [
            `**Message** \`${report.id}\` · forward: ${report.referenceType === 1 ? 'yes' : 'no'}`,
            `**Own copy:** ${report.self.attachments.length} attachment(s), ${report.self.embeds.length} embed(s), content ${report.self.content ? 'present' : 'blank'}`,
            snap
                ? `**Snapshot:** ${snap.attachments.length} attachment(s), ${snap.embeds.length} embed(s), content ${snap.content ? 'present' : 'blank'}`
                : '**Snapshot:** none',
            ...(snap?.attachments ?? []).slice(0, 10).map((a, i) => `${i + 1}. ${a.name} · ${a.contentType ?? '?'} · ${a.width ?? '?'}×${a.height ?? '?'}`),
        ];
        return await interaction.reply({ content: lines.join('\n').slice(0, 1990), flags: MessageFlags.Ephemeral });
    },
};
