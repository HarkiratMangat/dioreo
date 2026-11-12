// ==========================================
// /manage gunsmith — builds as paste text: Edit N, the preview, Export
// ==========================================
// Part of the /manage gunsmith rehaul (2026-11-07 14:07 EST, local/project/features/manage-rehaul/spec.md). Reads only: Save hands the kept text to handlers/manage/loadouts.js bulkAddLoadouts, the same save Paste Builds has always used, so the ChangeLog, Revert and the catalogue/code warnings are unchanged.
//
// The text is the bulk paste format (utils/adminParser.js formatLoadoutsAsBulkText / parseBulkLoadoutList): one block per build, blocks split by a blank line, an option of a merged build as its own `Build: Build 2b` block.

const Loadout = () => require('../../../models/Loadout');
const emojis = require('../../../utils/emojiMap');
const { splitKey, classIcon } = require('./search');

// A long list in a result shows its first 20 and how many more, so a 134-build delete still fits Discord's 4,000-character text block.
const capList = (lines, max = 20) => (lines.length > max ? [...lines.slice(0, max), `-# …and ${lines.length - max} more`] : lines);

// Entry keys as paste blocks, in key order. One database read.
async function keyBlocks(keys) {
    keys = require('./search').collapseKeys(keys); // a whole build already writes its options' blocks
    const { buildNumberOf } = require('../../../utils/loadoutForm');
    const { variantView } = require('../../../utils/loadoutRender');
    const fmt = require('../../../utils/adminParser').formatLoadoutsAsBulkText;
    const ids = [...new Set(keys.map(k => splitKey(k).id))].filter(id => /^[0-9a-f]{24}$/.test(id));
    const docs = new Map((await Loadout().find({ _id: { $in: ids } }).lean()).map(d => [String(d._id), d]));
    const out = [];
    for (const key of keys) {
        const { id, opt } = splitKey(key);
        const d = docs.get(id);
        if (!d) continue;
        if (opt === null) { out.push(fmt([d])); continue; }
        if (opt === 0) { out.push(fmt([{ ...d, variants: [] }])); continue; }
        const v = variantView(d, opt);
        const lines = [`${d.weaponName} | ${d.category}`, `Build: Build ${buildNumberOf(d.buildName)}${String.fromCharCode(97 + opt)}`];
        if (v.imageKey && !String(v.imageKey).startsWith('http')) lines.push(`Image: ${v.imageKey}`);
        if (v.shareCode) lines.push(`Code: ${v.shareCode}`);
        if (d.variants[opt - 1]?.label) lines.push(`Label: ${d.variants[opt - 1].label}`);
        lines.push(...(v.attachments || []).map(x => `- ${x}`));
        out.push(lines.join('\n'));
    }
    return out;
}

// A pop-up whose boxes hold paste blocks: up to 5 boxes of 4,000 characters, split between builds. Null when the blocks do not fit (his "edit 3 should open them as a large text field", 13:13 EST).
function blocksModal(customId, title, blocks) {
    const boxes = [];
    for (const b of blocks) {
        const lastBox = boxes[boxes.length - 1];
        if (lastBox && (`${lastBox.text}\n\n${b}`).length <= 4000) { lastBox.text += `\n\n${b}`; lastBox.n += 1; }
        else if (b.length <= 4000) boxes.push({ text: b, n: 1 });
        else return null;
    }
    if (!boxes.length || boxes.length > 5) return null;
    let start = 1;
    const components = boxes.map((box, i) => {
        const label = box.n === 1 ? `Build ${start}` : `Builds ${start}–${start + box.n - 1}`;
        start += box.n;
        return { type: 18, label, ...(i === 0 ? { description: 'Change anything; a build you leave as it is stays as it is.' } : {}), component: { type: 4, custom_id: `b${i}`, style: 2, required: false, max_length: 4000, value: box.text } };
    });
    return { custom_id: customId, title: title.slice(0, 45), components };
}

// How many of these blocks one Edit pop-up holds, packing in order (about 66 to 90 builds at today's sizes).
function fitCount(blocks) {
    let fit = 0;
    for (let k = 1; k <= blocks.length && blocksModal('x', 'x', blocks.slice(0, k)); k++) fit = k;
    return fit;
}

// What the boxes of a blocks pop-up hold, joined.
const readBoxes = (interaction) => [0, 1, 2, 3, 4].map(k => { try { return interaction.fields.getTextInputValue(`b${k}`) || ''; } catch { return ''; } }).filter(x => x.trim()).join('\n\n');

