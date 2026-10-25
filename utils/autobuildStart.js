// utils/autobuildStart.js -- the form a bare /autobuild opens (Harkirat's /autobuild review, 2026-10-25 11:40-12:03 EDT). The slash options are for ONE build ("let's make the slash command options method for a singular gunsmith creation. and if bulk /autobuild, then just via the /autobuild command"); several screenshots and links come in through this form instead, straight away with no panel first ("sure makes sense", 11:47 EDT).
//
// FOUR FIELDS, his layout:
// - Screenshots: Discord's modal file upload (component type 19, inside a Label, type 18), up to 10.
// - Links: one per line, each optionally followed by its preset ("the overrides per url can be directly after the url", 12:00 EDT).
// - Screenshot presets: one line per screenshot by its number, `1. mp, lmg` (11:58 EDT: "it would take the 1st uploaded screenshot and manually apply mode mp, category lmg").
// - Retry token: the token a failed image upload hands out ("so its not just contrainted as an option in the slash command", 12:02 EDT); the failed-upload message's Re-upload button opens this form with it filled in.
//
// A PRESET sets only what it names; the rest is read from the screenshot as usual ("assume i didn't mention mp, sniper and only mentioned meta/best it would just overide the badges?", 12:01 EDT). Each word is told apart by what it is, in any order, with commas, slashes and spaces all separating (12:02 EDT: "meta, best vs meta/best vs meta,best would all work?"). A word nothing recognises, or a number with no screenshot, is shown on a review page, never dropped silently.
//
// ⚠️ NOT VERIFIED: that Discord hands uploaded files back in the order they were picked. Each review page names its screenshot's number and file name, so a mismatch shows.
const { resolveCategorySynonyms, categoryByExactAlias } = require('./search');
const { parseLoadoutBadges } = require('./adminParser');

const MAX_IMAGES = 10;
const MODAL_ID = 'autobuild_start';

const label = (text, description, component) => ({ type: 18, label: text, description, component });

// The form. `retryToken` pre-fills the last field (the Re-upload button). Every description and placeholder is within Discord's 100 characters.
function buildStartModal(retryToken = '') {
    return {
        custom_id: MODAL_ID,
        title: 'Autobuild Gunsmiths',
        components: [
            label('Screenshots', `Up to ${MAX_IMAGES} Gunsmith screenshots, read in one batch`, { type: 19, custom_id: 'shots', min_values: 0, max_values: MAX_IMAGES, required: false }),
            label('Links', 'One per line; a preset may follow the link', { type: 4, custom_id: 'links', style: 2, required: false, max_length: 4000, placeholder: 'https://… mp, sniper\nhttps://… meta/best' }),
            label('Screenshot presets', 'One line per screenshot, by its number: mode, category, badges', { type: 4, custom_id: 'presets', style: 2, required: false, max_length: 2000, placeholder: '1. mp, lmg\n5. smg, meta/toxic/best' }),
            label('Retry token', 'Only after a failed image upload; re-sends the one image above', { type: 4, custom_id: 'retry', style: 1, required: false, max_length: 40, ...(retryToken ? { value: retryToken } : {}) }),
        ],
    };
}

// Is this word a badge? parseLoadoutBadges is the one place badge words are defined, so a word counts when it parses with nothing left over.
function isBadgeWord(word) {
    const parsed = parseLoadoutBadges(word);
    return parsed.unrecognized.length === 0;
}

// One preset, e.g. "mp, assault rifle, meta/best". Returns { mode, category, badges, unknown }: badges as the comma list the Badges field takes, unknown as the words nothing recognised.
function parsePreset(text) {
    const words = String(text || '').toLowerCase().split(/[\s,/]+/).filter(Boolean);
    const preset = { mode: null, category: null, badges: [], unknown: [] };
    for (let i = 0; i < words.length; i++) {
        const w = words[i];
        if (w === 'mp' || w === 'dmz') { preset.mode = w.toUpperCase(); continue; }
        // Two- and three-word class names first ("assault rifle", "light machine gun"), so splitting on spaces never breaks one.
        const multi = [3, 2].map(n => words.slice(i, i + n)).find(span => span.length > 1 && categoryByExactAlias(span.join(' ')));
        if (multi) { preset.category = categoryByExactAlias(multi.join(' ')); i += multi.length - 1; continue; }
        // "top 5" typed with a space.
        if (w === 'top' && /^\d+$/.test(words[i + 1] || '')) { preset.badges.push(`top${words[i + 1]}`); i++; continue; }
        // Badges before classes: "ass" begins "assault", and a badge must never be read as a class.
        if (isBadgeWord(w)) { preset.badges.push(w); continue; }
        const exact = categoryByExactAlias(w);
        const near = exact ? [exact] : resolveCategorySynonyms(w);
        if (near.length === 1) { preset.category = near[0]; continue; }
        preset.unknown.push(w);
    }
    return preset;
}

