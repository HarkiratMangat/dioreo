// ==========================================
// /manage season — the rehauled panel: routing, permission checks, saves
// ==========================================
// Built 2026-11-07 21:07 EST (builder C3 of the rest of the /manage rehaul), following the draws panel (handlers/manage/drawsPanel/). Two views of one panel: 'live' (`/manage season titles`, the dropdown's "Season: Titles & Deadlines") and 'draft' (`/manage season draft`, the dropdown's Next Season Draft).
//
// ⚠️ SAVES GO THROUGH THE EXISTING CODE. The pop-ups are /manage's own builders (commands/manage.js) re-id'd to this panel; the writes are handlers/manage/season.js's lifted functions (saveTitlesDeadlines, saveDraftDraws, saveDraftCalendar, runPromoteDraft, runDiscardDraft), the same commitSet ops the old pop-up handlers and confirm buttons use, so the ChangeLog, Revert and permission checks stay correct. Start New Season opens the OLD pop-up untouched (modal_wipe_season) and its own confirm step (mng_wipeconfirm_*) stays as it was.
//
// ⚠️ PERMISSIONS: the router's /manage lock runs first (`mng_`). Live titles and Start New Season are gated with resolvePopupEntry (as commands/manage.js did for the two flat dropdown entries); every draft action runs utils/manageActions.js resolveAction('seasondraft', …) before it opens a pop-up or writes; Promote and Discard re-check the destructive tier on the confirming click. core/changeset.js commitSet checks every op once more.
//
// ⚠️ A POP-UP HAS TO BE THE FIRST ANSWER. Every path that opens one runs before anything is deferred.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Nothing here catches to swallow; error-branch replies are awaited.

const emojis = require('../../../utils/emojiMap');
const { sendV2Payload } = require('../../../utils/sendV2Payload');
const V = require('./views');

const PREFIX = 'mng_ss|';
const manageCommand = () => require('../../../commands/manage');
const draftEdit = () => require('./draftEdit');
const season = () => require('../season');
const getDoc = async () => (await require('../../../models/SeasonalData').findOne({ docType: 'global' }).lean()) || {};
// What ./draftEdit.js needs from this file.
const ctx = () => ({ gate, ack, show, say, getDoc, home, revertButton });
const PAGE_KEY = { live: 'season_titlesdeadlines', draft: 'seasondraft' };

// ---------- answering ----------
async function ack(interaction, { ephemeral = true } = {}) {
    if (interaction.deferred || interaction.replied) return;
    if (interaction.isChatInputCommand?.() || (interaction.isModalSubmit?.() && !interaction.message)) await interaction.deferReply({ flags: ephemeral ? 64 : 0 });
    else await interaction.deferUpdate();
}
async function show(interaction, components, { ephemeral = true } = {}) {
    await ack(interaction, { ephemeral });
    return sendV2Payload(interaction, components, { skipExpiry: true });
}
async function say(interaction, content) {
    try {
        if (interaction.deferred || interaction.replied) await interaction.followUp({ content, flags: 64 });
        else await interaction.reply({ content, flags: 64 });
    } catch (e) { console.error('manage season: could not answer (interaction likely expired):', e.message); }
}

// ---------- permission ----------
const deny = async (interaction, message) => {
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, message);
    return false;
};
// A draft action's own tier on the Next Season Draft page.
async function gate(interaction, action) {
    const { resolveAction, DENIAL_MESSAGE } = require('../../../utils/manageActions');
    const g = await resolveAction('seasondraft', action, interaction.user.id);
    return g.ok ? true : deny(interaction, g.message || DENIAL_MESSAGE[g.reason] || `${emojis.accessDenied} You do not have access to that.`);
}
// The live Season pseudo-page's two pop-ups ('season_titlesdeadlines', 'season_wipe').
async function gateLive(interaction, entry) {
    const g = await require('../../../utils/manageActions').resolvePopupEntry(entry, interaction.user.id);
    return g.ok ? true : deny(interaction, g.message || `${emojis.accessDenied} You do not have access to that.`);
}
async function gateDestructive(interaction, what) {
    const { can } = require('../../../utils/adminAccess');
    if (await can(interaction.user.id, 'manage.seasondraft', 'destructive')) return true;
    return deny(interaction, `${emojis.accessDenied} **You don't have access to ${what} the draft anymore.** Nothing was changed.`);
}

