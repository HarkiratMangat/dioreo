// ==========================================
// RIGHT-CLICK → APPS → "Edit Loadout" (message context menu)
// ==========================================
// Right-click a /gunsmith build card and /manage's Edit Loadout box opens for that build, already filled (Harkirat, 2026-11-06 19:17 EST: "let's do this next", from the open-items list). Built 2026-11-06 19:27 EST.
// The card is read for its gunsmith code (each option's code on a merged build, shown as `WEAPON-CODE`) and, failing that (a DMZ build has no code), its weapon heading: one build of that weapon opens straight away, several show a pick list. One build opens its Edit box straight away through handlers/manage/loadouts.js openFromSlash, which also checks the clicker's edit permission on that page; several (a merged build's options) show /manage's own pick list (`mng_pick_<group>_edit`).
const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');

// Every text a message carries: its content, embed text and each Components V2 Text Display, found by walking the raw component JSON (a /gunsmith card is a Container of Sections and Text Displays).
function messageTexts(message) {
    const out = [];
    if (message?.content) out.push(message.content);
    for (const e of message?.embeds || []) out.push(e.title || '', e.description || '');
    const walk = (node) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) return node.forEach(walk);
        if (typeof node.content === 'string') out.push(node.content);
        for (const k of ['components', 'accessory', 'items']) if (node[k]) walk(node[k]);
    };
    walk((message?.components || []).map(c => (typeof c?.toJSON === 'function' ? c.toJSON() : c)));
    return out.filter(Boolean);
}

// What a card says about its build: the gunsmith codes in backticks (number-letter pairs), the weapon heading, and the build number in its footer. Pure.
function cardIdentity(texts) {
    const all = texts.join('\n');
    // A card shows the code with its weapon in front, the way the game's share text reads (`LW3-TUNDRA-2F4D5A8A9E`), so the code is the number-letter run at the END of each backticked token.
    const codes = [...new Set([...all.matchAll(/`([^`\n]{4,60})`/g)].map(m => (/((?:[0-9][A-Z]){2,}[0-9]?)$/.exec(m[1].toUpperCase().trim()) || [])[1]).filter(Boolean))];
    const heading = /^#{1,3}\s+(.+)$/m.exec(all);
    const weapon = heading ? heading[1].replace(/<a?:\w+:\d+>/g, '').replace(/[`*_]/g, '').trim() : null;
    const n = /\bBuild (\d+) of \d+\b/.exec(all);
    return { codes, weapon, buildNumber: n ? Number(n[1]) : null };
}

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Edit Loadout')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(0)
        .setIntegrationTypes([1]).setContexts([0, 1, 2]),
    messageTexts,
    cardIdentity,

    async execute(interaction) {
        const Loadout = require('../models/Loadout');
        const lo = require('../utils/loadoutOptions');
        const form = require('../utils/loadoutForm');
        const loadouts = require('../handlers/manage/loadouts');
        const id = cardIdentity(messageTexts(interaction.targetMessage));
        const hits = [];
        if (id.codes.length) {
            const docs = await Loadout.find({ $or: [{ shareCode: { $in: id.codes } }, { 'variants.shareCode': { $in: id.codes } }] }).lean();
            for (const d of docs) lo.optionsOf(d).forEach((o, i) => { if (id.codes.some(c => form.sameCode(c, o.shareCode))) hits.push({ doc: d, option: i }); });
        }
        if (!hits.length && id.weapon) {
            const escaped = id.weapon.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const query = { weaponName: new RegExp(`^${escaped}$`, 'i'), ...(id.buildNumber ? { buildName: `Build ${id.buildNumber}` } : {}) };
            // No code on the card: a DMZ card, so its DMZ builds first.
            const docs = (await Loadout.find(query).lean()).sort((a, b) => Number(b.mode === 'DMZ') - Number(a.mode === 'DMZ') || form.compareBuilds(a, b));
            const mode = docs[0]?.mode;
            for (const d of docs.filter(x => x.mode === mode)) lo.optionsOf(d).forEach((o, i) => hits.push({ doc: d, option: (d.variants || []).length ? i : null }));
        }
        if (!hits.length) return await interaction.reply({ content: "That isn't a /gunsmith build card I can match to a saved build. Right-click the card itself (the one with the weapon's name and gunsmith code).", flags: MessageFlags.Ephemeral });
        const groupOf = (d) => (d.mode === 'DMZ' ? 'loadouts_dmz' : 'loadouts_mp');
        const valueOf = (h) => (h.option === null || (h.option === 0 && !(h.doc.variants || []).length) ? String(h.doc._id) : `${h.doc._id}~${h.option}`);
        if (hits.length === 1) return await loadouts.openFromSlash(interaction, groupOf(hits[0].doc), valueOf(hits[0]), 'edit');
        // Several: a merged build's options (or one code saved twice). /manage's own pick list opens the chosen one's Edit box.
        const group = groupOf(hits[0].doc);
        const { resolveAction, DENIAL_MESSAGE } = require('../utils/manageActions');
        const gate = await resolveAction(group, 'edit', interaction.user.id);
        if (!gate.ok) return await interaction.reply({ content: gate.message || DENIAL_MESSAGE[gate.reason], flags: MessageFlags.Ephemeral });
        const options = hits.filter(h => groupOf(h.doc) === group).slice(0, 25).map(h => {
            const n = form.buildNumberOf(h.doc.buildName);
            const tag = h.option === null ? String(n ?? h.doc.buildName) : lo.optionTag(n ?? 1, h.option);
            return { label: `${h.doc.weaponName} · Build ${tag}`.slice(0, 100), description: (lo.optionsOf(h.doc)[h.option || 0]?.shareCode || '').slice(0, 100) || undefined, value: valueOf(h) };
        });
        return await interaction.reply({ content: 'Which build or option?', components: [{ type: 1, components: [{ type: 3, custom_id: `mng_pick_${group}_edit`, placeholder: 'Pick one to edit', options }] }], flags: MessageFlags.Ephemeral });
    },
};
