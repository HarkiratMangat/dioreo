// ==========================================
// /mockdraws — THROWAWAY MOCK-UP HANDLER (dev bot only, owner only). Deleted before the rehaul's PR.
// ==========================================
// Built 2026-11-07 16:44 EST: the proposed /manage draws flow, the way the gunsmith panel went (v3.13.0): one message that changes in place, Back/Home everywhere, a draw card with its own actions, a list you browse by status, Select for many draws, one Export pop-up, Paste with a preview. It runs on the dev database.
//
// ⚠️ IT NEVER WRITES. Every save answers with what it WOULD do; Export builds a real file, which only reads. Every pop-up is re-identified to `mockd|…` so no submit can reach the real save handlers in handlers/manage/.

const PREFIX = 'mockd|';
const emojis = require('../utils/emojiMap');
const { sendV2Payload } = require('../utils/sendV2Payload');
const D = () => require('../commands/draws');
const isOwner = (id) => require('../utils/owner').isOwnerId(id);
const ACCENT = 7032445; // /draws' Plum Fortune (PRESET_ACCENT)

const row = (...c) => ({ type: 1, components: c });
const text = (content) => ({ type: 10, content });
const BIG = () => ({ type: 14, divider: true, spacing: 2 });
const SMALL = () => ({ type: 14, divider: false, spacing: 1 });
const btn = (id, label, emojiStr, style = 2, disabled = false) => ({ type: 2, style, ...(label ? { label } : {}), custom_id: `${PREFIX}${id}`, disabled, ...(emojiStr ? { emoji: emojis.parseEmoji(emojiStr) } : {}) });
const crumb = (...p) => `-# ${['Draws', ...p].join('  ›  ')}`;
const panel = (components) => [{ type: 17, accent_color: ACCENT, components: [...components, SMALL(), text('-# Mock-up · nothing here saves')] }];
const home = () => btn('page', 'Home', emojis.returnArrow);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

// Select lists, in memory (mock only). token -> { keys, selected:Set, query }
const SEL = new Map();
const PASTE = new Map();
const newToken = () => Date.now().toString(36).slice(-6) + Math.random().toString(36).slice(2, 4);

// ---------- data ----------
async function getDoc() { return require('../models/SeasonalData').findOne({ docType: 'global' }).lean(); }
// A draw's key: `n:<id>` (New) or `r:<id>` (Returning).
function allDraws(doc) {
    const now = Date.now();
    const t = (d, sec) => ({ ...d, _sec: sec, _key: `${sec[0]}:${d._id}`, ...D().drawTiming(d, doc, now) });
    return [...(doc.newDraws || []).map(d => t(d, 'new')), ...(doc.returningDraws || []).map(d => t(d, 'returning'))];
}
const findKey = (doc, key) => allDraws(doc).find(d => d._key === key) || null;
const rowFor = (doc) => (d) => require('../utils/drawEndReminder').calendarRowFor(doc, d.title);

const STATUS = {
    new: { label: 'New Draws', test: d => d._sec === 'new', emoji: () => emojis.newDraws },
    returning: { label: 'Returning Draws', test: d => d._sec === 'returning', emoji: () => emojis.returningDraws },
    upcoming: { label: 'Upcoming', test: d => d.bits & 4, emoji: () => emojis.lightBlueDotGlow },
    live: { label: 'Active Now', test: d => d.bits & 8, emoji: () => emojis.greenDotGlow },
    leaving: { label: 'Leaving Soon', test: d => d.bits & 16, emoji: () => emojis.yellowDotGlow },
    ended: { label: 'Ended', test: d => d.bits & 32, emoji: () => emojis.redDotGlow },
    noend: { label: 'No End Date', test: d => d.state !== 'over' && !Number.isFinite(d.endMs), emoji: () => emojis.warn },
};
const dot = (d) => (d.bits & 32 ? emojis.redDotGlow : d.bits & 16 ? emojis.yellowDotGlow : d.bits & 8 ? emojis.greenDotGlow : emojis.lightBlueDotGlow);
function stateWords(d) {
    const r = (ms) => `<t:${Math.floor(ms / 1000)}:R>`;
    if (d.state === 'tba') return 'date TBA';
    if (d.bits & 32) return `ended ${r(d.endMs)}`;
    if (d.bits & 4) return `releases ${r(d.startMs)}`;
    return Number.isFinite(d.endMs) ? `${d.bits & 16 ? 'ending' : 'ends'} ${r(d.endMs)}` : `live, **no end date**`;
}
const secWord = (d) => (d._sec === 'new' ? 'New' : 'Returning');

