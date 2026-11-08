// ==========================================
// /manage patch-notes — the rehauled panel: routing, permission checks, saves
// ==========================================
// Built 2026-11-07 21:06 EST (the /manage rehaul's remaining panels, builder C2), on the pattern of the draws panel (handlers/manage/drawsPanel/).
//
// ⚠️ SAVES GO THROUGH THE EXISTING CODE. Edit Date & Info, Images 1-5 / 6-10, Add New Season and a past season's Edit open the real pop-ups (commands/manage.js buildPatch*Modal) re-id'd to this panel's own ids, and on submit hand the fields to handlers/manage/patchnotes.js setDateInfo / setUrls / addSeason / editSeason (the old handler, now called with `{ customId, onResult }`), so the ChangeLog row, the Revert button and the permission check are the old ones. Purge uses patchnotes.purge.
//
// ⚠️ PERMISSIONS: the router's /manage lock runs first (`mng_`); every action also runs utils/manageActions.js resolveAction for its own tier before it opens a pop-up or writes, a past season's Edit checks core/permissions.js's 'manage.patchseasonPick' (what the old Past Seasons dropdown checked), and a purge re-checks the destructive tier. core/changeset.js commitSet checks every op once more.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Nothing here catches to swallow; error-branch replies are awaited.

const emojis = require('../../../utils/emojiMap');
const { sendV2Payload } = require('../../../utils/sendV2Payload');
const V = require('./views');

const PREFIX = 'mng_pn|';
const manageCommand = () => require('../../../commands/manage');
const oldSave = () => require('../patchnotes');
const getDoc = () => require('../../../models/SeasonalData').findOne({ docType: 'global' }).lean();

// ---------- answering ----------
async function show(interaction, components, { ephemeral = true } = {}) {
    if (!interaction.deferred && !interaction.replied) {
        if (interaction.isChatInputCommand?.() || (interaction.isModalSubmit?.() && !interaction.message)) await interaction.deferReply({ flags: ephemeral ? 64 : 0 });
        else await interaction.deferUpdate();
    }
    return sendV2Payload(interaction, components, { skipExpiry: true });
}
async function say(interaction, content) {
    try {
        if (interaction.deferred || interaction.replied) await interaction.followUp({ content, flags: 64 });
        else await interaction.reply({ content, flags: 64 });
    } catch (e) { console.error('manage patch notes: could not answer (interaction likely expired):', e.message); }
}

// ---------- permission per action ----------
async function gate(interaction, action) {
    const { resolveAction, DENIAL_MESSAGE } = require('../../../utils/manageActions');
    const g = await resolveAction('patchnotes', action, interaction.user.id);
    if (g.ok) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, g.message || DENIAL_MESSAGE[g.reason] || '🔒 You do not have access to that.');
    return false;
}
// A past season's Edit is the old Past Seasons dropdown's press (handlers/manage/patchnotes.js handlePatchSeasonPick), so it needs the same tier.
async function gatePastEdit(interaction) {
    const { canDo, denyDo } = require('../../../utils/adminAccess');
    if (await canDo(interaction.user.id, 'manage.patchseasonPick')) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, denyDo('manage.patchseasonPick'));
    return false;
}
async function gateDestructive(interaction) {
    const { can } = require('../../../utils/adminAccess');
    if (await can(interaction.user.id, 'manage.patchnotes', 'destructive')) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, "🔒 **You don't have access to purge patch notes anymore.** Nothing was deleted.");
    return false;
}

// ---------- home ----------
async function home(doc, note = null, interaction = null) {
    const showEmojis = interaction ? require('../../../utils/owner').isOwnerId(interaction.user.id) : false;
    return V.pageView(doc || {}, note, { pageRow: manageCommand().buildPageSelectRow('patchnotes', { showEmojis }) });
}
async function renderHome(interaction) { return show(interaction, await home(await getDoc(), null, interaction)); }

