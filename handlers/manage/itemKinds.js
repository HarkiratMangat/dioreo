// handlers/manage/itemKinds.js -- "Set item kinds": after a draw is saved, the items the draw index still has no kind for (weapon, character, vehicle) are asked about instead of left blank. Harkirat, 2026-11-01 12:41 EDT: "then ask me...? why leave it blank and unasked? doesn't that create staleness and gaps?"
//
// WHAT IS ASKED: a draw is in the index once the bot has its picture (utils/drawCatalog.js recordCatalogImage). Its new items take a kind on their own when it is known (utils/drawCatalog.js mergeItems: the same item elsewhere, another skin of the same base, or the gunsmith's weapon list); only the rest reach this box. A draw with no picture has no index document yet, so there is nothing to ask about until it gets one.
//
// THE FLOW: a draw save (single Add/Edit Draw, Quick Add) calls askItemKinds() after its own result. If anything is unknown, one more private message lists those items with a Set item kinds button -> a box of up to five dropdowns (Discord's limit) -> the answers are written and the message shows what is left, if anything. The list lives in memory for 30 minutes under a short token; after that, or a restart, the button says so and nothing is lost but the question.
//
// custom_ids: mng_kinds_<token> · modal_kinds_<token>. The router's /manage lock runs on both prefixes first.
const { randomBytes } = require('crypto');
const { ModalBuilder, LabelBuilder, StringSelectMenuBuilder } = require('discord.js');
const emojis = require('../../utils/emojiMap');
const { sendV2Payload } = require('../../utils/sendV2Payload');
const { notePanel, ACCENT, FAIL_ACCENT } = require('../../utils/managePanels');

const TTL_MS = 30 * 60 * 1000;
const PER_BOX = 5;
const PENDING = new Map(); // token -> { userId, items: [{ slug, title, name }], at }
const KIND_OPTIONS = [
    { label: 'Weapon', value: 'weapon' },
    { label: 'Character', value: 'character' },
    { label: 'Vehicle', value: 'vehicle' },
    { label: 'Other (emote, charm, …)', value: 'other' }
];

function sweep(now = Date.now()) {
    for (const [token, p] of PENDING) if (now - p.at > TTL_MS) PENDING.delete(token);
}

function askPanel(token, items) {
    const shown = items.slice(0, 15).map(i => `- **${i.name}** · ${i.title}`);
    const more = items.length > 15 ? `\n-# …and ${items.length - 15} more` : '';
    return [{ type: 17, accent_color: ACCENT.draws, components: [
        { type: 10, content: `### ${emojis.warn} Which kind is each new item?\n-# The draw index doesn't know ${items.length === 1 ? 'this one' : 'these'} yet. Five at a time.\n${shown.join('\n')}${more}` },
        { type: 1, components: [{ type: 2, style: 1, label: `Set item kinds (${items.length})`, custom_id: `mng_kinds_${token}` }] }
    ] }];
}

// After a draw save: one private message asking about the saved draws' unknown items, or nothing at all when every kind is known. Never throws: a failure here only skips the question.
async function askItemKinds(interaction, titles) {
    try {
        const { loadCatalog, itemsWithoutKind } = require('../../utils/drawCatalog');
        const items = itemsWithoutKind(await loadCatalog({ force: true }), titles);
        if (!items.length) return null;
        sweep();
        const token = randomBytes(4).toString('hex');
        PENDING.set(token, { userId: interaction.user.id, items, at: Date.now() });
        return await interaction.followUp({ flags: 32768 | 64, components: askPanel(token, items) });
    } catch (err) {
        console.error(`Set item kinds prompt failed: ${err?.message || err}`);
        return null;
    }
}

function buildKindsModal(token, items) {
    return new ModalBuilder().setCustomId(`modal_kinds_${token}`).setTitle('Set Item Kinds').addLabelComponents(
        ...items.slice(0, PER_BOX).map((item, i) => new LabelBuilder()
            .setLabel(item.name.slice(0, 45))
            .setDescription(`In ${item.title}`.slice(0, 100))
            .setStringSelectMenuComponent(new StringSelectMenuBuilder().setCustomId(`k${i}`).setRequired(true).setMinValues(1).setMaxValues(1).addOptions(KIND_OPTIONS)))
    );
}

const expired = () => notePanel(`${emojis.cross} This question has expired (30 minutes, or a restart). The kinds can still be set in the draw index by hand.`, FAIL_ACCENT);

// mng_kinds_<token>
async function handleButton(interaction) {
    sweep();
    const token = interaction.customId.slice('mng_kinds_'.length);
    const p = PENDING.get(token);
    if (!p || p.userId !== interaction.user.id) return sendV2Payload(interaction, expired());
    return interaction.showModal(buildKindsModal(token, p.items));
}

// modal_kinds_<token>: write the answers, then show what is left on the same message.
async function submit(interaction) {
    sweep();
    const token = interaction.customId.slice('modal_kinds_'.length);
    const p = PENDING.get(token);
    if (!p || p.userId !== interaction.user.id) return sendV2Payload(interaction, expired());
    const { setItemKind } = require('../../utils/drawCatalog');
    const answered = p.items.slice(0, PER_BOX);
    const saved = [];
    for (const [i, item] of answered.entries()) {
        let kind = null;
        try { kind = interaction.fields.getStringSelectValues(`k${i}`)[0]; } catch { kind = null; }
        if (kind && await setItemKind(item.slug, item.name, kind)) saved.push(`- ${item.name}: ${KIND_OPTIONS.find(o => o.value === kind).label.split(' (')[0]}`);
    }
    p.items = p.items.slice(PER_BOX);
    p.at = Date.now();
    if (p.items.length) return sendV2Payload(interaction, askPanel(token, p.items));
    PENDING.delete(token);
    return sendV2Payload(interaction, notePanel(`${emojis.checkmark} Saved to the draw index:\n${saved.join('\n')}`, ACCENT.draws));
}

module.exports = { askItemKinds, handleButton, submit, buildKindsModal, askPanel, PENDING, KIND_OPTIONS };
