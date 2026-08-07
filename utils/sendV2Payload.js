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
//
// SINGLE-HOP PAGINATION (added 2026-08-06 22:16 EDT, the "pagination perf hybrid" design agreed 2026-07-14)
// -- pure string-building nav (draws/calendar/drawprices/settings pagination + toggles) used to cost
// TWO Discord round-trips per click: index.js's router called `interaction.deferUpdate()` (hop 1,
// just an ack) BEFORE the command's execute() ever ran, then this function's `rest.patch('@original')`
// (hop 2) delivered the actual content once building finished. For a path with no image/network work,
// hop 1 buys nothing but latency -- Discord's interaction-callback endpoint can deliver the real
// UPDATE_MESSAGE as the FIRST and ONLY response. So: if the interaction hasn't been acked yet
// (`!interaction.deferred && !interaction.replied` -- true exactly when the router skipped
// deferUpdate/deferReply for a light path), POST straight to the callback endpoint instead of
// patching. Any path that DID defer first (the initial slash-command invocation, or a heavy path like
// View Colors that still defers to protect its image/ffmpeg work) is completely unaffected -- it still
// patches, same as before. See `.claude/rules/rendering-and-ui.md` and `docs/db-deferred-list.md`'s
// "Pagination perf hybrid" entry for the full traced investigation and the heuristic for which paths
// qualify (CPU/string-building only, no image or network work before responding).
function sendV2Payload(interaction, components, { content = '', flags = 32768, embeds, allowedMentions, files } = {}) {
    const body = { content, components, flags };
    if (embeds !== undefined) body.embeds = embeds;
    if (allowedMentions !== undefined) body.allowed_mentions = allowedMentions;

    // `files` (added 2026-07-13, utils/colorPaletteView.js's generated swatch-color images) --
    // discord.js's REST manager switches to multipart/form-data automatically whenever a `files`
    // array is present alongside `body`, same underlying mechanism as a normal message attachment.
    // Each entry needs `{ data: Buffer, name: string }`; components reference them via
    // `attachment://{name}` in their media URL, matching the file's own `name` here.
    //
    // BUG FIX (2026-07-14, found live: "Refresh Colors" said it found new colors, but the panel kept
    // showing the OLD swatch images until switching pages and back): Discord's edit-message API needs
    // an explicit `attachments` field to know what to do with a message's EXISTING attachments when
    // new ones are uploaded in the same edit -- if it's omitted, Discord can retain old attachments
    // instead of cleanly replacing them, since nothing told it the new files should REPLACE rather
    // than ADD TO what's already there. Every caller here always re-generates and re-sends the FULL
    // set of attachments its components need on every render (View Colors never expects to "keep" an
    // old swatch image from a prior render) -- so whenever `files` is present, `attachments: []`
    // tells Discord to discard whatever was on the message before and use only what's in this
    // request. Callers that DON'T pass `files` are unaffected (attachments field omitted entirely,
    // same as before) -- most V2 commands in this bot have no attachments at all.
    const options = { body };
    if (files !== undefined) {
        options.files = files;
        body.attachments = [];
    }

    // Not yet acknowledged (router skipped deferUpdate/deferReply for a light path) -> this IS the
    // interaction's first and only response. type 7 = UPDATE_MESSAGE. Files still work the same way
    // here -- discord.js's REST manager switches to multipart the moment `options.files` is present,
    // regardless of which route it's posted to.
    if (!interaction.deferred && !interaction.replied) {
        return interaction.client.rest.post(
            Routes.interactionCallback(interaction.id, interaction.token),
            { ...options, body: { type: 7, data: body } }
        );
    }

    return interaction.client.rest.patch(
        Routes.webhookMessage(interaction.applicationId, interaction.token, '@original'),
        options
    );
}

module.exports = { sendV2Payload };