// ---------- views ----------
async function home(view, doc, note = null, interaction = null) {
    const showEmojis = interaction ? require('../../../utils/owner').isOwnerId(interaction.user.id) : false;
    const pageRow = manageCommand().buildPageSelectRow(PAGE_KEY[view] || PAGE_KEY.live, { showEmojis });
    return V.pageView(doc || await getDoc(), view, note, { pageRow });
}
async function renderHome(interaction, view = 'live') { return show(interaction, await home(view, await getDoc(), null, interaction)); }

// ---------- the pop-ups ---------- /manage's own builders, re-id'd so the submit comes back here. Prefilled from what is stored, as before.
const reId = (modal, customId) => { const j = modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal)); j.custom_id = customId; return j; };
const titlesModal = (doc, view) => reId(view === 'draft' ? manageCommand().buildDraftTitlesDatesModal(doc) : manageCommand().buildSeasonTitlesDeadlinesModal(doc), V.ID('tm', view));

// Each opener gates, then opens its pop-up as the interaction's FIRST answer.
async function openTitles(interaction, view) {
    if (!(view === 'draft' ? await gate(interaction, 'settitles') : await gateLive(interaction, 'season_titlesdeadlines'))) return;
    return interaction.showModal(titlesModal(await getDoc(), view));
}
async function openWipe(interaction) {
    if (!(await gateLive(interaction, 'season_wipe'))) return;
    return interaction.showModal(manageCommand().buildWipeSeasonModal());
}
// Paste Draws and Paste Calendar open empty and add or update with a preview (./draftEdit.js, the /manage audit's findings 1 and 2).
const openDraws = (interaction) => draftEdit().route(interaction, 'dr', null, null, ctx());
const openCalendar = (interaction) => draftEdit().route(interaction, 'cal', null, null, ctx());

async function runGuide(interaction) {
    if (!(await gate(interaction, 'formatguide'))) return;
    const action = require('../../../utils/manageActions').ACTIONS_BY_PAGE.seasondraft.find(x => x.id === 'formatguide');
    return action.run({ interaction, page: 'seasondraft', manageCommand: manageCommand() });
}

// ---------- the slash command ---------- `do:` opens a pop-up or the guide at once; bare opens the view. Every path that opens a pop-up runs before anything is deferred.
async function openFromSlash(interaction, view = 'live') {
    const act = interaction.options.getString('do');
    const ephemeral = interaction.options.getString('visibility') !== 'public';
    if (view === 'live') {
        if (act === 'titles') return openTitles(interaction, 'live');
        if (act === 'newseason') return openWipe(interaction);
    } else {
        if (act === 'titles') return openTitles(interaction, 'draft');
        if (act === 'draws') return openDraws(interaction);
        if (act === 'calendar') return openCalendar(interaction);
        if (act === 'guide') return runGuide(interaction);
        // The draft's editors from the slash command (2026-11-09, the /manage audit's finding 12): Quick Add and Banners open their pop-up first; the rest open their view.
        if (act === 'quickadd') { if (await gate(interaction, 'bulkdraws')) return interaction.showModal(manageCommand().buildQuickAddModal({ draftSection: 'n' })); return; }
        if (act === 'banners') { if (await gate(interaction, 'bulkcalendar')) return interaction.showModal(draftEdit().bannersModal(await getDoc())); return; }
        if (act === 'editdraws') return show(interaction, V.draftDrawsView(await getDoc(), 'n', 0), { ephemeral });
        if (act === 'editcalendar') return show(interaction, draftEdit().draftCalendarView(await getDoc(), 0), { ephemeral });
        if (act === 'look') return show(interaction, V.needsLookView(await getDoc()), { ephemeral });
    }
    const note = act ? `${emojis.warn} \`${act}\` is not an option for ${view === 'live' ? 'the live season' : 'the draft'}.` : null;
    return show(interaction, await home(view, await getDoc(), note, interaction), { ephemeral });
}

// This panel has no target option.
async function autocomplete(interaction) { return interaction.respond([]); }

// The panel's own Revert after Promote or Discard (the lead, 2026-11-07 21:11 EST: the spec asks for Revert wherever a save returns change ids). results.js revertChanges does the reverting and its permission check; render lands back on the live view, or the draft's with `view` 'd' (a draft edit's Revert, 2026-11-09).
function revertButton(changeIds, view = null) {
    const id = `${PREFIX}revert|${(changeIds || []).join(',')}${view === 'd' ? '|d' : ''}`;
    return changeIds?.length && id.length <= 100 ? [{ type: 2, style: 4, label: 'Revert', custom_id: id, emoji: emojis.parseEmoji(emojis.keep) }] : [];
}