// ---------- the pop-ups ---------- Each is the old pop-up with its custom_id swapped for this panel's own; the field ids are untouched, which is what the old save reads.
const reId = (modal, customId, title) => { const j = modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal)); j.custom_id = customId; if (title) j.title = title.slice(0, 45); return j; };
async function adminTimezone(userId) {
    const prefs = await require('../../../models/UserPreference').findOne({ discordId: userId });
    return prefs?.timezone;
}
const dateInfoModal = async (doc, userId) => reId(manageCommand().buildPatchDateInfoModal(V.currentEntry(doc), await adminTimezone(userId)), V.ID('dateinfom'));
const urlsModal = (doc, slot) => reId(manageCommand().buildPatchUrlsModal(slot, V.currentEntry(doc)), V.ID('urlsm', slot));
const addModal = () => reId(manageCommand().buildPatchAddSeasonModal(), V.ID('addm'));
async function editModal(doc, id, userId) {
    const entry = V.findEntry(doc, id);
    return entry ? reId(manageCommand().buildPatchEditSeasonModal(entry, await adminTimezone(userId)), V.ID('editm', id), `Edit ${V.displayTitle(entry)}`) : null;
}

// One pop-up submit. From the panel the old save runs under a deferUpdate, its own result (with Revert) follows as a message below, and this card is redrawn with a "Saved" header; from the slash command there is no card to redraw, so the old save answers alone.
async function submit(interaction, save, opts, fallbackId = null) {
    if (!interaction.message) return save(interaction, opts);
    await interaction.deferUpdate();
    let result = null;
    await save(interaction, { ...opts, onResult: (r) => { result = r; } });
    const doc = await getDoc();
    const id = result?.elementId || fallbackId;
    const header = result?.ok ? `-# ${emojis.checkmark} Saved. The result, with Revert, is in the message below.` : `-# ${emojis.warn} Not saved. The reason is in the message below.`;
    return show(interaction, (id && V.cardView(doc, id, { header })) || await home(doc, header, interaction));
}

// ---------- the slash command ---------- `season:` opens a season (autocomplete), `do:` an action (on that season, or on the current one when none is given). A pop-up has to be the first answer, so every path that opens one runs before anything is deferred.
function resolveSeasonId(doc, value) {
    if (V.findEntry(doc, value)) return { id: value };
    const words = String(value || '').toLowerCase().split(/\s+/).filter(Boolean);
    const hits = V.entries(doc).filter(p => words.every(w => V.displayTitle(p).toLowerCase().includes(w)));
    return hits.length === 1 ? { id: String(hits[0]._id) } : { id: null, count: hits.length };
}
async function openFromSlash(interaction) {
    const o = interaction.options;
    const seasonValue = o.getString('season'), act = o.getString('do');
    const ephemeral = o.getString('visibility') !== 'public';
    const view = (components) => show(interaction, components, { ephemeral });
    if (act === 'add') return (await gate(interaction, 'addseason')) && interaction.showModal(addModal());
    if (act === 'guide') return runGuide(interaction);
    const doc = await getDoc();
    let id = null;
    if (seasonValue) {
        const r = resolveSeasonId(doc, seasonValue);
        if (!r.id) return view(await home(doc, `${emojis.cross} ${r.count ? `${r.count} seasons match` : 'No season matches'} \`${seasonValue.slice(0, 60)}\`. Pick one from the list, or type more of its title.`, interaction));
        id = r.id;
    }
    if (act === 'edit' || act === 'images1' || act === 'images2') {
        const target = id || (V.currentEntry(doc) ? String(V.currentEntry(doc)._id) : null);
        // The current season (or none yet: the first save creates it) has its own date/info and image pop-ups; a past season has the one Edit pop-up that holds all of them.
        if (!target || V.isCurrent(doc, target)) {
            const action = act === 'edit' ? 'dateinfo' : act === 'images1' ? 'urls1' : 'urls2';
            if (!(await gate(interaction, action))) return;
            return interaction.showModal(act === 'edit' ? await dateInfoModal(doc, interaction.user.id) : urlsModal(doc, act === 'images1' ? 1 : 2));
        }
        if (!(await gatePastEdit(interaction))) return;
        return interaction.showModal(await editModal(doc, target, interaction.user.id));
    }
    if (id) return view(V.cardView(doc, id));
    return view(await home(doc, null, interaction));
}

async function runGuide(interaction) {
    if (!(await gate(interaction, 'formatguide'))) return;
    const action = require('../../../utils/manageActions').ACTIONS_BY_PAGE.patchnotes.find(x => x.id === 'formatguide');
    return action.run({ interaction, page: 'patchnotes', manageCommand: manageCommand() });
}

