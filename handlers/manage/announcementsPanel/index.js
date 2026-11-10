// ==========================================
// /manage announcement — the rehauled panel: routing, permission checks, saves
// ==========================================
// Built 2026-11-07 21:09 EST (the /manage rehaul's remaining panels, builder C2), on the pattern of the draws panel (handlers/manage/drawsPanel/).
//
// ⚠️ SAVES GO THROUGH THE EXISTING CODE. Post New and Edit open the real pop-up (commands/manage.js buildAnnouncementModal) re-id'd to this panel's own ids, and on submit hand the fields to handlers/manage/announcements.js postAnnouncement / editAnnouncement (the old handler, now called with `{ customId, onResult }`). Delete commits the same `announcement.delete` op the old Yes, Delete button did, and its result carries a Revert.
//
// ⚠️ PERMISSIONS: the router's /manage lock runs first (`mng_`). Post New runs utils/manageActions.js resolveAction; the per-announcement Edit and Delete are outside the registry (their ids carry a Mongo _id) and check core/permissions.js's OUTSIDE_ACTIONS 'manage.announcementEdit' / 'manage.announcementDelete', as the old row buttons did; Yes, Delete re-checks the destructive tier. core/changeset.js commitSet checks every op once more.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Nothing here catches to swallow; error-branch replies are awaited.
//
// ⚠️ A POP-UP SUBMIT SHOWS A DRAFT, NEVER A SAVE (2026-11-09 12:11 EST, his ask 2026-11-09 10:57 EST). Post New, Post Again and Edit keep what was typed in memory under a token for 15 minutes and show the announcement as players will get it, with Post (Save) · Edit · Discard; only Post runs the old save, through `opts.values`. A restart drops a draft, which costs the admin a retype and nothing else. Old panels' `modal_announce_post` (handlers/manage/index.js) still saves at once.

const emojis = require('../../../utils/emojiMap');
const { sendV2Payload } = require('../../../utils/sendV2Payload');
const V = require('./views');

const PREFIX = 'mng_an|';
const manageCommand = () => require('../../../commands/manage');
const oldSave = () => require('../announcements');
const Announcement = () => require('../../../models/Announcement');

// Every announcement that has not expired (a scheduled one included), newest first, and the few that expired most recently. An expired announcement is never deleted by the bot, so the model keeps them.
async function loadData(now = new Date()) {
    const EXPIRED = { expiresAt: { $ne: null, $lte: now } };
    const [live, expired, expiredCount] = await Promise.all([
        Announcement().find({ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }).sort({ createdAt: -1 }).lean(),
        Announcement().find(EXPIRED).sort({ expiresAt: -1 }).limit(V.EXPIRED_SHOWN).lean(),
        Announcement().countDocuments(EXPIRED),
    ]);
    return { live, expired, expiredCount };
}
// One page of the Expired list, latest-expired first (2026-11-09, the /manage audit's finding 10).
async function loadExpired(page, now = new Date()) {
    const EXPIRED = { expiresAt: { $ne: null, $lte: now } };
    const total = await Announcement().countDocuments(EXPIRED);
    const pages = Math.max(1, Math.ceil(total / V.EXPIRED_PAGE));
    const p = Math.min(Math.max(0, Number(page) || 0), pages - 1);
    const docs = await Announcement().find(EXPIRED).sort({ expiresAt: -1 }).skip(p * V.EXPIRED_PAGE).limit(V.EXPIRED_PAGE).lean();
    return { docs, page: p, total };
}
// Every announcement, active, scheduled or expired, whose text holds every typed word, newest first. The collection is small (an admin writes a few a season), so it is read whole and matched here, the same word rule as resolveTarget.
async function search(query) {
    const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const all = await Announcement().find({}).sort({ createdAt: -1 }).limit(1000).lean();
    return all.filter(d => words.every(w => String(d.text || '').toLowerCase().includes(w)));
}
const getOne = (id) => (/^[a-f0-9]{24}$/i.test(String(id)) ? Announcement().findById(id).lean() : null);

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
    } catch (e) { console.error('manage announcements: could not answer (interaction likely expired):', e.message); }
}

