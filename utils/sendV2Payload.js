// utils/sendV2Payload.js
const { Routes } = require('discord.js');

// Shared "answer THIS interaction's own deferred response with raw Components V2 JSON" send --
// discord.js's high-level reply()/followUp()/update() don't reliably serialize raw V2 JSON (no
// builder class exists for a type-17 Container), so every V2 command bypasses them with a raw
// `rest.patch(Routes.webhookMessage(...))` call. That exact boilerplate used to be repeated
// verbatim at every V2 command's send site; collapsed to one place here. `flags` defaults to 32768
// (Components V2) since that's every caller's common case -- pass an explicit override for the rare
// site that needs something else (e.g. /timestamp's dropdown re-render, which has to manually
// re-OR in the ephemeral bit since that path doesn't go through a normal deferReply).
function sendV2Payload(interaction, components, { content = '', flags = 32768, embeds, allowedMentions } = {}) {
    const body = { content, components, flags };
    if (embeds !== undefined) body.embeds = embeds;
    if (allowedMentions !== undefined) body.allowed_mentions = allowedMentions;

    return interaction.client.rest.patch(
        Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
        { body }
    );
}

module.exports = { sendV2Payload };