// ---------- home ----------
async function pageView(note = null) {
    const doc = await getDoc();
    const all = allDraws(doc);
    const n = (k) => all.filter(STATUS[k].test).length;
    const season = doc.currentSeasonTitle ? `\n${require('../utils/seasonEmoji').seasonEmojiFor(doc.currentSeasonTitle, doc.currentSeasonEmoji) || ''} ${require('../utils/titleBlock').toBoldItalicUnicode(doc.currentSeasonTitle)}` : '';
    const counts = [`${n('new')} new`, `${n('returning')} returning`, `${n('live')} active now`, ...(n('noend') ? [`${emojis.warn} ${n('noend')} with no end date`] : [])].join(' · ');
    const components = [text(`## ${emojis.newDraws}${emojis.returningDraws} Draws${season}\n-# ${counts}`)];
    if (note) components.push(SMALL(), text(note));
    components.push(
        BIG(),
        text('-# Add draws…'),
        row(btn('quickadd', 'Quick Add', emojis.mngAdd, 3), btn('addnew', 'Add New Draw', emojis.newDraws), btn('addreturning', 'Add Returning Draw', emojis.returningDraws)),
        SMALL(),
        text('-# Find a draw…'),
        row(btn('find', 'Search Draws', emojis.gunsmithSearch, 1)),
        { type: 1, components: [{ type: 3, custom_id: `${PREFIX}browse`, placeholder: 'Or browse a list…', options: Object.entries(STATUS).map(([value, s]) => ({ value, label: `${s.label} · ${n(value)}`, emoji: emojis.parseEmoji(s.emoji()) })) }] },
        BIG(),
        text('-# Many draws at once…'),
        row(btn('paste', 'Paste Draws', emojis.mngBulkAdd), btn('select', 'Select Draws', emojis.filter), btn('export', 'Export', emojis.copyExport), btn('guide', 'Guide', emojis.guide)),
        SMALL(),
        text('-# End of season…'),
        row(btn('purge', 'Purge Draws', emojis.deleteBin, 4)),
    );
    return panel(components);
}

