// ==========================================
// COMMAND: /embedtest (DEV BOT ONLY) — render pasted Components V2 JSON
// ==========================================
// Built 2026-10-17 11:05 EDT at Harkirat's ask: "build me an embed testing command on the dev bot … i provide it json … and the bot renders it out into a proper components v2 embed for me to view so i can check that a design/format makes sense. It wouldnt actually be functional embeds, they're use dummy buttons but i want them to use the real emojis from the bot". The parsing, emoji matching and dummy wiring are pure and live in utils/embedTester.js; this file is the I/O.
//
// ⚠️ DEV-ONLY IS ENFORCED TWICE. `devOnly: true` below makes bot/registry.js skip this module unless NODE_ENV is 'development' — which only `.env.dev` sets (utils/cloudinaryDevGuard.js's header records why prod can never evaluate it true) — so prod never registers it. execute() refuses outside development and for anyone but the owner as well, because it posts arbitrary content as the bot.
//
// Three ways in: `json:` (a string option, 6,000 characters; Discord turns pasted newlines into spaces, harmless for JSON because newlines inside its strings are already `\n`), `file:` (a .json/.txt attachment, for a panel too big for either box), or neither, which opens a modal with one 4,000-character box. The modal's submit is handled in handlers/embedTest.js and comes back through renderPayload() here.

const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { isOwner } = require('../utils/adminAccess');
const tester = require('../utils/embedTester');

const MODAL_ID = 'embedtest_modal';
const MODAL_FIELD = 'embedtest_json';
const MAX_FILE_BYTES = 200 * 1024;
// Discord allows 2,000 characters in a plain message; the rest of an error is cut with a marker rather than failing the error reply itself.
const MAX_REPLY = 1900;

const clip = s => (s.length > MAX_REPLY ? `${s.slice(0, MAX_REPLY)}\n…(cut)` : s);

function isAllowed(interaction) {
    return process.env.NODE_ENV === 'development' && isOwner(interaction.user.id);
}

async function fetchAppEmojis(client) {
    // Same raw route utils/emojiMap.js's refreshEmojiIds uses. Fetched on every render rather than cached, so an emoji he uploads to the dev app a moment ago is usable in the very next test.
    const appId = client.application?.id ?? client.user?.id;
    const res = await client.rest.get(`/applications/${appId}/emojis`);
    return res?.items ?? res ?? [];
}

// Answers with plain text whether or not the interaction was already deferred. Awaited inside its own try/catch: an error branch must never reject past the router's crash net (.claude/rules/interaction-router.md).
async function say(interaction, content, ephemeral = true) {
    try {
        if (interaction.deferred || interaction.replied) await interaction.editReply({ content: clip(content), components: [], embeds: [] });
        else await interaction.reply({ content: clip(content), flags: ephemeral ? 64 : 0 });
    } catch (err) {
        console.error('embedtest: could not deliver a reply (interaction likely expired):', err?.message || err);
    }
}

/**
 * Parse → defer → resolve emojis → send. Shared by the slash command and the modal submit. `visibility` is 'hidden' | 'public' | null (null: the JSON's own ephemeral bit decides, else public).
 */
async function renderPayload(interaction, rawText, visibility = null) {
    const parsed = tester.parseInput(rawText);
    if (parsed.error) return say(interaction, parsed.error);
    const message = tester.normalizePayload(parsed.value);
    if (message.error) return say(interaction, message.error);

    const ephemeral = visibility ? visibility === 'hidden' : message.ephemeral;
    await interaction.deferReply({ flags: ephemeral ? 64 : 0 }); // flags, not the deprecated `ephemeral` option

    const dummies = tester.dummyComponents(message.components);
    const count = tester.countComponents(message.components);

    let report = { named: [], remapped: [], fixed: [], unresolved: [] };
    try {
        report = tester.resolveEmojis(message, tester.buildEmojiIndex(await fetchAppEmojis(interaction.client)));
    } catch (err) {
        // Rendering without emoji is still worth showing; say why the emoji may be text.
        report.unresolved.push(`(emoji list unavailable: ${err?.message || err})`);
    }

    try {
        await sendV2Payload(interaction, message.components, {
            content: message.content,
            embeds: message.embeds,
            flags: message.sendFlags,
            allowedMentions: { parse: [] }, // a pasted <@id> or @everyone renders as a mention without pinging anyone
            // ⚠️ skipExpiry: the 10-minute idle-disable would grey out the dummy buttons and change the very design being judged. It meets sendV2Payload's bar for the flag — "nothing on this panel can go stale" — because every control here is a dummy that reads no state.
            skipExpiry: true,
        });
    } catch (err) {
        const cap = count > tester.COMPONENT_CAP ? `\nThis payload has **${count}** components; Discord allows ${tester.COMPONENT_CAP}, counted recursively.` : '';
        return say(interaction, `Discord refused this payload.${cap}\n\`\`\`\n${tester.formatDiscordError(err)}\n\`\`\``);
    }

    const note = tester.formatReport(report, dummies);
    if (note) {
        try {
            await interaction.followUp({ content: clip(note), flags: 64, allowedMentions: { parse: [] } });
        } catch (err) {
            console.error('embedtest: could not send the emoji note:', err?.message || err);
        }
    }
}

function buildModal() {
    return new ModalBuilder()
        .setCustomId(MODAL_ID)
        .setTitle('Embed tester')
        .addComponents(new ActionRowBuilder().addComponents(
            new TextInputBuilder()
                .setCustomId(MODAL_FIELD)
                .setLabel('Message JSON')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('{ "flags": 32768, "components": [ … ] }')
                .setRequired(true)
                .setMaxLength(4000)
        ));
}

module.exports = {
    devOnly: true,
    MODAL_ID,
    MODAL_FIELD,
    isAllowed,
    renderPayload,
    data: new SlashCommandBuilder()
        .setName('embedtest')
        .setDescription('Dev bot: render pasted message JSON with the bot\'s own emojis')
        .addStringOption(o => o.setName('json').setDescription('The message JSON (leave empty to paste it in a box instead)').setMaxLength(6000))
        .addAttachmentOption(o => o.setName('file').setDescription('A .json or .txt file, for a payload too long to paste'))
        .addStringOption(o => o.setName('visibility').setDescription('Show the render only to you, or to everyone in the chat (default: what the JSON says)')
            .addChoices({ name: 'Hidden', value: 'hidden' }, { name: 'Public', value: 'public' }))
        // Owner tooling, reached anywhere through his own user install -- the same [1] the admin commands use.
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),

    async execute(interaction) {
        if (!isAllowed(interaction)) return say(interaction, '🔒 `/embedtest` is a dev-bot tool for the owner.');

        const visibility = interaction.options.getString('visibility');
        const file = interaction.options.getAttachment('file');
        const json = interaction.options.getString('json');

        if (file) {
            if (file.size > MAX_FILE_BYTES) return say(interaction, `That file is ${Math.round(file.size / 1024)} KB; the limit is ${MAX_FILE_BYTES / 1024} KB.`);
            let text;
            try {
                // Bounded so a slow CDN cannot run past Discord's 3-second window before the deferReply inside renderPayload.
                const res = await fetch(file.url, { signal: AbortSignal.timeout(2000) });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                text = await res.text();
            } catch (err) {
                return say(interaction, `Couldn't read that file: ${err?.message || err}`);
            }
            return renderPayload(interaction, text, visibility);
        }
        if (json) return renderPayload(interaction, json, visibility);
        await interaction.showModal(buildModal());
    },
};