// ---------- permission per action ----------
async function gatePost(interaction) {
    const { resolveAction, DENIAL_MESSAGE } = require('../../../utils/manageActions');
    const g = await resolveAction('announcement', 'post', interaction.user.id);
    if (g.ok) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, g.message || DENIAL_MESSAGE[g.reason] || `${emojis.accessDenied} You do not have access to that.`);
    return false;
}
async function gateRow(interaction, key) { // 'manage.announcementEdit' | 'manage.announcementDelete'
    const { canDo, denyDo } = require('../../../utils/adminAccess');
    if (await canDo(interaction.user.id, key)) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, denyDo(key));
    return false;
}
async function gateDestructive(interaction) {
    const { can } = require('../../../utils/adminAccess');
    if (await can(interaction.user.id, 'manage.announcement', 'destructive')) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, `${emojis.accessDenied} **You don't have access to delete announcements anymore.** Nothing was deleted.`);
    return false;
}

// ---------- home ----------
async function home(note = null, interaction = null) {
    const showEmojis = interaction ? require('../../../utils/owner').isOwnerId(interaction.user.id) : false;
    return V.pageView(await loadData(), note, { pageRow: manageCommand().buildPageSelectRow('announcement', { showEmojis }) });
}
async function renderHome(interaction) { return show(interaction, await home(null, interaction)); }
const gone = async (interaction) => show(interaction, await home(`${emojis.cross} That announcement no longer exists (it may have just been deleted or expired).`, interaction));

// ---------- the pop-ups ---------- Each is the old pop-up with its custom_id swapped for this panel's own; the field ids are untouched, which is what the old save reads.
const reId = (modal, customId) => { const j = modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal)); j.custom_id = customId; return j; };
const postModal = () => reId(manageCommand().buildAnnouncementModal(null), V.ID('postm'));
const editModal = (doc) => reId(manageCommand().buildAnnouncementModal(doc), V.ID('editm', String(doc._id)));
// Post Again: Post New with the expired announcement's text already in the box (the other fields stay as Post New opens them, so it gets the default expiry and shows now).
function postAgainModal(doc) {
    const j = postModal();
    for (const r of j.components || []) for (const c of r.components || []) if (c.custom_id === 'text') c.value = String(doc.text || '').slice(0, c.max_length || 3900);
    return j;
}

// ---------- drafts ---------- token → { kind: 'post'|'edit', id, userId, values: { text, expiry, starts_at, color }, at }. Only the admin who drafted it can post it.
const DRAFT_TTL_MS = 15 * 60 * 1000;
const drafts = new Map();
function keepDraft(d, reuse = null) {
    const now = Date.now();
    for (const [k, v] of drafts) if (now - v.at > DRAFT_TTL_MS) drafts.delete(k);
    const token = reuse || require('crypto').randomBytes(5).toString('hex');
    drafts.set(token, { ...d, at: now });
    return token;
}
function takeDraft(token, userId) {
    const d = drafts.get(token);
    if (!d || Date.now() - d.at > DRAFT_TTL_MS) return { gone: true };
    return d.userId === userId ? { draft: d } : { notYours: true };
}
// Core's own check of the drafted values, the one Post would run: the times it would save, or why it would refuse.
function checkDraft(d) {
    const { validateSet } = require('../../../core/changeset');
    const v = validateSet([{ type: 'announcement.post', payload: { text: d.values.text, expiry: d.values.expiry, ...(String(d.values.starts_at || '').trim() ? { startsAt: d.values.starts_at.trim() } : {}) } }]);
    if (!v.ok) return { ok: false, errors: v.failures.flatMap(f => f.errors) };
    const p = v.normalized[0]?.payload || {};
    return { ok: true, errors: [], expiresAt: p.expiresAt || null, startsAt: p.startsAt || null };
}
const readFields = (interaction) => ({ text: interaction.fields.getTextInputValue('text') || '', expiry: interaction.fields.getTextInputValue('expiry') || '', starts_at: interaction.fields.getTextInputValue('starts_at') || '' });
// The draft drawn as an announcement: its own colour, and for an edit the stored post time and banner, so the preview is what players will get.
const draftDoc = (d, existing = null) => ({ _id: existing?._id || 'draft', text: d.values.text.trim(), color: d.values.color ?? existing?.color, createdAt: existing?.createdAt || new Date(), bannerImageUrl: existing?.bannerImageUrl || null });
async function showDraft(interaction, token, header = null) {
    const d = drafts.get(token);
    const existing = d.kind === 'edit' ? await getOne(d.id) : null;
    if (d.kind === 'edit' && !existing) return gone(interaction);
    return show(interaction, V.draftView(draftDoc(d, existing), { token, kind: d.kind, header, check: checkDraft(d) }));
}
// Puts the draft's values back into a pop-up for Edit.
function fillModal(j, values) {
    for (const r of j.components || []) for (const c of r.components || []) if (values[c.custom_id] !== undefined) c.value = String(values[c.custom_id]).slice(0, c.max_length || 4000);
    return j;
}

