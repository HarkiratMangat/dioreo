// scripts/botGlyphs.test.js
//
// The bot-wide glyph rule (2026-10-20 12:51 EDT, Harkirat: "sweep but the change depends on the context of where its used and for what"). Discord text a user reads takes the bot's own status emoji (utils/emojiMap.js's warn / cross / checkmark), never Unicode ⚠️ ❌ ✅. This test reads the Discord-facing source and fails on any Unicode status glyph that is not in a comment, a console line, or one of the places a custom emoji cannot render (KEEP below). A new message written with ⚠️ fails here, so the rule holds as a class rather than as the 149 lines the sweep changed.
//
// KEEP: a select option's description and an autocomplete choice's name are plain-text fields, where `<a:Warn:…>` would print as raw text; router.js:~134 is a console timing flag. Matched by the text on the line, not its number, so an unrelated edit above it does not break the test.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const DIRS = ['commands', 'handlers', 'utils', 'core', 'bot'];
const KEEP = [
    ['commands/manage.js', "description: '⚠️ Wipes all draws"],
    ['handlers/router.js', "name: '⚠️ Pick a Content type first"],
    ['handlers/router.js', "⚠️ past Discord"],
];
const GLYPH = /⚠️|⚠|❌|✅/;

const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.js') && !p.endsWith('.test.js')) files.push(p); } };
DIRS.forEach(d => walk(path.join(ROOT, d)));

const found = [];
for (const f of files) {
    const rel = path.relative(ROOT, f);
    if (rel === 'utils/emojiMap.js') continue; // the helper that maps them
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        const t = line.trim();
        if (!GLYPH.test(line) || t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
        const at = line.search(GLYPH); const comment = line.indexOf('//');
        if (comment !== -1 && comment < at && !/['"`][^'"`]*\/\/[^'"`]*$/.test(line.slice(0, comment + 2))) return;
        if (/console\.(log|warn|error|info)/.test(line)) return;
        if (KEEP.some(([kf, text]) => kf === rel && line.includes(text))) return;
        found.push(`${rel}:${i + 1}  ${t.slice(0, 100)}`);
    });
}

const keepHits = KEEP.filter(([kf, text]) => fs.readFileSync(path.join(ROOT, kf), 'utf8').includes(text));
try {
    assert.deepStrictEqual(found, [], `Unicode status glyph in Discord-facing text -- use emojiMap.warn / cross / checkmark, or add it to KEEP if it sits in a field that cannot render a custom emoji:\n  ${found.join('\n  ')}`);
    assert.strictEqual(keepHits.length, KEEP.length, 'a KEEP entry no longer matches its line -- remove it rather than leave a stale exemption');
    console.log(`✓ no Unicode status glyph in ${files.length} Discord-facing files (${KEEP.length} kept where a custom emoji cannot render)`);
} catch (err) { console.log(`✗ ${err.message}`); process.exit(1); }