// A saved result as the note above the redrawn view.
const savedNote = (r) => (r.ok ? `### ${emojis.checkmark} Saved\n${r.message}` : `### ${emojis.cross} Not saved\n${r.message}`).slice(0, 1800);


// ---------- the draft's draws, one at a time (2026-11-08 12:27 EST) ---------- The changed list goes through season.bulkDraftDraws' `parsed` path (utils/draftDraws.js): untouched rows keep their _id, picture and news tag, Revert puts the old list back, and an armed auto-promote set by someone else switches off. Only the added or edited draw is parsed and has its picture resolved, as Paste Draws does.
async function saveDraftDraw(interaction, verb, sec, id) {
    if (!(await gate(interaction, 'bulkdraws'))) return;
    const s = sec === 'r' ? 'r' : 'n';
    const key = s === 'r' ? 'returningDraws' : 'newDraws';
    await ack(interaction);
    const doc = await getDoc();
    const list = doc?.draft?.[key] || [];
    const DD = require('../../../utils/draftDraws');
    let next, title = null, carriedGone = [];
    if (verb === 'ddrmm') {
        let ids = [];
        try { ids = require('../../../utils/formChoice').readChoice(interaction, 'pick'); } catch { ids = []; }
        next = DD.removeDraws(list, ids);
        if (next.length === list.length) return show(interaction, V.draftDrawsView(doc, s, 0, `${emojis.cross} Nothing was removed: those draws are no longer staged.`));
        // A carried draw is still running when the season starts, so the daily carry-over puts it back (2026-11-08 12:52 EST): say so, rather than let it reappear tomorrow unexplained.
        carriedGone = list.filter(d => ids.map(String).includes(String(d._id)) && d.newsSource?.carried).map(d => d.title);
    } else {
        const f = (k) => { try { return interaction.fields.getTextInputValue(k) || ''; } catch { return ''; } };
        const old = verb === 'ddeditm' ? list.find(d => String(d._id) === String(id)) : null;
        if (verb === 'ddeditm' && !old) return show(interaction, V.draftDrawsView(doc, s, 0, `${emojis.cross} That draw is no longer staged.`));
        const image = f('image').trim() || old?.thumbnailUrl || '';
        const { parseBulkDrawList } = require('../../../utils/adminParser');
        const parsed = parseBulkDrawList(DD.lineFor({ title: f('title'), type: f('type'), items: f('items'), date: f('date'), image }));
        if (parsed.length !== 1 || !parsed[0].date) return show(interaction, V.draftDrawsView(doc, s, 0, `${emojis.cross} **Not saved.** Check the title, one item per line, and a date like November 26.`));
        const q = require('../../../utils/quickAdd');
        const { validDraws } = await require('../../../utils/bulkMerge').resolveThumbnailsForDraws(parsed, s === 'n' ? { releaseSeason: q.seasonNumber(doc?.draft?.currentSeasonTitle), releaseYear: q.seasonYear(doc?.draft || {}) } : undefined);
        if (!validDraws.length) return show(interaction, V.draftDrawsView(doc, s, 0, `${emojis.cross} **Not saved: it needs a picture.** Paste an image link; none is cached under that name yet.`));
        title = validDraws[0].title;
        // A second copy of a staged draw is refused (2026-11-08 12:52 EST): the same draw twice would list twice on /draws after Promote.
        const { isSameDrawTitle } = require('../../../utils/search');
        const twin = (doc?.draft?.newDraws || []).concat(doc?.draft?.returningDraws || []).find(d => String(d._id) !== String(id || '') && isSameDrawTitle(d.title, title));
        if (twin) return show(interaction, V.draftDrawsView(doc, s, 0, `${emojis.cross} **Not saved: ${twin.title} is already staged.** Use its Edit instead.`));
        next = old ? DD.editDraw(list, id, validDraws[0]) : DD.addDraw(list, validDraws[0]);
    }
    const r = await require('../../../core/changeset').commitSet([{ type: 'season.bulkDraftDraws', payload: { parsed: { [key]: next } } }], { actorId: interaction.user.id });
    const label = verb === 'ddrmm' ? `Removed ${list.length - next.length}` : verb === 'ddeditm' ? `Saved ${title}` : `Added ${title}`;
    const note = r.ok ? `### ${emojis.checkmark} ${label}\n-# Staged, not live.${carriedGone.length ? `\n${emojis.warn} ${carriedGone.join(', ')} ${carriedGone.length === 1 ? 'is' : 'are'} still running when the season starts, so the daily carry-over adds ${carriedGone.length === 1 ? 'it' : 'them'} back. To drop one for good, end it before the season on the live calendar.` : ''}` : `### ${emojis.cross} Not saved\n${(r.failedAt?.errors || []).join(' ') || 'Try again.'}`;
    const out = V.draftDrawsView(await getDoc(), s, 0, note);
    if (r.ok) out[0].components.splice(out[0].components.length - 1, 0, V.row(...revertButton(r.changeIds, 'd')));
    const sent = await show(interaction, out);
    if (r.ok && title) await require('../itemKinds').askItemKinds(interaction, [title]);
    return sent;
}

