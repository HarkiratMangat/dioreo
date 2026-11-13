// ==========================================
// /manage gunsmith mp|dmz — the rehauled panel: routing, permission checks, saves
// ==========================================
// Built 2026-11-07 14:09 EST from the plan he approved at 13:58 EST ("go ahead"; local/project/features/manage-rehaul/spec.md, his words and every decision in brief.md beside it). His asks: a condensed panel, an easier flow, consistent forms, one Export pop-up, better single and multiple add/replace/delete/edit, and slash options that go straight to a build.
//
// ⚠️ SAVES GO THROUGH THE EXISTING CODE, UNCHANGED. Add, Add Option and New Build open the real add_loadout_ pop-up; Edit, Move and Expand View's Edit hand their values to handlers/manage/loadouts.js editLoadout as a `preset` (the same replay path Save Anyway uses); Paste and Edit N hand the kept text to bulkAddLoadouts; Delete uses deleteItem; Delete N commits the same ops bulkDeleteLoadouts builds. So the ChangeLog, Revert, the code/catalogue/picture warnings and the saved panels are exactly what /manage has always given.
//
// ⚠️ PERMISSIONS: the router's /manage lock runs first (handlers/router.js, `mng_`); every action here also runs utils/manageActions.js resolveAction for its own tier before it opens a pop-up or writes, and a delete's Yes re-checks the destructive tier, as mng_delconfirm_ does. core/changeset.js commitSet checks every op once more.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Nothing here catches to swallow; replies in error branches are awaited.
//
// State that must outlive a click (Select's list and selection, Paste/Edit N's text, Expand View's start) lives in models/ManageSelection.js under a token the buttons carry, so a restart or a page change keeps it. It stores no user id.

const emojis = require('../../../utils/emojiMap');
const { sendV2Payload } = require('../../../utils/sendV2Payload');
const S = require('./search');
const B = require('./blocks');
const V = require('./views');

const Loadout = () => require('../../../models/Loadout');
const ManageSelection = () => require('../../../models/ManageSelection');
const manageCommand = () => require('../../../commands/manage');
const loadouts = () => require('../loadouts');
const PREFIX = 'mng_gs|';
const isObjectId = (x) => /^[0-9a-f]{24}$/.test(String(x || ''));

// ---------- answering ---------- One message that changes in place. A slash command, or a pop-up opened straight from one (no message under it), answers with a fresh reply instead.
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
    } catch (e) { console.error('manage gunsmith: could not answer (interaction likely expired):', e.message); }
}

// ---------- permission per action ----------
async function gate(interaction, mode, action) {
    const { resolveAction, DENIAL_MESSAGE } = require('../../../utils/manageActions');
    const g = await resolveAction(S.GROUP[mode], action, interaction.user.id);
    if (g.ok) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, g.message || DENIAL_MESSAGE[g.reason] || `${emojis.accessDenied} You do not have access to that.`);
    return false;
}
async function gateDestructive(interaction, mode) {
    const { can } = require('../../../utils/adminAccess');
    if (await can(interaction.user.id, `manage.${S.GROUP[mode]}`, 'destructive')) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, `${emojis.accessDenied} **You don't have access to delete here anymore.** Nothing was deleted.`);
    return false;
}

// ---------- the selection store ----------
const newToken = () => require('crypto').randomBytes(6).toString('base64url');
async function createSelection(mode, data = {}) {
    const token = newToken();
    await ManageSelection().create({ _id: token, mode, ...data });
    return token;
}
async function loadSel(token, mode) {
    const s = token ? await ManageSelection().findById(token).lean() : null;
    return s && s.mode === mode ? s : null;
}
const setSel = (token, fields) => ManageSelection().updateOne({ _id: token }, { $set: fields });
const expired = (mode) => V.resultView(mode, { title: 'That list expired. Search again.', ok: false, back: 'find', backLabel: 'Search Again' });
const selectedKeys = (sel) => { const on = new Set(sel.selected); return sel.ids.filter(k => on.has(k)); };

// The results or the Selected view (the draws redesign). One build selected shows its card; `results` keeps the results showing while picking.
async function selectPanel(mode, token, sel, note = null, page = 0, { results = false } = {}) {
    const on = new Set(sel.selected || []);
    const picked = sel.ids.filter(k => on.has(k));
    if (!results && picked.length === 1) {
        const [id, opt] = picked[0].split('~');
        const card = await V.cardView(mode, id, Number(opt) || 0, note, null, token);
        if (card) return card;
    }
    const shown = sel.ids.slice(page * V.SELECT_PAGE, page * V.SELECT_PAGE + V.SELECT_PAGE);
    const info = await S.infoFor([...new Set([...shown, ...picked.slice(0, 25)])]);
    return results || !picked.length ? V.resultsView(mode, token, sel, info, note, page) : V.selectView(mode, token, sel, info, note, page);
}