// One pop-up submit. From the panel the old save runs under a deferUpdate, its own result follows as a message below, and the panel is redrawn with a "Saved" header; from the slash command there is no panel to redraw, so the old save answers alone.
async function submit(interaction, save, opts, afterId = null) {
    if (!interaction.message) return save(interaction, opts);
    await interaction.deferUpdate();
    let result = null;
    await save(interaction, { ...opts, onResult: (r) => { result = r; } });
    const header = result?.ok ? `-# ${emojis.checkmark} Saved. The result is in the message below.` : `-# ${emojis.warn} Not saved. The reason is in the message below.`;
    const doc = afterId ? await getOne(afterId) : null;
    return show(interaction, V.cardView(doc, { header }) || await home(header, interaction));
}

function confirmCard(doc) {
    return V.cardView(doc, {
        header: `### ${emojis.warn} Delete this announcement?\n-# Anyone who has not seen it yet never will. Every change can be reverted.`,
        extra: [V.row(V.btn(['delok', String(doc._id)], 'Yes, Delete', emojis.deleteBin, 4), V.btn(['card', String(doc._id)], 'Cancel', emojis.returnArrow))],
    });
}

// End Now (2026-11-09, the /manage audit's finding 10): stops a live announcement without deleting it, so it moves to Expired with its text kept for Post Again. A scheduled one is cancelled the same way. Asks first, like Delete.
function endCard(doc) {
    const scheduled = V.isScheduled(doc);
    return V.cardView(doc, {
        header: `### ${emojis.warn} ${scheduled ? 'Cancel this scheduled announcement?' : 'End this announcement now?'}\n-# Nobody who has not seen it yet will get it. It moves to Expired, where Post Again reuses it. Revert undoes this.`,
        extra: [V.row(V.btn(['endok', String(doc._id)], scheduled ? 'Yes, Cancel It' : 'Yes, End It', emojis.pending, 4), V.btn(['card', String(doc._id)], 'Cancel', emojis.returnArrow))],
    });
}

function revertButton(changeIds) {
    const id = `${PREFIX}revert|${(changeIds || []).join(',')}`;
    return changeIds?.length && id.length <= 100 ? [{ type: 2, style: 4, label: 'Revert', custom_id: id, emoji: emojis.parseEmoji(emojis.keep) }] : [];
}

