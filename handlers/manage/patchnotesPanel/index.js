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
    await say(interaction, g.message || DENIAL_MESSAGE[g.reason] || `${emojis.accessDenied} You do not have access to that.`);
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
    await say(interaction, `${emojis.accessDenied} **You don't have access to purge patch notes anymore.** Nothing was deleted.`);
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

// One pop-up submit. From the panel the old save runs under a deferUpdate with `quiet`, and this card is redrawn with the result and its Revert in place (2026-11-09, the /manage audit's finding 9: it used to post the result as a second message below). From the slash command there is no card to redraw, so the old save answers alone.
async function submit(interaction, save, opts, fallbackId = null) {
    if (!interaction.message) return save(interaction, opts);
    await interaction.deferUpdate();
    let result = null;
    await save(interaction, { ...opts, quiet: true, onResult: (r) => { result = r; } });
    return showResult(interaction, result, fallbackId);
}
async function showResult(interaction, result, fallbackId = null) {
    const doc = await getDoc();
    const id = result?.elementId || fallbackId;
    const header = result?.ok ? `### ${emojis.checkmark} ${result.heading || 'Saved'}` : `### ${emojis.cross} Not saved\n${String(result?.why || 'Try again.').slice(0, 1500)}`;
    const card = id && V.cardView(doc, id, { header, revertIds: result?.ok ? result.changeIds : null });
    if (card) return show(interaction, card);
    const out = await home(doc, header, interaction);
    if (result?.ok && result.changeIds?.length) out[0].components.push(V.row(V.btn(['revert', result.changeIds.join(',')], 'Revert', emojis.keep, 4)));
    return show(interaction, out);
}