// ---------- pop-ups built on /manage's own ----------
function asJson(modal) { return modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal)); }
function reId(modal, customId, title) { const json = asJson(modal); json.custom_id = customId; if (title) json.title = title.slice(0, 45); return json; }
function setValue(json, fieldId, value) {
    for (const r of json.components || []) for (const c of [...(r.components || []), ...(r.component ? [r.component] : [])]) if (c.custom_id === fieldId) c.value = String(value).slice(0, c.max_length || 4000);
    return json;
}
async function addModal(mode, { weapon = '', build = '' } = {}) {
    const m = manageCommand();
    return weapon || build ? m.prefillModal(m.buildAddLoadoutModal(mode), { weapon, build }) : m.buildAddLoadoutModal(mode);
}
async function newBuildModal(mode, weaponKey) {
    const siblings = await Loadout().find({ mode, weaponKey }).lean();
    if (!siblings.length) return null;
    const next = siblings.length + 1;
    return addModal(mode, { weapon: siblings[0].weaponName, build: mode === 'DMZ' ? `${siblings[0].category}, ${next}` : `${siblings[0].category}, ${next}, ` });
}
async function editModal(mode, doc, opt, customId) {
    const L = require('../../../utils/loadoutOptions').optionLetter;
    const title = `Edit ${doc.weaponName} ${doc.buildName}${(doc.variants || []).length ? ` · ${L(Number(opt) || 0)}` : ''}`;
    return reId(await loadouts().editLoadoutModal(doc, Number(opt) || 0), customId, title);
}

// What an Edit pop-up's submit holds, as editLoadout's preset values (handlers/manage/loadouts.js fieldReader / shotOf).
function editPreset(interaction, id, opt) {
    const values = {};
    for (const k of ['weapon', 'build', 'attachments', 'image_url']) { try { values[k] = interaction.fields.getTextInputValue(k) || ''; } catch { values[k] = ''; } }
    try {
        const shot = [...(interaction.fields.getUploadedFiles('image_file')?.values() || [])][0];
        if (shot?.url) values.__shot = shot.url;
    } catch { /* no upload field, or nothing uploaded */ }
    return { customId: `edit_loadout_${id}${Number(opt) ? `~${Number(opt)}` : ''}`, values };
}

// The Credit pop-up is handlers/manage/loadouts.js creditModal, re-addressed so its submit comes back to this panel (`creditm`) with the option and the way back.
function creditModal(mode, doc, id, opt, back = null) {
    return { ...loadouts().creditModal(doc), custom_id: back ? V.ID(mode, 'creditm', id, Number(opt) || 0, back) : V.ID(mode, 'creditm', id, Number(opt) || 0) };
}

// ---------- the home page ----------
async function home(mode, note = null, interaction = null) {
    const showEmojis = interaction ? require('../../../utils/owner').isOwnerId(interaction.user.id) : false;
    return V.pageView(mode, note, { pageRow: manageCommand().buildPageSelectRow(S.GROUP[mode], { showEmojis }) });
}

// /manage's section dropdown picked MP or DMZ Gunsmith (handlers/manage/shared.js renderManagePage).
async function renderHome(interaction, mode) {
    return show(interaction, await home(mode, null, interaction));
}

// ---------- deletes ---------- One build or one option, as mng_delconfirm_ does it (handlers/manage/index.js), answered in place with Revert.
async function deleteOne(interaction, mode, id, opt) {
    const doc = isObjectId(id) ? await Loadout().findById(id).lean() : null;
    if (!doc || doc.mode !== mode) return show(interaction, await home(mode, `${emojis.cross} That build no longer exists.`, interaction));
    const merged = (doc.variants || []).length > 0;
    const L = require('../../../utils/loadoutOptions').optionLetter;
    const label = `${doc.weaponName} ${doc.buildName}${merged ? `, Option ${L(Number(opt) || 0)}` : ''}`;
    const changeIds = await loadouts().deleteItem({ id: merged ? `${id}~${Number(opt) || 0}` : id, doc, option: merged ? Number(opt) || 0 : null, label }, interaction.user.id);
    return show(interaction, V.resultView(mode, { crumbs: [S.classWord(doc.category), doc.weaponName], title: `Deleted ${label}`, body: ['-# Every change is recorded; Revert puts it back.'], back: ['wback', doc.weaponKey], backLabel: doc.weaponName, extraButtons: revertButton(changeIds) }));
}
function revertButton(changeIds) {
    const id = `mng_ldrevert|${(changeIds || []).join(',')}`;
    return changeIds?.length && id.length <= 100 ? [{ type: 2, style: 4, label: 'Revert', custom_id: id, emoji: emojis.parseEmoji(emojis.keep) }] : [];
}

// Many entries: whole builds go in one loadout.bulkDelete; options of a build that stays are cut with loadout.options, as bulkDeleteLoadouts builds them.
async function deleteMany(interaction, mode, keys) {
    const lo = require('../../../utils/loadoutOptions');
    const ids = [...new Set(keys.map(k => S.splitKey(k).id))].filter(isObjectId);
    const docs = new Map((await Loadout().find({ _id: { $in: ids }, mode }).lean()).map(d => [String(d._id), d]));
    const whole = new Set(), cuts = new Map();
    for (const k of keys) {
        const { id, opt } = S.splitKey(k);
        const d = docs.get(id);
        if (!d) continue;
        if (opt === null || !(d.variants || []).length) whole.add(id);
        else { const set = cuts.get(id) || new Set(); set.add(opt); cuts.set(id, set); }
    }
    const ops = [];
    for (const [id, indexes] of cuts) {
        if (whole.has(id)) continue;
        const d = docs.get(id);
        const left = lo.optionsOf(d).filter((_, i) => !indexes.has(i));
        if (!left.length) { whole.add(id); continue; }
        ops.push({ type: 'loadout.options', target: { id, mode }, payload: lo.optionsToFields(left) });
    }
    if (whole.size) ops.push({ type: 'loadout.bulkDelete', target: { mode }, payload: { ids: [...whole] } });
    if (!ops.length) return { ok: false, message: 'Nothing left to delete: those builds are already gone.' };
    const result = await require('../../../core/changeset').commitSet(ops, { actorId: interaction.user.id });
    if (!result.ok) return { ok: false, message: require('../shared').extractCommitError(result) };
    return { ok: true, changeIds: result.changeIds, count: keys.length };
}