// ---------- the slash command ---------- `announcement:` opens one (autocomplete), `do:` an action (on it, at once). A pop-up has to be the first answer, so every path that opens one runs before anything is deferred. An id, or typed words: a live match wins over expired ones, so an announcement posted again is the one opened (expired ones are reachable since the /manage audit's finding 10).
async function resolveTarget(value) {
    const byId = await getOne(value);
    if (byId) return { doc: byId };
    const hits = await search(value);
    const now = new Date();
    const live = hits.filter(d => !V.isExpired(d, now));
    const pool = live.length ? live : hits;
    return pool.length === 1 ? { doc: pool[0] } : { doc: null, count: pool.length };
}
async function openFromSlash(interaction) {
    const o = interaction.options;
    const target = o.getString('announcement'), act = o.getString('do');
    const ephemeral = o.getString('visibility') !== 'public';
    const view = (components) => show(interaction, components, { ephemeral });
    if (act === 'post') return (await gatePost(interaction)) && interaction.showModal(postModal());
    if (act === 'guide') return runGuide(interaction);
    if (act === 'find') return interaction.showModal(V.findModal());
    if (act === 'expired') { const { docs, page, total } = await loadExpired(0); return view(V.expiredView(docs, { page, total })); }
    let doc = null;
    if (target) {
        const r = await resolveTarget(target);
        if (!r.doc) return view(await home(`${emojis.cross} ${r.count ? `${r.count} announcements match` : 'No announcement matches'} \`${target.slice(0, 60)}\`. Pick one from the list, or type more of its text.`, interaction));
        doc = r.doc;
        if (act === 'edit') return (await gateRow(interaction, 'manage.announcementEdit')) && interaction.showModal(editModal(doc));
        if (act === 'delete') return (await gateRow(interaction, 'manage.announcementDelete')) && view(confirmCard(doc));
        if (act === 'again') return (await gatePost(interaction)) && interaction.showModal(postAgainModal(doc));
        if (act === 'end') return (await gateRow(interaction, 'manage.announcementEdit')) && view(endCard(doc));
        return view(V.cardView(doc));
    }
    if (act) return view(await home(`${emojis.warn} That needs an \`announcement:\` to act on.`, interaction));
    return view(await home(null, interaction));
}

async function runGuide(interaction) {
    const { resolveAction, DENIAL_MESSAGE } = require('../../../utils/manageActions');
    const g = await resolveAction('announcement', 'formatguide', interaction.user.id);
    if (!g.ok) return say(interaction, g.message || DENIAL_MESSAGE[g.reason] || `${emojis.accessDenied} You do not have access to that.`);
    return g.entry.run({ interaction, page: 'announcement', manageCommand: manageCommand() });
}

async function autocomplete(interaction) {
    // Active and scheduled first, then expired ones marked as such (the /manage audit's finding 10: an expired one could not be opened from the slash command).
    const typed = String(interaction.options.getFocused() || '');
    const now = new Date();
    const all = typed.trim() ? await search(typed) : await Announcement().find({}).sort({ createdAt: -1 }).limit(50).lean();
    const ordered = [...all.filter(d => !V.isExpired(d, now)), ...all.filter(d => V.isExpired(d, now))].slice(0, 25);
    return interaction.respond(ordered.map(d => ({ name: `${V.isExpired(d, now) ? 'Expired · ' : ''}${V.plainLabel(V.preview(d))}`.slice(0, 100), value: String(d._id) })));
}