// The preview for pasted or edited text, shared by Paste and Select's Edit. Each blank-line block is compared with the build (or the option) it names; an option block with its option, not its build. `keep` is the text of every block that adds or changes something, which is all Save sends, so an Edit N left as it was saves nothing (spec: "Edit N with no change saves nothing").
async function previewBlocks(mode, raw) {
    const { variantView } = require('../../../utils/loadoutRender');
    const { parseBulkLoadoutList, loadoutBadgeTokens: tok } = require('../../../utils/adminParser');
    const chunks = String(raw || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
    const parsedAll = chunks.map(c => ({ chunk: c, ...parseBulkLoadoutList(c) }));
    const weaponKeys = [...new Set(parsedAll.flatMap(p => p.parsed.map(e => e.weaponKey)))];
    const stored = await Loadout().find({ mode, weaponKey: { $in: weaponKeys } }).lean();
    const added = [], changed = [], same = [], problems = [], keep = [];
    let total = 0;
    for (const { chunk, parsed, errors } of parsedAll) {
        let moves = errors.length > 0;
        for (const x of errors) problems.push(typeof x === 'string' ? x : (x.message || JSON.stringify(x)));
        for (const e of parsed) {
            total += 1;
            const m = /(\d+)([a-z])?$/i.exec(e.buildName || '');
            const base = m ? `Build ${m[1]}` : null;
            const opt = m && m[2] ? m[2].toLowerCase().charCodeAt(0) - 97 : 0;
            const shown = base ? `${m[1]}${opt ? m[2].toLowerCase() : ''}` : 'next #';
            const name = `${classIcon(e.category)} ${e.weaponName} · ${shown}`;
            const old = base ? stored.find(s => s.weaponKey === e.weaponKey && s.buildName === base) : null;
            if (!old || opt > (old.variants || []).length) { added.push(name); moves = true; continue; }
            const cmp = opt ? variantView(old, opt) : old;
            const diff = [];
            if (mode === 'MP' && e.shareCode && e.shareCode !== cmp.shareCode) diff.push('code');
            if ((e.attachments || []).join('|') !== (cmp.attachments || []).join('|')) diff.push('attachments');
            if (!opt && tok({ ...e, mode }).join(',') !== tok(old).join(',')) diff.push('badges');
            if (!(e.defaulted || []).includes('label') && (e.label || '') !== ((opt ? old.variants[opt - 1]?.label : old.label) || '')) diff.push('label');
            if (e.comment !== undefined && !(e.defaulted || []).includes('comment') && (e.comment || '') !== (old.comment || '')) diff.push('comment');
            if (diff.length) { changed.push(`${name} · *${diff.join(', ')}*`); moves = true; }
            else same.push(`${e.weaponName} · ${shown}`);
        }
        if (moves) keep.push(chunk);
    }
    const parts = [];
    if (added.length) parts.push(`${emojis.mngAdd} **Added · ${added.length}**`, ...capList(added.map(x => `- ${x}`), 25), '');
    if (changed.length) parts.push(`${emojis.mngBulkReplace} **Changed · ${changed.length}**`, ...capList(changed.map(x => `- ${x}`), 25), '');
    if (same.length) parts.push(`-# Unchanged · ${same.length}: ${same.slice(0, 30).join(', ')}${same.length > 30 ? ` …and ${same.length - 30} more` : ''}`, '');
    if (problems.length) parts.push(`${emojis.warn} **Problems · ${problems.length}**`, ...capList(problems.map(x => `- ${x}`), 10), '');
    // A preview where nothing changed says so, and has no Save to press (2026-11-11 17:03 EST: it read "Nothing is saved until you press Save" with no Save button, under a green check).
    parts.push((added.length + changed.length) ? '-# Nothing is saved until you press Save.' : '-# Nothing changed, so there is nothing to save.');
    return { parts, count: added.length + changed.length, problems: problems.length, total, keep: keep.join('\n\n') };
}

// Export: the builds as paste text, with the fields the Include list keeps and merged builds handled the chosen way.
function exportText(mode, builds, { include = ['code', 'label', 'badges', 'comment', 'image'], merged = 'keep' } = {}) {
    const { variantView } = require('../../../utils/loadoutRender');
    const L = require('../../../utils/loadoutOptions').optionLetter;
    let docs = builds;
    if (merged === 'first') docs = builds.map(b => ({ ...b, variants: [] }));
    if (merged === 'split') docs = builds.flatMap(b => [{ ...b, variants: [] }, ...(b.variants || []).map((_, i) => ({ ...variantView(b, i + 1), variants: [], buildName: `${b.buildName} · Option ${L(i + 1)}`, label: b.variants[i].label || b.label }))]);
    const drop = { code: /^Code: /, label: /^Label: /, badges: /^Badges: /, comment: /^Comment: /, image: /^Image: / };
    return require('../../../utils/adminParser').formatLoadoutsAsBulkText(docs).split('\n\n').map(block => {
        let lines = block.split('\n').filter(l => !Object.entries(drop).some(([k, re]) => !include.includes(k) && re.test(l)));
        if (include.includes('mode')) lines = [lines[0], `Mode: ${mode}`, ...lines.slice(1)];
        return lines.join('\n');
    }).join('\n\n');
}

module.exports = { capList, keyBlocks, blocksModal, fitCount, readBoxes, previewBlocks, exportText };