// The Links field: each line a link, then optionally its preset. A line that does not start with a link is reported.
function parseLinks(text) {
    const links = [];
    const problems = [];
    for (const raw of String(text || '').split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        const m = line.match(/^(\S+?)[,\s]*(?:\s(.*))?$/);
        const url = m ? m[1].replace(/[,]+$/, '') : '';
        if (!/^https?:\/\/\S+$/i.test(url)) { problems.push(`\`${line.slice(0, 60)}\` is not a link`); continue; }
        links.push({ url, preset: (m[2] || '').trim() ? parsePreset(m[2]) : null });
    }
    return { links, problems };
}

// The Screenshot presets field: `N. words` (the dot optional, `#N` and `N)` too). Returns a Map from the 1-based number to the parsed preset.
function parsePresetLines(text) {
    const byNumber = new Map();
    const problems = [];
    for (const raw of String(text || '').split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        const m = line.match(/^#?(\d+)\s*[.):-]?\s*(.*)$/);
        if (!m) { problems.push(`\`${line.slice(0, 60)}\` has no screenshot number`); continue; }
        byNumber.set(Number(m[1]), parsePreset(m[2]));
    }
    return { byNumber, problems };
}

// The warning a review page shows for its own preset's words nothing recognised.
function presetWarning(preset) {
    if (!preset || !preset.unknown.length) return null;
    return `**Preset words not recognised:** ${preset.unknown.map(w => `\`${w}\``).join(', ')}\n> Everything else in the preset was applied; set the rest with **Adjust**`;
}

// What the form handed in, as the batch's screenshots (uploads first, then links) with their presets, and the notes for the first page. Pure, so the whole mapping is testable without Discord.
function planStart({ files = [], linksText = '', presetsText = '' }) {
    const { links, problems: linkProblems } = parseLinks(linksText);
    const { byNumber, problems: presetProblems } = parsePresetLines(presetsText);
    const images = [
        ...files.map((f, i) => ({ url: f.url, label: `Screenshot #${i + 1}${f.name ? ` · \`${f.name}\`` : ''}`, preset: byNumber.get(i + 1) || null })),
        ...links.map((l, i) => ({ url: l.url, label: `Link #${i + 1}`, preset: l.preset })),
    ];
    const orphans = [...byNumber.keys()].filter(n => n < 1 || n > files.length);
    const notes = [
        ...linkProblems, ...presetProblems,
        ...orphans.map(n => `A preset for screenshot #${n} was skipped: ${files.length === 1 ? 'there is 1 screenshot' : `there are ${files.length} screenshots`}`),
    ];
    return { images, notes };
}

// The form's submit (handlers/autobuild.js routes `autobuild_start` here; the router's `autobuild_` lock has already checked access). A retry token re-sends exactly one image through the pipeline's retry path; otherwise every screenshot and link goes into one batch, each with its own preset. Answers privately, the slash command's default.
async function handleStartSubmit(interaction) {
    const emojis = require('./emojiMap');
    const text = (id) => { try { return interaction.fields.getTextInputValue(id) || ''; } catch { return ''; } };
    let uploaded = [];
    try { uploaded = [...(interaction.fields.getUploadedFiles('shots')?.values() || [])]; } catch { uploaded = []; }
    const files = uploaded.map(a => ({ url: a.url, name: a.name }));
    const retryToken = text('retry').trim();
    const { images, notes } = planStart({ files, linksText: text('links'), presetsText: text('presets') });
    const refuse = (msg) => interaction.reply({ content: emojis.glyphs(`${emojis.cross} ${msg}`), ephemeral: true });

    if (retryToken) {
        if (images.length !== 1) return refuse(images.length ? 'A retry re-sends one image: leave one screenshot or one link with the token.' : 'Add the screenshot or link to send again with the retry token.');
        await interaction.deferReply({ ephemeral: true });
        const { retryImageUpload } = require('./autobuildPipeline');
        return retryImageUpload(interaction, retryToken, images[0].url);
    }
    if (!images.length) return refuse(notes.length ? `Nothing to read: ${notes.join('; ')}.` : 'Add at least one screenshot or link.');

    await interaction.deferReply({ ephemeral: true });
    const { runBulk } = require('./autobuildBulk');
    return runBulk(interaction, images.map(i => i.url), { images, notes, ephemeral: true });
}

module.exports = { MODAL_ID, handleStartSubmit, MAX_IMAGES, buildStartModal, parsePreset, parseLinks, parsePresetLines, planStart, presetWarning };