async function autocomplete(interaction) {
    const words = String(interaction.options.getFocused() || '').toLowerCase().split(/\s+/).filter(Boolean);
    const doc = await getDoc();
    const hits = [...V.entries(doc)].reverse().filter(p => words.every(w => V.displayTitle(p).toLowerCase().includes(w))).slice(0, 25);
    return interaction.respond(hits.map(p => ({ name: V.displayTitle(p).slice(0, 100), value: String(p._id) })));
}

// ---------- routing ----------
async function route(interaction) {
    const [, verb, a] = interaction.customId.split('|');

    // ----- pop-ups first (a pop-up has to be the first answer) -----
    if (verb === 'guide') return runGuide(interaction);
    if (verb === 'dateinfo') {
        if (!(await gate(interaction, 'dateinfo'))) return;
        return interaction.showModal(await dateInfoModal(await getDoc(), interaction.user.id));
    }
    if (verb === 'urls') {
        const slot = a === '2' ? 2 : 1;
        if (!(await gate(interaction, `urls${slot}`))) return;
        return interaction.showModal(urlsModal(await getDoc(), slot));
    }
    if (verb === 'add') return (await gate(interaction, 'addseason')) && interaction.showModal(addModal());
    if (verb === 'edit') {
        if (!(await gatePastEdit(interaction))) return;
        const doc = await getDoc();
        const modal = await editModal(doc, a, interaction.user.id);
        return modal ? interaction.showModal(modal) : show(interaction, await home(doc, `${emojis.cross} That season no longer exists.`, interaction));
    }

    // ----- views -----
    if (verb === 'page') return renderHome(interaction);
    if ((verb === 'past' && interaction.isStringSelectMenu?.()) || verb === 'card') {
        const doc = await getDoc();
        const id = verb === 'past' ? interaction.values[0] : a;
        return show(interaction, V.cardView(doc, id) || await home(doc, `${emojis.cross} That season no longer exists.`, interaction));
    }

    // ----- pop-up submits -----
    if (interaction.isModalSubmit?.()) {
        if (verb === 'dateinfom') { if (!(await gate(interaction, 'dateinfo'))) return; return submit(interaction, oldSave().setDateInfo, {}); }
        if (verb === 'urlsm') {
            const slot = a === '2' ? 2 : 1;
            if (!(await gate(interaction, `urls${slot}`))) return;
            return submit(interaction, oldSave().setUrls, { customId: `modal_patch_urls_${slot}` });
        }
        if (verb === 'addm') { if (!(await gate(interaction, 'addseason'))) return; return submit(interaction, oldSave().addSeason, {}); }
        if (verb === 'editm') {
            if (!(await gatePastEdit(interaction))) return;
            return submit(interaction, oldSave().editSeason, { customId: `modal_patch_editseason_${a}` }, a);
        }
    }

    // ----- purge -----
    if (verb === 'purge') {
        if (!(await gate(interaction, 'purge'))) return;
        const n = V.entries(await getDoc()).length;
        return show(interaction, V.resultView({ ok: 'warn', title: 'Purge the patch notes history?', body: [`This permanently removes **${V.plural(n, 'season')}** of patch notes, images included. It is the one place that history can be cleared, and it is not part of a new season.`, '-# Every purge is recorded and can be reverted from `/bot analytics` › Changes.'], back: 'page', backLabel: 'Cancel', extraButtons: [V.btn('purgeok', 'Yes, Purge', emojis.deleteBin, 4)] }));
    }
    if (verb === 'purgeok') {
        if (!(await gate(interaction, 'purge')) || !(await gateDestructive(interaction))) return;
        await interaction.deferUpdate();
        const { confirmMsg } = await oldSave().purge(interaction.user.id);
        return show(interaction, await home(await getDoc(), `${confirmMsg}\n-# Revert it from \`/bot analytics\` › Changes.`, interaction));
    }

    return say(interaction, `${emojis.cross} That button is from an older panel. Open \`/manage patch-notes\` again.`);
}

// The /manage dispatcher's entry (handlers/manage/index.js): TRUE when the id is this panel's.
async function handlePatchnotesPanelInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith(PREFIX)) return false;
    await route(interaction);
    return true;
}

module.exports = { handlePatchnotesPanelInteraction, openFromSlash, renderHome, autocomplete, resolveSeasonId, PREFIX };