// ---------- the slash command ---------- His 13:40 EST ask: more ways for the slash command to go straight to something without walking through the panel. `build:` opens a build (or `＋ New build`), `builds:` a Select list, `weapon:` / `class:` their pages; `do:` with a target acts at once. A pop-up has to be the first answer, so every path that opens one runs before anything is deferred.
const DO_CHOICES = [['Add Build', 'add'], ['Edit', 'edit'], ['Move', 'move'], ['Add Option', 'newopt'], ['Credit', 'credit'], ['Delete', 'delete'], ['Bulk Paste', 'paste'], ['Export', 'export'], ['Guide', 'guide']];

async function openFromSlash(interaction, mode) {
    const o = interaction.options;
    const build = o.getString('build'), weapon = o.getString('weapon'), cls = o.getString('class'), builds = o.getString('builds'), act = o.getString('do');
    const ephemeral = o.getString('visibility') !== 'public';
    const view = (components) => show(interaction, components, { ephemeral });

    if (build && build.startsWith('new:')) {
        if (!(await gate(interaction, mode, 'add'))) return;
        const modal = await newBuildModal(mode, build.slice(4));
        if (!modal) return view(await home(mode, `${emojis.cross} That weapon has no ${mode} builds any more.`, interaction));
        return interaction.showModal(modal);
    }
    if (build) {
        let [id, optRaw] = build.split('~');
        let opt = Number(optRaw) || 0;
        let doc = isObjectId(id) ? await Loadout().findById(id).lean() : null;
        if (!doc) {
            // Typed rather than picked: one match opens it.
            const hits = await S.searchBuilds(mode, build);
            if (hits.length !== 1) return view(await home(mode, `${emojis.cross} ${hits.length ? `${hits.length} builds match` : 'No build matches'} \`${build.slice(0, 60)}\`. Pick one from the list, or type more of its name.`, interaction));
            ({ id, option: opt } = hits[0]);
            doc = await Loadout().findById(id).lean();
        }
        if (!doc || doc.mode !== mode) return view(await home(mode, `${emojis.cross} That build no longer exists.`, interaction));
        if (act === 'edit') return (await gate(interaction, mode, 'edit')) && interaction.showModal(await editModal(mode, doc, opt, V.ID(mode, 'editm', id, opt)));
        if (act === 'move') return (await gate(interaction, mode, 'edit')) && interaction.showModal(V.moveModal(mode, doc, opt));
        if (act === 'newopt') return (await gate(interaction, mode, 'add')) && loadouts().showAddOption(interaction, doc, opt);
        if (act === 'credit') return (await gate(interaction, mode, 'edit')) && interaction.showModal(creditModal(mode, doc, id, opt));
        if (act === 'delete') {
            if (!(await gate(interaction, mode, 'delete'))) return;
            return view(await confirmDeleteCard(mode, doc, id, opt));
        }
        return view(await V.cardView(mode, id, opt));
    }
    if (builds) {
        const { keys, unmatched } = await S.resolveKeys(mode, builds, []);
        const query = builds.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
        if (act === 'edit') {
            if (!(await gate(interaction, mode, 'bulkreplace'))) return;
            const token = await createSelection(mode, { ids: keys, selected: keys, query, unmatched });
            const blocks = await B.keyBlocks(keys);
            const modal = keys.length ? B.blocksModal(V.ID(mode, 'teditm', token), `Edit ${keys.length} ${mode} Build${keys.length === 1 ? '' : 's'}`, blocks) : null;
            if (modal) return interaction.showModal(modal);
            const sel = await loadSel(token, mode);
            // The selection to work from, with the refusal as a private note under it (2026-11-11 16:46 EST).
            const out = await view(await selectPanel(mode, token, sel));
            if (keys.length) await say(interaction, `${emojis.warn} **Edit holds about ${B.fitCount(blocks)} of these.** Select fewer, or use Expand View.`);
            return out;
        }
        if (act === 'export') {
            if (!(await gate(interaction, mode, 'exportall'))) return;
            if (!keys.length) return say(interaction, `${emojis.cross} Nothing matched ${unmatched.map(x => `\`${x}\``).join(', ')}.`);
            const blocks = await B.keyBlocks(keys);
            return interaction.reply({ content: `${emojis.copyExport} **${keys.length}** ${mode} build${keys.length === 1 ? '' : 's'}${unmatched.length ? `\n-# ${emojis.warn} Nothing matched ${unmatched.map(x => `\`${x}\``).join(', ')}` : ''}`, files: [{ attachment: Buffer.from(blocks.join('\n\n'), 'utf-8'), name: `${mode.toLowerCase()}-builds.txt` }], flags: 64 });
        }
        const token = await createSelection(mode, { ids: keys, selected: act === 'delete' ? keys : [], query, unmatched });
        const sel = await loadSel(token, mode);
        if (act === 'delete' && keys.length) {
            if (!(await gate(interaction, mode, 'bulkdelete'))) return;
            return view(await confirmDeleteMany(mode, token, sel, 0));
        }
        return view(await selectPanel(mode, token, sel));
    }
    if (weapon) return view(await V.weaponView(mode, weapon));
    if (cls) return view(await V.classView(mode, cls));
    if (act === 'add') return (await gate(interaction, mode, 'add')) && interaction.showModal(await addModal(mode));
    if (act === 'paste') return (await gate(interaction, mode, 'bulkadd')) && interaction.showModal(reId(manageCommand().buildLoadoutsBulkAddModal(mode), V.ID(mode, 'pastem'), `Paste ${mode} Builds`));
    if (act === 'export') return (await gate(interaction, mode, 'exportall')) && interaction.showModal(V.exportModal(mode));
    if (act === 'guide') return runGuide(interaction, mode);
    if (act) return view(await home(mode, `${emojis.warn} **${DO_CHOICES.find(c => c[1] === act)?.[0] || act}** needs a \`build:\` (or \`builds:\` for several) to act on.`, interaction));
    return view(await home(mode, null, interaction));
}