// ---------- routing ----------
async function route(interaction) {
    const [, verb, a, b] = interaction.customId.split('|');
    const n = (x) => Number(x) || 0;

    // ----- the draft's paste previews, calendar editor, draw card and banners (./draftEdit.js) -----
    if (await draftEdit().route(interaction, verb, a, b, ctx())) return;

    // ----- pop-ups first -----
    if (verb === 'tl') return openTitles(interaction, a === 'draft' ? 'draft' : 'live');
    if (verb === 'wipe') return openWipe(interaction);
    if (verb === 'guide') return runGuide(interaction);

    // ----- views -----
    if (verb === 'view') return show(interaction, await home(a === 'draft' ? 'draft' : 'live', await getDoc(), null, interaction));
    if (verb === 'ls') return show(interaction, V.listView(await getDoc(), a, n(b)));
    if (verb === 'lv') return show(interaction, V.botLookView(await getDoc(), a, n(b)));
    if (verb === 'look') return show(interaction, V.needsLookView(await getDoc()));
    // ----- the draft's draws, one at a time (2026-11-08 12:27 EST) -----
    if (verb === 'dd') return show(interaction, V.draftDrawsView(await getDoc(), a, n(b)));
    if (verb === 'ddadd') { if (await gate(interaction, 'bulkdraws')) return interaction.showModal(V.draftDrawModal(a)); return; }
    if (verb === 'ddstage') {
        if (!(await gate(interaction, 'bulkdraws'))) return;
        const lines = V.unstagedCalendarLines(await getDoc());
        if (!lines.length) return show(interaction, V.needsLookView(await getDoc()));
        return interaction.showModal(require('../../../commands/manage').buildQuickAddModal({ draftSection: 'n', value: lines.join('\n') }));
    }
    if (verb === 'ddqa') { if (await gate(interaction, 'bulkdraws')) return interaction.showModal(require('../../../commands/manage').buildQuickAddModal({ draftSection: a === 'r' ? 'r' : 'n' })); return; }
    if (verb === 'ddedit') {
        if (!(await gate(interaction, 'bulkdraws'))) return;
        const doc = await getDoc();
        const draw = (doc?.draft?.[a === 'r' ? 'returningDraws' : 'newDraws'] || []).find(d => String(d._id) === String(b));
        if (!draw) return show(interaction, V.draftDrawsView(doc, a, 0, `${emojis.cross} That draw is no longer staged.`));
        return interaction.showModal(V.draftDrawModal(a, draw));
    }
    if (verb === 'ddrm') { if (await gate(interaction, 'bulkdraws')) return interaction.showModal(V.draftRemoveModal(await getDoc(), a)); return; }
    if ((verb === 'ddaddm' || verb === 'ddeditm' || verb === 'ddrmm') && interaction.isModalSubmit?.()) return saveDraftDraw(interaction, verb, a, b);
    if (verb === 'revert') return require('../results').revertChanges(interaction, String(a || '').split(',').filter(Boolean), { doneNote: 'it is back as it was', render: async (note) => home(b === 'd' ? 'draft' : 'live', await getDoc(), note, interaction) });

    // ----- pop-up submits: save through season.js, then redraw the view with a Saved header -----
    if (verb === 'tm' && interaction.isModalSubmit?.()) {
        const view = a === 'draft' ? 'draft' : 'live';
        if (!(view === 'draft' ? await gate(interaction, 'settitles') : await gateLive(interaction, 'season_titlesdeadlines'))) return;
        await ack(interaction);
        const r = await season().saveTitlesDeadlines(interaction.user.id, season().readTitleFields(interaction), { draft: view === 'draft' });
        return show(interaction, await home(view, await getDoc(), savedNote(r), interaction));
    }
    // ----- Promote and Discard: confirm in place, then run the existing logic with the destructive tier re-checked -----
    if (verb === 'promote' || verb === 'discard') {
        if (!(await gate(interaction, verb))) return;
        const doc = await getDoc();
        if (!V.isStaged(doc)) return show(interaction, await home('draft', doc, `${emojis.cross} No draft in progress — nothing to ${verb}.`, interaction));
        // Promote opens a pop-up: now, or at the Battle Pass start (2026-11-08 12:09 EST). The old in-place confirm card (promoteok) still answers a panel drawn before this.
        if (verb === 'promote') return interaction.showModal(V.promoteModal(doc));
        return show(interaction, V.discardConfirm(doc));
    }
    if (verb === 'promm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'promote')) || !(await gateDestructive(interaction, 'promote'))) return;
        let pick = null;
        try { pick = require('../../../utils/formChoice').readChoice(interaction, 'when')[0]; } catch { pick = null; }
        await ack(interaction);
        if (pick === 'auto') {
            const { commitSet } = require('../../../core/changeset');
            const r = await commitSet([{ type: 'season.setAutoPromote', payload: { on: true, by: interaction.user.id } }], { actorId: interaction.user.id });
            const doc = await getDoc();
            const at = doc?.draft?.bpStart ? Math.floor(new Date(doc.draft.bpStart).getTime() / 1000) : null;
            const note = r.ok ? `### ${emojis.checkmark} Auto-promote set\nThe draft goes live <t:${at}:F> (<t:${at}:R>), at the Battle Pass start. Moving that start moves the promote with it. You get a DM when it runs.` : `### ${emojis.cross} Not set\n${require('../season').extractCommitError ? require('../season').extractCommitError(r) : (r.failedAt?.errors || []).join(' ')}`;
            return show(interaction, await home('draft', doc, note.slice(0, 1800), interaction));
        }
        const r = await season().runPromoteDraft(interaction.user.id);
        return show(interaction, V.resultView({
            crumbs: ['Next Season Draft', 'Promote'], ok: r.ok, title: r.ok ? 'Promoted to live' : 'Nothing was promoted',
            body: [r.message],
            back: r.ok ? ['view', 'live'] : ['view', 'draft'], backLabel: r.ok ? 'Live Season' : 'Next Season Draft',
            extraButtons: r.ok ? revertButton(r.changeIds) : [],
        }));
    }
    if (verb === 'autooff') {
        if (!(await gate(interaction, 'promote'))) return;
        await ack(interaction);
        const r = await require('../../../core/changeset').commitSet([{ type: 'season.setAutoPromote', payload: { on: false } }], { actorId: interaction.user.id });
        return show(interaction, await home('draft', await getDoc(), r.ok ? `### ${emojis.checkmark} Auto-promote cancelled\nNothing goes live until you press Promote to Live.` : `### ${emojis.cross} Not cancelled\n${(r.failedAt?.errors || []).join(' ') || 'Try again.'}`, interaction));
    }
    if (verb === 'promoteok') {
        if (!(await gate(interaction, 'promote')) || !(await gateDestructive(interaction, 'promote'))) return;
        await ack(interaction);
        const r = await season().runPromoteDraft(interaction.user.id);
        return show(interaction, V.resultView({
            crumbs: ['Next Season Draft', 'Promote'], ok: r.ok, title: r.ok ? 'Promoted to live' : 'Nothing was promoted',
            body: [r.message],
            back: r.ok ? ['view', 'live'] : ['view', 'draft'], backLabel: r.ok ? 'Live Season' : 'Next Season Draft',
            extraButtons: r.ok ? revertButton(r.changeIds) : [],
        }));
    }
    if (verb === 'discardok') {
        if (!(await gate(interaction, 'discard')) || !(await gateDestructive(interaction, 'discard'))) return;
        await ack(interaction);
        const r = await season().runDiscardDraft(interaction.user.id);
        return show(interaction, V.resultView({
            crumbs: ['Next Season Draft', 'Discard'], ok: r.ok, title: r.ok ? 'Draft discarded' : 'Nothing was discarded',
            body: [r.message],
            extraButtons: r.ok ? revertButton(r.changeIds) : [],
        }));
    }

    return say(interaction, `${emojis.cross} That button is from an older panel. Open \`/manage season\` again.`);
}

// The /manage dispatcher's entry (handlers/manage/index.js): TRUE when the id is this panel's.
async function handleSeasonPanelInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith(PREFIX)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleSeasonPanelInteraction, openFromSlash, renderHome, autocomplete, PREFIX };