// ---------- a list by status ----------
const PAGE = 10;
async function listView(status, page = 0) {
    const doc = await getDoc();
    const s = STATUS[status] || STATUS.new;
    const list = allDraws(doc).filter(s.test).sort((a, b) => (a.startMs || 0) - (b.startMs || 0));
    const pages = Math.max(1, Math.ceil(list.length / PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = list.slice(pg * PAGE, pg * PAGE + PAGE);
    const components = [text(`${crumb(s.label)}\n## ${s.emoji()} ${s.label}\n-# ${plural(list.length, 'draw')}${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`), BIG()];
    if (!shown.length) components.push(text(`${emojis.cross} No draws here.`));
    else {
        components.push(text(shown.map(d => `${dot(d)} **${d.title}**\n-# ${emojis.blank}${emojis.blank} ${secWord(d)} · ${stateWords(d)}`).join('\n')));
        components.push({ type: 1, components: [{ type: 3, custom_id: `${PREFIX}open|${status}`, placeholder: 'Open a draw…', options: shown.map(d => ({ label: d.title.slice(0, 100), value: d._key, description: `${secWord(d)} · ${d.bits & 32 ? 'Ended' : d.bits & 16 ? 'Leaving soon' : d.bits & 8 ? 'Active now' : 'Upcoming'}` })) }] });
        if (pages > 1) components.push(row({ type: 2, style: 2, custom_id: `${PREFIX}list|${status}|${pg - 1}`, emoji: emojis.parseEmoji(emojis.left), disabled: pg === 0 }, { type: 2, style: 2, label: `Page ${pg + 1} / ${pages}`, custom_id: `${PREFIX}pgn`, disabled: true }, { type: 2, style: 2, custom_id: `${PREFIX}list|${status}|${pg + 1}`, emoji: emojis.parseEmoji(emojis.right), disabled: pg === pages - 1 }));
    }
    components.push(BIG(), row(btn(`sellist|${status}`, `Select These ${list.length}`, emojis.filter, 2, !list.length), home()));
    return panel(components);
}

// ---------- one draw ----------
async function cardView(key, header = null, extra = null, back = null) {
    const doc = await getDoc();
    const d = findKey(doc, key);
    if (!d) return pageView(`${emojis.cross} That draw no longer exists.`);
    const end = rowFor(doc)(d);
    const type = d.priceType ? (require('../utils/drawTypes').DRAW_TYPES?.find?.(t => t.key === d.priceType)?.label || d.priceType) : null;
    const components = [text(crumb(`${secWord(d)} Draws`, d.title))];
    if (header) components.push(text(header), SMALL());
    components.push(...D().buildDrawSections([d], { seasonalDoc: doc, nowMs: Date.now() }));
    components.push(text(`-# ${secWord(d)} draw${type ? ` · ${type}` : ''} · ${end?.endDate ? `ends <t:${Math.floor(new Date(end.endDate).getTime() / 1000)}:f>` : `${emojis.warn} no end date on /calendar`}`), BIG());
    if (extra) components.push(...extra);
    else components.push(
        row(btn(`edit|${key}`, 'Edit', emojis.edit, 1), btn(`end|${key}`, end?.endDate ? 'Change End Date' : 'Set End Date', emojis.calendar || emojis.edit), btn(`move|${key}`, `Move to ${d._sec === 'new' ? 'Returning' : 'New'}`, d._sec === 'new' ? emojis.returningDraws : emojis.newDraws), btn(`del|${key}`, 'Delete', emojis.deleteBin, 4)),
        row(...(back ? [btn(`list|${back}|0`, STATUS[back]?.label || 'Back', emojis.returnArrow)] : [btn(`list|${d._sec}|0`, `${secWord(d)} Draws`, emojis.returnArrow)]), home()),
    );
    return panel(components);
}

function resultView({ crumbs = [], title, body = [], back = 'page', backLabel = 'Back', ok = true, extraButtons = [] }) {
    return panel([
        ...(crumbs.length ? [text(crumb(...crumbs))] : []),
        text(`### ${ok === 'warn' ? emojis.warn : ok ? emojis.checkmark : emojis.cross} ${title}`),
        ...(body.length ? [SMALL(), text(body.join('\n').slice(0, 3800))] : []),
        BIG(),
        row(...extraButtons, btn(back, backLabel, emojis.returnArrow), ...(back === 'page' ? [] : [home()])),
    ]);
}

// ---------- Select ----------
async function selectView(token, note = null, page = 0) {
    const s = SEL.get(token);
    if (!s) return resultView({ title: 'That list expired. Select again.', ok: false, back: 'select', backLabel: 'Select Draws' });
    const doc = await getDoc();
    const byKey = new Map(allDraws(doc).map(d => [d._key, d]));
    const pages = Math.max(1, Math.ceil(s.keys.length / PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = s.keys.slice(pg * PAGE, pg * PAGE + PAGE).filter(k => byKey.has(k));
    const n = s.keys.filter(k => s.selected.has(k)).length;
    const components = [text(`${crumb('Select Draws')}\n## ${emojis.filter} Select Draws${s.query.length ? `\n-# ${s.query.map(q => `\`${q}\``).join(' · ').slice(0, 500)}` : ''}`), BIG()];
    if (!s.keys.length) {
        components.push(text(`${emojis.cross} **No draws found.** Try fewer words or a quick pick.`), BIG(), row(btn('select', 'Search Again', emojis.gunsmithSearch, 1), home()));
        return panel(components);
    }
    components.push(
        text(`-# **${s.keys.length}** found · **${n}** selected${pages > 1 ? ` · page ${pg + 1} of ${pages}` : ''}`),
        text(shown.map(k => { const d = byKey.get(k); return `${s.selected.has(k) ? emojis.check : emojis.smallDot} ${dot(d)} **${d.title}**\n-# ${emojis.blank}${emojis.blank} ${secWord(d)} · ${stateWords(d)}`; }).join('\n').slice(0, 3900)),
        SMALL(),
        { type: 1, components: [{ type: 3, custom_id: `${PREFIX}flip|${token}|${pg}`, min_values: 1, max_values: shown.length, placeholder: 'Select or unselect draws…', options: shown.map(k => { const d = byKey.get(k); return { label: d.title.slice(0, 100), value: k, description: `${s.selected.has(k) ? 'Selected' : 'Not selected'} · ${secWord(d)}` }; }) }] },
        ...(pages > 1 ? [row({ type: 2, style: 2, custom_id: `${PREFIX}slist|${token}|${pg - 1}`, emoji: emojis.parseEmoji(emojis.left), disabled: pg === 0 }, { type: 2, style: 2, label: `Page ${pg + 1} / ${pages}`, custom_id: `${PREFIX}spg`, disabled: true }, { type: 2, style: 2, custom_id: `${PREFIX}slist|${token}|${pg + 1}`, emoji: emojis.parseEmoji(emojis.right), disabled: pg === pages - 1 })] : []),
        row(btn(`sall|${token}|${pg}`, `Select All ${s.keys.length}`, emojis.checkmark, 2, n === s.keys.length), btn(`snone|${token}|${pg}`, 'Clear', emojis.cross, 2, !n)),
    );
    if (note) components.push(text(note));
    components.push(
        BIG(),
        text(n ? `-# With the **${n}** selected…` : '-# Select draws to edit, export or delete them…'),
        row(btn(`tedit|${token}`, `Edit ${n || ''}`.trim(), emojis.edit, 1, !n), btn(`texp|${token}`, `Export ${n || ''}`.trim(), emojis.copyExport, 2, !n), btn(`tdel|${token}`, `Delete ${n || ''}`.trim(), emojis.deleteBin, 4, !n)),
        row(btn('select', 'Search Again', emojis.gunsmithSearch), home()),
    );
    return panel(components);
}

// ---------- pop-ups ----------
const labelled = (label, component, description) => ({ type: 18, label, ...(description ? { description } : {}), component });
const reId = (modal, id, title) => { const j = modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal)); j.custom_id = `${PREFIX}${id}`; if (title) j.title = title.slice(0, 45); return j; };
const QUICK = Object.entries(STATUS).map(([value, s]) => ({ value, label: `All ${s.label}` }));
const quickSelect = () => ({ type: 3, custom_id: 'picks', required: false, min_values: 0, max_values: QUICK.length, placeholder: 'Pick any', options: QUICK });
const titlesBox = () => labelled('Draw titles', { type: 4, custom_id: 'names', style: 2, required: false, max_length: 2000, placeholder: 'Sapphire Winter\nWhorl of Midnight' }, 'One per line, part of a title is enough. Added to the quick picks.');
const searchModal = () => ({ custom_id: `${PREFIX}findm`, title: 'Find a Draw', components: [labelled('Title', { type: 4, custom_id: 'q', style: 1, required: true, max_length: 100, placeholder: 'sapphire' }, 'Part of the title is enough')] });
const selectModal = () => ({ custom_id: `${PREFIX}selectm`, title: 'Select Draws', components: [titlesBox(), labelled('Quick picks', quickSelect(), 'Everything picked is included: New + Ended = both.')] });
function exportModal() {
    return {
        custom_id: `${PREFIX}exportm`, title: 'Export Draws',
        components: [
            titlesBox(),
            labelled('Quick picks', quickSelect(), 'Leave both empty for every draw.'),
            labelled('Send to', { type: 21, custom_id: 'dest', required: true, options: [{ value: 'file', label: 'A file here', default: true }, { value: 'dm', label: 'A DM to me' }] }),
            labelled('Include', { type: 22, custom_id: 'include', required: false, min_values: 0, max_values: 3, options: [['end', 'End dates'], ['image', 'Image URL'], ['type', 'Draw type']].map(([value, label]) => ({ value, label, default: true })) }),
        ],
    };
}
const field = (i, id) => { try { const f = i.fields.getField(id); return f?.value ?? f?.values ?? null; } catch { return null; } };

function resolveKeys(doc, names, picks) {
    const all = allDraws(doc);
    const keys = new Set();
    for (const p of picks || []) if (STATUS[p]) all.filter(STATUS[p].test).forEach(d => keys.add(d._key));
    const unmatched = [];
    for (const line of String(names || '').split('\n').map(x => x.trim()).filter(Boolean)) {
        const words = line.toLowerCase().split(/\s+/);
        const hits = all.filter(d => words.every(w => d.title.toLowerCase().includes(w)));
        if (!hits.length) unmatched.push(line);
        hits.forEach(d => keys.add(d._key));
    }
    return { keys: [...keys], unmatched };
}

// What a pasted or edited draw list would do, title by title, against the draws saved now.
function previewDraws(doc, newText, retText) {
    const { parseBulkDrawList } = require('../utils/adminParser');
    const { bestDrawMatch } = require('../utils/search');
    const out = { added: [], changed: [], same: [] };
    for (const [sec, raw] of [['new', newText], ['returning', retText]]) {
        if (!String(raw || '').trim()) continue;
        // FOUND BY THIS MOCK: the export writes Cloudinary URLs with `f_auto,q_auto`, and Add Multiple splits lines on commas, so its own export does not paste back (the date field becomes the URL's tail and the line is skipped). The mock masks the comma here; the real build fixes the parser or the export.
        const parsed = parseBulkDrawList(String(raw).replace(/f_auto,q_auto/g, 'f_auto%2Cq_auto'));
        const list = Array.isArray(parsed) ? parsed : (parsed.parsed || parsed.draws || []);
        const stored = doc[sec === 'new' ? 'newDraws' : 'returningDraws'] || [];
        for (const p of list) {
            const old = bestDrawMatch(stored, p.title);
            const label = `${sec === 'new' ? emojis.newDraws : emojis.returningDraws} ${p.title}`;
            if (!old) { out.added.push(label); continue; }
            const diff = [];
            if (new Date(old.date).getTime() !== new Date(p.date).getTime()) diff.push('date');
            if ((old.items || []).map(i => `${i.tier}${i.name}`).join('|') !== (p.items || []).map(i => `${i.tier}${i.name}`).join('|')) diff.push('items');
            if ((p.thumbnailUrl || '') && p.thumbnailUrl.replace(/%2C/g, ',') !== old.thumbnailUrl) diff.push('image');
            (diff.length ? out.changed : out.same).push(diff.length ? `${label} · *${diff.join(', ')}*` : p.title);
        }
    }
    const parts = [];
    if (out.added.length) parts.push(`${emojis.mngAdd} **Added · ${out.added.length}**`, ...out.added.map(x => `- ${x}`), '');
    if (out.changed.length) parts.push(`${emojis.mngBulkReplace} **Changed · ${out.changed.length}**`, ...out.changed.map(x => `- ${x}`), '');
    if (out.same.length) parts.push(`-# Unchanged · ${out.same.length}: ${out.same.join(', ').slice(0, 600)}`, '');
    parts.push('-# Nothing is saved until you press Save.');
    return { parts, count: out.added.length + out.changed.length, total: out.added.length + out.changed.length + out.same.length };
}

// ---------- answering ----------
async function show(interaction, components) {
    if (!interaction.deferred && !interaction.replied) {
        if (interaction.isChatInputCommand?.() || (interaction.isModalSubmit?.() && !interaction.message)) await interaction.deferReply({ flags: 64 });
        else await interaction.deferUpdate();
    }
    return sendV2Payload(interaction, components, { skipExpiry: true });
}

// ---------- the slash command ----------
async function openFromSlash(interaction) {
    const o = interaction.options;
    const drawKey = o.getString('draw'), act = o.getString('do'), list = o.getString('show');
    const manage = require('../commands/manage');
    if (act === 'quickadd') return interaction.showModal(reId(manage.buildQuickAddModal(), 'qam'));
    if (act === 'addnew' || act === 'addreturning') return interaction.showModal(reId(manage.buildAddDrawModal(act === 'addnew' ? 'new' : 'returning'), `addm|${act}`));
    if (act === 'paste') return interaction.showModal(reId(manage.buildBulkBothDrawsModal('add'), 'pastem', 'Paste Draws'));
    if (act === 'export') return interaction.showModal(exportModal());
    if (drawKey) {
        const doc = await getDoc();
        let key = drawKey;
        if (!findKey(doc, key)) { const { keys } = resolveKeys(doc, drawKey, []); if (keys.length !== 1) return show(interaction, await pageView(`${emojis.cross} ${keys.length ? `${keys.length} draws match` : 'No draw matches'} \`${drawKey.slice(0, 60)}\`.`)); key = keys[0]; }
        if (act === 'edit' || act === 'end') return route({ ...interaction, customId: `${PREFIX}${act}|${key}` }, interaction, act, key);
        if (act === 'move' || act === 'delete') return show(interaction, await confirmCard(act === 'move' ? 'move' : 'del', key));
        return show(interaction, await cardView(key));
    }
    if (list) return show(interaction, await listView(list));
    if (act) return show(interaction, await pageView(`${emojis.warn} That needs a \`draw:\` to act on.`));
    return show(interaction, await pageView());
}

async function autocomplete(interaction) {
    const q = String(interaction.options.getFocused() || '').toLowerCase();
    const doc = await getDoc();
    const words = q.split(/\s+/).filter(Boolean);
    const hits = allDraws(doc).filter(d => words.every(w => d.title.toLowerCase().includes(w))).slice(0, 25);
    return interaction.respond(hits.map(d => ({ name: `${d.title} · ${secWord(d)}`.slice(0, 100), value: d._key })));
}

async function confirmCard(kind, key) {
    const doc = await getDoc();
    const d = findKey(doc, key);
    if (!d) return pageView(`${emojis.cross} That draw no longer exists.`);
    const q = kind === 'move' ? `### ${emojis.warn} Move ${d.title} to ${d._sec === 'new' ? 'Returning' : 'New'} Draws?\n-# Its items, picture and end date go with it.` : `### ${emojis.warn} Delete ${d.title}?\n-# Its /calendar row stays; every change can be reverted.`;
    return cardView(key, q, [row(btn(`${kind}ok|${key}`, kind === 'move' ? 'Yes, Move' : 'Yes, Delete', kind === 'move' ? emojis.checkmark : emojis.deleteBin, kind === 'move' ? 3 : 4), btn(`card|${key}`, 'Cancel', emojis.returnArrow))]);
}

// ---------- routing ----------
async function route(fake, interaction = fake, verbOverride = null, aOverride = null) {
    const [, verb0, a0, b0] = String(fake.customId).split('|');
    const verb = verbOverride || verb0, a = aOverride || a0, b = b0;
    const manage = require('../commands/manage');

    if (verb === 'page') return show(interaction, await pageView());
    if (verb === 'browse') return show(interaction, await listView(interaction.values[0]));
    if (verb === 'list') return show(interaction, await listView(a, b));
    if (verb === 'open') return show(interaction, await cardView(interaction.values[0], null, null, a));
    if (verb === 'card') return show(interaction, await cardView(a));
    if (verb === 'find') return interaction.showModal(searchModal());
    if (verb === 'select') return interaction.showModal(selectModal());
    if (verb === 'export') return interaction.showModal(exportModal());
    if (verb === 'guide') {
        const action = require('../utils/manageActions').ACTIONS_BY_PAGE.draws.find(x => x.id === 'formatguide');
        return action.run({ interaction, page: 'draws', manageCommand: manage });
    }
    if (verb === 'quickadd') return interaction.showModal(reId(manage.buildQuickAddModal(), 'qam'));
    if (verb === 'addnew' || verb === 'addreturning') return interaction.showModal(reId(manage.buildAddDrawModal(verb === 'addnew' ? 'new' : 'returning'), `addm|${verb}`));
    if (verb === 'paste') {
        const modal = reId(manage.buildBulkBothDrawsModal('add'), 'pastem', 'Paste Draws');
        const last = a ? PASTE.get(a) : null;
        if (last) for (const r of modal.components) for (const c of [...(r.components || []), ...(r.component ? [r.component] : [])]) { if (c.custom_id === 'new_text') c.value = last.newText; if (c.custom_id === 'returning_text') c.value = last.retText; }
        return interaction.showModal(modal);
    }
    if (verb === 'purge') return show(interaction, resultView({ ok: 'warn', title: 'Purge which draws?', body: ['-# For the end of a season. Every purge can be reverted.'], back: 'page', backLabel: 'Cancel', extraButtons: [btn('purgeok|new', 'New Only', emojis.newDraws, 4), btn('purgeok|returning', 'Returning Only', emojis.returningDraws, 4), btn('purgeok|all', 'All Draws', emojis.deleteBin, 4)] }));
    if (verb === 'purgeok') return show(interaction, resultView({ ok: 'warn', title: `Would purge ${a === 'all' ? 'every draw' : `every ${a} draw`}`, body: ['-# Nothing was purged.'] }));

    // One draw
    if (verb === 'edit') {
        const doc = await getDoc();
        const d = findKey(doc, a);
        if (!d) return show(interaction, await pageView(`${emojis.cross} That draw no longer exists.`));
        return interaction.showModal(reId(manage.buildEditDrawModal(d, String(d._id), d._sec, rowFor(doc)(d)), `editm|${a}`, `Edit ${d.title}`));
    }
    if (verb === 'end') {
        const doc = await getDoc();
        const d = findKey(doc, a);
        if (!d) return show(interaction, await pageView(`${emojis.cross} That draw no longer exists.`));
        const r = rowFor(doc)(d);
        const { formatAdminDate } = require('../utils/adminParser');
        const modal = r ? manage.buildEditCalendarModal(r, String(r._id)) : manage.buildCalendarAddModal({ title: d.title, startDate: d.date ? formatAdminDate(new Date(d.date)) : '', endDate: '' });
        return interaction.showModal(reId(modal, `endm|${a}`, `End Date: ${d.title}`));
    }
    if (verb === 'move' || verb === 'del') return show(interaction, await confirmCard(verb, a));
    if (verb === 'moveok' || verb === 'delok') {
        const doc = await getDoc();
        const d = findKey(doc, a);
        return show(interaction, resultView({ ok: 'warn', crumbs: d ? [`${secWord(d)} Draws`] : [], title: `Would ${verb === 'moveok' ? `move ${d?.title} to ${d?._sec === 'new' ? 'Returning' : 'New'}` : `delete ${d?.title}`}`, body: ['-# Nothing was changed.'], back: `list|${d?._sec || 'new'}|0`, backLabel: d ? `${secWord(d)} Draws` : 'Back' }));
    }

    // Select
    if (verb === 'sellist') {
        const doc = await getDoc();
        const { keys } = resolveKeys(doc, '', [a]);
        const token = newToken();
        SEL.set(token, { keys, selected: new Set(), query: [`All ${STATUS[a]?.label}`] });
        return show(interaction, await selectView(token));
    }
    if (verb === 'flip') { const s = SEL.get(a); if (s) for (const v of interaction.values) { if (s.selected.has(v)) s.selected.delete(v); else s.selected.add(v); } return show(interaction, await selectView(a, null, b)); }
    if (verb === 'sall' || verb === 'snone') { const s = SEL.get(a); if (s) s.selected = verb === 'sall' ? new Set(s.keys) : new Set(); return show(interaction, await selectView(a, null, b)); }
    if (verb === 'slist') return show(interaction, await selectView(a, null, b));
    if (verb === 'tedit') {
        const s = SEL.get(a);
        if (!s) return show(interaction, await selectView(a));
        const doc = await getDoc();
        const fmt = require('../utils/adminParser').formatDrawsAsBulkText;
        const pick = allDraws(doc).filter(d => s.selected.has(d._key));
        const modal = reId(manage.buildBulkBothDrawsModal('replace'), `teditm|${a}`, `Edit ${plural(pick.length, 'Draw')}`);
        const newText = fmt(pick.filter(d => d._sec === 'new'), rowFor(doc)), retText = fmt(pick.filter(d => d._sec === 'returning'), rowFor(doc));
        for (const r of modal.components) for (const c of [...(r.components || []), ...(r.component ? [r.component] : [])]) { if (c.custom_id === 'new_text') c.value = String(newText).slice(0, 4000); if (c.custom_id === 'returning_text') c.value = String(retText).slice(0, 4000); }
        return interaction.showModal(modal);
    }
    if (verb === 'texp') {
        const s = SEL.get(a);
        const doc = await getDoc();
        const pick = allDraws(doc).filter(d => s?.selected.has(d._key));
        const fmt = require('../utils/adminParser').formatDrawsAsBulkText;
        const body = `New Draws\n${fmt(pick.filter(d => d._sec === 'new'), rowFor(doc))}\n\nReturning Draws\n${fmt(pick.filter(d => d._sec === 'returning'), rowFor(doc))}`;
        return interaction.reply({ content: `${emojis.copyExport} **${pick.length}** draws`, files: [{ attachment: Buffer.from(body, 'utf-8'), name: 'draws.txt' }], flags: 64 });
    }
    if (verb === 'tdel') {
        const s = SEL.get(a);
        const doc = await getDoc();
        const pick = allDraws(doc).filter(d => s?.selected.has(d._key));
        return show(interaction, resultView({ ok: 'warn', crumbs: ['Select Draws'], title: `Delete ${plural(pick.length, 'draw')}?`, body: [...pick.slice(0, 20).map(d => `- ${dot(d)} ${d.title} · ${secWord(d)}`), ...(pick.length > 20 ? [`-# …and ${pick.length - 20} more`] : []), '', '-# Every change is recorded and can be reverted.'], back: `slist|${a}|0`, backLabel: 'Cancel', extraButtons: [btn(`tdelok|${a}`, `Yes, Delete ${pick.length}`, emojis.deleteBin, 4)] }));
    }
    if (verb === 'tdelok') return show(interaction, resultView({ ok: 'warn', crumbs: ['Select Draws'], title: 'Would delete those draws', body: ['-# Nothing was deleted.'], back: `slist|${a}|0`, backLabel: 'Back to List' }));

    // Pop-up submits
    if (verb === 'findm') {
        const doc = await getDoc();
        const q = interaction.fields.getTextInputValue('q');
        const { keys } = resolveKeys(doc, q, []);
        if (!keys.length) return show(interaction, await pageView(`${emojis.cross} No draw matches \`${q.slice(0, 60)}\`.`));
        if (keys.length === 1) return show(interaction, await cardView(keys[0]));
        const byKey = new Map(allDraws(doc).map(d => [d._key, d]));
        return show(interaction, panel([text(`${crumb('Search')}\n## ${emojis.gunsmithSearch} ${keys.length} draws match \`${q.slice(0, 60)}\``), BIG(), { type: 1, components: [{ type: 3, custom_id: `${PREFIX}open|`, placeholder: 'Pick a draw', options: keys.slice(0, 25).map(k => ({ label: byKey.get(k).title.slice(0, 100), value: k, description: secWord(byKey.get(k)) })) }] }, SMALL(), row(btn('find', 'Search Again', emojis.gunsmithSearch), home())]));
    }
    if (verb === 'selectm') {
        const doc = await getDoc();
        const names = field(interaction, 'names') || '';
        const picks = field(interaction, 'picks') || [];
        const { keys, unmatched } = resolveKeys(doc, names, picks);
        const token = newToken();
        SEL.set(token, { keys, selected: new Set(), query: [...names.split('\n').map(x => x.trim()).filter(Boolean), ...picks.map(p => `All ${STATUS[p]?.label}`)] });
        return show(interaction, await selectView(token, unmatched.length ? `-# ${emojis.warn} Nothing matched ${unmatched.map(x => `\`${x}\``).join(', ')}` : null));
    }
    if (verb === 'exportm') {
        const doc = await getDoc();
        const names = field(interaction, 'names') || '';
        const picks = field(interaction, 'picks') || [];
        const include = [].concat(field(interaction, 'include') || []);
        const dest = [].concat(field(interaction, 'dest') || 'file')[0];
        const { keys } = names.trim() || picks.length ? resolveKeys(doc, names, picks) : { keys: allDraws(doc).map(d => d._key) };
        const pick = allDraws(doc).filter(d => keys.includes(d._key)).map(d => ({ ...d, thumbnailUrl: include.includes('image') ? d.thumbnailUrl : '' }));
        const fmt = require('../utils/adminParser').formatDrawsAsBulkText;
        const rf = include.includes('end') ? rowFor(doc) : null;
        const body = `New Draws\n${fmt(pick.filter(d => d._sec === 'new'), rf)}\n\nReturning Draws\n${fmt(pick.filter(d => d._sec === 'returning'), rf)}`;
        const file = { attachment: Buffer.from(body, 'utf-8'), name: 'draws.txt' };
        if (dest === 'dm') { await interaction.user.send({ content: `${pick.length} draws`, files: [file] }); return interaction.reply({ content: `${emojis.checkmark} Sent to your DMs.`, flags: 64 }); }
        return interaction.reply({ content: `${emojis.copyExport} **${pick.length}** draws`, files: [file], flags: 64 });
    }
    if (verb === 'pastem' || verb === 'teditm') {
        const doc = await getDoc();
        const newText = field(interaction, 'new_text') || '', retText = field(interaction, 'returning_text') || '';
        const token = newToken();
        PASTE.set(token, { newText, retText });
        const pv = previewDraws(doc, newText, retText);
        const isEdit = verb === 'teditm';
        return show(interaction, resultView({ ok: true, crumbs: isEdit ? ['Select Draws', 'Edit'] : ['Paste'], title: `${isEdit ? 'Edit' : 'Paste'} preview · ${pv.count} of ${pv.total} to save`, body: pv.parts, back: isEdit ? `tedit|${a}` : `paste|${token}`, backLabel: isEdit ? 'Edit Again' : 'Edit Paste', extraButtons: pv.count ? [btn('saveok', `Save ${pv.count}`, emojis.checkmark, 3)] : [] }));
    }
    if (verb === 'saveok') return show(interaction, resultView({ title: 'Would save those draws', body: ['-# Nothing was saved. The real Save is today\'s Add Multiple, with the picture caching and item kinds it already does.'] }));
    if (verb === 'qam') return show(interaction, resultView({ title: 'Would open the Quick Add draft', body: ['-# The real one is today\'s Quick Add draft: each line matched against the draw index, with Edit and Pick per row, then Save.'] }));
    if (verb === 'addm') return show(interaction, resultView({ title: `Would add that ${a === 'addnew' ? 'new' : 'returning'} draw`, body: ['-# Nothing was saved. The real save is today\'s Add Draw, unchanged.'] }));
    if (verb === 'editm') return show(interaction, await cardView(a, `### ${emojis.checkmark} Would update this draw\n-# Nothing was saved. The real save is today's Edit Draw, with the result and Revert under it.`));
    if (verb === 'endm') return show(interaction, await cardView(a, `### ${emojis.checkmark} Would save the end date\n-# Nothing was saved. The real save is /manage's calendar box, unchanged.`));
    return show(interaction, await pageView(`${emojis.warn} The mock-up has no \`${verb}\` yet.`));
}

async function handleMockDrawsInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith('mockd|')) return false;
    if (!isOwner(interaction.user.id)) {
        try { await interaction.reply({ content: '🔒 The mock-up is for the owner.', flags: 64 }); } catch (e) { console.error('mockdraws: refusal failed', e.message); }
        return true;
    }
    try { await route(interaction); }
    catch (e) {
        console.error('mockdraws:', interaction.customId, e);
        const msg = `${emojis.cross} Mock-up error on \`${interaction.customId.slice(0, 60)}\`: ${String(e.message).slice(0, 300)}`;
        try { if (interaction.deferred || interaction.replied) await interaction.followUp({ content: msg, flags: 64 }); else await interaction.reply({ content: msg, flags: 64 }); } catch (n) { console.error('mockdraws: could not report', n.message); }
    }
    return true;
}

const OWNED_PREFIXES = [PREFIX];
// One exported function, as scripts/handlerRouting.test.js requires of every handler; the command reaches the rest through `mock`.
module.exports = { handleMockDrawsInteraction, OWNED_PREFIXES, mock: { openFromSlash, autocomplete, pageView, listView, cardView, selectView, previewDraws, resolveKeys, allDraws, getDoc, SEL, PREFIX } };