async function runGuide(interaction, mode) {
    if (!(await gate(interaction, mode, 'formatguide'))) return;
    const action = require('../../../utils/manageActions').ACTIONS_BY_PAGE[S.GROUP[mode]].find(x => x.id === 'formatguide');
    return action.run({ interaction, page: S.GROUP[mode], manageCommand: manageCommand() });
}

// ---------- autocomplete for build: and weapon: ----------
async function autocomplete(interaction, mode) {
    const focused = interaction.options.getFocused(true);
    const q = String(focused.value || '');
    const cut = (x) => (x.length > 100 ? `${x.slice(0, 99)}…` : x);
    if (focused.name === 'weapon') {
        const builds = await Loadout().find({ mode }).select('weaponName weaponKey category').lean();
        const by = new Map();
        for (const b of builds) by.set(b.weaponKey, { name: b.weaponName, cat: b.category, n: (by.get(b.weaponKey)?.n || 0) + 1 });
        const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const words = q.split(/\s+/).map(norm).filter(Boolean);
        const list = [...by.entries()].filter(([, w]) => words.every(x => norm(w.name).includes(x))).sort((a, b) => a[1].name.localeCompare(b[1].name)).slice(0, 25);
        return interaction.respond(list.map(([key, w]) => ({ name: cut(`${w.name} · ${S.classWord(w.cat)} · ${w.n} build${w.n === 1 ? '' : 's'}`), value: key })));
    }
    if (focused.name === 'build') {
        const hits = q.trim() ? await S.searchBuilds(mode, q) : [];
        const keyOf = (h) => (h.option ? `${h.id}~${h.option}` : h.id);
        const info = await S.infoFor(hits.slice(0, 24).map(keyOf));
        const out = hits.slice(0, 24).map(h => {
            const i = info.get(keyOf(h));
            return { name: cut(i ? `${i.plain.replace(/\*\*/g, '')}${i.plainSmall && !i.plain.includes(i.plainSmall) ? ` · ${i.plainSmall}` : ''}` : h.label), value: `${h.id}~${h.option}` };
        });
        // `＋ New build` for the weapon typed, so Add is one pick away: the top match's weapon, else the weapon whose name holds every typed word. Matching the first word alone offered KILO BOLT-ACTION for `kilo 141 2` (phone click-test, 2026-11-07 14:31 EST).
        if (q.trim() && out.length < 25) {
            let w = hits[0] ? await Loadout().findById(hits[0].id).select('weaponName weaponKey').lean() : null;
            if (!w) {
                const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const words = q.trim().split(/\s+/).filter(x => !/^\d+[a-z]?$/i.test(x)).map(norm).filter(Boolean);
                const weapons = words.length ? await Loadout().find({ mode }).select('weaponName weaponKey').lean() : [];
                w = weapons.find(x => words.every(word => norm(x.weaponName).includes(word))) || null;
            }
            if (w) out.push({ name: cut(`＋ New build for ${w.weaponName}`), value: `new:${w.weaponKey}` });
        }
        return interaction.respond(out);
    }
    return interaction.respond([]);
}

// ---------- confirms ----------
async function confirmDeleteCard(mode, doc, id, opt, back = null) {
    const L = require('../../../utils/loadoutOptions').optionLetter;
    const merged = (doc.variants || []).length > 0;
    const head = `### ${emojis.warn} Delete ${doc.weaponName} ${doc.buildName}${merged ? `, Option ${L(Number(opt) || 0)}` : ''}?\n-# ${merged ? 'Only this option goes; the ones after it move up a letter.' : 'The build goes, and later build numbers move up one.'} Every change can be reverted.`;
    return V.cardView(mode, id, opt, head, [V.row(V.btn(mode, ['delok', id, opt], 'Yes, Delete', emojis.deleteBin, 4), V.btn(mode, ['card', id, opt, ...(back ? [back] : [])], 'Cancel', emojis.returnArrow))], back);
}
async function confirmDeleteMany(mode, token, sel, page) {
    const keys = selectedKeys(sel);
    const info = await S.infoFor(keys);
    return V.resultView(mode, {
        ok: 'warn', crumbs: ['Selected'], title: `Delete ${keys.length} build${keys.length === 1 ? '' : 's'}?`,
        body: [...B.capList(keys.map(k => `- ${info.get(k) ? `${info.get(k).icon} ${info.get(k).title}` : k}`)), '', '-# Every change is recorded and can be reverted.'],
        back: ['list', token, page], backLabel: 'Cancel', extraButtons: [V.btn(mode, ['tdelok', token], `Yes, Delete ${keys.length}`, emojis.deleteBin, 4)],
    });
}