// ---------- routing ----------
async function route(interaction) {
    const [, verb, a, b] = interaction.customId.split('|');

    // ----- pop-ups first (a pop-up has to be the first answer) -----
    if (verb === 'guide') return runGuide(interaction);
    if (verb === 'post') return (await gatePost(interaction)) && interaction.showModal(postModal());
    if (verb === 'edit') {
        if (!(await gateRow(interaction, 'manage.announcementEdit'))) return;
        const doc = await getOne(a);
        return doc ? interaction.showModal(editModal(doc)) : gone(interaction);
    }
    if ((verb === 'again' && interaction.isStringSelectMenu?.()) || verb === 'againid') {
        if (!(await gatePost(interaction))) return;
        const doc = await getOne(verb === 'againid' ? a : interaction.values[0]);
        return doc ? interaction.showModal(postAgainModal(doc)) : gone(interaction);
    }
    if (verb === 'find') return interaction.showModal(V.findModal());

    // ----- views -----
    if (verb === 'page') return renderHome(interaction);
    if (verb === 'exp') {
        const { docs, page, total } = await loadExpired(a);
        return show(interaction, V.expiredView(docs, { page, total }));
    }
    if (verb === 'revert') return require('../results').revertChanges(interaction, String(a || '').split(',').filter(Boolean), { doneNote: 'it is back as it was', render: async (note) => home(note, interaction) });
    if ((verb === 'open' && interaction.isStringSelectMenu?.()) || verb === 'card') {
        const doc = await getOne(verb === 'open' ? interaction.values[0] : a);
        return doc ? show(interaction, V.cardView(doc)) : gone(interaction);
    }

    // ----- pop-up submits -----
    if (interaction.isModalSubmit?.()) {
        // A box reopened from a draft's Edit carries that draft's token (`postm|<token>`, `editm|<id>|<token>`): the same draft is updated, its colour kept, so a tweak never repaints the preview (found in the 2026-11-09 13:37 EST click-test: each resubmit drew a new colour).
        if (verb === 'postm') {
            if (!(await gatePost(interaction))) return;
            const prior = a && drafts.get(a)?.userId === interaction.user.id ? drafts.get(a) : null;
            const values = { ...readFields(interaction), color: prior?.values.color ?? require('../../../utils/announcement').generateAccentColor() };
            return showDraft(interaction, keepDraft({ kind: 'post', userId: interaction.user.id, values }, prior ? a : null));
        }
        if (verb === 'findm') {
            const q = interaction.fields.getTextInputValue('q') || '';
            return show(interaction, V.findView(q, await search(q)));
        }
        if (verb === 'editm') {
            if (!(await gateRow(interaction, 'manage.announcementEdit'))) return;
            if (!(await getOne(a))) return gone(interaction);
            const prior = b && drafts.get(b)?.userId === interaction.user.id ? b : null;
            return showDraft(interaction, keepDraft({ kind: 'edit', id: a, userId: interaction.user.id, values: readFields(interaction) }, prior));
        }
    }

    // ----- a draft: Post (Save), Edit, Discard -----
    if (verb === 'dpost' || verb === 'dedit' || verb === 'ddisc') {
        const t = takeDraft(a, interaction.user.id);
        if (t.notYours) return say(interaction, `${emojis.accessDenied} Only the admin who wrote this draft can use it.`);
        if (t.gone) return show(interaction, await home(`${emojis.warn} That draft is gone (a draft lasts 15 minutes, and a restart clears it). Nothing was posted.`, interaction));
        const d = t.draft;
        const gate = () => (d.kind === 'edit' ? gateRow(interaction, 'manage.announcementEdit') : gatePost(interaction));
        if (verb === 'dedit') {
            if (!(await gate())) return;
            if (d.kind === 'post') return interaction.showModal({ ...fillModal(postModal(), d.values), custom_id: V.ID('postm', a) });
            const doc = await getOne(d.id);
            return doc ? interaction.showModal({ ...fillModal(editModal(doc), d.values), custom_id: V.ID('editm', d.id, a) }) : gone(interaction);
        }
        if (verb === 'ddisc') {
            drafts.delete(a);
            const note = `-# ${emojis.checkmark} Draft discarded. Nothing was ${d.kind === 'edit' ? 'changed' : 'posted'}.`;
            const doc = d.kind === 'edit' ? await getOne(d.id) : null;
            return show(interaction, (doc && V.cardView(doc, { header: note })) || await home(note, interaction));
        }
        if (!(await gate())) return;
        await interaction.deferUpdate();
        let result = null;
        const save = d.kind === 'edit' ? oldSave().editAnnouncement : oldSave().postAnnouncement;
        await save(interaction, { values: d.values, customId: d.kind === 'edit' ? `modal_announce_edit_${d.id}` : undefined, onResult: (r) => { result = r; } });
        if (!result?.ok) return showDraft(interaction, a, `-# ${emojis.warn} Not ${d.kind === 'edit' ? 'saved' : 'posted'}. The reason is in the message below; Edit fixes it.`);
        drafts.delete(a);
        const header = `-# ${emojis.checkmark} ${d.kind === 'edit' ? 'Saved' : 'Posted'}. The result is in the message below.`;
        const doc = d.kind === 'edit' ? await getOne(d.id) : null;
        return show(interaction, (doc && V.cardView(doc, { header })) || await home(header, interaction));
    }

    // ----- end now -----
    if (verb === 'end') {
        if (!(await gateRow(interaction, 'manage.announcementEdit'))) return;
        const doc = await getOne(a);
        if (!doc) return gone(interaction);
        if (V.isExpired(doc)) return show(interaction, V.cardView(doc, { header: `-# ${emojis.warn} It has already expired.` }));
        return show(interaction, endCard(doc));
    }
    if (verb === 'endok') {
        if (!(await gateRow(interaction, 'manage.announcementEdit'))) return;
        const doc = await getOne(a);
        if (!doc) return gone(interaction);
        await interaction.deferUpdate();
        // The ordinary announcement.edit op with every field as stored and expiresAt = now, so its inverse puts the old expiry back. A scheduled one loses its start too: a start after its expiry is refused by the op, and a cancelled announcement has no start to keep.
        const now = new Date();
        const payload = { text: doc.text, expiresAt: now, startsAt: V.isScheduled(doc, now) ? null : (doc.startsAt || null), bannerImageUrl: doc.bannerImageUrl || null, repeatCount: doc.repeatCount ?? null };
        const result = await require('../../../core/changeset').commitSet([{ type: 'announcement.edit', target: { id: a }, payload }], { actorId: interaction.user.id });
        if (!result.ok) {
            if (result.failedAt?.reason === 'missing') return gone(interaction);
            return show(interaction, V.resultView({ title: 'The announcement was not ended', body: [require('../shared').extractCommitError(result)], ok: false, back: ['card', a], backLabel: 'Back to It' }));
        }
        const after = await getOne(a);
        return show(interaction, V.cardView(after, { header: `-# ${emojis.checkmark} Ended. It is under Expired now.`, extra: [V.row(V.btn(['againid', a], 'Post Again', emojis.mngAdd, 3), ...revertButton(result.changeIds), V.homeBtn())] }) || await home(`-# ${emojis.checkmark} Ended.`, interaction));
    }

    // ----- delete -----
    if (verb === 'del') {
        if (!(await gateRow(interaction, 'manage.announcementDelete'))) return;
        const doc = await getOne(a);
        return doc ? show(interaction, confirmCard(doc)) : gone(interaction);
    }
    if (verb === 'delok') {
        if (!(await gateRow(interaction, 'manage.announcementDelete')) || !(await gateDestructive(interaction))) return;
        await interaction.deferUpdate();
        const result = await require('../../../core/changeset').commitSet([{ type: 'announcement.delete', target: { id: a } }], { actorId: interaction.user.id });
        if (!result.ok) {
            if (result.failedAt?.reason === 'missing') return gone(interaction);
            return show(interaction, V.resultView({ title: 'The announcement was not deleted', body: [require('../shared').extractCommitError(result)], ok: false, back: ['card', a], backLabel: 'Back to It' }));
        }
        const removed = String(result.results[0].applied.removed?.text || '');
        return show(interaction, V.resultView({ title: 'Deleted', body: [`> ${(removed.length > 200 ? `${removed.slice(0, 200)}…` : removed).replace(/\n/g, '\n> ')}`, '-# Every change is recorded; Revert puts it back.'], back: 'page', backLabel: 'Announcements', extraButtons: revertButton(result.changeIds) }));
    }

    return say(interaction, `${emojis.cross} That button is from an older panel. Open \`/manage announcement\` again.`);
}

// The /manage dispatcher's entry (handlers/manage/index.js): TRUE when the id is this panel's.
async function handleAnnouncementsPanelInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith(PREFIX)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleAnnouncementsPanelInteraction, openFromSlash, renderHome, autocomplete, loadData, loadExpired, search, postAgainModal, PREFIX, DRAFT_TTL_MS, _drafts: drafts };