// ---------- the slash command ---------- `season:` opens a season (autocomplete), `do:` an action (on that season, or on the current one when none is given). A pop-up has to be the first answer, so every path that opens one runs before anything is deferred.
function resolveSeasonId(doc, value) {
    if (V.findEntry(doc, value)) return { id: value };
    const words = String(value || '').toLowerCase().split(/\s+/).filter(Boolean);
    const hits = V.entries(doc).filter(p => words.every(w => V.displayTitle(p).toLowerCase().includes(w)));
    return hits.length === 1 ? { id: String(hits[0]._id) } : { id: null, count: hits.length };
}
// Delete Season's confirm, on the card (the card's Delete and the slash command's do: Delete Season).
function deleteConfirm(doc, id) {
    const p = V.findEntry(doc, id);
    const cur = V.isCurrent(doc, id);
    const prev = cur ? V.pastEntries(doc)[0] : null;
    return V.cardView(doc, id, { header: `### ${emojis.warn} Delete ${V.displayTitle(p)}?\n-# Its notes and images leave /patch notes. ${cur ? (prev ? `It is the current season, so /patch notes opens on ${V.displayTitle(prev)} instead.` : 'It is the only season, so /patch notes will have nothing to show.') : 'It leaves the season dropdown.'} Revert brings it back as it was.`, extra: [V.row(V.btn(['delok', id], 'Yes, Delete', emojis.deleteBin, 4), V.btn(['card', id], 'Cancel', emojis.returnArrow))] });
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
    // Upload Images, Season Dates and Delete Season (2026-11-09, the /manage audit's finding 12): on the season named, else the current one, the same gates as their card buttons.
    if (act === 'upload' || act === 'dates' || act === 'delete') {
        const target = id || (V.currentEntry(doc) ? String(V.currentEntry(doc)._id) : null);
        if (!target) return view(await home(doc, `${emojis.cross} There is no season yet. Add New Season first.`, interaction));
        const p = V.findEntry(doc, target);
        if (act === 'delete') {
            if (!(await gate(interaction, 'purge'))) return;
            return view(deleteConfirm(doc, target));
        }
        if (!(V.isCurrent(doc, target) ? await gate(interaction, act === 'upload' ? 'urls1' : 'dateinfo') : await gatePastEdit(interaction))) return;
        return interaction.showModal(act === 'upload' ? V.uploadModal(p) : V.datesModal(p));
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

    // ----- the card's own pop-ups (2026-11-09, the /manage audit's finding 8) -----
    if (verb === 'up' || verb === 'dates') {
        const doc = await getDoc();
        const p = V.findEntry(doc, a);
        if (!p) return show(interaction, await home(doc, `${emojis.cross} That season no longer exists.`, interaction));
        if (!(V.isCurrent(doc, a) ? await gate(interaction, verb === 'up' ? 'urls1' : 'dateinfo') : await gatePastEdit(interaction))) return;
        return interaction.showModal(verb === 'up' ? V.uploadModal(p) : V.datesModal(p));
    }

    // ----- views -----
    if (verb === 'page') return renderHome(interaction);
    if (verb === 'revert') return require('../results').revertChanges(interaction, String(a || '').split(',').filter(Boolean), { doneNote: 'it is back as it was', render: async (note) => home(await getDoc(), note, interaction) });
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
        if (verb === 'upm' || verb === 'datesm') {
            const doc0 = await getDoc();
            const p = V.findEntry(doc0, a);
            if (!(p && V.isCurrent(doc0, a) ? await gate(interaction, verb === 'upm' ? 'urls1' : 'dateinfo') : await gatePastEdit(interaction))) return;
            if (interaction.message) await interaction.deferUpdate(); else await interaction.deferReply({ flags: 64 });
            if (!p) return show(interaction, await home(doc0, `${emojis.cross} That season no longer exists.`, interaction));
            const { commitSet } = require('../../../core/changeset');
            const why = (r) => require('../shared').extractCommitError(r) || 'Try again.';
            if (verb === 'upm') {
                let files = [];
                try { files = [...(interaction.fields.getUploadedFiles('files')?.values() || [])]; } catch { files = []; }
                const urls = files.filter(f => !f.contentType || /^image\//.test(f.contentType)).map(f => f.url).filter(Boolean);
                let how = 'add';
                try { how = require('../../../utils/formChoice').readChoice(interaction, 'how')[0] || 'add'; } catch { how = 'add'; }
                if (!urls.length) return showResult(interaction, { ok: false, why: 'None of those files is an image.' }, a);
                const all = [...(how === 'replace' ? [] : (p.images || []).filter(Boolean)), ...urls];
                const kept = all.slice(0, 10);
                // The whole entry is written by editSeason with its own title, info and date kept, so the images land in order (the two URL-slot ops each rewrite half the list and cannot put five new images after three old ones).
                const r = await commitSet([{ type: 'patchnote.editSeason', target: { elementId: a }, payload: { titleOverride: p.titleOverride || '', description: p.description || '', releaseDate: p.releaseDate ? new Date(p.releaseDate) : '', urls1: kept.slice(0, 5), urls2: kept.slice(5, 10) } }], { actorId: interaction.user.id });
                const left = all.length - kept.length;
                return showResult(interaction, r.ok ? { ok: true, elementId: a, changeIds: r.changeIds, heading: `${how === 'replace' ? 'Images replaced' : `${urls.length} image${urls.length === 1 ? '' : 's'} added`} · ${kept.length}/10${left ? ` · ${left} left out (10 is the most)` : ''}` } : { ok: false, why: why(r) }, a);
            }
            const field = (k) => { try { return interaction.fields.getTextInputValue(k)?.trim() || ''; } catch { return ''; } };
            const { parseAdminDate } = require('../../../utils/adminParser');
            const sRaw = field('start'), eRaw = field('end');
            const payload = !sRaw && !eRaw ? { seasonStart: null, seasonEnd: null } : { seasonStart: parseAdminDate(sRaw), seasonEnd: parseAdminDate(eRaw) };
            if ((sRaw || eRaw) && (!payload.seasonStart || !payload.seasonEnd)) return showResult(interaction, { ok: false, why: `A season needs a start and an end I can read${!payload.seasonStart ? ` (start: "${sRaw}")` : ''}${!payload.seasonEnd ? ` (end: "${eRaw}")` : ''}.` }, a);
            const r = await commitSet([{ type: 'patchnote.setSeasonDates', target: { elementId: a }, payload }], { actorId: interaction.user.id });
            return showResult(interaction, r.ok ? { ok: true, elementId: a, changeIds: r.changeIds, heading: payload.seasonStart ? 'Season dates saved' : 'Season dates cleared' } : { ok: false, why: why(r) }, a);
        }
    }

    // ----- one season's Delete (2026-11-09, the /manage audit's finding 8): patchnote.removeSeason, the op Undo of Add New Season already used; Revert restores the same entry, images included -----
    if (verb === 'del') {
        if (!(await gate(interaction, 'purge'))) return;
        const doc = await getDoc();
        const p = V.findEntry(doc, a);
        if (!p) return show(interaction, await home(doc, `${emojis.cross} That season no longer exists.`, interaction));
        return show(interaction, deleteConfirm(doc, a));
    }
    if (verb === 'delok') {
        if (!(await gate(interaction, 'purge')) || !(await gateDestructive(interaction))) return;
        await interaction.deferUpdate();
        const doc = await getDoc();
        const p = V.findEntry(doc, a);
        if (!p) return show(interaction, await home(doc, `${emojis.cross} That season no longer exists.`, interaction));
        const r = await require('../../../core/changeset').commitSet([{ type: 'patchnote.removeSeason', target: { elementId: a } }], { actorId: interaction.user.id });
        const out = await home(await getDoc(), r.ok ? `### ${emojis.checkmark} Deleted ${V.displayTitle(p)}` : `### ${emojis.cross} Not deleted\n${require('../shared').extractCommitError(r) || 'Try again.'}`, interaction);
        if (r.ok && r.changeIds?.length) out[0].components.push(V.row(V.btn(['revert', r.changeIds.join(',')], 'Revert', emojis.keep, 4)));
        return show(interaction, out);
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
        const { confirmMsg, changeIds } = await oldSave().purge(interaction.user.id);
        // Revert in place (2026-11-09, the /manage audit's finding 9), as every other save on this panel has.
        const out = await home(await getDoc(), confirmMsg, interaction);
        if (changeIds?.length) out[0].components.push(V.row(V.btn(['revert', changeIds.join(',')], 'Revert', emojis.keep, 4)));
        return show(interaction, out);
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