// A preview of paste text in place, with Save and the way back to the text.
async function previewPanel(mode, token, raw, { editAgain, crumbs, title, backToList = null }) {
    const pv = await B.previewBlocks(mode, raw);
    return V.resultView(mode, {
        ok: pv.problems || !pv.count ? 'warn' : true, crumbs, title: `${title} · ${pv.count} of ${pv.total} to save`, body: pv.parts,
        back: editAgain, backLabel: crumbs[crumbs.length - 1] === 'Bulk Paste' ? 'Edit Paste' : 'Edit Again',
        extraButtons: pv.count ? [V.btn(mode, ['save', token], `Save ${pv.count}`, emojis.checkmark, 3)] : [],
        // Edit N's preview also goes back to its list, so a look that changes nothing is one click from the selection.
        extraRows: backToList ? [V.row(V.btn(mode, backToList, 'Back to Selected', emojis.returnArrow))] : [],
    });
}

// ---------- routing ----------
async function route(interaction) {
    const [, modeChar, verb, a, b, c] = interaction.customId.split('|');
    const mode = V.MODE_OF[modeChar];
    if (!mode) return say(interaction, `${emojis.cross} That button is from an older panel. Open \`/manage gunsmith\` again.`);
    const n = (x) => Number(x) || 0;

    // ----- buttons and selects that only change the message -----
    if (verb === 'page') return show(interaction, await home(mode, null, interaction));
    if (verb === 'cls') return show(interaction, await V.classView(mode, a));
    if (verb === 'wpn' && interaction.isStringSelectMenu?.()) return show(interaction, await V.weaponView(mode, interaction.values[0]));
    if (verb === 'wback') return show(interaction, await V.weaponView(mode, a));
    if (verb === 'card') return show(interaction, await V.cardView(mode, a, n(b), null, null, c || null));
    if (verb === 'opt' && interaction.isStringSelectMenu?.()) return show(interaction, await V.cardView(mode, a, n(interaction.values[0]), null, null, b || null));
    if (verb === 'pick' && interaction.isStringSelectMenu?.()) { const [id, opt] = interaction.values[0].split('~'); return show(interaction, await V.cardView(mode, id, n(opt))); }
    if (verb === 'find') return interaction.showModal(V.searchModal(mode));
    if (verb === 'guide') return runGuide(interaction, mode);

    // ----- pop-ups that save through the real handlers -----
    if (verb === 'add') return (await gate(interaction, mode, 'add')) && interaction.showModal(await addModal(mode));
    if (verb === 'newb') {
        if (!(await gate(interaction, mode, 'add'))) return;
        const modal = await newBuildModal(mode, a);
        return modal ? interaction.showModal(modal) : show(interaction, await home(mode, `${emojis.cross} That weapon has no ${mode} builds any more.`, interaction));
    }
    if (verb === 'edit' || verb === 'move' || verb === 'newopt' || verb === 'credit' || verb === 'del') {
        const doc = isObjectId(a) ? await Loadout().findById(a).lean() : null;
        if (!doc || doc.mode !== mode) return show(interaction, await home(mode, `${emojis.cross} That build no longer exists.`, interaction));
        if (verb === 'edit') return (await gate(interaction, mode, 'edit')) && interaction.showModal(await editModal(mode, doc, b, c ? V.ID(mode, 'editm', a, n(b), c) : V.ID(mode, 'editm', a, n(b))));
        if (verb === 'move') return (await gate(interaction, mode, 'edit')) && interaction.showModal(V.moveModal(mode, doc, n(b), c || null));
        if (verb === 'newopt') return (await gate(interaction, mode, 'add')) && loadouts().showAddOption(interaction, doc, n(b));
        if (verb === 'credit') return (await gate(interaction, mode, 'edit')) && interaction.showModal(creditModal(mode, doc, a, n(b), c || null));
        return (await gate(interaction, mode, 'delete')) && show(interaction, await confirmDeleteCard(mode, doc, a, n(b), c || null));
    }
    if (verb === 'delok') {
        if (!(await gate(interaction, mode, 'delete')) || !(await gateDestructive(interaction, mode))) return;
        return deleteOne(interaction, mode, a, n(b));
    }
    if (verb === 'editm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, mode, 'edit'))) return;
        const preset = editPreset(interaction, a, b);
        // From the panel: the card under the pop-up is refreshed in place and the saved panel (with Revert) follows it. From the slash command there is no card, so the save answers alone.
        if (!interaction.message) return loadouts().editLoadout(interaction, preset);
        await interaction.deferUpdate();
        await loadouts().editLoadout(interaction, preset);
        return show(interaction, await V.cardView(mode, a, n(b), `-# ${emojis.checkmark} Saved. The result, with Revert, is in the message below.`, null, c || null));
    }
    // Credit saves through the old pop-up's own saveCredit (core's loadout.credit, so it carries Revert); from the panel the card refreshes in place and the saved panel follows, exactly as Edit does (2026-11-12 19:21 EST).
    if (verb === 'creditm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, mode, 'edit'))) return;
        if (!interaction.message) return loadouts().saveCredit(interaction, { id: a });
        await interaction.deferUpdate();
        await loadouts().saveCredit(interaction, { id: a, deferred: true });
        return show(interaction, await V.cardView(mode, a, n(b), `-# ${emojis.checkmark} Credit saved. The result, with Revert, is in the message below.`, null, c || null));
    }
    if (verb === 'movem' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, mode, 'edit'))) return;
        const doc = isObjectId(a) ? await Loadout().findById(a).lean() : null;
        if (!doc || doc.mode !== mode) return show(interaction, await home(mode, `${emojis.cross} That build no longer exists.`, interaction));
        const to = interaction.fields.getTextInputValue('to').trim().toLowerCase();
        // A refusal answers privately and leaves the card as it was (round 2's rule; found by the 2026-11-11 16:46 EST think-pass).
        if (!/^\d+[a-z]?$/.test(to)) return say(interaction, `${emojis.cross} \`${to.slice(0, 10)}\` is not a build number. Use \`3\`, or \`2b\` to make it an option of Build 2.`);
        // The build's own Edit values with only the build # changed: the save moves it (a taken number swaps; a letter joins that build), exactly as typing the number into Edit does.
        const form = require('../../../utils/loadoutForm');
        const siblings = await Loadout().find({ mode, weaponKey: doc.weaponKey }).lean();
        const values = form.editValues(doc, siblings, require('../../../utils/adminParser').loadoutBadgeTokens(doc), n(b));
        const parts = String(values.build || '').split(',').map(x => x.trim());
        parts[1] = to;
        values.build = parts.join(', ');
        const preset = { customId: `edit_loadout_${a}${n(b) ? `~${n(b)}` : ''}`, values };
        if (!interaction.message) return loadouts().editLoadout(interaction, preset);
        await interaction.deferUpdate();
        await loadouts().editLoadout(interaction, preset);
        const still = await Loadout().findById(a).lean();
        return show(interaction, still ? await V.cardView(mode, a, 0, `-# ${emojis.checkmark} Moved. The result, with Revert, is in the message below.`, null, c || null) : await V.weaponView(mode, doc.weaponKey, `-# ${emojis.checkmark} Moved. The result, with Revert, is in the message below.`));
    }

    // ----- Search ----- One Search (the draws redesign): names, one per line, widen each other; quick picks narrow them; both blank is every build. One match opens its card; none answers privately.
    if (verb === 'findm' && interaction.isModalSubmit?.()) {
        const field = (id) => { try { const f = interaction.fields.getField(id); return f?.value ?? f?.values ?? null; } catch { return null; } };
        const q = field('q') || '';
        const picks = [].concat(field('picks') || []);
        const lines = String(q).split('\n').map(x => x.trim()).filter(Boolean);
        const keyOf = (h) => (h.option ? `${h.id}~${h.option}` : h.id);
        const unmatched = [];
        let keys = null;
        if (lines.length) {
            const seen = new Set(); keys = [];
            for (const line of lines) {
                const hits = await S.searchBuilds(mode, line);
                if (!hits.length) unmatched.push(line);
                for (const h of hits) { const k = keyOf(h); if (!seen.has(k)) { seen.add(k); keys.push(k); } }
            }
        }
        if (picks.length) {
            const inPicks = (await S.resolveKeys(mode, '', picks)).keys;
            const set = new Set(inPicks);
            // A pick names whole builds; a typed line can name one option (`2b`), which counts as its build being in the pick.
            keys = keys ? keys.filter(k => set.has(k) || set.has(k.split('~')[0])) : inPicks;
        }
        if (!keys) keys = (await S.resolveKeys(mode, '', S.quickPicks(mode).map(([v]) => v))).keys;
        const labels = Object.fromEntries(S.quickPicks(mode));
        const what = [...lines.map(x => `\`${x.slice(0, 40)}\``), ...picks.map(v => labels[v] || v)];
        if (!keys.length) return say(interaction, `${emojis.cross} No build matches ${what.join(' · ') || 'that'}. Try fewer words, or browse by class.`);
        if (keys.length === 1) { const [id, opt] = keys[0].split('~'); return show(interaction, await V.cardView(mode, id, Number(opt) || 0)); }
        const token = await createSelection(mode, { ids: keys, selected: [], query: what, unmatched });
        return show(interaction, await selectPanel(mode, token, await loadSel(token, mode), null, 0, { results: true }));
    }

    if (['spick', 'sunpick', 'slist', 'all', 'none', 'list', 'step', 'stopt', 'stedit', 'stm', 'stdone', 'tedit', 'teditm', 'texp', 'tdel', 'tdelok', 'save', 'paste', 'pastem'].includes(verb)) {
        return routeSelection(interaction, mode, verb, a, b, c);
    }

    // ----- Export -----
    if (verb === 'export') return (await gate(interaction, mode, 'exportall')) && interaction.showModal(V.exportModal(mode));
    if (verb === 'exportm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, mode, 'exportall'))) return;
        const field = (id) => { try { const f = interaction.fields.getField(id); return f?.value ?? f?.values ?? null; } catch { return null; } };
        const { builds, unmatched } = await S.resolveSet(mode, field('names'), field('picks') || []);
        const dest = [].concat(field('dest') || 'file')[0];
        const include = [].concat(field('include') || []);
        const merged = [].concat(field('merged') || 'keep')[0];
        const missed = unmatched.length ? `\n-# ${emojis.warn} Nothing matched ${unmatched.map(s => `\`${s}\``).join(', ')}` : '';
        if (!builds.length) return say(interaction, `${emojis.cross} Nothing matched, so there is nothing to export.${missed}`);
        const file = { attachment: Buffer.from(B.exportText(mode, builds, { include, merged }), 'utf-8'), name: `${mode.toLowerCase()}-builds.txt` };
        const summary = `${emojis.copyExport} **${builds.length}** ${mode} build${builds.length === 1 ? '' : 's'}${missed}`;
        if (dest === 'dm') {
            try { await interaction.user.send({ content: summary, files: [file] }); }
            catch { return say(interaction, `${emojis.cross} Your DMs are closed to Dioreo, so here it is instead.`).then(() => interaction.followUp({ content: summary, files: [file], flags: 64 })); }
            return say(interaction, `${emojis.checkmark} Sent to your DMs: **${builds.length}** builds.`);
        }
        return interaction.reply({ content: summary, files: [file], flags: 64 });
    }

    return say(interaction, `${emojis.cross} That button is from an older panel. Open \`/manage gunsmith ${mode.toLowerCase()}\` again.`);
}

// Select, Expand View, Edit N, Delete N, Paste: everything that reads a stored list or text.
async function routeSelection(interaction, mode, verb, a, b, c) {
    const n = (x) => Number(x) || 0;

    // Paste starts its own stored text; it has no list.
    if (verb === 'paste') {
        if (!(await gate(interaction, mode, 'bulkadd'))) return;
        const last = a ? await loadSel(a, mode) : null;
        const modal = reId(manageCommand().buildLoadoutsBulkAddModal(mode), V.ID(mode, 'pastem'), `Paste ${mode} Builds`);
        if (last?.text) setValue(modal, 'bulk_text', last.text);
        return interaction.showModal(modal);
    }
    if (verb === 'pastem' && interaction.isModalSubmit?.()) {
        const raw = interaction.fields.getTextInputValue('bulk_text');
        const token = await createSelection(mode, { text: raw });
        return show(interaction, await previewPanel(mode, token, raw, { editAgain: ['paste', token], crumbs: ['Bulk Paste'], title: 'Bulk Paste preview' }));
    }

    const sel = await loadSel(a, mode);
    if (!sel) return say(interaction, `${emojis.cross} That list expired. Search again.`);
    const keys = selectedKeys(sel);

    // The results' Select menu adds, the Selected view's Unselect menu takes away (the draws redesign).
    if ((verb === 'spick' || verb === 'sunpick') && interaction.isStringSelectMenu?.()) {
        const on = new Set(sel.selected);
        for (const v of interaction.values) { if (verb === 'spick') on.add(v); else on.delete(v); }
        sel.selected = sel.ids.filter(k => on.has(k));
        await setSel(a, { selected: sel.selected });
        return show(interaction, await selectPanel(mode, a, sel, null, n(b)));
    }
    if (verb === 'all' || verb === 'none') {
        sel.selected = verb === 'all' ? [...sel.ids] : [];
        await setSel(a, { selected: sel.selected });
        return show(interaction, await selectPanel(mode, a, sel, null, n(b)));
    }
    // The results' pager and Select More show the results; View Selected shows the set.
    if (verb === 'list') return show(interaction, await selectPanel(mode, a, sel, null, n(b), { results: true }));
    if (verb === 'slist') return show(interaction, await selectPanel(mode, a, sel, null, n(b)));

    // Expand View
    if (verb === 'step') {
        if (!sel.openedAt) { sel.openedAt = new Date(); await setSel(a, { openedAt: sel.openedAt }); }
        return show(interaction, await V.stepView(mode, a, sel, n(b)));
    }
    if (verb === 'stopt' && interaction.isStringSelectMenu?.()) return show(interaction, await V.stepView(mode, a, sel, n(b), n(interaction.values[0])));
    if (verb === 'stedit') {
        if (!(await gate(interaction, mode, 'edit'))) return;
        const { id } = S.splitKey(keys[n(b)] || '');
        const doc = isObjectId(id) ? await Loadout().findById(id).lean() : null;
        if (!doc) return show(interaction, await V.stepView(mode, a, sel, n(b)));
        return interaction.showModal(await editModal(mode, doc, c, V.ID(mode, 'stm', a, n(b), n(c))));
    }
    if (verb === 'stm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, mode, 'edit'))) return;
        const { id } = S.splitKey(keys[n(b)] || '');
        if (!isObjectId(id)) return show(interaction, await V.stepView(mode, a, sel, n(b)));
        await interaction.deferUpdate();
        await loadouts().editLoadout(interaction, editPreset(interaction, id, c));
        return show(interaction, await V.stepView(mode, a, sel, n(b), n(c), `-# ${emojis.checkmark} Saved. The result, with Revert, is in the message below.`));
    }
    if (verb === 'stdone') {
        const edited = await V.editedSince(keys, sel.openedAt);
        const info = await S.infoFor(keys);
        const doneKeys = keys.filter(k => edited.has(S.splitKey(k).id));
        return show(interaction, V.resultView(mode, {
            crumbs: ['Selected', 'Expand View'], title: `Expand View done · ${doneKeys.length} of ${keys.length} edited`,
            body: [...B.capList(keys.map(k => `- ${edited.has(S.splitKey(k).id) ? emojis.checkmark : emojis.smallDot} ${info.get(k)?.title || k}`)), '', '-# Each edit was saved when you made it; its Revert is on its saved message.'],
            back: ['slist', a, 0], backLabel: 'Back to Selected',
        }));
    }

    // Edit N: the selected entries as one big text pop-up (his 13:13 EST: "edit 3 should open them as a large text field").
    if (verb === 'tedit') {
        if (!(await gate(interaction, mode, 'bulkreplace'))) return;
        if (!keys.length) return show(interaction, await selectPanel(mode, a, sel, null, n(b)));
        const blocks = c === 'again' && sel.text ? sel.text.split(/\n\s*\n/).filter(x => x.trim()) : await B.keyBlocks(keys);
        const modal = B.blocksModal(V.ID(mode, 'teditm', a), `Edit ${keys.length} ${mode} Build${keys.length === 1 ? '' : 's'}`, blocks);
        // A refusal answers privately and leaves the panel as it was (the draws panel's round-2 rule, carried here 2026-11-11 16:46 EST).
        if (!modal) return say(interaction, `${emojis.warn} **Edit holds about ${B.fitCount(blocks)} of these** (one pop-up is 5 boxes of 4,000 characters). Select fewer, or use Expand View.`);
        return interaction.showModal(modal);
    }
    if (verb === 'teditm' && interaction.isModalSubmit?.()) {
        const raw = B.readBoxes(interaction);
        await setSel(a, { text: raw });
        return show(interaction, await previewPanel(mode, a, raw, { editAgain: ['tedit', a, 0, 'again'], crumbs: ['Selected', 'Edit'], title: 'Edit preview', backToList: ['slist', a, 0] }));
    }
    // Save for Paste and Edit N: only the blocks that add or change something go to the real bulk save, whose result (with Revert, or a warning to answer) follows this message.
    if (verb === 'save') {
        const isEdit = sel.ids.length > 0;
        if (!(await gate(interaction, mode, isEdit ? 'bulkreplace' : 'bulkadd'))) return;
        const pv = await B.previewBlocks(mode, sel.text);
        // A refusal or nothing-changed answers privately and leaves the panel as it was (round 2's rule; the 2026-11-11 16:46 EST think-pass).
        if (!pv.keep) return say(interaction, `${emojis.info} Nothing to save: every build is unchanged.`);
        await interaction.deferUpdate();
        await loadouts().bulkAddLoadouts(interaction, { customId: `modal_loadouts_bulk_add_${mode}`, values: { bulk_text: pv.keep } });
        return show(interaction, V.resultView(mode, { crumbs: isEdit ? ['Selected', 'Edit'] : ['Bulk Paste'], title: `Sent ${pv.count} build${pv.count === 1 ? '' : 's'} to save`, body: ['-# The result is in the message below. A bulk save is reverted from `/bot analytics` › Changes.'], back: isEdit ? ['slist', a, 0] : 'page', backLabel: isEdit ? 'Back to Selected' : 'Home' }));
    }

    if (verb === 'texp') {
        if (!(await gate(interaction, mode, 'exportall'))) return;
        if (!keys.length) return show(interaction, await selectPanel(mode, a, sel));
        const blocks = await B.keyBlocks(keys);
        return interaction.reply({ content: `${emojis.copyExport} **${keys.length}** ${mode} build${keys.length === 1 ? '' : 's'}`, files: [{ attachment: Buffer.from(blocks.join('\n\n'), 'utf-8'), name: `${mode.toLowerCase()}-builds.txt` }], flags: 64 });
    }
    if (verb === 'tdel') {
        if (!(await gate(interaction, mode, 'bulkdelete'))) return;
        if (!keys.length) return show(interaction, await selectPanel(mode, a, sel, null, n(b)));
        return show(interaction, await confirmDeleteMany(mode, a, sel, n(b)));
    }
    if (verb === 'tdelok') {
        if (!(await gate(interaction, mode, 'bulkdelete')) || !(await gateDestructive(interaction, mode))) return;
        await interaction.deferUpdate();
        const r = await deleteMany(interaction, mode, keys);
        if (!r.ok) return say(interaction, `${emojis.cross} **Nothing was deleted.** ${r.message}`);
        // The deleted entries leave the list, so Back shows what is left.
        const gone = new Set(keys);
        await setSel(a, { ids: sel.ids.filter(k => !gone.has(k)), selected: [] });
        return show(interaction, V.resultView(mode, { crumbs: ['Selected'], title: `Deleted ${r.count} build${r.count === 1 ? '' : 's'}`, body: [r.changeIds.length && !revertButton(r.changeIds).length ? '-# Too many changes for one Revert button: revert them from `/bot analytics` › Changes.' : '-# Every change is recorded; Revert puts them back.'], back: ['slist', a, 0], backLabel: 'Back to Selected', extraButtons: revertButton(r.changeIds) }));
    }
    return show(interaction, expired(mode));
}

// The /manage dispatcher's entry (handlers/manage/index.js): TRUE when the id is this panel's.
async function handleGunsmithInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith(PREFIX)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleGunsmithInteraction, renderHome, openFromSlash, autocomplete, DO_CHOICES, PREFIX, _test: { show, deleteMany, editPreset, setValue, reId } };
